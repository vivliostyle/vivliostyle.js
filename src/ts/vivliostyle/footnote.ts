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
import {Ident} from '../adapt/css';
import {Numeric} from '../adapt/css';
import {LayoutConstraint} from '../adapt/layout';
import {NodePosition} from '../adapt/vtree';
import {Container} from '../adapt/vtree';

import * as pagefloat from './pagefloat';

const PageFloat = pagefloat.PageFloat;
const PageFloatFragment = pagefloat.PageFloatFragment;

/**
 * @extends vivliostyle.pagefloat.PageFloat
 */
export class Footnote extends vivliostyle.pagefloat.PageFloat {
  constructor(
      nodePosition: NodePosition, floatReference: pagefloat.FloatReference,
      flowName: string, public readonly footnotePolicy: Ident|null,
      floatMinWrapBlock: Numeric|null) {
    PageFloat.call(
        this, nodePosition, floatReference, 'block-end', null, flowName,
        floatMinWrapBlock);
  }

  /**
   * @override
   */
  isAllowedToPrecede(other)!(other instanceof Footnote)
}
const Footnote = Footnote;
goog.inherits(Footnote, PageFloat);

/**
 * @extends PageFloatFragment
 */
export class FootnoteFragment extends PageFloatFragment {
  constructor(
      floatReference: pagefloat.FloatReference,
      continuations: pagefloat.PageFloatContinuation[], area: Container,
      continues: boolean) {
    super(floatReference, 'block-end', continuations, area, continues);
  }

  /**
   * @override
   */
  getOrder() Infinity

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
const FootnoteFragment = FootnoteFragment;

export class LineFootnotePolicyLayoutConstraint implements LayoutConstraint {
  constructor(public readonly footnote: Footnote) {}

  allowLayout(nodeContext) {
    const nodePosition = nodeContext.toNodePosition();
    return !adapt.vtree.isSameNodePosition(
        nodePosition, this.footnote.nodePosition);
  }
}
const LineFootnotePolicyLayoutConstraint = LineFootnotePolicyLayoutConstraint;

export class FootnoteLayoutStrategy implements
    pagefloat.PageFloatLayoutStrategy {
  /**
   * @override
   */
  appliesToNodeContext(nodeContext) nodeContext.floatSide === 'footnote'

  /**
   * @override
   */
  appliesToFloat(float) float instanceof Footnote

  /**
   * @override
   */
  createPageFloat(nodeContext, pageFloatLayoutContext, column) {
    let floatReference = pagefloat.FloatReference.REGION;

    // If the region context has the same container as the page context,
    // use the page context as the context for the footnote.
    const regionContext =
        pageFloatLayoutContext.getPageFloatLayoutContext(floatReference);
    const pageContext = pageFloatLayoutContext.getPageFloatLayoutContext(
        pagefloat.FloatReference.PAGE);
    if (pageContext.hasSameContainerAs(regionContext)) {
      floatReference = pagefloat.FloatReference.PAGE;
    }
    const nodePosition = nodeContext.toNodePosition();
    goog.asserts.assert(pageFloatLayoutContext.flowName);
    const float: pagefloat.PageFloat = new Footnote(
        nodePosition, floatReference, pageFloatLayoutContext.flowName,
        nodeContext.footnotePolicy, nodeContext.floatMinWrapBlock);
    pageFloatLayoutContext.addPageFloat(float);
    return adapt.task.newResult(float);
  }

  /**
   * @override
   */
  createPageFloatFragment(continuations, floatSide, floatArea, continues) {
    const f = continuations[0].float;
    return new FootnoteFragment(
        f.floatReference, continuations, floatArea, continues);
  }

  /**
   * @override
   */
  findPageFloatFragment(float, pageFloatLayoutContext) {
    const context =
        pageFloatLayoutContext.getPageFloatLayoutContext(float.floatReference);
    const fragments =
        context.floatFragments.filter((fr) => fr instanceof FootnoteFragment);
    goog.asserts.assert(fragments.length <= 1);
    return fragments[0] || null;
  }

  /**
   * @override
   */
  adjustPageFloatArea(floatArea, floatContainer, column) {
    floatArea.isFootnote = true;
    floatArea.adjustContentRelativeSize = false;
    const element = floatArea.element;
    goog.asserts.assert(element);
    floatArea.vertical = column.layoutContext.applyFootnoteStyle(
        floatContainer.vertical,
        column.layoutContext.nodeContext &&
            column.layoutContext.nodeContext.direction === 'rtl',
        element);
    floatArea.convertPercentageSizesToPx(element);
    column.setComputedInsets(element, floatArea);
    column.setComputedWidthAndHeight(element, floatArea);
  }

  /**
   * @override
   */
  forbid(float, pageFloatLayoutContext) {
    const footnote = (float as Footnote);
    switch (footnote.footnotePolicy) {
      case adapt.css.ident.line:
        const constraint = new LineFootnotePolicyLayoutConstraint(footnote);
        pageFloatLayoutContext.addLayoutConstraint(
            constraint, footnote.floatReference);
        break;
    }
  }
}
const FootnoteLayoutStrategy = FootnoteLayoutStrategy;
pagefloat.PageFloatLayoutStrategyResolver.register(
    new FootnoteLayoutStrategy());
