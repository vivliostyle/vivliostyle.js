/**
 * Copyright 2026 Vivliostyle Foundation
 * Licensed under the GNU Affero General Public License, version 3 or later.
 */

// CSS.supports only checks syntax. In particular, Chromium accepts
// text-spacing-trim even when the selected font cannot trim punctuation.
const fontCaches = new WeakMap<Document, Map<string, boolean>>();

export function supports(property: string, value: string): boolean {
  return typeof CSS !== "undefined" && CSS.supports(property, value);
}

/** Check the actual font cascade, including fallback glyphs and vertical fonts. */
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
  let cache = fontCaches.get(document);
  if (!cache) {
    cache = new Map();
    fontCaches.set(document, cache);
    document.fonts?.addEventListener("loadingdone", () => cache.clear());
    document.fonts?.addEventListener("loadingerror", () => cache.clear());
  }
  // Test every punctuation used by this run, not just a representative glyph
  // from the first family: different characters can use different fonts.
  const punctuation = new Set(
    element.textContent.match(
      /[‘“〝（［｛｟〈〈《「『【〔〖〘〚’”〞〟）］｝｠〉〉》」』】〕〗〙〛：；、。，．]/gu,
    ) ?? [],
  );
  for (const char of punctuation) {
    const charKey = `${key}:${char}`;
    const cached = cache.get(charKey);
    if (cached !== undefined) {
      if (!cached) return false;
      continue;
    }
    const probe = document.createElement("span");
    probe.style.cssText =
      "all:initial;position:absolute;visibility:hidden;display:block;white-space:pre;width:max-content;height:max-content;text-autospace:no-autospace;text-spacing-trim:space-all;";
    properties.forEach((p, i) => probe.style.setProperty(p, values[i]));
    if (lang) probe.lang = lang;
    document.body.appendChild(probe);
    const measure = () => {
      const rect = probe.getBoundingClientRect();
      return vertical ? rect.height : rect.width;
    };
    probe.textContent = char;
    const fullWidth = measure() > parseFloat(style.fontSize) * 0.7;
    probe.textContent = `漢${char}${char}漢`;
    const untrimmed = measure();
    probe.style.setProperty("text-spacing-trim", "normal");
    const trimmed = measure();
    probe.remove();
    // Narrow quotes and centered punctuation in traditional Chinese do not
    // need the half-width trimming performed by our polyfill.
    const needed =
      fullWidth &&
      !(lang === "zh-hant" && /[：；、。，．]/u.test(char)) &&
      !(lang !== "zh-hans" && /[：；]/u.test(char));
    const supported =
      !needed || untrimmed - trimmed > parseFloat(style.fontSize) * 0.25;
    if (document.fonts?.status !== "loading") cache.set(charKey, supported);
    if (!supported) return false;
  }
  return true;
}
