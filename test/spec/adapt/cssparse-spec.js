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
 */
describe("cssparse", function() {
    describe("Parser", function() {
        describe("pseudoclass", function() {
            var handler = new adapt.cssparse.ParserHandler(null);

            beforeEach(function() {
                spyOn(handler, "error");
                spyOn(handler, "pseudoclassSelector");
                spyOn(handler, "startFuncWithSelector");
                spyOn(handler, "endFuncWithSelector");
            });

            function parse(done, text, fn) {
                var tokenizer = new adapt.csstok.Tokenizer(text, handler);

                adapt.task.start(function() {
                    adapt.cssparse.parseStylesheet(tokenizer, handler, null, null, null).then(function(result) {
                        expect(result).toBe(true);
                        fn();
                        done();
                    });
                });
            }

            describe(":lang", function() {
                it("takes one identifier as an argument", function(done) {
                    parse(done, ":lang(ja) {}", function() {
                        expect(handler.error).not.toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).toHaveBeenCalledWith("lang", ["ja"]);
                    });
                });

                it("error if no arguments are passed", function(done) {
                    parse(done, ":lang() {}", function() {
                        expect(handler.error).toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
                    });
                });

                it("error if invalid arguments are passed", function(done) {
                    parse(done, ":lang(2) {}", function() {
                        expect(handler.error).toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
                    });
                });
            });

            describe(":href-epub-type", function() {
                it("takes one identifier as an argument", function(done) {
                    parse(done, ":href-epub-type(foo) {}", function() {
                        expect(handler.error).not.toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).toHaveBeenCalledWith("href-epub-type", ["foo"]);
                    });
                });

                it("error if no arguments are passed", function(done) {
                    parse(done, ":href-epub-type() {}", function() {
                        expect(handler.error).toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
                    });
                });

                it("error if invalid arguments are passed", function(done) {
                    parse(done, ":href-epub-type(2) {}", function() {
                        expect(handler.error).toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
                    });
                });
            });

            describe(":nth-child", function() {
                it("can take 'odd' argument", function(done) {
                    parse(done, ":nth-child(odd) {}", function() {
                        expect(handler.error).not.toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).toHaveBeenCalledWith("nth-child", [2, 1]);
                    });
                });

                it("can take 'even' argument", function(done) {
                    parse(done, ":nth-child(even) {}", function() {
                        expect(handler.error).not.toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).toHaveBeenCalledWith("nth-child", [2, 0]);
                    });
                });

                it("reject '+-an' argument", function(done) {
                    parse(done, ":nth-child(+-2n) {}", function() {
                        expect(handler.error).toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
                    });
                });

                it("reject '+-n' argument", function(done) {
                    parse(done, ":nth-child(+-n) {}", function() {
                        expect(handler.error).toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
                    });
                });

                it("reject '+ an' argument", function(done) {
                    parse(done, ":nth-child(+ 2n) {}", function() {
                        expect(handler.error).toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
                    });
                });

                it("can take 'n -0' argument", function(done) {
                    parse(done, ":nth-child(n -0) {}", function() {
                        expect(handler.error).not.toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).toHaveBeenCalledWith("nth-child", [1, 0]);
                    });
                });

                it("reject 'n + -0' argument", function(done) {
                    parse(done, ":nth-child(n + -0) {}", function() {
                        expect(handler.error).toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
                    });
                });

                it("reject 'n - -0' argument", function(done) {
                    parse(done, ":nth-child(n - -0) {}", function() {
                        expect(handler.error).toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
                    });
                });

                it("can take 'n -a' argument", function(done) {
                    parse(done, ":nth-child(n -3) {}", function() {
                        expect(handler.error).not.toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).toHaveBeenCalledWith("nth-child", [1, -3]);
                    });
                });

                it("reject 'n + -a' argument", function(done) {
                    parse(done, ":nth-child(n + -3) {}", function() {
                        expect(handler.error).toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
                    });
                });

                it("reject 'n - -a' argument", function(done) {
                    parse(done, ":nth-child(n - -3) {}", function() {
                        expect(handler.error).toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
                    });
                });

                it("can take 'n+a' argument", function(done) {
                    parse(done, ":nth-child(n+3) {}", function() {
                        expect(handler.error).not.toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).toHaveBeenCalledWith("nth-child", [1, 3]);
                    });
                });

                it("can take 'n +a' argument", function(done) {
                    parse(done, ":nth-child(n +3) {}", function() {
                        expect(handler.error).not.toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).toHaveBeenCalledWith("nth-child", [1, 3]);
                    });
                });

                it("can take 'n + a' argument", function(done) {
                    parse(done, ":nth-child(n + 3) {}", function() {
                        expect(handler.error).not.toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).toHaveBeenCalledWith("nth-child", [1, 3]);
                    });
                });

                it("can take 'n - a' argument", function(done) {
                    parse(done, ":nth-child(n - 3) {}", function() {
                        expect(handler.error).not.toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).toHaveBeenCalledWith("nth-child", [1, -3]);
                    });
                });

                it("can take 'n - 0' argument", function(done) {
                    parse(done, ":nth-child(n - 0) {}", function() {
                        expect(handler.error).not.toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).toHaveBeenCalledWith("nth-child", [1, 0]);
                    });
                });

                it("reject 'n b' argument", function(done) {
                    parse(done, ":nth-child(n 2) {}", function() {
                        expect(handler.error).toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
                    });
                });

                it("reject 'n + +0' argument", function(done) {
                    parse(done, ":nth-child(n + +0) {}", function() {
                        expect(handler.error).toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
                    });
                });

                it("reject 'n + +b' argument", function(done) {
                    parse(done, ":nth-child(n + +3) {}", function() {
                        expect(handler.error).toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
                    });
                });

                it("can take 'n' argument", function(done) {
                    parse(done, ":nth-child(n) {}", function() {
                        expect(handler.error).not.toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).toHaveBeenCalledWith("nth-child", [1, 0]);
                    });
                });

                it("can take 'n' argument with a plus sign", function(done) {
                    parse(done, ":nth-child(+n) {}", function() {
                        expect(handler.error).not.toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).toHaveBeenCalledWith("nth-child", [1, 0]);
                    });
                });

                it("can take 'an' argument", function(done) {
                    parse(done, ":nth-child(2n) {}", function() {
                        expect(handler.error).not.toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).toHaveBeenCalledWith("nth-child", [2, 0]);
                    });
                });

                it("can take '-an' argument", function(done) {
                    parse(done, ":nth-child(-2n) {}", function() {
                        expect(handler.error).not.toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).toHaveBeenCalledWith("nth-child", [-2, 0]);
                    });
                });

                it("can take 'an' argument with a plus sign", function(done) {
                    parse(done, ":nth-child(+2n) {}", function() {
                        expect(handler.error).not.toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).toHaveBeenCalledWith("nth-child", [2, 0]);
                    });
                });

                it("reject '+a n' argument", function(done) {
                    parse(done, ":nth-child(+2 n) {}", function() {
                        expect(handler.error).toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
                    });
                });

                it("reject 'an+' argument", function(done) {
                    parse(done, ":nth-child(2n+) {}", function() {
                        expect(handler.error).toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
                    });
                });

                it("reject 'an +' argument", function(done) {
                    parse(done, ":nth-child(2n +) {}", function() {
                        expect(handler.error).toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
                    });
                });

                it("can take 'n' argument with a minus sign", function(done) {
                    parse(done, ":nth-child(-n) {}", function() {
                        expect(handler.error).not.toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).toHaveBeenCalledWith("nth-child", [-1, 0]);
                    });
                });

                it("reject '- n' argument", function(done) {
                    parse(done, ":nth-child(- n) {}", function() {
                        expect(handler.error).toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
                    });
                });

                it("can take '-n+b' argument", function(done) {
                    parse(done, ":nth-child(-n+3) {}", function() {
                        expect(handler.error).not.toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).toHaveBeenCalledWith("nth-child", [-1, 3]);
                    });
                });

                it("can take 'an -b' argument", function(done) {
                    parse(done, ":nth-child(2n -1) {}", function() {
                        expect(handler.error).not.toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).toHaveBeenCalledWith("nth-child", [2, -1]);
                    });
                });

                it("can take 'an + b' argument", function(done) {
                    parse(done, ":nth-child(2n + 3) {}", function() {
                        expect(handler.error).not.toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).toHaveBeenCalledWith("nth-child", [2, 3]);
                    });
                });

                it("can take 'an- b' argument", function(done) {
                    parse(done, ":nth-child(2n- 1) {}", function() {
                        expect(handler.error).not.toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).toHaveBeenCalledWith("nth-child", [2, 1]);
                    });
                });

                it("reject '+ an- b' argument", function(done) {
                    parse(done, ":nth-child(+ 2n- 1) {}", function() {
                        expect(handler.error).toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
                    });
                });

                it("reject 'an- -b' argument", function(done) {
                    parse(done, ":nth-child(2n- -1) {}", function() {
                        expect(handler.error).toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
                    });
                });

                it("reject 'an-' argument", function(done) {
                    parse(done, ":nth-child(2n-) {}", function() {
                        expect(handler.error).toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
                    });
                });

                it("reject 'an -' argument", function(done) {
                    parse(done, ":nth-child(2n -) {}", function() {
                        expect(handler.error).toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
                    });
                });

                it("reject '+ n-b' argument ", function(done) {
                    parse(done, ":nth-child(+ n-3) {}", function() {
                        expect(handler.error).toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
                    });
                });

                it("reject 'n- +b' argument ", function(done) {
                    parse(done, ":nth-child(n- +3) {}", function() {
                        expect(handler.error).toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
                    });
                });

                it("reject 'n- -b' argument ", function(done) {
                    parse(done, ":nth-child(n- -3) {}", function() {
                        expect(handler.error).toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
                    });
                });

                it("reject 'n- -0' argument ", function(done) {
                    parse(done, ":nth-child(n- -0) {}", function() {
                        expect(handler.error).toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
                    });
                });

                it("reject '+ an-b' argument ", function(done) {
                    parse(done, ":nth-child(+ 2n-3) {}", function() {
                        expect(handler.error).toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
                    });
                });

                it("can take 'n-b' argument", function(done) {
                    parse(done, ":nth-child(n-3) {}", function() {
                        expect(handler.error).not.toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).toHaveBeenCalledWith("nth-child", [1, -3]);
                    });
                });

                it("can take '+n-b' argument", function(done) {
                    parse(done, ":nth-child(+n-3) {}", function() {
                        expect(handler.error).not.toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).toHaveBeenCalledWith("nth-child", [1, -3]);
                    });
                });

                it("can take 'an-b' argument", function(done) {
                    parse(done, ":nth-child(2n-3) {}", function() {
                        expect(handler.error).not.toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).toHaveBeenCalledWith("nth-child", [2, -3]);
                    });
                });

                it("can take '-n-b argument", function(done) {
                    parse(done, ":nth-child(-n-10) {}", function() {
                        expect(handler.error).not.toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).toHaveBeenCalledWith("nth-child", [-1, -10]);
                    });
                });

                it("reject invalid identifier", function(done) {
                    parse(done, ":nth-child(foo) {}", function() {
                        expect(handler.error).toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
                    });
                });

                it("can take 'b' argument", function(done) {
                    parse(done, ":nth-child(3) {}", function() {
                        expect(handler.error).not.toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).toHaveBeenCalledWith("nth-child", [0, 3]);
                    });
                });

                it("can take '+b' argument", function(done) {
                    parse(done, ":nth-child(+3) {}", function() {
                        expect(handler.error).not.toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).toHaveBeenCalledWith("nth-child", [0, 3]);
                    });
                });

                it("reject '+ b' argument", function(done) {
                    parse(done, ":nth-child(+ 3) {}", function() {
                        expect(handler.error).toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
                    });
                });

                it("can take '-b' argument", function(done) {
                    parse(done, ":nth-child(-3) {}", function() {
                        expect(handler.error).not.toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).toHaveBeenCalledWith("nth-child", [0, -3]);
                    });
                });

                it("reject '- b' argument", function(done) {
                    parse(done, ":nth-child(- 3) {}", function() {
                        expect(handler.error).toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
                    });
                });

                it("error if no arguments are passed", function(done) {
                    parse(done, ":nth-child() {}", function() {
                        expect(handler.error).toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).not.toHaveBeenCalled();
                    });
                });
            });
            describe(":not", function() {
                it("can take type selector", function(done) {
                    parse(done, ":not(h1) {}", function() {
                        expect(handler.error).not.toHaveBeenCalled();
                        expect(handler.startFuncWithSelector).toHaveBeenCalledWith("not");
                        expect(handler.endFuncWithSelector).toHaveBeenCalled();
                    });
                });
                it("can take attribute selector", function(done) {
                    parse(done, ":not([attr='foobar']) {}", function() {
                        expect(handler.error).not.toHaveBeenCalled();
                        expect(handler.startFuncWithSelector).toHaveBeenCalledWith("not");
                        expect(handler.endFuncWithSelector).toHaveBeenCalled();
                    });
                });
                it("can take class selector", function(done) {
                    parse(done, ":not(.klass) {}", function() {
                        expect(handler.error).not.toHaveBeenCalled();
                        expect(handler.startFuncWithSelector).toHaveBeenCalledWith("not");
                        expect(handler.endFuncWithSelector).toHaveBeenCalled();
                    });
                });
                it("can take ID selector", function(done) {
                    parse(done, ":not(#content) {}", function() {
                        expect(handler.error).not.toHaveBeenCalled();
                        expect(handler.startFuncWithSelector).toHaveBeenCalledWith("not");
                        expect(handler.endFuncWithSelector).toHaveBeenCalled();
                    });
                });
                it("can take pseudo-class selector", function(done) {
                    parse(done, ":not(:lang(ja)) {}", function() {
                        expect(handler.error).not.toHaveBeenCalled();
                        expect(handler.startFuncWithSelector).toHaveBeenCalledWith("not");
                        expect(handler.pseudoclassSelector).toHaveBeenCalledWith("lang", ["ja"]);
                        expect(handler.endFuncWithSelector).toHaveBeenCalled();
                    });
                });
                it("can take compound selector", function(done) {
                    parse(done, ":not(div:lang(ja)) {}", function() {
                        expect(handler.error).not.toHaveBeenCalled();
                        expect(handler.startFuncWithSelector).toHaveBeenCalledWith("not");
                        expect(handler.pseudoclassSelector).toHaveBeenCalledWith("lang", ["ja"]);
                        expect(handler.endFuncWithSelector).toHaveBeenCalled();
                    });
                });
                it("error if selector is invalid", function(done) {
                    parse(done, ":not(.) {}", function() {
                        expect(handler.startFuncWithSelector).toHaveBeenCalledWith("not");
                        expect(handler.error).toHaveBeenCalled();
                        expect(handler.endFuncWithSelector).not.toHaveBeenCalled();
                    });
                });
                it("error if multiple selectors", function(done) {
                    parse(done, ":not(div, .foo) {}", function() {
                        expect(handler.startFuncWithSelector).toHaveBeenCalledWith("not");
                        expect(handler.error).toHaveBeenCalled();
                        expect(handler.endFuncWithSelector).not.toHaveBeenCalled();
                    });
                });
                it("error if adjacent selector is specified", function(done) {
                    parse(done, ":not(div + .foo) {}", function() {
                        expect(handler.startFuncWithSelector).toHaveBeenCalledWith("not");
                        expect(handler.error).toHaveBeenCalled();
                        expect(handler.endFuncWithSelector).not.toHaveBeenCalled();
                    });
                });
            });
            describe("pseudo-class followed by +", function() {
                it("should be parsed successfully", function(done) {
                    parse(done, "div:empty + div {}", function() {
                        expect(handler.error).not.toHaveBeenCalled();
                        expect(handler.pseudoclassSelector).toHaveBeenCalledWith("empty", null);
                    });
                });
            });
        });
    });
});
