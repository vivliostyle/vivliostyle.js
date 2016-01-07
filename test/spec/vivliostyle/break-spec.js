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
});
