/**
 * Copyright 2016 Vivliostyle Inc.
 * @fileoverview block formatting context and layout.
 */
goog.provide("vivliostyle.bfc");

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
    /** @const */ var EdgeBreakPosition = adapt.layout.EdgeBreakPosition;

    /**
     * @param {adapt.vtree.FormattingContext} parent
     * @constructor
     * @implements {adapt.vtree.FormattingContext}
     */
    vivliostyle.bfc.BlockFormattingContext = function(parent) {
        /** @private @const */ this.parent = parent;
        /** @type {Element} */ this.element = null;
    };
    /** @const */ var BlockFormattingContext = vivliostyle.bfc.BlockFormattingContext;

    /**
     * @override
     */
    BlockFormattingContext.prototype.getName = function() {
        return "Block formatting context (adapt.layout.BlockFormattingContext)";
    };

    /**
     * @override
     */
    BlockFormattingContext.prototype.isFirstTime = function(nodeContext, firstTime) {
        return firstTime;
    };

    /**
     * @override
     */
    BlockFormattingContext.prototype.getParent = function() {
        return this.parent;
    };

    /**
     * @override
     */
    BlockFormattingContext.prototype.getRepetitiveElements = function() {
        return this.repetitiveElements;
    };

    BlockFormattingContext.prototype.initializeRepetitiveElements = function(vertical) {
        if (this.repetitiveElements) return;
        this.repetitiveElements = new vivliostyle.layoututil.RepetitiveElements(vertical);
    };

    /**
     * @param {adapt.vtree.NodeContext} position
     * @returns {Element}
     */
    BlockFormattingContext.prototype.getRootViewNode = function(position) {
        do {
            if (position.formattingContext
                && position.formattingContext.getRepetitiveElements()) {
                return /** @type {Element} */ (position.viewNode);
            }
        } while (position = position.parent);
        return null;
    };

    /**
     * @param {!vivliostyle.bfc.BlockFormattingContext} formattingContext
     * @param {!adapt.layout.Column} column
     * @constructor
     * @extends {vivliostyle.layoututil.LayoutIteratorStrategy}
     */
    vivliostyle.bfc.EntireBlockLayoutStrategy = function(formattingContext, column) {
        /** @const */ this.formattingContext = formattingContext;
        /** @const */ this.column = column;
    };
    /** @const */ var EntireBlockLayoutStrategy = vivliostyle.bfc.EntireBlockLayoutStrategy;
    goog.inherits(EntireBlockLayoutStrategy, LayoutIteratorStrategy);

    /**
     * @override
     */
    EntireBlockLayoutStrategy.prototype.startNonInlineElementNode = function(state) {
        /** @const */ var formattingContext = this.formattingContext;
        /** @const */ var nodeContext = state.nodeContext;
        switch (nodeContext.repeatOnBreak) {
            case "header":
                formattingContext.repetitiveElements.setHeaderElement(/** @type {!Element} */ (nodeContext.viewNode));
                break;
            case "footer":
                formattingContext.repetitiveElements.setFooterElement(/** @type {!Element} */ (nodeContext.viewNode));
                break;
        }
        return adapt.task.newResult(true);
    };

    /**
     * @constructor
     * @implements {adapt.layout.LayoutProcessor}
     */
    vivliostyle.bfc.BlockLayoutProcessor = function() {};

    /** @const */ var BlockLayoutProcessor = vivliostyle.bfc.BlockLayoutProcessor;

    /**
     * @override
     */
    BlockLayoutProcessor.prototype.layout = function(nodeContext, column) {
        var formattingContext = getBlockFormattingContext(nodeContext.formattingContext);
        var frame = adapt.task.newFrame("BlockLayoutProcessor.layout");
        if (formattingContext.getRepetitiveElements() && !formattingContext.doneInitialLayout) {
            var initialPosition = nodeContext.copy();
            this.doInitialLayout(nodeContext, column).then(function(positionAfter) {
                formattingContext.doneInitialLayout = true;
                var tableViewNode = initialPosition.viewNode;
                var child;
                while (child = tableViewNode.lastChild) {
                    tableViewNode.removeChild(child);
                }
                this.doLayout(initialPosition, column).thenFinish(frame);
            }.bind(this));
        } else {
            this.doLayout(nodeContext, column).thenFinish(frame);
        }
        return frame.result();
    };

    /**
     * @param {!adapt.vtree.NodeContext} nodeContext
     * @param {!adapt.layout.Column} column
     * @returns {!adapt.task.Result.<adapt.vtree.NodeContext>}
     */
    BlockLayoutProcessor.prototype.doInitialLayout = function(nodeContext, column) {
        var formattingContext = getBlockFormattingContext(nodeContext.formattingContext);
        var frame = adapt.task.newFrame("BlockLayoutProcessor.doInitialLayout");
        this.layoutEntireBlock(nodeContext, column).then(function(nodeContextAfter) {
            formattingContext.repetitiveElements.updateHeight(column.clientLayout);
            frame.finish(null);
        });
        return frame.result();
    };

    /**
     * @private
     * @param {adapt.vtree.NodeContext} nodeContext
     * @param {!adapt.layout.Column} column
     * @returns {!adapt.task.Result.<adapt.vtree.NodeContext>}
     */
    BlockLayoutProcessor.prototype.layoutEntireBlock = function(nodeContext, column) {
        var formattingContext = getBlockFormattingContext(nodeContext.formattingContext);
        /** @const */ var strategy = new EntireBlockLayoutStrategy(formattingContext, column);
        /** @const */ var iterator = new LayoutIterator(strategy, column.layoutContext);
        return iterator.iterate(nodeContext);
    };


    BlockLayoutProcessor.prototype.doLayout = function(nodeContext, column) {
        var formattingContext = getBlockFormattingContext(nodeContext.formattingContext);
        if (formattingContext) {
            var repetitiveElements = formattingContext.getRepetitiveElements();
            if (repetitiveElements) {
                var rootViewNode = formattingContext.getRootViewNode(nodeContext);
                var firstChild = rootViewNode.firstChild;
                repetitiveElements.prepareLayoutFragment();
                repetitiveElements.appendHeaderToFragment(rootViewNode, firstChild);
            }
        }
        if (nodeContext.floatSide) {
            // TODO: implement floats and footnotes properly for vertical writing
            return column.layoutFloatOrFootnote(nodeContext);
        } else if (column.isBreakable(nodeContext)) {
            return column.layoutBreakableBlock(nodeContext);
        } else {
            return column.layoutUnbreakable(nodeContext);
        }
    };

    /**
     * @override
     */
    BlockLayoutProcessor.prototype.createEdgeBreakPosition = function(
        position, breakOnEdge, overflows, columnBlockSize) {
        return new adapt.layout.EdgeBreakPosition(position.copy(), breakOnEdge, overflows, columnBlockSize);
    };

    /**
     * @param {!adapt.layout.Column} column
     * @param {adapt.vtree.NodeContext} nodeContext
     * @param {boolean} forceRemoveSelf
     * @param {boolean} endOfRegion
     * @return {!adapt.task.Result.<boolean>} holing true
     * @override
     */
    BlockLayoutProcessor.prototype.finishBreak = function(column, nodeContext, forceRemoveSelf, endOfRegion) {
        var formattingContext = getBlockFormattingContext(nodeContext.formattingContext);
        if (formattingContext) {
            var repetitiveElements = formattingContext.getRepetitiveElements();
            if (repetitiveElements) {
                if (!repetitiveElements.isSkipFooter) {
                    var rootViewNode = formattingContext.getRootViewNode(nodeContext);
                    repetitiveElements.appendFooterToFragment(rootViewNode, null);
                }
            }
        }
        var removeSelf = forceRemoveSelf || (nodeContext.viewNode != null && nodeContext.viewNode.nodeType == 1 && !nodeContext.after);
        column.clearOverflownViewNodes(nodeContext, removeSelf);
        if (endOfRegion) {
            column.fixJustificationIfNeeded(nodeContext, true);
            column.layoutContext.processFragmentedBlockEdge(removeSelf ? nodeContext : nodeContext.parent);
        }
        return column.clearFootnotes(nodeContext.boxOffset);
    };

    /**
     * @const
     */
    vivliostyle.bfc.blockLayoutProcessor = new BlockLayoutProcessor();


    /**
     * @private
     * @param {adapt.vtree.FormattingContext} formattingContext
     * @returns {vivliostyle.bfc.BlockFormattingContext}
     */
    function getBlockFormattingContext(formattingContext) {
        if (formattingContext instanceof BlockFormattingContext) {
            return /** @type {vivliostyle.bfc.BlockFormattingContext} */ (formattingContext);
        } else {
            return null;
        }
    }

    vivliostyle.plugin.registerHook(vivliostyle.plugin.HOOKS.RESOLVE_FORMATTING_CONTEXT,
        function(nodeContext, firstTime, display, position, floatSide, isRoot) {
            var parent = nodeContext.parent;
            if (!parent && nodeContext.formattingContext) {
                return null;
            } else if (parent && nodeContext.formattingContext !== parent.formattingContext) {
                return null;
            } else if (nodeContext.establishesBFC ||
                (!nodeContext.formattingContext && vivliostyle.display.isBlock(display, position, floatSide, isRoot))) {
                return new BlockFormattingContext(parent ? parent.formattingContext : null);
            } else {
                return null;
            }
        }
    );

    vivliostyle.plugin.registerHook(vivliostyle.plugin.HOOKS.RESOLVE_LAYOUT_PROCESSOR, function(formattingContext) {
        if (formattingContext instanceof BlockFormattingContext) {
            return vivliostyle.bfc.blockLayoutProcessor;
        }
        return null;
    });

});
