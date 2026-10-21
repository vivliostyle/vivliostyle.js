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
import * as Asserts from "./asserts";
import * as Base from "./base";
import * as Css from "./css";
import * as LayoutHelper from "./layout-helper";
import * as NativeTextSpacing from "./native-text-spacing";
import * as Plugin from "./plugin";
import * as PseudoElement from "./pseudo-element";
import * as RangeClientRects from "./range-client-rects";
import * as Vtree from "./vtree";

type PropertyValue = string | number | Css.Val | undefined;

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

function autospaceToCSS(autospace: Autospace): string {
  return autospace.ideographAlpha
    ? autospace.ideographNumeric
      ? "normal"
      : "ideograph-alpha"
    : autospace.ideographNumeric
      ? "ideograph-numeric"
      : "no-autospace";
}

function isSpacingTrimNone(spacingTrim: SpacingTrim): boolean {
  return (
    !spacingTrim.trimStart &&
    !spacingTrim.spaceFirst &&
    !spacingTrim.trimEnd &&
    !spacingTrim.allowEnd &&
    !spacingTrim.trimAdjacent
  );
}

/**
 * Get the text-spacing-trim value that browsers may support natively for the
 * spacing trim, or null if there is no such value.
 */
function spacingTrimToNativeCSS(spacingTrim: SpacingTrim): string | null {
  if (isSpacingTrimNone(spacingTrim)) {
    return "space-all";
  }
  // `trim-end` is processed by the polyfill (see processTextSpacing())
  if (
    (spacingTrim.allowEnd || spacingTrim.trimEnd) &&
    spacingTrim.trimAdjacent
  ) {
    return spacingTrim.trimStart
      ? "trim-start"
      : spacingTrim.spaceFirst
        ? "space-first"
        : "normal";
  }
  return null;
}

function isTextSpacingNone(
  autospace: Autospace,
  spacingTrim: SpacingTrim,
): boolean {
  return (
    !autospace.ideographAlpha &&
    !autospace.ideographNumeric &&
    isSpacingTrimNone(spacingTrim)
  );
}

