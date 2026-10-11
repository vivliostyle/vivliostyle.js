/**
 * Copyright 2026 Vivliostyle Foundation
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
import * as Css from "../../../src/vivliostyle/css";
import * as Exprs from "../../../src/vivliostyle/exprs";

describe("CSS number serialization", function () {
  [
    [Infinity, "calc(infinity)"],
    [-Infinity, "calc(-infinity)"],
    [NaN, "calc(NaN)"],
  ].forEach(([number, expected]) => {
    it("serializes " + number + " as a CSS calculation", function () {
      const value = new Css.Num(number);
      expect(value.toString()).toBe(expected);
      expect(CSS.supports("opacity", value.toString())).toBe(true);
      // Serialization must not change the value used by internal arithmetic.
      const scope = new Exprs.LexicalScope(null);
      const context = new Exprs.Context(scope, 800, 600, 16, 20);
      const result = value.toExpr(scope, null).evaluate(context);
      expect(Object.is(result, number)).toBe(true);
    });
  });

  it("keeps finite numbers unchanged", function () {
    [0, -3, 0.25, 1000].forEach((number) => {
      expect(new Css.Num(number).toString()).toBe(String(number));
    });
  });
});
