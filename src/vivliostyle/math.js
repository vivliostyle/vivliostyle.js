/**
 * Copyright 2017 Vivliostyle Inc.
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
 * @fileoverview Math utilities
 */
goog.provide("vivliostyle.math");

goog.scope(function() {

    /**
     * @param {!Array<number>} array
     * @returns {number}
     */
    vivliostyle.math.mean = function(array) {
        return array.reduce(function(prev, curr) {
            return prev + curr;
        }, 0) / array.length;
    };
    /** @const */ var mean = vivliostyle.math.mean;

    /**
     * @param {!Array<number>} array
     * @returns {number}
     */
    vivliostyle.math.variance = function(array) {
        var meanValue = mean(array);
        return mean(array.map(function(x) {
            var d = x - meanValue;
            return d * d;
        }));
    };
});
