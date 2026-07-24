/**
 * Copyright 2016 Daishinsha Inc.
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
 * @fileoverview LayoutUtil - Utilities related to layout.
 */
import * as Break from "./break";
import * as Task from "./task";
import * as VtreeImpl from "./vtree";
import { Layout, Vtree } from "./types";

export type LayoutIteratorState = {
  nodeContext: Vtree.NodeContext | null;
  atUnforcedBreak: boolean;
  break: boolean;
  leadingEdge?: boolean;
  breakAtTheEdge?: string | null;
  onStartEdges?: boolean;
  leadingEdgeContexts?: Vtree.RenderedNodeContext[];
  lastAfterNodeContext?: Vtree.NodeContext | null;
};

export interface ActiveLayoutIteratorState extends LayoutIteratorState {
  get nodeContext(): Vtree.NodeContext;
  set nodeContext(nodeContext: Vtree.NodeContext | null);
}

export function asActiveState(
  state: LayoutIteratorState,
): ActiveLayoutIteratorState | null {
  return state.nodeContext !== null
    ? (state as ActiveLayoutIteratorState)
    : null;
}

export interface RenderedActiveLayoutIteratorState extends ActiveLayoutIteratorState {
  get nodeContext(): Vtree.RenderedNodeContext;
  set nodeContext(nodeContext: Vtree.NodeContext | null);
}

export function asRenderedActiveState(
  state: ActiveLayoutIteratorState,
): RenderedActiveLayoutIteratorState | null {
  return VtreeImpl.asRenderedNodeContext(state.nodeContext) !== null
    ? (state as RenderedActiveLayoutIteratorState)
    : null;
}

export class LayoutIteratorStrategy {
  initialState(initialNodeContext: Vtree.NodeContext): LayoutIteratorState {
    return {
      nodeContext: initialNodeContext,
      atUnforcedBreak: false,
      break: false,
    };
  }

  startNonDisplayableNode(
    state: ActiveLayoutIteratorState,
  ): void | Task.Result<boolean> {}

  afterNonDisplayableNode(
    state: ActiveLayoutIteratorState,
  ): void | Task.Result<boolean> {}

  startIgnoredTextNode(
    state: RenderedActiveLayoutIteratorState,
  ): void | Task.Result<boolean> {}

  afterIgnoredTextNode(
    state: RenderedActiveLayoutIteratorState,
  ): void | Task.Result<boolean> {}

  startNonElementNode(
    state: RenderedActiveLayoutIteratorState,
  ): void | Task.Result<boolean> {}

  afterNonElementNode(
    state: RenderedActiveLayoutIteratorState,
  ): void | Task.Result<boolean> {}

  startInlineElementNode(
    state: RenderedActiveLayoutIteratorState,
  ): void | Task.Result<boolean> {}

  afterInlineElementNode(
    state: RenderedActiveLayoutIteratorState,
  ): void | Task.Result<boolean> {}

  startNonInlineElementNode(
    state: RenderedActiveLayoutIteratorState,
  ): void | Task.Result<boolean> {}

  afterNonInlineElementNode(
    state: RenderedActiveLayoutIteratorState,
  ): void | Task.Result<boolean> {}

  finish(state: LayoutIteratorState): void | Task.Result<boolean> {}
}

export class LayoutIterator {
  constructor(
    private readonly strategy: LayoutIteratorStrategy,
    private readonly layoutContext: Vtree.LayoutContext,
  ) {}

