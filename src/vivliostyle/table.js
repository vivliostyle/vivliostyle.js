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
    };
    /** @const */ var TableRow = vivliostyle.table.TableRow;

    /**
     * @param {!vivliostyle.table.TableCell} cell
     */
    TableRow.prototype.addCell = function(cell) {
        this.cells.push(cell);
    };

    /**
     * @param {!Element} element
     * @constructor
     */
    vivliostyle.table.TableCell = function(element) {
        /** @const {number} */ this.colSpan = element.colSpan || 1;
    };
    /** @const */ var TableCell = vivliostyle.table.TableCell;

    /**
     * @param {!Element} tableSourceNode Source node of the table
     * @constructor
     * @implements {adapt.vtree.FormattingContext}
     */
    vivliostyle.table.TableFormattingContext = function(tableSourceNode) {
        /** @const */ this.tableSourceNode = tableSourceNode;
        /** @type {boolean} */ this.doneInitialLayout = false;
        /** @type {Element} */ this.caption = null;
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
     * @returns {Node}
     */
    TableFormattingContext.prototype.getRootViewNode = function(position) {
        do {
            if (position.sourceNode === this.tableSourceNode) {
                return position.viewNode;
            }
        } while (position = position.parent);
        return null;
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
                if (!formattingContext.caption) {
                    formattingContext.caption = /** @type {Element} */ (nodeContext.viewNode);
                }
                break;
            case "table-row":
                this.row = new TableRow();
                break;
            case "table-cell":
                return this.column.buildDeepElementView(nodeContext).thenAsync(function(cellNodeContext) {
                    var cell = new TableCell(cellNodeContext.viewNode);
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
        if (nodeContext.sourceNode === formattingContext.tableSourceNode) {
            state.break = true;
        } else {
            switch (display) {
                case "table-row":
                    formattingContext.rows.push(this.row);
                    formattingContext.lastRowViewNode = /** @type {Element} */ (nodeContext.viewNode);
                    break;
            }
        }
    };

    /**
     * @param {!Element} tableSourceNode Source node of the table
     * @param {!adapt.layout.Column} column
     * @param {boolean} leadingEdge
     * @constructor
     * @extends {vivliostyle.layoututil.EdgeSkipper}
     */
    vivliostyle.table.TableEdgeSkipper = function(tableSourceNode, column, leadingEdge) {
        vivliostyle.layoututil.EdgeSkipper.call(this, leadingEdge);
        /** @private @const */ this.tableSourceNode = tableSourceNode;
        /** @private @const */ this.column = column;
    };
    /** @const */ var TableEdgeSkipper = vivliostyle.table.TableEdgeSkipper;
    goog.inherits(TableEdgeSkipper, vivliostyle.layoututil.EdgeSkipper);

    /**
     * @private
     * @const {Object<string, boolean>}
     */
    TableEdgeSkipper.ignoreList = {
        "table-caption": true,
        "table-column-group": true,
        "table-column": true
    };

    /**
     * @override
     */
    TableEdgeSkipper.prototype.startNonInlineBox = function(state) {
        /** @const */ var nodeContext = state.nodeContext;
        /** @const */ var display = nodeContext.display;
        goog.asserts.assert(display);
        /** @const */ var layoutConstraint = this.column.layoutConstraint;
        if (layoutConstraint && this.processLayoutConstraint(state, layoutConstraint, this.column)) {
            state.break = true;
            return;
        }
        if (display === "table-row") {
            if (!this.processForcedBreak(state, this.column)) {
                this.saveEdgeAndProcessOverflow(state, this.column);
            }
            state.break = true;
        } else if (!TableEdgeSkipper.ignoreList[display]) {
            state.leadingEdgeContexts.push(state.nodeContext.copy());
            state.breakAtTheEdge = vivliostyle.break.resolveEffectiveBreakValue(state.breakAtTheEdge, state.nodeContext.breakBefore);
        }
    };

    /**
     * @override
     */
    TableEdgeSkipper.prototype.afterNonInlineElementNode = function(state) {
        var nodeContext = state.nodeContext;
        /** @const */ var display = nodeContext.display;
        if (display && TableEdgeSkipper.ignoreList[display]) {
            nodeContext.viewNode.parentNode.removeChild(nodeContext.viewNode);
        } else if (nodeContext.sourceNode === this.tableSourceNode) {
            nodeContext = state.nodeContext = nodeContext.modify();
            nodeContext.formattingContext = null;
            state.break = true;
        } else {
            vivliostyle.layoututil.EdgeSkipper.prototype.afterNonInlineElementNode.call(this, state);
        }
    };

    /**
     * @override
     */
    TableEdgeSkipper.prototype.endEmptyNonInlineBox = function(state) {
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
     * @param {adapt.vtree.ClientLayout} clientLayout
     * @returns {!Array<number>}
     */
    TableLayoutProcessor.prototype.getColumnWidths = function(lastRow, columnCount, clientLayout) {
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
            return clientLayout.getElementClientRect(cell)["width"];
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
        /** @const */ var colWidths = this.getColumnWidths(lastRow, columnCount, column.clientLayout);

        // Normalize colgroup and col elements
        /** @const */ var colGroups = this.getColGroupElements(tableElement);
        /** @const */ var cols = this.normalizeAndGetColElements(colGroups);

        // Add missing col elements for remaining columns
        this.addMissingColElements(cols, colGroups, columnCount, tableElement);

        // Assign width to col elements
        cols.forEach(function(col, i) {
            adapt.base.setCSSProperty(col, "width", colWidths[i] + "px");
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
    TableLayoutProcessor.prototype.skipToTableRow = function(nodeContext, column, leadingEdge) {
        var formattingContext = getTableFormattingContext(nodeContext.formattingContext);
        var skipper = new TableEdgeSkipper(formattingContext.tableSourceNode, column, leadingEdge);
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
        if (formattingContext.caption) {
            rootViewNode.insertBefore(formattingContext.caption, firstChild);
        }
        rootViewNode.insertBefore(formattingContext.colGroups.cloneNode(true), firstChild);

        var frame = adapt.task.newFrame("TableFormattingContext.doLayout");
        /** @type {adapt.vtree.NodeContext} */ var position = nodeContext;
        var leadingEdge = true;
        frame.loopWithFrame(function(loopFrame) {
            if (!position) {
                loopFrame.breakLoop();
                return;
            }
            this.skipToTableRow(position, column, leadingEdge).then(function(p) {
                position = p;
                if (!position || position.overflow ||
                    (position.after && position.sourceNode === formattingContext.tableSourceNode)) {
                    loopFrame.breakLoop();
                } else {
                    column.buildDeepElementView(position).then(function(positionAfter) {
                        position = positionAfter;
                        loopFrame.continueLoop();
                    });
                }
            });
        }.bind(this)).then(function() {
            frame.finish(position);
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

