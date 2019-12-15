/**
 * Copyright 2017 Trim-marks Inc.
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

import * as vivliostyle_mathutil from "../../../src/vivliostyle/math-util";

describe("math", function() {
  describe("mean", function() {
    it("calculates mean of numbers stored in an array", function() {
      expect(vivliostyle_mathutil.mean([1, 2, 3, 4])).toBe(2.5);
    });
  });

  describe("variance", function() {
    it("calculates variance of numbers stored in an array", function() {
      expect(vivliostyle_mathutil.variance([1, 2, 3, 4])).toBe(1.25);
    });
  });
});
