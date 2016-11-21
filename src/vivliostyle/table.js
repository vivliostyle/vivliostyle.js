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
    /**
     * @constructor
     */
    vivliostyle.table.TableRow = function() {
        /** @const {!Array<vivliostyle.table.TableCell>} */ this.cells = [];
        /** @private @type {!Array<adapt.vtree.ChunkPosition>} */ this.cellBreakPositions = [];
        /** @private @type {!Array<adapt.vtree.ChunkPosition>} */ this.previousCellBreakPositions = [];
        /** @type {!Array<adapt.vtree.NodeContext>} */ this.cellNodeContexts = [];
    };
    /** @const */ var TableRow = vivliostyle.table.TableRow;

    /**
     * @param {!vivliostyle.table.TableCell} cell
     */
    TableRow.prototype.addCell = function(cell) {
        this.cells.push(cell);
    };

    /**
     * @param {adapt.vtree.ChunkPosition} cellBreakPosition
     * @param {adapt.vtree.NodeContext} cellNodeContext
     */
    TableRow.prototype.addCellPosition = function(cellBreakPosition, cellNodeContext) {
        this.cellBreakPositions.push(cellBreakPosition);
        this.cellNodeContexts.push(cellNodeContext);
    };

    TableRow.prototype.resetCellBreakPositions = function() {
        this.previousCellBreakPositions = this.cellBreakPositions;
        this.cellBreakPositions = [];
    };

    /**
     * @returns {!Array<adapt.vtree.ChunkPosition>}
     */
    TableRow.prototype.getPreviousCellBreakPositions = function() {
        return this.previousCellBreakPositions.slice();
    };

    /**
     * @returns {!Array<adapt.vtree.NodeContext>}
     */
    TableRow.prototype.resetCellNodeContexts = function() {
        var cellNodeContexts = this.cellNodeContexts;
        this.cellNodeContexts = [];
        return cellNodeContexts;
    };

    /**
     * @returns {boolean}
     */
    TableRow.prototype.isFragmented = function() {
        return this.cellBreakPositions.some(function(position) { return !!position; });
    };

    /**
     * @returns {boolean}
     */
    TableRow.prototype.wasPreviouslyFragmented = function() {
        return this.previousCellBreakPositions.some(function(position) { return !!position; });
    };

    /**
     * @returns {number}
     */
    TableRow.prototype.getMinimumHeight = function() {
        return Math.min.apply(null, this.cells.map(function(c) { return c.height; }));
    };

    /**
     * @param {!Element} element
     * @constructor
     */
    vivliostyle.table.TableCell = function(element) {
        /** @const {number} */ this.colSpan = element.colSpan || 1;
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
     * @param {!Element} tableSourceNode Source node of the table
     * @constructor
     * @implements {adapt.vtree.FormattingContext}
     */
    vivliostyle.table.TableFormattingContext = function(tableSourceNode) {
        /** @const */ this.tableSourceNode = tableSourceNode;
        /** @type {boolean} */ this.doneInitialLayout = false;
        /** @type {boolean} */ this.vertical = false;
        /** @private @type {number} */ this.currentRowIndex = 0;
        /** @type {number} */ this.tableWidth = 0;
        /** @const {!Array<Element>} */ this.captions = [];
        /** @const {!Array<string>} */ this.captionSide = [];
        /** @type {DocumentFragment} */ this.colGroups = null;
        /** @const {!Array<vivliostyle.table.TableRow>} */ this.rows = [];
        /** @type {Element} */ this.lastRowViewNode = null;
    };
    /** @const */ var TableFormattingContext = vivliostyle.table.TableFormattingContext;

    /**
     * @override
     */
    TableFormattingContext.prototype.getName = function() {
        return "Table formatting context (vivliostyle.table.TableFormattingContext)";
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
     * @returns {boolean}
     */
    TableFormattingContext.prototype.isFreelyFragmentableRow = function(row) {
        return row.getMinimumHeight() > this.tableWidth / 2;
    };

    /**
     * @returns {!vivliostyle.table.TableRow}
     */
    TableFormattingContext.prototype.getCurrentRow = function() {
        var row = this.rows[this.currentRowIndex];
        goog.asserts.assert(row);
        return row;
    };

    TableFormattingContext.prototype.nextRow = function() {
        this.currentRowIndex++;
    };

    /**
     * @override
     */
    TableFormattingContext.prototype.isFirstTime = function(nodeContext, firstTime) {
        if (!firstTime) {
            return firstTime;
        }
        // Since the row can be null, access the array directly to circumvent assertion error.
        var row = this.rows[this.currentRowIndex];
        return !(row && row.wasPreviouslyFragmented());
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
        /** @type {!Array<!Element>} */ this.currentRowCellElements = [];
    };
    /** @const */ var EntireTableLayoutStrategy = vivliostyle.table.EntireTableLayoutStrategy;
    goog.inherits(EntireTableLayoutStrategy, vivliostyle.layoututil.LayoutIteratorStrategy);

    /**
     * @override
     */
    EntireTableLayoutStrategy.prototype.startNonInlineElementNode = function(state) {
        /** @const */ var formattingContext = this.formattingContext;
        /** @const */ var nodeContext = state.nodeContext;
        /** @const */ var display = nodeContext.display;
        switch (display) {
            case "table-caption":
                formattingContext.captions.push(/** @type {Element} */ (nodeContext.viewNode));
                formattingContext.captionSide.push(nodeContext.captionSide);
                break;
            case "table-row":
                this.currentRowCellElements = [];
                this.row = new TableRow();
                break;
            case "table-cell":
                return this.column.buildDeepElementView(nodeContext).thenAsync(function(cellNodeContext) {
                    state.nodeContext = cellNodeContext;
                    var elem = cellNodeContext.viewNode;
                    var cell = new TableCell(elem);
                    this.currentRowCellElements.push(elem);
                    this.row.addCell(cell);
                    return adapt.task.newResult(true);
                }.bind(this));
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
                    this.row.cells.forEach(function(cell, i) {
                        var elem = this.currentRowCellElements[i];
                        var rect = clientLayout.getElementClientRect(elem);
                        cell.setHeight(formattingContext.vertical ? rect["width"] : rect["height"]);
                    }, this);
                    formattingContext.rows.push(this.row);
                    formattingContext.lastRowViewNode = /** @type {Element} */ (nodeContext.viewNode);
                    break;
            }
        }
    };

    /**
     * @param {!vivliostyle.table.TableFormattingContext} formattingContext
     * @param {!adapt.layout.Column} column
     * @param {boolean} leadingEdge
     * @constructor
     * @extends {vivliostyle.layoututil.EdgeSkipper}
     */
    vivliostyle.table.RowByRowTableLayoutStrategy = function(formattingContext, column, leadingEdge) {
        vivliostyle.layoututil.EdgeSkipper.call(this, leadingEdge);
        /** @private @const */ this.formattingContext = formattingContext;
        /** @private @const */ this.column = column;
        /** @private @type {!Array<adapt.vtree.ChunkPosition>} */ this.cellPositions = [];
    };
    /** @const */ var RowByRowTableLayoutStrategy = vivliostyle.table.RowByRowTableLayoutStrategy;
    goog.inherits(RowByRowTableLayoutStrategy, vivliostyle.layoututil.EdgeSkipper);

    /**
     * @private
     * @const {Object<string, boolean>}
     */
    RowByRowTableLayoutStrategy.ignoreList = {
        "table-caption": true,
        "table-column-group": true,
        "table-column": true
    };

    /**
     * @private
     * @param {!vivliostyle.table.TableRow} row
     */
    RowByRowTableLayoutStrategy.prototype.initCellPositions = function(row) {
        if (row.wasPreviouslyFragmented()) {
            this.cellPositions = row.getPreviousCellBreakPositions();
        } else {
            this.cellPositions = [];
        }
    };

    /**
     * @private
     * @returns {boolean}
     */
    RowByRowTableLayoutStrategy.prototype.isCurrentRowContinued = function() {
        return this.cellPositions.length > 0;
    };

    /**
     * @private
     * @param {!vivliostyle.layoututil.LayoutIteratorState} state
     * @returns {!adapt.task.Result<boolean>}
     */
    RowByRowTableLayoutStrategy.prototype.startTableRow = function(state) {
        if (!this.processForcedBreak(state, this.column)) {
            if (this.saveEdgeAndProcessOverflow(state, this.column)) {
                state.break = true;
                return adapt.task.newResult(true);
            }
        }

        /** @const */ var formattingContext = this.formattingContext;
        var row = formattingContext.getCurrentRow();
        if (formattingContext.isFreelyFragmentableRow(row)) {
            this.initCellPositions(row);
            return adapt.task.newResult(true);
        } else {
            return this.column.buildDeepElementView(state.nodeContext).thenAsync(function(nodeContextAfter) {
                state.nodeContext = nodeContextAfter;
                state.onStartEdges = false;
                var r = this.afterNonInlineElementNode(state);
                return r || adapt.task.newResult(true);
            }.bind(this));
        }
    };

    /**
     * @private
     * @param {!vivliostyle.layoututil.LayoutIteratorState} state
     * @returns {!adapt.task.Result<boolean>}
     */
    RowByRowTableLayoutStrategy.prototype.startTableCell = function(state) {
        var nodeContext = state.nodeContext;
        var afterNodeContext = nodeContext.modify();
        afterNodeContext.after = true;
        state.nodeContext = afterNodeContext;

        var cellChunkPosition;
        if (this.isCurrentRowContinued()) {
            cellChunkPosition = this.cellPositions.shift();
            if (!cellChunkPosition) {
                // The cell was not fragmented previously
                return adapt.task.newResult(true);
            }
        } else {
            var cellNodePosition = adapt.vtree.newNodePositionFromNodeContext(nodeContext);
            cellChunkPosition = new adapt.vtree.ChunkPosition(cellNodePosition);
        }

        var parentNode = /** @type {Element} */ (nodeContext.viewNode.parentNode);
        nodeContext.viewNode.parentNode.removeChild(nodeContext.viewNode);
        nodeContext.viewNode = null;

        var row = this.formattingContext.getCurrentRow();

        var pseudoColumn = new vivliostyle.layoututil.PseudoColumn(this.column, parentNode);
        return pseudoColumn.layout(cellChunkPosition, true).thenAsync(function(cellBreakPosition) {
            row.addCellPosition(cellBreakPosition, pseudoColumn.firstOpenedPosition);
            return adapt.task.newResult(true);
        });
    };

    /**
     * @override
     */
    RowByRowTableLayoutStrategy.prototype.startNonInlineBox = function(state) {
        /** @const */ var nodeContext = state.nodeContext;
        /** @const */ var display = nodeContext.display;
        goog.asserts.assert(display);
        /** @const */ var layoutConstraint = this.column.layoutConstraint;
        if (layoutConstraint && this.processLayoutConstraint(state, layoutConstraint, this.column)) {
            state.break = true;
            return adapt.task.newResult(true);
        }
        if (display === "table-row") {
            return this.startTableRow(state);
        } else if (display === "table-cell") {
            return this.startTableCell(state);
        } else if (!RowByRowTableLayoutStrategy.ignoreList[display]) {
            state.leadingEdgeContexts.push(state.nodeContext.copy());
            state.breakAtTheEdge = vivliostyle.break.resolveEffectiveBreakValue(state.breakAtTheEdge, state.nodeContext.breakBefore);
        }
        return adapt.task.newResult(true);
    };

    /**
     * @param {!vivliostyle.layoututil.LayoutIteratorState} state
     * @returns {!adapt.task.Result.<boolean>}
     */
    RowByRowTableLayoutStrategy.prototype.endTableRow = function(state) {
        var formattingContext = this.formattingContext;
        var row = formattingContext.getCurrentRow();
        if (row.isFragmented()) {
            var cellNodeContexts = row.resetCellNodeContexts();
            cellNodeContexts.forEach(function(cellNodeContext) {
                this.column.layoutContext.processFragmentedBlockEdge(cellNodeContext);
            }, this);
            state.nodeContext = state.nodeContext.modify();
            state.nodeContext.overflow = true;
            state.break = true;
        } else {
            row.resetCellBreakPositions();
            vivliostyle.layoututil.EdgeSkipper.prototype.afterNonInlineElementNode.call(this, state);
            if (this.saveEdgeAndProcessOverflow(state, this.column)) {
                state.break = true;
            } else {
                formattingContext.nextRow();
            }
        }
        return adapt.task.newResult(true);
    };

    /**
     * @override
     */
    RowByRowTableLayoutStrategy.prototype.afterNonInlineElementNode = function(state) {
        var nodeContext = state.nodeContext;
        /** @const */ var display = nodeContext.display;
        if (display && RowByRowTableLayoutStrategy.ignoreList[display]) {
            nodeContext.viewNode.parentNode.removeChild(nodeContext.viewNode);
        } else if (display === "table-row") {
            return this.endTableRow(state);
        } else if (nodeContext.sourceNode === this.formattingContext.tableSourceNode) {
            nodeContext = state.nodeContext = nodeContext.modify();
            nodeContext.formattingContext = null;
            state.break = true;
        } else {
            vivliostyle.layoututil.EdgeSkipper.prototype.afterNonInlineElementNode.call(this, state);
        }
        return adapt.task.newResult(true);
    };

    /**
     * @override
     */
    RowByRowTableLayoutStrategy.prototype.endEmptyNonInlineBox = function(state) {
        state.break = this.processForcedBreak(state, this.column);
    };

    /**
     * @constructor
     * @implements {adapt.layout.LayoutProcessor}
     */
    vivliostyle.table.TableLayoutProcessor = function() {};
    var TableLayoutProcessor = vivliostyle.table.TableLayoutProcessor;

    /**
     * @private
     * @param {adapt.vtree.NodeContext} nodeContext
     * @param {!adapt.layout.Column} column
     * @returns {!adapt.task.Result.<adapt.vtree.NodeContext>}
     */
    TableLayoutProcessor.prototype.layoutEntireTable = function(nodeContext, column) {
        /** @const */ var formattingContext = getTableFormattingContext(nodeContext.formattingContext);
        /** @const */ var strategy = new EntireTableLayoutStrategy(formattingContext, column);
        /** @const */ var iterator = new vivliostyle.layoututil.LayoutIterator(strategy, column.layoutContext);
        return iterator.iterate(nodeContext);
    };

    /**
     * @private
     * @param {!vivliostyle.table.TableFormattingContext} formattingContext
     * @returns {number}
     */
    TableLayoutProcessor.prototype.getColumnCount = function(formattingContext) {
        return Math.max.apply(null,
            formattingContext.rows.map(function(row) {
                return row.cells.reduce(function(sum, c) {
                    return sum + c.colSpan;
                }, 0);
            })
        );
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
     * @param {!Element} tableElement
     * @param {!vivliostyle.table.TableFormattingContext} formattingContext
     * @param {!adapt.layout.Column} column
     * @returns {!DocumentFragment} A DocumentFragment containing the normalized colgroup elements.
     */
    TableLayoutProcessor.prototype.normalizeColGroups = function(tableElement, formattingContext, column) {
        /** @const */ var vertical = formattingContext.vertical;
        /** @const */ var lastRow = formattingContext.lastRowViewNode;
        goog.asserts.assert(lastRow);
        formattingContext.lastRowViewNode = null;
        /** @const */ var doc = lastRow.ownerDocument;
        /** @const */ var fragment = doc.createDocumentFragment();

        // Count columns
        /** @const */ var columnCount = this.getColumnCount(formattingContext);
        if (!(columnCount > 0)) {
            return fragment;
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
        return fragment;
    };

    /**
     * @param {!adapt.vtree.NodeContext} nodeContext
     * @param {!adapt.layout.Column} column
     * @returns {!adapt.task.Result.<adapt.vtree.NodeContext>}
     */
    TableLayoutProcessor.prototype.doInitialLayout = function(nodeContext, column) {
        var formattingContext = getTableFormattingContext(nodeContext.formattingContext);
        formattingContext.vertical = nodeContext.vertical;
        var frame = adapt.task.newFrame("layoutTableFirst");
        this.layoutEntireTable(nodeContext, column).then(function(nodeContextAfter) {
            var tableElement = nodeContextAfter.viewNode;
            var tableBBox = column.clientLayout.getElementClientRect(tableElement);
            if (!column.isOverflown(column.vertical ? tableBBox.left : tableBBox.bottom)) {
                nodeContextAfter = nodeContextAfter.modify();
                nodeContextAfter.formattingContext = null;
                frame.finish(nodeContextAfter);
                return;
            }
            formattingContext.colGroups = this.normalizeColGroups(tableElement, formattingContext, column);
            frame.finish(null);
        }.bind(this));
        return frame.result();
    };

    /**
     * @param {!adapt.vtree.NodeContext} nodeContext
     * @param {!adapt.layout.Column} column
     * @param {boolean} leadingEdge
     * @returns {!adapt.task.Result.<adapt.vtree.NodeContext>}
     */
    TableLayoutProcessor.prototype.layoutTableRowByRow = function(nodeContext, column, leadingEdge) {
        var formattingContext = getTableFormattingContext(nodeContext.formattingContext);
        var skipper = new RowByRowTableLayoutStrategy(formattingContext, column, leadingEdge);
        var iterator = new vivliostyle.layoututil.LayoutIterator(skipper, column.layoutContext);
        return iterator.iterate(nodeContext);
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
        formattingContext.captions.forEach(function(caption, i) {
            if (caption) {
                rootViewNode.insertBefore(caption, firstChild);
                if (formattingContext.captionSide[i] === "top") {
                    formattingContext.captions[i] = null;
                }
            }
        });

        rootViewNode.insertBefore(formattingContext.colGroups.cloneNode(true), firstChild);

        var frame = adapt.task.newFrame("TableFormattingContext.doLayout");
        this.layoutTableRowByRow(nodeContext, column, true).then(function(positionAfter) {
            frame.finish(positionAfter);
        });
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
    TableLayoutProcessor.prototype.findAndProcessAcceptableBreak = function(overflownNodeContext, initialNodeContext, column) {
        var formattingContext = getTableFormattingContext(overflownNodeContext.formattingContext);
        var row = formattingContext.rows[formattingContext.currentRowIndex];
        if (row.isFragmented()) {
            row.resetCellBreakPositions();
            column.layoutContext.processFragmentedBlockEdge(overflownNodeContext);
            var afterNodeContext = overflownNodeContext.modify();
            afterNodeContext.after = false;
            afterNodeContext.overflow = false;
            return adapt.task.newResult(/** @type {adapt.vtree.NodeContext} */ (afterNodeContext));
        } else {
            return adapt.task.newResult(/** @type {adapt.vtree.NodeContext} */ (null));
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

