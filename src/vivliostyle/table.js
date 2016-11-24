/**
 * Copyright 2016 Vivliostyle Inc.
 * @fileoverview Table formatting context and layout.
 */
goog.provide("vivliostyle.table");

goog.require("goog.asserts");
goog.require("adapt.base");
goog.require("vivliostyle.plugin");
goog.require("adapt.task");
goog.require("adapt.vtree");
goog.require("vivliostyle.break");
goog.require("adapt.layout");
goog.require("vivliostyle.layoututil");

goog.scope(function() {
    /** @const */ var LayoutIteratorStrategy = vivliostyle.layoututil.LayoutIteratorStrategy;
    /** @const */ var LayoutIterator = vivliostyle.layoututil.LayoutIterator;
    /** @const */ var EdgeSkipper = vivliostyle.layoututil.EdgeSkipper;
    /** @const */ var PseudoColumn = vivliostyle.layoututil.PseudoColumn;
    /** @const */ var EdgeBreakPosition = adapt.layout.EdgeBreakPosition;

    /**
     * @param {!Node} sourceNode
     * @constructor
     */
    vivliostyle.table.TableRow = function(sourceNode) {
        /** @const */ this.sourceNode = sourceNode;
        /** @const {!Array<vivliostyle.table.TableCell>} */ this.cells = [];
    };
    /** @const */ var TableRow = vivliostyle.table.TableRow;

    /**
     * @param {!vivliostyle.table.TableCell} cell
     */
    TableRow.prototype.addCell = function(cell) {
        this.cells.push(cell);
    };

    /**
     * @returns {number}
     */
    TableRow.prototype.getMinimumHeight = function() {
        return Math.min.apply(null, this.cells.map(function(c) { return c.height; }));
    };

    /**
     * @param {!Element} viewElement
     * @constructor
     */
    vivliostyle.table.TableCell = function(viewElement) {
        /** @type {?Element} */ this.viewElement = viewElement;
        /** @const {number} */ this.colSpan = viewElement.colSpan || 1;
        /** @type {number} */ this.height = 0;
    };
    /** @const */ var TableCell = vivliostyle.table.TableCell;

    /**
     * @param {number} height
     */
    TableCell.prototype.setHeight = function(height) {
        this.height = height;
    };

    /**
     * @param {!adapt.layout.Column} column
     * @param {!Element} pseudoColumnContainer
     * @param {!adapt.vtree.NodeContext} cellNodeContext
     * @constructor
     */
    vivliostyle.table.TableCellFragment = function(column, pseudoColumnContainer, cellNodeContext) {
        /** @const */ this.column = column;
        /** @const */ this.cellNodeContext = cellNodeContext;
        /** @const */ this.pseudoColumn = new PseudoColumn(column, pseudoColumnContainer);
    };
    /** @const */ var TableCellFragment = vivliostyle.table.TableCellFragment;

    /**
     * @param {!Element} viewNode
     * @param {string} side
     * @constructor
     */
    vivliostyle.table.TableCaptionView = function(viewNode, side) {
        /** @const */ this.viewNode = viewNode;
        /** @const */ this.side = side;
    };
    /** @const */ var TableCaptionView = vivliostyle.table.TableCaptionView;

    /**
     * @param {!adapt.vtree.NodeContext} position
     * @param {?string} breakOnEdge
     * @param {boolean} overflows
     * @param {number} columnBlockSize
     * @constructor
     * @extends {adapt.layout.EdgeBreakPosition}
     */
    vivliostyle.table.BetweenTableRowBreakPosition = function(position, breakOnEdge, overflows, columnBlockSize) {
        EdgeBreakPosition.call(this, position, breakOnEdge, overflows, columnBlockSize);
    };
    /** @const */ var BetweenTableRowBreakPosition = vivliostyle.table.BetweenTableRowBreakPosition;
    goog.inherits(BetweenTableRowBreakPosition, EdgeBreakPosition);

    /**
     * @param {number} rowIndex
     * @param {!adapt.vtree.NodeContext} beforeNodeContext
     * @param {!vivliostyle.table.TableFormattingContext} formattingContext
     * @constructor
     * @implements {adapt.layout.BreakPosition}
     */
    vivliostyle.table.InsideTableRowBreakPosition = function(rowIndex, beforeNodeContext, formattingContext) {
        /** @const */ this.rowIndex = rowIndex;
        /** @const */ this.beforeNodeContext = beforeNodeContext;
        /** @const */ this.formattingContext = formattingContext;
        /** Array<!adapt.layout.BreakPositionAndNodeContext> */ this.acceptableCellBreakPositions = null;
    };
    /** @const */ var InsideTableRowBreakPosition = vivliostyle.table.InsideTableRowBreakPosition;

    /**
     * @override
     */
    InsideTableRowBreakPosition.prototype.findAcceptableBreak = function(column, penalty) {
        if (penalty < this.getMinBreakPenalty())
            return null;
        var allCellsBreakable = this.getAcceptableCellBreakPositions().every(function(bp) {
            return !!bp.nodeContext;
        });
        if (allCellsBreakable) {
            return this.beforeNodeContext;
        } else {
            return null;
        }
    };

    /**
     * @override
     */
    InsideTableRowBreakPosition.prototype.getMinBreakPenalty = function() {
        var formattingContext = this.formattingContext;
        var row = formattingContext.getRowByIndex(this.rowIndex);
        var penalty = 0;
        if (!formattingContext.isFreelyFragmentableRow(row)) {
            penalty += 10;
        }
        this.getAcceptableCellBreakPositions().forEach(function(bp) {
            penalty += bp.breakPosition.getMinBreakPenalty();
        });
        return penalty;
    };

    /**
     * @returns {!Array<adapt.layout.BreakPositionAndNodeContext>}
     */
    InsideTableRowBreakPosition.prototype.getAcceptableCellBreakPositions = function() {
        if (!this.acceptableCellBreakPositions) {
            var cellFragments = this.formattingContext.getCellFragmentsFallingOnRow(this.rowIndex);
            this.acceptableCellBreakPositions = cellFragments.map(function(cellFragment) {
                return cellFragment.pseudoColumn.findAcceptableBreakPosition();
            });
        }
        return this.acceptableCellBreakPositions;
    };

    /**
     * @param {!Element} tableSourceNode Source node of the table
     * @constructor
     * @implements {adapt.vtree.FormattingContext}
     */
    vivliostyle.table.TableFormattingContext = function(tableSourceNode) {
        /** @const */ this.tableSourceNode = tableSourceNode;
        /** @type {boolean} */ this.doneInitialLayout = false;
        /** @type {boolean} */ this.vertical = false;
        /** @type {number} */ this.tableWidth = 0;
        /** @const {!Array<vivliostyle.table.TableCaptionView>} */ this.captions = [];
        /** @type {DocumentFragment} */ this.colGroups = null;
        /** @const {!Array<!vivliostyle.table.TableRow>} */ this.rows = [];
        /** @type {Element} */ this.lastRowViewNode = null;
        /** @type {!Array<!Array<!vivliostyle.table.TableCellFragment>>} */ this.cellFragments = [];
        /** @type {!Array<!adapt.vtree.ChunkPosition>} */ this.cellBreakPositions = [];
        /** @type {boolean} */ this.firstRowFragmented = false;
    };
    /** @const */ var TableFormattingContext = vivliostyle.table.TableFormattingContext;

    /**
     * @override
     */
    TableFormattingContext.prototype.getName = function() {
        return "Table formatting context (vivliostyle.table.TableFormattingContext)";
    };

    /**
     * @override
     */
    TableFormattingContext.prototype.isFirstTime = function(nodeContext, firstTime) {
        if (!firstTime) {
            return firstTime;
        }
        return !this.firstRowFragmented;
    };

    TableFormattingContext.prototype.finishFragment = function() {
        this.firstRowFragmented = this.cellBreakPositions.length > 0;
        this.cellFragments = [];
    };

    /**
     * @param {adapt.vtree.NodeContext} position
     * @returns {Element}
     */
    TableFormattingContext.prototype.getRootViewNode = function(position) {
        do {
            if (position.sourceNode === this.tableSourceNode) {
                return /** @type {Element} */ (position.viewNode);
            }
        } while (position = position.parent);
        return null;
    };

    /**
     * @param {!vivliostyle.table.TableRow} row
     */
    TableFormattingContext.prototype.addRow = function(row) {
        this.rows.push(row);
    };

    /**
     * @param {number} index
     * @returns {!vivliostyle.table.TableRow}
     */
    TableFormattingContext.prototype.getRowByIndex = function(index) {
        var row = this.rows[index];
        goog.asserts.assert(row);
        return row;
    };

    /**
     * @param {!Node} sourceNode
     * @returns {number}
     */
    TableFormattingContext.prototype.findRowIndexBySourceNode = function(sourceNode) {
        return this.rows.findIndex(function(row) {
            return sourceNode === row.sourceNode;
        });
    };

    /**
     * @param {number} rowIndex
     * @param {!vivliostyle.table.TableCellFragment} cellFragment
     */
    TableFormattingContext.prototype.addCellFragment = function(rowIndex, cellFragment) {
        var list = this.cellFragments[rowIndex];
        if (!list) {
            list = this.cellFragments[rowIndex] = [];
        }
        list.push(cellFragment);
    };

    /**
     * @param {number} rowIndex
     * @returns {!Array<!vivliostyle.table.TableCellFragment>}
     */
    TableFormattingContext.prototype.getCellFragmentsFallingOnRow = function(rowIndex) {
        return this.cellFragments[rowIndex];
    };

    /**
     * @param {!vivliostyle.table.TableRow} row
     * @returns {boolean}
     */
    TableFormattingContext.prototype.isFreelyFragmentableRow = function(row) {
        return row.getMinimumHeight() > this.tableWidth / 2;
    };

    /**
     * @returns {number}
     */
    TableFormattingContext.prototype.getColumnCount = function() {
        return Math.max.apply(null, this.rows.map(function(row) {
            return row.cells.reduce(function(sum, c) {
                return sum + c.colSpan;
            }, 0);
        }));
    };

    /**
     * @param {!adapt.vtree.ClientLayout} clientLayout
     */
    TableFormattingContext.prototype.updateCellSizes = function(clientLayout) {
        this.rows.forEach(function(row) {
            row.cells.forEach(function(cell) {
                var rect = clientLayout.getElementClientRect(cell.viewElement);
                cell.viewElement = null;
                cell.setHeight(this.vertical ? rect["width"] : rect["height"]);
            }, this);
        }, this);
    };

    /**
     * @private
     * @param {adapt.vtree.FormattingContext} formattingContext
     * @returns {!vivliostyle.table.TableFormattingContext}
     */
    function getTableFormattingContext(formattingContext) {
        goog.asserts.assert(formattingContext instanceof TableFormattingContext);
        return /** @type {!vivliostyle.table.TableFormattingContext} */ (formattingContext);
    }

    /**
     * @param {!vivliostyle.table.TableFormattingContext} formattingContext
     * @param {!adapt.layout.Column} column
     * @constructor
     * @extends {vivliostyle.layoututil.LayoutIteratorStrategy}
     */
    vivliostyle.table.EntireTableLayoutStrategy = function(formattingContext, column) {
        /** @const */ this.formattingContext = formattingContext;
        /** @const */ this.column = column;
        /** @type {vivliostyle.table.TableRow} */ this.row = null;
    };
    /** @const */ var EntireTableLayoutStrategy = vivliostyle.table.EntireTableLayoutStrategy;
    goog.inherits(EntireTableLayoutStrategy, LayoutIteratorStrategy);

    /**
     * @override
     */
    EntireTableLayoutStrategy.prototype.startNonInlineElementNode = function(state) {
        /** @const */ var formattingContext = this.formattingContext;
        /** @const */ var nodeContext = state.nodeContext;
        /** @const */ var display = nodeContext.display;
        switch (display) {
            case "table-caption":
                var captionView = new TableCaptionView(/** @type {!Element} */ (nodeContext.viewNode),
                    nodeContext.captionSide);
                formattingContext.captions.push(captionView);
                break;
            case "table-row":
                goog.asserts.assert(nodeContext.sourceNode);
                this.row = new TableRow(nodeContext.sourceNode);
                break;
        }
        return adapt.task.newResult(true);
    };

    /**
     * @override
     */
    EntireTableLayoutStrategy.prototype.afterNonInlineElementNode = function(state) {
        /** @const */ var formattingContext = this.formattingContext;
        /** @const */ var nodeContext = state.nodeContext;
        /** @const */ var display = nodeContext.display;
        /** @const */ var clientLayout = this.column.clientLayout;
        if (nodeContext.sourceNode === formattingContext.tableSourceNode) {
            var computedStyle = clientLayout.getElementComputedStyle(formattingContext.getRootViewNode(nodeContext));
            formattingContext.tableWidth = parseFloat(computedStyle[formattingContext.vertical ? "height" : "width"]);
            state.break = true;
        } else {
            switch (display) {
                case "table-row":
                    goog.asserts.assert(this.row);
                    formattingContext.addRow(this.row);
                    formattingContext.lastRowViewNode = /** @type {!Element} */ (nodeContext.viewNode);
                    break;
                case "table-cell":
                    var elem = /** @type {!Element} */ (nodeContext.viewNode);
                    var cell = new TableCell(elem);
                    this.row.addCell(cell);
                    break;
            }
        }
    };

    /**
     * @param {!vivliostyle.table.TableFormattingContext} formattingContext
     * @param {!adapt.layout.Column} column
     * @constructor
     * @extends {vivliostyle.layoututil.EdgeSkipper}
     */
    vivliostyle.table.TableLayoutStrategy = function(formattingContext, column) {
        EdgeSkipper.call(this, true);
        /** @const */ this.formattingContext = formattingContext;
        /** @const */ this.column = column;

        /** @type {number} */ this.currentRowIndex = -1;
        /** @type {boolean} */ this.originalStopAtOverflow = column.stopAtOverflow;
        column.stopAtOverflow = false;
    };
    /** @const */ var TableLayoutStrategy = vivliostyle.table.TableLayoutStrategy;
    goog.inherits(TableLayoutStrategy, EdgeSkipper);

    /**
     * @private
     * @const {Object<string, boolean>}
     */
    TableLayoutStrategy.ignoreList = {
        "table-caption": true,
        "table-column-group": true,
        "table-column": true
    };

    /**
     * @param {!vivliostyle.layoututil.LayoutIteratorState} state
     * @return {!adapt.task.Result<boolean>}
     */
    TableLayoutStrategy.prototype.startTableRow = function(state) {
        var nodeContext = state.nodeContext;
        if (this.currentRowIndex < 0) {
            goog.asserts.assert(nodeContext.sourceNode);
            this.currentRowIndex = this.formattingContext.findRowIndexBySourceNode(nodeContext.sourceNode);
        } else {
            this.currentRowIndex++;
        }
        this.column.saveEdgeAndCheckForOverflow(state.lastAfterNodeContext, null, true, state.breakAtTheEdge);
        return adapt.task.newResult(true);
    };

    /**
     * @param {!vivliostyle.layoututil.LayoutIteratorState} state
     * @return {!adapt.task.Result<boolean>}
     */
    TableLayoutStrategy.prototype.startTableCell = function(state) {
        var nodeContext = state.nodeContext;
        var afterNodeContext = nodeContext.copy().modify();
        afterNodeContext.after = true;
        state.nodeContext = afterNodeContext;
        var formattingContext = getTableFormattingContext(nodeContext.formattingContext);

        var cellChunkPosition = null;
        if (formattingContext.cellBreakPositions.length) {
            cellChunkPosition = formattingContext.cellBreakPositions.shift();
        }

        var cellViewNode = nodeContext.viewNode;
        var pseudoColumnContainer = cellViewNode.ownerDocument.createElement("div");
        cellViewNode.appendChild(pseudoColumnContainer);

        var cellFragment = new TableCellFragment(this.column, pseudoColumnContainer, nodeContext);
        this.formattingContext.addCellFragment(this.currentRowIndex, cellFragment);
        var cont = null;
        if (cellChunkPosition) {
            cont = adapt.task.newResult(cellChunkPosition);
        } else {
            cont = this.column.layoutContext.nextInTree(nodeContext, state.atUnforcedBreak).thenAsync(function(nextNodeContext) {
                if (nextNodeContext.viewNode) {
                    cellViewNode.removeChild(nextNodeContext.viewNode);
                }
                var cellNodePosition = adapt.vtree.newNodePositionFromNodeContext(nextNodeContext);
                return adapt.task.newResult(new adapt.vtree.ChunkPosition(cellNodePosition));
            });
        }
        return cont.thenAsync(function(cellChunkPosition) {
            return cellFragment.pseudoColumn.layout(cellChunkPosition, true).thenAsync(function() {
                this.afterNonInlineElementNode(state);
                return adapt.task.newResult(true);
            }.bind(this));
        }.bind(this));
    };

    /**
     * @param {!vivliostyle.layoututil.LayoutIteratorState} state
     * @return {!adapt.task.Result<boolean>}
     */
    TableLayoutStrategy.prototype.startNonInlineBox = function(state) {
        var nodeContext = state.nodeContext;
        var display = nodeContext.display;
        if (display === "table-row") {
            return this.startTableRow(state);
        } else if (display === "table-cell") {
            return this.startTableCell(state);
        } else {
            return adapt.task.newResult(true);
        }
    };

    /**
     * @param {!vivliostyle.layoututil.LayoutIteratorState} state
     */
    TableLayoutStrategy.prototype.endNonInlineBox = function(state) {
        var nodeContext = state.nodeContext;
        var display = nodeContext.display;
        if (display === "table-row") {
            var beforeNodeContext = nodeContext.copy().modify();
            beforeNodeContext.after = false;
            var bp = new InsideTableRowBreakPosition(this.currentRowIndex, beforeNodeContext, this.formattingContext);
            this.column.breakPositions.push(bp);
        }
    };

    /**
     * @param {!vivliostyle.layoututil.LayoutIteratorState} state
     */
    TableLayoutStrategy.prototype.afterNonInlineElementNode = function(state) {
        var nodeContext = state.nodeContext;
        var display = nodeContext.display;
        if (display && TableLayoutStrategy.ignoreList[display]) {
            nodeContext.viewNode.parentNode.removeChild(nodeContext.viewNode);
        } else if (nodeContext.sourceNode === this.formattingContext.tableSourceNode) {
            nodeContext = state.nodeContext = nodeContext.modify();
            nodeContext.formattingContext = null;
            this.column.stopAtOverflow = this.originalStopAtOverflow;
            state.break = true;
        } else {
            EdgeSkipper.prototype.afterNonInlineElementNode.call(this, state);
        }
    };

    /**
     * @constructor
     * @implements {adapt.layout.LayoutProcessor}
     */
    vivliostyle.table.TableLayoutProcessor = function() {};
    /** @const */ var TableLayoutProcessor = vivliostyle.table.TableLayoutProcessor;

    /**
     * @private
     * @param {adapt.vtree.NodeContext} nodeContext
     * @param {!adapt.layout.Column} column
     * @returns {!adapt.task.Result.<adapt.vtree.NodeContext>}
     */
    TableLayoutProcessor.prototype.layoutEntireTable = function(nodeContext, column) {
        /** @const */ var formattingContext = getTableFormattingContext(nodeContext.formattingContext);
        /** @const */ var strategy = new EntireTableLayoutStrategy(formattingContext, column);
        /** @const */ var iterator = new LayoutIterator(strategy, column.layoutContext);
        return iterator.iterate(nodeContext);
    };

    /**
     * @private
     * @param {!Element} lastRow
     * @param {number} columnCount
     * @param {boolean} vertical
     * @param {adapt.vtree.ClientLayout} clientLayout
     * @returns {!Array<number>}
     */
    TableLayoutProcessor.prototype.getColumnWidths = function(lastRow, columnCount, vertical, clientLayout) {
        /** @const */ var doc = lastRow.ownerDocument;
        /** @const */ var dummyRow = doc.createElement("tr");
        /** @const */ var dummyCells = [];
        for (var i = 0; i < columnCount; i++) {
            var cell = doc.createElement("td");
            dummyRow.appendChild(cell);
            dummyCells.push(cell);
        }
        lastRow.parentNode.insertBefore(dummyRow, lastRow.nextSibling);
        /** @const */ var colWidths = dummyCells.map(function(cell) {
            var rect = clientLayout.getElementClientRect(cell);
            return vertical ? rect["height"] : rect["width"];
        });
        lastRow.parentNode.removeChild(dummyRow);
        return colWidths;
    };

    /**
     * @private
     * @param {!Element} tableElement
     * @returns {!Array<!Element>}
     */
    TableLayoutProcessor.prototype.getColGroupElements = function(tableElement) {
        var colGroups = [];
        var child = tableElement.firstElementChild;
        do {
            if (child.localName === "colgroup") {
                colGroups.push(child);
            }
        } while (child = child.nextElementSibling);
        return colGroups;
    };

    /**
     * @private
     * @param {!Array<!Element>} colGroups
     * @returns {!Array<!Element>}
     */
    TableLayoutProcessor.prototype.normalizeAndGetColElements = function(colGroups) {
        var cols = [];
        colGroups.forEach(function(colGroup) {
            // Replace colgroup[span=n] with colgroup with n col elements
            var span = colGroup.span;
            colGroup.removeAttribute("span");
            var col = colGroup.firstElementChild;
            while (col) {
                if (col.localName === "col") {
                    // Replace col[span=n] with n col elements
                    var s = col.span;
                    col.removeAttribute("span");
                    span -= s;
                    while (s-- > 1) {
                        var cloned = col.cloneNode(true);
                        colGroup.insertBefore(cloned, col);
                        cols.push(cloned);
                    }
                    cols.push(col);
                }
                col = col.nextElementSibling;
            }
            while (span-- > 0) {
                col = colGroup.ownerDocument.createElement("col");
                colGroup.appendChild(col);
                cols.push(col);
            }
        });
        return cols;
    };

    /**
     * @private
     * @param {!Array<!Element>} cols
     * @param {!Array<!Element>} colGroups
     * @param {number} columnCount
     * @param {!Element} tableElement
     */
    TableLayoutProcessor.prototype.addMissingColElements = function(cols, colGroups, columnCount, tableElement) {
        if (cols.length < columnCount) {
            var colGroup = tableElement.ownerDocument.createElement("colgroup");
            colGroups.push(colGroup);
            for (var i = cols.length; i < columnCount; i++) {
                var col = tableElement.ownerDocument.createElement("col");
                colGroup.appendChild(col);
                cols.push(col);
            }
        }
    };

    /**
     * Measure width of columns and normalize colgroup and col elements so that each column has
     * a corresponding col element with the width specified.
     * @param {!vivliostyle.table.TableFormattingContext} formattingContext
     * @param {!Element} tableElement
     * @param {!adapt.layout.Column} column
     */
    TableLayoutProcessor.prototype.normalizeColGroups = function(formattingContext, tableElement, column) {
        /** @const */ var vertical = formattingContext.vertical;
        /** @const */ var lastRow = formattingContext.lastRowViewNode;
        goog.asserts.assert(lastRow);
        formattingContext.lastRowViewNode = null;
        /** @const */ var doc = lastRow.ownerDocument;
        /** @const */ var fragment = doc.createDocumentFragment();

        // Count columns
        /** @const */ var columnCount = formattingContext.getColumnCount();
        if (!(columnCount > 0)) {
            formattingContext.colGroups = fragment;
            return;
        }

        // Measure column widths
        /** @const */ var colWidths = this.getColumnWidths(lastRow, columnCount, vertical, column.clientLayout);

        // Normalize colgroup and col elements
        /** @const */ var colGroups = this.getColGroupElements(tableElement);
        /** @const */ var cols = this.normalizeAndGetColElements(colGroups);

        // Add missing col elements for remaining columns
        this.addMissingColElements(cols, colGroups, columnCount, tableElement);

        // Assign width to col elements
        cols.forEach(function(col, i) {
            adapt.base.setCSSProperty(col, vertical ? "height" : "width", colWidths[i] + "px");
        });

        colGroups.forEach(function(colGroup) {
            fragment.appendChild(colGroup.cloneNode(true));
        });
        formattingContext.colGroups = fragment;
    };

    /**
     * @param {!adapt.vtree.NodeContext} nodeContext
     * @param {!adapt.layout.Column} column
     * @returns {!adapt.task.Result.<adapt.vtree.NodeContext>}
     */
    TableLayoutProcessor.prototype.doInitialLayout = function(nodeContext, column) {
        var formattingContext = getTableFormattingContext(nodeContext.formattingContext);
        formattingContext.vertical = nodeContext.vertical;
        var frame = adapt.task.newFrame("TableLayoutProcessor.doInitialLayout");
        this.layoutEntireTable(nodeContext, column).then(function(nodeContextAfter) {
            var tableElement = nodeContextAfter.viewNode;
            var tableBBox = column.clientLayout.getElementClientRect(tableElement);
            if (!column.isOverflown(column.vertical ? tableBBox.left : tableBBox.bottom)) {
                nodeContextAfter = nodeContextAfter.modify();
                nodeContextAfter.formattingContext = null;
                frame.finish(nodeContextAfter);
                return;
            }
            this.normalizeColGroups(formattingContext, tableElement, column);
            formattingContext.updateCellSizes(column.clientLayout);
            frame.finish(null);
        }.bind(this));
        return frame.result();
    };

    /**
     * @param {!vivliostyle.table.TableFormattingContext} formattingContext
     * @param {!Element} rootViewNode
     * @param {?Node} firstChild
     */
    TableLayoutProcessor.prototype.addCaptions = function(formattingContext, rootViewNode, firstChild) {
        var captions = formattingContext.captions;
        captions.forEach(function(caption, i) {
            if (caption) {
                rootViewNode.insertBefore(caption.viewNode, firstChild);
                if (caption.side === "top") {
                    captions[i] = null;
                }
            }
        });
    };

    /**
     * @param {!vivliostyle.table.TableFormattingContext} formattingContext
     * @param {!Element} rootViewNode
     * @param {?Node} firstChild
     */
    TableLayoutProcessor.prototype.addColGroups = function(formattingContext, rootViewNode, firstChild) {
        rootViewNode.insertBefore(formattingContext.colGroups.cloneNode(true), firstChild);
    };

    /**
     * @param {!adapt.vtree.NodeContext} nodeContext
     * @param {!adapt.layout.Column} column
     * @returns {!adapt.task.Result.<adapt.vtree.NodeContext>}
     */
    TableLayoutProcessor.prototype.doLayout = function(nodeContext, column) {
        var formattingContext = getTableFormattingContext(nodeContext.formattingContext);
        var rootViewNode = formattingContext.getRootViewNode(nodeContext);
        var firstChild = rootViewNode.firstChild;
        this.addCaptions(formattingContext, rootViewNode, firstChild);
        this.addColGroups(formattingContext, rootViewNode, firstChild);

        var strategy = new TableLayoutStrategy(formattingContext, column);
        var iterator = new LayoutIterator(strategy, column.layoutContext);
        var frame = adapt.task.newFrame("TableFormattingContext.doLayout");
        iterator.iterate(nodeContext).thenFinish(frame);
        return frame.result();
    };

    /**
     * @override
     */
    TableLayoutProcessor.prototype.layout = function(nodeContext, column) {
        var formattingContext = getTableFormattingContext(nodeContext.formattingContext);
        var frame = adapt.task.newFrame("TableLayoutProcessor.layout");
        if (!formattingContext.doneInitialLayout) {
            var initialPosition = nodeContext.copy();
            this.doInitialLayout(nodeContext, column).then(function(positionAfter) {
                formattingContext.doneInitialLayout = true;
                if (positionAfter) {
                    // not overflowing
                    frame.finish(positionAfter);
                } else {
                    var tableViewNode = initialPosition.viewNode;
                    var child;
                    while (child = tableViewNode.lastChild) {
                        tableViewNode.removeChild(child);
                    }
                    this.doLayout(initialPosition, column).thenFinish(frame);
                }
            }.bind(this));
        } else {
            this.doLayout(nodeContext, column).thenFinish(frame);
        }
        return frame.result();
    };

    /**
     * @override
     */
    TableLayoutProcessor.prototype.createEdgeBreakPosition = function(position, breakOnEdge, overflows, columnBlockSize) {
        return new BetweenTableRowBreakPosition(position, breakOnEdge, overflows, columnBlockSize);
    };

    /**
     * @override
     */
    TableLayoutProcessor.prototype.finishBreak = function(column, nodeContext, forceRemoveSelf, endOfRegion) {
        var formattingContext = getTableFormattingContext(nodeContext.formattingContext);
        if (nodeContext.display === "table-row" && !nodeContext.after) {
            goog.asserts.assert(nodeContext.sourceNode);
            var rowIndex = formattingContext.findRowIndexBySourceNode(nodeContext.sourceNode);
            formattingContext.cellBreakPositions = [];
            var cont = adapt.task.newResult(true);
            formattingContext.getCellFragmentsFallingOnRow(rowIndex).forEach(function(cellFragment) {
                cont = cont.thenAsync(function() {
                    var breakNodeContext = cellFragment.pseudoColumn.findAcceptableBreakPosition().nodeContext;
                    goog.asserts.assert(breakNodeContext);
                    var breakChunkPosition = new adapt.vtree.ChunkPosition(breakNodeContext.toNodePosition());
                    formattingContext.cellBreakPositions.push(breakChunkPosition);
                    cellFragment.column.layoutContext.processFragmentedBlockEdge(cellFragment.cellNodeContext);
                    return cellFragment.pseudoColumn.finishBreak(breakNodeContext, false, true).thenReturn(true);
                });
            });
            return cont.thenAsync(function() {
                column.layoutContext.processFragmentedBlockEdge(nodeContext);
                formattingContext.finishFragment();
                return adapt.task.newResult(true);
            });
        } else {
            formattingContext.finishFragment();
            return null;
        }
    };

    /**
     * @const
     */
    var tableLayoutProcessor = new TableLayoutProcessor();

    /**
     * @type {vivliostyle.plugin.ResolveFormattingContextHook}
     */
    function resolveFormattingContextHook(nodeContext, firstTime) {
        if (!firstTime)
            return null;
        var display = nodeContext.display;
        if (display === "table") {
            return new TableFormattingContext(/** @type {!Element} */ (nodeContext.sourceNode));
        }
        return null;
    }

    /**
     * @type {vivliostyle.plugin.ResolveLayoutProcessorHook}
     */
    function resolveLayoutProcessor(formattingContext) {
        if (formattingContext instanceof TableFormattingContext) {
            return tableLayoutProcessor;
        }
        return null;
    }

    function registerHooks() {
        var plugin = vivliostyle.plugin;
        plugin.registerHook(plugin.HOOKS.RESOLVE_FORMATTING_CONTEXT,
            resolveFormattingContextHook);
        plugin.registerHook(plugin.HOOKS.RESOLVE_LAYOUT_PROCESSOR,
            resolveLayoutProcessor);
    }

    registerHooks();
});

