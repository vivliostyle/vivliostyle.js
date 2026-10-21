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
 * if the browser behaves as expected at element boundaries, and native
 * text-spacing-trim only if the fonts can actually trim the punctuation.
 */

const autospaceBoundaryCaches = new WeakMap<Document, boolean>();
const trimCaches = new WeakMap<Document, Map<string, boolean>>();

export function supports(property: string, value: string): boolean {
  return typeof CSS !== "undefined" && CSS.supports(property, value);
}

/**
 * Check if the browser inserts the native autospace at an element boundary
 * only if the text-autospace values on both sides enable it.
 *
 * Text spacing polyfill inserts the spacing at element boundaries where this
 * does not produce the spacing required by the spec, which is determined by
 * the innermost element containing the boundary. Browsers that behave
 * differently (e.g., use the value on one side only) cannot be used with it.
 */
function hasExpectedAutospaceBoundary(document: Document): boolean {
  let result = autospaceBoundaryCaches.get(document);
  if (result !== undefined) {
    return result;
  }
  const body = document.body;
  if (!body) {
    return false;
  }
  const probe = document.createElement("div");
  probe.style.cssText =
    "all:initial;position:absolute;visibility:hidden;display:block;" +
    "font:100px/1 serif;white-space:pre;text-spacing-trim:space-all;";
  body.appendChild(probe);
  const measure = (
    before: string,
    middle: string,
    after: string,
    outer: string,
    inner: string,
  ): number => {
    const outerElem = document.createElement("span");
    const innerElem = document.createElement("span");
    outerElem.style.setProperty("text-autospace", outer);
    innerElem.style.setProperty("text-autospace", inner);
    innerElem.textContent = middle;
    outerElem.append(before, innerElem, after);
    probe.replaceChildren(outerElem);
    return outerElem.getBoundingClientRect().width;
  };
  // [before, middle, after, inner value, whether spacing is expected]
  const cases: [string, string, string, string, boolean][] = [
    ["日", "a", "", "normal", true],
    ["", "a", "日", "normal", true],
    ["日", "a", "", "no-autospace", false],
    ["", "a", "日", "no-autospace", false],
  ];
  result = cases.every(([before, middle, after, inner, expected]) => {
    const spacing =
      measure(before, middle, after, "normal", inner) -
      measure(before, middle, after, "no-autospace", "no-autospace");
    // The spacing is 1/8 of the ideographic advance (12.5px)
    return spacing > 5 === expected;
  });
  probe.remove();
  autospaceBoundaryCaches.set(document, result);
  return result;
}

/**
 * Check if the native text-autospace can be used for the value.
 */
export function supportsAutospace(document: Document, value: string): boolean {
  if (value === "no-autospace") {
    return true;
  }
  return (
    supports("text-autospace", value) && hasExpectedAutospaceBoundary(document)
  );
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
  const isClosing = (char: string) =>
    CLOSING_BRACKETS.includes(char) ||
    (lang !== "zh-hant" && "、。，．".includes(char)) ||
    (lang === "zh-hans" && "：；".includes(char));
  return (
    // Opening punctuation after punctuation
    OPENING.includes(second) ||
    // Closing punctuation before closing or middle punctuation
    (isClosing(first) &&
      (CLOSING_BRACKETS.includes(second) || MIDDLE.includes(second)))
  );
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
  const document = element.ownerDocument;
  const style = document.defaultView.getComputedStyle(element);
  const properties = [
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
  const values = properties.map((p) => style.getPropertyValue(p));
  const key = JSON.stringify([lang, vertical, ...values]);
  let cache = trimCaches.get(document);
  if (!cache) {
    cache = new Map();
    trimCaches.set(document, cache);
    document.fonts?.addEventListener("loadingdone", () => cache.clear());
    document.fonts?.addEventListener("loadingerror", () => cache.clear());
  }
  const fontSize = parseFloat(style.fontSize);
  const text = element.textContent;
  // Test every punctuation used in the element, not just a representative
  // glyph from the first font: different characters can use different fonts.
  // Test also the adjacent pairs of different punctuation, since the browser
  // may not trim punctuation adjacent to one from another font.
  const tests: [string, string][] = [];
  for (const char of new Set(text.match(PUNCTUATION_PATTERN) ?? [])) {
    if (isTrimmedPair(char, char, lang)) {
      tests.push([char, char]);
    }
  }
  for (const match of text.matchAll(PUNCTUATION_PAIR_PATTERN)) {
    const [first, second] = [...match[1]];
    if (first !== second && isTrimmedPair(first, second, lang)) {
      tests.push([first, second]);
    }
  }
  let probe: HTMLElement | null = null;
  const measure = (content: string, trim: string): number => {
    if (!probe) {
      probe = document.createElement("span");
      probe.style.cssText =
        "all:initial;position:absolute;visibility:hidden;display:block;" +
        "white-space:pre;width:max-content;height:max-content;" +
        "text-autospace:no-autospace;";
      properties.forEach((p, i) => probe.style.setProperty(p, values[i]));
      if (lang) {
        probe.lang = lang;
      }
      document.body.appendChild(probe);
    }
    probe.style.setProperty("text-spacing-trim", trim);
    probe.textContent = content;
    const rect = probe.getBoundingClientRect();
    return vertical ? rect.height : rect.width;
  };
  try {
    const testedPairs = new Set<string>();
    for (const [first, second] of tests) {
      const pair = first + second;
      if (testedPairs.has(pair)) {
        continue;
      }
      testedPairs.add(pair);
      const pairKey = `${key}:${pair}`;
      let supported = cache.get(pairKey);
      if (supported === undefined) {
        // Narrow punctuation needs no trimming
        const isFullWidth = (char: string) =>
          measure(char, "space-all") > fontSize * 0.7;
        supported =
          !isFullWidth(first) ||
          !isFullWidth(second) ||
          measure(`\u6F22${pair}\u6F22`, "space-all") -
            measure(`\u6F22${pair}\u6F22`, "normal") >
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
