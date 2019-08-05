/**
 * Copyright 2017 Trim-marks Inc.
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

import * as vivliostyle_logical from "../../../src/ts/vivliostyle/logical";

describe("logical", function() {
    "use strict";

    var l = vivliostyle_logical;

    describe("toPhysical", function() {
        it("converts logical properties to physical properties (horizontal-tb, ltr)", function() {
            expect(l.toPhysical("inline-start", "horizontal-tb")).toBe("left");
            expect(l.toPhysical("inline-end", "horizontal-tb")).toBe("right");
            expect(l.toPhysical("block-start", "horizontal-tb")).toBe("top");
            expect(l.toPhysical("block-end", "horizontal-tb")).toBe("bottom");
            expect(l.toPhysical("border-inline-start-width", "horizontal-tb")).toBe("border-left-width");
            expect(l.toPhysical("border-inline-end-width", "horizontal-tb")).toBe("border-right-width");
            expect(l.toPhysical("border-block-start-width", "horizontal-tb")).toBe("border-top-width");
            expect(l.toPhysical("border-block-end-width", "horizontal-tb")).toBe("border-bottom-width");
            expect(l.toPhysical("inline-size", "horizontal-tb")).toBe("width");
            expect(l.toPhysical("block-size", "horizontal-tb")).toBe("height");
        });

        it("converts logical properties to physical properties (horizontal-tb, rtl)", function() {
            expect(l.toPhysical("inline-start", "horizontal-tb", "rtl")).toBe("right");
            expect(l.toPhysical("inline-end", "horizontal-tb", "rtl")).toBe("left");
            expect(l.toPhysical("block-start", "horizontal-tb", "rtl")).toBe("top");
            expect(l.toPhysical("block-end", "horizontal-tb", "rtl")).toBe("bottom");
            expect(l.toPhysical("border-inline-start-width", "horizontal-tb", "rtl")).toBe("border-right-width");
            expect(l.toPhysical("border-inline-end-width", "horizontal-tb", "rtl")).toBe("border-left-width");
            expect(l.toPhysical("border-block-start-width", "horizontal-tb", "rtl")).toBe("border-top-width");
            expect(l.toPhysical("border-block-end-width", "horizontal-tb", "rtl")).toBe("border-bottom-width");
        });

        it("converts logical properties to physical properties (vertical-rl, ltr)", function() {
            expect(l.toPhysical("inline-start", "vertical-rl")).toBe("top");
            expect(l.toPhysical("inline-end", "vertical-rl")).toBe("bottom");
            expect(l.toPhysical("block-start", "vertical-rl")).toBe("right");
            expect(l.toPhysical("block-end", "vertical-rl")).toBe("left");
            expect(l.toPhysical("border-inline-start-width", "vertical-rl")).toBe("border-top-width");
            expect(l.toPhysical("border-inline-end-width", "vertical-rl")).toBe("border-bottom-width");
            expect(l.toPhysical("border-block-start-width", "vertical-rl")).toBe("border-right-width");
            expect(l.toPhysical("border-block-end-width", "vertical-rl")).toBe("border-left-width");
            expect(l.toPhysical("inline-size", "vertical-rl")).toBe("height");
            expect(l.toPhysical("block-size", "vertical-rl")).toBe("width");
        });

        it("converts logical properties to physical properties (vertical-rl, rtl)", function() {
            expect(l.toPhysical("inline-start", "vertical-rl", "rtl")).toBe("bottom");
            expect(l.toPhysical("inline-end", "vertical-rl", "rtl")).toBe("top");
            expect(l.toPhysical("block-start", "vertical-rl", "rtl")).toBe("right");
            expect(l.toPhysical("block-end", "vertical-rl", "rtl")).toBe("left");
            expect(l.toPhysical("border-inline-start-width", "vertical-rl", "rtl")).toBe("border-bottom-width");
            expect(l.toPhysical("border-inline-end-width", "vertical-rl", "rtl")).toBe("border-top-width");
            expect(l.toPhysical("border-block-start-width", "vertical-rl", "rtl")).toBe("border-right-width");
            expect(l.toPhysical("border-block-end-width", "vertical-rl", "rtl")).toBe("border-left-width");
        });

        it("converts logical properties to physical properties (vertical-lr, ltr)", function() {
            expect(l.toPhysical("inline-start", "vertical-lr")).toBe("top");
            expect(l.toPhysical("inline-end", "vertical-lr")).toBe("bottom");
            expect(l.toPhysical("block-start", "vertical-lr")).toBe("left");
            expect(l.toPhysical("block-end", "vertical-lr")).toBe("right");
            expect(l.toPhysical("border-inline-start-width", "vertical-lr")).toBe("border-top-width");
            expect(l.toPhysical("border-inline-end-width", "vertical-lr")).toBe("border-bottom-width");
            expect(l.toPhysical("border-block-start-width", "vertical-lr")).toBe("border-left-width");
            expect(l.toPhysical("border-block-end-width", "vertical-lr")).toBe("border-right-width");
            expect(l.toPhysical("inline-size", "vertical-lr")).toBe("height");
            expect(l.toPhysical("block-size", "vertical-lr")).toBe("width");
        });

        it("converts logical properties to physical properties (vertical-lr, rtl)", function() {
            expect(l.toPhysical("inline-start", "vertical-lr", "rtl")).toBe("bottom");
            expect(l.toPhysical("inline-end", "vertical-lr", "rtl")).toBe("top");
            expect(l.toPhysical("block-start", "vertical-lr", "rtl")).toBe("left");
            expect(l.toPhysical("block-end", "vertical-lr", "rtl")).toBe("right");
            expect(l.toPhysical("border-inline-start-width", "vertical-lr", "rtl")).toBe("border-bottom-width");
            expect(l.toPhysical("border-inline-end-width", "vertical-lr", "rtl")).toBe("border-top-width");
            expect(l.toPhysical("border-block-start-width", "vertical-lr", "rtl")).toBe("border-left-width");
            expect(l.toPhysical("border-block-end-width", "vertical-lr", "rtl")).toBe("border-right-width");
        });

        it("returns original properties when they are already physical", function() {
            expect(l.toPhysical("left", "vertical-rl")).toBe("left");
            expect(l.toPhysical("right", "vertical-rl")).toBe("right");
            expect(l.toPhysical("top", "vertical-rl")).toBe("top");
            expect(l.toPhysical("bottom", "vertical-rl")).toBe("bottom");
        });
    });

    describe("toLogical", function() {
        it("converts physical properties to logical properties (horizontal-tb, ltr)", function() {
            expect(l.toLogical("left", "horizontal-tb")).toBe("inline-start");
            expect(l.toLogical("right", "horizontal-tb")).toBe("inline-end");
            expect(l.toLogical("top", "horizontal-tb")).toBe("block-start");
            expect(l.toLogical("bottom", "horizontal-tb")).toBe("block-end");
            expect(l.toLogical("border-left-width", "horizontal-tb")).toBe("border-inline-start-width");
            expect(l.toLogical("border-right-width", "horizontal-tb")).toBe("border-inline-end-width");
            expect(l.toLogical("border-top-width", "horizontal-tb")).toBe("border-block-start-width");
            expect(l.toLogical("border-bottom-width", "horizontal-tb")).toBe("border-block-end-width");
            expect(l.toLogical("width", "horizontal-tb")).toBe("inline-size");
            expect(l.toLogical("height", "horizontal-tb")).toBe("block-size");
        });

        it("converts physical properties to logical properties (horizontal-tb, rtl)", function() {
            expect(l.toLogical("left", "horizontal-tb", "rtl")).toBe("inline-end");
            expect(l.toLogical("right", "horizontal-tb", "rtl")).toBe("inline-start");
            expect(l.toLogical("top", "horizontal-tb", "rtl")).toBe("block-start");
            expect(l.toLogical("bottom", "horizontal-tb", "rtl")).toBe("block-end");
            expect(l.toLogical("border-left-width", "horizontal-tb", "rtl")).toBe("border-inline-end-width");
            expect(l.toLogical("border-right-width", "horizontal-tb", "rtl")).toBe("border-inline-start-width");
            expect(l.toLogical("border-top-width", "horizontal-tb", "rtl")).toBe("border-block-start-width");
            expect(l.toLogical("border-bottom-width", "horizontal-tb", "rtl")).toBe("border-block-end-width");
        });

        it("converts physical properties to logical properties (vertical-rl, ltr)", function() {
            expect(l.toLogical("left", "vertical-rl")).toBe("block-end");
            expect(l.toLogical("right", "vertical-rl")).toBe("block-start");
            expect(l.toLogical("top", "vertical-rl")).toBe("inline-start");
            expect(l.toLogical("bottom", "vertical-rl")).toBe("inline-end");
            expect(l.toLogical("border-left-width", "vertical-rl")).toBe("border-block-end-width");
            expect(l.toLogical("border-right-width", "vertical-rl")).toBe("border-block-start-width");
            expect(l.toLogical("border-top-width", "vertical-rl")).toBe("border-inline-start-width");
            expect(l.toLogical("border-bottom-width", "vertical-rl")).toBe("border-inline-end-width");
            expect(l.toLogical("width", "vertical-rl")).toBe("block-size");
            expect(l.toLogical("height", "vertical-rl")).toBe("inline-size");
        });

        it("converts physical properties to logical properties (vertical-rl, rtl)", function() {
            expect(l.toLogical("left", "vertical-rl", "rtl")).toBe("block-end");
            expect(l.toLogical("right", "vertical-rl", "rtl")).toBe("block-start");
            expect(l.toLogical("top", "vertical-rl", "rtl")).toBe("inline-end");
            expect(l.toLogical("bottom", "vertical-rl", "rtl")).toBe("inline-start");
            expect(l.toLogical("border-left-width", "vertical-rl", "rtl")).toBe("border-block-end-width");
            expect(l.toLogical("border-right-width", "vertical-rl", "rtl")).toBe("border-block-start-width");
            expect(l.toLogical("border-top-width", "vertical-rl", "rtl")).toBe("border-inline-end-width");
            expect(l.toLogical("border-bottom-width", "vertical-rl", "rtl")).toBe("border-inline-start-width");
        });

        it("converts logical properties to physical properties (vertical-lr, ltr)", function() {
            expect(l.toLogical("left", "vertical-lr")).toBe("block-start");
            expect(l.toLogical("right", "vertical-lr")).toBe("block-end");
            expect(l.toLogical("top", "vertical-lr")).toBe("inline-start");
            expect(l.toLogical("bottom", "vertical-lr")).toBe("inline-end");
            expect(l.toLogical("border-left-width", "vertical-lr")).toBe("border-block-start-width");
            expect(l.toLogical("border-right-width", "vertical-lr")).toBe("border-block-end-width");
            expect(l.toLogical("border-top-width", "vertical-lr")).toBe("border-inline-start-width");
            expect(l.toLogical("border-bottom-width", "vertical-lr")).toBe("border-inline-end-width");
            expect(l.toLogical("width", "vertical-lr")).toBe("block-size");
            expect(l.toLogical("height", "vertical-lr")).toBe("inline-size");
        });

        it("converts logical properties to physical properties (vertical-lr, rtl)", function() {
            expect(l.toLogical("left", "vertical-lr", "rtl")).toBe("block-start");
            expect(l.toLogical("right", "vertical-lr", "rtl")).toBe("block-end");
            expect(l.toLogical("top", "vertical-lr", "rtl")).toBe("inline-end");
            expect(l.toLogical("bottom", "vertical-lr", "rtl")).toBe("inline-start");
            expect(l.toLogical("border-left-width", "vertical-lr", "rtl")).toBe("border-block-start-width");
            expect(l.toLogical("border-right-width", "vertical-lr", "rtl")).toBe("border-block-end-width");
            expect(l.toLogical("border-top-width", "vertical-lr", "rtl")).toBe("border-inline-end-width");
            expect(l.toLogical("border-bottom-width", "vertical-lr", "rtl")).toBe("border-inline-start-width");
        });

        it("returns original properties when they are already logical", function() {
            expect(l.toLogical("inline-start", "vertical-rl")).toBe("inline-start");
            expect(l.toLogical("inline-end", "vertical-rl")).toBe("inline-end");
            expect(l.toLogical("block-start", "vertical-rl")).toBe("block-start");
            expect(l.toLogical("block-end", "vertical-rl")).toBe("block-end");
        });
    });
});
