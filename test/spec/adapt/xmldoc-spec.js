describe("xmldoc", function() {

    describe("parseAndReturnNullIfError", function() {
        it("uses a parser passed by an optional argument", function() {
            var parser = {parseFromString: function() {}};
            spyOn(parser, "parseFromString");

            adapt.xmldoc.parseAndReturnNullIfError("<test>", "text/xml", parser);

            expect(parser.parseFromString).toHaveBeenCalledWith("<test>", "text/xml");
        });

        it("returns a Document object when no error occurs", function() {
            var d = adapt.xmldoc.parseAndReturnNullIfError("<a>a<b></b></a>", "text/xml");

            expect(d).toBeTruthy();
            expect(d.documentElement.localName).toBe("a");
            expect(d.documentElement.childNodes.length).toBe(2);
            expect(d.documentElement.firstChild.textContent).toBe("a");
            expect(d.documentElement.childNodes[1].localName).toBe("b");
        });

        it("returns null when a parse error occurs", function() {
            expect(adapt.xmldoc.parseAndReturnNullIfError("<test", "text/xml")).toBe(null);
            expect(adapt.xmldoc.parseAndReturnNullIfError("<test><t></test>", "text/xml")).toBe(null);
        });
    });

});
