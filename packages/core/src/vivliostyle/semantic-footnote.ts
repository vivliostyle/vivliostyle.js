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
 *
 * This module owns semantic-footnote-specific rules that are independent from
 * the main view-generation flow: element/reference detection, shared marker
 * attributes, first-reference bookkeeping, and style-merging helpers that can
 * be driven by injected style accessors.
 *
 * Keep view-tree sequencing and DOM construction in vgen.ts. Extend this
 * module when new DPUB/EPUB semantic footnote behavior can be expressed as
 * pure reference/style helpers that do not need direct access to ViewFactory
 * state.
 */

import * as Base from "./base";
import * as Css from "./css";
import * as Exprs from "./exprs";
import * as Plugin from "./plugin";
import * as Vtree from "./vtree";
import { CssCascade } from "./types";

export const SEMANTIC_FOOTNOTE_FIRST_REF_ATTR =
  "data-vivliostyle-footnote-first-ref";
export const SEMANTIC_FOOTNOTE_REFERENCED_ATTR =
  "data-vivliostyle-footnote-referenced";

type ElementStyleMap = {
  [key: string]: CssCascade.ElementStyle;
};

export type SemanticFootnoteStyleAccess = {
  getStyle: (element: Element) => CssCascade.ElementStyle | null;
  getProp: (
    style: CssCascade.ElementStyle | null | undefined,
    propName: string,
  ) => CssCascade.CascadeValue | null | undefined;
  getStyleMap: (
    style: CssCascade.ElementStyle,
    mapName: string,
  ) => ElementStyleMap | null | undefined;
  getMutableStyleMap: (
    style: CssCascade.ElementStyle,
    mapName: string,
  ) => ElementStyleMap;
  createCascadeValue: (
    value: Css.Val,
    priority: number,
  ) => CssCascade.CascadeValue;
  filterFootnoteMarkerContent: (
    content: CssCascade.CascadeValue,
    element: Element,
  ) => Css.Val;
};

export type SemanticFootnoteStyleState = {
  sourceStyle: CssCascade.ElementStyle | null;
  footnoteDisplay: Css.Val | null;
  footnotePolicy: Css.Ident | null;
};

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

export function resolveSemanticFootnoteReference(
  element: Element,
  baseURL: string,
): string | null {
  if (!isSemanticFootnoteNoterefElement(element)) {
    return null;
  }
  const href =
    element.getAttribute("href") ||
    element.getAttributeNS(Base.NS.XLINK, "href");
  if (!href) {
    return null;
  }
  const resolvedHref = Base.resolveReferenceURL(href, baseURL);
  return resolvedHref === "#" ? null : resolvedHref;
}

export function resolveSemanticFootnoteTarget(
  element: Element,
  baseURL: string,
  resolveElement: (reference: string) => Element | null,
): Element | null {
  const resolvedHref = resolveSemanticFootnoteReference(element, baseURL);
  if (!resolvedHref) {
    return null;
  }
  const target = resolveElement(resolvedHref);
  return target && isSemanticFootnoteElement(target) ? target : null;
}

export function initializeFirstSemanticFootnoteReferenceOffsets(
  ownerDocument: Document,
  baseURL: string,
  getElementOffset: (element: Element) => number,
  firstRefOffsets: Map<string, number>,
  initialized: { value: boolean },
): void {
  if (initialized.value) {
    return;
  }
  const anchorElements = ownerDocument.getElementsByTagName("a");
  for (let i = 0; i < anchorElements.length; i++) {
    const anchor = anchorElements.item(i);
    const resolvedHref = resolveSemanticFootnoteReference(anchor, baseURL);
    if (!resolvedHref || firstRefOffsets.has(resolvedHref)) {
      continue;
    }
    firstRefOffsets.set(resolvedHref, getElementOffset(anchor));
  }
  initialized.value = true;
}

export function shouldGenerateSemanticFootnote(
  element: Element,
  baseURL: string,
  getElementOffset: (element: Element) => number,
  firstRefOffsets: Map<string, number>,
  initialized: { value: boolean },
): boolean {
  if (element.localName !== "a" || !isSemanticFootnoteNoterefElement(element)) {
    return true;
  }
  const resolvedHref = resolveSemanticFootnoteReference(element, baseURL);
  if (!resolvedHref) {
    return true;
  }
  initializeFirstSemanticFootnoteReferenceOffsets(
    element.ownerDocument,
    baseURL,
    getElementOffset,
    firstRefOffsets,
    initialized,
  );
  const firstOffset = firstRefOffsets.get(resolvedHref);
  return firstOffset == null || getElementOffset(element) === firstOffset;
}

