/**
 * Copyright 2017 Vivliostyle Inc.
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

goog.scope(function() {

    /** @const */ var PageFloat = vivliostyle.pagefloat.PageFloat;

    /**
     * @param {!adapt.vtree.NodePosition} nodePosition
     * @param {!vivliostyle.pagefloat.FloatReference} floatReference
     * @param {string} flowName
     * @constructor
     * @extends vivliostyle.pagefloat.PageFloat
     */
    vivliostyle.footnote.Footnote = function(nodePosition, floatReference, flowName) {
        PageFloat.call(this, nodePosition, floatReference, "block-end", flowName);
    };
    /** @const */ var Footnote = vivliostyle.footnote.Footnote;
    goog.inherits(Footnote, PageFloat);

    /**
     * @constructor
     * @implements {vivliostyle.pagefloat.PageFloatLayoutStrategy}
     */
    vivliostyle.pagefloat.FootnoteLayoutStrategy = function() {};
    /** @const */ var FootnoteLayoutStrategy = vivliostyle.pagefloat.FootnoteLayoutStrategy;

    /**
     * @override
     */
    FootnoteLayoutStrategy.prototype.appliesToNodeContext = function(nodeContext) {
        return nodeContext.floatSide === "footnote";
    };

    /**
     * @override
     */
    FootnoteLayoutStrategy.prototype.createPageFloat = function(
        nodeContext, pageFloatLayoutContext, column) {
        var floatReference = vivliostyle.pagefloat.FloatReference.REGION;
        // If the region context has the same container as the page context,
        // use the page context as the context for the footnote.
        var regionContext = pageFloatLayoutContext.getPageFloatLayoutContext(floatReference);
        var pageContext = pageFloatLayoutContext.getPageFloatLayoutContext(
            vivliostyle.pagefloat.FloatReference.PAGE);
        if (pageContext.hasSameContainerAs(regionContext)) {
            floatReference = vivliostyle.pagefloat.FloatReference.PAGE;
        }
        /** @const */ var nodePosition = nodeContext.toNodePosition();
        goog.asserts.assert(pageFloatLayoutContext.flowName);
        /** @type {!vivliostyle.pagefloat.PageFloat} */ var float =
            new vivliostyle.footnote.Footnote(nodePosition, floatReference,
                pageFloatLayoutContext.flowName);
        pageFloatLayoutContext.addPageFloat(float);
        return adapt.task.newResult(float);
    };

    vivliostyle.pagefloat.PageFloatLayoutStrategyResolver.register(new FootnoteLayoutStrategy());

});
