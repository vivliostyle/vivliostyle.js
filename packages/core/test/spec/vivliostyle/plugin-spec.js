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

import * as vivliostyle_plugin from "../../../src/ts/vivliostyle/plugin";
import * as vivliostyle_test_util_mock_plugin from "../../util/mock/vivliostyle/plugin-mock";

// FIXME: cannot access to vivliostyle_plugin.hooks

describe("plugin", function() {
  "use strict";

  var fn1 = function() {},
    fn2 = function() {};
  var hookName = vivliostyle_plugin.HOOKS["SIMPLE_PROPERTY"];

  vivliostyle_test_util_mock_plugin.setup();
  beforeEach(function() {
    // vivliostyle_plugin.hooks = {};
  });

  // describe("registerHook", function() {
  //     it("registers a function", function() {
  //         var hooks = vivliostyle_plugin.getHooksForName(hookName);
  //         expect(hooks).toEqual([]);

  //         vivliostyle_plugin.registerHook(hookName, fn1);
  //         hooks = vivliostyle_plugin.getHooksForName(hookName);
  //         expect(hooks).toEqual([fn1]);

  //         vivliostyle_plugin.registerHook(hookName, fn2);
  //         hooks = vivliostyle_plugin.getHooksForName(hookName);
  //         expect(hooks).toEqual([fn1, fn2]);

  //         vivliostyle_plugin.registerHook(hookName, fn1);
  //         hooks = vivliostyle_plugin.getHooksForName(hookName);
  //         expect(hooks).toEqual([fn1, fn2, fn1]);
  //     });

  //     it("skips unknown hook", function() {
  //         vivliostyle_plugin.registerHook("unknown hook", fn1);
  //         var hooks = vivliostyle_plugin.getHooksForName(hookName);
  //         expect(hooks).toEqual([]);
  //     });
  // });

  describe("removeHook", function() {
    // it("removes a function", function() {
    //     vivliostyle_plugin.registerHook(hookName, fn1);
    //     var hooks = vivliostyle_plugin.getHooksForName(hookName);
    //     expect(hooks).toEqual([fn1]);

    //     vivliostyle_plugin.removeHook(hookName, fn1);
    //     hooks = vivliostyle_plugin.getHooksForName(hookName);
    //     expect(hooks).toEqual([]);
    // });

    it("removes one function at a time", function() {
      vivliostyle_plugin.registerHook(hookName, fn1);
      vivliostyle_plugin.registerHook(hookName, fn2);
      vivliostyle_plugin.registerHook(hookName, fn1);
      var hooks = vivliostyle_plugin.getHooksForName(hookName);
      expect(hooks).toEqual([fn1, fn2, fn1]);

      vivliostyle_plugin.removeHook(hookName, fn1);
      hooks = vivliostyle_plugin.getHooksForName(hookName);
      expect(hooks).toEqual([fn2, fn1]);

      vivliostyle_plugin.removeHook(hookName, fn1);
      hooks = vivliostyle_plugin.getHooksForName(hookName);
      expect(hooks).toEqual([fn2]);

      vivliostyle_plugin.removeHook(hookName, fn1);
      hooks = vivliostyle_plugin.getHooksForName(hookName);
      expect(hooks).toEqual([fn2]);
    });

    // it("ignores unknown hook", function() {
    //     vivliostyle_plugin.registerHook(hookName, fn1);
    //     var hooks = vivliostyle_plugin.getHooksForName(hookName);
    //     expect(hooks).toEqual([fn1]);

    //     vivliostyle_plugin.removeHook("unknown hook", fn1);
    //     hooks = vivliostyle_plugin.getHooksForName(hookName);
    //     expect(hooks).toEqual([fn1]);
    // });
  });
});
