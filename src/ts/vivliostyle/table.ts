/**
 * Copyright 2016 Trim-marks Inc.
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
 *
 * @fileoverview Table formatting context and layout.
 */
import * as base from '../adapt/base';
import {ident} from '../adapt/css';
import * as task from '../adapt/task';
import {ViewFactory} from '../adapt/vgen';
import * as vtreeImpl from '../adapt/vtree';
import * as asserts from './asserts';
import * as breakposition from './breakposition';
import * as layouthelper from './layouthelper';
import * as layoutprocessor from './layoutprocessor';
import * as layoutretryer from './layoutretryer';
import * as layoututil from './layoututil';
import * as plugin from './plugin';
import * as repetitiveelementImpl from './repetitiveelements';
import {registerFragmentIndex} from './selectors';
import {layout, repetitiveelement, table, vtree, FormattingContextType, FragmentLayoutConstraintType} from './types';

export class TableRow {
  cells: TableCell[] = [];

  constructor(
      public readonly rowIndex: number, public readonly sourceNode: Node) {}

  addCell(cell: TableCell) {
    this.cells.push(cell);
  }

  getMinimumHeight(): number {
    return Math.min.apply(null, this.cells.map((c) => c.height));
  }
}

export class TableCell {
  viewElement: Element|null;
  colSpan: number;
  rowSpan: number;
  height: number = 0;
  anchorSlot: TableSlot = null;

  constructor(
      public readonly rowIndex: number, public readonly columnIndex: number,
      viewElement: Element) {
    this.viewElement = viewElement;
    this.colSpan = (viewElement as HTMLTableCellElement).colSpan || 1;
    this.rowSpan = (viewElement as HTMLTableCellElement).rowSpan || 1;
  }

  setHeight(height: number) {
    this.height = height;
  }

  setAnchorSlot(slot: TableSlot) {
    this.anchorSlot = slot;
  }
}

export class TableSlot {
  constructor(
      public readonly rowIndex: number, public readonly columnIndex: number,
      public readonly cell: TableCell) {}
}

export class TableCellFragment {
  pseudoColumn: any;
  empty: boolean = false;

  constructor(
      public readonly column: layout.Column, pseudoColumnContainer: Element,
      public readonly cellNodeContext: vtree.NodeContext) {
    this.pseudoColumn =
        new layoututil.PseudoColumn(column, pseudoColumnContainer, cellNodeContext);
  }

  findAcceptableBreakPosition(): layout.BreakPositionAndNodeContext {
    const element = (this.cellNodeContext.viewNode as Element);
    const verticalAlign = this.cellNodeContext.verticalAlign;
    if (verticalAlign === 'middle' || verticalAlign === 'bottom') {
      base.setCSSProperty(element, 'vertical-align', 'top');
    }
    const bp = this.pseudoColumn.findAcceptableBreakPosition(true);
    base.setCSSProperty(element, 'vertical-align', verticalAlign);
    return bp;
  }
}

export class TableCaptionView {
  constructor(public readonly viewNode: Element, public readonly side: string) {
  }
}

export class BetweenTableRowBreakPosition extends breakposition.EdgeBreakPosition {
  private formattingContext: any;

  /** Array<!adapt.layout.BreakPositionAndNodeContext> */
  acceptableCellBreakPositions: any = null;
  private rowIndex: number|null = null;

  constructor(
      position: vtree.NodeContext, breakOnEdge: string|null, overflows: boolean,
      columnBlockSize: number) {
    super(position, breakOnEdge, overflows, columnBlockSize);
    this.formattingContext = position.formattingContext;
  }

  /**
   * @override
   */
  findAcceptableBreak(column, penalty) {
    const breakNodeContext =
        super.findAcceptableBreak(column, penalty);
    if (penalty < this.getMinBreakPenalty()) {
      return null;
    }
    const allCellsBreakable =
        this.getAcceptableCellBreakPositions().every((bp) => !!bp.nodeContext);
    if (allCellsBreakable) {
      return breakNodeContext;
    } else {
      return null;
    }
  }

  /**
   * @override
   */
  getMinBreakPenalty() {
    let penalty = super.getMinBreakPenalty();
    this.getAcceptableCellBreakPositions().forEach((bp) => {
      penalty += bp.breakPosition.getMinBreakPenalty();
    });
    return penalty;
  }

  getAcceptableCellBreakPositions(): layout.BreakPositionAndNodeContext[] {
    if (!this.acceptableCellBreakPositions) {
      const formattingContext = this.formattingContext;
      const cellFragments = this.getCellFragments();
      this.acceptableCellBreakPositions = cellFragments.map(
          (cellFragment) => cellFragment.findAcceptableBreakPosition());
    }
    return this.acceptableCellBreakPositions;
  }

  private getRowIndex(): number {
    if (this.rowIndex != null) {
      return this.rowIndex;
    }
    return this.rowIndex = this.formattingContext.findRowIndexBySourceNode(
               this.position.sourceNode);
  }

  private getCellFragments() {
    return this.formattingContext
        .getRowSpanningCellsOverflowingTheRow(this.getRowIndex())
        .map(
            this.formattingContext.getCellFragmentOfCell,
            this.formattingContext);
  }
}

export class InsideTableRowBreakPosition extends breakposition.AbstractBreakPosition {
  acceptableCellBreakPositions: layout.BreakPositionAndNodeContext[] = null;

  constructor(
      public readonly rowIndex: number,
      public readonly beforeNodeContext: vtree.NodeContext,
      public readonly formattingContext: TableFormattingContext) {
    super();
  }

  /**
   * @override
   */
  findAcceptableBreak(column, penalty) {
    if (penalty < this.getMinBreakPenalty()) {
      return null;
    }
    const cellFragments = this.getCellFragments();
    const acceptableCellBreakPositions = this.getAcceptableCellBreakPositions();
    const allCellsBreakable =
        acceptableCellBreakPositions.every((bp) => !!bp.nodeContext) &&
        acceptableCellBreakPositions.some((bp, index) => {
          const pseudoColumn = cellFragments[index].pseudoColumn;
          const nodeContext = bp.nodeContext;
          return !pseudoColumn.isStartNodeContext(nodeContext) &&
              !pseudoColumn.isLastAfterNodeContext(nodeContext);
        });
    this.beforeNodeContext.overflow = acceptableCellBreakPositions.some(
        (bp) => bp.nodeContext && bp.nodeContext.overflow);
    if (allCellsBreakable) {
      return this.beforeNodeContext;
    } else {
      return null;
    }
  }

  /**
   * @override
   */
  getMinBreakPenalty() {
    const formattingContext = this.formattingContext;
    const row = formattingContext.getRowByIndex(this.rowIndex);
    let penalty = 0;
    if (!formattingContext.isFreelyFragmentableRow(row)) {
      penalty += 10;
    }
    this.getAcceptableCellBreakPositions().forEach((bp) => {
      penalty += bp.breakPosition.getMinBreakPenalty();
    });
    return penalty;
  }

  getAcceptableCellBreakPositions(): layout.BreakPositionAndNodeContext[] {
    if (!this.acceptableCellBreakPositions) {
      const cellFragments = this.getCellFragments();
      this.acceptableCellBreakPositions = cellFragments.map(
          (cellFragment) => cellFragment.findAcceptableBreakPosition());
    }
    return this.acceptableCellBreakPositions;
  }

  private getCellFragments() {
    return this.formattingContext.getCellsFallingOnRow(this.rowIndex)
        .map(
            this.formattingContext.getCellFragmentOfCell,
            this.formattingContext);
  }
}

type BrokenTableCellPosition = {
  cellNodePosition: vtree.NodePosition,
  breakChunkPosition: vtree.ChunkPosition,
  cell: TableCell
};

export {BrokenTableCellPosition};

/**
 * @param tableSourceNode Source node of the table
 */
