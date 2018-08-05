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
goog.provide("vivliostyle.footnote");

goog.require("vivliostyle.pagefloat");

goog.scope(() => {

    /** @const */ const PageFloat = vivliostyle.pagefloat.PageFloat;
    /** @const */ const PageFloatFragment = vivliostyle.pagefloat.PageFloatFragment;

    /**
     * @param {!adapt.vtree.NodePosition} nodePosition
     * @param {!vivliostyle.pagefloat.FloatReference} floatReference
     * @param {string} flowName
     * @param {?adapt.css.Ident} footnotePolicy
     * @param {?adapt.css.Numeric} floatMinWrapBlock
     * @constructor
     * @extends vivliostyle.pagefloat.PageFloat
     */
    vivliostyle.footnote.Footnote = function(nodePosition, floatReference, flowName, footnotePolicy, floatMinWrapBlock) {
        PageFloat.call(this, nodePosition, floatReference, "block-end", null, flowName, floatMinWrapBlock);
        /** @const */ this.footnotePolicy = footnotePolicy;
    };
    /** @const */ const Footnote = vivliostyle.footnote.Footnote;
    goog.inherits(Footnote, PageFloat);

    /**
     * @override
     */
    Footnote.prototype.isAllowedToPrecede = other => !(other instanceof Footnote);

    /**
     * @param {!vivliostyle.pagefloat.FloatReference} floatReference
     * @param {!Array<!vivliostyle.pagefloat.PageFloatContinuation>} continuations
     * @param {!adapt.vtree.Container} area
     * @param {boolean} continues
     * @constructor
     * @extends PageFloatFragment
     */
    vivliostyle.footnote.FootnoteFragment = function(floatReference, continuations, area, continues) {
        PageFloatFragment.call(this, floatReference, "block-end", continuations, area, continues);
    };
    /** @const */ const FootnoteFragment = vivliostyle.footnote.FootnoteFragment;
    goog.inherits(FootnoteFragment, PageFloatFragment);

    /**
     * @override
     */
    FootnoteFragment.prototype.getOrder = () => Infinity;

    /**
     * @override
     */
    FootnoteFragment.prototype.shouldBeStashedBefore = function(float) {
        if (float instanceof Footnote) {
            return true;
        } else {
            return this.getOrder() < float.getOrder();
        }
    };

    /**
     * @param {!Footnote} footnote
     * @constructor
     * @implements {adapt.layout.LayoutConstraint}
     */
    vivliostyle.footnote.LineFootnotePolicyLayoutConstraint = function(footnote) {
        /** @const */ this.footnote = footnote;
    };
    /** @const */ const LineFootnotePolicyLayoutConstraint = vivliostyle.footnote.LineFootnotePolicyLayoutConstraint;

    LineFootnotePolicyLayoutConstraint.prototype.allowLayout = function(nodeContext) {
        const nodePosition = nodeContext.toNodePosition();
        return !adapt.vtree.isSameNodePosition(nodePosition, this.footnote.nodePosition);
    };

    /**
     * @constructor
     * @implements {vivliostyle.pagefloat.PageFloatLayoutStrategy}
     */
    vivliostyle.footnote.FootnoteLayoutStrategy = function() {};
    /** @const */ const FootnoteLayoutStrategy = vivliostyle.footnote.FootnoteLayoutStrategy;

    /**
     * @override
     */
    FootnoteLayoutStrategy.prototype.appliesToNodeContext = nodeContext => nodeContext.floatSide === "footnote";

    /**
     * @override
     */
    FootnoteLayoutStrategy.prototype.appliesToFloat = float => float instanceof Footnote;

    /**
     * @override
     */
    FootnoteLayoutStrategy.prototype.createPageFloat = (nodeContext, pageFloatLayoutContext, column) => {
        let floatReference = vivliostyle.pagefloat.FloatReference.REGION;
        // If the region context has the same container as the page context,
        // use the page context as the context for the footnote.
        const regionContext = pageFloatLayoutContext.getPageFloatLayoutContext(floatReference);
        const pageContext = pageFloatLayoutContext.getPageFloatLayoutContext(
            vivliostyle.pagefloat.FloatReference.PAGE);
        if (pageContext.hasSameContainerAs(regionContext)) {
            floatReference = vivliostyle.pagefloat.FloatReference.PAGE;
        }
        /** @const */ const nodePosition = nodeContext.toNodePosition();
        goog.asserts.assert(pageFloatLayoutContext.flowName);
        /** @type {!vivliostyle.pagefloat.PageFloat} */ const float =
            new vivliostyle.footnote.Footnote(nodePosition, floatReference,
                pageFloatLayoutContext.flowName, nodeContext.footnotePolicy,
                nodeContext.floatMinWrapBlock);
        pageFloatLayoutContext.addPageFloat(float);
        return adapt.task.newResult(float);
    };

    /**
     * @override
     */
    FootnoteLayoutStrategy.prototype.createPageFloatFragment = (continuations, floatSide, floatArea, continues) => {
        /** @const */ const f = continuations[0].float;
        return new FootnoteFragment(f.floatReference, continuations, floatArea, continues);
    };

    /**
     * @override
     */
    FootnoteLayoutStrategy.prototype.findPageFloatFragment = (float, pageFloatLayoutContext) => {
        const context = pageFloatLayoutContext.getPageFloatLayoutContext(float.floatReference);
        const fragments = context.floatFragments.filter(fr => fr instanceof FootnoteFragment);
        goog.asserts.assert(fragments.length <= 1);
        return fragments[0] || null;
    };


    /**
     * @override
     */
    FootnoteLayoutStrategy.prototype.adjustPageFloatArea = (floatArea, floatContainer, column) => {
        floatArea.isFootnote = true;
        floatArea.adjustContentRelativeSize = false;
        const element = floatArea.element;
        goog.asserts.assert(element);
        floatArea.vertical = column.layoutContext.applyFootnoteStyle(floatContainer.vertical,
            column.layoutContext.nodeContext && column.layoutContext.nodeContext.direction === "rtl",
            element);
        floatArea.convertPercentageSizesToPx(element);
        column.setComputedInsets(element, floatArea);
        column.setComputedWidthAndHeight(element, floatArea);
    };

    /**
     * @override
     */
    FootnoteLayoutStrategy.prototype.forbid = (float, pageFloatLayoutContext) => {
        const footnote = /** @type {!Footnote} */ (float);
        switch (footnote.footnotePolicy) {
            case adapt.css.ident.line:
                const constraint = new LineFootnotePolicyLayoutConstraint(footnote);
                pageFloatLayoutContext.addLayoutConstraint(constraint, footnote.floatReference);
                break;
        }
    };

    vivliostyle.pagefloat.PageFloatLayoutStrategyResolver.register(new FootnoteLayoutStrategy());

});
