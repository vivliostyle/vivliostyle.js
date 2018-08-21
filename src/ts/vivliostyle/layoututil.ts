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
 * @fileoverview Utilities related to layout.
 */
import {Column} from '../adapt/layout';
import {LayoutConstraint} from '../adapt/layout';
import {BreakPositionAndNodeContext} from '../adapt/layout';
import {BreakPosition} from '../adapt/layout';
import * as task from '../adapt/task';
import * as vtree from '../adapt/vtree';
import * as break from './break';
type LayoutIteratorState = {
  nodeContext: vtree.NodeContext,
  atUnforcedBreak: boolean,
  break: boolean
};

export {LayoutIteratorState};

export class LayoutIteratorStrategy {
  initialState(initialNodeContext: vtree.NodeContext): LayoutIteratorState{
    nodeContext: initialNodeContext,
    atUnforcedBreak: false,
    break: false
  }

  startNonDisplayableNode(state: LayoutIteratorState): undefined
      |task.Result<boolean> {}

  afterNonDisplayableNode(state: LayoutIteratorState): undefined
      |task.Result<boolean> {}

  startIgnoredTextNode(state: LayoutIteratorState): undefined
      |task.Result<boolean> {}

  afterIgnoredTextNode(state: LayoutIteratorState): undefined
      |task.Result<boolean> {}

  startNonElementNode(state: LayoutIteratorState): undefined
      |task.Result<boolean> {}

  afterNonElementNode(state: LayoutIteratorState): undefined
      |task.Result<boolean> {}

  startInlineElementNode(state: LayoutIteratorState): undefined
      |task.Result<boolean> {}

  afterInlineElementNode(state: LayoutIteratorState): undefined
      |task.Result<boolean> {}

  startNonInlineElementNode(state: LayoutIteratorState): undefined
      |task.Result<boolean> {}

  afterNonInlineElementNode(state: LayoutIteratorState): undefined
      |task.Result<boolean> {}

  finish(state: LayoutIteratorState): undefined|task.Result<boolean> {}
}
const LayoutIteratorStrategy = LayoutIteratorStrategy;

export class LayoutIterator {
  constructor(
      private readonly strategy: LayoutIteratorStrategy,
      private readonly layoutContext: vtree.LayoutContext) {}

  iterate(initialNodeContext: vtree.NodeContext):
      task.Result<vtree.NodeContext> {
    const strategy = this.strategy;
    const state = strategy.initialState(initialNodeContext);
    const frame: task.Frame<vtree.NodeContext> =
        task.newFrame('LayoutIterator');
    frame
        .loopWithFrame((loopFrame) => {
          let r;
          while (state.nodeContext) {
            if (!state.nodeContext.viewNode) {
              if (state.nodeContext.after) {
                r = strategy.afterNonDisplayableNode(state);
              } else {
                r = strategy.startNonDisplayableNode(state);
              }
            } else {
              if (state.nodeContext.viewNode.nodeType !== 1) {
                if (vtree.canIgnore(
                        state.nodeContext.viewNode,
                        state.nodeContext.whitespace)) {
                  if (state.nodeContext.after) {
                    r = strategy.afterIgnoredTextNode(state);
                  } else {
                    r = strategy.startIgnoredTextNode(state);
                  }
                } else {
                  if (state.nodeContext.after) {
                    r = strategy.afterNonElementNode(state);
                  } else {
                    r = strategy.startNonElementNode(state);
                  }
                }
              } else {
                if (state.nodeContext.inline) {
                  if (state.nodeContext.after) {
                    r = strategy.afterInlineElementNode(state);
                  } else {
                    r = strategy.startInlineElementNode(state);
                  }
                } else {
                  if (state.nodeContext.after) {
                    r = strategy.afterNonInlineElementNode(state);
                  } else {
                    r = strategy.startNonInlineElementNode(state);
                  }
                }
              }
            }
            const cont = r && r.isPending() ? r : task.newResult(true);
            const nextResult = cont.thenAsync(() => {
              if (state.break) {
                return task.newResult(null);
              }
              return this.layoutContext.nextInTree(
                  state.nodeContext, state.atUnforcedBreak);
            });
            if (nextResult.isPending()) {
              nextResult.then((nextNodeContext) => {
                if (state.break) {
                  loopFrame.breakLoop();
                } else {
                  state.nodeContext = nextNodeContext;
                  loopFrame.continueLoop();
                }
              });
              return;
            } else {
              if (state.break) {
                loopFrame.breakLoop();
                return;
              } else {
                state.nodeContext = nextResult.get();
              }
            }
          }
          strategy.finish(state);
          loopFrame.breakLoop();
        })
        .then(() => {
          frame.finish(state.nodeContext);
        });
    return frame.result();
  }
}
const LayoutIterator = LayoutIterator;

