import stringUtil from "../../../src/js/utils/string-util";
import urlParameters from "../../../src/js/stores/url-parameters";

describe("URLParameterStore", function() {
    var location;

    beforeEach(function () {
        location = urlParameters.location;
    });

    afterEach(function() {
        urlParameters.location = location;
    });

    describe("getParameter", function() {
        it("returns a value corresponding to the key in the URL hash", function() {
            urlParameters.location = {href: "http://example.com#aa=bb&cc=dd"};

            expect(urlParameters.getParameter("aa")).toBe("bb");
            expect(urlParameters.getParameter("cc")).toBe("dd");
        });

        it("can retrieve a value for a unicode key", function() {
            var key = "あいうえお";
            urlParameters.location = {href: "http://example.com#aa=bb&" + key + "=dd"};

            expect(urlParameters.getParameter(key)).toBe("dd");
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
    });
});
