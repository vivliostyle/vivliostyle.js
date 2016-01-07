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

});