export class EdgeSkipper extends vivliostyle.layoututil.LayoutIteratorStrategy {
  constructor(protected readonly leadingEdge: boolean) {}

  startNonInlineBox(state: LayoutIteratorState): undefined
      |task.Result<boolean> {}

  endEmptyNonInlineBox(state: LayoutIteratorState): undefined
      |task.Result<boolean> {}

  endNonInlineBox(state: LayoutIteratorState): undefined|task.Result<boolean> {}

  initialState(initialNodeContext: vtree.NodeContext): LayoutIteratorState {
    return {
      nodeContext: initialNodeContext,
      atUnforcedBreak: !!this.leadingEdge && initialNodeContext.after,
      break: false,
      leadingEdge: this.leadingEdge,
      breakAtTheEdge: null,
      onStartEdges: false,
      leadingEdgeContexts: [],
      lastAfterNodeContext: null
    };
  }

  /**
   * @return Returns true if a forced break occurs.
   */
  processForcedBreak(state: LayoutIteratorState, column: Column): boolean {
    const needForcedBreak =
        !state.leadingEdge && break.isForcedBreakValue(state.breakAtTheEdge);
    if (needForcedBreak) {
      const nodeContext = state.nodeContext =
          state.leadingEdgeContexts[0] || state.nodeContext;
      nodeContext.viewNode.parentNode.removeChild(nodeContext.viewNode);
      column.pageBreakType = state.breakAtTheEdge;
    }
    return needForcedBreak;
  }

  /**
   * @return Returns true if the node overflows the column.
   */
  saveEdgeAndProcessOverflow(state: LayoutIteratorState, column: Column):
      boolean {
    const overflow = column.checkOverflowAndSaveEdgeAndBreakPosition(
        state.lastAfterNodeContext, null, true, state.breakAtTheEdge);
    if (overflow) {
      state.nodeContext =
          (state.lastAfterNodeContext || state.nodeContext).modify();
      state.nodeContext.overflow = true;
    }
    return overflow;
  }

  /**
   * @returns Returns true if the layout constraint is violated.
   */
  processLayoutConstraint(
      state: LayoutIteratorState, layoutConstraint: LayoutConstraint,
      column: Column): boolean {
    let nodeContext = state.nodeContext;
    const violateConstraint = !layoutConstraint.allowLayout(nodeContext);
    if (violateConstraint) {
      column.checkOverflowAndSaveEdgeAndBreakPosition(
          state.lastAfterNodeContext, null, false, state.breakAtTheEdge);
      nodeContext = state.nodeContext = nodeContext.modify();
      nodeContext.overflow = true;
    }
    return violateConstraint;
  }

  /**
   * @override
   */
  startNonElementNode(state) {
    state.onStartEdges = false;
  }

  /**
   * @override
   */
  startNonInlineElementNode(state) {
    state.leadingEdgeContexts.push(state.nodeContext.copy());
    state.breakAtTheEdge = break.resolveEffectiveBreakValue(
        state.breakAtTheEdge, state.nodeContext.breakBefore);
    state.onStartEdges = true;
    return this.startNonInlineBox(state);
  }

