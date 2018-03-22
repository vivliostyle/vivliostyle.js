/**
 * Copyright 2016 Trim-marks Inc.
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
        } else {
            var firstIsForcedBreakValue = vivliostyle.break.isForcedBreakValue(first);
            var secondIsForcedBreakValue = vivliostyle.break.isForcedBreakValue(second);
            if (firstIsForcedBreakValue && secondIsForcedBreakValue) {
                switch (second) {
                    case "column":
                        // "column" is the weakest value
                        return first;
                    case "region":
                        // "region" is stronger than "column" but weaker than page values
                        return first === "column" ? second : first;
                    default:
                        // page values are strongest
                        return second;
                }
            } else if (secondIsForcedBreakValue) {
                return second;
            } else if (firstIsForcedBreakValue) {
                return first;
            } else if (vivliostyle.break.isAvoidBreakValue(second)) {
                return second;
            } else if (vivliostyle.break.isAvoidBreakValue(first)) {
                return first;
            } else {
                return second;
            }
        }
    };

    /**
     * @param {?string} breakValue
     * @returns {string}
     */
    vivliostyle.break.breakValueToStartSideValue = function(breakValue) {
        switch (breakValue) {
            case "left":
            case "right":
            case "recto":
            case "verso":
                return breakValue;
            default:
                return "any";
        }
    };

    /**
     * @param {string} startSideValue
     * @returns {?string}
     */
    vivliostyle.break.startSideValueToBreakValue = function(startSideValue) {
        switch (startSideValue) {
            case "left":
            case "right":
            case "recto":
            case "verso":
                return startSideValue;
            default:
                return null;
        }
    };

});
