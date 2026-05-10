/**
 * Copyright 2017 Daishinsha Inc.
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

describe("base", function () {
  var module = adapt_base;

  describe("resolveReferenceURL", function () {
    it("preserves the base document URL for fragment references on data URLs", function () {
      expect(
        module.resolveReferenceURL(
          "#fn1",
          "data:,%3Cp%3Edpub%20test%3C%2Fp%3E",
        ),
      ).toBe("data:,%3Cp%3Edpub%20test%3C%2Fp%3E#fn1");
    });

    it("matches resolveURL for non-fragment references", function () {
      expect(
        module.resolveReferenceURL(
          "chapter-2.html#fn1",
          "https://example.com/book/chapter-1.html",
        ),
      ).toBe("https://example.com/book/chapter-2.html#fn1");
    });
  });

  describe("convertSpecialURL", function () {
    it("converts wpt.live URLs to raw.githack.com URLs", function () {
      expect(
        module.convertSpecialURL(
          "https://wpt.live/css/css-fonts/font-face-src-list.html",
        ),
      ).toBe(
        "https://raw.githack.com/web-platform-tests/wpt/master/css/css-fonts/font-face-src-list.html",
      );
    });

    it("converts GitHub WPT URLs to raw.githack.com URLs", function () {
      expect(
        module.convertSpecialURL(
          "https://github.com/web-platform-tests/wpt/blob/master/css/css-fonts/font-face-src-list.html",
        ),
      ).toBe(
        "https://raw.githack.com/web-platform-tests/wpt/master/css/css-fonts/font-face-src-list.html",
      );
    });

    it("converts GitHub WPT URLs with non-master branch to raw.githack.com URLs", function () {
      expect(
        module.convertSpecialURL(
          "https://github.com/web-platform-tests/wpt/blob/merge_pr_123456/css/CSS2/fonts/font-family-008.xht",
        ),
      ).toBe(
        "https://raw.githack.com/web-platform-tests/wpt/merge_pr_123456/css/CSS2/fonts/font-family-008.xht",
      );
    });

    it("does not convert wpt.live .sub.* URLs to raw.githack.com (server-side substitution required)", function () {
      expect(
        module.convertSpecialURL(
          "https://wpt.live/fetch/corb/img-png-mislabeled-as-html.sub.html",
        ),
      ).toBe("https://wpt.live/fetch/corb/img-png-mislabeled-as-html.sub.html");
      expect(
        module.convertSpecialURL(
          "https://wpt.live/density-size-correction/density-corrected-size-img-cross-origin.sub.html",
        ),
      ).toBe(
        "https://wpt.live/density-size-correction/density-corrected-size-img-cross-origin.sub.html",
      );
      expect(
        module.convertSpecialURL("https://wpt.live/some/test.sub.any.js"),
      ).toBe("https://wpt.live/some/test.sub.any.js");
      expect(
        module.convertSpecialURL(
          "https://wpt.live/some/test.sub.any.worker.js",
        ),
      ).toBe("https://wpt.live/some/test.sub.any.worker.js");
    });

    it("converts about:blank to data:text/html,", function () {
      expect(module.convertSpecialURL("about:blank")).toBe("data:text/html,");
      expect(module.convertSpecialURL("ABOUT:blank")).toBe("data:text/html,");
      expect(module.convertSpecialURL("about:blank?Q=1")).toBe(
        "data:text/html,",
      );
      expect(module.convertSpecialURL("about:blank#frag")).toBe(
        "data:text/html,",
      );
    });
  });

  describe("convertAboutBlankURL", function () {
    it("converts about:blank to data:text/html,", function () {
      expect(module.convertAboutBlankURL("about:blank")).toBe(
        "data:text/html,",
      );
      expect(module.convertAboutBlankURL("ABOUT:blank")).toBe(
        "data:text/html,",
      );
      expect(module.convertAboutBlankURL("about:blank?Q=1")).toBe(
        "data:text/html,",
      );
    });

    it("returns non-about:blank URLs unchanged", function () {
      expect(module.convertAboutBlankURL("https://example.com")).toBe(
        "https://example.com",
      );
      expect(module.convertAboutBlankURL("data:text/html,")).toBe(
        "data:text/html,",
      );
    });
  });

  describe("resolveURL", function () {
    it("keeps repo-root absolute paths within the WPT raw.githack.com mirror", function () {
      expect(
        module.resolveURL(
          "/fonts/Lato-Medium.ttf",
          "https://raw.githack.com/web-platform-tests/wpt/master/css/css-fonts/font-face-src-list.html",
        ),
      ).toBe(
        "https://raw.githack.com/web-platform-tests/wpt/master/fonts/Lato-Medium.ttf",
      );
    });

    it("keeps repo-root absolute paths within the WPT mirror for non-master branches", function () {
      expect(
        module.resolveURL(
          "/fonts/ahem.css",
          "https://raw.githack.com/web-platform-tests/wpt/merge_pr_123456/css/CSS2/fonts/font-family-008.xht",
        ),
      ).toBe(
        "https://raw.githack.com/web-platform-tests/wpt/merge_pr_123456/fonts/ahem.css",
      );
    });

    it("resolves relative sub-resources within raw.githack.com (not converted to wpt.live)", function () {
      expect(
        module.resolveURL(
          "resources/dpr.py?name=square.png&dpr=2",
          "https://raw.githack.com/web-platform-tests/wpt/master/content-dpr/image.html",
        ),
      ).toBe(
        "https://raw.githack.com/web-platform-tests/wpt/master/content-dpr/resources/dpr.py?name=square.png&dpr=2",
      );
    });
  });

  describe("resolveWptResourceURL", function () {
    it("converts raw.githack.com WPT URLs to wpt.live for browser-loaded resources", function () {
      expect(
        module.resolveWptResourceURL(
          "https://raw.githack.com/web-platform-tests/wpt/master/content-dpr/resources/dpr.py?name=square.png&dpr=2",
        ),
      ).toBe(
        "https://wpt.live/content-dpr/resources/dpr.py?name=square.png&dpr=2",
      );
    });

    it("passes through non-WPT URLs unchanged", function () {
      expect(
        module.resolveWptResourceURL("https://example.com/image.png"),
      ).toBe("https://example.com/image.png");
    });
  });

  describe("escapeCharToHex", function () {
    it("escape the first character to a 4-digit hex code and add the specified prefix", function () {
      expect(module.escapeCharToHex("a", ":")).toBe(":0061");
      expect(module.escapeCharToHex(":", ":")).toBe(":003a");
    });

    it("escape the first character to a 4-digit hex code and add '\\u' prefix when prefix is not specified", function () {
      expect(module.escapeCharToHex("a")).toBe("\\u0061");
      expect(module.escapeCharToHex("\\")).toBe("\\u005c");
    });
  });

  describe("escapeNameStrToHex", function () {
    it("escape characters other than [-a-zA-Z0-9_] to 4-digit hex codes and add the specified prefix to each of them", function () {
      expect(module.escapeNameStrToHex("abc-_:%/\\", ":")).toBe(
        "abc-_:003a:0025:002f:005c",
      );
    });

    it("escape characters other than [-a-zA-Z0-9_] to 4-digit hex codes and add '\\u' prefix to each of them when prefix is not specified", function () {
      expect(module.escapeNameStrToHex("abc-_:%/\\")).toBe(
        "abc-_\\u003a\\u0025\\u002f\\u005c",
      );
    });
  });

  describe("unescapeCharFromHex", function () {
    it("unescape a 4-digit hex code with the specified prefix to the original character", function () {
      expect(module.unescapeCharFromHex(":0061", ":")).toBe("a");
      expect(module.unescapeCharFromHex(":003a", ":")).toBe(":");
    });

    it("unescape a 4-digit hex code with '\\u' prefix to the original character when prefix is not specified", function () {
      expect(module.unescapeCharFromHex("\\u0061")).toBe("a");
      expect(module.unescapeCharFromHex("\\u005c")).toBe("\\");
    });
  });

  describe("unescapeStrFromHex", function () {
    it("unescape a string containing 4-digit hex codes with the specified prefix to the original string", function () {
      expect(module.unescapeStrFromHex("abc-_:003a:0025:002f:005c", ":")).toBe(
        "abc-_:%/\\",
      );
    });

    it("unescape a string containing 4-digit hex codes with '\\u' prefix to the original string when prefix is not specified", function () {
      expect(
        module.unescapeStrFromHex("abc-_\\u003a\\u0025\\u002f\\u005c"),
      ).toBe("abc-_:%/\\");
    });
  });
});
