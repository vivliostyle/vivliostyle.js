describe("pagefloat", function() {
    var module = vivliostyle.pagefloat;
    var FloatReference = module.FloatReference;
    var PageFloat = module.PageFloat;
    var PageFloatStore = module.PageFloatStore;
    var PageFloatFragment = module.PageFloatFragment;
    var PageFloatLayoutContext = module.PageFloatLayoutContext;

    describe("PageFloatStore", function() {
        var store;
        beforeEach(function() {
            store = new PageFloatStore();
        });

        describe("#addPageFloat", function() {
            it("adds a PageFloat", function() {
                var sourceNode = {};
                var float = new PageFloat(sourceNode, FloatReference.COLUMN, "block-start");

                expect(store.floats).not.toContain(float);

                store.addPageFloat(float);

                expect(store.floats).toContain(float);
            });

            it("assign a new ID to the PageFloat", function() {
                var float = new PageFloat({}, FloatReference.COLUMN, "block-start");

                expect(float.id).toBe(null);

                store.addPageFloat(float);

                expect(float.id).toBe("pf0");

                float = new PageFloat({}, FloatReference.COLUMN, "block-start");
                store.addPageFloat(float);

                expect(float.id).toBe("pf1");
            });

            it("throws an error if a float with the same source node is already registered", function() {
                var sourceNode = {};
                var float = new PageFloat(sourceNode, FloatReference.COLUMN, "block-start");
                store.addPageFloat(float);

                expect(store.floats).toContain(float);

                float = new PageFloat(sourceNode, FloatReference.COLUMN, "block-start");

                expect(function() { store.addPageFloat(float); }).toThrow();
            });
        });

        describe("#findPageFloatBySourceNode", function() {
            it("returns a registered page float associated with the specified source node", function() {
                var sourceNode = {};
                var float = new PageFloat(sourceNode, FloatReference.COLUMN, "block-start");
                store.addPageFloat(float);

                expect(store.findPageFloatBySourceNode(sourceNode)).toBe(float);
            });

            it("returns null when no page float with the specified source node is registered", function() {
                var sourceNode = {};
                var float = new PageFloat(sourceNode, FloatReference.COLUMN, "block-start");
                store.addPageFloat(float);

                expect(store.findPageFloatBySourceNode({})).toBe(null);
            });
        });
    });

    describe("PageFloatLayoutContext", function() {
        var rootContext;
        beforeEach(function() {
            rootContext = new PageFloatLayoutContext(null, null, null, null, null);
        });

        describe("constructor", function() {
            it("uses writing-mode and direction values of the parent if they are not specified", function() {
                var context = new PageFloatLayoutContext(rootContext, FloatReference.PAGE, null,
                    adapt.css.ident.vertical_rl, adapt.css.ident.rtl);

                expect(context.writingMode).toBe(adapt.css.ident.vertical_rl);
                expect(context.direction).toBe(adapt.css.ident.rtl);

                context = new PageFloatLayoutContext(context, FloatReference.REGION, null, null, null);

                expect(context.writingMode).toBe(adapt.css.ident.vertical_rl);
                expect(context.direction).toBe(adapt.css.ident.rtl);
            });
        });

        describe("#findPageFloatBySourceNode", function() {
            it("returns a page float registered by PageFloatLayoutContext with the same root PageFloatLayoutContext", function() {
                var context1 = new PageFloatLayoutContext(rootContext, FloatReference.PAGE, null, null, null);
                var context2 = new PageFloatLayoutContext(rootContext, FloatReference.PAGE, null, null, null);
                var sourceNode1 = {};
                var float1 = new PageFloat(sourceNode1, FloatReference.PAGE, "block-start");
                context1.addPageFloat(float1);
                var sourceNode2 = {};
                var float2 = new PageFloat(sourceNode2, FloatReference.PAGE, "block-start");
                context2.addPageFloat(float2);

                expect(context1.findPageFloatBySourceNode(sourceNode1)).toBe(float1);
                expect(context1.findPageFloatBySourceNode(sourceNode2)).toBe(float2);
                expect(context2.findPageFloatBySourceNode(sourceNode1)).toBe(float1);
                expect(context2.findPageFloatBySourceNode(sourceNode2)).toBe(float2);
            });
        });

        describe("#forbid, #isForbidden", function() {
            it("returns if the page float is forbidden in the context by #forbid method", function() {
                var context = new PageFloatLayoutContext(rootContext, FloatReference.PAGE, null, null, null);
                var float = new PageFloat({}, FloatReference.PAGE, "block-start");
                context.addPageFloat(float);

                expect(context.isForbidden(float)).toBe(false);

                context.forbid(float);

                expect(context.isForbidden(float)).toBe(true);
            });

            it("returns true if the page float is forbidden by one of ancestors of the context", function() {
                var pageContext = new PageFloatLayoutContext(rootContext, FloatReference.PAGE, null, null, null);
                var regionContext = new PageFloatLayoutContext(pageContext, FloatReference.REGION, null, null, null);
                var columnContext = new PageFloatLayoutContext(regionContext, FloatReference.COLUMN, null, null, null);

                var float = new PageFloat({}, FloatReference.COLUMN, "block-start");
                columnContext.addPageFloat(float);
                columnContext.forbid(float);

                expect(columnContext.isForbidden(float)).toBe(true);
                expect(function() { regionContext.isForbidden(float); }).toThrow();

                columnContext = new PageFloatLayoutContext(regionContext, FloatReference.COLUMN, null, null, null);

                expect(columnContext.isForbidden(float)).toBe(false);

                float = new PageFloat({}, FloatReference.REGION, "block-start");
                columnContext.addPageFloat(float);
                columnContext.forbid(float);

                expect(columnContext.isForbidden(float)).toBe(true);
                expect(regionContext.isForbidden(float)).toBe(true);
                expect(function() { pageContext.isForbidden(float); }).toThrow();

                columnContext = new PageFloatLayoutContext(regionContext, FloatReference.COLUMN, null, null, null);

                expect(columnContext.isForbidden(float)).toBe(true);

                regionContext = new PageFloatLayoutContext(pageContext, FloatReference.REGION, null, null, null);
                columnContext = new PageFloatLayoutContext(regionContext, FloatReference.COLUMN, null, null, null);

                expect(columnContext.isForbidden(float)).toBe(false);
                expect(regionContext.isForbidden(float)).toBe(false);
                expect(function() { pageContext.isForbidden(float); }).toThrow();

                float = new PageFloat({}, FloatReference.PAGE, "block-start");
                columnContext.addPageFloat(float);
                columnContext.forbid(float);

                expect(columnContext.isForbidden(float)).toBe(true);
                expect(regionContext.isForbidden(float)).toBe(true);
                expect(pageContext.isForbidden(float)).toBe(true);

                columnContext = new PageFloatLayoutContext(regionContext, FloatReference.COLUMN, null, null, null);

                expect(columnContext.isForbidden(float)).toBe(true);

                regionContext = new PageFloatLayoutContext(pageContext, FloatReference.REGION, null, null, null);
                columnContext = new PageFloatLayoutContext(regionContext, FloatReference.COLUMN, null, null, null);

                expect(columnContext.isForbidden(float)).toBe(true);
                expect(regionContext.isForbidden(float)).toBe(true);

                pageContext = new PageFloatLayoutContext(rootContext, FloatReference.PAGE, null, null, null);
                regionContext = new PageFloatLayoutContext(pageContext, FloatReference.REGION, null, null, null);
                columnContext = new PageFloatLayoutContext(regionContext, FloatReference.COLUMN, null, null, null);

                expect(columnContext.isForbidden(float)).toBe(false);
                expect(regionContext.isForbidden(float)).toBe(false);
                expect(pageContext.isForbidden(float)).toBe(false);
            });
        });

        describe("#addPageFloatFragment, #findPageFloatFragment", function() {
            var area;
            beforeEach(function() {
                area = { getOuterShape: jasmine.createSpy("getOuterShape") };
            });

            it("A PageFloatFragment added by #addPageFloatFragment can be retrieved by #findPageFloatFragment", function() {
                var context = new PageFloatLayoutContext(rootContext, FloatReference.PAGE, null, null, null);
                var float = new PageFloat({}, FloatReference.PAGE, "block-start");
                context.addPageFloat(float);
                var fragment = new PageFloatFragment(float, area);

                expect(context.findPageFloatFragment(float)).toBe(null);

                context.addPageFloatFragment(fragment);

                expect(context.findPageFloatFragment(float)).toBe(fragment);
            });

            it("A PageFloatFragment stored in one of the ancestors can be retrieved by #findPageFloatFragment", function() {
                var pageContext = new PageFloatLayoutContext(rootContext, FloatReference.PAGE, null, null, null);
                var regionContext = new PageFloatLayoutContext(pageContext, FloatReference.REGION, null, null, null);
                var columnContext = new PageFloatLayoutContext(regionContext, FloatReference.COLUMN, null, null, null);
                var float = new PageFloat({}, FloatReference.REGION, "block-start");
                columnContext.addPageFloat(float);
                var fragment = new PageFloatFragment(float, area);
                columnContext.addPageFloatFragment(fragment);
                columnContext = new PageFloatLayoutContext(regionContext, FloatReference.COLUMN, null, null, null);

                expect(columnContext.findPageFloatFragment(float)).toBe(fragment);
                expect(regionContext.findPageFloatFragment(float)).toBe(fragment);
                expect(function() { pageContext.findPageFloatFragment(float); }).toThrow();

                float = new PageFloat({}, FloatReference.PAGE, "block-start");
                columnContext.addPageFloat(float);
                fragment = new PageFloatFragment(float, area);
                columnContext.addPageFloatFragment(fragment);
                regionContext = new PageFloatLayoutContext(pageContext, FloatReference.REGION, null, null, null);
                columnContext = new PageFloatLayoutContext(regionContext, FloatReference.COLUMN, null, null, null);

                expect(columnContext.findPageFloatFragment(float)).toBe(fragment);
                expect(regionContext.findPageFloatFragment(float)).toBe(fragment);
                expect(pageContext.findPageFloatFragment(float)).toBe(fragment);
            });

            it("When a PageFloatFragment is added by #addPageFloatFragment, the corresponding PageFloatLayoutContext is invalidated", function() {
                var pageContext, regionContext, columnContext;
                function reset() {
                    pageContext = new PageFloatLayoutContext(rootContext, FloatReference.PAGE, null, null, null);
                    regionContext = new PageFloatLayoutContext(pageContext, FloatReference.REGION, null, null, null);
                    columnContext = new PageFloatLayoutContext(regionContext, FloatReference.COLUMN, null, null, null);
                    [pageContext, regionContext, columnContext].forEach(function(context) {
                        spyOn(context, "invalidate");
                        spyOn(context, "addPageFloatFragment").and.callThrough();
                    });
                }

                reset();
                var float = new PageFloat({}, FloatReference.COLUMN, "block-start");
                columnContext.addPageFloat(float);
                var fragment = new PageFloatFragment(float, area);
                columnContext.addPageFloatFragment(fragment);

                expect(columnContext.invalidate).toHaveBeenCalled();
                expect(regionContext.addPageFloatFragment).not.toHaveBeenCalled();

                reset();
                float = new PageFloat({}, FloatReference.REGION, "block-start");
                columnContext.addPageFloat(float);
                fragment = new PageFloatFragment(float, area);
                columnContext.addPageFloatFragment(fragment);

                expect(columnContext.invalidate).toHaveBeenCalled();
                expect(regionContext.addPageFloatFragment).toHaveBeenCalledWith(fragment);
                expect(regionContext.invalidate).toHaveBeenCalled();
                expect(pageContext.addPageFloatFragment).not.toHaveBeenCalledWith(fragment);

                reset();
                float = new PageFloat({}, FloatReference.PAGE, "block-start");
                columnContext.addPageFloat(float);
                fragment = new PageFloatFragment(float, area);
                columnContext.addPageFloatFragment(fragment);

                expect(columnContext.invalidate).toHaveBeenCalled();
                expect(regionContext.addPageFloatFragment).toHaveBeenCalledWith(fragment);
                expect(regionContext.invalidate).toHaveBeenCalled();
                expect(pageContext.addPageFloatFragment).toHaveBeenCalledWith(fragment);
                expect(pageContext.invalidate).toHaveBeenCalled();
            });
        });

        describe("#removePageFloatFragment", function() {
            var container, context, float, area, fragment;
            beforeEach(function() {
                container = {
                    invalidate: jasmine.createSpy("invalidate")
                };
                context = new PageFloatLayoutContext(rootContext, FloatReference.PAGE, container, null, null);
                float = new PageFloat({}, FloatReference.PAGE, "block-start");
                context.addPageFloat(float);
                area = {
                    element: {
                        parentNode: {
                            removeChild: jasmine.createSpy("removeChild")
                        }
                    }
                };
                fragment = new PageFloatFragment(float, area);
                context.addPageFloatFragment(fragment);
                container.invalidate.calls.reset();
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

            it("invalidates the page float container", function() {
                context.removePageFloatFragment(fragment);

                expect(container.invalidate).toHaveBeenCalled();
            });
        });

        describe("#registerPageFloatAnchor", function() {
            var pageContext, regionContext, columnContext, float, anchorViewNode;
            beforeEach(function() {
                pageContext = new PageFloatLayoutContext(rootContext, FloatReference.PAGE, null, null, null);
                regionContext = new PageFloatLayoutContext(pageContext, FloatReference.REGION, null, null, null);
                columnContext = new PageFloatLayoutContext(regionContext, FloatReference.COLUMN, null, null, null);
                anchorViewNode = {};
            });

            it("stores the anchor view node", function() {
                float = new PageFloat({}, FloatReference.COLUMN, "block-start");
                columnContext.addPageFloat(float);
                columnContext.registerPageFloatAnchor(float, anchorViewNode);

                expect(columnContext.floatAnchors[float.getId()]).toBe(anchorViewNode);
            });

            it("stores the anchor view node to the corresponding context", function() {
                float = new PageFloat({}, FloatReference.REGION, "block-start");
                columnContext.addPageFloat(float);
                columnContext.registerPageFloatAnchor(float, anchorViewNode);

                expect(columnContext.floatAnchors[float.getId()]).toBeUndefined();
                expect(regionContext.floatAnchors[float.getId()]).toBe(anchorViewNode);

                float = new PageFloat({}, FloatReference.PAGE, "block-start");
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
                context = new PageFloatLayoutContext(rootContext, FloatReference.COLUMN, container, null, null);
                float = new PageFloat({}, FloatReference.COLUMN, "block-start");
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
        });

        describe("#finish", function() {
            var context, float1, fragment1, float2, fragment2;
            beforeEach(function() {
                context = new PageFloatLayoutContext(rootContext, FloatReference.COLUMN, null, null, null);
                spyOn(context, "isAnchorAlreadyAppeared");
                spyOn(context, "removePageFloatFragment");
                float1 = new PageFloat({}, FloatReference.COLUMN, "block-start");
                context.addPageFloat(float1);
                fragment1 = new PageFloatFragment(float1, {});
                context.addPageFloatFragment(fragment1);
                float2 = new PageFloat({}, FloatReference.COLUMN, "block-start");
                context.addPageFloat(float2);
                fragment2 = new PageFloatFragment(float2, {});
                context.addPageFloatFragment(fragment2);
            });

            it("do nothing if all anchor view nodes of the float fragments have already appeared", function() {
                expect(context.findPageFloatFragment(float1)).toBe(fragment1);
                expect(context.findPageFloatFragment(float2)).toBe(fragment2);

                context.isAnchorAlreadyAppeared.and.returnValue(true);
                context.finish();

                expect(context.removePageFloatFragment).not.toHaveBeenCalled();
            });

            it("Removes and forbids the last fragment whose anchor have not appeared", function() {
                context.isAnchorAlreadyAppeared.and.returnValue(false);
                context.finish();

                expect(context.removePageFloatFragment).toHaveBeenCalledWith(fragment2);
                expect(context.removePageFloatFragment).not.toHaveBeenCalledWith(fragment1);
                expect(context.isForbidden(float2)).toBe(true);
                expect(context.isForbidden(float1)).not.toBe(true);
            });

            it("Removes the last fragment whose anchor have not appeared", function() {
                context.isAnchorAlreadyAppeared.and.callFake(function(f) {
                    return f === fragment2.pageFloatId;
                });
                context.finish();

                expect(context.removePageFloatFragment).toHaveBeenCalledWith(fragment1);
                expect(context.removePageFloatFragment).not.toHaveBeenCalledWith(fragment2);
                expect(context.isForbidden(float1)).toBe(true);
                expect(context.isForbidden(float2)).not.toBe(true);
            });
        });

        describe("#invalidate", function() {
            var container, context;
            beforeEach(function() {
                container = { invalidate: jasmine.createSpy("invalidate") };
                context = new PageFloatLayoutContext(rootContext, FloatReference.PAGE, container, null, null);
            });

            it("invalidate the container", function() {
                context.invalidate();

                expect(container.invalidate).toHaveBeenCalled();
            });

            it("removes all registered anchor view nodes", function() {
                var float = new PageFloat({}, FloatReference.PAGE, "block-start");
                context.addPageFloat(float);
                var anchorViewNode = {};
                context.registerPageFloatAnchor(float, anchorViewNode);

                expect(context.floatAnchors[float.getId()]).toBe(anchorViewNode);

                context.invalidate();

                expect(Object.keys(context.floatAnchors).length).toBe(0);
            });
        });

        describe("#getFloatFragmentExclusions", function() {
            it("returns an array of exclusions of PageFloatFragments", function() {
                var context = new PageFloatLayoutContext(rootContext, FloatReference.COLUMN, null, null, null);

                var float1 = new PageFloat({}, FloatReference.COLUMN, "block-start");
                context.addPageFloat(float1);
                var shape1 = { foo: "shape1" };
                var area1 = { getOuterShape: jasmine.createSpy("getOuterShape").and.returnValue(shape1) };
                var fragment1 = new PageFloatFragment(float1, area1);
                context.addPageFloatFragment(fragment1);

                var float2 = new PageFloat({}, FloatReference.COLUMN, "block-start");
                context.addPageFloat(float2);
                var shape2 = { foo: "shape2" };
                var area2 = { getOuterShape: jasmine.createSpy("getOuterShape").and.returnValue(shape2) };
                var fragment2 = new PageFloatFragment(float2, area2);
                context.addPageFloatFragment(fragment2);

                expect(context.getFloatFragmentExclusions()).toEqual([shape1, shape2]);
            });

            it("returns an array of exclusions of PageFloatFragments, including those registered in the parent context", function() {
                var regionContext = new PageFloatLayoutContext(rootContext, FloatReference.REGION, null, null, null);
                var columnContext = new PageFloatLayoutContext(regionContext, FloatReference.COLUMN, null, null, null);

                var float1 = new PageFloat({}, FloatReference.REGION, "block-start");
                regionContext.addPageFloat(float1);
                var shape1 = { foo: "shape1" };
                var area1 = { getOuterShape: jasmine.createSpy("getOuterShape").and.returnValue(shape1) };
                var fragment1 = new PageFloatFragment(float1, area1);
                regionContext.addPageFloatFragment(fragment1);

                var float2 = new PageFloat({}, FloatReference.COLUMN, "block-start");
                columnContext.addPageFloat(float2);
                var shape2 = { foo: "shape2" };
                var area2 = { getOuterShape: jasmine.createSpy("getOuterShape").and.returnValue(shape2) };
                var fragment2 = new PageFloatFragment(float2, area2);
                columnContext.addPageFloatFragment(fragment2);

                expect(columnContext.getFloatFragmentExclusions()).toEqual([shape1, shape2]);
            });
        });
    });
});
