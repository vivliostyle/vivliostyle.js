/**
 * Copyright 2016 Daishinsha Inc.
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
 * @fileoverview Counters, named strings, and running elements
 */
import * as Asserts from "./asserts";
import * as Base from "./base";
import * as CssCascade from "./css-cascade";
import * as CssProp from "./css-prop";
import * as CssStyler from "./css-styler";
import * as Exprs from "./exprs";
import * as Vgen from "./vgen";
import * as Vtree from "./vtree";
import { Layout } from "./types";

/**
 * Clone counter values.
 */
function cloneCounterValues(
  counters: CssCascade.CounterValues,
): CssCascade.CounterValues {
  const result = Object.create(null) as CssCascade.CounterValues;
  Object.keys(counters).forEach((name) => {
    result[name] = Array.from(counters[name]);
  });
  return result;
}

/**
 * Extract text content from an element for a specific pseudo-element.
 * @param element The DOM element to extract text from
 * @param pseudoElement The pseudo-element type: "content", "before", "after" or "marker"
 * @returns The extracted text, or empty string if not found
 */
function extractPseudoElementText(
  element: Element,
  pseudoElement: "content" | "before" | "after" | "marker",
): string {
  if (pseudoElement === "content") {
    // Get main content (excluding ::before and ::after)
    const clone = element.cloneNode(true) as Element;
    const pseudos = clone.querySelectorAll("[data-adapt-pseudo]");
    pseudos.forEach((pseudo) => pseudo.remove());
    return clone.textContent || "";
  } else {
    // Extract ::before or ::after content
    const pseudoElem = element.querySelector(
      `[data-adapt-pseudo="${pseudoElement}"]`,
    );
    return pseudoElem ? pseudoElem.textContent || "" : "";
  }
}

/**
 * Class representing a reference by target-counter(s).
 * @param targetId ID of the referenced element (transformed by
 *     DocumentURLTransformer to handle a reference across multiple source
 *     documents)
 * @param resolved If the reference is already resolved or not
 */
export class TargetCounterReference {
  pageCounters: CssCascade.CounterValues = null;
  spineIndex: number = -1;
  pageIndex: number = -1;

  constructor(
    public readonly targetId: string,
    public resolved: boolean,
  ) {}

  equals(other: TargetCounterReference): boolean {
    if (this === other) {
      return true;
    }
    if (!other) {
      return false;
    }
    return (
      this.targetId === other.targetId &&
      this.resolved === other.resolved &&
      this.spineIndex === other.spineIndex &&
      this.pageIndex === other.pageIndex
    );
  }

  /**
   * Returns if the reference is resolved or not.
   */
  isResolved(): boolean {
    return this.resolved;
  }

  /**
   * Marks that this reference is resolved.
   */
  resolve() {
    this.resolved = true;
  }

  /**
   * Marks that this reference is unresolved.
   */
  unresolve() {
    this.resolved = false;
  }
}

class CounterListener implements CssCascade.CounterListener {
  constructor(
    public readonly counterStore: CounterStore,
    public readonly baseURL: string,
  ) {}

  /** @override */
  countersOfId(id: string, counters: CssCascade.CounterValues) {
    id = this.counterStore.documentURLTransformer.transformFragment(
      id,
      this.baseURL,
    );
    this.counterStore.countersById[id] = counters;
  }

  getExprContentListener(): Vtree.ExprContentListener {
    return this.counterStore.getExprContentListener();
  }
}

/**
 * Map for named string name, element offset, and the string value
 */
type NamedRunningValues = {
  [name: string]: { [elementOffset: number]: string };
};

class CounterResolver implements CssCascade.CounterResolver {
  styler: CssStyler.Styler | null = null;
  namedStringValues: NamedRunningValues = Object.create(null);
  runningElements: NamedRunningValues = Object.create(null);

  constructor(
    public readonly counterStore: CounterStore,
    public readonly baseURL: string,
    public readonly rootScope: Exprs.LexicalScope,
    public readonly pageScope: Exprs.LexicalScope,
  ) {}

  setStyler(styler: CssStyler.Styler): void {
    this.styler = styler;
  }

