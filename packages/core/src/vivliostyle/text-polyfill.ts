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
import * as Plugin from "./plugin";
import * as Vtree from "./vtree";
import { TextPolyfillCss } from "./assets";

type PropertyValue = string | number | Css.Val;

type HangingPunctuation = {
  first: boolean;
  end: boolean; // force-end or allow-end
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

function isHangingPunctuationNone(
  hangingPunctuation: HangingPunctuation,
): boolean {
  return (
    !hangingPunctuation.first &&
    !hangingPunctuation.last &&
    !hangingPunctuation.end
  );
}

type TextSpacing = {
  trimStart: boolean; // trim-start or space-first (not space-start)
  spaceFirst: boolean; // space-first (trim-start except at first line)
  trimEnd: boolean; // trim-end or allow-end (not space-end)
  allowEnd: boolean; // allow-end (not force-end)
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

function isTextSpacingNone(textSpacing: TextSpacing): boolean {
  return (
    !textSpacing.trimStart &&
    !textSpacing.trimEnd &&
    !textSpacing.trimAdjacent &&
    !textSpacing.ideographAlpha &&
    !textSpacing.ideographNumeric
  );
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

const embeddedContentTags = {
  audio: true,
  canvas: true,
  embed: true,
  iframe: true,
  img: true,
  math: true,
  object: true,
  picture: true,
  svg: true,
  video: true,
};

class TextSpacingPolyfill {
  isTextPolyfillCssReady = false;

  getPolyfilledInheritedProps() {
    return ["hanging-punctuation", "text-spacing"];
  }

  preprocessSingleDocument(document: Document): void {
    if (!document.body) {
      return;
    }
    this.preprocessForTextSpacing(document.body);

    this.isTextPolyfillCssReady = !!document.getElementById(
      "vivliostyle-text-polyfill-css",
    );
  }

  preprocessForTextSpacing(element: Element): void {
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
          /(?![()\[\]{}])[\p{Ps}\p{Pe}\p{Pf}\p{Pi}、。，．：；､｡]\p{M}*(?=\P{M})|.(?=(?![()\[\]{}])[\p{Ps}\p{Pe}\p{Pf}\p{Pi}、。，．：；､｡])|(?!\p{P})[\p{sc=Han}\u3041-\u30FF\u31C0-\u31FF]\p{M}*(?=(?![\p{sc=Han}\u3041-\u30FF\u31C0-\u31FF\uFF01-\uFF60])[\p{L}\p{Nd}])|(?![\p{sc=Han}\u3041-\u30FF\u31C0-\u31FF\uFF01-\uFF60])[\p{L}\p{Nd}]\p{M}*(?=(?!\p{P})[\p{sc=Han}\u3041-\u30FF\u31C0-\u31FF])/gsu,
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
    element: HTMLElement,
    textSpacingVal: Css.Val,
    hangingPunctuationVal: Css.Val,
    lang: string,
    vertical: boolean,
  ): void {
    lang = normalizeLang(lang);
    const textSpacing = textSpacingFromPropertyValue(textSpacingVal);
    const hangingPunctuation = hangingPunctuationFromPropertyValue(
      hangingPunctuationVal,
    );

    if (
      isHangingPunctuationNone(hangingPunctuation) &&
      isTextSpacingNone(textSpacing)
    ) {
      return;
    }

    this.preprocessForTextSpacing(element);

    const whiteSpaceSave = element.style.whiteSpace;
    if ((vertical ? element.offsetHeight : element.offsetWidth) === 0) {
      // Prevent wrong line wrapping
      element.style.whiteSpace = "pre";
    }

    const nodeIter = element.ownerDocument.createNodeIterator(
      element,
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

    element.style.whiteSpace = whiteSpaceSave;
  }

  postLayoutBlock(
    nodeContext: Vtree.NodeContext,
    checkPoints: Vtree.NodeContext[],
  ): void {
    const isFirstFragment = !nodeContext || nodeContext.fragmentIndex === 1;
    const isAfterForcedLineBreak =
      isFirstFragment || checkIfAfterForcedLineBreak();

    function checkIfAfterForcedLineBreak(): boolean {
      let p = checkPoints[0];
      let prevNode: Node;
      while (p && p.inline) {
        prevNode = p.sourceNode?.previousSibling;
        if (prevNode) {
          if (
            prevNode instanceof Text &&
            /^\s*$/.test(prevNode.textContent) &&
            p.whitespace !== Vtree.Whitespace.PRESERVE
          ) {
            prevNode = prevNode.previousSibling;
          }
          if (prevNode) {
            break;
          }
        }
        p = p.parent;
      }

      while (prevNode) {
        if (prevNode instanceof Element) {
          if (prevNode.localName === "br") {
            return true;
          }
        } else if (prevNode instanceof Text) {
          if (p.whitespace === Vtree.Whitespace.PRESERVE) {
            if (/\n$/.test(prevNode.textContent)) {
              return true;
            }
          } else if (p.whitespace === Vtree.Whitespace.NEWLINE) {
            if (/\n\s*$/.test(prevNode.textContent)) {
              return true;
            }
          }
        }
        prevNode = prevNode.lastChild;
      }
      return false;
    }

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

        if (
          isHangingPunctuationNone(hangingPunctuation) &&
          isTextSpacingNone(textSpacing)
        ) {
          continue;
        }

        let prevNode: Node = null;
        let nextNode: Node = null;
        let isFirstInBlock = i === 0 && isFirstFragment;
        let isFirstAfterForcedLineBreak = i === 0 && isAfterForcedLineBreak;
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
                embeddedContentTags[prevP.viewNode.localName]))
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
                embeddedContentTags[nextP.viewNode.localName]))
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
    let currRange: Range;
    let prevRange: Range;
    let nextRange: Range;

    function isAtStartOfLine(): boolean {
      if (!prevNode) {
        return false;
      }
      if (!currRange) {
        currRange = document.createRange();
        currRange.selectNode(textNode);
      }
      const rect = currRange.getClientRects()[0];
      if (!prevRange) {
        prevRange = document.createRange();
        prevRange.selectNode(prevNode);
      }
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
      if (!currRange) {
        currRange = document.createRange();
        currRange.selectNode(textNode);
      }
      const rect = currRange.getClientRects()[0];
      if (!nextRange) {
        nextRange = document.createRange();
        nextRange.selectNode(nextNode);
      }
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
      if (!this.isTextPolyfillCssReady) {
        this.initTextPolyfillCss(document.head);
      }

      // Wrap the textNode as `<{tagName}><viv-ts-inner>{text}<viv-ts-inner></{tagName}>`
      const outerElem = document.createElement(tagName);
      const innerElem = document.createElement("viv-ts-inner");
      outerElem.appendChild(innerElem);
      textNode.parentNode.insertBefore(outerElem, textNode);
      innerElem.appendChild(textNode);

      // Check if che punctuation is almost full width
      const fontSize = parseFloat(
        document.defaultView.getComputedStyle(outerElem).fontSize,
      );
      const isFullWidth =
        (vertical ? innerElem.offsetHeight : innerElem.offsetWidth) >
        fontSize * 0.7;

      if (isFullWidth || hangingFirst || hangingLast || hangingEnd) {
        if (tagName === "viv-ts-open") {
          if (hangingFirst) {
            outerElem.className = "viv-hang-first";
          } else if (isFirstInBlock || isFirstAfterForcedLineBreak) {
            if (textSpacing.trimStart && !textSpacing.spaceFirst) {
              outerElem.className = "viv-ts-trim";
            } else {
              outerElem.className = "viv-ts-space";
            }
          } else if (!textSpacing.trimStart && isAtStartOfLine()) {
            outerElem.className = "viv-ts-space";
          } else if (
            textSpacing.trimAdjacent &&
            prevNode &&
            /[\p{Ps}\p{Pi}\p{Pe}\p{Pf}\u00B7\u2027\u30FB\u3000：；、。，．]\p{M}*$/u.test(
              prevNode.textContent,
            )
          ) {
            outerElem.className = "viv-ts-trim";
          } else {
            outerElem.className = "viv-ts-auto";
          }
        } else if (tagName === "viv-ts-close") {
          if (hangingLast) {
            outerElem.className = isFullWidth
              ? "viv-hang-last"
              : "viv-hang-last viv-hang-hw";
          } else if (isLastInBlock || isLastBeforeForcedLineBreak) {
            if (hangingEnd) {
              outerElem.className = isFullWidth
                ? "viv-hang-end"
                : "viv-hang-end viv-hang-hw";
            } else if (textSpacing.trimEnd) {
              outerElem.className = "viv-ts-trim";
            } else {
              outerElem.className = "viv-ts-space";
            }
          } else if (
            nextNode &&
            /^[\p{Pe}\p{Pf}\u00B7\u2027\u30FB\u3000：；、。，．]/u.test(
              nextNode.textContent,
            )
          ) {
            if (isFullWidth && textSpacing.trimAdjacent) {
              outerElem.className = "viv-ts-trim";
            }
          } else if (hangingEnd) {
            const forceAtEnd = !hangingPunctuation.allowEnd && isAtEndOfLine();
            outerElem.className = isFullWidth
              ? "viv-hang-end"
              : "viv-hang-end viv-hang-hw";
            if (!isFullWidth) {
              if (!forceAtEnd) {
                const atEndOfLine = isAtEndOfLine();
                outerElem.className = "";
                if (atEndOfLine && !isAtEndOfLine()) {
                  outerElem.className = "viv-hang-end viv-hang-hw";
                }
              }
            } else if (
              !forceAtEnd &&
              hangingPunctuation.allowEnd &&
              isAtEndOfLine()
            ) {
              if (!textSpacing.trimEnd || textSpacing.allowEnd) {
                outerElem.className = "viv-ts-space";
                if (!isAtEndOfLine()) {
                  if (textSpacing.trimEnd) {
                    outerElem.className = "viv-ts-auto";
                    if (!isAtEndOfLine()) {
                      outerElem.className = "viv-hang-end";
                    }
                  } else {
                    outerElem.className = "viv-hang-end";
                  }
                }
              } else {
                outerElem.className = "viv-ts-auto";
                if (!isAtEndOfLine()) {
                  outerElem.className = "viv-hang-end";
                }
              }
            }
          } else if (textSpacing.trimEnd) {
            if (textSpacing.allowEnd && isAtEndOfLine()) {
              outerElem.className = "viv-ts-space";
            } else {
              outerElem.className = "viv-ts-auto";
            }
          }
        }

        // Support for browsers not supporting inset-inline-start property
        // https://developer.mozilla.org/en-US/docs/Web/CSS/inset-inline-start#browser_compatibility
        if (innerElem.style.insetInlineStart === undefined) {
          let insetInlineStart = {
            "viv-ts-auto": "0.5em",
            "viv-ts-trim": "0.5em",
            "viv-hang-end": "1em",
            "viv-hang-last": "1em",
            "viv-hang-end viv-hang-hw": "0.5em",
            "viv-hang-last viv-hang-hw": "0.5em",
          }[outerElem.className];
          if (insetInlineStart) {
            if (vertical) {
              innerElem.style.top = insetInlineStart;
            } else {
              innerElem.style.left = insetInlineStart;
            }
          }
        }
      }
    }

    let spaceIdeoAlnumProcessing = false;

    function checkUpright(elem: Element): boolean {
      const style = elem?.ownerDocument.defaultView?.getComputedStyle(elem);
      return (
        !!style &&
        (style.textOrientation === "upright" ||
          style.textCombineUpright === "all" ||
          style["-webkit-text-combine"] === "horizontal")
      );
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

      if (spaceIdeoAlnumProcessing && !this.isTextPolyfillCssReady) {
        this.initTextPolyfillCss(document.head);
      }
    }
  }

  private initTextPolyfillCss(head: Element): void {
    const styleElem = head.ownerDocument.createElement("style");
    styleElem.id = "vivliostyle-text-polyfill-css";
    styleElem.textContent = TextPolyfillCss;
    head.appendChild(styleElem);
    this.isTextPolyfillCssReady = true;
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

export function preprocessForTextSpacing(element: Element): void {
  textPolyfill.preprocessForTextSpacing(element);
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
