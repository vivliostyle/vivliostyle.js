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
import * as vivliostyle_break from "../../../src/vivliostyle/break";

describe("break", function() {
  describe("convertPageBreakAliases", function() {
    var convertPageBreakAliases = vivliostyle_break.convertPageBreakAliases;

    it("converts page-break-before/after to break-before/after", function() {
      ["before", "after"].forEach(function(side) {
        var breakProp = "break-" + side;
        var original = {
          name: "page-" + breakProp,
          important: false,
        };
        var converted;

        original["value"] = adapt_css.ident.auto;
        converted = convertPageBreakAliases(original);
        expect(converted["name"]).toBe(breakProp);
        expect(converted["value"]).toBe(adapt_css.ident.auto);
        expect(converted["important"]).toBe(false);

        original["value"] = adapt_css.ident.left;
        converted = convertPageBreakAliases(original);
        expect(converted["name"]).toBe(breakProp);
        expect(converted["value"]).toBe(adapt_css.ident.left);

        original["value"] = adapt_css.ident.right;
        converted = convertPageBreakAliases(original);
        expect(converted["name"]).toBe(breakProp);
        expect(converted["value"]).toBe(adapt_css.ident.right);

        original["value"] = adapt_css.ident.avoid;
        converted = convertPageBreakAliases(original);
        expect(converted["name"]).toBe(breakProp);
        expect(converted["value"]).toBe(adapt_css.ident.avoid);

        original["value"] = adapt_css.ident.always;
        converted = convertPageBreakAliases(original);
        expect(converted["name"]).toBe(breakProp);
        expect(converted["value"]).toBe(adapt_css.ident.page);
      });
    });

    it("converts page-break-inside to break-inside", function() {
      var original = {
        name: "page-break-inside",
        important: false,
      };
      var converted;

      original["value"] = adapt_css.ident.auto;
      converted = convertPageBreakAliases(original);
      expect(converted["name"]).toBe("break-inside");
      expect(converted["value"]).toBe(adapt_css.ident.auto);
      expect(converted["important"]).toBe(false);

      original["value"] = adapt_css.ident.avoid;
      converted = convertPageBreakAliases(original);
      expect(converted["name"]).toBe("break-inside");
      expect(converted["value"]).toBe(adapt_css.ident.avoid);
    });
  });

  describe("resolveEffectiveBreakValue", function() {
    var resolveEffectiveBreakValue =
      vivliostyle_break.resolveEffectiveBreakValue;

    it("If one of the argument is null, return the other", function() {
      expect(resolveEffectiveBreakValue(null, null)).toBe(null);
      expect(resolveEffectiveBreakValue(null, "avoid-page")).toBe("avoid-page");
      expect(resolveEffectiveBreakValue("avoid-region", null)).toBe(
        "avoid-region",
      );
    });

    it("returns a forced break value if present", function() {
      expect(resolveEffectiveBreakValue("avoid-page", "region")).toBe("region");
      expect(resolveEffectiveBreakValue("region", "avoid-page")).toBe("region");
    });

    it("honor both values when they are forced break values", function() {
      expect(resolveEffectiveBreakValue("region", "column")).toBe("region");
      expect(resolveEffectiveBreakValue("page", "region")).toBe("page");
      expect(resolveEffectiveBreakValue("page", "column")).toBe("page");
    });

    it("returns the second one if both forced break values are conflicting each other", function() {
      expect(resolveEffectiveBreakValue("left", "right")).toBe("right");
    });

    it("returns an avoid break value if the other is auto", function() {
      expect(resolveEffectiveBreakValue("avoid-region", "auto")).toBe(
        "avoid-region",
      );
      expect(resolveEffectiveBreakValue("auto", "avoid-region")).toBe(
        "avoid-region",
      );
    });

    it("returns the second one if both are avoid break values", function() {
      expect(resolveEffectiveBreakValue("avoid-page", "avoid-column")).toBe(
        "avoid-column",
      );
    });

    it("returns auto if both are auto", function() {
      expect(resolveEffectiveBreakValue("auto", "auto")).toBe("auto");
    });
  });
});
