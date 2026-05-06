/**
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

import * as adapt_base from "../../../src/vivliostyle/base";
import * as adapt_net from "../../../src/vivliostyle/net";
import * as adapt_xmldoc from "../../../src/vivliostyle/xml-doc";

describe("net", function () {
  describe("fetchFromURL", function () {
    it("returns a synthetic empty HTML response for about:blank", function (done) {
      adapt_net
        .fetchFromURL("about:blank", adapt_net.FetchResponseType.DOCUMENT)
        .then(function (response) {
          expect(response.status).toBe(200);
          expect(response.statusText).toBe("OK");
          expect(response.url).toBe("about:blank");
          expect(response.contentType).toBe("text/html");
          expect(response.responseText).toBe("");
          expect(response.responseXML).toBeNull();
          expect(response.responseBlob).toBeNull();
          done();
        });
    });

    it("returns a synthetic empty HTML response for about:blank with query parameters", function (done) {
      adapt_net
        .fetchFromURL("about:blank?Q=1", adapt_net.FetchResponseType.DOCUMENT)
        .then(function (response) {
          expect(response.status).toBe(200);
          expect(response.statusText).toBe("OK");
          expect(response.url).toBe("about:blank?Q=1");
          expect(response.contentType).toBe("text/html");
          expect(response.responseText).toBe("");
          expect(response.responseXML).toBeNull();
          expect(response.responseBlob).toBeNull();
          done();
        });
    });

    it("returns a synthetic empty HTML response for mixed-case about:blank URLs", function (done) {
      adapt_net
        .fetchFromURL("ABOUT:blank?Q=1", adapt_net.FetchResponseType.DOCUMENT)
        .then(function (response) {
          expect(response.status).toBe(200);
          expect(response.statusText).toBe("OK");
          expect(response.url).toBe("ABOUT:blank?Q=1");
          expect(response.contentType).toBe("text/html");
          expect(response.responseText).toBe("");
          expect(response.responseXML).toBeNull();
          expect(response.responseBlob).toBeNull();
          done();
        });
    });

    it("lets about:blank parse as an empty HTML document", function (done) {
      var docStore = adapt_xmldoc.newXMLDocStore();

      adapt_net
        .fetchFromURL("about:blank", adapt_net.FetchResponseType.DOCUMENT)
        .then(function (response) {
          adapt_xmldoc
            .parseXMLResource(response, docStore)
            .then(function (docHolder) {
              expect(docHolder).not.toBeNull();
              expect(docHolder.url).toBe("about:blank");
              expect(docHolder.document.documentElement.namespaceURI).toBe(
                adapt_base.NS.XHTML,
              );
              expect(docHolder.document.body).not.toBeNull();
              done();
            });
        });
    });
  });
});
