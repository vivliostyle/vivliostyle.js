/**
 * Copyright 2021 Vivliostyle Foundation
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
 * @fileoverview TextPolyfill - CSS text-spacing etc. support.
 */
import * as Css from "./css";
import * as Layout from "./layout";
import * as Plugin from "./plugin";
import * as Vtree from "./vtree";
import { TextPolyfillCss } from "./assets";

type TextSpacing = {
  trimStart: boolean;
  spaceFirst: boolean;
  trimEnd: boolean;
  allowEnd: boolean;
  trimAdjacent: boolean;
  ideographAlpha: boolean;
  ideographNumeric: boolean;
};

/**
 * text-spacing: none
 * none = space-start space-end space-adjacent
 */
const TEXT_SPACING_NONE: TextSpacing = {
  trimStart: false,
  spaceFirst: false,
  trimEnd: false,
  allowEnd: false,
  trimAdjacent: false,
  ideographAlpha: false,
  ideographNumeric: false,
};

/**
 * text-spacing: normal
 * normal = space-first trim-end trim-adjacent
 */
const TEXT_SPACING_NORMAL: TextSpacing = {
  trimStart: true,
  spaceFirst: true,
  trimEnd: true,
  allowEnd: false,
  trimAdjacent: true,
  ideographAlpha: false,
  ideographNumeric: false,
};
/**
 * text-spacing: auto
 * auto = trim-start trim-end trim-adjacent ideograph-alpha ideograph-numeric
 */
const TEXT_SPACING_AUTO: TextSpacing = {
  trimStart: true,
  spaceFirst: false,
  trimEnd: true,
  allowEnd: false,
  trimAdjacent: true,
  ideographAlpha: true,
  ideographNumeric: true,
};

function textSpacingFromPropertyValue(
  value: string | number | Css.Val,
): TextSpacing {
  const cssval =
    value instanceof Css.Val
      ? value
      : typeof value === "string"
      ? Css.getName(value)
      : Css.ident.normal;

  if (cssval === Css.ident.normal) {
    return TEXT_SPACING_NORMAL;
  }
  if (cssval === Css.ident.none) {
    return TEXT_SPACING_NONE;
  }
  if (cssval === Css.ident.auto) {
    return TEXT_SPACING_AUTO;
  }
  const values = cssval instanceof Css.SpaceList ? cssval.values : [cssval];
  const textSpacing: TextSpacing = Object.create(TEXT_SPACING_NORMAL);

  for (const val of values) {
    if (val instanceof Css.Ident) {
      switch (val.name) {
        case "trim-start":
          textSpacing.trimStart = true;
          textSpacing.spaceFirst = false;
          break;
        case "space-start":
          textSpacing.trimStart = false;
          textSpacing.spaceFirst = false;
          break;
        case "space-first":
          textSpacing.trimStart = true;
          textSpacing.spaceFirst = true;
          break;
        case "trim-end":
          textSpacing.trimEnd = true;
          textSpacing.allowEnd = false;
          break;
        case "space-end":
          textSpacing.trimEnd = false;
          textSpacing.allowEnd = false;
          break;
        case "allow-end":
          textSpacing.trimEnd = true;
          textSpacing.allowEnd = true;
          break;
        case "trim-adjacent":
          textSpacing.trimAdjacent = true;
          break;
        case "space-adjacent":
          textSpacing.trimAdjacent = false;
          break;
        case "ideograph-alpha":
          textSpacing.ideographAlpha = true;
          break;
        case "ideograph-numeric":
          textSpacing.ideographNumeric = true;
          break;
      }
    }
  }

  return textSpacing;
}

function normalizeLang(lang: string): string | null {
  if (lang) {
    // Normalize CJK lang
    lang = lang.toLowerCase();
    if (/^zh\b.*-(hant|tw|hk)\b/.test(lang)) {
      return "zh-hant";
    }
    if (/^zh\b/.test(lang)) {
      return "zh-hans";
    }
    if (/^ja\b/.test(lang)) {
      return "ja";
    }
    if (/^ko\b/.test(lang)) {
      return "ko";
    }
    return lang;
  }
  return null;
}

class TextSpacingPolyfill {
  textSpacingProcessed = false;

  getPolyfilledInheritedProps() {
    return ["text-spacing"];
  }

