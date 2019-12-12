/**
 * Copyright 2017 Trim-marks Inc.
 * Copyright 2019 Vivliostyle Foundation
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
 * @fileoverview Columns - Control column layout.
 */
import * as Asserts from "./asserts";
import * as Css from "./css";
import * as MathUtil from "./mathutil";
import * as PageFloats from "./pagefloats";
import * as Task from "./task";
import * as Vtree from "./vtree";
import { Layout } from "./types";

export type ColumnLayoutResult = {
  columns: Layout.Column[];
  position: Vtree.LayoutPosition;
  columnPageFloatLayoutContexts:
    | undefined
    | PageFloats.PageFloatLayoutContext[];
};

export type ColumnGenerator = () => Task.Result<ColumnLayoutResult | null>;

export class ColumnBalancingTrialResult {
  constructor(
    public readonly layoutResult: ColumnLayoutResult,
    public readonly penalty: number,
  ) {}
}

function getBlockSize(container: Vtree.Container): number {
  if (container.vertical) {
    return container.width;
  } else {
    return container.height;
  }
}

function setBlockSize(container: Vtree.Container, size: number) {
  if (container.vertical) {
    container.width = size;
  } else {
    container.height = size;
  }
}

export abstract class ColumnBalancer {
  originalContainerBlockSize: number;

  constructor(
    public readonly layoutContainer: Vtree.Container,
    public readonly columnGenerator: ColumnGenerator,
    public readonly regionPageFloatLayoutContext: PageFloats.PageFloatLayoutContext,
  ) {
    this.originalContainerBlockSize = getBlockSize(layoutContainer);
  }

  balanceColumns(
    layoutResult: ColumnLayoutResult,
  ): Task.Result<ColumnLayoutResult> {
    const self = this;
    const frame: Task.Frame<ColumnLayoutResult> = Task.newFrame(
      "ColumnBalancer#balanceColumns",
    );
    self.preBalance(layoutResult);
    self.savePageFloatLayoutContexts(layoutResult);
    self.layoutContainer.clear();
    const candidates = [self.createTrialResult(layoutResult)];
    frame
      .loopWithFrame((loopFrame) => {
        if (!self.hasNextCandidate(candidates)) {
          loopFrame.breakLoop();
          return;
        }
        self.updateCondition(candidates);
        self.columnGenerator().then((layoutResult) => {
          self.savePageFloatLayoutContexts(layoutResult);
          self.layoutContainer.clear();
          if (!layoutResult) {
            loopFrame.breakLoop();
            return;
          }
          candidates.push(self.createTrialResult(layoutResult));
          loopFrame.continueLoop();
        });
      })
      .then(() => {
        const result = candidates.reduce(
          (prev, curr) => (curr.penalty < prev.penalty ? curr : prev),
          candidates[0],
        );
        self.restoreContents(result.layoutResult);
        self.postBalance();
        frame.finish(result.layoutResult);
      });
    return frame.result();
  }

  private createTrialResult(
    layoutResult: ColumnLayoutResult,
  ): ColumnBalancingTrialResult {
    const penalty = this.calculatePenalty(layoutResult);
    return new ColumnBalancingTrialResult(layoutResult, penalty);
  }

  protected preBalance(layoutResult: ColumnLayoutResult) {}

  protected abstract calculatePenalty(layoutResult: ColumnLayoutResult): number;

  protected abstract hasNextCandidate(
    candidates: ColumnBalancingTrialResult[],
  ): boolean;

  protected abstract updateCondition(
    candidates: ColumnBalancingTrialResult[],
  ): void;

  protected postBalance() {
    setBlockSize(this.layoutContainer, this.originalContainerBlockSize);
  }

  savePageFloatLayoutContexts(layoutResult: ColumnLayoutResult | null) {
    const children = this.regionPageFloatLayoutContext.detachChildren();
    if (layoutResult) {
      layoutResult.columnPageFloatLayoutContexts = children;
    }
  }

  private restoreContents(newLayoutResult: ColumnLayoutResult) {
    const parent = this.layoutContainer.element;
    newLayoutResult.columns.forEach((c) => {
      parent.appendChild(c.element);
    });
    Asserts.assert(newLayoutResult.columnPageFloatLayoutContexts);
    this.regionPageFloatLayoutContext.attachChildren(
      newLayoutResult.columnPageFloatLayoutContexts,
    );
  }
}
const COLUMN_LENGTH_STEP = 1;

export function canReduceContainerSize(
  candidates: ColumnBalancingTrialResult[],
): boolean {
  const lastCandidate = candidates[candidates.length - 1];
  if (lastCandidate.penalty === 0) {
    return false;
  }
  const secondLastCandidate = candidates[candidates.length - 2];
  if (
    secondLastCandidate &&
    lastCandidate.penalty >= secondLastCandidate.penalty
  ) {
    return false;
  }
  const columns = lastCandidate.layoutResult.columns;
  const maxColumnBlockSize = Math.max.apply(
    null,
    columns.map((c) => c.computedBlockSize),
  );
  const maxPageFloatBlockSize = Math.max.apply(
    null,
    columns.map((c) => c.getMaxBlockSizeOfPageFloats()),
  );
  return maxColumnBlockSize > maxPageFloatBlockSize + COLUMN_LENGTH_STEP;
}

export function reduceContainerSize(
  candidates: ColumnBalancingTrialResult[],
  container: Vtree.Container,
): void {
  const columns = candidates[candidates.length - 1].layoutResult.columns;
  const maxColumnBlockSize = Math.max.apply(
    null,
    columns.map((c) => {
      if (!isNaN(c.blockDistanceToBlockEndFloats)) {
        return (
          c.computedBlockSize -
          c.blockDistanceToBlockEndFloats +
          COLUMN_LENGTH_STEP
        );
      } else {
        return c.computedBlockSize;
      }
    }),
  );
  const newEdge = maxColumnBlockSize - COLUMN_LENGTH_STEP;
  if (newEdge < getBlockSize(container)) {
    setBlockSize(container, newEdge);
  } else {
    setBlockSize(container, getBlockSize(container) - 1);
  }
}

