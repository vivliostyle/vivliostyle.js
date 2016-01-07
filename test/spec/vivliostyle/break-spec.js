describe("break", function() {
    describe("convertPageBreakAliases", function() {
        var convertPageBreakAliases = vivliostyle.break.convertPageBreakAliases;

        it("converts page-break-before/after to break-before/after", function() {
            ["before", "after"].forEach(function(side) {
                var breakProp = "break-" + side;
                var original = {
                    "name": "page-" + breakProp,
                    "important": false
                };
                var converted;

                original["value"] = adapt.css.ident.auto;
                converted = convertPageBreakAliases(original);
                expect(converted["name"]).toBe(breakProp);
                expect(converted["value"]).toBe(adapt.css.ident.auto);
                expect(converted["important"]).toBe(false);

                original["value"] = adapt.css.ident.left;
                converted = convertPageBreakAliases(original);
                expect(converted["name"]).toBe(breakProp);
                expect(converted["value"]).toBe(adapt.css.ident.left);

                original["value"] = adapt.css.ident.right;
                converted = convertPageBreakAliases(original);
                expect(converted["name"]).toBe(breakProp);
                expect(converted["value"]).toBe(adapt.css.ident.right);

                original["value"] = adapt.css.ident.avoid;
                converted = convertPageBreakAliases(original);
                expect(converted["name"]).toBe(breakProp);
                expect(converted["value"]).toBe(adapt.css.ident.avoid);

                original["value"] = adapt.css.ident.always;
                converted = convertPageBreakAliases(original);
                expect(converted["name"]).toBe(breakProp);
                expect(converted["value"]).toBe(adapt.css.ident.page);
            });
        });

        it("converts page-break-inside to break-inside", function() {
            var original = {
                "name": "page-break-inside",
                "important": false
            };
            var converted;

            original["value"] = adapt.css.ident.auto;
            converted = convertPageBreakAliases(original);
            expect(converted["name"]).toBe("break-inside");
            expect(converted["value"]).toBe(adapt.css.ident.auto);
            expect(converted["important"]).toBe(false);

            original["value"] = adapt.css.ident.avoid;
            converted = convertPageBreakAliases(original);
            expect(converted["name"]).toBe("break-inside");
            expect(converted["value"]).toBe(adapt.css.ident.avoid);
        });
    });

    describe("resolveEffectiveBreakValue", function() {
        var resolveEffectiveBreakValue = vivliostyle.break.resolveEffectiveBreakValue;

        it("If one of the argument is null, return the other", function() {
            expect(resolveEffectiveBreakValue(null, null)).toBe(null);
            expect(resolveEffectiveBreakValue(null, "avoid-page")).toBe("avoid-page");
            expect(resolveEffectiveBreakValue("avoid-region", null)).toBe("avoid-region");
        });

        it("returns a forced break value if present", function() {
            expect(resolveEffectiveBreakValue("avoid-page", "region")).toBe("region");
            expect(resolveEffectiveBreakValue("region", "avoid-page")).toBe("region");
        });

        it("returns the second one if both are forced break values", function() {
            expect(resolveEffectiveBreakValue("page", "column")).toBe("column");
        });

        it("returns an avoid break value if the other is auto", function() {
            expect(resolveEffectiveBreakValue("avoid-region", "auto")).toBe("avoid-region");
            expect(resolveEffectiveBreakValue("auto", "avoid-region")).toBe("avoid-region");
        });

        it("returns the second one if both are avoid break values", function() {
            expect(resolveEffectiveBreakValue("avoid-page", "avoid-column")).toBe("avoid-column");
        });

        it("returns auto if both are auto", function() {
            expect(resolveEffectiveBreakValue("auto", "auto")).toBe("auto");
        });
    });
});
