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
import * as LayoutHelper from "./layout-helper";
import * as Plugin from "./plugin";
import * as Vtree from "./vtree";

type PropertyValue = string | number | Css.Val;

type HangingPunctuation = {
  first: boolean;
  forceEnd: boolean; // force-end
  allowEnd: boolean; // allow-end
  last: boolean;
};

const HANGING_PUNCTUATION_NONE: HangingPunctuation = {
  first: false,
  forceEnd: false,
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
          hangingPunctuation.forceEnd = true;
          hangingPunctuation.allowEnd = false;
          break;
        case "allow-end":
          hangingPunctuation.forceEnd = false;
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
    !hangingPunctuation.forceEnd &&
    !hangingPunctuation.allowEnd
  );
}

type SpacingTrim = {
  trimStart: boolean; // trim-start
  spaceFirst: boolean; // space-first
  trimEnd: boolean; // trim-end
  allowEnd: boolean; // allow-end
  trimAdjacent: boolean; // trim-adjacent
  // TODO: add support for:
  //   trimAll: boolean; // trim-all
};

/**
 * text-spacing-trim: space-all
 * space-all = space-start space-end space-adjacent
 */
const SPACING_TRIM_NONE: SpacingTrim = {
  trimStart: false,
  spaceFirst: false,
  trimEnd: false,
  allowEnd: false,
  trimAdjacent: false,
};

/**
 * text-spacing-trim: normal
 * normal = space-start allow-end trim-adjacent
 */
const SPACING_TRIM_NORMAL: SpacingTrim = {
  trimStart: false,
  spaceFirst: false,
  trimEnd: false,
  allowEnd: true,
  trimAdjacent: true,
};

/**
 * text-spacing-trim: trim-both
 * trim-both = trim-start trim-end trim-adjacent
 *
 * NOTE: Values `trim-auto` (deprecated) and `auto` are treated as `trim-both`.
 */
const SPACING_TRIM_BOTH: SpacingTrim = {
  trimStart: true,
  spaceFirst: false,
  trimEnd: true,
  allowEnd: false,
  trimAdjacent: true,
};

function spacingTrimFromPropertyValue(value: PropertyValue): SpacingTrim {
  const cssval =
    value instanceof Css.Val
      ? value
      : typeof value === "string"
        ? Css.getName(value)
        : Css.ident.normal;

  if (cssval === Css.ident.normal) {
    return SPACING_TRIM_NORMAL;
  }
  if (cssval === Css.ident.auto) {
    return SPACING_TRIM_BOTH;
  }
  const values = cssval instanceof Css.SpaceList ? cssval.values : [cssval];
  const textSpacing: SpacingTrim = Object.create(SPACING_TRIM_NORMAL);

  for (const val of values) {
    if (val instanceof Css.Ident) {
      switch (val.name) {
        case "trim-both":
        case "trim-auto":
          return SPACING_TRIM_BOTH;
        case "space-all":
          return SPACING_TRIM_NONE;
        case "trim-start":
          textSpacing.trimStart = true;
          textSpacing.spaceFirst = false;
          break;
        case "space-start":
          textSpacing.trimStart = false;
          textSpacing.spaceFirst = false;
          break;
        case "space-first":
          textSpacing.trimStart = false;
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
          textSpacing.trimEnd = false;
          textSpacing.allowEnd = true;
          break;
        case "trim-adjacent":
          textSpacing.trimAdjacent = true;
          break;
        case "space-adjacent":
          textSpacing.trimAdjacent = false;
          break;
      }
    }
  }

  return textSpacing;
}

type Autospace = {
  ideographAlpha: boolean;
  ideographNumeric: boolean;
  // TODO: add support for:
  //   punctuation: boolean;
  //   replace: boolean;
};

/**
 * text-autospace: no-autospace (none)
 */
const AUTOSPACE_NONE: Autospace = {
  ideographAlpha: false,
  ideographNumeric: false,
};

/**
 * text-autospace: normal
 */
const AUTOSPACE_NORMAL: Autospace = {
  ideographAlpha: true,
  ideographNumeric: true,
};

