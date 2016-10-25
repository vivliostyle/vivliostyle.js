describe("base", function() {
    var module = adapt.base;

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
            expect(module.escapeNameStrToHex("abc-_:%/\\", ":")).toBe("abc-_:003a:0025:002f:005c");
        });

        it("escape characters other than [-a-zA-Z0-9_] to 4-digit hex codes and add '\\u' prefix to each of them when prefix is not specified", function() {
            expect(module.escapeNameStrToHex("abc-_:%/\\")).toBe("abc-_\\u003a\\u0025\\u002f\\u005c");
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
            expect(module.unescapeStrFromHex("abc-_:003a:0025:002f:005c", ":")).toBe("abc-_:%/\\");
        });

        it("unescape a string containing 4-digit hex codes with '\\u' prefix to the orignal string when prefix is not specified", function() {
            expect(module.unescapeStrFromHex("abc-_\\u003a\\u0025\\u002f\\u005c")).toBe("abc-_:%/\\");
        });
    });
});
