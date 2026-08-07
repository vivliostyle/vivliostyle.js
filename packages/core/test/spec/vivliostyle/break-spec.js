/**
 * Copyright 2017 Daishinsha Inc.
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
import * as vivliostyle_layout_processor from "../../../src/vivliostyle/layout-processor";
import * as vivliostyle_node_context from "../../../src/vivliostyle/node-context";
import * as vivliostyle_vtree from "../../../src/vivliostyle/vtree";

describe("break", function () {
  describe("convertPageBreakAliases", function () {
    var convertPageBreakAliases = vivliostyle_break.convertPageBreakAliases;

    it("converts page-break-before/after to break-before/after", function () {
      ["before", "after"].forEach(function (side) {
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

    it("converts page-break-inside to break-inside", function () {
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

  describe("resolveEffectiveBreakValue", function () {
    var resolveEffectiveBreakValue =
      vivliostyle_break.resolveEffectiveBreakValue;

    it("If one of the argument is null, return the other", function () {
      expect(resolveEffectiveBreakValue(null, null)).toBe(null);
      expect(resolveEffectiveBreakValue(null, "avoid-page")).toBe("avoid-page");
      expect(resolveEffectiveBreakValue("avoid-region", null)).toBe(
        "avoid-region",
      );
    });

    it("returns a forced break value if present", function () {
      expect(resolveEffectiveBreakValue("avoid-page", "region")).toBe("region");
      expect(resolveEffectiveBreakValue("region", "avoid-page")).toBe("region");
    });

    it("honor both values when they are forced break values", function () {
      expect(resolveEffectiveBreakValue("region", "column")).toBe("region");
      expect(resolveEffectiveBreakValue("page", "region")).toBe("page");
      expect(resolveEffectiveBreakValue("page", "column")).toBe("page");
    });

    it("returns the second one if both forced break values are conflicting each other", function () {
      expect(resolveEffectiveBreakValue("left", "right")).toBe("right");
    });

    it("returns an avoid break value if the other is auto", function () {
      expect(resolveEffectiveBreakValue("avoid-region", "auto")).toBe(
        "avoid-region",
      );
      expect(resolveEffectiveBreakValue("auto", "avoid-region")).toBe(
        "avoid-region",
      );
    });

    it("returns the second one if both are avoid break values", function () {
      expect(resolveEffectiveBreakValue("avoid-page", "avoid-column")).toBe(
        "avoid-column",
      );
    });

    it("returns auto if both are auto", function () {
      expect(resolveEffectiveBreakValue("auto", "auto")).toBe("auto");
    });
  });

  describe("column break suppression", function () {
    function elementNodeContext(viewNode, overrides) {
      var opened = vivliostyle_node_context.openAt(
        document.createElement("div"),
        null,
        0,
        new vivliostyle_layout_processor.BlockFormattingContext(null),
        {
          shadowType: vivliostyle_vtree.ShadowType.NONE,
          shadowContext: null,
        },
        { offsetInNode: 0, after: false },
      );
      var rendered = vivliostyle_node_context.elementRenderResultOf(opened);
      Object.keys(overrides || {}).forEach(function (field) {
        rendered[field] = overrides[field];
      });
      return vivliostyle_node_context.renderedElement(
        opened,
        viewNode,
        rendered,
      );
    }

    it("masks the column break before of a suppressed view node", function () {
      var viewNode = document.createElement("div");
      var nodeContext = elementNodeContext(viewNode, {
        breakBefore: "column",
      });
      expect(vivliostyle_break.effectiveBreakBefore(nodeContext)).toBe(
        "column",
      );
      vivliostyle_break.suppressColumnBreakBefore(viewNode);
      expect(vivliostyle_break.effectiveBreakBefore(nodeContext)).toBe(null);
    });

    it("keeps the suppression a fresh column break before assignment cannot lift", function () {
      var viewNode = document.createElement("div");
      var nodeContext = elementNodeContext(viewNode, {
        breakBefore: "column",
      });
      vivliostyle_break.suppressColumnBreakBefore(viewNode);
      var reassigned = vivliostyle_node_context.setBreakBefore(
        nodeContext,
        "column",
      );
      expect(vivliostyle_break.effectiveBreakBefore(reassigned)).toBe(null);
      vivliostyle_break.unsuppressColumnBreakBefore(viewNode);
      expect(vivliostyle_break.effectiveBreakBefore(reassigned)).toBe("column");
    });

    it("lifts the column break after suppression of a view node", function () {
      var viewNode = document.createElement("div");
      var nodeContext = elementNodeContext(viewNode, { breakAfter: "column" });
      vivliostyle_break.suppressColumnBreakAfter(viewNode);
      expect(vivliostyle_break.effectiveBreakAfter(nodeContext)).toBe(null);
      vivliostyle_break.unsuppressColumnBreakAfter(viewNode);
      expect(vivliostyle_break.effectiveBreakAfter(nodeContext)).toBe("column");
    });

    it("keeps the suppression of the other view nodes", function () {
      var lifted = document.createElement("div");
      var kept = document.createElement("div");
      var liftedContext = elementNodeContext(lifted, {
        breakBefore: "column",
      });
      var keptContext = elementNodeContext(kept, { breakBefore: "column" });
      vivliostyle_break.suppressColumnBreakBefore(lifted);
      vivliostyle_break.suppressColumnBreakBefore(kept);
      vivliostyle_break.unsuppressColumnBreakBefore(lifted);
      expect(vivliostyle_break.effectiveBreakBefore(liftedContext)).toBe(
        "column",
      );
      expect(vivliostyle_break.effectiveBreakBefore(keptContext)).toBe(null);
    });

    it("keeps the raw column break recoverable after reporting it", function () {
      var viewNode = document.createElement("div");
      var nodeContext = elementNodeContext(viewNode, {
        breakBefore: "column",
        breakAfter: "column",
      });
      vivliostyle_break.suppressColumnBreakBefore(viewNode);
      vivliostyle_break.suppressColumnBreakAfter(viewNode);
      nodeContext.breakBefore =
        vivliostyle_break.reportEffectiveBreakBefore(nodeContext);
      nodeContext.breakAfter =
        vivliostyle_break.reportEffectiveBreakAfter(nodeContext);
      expect(nodeContext.breakBefore).toBe(null);
      expect(nodeContext.breakAfter).toBe(null);
      vivliostyle_break.unsuppressColumnBreakBefore(viewNode);
      vivliostyle_break.unsuppressColumnBreakAfter(viewNode);
      expect(vivliostyle_break.effectiveBreakBefore(nodeContext)).toBe(
        "column",
      );
      expect(vivliostyle_break.effectiveBreakAfter(nodeContext)).toBe("column");
    });

    it("forgets the report once the value carries a break of its own", function () {
      var viewNode = document.createElement("div");
      var nodeContext = elementNodeContext(viewNode, {
        breakBefore: "column",
      });
      vivliostyle_break.suppressColumnBreakBefore(viewNode);
      nodeContext.breakBefore =
        vivliostyle_break.reportEffectiveBreakBefore(nodeContext);
      nodeContext.breakBefore = "page";
      expect(vivliostyle_break.reportEffectiveBreakBefore(nodeContext)).toBe(
        "page",
      );
      nodeContext.breakBefore = null;
      expect(vivliostyle_break.effectiveBreakBefore(nodeContext)).toBe(null);
    });

    it("reports the break of a value no suppression masks", function () {
      var viewNode = document.createElement("div");
      var nodeContext = elementNodeContext(viewNode, {
        breakBefore: "column",
      });
      expect(vivliostyle_break.reportEffectiveBreakBefore(nodeContext)).toBe(
        "column",
      );
      expect(vivliostyle_break.reportEffectiveBreakAfter(nodeContext)).toBe(
        null,
      );
    });

    it("keeps the two directions of one view node apart", function () {
      var viewNode = document.createElement("div");
      var nodeContext = elementNodeContext(viewNode, {
        breakBefore: "column",
        breakAfter: "column",
      });
      vivliostyle_break.suppressColumnBreakBefore(viewNode);
      vivliostyle_break.suppressColumnBreakAfter(viewNode);
      vivliostyle_break.unsuppressColumnBreakBefore(viewNode);
      expect(vivliostyle_break.effectiveBreakBefore(nodeContext)).toBe(
        "column",
      );
      expect(vivliostyle_break.effectiveBreakAfter(nodeContext)).toBe(null);
    });
  });
});
