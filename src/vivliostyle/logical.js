/**
 * Copyright 2015 Vivliostyle Inc.
 * @fileoverview CSS Logical Properties
 */
goog.provide("vivliostyle.logical");

goog.scope(function() {
    function createRegExpMap(valueMaps, toPhysical) {
        var map = {};
        Object.keys(valueMaps).forEach(function(writingMode) {
            map[writingMode] = valueMaps[writingMode].map(function(p) {
                var from = toPhysical ? p.logical : p.physical;
                var to = toPhysical ? p.physical : p.logical;
                return {
                    regexp: new RegExp("(-?)" + from + "(-?)"),
                    to: "$1" + to + "$2"
                };
            });
        });
        return map;
    }

    function convert(value, writingMode, maps) {
        var map = maps[writingMode];
        if (!map) {
            throw new Error("unknown writing-mode: " + writingMode);
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

    // TODO consider 'direction' property
    var values = {
        "horizontal-tb": [
            {logical: "inline-start", physical: "left"},
            {logical: "inline-end", physical: "right"},
            {logical: "block-start", physical: "top"},
            {logical: "block-end", physical: "bottom"}
        ],
        "vertical-rl": [
            {logical: "inline-start", physical: "top"},
            {logical: "inline-end", physical: "bottom"},
            {logical: "block-start", physical: "right"},
            {logical: "block-end", physical: "left"}
        ],
        "vertical-lr": [
            {logical: "inline-start", physical: "top"},
            {logical: "inline-end", physical: "bottom"},
            {logical: "block-start", physical: "left"},
            {logical: "block-end", physical: "right"}
        ]
    };

    var toPhysicalMaps = createRegExpMap(values, true);
    vivliostyle.logical.toPhysical = function(value, writingMode) {
        return convert(value, writingMode, toPhysicalMaps);
    };

    var toLogicalMaps = createRegExpMap(values, false);
    vivliostyle.logical.toLogical = function(value, writingMode) {
        return convert(value, writingMode, toLogicalMaps);
    };
});