  /**
   * @override
   */
  afterNonInlineElementNode(state) {
    let r;
    let cont;
    if (state.onStartEdges) {
      r = this.endEmptyNonInlineBox(state);
      cont = r && r.isPending() ? r : task.newResult(true);
      cont = cont.thenAsync(() => {
        if (!state.break) {
          state.leadingEdgeContexts = [];
          state.leadingEdge = false;
          state.atUnforcedBreak = false;
          state.breakAtTheEdge = null;
        }
        return task.newResult(true);
      });
    } else {
      r = this.endNonInlineBox(state);
      cont = r && r.isPending() ? r : task.newResult(true);
    }
    return cont.thenAsync(() => {
      if (!state.break) {
        state.onStartEdges = false;
        state.lastAfterNodeContext = state.nodeContext.copy();
        state.breakAtTheEdge = break.resolveEffectiveBreakValue(
            state.breakAtTheEdge, state.nodeContext.breakAfter);
      }
      return task.newResult(true);
    });
  }
}
const EdgeSkipper = EdgeSkipper;
goog.inherits(EdgeSkipper, LayoutIteratorStrategy);

/**
 * Represents a "pseudo"-column nested inside a real column.
 * This class is created to handle parallel fragmented flows (e.g. table columns
 * in a single table row). A pseudo-column behaves in the same way as the
 * original column, sharing its properties. Property changes on the
 * pseudo-column are not propagated to the original column. The LayoutContext of
 * the original column is also cloned and used by the pseudo-column, not to
 * propagate state changes of the LayoutContext caused by the pseudo-column.
 * @param column The original (parent) column
 * @param viewRoot Root element for the pseudo-column, i.e., the root of the
 *     fragmented flow.
 * @param parentNodeContext A NodeContext generating this PseudoColumn
 */
export class PseudoColumn {
  startNodeContexts: vtree.NodeContext[] = [];
  private column: any;

  constructor(
      column: Column, viewRoot: Element, parentNodeContext: vtree.NodeContext) {
    this.column = (Object.create(column) as Column);
    this.column.element = viewRoot;
    this.column.layoutContext = column.layoutContext.clone();
    this.column.stopAtOverflow = false;
    this.column.flowRootFormattingContext = parentNodeContext.formattingContext;
    this.column.pseudoParent = column;
    const parentClonedPaddingBorder =
        this.column.calculateClonedPaddingBorder(parentNodeContext);
    this.column.footnoteEdge =
        this.column.footnoteEdge - parentClonedPaddingBorder;
    const pseudoColumn = this;
    this.column.openAllViews = function(position) {
      return adapt.layout.Column.prototype.openAllViews.call(this, position)
          .thenAsync((result) => {
            pseudoColumn.startNodeContexts.push(result.copy());
            return task.newResult(result);
          });
    };
  }

  /**
   * @param chunkPosition starting position.
   * @return holding end position.
   */
  layout(chunkPosition: vtree.ChunkPosition, leadingEdge: boolean):
      task.Result<vtree.ChunkPosition> {
    return this.column.layout(chunkPosition, leadingEdge);
  }

  findAcceptableBreakPosition(allowBreakAtStartPosition: boolean):
      BreakPositionAndNodeContext {
    const p = this.column.findAcceptableBreakPosition();
    if (allowBreakAtStartPosition) {
      const startNodeContext = this.startNodeContexts[0].copy();
      const bp = new adapt.layout.EdgeBreakPosition(
          startNodeContext, null, startNodeContext.overflow, 0);
      bp.findAcceptableBreak(this.column, 0);
      if (!p.nodeContext) {
        return {breakPosition: bp, nodeContext: startNodeContext};
      }
    }
    return p;
  }

  /**
   * @return holing true
   */
  finishBreak(
      nodeContext: vtree.NodeContext, forceRemoveSelf: boolean,
      endOfColumn: boolean): task.Result<boolean> {
    return this.column.finishBreak(nodeContext, forceRemoveSelf, endOfColumn);
  }

  doFinishBreakOfFragmentLayoutConstraints(positionAfter: vtree.NodeContext) {
    this.column.doFinishBreakOfFragmentLayoutConstraints(positionAfter);
  }

