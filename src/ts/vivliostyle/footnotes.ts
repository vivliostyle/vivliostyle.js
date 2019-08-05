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
import * as Asserts from "./asserts";
import * as Css from "../adapt/css";
import * as PageFloats from "./pagefloats";
import * as Task from "../adapt/task";
import * as Vtree from "../adapt/vtree";
import { Layout } from "./types";

const PageFloatFragment = PageFloats.PageFloatFragment;

export class Footnote extends PageFloats.PageFloat {
  constructor(
    nodePosition: Vtree.NodePosition,
    floatReference: PageFloats.FloatReference,
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
  isAllowedToPrecede(other: PageFloats.PageFloat): boolean {
    return !(other instanceof Footnote);
  }
}

/**
 * @extends PageFloatFragment
 */
export class FootnoteFragment extends PageFloatFragment {
  constructor(
    floatReference: PageFloats.FloatReference,
    continuations: PageFloats.PageFloatContinuation[],
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
  shouldBeStashedBefore(float: PageFloats.PageFloat): boolean {
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
  implements PageFloats.PageFloatLayoutStrategy {
  /**
   * @override
   */
  appliesToNodeContext(nodeContext: Vtree.NodeContext): boolean {
    return nodeContext.floatSide === "footnote";
  }

  /**
   * @override
   */
  appliesToFloat(float: PageFloats.PageFloat): boolean {
    return float instanceof Footnote;
  }

  /**
   * @override
   */
  createPageFloat(
    nodeContext: Vtree.NodeContext,
    pageFloatLayoutContext: PageFloats.PageFloatLayoutContext,
    column: Layout.Column
  ): Task.Result<PageFloats.PageFloat> {
    let floatReference = PageFloats.FloatReference.REGION;

    // If the region context has the same container as the page context,
    // use the page context as the context for the footnote.
    const regionContext = pageFloatLayoutContext.getPageFloatLayoutContext(
      floatReference
    );
    const pageContext = pageFloatLayoutContext.getPageFloatLayoutContext(
      PageFloats.FloatReference.PAGE
    );
    if (pageContext.hasSameContainerAs(regionContext)) {
      floatReference = PageFloats.FloatReference.PAGE;
    }
    const nodePosition = nodeContext.toNodePosition();
    Asserts.assert(pageFloatLayoutContext.flowName);
    const float: PageFloats.PageFloat = new Footnote(
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
    continuations: PageFloats.PageFloatContinuation[],
    floatSide: string,
    floatArea: Layout.PageFloatArea,
    continues: boolean
  ): PageFloats.PageFloatFragment {
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
    float: PageFloats.PageFloat,
    pageFloatLayoutContext: PageFloats.PageFloatLayoutContext
  ): PageFloats.PageFloatFragment | null {
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
    float: PageFloats.PageFloat,
    pageFloatLayoutContext: PageFloats.PageFloatLayoutContext
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

PageFloats.PageFloatLayoutStrategyResolver.register(
  new FootnoteLayoutStrategy()
);
