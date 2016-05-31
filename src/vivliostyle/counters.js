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
     * @param {!vivliostyle.counters.CounterStore} counterStore
     * @param {string} baseURL
     * @constructor
     * @implements {adapt.csscasc.CounterListener}
     */
    function CounterListener(counterStore, baseURL) {
        /** @const */ this.counterStore = counterStore;
        /** @const */ this.baseURL = baseURL;
    }

    /**
     * @override
     */
    CounterListener.prototype.countersOfId = function(id, counters) {
        id = this.counterStore.documentURLTransformer.transformFragment(id, this.baseURL);
        this.counterStore.countersById[id] = counters;
    };

    /**
     * @param {!vivliostyle.counters.CounterStore} counterStore
     * @param {string} baseURL
     * @param {adapt.expr.LexicalScope} rootScope
     * @param {adapt.expr.LexicalScope} pageScope
     * @constructor
     * @implements {adapt.csscasc.CounterResolver}
     */
    function CounterResolver(counterStore, baseURL, rootScope, pageScope) {
        /** @const */ this.counterStore = counterStore;
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
        var transformedId = this.counterStore.documentURLTransformer.transformURL(url, this.baseURL);
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
            var values = self.counterStore.currentPageCounters[name];
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
            return self.counterStore.currentPageCounters[name] || [];
        }
        return new adapt.expr.Native(this.pageScope, function() {
            return format(getCounterNumbers());
        }, "page-counters-" + name)
    };

    /**
     * @private
     * @param {?string} id
     * @param {string} transformedId
     * @param {string} name
     * @returns {?Array<number>}
     */
    CounterResolver.prototype.getTargetCounters = function(id, transformedId, name) {
        var targetCounters = this.counterStore.countersById[transformedId];
        if (!targetCounters && id) {
            this.styler.styleUntilIdIsReached(id);
            targetCounters = this.counterStore.countersById[transformedId];
        }
        return (targetCounters && targetCounters[name]) || null;
    };

    /**
     * @private
     * @param {string} transformedId
     * @param {string} name
     * @returns {?Array<number>}
     */
    CounterResolver.prototype.getTargetPageCounters = function(transformedId, name) {
        if (this.counterStore.currentPage.elementsById[transformedId]) {
            return this.counterStore.currentPageCounters[name] || null;
        } else {
            var targetPageCounters = this.counterStore.pageCountersById[transformedId];
            if (targetPageCounters) {
                return targetPageCounters[name] || null;
            }
        }
        return null;
    };

    /**
     * @override
     */
    CounterResolver.prototype.getTargetCounterVal = function(url, name, format) {
        var id = this.getFragment(url);
        var transformedId = this.getTransformedId(url);
        var self = this;
        return new adapt.expr.Native(this.rootScope, function() {
            var arr = self.getTargetCounters(id, transformedId, name);
            if (arr && arr.length) {
                var numval = arr[arr.length - 1] || null;
                return format(numval);
            } else {
                arr = self.getTargetPageCounters(transformedId, name);
                var numval = (arr && arr.length && arr[arr.length - 1]) || null;
                return format(numval);
            }
        }, "target-counter-" + name + "-of-" + url);
    };

    /**
     * @override
     */
    CounterResolver.prototype.getTargetCountersVal = function(url, name, format) {
        var id = this.getFragment(url);
        var transformedId = this.getTransformedId(url);
        var self = this;
        return new adapt.expr.Native(this.rootScope, function() {
            var pageCounters = self.getTargetPageCounters(transformedId, name);
            var elementCounters = self.getTargetCounters(id, transformedId, name);
            return format((pageCounters ? pageCounters.concat(elementCounters) : elementCounters) || []);
        }, "target-counters-" + name + "-of-" + url);
    };

    /**
     * @param {!adapt.base.DocumentURLTransformer} documentURLTransformer
     * @constructor
     */
    vivliostyle.counters.CounterStore = function(documentURLTransformer) {
        /** @const */ this.documentURLTransformer = documentURLTransformer;
        /** @const {!Object.<string, !Object<string, !Array.<number>>>} */ this.countersById = {};
        /** @const {!Object.<string, !Object<string, !Array.<number>>>} */ this.pageCountersById = {};
        /** @const {!Object.<string, !Array<number>>} */ this.currentPageCounters = {};
        this.currentPageCounters["page"] = [0];
        /** @type {adapt.vtree.Page} */ this.currentPage = null;
    };

    /**
     * @param {string} baseURL
     * @returns {!adapt.csscasc.CounterListener}
     */
    vivliostyle.counters.CounterStore.prototype.createCounterListener = function(baseURL) {
        return new CounterListener(this, baseURL);
    };

    /**
     * @param {string} baseURL
     * @param {adapt.expr.LexicalScope} rootScope
     * @param {adapt.expr.LexicalScope} pageScope
     * @returns {!adapt.csscasc.CounterResolver}
     */
    vivliostyle.counters.CounterStore.prototype.createCounterResolver = function(baseURL, rootScope, pageScope) {
        return new CounterResolver(this, baseURL, rootScope, pageScope);
    };

    /**
     * @param {adapt.vtree.Page} page
     */
    vivliostyle.counters.CounterStore.prototype.setCurrentPage = function(page) {
        this.currentPage = page;
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

    vivliostyle.counters.CounterStore.prototype.finishPage = function() {
        var ids = Object.keys(this.currentPage.elementsById);
        if (ids.length > 0) {
            /** @type {!Object<string, Array<number>>} */ var counters = {};
            Object.keys(this.currentPageCounters).forEach(function(name) {
                counters[name] = Array.from(this.currentPageCounters[name]);
            }, this);
            ids.forEach(function(id) {
                this.pageCountersById[id] = counters;
            }, this);
        }
        this.currentPage = null;
    };

});
