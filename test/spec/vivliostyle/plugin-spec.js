/**
 * Copyright 2017 Vivliostyle Inc.
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
describe("plugin", function() {
    "use strict";

    var fn1 = function() {}, fn2 = function() {};
    var hookName = vivliostyle.plugin.HOOKS["SIMPLE_PROPERTY"];

    vivliostyle.test.util.mock.plugin.setup();
    beforeEach(function() {
        vivliostyle.plugin.hooks = {};
    });

    describe("registerHook", function() {
        it("registers a function", function() {
            var hooks = vivliostyle.plugin.getHooksForName(hookName);
            expect(hooks).toEqual([]);

            vivliostyle.plugin.registerHook(hookName, fn1);
            hooks = vivliostyle.plugin.getHooksForName(hookName);
            expect(hooks).toEqual([fn1]);

            vivliostyle.plugin.registerHook(hookName, fn2);
            hooks = vivliostyle.plugin.getHooksForName(hookName);
            expect(hooks).toEqual([fn1, fn2]);

            vivliostyle.plugin.registerHook(hookName, fn1);
            hooks = vivliostyle.plugin.getHooksForName(hookName);
            expect(hooks).toEqual([fn1, fn2, fn1]);
        });

        it("skips unknown hook", function() {
            vivliostyle.plugin.registerHook("unknown hook", fn1);
            var hooks = vivliostyle.plugin.getHooksForName(hookName);
            expect(hooks).toEqual([]);
        });
    });

    describe("removeHook", function() {
        it("removes a function", function() {
            vivliostyle.plugin.registerHook(hookName, fn1);
            var hooks = vivliostyle.plugin.getHooksForName(hookName);
            expect(hooks).toEqual([fn1]);

            vivliostyle.plugin.removeHook(hookName, fn1);
            hooks = vivliostyle.plugin.getHooksForName(hookName);
            expect(hooks).toEqual([]);
        });

        it("removes one function at a time", function() {
            vivliostyle.plugin.registerHook(hookName, fn1);
            vivliostyle.plugin.registerHook(hookName, fn2);
            vivliostyle.plugin.registerHook(hookName, fn1);
            var hooks = vivliostyle.plugin.getHooksForName(hookName);
            expect(hooks).toEqual([fn1, fn2, fn1]);

            vivliostyle.plugin.removeHook(hookName, fn1);
            hooks = vivliostyle.plugin.getHooksForName(hookName);
            expect(hooks).toEqual([fn2, fn1]);

            vivliostyle.plugin.removeHook(hookName, fn1);
            hooks = vivliostyle.plugin.getHooksForName(hookName);
            expect(hooks).toEqual([fn2]);

            vivliostyle.plugin.removeHook(hookName, fn1);
            hooks = vivliostyle.plugin.getHooksForName(hookName);
            expect(hooks).toEqual([fn2]);
        });

        it("ignores unknown hook", function() {
            vivliostyle.plugin.registerHook(hookName, fn1);
            var hooks = vivliostyle.plugin.getHooksForName(hookName);
            expect(hooks).toEqual([fn1]);

            vivliostyle.plugin.removeHook("unknown hook", fn1);
            hooks = vivliostyle.plugin.getHooksForName(hookName);
            expect(hooks).toEqual([fn1]);
        });
    });

});
