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
import {selector} from './types';

import * as base from '../adapt/base';
import {Column, getElementHeight, FragmentLayoutConstraint} from '../adapt/layout';
import * as pseudoElement from '../adapt/pseudoelement';
import {Frame, newResult, Result} from '../adapt/task';
import * as task from '../adapt/task';
import {NodeContext, ChunkPosition, ShadowContext} from '../adapt/vtree';
import * as vtree from '../adapt/vtree';
import * as asserts from './asserts';
import {PseudoColumn} from './layoututil';
import {NthFragmentMatcher} from './matcher';
import {ElementsOffset} from './repetitiveelements';

export const registerFragmentIndex = NthFragmentMatcher.registerFragmentIndex;

export const clearFragmentIndices = NthFragmentMatcher.clearFragmentIndices;

export class AfterIfContinues implements selector.AfterIfContinues {
  constructor(
      public readonly sourceNode: Element,
      public readonly styler: pseudoElement.PseudoelementStyler) {}

  createElement(column: Column, parentNodeContext: NodeContext):
      Result<Element> {
    const doc = parentNodeContext.viewNode.ownerDocument;
    const viewRoot = doc.createElement('div');
    const pseudoColumn = new PseudoColumn(column, viewRoot, parentNodeContext);
    const initialPageBreakType = pseudoColumn.getColumn().pageBreakType;
    pseudoColumn.getColumn().pageBreakType = null;
    return pseudoColumn.layout(this.createNodePositionForPseudoElement(), true)
        .thenAsync(() => {
          this.styler.contentProcessed['after-if-continues'] = false;
          pseudoColumn.getColumn().pageBreakType = initialPageBreakType;
          const pseudoElement = (viewRoot.firstChild as Element);
          base.setCSSProperty(pseudoElement, 'display', 'block');
          return newResult(pseudoElement);
        });
  }

  private createNodePositionForPseudoElement(): ChunkPosition {
    const sourceNode =
        pseudoElement.document.createElementNS(base.NS.XHTML, 'div');
    pseudoElement.setPseudoName(sourceNode, 'after-if-continues');
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
    return new vtree.ChunkPosition(nodePosition as any);
  }

  private createShadowContext(root: Element): ShadowContext {
    return new vtree.ShadowContext(
        this.sourceNode, root, null, null, null, vtree.ShadowType.ROOTED,
        this.styler);
  }
}

export class AfterIfContinuesLayoutConstraint implements
    FragmentLayoutConstraint {
  nodeContext: any;
  afterIfContinues: any;
  pseudoElementHeight: any;

  constructor(
      nodeContext: NodeContext, afterIfContinues: selector.AfterIfContinues,
      pseudoElementHeight: number) {
    this.nodeContext = nodeContext;
    this.afterIfContinues = afterIfContinues;
    this.pseudoElementHeight = pseudoElementHeight;
  }

  /** @override */
  allowLayout(nodeContext, overflownNodeContext, column) {
    if (overflownNodeContext && !nodeContext ||
        nodeContext && nodeContext.overflow) {
      return false;
    } else {
      return true;
    }
  }

  /** @override */
  nextCandidate(nodeContext) {return false;}

  /** @override */
  postLayout(allowed, nodeContext, initialPosition, column) {}

  /** @override */
  finishBreak(nodeContext, column) {
    if (!this.getRepetitiveElements().affectTo(nodeContext)) {
      return task.newResult(true);
    }
    return this.afterIfContinues.createElement(column, this.nodeContext)
        .thenAsync((element) => {
          this.nodeContext.viewNode.appendChild(element);
          return task.newResult(true);
        });
  }

  getRepetitiveElements() {
    return new AfterIfContinuesElementsOffset(
        this.nodeContext, this.pseudoElementHeight);
  }

  /** @override */
  equalsTo(constraint) {
    if (!(constraint instanceof AfterIfContinuesLayoutConstraint)) {
      return false;
    }
    return this.afterIfContinues ==
        (constraint as AfterIfContinuesLayoutConstraint).afterIfContinues;
  }

  /** @override */
  getPriorityOfFinishBreak() {return 9;}
}

export class AfterIfContinuesElementsOffset implements ElementsOffset {
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

  affectTo(nodeContext: NodeContext): boolean {
    if (!nodeContext) {
      return false;
    }
    const sourceNode = nodeContext.shadowContext ?
        nodeContext.shadowContext.owner :
        nodeContext.sourceNode;
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
    nodeContext: NodeContext, column: Column): Result<NodeContext> {
  if (!nodeContext || !nodeContext.afterIfContinues || nodeContext.after ||
      column.isFloatNodeContext(nodeContext)) {
    return task.newResult(nodeContext);
  }
  const afterIfContinues = nodeContext.afterIfContinues;
  return afterIfContinues.createElement(column, nodeContext)
      .thenAsync((pseudoElement) => {
        asserts.assert(nodeContext !== null);
        const pseudoElementHeight =
            calculatePseudoElementHeight(nodeContext, column, pseudoElement);
        column.fragmentLayoutConstraints.push(
            new AfterIfContinuesLayoutConstraint(
                nodeContext, afterIfContinues, pseudoElementHeight));
        return task.newResult(nodeContext);
      });
}

export const processAfterIfContinues =
    (result: Result<NodeContext>, column: Column): Result<NodeContext> =>
        result.thenAsync(
            (nodeContext) =>
                processAfterIfContinuesOfNodeContext(nodeContext, column));

export const processAfterIfContinuesOfAncestors =
    (nodeContext: NodeContext, column: Column): Result<boolean> => {
      const frame: Frame<boolean> = task.newFrame(
          'vivliostyle.selectors.processAfterIfContinuesOfAncestors');
      let current: NodeContext = nodeContext;
      frame
          .loop(() => {
            if (current !== null) {
              const result =
                  processAfterIfContinuesOfNodeContext(current, column);
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

export const calculatePseudoElementHeight =
    (nodeContext: NodeContext, column: Column, pseudoElement: Element):
        number => {
          const parentNode = (nodeContext.viewNode as Element);
          parentNode.appendChild(pseudoElement);
          const height = getElementHeight(
              pseudoElement, column, nodeContext.vertical);
          parentNode.removeChild(pseudoElement);
          return height;
        };
