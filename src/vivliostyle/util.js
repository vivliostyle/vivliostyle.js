/**
 * Copyright 2015 Vivliostyle Inc.
 * @fileoverview Utilities
 */
goog.provide("vivliostyle.util");

(function() {
    if (!Array.from) {
        /**
         * Very simple polyfill of Array.from.
         * @param {!Object} arrayLike
         * @param {function(*)=} mapFn
         * @param {Object=} thisArg
         * @returns {!Array}
         */
        Array.from = function(arrayLike, mapFn, thisArg) {
            if (mapFn && thisArg) {
                mapFn = mapFn.bind(thisArg);
            }
            var to = [];
            var len = arrayLike.length;
            for (var i = 0; i < len; i++) {
                to[i] = mapFn ? mapFn(arrayLike[i]) : arrayLike[i];
            }
            return to;
        };
    }

    if (!Object.assign) {
        /**
         * Very simple polyfill of Object.assign.
         * @param {!Object} target
         * @param {!Object} source
         * @returns {!Object}
         */
        Object.assign = function(target, source) {
            Object.keys(source).forEach(function(key) {
                target[key] = source[key];
            });
            return target;
        };
    }
})();
