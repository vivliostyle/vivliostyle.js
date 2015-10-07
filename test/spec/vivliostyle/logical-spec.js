describe("logical", function() {
    "use strict";

    var l = vivliostyle.logical;

    describe("toPhysical", function() {
        it("converts logical properties to physical properties (horizontal-tb)", function() {
            expect(l.toPhysical("inline-start", "horizontal-tb")).toBe("left");
            expect(l.toPhysical("inline-end", "horizontal-tb")).toBe("right");
            expect(l.toPhysical("block-start", "horizontal-tb")).toBe("top");
            expect(l.toPhysical("block-end", "horizontal-tb")).toBe("bottom");
            expect(l.toPhysical("border-inline-start-width", "horizontal-tb")).toBe("border-left-width");
            expect(l.toPhysical("border-inline-end-width", "horizontal-tb")).toBe("border-right-width");
            expect(l.toPhysical("border-block-start-width", "horizontal-tb")).toBe("border-top-width");
            expect(l.toPhysical("border-block-end-width", "horizontal-tb")).toBe("border-bottom-width");
        });

        it("converts logical properties to physical properties (vertical-rl)", function() {
            expect(l.toPhysical("inline-start", "vertical-rl")).toBe("top");
            expect(l.toPhysical("inline-end", "vertical-rl")).toBe("bottom");
            expect(l.toPhysical("block-start", "vertical-rl")).toBe("right");
            expect(l.toPhysical("block-end", "vertical-rl")).toBe("left");
            expect(l.toPhysical("border-inline-start-width", "vertical-rl")).toBe("border-top-width");
            expect(l.toPhysical("border-inline-end-width", "vertical-rl")).toBe("border-bottom-width");
            expect(l.toPhysical("border-block-start-width", "vertical-rl")).toBe("border-right-width");
            expect(l.toPhysical("border-block-end-width", "vertical-rl")).toBe("border-left-width");
        });

        it("converts logical properties to physical properties (vertical-lr)", function() {
            expect(l.toPhysical("inline-start", "vertical-lr")).toBe("top");
            expect(l.toPhysical("inline-end", "vertical-lr")).toBe("bottom");
            expect(l.toPhysical("block-start", "vertical-lr")).toBe("left");
            expect(l.toPhysical("block-end", "vertical-lr")).toBe("right");
            expect(l.toPhysical("border-inline-start-width", "vertical-lr")).toBe("border-top-width");
            expect(l.toPhysical("border-inline-end-width", "vertical-lr")).toBe("border-bottom-width");
            expect(l.toPhysical("border-block-start-width", "vertical-lr")).toBe("border-left-width");
            expect(l.toPhysical("border-block-end-width", "vertical-lr")).toBe("border-right-width");
        });

        it("returns original properties when they are already physical", function() {
            expect(l.toPhysical("left", "vertical-rl")).toBe("left");
            expect(l.toPhysical("right", "vertical-rl")).toBe("right");
            expect(l.toPhysical("top", "vertical-rl")).toBe("top");
            expect(l.toPhysical("bottom", "vertical-rl")).toBe("bottom");
        });
    });

    describe("toLogical", function() {
        it("converts physical properties to logical properties (horizontal-tb)", function() {
            expect(l.toLogical("left", "horizontal-tb")).toBe("inline-start");
            expect(l.toLogical("right", "horizontal-tb")).toBe("inline-end");
            expect(l.toLogical("top", "horizontal-tb")).toBe("block-start");
            expect(l.toLogical("bottom", "horizontal-tb")).toBe("block-end");
            expect(l.toLogical("border-left-width", "horizontal-tb")).toBe("border-inline-start-width");
            expect(l.toLogical("border-right-width", "horizontal-tb")).toBe("border-inline-end-width");
            expect(l.toLogical("border-top-width", "horizontal-tb")).toBe("border-block-start-width");
            expect(l.toLogical("border-bottom-width", "horizontal-tb")).toBe("border-block-end-width");
        });

        it("converts physical properties to logical properties (vertical-rl)", function() {
            expect(l.toLogical("left", "vertical-rl")).toBe("block-end");
            expect(l.toLogical("right", "vertical-rl")).toBe("block-start");
            expect(l.toLogical("top", "vertical-rl")).toBe("inline-start");
            expect(l.toLogical("bottom", "vertical-rl")).toBe("inline-end");
            expect(l.toLogical("border-left-width", "vertical-rl")).toBe("border-block-end-width");
            expect(l.toLogical("border-right-width", "vertical-rl")).toBe("border-block-start-width");
            expect(l.toLogical("border-top-width", "vertical-rl")).toBe("border-inline-start-width");
            expect(l.toLogical("border-bottom-width", "vertical-rl")).toBe("border-inline-end-width");
        });

        it("converts logical properties to physical properties (vertical-lr)", function() {
            expect(l.toLogical("left", "vertical-lr")).toBe("block-start");
            expect(l.toLogical("right", "vertical-lr")).toBe("block-end");
            expect(l.toLogical("top", "vertical-lr")).toBe("inline-start");
            expect(l.toLogical("bottom", "vertical-lr")).toBe("inline-end");
            expect(l.toLogical("border-left-width", "vertical-lr")).toBe("border-block-start-width");
            expect(l.toLogical("border-right-width", "vertical-lr")).toBe("border-block-end-width");
            expect(l.toLogical("border-top-width", "vertical-lr")).toBe("border-inline-start-width");
            expect(l.toLogical("border-bottom-width", "vertical-lr")).toBe("border-inline-end-width");
        });

        it("returns original properties when they are already logical", function() {
            expect(l.toLogical("inline-start", "vertical-rl")).toBe("inline-start");
            expect(l.toLogical("inline-end", "vertical-rl")).toBe("inline-end");
            expect(l.toLogical("block-start", "vertical-rl")).toBe("block-start");
            expect(l.toLogical("block-end", "vertical-rl")).toBe("block-end");
        });
    });
});