  isStartNodeContext(nodeContext: vtree.NodeContext): boolean {
    const startNodeContext = this.startNodeContexts[0];
    return startNodeContext.viewNode === nodeContext.viewNode &&
        startNodeContext.after === nodeContext.after &&
        startNodeContext.offsetInNode === nodeContext.offsetInNode;
  }

  isLastAfterNodeContext(nodeContext: vtree.NodeContext): boolean {
    return vtree.isSameNodePosition(
        nodeContext.toNodePosition(), this.column.lastAfterPosition);
  }

  getColumnElement(): Element {
    return this.column.element;
  }

  getColumn(): Column {
    return this.column;
  }
}
const PseudoColumn = PseudoColumn;

/**
 * @abstract
 */
export class AbstractLayoutRetryer {
  initialBreakPositions: BreakPosition[] = null;
  initialStateOfFormattingContext: any = null;
  initialPosition: any;
  initialFragmentLayoutConstraints: any;

  layout(nodeContext: vtree.NodeContext, column: Column):
      task.Result<vtree.NodeContext> {
    this.prepareLayout(nodeContext, column);
    return this.tryLayout(nodeContext, column);
  }

  private tryLayout(nodeContext: vtree.NodeContext, column: Column):
      task.Result<vtree.NodeContext> {
    const frame =
        task.newFrame('vivliostyle.layoututil.AbstractLayoutRetryer.tryLayout');
    this.saveState(nodeContext, column);
    const mode = this.resolveLayoutMode(nodeContext);
    mode.doLayout(nodeContext, column).then(function(positionAfter) {
      let accepted = mode.accept(positionAfter, column);
      accepted = mode.postLayout(
          positionAfter, this.initialPosition, column, accepted);
      if (accepted) {
        frame.finish(positionAfter);
      } else {
        goog.asserts.assert(this.initialPosition);
        this.clearNodes(this.initialPosition);
        this.restoreState(nodeContext, column);
        this.tryLayout(this.initialPosition, column).thenFinish(frame);
      }
    }.bind(this));
    return frame.result();
  }

  /**
   * @abstract
   */
  resolveLayoutMode(nodeContext: vtree.NodeContext): LayoutMode {}

  prepareLayout(nodeContext: vtree.NodeContext, column: Column) {}

  clearNodes(initialPosition: vtree.NodeContext) {
    const viewNode =
        initialPosition.viewNode || initialPosition.parent.viewNode;
    let child;
    while (child = viewNode.lastChild) {
      viewNode.removeChild(child);
    }
    let sibling;
    while (sibling = viewNode.nextSibling) {
      sibling.parentNode.removeChild(sibling);
    }
  }

  saveState(nodeContext: vtree.NodeContext, column: Column) {
    this.initialPosition = nodeContext.copy();
    this.initialBreakPositions = [].concat(column.breakPositions);
    this.initialFragmentLayoutConstraints =
        [].concat(column.fragmentLayoutConstraints);
    if (nodeContext.formattingContext) {
      this.initialStateOfFormattingContext =
          nodeContext.formattingContext.saveState();
    }
  }

  restoreState(nodeContext: vtree.NodeContext, column: Column) {
    column.breakPositions = this.initialBreakPositions;
    column.fragmentLayoutConstraints = this.initialFragmentLayoutConstraints;
    if (nodeContext.formattingContext) {
      nodeContext.formattingContext.restoreState(
          this.initialStateOfFormattingContext);
    }
  }
}
const AbstractLayoutRetryer = AbstractLayoutRetryer;

export interface LayoutMode {
  doLayout(nodeContext: vtree.NodeContext, column: Column):
      task.Result<vtree.NodeContext>;

  accept(nodeContext: vtree.NodeContext, column: Column): boolean;

  postLayout(
      positionAfter: vtree.NodeContext, initialPosition: vtree.NodeContext,
      column: Column, accepted: boolean): boolean;
}
const LayoutMode = LayoutMode;
