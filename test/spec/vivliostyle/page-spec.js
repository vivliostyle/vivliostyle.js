describe("page", function() {
    var module = vivliostyle.page;
    var expected;

    beforeEach(function() {
        expected = {
            width: adapt.css.fullWidth,
            height: adapt.css.fullHeight
        };
    });

    describe("resolvePageSize", function() {
        it("has fullWidth and fullHeight when nothing specified", function() {
            var resolved = module.resolvePageSize({});
            expect(resolved).toEqual(expected);
        });

        it("has fullWidth and fullHeight when size=auto", function() {
            var resolved = module.resolvePageSize({
                size: new adapt.csscasc.CascadeValue(adapt.css.ident.auto, 0)
            });
            expect(resolved).toEqual(expected);
        });

        it("has the same width and height when only one length is specified in size property", function() {
            var resolved = module.resolvePageSize({
                size: new adapt.csscasc.CascadeValue(new adapt.css.Numeric(10, "cm"), 0)
            });
            expected.width = new adapt.css.Numeric(10, "cm");
            expected.height = new adapt.css.Numeric(10, "cm");
            expect(resolved).toEqual(expected);
        });

        it("has the width and height specified in size property", function() {
            var resolved = module.resolvePageSize({
                size: new adapt.csscasc.CascadeValue(
                    new adapt.css.SpaceList([new adapt.css.Numeric(10, "cm"), new adapt.css.Numeric(12, "cm")]), 0)
            });
            expected.width = new adapt.css.Numeric(10, "cm");
            expected.height = new adapt.css.Numeric(12, "cm");
            expect(resolved).toEqual(expected);
        });

        it("has fullWidth and fullHeight when portrait of landscape is specified alone in size property", function() {
            var resolved = module.resolvePageSize({
                size: new adapt.csscasc.CascadeValue(adapt.css.getName("portrait"), 0)
            });
            expect(resolved).toEqual(expected);

            resolved = module.resolvePageSize({
                size: new adapt.csscasc.CascadeValue(adapt.css.ident.landscape, 0)
            });
            expect(resolved).toEqual(expected);
        });

        it("has the width and height of the paper size specified in size property", function() {
            var resolved = module.resolvePageSize({
                size: new adapt.csscasc.CascadeValue(new adapt.css.getName("A5"), 0)
            });
            expected.width = new adapt.css.Numeric(148, "mm");
            expected.height = new adapt.css.Numeric(210, "mm");
            expect(resolved).toEqual(expected);

            resolved = module.resolvePageSize({
                size: new adapt.csscasc.CascadeValue(
                    new adapt.css.SpaceList([new adapt.css.getName("A5"), new adapt.css.getName("portrait")]), 0)
            });
            expected.width = new adapt.css.Numeric(148, "mm");
            expected.height = new adapt.css.Numeric(210, "mm");
            expect(resolved).toEqual(expected);

            resolved = module.resolvePageSize({
                size: new adapt.csscasc.CascadeValue(
                    new adapt.css.SpaceList([new adapt.css.getName("A5"), adapt.css.ident.landscape]), 0)
            });
            expected.width = new adapt.css.Numeric(210, "mm");
            expected.height = new adapt.css.Numeric(148, "mm");
            expect(resolved).toEqual(expected);
        });
    });
});
