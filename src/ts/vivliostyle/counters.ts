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
 * @fileoverview Counters
 */
import * as Base from "../adapt/base";
import * as CssCasc from "../adapt/csscasc";
import * as CssProp from "../adapt/cssprop";
import * as CssStyler from "../adapt/cssstyler";
import * as Exprs from "../adapt/exprs";
import * as Vgen from "../adapt/vgen";
import * as Vtree from "../adapt/vtree";
import * as Asserts from "./asserts";
import { Layout } from "./types";

/**
 * Clone counter values.
 */
function cloneCounterValues(
  counters: CssCasc.CounterValues
): CssCasc.CounterValues {
  const result = {};
  Object.keys(counters).forEach(name => {
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
  pageCounters: CssCasc.CounterValues = null;
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

class CounterListener implements CssCasc.CounterListener {
  constructor(
    public readonly counterStore: CounterStore,
    public readonly baseURL: string
  ) {}

  /**
   * @override
   */
  countersOfId(id: string, counters: CssCasc.CounterValues) {
    id = this.counterStore.documentURLTransformer.transformFragment(
      id,
      this.baseURL
    );
    this.counterStore.countersById[id] = counters;
  }

  getExprContentListener(): Vtree.ExprContentListener {
    return this.counterStore.getExprContentListener();
  }
}

class CounterResolver implements CssCasc.CounterResolver {
  styler: CssStyler.Styler | null = null;

  constructor(
    public readonly counterStore: CounterStore,
    public readonly baseURL: string,
    public readonly rootScope: Exprs.LexicalScope,
    public readonly pageScope: Exprs.LexicalScope
  ) {}

  setStyler(styler: CssStyler.Styler) {
    this.styler = styler;
  }

  private getFragment(url: string): string | null {
    const r = url.match(/^[^#]*#(.*)$/);
    return r ? r[1] : null;
  }

  private getTransformedId(url: string): string {
    let transformedId = this.counterStore.documentURLTransformer.transformURL(
      Base.resolveURL(url, this.baseURL),
      this.baseURL
    );
    if (transformedId.charAt(0) === "#") {
      transformedId = transformedId.substring(1);
    }
    return transformedId;
  }

  /**
   * @override
   */
  getPageCounterVal(
    name: string,
    format: (p1: number | null) => string
  ): Exprs.Val {
    const self = this;

    function getCounterNumber() {
      const values = self.counterStore.currentPageCounters[name];
      return values && values.length ? values[values.length - 1] : null;
    }
    const expr = new Exprs.Native(
      this.pageScope,
      () => format(getCounterNumber()),
      `page-counter-${name}`
    );

    function arrayFormat(arr) {
      return format(arr[0]);
    }
    this.counterStore.registerPageCounterExpr(name, arrayFormat, expr);
    return expr;
  }

  /**
   * @override
   */
  getPageCountersVal(
    name: string,
    format: (p1: number[]) => string
  ): Exprs.Val {
    const self = this;

    function getCounterNumbers() {
      return self.counterStore.currentPageCounters[name] || [];
    }
    const expr = new Exprs.Native(
      this.pageScope,
      () => format(getCounterNumbers()),
      `page-counters-${name}`
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
    lookForElement: boolean
  ): CssCasc.CounterValues | null {
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
    transformedId: string
  ): CssCasc.CounterValues | null {
    if (this.counterStore.currentPage.elementsById[transformedId]) {
      return this.counterStore.currentPageCounters;
    } else {
      return this.counterStore.pageCountersById[transformedId] || null;
    }
  }

  /**
   * @override
   */
  getTargetCounterVal(
    url: string,
    name: string,
    format: (p1: number | null) => string
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
        format(countersOfName[countersOfName.length - 1] || null)
      );
    }
    const self = this;
    return new Exprs.Native(
      this.pageScope,
      () => {
        // Since This block is evaluated during layout, lookForElement
        // argument can be set to true.
        counters = self.getTargetCounters(id, transformedId, true);

        if (counters) {
          if (counters[name]) {
            // Since an element-based counter is defined, any page-based
            // counter is obscured even if it exists.
            const countersOfName = counters[name];
            return format(countersOfName[countersOfName.length - 1] || null);
          } else {
            const pageCounters = self.getTargetPageCounters(transformedId);
            if (pageCounters) {
              // The target element has already been laid out.
              self.counterStore.resolveReference(transformedId);
              if (pageCounters[name]) {
                const pageCountersOfName = pageCounters[name];
                return format(
                  pageCountersOfName[pageCountersOfName.length - 1] || null
                );
              } else {
                // No corresponding counter with the name.
                return format(0);
              }
            } else {
              // The target element has not been laid out yet.
              self.counterStore.saveReferenceOfCurrentPage(
                transformedId,
                false
              );
              return "??"; // TODO more reasonable placeholder?
            }
          }
        } else {
          // The style of target element has not been calculated yet.
          // (The element is in another source document that is not parsed
          // yet)
          self.counterStore.saveReferenceOfCurrentPage(transformedId, false);
          return "??"; // TODO more reasonable placeholder?
        }
      },
      `target-counter-${name}-of-${url}`
    );
  }

  /**
   * @override
   */
  getTargetCountersVal(
    url: string,
    name: string,
    format: (p1: number[]) => string
  ): Exprs.Val {
    const id = this.getFragment(url);
    const transformedId = this.getTransformedId(url);
    const self = this;
    return new Exprs.Native(
      this.pageScope,
      () => {
        const pageCounters = self.getTargetPageCounters(transformedId);

        if (!pageCounters) {
          // The target element has not been laid out yet.
          self.counterStore.saveReferenceOfCurrentPage(transformedId, false);
          return "??"; // TODO more reasonable placeholder?
        } else {
          self.counterStore.resolveReference(transformedId);
          const pageCountersOfName = pageCounters[name] || [];
          const elementCounters = self.getTargetCounters(
            id,
            transformedId,
            true
          );
          const elementCountersOfName = elementCounters[name] || [];
          return format(pageCountersOfName.concat(elementCountersOfName));
        }
      },
      `target-counters-${name}-of-${url}`
    );
  }
}

export class CounterStore {
  countersById: { [key: string]: CssCasc.CounterValues } = {};
  pageCountersById: { [key: string]: CssCasc.CounterValues } = {};
  currentPageCounters: CssCasc.CounterValues = {};
  previousPageCounters: CssCasc.CounterValues = {};
  currentPageCountersStack: CssCasc.CounterValues[] = [];
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
    public readonly documentURLTransformer: Base.DocumentURLTransformer
  ) {
    this.currentPageCounters["page"] = [0];
  }

  createCounterListener(baseURL: string): CssCasc.CounterListener {
    return new CounterListener(this, baseURL);
  }

  createCounterResolver(
    baseURL: string,
    rootScope: Exprs.LexicalScope,
    pageScope: Exprs.LexicalScope
  ): CssCasc.CounterResolver {
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
    cascadedPageStyle: CssCasc.ElementStyle,
    context: Exprs.Context
  ) {
    // Save page counters to previousPageCounters before updating
    this.previousPageCounters = cloneCounterValues(this.currentPageCounters);
    let resetMap;
    const reset = cascadedPageStyle["counter-reset"];
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
    let incrementMap;
    const increment = cascadedPageStyle["counter-increment"];
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
  pushPageCounters(counters: CssCasc.CounterValues) {
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
    if (!this.newReferencesOfCurrentPage.some(ref => ref.targetId === id)) {
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
      ids.forEach(id => {
        this.pageCountersById[id] = currentPageCounters;
        const oldPageIndex = this.pageIndicesById[id];
        if (oldPageIndex && oldPageIndex.pageIndex < pageIndex) {
          const resolvedRefs = this.resolvedReferences[id];
          if (resolvedRefs) {
            let unresolvedRefs = this.unresolvedReferences[id];
            if (!unresolvedRefs) {
              unresolvedRefs = this.unresolvedReferences[id] = [];
            }
            let ref;
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
    let ref;
    while ((ref = this.newReferencesOfCurrentPage.shift())) {
      ref.pageCounters = prevPageCounters;
      ref.spineIndex = spineIndex;
      ref.pageIndex = pageIndex;
      let arr;
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
      if (arr.every(r => !ref.equals(r))) {
        arr.push(ref);
      }
    }
    this.currentPage = null;
  }

  /**
   * Returns unresolved references pointing to the specified page.
   */
  getUnresolvedRefsToPage(
    page: Vtree.Page
  ): {
    spineIndex: number;
    pageIndex: number;
    pageCounters: CssCasc.CounterValues;
    refs: TargetCounterReference[];
  }[] {
    let refs = [];
    const ids = Object.keys(page.elementsById);
    ids.forEach(id => {
      const idRefs = this.unresolvedReferences[id];
      if (idRefs) {
        refs = refs.concat(idRefs);
      }
    });
    refs.sort(
      (r1, r2) => r1.spineIndex - r2.spineIndex || r1.pageIndex - r2.pageIndex
    );
    const result = [];
    let o = null;
    refs.forEach(ref => {
      if (
        !o ||
        o.spineIndex !== ref.spineIndex ||
        o.pageIndex !== ref.pageIndex
      ) {
        o = {
          spineIndex: ref.spineIndex,
          pageIndex: ref.pageIndex,
          pageCounters: ref.pageCounters,
          refs: [ref]
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
    expr: Exprs.Val
  ) {
    if (name === "pages") {
      this.pagesCounterExprs.push({ expr, format });
    }
  }

  getExprContentListener(): Vtree.ExprContentListener {
    return this.exprContentListener.bind(this);
  }

  private exprContentListener(expr, val, document) {
    const found = this.pagesCounterExprs.findIndex(o => o.expr === expr) >= 0;
    if (found) {
      const node = document.createElement("span");
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
    Array.from(nodes).forEach(node => {
      const key = node.getAttribute(PAGES_COUNTER_ATTR);
      const i = this.pagesCounterExprs.findIndex(o => o.expr.key === key);
      Asserts.assert(i >= 0);
      node.textContent = this.pagesCounterExprs[i].format([pages]);
    });
  }

  createLayoutConstraint(pageIndex: number): Layout.LayoutConstraint {
    return new LayoutConstraint(this, pageIndex);
  }
}

export const PAGES_COUNTER_ATTR = "data-vivliostyle-pages-counter";

class LayoutConstraint implements Layout.LayoutConstraint {
  constructor(
    public readonly counterStore: CounterStore,
    public readonly pageIndex: number
  ) {}

  /**
   * @override
   */
  allowLayout(nodeContext: Vtree.NodeContext): boolean {
    if (!nodeContext || nodeContext.after) {
      return true;
    }
    const viewNode = nodeContext.viewNode;
    if (!viewNode || viewNode.nodeType !== 1) {
      return true;
    }
    const id =
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
