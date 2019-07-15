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
 * @fileoverview Utilities for selectors.
 */
import * as base from "../adapt/base";
import * as task from "../adapt/task";
import { ChunkPosition, ShadowContext } from "../adapt/vtree";
import * as asserts from "./asserts";
import * as layouthelper from "./layouthelper";
import { NthFragmentMatcher } from "./matcher";
import * as pseudoElement from "./pseudoelement";
import { layout, selector, vtree, FragmentLayoutConstraintType } from "./types";

export const registerFragmentIndex = NthFragmentMatcher.registerFragmentIndex;

export const clearFragmentIndices = NthFragmentMatcher.clearFragmentIndices;

// FIXME: When importing layoututil module statically, it causes a circular dependency.
let layoututil: typeof import("./layoututil");
import("./layoututil").then(it => {
  layoututil = it;
});

export class AfterIfContinues implements selector.AfterIfContinues {
  constructor(
    public readonly sourceNode: Element,
    public readonly styler: pseudoElement.PseudoelementStyler
  ) {}

  createElement(
    column: layout.Column,
    parentNodeContext: vtree.NodeContext
  ): task.Result<Element> {
    if (!layoututil) {
      throw new Error("layoututil module is required but not be imported.");
    }
    const doc = parentNodeContext.viewNode.ownerDocument;
    const viewRoot = doc.createElement("div");
    const pseudoColumn = new layoututil.PseudoColumn(
      column,
      viewRoot,
      parentNodeContext
    );
    const initialPageBreakType = pseudoColumn.getColumn().pageBreakType;
    pseudoColumn.getColumn().pageBreakType = null;
    return pseudoColumn
      .layout(this.createNodePositionForPseudoElement(), true)
      .thenAsync(() => {
        this.styler.contentProcessed["after-if-continues"] = false;
        pseudoColumn.getColumn().pageBreakType = initialPageBreakType;
        const pseudoElement = viewRoot.firstChild as Element;
        base.setCSSProperty(pseudoElement, "display", "block");
        return task.newResult(pseudoElement);
      });
  }

  private createNodePositionForPseudoElement(): vtree.ChunkPosition {
    const sourceNode = pseudoElement.document.createElementNS(
      base.NS.XHTML,
      "div"
    );
    pseudoElement.setPseudoName(sourceNode, "after-if-continues");
    const shadowContext = this.createShadowContext(sourceNode);
    const step = {
      node: sourceNode,
      shadowType: shadowContext.type,
      shadowContext,
      nodeShadow: null,
      shadowSibling: null
    };
    const nodePosition = {
      steps: [step],
      offsetInNode: 0,
      after: false,
      preprocessedTextContent: null
    };
    return new ChunkPosition(nodePosition as any);
  }

  private createShadowContext(root: Element): vtree.ShadowContext {
    return new ShadowContext(
      this.sourceNode,
      root,
      null,
      null,
      null,
      vtree.ShadowType.ROOTED,
      this.styler
    );
  }
}

export class AfterIfContinuesLayoutConstraint
  implements selector.AfterIfContinuesLayoutConstraint {
  flagmentLayoutConstraintType: FragmentLayoutConstraintType =
    "AfterIfContinue";
  nodeContext: any;
  afterIfContinues: any;
  pseudoElementHeight: any;

  constructor(
    nodeContext: vtree.NodeContext,
    afterIfContinues: selector.AfterIfContinues,
    pseudoElementHeight: number
  ) {
    this.nodeContext = nodeContext;
    this.afterIfContinues = afterIfContinues;
    this.pseudoElementHeight = pseudoElementHeight;
  }

  /** @override */
  allowLayout(nodeContext, overflownNodeContext, column) {
    if (
      (overflownNodeContext && !nodeContext) ||
      (nodeContext && nodeContext.overflow)
    ) {
      return false;
    } else {
      return true;
    }
  }

  /** @override */
  nextCandidate(nodeContext) {
    return false;
  }

  /** @override */
  postLayout(allowed, nodeContext, initialPosition, column) {}

  /** @override */
  finishBreak(nodeContext, column) {
    if (!this.getRepetitiveElements().affectTo(nodeContext)) {
      return task.newResult(true);
    }
    return this.afterIfContinues
      .createElement(column, this.nodeContext)
      .thenAsync(element => {
        this.nodeContext.viewNode.appendChild(element);
        return task.newResult(true);
      });
  }

  getRepetitiveElements() {
    return new AfterIfContinuesElementsOffset(
      this.nodeContext,
      this.pseudoElementHeight
    );
  }

  /** @override */
  equalsTo(constraint) {
    if (!(constraint instanceof AfterIfContinuesLayoutConstraint)) {
      return false;
    }
    return (
      this.afterIfContinues ==
      (constraint as AfterIfContinuesLayoutConstraint).afterIfContinues
    );
  }

  /** @override */
  getPriorityOfFinishBreak() {
    return 9;
  }
}

