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
     * @param {string} baseURL
     * @param {adapt.expr.LexicalScope} rootScope
     * @constructor
     * @implements {adapt.csscasc.CounterResolver}
     */
    function CounterResolver(documentURLTransformer, countersById, baseURL, rootScope) {
        /** @const */ this.documentURLTransformer = documentURLTransformer;
        /** @const */ this.countersById = countersById;
        /** @const */ this.baseURL = baseURL;
        /** @const */ this.rootScope = rootScope;
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
     *
     * @param {!adapt.base.DocumentURLTransformer} documentURLTransformer
     * @constructor
     */
    vivliostyle.counters.CounterStore = function(documentURLTransformer) {
        /** @const */ this.documentURLTransformer = documentURLTransformer;
        /** @const {!Object.<string, !Object<string, !Array.<number>>>} */ this.countersById = {};
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
     * @returns {!adapt.csscasc.CounterResolver}
     */
    vivliostyle.counters.CounterStore.prototype.createCounterResolver = function(baseURL, rootScope) {
        return new CounterResolver(this.documentURLTransformer, this.countersById, baseURL, rootScope);
    };

});
