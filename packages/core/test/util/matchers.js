/**
 * Copyright 2015 Trim-marks Inc.
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
 */
// goog.provide("vivliostyle.test.util.matchers");

// (function() {
function isSameNode(node1, node2) {
  return !!node1 && node1.compareDocumentPosition(node2) === 0;
}

var matchers = {
  toBeSameNodeAs: function () {
    return {
      compare: function (node1, node2) {
        return { pass: isSameNode(node1, node2) };
      },
    };
  },
};

export const addMatchers = function () {
  jasmine.addMatchers(matchers);
};
// })();
