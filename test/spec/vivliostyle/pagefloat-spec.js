describe("pagefloat", function() {
    var module = vivliostyle.pagefloat;
    var PageFloat = module.PageFloat;
    var PageFloatStore = module.PageFloatStore;
    var PageFloatLayoutContext = module.PageFloatLayoutContext;

    describe("PageFloatStore", function() {
        var store;
        beforeEach(function() {
            store = new PageFloatStore();
        });

        describe("#addPageFloat", function() {
            it("adds a PageFloat", function() {
                var sourceNode = {};
                var float = new PageFloat(sourceNode);

                expect(store.floats).not.toContain(float);

                store.addPageFloat(float);

                expect(store.floats).toContain(float);
            });

            it("throws an error if a float with the same source node is already registered", function() {
                var sourceNode = {};
                var float = new PageFloat(sourceNode);
                store.addPageFloat(float);

                expect(store.floats).toContain(float);

                float = new PageFloat(sourceNode);

                expect(function() { store.addPageFloat(float); }).toThrow();
            });
        });

        describe("#findPageFloatBySourceNode", function() {
            it("returns a registered page float associated with the specified source node", function() {
                var sourceNode = {};
                var float = new PageFloat(sourceNode);
                store.addPageFloat(float);

                expect(store.findPageFloatBySourceNode(sourceNode)).toBe(float);
            });

            it("returns null when no page float with the specified source node is registered", function() {
                var sourceNode = {};
                var float = new PageFloat(sourceNode);
                store.addPageFloat(float);

                expect(store.findPageFloatBySourceNode({})).toBe(null);
            });
        });
    });

    describe("PageFloatLayoutContext", function() {
        var rootContext;
        beforeEach(function() {
            rootContext = new PageFloatLayoutContext(null);
        });

        describe("#findPageFloatBySourceNode", function() {
            it("returns a page float registered by PageFloatLayoutContext with the same root PageFloatLayoutContext", function() {
                var context1 = new PageFloatLayoutContext(rootContext);
                var context2 = new PageFloatLayoutContext(rootContext);
                var sourceNode1 = {};
                var float1 = new PageFloat(sourceNode1);
                context1.addPageFloat(float1);
                var sourceNode2 = {};
                var float2 = new PageFloat(sourceNode2);
                context2.addPageFloat(float2);

                expect(context1.findPageFloatBySourceNode(sourceNode1)).toBe(float1);
                expect(context1.findPageFloatBySourceNode(sourceNode2)).toBe(float2);
                expect(context2.findPageFloatBySourceNode(sourceNode1)).toBe(float1);
                expect(context2.findPageFloatBySourceNode(sourceNode2)).toBe(float2);
            });
        });
    });
});
