/**
 * Copyright 2026 Vivliostyle Foundation
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

import * as CssStyler from "../../../src/vivliostyle/css-styler";
import { FontMetrics } from "../../../src/vivliostyle/font-metrics";
import * as Exprs from "../../../src/vivliostyle/exprs";
import * as Css from "../../../src/vivliostyle/css";
import * as Cascade from "../../../src/vivliostyle/css-cascade";
import * as Parser from "../../../src/vivliostyle/css-parser";
import * as Tokenizer from "../../../src/vivliostyle/css-tokenizer";

function nativeLength(unit, size, properties) {
  const probe = document.createElement("span");
  probe.style.cssText = `all:initial;position:absolute;font-size:${size}px;margin-left:1${unit}`;
  Object.assign(probe.style, properties);
  document.body.append(probe);
  try {
    return parseFloat(getComputedStyle(probe).marginLeft);
  } finally {
    probe.remove();
  }
}

describe("font metrics", function () {
  it("uses the source family, size and orientation instead of fixed ratios", function () {
    const metrics = new FontMetrics(document);
    for (const family of ["Courier New", "Arial"]) {
      for (const orientation of ["horizontal", "mixed", "upright"]) {
        const writingMode =
          orientation === "horizontal" ? "horizontal-tb" : "vertical-rl";
        const textOrientation =
          orientation === "horizontal" ? "mixed" : orientation;
        for (const unit of ["ex", "cap", "ch", "ic", "lh"]) {
          const properties = {
            "font-family": family,
            "writing-mode": writingMode,
            "text-orientation": textOrientation,
            "font-size-adjust": "0.7",
            "font-weight": "bold",
          };
          const actual = metrics.measure(unit, 37, properties);
          const expected = nativeLength(unit, 37, {
            fontFamily: family,
            writingMode,
            textOrientation,
            fontSizeAdjust: "0.7",
            fontWeight: "bold",
          });
          expect(actual)
            .withContext(`${family}/${orientation}/${unit}`)
            .toBeCloseTo(expected, 4);
        }
      }
    }
  });

  it("measures normal independently of fallback text and inherited viewer styles", function () {
    const metrics = new FontMetrics(document);
    const previous = document.body.style.cssText;
    document.body.style.cssText = "font:900 80px/100px Arial";
    try {
      for (const size of [0, 16, 37]) {
        for (const family of ['"Courier New", serif', "Arial, serif"]) {
          const expected = nativeLength("lh", size, { fontFamily: family });
          expect(
            metrics.measure("lh", size, { "font-family": family }),
          ).toBeCloseTo(expected, 4);
        }
      }
    } finally {
      document.body.style.cssText = previous;
    }
  });

  it("matches normal metrics under the layout viewport's pixel-ratio emulation", function () {
    for (const zoom of [1, 2, 8]) {
      const metrics = new FontMetrics(document, (family) => family, zoom);
      for (const size of [16, 32.3, 37]) {
        expect(
          metrics.measure("lh", size, { "font-family": "Arial" }),
        ).toBeCloseTo(
          nativeLength("lh", size, { fontFamily: "Arial", zoom: String(zoom) }),
          4,
        );
      }
    }
  });

  it("uses initial normal metrics for root self-reference, and source metrics for rlh", function () {
    for (const fontSize of ["32px", "1lh", "calc(1rlh + 2px)"]) {
      for (const lineHeight of ["normal", "1rlh", "calc(1lh + 3px)"]) {
        const context = new Exprs.Context(
          new Exprs.LexicalScope(null),
          800,
          600,
          16,
          20,
        );
        context.fontMetrics = new FontMetrics(document);
        const parse = (text) =>
          new Cascade.CascadeValue(
            Parser.parseValue(
              context.rootScope,
              new Tokenizer.Tokenizer(text, null),
              "",
            ),
            0,
          );
        const style = {
          "font-family": parse('"Courier New"'),
          "font-size": parse(fontSize),
          "line-height": parse(lineHeight),
        };
        const styler = Object.create(CssStyler.Styler.prototype);
        styler.context = context;
        styler.determineRootSizes(style);
        const initial = nativeLength("lh", 16, {});
        const expectedSize =
          fontSize === "32px"
            ? 32
            : initial + (fontSize.includes("calc") ? 2 : 0);
        expect(context.rootFontSize)
          .withContext(fontSize)
          .toBeCloseTo(expectedSize, 3);
        expect(context.rootLineHeight)
          .withContext(`${fontSize}/${lineHeight}`)
          .toBeCloseTo(
            lineHeight === "normal"
              ? nativeLength("lh", expectedSize, { fontFamily: "Courier New" })
              : initial + (lineHeight.includes("calc") ? 3 : 0),
            3,
          );
        expect(style["line-height"].value.toString()).toBe(lineHeight);
        expect(context.queryUnitSize("rlh", true)).toBeCloseTo(initial, 4);
        expect(context.queryUnitSize("rlh", false)).toBe(
          context.rootLineHeight,
        );
      }
    }
  });

  it("treats unspecified root line-height as normal, and refreshes it with the font", function () {
    const context = new Exprs.Context(
      new Exprs.LexicalScope(null),
      800,
      600,
      16,
      20,
    );
    context.fontMetrics = new FontMetrics(document);
    const styler = Object.create(CssStyler.Styler.prototype);
    styler.context = context;
    const style = {
      "font-family": new Cascade.CascadeValue(new Css.Str("Arial"), 0),
      "font-size": new Cascade.CascadeValue(new Css.Numeric(32, "px"), 0),
    };
    styler.determineRootSizes(style);
    expect(context.rootLineHeight).toBeCloseTo(
      nativeLength("lh", 32, { fontFamily: "Arial" }),
      4,
    );
    style["line-height"] = new Cascade.CascadeValue(Css.ident.normal, 0);
    styler.determineRootSizes(style);
    expect(context.rootLineHeight).toBeCloseTo(
      nativeLength("lh", 32, { fontFamily: "Arial" }),
      4,
    );
    style["font-size"] = new Cascade.CascadeValue(new Css.Numeric(48, "px"), 0);
    style["font-family"] = new Cascade.CascadeValue(
      new Css.Str("Courier New"),
      0,
    );
    styler.determineRootSizes(style);
    expect(context.rootLineHeight).toBeCloseTo(
      nativeLength("lh", 48, { fontFamily: "Courier New" }),
      4,
    );
  });

  it("measures an invalid root line-height as normal", function () {
    const context = new Exprs.Context(
      new Exprs.LexicalScope(null),
      800,
      600,
      16,
      20,
    );
    context.fontMetrics = new FontMetrics(document);
    const styler = Object.create(CssStyler.Styler.prototype);
    styler.context = context;
    const style = {
      "font-family": new Cascade.CascadeValue(new Css.Str("Arial"), 0),
      "font-size": new Cascade.CascadeValue(new Css.Numeric(32, "px"), 0),
      "line-height": new Cascade.CascadeValue(Css.getName("nonsense"), 0),
    };
    styler.determineRootSizes(style);
    expect(context.rootLineHeight).toBeCloseTo(
      nativeLength("lh", 32, { fontFamily: "Arial" }),
      4,
    );
  });

  it("resolves inherited normal using the parent's font without fixing the keyword", function () {
    const context = new Exprs.Context(
      new Exprs.LexicalScope(null),
      800,
      600,
      16,
      20,
    );
    context.fontMetrics = new FontMetrics(document);
    const props = {
      "font-size": new Cascade.CascadeValue(new Css.Numeric(37, "px"), 0),
      "font-family": new Cascade.CascadeValue(new Css.Str("Courier New"), 0),
      "line-height": new Cascade.CascadeValue(Css.ident.normal, 0),
    };
    const visitor = new Cascade.InheritanceVisitor(props, context);
    visitor.setPropName("font-size");
    expect(new Css.Numeric(1, "lh").visit(visitor).num).toBeCloseTo(
      nativeLength("lh", 37, { fontFamily: "Courier New" }),
      4,
    );
    expect(props["line-height"].value).toBe(Css.ident.normal);
    props["font-size"] = new Cascade.CascadeValue(new Css.Numeric(16, "px"), 0);
    props["font-family"] = new Cascade.CascadeValue(new Css.Str("Arial"), 0);
    expect(visitor.getInheritedLineHeight()).toBeCloseTo(
      nativeLength("lh", 16, { fontFamily: "Arial" }),
      4,
    );
  });

  it("shares only the sizes without a font family between instances", function () {
    // Instances for different spine documents share the document, but the
    // faces that a mapped family selects can differ between them.
    const first = new FontMetrics(document, () => "Arial");
    const second = new FontMetrics(document, () => "Arial");
    const properties = { "font-family": "SpineFace", lang: "x-share-test" };
    first.measure("ch", 23, properties);
    first.measure("ch", 23, { lang: "x-share-test" });
    spyOn(document, "createElement").and.callThrough();
    second.measure("ch", 23, properties);
    expect(document.createElement).toHaveBeenCalledTimes(1);
    second.measure("ch", 23, { lang: "x-share-test" });
    expect(document.createElement).toHaveBeenCalledTimes(1);
  });

  it("can remeasure a font after the browser loads it", function () {
    let loaded = false;
    const metrics = new FontMetrics(document, () =>
      loaded ? "Courier New" : "Arial",
    );
    const properties = { "font-family": "ScriptLoadedFont" };
    const before = Object.fromEntries(
      ["ch", "lh"].map((unit) => [unit, metrics.measure(unit, 32, properties)]),
    );
    loaded = true;
    metrics.clearCache();
    for (const unit of ["ch", "lh"]) {
      expect(before[unit]).toBeCloseTo(
        nativeLength(unit, 32, { fontFamily: "Arial" }),
        4,
      );
      expect(metrics.measure(unit, 32, properties)).toBeCloseTo(
        nativeLength(unit, 32, { fontFamily: "Courier New" }),
        4,
      );
    }
  });

  it("resolves root units against the document root and initial units during root sizing", function () {
    const context = new Exprs.Context(
      new Exprs.LexicalScope(null),
      800,
      600,
      16,
      20,
    );
    context.fontMetrics = new FontMetrics(document);
    context.rootFontSize = 40;
    context.rootFontProperties = { "font-family": "Courier New" };
    for (const unit of ["ex", "cap", "ch", "ic"]) {
      const expected = nativeLength(unit, 40, { fontFamily: "Courier New" });
      expect(context.queryUnitSize(`r${unit}`, false)).toBeCloseTo(expected, 4);
      context.resolvingRootFontSize = true;
      expect(context.queryUnitSize(`r${unit}`, false)).toBeCloseTo(
        nativeLength(unit, 16, {}),
        4,
      );
      context.resolvingRootFontSize = false;
    }
  });

  it("resolves a relative root font weight against the initial weight", function () {
    const previousWeight = document.body.style.fontWeight;
    document.body.style.fontWeight = "900";
    try {
      const context = new Exprs.Context(
        new Exprs.LexicalScope(null),
        800,
        600,
        16,
        20,
      );
      context.fontMetrics = new FontMetrics(document);
      const styler = Object.create(CssStyler.Styler.prototype);
      styler.context = context;
      styler.determineRootSizes({
        "font-weight": new Cascade.CascadeValue(Css.ident.lighter, 0),
        "font-family": new Cascade.CascadeValue(new Css.Str("Arial"), 0),
      });

      expect(context.rootFontProperties["font-weight"]).toBe("100");
      const actual = context.measureFontUnit(
        "cap",
        16,
        context.rootFontProperties,
      );
      const expected = nativeLength("cap", 16, {
        fontFamily: "Arial",
        fontWeight: "100",
      });
      expect(actual).toBeCloseTo(expected, 4);
    } finally {
      document.body.style.fontWeight = previousWeight;
    }
  });

  it("converts root metric calculations after default root sizing", function () {
    for (const defaultValue of [
      Css.ident.initial,
      Css.ident.inherit,
      Css.ident.unset,
      null,
    ]) {
      const context = new Exprs.Context(
        new Exprs.LexicalScope(null),
        800,
        600,
        16,
        20,
      );
      context.fontMetrics = new FontMetrics(document);
      const style = {
        "font-family": new Cascade.CascadeValue(new Css.Str("Courier New"), 0),
      };
      if (defaultValue)
        style["font-size"] = new Cascade.CascadeValue(defaultValue, 0);
      const styler = Object.create(CssStyler.Styler.prototype);
      styler.context = context;
      styler.determineRootSizes(style);
      expect(context.rootFontSize).toBeNull();
      for (const unit of ["ex", "cap", "ch", "ic"]) {
        const value = Parser.parseValue(
          context.rootScope,
          new Tokenizer.Tokenizer(`calc(10r${unit} + 1px)`, null),
          "",
        );
        const result = value.visit(new Cascade.CalcFilterVisitor(context));
        expect(result.unit).withContext(`${defaultValue}/${unit}`).toBe("px");
        expect(result.num)
          .withContext(`${defaultValue}/${unit}`)
          .toBeCloseTo(
            10 * nativeLength(unit, 16, { fontFamily: "Courier New" }) + 1,
            3,
          );
      }
    }
  });

  it("uses initial root metrics when a substituted root font size is invalid", function () {
    const context = new Exprs.Context(
      new Exprs.LexicalScope(null),
      800,
      600,
      16,
      20,
    );
    context.fontMetrics = new FontMetrics(document);
    const styler = Object.create(CssStyler.Styler.prototype);
    styler.context = context;
    styler.determineRootSizes({
      "font-family": new Cascade.CascadeValue(new Css.Str("Courier New"), 0),
      // This represents a var() value after substitution and validation.
      "font-size": new Cascade.CascadeValue(new Css.Numeric(5, "s"), 0),
    });

    expect(context.rootFontMetricsReady).toBe(true);
    expect(context.rootFontSize).toBeNull();
    const value = Parser.parseValue(
      context.rootScope,
      new Tokenizer.Tokenizer("calc(10rch + 1px)", null),
      "",
    );
    const result = value.visit(new Cascade.CalcFilterVisitor(context));
    expect(result.unit).toBe("px");
    expect(result.num).toBeCloseTo(
      10 * nativeLength("ch", 16, { fontFamily: "Courier New" }) + 1,
      3,
    );
  });

  it("preserves root metric calculations while the root font size is unresolved", function () {
    for (const fontSize of [Css.getName("math"), new Css.Numeric(1, "svw")]) {
      const context = new Exprs.Context(
        new Exprs.LexicalScope(null),
        800,
        600,
        16,
        20,
      );
      context.fontMetrics = new FontMetrics(document);
      const styler = Object.create(CssStyler.Styler.prototype);
      styler.context = context;
      styler.determineRootSizes({
        "font-size": new Cascade.CascadeValue(fontSize, 0),
      });
      const value = Parser.parseValue(
        context.rootScope,
        new Tokenizer.Tokenizer("calc(10rch + 1px)", null),
        "",
      );
      expect(
        value.visit(new Cascade.CalcFilterVisitor(context)).toString(),
      ).toBe(value.toString());
    }
  });

  it("materializes inherited font sizes and line heights with the declaring font", function () {
    const context = new Exprs.Context(
      new Exprs.LexicalScope(null),
      800,
      600,
      16,
      20,
    );
    context.fontMetrics = new FontMetrics(document);
    const props = {
      "font-size": new Cascade.CascadeValue(new Css.Numeric(37, "px"), 0),
      "font-family": new Cascade.CascadeValue(new Css.Str("Courier New"), 0),
    };
    const visitor = new Cascade.InheritanceVisitor(props, context);
    for (const property of ["font-size", "line-height", "letter-spacing"]) {
      visitor.setPropName(property);
      const value = Parser.parseValue(
        context.rootScope,
        new Tokenizer.Tokenizer("calc(2cap + 1px)", null),
        "",
      );
      const visited = value.visit(visitor);
      const evaluated = Cascade.evaluateCSSToCSS(context, visited, property);
      const expected =
        2 * nativeLength("cap", 37, { fontFamily: "Courier New" }) + 1;
      expect(evaluated.num).withContext(property).toBeCloseTo(expected, 3);
      expect(evaluated.unit).toBe("px");
    }
  });
});