export class BalanceLastColumnBalancer extends ColumnBalancer {
  originalPosition: Vtree.LayoutPosition | null = null;
  foundUpperBound: boolean = false;

  constructor(
    columnGenerator: ColumnGenerator,
    regionPageFloatLayoutContext,
    layoutContainer: Vtree.Container,
    public readonly columnCount: number,
  ) {
    super(layoutContainer, columnGenerator, regionPageFloatLayoutContext);
  }

  /**
   * @override
   */
  preBalance(layoutResult: ColumnLayoutResult) {
    const columns = layoutResult.columns;
    const totalBlockSize = columns.reduce(
      (prev, c) => prev + c.computedBlockSize,
      0,
    );
    setBlockSize(this.layoutContainer, totalBlockSize / this.columnCount);
    this.originalPosition = layoutResult.position;
  }

  private checkPosition(position: Vtree.LayoutPosition | null): boolean {
    if (this.originalPosition) {
      return this.originalPosition.isSamePosition(position);
    } else {
      return position === null;
    }
  }

  /**
   * @override
   */
  calculatePenalty(layoutResult: ColumnLayoutResult): number {
    if (!this.checkPosition(layoutResult.position)) {
      return Infinity;
    }
    const columns = layoutResult.columns;
    if (isLastColumnLongerThanAnyOtherColumn(columns)) {
      return Infinity;
    }
    return Math.max.apply(
      null,
      columns.map((c) => c.computedBlockSize),
    );
  }

  /**
   * @override
   */
  hasNextCandidate(candidates: ColumnBalancingTrialResult[]): boolean {
    if (candidates.length === 1) {
      return true;
    } else if (this.foundUpperBound) {
      return canReduceContainerSize(candidates);
    } else {
      const lastCandidate = candidates[candidates.length - 1];
      if (this.checkPosition(lastCandidate.layoutResult.position)) {
        if (
          !isLastColumnLongerThanAnyOtherColumn(
            lastCandidate.layoutResult.columns,
          )
        ) {
          this.foundUpperBound = true;
          return true;
        }
      }
      return (
        getBlockSize(this.layoutContainer) < this.originalContainerBlockSize
      );
    }
  }

  /**
   * @override
   */
  updateCondition(candidates: ColumnBalancingTrialResult[]): void {
    if (this.foundUpperBound) {
      reduceContainerSize(candidates, this.layoutContainer);
    } else {
      const newEdge = Math.min(
        this.originalContainerBlockSize,
        getBlockSize(this.layoutContainer) +
          this.originalContainerBlockSize * 0.1,
      );
      setBlockSize(this.layoutContainer, newEdge);
    }
  }
}

function isLastColumnLongerThanAnyOtherColumn(
  columns: Layout.Column[],
): boolean {
  if (columns.length <= 1) {
    return false;
  }
  const lastColumnBlockSize = columns[columns.length - 1].computedBlockSize;
  const otherColumns = columns.slice(0, columns.length - 1);
  return otherColumns.every((c) => lastColumnBlockSize > c.computedBlockSize);
}

export class BalanceNonLastColumnBalancer extends ColumnBalancer {
  constructor(
    columnGenerator: ColumnGenerator,
    regionPageFloatLayoutContext,
    layoutContainer: Vtree.Container,
  ) {
    super(layoutContainer, columnGenerator, regionPageFloatLayoutContext);
  }

  /**
   * @override
   */
  calculatePenalty(layoutResult: ColumnLayoutResult): number {
    if (layoutResult.columns.every((c) => c.computedBlockSize === 0)) {
      return Infinity;
    }
    const computedBlockSizes = layoutResult.columns
      .filter((c) => !c.pageBreakType)
      .map((c) => c.computedBlockSize);
    return MathUtil.variance(computedBlockSizes);
  }

  /**
   * @override
   */
  hasNextCandidate(candidates: ColumnBalancingTrialResult[]): boolean {
    return canReduceContainerSize(candidates);
  }

  /**
   * @override
   */
  updateCondition(candidates: ColumnBalancingTrialResult[]): void {
    reduceContainerSize(candidates, this.layoutContainer);
  }
}

export function createColumnBalancer(
  columnCount: number,
  columnFill: Css.Ident,
  columnGenerator: ColumnGenerator,
  regionPageFloatLayoutContext: PageFloats.PageFloatLayoutContext,
  layoutContainer: Vtree.Container,
  columns: Layout.Column[],
  flowPosition: Vtree.FlowPosition,
): ColumnBalancer | null {
  if (columnFill === Css.ident.auto) {
    return null;
  } else {
    // TODO: how to handle a case where no more in-flow contents but some
    // page floats
    const noMoreContent = flowPosition.positions.length === 0;
    const lastColumn = columns[columns.length - 1];
    const isLastColumnForceBroken = !!(lastColumn && lastColumn.pageBreakType);
    if (noMoreContent || isLastColumnForceBroken) {
      return new BalanceLastColumnBalancer(
        columnGenerator,
        regionPageFloatLayoutContext,
        layoutContainer,
        columnCount,
      );
    } else if (columnFill === Css.ident.balance_all) {
      return new BalanceNonLastColumnBalancer(
        columnGenerator,
        regionPageFloatLayoutContext,
        layoutContainer,
      );
    } else {
      Asserts.assert(columnFill === Css.ident.balance);
      return null;
    }
  }
}
