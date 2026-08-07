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

import * as vivliostyle_break_position from "../../../src/vivliostyle/break-position";
import * as vivliostyle_layout_processor from "../../../src/vivliostyle/layout-processor";
import * as vivliostyle_node_context from "../../../src/vivliostyle/node-context";
import * as vivliostyle_vtree from "../../../src/vivliostyle/vtree";

describe("break-position", function () {
  "use strict";

  var column;

  beforeEach(function () {
    column = stubColumn();
  });

  function beforeEdgeOf(viewNode) {
    var opened = vivliostyle_node_context.openAt(
      document.createElement("div"),
      null,
      0,
      new vivliostyle_layout_processor.BlockFormattingContext(null),
      {
        shadowType: vivliostyle_vtree.ShadowType.NONE,
        shadowContext: null,
      },
      { offsetInNode: 0, after: false },
    );
    return vivliostyle_node_context.renderedElement(
      opened,
      viewNode,
      vivliostyle_node_context.elementRenderResultOf(opened),
    );
  }

  function afterEdgeOf(viewNode) {
    return vivliostyle_node_context.afterEdgeOf(beforeEdgeOf(viewNode));
  }

  function textPositionAt(viewNode, boxOffset) {
    var child = vivliostyle_node_context.openChildOf(
      viewNode,
      beforeEdgeOf(document.createElement("div")),
      boxOffset,
    );
    return vivliostyle_node_context.renderedText(child, viewNode, []);
  }

  function stubColumn() {
    return {
      overflows: false,
      vertical: false,
      isOverflown: function () {
        return this.overflows;
      },
      collectElementsOffset: function () {
        return [];
      },
      findEdgeBreakPosition: function (breakPosition) {
        return breakPosition.position;
      },
    };
  }

  function edgeBreakPosition(position) {
    var breakPosition = new vivliostyle_break_position.EdgeBreakPosition(
      position,
      null,
      false,
      0,
    );
    breakPosition.isEdgeUpdated = true;
    return breakPosition;
  }

  function overflowing() {
    column.overflows = true;
    return column;
  }

  function fitting() {
    column.overflows = false;
    return column;
  }

  describe("effectiveOverflow", function () {
    it("reports the overflow the value carries while no edge is recorded", function () {
      var fits = beforeEdgeOf(document.createElement("div"));
      var overflows = vivliostyle_node_context.setOverflow(
        beforeEdgeOf(document.createElement("div")),
        true,
      );
      expect(vivliostyle_break_position.effectiveOverflow(column, fits)).toBe(
        false,
      );
      expect(
        vivliostyle_break_position.effectiveOverflow(column, overflows),
      ).toBe(true);
    });

    it("prefers the verdict recorded for the same edge", function () {
      var position = vivliostyle_node_context.setOverflow(
        beforeEdgeOf(document.createElement("div")),
        false,
      );
      edgeBreakPosition(position).findAcceptableBreak(overflowing(), 10);
      expect(
        vivliostyle_break_position.effectiveOverflow(column, position),
      ).toBe(true);
    });

    it("takes back the record when the edge no longer overflows", function () {
      var position = beforeEdgeOf(document.createElement("div"));
      var breakPosition = edgeBreakPosition(position);
      breakPosition.findAcceptableBreak(overflowing(), 10);
      expect(
        vivliostyle_break_position.effectiveOverflow(column, position),
      ).toBe(true);
      breakPosition.findAcceptableBreak(fitting(), 10);
      expect(
        vivliostyle_break_position.effectiveOverflow(column, position),
      ).toBe(false);
    });

    it("keeps the overflow the value carries once the edge fits", function () {
      var position = vivliostyle_node_context.setOverflow(
        beforeEdgeOf(document.createElement("div")),
        true,
      );
      edgeBreakPosition(position).findAcceptableBreak(fitting(), 10);
      expect(
        vivliostyle_break_position.effectiveOverflow(column, position),
      ).toBe(true);
    });

    it("keeps the overflow another value carries at the same edge", function () {
      var viewNode = document.createElement("div");
      var probe = beforeEdgeOf(viewNode);
      var carrier = vivliostyle_node_context.setOverflow(
        beforeEdgeOf(viewNode),
        true,
      );
      edgeBreakPosition(probe).findAcceptableBreak(fitting(), 10);
      expect(vivliostyle_break_position.effectiveOverflow(column, probe)).toBe(
        false,
      );
      expect(
        vivliostyle_break_position.effectiveOverflow(column, carrier),
      ).toBe(true);
    });

    it("drops the record a previous layout pass left", function () {
      var position = beforeEdgeOf(document.createElement("div"));
      edgeBreakPosition(position).findAcceptableBreak(overflowing(), 10);
      expect(
        vivliostyle_break_position.effectiveOverflow(column, position),
      ).toBe(true);
      vivliostyle_break_position.beginLayoutPass(column);
      expect(
        vivliostyle_break_position.effectiveOverflow(column, position),
      ).toBe(false);
    });

    it("keeps the overflow the value carries across a layout pass", function () {
      var position = vivliostyle_node_context.setOverflow(
        beforeEdgeOf(document.createElement("div")),
        true,
      );
      vivliostyle_break_position.beginLayoutPass(column);
      expect(
        vivliostyle_break_position.effectiveOverflow(column, position),
      ).toBe(true);
    });

    it("records again on the edge a previous layout pass recorded", function () {
      var viewNode = document.createElement("div");
      var position = beforeEdgeOf(viewNode);
      edgeBreakPosition(position).findAcceptableBreak(overflowing(), 10);
      vivliostyle_break_position.beginLayoutPass(column);
      var reached = beforeEdgeOf(viewNode);
      edgeBreakPosition(reached).findAcceptableBreak(overflowing(), 10);
      expect(
        vivliostyle_break_position.effectiveOverflow(column, reached),
      ).toBe(true);
    });

    it("keeps the two edges of one view node apart", function () {
      var viewNode = document.createElement("div");
      var before = beforeEdgeOf(viewNode);
      var after = afterEdgeOf(viewNode);
      edgeBreakPosition(after).findAcceptableBreak(overflowing(), 10);
      expect(vivliostyle_break_position.effectiveOverflow(column, after)).toBe(
        true,
      );
      expect(vivliostyle_break_position.effectiveOverflow(column, before)).toBe(
        false,
      );
      edgeBreakPosition(before).findAcceptableBreak(overflowing(), 10);
      edgeBreakPosition(after).findAcceptableBreak(fitting(), 10);
      expect(vivliostyle_break_position.effectiveOverflow(column, before)).toBe(
        true,
      );
      expect(vivliostyle_break_position.effectiveOverflow(column, after)).toBe(
        false,
      );
    });

    it("keeps the two offsets of one text node apart", function () {
      var viewNode = document.createTextNode("text");
      var head = textPositionAt(viewNode, 1);
      var tail = textPositionAt(viewNode, 3);
      edgeBreakPosition(tail).findAcceptableBreak(overflowing(), 10);
      expect(vivliostyle_break_position.effectiveOverflow(column, tail)).toBe(
        true,
      );
      expect(vivliostyle_break_position.effectiveOverflow(column, head)).toBe(
        false,
      );
      edgeBreakPosition(head).findAcceptableBreak(overflowing(), 10);
      edgeBreakPosition(tail).findAcceptableBreak(fitting(), 10);
      expect(vivliostyle_break_position.effectiveOverflow(column, head)).toBe(
        true,
      );
      expect(vivliostyle_break_position.effectiveOverflow(column, tail)).toBe(
        false,
      );
    });

    it("keeps the record out of another column's reach", function () {
      var position = beforeEdgeOf(document.createElement("div"));
      edgeBreakPosition(position).findAcceptableBreak(overflowing(), 10);
      expect(
        vivliostyle_break_position.effectiveOverflow(column, position),
      ).toBe(true);
      expect(
        vivliostyle_break_position.effectiveOverflow(stubColumn(), position),
      ).toBe(false);
    });

    it("keeps the record a nested column's layout pass leaves alone", function () {
      var position = beforeEdgeOf(document.createElement("div"));
      edgeBreakPosition(position).findAcceptableBreak(overflowing(), 10);
      vivliostyle_break_position.beginLayoutPass(Object.create(column));
      expect(
        vivliostyle_break_position.effectiveOverflow(column, position),
      ).toBe(true);
    });
  });
});
