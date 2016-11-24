/**
 * Copyright 2015 Vivliostyle Inc.
 * @fileoverview Utilities
 */
/* eslint no-extend-native: "off" */
goog.provide("vivliostyle.util");

(function() {
    if (!Array.from) {
        /**
         * Very simple polyfill of Array.from.
         * @param {!(IArrayLike<T>|Iterable<T>|string)} arrayLike
         * @param {function(this:S, (T|string), number):R=} mapFn
         * @param {S=} thisArg
         * @returns {!Array<R>}
         */
        Array.from = function(arrayLike, mapFn, thisArg) {
            if (mapFn && thisArg) {
                mapFn = mapFn.bind(thisArg);
            }
            var to = [];
            var len = arrayLike.length;
            for (var i = 0; i < len; i++) {
                to[i] = mapFn ? mapFn(arrayLike[i], i) : arrayLike[i];
            }
            return to;
        };
    }

    // Array.prototype.findIndex polyfill
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex#Polyfill
    if (!Array.prototype.findIndex) {
        Object.defineProperty(Array.prototype, 'findIndex', {
            value: function(predicate) {
                'use strict';
                if (this == null) {
                    throw new TypeError('Array.prototype.findIndex called on null or undefined');
                }
                if (typeof predicate !== 'function') {
                    throw new TypeError('predicate must be a function');
                }
                var list = Object(this);
                var length = list.length >>> 0;
                var thisArg = arguments[1];
                var value;

                for (var i = 0; i < length; i++) {
                    value = list[i];
                    if (predicate.call(thisArg, value, i, list)) {
                        return i;
                    }
                }
                return -1;
            },
            enumerable: false,
            configurable: false,
            writable: false
        });
    }

    if (!Object.assign) {
        /**
         * Very simple polyfill of Object.assign.
         * @param {!Object} target
         * @param {Object=} source
         * @returns {!Object}
         */
        Object.assign = function(target, source) {
            if (!source) return target;
            Object.keys(source).forEach(function(key) {
                target[key] = source[key];
            });
            return target;
        };
    }
})();
