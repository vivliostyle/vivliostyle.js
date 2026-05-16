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

import * as adapt_cssparse from "../../../src/vivliostyle/css-parser";
import * as adapt_cssnesting from "../../../src/vivliostyle/css-nesting";
import * as adapt_csstok from "../../../src/vivliostyle/css-tokenizer";
import * as adapt_task from "../../../src/vivliostyle/task";

describe("css-parser", function () {
  describe("Parser", function () {
    var handler = new adapt_cssparse.ParserHandler(null);

    beforeEach(function () {
      spyOn(handler, "error");
      spyOn(handler, "idSelector");
      spyOn(handler, "pseudoclassSelector");
      spyOn(handler, "startFuncWithSelector");
      spyOn(handler, "endFuncWithSelector");
      spyOn(handler, "pushSelectorText");
      spyOn(handler, "pseudoelementSelector");
    });

    function parse(done, text, fn) {
      var tokenizer = new adapt_csstok.Tokenizer(text, handler);

      adapt_task.start(function () {
        adapt_cssparse
          .parseStylesheet(tokenizer, handler, null, null, null)
          .then(function (result) {
            expect(result).toBe(true);
            fn();
            done();
          });
        return adapt_task.newResult(true);
      });
    }

    function parseSupports(done, text, fn) {
      spyOn(handler, "startWhenRule").and.callThrough();
      parse(done, text, function () {
        expect(handler.startWhenRule).toHaveBeenCalled();
        fn(handler.startWhenRule.calls.mostRecent().args[0]);
      });
    }

    function tokenize(text) {
      var tokenizer = new adapt_csstok.Tokenizer(text, handler);
      var tokens = [];
      while (true) {
        var token = tokenizer.token();
        tokens.push({
          type: token.type,
          text: token.text,
          position: token.position,
        });
        if (token.type === adapt_csstok.TokenType.EOF) {
          return tokens;
        }
        tokenizer.consume();
      }
    }

    describe("css nesting", function () {
      it("expands nested selectors using :is() semantics", function () {
        expect(
          adapt_cssnesting.expandNesting(
            ".foo, #bar { > .baz, &.qux { color: red; } }",
          ),
        ).toBe(":is(.foo, #bar) > .baz, :is(.foo, #bar).qux { color: red; }");
      });

      it("keeps mixed declarations ordered around nested rules", function () {
        expect(
          adapt_cssnesting.expandNesting(
            ".foo, .foo::before { color: black; @media screen { color: white; } background: silver; }",
          ),
        ).toBe(
          ".foo, .foo::before { color: black; }\n@media screen { .foo, .foo::before { color: white; } }\n.foo, .foo::before { background: silver; }",
        );
      });

      it("wraps complex parent selectors with :is() when replacing &", function () {
        expect(
          adapt_cssnesting.expandNesting(
            "span > b { .test-4 section > & { color: red; } }",
          ),
        ).toBe(".test-4 section > :is(span > b) { color: red; }");
      });

      it("wraps compound-position ampersands with :is()", function () {
        expect(
          adapt_cssnesting.expandNesting(
            "div.test-14 { div& { color: green; } }",
          ),
        ).toBe("div:is(div.test-14) { color: green; }");
      });

      it("does not turn nested :has() replacements into matching selectors", function () {
        expect(
          adapt_cssnesting.expandNesting(
            "li:has(strong) { :has(> &) { background: red; } }",
          ),
        ).toBe(":has(> :where(:not(*))) { background: red; }");
      });

      it("parses nested rules without reporting syntax errors", function (done) {
        spyOn(handler, "property");
        parse(done, ".foo { .bar { color: red; } }", function () {
          expect(handler.error).not.toHaveBeenCalled();
          expect(handler.property).toHaveBeenCalled();
          expect(handler.property.calls.mostRecent().args[0]).toBe("color");
          expect(handler.property.calls.mostRecent().args[2]).toBe(false);
        });
      });

      it("parses forgiving nested selectors with unknown functions", function (done) {
        parse(
          done,
          ".does-not-exist { :is(.test-2, :unknown(div,&)) { color: green; } }",
          function () {
            expect(handler.error).not.toHaveBeenCalled();
          },
        );
      });

      it("captures recovered :has selector text after invalid selector items", function (done) {
        parse(done, ".foo:has(!, > .bar) {}", function () {
          var selectorTexts = handler.pushSelectorText.calls
            .allArgs()
            .map(function (args) {
              return args[0].trim();
            });
          expect(selectorTexts).toContain("> .bar");
          expect(
            selectorTexts.some(function (text) {
              return text.indexOf("!") >= 0;
            }),
          ).toBe(false);
        });
      });

      it("preserves invalid forgiving items during expansion", function () {
        expect(
          adapt_cssnesting.expandNesting(
            ".does-not-exist { :is(.test-1, !&) { color: green; } }",
          ),
        ).toBe(":is(.test-1, !:is(.does-not-exist)) { color: green; }");
      });

      it("does not replace escaped ampersands in nested selectors", function () {
        expect(
          adapt_cssnesting.expandNesting(
            ".foo { .bar\\&baz { color: green; } }",
          ),
        ).toBe(":is(.foo) .bar\\&baz { color: green; }");
      });

      it("does not split selector lists on escaped commas", function () {
        expect(
          adapt_cssnesting.expandNesting(
            ".foo { .bar\\,.baz { color: green; } }",
          ),
        ).toBe(":is(.foo) .bar\\,.baz { color: green; }");
      });

      it("returns declaration-only stylesheets unchanged", function () {
        expect(adapt_cssnesting.expandNesting("ul { background: green }")).toBe(
          "ul { background: green }",
        );
      });

      it("returns simple non-nested rules unchanged", function () {
        expect(adapt_cssnesting.expandNesting("h1 { color: blue }")).toBe(
          "h1 { color: blue }",
        );
      });

      it("preserves ideographic spaces inside string literals during expansion", function () {
        expect(
          adapt_cssnesting.expandNesting(
            '.toc::after { content: target-text(attr(href url), before) "　" target-text(attr(href url), content); }',
          ),
        ).toBe(
          '.toc::after { content: target-text(attr(href url), before) "　" target-text(attr(href url), content); }',
        );
      });

      it("preserves ASCII whitespace inside string literals during expansion", function () {
        expect(
          adapt_cssnesting.expandNesting(
            '.label::after { content: "  spaced   text  "; }',
          ),
        ).toBe('.label::after { content: "  spaced   text  "; }');
      });

      it("still expands nested rules with semicolonless declarations", function () {
        expect(
          adapt_cssnesting.expandNesting(
            ".foo { color: blue; .bar { background: green } }",
          ),
        ).toBe(".foo { color: blue; }\n:is(.foo) .bar { background: green; }");
      });

      it("still expands type selectors followed by pseudo-classes", function () {
        expect(
          adapt_cssnesting.expandNesting(".foo { a:hover { color: red; } }"),
        ).toBe(":is(.foo) a:hover { color: red; }");
      });

      it("still expands namespace-prefixed type selectors", function () {
        expect(
          adapt_cssnesting.expandNesting(".foo { |a { color: red; } }"),
        ).toBe(":is(.foo) |a { color: red; }");
      });

      it("parses semicolonless declarations after preprocessing", function (done) {
        spyOn(handler, "property");
        parse(done, "ul { background: green }", function () {
          expect(handler.error).not.toHaveBeenCalled();
          expect(handler.property).toHaveBeenCalled();
          expect(handler.property.calls.mostRecent().args[0]).toBe(
            "background",
          );
        });
      });

      it("parses simple semicolonless declarations after preprocessing", function (done) {
        spyOn(handler, "property");
        parse(done, "h1 { color: blue }", function () {
          expect(handler.error).not.toHaveBeenCalled();
          expect(handler.property).toHaveBeenCalled();
          expect(handler.property.calls.mostRecent().args[0]).toBe("color");
        });
      });
    });

    describe("tokenizer recovery", function () {
      it("advances past standalone invalid delimiter characters after previous tokens", function () {
        var tokens = tokenize("a `");

        expect(
          tokens.map(function (token) {
            return token.type;
          }),
        ).toEqual([
          adapt_csstok.TokenType.IDENT,
          adapt_csstok.TokenType.INVALID,
          adapt_csstok.TokenType.EOF,
        ]);
        expect(tokens[0].text).toBe("a");
        expect(tokens[1].text).toBe("`");
        expect(tokens[2].position).toBe(3);
      });

      it("advances past repeated NUL bytes in misdecoded stylesheets", function () {
        var tokens = tokenize("@\u0000c\u0000h");

        expect(
          tokens
            .filter(function (token) {
              return token.type === adapt_csstok.TokenType.INVALID;
            })
            .map(function (token) {
              return token.text;
            }),
        ).toEqual(["\u0000", "\u0000"]);
        expect(
          tokens
            .filter(function (token) {
              return token.type === adapt_csstok.TokenType.IDENT;
            })
            .map(function (token) {
              return token.text;
            }),
        ).toEqual(["c", "h"]);
        expect(
          tokens.map(function (token) {
            return token.type;
          }),
        ).toEqual([
          adapt_csstok.TokenType.AT,
          adapt_csstok.TokenType.INVALID,
          adapt_csstok.TokenType.IDENT,
          adapt_csstok.TokenType.INVALID,
          adapt_csstok.TokenType.IDENT,
          adapt_csstok.TokenType.EOF,
        ]);
        expect(tokens[tokens.length - 1].position).toBe(5);
      });

      it("lets parser recovery reach the next selector after an invalid at-rule delimiter", function (done) {
        parse(done, "@foo `; #pass { color: green; }", function () {
          expect(handler.idSelector).toHaveBeenCalledWith("pass");
        });
      });
    });

    describe("pseudoclass", function () {
      describe(":lang", function () {
        it("takes one identifier as an argument", function (done) {
          parse(done, ":lang(ja) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoclassSelector).toHaveBeenCalledWith("lang", [
              "ja",
            ]);
          });
        });

        it("error if no arguments are passed", function (done) {
          parse(done, ":lang() {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
          });
        });

        it("error if invalid arguments are passed", function (done) {
          parse(done, ":lang(2) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
          });
        });
      });

      describe(":href-epub-type", function () {
        it("takes one identifier as an argument", function (done) {
          parse(done, ":href-epub-type(foo) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoclassSelector).toHaveBeenCalledWith(
              "href-epub-type",
              ["foo"],
            );
          });
        });

        it("error if no arguments are passed", function (done) {
          parse(done, ":href-epub-type() {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
          });
        });

        it("error if invalid arguments are passed", function (done) {
          parse(done, ":href-epub-type(2) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
          });
        });
      });

      describe(":nth-child", function () {
        it("can take 'odd' argument", function (done) {
          parse(done, ":nth-child(odd) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoclassSelector).toHaveBeenCalledWith(
              "nth-child",
              [2, 1],
            );
          });
        });

        it("can take 'even' argument", function (done) {
          parse(done, ":nth-child(even) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoclassSelector).toHaveBeenCalledWith(
              "nth-child",
              [2, 0],
            );
          });
        });

        it("reject '+-an' argument", function (done) {
          parse(done, ":nth-child(+-2n) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
          });
        });

        it("reject '+-n' argument", function (done) {
          parse(done, ":nth-child(+-n) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
          });
        });

        it("reject '+ an' argument", function (done) {
          parse(done, ":nth-child(+ 2n) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
          });
        });

        it("can take 'n -0' argument", function (done) {
          parse(done, ":nth-child(n -0) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoclassSelector).toHaveBeenCalledWith(
              "nth-child",
              [1, 0],
            );
          });
        });

        it("reject 'n + -0' argument", function (done) {
          parse(done, ":nth-child(n + -0) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
          });
        });

        it("reject 'n - -0' argument", function (done) {
          parse(done, ":nth-child(n - -0) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
          });
        });

        it("can take 'n -a' argument", function (done) {
          parse(done, ":nth-child(n -3) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoclassSelector).toHaveBeenCalledWith(
              "nth-child",
              [1, -3],
            );
          });
        });

        it("reject 'n + -a' argument", function (done) {
          parse(done, ":nth-child(n + -3) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
          });
        });

        it("reject 'n - -a' argument", function (done) {
          parse(done, ":nth-child(n - -3) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
          });
        });

        it("can take 'n+a' argument", function (done) {
          parse(done, ":nth-child(n+3) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoclassSelector).toHaveBeenCalledWith(
              "nth-child",
              [1, 3],
            );
          });
        });

        it("can take 'n +a' argument", function (done) {
          parse(done, ":nth-child(n +3) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoclassSelector).toHaveBeenCalledWith(
              "nth-child",
              [1, 3],
            );
          });
        });

        it("can take 'n + a' argument", function (done) {
          parse(done, ":nth-child(n + 3) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoclassSelector).toHaveBeenCalledWith(
              "nth-child",
              [1, 3],
            );
          });
        });

        it("can take 'n - a' argument", function (done) {
          parse(done, ":nth-child(n - 3) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoclassSelector).toHaveBeenCalledWith(
              "nth-child",
              [1, -3],
            );
          });
        });

        it("can take 'n - 0' argument", function (done) {
          parse(done, ":nth-child(n - 0) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoclassSelector).toHaveBeenCalledWith(
              "nth-child",
              [1, 0],
            );
          });
        });

        it("reject 'n b' argument", function (done) {
          parse(done, ":nth-child(n 2) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
          });
        });

        it("reject 'n + +0' argument", function (done) {
          parse(done, ":nth-child(n + +0) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
          });
        });

        it("reject 'n + +b' argument", function (done) {
          parse(done, ":nth-child(n + +3) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
          });
        });

        it("can take 'n' argument", function (done) {
          parse(done, ":nth-child(n) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoclassSelector).toHaveBeenCalledWith(
              "nth-child",
              [1, 0],
            );
          });
        });

        it("can take 'n' argument with a plus sign", function (done) {
          parse(done, ":nth-child(+n) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoclassSelector).toHaveBeenCalledWith(
              "nth-child",
              [1, 0],
            );
          });
        });

        it("can take 'an' argument", function (done) {
          parse(done, ":nth-child(2n) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoclassSelector).toHaveBeenCalledWith(
              "nth-child",
              [2, 0],
            );
          });
        });

        it("can take '-an' argument", function (done) {
          parse(done, ":nth-child(-2n) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoclassSelector).toHaveBeenCalledWith(
              "nth-child",
              [-2, 0],
            );
          });
        });

        it("can take 'an' argument with a plus sign", function (done) {
          parse(done, ":nth-child(+2n) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoclassSelector).toHaveBeenCalledWith(
              "nth-child",
              [2, 0],
            );
          });
        });

        it("reject '+a n' argument", function (done) {
          parse(done, ":nth-child(+2 n) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
          });
        });

        it("reject 'an+' argument", function (done) {
          parse(done, ":nth-child(2n+) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
          });
        });

        it("reject 'an +' argument", function (done) {
          parse(done, ":nth-child(2n +) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
          });
        });

        it("can take 'n' argument with a minus sign", function (done) {
          parse(done, ":nth-child(-n) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoclassSelector).toHaveBeenCalledWith(
              "nth-child",
              [-1, 0],
            );
          });
        });

        it("reject '- n' argument", function (done) {
          parse(done, ":nth-child(- n) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
          });
        });

        it("can take '-n+b' argument", function (done) {
          parse(done, ":nth-child(-n+3) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoclassSelector).toHaveBeenCalledWith(
              "nth-child",
              [-1, 3],
            );
          });
        });

        it("can take 'an -b' argument", function (done) {
          parse(done, ":nth-child(2n -1) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoclassSelector).toHaveBeenCalledWith(
              "nth-child",
              [2, -1],
            );
          });
        });

        it("can take 'an + b' argument", function (done) {
          parse(done, ":nth-child(2n + 3) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoclassSelector).toHaveBeenCalledWith(
              "nth-child",
              [2, 3],
            );
          });
        });

        it("can take 'an- b' argument", function (done) {
          parse(done, ":nth-child(2n- 1) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoclassSelector).toHaveBeenCalledWith(
              "nth-child",
              [2, 1],
            );
          });
        });

        it("reject '+ an- b' argument", function (done) {
          parse(done, ":nth-child(+ 2n- 1) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
          });
        });

        it("reject 'an- -b' argument", function (done) {
          parse(done, ":nth-child(2n- -1) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
          });
        });

        it("reject 'an-' argument", function (done) {
          parse(done, ":nth-child(2n-) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
          });
        });

        it("reject 'an -' argument", function (done) {
          parse(done, ":nth-child(2n -) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
          });
        });

        it("reject '+ n-b' argument ", function (done) {
          parse(done, ":nth-child(+ n-3) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
          });
        });

        it("reject 'n- +b' argument ", function (done) {
          parse(done, ":nth-child(n- +3) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
          });
        });

        it("reject 'n- -b' argument ", function (done) {
          parse(done, ":nth-child(n- -3) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
          });
        });

        it("reject 'n- -0' argument ", function (done) {
          parse(done, ":nth-child(n- -0) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
          });
        });

        it("reject '+ an-b' argument ", function (done) {
          parse(done, ":nth-child(+ 2n-3) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
          });
        });

        it("can take 'n-b' argument", function (done) {
          parse(done, ":nth-child(n-3) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoclassSelector).toHaveBeenCalledWith(
              "nth-child",
              [1, -3],
            );
          });
        });

        it("can take '+n-b' argument", function (done) {
          parse(done, ":nth-child(+n-3) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoclassSelector).toHaveBeenCalledWith(
              "nth-child",
              [1, -3],
            );
          });
        });

        it("can take 'an-b' argument", function (done) {
          parse(done, ":nth-child(2n-3) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoclassSelector).toHaveBeenCalledWith(
              "nth-child",
              [2, -3],
            );
          });
        });

        it("can take '-n-b argument", function (done) {
          parse(done, ":nth-child(-n-10) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoclassSelector).toHaveBeenCalledWith(
              "nth-child",
              [-1, -10],
            );
          });
        });

        it("reject invalid identifier", function (done) {
          parse(done, ":nth-child(foo) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
          });
        });

        it("can take 'b' argument", function (done) {
          parse(done, ":nth-child(3) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoclassSelector).toHaveBeenCalledWith(
              "nth-child",
              [0, 3],
            );
          });
        });

        it("can take '+b' argument", function (done) {
          parse(done, ":nth-child(+3) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoclassSelector).toHaveBeenCalledWith(
              "nth-child",
              [0, 3],
            );
          });
        });

        it("reject '+ b' argument", function (done) {
          parse(done, ":nth-child(+ 3) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
          });
        });

        it("can take '-b' argument", function (done) {
          parse(done, ":nth-child(-3) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoclassSelector).toHaveBeenCalledWith(
              "nth-child",
              [0, -3],
            );
          });
        });

        it("reject '- b' argument", function (done) {
          parse(done, ":nth-child(- 3) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
          });
        });

        it("error if no arguments are passed", function (done) {
          parse(done, ":nth-child() {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
          });
        });
      });
      describe(":not", function () {
        it("can take type selector", function (done) {
          parse(done, ":not(h1) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.startFuncWithSelector).toHaveBeenCalledWith("not");
            expect(handler.endFuncWithSelector).toHaveBeenCalled();
          });
        });
        it("can take attribute selector", function (done) {
          parse(done, ":not([attr='foobar']) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.startFuncWithSelector).toHaveBeenCalledWith("not");
            expect(handler.endFuncWithSelector).toHaveBeenCalled();
          });
        });
        it("can take class selector", function (done) {
          parse(done, ":not(.klass) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.startFuncWithSelector).toHaveBeenCalledWith("not");
            expect(handler.endFuncWithSelector).toHaveBeenCalled();
          });
        });
        it("can take ID selector", function (done) {
          parse(done, ":not(#content) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.startFuncWithSelector).toHaveBeenCalledWith("not");
            expect(handler.endFuncWithSelector).toHaveBeenCalled();
          });
        });
        it("can take pseudo-class selector", function (done) {
          parse(done, ":not(:lang(ja)) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.startFuncWithSelector).toHaveBeenCalledWith("not");
            expect(handler.pseudoclassSelector).toHaveBeenCalledWith("lang", [
              "ja",
            ]);
            expect(handler.endFuncWithSelector).toHaveBeenCalled();
          });
        });
        it("can take compound selector", function (done) {
          parse(done, ":not(div:lang(ja)) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.startFuncWithSelector).toHaveBeenCalledWith("not");
            expect(handler.pseudoclassSelector).toHaveBeenCalledWith("lang", [
              "ja",
            ]);
            expect(handler.endFuncWithSelector).toHaveBeenCalled();
          });
        });
        it("can take adjacent selector", function (done) {
          parse(done, ":not(div + .foo) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.startFuncWithSelector).toHaveBeenCalledWith("not");
            expect(handler.endFuncWithSelector).toHaveBeenCalled();
          });
        });
        it("error if selector is invalid", function (done) {
          parse(done, ":not(.) {}", function () {
            expect(handler.startFuncWithSelector).toHaveBeenCalledWith("not");
            expect(handler.error).toHaveBeenCalled();
            expect(handler.endFuncWithSelector).toHaveBeenCalled();
          });
        });
        it("can take multiple selectors", function (done) {
          parse(done, ":not(div, .foo) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.startFuncWithSelector).toHaveBeenCalledWith("not");
            expect(handler.endFuncWithSelector).toHaveBeenCalled();
          });
        });
      });
      describe("pseudo-class followed by +", function () {
        it("should be parsed successfully", function (done) {
          parse(done, "div:empty + div {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoclassSelector).toHaveBeenCalledWith(
              "empty",
              null,
            );
          });
        });
      });
    });

    describe("pseudoelement", function () {
      describe("::nth-frgment", function () {
        it("can take 'odd' argument", function (done) {
          parse(done, "div::nth-fragment(odd) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoelementSelector).toHaveBeenCalledWith(
              "nth-fragment",
              [2, 1],
            );
          });
        });

        it("can take 'even' argument", function (done) {
          parse(done, "div::nth-fragment(even) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoelementSelector).toHaveBeenCalledWith(
              "nth-fragment",
              [2, 0],
            );
          });
        });

        it("reject '+-an' argument", function (done) {
          parse(done, "div::nth-fragment(+-2n) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoelementSelector).not.toHaveBeenCalled();
          });
        });

        it("reject '+-n' argument", function (done) {
          parse(done, "div::nth-fragment(+-n) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoelementSelector).not.toHaveBeenCalled();
          });
        });

        it("reject '+ an' argument", function (done) {
          parse(done, "div::nth-fragment(+ 2n) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoelementSelector).not.toHaveBeenCalled();
          });
        });

        it("can take 'n -0' argument", function (done) {
          parse(done, "div::nth-fragment(n -0) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoelementSelector).toHaveBeenCalledWith(
              "nth-fragment",
              [1, 0],
            );
          });
        });

        it("reject 'n + -0' argument", function (done) {
          parse(done, "div::nth-fragment(n + -0) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoelementSelector).not.toHaveBeenCalled();
          });
        });

        it("reject 'n - -0' argument", function (done) {
          parse(done, "div::nth-fragment(n - -0) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoelementSelector).not.toHaveBeenCalled();
          });
        });

        it("can take 'n -a' argument", function (done) {
          parse(done, "div::nth-fragment(n -3) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoelementSelector).toHaveBeenCalledWith(
              "nth-fragment",
              [1, -3],
            );
          });
        });

        it("reject 'n + -a' argument", function (done) {
          parse(done, "div::nth-fragment(n + -3) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoelementSelector).not.toHaveBeenCalled();
          });
        });

        it("reject 'n - -a' argument", function (done) {
          parse(done, "div::nth-fragment(n - -3) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoelementSelector).not.toHaveBeenCalled();
          });
        });

        it("can take 'n+a' argument", function (done) {
          parse(done, "div::nth-fragment(n+3) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoelementSelector).toHaveBeenCalledWith(
              "nth-fragment",
              [1, 3],
            );
          });
        });

        it("can take 'n +a' argument", function (done) {
          parse(done, "div::nth-fragment(n +3) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoelementSelector).toHaveBeenCalledWith(
              "nth-fragment",
              [1, 3],
            );
          });
        });

        it("can take 'n + a' argument", function (done) {
          parse(done, "div::nth-fragment(n + 3) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoelementSelector).toHaveBeenCalledWith(
              "nth-fragment",
              [1, 3],
            );
          });
        });

        it("can take 'n - a' argument", function (done) {
          parse(done, "div::nth-fragment(n - 3) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoelementSelector).toHaveBeenCalledWith(
              "nth-fragment",
              [1, -3],
            );
          });
        });

        it("can take 'n - 0' argument", function (done) {
          parse(done, "div::nth-fragment(n - 0) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoelementSelector).toHaveBeenCalledWith(
              "nth-fragment",
              [1, 0],
            );
          });
        });

        it("reject 'n b' argument", function (done) {
          parse(done, "div::nth-fragment(n 2) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoelementSelector).not.toHaveBeenCalled();
          });
        });

        it("reject 'n + +0' argument", function (done) {
          parse(done, "div::nth-fragment(n + +0) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoelementSelector).not.toHaveBeenCalled();
          });
        });

        it("reject 'n + +b' argument", function (done) {
          parse(done, "div::nth-fragment(n + +3) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoelementSelector).not.toHaveBeenCalled();
          });
        });

        it("can take 'n' argument", function (done) {
          parse(done, "div::nth-fragment(n) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoelementSelector).toHaveBeenCalledWith(
              "nth-fragment",
              [1, 0],
            );
          });
        });

        it("can take 'n' argument with a plus sign", function (done) {
          parse(done, "div::nth-fragment(+n) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoelementSelector).toHaveBeenCalledWith(
              "nth-fragment",
              [1, 0],
            );
          });
        });

        it("can take 'an' argument", function (done) {
          parse(done, "div::nth-fragment(2n) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoelementSelector).toHaveBeenCalledWith(
              "nth-fragment",
              [2, 0],
            );
          });
        });

        it("can take '-an' argument", function (done) {
          parse(done, "div::nth-fragment(-2n) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoelementSelector).toHaveBeenCalledWith(
              "nth-fragment",
              [-2, 0],
            );
          });
        });

        it("can take 'an' argument with a plus sign", function (done) {
          parse(done, "div::nth-fragment(+2n) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoelementSelector).toHaveBeenCalledWith(
              "nth-fragment",
              [2, 0],
            );
          });
        });

        it("reject '+a n' argument", function (done) {
          parse(done, "div::nth-fragment(+2 n) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoelementSelector).not.toHaveBeenCalled();
          });
        });

        it("reject 'an+' argument", function (done) {
          parse(done, "div::nth-fragment(2n+) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoelementSelector).not.toHaveBeenCalled();
          });
        });

        it("reject 'an +' argument", function (done) {
          parse(done, "div::nth-fragment(2n +) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoelementSelector).not.toHaveBeenCalled();
          });
        });

        it("can take 'n' argument with a minus sign", function (done) {
          parse(done, "div::nth-fragment(-n) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoelementSelector).toHaveBeenCalledWith(
              "nth-fragment",
              [-1, 0],
            );
          });
        });

        it("reject '- n' argument", function (done) {
          parse(done, "div::nth-fragment(- n) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoelementSelector).not.toHaveBeenCalled();
          });
        });

        it("can take '-n+b' argument", function (done) {
          parse(done, "div::nth-fragment(-n+3) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoelementSelector).toHaveBeenCalledWith(
              "nth-fragment",
              [-1, 3],
            );
          });
        });

        it("can take 'an -b' argument", function (done) {
          parse(done, "div::nth-fragment(2n -1) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoelementSelector).toHaveBeenCalledWith(
              "nth-fragment",
              [2, -1],
            );
          });
        });

        it("can take 'an + b' argument", function (done) {
          parse(done, "div::nth-fragment(2n + 3) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoelementSelector).toHaveBeenCalledWith(
              "nth-fragment",
              [2, 3],
            );
          });
        });

        it("can take 'an- b' argument", function (done) {
          parse(done, "div::nth-fragment(2n- 1) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoelementSelector).toHaveBeenCalledWith(
              "nth-fragment",
              [2, 1],
            );
          });
        });

        it("reject '+ an- b' argument", function (done) {
          parse(done, "div::nth-fragment(+ 2n- 1) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoelementSelector).not.toHaveBeenCalled();
          });
        });

        it("reject 'an- -b' argument", function (done) {
          parse(done, "div::nth-fragment(2n- -1) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoelementSelector).not.toHaveBeenCalled();
          });
        });

        it("reject 'an-' argument", function (done) {
          parse(done, "div::nth-fragment(2n-) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoelementSelector).not.toHaveBeenCalled();
          });
        });

        it("reject 'an -' argument", function (done) {
          parse(done, "div::nth-fragment(2n -) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoelementSelector).not.toHaveBeenCalled();
          });
        });

        it("reject '+ n-b' argument ", function (done) {
          parse(done, "div::nth-fragment(+ n-3) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoelementSelector).not.toHaveBeenCalled();
          });
        });

        it("reject 'n- +b' argument ", function (done) {
          parse(done, "div::nth-fragment(n- +3) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoelementSelector).not.toHaveBeenCalled();
          });
        });

        it("reject 'n- -b' argument ", function (done) {
          parse(done, "div::nth-fragment(n- -3) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoelementSelector).not.toHaveBeenCalled();
          });
        });

        it("reject 'n- -0' argument ", function (done) {
          parse(done, "div::nth-fragment(n- -0) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoelementSelector).not.toHaveBeenCalled();
          });
        });

        it("reject '+ an-b' argument ", function (done) {
          parse(done, "div::nth-fragment(+ 2n-3) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoelementSelector).not.toHaveBeenCalled();
          });
        });

        it("can take 'n-b' argument", function (done) {
          parse(done, "div::nth-fragment(n-3) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoelementSelector).toHaveBeenCalledWith(
              "nth-fragment",
              [1, -3],
            );
          });
        });

        it("can take '+n-b' argument", function (done) {
          parse(done, "div::nth-fragment(+n-3) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoelementSelector).toHaveBeenCalledWith(
              "nth-fragment",
              [1, -3],
            );
          });
        });

        it("can take 'an-b' argument", function (done) {
          parse(done, "div::nth-fragment(2n-3) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoelementSelector).toHaveBeenCalledWith(
              "nth-fragment",
              [2, -3],
            );
          });
        });

        it("can take '-n-b argument", function (done) {
          parse(done, "div::nth-fragment(-n-10) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoelementSelector).toHaveBeenCalledWith(
              "nth-fragment",
              [-1, -10],
            );
          });
        });

        it("reject invalid identifier", function (done) {
          parse(done, "div::nth-fragment(foo) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoelementSelector).not.toHaveBeenCalled();
          });
        });

        it("can take 'b' argument", function (done) {
          parse(done, "div::nth-fragment(3) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoelementSelector).toHaveBeenCalledWith(
              "nth-fragment",
              [0, 3],
            );
          });
        });

        it("can take '+b' argument", function (done) {
          parse(done, "div::nth-fragment(+3) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoelementSelector).toHaveBeenCalledWith(
              "nth-fragment",
              [0, 3],
            );
          });
        });

        it("reject '+ b' argument", function (done) {
          parse(done, "div::nth-fragment(+ 3) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoelementSelector).not.toHaveBeenCalled();
          });
        });

        it("can take '-b' argument", function (done) {
          parse(done, "div::nth-fragment(-3) {}", function () {
            expect(handler.error).not.toHaveBeenCalled();
            expect(handler.pseudoelementSelector).toHaveBeenCalledWith(
              "nth-fragment",
              [0, -3],
            );
          });
        });

        it("reject '- b' argument", function (done) {
          parse(done, "div::nth-fragment(- 3) {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoelementSelector).not.toHaveBeenCalled();
          });
        });

        it("error if no arguments are passed", function (done) {
          parse(done, "div::nth-fragment() {}", function () {
            expect(handler.error).toHaveBeenCalled();
            expect(handler.pseudoelementSelector).not.toHaveBeenCalled();
          });
        });
      });
    });

    describe("supports parsing", function () {
      it("preserves whitespace-only custom property values in @supports tests", function (done) {
        parseSupports(done, "@supports (--a: ) {}", function (expr) {
          expect(expr.expr.name).toBe("--a");
          expect(expr.expr.value).toBe(" ");
          expect(expr.expr.toString()).toBe("(--a: )");
        });
      });

      it("preserves leading and trailing whitespace in custom property @supports values", function (done) {
        parseSupports(done, "@supports (--a:  red ) {}", function (expr) {
          expect(expr.expr.name).toBe("--a");
          expect(expr.expr.value).toBe("  red ");
          expect(expr.expr.toString()).toBe("(--a:  red )");
        });
      });
    });
  });
});
