describe("csscasc", function() {
    describe("CascadeParserHandler", function() {
        describe("simpleProperty", function() {
            vivliostyle.test.util.mock.plugin.setup();

            it("convert property declaration by calling functions registered to 'SIMPLE_PROPERTY' hook", function() {
                function hook1(original) {
                    return {
                        "name": original["name"] + "1",
                        "value": adapt.css.getName(original["value"].stringValue() + "1"),
                        "important": original["important"]
                    };
                }

                function hook2(original) {
                    return {
                        "name": original["name"] + "2",
                        "value": adapt.css.getName(original["value"].stringValue() + "2"),
                        "important": !original["important"]
                    };
                }

                var handler = new adapt.csscasc.CascadeParserHandler();
                var style = handler.elementStyle = {};
                handler.simpleProperty("foo", adapt.css.getName("bar"), false);
                var originalPriority = style["foo"].priority;
                expect(style["foo"].value).toBe(adapt.css.getName("bar"));

                vivliostyle.plugin.registerHook("SIMPLE_PROPERTY", hook1);
                style = handler.elementStyle = {};
                handler.simpleProperty("foo", adapt.css.getName("bar"), false);
                expect("foo" in style).toBe(false);
                expect(style["foo1"].value).toBe(adapt.css.getName("bar1"));
                expect(style["foo1"].priority).toBe(originalPriority);

                vivliostyle.plugin.registerHook("SIMPLE_PROPERTY", hook2);
                style = handler.elementStyle = {};
                handler.simpleProperty("foo", adapt.css.getName("bar"), false);
                expect("foo1" in style).toBe(false);
                expect(style["foo12"].value).toBe(adapt.css.getName("bar12"));
                expect(style["foo12"].priority).not.toBe(originalPriority);
            });
        });

        describe("attributeSelector", function() {
            var handler;

            beforeEach(function() {
                handler = new adapt.csscasc.CascadeParserHandler();
                handler.startSelectorRule();
            });

            describe("Attribute presence selector", function() {
                it("use CheckAttributePresentAction when the operator is EOF (no operator)", function() {
                    handler.attributeSelector("ns", "foo", adapt.csstok.TokenType.EOF, null);

                    expect(handler.chain.length).toBe(1);
                    var action = handler.chain[0];
                    expect(action).toEqual(jasmine.any(adapt.csscasc.CheckAttributePresentAction));
                    expect(action.ns).toBe("ns");
                    expect(action.name).toBe("foo");
                });
            });

            describe("Attribute equality selector", function() {
                it("use CheckAttributeEqAction when the operator is '='", function() {
                    handler.attributeSelector("ns", "foo", adapt.csstok.TokenType.EQ, "bar");

                    expect(handler.chain.length).toBe(1);
                    var action = handler.chain[0];
                    expect(action).toEqual(jasmine.any(adapt.csscasc.CheckAttributeEqAction));
                    expect(action.ns).toBe("ns");
                    expect(action.name).toBe("foo");
                    expect(action.value).toBe("bar");
                });
            });

            describe("~= attribute selector", function() {
                it("use CheckAttributeRegExpAction when the value is not empty and contains no whitespaces", function() {
                    handler.attributeSelector("ns", "foo", adapt.csstok.TokenType.TILDE_EQ, "bar");

                    expect(handler.chain.length).toBe(1);
                    var action = handler.chain[0];
                    expect(action).toEqual(jasmine.any(adapt.csscasc.CheckAttributeRegExpAction));
                    expect(action.ns).toBe("ns");
                    expect(action.name).toBe("foo");
                    var regexp = action.regexp;
                    expect("bar".match(regexp)).toBeTruthy();
                    expect("a bar b".match(regexp)).toBeTruthy();
                    expect("abar b".match(regexp)).toBeFalsy();
                });

                it("represents nothing when the value contains whitespaces", function() {
                    handler.attributeSelector("ns", "foo", adapt.csstok.TokenType.TILDE_EQ, "b c");

                    expect(handler.chain.length).toBe(1);
                    var action = handler.chain[0];
                    expect(action).toEqual(jasmine.any(adapt.csscasc.CheckConditionAction));
                    expect(action.condition).toBe("");
                });

                it("represents nothing when the value is an empty string", function() {
                    handler.attributeSelector("ns", "foo", adapt.csstok.TokenType.TILDE_EQ, "");

                    expect(handler.chain.length).toBe(1);
                    var action = handler.chain[0];
                    expect(action).toEqual(jasmine.any(adapt.csscasc.CheckConditionAction));
                    expect(action.condition).toBe("");
                });
            });

            describe("|= attribute selector", function() {
                it("use CheckAttributeRegExpAction when the value is a non-empty string", function() {
                    handler.attributeSelector("ns", "foo", adapt.csstok.TokenType.BAR_EQ, "bar");

                    expect(handler.chain.length).toBe(1);
                    var action = handler.chain[0];
                    expect(action).toEqual(jasmine.any(adapt.csscasc.CheckAttributeRegExpAction));
                    expect(action.ns).toBe("ns");
                    expect(action.name).toBe("foo");
                    var regexp = action.regexp;
                    expect("bar".match(regexp)).toBeTruthy();
                    expect("bar-b".match(regexp)).toBeTruthy();
                    expect("barb".match(regexp)).toBeFalsy();
                    expect("a-bar-b".match(regexp)).toBeFalsy();
                });

                it("also use CheckAttributeRegExpAction when the value is an empty string", function() {
                    handler.attributeSelector("ns", "foo", adapt.csstok.TokenType.BAR_EQ, "");

                    expect(handler.chain.length).toBe(1);
                    var action = handler.chain[0];
                    expect(action).toEqual(jasmine.any(adapt.csscasc.CheckAttributeRegExpAction));
                    expect(action.ns).toBe("ns");
                    expect(action.name).toBe("foo");
                    var regexp = action.regexp;
                    expect("-bar".match(regexp)).toBeTruthy();
                    expect("-".match(regexp)).toBeTruthy();
                    expect("bar-b".match(regexp)).toBeFalsy();
                });
            });

            describe("^= attribute selector", function() {
                it("use CheckAttributeRegExpAction when the value is a non-empty string", function() {
                    handler.attributeSelector("ns", "foo", adapt.csstok.TokenType.HAT_EQ, "bar");

                    expect(handler.chain.length).toBe(1);
                    var action = handler.chain[0];
                    expect(action).toEqual(jasmine.any(adapt.csscasc.CheckAttributeRegExpAction));
                    expect(action.ns).toBe("ns");
                    expect(action.name).toBe("foo");
                    var regexp = action.regexp;
                    expect("bar".match(regexp)).toBeTruthy();
                    expect("bar-b".match(regexp)).toBeTruthy();
                    expect("barb".match(regexp)).toBeTruthy();
                    expect("a-bar-b".match(regexp)).toBeFalsy();
                });

                it("represents nothing when the value is an empty string", function() {
                    handler.attributeSelector("ns", "foo", adapt.csstok.TokenType.HAT_EQ, "");

                    expect(handler.chain.length).toBe(1);
                    var action = handler.chain[0];
                    expect(action).toEqual(jasmine.any(adapt.csscasc.CheckConditionAction));
                    expect(action.condition).toBe("");
                });
            });

            describe("$= attribute selector", function() {
                it("use CheckAttributeRegExpAction when the value is a non-empty string", function() {
                    handler.attributeSelector("ns", "foo", adapt.csstok.TokenType.DOLLAR_EQ, "bar");

                    expect(handler.chain.length).toBe(1);
                    var action = handler.chain[0];
                    expect(action).toEqual(jasmine.any(adapt.csscasc.CheckAttributeRegExpAction));
                    expect(action.ns).toBe("ns");
                    expect(action.name).toBe("foo");
                    var regexp = action.regexp;
                    expect("bar".match(regexp)).toBeTruthy();
                    expect("b-bar".match(regexp)).toBeTruthy();
                    expect("bbar".match(regexp)).toBeTruthy();
                    expect("bbarb".match(regexp)).toBeFalsy();
                });

                it("represents nothing when the value is an empty string", function() {
                    handler.attributeSelector("ns", "foo", adapt.csstok.TokenType.DOLLAR_EQ, "");

                    expect(handler.chain.length).toBe(1);
                    var action = handler.chain[0];
                    expect(action).toEqual(jasmine.any(adapt.csscasc.CheckConditionAction));
                    expect(action.condition).toBe("");
                });
            });

            describe("*= attribute selector", function() {
                it("use CheckAttributeRegExpAction when the value is a non-empty string", function() {
                    handler.attributeSelector("ns", "foo", adapt.csstok.TokenType.STAR_EQ, "bar");

                    expect(handler.chain.length).toBe(1);
                    var action = handler.chain[0];
                    expect(action).toEqual(jasmine.any(adapt.csscasc.CheckAttributeRegExpAction));
                    expect(action.ns).toBe("ns");
                    expect(action.name).toBe("foo");
                    var regexp = action.regexp;
                    expect("bar".match(regexp)).toBeTruthy();
                    expect("a bar b".match(regexp)).toBeTruthy();
                    expect("abarb".match(regexp)).toBeTruthy();
                    expect("foo".match(regexp)).toBeFalsy();
                });

                it("represents nothing when the value is an empty string", function() {
                    handler.attributeSelector("ns", "foo", adapt.csstok.TokenType.STAR_EQ, "");

                    expect(handler.chain.length).toBe(1);
                    var action = handler.chain[0];
                    expect(action).toEqual(jasmine.any(adapt.csscasc.CheckConditionAction));
                    expect(action.condition).toBe("");
                });
            });

            it("represents nothing when an unsupported operator is passed", function() {
                handler.attributeSelector("ns", "foo", null, "bar");

                expect(handler.chain.length).toBe(1);
                var action = handler.chain[0];
                expect(action).toEqual(jasmine.any(adapt.csscasc.CheckConditionAction));
                expect(action.condition).toBe("");
            });
        })
    });
});
