import ViewerOptions from "../../../src/js/models/viewer-options";
import urlParameters from "../../../src/js/stores/url-parameters";

describe("ViewerOptions", function() {
    var location;

    beforeEach(function() {
        location = urlParameters.location;
    });

    afterEach(function() {
        urlParameters.location = location;
    });

    describe("constructor", function() {
        it("retrieves parameters from URL", function() {
            urlParameters.location = {href: "http://example.com#spread=true"};
            var options = new ViewerOptions();

            expect(options.spreadView()).toBe(true);

            urlParameters.location = {href: "http://example.com#spread=false"};
            options = new ViewerOptions();

            expect(options.spreadView()).toBe(false);
        });
    });

    describe("toObject", function() {
        it("converts parameters to an object", function() {
            var options = new ViewerOptions();
            options.spreadView(true);
            options.fontSize(20);

            expect(options.toObject()).toEqual({
                fontSize: 20,
                spreadView: true
            });
        });
    });
});
