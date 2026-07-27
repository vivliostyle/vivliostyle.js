import * as PageFloats from "../../../src/vivliostyle/page-floats";

describe("page float context attachment", function () {
  var PageFloatLayoutContext = PageFloats.PageFloatLayoutContext;
  var RootPageFloatLayoutContext = PageFloats.RootPageFloatLayoutContext;
  var FloatReference = PageFloats.FloatReference;

  function container() {
    // A distinct element per container, as in production.
    return { element: {}, clear: function () {} };
  }

  var scopes = [];

  afterEach(function () {
    scopes.splice(0).forEach(function (scope) {
      scope.remove();
    });
  });

  function scopeElement() {
    var scope = document.createElement("div");
    document.body.appendChild(scope);
    scopes.push(scope);
    return scope;
  }

  function nodePosition() {
    return {
      steps: [
        {
          node: document.createElement("div"),
          shadowType: 0,
          offsetInNode: 0,
        },
      ],
      offsetInNode: 0,
      after: false,
    };
  }

  it("replaces the previous attachment in the parent instead of adding one", function () {
    var root = RootPageFloatLayoutContext.createRoot();
    var page = PageFloatLayoutContext.create(
      root,
      FloatReference.PAGE,
      null,
      null,
      null,
      null,
    );

    expect(root.children.length).toBe(0);

    var first = page.withContainer(container());
    expect(root.children.length).toBe(1);
    expect(root.children[0]).toBe(first);

    var second = page.withContainer(container());
    expect(root.children.length).toBe(1);
    expect(root.children[0]).toBe(second);

    var third = page.withContainer(container());
    expect(root.children.length).toBe(1);
    expect(root.children[0]).toBe(third);
  });

  it("carries children across a balancing round trip", function () {
    // columns.ts detaches the region's children before regenerating them and
    // attaches the winning set back; attachChildren pushes without clearing,
    // so the pairing is what keeps the tree correct.
    var doc = document;
    var scope = scopeElement();
    function domContainer() {
      var element = doc.createElement("div");
      scope.appendChild(element);
      return { element: element, clear: function () {} };
    }

    var root = RootPageFloatLayoutContext.createRoot();
    var region = PageFloatLayoutContext.create(
      root,
      FloatReference.REGION,
      null,
      null,
      null,
      null,
    ).withContainer(domContainer());
    var first = PageFloatLayoutContext.create(
      region,
      FloatReference.COLUMN,
      null,
      null,
      null,
      null,
    ).withContainer(domContainer());

    var area = doc.createElement("div");
    scope.appendChild(area);
    var float = new PageFloats.PageFloat(
      nodePosition(),
      FloatReference.COLUMN,
      "block-start",
      null,
      "body",
    );
    first.addPageFloat(float);
    first.floatFragments.push(
      new PageFloats.PageFloatFragment(
        FloatReference.COLUMN,
        "block-start",
        null,
        [new PageFloats.PageFloatContinuation(float, {})],
        { element: area },
        false,
      ),
    );

    var detached = region.detachChildren();
    expect(detached).toEqual([first]);
    expect(region.children.length).toBe(0);
    expect(area.parentNode).toBe(null);

    var second = PageFloatLayoutContext.create(
      region,
      FloatReference.COLUMN,
      null,
      null,
      null,
      null,
    ).withContainer(domContainer());
    region.detachChildren();

    region.attachChildren(detached);
    expect(region.children).toEqual([first]);
    expect(area.parentNode).toBe(first.container.element.parentNode);
    expect(second).not.toBe(first);
  });

  it("seeds a new page context from the previous page's deferred floats", function () {
    // Issue #2026: a re-rendered page exposes the previous page's context as a
    // pseudo-child of a temporary root, so the previous-sibling lookup finds it.
    var previousRoot = RootPageFloatLayoutContext.createRoot();
    var previousPage = PageFloatLayoutContext.create(
      previousRoot,
      FloatReference.PAGE,
      "body",
      null,
      null,
      null,
    ).withContainer(container());
    var float = new PageFloats.PageFloat(
      nodePosition(),
      FloatReference.PAGE,
      "block-start",
      "body",
      "body",
    );
    previousPage.addPageFloat(float);
    previousPage.deferPageFloat(
      new PageFloats.PageFloatContinuation(float, {}),
    );

    var isolatedRoot = RootPageFloatLayoutContext.createRoot();
    isolatedRoot.addPageFloatLayoutContextAsPreviousSibling(previousPage);
    var page = PageFloatLayoutContext.create(
      isolatedRoot,
      FloatReference.PAGE,
      "body",
      null,
      null,
      null,
    );

    expect(page.getDeferredPageFloatContinuations().length).toBe(1);
    expect(page.getDeferredPageFloatContinuations()[0].float).toBe(float);
  });

  it("carries the accumulated record across attachments", function () {
    var root = RootPageFloatLayoutContext.createRoot();
    var page = PageFloatLayoutContext.create(
      root,
      FloatReference.PAGE,
      null,
      null,
      null,
      null,
    );

    var first = page.withContainer(container());
    first.footnoteMaxBlockSize = 100;
    var second = page.withContainer(container());

    expect(second.state).toBe(first.state);
    expect(second.footnoteMaxBlockSize).toBe(100);

    second.footnoteMaxBlockSize = 50;
    expect(page.footnoteMaxBlockSize).toBe(50);
  });

  it("keeps the anchors an attempt registered until invalidation", function () {
    var root = RootPageFloatLayoutContext.createRoot();
    var page = PageFloatLayoutContext.create(
      root,
      FloatReference.PAGE,
      null,
      null,
      null,
      null,
    );
    var float = new PageFloats.PageFloat(
      nodePosition(),
      FloatReference.PAGE,
      "block-start",
      null,
      "body",
    );
    page.addPageFloat(float);

    var first = page.withContainer(container());
    var node = document.createElement("div");
    first.registerPageFloatAnchor(float, node);

    var second = page.withContainer(container());
    expect(second.collectPageFloatAnchors()[float.getId()]).toBe(node);

    second.invalidate();
    expect(second.collectPageFloatAnchors()[float.getId()]).toBeUndefined();
  });

  it("keeps the children an attempt registered until invalidation", function () {
    var root = RootPageFloatLayoutContext.createRoot();
    var page = PageFloatLayoutContext.create(
      root,
      FloatReference.PAGE,
      null,
      null,
      null,
      null,
    );

    var first = page.withContainer(container());
    var region = PageFloatLayoutContext.create(
      first,
      FloatReference.REGION,
      null,
      null,
      null,
      null,
    ).withContainer(container());

    var second = page.withContainer(container());
    expect(second.children).toEqual([region]);

    second.invalidate();
    expect(second.children).toEqual([]);
  });
});
