describe("cssparse", function() {
    describe("Parser", function() {
        describe("pseudoclass", function() {
            var handler = new adapt.cssparse.ParserHandler(null);

            beforeEach(function() {
                spyOn(handler, "error");
                spyOn(handler, "pseudoclassSelector");
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
                    })
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

        });
    });
});
