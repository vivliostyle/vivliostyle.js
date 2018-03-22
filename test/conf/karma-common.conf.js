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
    "test/spec/**/*.js",
    "plugins/*/test/spec/**/*.js"
];

module.exports = function(config) {
    return {
        basePath: "../..",
        frameworks: ["jasmine", "commonjs"],
        files: sourceFiles.concat(testFiles).concat(commonJsSourceFiles),
        preprocessors: Object.assign({
            'src/vivliostyle/diff.js': ['commonjs']
        }, commonJsSourceFiles.reduce(function(r, f) {
            r[f] = ['commonjs'];
            return r;
        }, {})),
        commonjsPreprocessor: {
            modulesRoot: './'
        },
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO
    };
};
