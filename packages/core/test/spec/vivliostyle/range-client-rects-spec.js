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

import * as RangeClientRects from "../../../src/vivliostyle/range-client-rects";
import * as Vgen from "../../../src/vivliostyle/vgen";
import * as DomUtil from "../../util/dom";

function toPlainRects(rects) {
  return Array.from(rects, (rect) => ({
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
  }));
}

function rectsOfFreshRange(setBoundaries) {
  const range = document.createRange();
  setBoundaries(range);
  return toPlainRects(range.getClientRects());
}

function createParagraph() {
  const container = DomUtil.getDummyContainer();
  container.style.width = "120px";
  const paragraph = document.createElement("p");
  paragraph.innerHTML =
    "The quick brown fox <em>jumps over</em> the lazy dog, again and again.";
  container.appendChild(paragraph);
  return {
    container,
    firstText: paragraph.firstChild,
    emphasis: paragraph.childNodes[1],
    lastText: paragraph.lastChild,
  };
}

function createFrameParagraph() {
  const frame = document.createElement("iframe");
  DomUtil.getDummyContainer().appendChild(frame);
  const frameDocument = frame.contentDocument;
  frameDocument.body.innerHTML = "<p>text in another document</p>";
  return { frameDocument, frameText: frameDocument.body.firstChild.firstChild };
}

function expectCollapsedAtDocumentStart(range, ownerDocument) {
  expect(range.collapsed).toBe(true);
  expect(range.startContainer).toBe(ownerDocument);
  expect(range.startOffset).toBe(0);
}

function createClientLayout(container) {
  return new Vgen.DefaultClientLayout({
    layoutBox: container,
    window,
    pixelRatio: 1,
    scaleRatio: 1,
    layoutUnitPerPixel: 1,
  });
}

