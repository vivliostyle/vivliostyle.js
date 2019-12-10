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

import * as adapt_epub from "../../../src/ts/vivliostyle/epub";

describe("epub", function() {
    describe("OPFDoc", function() {
        describe("OPFDocumentURLTransformer", function() {
            var opfDoc = new adapt_epub.OPFDoc(null, null);
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
                    expect(transformed.indexOf(adapt_epub.transformedIdPrefix)).toBe(0);
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
