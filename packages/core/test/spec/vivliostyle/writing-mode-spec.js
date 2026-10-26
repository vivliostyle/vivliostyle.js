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
import * as PageMaster from "../../../src/vivliostyle/page-master";
import * as Ops from "../../../src/vivliostyle/ops";
import * as PageFloats from "../../../src/vivliostyle/page-floats";
import * as Footnotes from "../../../src/vivliostyle/footnotes";
import * as Vgen from "../../../src/vivliostyle/vgen";
import * as Task from "../../../src/vivliostyle/task";

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

describe("writing-mode review regressions", () => {
  const context = new Exprs.Context(new Exprs.LexicalScope(null), 800, 600, 16);
  for (const mode of [
    "horizontal-tb",
    "vertical-rl",
    "vertical-lr",
    "sideways-rl",
    "sideways-lr",
  ]) {
    it(`normalizes substituted ${mode} keywords`, () => {
      const style = {
        "writing-mode": new Cascade.CascadeValue(
          Css.getName(mode.toUpperCase()),
          0,
        ),
      };
      const resolved = Cascade.resolveWritingMode(
        style,
        context,
        "horizontal-tb",
      );
      expect(resolved).toBe(mode);
      expect(() => Cascade.getCouplingMap(resolved, false)).not.toThrow();
    });
  }
  for (const value of [
    Css.getName("unknown"),
    new Css.Numeric(10, "px"),
    new Css.Str("vertical-lr"),
    new Css.SpaceList([Css.ident.vertical_lr, Css.ident.vertical_rl]),
  ]) {
    it(`inherits the mode for an invalid substituted value: ${value}`, () => {
      expect(
        Cascade.resolveWritingMode(
          { "writing-mode": new Cascade.CascadeValue(value, 0) },
          context,
          "sideways-lr",
        ),
      ).toBe("sideways-lr");
    });
  }
  for (const mode of [
    "horizontal-tb",
    "vertical-rl",
    "vertical-lr",
    "sideways-rl",
    "sideways-lr",
  ]) {
    it(`retains ruby end allowance at a closing inline checkpoint in ${mode}`, () => {
      const wrapper = document.createElement("div");
      wrapper.style.writingMode = mode;
      const annotation = document.createElement("span");
      annotation.style.writingMode = mode;
      annotation.setAttribute("data-viv-ruby-end", "5");
      annotation.textContent = "ruby";
      wrapper.appendChild(annotation);
      document.body.appendChild(wrapper);
      try {
        const rect = {
          left: 10,
          right: 110,
          top: 20,
          bottom: 220,
          width: 100,
          height: 200,
        };
        const layout = {
          getElementClientRect: () => ({ ...rect }),
          getElementClientRects: () => [{ ...rect }],
          getElementComputedStyle: (element) => getComputedStyle(element),
        };
        const edge = Helper.calculateEdge(
          { viewNode: annotation, after: true, inline: true, parent: null },
          layout,
          0,
          mode,
        );
        expect(edge).toBe(
          mode === "horizontal-tb" ? 215 : mode.endsWith("-rl") ? 15 : 105,
        );
      } finally {
        wrapper.remove();
      }
    });
  }
  for (const mode of [
    "vertical-rl",
    "vertical-lr",
    "sideways-rl",
    "sideways-lr",
  ]) {
    for (const rightDependsOnWidth of [false, true]) {
      it(`finalizes auto width in ${mode} with ${rightDependsOnWidth ? "left" : "right"} fixed`, () => {
        const instance = Object.create(PageMaster.PageBoxInstance.prototype);
        instance.writingMode = mode;
        instance.vertical = true;
        instance.isAutoWidth = true;
        instance.isAutoHeight = false;
        instance.isRightDependentOnAutoWidth = rightDependsOnWidth;
        instance.getPropAsNumber = (_context, name) => {
          if (name === "width") return instance.calculatedWidth;
          if (name === "left")
            return rightDependsOnWidth
              ? 20
              : 400 - 20 - instance.calculatedWidth;
          return 0;
        };
        instance.getProp = () => null;
        instance.propagateProperty = () => {};
        const container = new Vtree.Container(document.createElement("div"));
        container.writingMode = mode;
        container.setHorizontalPosition(80, 300);
        container.computedBlockSize = 80;
        instance.finishContainer(
          context,
          container,
          { delayedItems: [], fetchers: [] },
          container,
          1,
          {},
          {},
        );
        expect(container.width).toBe(80);
        expect(container.left).toBe(rightDependsOnWidth ? 20 : 300);
        expect(container.element.style.width).toBe("80px");
        expect(container.element.style.left).toBe(
          rightDependsOnWidth ? "20px" : "300px",
        );
      });
    }
  }
});

