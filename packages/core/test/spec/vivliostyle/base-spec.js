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
import * as assets from "../../../src/vivliostyle/assets";

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
    it("keeps the path of the base URL for a query-only URL", function () {
      expect(
        module.resolveURL("?script=a.js", "https://example.com/book/index.php"),
      ).toBe("https://example.com/book/index.php?script=a.js");
      expect(
        module.resolveURL("?b", "https://example.com/book/index.php?a#x"),
      ).toBe("https://example.com/book/index.php?b");
      expect(
        module.resolveURL("./?b", "https://example.com/book/index.php"),
      ).toBe("https://example.com/book/?b");
    });

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
      expect(module.escapeCharToHex("")).toBe("\\u0000");
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

  describe("style keys", function () {
    var element;
    var keys = function () {
      return keysOf(element);
    };
    // The keys of an element without the mark of an element whose keys are
    // taken from the text of its style attribute.
    var keysOf = function (target) {
      var value = target.getAttribute(module.STYLE_KEYS_ATTR);
      var list = (value || "").split(" ").filter(function (key) {
        return key && key !== "*";
      });
      return list.length ? list.sort() : null;
    };
    var substrings = [
      ["text-decoration", "text-decoration"],
      ["border-collapse: collapse", "border-collapse:collapse"],
      ["--viv-marker-color", "--viv-marker-color"],
    ];
    // The polyfill matches style text; zoom widths depend on declared styles.
    var expectedKeys = function (target) {
      var text = target.getAttribute("style") || "";
      var list = substrings
        .filter(function (entry) {
          return text.indexOf(entry[0]) >= 0;
        })
        .map(function (entry) {
          return entry[1];
        });
      const names = target.style.all ? [] : Array.from(target.style);
      if (names.some((name) => /^border-.*style$/.test(name))) {
        list.push("border");
      }
      if (names.includes("outline-style")) list.push("outline");
      if (names.includes("column-rule-style")) list.push("rule");
      return list.length ? list.sort() : null;
    };

    beforeEach(function () {
      element = document.createElement("div");
    });

    it("leaves an element without a matching declaration alone", function () {
      module.setCSSProperty(element, "color", "red");
      module.setCSSProperty(element, "--viv-emphasis-start", "1px");
      expect(element.style.color).toBe("red");
      expect(keys()).toBe(null);
    });

    it("lists the custom properties that the UA stylesheet selects on", function () {
      module.setCSSProperty(element, "--viv-marker-content", '"1. "');
      module.setCSSProperty(element, "--viv-marker-color", "red");
      module.setCSSProperty(element, "--viv-initialLetter", "2");
      module.setCSSProperty(element, "--viv-firstLineFontSize", "20px");
      expect(keys()).toEqual([
        "--viv-firstLineFontSize",
        "--viv-initialLetter",
        "--viv-marker-color",
        "--viv-marker-content",
      ]);
      // An empty value still declares the custom property.
      module.setCSSProperty(element, "--viv-marker-color", "");
      expect(keys()).toContain("--viv-marker-color");
    });

    it("tracks declared line styles for the zoom workaround", function () {
      module.setCSSProperty(element, "border-top-style", "solid");
      expect(keys()).toEqual(["border"]);
      module.setCSSProperty(element, "outline-style", "dotted");
      module.setCSSProperty(element, "column-rule-style", "solid");
      module.setCSSProperty(element, "text-decoration-line", "underline");
      expect(keys()).toEqual(["border", "outline", "rule", "text-decoration"]);

      // A box keyword does not declare a border.
      var other = document.createElement("div");
      module.setCSSProperty(other, "box-sizing", "border-box");
      expect(keysOf(other)).toBe(null);
    });

    it("tells collapsed borders from separate ones", function () {
      module.setCSSProperty(element, "border-collapse", "collapse");
      expect(keys()).toEqual(["border-collapse:collapse"]);
      module.setCSSProperty(element, "border-collapse", "separate");
      expect(keys()).toBe(null);
    });

    it("removes a key with its last declaration", function () {
      module.setCSSProperty(element, "border-top-style", "solid");
      module.setCSSProperty(element, "border-bottom-style", "solid");
      module.setCSSProperty(element, "text-decoration-line", "underline");
      module.setCSSProperty(element, "border-top-style", "");
      expect(keys()).toEqual(["border", "text-decoration"]);
      module.setCSSProperty(element, "border-bottom-style", "");
      expect(keys()).toEqual(["text-decoration"]);
      module.setCSSProperty(element, "text-decoration-line", "");
      expect(keys()).toBe(null);

      module.setCSSProperty(element, "box-sizing", "border-box");
      module.setCSSProperty(element, "box-sizing", "content-box");
      expect(keys()).toBe(null);
    });

    it("ignores line names and values in unrelated declarations", function () {
      module.setCSSProperty(element, "--border-color", "red");
      module.setCSSProperty(element, "--frame", "outline");
      module.setCSSProperty(element, "transition-property", "border-top-style");
      expect(keys()).toBe(null);
      module.setCSSProperty(element, "--viv-marker-content", '"rule 1"');
      expect(keys()).toEqual(["--viv-marker-content"]);
    });

    it("takes the keys from the declaration that the browser accepted", function () {
      // The browser makes the keyword lowercase.
      module.setCSSProperty(element, "border-collapse", "COLLAPSE");
      expect(element.style.borderCollapse).toBe("collapse");
      expect(keys()).toEqual(["border-collapse:collapse"]);

      // A value that is not valid leaves the declaration as it was.
      module.setCSSProperty(element, "border-collapse", "separate");
      module.setCSSProperty(element, "border-collapse", "collapse bogus");
      expect(element.style.borderCollapse).toBe("separate");
      expect(keys()).toBe(null);

      var other = document.createElement("div");
      module.setCSSProperty(other, "border-collapse", "collapse bogus");
      module.setCSSProperty(other, "box-sizing", "border-bogus");
      expect(other.getAttribute("style") || "").toBe("");
      expect(other.hasAttribute(module.STYLE_KEYS_ATTR)).toBe(false);

      // A rejected write preserves the accepted value.
      module.setCSSProperty(other, "box-sizing", "border-box");
      module.setCSSProperty(other, "box-sizing", "bogus");
      expect(other.style.boxSizing).toBe("border-box");
      expect(keysOf(other)).toBe(null);
    });

    it("removes a custom property and its key", function () {
      module.setCSSProperty(element, "--viv-footnote-white-space", "nowrap");
      module.setCSSProperty(element, "--viv-marker-content", '"*"');
      module.removeCSSProperty(element, "--viv-footnote-white-space");
      expect(element.style.getPropertyValue("--viv-footnote-white-space")).toBe(
        "",
      );
      expect(keys()).toEqual(["--viv-marker-content"]);
      // Removing a property that is not declared changes nothing.
      module.removeCSSProperty(element, "--viv-marker-color");
      module.removeCSSProperty(element, "color");
      expect(keys()).toEqual(["--viv-marker-content"]);
    });

    it("keeps the keys of a cloned element up to date", function () {
      module.setCSSProperty(element, "border-top-style", "solid");
      var clone = element.cloneNode(true);
      module.setCSSProperty(clone, "border-top-style", "");
      expect(clone.hasAttribute(module.STYLE_KEYS_ATTR)).toBe(false);
      expect(keys()).toEqual(["border"]);
    });

    it("reads the keys from the style attributes of a subtree", function () {
      element.setAttribute("style", "text-decoration: underline");
      // Keys that do not come from the style attributes are removed.
      element.innerHTML =
        '<span style="border: 1px solid">a</span><span style="color: red" data-viv-style="border">b</span><span data-viv-style="border-collapse:collapse">c</span>';
      module.updateStyleKeysFromStyleAttributes(element);
      expect(keys()).toEqual(["text-decoration"]);
      expect(keysOf(element.children[0])).toEqual(["border"]);
      expect(keysOf(element.children[1])).toBe(null);
      expect(element.children[2].hasAttribute(module.STYLE_KEYS_ATTR)).toBe(
        false,
      );
    });

    it("matches a selected custom property inside a value", function () {
      // [style*="--viv-marker-color"] also matched a reference to it.
      module.setCSSProperty(element, "--alias", "var(--viv-marker-color)");
      expect(keys()).toEqual(["--viv-marker-color"]);
      module.setCSSProperty(element, "--alias", "red");
      expect(keys()).toBe(null);
    });

    it("ignores the case of a property name", function () {
      module.setCSSProperty(element, "BORDER-TOP-STYLE", "solid");
      expect(element.style.borderTopStyle).toBe("solid");
      expect(keys()).toEqual(["border"]);
      module.setCSSProperty(element, "Border-Top-Style", "");
      expect(keys()).toBe(null);
    });

    it("follows a shorthand property that changes its longhand properties", function () {
      module.setCSSProperty(element, "background-clip", "border-box");
      expect(keys()).toBe(null);
      module.removeCSSProperty(element, "background");
      expect(element.getAttribute("style") || "").toBe("");
      expect(keys()).toBe(null);

      module.setCSSProperty(element, "border-top-style", "solid");
      module.setCSSProperty(element, "outline-style", "dotted");
      module.setCSSProperty(element, "outline", "");
      expect(keys()).toEqual(["border"]);
      module.setCSSProperty(element, "all", "initial");
      expect(keys()).toBe(null);
    });

    it("reads the keys of a subtree from the text of the style attribute", function () {
      // The longhand properties of the shorthand, such as
      // background-clip: border-box, are not in the attribute.
      element.setAttribute("style", "background: red");
      module.updateStyleKeysFromStyleAttributes(element);
      expect(keys()).toBe(null);
    });

    it("follows the style attribute when the browser rewrites it", function () {
      // The browser writes a style attribute from the source anew when a
      // declaration changes.
      element.innerHTML = '<table style="border-collapse:collapse"></table>';
      var table = element.firstChild;
      module.updateStyleKeysFromStyleAttributes(element);
      expect(keysOf(table)).toBe(null);
      module.setCSSProperty(table, "color", "red");
      expect(table.getAttribute("style")).toContain(
        "border-collapse: collapse",
      );
      expect(keysOf(table)).toEqual(["border-collapse:collapse"]);
      expect(keysOf(table.cloneNode(true))).toEqual(keysOf(table));
    });

    it("keeps background box values out of the border width workaround", function () {
      // View generation sets background longhands one by one. (PR #2286)
      [
        ["background-image", "none"],
        ["background-position-x", "0%"],
        ["background-position-y", "0%"],
        ["background-size", "auto"],
        ["background-repeat", "repeat"],
        ["background-attachment", "scroll"],
        ["background-origin", "padding-box"],
        ["background-clip", "border-box"],
        ["background-color", "red"],
      ].forEach(function (declaration) {
        module.setCSSProperty(element, declaration[0], declaration[1]);
        expect(keys()).toEqual(expectedKeys(element));
      });
      expect(element.style.backgroundClip).toBe("border-box");

      // A value that is not valid changes nothing.
      module.setCSSProperty(element, "background-clip", "border-bogus");
      expect(keys()).toEqual(expectedKeys(element));
      module.setCSSProperty(element, "background-image", "");
      expect(keys()).toEqual(expectedKeys(element));

      // The same when the shorthand property is set.
      var other = document.createElement("div");
      module.setCSSProperty(other, "background", "red");
      expect(keysOf(other)).toEqual(expectedKeys(other));
      module.setCSSProperty(other, "background-image", "");
      expect(keysOf(other)).toEqual(expectedKeys(other));
    });

    it("resolves an escape in a value", function () {
      module.setCSSProperty(
        element,
        "transition-property",
        "text-decor\\61tion",
      );
      expect(element.style.transitionProperty).toBe("text-decoration");
      expect(keys()).toEqual(["text-decoration"]);
    });

    it("keeps the keys in sync after any sequence of changes", function () {
      var changes = [
        ["background", "red"],
        ["background", ""],
        ["background-color", "red"],
        ["background-color", ""],
        ["background-image", "none"],
        ["background-image", ""],
        ["background-clip", "border-box"],
        ["background-clip", "padding-box"],
        ["background-clip", "border-bogus"],
        ["background-clip", ""],
        ["background-origin", "border-box"],
        ["background-origin", ""],
        ["box-sizing", "border-box"],
        ["box-sizing", "content-box"],
        ["box-sizing", ""],
        ["border", "1px solid red"],
        ["border", ""],
        ["border-top-style", "solid"],
        ["border-top-style", ""],
        ["border-collapse", "collapse"],
        ["border-collapse", "COLLAPSE"],
        ["border-collapse", "separate"],
        ["border-collapse", ""],
        ["outline-style", "dotted"],
        ["outline", ""],
        ["column-rule-style", "solid"],
        ["column-rule-style", ""],
        ["text-decoration-line", "underline"],
        ["text-decoration-line", ""],
        ["transition-property", "border-color"],
        ["transition", "none"],
        ["transition", ""],
        ["font-family", "rule"],
        ["font-family", ""],
        ["color", "red"],
        ["color", ""],
        ["all", "initial"],
        ["all", ""],
        ["--viv-marker-color", "red"],
        ["--alias", "var(--viv-marker-color)"],
        ["--alias", "outline"],
        ["--alias", "1"],
      ];
      // A fixed pseudo-random sequence.
      var seed = 12345;
      var next = function (count) {
        seed = (seed * 1103515245 + 12345) % 2147483648;
        return Math.floor((seed / 2147483648) * count);
      };
      for (var round = 0; round < 40; round++) {
        var target = document.createElement("div");
        var log = [];
        for (var step = 0; step < 30; step++) {
          var change = changes[next(changes.length)];
          log.push(change.join(": "));
          if (change[1] === "" && change[0].indexOf("--") === 0) {
            module.removeCSSProperty(target, change[0]);
          } else {
            module.setCSSProperty(target, change[0], change[1]);
          }
          if (step === 15) {
            target = target.cloneNode(true);
          }
          var actual = keysOf(target);
          var expected = expectedKeys(target);
          if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            fail(
              "keys " +
                JSON.stringify(actual) +
                " instead of " +
                JSON.stringify(expected) +
                ' for style "' +
                target.getAttribute("style") +
                '" after ' +
                log.join("; "),
            );
            return;
          }
        }
      }
    });

    it("knows every key that the stylesheets of the viewer document select on", function () {
      var css =
        assets.VivliostyleViewportScreenCss +
        assets.VivliostyleViewportCss +
        assets.VivliostylePolyfillCss;
      var pattern = /\[data-viv-style~="([^"]+)"\]/g;
      var selected = [];
      var match;
      while ((match = pattern.exec(css))) {
        if (selected.indexOf(match[1]) < 0) {
          selected.push(match[1]);
        }
      }
      expect(selected.length).toBeGreaterThan(25);
      selected.forEach(function (key) {
        var target = document.createElement("div");
        if (key.indexOf("--") === 0) {
          module.setCSSProperty(target, key, "1");
        } else if (["border", "outline", "rule"].includes(key)) {
          const name = key === "rule" ? "column-rule" : key;
          module.setCSSProperty(target, name + "-style", "solid");
        } else if (key === "border-collapse:collapse") {
          module.setCSSProperty(target, "border-collapse", "collapse");
        } else {
          module.setCSSProperty(target, "--x", key);
        }
        expect(
          (target.getAttribute(module.STYLE_KEYS_ATTR) || "").split(" "),
        ).toContain(key);
      });
    });

    it("has no selector on the style attribute in the stylesheets of the viewer document", function () {
      [
        assets.VivliostyleViewportScreenCss,
        assets.VivliostyleViewportCss,
        assets.VivliostylePolyfillCss,
      ].forEach(function (css) {
        expect(css).toBeTruthy();
        expect(css).not.toMatch(/\[\s*style\s*[\]*~|^$=]/);
      });
    });
  });
});
