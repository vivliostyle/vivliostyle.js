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

import DocumentOptions from "../../../src/models/document-options";
import urlParameters from "../../../src/stores/url-parameters";

describe("DocumentOptions", function () {
  let history, location;

  beforeEach(function () {
    history = urlParameters.history;
    urlParameters.history = {};
    location = urlParameters.location;
  });

  afterEach(function () {
    urlParameters.history = history;
    urlParameters.location = location;
  });

  describe("constructor", function () {
    it("retrieves parameters from URL", function () {
      urlParameters.location = {
        href: "http://example.com#x=abc/def.html&f=ghi%25&x=jkl/mno.html",
      };
      let options = new DocumentOptions();

      expect(options.epubUrl()).toBe("");
      expect(options.url()).toEqual(["abc/def.html", "jkl/mno.html"]);
      expect(options.fragment()).toBe("ghi%25");
      expect(options.userStyleSheet()).toEqual([]);

      urlParameters.location = {
        href:
          "http://example.com#b=abc/&f=ghi&style=style1&style=style2&userStyle=style3",
      };
      options = new DocumentOptions();

      expect(options.epubUrl()).toBe("abc/");
      expect(options.url()).toBe(null);
      expect(options.fragment()).toBe("ghi");
      expect(options.authorStyleSheet()).toEqual(["style1", "style2"]);
      expect(options.userStyleSheet()).toEqual(["style3"]);
    });
  });

  it("write fragment back to URL when updated", function () {
    urlParameters.location = {
      href: "http://example.com#x=abc/def.html&f=ghi",
    };
    const options = new DocumentOptions();
    options.fragment("jkl%25");

    expect(urlParameters.location.href).toBe(
      "http://example.com#x=abc/def.html&f=jkl%25",
    );
  });

  describe("toObject", function () {
    it("converts parameters to an object except url", function () {
      const options = new DocumentOptions();
      options.url("abc/def.html");
      options.fragment("ghi");
      options.authorStyleSheet(["style1", "style2"]);
      options.userStyleSheet(["style3"]);

      expect(options.toObject()).toEqual({
        fragment: "ghi",
        authorStyleSheet: [{ url: "style1" }, { url: "style2" }],
        userStyleSheet: [{ text: "@page {size: auto;}" }, { url: "style3" }],
      });
    });
  });
});