describe("range-client-rects", () => {
  describe("getClientRectsBetween", () => {
    it("returns the rects of a fresh Range with the same offsets", () => {
      const { firstText, lastText } = createParagraph();

      const rects = RangeClientRects.getClientRectsBetween(
        RangeClientRects.at(firstText, 4),
        RangeClientRects.at(lastText, 12),
      );

      expect(rects.length).toBeGreaterThan(1);
      expect(toPlainRects(rects)).toEqual(
        rectsOfFreshRange((range) => {
          range.setStart(firstText, 4);
          range.setEnd(lastText, 12);
        }),
      );
    });

    it("returns the rects of a fresh Range set before and after nodes", () => {
      const { emphasis, lastText } = createParagraph();

      const rects = RangeClientRects.getClientRectsBetween(
        RangeClientRects.before(emphasis),
        RangeClientRects.after(lastText),
      );

      expect(rects.length).toBeGreaterThan(0);
      expect(toPlainRects(rects)).toEqual(
        rectsOfFreshRange((range) => {
          range.setStartBefore(emphasis);
          range.setEndAfter(lastText);
        }),
      );
    });

    it("propagates the DOM error for an offset out of range and stays usable afterwards", () => {
      const { firstText, emphasis } = createParagraph();

      expect(() => {
        RangeClientRects.getClientRectsBetween(
          RangeClientRects.at(firstText, 0),
          RangeClientRects.at(firstText, firstText.length + 1),
        );
      }).toThrow();

      expect(
        toPlainRects(RangeClientRects.getClientRectsOfNode(emphasis)),
      ).toEqual(rectsOfFreshRange((range) => range.selectNode(emphasis)));
    });

    it("propagates the DOM error for a boundary node without a parent and stays usable afterwards", () => {
      const { firstText, emphasis } = createParagraph();
      const orphan = document.createTextNode("orphan");

      expect(() => {
        RangeClientRects.getClientRectsBetween(
          RangeClientRects.before(orphan),
          RangeClientRects.at(orphan, 0),
        );
      }).toThrow();
      expect(() => {
        RangeClientRects.getClientRectsBetween(
          RangeClientRects.at(firstText, 0),
          RangeClientRects.after(orphan),
        );
      }).toThrow();

      expect(
        toPlainRects(RangeClientRects.getClientRectsOfNode(emphasis)),
      ).toEqual(rectsOfFreshRange((range) => range.selectNode(emphasis)));
    });
  });

  describe("getClientRectsOfNode", () => {
    it("returns the rects of a fresh Range selecting the node", () => {
      const { lastText } = createParagraph();

      const rects = RangeClientRects.getClientRectsOfNode(lastText);

      expect(rects.length).toBeGreaterThan(0);
      expect(toPlainRects(rects)).toEqual(
        rectsOfFreshRange((range) => range.selectNode(lastText)),
      );
    });

    it("keeps the returned rects after later measurements", () => {
      const { firstText, lastText } = createParagraph();

      const rects = RangeClientRects.getClientRectsOfNode(firstText);
      const snapshot = toPlainRects(rects);

      RangeClientRects.getClientRectsOfNode(lastText);

      expect(toPlainRects(rects)).toEqual(snapshot);
    });
  });

  describe("with a ClientLayout", () => {
    it("returns what getRangeClientRects returns for a fresh Range", () => {
      const { container, firstText, lastText } = createParagraph();
      const clientLayout = createClientLayout(container);
      const freshRange = document.createRange();
      freshRange.setStart(firstText, 4);
      freshRange.setEnd(lastText, 12);

      expect(
        RangeClientRects.getLayoutClientRectsBetween(
          clientLayout,
          RangeClientRects.at(firstText, 4),
          RangeClientRects.at(lastText, 12),
        ),
      ).toEqual(clientLayout.getRangeClientRects(freshRange));
    });

    it("returns what getRangeClientRects returns for the node contents", () => {
      const { container, emphasis } = createParagraph();
      const clientLayout = createClientLayout(container);
      const freshRange = document.createRange();
      freshRange.selectNodeContents(emphasis);

      expect(
        RangeClientRects.getLayoutClientRectsOfNodeContents(
          clientLayout,
          emphasis,
        ),
      ).toEqual(clientLayout.getRangeClientRects(freshRange));
    });
  });

  describe("the Range used for measurement", () => {
    it("is created once per document", () => {
      const { firstText, lastText } = createParagraph();
      const { frameDocument, frameText } = createFrameParagraph();
      RangeClientRects.getClientRectsOfNode(firstText);
      spyOn(document, "createRange").and.callThrough();
      spyOn(frameDocument, "createRange").and.callThrough();

      for (let i = 0; i < 100; i++) {
        RangeClientRects.getClientRectsOfNode(firstText);
        RangeClientRects.getClientRectsOfNode(frameText);
        RangeClientRects.getClientRectsBetween(
          RangeClientRects.at(lastText, 0),
          RangeClientRects.at(lastText, 1),
        );
      }

      expect(document.createRange).not.toHaveBeenCalled();
      expect(frameDocument.createRange).toHaveBeenCalledTimes(1);

      const range = frameDocument.createRange();
      range.selectNode(frameText);
      expect(
        toPlainRects(RangeClientRects.getClientRectsOfNode(frameText)),
      ).toEqual(toPlainRects(range.getClientRects()));
    });

    it("is collapsed at the start of its document once a measurement returns", () => {
      const { frameDocument, frameText } = createFrameParagraph();
      spyOn(frameDocument, "createRange").and.callThrough();

      RangeClientRects.getClientRectsOfNode(frameText);

      const range = frameDocument.createRange.calls.first().returnValue;
      expectCollapsedAtDocumentStart(range, frameDocument);

      expect(() => {
        RangeClientRects.getClientRectsBetween(
          RangeClientRects.at(frameText, 0),
          RangeClientRects.at(frameText, frameText.length + 1),
        );
      }).toThrow();

      expectCollapsedAtDocumentStart(range, frameDocument);
    });
  });
});