describe("substituted writing modes in page and region contexts", () => {
  for (const mode of [
    "horizontal-tb",
    "vertical-rl",
    "vertical-lr",
    "sideways-rl",
    "sideways-lr",
  ]) {
    for (const direction of ["ltr", "rtl"]) {
      it(`uses ${mode} page progression after uppercase substitution, ${direction}`, () => {
        const style = {
          "writing-mode": new Cascade.CascadeValue(
            Css.getName(mode.toUpperCase()),
            0,
          ),
          direction: new Cascade.CascadeValue(Css.getName(direction), 0),
        };
        const expected =
          mode.endsWith("-rl") ||
          (mode === "horizontal-tb" && direction === "rtl")
            ? Constants.PageProgression.RTL
            : Constants.PageProgression.LTR;
        expect(CssPage.resolvePageProgression(style)).toBe(expected);
      });
    }
    it(`uses canonical ${mode} in a region float context`, () => {
      const root = PageFloats.RootPageFloatLayoutContext.createRoot();
      const parent = PageFloats.PageFloatLayoutContext.createWithContainer(
        new Vtree.Container(document.createElement("div")),
        root,
        PageFloats.FloatReference.PAGE,
        null,
        null,
        Css.ident.horizontal_tb,
        Css.ident.ltr,
      );
      const box = Object.create(PageMaster.PartitionInstance.prototype);
      box.writingMode = mode;
      box.getProp = (_context, name) =>
        name === "writing-mode"
          ? Css.getName(mode.toUpperCase())
          : Css.ident.ltr;
      const container = new Vtree.Container(document.createElement("div"));
      container.writingMode = mode;
      const region =
        Ops.StyleInstance.prototype.getRegionPageFloatLayoutContext.call(
          {},
          parent,
          box,
          container,
          "body",
        );
      expect(region.writingMode.toString()).toBe(mode);
      expect(() => region.toPhysical("block-start")).not.toThrow();
      expect(region.toPhysical("block-start")).toBe(
        mode === "horizontal-tb"
          ? "top"
          : mode.endsWith("-lr")
            ? "left"
            : "right",
      );
    });
  }
});

describe("legacy progression and propagated footnote writing modes", () => {
  for (const alias of ["tb", "tb-rl", "TB", "TB-RL"]) {
    for (const direction of ["ltr", "rtl"]) {
      it(`uses vertical-rl progression for ${alias}, ${direction}`, () => {
        expect(
          CssPage.resolvePageProgression({
            "writing-mode": new Cascade.CascadeValue(Css.getName(alias), 0),
            direction: new Cascade.CascadeValue(Css.getName(direction), 0),
          }),
        ).toBe(Constants.PageProgression.RTL);
      });
    }
  }
  for (const mode of [
    "horizontal-tb",
    "vertical-rl",
    "vertical-lr",
    "sideways-rl",
    "sideways-lr",
  ]) {
    it(`returns the resolved footnote mode ${mode} without re-reading DOM inheritance`, () => {
      const element = document.createElement("div");
      element.style.writingMode = "horizontal-tb";
      document.body.appendChild(element);
      try {
        const factory = Object.create(Vgen.ViewFactory.prototype);
        factory.footnoteStyle = {};
        factory.computeStyle = jasmine
          .createSpy("computeStyle")
          .and.callFake((_inherited, _rtl, _style, computed) => {
            computed["font-size"] = new Css.Numeric(16, "px");
            return mode;
          });
        factory.getFootnoteAreaInheritedMetrics = () => ({
          fontSize: 16,
          lineHeight: 20,
        });
        factory.getComputedFontMetrics = () => ({
          fontSize: 16,
          lineHeight: 20,
        });
        factory.applyComputedStyles = (target, computed) => {
          if (computed["writing-mode"])
            target.style.writingMode = computed["writing-mode"].toString();
        };
        const result = factory.applyFootnoteStyle(mode, false, element);
        expect(result.get()).toBe(mode);
        expect(factory.computeStyle.calls.mostRecent().args[0]).toBe(mode);
        expect(getComputedStyle(element).writingMode).toBe(mode);
      } finally {
        element.remove();
      }
    });
    it(`retains resolved ${mode} geometry in the footnote float area`, () => {
      const element = document.createElement("div");
      element.style.writingMode = "horizontal-tb";
      document.body.appendChild(element);
      try {
        const area = new Vtree.Container(element);
        area.convertPercentageSizesToPx = () => {};
        const container = new Vtree.Container(document.createElement("div"));
        container.writingMode = mode;
        const apply = jasmine
          .createSpy("applyFootnoteStyle")
          .and.returnValue(Task.newResult(mode));
        const column = {
          layoutContext: {
            applyFootnoteStyle: apply,
            nodeContext: { direction: "ltr" },
          },
          setComputedInsets: () => {},
          setComputedWidthAndHeight: () => {},
          clientLayout: {
            getElementComputedStyle: () => ({ boxSizing: "content-box" }),
          },
          pageFloatLayoutContext: null,
        };
        new Footnotes.FootnoteLayoutStrategy().adjustPageFloatArea(
          area,
          container,
          column,
        );
        expect(apply.calls.mostRecent().args[0]).toBe(mode);
        expect(area.writingMode).toBe(mode);
        expect(area.vertical).toBe(mode !== "horizontal-tb");
      } finally {
        element.remove();
      }
    });
  }
});
