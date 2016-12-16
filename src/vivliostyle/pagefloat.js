/**
 * Copyright 2015 Vivliostyle Inc.
 * @fileoverview CSS Page Floats
 */
goog.provide("vivliostyle.pagefloat");

goog.require("goog.asserts");
goog.require("vivliostyle.logging");
goog.require("adapt.base");
goog.require("adapt.task");
goog.require("adapt.geom");
goog.require("adapt.vtree");
goog.require("vivliostyle.logical");

goog.scope(function() {
    /**
     * @enum {string}
     */
    vivliostyle.pagefloat.FloatReference = {
        INLINE: "inline",
        COLUMN: "column",
        REGION: "region",
        PAGE: "page"
    };
    /** @const */ var FloatReference = vivliostyle.pagefloat.FloatReference;

    /**
     * @const {!Array<!vivliostyle.pagefloat.FloatReference>}
     */
    FloatReference.values = [
        FloatReference.INLINE,
        FloatReference.COLUMN,
        FloatReference.REGION,
        FloatReference.PAGE
    ];

    /**
     * @param {string} str
     * @returns {!vivliostyle.pagefloat.FloatReference}
     */
    FloatReference.of = function(str) {
        switch (str) {
            case "inline":
                return FloatReference.INLINE;
            case "column":
                return FloatReference.COLUMN;
            case "region":
                return FloatReference.REGION;
            case "page":
                return FloatReference.PAGE;
            default:
                throw new Error("Unknown float-reference: " + str);
        }
    };

    /**
     * @param {!vivliostyle.pagefloat.FloatReference} floatReference
     * @returns {boolean}
     */
    vivliostyle.pagefloat.isPageFloat = function(floatReference) {
        switch (floatReference) {
            case FloatReference.INLINE:
                return false;
            case FloatReference.COLUMN:
            case FloatReference.REGION:
            case FloatReference.PAGE:
                return true;
            default:
                throw new Error("Unknown float-reference: " + floatReference);
        }
    };

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
            vivliostyle.logging.logger.warn("Invalid float value: " + floatSide + ". Fallback to left.");
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
     * @param {!adapt.css.Val} writingMode
     * @param {!adapt.css.Val} direction
     * @constructor
     */
    vivliostyle.pagefloat.FloatHolder = function(writingMode, direction) {
        /** @private @const */ this.writingMode = writingMode;
        /** @private @const */ this.direction = direction;
        /** @private @const {!Object.<vivliostyle.pagefloat.FloatReference, !Array.<vivliostyle.pagefloat.PageFloat>>} */
        this.floats = this.createEmptyFloatStore();
        /** @private @const {!Object.<vivliostyle.pagefloat.FloatReference, !Array.<vivliostyle.pagefloat.PageFloat>>} */
        this.newlyAddedFloats = this.createEmptyFloatStore();
        /** @type {adapt.vtree.Page} */ this.currentPage = null;
        /** @type {adapt.vtree.Container} */ this.currentRegion = null;
        /** @type {adapt.layout.Column} */ this.currentColumn = null;
    };
    /** @const */ var FloatHolder = vivliostyle.pagefloat.FloatHolder;

    /**
     * @private
     * @returns {!Object.<vivliostyle.pagefloat.FloatReference, !Array.<vivliostyle.pagefloat.PageFloat>>}
     */
    FloatHolder.prototype.createEmptyFloatStore = function() {
        var store = {};
        FloatReference.values.forEach(function(ref) {
            store[ref] = [];
        });
        return store;
    };

    /**
     * @param {!adapt.vtree.Page} page
     */
    FloatHolder.prototype.setCurrentPage = function(page) {
        this.currentPage = page;
    };

    /**
     * @param {!adapt.vtree.Container} region
     */
    FloatHolder.prototype.setCurrentRegion = function(region) {
        this.currentRegion = region;
    };

    /**
     * @param {!adapt.layout.Column} column
     */
    FloatHolder.prototype.setCurrentColumn = function(column) {
        this.currentColumn = column;
    };

    /**
     * @param {!vivliostyle.pagefloat.FloatReference} reference
     * @returns {Element}
     */
    FloatHolder.prototype.getContainerElement = function(reference) {
        switch (reference) {
            case FloatReference.PAGE:
                return this.currentPage.getPageAreaElement();
            case FloatReference.REGION:
                return this.currentRegion.element;
            case FloatReference.COLUMN:
                return this.currentColumn.element;
            default:
                throw new Error("No container available for float-reference: " + reference);
        }
    };

    /**
     * @param {!Element} element
     * @param {string} floatSide
     * @param {!vivliostyle.pagefloat.FloatReference} reference
     */
    FloatHolder.prototype.prepareFloatElement = function(element, floatSide, reference) {
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

        this.getContainerElement(reference).appendChild(element);
    };

    /**
     * @param {!adapt.vtree.NodeContext} nodeContext
     * @param {!adapt.vtree.LayoutContext} layoutContext
     * @returns {?vivliostyle.pagefloat.PageFloat}
     */
    FloatHolder.prototype.getFloat = function(nodeContext, floatReference, layoutContext) {
        var nodePosition = nodeContext.toNodePosition();
        var floats = this.floats[floatReference];
        for (var i = 0; i < floats.length; i++) {
            var pageFloat = floats[i];
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
     * @param {!vivliostyle.pagefloat.FloatReference} floatReference
     * @return {!adapt.task.Result.<vivliostyle.pagefloat.PageFloat>}
     */
    FloatHolder.prototype.tryToAddFloat = function(nodeContext, element, outerRect, floatSide, floatReference) {
        /** @type {!adapt.task.Frame.<vivliostyle.pagefloat.PageFloat>} */ var frame
            = adapt.task.newFrame("tryToAddFloat");
        var pageFloat = new PageFloat(nodeContext, outerRect);
        this.floats[floatReference].push(pageFloat);
        this.newlyAddedFloats[floatReference].push(pageFloat);
        frame.finish(pageFloat);
        return frame.result();
    };

    /**
     * @param {!vivliostyle.pagefloat.FloatReference=} floatReference
     * @returns {boolean}
     */
    FloatHolder.prototype.hasNewlyAddedFloats = function(floatReference) {
        var refs = floatReference ? [floatReference] : FloatReference.values;
        return refs.some(function(ref) {
            return this.newlyAddedFloats[ref].length > 0;
        }, this);
    };

    /**
     * @param {!vivliostyle.pagefloat.FloatReference=} floatReference
     */
    FloatHolder.prototype.clearNewlyAddedFloats = function(floatReference) {
        var refs = floatReference ? [floatReference] : FloatReference.values;
        refs.forEach(function(ref) {
            var arr = this.newlyAddedFloats[ref];
            arr.splice(0, arr.length);
        }, this);
    };

    /**
     * @param {!vivliostyle.pagefloat.FloatReference=} floatReference
     * @returns {!Array.<!adapt.geom.Shape>}
     */
    FloatHolder.prototype.getShapesOfNewlyAddedFloats = function(floatReference) {
        var refs = floatReference ? [floatReference] : FloatReference.values;
        return refs.reduce(function(result, ref) {
            var shapes = this.newlyAddedFloats[ref].map(function(pageFloat) {
                return adapt.geom.shapeForRectObj(pageFloat.outerRect);
            });
            return result.concat(shapes);
        }.bind(this), []);
    };
});
