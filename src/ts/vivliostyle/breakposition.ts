/**
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
 * @fileoverview BreakPosition - Definitions of BreakPosition.
 */
import * as Break from "./break";
import * as LayoutHelper from "./layouthelper";
import { Layout, RepetitiveElement, ViewTree } from "./types";

/**
 * Potential breaking position.
 */
export type BreakPosition = Layout.BreakPosition;

export abstract class AbstractBreakPosition
  implements Layout.AbstractBreakPosition {
  abstract findAcceptableBreak(
    column: Layout.Column,
    penalty: number
  ): ViewTree.NodeContext;

  abstract getMinBreakPenalty(): number;

  calculateOffset(column): { current: number; minimum: number } {
    return calculateOffset(
      this.getNodeContext(),
      column.collectElementsOffset()
    );
  }

  /**
   * @override
   */
  breakPositionChosen(column) {}

  getNodeContext(): ViewTree.NodeContext {
    return null;
  }
}

export function calculateOffset(
  nodeContext: ViewTree.NodeContext,
  elementsOffsets: RepetitiveElement.ElementsOffset[]
): { current: number; minimum: number } {
  return {
    current: elementsOffsets.reduce(
      (val, repetitiveElement) =>
        val + repetitiveElement.calculateOffset(nodeContext),
      0
    ),
    minimum: elementsOffsets.reduce(
      (val, repetitiveElement) =>
        val + repetitiveElement.calculateMinimumOffset(nodeContext),
      0
    )
  };
}

/**
 * Potential edge breaking position.
 */
export class EdgeBreakPosition extends AbstractBreakPosition
  implements Layout.EdgeBreakPosition {
  overflowIfRepetitiveElementsDropped: boolean;
  protected isEdgeUpdated: boolean = false;
  private edge: number = 0;

  constructor(
    public readonly position: ViewTree.NodeContext,
    public readonly breakOnEdge: string | null,
    public overflows: boolean,
    public readonly computedBlockSize: number
  ) {
    super();
    this.overflowIfRepetitiveElementsDropped = overflows;
  }

  /**
   * @override
   */
  findAcceptableBreak(column, penalty) {
    this.updateOverflows(column);
    if (penalty < this.getMinBreakPenalty()) {
      return null;
    }
    return column.findEdgeBreakPosition(this);
  }

  /**
   * @override
   */
  getMinBreakPenalty() {
    if (!this.isEdgeUpdated) {
      throw new Error("EdgeBreakPosition.prototype.updateEdge not called");
    }
    const preferDropping =
      this.isFirstContentOfRepetitiveElementsOwner() &&
      !this.overflowIfRepetitiveElementsDropped;
    return (
      (Break.isAvoidBreakValue(this.breakOnEdge) ? 1 : 0) +
      (this.overflows && !preferDropping ? 3 : 0) +
      (this.position.parent ? this.position.parent.breakPenalty : 0)
    );
  }

  private updateEdge(column: Layout.Column) {
    const clonedPaddingBorder = column.calculateClonedPaddingBorder(
      this.position
    );
    this.edge =
      LayoutHelper.calculateEdge(
        this.position,
        column.clientLayout,
        0,
        column.vertical
      ) + clonedPaddingBorder;
    this.isEdgeUpdated = true;
  }

  private updateOverflows(column: Layout.Column) {
    if (!this.isEdgeUpdated) {
      this.updateEdge(column);
    }
    const edge = this.edge;
    const offsets = this.calculateOffset(column);
    this.overflowIfRepetitiveElementsDropped = column.isOverflown(
      edge + (column.vertical ? -1 : 1) * offsets.minimum
    );
    this.overflows = this.position.overflow = column.isOverflown(
      edge + (column.vertical ? -1 : 1) * offsets.current
    );
  }

  /** @override */
  getNodeContext() {
    return this.position;
  }

  private isFirstContentOfRepetitiveElementsOwner(): boolean {
    const nodeContext = this.getNodeContext();
    if (!nodeContext || !nodeContext.parent) {
      return false;
    }
    const { formattingContext } = nodeContext.parent;
    if (
      !RepetitiveElement.isInstanceOfRepetitiveElementsOwnerFormattingContext(
        formattingContext
      )
    ) {
      return false;
    }

    const repetitiveElements = formattingContext.getRepetitiveElements();
    if (!repetitiveElements) {
      return false;
    }
    return repetitiveElements.isFirstContentNode(nodeContext);
  }
}