function autospaceFromPropertyValue(value: PropertyValue): Autospace {
  const cssval =
    value instanceof Css.Val
      ? value
      : typeof value === "string"
        ? Css.getName(value)
        : Css.ident.normal;

  if (cssval === Css.ident.normal || cssval === Css.ident.auto) {
    return AUTOSPACE_NORMAL;
  }
  if (cssval === Css.ident.none) {
    return AUTOSPACE_NONE;
  }

  const values = cssval instanceof Css.SpaceList ? cssval.values : [cssval];
  const autospace: Autospace = Object.create(AUTOSPACE_NONE);

  for (const val of values) {
    if (val instanceof Css.Ident) {
      switch (val.name) {
        case "no-autospace":
          return AUTOSPACE_NONE;
        case "ideograph-alpha":
          autospace.ideographAlpha = true;
          break;
        case "ideograph-numeric":
          autospace.ideographNumeric = true;
          break;
      }
    }
  }

  return autospace;
}

function isTextSpacingNone(
  autospace: Autospace,
  spacingTrim: SpacingTrim,
): boolean {
  return (
    !autospace.ideographAlpha &&
    !autospace.ideographNumeric &&
    !spacingTrim.trimStart &&
    !spacingTrim.spaceFirst &&
    !spacingTrim.trimEnd &&
    !spacingTrim.allowEnd &&
    !spacingTrim.trimAdjacent
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

class TextSpacingPolyfill {
  getPolyfilledInheritedProps() {
    return ["hanging-punctuation", "text-autospace", "text-spacing-trim"];
  }

  preprocessSingleDocument(document: Document): void {
    if (!document.body) {
      return;
    }
    this.preprocessForTextSpacing(document.body);
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
          /(?![()\[\]{}])[\p{Ps}\p{Pe}\p{Pf}\p{Pi}、。，．：；､｡\u3000]\p{M}*(?=\P{M})|.(?=(?![()\[\]{}])[\p{Ps}\p{Pe}\p{Pf}\p{Pi}、。，．：；､｡\u3000])|(?!\p{P})[\p{sc=Han}\u3041-\u30FF\u31C0-\u31FF]\p{M}*(?=(?![\p{sc=Han}\u3041-\u30FF\u31C0-\u31FF\uFF01-\uFF60])[\p{L}\p{Nd}])|(?![\p{sc=Han}\u3041-\u30FF\u31C0-\u31FF\uFF01-\uFF60])[\p{L}\p{Nd}]\p{M}*(?=(?!\p{P})[\p{sc=Han}\u3041-\u30FF\u31C0-\u31FF])/gsu,
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
    autospaceVal: Css.Val,
    spacingTrimVal: Css.Val,
    hangingPunctuationVal: Css.Val,
    lang: string,
    vertical: boolean,
  ): void {
    lang = normalizeLang(lang);
    const autospace = autospaceFromPropertyValue(autospaceVal);
    const spacingTrim = spacingTrimFromPropertyValue(spacingTrimVal);
    const hangingPunctuation = hangingPunctuationFromPropertyValue(
      hangingPunctuationVal,
    );

    if (
      isHangingPunctuationNone(hangingPunctuation) &&
      isTextSpacingNone(autospace, spacingTrim)
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
        isFirstInBlock || isFirstAfterForcedLineBreak,
        isFirstInBlock,
        isFirstAfterForcedLineBreak,
        isLastBeforeForcedLineBreak,
        isLastInBlock,
        prevNode,
        nextNode,
        autospace,
        spacingTrim,
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
    const isFirstFragment =
      !nodeContext ||
      (nodeContext.fragmentIndex === 1 && checkIfFirstInBlock());
    const isAfterForcedLineBreak =
      isFirstFragment || checkIfAfterForcedLineBreak();

    function isOutOfLine(node: Node): boolean {
      if (node?.nodeType !== 1) {
        return false;
      }
      const elem = node as HTMLElement;
      if (elem.hasAttribute(Vtree.SPECIAL_ATTR)) {
        return true;
      }
      const { position, float } = elem.style ?? {};
      return (
        position === "absolute" ||
        position === "fixed" ||
        (float && float !== "none")
      );
    }

    function checkIfFirstInBlock(): boolean {
      const p = checkPoints[0];
      for (let pp = p; ; pp = pp.parent) {
        if (!pp || !pp.inline) {
          if (pp?.fragmentIndex !== 1) {
            // This block is not the first fragment
            return false;
          }
          break;
        }
      }
      if (!p.inline) {
        // This is at the start of the block
        return true;
      }
      for (
        let prev = p.viewNode.previousSibling;
        prev;
        prev = prev.previousSibling
      ) {
        if (Vtree.canIgnore(prev, p.whitespace)) {
          continue;
        }
        if (!isOutOfLine(prev)) {
          return false;
        }
      }
      return true;
    }

    function checkIfAfterForcedLineBreak(): boolean {
      let p = checkPoints[0];
      let prevNode: Node;
      while (p && p.inline) {
        prevNode = p.viewNode?.previousSibling;
        if (prevNode) {
          if (
            prevNode.nodeType === 3 &&
            /^[ \t\r\n\f]*$/.test(prevNode.textContent) &&
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
        if (prevNode.nodeType === 1) {
          if ((prevNode as Element).localName === "br") {
            return true;
          }
          const display = (prevNode as HTMLElement).style?.display;
          if (display && display !== "inline") {
            return !/^(inline|ruby)\b/.test(display);
          }
        } else if (prevNode.nodeType === 3) {
          if (p.whitespace === Vtree.Whitespace.PRESERVE) {
            if (/\n$/.test(prevNode.textContent)) {
              return true;
            }
          } else if (p.whitespace === Vtree.Whitespace.NEWLINE) {
            if (/\n[ \t\r\n\f]*$/.test(prevNode.textContent)) {
              return true;
            }
          }
        }
        prevNode = prevNode.lastChild;
      }
      return false;
    }

    let iFirst = -1;
    for (let i = 0; i < checkPoints.length; i++) {
      const p = checkPoints[i];
      if (
        !p.after &&
        p.inline &&
        !p.display &&
        p.parent &&
        p.viewNode.parentNode &&
        p.viewNode.nodeType === Node.TEXT_NODE &&
        !Vtree.canIgnore(p.viewNode, p.whitespace)
      ) {
        const lang = normalizeLang(
          p.lang ??
            p.parent.lang ??
            nodeContext?.lang ??
            nodeContext?.parent?.lang,
        );
        const autospace = autospaceFromPropertyValue(
          p.inheritedProps["text-autospace"],
        );
        const spacingTrim = spacingTrimFromPropertyValue(
          p.inheritedProps["text-spacing-trim"],
        );
        const hangingPunctuation = hangingPunctuationFromPropertyValue(
          p.inheritedProps["hanging-punctuation"],
        );

        if (
          isHangingPunctuationNone(hangingPunctuation) &&
          isTextSpacingNone(autospace, spacingTrim)
        ) {
          continue;
        }
        if (/\b(flex|grid)\b/.test(p.parent.display)) {
          // Cannot process if parent is flex or grid. (Issue #926)
          continue;
        }

        if (iFirst < 0) {
          iFirst = i;
        }
        let prevNode: Node = null;
        let nextNode: Node = null;
        let isFirstAfterBreak = i === iFirst;
        let isFirstInBlock = i === iFirst && isFirstFragment;
        let isFirstAfterForcedLineBreak =
          i === iFirst && isAfterForcedLineBreak;
        let isLastBeforeForcedLineBreak = false;
        let isLastInBlock = false;

        function checkIfFirstAfterForcedLineBreak(
          prevP: Vtree.NodeContext,
        ): boolean {
          if (prevP.viewNode?.nodeType === 1) {
            return (prevP.viewNode as Element).localName === "br";
          }
          if (prevP.viewNode?.nodeType === 3) {
            if (prevP.whitespace === Vtree.Whitespace.PRESERVE) {
              if (/\n$/.test(prevP.viewNode.textContent)) {
                return true;
              }
            } else if (prevP.whitespace === Vtree.Whitespace.NEWLINE) {
              if (/\n[ \t\r\n\f]*$/.test(prevP.viewNode.textContent)) {
                return true;
              }
            }
            if (
              (prevP.viewNode as Element).previousElementSibling?.localName ===
              "br"
            ) {
              return Vtree.canIgnore(prevP.viewNode, prevP.whitespace);
            }
          }
          return false;
        }

        function checkIfLastBeforeForcedLineBreak(
          nextP: Vtree.NodeContext,
        ): boolean {
          if (nextP.viewNode?.nodeType === 1) {
            return (nextP.viewNode as Element).localName === "br";
          }
          if (nextP.viewNode?.nodeType === 3) {
            if (nextP.whitespace === Vtree.Whitespace.PRESERVE) {
              if (/^\n/.test(nextP.viewNode.textContent)) {
                return true;
              }
            } else if (nextP.whitespace === Vtree.Whitespace.NEWLINE) {
              if (/^[ \t\r\n\f]*\n/.test(nextP.viewNode.textContent)) {
                return true;
              }
            }
            if (
              (nextP.viewNode as Element).nextElementSibling?.localName === "br"
            ) {
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
            (prevP.display && !/^(inline|ruby)\b/.test(prevP.display)) ||
            (prevP.viewNode?.nodeType === 1 &&
              ((prevP.viewNode as Element).localName === "br" ||
                Base.mediaTags[(prevP.viewNode as Element).localName]))
          ) {
            break;
          }
          if (prev === 0) {
            isFirstAfterBreak = true;
            if (isFirstFragment) {
              isFirstInBlock = true;
              isFirstAfterForcedLineBreak = true;
            }
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
            (nextP.display && !/^(inline|ruby)\b/.test(nextP.display)) ||
            (nextP.viewNode?.nodeType === 1 &&
              ((nextP.viewNode as Element).localName === "br" ||
                Base.mediaTags[(nextP.viewNode as Element).localName]))
          ) {
            if (
              next === checkPoints.length - 1 &&
              isOutOfLine(nextP.viewNode)
            ) {
              isLastInBlock = true;
            }
            break;
          }
          if (next === checkPoints.length - 1) {
            isLastBeforeForcedLineBreak = true;
            isLastInBlock = true;
            for (
              let nextNext = nextP.viewNode.nextSibling;
              nextNext;
              nextNext = nextNext.nextSibling
            ) {
              if (!isOutOfLine(nextNext)) {
                isLastInBlock = false;
                break;
              }
            }
          }
        }
        if (p.parent?.display === "inline-block") {
          if (!isFirstInBlock) {
            let firstInInlineBlock = p.parent.viewNode.firstChild;
            while (Vtree.canIgnore(firstInInlineBlock, p.whitespace)) {
              firstInInlineBlock = firstInInlineBlock.nextSibling;
            }
            if (p.viewNode === firstInInlineBlock) {
              isFirstInBlock = true;
            }
          }
          if (!isLastInBlock) {
            let lastInInlineBlock = p.parent.viewNode.lastChild;
            while (Vtree.canIgnore(lastInInlineBlock, p.whitespace)) {
              lastInInlineBlock = lastInInlineBlock.previousSibling;
            }
            if (p.viewNode === lastInInlineBlock) {
              isLastInBlock = true;
            }
          }
        }
        const columnOver = this.processTextSpacing(
          p.viewNode,
          isFirstAfterBreak,
          isFirstInBlock,
          isFirstAfterForcedLineBreak,
          isLastBeforeForcedLineBreak,
          isLastInBlock,
          prevNode,
          nextNode,
          autospace,
          spacingTrim,
          hangingPunctuation,
          lang,
          p.vertical,
        );
        if (columnOver > 0) {
          // Stop processing if the node is moved to next column
          // because it will be processed again in the next column.
          // (Issue #1256)
          break;
        }
      }
    }
  }

  private processTextSpacing(
    textNode: Node,
    isFirstAfterBreak: boolean,
    isFirstInBlock: boolean,
    isFirstAfterForcedLineBreak: boolean,
    isLastBeforeForcedLineBreak: boolean,
    isLastInBlock: boolean,
    prevNode: Node,
    nextNode: Node,
    autospace: Autospace,
    spacingTrim: SpacingTrim,
    hangingPunctuation: HangingPunctuation,
    lang: string,
    vertical: boolean,
  ): number {
    const text = textNode.textContent;
    const document = textNode.ownerDocument;
    let columnOver = 0;
    let currRange: Range;
    let prevRange: Range;
    let nextRange: Range;

    function isAtStartOfLine(): boolean {
      if (isFirstAfterBreak) {
        return true;
      }
      if (!prevNode) {
        return false;
      }
      if (!currRange) {
        currRange = document.createRange();
        currRange.selectNode(textNode);
      }
      const rect = currRange.getClientRects()[0];
      if (!rect) {
        return false;
      }
      if (!prevRange) {
        prevRange = document.createRange();
        prevRange.selectNode(prevNode);
      }
      const prevRects = prevRange.getClientRects();
      const prevRect = prevRects[prevRects.length - 1];
      if (!prevRect) {
        return false;
      }
      columnOver ||= LayoutHelper.checkIfBeyondColumnBreaks(prevRect, vertical);
      return vertical
        ? rect.top < prevRect.top + prevRect.height - rect.width ||
            rect.left + rect.width < prevRect.left + rect.width / 10 ||
            rect.left > prevRect.left + prevRect.width - rect.width / 10
        : rect.left < prevRect.left + prevRect.width - rect.height ||
            rect.top > prevRect.top + prevRect.height - rect.height / 10 ||
            rect.top + rect.height < prevRect.top + rect.height / 10;
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
      if (!rect) {
        return false;
      }
      columnOver ||= LayoutHelper.checkIfBeyondColumnBreaks(rect, vertical);
      if (!nextRange) {
        nextRange = document.createRange();
        nextRange.selectNode(nextNode);
      }
      const nextRect = nextRange.getClientRects()[0];
      if (!nextRect) {
        return false;
      }
      return vertical
        ? rect.top + rect.height > nextRect.top + rect.width ||
            rect.left > nextRect.left + nextRect.width - rect.width / 10 ||
            rect.left + rect.width < nextRect.left + rect.width / 10
        : rect.left + rect.width > nextRect.left + rect.height ||
            rect.top + rect.height < nextRect.top + rect.height / 10 ||
            rect.top > nextRect.top + nextRect.height - rect.height / 10;
    }

    let punctProcessing = false;
    let hangingFirst = false;
    let hangingLast = false;
    let hangingEnd = false;
    let tagName: "viv-ts-open" | "viv-ts-close";

    if (
      isFirstInBlock &&
      hangingPunctuation.first &&
      /^[\p{Ps}\p{Pf}\p{Pi}'"\u3000]\p{M}*$/u.test(text)
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
    } else if (
      (hangingPunctuation.forceEnd || hangingPunctuation.allowEnd) &&
      /^[、。，．､｡]\p{M}*$/u.test(text)
    ) {
      // hanging-punctuation: force-end | allow-end
      tagName = "viv-ts-close";
      punctProcessing = true;
      hangingEnd = true;
    } else if (
      (spacingTrim.trimStart ||
        spacingTrim.spaceFirst ||
        spacingTrim.trimAdjacent) &&
      /^[‘“〝（［｛｟〈〈《「『【〔〖〘〚]\p{M}*$/u.test(text)
    ) {
      // fullwidth opening punctuation
      tagName = "viv-ts-open";
      punctProcessing = true;
    } else if (
      (spacingTrim.trimEnd ||
        spacingTrim.allowEnd ||
        spacingTrim.trimAdjacent) &&
      (/^[’”〞〟）］｝｠〉〉》」』】〕〗〙〛]\p{M}*$/u.test(text) ||
        (lang === "zh-hans" && /^[：；]\p{M}*$/u.test(text)) ||
        (lang !== "zh-hant" && /^[、。，．]\p{M}*$/u.test(text)))
    ) {
      // fullwidth closing punctuation
      tagName = "viv-ts-close";
      punctProcessing = true;
    }

    if (punctProcessing) {
      if (textNode.parentElement.localName === "viv-ts-inner") {
        // Already processed
        return 0;
      }
      // Wrap the textNode as `<{tagName}><viv-ts-inner>{text}<viv-ts-inner></{tagName}>`
      const outerElem = document.createElement(tagName);
      const innerElem = document.createElement("viv-ts-inner");
      outerElem.appendChild(innerElem);
      textNode.parentNode.insertBefore(outerElem, textNode);
      innerElem.appendChild(textNode);

      // Check if the punctuation is almost full width
      function checkFullWidth(elem: HTMLElement): boolean {
        const fontSize = parseFloat(
          document.defaultView.getComputedStyle(elem).fontSize,
        );
        const fullWidthThreshold = fontSize * 0.7;
        return (
          (vertical ? elem.offsetHeight : elem.offsetWidth) > fullWidthThreshold
        );
      }
      const isFullWidth = checkFullWidth(innerElem);

      function linePosition(): number {
        return vertical ? outerElem.offsetLeft : outerElem.offsetTop;
      }

      if (isFullWidth || hangingFirst || hangingLast || hangingEnd) {
        if (tagName === "viv-ts-open") {
          if (hangingFirst) {
            outerElem.className = "viv-hang-first";
          } else if (isFirstInBlock || isFirstAfterForcedLineBreak) {
            if (spacingTrim.trimStart) {
              outerElem.className = "viv-ts-trim";
            } else {
              outerElem.className = "viv-ts-space";
            }
          } else if (
            !(spacingTrim.trimStart || spacingTrim.spaceFirst) &&
            isAtStartOfLine()
          ) {
            outerElem.className = "viv-ts-space";
          } else if (
            spacingTrim.trimAdjacent &&
            prevNode &&
            /[\p{Ps}\p{Pi}\p{Pe}\p{Pf}\u00B7\u2027\u30FB\u3000：；、。，．]\p{M}*$/u.test(
              prevNode.textContent,
            ) &&
            // exclude non-fullwidth closing punctuations (Issue #1003)
            (!/[\p{Pe}\p{Pf}]\p{M}*$/u.test(prevNode.textContent) ||
              (prevNode.parentElement.localName === "viv-ts-inner" &&
                checkFullWidth(prevNode.parentElement)))
          ) {
            outerElem.className = "viv-ts-trim";
          } else if (
            (spacingTrim.trimStart || spacingTrim.spaceFirst) &&
            isAtStartOfLine()
          ) {
            const linePos = linePosition();
            outerElem.className = "viv-ts-auto";
            if (linePos === linePosition() && !isAtStartOfLine()) {
              // workaround for issues #1005 and #1010
              outerElem.className = "viv-ts-trim";
            }
          }
        } else if (tagName === "viv-ts-close") {
          if (hangingLast) {
            outerElem.className = isFullWidth
              ? "viv-hang-last"
              : "viv-hang-last viv-hang-hw";
          } else if (isLastInBlock || isLastBeforeForcedLineBreak) {
            const linePos = linePosition();
            if (hangingEnd) {
              outerElem.className = isFullWidth
                ? hangingPunctuation.allowEnd && spacingTrim.allowEnd
                  ? "viv-ts-auto"
                  : "viv-hang-end"
                : "viv-hang-end viv-hang-hw";
              if (hangingPunctuation.allowEnd && linePos === linePosition()) {
                if (spacingTrim.trimEnd) {
                  outerElem.className = "viv-ts-trim";
                } else if (spacingTrim.allowEnd) {
                  outerElem.className = "viv-hang-end";
                  if (linePos === linePosition()) {
                    outerElem.className = "";
                  }
                } else {
                  outerElem.className = "viv-ts-space";
                }
              }
            } else if (spacingTrim.trimEnd) {
              outerElem.className = "viv-ts-trim";
            } else if (spacingTrim.allowEnd) {
              outerElem.className = "viv-ts-auto";
              if (linePos === linePosition()) {
                outerElem.className = "";
              }
            } else {
              outerElem.className = "viv-ts-space";
            }
          } else if (
            nextNode &&
            /^[\p{Pe}\p{Pf}\u00B7\u2027\u30FB\u3000：；、。，．]/u.test(
              nextNode.textContent,
            )
          ) {
            if (isFullWidth && spacingTrim.trimAdjacent) {
              outerElem.className = "viv-ts-trim";
            }
          } else if (hangingEnd) {
            const atEnd = isAtEndOfLine();
            const atEndNoHang = atEnd && hangingPunctuation.allowEnd;
            if (!atEndNoHang) {
              outerElem.className = isFullWidth
                ? "viv-hang-end"
                : "viv-hang-end viv-hang-hw";
            }
            if (!isFullWidth) {
              if (!atEnd && !isAtEndOfLine()) {
                outerElem.className = "";
              }
            } else if (atEndNoHang && spacingTrim.trimEnd) {
              outerElem.className = "viv-ts-auto";
            } else if (!atEndNoHang && !isAtEndOfLine()) {
              outerElem.className = "";
            } else if (!atEnd && hangingPunctuation.allowEnd) {
              if (!spacingTrim.trimEnd) {
                outerElem.className = "viv-ts-space";
                if (!isAtEndOfLine()) {
                  if (spacingTrim.allowEnd) {
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
          } else if (spacingTrim.trimEnd || spacingTrim.allowEnd) {
            if (isAtEndOfLine()) {
              if (spacingTrim.allowEnd) {
                outerElem.className = "viv-ts-space";
              } else {
                outerElem.className = "viv-ts-auto";
              }
            } else {
              const linePos = linePosition();
              outerElem.className = "viv-ts-auto";
              if (linePos === linePosition()) {
                outerElem.className = "";
              }
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

    function checkNonZeroMarginBorderPadding(
      node1: Node,
      node2: Node,
    ): boolean {
      if (node1.nodeType === 1) {
        const style = document.defaultView.getComputedStyle(node1 as Element);
        if (
          parseFloat(style.marginInlineEnd) ||
          parseFloat(style.borderInlineEndWidth) ||
          parseFloat(style.paddingInlineEnd)
        ) {
          return true;
        }
      }
      const parent1 = node1.parentElement;
      if (parent1 && !parent1.contains(node2)) {
        return checkNonZeroMarginBorderPadding(parent1, node2);
      }
      if (node2.nodeType === 1) {
        const style = document.defaultView.getComputedStyle(node2 as Element);
        if (
          parseFloat(style.marginInlineStart) ||
          parseFloat(style.borderInlineStartWidth) ||
          parseFloat(style.paddingInlineStart)
        ) {
          return true;
        }
      }
      const parent2 = node2.parentElement;
      if (parent2 && !parent2.contains(node1)) {
        return checkNonZeroMarginBorderPadding(node1, parent2);
      }
      return false;
    }

    if (autospace.ideographAlpha || autospace.ideographNumeric) {
      if (
        prevNode &&
        /^(?!\p{P})[\p{sc=Han}\u3041-\u30FF\u31C0-\u31FF]/u.test(text) &&
        ((autospace.ideographAlpha &&
          /(?![\p{sc=Han}\u3041-\u30FF\u31C0-\u31FF\uFF01-\uFF60])\p{L}\p{M}*$/u.test(
            prevNode.textContent,
          )) ||
          (autospace.ideographNumeric &&
            /(?![\uFF01-\uFF60])\p{Nd}\p{M}*$/u.test(prevNode.textContent))) &&
        !(vertical && checkUpright(prevNode.parentElement)) &&
        !checkNonZeroMarginBorderPadding(prevNode, textNode)
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
        ((autospace.ideographAlpha &&
          /^(?![\p{sc=Han}\u3041-\u30FF\u31C0-\u31FF\uFF01-\uFF60])\p{L}/u.test(
            nextNode.textContent,
          )) ||
          (autospace.ideographNumeric &&
            /^(?![\uFF01-\uFF60])\p{Nd}/u.test(nextNode.textContent))) &&
        !(vertical && checkUpright(nextNode.parentElement)) &&
        !checkNonZeroMarginBorderPadding(textNode, nextNode)
      ) {
        textNode.parentNode.insertBefore(
          document.createElement("viv-ts-thin-sp"),
          textNode.nextSibling,
        );
        spaceIdeoAlnumProcessing = true;
      }
    }
    return columnOver;
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
      true, // text-spacing must be processed before others (Issue #1105)
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
  textAutospace: Css.Val,
  textSpacingTrim: Css.Val,
  hangingPunctuation: Css.Val,
  lang: string,
  vertical: boolean,
): void {
  textPolyfill.processGeneratedContent(
    element,
    textAutospace,
    textSpacingTrim,
    hangingPunctuation,
    lang,
    vertical,
  );
}
