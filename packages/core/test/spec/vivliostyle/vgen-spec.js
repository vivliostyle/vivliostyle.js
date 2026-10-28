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
import * as Display from "../../../src/vivliostyle/display";
import * as Exprs from "../../../src/vivliostyle/exprs";
import { FontMetrics } from "../../../src/vivliostyle/font-metrics";
import * as Vgen from "../../../src/vivliostyle/vgen";

// Firefox can quantize both independently measured values by one layout unit.
// Allow two 1/60px units, plus CSSOM decimal serialization, when comparing them.
function expectFontMetricLength(actual, expected) {
  expect(Math.abs(actual - expected)).toBeLessThan(2 / 60 + 0.0001);
}

describe("vgen", function () {
  describe("orthogonal inline sizing", function () {
    function compute(
      mode,
      parentSize,
      display,
      size,
      parentDisplay = "",
      ratio = "",
      ancestorSize = "",
      options = {},
    ) {
      const scope = new Exprs.LexicalScope(null);
      scope.defineName("left-page", new Exprs.Const(scope, false));
      const context = new Exprs.Context(scope, 800, 600, 16);
      context.style = { pageScope: scope };
      context.pageAreaWidth = 700;
      context.pageAreaHeight = 500;
      const vertical = mode !== "horizontal-tb";
      const dimension = vertical ? "height" : "width";
      const parent = document.createElement("div");
      parent.style[dimension] = parentSize;
      parent.style.aspectRatio = ratio;
      parent.style.display = parentDisplay;
      parent.style.overflow = parentDisplay === "block" ? "hidden" : "";
      if (ratio && ratio !== "auto") {
        parent.style[vertical ? "width" : "height"] = "100px";
      }
      const ancestor = document.createElement("div");
      ancestor.style[dimension] = ancestorSize;
      ancestor.appendChild(parent);
      Object.assign(ancestor.style, options.ancestorStyle);
      const source = document.createElement(
        display === "inline" ? "progress" : "div",
      );
      const factory = Object.create(Vgen.ViewFactory.prototype);
      Object.assign(factory, {
        context,
        nodeContext: {
          parent: { viewNode: parent },
          isInsideBFC: () => !!parentDisplay,
        },
        sourceNode: source,
        xmldoc: { root: document.createElement("html") },
        regionIds: [],
      });
      const style = {
        "writing-mode": new CssCascade.CascadeValue(Css.getName(mode), 1),
        display: new CssCascade.CascadeValue(Css.getName(display), 1),
      };
      if (size) {
        style[dimension] = new CssCascade.CascadeValue(size, 1);
      }
      for (const name of ["float", "position"]) {
        if (options[name])
          style[name] = new CssCascade.CascadeValue(
            Css.getName(options[name]),
            1,
          );
      }
      options.configure?.({ parent, ancestor, factory });
      const result = {};
      try {
        factory.computeStyle(
          vertical ? "horizontal-tb" : "vertical-lr",
          false,
          style,
          result,
        );
        return result[dimension];
      } finally {
        ancestor.remove();
      }
    }

    it("bounds repeated percentage/ratio resolution in deeply nested wrappers", function () {
      let reads = 0;
      const result = compute(
        "vertical-lr",
        "100%",
        "block",
        undefined,
        "",
        "1 / 1",
        "",
        {
          configure({ parent, ancestor }) {
            let child = parent;
            for (let i = 0; i < 20; i++) {
              child.style.cssText = "width:100%;height:100%;aspect-ratio:1/1";
              const style = child.style;
              Object.defineProperty(child, "style", {
                get() {
                  if (++reads > 500)
                    throw new Error("Repeated sizing states exceeded bound");
                  return style;
                },
              });
              const wrapper = document.createElement("div");
              ancestor.appendChild(wrapper);
              wrapper.appendChild(child);
              child = wrapper;
            }
          },
        },
      );
      expect(result).toBe(Css.ident.max_content);
      expect(reads).toBeLessThan(500);
    });
    it("does not read ancestor styles without a writing-axis change", function () {
      expect(
        compute("horizontal-tb", "", "block", undefined, "", "", "", {
          configure({ parent, factory }) {
            const original = factory.computeStyle;
            factory.computeStyle = function (_mode, ...args) {
              return original.call(this, "horizontal-tb", ...args);
            };
            Object.defineProperty(parent, "style", {
              get() {
                throw new Error("Unnecessary ancestor traversal");
              },
            });
          },
        }),
      ).toBeUndefined();
    });
    for (const display of [Css.ident.inline_grid, Css.ident.inline_flex]) {
      it(`establishes a browser formatting context for ${display}`, function () {
        expect(Display.establishesBFC(display)).toBeTrue();
      });
    }
    for (const mode of [
      "vertical-rl",
      "vertical-lr",
      "sideways-rl",
      "sideways-lr",
      "horizontal-tb",
    ]) {
      it(`preserves percentages against a definite containing block in ${mode}`, function () {
        const percent = new Css.Numeric(100, "%");
        expect(compute(mode, "100px", "block", percent)).toEqual(percent);
      });
      it(`preserves auto sizing and available margin space in ${mode}`, function () {
        expect(compute(mode, "200px", "block")).toBeUndefined();
        expect(compute(mode, "200px", "block", Css.ident.auto)).toBe(
          Css.ident.auto,
        );
      });
      it(`keeps intrinsic inline control sizing in ${mode}`, function () {
        expect(compute(mode, "", "inline")).toBeUndefined();
      });
      it(`lets browser formatting contexts resolve orthogonal sizes in ${mode}`, function () {
        expect(compute(mode, "", "block", undefined, "flex")).toBeUndefined();
        const percent = new Css.Numeric(100, "%");
        expect(compute(mode, "", "block", percent, "flex")).toEqual(percent);
      });
      it(`preserves percentage resolution with a parent aspect ratio in ${mode}`, function () {
        const percent = new Css.Numeric(100, "%");
        expect(compute(mode, "", "block", percent, "", "1 / 1")).toEqual(
          percent,
        );
      });
      it(`retains fallback inside indefinite ordinary BFCs in ${mode}`, function () {
        for (const display of ["flow-root", "block"]) {
          const expected = new Css.Numeric(
            mode === "horizontal-tb" ? 700 : 500,
            "px",
          );
          expect(
            compute(mode, "", "block", new Css.Numeric(100, "%"), display),
          ).toEqual(expected);
        }
      });
      it(`treats an auto aspect ratio as omitted in ${mode}`, function () {
        expect(compute(mode, "", "block", undefined, "", "auto")).toBe(
          Css.ident.max_content,
        );
      });
      it(`resolves parent percentage bases before suppressing fallback in ${mode}`, function () {
        const percent = new Css.Numeric(100, "%");
        for (const parentSize of ["100%", "calc(100% - 10px)"]) {
          expect(compute(mode, parentSize, "block", percent)).toEqual(
            new Css.Numeric(mode === "horizontal-tb" ? 700 : 500, "px"),
          );
          expect(
            compute(mode, parentSize, "block", percent, "", "", "200px"),
          ).toEqual(percent);
        }
      });
      it(`skips boxless and inline parents when finding the containing block in ${mode}`, function () {
        const percent = new Css.Numeric(100, "%");
        const fallback = new Css.Numeric(
          mode === "horizontal-tb" ? 700 : 500,
          "px",
        );
        for (const display of ["contents", "inline"]) {
          expect(compute(mode, "100px", "block", percent, display)).toEqual(
            fallback,
          );
          expect(
            compute(mode, "", "block", percent, display, "", "200px"),
          ).toEqual(percent);
          expect(
            compute(mode, "100%", "block", percent, "", "", "200px", {
              ancestorStyle: { display },
            }),
          ).toEqual(fallback);
        }
      });
      it(`uses the ratio after an unresolved percentage becomes auto in ${mode}`, function () {
        const percent = new Css.Numeric(100, "%");
        for (const parentSize of ["100%", "calc(100% - 10px)"]) {
          expect(
            compute(mode, parentSize, "block", percent, "", "1 / 1"),
          ).toEqual(percent);
        }
      });
      it(`uses normalized display for blockified inline fallback in ${mode}`, function () {
        for (const options of [{ float: "left" }, { position: "absolute" }]) {
          expect(
            compute(mode, "", "inline", undefined, "", "", "", options),
          ).toBe(Css.ident.max_content);
        }
      });
      it(`retains fallback for degenerate preferred ratios in ${mode}`, function () {
        for (const ratio of ["0 / 1", "1 / 0", "0 / 0", "auto 0 / 1"]) {
          expect(compute(mode, "", "block", undefined, "", ratio)).toBe(
            Css.ident.max_content,
          );
        }
      });
      it(`ignores host flex/grid styles beyond viewRoot in ${mode}`, function () {
        for (const display of ["flex", "grid"]) {
          expect(
            compute(mode, "", "block", undefined, "", "", "", {
              configure({ ancestor, factory }) {
                factory.viewRoot = ancestor;
                const host = document.createElement("div");
                host.style.display = display;
                host.appendChild(ancestor);
              },
            }),
          ).toBe(Css.ident.max_content);
        }
      });
      it(`recognizes writing-mode-induced inline-block parents in ${mode}`, function () {
        const percent = new Css.Numeric(100, "%");
        for (const display of ["inline", "inline-block"]) {
          expect(
            compute(mode, "100px", "block", percent, display, "", "", {
              configure({ parent, ancestor }) {
                const vertical = mode !== "horizontal-tb";
                ancestor.style.writingMode = mode;
                parent.style.writingMode = vertical
                  ? "horizontal-tb"
                  : "vertical-lr";
                document.body.append(ancestor);
                expect(getComputedStyle(parent).display).toBe("inline-block");
              },
            }),
          ).toEqual(percent);
        }
      });
      it(`retains fallback for indefinite wrappers inside flex/grid items in ${mode}`, function () {
        const fallback = new Css.Numeric(
          mode === "horizontal-tb" ? 700 : 500,
          "px",
        );
        for (const display of ["flex", "grid"]) {
          for (const wrapper of ["flow-root", "block"]) {
            expect(
              compute(
                mode,
                "",
                "block",
                new Css.Numeric(100, "%"),
                wrapper,
                "",
                "200px",
                {
                  configure({ ancestor }) {
                    const layout = document.createElement("div");
                    layout.style.display = display;
                    layout.append(ancestor);
                  },
                },
              ),
            ).toEqual(fallback);
          }
          expect(
            compute(mode, "", "block", undefined, "", "", "", {
              ancestorStyle: { display },
            }),
          ).toBeUndefined();
        }
      });
      it(`retains the page-area fallback for indefinite blocks in ${mode}`, function () {
        expect(compute(mode, "", "block")).toBe(Css.ident.max_content);
        expect(compute(mode, "", "block", new Css.Numeric(100, "%"))).toEqual(
          new Css.Numeric(mode === "horizontal-tb" ? 700 : 500, "px"),
        );
      });
    }
  });

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

  it("uses parent normal metrics for font-size while re-resolving inherited normal for ordinary lh", function () {
    const parent = document.createElement("div");
    parent.style.cssText = 'font:37px/normal "Courier New";margin-left:1lh';
    const child = parent.appendChild(document.createElement("div"));
    const reference = parent.appendChild(document.createElement("div"));
    reference.style.cssText = "font-size:16px;font-family:Arial;width:1lh";
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
      viewport: { window, layoutUnitAdj: 0, layoutUnitPerPixel: 64 },
      xmldoc: { url: document.URL },
      sourceNode: child,
      nodeContext: { parent: { viewNode: parent } },
    });
    try {
      expectFontMetricLength(
        factory.getLineHeightUnitSize("font-size"),
        parseFloat(getComputedStyle(parent).marginLeft),
      );
      factory.applyComputedStyles(child, {
        "font-family": new Css.Str("Arial"),
        "font-size": new Css.Numeric(16, "px"),
        width: new Css.Numeric(1, "lh"),
      });
      expectFontMetricLength(
        parseFloat(getComputedStyle(child).width),
        parseFloat(getComputedStyle(reference).width),
      );
      expect(getComputedStyle(child).lineHeight).toBe("normal");
      const metrics = factory.getComputedFontMetrics(child, {
        fontSize: 37,
        lineHeight: 99,
      });
      expectFontMetricLength(
        metrics.lineHeight,
        parseFloat(getComputedStyle(reference).width),
      );
    } finally {
      parent.remove();
    }
  });

  it("preserves normal for explicit line-height resets on the source root", function () {
    for (const keyword of [
      Css.ident.initial,
      Css.ident.inherit,
      Css.ident.unset,
    ]) {
      const context = new Exprs.Context(
        new Exprs.LexicalScope(null),
        800,
        600,
        16,
        20,
      );
      context.fontMetrics = new FontMetrics(document);
      const source = document.createElement("html");
      const style = { "line-height": new CssCascade.CascadeValue(keyword, 1) };
      const factory = {
        context,
        regionIds: [],
        styler: { getStyle: () => style },
      };
      const result = Vgen.ViewFactory.prototype.inheritFromSourceParent.call(
        factory,
        { sourceNode: source, shadowContext: null, parent: null },
        style,
      ).elementStyle;
      expect([Css.ident.initial, Css.ident.normal]).toContain(
        result["line-height"].value,
      );
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

    it("uses source-parent normal metrics before applying the child's different font", function () {
      const parent = document.createElement("div");
      parent.style.cssText = 'font:20px/normal "Courier New";margin-left:1lh';
      document.body.append(parent);
      try {
        const expected = parseFloat(getComputedStyle(parent).marginLeft);
        for (const lineHeight of ["normal", "1lh", "calc(1lh + 2px)"]) {
          const style = inherit("1lh", lineHeight, '"Courier New"', "Arial", {
            parentLineHeight: "normal",
          });
          expectFontMetricLength(style["font-size"].value.num, expected);
          if (lineHeight === "normal") {
            expect(style["line-height"].value).toBe(Css.ident.normal);
          } else {
            expectFontMetricLength(
              style["line-height"].value.num,
              expected + (lineHeight.includes("calc") ? 2 : 0),
            );
          }
        }
      } finally {
        parent.remove();
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
