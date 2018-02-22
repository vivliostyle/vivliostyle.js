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
goog.provide("vivliostyle.test.util.mock.plugin");

(function() {
    var pluginMock = vivliostyle.test.util.mock.plugin;

    pluginMock.setup = function() {
        var originalHooks;
        beforeAll(function() {
            originalHooks = vivliostyle.plugin.hooks;
        });
        beforeEach(function() {
            var hooks = vivliostyle.plugin.hooks = {};
            Object.keys(originalHooks).forEach(function(name) {
                hooks[name] = Array.from(originalHooks[name]);
            });
        });
        afterAll(function() {
            vivliostyle.plugin.hooks = originalHooks;
        });
    };
})();
