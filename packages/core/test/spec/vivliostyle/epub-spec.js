/**
 * Copyright 2017 Daishinsha Inc.
 * Copyright 2026 Vivliostyle Foundation
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
import * as adapt_task from "../../../src/vivliostyle/task";
import * as adapt_xmldoc from "../../../src/vivliostyle/xml-doc";
import * as vivliostyle_plugin from "../../../src/vivliostyle/plugin";

describe("epub", function () {
  describe("EPUBDocStore", function () {
    describe("loadPubDoc", function () {
      it("skips HEAD and treats data: URLs as a Web Publication primary entry", function (done) {
        var store = new adapt_epub.EPUBDocStore();
        var opf = {};
        spyOn(store, "loadWebPub").and.callFake(function () {
          return adapt_task.newResult(opf);
        });

        adapt_task.start(function () {
          store.loadPubDoc("data:text/html,").then(function (result) {
            expect(store.loadWebPub).toHaveBeenCalledWith("data:text/html,");
            expect(result).toBe(opf);
            done();
          });
          return adapt_task.newResult(true);
        });
      });

      it("skips HEAD and treats .svg URLs as a Web Publication primary entry", function (done) {
        var store = new adapt_epub.EPUBDocStore();
        var url =
          "https://raw.githack.com/web-platform-tests/wpt/master/svg/styling/css-var-on-length-attributes-02.svg";
        var opf = {};
        spyOn(store, "loadWebPub").and.callFake(function () {
          return adapt_task.newResult(opf);
        });

        adapt_task.start(function () {
          store.loadPubDoc(url).then(function (result) {
            expect(store.loadWebPub).toHaveBeenCalledWith(url);
            expect(result).toBe(opf);
            done();
          });
          return adapt_task.newResult(true);
        });
      });

      it("skips HEAD and treats blob: URLs as a Web Publication primary entry", function (done) {
        var store = new adapt_epub.EPUBDocStore();
        var url =
          "blob:http://localhost:3000/12345678-1234-1234-1234-123456789abc";
        var opf = {};
        spyOn(store, "loadWebPub").and.callFake(function () {
          return adapt_task.newResult(opf);
        });

        adapt_task.start(function () {
          store.loadPubDoc(url).then(function (result) {
            expect(store.loadWebPub).toHaveBeenCalledWith(url);
            expect(result).toBe(opf);
            done();
          });
          return adapt_task.newResult(true);
        });
      });
    });
  });

  describe("OPFDoc", function () {
    describe("fromWebPubManifest", function () {
      it("creates a primary entry for data: URL documents", function (done) {
        var store = new adapt_epub.EPUBDocStore();
        var doc = new DOMParser().parseFromString(
          "<html xmlns='http://www.w3.org/1999/xhtml'><head><title>Blank</title></head><body></body></html>",
          "text/html",
        );

        adapt_task.start(function () {
          adapt_epub.OPFDoc.fromWebPubManifest(
            store,
            "data:text/html,",
            {},
            doc,
          ).then(function (opf) {
            expect(opf.items.length).toBe(1);
            expect(opf.spine.length).toBe(1);
            expect(opf.items[0].src).toBe("data:text/html,");
            done();
          });
          return adapt_task.newResult(true);
        });
      });

      it("creates a primary entry when the publication URL is the root document", function (done) {
        var store = new adapt_epub.EPUBDocStore();
        var doc = new DOMParser().parseFromString(
          "<html xmlns='http://www.w3.org/1999/xhtml'><head><title>Root</title></head><body></body></html>",
          "text/html",
        );

        adapt_task.start(function () {
          adapt_epub.OPFDoc.fromWebPubManifest(
            store,
            "https://example.com/webpub/",
            {},
            doc,
          ).then(function (opf) {
            expect(opf.items.length).toBe(1);
            expect(opf.spine.length).toBe(1);
            expect(opf.items[0].src).toBe("https://example.com/webpub/");
            done();
          });
          return adapt_task.newResult(true);
        });
      });
    });

    describe("OPFDocumentURLTransformer", function () {
      var opfDoc = adapt_epub.OPFDoc.fromChapters(null, null, [
        { url: "http://example.com:8000/foo/bar1.html", index: 0 },
        { url: "http://example.com:8000/foo/bar2.html", index: 1 },
      ]).get();
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

        it("canonicalizes a redirected loaded document URL to the spine source URL", function () {
          var store = {
            get: function (url) {
              return url === "http://example.com:8000/foo/bar1.html"
                ? { url: "http://example.com:8000/foo/bar1" }
                : null;
            },
          };
          var redirectedOpfDoc = adapt_epub.OPFDoc.fromChapters(store, null, [
            { url: "http://example.com:8000/foo/bar1.html", index: 0 },
          ]).get();
          var redirectedTransformer =
            redirectedOpfDoc.createDocumentURLTransformer();

          var redirectedBaseURL = "http://example.com:8000/foo/bar1";
          var redirectedTransformed = redirectedTransformer.transformFragment(
            fragment,
            redirectedBaseURL,
          );

          expect(
            redirectedTransformer.restoreURL(redirectedTransformed),
          ).toEqual(["http://example.com:8000/foo/bar1.html", fragment]);
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

        it("transforms a redirected same-document URL using the canonical spine URL", function () {
          var store = {
            get: function (url) {
              return url === "http://example.com:8000/foo/bar1.html"
                ? { url: "http://example.com:8000/foo/bar1" }
                : null;
            },
          };
          var redirectedOpfDoc = adapt_epub.OPFDoc.fromChapters(store, null, [
            { url: "http://example.com:8000/foo/bar1.html", index: 0 },
          ]).get();
          var redirectedTransformer =
            redirectedOpfDoc.createDocumentURLTransformer();
          var redirectedBaseURL = "http://example.com:8000/foo/bar1";

          var transformed = redirectedTransformer.transformURL(
            "#" + fragment,
            redirectedBaseURL,
          );
          expect(transformed.charAt(0)).toBe("#");

          expect(redirectedTransformer.restoreURL(transformed)).toEqual([
            "http://example.com:8000/foo/bar1.html",
            fragment,
          ]);
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
  describe("OPFView pagination progress", function () {
    function createFakeView(totalOffsets) {
      var view = Object.create(adapt_epub.OPFView.prototype);
      view.spineItems = [];
      view.paginationProgress = {
        totalOffsetsBySpine: [],
        renderedOffsetsBySpine: [],
        totalOffsetsReady: false,
        lastReportedPages: 0,
        lastReportedFraction: 0,
      };
      view.opf = {
        spine: totalOffsets.map(function (offset, i) {
          return { src: "doc-" + i, spineIndex: i };
        }),
        store: {
          load: function (src) {
            var index = Number(src.replace("doc-", ""));
            return adapt_task.newResult({
              getTotalOffset: function () {
                return totalOffsets[index];
              },
            });
          },
        },
      };
      return view;
    }

    function createFakeViewItem(view, spineIndex, totalOffset) {
      return {
        item: view.opf.spine[spineIndex],
        xmldoc: {
          getTotalOffset: function () {
            return totalOffset;
          },
        },
        instance: {
          getPosition: function () {
            return 0;
          },
        },
        pages: [{ fetchers: [] }],
      };
    }

    var payloads;
    var hook = function (payload) {
      payloads.push(payload);
    };

    beforeEach(function () {
      payloads = [];
      vivliostyle_plugin.registerHook(
        vivliostyle_plugin.HOOKS.PAGINATION_PROGRESS,
        hook,
      );
    });

    afterEach(function () {
      vivliostyle_plugin.removeHook(
        vivliostyle_plugin.HOOKS.PAGINATION_PROGRESS,
        hook,
      );
    });

    it("reports the fraction of the paginated content in a single document", function () {
      var view = createFakeView([100]);
      var viewItem = createFakeViewItem(view, 0, 100);
      view.spineItems[0] = viewItem;

      // A page finished at the half of the document
      viewItem.instance.getPosition = function () {
        return 50;
      };
      view.reportPaginationProgress(viewItem, { page: 1 });
      expect(payloads[0].fraction).toBeCloseTo(0.5, 5);
      expect(payloads[0].pages).toBe(1);

      // The last page finished (no next layout position)
      view.reportPaginationProgress(viewItem, null);
      expect(payloads[1].fraction).toBe(1);
    });

    it("does not report 100% until the last of multiple documents is paginated", function (done) {
      var view = createFakeView([100, 100, 100]);

      adapt_task.start(function () {
        view.collectTotalOffsets().then(function () {
          // Each spine item is loaded and fully paginated in order
          for (var i = 0; i < 3; i++) {
            var viewItem = createFakeViewItem(view, i, 100);
            view.spineItems[i] = viewItem;
            view.reportPaginationProgress(viewItem, null);
          }
          expect(payloads[0].fraction).toBeCloseTo(1 / 3, 5);
          expect(payloads[1].fraction).toBeCloseTo(2 / 3, 5);
          expect(payloads[2].fraction).toBe(1);
          done();
        });
        return adapt_task.newResult(true);
      });
    });

    it("reports the initial render fraction against the whole publication, not just the first document", function (done) {
      var view = createFakeView([100, 100, 100]);
      // renderSinglePage() dependencies, stubbed to isolate the collect + report
      view.counterStore = { finishPage: function () {} };
      view.isInCounterResolveScope = function () {
        return false;
      };
      view.preparePageCountersForRender = function () {
        return null;
      };
      view.makePage = function () {
        return { spineIndex: 0, offset: 0, fetchers: [] };
      };
      view.resolvePageTypeForRenderSlot = function () {};
      view.finishPageContainer = function () {};
      view.maybeRelayoutFollowingPage = function () {
        return adapt_task.newResult(true);
      };
      view.resolveUnresolvedReferencesForPage = function (viewItem, page) {
        return adapt_task.newResult(page);
      };

      var viewItem = createFakeViewItem(view, 0, 100);
      view.spineItems[0] = viewItem;
      viewItem.instance.getPageNumberContextDepth = function () {
        return 0;
      };
      viewItem.instance.pushPageNumberContext = function () {};
      viewItem.instance.restorePageNumberContextDepth = function () {};
      // A page finished at the half of the first document
      viewItem.instance.getPosition = function () {
        return 50;
      };
      viewItem.instance.layoutNextPage = function () {
        return adapt_task.newResult({ page: 1 });
      };

      adapt_task.start(function () {
        view.renderSinglePage(viewItem, { page: 0 }).then(function () {
          expect(payloads[0].fraction).toBeCloseTo(1 / 6, 5);
          done();
        });
        return adapt_task.newResult(true);
      });
    });
  });
});