export class TableFormattingContext
    extends repetitiveelementImpl.RepetitiveElementsOwnerFormattingContext
    implements table.TableFormattingContext {

  formattingContextType: FormattingContextType = 'Table';
  vertical: boolean = false;
  columnCount: number = -1;
  tableWidth: number = 0;
  captions: TableCaptionView[] = [];
  colGroups: DocumentFragment|null = null;
  colWidths: number[]|null = null;
  inlineBorderSpacing: number = 0;
  rows: TableRow[] = [];
  slots: TableSlot[][] = [];
  cellFragments: TableCellFragment[][] = [];
  lastRowViewNode: Element|null = null;
  cellBreakPositions: BrokenTableCellPosition[] = [];
  repetitiveElements: repetitiveelement.RepetitiveElements|null = null;

  constructor(
      parent: vtree.FormattingContext,
      public readonly tableSourceNode: Element) {
    super(parent, tableSourceNode);
  }

  /**
   * @override
   */
  getName() {return 'Table formatting context (vivliostyle.table.TableFormattingContext)';}

  /**
   * @override
   */
  isFirstTime(nodeContext, firstTime) {
    if (!firstTime) {
      return firstTime;
    }
    switch (nodeContext.display) {
      case 'table-row':
        return this.cellBreakPositions.length === 0;
      case 'table-cell':
        return !this.cellBreakPositions.some(
            (p) => p.cellNodePosition.steps[0].node === nodeContext.sourceNode);
      default:
        return firstTime;
    }
  }

  /**
   * @override
   */
  getParent() {
    return this.parent;
  }

  finishFragment() {
    this.cellFragments = [];
  }

  addRow(rowIndex: number, row: TableRow) {
    this.rows[rowIndex] = row;
  }

  getRowSlots(rowIndex: number): TableSlot[] {
    let rowSlots = this.slots[rowIndex];
    if (!rowSlots) {
      rowSlots = this.slots[rowIndex] = [];
    }
    return rowSlots;
  }

  addCell(rowIndex: number, cell: TableCell) {
    let row = this.rows[rowIndex];
    if (!row) {
      this.addRow(rowIndex, new TableRow(rowIndex, null));
      row = this.rows[rowIndex];
    }
    asserts.assert(row);
    row.addCell(cell);
    const rowUpper = rowIndex + cell.rowSpan;
    let rowSlots = this.getRowSlots(rowIndex);
    let startColIndex = 0;
    while (rowSlots[startColIndex]) {
      startColIndex++;
    }
    for (; rowIndex < rowUpper; rowIndex++) {
      rowSlots = this.getRowSlots(rowIndex);
      for (let i = startColIndex; i < startColIndex + cell.colSpan; i++) {
        const slot = rowSlots[i] = new TableSlot(rowIndex, i, cell);
        if (!cell.anchorSlot) {
          cell.setAnchorSlot(slot);
        }
      }
    }
  }

  getRowByIndex(index: number): TableRow {
    const row = this.rows[index];
    asserts.assert(row);
    return row;
  }

  findRowIndexBySourceNode(sourceNode: Node): number {
    return this.rows.findIndex((row) => sourceNode === row.sourceNode);
  }

  addCellFragment(
      rowIndex: number, columnIndex: number, cellFragment: TableCellFragment) {
    let list = this.cellFragments[rowIndex];
    if (!list) {
      list = this.cellFragments[rowIndex] = [];
    }
    list[columnIndex] = cellFragment;
  }

  getCellsFallingOnRow(rowIndex: number): TableCell[] {
    const rowSlots = this.getRowSlots(rowIndex);
    return rowSlots.reduce((uniqueCells, slot) => {
      if (slot.cell !== uniqueCells[uniqueCells.length - 1]) {
        return uniqueCells.concat(slot.cell);
      } else {
        return uniqueCells;
      }
    }, []);
  }

  getRowSpanningCellsOverflowingTheRow(rowIndex: number): TableCell[] {
    return this.getCellsFallingOnRow(rowIndex).filter(
        (cell) => cell.rowIndex + cell.rowSpan - 1 > rowIndex);
  }

  getCellFragmentOfCell(cell: TableCell): TableCellFragment {
    return this.cellFragments[cell.rowIndex] &&
        this.cellFragments[cell.rowIndex][cell.columnIndex];
  }

  isFreelyFragmentableRow(row: TableRow): boolean {
    return row.getMinimumHeight() > this.tableWidth / 2;
  }

  getColumnCount(): number {
    if (this.columnCount < 0) {
      this.columnCount = Math.max.apply(
          null,
          this.rows.map(
              (row) => row.cells.reduce((sum, c) => sum + c.colSpan, 0)));
    }
    return this.columnCount;
  }

  updateCellSizes(clientLayout: vtree.ClientLayout) {
    this.rows.forEach(function(row) {
      row.cells.forEach(function(cell) {
        const rect = clientLayout.getElementClientRect(cell.viewElement as Element);
        cell.viewElement = null;
        cell.setHeight(this.vertical ? rect['width'] : rect['height']);
      }, this);
    }, this);
  }

  /**
   * @return position
   */
  findCellFromColumn(column: layout.Column):
      {rowIndex: number, columnIndex: number}|null {
    if (!column) {
      return null;
    }
    let tableCell = null;
    let row = 0;
    let col = 0
    loop: for (row = 0; row < this.cellFragments.length; row++) {
      if (!this.cellFragments[row]) {
        continue;
      }
      for (col = 0; col < this.cellFragments[row].length; col++) {
        if (!this.cellFragments[row][col]) {
          continue;
        }
        if (column === this.cellFragments[row][col].pseudoColumn.getColumn()) {
          tableCell = this.rows[row].cells[col];
          break loop;
        }
      }
    }
    if (!tableCell) {
      return null;
    }
    for (; row < this.slots.length; row++) {
      for (; col < this.slots[row].length; col++) {
        const slot = this.slots[row][col];
        if (slot.cell === tableCell) {
          return {rowIndex: slot.rowIndex, columnIndex: slot.columnIndex};
        }
      }
    }
    return null;
  }

  collectElementsOffsetOfUpperCells(
      position:{rowIndex: number, columnIndex: number}|null): repetitiveelement.ElementsOffset[] {
    const collected = [];
    return this.slots.reduce((repetitiveElements, row, index) => {
      if (index >= position.rowIndex) {
        return repetitiveElements;
      }
      const cellFragment =
          this.getCellFragmentOfCell(row[position.columnIndex].cell);
      if (!cellFragment || collected.includes(cellFragment)) {
        return repetitiveElements;
      }
      this.collectElementsOffsetFromColumn(
          cellFragment.pseudoColumn.getColumn(), repetitiveElements);
      collected.push(cellFragment);
      return repetitiveElements;
    }, [] as repetitiveelement.ElementsOffset[]);
  }

  collectElementsOffsetOfHighestColumn(): repetitiveelement.ElementsOffset[] {
    const elementsInColumn = [];
    this.rows.forEach((row) => {
      row.cells.forEach((cell, index) => {
        if (!elementsInColumn[index]) {
          elementsInColumn[index] = {collected: [], elements: []};
        }
        const state = elementsInColumn[index];
        const cellFragment = this.getCellFragmentOfCell(cell);
        if (!cellFragment || state.collected.includes(cellFragment)) {
          return;
        }
        this.collectElementsOffsetFromColumn(
            cellFragment.pseudoColumn.getColumn(), state.elements);
        state.collected.push(cellFragment);
      });
    });
    return [new ElementsOffsetOfTableCell(
        elementsInColumn.map((entry) => entry.elements))];
  }

  private collectElementsOffsetFromColumn(
      column: layout.Column,
      repetitiveElements: repetitiveelement.ElementsOffset[]) {
    column.fragmentLayoutConstraints.forEach((constraint) => {
      if (repetitiveelement.isInstanceOfRepetitiveElementsOwnerLayoutConstraint(constraint)) {
        const repetitiveElement = constraint.getRepetitiveElements();
        repetitiveElements.push(repetitiveElement);
      }
      if (table.isInstanceOfTableRowLayoutConstraint(constraint)) {
        constraint.getElementsOffsetsForTableCell(null).forEach(
            (repetitiveElement) => {
              repetitiveElements.push(repetitiveElement);
            });
      }
    });
  }

  /** @override */
  saveState() {
    return [].concat(this.cellBreakPositions);
  }

  /** @override */
  restoreState(state) {
    this.cellBreakPositions = (state as BrokenTableCellPosition[]);
  }
}

