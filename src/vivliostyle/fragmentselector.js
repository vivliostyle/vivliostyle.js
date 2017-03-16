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
 * @fileoverview Diff utility
 */
goog.provide("vivliostyle.fragmentselector");

goog.require("vivliostyle.namespace");

goog.scope(function() {

    "use strict";

    /**
     * @interface
     */
    vivliostyle.fragmentselector.Matcher = function() {};
    /** @const */ var Matcher = vivliostyle.fragmentselector.Matcher;

    /**
     * @param {adapt.vtree.NodeContext} nodeContext
     * @return {boolean}
     */
    Matcher.prototype.matches = function(nodeContext) {};


    /**
     * @constructor
     * @implements {vivliostyle.fragmentselector.Matcher}
     * @param {string} fragmentSelectorId
     * @param {number} a
     * @param {number} b
     */
    vivliostyle.fragmentselector.NthFragmentMatcher = function(fragmentSelectorId, a, b) {
        /** @const */ this.fragmentSelectorId = fragmentSelectorId;
        /** @const */ this.a = a;
        /** @const */ this.b = b;
    };
    /** @const */ var NthFragmentMatcher = vivliostyle.fragmentselector.NthFragmentMatcher;

    /** @override */
    NthFragmentMatcher.prototype.matches = function(nodeContext) {
        return !!(nodeContext
            && nodeContext.fragmentSelectorIds.indexOf(this.fragmentSelectorId) >= 0
            && adapt.csscasc.matchANPlusB(nodeContext.fragmentIndex, this.a, this.b));
    };

    /**
     * @constructor
     * @implements {vivliostyle.fragmentselector.Matcher}
     * @param {!Array.<vivliostyle.fragmentselector.Matcher>} matchers
     */
    vivliostyle.fragmentselector.AllMatcher = function(matchers) {
        /** @const */ this.matchers = matchers;
    };
    /** @const */ var AllMatcher = vivliostyle.fragmentselector.AllMatcher;

    /** @override */
    AllMatcher.prototype.matches = function(nodeContext) {
        var activeMatchers = this.matchers;
        var notMatched = [];
        while (nodeContext) {
            activeMatchers.forEach(function(matcher) {
                if (!matcher.matches(nodeContext)) {
                    notMatched.push(matcher);
                }
            });
            if (notMatched.length === 0) return true;
            activeMatchers = notMatched;
            notMatched = [];
            nodeContext = nodeContext.parent;
        }
        return false;
    };

    /**
     * @constructor
     */
    vivliostyle.fragmentselector.MatcherBuilder = function() {};
    /** @const */ var MatcherBuilder = vivliostyle.fragmentselector.MatcherBuilder;

    /**
     * @param {string} fragmentSelectorIds
     */
    MatcherBuilder.prototype.build = function(fragmentSelectorIds) {
        var ids = fragmentSelectorIds.split(":");
        return new AllMatcher(ids.map(function(id) {
            var strs = id.split("_");
            return new NthFragmentMatcher(id,
                parseInt(strs[1], 10), parseInt(strs[2], 10));
        }));
    };

    /** @const */
    vivliostyle.fragmentselector.MatcherBuilder.instance =
        new vivliostyle.fragmentselector.MatcherBuilder();

    /**
     * @param {!Object.<string,adapt.csscasc.CascadeValue>} cascMap
     * @param {adapt.expr.Context} context
     * @param {adapt.csscasc.ElementStyle} style
     * @param {adapt.vtree.NodeContext} nodeContext
     */
    vivliostyle.fragmentselector.mergeStylesOfFragmentSelectors = function(cascMap, context, style, nodeContext) {
        if (!nodeContext) return;
        var stylesOfNthFragment = adapt.csscasc.getStyleMap(style, "_fragmentSelectors");
        if (!stylesOfNthFragment) return;
        Object.keys(stylesOfNthFragment).forEach(function(fragmentSelectorIds) {
            var matcher = vivliostyle.fragmentselector.MatcherBuilder.instance.build(fragmentSelectorIds);
            if (!matcher.matches(nodeContext)) return;

            var styles = stylesOfNthFragment[fragmentSelectorIds];
            for (var rn in styles) {
                if (adapt.csscasc.isPropName(rn)) {
                    var newVal = adapt.csscasc.getProp(styles, rn);
                    var oldVal = cascMap[rn];
                    cascMap[rn] = adapt.csscasc.cascadeValues(context, oldVal,
                        /** @type {!adapt.csscasc.CascadeValue} */ (newVal));
                }
            }
        });
    };

    /**
     * @param {adapt.csscasc.ElementStyle} style
     * @param {adapt.expr.Context} context
     * @param {!adapt.vtree.NodeContext} nodeContext
     */
    vivliostyle.fragmentselector.setFragmentSelectorIds = function(style, context, nodeContext) {
        var values = adapt.csscasc.getSpecial(style, "fragment-selector-id");
        if (!values) return;
        values.forEach(function(value) {
            var v = value.evaluate(context, "");
            if (v && v !== adapt.css.empty)
                nodeContext.fragmentSelectorIds.push(v.toString());
        });
    };

});
