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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle.js. If not, see <http://www.gnu.org/licenses/>.
 */

import * as Css from "../../../src/vivliostyle/css";
import * as CssCascade from "../../../src/vivliostyle/css-cascade";
import * as CssParser from "../../../src/vivliostyle/css-parser";
import * as CssTokenizer from "../../../src/vivliostyle/css-tokenizer";
import * as CssValidator from "../../../src/vivliostyle/css-validator";
import * as Exprs from "../../../src/vivliostyle/exprs";
import { FontMetrics } from "../../../src/vivliostyle/font-metrics";
import * as Vgen from "../../../src/vivliostyle/vgen";

// Firefox can quantize both independently measured values by one layout unit.
// Allow two 1/60px units, plus CSSOM decimal serialization, when comparing them.
function expectFontMetricLength(actual, expected) {
  expect(Math.abs(actual - expected)).toBeLessThan(2 / 60 + 0.0001);
}

describe("vgen", function () {
  it("preserves em and lh for a browser-resolved font shorthand", function () {
    const scope = new Exprs.LexicalScope(null);
    const context = new Exprs.Context(scope, 800, 600, 16, 20);
    const parent = document.createElement("div");
    const actual = parent.appendChild(document.createElement("div"));
    const reference = parent.appendChild(document.createElement("div"));
    parent.style.cssText = "font:16px/20px serif";
    reference.style.cssText = "font:10svw/1.5 serif;width:1em;height:1lh";
    document.body.append(parent);
    const computedStyle = {
      width: new Css.Numeric(1, "em"),
      height: new Css.Numeric(1, "lh"),
    };
    CssValidator.baseValidatorSet().validatePropertyAndHandleShorthand(
      "font",
      CssParser.parseValue(
        scope,
        new CssTokenizer.Tokenizer("10svw/1.5 serif", null),
        "",
      ),
      false,
      scope,
      {
        simpleProperty(name, value) {
          computedStyle[name] = value;
        },
        invalidPropertyValue() {
          fail("font shorthand rejected");
        },
        unknownProperty() {
          fail("font shorthand unrecognized");
        },
      },
    );
    const factory = Object.create(Vgen.ViewFactory.prototype);
    Object.assign(factory, {
      context,
      viewport: { window, layoutUnitAdj: 0 },
      xmldoc: { url: document.URL },
      sourceNode: actual,
      nodeContext: { parent: { viewNode: parent } },
    });
    try {
      factory.applyComputedStyles(actual, computedStyle);
      expect(actual.style.width).toBe("1em");
      expect(actual.style.height).toBe("1lh");
      for (const name of ["fontSize", "lineHeight", "width", "height"]) {
        expectFontMetricLength(
          parseFloat(getComputedStyle(actual)[name]),
          parseFloat(getComputedStyle(reference)[name]),
        );
      }
    } finally {
      parent.remove();
    }
  });

  it("resolves dependent em using a font size measured in the parent font", function () {
    const parent = document.createElement("div");
    parent.style.cssText = 'font:32px "Courier New"';
    const child = parent.appendChild(document.createElement("span"));
    child.style.fontSize = "2cap";
    document.body.append(parent);
    const context = new Exprs.Context(
      new Exprs.LexicalScope(null),
      800,
      600,
      16,
      20,
    );
    context.fontMetrics = new FontMetrics(document);
    const factory = Object.create(Vgen.ViewFactory.prototype);
    Object.assign(factory, {
      context,
      viewport: { window },
      nodeContext: { parent: { viewNode: parent } },
      getParentComputedMetrics: () => ({ fontSize: 32, lineHeight: 40 }),
    });
    try {
      expectFontMetricLength(
        factory.getEmUnitSize("margin-left", new Css.Numeric(2, "cap")),
        parseFloat(getComputedStyle(child).fontSize),
      );
    } finally {
      parent.remove();
    }
  });

  describe("inheritFromSourceParent", function () {
    function inherit(
      fontSize,
      lineHeight,
      parentFamily,
      currentFamily,
      options = {},
    ) {
      const scope = new Exprs.LexicalScope(null);
      const context = new Exprs.Context(scope, 800, 600, 16, 20);
      context.fontMetrics = new FontMetrics(document);
      const value = (text, priority = 1) =>
        new CssCascade.CascadeValue(
          CssParser.parseValue(
            scope,
            new CssTokenizer.Tokenizer(text, null),
            "",
          ),
          priority,
        );
      const root = document.createElement("div");
      const parent = root.appendChild(document.createElement("p"));
      const footnote = parent.appendChild(document.createElement("span"));
      const currentStyle = {
        "font-size": value(fontSize),
        "line-height": value(lineHeight),
      };
      for (const [name, text] of Object.entries(options.properties || {})) {
        currentStyle[name] = value(text);
      }
      if (currentFamily)
        currentStyle["font-family"] = value(currentFamily, options.ownPriority);
      if (options.region)
        currentStyle._regions = {
          footnote: Object.fromEntries(
            Object.entries(options.region).map(([name, text]) => [
              name,
              value(text),
            ]),
          ),
        };
      if (options.conditional)
        currentStyle._viewConditionalStyles = [
          {
            matcher: { matches: () => true },
            styles: Object.fromEntries(
              Object.entries(options.conditional).map(([name, text]) => [
                name,
                value(text),
              ]),
            ),
          },
        ];
      const parentStyle = {
        "font-size": value("20px"),
        "line-height": value(options.parentLineHeight || "1.5"),
      };
      if (parentFamily)
        parentStyle["font-family"] = value(
          parentFamily,
          options.parentPriority,
        );
      if (options.parentFontWeight)
        parentStyle["font-weight"] = value(options.parentFontWeight);
      if (options.parentConditional)
        parentStyle._viewConditionalStyles = [
          {
            matcher: {
              matches: () => options.parentConditionalMatches !== false,
            },
            styles: Object.fromEntries(
              Object.entries(options.parentConditional).map(([name, text]) => [
                name,
                value(text),
              ]),
            ),
          },
        ];
      if (options.parentRegion)
        parentStyle._regions = {
          footnote: Object.fromEntries(
            Object.entries(options.parentRegion).map(([name, text]) => [
              name,
              value(text, 10000),
            ]),
          ),
        };
      const styles = new Map([
        [root, { "font-size": value("16px"), "line-height": value("40px") }],
        [parent, parentStyle],
        [footnote, currentStyle],
      ]);
      const factory = {
        context,
        regionIds: [],
        isFootnote: true,
        styler: { getStyle: (element) => styles.get(element) },
      };
      return Vgen.ViewFactory.prototype.inheritFromSourceParent.call(
        factory,
        { sourceNode: footnote, shadowContext: null, parent: null },
        currentStyle,
      ).elementStyle;
    }

    it("uses ancestor view-conditional metrics without the child's region rules", function () {
      const parent = document.createElement("div");
      const child = parent.appendChild(document.createElement("span"));
      document.body.append(parent);
      try {
        for (const matches of [true, false]) {
          parent.style.cssText = matches
            ? "font:700 28px/60px Arial"
            : 'font:20px/30px "Courier New"';
          for (const fontSize of ["2cap", "1lh"]) {
            child.style.cssText = `font-family:Courier New;font-size:${fontSize}`;
            const style = inherit(
              fontSize,
              "normal",
              '"Courier New"',
              '"Courier New"',
              {
                parentConditionalMatches: matches,
                parentConditional: {
                  "font-family": "Arial",
                  "font-size": "28px",
                  "font-weight": "700",
                  "line-height": "60px",
                },
                parentRegion: {
                  "font-family": "Verdana",
                  "font-size": "80px",
                  "line-height": "90px",
                },
              },
            );
            expectFontMetricLength(
              style["font-size"].value.num,
              parseFloat(getComputedStyle(child).fontSize),
            );
          }
        }
      } finally {
        parent.remove();
      }
    });

    it("uses parent font metrics for font-size and current metrics for line-height", function () {
      const parent = document.createElement("div");
      parent.style.cssText = 'font:20px "Courier New"';
      const child = parent.appendChild(document.createElement("span"));
      child.style.cssText =
        "font-family:Arial;font-size:calc(2cap + 1px);line-height:3cap";
      document.body.append(parent);
      try {
        const native = getComputedStyle(child);
        const style = inherit(
          "calc(2cap + 1px)",
          "3cap",
          '"Courier New"',
          "Arial",
        );
        const context = new Exprs.Context(
          new Exprs.LexicalScope(null),
          800,
          600,
          16,
          20,
        );
        const size = CssCascade.evaluateCSSToCSS(
          context,
          style["font-size"].value,
          "font-size",
        );
        const height = CssCascade.evaluateCSSToCSS(
          context,
          style["line-height"].value,
          "line-height",
        );
        expectFontMetricLength(size.num, parseFloat(native.fontSize));
        expectFontMetricLength(height.num, parseFloat(native.lineHeight));
        expect(style["font-family"].value.toString()).toBe("Arial");
      } finally {
        parent.remove();
      }
    });

    it("does not let inherited font priority override a footnote region declaration", function () {
      const style = inherit(
        "calc(2cap + 1px)",
        "normal",
        '"Courier New"',
        null,
        { parentPriority: 10000, region: { "font-family": "Arial" } },
      );
      const context = new Exprs.Context(
        new Exprs.LexicalScope(null),
        800,
        600,
        16,
        20,
      );
      const merged = CssCascade.flattenCascadedStyle(style, context, [], true);
      expect(merged["font-family"].value.toString()).toBe("Arial");
      const probe = document.createElement("span");
      probe.style.cssText = 'font:20px "Courier New";margin-left:2cap';
      document.body.append(probe);
      try {
        expectFontMetricLength(
          CssCascade.evaluateCSSToCSS(
            context,
            style["font-size"].value,
            "font-size",
          ).num,
          parseFloat(getComputedStyle(probe).marginLeft) + 1,
        );
      } finally {
        probe.remove();
      }
    });

    it("keeps own font declarations authoritative and lets view conditions replace inheritance", function () {
      const context = new Exprs.Context(
        new Exprs.LexicalScope(null),
        800,
        600,
        16,
        20,
      );
      const own = inherit("16px", "normal", '"Courier New"', "Verdana", {
        ownPriority: 10000,
        parentPriority: 20000,
        region: { "font-family": "Arial" },
      });
      expect(
        CssCascade.flattenCascadedStyle(own, context, [], true)[
          "font-family"
        ].value.toString(),
      ).toBe("Verdana");
      const conditional = inherit("16px", "normal", '"Courier New"', null, {
        parentPriority: 10000,
        conditional: { "font-family": "Arial" },
      });
      expect(
        CssCascade.flattenCascadedStyle(conditional, context, [], true)[
          "font-family"
        ].value.toString(),
      ).toBe("Arial");
    });

    it("uses winning region and view fonts for dependent lengths after resolving font-size", function () {
      const parent = document.createElement("div");
      parent.style.cssText = 'font:20px "Courier New"';
      const child = parent.appendChild(document.createElement("span"));
      document.body.append(parent);
      try {
        for (const rule of ["region", "conditional"]) {
          for (const size of ["20px", "calc(2cap + 1px)"]) {
            child.style.cssText = `font-family:Arial;font-size:${size};line-height:2cap;letter-spacing:1cap`;
            const native = getComputedStyle(child);
            const style = inherit(size, "2cap", '"Courier New"', null, {
              parentPriority: 10000,
              [rule]: { "font-family": "Arial" },
              properties: { "letter-spacing": "1cap" },
            });
            const context = new Exprs.Context(
              new Exprs.LexicalScope(null),
              800,
              600,
              16,
              20,
            );
            for (const [name, nativeValue] of [
              ["font-size", native.fontSize],
              ["line-height", native.lineHeight],
              ["letter-spacing", native.letterSpacing],
            ]) {
              const actual = CssCascade.evaluateCSSToCSS(
                context,
                style[name].value,
                name,
              );
              expectFontMetricLength(actual.num, parseFloat(nativeValue));
            }
          }
        }
      } finally {
        parent.remove();
      }
    });

    it("leaves metric lengths for the winning region or view font-size to resolve", function () {
      for (const rule of ["region", "conditional"]) {
        for (const fontSize of ["40px", "2em"]) {
          const style = inherit("20px", "normal", '"Courier New"', null, {
            parentPriority: 10000,
            [rule]: { "font-size": fontSize },
            properties: { "letter-spacing": "1cap" },
          });
          expect(style["letter-spacing"].value.toString())
            .withContext(`${rule}: ${fontSize}`)
            .toBe("1cap");
          const flattened = CssCascade.flattenCascadedStyle(
            style,
            new Exprs.Context(new Exprs.LexicalScope(null), 800, 600, 16, 20),
            [],
            rule === "region",
          );
          expect(flattened["font-size"].value.toString())
            .withContext(`${rule}: ${fontSize}`)
            .toBe(fontSize);
        }
      }
    });

    it("leaves metric lengths for a relative winning region or view font-weight to resolve", function () {
      for (const rule of ["region", "conditional"]) {
        const style = inherit("20px", "2cap", '"Courier New"', null, {
          parentFontWeight: "900",
          [rule]: { "font-weight": "lighter" },
          properties: { "letter-spacing": "1cap" },
        });
        expect(style["line-height"].value.toString())
          .withContext(`${rule}: line-height`)
          .toBe("2cap");
        expect(style["letter-spacing"].value.toString())
          .withContext(`${rule}: letter-spacing`)
          .toBe("1cap");
        const flattened = CssCascade.flattenCascadedStyle(
          style,
          new Exprs.Context(new Exprs.LexicalScope(null), 800, 600, 16, 20),
          [],
          rule === "region",
        );
        expect(flattened["font-weight"].value.toString())
          .withContext(`${rule}: font-weight`)
          .toBe("lighter");
      }
    });

    it("resolves source-parent lh before deferring current-font terms", function () {
      const sourceParent = document.createElement("div");
      const renderingParent = document.createElement("div");
      sourceParent.style.cssText = "font:20px/60px Arial";
      renderingParent.style.cssText = "font:16px/12px Arial";
      const reference = sourceParent.appendChild(
        document.createElement("span"),
      );
      const actual = renderingParent.appendChild(
        document.createElement("span"),
      );
      document.body.append(sourceParent, renderingParent);
      try {
        for (const rule of ["region", "conditional"]) {
          for (const override of [
            { "font-size": "40px" },
            { "font-weight": "lighter" },
          ]) {
            const size = override["font-size"] || "20px";
            reference.style.cssText = `font-size:${size};font-weight:100;line-height:calc(1lh + 1cap)`;
            const style = inherit("20px", "calc(1lh + 1cap)", "Arial", null, {
              parentLineHeight: "60px",
              [rule]: override,
            });
            const lineHeight = style["line-height"].value.toString();
            expect(lineHeight).toContain("60px");
            expect(lineHeight).toContain("1cap");
            expect(lineHeight).not.toMatch(/\blh\b/);
            actual.style.cssText = `font-size:${size};font-weight:100;line-height:${lineHeight}`;
            expectFontMetricLength(
              parseFloat(getComputedStyle(actual).lineHeight),
              parseFloat(getComputedStyle(reference).lineHeight),
            );
          }
        }
      } finally {
        sourceParent.remove();
        renderingParent.remove();
      }
    });

    it("resolves an lh font size before applying its own line height", function () {
      const style = inherit("1lh", "1");
      expect(style["font-size"].value.toString()).toBe("30px");
      expect(style["line-height"].value.toString()).toBe("1");
    });

    it("resolves both lh declarations against the source parent", function () {
      const style = inherit("1lh", "2lh");
      expect(style["font-size"].value.toString()).toBe("30px");
      expect(style["line-height"].value.toString()).toBe("60px");
    });

    it("keeps the source parent line height for a font size calculation", function () {
      const style = inherit("calc(1lh + 2px)", "1");
      const fontSize = CssCascade.evaluateCSSToCSS(
        new Exprs.Context(new Exprs.LexicalScope(null), 800, 600, 16, 20),
        style["font-size"].value,
        "font-size",
      );
      expect(fontSize.toString()).toBe("32px");
      expect(style["line-height"].value.toString()).toBe("1");
    });
  });
});
