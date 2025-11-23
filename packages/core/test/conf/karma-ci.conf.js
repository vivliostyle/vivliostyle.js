/**
 * Copyright 2017 Daishinsha Inc.
 * Copyright 2025 Vivliostyle Foundation
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
/*eslint global-require: "off" */

module.exports = function (config) {
  var commonConfig = require("./karma-common.conf")(config);

  // Get browser from environment variable or default to Chrome
  var browser = process.env.TEST_BROWSER || "ChromeHeadless";

  // Browser configuration
  var browsers;
  var customLaunchers = {};

  if (browser === "Safari") {
    // Safari doesn't have a headless mode
    browsers = ["Safari"];
    customLaunchers.Safari = {
      base: "Safari",
    };
  } else if (browser === "Firefox") {
    browsers = ["FirefoxHeadless"];
    customLaunchers.FirefoxHeadless = {
      base: "Firefox",
      flags: ["-headless", "-safe-mode"],
      prefs: {
        "media.navigator.streams.fake": true,
        "media.navigator.permission.disabled": true,
        "devtools.console.stdout.chrome": true,
        "browser.dom.window.dump.enabled": true,
      },
    };
  } else {
    // Default to Chrome
    browsers = ["ChromeHeadless"];
    customLaunchers.ChromeHeadless = {
      base: "Chrome",
      flags: [
        "--headless",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-dev-shm-usage",
      ],
    };
  }

  var options = {
    reporters: ["verbose"],
    browsers: browsers,
    customLaunchers: customLaunchers,
    singleRun: true,
    captureTimeout: 180000,
    browserNoActivityTimeout: 180000,
    browserDisconnectTimeout: 180000,
    browserDisconnectTolerance: 3,
  };

  for (var key in commonConfig) {
    if (commonConfig.hasOwnProperty(key)) {
      options[key] = commonConfig[key];
    }
  }

  config.set(options);
};
