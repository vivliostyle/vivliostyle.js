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
 * @fileoverview TextPolyfill - CSS text-spacing and hanging-punctuation support.
 */
import * as Base from "./base";
import * as Css from "./css";
import * as Layout from "./layout";
import * as Plugin from "./plugin";
import * as Vtree from "./vtree";
import { TextPolyfillCss } from "./assets";

type PropertyValue = string | number | Css.Val;

type HangingPunctuation = {
  first: boolean;
  end: boolean;
  allowEnd: boolean;
  last: boolean;
};

const HANGING_PUNCTUATION_NONE: HangingPunctuation = {
  first: false,
  end: false,
  allowEnd: false,
  last: false,
};

function hangingPunctuationFromPropertyValue(
  value: PropertyValue,
): HangingPunctuation {
  const cssval =
    value instanceof Css.Val
      ? value
      : typeof value === "string"
      ? Css.getName(value)
      : Css.ident.none;

  if (cssval === Css.ident.none) {
    return HANGING_PUNCTUATION_NONE;
  }
  const values = cssval instanceof Css.SpaceList ? cssval.values : [cssval];
  const hangingPunctuation: HangingPunctuation = Object.create(
    HANGING_PUNCTUATION_NONE,
  );

  for (const val of values) {
    if (val instanceof Css.Ident) {
      switch (val.name) {
        case "first":
          hangingPunctuation.first = true;
          break;
        case "force-end":
          hangingPunctuation.end = true;
          break;
        case "allow-end":
          hangingPunctuation.end = true;
          hangingPunctuation.allowEnd = true;
          break;
        case "last":
          hangingPunctuation.last = true;
          break;
      }
    }
  }
  return hangingPunctuation;
}

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
 * normal = space-first allow-end trim-adjacent
 */
