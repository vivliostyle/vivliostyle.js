/**
 * Copyright 2013 Google, Inc.
 * Copyright 2015 Daishinsha Inc.
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
 * @fileoverview Base - Common utilities.
 */
import * as Logging from "./logging";
import * as Asserts from "./asserts";

/**
 * Browser type detection
 */
export const browserType: "chromium" | "firefox" | "webkit" | "unknown" =
  navigator.userAgent.includes("Chrome")
    ? "chromium"
    : navigator.userAgent.includes("Firefox")
      ? "firefox"
      : navigator.userAgent.includes("AppleWebKit")
        ? "webkit"
        : "unknown";

/**
 * RegExp pattern for ::first-letter pseudo element:
 * https://drafts.csswg.org/css-pseudo-4/#first-letter-pseudo
 */
export const firstLetterPattern =
  /^[\s\p{Zs}\p{P}\p{Mn}]*[\p{L}\p{N}]\p{Mn}*(?:[\s\p{Zs}]*\p{P}\p{Mn}*)*/u;
/**
 * Indicates the offset position of an element in a document
 */
export const ELEMENT_OFFSET_ATTR = "data-adapt-eloff";

/**
 * Indicates the spine index of the source document of a page container.
 * Element offsets are numbered per source document, so this is needed to find
 * an element by its offset among the pages of all source documents.
 */
export const SPINE_INDEX_ATTR = "data-vivliostyle-spine-index";

export let emptyObj = {};

export type JSON = any;

export function stringToJSON(str: string): JSON {
  return JSON.parse(str);
}