export class ElementsOffsetOfTableCell implements repetitiveelement.ElementsOffset {
  constructor(public readonly repeatitiveElementsInColumns:
                  repetitiveelement.ElementsOffset[][]) {}

  /** @override */
  calculateOffset(nodeContext) {
    return this.calculateMaxOffsetOfColumn(
        nodeContext, (offsets) => offsets.current);
  }

  /** @override */
  calculateMinimumOffset(nodeContext) {
    return this.calculateMaxOffsetOfColumn(
        nodeContext, (offsets) => offsets.minimum);
  }

  private calculateMaxOffsetOfColumn(nodeContext, resolver) {
    let maxOffset = 0;
    this.repeatitiveElementsInColumns.forEach((repetitiveElements) => {
      const offsets = breakposition.calculateOffset(nodeContext, repetitiveElements);
      maxOffset = Math.max(maxOffset, resolver(offsets));
    });
    return maxOffset;
  }
}

function getTableFormattingContext(formattingContext: vtree.FormattingContext):
    TableFormattingContext {
  asserts.assert(formattingContext instanceof TableFormattingContext);
  return (formattingContext as TableFormattingContext);
}

function isTableRowGrouping(display: string|null): boolean {
  return display === 'table-row-group' || display === 'table-header-group' ||
      display === 'table-footer-group';
}

function isTableRoot(display: string|null): boolean {
  return display === 'table' || display === 'inline-table';
}

function isValidParentOfTableRow(display: string|null): boolean {
  return isTableRowGrouping(display) || isTableRoot(display);
}

function skipNestedTable(
    state: layoututil.LayoutIteratorState,
    formattingContext: TableFormattingContext,
    column: layout.Column): task.Result<boolean>|null {
  const nodeContext = state.nodeContext;
  const display = nodeContext.display;
  const parentDisplay = nodeContext.parent ? nodeContext.parent.display : null;
  const isNestedTable =
      display === 'table-row' && !isValidParentOfTableRow(parentDisplay) ||
      display === 'table-cell' && parentDisplay !== 'table-row' &&
          !isValidParentOfTableRow(parentDisplay) ||
      nodeContext.formattingContext instanceof TableFormattingContext &&
          nodeContext.formattingContext !== formattingContext;
  if (isNestedTable) {
    return column.buildDeepElementView(nodeContext)
        .thenAsync((nodeContextAfter) => {
          state.nodeContext = nodeContextAfter;
          return task.newResult(true);
        });
  } else {
    return null;
  }
}

export class EntireTableLayoutStrategy extends
    layoututil.EdgeSkipper {
  rowIndex: number = -1;
  columnIndex: number = 0;
  inRow: boolean = false;
  checkPoints: vtree.NodeContext[] = [];
  inHeaderOrFooter: any;

  constructor(
      public readonly formattingContext: TableFormattingContext,
      public readonly column: layout.Column) {
        super();
      }

  /**
   * @override
   */
  startNonInlineElementNode(state) {
    const formattingContext = this.formattingContext;
    const r = skipNestedTable(state, formattingContext, this.column);
    if (r) {
      return r;
    }
    this.postLayoutBlockContents(state);
    const nodeContext = state.nodeContext;
    const display = nodeContext.display;
    const repetitiveElements = formattingContext.getRepetitiveElements();
    switch (display) {
      case 'table':
        formattingContext.inlineBorderSpacing = nodeContext.inlineBorderSpacing;
        break;
      case 'table-caption':
        const captionView = new TableCaptionView(
            (nodeContext.viewNode as Element), nodeContext.captionSide);
        formattingContext.captions.push(captionView);
        break;
      case 'table-header-group':
        if (!repetitiveElements.isHeaderRegistered()) {
          this.inHeaderOrFooter = true;
          repetitiveElements.setHeaderNodeContext(nodeContext);
        }
        return task.newResult(true);
      case 'table-footer-group':
        if (!repetitiveElements.isFooterRegistered()) {
          this.inHeaderOrFooter = true;
          repetitiveElements.setFooterNodeContext(nodeContext);
        }
        return task.newResult(true);
      case 'table-row':
        if (!this.inHeaderOrFooter) {
          this.inRow = true;
          this.rowIndex++;
          asserts.assert(nodeContext.sourceNode);
          this.columnIndex = 0;
          formattingContext.addRow(
              this.rowIndex,
              new TableRow(this.rowIndex, nodeContext.sourceNode));
          if (!repetitiveElements.firstContentSourceNode) {
            repetitiveElements.firstContentSourceNode =
                (nodeContext.sourceNode as Element);
          }
        }
        break;
    }
    return super.startNonInlineElementNode(state);
  }

  /**
   * @override
   */
  afterNonInlineElementNode(state) {
    const formattingContext = this.formattingContext;
    const nodeContext = state.nodeContext;
    const display = nodeContext.display;
    const clientLayout = this.column.clientLayout;
    this.postLayoutBlockContents(state);
    if (nodeContext.sourceNode === formattingContext.tableSourceNode) {
      const computedStyle = clientLayout.getElementComputedStyle(
          formattingContext.getRootViewNode(nodeContext) as Element);
      formattingContext.tableWidth = parseFloat(
          computedStyle[formattingContext.vertical ? 'height' : 'width']);
      formattingContext.getRepetitiveElements().lastContentSourceNode =
          state.lastAfterNodeContext && state.lastAfterNodeContext.sourceNode;
      state.break = true;
    } else {
      switch (display) {
        case 'table-header-group':
        case 'table-footer-group':
          if (this.inHeaderOrFooter) {
            this.inHeaderOrFooter = false;
            return task.newResult(true);
          }
          break;
        case 'table-row':
          if (!this.inHeaderOrFooter) {
            formattingContext.lastRowViewNode =
                (nodeContext.viewNode as Element);
            this.inRow = false;
          }
          break;
        case 'table-cell':
          if (!this.inHeaderOrFooter) {
            if (!this.inRow) {
              this.rowIndex++;
              this.columnIndex = 0;
              this.inRow = true;
            }
            const elem = (nodeContext.viewNode as Element);
            formattingContext.addCell(
                this.rowIndex,
                new TableCell(this.rowIndex, this.columnIndex, elem));
            this.columnIndex++;
          }
          break;
      }
    }
    return super.afterNonInlineElementNode(state);
  }

  /** @override */
  startNonElementNode(state) {
    this.registerCheckPoint(state);
  }

  /** @override */
  afterNonElementNode(state) {
    this.registerCheckPoint(state);
  }

  /** @override */
  startInlineElementNode(state) {
    this.registerCheckPoint(state);
  }

  /** @override */
  afterInlineElementNode(state) {
    this.registerCheckPoint(state);
  }

  registerCheckPoint(state: layoututil.LayoutIteratorState) {
    const nodeContext = state.nodeContext;
    if (nodeContext && nodeContext.viewNode &&
        !layouthelper.isSpecialNodeContext(nodeContext)) {
      this.checkPoints.push(nodeContext.clone());
    }
  }

  postLayoutBlockContents(state: layoututil.LayoutIteratorState) {
    if (this.checkPoints.length > 0) {
      this.column.postLayoutBlock(state.nodeContext, this.checkPoints);
    }
    this.checkPoints = [];
  }
}

export class TableLayoutStrategy extends layoututil.EdgeSkipper {
  private static ignoreList: {[key: string]: boolean} = {
    'table-caption': true,
    'table-column-group': true,
    'table-column': true
  };
  inRow: boolean = false;
  currentRowIndex: number = -1;
  currentColumnIndex: number = 0;
  originalStopAtOverflow: boolean;
  inHeader: any;
  inFooter: any;

