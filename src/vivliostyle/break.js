/**
 * Copyright 2016 Vivliostyle Inc.
 * @fileoverview Control fragmentation
 */
goog.provide("vivliostyle.break");

goog.require("vivliostyle.plugin");
goog.require("adapt.css");

goog.scope(function() {

    /**
     * Convert old page-break-* properties to break-* properties with appropriate values
     * as specified by CSS Fragmentation module: https://drafts.csswg.org/css-break/#page-break-properties
     * @private
     * @param {!{name: string, value: !adapt.css.Val, important: boolean}} original
     * @returns {!{name: string, value: !adapt.css.Val, important: boolean}}
     */
    vivliostyle.break.convertPageBreakAliases = function(original)  {
        var name = original["name"];
        var value = original["value"];
        switch (name) {
            case "page-break-before":
            case "page-break-after":
            case "page-break-inside":
                return {
                    "name": name.replace(/^page-/, ""),
                    "value": value === adapt.css.ident.always ? adapt.css.ident.page : value,
                    "important": original["important"]
                };
            default:
                return original;
        }
    };
    vivliostyle.plugin.registerHook("SIMPLE_PROPERTY", vivliostyle.break.convertPageBreakAliases);

    /**
     * @private
     * @const {Object<?string, ?boolean>}
     */
    vivliostyle.break.forcedBreakValues = {
        "page": true,
        "left": true,
        "right": true,
        "recto": true,
        "verso": true,
        "column": true,
        "region": true
    };

    /**
     * Returns if the value is one of the forced break values.
     * @param {?string} value The break value to be judged. Treats null as 'auto'.
     * @returns {boolean}
     */
    vivliostyle.break.isForcedBreakValue = function(value) {
        return !!vivliostyle.break.forcedBreakValues[value];
    };

    /**
     * @private
     * @const {Object<?string, ?boolean>}
     */
    vivliostyle.break.avoidBreakValues = {
        "avoid": true,
        "avoid-page": true,
        "avoid-column": true,
        "avoid-region": true
    };

    /**
     * Returns if the value is one of the avoid break values.
     * @param {?string} value The break value to be judged. Treats null as 'auto'.
     * @returns {boolean}
     */
    vivliostyle.break.isAvoidBreakValue = function(value) {
        return !!vivliostyle.break.avoidBreakValues[value];
    };

    /**
     * Resolves the effective break value given two break values at a single break point.
     * The order of the arguments are relevant, since a value specified on the latter element takes precedence over one on the former.
     * A forced break value is chosen if present. Otherwise, an avoid break value is chosen if present.
     * See CSS Fragmentation Module for the rule:
     *  https://drafts.csswg.org/css-break/#forced-breaks
     *  https://drafts.csswg.org/css-break/#unforced-breaks
     * Note that though the spec requires to honor multiple break values at a single break point, the current implementation choose one of them and discard the others.
     * @param {?string} first The break value specified on the former element. null means 'auto' (not specified)
     * @param {?string} second The break value specified on the latter element. null means 'auto' (not specified)
     * @returns {?string}
     */
    vivliostyle.break.resolveEffectiveBreakValue = function(first, second) {
        if (!first) {
            return second;
        } else if (!second) {
            return first;
        } else if (vivliostyle.break.isForcedBreakValue(second)) {
            return second;
        } else if (vivliostyle.break.isForcedBreakValue(first)) {
            return first;
        } else if (vivliostyle.break.isAvoidBreakValue(second)) {
            return second;
        } else if (vivliostyle.break.isAvoidBreakValue(first)) {
            return first;
        } else {
            return second;
        }
    };

});
