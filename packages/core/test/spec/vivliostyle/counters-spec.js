/**
 * Copyright 2026 Vivliostyle Foundation
 *
 * Vivliostyle.js is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import * as Base from "../../../src/vivliostyle/base";
import * as Counters from "../../../src/vivliostyle/counters";
import * as Exprs from "../../../src/vivliostyle/exprs";
import * as Layout from "../../../src/vivliostyle/layout";
import * as LayoutProcessor from "../../../src/vivliostyle/layout-processor";
import * as Vtree from "../../../src/vivliostyle/vtree";

const documentURLTransformer = {
  transformFragment(fragment) {
    return fragment;
  },
  transformURL(url) {
    return url;
  },
  restoreURL(url) {
    return [url];
  },
};

function createNodeContext(id) {
  const element = document.createElement("h2");
  element.id = id;
  const nodeContext = new Vtree.NodeContext(
    element,
    null,
    0,
    new LayoutProcessor.BlockFormattingContext(null),
  );
  nodeContext.viewNode = element;
  return nodeContext;
}

describe("cross-reference layout constraint", function () {
  it("tracks duplicate status separately for each fragment on an element", function () {
    const container = document.createElement("div");
    const page = new Vtree.Page(container, container);
    const element = document.createElement("a");
    page.registerElementWithId(element, "duplicate-name", false);
    page.registerElementWithId(element, "unique-id", true);

    expect(page.elementsById["duplicate-name"]).toEqual([element]);
    expect(page.getReferenceTargets("duplicate-name")).toEqual([]);
    expect(page.getReferenceTargets("unique-id")).toEqual([element]);
  });

  it("uses only the canonical target for snapshots and layout constraints", function () {
    const store = new Counters.CounterStore(documentURLTransformer);
    const container = document.createElement("div");
    const page = new Vtree.Page(container, container);
    const first = document.createElement("div");
    first.textContent = "first";
    const duplicate = document.createElement("div");
    duplicate.textContent = "later";
    page.registerElementWithId(duplicate, "target", false);
    page.registerElementWithId(first, "target", true);
    store.setCurrentPage(page);
    store.finishPage(0, 0);
    expect(page.elementsById.target).toEqual([duplicate, first]);
    expect(store.pageTextById.target.content).toBe("first");
    expect(store.pageIndicesById.target.pageIndex).toBe(0);

    const nextContainer = document.createElement("div");
    const nextPage = new Vtree.Page(nextContainer, nextContainer);
    const nodeContext = createNodeContext("target");
    nextPage.registerElementWithId(nodeContext.viewNode, "target", false);
    store.setCurrentPage(nextPage);
    store.resolvedReferences.target = [
      new Counters.TargetCounterReference("target", true),
    ];
    store.pageIndicesById.target.pageIndex = 2;
    expect(store.createLayoutConstraint(1).allowLayout(nodeContext)).toBe(true);
    store.finishPage(0, 1);
    expect(store.pageIndicesById.target.pageIndex).toBe(2);
    expect(store.pageTextById.target.content).toBe("first");
    expect(store.resolvedReferences.target[0].isResolved()).toBe(true);
  });

  it("refreshes retained target-text first-letter nodes", function () {
    const store = new Counters.CounterStore(documentURLTransformer);
    const container = document.createElement("div");
    const node = document.createElement("span");
    node.setAttribute(Counters.TARGET_TEXT_ATTR, "first-letter-key");
    container.appendChild(node);
    const page = new Vtree.Page(container, container);
    store.targetTextExprs = [
      {
        expr: { key: "first-letter-key" },
        transformedId: "target",
        pseudoElement: "first-letter",
      },
    ];
    store.pageTextById.target = {
      before: "",
      content: "Alpha",
      after: "",
      marker: "",
    };

    const changedTargetIds = new Set();
    const changedPages = store.updateTargetTextNodesInPages(
      [page],
      changedTargetIds,
    );

    expect(node.textContent).toBe("A");
    expect(changedPages).toEqual(new Set([page]));
    expect(changedTargetIds).toEqual(new Set(["target"]));
    expect(store.updateTargetTextNodesInPages([page])).toEqual(new Set());
  });

  it("allows a target to move earlier after a satisfied page break", function () {
    const store = new Counters.CounterStore(documentURLTransformer);
    const reference = new Counters.TargetCounterReference("target", true);
    store.pageIndicesById.target = { spineIndex: 0, pageIndex: 2 };
    store.resolvedReferences.target = [reference];

    const constraint = store.createLayoutConstraint(1);
    const nodeContext = createNodeContext("target");

    expect(constraint.allowLayout(nodeContext)).toBe(false);
    expect(constraint.allowLayoutAfterPageBreak(nodeContext)).toBe(true);
    expect(store.pageIndicesById.target.pageIndex).toBe(1);
    expect(reference.isResolved()).toBe(false);
    expect(store.unresolvedReferences.target).toEqual([reference]);
    expect(constraint.allowLayout(nodeContext)).toBe(true);
  });

  it("keeps non-counter constraints after a satisfied page break", function () {
    const store = new Counters.CounterStore(documentURLTransformer);
    const reference = new Counters.TargetCounterReference("target", true);
    store.pageIndicesById.target = { spineIndex: 0, pageIndex: 2 };
    store.resolvedReferences.target = [reference];
    const nodeContext = createNodeContext("target");
    const counterConstraint = store.createLayoutConstraint(1);
    const rejectingConstraint = {
      allowLayout() {
        return false;
      },
    };
    const constraint = new Layout.AllLayoutConstraint([
      counterConstraint,
      rejectingConstraint,
    ]);

    expect(constraint.allowLayoutAfterPageBreak(nodeContext)).toBe(false);
    expect(store.pageIndicesById.target).toEqual({
      spineIndex: 0,
      pageIndex: 2,
    });
    expect(reference.isResolved()).toBe(true);
    expect(store.unresolvedReferences.target).toBeUndefined();
  });

  it("does not scan unrelated reference buckets when finishing a page", function () {
    const store = new Counters.CounterStore(documentURLTransformer);
    const page0Container = document.createElement("div");
    store.setCurrentPage(new Vtree.Page(page0Container, page0Container));
    store.saveReferenceOfCurrentPage("target", true);
    store.finishPage(0, 0);

    const ownKeys = jasmine
      .createSpy("ownKeys")
      .and.callFake((target) => Reflect.ownKeys(target));
    store.resolvedReferences = new Proxy(store.resolvedReferences, {
      ownKeys,
    });
    store.unresolvedReferences = new Proxy(store.unresolvedReferences, {
      ownKeys,
    });

    const page1Container = document.createElement("div");
    store.setCurrentPage(new Vtree.Page(page1Container, page1Container));
    store.finishPage(0, 1);

    expect(ownKeys).not.toHaveBeenCalled();
    expect(store.resolvedReferences.target.length).toBe(1);
    expect(store.resolvedReferences.target[0].pageIndex).toBe(0);
  });

  it("drops references owned by a truncated source page", function () {
    const store = new Counters.CounterStore(documentURLTransformer);
    const retained = new Counters.TargetCounterReference("target", false);
    const discarded = new Counters.TargetCounterReference("target", false);

    const page0Container = document.createElement("div");
    store.setCurrentPage(new Vtree.Page(page0Container, page0Container));
    store.newReferencesOfCurrentPage = [retained];
    store.finishPage(0, 0);

    const page1Container = document.createElement("div");
    store.setCurrentPage(new Vtree.Page(page1Container, page1Container));
    store.newReferencesOfCurrentPage = [discarded];
    store.finishPage(0, 1);
    store.referencesToSolve = [retained, discarded];
    store.referencesToSolveStack = [[retained, discarded]];

    store.discardReferencesFromPage(0, 1);

    expect(store.unresolvedReferences.target).toEqual([retained]);
    expect(store.referencesToSolve).toEqual([retained]);
    expect(store.referencesToSolveStack).toEqual([[retained]]);
    expect(store.isReferenceTracked(retained)).toBe(true);
    expect(store.isReferenceTracked(discarded)).toBe(false);
  });

  it("re-resolves references when a target moves to an earlier page", function () {
    const store = new Counters.CounterStore(documentURLTransformer);
    const reference = new Counters.TargetCounterReference("target", true);
    store.pageIndicesById.target = { spineIndex: 0, pageIndex: 2 };
    store.resolvedReferences.target = [reference];

    const container = document.createElement("div");
    const page = new Vtree.Page(container, container);
    const target = document.createElement("h2");
    target.id = "target";
    page.elementsById.target = [target];
    store.currentPage = page;

    const constraint = store.createLayoutConstraint(1);
    const nodeContext = createNodeContext("target");
    expect(constraint.allowLayoutAfterPageBreak(nodeContext)).toBe(true);
    expect(reference.isResolved()).toBe(false);
    expect(store.resolvedReferences.target).toEqual([]);
    expect(store.unresolvedReferences.target).toEqual([reference]);
    expect(store.pageIndicesById.target).toEqual({
      spineIndex: 0,
      pageIndex: 1,
    });

    store.finishPage(0, 1);

    const earlierConstraint = store.createLayoutConstraint(0);
    expect(earlierConstraint.allowLayoutAfterPageBreak(nodeContext)).toBe(
      false,
    );
  });

  it("replaces stale source-page references after content moves earlier", function () {
    const store = new Counters.CounterStore(documentURLTransformer);
    const earlierPageRef = new Counters.TargetCounterReference("target", false);
    earlierPageRef.spineIndex = 0;
    earlierPageRef.pageIndex = 0;
    const staleFollowingPageRef = new Counters.TargetCounterReference(
      "target",
      false,
    );
    staleFollowingPageRef.spineIndex = 0;
    staleFollowingPageRef.pageIndex = 1;
    const initialPage0Container = document.createElement("div");
    store.setCurrentPage(
      new Vtree.Page(initialPage0Container, initialPage0Container),
    );
    store.newReferencesOfCurrentPage = [earlierPageRef];
    store.finishPage(0, 0);

    const initialPage1Container = document.createElement("div");
    store.setCurrentPage(
      new Vtree.Page(initialPage1Container, initialPage1Container),
    );
    store.newReferencesOfCurrentPage = [staleFollowingPageRef];
    store.finishPage(0, 1);
    store.referencesToSolve = [earlierPageRef];

    const page0Container = document.createElement("div");
    store.setCurrentPage(new Vtree.Page(page0Container, page0Container));
    store.resolveReference("target");
    store.finishPage(0, 0);

    expect(store.resolvedReferences.target.length).toBe(1);
    expect(store.resolvedReferences.target[0].pageIndex).toBe(0);
    expect(store.unresolvedReferences.target).toEqual([staleFollowingPageRef]);

    const page1Container = document.createElement("div");
    store.setCurrentPage(new Vtree.Page(page1Container, page1Container));
    store.finishPage(0, 1);

    expect(store.unresolvedReferences.target).toBeUndefined();
    expect(store.resolvedReferences.target.length).toBe(1);
    expect(store.resolvedReferences.target[0].pageIndex).toBe(0);
  });

  it("invalidates references and target snapshots in a rebuilt suffix", function () {
    const store = new Counters.CounterStore(documentURLTransformer);
    const earlierResolved = new Counters.TargetCounterReference("target", true);
    earlierResolved.spineIndex = 0;
    const discardedResolved = new Counters.TargetCounterReference(
      "target",
      true,
    );
    discardedResolved.spineIndex = 2;
    const earlierUnresolved = new Counters.TargetCounterReference(
      "target",
      false,
    );
    earlierUnresolved.spineIndex = 1;
    const discardedUnresolved = new Counters.TargetCounterReference(
      "target",
      false,
    );
    discardedUnresolved.spineIndex = 3;
    const targetCounters = { page: [9] };
    const targetDocCounters = { chapter: [2] };
    const targetText = { content: "target" };
    const retainedCounters = { page: [4] };
    const retainedText = { content: "retained" };

    store.resolvedReferences.target = [earlierResolved, discardedResolved];
    store.unresolvedReferences.target = [
      earlierUnresolved,
      discardedUnresolved,
    ];
    store.pageIndicesById.target = { spineIndex: 2, pageIndex: 0 };
    store.pageCountersById.target = targetCounters;
    store.pageDocCountersById.target = targetDocCounters;
    store.pageTextById.target = targetText;
    store.pageIndicesById.retained = { spineIndex: 1, pageIndex: 0 };
    store.pageCountersById.retained = retainedCounters;
    store.pageTextById.retained = retainedText;
    store.namedStringPageSnapshots[1] = {
      10: { lastOffset: 19, counters: { page: [3] } },
    };
    store.namedStringPageSnapshots[2] = {
      20: { lastOffset: 29, counters: { page: [4] } },
    };

    store.discardReferencesFromSpine(2);

    expect(store.resolvedReferences.target).toEqual([earlierResolved]);
    expect(store.unresolvedReferences.target).toEqual([earlierUnresolved]);
    expect(store.pageIndicesById.target).toEqual({
      spineIndex: 2,
      pageIndex: 0,
    });
    expect(store.pageCountersById.target).toBeUndefined();
    expect(store.pageDocCountersById.target).toBeUndefined();
    expect(store.pageTextById.target).toBeUndefined();
    expect(store.pageCountersById.retained).toBe(retainedCounters);
    expect(store.pageTextById.retained).toBe(retainedText);
    expect(store.namedStringPageSnapshots[1]).toBeDefined();
    expect(store.namedStringPageSnapshots[2]).toBeUndefined();
  });
});

describe("element offsets in multiple source documents (Issue #2232)", function () {
  function createPageContainer(spineIndex, offset, text) {
    const container = document.createElement("div");
    container.setAttribute("data-vivliostyle-page-container", "true");
    container.setAttribute(Base.SPINE_INDEX_ATTR, String(spineIndex));
    const elem = document.createElement("div");
    elem.setAttribute(Base.ELEMENT_OFFSET_ATTR, String(offset));
    elem.textContent = text;
    container.appendChild(elem);
    return container;
  }

  it("takes a running element from the pages of the current spine item", function () {
    const store = new Counters.CounterStore(documentURLTransformer);
    const root = document.createElement("div");
    const spine0Page = createPageContainer(0, 12, "Chapter 1");
    const spine1Page = createPageContainer(1, 12, "Chapter 2");
    root.append(spine0Page, spine1Page);
    document.body.appendChild(root);
    try {
      // The current page (being re-rendered) belongs to spine 0, and has no
      // running element of its own.
      const currentContainer = document.createElement("div");
      currentContainer.setAttribute(Base.SPINE_INDEX_ATTR, "0");
      root.appendChild(currentContainer);
      const page = new Vtree.Page(currentContainer, currentContainer);
      page.spineIndex = 0;
      store.setCurrentPage(page);

      const expr = new Exprs.Native(
        new Exprs.LexicalScope(null),
        () => "12",
        "running-element-first-chapter",
      );
      const listener = store.getExprContentListener();
      const node = listener(expr, "12", document);
      expect(node.textContent).toBe("Chapter 1");

      // Another document's element with the same offset is never used.
      spine0Page.remove();
      expect(listener(expr, "12", document)).toBeNull();
    } finally {
      root.remove();
    }
  });

  it("keeps named-string page snapshots per spine item", function () {
    const store = new Counters.CounterStore(documentURLTransformer);
    store.hasDeferredNamedStrings = true;
    for (const [spineIndex, pageNumber] of [
      [0, 2],
      [1, 8],
    ]) {
      const container = createPageContainer(spineIndex, 20, "");
      const page = new Vtree.Page(container, container);
      page.spineIndex = spineIndex;
      page.offset = 10;
      store.setCurrentPage(page);
      store.currentPageCounters = { page: [pageNumber] };
      store.finishPage(spineIndex, 1);
    }

    expect(store.getPageCountersForOffset(0, 15)).toEqual({ page: [2] });
    expect(store.getPageCountersForOffset(1, 15)).toEqual({ page: [8] });
    expect(store.getPageCountersForOffset(2, 15)).toBeNull();
  });
});
