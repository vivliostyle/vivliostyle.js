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

import * as adapt_epub from "../../../src/vivliostyle/epub";
import * as adapt_xmldoc from "../../../src/vivliostyle/xml-doc";

describe("epub", function () {
  describe("OPFDoc", function () {
    describe("OPFDocumentURLTransformer", function () {
      var opfDoc = new adapt_epub.OPFDoc(null, null);
      opfDoc.spine = opfDoc.items = [
        { src: "http://example.com:8000/foo/bar1.html" },
        { src: "http://example.com:8000/foo/bar2.html" },
      ];
      var transformer = opfDoc.createDocumentURLTransformer();

      var illegalCharRegexp = /[^-a-zA-Z0-9_:]/;

      describe("transformFragment / restoreURL", function () {
        var baseURL = "http://base.org:9000/baz.html";
        var fragment = "some-fragment";
        var transformed = transformer.transformFragment(fragment, baseURL);

        it("transforms a pair of a fragment and a base URL into an XML ID string", function () {
          expect(transformed).not.toMatch(illegalCharRegexp);
          expect(transformed.indexOf(adapt_epub.transformedIdPrefix)).toBe(0);
        });

        it("restores a pair of the original base URL and the original fragment", function () {
          var restored = transformer.restoreURL(transformed);
          expect(restored).toEqual([baseURL, fragment]);

          restored = transformer.restoreURL("#" + transformed);
          expect(restored).toEqual([baseURL, fragment]);
        });
      });

      describe("transformURL", function () {
        var fragment = "some-fragment";

        it("transforms a URL internal to the document into an XML ID string", function () {
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

        it("does not transform an external URL", function () {
          var baseURL = "http://base.org:9000/baz.html";

          var transformed = transformer.transformURL("#" + fragment, baseURL);
          expect(transformed).toBe("#" + fragment);

          transformed = transformer.transformURL(baseURL + "#" + fragment);
          expect(transformed).toBe(baseURL + "#" + fragment);
        });
      });
    });
  });

  describe("readMetadata", function () {
    var url = "foobar";

    it("parses DC11 terms in order", function () {
      var doc = new DOMParser().parseFromString(
        `
      <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
        <dc:identifier id="pub-id">urn:uuid:A1B0D67E-2E81-4DF5-9E67-A64CBE366809</dc:identifier>
        <dc:title>Norwegian Wood</dc:title>
        <dc:language>en</dc:language>
      </metadata>`,
        "text/xml",
      );
      var holder = new adapt_xmldoc.XMLDocHolder(null, url, doc);
      var items = holder.doc().childElements();
      var metadata = adapt_epub.readMetadata(items);

      expect(metadata["http://purl.org/dc/terms/identifier"]).toEqual([
        { v: "urn:uuid:A1B0D67E-2E81-4DF5-9E67-A64CBE366809", o: 1 },
      ]);

      expect(metadata["http://purl.org/dc/terms/title"]).toEqual([
        { v: "Norwegian Wood", o: 2 },
      ]);

      expect(metadata["http://purl.org/dc/terms/language"]).toEqual([
        { v: "en", o: 3 },
      ]);
    });

    it("parses DCTERMS properties in order", function () {
      var doc = new DOMParser().parseFromString(
        `
      <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
        <meta property="dcterms:modified">2011-01-01T12:00:00Z</meta>
      </metadata>`,
        "text/xml",
      );
      var holder = new adapt_xmldoc.XMLDocHolder(null, url, doc);
      var items = holder.doc().childElements();
      var metadata = adapt_epub.readMetadata(items);

      expect(metadata["http://purl.org/dc/terms/modified"]).toEqual([
        { v: "2011-01-01T12:00:00Z", o: 1 },
      ]);
    });

    it("parses refinement properties", function () {
      var doc = new DOMParser().parseFromString(
        `
      <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
        <dc:creator id="creator">Haruki Murakami</dc:creator>
        <meta refines="#creator" property="role" scheme="marc:relators" id="role">aut</meta>
        <meta refines="#creator" property="alternate-script" xml:lang="ja">村上 春樹</meta>
        <meta refines="#creator" property="file-as">Murakami, Haruki</meta>
      </metadata>`,
        "text/xml",
      );
      var holder = new adapt_xmldoc.XMLDocHolder(null, url, doc);
      var items = holder.doc().childElements();
      var metadata = adapt_epub.readMetadata(items);

      expect(metadata["http://purl.org/dc/terms/creator"]).toEqual([
        {
          v: "Haruki Murakami",
          o: 1,
          r: {
            "http://idpf.org/epub/vocab/package/meta/#role": [
              { v: "aut", o: 2, s: "http://id.loc.gov/vocabulary/relators" },
            ],
            "http://idpf.org/epub/vocab/package/meta/#alternate-script": [
              { v: "村上 春樹", o: 3 },
            ],
            "http://idpf.org/epub/vocab/package/meta/#file-as": [
              { v: "Murakami, Haruki", o: 4 },
            ],
          },
        },
      ]);
    });

    it("parses role properties", function () {
      var doc = new DOMParser().parseFromString(
        `
      <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
        <dc:creator opf:role="aut">Harkaitz Cano</dc:creator>
        <dc:creator opf:role="trl">Roberta Gozzi</dc:creator>
        <dc:contributor opf:role="bkp">calibre (3.12.0) [https://calibre-ebook.com]</dc:contributor>
      </metadata>`,
        "text/xml",
      );
      var holder = new adapt_xmldoc.XMLDocHolder(null, url, doc);
      var items = holder.doc().childElements();
      var metadata = adapt_epub.readMetadata(items);

      expect(metadata["http://purl.org/dc/terms/creator"]).toEqual([
        {
          v: "Harkaitz Cano",
          o: 1,
          r: {
            "http://idpf.org/epub/vocab/package/meta/#role": [
              { v: "aut", o: 1 },
            ],
          },
        },
        {
          v: "Roberta Gozzi",
          o: 2,
          r: {
            "http://idpf.org/epub/vocab/package/meta/#role": [
              { v: "trl", o: 2 },
            ],
          },
        },
      ]);

      expect(metadata["http://purl.org/dc/terms/contributor"]).toEqual([
        {
          v: "calibre (3.12.0) [https://calibre-ebook.com]",
          o: 3,
          r: {
            "http://idpf.org/epub/vocab/package/meta/#role": [
              { v: "bkp", o: 3 },
            ],
          },
        },
      ]);
    });
  });
});
