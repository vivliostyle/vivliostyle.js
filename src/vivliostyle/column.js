/**
 * Copyright 2017 Trim-marks Inc.
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

goog.scope(() => {

    /**
     * @typedef {{
     *   columns: !Array<!adapt.layout.Column>,
     *   position: adapt.vtree.LayoutPosition,
     *   columnPageFloatLayoutContexts: (undefined|Array<!vivliostyle.pagefloat.PageFloatLayoutContext>)
     * }}
     */
    vivliostyle.column.ColumnLayoutResult;
    /** @const */ const ColumnLayoutResult = vivliostyle.column.ColumnLayoutResult;

    /**
     * @typedef {function():!adapt.task.Result<?ColumnLayoutResult>}
     */
    vivliostyle.column.ColumnGenerator;
    /** @const */ const ColumnGenerator = vivliostyle.column.ColumnGenerator;

    /**
     * @param {!ColumnLayoutResult} layoutResult
     * @param {number} penalty
     * @constructor
     */
    vivliostyle.column.ColumnBalancingTrialResult = function(layoutResult, penalty) {
        /** @const */ this.layoutResult = layoutResult;
        /** @const */ this.penalty = penalty;
    };
    /** @const */ const ColumnBalancingTrialResult = vivliostyle.column.ColumnBalancingTrialResult;

    /**
     * @param {!adapt.vtree.Container} container
     * @returns {number}
     */
    function getBlockSize(container) {
        if (container.vertical) {
            return container.width;
        } else {
            return container.height;
        }
    }

    /**
     * @param {!adapt.vtree.Container} container
     */
    function setBlockSize(container, size) {
        if (container.vertical) {
            container.width = size;
        } else {
            container.height = size;
        }
    }

    /**
     * @abstract
     * @param {!adapt.vtree.Container} layoutContainer
     * @param {!ColumnGenerator} columnGenerator
     * @param {!vivliostyle.pagefloat.PageFloatLayoutContext} regionPageFloatLayoutContext
     * @constructor
     */
    vivliostyle.column.ColumnBalancer = function(layoutContainer, columnGenerator, regionPageFloatLayoutContext) {
        /** @const */ this.layoutContainer = layoutContainer;
        /** @const */ this.columnGenerator = columnGenerator;
        /** @const */ this.regionPageFloatLayoutContext = regionPageFloatLayoutContext;
        /** @const */ this.originalContainerBlockSize = getBlockSize(layoutContainer);
    };
    /** @const */ const ColumnBalancer = vivliostyle.column.ColumnBalancer;

    /**
     * @param {!ColumnLayoutResult} layoutResult
     * @returns {!adapt.task.Result.<!ColumnLayoutResult>}
     */
    ColumnBalancer.prototype.balanceColumns = function(layoutResult) {
        const self = this;
        /** @type {!adapt.task.Frame.<!ColumnLayoutResult>} */ const frame =
            adapt.task.newFrame("ColumnBalancer#balanceColumns");
        self.preBalance(layoutResult);
        self.savePageFloatLayoutContexts(layoutResult);
        self.layoutContainer.clear();
        const candidates = [self.createTrialResult(layoutResult)];
        frame.loopWithFrame(loopFrame => {
            if (!self.hasNextCandidate(candidates)) {
                loopFrame.breakLoop();
                return;
            }

            self.updateCondition(candidates);
            self.columnGenerator().then(layoutResult => {
                self.savePageFloatLayoutContexts(layoutResult);
                self.layoutContainer.clear();
                if (!layoutResult) {
                    loopFrame.breakLoop();
                    return;
                }
                candidates.push(self.createTrialResult(layoutResult));
                loopFrame.continueLoop();
            });
        }).then(() => {
            const result = candidates.reduce((prev, curr) => curr.penalty < prev.penalty ? curr : prev, candidates[0]);
            self.restoreContents(result.layoutResult);
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
        const penalty = this.calculatePenalty(layoutResult);
        return new ColumnBalancingTrialResult(layoutResult, penalty);
    };

    /**
     * @protected
     * @param {!ColumnLayoutResult} layoutResult
     */
    ColumnBalancer.prototype.preBalance = layoutResult => {};

    /**
     * @abstract
     * @protected
     * @param {!ColumnLayoutResult} layoutResult
     * @returns {number}
     */
    ColumnBalancer.prototype.calculatePenalty = layoutResult => {};

    /**
     * @abstract
     * @protected
     * @param {!Array<!ColumnBalancingTrialResult>} candidates
     * @returns {boolean}
     */
    ColumnBalancer.prototype.hasNextCandidate = candidates => {};

    /**
     * @abstract
     * @protected
     * @param {!Array<!ColumnBalancingTrialResult>} candidates
     */
    ColumnBalancer.prototype.updateCondition = candidates => {};

    /**
     * @protected
     */
    ColumnBalancer.prototype.postBalance = function() {
        setBlockSize(this.layoutContainer, this.originalContainerBlockSize);
    };

    /**
     * @param {?ColumnLayoutResult} layoutResult
     */
    ColumnBalancer.prototype.savePageFloatLayoutContexts = function(layoutResult) {
        const children = this.regionPageFloatLayoutContext.detachChildren();
        if (layoutResult)
            layoutResult.columnPageFloatLayoutContexts = children;
    };

    /**
     * @private
     * @param {!ColumnLayoutResult} newLayoutResult
     */
    ColumnBalancer.prototype.restoreContents = function(newLayoutResult) {
        const parent = this.layoutContainer.element;
        newLayoutResult.columns.forEach(c => {
            parent.appendChild(c.element);
        });
        goog.asserts.assert(newLayoutResult.columnPageFloatLayoutContexts);
        this.regionPageFloatLayoutContext.attachChildren(newLayoutResult.columnPageFloatLayoutContexts);
    };


    /** @const */ const COLUMN_LENGTH_STEP = 1;

    /**
     * @private
     * @param {!Array<!ColumnBalancingTrialResult>} candidates
     * @returns {boolean}
     */
    vivliostyle.column.canReduceContainerSize = candidates => {
        const lastCandidate = candidates[candidates.length - 1];
        if (lastCandidate.penalty === 0)
            return false;
        const secondLastCandidate = candidates[candidates.length - 2];
        if (secondLastCandidate && lastCandidate.penalty >= secondLastCandidate.penalty)
            return false;
        const columns = lastCandidate.layoutResult.columns;
        const maxColumnBlockSize = Math.max.apply(null, columns.map(c => c.computedBlockSize));
        const maxPageFloatBlockSize = Math.max.apply(null, columns.map(c => c.getMaxBlockSizeOfPageFloats()));
        return maxColumnBlockSize > maxPageFloatBlockSize + COLUMN_LENGTH_STEP;
    };

    /**
     * @private
     * @param {!Array<!ColumnBalancingTrialResult>} candidates
     * @param {!adapt.vtree.Container} container
     */
    vivliostyle.column.reduceContainerSize = (candidates, container) => {
        const columns = candidates[candidates.length - 1].layoutResult.columns;
        const maxColumnBlockSize = Math.max.apply(null, columns.map(c => {
            if (!isNaN(c.blockDistanceToBlockEndFloats)) {
                return c.computedBlockSize - c.blockDistanceToBlockEndFloats + COLUMN_LENGTH_STEP;
            } else {
                return c.computedBlockSize;
            }
        }));
        const newEdge = maxColumnBlockSize - COLUMN_LENGTH_STEP;
        if (newEdge < getBlockSize(container)) {
            setBlockSize(container, newEdge);
        } else {
            setBlockSize(container, getBlockSize(container) - 1);
        }
    };


    /**
     * @param {!ColumnGenerator} columnGenerator
     * @param {!adapt.vtree.Container} layoutContainer
     * @param {number} columnCount
     * @constructor
     * @extends {ColumnBalancer}
     */
    vivliostyle.column.BalanceLastColumnBalancer = function(columnGenerator, regionPageFloatLayoutContext, layoutContainer, columnCount) {
        ColumnBalancer.call(this, layoutContainer, columnGenerator, regionPageFloatLayoutContext);
        /** @const */ this.columnCount = columnCount;
        /** @type {?adapt.vtree.LayoutPosition} */ this.originalPosition = null;
        /** @type {boolean} */ this.foundUpperBound = false;
    };
    /** @const */ const BalanceLastColumnBalancer = vivliostyle.column.BalanceLastColumnBalancer;
    goog.inherits(BalanceLastColumnBalancer, ColumnBalancer);

    /**
     * @override
     */
    BalanceLastColumnBalancer.prototype.preBalance = function(layoutResult) {
        const columns = layoutResult.columns;
        const totalBlockSize = columns.reduce((prev, c) => prev + c.computedBlockSize, 0);
        setBlockSize(this.layoutContainer, totalBlockSize / this.columnCount);
        this.originalPosition = layoutResult.position;
    };

    /**
     * @private
     * @param {?adapt.vtree.LayoutPosition} position
     * @returns {boolean}
     */
    BalanceLastColumnBalancer.prototype.checkPosition = function(position) {
        if (this.originalPosition) {
            return this.originalPosition.isSamePosition(position);
        } else {
            return position === null;
        }
    };

    /**
     * @param {!Array<!adapt.layout.Column>} columns
     * @returns {boolean}
     */
    function isLastColumnLongerThanAnyOtherColumn(columns) {
        if (columns.length <= 1)
            return false;
        const lastColumnBlockSize = columns[columns.length - 1].computedBlockSize;
        const otherColumns = columns.slice(0, columns.length - 1);
        return otherColumns.every(c => lastColumnBlockSize > c.computedBlockSize);
    }

    /**
     * @override
     */
    BalanceLastColumnBalancer.prototype.calculatePenalty = function(layoutResult) {
        if (!this.checkPosition(layoutResult.position))
            return Infinity;
        const columns = layoutResult.columns;
        if (isLastColumnLongerThanAnyOtherColumn(columns))
            return Infinity;
        return Math.max.apply(null, columns.map(c => c.computedBlockSize));
    };

    /**
     * @override
     */
    BalanceLastColumnBalancer.prototype.hasNextCandidate = function(candidates) {
        if (candidates.length === 1) {
            return true;
        } else if (this.foundUpperBound) {
            return vivliostyle.column.canReduceContainerSize(candidates);
        } else {
            const lastCandidate = candidates[candidates.length - 1];
            if (this.checkPosition(lastCandidate.layoutResult.position)) {
                if (!isLastColumnLongerThanAnyOtherColumn(lastCandidate.layoutResult.columns)) {
                    this.foundUpperBound = true;
                    return true;
                }
            }
            return getBlockSize(this.layoutContainer) < this.originalContainerBlockSize;
        }
    };

    /**
     * @override
     */
    BalanceLastColumnBalancer.prototype.updateCondition = function(candidates) {
        if (this.foundUpperBound) {
            vivliostyle.column.reduceContainerSize(candidates, this.layoutContainer);
        } else {
            const newEdge = Math.min(this.originalContainerBlockSize,
                getBlockSize(this.layoutContainer) + this.originalContainerBlockSize * 0.1);
            setBlockSize(this.layoutContainer, newEdge);
        }
    };

    /**
     * @param {!ColumnGenerator} columnGenerator
     * @param {!adapt.vtree.Container} layoutContainer
     * @constructor
     * @extends {ColumnBalancer}
     */
    vivliostyle.column.BalanceNonLastColumnBalancer = function(columnGenerator, regionPageFloatLayoutContext, layoutContainer) {
        ColumnBalancer.call(this, layoutContainer, columnGenerator, regionPageFloatLayoutContext);
    };
    /** @const */ const BalanceNonLastColumnBalancer = vivliostyle.column.BalanceNonLastColumnBalancer;
    goog.inherits(BalanceNonLastColumnBalancer, ColumnBalancer);

    /**
     * @override
     */
    BalanceNonLastColumnBalancer.prototype.calculatePenalty = layoutResult => {
        if (layoutResult.columns.every(c => c.computedBlockSize === 0))
            return Infinity;
        const computedBlockSizes = layoutResult.columns.filter(c => !c.pageBreakType).map(c => c.computedBlockSize);
        return vivliostyle.math.variance(computedBlockSizes);
    };
    /**
     * @override
     */
    BalanceNonLastColumnBalancer.prototype.hasNextCandidate = candidates => vivliostyle.column.canReduceContainerSize(candidates);

    /**
     * @override
     */
    BalanceNonLastColumnBalancer.prototype.updateCondition = function(candidates) {
        vivliostyle.column.reduceContainerSize(candidates, this.layoutContainer);
    };

    /**
     * @param {number} columnCount
     * @param {!adapt.css.Ident} columnFill
     * @param {!ColumnGenerator} columnGenerator
     * @param {!adapt.vtree.Container} layoutContainer
     * @param {!Array<!adapt.layout.Column>} columns
     * @param {!adapt.vtree.FlowPosition} flowPosition
     * @param {!vivliostyle.pagefloat.PageFloatLayoutContext} regionPageFloatLayoutContext
     * @returns {?ColumnBalancer}
     */
    vivliostyle.column.createColumnBalancer = (
        columnCount,
        columnFill,
        columnGenerator,
        regionPageFloatLayoutContext,
        layoutContainer,
        columns,
        flowPosition
    ) => {
        if (columnFill === adapt.css.ident.auto) {
            return null;
        } else {
            // TODO: how to handle a case where no more in-flow contents but some page floats
            const noMoreContent = flowPosition.positions.length === 0;
            const lastColumn = columns[columns.length - 1];
            const isLastColumnForceBroken = !!(lastColumn && lastColumn.pageBreakType);
            if (noMoreContent || isLastColumnForceBroken) {
                return new BalanceLastColumnBalancer(columnGenerator, regionPageFloatLayoutContext, layoutContainer, columnCount);
            } else if (columnFill === adapt.css.ident.balance_all) {
                return new BalanceNonLastColumnBalancer(columnGenerator, regionPageFloatLayoutContext, layoutContainer);
            } else {
                goog.asserts.assert(columnFill === adapt.css.ident.balance);
                return null;
            }
        }
    };
});
