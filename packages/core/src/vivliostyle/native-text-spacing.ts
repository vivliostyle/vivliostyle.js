/**
 * Copyright 2026 Vivliostyle Foundation
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
 * @fileoverview NativeTextSpacing - Check if the browser's native
 * text-autospace and text-spacing-trim can be used.
 *
 * CSS.supports() only checks the syntax. Native text-autospace is used only
 * if the browser inserts the spacing in text, and native text-spacing-trim
 * only if the fonts can actually trim the punctuation.
 */

type AutospaceSupport = {
  // The spacing is inserted in a text node
  inText: boolean;
  // The spacing is inserted between adjacent text nodes in an element
  acrossTextNodes: boolean;
  // The spacing is inserted at an element boundary if it is enabled on the
  // following side, even if not on the preceding side (Firefox)
  boundaryByFollowingSide: boolean;
  // The spacing is inserted at an element boundary if it is enabled on the
  // innermost element containing the boundary, even if not on either side
  // (WebKit)
  boundaryByContainer: boolean;
  // In vertical text, the spacing is not inserted next to upright characters
  // (WebKit inserts it)
  vertical: boolean;
};

const autospaceCaches = new WeakMap<Document, AutospaceSupport>();
const trimCaches = new WeakMap<Document, Map<string, boolean>>();

export function supports(property: string, value: string): boolean {
  return typeof CSS !== "undefined" && CSS.supports(property, value);
}

/**
 * Check where the browser inserts the native autospace in the text of an
 * element. The spacing at element boundaries is inserted by the text spacing
 * polyfill, since browsers differ there (see TextSpacingPolyfill).
 */
function getAutospaceSupport(document: Document): AutospaceSupport {
  let result = autospaceCaches.get(document);
  if (result) {
    return result;
  }
  const body = document.body;
  if (!body) {
    return {
      inText: false,
      acrossTextNodes: false,
      boundaryByFollowingSide: false,
      boundaryByContainer: false,
      vertical: false,
    };
  }
  const probe = document.createElement("div");
  probe.style.cssText =
    "all:initial;position:absolute;visibility:hidden;display:block;" +
    "font:100px/1 serif;white-space:pre;text-spacing-trim:space-all;";
  body.appendChild(probe);
  let vertical = false;
  // Measure the texts, those at the indexes (the second one by default) in
  // inner elements with the style if given
  const measure = (
    texts: string[],
    value: string,
    inner?: string,
    indexes = [1],
  ): number => {
    const elem = document.createElement("span");
    elem.style.setProperty("text-autospace", value);
    elem.append(
      ...texts.map((text, i) => {
        if (!inner || !indexes.includes(i)) {
          return text;
        }
        const innerElem = document.createElement("span");
        innerElem.style.cssText = inner;
        innerElem.append(text);
        return innerElem;
      }),
    );
    probe.replaceChildren(elem);
    const rect = elem.getBoundingClientRect();
    return vertical ? rect.height : rect.width;
  };
  // The spacing is 1/8 of the ideographic advance (12.5px)
  const hasSpacing = (
    texts: string[],
    value = "normal",
    inner?: string,
    indexes?: number[],
  ) =>
    measure(texts, value, inner, indexes) -
      measure(
        texts,
        "no-autospace",
        inner && `${inner};text-autospace:no-autospace`,
        indexes,
      ) >
    5;
  result = {
    inText: hasSpacing(["日a"]) && hasSpacing(["a日"]),
    acrossTextNodes: hasSpacing(["日", "a"]) && hasSpacing(["a", "日"]),
    boundaryByFollowingSide: hasSpacing(
      ["日", "a"],
      "no-autospace",
      "text-autospace:normal",
    ),
    boundaryByContainer: hasSpacing(
      ["日", "a"],
      "normal",
      "text-autospace:no-autospace",
      [0, 1],
    ),
    vertical: false,
  };
  probe.style.writingMode = "vertical-rl";
  vertical = true;
  const verticalSpacing = hasSpacing(["日1日"]);
  probe.style.textOrientation = "upright";
  const uprightSpacing = hasSpacing(["日1日"]);
  probe.style.textOrientation = "";
  result.vertical =
    verticalSpacing &&
    !uprightSpacing &&
    !hasSpacing(["日", "12", "日"], "normal", "text-combine-upright:all");
  probe.remove();
  autospaceCaches.set(document, result);
  return result;
}

/**
 * Check if the native text-autospace can be used for the value.
 */
export function supportsAutospace(
  document: Document,
  value: string,
  vertical = false,
): boolean {
  if (value === "no-autospace") {
    return true;
  }
  const support = getAutospaceSupport(document);
  return (
    supports("text-autospace", value) &&
    support.inText &&
    (!vertical || support.vertical)
  );
}

/**
 * Check if the native text-autospace inserts the spacing between adjacent
 * text nodes in an element (WebKit does not).
 */
export function autospacesAcrossTextNodes(document: Document): boolean {
  return getAutospaceSupport(document).acrossTextNodes;
}

