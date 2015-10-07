/**
 * Copyright 2015 Vivliostyle Inc.
 * @fileoverview CSS Page Floats
 */
goog.provide("vivliostyle.pagefloat");

goog.require("adapt.task");
goog.require("adapt.geom");
goog.require("adapt.vtree");

goog.scope(function() {
    /**
     * @param {adapt.vtree.NodeContext} nodeContext
     * @param {adapt.geom.Rect} outerRect
     * @constructor
     */
    vivliostyle.pagefloat.PageFloat = function(nodeContext, outerRect) {
        /** @const */ this.nodeContext = nodeContext.copy();
        /** @const */ this.outerRect = outerRect;
    };
    /** @const */ var PageFloat = vivliostyle.pagefloat.PageFloat;

    /**
     * @constructor
     */
    vivliostyle.pagefloat.FloatHolder = function() {
        /** @private @const @type {!Array.<vivliostyle.pagefloat.PageFloat>} */ this.floats = [];
        /** @private @const @type {!Array.<vivliostyle.pagefloat.PageFloat>} */ this.newlyAddedFloats = [];
    };
    /** @const */ var FloatHolder = vivliostyle.pagefloat.FloatHolder;

    /**
     * @param {!adapt.vtree.NodeContext} nodeContext
     * @param {!adapt.vtree.LayoutContext} layoutContext
     * @returns {?vivliostyle.pagefloat.PageFloat}
     */
    FloatHolder.prototype.getFloat = function(nodeContext, layoutContext) {
        var nodePosition = nodeContext.toNodePosition();
        for (var i = 0; i < this.floats.length; i++) {
            var pageFloat = this.floats[i];
            if (layoutContext.isSameNodePosition(nodePosition, pageFloat.nodeContext.toNodePosition())) {
                return pageFloat;
            }
        }
        return null;
    };

    /**
     * @param {!adapt.vtree.NodeContext} nodeContext
     * @param {!Element} element
     * @param {!adapt.geom.Rect} outerRect
     * @param {string} floatSide
     * @return {!adapt.task.Result.<vivliostyle.pagefloat.PageFloat>}
     */
    FloatHolder.prototype.tryToAddFloat = function(nodeContext, element, outerRect, floatSide) {
        /** @type {!adapt.task.Frame.<vivliostyle.pagefloat.PageFloat>} */ var frame
            = adapt.task.newFrame("tryToAddFloat");
        var pageFloat = new PageFloat(nodeContext, outerRect);
        this.floats.push(pageFloat);
        this.newlyAddedFloats.push(pageFloat);
        frame.finish(pageFloat);
        return frame.result();
    };

    /**
     * @returns {boolean}
     */
    FloatHolder.prototype.hasNewlyAddedFloats = function() {
        return this.newlyAddedFloats.length > 0;
    };

    FloatHolder.prototype.clearNewlyAddedFloats = function() {
        this.newlyAddedFloats.splice(0, this.newlyAddedFloats.length);
    };

    /**
     * @returns {!Array.<!adapt.geom.Shape>}
     */
    FloatHolder.prototype.getShapesOfNewlyAddedFloats = function() {
        return this.newlyAddedFloats.map(function(pageFloat) {
            return adapt.geom.shapeForRectObj(pageFloat.outerRect);
        });
    };
});
