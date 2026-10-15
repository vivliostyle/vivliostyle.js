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
import * as Exprs from "../../../src/vivliostyle/exprs";
import { FontMetrics } from "../../../src/vivliostyle/font-metrics";
import * as Vgen from "../../../src/vivliostyle/vgen";

describe("vgen", function () {
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
      expect(
        factory.getEmUnitSize("margin-left", new Css.Numeric(2, "cap")),
      ).toBeCloseTo(parseFloat(getComputedStyle(child).fontSize), 3);
    } finally {
      parent.remove();
    }
  });

  describe("inheritFromSourceParent", function () {
    function inherit(fontSize, lineHeight, parentFamily, currentFamily) {
      const scope = new Exprs.LexicalScope(null);
      const context = new Exprs.Context(scope, 800, 600, 16, 20);
      context.fontMetrics = new FontMetrics(document);
      const value = (text) =>
        new CssCascade.CascadeValue(
          CssParser.parseValue(
            scope,
            new CssTokenizer.Tokenizer(text, null),
            "",
          ),
          1,
        );
      const root = document.createElement("div");
      const parent = root.appendChild(document.createElement("p"));
      const footnote = parent.appendChild(document.createElement("span"));
      const currentStyle = {
        "font-size": value(fontSize),
        "line-height": value(lineHeight),
      };
      if (currentFamily) currentStyle["font-family"] = value(currentFamily);
      const parentStyle = {
        "font-size": value("20px"),
        "line-height": value("1.5"),
      };
      if (parentFamily) parentStyle["font-family"] = value(parentFamily);
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
        expect(size.num).toBeCloseTo(parseFloat(native.fontSize), 2);
        expect(height.num).toBeCloseTo(parseFloat(native.lineHeight), 2);
        expect(style["font-family"].value.toString()).toBe("Arial");
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