/**
 * Check if the native text-autospace inserts the spacing at an element
 * boundary if it is enabled on the following side, even if not on the
 * preceding side (Firefox). Otherwise, it does so only if it is enabled on
 * both sides (Chromium), or determines it by the innermost element containing
 * the boundary (WebKit, see autospacesByContainer()).
 */
export function autospacesByFollowingSide(document: Document): boolean {
  return getAutospaceSupport(document).boundaryByFollowingSide;
}

/**
 * Check if the native text-autospace inserts the spacing at an element
 * boundary if it is enabled on the innermost element containing the boundary,
 * even if not on either side (WebKit). WebKit does not insert it at the start
 * of an element after text, but does at the end of an element before text and
 * between elements.
 */
export function autospacesByContainer(document: Document): boolean {
  return getAutospaceSupport(document).boundaryByContainer;
}

const OPENING = "‘“〝（［｛｟\u2329〈《「『【〔〖〘〚";
const CLOSING_BRACKETS = "’”〞〟）］｝｠\u232A〉》」』】〕〗〙〛";
const MIDDLE = "\u00B7\u2027\u30FB\u3000：；、。，．";
const PUNCTUATION_PATTERN = new RegExp(
  `[${OPENING}${CLOSING_BRACKETS}${MIDDLE}]`,
  "gu",
);
const PUNCTUATION_PAIR_PATTERN = new RegExp(
  `(?=([${OPENING}${CLOSING_BRACKETS}${MIDDLE}]{2}))`,
  "gu",
);

/**
 * Check if the pair of adjacent punctuation is trimmed by `trim-adjacent`
 * (see TextSpacingPolyfill.processTextSpacing()).
 */
function isTrimmedPair(
  first: string,
  second: string,
  lang: string | null,
): boolean {
  if (!first || !second) {
    return false;
  }
  const isClosing = (char: string) =>
    CLOSING_BRACKETS.includes(char) ||
    (lang !== "zh-hant" && "、。，．".includes(char)) ||
    (lang === "zh-hans" && "：；".includes(char));
  return (
    // Opening punctuation after punctuation
    (OPENING.includes(second) &&
      (OPENING.includes(first) ||
        CLOSING_BRACKETS.includes(first) ||
        MIDDLE.includes(first))) ||
    // Closing punctuation before closing or middle punctuation
    (isClosing(first) &&
      (CLOSING_BRACKETS.includes(second) || MIDDLE.includes(second)))
  );
}

/**
 * Check if the punctuation trimmed in the pair (see isTrimmedPair()) needs
 * trimming, given whether each character is full-width. Narrow punctuation
 * needs no trimming, and an opening punctuation is not trimmed after a narrow
 * closing bracket (Issue #1003). Otherwise a narrow neighbor does not prevent
 * the trimming (e.g., `。` before a narrow `·`).
 */
function needsTrimming(
  first: string,
  second: string,
  isFullWidth: (index: number) => boolean,
): boolean {
  if (OPENING.includes(second)) {
    return (
      isFullWidth(1) && (!CLOSING_BRACKETS.includes(first) || isFullWidth(0))
    );
  }
  return isFullWidth(0);
}

// The properties that affect the glyphs and the trimming of punctuation
const TRIM_PROBE_PROPERTIES = [
  "font-family",
  "font-size",
  "font-style",
  "font-weight",
  "font-stretch",
  "font-feature-settings",
  "font-variation-settings",
  "font-kerning",
  "font-optical-sizing",
  "font-size-adjust",
  "font-synthesis",
  "letter-spacing",
  "word-spacing",
  "text-transform",
  "font-variant-east-asian",
  "font-variant-ligatures",
  "writing-mode",
  "text-orientation",
  "text-combine-upright",
  "direction",
];

function getTrimCache(document: Document): Map<string, boolean> {
  let cache = trimCaches.get(document);
  if (!cache) {
    cache = new Map();
    trimCaches.set(document, cache);
    document.fonts?.addEventListener("loadingdone", () => cache.clear());
    document.fonts?.addEventListener("loadingerror", () => cache.clear());
  }
  return cache;
}

/**
 * Create an element to measure text with the style values of
 * TRIM_PROBE_PROPERTIES.
 */
function createTrimProbe(
  document: Document,
  tagName: string,
  values: string[],
  lang: string | null,
): HTMLElement {
  const probe = document.createElement(tagName);
  probe.style.cssText =
    "all:initial;position:absolute;visibility:hidden;display:block;" +
    "white-space:pre;width:max-content;height:max-content;" +
    "text-autospace:no-autospace;";
  TRIM_PROBE_PROPERTIES.forEach((p, i) =>
    probe.style.setProperty(p, values[i]),
  );
  if (lang) {
    probe.lang = lang;
  }
  return probe;
}

/**
 * Check if the native text-spacing-trim can be used for the value and the
 * punctuation in the element, checking the actual font cascade, including
 * fallback glyphs and vertical fonts.
 */
