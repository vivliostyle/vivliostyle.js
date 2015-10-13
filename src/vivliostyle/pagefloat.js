/**
 * Copyright 2015 Vivliostyle Inc.
 * @fileoverview CSS Page Floats
 */
goog.provide("vivliostyle.pagefloat");

goog.require("goog.asserts");
goog.require("adapt.base");
goog.require("adapt.task");
goog.require("adapt.geom");
goog.require("adapt.vtree");
goog.require("vivliostyle.logical");

goog.scope(function() {
    /**
     * Interpret a float value with the writing-mode and direction assuming the float-reference is inline and returns "left" or "right".
     * @param {string} floatSide
     * @param {boolean} vertical
     * @param {string} direction
     * @returns {string}
     */
    vivliostyle.pagefloat.resolveInlineFloatDirection = function(floatSide, vertical, direction) {
        var writingMode = vertical ? "vertical-rl" : "horizontal-tb";
        if (floatSide === "top" || floatSide === "bottom") {
            floatSide = vivliostyle.logical.toLogical(floatSide, writingMode, direction);
        }
        if (floatSide === "block-start") {
            floatSide = "inline-start";
        }
        if (floatSide === "block-end") {
            floatSide = "inline-end";
        }
        if (floatSide === "inline-start" || floatSide === "inline-end") {
            var physicalValue = vivliostyle.logical.toPhysical(floatSide, writingMode, direction);
            var lineRelativeValue = vivliostyle.logical.toLineRelative(physicalValue, writingMode);
            if (lineRelativeValue === "line-left") {
                floatSide = "left";
            } else if (lineRelativeValue === "line-right") {
                floatSide = "right";
            }
        }
        if (floatSide !== "left" && floatSide !== "right") {
            adapt.base.log("Invalid float value: " + floatSide + ". Fallback to left.");
            floatSide = "left";
        }
        return floatSide;
    };

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
     * @param {function():!HTMLElement} containerGetter
     * @param {!adapt.css.Val} writingMode
     * @param {!adapt.css.Val} direction
     * @constructor
     */
    vivliostyle.pagefloat.FloatHolder = function(containerGetter, writingMode, direction) {
        /** @private @const */ this.containerGetter = containerGetter;
        /** @private @const */ this.writingMode = writingMode;
        /** @private @const */ this.direction = direction;
        /** @private @const @type {!Array.<vivliostyle.pagefloat.PageFloat>} */ this.floats = [];
        /** @private @const @type {!Array.<vivliostyle.pagefloat.PageFloat>} */ this.newlyAddedFloats = [];
    };
    /** @const */ var FloatHolder = vivliostyle.pagefloat.FloatHolder;

    FloatHolder.prototype.prepareFloatElement = function(element, floatSide) {
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }

        adapt.base.setCSSProperty(element, "float", "none");
        adapt.base.setCSSProperty(element, "position", "absolute");

        var writingMode = this.writingMode.toString();
        var direction = this.direction.toString();
        var physicalFloatSide = vivliostyle.logical.toPhysical(floatSide, writingMode, direction);
        var logicalFloatSide = vivliostyle.logical.toLogical(floatSide, writingMode, direction);
        adapt.base.setCSSProperty(element, physicalFloatSide, "0");
        switch (logicalFloatSide) {
            case "inline-start":
            case "inline-end":
                // TODO Calculate and set correct block-dimension position
                var blockStartPhysical = vivliostyle.logical.toPhysical("block-start", writingMode, direction);
                adapt.base.setCSSProperty(element, blockStartPhysical, "0");
                break;
            case "block-start":
            case "block-end":
                var inlineStartPhysical = vivliostyle.logical.toPhysical("inline-start", writingMode, direction);
                adapt.base.setCSSProperty(element, inlineStartPhysical, "0");
                var physicalMaxInlineSize = vivliostyle.logical.toPhysical("max-inline-size", writingMode, direction);
                if (!adapt.base.getCSSProperty(element, physicalMaxInlineSize)) {
                    adapt.base.setCSSProperty(element, physicalMaxInlineSize, "100%");
                }
                break;
            default:
                throw new Error("unknown float direction: " + floatSide);
        }

        this.containerGetter().appendChild(element);
    };

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
