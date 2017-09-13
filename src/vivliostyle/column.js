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

goog.require("adapt.css");

goog.scope(function() {

    /**
     * @param {!Array<!adapt.layout.Column>} columns
     * @param {number} penalty
     * @param {adapt.vtree.LayoutPosition} position
     * @constructor
     */
    vivliostyle.column.ColumnBalancingTrialResult = function(columns, penalty, position) {
        /** @const */ this.columns = columns;
        /** @const */ this.penalty = penalty;
        /** @const */ this.position = position;
    };
    /** @const */ var ColumnBalancingTrialResult = vivliostyle.column.ColumnBalancingTrialResult;

    /**
     * @typedef {{columns: !Array<!adapt.layout.Column>, position: adapt.vtree.LayoutPosition}}
     */
    vivliostyle.column.ColumnGeneratorResult;
    /** @const */ var ColumnGeneratorResult = vivliostyle.column.ColumnGeneratorResult;

    /**
     * @typedef {function():!adapt.task.Result<!ColumnGeneratorResult>}
     */
    vivliostyle.column.ColumnGenerator;
    /** @const */ var ColumnGenerator = vivliostyle.column.ColumnGenerator;

    /**
     * @abstract
     * @param {!ColumnGenerator} columnGenerator
     * @constructor
     */
    vivliostyle.column.ColumnBalancer = function(columnGenerator) {
        this.columnGenerator = columnGenerator;
    };
    /** @const */ var ColumnBalancer = vivliostyle.column.ColumnBalancer;

    /**
     * @param {!ColumnGeneratorResult} generatorResult
     * @returns {!adapt.task.Result.<!ColumnGeneratorResult>}
     */
    ColumnBalancer.prototype.balanceColumns = function(generatorResult) {
        var self = this;
        /** @type {!adapt.task.Frame.<!ColumnGeneratorResult>} */ var frame =
            adapt.task.newFrame("ColumnBalancer#balanceColumns");
        var candidates = [self.createTrialResult(generatorResult.columns, generatorResult.position)];
        frame.loopWithFrame(function(loopFrame) {
            if (!self.hasNextCandidate(candidates)) {
                loopFrame.breakLoop();
                return;
            }

            self.replaceColumns(candidates[candidates.length - 1].columns);
            self.updateCondition(candidates);
            self.columnGenerator().then(function(generatorResult) {
                candidates.push(self.createTrialResult(generatorResult.columns, generatorResult.position));
                loopFrame.continueLoop();
            });
        }).then(function() {
            var result = candidates.reduce(function(prev, curr) {
                return curr.penalty < prev.penalty ? curr : prev;
            }, candidates[0]);
            var lastCandidate = candidates[candidates.length - 1];
            if (lastCandidate !== result) {
                self.replaceColumns(lastCandidate.columns, result.columns);
            }
            self.postBalance();
            frame.finish({columns: result.columns, position: result.position});
        });
        return frame.result();
    };

    /**
     * @private
     * @param {!Array<!adapt.layout.Column>} columns
     * @param {adapt.vtree.LayoutPosition} position
     * @returns {!ColumnBalancingTrialResult}
     */
    ColumnBalancer.prototype.createTrialResult = function(columns, position) {
        var penalty = this.calculatePenalty(columns);
        return new ColumnBalancingTrialResult(columns, penalty, position);
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
     * @param {!Array<!adapt.layout.Column>} columns
     * @param {!Array<!adapt.layout.Column>=} newColumns
     */
    ColumnBalancer.prototype.replaceColumns = function(columns, newColumns) {
        var parent;
        columns.forEach(function(c) {
            var el = c.element;
            parent = el.parentNode;
            goog.asserts.assert(parent);
            parent.removeChild(el);
        });
        if (newColumns) {
            newColumns.forEach(function(c) {
                parent.appendChild(c.element);
            });
        }
    };


    /**
     * @param {!ColumnGenerator} columnGenerator
     * @param {!adapt.vtree.Container} layoutContainer
     * @constructor
     * @extends {ColumnBalancer}
     */
    vivliostyle.column.BalanceNonLastColumnBalancer = function(columnGenerator, layoutContainer) {
        ColumnBalancer.call(this, columnGenerator);
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
        var columns = lastCandidate.columns;
        var maxColumnBlockSize = Math.max.apply(null, columns.map(function(c) {
            return c.computedBlockSize;
        }));
        return maxColumnBlockSize > this.originalContainerBlockSize * 0.9;
    };

    /**
     * @override
     */
    BalanceNonLastColumnBalancer.prototype.updateCondition = function(candidates) {
        var columns = candidates[candidates.length - 1].columns;
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
     * @returns {?ColumnBalancer}
     */
    vivliostyle.column.createColumnBalancer = function(columnFill, columnGenerator, layoutContainer, columns, flowPosition) {
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
                return new BalanceNonLastColumnBalancer(columnGenerator, layoutContainer);
            } else {
                goog.asserts.assert(columnFill === adapt.css.ident.balance);
                return null;
            }
        }
    };
});
