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

import * as adapt_css from "../../../src/vivliostyle/css";
import * as adapt_csscasc from "../../../src/vivliostyle/css-cascade";
import * as adapt_cssparse from "../../../src/vivliostyle/css-parser";
import * as vivliostyle_css_page from "../../../src/vivliostyle/css-page";

describe("css-page", function () {
  var module = vivliostyle_css_page;
  var expected;

  describe("resolvePageSizeAndBleed", function () {
    beforeEach(function () {
      expected = {
        width: adapt_css.fullWidth,
        height: adapt_css.fullHeight,
        bleed: adapt_css.numericZero,
        bleedOffset: adapt_css.numericZero,
      };
    });

    it("has fullWidth and fullHeight when nothing specified", function () {
      var resolved = module.resolvePageSizeAndBleed({});
      expect(resolved).toEqual(expected);
    });

    it("has fullWidth and fullHeight when size=auto", function () {
      var resolved = module.resolvePageSizeAndBleed({
        size: new adapt_csscasc.CascadeValue(adapt_css.ident.auto, 0),
      });
      expect(resolved).toEqual(expected);
    });

    it("has the same width and height when only one length is specified in size property", function () {
      var resolved = module.resolvePageSizeAndBleed({
        size: new adapt_csscasc.CascadeValue(
          new adapt_css.Numeric(10, "cm"),
          0,
        ),
      });
      expected.width = new adapt_css.Numeric(10, "cm");
      expected.height = new adapt_css.Numeric(10, "cm");
      expect(resolved).toEqual(expected);
    });

    it("has the width and height specified in size property", function () {
      var resolved = module.resolvePageSizeAndBleed({
        size: new adapt_csscasc.CascadeValue(
          new adapt_css.SpaceList([
            new adapt_css.Numeric(10, "cm"),
            new adapt_css.Numeric(12, "cm"),
          ]),
          0,
        ),
      });
      expected.width = new adapt_css.Numeric(10, "cm");
      expected.height = new adapt_css.Numeric(12, "cm");
      expect(resolved).toEqual(expected);
    });

    it("has fullWidth and fullHeight when portrait of landscape is specified alone in size property", function () {
      var resolved = module.resolvePageSizeAndBleed({
        size: new adapt_csscasc.CascadeValue(adapt_css.getName("portrait"), 0),
      });
      expect(resolved).toEqual(expected);

      resolved = module.resolvePageSizeAndBleed({
        size: new adapt_csscasc.CascadeValue(adapt_css.ident.landscape, 0),
      });
      expect(resolved).toEqual(expected);
    });

    it("has the width and height of the paper size specified in size property", function () {
      var resolved = module.resolvePageSizeAndBleed({
        size: new adapt_csscasc.CascadeValue(adapt_css.getName("A5"), 0),
      });
      expected.width = new adapt_css.Numeric(148, "mm");
      expected.height = new adapt_css.Numeric(210, "mm");
      expect(resolved).toEqual(expected);

      resolved = module.resolvePageSizeAndBleed({
        size: new adapt_csscasc.CascadeValue(
          new adapt_css.SpaceList([
            adapt_css.getName("A5"),
            adapt_css.getName("portrait"),
          ]),
          0,
        ),
      });
      expected.width = new adapt_css.Numeric(148, "mm");
      expected.height = new adapt_css.Numeric(210, "mm");
      expect(resolved).toEqual(expected);

      resolved = module.resolvePageSizeAndBleed({
        size: new adapt_csscasc.CascadeValue(
          new adapt_css.SpaceList([
            adapt_css.getName("A5"),
            adapt_css.ident.landscape,
          ]),
          0,
        ),
      });
      expected.width = new adapt_css.Numeric(210, "mm");
      expected.height = new adapt_css.Numeric(148, "mm");
      expect(resolved).toEqual(expected);
    });

    it("has the default bleed offset value when 'crop' and/or 'cross' value is specified in 'marks' property", function () {
      var resolved = module.resolvePageSizeAndBleed({
        marks: new adapt_csscasc.CascadeValue(adapt_css.ident.none, 0),
      });
      expect(resolved).toEqual(expected);

      expected.bleedOffset = module.defaultBleedOffset;

      resolved = module.resolvePageSizeAndBleed({
        bleed: new adapt_csscasc.CascadeValue(adapt_css.numericZero, 0), // if bleed=auto, it computes to 6pt (see below)
        marks: new adapt_csscasc.CascadeValue(adapt_css.ident.crop, 0),
      });
      expect(resolved).toEqual(expected);

      resolved = module.resolvePageSizeAndBleed({
        marks: new adapt_csscasc.CascadeValue(adapt_css.ident.cross, 0),
      });
      expect(resolved).toEqual(expected);

      resolved = module.resolvePageSizeAndBleed({
        bleed: new adapt_csscasc.CascadeValue(adapt_css.numericZero, 0), // if bleed=auto, it computes to 6pt (see below)
        marks: new adapt_csscasc.CascadeValue(
          new adapt_css.SpaceList([
            adapt_css.ident.crop,
            adapt_css.ident.cross,
          ]),
          0,
        ),
      });
      expect(resolved).toEqual(expected);
    });

    it("has the bleed value specified in 'bleed' property when it is specified with a concrete length", function () {
      var resolved = module.resolvePageSizeAndBleed({
        bleed: new adapt_csscasc.CascadeValue(
          new adapt_css.Numeric(5, "mm"),
          0,
        ),
      });
      expected.bleed = new adapt_css.Numeric(5, "mm");
      expect(resolved).toEqual(expected);
    });

    it("'auto' bleed value computes to 6pt if 'marks' has 'crop'", function () {
      expected.bleedOffset = module.defaultBleedOffset;
      expected.bleed = new adapt_css.Numeric(6, "pt");

      var resolved = module.resolvePageSizeAndBleed({
        marks: new adapt_csscasc.CascadeValue(adapt_css.ident.crop, 0),
      });
      expect(resolved).toEqual(expected);

      resolved = module.resolvePageSizeAndBleed({
        bleed: new adapt_csscasc.CascadeValue(adapt_css.ident.auto, 0),
        marks: new adapt_csscasc.CascadeValue(adapt_css.ident.crop, 0),
      });
      expect(resolved).toEqual(expected);
    });

    it("'auto' bleed value computes to zero if 'marks' does not has 'crop'", function () {
      var resolved = module.resolvePageSizeAndBleed({
        bleed: new adapt_csscasc.CascadeValue(adapt_css.ident.auto, 0),
        marks: new adapt_csscasc.CascadeValue(adapt_css.ident.cross, 0),
      });
      expected.bleedOffset = module.defaultBleedOffset;
      expected.bleed = adapt_css.numericZero;
      expect(resolved).toEqual(expected);
    });
  });

  describe("PageParserHandler", function () {
    var pageProps, handler;

    function createHandler() {
      return new vivliostyle_css_page.PageParserHandler(
        null,
        new adapt_cssparse.DispatchParserHandler(),
        null,
        null,
        pageProps,
      );
    }

    beforeEach(function () {
      pageProps = {};
      handler = createHandler();
    });

    it("'bleed' and 'marks' specified in @page rule without page selectors are effective", function () {
      handler.startSelectorRule();
      handler.startRuleBody();
      handler.simpleProperty("size", new adapt_css.Numeric(100, "px"));
      handler.simpleProperty("bleed", new adapt_css.Numeric(10, "px"));
      handler.simpleProperty("marks", adapt_css.ident.crop);
      handler.endRule();

      expect(pageProps[""].size.value).toEqual(
        new adapt_css.Numeric(100, "px"),
      );
      expect(pageProps[""].bleed.value).toEqual(
        new adapt_css.Numeric(10, "px"),
      );
      expect(pageProps[""].marks.value).toBe(adapt_css.ident.crop);
    });

    it("'bleed' and 'marks' specified in @page rules with page selectors are ignored", function () {
      handler.startSelectorRule();
      handler.pseudoclassSelector("left", null);
      handler.startRuleBody();
      handler.simpleProperty("size", new adapt_css.Numeric(120, "px"));
      handler.simpleProperty("bleed", new adapt_css.Numeric(20, "px"));
      handler.simpleProperty("marks", adapt_css.ident.cross);
      handler.endRule();

      handler = createHandler();
      handler.startSelectorRule();
      handler.startRuleBody();
      handler.simpleProperty("size", new adapt_css.Numeric(100, "px"));
      handler.simpleProperty("bleed", new adapt_css.Numeric(10, "px"));
      handler.simpleProperty("marks", adapt_css.ident.crop);
      handler.endRule();

      handler = createHandler();
      handler.startSelectorRule();
      handler.pseudoclassSelector("right", null);
      handler.startRuleBody();
      handler.simpleProperty("size", new adapt_css.Numeric(130, "px"));
      handler.simpleProperty("bleed", new adapt_css.Numeric(30, "px"));
      handler.simpleProperty("marks", adapt_css.ident.cross);
      handler.endRule();

      // multiple selectors separated by comma
      handler = createHandler();
      handler.startSelectorRule();
      handler.pseudoclassSelector("first", null);
      handler.nextSelector();
      handler.tagSelector(null, "foo");
      handler.startRuleBody();
      handler.simpleProperty("size", new adapt_css.Numeric(140, "px"));
      handler.simpleProperty("bleed", new adapt_css.Numeric(40, "px"));
      handler.simpleProperty("marks", adapt_css.ident.cross);
      handler.endRule();

      // a selector with a name and multiple page pseudo classes
      handler = createHandler();
      handler.startSelectorRule();
      handler.pseudoclassSelector("left", null);
      handler.pseudoclassSelector("first", null);
      handler.tagSelector(null, "bar");
      handler.startRuleBody();
      handler.simpleProperty("size", new adapt_css.Numeric(150, "px"));
      handler.simpleProperty("bleed", new adapt_css.Numeric(50, "px"));
      handler.simpleProperty("marks", adapt_css.ident.cross);
      handler.endRule();

      expect(pageProps[""].size.value).toEqual(
        new adapt_css.Numeric(100, "px"),
      );
      expect(pageProps[""].bleed.value).toEqual(
        new adapt_css.Numeric(10, "px"),
      );
      expect(pageProps[""].marks.value).toBe(adapt_css.ident.crop);

      expect(pageProps[":left"].size.value).toEqual(
        new adapt_css.Numeric(120, "px"),
      );
      expect(pageProps[":left"].bleed.value).toEqual(
        new adapt_css.Numeric(10, "px"),
      );
      expect(pageProps[":left"].marks.value).toBe(adapt_css.ident.crop);

      expect(pageProps[":right"].size.value).toEqual(
        new adapt_css.Numeric(130, "px"),
      );
      expect(pageProps[":right"].bleed.value).toEqual(
        new adapt_css.Numeric(10, "px"),
      );
      expect(pageProps[":right"].marks.value).toBe(adapt_css.ident.crop);

      expect(pageProps[":first"].size.value).toEqual(
        new adapt_css.Numeric(140, "px"),
      );
      expect(pageProps[":first"].bleed.value).toEqual(
        new adapt_css.Numeric(10, "px"),
      );
      expect(pageProps[":first"].marks.value).toBe(adapt_css.ident.crop);

      expect(pageProps["foo"].size.value).toEqual(
        new adapt_css.Numeric(140, "px"),
      );
      expect(pageProps["foo"].bleed.value).toEqual(
        new adapt_css.Numeric(10, "px"),
      );
      expect(pageProps["foo"].marks.value).toBe(adapt_css.ident.crop);

      expect(pageProps["bar:first:left"].size.value).toEqual(
        new adapt_css.Numeric(150, "px"),
      );
      expect(pageProps["bar:first:left"].bleed.value).toEqual(
        new adapt_css.Numeric(10, "px"),
      );
      expect(pageProps["bar:first:left"].marks.value).toBe(
        adapt_css.ident.crop,
      );
    });
  });
});
