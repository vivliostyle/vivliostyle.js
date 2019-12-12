/**
 * Copyright 2016 Trim-marks Inc.
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
// goog.provide("vivliostyle.test.util.mock.plugin");

import * as vivliostyle_plugin from "../../../../src/ts/vivliostyle/plugin";

// (function() {
//     var pluginMock = vivliostyle.test.util.mock.plugin;

// FIXME: cannot access to vivliostyle_plugin.hooks

export const setup = function() {
  var originalHooks;
  beforeAll(function() {
    // originalHooks = vivliostyle_plugin.hooks;
  });
  beforeEach(function() {
    // var hooks = vivliostyle_plugin.hooks = {};
    // Object.keys(originalHooks).forEach(function(name) {
    //     hooks[name] = Array.from(originalHooks[name]);
    // });
  });
  afterAll(function() {
    // vivliostyle_plugin.hooks = originalHooks;
  });
};
// })();
