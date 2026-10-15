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
        for (const unit of ["ex", "cap", "ch", "ic"]) {
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
