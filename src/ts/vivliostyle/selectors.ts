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
import * as asserts from '../closure/goog/asserts/asserts';

import * as base from '../adapt/base';

import {CascadeValue, ElementStyle, matchANPlusB, mergeStyle, getStyleMap} from '../adapt/csscasc';
import {Context} from '../adapt/expr';
import {Column, getElementHeight} from '../adapt/layout';
import {FragmentLayoutConstraint} from '../adapt/layout';
import {Frame, newResult, Result} from '../adapt/task';
import * as task from '../adapt/task';
import {PseudoelementStyler} from '../adapt/vgen';
import * as vgen from '../adapt/vgen';
import {NodeContext} from '../adapt/vtree';
import {ChunkPosition} from '../adapt/vtree';
import {ShadowContext} from '../adapt/vtree';
import * as vtree from '../adapt/vtree';

import {PseudoColumn} from './layoututil';
import {ElementsOffset} from './repetitiveelements';

import * as namespace from './namespace';

export interface Matcher {
  matches(): boolean;
}

const fragmentIndices = {};

export class NthFragmentMatcher implements Matcher {
  constructor(
      public readonly elementOffset: number, public readonly a: number,
      public readonly b: number) {}

  /** @override */
  matches() {
    const entry = fragmentIndices[this.elementOffset];
    return entry != null && entry.fragmentIndex != null &&
        matchANPlusB(entry.fragmentIndex, this.a, this.b);
  }
}

export class AnyMatcher implements Matcher {
  constructor(public readonly matchers: Matcher[]) {}

  /** @override */
  matches() {
    return this.matchers.some((matcher) => matcher.matches());
  }
}

export class AllMatcher implements Matcher {
  constructor(public readonly matchers: Matcher[]) {}

  /** @override */
  matches() {
    return this.matchers.every((matcher) => matcher.matches());
  }
}

export class MatcherBuilder {
  buildViewConditionMatcher(elementOffset: number, viewCondition: string):
      Matcher {
    const strs = viewCondition.split('_');
    if (strs[0] == 'NFS') {
      return new NthFragmentMatcher(
          elementOffset, parseInt(strs[1], 10), parseInt(strs[2], 10));
    } else {
      asserts.fail(`unknown view condition. condition=${viewCondition}`);
      return null;
    }
  }

  buildAllMatcher(matchers: Matcher[]): Matcher {return new AllMatcher(matchers);}

  buildAnyMatcher(matchers: Matcher[]): Matcher {return new AnyMatcher(matchers);}
}

MatcherBuilder.instance = new MatcherBuilder();

export const mergeViewConditionalStyles =
    (cascMap: {[key: string]: CascadeValue}, context: Context,
     style: ElementStyle) => {
      forEachViewConditionalStyles(style, (viewConditionalStyles) => {
        mergeStyle(cascMap, viewConditionalStyles, context);
      });
    };

export const forEachViewConditionalStyles =
    (style: ElementStyle, callback: (p1: ElementStyle) => any) => {
      const viewConditionalStyles = getStyleMap(style, '_viewConditionalStyles');
      if (!viewConditionalStyles) {
        return;
      }
      viewConditionalStyles.forEach((entry) => {
        if (!entry.matcher.matches()) {
          return;
        }
        callback(entry.styles);
      });
    };

export const registerFragmentIndex =
    (elementOffset: number, fragmentIndex: number, priority: number) => {
      const indices = fragmentIndices;
      if (!indices[elementOffset] ||
          indices[elementOffset].priority <= priority) {
        indices[elementOffset] = {fragmentIndex, priority};
      }
    };

export const clearFragmentIndices = () => {
  fragmentIndices = {};
};

export class AfterIfContinues {
  constructor(
      public readonly sourceNode: Element,
      public readonly styler: PseudoelementStyler) {}

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
        vgen.pseudoelementDoc.createElementNS(base.NS.XHTML, 'div');
    vgen.setPseudoName(sourceNode, 'after-if-continues');
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
    return new vtree.ChunkPosition(nodePosition);
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
      nodeContext: NodeContext, afterIfContinues: AfterIfContinues,
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

  private affectTo(nodeContext: NodeContext): boolean {
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
