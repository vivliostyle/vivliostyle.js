/**
 * Copyright 2026 Vivliostyle Foundation
 *
 * Vivliostyle.js is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import * as Counters from "../../../src/vivliostyle/counters";
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

    store.updateTargetTextNodesInPages([page]);

    expect(node.textContent).toBe("A");
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
    store.namedStringPageSnapshots[10] = {
      lastOffset: 19,
      spineIndex: 1,
      counters: { page: [3] },
    };
    store.namedStringPageSnapshots[20] = {
      lastOffset: 29,
      spineIndex: 2,
      counters: { page: [4] },
    };

    store.discardReferencesFromSpine(2);

    expect(store.resolvedReferences.target).toBeUndefined();
    expect(store.unresolvedReferences.target).toEqual([
      earlierUnresolved,
      earlierResolved,
    ]);
    expect(earlierResolved.isResolved()).toBe(false);
    expect(store.pageIndicesById.target).toEqual({
      spineIndex: 2,
      pageIndex: 0,
    });
    expect(store.pageCountersById.target).toBeUndefined();
    expect(store.pageDocCountersById.target).toBeUndefined();
    expect(store.pageTextById.target).toBeUndefined();
    expect(store.pageCountersById.retained).toBe(retainedCounters);
    expect(store.pageTextById.retained).toBe(retainedText);
    expect(store.namedStringPageSnapshots[10]).toBeDefined();
    expect(store.namedStringPageSnapshots[20]).toBeUndefined();
  });
});