function getFootnoteDisplayOverride(
  style: CssCascade.ElementStyle | null,
  styleAccess: SemanticFootnoteStyleAccess,
): CssCascade.CascadeValue | null {
  const footnoteDisplay = styleAccess.getProp(style, "footnote-display");
  if (footnoteDisplay) {
    return footnoteDisplay;
  }
  const display = styleAccess.getProp(style, "display");
  if (display?.value === Css.ident.inline) {
    return styleAccess.createCascadeValue(Css.ident.inline, display.priority);
  }
  return null;
}

export function mergeSemanticFootnoteIncludeStyle(
  element: Element,
  elementStyle: CssCascade.ElementStyle,
  shadowContext: Vtree.ShadowContext | null,
  baseURL: string,
  resolveElement: (reference: string) => Element | null,
  footnoteCounterAttr: string,
  styleAccess: SemanticFootnoteStyleAccess,
): CssCascade.ElementStyle {
  if (
    element.namespaceURI !== Base.NS.SHADOW ||
    element.localName !== "include" ||
    !element.classList.contains("-vivliostyle-footnote-content")
  ) {
    return elementStyle;
  }

  const owner = shadowContext?.owner;
  if (!(owner instanceof Element) || !isSemanticFootnoteNoterefElement(owner)) {
    return elementStyle;
  }

  const target = resolveSemanticFootnoteTarget(owner, baseURL, resolveElement);
  if (!target) {
    return elementStyle;
  }

  const footnoteCounter = owner.getAttribute(footnoteCounterAttr);
  if (footnoteCounter) {
    element.setAttribute(footnoteCounterAttr, footnoteCounter);
    target.setAttribute(footnoteCounterAttr, footnoteCounter);
  } else {
    element.removeAttribute(footnoteCounterAttr);
    target.removeAttribute(footnoteCounterAttr);
  }

  const targetStyle = styleAccess.getStyle(target);
  if (!targetStyle) {
    return elementStyle;
  }

  const mergedStyle = { ...elementStyle } as CssCascade.ElementStyle;
  const footnoteDisplay = getFootnoteDisplayOverride(targetStyle, styleAccess);
  const footnotePolicy = styleAccess.getProp(targetStyle, "footnote-policy");
  const targetPseudos = styleAccess.getStyleMap(targetStyle, "_pseudos");
  const targetAfterPseudo = targetPseudos?.["after"];

  if (footnoteDisplay) {
    mergedStyle["footnote-display"] = footnoteDisplay;
  }
  if (footnotePolicy) {
    mergedStyle["footnote-policy"] = footnotePolicy;
  }
  if (targetAfterPseudo) {
    const pseudos = styleAccess.getMutableStyleMap(mergedStyle, "_pseudos");
    pseudos["after"] = { ...targetAfterPseudo };
  }

  return mergedStyle;
}

