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
 * @fileoverview Semantic footnote helper utilities.
 */

import * as Base from "./base";

function hasToken(value: string | null, token: string): boolean {
  return !!(value && value.match(new RegExp(`(^|\\s)${token}($|\\s)`)));
}

export function isSemanticFootnoteElement(element: Element): boolean {
  if (element.localName !== "aside") {
    return false;
  }
  if (hasToken(element.getAttribute("role"), "doc-footnote")) {
    return true;
  }
  const epubType =
    element.getAttributeNS(Base.NS.epub, "type") ||
    element.getAttribute("epub:type");
  return hasToken(epubType, "footnote");
}

export function isSemanticFootnoteNoterefElement(element: Element): boolean {
  if (element.localName !== "a") {
    return false;
  }
  if (hasToken(element.getAttribute("role"), "doc-noteref")) {
    return true;
  }
  const epubType =
    element.getAttributeNS(Base.NS.epub, "type") ||
    element.getAttribute("epub:type");
  return hasToken(epubType, "noteref");
}