export class AfterIfContinuesElementsOffset
  implements selector.AfterIfContinuesElementsOffset {
  nodeContext: any;
  pseudoElementHeight: any;

  constructor(nodeContext, pseudoElementHeight) {
    this.nodeContext = nodeContext;
    this.pseudoElementHeight = pseudoElementHeight;
  }

  /** @override */
  calculateOffset(nodeContext) {
    if (!this.affectTo(nodeContext)) {
      return 0;
    }
    return this.pseudoElementHeight;
  }

  /** @override */
  calculateMinimumOffset(nodeContext) {
    return this.calculateOffset(nodeContext);
  }

  affectTo(nodeContext: vtree.NodeContext): boolean {
    if (!nodeContext) {
      return false;
    }
    const sourceNode = nodeContext.shadowContext
      ? nodeContext.shadowContext.owner
      : nodeContext.sourceNode;
    if (sourceNode === this.nodeContext.sourceNode) {
      return !!nodeContext.after;
    }
    for (let n = sourceNode.parentNode; n; n = n.parentNode) {
      if (n === this.nodeContext.sourceNode) {
        return true;
      }
    }
    return false;
  }
}

function processAfterIfContinuesOfNodeContext(
  nodeContext: vtree.NodeContext,
  column: layout.Column
): task.Result<vtree.NodeContext> {
  if (
    !nodeContext ||
    !nodeContext.afterIfContinues ||
    nodeContext.after ||
    column.isFloatNodeContext(nodeContext)
  ) {
    return task.newResult(nodeContext);
  }
  const afterIfContinues = nodeContext.afterIfContinues;
  return afterIfContinues
    .createElement(column, nodeContext)
    .thenAsync(pseudoElement => {
      asserts.assert(nodeContext !== null);
      const pseudoElementHeight = calculatePseudoElementHeight(
        nodeContext,
        column,
        pseudoElement
      );
      column.fragmentLayoutConstraints.push(
        new AfterIfContinuesLayoutConstraint(
          nodeContext,
          afterIfContinues,
          pseudoElementHeight
        )
      );
      return task.newResult(nodeContext);
    });
}

export const processAfterIfContinues = (
  result: task.Result<vtree.NodeContext>,
  column: layout.Column
): task.Result<vtree.NodeContext> =>
  result.thenAsync(nodeContext =>
    processAfterIfContinuesOfNodeContext(nodeContext, column)
  );

export const processAfterIfContinuesOfAncestors = (
  nodeContext: vtree.NodeContext,
  column: layout.Column
): task.Result<boolean> => {
  const frame: task.Frame<boolean> = task.newFrame(
    "vivliostyle.selectors.processAfterIfContinuesOfAncestors"
  );
  let current: vtree.NodeContext = nodeContext;
  frame
    .loop(() => {
      if (current !== null) {
        const result = processAfterIfContinuesOfNodeContext(current, column);
        current = current.parent;
        return result.thenReturn(true);
      } else {
        return task.newResult(false);
      }
    })
    .then(() => {
      frame.finish(true);
    });
  return frame.result();
};

export const calculatePseudoElementHeight = (
  nodeContext: vtree.NodeContext,
  column: layout.Column,
  pseudoElement: Element
): number => {
  const parentNode = nodeContext.viewNode as Element;
  parentNode.appendChild(pseudoElement);
  const height = layouthelper.getElementHeight(
    pseudoElement,
    column,
    nodeContext.vertical
  );
  parentNode.removeChild(pseudoElement);
  return height;
};