  iterate(
    initialNodeContext: Vtree.NodeContext,
  ): Task.Result<Vtree.NodeContext> {
    const strategy = this.strategy;
    const state = strategy.initialState(initialNodeContext);
    const frame: Task.Frame<Vtree.NodeContext> =
      Task.newFrame("LayoutIterator");
    frame
      .loopWithFrame((loopFrame) => {
        for (;;) {
          const active = asActiveState(state);
          if (!active) {
            break;
          }
          const nextResult = this.step(active);
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
          } else if (state.break) {
            loopFrame.breakLoop();
            return;
          } else {
            state.nodeContext = nextResult.get();
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

  private step(
    state: ActiveLayoutIteratorState,
  ): Task.Result<Vtree.NodeContext | null> {
    const strategy = this.strategy;
    let r: void | Task.Result<boolean>;
    const rendered = asRenderedActiveState(state);
    if (!rendered) {
      if (state.nodeContext.after) {
        r = strategy.afterNonDisplayableNode(state);
      } else {
        r = strategy.startNonDisplayableNode(state);
      }
    } else if (rendered.nodeContext.viewNode.nodeType !== 1) {
      if (
        VtreeImpl.canIgnore(
          rendered.nodeContext.viewNode,
          rendered.nodeContext.whitespace,
        )
      ) {
        if (rendered.nodeContext.after) {
          r = strategy.afterIgnoredTextNode(rendered);
        } else {
          r = strategy.startIgnoredTextNode(rendered);
        }
      } else {
        if (rendered.nodeContext.after) {
          r = strategy.afterNonElementNode(rendered);
        } else {
          r = strategy.startNonElementNode(rendered);
        }
      }
    } else {
      if (rendered.nodeContext.inline) {
        if (rendered.nodeContext.after) {
          r = strategy.afterInlineElementNode(rendered);
        } else {
          r = strategy.startInlineElementNode(rendered);
        }
      } else {
        if (rendered.nodeContext.after) {
          r = strategy.afterNonInlineElementNode(rendered);
        } else {
          r = strategy.startNonInlineElementNode(rendered);
        }
      }
    }
    const cont = r && r.isPending() ? r : Task.newResult(true);
    return cont.thenAsync(() => {
      if (state.break) {
        return Task.newResult(null);
      }
      return this.layoutContext.nextInTree(
        state.nodeContext,
        state.atUnforcedBreak,
      );
    });
  }
}

export class EdgeSkipper extends LayoutIteratorStrategy {
  constructor(protected readonly leadingEdge?: boolean) {
    super();
  }

  startNonInlineBox(
    state: RenderedActiveLayoutIteratorState,
  ): void | Task.Result<boolean> {}

  endEmptyNonInlineBox(
    state: RenderedActiveLayoutIteratorState,
  ): void | Task.Result<boolean> {}

  endNonInlineBox(
    state: RenderedActiveLayoutIteratorState,
  ): void | Task.Result<boolean> {}

  initialState(initialNodeContext: Vtree.NodeContext): LayoutIteratorState {
    return {
      nodeContext: initialNodeContext,
      atUnforcedBreak: !!this.leadingEdge && initialNodeContext.after,
      break: false,
      leadingEdge: this.leadingEdge,
      breakAtTheEdge: null,
      onStartEdges: false,
      leadingEdgeContexts: [],
      lastAfterNodeContext: null,
    };
  }

  /**
   * @return Returns true if a forced break occurs.
   */
  processForcedBreak(
    state: RenderedActiveLayoutIteratorState,
    column: Layout.Column,
  ): boolean {
    const needForcedBreak =
      !state.leadingEdge && Break.isForcedBreakValue(state.breakAtTheEdge);
    if (needForcedBreak) {
      const nodeContext = (state.nodeContext =
        state.leadingEdgeContexts[0] || state.nodeContext);
      nodeContext.viewNode.remove();
      column.pageBreakType = state.breakAtTheEdge;
    }
    return needForcedBreak;
  }

  /**
   * @return Returns true if the node overflows the column.
   */
  saveEdgeAndProcessOverflow(
    state: RenderedActiveLayoutIteratorState,
    column: Layout.Column,
  ): boolean {
    const overflow = column.checkOverflowAndSaveEdgeAndBreakPosition(
      state.lastAfterNodeContext,
      null,
      true,
      state.breakAtTheEdge,
    );
    if (overflow) {
      state.nodeContext = (
        state.lastAfterNodeContext || state.nodeContext
      ).modify();
      state.nodeContext.overflow = true;
    }
    return overflow;
  }

  /**
   * @returns Returns true if the layout constraint is violated.
   */
  processLayoutConstraint(
    state: RenderedActiveLayoutIteratorState,
    layoutConstraint: Layout.LayoutConstraint,
    column: Layout.Column,
  ): boolean {
    let nodeContext = state.nodeContext;
    const violateConstraint = !layoutConstraint.allowLayout(nodeContext);
    if (violateConstraint) {
      column.checkOverflowAndSaveEdgeAndBreakPosition(
        state.lastAfterNodeContext,
        null,
        false,
        state.breakAtTheEdge,
      );
      nodeContext = state.nodeContext = nodeContext.modify();
      nodeContext.overflow = true;
    }
    return violateConstraint;
  }

  override startNonElementNode(
    state: RenderedActiveLayoutIteratorState,
  ): void | Task.Result<boolean> {
    state.onStartEdges = false;
  }

  override startNonInlineElementNode(
    state: RenderedActiveLayoutIteratorState,
  ): void | Task.Result<boolean> {
    state.leadingEdgeContexts.push(state.nodeContext.copy());
    state.breakAtTheEdge = Break.resolveEffectiveBreakValue(
      state.breakAtTheEdge,
      state.nodeContext.breakBefore,
    );
    state.onStartEdges = true;
    return this.startNonInlineBox(state);
  }

  override afterNonInlineElementNode(
    state: RenderedActiveLayoutIteratorState,
  ): void | Task.Result<boolean> {
    let r: void | Task.Result<boolean>;
    let cont: Task.Result<boolean>;
    if (state.onStartEdges) {
      r = this.endEmptyNonInlineBox(state);
      cont = r && r.isPending() ? r : Task.newResult(true);
      cont = cont.thenAsync(() => {
        if (!state.break) {
          state.leadingEdgeContexts = [];
          state.leadingEdge = false;
          state.atUnforcedBreak = false;
          state.breakAtTheEdge = null;
        }
        return Task.newResult(true);
      });
    } else {
      r = this.endNonInlineBox(state);
      cont = r && r.isPending() ? r : Task.newResult(true);
    }
    return cont.thenAsync(() => {
      if (!state.break) {
        state.onStartEdges = false;
        state.lastAfterNodeContext = state.nodeContext.copy();
        state.breakAtTheEdge = Break.resolveEffectiveBreakValue(
          state.breakAtTheEdge,
          state.nodeContext.breakAfter,
        );
      }
      return Task.newResult(true);
    });
  }
}