function normalizeLang(lang: string | null | undefined): string | null {
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

/**
 * Find the block container establishing the inline formatting context that
 * the node participates in.
 */
function findBlockContainer(node: Node): HTMLElement | null {
  const window = node.ownerDocument?.defaultView;
  if (!window) {
    return null;
  }
  for (let elem = node.parentElement; elem; elem = elem.parentElement) {
    if (elem.hasAttribute("data-vivliostyle-column")) {
      return elem;
    }
    const { display } = window.getComputedStyle(elem);
    if (
      display !== "inline" &&
      display !== "contents" &&
      !display.startsWith("ruby")
    ) {
      return elem;
    }
  }
  return null;
}

/**
 * Get the direction of the punctuation text node, or null if it differs from
 * the direction of its block container.
 *
 * Text spacing and hanging punctuation are designed for CJK typesetting.
 * Right-to-left and bidirectional text is supported only to the extent that
 * the punctuation does not overlap other text: it is assumed to be laid out
 * in the direction of its block container, so it is not processed where its
 * own direction differs (e.g., in an element with `dir="rtl"` in
 * left-to-right text), since it may not face the edge of the line there.
 */
function getTextDirection(textNode: Text): "ltr" | "rtl" | null {
  const window = textNode.ownerDocument.defaultView;
  const { direction } = window.getComputedStyle(textNode.parentElement);
  const block = findBlockContainer(textNode);
  if (block && window.getComputedStyle(block).direction !== direction) {
    return null;
  }
  return direction === "rtl" ? "rtl" : "ltr";
}

/**
 * Check if the punctuation text node is laid out on the line-end side of the
 * preceding in-flow character, or the character is not on the same line.
 * In bidi text, a closing bracket paired with an opening bracket in a run of
 * the opposite direction is laid out on the other side, where hanging would
 * make it overlap the preceding text. Characters displaced from the line
 * (e.g., by vertical-align) are skipped.
 */
function isAfterPrecedingCharacter(
  textNode: Text,
  rtl: boolean,
  vertical: boolean,
): boolean {
  const document = textNode.ownerDocument;
  const window = document.defaultView;
  const rect = RangeClientRects.getClientRectsOfNode(textNode)[0];
  const block = findBlockContainer(textNode);
  if (!rect || !block) {
    return true;
  }
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  walker.currentNode = textNode;
  for (let node = walker.previousNode(); node; node = walker.previousNode()) {
    const match = node.textContent.match(/\S\s*$/u);
    if (!match) {
      continue;
    }
    let skip = false;
    for (
      let e = node.parentElement;
      e && e !== block && !e.contains(textNode);
      e = e.parentElement
    ) {
      const style = window.getComputedStyle(e);
      const hasRelativeOffset =
        style.position === "relative" &&
        [style.top, style.right, style.bottom, style.left].some(
          (value) =>
            value !== "auto" &&
            (!Number.isFinite(Number.parseFloat(value)) ||
              Number.parseFloat(value) !== 0),
        );
      if (
        (style.position !== "static" &&
          (style.position !== "relative" || hasRelativeOffset)) ||
        style.float !== "none" ||
        (style.verticalAlign !== "baseline" &&
          parseFloat(style.verticalAlign) !== 0) ||
        style.display === "ruby-text"
      ) {
        skip = true;
        break;
      }
    }
    if (skip) {
      continue;
    }
    const prevRect = RangeClientRects.getClientRectsBetween(
      RangeClientRects.at(node, match.index),
      RangeClientRects.at(node, match.index + match[0].trimEnd().length),
    )[0];
    if (!prevRect) {
      continue;
    }
    const center = (r: DOMRect, x: boolean) =>
      x ? r.left + r.width / 2 : r.top + r.height / 2;
    if (
      Math.abs(center(prevRect, vertical) - center(rect, vertical)) >
      (vertical ? rect.width : rect.height) / 2
    ) {
      // Not on the same line
      return true;
    }
    // For sideways-lr, the inline direction of ltr is bottom-to-top
    const reversed =
      rtl !==
      (window.getComputedStyle(textNode.parentElement).writingMode ===
        "sideways-lr");
    return center(rect, !vertical) > center(prevRect, !vertical) !== reversed;
  }
  return true;
}

/**
 * Check if any inline ancestor of the punctuation text node, up to its block
 * container, has non-zero border or padding on the side facing the
 * line-start (or line-end) edge. Such border or padding between the
 * punctuation and the edge of the line prevents hanging-punctuation `first`
 * (or `last`). (Issue #2194)
 */
function hasInlineBorderOrPaddingAtEdge(
  textNode: Text,
  edge: "start" | "end",
  rtl: boolean,
  vertical: boolean,
): boolean {
  const window = textNode.ownerDocument?.defaultView;
  if (!window) {
    return false;
  }
  // For sideways-lr, the inline-start is the bottom side
  const reversed =
    rtl !==
    (window.getComputedStyle(textNode.parentElement).writingMode ===
      "sideways-lr");
  const side = vertical
    ? reversed === (edge === "start")
      ? "bottom"
      : "top"
    : reversed === (edge === "start")
      ? "right"
      : "left";
  for (let elem = textNode.parentElement; elem; elem = elem.parentElement) {
    if (elem.hasAttribute("data-vivliostyle-column")) {
      break;
    }
    const style = window.getComputedStyle(elem);
    const { display } = style;
    if (display === "contents") {
      continue;
    }
    if (display !== "inline" && !display.startsWith("ruby")) {
      break;
    }
    if (
      parseFloat(style.getPropertyValue(`border-${side}-width`)) > 0 ||
      parseFloat(style.getPropertyValue(`padding-${side}`)) > 0
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Force the block to be laid out from scratch.
 *
 * After the `viv-ts-*` elements are inserted or the text nodes are split, the
 * browser may reuse cached shaping results and break lines differently than
 * it does on a fresh layout, so measuring the block as-is would paginate
 * against a layout that changes later. (Issue #2142)
 */
function reshapeBlockContainer(element: HTMLElement): void {
  const savedFontKerning = element.style.fontKerning;
  const { fontKerning } =
    element.ownerDocument.defaultView.getComputedStyle(element);
  element.style.fontKerning = fontKerning === "none" ? "normal" : "none";
  element.offsetHeight; // force layout so that restoring the value re-shapes
  element.style.fontKerning = savedFontKerning;
}

const CHROMIUM_VO_TR_FALLBACK_PATTERN = /^[‘’“”〰﹙﹚﹛﹜﹝﹞〚〛]\p{M}*$/u;
const CHROMIUM_VO_TR_FALLBACK_OPEN_PATTERN = /^[‘“﹙﹛﹝〚]\p{M}*$/u;

function isChromiumVoTrFallback(text: string, vertical: boolean): boolean {
  return (
    Base.browserType === "chromium" &&
    vertical &&
    CHROMIUM_VO_TR_FALLBACK_PATTERN.test(text)
  );
}

function getChromiumVoTrFallbackTagName(
  text: string,
): "viv-ts-open" | "viv-ts-close" {
  // Reuse the existing open/close wrapper tags only to isolate the character.
  // Fallback-only nodes return before text-spacing/hanging classes are assigned,
  // so this tag choice does not change spacing behavior.
  return CHROMIUM_VO_TR_FALLBACK_OPEN_PATTERN.test(text)
    ? "viv-ts-open"
    : "viv-ts-close";
}

/**
 * Text spacing of the text in an element.
 *
 * The browser's native text-autospace and text-spacing-trim are used if
 * available (Issue #2151), and the polyfill processes the rest. The text is
 * split into separate text nodes only where the polyfill needs character
 * boundaries (Issue #1562).
 */
type Spacing = {
  autospace: Autospace;
  // The native text-autospace is used. The polyfill only inserts the spacing
  // at element boundaries where the native one does not (see
  // processTextSpacing()).
  nativeAutospace: boolean;
  spacingTrim: SpacingTrim;
  nativeTrimValue: string | null;
  // The native text-spacing-trim is used. The polyfill only processes the
  // punctuation that the browser does not set half-width at the end of a
  // line, the opening punctuation at the start of a continued block for
  // `space-first`, and the punctuation that may hang.
  nativeTrim: boolean;
  hangingPunctuation: HangingPunctuation;
  chromiumVoTrFallback: boolean;
  // The normalized language of the text (see normalizeLang())
  lang: string | null;
};

function isSpacingNone(spacing: Spacing): boolean {
  return (
    isHangingPunctuationNone(spacing.hangingPunctuation) &&
    isTextSpacingNone(spacing.autospace, spacing.spacingTrim)
  );
}

const CHROMIUM_VO_TR_FALLBACK_CHAR_PATTERN = /[‘’“”\u3030﹙﹚﹛﹜﹝﹞〚〛]/u;

/**
 * Resolve the text spacing of the text in the element, and set the native
 * text-autospace on the element. The native text-spacing-trim is set by
 * setNativeTrim().
 */
function resolveSpacing(
  element: HTMLElement,
  autospaceVal: PropertyValue,
  spacingTrimVal: PropertyValue,
  hangingPunctuationVal: PropertyValue,
  lang: string | null,
  vertical: boolean,
): Spacing {
  const autospace = autospaceFromPropertyValue(autospaceVal);
  const spacingTrim = spacingTrimFromPropertyValue(spacingTrimVal);
  const hangingPunctuation = hangingPunctuationFromPropertyValue(
    hangingPunctuationVal,
  );
  const chromiumVoTrFallback =
    Base.browserType === "chromium" &&
    vertical &&
    CHROMIUM_VO_TR_FALLBACK_CHAR_PATTERN.test(element.textContent) &&
    !(
      isHangingPunctuationNone(hangingPunctuation) &&
      isTextSpacingNone(autospace, spacingTrim)
    );
  const autospaceValue = autospaceToCSS(autospace);
  const nativeAutospace = NativeTextSpacing.supportsAutospace(
    element.ownerDocument,
    autospaceValue,
  );
  element.style.setProperty(
    "text-autospace",
    nativeAutospace ? autospaceValue : "no-autospace",
  );
  const nativeTrimValue = spacingTrimToNativeCSS(spacingTrim);
  // The Chromium vertical text fallback needs the punctuation not trimmed by
  // the browser.
  const nativeTrim =
    !!nativeTrimValue &&
    !chromiumVoTrFallback &&
    NativeTextSpacing.supportsTrim(element, nativeTrimValue, lang, vertical);
  return {
    autospace,
    nativeAutospace,
    spacingTrim,
    nativeTrimValue,
    nativeTrim,
    hangingPunctuation,
    chromiumVoTrFallback,
    lang,
  };
}

function setNativeTrim(
  element: HTMLElement,
  spacing: Spacing,
  nativeTrim: boolean,
): void {
  spacing.nativeTrim = nativeTrim;
  element.style.setProperty(
    "text-spacing-trim",
    nativeTrim ? spacing.nativeTrimValue : "space-all",
  );
}

/**
 * Check if the native text-autospace on the element inserts the spacing of
 * the type (`ideograph-alpha` or `ideograph-numeric`).
 */
function hasNativeAutospace(elem: Element | null, type: string): boolean {
  if (!elem) {
    return false;
  }
  const value = elem.ownerDocument.defaultView
    .getComputedStyle(elem)
    .getPropertyValue("text-autospace");
  return value === "normal" || value.split(" ").includes(type);
}

/**
 * Check if the node is in a ruby inside the container element.
 */
function isInRuby(node: Node, container: Element): boolean {
  const window = node.ownerDocument.defaultView;
  for (
    let elem = node.parentElement;
    elem && elem !== container;
    elem = elem.parentElement
  ) {
    if (
      elem.localName === "ruby" ||
      window.getComputedStyle(elem).display.startsWith("ruby")
    ) {
      return true;
    }
  }
  return false;
}

// Boundaries around punctuation
const PUNCTUATION_BOUNDARY_PATTERN =
  /(?![()\[\]{}])[\p{Ps}\p{Pe}\p{Pf}\p{Pi}、。，．：；､｡\u3000\u3030]\p{M}*(?=\P{M})|.(?=(?![()\[\]{}])[\p{Ps}\p{Pe}\p{Pf}\p{Pi}、。，．：；､｡\u3000\u3030])/gsu;

// Boundaries between ideographs and non-ideographic letters or numerals
const IDEOGRAPH_ALPHA_BOUNDARY_PATTERN =
  /(?!\p{P})[\p{sc=Han}\u3041-\u30FF\u31C0-\u31FF]\p{M}*(?=(?![\p{sc=Han}\u3041-\u30FF\u31C0-\u31FF\uFF01-\uFF60])[\p{L}\p{Nd}])|(?![\p{sc=Han}\u3041-\u30FF\u31C0-\u31FF\uFF01-\uFF60])[\p{L}\p{Nd}]\p{M}*(?=(?!\p{P})[\p{sc=Han}\u3041-\u30FF\u31C0-\u31FF])/gsu;

const IDEOGRAPH_START_PATTERN =
  /^(?!\p{P})[\p{sc=Han}\u3041-\u30FF\u31C0-\u31FF]/u;
const IDEOGRAPH_END_PATTERN =
  /(?!\p{P})[\p{sc=Han}\u3041-\u30FF\u31C0-\u31FF]\p{M}*$/u;

/**
 * Get the type of text-autospace (`ideograph-alpha` or `ideograph-numeric`)
 * that applies at the boundary between the end of text1 and the start of
 * text2, or null if none applies.
 */
function getAutospaceType(
  text1: string,
  text2: string,
): "ideograph-alpha" | "ideograph-numeric" | null {
  if (IDEOGRAPH_END_PATTERN.test(text1)) {
    return /^(?![\p{sc=Han}ぁ-ヿ㇀-ㇿ！-｠])\p{L}/u.test(text2)
      ? "ideograph-alpha"
      : /^(?![！-｠])\p{Nd}/u.test(text2)
        ? "ideograph-numeric"
        : null;
  }
  if (IDEOGRAPH_START_PATTERN.test(text2)) {
    return /(?![\p{sc=Han}ぁ-ヿ㇀-ㇿ！-｠])\p{L}\p{M}*$/u.test(text1)
      ? "ideograph-alpha"
      : /(?![！-｠])\p{Nd}\p{M}*$/u.test(text1)
        ? "ideograph-numeric"
        : null;
  }
  return null;
}

function isAutospaceEnabled(
  autospace: Autospace,
  type: "ideograph-alpha" | "ideograph-numeric",
): boolean {
  return type === "ideograph-alpha"
    ? autospace.ideographAlpha
    : autospace.ideographNumeric;
}

/**
 * Get the text-autospace of the container element of the text, or the
 * fallback if the container is not found in the ancestors of the text.
 */
function getAutospaceOf(
  textP: Vtree.NodeContext,
  container: Element,
  fallback: Autospace,
): Autospace {
  for (let p = textP.parent; p; p = p.parent) {
    if (p.viewNode === container) {
      return autospaceFromPropertyValue(p.inheritedProps["text-autospace"]);
    }
  }
  return fallback;
}

/**
 * Get the innermost element containing both nodes.
 */
function getCommonAncestor(node1: Node, node2: Node): Element | null {
  let container = node1.parentElement;
  while (container && !container.contains(node2)) {
    container = container.parentElement;
  }
  return container;
}

const OPENING_PUNCTUATION_START_PATTERN =
  /^[ \t\r\n\f]*[‘“〝（［｛｟\u2329〈《「『【〔〖〘〚]\p{M}*/u;

// Punctuation that may be processed at the end of a line
const LINE_END_PUNCTUATION_PATTERN =
  /[’”〞〟）］｝｠\u232A〉》」』】〕〗〙〛：；、。，．､｡]\p{M}*/gu;

// Characters before which closing punctuation is trimmed by `trim-adjacent`
const ADJACENT_CLOSING_START_PATTERN =
  /^[\p{Pe}\p{Pf}\u00B7\u2027\u30FB\u3000：；、。，．]/u;

/**
 * Check if the text is fullwidth closing punctuation other than brackets and
 * quotation marks. Chromium's native text-spacing-trim does not set it
 * half-width at the end of a line (`allow-end`), while it does so for
 * closing brackets and quotation marks.
 */
function isClosingMark(text: string, lang: string | null): boolean {
  return (
    (lang === "zh-hans" && /^[：；]\p{M}*$/u.test(text)) ||
    (lang !== "zh-hant" && /^[、。，．]\p{M}*$/u.test(text))
  );
}

function isClosingPunctuation(text: string, lang: string | null): boolean {
  return (
    /^[’”〞〟）］｝｠\u232A〉》」』】〕〗〙〛]\p{M}*$/u.test(text) ||
    isClosingMark(text, lang)
  );
}

// Characters that cannot start a line (closing punctuation, etc.)
const NO_BREAK_BEFORE_PATTERN =
  /^[\p{Pe}\p{Pf}、。，．：；！？!?‼⁇⁈⁉・ゝゞヽヾ々〻､｡]/u;
// White space after which a line may break
const BREAKING_SPACE_PATTERN = /^[ \t\n\r\f\u200B]/u;
// Ideographs and kana before which a line may break, except with
// `word-break: keep-all`. Small kana and iteration marks are excluded, since
// a line may not break before them with `line-break: strict`.
const IDEOGRAPH_LINE_START_PATTERN =
  /^(?![ぁぃぅぇぉっゃゅょゎゕゖァィゥェォッャュョヮヵヶ々〻])[\p{sc=Han}ぁ-ゖァ-ヺ]/u;
// Ideographs and kana after which a line may break, except with
// `word-break: keep-all`
const IDEOGRAPH_LINE_END_PATTERN = /^[\p{sc=Han}ぁ-ゖゝゞァ-ヺーヽヾ]/u;
// Fullwidth opening punctuation before which a line may break
const FULLWIDTH_OPENING_PATTERN = /^[（［｛｟\u2329〈《「『【〔〖〘〚〝]/u;
// Fullwidth closing punctuation after which a line may break
const FULLWIDTH_CLOSING_PATTERN =
  /^[）］｝｠\u232A〉》」』】〕〗〙〛〞〟、。，．､｡]/u;

/**
 * Check if a line may break between the two characters in wrapping text.
 * Only the certain line break opportunities are detected: after breaking white space, between
 * fullwidth closing punctuation and an ideograph or fullwidth opening
 * punctuation, and between ideographs unless `word-break: keep-all`. The
 * others (e.g., between ideographs and Latin letters, or within words with
 * `word-break: break-all`) are not.
 * @param breaksIdeographs whether a line may break between ideographs (i.e.,
 *   `word-break` is not `keep-all`)
 */
function isLineBreakOpportunity(
  prevChar: string,
  char: string,
  breaksIdeographs: boolean,
): boolean {
  if (BREAKING_SPACE_PATTERN.test(prevChar)) {
    // Not a no-break space (U+00A0, etc.)
    return !/^\s/u.test(char) && !NO_BREAK_BEFORE_PATTERN.test(char);
  }
  return (
    (FULLWIDTH_OPENING_PATTERN.test(char) ||
      IDEOGRAPH_LINE_START_PATTERN.test(char)) &&
    (FULLWIDTH_CLOSING_PATTERN.test(prevChar) ||
      (IDEOGRAPH_LINE_END_PATTERN.test(prevChar) &&
        IDEOGRAPH_LINE_START_PATTERN.test(char) &&
        breaksIdeographs))
  );
}

/**
 * Get the rect of the characters from the offset to the end offset in the
 * text node, or undefined if they are not rendered (e.g., white space
 * collapsed at the end of a line).
 */
function getVisibleRect(
  textNode: Text,
  start: number,
  end: number,
): DOMRect | undefined {
  const rect = RangeClientRects.getClientRectsBetween(
    RangeClientRects.at(textNode, start),
    RangeClientRects.at(textNode, end),
  )[0];
  return rect?.width && rect.height ? rect : undefined;
}

function isOnDifferentLines(
  rect1: DOMRect,
  rect2: DOMRect,
  vertical: boolean,
): boolean {
  const center = (r: DOMRect) =>
    vertical ? r.left + r.width / 2 : r.top + r.height / 2;
  const size = (r: DOMRect) => (vertical ? r.width : r.height);
  return (
    Math.abs(center(rect1) - center(rect2)) >
    Math.min(size(rect1), size(rect2)) / 2
  );
}

/**
 * Check if the text with the style does not wrap at soft wrap opportunities.
 */
function isNonWrapping(style: CSSStyleDeclaration): boolean {
  return (
    style.getPropertyValue("text-wrap-mode") === "nowrap" ||
    /^(nowrap|pre)$/.test(style.whiteSpace)
  );
}

/**
 * Check if the punctuation from the offset to the end offset is at the start
 * of a line together with the preceding characters that may not be separated
 * from it by a line break, so that it may have been moved to the next line
 * because it did not fit at the end of the line. Since not all the line break
 * opportunities are detected (see isLineBreakOpportunity()), this may return
 * true for punctuation that was not moved.
 */
function isNearLineStart(
  textNode: Text,
  start: number,
  end: number,
  vertical: boolean,
): boolean {
  const style = textNode.ownerDocument.defaultView.getComputedStyle(
    textNode.parentElement,
  );
  if (isNonWrapping(style)) {
    // No line break opportunity in the text: it may have been moved to the
    // next line with the preceding text in other nodes
    return true;
  }
  const breaksIdeographs = ["normal", "break-all", "break-word"].includes(
    style.wordBreak,
  );
  const text = textNode.data;
  // Characters (with combining marks) before the punctuation within a
  // bounded range
  const chars =
    text.slice(Math.max(0, start - 256), start).match(/[^]\p{M}*/gu) ?? [];
  // Find the start of the run of characters ending with the punctuation, in
  // which no line break opportunity is detected
  let i = chars.length;
  let runStart = start;
  for (let char = text.slice(start, end); i > 0; i--) {
    const prevChar = chars[i - 1];
    if (isLineBreakOpportunity(prevChar, char, breaksIdeographs)) {
      break;
    }
    runStart -= prevChar.length;
    char = prevChar;
  }
  // Check if the punctuation is on a different line from the last rendered
  // character before the run. If the run continues to the text in other
  // nodes or out of the range, it may be at the start of a line.
  const rect = getVisibleRect(textNode, start, end);
  for (let prevEnd = runStart; rect && i > 0; i--) {
    const prevStart = prevEnd - chars[i - 1].length;
    const prevRect = getVisibleRect(textNode, prevStart, prevEnd);
    if (prevRect) {
      return isOnDifferentLines(rect, prevRect, vertical);
    }
    prevEnd = prevStart;
  }
  return true;
}

/**
 * Check if the punctuation from the offset to the end offset is at the end of
 * a line, or may be so since the following text is in other nodes.
 */
function isAtLineEnd(
  textNode: Text,
  start: number,
  end: number,
  vertical: boolean,
): boolean {
  const rect = getVisibleRect(textNode, start, end);
  if (!rect) {
    return false;
  }
  for (const match of textNode.data.slice(end).matchAll(/[^]\p{M}*/gu)) {
    const nextStart = end + match.index;
    const nextRect = getVisibleRect(
      textNode,
      nextStart,
      nextStart + match[0].length,
    );
    if (nextRect) {
      return isOnDifferentLines(rect, nextRect, vertical);
    }
  }
  return true;
}

/**
 * Position of a text node in its block, as far as it is known before the text
 * spacing is processed. Each may be true for text not at the position.
 */
type TextPosition = {
  // The text may be at the start of the block
  mayBeFirstInBlock: boolean;
  // The text may be at the start of a block fragment that does not start a
  // line of the block (e.g., the block is continued from the previous column)
  mayBeContinued: boolean;
  // The text may be at the end of the block
  mayBeLastInBlock: boolean;
};

// Opening punctuation that hangs with hanging-punctuation `first`
const HANGING_FIRST_START_PATTERN =
  /^[ \t\r\n\f]*(?![()\[\]{}])[\p{Ps}\p{Pf}\p{Pi}\u3000]\p{M}*/u;

// Closing punctuation that hangs with hanging-punctuation `last`
const HANGING_LAST_END_PATTERN =
  /(?![()\[\]{}])[\p{Pe}\p{Pf}\p{Pi}]\p{M}*(?=[ \t\r\n\f]*$)/u;

// Punctuation that hangs with hanging-punctuation `force-end` or `allow-end`
const HANGING_END_PATTERN = /^[、。，．､｡]\p{M}*$/u;

/**
 * Find the first punctuation in the text node, after the offset, that the
 * polyfill needs to process at the end of a line on top of the native
 * text-spacing-trim (see processTextSpacing()), and return its start and end
 * offsets. The punctuation is found with the current layout one at a time,
 * since processing it changes the line breaks after it.
 * @param anywhere whether to find the punctuation regardless of its position
 *   in the line
 */
function findLineEndPunctuation(
  textNode: Text,
  spacing: Spacing,
  vertical: boolean,
  from: number,
  anywhere: boolean,
): [number, number] | null {
  const { allowEnd, trimEnd } = spacing.spacingTrim;
  const { hangingPunctuation, lang } = spacing;
  const hangsEnd = hangingPunctuation.forceEnd || hangingPunctuation.allowEnd;
  if (!spacing.nativeTrim || !(allowEnd || trimEnd || hangsEnd)) {
    return null;
  }
  const text = textNode.data;
  const pattern = new RegExp(LINE_END_PUNCTUATION_PATTERN);
  pattern.lastIndex = from;
  for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
    const start = match.index;
    const end = start + match[0].length;
    if (ADJACENT_CLOSING_START_PATTERN.test(text.slice(end))) {
      continue;
    }
    const hangs = hangsEnd && HANGING_END_PATTERN.test(match[0]);
    // The browser sets closing brackets and quotation marks half-width at
    // the end of a line if they do not otherwise fit (`allow-end`), but not
    // the other closing punctuation. It sets them full-width if they fit.
    const mayBePushed =
      hangs || ((allowEnd || trimEnd) && isClosingMark(match[0], lang));
    const mayBeAtEnd =
      hangs || (trimEnd && isClosingPunctuation(match[0], lang));
    if (
      (mayBePushed || mayBeAtEnd) &&
      (anywhere ||
        (mayBePushed && isNearLineStart(textNode, start, end, vertical)) ||
        (mayBeAtEnd && isAtLineEnd(textNode, start, end, vertical)))
    ) {
      return [start, end];
    }
  }
  return null;
}

/**
 * Get the offsets where the text node needs to be split for the polyfill.
 * @param limit the offsets beyond this are not returned
 */
function getSplitOffsets(
  textNode: Text,
  spacing: Spacing,
  position: TextPosition,
  limit: number,
): number[] {
  const text = textNode.data;
  const offsets: number[] = [];
  function addMatchEnds(pattern: RegExp): void {
    for (const match of text.matchAll(pattern)) {
      offsets.push(match.index + match[0].length);
    }
  }
  // Separate the punctuation matched after optional leading white space
  function addMatch(match: RegExpMatchArray | null): void {
    if (match) {
      offsets.push(match[0].match(/^[ \t\r\n\f]*/)[0].length, match[0].length);
    }
  }
  if (spacing.nativeTrim) {
    // The punctuation at the ends of lines is found later, one at a time
    // (see findLineEndPunctuation())
    if (position.mayBeContinued && spacing.spacingTrim.spaceFirst) {
      addMatch(text.match(OPENING_PUNCTUATION_START_PATTERN));
    }

    // The punctuation that may hang (see processTextSpacing())
    const { hangingPunctuation } = spacing;
    if (position.mayBeFirstInBlock && hangingPunctuation.first) {
      addMatch(text.match(HANGING_FIRST_START_PATTERN));
    }
    if (position.mayBeLastInBlock && hangingPunctuation.last) {
      const match = text.match(HANGING_LAST_END_PATTERN);
      if (match) {
        offsets.push(match.index, match.index + match[0].length);
      }
    }
  } else if (
    spacing.chromiumVoTrFallback ||
    !isSpacingTrimNone(spacing.spacingTrim) ||
    !isHangingPunctuationNone(spacing.hangingPunctuation)
  ) {
    addMatchEnds(PUNCTUATION_BOUNDARY_PATTERN);
  }
  if (
    !spacing.nativeAutospace &&
    (spacing.autospace.ideographAlpha || spacing.autospace.ideographNumeric)
  ) {
    addMatchEnds(IDEOGRAPH_ALPHA_BOUNDARY_PATTERN);
  }
  return [...new Set(offsets)]
    .filter((offset) => offset > 0 && offset < text.length && offset <= limit)
    .sort((a, b) => a - b);
}

/**
 * Split the text node at the offsets, and return the text nodes.
 */
function splitTextNode(node: Text, offsets: number[]): Text[] {
  if (!offsets.length) {
    return [node];
  }
  const data = node.data;
  const nodes = [node];
  // Build the following text nodes off-tree instead of repeatedly splitting
  // the original node.
  const fragment = node.ownerDocument.createDocumentFragment();
  offsets.forEach((offset, i) => {
    const sibling = node.ownerDocument.createTextNode(
      data.slice(offset, offsets[i + 1]),
    );
    fragment.appendChild(sibling);
    nodes.push(sibling);
  });
  node.data = data.slice(0, offsets[0]);
  node.after(fragment);
  return nodes;
}

/**
 * Split the view text node of the check point at the offsets, and return the
 * check points for the text nodes, preserving the offsets in the source node
 * and the box offsets for pagination.
 */
export function splitCheckPoint(
  point: Vtree.RenderedNodeContext,
  offsets: number[],
): Vtree.RenderedNodeContext[] {
  const nodes = splitTextNode(point.viewNode as Text, offsets);
  if (nodes.length === 1) {
    return [point];
  }
  let offset = 0;
  return nodes.map((node) => {
    const p = point.copy().modify();
    p.viewNode = node;
    p.offsetInNode += offset;
    p.boxOffset += offset;
    offset += node.length;
    return p;
  });
}

/**
 * Get the offset in the long text node beyond which the text is more than a
 * column after the current column. It need not be processed now, since it
 * will be processed again in the next column. (Issue #1256)
 */
function getLookaheadLimit(textNode: Text, vertical: boolean): number {
  const length = textNode.length;
  if (length <= 1024) {
    return length;
  }
  const isBeyondLookahead = (offset: number): boolean => {
    const rect = RangeClientRects.getClientRectsBetween(
      RangeClientRects.at(textNode, offset),
      RangeClientRects.at(textNode, offset + 1),
    )[0];
    return (
      !!rect && LayoutHelper.checkIfBeyondColumnBreaks(rect, vertical) >= 2
    );
  };
  if (!isBeyondLookahead(length - 1)) {
    return length;
  }
  let low = 0;
  let high = length - 1;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (isBeyondLookahead(mid)) {
      high = mid;
    } else {
      low = mid + 1;
    }
  }
  return low;
}

export class TextSpacingPolyfill {
  getPolyfilledInheritedProps() {
    return ["hanging-punctuation", "text-autospace", "text-spacing-trim"];
  }

  processGeneratedContent(
    element: HTMLElement,
    autospaceVal: Css.Val,
    spacingTrimVal: Css.Val,
    hangingPunctuationVal: Css.Val,
    lang: string | null,
    vertical: boolean,
  ): void {
    const spacing = resolveSpacing(
      element,
      autospaceVal,
      spacingTrimVal,
      hangingPunctuationVal,
      normalizeLang(lang),
      vertical,
    );
    setNativeTrim(element, spacing, spacing.nativeTrim);

    if (isSpacingNone(spacing)) {
      return;
    }

    const whiteSpaceSave = element.style.whiteSpace;
    if ((vertical ? element.offsetHeight : element.offsetWidth) === 0) {
      // Prevent wrong line wrapping
      element.style.whiteSpace = "pre";
    }

    // Generated content is short, so all the punctuation that may be
    // processed at the end of a line is split
    const findAllLineEndPunctuation = (node: Text): number[] => {
      const offsets: number[] = [];
      let found = findLineEndPunctuation(node, spacing, vertical, 0, true);
      while (found) {
        offsets.push(...found);
        found = findLineEndPunctuation(node, spacing, vertical, found[1], true);
      }
      return offsets;
    };
    const textWalker = element.ownerDocument.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
    );
    const textNodes: Text[] = [];
    while (textWalker.nextNode()) {
      textNodes.push(textWalker.currentNode as Text);
    }
    // Get all the offsets before splitting, which changes the layout
    textNodes
      .map((node, i) => ({
        node,
        offsets: [
          ...getSplitOffsets(
            node,
            spacing,
            {
              mayBeFirstInBlock: i === 0,
              mayBeContinued: false,
              mayBeLastInBlock: i === textNodes.length - 1,
            },
            node.length,
          ),
          ...findAllLineEndPunctuation(node),
        ]
          .filter((offset) => offset > 0 && offset < node.length)
          .sort((a, b) => a - b),
      }))
      .forEach(({ node, offsets }) => splitTextNode(node, offsets));

    const walker = element.ownerDocument.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
    );
    let prevNode: Text | null = null;
    let nextNode: Text | null = null;
    for (let node = walker.nextNode() as Text | null; node; node = nextNode) {
      nextNode = walker.nextNode() as Text | null;
      const isFirstInBlock = !prevNode;
      const isFirstAfterForcedLineBreak =
        !prevNode || prevNode.textContent.endsWith("\n");
      const isLastBeforeForcedLineBreak =
        !nextNode || nextNode.textContent.startsWith("\n");
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
        spacing,
        () => spacing.autospace,
        vertical,
      );
      prevNode = node;
    }

    element.style.whiteSpace = whiteSpaceSave;
  }

  postLayoutBlock(
    nodeContext: Vtree.NodeContext,
    checkPoints: Vtree.RenderedNodeContext[],
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
      if (elem.hasAttribute(LayoutHelper.SPECIAL_ATTR)) {
        return true;
      }
      const { position, float } = elem.style ?? {};
      return (
        position === "absolute" ||
        position === "fixed" ||
        !!(float && float !== "none")
      );
    }

    function checkIfFirstInBlock(): boolean {
      const p = checkPoints[0];
      for (let pp: Vtree.NodeContext | null = p; ; pp = pp.parent) {
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

    function findPrevNodeAtFragmentStart(): {
      nodeContext: Vtree.NodeContext;
      prevNode: Node;
    } | null {
      for (
        let p: Vtree.NodeContext | null = checkPoints[0];
        p && p.inline;
        p = p.parent
      ) {
        const sibling = p.viewNode?.previousSibling;
        const prevNode =
          sibling &&
          sibling.nodeType === Node.TEXT_NODE &&
          /^[ \t\r\n\f]*$/.test(sibling.textContent) &&
          p.whitespace !== Vtree.Whitespace.PRESERVE
            ? sibling.previousSibling
            : sibling;
        if (prevNode) {
          return { nodeContext: p, prevNode };
        }
      }
      return null;
    }

    function checkIfAfterForcedLineBreak(): boolean {
      const found = findPrevNodeAtFragmentStart();
      if (!found) {
        return false;
      }
      const p = found.nodeContext;
      for (
        let prevNode: Node | null = found.prevNode;
        prevNode;
        prevNode = prevNode.lastChild
      ) {
        if (prevNode.nodeType === Node.ELEMENT_NODE) {
          if ((prevNode as Element).localName === "br") {
            return true;
          }
          const display = (prevNode as HTMLElement).style?.display;
          if (display && display !== "inline") {
            return !/^(inline|ruby)\b/.test(display);
          }
        } else if (prevNode.nodeType === Node.TEXT_NODE) {
          if (p.whitespace === Vtree.Whitespace.PRESERVE) {
            if (prevNode.textContent?.endsWith("\n")) {
              return true;
            }
          } else if (p.whitespace === Vtree.Whitespace.NEWLINE) {
            if (/\n[ \t\r\n\f]*$/.test(prevNode.textContent)) {
              return true;
            }
          }
        }
      }
      return false;
    }

    function asTextCheckPoint(
      p: Vtree.RenderedNodeContext,
    ): Vtree.TextNodeContext | null {
      return !p.after && p.inline && !p.display
        ? Vtree.asTextNodeContext(p)
        : null;
    }

    // Get the text check point to be processed: a text node in the block,
    // not detached (see the deferred tails below) or ignorable
    function getTextToProcess(
      p: Vtree.RenderedNodeContext,
    ): Vtree.TextNodeContext | null {
      const textP = asTextCheckPoint(p);
      return textP?.viewNode.parentNode &&
        !Vtree.canIgnore(textP.viewNode, textP.whitespace)
        ? textP
        : null;
    }

    function getLang(textP: Vtree.TextNodeContext): string | null {
      return normalizeLang(
        textP.lang ??
          textP.parent.lang ??
          nodeContext?.lang ??
          nodeContext?.parent?.lang,
      );
    }

    // Resolve the text spacing of the text in each element. The native
    // text-spacing-trim is used only if all the text in the inline formatting
    // context can use it, since the browser cannot trim the punctuation
    // adjacent to the punctuation trimmed by the polyfill. The elements of
    // ignorable white space are included, since a different style from the
    // adjacent text may change the shaping of the text.
    const spacings = new Map<HTMLElement, Spacing>();
    const blockContainers = new Map<HTMLElement, HTMLElement>();
    const fallbackBlockContainers = new Set<HTMLElement>();
    for (const p of checkPoints) {
      const textP = asTextCheckPoint(p);
      const element = textP?.viewNode.parentElement;
      if (
        !element ||
        spacings.has(element) ||
        element.namespaceURI !== Base.NS.XHTML ||
        element.localName === "viv-ts-inner" ||
        element.dataset?.["mathTypeset"] === "true"
      ) {
        continue;
      }
      const spacing = resolveSpacing(
        element,
        textP.inheritedProps["text-autospace"],
        textP.inheritedProps["text-spacing-trim"],
        textP.inheritedProps["hanging-punctuation"],
        getLang(textP),
        textP.vertical,
      );
      spacings.set(element, spacing);
      const blockContainer = findBlockContainer(textP.viewNode) ?? element;
      blockContainers.set(element, blockContainer);
      if (!spacing.nativeTrim) {
        fallbackBlockContainers.add(blockContainer);
      }
    }
    // Check the boundaries between the text in different elements, which the
    // checks for each element do not cover
    let prevTextP: Vtree.TextNodeContext | null = null;
    for (const p of checkPoints) {
      const textP = getTextToProcess(p);
      if (!textP) {
        continue;
      }
      const prevP = prevTextP;
      prevTextP = textP;
      const element1 = prevP?.viewNode.parentElement;
      const element2 = textP.viewNode.parentElement;
      const spacing1 = spacings.get(element1);
      const spacing2 = spacings.get(element2);
      const blockContainer = blockContainers.get(element2);
      if (
        element1 === element2 ||
        !spacing1 ||
        !spacing2 ||
        blockContainers.get(element1) !== blockContainer
      ) {
        continue;
      }
      const text1 = prevP.viewNode.data;
      const text2 = textP.viewNode.data;
      // The browser may not trim punctuation adjacent to one from another
      // font
      if (
        spacing1.nativeTrim &&
        spacing2.nativeTrim &&
        !fallbackBlockContainers.has(blockContainer) &&
        !NativeTextSpacing.supportsTrimPair(
          element1,
          text1.match(/.\p{M}*$/su)?.[0][0] ?? "",
          element2,
          text2[0] ?? "",
          spacing2.lang,
          textP.vertical,
        )
      ) {
        fallbackBlockContainers.add(blockContainer);
      }
      // The native text-autospace inserts the spacing at an element boundary
      // if it is enabled on both sides, even if it is disabled on the
      // innermost element containing the boundary (see processTextSpacing()).
      // Use the polyfill for the text on one side then.
      const type = getAutospaceType(text1, text2);
      if (
        type &&
        spacing1.nativeAutospace &&
        spacing2.nativeAutospace &&
        isAutospaceEnabled(spacing1.autospace, type) &&
        isAutospaceEnabled(spacing2.autospace, type)
      ) {
        const container = getCommonAncestor(prevP.viewNode, textP.viewNode);
        if (
          container &&
          !isAutospaceEnabled(
            getAutospaceOf(textP, container, spacing2.autospace),
            type,
          )
        ) {
          spacing2.nativeAutospace = false;
          element2.style.setProperty("text-autospace", "no-autospace");
        }
      }
    }
    for (const [element, spacing] of spacings) {
      setNativeTrim(
        element,
        spacing,
        spacing.nativeTrim &&
          !fallbackBlockContainers.has(blockContainers.get(element)),
      );
    }

    const reshapeTargets = new Set<HTMLElement>();
    const splitBlockContainers = new Set<HTMLElement>();
    // Split the text check point at the index, and update the after check
    // point of the text node to refer to the last part
    const splitAt = (
      index: number,
      offsets: number[],
    ): Vtree.RenderedNodeContext[] => {
      const original = checkPoints[index].viewNode;
      const blockContainer = blockContainers.get(original.parentElement);
      const points = splitCheckPoint(checkPoints[index], offsets);
      checkPoints.splice(index, 1, ...points);
      for (let j = index + points.length; j < checkPoints.length; j++) {
        if (checkPoints[j].after && checkPoints[j].viewNode === original) {
          const after = checkPoints[j].copy().modify();
          after.viewNode = points[points.length - 1].viewNode;
          checkPoints[j] = after;
          break;
        }
      }
      if (blockContainer) {
        splitBlockContainers.add(blockContainer);
        reshapeTargets.add(blockContainer);
      }
      return points;
    };

    // Split the text nodes where the polyfill needs character boundaries.
    // All the offsets are found before splitting, which changes the layout.
    const splits: { index: number; offsets: number[]; deferTail: boolean }[] =
      [];
    const firstTextIndex = checkPoints.findIndex(getTextToProcess);
    let lastTextIndex = checkPoints.length - 1;
    while (
      lastTextIndex >= 0 &&
      !getTextToProcess(checkPoints[lastTextIndex])
    ) {
      lastTextIndex--;
    }
    checkPoints.forEach((p, index) => {
      const textP = getTextToProcess(p);
      const spacing = spacings.get(textP?.viewNode.parentElement);
      if (!spacing || isSpacingNone(spacing)) {
        return;
      }
      // The first or last text in an inline-block may be at the start or end
      // of the block (see the main loop below)
      const inInlineBlock = textP.parent.display === "inline-block";
      const position: TextPosition = {
        mayBeFirstInBlock:
          (index === firstTextIndex && isFirstFragment) || inInlineBlock,
        mayBeContinued: index === firstTextIndex && !isAfterForcedLineBreak,
        mayBeLastInBlock: index === lastTextIndex || inInlineBlock,
      };
      const textNode = textP.viewNode;
      let limit = getLookaheadLimit(textNode, textP.vertical);
      const offsets = getSplitOffsets(textNode, spacing, position, limit);
      // Separate the text beyond the lookahead, at a character boundary
      limit += textNode.data
        .slice(limit)
        .match(/^[\p{M}\uDC00-\uDFFF]*/u)[0].length;
      const deferTail = limit < textNode.length;
      if (deferTail && offsets[offsets.length - 1] !== limit) {
        offsets.push(limit);
      }
      if (offsets.length) {
        splits.push({ index, offsets, deferTail });
      }
    });
    const deferredNodes: Text[] = [];
    for (const { index, offsets, deferTail } of splits.reverse()) {
      const points = splitAt(index, offsets);
      if (deferTail) {
        deferredNodes.push(points[points.length - 1].viewNode as Text);
      }
    }

    // The text beyond the lookahead is not needed while processing the text
    // spacing. Keeping it in the document would make the browser lay out all
    // of it again for every change, so it is detached temporarily.
    const deferred = deferredNodes.map((node) => {
      const placeholder = node.ownerDocument.createComment("");
      node.replaceWith(placeholder);
      return { node, placeholder };
    });

    // The text checked for the punctuation to be processed at the end of a
    // line (see below)
    const lineEndChecked = new Set<Node>();
    let iFirst = -1;
    try {
      for (let i = 0; i < checkPoints.length; i++) {
        const p = checkPoints[i];
        const textP = getTextToProcess(p);
        if (textP) {
          if (iFirst < 0) {
            iFirst = i;
          }
          const element = textP.viewNode.parentElement;
          const spacing = spacings.get(element);
          if (
            !spacing ||
            (isSpacingNone(spacing) &&
              !IDEOGRAPH_START_PATTERN.test(textP.viewNode.data) &&
              !IDEOGRAPH_END_PATTERN.test(textP.viewNode.data))
          ) {
            // The text with no text spacing may still need the autospace at
            // the boundaries with adjacent text (see processTextSpacing())
            continue;
          }
          if (/\b(flex|grid)\b/.test(textP.parent.display ?? "")) {
            // Cannot process if parent is flex or grid. (Issue #926)
            continue;
          }
          // Separate the first punctuation that may need processing at the
          // end of a line, found with the layout after the preceding text has
          // been processed, and process the text again from the first part.
          // The parts up to the punctuation need not be checked again.
          const found = lineEndChecked.has(textP.viewNode)
            ? null
            : findLineEndPunctuation(
                textP.viewNode,
                spacing,
                textP.vertical,
                0,
                false,
              );
          const foundOffsets =
            found?.filter(
              (offset) => offset > 0 && offset < textP.viewNode.length,
            ) ?? [];
          if (foundOffsets.length) {
            let end = 0;
            for (const point of splitAt(i, foundOffsets)) {
              end += (point.viewNode as Text).length;
              if (end <= found[1]) {
                lineEndChecked.add(point.viewNode);
              }
            }
            i--;
            continue;
          }
          let prevNode: Node | null = null;
          let nextNode: Node | null = null;
          let isFirstAfterBreak = i === iFirst;
          let isFirstInBlock = i === iFirst && isFirstFragment;
          let isFirstAfterForcedLineBreak =
            i === iFirst && isAfterForcedLineBreak;
          let isLastBeforeForcedLineBreak = false;
          let isLastInBlock = false;

          function checkIfFirstAfterForcedLineBreak(
            prevP: Vtree.NodeContext,
          ): boolean {
            if (prevP.viewNode?.nodeType === Node.ELEMENT_NODE) {
              return (prevP.viewNode as Element).localName === "br";
            }
            if (prevP.viewNode?.nodeType === Node.TEXT_NODE) {
              const prevTextNode = prevP.viewNode as Text;
              if (prevP.whitespace === Vtree.Whitespace.PRESERVE) {
                if (prevTextNode.textContent?.endsWith("\n")) {
                  return true;
                }
              } else if (prevP.whitespace === Vtree.Whitespace.NEWLINE) {
                if (/\n[ \t\r\n\f]*$/.test(prevTextNode.textContent)) {
                  return true;
                }
              }
              if (prevTextNode.previousElementSibling?.localName === "br") {
                return Vtree.canIgnore(prevTextNode, prevP.whitespace);
              }
            }
            return false;
          }

          function checkIfLastBeforeForcedLineBreak(
            nextP: Vtree.NodeContext,
          ): boolean {
            if (nextP.viewNode?.nodeType === Node.ELEMENT_NODE) {
              return (nextP.viewNode as Element).localName === "br";
            }
            if (nextP.viewNode?.nodeType === Node.TEXT_NODE) {
              const nextTextNode = nextP.viewNode as Text;
              if (nextP.whitespace === Vtree.Whitespace.PRESERVE) {
                if (nextTextNode.textContent?.startsWith("\n")) {
                  return true;
                }
              } else if (nextP.whitespace === Vtree.Whitespace.NEWLINE) {
                if (/^[ \t\r\n\f]*\n/.test(nextTextNode.textContent)) {
                  return true;
                }
              }
              if (nextTextNode.nextElementSibling?.localName === "br") {
                return Vtree.canIgnore(nextTextNode, nextP.whitespace);
              }
            }
            return false;
          }

          for (let prev = i - 1; prev >= 0; prev--) {
            const prevP = checkPoints[prev];
            if (!prevP.viewNode?.parentNode) {
              // Text beyond the lookahead, detached while processing: it is
              // neither adjacent text in this column nor the edge of the block
              break;
            }
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
            // Issue #868: Look inside footnote-call for the last text node.
            // BUT skip and look further back if we're inside that same footnote-call.
            if (
              prevP.viewNode?.nodeType === Node.ELEMENT_NODE &&
              PseudoElement.getPseudoName(prevP.viewNode as Element) ===
                "footnote-call"
            ) {
              if (prevP.viewNode.contains(textP.viewNode)) {
                continue;
              }
              const lastText = LayoutHelper.findLastTextNodeInElement(
                prevP.viewNode,
              );
              if (lastText) {
                prevNode = lastText;
                break;
              }
            }
            if (
              (prevP.display && !/^(inline|ruby)\b/.test(prevP.display)) ||
              (prevP.viewNode?.nodeType === Node.ELEMENT_NODE &&
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
            if (!nextP.viewNode?.parentNode) {
              // Text beyond the lookahead, detached while processing: it is
              // neither adjacent text in this column nor the edge of the block
              break;
            }
            if (checkIfLastBeforeForcedLineBreak(nextP)) {
              isLastBeforeForcedLineBreak = true;
              break;
            }
            if (
              nextP.viewNode !== textP.viewNode &&
              !nextP.display &&
              nextP.viewNode.nodeType === Node.TEXT_NODE &&
              nextP.viewNode.textContent.length > 0
            ) {
              nextNode = nextP.viewNode;
              break;
            }
            if (
              (nextP.display && !/^(inline|ruby)\b/.test(nextP.display)) ||
              (nextP.viewNode?.nodeType === Node.ELEMENT_NODE &&
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
          if (textP.parent.display === "inline-block") {
            // an inline-block box enclosing rendered checkpoints has its
            // element view
            const inlineBlock = Vtree.asElementNodeContext(textP.parent);
            Asserts.assert(inlineBlock);
            if (!isFirstInBlock) {
              let firstInInlineBlock = inlineBlock.viewNode.firstChild;
              while (Vtree.canIgnore(firstInInlineBlock, textP.whitespace)) {
                firstInInlineBlock = firstInInlineBlock.nextSibling;
              }
              if (textP.viewNode === firstInInlineBlock) {
                isFirstInBlock = true;
              }
            }
            if (!isLastInBlock) {
              let lastInInlineBlock = inlineBlock.viewNode.lastChild;
              while (Vtree.canIgnore(lastInInlineBlock, textP.whitespace)) {
                lastInInlineBlock = lastInInlineBlock.previousSibling;
              }
              if (textP.viewNode === lastInInlineBlock) {
                isLastInBlock = true;
              }
            }
          }
          const autospaceAt = (container: Element): Autospace =>
            getAutospaceOf(textP, container, spacing.autospace);
          const columnOver = this.processTextSpacing(
            textP.viewNode,
            isFirstAfterBreak,
            isFirstInBlock,
            isFirstAfterForcedLineBreak,
            isLastBeforeForcedLineBreak,
            isLastInBlock,
            prevNode,
            nextNode,
            spacing,
            autospaceAt,
            textP.vertical,
          );
          reshapeTargets.add(blockContainers.get(element));
          if (columnOver > 0) {
            // Stop processing if the node is moved to next column
            // because it will be processed again in the next column.
            // (Issue #1256)
            break;
          }
        }
      }
    } finally {
      for (const { node, placeholder } of deferred) {
        placeholder.replaceWith(node);
      }
    }
    for (const target of reshapeTargets) {
      if (
        splitBlockContainers.has(target) ||
        target.querySelector("viv-ts-open, viv-ts-close, viv-ts-thin-sp")
      ) {
        reshapeBlockContainer(target);
      }
    }
  }

  private processTextSpacing(
    textNode: Text,
    isFirstAfterBreak: boolean,
    isFirstInBlock: boolean,
    isFirstAfterForcedLineBreak: boolean,
    isLastBeforeForcedLineBreak: boolean,
    isLastInBlock: boolean,
    prevNode: Node | null,
    nextNode: Node | null,
    spacing: Spacing,
    autospaceAt: (container: Element) => Autospace,
    vertical: boolean,
  ): number {
    const text = textNode.textContent;
    const document = textNode.ownerDocument;
    const { spacingTrim, nativeTrim, hangingPunctuation, lang } = spacing;
    let columnOver = 0;

    function isAtStartOfLine(): boolean {
      if (isFirstAfterBreak) {
        return true;
      }
      if (!prevNode) {
        return false;
      }
      const rect = RangeClientRects.getClientRectsOfNode(textNode)[0];
      if (!rect) {
        return false;
      }
      const prevRects = RangeClientRects.getClientRectsOfNode(prevNode);
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
      const rect = RangeClientRects.getClientRectsOfNode(textNode)[0];
      if (!rect) {
        return false;
      }
      columnOver ||= LayoutHelper.checkIfBeyondColumnBreaks(rect, vertical);
      const nextRect = RangeClientRects.getClientRectsOfNode(nextNode)[0];
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

    let chromiumVoTrFallbackOnly = false;
    let hangingFirst = false;
    let hangingLast = false;
    let hangingEnd = false;
    let tagName: "viv-ts-open" | "viv-ts-close" | undefined;
    const needsChromiumVoTrFallback =
      spacing.chromiumVoTrFallback && isChromiumVoTrFallback(text, vertical);

    // Right-to-left text is supported only by hanging-punctuation `first` and
    // `last`, and CJK-specific spacing and hanging are left-to-right only
    // (see getTextDirection())
    let direction: "ltr" | "rtl" | null | undefined;
    function textDirection(): "ltr" | "rtl" | null {
      if (direction === undefined) {
        direction = getTextDirection(textNode);
      }
      return direction;
    }

    if (
      isFirstInBlock &&
      hangingPunctuation.first &&
      /^[\p{Ps}\p{Pf}\p{Pi}'"\u3000]\p{M}*$/u.test(text) &&
      textDirection() &&
      !hasInlineBorderOrPaddingAtEdge(
        textNode,
        "start",
        textDirection() === "rtl",
        vertical,
      )
    ) {
      // hanging-punctuation: first
      tagName = "viv-ts-open";
      hangingFirst = true;
    } else if (
      isLastInBlock &&
      hangingPunctuation.last &&
      /^[\p{Pe}\p{Pf}\p{Pi}'"]\p{M}*$/u.test(text) &&
      textDirection() &&
      !hasInlineBorderOrPaddingAtEdge(
        textNode,
        "end",
        textDirection() === "rtl",
        vertical,
      ) &&
      isAfterPrecedingCharacter(textNode, textDirection() === "rtl", vertical)
    ) {
      // hanging-punctuation: last
      tagName = "viv-ts-close";
      hangingLast = true;
    } else if (
      (hangingPunctuation.forceEnd || hangingPunctuation.allowEnd) &&
      /^[、。，．､｡]\p{M}*$/u.test(text) &&
      textDirection() === "ltr"
    ) {
      // hanging-punctuation: force-end | allow-end
      tagName = "viv-ts-close";
      hangingEnd = true;
    } else if (
      (nativeTrim
        ? // The browser sets it full-width at the start of the first line of
          // a block fragment, which may be continued from the previous column
          spacingTrim.spaceFirst &&
          isFirstAfterBreak &&
          !isFirstInBlock &&
          !isFirstAfterForcedLineBreak
        : spacingTrim.trimStart ||
          spacingTrim.spaceFirst ||
          spacingTrim.trimAdjacent) &&
      /^[‘“〝（［｛｟〈〈《「『【〔〖〘〚]\p{M}*$/u.test(text) &&
      textDirection() === "ltr"
    ) {
      // fullwidth opening punctuation
      tagName = "viv-ts-open";
    } else if (
      (nativeTrim
        ? // The browser does not set it half-width at the end of a line
          (spacingTrim.allowEnd && isClosingMark(text, lang)) ||
          (spacingTrim.trimEnd && isClosingPunctuation(text, lang))
        : (spacingTrim.trimEnd ||
            spacingTrim.allowEnd ||
            spacingTrim.trimAdjacent) &&
          isClosingPunctuation(text, lang)) &&
      textDirection() === "ltr"
    ) {
      // fullwidth closing punctuation
      tagName = "viv-ts-close";
    } else if (needsChromiumVoTrFallback) {
      tagName = getChromiumVoTrFallbackTagName(text);
      chromiumVoTrFallbackOnly = true;
    }

    if (tagName !== undefined) {
      if (textNode.parentElement?.localName === "viv-ts-inner") {
        // Already processed
        return 0;
      }
      // Wrap the textNode as `<{tagName}><viv-ts-inner>{text}<viv-ts-inner></{tagName}>`
      const outerElem = document.createElement(tagName);
      const innerElem = document.createElement("viv-ts-inner");
      outerElem.appendChild(innerElem);
      textNode.before(outerElem);
      innerElem.appendChild(textNode);

      if (needsChromiumVoTrFallback) {
        const textOrientation =
          document.defaultView.getComputedStyle(outerElem).textOrientation;
        if (textOrientation === "mixed") {
          innerElem.style.textOrientation = "sideways";
        }
      }

      if (chromiumVoTrFallbackOnly) {
        return 0;
      }

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

      // Set the closing punctuation half-width if it then moves to the end of
      // the previous line (allow-end). `viv-ts-auto` sets a space after it to
      // keep it full-width in the middle of a line, but the space does not
      // hang at the end of a line in nonwrapping text, so `viv-ts-trim` is
      // tried there.
      function trimIfMovedToLineEnd(isLast: boolean): void {
        const linePos = linePosition();
        outerElem.className = "viv-ts-auto";
        if (linePos !== linePosition()) {
          return;
        }
        outerElem.className = "";
        if (isNonWrapping(document.defaultView.getComputedStyle(outerElem))) {
          outerElem.className = "viv-ts-trim";
          if (linePos === linePosition() || (!isLast && !isAtEndOfLine())) {
            outerElem.className = "";
          }
        }
      }

      // The classes set below reduce the advance of the punctuation by
      // `--viv-ts-shift` (see VivliostylePolyfillCss): the closing
      // punctuation gets negative margin-inline-start, and its glyph is
      // shifted back to where it was with `position: relative`.
      // - Negative letter-spacing is not used, since browsers apply it on
      //   different sides of the glyph in RTL text, and CSS Text 4 does not
      //   apply it at the end of a line.
      // - Negative margin-inline-end is not used either, since Chromium
      //   wraps the line before the punctuation if it fits only after the
      //   reduction.
      // - An inline-block is not used, since it allows a line break before
      //   the punctuation, is reordered as a neutral character in bidi, and
      //   stops text decorations.

      // Set the advance of the punctuation to be cancelled by
      // hanging-punctuation `first` or `last`
      function setHangingShift(): void {
        const rect = innerElem.getBoundingClientRect();
        innerElem.style.setProperty(
          "--viv-ts-shift",
          `${vertical ? rect.height : rect.width}px`,
        );
      }

      if (isFullWidth || hangingFirst || hangingLast || hangingEnd) {
        if (tagName === "viv-ts-open") {
          if (hangingFirst) {
            setHangingShift();
            outerElem.className = "viv-hang-first";
          } else if (nativeTrim) {
            outerElem.className = "viv-ts-trim";
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
              (prevNode.parentElement?.localName === "viv-ts-inner" &&
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
            setHangingShift();
            outerElem.className = "viv-hang-last";
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
              trimIfMovedToLineEnd(true);
            } else {
              outerElem.className = "viv-ts-space";
            }
          } else if (
            nextNode &&
            /^[\p{Pe}\p{Pf}\u00B7\u2027\u30FB\u3000：；、。，．]/u.test(
              nextNode.textContent,
            )
          ) {
            if (isFullWidth && spacingTrim.trimAdjacent && !nativeTrim) {
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
              trimIfMovedToLineEnd(false);
            }
          }
        }
      }

      if (
        !outerElem.className &&
        // The wrapper of fullwidth punctuation is needed to check for the
        // trimming of the next punctuation by the polyfill (Issue #1003)
        (nativeTrim || !isFullWidth) &&
        !needsChromiumVoTrFallback
      ) {
        // Unwrap the punctuation that needs no adjustment (Issue #1562)
        outerElem.replaceWith(textNode);
      }
    }

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
      if (node1.nodeType === Node.ELEMENT_NODE) {
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
      if (node2.nodeType === Node.ELEMENT_NODE) {
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

    // Insert the spacing of text-autospace at the boundary with the adjacent
    // text node. The spacing at element boundaries is determined by and
    // rendered within the innermost element that contains the boundary (CSS
    // Text 4 § 8.4). The boundary is processed with the text node on the
    // ideograph side.
    function insertAutospace(adjacentNode: Node, isAfter: boolean): void {
      const type = isAfter
        ? getAutospaceType(text, adjacentNode.textContent)
        : getAutospaceType(adjacentNode.textContent, text);
      const container = type && getCommonAncestor(textNode, adjacentNode);
      if (!container) {
        return;
      }
      const autospace = autospaceAt(container);
      if (
        !isAutospaceEnabled(autospace, type) ||
        (vertical &&
          adjacentNode.parentElement !== null &&
          checkUpright(adjacentNode.parentElement)) ||
        (isAfter
          ? checkNonZeroMarginBorderPadding(textNode, adjacentNode)
          : checkNonZeroMarginBorderPadding(adjacentNode, textNode))
      ) {
        return;
      }
      // The native text-autospace inserts the spacing at an element boundary
      // only if it is enabled on both sides (see NativeTextSpacing). Since it
      // is added to the advance of the preceding character, it is rendered
      // within the innermost element only if the preceding character is
      // directly in it. Otherwise, the spacing inserted here (which contains
      // a space character) prevents the native one.
      // In vertical text, Chromium lays out a ruby base after the native
      // spacing overlapping the preceding text.
      if (
        (isAfter ? textNode : adjacentNode).parentElement === container &&
        !(vertical && isInRuby(isAfter ? adjacentNode : textNode, container)) &&
        hasNativeAutospace(textNode.parentElement, type) &&
        hasNativeAutospace(adjacentNode.parentElement, type)
      ) {
        return;
      }
      let ref: ChildNode = textNode;
      while (ref.parentNode !== container) {
        ref = ref.parentElement;
      }
      const thinSp = document.createElement("viv-ts-thin-sp");
      if (isAfter) {
        ref.after(thinSp);
      } else {
        ref.before(thinSp);
      }
    }

    if (prevNode && IDEOGRAPH_START_PATTERN.test(text)) {
      insertAutospace(prevNode, false);
    }
    if (nextNode && IDEOGRAPH_END_PATTERN.test(text)) {
      insertAutospace(nextNode, true);
    }
    return columnOver;
  }

  registerHooks() {
    Plugin.registerHook(
      Plugin.HOOKS.POLYFILLED_INHERITED_PROPS,
      this.getPolyfilledInheritedProps.bind(this),
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

export function processGeneratedContent(
  element: HTMLElement,
  textAutospace: Css.Val,
  textSpacingTrim: Css.Val,
  hangingPunctuation: Css.Val,
  lang: string | null,
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
