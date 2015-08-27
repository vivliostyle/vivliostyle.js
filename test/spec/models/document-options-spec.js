import DocumentOptions from "../../../src/js/models/document-options";
import urlParameters from "../../../src/js/stores/url-parameters"

describe("DocumentOptions", function() {
    var location;

    beforeEach(function() {
        location = urlParameters.location;
    });

    afterEach(function() {
        urlParameters.location = location;
    });

    describe("constructor", function() {
        it("retrieves parameters from URL", function() {
            urlParameters.location = {href: "http://example.com#x=abc/def.html&f=ghi"};
            var options = new DocumentOptions();

            expect(options.url()).toBe("abc/def.html");
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
               fragment: "ghi"
            });
        });
    });
});
