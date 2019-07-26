/**
 * Copyright 2017 Trim-marks Inc.
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
 * @fileoverview Footnotes
 */
import * as PageFloat from "./pagefloat";

import { Ident, ident, Numeric } from "../adapt/css";
import { LayoutConstraint } from "../adapt/layout";
import { NodePosition, isSameNodePosition, Container } from "../adapt/vtree";
import { newResult } from "../adapt/task";
import * as Asserts from "./asserts";

const PageFloatFragment = PageFloat.PageFloatFragment;

export class Footnote extends PageFloat.PageFloat {
  constructor(
    nodePosition: NodePosition,
    floatReference: PageFloat.FloatReference,
    flowName: string,
    public readonly footnotePolicy: Ident | null,
    floatMinWrapBlock: Numeric | null
  ) {
    super(
      nodePosition,
      floatReference,
      "block-end",
      null,
      flowName,
      floatMinWrapBlock
    );
  }

  /**
   * @override
   */
  isAllowedToPrecede(other) {
    return !(other instanceof Footnote);
  }
}

/**
 * @extends PageFloatFragment
 */
export class FootnoteFragment extends PageFloatFragment {
  constructor(
    floatReference: PageFloat.FloatReference,
    continuations: PageFloat.PageFloatContinuation[],
    area: Container,
    continues: boolean
  ) {
    super(floatReference, "block-end", continuations, area, continues);
  }

  /**
   * @override
   */
  getOrder() {
    return Infinity;
  }

  /**
   * @override
   */
  shouldBeStashedBefore(float) {
    if (float instanceof Footnote) {
      return true;
    } else {
      return this.getOrder() < float.getOrder();
    }
  }
}

export class LineFootnotePolicyLayoutConstraint implements LayoutConstraint {
  constructor(public readonly footnote: Footnote) {}

  allowLayout(nodeContext) {
    const nodePosition = nodeContext.toNodePosition();
    return !isSameNodePosition(nodePosition, this.footnote.nodePosition);
  }
}

export class FootnoteLayoutStrategy
  implements PageFloat.PageFloatLayoutStrategy {
  /**
   * @override
   */
  appliesToNodeContext(nodeContext) {
    return nodeContext.floatSide === "footnote";
  }

  /**
   * @override
   */
  appliesToFloat(float) {
    return float instanceof Footnote;
  }

  /**
   * @override
   */
  createPageFloat(nodeContext, pageFloatLayoutContext, column) {
    let floatReference = PageFloat.FloatReference.REGION;

    // If the region context has the same container as the page context,
    // use the page context as the context for the footnote.
    const regionContext = pageFloatLayoutContext.getPageFloatLayoutContext(
      floatReference
    );
    const pageContext = pageFloatLayoutContext.getPageFloatLayoutContext(
      PageFloat.FloatReference.PAGE
    );
    if (pageContext.hasSameContainerAs(regionContext)) {
      floatReference = PageFloat.FloatReference.PAGE;
    }
    const nodePosition = nodeContext.toNodePosition();
    Asserts.assert(pageFloatLayoutContext.flowName);
    const float: PageFloat.PageFloat = new Footnote(
      nodePosition,
      floatReference,
      pageFloatLayoutContext.flowName,
      nodeContext.footnotePolicy,
      nodeContext.floatMinWrapBlock
    );
    pageFloatLayoutContext.addPageFloat(float);
    return newResult(float);
  }

  /**
   * @override
   */
  createPageFloatFragment(continuations, floatSide, floatArea, continues) {
    const f = continuations[0].float;
    return new FootnoteFragment(
      f.floatReference,
      continuations,
      floatArea,
      continues
    );
  }

  /**
   * @override
   */
  findPageFloatFragment(float, pageFloatLayoutContext) {
    const context = pageFloatLayoutContext.getPageFloatLayoutContext(
      float.floatReference
    );
    const fragments = context.floatFragments.filter(
      fr => fr instanceof FootnoteFragment
    );
    Asserts.assert(fragments.length <= 1);
    return fragments[0] || null;
  }

  /**
   * @override
   */
  adjustPageFloatArea(floatArea, floatContainer, column) {
    floatArea.isFootnote = true;
    floatArea.adjustContentRelativeSize = false;
    const element = floatArea.element;
    Asserts.assert(element);
    floatArea.vertical = column.layoutContext.applyFootnoteStyle(
      floatContainer.vertical,
      column.layoutContext.nodeContext &&
        column.layoutContext.nodeContext.direction === "rtl",
      element
    );
    floatArea.convertPercentageSizesToPx(element);
    column.setComputedInsets(element, floatArea);
    column.setComputedWidthAndHeight(element, floatArea);
  }

  /**
   * @override
   */
  forbid(float, pageFloatLayoutContext) {
    const footnote = float as Footnote;
    switch (footnote.footnotePolicy) {
      case ident.line: {
        const constraint = new LineFootnotePolicyLayoutConstraint(footnote);
        pageFloatLayoutContext.addLayoutConstraint(
          constraint,
          footnote.floatReference
        );
        break;
      }
    }
  }
}

PageFloat.PageFloatLayoutStrategyResolver.register(
  new FootnoteLayoutStrategy()
);
