/**
 * Copyright 2026 Vivliostyle Foundation
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

// Karma launcher that runs the tests in Playwright's WebKit through the
// Playwright API, which manages the browser process itself.
// Install the browser with `npx playwright install webkit` first.
function PlaywrightWebKitLauncher(
  baseLauncherDecorator,
  captureTimeoutLauncherDecorator,
  retryLauncherDecorator,
  logger,
) {
  // The process launcher decorator is left out: there is no command to spawn.
  baseLauncherDecorator(this);
  captureTimeoutLauncherDecorator(this);
  retryLauncherDecorator(this);
  const log = logger.create("launcher.PlaywrightWebKit");
  let browser = null;
  let killing = false;

  this.name = "PlaywrightWebKit";

  this.on("start", async (url) => {
    killing = false;
    try {
      const { webkit } = require("playwright");
      browser = await webkit.launch();
      browser.on("disconnected", () => {
        browser = null;
        if (!killing) this._done("crash");
      });
      const page = await browser.newPage();
      await page.goto(url);
    } catch (error) {
      log.error(`Cannot start Playwright WebKit\n\t${error.message}`);
      this._done("failure");
    }
  });

  this.on("kill", async (done) => {
    killing = true;
    if (browser) {
      try {
        await browser.close();
      } catch (error) {
        log.debug(`Cannot close Playwright WebKit: ${error.message}`);
      }
      browser = null;
    }
    this._done();
    done();
  });
}

PlaywrightWebKitLauncher.$inject = [
  "baseLauncherDecorator",
  "captureTimeoutLauncherDecorator",
  "retryLauncherDecorator",
  "logger",
];

module.exports = {
  "launcher:PlaywrightWebKit": ["type", PlaywrightWebKitLauncher],
};
