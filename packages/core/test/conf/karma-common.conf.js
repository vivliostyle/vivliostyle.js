/**
 * Copyright 2017 Trim-marks Inc.
 * Copyright 2019 Vivliostyle Foundation
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

const webpack = require("webpack");
const karmaWebpack = require("karma-webpack");

var testFiles = [
  "test/util/dom.js",
  "test/util/matchers.js",
  // "test/util/mock/vivliostyle/logging-mock.js",
  // "test/util/mock/vivliostyle/plugin-mock.js",
  "test/spec/**/*.js",
  // "plugins/*/test/spec/**/*.js"
];

module.exports = function (config) {
  return {
    basePath: "../..",
    frameworks: ["jasmine"],
    files: testFiles,
    preprocessors: {
      "test/{util,spec}/**/*.js": ["webpack", "sourcemap"],
    },
    webpack: {
      mode:
        process.env.NODE_ENV === "production" ? "production" : "development",
      entry: "../src/vivliostyle.ts",
      devtool: "inline-source-map",
      resolve: {
        extensions: [".ts", ".js"],
      },
      module: {
        rules: [
          {
            test: /\.ts$/,
            loader: "ts-loader",
          },
          {
            test: /\.(css|txt|xml)$/,
            use: "raw-loader",
          },
        ],
      },
      plugins: [
        new webpack.DefinePlugin({
          VIVLIOSTYLE_DEBUG: JSON.stringify(
            process.env.NODE_ENV !== "production",
          ),
        }),
      ],
    },
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
  };
};