export function supportsTrim(
  element: HTMLElement,
  value: string,
  lang: string | null,
  vertical: boolean,
): boolean {
  if (!supports("text-spacing-trim", value)) {
    return false;
  }
  if (value === "space-all") {
    return true;
  }
  // Test every punctuation used in the element, not just a representative
  // glyph from the first font: different characters can use different fonts.
  // Test also the adjacent pairs of different punctuation, since the browser
  // may not trim punctuation adjacent to one from another font.
  const text = element.textContent;
  const pairs = new Set<string>();
  for (const char of text.match(PUNCTUATION_PATTERN) ?? []) {
    if (isTrimmedPair(char, char, lang)) {
      pairs.add(char + char);
    }
  }
  for (const match of text.matchAll(PUNCTUATION_PAIR_PATTERN)) {
    const [first, second] = match[1];
    if (first !== second && isTrimmedPair(first, second, lang)) {
      pairs.add(match[1]);
    }
  }
  if (!pairs.size) {
    return true;
  }
  const document = element.ownerDocument;
  const style = document.defaultView.getComputedStyle(element);
  const values = TRIM_PROBE_PROPERTIES.map((p) => style.getPropertyValue(p));
  const key = JSON.stringify([lang, vertical, ...values]);
  const cache = getTrimCache(document);
  const fontSize = parseFloat(style.fontSize);
  let probe: HTMLElement | null = null;
  const measure = (content: string, trim: string): number => {
    if (!probe) {
      probe = createTrimProbe(document, "span", values, lang);
      document.body.appendChild(probe);
    }
    probe.style.setProperty("text-spacing-trim", trim);
    probe.textContent = content;
    const rect = probe.getBoundingClientRect();
    return vertical ? rect.height : rect.width;
  };
  try {
    for (const pair of pairs) {
      const pairKey = `${key}:${pair}`;
      let supported = cache.get(pairKey);
      if (supported === undefined) {
        const isFullWidth = (index: number) =>
          measure(pair[index], "space-all") > fontSize * 0.7;
        supported =
          !needsTrimming(pair[0], pair[1], isFullWidth) ||
          measure(`漢${pair}漢`, "space-all") -
            measure(`漢${pair}漢`, "normal") >
            fontSize * 0.25;
        if (document.fonts?.status !== "loading") {
          cache.set(pairKey, supported);
        }
      }
      if (!supported) {
        return false;
      }
    }
  } finally {
    probe?.remove();
  }
  return true;
}

/**
 * Check if the native text-spacing-trim trims the pair of adjacent
 * punctuation at the boundary of the text in the two elements, with their
 * actual styles. The browser may not trim punctuation adjacent to one from
 * another font.
 */
export function supportsTrimPair(
  element1: HTMLElement,
  char1: string,
  element2: HTMLElement,
  char2: string,
  lang: string | null,
  vertical: boolean,
): boolean {
  if (!isTrimmedPair(char1, char2, lang)) {
    return true;
  }
  const document = element1.ownerDocument;
  const window = document.defaultView;
  const style1 = window.getComputedStyle(element1);
  const style2 = window.getComputedStyle(element2);
  const values1 = TRIM_PROBE_PROPERTIES.map((p) => style1.getPropertyValue(p));
  const values2 = TRIM_PROBE_PROPERTIES.map((p) => style2.getPropertyValue(p));
  const key = JSON.stringify([lang, vertical, values1, values2, char1, char2]);
  const cache = getTrimCache(document);
  const cached = cache.get(key);
  if (cached !== undefined) {
    return cached;
  }
  const probe = createTrimProbe(document, "div", values1, lang);
  const run1 = createTrimProbe(document, "span", values1, lang);
  const run2 = createTrimProbe(document, "span", values2, lang);
  run1.style.display = run2.style.display = "inline";
  run1.style.position = run2.style.position = "static";
  probe.append(run1, run2);
  document.body.appendChild(probe);
  const measure = (trim: string): number => {
    probe.style.setProperty("text-spacing-trim", trim);
    run1.style.setProperty("text-spacing-trim", trim);
    run2.style.setProperty("text-spacing-trim", trim);
    const rect = probe.getBoundingClientRect();
    return vertical ? rect.height : rect.width;
  };
  const fontSize = Math.min(
    parseFloat(style1.fontSize),
    parseFloat(style2.fontSize),
  );
  let supported: boolean;
  try {
    const isFullWidth = (index: number): boolean => {
      run1.textContent = index ? "" : char1;
      run2.textContent = index ? char2 : "";
      const style = index ? style2 : style1;
      return measure("space-all") > parseFloat(style.fontSize) * 0.7;
    };
    supported = !needsTrimming(char1, char2, isFullWidth);
    if (!supported) {
      run1.textContent = `漢${char1}`;
      run2.textContent = `${char2}漢`;
      supported = measure("space-all") - measure("normal") > fontSize * 0.25;
    }
  } finally {
    probe.remove();
  }
  if (document.fonts?.status !== "loading") {
    cache.set(key, supported);
  }
  return supported;
}
