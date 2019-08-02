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
 * @fileoverview PseudoElement
 */
import * as Base from "../adapt/base";
import * as Css from "../adapt/css";
import * as CssCasc from "../adapt/csscasc";
import * as CssStyler from "../adapt/cssstyler";
import * as Exprs from "../adapt/expr";
import * as Vtree from "../adapt/vtree";
import { PseudoElement } from "../vivliostyle/types";

export const document = new DOMParser().parseFromString(
  `<root xmlns="${Base.NS.SHADOW}"/>`,
  "text/xml"
);

/**
 * Pseudoelement names in the order they should be inserted in the shadow DOM,
 * empty string is the place where the element's DOM children are processed.
 */
export const pseudoNames = [
  "footnote-marker",
  "first-5-lines",
  "first-4-lines",
  "first-3-lines",
  "first-2-lines",
  "first-line",
  "first-letter",
  "before",
  "",
  /* content */
  "after"
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
    public style: CssCasc.ElementStyle,
    public styler: CssStyler.AbstractStyler,
    public readonly context: Exprs.Context,
    public readonly exprContentListener: Vtree.ExprContentListener
  ) {}

  /**
   * @override
   */
  getStyle(element: Element, deep: boolean): CssCasc.ElementStyle {
    const pseudoName = getPseudoName(element);
    if (this.styler && pseudoName && pseudoName.match(/after$/)) {
      this.style = this.styler.getStyle(this.element, true);
      this.styler = null;
    }
    const pseudoMap = CssCasc.getStyleMap(this.style, "_pseudos");
    const style = pseudoMap[pseudoName] || ({} as CssCasc.ElementStyle);
    if (pseudoName.match(/^first-/) && !style["x-first-pseudo"]) {
      let nest = 1;
      let r;
      if (pseudoName == "first-letter") {
        nest = 0;
      } else if ((r = pseudoName.match(/^first-([0-9]+)-lines$/)) != null) {
        nest = r[1] - 0;
      }
      style["x-first-pseudo"] = new CssCasc.CascadeValue(new Css.Int(nest), 0);
    }
    return style;
  }

  /**
   * @override
   */
  processContent(element: Element, styles: { [key: string]: Css.Val }) {
    const pseudoName = getPseudoName(element);
    if (!this.contentProcessed[pseudoName]) {
      this.contentProcessed[pseudoName] = true;
      const contentVal = styles["content"];
      if (contentVal) {
        if (Vtree.nonTrivialContent(contentVal)) {
          contentVal.visit(
            new Vtree.ContentPropertyHandler(
              element,
              this.context,
              contentVal,
              this.exprContentListener
            )
          );
        }
      }
    }
  }
}
