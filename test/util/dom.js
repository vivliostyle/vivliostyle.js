/**
 * Copyright 2015 Vivliostyle Inc.
 */
goog.provide("vivliostyle.test.util.dom");

(function() {
    var domUtil = vivliostyle.test.util.dom;

    var dummyElements = [];

    afterEach(function() {
        var e;
        while (e = dummyElements.shift()) {
            if (e.parentNode) {
                e.parentNode.removeChild(e);
            }
        }
    });

    domUtil.getWindow = function() {
        return window;
    };

    domUtil.getDummyContainer = function() {
        var e = document.createElement("div");
        document.body.appendChild(e);
        dummyElements.push(e);
        return e;
    };
})();
