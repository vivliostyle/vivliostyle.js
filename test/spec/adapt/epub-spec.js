describe("epub", function() {
    describe("OPFDoc", function() {
        describe("OPFDocumentURLTransformer", function() {
            var opfDoc = new adapt.epub.OPFDoc(null, null);
            opfDoc.items = [
                {src: "http://example.com:8000/foo/bar1.html"},
                {src: "http://example.com:8000/foo/bar2.html"}
            ];
            var transformer = opfDoc.createDocumentURLTransformer();

            var illegalCharRegexp = /[^-a-zA-Z0-9_:]/;

            describe("transformFragment / restoreURL", function() {
                var baseURL = "http://base.org:9000/baz.html";
                var fragment = "some-fragment";
                var transformed = transformer.transformFragment(fragment, baseURL);

                it("transforms a pair of a fragment and a base URL into an XML ID string", function() {
                    expect(transformed).not.toMatch(illegalCharRegexp);
                    expect(transformed.indexOf(adapt.epub.transformedIdPrefix)).toBe(0);
                });

                it("restores a pair of the original base URL and the original fragment", function() {
                    var restored = transformer.restoreURL(transformed);
                    expect(restored).toEqual([baseURL, fragment]);

                    restored = transformer.restoreURL("#" + transformed);
                    expect(restored).toEqual([baseURL, fragment]);
                });
            });

            describe("transformURL", function() {
                var fragment = "some-fragment";

                it("transforms a URL internal to the document into an XML ID string", function() {
                    var baseURL = opfDoc.items[1].src;

                    var transformed = transformer.transformURL("#" + fragment, baseURL);
                    expect(transformed.charAt(0)).toBe("#");
                    expect(transformed.substring(1)).not.toMatch(illegalCharRegexp);

                    transformed = transformer.transformURL(baseURL + "#" + fragment);
                    expect(transformed.charAt(0)).toBe("#");
                    expect(transformed.substring(1)).not.toMatch(illegalCharRegexp);

                    var restored = transformer.restoreURL(transformed);
                    expect(restored).toEqual([baseURL, fragment]);
                });

                it("does not transform an external URL", function() {
                    var baseURL = "http://base.org:9000/baz.html";

                    var transformed = transformer.transformURL("#" + fragment, baseURL);
                    expect(transformed).toBe("#" + fragment);

                    transformed = transformer.transformURL(baseURL + "#" + fragment);
                    expect(transformed).toBe(baseURL + "#" + fragment);
                });
            });
        });
    });
});
