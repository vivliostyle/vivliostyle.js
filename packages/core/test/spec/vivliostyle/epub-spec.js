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

      ["%23", "%3F", "%3A"].forEach(function (encodedCharacter) {
        it(
          "preserves " + encodedCharacter + " in the primary entry filename",
          function (done) {
            var store = new adapt_epub.EPUBDocStore();
            var doc = new DOMParser().parseFromString(
              "<html xmlns='http://www.w3.org/1999/xhtml'><head><title>Reserved character</title></head><body></body></html>",
              "text/html",
            );
            var url =
              "https://example.com/book/file" + encodedCharacter + "name.html";

            adapt_task.start(function () {
              adapt_epub.OPFDoc.fromWebPubManifest(store, url, {}, doc).then(
                function (opf) {
                  expect(opf.spine.length).toBe(1);
                  expect(opf.spine[0].src).toBe(url);
                  done();
                },
              );
              return adapt_task.newResult(true);
            });
          },
        );
      });
    });

    describe("OPFDocumentURLTransformer", function () {
      var opfDoc = adapt_epub.OPFDoc.fromChapters(null, "", [
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
          var redirectedOpfDoc = adapt_epub.OPFDoc.fromChapters(store, "", [
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
          var redirectedOpfDoc = adapt_epub.OPFDoc.fromChapters(store, "", [
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
  describe("OPFView page rendering", function () {
    it("stops tracking a render task after a synchronous error", function (done) {
      adapt_task.start(function () {
        var view = Object.create(adapt_epub.OPFView.prototype);
        view.renderingPageTasks = new Map();
        var error = new Error("render failed");
        spyOn(view, "renderPageTracked").and.throwError(error);

        return adapt_task.handle(
          "testRenderErrorCleanup",
          function () {
            view.renderPage({
              spineIndex: 0,
              pageIndex: 0,
              offsetInItem: -1,
            });
          },
          function (frame, caughtError) {
            expect(caughtError).toBe(error);
            expect(view.renderingPageTasks.size).toBe(0);
            frame.finish(true);
            done();
          },
        );
      });
    });

    it("waits for a pending page being rendered by another task", function (done) {
      adapt_task.start(function () {
        var view = Object.create(adapt_epub.OPFView.prototype);
        view.renderingPageTasks = new Map();
        var page = {};
        var viewItem = {
          complete: false,
          layoutPositions: [{ page: 0 }, { page: 1 }],
          pages: [{}],
        };
        spyOn(view, "waitForPreviousSpines").and.returnValue(
          adapt_task.newResult(true),
        );
        spyOn(view, "getPageViewItem").and.returnValue(
          adapt_task.newResult(viewItem),
        );
        spyOn(view, "renderPage").and.callThrough();
        var scheduler = adapt_task.currentTask().getScheduler();
        var backgroundTask = scheduler.run(function () {
          var frame = adapt_task.newFrame("backgroundRender");
          view.beginRenderingPage(adapt_task.currentTask());
          frame.sleep(50).then(function () {
            viewItem.pages[1] = page;
            view.endRenderingPage(adapt_task.currentTask());
            frame.finish(true);
          });
          return frame.result();
        });
        var testFrame = adapt_task.newFrame("testPendingPageWait");
        testFrame.sleep(10).then(function () {
          view
            .findPage({ spineIndex: 0, pageIndex: 1, offsetInItem: -1 }, false)
            .then(function (result) {
              expect(result.page).toBe(page);
              expect(view.renderPage).not.toHaveBeenCalled();
              backgroundTask.join().then(function () {
                testFrame.finish(true);
                done();
              });
            });
        });
        return testFrame.result();
      });
    });

    it("reuses the requested slot when a final-page rerender shrinks the spine", function (done) {
      adapt_task.start(function () {
        var view = Object.create(adapt_epub.OPFView.prototype);
        var page = { spineIndex: 0, offset: 0, fetchers: [] };
        var viewItem = {
          item: { spineIndex: 0 },
          layoutPositions: new Array(17).fill(null),
          pages: Array.from({ length: 17 }, function () {
            return { container: { remove: function () {} } };
          }),
          pageCounterStarts: new Array(17).fill(null),
          instance: {
            viewport: {
              layoutBox: { removeAttribute: function () {} },
            },
            getPageNumberContextDepth: function () {
              return 0;
            },
            pushPageNumberContext: function () {},
            restorePageNumberContextDepth: function () {},
            layoutNextPage: function () {
              return adapt_task.newResult(null);
            },
          },
        };
        view.spineItems = [viewItem];
        view.spineItemLoadingContinuations = [null];
        view.counterStore = { finishPage: function () {} };
        view.isInCounterResolveScope = function () {
          return false;
        };
        view.preparePageCountersForRender = function () {
          return null;
        };
        view.makePage = function () {
          return page;
        };
        view.resolvePageTypeForRenderSlot = function () {};
        spyOn(view, "finishPageContainer");
        view.reportPaginationProgress = function () {};
        view.maybeRelayoutFollowingPage = function () {
          return adapt_task.newResult(true);
        };
        view.resolveUnresolvedReferencesForPage = function () {
          return adapt_task.newResult(page);
        };

        view.renderSinglePage(viewItem, { page: 15 }).then(function () {
          expect(view.finishPageContainer).toHaveBeenCalledWith(
            viewItem,
            page,
            15,
          );
          expect(viewItem.pages.length).toBe(16);
          expect(viewItem.layoutPositions.length).toBe(16);
          expect(viewItem.pageCounterStarts.length).toBe(16);
          expect(viewItem.complete).toBe(true);
          done();
        });
        return adapt_task.newResult(true);
      });
    });

    it("discards following spines after an earlier spine shrinks", function () {
      var view = Object.create(adapt_epub.OPFView.prototype);
      var sourcePage = { container: { remove: jasmine.createSpy() } };
      var followingPage1 = { container: { remove: jasmine.createSpy() } };
      var followingPage2 = { container: { remove: jasmine.createSpy() } };
      var sourceItem = { item: { spineIndex: 0 }, pages: [sourcePage] };
      var followingItem1 = {
        item: { spineIndex: 1 },
        pages: [followingPage1],
      };
      var followingItem2 = {
        item: { spineIndex: 2 },
        pages: [followingPage2],
      };
      view.spineItems = [sourceItem, followingItem1, followingItem2];
      view.spineItemLoadingContinuations = [[], [], []];
      view.deferredReferencePages = [
        { viewItem: sourceItem },
        { viewItem: followingItem1 },
      ];
      view.counterStore = {
        discardReferencesFromSpine: jasmine.createSpy(),
      };

      view.deferFollowingSpinesForRelayout(0);
      view.relayoutDeferredFollowingSpines();

      expect(view.spineItems[0]).toBe(sourceItem);
      expect(view.spineItems[1]).toBeNull();
      expect(view.spineItems[2]).toBeNull();
      expect(sourcePage.container.remove).not.toHaveBeenCalled();
      expect(followingPage1.container.remove).toHaveBeenCalled();
      expect(followingPage2.container.remove).toHaveBeenCalled();
      expect(view.spineItemLoadingContinuations[1]).toBeNull();
      expect(view.spineItemLoadingContinuations[2]).toBeNull();
      expect(view.deferredReferencePages).toEqual([{ viewItem: sourceItem }]);
      expect(view.counterStore.discardReferencesFromSpine).toHaveBeenCalledWith(
        1,
      );
    });

    it("keeps the earliest following spine queued for relayout", function () {
      var view = Object.create(adapt_epub.OPFView.prototype);
      view.spineItems = [];
      view.spineItemLoadingContinuations = [];

      view.deferFollowingSpinesForRelayout(3);
      view.deferFollowingSpinesForRelayout(1);

      expect(view.deferredFollowingSpineRelayoutStart).toBe(2);
    });

    it("rerenders a deferred suffix once after full pagination", function (done) {
      adapt_task.start(function () {
        var view = Object.create(adapt_epub.OPFView.prototype);
        var finalPosition = {
          spineIndex: 2,
          pageIndex: Number.POSITIVE_INFINITY,
          offsetInItem: -1,
        };
        var initialResult = { id: "initial" };
        var rerenderedResult = { id: "rerendered" };
        view.opf = { spine: [{}, {}, {}] };
        view.spineItems = [];
        view.deferredFollowingSpineRelayoutStart = 1;
        spyOn(view, "relayoutDeferredFollowingSpines").and.callFake(
          function () {
            view.deferredFollowingSpineRelayoutStart = null;
          },
        );
        spyOn(view, "renderPagesUpto").and.returnValues(
          adapt_task.newResult(initialResult),
          adapt_task.newResult(rerenderedResult),
        );

        view.renderAllPages().then(function (result) {
          expect(view.relayoutDeferredFollowingSpines).toHaveBeenCalled();
          expect(view.renderPagesUpto.calls.count()).toBe(2);
          expect(view.renderPagesUpto.calls.allArgs()).toEqual([
            [finalPosition, false],
            [finalPosition, false],
          ]);
          expect(result).toBe(rerenderedResult);
          expect(view.renderingAllPages).toBe(false);
          done();
        });
        return adapt_task.newResult(true);
      });
    });

    it("rerenders a deferred suffix after on-demand pagination", function (done) {
      adapt_task.start(function () {
        var view = Object.create(adapt_epub.OPFView.prototype);
        var position = {
          spineIndex: 2,
          pageIndex: Number.POSITIVE_INFINITY,
          offsetInItem: -1,
        };
        var initialResult = { id: "initial" };
        var rerenderedResult = { id: "rerendered" };
        view.renderingPageTasks = new Map();
        view.renderingAllPages = false;
        view.relayoutingFollowingSpines = false;
        view.deferredFollowingSpineRelayoutStart = 1;
        spyOn(view, "renderPageTracked").and.returnValue(
          adapt_task.newResult(initialResult),
        );
        spyOn(view, "relayoutDeferredFollowingSpines").and.callFake(
          function () {
            view.deferredFollowingSpineRelayoutStart = null;
          },
        );
        spyOn(view, "renderPagesUpto").and.returnValue(
          adapt_task.newResult(rerenderedResult),
        );

        view.renderPage(position).then(function (result) {
          expect(view.relayoutDeferredFollowingSpines).toHaveBeenCalled();
          expect(view.renderPagesUpto).toHaveBeenCalledWith(position, false);
          expect(result).toBe(rerenderedResult);
          expect(view.relayoutingFollowingSpines).toBe(false);
          expect(view.renderingPageTasks.size).toBe(0);
          done();
        });
        return adapt_task.newResult(true);
      });
    });
    it("resolves references deferred by a nested counter scope", function (done) {
      adapt_task.start(function () {
        var view = Object.create(adapt_epub.OPFView.prototype);
        var page = {};
        var viewItem = {};
        var nextLayoutPosition = { page: 16 };
        var ref = {
          isResolved: function () {
            return false;
          },
        };
        view.counterStore = {
          getUnresolvedRefsToPage: function () {
            return [{ refs: [ref] }];
          },
        };
        view.isInCounterResolveScope = function () {
          return false;
        };
        spyOn(view, "resolveUnresolvedReferencesForPage").and.returnValue(
          adapt_task.newResult(page),
        );

        view
          .resolveDeferredReferencesAfterCounterScope(
            viewItem,
            page,
            15,
            nextLayoutPosition,
          )
          .then(function (result) {
            expect(
              view.resolveUnresolvedReferencesForPage,
            ).toHaveBeenCalledWith(viewItem, page, 15, nextLayoutPosition);
            expect(result).toBe(page);
            done();
          });
        return adapt_task.newResult(true);
      });
    });

    it("remembers the cascaded page where a counter scope defers references", function (done) {
      adapt_task.start(function () {
        var view = Object.create(adapt_epub.OPFView.prototype);
        var page = {
          container: {
            parentElement: {},
            setAttribute: function () {},
          },
          spineIndex: 0,
        };
        var viewItem = { pages: [page], item: { spineIndex: 0 } };
        var nextLayoutPosition = { page: 1 };
        var ref = {
          isResolved: function () {
            return false;
          },
        };
        view.opf = { spine: [{}, {}] };
        view.counterStore = {
          getUnresolvedRefsToPage: function () {
            return [{ refs: [ref] }];
          },
        };
        view.isInCounterResolveScope = function () {
          return true;
        };
        spyOn(view, "deferReferencesForPage").and.callThrough();

        view
          .resolveUnresolvedReferencesForPage(
            viewItem,
            page,
            0,
            nextLayoutPosition,
          )
          .then(function () {
            expect(view.deferReferencesForPage).toHaveBeenCalledWith(
              viewItem,
              page,
              0,
              nextLayoutPosition,
            );
            done();
          });
        return adapt_task.newResult(true);
      });
    });

    it("queues deferred references until the outermost counter scope is restored", function (done) {
      adapt_task.start(function () {
        var view = Object.create(adapt_epub.OPFView.prototype);
        var page = {};
        var viewItem = { pages: [page] };
        var inCounterScope = true;
        var ref = {
          isResolved: function () {
            return false;
          },
        };
        view.counterStore = {
          getUnresolvedRefsToPage: function () {
            return [{ refs: [ref] }];
          },
        };
        view.isInCounterResolveScope = function () {
          return inCounterScope;
        };
        spyOn(view, "resolveUnresolvedReferencesForPage").and.returnValue(
          adapt_task.newResult(page),
        );

        view
          .resolveDeferredReferencesAfterCounterScope(viewItem, page, 0, null)
          .then(function () {
            expect(
              view.resolveUnresolvedReferencesForPage,
            ).not.toHaveBeenCalled();
            inCounterScope = false;
            view
              .resolveDeferredReferencesAfterCounterScope(
                viewItem,
                page,
                0,
                null,
              )
              .then(function () {
                expect(
                  view.resolveUnresolvedReferencesForPage,
                ).toHaveBeenCalledWith(viewItem, page, 0, null);
                expect(
                  view.resolveUnresolvedReferencesForPage.calls.count(),
                ).toBe(1);
                done();
              });
          });
        return adapt_task.newResult(true);
      });
    });

    it("does not requeue a deferred page while draining it", function (done) {
      adapt_task.start(function () {
        var view = Object.create(adapt_epub.OPFView.prototype);
        var page = {};
        var viewItem = { pages: [page] };
        var ref = {
          isResolved: function () {
            return false;
          },
        };
        view.resolvingDeferredReferences = true;
        view.counterStore = {
          getUnresolvedRefsToPage: function () {
            return [{ spineIndex: 0, refs: [ref] }];
          },
        };

        view.deferReferencesForPage(viewItem, page, 0, null);
        expect(view.deferredReferencePages || []).toEqual([]);
        done();
        return adapt_task.newResult(true);
      });
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
