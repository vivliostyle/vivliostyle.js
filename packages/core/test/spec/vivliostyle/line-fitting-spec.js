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

import { Column } from "../../../src/vivliostyle/layout";
import * as LayoutHelper from "../../../src/vivliostyle/layout-helper";
import { DefaultClientLayout } from "../../../src/vivliostyle/vgen";
import * as DomUtil from "../../util/dom";

// Use actual browser rectangles: mocked rectangles do not expose the font
// extents returned for ordinary inline elements and BR markers (Issue #2163).
describe("line fitting with inline elements", function () {
  for (const vertical of [false, true]) {
    describe(vertical ? "vertical writing" : "horizontal writing", function () {
      let block, column, clientLayout;
      beforeEach(function () {
        const container = DomUtil.getDummyContainer();
        block = document.createElement("div");
        block.style.cssText = `font: 20px/16px monospace; margin: 0; word-break: break-all;
          writing-mode: ${vertical ? "vertical-rl" : "horizontal-tb"};
          ${vertical ? "height" : "width"}: 121px;`;
        container.appendChild(block);
        clientLayout = new DefaultClientLayout({
          layoutBox: container,
          window,
        });
        column = Object.create(Column.prototype);
        column.clientLayout = clientLayout;
        column.vertical = vertical;
      });

      function positions() {
        return column.findLinePositions([{ viewNode: block }]);
      }
      function edge(node, after = true) {
        return LayoutHelper.calculateEdge(
          { viewNode: node, inline: true, after },
          clientLayout,
          0,
          vertical,
        );
      }
      function expectSamePositions(actual, expected) {
        expect(actual.length).toBe(expected.length);
        actual.forEach((value, index) =>
          expect(value).toBeCloseTo(expected[index], 2),
        );
      }

      it("keeps line positions when an undecorated span is inserted", function () {
        block.textContent = "a".repeat(80);
        const expected = positions();
        // Default monospace metrics vary by browser and platform. The invariant
        // is that inserting an undecorated span preserves these wrapped lines.
        expect(expected.length).toBeGreaterThan(1);
        block.innerHTML =
          "a".repeat(10) +
          "<span>" +
          "a".repeat(30) +
          "</span>" +
          "a".repeat(40);
        expectSamePositions(positions(), expected);
        const span = block.querySelector("span");
        expect(edge(span)).toBeCloseTo(edge(span.firstChild), 2);
      });

      it("keeps the BR edge with the line it terminates", function () {
        block.innerHTML = Array(8).fill("a".repeat(10)).join("<br>");
        for (const br of block.querySelectorAll("br")) {
          expect(edge(br)).toBeCloseTo(edge(br.previousSibling), 2);
        }
      });

      it("keeps consecutive BRs on separate lines", function () {
        block.innerHTML = "aaaaaaaaaa<br><br>aaaaaaaaaa";
        const breaks = block.querySelectorAll("br");
        expect(Math.abs(edge(breaks[1]) - edge(breaks[0]))).toBeCloseTo(16, 2);
        expect(Math.abs(edge(block.lastChild) - edge(breaks[0]))).toBeCloseTo(
          32,
          2,
        );
      });

      it("preserves the border boxes of decorated inline elements", function () {
        block.innerHTML =
          'a<span style="padding-block: 4px 6px; border-block: 2px solid">b</span>c';
        const span = block.querySelector("span");
        const expected = clientLayout.getElementClientRects(span)[0];
        const boxes = column.getRangeBoxes(block, block);
        expect(boxes).toContain(expected);
        expect(edge(span)).toBe(vertical ? expected.left : expected.bottom);
      });

      it("preserves atomic inline and replaced element sizes", function () {
        block.innerHTML =
          'a<span style="display: inline-block; width: 40px; height: 40px">b</span><img style="width: 40px; height: 40px">c';
        for (const element of block.querySelectorAll("span, img")) {
          const expected = clientLayout.getElementClientRect(element);
          expect(edge(element)).toBe(
            vertical ? expected.left : expected.bottom,
          );
        }
      });
    });
  }
});
