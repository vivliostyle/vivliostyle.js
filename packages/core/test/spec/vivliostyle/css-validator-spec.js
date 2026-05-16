/**
 * Copyright 2017 Daishinsha Inc.
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

import * as adapt_csscasc from "../../../src/vivliostyle/css-cascade";
import * as adapt_css from "../../../src/vivliostyle/css";
import * as adapt_cssparse from "../../../src/vivliostyle/css-parser";
import * as adapt_cssvalid from "../../../src/vivliostyle/css-validator";
import * as adapt_task from "../../../src/vivliostyle/task";
import * as vivliostyle_logging from "../../../src/vivliostyle/logging";

describe("css-validator", function () {
  function parseCascade(cssText, done, callback) {
    var handler = new adapt_csscasc.CascadeParserHandler(
      null,
      null,
      null,
      null,
      null,
      adapt_cssvalid.baseValidatorSet(),
      true,
    );
    handler.startStylesheet(adapt_cssparse.StylesheetFlavor.AUTHOR);
    adapt_task.start(function () {
      adapt_cssparse
        .parseStylesheetFromText(cssText, handler, null, null, null)
        .then(function (result) {
          expect(result).toBe(true);
          callback(handler.finish(), handler);
          done();
        });
      return adapt_task.newResult(true);
    });
  }

  describe("background shorthand regression", function () {
    it("keeps color in cascade for a semicolonless declaration", function (done) {
      parseCascade("h1 { color: blue }", done, function (cascade) {
        expect(cascade.tags.h1).toBeDefined();
        expect(cascade.tags.h1.style.color).toBeDefined();
      });
    });

    it("keeps background-color in cascade for a semicolonless declaration", function (done) {
      parseCascade("ul { background: green }", done, function (cascade) {
        expect(cascade.tags.ul).toBeDefined();
        expect(cascade.tags.ul.style["background-color"]).toBeDefined();
      });
    });

    it("keeps background-color in cascade when semicolonless declarations precede nested rules", function (done) {
      parseCascade(
        "ul { background: green } li:has(strong) { display: none; :has(> &) { background: red; } }",
        done,
        function (cascade) {
          expect(cascade.tags.ul).toBeDefined();
          expect(cascade.tags.ul.style["background-color"]).toBeDefined();
        },
      );
    });
  });

  describe("browser shorthand expansion", function () {
    it("expands place-items into longhands", function (done) {
      parseCascade(
        "div { place-items: center start; }",
        done,
        function (cascade) {
          expect(cascade.tags.div).toBeDefined();
          expect(cascade.tags.div.style["align-items"]).toBeDefined();
          expect(cascade.tags.div.style["justify-items"]).toBeDefined();
          expect(cascade.tags.div.style["align-items"].value.toString()).toBe(
            "center",
          );
          expect(cascade.tags.div.style["justify-items"].value.toString()).toBe(
            "start",
          );
        },
      );
    });

    it("preserves cascade order when longhands override browser shorthand expansion", function (done) {
      parseCascade(
        "div { place-items: center start; justify-items: stretch; }",
        done,
        function (cascade) {
          expect(cascade.tags.div).toBeDefined();
          expect(cascade.tags.div.style["align-items"]).toBeDefined();
          expect(cascade.tags.div.style["justify-items"]).toBeDefined();
          expect(cascade.tags.div.style["align-items"].value.toString()).toBe(
            "center",
          );
          expect(cascade.tags.div.style["justify-items"].value.toString()).toBe(
            "stretch",
          );
        },
      );
    });

    it("propagates CSS-wide values from browser shorthands to their longhands", function (done) {
      parseCascade("div { place-items: initial; }", done, function (cascade) {
        expect(cascade.tags.div).toBeDefined();
        expect(cascade.tags.div.style["align-items"]).toBeDefined();
        expect(cascade.tags.div.style["justify-items"]).toBeDefined();
        expect(cascade.tags.div.style["align-items"].value).toBe(
          adapt_css.ident.initial,
        );
        expect(cascade.tags.div.style["justify-items"].value).toBe(
          adapt_css.ident.initial,
        );
      });
    });

    it("caches non-shorthand properties after the first browser probe miss", function () {
      var validatorSet = adapt_cssvalid.baseValidatorSet();
      spyOn(validatorSet, "expandBrowserShorthand").and.callThrough();

      expect(validatorSet.getShorthand("color", "red")).toBeNull();
      expect(validatorSet.getShorthand("color", "blue")).toBeNull();
      expect(validatorSet.expandBrowserShorthand).toHaveBeenCalledTimes(1);
    });

    it("does not cache a browser shorthand miss for unresolved var values", function () {
      var validatorSet = adapt_cssvalid.baseValidatorSet();
      spyOn(validatorSet, "expandBrowserShorthand").and.callFake(
        function (name, value) {
          if (name !== "place-items") {
            return null;
          }
          if (value === "var(--items)") {
            return null;
          }
          if (value === "center start") {
            return {
              propList: ["align-items", "justify-items"],
              values: {
                "align-items": "center",
                "justify-items": "start",
              },
            };
          }
          return null;
        },
      );

      expect(
        validatorSet.getShorthand("place-items", "var(--items)"),
      ).toBeNull();
      expect(
        validatorSet.getShorthand("place-items", "center start"),
      ).not.toBeNull();
      expect(validatorSet.expandBrowserShorthand).toHaveBeenCalledTimes(2);
    });

    it("accepts browser shorthands with comma-list syntax", function (done) {
      parseCascade(
        "div { transition: opacity 1s ease, transform 2s linear; }",
        done,
        function (cascade) {
          expect(cascade.tags.div).toBeDefined();
          expect(cascade.tags.div.style["transition-property"]).toBeDefined();
          expect(cascade.tags.div.style["transition-duration"]).toBeDefined();
          expect(
            cascade.tags.div.style["transition-property"].value.toString(),
          ).toBe("opacity,transform");
          expect(
            cascade.tags.div.style["transition-duration"].value.toString(),
          ).toBe("1s,2s");
        },
      );
    });

    it("keeps self-referential custom property declarations through the parser path", function (done) {
      parseCascade("div { --a: var(--a, red); }", done, function (cascade) {
        expect(cascade.tags.div).toBeDefined();
        expect(cascade.tags.div.style["--a"]).toBeDefined();
        expect(cascade.tags.div.style["--a"].value.toString()).toBe(
          "var(--a,red)",
        );
      });
    });
  });

  describe("invalid selector list recovery", function () {
    it("drops an invalid selector list instead of salvaging later selectors", function (done) {
      parseCascade(
        "p { background: lime; } foo % address, p { background: red; }",
        done,
        function (cascade) {
          expect(cascade.tags.p).toBeDefined();
          expect(cascade.tags.p.style["background-color"]).toBeDefined();
          expect(
            cascade.tags.p.style["background-color"].value.toString(),
          ).toBe("lime");
        },
      );
    });

    it("drops an invalid selector list even when it uses !important", function (done) {
      parseCascade(
        "foo % address, p { background: red ! important; } p { background: lime; }",
        done,
        function (cascade) {
          expect(cascade.tags.p).toBeDefined();
          expect(cascade.tags.p.style["background-color"]).toBeDefined();
          expect(
            cascade.tags.p.style["background-color"].value.toString(),
          ).toBe("lime");
        },
      );
    });
  });

  describe("contextually invalid selectors", function () {
    it("invalidates selectors continued after pseudo-elements inside :is()", function (done) {
      parseCascade(
        ":is(*, ::before) * { color: purple; }",
        done,
        function (_cascade, handler) {
          expect(handler.invalid).toBe(true);
        },
      );
    });

    it("invalidates pseudo-elements continued after pseudo-elements inside :is()", function (done) {
      parseCascade(
        ":is(*, ::before)::after { color: purple; }",
        done,
        function (_cascade, handler) {
          expect(handler.invalid).toBe(true);
        },
      );
    });
  });

  describe("ValidatorSet", function () {
    it("should parse simple validator and simple rule", function (done) {
      var validatorSet = new adapt_cssvalid.ValidatorSet();
      validatorSet.initBuiltInValidators();
      validatorSet.parse("foo-or = bar | [ baz || biz ];");
      var handler = new adapt_csscasc.CascadeParserHandler(
        null,
        null,
        null,
        null,
        null,
        validatorSet,
        true,
      );
      var warnListener = jasmine.createSpy("warn listener");
      vivliostyle_logging.logger.addListener(
        vivliostyle_logging.LogLevel.WARN,
        warnListener,
      );
      adapt_task.start(function () {
        adapt_cssparse
          .parseStylesheetFromText(
            ".test { foo-or: bar; }\n.test2 { foo-or: baz biz; }",
            handler,
            null,
            null,
            null,
          )
          .then(function (result) {
            expect(result).toBe(true);
            expect(warnListener).not.toHaveBeenCalled();
            done();
          });
        return adapt_task.newResult(true);
      });
    });

    it("rejects invalid single values for text-autospace-like nested alternates", function () {
      var validatorSet = new adapt_cssvalid.ValidatorSet();
      validatorSet.initBuiltInValidators();
      validatorSet.parse(
        "foo = normal | auto | no-autospace | [[ ideograph-alpha || ideograph-numeric || punctuation ] || [ insert | replace ]];",
      );

      expect(adapt_css.getName("x").visit(validatorSet.validators.foo)).toBe(
        null,
      );
    });

    it("accepts valid single values for text-autospace-like nested alternates", function () {
      var validatorSet = new adapt_cssvalid.ValidatorSet();
      validatorSet.initBuiltInValidators();
      validatorSet.parse(
        "foo = normal | auto | no-autospace | [[ ideograph-alpha || ideograph-numeric || punctuation ] || [ insert | replace ]];",
      );

      expect(
        adapt_css.getName("punctuation").visit(validatorSet.validators.foo),
      ).not.toBe(null);
    });

    it("should parse simple validator that compare values case-insensitively.", function (done) {
      var validatorSet = new adapt_cssvalid.ValidatorSet();
      validatorSet.initBuiltInValidators();
      validatorSet.parse("foo = bAr | Baz | bIZ ;");
      var handler = new adapt_csscasc.CascadeParserHandler(
        null,
        null,
        null,
        null,
        null,
        validatorSet,
        true,
      );
      var warnListener = jasmine.createSpy("warn listener");
      vivliostyle_logging.logger.addListener(
        vivliostyle_logging.LogLevel.WARN,
        warnListener,
      );
      adapt_task.start(function () {
        adapt_cssparse
          .parseStylesheetFromText(
            ".test { foo: bar; }\n" +
              ".test2 { foo: BAR; }" +
              ".test3 { foo: Bar; }" +
              ".test4 { foo: bAr; }" +
              ".test5 { foo: baR; }" +
              ".test6 { foo: BAZ; }" +
              ".test6 { foo: biz; }" +
              "",
            handler,
            null,
            null,
            null,
          )
          .then(function (result) {
            expect(result).toBe(true);
            expect(warnListener).not.toHaveBeenCalled();
            done();
          });
        return adapt_task.newResult(true);
      });
    });

    it("should parse selector functions with a top-level cascade handler", function (done) {
      var validatorSet = adapt_cssvalid.baseValidatorSet();
      var handler = new adapt_csscasc.CascadeParserHandler(
        null,
        null,
        null,
        null,
        null,
        validatorSet,
        true,
      );
      handler.startStylesheet(adapt_cssparse.StylesheetFlavor.USER_AGENT);
      var warnListener = jasmine.createSpy("warn listener");
      vivliostyle_logging.logger.addListener(
        vivliostyle_logging.LogLevel.WARN,
        warnListener,
      );
      adapt_task.start(function () {
        adapt_cssparse
          .parseStylesheetFromText(
            '@namespace epub "http://www.idpf.org/2007/ops";\n:not(a[epub|type~="noteref"], a[epub\\:type~="noteref"], a[role~="doc-noteref"])::footnote-call { content: counter(footnote); }',
            handler,
            null,
            null,
            null,
          )
          .then(function (result) {
            expect(result).toBe(true);
            expect(warnListener).not.toHaveBeenCalled();
            done();
          });
        return adapt_task.newResult(true);
      });
    });
    it("should parse semantic footnote noteref default selectors", function (done) {
      var validatorSet = adapt_cssvalid.baseValidatorSet();
      var handler = new adapt_csscasc.CascadeParserHandler(
        null,
        null,
        null,
        null,
        null,
        validatorSet,
        true,
      );
      handler.startStylesheet(adapt_cssparse.StylesheetFlavor.USER_AGENT);
      var warnListener = jasmine.createSpy("warn listener");
      vivliostyle_logging.logger.addListener(
        vivliostyle_logging.LogLevel.WARN,
        warnListener,
      );
      adapt_task.start(function () {
        adapt_cssparse
          .parseStylesheetFromText(
            '@namespace epub "http://www.idpf.org/2007/ops";\na[epub|type="noteref"]:not(sup > *, :has(> sup)),\na[epub\\:type="noteref"]:not(sup > *, :has(> sup)),\na[role="doc-noteref"]:not(sup > *, :has(> sup)) { font-size: 0.75em; vertical-align: super; line-height: 0; }',
            handler,
            null,
            null,
            null,
          )
          .then(function (result) {
            expect(result).toBe(true);
            expect(warnListener).not.toHaveBeenCalled();
            done();
          });
        return adapt_task.newResult(true);
      });
    });
    it("should parse validator and space rule", function (done) {
      var validatorSet = new adapt_cssvalid.ValidatorSet();
      validatorSet.initBuiltInValidators();
      validatorSet.parse("foo = SPACE(IDENT+);");
      var handler = new adapt_csscasc.CascadeParserHandler(
        null,
        null,
        null,
        null,
        null,
        validatorSet,
        true,
      );
      var warnListener = jasmine.createSpy("warn listener");
      vivliostyle_logging.logger.addListener(
        vivliostyle_logging.LogLevel.WARN,
        warnListener,
      );
      adapt_task.start(function () {
        adapt_cssparse
          .parseStylesheetFromText(
            ".test { foo: bar; }\n.test2 { foo: bar baz boo; }",
            handler,
            null,
            null,
            null,
          )
          .then(function (result) {
            expect(result).toBe(true);
            expect(warnListener).not.toHaveBeenCalled();
            done();
          });
        return adapt_task.newResult(true);
      });
    });

    it("should parse validator and comma rule", function (done) {
      var validatorSet = new adapt_cssvalid.ValidatorSet();
      validatorSet.initBuiltInValidators();
      validatorSet.parse("foo = COMMA( IDENT+ );");
      var handler = new adapt_csscasc.CascadeParserHandler(
        null,
        null,
        null,
        null,
        null,
        validatorSet,
        true,
      );
      var warnListener = jasmine.createSpy("warn listener");
      vivliostyle_logging.logger.addListener(
        vivliostyle_logging.LogLevel.WARN,
        warnListener,
      );
      adapt_task.start(function () {
        adapt_cssparse
          .parseStylesheetFromText(
            ".test { foo: bar,baz; }\n .test2{ foo: bar; }",
            handler,
            null,
            null,
            null,
          )
          .then(function (result) {
            expect(result).toBe(true);
            expect(warnListener).not.toHaveBeenCalled();
            done();
          });
        return adapt_task.newResult(true);
      });
    });

    it("should parse validator and complex comma rule", function (done) {
      var validatorSet = new adapt_cssvalid.ValidatorSet();
      validatorSet.initBuiltInValidators();
      validatorSet.parse("foo-comma = none | COMMA( [ bar | baz ]+ );");
      var handler = new adapt_csscasc.CascadeParserHandler(
        null,
        null,
        null,
        null,
        null,
        validatorSet,
        true,
      );
      var warnListener = jasmine.createSpy("warn listener");
      vivliostyle_logging.logger.addListener(
        vivliostyle_logging.LogLevel.WARN,
        warnListener,
      );
      adapt_task.start(function () {
        adapt_cssparse
          .parseStylesheetFromText(
            ".test { foo-comma: none; }\n.test2 { foo-comma: bar,baz; }\n .test3 { foo-comma: bar; }",
            handler,
            null,
            null,
            null,
          )
          .then(function (result) {
            expect(result).toBe(true);
            expect(warnListener).not.toHaveBeenCalled();
            done();
          });
        return adapt_task.newResult(true);
      });
    });

    it("should parse validator and complex space rule", function (done) {
      var validatorSet = new adapt_cssvalid.ValidatorSet();
      validatorSet.initBuiltInValidators();
      validatorSet.parse("spacefoo = none | SPACE( [ bar | baz ]+ );");
      var handler = new adapt_csscasc.CascadeParserHandler(
        null,
        null,
        null,
        null,
        null,
        validatorSet,
        true,
      );
      var warnListener = jasmine.createSpy("warn listener");
      vivliostyle_logging.logger.addListener(
        vivliostyle_logging.LogLevel.WARN,
        warnListener,
      );
      adapt_task.start(function () {
        adapt_cssparse
          .parseStylesheetFromText(
            ".test { spacefoo: none; }\n.test2 { spacefoo: bar baz; }\n .test3 { spacefoo: bar; }",
            handler,
            null,
            null,
            null,
          )
          .then(function (result) {
            expect(result).toBe(true);
            expect(warnListener).not.toHaveBeenCalled();
            done();
          });
        return adapt_task.newResult(true);
      });
    });
    it("should parse rule that contains function", function (done) {
      var validatorSet = new adapt_cssvalid.ValidatorSet();
      validatorSet.initBuiltInValidators();
      var validation_txt =
        "THE_VALUE = SPACE(IDENT+);\n" +
        "PRED_VALUE = [ fff | SPACE(bb bz)];" +
        "THE_FUNCTION = the-function(PRED_VALUE? THE_VALUE+);\n" +
        "AC_VALUES = STRING | THE_FUNCTION;" +
        "accept-function = COMMA(AC_VALUES+);";

      validatorSet.parse(validation_txt);
      var handler = new adapt_csscasc.CascadeParserHandler(
        null,
        null,
        null,
        null,
        null,
        validatorSet,
        true,
      );
      var warnListener = jasmine.createSpy("warn listener");
      vivliostyle_logging.logger.addListener(
        vivliostyle_logging.LogLevel.WARN,
        warnListener,
      );
      adapt_task.start(function () {
        adapt_cssparse
          .parseStylesheetFromText(
            ".test { accept-function: the-function(foo bar); }\n" +
              ".test2 { accept-function: the-function(foo bar, bar baz); }\n" +
              ".test3 { accept-function: the-function(fff, foo bar, bar baz); }\n" +
              ".test4 { accept-function: the-function(bb bz, foo bar, bar baz); }",
            handler,
            null,
            null,
            null,
          )
          .then(function (result) {
            expect(result).toBe(true);
            expect(warnListener).not.toHaveBeenCalled();
            done();
          });
        return adapt_task.newResult(true);
      });
    });
    it("should parse rule that contains slash", function (done) {
      var validatorSet = new adapt_cssvalid.ValidatorSet();
      validatorSet.initBuiltInValidators();
      validatorSet.parse("foo = bar( SPACE( POS_NUM [ SLASH POS_NUM ]? ) );");
      var handler = new adapt_csscasc.CascadeParserHandler(
        null,
        null,
        null,
        null,
        null,
        validatorSet,
        true,
      );
      var warnListener = jasmine.createSpy("warn listener");
      vivliostyle_logging.logger.addListener(
        vivliostyle_logging.LogLevel.WARN,
        warnListener,
      );
      adapt_task.start(function () {
        adapt_cssparse
          .parseStylesheetFromText(
            ".test { foo: bar( 10 / 10 ) ; }\n" + ".test2 { foo: bar( 10 ) ; }",
            handler,
            null,
            null,
            null,
          )
          .then(function (result) {
            expect(result).toBe(true);
            expect(warnListener).not.toHaveBeenCalled();
            done();
          });
        return adapt_task.newResult(true);
      });
    });
    it("should parse font shorthand rule", function (done) {
      var validatorSet = new adapt_cssvalid.ValidatorSet();
      validatorSet.initBuiltInValidators();
      validatorSet.parse(
        "PPLENGTH = POS_LENGTH | ZERO | POS_PERCENTAGE;" +
          "FAMILY = SPACE(IDENT+) | STRING;" +
          "FAMILY_LIST = COMMA( FAMILY+ );" +
          "font-family = FAMILY_LIST;" +
          "font-size = xx-small | x-small | small | medium | large | x-large | xx-large | larger | smaller | PPLENGTH | POS_NUM;" +
          "font-style = normal | italic | oblique;" +
          "font-variant = normal | small-caps;" +
          "font-weight = normal | bold | bolder | lighter | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;" +
          "font-stretch = normal | wider | narrower | ultra-condensed | extra-condensed | condensed | semi-condensed | semi-expanded | expanded | extra-expanded | ultra-expanded;" +
          "line-height = normal | POS_NUM | PPLENGTH;" +
          "\n\n" +
          "DEFAULTS\n\n" +
          "font-family: serif;" +
          "font-style: normal;" +
          "font-size: medium;" +
          "font-variant: normal;" +
          "line-height: normal;" +
          "font-weight: normal;" +
          "\n\n" +
          "SHORTHANDS\n\n" +
          "font = FONT font-style font-variant font-weight font-stretch ;",
      );
      var handler = new adapt_csscasc.CascadeParserHandler(
        null,
        null,
        null,
        null,
        null,
        validatorSet,
        true,
      );
      var warnListener = jasmine.createSpy("warn listener");
      vivliostyle_logging.logger.addListener(
        vivliostyle_logging.LogLevel.WARN,
        warnListener,
      );
      adapt_task.start(function () {
        adapt_cssparse
          .parseStylesheetFromText(
            ".test  { font: 80% sans-serif ; }\n" +
              '.test2 { font: 12px/14px "Times" ; }\n' +
              '.test3 { font: oblique small-caps bold 12px/14px "Times" ; }\n' +
              '.test4 { font: small-caps oblique 12px "Times" ; }\n' +
              '.test5 { font: oblique small-caps bold ultra-condensed 12px/14px "Times" ; }\n' +
              '.test6 { font: small-caps wider oblique 12px "Times" ; }\n' +
              ".test7 { font: status-bar ; }",
            handler,
            null,
            null,
            null,
          )
          .then(function (result) {
            expect(result).toBe(true);
            expect(warnListener).not.toHaveBeenCalled();
            done();
          });
        return adapt_task.newResult(true);
      });
    });
  });
});
