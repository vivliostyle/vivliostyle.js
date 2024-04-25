/*
 * Copyright 2015 Daishinsha Inc.
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

// eslint-disable-next-line @typescript-eslint/no-var-requires
const rollupConfig = require("../../rollup.config.js");

const TEST_FILES = "test/spec/**/*.js";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
module.exports = function (config) {
  return {
    basePath: "../..",
    frameworks: ["jasmine"],
    preprocessors: {
      [TEST_FILES]: ["rollup"],
    },
    files: [TEST_FILES],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    rollupPreprocessor: rollupConfig,
  };
};
