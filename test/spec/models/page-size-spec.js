/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

import PageSize from "../../../src/js/models/page-size";

describe("PageSize", function() {

    function makeDummyPageSize() {
        var pageSize = new PageSize();
        pageSize.mode(PageSize.Mode.PRESET);
        pageSize.presetSize(PageSize.PresetSize[3]);
        pageSize.isLandscape(true);
        pageSize.customWidth("100mm");
        pageSize.customHeight("200mm");
        pageSize.isImportant(true);
        return pageSize;
    }

    function verifyDummyPageSize(pageSize) {
        expect(pageSize.mode()).toBe(PageSize.Mode.PRESET);
        expect(pageSize.presetSize()).toBe(PageSize.PresetSize[3]);
        expect(pageSize.isLandscape()).toBe(true);
        expect(pageSize.customWidth()).toBe("100mm");
        expect(pageSize.customHeight()).toBe("200mm");
        expect(pageSize.isImportant()).toBe(true);
    }

    describe("constructor", function() {
        it("copies parameters from the argument", function() {
            var pageSize = new PageSize(makeDummyPageSize());

            verifyDummyPageSize(pageSize);
        });
    });

    describe("copyFrom", function() {
        it("copies parameters from the argument to itself", function() {
            var pageSize = new PageSize();
            pageSize.copyFrom(makeDummyPageSize());

            verifyDummyPageSize(pageSize);
        });
    });

    describe("equivalentTo", function() {
        var dummy;

        beforeEach(function() {
            dummy = makeDummyPageSize();
        });

        it("returns false if isImportant is different", function() {
            var pageSize = new PageSize(dummy);
            pageSize.isImportant(false);

            expect(pageSize.equivalentTo(dummy)).toBe(false);
        });

        it("returns false if mode is different", function() {
            var pageSize = new PageSize(dummy);
            pageSize.mode(PageSize.Mode.AUTO);

            expect(pageSize.equivalentTo(dummy)).toBe(false);
        });

        it("when mode is AUTO, other parameters (other than isImportant) doesn't matter", function() {
            var pageSize = new PageSize(dummy);
            dummy.mode(PageSize.Mode.AUTO);
            pageSize.mode(PageSize.Mode.AUTO);

            expect(pageSize.equivalentTo(dummy)).toBe(true);

            pageSize.presetSize(PageSize.PresetSize[0]);

            expect(pageSize.equivalentTo(dummy)).toBe(true);

            pageSize.isLandscape(false);

            expect(pageSize.equivalentTo(dummy)).toBe(true);

            pageSize.customWidth("210mm");

            expect(pageSize.equivalentTo(dummy)).toBe(true);

            pageSize.customHeight("297mm");

            expect(pageSize.equivalentTo(dummy)).toBe(true);
        });

        it("when mode is PRESET, customWidth and customHeight doesn't matter", function() {
            var pageSize = new PageSize(dummy);
            dummy.mode(PageSize.Mode.PRESET);
            pageSize.mode(PageSize.Mode.PRESET);

            expect(pageSize.equivalentTo(dummy)).toBe(true);

            pageSize.customWidth("210mm");

            expect(pageSize.equivalentTo(dummy)).toBe(true);

            pageSize.customHeight("297mm");

            expect(pageSize.equivalentTo(dummy)).toBe(true);

            pageSize.presetSize(PageSize.PresetSize[0]);

            expect(pageSize.equivalentTo(dummy)).toBe(false);

            pageSize.presetSize(dummy.presetSize());
            pageSize.isLandscape(false);

            expect(pageSize.equivalentTo(dummy)).toBe(false);
        });

        it("when mode is CUSTOM, presetSize and isLandscape doesn't matter", function() {
            var pageSize = new PageSize(dummy);
            dummy.mode(PageSize.Mode.CUSTOM);
            pageSize.mode(PageSize.Mode.CUSTOM);

            expect(pageSize.equivalentTo(dummy)).toBe(true);

            pageSize.presetSize(PageSize.PresetSize[0]);

            expect(pageSize.equivalentTo(dummy)).toBe(true);

            pageSize.isLandscape(false);

            expect(pageSize.equivalentTo(dummy)).toBe(true);

            pageSize.customWidth("210mm");

            expect(pageSize.equivalentTo(dummy)).toBe(false);

            pageSize.customWidth(dummy.customWidth());
            pageSize.customHeight("297mm");

            expect(pageSize.equivalentTo(dummy)).toBe(false);
        });
    });

    describe("toCSSDeclarationString", function() {
        it("returns corresponding CSS declaration string", function() {
            var pageSize = makeDummyPageSize();
            pageSize.mode(PageSize.Mode.AUTO);

            expect(pageSize.toCSSDeclarationString()).toBe("size: auto !important;");

            pageSize.isImportant(false);

            expect(pageSize.toCSSDeclarationString()).toBe("size: auto;");

            pageSize.mode(PageSize.Mode.CUSTOM);

            expect(pageSize.toCSSDeclarationString()).toBe("size: 100mm 200mm;");

            pageSize.isImportant(true);

            expect(pageSize.toCSSDeclarationString()).toBe("size: 100mm 200mm !important;");

            pageSize.isImportant(false);
            pageSize.mode(PageSize.Mode.PRESET);

            expect(pageSize.toCSSDeclarationString()).toBe("size: B5 landscape;");

            pageSize.isLandscape(false);

            expect(pageSize.toCSSDeclarationString()).toBe("size: B5;");

            pageSize.isImportant(true);

            expect(pageSize.toCSSDeclarationString()).toBe("size: B5 !important;");
        });
    });
});
