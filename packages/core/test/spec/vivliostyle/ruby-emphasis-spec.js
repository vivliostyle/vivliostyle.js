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

import * as RubyEmphasis from "../../../src/vivliostyle/ruby-emphasis";
import * as Layout from "../../../src/vivliostyle/layout";
import * as Css from "../../../src/vivliostyle/css";
import * as CssCascade from "../../../src/vivliostyle/css-cascade";
import * as CssParser from "../../../src/vivliostyle/css-parser";
import * as DomUtil from "../../util/dom";

function paragraph() {
  const element = document.createElement("p");
  element.style.cssText =
    "margin: 0; border: 0; padding: 0; font: 20px/34px serif";
  element.innerHTML =
    '<span style="text-emphasis: sesame">文字</span><br><span style="text-emphasis: sesame">文字</span>';
  DomUtil.getDummyContainer().appendChild(element);
  return element;
}

function measuredLayout(
  block,
  { start = 4, end = 0, internal = 0, blockShift = 0, fail = false } = {},
) {
  const children = block.querySelectorAll("span");
  const isOff = () => children[0].style.textEmphasisStyle === "none";
  return {
    getElementComputedStyle: (element) => window.getComputedStyle(element),
    getElementClientRect: () => {
      const height = 68 + (isOff() ? 0 : start + end + internal);
      const top = isOff() ? 0 : blockShift;
      return {
        top,
        bottom: top + height,
        left: 0,
        right: 200,
        width: 200,
        height,
      };
    },
    getRangeClientRects: (range) => {
      if (fail && isOff()) throw new Error("measurement failed");
      const index = range.startContainer.parentElement === children[0] ? 0 : 1;
      const top =
        7 + index * 34 + (isOff() ? 0 : blockShift + start + index * internal);
      return [
        { top, bottom: top + 20, left: 0, right: 40, width: 40, height: 20 },
      ];
    },
  };
}

