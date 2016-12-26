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
});