  constructor(
      public readonly formattingContext: TableFormattingContext,
      public readonly column: layout.Column) {
    super(true);
    this.originalStopAtOverflow = column.stopAtOverflow;
    column.stopAtOverflow = false;
  }

  resetColumn() {
    this.column.stopAtOverflow = this.originalStopAtOverflow;
  }

  getColSpanningCellWidth(cell: TableCell): number {
    const colWidths = this.formattingContext.colWidths;
    asserts.assert(colWidths);
    let width = 0;
    for (let i = 0; i < cell.colSpan; i++) {
      width += colWidths[cell.anchorSlot.columnIndex + i];
    }
    width += this.formattingContext.inlineBorderSpacing * (cell.colSpan - 1);
    return width;
  }

  layoutCell(
      cell: TableCell, cellNodeContext: vtree.NodeContext,
      startChunkPosition: vtree.ChunkPosition): task.Result<boolean> {
    const rowIndex = cell.rowIndex;
    const columnIndex = cell.columnIndex;
    const colSpan = cell.colSpan;
    const cellViewNode = (cellNodeContext.viewNode as Element);
    const verticalAlign = cellNodeContext.verticalAlign;
    if (colSpan > 1) {
      base.setCSSProperty(cellViewNode, 'box-sizing', 'border-box');
      base.setCSSProperty(
          cellViewNode, this.formattingContext.vertical ? 'height' : 'width',
          `${this.getColSpanningCellWidth(cell)}px`);
    }
    const pseudoColumnContainer =
        cellViewNode.ownerDocument.createElement('div');
    cellViewNode.appendChild(pseudoColumnContainer);
    const cellFragment = new TableCellFragment(
        this.column, pseudoColumnContainer, cellNodeContext);
    this.formattingContext.addCellFragment(rowIndex, columnIndex, cellFragment);
    if (startChunkPosition.primary.steps.length === 1 &&
        startChunkPosition.primary.after) {
      // Contents of the cell have ended in the previous fragment
      cellFragment.empty = true;
    }
    return cellFragment.pseudoColumn.layout(startChunkPosition, true)
        .thenReturn(true);
  }

  hasBrokenCellAtSlot(slotIndex): boolean {
    const cellBreakPosition = this.formattingContext.cellBreakPositions[0];
    if (cellBreakPosition) {
      return cellBreakPosition.cell.anchorSlot.columnIndex === slotIndex;
    }
    return false;
  }

  private extractRowSpanningCellBreakPositions(): BrokenTableCellPosition[][] {
    const cellBreakPositions = this.formattingContext.cellBreakPositions;
    if (cellBreakPositions.length === 0) {
      return [];
    }
    const rowSpanningCellBreakPositions = [];
    let i = 0;
    do {
      const p = cellBreakPositions[i];
      const rowIndex = p.cell.rowIndex;
      if (rowIndex < this.currentRowIndex) {
        let arr = rowSpanningCellBreakPositions[rowIndex];
        if (!arr) {
          arr = rowSpanningCellBreakPositions[rowIndex] = [];
        }
        arr.push(p);
        cellBreakPositions.splice(i, 1);
      } else {
        i++;
      }
    } while (i < cellBreakPositions.length);
    return rowSpanningCellBreakPositions;
  }

  layoutRowSpanningCellsFromPreviousFragment(
      state: layoututil.LayoutIteratorState): task.Result<boolean> {
    const formattingContext = this.formattingContext;
    const rowSpanningCellBreakPositions =
        this.extractRowSpanningCellBreakPositions();
    const rowCount = rowSpanningCellBreakPositions.reduce((s) => s + 1, 0);
    if (rowCount === 0) {
      return task.newResult(true);
    }
    const layoutContext = this.column.layoutContext;
    const currentRow = state.nodeContext;
    currentRow.viewNode.parentNode.removeChild(currentRow.viewNode);
    const frame = task.newFrame<boolean>('layoutRowSpanningCellsFromPreviousFragment');
    let cont = task.newResult(true);
    let spanningCellRowIndex = 0;
    const occupiedSlotIndices = [];
    rowSpanningCellBreakPositions.forEach(function(rowCellBreakPositions) {
      cont = cont.thenAsync(() => {
        // Is it always correct to assume steps[1] to be the row?
        const rowNodeContext = vtreeImpl.makeNodeContextFromNodePositionStep(
            rowCellBreakPositions[0].cellNodePosition.steps[1],
            currentRow.parent);
        return layoutContext.setCurrent(rowNodeContext, false).thenAsync(() => {
          let cont1 = task.newResult(true);
          let columnIndex = 0;

          function addDummyCellUntil(upperColumnIndex) {
            while (columnIndex < upperColumnIndex) {
              if (!occupiedSlotIndices.includes(columnIndex)) {
                const dummy =
                    rowNodeContext.viewNode.ownerDocument.createElement('td');
                base.setCSSProperty(dummy, 'padding', '0');
                rowNodeContext.viewNode.appendChild(dummy);
              }
              columnIndex++;
            }
          }
          rowCellBreakPositions.forEach(function(cellBreakPosition) {
            cont1 = cont1.thenAsync(() => {
              const cell = cellBreakPosition.cell;
              addDummyCellUntil(cell.anchorSlot.columnIndex);
              const cellNodePosition = cellBreakPosition.cellNodePosition;
              const cellNodeContext = vtreeImpl.makeNodeContextFromNodePositionStep(
                  cellNodePosition.steps[0], rowNodeContext);
              cellNodeContext.offsetInNode = cellNodePosition.offsetInNode;
              cellNodeContext.after = cellNodePosition.after;
              cellNodeContext.fragmentIndex =
                  cellNodePosition.steps[0].fragmentIndex + 1;
              return layoutContext.setCurrent(cellNodeContext, false)
                  .thenAsync(() => {
                    const breakChunkPosition =
                        cellBreakPosition.breakChunkPosition;
                    for (let i = 0; i < cell.colSpan; i++) {
                      occupiedSlotIndices.push(columnIndex + i);
                    }
                    columnIndex += cell.colSpan;
                    return this
                        .layoutCell(cell, cellNodeContext, breakChunkPosition)
                        .thenAsync(() => {
                          (cellNodeContext.viewNode as HTMLTableCellElement).rowSpan = cell.rowIndex +
                              cell.rowSpan - this.currentRowIndex + rowCount -
                              spanningCellRowIndex;
                          return task.newResult(true);
                        });
                  });
            });
          }, this);
          return cont1.thenAsync(() => {
            addDummyCellUntil(formattingContext.getColumnCount());
            spanningCellRowIndex++;
            return task.newResult(true);
          });
        });
      });
    }, this);
    cont.then(() => {
      layoutContext.setCurrent(currentRow, true, state.atUnforcedBreak)
          .then(() => {
            frame.finish(true);
          });
    });
    return frame.result();
  }

  startTableRow(state: layoututil.LayoutIteratorState): task.Result<boolean> {
    if (this.inHeader || this.inFooter) {
      return task.newResult(true);
    }
    const nodeContext = state.nodeContext;
    const formattingContext = this.formattingContext;
    if (this.currentRowIndex < 0) {
      asserts.assert(nodeContext.sourceNode);
      this.currentRowIndex =
          formattingContext.findRowIndexBySourceNode(nodeContext.sourceNode);
    } else {
      this.currentRowIndex++;
    }
    this.currentColumnIndex = 0;
    this.inRow = true;
    return this.layoutRowSpanningCellsFromPreviousFragment(state).thenAsync(
        () => {
          this.registerCellFragmentIndex();
          const overflown =
              this.column.checkOverflowAndSaveEdgeAndBreakPosition(
                  state.lastAfterNodeContext, null, true, state.breakAtTheEdge);
          if (overflown &&
              formattingContext
                      .getRowSpanningCellsOverflowingTheRow(
                          this.currentRowIndex - 1)
                      .length === 0) {
            this.resetColumn();
            nodeContext.overflow = true;
            state.break = true;
          }
          return task.newResult(true);
        });
  }

