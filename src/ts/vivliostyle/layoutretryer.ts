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
 * @fileoverview Definitions of LayoutRetryer.
 */
import * as task from '../adapt/task';
import * as asserts from './asserts';
import {layout, vtree} from './types';

/**
 * @abstract
 */
export abstract class AbstractLayoutRetryer {
  initialBreakPositions: layout.BreakPosition[] = null;
  initialStateOfFormattingContext: any = null;
  initialPosition: any;
  initialFragmentLayoutConstraints: any;

  layout(
    nodeContext: vtree.NodeContext,
    column: layout.Column
  ): task.Result<vtree.NodeContext> {
    this.prepareLayout(nodeContext, column);
    return this.tryLayout(nodeContext, column);
  }

  private tryLayout(
    nodeContext: vtree.NodeContext,
    column: layout.Column
  ): task.Result<vtree.NodeContext> {
    const frame = task.newFrame<vtree.NodeContext>(
      'vivliostyle.layoututil.AbstractLayoutRetryer.tryLayout'
    );
    this.saveState(nodeContext, column);
    const mode = this.resolveLayoutMode(nodeContext);
    mode.doLayout(nodeContext, column).then(
      function(positionAfter) {
        let accepted = mode.accept(positionAfter, column);
        accepted = mode.postLayout(
          positionAfter,
          this.initialPosition,
          column,
          accepted
        );
        if (accepted) {
          frame.finish(positionAfter);
        } else {
          asserts.assert(this.initialPosition);
          this.clearNodes(this.initialPosition);
          this.restoreState(nodeContext, column);
          this.tryLayout(this.initialPosition, column).thenFinish(frame);
        }
      }.bind(this)
    );
    return frame.result();
  }

  /**
   * @abstract
   */
  abstract resolveLayoutMode(nodeContext: vtree.NodeContext): layout.LayoutMode;

  prepareLayout(nodeContext: vtree.NodeContext, column: layout.Column) {}

  clearNodes(initialPosition: vtree.NodeContext) {
    const viewNode =
      initialPosition.viewNode || initialPosition.parent.viewNode;
    let child;
    while ((child = viewNode.lastChild)) {
      viewNode.removeChild(child);
    }
    let sibling;
    while ((sibling = viewNode.nextSibling)) {
      sibling.parentNode.removeChild(sibling);
    }
  }

  saveState(nodeContext: vtree.NodeContext, column: layout.Column) {
    this.initialPosition = nodeContext.copy();
    this.initialBreakPositions = [].concat(column.breakPositions);
    this.initialFragmentLayoutConstraints = [].concat(
      column.fragmentLayoutConstraints
    );
    if (nodeContext.formattingContext) {
      this.initialStateOfFormattingContext = nodeContext.formattingContext.saveState();
    }
  }

  restoreState(nodeContext: vtree.NodeContext, column: layout.Column) {
    column.breakPositions = this.initialBreakPositions;
    column.fragmentLayoutConstraints = this.initialFragmentLayoutConstraints;
    if (nodeContext.formattingContext) {
      nodeContext.formattingContext.restoreState(
        this.initialStateOfFormattingContext
      );
    }
  }
}
