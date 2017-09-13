/**
 * Copyright 2017 Vivliostyle Inc.
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
 * @fileoverview Control column layout
 */
goog.provide("vivliostyle.column");

goog.require("goog.asserts");
goog.require("adapt.css");

goog.scope(function() {

    /**
     * @typedef {{
     *   columns: !Array<!adapt.layout.Column>,
     *   position: adapt.vtree.LayoutPosition,
     *   columnPageFloatLayoutContexts: (undefined|Array<!vivliostyle.pagefloat.PageFloatLayoutContext>)
     * }}
     */
    vivliostyle.column.ColumnLayoutResult;
    /** @const */ var ColumnLayoutResult = vivliostyle.column.ColumnLayoutResult;

    /**
     * @typedef {function():!adapt.task.Result<!ColumnLayoutResult>}
     */
    vivliostyle.column.ColumnGenerator;
    /** @const */ var ColumnGenerator = vivliostyle.column.ColumnGenerator;

    /**
     * @param {!ColumnLayoutResult} layoutResult
     * @param {number} penalty
     * @constructor
     */
    vivliostyle.column.ColumnBalancingTrialResult = function(layoutResult, penalty) {
        /** @const */ this.layoutResult = layoutResult;
        /** @const */ this.penalty = penalty;
    };
    /** @const */ var ColumnBalancingTrialResult = vivliostyle.column.ColumnBalancingTrialResult;

    /**
     * @abstract
     * @param {!ColumnGenerator} columnGenerator
     * @param {!vivliostyle.pagefloat.PageFloatLayoutContext} regionPageFloatLayoutContext
     * @constructor
     */
    vivliostyle.column.ColumnBalancer = function(columnGenerator, regionPageFloatLayoutContext) {
        /** @const */ this.columnGenerator = columnGenerator;
        /** @const */ this.regionPageFloatLayoutContext = regionPageFloatLayoutContext;
    };
    /** @const */ var ColumnBalancer = vivliostyle.column.ColumnBalancer;

    /**
     * @param {!ColumnLayoutResult} layoutResult
     * @returns {!adapt.task.Result.<!ColumnLayoutResult>}
     */
    ColumnBalancer.prototype.balanceColumns = function(layoutResult) {
        var self = this;
        /** @type {!adapt.task.Frame.<!ColumnLayoutResult>} */ var frame =
            adapt.task.newFrame("ColumnBalancer#balanceColumns");
        var candidates = [self.createTrialResult(layoutResult)];
        frame.loopWithFrame(function(loopFrame) {
            if (!self.hasNextCandidate(candidates)) {
                loopFrame.breakLoop();
                return;
            }

            self.replaceContents(candidates[candidates.length - 1].layoutResult);
            self.updateCondition(candidates);
            self.columnGenerator().then(function(layoutResult) {
                candidates.push(self.createTrialResult(layoutResult));
                loopFrame.continueLoop();
            });
        }).then(function() {
            var result = candidates.reduce(function(prev, curr) {
                return curr.penalty < prev.penalty ? curr : prev;
            }, candidates[0]);
            var lastCandidate = candidates[candidates.length - 1];
            if (lastCandidate !== result) {
                self.replaceContents(lastCandidate.layoutResult, result.layoutResult);
            }
            self.postBalance();
            frame.finish(result.layoutResult);
        });
        return frame.result();
    };

    /**
     * @private
     * @param {!ColumnLayoutResult} layoutResult
     * @returns {!ColumnBalancingTrialResult}
     */
    ColumnBalancer.prototype.createTrialResult = function(layoutResult) {
        var penalty = this.calculatePenalty(layoutResult.columns);
        return new ColumnBalancingTrialResult(layoutResult, penalty);
    };

    /**
     * @abstract
     * @protected
     * @param {!Array<!adapt.layout.Column>} columns
     * @returns {number}
     */
    ColumnBalancer.prototype.calculatePenalty = function(columns) {};

    /**
     * @abstract
     * @protected
     * @param {!Array<!ColumnBalancingTrialResult>} candidates
     * @returns {boolean}
     */
    ColumnBalancer.prototype.hasNextCandidate = function(candidates) {};

    /**
     * @abstract
     * @protected
     * @param {!Array<!ColumnBalancingTrialResult>} candidates
     */
    ColumnBalancer.prototype.updateCondition = function(candidates) {};

    /**
     * @protected
     */
    ColumnBalancer.prototype.postBalance = function() {};

    /**
     * @private
     * @param {!ColumnLayoutResult} layoutResult
     * @param {!ColumnLayoutResult=} newLayoutResult
     */
    ColumnBalancer.prototype.replaceContents = function(layoutResult, newLayoutResult) {
        var parent;
        layoutResult.columns.forEach(function(c) {
            var el = c.element;
            parent = el.parentNode;
            goog.asserts.assert(parent);
            parent.removeChild(el);
        });
        layoutResult.columnPageFloatLayoutContexts = this.regionPageFloatLayoutContext.detachChildren();
        if (newLayoutResult) {
            newLayoutResult.columns.forEach(function(c) {
                parent.appendChild(c.element);
            });
            goog.asserts.assert(newLayoutResult.columnPageFloatLayoutContexts);
            this.regionPageFloatLayoutContext.attachChildren(newLayoutResult.columnPageFloatLayoutContexts);
        }
    };


    /**
     * @param {!ColumnGenerator} columnGenerator
     * @param {!adapt.vtree.Container} layoutContainer
     * @constructor
     * @extends {ColumnBalancer}
     */
    vivliostyle.column.BalanceNonLastColumnBalancer = function(columnGenerator, regionPageFloatLayoutContext, layoutContainer) {
        ColumnBalancer.call(this, columnGenerator, regionPageFloatLayoutContext);
        this.layoutContainer = layoutContainer;
        this.originalContainerBlockSize = layoutContainer.vertical ? layoutContainer.width : layoutContainer.height;
    };
    /** @const */ var BalanceNonLastColumnBalancer = vivliostyle.column.BalanceNonLastColumnBalancer;
    goog.inherits(BalanceNonLastColumnBalancer, ColumnBalancer);

    /**
     * @override
     */
    BalanceNonLastColumnBalancer.prototype.calculatePenalty = function(columns) {
        var computedBlockSizes = columns.filter(function(c) {
            return !c.pageBreakType;
        }).map(function(c) {
            return c.computedBlockSize;
        });
        return vivliostyle.math.variance(computedBlockSizes);
    };

    /**
     * @override
     */
    BalanceNonLastColumnBalancer.prototype.hasNextCandidate = function(candidates) {
        var lastCandidate = candidates[candidates.length - 1];
        if (lastCandidate.penalty === 0)
            return false;
        var columns = lastCandidate.layoutResult.columns;
        var maxColumnBlockSize = Math.max.apply(null, columns.map(function(c) {
            return c.computedBlockSize;
        }));
        return maxColumnBlockSize > this.originalContainerBlockSize * 0.9;
    };

    /**
     * @override
     */
    BalanceNonLastColumnBalancer.prototype.updateCondition = function(candidates) {
        var columns = candidates[candidates.length - 1].layoutResult.columns;
        var maxColumnBlockSize = Math.max.apply(null, columns.map(function(c) {
            return c.computedBlockSize;
        }));
        if (this.layoutContainer.vertical) {
            this.layoutContainer.width = maxColumnBlockSize - 1;
        } else {
            this.layoutContainer.height = maxColumnBlockSize - 1;
        }
    };

    /**
     * @override
     */
    BalanceNonLastColumnBalancer.prototype.postBalance = function() {
        if (this.layoutContainer.vertical) {
            this.layoutContainer.width = this.originalContainerBlockSize;
        } else {
            this.layoutContainer.height = this.originalContainerBlockSize;
        }
    };

    /**
     * @param {!adapt.css.Ident} columnFill
     * @param {!ColumnGenerator} columnGenerator
     * @param {!adapt.vtree.Container} layoutContainer
     * @param {!Array<!adapt.layout.Column>} columns
     * @param {!adapt.vtree.FlowPosition} flowPosition
     * @param {!vivliostyle.pagefloat.PageFloatLayoutContext} regionPageFloatLayoutContext
     * @returns {?ColumnBalancer}
     */
    vivliostyle.column.createColumnBalancer = function(columnFill, columnGenerator, regionPageFloatLayoutContext,
                                                       layoutContainer, columns, flowPosition) {
        if (columnFill === adapt.css.ident.auto) {
            return null;
        } else {
            var noMoreContent = flowPosition.positions.length === 0;
            var lastColumn = columns[columns.length - 1];
            var isLastColumnForceBroken = !!(lastColumn && lastColumn.pageBreakType);
            if (noMoreContent || isLastColumnForceBroken) {
                // TODO balancer for last page
                return null;
            } else if (columnFill === adapt.css.ident.balance_all) {
                return new BalanceNonLastColumnBalancer(columnGenerator, regionPageFloatLayoutContext, layoutContainer);
            } else {
                goog.asserts.assert(columnFill === adapt.css.ident.balance);
                return null;
            }
        }
    };
});
