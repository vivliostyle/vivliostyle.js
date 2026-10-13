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

import * as layout from "../../../src/vivliostyle/layout";
import * as table from "../../../src/vivliostyle/table";
import * as vtree from "../../../src/vivliostyle/vtree";

describe("table", function () {
  describe("whole-table layout constraints", function () {
    var strategy, column, checkPoint, state;

    beforeEach(function () {
      var sourceTable = document.createElement("table");
      var formattingContext = new table.TableFormattingContext(
        null,
        sourceTable,
      );
      checkPoint = new vtree.NodeContext(
        document.createTextNode("Text before a forbidden footnote call"),
        null,
        0,
        formattingContext,
      );
      checkPoint.viewNode = checkPoint.sourceNode;
      column = {
        postLayoutBlock: jasmine.createSpy("postLayoutBlock"),
        layoutConstraint: {
          allowLayout: jasmine.createSpy("allowLayout").and.returnValue(true),
        },
      };
      strategy = new table.EntireTableLayoutStrategy(formattingContext, column);
      state = { nodeContext: checkPoint };
    });

    it("checks constraints after the rendered checkpoints have been processed", function () {
      column.postLayoutBlock.and.callFake(function () {
        column.layoutConstraint.allowLayout.and.returnValue(false);
      });
      strategy.startNonElementNode(state);
      strategy.postLayoutBlockContents(state);

      expect(strategy.violatesLayoutConstraint).toBe(true);
      expect(column.layoutConstraint.allowLayout).toHaveBeenCalled();
      expect(strategy.checkPoints.length).toBe(0);

      column.layoutConstraint.allowLayout.and.returnValue(true);
      column.postLayoutBlock.and.stub();
      strategy.startNonElementNode(state);
      strategy.postLayoutBlockContents(state);
      expect(strategy.violatesLayoutConstraint).toBe(true);
    });

    it("accepts a whole table whose rendered checkpoints satisfy the constraints", function () {
      strategy.startNonElementNode(state);
      strategy.postLayoutBlockContents(state);

      expect(column.postLayoutBlock).toHaveBeenCalled();
      expect(column.layoutConstraint.allowLayout).toHaveBeenCalled();
      expect(strategy.violatesLayoutConstraint).toBe(false);
    });
  });

  describe("row overflow from cell layout constraints", function () {
    var formattingContext, column, strategy, rowContext, checkPoint, cell;

    beforeEach(function () {
      var sourceTable = document.createElement("table");
      var sourceRow = document.createElement("tr");
      var sourceCell = document.createElement("td");
      sourceTable.appendChild(sourceRow);
      sourceRow.appendChild(sourceCell);
      formattingContext = new table.TableFormattingContext(null, sourceTable);
      formattingContext.addRow(0, new table.TableRow(0, sourceRow));
      formattingContext.addCell(0, 0, sourceCell);
      cell = formattingContext.getRowByIndex(0).cells[0];
      rowContext = new vtree.NodeContext(sourceRow, null, 0, formattingContext);
      rowContext.display = "table-row";
      rowContext.inline = false;
      rowContext.after = true;
      rowContext.viewNode = sourceRow;
      checkPoint = new vtree.NodeContext(
        document.createTextNode("Cell text"),
        rowContext,
        1,
        formattingContext,
      );
      checkPoint.overflow = true;
      var layoutConstraint = {
        allowLayout: jasmine.createSpy("allowLayout").and.returnValue(false),
      };
      column = {
        stopAtOverflow: true,
        breakPositions: [],
        checkOverflowAndSaveEdge: jasmine
          .createSpy("checkOverflowAndSaveEdge")
          .and.returnValue(false),
        layoutConstraint: layoutConstraint,
        nodeContextOverflowingDueToRepetitiveElements: null,
      };
      formattingContext.addCellFragment(0, 0, {
        pseudoColumn: {
          getColumn: function () {
            return {
              breakPositions: [new layout.BoxBreakPosition([checkPoint], 0)],
              layoutConstraint: layoutConstraint,
            };
          },
        },
      });
      strategy = new table.TableLayoutStrategy(formattingContext, column);
      strategy.currentRowIndex = 0;
    });

    function finishRow() {
      var state = {
        nodeContext: rowContext,
        onStartEdges: false,
        break: false,
      };
      strategy.afterNonInlineElementNode(state).get();
      return state;
    }

    it("stops a geometrically fitting row when a cell checkpoint violates a constraint", function () {
      var state = finishRow();

      expect(column.checkOverflowAndSaveEdge).toHaveBeenCalledWith(
        rowContext,
        null,
      );
      expect(rowContext.overflow).toBe(true);
      expect(state.break).toBe(true);
      expect(column.stopAtOverflow).toBe(true);
    });

    it("keeps rendering a spanning row when checkpoint overflow is only geometric", function () {
      cell.rowSpan = 2;
      column.layoutConstraint.allowLayout.and.returnValue(true);

      var state = finishRow();

      expect(rowContext.overflow).toBe(false);
      expect(state.break).toBe(false);
      expect(column.stopAtOverflow).toBe(false);
    });
  });
});
