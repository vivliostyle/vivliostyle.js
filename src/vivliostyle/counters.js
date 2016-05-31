/**
 * Copyright 2016 Vivliostyle Inc.
 * @fileoverview Counters
 */

goog.provide("vivliostyle.counters");

goog.require("adapt.base");
goog.require("adapt.expr");
goog.require("adapt.csscasc");
goog.require("adapt.cssstyler");

goog.scope(function() {

    /**
     *
     * @param {!adapt.base.DocumentURLTransformer} documentURLTransformer
     * @param {!Object<string, !Object<string, !Array<number>>>} countersById
     * @param {string} baseURL
     * @constructor
     * @implements {adapt.csscasc.CounterListener}
     */
    function CounterListener(documentURLTransformer, countersById, baseURL) {
        /** @const */ this.documentURLTransformer = documentURLTransformer;
        /** @const */ this.countersById = countersById;
        /** @const */ this.baseURL = baseURL;
    }

    /**
     * @override
     */
    CounterListener.prototype.countersOfId = function(id, counters) {
        id = this.documentURLTransformer.transformFragment(id, this.baseURL);
        this.countersById[id] = counters;
    };

    /**
     *
     * @param {!adapt.base.DocumentURLTransformer} documentURLTransformer
     * @param {!Object<string, !Object<string, !Array<number>>>} countersById
     * @param {!Object.<string, !Array<number>>} currentPageCounters
     * @param {string} baseURL
     * @param {adapt.expr.LexicalScope} rootScope
     * @param {adapt.expr.LexicalScope} pageScope
     * @constructor
     * @implements {adapt.csscasc.CounterResolver}
     */
    function CounterResolver(documentURLTransformer, countersById, currentPageCounters, baseURL, rootScope, pageScope) {
        /** @const */ this.documentURLTransformer = documentURLTransformer;
        /** @const */ this.countersById = countersById;
        /** @const */ this.currentPageCounters = currentPageCounters;
        /** @const */ this.baseURL = baseURL;
        /** @const */ this.rootScope = rootScope;
        /** @const */ this.pageScope = pageScope;
        /** @type {?adapt.cssstyler.Styler} */ this.styler = null;
    }

    /**
     *
     * @param {!adapt.cssstyler.Styler} styler
     */
    CounterResolver.prototype.setStyler = function(styler) {
        this.styler = styler;
    };

    /**
     * @private
     * @param {string} url
     * @returns {?string}
     */
    CounterResolver.prototype.getFragment = function(url) {
        var r = url.match(/^[^#]*#(.*)$/);
        return r ? r[1] : null;
    };

    /**
     * @private
     * @param {string} url
     * @returns {string}
     */
    CounterResolver.prototype.getTransformedId = function(url) {
        var transformedId = this.documentURLTransformer.transformURL(url, this.baseURL);
        if (transformedId.charAt(0) === "#") {
            transformedId = transformedId.substring(1);
        }
        return transformedId;
    };

    /**
     * @override
     */
    CounterResolver.prototype.getPageCounterVal = function(name, format) {
        var self = this;
        function getCounterNumber() {
            var values = self.currentPageCounters[name];
            return (values && values.length) ? values[values.length - 1] : null;
        }
        return new adapt.expr.Native(this.pageScope, function() {
            return format(getCounterNumber());
        }, "page-counter-" + name);
    };

    /**
     * @override
     */
    CounterResolver.prototype.getPageCountersVal = function(name, format) {
        var self = this;
        function getCounterNumbers() {
            return self.currentPageCounters[name] || [];
        }
        return new adapt.expr.Native(this.pageScope, function() {
            return format(getCounterNumbers());
        }, "page-counters-" + name)
    };

    /**
     * @override
     */
    CounterResolver.prototype.getTargetCounterVal = function(url, name, format) {
        var id = this.getFragment(url);
        var transformedId = this.getTransformedId(url);
        var self = this;
        var scope = this.rootScope;
        return new adapt.expr.Native(scope, function() {
            var targetCounters = self.countersById[transformedId];
            if (!targetCounters && id) {
                self.styler.styleUntilIdIsReached(id);
                targetCounters = self.countersById[transformedId];
            }
            var arr = targetCounters && targetCounters[name];
            var numval = (arr && arr.length && arr[arr.length - 1]) || null;
            return format(numval);
        }, "target-counter-" + name + "-of-#" + transformedId);
    };

    /**
     * @override
     */
    CounterResolver.prototype.getTargetCountersVal = function(url, name, format) {
        var id = this.getFragment(url);
        var transformedId = this.getTransformedId(url);
        var self = this;
        var scope = this.rootScope;
        return new adapt.expr.Native(scope, function() {
            var targetCounters = self.countersById[transformedId];
            if (!targetCounters && id) {
                self.styler.styleUntilIdIsReached(id);
                targetCounters = self.countersById[transformedId];
            }
            var arr = targetCounters && targetCounters[name];
            return format(arr || []);
        }, "target-counters-" + name + "-of-#" + transformedId);
    };

    /**
     * @param {!adapt.base.DocumentURLTransformer} documentURLTransformer
     * @constructor
     */
    vivliostyle.counters.CounterStore = function(documentURLTransformer) {
        /** @const */ this.documentURLTransformer = documentURLTransformer;
        /** @const {!Object.<string, !Object<string, !Array.<number>>>} */ this.countersById = {};
        /** @const {!Object.<string, !Array<number>>} */ this.currentPageCounters = {};
        this.currentPageCounters["page"] = [0];
    };

    /**
     *
     * @param {string} baseURL
     * @returns {!adapt.csscasc.CounterListener}
     */
    vivliostyle.counters.CounterStore.prototype.createCounterListener = function(baseURL) {
        return new CounterListener(this.documentURLTransformer, this.countersById, baseURL);
    };

    /**
     *
     * @param {string} baseURL
     * @param {adapt.expr.LexicalScope} rootScope
     * @param {adapt.expr.LexicalScope} pageScope
     * @returns {!adapt.csscasc.CounterResolver}
     */
    vivliostyle.counters.CounterStore.prototype.createCounterResolver = function(baseURL, rootScope, pageScope) {
        return new CounterResolver(this.documentURLTransformer, this.countersById, this.currentPageCounters,
            baseURL, rootScope, pageScope);
    };

    /**
     * @private
     * @param {string} counterName
     * @param {number} value
     */
    vivliostyle.counters.CounterStore.prototype.definePageCounter = function(counterName, value) {
        if (this.currentPageCounters[counterName]) {
            this.currentPageCounters[counterName].push(value);
        } else {
            this.currentPageCounters[counterName] = [value];
        }
    };

    /**
     * Update the page-based counters with 'counter-reset' and 'counter-increment' properties within the page context. Call before starting layout of the page.
     * @param {!adapt.csscasc.ElementStyle} cascadedPageStyle
     * @param {!adapt.expr.Context} context
     */
    vivliostyle.counters.CounterStore.prototype.updatePageCounters = function(cascadedPageStyle, context) {
        var resetMap;
        var reset = cascadedPageStyle["counter-reset"];
        if (reset) {
            var resetVal = reset.evaluate(context);
            if (resetVal) {
                resetMap = adapt.cssprop.toCounters(resetVal, true);
            }
        }
        if (resetMap) {
            for (var resetCounterName in resetMap) {
                this.definePageCounter(resetCounterName, resetMap[resetCounterName]);
            }
        }

        var incrementMap;
        var increment = cascadedPageStyle["counter-increment"];
        if (increment) {
            var incrementVal = increment.evaluate(context);
            if (incrementVal) {
                incrementMap = adapt.cssprop.toCounters(incrementVal, false);
            }
        }
        // If 'counter-increment' for the builtin 'page' counter is absent, add it with value 1.
        if (incrementMap) {
            if (!("page" in incrementMap)) {
                incrementMap["page"] = 1;
            }
        } else {
            incrementMap = {};
            incrementMap["page"] = 1;
        }
        for (var incrementCounterName in incrementMap) {
            if (!this.currentPageCounters[incrementCounterName]) {
                this.definePageCounter(incrementCounterName, 0);
            }
            var counterValues = this.currentPageCounters[incrementCounterName];
            counterValues[counterValues.length - 1] += incrementMap[incrementCounterName];
        }
    };

});