describe("ruby and emphasis boundary leading", () => {
  it("maps both components of emphasis-position according to writing-mode", () => {
    expect(RubyEmphasis.emphasisSide("horizontal-tb", "under right")).toBe(
      "end",
    );
    expect(RubyEmphasis.emphasisSide("vertical-rl", "under right")).toBe(
      "start",
    );
    expect(RubyEmphasis.emphasisSide("vertical-lr", "under right")).toBe("end");
    expect(RubyEmphasis.emphasisSide("horizontal-tb", "over left")).toBe(
      "start",
    );
    expect(RubyEmphasis.emphasisSide("vertical-rl", "over left")).toBe("end");
    expect(RubyEmphasis.emphasisSide("vertical-lr", "over left")).toBe("start");
  });

  function ruby(writingMode = "horizontal-tb", position = "over") {
    const element = document.createElement("ruby");
    element.style.cssText = `font: 20px/34px serif; writing-mode: ${writingMode}; ruby-position: ${position}`;
    element.innerHTML = "文字<rt>もじ</rt>";
    DomUtil.getDummyContainer().appendChild(element);
    return element;
  }

  const rtStyle = () => ({ display: Css.getName("ruby-text") });
  it("uses ruby base metrics, ignores normal zero, and honors nonzero/auto margins", () => {
    const element = ruby();
    const rt = element.querySelector("rt");
    RubyEmphasis.prepareRubyAnnotation(rt, element, rtStyle(), window);
    expect(rt.getAttribute("data-viv-ruby-start")).toBe("7");
    expect(rt.style.marginBlockStart).toBe("");
    for (const value of [
      new Css.Numeric(3, "px"),
      new Css.Int(3),
      Css.ident.auto,
    ]) {
      rt.style.marginBlockStart = "";
      rt.removeAttribute("data-viv-ruby-start");
      RubyEmphasis.prepareRubyAnnotation(
        rt,
        element,
        { ...rtStyle(), "margin-top": value },
        window,
      );
      expect(rt.hasAttribute("data-viv-ruby-start")).toBeFalse();
      expect(rt.style.marginBlockStart).toBe("");
    }
    for (const value of [Css.numericZero, new Css.Int(0), new Css.Num(0)]) {
      rt.style.marginBlockStart = "";
      rt.removeAttribute("data-viv-ruby-start");
      RubyEmphasis.prepareRubyAnnotation(
        rt,
        element,
        { ...rtStyle(), "margin-top": value },
        window,
      );
      expect(rt.getAttribute("data-viv-ruby-start")).toBe("7");
      expect(rt.style.marginBlockStart).toBe("");
    }
  });

  it("honors important zero margins in stylesheets and style attributes", () => {
    for (const priority of [
      CssParser.SPECIFICITY_AUTHOR_IMPORTANT,
      CssParser.SPECIFICITY_STYLE_IMPORTANT,
      CssParser.SPECIFICITY_USER_IMPORTANT,
    ]) {
      const element = ruby();
      const rt = element.querySelector("rt");
      RubyEmphasis.prepareRubyAnnotation(
        rt,
        element,
        { ...rtStyle(), "margin-top": Css.numericZero },
        window,
        element,
        undefined,
        {
          "margin-top": new CssCascade.CascadeValue(Css.numericZero, priority),
        },
      );
      expect(rt.style.marginBlockStart).toBe("");
    }
  });

  it("compensates CSS ruby spans like native ruby elements", () => {
    const element = document.createElement("span");
    element.style.cssText = "display: ruby; font: 20px/34px serif";
    element.innerHTML =
      '<span style="display: ruby-base">ルビ</span><span style="display: ruby-text; font-size: 50%; line-height: 1">るび</span>';
    DomUtil.getDummyContainer().appendChild(element);
    const text = element.lastElementChild;
    RubyEmphasis.prepareRubyAnnotation(text, element, rtStyle(), window);
    expect(text.getAttribute("data-viv-ruby-start")).toBe("7");
    expect(text.style.marginBlockStart).toBe("");
    text.style.marginBlockStart = "";
    text.removeAttribute("data-viv-ruby-start");
    RubyEmphasis.prepareRubyAnnotation(
      text,
      element,
      { ...rtStyle(), "margin-block-start": Css.numericZero },
      window,
    );
    expect(text.getAttribute("data-viv-ruby-start")).toBe("7");
    expect(text.style.marginBlockStart).toBe("");
    text.style.marginBlockStart = "";
    text.removeAttribute("data-viv-ruby-start");
    RubyEmphasis.prepareRubyAnnotation(
      text,
      element,
      { ...rtStyle(), "margin-block-start": Css.numericZero },
      window,
      element,
      undefined,
      {
        "margin-block-start": new CssCascade.CascadeValue(
          Css.numericZero,
          CssParser.SPECIFICITY_AUTHOR_IMPORTANT,
        ),
      },
    );
    expect(text.style.marginBlockStart).toBe("");
  });

  it("excludes CSS multi-level ruby before later annotations are rendered", () => {
    const source = document.createElement("span");
    source.innerHTML =
      '<span class="base">ルビ</span><span class="text">るび</span><span class="complex">later annotation</span>';
    for (const display of [
      "ruby",
      "ruby-text-container",
      "ruby-base-container",
    ]) {
      const element = ruby();
      const text = element.querySelector("rt");
      RubyEmphasis.prepareRubyAnnotation(
        text,
        element,
        rtStyle(),
        window,
        source,
        (child) => (child.className === "complex" ? display : "inline"),
      );
      expect(text.style.marginBlockStart).toBe("");
    }
  });

  it("maps under and vertical-lr ruby to the appropriate block side", () => {
    for (const [mode, position, side] of [
      ["horizontal-tb", "under", "end"],
      ["vertical-rl", "over", "start"],
      ["vertical-lr", "over", "end"],
      ["vertical-lr", "under", "start"],
    ]) {
      const element = ruby(mode, position);
      const rt = element.querySelector("rt");
      RubyEmphasis.prepareRubyAnnotation(rt, element, rtStyle(), window);
      expect(rt.getAttribute(`data-viv-ruby-${side}`)).toBe("7");
      expect(rt.style.marginBlockStart).toBe("");
      expect(rt.style.marginBlockEnd).toBe("");
    }
  });

  it("does not compensate inter-character ruby, positioned rt, or insufficient line-height", () => {
    const element = ruby("horizontal-tb", "inter-character");
    const rt = element.querySelector("rt");
    RubyEmphasis.prepareRubyAnnotation(
      rt,
      element,
      {
        ...rtStyle(),
        "ruby-position": Css.getName("inter-character"),
      },
      window,
    );
    expect(rt.style.marginBlockStart).toBe("");
    element.style.rubyPosition = "over";
    RubyEmphasis.prepareRubyAnnotation(
      rt,
      element,
      { ...rtStyle(), position: Css.ident.absolute },
      window,
    );
    expect(rt.style.marginBlockStart).toBe("");
    element.style.lineHeight = "20px";
    RubyEmphasis.prepareRubyAnnotation(rt, element, rtStyle(), window);
    expect(rt.style.marginBlockStart).toBe("");
  });

  const actualLayout = () => ({
    getElementComputedStyle: (element) => getComputedStyle(element),
    getElementClientRect: (element) => element.getBoundingClientRect(),
    getRangeClientRects: (range) => Array.from(range.getClientRects()),
  });

  function column(mode = "horizontal-tb") {
    const root = document.createElement("div");
    root.setAttribute("data-vivliostyle-column", "true");
    root.style.cssText = `position:absolute;width:300px;height:204px;left:10px;writing-mode:${mode};font-size:20px;line-height:34px`;
    DomUtil.getDummyContainer().appendChild(root);
    return root;
  }

  function addRuby(root, position = "over", css = false) {
    const element = css
      ? document.createElement("span")
      : document.createElement("ruby");
    element.style.cssText = `display:ruby;ruby-position:${position}`;
    element.innerHTML = css
      ? '<span style="display:ruby-base">文字</span><span style="display:ruby-text;font-size:50%;line-height:1">もじ</span>'
      : '文字<rt style="font-size:50%;line-height:1">もじ</rt>';
    root.appendChild(element);
    RubyEmphasis.prepareRubyAnnotation(
      element.lastChild,
      element,
      rtStyle(),
      window,
    );
    return element;
  }

  function nodes(block) {
    return [{ viewNode: block, inline: false }];
  }

  it("does not measure ordinary text without annotation candidates", () => {
    const root = column();
    const block = document.createElement("p");
    block.textContent = "Ordinary text";
    root.appendChild(block);
    const layout = actualLayout();
    spyOn(layout, "getRangeClientRects").and.callThrough();
    spyOn(layout, "getElementClientRect").and.callThrough();
    RubyEmphasis.adjustAnnotationsForNodes(nodes(block), layout);
    expect(RubyEmphasis.blockEndAllowance(block, layout, false)).toBe(0);
    expect(layout.getRangeClientRects).not.toHaveBeenCalled();
    expect(layout.getElementClientRect).not.toHaveBeenCalled();
  });

  it("defers ruby margins until layout and adjusts only the first base line", () => {
    for (const mode of ["horizontal-tb", "vertical-rl"])
      for (const css of [false, true]) {
        const root = column(mode);
        const block = document.createElement("p");
        block.style.cssText = "margin:0;padding:0";
        root.appendChild(block);
        const first = addRuby(block, "over", css);
        block.appendChild(document.createElement("br"));
        const second = addRuby(block, "over", css);
        expect(first.lastChild.style.marginBlockStart).toBe("");
        RubyEmphasis.adjustAnnotationsForNodes(nodes(block), actualLayout());
        expect(first.lastChild.style.marginBlockStart).toBe("-7px");
        expect(second.lastChild.style.marginBlockStart).toBe("");
        RubyEmphasis.adjustAnnotationsForNodes(nodes(block), actualLayout());
        expect(first.lastChild.style.marginBlockStart).toBe("-7px");
        expect(second.lastChild.style.marginBlockStart).toBe("");
      }
  });

  it("does not move a ruby line following a replaced first line", () => {
    const root = column();
    const block = document.createElement("p");
    block.style.margin = "0";
    root.appendChild(block);
    const image = document.createElement("img");
    image.width = 20;
    image.height = 20;
    block.appendChild(image);
    block.appendChild(document.createElement("br"));
    const element = addRuby(block);
    RubyEmphasis.adjustAnnotationsForNodes(nodes(block), actualLayout());
    expect(element.lastChild.style.marginBlockStart).toBe("");
  });

  it("preserves first-line ruby inside paragraph, ancestor and column start borders", () => {
    for (const mode of ["horizontal-tb", "vertical-rl", "vertical-lr"])
      for (const where of ["paragraph", "ancestor", "column"])
        for (const css of [false, true]) {
          const root = column(mode);
          const wrapper = document.createElement("div");
          root.appendChild(wrapper);
          const block = document.createElement("p");
          block.style.cssText = "margin:0;padding:0";
          wrapper.appendChild(block);
          const border =
            where === "paragraph" ? block : where === "column" ? root : wrapper;
          border.style.borderBlockStart = "1px solid";
          const element = addRuby(
            block,
            mode === "vertical-lr" ? "under" : "over",
            css,
          );
          const native = element.lastChild.getBoundingClientRect().toJSON();
          RubyEmphasis.adjustAnnotationsForNodes(nodes(block), actualLayout());
          expect(element.lastChild.style.marginBlockStart).toBe("");
          expect(element.lastChild.getBoundingClientRect().toJSON()).toEqual(
            native,
          );
        }
  });

  it("ignores page box borders for first-line ruby", () => {
    for (const mode of ["horizontal-tb", "vertical-rl", "vertical-lr"]) {
      const root = column(mode);
      const page = document.createElement("div");
      page.setAttribute("data-vivliostyle-page-box", "true");
      page.style.cssText = `writing-mode:${mode};border-block-start:1px solid`;
      root.replaceWith(page);
      page.appendChild(root);
      const element = addRuby(root, mode === "vertical-lr" ? "under" : "over");
      RubyEmphasis.adjustAnnotationsForNodes(nodes(root), actualLayout());
      expect(element.lastChild.style.marginBlockStart).toBe("-7px");
    }
  });

  it("excludes separate formatting contexts but keeps ordinary block ancestors", () => {
    for (const mode of ["horizontal-tb", "vertical-rl"]) {
      for (const rule of [
        "display:flow-root",
        "display:inline-block",
        "display:flex",
        "display:grid",
        "display:table",
        "display:table-cell",
        "overflow:hidden",
        "overflow:auto",
        "float:left",
        "position:absolute",
      ]) {
        const root = column(mode);
        const wrapper = document.createElement("div");
        wrapper.style.cssText = rule;
        root.appendChild(wrapper);
        const block = document.createElement("p");
        block.style.margin = "0";
        wrapper.appendChild(block);
        const element = addRuby(block);
        RubyEmphasis.adjustAnnotationsForNodes(nodes(block), actualLayout());
        expect(element.lastChild.style.marginBlockStart)
          .withContext(rule)
          .toBe("");
      }
      for (const rule of [
        "display:block",
        "position:relative",
        "overflow:clip",
        "display:contents",
      ]) {
        const root = column(mode);
        const wrapper = document.createElement("div");
        wrapper.style.cssText = rule;
        root.appendChild(wrapper);
        const element = addRuby(wrapper);
        RubyEmphasis.adjustAnnotationsForNodes(nodes(wrapper), actualLayout());
        expect(element.lastChild.style.marginBlockStart)
          .withContext(rule)
          .toBe("-7px");
      }
    }
  });

  it("keeps source formatting boundaries after the view display is rewritten", () => {
    for (const establishesBFC of [true, false]) {
      const root = column();
      const wrapper = document.createElement("div");
      root.appendChild(wrapper);
      const element = addRuby(wrapper);
      RubyEmphasis.adjustAnnotationsForNodes(nodes(wrapper), actualLayout());
      expect(element.lastChild.style.marginBlockStart).toBe("-7px");
      RubyEmphasis.registerViewContext(
        wrapper,
        {
          establishesBFC,
          floatSide: null,
          formattingContext: {},
          parent: { formattingContext: {} },
        },
        Css.ident._static,
      );
      RubyEmphasis.adjustAnnotationsForNodes(nodes(wrapper), actualLayout());
      expect(element.lastChild.style.marginBlockStart).toBe("");
    }
  });

  it("ignores preceding float and positioned subtrees, including rewritten floats and empty lines", () => {
    for (const rule of [
      "float:left",
      "position:absolute",
      "position:fixed",
      "display:none",
      "rewritten-float",
    ]) {
      const root = column();
      const prefix = document.createElement("div");
      prefix.innerHTML = '<br><img width="20" height="20">浮動テキスト';
      if (rule === "rewritten-float") {
        RubyEmphasis.registerViewContext(
          prefix,
          {
            establishesBFC: true,
            floatSide: "left",
            parent: null,
          },
          Css.ident._static,
        );
        prefix.style.cssText = "float:none;position:static;display:block";
      } else prefix.style.cssText = rule;
      root.appendChild(prefix);
      const block = document.createElement("p");
      block.style.margin = "0";
      root.appendChild(block);
      const element = addRuby(block);
      RubyEmphasis.adjustAnnotationsForNodes(nodes(block), actualLayout());
      expect(element.lastChild.style.marginBlockStart)
        .withContext(rule)
        .toBe("-7px");
    }
  });

  it("applies the same root formatting context and page-border policy to emphasis", () => {
    const root = column();
    const page = document.createElement("div");
    page.setAttribute("data-vivliostyle-page-box", "true");
    page.style.borderTop = "1px solid";
    root.replaceWith(page);
    page.appendChild(root);
    const wrapper = document.createElement("div");
    root.appendChild(wrapper);
    const block = paragraph();
    wrapper.appendChild(block);
    block.style.position = "relative";
    RubyEmphasis.adjustEmphasisBlock(block, measuredLayout(block), true);
    expect(block.hasAttribute("data-viv-emphasis-adjust")).toBeTrue();
    wrapper.style.display = "flow-root";
    RubyEmphasis.adjustEmphasisBlock(block, measuredLayout(block), true);
    expect(block.hasAttribute("data-viv-emphasis-adjust")).toBeFalse();
    wrapper.style.display = "block";
    RubyEmphasis.adjustEmphasisBlock(block, measuredLayout(block), true);
    expect(block.hasAttribute("data-viv-emphasis-adjust")).toBeTrue();
  });

  it("does not exclude ruby for end borders or zero-width start borders", () => {
    for (const mode of ["horizontal-tb", "vertical-rl"])
      for (const border of ["end", "zero", "none"]) {
        const root = column(mode);
        const block = document.createElement("p");
        block.style.margin = "0";
        root.appendChild(block);
        if (border === "end") block.style.borderBlockEnd = "1px solid";
        else
          block.style.borderBlockStart =
            border === "zero" ? "0 solid" : "1px none";
        const element = addRuby(block);
        RubyEmphasis.adjustAnnotationsForNodes(nodes(block), actualLayout());
        expect(element.lastChild.style.marginBlockStart).toBe("-7px");
      }
  });

  it("restores a ruby margin when a start border becomes present", () => {
    const root = column();
    const block = document.createElement("p");
    block.style.margin = "0";
    root.appendChild(block);
    const element = addRuby(block);
    RubyEmphasis.adjustAnnotationsForNodes(nodes(block), actualLayout());
    expect(element.lastChild.style.marginBlockStart).toBe("-7px");
    block.style.borderTop = "1px solid";
    RubyEmphasis.adjustAnnotationsForNodes(nodes(block), actualLayout());
    expect(element.lastChild.style.marginBlockStart).toBe("");
    // A sliced continuation discards the used start border.
    block.style.setProperty("border-block-start-width", "0", "important");
    RubyEmphasis.adjustAnnotationsForNodes(nodes(block), actualLayout());
    expect(element.lastChild.style.marginBlockStart).toBe("-7px");
  });

  it("ignores the internal page-area border but honors transparent author borders", () => {
    const root = column();
    root.setAttribute("data-vivliostyle-page-area", "true");
    root.style.border = "20px solid transparent";
    const block = document.createElement("p");
    block.style.margin = "0";
    root.appendChild(block);
    const element = addRuby(block);
    RubyEmphasis.adjustAnnotationsForNodes(nodes(block), actualLayout());
    expect(element.lastChild.style.marginBlockStart).toBe("-7px");
    block.style.borderTop = "1px solid transparent";
    RubyEmphasis.adjustAnnotationsForNodes(nodes(block), actualLayout());
    expect(element.lastChild.style.marginBlockStart).toBe("");
  });

  it("does not extend root measurement into following non-root columns", () => {
    const root = column();
    const block = document.createElement("p");
    block.style.margin = "0";
    root.appendChild(block);
    addRuby(block, "under");
    const nested = document.createElement("div");
    nested.style.columnCount = "2";
    root.appendChild(nested);
    const original = root.style.cssText;
    RubyEmphasis.adjustAnnotationsForNodes(nodes(block), actualLayout());
    expect(root.style.cssText).toBe(original);
  });

  it("does not mistake a paragraph start or a line following an empty line for the column start", () => {
    for (const prefix of ["<p>前の行</p>", "<br>"]) {
      const root = column();
      const block = document.createElement("p");
      block.style.cssText = "margin:0";
      if (prefix.startsWith("<p>")) root.innerHTML = prefix;
      else block.innerHTML = prefix;
      root.appendChild(block);
      const element = addRuby(block);
      RubyEmphasis.adjustAnnotationsForNodes(nodes(block), actualLayout());
      expect(element.lastChild.style.marginBlockStart).toBe("");
    }
  });

  it("selects only first-line annotations in naturally wrapped rb/rt segments", () => {
    const root = column();
    root.style.width = "80px";
    const block = document.createElement("p");
    block.style.cssText = "margin:0";
    const ruby = document.createElement("ruby");
    ruby.style.rubyPosition = "over";
    block.appendChild(ruby);
    root.appendChild(block);
    for (let i = 0; i < 12; i++) {
      ruby.insertAdjacentHTML(
        "beforeend",
        '<rb>文字</rb><rt style="font-size:50%;line-height:1">もじ</rt>',
      );
    }
    for (const rt of ruby.querySelectorAll("rt"))
      RubyEmphasis.prepareRubyAnnotation(rt, ruby, rtStyle(), window);
    RubyEmphasis.adjustAnnotationsForNodes(nodes(block), actualLayout());
    const annotations = [...ruby.querySelectorAll("rt")];
    expect(annotations[0].style.marginBlockStart).toBe("-7px");
    expect(annotations.at(-1).style.marginBlockStart).toBe("");
    expect(
      annotations.filter((rt) => rt.style.marginBlockStart).length,
    ).toBeLessThan(annotations.length);
  });

  it("keeps opposing under/over ruby spacing in the same or adjacent paragraphs", () => {
    for (const mode of ["horizontal-tb", "vertical-rl"])
      for (const separate of [false, true]) {
        const root = column(mode);
        const first = document.createElement("p");
        first.style.cssText = "margin:0;padding:0";
        root.appendChild(first);
        const under = addRuby(first, "under");
        const second = separate ? first.cloneNode(false) : first;
        if (separate) root.appendChild(second);
        else first.appendChild(document.createElement("br"));
        const over = addRuby(second, "over");
        const position = (element) => {
          const range = document.createRange();
          range.selectNodeContents(element.firstChild);
          const rect = range.getBoundingClientRect();
          return mode === "horizontal-tb" ? rect.top : -rect.right;
        };
        const interval = position(over) - position(under);
        RubyEmphasis.adjustAnnotationsForNodes(
          nodes(first).concat(nodes(second)),
          actualLayout(),
        );
        expect(position(over) - position(under)).toBeCloseTo(interval, 1);
        expect(under.lastChild.style.marginBlockEnd).toBe("");
        expect(over.lastChild.style.marginBlockStart).toBe("");
      }
  });

  it("preserves opposing ruby when the first line contains both sides", () => {
    const root = column();
    const block = document.createElement("p");
    block.style.margin = "0";
    root.appendChild(block);
    const firstOver = addRuby(block, "over");
    const firstUnder = addRuby(block, "under");
    block.appendChild(document.createElement("br"));
    const nextOver = addRuby(block, "over");
    const top = (e) => {
      const r = document.createRange();
      r.selectNodeContents(e.firstChild);
      return r.getBoundingClientRect().top;
    };
    const gap = top(nextOver) - top(firstUnder);
    RubyEmphasis.adjustAnnotationsForNodes(nodes(block), actualLayout());
    expect(firstOver.lastChild.style.marginBlockStart).toBe("-7px");
    expect(firstUnder.lastChild.style.marginBlockEnd).toBe("");
    expect(nextOver.lastChild.style.marginBlockStart).toBe("");
    expect(top(nextOver) - top(firstUnder)).toBeCloseTo(gap, 1);
  });

  it("leaves all non-root ruby and emphasis, measurement sizes and following flow unchanged", () => {
    for (const mode of ["horizontal-tb", "vertical-rl"]) {
      const root = column(mode);
      const nested = document.createElement("div");
      nested.style.cssText = "column-count:2;column-fill:auto;column-gap:20px";
      const block = paragraph();
      root.appendChild(nested);
      nested.appendChild(block);
      const over = addRuby(block);
      const under = addRuby(block, "under");
      const original = [
        root.style.cssText,
        nested.style.cssText,
        block.style.cssText,
      ];
      RubyEmphasis.adjustAnnotationsForNodes(nodes(block), actualLayout());
      expect(over.lastChild.hasAttribute("data-viv-ruby-start")).toBeFalse();
      expect(under.lastChild.hasAttribute("data-viv-ruby-end")).toBeFalse();
      expect(block.hasAttribute("data-viv-emphasis-adjust")).toBeFalse();
      expect([
        root.style.cssText,
        nested.style.cssText,
        block.style.cssText,
      ]).toEqual(original);
      expect(
        RubyEmphasis.blockEndAllowance(
          root,
          actualLayout(),
          mode === "vertical-rl",
        ),
      ).toBe(0);
    }
  });

  it("does not let previously prepared end metadata escape from non-root columns", () => {
    const root = column();
    const nested = document.createElement("div");
    nested.style.columnCount = "2";
    root.appendChild(nested);
    const under = addRuby(root, "under");
    nested.appendChild(under);
    const rect = {
      top: 0,
      bottom: 40,
      left: 0,
      right: 40,
      width: 40,
      height: 40,
    };
    RubyEmphasis.adjustRubyEndRects([rect], under.lastChild, false);
    expect(rect.bottom).toBe(40);
    expect(RubyEmphasis.blockEndAllowance(root, actualLayout(), false)).toBe(0);
  });

  it("corrects start emphasis only with an explicit first-fragment context and without accumulation", () => {
    const block = paragraph();
    const layout = measuredLayout(block);
    const original = block.firstChild.style.cssText;
    RubyEmphasis.adjustEmphasisBlock(block, layout);
    expect(block.hasAttribute("data-viv-emphasis-adjust")).toBeFalse();
    RubyEmphasis.adjustEmphasisBlock(block, layout, true);
    expect(block.style.getPropertyValue("--viv-emphasis-start")).toBe("-4px");
    RubyEmphasis.adjustEmphasisBlock(block, layout, true);
    expect(block.style.getPropertyValue("--viv-emphasis-start")).toBe("-4px");
    expect(block.firstChild.style.cssText).toBe(original);
    RubyEmphasis.adjustEmphasisBlock(block, layout, false);
    expect(getComputedStyle(block).marginBlockStart).toBe("0px");
    expect(block.hasAttribute("data-viv-emphasis-adjust")).toBeFalse();
  });

  it("preserves decorated starts and increased internal leading", () => {
    for (const property of [
      "padding-block-start",
      "border-block-start",
      "margin-block-start",
    ]) {
      const block = paragraph();
      block.style.setProperty(
        property,
        property.includes("border") ? "2px solid" : "2px",
      );
      RubyEmphasis.adjustEmphasisBlock(block, measuredLayout(block), true);
      expect(block.hasAttribute("data-viv-emphasis-adjust")).toBeFalse();
    }
    const block = paragraph();
    RubyEmphasis.adjustEmphasisBlock(
      block,
      measuredLayout(block, { internal: 4 }),
      true,
    );
    expect(block.hasAttribute("data-viv-emphasis-adjust")).toBeFalse();
  });

  it("restores emphasis compensation when an ancestor start border is present", () => {
    const root = column();
    const wrapper = document.createElement("div");
    const block = paragraph();
    root.appendChild(wrapper);
    wrapper.appendChild(block);
    const layout = measuredLayout(block);
    RubyEmphasis.adjustEmphasisBlock(block, layout, true);
    expect(block.hasAttribute("data-viv-emphasis-adjust")).toBeTrue();
    wrapper.style.borderTop = "1px solid";
    RubyEmphasis.adjustEmphasisBlock(block, layout, true);
    expect(block.hasAttribute("data-viv-emphasis-adjust")).toBeFalse();
    expect(getComputedStyle(block).marginBlockStart).toBe("0px");
  });

  it("caps start compensation and never adds an end margin", () => {
    const block = paragraph();
    RubyEmphasis.adjustEmphasisBlock(
      block,
      measuredLayout(block, { start: 15, end: 7 }),
      true,
    );
    expect(
      parseFloat(block.style.getPropertyValue("--viv-emphasis-start")),
    ).toBeCloseTo(-7, 1);
    expect(block.style.marginBlockEnd).toBe("");
    expect(block.style.getPropertyValue("--viv-emphasis-end")).toBe("");
  });

  it("restores temporary styles even when first-line measurement fails", () => {
    const block = paragraph();
    const original = block.firstChild.style.cssText;
    expect(() =>
      RubyEmphasis.adjustEmphasisBlock(
        block,
        measuredLayout(block, { fail: true }),
        true,
      ),
    ).toThrowError("measurement failed");
    expect(block.firstChild.style.cssText).toBe(original);
    expect(block.style.inlineSize).toBe("");
  });

  it("retains native under annotation margins and bounds end ink when choosing a break", () => {
    for (const vertical of [false, true]) {
      const root = column(vertical ? "vertical-rl" : "horizontal-tb");
      const under = addRuby(root, "under");
      const annotationStyle = under.lastChild.style.cssText;
      RubyEmphasis.adjustAnnotationsForNodes(nodes(root), actualLayout());
      expect(under.lastChild.style.cssText).toBe(annotationStyle);
      const rect = {
        top: 0,
        bottom: 40,
        left: 0,
        right: 40,
        width: 40,
        height: 40,
      };
      RubyEmphasis.adjustRubyEndRects([rect], under.lastChild, vertical);
      expect(vertical ? rect.left : rect.bottom).toBe(vertical ? 7 : 33);
      RubyEmphasis.finishAnnotationLayout(root, actualLayout());
    }
  });

  it("permits end ink only on an undecorated last annotated line", () => {
    const root = column();
    const block = document.createElement("p");
    block.style.cssText = "margin:0;padding:0;border:0";
    root.appendChild(block);
    const under = addRuby(block, "under");
    let end = 103;
    const layout = {
      ...actualLayout(),
      getElementClientRect: (e) => ({
        bottom: e === under.lastChild ? end : 100,
        left: 0,
      }),
    };
    expect(RubyEmphasis.blockEndAllowance(block, layout, false)).toBe(7);
    end = 70;
    expect(RubyEmphasis.blockEndAllowance(block, layout, false)).toBe(0);
    end = 103;
    block.style.paddingBottom = "1px";
    expect(RubyEmphasis.blockEndAllowance(block, layout, false)).toBe(0);
    block.style.paddingBottom = "0";
    block.style.borderBottom = "1px solid";
    expect(RubyEmphasis.blockEndAllowance(block, layout, false)).toBe(0);
  });

  it("groups disjoint under annotation rects with their bases without trimming their end", () => {
    for (const vertical of [false, true]) {
      for (const css of [false, true]) {
        const root = column(vertical ? "vertical-rl" : "horizontal-tb");
        const under = addRuby(root, "under", css);
        const base = {
          top: vertical ? 0 : 100,
          bottom: vertical ? 40 : 120,
          left: vertical ? 100 : 0,
          right: vertical ? 120 : 40,
          width: vertical ? 20 : 40,
          height: vertical ? 40 : 20,
        };
        const rect = {
          top: vertical ? 10 : 127,
          bottom: vertical ? 30 : 137,
          left: vertical ? 83 : 10,
          right: vertical ? 95 : 30,
          width: vertical ? 12 : 20,
          height: vertical ? 20 : 10,
        };
        const annotationStyle = under.lastChild.style.cssText;
        RubyEmphasis.adjustRubyEndRects([rect], under.lastChild, vertical);
        const end = vertical ? rect.left : rect.bottom;
        const measured = {
          ...actualLayout(),
          getRangeClientRects: () => [base],
        };
        const columnLayout = Object.create(Layout.Column.prototype);
        columnLayout.vertical = vertical;
        columnLayout.getRangeBoxes = () => [base, rect];
        expect(
          columnLayout.findLinePositions([{ viewNode: under }]),
        ).toHaveSize(2);
        RubyEmphasis.includeRubyBaseInLineRects(
          [rect],
          under.lastChild,
          measured,
          vertical,
        );
        expect(columnLayout.findLinePositions([{ viewNode: under }])).toEqual([
          end,
        ]);
        expect(vertical ? rect.left : rect.bottom).toBe(end);
        expect(under.lastChild.style.cssText).toBe(annotationStyle);
      }
    }
  });

  it("does not group excluded or unrelated annotation rectangles", () => {
    const root = column();
    const under = addRuby(root, "under");
    const rect = {
      top: 127,
      bottom: 130,
      left: 100,
      right: 120,
      width: 20,
      height: 3,
    };
    const original = { ...rect };
    const layout = {
      ...actualLayout(),
      getRangeClientRects: () => [
        { top: 100, bottom: 120, left: 0, right: 40, width: 40, height: 20 },
      ],
    };
    RubyEmphasis.includeRubyBaseInLineRects(
      [rect],
      under.lastChild,
      layout,
      false,
    );
    expect(rect).toEqual(original);
    const nested = document.createElement("div");
    nested.style.columnCount = "2";
    root.appendChild(nested);
    nested.appendChild(under);
    rect.left = 10;
    rect.right = 30;
    const nestedOriginal = { ...rect };
    RubyEmphasis.includeRubyBaseInLineRects(
      [rect],
      under.lastChild,
      layout,
      false,
    );
    expect(rect).toEqual(nestedOriginal);
  });

  it("extends only the root measurement area and restores its size and start", () => {
    for (const mode of ["horizontal-tb", "vertical-rl"]) {
      const root = column(mode);
      const block = document.createElement("p");
      block.style.margin = "0";
      root.appendChild(block);
      addRuby(block, "under");
      const before = root.style.cssText;
      RubyEmphasis.adjustAnnotationsForNodes(nodes(block), actualLayout());
      expect(
        mode === "horizontal-tb" ? root.style.height : root.style.width,
      ).toBe(mode === "horizontal-tb" ? "211px" : "307px");
      RubyEmphasis.finishAnnotationLayout(root, actualLayout());
      expect(root.style.cssText).toBe(before);
    }
  });
});