export function mergeSemanticFootnoteRootStyle(
  element: Element,
  elementStyle: CssCascade.ElementStyle,
  shadowContext: Vtree.ShadowContext | null,
  context: Exprs.Context,
  styleAccess: SemanticFootnoteStyleAccess,
): CssCascade.ElementStyle {
  if (!(
    shadowContext?.type === Vtree.ShadowType.ROOTED &&
    isSemanticFootnoteElement(element)
  )) {
    return elementStyle;
  }

  const sourceStyle = styleAccess.getStyle(element);
  if (!sourceStyle) {
    return elementStyle;
  }

  const mergedStyle = { ...elementStyle } as CssCascade.ElementStyle;
  const footnoteDisplay = getFootnoteDisplayOverride(sourceStyle, styleAccess);
  const footnotePolicy = styleAccess.getProp(sourceStyle, "footnote-policy");
  const pseudos = styleAccess.getStyleMap(sourceStyle, "_pseudos");
  const footnoteMarkerProps = pseudos?.["footnote-marker"];
  const footnoteMarkerContent = styleAccess.getProp(
    footnoteMarkerProps,
    "content",
  );
  const footnoteMarkerListStylePosition = styleAccess.getProp(
    footnoteMarkerProps,
    "list-style-position",
  );

  if (footnoteDisplay) {
    mergedStyle["footnote-display"] = footnoteDisplay;
  }
  if (footnotePolicy) {
    mergedStyle["footnote-policy"] = footnotePolicy;
  }
  if (
    footnoteMarkerContent &&
    footnoteMarkerListStylePosition?.evaluate(
      context,
      "list-style-position",
    ) === Css.ident.outside
  ) {
    const filteredMarkerContent = styleAccess.filterFootnoteMarkerContent(
      footnoteMarkerContent,
      element,
    );
    mergedStyle["--viv-marker-content"] = styleAccess.createCascadeValue(
      filteredMarkerContent,
      0,
    );
    mergedStyle["display"] = styleAccess.createCascadeValue(
      Css.getName("list-item"),
      0,
    );
    mergedStyle["list-style-position"] = styleAccess.createCascadeValue(
      Css.ident.outside,
      0,
    );
    mergedStyle["list-style-type"] = styleAccess.createCascadeValue(
      Css.ident.none,
      0,
    );
    mergedStyle["list-style-image"] = styleAccess.createCascadeValue(
      Css.ident.none,
      0,
    );
  }

  return mergedStyle;
}

export function getSemanticFootnoteStyleState(
  element: Element,
  shadowContext: Vtree.ShadowContext | null,
  styleAccess: SemanticFootnoteStyleAccess,
): SemanticFootnoteStyleState {
  const sourceStyle =
    shadowContext?.type === Vtree.ShadowType.ROOTED &&
    isSemanticFootnoteElement(element)
      ? styleAccess.getStyle(element)
      : null;
  return {
    sourceStyle,
    footnoteDisplay:
      getFootnoteDisplayOverride(sourceStyle, styleAccess)?.value || null,
    footnotePolicy:
      (styleAccess.getProp(sourceStyle, "footnote-policy")
        ?.value as Css.Ident) || null,
  };
}

export function resolveMarkerContentValue(
  val: Css.Val,
  context: Exprs.Context,
): Css.Val {
  if (val instanceof Css.Expr) {
    const result = val.expr.evaluate(context);
    if (typeof result === "string") {
      return new Css.Str(result);
    }
    if (typeof result === "number") {
      return new Css.Str(String(result));
    }
    return val;
  }
  if (val instanceof Css.SpaceList) {
    return new Css.SpaceList(
      val.values.map((item) => resolveMarkerContentValue(item, context)),
    );
  }
  return val;
}

export function refreshSemanticFootnoteMarkerContent(
  sourceStyle: CssCascade.ElementStyle | null,
  computedStyle: { [key: string]: Css.Val },
  context: Exprs.Context,
): void {
  const rawMarkerContent = sourceStyle?.[
    "_footnote-marker-content"
  ] as CssCascade.CascadeValue;
  if (rawMarkerContent) {
    computedStyle["--viv-marker-content"] = resolveMarkerContentValue(
      rawMarkerContent.value,
      context,
    );
  }
}

/**
 * Mark aside elements that are referenced by semantic footnote noteref anchors
 * with the semantic footnote referenced attribute.
 * This is used by the UA stylesheet to apply `display: none` only to asides
 * that are actually referenced (so unreferenced asides with `float: footnote`
 * set by the author stylesheet are not hidden). (Issue #1823)
 */
function markReferencedFootnoteElements(document: Document): void {
  const anchorElements = document.getElementsByTagName("a");
  const firstReferenceTargets = new Set<string>();
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
      const resolvedHref = anchor.baseURI.replace(/#.*$/, "") + anchor.hash;
      if (!firstReferenceTargets.has(resolvedHref)) {
        firstReferenceTargets.add(resolvedHref);
        anchor.setAttribute(SEMANTIC_FOOTNOTE_FIRST_REF_ATTR, "true");
      }
      target.setAttribute(SEMANTIC_FOOTNOTE_REFERENCED_ATTR, "true");
    }
  }
}

Plugin.registerHook(
  Plugin.HOOKS.PREPROCESS_SINGLE_DOCUMENT,
  markReferencedFootnoteElements,
);
