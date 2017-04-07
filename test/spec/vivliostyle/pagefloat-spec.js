/**
 * Copyright 2017 Vivliostyle Inc.
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
describe("pagefloat", function() {
    var module = vivliostyle.pagefloat;
    var FloatReference = module.FloatReference;
    var PageFloat = module.PageFloat;
    var PageFloatList = module.PageFloatList;
    var PageFloatStore = module.PageFloatStore;
    var PageFloatFragment = module.PageFloatFragment;
    var PageFloatContinuation = module.PageFloatContinuation;
    var PageFloatLayoutContext = module.PageFloatLayoutContext;

    var dummyOffsetInNode = 0;
    function dummyNodePosition() {
        return {
            offsetInNode: dummyOffsetInNode++
        };
    }

    describe("PageFloatStore", function() {
        var store;
        beforeEach(function() {
            store = new PageFloatStore();
        });

        describe("#addPageFloat", function() {
            it("adds a PageFloat", function() {
                var float = new PageFloat(dummyNodePosition(), FloatReference.COLUMN, "block-start", "body");

                expect(store.floats).not.toContain(float);

                store.addPageFloat(float);

                expect(store.floats).toContain(float);
            });

            it("assign a new ID to the PageFloat", function() {
                var float = new PageFloat(dummyNodePosition(), FloatReference.COLUMN, "block-start", "body");

                expect(float.id).toBe(null);

                store.addPageFloat(float);

                expect(float.id).toBe("pf0");

                float = new PageFloat(dummyNodePosition(), FloatReference.COLUMN, "block-start", "body");
                store.addPageFloat(float);

                expect(float.id).toBe("pf1");
            });

            it("throws an error if a float with the same node position is already registered", function() {
                var nodePosition = dummyNodePosition();
                var float = new PageFloat(nodePosition, FloatReference.COLUMN, "block-start", "body");
                store.addPageFloat(float);

                expect(store.floats).toContain(float);

                float = new PageFloat(nodePosition, FloatReference.COLUMN, "block-start", "body");

                expect(function() { store.addPageFloat(float); }).toThrow();
            });
        });

        describe("#findPageFloatByNodePosition", function() {
            it("returns a registered page float associated with the specified node position", function() {
                var nodePosition = dummyNodePosition();
                var float = new PageFloat(nodePosition, FloatReference.COLUMN, "block-start", "body");
                store.addPageFloat(float);

                expect(store.findPageFloatByNodePosition(nodePosition)).toBe(float);
            });

            it("returns null when no page float with the specified node position is registered", function() {
                var float = new PageFloat(dummyNodePosition(), FloatReference.COLUMN, "block-start", "body");
                store.addPageFloat(float);

                expect(store.findPageFloatByNodePosition({})).toBe(null);
            });
        });
    });

    describe("PageFloatLayoutContext", function() {
        var rootContext;
        beforeEach(function() {
            rootContext = new PageFloatLayoutContext(null, null, null, null, null, null, null);
        });

        describe("constructor", function() {
            it("uses writing-mode and direction values of the parent if they are not specified", function() {
                var context = new PageFloatLayoutContext(rootContext, FloatReference.PAGE, null, null,
                    null, adapt.css.ident.vertical_rl, adapt.css.ident.rtl);

                expect(context.writingMode).toBe(adapt.css.ident.vertical_rl);
                expect(context.direction).toBe(adapt.css.ident.rtl);

                context = new PageFloatLayoutContext(context, FloatReference.REGION, null, null, null,
                    null, null);

                expect(context.writingMode).toBe(adapt.css.ident.vertical_rl);
                expect(context.direction).toBe(adapt.css.ident.rtl);
            });

            it("registers itself to the parent as a child", function() {
                var pageContext = new PageFloatLayoutContext(rootContext, FloatReference.PAGE, null,
                    null, null, null, null);

                expect(rootContext.children).toEqual([pageContext]);

                var regionContext = new PageFloatLayoutContext(pageContext, FloatReference.REGION,
                    null, null, null, null, null);

                expect(pageContext.children).toEqual([regionContext]);
            });
        });

        describe("#getPreviousSibling", function() {
            it("returns null if the parent has no children preceding the child", function() {
                var context = new PageFloatLayoutContext(rootContext, FloatReference.PAGE, null, null,
                    null, null, null);

                expect(context.getPreviousSibling()).toBe(null);
            });

            it("returns the previous sibling if it has the same floatReference", function() {
                var context1 = new PageFloatLayoutContext(rootContext, FloatReference.PAGE, null, null,
                    null, null, null);
                var context2 = new PageFloatLayoutContext(rootContext, FloatReference.PAGE, null, null,
                    null, null, null);
                var context3 = new PageFloatLayoutContext(rootContext, FloatReference.PAGE, null, null,
                    null, null, null);

                expect(context3.getPreviousSibling()).toBe(context2);
                expect(context2.getPreviousSibling()).toBe(context1);
                expect(context1.getPreviousSibling()).toBe(null);
            });

            it("returns the last context with the same floatReference, the same flow and the same generating element", function() {
                var context1 = new PageFloatLayoutContext(rootContext, FloatReference.PAGE, null, null,
                    null, null, null);
                var context2 = new PageFloatLayoutContext(context1, FloatReference.REGION, null, "body",
                    null, null, null);
                var context3 = new PageFloatLayoutContext(context2, FloatReference.COLUMN, null, "body",
                    null, null, null);
                var context4 = new PageFloatLayoutContext(context1, FloatReference.REGION, null, "flow",
                    null, null, null);
                var context5 = new PageFloatLayoutContext(context4, FloatReference.COLUMN, null, "flow",
                    null, null, null);
                var context6 = new PageFloatLayoutContext(context4, FloatReference.COLUMN, null, "flow",
                    {}, null, null); // generating element exists
                var context7 = new PageFloatLayoutContext(rootContext, FloatReference.PAGE, null, null,
                    null, null, null);
                var context8 = new PageFloatLayoutContext(context7, FloatReference.REGION, null, "body",
                    null, null, null);
                var context9 = new PageFloatLayoutContext(context8, FloatReference.COLUMN, null, "body",
                    null, null, null);
                var context10 = new PageFloatLayoutContext(context7, FloatReference.REGION, null,
                    "flow", null, null, null);
                var context11 = new PageFloatLayoutContext(context10, FloatReference.COLUMN, null,
                    "flow", null, null, null);

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

        describe("#findPageFloatByNodePosition", function() {
            it("returns a page float registered by PageFloatLayoutContext with the same root PageFloatLayoutContext", function() {
                var context1 = new PageFloatLayoutContext(rootContext, FloatReference.PAGE, null, null,
                    null, null, null);
                var context2 = new PageFloatLayoutContext(rootContext, FloatReference.PAGE, null, null,
                    null, null, null);
                var nodePosition1 = dummyNodePosition();
                var float1 = new PageFloat(nodePosition1, FloatReference.PAGE, "block-start", "body");
                context1.addPageFloat(float1);
                var nodePosition2 = dummyNodePosition();
                var float2 = new PageFloat(nodePosition2, FloatReference.PAGE, "block-start", "body");
                context2.addPageFloat(float2);

                expect(context1.findPageFloatByNodePosition(nodePosition1)).toBe(float1);
                expect(context1.findPageFloatByNodePosition(nodePosition2)).toBe(float2);
                expect(context2.findPageFloatByNodePosition(nodePosition1)).toBe(float1);
                expect(context2.findPageFloatByNodePosition(nodePosition2)).toBe(float2);
            });
        });

        describe("#forbid, #isForbidden", function() {
            it("returns if the page float is forbidden in the context by #forbid method", function() {
                var context = new PageFloatLayoutContext(rootContext, FloatReference.PAGE, null, null,
                    null, null, null);
                var float = new PageFloat(dummyNodePosition(), FloatReference.PAGE, "block-start", "body");
                context.addPageFloat(float);

                expect(context.isForbidden(float)).toBe(false);

                context.forbid(float);

                expect(context.isForbidden(float)).toBe(true);
            });

            it("returns true if the page float is forbidden by one of ancestors of the context", function() {
                var pageContext = new PageFloatLayoutContext(rootContext, FloatReference.PAGE, null,
                    null, null, null, null);
                var regionContext = new PageFloatLayoutContext(pageContext, FloatReference.REGION,
                    null, null, null, null, null);
                var columnContext = new PageFloatLayoutContext(regionContext, FloatReference.COLUMN,
                    null, null, null, null, null);

                var float = new PageFloat(dummyNodePosition(), FloatReference.COLUMN, "block-start", "body");
                columnContext.addPageFloat(float);
                columnContext.forbid(float);

                expect(columnContext.isForbidden(float)).toBe(true);
                expect(function() { regionContext.isForbidden(float); }).toThrow();

                columnContext = new PageFloatLayoutContext(regionContext, FloatReference.COLUMN, null,
                    null, null, null, null);

                expect(columnContext.isForbidden(float)).toBe(false);

                float = new PageFloat(dummyNodePosition(), FloatReference.REGION, "block-start", "body");
                columnContext.addPageFloat(float);
                columnContext.forbid(float);

                expect(columnContext.isForbidden(float)).toBe(true);
                expect(regionContext.isForbidden(float)).toBe(true);
                expect(function() { pageContext.isForbidden(float); }).toThrow();

                columnContext = new PageFloatLayoutContext(regionContext, FloatReference.COLUMN, null,
                    null, null, null, null);

                expect(columnContext.isForbidden(float)).toBe(true);

                regionContext = new PageFloatLayoutContext(pageContext, FloatReference.REGION, null,
                    null, null, null, null);
                columnContext = new PageFloatLayoutContext(regionContext, FloatReference.COLUMN, null,
                    null, null, null, null);

                expect(columnContext.isForbidden(float)).toBe(false);
                expect(regionContext.isForbidden(float)).toBe(false);
                expect(function() { pageContext.isForbidden(float); }).toThrow();

                float = new PageFloat(dummyNodePosition(), FloatReference.PAGE, "block-start", "body");
                columnContext.addPageFloat(float);
                columnContext.forbid(float);

                expect(columnContext.isForbidden(float)).toBe(true);
                expect(regionContext.isForbidden(float)).toBe(true);
                expect(pageContext.isForbidden(float)).toBe(true);

                columnContext = new PageFloatLayoutContext(regionContext, FloatReference.COLUMN, null,
                    null, null, null, null);

                expect(columnContext.isForbidden(float)).toBe(true);

                regionContext = new PageFloatLayoutContext(pageContext, FloatReference.REGION, null,
                    null, null, null, null);
                columnContext = new PageFloatLayoutContext(regionContext, FloatReference.COLUMN, null,
                    null, null, null, null);

                expect(columnContext.isForbidden(float)).toBe(true);
                expect(regionContext.isForbidden(float)).toBe(true);

                pageContext = new PageFloatLayoutContext(rootContext, FloatReference.PAGE, null, null,
                    null, null, null);
                regionContext = new PageFloatLayoutContext(pageContext, FloatReference.REGION, null,
                    null, null, null, null);
                columnContext = new PageFloatLayoutContext(regionContext, FloatReference.COLUMN, null,
                    null, null, null, null);

                expect(columnContext.isForbidden(float)).toBe(false);
                expect(regionContext.isForbidden(float)).toBe(false);
                expect(pageContext.isForbidden(float)).toBe(false);
            });
        });

        describe("#addPageFloatFragment, #findPageFloatFragment", function() {
            var pageContext, regionContext, columnContext, area;
            function reset() {
                pageContext = new PageFloatLayoutContext(rootContext, FloatReference.PAGE, null, null,
                    null, null, null);
                regionContext = new PageFloatLayoutContext(pageContext, FloatReference.REGION, null,
                    null, null, null, null);
                columnContext = new PageFloatLayoutContext(regionContext, FloatReference.COLUMN, null,
                    null, null, null, null);
                [pageContext, regionContext, columnContext].forEach(function(context) {
                    spyOn(context, "invalidate");
                    spyOn(context, "addPageFloatFragment").and.callThrough();
                });
            }
            beforeEach(function() {
                area = { getOuterShape: jasmine.createSpy("getOuterShape") };
                reset();
            });

            it("A PageFloatFragment added by #addPageFloatFragment can be retrieved by #findPageFloatFragment", function() {
                pageContext = new PageFloatLayoutContext(rootContext, FloatReference.PAGE, null, null,
                    null, null, null);
                var float = new PageFloat(dummyNodePosition(), FloatReference.PAGE, "block-start", "body");
                pageContext.addPageFloat(float);
                var fragment = new PageFloatFragment(PageFloatList.fromFloat(float), {}, area);

                expect(pageContext.findPageFloatFragment(float)).toBe(null);

                pageContext.addPageFloatFragment(fragment);

                expect(pageContext.findPageFloatFragment(float)).toBe(fragment);
            });

            it("A PageFloatFragment stored in one of the ancestors can be retrieved by #findPageFloatFragment", function() {
                var float = new PageFloat(dummyNodePosition(), FloatReference.REGION, "block-start", "body");
                columnContext.addPageFloat(float);
                var fragment = new PageFloatFragment(PageFloatList.fromFloat(float), {}, area);
                columnContext.addPageFloatFragment(fragment);
                columnContext = new PageFloatLayoutContext(regionContext, FloatReference.COLUMN, null,
                    null, null, null, null);

                expect(columnContext.findPageFloatFragment(float)).toBe(fragment);
                expect(regionContext.findPageFloatFragment(float)).toBe(fragment);
                expect(function() { pageContext.findPageFloatFragment(float); }).toThrow();

                float = new PageFloat(dummyNodePosition(), FloatReference.PAGE, "block-start", "body");
                columnContext.addPageFloat(float);
                fragment = new PageFloatFragment(PageFloatList.fromFloat(float), {}, area);
                columnContext.addPageFloatFragment(fragment);
                regionContext = new PageFloatLayoutContext(pageContext, FloatReference.REGION, null,
                    null, null, null, null);
                columnContext = new PageFloatLayoutContext(regionContext, FloatReference.COLUMN, null,
                    null, null, null, null);

                expect(columnContext.findPageFloatFragment(float)).toBe(fragment);
                expect(regionContext.findPageFloatFragment(float)).toBe(fragment);
                expect(pageContext.findPageFloatFragment(float)).toBe(fragment);
            });

            it("When a PageFloatFragment is added by #addPageFloatFragment, the corresponding PageFloatLayoutContext is invalidated", function() {
                var float = new PageFloat(dummyNodePosition(), FloatReference.COLUMN, "block-start", "body");
                columnContext.addPageFloat(float);
                var fragment = new PageFloatFragment(PageFloatList.fromFloat(float), {}, area);
                columnContext.addPageFloatFragment(fragment);

                expect(columnContext.invalidate).toHaveBeenCalled();
                expect(regionContext.addPageFloatFragment).not.toHaveBeenCalled();

                reset();
                float = new PageFloat(dummyNodePosition(), FloatReference.REGION, "block-start", "body");
                columnContext.addPageFloat(float);
                fragment = new PageFloatFragment(PageFloatList.fromFloat(float), {}, area);
                columnContext.addPageFloatFragment(fragment);

                expect(columnContext.invalidate).toHaveBeenCalled();
                expect(regionContext.addPageFloatFragment).toHaveBeenCalledWith(fragment, undefined);
                expect(regionContext.invalidate).toHaveBeenCalled();
                expect(pageContext.addPageFloatFragment).not.toHaveBeenCalledWith(fragment);

                reset();
                float = new PageFloat(dummyNodePosition(), FloatReference.PAGE, "block-start", "body");
                columnContext.addPageFloat(float);
                fragment = new PageFloatFragment(PageFloatList.fromFloat(float), area);
                columnContext.addPageFloatFragment(fragment);

                expect(columnContext.invalidate).toHaveBeenCalled();
                expect(regionContext.addPageFloatFragment).toHaveBeenCalledWith(fragment, undefined);
                expect(regionContext.invalidate).toHaveBeenCalled();
                expect(pageContext.addPageFloatFragment).toHaveBeenCalledWith(fragment, undefined);
                expect(pageContext.invalidate).toHaveBeenCalled();
            });
        });

        describe("#removePageFloatFragment", function() {
            var container, context, float, area, fragment;
            beforeEach(function() {
                context = new PageFloatLayoutContext(rootContext, FloatReference.PAGE, container, null,
                    null, null, null);
                spyOn(context, "invalidate");
                float = new PageFloat(dummyNodePosition(), FloatReference.PAGE, "block-start", "body");
                context.addPageFloat(float);
                area = {
                    element: {
                        parentNode: {
                            removeChild: jasmine.createSpy("removeChild")
                        }
                    }
                };
                fragment = new PageFloatFragment(PageFloatList.fromFloat(float), {}, area);
                context.addPageFloatFragment(fragment);
                context.invalidate.calls.reset();
            });

            it("removes the specified PageFloatFragment", function() {
                expect(context.findPageFloatFragment(float)).toBe(fragment);

                context.removePageFloatFragment(fragment);

                expect(context.findPageFloatFragment(float)).toBe(null);
            });

            it("detaches the view node of the fragment", function() {
                context.removePageFloatFragment(fragment);

                expect(area.element.parentNode.removeChild).toHaveBeenCalledWith(area.element);
            });

            it("invalidates the context", function() {
                context.removePageFloatFragment(fragment);

                expect(context.invalidate).toHaveBeenCalled();
            });
        });

        describe("#registerPageFloatAnchor", function() {
            var pageContext, regionContext, columnContext, float, anchorViewNode;
            beforeEach(function() {
                pageContext = new PageFloatLayoutContext(rootContext, FloatReference.PAGE, null, null,
                    null, null, null);
                regionContext = new PageFloatLayoutContext(pageContext, FloatReference.REGION, null,
                    null, null, null, null);
                columnContext = new PageFloatLayoutContext(regionContext, FloatReference.COLUMN, null,
                    null, null, null, null);
                anchorViewNode = {};
            });

            it("stores the anchor view node", function() {
                float = new PageFloat(dummyNodePosition(), FloatReference.COLUMN, "block-start", "body");
                columnContext.addPageFloat(float);
                columnContext.registerPageFloatAnchor(float, anchorViewNode);

                expect(columnContext.floatAnchors[float.getId()]).toBe(anchorViewNode);
            });

            it("stores the anchor view node to the corresponding context", function() {
                float = new PageFloat(dummyNodePosition(), FloatReference.REGION, "block-start", "body");
                columnContext.addPageFloat(float);
                columnContext.registerPageFloatAnchor(float, anchorViewNode);

                expect(columnContext.floatAnchors[float.getId()]).toBeUndefined();
                expect(regionContext.floatAnchors[float.getId()]).toBe(anchorViewNode);

                float = new PageFloat(dummyNodePosition(), FloatReference.PAGE, "block-start", "body");
                columnContext.addPageFloat(float);
                columnContext.registerPageFloatAnchor(float, anchorViewNode);

                expect(columnContext.floatAnchors[float.getId()]).toBeUndefined();
                expect(regionContext.floatAnchors[float.getId()]).toBeUndefined();
                expect(pageContext.floatAnchors[float.getId()]).toBe(anchorViewNode);
            });
        });

        describe("#isAnchorAlreadyAppeared", function() {
            var container, context, float, id, anchorViewNode;
            beforeEach(function() {
                container = {
                    element: {
                        contains: jasmine.createSpy("contains")
                    }
                };
                context = new PageFloatLayoutContext(rootContext, FloatReference.COLUMN, container,
                    "foo", null, null, null);
                float = new PageFloat(dummyNodePosition(), FloatReference.COLUMN, "block-start", "foo");
                context.addPageFloat(float);
                id = float.getId();
                anchorViewNode = {};
            });

            it("returns false if the anchor view node is not registered", function() {
                expect(context.isAnchorAlreadyAppeared(id)).toBe(false);
            });

            it("returns false if the anchor view node if registered but not contained in the container", function() {
                container.element.contains.and.returnValue(false);
                context.registerPageFloatAnchor(float, anchorViewNode);

                expect(context.isAnchorAlreadyAppeared(id)).toBe(false);
                expect(container.element.contains).toHaveBeenCalledWith(anchorViewNode);
            });

            it("returns true if the anchor view node if registered and contained in the container", function() {
                container.element.contains.and.returnValue(true);
                context.registerPageFloatAnchor(float, anchorViewNode);

                expect(context.isAnchorAlreadyAppeared(id)).toBe(true);
                expect(container.element.contains).toHaveBeenCalledWith(anchorViewNode);
            });

            it("returns true if the float is deferred from a previous fragment", function() {
                container.element.contains.and.returnValue(false);
                context.floatsDeferredFromPrevious.push(new PageFloatContinuation(float, {}));

                expect(context.isAnchorAlreadyAppeared(id)).toBe(true);
            });
        });

        describe("#deferPageFloat", function() {
            var pageContext, regionContext, columnContext, float;
            beforeEach(function() {
                pageContext = new PageFloatLayoutContext(rootContext, FloatReference.PAGE, null, null,
                    null, null, null);
                regionContext = new PageFloatLayoutContext(pageContext, FloatReference.REGION, null,
                    "foo", null, null, null);
                columnContext = new PageFloatLayoutContext(regionContext, FloatReference.COLUMN, null,
                    "foo", null, null, null);
            });

            it("stores a PageFloatContinuation as a deferred float", function() {
                float = new PageFloat(dummyNodePosition(), FloatReference.COLUMN, "block-start", "body");
                columnContext.addPageFloat(float);
                columnContext.deferPageFloat(new PageFloatContinuation(float, {}));

                expect(columnContext.floatsDeferredToNext.length).toBe(1);
                expect(columnContext.floatsDeferredToNext[0].float).toBe(float);
            });

            it("replaces an existing deferred PageFloatContinuation with new one if there exists a deferred continuation of the same float", function() {
                float = new PageFloat(dummyNodePosition(), FloatReference.COLUMN, "block-start", "body");
                columnContext.addPageFloat(float);
                var position1 = {};
                columnContext.deferPageFloat(new PageFloatContinuation(float, position1));

                expect(columnContext.floatsDeferredToNext.length).toBe(1);
                expect(columnContext.floatsDeferredToNext[0].float).toBe(float);
                expect(columnContext.floatsDeferredToNext[0].nodePosition).toBe(position1);

                var position2 = {};
                columnContext.deferPageFloat(new PageFloatContinuation(float, position2));

                expect(columnContext.floatsDeferredToNext.length).toBe(1);
                expect(columnContext.floatsDeferredToNext[0].float).toBe(float);
                expect(columnContext.floatsDeferredToNext[0].nodePosition).toBe(position2);
            });

            it("stores a PageFloatContinuation in the corresponding context as a deferred float", function() {
                float = new PageFloat(dummyNodePosition(), FloatReference.REGION, "block-start", "body");
                columnContext.addPageFloat(float);
                columnContext.deferPageFloat(new PageFloatContinuation(float, {}));

                expect(columnContext.floatsDeferredToNext.length).toBe(0);
                expect(regionContext.floatsDeferredToNext.length).toBe(1);
                expect(regionContext.floatsDeferredToNext[0].float).toBe(float);
            });
        });

        describe("getDeferredPageFloatContinuations", function() {
            function addPageFloat(floatReference, context, flowName) {
                var float = new PageFloat(dummyNodePosition(), floatReference, "block-start", flowName);
                context.addPageFloat(float);
                return float;
            }

            var pageContext, regionContext, columnContext, cont1, cont2, cont3, cont4, cont5, cont6;
            beforeEach(function() {
                pageContext = new PageFloatLayoutContext(rootContext, FloatReference.PAGE, null, null,
                    null, null);
                regionContext = new PageFloatLayoutContext(pageContext, FloatReference.REGION, null,
                    "foo", null, null, null);
                columnContext = new PageFloatLayoutContext(regionContext, FloatReference.COLUMN, null,
                    "foo", null, null, null);
                var float1 = addPageFloat(FloatReference.PAGE, pageContext, "foo");
                cont1 = new PageFloatContinuation(float1, {});
                pageContext.floatsDeferredFromPrevious.push(cont1);
                var float2 = addPageFloat(FloatReference.PAGE, pageContext, "bar");
                cont2 = new PageFloatContinuation(float2, {});
                pageContext.floatsDeferredFromPrevious.push(cont2);
                var float3 = addPageFloat(FloatReference.REGION, regionContext, "foo");
                cont3 = new PageFloatContinuation(float3, {});
                regionContext.floatsDeferredFromPrevious.push(cont3);
                var float4 = addPageFloat(FloatReference.REGION, regionContext, "bar");
                cont4 = new PageFloatContinuation(float4, {});
                regionContext.floatsDeferredFromPrevious.push(cont4);
                var float5 = addPageFloat(FloatReference.COLUMN, columnContext, "foo");
                cont5 = new PageFloatContinuation(float5, {});
                columnContext.floatsDeferredFromPrevious.push(cont5);
                var float6 = addPageFloat(FloatReference.COLUMN, columnContext, "bar");
                cont6 = new PageFloatContinuation(float6, {});
                columnContext.floatsDeferredFromPrevious.push(cont6);
            });

            it("returns all deferred PageFloatContinuations with the corresponding flow name in order of page, region and column", function() {
                expect(columnContext.getDeferredPageFloatContinuations()).toEqual([cont1, cont3, cont5]);
                expect(columnContext.getDeferredPageFloatContinuations("bar")).toEqual([cont2, cont4, cont6]);
            });

            it("returns all deferred PageFLoatContinuations in order of page, region and column when the context does not have a flow name and no flow name is specified as an argument", function() {
                expect(pageContext.getDeferredPageFloatContinuations()).toEqual([cont1, cont2]);
            });
        });

        describe("getPageFloatContinuationsDeferredToNext", function() {
            var pageContext, regionContext, columnContext, cont1, cont2, cont3, cont4, cont5, cont6;
            beforeEach(function() {
                pageContext = new PageFloatLayoutContext(rootContext, FloatReference.PAGE, null, null,
                    null, null);
                regionContext = new PageFloatLayoutContext(pageContext, FloatReference.REGION, null,
                    "foo", null, null, null);
                columnContext = new PageFloatLayoutContext(regionContext, FloatReference.COLUMN, null,
                    "foo", null, null, null);
                cont1 = new PageFloatContinuation({flowName: "foo"}, {});
                pageContext.floatsDeferredToNext.push(cont1);
                cont2 = new PageFloatContinuation({flowName: "bar"}, {});
                pageContext.floatsDeferredToNext.push(cont2);
                cont3 = new PageFloatContinuation({flowName: "foo"}, {});
                regionContext.floatsDeferredToNext.push(cont3);
                cont4 = new PageFloatContinuation({flowName: "bar"}, {});
                regionContext.floatsDeferredToNext.push(cont4);
                cont5 = new PageFloatContinuation({flowName: "foo"}, {});
                columnContext.floatsDeferredToNext.push(cont5);
                cont6 = new PageFloatContinuation({flowName: "bar"}, {});
                columnContext.floatsDeferredToNext.push(cont6);
            });

            it("returns all PageFloatContinuations deferred to the next fragmentainer with the corresonding flow name in order of page, region and column", function() {
                expect(columnContext.getPageFloatContinuationsDeferredToNext()).toEqual([cont1, cont3, cont5]);
                expect(columnContext.getPageFloatContinuationsDeferredToNext("bar")).toEqual([cont2, cont4, cont6]);
            });

            it("returns all PageFLoatContinuations deferred to the next fragmentainer in order of page, region and column when the context does not have a flow name and no flow name is specified as an argument", function() {
                expect(pageContext.getPageFloatContinuationsDeferredToNext()).toEqual([cont1, cont2]);
            });
        });

        describe("#finish", function() {
            var context, float1, cont1, fragment1, float2, fragment2, float3, cont3, float4, cont4;
            beforeEach(function() {
                context = new PageFloatLayoutContext(rootContext, FloatReference.COLUMN, null, null,
                    null, null, null);
                spyOn(context, "isAnchorAlreadyAppeared");
                spyOn(context, "removePageFloatFragment");
                float1 = new PageFloat(dummyNodePosition(), FloatReference.COLUMN, "block-start", "foo");
                context.addPageFloat(float1);
                fragment1 = new PageFloatFragment(PageFloatList.fromFloat(float1), {}, {});
                context.addPageFloatFragment(fragment1);
                cont1 = new PageFloatContinuation(float1, {});
                float2 = new PageFloat(dummyNodePosition(), FloatReference.COLUMN, "block-start", "body");
                context.addPageFloat(float2);
                fragment2 = new PageFloatFragment(PageFloatList.fromFloat(float2), {}, {});
                context.addPageFloatFragment(fragment2);
                float3 = new PageFloat(dummyNodePosition(), FloatReference.COLUMN, "block-start", "bar");
                cont3 = new PageFloatContinuation(float3, {});
                context.addPageFloat(float3);
                float4 = new PageFloat(dummyNodePosition(), FloatReference.COLUMN, "block-start", "baz");
                context.addPageFloat(float4);
                cont4 = new PageFloatContinuation(float4, {});
                context.floatsDeferredFromPrevious = [cont1, cont3, cont4];
                context.floatsDeferredToNext = [cont3];
            });

            it("Removes and forbids the last fragment whose anchor have not appeared", function() {
                context.isAnchorAlreadyAppeared.and.returnValue(false);
                context.finish();

                expect(context.removePageFloatFragment).toHaveBeenCalledWith(fragment2);
                expect(context.removePageFloatFragment).not.toHaveBeenCalledWith(fragment1);
                expect(context.isForbidden(float2)).toBe(true);
                expect(context.isForbidden(float1)).not.toBe(true);
                expect(context.floatsDeferredToNext).toEqual([cont3]);
            });

            it("Removes the last fragment whose anchor have not appeared", function() {
                context.isAnchorAlreadyAppeared.and.callFake(function(floatId) {
                    return floatId === float2.getId();
                });
                context.finish();

                expect(context.removePageFloatFragment).toHaveBeenCalledWith(fragment1);
                expect(context.removePageFloatFragment).not.toHaveBeenCalledWith(fragment2);
                expect(context.isForbidden(float1)).toBe(true);
                expect(context.isForbidden(float2)).not.toBe(true);
                expect(context.floatsDeferredToNext).toEqual([cont3]);
            });

            it("Removes floats deferred to next fragmentainers if their anchors have not appeared", function() {
                var float5 = new PageFloat(dummyNodePosition(), FloatReference.COLUMN, "block-start", "aaa");
                context.addPageFloat(float5);
                var cont5 = new PageFloatContinuation(float5, {});
                context.floatsDeferredToNext = [cont3, cont5];
                context.isAnchorAlreadyAppeared.and.callFake(function(id) {
                    return id === float1.getId() || id === float2.getId();
                });
                context.finish();

                expect(context.removePageFloatFragment).not.toHaveBeenCalled();
                expect(context.floatsDeferredToNext).toEqual([cont3, cont4]);
            });

            it("Transfer floats deferred from previous fragmentainers and not laid out yet if all anchor view nodes of the float fragments have already appeared", function() {
                expect(context.findPageFloatFragment(float1)).toBe(fragment1);
                expect(context.findPageFloatFragment(float2)).toBe(fragment2);

                context.isAnchorAlreadyAppeared.and.returnValue(true);
                context.finish();

                expect(context.removePageFloatFragment).not.toHaveBeenCalled();
                expect(context.floatsDeferredToNext).toEqual([cont3, cont4]);
            });
        });

        describe("#invalidate", function() {
            var container, context;
            beforeEach(function() {
                container = {
                    clear: jasmine.createSpy("clear"),
                    element: {}
                };
                context = new PageFloatLayoutContext(rootContext, FloatReference.PAGE, container, null,
                    null, null, null);
            });

            it("invalidate the container", function() {
                expect(context.isInvalidated()).toBe(false);

                context.invalidate();

                expect(container.clear).toHaveBeenCalled();
                expect(context.isInvalidated()).toBe(true);
            });

            it("removes all registered anchor view nodes", function() {
                var float = new PageFloat(dummyNodePosition(), FloatReference.PAGE, "block-start", "body");
                context.addPageFloat(float);
                var anchorViewNode = {};
                context.registerPageFloatAnchor(float, anchorViewNode);

                expect(context.floatAnchors[float.getId()]).toBe(anchorViewNode);

                context.invalidate();

                expect(Object.keys(context.floatAnchors).length).toBe(0);
            });

            it("clears children", function() {
                var child = new PageFloatLayoutContext(context, FloatReference.REGION, null, null,
                    null, null, null);
                child.container = {
                    clear: jasmine.createSpy("clear"),
                    element: container.element
                };
                var fragment = {
                    area: { element: { parentNode: { removeChild: jasmine.createSpy("removeChild") }}}
                };
                child.floatFragments.push(fragment);

                expect(context.children).toEqual([child]);

                context.invalidate();

                expect(fragment.area.element.parentNode.removeChild).toHaveBeenCalledWith(fragment.area.element);
                expect(context.children).toEqual([]);
            });
        });

        describe("#isInvalidated", function() {
            function container() {
                return { clear: jasmine.createSpy("clear") };
            }

            it("returns true if one of its ancestors is invalidated", function() {
                var pageContext = new PageFloatLayoutContext(rootContext, FloatReference.PAGE,
                    container(), null, null, null, null);
                var regionContext = new PageFloatLayoutContext(pageContext, FloatReference.REGION,
                    container(), null, null, null, null);
                var columnContext = new PageFloatLayoutContext(regionContext, FloatReference.COLUMN,
                    container(), null, null, null, null);

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

        describe("#getFloatFragmentExclusions", function() {
            it("returns an array of exclusions of PageFloatFragments", function() {
                var context = new PageFloatLayoutContext(rootContext, FloatReference.COLUMN, null,
                    null, null, null, null);

                var float1 = new PageFloat(dummyNodePosition(), FloatReference.COLUMN, "block-start", "body");
                context.addPageFloat(float1);
                var shape1 = { foo: "shape1" };
                var area1 = { getOuterShape: jasmine.createSpy("getOuterShape").and.returnValue(shape1) };
                var fragment1 = new PageFloatFragment(PageFloatList.fromFloat(float1), {}, area1);
                context.addPageFloatFragment(fragment1);

                var float2 = new PageFloat(dummyNodePosition(), FloatReference.COLUMN, "block-start", "body");
                context.addPageFloat(float2);
                var shape2 = { foo: "shape2" };
                var area2 = { getOuterShape: jasmine.createSpy("getOuterShape").and.returnValue(shape2) };
                var fragment2 = new PageFloatFragment(PageFloatList.fromFloat(float2), {}, area2);
                context.addPageFloatFragment(fragment2);

                expect(context.getFloatFragmentExclusions()).toEqual([shape1, shape2]);
            });

            it("returns an array of exclusions of PageFloatFragments, including those registered in the parent context", function() {
                var regionContext = new PageFloatLayoutContext(rootContext, FloatReference.REGION,
                    null, null, null, null, null);
                var columnContext = new PageFloatLayoutContext(regionContext, FloatReference.COLUMN,
                    null, null, null, null, null);

                var float1 = new PageFloat(dummyNodePosition(), FloatReference.REGION, "block-start", "body");
                regionContext.addPageFloat(float1);
                var shape1 = { foo: "shape1" };
                var area1 = { getOuterShape: jasmine.createSpy("getOuterShape").and.returnValue(shape1) };
                var fragment1 = new PageFloatFragment(PageFloatList.fromFloat(float1), {}, area1);
                regionContext.addPageFloatFragment(fragment1);

                var float2 = new PageFloat(dummyNodePosition(), FloatReference.COLUMN, "block-start", "body");
                columnContext.addPageFloat(float2);
                var shape2 = { foo: "shape2" };
                var area2 = { getOuterShape: jasmine.createSpy("getOuterShape").and.returnValue(shape2) };
                var fragment2 = new PageFloatFragment(PageFloatList.fromFloat(float2), {}, area2);
                columnContext.addPageFloatFragment(fragment2);

                expect(columnContext.getFloatFragmentExclusions()).toEqual([shape1, shape2]);
            });
        });
    });
});
