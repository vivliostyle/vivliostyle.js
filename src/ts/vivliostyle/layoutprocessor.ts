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
 * @fileoverview Definitions of LayoutProcessor.
 */

import * as task from '../adapt/task';
import * as breakposition from './breakposition';
import {isBlock} from './display';
import * as layouthelper from './layouthelper';
import * as plugin from './plugin';
import {layout, layoutprocessor, vtree, FormattingContextType} from './types';

/**
 * Processor doing some special layout (e.g. table layout)
 */
export interface LayoutProcessor {
  /**
   * Do actual layout in the column starting from given NodeContext.
   */
  layout(nodeContext: vtree.NodeContext, column: layout.Column, leadingEdge: boolean):
      task.Result<vtree.NodeContext>;

  /**
   * Potential edge breaking position.
   */
  createEdgeBreakPosition(
      position: vtree.NodeContext, breakOnEdge: string|null, overflows: boolean,
      columnBlockSize: number): layout.BreakPosition;

  /**
   * process nodecontext at the start of a non inline element.
   * @return return true if you skip the subsequent nodes
   */
  startNonInlineElementNode(nodeContext: vtree.NodeContext): boolean;

  /**
   * process nodecontext after a non inline element.
   * @return return true if you skip the subsequent nodes
   */
  afterNonInlineElementNode(
      nodeContext: vtree.NodeContext, stopAtOverflow: boolean): boolean;

  /**
   * @return holing true
   */
  finishBreak(
      column: layout.Column, nodeContext: vtree.NodeContext, forceRemoveSelf: boolean,
      endOfColumn: boolean): task.Result<boolean>|null;

  clearOverflownViewNodes(
      column: layout.Column, parentNodeContext: vtree.NodeContext,
      nodeContext: vtree.NodeContext, removeSelf: boolean);
}

/**
 * Resolver finding an appropriate LayoutProcessor given a formatting context
 */
export class LayoutProcessorResolver {
  /**
   * Find LayoutProcessor corresponding to given formatting context.
   */
  find(formattingContext: vtree.FormattingContext): LayoutProcessor {
    const hooks: plugin.ResolveLayoutProcessorHook[] =
        plugin.getHooksForName(
            plugin.HOOKS.RESOLVE_LAYOUT_PROCESSOR);
    for (let i = 0; i < hooks.length; i++) {
      const processor = hooks[i](formattingContext);
      if (processor) {
        return processor;
      }
    }
    throw new Error(`No processor found for a formatting context: ${
        formattingContext.getName()}`);
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
    return new breakposition.EdgeBreakPosition(
      position.copy(), breakOnEdge, overflows, columnBlockSize);
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
  clearOverflownViewNodes(column, parentNodeContext, nodeContext, removeSelf) {
    if (!nodeContext.viewNode) {
      return;
    }
    if (!nodeContext.viewNode.parentNode) {
      return;
    }
    const parentNode = nodeContext.viewNode.parentNode;
    layouthelper.removeFollowingSiblings(parentNode, nodeContext.viewNode);
    if (removeSelf) {
      parentNode.removeChild(nodeContext.viewNode);
    }
  }

  /**
   * @return holing true
   * @override
   */
  finishBreak(
      column: layout.Column, nodeContext: vtree.NodeContext, forceRemoveSelf: boolean,
      endOfColumn: boolean): task.Result<boolean> {
    const removeSelf = forceRemoveSelf ||
        nodeContext.viewNode != null && nodeContext.viewNode.nodeType == 1 &&
            !nodeContext.after;
    column.clearOverflownViewNodes(nodeContext, removeSelf);
    if (endOfColumn) {
      column.fixJustificationIfNeeded(nodeContext, true);
      column.layoutContext.processFragmentedBlockEdge(
          removeSelf ? nodeContext : nodeContext.parent);
    }
    return task.newResult(true);
  }
}

export class BlockFormattingContext implements layoutprocessor.BlockFormattingContext {
  formattingContextType: FormattingContextType = 'Block';

  constructor(private readonly parent: vtree.FormattingContext) {}

  /**
   * @override
   */
  getName() {return 'Block formatting context (BlockFormattingContext)';}

  /**
   * @override
   */
  isFirstTime(nodeContext, firstTime) {return firstTime;}

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

export function registerLayoutProcessorPlugin() {
  plugin.registerHook(
    plugin.HOOKS.RESOLVE_FORMATTING_CONTEXT,
    (nodeContext, firstTime, display, position, floatSide, isRoot) => {
      const parent = nodeContext.parent;
      if (!parent && nodeContext.formattingContext) {
        return null;
      } else if (parent &&
          nodeContext.formattingContext !== parent.formattingContext) {
        return null;
      } else if (nodeContext.establishesBFC ||
          !nodeContext.formattingContext &&
              isBlock(
                  display, position, floatSide, isRoot)) {
        return new BlockFormattingContext(
            parent ? parent.formattingContext : null);
      } else {
        return null;
      }
    });
  plugin.registerHook(
    plugin.HOOKS.RESOLVE_LAYOUT_PROCESSOR, (formattingContext) => {
      if (formattingContext instanceof BlockFormattingContext) {
        return blockLayoutProcessor;
      }
      return null;
    });
}
