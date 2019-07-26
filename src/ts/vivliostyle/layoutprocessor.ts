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
 * @fileoverview LayoutProcessor - Definitions of LayoutProcessor.
 */
import * as Task from "../adapt/task";
import * as BreakPosition from "./breakposition";
import { isBlock } from "./display";
import * as LayoutHelper from "./layouthelper";
import * as Plugin from "./plugin";
import {
  Layout,
  LayoutProcessor,
  ViewTree,
  FormattingContextType
} from "./types";

/**
 * Processor doing some special layout (e.g. table layout)
 */
export interface LayoutProcessor {
  /**
   * Do actual layout in the column starting from given NodeContext.
   */
  layout(
    nodeContext: ViewTree.NodeContext,
    column: Layout.Column,
    leadingEdge: boolean
  ): Task.Result<ViewTree.NodeContext>;

  /**
   * Potential edge breaking position.
   */
  createEdgeBreakPosition(
    position: ViewTree.NodeContext,
    breakOnEdge: string | null,
    overflows: boolean,
    columnBlockSize: number
  ): Layout.BreakPosition;

  /**
   * process nodecontext at the start of a non inline element.
   * @return return true if you skip the subsequent nodes
   */
  startNonInlineElementNode(nodeContext: ViewTree.NodeContext): boolean;

  /**
   * process nodecontext after a non inline element.
   * @return return true if you skip the subsequent nodes
   */
  afterNonInlineElementNode(
    nodeContext: ViewTree.NodeContext,
    stopAtOverflow: boolean
  ): boolean;

  /**
   * @return holing true
   */
  finishBreak(
    column: Layout.Column,
    nodeContext: ViewTree.NodeContext,
    forceRemoveSelf: boolean,
    endOfColumn: boolean
  ): Task.Result<boolean> | null;

  clearOverflownViewNodes(
    column: Layout.Column,
    parentNodeContext: ViewTree.NodeContext,
    nodeContext: ViewTree.NodeContext,
    removeSelf: boolean
  );
}

/**
 * Resolver finding an appropriate LayoutProcessor given a formatting context
 */
export class LayoutProcessorResolver {
  /**
   * Find LayoutProcessor corresponding to given formatting context.
   */
  find(formattingContext: ViewTree.FormattingContext): LayoutProcessor {
    const hooks: Plugin.ResolveLayoutProcessorHook[] = Plugin.getHooksForName(
      Plugin.HOOKS.RESOLVE_LAYOUT_PROCESSOR
    );
    for (let i = 0; i < hooks.length; i++) {
      const processor = hooks[i](formattingContext);
      if (processor) {
        return processor;
      }
    }
    throw new Error(
      `No processor found for a formatting context: ${formattingContext.getName()}`
    );
  }
}

export class BlockLayoutProcessor implements LayoutProcessor {
  /**
   * @override
   */
  layout(nodeContext, column, leadingEdge) {
    if (column.isFloatNodeContext(nodeContext)) {
      return column.layoutFloatOrFootnote(nodeContext);
    } else if (column.isBreakable(nodeContext)) {
      return column.layoutBreakableBlock(nodeContext);
    } else {
      return column.layoutUnbreakable(nodeContext);
    }
  }

  /**
   * @override
   */
  createEdgeBreakPosition(position, breakOnEdge, overflows, columnBlockSize) {
    return new BreakPosition.EdgeBreakPosition(
      position.copy(),
      breakOnEdge,
      overflows,
      columnBlockSize
    );
  }

  /**
   * @override
   */
  startNonInlineElementNode(nodeContext) {
    return false;
  }

  /**
   * @override
   */
  afterNonInlineElementNode(nodeContext) {
    return false;
  }

  /**
   * @override
   */
  clearOverflownViewNodes(column, parentNodeContext, nodeContext, removeSelf) {
    if (!nodeContext.viewNode) {
      return;
    }
    if (!nodeContext.viewNode.parentNode) {
      return;
    }
    const parentNode = nodeContext.viewNode.parentNode;
    LayoutHelper.removeFollowingSiblings(parentNode, nodeContext.viewNode);
    if (removeSelf) {
      parentNode.removeChild(nodeContext.viewNode);
    }
  }

  /**
   * @return holing true
   * @override
   */
  finishBreak(
    column: Layout.Column,
    nodeContext: ViewTree.NodeContext,
    forceRemoveSelf: boolean,
    endOfColumn: boolean
  ): Task.Result<boolean> {
    const removeSelf =
      forceRemoveSelf ||
      (nodeContext.viewNode != null &&
        nodeContext.viewNode.nodeType == 1 &&
        !nodeContext.after);
    column.clearOverflownViewNodes(nodeContext, removeSelf);
    if (endOfColumn) {
      column.fixJustificationIfNeeded(nodeContext, true);
      column.layoutContext.processFragmentedBlockEdge(
        removeSelf ? nodeContext : nodeContext.parent
      );
    }
    return Task.newResult(true);
  }
}

export class BlockFormattingContext
  implements LayoutProcessor.BlockFormattingContext {
  formattingContextType: FormattingContextType = "Block";

  constructor(private readonly parent: ViewTree.FormattingContext) {}

  /**
   * @override
   */
  getName() {
    return "Block formatting context (BlockFormattingContext)";
  }

  /**
   * @override
   */
  isFirstTime(nodeContext, firstTime) {
    return firstTime;
  }

  /**
   * @override
   */
  getParent() {
    return this.parent;
  }

  /** @override */
  saveState() {}

  /** @override */
  restoreState(state) {}
}

export const blockLayoutProcessor = new BlockLayoutProcessor();

export const isInstanceOfBlockFormattingContext =
  LayoutProcessor.isInstanceOfBlockFormattingContext;

Plugin.registerHook(
  Plugin.HOOKS.RESOLVE_FORMATTING_CONTEXT,
  (nodeContext, firstTime, display, position, floatSide, isRoot) => {
    const parent = nodeContext.parent;
    if (!parent && nodeContext.formattingContext) {
      return null;
    } else if (
      parent &&
      nodeContext.formattingContext !== parent.formattingContext
    ) {
      return null;
    } else if (
      nodeContext.establishesBFC ||
      (!nodeContext.formattingContext &&
        isBlock(display, position, floatSide, isRoot))
    ) {
      return new BlockFormattingContext(
        parent ? parent.formattingContext : null
      );
    } else {
      return null;
    }
  }
);

Plugin.registerHook(
  Plugin.HOOKS.RESOLVE_LAYOUT_PROCESSOR,
  formattingContext => {
    if (formattingContext instanceof BlockFormattingContext) {
      return blockLayoutProcessor;
    }
    return null;
  }
);
