/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

import DocumentOptions from "../../../src/js/models/document-options";
import urlParameters from "../../../src/js/stores/url-parameters"

describe("DocumentOptions", function() {
    var history, location;

    beforeEach(function() {
        history = urlParameters.history;
        urlParameters.history = {};
        location = urlParameters.location;
    });

    afterEach(function() {
        urlParameters.history = history;
        urlParameters.location = location;
    });

    describe("constructor", function() {
        it("retrieves parameters from URL", function() {
            urlParameters.location = {href: "http://example.com#x=abc/def.html&f=ghi&x=jkl/mno.html"};
            var options = new DocumentOptions();

            expect(options.epubUrl()).toBe("");
            expect(options.url()).toEqual(["abc/def.html", "jkl/mno.html"]);
            expect(options.fragment()).toBe("ghi");

            urlParameters.location = {href: "http://example.com#b=abc/&f=ghi"};
            options = new DocumentOptions();

            expect(options.epubUrl()).toBe("abc/");
            expect(options.url()).toBe(null);
            expect(options.fragment()).toBe("ghi");
        });
    });

    it("write fragment back to URL when updated", function() {
        urlParameters.location = {href: "http://example.com#x=abc/def.html&f=ghi"};
        var options = new DocumentOptions();
        options.fragment("jkl");

        expect(urlParameters.location.href).toBe("http://example.com#x=abc/def.html&f=jkl");
    });

    describe("toObject", function() {
        it("converts parameters to an object except url", function() {
            var options = new DocumentOptions();
            options.url("abc/def.html");
            options.fragment("ghi");

            expect(options.toObject()).toEqual({
                fragment: "ghi",
                userStyleSheet: [{
                    text: "@page {size: auto;}"
                }]
            });
        });
    });
});
