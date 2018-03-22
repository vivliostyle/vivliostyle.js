/*
 * Copyright 2015 Trim-marks Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

import stringUtil from "../../../src/js/utils/string-util";
import urlParameters from "../../../src/js/stores/url-parameters";

describe("URLParameterStore", function() {
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

    describe("getBaseURL", function() {
        it("returns a URL of a directory in which the viewer entry point is located", function() {
            urlParameters.location = {href: "http://example.com/aa/bb/cc/viewer.html?foo#x=bar"};

            expect(urlParameters.getBaseURL()).toEqual("http://example.com/aa/bb/cc/")

            urlParameters.location = {href: "http://example.com/aa/bb/cc/?foo#x=bar"};

            expect(urlParameters.getBaseURL()).toEqual("http://example.com/aa/bb/cc/")
        });
    });

    describe("getParameter", function() {
        it("returns an array containing values corresponding to the key in the URL hash", function() {
            urlParameters.location = {href: "http://example.com#aa=bb&cc=dd&cc=ee"};

            expect(urlParameters.getParameter("aa")).toEqual(["bb"]);
            expect(urlParameters.getParameter("cc")).toEqual(["dd", "ee"]);

            urlParameters.location = {href: "http://example.com#aa=b#b&cc=dd&cc=ee"};

            expect(urlParameters.getParameter("aa")).toEqual(["b#b"]);
            expect(urlParameters.getParameter("cc")).toEqual(["dd", "ee"]);
        });

        it("can retrieve a value for a unicode key", function() {
            var key = "あいうえお";
            urlParameters.location = {href: "http://example.com#aa=bb&" + key + "=dd"};

            expect(urlParameters.getParameter(key)).toEqual(["dd"]);
        });

        it("can retrieve values containing '=', percent-encoded '&' and '%'", function() {
            urlParameters.location = {href: "http://example.com#aa=foo%2525bar%26baz&bb=c=d"};

            expect(urlParameters.getParameter("aa")).toEqual(["foo%25bar&baz"]);
            expect(urlParameters.getParameter("bb")).toEqual(["c=d"]);
        });

        it("does not percent-decode when dontPercentDecode=true", function() {
            urlParameters.location = {href: "http://example.com#aa=foo%2525bar%26baz"};

            expect(urlParameters.getParameter("aa", true)).toEqual(["foo%2525bar%26baz"]);
        });
    });

    describe("setParameter", function() {
        it("add the parameter to the URL hash if not exists", function() {
            urlParameters.location = {href: "http://example.com"};
            urlParameters.setParameter("cc", "dd");

            expect(urlParameters.location.href).toBe("http://example.com#cc=dd");

            urlParameters.location = {href: "http://example.com#aa=bb"};
            urlParameters.setParameter("cc", "dd");

            expect(urlParameters.location.href).toBe("http://example.com#aa=bb&cc=dd");
        });

        it("replaces the parameter in the URL hash if already exists", function() {
            urlParameters.location = {href: "http://example.com#cc=dd"};
            urlParameters.setParameter("cc", "ee");

            expect(urlParameters.location.href).toBe("http://example.com#cc=ee");

            urlParameters.location = {href: "http://example.com#cc=dd&aa=bb"};
            urlParameters.setParameter("cc", "ee");

            expect(urlParameters.location.href).toBe("http://example.com#cc=ee&aa=bb");
        });

        it("can set a value for a unicode key", function() {
            urlParameters.location = {href: "http://example.com#aa=bb"};
            urlParameters.setParameter("あいうえお", "かきくけこ");

            expect(urlParameters.location.href).toBe("http://example.com#aa=bb&あいうえお=かきくけこ");

            urlParameters.location = {href: "http://example.com#あいうえお=かきくけこ"};
            urlParameters.setParameter("あいうえお", "さしすせそ");

            expect(urlParameters.location.href).toBe("http://example.com#あいうえお=さしすせそ");
        });

        it("can set values containing '=', '&' and '%'", function() {
            urlParameters.location = {href: "http://example.com#aa=bb"};
            urlParameters.setParameter("aa", "foo%25bar&baz");
            urlParameters.setParameter("bb", "c=d");

            expect(urlParameters.location.href).toBe("http://example.com#aa=foo%2525bar%26baz&bb=c=d");
        });

        it("does not percent-encode when dontPercentEncode=true", function() {
            urlParameters.location = {href: "http://example.com#aa=bb"};
            urlParameters.setParameter("aa", "foo%25bar", true);

            expect(urlParameters.location.href).toBe("http://example.com#aa=foo%25bar");
        });

        it("use history.replaceState if available", function() {
            urlParameters.history.replaceState = function() {};
            spyOn(urlParameters.history, "replaceState");
            urlParameters.location = {href: "http://example.com"};
            urlParameters.setParameter("cc", "dd");

            // dummy location.href does not change
            expect(urlParameters.location.href).toBe("http://example.com");
            expect(urlParameters.history.replaceState).toHaveBeenCalledWith(null, "", "http://example.com#cc=dd");
        });
    });
});