  preprocessSingleDocument(document: Document): void {
    // Split text nodes by punctuations and ideograph/non-ideograph boundary
    const nodeIter = document.createNodeIterator(
      document.body,
      NodeFilter.SHOW_TEXT,
    );
    for (let node = nodeIter.nextNode(); node; node = nodeIter.nextNode()) {
      const textArr = node.textContent
        .replace(
          /\p{P}\p{M}*(?=\P{M})|.(?=\p{P})|(?!\p{P})[\p{sc=Han}\u3041-\u30FF\u31C0-\u31FF]\p{M}*(?=(?![\p{sc=Han}\u3041-\u30FF\u31C0-\u31FF\uFF01-\uFF60])[\p{L}\p{Nd}])|(?![\p{sc=Han}\u3041-\u30FF\u31C0-\u31FF\uFF01-\uFF60])[\p{L}\p{Nd}]\p{M}*(?=(?!\p{P})[\p{sc=Han}\u3041-\u30FF\u31C0-\u31FF])/gu,
          "$&\x00",
        )
        .split("\x00");

      if (textArr.length > 1) {
        const lastIndex = textArr.length - 1;
        for (let i = 0; i < lastIndex; i++) {
          node.parentNode.insertBefore(
            document.createTextNode(textArr[i]),
            node,
          );
        }
        node.textContent = textArr[lastIndex];
      }
    }
  }

  postLayoutBlock(
    nodeContext: Vtree.NodeContext,
    checkPoints: Vtree.NodeContext[],
    column: Layout.Column,
  ): void {
    let isFirstInParagraph = nodeContext.fragmentIndex === 1;

    for (let i = 0; i < checkPoints.length; i++) {
      const p = checkPoints[i];
      if (p.after) {
        isFirstInParagraph = false;
      } else if (
        p.inline &&
        !p.display &&
        p.parent &&
        p.viewNode.parentNode &&
        p.viewNode.nodeType === Node.TEXT_NODE &&
        p.viewNode.textContent.length > 0
      ) {
        const lang = normalizeLang(
          p.lang ??
            p.parent.lang ??
            nodeContext.lang ??
            nodeContext.parent?.lang,
        );
        const textSpacing = textSpacingFromPropertyValue(
          p.inheritedProps["text-spacing"],
        );

        let prevNode: Node = null;
        let nextNode: Node = null;

        for (let prev = i - 1; prev >= 0; prev--) {
          const prevP = checkPoints[prev];
          if (
            !prevP.display &&
            prevP.viewNode.nodeType === Node.TEXT_NODE &&
            prevP.viewNode.textContent.length > 0
          ) {
            prevNode = prevP.viewNode;
            break;
          }
          if (
            (prevP.display && prevP.display !== "inline") ||
            (prevP.viewNode instanceof Element &&
              Layout.mediaTags[prevP.viewNode.localName])
          ) {
            break;
          }
        }
        for (let next = i + 1; next < checkPoints.length; next++) {
          const nextP = checkPoints[next];
          if (
            nextP.viewNode !== p.viewNode &&
            !nextP.display &&
            nextP.viewNode.nodeType === Node.TEXT_NODE &&
            nextP.viewNode.textContent.length > 0
          ) {
            nextNode = nextP.viewNode;
            break;
          }
          if (
            (nextP.display && nextP.display !== "inline") ||
            (nextP.viewNode instanceof Element &&
              Layout.mediaTags[nextP.viewNode.localName])
          ) {
            break;
          }
        }
        this.processTextSpacing(
          p.viewNode,
          isFirstInParagraph,
          prevNode,
          nextNode,
          textSpacing,
          lang,
          p.vertical,
        );
        isFirstInParagraph = false;
      }
    }
  }

