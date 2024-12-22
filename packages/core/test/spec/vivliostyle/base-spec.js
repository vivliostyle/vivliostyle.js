/**
 * Copyright 2017 Daishinsha Inc.
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

  describe("setCSSProperty", function () {
    it("sets a single CSS property", function () {
      const elem = document.createElement("p");
      module.setCSSProperty(elem, "color", "red");

      const styleStr = elem.getAttribute("style");
      expect(styleStr).toMatch(/color\s*:\s*red/);
    });

    it("overrides an existing CSS property", function () {
      const elem = document.createElement("p");
      module.setCSSProperty(elem, "color", "red");
      module.setCSSProperty(elem, "color", "green");

      const styleStr = elem.getAttribute("style");
      expect(styleStr).toMatch(/color\s*:\s*green/);
    });

    it("adds multiple CSS properties", function () {
      const elem = document.createElement("p");
      module.setCSSProperty(elem, "color", "red");
      module.setCSSProperty(elem, "background-color", "green");

      const styleStr = elem.getAttribute("style");
      expect(styleStr).toMatch(/color\s*:\s*red/);
      expect(styleStr).toMatch(/background-color\s*:\s*green/);
    });

    it("sets shorthand CSS properties for margin", function () {
      const elem = document.createElement("div");
      module.setCSSProperty(elem, "margin-top", "10px");
      module.setCSSProperty(elem, "margin-right", "15px");
      module.setCSSProperty(elem, "margin-bottom", "20px");
      module.setCSSProperty(elem, "margin-left", "25px");

      const styleStr = elem.getAttribute("style");
      expect(styleStr).toMatch(/margin:\s*10px\s+15px\s+20px\s+25px/);
    });

    it("rounds CSS property values", function () {
      const elem = document.createElement("div");
      module.setCSSProperty(elem, "margin-right", "2.4000000000000004px");

      const styleStr = elem.getAttribute("style");
      expect(styleStr).toContain("2.4px");
    });

    it("serializes hex to rgb() format", function () {
      const elem = document.createElement("p");
      module.setCSSProperty(elem, "color", "#ff0000");

      const styleStr = elem.getAttribute("style");
      expect(styleStr).toMatch(
        /^[\s;]*color\s*:\s*rgb\s*\(\s*255\s*,?\s*0\s*,?\s*0\s*\)[\s;]*$/,
      );
    });

    it("supports rgb() with integer values", function () {
      const elem = document.createElement("p");
      module.setCSSProperty(elem, "color", "rgb(0, 1, 2)");

      const styleStr = elem.getAttribute("style");
      expect(styleStr).toMatch(
        /^[\s;]*color\s*:\s*rgb\s*\(\s*0\s*,?\s*1\s*,?\s*2\s*\)[\s;]*$/,
      );
    });

    it("supports rgb() with decimal values", function () {
      const elem = document.createElement("p");
      module.setCSSProperty(elem, "color", "rgb(0 0.1 0.2)");

      const styleStr = elem.getAttribute("style");
      expect(styleStr).toMatch(/rgb\s*\(\s*0\s*,?\s*0\.1\s*,?\s*0\.2\s*\)/);
    });

    it("supports linear gradients with rgb() integer values", function () {
      const elem = document.createElement("div");
      module.setCSSProperty(
        elem,
        "background-image",
        "linear-gradient(45deg, rgb(0, 0, 0), rgb(255, 255, 255))",
      );

      const styleStr = elem.getAttribute("style");
      expect(styleStr).toMatch(
        /^[\s;]*background-image\s*:\s*linear-gradient\s*\(\s*45deg\s*,?\s*rgb\s*\(\s*0\s*,?\s*0\s*,?\s*0\s*\)\s*,?\s*rgb\s*\(\s*255\s*,?\s*255\s*,?\s*255\s*\)\s*\)[\s;]*$/,
      );
    });

    it("supports linear gradients with rgb() decimal values", function () {
      const elem = document.createElement("div");
      module.setCSSProperty(
        elem,
        "background-image",
        "linear-gradient(45deg, rgb(0 0.1 0.2), rgb(255 254.9 254.8))",
      );

      const styleStr = elem.getAttribute("style");
      expect(styleStr).toMatch(
        /linear-gradient\s*\(\s*45deg\s*,?\s*rgb\s*\(\s*0\s*,?\s*0\.1\s*,?\s*0\.2\s*\)\s*,?\s*rgb\s*\(\s*255\s*,?\s*254\.9\s*,?\s*254\.8\s*\)\s*\)/,
      );
    });
  });
});
