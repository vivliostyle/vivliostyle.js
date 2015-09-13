/**
 * Copyright 2015 Vivliostyle Inc.
 * @fileoverview Utilities
 */
goog.provide("vivliostyle.util");

(function() {
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
