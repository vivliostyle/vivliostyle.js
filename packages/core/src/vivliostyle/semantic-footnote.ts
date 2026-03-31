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
import * as Plugin from "./plugin";

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

/**
 * Mark aside elements that are referenced by semantic footnote noteref anchors
 * with the `data-vivliostyle-footnote-referenced` attribute.
 * This is used by the UA stylesheet to apply `display: none` only to asides
 * that are actually referenced (so unreferenced asides with `float: footnote`
 * set by the author stylesheet are not hidden). (Issue #1823)
 */
function markReferencedFootnoteElements(document: Document): void {
  const anchorElements = document.getElementsByTagName("a");
  for (let i = 0; i < anchorElements.length; i++) {
    const anchor = anchorElements.item(i);
    if (!isSemanticFootnoteNoterefElement(anchor)) {
      continue;
    }
    // Only handle same-document fragment references, same as :href-role-type()
    if (
      !(anchor instanceof HTMLAnchorElement) ||
      !anchor.hash ||
      anchor.href !== anchor.baseURI.replace(/#.*$/, "") + anchor.hash
    ) {
      continue;
    }
    const id = anchor.hash.substring(1);
    const target = document.getElementById(id);
    if (target && isSemanticFootnoteElement(target)) {
      target.setAttribute("data-vivliostyle-footnote-referenced", "true");
    }
  }
}

Plugin.registerHook(
  Plugin.HOOKS.PREPROCESS_SINGLE_DOCUMENT,
  markReferencedFootnoteElements,
);
