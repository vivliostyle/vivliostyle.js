/** Copyright 2026 Vivliostyle Foundation. Licensed under AGPL-3.0. */
import * as Vtree from "../../../src/vivliostyle/vtree";
import * as Layout from "../../../src/vivliostyle/layout";
import * as Helper from "../../../src/vivliostyle/layout-helper";
import * as Geometry from "../../../src/vivliostyle/geometry-util";
import * as Cascade from "../../../src/vivliostyle/css-cascade";
import * as Css from "../../../src/vivliostyle/css";
import * as Exprs from "../../../src/vivliostyle/exprs";
import * as CssPage from "../../../src/vivliostyle/css-page";
import * as Constants from "../../../src/vivliostyle/constants";

describe("writing-mode layout geometry", () => {
  const box = {
    left: 10,
    right: 110,
    top: 20,
    bottom: 220,
    width: 100,
    height: 200,
  };
  const cases = [
    ["horizontal-tb", 20, 220, 10, 110, 1],
    ["vertical-rl", 110, 10, 20, 220, -1],
    ["vertical-lr", 10, 110, 20, 220, 1],
    ["sideways-rl", 110, 10, 20, 220, -1],
    ["sideways-lr", 10, 110, 220, 20, 1],
  ];
  for (const [mode, before, after, start, end, dir] of cases) {
    for (const rtl of [false, true]) {
      it(`measures and positions ${mode}, ${rtl ? "rtl" : "ltr"}`, () => {
        const c = new Vtree.Container(document.createElement("div"));
        c.writingMode = mode;
        c.rtl = rtl;
        expect(c.vertical).toBe(mode !== "horizontal-tb");
        expect(c.getBoxDir()).toBe(dir);
        expect(c.getBeforeEdge(box)).toBe(before);
        expect(c.getAfterEdge(box)).toBe(after);
        expect(c.getStartEdge(box)).toBe(rtl ? end : start);
        expect(c.getEndEdge(box)).toBe(rtl ? start : end);
        c.setBlockPosition(before, 100);
        expect(mode === "horizontal-tb" ? c.top : c.left).toBe(
          dir < 0 ? before - 100 : before,
        );
        c.setInlinePosition(rtl ? end : start, 30);
        const inlineDir = c.getInlineDir();
        expect(mode === "horizontal-tb" ? c.left : c.top).toBe(
          (rtl ? end : start) - (inlineDir < 0 ? 30 : 0),
        );
        c.paddingTop = 2;
        c.paddingBottom = 3;
        c.paddingLeft = 5;
        c.paddingRight = 7;
        expect(c.getInsetBefore() + c.getInsetAfter()).toBe(
          c.vertical ? 12 : 5,
        );
        expect(c.getInsetStart() + c.getInsetEnd()).toBe(c.vertical ? 5 : 12);
        const copy = new Vtree.Container(document.createElement("div"));
        copy.copyFrom(c);
        expect(copy.writingMode).toBe(mode);
        expect(copy.getBoxDir()).toBe(dir);
      });
    }
    it(`detects overflow in ${mode}`, () => {
      const column = Object.create(Layout.Column.prototype);
      column.writingMode = mode;
      column.clientLayout = { pixelRatio: 1 };
      column.footnoteEdge = after;
      expect(column.isOverflown(after + dir * 10)).toBe(true);
      expect(column.isOverflown(after - dir * 10)).toBe(false);
    });
  }
  it("initializes a legacy geometry object even when its orientation is horizontal", () => {
    const column = Object.create(Layout.Column.prototype);
    column.vertical = false;
    expect(column.writingMode).toBe("horizontal-tb");
  });
  it("preserves writing mode when assigning verticality and copying node contexts", () => {
    const context = new Vtree.NodeContext(
      document.createElement("div"),
      null,
      0,
      null,
    );
    context.writingMode = "sideways-lr";
    context.vertical = true;
    expect(context.writingMode).toBe("sideways-lr");
    expect(context.copy().writingMode).toBe("sideways-lr");
    expect(
      new Vtree.NodeContext(document.createElement("span"), context, 1, null)
        .writingMode,
    ).toBe("sideways-lr");
  });
  for (const mode of ["vertical-lr", "sideways-lr"]) {
    it(`normalizes browser overflow columns in ${mode}`, () => {
      const rect = {
        ...box,
        top: mode === "sideways-lr" ? -99980 : 100020,
        bottom: mode === "sideways-lr" ? -99780 : 100220,
      };
      expect(Helper.adjustRectForColumnBreaking(rect, mode)).toBe(1);
      expect(rect.top).toBe(20);
      expect(rect.bottom).toBe(220);
      expect(rect.left).toBe(100010);
      expect(rect.right).toBe(100110);
    });
  }
  it("round-trips geometry in either block direction", () => {
    const rect = new Geometry.Rect(10, 20, 110, 220);
    for (const dir of [-1, 1]) {
      expect(Geometry.unrotateBox(Geometry.rotateBox(rect, dir), dir)).toEqual(
        rect,
      );
    }
  });
});

describe("writing-mode cascade and page progression", () => {
  const context = new Exprs.Context(new Exprs.LexicalScope(null), 800, 600, 16);
  const cascade = (value, priority = 0) =>
    new Cascade.CascadeValue(value, priority);
  for (const mode of [
    "horizontal-tb",
    "vertical-rl",
    "vertical-lr",
    "sideways-rl",
    "sideways-lr",
  ]) {
    it(`resolves ${mode} and preserves cascade priority for logical properties`, () => {
      const style = {
        "writing-mode": cascade(Css.getName(mode)),
        "margin-block-start": cascade(new Css.Numeric(12, "px"), 2),
        "margin-left": cascade(new Css.Numeric(3, "px"), 1),
      };
      expect(Cascade.resolveWritingMode(style, context, "vertical-rl")).toBe(
        mode,
      );
      const result = {};
      Cascade.convertToPhysical(
        style,
        result,
        mode,
        false,
        false,
        (_name, value) => value.value,
      );
      const side = mode.endsWith("-lr")
        ? "left"
        : mode === "horizontal-tb"
          ? "top"
          : "right";
      expect(result[`margin-${side}`].num).toBe(12);
      expect(CssPage.resolvePageProgression(style)).toBe(
        mode.endsWith("-rl")
          ? Constants.PageProgression.RTL
          : Constants.PageProgression.LTR,
      );
    });
  }
  for (const value of [Css.ident.inherit, Css.ident.unset]) {
    it(`inherits writing-mode: ${value}`, () => {
      expect(
        Cascade.resolveWritingMode(
          { "writing-mode": cascade(value) },
          context,
          "sideways-lr",
        ),
      ).toBe("sideways-lr");
    });
  }
  for (const [legacy, mode] of [
    ["rl", "horizontal-tb"],
    ["lr-tb", "horizontal-tb"],
    ["tb-rl", "vertical-rl"],
  ]) {
    it(`normalizes legacy SVG writing-mode: ${legacy}`, () => {
      expect(
        Cascade.resolveWritingMode(
          { "writing-mode": cascade(Css.getName(legacy)) },
          context,
          "horizontal-tb",
        ),
      ).toBe(mode);
    });
  }
  it("resets writing-mode: initial", () => {
    expect(
      Cascade.resolveWritingMode(
        { "writing-mode": cascade(Css.ident.initial) },
        context,
        "sideways-lr",
      ),
    ).toBe("horizontal-tb");
  });
});
