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
     * @param {string} condition
     */
    MatcherBuilder.prototype.build = function(condition) {
        var andConditions = condition.split("&");
        return new AllMatcher(andConditions.map(function(andCondition) {
            var orConditions = andCondition.split("|");
            return new AnyMatcher(orConditions.map(function(orCondition) {
                var strs = orCondition.split("_");
                if (strs[1] == "NFS") {
                    return new NthFragmentMatcher(parseInt(strs[0], 10),
                        parseInt(strs[2], 10), parseInt(strs[3], 10));
                } else {
                    goog.asserts.fail("unknown view condition. condition=" + condition);
                    return null;
                }
            }));
        }));
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
        var viewConditionalStyles = adapt.csscasc.getStyleMap(style, "_viewConditions");
        if (!viewConditionalStyles) return;
        Object.keys(viewConditionalStyles).forEach(function(condition) {
            var matcher = vivliostyle.selectors.MatcherBuilder.instance.build(condition);
            if (!matcher.matches(nodeContext)) return;
            var styles = viewConditionalStyles[condition];
            callback(styles);
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
