/**
 * Copyright 2017 Daishinsha Inc.
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
 */

import * as adapt_css from "../../../src/vivliostyle/css";
import * as vivliostyle_pagefloat from "../../../src/vivliostyle/page-floats";

describe("page-floats", function () {
  var module = vivliostyle_pagefloat;
  var FloatReference = module.FloatReference;
  var PageFloat = module.PageFloat;
  var PageFloatList = module.PageFloatList;
  var PageFloatStore = module.PageFloatStore;
  var PageFloatFragment = module.PageFloatFragment;
  var PageFloatContinuation = module.PageFloatContinuation;
  var PageFloatLayoutContext = module.PageFloatLayoutContext;
  var RootPageFloatLayoutContext = module.RootPageFloatLayoutContext;

  var dummyOffsetInNode = 0;
  function dummyNodePosition() {
    return {
      offsetInNode: dummyOffsetInNode++,
    };
  }

  describe("PageFloatStore", function () {
    var store;
    beforeEach(function () {
      store = new PageFloatStore();
    });

    describe("#addPageFloat", function () {
      it("adds a PageFloat", function () {
        var float = new PageFloat(
          dummyNodePosition(),
          FloatReference.COLUMN,
          "block-start",
          null,
          "body",
        );

        expect(store.floats).not.toContain(float);

        store.addPageFloat(float);

        expect(store.floats).toContain(float);
      });

      it("assign a new ID to the PageFloat", function () {
        var float = new PageFloat(
          dummyNodePosition(),
          FloatReference.COLUMN,
          "block-start",
          null,
          "body",
        );

        expect(float.id).toBe(null);

        store.addPageFloat(float);

        expect(float.id).toBe("pf0");

        float = new PageFloat(
          dummyNodePosition(),
          FloatReference.COLUMN,
          "block-start",
          null,
          "body",
        );
        store.addPageFloat(float);

        expect(float.id).toBe("pf1");
      });

      it("throws an error if a float with the same node position is already registered", function () {
        var nodePosition = dummyNodePosition();
        var float = new PageFloat(
          nodePosition,
          FloatReference.COLUMN,
          "block-start",
          null,
          "body",
        );
        store.addPageFloat(float);

        expect(store.floats).toContain(float);

        float = new PageFloat(
          nodePosition,
          FloatReference.COLUMN,
          "block-start",
          null,
          "body",
        );

        expect(function () {
          store.addPageFloat(float);
        }).toThrow();
      });
    });

    describe("#findPageFloatByNodePosition", function () {
      it("returns a registered page float associated with the specified node position", function () {
        var nodePosition = dummyNodePosition();
        var float = new PageFloat(
          nodePosition,
          FloatReference.COLUMN,
          "block-start",
          null,
          "body",
        );
        store.addPageFloat(float);

        expect(store.findPageFloatByNodePosition(nodePosition)).toBe(float);
      });

      it("returns null when no page float with the specified node position is registered", function () {
        var float = new PageFloat(
          dummyNodePosition(),
          FloatReference.COLUMN,
          "block-start",
          null,
          "body",
        );
        store.addPageFloat(float);

        expect(store.findPageFloatByNodePosition({})).toBe(null);
      });
    });
  });

  describe("PageFloatLayoutContext", function () {
    function mockContainer() {
      return {
        // A distinct element per container, as in production, and one that
        // answers `contains` so anchor lookups reach a value rather than a
        // TypeError.
        element: {
          contains: jasmine.createSpy("contains").and.returnValue(false),
        },
        clear: jasmine.createSpy("clear"),
      };
    }

    var rootContext;
    beforeEach(function () {
      rootContext = RootPageFloatLayoutContext.createRoot();
    });

    describe("constructor", function () {
      it("uses writing-mode and direction values of the parent if they are not specified", function () {
        var context = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          rootContext,
          FloatReference.PAGE,
          null,
          null,
          adapt_css.ident.vertical_rl,
          adapt_css.ident.rtl,
        );

        expect(context.writingMode).toBe(adapt_css.ident.vertical_rl);
        expect(context.direction).toBe(adapt_css.ident.rtl);

        context = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          context,
          FloatReference.REGION,
          null,
          null,
          null,
          null,
        );

        expect(context.writingMode).toBe(adapt_css.ident.vertical_rl);
        expect(context.direction).toBe(adapt_css.ident.rtl);
      });

      it("falls back to parent values when CSS defaulting values (inherit, initial, revert, unset) are passed", function () {
        var parentContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          rootContext,
          FloatReference.PAGE,
          null,
          null,
          adapt_css.ident.vertical_rl,
          adapt_css.ident.rtl,
        );

        var defaultingValues = [
          adapt_css.ident.inherit,
          adapt_css.ident.initial,
          adapt_css.ident.revert,
          adapt_css.ident.unset,
        ];

        defaultingValues.forEach(function (defaultingValue) {
          var context = PageFloatLayoutContext.createWithContainer(
            mockContainer(),
            parentContext,
            FloatReference.REGION,
            null,
            null,
            defaultingValue,
            defaultingValue,
          );
          expect(context.writingMode).toBe(adapt_css.ident.vertical_rl);
          expect(context.direction).toBe(adapt_css.ident.rtl);
        });
      });

      it("uses default values when CSS defaulting values are passed and there is no parent", function () {
        var defaultingValues = [
          adapt_css.ident.inherit,
          adapt_css.ident.initial,
          adapt_css.ident.revert,
          adapt_css.ident.unset,
        ];

        defaultingValues.forEach(function (defaultingValue) {
          var context = PageFloatLayoutContext.create(
            null,
            null,
            null,
            null,
            defaultingValue,
            defaultingValue,
          );
          expect(context.writingMode).toBe(adapt_css.ident.horizontal_tb);
          expect(context.direction).toBe(adapt_css.ident.ltr);
        });
      });

      it("registers itself to the parent as a child", function () {
        var pageContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          rootContext,
          FloatReference.PAGE,
          null,
          null,
          null,
          null,
        );

        expect(rootContext.children).toEqual([pageContext]);

        var regionContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          pageContext,
          FloatReference.REGION,
          null,
          null,
          null,
          null,
        );

        expect(pageContext.children).toEqual([regionContext]);
      });
    });

    describe("#getPreviousSibling", function () {
      it("returns null if the parent has no children preceding the child", function () {
        var context = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          rootContext,
          FloatReference.PAGE,
          null,
          null,
          null,
          null,
        );

        expect(context.getPreviousSibling()).toBe(null);
      });

      it("returns the previous sibling if it has the same floatReference", function () {
        var context1 = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          rootContext,
          FloatReference.PAGE,
          null,
          null,
          null,
          null,
        );
        var context2 = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          rootContext,
          FloatReference.PAGE,
          null,
          null,
          null,
          null,
        );
        var context3 = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          rootContext,
          FloatReference.PAGE,
          null,
          null,
          null,
          null,
        );

        expect(context3.getPreviousSibling()).toBe(context2);
        expect(context2.getPreviousSibling()).toBe(context1);
        expect(context1.getPreviousSibling()).toBe(null);
      });

      it("returns the last context with the same floatReference, the same flow and the same generating element", function () {
        var context1 = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          rootContext,
          FloatReference.PAGE,
          null,
          null,
          null,
          null,
        );
        var context2 = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          context1,
          FloatReference.REGION,
          "body",
          null,
          null,
          null,
        );
        var context3 = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          context2,
          FloatReference.COLUMN,
          "body",
          null,
          null,
          null,
        );
        var context4 = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          context1,
          FloatReference.REGION,
          "flow",
          null,
          null,
          null,
        );
        var context5 = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          context4,
          FloatReference.COLUMN,
          "flow",
          null,
          null,
          null,
        );
        var context6 = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          context4,
          FloatReference.COLUMN,
          "flow",
          {},
          null,
          null,
        ); // generating element exists
        var context7 = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          rootContext,
          FloatReference.PAGE,
          null,
          null,
          null,
          null,
        );
        var context8 = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          context7,
          FloatReference.REGION,
          "body",
          null,
          null,
          null,
        );
        var context9 = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          context8,
          FloatReference.COLUMN,
          "body",
          null,
          null,
          null,
        );
        var context10 = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          context7,
          FloatReference.REGION,
          "flow",
          null,
          null,
          null,
        );
        var context11 = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          context10,
          FloatReference.COLUMN,
          "flow",
          null,
          null,
          null,
        );

        expect(context4.getPreviousSibling()).toBe(null);
        expect(context5.getPreviousSibling()).toBe(null);
        expect(context6.getPreviousSibling()).toBe(null);
        expect(context7.getPreviousSibling()).toBe(context1);
        expect(context8.getPreviousSibling()).toBe(context2);
        expect(context9.getPreviousSibling()).toBe(context3);
        expect(context10.getPreviousSibling()).toBe(context4);
        expect(context11.getPreviousSibling()).toBe(context5);
      });
    });

    describe("#findPageFloatByNodePosition", function () {
      it("returns a page float registered by PageFloatLayoutContext with the same root PageFloatLayoutContext", function () {
        var context1 = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          rootContext,
          FloatReference.PAGE,
          null,
          null,
          null,
          null,
        );
        var context2 = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          rootContext,
          FloatReference.PAGE,
          null,
          null,
          null,
          null,
        );
        var nodePosition1 = dummyNodePosition();
        var float1 = new PageFloat(
          nodePosition1,
          FloatReference.PAGE,
          "block-start",
          null,
          "body",
        );
        context1.addPageFloat(float1);
        var nodePosition2 = dummyNodePosition();
        var float2 = new PageFloat(
          nodePosition2,
          FloatReference.PAGE,
          "block-start",
          null,
          "body",
        );
        context2.addPageFloat(float2);

        expect(context1.findPageFloatByNodePosition(nodePosition1)).toBe(
          float1,
        );
        expect(context1.findPageFloatByNodePosition(nodePosition2)).toBe(
          float2,
        );
        expect(context2.findPageFloatByNodePosition(nodePosition1)).toBe(
          float1,
        );
        expect(context2.findPageFloatByNodePosition(nodePosition2)).toBe(
          float2,
        );
      });
    });

    describe("#forbid, #isForbidden", function () {
      it("returns if the page float is forbidden in the context by #forbid method", function () {
        var context = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          rootContext,
          FloatReference.PAGE,
          null,
          null,
          null,
          null,
        );
        var float = new PageFloat(
          dummyNodePosition(),
          FloatReference.PAGE,
          "block-start",
          null,
          "body",
        );
        context.addPageFloat(float);

        expect(context.isForbidden(float)).toBe(false);

        context.forbid(float);

        expect(context.isForbidden(float)).toBe(true);
      });

      it("returns true if the page float is forbidden by one of ancestors of the context", function () {
        var pageContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          rootContext,
          FloatReference.PAGE,
          null,
          null,
          null,
          null,
        );
        var regionContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          pageContext,
          FloatReference.REGION,
          null,
          null,
          null,
          null,
        );
        var columnContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          regionContext,
          FloatReference.COLUMN,
          null,
          null,
          null,
          null,
        );

        var float = new PageFloat(
          dummyNodePosition(),
          FloatReference.COLUMN,
          "block-start",
          null,
          "body",
        );
        columnContext.addPageFloat(float);
        columnContext.forbid(float);

        expect(columnContext.isForbidden(float)).toBe(true);
        expect(function () {
          regionContext.isForbidden(float);
        }).toThrow();

        columnContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          regionContext,
          FloatReference.COLUMN,
          null,
          null,
          null,
          null,
        );

        expect(columnContext.isForbidden(float)).toBe(false);

        float = new PageFloat(
          dummyNodePosition(),
          FloatReference.REGION,
          "block-start",
          null,
          "body",
        );
        columnContext.addPageFloat(float);
        columnContext.forbid(float);

        expect(columnContext.isForbidden(float)).toBe(true);
        expect(regionContext.isForbidden(float)).toBe(true);
        expect(function () {
          pageContext.isForbidden(float);
        }).toThrow();

        columnContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          regionContext,
          FloatReference.COLUMN,
          null,
          null,
          null,
          null,
        );

        expect(columnContext.isForbidden(float)).toBe(true);

        regionContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          pageContext,
          FloatReference.REGION,
          null,
          null,
          null,
          null,
        );
        columnContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          regionContext,
          FloatReference.COLUMN,
          null,
          null,
          null,
          null,
        );

        expect(columnContext.isForbidden(float)).toBe(false);
        expect(regionContext.isForbidden(float)).toBe(false);
        expect(function () {
          pageContext.isForbidden(float);
        }).toThrow();

        float = new PageFloat(
          dummyNodePosition(),
          FloatReference.PAGE,
          "block-start",
          null,
          "body",
        );
        columnContext.addPageFloat(float);
        columnContext.forbid(float);

        expect(columnContext.isForbidden(float)).toBe(true);
        expect(regionContext.isForbidden(float)).toBe(true);
        expect(pageContext.isForbidden(float)).toBe(true);

        columnContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          regionContext,
          FloatReference.COLUMN,
          null,
          null,
          null,
          null,
        );

        expect(columnContext.isForbidden(float)).toBe(true);

        regionContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          pageContext,
          FloatReference.REGION,
          null,
          null,
          null,
          null,
        );
        columnContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          regionContext,
          FloatReference.COLUMN,
          null,
          null,
          null,
          null,
        );

        expect(columnContext.isForbidden(float)).toBe(true);
        expect(regionContext.isForbidden(float)).toBe(true);

        pageContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          rootContext,
          FloatReference.PAGE,
          null,
          null,
          null,
          null,
        );
        regionContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          pageContext,
          FloatReference.REGION,
          null,
          null,
          null,
          null,
        );
        columnContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          regionContext,
          FloatReference.COLUMN,
          null,
          null,
          null,
          null,
        );

        expect(columnContext.isForbidden(float)).toBe(false);
        expect(regionContext.isForbidden(float)).toBe(false);
        expect(pageContext.isForbidden(float)).toBe(false);
      });
    });

    describe("#addPageFloatFragment, #findPageFloatFragment", function () {
      var pageContext, regionContext, columnContext, area;
      function reset() {
        pageContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          rootContext,
          FloatReference.PAGE,
          null,
          null,
          null,
          null,
        );
        regionContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          pageContext,
          FloatReference.REGION,
          null,
          null,
          null,
          null,
        );
        columnContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          regionContext,
          FloatReference.COLUMN,
          null,
          null,
          null,
          null,
        );
        [pageContext, regionContext, columnContext].forEach(function (context) {
          spyOn(context, "invalidate");
          spyOn(context, "addPageFloatFragment").and.callThrough();
        });
      }
      beforeEach(function () {
        area = { getOuterShape: jasmine.createSpy("getOuterShape") };
        reset();
      });

      it("A PageFloatFragment added by #addPageFloatFragment can be retrieved by #findPageFloatFragment", function () {
        pageContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          rootContext,
          FloatReference.PAGE,
          null,
          null,
          null,
          null,
        );
        var float = new PageFloat(
          dummyNodePosition(),
          FloatReference.PAGE,
          "block-start",
          null,
          "body",
        );
        pageContext.addPageFloat(float);
        var fragment = new PageFloatFragment(
          float.floatReference,
          float.floatSide,
          null,
          [new PageFloatContinuation(float, {})],
          area,
          false,
        );

        expect(pageContext.findPageFloatFragment(float)).toBe(null);

        pageContext.addPageFloatFragment(fragment);

        expect(pageContext.findPageFloatFragment(float)).toBe(fragment);
      });

      it("A PageFloatFragment stored in one of the ancestors can be retrieved by #findPageFloatFragment", function () {
        var float = new PageFloat(
          dummyNodePosition(),
          FloatReference.REGION,
          "block-start",
          null,
          "body",
        );
        columnContext.addPageFloat(float);
        var fragment = new PageFloatFragment(
          float.floatReference,
          float.floatSide,
          null,
          [new PageFloatContinuation(float, {})],
          area,
          false,
        );
        columnContext.addPageFloatFragment(fragment);
        columnContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          regionContext,
          FloatReference.COLUMN,
          null,
          null,
          null,
          null,
        );

        expect(columnContext.findPageFloatFragment(float)).toBe(fragment);
        expect(regionContext.findPageFloatFragment(float)).toBe(fragment);
        expect(function () {
          pageContext.findPageFloatFragment(float);
        }).toThrow();

        float = new PageFloat(
          dummyNodePosition(),
          FloatReference.PAGE,
          "block-start",
          null,
          "body",
        );
        columnContext.addPageFloat(float);
        fragment = new PageFloatFragment(
          float.floatReference,
          float.floatSide,
          null,
          [new PageFloatContinuation(float, {})],
          area,
          false,
        );
        columnContext.addPageFloatFragment(fragment);
        regionContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          pageContext,
          FloatReference.REGION,
          null,
          null,
          null,
          null,
        );
        columnContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          regionContext,
          FloatReference.COLUMN,
          null,
          null,
          null,
          null,
        );

        expect(columnContext.findPageFloatFragment(float)).toBe(fragment);
        expect(regionContext.findPageFloatFragment(float)).toBe(fragment);
        expect(pageContext.findPageFloatFragment(float)).toBe(fragment);
      });

      it("When a PageFloatFragment is added by #addPageFloatFragment, the corresponding PageFloatLayoutContext is invalidated", function () {
        var float = new PageFloat(
          dummyNodePosition(),
          FloatReference.COLUMN,
          "block-start",
          null,
          "body",
        );
        columnContext.addPageFloat(float);
        var fragment = new PageFloatFragment(
          float.floatReference,
          float.floatSide,
          null,
          [new PageFloatContinuation(float, {})],
          area,
          false,
        );
        columnContext.addPageFloatFragment(fragment);

        expect(columnContext.invalidate).toHaveBeenCalled();
        expect(regionContext.addPageFloatFragment).not.toHaveBeenCalled();

        reset();
        float = new PageFloat(
          dummyNodePosition(),
          FloatReference.REGION,
          "block-start",
          null,
          "body",
        );
        columnContext.addPageFloat(float);
        fragment = new PageFloatFragment(
          float.floatReference,
          float.floatSide,
          null,
          [new PageFloatContinuation(float, {})],
          area,
          false,
        );
        columnContext.addPageFloatFragment(fragment);

        expect(columnContext.invalidate).toHaveBeenCalled();
        expect(regionContext.addPageFloatFragment).toHaveBeenCalledWith(
          fragment,
          undefined,
        );
        expect(regionContext.invalidate).toHaveBeenCalled();
        expect(pageContext.addPageFloatFragment).not.toHaveBeenCalledWith(
          fragment,
        );

        reset();
        float = new PageFloat(
          dummyNodePosition(),
          FloatReference.PAGE,
          "block-start",
          null,
          "body",
        );
        columnContext.addPageFloat(float);
        fragment = new PageFloatFragment(
          float.floatReference,
          float.floatSide,
          null,
          [new PageFloatContinuation(float, {})],
          area,
          false,
        );
        columnContext.addPageFloatFragment(fragment);

        expect(columnContext.invalidate).toHaveBeenCalled();
        expect(regionContext.addPageFloatFragment).toHaveBeenCalledWith(
          fragment,
          undefined,
        );
        expect(regionContext.invalidate).toHaveBeenCalled();
        expect(pageContext.addPageFloatFragment).toHaveBeenCalledWith(
          fragment,
          undefined,
        );
        expect(pageContext.invalidate).toHaveBeenCalled();
      });
    });

    describe("#removePageFloatFragment", function () {
      var context, float, area, fragment;
      beforeEach(function () {
        context = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          rootContext,
          FloatReference.PAGE,
          null,
          null,
          null,
          null,
        );
        spyOn(context, "invalidate");
        float = new PageFloat(
          dummyNodePosition(),
          FloatReference.PAGE,
          "block-start",
          null,
          "body",
        );
        context.addPageFloat(float);
        area = {
          element: {
            parentNode: {
              removeChild: jasmine.createSpy("removeChild"),
            },
          },
        };
        fragment = new PageFloatFragment(
          float.floatReference,
          float.floatSide,
          null,
          [new PageFloatContinuation(float, {})],
          area,
          false,
        );
        context.addPageFloatFragment(fragment);
        context.invalidate.calls.reset();
      });

      it("removes the specified PageFloatFragment", function () {
        expect(context.findPageFloatFragment(float)).toBe(fragment);

        context.removePageFloatFragment(fragment);

        expect(context.findPageFloatFragment(float)).toBe(null);
      });

      it("detaches the view node of the fragment", function () {
        context.removePageFloatFragment(fragment);

        expect(area.element.parentNode.removeChild).toHaveBeenCalledWith(
          area.element,
        );
      });

      it("invalidates the context", function () {
        context.removePageFloatFragment(fragment);

        expect(context.invalidate).toHaveBeenCalled();
      });
    });

    describe("#registerPageFloatAnchor", function () {
      var pageContext, regionContext, columnContext, float, anchorViewNode;
      beforeEach(function () {
        pageContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          rootContext,
          FloatReference.PAGE,
          null,
          null,
          null,
          null,
        );
        regionContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          pageContext,
          FloatReference.REGION,
          null,
          null,
          null,
          null,
        );
        columnContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          regionContext,
          FloatReference.COLUMN,
          null,
          null,
          null,
          null,
        );
        anchorViewNode = {};
      });

      it("stores the anchor view node", function () {
        float = new PageFloat(
          dummyNodePosition(),
          FloatReference.COLUMN,
          "block-start",
          null,
          "body",
        );
        columnContext.addPageFloat(float);
        columnContext.registerPageFloatAnchor(float, anchorViewNode);

        expect(columnContext.collectPageFloatAnchors()[float.getId()]).toBe(
          anchorViewNode,
        );
      });
    });

    describe("#isAnchorAlreadyAppeared", function () {
      var container, context, float, id, anchorViewNode;
      beforeEach(function () {
        container = {
          element: {
            contains: jasmine.createSpy("contains"),
          },
        };
        context = PageFloatLayoutContext.createWithContainer(
          container,
          rootContext,
          FloatReference.COLUMN,
          "foo",
          null,
          null,
          null,
        );
        float = new PageFloat(
          dummyNodePosition(),
          FloatReference.COLUMN,
          "block-start",
          null,
          "foo",
        );
        context.addPageFloat(float);
        id = float.getId();
        anchorViewNode = {};
      });

      it("returns false if the anchor view node is not registered", function () {
        expect(context.isAnchorAlreadyAppeared(id)).toBe(false);
      });

      it("returns false if the anchor view node if registered but not contained in the container", function () {
        container.element.contains.and.returnValue(false);
        context.registerPageFloatAnchor(float, anchorViewNode);

        expect(context.isAnchorAlreadyAppeared(id)).toBe(false);
        expect(container.element.contains).toHaveBeenCalledWith(anchorViewNode);
      });

      it("returns true if the anchor view node if registered and contained in the container", function () {
        container.element.contains.and.returnValue(true);
        context.registerPageFloatAnchor(float, anchorViewNode);

        expect(context.isAnchorAlreadyAppeared(id)).toBe(true);
        expect(container.element.contains).toHaveBeenCalledWith(anchorViewNode);
      });

      it("returns true if the float is deferred from a previous fragment", function () {
        container.element.contains.and.returnValue(false);
        context.state.floatsDeferredFromPrevious.push(
          new PageFloatContinuation(float, {}),
        );

        expect(context.isAnchorAlreadyAppeared(id)).toBe(true);
      });
    });

    describe("#hasCurrentAnchor", function () {
      it("prefers the descendant anchor over an ancestor anchor for the same float", function () {
        var container = {
          element: {
            contains: jasmine.createSpy("contains"),
          },
        };
        var pageContext = PageFloatLayoutContext.createWithContainer(
          container,
          rootContext,
          FloatReference.PAGE,
          "foo",
          null,
          null,
          null,
        );
        var columnContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          pageContext,
          FloatReference.COLUMN,
          "foo",
          null,
          null,
          null,
        );
        var float = new PageFloat(
          dummyNodePosition(),
          FloatReference.COLUMN,
          "block-start",
          null,
          "foo",
        );
        var staleAnchorViewNode = {};
        var currentAnchorViewNode = {};

        columnContext.addPageFloat(float);
        container.element.contains.and.callFake(function (node) {
          return node === staleAnchorViewNode;
        });
        pageContext.registerPageFloatAnchor(float, staleAnchorViewNode);
        columnContext.registerPageFloatAnchor(float, currentAnchorViewNode);

        expect(pageContext.hasCurrentAnchor(float.getId())).toBe(false);
        expect(container.element.contains).toHaveBeenCalledWith(
          currentAnchorViewNode,
        );
      });
    });

    describe("#hasInvalidatedForLineFootnote", function () {
      it("invalidates again when the line footnote retry size changes", function () {
        var pageContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          rootContext,
          FloatReference.PAGE,
          "foo",
          null,
          null,
          null,
        );
        var float = new PageFloat(
          dummyNodePosition(),
          FloatReference.PAGE,
          "block-end",
          null,
          "foo",
        );

        pageContext.addPageFloat(float);
        expect(pageContext.hasInvalidatedForLineFootnote(float)).toBe(false);

        pageContext.markInvalidatedForLineFootnote(float);
        expect(pageContext.hasInvalidatedForLineFootnote(float)).toBe(true);

        pageContext.footnoteMaxBlockSize = 100;
        expect(pageContext.hasInvalidatedForLineFootnote(float)).toBe(false);

        pageContext.markInvalidatedForLineFootnote(float);
        expect(pageContext.hasInvalidatedForLineFootnote(float)).toBe(true);
      });
    });

    describe("#addPageFloatLayoutContextAsPreviousSibling", function () {
      it("seeds isolated roots with continuations from the previous page", function () {
        var previousPageContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          rootContext,
          FloatReference.PAGE,
          null,
          null,
          null,
          null,
        );
        var isolatedRootContext = RootPageFloatLayoutContext.createRoot();
        var float = new PageFloat(
          dummyNodePosition(),
          FloatReference.PAGE,
          "block-end",
          null,
          "body",
        );
        previousPageContext.addPageFloat(float);
        var continuation = new PageFloatContinuation(float, {});
        previousPageContext.deferPageFloat(continuation);

        isolatedRootContext.addPageFloatLayoutContextAsPreviousSibling(
          previousPageContext,
        );
        var isolatedPageContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          isolatedRootContext,
          FloatReference.PAGE,
          null,
          null,
          null,
          null,
        );

        expect(isolatedPageContext.getDeferredPageFloatContinuations()).toEqual(
          [continuation],
        );
      });
    });

    describe("#deferPageFloat", function () {
      var pageContext, regionContext, columnContext, float;
      beforeEach(function () {
        pageContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          rootContext,
          FloatReference.PAGE,
          null,
          null,
          null,
          null,
        );
        regionContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          pageContext,
          FloatReference.REGION,
          "foo",
          null,
          null,
          null,
        );
        columnContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          regionContext,
          FloatReference.COLUMN,
          "foo",
          null,
          null,
          null,
        );
      });

      it("stores a PageFloatContinuation as a deferred float", function () {
        float = new PageFloat(
          dummyNodePosition(),
          FloatReference.COLUMN,
          "block-start",
          null,
          "body",
        );
        columnContext.addPageFloat(float);
        columnContext.deferPageFloat(new PageFloatContinuation(float, {}));

        expect(columnContext.state.floatsDeferredToNext.length).toBe(1);
        expect(columnContext.state.floatsDeferredToNext[0].float).toBe(float);
      });

      it("replaces an existing deferred PageFloatContinuation with new one if there exists a deferred continuation of the same float", function () {
        float = new PageFloat(
          dummyNodePosition(),
          FloatReference.COLUMN,
          "block-start",
          null,
          "body",
        );
        columnContext.addPageFloat(float);
        var position1 = {};
        columnContext.deferPageFloat(
          new PageFloatContinuation(float, position1),
        );

        expect(columnContext.state.floatsDeferredToNext.length).toBe(1);
        expect(columnContext.state.floatsDeferredToNext[0].float).toBe(float);
        expect(columnContext.state.floatsDeferredToNext[0].nodePosition).toBe(
          position1,
        );

        var position2 = {};
        columnContext.deferPageFloat(
          new PageFloatContinuation(float, position2),
        );

        expect(columnContext.state.floatsDeferredToNext.length).toBe(1);
        expect(columnContext.state.floatsDeferredToNext[0].float).toBe(float);
        expect(columnContext.state.floatsDeferredToNext[0].nodePosition).toBe(
          position2,
        );
      });

      it("stores a PageFloatContinuation in the corresponding context as a deferred float", function () {
        float = new PageFloat(
          dummyNodePosition(),
          FloatReference.REGION,
          "block-start",
          null,
          "body",
        );
        columnContext.addPageFloat(float);
        columnContext.deferPageFloat(new PageFloatContinuation(float, {}));

        expect(columnContext.state.floatsDeferredToNext.length).toBe(0);
        expect(regionContext.state.floatsDeferredToNext.length).toBe(1);
        expect(regionContext.state.floatsDeferredToNext[0].float).toBe(float);
      });
    });

    describe("getDeferredPageFloatContinuations", function () {
      function addPageFloat(floatReference, context, flowName) {
        var float = new PageFloat(
          dummyNodePosition(),
          floatReference,
          "block-start",
          null,
          flowName,
        );
        context.addPageFloat(float);
        return float;
      }

      var pageContext,
        regionContext,
        columnContext,
        cont1,
        cont2,
        cont3,
        cont4,
        cont5,
        cont6;
      beforeEach(function () {
        pageContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          rootContext,
          FloatReference.PAGE,
          null,
          null,
          null,
          null,
        );
        regionContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          pageContext,
          FloatReference.REGION,
          "foo",
          null,
          null,
          null,
        );
        columnContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          regionContext,
          FloatReference.COLUMN,
          "foo",
          null,
          null,
          null,
        );
        var float1 = addPageFloat(FloatReference.PAGE, pageContext, "foo");
        cont1 = new PageFloatContinuation(float1, {});
        pageContext.state.floatsDeferredFromPrevious.push(cont1);
        var float2 = addPageFloat(FloatReference.PAGE, pageContext, "bar");
        cont2 = new PageFloatContinuation(float2, {});
        pageContext.state.floatsDeferredFromPrevious.push(cont2);
        var float3 = addPageFloat(FloatReference.REGION, regionContext, "foo");
        cont3 = new PageFloatContinuation(float3, {});
        regionContext.state.floatsDeferredFromPrevious.push(cont3);
        var float4 = addPageFloat(FloatReference.REGION, regionContext, "bar");
        cont4 = new PageFloatContinuation(float4, {});
        regionContext.state.floatsDeferredFromPrevious.push(cont4);
        var float5 = addPageFloat(FloatReference.COLUMN, columnContext, "foo");
        cont5 = new PageFloatContinuation(float5, {});
        columnContext.state.floatsDeferredFromPrevious.push(cont5);
        var float6 = addPageFloat(FloatReference.COLUMN, columnContext, "bar");
        cont6 = new PageFloatContinuation(float6, {});
        columnContext.state.floatsDeferredFromPrevious.push(cont6);
      });

      it("returns all deferred PageFloatContinuations with the corresponding flow name in order of page, region and column", function () {
        expect(columnContext.getDeferredPageFloatContinuations()).toEqual([
          cont1,
          cont3,
          cont5,
        ]);
        expect(columnContext.getDeferredPageFloatContinuations("bar")).toEqual([
          cont2,
          cont4,
          cont6,
        ]);
      });

      it("returns all deferred PageFLoatContinuations in order of page, region and column when the context does not have a flow name and no flow name is specified as an argument", function () {
        expect(pageContext.getDeferredPageFloatContinuations()).toEqual([
          cont1,
          cont2,
        ]);
      });
    });

    describe("getPageFloatContinuationsDeferredToNext", function () {
      var pageContext,
        regionContext,
        columnContext,
        cont1,
        cont2,
        cont3,
        cont4,
        cont5,
        cont6;
      beforeEach(function () {
        pageContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          rootContext,
          FloatReference.PAGE,
          null,
          null,
          null,
          null,
        );
        regionContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          pageContext,
          FloatReference.REGION,
          "foo",
          null,
          null,
          null,
        );
        columnContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          regionContext,
          FloatReference.COLUMN,
          "foo",
          null,
          null,
          null,
        );
        cont1 = new PageFloatContinuation({ flowName: "foo" }, {});
        pageContext.state.floatsDeferredToNext.push(cont1);
        cont2 = new PageFloatContinuation({ flowName: "bar" }, {});
        pageContext.state.floatsDeferredToNext.push(cont2);
        cont3 = new PageFloatContinuation({ flowName: "foo" }, {});
        regionContext.state.floatsDeferredToNext.push(cont3);
        cont4 = new PageFloatContinuation({ flowName: "bar" }, {});
        regionContext.state.floatsDeferredToNext.push(cont4);
        cont5 = new PageFloatContinuation({ flowName: "foo" }, {});
        columnContext.state.floatsDeferredToNext.push(cont5);
        cont6 = new PageFloatContinuation({ flowName: "bar" }, {});
        columnContext.state.floatsDeferredToNext.push(cont6);
      });

      it("returns all PageFloatContinuations deferred to the next fragmentainer with the corresonding flow name in order of page, region and column", function () {
        expect(columnContext.getPageFloatContinuationsDeferredToNext()).toEqual(
          [cont1, cont3, cont5],
        );
        expect(
          columnContext.getPageFloatContinuationsDeferredToNext("bar"),
        ).toEqual([cont2, cont4, cont6]);
      });

      it("returns all PageFLoatContinuations deferred to the next fragmentainer in order of page, region and column when the context does not have a flow name and no flow name is specified as an argument", function () {
        expect(pageContext.getPageFloatContinuationsDeferredToNext()).toEqual([
          cont1,
          cont2,
        ]);
      });
    });

    describe("#finish", function () {
      var context,
        float1,
        cont1,
        fragment1,
        float2,
        fragment2,
        float3,
        cont3,
        float4,
        cont4;
      beforeEach(function () {
        context = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          rootContext,
          FloatReference.COLUMN,
          null,
          null,
          null,
          null,
        );
        spyOn(context, "isAnchorAlreadyAppeared");
        spyOn(context, "removePageFloatFragment");
        float1 = new PageFloat(
          dummyNodePosition(),
          FloatReference.COLUMN,
          "block-start",
          null,
          "foo",
        );
        context.addPageFloat(float1);
        fragment1 = new PageFloatFragment(
          float1.floatReference,
          float1.floatSide,
          null,
          [new PageFloatContinuation(float1, {})],
          {},
          false,
        );
        context.addPageFloatFragment(fragment1);
        cont1 = new PageFloatContinuation(float1, {});
        float2 = new PageFloat(
          dummyNodePosition(),
          FloatReference.COLUMN,
          "block-start",
          null,
          "body",
        );
        context.addPageFloat(float2);
        fragment2 = new PageFloatFragment(
          float2.floatReference,
          float2.floatSide,
          null,
          [new PageFloatContinuation(float2, {})],
          {},
          false,
        );
        context.addPageFloatFragment(fragment2);
        float3 = new PageFloat(
          dummyNodePosition(),
          FloatReference.COLUMN,
          "block-start",
          null,
          "bar",
        );
        cont3 = new PageFloatContinuation(float3, {});
        context.addPageFloat(float3);
        float4 = new PageFloat(
          dummyNodePosition(),
          FloatReference.COLUMN,
          "block-start",
          null,
          "baz",
        );
        context.addPageFloat(float4);
        cont4 = new PageFloatContinuation(float4, {});
        context.state.floatsDeferredFromPrevious.push(...[cont1, cont3, cont4]);
        context.deferPageFloat(cont3);
      });

      it("Removes and forbids the last fragment whose anchor have not appeared", function () {
        context.isAnchorAlreadyAppeared.and.returnValue(false);
        context.finish();

        expect(context.removePageFloatFragment).toHaveBeenCalledWith(fragment2);
        expect(context.removePageFloatFragment).not.toHaveBeenCalledWith(
          fragment1,
        );
        expect(context.isForbidden(float2)).toBe(true);
        expect(context.isForbidden(float1)).not.toBe(true);
        expect(context.getPageFloatContinuationsDeferredToNext()).toEqual([
          cont3,
        ]);
      });

      it("Removes the last fragment whose anchor have not appeared", function () {
        context.isAnchorAlreadyAppeared.and.callFake(function (floatId) {
          return floatId === float2.getId();
        });
        context.finish();

        expect(context.removePageFloatFragment).toHaveBeenCalledWith(fragment1);
        expect(context.removePageFloatFragment).not.toHaveBeenCalledWith(
          fragment2,
        );
        expect(context.isForbidden(float1)).toBe(true);
        expect(context.isForbidden(float2)).not.toBe(true);
        expect(context.getPageFloatContinuationsDeferredToNext()).toEqual([
          cont3,
        ]);
      });

      it("Removes floats deferred to next fragmentainers if their anchors have not appeared", function () {
        var float5 = new PageFloat(
          dummyNodePosition(),
          FloatReference.COLUMN,
          "block-start",
          null,
          "aaa",
        );
        context.addPageFloat(float5);
        var cont5 = new PageFloatContinuation(float5, {});
        context.deferPageFloat(cont5);
        context.isAnchorAlreadyAppeared.and.callFake(function (id) {
          return id === float1.getId() || id === float2.getId();
        });
        context.finish();

        expect(context.removePageFloatFragment).not.toHaveBeenCalled();
        expect(context.getPageFloatContinuationsDeferredToNext()).toEqual([
          cont3,
          cont4,
        ]);
      });

      it("Transfer floats deferred from previous fragmentainers and not laid out yet if all anchor view nodes of the float fragments have already appeared", function () {
        expect(context.findPageFloatFragment(float1)).toBe(fragment1);
        expect(context.findPageFloatFragment(float2)).toBe(fragment2);

        context.isAnchorAlreadyAppeared.and.returnValue(true);
        context.finish();

        expect(context.removePageFloatFragment).not.toHaveBeenCalled();
        expect(context.getPageFloatContinuationsDeferredToNext()).toEqual([
          cont3,
          cont4,
        ]);
      });

      it("retries footnote sizing outside multi-column when the footnote pushes its anchor away", function () {
        var pageContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          rootContext,
          FloatReference.PAGE,
          null,
          null,
          null,
          null,
        );
        var float = new PageFloat(
          dummyNodePosition(),
          FloatReference.PAGE,
          "block-end",
          null,
          "body",
        );
        float.footnotePolicy = adapt_css.ident.line;
        pageContext.addPageFloat(float);
        pageContext.markPageFloatAnchorSeen(float);
        spyOn(pageContext, "hasMultiColumnFootnoteContext").and.returnValue(
          false,
        );
        var area = {
          isFootnote: true,
          computedBlockSize: 100,
          getInsetBefore: function () {
            return 5;
          },
          getInsetAfter: function () {
            return 5;
          },
          element: {
            parentNode: {
              removeChild: jasmine.createSpy("removeChild"),
            },
          },
        };
        var fragment = new PageFloatFragment(
          float.floatReference,
          float.floatSide,
          null,
          [new PageFloatContinuation(float, {})],
          area,
          true,
        );
        pageContext.addPageFloatFragment(fragment, true);

        expect(pageContext.checkAndForbidNotAllowedFloat()).toBe(true);

        expect(pageContext.footnoteMaxBlockSize).toBe(55);
        expect(pageContext.isForbidden(float)).toBe(false);
        expect(pageContext.findPageFloatFragment(float)).toBe(null);
      });

      it("forbids deferred line-policy footnotes on page contexts while the anchor is present", function () {
        var pageContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          rootContext,
          FloatReference.PAGE,
          null,
          null,
          null,
          null,
        );
        spyOn(pageContext, "invalidate").and.callThrough();
        var float = new PageFloat(
          dummyNodePosition(),
          FloatReference.PAGE,
          "block-end",
          null,
          "body",
        );
        float.footnotePolicy = adapt_css.ident.line;
        pageContext.addPageFloat(float);
        var continuation = new PageFloatContinuation(float, {});
        pageContext.deferPageFloat(continuation);
        spyOn(pageContext, "hasCurrentAnchor").and.returnValue(true);

        pageContext.finish();

        expect(pageContext.isForbidden(float)).toBe(true);
        expect(pageContext.getPageFloatContinuationsDeferredToNext()).toEqual(
          [],
        );
        expect(pageContext.invalidate).toHaveBeenCalled();
      });

      it("does not forbid deferred line-policy footnotes on page contexts when the anchor moved off the page on retry", function () {
        var pageContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          rootContext,
          FloatReference.PAGE,
          null,
          null,
          null,
          null,
        );
        spyOn(pageContext, "invalidate").and.callThrough();
        var float = new PageFloat(
          dummyNodePosition(),
          FloatReference.PAGE,
          "block-end",
          null,
          "body",
        );
        float.footnotePolicy = adapt_css.ident.line;
        pageContext.addPageFloat(float);
        var continuation = new PageFloatContinuation(float, {});
        pageContext.deferPageFloat(continuation);
        pageContext.markPageFloatAnchorSeen(float);
        spyOn(pageContext, "hasCurrentAnchor").and.returnValue(false);

        pageContext.finish();

        expect(pageContext.isForbidden(float)).toBe(false);
        expect(pageContext.getPageFloatContinuationsDeferredToNext()).toEqual(
          [],
        );
        expect(pageContext.invalidate).not.toHaveBeenCalled();
      });

      it("does not forbid deferred line-policy footnotes on region contexts", function () {
        // ops builds a region under the page context; the arm handles a
        // parent without a container too.
        var pageContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          rootContext,
          FloatReference.PAGE,
          null,
          null,
          null,
          null,
        );
        var regionContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          pageContext,
          FloatReference.REGION,
          null,
          null,
          null,
          null,
        );
        spyOn(regionContext, "invalidate").and.callThrough();
        var float = new PageFloat(
          dummyNodePosition(),
          FloatReference.REGION,
          "block-end",
          null,
          "body",
        );
        float.footnotePolicy = adapt_css.ident.line;
        regionContext.addPageFloat(float);
        var continuation = new PageFloatContinuation(float, {});
        regionContext.deferPageFloat(continuation);
        regionContext.markPageFloatAnchorSeen(float);

        regionContext.finish();

        expect(regionContext.isForbidden(float)).toBe(false);
        expect(regionContext.invalidate).not.toHaveBeenCalled();
      });
    });

    describe("#invalidate", function () {
      var container, context;
      beforeEach(function () {
        container = {
          clear: jasmine.createSpy("clear"),
          element: {},
        };
        context = PageFloatLayoutContext.createWithContainer(
          container,
          rootContext,
          FloatReference.PAGE,
          null,
          null,
          null,
          null,
        );
      });

      it("invalidate the container", function () {
        expect(context.isInvalidated()).toBe(false);

        context.invalidate();

        expect(container.clear).toHaveBeenCalled();
        expect(context.isInvalidated()).toBe(true);
      });

      it("removes all registered anchor view nodes", function () {
        var float = new PageFloat(
          dummyNodePosition(),
          FloatReference.PAGE,
          "block-start",
          null,
          "body",
        );
        context.addPageFloat(float);
        var anchorViewNode = {};
        context.registerPageFloatAnchor(float, anchorViewNode);

        expect(context.collectPageFloatAnchors()[float.getId()]).toBe(
          anchorViewNode,
        );

        context.invalidate();

        expect(Object.keys(context.collectPageFloatAnchors()).length).toBe(0);
      });

      it("clears children", function () {
        var child = PageFloatLayoutContext.createWithContainer(
          // Same container element as the parent, which is what makes
          // invalidate() detach this child's fragment views.
          { clear: jasmine.createSpy("clear"), element: container.element },
          context,
          FloatReference.REGION,
          null,
          null,
          null,
          null,
        );
        var fragment = {
          area: {
            element: {
              parentNode: { removeChild: jasmine.createSpy("removeChild") },
            },
          },
        };
        child.floatFragments.push(fragment);

        expect(context.children).toEqual([child]);

        context.invalidate();

        expect(
          fragment.area.element.parentNode.removeChild,
        ).toHaveBeenCalledWith(fragment.area.element);
        expect(context.children).toEqual([]);
      });
    });

    describe("#isInvalidated", function () {
      function container() {
        return { clear: jasmine.createSpy("clear") };
      }

      it("returns true if one of its ancestors is invalidated", function () {
        var pageContext = PageFloatLayoutContext.createWithContainer(
          container(),
          rootContext,
          FloatReference.PAGE,
          null,
          null,
          null,
          null,
        );
        var regionContext = PageFloatLayoutContext.createWithContainer(
          container(),
          pageContext,
          FloatReference.REGION,
          null,
          null,
          null,
          null,
        );
        var columnContext = PageFloatLayoutContext.createWithContainer(
          container(),
          regionContext,
          FloatReference.COLUMN,
          null,
          null,
          null,
          null,
        );

        expect(columnContext.isInvalidated()).toBe(false);
        expect(regionContext.isInvalidated()).toBe(false);
        expect(pageContext.isInvalidated()).toBe(false);

        columnContext.invalidate();

        expect(columnContext.isInvalidated()).toBe(true);
        expect(regionContext.isInvalidated()).toBe(false);
        expect(pageContext.isInvalidated()).toBe(false);

        columnContext.validate();

        expect(columnContext.isInvalidated()).toBe(false);

        regionContext.invalidate();

        expect(columnContext.isInvalidated()).toBe(true);
        expect(regionContext.isInvalidated()).toBe(true);
        expect(pageContext.isInvalidated()).toBe(false);

        regionContext.validate();

        expect(regionContext.isInvalidated()).toBe(false);

        pageContext.invalidate();

        expect(columnContext.isInvalidated()).toBe(true);
        expect(regionContext.isInvalidated()).toBe(true);
        expect(pageContext.isInvalidated()).toBe(true);
      });
    });

    describe("#getFloatFragmentExclusions", function () {
      it("returns an array of exclusions of PageFloatFragments", function () {
        var context = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          rootContext,
          FloatReference.COLUMN,
          null,
          null,
          null,
          null,
        );

        var float1 = new PageFloat(
          dummyNodePosition(),
          FloatReference.COLUMN,
          "block-start",
          null,
          "body",
        );
        context.addPageFloat(float1);
        var shape1 = { foo: "shape1" };
        var area1 = {
          getOuterShape: jasmine
            .createSpy("getOuterShape")
            .and.returnValue(shape1),
        };
        var fragment1 = new PageFloatFragment(
          float1.floatReference,
          float1.floatSide,
          null,
          [new PageFloatContinuation(float1, {})],
          area1,
          false,
        );
        context.addPageFloatFragment(fragment1);

        var float2 = new PageFloat(
          dummyNodePosition(),
          FloatReference.COLUMN,
          "block-start",
          null,
          "body",
        );
        context.addPageFloat(float2);
        var shape2 = { foo: "shape2" };
        var area2 = {
          getOuterShape: jasmine
            .createSpy("getOuterShape")
            .and.returnValue(shape2),
        };
        var fragment2 = new PageFloatFragment(
          float2.floatReference,
          float2.floatSide,
          null,
          [new PageFloatContinuation(float2, {})],
          area2,
          false,
        );
        context.addPageFloatFragment(fragment2);

        expect(context.getFloatFragmentExclusions()).toEqual([shape1, shape2]);
      });

      it("returns an array of exclusions of PageFloatFragments, including those registered in the parent context", function () {
        var regionContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          rootContext,
          FloatReference.REGION,
          null,
          null,
          null,
          null,
        );
        var columnContext = PageFloatLayoutContext.createWithContainer(
          mockContainer(),
          regionContext,
          FloatReference.COLUMN,
          null,
          null,
          null,
          null,
        );

        var float1 = new PageFloat(
          dummyNodePosition(),
          FloatReference.REGION,
          "block-start",
          null,
          "body",
        );
        regionContext.addPageFloat(float1);
        var shape1 = { foo: "shape1" };
        var area1 = {
          getOuterShape: jasmine
            .createSpy("getOuterShape")
            .and.returnValue(shape1),
        };
        var fragment1 = new PageFloatFragment(
          float1.floatReference,
          float1.floatSide,
          null,
          [new PageFloatContinuation(float1, {})],
          area1,
          false,
        );
        regionContext.addPageFloatFragment(fragment1);

        var float2 = new PageFloat(
          dummyNodePosition(),
          FloatReference.COLUMN,
          "block-start",
          null,
          "body",
        );
        columnContext.addPageFloat(float2);
        var shape2 = { foo: "shape2" };
        var area2 = {
          getOuterShape: jasmine
            .createSpy("getOuterShape")
            .and.returnValue(shape2),
        };
        var fragment2 = new PageFloatFragment(
          float2.floatReference,
          float2.floatSide,
          null,
          [new PageFloatContinuation(float2, {})],
          area2,
          false,
        );
        columnContext.addPageFloatFragment(fragment2);

        expect(columnContext.getFloatFragmentExclusions()).toEqual([
          shape1,
          shape2,
        ]);
      });
    });

    describe("float edge helpers", function () {
      function container(vertical) {
        return {
          vertical: vertical,
          element: {},
          clear: jasmine.createSpy("clear"),
        };
      }

      function addFragment(context, floatReference, floatSide, rect) {
        var float = new PageFloat(
          dummyNodePosition(),
          floatReference,
          floatSide,
          null,
          "body",
        );
        context.addPageFloat(float);
        var fragment = new PageFloatFragment(
          float.floatReference,
          float.floatSide,
          null,
          [new PageFloatContinuation(float, {})],
          {
            getOuterRect: jasmine
              .createSpy("getOuterRect")
              .and.returnValue(rect),
          },
          false,
        );
        context.addPageFloatFragment(fragment);
      }

      it("resolves the block-end edge axis from its own container too", function () {
        var pageContext = PageFloatLayoutContext.createWithContainer(
          container(false),
          rootContext,
          FloatReference.PAGE,
          null,
          null,
          null,
          null,
        );
        var columnContext = PageFloatLayoutContext.createWithContainer(
          container(true),
          pageContext,
          FloatReference.COLUMN,
          null,
          null,
          null,
          null,
        );

        // A vertical context folds x1 with Math.min (100), a horizontal one
        // folds y2 with Math.max (480).
        addFragment(columnContext, FloatReference.COLUMN, "block-start", {
          x1: 100,
          x2: 180,
          y1: 300,
          y2: 380,
        });
        addFragment(columnContext, FloatReference.COLUMN, "block-start", {
          x1: 200,
          x2: 260,
          y1: 400,
          y2: 480,
        });

        expect(columnContext.getBlockEndEdgeOfBlockStartFloats()).toBe(100);
      });

      it("resolves the axis from its own container, not an ancestor's", function () {
        var pageContext = PageFloatLayoutContext.createWithContainer(
          container(false),
          rootContext,
          FloatReference.PAGE,
          null,
          null,
          null,
          null,
        );
        var columnContext = PageFloatLayoutContext.createWithContainer(
          container(true),
          pageContext,
          FloatReference.COLUMN,
          null,
          null,
          null,
          null,
        );

        // Two block-end fragments on the column. A vertical context folds
        // x2 with Math.max (260), a horizontal one folds y1 with Math.min
        // (300), so the value says which container decided the axis.
        addFragment(columnContext, FloatReference.COLUMN, "block-end", {
          x1: 100,
          x2: 180,
          y1: 300,
          y2: 380,
        });
        addFragment(columnContext, FloatReference.COLUMN, "block-end", {
          x1: 200,
          x2: 260,
          y1: 400,
          y2: 480,
        });

        expect(columnContext.getBlockStartEdgeOfBlockEndFloats()).toBe(260);
      });

      it("includes ancestor block-end floats when getting block-start edge of block-end floats", function () {
        var pageContext = PageFloatLayoutContext.createWithContainer(
          container(false),
          rootContext,
          FloatReference.PAGE,
          null,
          null,
          null,
          null,
        );
        var regionContext = PageFloatLayoutContext.createWithContainer(
          container(false),
          pageContext,
          FloatReference.REGION,
          null,
          null,
          null,
          null,
        );
        var columnContext = PageFloatLayoutContext.createWithContainer(
          container(false),
          regionContext,
          FloatReference.COLUMN,
          null,
          null,
          null,
          null,
        );

        addFragment(pageContext, FloatReference.PAGE, "block-end", {
          x1: 0,
          x2: 0,
          y1: 520,
          y2: 600,
        });
        addFragment(regionContext, FloatReference.REGION, "block-end", {
          x1: 0,
          x2: 0,
          y1: 480,
          y2: 500,
        });

        expect(columnContext.getBlockStartEdgeOfBlockEndFloats()).toBe(480);
      });

      it("filters block-end floats by inlinePos when getting block-start edge", function () {
        var pageContext = PageFloatLayoutContext.createWithContainer(
          container(false),
          rootContext,
          FloatReference.PAGE,
          null,
          null,
          null,
          null,
        );
        var regionContext = PageFloatLayoutContext.createWithContainer(
          container(false),
          pageContext,
          FloatReference.REGION,
          null,
          null,
          null,
          null,
        );
        var columnContext = PageFloatLayoutContext.createWithContainer(
          container(false),
          regionContext,
          FloatReference.COLUMN,
          null,
          null,
          null,
          null,
        );

        // Overlaps inlinePos=50 only
        addFragment(pageContext, FloatReference.PAGE, "block-end", {
          x1: 0,
          x2: 100,
          y1: 520,
          y2: 600,
        });
        // Overlaps inlinePos=250 only
        addFragment(regionContext, FloatReference.REGION, "block-end", {
          x1: 200,
          x2: 300,
          y1: 480,
          y2: 500,
        });

        expect(columnContext.getBlockStartEdgeOfBlockEndFloats()).toBe(480);
        expect(columnContext.getBlockStartEdgeOfBlockEndFloats(50)).toBe(520);
        expect(columnContext.getBlockStartEdgeOfBlockEndFloats(250)).toBe(480);
      });

      it("treats block-end inline-* floats as block-end floats", function () {
        var pageContext = PageFloatLayoutContext.createWithContainer(
          container(false),
          rootContext,
          FloatReference.PAGE,
          null,
          null,
          null,
          null,
        );
        var regionContext = PageFloatLayoutContext.createWithContainer(
          container(false),
          pageContext,
          FloatReference.REGION,
          null,
          null,
          null,
          null,
        );
        var columnContext = PageFloatLayoutContext.createWithContainer(
          container(false),
          regionContext,
          FloatReference.COLUMN,
          null,
          null,
          null,
          null,
        );

        addFragment(pageContext, FloatReference.PAGE, "block-end inline-end", {
          x1: 0,
          x2: 150,
          y1: 540,
          y2: 600,
        });
        addFragment(
          regionContext,
          FloatReference.REGION,
          "block-end inline-start",
          {
            x1: 200,
            x2: 350,
            y1: 500,
            y2: 560,
          },
        );

        expect(columnContext.getBlockStartEdgeOfBlockEndFloats()).toBe(500);
        expect(columnContext.getBlockStartEdgeOfBlockEndFloats(50)).toBe(540);
        expect(columnContext.getBlockStartEdgeOfBlockEndFloats(250)).toBe(500);
      });

      it("filters block-start floats by inlinePos when getting block-end edge", function () {
        var pageContext = PageFloatLayoutContext.createWithContainer(
          container(false),
          rootContext,
          FloatReference.PAGE,
          null,
          null,
          null,
          null,
        );
        var regionContext = PageFloatLayoutContext.createWithContainer(
          container(false),
          pageContext,
          FloatReference.REGION,
          null,
          null,
          null,
          null,
        );
        var columnContext = PageFloatLayoutContext.createWithContainer(
          container(false),
          regionContext,
          FloatReference.COLUMN,
          null,
          null,
          null,
          null,
        );

        // Overlaps inlinePos=50 only
        addFragment(pageContext, FloatReference.PAGE, "block-start", {
          x1: 0,
          x2: 100,
          y1: 0,
          y2: 80,
        });
        // Overlaps inlinePos=250 only
        addFragment(regionContext, FloatReference.REGION, "block-start", {
          x1: 200,
          x2: 300,
          y1: 0,
          y2: 120,
        });

        expect(columnContext.getBlockEndEdgeOfBlockStartFloats()).toBe(120);
        expect(columnContext.getBlockEndEdgeOfBlockStartFloats(50)).toBe(80);
        expect(columnContext.getBlockEndEdgeOfBlockStartFloats(250)).toBe(120);
      });

      it("includes ancestor block-end floats in vertical contexts", function () {
        var pageContext = PageFloatLayoutContext.createWithContainer(
          container(true),
          rootContext,
          FloatReference.PAGE,
          null,
          null,
          null,
          null,
        );
        var regionContext = PageFloatLayoutContext.createWithContainer(
          container(true),
          pageContext,
          FloatReference.REGION,
          null,
          null,
          null,
          null,
        );
        var columnContext = PageFloatLayoutContext.createWithContainer(
          container(true),
          regionContext,
          FloatReference.COLUMN,
          null,
          null,
          null,
          null,
        );

        addFragment(pageContext, FloatReference.PAGE, "block-end", {
          x1: 100,
          x2: 180,
          y1: 0,
          y2: 0,
        });
        addFragment(regionContext, FloatReference.REGION, "block-end", {
          x1: 200,
          x2: 260,
          y1: 0,
          y2: 0,
        });

        expect(columnContext.getBlockStartEdgeOfBlockEndFloats()).toBe(260);
      });

      it("filters block-start floats by inlinePos in vertical contexts", function () {
        var pageContext = PageFloatLayoutContext.createWithContainer(
          container(true),
          rootContext,
          FloatReference.PAGE,
          null,
          null,
          null,
          null,
        );
        var regionContext = PageFloatLayoutContext.createWithContainer(
          container(true),
          pageContext,
          FloatReference.REGION,
          null,
          null,
          null,
          null,
        );
        var columnContext = PageFloatLayoutContext.createWithContainer(
          container(true),
          regionContext,
          FloatReference.COLUMN,
          null,
          null,
          null,
          null,
        );

        // In vertical writing, inline axis is Y.
        addFragment(pageContext, FloatReference.PAGE, "block-start", {
          x1: 300,
          x2: 360,
          y1: 0,
          y2: 120,
        });
        addFragment(regionContext, FloatReference.REGION, "block-start", {
          x1: 260,
          x2: 320,
          y1: 200,
          y2: 300,
        });

        expect(columnContext.getBlockEndEdgeOfBlockStartFloats()).toBe(260);
        expect(columnContext.getBlockEndEdgeOfBlockStartFloats(50)).toBe(300);
        expect(columnContext.getBlockEndEdgeOfBlockStartFloats(250)).toBe(260);
      });
    });
  });
});