  private registerCellFragmentIndex() {
    const cells =
        this.formattingContext.getRowByIndex(this.currentRowIndex).cells;
    cells.forEach((cell) => {
      const cellBreakPosition =
          this.formattingContext.cellBreakPositions[cell.columnIndex];
      if (cellBreakPosition &&
          cellBreakPosition.cell.anchorSlot.columnIndex ==
              cell.anchorSlot.columnIndex) {
        const tdNodeStep = cellBreakPosition.cellNodePosition.steps[0];
        const offset =
            (this.column.layoutContext as ViewFactory).xmldoc.getElementOffset(tdNodeStep.node as Element);
        registerFragmentIndex(
            offset, tdNodeStep.fragmentIndex + 1, 1);
      }
    });
  }

  startTableCell(state: layoututil.LayoutIteratorState): task.Result<boolean> {
    if (this.inHeader || this.inFooter) {
      return task.newResult(true);
    }
    const nodeContext = state.nodeContext;
    if (!this.inRow) {
      if (this.currentRowIndex < 0) {
        this.currentRowIndex = 0;
      } else {
        this.currentRowIndex++;
      }
      this.currentColumnIndex = 0;
      this.inRow = true;
    }
    const cell = this.formattingContext.getRowByIndex(this.currentRowIndex)
                     .cells[this.currentColumnIndex];
    const afterNodeContext = nodeContext.copy().modify();
    afterNodeContext.after = true;
    state.nodeContext = afterNodeContext;
    const frame = task.newFrame<boolean>('startTableCell');
    let cont;
    if (this.hasBrokenCellAtSlot(cell.anchorSlot.columnIndex)) {
      const cellBreakPosition =
          this.formattingContext.cellBreakPositions.shift();
      nodeContext.fragmentIndex =
          cellBreakPosition.cellNodePosition.steps[0].fragmentIndex + 1;
      cont = task.newResult(cellBreakPosition.breakChunkPosition);
    } else {
      cont = this.column.nextInTree(nodeContext, state.atUnforcedBreak)
                 .thenAsync((nextNodeContext) => {
                   if (nextNodeContext.viewNode) {
                     nodeContext.viewNode.removeChild(nextNodeContext.viewNode);
                   }
                   const startNodePosition =
                       vtreeImpl.newNodePositionFromNodeContext(nextNodeContext, 0);
                   return task.newResult(
                       new vtreeImpl.ChunkPosition(startNodePosition));
                 });
    }
    cont.then((startChunkPosition) => {
      asserts.assert(nodeContext);
      this.layoutCell(cell, nodeContext, startChunkPosition).then(() => {
        this.afterNonInlineElementNode(state);
        this.currentColumnIndex++;
        frame.finish(true);
      });
    });
    return frame.result();
  }

  startNonInlineBox(state: layoututil.LayoutIteratorState):
      task.Result<boolean> {
    const r = skipNestedTable(
        state, getTableFormattingContext(this.formattingContext), this.column);
    if (r) {
      return r;
    }
    const nodeContext = state.nodeContext;
    const repetitiveElements = this.formattingContext.getRepetitiveElements();
    const display = nodeContext.display;
    if (display === 'table-header-group' && repetitiveElements &&
        repetitiveElements.isHeaderSourceNode(nodeContext.sourceNode)) {
      this.inHeader = true;
      return task.newResult(true);
    } else if (display === 'table-footer-group' && repetitiveElements &&
        repetitiveElements.isFooterSourceNode(nodeContext.sourceNode)) {
      this.inFooter = true;
      return task.newResult(true);
    } else if (display === 'table-row') {
      return this.startTableRow(state);
    } else if (display === 'table-cell') {
      return this.startTableCell(state);
    } else {
      return task.newResult(true);
    }
  }

  endNonInlineBox(state: layoututil.LayoutIteratorState): task.Result<boolean> {
    const nodeContext = state.nodeContext;
    const display = nodeContext.display;
    if (display === 'table-row') {
      this.inRow = false;
      if (!this.inHeader && !this.inFooter) {
        const beforeNodeContext = nodeContext.copy().modify();
        beforeNodeContext.after = false;
        const bp = new InsideTableRowBreakPosition(
            this.currentRowIndex, beforeNodeContext, this.formattingContext);
        this.column.breakPositions.push(bp);
      }
    }
    return task.newResult(true);
  }

  afterNonInlineElementNode(state: layoututil.LayoutIteratorState):
      undefined | task.Result<boolean> {
    const nodeContext = state.nodeContext;
    const repetitiveElements = this.formattingContext.getRepetitiveElements();
    const display = nodeContext.display;
    if (display === 'table-header-group') {
      if (repetitiveElements &&
          !repetitiveElements.allowInsertRepeatitiveElements &&
          repetitiveElements.isHeaderSourceNode(nodeContext.sourceNode)) {
        this.inHeader = false;
        nodeContext.viewNode.parentNode.removeChild(nodeContext.viewNode);
      } else {
        base.setCSSProperty(
            (nodeContext.viewNode as Element), 'display', 'table-row-group');
      }
    } else if (display === 'table-footer-group') {
      if (repetitiveElements &&
          !repetitiveElements.allowInsertRepeatitiveElements &&
          repetitiveElements.isFooterSourceNode(nodeContext.sourceNode)) {
        this.inFooter = false;
        nodeContext.viewNode.parentNode.removeChild(nodeContext.viewNode);
      } else {
        base.setCSSProperty(
            (nodeContext.viewNode as Element), 'display', 'table-row-group');
      }
    }
    if (display && TableLayoutStrategy.ignoreList[display]) {
      nodeContext.viewNode.parentNode.removeChild(nodeContext.viewNode);
    } else if (nodeContext.sourceNode === this.formattingContext.tableSourceNode) {
      nodeContext.overflow =
          this.column.checkOverflowAndSaveEdge(nodeContext, null);
      this.resetColumn();
      state.break = true;
    } else {
      return super.afterNonInlineElementNode(state);
    }
    return task.newResult(true);
  }
}

type TableLayoutOption = {
  calculateBreakPositionsInside: boolean
};
const tableLayoutOptionCache: {root: Node,
                               tableLayoutOption: TableLayoutOption}[] = [];

function getTableLayoutOption(tableRootSourceNode: Node): TableLayoutOption|
    null {
  const i =
      tableLayoutOptionCache.findIndex((c) => c.root === tableRootSourceNode);
  const pair = tableLayoutOptionCache[i];
  return pair ? pair.tableLayoutOption : null;
}

function clearTableLayoutOptionCache(tableRootSourceNode: Node) {
  const i =
      tableLayoutOptionCache.findIndex((c) => c.root === tableRootSourceNode);
  if (i >= 0) {
    tableLayoutOptionCache.splice(i, 1);
  }
}

export class TableLayoutProcessor implements layoutprocessor.LayoutProcessor {
  private layoutEntireTable(
      nodeContext: vtree.NodeContext,
      column: layout.Column): task.Result<vtree.NodeContext> {
    const formattingContext =
        getTableFormattingContext(nodeContext.formattingContext);
    const strategy = new EntireTableLayoutStrategy(formattingContext, column);
    const iterator = new layoututil.LayoutIterator(strategy, column.layoutContext);
    return iterator.iterate(nodeContext);
  }

  private getColumnWidths(
      lastRow: Element, columnCount: number, vertical: boolean,
      clientLayout: vtree.ClientLayout): number[] {
    const doc = lastRow.ownerDocument;
    const dummyRow = doc.createElement('tr');
    const dummyCells = [];
    for (let i = 0; i < columnCount; i++) {
      const cell = doc.createElement('td');
      dummyRow.appendChild(cell);
      dummyCells.push(cell);
    }
    lastRow.parentNode.insertBefore(dummyRow, lastRow.nextSibling);
    const colWidths = dummyCells.map((cell) => {
      const rect = clientLayout.getElementClientRect(cell);
      return vertical ? rect['height'] : rect['width'];
    });
    lastRow.parentNode.removeChild(dummyRow);
    return colWidths;
  }

