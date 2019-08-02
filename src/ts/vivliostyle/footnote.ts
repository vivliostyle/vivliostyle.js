/**
 * Copyright 2017 Trim-marks Inc.
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
 * @fileoverview Footnotes
 */
import * as Css from "../adapt/css";
import * as Task from "../adapt/task";
import * as Vtree from "../adapt/vtree";
import * as Asserts from "./asserts";
import * as PageFloat from "./pagefloat";
import { Layout } from "./types";

const PageFloatFragment = PageFloat.PageFloatFragment;

export class Footnote extends PageFloat.PageFloat {
  constructor(
    nodePosition: Vtree.NodePosition,
    floatReference: PageFloat.FloatReference,
    flowName: string,
    public readonly footnotePolicy: Css.Ident | null,
    floatMinWrapBlock: Css.Numeric | null
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
  isAllowedToPrecede(other: PageFloat.PageFloat): boolean {
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
    area: Vtree.Container,
    continues: boolean
  ) {
    super(floatReference, "block-end", continuations, area, continues);
  }

  /**
   * @override
   */
  getOrder(): number {
    return Infinity;
  }

  /**
   * @override
   */
  shouldBeStashedBefore(float: PageFloat.PageFloat): boolean {
    if (float instanceof Footnote) {
      return true;
    } else {
      return this.getOrder() < float.getOrder();
    }
  }
}

export class LineFootnotePolicyLayoutConstraint
  implements Layout.LayoutConstraint {
  constructor(public readonly footnote: Footnote) {}

  allowLayout(nodeContext: Vtree.NodeContext): boolean {
    const nodePosition = nodeContext.toNodePosition();
    return !Vtree.isSameNodePosition(nodePosition, this.footnote.nodePosition);
  }
}

export class FootnoteLayoutStrategy
  implements PageFloat.PageFloatLayoutStrategy {
  /**
   * @override
   */
  appliesToNodeContext(nodeContext: Vtree.NodeContext): boolean {
    return nodeContext.floatSide === "footnote";
  }

  /**
   * @override
   */
  appliesToFloat(float: PageFloat.PageFloat): boolean {
    return float instanceof Footnote;
  }

  /**
   * @override
   */
  createPageFloat(
    nodeContext: Vtree.NodeContext,
    pageFloatLayoutContext: PageFloat.PageFloatLayoutContext,
    column: Layout.Column
  ): Task.Result<PageFloat.PageFloat> {
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
    return Task.newResult(float);
  }

  /**
   * @override
   */
  createPageFloatFragment(
    continuations: PageFloat.PageFloatContinuation[],
    floatSide: string,
    floatArea: Layout.PageFloatArea,
    continues: boolean
  ): PageFloat.PageFloatFragment {
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
  findPageFloatFragment(
    float: PageFloat.PageFloat,
    pageFloatLayoutContext: PageFloat.PageFloatLayoutContext
  ): PageFloat.PageFloatFragment | null {
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
  adjustPageFloatArea(
    floatArea: Layout.PageFloatArea,
    floatContainer: Vtree.Container,
    column: Layout.Column
  ) {
    floatArea.isFootnote = true;
    floatArea.adjustContentRelativeSize = false;
    const element = floatArea.element;
    Asserts.assert(element);
    floatArea.vertical = column.layoutContext.applyFootnoteStyle(
      floatContainer.vertical,
      (column.layoutContext as any).nodeContext &&
        (column.layoutContext as any).nodeContext.direction === "rtl",
      element
    );
    floatArea.convertPercentageSizesToPx(element);
    column.setComputedInsets(element, floatArea);
    column.setComputedWidthAndHeight(element, floatArea);
  }

  /**
   * @override
   */
  forbid(
    float: PageFloat.PageFloat,
    pageFloatLayoutContext: PageFloat.PageFloatLayoutContext
  ) {
    const footnote = float as Footnote;
    switch (footnote.footnotePolicy) {
      case Css.ident.line: {
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