  private processTextSpacing(
    textNode: Node,
    isFirstInParagraph: boolean,
    prevNode: Node,
    nextNode: Node,
    textSpacing: TextSpacing,
    lang: string,
    vertical: boolean,
  ): void {
    const text = textNode.textContent;
    const document = textNode.ownerDocument;

    let trimPunctProcessing = false;
    let tagName: string;

    if (
      (textSpacing.trimStart || textSpacing.trimAdjacent) &&
      /^[‘“〝（［｛｟〈〈《「『【〔〖〘〚]\p{M}*$/u.test(text)
    ) {
      // fullwidth opening punctuation
      tagName = "viv-ts-open";
      trimPunctProcessing = true;
    } else if (
      (textSpacing.trimEnd || textSpacing.trimAdjacent) &&
      (/^[’”〞〟）］｝｠〉〉》」』】〕〗〙〛]\p{M}*$/u.test(text) ||
        (lang === "zh-hans" && /^[：；]\p{M}*$/u.test(text)) ||
        (lang !== "zh-hant" && /^[、。，．]\p{M}*$/u.test(text)))
    ) {
      // fullwidth closing punctuation
      tagName = "viv-ts-close";
      trimPunctProcessing = true;
    }

    if (trimPunctProcessing) {
      // Wrap the textNode as `<{tagName}><viv-ts-inner>{text}<viv-ts-inner></{tagName}>`
      const outerElem = document.createElement(tagName);
      const innerElem = document.createElement("viv-ts-inner");
      outerElem.appendChild(innerElem);
      textNode.parentNode.insertBefore(outerElem, textNode);
      innerElem.appendChild(textNode);

      // Check if the punctuation is really full width
      const fullWidthElem = document.createElement("viv-ts-inner");
      fullWidthElem.appendChild(document.createTextNode("水"));
      outerElem.appendChild(fullWidthElem);
      const isFullWidth = vertical
        ? innerElem.offsetHeight >= fullWidthElem.offsetHeight * 0.9
        : innerElem.offsetWidth >= fullWidthElem.offsetWidth * 0.9;
      outerElem.removeChild(fullWidthElem);

      if (isFullWidth) {
        if (tagName === "viv-ts-open") {
          if (
            prevNode &&
            /[\p{Ps}\p{Pi}\p{Pe}\p{Pf}\u00B7\u2027\u30FB\u3000：；、。，．]\p{M}*$/u.test(
              prevNode.textContent,
            )
          ) {
            if (textSpacing.trimAdjacent) {
              outerElem.className = "viv-ts-trim";
            }
          } else if (isFirstInParagraph) {
            outerElem.className =
              textSpacing.spaceFirst || !textSpacing.trimStart
                ? "viv-ts-first viv-ts-space"
                : "viv-ts-first";
          } else if (!textSpacing.trimStart) {
            outerElem.className = "viv-ts-space";
          }
        } else if (tagName === "viv-ts-close") {
          if (
            nextNode &&
            /^[\p{Pe}\p{Pf}\u00B7\u2027\u30FB\u3000：；、。，．]/u.test(
              nextNode.textContent,
            )
          ) {
            if (textSpacing.trimAdjacent) {
              outerElem.className = "viv-ts-trim";
            }
          } else if (!textSpacing.trimEnd) {
            outerElem.className = "viv-ts-space";
          }
        }
      } else {
        // Undo the processing
        outerElem.parentNode.insertBefore(textNode, outerElem);
        outerElem.parentNode.removeChild(outerElem);
        trimPunctProcessing = false;
      }
    } else {
      trimPunctProcessing = false;
    }

    let spaceIdeoAlnumProcessing = false;

    function checkUpright(elem: Element): boolean {
      if (!elem || !(elem instanceof HTMLElement)) {
        return false;
      }
      if (elem.style.textOrientation === "upright") {
        return true;
      }
      if (elem.style.textCombineUpright === "all") {
        return true;
      }
      return checkUpright(elem.parentElement);
    }

    if (textSpacing.ideographAlpha || textSpacing.ideographNumeric) {
      if (
        prevNode &&
        /^(?!\p{P})[\p{sc=Han}\u3041-\u30FF\u31C0-\u31FF]/u.test(text) &&
        ((textSpacing.ideographAlpha &&
          /(?![\p{sc=Han}\u3041-\u30FF\u31C0-\u31FF\uFF01-\uFF60])\p{L}\p{M}*$/u.test(
            prevNode.textContent,
          )) ||
          (textSpacing.ideographNumeric &&
            /(?![\uFF01-\uFF60])\p{Nd}\p{M}*$/u.test(prevNode.textContent))) &&
        !(vertical && checkUpright(prevNode.parentElement))
      ) {
        textNode.parentNode.insertBefore(
          document.createElement("viv-ts-thin-sp"),
          textNode,
        );
        spaceIdeoAlnumProcessing = true;
      }
      if (
        nextNode &&
        /(?!\p{P})[\p{sc=Han}\u3041-\u30FF\u31C0-\u31FF]\p{M}*$/u.test(text) &&
        ((textSpacing.ideographAlpha &&
          /^(?![\p{sc=Han}\u3041-\u30FF\u31C0-\u31FF\uFF01-\uFF60])\p{L}/u.test(
            nextNode.textContent,
          )) ||
          (textSpacing.ideographNumeric &&
            /^(?![\uFF01-\uFF60])\p{Nd}/u.test(nextNode.textContent))) &&
        !(vertical && checkUpright(nextNode.parentElement))
      ) {
        textNode.parentNode.insertBefore(
          document.createElement("viv-ts-thin-sp"),
          textNode.nextSibling,
        );
        spaceIdeoAlnumProcessing = true;
      }
    }

    if (trimPunctProcessing || spaceIdeoAlnumProcessing) {
      if (!this.textSpacingProcessed) {
        this.initTextPolyfillCss(document.head);
        this.textSpacingProcessed = true;
      }
    }
  }

  private initTextPolyfillCss(head: Element): void {
    const style = head.ownerDocument.createElement("style");
    style.textContent = TextPolyfillCss;
    head.appendChild(style);
  }

  registerHooks() {
    Plugin.registerHook(
      Plugin.HOOKS.POLYFILLED_INHERITED_PROPS,
      this.getPolyfilledInheritedProps.bind(this),
    );
    Plugin.registerHook(
      Plugin.HOOKS.PREPROCESS_SINGLE_DOCUMENT,
      this.preprocessSingleDocument.bind(this),
    );
    Plugin.registerHook(
      Plugin.HOOKS.POST_LAYOUT_BLOCK,
      this.postLayoutBlock.bind(this),
    );
  }
}

const textPolyfill = new TextSpacingPolyfill();
textPolyfill.registerHooks();
