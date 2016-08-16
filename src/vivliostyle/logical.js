/**
 * Copyright 2015 Vivliostyle Inc.
 * @fileoverview CSS Logical Properties
 */
goog.provide("vivliostyle.logical");

goog.scope(function() {
    /**
     * @typedef {{regexp: !RegExp, to: string}}
     */
    var ConversionMap;

    /**
     * @param {!Object.<string, !Object.<string, !Array.<!{logical: string, physical: string}>>>} valueMaps
     * @param {boolean} toPhysical
     * @returns {!Object.<string, !Object.<string, !Array.<!ConversionMap>>>}
     */
    function createRegExpMap(valueMaps, toPhysical) {
        var map = {};
        Object.keys(/** @type {!Object} */ (valueMaps)).forEach(function(writingMode) {
            var dest = map[writingMode] = {};
            var src = valueMaps[writingMode];
            Object.keys(/** @type {!Object} */ (src)).forEach(function(direction) {
                dest[direction] = src[direction].map(function(p) {
                    var from = toPhysical ? p.logical : p.physical;
                    var to = toPhysical ? p.physical : p.logical;
                    return {
                        regexp: new RegExp("(-?)" + from + "(-?)"),
                        to: "$1" + to + "$2"
                    };
                });
            });
        });
        return map;
    }

    /**
     * @param {string} value
     * @param {string} writingMode
     * @param {?string} direction
     * @param {!Object.<string, !Object.<string, !Array.<!ConversionMap>>>} maps
     * @returns {string}
     */
    function convert(value, writingMode, direction, maps) {
        var maps2 = maps[writingMode];
        if (!maps2) {
            throw new Error("unknown writing-mode: " + writingMode);
        }
        var map = maps2[direction || "ltr"];
        if (!map) {
            throw new Error("unknown direction: " + direction);
        }
        for (var i = 0; i < map.length; i++) {
            var p = map[i];
            var replaced = value.replace(p.regexp, p.to);
            if (replaced !== value) {
                return replaced;
            }
        }
        return value;
    }

    /**
     * @type {!Object.<string, !Object.<string, !Array.<!{logical: string, physical: string}>>>}
     */
    var values = {
        "horizontal-tb": {
            "ltr": [
                {logical: "inline-start", physical: "left"},
                {logical: "inline-end", physical: "right"},
                {logical: "block-start", physical: "top"},
                {logical: "block-end", physical: "bottom"},
                {logical: "inline-size", physical: "width"},
                {logical: "block-size", physical: "height"}
            ],
            "rtl": [
                {logical: "inline-start", physical: "right"},
                {logical: "inline-end", physical: "left"},
                {logical: "block-start", physical: "top"},
                {logical: "block-end", physical: "bottom"},
                {logical: "inline-size", physical: "width"},
                {logical: "block-size", physical: "height"}
            ]
        },
        "vertical-rl": {
            "ltr": [
                {logical: "inline-start", physical: "top"},
                {logical: "inline-end", physical: "bottom"},
                {logical: "block-start", physical: "right"},
                {logical: "block-end", physical: "left"},
                {logical: "inline-size", physical: "height"},
                {logical: "block-size", physical: "width"}
            ],
            "rtl": [
                {logical: "inline-start", physical: "bottom"},
                {logical: "inline-end", physical: "top"},
                {logical: "block-start", physical: "right"},
                {logical: "block-end", physical: "left"},
                {logical: "inline-size", physical: "height"},
                {logical: "block-size", physical: "width"}
            ]
        },
        "vertical-lr": {
            "ltr": [
                {logical: "inline-start", physical: "top"},
                {logical: "inline-end", physical: "bottom"},
                {logical: "block-start", physical: "left"},
                {logical: "block-end", physical: "right"},
                {logical: "inline-size", physical: "height"},
                {logical: "block-size", physical: "width"}
            ],
            "rtl": [
                {logical: "inline-start", physical: "bottom"},
                {logical: "inline-end", physical: "top"},
                {logical: "block-start", physical: "left"},
                {logical: "block-end", physical: "right"},
                {logical: "inline-size", physical: "height"},
                {logical: "block-size", physical: "width"}
            ]
        }
    };

    var toPhysicalMaps = createRegExpMap(values, true);
    /**
     * @param {string} value
     * @param {string} writingMode
     * @param {?string=} direction
     * @returns {string}
     */
    vivliostyle.logical.toPhysical = function(value, writingMode, direction) {
        return convert(value, writingMode, direction || null, toPhysicalMaps);
    };

    var toLogicalMaps = createRegExpMap(values, false);
    /**
     * @param {string} value
     * @param {string} writingMode
     * @param {?string=} direction
     * @returns {string}
     */
    vivliostyle.logical.toLogical = function(value, writingMode, direction) {
        return convert(value, writingMode, direction || null, toLogicalMaps);
    };

    /**
     * @type {!Object.<string, !Array.<!{logical: string, physical: string}>>}
     */
    var lineRelativeValues = {
        "horizontal-tb": [
            {logical: "line-left", physical: "left"},
            {logical: "line-right", physical: "right"},
            {logical: "over", physical: "top"},
            {logical: "under", physical: "bottom"}
        ],
        "vertical-rl": [
            {logical: "line-left", physical: "top"},
            {logical: "line-right", physical: "bottom"},
            {logical: "over", physical: "right"},
            {logical: "under", physical: "left"}
        ],
        "vertical-lr": [
            {logical: "line-left", physical: "top"},
            {logical: "line-right", physical: "bottom"},
            {logical: "over", physical: "right"},
            {logical: "under", physical: "left"}
        ]
    };

    /**
     * @param {string} value
     * @param {string} writingMode
     * @returns {string}
     */
    vivliostyle.logical.toLineRelative = function(value, writingMode) {
        var maps = lineRelativeValues[writingMode];
        if (!maps) {
            throw new Error("unknown writing-mode: " + writingMode);
        }
        for (var i = 0; i < maps.length; i++) {
            if (maps[i].physical === value) {
                return maps[i].logical;
            }
        }
        return value;
    };
});
