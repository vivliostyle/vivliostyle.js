/**
 * Copyright 2016 Vivliostyle Inc.
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
