/*
 * Copyright 2015 Daishinsha Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

import PageStyle from "../../../src/models/page-style";

describe("PageStyle", function () {
  function makeDummyPageStyle() {
    const pageStyle = new PageStyle();
    pageStyle.mode(PageStyle.Mode.PRESET);
    pageStyle.presetSize(PageStyle.PresetSize[3]);
    pageStyle.isLandscape(true);
    pageStyle.customWidth("100mm");
    pageStyle.customHeight("200mm");
    pageStyle.isImportant(true);
    return pageStyle;
  }

  function verifyDummyPageStyle(pageStyle) {
    expect(pageStyle.mode()).toBe(PageStyle.Mode.PRESET);
    expect(pageStyle.presetSize()).toBe(PageStyle.PresetSize[3]);
    expect(pageStyle.isLandscape()).toBe(true);
    expect(pageStyle.customWidth()).toBe("100mm");
    expect(pageStyle.customHeight()).toBe("200mm");
    expect(pageStyle.isImportant()).toBe(true);
  }

  describe("constructor", function () {
    it("copies parameters from the argument", function () {
      const pageStyle = new PageStyle(makeDummyPageStyle());

      verifyDummyPageStyle(pageStyle);
    });
  });

  describe("copyFrom", function () {
    it("copies parameters from the argument to itself", function () {
      const pageStyle = new PageStyle();
      pageStyle.copyFrom(makeDummyPageStyle());

      verifyDummyPageStyle(pageStyle);
    });
  });

  describe("equivalentTo", function () {
    let dummy;

    beforeEach(function () {
      dummy = makeDummyPageStyle();
    });

    it("returns false if isImportant is different", function () {
      const pageStyle = new PageStyle(dummy);
      pageStyle.isImportant(false);

      expect(pageStyle.equivalentTo(dummy)).toBe(false);
    });

    it("returns false if mode is different", function () {
      const pageStyle = new PageStyle(dummy);
      pageStyle.mode(PageStyle.Mode.AUTO);

      expect(pageStyle.equivalentTo(dummy)).toBe(false);
    });

    it("when mode is AUTO, other parameters (other than isImportant) doesn't matter", function () {
      const pageStyle = new PageStyle(dummy);
      dummy.mode(PageStyle.Mode.AUTO);
      pageStyle.mode(PageStyle.Mode.AUTO);

      expect(pageStyle.equivalentTo(dummy)).toBe(true);

      pageStyle.presetSize(PageStyle.PresetSize[0]);

      expect(pageStyle.equivalentTo(dummy)).toBe(true);

      pageStyle.isLandscape(false);

      expect(pageStyle.equivalentTo(dummy)).toBe(true);

      pageStyle.customWidth("210mm");

      expect(pageStyle.equivalentTo(dummy)).toBe(true);

      pageStyle.customHeight("297mm");

      expect(pageStyle.equivalentTo(dummy)).toBe(true);
    });

    it("when mode is PRESET, customWidth and customHeight doesn't matter", function () {
      const pageStyle = new PageStyle(dummy);
      dummy.mode(PageStyle.Mode.PRESET);
      pageStyle.mode(PageStyle.Mode.PRESET);

      expect(pageStyle.equivalentTo(dummy)).toBe(true);

      pageStyle.customWidth("210mm");

      expect(pageStyle.equivalentTo(dummy)).toBe(true);

      pageStyle.customHeight("297mm");

      expect(pageStyle.equivalentTo(dummy)).toBe(true);

      pageStyle.presetSize(PageStyle.PresetSize[0]);

      expect(pageStyle.equivalentTo(dummy)).toBe(false);

      pageStyle.presetSize(dummy.presetSize());
      pageStyle.isLandscape(false);

      expect(pageStyle.equivalentTo(dummy)).toBe(false);
    });

    it("when mode is CUSTOM, presetSize and isLandscape doesn't matter", function () {
      const pageStyle = new PageStyle(dummy);
      dummy.mode(PageStyle.Mode.CUSTOM);
      pageStyle.mode(PageStyle.Mode.CUSTOM);

      expect(pageStyle.equivalentTo(dummy)).toBe(true);

      pageStyle.presetSize(PageStyle.PresetSize[0]);

      expect(pageStyle.equivalentTo(dummy)).toBe(true);

      pageStyle.isLandscape(false);

      expect(pageStyle.equivalentTo(dummy)).toBe(true);

      pageStyle.customWidth("210mm");

      expect(pageStyle.equivalentTo(dummy)).toBe(false);

      pageStyle.customWidth(dummy.customWidth());
      pageStyle.customHeight("297mm");

      expect(pageStyle.equivalentTo(dummy)).toBe(false);
    });
  });

  describe("toCSSDeclarationString", function () {
    it("returns corresponding CSS declaration string", function () {
      const pageStyle = makeDummyPageStyle();
      pageStyle.mode(PageStyle.Mode.AUTO);

      expect(pageStyle.toCSSDeclarationString()).toBe("size: auto !important;");

      pageStyle.isImportant(false);

      expect(pageStyle.toCSSDeclarationString()).toBe("size: auto;");

      pageStyle.mode(PageStyle.Mode.CUSTOM);

      expect(pageStyle.toCSSDeclarationString()).toBe("size: 100mm 200mm;");

      pageStyle.isImportant(true);

      expect(pageStyle.toCSSDeclarationString()).toBe(
        "size: 100mm 200mm !important;",
      );

      pageStyle.isImportant(false);
      pageStyle.mode(PageStyle.Mode.PRESET);

      expect(pageStyle.toCSSDeclarationString()).toBe("size: B5 landscape;");

      pageStyle.isLandscape(false);

      expect(pageStyle.toCSSDeclarationString()).toBe("size: B5;");

      pageStyle.isImportant(true);

      expect(pageStyle.toCSSDeclarationString()).toBe("size: B5 !important;");
    });
  });
});
