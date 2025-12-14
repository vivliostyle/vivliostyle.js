/**
 * Copyright 2019 Vivliostyle Foundation
 *
 * Vivliostyle.js is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle.js is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle.js.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @fileoverview PseudoElement - CSS pseudo elements.
 */
import * as Base from "./base";
import * as Css from "./css";
import * as CssCascade from "./css-cascade";
import * as CssStyler from "./css-styler";
import * as Exprs from "./exprs";
import * as TextPolyfill from "./text-polyfill";
import * as Vtree from "./vtree";
import { PseudoElement } from "./types";

export const document = new DOMParser().parseFromString(
  `<root xmlns="${Base.NS.SHADOW}"/>`,
  "text/xml",
);

/**
 * Pseudoelement names in the order they should be inserted in the shadow DOM,
 * empty string is the place where the element's DOM children are processed.
 */
export const pseudoNames = [
  "footnote-marker",
  "marker",
  "first-5-lines",
  "first-4-lines",
  "first-3-lines",
  "first-2-lines",
  "first-line",
  "first-letter",
  "before",
  "",
  /* content */
  "after",
];

export const PSEUDO_ATTR = "data-adapt-pseudo";

export function getPseudoName(element: Element): string {
  return element.getAttribute(PSEUDO_ATTR) || "";
}

export function setPseudoName(element: Element, name: string): void {
  element.setAttribute(PSEUDO_ATTR, name);
}

export class PseudoelementStyler implements PseudoElement.PseudoelementStyler {
  contentProcessed: { [key: string]: boolean } = {};

  // after content: update style

  constructor(
    public readonly element: Element,
    public style: CssCascade.ElementStyle,
    public styler: CssStyler.AbstractStyler,
    public readonly context: Exprs.Context,
    public readonly exprContentListener: Vtree.ExprContentListener,
  ) {}

  /** @override */
  getStyle(element: Element, deep: boolean): CssCascade.ElementStyle {
    const pseudoName = getPseudoName(element);
    if (this.styler && pseudoName && pseudoName.match(/after$/)) {
      this.style = this.styler.getStyle(this.element, true);
      this.styler = null;
    }
    const pseudoMap = CssCascade.getStyleMap(this.style, "_pseudos");
    const style = pseudoMap?.[pseudoName] || ({} as CssCascade.ElementStyle);
    if (pseudoName.match(/^first-/) && !style["x-first-pseudo"]) {
      let nest = 1;
      let r: RegExpMatchArray;
      if (pseudoName == "first-letter") {
        nest = 0;
      } else if ((r = pseudoName.match(/^first-([0-9]+)-lines$/)) != null) {
        nest = (r[1] as any) - 0;
      }
      style["x-first-pseudo"] = new CssCascade.CascadeValue(
        new Css.Int(nest),
        0,
      );
    }
    return style;
  }

  /** @override */
  processContent(
    element: Element,
    styles: { [key: string]: Css.Val },
    nodeContext: Vtree.NodeContext,
  ) {
    const pseudoName = getPseudoName(element);
    if (!this.contentProcessed[pseudoName]) {
      this.contentProcessed[pseudoName] = true;
      if (pseudoName === "marker") {
        this.processMarker(element, styles, nodeContext);
      }
      const contentVal = styles["content"];
      if (Vtree.nonTrivialContent(contentVal)) {
        contentVal.visit(
          new Vtree.ContentPropertyHandler(
            (element.classList.contains("_viv-marker-outside") &&
              element.firstElementChild) ||
              element,
            this.context,
            contentVal,
            this.exprContentListener,
          ),
        );
        // text-spacing & hanging-punctuation support
        TextPolyfill.preprocessForTextSpacing(element);
      }
    }
  }

  /**
   * ::marker support
   */
  private processMarker(
    element: Element,
    styles: { [key: string]: Css.Val },
    nodeContext: Vtree.NodeContext,
  ): void {
    const content = styles["content"];
    const listStylePosition = styles["list-style-position"];
    const listStyleType = styles["list-style-type"];

    if (Vtree.nonTrivialContent(content)) {
      if (content instanceof Css.URL) {
        // content: <URL>
        //
        // Wrap URL in a SpaceList to ensure that img element is generated as
        // a child of the marker pseudo-element.
        styles["content"] = new Css.SpaceList([content]);
      } else if (content instanceof Css.Str) {
        // content: <string>
        //
        // The content string may have been made from list-style-type in
        // `CascadeInstance.processMarkerPseudoelementProps()` in css-cascade.ts.
        if (listStyleType instanceof Css.Ident) {
          const lowerName = listStyleType.name.toLowerCase();
          if (
            lowerName === "disc" ||
            lowerName === "circle" ||
            lowerName === "square" ||
            lowerName === "disclosure-open" ||
            lowerName === "disclosure-closed"
          ) {
            // Use special font for bullet symbols.
            element.classList.add("_viv-marker-bullet");
            if (
              lowerName === "disclosure-open" ||
              lowerName === "disclosure-closed"
            ) {
              const rtl = nodeContext.direction === "rtl";
              const vertical = nodeContext.vertical;
              // Change disclosure triangles for rtl or vertical text.
              styles["content"] = new Css.Str(
                lowerName === "disclosure-open"
                  ? vertical
                    ? "◂ "
                    : "▾ "
                  : vertical
                    ? rtl
                      ? "▴ "
                      : "▾ "
                    : rtl
                      ? "◂ "
                      : "▸ ",
              );
            }
          }
        }
      }
    }

    if (listStylePosition === Css.ident.outside) {
      // Use special styling to simulate outside markers.
      element.classList.add("_viv-marker-outside");
      // Create a span to hold the marker content.
      element.appendChild(element.ownerDocument.createElement("span"));

      // Prevent text-spacing-trim and hanging-punctuation from trimming or
      // hanging the suffix "、" of counter styles such as "cjk-decimal".
      const textSpacingTrim = nodeContext.inheritedProps["text-spacing-trim"];
      if (textSpacingTrim && textSpacingTrim !== "space-all") {
        styles["text-spacing-trim"] = Css.ident.normal;
      }
      const hangingPunctuation =
        nodeContext.inheritedProps["hanging-punctuation"];
      if (hangingPunctuation) {
        styles["hanging-punctuation"] = Css.ident.none;
      }
    }

    // These are used only temporarily to generate content from list-style-*,
    // so remove them after processing.
    delete styles["list-style-position"];
    delete styles["list-style-type"];
  }
}