  private getColGroupElements(tableElement: Element): Element[] {
    const colGroups = [];
    let child = tableElement.firstElementChild;
    while (child) {
      if (child.localName === 'colgroup') {
        colGroups.push(child);
      }
      child = child.nextElementSibling;
    }
    return colGroups;
  }

  private normalizeAndGetColElements(colGroups: Element[]): Element[] {
    const cols = [];
    colGroups.forEach((colGroup) => {
      // Replace colgroup[span=n] with colgroup with n col elements
      let span = (colGroup as any).span;
      colGroup.removeAttribute('span');
      let col = colGroup.firstElementChild;
      while (col) {
        if (col.localName === 'col') {
          // Replace col[span=n] with n col elements
          let s = (col as any).span;
          col.removeAttribute('span');
          span -= s;
          while (s-- > 1) {
            const cloned = col.cloneNode(true);
            colGroup.insertBefore(cloned, col);
            cols.push(cloned);
          }
          cols.push(col);
        }
        col = col.nextElementSibling;
      }
      while (span-- > 0) {
        col = colGroup.ownerDocument.createElement('col');
        colGroup.appendChild(col);
        cols.push(col);
      }
    });
    return cols;
  }

  private addMissingColElements(
      cols: Element[], colGroups: Element[], columnCount: number,
      tableElement: Element) {
    if (cols.length < columnCount) {
      const colGroup = tableElement.ownerDocument.createElement('colgroup');
      colGroups.push(colGroup);
      for (let i = cols.length; i < columnCount; i++) {
        const col = tableElement.ownerDocument.createElement('col');
        colGroup.appendChild(col);
        cols.push(col);
      }
    }
  }

  /**
   * Measure width of columns and normalize colgroup and col elements so that
   * each column has a corresponding col element with the width specified.
   */
  normalizeColGroups(
      formattingContext: TableFormattingContext, tableElement: Element,
      column: layout.Column) {
    const vertical = formattingContext.vertical;
    const lastRow = formattingContext.lastRowViewNode;
    if (!lastRow) {
      return;
    }
    asserts.assert(lastRow);
    formattingContext.lastRowViewNode = null;
    const doc = lastRow.ownerDocument;
    const fragment = doc.createDocumentFragment();

    // Count columns
    const columnCount = formattingContext.getColumnCount();
    if (!(columnCount > 0)) {
      formattingContext.colGroups = fragment;
      return;
    }

    // Measure column widths
    const colWidths = formattingContext.colWidths = this.getColumnWidths(
        lastRow, columnCount, vertical, column.clientLayout);

    // Normalize colgroup and col elements
    const colGroups = this.getColGroupElements(tableElement);
    const cols = this.normalizeAndGetColElements(colGroups);

    // Add missing col elements for remaining columns
    this.addMissingColElements(cols, colGroups, columnCount, tableElement);

    // Assign width to col elements
    cols.forEach((col, i) => {
      base.setCSSProperty(
          col, vertical ? 'height' : 'width', `${colWidths[i]}px`);
    });
    colGroups.forEach((colGroup) => {
      fragment.appendChild(colGroup.cloneNode(true));
    });
    formattingContext.colGroups = fragment;
  }

  doInitialLayout(nodeContext: vtree.NodeContext, column: layout.Column):
      task.Result<vtree.NodeContext> {
    const formattingContext =
        getTableFormattingContext(nodeContext.formattingContext);
    formattingContext.vertical = nodeContext.vertical;
    formattingContext.initializeRepetitiveElements(nodeContext.vertical);
    asserts.assert(nodeContext.sourceNode);
    const tableLayoutOption = getTableLayoutOption(nodeContext.sourceNode);
    clearTableLayoutOptionCache(nodeContext.sourceNode);
    const frame = task.newFrame<vtree.NodeContext>('TableLayoutProcessor.doInitialLayout');
    const initialNodeContext = nodeContext.copy();
    this.layoutEntireTable(nodeContext, column)
        .then(function(nodeContextAfter) {
          const tableElement = nodeContextAfter.viewNode;
          const tableBBox =
              column.clientLayout.getElementClientRect(tableElement);
          let edge = column.vertical ? tableBBox.left : tableBBox.bottom;
          edge += (column.vertical ? -1 : 1) *
              breakposition
                  .calculateOffset(
                      nodeContext,
                      column.collectElementsOffset())
                  .current;
          if (!column.isOverflown(edge) &&
              (!tableLayoutOption ||
               !tableLayoutOption.calculateBreakPositionsInside)) {
            column.breakPositions.push(
                new EntireTableBreakPosition(initialNodeContext));
            frame.finish(nodeContextAfter);
            return;
          }
          this.normalizeColGroups(formattingContext, tableElement, column);
          formattingContext.updateCellSizes(column.clientLayout);
          frame.finish(null);
        }.bind(this));
    return frame.result();
  }

  addCaptions(
      formattingContext: TableFormattingContext, rootViewNode: Element,
      firstChild: Node|null) {
    const captions = formattingContext.captions;
    captions.forEach((caption, i) => {
      if (caption) {
        rootViewNode.insertBefore(caption.viewNode, firstChild);
        if (caption.side === 'top') {
          captions[i] = null;
        }
      }
    });
  }

  addColGroups(
      formattingContext: TableFormattingContext, rootViewNode: Element,
      firstChild: Node|null) {
    if (formattingContext.colGroups &&
        this.getColGroupElements(rootViewNode).length === 0) {
      rootViewNode.insertBefore(
          formattingContext.colGroups.cloneNode(true), firstChild);
    }
  }

  removeColGroups(
      formattingContext: TableFormattingContext, rootViewNode: Element) {
    if (formattingContext.colGroups && rootViewNode) {
      const colGroups = this.getColGroupElements(rootViewNode);
      if (colGroups) {
        colGroups.forEach((colGroup) => {
          rootViewNode.removeChild(colGroup);
        });
      }
    }
  }

  doLayout(nodeContext: vtree.NodeContext, column: layout.Column):
      task.Result<vtree.NodeContext> {
    const formattingContext =
        getTableFormattingContext(nodeContext.formattingContext);
    const rootViewNode = formattingContext.getRootViewNode(nodeContext) as Element;
    const firstChild = rootViewNode.firstChild;
    this.addCaptions(formattingContext, rootViewNode, firstChild);
    this.addColGroups(formattingContext, rootViewNode, firstChild);
    const strategy = new TableLayoutStrategy(formattingContext, column);
    const iterator = new layoututil.LayoutIterator(strategy, column.layoutContext);
    const frame = task.newFrame<vtree.NodeContext>('TableFormattingContext.doLayout');
    iterator.iterate(nodeContext).thenFinish(frame);
    return frame.result();
  }

  /**
   * @override
   */
  layout(nodeContext, column, leadingEdge) {
    const formattingContext =
        getTableFormattingContext(nodeContext.formattingContext);
    const rootViewNode = formattingContext.getRootViewNode(nodeContext);
    if (!rootViewNode) {
      return column.buildDeepElementView(nodeContext);
    } else {
      if (leadingEdge) {
        repetitiveelementImpl.appendHeaderToAncestors(nodeContext.parent, column);
      }
      return (new LayoutRetryer(formattingContext, this))
          .layout(nodeContext, column);
    }
  }

  /**
   * @override
   */
  createEdgeBreakPosition(position, breakOnEdge, overflows, columnBlockSize) {
    return new BetweenTableRowBreakPosition(
      position, breakOnEdge, overflows, columnBlockSize);
  }

  /**
   * @override
   */
  startNonInlineElementNode(nodeContext) {return false;}

  /**
   * @override
   */
  afterNonInlineElementNode(nodeContext) {return false;}

