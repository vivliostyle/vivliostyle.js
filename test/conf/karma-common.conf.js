/*eslint-env node */
var sourceList = require("../../src/source-list");
var sourceFiles = sourceList.list.map(function(src) {
    return "src/" + src;
});
var commonJsSourceFiles = sourceList.commonJsModuleList;

var testFiles = [
    "test/util/dom.js",
    "test/util/matchers.js",
    "test/util/mock/vivliostyle/logging-mock.js",
    "test/util/mock/vivliostyle/plugin-mock.js",
    "test/spec/**/*.js"
];

module.exports = function(config) {
    return {
        basePath: "../..",
        frameworks: ["jasmine", 'commonjs'],
        files: sourceFiles.concat(testFiles).concat(commonJsSourceFiles),
        preprocessors: {
        },
        commonjsPreprocessor: {
            modulesRoot: './'
        },
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO
    };
};
