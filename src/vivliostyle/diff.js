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
 * @fileoverview Diff utility
 */
goog.provide("vivliostyle.diff");

goog.require("vivliostyle.namespace");

goog.scope(() => {
    /* eslint-disable global-require,no-undef */
    var fastdiff = require('node_modules/fast-diff/diff');
    /* eslint-enable global-require,no-undef */

    /**
     * @typedef {Array.<(number|string)>}
     */
    vivliostyle.diff.Change;

    /**
     * @param {string} originalText
     * @param {string} newText
     * @returns {Array.<vivliostyle.diff.Change>}
     */
    vivliostyle.diff.diffChars = (originalText, newText) => fastdiff(originalText, newText, 0);

    /**
     * @param {Array.<vivliostyle.diff.Change>} changes
     * @returns string
     */
    vivliostyle.diff.restoreOriginalText = changes => changes.reduce((result, item) => {
        if (item[0] === fastdiff.INSERT) return result;
        return result + item[1];
    }, "");

    /**
     * @param {Array.<vivliostyle.diff.Change>} changes
     * @returns string
     */
    vivliostyle.diff.restoreNewText = changes => changes.reduce((result, item) => {
        if (item[0] === fastdiff.DELETE) return result;
        return result + item[1];
    }, "");

    /**
     * @param {Array.<vivliostyle.diff.Change>} changes
     * @param {number} oldIndex
     * @returns {number}
     */
    vivliostyle.diff.resolveNewIndex = (changes, oldIndex) => vivliostyle.diff.resolveIndex(changes, oldIndex, 1);

    /**
     * @param {Array.<vivliostyle.diff.Change>} changes
     * @param {number} newIndex
     * @returns {number}
     */
    vivliostyle.diff.resolveOriginalIndex = (changes, newIndex) => vivliostyle.diff.resolveIndex(changes, newIndex, -1);

    /**
     * @private
     * @param {Array.<vivliostyle.diff.Change>} changes
     * @param {number} index
     * @param {number} coef
     * @returns {number}
     */
    vivliostyle.diff.resolveIndex = (changes, index, coef) => {
        var diff     = 0;
        var current  = 0;
        changes.some(change => {
            for (var i=0; i<change[1].length; i++) {
                switch (change[0]*coef) {
                    case fastdiff.INSERT:
                        diff++;
                        break;
                    case fastdiff.DELETE:
                        diff--;
                        current++;
                        break;
                    case fastdiff.EQUAL:
                        current++;
                        break;
                }
                if (current > index) return true;
            }
            return false;
        });
        return Math.max(Math.min(index, current-1) + diff, 0);
    };
});
