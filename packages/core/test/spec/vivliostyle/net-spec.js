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
import * as adapt_task from "../../../src/vivliostyle/task";
import * as adapt_xmldoc from "../../../src/vivliostyle/xml-doc";

describe("net", function () {
  describe("fetchFromURL", function () {
    it("fetches a data:text/html, URL and parses as an empty HTML document", function (done) {
      var docStore = adapt_xmldoc.newXMLDocStore();

      adapt_task.start(function () {
        adapt_net
          .fetchFromURL("data:text/html,", adapt_net.FetchResponseType.DOCUMENT)
          .then(function (response) {
            expect(response.status).toBe(200);
            expect(response.contentType).toContain("text/html");

            adapt_xmldoc
              .parseXMLResource(response, docStore)
              .then(function (docHolder) {
                expect(docHolder).not.toBeNull();
                expect(docHolder.document.documentElement.namespaceURI).toBe(
                  adapt_base.NS.XHTML,
                );
                expect(docHolder.document.body).not.toBeNull();
                done();
              });
          });
        return adapt_task.newResult(true);
      });
    });
  });
});
