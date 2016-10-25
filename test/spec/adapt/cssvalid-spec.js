describe("cssvalid", function() {
    describe("ValidatorSet", function() {
        it("should parse simple validator and simple rule", function(done) {
            var validatorSet = new adapt.cssvalid.ValidatorSet();
            validatorSet.initBuiltInValidators();
            validatorSet.parse("foo-or = bar | [ baz || biz ];");
            var handler = new adapt.csscasc.CascadeParserHandler(null, null, null, null, null,
                validatorSet, true);
            var warnListener = jasmine.createSpy("warn listener");
            vivliostyle.logging.logger.addListener(vivliostyle.logging.LogLevel.WARN, warnListener);
            adapt.task.start(function() {
                adapt.cssparse.parseStylesheetFromText(
                    ".test { foo-or: bar; }\n.test2 { foo-or: baz biz; }", handler, null, null, null).then(
                    function(result) {
                        expect(result).toBe(true);
                        expect(warnListener).not.toHaveBeenCalled();
                        done();
                    });
            });
        });
        it("should parse simple validator that compare values case-insensitively.", function(done) {
            var validatorSet = new adapt.cssvalid.ValidatorSet();
            validatorSet.initBuiltInValidators();
            validatorSet.parse("foo = bAr | Baz | bIZ ;");
            var handler = new adapt.csscasc.CascadeParserHandler(null, null, null, null, null,
                validatorSet, true);
            var warnListener = jasmine.createSpy("warn listener");
            vivliostyle.logging.logger.addListener(vivliostyle.logging.LogLevel.WARN, warnListener);
            adapt.task.start(function() {
                adapt.cssparse.parseStylesheetFromText(
                    ".test { foo: bar; }\n" +
                    ".test2 { foo: BAR; }" +
                    ".test3 { foo: Bar; }" +
                    ".test4 { foo: bAr; }" +
                    ".test5 { foo: baR; }" +
                    ".test6 { foo: BAZ; }" +
                    ".test6 { foo: biz; }" +
                    "", handler, null, null, null).then(
                    function(result) {
                        expect(result).toBe(true);
                        expect(warnListener).not.toHaveBeenCalled();
                        done();
                    });
            });
        });
        it("should parse validator and space rule", function(done) {
            var validatorSet = new adapt.cssvalid.ValidatorSet();
            validatorSet.initBuiltInValidators();
            validatorSet.parse("foo = SPACE(IDENT+);");
            var handler = new adapt.csscasc.CascadeParserHandler(null, null, null, null, null,
                validatorSet, true);
            var warnListener = jasmine.createSpy("warn listener");
            vivliostyle.logging.logger.addListener(vivliostyle.logging.LogLevel.WARN, warnListener);
            adapt.task.start(function() {
                adapt.cssparse.parseStylesheetFromText(
                    ".test { foo: bar; }\n.test2 { foo: bar baz boo; }", handler, null, null, null).then(
                    function(result) {
                        expect(result).toBe(true);
                        expect(warnListener).not.toHaveBeenCalled();
                        done();
                    });
            });
        });

        it("should parse validator and comma rule", function(done) {
            var validatorSet = new adapt.cssvalid.ValidatorSet();
            validatorSet.initBuiltInValidators();
            validatorSet.parse("foo = COMMA( IDENT+ );");
            var handler = new adapt.csscasc.CascadeParserHandler(null, null, null, null, null,
                validatorSet, true);
            var warnListener = jasmine.createSpy("warn listener");
            vivliostyle.logging.logger.addListener(vivliostyle.logging.LogLevel.WARN, warnListener);
            adapt.task.start(function() {
                adapt.cssparse.parseStylesheetFromText(
                    ".test { foo: bar,baz; }\n .test2{ foo: bar; }", handler, null, null, null).then(
                    function(result) {
                        expect(result).toBe(true);
                        expect(warnListener).not.toHaveBeenCalled();
                        done();
                    });
            });
        });

        it("should parse validator and complex comma rule", function(done) {
            var validatorSet = new adapt.cssvalid.ValidatorSet();
            validatorSet.initBuiltInValidators();
            validatorSet.parse("foo-comma = none | COMMA( [ bar | baz ]+ );");
            var handler = new adapt.csscasc.CascadeParserHandler(null, null, null, null, null,
                validatorSet, true);
            var warnListener = jasmine.createSpy("warn listener");
            vivliostyle.logging.logger.addListener(vivliostyle.logging.LogLevel.WARN, warnListener);
            adapt.task.start(function() {
                adapt.cssparse.parseStylesheetFromText(
                    ".test { foo-comma: none; }\n.test2 { foo-comma: bar,baz; }\n .test3 { foo-comma: bar; }", handler, null, null, null).then(
                    function(result) {
                        expect(result).toBe(true);
                        expect(warnListener).not.toHaveBeenCalled();
                        done();
                    });
            });
        });

        it("should parse validator and complex space rule", function(done) {
            var validatorSet = new adapt.cssvalid.ValidatorSet();
            validatorSet.initBuiltInValidators();
            validatorSet.parse("spacefoo = none | SPACE( [ bar | baz ]+ );");
            var handler = new adapt.csscasc.CascadeParserHandler(null, null, null, null, null,
                validatorSet, true);
            var warnListener = jasmine.createSpy("warn listener");
            vivliostyle.logging.logger.addListener(vivliostyle.logging.LogLevel.WARN, warnListener);
            adapt.task.start(function() {
                adapt.cssparse.parseStylesheetFromText(
                    ".test { spacefoo: none; }\n.test2 { spacefoo: bar baz; }\n .test3 { spacefoo: bar; }", handler, null, null, null).then(
                    function(result) {
                        expect(result).toBe(true);
                        expect(warnListener).not.toHaveBeenCalled();
                        done();
                    });
            });
        });
        it("should parse rule that contains function", function(done) {
            var validatorSet = new adapt.cssvalid.ValidatorSet();
            validatorSet.initBuiltInValidators();
            var validation_txt =
                "THE_VALUE = SPACE(IDENT+);\n" +
                "PRED_VALUE = [ fff | SPACE(bb bz)];" +
                "THE_FUNCTION = the-function(PRED_VALUE? THE_VALUE+);\n" +
                "AC_VALUES = STRING | THE_FUNCTION;" +
                "accept-function = COMMA(AC_VALUES+);";

            validatorSet.parse(validation_txt);
            var handler = new adapt.csscasc.CascadeParserHandler(null, null, null, null, null,
                validatorSet, true);
            var warnListener = jasmine.createSpy("warn listener");
            vivliostyle.logging.logger.addListener(vivliostyle.logging.LogLevel.WARN, warnListener);
            adapt.task.start(function() {
                adapt.cssparse.parseStylesheetFromText(
                    ".test { accept-function: the-function(foo bar); }\n" +
                    ".test2 { accept-function: the-function(foo bar, bar baz); }\n" +
                    ".test3 { accept-function: the-function(fff, foo bar, bar baz); }\n" +
                    ".test4 { accept-function: the-function(bb bz, foo bar, bar baz); }"
                    , handler, null, null, null).then(
                    function(result) {
                        expect(result).toBe(true);
                        expect(warnListener).not.toHaveBeenCalled();
                        done();
                    });
            });
        });
        it("should parse rule that contains slash", function(done) {
            var validatorSet = new adapt.cssvalid.ValidatorSet();
            validatorSet.initBuiltInValidators();
            validatorSet.parse("foo = bar( SPACE( POS_NUM [ SLASH POS_NUM ]? ) );");
            var handler = new adapt.csscasc.CascadeParserHandler(null, null, null, null, null,
                validatorSet, true);
            var warnListener = jasmine.createSpy("warn listener");
            vivliostyle.logging.logger.addListener(vivliostyle.logging.LogLevel.WARN, warnListener);
            adapt.task.start(function() {
                adapt.cssparse.parseStylesheetFromText(
                    ".test { foo: bar( 10 / 10 ) ; }\n" +
                    ".test2 { foo: bar( 10 ) ; }", handler, null, null, null).then(
                    function(result) {
                        expect(result).toBe(true);
                        expect(warnListener).not.toHaveBeenCalled();
                        done();
                    });
            });
        });
        it("should parse font shorthand rule", function(done) {
            var validatorSet = new adapt.cssvalid.ValidatorSet();
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
                "font = FONT font-style font-variant font-weight font-stretch ;");
            var handler = new adapt.csscasc.CascadeParserHandler(null, null, null, null, null,
                validatorSet, true);
            var warnListener = jasmine.createSpy("warn listener");
            vivliostyle.logging.logger.addListener(vivliostyle.logging.LogLevel.WARN, warnListener);
            adapt.task.start(function() {
                adapt.cssparse.parseStylesheetFromText(
                    ".test  { font: 80% sans-serif ; }\n" +
                    ".test2 { font: 12px/14px \"Times\" ; }\n" +
                    ".test3 { font: oblique small-caps bold 12px/14px \"Times\" ; }\n" +
                    ".test4 { font: small-caps oblique 12px \"Times\" ; }\n" +
                    ".test5 { font: oblique small-caps bold ultra-condensed 12px/14px \"Times\" ; }\n" +
                    ".test6 { font: small-caps wider oblique 12px \"Times\" ; }\n" +
                    ".test7 { font: status-bar ; }",
                    handler, null, null, null).then(
                    function(result) {
                        expect(result).toBe(true);
                        expect(warnListener).not.toHaveBeenCalled();
                        done();
                    });
            });
        });
    });
});