  private getFragment(url: string): string | null {
    const r = url.match(/^[^#]*#(.*)$/);
    return r ? r[1] : null;
  }

  private getTransformedId(url: string): string {
    let transformedId = this.counterStore.documentURLTransformer.transformURL(
      Base.resolveURL(url, this.baseURL),
      this.baseURL,
    );
    if (transformedId.charAt(0) === "#") {
      transformedId = transformedId.substring(1);
    }
    return transformedId;
  }

  /** @override */
  getPageCounterVal(
    name: string,
    format: (p1: number | null) => string,
  ): Exprs.Val {
    const getCounterNumber = () => {
      const values = this.counterStore.currentPageCounters[name];
      return values && values.length ? values[values.length - 1] : null;
    };

    const expr = new Exprs.Native(
      this.pageScope,
      () => format(getCounterNumber()),
      `page-counter-${name}`,
    );

    const arrayFormat = (arr: number[]) => {
      return format(arr[arr.length - 1]);
    };

    this.counterStore.registerPageCounterExpr(name, arrayFormat, expr);
    return expr;
  }

  /** @override */
  getPageCountersVal(
    name: string,
    format: (p1: number[]) => string,
  ): Exprs.Val {
    const getCounterNumbers = () => {
      return this.counterStore.currentPageCounters[name] || [];
    };

    const expr = new Exprs.Native(
      this.pageScope,
      () => format(getCounterNumbers()),
      `page-counters-${name}`,
    );
    this.counterStore.registerPageCounterExpr(name, format, expr);
    return expr;
  }

  /**
   * Returns (non page-based) counter values for an element with the specified
   * ID. Returns null if the style of the elements has not been calculated yet
   * (i.e. the element does not exit or it is in a source document which is not
   * loaded yet).
   * @param id Original ID value
   * @param transformedId ID transformed by DocumentURLTransformer to handle a
   *     reference across multiple source documents
   * @param lookForElement If true, look ahead for an element with the ID in the
   *     current source document when such an element has not appeared yet. Do
   *     not set to true during Styler.styleUntil is being called, since in that
   *     case Styler.styleUntil can be called again and may lead to internal
   *     inconsistency.
   */
  private getTargetCounters(
    id: string | null,
    transformedId: string,
    lookForElement: boolean,
  ): CssCascade.CounterValues | null {
    let targetCounters = this.counterStore.countersById[transformedId];
    if (!targetCounters && lookForElement && id) {
      this.styler.styleUntilIdIsReached(id);
      targetCounters = this.counterStore.countersById[transformedId];
    }
    return targetCounters || null;
  }

  /**
   * Returns page-based counter values for an element with the specified ID.
   * Returns null if the element has not been laid out yet.
   * @param transformedId ID transformed by DocumentURLTransformer to handle a
   *     reference across multiple source documents
   */
  private getTargetPageCounters(
    transformedId: string,
  ): CssCascade.CounterValues | null {
    if (this.counterStore.currentPage.elementsById[transformedId]) {
      return this.counterStore.currentPageCounters;
    } else {
      return this.counterStore.pageCountersById[transformedId] || null;
    }
  }

  /**
   * Returns document counter snapshot at the start of the page where the
   * target element was laid out. Returns null if the element has not been
   * laid out yet.
   */
  private getTargetPageDocCounters(
    transformedId: string,
  ): CssCascade.CounterValues | null {
    if (this.counterStore.currentPage.elementsById[transformedId]) {
      return this.counterStore.currentPageDocCounters;
    } else {
      return this.counterStore.pageDocCountersById[transformedId] || null;
    }
  }

  /**
   * Adjust element counter values for cross-scope page-controlled counters.
   * The page counter operates at the outermost scope, so only the first
   * (outermost) counter value is adjusted. Returns the adjusted array.
   */
  private adjustCountersForCrossScope(
    name: string,
    elementCounters: number[],
    pageCounters: CssCascade.CounterValues | null,
    docStartCounters: CssCascade.CounterValues | null,
  ): number[] {
    if (!this.counterStore.isPageControlledCounter(name) || !pageCounters) {
      return elementCounters;
    }
    const pageVals = pageCounters[name] || [];
    const pageVal = pageVals.length ? pageVals[pageVals.length - 1] : 0;
    const docStartVals = docStartCounters?.[name] || [];
    const docStartVal = docStartVals.length ? docStartVals[0] : 0;
    if (!elementCounters.length) {
      return [pageVal];
    }
    const adjustedFirst = pageVal + (elementCounters[0] - docStartVal);
    return [adjustedFirst, ...elementCounters.slice(1)];
  }

  /**
   * Returns page-based text content for an element with the specified ID.
   * Returns null if the element has not been laid out yet.
   * @param transformedId ID transformed by DocumentURLTransformer to handle a
   *     reference across multiple source documents
   * @param pseudoElement Pseudo-element to extract text from (content, before, after, first-letter, marker)
   */
  private getTargetPageText(
    transformedId: string,
    pseudoElement: string,
  ): string | null {
    if (this.counterStore.currentPage.elementsById[transformedId]) {
      // Element is on current page - extract text for specific pseudo-element
      const elements =
        this.counterStore.currentPage.elementsById[transformedId];
      if (elements && elements.length > 0) {
        const element = elements[0];

        if (
          pseudoElement === "before" ||
          pseudoElement === "after" ||
          pseudoElement === "marker"
        ) {
          return extractPseudoElementText(element, pseudoElement);
        }
        // For content and other pseudo-elements, fall back to content (excluding ::before and ::after)
        return extractPseudoElementText(element, "content");
      }
      return "";
    } else {
      // Check if the ID exists in pageTextById
      // Need to distinguish between "not yet laid out" (undefined) and "empty text" ("")
      if (transformedId in this.counterStore.pageTextById) {
        const textMap = this.counterStore.pageTextById[transformedId];
        return textMap[pseudoElement] !== undefined
          ? textMap[pseudoElement]
          : textMap["content"] || "";
      }
      return null;
    }
  }

  /** @override */
  getTargetCounterVal(
    url: string,
    name: string,
    format: (p1: number | null) => string,
  ): Exprs.Val {
    const id = this.getFragment(url);
    const transformedId = this.getTransformedId(url);

    // Always use a Native expression so the value is resolved at layout time.
    // This ensures page-controlled counters get the cross-scope adjustment
    // (pageControlledCounterNames may not be set during initial styling).
    const expr = new Exprs.Native(
      this.pageScope,
      () => {
        // Since this block is evaluated during layout, lookForElement
        // argument can be set to true.
        const counters = this.getTargetCounters(id, transformedId, true);

        if (counters) {
          if (counters[name]) {
            const countersOfName = counters[name];
            // Apply cross-scope adjustment for page-controlled counters
            const pageCounters = this.getTargetPageCounters(transformedId);
            const docStartCounters =
              this.getTargetPageDocCounters(transformedId);
            const adjusted = this.adjustCountersForCrossScope(
              name,
              countersOfName,
              pageCounters,
              docStartCounters,
            );
            if (pageCounters) {
              this.counterStore.resolveReference(transformedId);
            }
            return format(adjusted[adjusted.length - 1] || null);
          } else {
            const pageCounters = this.getTargetPageCounters(transformedId);
            if (pageCounters) {
              // The target element has already been laid out.
              this.counterStore.resolveReference(transformedId);

              if (pageCounters[name]) {
                const pageCountersOfName = pageCounters[name];
                return format(
                  pageCountersOfName[pageCountersOfName.length - 1] || null,
                );
              } else {
                // No corresponding counter with the name.
                return format(0);
              }
            } else {
              // The target element has not been laid out yet.
              this.counterStore.saveReferenceOfCurrentPage(
                transformedId,
                false,
              );
              return "??"; // TODO more reasonable placeholder?
            }
          }
        } else {
          // The style of target element has not been calculated yet.
          // (The element is in another source document that is not parsed
          // yet)
          this.counterStore.saveReferenceOfCurrentPage(transformedId, false);
          return "??"; // TODO more reasonable placeholder?
        }
      },
      `target-counter-${name}-of-${url}`,
    );

    this.counterStore.registerTargetCounterExpr(
      name,
      format,
      expr,
      transformedId,
    );
    return expr;
  }

  /** @override */
  getTargetCountersVal(
    url: string,
    name: string,
    format: (p1: number[]) => string,
  ): Exprs.Val {
    const id = this.getFragment(url);
    const transformedId = this.getTransformedId(url);
    return new Exprs.Native(
      this.pageScope,
      () => {
        const pageCounters = this.getTargetPageCounters(transformedId);

        if (!pageCounters) {
          // The target element has not been laid out yet.
          this.counterStore.saveReferenceOfCurrentPage(transformedId, false);
          return "??"; // TODO more reasonable placeholder?
        } else {
          this.counterStore.resolveReference(transformedId);
          const elementCounters = this.getTargetCounters(
            id,
            transformedId,
            true,
          );
          const elementCountersOfName = elementCounters?.[name] || [];
          // Apply cross-scope adjustment for page-controlled counters
          const docStartCounters = this.getTargetPageDocCounters(transformedId);
          const adjusted = this.adjustCountersForCrossScope(
            name,
            elementCountersOfName,
            pageCounters,
            docStartCounters,
          );
          if (adjusted.length) {
            return format(adjusted);
          }
          // Fall back to page-only counters if no element counters
          const pageCountersOfName = pageCounters[name] || [];
          return format(pageCountersOfName);
        }
      },
      `target-counters-${name}-of-${url}`,
    );
  }

  /** @override */
  getTargetTextVal(url: string, pseudoElement: string): Exprs.Val {
    const transformedId = this.getTransformedId(url);

    const expr = new Exprs.Native(
      this.pageScope,
      () => {
        // Handle first-letter separately
        if (pseudoElement === "first-letter") {
          // Respect pseudo-elements
          const beforeText = this.getTargetPageText(transformedId, "before");
          const contentText = this.getTargetPageText(transformedId, "content");
          const afterText = this.getTargetPageText(transformedId, "after");

          // Check if target element has been laid out
          if (
            beforeText === null &&
            contentText === null &&
            afterText === null
          ) {
            this.counterStore.saveReferenceOfCurrentPage(transformedId, false);
            return "??";
          }

          const text =
            (beforeText ?? "") + (contentText ?? "") + (afterText ?? "");
          this.counterStore.resolveReference(transformedId);

          const match = text.match(Base.firstLetterPattern);
          return match ? match[0] : "";
        }

        // For other pseudo-elements, get specific text
        let pageText = this.getTargetPageText(transformedId, pseudoElement);
        if (pageText !== null) {
          // The target element has already been laid out.
          this.counterStore.resolveReference(transformedId);
          return pageText;
        } else {
          // The target element has not been laid out yet.
          this.counterStore.saveReferenceOfCurrentPage(transformedId, false);
          return "??"; // TODO more reasonable placeholder?
        }
      },
      `target-text-${pseudoElement}-of-${url}`,
    );

    this.counterStore.registerTargetTextExpr(
      pseudoElement,
      expr,
      transformedId,
    );
    return expr;
  }

  /**
   * Get value of the CSS string() function
   * https://drafts.csswg.org/css-gcpm-3/#using-named-strings
   */
  getNamedStringVal(name: string, retrievePosition: string): Exprs.Val {
    return new Exprs.Native(
      this.pageScope,
      () =>
        this.getRunningValue(this.namedStringValues, name, retrievePosition),
      `named-string-${retrievePosition}-${name}`,
    );
  }

  /**
   * Get value of the CSS element() function
   * https://drafts.csswg.org/css-gcpm-3/#running-elements
   */
  getRunningElementVal(name: string, retrievePosition: string): Exprs.Val {
    return new Exprs.Native(
      this.pageScope,
      () => this.getRunningValue(this.runningElements, name, retrievePosition),
      `running-element-${retrievePosition}-${name}`,
    );
  }

  private getRunningValue(
    namedRunningValues: NamedRunningValues,
    name: string,
    retrievePosition: string,
  ): string {
    const runningValues = namedRunningValues[name];
    if (!runningValues) {
      return "";
    }
    const offsets = Object.keys(runningValues)
      .map((a) => parseInt(a, 10))
      .sort(Base.numberCompare);

    const currentPage = this.counterStore.currentPage;
    const pageStartOffset = currentPage.isBlankPage
      ? currentPage.offset - 1
      : currentPage.offset;
    const pageLastOffset = currentPage.isBlankPage
      ? pageStartOffset
      : Math.max(
          pageStartOffset,
          ...Array.from(
            currentPage.container.querySelectorAll(
              `[${Base.ELEMENT_OFFSET_ATTR}]`,
            ),
          ).map((e) => parseInt(e.getAttribute(Base.ELEMENT_OFFSET_ATTR), 10)),
        );

    let firstOffset = -1;
    let startOffset = -1;
    let lastOffset = -1;
    let firstExceptOffset = -1;

    for (let i = 0; i < offsets.length; i++) {
      const offset = offsets[i];
      const offsetPrev = i > 0 ? offsets[i - 1] : -1;
      const offsetNext = i < offsets.length - 1 ? offsets[i + 1] : -1;
      if (offset > pageLastOffset) {
        break;
      }
      if (offset >= pageStartOffset) {
        if (firstOffset < 0) {
          firstOffset = offset;
          firstExceptOffset = -1;
        }
        if (startOffset < 0) {
          if (offset === pageStartOffset) {
            startOffset = offset;
          } else {
            if (offsetPrev < firstOffset) {
              startOffset = offsetPrev;
            }
            // Check if the element at the offset is at beginning of the page
            const elementAtOffset = currentPage.container.querySelector(
              `[${Base.ELEMENT_OFFSET_ATTR}="${offset}"]`,
            );
            if (!elementAtOffset) {
              // title or meta elements are not output, but should be treated as start
              if (startOffset < 0) {
                startOffset = offset;
              }
            } else {
              let elementAtPageStartOffset =
                currentPage.container.querySelector(
                  `[${Base.ELEMENT_OFFSET_ATTR}="${pageStartOffset}"]`,
                );
              if (!elementAtPageStartOffset) {
                // The element at pageStartOffset is not found when page break occured
                // within an element, so use the ancestor element with offset 0 instead.
                elementAtPageStartOffset = currentPage.container.querySelector(
                  `[${Base.ELEMENT_OFFSET_ATTR}="0"]`,
                );
              }
              if (elementAtPageStartOffset) {
                // Find if the element at the offset is (the first child of)* the element at page start
                for (
                  let element = elementAtPageStartOffset;
                  element;
                  element = element.firstElementChild
                ) {
                  if (element === elementAtOffset) {
                    startOffset = offset;
                    break;
                  }
                }
              }
            }
          }
        }
        lastOffset = offset;
      } else if (offsetNext > pageLastOffset || offsetNext < 0) {
        firstOffset = startOffset = lastOffset = firstExceptOffset = offset;
      }
    }

    const runningValue =
      runningValues[
        {
          first: firstOffset,
          start: startOffset,
          last: lastOffset,
          "first-except": firstExceptOffset,
        }[retrievePosition]
      ] || "";

    return runningValue;
  }

  /**
   * Set named string for the CSS string-set property
   * https://drafts.csswg.org/css-gcpm-3/#setting-named-strings-the-string-set-pro
   */
  setNamedString(
    name: string,
    stringValue: string,
    elementOffset: number,
  ): void {
    const values =
      this.namedStringValues[name] ||
      (this.namedStringValues[name] = Object.create(null));
    values[elementOffset] = stringValue;
  }

  /**
   * Set running element
   * https://drafts.csswg.org/css-gcpm-3/#running-elements
   */
  setRunningElement(name: string, elementOffset: number): void {
    const values =
      this.runningElements[name] ||
      (this.runningElements[name] = Object.create(null));
    values[elementOffset] = String(elementOffset);
  }
}

export class CounterStore {
  countersById: { [key: string]: CssCascade.CounterValues } =
    Object.create(null);
  pageCountersById: { [key: string]: CssCascade.CounterValues } =
    Object.create(null);
  pageDocCountersById: { [key: string]: CssCascade.CounterValues } =
    Object.create(null);
  pageTextById: { [key: string]: { [pseudoElement: string]: string } } =
    Object.create(null);
  currentPageDocCounters: CssCascade.CounterValues | null = null;
  previousPageDocCounters: CssCascade.CounterValues | null = null;
  currentPageDocCounterChanges: { [key: string]: boolean } =
    Object.create(null);
  currentPageDocCounterChangeTypes: {
    [key: string]: "reset" | "set" | "increment";
  } = Object.create(null);
  currentPageCounters: CssCascade.CounterValues = Object.create(null);
  previousPageCounters: CssCascade.CounterValues = Object.create(null);
  currentPageCountersStack: CssCascade.CounterValues[] = [];
  pageIndicesById: {
    [key: string]: { spineIndex: number; pageIndex: number };
  } = Object.create(null);
  currentPage: Vtree.Page = null;
  newReferencesOfCurrentPage: TargetCounterReference[] = [];
  referencesToSolve: TargetCounterReference[] = [];
  referencesToSolveStack: TargetCounterReference[][] = [];
  unresolvedReferences: { [key: string]: TargetCounterReference[] } =
    Object.create(null);
  resolvedReferences: { [key: string]: TargetCounterReference[] } =
    Object.create(null);
  pageControlledCounterNames: { [key: string]: boolean } = Object.assign(
    Object.create(null),
    { page: true },
  );
  private pagesCounterExprs: {
    expr: Exprs.Val;
    format: (p1: number[]) => string;
  }[] = [];
  private pageCounterExprs: {
    expr: Exprs.Val;
    format: (p1: number[]) => string;
  }[] = [];

  private targetCounterExprs: {
    name: string;
    expr: Exprs.Val;
    format: (p1: number) => string;
    transformedId: string;
  }[] = [];

  private targetTextExprs: {
    pseudoElement: string;
    expr: Exprs.Val;
    transformedId: string;
  }[] = [];

  constructor(
    public readonly documentURLTransformer: Base.DocumentURLTransformer,
  ) {
    this.currentPageCounters["page"] = [0];
  }

  createCounterListener(baseURL: string): CssCascade.CounterListener {
    return new CounterListener(this, baseURL);
  }

  createCounterResolver(
    baseURL: string,
    rootScope: Exprs.LexicalScope,
    pageScope: Exprs.LexicalScope,
  ): CssCascade.CounterResolver {
    return new CounterResolver(this, baseURL, rootScope, pageScope);
  }

  setCurrentPage(page: Vtree.Page) {
    this.currentPage = page;
  }

  setCurrentPageDocCounters(
    counters: CssCascade.CounterValues | null,
    changes: string[] | null,
    changeTypes?: { [key: string]: "reset" | "set" | "increment" },
  ) {
    this.previousPageDocCounters = this.currentPageDocCounters
      ? cloneCounterValues(this.currentPageDocCounters)
      : null;
    this.currentPageDocCounters = counters
      ? cloneCounterValues(counters)
      : null;
    this.currentPageDocCounterChanges = Object.create(null);
    this.currentPageDocCounterChangeTypes = changeTypes
      ? { ...changeTypes }
      : Object.create(null);
    if (changes) {
      changes.forEach((name) => {
        this.currentPageDocCounterChanges[name] = true;
      });
    }
  }

  setPageControlledCounterNames(names: string[]) {
    const map: { [key: string]: boolean } = Object.assign(Object.create(null), {
      page: true,
    });
    names.forEach((name) => {
      map[name] = true;
    });
    this.pageControlledCounterNames = map;
  }

  isPageControlledCounter(name: string): boolean {
    return !!this.pageControlledCounterNames[name];
  }

  private definePageCounter(counterName: string, value: number) {
    if (this.currentPageCounters[counterName]) {
      this.currentPageCounters[counterName].push(value);
    } else {
      this.currentPageCounters[counterName] = [value];
    }
  }

  /**
   * Forcefully set the `page` page-based counter to the specified value.
   */
  forceSetPageCounter(pageNumber: number) {
    const counters = this.currentPageCounters["page"];
    if (!counters || !counters.length) {
      this.currentPageCounters["page"] = [pageNumber];
    } else {
      counters[counters.length - 1] = pageNumber;
    }
  }

  /**
   * Update the page-based counters with 'counter-reset' and 'counter-increment'
   * properties within the page context. Call before starting layout of the
   * page.
   */
  updatePageCounters(
    cascadedPageStyle: CssCascade.ElementStyle,
    context: Exprs.Context,
  ) {
    // Save page counters to previousPageCounters before updating
    this.previousPageCounters = cloneCounterValues(this.currentPageCounters);
    // Track document counter changes so page-controlled counters can be
    // advanced from the page-start snapshot without double counting.
    const docChanges = this.currentPageDocCounterChanges || {};
    const docChangeTypes = this.currentPageDocCounterChangeTypes || {};
    const docCounterInfo: {
      [key: string]: { delta: number; reset: boolean; value: number };
    } = Object.create(null);
    if (this.currentPageDocCounters) {
      const prevDocCounters = this.previousPageDocCounters || {};
      for (const counterName in this.currentPageDocCounters) {
        if (!docChanges[counterName]) {
          continue;
        }
        const docCounters = this.currentPageDocCounters[counterName];
        const docVal = docCounters.length
          ? docCounters[docCounters.length - 1]
          : 0;
        const prevDocCountersOfName = prevDocCounters[counterName] || [];
        const prevDocVal = prevDocCountersOfName.length
          ? prevDocCountersOfName[prevDocCountersOfName.length - 1]
          : 0;
        const delta = docVal - prevDocVal;
        const changeType = docChangeTypes[counterName];
        const isResetOrSet = changeType === "reset" || changeType === "set";
        docCounterInfo[counterName] = {
          delta,
          reset: isResetOrSet,
          value: docVal,
        };
      }
    }
    const skipIncrement: { [key: string]: boolean } = Object.create(null);
    let resetMap: { [key: string]: number };
    const reset = cascadedPageStyle["counter-reset"] as CssCascade.CascadeValue;
    if (reset) {
      const resetVal = reset.evaluate(context);
      if (resetVal) {
        resetMap = CssProp.toCounters(resetVal, { reset: true });
      }
    }
    if (resetMap && "pages" in resetMap) {
      delete resetMap["pages"];
    }
    let setMap: { [key: string]: number };
    const set = cascadedPageStyle["counter-set"] as CssCascade.CascadeValue;
    if (set) {
      const setVal = set.evaluate(context);
      if (setVal) {
        setMap = CssProp.toCounters(setVal, { defaultValue: 0 });
      }
    }
    if (setMap && "pages" in setMap) {
      delete setMap["pages"];
    }
    const pageControlledNames: string[] = [];
    if (resetMap) {
      for (const resetCounterName in resetMap) {
        pageControlledNames.push(resetCounterName);
      }
    }
    if (setMap) {
      for (const setCounterName in setMap) {
        pageControlledNames.push(setCounterName);
      }
    }
    let incrementMap: { [key: string]: number };
    const increment = cascadedPageStyle[
      "counter-increment"
    ] as CssCascade.CascadeValue;
    if (increment) {
      const incrementVal = increment.evaluate(context);
      if (incrementVal) {
        incrementMap = CssProp.toCounters(incrementVal);
      }
    }
    if (incrementMap && "pages" in incrementMap) {
      delete incrementMap["pages"];
    }

    // If 'counter-increment' for the builtin 'page' counter is absent, add it
    // with value 1.
    if (incrementMap) {
      if (
        !("page" in incrementMap) &&
        !(docCounterInfo["page"] && docCounterInfo["page"].reset)
      ) {
        incrementMap["page"] = 1;
      }
    } else {
      incrementMap = Object.create(null);
      if (!(docCounterInfo["page"] && docCounterInfo["page"].reset)) {
        incrementMap["page"] = 1;
      }
    }
    for (const incrementCounterName in incrementMap) {
      pageControlledNames.push(incrementCounterName);
    }
    this.setPageControlledCounterNames(pageControlledNames);
    // Start from previous page counters, then reconcile with document counters
    // so page-scoped and document-scoped counters stay consistent.
    const baseCounters = cloneCounterValues(this.previousPageCounters);
    if (this.currentPageDocCounters) {
      for (const counterName in this.currentPageDocCounters) {
        if (this.isPageControlledCounter(counterName)) {
          const info = docCounterInfo[counterName];
          if (info) {
            if (info.reset) {
              baseCounters[counterName] = [info.value];
              skipIncrement[counterName] = true;
            } else if (info.delta !== 0) {
              if (!baseCounters[counterName]) {
                baseCounters[counterName] = [0];
              }
              const counterValues = baseCounters[counterName];
              counterValues[counterValues.length - 1] += info.delta;
            }
          }
          continue;
        }
        baseCounters[counterName] = Array.from(
          this.currentPageDocCounters[counterName],
        );
      }
    }
    this.currentPageCounters = baseCounters;
    if (resetMap) {
      for (const resetCounterName in resetMap) {
        this.definePageCounter(resetCounterName, resetMap[resetCounterName]);
      }
    }
    if (setMap) {
      // Apply counter-set after reset to match counter update order
      // (reset -> set -> increment).
      for (const setCounterName in setMap) {
        if (!this.currentPageCounters[setCounterName]) {
          this.definePageCounter(setCounterName, setMap[setCounterName]);
        } else {
          const counterValues = this.currentPageCounters[setCounterName];
          counterValues[counterValues.length - 1] = setMap[setCounterName];
        }
      }
    }
    for (const incrementCounterName in incrementMap) {
      if (skipIncrement[incrementCounterName]) {
        continue;
      }
      if (!this.currentPageCounters[incrementCounterName]) {
        this.definePageCounter(incrementCounterName, 0);
      }
      const counterValues = this.currentPageCounters[incrementCounterName];
      counterValues[counterValues.length - 1] +=
        incrementMap[incrementCounterName];
    }
  }

  /**
   * Save current page-based counters values and set them to the values passed
   * in. The saved counter values can be restored by popPageCounters method.
   */
  pushPageCounters(counters: CssCascade.CounterValues) {
    this.currentPageCountersStack.push(this.currentPageCounters);
    this.currentPageCounters = cloneCounterValues(counters);
  }

  /**
   * Restore previously saved page-based counter values.
   */
  popPageCounters() {
    this.currentPageCounters = this.currentPageCountersStack.pop();
  }

  /**
   * Resolve a reference with the specified ID.
   */
  resolveReference(id: string) {
    const unresolvedRefs = this.unresolvedReferences[id];
    let resolvedRefs = this.resolvedReferences[id];
    if (!resolvedRefs) {
      resolvedRefs = this.resolvedReferences[id] = [];
    }
    let pushed = false;
    for (let i = 0; i < this.referencesToSolve.length; ) {
      const ref = this.referencesToSolve[i];
      if (ref.targetId === id) {
        ref.resolve();
        this.referencesToSolve.splice(i, 1);
        if (unresolvedRefs) {
          const j = unresolvedRefs.indexOf(ref);
          if (j >= 0) {
            unresolvedRefs.splice(j, 1);
          }
        }
        resolvedRefs.push(ref);
        pushed = true;
      } else {
        i++;
      }
    }
    if (!pushed) {
      this.saveReferenceOfCurrentPage(id, true);
    }
  }

  /**
   * Save a reference appeared in the current page.
   * @param resolved If the reference is already resolved or not.
   */
  saveReferenceOfCurrentPage(id: string, resolved: boolean) {
    if (!this.newReferencesOfCurrentPage.some((ref) => ref.targetId === id)) {
      const ref = new TargetCounterReference(id, resolved);
      this.newReferencesOfCurrentPage.push(ref);
    }
  }

  /**
   * Finish the current page; elements with ID are collected and saved with
   * current page-based counter values internally.
   * @param spineIndex Index of the currently laid out spine item
   * @param pageIndex Index of the currently laid out page in its spine item
   */
  finishPage(spineIndex: number, pageIndex: number) {
    const ids = Object.keys(this.currentPage.elementsById);
    if (ids.length > 0) {
      const currentPageCounters = cloneCounterValues(this.currentPageCounters);
      const currentPageDocCounters = this.currentPageDocCounters
        ? cloneCounterValues(this.currentPageDocCounters)
        : null;
      ids.forEach((id) => {
        this.pageCountersById[id] = currentPageCounters;
        if (currentPageDocCounters) {
          this.pageDocCountersById[id] = currentPageDocCounters;
        }

        // Capture text content for target-text()
        const elements = this.currentPage.elementsById[id];
        if (elements && elements.length > 0) {
          const element = elements[0];
          this.pageTextById[id] = {
            content: extractPseudoElementText(element, "content"),
            before: extractPseudoElementText(element, "before"),
            after: extractPseudoElementText(element, "after"),
            marker: extractPseudoElementText(element, "marker"),
          };
        }

        const oldPageIndex = this.pageIndicesById[id];
        if (oldPageIndex && oldPageIndex.pageIndex < pageIndex) {
          const resolvedRefs = this.resolvedReferences[id];
          if (resolvedRefs) {
            let unresolvedRefs = this.unresolvedReferences[id];
            if (!unresolvedRefs) {
              unresolvedRefs = this.unresolvedReferences[id] = [];
            }
            let ref: TargetCounterReference;
            while ((ref = resolvedRefs.shift())) {
              ref.unresolve();
              unresolvedRefs.push(ref);
            }
          }
        }
        this.pageIndicesById[id] = { spineIndex, pageIndex };
      });
    }
    const prevPageCounters = this.previousPageCounters;
    let ref: TargetCounterReference;
    while ((ref = this.newReferencesOfCurrentPage.shift())) {
      ref.pageCounters = prevPageCounters;
      ref.spineIndex = spineIndex;
      ref.pageIndex = pageIndex;
      let arr: TargetCounterReference[];
      if (ref.isResolved()) {
        arr = this.resolvedReferences[ref.targetId];
        if (!arr) {
          arr = this.resolvedReferences[ref.targetId] = [];
        }
      } else {
        arr = this.unresolvedReferences[ref.targetId];
        if (!arr) {
          arr = this.unresolvedReferences[ref.targetId] = [];
        }
      }
      if (arr.every((r) => !ref.equals(r))) {
        arr.push(ref);
      }
    }
    this.currentPage = null;
  }

  /**
   * Returns unresolved references pointing to the specified page.
   */
  getUnresolvedRefsToPage(page: Vtree.Page): {
    spineIndex: number;
    pageIndex: number;
    pageCounters: CssCascade.CounterValues;
    refs: TargetCounterReference[];
  }[] {
    let refs: TargetCounterReference[] = [];
    const ids = Object.keys(page.elementsById);
    ids.forEach((id) => {
      const idRefs = this.unresolvedReferences[id];
      if (idRefs) {
        refs = refs.concat(idRefs);
      }
    });
    refs.sort(
      (r1, r2) => r1.spineIndex - r2.spineIndex || r1.pageIndex - r2.pageIndex,
    );
    const result: {
      spineIndex: number;
      pageIndex: number;
      pageCounters: CssCascade.CounterValues;
      refs: TargetCounterReference[];
    }[] = [];
    let o: {
      spineIndex: number;
      pageIndex: number;
      pageCounters: CssCascade.CounterValues;
      refs: TargetCounterReference[];
    } = null;
    refs.forEach((ref) => {
      if (
        !o ||
        o.spineIndex !== ref.spineIndex ||
        o.pageIndex !== ref.pageIndex
      ) {
        o = {
          spineIndex: ref.spineIndex,
          pageIndex: ref.pageIndex,
          pageCounters: ref.pageCounters,
          refs: [ref],
        };
        result.push(o);
      } else {
        o.refs.push(ref);
      }
    });
    return result;
  }

  /**
   * Save current references to solve and set them to the values passed in.
   * The saved references can be restored by popReferencesToSolve method.
   */
  pushReferencesToSolve(refs: TargetCounterReference[]) {
    this.referencesToSolveStack.push(this.referencesToSolve);
    this.referencesToSolve = refs;
  }

  /**
   * Restore previously saved references to solve.
   */
  popReferencesToSolve() {
    this.referencesToSolve = this.referencesToSolveStack.pop();
  }

  registerPageCounterExpr(
    name: string,
    format: (p1: number[]) => string,
    expr: Exprs.Val,
  ) {
    if (name === "pages") {
      this.pagesCounterExprs.push({ expr, format });
    } else {
      this.pageCounterExprs.push({ expr, format });
    }
  }
  registerTargetCounterExpr(
    name: string,
    format: (p1: number) => string,
    expr: Exprs.Val,
    transformedId: string,
  ) {
    this.targetCounterExprs.push({ name, expr, format, transformedId });
  }

  registerTargetTextExpr(
    pseudoElement: string,
    expr: Exprs.Val,
    transformedId: string,
  ) {
    this.targetTextExprs.push({ pseudoElement, expr, transformedId });
  }

  getExprContentListener(): Vtree.ExprContentListener {
    return this.exprContentListener.bind(this);
  }

  private exprContentListener(
    expr: Exprs.Val,
    val: string,
    document: Document,
  ) {
    if (expr instanceof Exprs.Native) {
      if (expr.str == "viv-leader") {
        const node = document.createElementNS(Base.NS.XHTML, "span");
        node.textContent = val;
        node.setAttribute("data-viv-leader", expr.key);
        node.setAttribute("data-viv-leader-value", val);
        return node;
      } else if (expr.str.startsWith("running-element-")) {
        const elemList =
          val &&
          document.querySelectorAll(`[${Base.ELEMENT_OFFSET_ATTR}="${val}"]`);
        if (!elemList || elemList.length === 0) {
          return null;
        }
        const lastElem = elemList[elemList.length - 1];
        const clonedElem = lastElem.cloneNode(true) as HTMLElement;
        this.fixPageCounterInRunningElement(clonedElem);
        clonedElem.style.position = "";
        clonedElem.style.visibility = "";
        return clonedElem;
      } else if (expr.str.startsWith("target-counter-")) {
        const node = document.createElementNS(Base.NS.XHTML, "span");
        node.textContent = val;
        node.setAttribute(TARGET_COUNTER_ATTR, expr.key);
        return node;
      } else if (expr.str.startsWith("target-text-")) {
        const node = document.createElementNS(Base.NS.XHTML, "span");
        node.textContent = val;
        node.setAttribute(TARGET_TEXT_ATTR, expr.key);
        return node;
      }
    }

    const foundPagesCounter =
      this.pagesCounterExprs.findIndex((o) => o.expr === expr) >= 0;
    const foundPageCounter =
      !foundPagesCounter &&
      this.pageCounterExprs.findIndex((o) => o.expr === expr) >= 0;

    if (foundPagesCounter || foundPageCounter) {
      const node = document.createElementNS(Base.NS.XHTML, "span");
      node.textContent = val;
      node.setAttribute(
        foundPagesCounter ? PAGES_COUNTER_ATTR : PAGE_COUNTER_ATTR,
        expr.key,
      );
      return node;
    } else {
      return null;
    }
  }

  private fixPageCounterInRunningElement(runningElem: Element): void {
    const nodes = runningElem.querySelectorAll(`[${PAGE_COUNTER_ATTR}]`);
    for (const node of nodes) {
      const key = node.getAttribute(PAGE_COUNTER_ATTR);
      const counterExpr = this.pageCounterExprs.find((o) => o.expr.key === key);
      const str = (counterExpr?.expr as Exprs.Native).str;
      const counterName = str?.replace(/^page-counters?-/, "");
      const counterValues = this.currentPageCounters[counterName];
      if (counterValues) {
        node.textContent = counterExpr.format(counterValues);
      }
    }
    const targetNodes = runningElem.querySelectorAll(
      `[${TARGET_COUNTER_ATTR}]`,
    );

    for (const node of targetNodes) {
      node.setAttribute(TARGET_COUNTER_IN_RUNNING_ATTR, true);
    }

    const targetTextNodes = runningElem.querySelectorAll(
      `[${TARGET_TEXT_ATTR}]`,
    );

    for (const node of targetTextNodes) {
      node.setAttribute(TARGET_TEXT_IN_RUNNING_ATTR, true);
    }
  }

  finishLastPage(viewport: Vgen.Viewport) {
    const nodes = viewport.root.querySelectorAll(`[${PAGES_COUNTER_ATTR}]`);
    const pages = viewport.contentContainer.childElementCount;
    for (const node of nodes) {
      const key = node.getAttribute(PAGES_COUNTER_ATTR);
      const i = this.pagesCounterExprs.findIndex((o) => o.expr.key === key);
      Asserts.assert(i >= 0);
      node.textContent = this.pagesCounterExprs[i].format([pages]);
    }

    const runningNodes = viewport.root.querySelectorAll(
      `[${TARGET_COUNTER_IN_RUNNING_ATTR}]`,
    );

    for (const node of runningNodes) {
      const key = node.getAttribute(TARGET_COUNTER_ATTR);
      const expr = this.targetCounterExprs.find((o) => o.expr.key === key);
      if (expr && expr.transformedId) {
        const counterValue = this.pageCountersById[expr.transformedId];
        if (counterValue) {
          const arr: number[] = counterValue[expr.name];
          if (arr) {
            node.textContent = expr.format(arr[arr.length - 1]);
          }
        }
      }
    }

    const runningTextNodes = viewport.root.querySelectorAll(
      `[${TARGET_TEXT_IN_RUNNING_ATTR}]`,
    );

    for (const node of runningTextNodes) {
      const key = node.getAttribute(TARGET_TEXT_ATTR);
      const expr = this.targetTextExprs.find((o) => o.expr.key === key);
      if (expr && expr.transformedId) {
        const text = this.pageTextById[expr.transformedId];
        if (text) {
          node.textContent = text[expr.pseudoElement] ?? "";
        }
      }
    }
  }

  createLayoutConstraint(pageIndex: number): Layout.LayoutConstraint {
    return new LayoutConstraint(this, pageIndex);
  }
}

export const PAGES_COUNTER_ATTR = "data-vivliostyle-pages-counter";
export const PAGE_COUNTER_ATTR = "data-vivliostyle-page-counter";
export const TARGET_COUNTER_ATTR = "data-vivliostyle-target-counter";
export const TARGET_TEXT_ATTR = "data-vivliostyle-target-text";

export const TARGET_COUNTER_IN_RUNNING_ATTR =
  "data-vivliostyle-target-counter-in-running";
export const TARGET_TEXT_IN_RUNNING_ATTR =
  "data-vivliostyle-target-text-in-running";

class LayoutConstraint implements Layout.LayoutConstraint {
  constructor(
    public readonly counterStore: CounterStore,
    public readonly pageIndex: number,
  ) {}

  /** @override */
  allowLayout(nodeContext: Vtree.NodeContext): boolean {
    if (!nodeContext || nodeContext.after) {
      return true;
    }
    const viewNode = nodeContext.viewNode;
    if (!viewNode || viewNode.nodeType !== 1) {
      return true;
    }
    const id =
      (viewNode as Element).getAttribute("data-vivliostyle-id") ||
      (viewNode as Element).getAttribute("id") ||
      (viewNode as Element).getAttribute("name");
    if (!id) {
      return true;
    }
    if (
      !this.counterStore.resolvedReferences[id] &&
      !this.counterStore.unresolvedReferences[id]
    ) {
      return true;
    }
    const pageIndex = this.counterStore.pageIndicesById[id];
    if (!pageIndex) {
      return true;
    }
    return this.pageIndex >= pageIndex.pageIndex;
  }
}
