module.exports = function(config) {
    var sourceFiles = require("../../src/source-list").map(function(src) {
        return "src/" + src;
    });
    var testFiles = [
        "test/util/dom.js",
        "test/util/matchers.js",
        "test/util/mock/vivliostyle/logging-mock.js",
        "test/util/mock/vivliostyle/plugin-mock.js",
        "test/spec/**/*.js"
    ];
    return {
        basePath: "../..",
        frameworks: ["jasmine"],
        files: sourceFiles.concat(testFiles),
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO
    };
};
