/**
 * Copyright 2016 Vivliostyle Inc.
 * @fileoverview CSS Display Module
 */
goog.provide("vivliostyle.display");

goog.require("adapt.css");

goog.scope(function() {

    /**
     * 'Blockify' a display value.
     * cf. https://drafts.csswg.org/css-display/#transformations
     *     https://drafts.csswg.org/css2/visuren.html#dis-pos-flo
     * @param {!adapt.css.Ident} display
     * @returns {!adapt.css.Ident}
     */
    vivliostyle.display.blockify = function(display) {
        var displayStr = display.toString();
        var blockifiedStr;
        switch (displayStr) {
            case "inline-flex":
                blockifiedStr = "flex";
                break;
            case "inline-grid":
                blockifiedStr = "grid";
                break;
            case "inline-table":
                blockifiedStr = "table";
                break;
            case "inline":
            case "table-row-group":
            case "table-column":
            case "table-column-group":
            case "table-header-group":
            case "table-footer-group":
            case "table-row":
            case "table-cell":
            case "table-caption":
            case "inline-block":
                blockifiedStr = "block";
                break;
            default:
                blockifiedStr = displayStr;
        }
        return adapt.css.getName(blockifiedStr);
    };

    /**
     * Get computed values of display, position and float.
     * cf. https://drafts.csswg.org/css-display/#transformations
     *     https://drafts.csswg.org/css2/visuren.html#dis-pos-flo
     * @param {!adapt.css.Ident} display
     * @param {adapt.css.Ident} position
     * @param {adapt.css.Ident} float
     * @param {boolean} isRoot
     * @returns {{display: !adapt.css.Ident, position: adapt.css.Ident, float: adapt.css.Ident}}
     */
    vivliostyle.display.getComputedDislayValue = function(display, position, float, isRoot) {
        if (display === adapt.css.ident.none) {
        } else if (position === adapt.css.ident.absolute || position === adapt.css.ident.fixed) {
            float = adapt.css.ident.none;
            display = vivliostyle.display.blockify(display);
        } else if ((float && float !== adapt.css.ident.none) || isRoot) {
            display = vivliostyle.display.blockify(display);
        }
        return {
            display: display,
            position: position,
            float: float
        };
    };

    /**
     * Judges if the generated box is block.
     * @param {!adapt.css.Ident} display
     * @param {adapt.css.Ident} position
     * @param {adapt.css.Ident} float
     * @param {boolean} isRoot
     * @returns {boolean}
     */
    vivliostyle.display.isBlock = function(display, position, float, isRoot) {
        return vivliostyle.display.getComputedDislayValue(display, position, float, isRoot).display
            === adapt.css.ident.block;
    };
});
