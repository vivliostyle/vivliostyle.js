/**
 * Copyright 2016 Trim-marks Inc.
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

goog.scope(() => {

    "use strict";

    /** @const */ var PseudoColumn = vivliostyle.layoututil.PseudoColumn;

    /**
     * @interface
     */
    vivliostyle.selectors.Matcher = function() {};
    /** @const */ var Matcher = vivliostyle.selectors.Matcher;

    /**
     * @return {boolean}
     */
    Matcher.prototype.matches = () => {};


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
    NthFragmentMatcher.prototype.matches = function() {
        var entry = vivliostyle.selectors.fragmentIndices[this.elementOffset];
        return entry != null && entry.fragmentIndex != null
            && adapt.csscasc.matchANPlusB(entry.fragmentIndex, this.a, this.b);
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
    AnyMatcher.prototype.matches = function() {
        return this.matchers.some(matcher => matcher.matches());
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
    AllMatcher.prototype.matches = function() {
        return this.matchers.every(matcher => matcher.matches());
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
    MatcherBuilder.prototype.buildViewConditionMatcher = (elementOffset, viewCondition) => {
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
    MatcherBuilder.prototype.buildAllMatcher = matchers => new AllMatcher(matchers);

    /**
     * @param {!Array.<!vivliostyle.selectors.Matcher>} matchers
     * @return {vivliostyle.selectors.Matcher}
     */
    MatcherBuilder.prototype.buildAnyMatcher = matchers => new AnyMatcher(matchers);

    /** @const */
    vivliostyle.selectors.MatcherBuilder.instance =
        new vivliostyle.selectors.MatcherBuilder();

    /**
     * @param {!Object.<string,adapt.csscasc.CascadeValue>} cascMap
     * @param {adapt.expr.Context} context
     * @param {adapt.csscasc.ElementStyle} style
     */
    vivliostyle.selectors.mergeViewConditionalStyles = (cascMap, context, style) => {
        vivliostyle.selectors.forEachViewConditionalStyles(style, viewConditionalStyles => {
            adapt.csscasc.mergeStyle(cascMap, viewConditionalStyles, context);
        });
    };

    /**
     * @param {adapt.csscasc.ElementStyle} style
     * @param {function(adapt.csscasc.ElementStyle)} callback
     */
    vivliostyle.selectors.forEachViewConditionalStyles = (style, callback) => {
        var viewConditionalStyles = adapt.csscasc.getStyleMap(style, "_viewConditionalStyles");
        if (!viewConditionalStyles) return;
        viewConditionalStyles.forEach(entry => {
            if (!entry.matcher.matches()) return;
            callback(entry.styles);
        });
    };


    /**
     * @param {number} elementOffset
     * @param {number} fragmentIndex
     * @param {number} priority
     */
    vivliostyle.selectors.registerFragmentIndex = (elementOffset, fragmentIndex, priority) => {
        var indices = vivliostyle.selectors.fragmentIndices;
        if (!indices[elementOffset] || indices[elementOffset].priority <= priority) {
            indices[elementOffset] = {
                fragmentIndex,
                priority
            };
        }
    };

    vivliostyle.selectors.clearFragmentIndices = () => {
        vivliostyle.selectors.fragmentIndices = {};
    };
    /**
     * @type {!Object.<number,{fragmentIndex:number, priority:number}>}
     */
    vivliostyle.selectors.fragmentIndices = {};


    /**
     * @param {Element} sourceNode
     * @param {adapt.vgen.PseudoelementStyler} styler
     * @constructor
     */
    vivliostyle.selectors.AfterIfContinues = function(sourceNode, styler) {
        /** @const */ this.styler = styler;
        /** @const */ this.sourceNode = sourceNode;
    };
    /** @const */ var AfterIfContinues = vivliostyle.selectors.AfterIfContinues;


    /**
     * @param {!adapt.layout.Column} column
     * @param {!adapt.vtree.NodeContext} parentNodeContext
     * @return {!adapt.task.Result.<!Element>}
     */
    AfterIfContinues.prototype.createElement = function(column, parentNodeContext) {
        var doc = parentNodeContext.viewNode.ownerDocument;
        var viewRoot = doc.createElement("div");
        var pseudoColumn = new PseudoColumn(column, viewRoot, parentNodeContext);
        var initialPageBreakType = pseudoColumn.getColumn().pageBreakType;
        pseudoColumn.getColumn().pageBreakType = null;
        return pseudoColumn.layout(this.createNodePositionForPseudoElement(), true).thenAsync(() => {
            this.styler.contentProcessed["after-if-continues"] = false;
            pseudoColumn.getColumn().pageBreakType = initialPageBreakType;
            var pseudoElement = /** @type {!Element} */ (viewRoot.firstChild);
            adapt.base.setCSSProperty(pseudoElement, "display", "block");
            return adapt.task.newResult(pseudoElement);
        });
    };

    /**
     * @private
     * @return {!adapt.vtree.ChunkPosition}
     */
    AfterIfContinues.prototype.createNodePositionForPseudoElement = function() {
        var sourceNode = adapt.vgen.pseudoelementDoc.createElementNS(adapt.base.NS.XHTML, "div");
        adapt.vgen.setPseudoName(sourceNode, "after-if-continues");
        var shadowContext = this.createShadowContext(sourceNode);
        var step = {
            node: sourceNode,
            shadowType: shadowContext.type,
            shadowContext,
            nodeShadow: null,
            shadowSibling: null
        };
        var nodePosition = {steps:[step], offsetInNode:0, after:false, preprocessedTextContent:null};
        return new adapt.vtree.ChunkPosition(nodePosition);
    };

    /**
     * @private
     * @param {!Element} root
     * @return {!adapt.vtree.ShadowContext}
     */
    AfterIfContinues.prototype.createShadowContext = function(root) {
        return new adapt.vtree.ShadowContext(this.sourceNode, root, null, null,
            null, adapt.vtree.ShadowType.ROOTED, this.styler);
    };

    /**
     * @constructor
     * @param {!adapt.vtree.NodeContext} nodeContext
     * @param {!vivliostyle.selectors.AfterIfContinues} afterIfContinues
     * @param {number} pseudoElementHeight
     * @implements {adapt.layout.FragmentLayoutConstraint}
     */
    vivliostyle.selectors.AfterIfContinuesLayoutConstraint = function(
        nodeContext, afterIfContinues, pseudoElementHeight) {
        this.nodeContext = nodeContext;
        this.afterIfContinues = afterIfContinues;
        this.pseudoElementHeight = pseudoElementHeight;
    };
    /** @const */ var AfterIfContinuesLayoutConstraint = vivliostyle.selectors.AfterIfContinuesLayoutConstraint;

    /** @override */
    AfterIfContinuesLayoutConstraint.prototype.allowLayout = (nodeContext, overflownNodeContext, column) => {
        if ((overflownNodeContext && !nodeContext) || (nodeContext && nodeContext.overflow)) {
            return false;
        } else {
            return true;
        }
    };

    /** @override */
    AfterIfContinuesLayoutConstraint.prototype.nextCandidate = nodeContext => false;

    /** @override */
    AfterIfContinuesLayoutConstraint.prototype.postLayout = (allowed, nodeContext, initialPosition, column) => {};

    /** @override */
    AfterIfContinuesLayoutConstraint.prototype.finishBreak = function(nodeContext, column) {
        if (!this.getRepetitiveElements().affectTo(nodeContext)) return adapt.task.newResult(true);
        return this.afterIfContinues.createElement(column, this.nodeContext).thenAsync(element => {
            this.nodeContext.viewNode.appendChild(element);
            return adapt.task.newResult(true);
        });
    };
    AfterIfContinuesLayoutConstraint.prototype.getRepetitiveElements = function() {
        return new AfterIfContinuesElementsOffset(this.nodeContext, this.pseudoElementHeight);
    };
    /** @override */
    AfterIfContinuesLayoutConstraint.prototype.equalsTo = function(constraint) {
        if (!(constraint instanceof AfterIfContinuesLayoutConstraint)) return false;
        return this.afterIfContinues == /** @type {AfterIfContinuesLayoutConstraint} */ (constraint).afterIfContinues;
    };
    /** @override */
    AfterIfContinuesLayoutConstraint.prototype.getPriorityOfFinishBreak = () => 9;

    /**
     * @constructor
     * @implements {vivliostyle.repetitiveelements.ElementsOffset}
     */
    vivliostyle.selectors.AfterIfContinuesElementsOffset = function(nodeContext, pseudoElementHeight) {
        this.nodeContext = nodeContext;
        this.pseudoElementHeight = pseudoElementHeight;
    };
    /** @const */ var AfterIfContinuesElementsOffset = vivliostyle.selectors.AfterIfContinuesElementsOffset;

    /** @override */
    AfterIfContinuesElementsOffset.prototype.calculateOffset = function(nodeContext) {
        if (!this.affectTo(nodeContext)) return 0;
        return this.pseudoElementHeight;
    };

    /** @override */
    AfterIfContinuesElementsOffset.prototype.calculateMinimumOffset = function(nodeContext) {
        return this.calculateOffset(nodeContext);
    };

    /**
     * @private
     * @param {adapt.vtree.NodeContext} nodeContext
     * @return {boolean}
     */
    AfterIfContinuesElementsOffset.prototype.affectTo = function(nodeContext) {
        if (!nodeContext) return false;
        var sourceNode = nodeContext.shadowContext ?
            nodeContext.shadowContext.owner : nodeContext.sourceNode;
        if (sourceNode === this.nodeContext.sourceNode) {
            return !!nodeContext.after;
        }
        for (var n = sourceNode.parentNode; n; n = n.parentNode) {
            if (n === this.nodeContext.sourceNode) {
                return true;
            }
        }
        return false;
    };


    /**
     * @param {adapt.vtree.NodeContext} nodeContext
     * @param {!adapt.layout.Column} column
     * @return {!adapt.task.Result.<adapt.vtree.NodeContext>}
     */
    function processAfterIfContinuesOfNodeContext(nodeContext, column) {
        if (!nodeContext || !nodeContext.afterIfContinues || nodeContext.after || column.isFloatNodeContext(nodeContext)) {
            return adapt.task.newResult(nodeContext);
        }

        var afterIfContinues = nodeContext.afterIfContinues;
        return afterIfContinues.createElement(column, nodeContext).thenAsync(pseudoElement => {
            goog.asserts.assert(nodeContext !== null);
            var pseudoElementHeight = vivliostyle.selectors.calculatePseudoElementHeight(nodeContext, column, pseudoElement);
            column.fragmentLayoutConstraints.push(
                new AfterIfContinuesLayoutConstraint(nodeContext, afterIfContinues, pseudoElementHeight));
            return adapt.task.newResult(nodeContext);
        });
    };

    /**
     * @param {!adapt.task.Result.<adapt.vtree.NodeContext>} result
     * @param {!adapt.layout.Column} column
     * @return {!adapt.task.Result.<adapt.vtree.NodeContext>}
     */
    vivliostyle.selectors.processAfterIfContinues = (result, column) => result.thenAsync(nodeContext => processAfterIfContinuesOfNodeContext(nodeContext, column));

    /**
     * @param {!adapt.vtree.NodeContext} nodeContext
     * @param {!adapt.layout.Column} column
     * @return {!adapt.task.Result.<boolean>}
     */
    vivliostyle.selectors.processAfterIfContinuesOfAncestors = (nodeContext, column) => {
        /** @type {!adapt.task.Frame.<boolean>} */ var frame =
            adapt.task.newFrame("vivliostyle.selectors.processAfterIfContinuesOfAncestors");
        /** @type {adapt.vtree.NodeContext} */ var current =  nodeContext;
        frame.loop(() => {
            if (current !== null) {
                var result = processAfterIfContinuesOfNodeContext(current, column);
                current = current.parent;
                return result.thenReturn(true);
            } else {
                return adapt.task.newResult(false);
            }
        }).then(() => {
            frame.finish(true);
        });
        return frame.result();
    };

    /**
     * @private
     * @param {!adapt.vtree.NodeContext} nodeContext
     * @param {!adapt.layout.Column} column
     * @param {!Element} pseudoElement
     * @return {number}
     */
    vivliostyle.selectors.calculatePseudoElementHeight = (nodeContext, column, pseudoElement) => {
        var parentNode = /** @type {Element} */ (nodeContext.viewNode);
        parentNode.appendChild(pseudoElement);
        var height = adapt.layout.getElementHeight(pseudoElement, column, nodeContext.vertical);
        parentNode.removeChild(pseudoElement);
        return height;
    };

});
