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
     * @param {!Element} tableSourceNode Source node of the table
     * @constructor
     * @implements {adapt.vtree.FormattingContext}
     */
    vivliostyle.table.TableFormattingContext = function(tableSourceNode) {
        /** @const */ this.tableSourceNode = tableSourceNode;
        /** @type {boolean} */ this.doneInitialLayout = false;
        /** @type {HTMLElement} */ this.caption = null;
        /** @type {DocumentFragment} */ this.colGroups = null;
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
        var formattingContext = getTableFormattingContext(nodeContext.formattingContext);
        /** @const {!adapt.task.Frame<adapt.vtree.NodeContext>} */ var frame =
            adapt.task.newFrame("layoutEntireTable");
        frame.loopWithFrame(function(bodyFrame) {
            if (!formattingContext.caption && nodeContext.display === "table-caption") {
                formattingContext.caption = /** @type {HTMLElement} */ (nodeContext.viewNode);
            }
            column.layoutContext.nextInTree(nodeContext).then(function(positionParam) {
                nodeContext = positionParam;
                if (!nodeContext || nodeContext.sourceNode === formattingContext.tableSourceNode) {
                    bodyFrame.breakLoop();
                } else {
                    bodyFrame.continueLoop();
                }
            });
        }).then(function() {
            frame.finish(nodeContext);
        });
        return frame.result();
    };

    /**
     * Measure width of columns and normalize colgroup and col elements so that each column has
     * a corresponding col element with the width specified.
     * @param {!Element} tableElement
     * @param {!adapt.layout.Column} column
     * @returns {!DocumentFragment} A DocumentFragment containing the normalized colgroup elements.
     */
    TableLayoutProcessor.prototype.normalizeColGroups = function(tableElement, column) {
        /** @const */ var fragment = tableElement.ownerDocument.createDocumentFragment();

        // Count columns
        var columnCount = Math.max.apply(null,
            Array.from(tableElement.rows).map(function(row) {
                return Array.from(row.cells).reduce(function(sum, c) {
                    return sum + c.colSpan;
                }, 0);
            })
        );
        if (!(columnCount > 0)) {
            return fragment;
        }

        // Measure column widths
        var firstSection = tableElement.tHead || tableElement.tBodies[0] || tableElement.tFoot;
        goog.asserts.assert(firstSection);
        var dummyRow = firstSection.insertRow(-1);
        var dummyCells = [];
        for (var i = 0; i < columnCount; i++) {
            var cell = dummyRow.insertCell();
            dummyCells.push(cell);
        }
        var colWidths = dummyCells.map(function(cell) {
            return column.clientLayout.getElementClientRect(cell)["width"];
        });
        firstSection.deleteRow(-1);

        var colGroups = [];
        var cols = [];

        // Normalize colgroup and col elements
        var child = tableElement.firstElementChild;
        do {
            if (child.localName === "colgroup") {
                colGroups.push(child);
            }
        } while (child = child.nextElementSibling);
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
        // Add missing col elements for remaining columns
        if (cols.length < columnCount) {
            var colGroup = tableElement.ownerDocument.createElement("colgroup");
            var lastColGroup = colGroups[colGroups.length - 1];
            if (lastColGroup) {
                if (lastColGroup.nextSibling) {
                    lastColGroup.parentNode.insertBefore(colGroup, lastColGroup.nextSibling);
                } else {
                    lastColGroup.parentNode.appendChild(colGroup);
                }
            } else {
                firstSection.parentNode.insertBefore(colGroup, firstSection);
            }
            colGroups.push(colGroup);
            for (var i = cols.length; i < columnCount; i++) {
                var col = tableElement.ownerDocument.createElement("col");
                colGroup.appendChild(col);
                cols.push(col);
            }
        }

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
            if (!column.isOverflown(nodeContextAfter.parent.vertical ? tableBBox.left : tableBBox.bottom)) {
                frame.finish(nodeContextAfter);
                return;
            }
            formattingContext.colGroups = this.normalizeColGroups(tableElement, column);
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
        function prepend(node) {
            if (firstChild) {
                rootViewNode.insertBefore(node, firstChild);
            } else {
                rootViewNode.appendChild(node);
            }
        }
        if (formattingContext.caption) {
            prepend(formattingContext.caption);
        }
        prepend(formattingContext.colGroups.cloneNode(true));

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
        var parentIsTable = !!nodeContext.parent &&
            nodeContext.parent.formattingContext instanceof TableFormattingContext;
        var display = nodeContext.display;
        if (display === "table" ||
            (!parentIsTable && (display === "table-row" || display === "table-header-group" || display === "table-footer-group" || display === "table-row-group"))) {
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

