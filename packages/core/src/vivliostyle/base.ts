/**
 * Copyright 2013 Google, Inc.
 * Copyright 2015 Trim-marks Inc.
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
 * RegExp pattern for ::first-letter pseudo element:
 * https://drafts.csswg.org/css-pseudo-4/#first-letter-pseudo
 */
export const firstLetterPattern =
  /^[\s\p{Zs}\p{P}\p{Mn}]*[\p{L}\p{N}]\p{Mn}*(?:[\s\p{Zs}]*\p{P}\p{Mn}*)*/u;
/**
 * Indicates the offset position of an element in a document
 */
export const ELEMENT_OFFSET_ATTR = "data-adapt-eloff";

export let emptyObj = {};

export type JSON = any;

export function jsonToString(json: JSON): string {
  return JSON.stringify(json);
}

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

/**
 * Base URL relative to which URLs of resources are resolved.
 */
export let baseURL = window.location.href;
export function setBaseURL(value: string): void {
  baseURL = value;
}

/**
 * Base URL relative to which URLs of resources such as validation.txt and
 * user-agent.css are resolved.
 */
export let resourceBaseURL = window.location.href;
export function setResourceBaseURL(value: string): void {
  resourceBaseURL = value;
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
  let r: string[];
  if (relURL.match(/^\/\//)) {
    r = baseURL.match(/^(\w{2,}:)\/\//);
    if (r) {
      return r[1] + relURL;
    }
    return relURL;
  }
  if (relURL.match(/^\//)) {
    r = baseURL.match(/^(\w{2,}:\/\/[^\/]+)\//);
    if (r) {
      return r[1] + relURL;
    }
    return relURL;
  }
  if (relURL.match(/^\.(\/|$)/)) {
    relURL = relURL.substr(2); // './foo' => 'foo'
  }
  baseURL = stripFragmentAndQuery(baseURL);
  if (relURL.match(/^#/)) {
    return baseURL + relURL;
  }
  let i = baseURL.lastIndexOf("/");
  if (i < 0) {
    return relURL;
  }
  if (i < baseURL.length - 1) {
    const j = baseURL.lastIndexOf(".");
    if (j < i) {
      // Assume the last part without '.' to be a directory name.
      if (relURL == "") {
        return baseURL;
      }
      baseURL += "/";
      i = baseURL.length - 1;
    }
  }
  let url = baseURL.substr(0, i + 1) + relURL;
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
    url = url.substr(0, j) + url.substr(i + 3);
  }
  return url.replace(/\/(\.\/)+/g, "/") + urlOption;
}

/**
 * @return converted URL
 */
export function convertSpecialURL(url: string): string {
  let r: RegExpMatchArray;
  if (
    (r =
      /^(https?:)\/\/github\.com\/([^/]+\/[^/]+)\/(blob\/|tree\/|raw\/)?(.*)$/.exec(
        url,
      ))
  ) {
    // Convert GitHub URL to GitHub raw URL
    url = `${r[1]}//raw.githubusercontent.com/${r[2]}/${r[3] ? "" : "master/"}${
      r[4]
    }`;
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
  NCX = "http://www.daisy.org/z3986/2005/ncx/",
}

/**
 * @param name parameter name
 * @param opt_url URL; window.location.href is used if not provided
 * @return parameter value
 */
export function getURLParam(name: string, opt_url?: string): string | null {
  const rg = new RegExp(`#(.*&)?${escapeRegExp(name)}=([^#&]*)`);
  const url = opt_url || window.location.href;
  const r = url.match(rg);
  if (r) {
    return r[2];
  }
  return null;
}

/**
 * @param name parameter name
 * @param value parameter value
 * @return new url
 */
export function setURLParam(url: string, name: string, value: string): string {
  const rg = new RegExp(`#(.*&)?${escapeRegExp(name)}=([^#&]*)`);
  const r = url.match(rg);
  if (r) {
    const length = r[2].length;
    const index = r.index + r[0].length - length;
    return url.substr(0, index) + value + url.substr(index + length);
  }
  if (!url.match(/#/)) {
    return `${url}#${name}=${value}`;
  } else {
    return `${url}&${name}=${value}`;
  }
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
  queue: Comparable[] = [null];

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

export const propNameMap: { [key: string]: string[] } = {};

export function checkIfPropertySupported(
  prefix: string,
  prop: string,
): boolean {
  return CSS.supports(prefix + prop, "unset");
}

export function getPrefixedPropertyNames(prop: string): string[] | null {
  let prefixed = propNameMap[prop];
  if (prefixed || prefixed === null) {
    // null means the browser does not support the property
    return prefixed;
  }
  switch (prop) {
    case "behavior":
    case "template":
    case "ua-list-item-count":
    case "x-first-pseudo":
      propNameMap[prop] = null;
      return null;
    case "text-combine-upright":
      // Special case for Safari
      if (
        checkIfPropertySupported("-webkit-", "text-combine") &&
        !checkIfPropertySupported("", "text-combine-upright")
      ) {
        propNameMap[prop] = ["-webkit-text-combine"];
        return ["-webkit-text-combine"];
      }
      break;
  }
  for (const prefix of knownPrefixes) {
    if (checkIfPropertySupported(prefix, prop)) {
      prefixed = [prefix + prop];
      propNameMap[prop] = prefixed;
      return prefixed;
    }
  }

  // Not supported by the browser
  Logging.logger.warn("Property not supported by the browser: ", prop);
  propNameMap[prop] = null;
  return null;
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
  if (prop.startsWith("--")) {
    elemStyle.setProperty(prop, value || " ");
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
      case "text-combine-upright":
        switch (value) {
          case "all":
            // workaround for Chrome 93 bug https://crbug.com/1242755
            elemStyle.setProperty("text-indent", "0");
            break;
        }
        break;
    }
    elemStyle.setProperty(prefixed, value);
  }
}

export function getCSSProperty(
  elem: Element,
  prop: string,
  opt_value?: string,
): string {
  try {
    const propertyNames = propNameMap[prop];
    return (elem as HTMLElement).style.getPropertyValue(
      propertyNames ? propertyNames[0] : prop,
    );
  } catch (err) {}
  return opt_value || "";
}

export function getLangAttribute(element: Element): string {
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
  return prefix + (65536 | str.charCodeAt(0)).toString(16).substr(1);
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
  if (str.indexOf(prefix) === 0) {
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

export const base64Chars =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export function appendBase64(sb: StringBuffer, data: string): void {
  const length = data.length;
  const length3 = Math.floor(length / 3) * 3;
  for (let i = 0; i < length3; i += 3) {
    const c1 = data.charCodeAt(i) & 255;
    const c2 = data.charCodeAt(i + 1) & 255;
    const c3 = data.charCodeAt(i + 2) & 255;
    sb.append(base64Chars.charAt(c1 >> 2));
    sb.append(base64Chars.charAt(((c1 << 4) | (c2 >> 4)) & 63));
    sb.append(base64Chars.charAt(((c2 << 2) | (c3 >> 6)) & 63));
    sb.append(base64Chars.charAt(c3 & 63));
  }
  switch (length - length3) {
    case 1: {
      const p1 = data.charCodeAt(length3) & 255;
      sb.append(base64Chars.charAt(p1 >> 2));
      sb.append(base64Chars.charAt((p1 << 4) & 63));
      sb.append("==");
      break;
    }
    case 2: {
      const q1 = data.charCodeAt(length3) & 255;
      const q2 = data.charCodeAt(length3 + 1) & 255;
      sb.append(base64Chars.charAt(q1 >> 2));
      sb.append(base64Chars.charAt(((q1 << 4) | (q2 >> 4)) & 63));
      sb.append(base64Chars.charAt((q2 << 2) & 63));
      sb.append("=");
      break;
    }
  }
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

export function mapSize(obj: object): number {
  let n = 0;
  for (const key in obj) {
    n++;
  }
  return n;
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
      list.push(listener);
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
export type EventTarget = SimpleEventTarget;

export let hasLShapeFloatBug: boolean | null = null;

/**
 * Check if there is a bug with L-shape floats overlapping text.
 */
export function checkLShapeFloatBug(body: HTMLElement): boolean {
  if (hasLShapeFloatBug == null) {
    const doc = body.ownerDocument;
    const container = doc.createElement("div") as HTMLElement;
    container.style.position = "absolute";
    container.style.top = "0px";
    container.style.left = "0px";
    container.style.width = "100px";
    container.style.height = "100px";
    container.style.overflow = "hidden";
    container.style.lineHeight = "16px";
    container.style.fontSize = "16px";
    body.appendChild(container);
    const f1 = doc.createElement("div") as HTMLElement;
    f1.style.width = "0px";
    f1.style.height = "14px";
    f1.style.cssFloat = "left";
    container.appendChild(f1);
    const f2 = doc.createElement("div") as HTMLElement;
    f2.style.width = "50px";
    f2.style.height = "50px";
    f2.style.cssFloat = "left";
    f2.style.clear = "left";
    container.appendChild(f2);
    const t = doc.createTextNode("a a a a a a a a a a a a a a a a");
    container.appendChild(t);
    const range = doc.createRange();
    range.setStart(t, 0);
    range.setEnd(t, 1);
    const leftEdge = range.getBoundingClientRect().left;
    hasLShapeFloatBug = leftEdge < 40;
    body.removeChild(container);
  }
  return hasLShapeFloatBug;
}

export let hasVerticalBBoxBug: boolean | null = null;

/**
 * Check if there is a bug with the bounding boxes of vertical text characters.
 * Though method used to be used check Chrome bug, it seems that the bug has
 * been already fixed:
 *   https://bugs.chromium.org/p/chromium/issues/detail?id=297808
 * We now use this method to check Firefox bug:
 *   https://bugzilla.mozilla.org/show_bug.cgi?id=1159309
 */
export function checkVerticalBBoxBug(body: HTMLElement): boolean {
  if (hasVerticalBBoxBug == null) {
    const doc = body.ownerDocument;
    const container = doc.createElement("div") as HTMLElement;
    container.style.position = "absolute";
    container.style.top = "0px";
    container.style.left = "0px";
    container.style.width = "100px";
    container.style.height = "100px";
    container.style.overflow = "hidden";
    container.style.lineHeight = "16px";
    container.style.fontSize = "16px";
    setCSSProperty(container, "writing-mode", "vertical-rl");
    body.appendChild(container);
    const t = doc.createTextNode("a a a a a a a a a a a a a a a a");
    container.appendChild(t);
    const range = doc.createRange();
    range.setStart(t, 0);
    range.setEnd(t, 1);
    const box = range.getBoundingClientRect();
    hasVerticalBBoxBug = box.right - box.left < 10;
    body.removeChild(container);
  }
  return hasVerticalBBoxBug;
}

export let hasInlineBlockJustificationBug: boolean | null = null;

export function checkInlineBlockJustificationBug(body: HTMLElement): boolean {
  if (hasInlineBlockJustificationBug === null) {
    const doc = body.ownerDocument;
    const container = doc.createElement("div") as HTMLElement;
    container.style.position = "absolute";
    container.style.top = "0px";
    container.style.left = "0px";
    container.style.width = "30px";
    container.style.height = "100px";
    container.style.lineHeight = "16px";
    container.style.fontSize = "16px";
    container.style.textAlign = "justify";
    body.appendChild(container);
    const t = doc.createTextNode("a | ");
    container.appendChild(t);
    const inlineBlock = doc.createElement("span");
    inlineBlock.style.display = "inline-block";
    inlineBlock.style.width = "30px";
    container.appendChild(inlineBlock);
    const range = doc.createRange();
    range.setStart(t, 0);
    range.setEnd(t, 3);
    const box = range.getBoundingClientRect();
    hasInlineBlockJustificationBug = box.right < 27;
    body.removeChild(container);
  }
  return hasInlineBlockJustificationBug;
}

export let hasSoftWrapOpportunityAfterHyphenBug: boolean | null = null;

export function checkSoftWrapOpportunityAfterHyphenBug(
  body: HTMLElement,
): boolean {
  if (hasSoftWrapOpportunityAfterHyphenBug === null) {
    const doc = body.ownerDocument;
    const container = doc.createElement("div") as HTMLElement;
    container.style.position = "absolute";
    container.style.top = "0px";
    container.style.left = "0px";
    container.style.width = "40px";
    container.style.height = "100px";
    container.style.lineHeight = "16px";
    container.style.fontSize = "16px";
    container.style.textAlign = "justify";
    body.appendChild(container);
    const t = doc.createTextNode("a a-");
    container.appendChild(t);
    const inlineBlock = doc.createElement("span");
    inlineBlock.style.display = "inline-block";
    inlineBlock.style.width = "40px";
    container.appendChild(inlineBlock);
    const range = doc.createRange();
    range.setStart(t, 2);
    range.setEnd(t, 4);
    const box = range.getBoundingClientRect();
    hasSoftWrapOpportunityAfterHyphenBug = box.right < 37;
    body.removeChild(container);
  }
  return hasSoftWrapOpportunityAfterHyphenBug;
}

export let hasSoftWrapOpportunityByWbrBug: boolean | null = null;

export function checkSoftWrapOpportunityByWbrBug(body: HTMLElement): boolean {
  if (hasSoftWrapOpportunityByWbrBug === null) {
    const doc = body.ownerDocument;
    const container = doc.createElement("div") as HTMLElement;
    container.style.position = "absolute";
    container.style.top = "0px";
    container.style.left = "0px";
    container.style.width = "40px";
    container.style.height = "100px";
    container.style.lineHeight = "16px";
    container.style.fontSize = "16px";
    container.style.textAlign = "justify";
    body.appendChild(container);
    const t = doc.createTextNode("a a-");
    container.appendChild(t);
    container.appendChild(doc.createElement("wbr"));
    const inlineBlock = doc.createElement("span");
    inlineBlock.style.display = "inline-block";
    inlineBlock.style.width = "40px";
    container.appendChild(inlineBlock);
    const range = doc.createRange();
    range.setStart(t, 2);
    range.setEnd(t, 4);
    const box = range.getBoundingClientRect();
    hasSoftWrapOpportunityByWbrBug = box.right < 37;
    body.removeChild(container);
  }
  return hasSoftWrapOpportunityByWbrBug;
}
