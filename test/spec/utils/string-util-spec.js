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

import stringUtil from "../../../src/ts/utils/string-util";

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
