/**
 * Copyright 2016 Trim-marks Inc.
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
 * @fileoverview Counters and named strings
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
  const result = {};
  Object.keys(counters).forEach((name) => {
    result[name] = Array.from(counters[name]);
  });
  return result;
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

  constructor(public readonly targetId: string, public resolved: boolean) {}

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
type NamedStringValues = {
  [name: string]: { [elementOffset: number]: string };
};

class CounterResolver implements CssCascade.CounterResolver {
  styler: CssStyler.Styler | null = null;
  namedStringValues: NamedStringValues = {};

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

    const arrayFormat = (arr) => {
      return format(arr[0]);
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

  /** @override */
  getTargetCounterVal(
    url: string,
    name: string,
    format: (p1: number | null) => string,
  ): Exprs.Val {
    const id = this.getFragment(url);
    const transformedId = this.getTransformedId(url);

    // Since this method is executed during Styler.styleUntil is being called,
    // set false to lookForElement argument.
    let counters = this.getTargetCounters(id, transformedId, false);
    if (counters && counters[name]) {
      // Since an element-based counter is defined, any page-based counter is
      // obscured even if it exists.
      const countersOfName = counters[name];
      return new Exprs.Const(
        this.rootScope,
        format(countersOfName[countersOfName.length - 1] || null),
      );
    }
    return new Exprs.Native(
      this.pageScope,
      () => {
        // Since This block is evaluated during layout, lookForElement
        // argument can be set to true.
        counters = this.getTargetCounters(id, transformedId, true);

        if (counters) {
          if (counters[name]) {
            // Since an element-based counter is defined, any page-based
            // counter is obscured even if it exists.
            const countersOfName = counters[name];
            return format(countersOfName[countersOfName.length - 1] || null);
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
          const pageCountersOfName = pageCounters[name] || [];
          const elementCounters = this.getTargetCounters(
            id,
            transformedId,
            true,
          );
          const elementCountersOfName = elementCounters[name] || [];
          return format(pageCountersOfName.concat(elementCountersOfName));
        }
      },
      `target-counters-${name}-of-${url}`,
    );
  }

  /**
   * Get value of the CSS string() function
   * https://drafts.csswg.org/css-gcpm-3/#using-named-strings
   */
  getNamedStringVal(name: string, retrievePosition: string): Exprs.Val {
    return new Exprs.Native(
      this.pageScope,
      () => {
        const stringValues = this.namedStringValues[name];
        if (!stringValues) {
          return "";
        }
        const offsets = Object.keys(stringValues)
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
              ).map((e) =>
                parseInt(e.getAttribute(Base.ELEMENT_OFFSET_ATTR), 10),
              ),
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
                    elementAtPageStartOffset =
                      currentPage.container.querySelector(
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

        const stringValue =
          stringValues[
            {
              first: firstOffset,
              start: startOffset,
              last: lastOffset,
              "first-except": firstExceptOffset,
            }[retrievePosition]
          ] || "";

        return stringValue;
      },
      `named-string-${retrievePosition}-${name}`,
    );
  }

  /**
   * Set named string for the CSS string-set property
   * https://drafts.csswg.org/css-gcpm-3/#setting-named-strings-the-string-set-pro
   */
  setNamedString(
    name: string,
    stringValue: string,
    cascadeInstance: CssCascade.CascadeInstance,
  ): void {
    const values =
      this.namedStringValues[name] || (this.namedStringValues[name] = {});
    values[cascadeInstance.currentElementOffset] = stringValue;
  }
}

export class CounterStore {
  countersById: { [key: string]: CssCascade.CounterValues } = {};
  pageCountersById: { [key: string]: CssCascade.CounterValues } = {};
  currentPageCounters: CssCascade.CounterValues = {};
  previousPageCounters: CssCascade.CounterValues = {};
  currentPageCountersStack: CssCascade.CounterValues[] = [];
  pageIndicesById: {
    [key: string]: { spineIndex: number; pageIndex: number };
  } = {};
  currentPage: Vtree.Page = null;
  newReferencesOfCurrentPage: TargetCounterReference[] = [];
  referencesToSolve: TargetCounterReference[] = [];
  referencesToSolveStack: TargetCounterReference[][] = [];
  unresolvedReferences: { [key: string]: TargetCounterReference[] } = {};
  resolvedReferences: { [key: string]: TargetCounterReference[] } = {};
  private pagesCounterExprs: {
    expr: Exprs.Val;
    format: (p1: number[]) => string;
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
    let resetMap: { [key: string]: number };
    const reset = cascadedPageStyle["counter-reset"] as CssCascade.CascadeValue;
    if (reset) {
      const resetVal = reset.evaluate(context);
      if (resetVal) {
        resetMap = CssProp.toCounters(resetVal, true);
      }
    }
    if (resetMap) {
      for (const resetCounterName in resetMap) {
        this.definePageCounter(resetCounterName, resetMap[resetCounterName]);
      }
    }
    let incrementMap: { [key: string]: number };
    const increment = cascadedPageStyle[
      "counter-increment"
    ] as CssCascade.CascadeValue;
    if (increment) {
      const incrementVal = increment.evaluate(context);
      if (incrementVal) {
        incrementMap = CssProp.toCounters(incrementVal, false);
      }
    }

    // If 'counter-increment' for the builtin 'page' counter is absent, add it
    // with value 1.
    if (incrementMap) {
      if (!("page" in incrementMap)) {
        incrementMap["page"] = 1;
      }
    } else {
      incrementMap = {};
      incrementMap["page"] = 1;
    }
    for (const incrementCounterName in incrementMap) {
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
      ids.forEach((id) => {
        this.pageCountersById[id] = currentPageCounters;
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
    }
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
      const ex = expr as Exprs.Native;
      if (ex.str == "viv-leader") {
        const node = document.createElementNS(Base.NS.XHTML, "span");
        node.textContent = val;
        node.setAttribute("data-viv-leader", expr.key);
        node.setAttribute("data-viv-leader-value", val);
        return node;
      }
    }

    const found = this.pagesCounterExprs.findIndex((o) => o.expr === expr) >= 0;
    if (found) {
      const node = document.createElementNS(Base.NS.XHTML, "span");
      node.textContent = val;
      node.setAttribute(PAGES_COUNTER_ATTR, expr.key);
      return node;
    } else {
      return null;
    }
  }

  finishLastPage(viewport: Vgen.Viewport) {
    const nodes = viewport.root.querySelectorAll(`[${PAGES_COUNTER_ATTR}]`);
    const pages = this.currentPageCounters["page"][0];
    for (const node of nodes) {
      const key = node.getAttribute(PAGES_COUNTER_ATTR);
      const i = this.pagesCounterExprs.findIndex((o) => o.expr.key === key);
      Asserts.assert(i >= 0);
      node.textContent = this.pagesCounterExprs[i].format([pages]);
    }
  }

  createLayoutConstraint(pageIndex: number): Layout.LayoutConstraint {
    return new LayoutConstraint(this, pageIndex);
  }
}

export const PAGES_COUNTER_ATTR = "data-vivliostyle-pages-counter";

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
