/**
 * Copyright 2017 Trim-marks Inc.
 *
 * Vivliostyle.js is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle.js is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle.js.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as adapt_base from "../../../src/ts/vivliostyle/base";
import * as adapt_xmldoc from "../../../src/ts/vivliostyle/xmldoc";

describe("xmldoc", function() {
  describe("XMLDocHolder", function() {
    var url = "foobar";

    describe("getElement", function() {
      it("returns an element if there is one with the specified ID", function() {
        var doc = new DOMParser().parseFromString(
          "<foo><bar id='baz'></bar></foo>",
          "text/xml",
        );
        var holder = new adapt_xmldoc.XMLDocHolder(null, url, doc);

        var e = holder.getElement("foobar#baz");
        expect(e instanceof Element).toBe(true);
      });

      it("returns an element if there is one with the specified name", function() {
        var doc = new DOMParser().parseFromString(
          "<html><head></head><body><bar name='baz'></bar></body></html>",
          "text/html",
        );
        var holder = new adapt_xmldoc.XMLDocHolder(null, url, doc);

        var e = holder.getElement("foobar#baz");
        expect(e instanceof Element).toBe(true);
      });

      it("returns null if nothing found", function() {
        var doc = new DOMParser().parseFromString(
          "<foo><bar></bar></foo>",
          "text/xml",
        );
        var holder = new adapt_xmldoc.XMLDocHolder(null, url, doc);

        var e = holder.getElement("foobar#baz");
        expect(e).toBeFalsy();
      });
    });
  });

  describe("parseAndReturnNullIfError", function() {
    it("uses a parser passed by an optional argument", function() {
      var parser = { parseFromString: function() {} };
      spyOn(parser, "parseFromString");

      adapt_xmldoc.parseAndReturnNullIfError("<test>", "text/xml", parser);

      expect(parser.parseFromString).toHaveBeenCalledWith("<test>", "text/xml");
    });

    it("returns a Document object when no error occurs", function() {
      var d = adapt_xmldoc.parseAndReturnNullIfError(
        "<a>a<b></b></a>",
        "text/xml",
      );

      expect(d).toBeTruthy();
      expect(d.documentElement.localName).toBe("a");
      expect(d.documentElement.childNodes.length).toBe(2);
      expect(d.documentElement.firstChild.textContent).toBe("a");
      expect(d.documentElement.childNodes[1].localName).toBe("b");
    });

    it("returns null when a parse error occurs", function() {
      expect(adapt_xmldoc.parseAndReturnNullIfError("<test", "text/xml")).toBe(
        null,
      );
      expect(
        adapt_xmldoc.parseAndReturnNullIfError("<test><t></test>", "text/xml"),
      ).toBe(null);
    });
  });

  describe("parseXMLResource", function() {
    it("returns an already parsed Document if present", function(done) {
      var docStore = adapt_xmldoc.newXMLDocStore();
      var result = adapt_xmldoc.parseXMLResource(
        { responseXML: document },
        docStore,
      );
      result.then(function(docHolder) {
        expect(docHolder.document).toBe(document);
        done();
      });
    });

    it("uses given contentType to parse the source", function(done) {
      var htmlText = "<html></html>";
      var doneHtml = false,
        doneXml = false,
        doneSvg = false;
      function complete() {
        if (doneHtml && doneXml && doneSvg) {
          done();
        }
      }

      var docStore = adapt_xmldoc.newXMLDocStore();
      var result = adapt_xmldoc.parseXMLResource(
        { responseText: htmlText, contentType: "text/html" },
        docStore,
      );
      result.then(function(docHolder) {
        var doc = docHolder.document;
        expect(doc.documentElement.namespaceURI).toBe(adapt_base.NS.XHTML);
        doneHtml = true;
        complete();
      });

      docStore = adapt_xmldoc.newXMLDocStore();
      result = adapt_xmldoc.parseXMLResource(
        { responseText: htmlText, contentType: "text/xml" },
        docStore,
      );
      result.then(function(docHolder) {
        var doc = docHolder.document;
        expect(doc.documentElement.namespaceURI).toBe(null);
        expect(doc.documentElement.localName).toBe("html");
        doneXml = true;
        complete();
      });

      docStore = adapt_xmldoc.newXMLDocStore();
      result = adapt_xmldoc.parseXMLResource(
        { responseText: "<svg></svg>", contentType: "image/svg+xml" },
        docStore,
      );
      result.then(function(docHolder) {
        var doc = docHolder.document;
        expect(doc.documentElement.localName).toBe("svg");
        doneSvg = true;
        complete();
      });
    });

    it("can parse application/*+xml source as an XML", function(done) {
      var docStore = adapt_xmldoc.newXMLDocStore();
      var result = adapt_xmldoc.parseXMLResource(
        { responseText: "<foo></foo>", contentType: "application/foo+xml" },
        docStore,
      );
      result.then(function(docHolder) {
        var doc = docHolder.document;
        expect(doc.documentElement.localName).toBe("foo");
        done();
      });
    });

    it("can infer contentType from file extension", function(done) {
      var htmlText = "<html></html>";
      var doneHtml = false,
        doneXml = false,
        doneSvg = false;
      function complete() {
        if (doneHtml && doneXml && doneSvg) {
          done();
        }
      }

      var docStore = adapt_xmldoc.newXMLDocStore();
      var result = adapt_xmldoc.parseXMLResource(
        { responseText: htmlText, contentType: null, url: "foo.html" },
        docStore,
      );
      result.then(function(docHolder) {
        var doc = docHolder.document;
        expect(doc.documentElement.namespaceURI).toBe(adapt_base.NS.XHTML);
        doneHtml = true;
        complete();
      });

      docStore = adapt_xmldoc.newXMLDocStore();
      result = adapt_xmldoc.parseXMLResource(
        {
          responseText: htmlText,
          contentType: null,
          url: "foo.xml",
        },
        docStore,
      );
      result.then(function(docHolder) {
        var doc = docHolder.document;
        expect(doc.documentElement.namespaceURI).toBe(null);
        expect(doc.documentElement.localName).toBe("html");
        doneXml = true;
        complete();
      });

      docStore = adapt_xmldoc.newXMLDocStore();
      result = adapt_xmldoc.parseXMLResource(
        {
          responseText: "<svg></svg>",
          contentType: null,
          url: "foo.svg",
        },
        docStore,
      );
      result.then(function(docHolder) {
        var doc = docHolder.document;
        expect(doc.documentElement.localName).toBe("svg");
        doneSvg = true;
        complete();
      });
    });

    it("assumes XML if contentType and file extension are both unavailable, but treats the document as HTML or SVG if the root element's localName is html or svg and namespaceURI is absent", function(done) {
      var doneXml = false,
        doneHtml = false,
        doneSvg = false;
      function complete() {
        if (doneHtml && doneXml && doneSvg) {
          done();
        }
      }

      var docStore = adapt_xmldoc.newXMLDocStore();
      var result = adapt_xmldoc.parseXMLResource(
        { responseText: "<foo></foo>", contentType: null, url: "foo/" },
        docStore,
      );
      result.then(function(docHolder) {
        var doc = docHolder.document;
        expect(doc.documentElement.namespaceURI).toBe(null);
        expect(doc.documentElement.localName).toBe("foo");
        doneXml = true;
        complete();
      });

      docStore = adapt_xmldoc.newXMLDocStore();
      result = adapt_xmldoc.parseXMLResource(
        { responseText: "<html></html>", contentType: null, url: "foo/" },
        docStore,
      );
      result.then(function(docHolder) {
        var doc = docHolder.document;
        expect(doc.documentElement.namespaceURI).toBe(adapt_base.NS.XHTML);
        doneHtml = true;
        complete();
      });

      docStore = adapt_xmldoc.newXMLDocStore();
      result = adapt_xmldoc.parseXMLResource(
        { responseText: "<svg></svg>", contentType: null, url: "foo/" },
        docStore,
      );
      result.then(function(docHolder) {
        var doc = docHolder.document;
        expect(doc.documentElement.localName).toBe("svg");
        doneSvg = true;
        complete();
      });
    });
  });
});
