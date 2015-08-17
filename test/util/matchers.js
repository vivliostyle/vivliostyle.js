/**
 * Copyright 2015 Vivliostyle Inc.
 */
goog.provide("vivliostyle.test.util.matchers");

(function() {
    function isSameNode(node1, node2) {
        return !!node1 && (node1.compareDocumentPosition(node2) === 0);
    }

    var matchers = {
        toBeSameNodeAs: function() {
            return {
                compare: function(node1, node2) {
                    return {pass: isSameNode(node1, node2)};
                }
            };
        }
    };

    vivliostyle.test.util.matchers.addMatchers = function() {
        jasmine.addMatchers(matchers);
    };
})();