  /**
   * @override
   */
  finishBreak(column, nodeContext, forceRemoveSelf, endOfColumn) {
    const formattingContext =
        getTableFormattingContext(nodeContext.formattingContext);
    if (nodeContext.display === 'table-row') {
      asserts.assert(nodeContext.sourceNode);
      const rowIndex =
          formattingContext.findRowIndexBySourceNode(nodeContext.sourceNode);
      formattingContext.cellBreakPositions = [];
      let cells;
      if (!nodeContext.after) {
        cells = formattingContext.getCellsFallingOnRow(rowIndex);
      } else {
        cells =
            formattingContext.getRowSpanningCellsOverflowingTheRow(rowIndex);
      }
      if (cells.length) {
        const frame = task.newFrame<boolean>('TableLayoutProcessor.finishBreak');
        let i = 0;
        frame
            .loopWithFrame((loopFrame) => {
              if (i === cells.length) {
                loopFrame.breakLoop();
                return;
              }
              const cell = cells[i++];
              const cellFragment =
                  formattingContext.getCellFragmentOfCell(cell);
              const breakNodeContext =
                  cellFragment.findAcceptableBreakPosition().nodeContext;
              asserts.assert(breakNodeContext);
              const cellNodeContext = cellFragment.cellNodeContext;
              const cellNodePosition = cellNodeContext.toNodePosition();
              const breakChunkPosition =
                  new vtreeImpl.ChunkPosition(breakNodeContext.toNodePosition());
              formattingContext.cellBreakPositions.push(
                  ({cellNodePosition, breakChunkPosition, cell} as
                   BrokenTableCellPosition));
              const cellViewNode = (cellNodeContext.viewNode as HTMLTableCellElement);
              cellFragment.column.layoutContext.processFragmentedBlockEdge(
                  cellFragment.cellNodeContext);
              if (rowIndex < cell.rowIndex + cell.rowSpan - 1) {
                cellViewNode.rowSpan = rowIndex - cell.rowIndex + 1;
              }
              if (!cellFragment.empty) {
                cellFragment.pseudoColumn
                    .finishBreak(breakNodeContext, false, true)
                    .then(() => {
                      asserts.assert(cellFragment);
                      adjustCellHeight(
                          cellFragment, formattingContext, breakNodeContext);
                      loopFrame.continueLoop();
                    });
              } else {
                loopFrame.continueLoop();
              }
            })
            .then(() => {
              column.clearOverflownViewNodes(nodeContext, false);
              column.layoutContext.processFragmentedBlockEdge(nodeContext);
              formattingContext.finishFragment();
              frame.finish(true);
            });
        return frame.result();
      }
    }
    formattingContext.finishFragment();
    return layoutprocessor.blockLayoutProcessor.finishBreak(
        column, nodeContext, forceRemoveSelf, endOfColumn);
  }

  /** @override */
  clearOverflownViewNodes(column, parentNodeContext, nodeContext, removeSelf) {
    layoutprocessor.BlockLayoutProcessor.prototype.clearOverflownViewNodes(
        column, parentNodeContext, nodeContext, removeSelf);
  }
}

function adjustCellHeight(
    cellFragment: TableCellFragment, formattingContext: TableFormattingContext,
    breakNodeContext: vtree.NodeContext) {
  const repetitiveElements = formattingContext.getRepetitiveElements();
  if (!repetitiveElements) {
    return;
  }
  const vertical = formattingContext.vertical;
  const column = cellFragment.column;
  const cellContentElement = cellFragment.pseudoColumn.getColumnElement();
  const cellElement = (cellFragment.cellNodeContext.viewNode as Element);
  const cellElementRect = column.clientLayout.getElementClientRect(cellElement);
  const padding = column.getComputedPaddingBorder(cellElement);
  if (vertical) {
    const width = cellElementRect.right - column.footnoteEdge -
        repetitiveElements.calculateOffset(breakNodeContext) - padding.right;
    base.setCSSProperty(cellContentElement, 'max-width', `${width}px`);
  } else {
    const height = column.footnoteEdge -
        repetitiveElements.calculateOffset(breakNodeContext) -
        cellElementRect.top - padding.top;
    base.setCSSProperty(cellContentElement, 'max-height', `${height}px`);
  }
  base.setCSSProperty(cellContentElement, 'overflow', 'hidden');
}

export class LayoutRetryer extends
    layoutretryer.AbstractLayoutRetryer {
  private tableFormattingContext: any;

  constructor(
      formattingContext: TableFormattingContext,
      private readonly processor: TableLayoutProcessor) {
    super();
    this.tableFormattingContext = formattingContext;
  }

  /**
   * @override
   */
  resolveLayoutMode(nodeContext) {
    const repetitiveElements =
        this.tableFormattingContext.getRepetitiveElements();
    if (!repetitiveElements || !repetitiveElements.doneInitialLayout) {
      return new LayoutEntireTable(this.tableFormattingContext, this.processor);
    } else {
      if (nodeContext.sourceNode ===
              this.tableFormattingContext.tableSourceNode &&
          !nodeContext.after) {
        if (repetitiveElements) {
          repetitiveElements.preventSkippingHeader();
        }
      }
      return new LayoutFragmentedTable(
          this.tableFormattingContext, this.processor);
    }
  }

  /**
   * @override
   */
  clearNodes(initialPosition) {
    super.clearNodes(initialPosition);
    const rootViewNode =
        this.tableFormattingContext.getRootViewNode(initialPosition);
    this.processor.removeColGroups(this.tableFormattingContext, rootViewNode);
  }

  /**
   * @override
   */
  restoreState(nodeContext, column) {
    super.restoreState(nodeContext, column);
    this.tableFormattingContext.finishFragment();
  }
}

export class LayoutEntireTable extends repetitiveelementImpl.LayoutEntireBlock {
  constructor(
      formattingContext: TableFormattingContext,
      public readonly processor: TableLayoutProcessor) {
    super(formattingContext);
  }

  /**
   * @override
   */
  doLayout(nodeContext, column) {
    return this.processor.doInitialLayout(nodeContext, column);
  }
}

export class EntireTableBreakPosition extends breakposition.EdgeBreakPosition {
  constructor(tableNodeContext: vtree.NodeContext) {
    super(tableNodeContext, null, tableNodeContext.overflow, 0);
  }

  /**
   * @override
   */
  getMinBreakPenalty() {
    if (!this.isEdgeUpdated) {
      throw new Error('EdgeBreakPosition.prototype.updateEdge not called');
    }
    return (this.overflows ? 3 : 0) +
        (this.position.parent ? this.position.parent.breakPenalty : 0);
  }

  /**
   * @override
   */
  breakPositionChosen(column) {
    column.fragmentLayoutConstraints.push(
        new EntireTableLayoutConstraint(this.position.sourceNode));
  }
}

export class EntireTableLayoutConstraint implements layout.FragmentLayoutConstraint {

  flagmentLayoutConstraintType: FragmentLayoutConstraintType = 'EntireTable';

  tableRootNode: any;

  constructor(tableRootNode: Node) {
    this.tableRootNode = tableRootNode;
  }

  /**
   * @override
   */
  allowLayout(nodeContext, overflownNodeContext, column) {
    // If the nodeContext overflows, any EntireTableLayoutConstraint should not
    // be registered in the first place. See
    // TableLayoutProcessor.prototype.doInitialLayout.
    asserts.assert(!nodeContext.overflow);
    return false;
  }

  /**
   * @override
   */
  nextCandidate(nodeContext) {return true;}

  /**
   * @override
   */
  postLayout(allowed, positionAfter, initialPosition, column) {
    asserts.assert(positionAfter.sourceNode);
    tableLayoutOptionCache.push({
      root: positionAfter.sourceNode,
      tableLayoutOption:
          ({calculateBreakPositionsInside: true} as TableLayoutOption)
    });
  }

  /**
   * @override
   */
  finishBreak(nodeContext, column) {return task.newResult(true);}

