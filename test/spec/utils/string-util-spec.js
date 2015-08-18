"use strict";

import stringUtil from "../../../src/js/utils/string-util";

describe("String Utils", function() {
    describe("escapeUnicodeChar", function() {
        it("returns a four-digit hexadecimal representation of the unicode character", function() {
            expect(stringUtil.escapeUnicodeChar("あ")).toBe("\\u3042");
        });
    });

    describe("escapeUnicodeString", function() {
        it("returns an escaped string in which non alphanumeric characters are escaped by escapeUnicodeChar", function() {
            expect(stringUtil.escapeUnicodeString("あc-3_い")).toBe("\\u3042c-3_\\u3044");
        });
    });
});
