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
 * @fileoverview LayoutRetryers - Definitions of LayoutRetryer.
 */
import * as Asserts from "./asserts";
import * as Task from "./task";
import { Layout, Vtree } from "./types";

/**
 * @abstract
 */
export abstract class AbstractLayoutRetryer {
  initialBreakPositions: Layout.BreakPosition[] = null;
  initialStateOfFormattingContext: Vtree.NodeContext = null;
  initialPosition: Vtree.NodeContext;
  initialFragmentLayoutConstraints: Layout.FragmentLayoutConstraint[];

  layout(
    nodeContext: Vtree.NodeContext,
    column: Layout.Column,
  ): Task.Result<Vtree.NodeContext> {
    this.prepareLayout(nodeContext, column);
    return this.tryLayout(nodeContext, column);
  }

  private tryLayout(
    nodeContext: Vtree.NodeContext,
    column: Layout.Column,
  ): Task.Result<Vtree.NodeContext> {
    const frame = Task.newFrame<Vtree.NodeContext>(
      "AbstractLayoutRetryer.tryLayout",
    );
    this.saveState(nodeContext, column);
    const mode = this.resolveLayoutMode(nodeContext);
    mode.doLayout(nodeContext, column).then((positionAfter) => {
      let accepted = mode.accept(positionAfter, column);
      accepted = mode.postLayout(
        positionAfter,
        this.initialPosition,
        column,
        accepted,
      );
      if (accepted) {
        frame.finish(positionAfter);
      } else {
        Asserts.assert(this.initialPosition);
        this.clearNodes(this.initialPosition);
        this.restoreState(nodeContext, column);
        this.tryLayout(this.initialPosition, column).thenFinish(frame);
      }
    });
    return frame.result();
  }

  /**
   * @abstract
   */
  abstract resolveLayoutMode(nodeContext: Vtree.NodeContext): Layout.LayoutMode;

  prepareLayout(nodeContext: Vtree.NodeContext, column: Layout.Column) {}

  clearNodes(initialPosition: Vtree.NodeContext) {
    const viewNode =
      initialPosition.viewNode || initialPosition.parent.viewNode;
    let child: Node;
    while ((child = viewNode.lastChild)) {
      viewNode.removeChild(child);
    }
    let sibling: Node;
    while ((sibling = viewNode.nextSibling)) {
      sibling.parentNode.removeChild(sibling);
    }
  }

  saveState(nodeContext: Vtree.NodeContext, column: Layout.Column) {
    this.initialPosition = nodeContext.copy();
    this.initialBreakPositions = [].concat(column.breakPositions);
    this.initialFragmentLayoutConstraints = [].concat(
      column.fragmentLayoutConstraints,
    );
    if (nodeContext.formattingContext) {
      this.initialStateOfFormattingContext = nodeContext.formattingContext.saveState();
    }
  }

  restoreState(nodeContext: Vtree.NodeContext, column: Layout.Column) {
    column.breakPositions = this.initialBreakPositions;
    column.fragmentLayoutConstraints = this.initialFragmentLayoutConstraints;
    if (nodeContext.formattingContext) {
      nodeContext.formattingContext.restoreState(
        this.initialStateOfFormattingContext,
      );
    }
  }
}
