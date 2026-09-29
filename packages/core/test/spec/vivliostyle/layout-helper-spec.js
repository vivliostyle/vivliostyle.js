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

import * as adapt_layouthelper from "../../../src/vivliostyle/layout-helper";
import * as DomUtil from "../../util/dom";

function createClientLayout({ lineHeight = "20px" } = {}) {
  return {
    getElementComputedStyle: () => ({ lineHeight }),
  };
}

function createElement() {
  const container = DomUtil.getDummyContainer();
  const element = document.createElement("div");
  container.appendChild(element);
  return element;
}

/**
 * Create `<div><span>...</span></div>` (with an extra `em` inside the span
 * when `innerLineHeight` is given) and return the innermost element, i.e. the
 * element containing the text.
 */
function createInlineChain({
  blockLineHeight,
  spanLineHeight,
  innerLineHeight,
}) {
  const container = DomUtil.getDummyContainer();
  const block = document.createElement("div");
  block.style.display = "block";
  block.style.lineHeight = blockLineHeight;
  const span = document.createElement("span");
  span.style.display = "inline";
  span.style.lineHeight = spanLineHeight;
  block.appendChild(span);
  let target = span;
  if (innerLineHeight !== undefined) {
    const inner = document.createElement("em");
    inner.style.display = "inline";
    inner.style.lineHeight = innerLineHeight;
    span.appendChild(inner);
    target = inner;
  }
  container.appendChild(block);
  return target;
}

function createClientLayoutFromStyles() {
  return {
    getElementComputedStyle: (element) => ({
      lineHeight: element.style.lineHeight,
      display: element.style.display,
    }),
  };
}

function createRect({ left, top, right, bottom }) {
  return {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top,
  };
}

