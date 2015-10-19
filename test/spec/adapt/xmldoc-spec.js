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

    describe("parseXMLResource", function() {
        it("returns an already parsed Document if present", function(done) {
            var docStore = adapt.xmldoc.newXMLDocStore();
            var result = adapt.xmldoc.parseXMLResource({responseXML: document}, docStore);
            result.then(function(docHolder) {
                expect(docHolder.document).toBe(document);
                done();
            });
        });

        it("uses given contentType to parse the source", function(done) {
            var htmlText = "<html></html>";
            var doneHtml = false, doneXml = false, doneSvg = false;
            function complete() {
                if (doneHtml && doneXml && doneSvg) {
                    done();
                }
            }

            var docStore = adapt.xmldoc.newXMLDocStore();
            var result = adapt.xmldoc.parseXMLResource({responseText: htmlText, contentType: "text/html"}, docStore);
            result.then(function(docHolder) {
                var doc = docHolder.document;
                expect(doc.documentElement.namespaceURI).toBe(adapt.base.NS.XHTML);
                doneHtml = true;
                complete();
            });

            docStore = adapt.xmldoc.newXMLDocStore();
            result = adapt.xmldoc.parseXMLResource({responseText: htmlText, contentType: "text/xml"}, docStore);
            result.then(function(docHolder) {
                var doc = docHolder.document;
                expect(doc.documentElement.namespaceURI).toBe(null);
                expect(doc.documentElement.localName).toBe("html");
                doneXml = true;
                complete();
            });

            docStore = adapt.xmldoc.newXMLDocStore();
            result = adapt.xmldoc.parseXMLResource({responseText: "<svg></svg>", contentType: "image/svg+xml"}, docStore);
            result.then(function(docHolder) {
                var doc = docHolder.document;
                expect(doc.contentType).toBe("image/svg+xml");
                doneSvg = true;
                complete();
            })
        });

        it("can parse application/*+xml source as an XML", function(done) {
            var docStore = adapt.xmldoc.newXMLDocStore();
            var result = adapt.xmldoc.parseXMLResource(
                {responseText: "<foo></foo>", contentType: "application/foo+xml"}, docStore);
            result.then(function(docHolder) {
                var doc = docHolder.document;
                expect(doc.documentElement.localName).toBe("foo");
                done();
            })
        });

        it("can infer contentType from file extension", function(done) {
            var htmlText = "<html></html>";
            var doneHtml = false, doneXml = false, doneSvg = false;
            function complete() {
                if (doneHtml && doneXml && doneSvg) {
                    done();
                }
            }

            var docStore = adapt.xmldoc.newXMLDocStore();
            var result = adapt.xmldoc.parseXMLResource(
                {responseText: htmlText, contentType: null, url: "foo.html"}, docStore);
            result.then(function(docHolder) {
                var doc = docHolder.document;
                expect(doc.documentElement.namespaceURI).toBe(adapt.base.NS.XHTML);
                doneHtml = true;
                complete();
            });

            docStore = adapt.xmldoc.newXMLDocStore();
            result = adapt.xmldoc.parseXMLResource({
                responseText: htmlText, contentType: null, url: "foo.xml"}, docStore);
            result.then(function(docHolder) {
                var doc = docHolder.document;
                expect(doc.documentElement.namespaceURI).toBe(null);
                expect(doc.documentElement.localName).toBe("html");
                doneXml = true;
                complete();
            });

            docStore = adapt.xmldoc.newXMLDocStore();
            result = adapt.xmldoc.parseXMLResource({
                responseText: "<svg></svg>", contentType: null, url: "foo.svg"}, docStore);
            result.then(function(docHolder) {
                var doc = docHolder.document;
                expect(doc.contentType).toBe("image/svg+xml");
                doneSvg = true;
                complete();
            });
        });

        it("assumes XML if contentType and file extension are both unavailable, but treats the document as HTML or SVG if the root element's localName is html or svg and namespaceURI is absent", function(done) {
            var doneXml = false, doneHtml = false, doneSvg = false;
            function complete() {
                if (doneHtml && doneXml && doneSvg) {
                    done();
                }
            }

            var docStore = adapt.xmldoc.newXMLDocStore();
            var result = adapt.xmldoc.parseXMLResource(
                {responseText: "<foo></foo>", contentType: null, url: "foo/"}, docStore);
            result.then(function(docHolder) {
                var doc = docHolder.document;
                expect(doc.documentElement.namespaceURI).toBe(null);
                expect(doc.documentElement.localName).toBe("foo");
                doneXml = true;
                complete();
            });

            docStore = adapt.xmldoc.newXMLDocStore();
            result = adapt.xmldoc.parseXMLResource(
                {responseText: "<html></html>", contentType: null, url: "foo/"}, docStore);
            result.then(function(docHolder) {
                var doc = docHolder.document;
                expect(doc.documentElement.namespaceURI).toBe(adapt.base.NS.XHTML);
                doneHtml = true;
                complete();
            });

            docStore = adapt.xmldoc.newXMLDocStore();
            result = adapt.xmldoc.parseXMLResource(
                {responseText: "<svg></svg>", contentType: null, url: "foo/"}, docStore);
            result.then(function(docHolder) {
                var doc = docHolder.document;
                expect(doc.contentType).toBe("image/svg+xml");
                doneSvg = true;
                complete();
            });
        });
    });

});
