describe("plugin", function() {
    "use strict";

    var fn1 = function() {}, fn2 = function() {};
    var hookName = vivliostyle.plugin.HOOKS["SIMPLE_PROPERTY"];

    var originalHooks;
    beforeAll(function() {
        originalHooks = vivliostyle.plugin.hooks;
    });
    beforeEach(function() {
        vivliostyle.plugin.hooks = {};
    });
    afterAll(function() {
        vivliostyle.plugin.hooks = originalHooks;
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
