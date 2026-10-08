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

  describe("math functions of CSS Values 4", function () {
    function call(name, ...args) {
      return context
        .evalCall(
          scope,
          name,
          args.map((arg) => new Exprs.Const(scope, arg)),
          false,
        )
        .evaluate(context);
    }

    it("evaluates the stepped value functions", function () {
      // The values are evaluated in px by this expression language, so the
      // functions that an engine needs to resolve a CSS value are registered:
      // round() takes an optional step, mod() has the sign of the divisor and
      // rem() the sign of the dividend. (Review)
      expect(call("round", 20.5)).toBe(21);
      expect(call("round", 20, 7)).toBe(21);
      expect(call("round", 25, 7)).toBe(28);
      expect(call("mod", 20, 7)).toBe(6);
      // The minimum takes precedence when the bounds of clamp() are reversed.
      expect(call("clamp", 30, 20, 10)).toBe(30);
      expect(call("clamp", 10, 20, 30)).toBe(20);
      expect(call("clamp", 10, 5, 30)).toBe(10);
      // An argument that is not a number (the <rounding-strategy> keyword of
      // round() becomes a media name in this language) and an argument count
      // that the function does not accept make the call unevaluable, so that
      // the value is left to the browser instead of producing a wrong one.
      // (Review)
      expectResult(call("round", false, 20, 7), NaN);
      expectResult(call("round", false, 20), NaN);
      expectResult(call("round", 20, 7, 3), NaN);
      expectResult(call("clamp", 10, 20), NaN);
      expectResult(call("log", 100, 10, 2), NaN);
      expectResult(call("round", 20, 0), NaN);
      expect(call("mod", -1, 8)).toBe(7);
      expect(call("rem", -1, 8)).toBe(-1);
    });

    it("evaluates the exponential and trigonometric functions", function () {
      expect(call("abs", -20)).toBe(20);
      expect(call("sign", -3)).toBe(-1);
      expect(call("hypot", 3, 4)).toBe(5);
      expect(call("pow", 2, 3)).toBe(8);
      expect(call("log", 100, 10)).toBeCloseTo(2, 10);
      expect(call("exp", 0)).toBe(1);
      expect(call("sqrt", 16)).toBe(4);
      expect(call("clamp", 10, 20, 30)).toBe(20);
    });
  });

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

  describe("font size", function () {
    it("uses a root font size of zero", function () {
      // A root font size of 0 is valid (`:root { font-size: 0 }`) and must not
      // fall back to the initial font size. (Issue #2174 follow-up)
      const zeroFontSizeContext = new Exprs.Context(scope, 800, 600, 16, 20);
      zeroFontSizeContext.rootFontSize = 0;
      expect(zeroFontSizeContext.fontSize()).toBe(0);
      expect(zeroFontSizeContext.queryUnitSize("em", false)).toBe(0);
      expect(zeroFontSizeContext.queryUnitSize("rem", false)).toBe(0);
    });
  });
});