export function stripFragment(url: string): string {
  const r = url.match(/^([^#]*)/);
  if (r) {
    return r[1];
  }
  return url;
}

export function stripFragmentAndQuery(url: string): string {
  const r = url.match(/^([^#?]*)/);
  if (r) {
    return r[1];
  }
  return url;
}

export const TOC_BOX_QUERY_SUFFIX = "?viv-toc-box";

export function isTocBoxURL(url: string): boolean {
  return url.endsWith(TOC_BOX_QUERY_SUFFIX);
}

export function stripTocBoxURL(url: string): string {
  return isTocBoxURL(url) ? url.slice(0, -TOC_BOX_QUERY_SUFFIX.length) : url;
}

export function toTocBoxURL(url: string): string {
  return isTocBoxURL(url) ? url : stripFragment(url) + TOC_BOX_QUERY_SUFFIX;
}

/**
 * Prefix of the id generated for a source element that has a CSS bookmark
 * but no id. The id is followed by the element offset.
 */
export const bookmarkIdPrefix = "viv-bookmark-";

/**
 * Ids generated for source elements. They are kept out of the source DOM so
 * that they do not affect selector matching.
 */
const generatedIds = new WeakMap<Element, string>();

export function setGeneratedId(element: Element, id: string): void {
  generatedIds.set(element, id);
}

export function getGeneratedId(element: Element): string | undefined {
  return generatedIds.get(element);
}

/**
 * Base URL relative to which URLs of resources are resolved.
 */
export let baseURL = window.location.href;
export function setBaseURL(value: string): void {
  baseURL = value;
}

/**
 * Base URL of the built-in resources such as the user agent style sheets and
 * user-agent.xml. Their contents are embedded in the code (see assets.ts) and
 * never fetched; the URLs only identify them.
 */
export const builtinResourceBaseURL = "vivliostyle://resources/";

/**
 * URL of the built-in user-agent.xml, which holds the shadow templates
 * (`#footnote`, `#table-cell`).
 */
export const userAgentXmlURL = `${builtinResourceBaseURL}user-agent.xml`;

function getWptRawRepoRootURL(url: string): string | null {
  const matched = stripFragmentAndQuery(url).match(
    /^(https?:\/\/raw\.githack\.com\/web-platform-tests\/wpt\/[^/]+)(?:\/|$)/,
  );
  return matched ? matched[1] : null;
}

/**
 * Convert a WPT raw.githack.com URL to the equivalent wpt.live URL.
 * Applied at DOM/CSS output points for resource URLs (images, fonts, etc.)
 * so that dynamic WPT endpoints (e.g. `.py` scripts) work correctly.
 */
export function resolveWptResourceURL(url: string): string {
  return url.replace(
    /^(https?:)\/\/raw\.githack\.com\/web-platform-tests\/wpt\/[^/]+\//,
    "$1//wpt.live/",
  );
}

/**
 * @param relURL relative URL
 * @param baseURL base (absolute) URL
 * @return resolved (absolute) URL
 */
export function resolveURL(relURL: string, baseURL: string): string {
  if (/^data:/i.test(baseURL)) {
    return relURL || baseURL;
  }
  if (!baseURL || relURL.match(/^\w{2,}:/)) {
    if (relURL.toLowerCase().match("^javascript:")) {
      return "#";
    }
    if (relURL.match(/^\w{2,}:\/\/[^\/]+$/)) {
      relURL = `${relURL}/`;
    }
    return relURL;
  }
  if (baseURL.match(/^\w{2,}:\/\/[^\/]+$/)) {
    baseURL = `${baseURL}/`;
  }
  let r: string[] | null;
  if (relURL.startsWith("//")) {
    r = baseURL.match(/^(\w{2,}:)\/\//);
    if (r) {
      return r[1] + relURL;
    }
    return relURL;
  }
  if (relURL.startsWith("/")) {
    const wptRawRepoRootURL = getWptRawRepoRootURL(baseURL);
    if (wptRawRepoRootURL) {
      return wptRawRepoRootURL + relURL;
    }
    r = baseURL.match(/^(\w{2,}:\/\/[^\/]+)\//);
    if (r) {
      return r[1] + relURL;
    }
    return relURL;
  }
  if (relURL === "." || relURL.startsWith("./")) {
    relURL = relURL.slice(2); // './foo' => 'foo'
  }
  baseURL = stripFragmentAndQuery(baseURL);
  if (relURL.startsWith("#")) {
    return baseURL + relURL;
  }
  let i = baseURL.lastIndexOf("/");
  if (i < 0) {
    return relURL;
  }
  let url = baseURL.slice(0, i + 1) + relURL;
  let urlOption = "";
  r = url.match(/^([^?#]*)([?#].*)$/);
  if (r) {
    url = r[1];
    urlOption = r[2];
  }

  while (true) {
    i = url.indexOf("/../");
    if (i <= 0) {
      break;
    }
    const j = url.lastIndexOf("/", i - 1);
    if (j <= 0) {
      break;
    }
    url = url.slice(0, j) + url.slice(i + 3);
  }
  return url.replace(/\/(\.\/)+/g, "/") + urlOption;
}

/**
 * Resolve a URL while preserving the document URL for fragment-only
 * references. This is needed when the base URL is a data URL because
 * resolveURL("#id", data:...) intentionally returns just "#id".
 */
export function resolveReferenceURL(relURL: string, baseURL: string): string {
  if (relURL.startsWith("#") && baseURL) {
    return stripFragment(baseURL) + relURL;
  }
  return resolveURL(relURL, baseURL);
}

/**
 * Convert `about:blank` (with optional query/fragment, case-insensitive)
 * to `data:text/html,` so the browser can load it natively.
 */
export function convertAboutBlankURL(url: string): string {
  return /^about:blank($|[?#])/i.test(url) ? "data:text/html," : url;
}

/**
 * Convert special URLs (e.g. GitHub, Gist) to their raw equivalents.
 * This is useful for fetching content from these services in a format
 * that can be easily processed by Vivliostyle.js.
 *
 * @param url URL to convert
 * @return converted URL
 */
export function convertSpecialURL(url: string): string {
  let r: RegExpMatchArray | null;

  if ((url = convertAboutBlankURL(url)) !== url) {
    // already converted
  } else if (
    (r =
      /^(https?:)\/\/github\.com\/web-platform-tests\/wpt\/(blob\/|tree\/|raw\/)?(.*)$/.exec(
        url,
      ))
  ) {
    // Convert GitHub WPT URL to raw.githack.com URL (correct MIME types)
    url = `${r[1]}//raw.githack.com/web-platform-tests/wpt/${r[2] ? "" : "master/"}${r[3]}`;
  } else if (
    (r =
      /^(https?:)\/\/github\.com\/([^/]+\/[^/]+)\/(blob\/|tree\/|raw\/)?(.*)$/.exec(
        url,
      ))
  ) {
    // Convert GitHub URL to GitHub raw URL
    url = `${r[1]}//raw.githubusercontent.com/${r[2]}/${r[3] ? "" : "master/"}${
      r[4]
    }`;
  } else if ((r = /^(https?:)\/\/wpt\.live\/(.*)$/.exec(url))) {
    // Convert WPT live URL to raw.githack.com URL so it can be fetched without
    // CORS issues and with correct MIME types for embedded resources (e.g.,
    // <object data="..."> with type="text/html").
    // Exception: .sub.* files require WPT server-side template substitution
    // (e.g. {{hosts[alt][]}}) and must remain on wpt.live to be served correctly.
    if (!/\.sub\.[^/]+(?:[?#].*)?$/.test(r[2])) {
      url = `${r[1]}//raw.githack.com/web-platform-tests/wpt/master/${r[2]}`;
    }
  } else if (
    (r =
      /^(https?:)\/\/www\.aozora\.gr\.jp\/(cards\/[^/]+\/files\/[^/.]+\.html)$/.exec(
        url,
      ))
  ) {
    // Convert Aozorabunko (X)HTML URL to GitHub raw URL
    url = `${r[1]}//raw.githubusercontent.com/aozorabunko/aozorabunko/master/${r[2]}`;
  } else if (
    (r =
      /^(https?:)\/\/gist\.github\.com\/([^/]+\/\w+)(\/|$)(raw(\/|$))?(.*)$/.exec(
        url,
      ))
  ) {
    // Convert Gist URL to Gist raw URL
    url = `${r[1]}//gist.githubusercontent.com/${r[2]}/raw/${r[6]}`;
  } else if (
    (r =
      /^(https?:)\/\/gist\.github\.com\/([^/]+\/\w+)(?:#|%23)file-(.*)-(\w+)$/.exec(
        url,
      ))
  ) {
    // Convert Gist URL with fragment to Gist raw URL
    url = `${r[1]}//gist.githubusercontent.com/${r[2]}/raw/${r[3]}.${r[4]}`;
  } else if (
    (r =
      /^(https?:)\/\/(?:[^/.]+\.)?jsbin\.com\/(?!(?:blog|help)\b)(\w+)((\/\d+)?).*$/.exec(
        url,
      ))
  ) {
    // Convert JS Bin URL to JS Bin output URL
    url = `${r[1]}//output.jsbin.com/${r[2]}${r[3]}/`;
  }
  return url;
}

export interface DocumentURLTransformer {
  transformFragment(fragment: string, baseURL: string): string;

  transformURL(url: string, baseURL: string): string;

  restoreURL(encoded: string): string[];
}

/**
 * Various namespaces.
 * @enum {string}
 */
export enum NS {
  epub = "http://www.idpf.org/2007/ops",
  EV = "http://www.w3.org/2001/xml-events",
  MATHML = "http://www.w3.org/1998/Math/MathML",
  XML = "http://www.w3.org/XML/1998/namespace",
  XHTML = "http://www.w3.org/1999/xhtml",
  XLINK = "http://www.w3.org/1999/xlink",
  SHADOW = "http://www.pyroxy.com/ns/shadow",
  SVG = "http://www.w3.org/2000/svg",
  DC = "http://purl.org/dc/elements/1.1/",
}

export function asString(v: any): string | null {
  if (v == null) {
    return v;
  }
  return v.toString();
}

export interface Comparable {
  /**
   * @return -1 when this less then other, 0 when this equals other
   */
  compare(other: Comparable): number;
}

/**
 * A priority queue.
 */
export class PriorityQueue {
  queue: (Comparable | null)[] = [null];

  length(): number {
    return this.queue.length - 1;
  }

  add(item: Comparable): void {
    let index = this.queue.length;
    while (index > 1) {
      const parentIndex = Math.floor(index / 2);
      const parent = this.queue[parentIndex];
      if (parent.compare(item) > 0) {
        this.queue[index] = item;
        return;
      }
      this.queue[index] = parent;
      index = parentIndex;
    }
    this.queue[1] = item;
  }

  /**
   * @return highest priority Comparable.
   */
  peek(): Comparable {
    return this.queue[1];
  }

  /**
   * Remove the highest-priority item from the queue.
   * @return removed item.
   */
  remove(): Comparable {
    const result = this.queue[1] as Comparable;
    const curr = this.queue.pop() as Comparable;
    const size = this.queue.length;
    if (size > 1) {
      let index = 1;
      while (true) {
        let childIndex = index * 2;
        if (childIndex >= size) {
          break;
        }
        if (this.queue[childIndex].compare(curr) > 0) {
          if (
            childIndex + 1 < size &&
            this.queue[childIndex + 1].compare(
              this.queue[childIndex] as Comparable,
            ) > 0
          ) {
            childIndex++;
          }
        } else if (
          childIndex + 1 < size &&
          this.queue[childIndex + 1].compare(curr) > 0
        ) {
          childIndex++;
        } else {
          break;
        }
        this.queue[index] = this.queue[childIndex];
        index = childIndex;
      }
      this.queue[index] = curr;
    }
    return result;
  }
}

export const knownPrefixes = ["", "-webkit-", "-moz-"];

export const propNameMap = new Map<string, string[] | null>();

export function checkIfPropertySupported(
  prefix: string,
  prop: string,
): boolean {
  return CSS.supports(prefix + prop, "unset");
}

export function getPrefixedPropertyNames(prop: string): string[] | null {
  let prefixed = propNameMap.get(prop);
  if (prefixed || prefixed === null) {
    // null means the browser does not support the property
    return prefixed;
  }
  switch (prop) {
    case "behavior":
    case "template":
    case "ua-list-item-count":
    case "x-first-pseudo":
      propNameMap.set(prop, null);
      return null;
    case "text-combine-upright":
      // Special case for Safari
      if (
        checkIfPropertySupported("-webkit-", "text-combine") &&
        !checkIfPropertySupported("", "text-combine-upright")
      ) {
        propNameMap.set(prop, ["-webkit-text-combine"]);
        return ["-webkit-text-combine"];
      }
      break;
  }
  for (const prefix of knownPrefixes) {
    if (checkIfPropertySupported(prefix, prop)) {
      prefixed = [prefix + prop];
      propNameMap.set(prop, prefixed);
      return prefixed;
    }
  }

  // Not supported by the browser
  Logging.logger.warn("Property not supported by the browser: ", prop);
  propNameMap.set(prop, null);
  return null;
}

/**
 * The documents in which ruby or text-emphasis annotations may need their
 * boundary leading adjusted (see ruby-emphasis.ts): an inline style with
 * "text-emphasis" was set, or a ruby annotation was prepared.
 */
const annotatedDocuments = new WeakSet<Document>();

export function markAnnotatedDocument(doc: Document | null): void {
  if (doc) {
    annotatedDocuments.add(doc);
  }
}

export function isAnnotatedDocument(doc: Document | null): boolean {
  return !!doc && annotatedDocuments.has(doc);
}

/**
 * The attribute that lists the style keys of an element: the inline style
 * declarations that rules of the UA stylesheet (assets.ts) depend on, e.g.
 * `[data-viv-style~="--viv-marker-color"]::marker`.
 *
 * The rules do not select on the style attribute itself (`[style*="..."]`),
 * because a selector on the style attribute anywhere in the stylesheets makes
 * WebKit serialize the style attribute and match those selectors against it
 * on every change of an inline style, and the view generation sets every
 * property of every element separately.
 */
export const STYLE_KEYS_ATTR = "data-viv-style";

/**
 * The custom properties that rules of the UA stylesheet select on.
 */
const customStyleKeys = [
  "--viv-marker-content",
  "--viv-marker-color",
  "--viv-marker-font-size",
  "--viv-marker-font-family",
  "--viv-marker-font-style",
  "--viv-marker-font-weight",
  "--viv-marker-font-variant",
  "--viv-marker-unicode-bidi",
  "--viv-marker-direction",
  "--viv-marker-white-space",
  "--viv-marker-text-transform",
  "--viv-marker-text-combine-upright",
  "--viv-marker-text-orientation",
  "--viv-marker-hyphens",
  "--viv-marker-line-height",
  "--viv-marker-tab-size",
  "--viv-marker-text-emphasis-style",
  "--viv-marker-text-emphasis-color",
  "--viv-marker-text-emphasis-position",
  "--viv-marker-text-shadow",
  "--viv-footnote-white-space",
  "--viv-initialLetter",
  "--viv-firstLineFontFamily",
  "--viv-firstLineFontSize",
  "--viv-firstLineLineHeight",
];

/**
 * Each style key stands for a substring of the style attribute, as
 * `[style*="..."]` matched it: anywhere in the name or in the value of a
 * declaration, also of a custom property.
 */
const substringStyleKeys: [substring: string, key: string][] = [
  ["border", "border"],
  ["outline", "outline"],
  ["rule", "rule"],
  ["text-decoration", "text-decoration"],
  ["border-collapse: collapse", "border-collapse:collapse"],
  ...customStyleKeys.map((key): [string, string] => [key, key]),
];

/** Matches the texts that can contain one of the substrings. */
const styleKeyPattern =
  /border|outline|rule|text-decoration|--viv-(?:marker-|footnote-white-space|initialLetter|firstLine)/;

/**
 * The same for a value before the browser has parsed it, which makes the
 * keywords lowercase and resolves escapes.
 */
const styleKeyPatternForInput = new RegExp(
  `${styleKeyPattern.source}|\\\\`,
  "i",
);

/**
 * Marks an element whose style keys are taken from the text of its style
 * attribute after every change, see setStyleDeclaration(). It is the first
 * of the style keys, so that a clone of the element is marked as well.
 */
const CHECKED_AS_TEXT = "*";

const noStyleKeys: readonly string[] = [];

/**
 * Returns the style keys of a declaration `name: value` or of a whole style
 * attribute.
 */
function getStyleKeysOfText(text: string): readonly string[] {
  if (!styleKeyPattern.test(text)) {
    return noStyleKeys;
  }
  const keys: string[] = [];
  for (const [substring, key] of substringStyleKeys) {
    if (text.includes(substring)) {
      keys.push(key);
    }
  }
  return keys;
}

/**
 * Sets the style keys of an element from its style attribute, which the
 * browser keeps in step with the declarations of the inline style.
 */
function updateStyleKeys(elem: Element, checkedAsText: boolean): void {
  const style = elem.getAttribute("style");
  let keys = "";
  if (style) {
    keys = getStyleKeysOfText(style).join(" ");
    if (checkedAsText) {
      keys = keys ? `${CHECKED_AS_TEXT} ${keys}` : CHECKED_AS_TEXT;
    }
  }
  if (!keys) {
    elem.removeAttribute(STYLE_KEYS_ATTR);
  } else if (elem.getAttribute(STYLE_KEYS_ATTR) !== keys) {
    elem.setAttribute(STYLE_KEYS_ATTR, keys);
  }
}

/** What setStyleDeclaration() needs to know about a standard property. */
type StylePropertyInfo = {
  /** The name under which the browser keeps the declaration. */
  name: string;
  /** Whether the name contains one of the substrings. */
  hasKeyInName: boolean;
  /** The longhand properties, if this is a shorthand property. */
  longhands: string[] | null;
};

const stylePropertyInfos = new Map<string, StylePropertyInfo>();

function getStylePropertyInfo(prop: string, doc: Document): StylePropertyInfo {
  let info = stylePropertyInfos.get(prop);
  if (!info) {
    // The names of standard properties are not case-sensitive.
    let name = prop.toLowerCase();
    const probe = (doc.createElementNS(NS.XHTML, "div") as HTMLElement).style;
    probe.setProperty(name, "initial");
    let longhands: string[] | null = null;
    if (probe.length > 1 || name === "all") {
      longhands = Array.from(probe);
    } else if (probe.length === 1) {
      name = probe.item(0); // differs for an alias
    }
    info = { name, hasKeyInName: styleKeyPattern.test(name), longhands };
    stylePropertyInfos.set(prop, info);
  }
  return info;
}

/**
 * Sets (or with an empty value removes) a declaration of an inline style
 * and keeps the style keys of the element up to date.
 *
 * The style keys have to be those of the style attribute as the browser
 * writes it. For most declarations they follow from the declaration alone:
 * a custom property is written as it is, and a name with a key keeps the key
 * when the browser combines longhand properties into a shorthand property.
 * A key in the value of a standard property does not: the browser leaves out
 * `background-clip: border-box` when it writes `background: red`. An element
 * that gets such a value is therefore marked, and from then on its keys are
 * taken from the text of its style attribute after every change.
 */
function setStyleDeclaration(
  elem: Element,
  elemStyle: CSSStyleDeclaration,
  prop: string,
  value: string,
): void {
  const keysAttr = elem.getAttribute(STYLE_KEYS_ATTR);
  if (keysAttr !== null && keysAttr.startsWith(CHECKED_AS_TEXT)) {
    elemStyle.setProperty(prop, value);
    updateStyleKeys(elem, true);
    return;
  }
  const isCustom = prop.startsWith("--");
  let name = prop;
  let hasKeyInName: boolean;
  let isSet = false;
  if (isCustom) {
    hasKeyInName = styleKeyPattern.test(prop);
  } else {
    const info = getStylePropertyInfo(prop, elem.ownerDocument);
    name = info.name;
    hasKeyInName = info.hasKeyInName;
    let checkAsText =
      !!value && name !== "box-sizing" && styleKeyPatternForInput.test(value);
    if (!checkAsText && info.longhands) {
      elemStyle.setProperty(name, value);
      isSet = true;
      checkAsText =
        name === "all" ||
        info.longhands.some(
          (longhand) =>
            longhand !== "box-sizing" &&
            styleKeyPattern.test(elemStyle.getPropertyValue(longhand)),
        );
      if (!checkAsText && keysAttr !== null) {
        // The shorthand property replaced or removed its longhand
        // properties, whatever their keys were.
        updateStyleKeys(elem, false);
        return;
      }
    }
    if (checkAsText) {
      if (!isSet) {
        elemStyle.setProperty(name, value);
      }
      updateStyleKeys(elem, true);
      return;
    }
  }

  // The keys of the declaration that is replaced or removed. An element
  // without style keys has no declaration with a key. The value of a declared
  // custom property can be empty.
  let oldKeys = noStyleKeys;
  if (keysAttr !== null) {
    const oldValue = elemStyle.getPropertyValue(name);
    if (
      (oldValue || isCustom) &&
      (hasKeyInName || styleKeyPattern.test(oldValue))
    ) {
      oldKeys = getStyleKeysOfText(`${name}: ${oldValue}`);
    }
  }
  if (!isSet) {
    elemStyle.setProperty(name, value);
  }
  if (!value && keysAttr === null) {
    return;
  }

  // The keys of the declaration as the browser accepted it: it makes the
  // keywords of the value lowercase and ignores a value that is not valid.
  let newKeys = noStyleKeys;
  let isAccepted = true;
  if (value && (hasKeyInName || styleKeyPatternForInput.test(value))) {
    const newValue = elemStyle.getPropertyValue(name);
    isAccepted = !!newValue || (isCustom && !value.trim());
    newKeys = getStyleKeysOfText(`${name}: ${newValue}`);
  }
  if (!isAccepted || oldKeys.some((key) => !newKeys.includes(key))) {
    // Another declaration may still have the key, or the declaration may not
    // be what was asked for: look at the whole style.
    updateStyleKeys(elem, false);
    return;
  }
  if (!newKeys.length) {
    return;
  }
  if (keysAttr === null) {
    elem.setAttribute(STYLE_KEYS_ATTR, newKeys.join(" "));
    return;
  }
  const keys = keysAttr.split(" ");
  let added = false;
  for (const key of newKeys) {
    if (!keys.includes(key)) {
      keys.push(key);
      added = true;
    }
  }
  if (added) {
    elem.setAttribute(STYLE_KEYS_ATTR, keys.join(" "));
  }
}

/**
 * Sets the style keys of the elements of a subtree from their style
 * attributes, and removes the keys that do not come from them. For elements
 * that keep the attributes of the source instead of being styled through
 * setCSSProperty(), e.g. in a custom-rendered subtree. The browser writes
 * such a style attribute anew when a declaration changes, so the elements
 * are marked as checked as text.
 */
export function updateStyleKeysFromStyleAttributes(root: Element): void {
  if (root.hasAttribute("style") || root.hasAttribute(STYLE_KEYS_ATTR)) {
    updateStyleKeys(root, true);
  }
  for (const elem of root.querySelectorAll(`[style], [${STYLE_KEYS_ATTR}]`)) {
    updateStyleKeys(elem, true);
  }
}

export function setCSSProperty(
  elem: Element,
  prop: string,
  value: string,
): void {
  const elemStyle = (elem as HTMLElement)?.style;
  if (!elemStyle) {
    return;
  }
  if (prop.includes("text-emphasis") || value?.includes("text-emphasis")) {
    markAnnotatedDocument(elem.ownerDocument);
  }
  if (prop.startsWith("--")) {
    setStyleDeclaration(elem, elemStyle, prop, value || " ");
    return;
  }
  const prefixedPropertyNames = getPrefixedPropertyNames(prop);
  if (!prefixedPropertyNames) {
    return;
  }
  for (const prefixed of prefixedPropertyNames) {
    switch (prefixed) {
      case "-webkit-text-combine": // for Safari
        switch (value) {
          case "all":
            value = "horizontal";
            break;
        }
        break;
    }
    setStyleDeclaration(elem, elemStyle, prefixed, value);
  }
}

/**
 * Removes a property from the inline style of an element. Unlike
 * setCSSProperty() with an empty value, this also removes a custom property.
 */
export function removeCSSProperty(elem: Element, prop: string): void {
  const elemStyle = (elem as HTMLElement)?.style;
  if (!elemStyle) {
    return;
  }
  for (const name of prop.startsWith("--")
    ? [prop]
    : (getPrefixedPropertyNames(prop) ?? [])) {
    setStyleDeclaration(elem, elemStyle, name, "");
  }
}

export function getCSSProperty(
  elem: Element,
  prop: string,
  opt_value?: string,
): string {
  try {
    const propertyNames = propNameMap.get(prop);
    return (elem as HTMLElement).style.getPropertyValue(
      propertyNames ? propertyNames[0] : prop,
    );
  } catch {}
  return opt_value || "";
}

/**
 * A node reached from another one, which therefore has a parent. lib.dom
 * declares `parentNode` only on `Node`, where it is nullable. The name avoids
 * lib.dom's `ChildNode`, a mixin that says nothing about the parent.
 */
export interface ChildDomNode extends Node {
  readonly parentNode: ParentNode;
}

export interface ChildElement extends Element {
  readonly parentNode: ParentNode;
}

export function documentElementOf(doc: Document): ChildElement {
  // the document element is the element child of the document
  return doc.documentElement as ChildElement;
}

export function nextElementSiblingOf(element: Element): ChildElement | null {
  // a sibling exists only under a parent the two share
  return element.nextElementSibling as ChildElement | null;
}

export function previousElementSiblingOf(
  element: Element,
): ChildElement | null {
  // a sibling exists only under a parent the two share
  return element.previousElementSibling as ChildElement | null;
}

/**
 * A position reached from the root the cursor was opened at. Moving never goes
 * above the root's own parent, which is what makes every position the cursor
 * yields a node with a parent.
 */
export class RootBoundCursor {
  private constructor(
    private readonly root: ChildElement,
    readonly node: ChildDomNode,
  ) {}

  static atRoot(root: ChildElement): RootBoundCursor {
    return new RootBoundCursor(root, root);
  }

  private moveTo(node: Node | null): RootBoundCursor | null {
    return node === null
      ? null
      : new RootBoundCursor(this.root, node as ChildDomNode);
  }

  get firstChild(): RootBoundCursor | null {
    return this.moveTo(this.node.firstChild);
  }

  get nextSibling(): RootBoundCursor | null {
    return this.moveTo(this.node.nextSibling);
  }

  get parent(): RootBoundCursor | null {
    if (this.node === this.root) {
      return null;
    }
    const parent = this.node.parentNode;
    // the root alone does not bound the walk: a sibling move can leave its
    // subtree
    return parent === this.root || parent === this.root.parentNode
      ? null
      : this.moveTo(parent);
  }
}

export function getLangAttribute(element: Element): string | null {
  let lang = element.getAttributeNS(NS.XML, "lang");
  if (!lang && element.namespaceURI == NS.XHTML) {
    lang = element.getAttribute("lang");
  }
  return lang;
}

export class StringBuffer {
  list: string[] = [];

  append(str: string): StringBuffer {
    this.list.push(str);
    return this;
  }

  clear(): void {
    this.list = [];
  }

  /** @override */
  toString(): string {
    const str = this.list.join("");
    this.list = [str];
    return str;
  }
}

export function escapeChar(str: string): string {
  // not called for surrogate pairs, no need to worry about them
  return `\\${str.charCodeAt(0).toString(16)} `;
}

export function escapeCSSIdent(name: string): string {
  return name.replace(/[^-_a-zA-Z0-9\u0080-\uFFFF]/g, escapeChar);
}

export function escapeCSSStr(str: string): string {
  return str.replace(/[\u0000-\u001F"\\]/g, escapeChar);
}

export function lightURLEncode(str: string): string {
  return str.replace(/[\s+&?=#\u007F-\uFFFF]+/g, encodeURIComponent);
}

export function isLetter(ch: string): boolean {
  return !!ch.match(
    /^[a-zA-Z\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]$/,
  );
}

export function escapeCharToHex(str: string, prefix?: string): string {
  prefix = typeof prefix === "string" ? prefix : "\\u";
  return prefix + (str.charCodeAt(0) || 0).toString(16).padStart(4, "0");
}

export function escapeNameStrToHex(str: string, prefix?: string): string {
  function escapeChar(s) {
    return escapeCharToHex(s, prefix);
  }
  return str.replace(/[^-a-zA-Z0-9_]/g, escapeChar);
}

export function escapeRegExp(str: string): string {
  return escapeNameStrToHex(str);
}

export function unescapeCharFromHex(str: string, prefix?: string): string {
  prefix = typeof prefix === "string" ? prefix : "\\u";
  if (str.startsWith(prefix)) {
    return String.fromCharCode(parseInt(str.substring(prefix.length), 16));
  } else {
    return str;
  }
}

export function unescapeStrFromHex(str: string, prefix?: string): string {
  prefix = typeof prefix === "string" ? prefix : "\\u";

  function unescapeChar(s) {
    return unescapeCharFromHex(s, prefix);
  }
  const regexp = new RegExp(`${escapeRegExp(prefix)}[0-9a-fA-F]{4}`, "g");
  return str.replace(regexp, unescapeChar);
}

/**
 * Function good is defined for ints from 0 to high-1. It is such that for
 * each i between 1 and high-1 !good(i-1) || good(i) is true. In other words,
 * it goes like false ... false true ... true.
 * Find i such that (i == 0 || !good(i-1)) && (i == h || good(i))
 * In other words, good(i) is the "first" good = true.
 */
export function binarySearch(
  high: number,
  good: (p1: number) => boolean,
): number {
  let l = 0;
  let h = high;
  while (true) {
    Asserts.assert(l <= h);
    Asserts.assert(l == 0 || !good(l - 1));
    Asserts.assert(h == high || good(h));
    if (l == h) {
      return l;
    }
    const m = (l + h) >> 1;
    if (good(m)) {
      h = m;
    } else {
      l = m + 1;
    }
  }
}

/**
 * Function to sort numbers low to high
 */
export function numberCompare(a: number, b: number): number {
  return a - b;
}

/**
 * Index array using key function. First encountered item wins on collision.
 * Elements with empty and null keys are dropped.
 */
export function indexArray<T>(
  arr: T[],
  key: (p1: T) => string | null,
): { [key: string]: T } {
  const map: { [key: string]: T } = {};
  for (const v of arr) {
    const k: string | null = key(v);
    if (k && !map[k]) {
      map[k] = v;
    }
  }
  return map;
}

/**
 * Convert array of strings to an object with the values in the array set to
 * true.
 */
export function arrayToSet(arr: string[]): { [key: string]: boolean } {
  const set: { [key: string]: boolean } = {};
  for (let i = 0; i < arr.length; i++) {
    set[arr[i]] = true;
  }
  return set;
}

/**
 * Index array using key function. Repeated indices are all combined into
 * arrays. Elements with empty and null keys are dropped. Ordering of the
 * elements in arrays is preserved.
 */
export function multiIndexArray<T>(
  arr: T[],
  key: (p1: T) => string | null,
): { [key: string]: T[] } {
  const map: { [key: string]: T[] } = {};
  for (const v of arr) {
    const k = key(v);
    if (k) {
      if (map[k]) {
        map[k].push(v);
      } else {
        map[k] = [v];
      }
    }
  }
  return map;
}

/**
 * Apply function to each value of the object
 * @param fn second parameter is the key
 */
export function mapObj<P, R>(
  obj: { [key: string]: P },
  fn: (p1: P, p2: string) => R,
): { [key: string]: R } {
  const res: { [key: string]: R } = {};
  for (const n in obj) {
    res[n] = fn(obj[n], n);
  }
  return res;
}

export type Event = {
  type: string;
  target?;
  currentTarget?;
  preventDefault?;
  newPage?;
  anchorElement?;
  href?;
  content?;
};

export type EventListener = (p1: Event) => void;

/**
 * Extemely simple-minded EventTarget implementation. Consider using
 * goog.events.EventTarget if you are using Closure library.
 */
export class SimpleEventTarget {
  listeners: { [key: string]: EventListener[] } = {};

  dispatchEvent(evt: Event): void {
    const list = this.listeners[evt.type];
    if (list) {
      evt.target = this;
      evt.currentTarget = this;
      for (let i = 0; i < list.length; i++) {
        list[i](evt);
      }
    }
  }

  addEventListener(
    type: string,
    listener: EventListener,
    capture?: boolean,
  ): void {
    if (capture) {
      return;
    }
    const list = this.listeners[type];
    if (list) {
      if (!list.includes(listener)) {
        list.push(listener);
      }
    } else {
      this.listeners[type] = [listener];
    }
  }

  removeEventListener(
    type: string,
    listener: EventListener,
    capture?: boolean,
  ): void {
    if (capture) {
      return;
    }
    const list = this.listeners[type];
    if (list) {
      const index = list.indexOf(listener);
      if (index >= 0) {
        list.splice(index, 1);
      }
    }
  }
}

export const mediaTags = {
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
