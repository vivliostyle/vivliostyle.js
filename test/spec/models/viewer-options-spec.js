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

import ViewerOptions from "../../../src/js/models/viewer-options";
import urlParameters from "../../../src/js/stores/url-parameters";

describe("ViewerOptions", function() {
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
            urlParameters.location = {href: "http://example.com#spread=true"};
            var options = new ViewerOptions();

            expect(options.spreadView()).toBe(true);

            urlParameters.location = {href: "http://example.com#spread=false"};
            options = new ViewerOptions();

            expect(options.spreadView()).toBe(false);
        });

        it("copies parameters from the argument", function() {
            var other = new ViewerOptions();
            other.spreadView(false);
            other.fontSize(20);
            other.zoom(1.2);
            var options = new ViewerOptions(other);

            expect(options.spreadView()).toBe(false);
            expect(options.fontSize()).toBe(20);
            expect(options.zoom()).toBe(1.2);
        });
    });

    it("write spread option back to URL when update if it is constructed with no argument", function() {
        urlParameters.location = {href: "http://example.com#spread=true"};
        var options = new ViewerOptions();
        options.spreadView(false);

        expect(urlParameters.location.href).toBe("http://example.com#spread=false");

        options.spreadView(true);

        expect(urlParameters.location.href).toBe("http://example.com#spread=true");

        // not write back if it is constructed with another ViewerOptions
        var other = new ViewerOptions();
        other.spreadView(false);
        other.fontSize(20);
        other.zoom(1.2);
        options = new ViewerOptions(other);
        options.spreadView(true);

        expect(urlParameters.location.href).toBe("http://example.com#spread=false");
    });

    describe("copyFrom", function() {
        it("copies parameters from the argument to itself", function() {
            var options = new ViewerOptions();
            options.spreadView(true);
            options.fontSize(10);
            options.zoom(1.4);
            var other = new ViewerOptions();
            other.spreadView(false);
            other.fontSize(20);
            other.zoom(1.2);
            options.copyFrom(other);

            expect(options.spreadView()).toBe(false);
            expect(options.fontSize()).toBe(20);
            expect(options.zoom()).toBe(1.2);
        });
    });

    describe("toObject", function() {
        it("converts parameters to an object", function() {
            var options = new ViewerOptions();
            options.spreadView(true);
            options.fontSize(20);
            options.zoom(1.2);

            expect(options.toObject()).toEqual({
                fontSize: 20,
                spreadView: true,
                zoom: 1.2
            });
        });
    });
});
