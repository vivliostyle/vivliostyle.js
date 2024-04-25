/**
 * Copyright 2017 Daishinsha Inc.
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
/*eslint global-require: "off", no-process-env: "off" */
module.exports = function (config) {
  var commonConfig = require("./karma-common.conf")(config);
  var customLaunchers = {
    sl_chrome: {
      base: "SauceLabs",
      browserName: "chrome",
      platform: "Windows 10",
    },
    // cannot test firefox until the following issue is resolved:
    // https://github.com/karma-runner/karma-sauce-launcher/issues/275
    // sl_firefox: {
    //   base: "SauceLabs",
    //   browserName: "firefox",
    //   platform: "Windows 10",
    // },
    sl_safari: {
      base: "SauceLabs",
      browserName: "safari",
      platform: "macOS 10.15",
    },
    sl_edge: {
      base: "SauceLabs",
      browserName: "MicrosoftEdge",
      platform: "Windows 10",
    },
  };

  var options = {
    reporters: ["verbose", "saucelabs"],
    sauceLabs: {
      build: process.env.GITHUB_RUN_NUMBER,
      testName: "Vivliostyle.js",
      recordScreenshots: false,
      startConnect: true,
    },
    captureTimeout: 120000,
    customLaunchers: customLaunchers,
    browsers: Object.keys(customLaunchers),
    singleRun: true,
    concurrency: 4,
  };
  for (var key in commonConfig) {
    if (commonConfig.hasOwnProperty(key)) {
      options[key] = commonConfig[key];
    }
  }

  config.set(options);
};