const TEXT_SPACING_NORMAL: TextSpacing = {
  trimStart: true,
  spaceFirst: true,
  trimEnd: true,
  allowEnd: true,
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

function textSpacingFromPropertyValue(value: PropertyValue): TextSpacing {
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
    return ["hanging-punctuation", "text-spacing"];
  }

  preprocessSingleDocument(document: Document): void {
    if (!document.body) {
      return;
    }
    this.preprocessTextContent(document.body);
  }

  preprocessTextContent(element: Element): void {
    // Split text nodes by punctuations and ideograph/non-ideograph boundary
    const nodeIter = element.ownerDocument.createNodeIterator(
      element,
      NodeFilter.SHOW_TEXT,
    );
    for (let node = nodeIter.nextNode(); node; node = nodeIter.nextNode()) {
      if (
        node.parentElement.namespaceURI !== Base.NS.XHTML ||
        node.parentElement.dataset?.["mathTypeset"] === "true"
      ) {
        continue;
      }
      const textArr = node.textContent
        .replace(
          /[\p{Ps}\p{Pe}\p{Pf}\p{Pi}'"、。，．：；､｡]\p{M}*(?=\P{M})|.(?=[\p{Ps}\p{Pe}\p{Pf}\p{Pi}'"、。，．：；､｡])|(?!\p{P})[\p{sc=Han}\u3041-\u30FF\u31C0-\u31FF]\p{M}*(?=(?![\p{sc=Han}\u3041-\u30FF\u31C0-\u31FF\uFF01-\uFF60])[\p{L}\p{Nd}])|(?![\p{sc=Han}\u3041-\u30FF\u31C0-\u31FF\uFF01-\uFF60])[\p{L}\p{Nd}]\p{M}*(?=(?!\p{P})[\p{sc=Han}\u3041-\u30FF\u31C0-\u31FF])/gsu,
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

  processGeneratedContent(
    elem: HTMLElement,
    textSpacingVal: Css.Val,
    hangingPunctuationVal: Css.Val,
    lang: string,
    vertical: boolean,
  ): void {
    if (
      textSpacingVal === Css.ident.none &&
      (!hangingPunctuationVal || hangingPunctuationVal === Css.ident.none)
    ) {
      return;
    }

    this.preprocessTextContent(elem);

    const textSpacing = textSpacingFromPropertyValue(textSpacingVal);
    const hangingPunctuation = hangingPunctuationFromPropertyValue(
      hangingPunctuationVal,
    );

    const whiteSpaceSave = elem.style.whiteSpace;
    if ((vertical ? elem.offsetHeight : elem.offsetWidth) === 0) {
      // Prevent wrong line wrapping
      elem.style.whiteSpace = "pre";
    }

    const nodeIter = elem.ownerDocument.createNodeIterator(
      elem,
      NodeFilter.SHOW_TEXT,
    );
    let prevNode: Node = null;
    let nextNode: Node = null;
    for (let node = nodeIter.nextNode(); node; node = nextNode) {
      nextNode = nodeIter.nextNode();
      const isFirstInBlock = !prevNode;
      const isFirstAfterForcedLineBreak =
        !prevNode || /\n$/.test(prevNode.textContent);
      const isLastBeforeForcedLineBreak =
        !nextNode || /^\n/.test(nextNode.textContent);
      const isLastInBlock = !nextNode;
      this.processTextSpacing(
        node,
        isFirstInBlock,
        isFirstAfterForcedLineBreak,
        isLastBeforeForcedLineBreak,
        isLastInBlock,
        prevNode,
        nextNode,
        textSpacing,
        hangingPunctuation,
        lang,
        vertical,
      );
      prevNode = node;
    }

    elem.style.whiteSpace = whiteSpaceSave;
  }

  postLayoutBlock(
    nodeContext: Vtree.NodeContext,
    checkPoints: Vtree.NodeContext[],
    column: Layout.Column,
  ): void {
    const isFirstFragment = !nodeContext || nodeContext.fragmentIndex === 1;
    for (let i = 0; i < checkPoints.length; i++) {
      const p = checkPoints[i];
      if (
        !p.after &&
        p.inline &&
        !p.display &&
        p.parent &&
        p.viewNode.parentNode &&
        p.viewNode.nodeType === Node.TEXT_NODE &&
        p.viewNode.textContent.trimStart().length > 0
      ) {
        const lang = normalizeLang(
          p.lang ??
            p.parent.lang ??
            nodeContext?.lang ??
            nodeContext?.parent?.lang,
        );
        const textSpacing = textSpacingFromPropertyValue(
          p.inheritedProps["text-spacing"],
        );
        const hangingPunctuation = hangingPunctuationFromPropertyValue(
          p.inheritedProps["hanging-punctuation"],
        );

        let prevNode: Node = null;
        let nextNode: Node = null;
        let isFirstInBlock = i === 0 && isFirstFragment;
        let isFirstAfterForcedLineBreak = false;
        let isLastBeforeForcedLineBreak = false;
        let isLastInBlock = false;

        function checkIfFirstAfterForcedLineBreak(
          prevP: Vtree.NodeContext,
        ): boolean {
          if (prevP.viewNode instanceof Element) {
            return prevP.viewNode.localName === "br";
          }
          if (prevP.viewNode instanceof Text) {
            if (prevP.whitespace === Vtree.Whitespace.PRESERVE) {
              if (/\n$/.test(prevP.viewNode.textContent)) {
                return true;
              }
            } else if (prevP.whitespace === Vtree.Whitespace.NEWLINE) {
              if (/\n\s*$/.test(prevP.viewNode.textContent)) {
                return true;
              }
            }
            if (prevP.viewNode.previousElementSibling?.localName === "br") {
              return Vtree.canIgnore(prevP.viewNode, prevP.whitespace);
            }
          }
          return false;
        }

        function checkIfLastBeforeForcedLineBreak(
          nextP: Vtree.NodeContext,
        ): boolean {
          if (nextP.viewNode instanceof Element) {
            return nextP.viewNode.localName === "br";
          }
          if (nextP.viewNode instanceof Text) {
            if (nextP.whitespace === Vtree.Whitespace.PRESERVE) {
              if (/^\n/.test(nextP.viewNode.textContent)) {
                return true;
              }
            } else if (nextP.whitespace === Vtree.Whitespace.NEWLINE) {
              if (/^\s*\n/.test(nextP.viewNode.textContent)) {
                return true;
              }
            }
            if (nextP.viewNode.nextElementSibling?.localName === "br") {
              return Vtree.canIgnore(nextP.viewNode, nextP.whitespace);
            }
          }
          return false;
        }

        for (let prev = i - 1; prev >= 0; prev--) {
          const prevP = checkPoints[prev];
          if (checkIfFirstAfterForcedLineBreak(prevP)) {
            isFirstAfterForcedLineBreak = true;
            break;
          }
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
              (prevP.viewNode.localName === "br" ||
                Layout.mediaTags[prevP.viewNode.localName]))
          ) {
            break;
          }
          if (prev === 0 && isFirstFragment) {
            isFirstInBlock = true;
            isFirstAfterForcedLineBreak = true;
          }
        }
        for (let next = i + 1; next < checkPoints.length; next++) {
          const nextP = checkPoints[next];
          if (checkIfLastBeforeForcedLineBreak(nextP)) {
            isLastBeforeForcedLineBreak = true;
            break;
          }
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
              (nextP.viewNode.localName === "br" ||
                Layout.mediaTags[nextP.viewNode.localName]))
          ) {
            break;
          }
          if (next === checkPoints.length - 1) {
            isLastInBlock = true;
            isLastBeforeForcedLineBreak = true;
          }
        }
        this.processTextSpacing(
          p.viewNode,
          isFirstInBlock,
          isFirstAfterForcedLineBreak,
          isLastBeforeForcedLineBreak,
          isLastInBlock,
          prevNode,
          nextNode,
          textSpacing,
          hangingPunctuation,
          lang,
          p.vertical,
        );
      }
    }
  }

  private processTextSpacing(
    textNode: Node,
    isFirstInBlock: boolean,
    isFirstAfterForcedLineBreak: boolean,
    isLastBeforeForcedLineBreak: boolean,
    isLastInBlock: boolean,
    prevNode: Node,
    nextNode: Node,
    textSpacing: TextSpacing,
    hangingPunctuation: HangingPunctuation,
    lang: string,
    vertical: boolean,
  ): void {
    const text = textNode.textContent;
    const document = textNode.ownerDocument;
    const range = document.createRange();
    range.selectNode(textNode);

    function isAtStartOfLine(): boolean {
      if (!prevNode) {
        return false;
      }
      const rect = range.getClientRects()[0];
      const prevRange = document.createRange();
      prevRange.selectNode(prevNode);
      const prevRects = prevRange.getClientRects();
      const prevRect = prevRects[prevRects.length - 1];
      if (!rect || !prevRect) {
        return false;
      }
      return vertical
        ? rect.top < prevRect.top + prevRect.height - rect.width ||
            rect.left + rect.width < prevRect.left + 1 ||
            rect.left > prevRect.left + prevRect.width - 1
        : rect.left < prevRect.left + prevRect.width - rect.height ||
            rect.top > prevRect.top + prevRect.height - 1 ||
            rect.top + rect.height < prevRect.top + 1;
    }

    function isAtEndOfLine(): boolean {
      if (!nextNode) {
        return false;
      }
      const rect = range.getClientRects()[0];
      const nextRange = document.createRange();
      nextRange.selectNode(nextNode);
      const nextRect = nextRange.getClientRects()[0];
      if (!rect || !nextRect) {
        return false;
      }
      return vertical
        ? rect.top + rect.height > nextRect.top + rect.width ||
            rect.left > nextRect.left + nextRect.width - 1 ||
            rect.left + rect.width < nextRect.left + 1
        : rect.left + rect.width > nextRect.left + rect.height ||
            rect.top + rect.height < nextRect.top + 1 ||
            rect.top > nextRect.top + nextRect.height - 1;
    }

    let punctProcessing = false;
    let hangingFirst = false;
    let hangingLast = false;
    let hangingEnd = false;
    let tagName: "viv-ts-open" | "viv-ts-close";

    if (
      isFirstInBlock &&
      hangingPunctuation.first &&
      /^[\p{Ps}\p{Pf}\p{Pi}'"]\p{M}*$/u.test(text)
    ) {
      // hanging-punctuation: first
      tagName = "viv-ts-open";
      punctProcessing = true;
      hangingFirst = true;
    } else if (
      isLastInBlock &&
      hangingPunctuation.last &&
      /^[\p{Pe}\p{Pf}\p{Pi}'"]\p{M}*$/u.test(text)
    ) {
      // hanging-punctuation: last
      tagName = "viv-ts-close";
      punctProcessing = true;
      hangingLast = true;
    } else if (hangingPunctuation.end && /^[、。，．､｡]\p{M}*$/u.test(text)) {
      // hanging-punctuation: force-end | allow-end
      tagName = "viv-ts-close";
      punctProcessing = true;
      hangingEnd = true;
    } else if (
      (textSpacing.trimStart || textSpacing.trimAdjacent) &&
      /^[‘“〝（［｛｟〈〈《「『【〔〖〘〚]\p{M}*$/u.test(text)
    ) {
      // fullwidth opening punctuation
      tagName = "viv-ts-open";
      punctProcessing = true;
    } else if (
      (textSpacing.trimEnd || textSpacing.trimAdjacent) &&
      (/^[’”〞〟）］｝｠〉〉》」』】〕〗〙〛]\p{M}*$/u.test(text) ||
        (lang === "zh-hans" && /^[：；]\p{M}*$/u.test(text)) ||
        (lang !== "zh-hant" && /^[、。，．]\p{M}*$/u.test(text)))
    ) {
      // fullwidth closing punctuation
      tagName = "viv-ts-close";
      punctProcessing = true;
    }

    if (punctProcessing) {
      // Wrap the textNode as `<{tagName}><viv-ts-inner>{text}<viv-ts-inner></{tagName}>`
      const outerElem = document.createElement(tagName);
      const innerElem = document.createElement("viv-ts-inner");
      outerElem.appendChild(innerElem);
      textNode.parentNode.insertBefore(outerElem, textNode);
      innerElem.appendChild(textNode);

      // Check if the punctuation is full width wide
      const textWidth = vertical
        ? innerElem.offsetHeight
        : innerElem.offsetWidth;
      textNode.textContent = "水";
      const fullWidth = vertical
        ? innerElem.offsetHeight
        : innerElem.offsetWidth;
      const isFullWidth = textWidth >= fullWidth * 0.9; // almost full width
      textNode.textContent = text;

      if (isFullWidth || hangingFirst || hangingLast || hangingEnd) {
        if (tagName === "viv-ts-open") {
          if (hangingFirst) {
            outerElem.className = "viv-hang-first";
          } else if (
            prevNode &&
            /[\p{Ps}\p{Pi}\p{Pe}\p{Pf}\u00B7\u2027\u30FB\u3000：；、。，．]\p{M}*$/u.test(
              prevNode.textContent,
            )
          ) {
            if (isAtStartOfLine()) {
              if (textSpacing.trimStart) {
                outerElem.className = "viv-trim-start";
              }
            } else if (textSpacing.trimAdjacent) {
              outerElem.className = "viv-trim-adj";
            }
          } else if (isFirstInBlock || isFirstAfterForcedLineBreak) {
            if (!textSpacing.spaceFirst && textSpacing.trimStart) {
              outerElem.className = "viv-trim-start";
            }
          } else if (textSpacing.trimStart && isAtStartOfLine()) {
            outerElem.className = "viv-trim-start";
          }
        } else if (tagName === "viv-ts-close") {
          if (hangingLast) {
            outerElem.className = "viv-hang-last";
          } else if (isLastInBlock || isLastBeforeForcedLineBreak) {
            if (hangingEnd || textSpacing.trimEnd) {
              const rect1 = range.getClientRects()[0];
              const allowEnd = hangingEnd
                ? hangingPunctuation.allowEnd
                : textSpacing.allowEnd;
              if (hangingEnd) {
                outerElem.className = "viv-hang-end";
              } else {
                outerElem.className = "viv-trim-end";
              }
              const rect2 = range.getClientRects()[0];
              if (
                (allowEnd &&
                  (vertical
                    ? rect1?.left === rect2?.left
                    : rect1?.top === rect2?.top)) ||
                isAtStartOfLine()
              ) {
                // Cancel hang/trim if punctuation is not moved or moved to the next line
                outerElem.className = "";
              }
            }
          } else if (isAtEndOfLine()) {
            if (hangingEnd && !hangingPunctuation.allowEnd) {
              outerElem.className = "viv-hang-end";
            } else if (
              isFullWidth &&
              textSpacing.trimEnd &&
              !textSpacing.allowEnd
            ) {
              outerElem.className = "viv-trim-end";
            }
          } else if (
            nextNode &&
            /^[\p{Pe}\p{Pf}\u00B7\u2027\u30FB\u3000：；、。，．]/u.test(
              nextNode.textContent,
            )
          ) {
            if (isFullWidth && textSpacing.trimAdjacent) {
              outerElem.className = "viv-trim-adj";
            }
          } else if (hangingEnd) {
            outerElem.className = "viv-hang-end";
            if (isAtEndOfLine()) {
              if (hangingPunctuation.allowEnd && textSpacing.trimEnd) {
                outerElem.className = "viv-trim-end";
                if (!isAtEndOfLine()) {
                  outerElem.className = "viv-hang-end";
                }
              }
            } else {
              outerElem.className = "";
            }
          } else if (textSpacing.trimEnd) {
            outerElem.className = "viv-trim-end";
            if (!isAtEndOfLine()) {
              outerElem.className = "";
            }
          }
        }
      }
      if (!outerElem.className) {
        // Undo the processing
        outerElem.parentNode.insertBefore(textNode, outerElem);
        outerElem.parentNode.removeChild(outerElem);
        punctProcessing = false;
      }
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
        !(vertical && checkUpright(prevNode.parentElement)) &&
        !isAtStartOfLine()
      ) {
        textNode.parentNode.insertBefore(
          document.createElement("viv-ts-thin-sp"),
          textNode,
        );
        spaceIdeoAlnumProcessing = true;
      } else if (
        nextNode &&
        /(?!\p{P})[\p{sc=Han}\u3041-\u30FF\u31C0-\u31FF]\p{M}*$/u.test(text) &&
        ((textSpacing.ideographAlpha &&
          /^(?![\p{sc=Han}\u3041-\u30FF\u31C0-\u31FF\uFF01-\uFF60])\p{L}/u.test(
            nextNode.textContent,
          )) ||
          (textSpacing.ideographNumeric &&
            /^(?![\uFF01-\uFF60])\p{Nd}/u.test(nextNode.textContent))) &&
        !(vertical && checkUpright(nextNode.parentElement)) &&
        !isAtEndOfLine()
      ) {
        textNode.parentNode.insertBefore(
          document.createElement("viv-ts-thin-sp"),
          textNode.nextSibling,
        );
        spaceIdeoAlnumProcessing = true;
      }
    }

    if (punctProcessing || spaceIdeoAlnumProcessing) {
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

export function preprocessTextContent(element: Element): void {
  textPolyfill.preprocessTextContent(element);
}

export function processGeneratedContent(
  element: HTMLElement,
  textSpacing: Css.Val,
  hangingPunctuation: Css.Val,
  lang: string,
  vertical: boolean,
): void {
  textPolyfill.processGeneratedContent(
    element,
    textSpacing,
    hangingPunctuation,
    lang,
    vertical,
  );
}
