describe("csscasc", function() {
    describe("CascadeParserHandler", function() {
        describe("simpleProperty", function() {
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
    });
});
