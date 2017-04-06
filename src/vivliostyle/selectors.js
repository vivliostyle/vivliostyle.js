/**
 * Copyright 2016 Vivliostyle Inc.
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
 *
 * @fileoverview Utilities for selectors.
 */
goog.provide("vivliostyle.selectors");

goog.require("vivliostyle.namespace");

goog.scope(function() {

    "use strict";

    /**
     * @interface
     */
    vivliostyle.selectors.Matcher = function() {};
    /** @const */ var Matcher = vivliostyle.selectors.Matcher;

    /**
     * @param {adapt.vtree.NodeContext} nodeContext
     * @return {boolean}
     */
    Matcher.prototype.matches = function(nodeContext) {};


    /**
     * @constructor
     * @implements {vivliostyle.selectors.Matcher}
     * @param {number} elementOffset
     * @param {number} a
     * @param {number} b
     */
    vivliostyle.selectors.NthFragmentMatcher = function(elementOffset, a, b) {
        /** @const */ this.elementOffset = elementOffset;
        /** @const */ this.a = a;
        /** @const */ this.b = b;
    };
    /** @const */ var NthFragmentMatcher = vivliostyle.selectors.NthFragmentMatcher;

    /** @override */
    NthFragmentMatcher.prototype.matches = function(nodeContext) {
        var fragmentIndex = vivliostyle.selectors.fragmentIndices[this.elementOffset];
        return fragmentIndex != null
            && adapt.csscasc.matchANPlusB(fragmentIndex, this.a, this.b);
    };

    /**
     * @constructor
     * @implements {vivliostyle.selectors.Matcher}
     * @param {!Array.<vivliostyle.selectors.Matcher>} matchers
     */
    vivliostyle.selectors.AnyMatcher = function(matchers) {
        /** @const */ this.matchers = matchers;
    };
    /** @const */ var AnyMatcher = vivliostyle.selectors.AnyMatcher;

    /** @override */
    AnyMatcher.prototype.matches = function(nodeContext) {
        return this.matchers.some(function(matcher) {
            return matcher.matches(nodeContext);
        });
    };

    /**
     * @constructor
     * @implements {vivliostyle.selectors.Matcher}
     * @param {!Array.<vivliostyle.selectors.Matcher>} matchers
     */
    vivliostyle.selectors.AllMatcher = function(matchers) {
        /** @const */ this.matchers = matchers;
    };
    /** @const */ var AllMatcher = vivliostyle.selectors.AllMatcher;

    /** @override */
    AllMatcher.prototype.matches = function(nodeContext) {
        return this.matchers.every(function(matcher) {
            return matcher.matches(nodeContext);
        });
    };

    /**
     * @constructor
     */
    vivliostyle.selectors.MatcherBuilder = function() {};
    /** @const */ var MatcherBuilder = vivliostyle.selectors.MatcherBuilder;

    /**
     * @param {number} elementOffset
     * @param {string} viewCondition
     * @return {vivliostyle.selectors.Matcher}
     */
    MatcherBuilder.prototype.buildViewConditionMatcher = function(elementOffset, viewCondition) {
        var strs = viewCondition.split("_");
        if (strs[0] == "NFS") {
            return new NthFragmentMatcher(elementOffset,
                parseInt(strs[1], 10), parseInt(strs[2], 10));
        } else {
            goog.asserts.fail("unknown view condition. condition=" + viewCondition);
            return null;
        }
    };

    /**
     * @param {!Array.<!vivliostyle.selectors.Matcher>} matchers
     * @return {vivliostyle.selectors.Matcher}
     */
    MatcherBuilder.prototype.buildAllMatcher = function(matchers) {
        return new AllMatcher(matchers);
    };

    /**
     * @param {!Array.<!vivliostyle.selectors.Matcher>} matchers
     * @return {vivliostyle.selectors.Matcher}
     */
    MatcherBuilder.prototype.buildAnyMatcher = function(matchers) {
        return new AnyMatcher(matchers);
    };

    /** @const */
    vivliostyle.selectors.MatcherBuilder.instance =
        new vivliostyle.selectors.MatcherBuilder();

    /**
     * @param {!Object.<string,adapt.csscasc.CascadeValue>} cascMap
     * @param {adapt.expr.Context} context
     * @param {adapt.csscasc.ElementStyle} style
     * @param {adapt.vtree.NodeContext} nodeContext
     */
    vivliostyle.selectors.mergeViewConditionalStyles = function(cascMap, context, style, nodeContext) {
        if (!nodeContext) return;
        vivliostyle.selectors.forEachViewConditionalStyles(style, nodeContext, function(viewConditionalStyles) {
            adapt.csscasc.mergeStyle(cascMap, viewConditionalStyles, context);
        });
    };

    /**
     * @param {adapt.csscasc.ElementStyle} style
     * @param {adapt.vtree.NodeContext} nodeContext
     * @param {function(adapt.csscasc.ElementStyle)} callback
     */
    vivliostyle.selectors.forEachViewConditionalStyles = function(style, nodeContext, callback) {
        if (!nodeContext) return;
        var viewConditionalStyles = adapt.csscasc.getStyleMap(style, "_viewConditionalStyles");
        if (!viewConditionalStyles) return;
        viewConditionalStyles.forEach(function(entry) {
            if (!entry.matcher.matches(nodeContext)) return;
            callback(entry.styles);
        });
    };


    /**
     * @param {number} elementOffset
     * @param {number} fragmentIndex
     */
    vivliostyle.selectors.registerFragmentIndex = function(elementOffset, fragmentIndex) {
        vivliostyle.selectors.fragmentIndices[elementOffset] = fragmentIndex;
    };

    vivliostyle.selectors.clearFragmentIndices = function() {
        vivliostyle.selectors.fragmentIndices = {};
    };
    /**
     * @type {!Object.<number,number>}
     */
    vivliostyle.selectors.fragmentIndices = {};

});
