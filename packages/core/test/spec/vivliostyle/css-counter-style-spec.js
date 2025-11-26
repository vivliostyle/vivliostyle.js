/**
 * Copyright 2025 Vivliostyle Foundation
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

// @ts-check

import * as adapt_cssvalid from "../../../src/vivliostyle/css-validator";
import * as adapt_ops from "../../../src/vivliostyle/ops";
import * as adapt_cssparse from "../../../src/vivliostyle/css-parser";
import * as adapt_task from "../../../src/vivliostyle/task";

describe("css-counter-style", function () {
  /**
   * @param {() => any} done
   * @param {string} css
   * @param {(result: boolean, counterStyles: typeof adapt_ops.StyleParserHandler.prototype.counterStyles) => any} fn
   */
  function parseStylesheet(done, css, fn) {
    var validatorSet = adapt_cssvalid.baseValidatorSet();
    var handler = new adapt_ops.StyleParserHandler(validatorSet);
    adapt_task.start(function () {
      adapt_cssparse
        .parseStylesheetFromText(css, handler, "", null, null)
        .then(function (result) {
          fn(result, handler.counterStyles);
          done();
        });
      return adapt_task.newResult(true);
    });
  }

  describe("cyclic system", function () {
    it("should format positive values with single symbol", function (done) {
      parseStylesheet(
        done,
        '@counter-style test { system: cyclic; symbols: "*"; }',
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          expect(style).not.toBeNull();
          if (!style) return;
          expect(style.format(1)).toBe("*");
          expect(style.format(2)).toBe("*");
          expect(style.format(100)).toBe("*");
        },
      );
    });

    it("should cycle through multiple symbols", function (done) {
      parseStylesheet(
        done,
        '@counter-style test { system: cyclic; symbols: "A" "B" "C"; }',
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          expect(style).not.toBeNull();
          if (!style) return;
          // ((value - 1) mod N)
          expect(style.format(1)).toBe("A"); // (1-1) mod 3 = 0
          expect(style.format(2)).toBe("B"); // (2-1) mod 3 = 1
          expect(style.format(3)).toBe("C"); // (3-1) mod 3 = 2
          expect(style.format(4)).toBe("A"); // (4-1) mod 3 = 0
          expect(style.format(5)).toBe("B"); // (5-1) mod 3 = 1
          expect(style.format(6)).toBe("C"); // (6-1) mod 3 = 2
          expect(style.format(7)).toBe("A"); // (7-1) mod 3 = 0
        },
      );
    });

    it("should handle negative values", function (done) {
      parseStylesheet(
        done,
        '@counter-style test { system: cyclic; symbols: "A" "B" "C"; }',
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          expect(style).not.toBeNull();
          if (!style) return;
          // negative values also cycle
          expect(style.format(-1)).toBe("B"); // ((-1)-1) mod 3 = -2 mod 3 = 1
          expect(style.format(-2)).toBe("A"); // ((-2)-1) mod 3 = -3 mod 3 = 0
          expect(style.format(-3)).toBe("C"); // ((-3)-1) mod 3 = -4 mod 3 = 2
          expect(style.format(0)).toBe("C"); // ((0)-1) mod 3 = -1 mod 3 = 2
        },
      );
    });

    it("should work with built-in disc style", function (done) {
      parseStylesheet(done, "", function (result, counterStyles) {
        expect(result).toBeTruthy();
        var disc = counterStyles.getStyle("disc");
        expect(disc).not.toBeNull();
        if (!disc) return;
        expect(disc.format(1)).toBe("\u2022"); // bullet
        expect(disc.format(2)).toBe("\u2022");
      });
    });

    it("should work with built-in circle style", function (done) {
      parseStylesheet(done, "", function (result, counterStyles) {
        expect(result).toBeTruthy();
        var circle = counterStyles.getStyle("circle");
        expect(circle).not.toBeNull();
        if (!circle) return;
        expect(circle.format(1)).toBe("\u25E6"); // white bullet
      });
    });

    it("should work with built-in square style", function (done) {
      parseStylesheet(done, "", function (result, counterStyles) {
        expect(result).toBeTruthy();
        var square = counterStyles.getStyle("square");
        expect(square).not.toBeNull();
        if (!square) return;
        expect(square.format(1)).toBe("\u25AA"); // black small square
      });
    });
  });

  describe("fixed system", function () {
    it("should format values starting from 1 by default", function (done) {
      parseStylesheet(
        done,
        '@counter-style test { system: fixed; symbols: "A" "B" "C"; }',
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          expect(style).not.toBeNull();
          if (!style) return;
          expect(style.format(1)).toBe("A");
          expect(style.format(2)).toBe("B");
          expect(style.format(3)).toBe("C");
        },
      );
    });

    it("should fallback for values outside range", function (done) {
      parseStylesheet(
        done,
        '@counter-style test { system: fixed; symbols: "A" "B" "C"; }',
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          expect(style).not.toBeNull();
          if (!style) return;
          // Values outside range [1, 3] fall back to decimal
          expect(style.format(0)).toBe("0");
          expect(style.format(-1)).toBe("-1");
          expect(style.format(4)).toBe("4");
          expect(style.format(100)).toBe("100");
        },
      );
    });

    it("should support custom first symbol value", function (done) {
      parseStylesheet(
        done,
        '@counter-style test { system: fixed 5; symbols: "A" "B" "C"; }',
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          expect(style).not.toBeNull();
          if (!style) return;
          expect(style.format(5)).toBe("A");
          expect(style.format(6)).toBe("B");
          expect(style.format(7)).toBe("C");
          // Outside range
          expect(style.format(4)).toBe("4");
          expect(style.format(8)).toBe("8");
        },
      );
    });

    it("should support negative first symbol value", function (done) {
      parseStylesheet(
        done,
        '@counter-style test { system: fixed -2; symbols: "A" "B" "C"; }',
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          expect(style).not.toBeNull();
          if (!style) return;
          expect(style.format(-2)).toBe("A");
          expect(style.format(-1)).toBe("B");
          expect(style.format(0)).toBe("C");
          // Outside range
          expect(style.format(-3)).toBe("-3");
          expect(style.format(1)).toBe("1");
        },
      );
    });

    it("should work with single symbol", function (done) {
      parseStylesheet(
        done,
        '@counter-style test { system: fixed; symbols: "*"; }',
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          expect(style).not.toBeNull();
          if (!style) return;
          expect(style.format(1)).toBe("*");
          expect(style.format(2)).toBe("2"); // fallback
        },
      );
    });

    it("should default first symbol value to 1", function (done) {
      parseStylesheet(
        done,
        '@counter-style test { system: fixed; symbols: "X" "Y"; }',
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          expect(style).not.toBeNull();
          if (!style) return;
          // Default first symbol value is 1
          expect(style.format(1)).toBe("X");
          expect(style.format(2)).toBe("Y");
          expect(style.format(0)).toBe("0"); // fallback
        },
      );
    });
  });

  describe("symbolic system", function () {
    it("should format with single symbol repeating", function (done) {
      parseStylesheet(
        done,
        '@counter-style test { system: symbolic; symbols: "*"; }',
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          expect(style).not.toBeNull();
          if (!style) return;
          expect(style.format(1)).toBe("*");
          expect(style.format(2)).toBe("**");
          expect(style.format(3)).toBe("***");
          expect(style.format(4)).toBe("****");
        },
      );
    });

    it("should cycle through symbols and increase repetition", function (done) {
      parseStylesheet(
        done,
        '@counter-style test { system: symbolic; symbols: "*" "†"; }',
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          expect(style).not.toBeNull();
          if (!style) return;
          // First pass (length 1)
          expect(style.format(1)).toBe("*");
          expect(style.format(2)).toBe("†");
          // Second pass (length 2)
          expect(style.format(3)).toBe("**");
          expect(style.format(4)).toBe("††");
          // Third pass (length 3)
          expect(style.format(5)).toBe("***");
          expect(style.format(6)).toBe("†††");
        },
      );
    });

    it("should work with three symbols", function (done) {
      parseStylesheet(
        done,
        '@counter-style test { system: symbolic; symbols: "A" "B" "C"; }',
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          expect(style).not.toBeNull();
          if (!style) return;
          // First pass (length 1)
          expect(style.format(1)).toBe("A");
          expect(style.format(2)).toBe("B");
          expect(style.format(3)).toBe("C");
          // Second pass (length 2)
          expect(style.format(4)).toBe("AA");
          expect(style.format(5)).toBe("BB");
          expect(style.format(6)).toBe("CC");
          // Third pass (length 3)
          expect(style.format(7)).toBe("AAA");
          expect(style.format(8)).toBe("BBB");
          expect(style.format(9)).toBe("CCC");
        },
      );
    });

    it("should fallback for non-positive values", function (done) {
      parseStylesheet(
        done,
        '@counter-style test { system: symbolic; symbols: "*"; }',
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          expect(style).not.toBeNull();
          if (!style) return;
          // symbolic is only defined for strictly positive values
          expect(style.format(0)).toBe("0");
          expect(style.format(-1)).toBe("-1");
          expect(style.format(-5)).toBe("-5");
        },
      );
    });

    it("should be the default system", function (done) {
      parseStylesheet(
        done,
        '@counter-style test { symbols: "X"; }',
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          expect(style).not.toBeNull();
          if (!style) return;
          // Default system is symbolic - uses symbolic formatting
          expect(style.format(1)).toBe("X");
          expect(style.format(2)).toBe("XX");
          expect(style.format(3)).toBe("XXX");
        },
      );
    });
  });

  describe("additive system", function () {
    it("should format simple additive values", function (done) {
      parseStylesheet(
        done,
        "@counter-style test { system: additive; additive-symbols: 5 V, 1 I; }",
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          expect(style).not.toBeNull();
          if (!style) return;
          expect(style.format(1)).toBe("I");
          expect(style.format(2)).toBe("II");
          expect(style.format(3)).toBe("III");
          expect(style.format(4)).toBe("IIII");
          expect(style.format(5)).toBe("V");
          expect(style.format(6)).toBe("VI");
          expect(style.format(7)).toBe("VII");
          expect(style.format(10)).toBe("VV");
        },
      );
    });

    it("should format Roman numeral style", function (done) {
      parseStylesheet(
        done,
        "@counter-style test { system: additive; additive-symbols: 1000 M, 500 D, 100 C, 50 L, 10 X, 5 V, 1 I; }",
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          expect(style).not.toBeNull();
          if (!style) return;
          expect(style.format(1)).toBe("I");
          expect(style.format(3)).toBe("III");
          expect(style.format(5)).toBe("V");
          expect(style.format(6)).toBe("VI");
          expect(style.format(10)).toBe("X");
          expect(style.format(50)).toBe("L");
          expect(style.format(100)).toBe("C");
          expect(style.format(500)).toBe("D");
          expect(style.format(1000)).toBe("M");
          expect(style.format(2023)).toBe("MMXXIII");
          expect(style.format(1666)).toBe("MDCLXVI");
        },
      );
    });

    it("should handle zero with zero-weight tuple", function (done) {
      parseStylesheet(
        done,
        '@counter-style test { system: additive; additive-symbols: 5 V, 1 I, 0 "zero"; }',
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          expect(style).not.toBeNull();
          if (!style) return;
          expect(style.format(0)).toBe("zero");
        },
      );
    });

    it("should fallback for zero without zero-weight tuple", function (done) {
      parseStylesheet(
        done,
        "@counter-style test { system: additive; additive-symbols: 5 V, 1 I; }",
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          expect(style).not.toBeNull();
          if (!style) return;
          expect(style.format(0)).toBe("0");
        },
      );
    });

    it("should fallback for negative values", function (done) {
      parseStylesheet(
        done,
        "@counter-style test { system: additive; additive-symbols: 5 V, 1 I; }",
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          expect(style).not.toBeNull();
          if (!style) return;
          expect(style.format(-1)).toBe("-1");
          expect(style.format(-5)).toBe("-5");
        },
      );
    });

    it("should fallback for unrepresentable values", function (done) {
      parseStylesheet(
        done,
        "@counter-style test { system: additive; additive-symbols: 3 C, 2 B; }",
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          expect(style).not.toBeNull();
          if (!style) return;
          // 1 cannot be represented (no weight 1)
          expect(style.format(1)).toBe("1");
          expect(style.format(2)).toBe("B");
          expect(style.format(3)).toBe("C");
          // 7 = 3 + 3 + 1, but 1 cannot be represented
          expect(style.format(7)).toBe("7");
        },
      );
    });

    it("should handle symbol-first order in tuple", function (done) {
      parseStylesheet(
        done,
        "@counter-style test { system: additive; additive-symbols: V 5, I 1; }",
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          expect(style).not.toBeNull();
          if (!style) return;
          expect(style.format(6)).toBe("VI");
        },
      );
    });
  });

  describe("numeric system", function () {
    it("should format binary numbers", function (done) {
      parseStylesheet(
        done,
        '@counter-style test { system: numeric; symbols: "0" "1"; }',
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          expect(style).not.toBeNull();
          if (!style) return;
          expect(style.format(0)).toBe("0");
          expect(style.format(1)).toBe("1");
          expect(style.format(2)).toBe("10");
          expect(style.format(3)).toBe("11");
          expect(style.format(42)).toBe("101010");
        },
      );
    });

    it("should format trinary numbers", function (done) {
      parseStylesheet(
        done,
        '@counter-style test { system: numeric; symbols: "0" "1" "2"; }',
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          expect(style).not.toBeNull();
          if (!style) return;
          expect(style.format(1)).toBe("1");
          expect(style.format(2)).toBe("2");
          expect(style.format(3)).toBe("10");
          expect(style.format(4)).toBe("11");
          expect(style.format(5)).toBe("12");
          expect(style.format(6)).toBe("20");
        },
      );
    });

    it("should handle negative values with negative sign", function (done) {
      parseStylesheet(
        done,
        '@counter-style test { system: numeric; symbols: "0" "1" "2"; }',
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          expect(style).not.toBeNull();
          if (!style) return;
          expect(style.format(-1)).toBe("-1");
          expect(style.format(-3)).toBe("-10");
        },
      );
    });
  });

  describe("alphabetic system", function () {
    it("should format like spreadsheet columns", function (done) {
      parseStylesheet(
        done,
        '@counter-style test { system: alphabetic; symbols: "○" "●"; }',
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          expect(style).not.toBeNull();
          if (!style) return;
          // From EXAMPLE 5 in the spec
          expect(style.format(1)).toBe("○");
          expect(style.format(2)).toBe("●");
          expect(style.format(3)).toBe("○○");
          expect(style.format(4)).toBe("○●");
          expect(style.format(5)).toBe("●○");
          expect(style.format(6)).toBe("●●");
          expect(style.format(7)).toBe("○○○");
        },
      );
    });

    it("should fallback for non-positive values", function (done) {
      parseStylesheet(
        done,
        '@counter-style test { system: alphabetic; symbols: "A" "B"; }',
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          expect(style).not.toBeNull();
          if (!style) return;
          // alphabetic range is [1, Infinity]
          expect(style.format(0)).toBe("0");
          expect(style.format(-1)).toBe("-1");
        },
      );
    });
  });

  describe("negative descriptor", function () {
    it("should use custom negative prefix", function (done) {
      parseStylesheet(
        done,
        '@counter-style test { system: numeric; symbols: "0" "1" "2" "3" "4" "5" "6" "7" "8" "9"; negative: "(" ")"; }',
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          expect(style).not.toBeNull();
          if (!style) return;
          expect(style.format(-2)).toBe("(2)");
          expect(style.format(-1)).toBe("(1)");
          expect(style.format(0)).toBe("0");
          expect(style.format(1)).toBe("1");
        },
      );
    });
  });

  describe("pad descriptor", function () {
    it("should pad with zeros", function (done) {
      parseStylesheet(
        done,
        '@counter-style test { system: numeric; symbols: "0" "1" "2" "3" "4" "5" "6" "7" "8" "9"; pad: 3 "0"; }',
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          expect(style).not.toBeNull();
          if (!style) return;
          expect(style.format(1)).toBe("001");
          expect(style.format(20)).toBe("020");
          expect(style.format(300)).toBe("300");
          expect(style.format(4000)).toBe("4000");
        },
      );
    });

    it("should account for negative sign in padding", function (done) {
      parseStylesheet(
        done,
        '@counter-style test { system: numeric; symbols: "0" "1" "2" "3" "4" "5" "6" "7" "8" "9"; pad: 3 "0"; }',
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          expect(style).not.toBeNull();
          if (!style) return;
          expect(style.format(-5)).toBe("-05");
        },
      );
    });
  });

  describe("fallback mechanism", function () {
    it("should use decimal CounterStyle for fallback", function (done) {
      parseStylesheet(
        done,
        '@counter-style test { system: fixed; symbols: "A"; }',
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          var decimal = counterStyles.getStyle("decimal");
          expect(style).not.toBeNull();
          expect(decimal).not.toBeNull();
          if (!style || !decimal) return;
          // Value 2 is outside fixed range [1, 1], falls back to decimal
          expect(style.format(2)).toBe(decimal.format(2));
          expect(style.format(100)).toBe(decimal.format(100));
          expect(style.format(-50)).toBe(decimal.format(-50));
        },
      );
    });
  });

  describe("extends system", function () {
    it("should use algorithm from extended style", function (done) {
      parseStylesheet(
        done,
        "@counter-style test { system: extends decimal; }",
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          var decimal = counterStyles.getStyle("decimal");
          expect(style).not.toBeNull();
          expect(decimal).not.toBeNull();
          if (!style || !decimal) return;
          expect(style.format(1)).toBe(decimal.format(1));
          expect(style.format(42)).toBe(decimal.format(42));
          expect(style.format(-7)).toBe(decimal.format(-7));
        },
      );
    });

    it("should allow overriding negative descriptor", function (done) {
      parseStylesheet(
        done,
        '@counter-style test { system: extends decimal; negative: "(" ")"; }',
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          expect(style).not.toBeNull();
          if (!style) return;
          expect(style.format(-5)).toBe("(5)");
          expect(style.format(5)).toBe("5");
        },
      );
    });

    it("should allow overriding pad descriptor", function (done) {
      parseStylesheet(
        done,
        '@counter-style test { system: extends decimal; pad: 3 "0"; }',
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          expect(style).not.toBeNull();
          if (!style) return;
          expect(style.format(1)).toBe("001");
          expect(style.format(42)).toBe("042");
        },
      );
    });

    it("should inherit negative from extended style if not specified", function (done) {
      parseStylesheet(
        done,
        '@counter-style base { system: numeric; symbols: "0" "1" "2" "3" "4" "5" "6" "7" "8" "9"; negative: "[" "]"; } @counter-style test { system: extends base; }',
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          expect(style).not.toBeNull();
          if (!style) return;
          expect(style.format(-5)).toBe("[5]");
        },
      );
    });

    it("should fall back to decimal if extended style does not exist", function (done) {
      parseStylesheet(
        done,
        "@counter-style test { system: extends nonexistent; }",
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          var decimal = counterStyles.getStyle("decimal");
          expect(style).not.toBeNull();
          expect(decimal).not.toBeNull();
          if (!style || !decimal) return;
          expect(style.format(42)).toBe(decimal.format(42));
        },
      );
    });

    it("should handle chain of extends", function (done) {
      parseStylesheet(
        done,
        '@counter-style a { system: extends b; } @counter-style b { system: extends c; } @counter-style c { system: numeric; symbols: "0" "1"; }',
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var styleA = counterStyles.getStyle("a");
          var styleC = counterStyles.getStyle("c");
          expect(styleA).not.toBeNull();
          expect(styleC).not.toBeNull();
          if (!styleA || !styleC) return;
          // a extends b extends c (numeric binary)
          expect(styleA.format(3)).toBe(styleC.format(3)); // "11" in binary
          expect(styleA.format(5)).toBe(styleC.format(5)); // "101" in binary
        },
      );
    });

    it("should handle extends cycle (2 styles) by falling back to decimal", function (done) {
      parseStylesheet(
        done,
        "@counter-style a { system: extends b; } @counter-style b { system: extends a; }",
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var styleA = counterStyles.getStyle("a");
          var styleB = counterStyles.getStyle("b");
          var decimal = counterStyles.getStyle("decimal");
          expect(styleA).not.toBeNull();
          expect(styleB).not.toBeNull();
          expect(decimal).not.toBeNull();
          if (!styleA || !styleB || !decimal) return;
          // Both should fall back to decimal due to cycle
          expect(styleA.format(42)).toBe(decimal.format(42));
          expect(styleB.format(42)).toBe(decimal.format(42));
        },
      );
    });

    it("should handle extends cycle (3 styles) by falling back to decimal", function (done) {
      parseStylesheet(
        done,
        "@counter-style a { system: extends b; } @counter-style b { system: extends c; } @counter-style c { system: extends a; }",
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var styleA = counterStyles.getStyle("a");
          var styleB = counterStyles.getStyle("b");
          var styleC = counterStyles.getStyle("c");
          var decimal = counterStyles.getStyle("decimal");
          expect(styleA).not.toBeNull();
          expect(styleB).not.toBeNull();
          expect(styleC).not.toBeNull();
          expect(decimal).not.toBeNull();
          if (!styleA || !styleB || !styleC || !decimal) return;
          // All should fall back to decimal due to cycle
          expect(styleA.format(42)).toBe(decimal.format(42));
          expect(styleB.format(42)).toBe(decimal.format(42));
          expect(styleC.format(42)).toBe(decimal.format(42));
        },
      );
    });

    it("should handle self-extending style by falling back to decimal", function (done) {
      parseStylesheet(
        done,
        "@counter-style a { system: extends a; }",
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var styleA = counterStyles.getStyle("a");
          var decimal = counterStyles.getStyle("decimal");
          expect(styleA).not.toBeNull();
          expect(decimal).not.toBeNull();
          if (!styleA || !decimal) return;
          // Self-reference is a cycle
          expect(styleA.format(42)).toBe(decimal.format(42));
        },
      );
    });

    it("should inherit auto range from extended symbolic system", function (done) {
      parseStylesheet(
        done,
        '@counter-style base { system: symbolic; symbols: "X"; } @counter-style test { system: extends base; }',
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          var decimal = counterStyles.getStyle("decimal");
          expect(style).not.toBeNull();
          expect(decimal).not.toBeNull();
          if (!style || !decimal) return;
          // symbolic range is [1, Infinity], so 0 and negative should fall back
          expect(style.format(1)).toBe("X");
          expect(style.format(2)).toBe("XX");
          expect(style.format(0)).toBe(decimal.format(0)); // fallback
          expect(style.format(-1)).toBe(decimal.format(-1)); // fallback
        },
      );
    });

    it("should inherit auto range from extended additive system", function (done) {
      parseStylesheet(
        done,
        "@counter-style base { system: additive; additive-symbols: 5 V, 1 I, 0 N; } @counter-style test { system: extends base; }",
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          var decimal = counterStyles.getStyle("decimal");
          expect(style).not.toBeNull();
          expect(decimal).not.toBeNull();
          if (!style || !decimal) return;
          // additive range is [0, Infinity], so negative should fall back
          expect(style.format(0)).toBe("N");
          expect(style.format(1)).toBe("I");
          expect(style.format(6)).toBe("VI");
          expect(style.format(-1)).toBe(decimal.format(-1)); // fallback
        },
      );
    });

    it("should match predefined symbolic styles case-insensitively", function (done) {
      // @see https://drafts.csswg.org/css-counter-styles/#extends-system
      // > If the specified <counter-style-name> is an ASCII case-insensitive match
      // > for disc, circle, square, disclosure-open, or disclosure-closed ...
      parseStylesheet(
        done,
        '@counter-style test { system: extends DISC; suffix: ") "; }',
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          var disc = counterStyles.getStyle("disc");
          expect(style).not.toBeNull();
          expect(disc).not.toBeNull();
          if (!style || !disc) return;
          // Should inherit algorithm from disc (cyclic with bullet symbol)
          expect(style.format(1)).toBe("\u2022");
          expect(style.format(2)).toBe("\u2022");
          // But with custom suffix
          expect(style.formatMarker(1).slice(-2)).toBe(") ");
        },
      );
    });
  });

  describe("ethiopic-numeric system", function () {
    // https://drafts.csswg.org/css-counter-styles-3/#ethiopic-numeric-counter-style
    it("should have ethiopic-numeric as a built-in counter style", function (done) {
      parseStylesheet(done, "", function (result, counterStyles) {
        expect(result).toBeTruthy();
        expect(counterStyles.getStyle("ethiopic-numeric")).toBeDefined();
      });
    });

    it("should format 1 as ፩ (U+1369)", function (done) {
      parseStylesheet(done, "", function (result, counterStyles) {
        expect(result).toBeTruthy();
        var style = counterStyles.getStyle("ethiopic-numeric");
        expect(style).not.toBeNull();
        if (!style) return;
        expect(style.format(1)).toBe("\u1369");
      });
    });

    it("should format single-digit numbers correctly", function (done) {
      parseStylesheet(done, "", function (result, counterStyles) {
        expect(result).toBeTruthy();
        var style = counterStyles.getStyle("ethiopic-numeric");
        expect(style).not.toBeNull();
        if (!style) return;
        expect(style.format(2)).toBe("\u136A"); // ፪
        expect(style.format(3)).toBe("\u136B"); // ፫
        expect(style.format(4)).toBe("\u136C"); // ፬
        expect(style.format(5)).toBe("\u136D"); // ፭
        expect(style.format(6)).toBe("\u136E"); // ፮
        expect(style.format(7)).toBe("\u136F"); // ፯
        expect(style.format(8)).toBe("\u1370"); // ፰
        expect(style.format(9)).toBe("\u1371"); // ፱
      });
    });

    it("should format tens correctly", function (done) {
      parseStylesheet(done, "", function (result, counterStyles) {
        expect(result).toBeTruthy();
        var style = counterStyles.getStyle("ethiopic-numeric");
        expect(style).not.toBeNull();
        if (!style) return;
        expect(style.format(10)).toBe("\u1372"); // ፲
        expect(style.format(20)).toBe("\u1373"); // ፳
        expect(style.format(30)).toBe("\u1374"); // ፴
        expect(style.format(40)).toBe("\u1375"); // ፵
        expect(style.format(50)).toBe("\u1376"); // ፶
        expect(style.format(60)).toBe("\u1377"); // ፷
        expect(style.format(70)).toBe("\u1378"); // ፸
        expect(style.format(80)).toBe("\u1379"); // ፹
        expect(style.format(90)).toBe("\u137A"); // ፺
      });
    });

    it("should format two-digit numbers correctly", function (done) {
      parseStylesheet(done, "", function (result, counterStyles) {
        expect(result).toBeTruthy();
        var style = counterStyles.getStyle("ethiopic-numeric");
        expect(style).not.toBeNull();
        if (!style) return;
        expect(style.format(11)).toBe("\u1372\u1369"); // ፲፩
        expect(style.format(25)).toBe("\u1373\u136D"); // ፳፭
        expect(style.format(99)).toBe("\u137A\u1371"); // ፺፱
      });
    });

    it("should format 100 as ፻ (U+137B)", function (done) {
      parseStylesheet(done, "", function (result, counterStyles) {
        expect(result).toBeTruthy();
        var style = counterStyles.getStyle("ethiopic-numeric");
        expect(style).not.toBeNull();
        if (!style) return;
        // 100: groups [00, 1], group1 is most significant with value 1, so digits removed
        // group1 (odd index, original value 1 != 0) gets U+137B
        expect(style.format(100)).toBe("\u137B");
      });
    });

    it("should format hundreds correctly", function (done) {
      parseStylesheet(done, "", function (result, counterStyles) {
        expect(result).toBeTruthy();
        var style = counterStyles.getStyle("ethiopic-numeric");
        expect(style).not.toBeNull();
        if (!style) return;
        expect(style.format(200)).toBe("\u136A\u137B"); // ፪፻
        expect(style.format(300)).toBe("\u136B\u137B"); // ፫፻
        expect(style.format(999)).toBe("\u1371\u137B\u137A\u1371"); // ፱፻፺፱
      });
    });

    it("should format 10000 as ፼ (U+137C)", function (done) {
      parseStylesheet(done, "", function (result, counterStyles) {
        expect(result).toBeTruthy();
        var style = counterStyles.getStyle("ethiopic-numeric");
        expect(style).not.toBeNull();
        if (!style) return;
        // 10000: groups [00, 00, 1]
        // group2: most significant with value 1, digits removed
        // group2 (even index != 0) gets U+137C
        // group1: value 0, no separator
        // group0: value 0, digits removed
        expect(style.format(10000)).toBe("\u137C");
      });
    });

    it("should format spec example 78010092 correctly", function (done) {
      parseStylesheet(done, "", function (result, counterStyles) {
        expect(result).toBeTruthy();
        var style = counterStyles.getStyle("ethiopic-numeric");
        expect(style).not.toBeNull();
        if (!style) return;
        // 78010092: groups [92, 00, 01, 78] (indices 0, 1, 2, 3)
        // group3 (78): ፸፰, odd index with value != 0, gets ፻
        // group2 (01): even index (not most significant, not odd), value 1 stays → ፩, even != 0 gets ፼
        // group1 (00): value 0, odd index but original value 0 so no separator
        // group0 (92): ፺፪, index 0 so no separator
        // Result: ፸፰፻፩፼፺፪
        expect(style.format(78010092)).toBe(
          "\u1378\u1370\u137B\u1369\u137C\u137A\u136A",
        );
      });
    });

    it("should format spec example 780100000092 correctly", function (done) {
      parseStylesheet(done, "", function (result, counterStyles) {
        expect(result).toBeTruthy();
        var style = counterStyles.getStyle("ethiopic-numeric");
        expect(style).not.toBeNull();
        if (!style) return;
        // 780100000092: groups [92, 00, 00, 00, 01, 78] (indices 0, 1, 2, 3, 4, 5)
        // group5 (78): ፸፰, odd index with value != 0, gets ፻
        // group4 (01): even index (not most significant), value 1 → ፩, even != 0 gets ፼
        // group3 (00): value 0, odd index but original value 0 so no separator
        // group2 (00): value 0, even != 0 gets ፼
        // group1 (00): value 0, odd index but original value 0 so no separator
        // group0 (92): ፺፪, index 0 so no separator
        // Result: ፸፰፻፩፼፼፺፪
        expect(style.format(780100000092)).toBe(
          "\u1378\u1370\u137B\u1369\u137C\u137C\u137A\u136A",
        );
      });
    });

    it("should use range 1 to infinity (fallback for 0 and negative)", function (done) {
      parseStylesheet(done, "", function (result, counterStyles) {
        expect(result).toBeTruthy();
        var style = counterStyles.getStyle("ethiopic-numeric");
        var decimal = counterStyles.getStyle("decimal");
        expect(style).not.toBeNull();
        expect(decimal).not.toBeNull();
        if (!style || !decimal) return;
        // 0 and negative values should fall back to decimal
        expect(style.format(0)).toBe(decimal.format(0));
        expect(style.format(-1)).toBe(decimal.format(-1));
        expect(style.format(-100)).toBe(decimal.format(-100));
      });
    });

    it("should have suffix '/ ' (U+002F U+0020)", function (done) {
      parseStylesheet(done, "", function (result, counterStyles) {
        expect(result).toBeTruthy();
        var style = counterStyles.getStyle("ethiopic-numeric");
        expect(style).not.toBeNull();
        if (!style) return;
        expect(style.formatMarker(1).slice(-2)).toBe("/ ");
      });
    });

    it("should be extendable with system: extends", function (done) {
      parseStylesheet(
        done,
        '@counter-style my-ethiopic { system: extends ethiopic-numeric; suffix: ") "; }',
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("my-ethiopic");
          expect(style).not.toBeNull();
          if (!style) return;
          // Should use ethiopic-numeric algorithm
          expect(style.format(1)).toBe("\u1369");
          expect(style.format(100)).toBe("\u137B");
          // But with custom suffix
          expect(style.formatMarker(1)).toBe("\u1369) ");
        },
      );
    });
  });

  describe("Chinese longhand counter styles", function () {
    // https://drafts.csswg.org/css-counter-styles-3/#limited-chinese
    describe("simp-chinese-informal", function () {
      it("should be a built-in counter style", function (done) {
        parseStylesheet(done, "", function (result, counterStyles) {
          expect(result).toBeTruthy();
          expect(counterStyles.getStyle("simp-chinese-informal")).toBeDefined();
        });
      });

      it("should format 0 as 零", function (done) {
        parseStylesheet(done, "", function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("simp-chinese-informal");
          expect(style).not.toBeNull();
          if (!style) return;
          expect(style.format(0)).toBe("零");
        });
      });

      it("should format single-digit numbers correctly", function (done) {
        parseStylesheet(done, "", function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("simp-chinese-informal");
          expect(style).not.toBeNull();
          if (!style) return;
          expect(style.format(1)).toBe("一");
          expect(style.format(2)).toBe("二");
          expect(style.format(3)).toBe("三");
          expect(style.format(4)).toBe("四");
          expect(style.format(5)).toBe("五");
          expect(style.format(6)).toBe("六");
          expect(style.format(7)).toBe("七");
          expect(style.format(8)).toBe("八");
          expect(style.format(9)).toBe("九");
        });
      });

      it("should format 10-19 without tens digit (informal rule)", function (done) {
        parseStylesheet(done, "", function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("simp-chinese-informal");
          expect(style).not.toBeNull();
          if (!style) return;
          expect(style.format(10)).toBe("十");
          expect(style.format(11)).toBe("十一");
          expect(style.format(12)).toBe("十二");
          expect(style.format(19)).toBe("十九");
        });
      });

      it("should format 20-99 with tens digit", function (done) {
        parseStylesheet(done, "", function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("simp-chinese-informal");
          expect(style).not.toBeNull();
          if (!style) return;
          expect(style.format(20)).toBe("二十");
          expect(style.format(21)).toBe("二十一");
          expect(style.format(50)).toBe("五十");
          expect(style.format(99)).toBe("九十九");
        });
      });

      it("should format hundreds correctly", function (done) {
        parseStylesheet(done, "", function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("simp-chinese-informal");
          expect(style).not.toBeNull();
          if (!style) return;
          expect(style.format(100)).toBe("一百");
          expect(style.format(101)).toBe("一百零一");
          expect(style.format(110)).toBe("一百一十");
          expect(style.format(111)).toBe("一百一十一");
          expect(style.format(120)).toBe("一百二十");
        });
      });

      it("should format thousands correctly", function (done) {
        parseStylesheet(done, "", function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("simp-chinese-informal");
          expect(style).not.toBeNull();
          if (!style) return;
          expect(style.format(1000)).toBe("一千");
          expect(style.format(1001)).toBe("一千零一");
          expect(style.format(1010)).toBe("一千零一十");
          expect(style.format(1100)).toBe("一千一百");
          expect(style.format(1111)).toBe("一千一百一十一");
          expect(style.format(9999)).toBe("九千九百九十九");
        });
      });

      it("should format negative numbers correctly", function (done) {
        parseStylesheet(done, "", function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("simp-chinese-informal");
          expect(style).not.toBeNull();
          if (!style) return;
          expect(style.format(-1)).toBe("负一");
          expect(style.format(-10)).toBe("负十");
          expect(style.format(-100)).toBe("负一百");
          expect(style.format(-1000)).toBe("负一千");
        });
      });

      it("should have suffix '、' (U+3001)", function (done) {
        parseStylesheet(done, "", function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("simp-chinese-informal");
          expect(style).not.toBeNull();
          if (!style) return;
          expect(style.formatMarker(1).slice(-1)).toBe("\u3001");
        });
      });

      // This test does not pass at this point.
      // cjk-decimal is injected via the UA stylesheet.

      // it("should fall back to cjk-decimal outside range -9999 to 9999", function (done) {
      //   parseStylesheet(done, "", function (result, counterStyles) {
      //     var style = counterStyles._resolve("simp-chinese-informal");
      //     var cjkDecimal = counterStyles._resolve("cjk-decimal");
      //     var decimal = counterStyles._resolve("decimal");
      //     expect(style).not.toBeNull();
      //     expect(cjkDecimal).not.toBeNull();
      //     expect(decimal).not.toBeNull();
      //     if (!style || !cjkDecimal || !decimal) return;
      //     // 10000 falls back to cjk-decimal (which handles 0 to infinite)
      //     expect(style.format(10000)).toBe(cjkDecimal.format(10000));
      //     // -10000 falls back to cjk-decimal, but cjk-decimal has range 0 to infinite,
      //     // so it further falls back to decimal
      //     expect(style.format(-10000)).toBe(decimal.format(-10000));
      //   });
      // });
    });

    describe("simp-chinese-formal", function () {
      it("should be a built-in counter style", function (done) {
        parseStylesheet(done, "", function (result, counterStyles) {
          expect(result).toBeTruthy();
          expect(counterStyles.getStyle("simp-chinese-formal")).toBeDefined();
        });
      });

      it("should format single-digit numbers with formal characters", function (done) {
        parseStylesheet(done, "", function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("simp-chinese-formal");
          expect(style).not.toBeNull();
          if (!style) return;
          expect(style.format(1)).toBe("壹");
          expect(style.format(2)).toBe("贰");
          expect(style.format(3)).toBe("叁");
        });
      });

      it("should NOT apply informal 10-19 rule (formal style)", function (done) {
        parseStylesheet(done, "", function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("simp-chinese-formal");
          expect(style).not.toBeNull();
          if (!style) return;
          expect(style.format(10)).toBe("壹拾");
          expect(style.format(11)).toBe("壹拾壹");
          expect(style.format(19)).toBe("壹拾玖");
        });
      });

      it("should format hundreds with formal markers", function (done) {
        parseStylesheet(done, "", function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("simp-chinese-formal");
          expect(style).not.toBeNull();
          if (!style) return;
          expect(style.format(100)).toBe("壹佰");
          expect(style.format(111)).toBe("壹佰壹拾壹");
        });
      });

      it("should format thousands with formal markers", function (done) {
        parseStylesheet(done, "", function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("simp-chinese-formal");
          expect(style).not.toBeNull();
          if (!style) return;
          expect(style.format(1000)).toBe("壹仟");
          expect(style.format(1111)).toBe("壹仟壹佰壹拾壹");
        });
      });
    });

    describe("trad-chinese-informal", function () {
      it("should be a built-in counter style", function (done) {
        parseStylesheet(done, "", function (result, counterStyles) {
          expect(result).toBeTruthy();
          expect(counterStyles.getStyle("trad-chinese-informal")).toBeDefined();
        });
      });

      it("should format numbers same as simp-chinese-informal (same digits)", function (done) {
        parseStylesheet(done, "", function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("trad-chinese-informal");
          expect(style).not.toBeNull();
          if (!style) return;
          expect(style.format(1)).toBe("一");
          expect(style.format(10)).toBe("十");
          expect(style.format(11)).toBe("十一");
          expect(style.format(100)).toBe("一百");
          expect(style.format(1111)).toBe("一千一百一十一");
        });
      });

      it("should use traditional negative sign 負", function (done) {
        parseStylesheet(done, "", function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("trad-chinese-informal");
          expect(style).not.toBeNull();
          if (!style) return;
          expect(style.format(-1)).toBe("負一");
          expect(style.format(-100)).toBe("負一百");
        });
      });
    });

    describe("trad-chinese-formal", function () {
      it("should be a built-in counter style", function (done) {
        parseStylesheet(done, "", function (result, counterStyles) {
          expect(result).toBeTruthy();
          expect(counterStyles.getStyle("trad-chinese-formal")).toBeDefined();
        });
      });

      it("should use traditional formal characters", function (done) {
        parseStylesheet(done, "", function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("trad-chinese-formal");
          expect(style).not.toBeNull();
          if (!style) return;
          expect(style.format(1)).toBe("壹");
          expect(style.format(2)).toBe("貳"); // Traditional form
          expect(style.format(3)).toBe("參"); // Traditional form
          expect(style.format(6)).toBe("陸"); // Traditional form
        });
      });

      it("should NOT apply informal 10-19 rule", function (done) {
        parseStylesheet(done, "", function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("trad-chinese-formal");
          expect(style).not.toBeNull();
          if (!style) return;
          expect(style.format(10)).toBe("壹拾");
          expect(style.format(11)).toBe("壹拾壹");
        });
      });

      it("should use traditional negative sign 負", function (done) {
        parseStylesheet(done, "", function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("trad-chinese-formal");
          expect(style).not.toBeNull();
          if (!style) return;
          expect(style.format(-1)).toBe("負壹");
        });
      });
    });

    describe("cjk-ideographic", function () {
      it("should be a built-in counter style (legacy)", function (done) {
        parseStylesheet(done, "", function (result, counterStyles) {
          expect(result).toBeTruthy();
          expect(counterStyles.getStyle("cjk-ideographic")).toBeDefined();
        });
      });

      it("should be identical to trad-chinese-informal", function (done) {
        parseStylesheet(done, "", function (result, counterStyles) {
          expect(result).toBeTruthy();
          var cjk = counterStyles.getStyle("cjk-ideographic");
          var trad = counterStyles.getStyle("trad-chinese-informal");
          expect(cjk).not.toBeNull();
          expect(trad).not.toBeNull();
          if (!cjk || !trad) return;
          expect(cjk.format(1)).toBe(trad.format(1));
          expect(cjk.format(10)).toBe(trad.format(10));
          expect(cjk.format(11)).toBe(trad.format(11));
          expect(cjk.format(100)).toBe(trad.format(100));
          expect(cjk.format(1111)).toBe(trad.format(1111));
          expect(cjk.format(-1)).toBe(trad.format(-1));
        });
      });
    });

    it("should be extendable with system: extends", function (done) {
      parseStylesheet(
        done,
        '@counter-style my-chinese { system: extends simp-chinese-informal; suffix: ") "; }',
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("my-chinese");
          expect(style).not.toBeNull();
          if (!style) return;
          // Should use simp-chinese-informal algorithm
          expect(style.format(1)).toBe("一");
          expect(style.format(10)).toBe("十");
          expect(style.format(100)).toBe("一百");
          // But with custom suffix
          expect(style.formatMarker(1).slice(-2)).toBe(") ");
        },
      );
    });
  });

  describe("formatMarker", function () {
    it("should include prefix and suffix", function (done) {
      parseStylesheet(
        done,
        '@counter-style test { system: numeric; symbols: "0" "1" "2" "3" "4" "5" "6" "7" "8" "9"; prefix: "("; suffix: ") "; }',
        function (result, counterStyles) {
          expect(result).toBeTruthy();
          var style = counterStyles.getStyle("test");
          expect(style).not.toBeNull();
          if (!style) return;
          // format() should NOT include prefix/suffix
          expect(style.format(1)).toBe("1");
          expect(style.format(42)).toBe("42");
          // formatMarker() should include prefix and suffix
          expect(style.formatMarker(1)).toBe("(1) ");
          expect(style.formatMarker(42)).toBe("(42) ");
        },
      );
    });
  });
});
