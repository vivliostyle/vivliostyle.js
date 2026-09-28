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
