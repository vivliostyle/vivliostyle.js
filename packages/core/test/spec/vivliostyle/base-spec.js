/**
 * Copyright 2017 Trim-marks Inc.
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

import * as adapt_base from "../../../src/ts/vivliostyle/base";

describe("base", function() {
  var module = adapt_base;

  describe("escapeCharToHex", function() {
    it("escape the first character to a 4-digit hex code and add the specified prefix", function() {
      expect(module.escapeCharToHex("a", ":")).toBe(":0061");
      expect(module.escapeCharToHex(":", ":")).toBe(":003a");
    });

    it("escape the first character to a 4-digit hex code and add '\\u' prefix when prefix is not specified", function() {
      expect(module.escapeCharToHex("a")).toBe("\\u0061");
      expect(module.escapeCharToHex("\\")).toBe("\\u005c");
    });
  });

  describe("escapeNameStrToHex", function() {
    it("escape characters other than [-a-zA-Z0-9_] to 4-digit hex codes and add the specified prefix to each of them", function() {
      expect(module.escapeNameStrToHex("abc-_:%/\\", ":")).toBe(
        "abc-_:003a:0025:002f:005c",
      );
    });

    it("escape characters other than [-a-zA-Z0-9_] to 4-digit hex codes and add '\\u' prefix to each of them when prefix is not specified", function() {
      expect(module.escapeNameStrToHex("abc-_:%/\\")).toBe(
        "abc-_\\u003a\\u0025\\u002f\\u005c",
      );
    });
  });

  describe("unescapeCharFromHex", function() {
    it("unescape a 4-digit hex code with the specified prefix to the original character", function() {
      expect(module.unescapeCharFromHex(":0061", ":")).toBe("a");
      expect(module.unescapeCharFromHex(":003a", ":")).toBe(":");
    });

    it("unescape a 4-digit hex code with '\\u' prefix to the original character when prefix is not specified", function() {
      expect(module.unescapeCharFromHex("\\u0061")).toBe("a");
      expect(module.unescapeCharFromHex("\\u005c")).toBe("\\");
    });
  });

  describe("unescapeStrFromHex", function() {
    it("unescape a string containing 4-digit hex codes with the specified prefix to the original string", function() {
      expect(module.unescapeStrFromHex("abc-_:003a:0025:002f:005c", ":")).toBe(
        "abc-_:%/\\",
      );
    });

    it("unescape a string containing 4-digit hex codes with '\\u' prefix to the orignal string when prefix is not specified", function() {
      expect(
        module.unescapeStrFromHex("abc-_\\u003a\\u0025\\u002f\\u005c"),
      ).toBe("abc-_:%/\\");
    });
  });
});
