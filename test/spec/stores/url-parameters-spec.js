"use strict";
import stringUtil from "../../../src/js/utils/string-util";
import urlParameters from "../../../src/js/stores/url-parameters";

describe("URLParameterStore", function() {
    describe("getParameter", function() {
        var location;

        beforeEach(function() {
            location = urlParameters.location;
        });

        afterEach(function() {
            urlParameters.location = location;
        });

        it("returns a value corresponding to the key in the URL hash", function() {
            urlParameters.location = {href: "http://example.com#aa=bb&cc=dd"};

            expect(urlParameters.getParameter("aa")).toBe("bb");
            expect(urlParameters.getParameter("cc")).toBe("dd");
        });

        it("can retrieve a value for an unicode key", function() {
            var key = "あいうえお";
            urlParameters.location = {href: "http://example.com#aa=bb&" + key + "=dd"};

            expect(urlParameters.getParameter(key)).toBe("dd");
        });
    });
});
