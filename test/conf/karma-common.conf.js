module.exports = function(config) {
    var sourceFiles = require("../../src/source-list").map(function(src) {
        return "src/" + src;
    });
    var testFiles = [
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