describe("layout-helper", function () {
  describe("adjustTextRectsForLineHeight", function () {
    it("shrinks a rect taller than the line-height symmetrically around its center", function () {
      const element = createElement();
      const clientLayout = createClientLayout({ lineHeight: "20px" });
      const rect = createRect({ left: 0, top: 0, right: 100, bottom: 30 });

      adapt_layouthelper.adjustTextRectsForLineHeight(
        [rect],
        element,
        clientLayout,
        false,
      );

      expect(rect.top).toBe(5);
      expect(rect.bottom).toBe(25);
      expect(rect.height).toBe(20);
      // The inline-direction size and position are unchanged.
      expect(rect.left).toBe(0);
      expect(rect.right).toBe(100);
    });

    it("leaves a rect that is not taller than the line-height unchanged", function () {
      const element = createElement();
      const clientLayout = createClientLayout({ lineHeight: "20px" });
      const rect = createRect({ left: 0, top: 2, right: 100, bottom: 18 });

      adapt_layouthelper.adjustTextRectsForLineHeight(
        [rect],
        element,
        clientLayout,
        false,
      );

      expect(rect).toEqual(
        createRect({ left: 0, top: 2, right: 100, bottom: 18 }),
      );
    });

    it("shrinks the block-direction size in vertical writing-mode", function () {
      const element = createElement();
      const clientLayout = createClientLayout({ lineHeight: "20px" });
      const rect = createRect({ left: 0, top: 0, right: 30, bottom: 100 });

      adapt_layouthelper.adjustTextRectsForLineHeight(
        [rect],
        element,
        clientLayout,
        true,
      );

      expect(rect.left).toBe(5);
      expect(rect.right).toBe(25);
      expect(rect.width).toBe(20);
      // The inline-direction size and position are unchanged.
      expect(rect.top).toBe(0);
      expect(rect.bottom).toBe(100);
    });

    it("uses the line box height: the strut of the block container", function () {
      // The block container's line-height (the strut) is larger than the
      // line-height of the span containing the text, so the line box is as
      // high as the strut.
      const span = createInlineChain({
        blockLineHeight: "30px",
        spanLineHeight: "10px",
      });
      const clientLayout = createClientLayoutFromStyles();
      const rect = createRect({ left: 0, top: 0, right: 100, bottom: 40 });

      adapt_layouthelper.adjustTextRectsForLineHeight(
        [rect],
        span,
        clientLayout,
        false,
      );

      expect(rect.top).toBe(5);
      expect(rect.bottom).toBe(35);
      expect(rect.height).toBe(30);
    });

    it("does not shrink a rect below the line box height", function () {
      // A glyph box smaller than the line box must stay unchanged even when
      // the line-height of the element containing the text is smaller.
      const span = createInlineChain({
        blockLineHeight: "30px",
        spanLineHeight: "10px",
      });
      const clientLayout = createClientLayoutFromStyles();
      const rect = createRect({ left: 0, top: 0, right: 100, bottom: 11 });

      adapt_layouthelper.adjustTextRectsForLineHeight(
        [rect],
        span,
        clientLayout,
        false,
      );

      expect(rect).toEqual(
        createRect({ left: 0, top: 0, right: 100, bottom: 11 }),
      );
    });

    it("uses the line box height: an ancestor inline box", function () {
      // A larger line-height of an inline ancestor (here the span) raises the
      // line box as well, even when the element containing the text (the em)
      // has a smaller line-height.
      const em = createInlineChain({
        blockLineHeight: "10px",
        spanLineHeight: "30px",
        innerLineHeight: "10px",
      });
      const clientLayout = createClientLayoutFromStyles();
      const rect = createRect({ left: 0, top: 0, right: 100, bottom: 40 });

      adapt_layouthelper.adjustTextRectsForLineHeight(
        [rect],
        em,
        clientLayout,
        false,
      );

      expect(rect.top).toBe(5);
      expect(rect.bottom).toBe(35);
      expect(rect.height).toBe(30);
    });

    it("leaves rects unchanged when the strut has line-height: normal", function () {
      // The used value of `normal` may be larger than the numeric
      // line-heights of the other boxes (e.g. a 10px span inside a block whose
      // strut is `normal`), so the line box height cannot be determined and
      // the rects must be left unchanged instead of being shrunk below the
      // line box.
      const span = createInlineChain({
        blockLineHeight: "normal",
        spanLineHeight: "10px",
      });
      const clientLayout = createClientLayoutFromStyles();
      const rect = createRect({ left: 0, top: 0, right: 100, bottom: 40 });

      adapt_layouthelper.adjustTextRectsForLineHeight(
        [rect],
        span,
        clientLayout,
        false,
      );

      expect(rect).toEqual(
        createRect({ left: 0, top: 0, right: 100, bottom: 40 }),
      );
    });

    it("leaves rects unchanged when an inline ancestor has line-height: normal", function () {
      const em = createInlineChain({
        blockLineHeight: "10px",
        spanLineHeight: "normal",
        innerLineHeight: "10px",
      });
      const clientLayout = createClientLayoutFromStyles();
      const rect = createRect({ left: 0, top: 0, right: 100, bottom: 40 });

      adapt_layouthelper.adjustTextRectsForLineHeight(
        [rect],
        em,
        clientLayout,
        false,
      );

      expect(rect).toEqual(
        createRect({ left: 0, top: 0, right: 100, bottom: 40 }),
      );
    });

    it("skips display: contents elements when measuring the line box", function () {
      // A `display: contents` element generates no box, so its line-height does
      // not contribute to the line box: only its child (the element containing
      // the text) and the strut of the block container do.
      const container = DomUtil.getDummyContainer();
      const block = document.createElement("div");
      block.style.display = "block";
      block.style.lineHeight = "10px";
      const contents = document.createElement("div");
      contents.style.display = "contents";
      contents.style.lineHeight = "100px";
      const span = document.createElement("span");
      span.style.display = "inline";
      span.style.lineHeight = "10px";
      contents.appendChild(span);
      block.appendChild(contents);
      container.appendChild(block);
      const clientLayout = createClientLayoutFromStyles();
      const rect = createRect({ left: 0, top: 0, right: 100, bottom: 40 });

      adapt_layouthelper.adjustTextRectsForLineHeight(
        [rect],
        span,
        clientLayout,
        false,
      );

      expect(rect.top).toBe(15);
      expect(rect.bottom).toBe(25);
      expect(rect.height).toBe(10);
    });

    it("ignores line-height: normal", function () {
      const element = createElement();
      const clientLayout = createClientLayout({ lineHeight: "normal" });
      const rect = createRect({ left: 0, top: 0, right: 100, bottom: 30 });

      adapt_layouthelper.adjustTextRectsForLineHeight(
        [rect],
        element,
        clientLayout,
        false,
      );

      expect(rect).toEqual(
        createRect({ left: 0, top: 0, right: 100, bottom: 30 }),
      );
    });

    it("ignores zero line-height", function () {
      const element = createElement();
      const clientLayout = createClientLayout({ lineHeight: "0px" });
      const rect = createRect({ left: 0, top: 0, right: 100, bottom: 30 });

      adapt_layouthelper.adjustTextRectsForLineHeight(
        [rect],
        element,
        clientLayout,
        false,
      );

      expect(rect).toEqual(
        createRect({ left: 0, top: 0, right: 100, bottom: 30 }),
      );
    });

    it("does nothing without an element or rects", function () {
      const clientLayout = createClientLayout({ lineHeight: "20px" });
      const rect = createRect({ left: 0, top: 0, right: 100, bottom: 30 });

      expect(() => {
        adapt_layouthelper.adjustTextRectsForLineHeight(
          [rect],
          null,
          clientLayout,
          false,
        );
        adapt_layouthelper.adjustTextRectsForLineHeight(
          [],
          createElement(),
          clientLayout,
          false,
        );
      }).not.toThrow();
      expect(rect).toEqual(
        createRect({ left: 0, top: 0, right: 100, bottom: 30 }),
      );
    });
  });
});