  /**
   * @override
   */
  equalsTo(constraint) {
    return constraint instanceof EntireTableLayoutConstraint &&
        constraint.tableRootNode === this.tableRootNode;
  }

  /**
   * @override
   */
  getPriorityOfFinishBreak() {return 0;}
}

export class LayoutFragmentedTable extends
    repetitiveelementImpl.LayoutFragmentedBlock {
  constructor(
      formattingContext: TableFormattingContext,
      public readonly processor: TableLayoutProcessor) {
    super(formattingContext);
  }

  /**
   * @override
   */
  doLayout(nodeContext, column) {
    const repetitiveElements = this.formattingContext.getRepetitiveElements();
    if (repetitiveElements &&
        !repetitiveElements.isAfterLastContent(nodeContext)) {
      const constraint = new TableRowLayoutConstraint(nodeContext);
      if (!column.fragmentLayoutConstraints.some(
              (c) => constraint.equalsTo(c))) {
        column.fragmentLayoutConstraints.unshift(constraint);
      }
    }
    return this.processor.doLayout(nodeContext, column);
  }
}

export class TableRowLayoutConstraint
    extends repetitiveelementImpl.RepetitiveElementsOwnerLayoutConstraint
    implements table.TableRowLayoutConstraint {
  flagmentLayoutConstraintType: FragmentLayoutConstraintType = 'TableRow';
  cellFragmentLayoutConstraints: {
    constraints: layout.FragmentLayoutConstraint[],
    breakPosition: vtree.NodeContext
  }[] = [];

  constructor(nodeContext: vtree.NodeContext) {
    super(nodeContext);
  }

  /** @override */
  allowLayout(nodeContext, overflownNodeContext, column) {
    const repetitiveElements = this.getRepetitiveElements();
    if (!repetitiveElements) {
      return true;
    }
    if (column.pseudoParent) {
      return true;
    }
    if (layouthelper.isOrphan(this.nodeContext.viewNode)) {
      return true;
    }
    if (!repetitiveElements.isEnableToUpdateState()) {
      return true;
    }
    if (overflownNodeContext && !nodeContext ||
        nodeContext && nodeContext.overflow) {
      return false;
    } else {
      return true;
    }
  }

  /** @override */
  nextCandidate(nodeContext) {
    const formattingContext =
        getTableFormattingContext(this.nodeContext.formattingContext);
    const cellFragmentConstraints = this.collectCellFragmentLayoutConstraints(
        nodeContext, formattingContext);
    if (cellFragmentConstraints.some(
            (entry) => entry.constraints.some(
                (constraint) => constraint.nextCandidate(nodeContext)))) {
      return true;
    }
    return super.nextCandidate(nodeContext);
  }

  /** @override */
  postLayout(allowed, nodeContext, initialPosition, column) {
    const formattingContext =
        getTableFormattingContext(this.nodeContext.formattingContext);
    this.cellFragmentLayoutConstraints =
        this.collectCellFragmentLayoutConstraints(
            nodeContext, formattingContext);
    this.cellFragmentLayoutConstraints.forEach((entry) => {
      entry.constraints.forEach((constraint) => {
        constraint.postLayout(
            allowed, entry.breakPosition, initialPosition, column);
      });
    });
    if (!allowed) {
      const rootViewNode = formattingContext.getRootViewNode(this.nodeContext);
      (new TableLayoutProcessor())
          .removeColGroups(formattingContext, rootViewNode as Element);
      this.removeDummyRowNodes(initialPosition);
    }
    super.postLayout(allowed, nodeContext, initialPosition, column);
  }

  /** @override */
  finishBreak(nodeContext, column) {
    const formattingContext =
        getTableFormattingContext(this.nodeContext.formattingContext);
    const frame: task.Frame<boolean> = task.newFrame('finishBreak');
    const constraints = this.cellFragmentLayoutConstraints.reduce(
        (array, entry) => array.concat(entry.constraints.map(
            (constraint) =>
                ({constraint, breakPosition: entry.breakPosition}))),
        []);
    let i = 0;
    frame
        .loop(() => {
          if (i < constraints.length) {
            const entry = constraints[i++];
            return entry.constraint.finishBreak(entry.breakPosition, column)
                .thenReturn(true);
          } else {
            return task.newResult(false);
          }
        })
        .then(() => {
          frame.finish(true);
        });
    return frame.result().thenAsync(
        () => super.finishBreak(nodeContext, column)
    );
  }

  removeDummyRowNodes(nodeContext: vtree.NodeContext) {
    if (!nodeContext || nodeContext.display !== 'table-row' ||
        !nodeContext.viewNode) {
      return;
    }
    while ((nodeContext.viewNode as Element).previousElementSibling) {
      const dummyNode = (nodeContext.viewNode as Element).previousElementSibling;
      if (dummyNode.parentNode) {
        dummyNode.parentNode.removeChild(dummyNode);
      }
    }
  }

  private collectCellFragmentLayoutConstraints(
      nodeContext: vtree.NodeContext,
      formattingContext: TableFormattingContext): {
    constraints: layout.FragmentLayoutConstraint[],
    breakPosition: vtree.NodeContext
  }[] {
    return this.getCellFragemnts(nodeContext, formattingContext)
        .map((entry) => ({
               constraints: entry.fragment.pseudoColumn.getColumn()
                                .fragmentLayoutConstraints,
               breakPosition: entry.breakPosition
             }));
  }

  private getCellFragemnts(
      nodeContext: vtree.NodeContext,
      formattingContext: TableFormattingContext):
      {fragment: TableCellFragment, breakPosition: vtreeImpl.NodeContext}[] {
    let rowIndex = Number.MAX_VALUE;
    if (nodeContext && nodeContext.display === 'table-row') {
      asserts.assert(nodeContext.sourceNode);
      rowIndex =
          formattingContext.findRowIndexBySourceNode(nodeContext.sourceNode) +
          1;
    }
    rowIndex = Math.min(formattingContext.cellFragments.length, rowIndex);
    const cellFragments = [];
    for (let i = 0; i < rowIndex; i++) {
      if (!formattingContext.cellFragments[i]) {
        continue;
      }
      formattingContext.cellFragments[i].forEach((cellFragment) => {
        if (!cellFragment) {
          return;
        }
        cellFragments.push({
          fragment: cellFragment,
          breakPosition: cellFragment.findAcceptableBreakPosition().nodeContext
        });
      });
    }
    return cellFragments;
  }

  getElementsOffsetsForTableCell(column: layout.Column): repetitiveelement.ElementsOffset[] {
    const formattingContext =
        getTableFormattingContext(this.nodeContext.formattingContext);
    const position = formattingContext.findCellFromColumn(column);
    if (position) {
      return formattingContext.collectElementsOffsetOfUpperCells(position);
    } else {
      return formattingContext.collectElementsOffsetOfHighestColumn();
    }
  }

  /** @override */
  equalsTo(constraint) {
    if (!(constraint instanceof TableRowLayoutConstraint)) {
      return false;
    }
    return getTableFormattingContext(this.nodeContext.formattingContext) ===
        getTableFormattingContext(constraint.nodeContext.formattingContext);
  }
}

const tableLayoutProcessor = new TableLayoutProcessor();

function resolveFormattingContextHook(
    nodeContext, firstTime, display, position, floatSide, isRoot) {
  if (!firstTime) {
    return null;
  }
  if (display === ident.table) {
    const parent = nodeContext.parent;
    return new TableFormattingContext(
        parent ? parent.formattingContext : null,
        (nodeContext.sourceNode as Element));
  }
  return null;
}

function resolveLayoutProcessor(formattingContext) {
  if (formattingContext instanceof TableFormattingContext) {
    return tableLayoutProcessor;
  }
  return null;
}

function registerHooks() {
  plugin.registerHook(
      plugin.HOOKS.RESOLVE_FORMATTING_CONTEXT, resolveFormattingContextHook);
  plugin.registerHook(
      plugin.HOOKS.RESOLVE_LAYOUT_PROCESSOR, resolveLayoutProcessor);
}
registerHooks();
