describe("page", function() {
    var module = vivliostyle.page;
    var expected;

    beforeEach(function() {
        expected = {
            width: adapt.css.fullWidth,
            height: adapt.css.fullHeight,
            bleed: adapt.css.numericZero,
            bleedOffset: adapt.css.numericZero
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

        it("has the default bleed offset value when 'crop' and/or 'cross' value is specified in 'marks' property", function() {
           var resolved = module.resolvePageSize({
               marks: new adapt.csscasc.CascadeValue(adapt.css.ident.none, 0)
           });
            expect(resolved).toEqual(expected);

            expected.bleedOffset = module.defaultBleedOffset;

            resolved = module.resolvePageSize({
                bleed: new adapt.csscasc.CascadeValue(adapt.css.numericZero, 0), // if bleed=auto, it computes to 6pt (see below)
                marks: new adapt.csscasc.CascadeValue(adapt.css.ident.crop, 0)
            });
            expect(resolved).toEqual(expected);

            resolved = module.resolvePageSize({
                marks: new adapt.csscasc.CascadeValue(adapt.css.ident.cross, 0)
            });
            expect(resolved).toEqual(expected);

            resolved = module.resolvePageSize({
                bleed: new adapt.csscasc.CascadeValue(adapt.css.numericZero, 0), // if bleed=auto, it computes to 6pt (see below)
                marks: new adapt.csscasc.CascadeValue(
                    new adapt.css.SpaceList([adapt.css.ident.crop, adapt.css.ident.cross]), 0)
            });
            expect(resolved).toEqual(expected);
        });

        it("has the bleed value specified in 'bleed' property when it is specified with a concrete length", function() {
            var resolved = module.resolvePageSize({
                bleed: new adapt.csscasc.CascadeValue(new adapt.css.Numeric(5, "mm"), 0)
            });
            expected.bleed = new adapt.css.Numeric(5, "mm");
            expect(resolved).toEqual(expected);
        });

        it("'auto' bleed value computes to 6pt if 'marks' has 'crop'", function() {
            expected.bleedOffset = module.defaultBleedOffset;
            expected.bleed = new adapt.css.Numeric(6, "pt");

            var resolved = module.resolvePageSize({
                marks: new adapt.csscasc.CascadeValue(adapt.css.ident.crop, 0)
            });
            expect(resolved).toEqual(expected);

            resolved = module.resolvePageSize({
                bleed: new adapt.csscasc.CascadeValue(adapt.css.ident.auto, 0),
                marks: new adapt.csscasc.CascadeValue(adapt.css.ident.crop, 0)
            });
            expect(resolved).toEqual(expected);
        });

        it("'auto' bleed value computes to zero if 'marks' does not has 'crop'", function() {
            var resolved = module.resolvePageSize({
                bleed: new adapt.csscasc.CascadeValue(adapt.css.ident.auto, 0),
                marks: new adapt.csscasc.CascadeValue(adapt.css.ident.cross, 0)
            });
            expected.bleedOffset = module.defaultBleedOffset;
            expected.bleed = adapt.css.numericZero;
            expect(resolved).toEqual(expected);
        });
    });
});
