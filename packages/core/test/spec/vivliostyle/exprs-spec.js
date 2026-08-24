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

import * as Exprs from "../../../src/vivliostyle/exprs";

describe("exprs", function () {
  const scope = new Exprs.LexicalScope(null);
  const context = new Exprs.Context(scope, 800, 600, 16, 20);

  function evaluatePrefix(Operator, operand) {
    return new Operator(scope, new Exprs.Const(scope, operand)).evaluate(
      context,
    );
  }

  function evaluateInfix(Operator, lhs, rhs) {
    return new Operator(
      scope,
      new Exprs.Const(scope, lhs),
      new Exprs.Const(scope, rhs),
    ).evaluate(context);
  }

  function expectResult(actual, expected) {
    if (Number.isNaN(expected)) {
      expect(Number.isNaN(actual)).toBe(true);
    } else {
      expect(actual).toBe(expected);
    }
  }

  function mediaName(name) {
    return new Exprs.MediaName(scope, false, name);
  }

  describe("media feature tests", function () {
    it("evaluates value-less features in a boolean context", function () {
      expect(
        new Exprs.MediaBooleanTest(scope, mediaName("width")).evaluate(context),
      ).toBe(true);
      expect(
        new Exprs.MediaBooleanTest(scope, mediaName("unknown")).evaluate(
          context,
        ),
      ).toBe(false);
      expect(
        new Exprs.MediaBooleanTest(scope, mediaName("min-width")).evaluate(
          context,
        ),
      ).toBe(true);

      const zeroWidthContext = new Exprs.Context(scope, 0, 600, 16, 20);
      expect(
        new Exprs.MediaBooleanTest(scope, mediaName("width")).evaluate(
          zeroWidthContext,
        ),
      ).toBe(false);
    });

    it("evaluates value-bearing features against their requested values", function () {
      [
        ["width", 800, true],
        ["width", 799, false],
        ["min-width", 799, true],
        ["min-width", 801, false],
        ["max-width", 801, true],
        ["max-width", 799, false],
      ].forEach(([name, value, expected]) => {
        expect(
          new Exprs.MediaTest(
            scope,
            mediaName(name),
            new Exprs.Const(scope, value),
          ).evaluate(context),
        ).toBe(expected);
      });
    });

    it("does not evaluate the requested value of an unknown feature", function () {
      const evaluateValue = jasmine.createSpy("evaluateValue");
      const value = new Exprs.Native(scope, evaluateValue, "value");
      const test = new Exprs.MediaTest(scope, mediaName("unknown"), value);

      expect(test.evaluate(context)).toBe(false);
      expect(evaluateValue).not.toHaveBeenCalled();
    });
  });

  describe("Negate", function () {
    it("coerces expression result types to numbers", function () {
      [
        [2, -2],
        ["2", -2],
        [true, -1],
        [undefined, NaN],
      ].forEach(([operand, expected]) => {
        expectResult(evaluatePrefix(Exprs.Negate, operand), expected);
      });
    });
  });

  describe("relational operators", function () {
    it("compare two strings as strings and other result types as numbers", function () {
      [
        ["10", "2", true, true, false, false],
        ["10", 2, false, false, true, true],
        [false, true, true, true, false, false],
        [undefined, 0, false, false, false, false],
      ].forEach(([lhs, rhs, lt, le, gt, ge]) => {
        expect(evaluateInfix(Exprs.Lt, lhs, rhs)).toBe(lt);
        expect(evaluateInfix(Exprs.Le, lhs, rhs)).toBe(le);
        expect(evaluateInfix(Exprs.Gt, lhs, rhs)).toBe(gt);
        expect(evaluateInfix(Exprs.Ge, lhs, rhs)).toBe(ge);
      });
    });
  });

  describe("Add", function () {
    it("concatenates strings and otherwise adds numbers", function () {
      [
        [1, 2, 3],
        ["1", 2, "12"],
        [1, "2", "12"],
        [false, true, 1],
        [undefined, 1, NaN],
        ["value:", undefined, "value:undefined"],
      ].forEach(([lhs, rhs, expected]) => {
        expectResult(evaluateInfix(Exprs.Add, lhs, rhs), expected);
      });
    });
  });

  describe("numeric infix operators", function () {
    it("coerce expression result types to numbers", function () {
      [
        [Exprs.Subtract, [4, 4, -1, NaN]],
        [Exprs.Multiply, [12, 12, 2, NaN]],
        [Exprs.Divide, [3, 3, 0.5, NaN]],
        [Exprs.Modulo, [0, 0, 1, NaN]],
      ].forEach(([Operator, expectedResults]) => {
        [
          [6, 2],
          ["6", 2],
          [true, 2],
          [undefined, 2],
        ].forEach(([lhs, rhs], index) => {
          expectResult(
            evaluateInfix(Operator, lhs, rhs),
            expectedResults[index],
          );
        });
      });
    });
  });
});
