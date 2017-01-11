/**
 * Copyright 2016 Vivliostyle Inc.
 * @fileoverview Utilities related to layout.
 */
goog.provide("vivliostyle.repetitiveelements");

goog.require("adapt.task");
goog.require("adapt.vtree");
goog.require("vivliostyle.break");
goog.require("adapt.layout");

goog.scope(function() {

    /** @const */ var LayoutIteratorStrategy = vivliostyle.layoututil.LayoutIteratorStrategy;
    /** @const */ var LayoutIterator = vivliostyle.layoututil.LayoutIterator;
    /** @const */ var EdgeSkipper = vivliostyle.layoututil.EdgeSkipper;
    /** @const */ var EdgeBreakPosition = adapt.layout.EdgeBreakPosition;

    /**
     * @param {adapt.vtree.FormattingContext} parent
     * @param {!Element} rootSourceNode
     * @constructor
     * @implements {adapt.vtree.FormattingContext}
     */
    vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext = function(parent, rootSourceNode) {
        /** @const */ this.parent = parent;
        /** @const */ this.rootSourceNode = rootSourceNode;
        /** @type {boolean} */ this.doneInitialLayout = false;
        /** @type {boolean} */ this.isRoot = false;
        /** @type {vivliostyle.repetitiveelements.RepetitiveElements} */ this.repetitiveElements = null;
    };
    /** @const */ var RepetitiveElementsOwnerFormattingContext = vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext;

    /**
     * @override
     */
    RepetitiveElementsOwnerFormattingContext.prototype.getName = function() {
        return "Repetitive elements owner formatting context (vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext)";
    };

    /**
     * @override
     */
    RepetitiveElementsOwnerFormattingContext.prototype.isFirstTime = function(nodeContext, firstTime) {
        return firstTime;
    };

    /**
     * @override
     */
    RepetitiveElementsOwnerFormattingContext.prototype.getParent = function() {
        return this.parent;
    };

    /**
     * @return {vivliostyle.repetitiveelements.RepetitiveElements}
     */
    RepetitiveElementsOwnerFormattingContext.prototype.getRepetitiveElements = function() {
        return this.repetitiveElements;
    };

    /**
     * @param {adapt.vtree.NodeContext} nodeContext
     * @return {boolean}
     */
    RepetitiveElementsOwnerFormattingContext.prototype.isAfterContextOfRootElement = function(nodeContext) {
        return !!(nodeContext && !this.isInherited(nodeContext) && nodeContext.after);
    };

    /**
     * @param {adapt.vtree.NodeContext} position
     * @returns {Element}
     */
    RepetitiveElementsOwnerFormattingContext.prototype.getRootViewNode = function(position) {
        do {
            if (!this.isInherited(position)) {
                return /** @type {Element} */ (position.viewNode);
            }
        } while (position = position.parent);
        return null;
    };

    /**
     * @param {adapt.vtree.NodeContext} nodeContext
     * @returns {boolean}
     */
    RepetitiveElementsOwnerFormattingContext.prototype.isInherited = function(nodeContext) {
        return !!(nodeContext && nodeContext.sourceNode !== this.rootSourceNode);
    };

    /**
     * @param {boolean} vertical
     */
    RepetitiveElementsOwnerFormattingContext.prototype.initializeRepetitiveElements = function(vertical) {
        if (this.repetitiveElements) return;
        this.repetitiveElements = new RepetitiveElements(vertical);
    };

    /**
     * @param {adapt.vtree.NodeContext} nodeContext
     * @return {vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext}
     */
    RepetitiveElementsOwnerFormattingContext.prototype.findRootContext = function(nodeContext) {
        for (; nodeContext; nodeContext = nodeContext.parent) {
            var formattingContext = getRepetitiveElementsOwnerFormattingContextOrNull(nodeContext);
            if (formattingContext && !formattingContext.isInherited(nodeContext)
                && formattingContext.isRoot) {
                return formattingContext;
            }
        }
        return null;
    };

    /**
     * @constructor
     */
    vivliostyle.repetitiveelements.RepetitiveElements = function(vertical) {
        /** @private @const */ this.vertical = vertical;
        /** @private @type {Element} */ this.headerElement = null;
        /** @private @type {Element} */ this.footerElement = null;
        /** @private @type {!Array.<!Element>} */ this.headerViewNodes = [];
        /** @private @type {!Array.<!Element>} */ this.footerViewNodes = [];
        /** @private @type {number} */ this.headerHeight = 0;
        /** @private @type {number} */ this.footerHeight = 0;
        /** @type {boolean} */ this.isSkipHeader = false;
        /** @type {boolean} */ this.isSkipFooter = false;
        /** @type {boolean} */ this.enableSkippingFooter = true;
        /** @type {boolean} */ this.enableSkippingHeader = true;
    };
    /** @const */ var RepetitiveElements = vivliostyle.repetitiveelements.RepetitiveElements;

    /**
     * @param {Element} element
     */
    RepetitiveElements.prototype.setHeaderElement = function(element) {
        if (this.headerElement) return; // use first one.
        this.headerElement = element;
    };
    /**
     * @param {Element} element
     */
    RepetitiveElements.prototype.setFooterElement = function(element) {
        if (this.footerElement) return; // use first one.
        this.footerElement = element;
    };

    /**
     * @param {!adapt.vtree.ClientLayout} clientLayout
     */
    RepetitiveElements.prototype.updateHeight = function(clientLayout) {
        if (this.headerElement) {
            this.headerHeight = this.getElementHeight(this.headerElement, clientLayout);
        }
        if (this.footerElement) {
            this.footerHeight = this.getElementHeight(this.footerElement, clientLayout);
        }
    };

    /**
     * @private
     * @param {!Element} element
     * @param {!adapt.vtree.ClientLayout} clientLayout
     */
    RepetitiveElements.prototype.getElementHeight = function(element, clientLayout) {
        var rect = clientLayout.getElementClientRect(element);
        return this.vertical ? rect["width"] : rect["height"];
    };

    RepetitiveElements.prototype.prepareLayoutFragment = function() {
        this.isSkipHeader = this.isSkipFooter = false;
        this.headerViewNodes = [];
        this.footerViewNodes = [];
        this.enableSkippingFooter = true;
        this.enableSkippingHeader = true;
    };
    /**
     * @param {!Element} rootViewNode
     * @param {?Node} firstChild
     */
    RepetitiveElements.prototype.appendHeaderToFragment = function(rootViewNode, firstChild) {
        if (!this.headerElement || this.isSkipHeader) return;
        var headerViewNode = this.headerElement.cloneNode(true);
        this.headerViewNodes.push(headerViewNode);
        if (firstChild) {
            rootViewNode.insertBefore(headerViewNode, firstChild);
        } else {
            rootViewNode.appendChild(headerViewNode);
        }
    };
    /**
     * @param {!Element} rootViewNode
     * @param {?Node} firstChild
     */
    RepetitiveElements.prototype.appendFooterToFragment = function(rootViewNode, firstChild) {
        if (!this.footerElement || this.isSkipFooter) return;
        var footerViewNode = this.footerElement.cloneNode(true);
        this.footerViewNodes.push(footerViewNode);
        if (firstChild) {
            rootViewNode.insertBefore(footerViewNode, firstChild);
        } else {
            rootViewNode.appendChild(footerViewNode);
        }
    };

    /**
     * @return {number}
     */
    RepetitiveElements.prototype.calculateOffset = function() {
        return (this.isSkipFooter ? 0 : this.footerHeight)
             - (this.isSkipHeader ? this.headerHeight : 0);
    };

    /**
     * @return {boolean}
     */
    RepetitiveElements.prototype.isEnableToUpdateState = function() {
        if ((!this.isSkipFooter && this.enableSkippingFooter && this.footerElement)
          || (!this.isSkipHeader && this.enableSkippingHeader && this.headerElement)) {
            return true;
        } else {
            return false;
        }
    };

    RepetitiveElements.prototype.updateState = function() {
        if (!this.isSkipFooter && this.enableSkippingFooter && this.footerElement) {
            this.isSkipFooter = true;
        } else if (!this.isSkipHeader && this.enableSkippingHeader && this.headerElement) {
            this.isSkipHeader = true;
        }
    };

    RepetitiveElements.prototype.preventSkippingHeader = function() {
        this.isSkipHeader = false;
        this.enableSkippingHeader = false;
    };
    RepetitiveElements.prototype.preventSkippingFooter = function() {
        this.isSkipFooter = false;
        this.enableSkippingFooter = false;
    };
    RepetitiveElements.prototype.removeHeaderFromFragment = function() {
        this.headerViewNodes.forEach(function(viewNode) {
            viewNode.parentNode.removeChild(viewNode);
        });
        this.headerViewNodes = [];
    };
    RepetitiveElements.prototype.removeFooterFromFragment = function() {
        this.footerViewNodes.forEach(function(viewNode) {
            viewNode.parentNode.removeChild(viewNode);
        });
        this.footerViewNodes = [];
    };

    /**
     * @abstract
     * @param {!vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext} formattingContext
     * @constructor
     */
    vivliostyle.repetitiveelements.AbstractLayoutRetryer = function(formattingContext) {
        /** @const */ this.formattingContext = formattingContext;
        /** @type {Array.<adapt.layout.BreakPosition>} */this.initialBreakPositions = null;
    };
    /** @const */ var AbstractLayoutRetryer = vivliostyle.repetitiveelements.AbstractLayoutRetryer;

    /**
     * @param {!adapt.vtree.NodeContext} nodeContext
     * @param {!adapt.layout.Column} column
     * @returns {!adapt.task.Result.<adapt.vtree.NodeContext>}
     */
    AbstractLayoutRetryer.prototype.layout = function(nodeContext, column) {
        this.prepareLayout(nodeContext, column);
        return this.tryLayout(nodeContext, column);
    };
    /**
     * @private
     * @param {!adapt.vtree.NodeContext} nodeContext
     * @param {!adapt.layout.Column} column
     * @returns {!adapt.task.Result.<adapt.vtree.NodeContext>}
     */
    AbstractLayoutRetryer.prototype.tryLayout = function(nodeContext, column) {
        var frame = adapt.task.newFrame("vivliostyle.repetitiveelements.layout");

        this.saveState(nodeContext, column);

        var mode = this.resolveLayoutMode(nodeContext);
        mode.doLayout(nodeContext, column).then(function(positionAfter) {
            var accepted = mode.accept(positionAfter, column);
            mode.postLayout(positionAfter, column, accepted);
            if (accepted) {
                frame.finish(positionAfter);
            } else {
                goog.asserts.assert(this.initialPosition);
                this.clearNodes(this.initialPosition);
                this.restoreState(nodeContext, column);
                this.tryLayout(this.initialPosition, column).thenFinish(frame);
            }
        }.bind(this));
        return frame.result();
    };

    /**
     * @abstract
     * @param {!adapt.vtree.NodeContext} nodeContext
     * @return {vivliostyle.repetitiveelements.LayoutMode}
     */
    AbstractLayoutRetryer.prototype.resolveLayoutMode = function(nodeContext) {};

    /**
     * @param {!adapt.vtree.NodeContext} nodeContext
     * @param {!adapt.layout.Column} column
     */
    AbstractLayoutRetryer.prototype.prepareLayout = function(nodeContext, column) {
        var repetitiveElements = this.formattingContext.getRepetitiveElements();
        if (repetitiveElements) repetitiveElements.prepareLayoutFragment();
    };

    /**
     * @param {!adapt.vtree.NodeContext} initialPosition
     */
    AbstractLayoutRetryer.prototype.clearNodes = function(initialPosition) {
        var viewNode = initialPosition.viewNode || initialPosition.parent.viewNode;
        var child;
        while (child = viewNode.lastChild) {
            viewNode.removeChild(child);
        }
        var sibling;
        while (sibling = viewNode.nextSibling) {
            sibling.parentNode.removeChild(sibling);
        }
    };

    /**
     * @param {!adapt.vtree.NodeContext} nodeContext
     * @param {!adapt.layout.Column} column
     */
    AbstractLayoutRetryer.prototype.saveState = function(nodeContext, column) {
        this.initialPosition = nodeContext.copy();
        this.initialBreakPositions = [].concat(column.breakPositions);
    };

    /**
     * @param {!adapt.vtree.NodeContext} nodeContext
     * @param {!adapt.layout.Column} column
     */
    AbstractLayoutRetryer.prototype.restoreState = function(nodeContext, column) {
        column.breakPositions = this.initialBreakPositions;
    };


    /**
     * @interface
     */
    vivliostyle.repetitiveelements.LayoutMode = function() {};
    /** @const */ var LayoutMode = vivliostyle.repetitiveelements.LayoutMode;

    /**
     * @param {!adapt.vtree.NodeContext} nodeContext
     * @param {!adapt.layout.Column} column
     * @returns {!adapt.task.Result.<adapt.vtree.NodeContext>}
     */
    LayoutMode.prototype.doLayout = function(nodeContext, column) {};

    /**
     * @param {!adapt.vtree.NodeContext} nodeContext
     * @param {!adapt.layout.Column} column
     * @return {boolean}
     */
    LayoutMode.prototype.accept = function(nodeContext, column) {};

    /**
     * @param {!adapt.vtree.NodeContext} nodeContext
     * @param {!adapt.layout.Column} column
     * @param {boolean} accepted
     */
    LayoutMode.prototype.postLayout = function(nodeContext, column, accepted) {};


    /**
     * @constructor
     * @param {vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext} formattingContext
     * @implements {vivliostyle.repetitiveelements.LayoutMode}
     */
    vivliostyle.repetitiveelements.LayoutEntireBlock = function(formattingContext) {
        this.formattingContext = formattingContext;
    };
    /** @const */ var LayoutEntireBlock = vivliostyle.repetitiveelements.LayoutEntireBlock;

    /**
     * @override
     */
    LayoutEntireBlock.prototype.doLayout = function(nodeContext, column) {};

    /**
     * @override
     */
    LayoutEntireBlock.prototype.accept = function(nodeContext, column) {
        return !!nodeContext;
    };

    /**
     * @override
     */
    LayoutEntireBlock.prototype.postLayout = function(nodeContext, column, accepted) {
        var repetitiveElements = this.formattingContext.getRepetitiveElements();
        if (repetitiveElements) {
            goog.asserts.assert(column.clientLayout);
            repetitiveElements.updateHeight(column.clientLayout);
        }
        this.formattingContext.doneInitialLayout = true;
    };

    /**
     * @constructor
     * @param {vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext} formattingContext
     * @implements {vivliostyle.repetitiveelements.LayoutMode}
     */
    vivliostyle.repetitiveelements.LayoutFragmentedBlock = function(formattingContext) {
        this.formattingContext = formattingContext;
    };
    /** @const */ var LayoutFragmentedBlock = vivliostyle.repetitiveelements.LayoutFragmentedBlock;

    /**
     * @override
     */
    LayoutFragmentedBlock.prototype.doLayout = function(nodeContext, column) {};

    /**
     * @param {!adapt.vtree.NodeContext} nodeContext
     */
    LayoutFragmentedBlock.prototype.addHeadersToAncestors = function(nodeContext) {
        for (var nc = nodeContext; nc; nc = nc.parent) {
            var formattingContext = getRepetitiveElementsOwnerFormattingContextOrNull(nc);
            if (formattingContext && !formattingContext.isInherited(nc)) {
                this.appendHeader(formattingContext, nc);
            }
        }
    };

    /**
     * @private
     */
    LayoutFragmentedBlock.prototype.appendHeader = function(formattingContext, nodeContext) {
        var repetitiveElements = formattingContext.getRepetitiveElements();
        if (repetitiveElements) {
            var rootViewNode = formattingContext.getRootViewNode(nodeContext);
            var firstChild = rootViewNode.firstChild;
            repetitiveElements.appendHeaderToFragment(rootViewNode, firstChild);
        }
    };

    /**
     * @override
     */
    LayoutFragmentedBlock.prototype.accept = function(nodeContext, column) {
        var repetitiveElements = this.formattingContext.getRepetitiveElements();
        if (!repetitiveElements) return true;

        var breakPosition = column.findAcceptableBreakPosition();

        if (this.formattingContext.isAfterContextOfRootElement(nodeContext)
            && repetitiveElements.isSkipFooter) {
            repetitiveElements.preventSkippingFooter();
            return false;
        }

        if (!repetitiveElements.isEnableToUpdateState()) return true;
        return !!(breakPosition.nodeContext) && !breakPosition.nodeContext.overflow;
    };

    /**
     * @override
     */
    LayoutFragmentedBlock.prototype.postLayout = function(nodeContext, column, accepted) {
        var repetitiveElements = this.formattingContext.getRepetitiveElements();
        if (!repetitiveElements) return;
        if (!accepted) {
            repetitiveElements.removeHeaderFromFragment();
            repetitiveElements.removeFooterFromFragment();
            repetitiveElements.updateState();
        }
    };

    /**
     * @constructor
     * @param {!vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext} formattingContext
     * @param {!vivliostyle.repetitiveelements.RepetitiveElementsOwnerLayoutProcessor} processor
     * @extends {vivliostyle.repetitiveelements.LayoutEntireBlock}
     */
    vivliostyle.repetitiveelements.LayoutEntireOwnerBlock = function(formattingContext, processor) {
        vivliostyle.repetitiveelements.LayoutEntireBlock.call(this, formattingContext);
        /** @const */ this.processor = processor;
    };
    /** @const */ var LayoutEntireOwnerBlock = vivliostyle.repetitiveelements.LayoutEntireOwnerBlock;
    goog.inherits(LayoutEntireOwnerBlock, vivliostyle.repetitiveelements.LayoutEntireBlock);

    /**
     * @override
     */
    LayoutEntireOwnerBlock.prototype.doLayout = function(nodeContext, column) {
        vivliostyle.repetitiveelements.LayoutEntireBlock.prototype.doLayout.call(this, nodeContext, column);
        return this.processor.doInitialLayout(nodeContext, column);
    };


    /**
     * @constructor
     * @param {!vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext} formattingContext
     * @param {!vivliostyle.repetitiveelements.RepetitiveElementsOwnerLayoutProcessor} processor
     * @extends {vivliostyle.repetitiveelements.LayoutFragmentedBlock}
     */
    vivliostyle.repetitiveelements.LayoutFragmentedOwnerBlock = function(formattingContext, processor) {
        vivliostyle.repetitiveelements.LayoutFragmentedBlock.call(this, formattingContext);
        /** @const */ this.processor = processor;
    };
    /** @const */ var LayoutFragmentedOwnerBlock = vivliostyle.repetitiveelements.LayoutFragmentedOwnerBlock;
    goog.inherits(LayoutFragmentedOwnerBlock, vivliostyle.repetitiveelements.LayoutFragmentedBlock);

    /**
     * @override
     */
    LayoutFragmentedOwnerBlock.prototype.doLayout = function(nodeContext, column) {
        LayoutFragmentedBlock.prototype.addHeadersToAncestors.call(this, nodeContext);
        return this.processor.doLayout(nodeContext, column);
    };


    /**
     * @constructor
     * @param {!vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext} formattingContext
     * @param {!vivliostyle.repetitiveelements.RepetitiveElementsOwnerLayoutProcessor} processor
     * @extends {vivliostyle.repetitiveelements.AbstractLayoutRetryer}
     */
    vivliostyle.repetitiveelements.RepetitiveElementsOwnerLayoutRetryer = function(formattingContext, processor) {
        vivliostyle.repetitiveelements.AbstractLayoutRetryer.call(this, formattingContext);
        /** @private @const */ this.processor = processor;
    };
    /** @const */ var RepetitiveElementsOwnerLayoutRetryer = vivliostyle.repetitiveelements.RepetitiveElementsOwnerLayoutRetryer;
    goog.inherits(RepetitiveElementsOwnerLayoutRetryer, vivliostyle.repetitiveelements.AbstractLayoutRetryer);

    /**
     * @override
     */
    RepetitiveElementsOwnerLayoutRetryer.prototype.resolveLayoutMode = function(nodeContext) {
        if (!this.formattingContext.doneInitialLayout) {
            return new LayoutEntireOwnerBlock(this.formattingContext, this.processor);
        } else {
            var repetitiveElements = this.formattingContext.getRepetitiveElements();
            if (!this.formattingContext.isInherited(nodeContext) && !nodeContext.after) {
                if (repetitiveElements) repetitiveElements.preventSkippingHeader();
            }
            return new LayoutFragmentedOwnerBlock(this.formattingContext, this.processor);
        }
    };

    /**
     * @param {!vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext} formattingContext
     * @param {!adapt.layout.Column} column
     * @constructor
     * @extends {vivliostyle.layoututil.LayoutIteratorStrategy}
     */
    vivliostyle.repetitiveelements.EntireBlockLayoutStrategy = function(formattingContext, column) {
        /** @const */ this.formattingContext = formattingContext;
        /** @const */ this.column = column;
    };
    /** @const */ var EntireBlockLayoutStrategy = vivliostyle.repetitiveelements.EntireBlockLayoutStrategy;
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
     * @param {!vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext} formattingContext
     * @param {!adapt.layout.Column} column
     * @constructor
     * @extends {vivliostyle.layoututil.EdgeSkipper}
     */
    vivliostyle.repetitiveelements.FragmentedBlockLayoutStrategy = function(formattingContext, column) {
        /** @const */ this.formattingContext = formattingContext;
        /** @const */ this.column = column;
    };
    /** @const */ var FragmentedBlockLayoutStrategy = vivliostyle.repetitiveelements.FragmentedBlockLayoutStrategy;
    goog.inherits(FragmentedBlockLayoutStrategy, vivliostyle.layoututil.EdgeSkipper);

    /**
     * @param {!vivliostyle.layoututil.LayoutIteratorState} state
     * @return {undefined|adapt.task.Result<boolean>}
     */
    FragmentedBlockLayoutStrategy.prototype.afterNonInlineElementNode = function(state) {
        var nodeContext = state.nodeContext;
        if (nodeContext.repeatOnBreak === "header" || nodeContext.repeatOnBreak === "footer") {
            nodeContext.viewNode.parentNode.removeChild(nodeContext.viewNode);
            return adapt.task.newResult(true);
        } else {
            return EdgeSkipper.prototype.afterNonInlineElementNode.call(this, state);
        }
    };

    /**
     * @constructor
     * @implements {adapt.layout.LayoutProcessor}
     * @extends {adapt.layout.BlockLayoutProcessor}
     */
    vivliostyle.repetitiveelements.RepetitiveElementsOwnerLayoutProcessor = function() {};
    /** @const */ var RepetitiveElementsOwnerLayoutProcessor = vivliostyle.repetitiveelements.RepetitiveElementsOwnerLayoutProcessor;
    goog.inherits(RepetitiveElementsOwnerLayoutProcessor, adapt.layout.BlockLayoutProcessor);

    /**
     * @override
     */
    RepetitiveElementsOwnerLayoutProcessor.prototype.layout = function(nodeContext, column) {
        var formattingContext = getRepetitiveElementsOwnerFormattingContext(nodeContext.formattingContext);
        if (!formattingContext.findRootContext(nodeContext)) {
            return new RepetitiveElementsOwnerLayoutRetryer(formattingContext, this).layout(nodeContext, column);
        } else {
            return adapt.layout.BlockLayoutProcessor.prototype.layout.call(this, nodeContext, column);
        }
    };

    /**
     * @override
     */
    RepetitiveElementsOwnerLayoutProcessor.prototype.afterNonInlineElementNode = function(nodeContext) {
        var formattingContext = getRepetitiveElementsOwnerFormattingContextOrNull(nodeContext);
        if (nodeContext.repeatOnBreak === "header" || nodeContext.repeatOnBreak === "footer") {
            nodeContext.viewNode.parentNode.removeChild(nodeContext.viewNode);
            return true;
        } else if (formattingContext && !formattingContext.isInherited(nodeContext)) {
            this.appendFooter(formattingContext, nodeContext);
            return false;
        } else {
            return false;
        }
    };


    /**
     * @param {!adapt.vtree.NodeContext} nodeContext
     * @param {!adapt.layout.Column} column
     * @returns {!adapt.task.Result.<adapt.vtree.NodeContext>}
     */
    RepetitiveElementsOwnerLayoutProcessor.prototype.doInitialLayout = function(nodeContext, column) {
        var formattingContext = getRepetitiveElementsOwnerFormattingContext(nodeContext.formattingContext);
        var repetitiveElements = formattingContext.getRepetitiveElements();
        var frame = adapt.task.newFrame("BlockLayoutProcessor.doInitialLayout");
        this.layoutEntireBlock(nodeContext, column).then(function(nodeContextAfter) {
            goog.asserts.assert(column.clientLayout);
            if (repetitiveElements) repetitiveElements.updateHeight(column.clientLayout);
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
    RepetitiveElementsOwnerLayoutProcessor.prototype.layoutEntireBlock = function(nodeContext, column) {
        var formattingContext = getRepetitiveElementsOwnerFormattingContext(nodeContext.formattingContext);
        /** @const */ var strategy = new EntireBlockLayoutStrategy(formattingContext, column);
        /** @const */ var iterator = new LayoutIterator(strategy, column.layoutContext);
        return iterator.iterate(nodeContext);
    };

    RepetitiveElementsOwnerLayoutProcessor.prototype.doLayout = function(nodeContext, column) {
        var formattingContext = getRepetitiveElementsOwnerFormattingContext(nodeContext.formattingContext);
        formattingContext.isRoot = true;

        /** @type {!adapt.task.Frame.<adapt.vtree.NodeContext>} */ var frame =
            adapt.task.newFrame("RepetitiveElementsOwnerLayoutProcessor.doLayout");
        frame.loopWithFrame(function(loopFrame) {
            while (nodeContext) {
                var pending = true;
                column.layoutNext(nodeContext, false).then(function(nodeContextParam) {
                    nodeContext = nodeContextParam;
                    if (column.hasNewlyAddedPageFloats()) {
                        loopFrame.breakLoop();
                        return;
                    }
                    if (column.pageBreakType) {
                        loopFrame.breakLoop();
                    } else if (nodeContext && column.stopByOverflow(nodeContext)) {
                        loopFrame.breakLoop();
                    } else {
                        if (pending) {
                            pending = false;
                        } else {
                            loopFrame.continueLoop();
                        }
                    }
                });
                if (pending) {
                    pending = false;
                    return;
                }
            }
            loopFrame.breakLoop();
        }).then(function() {
            formattingContext.isRoot = false;
            frame.finish(nodeContext);
        });
        return frame.result();
    };

    /**
     * @override
     */
    RepetitiveElementsOwnerLayoutProcessor.prototype.finishBreak = function(column, nodeContext, forceRemoveSelf, endOfRegion) {
        /** @type {!adapt.task.Frame.<boolean>} */ var frame =
            adapt.task.newFrame("RepetitiveElementsOwnerLayoutProcessor.finishBreak");
        adapt.layout.BlockLayoutProcessor.prototype.finishBreak.call(
            this, column, nodeContext, forceRemoveSelf, endOfRegion).then(function(result) {
                for (var nc = nodeContext; nc; nc = nc.parent) {
                    var formattingContext = getRepetitiveElementsOwnerFormattingContextOrNull(nc);
                    if (formattingContext && !formattingContext.isInherited(nc)) {
                        this.appendFooter(formattingContext, nc);
                    }
                }
                frame.finish(result);
            }.bind(this));
        return frame.result();
    };

    /**
     * @private
     */
    RepetitiveElementsOwnerLayoutProcessor.prototype.appendFooter = function(formattingContext, nodeContext) {
        var repetitiveElements = formattingContext.getRepetitiveElements();
        if (repetitiveElements) {
            if (!repetitiveElements.isSkipFooter) {
                var rootViewNode = formattingContext.getRootViewNode(nodeContext);
                repetitiveElements.appendFooterToFragment(rootViewNode, null);
            }
        }
    };


    /**
     * @param {adapt.vtree.NodeContext} nodeContext
     * @return {vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext}
     */
    function getRepetitiveElementsOwnerFormattingContextOrNull(nodeContext) {
        var formattingContext = nodeContext.formattingContext;
        if (!formattingContext) return null;
        if (!(formattingContext instanceof RepetitiveElementsOwnerFormattingContext)) return null;
        return /** @type {vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext} */ (formattingContext);
    };

    /**
     * @private
     * @param {adapt.vtree.FormattingContext} formattingContext
     * @returns {!vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext}
     */
    function getRepetitiveElementsOwnerFormattingContext(formattingContext) {
        goog.asserts.assert(formattingContext instanceof RepetitiveElementsOwnerFormattingContext);
        return /** @type {!vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext} */ (formattingContext);
    }

    /**
     * @const
     */
    var layoutProcessor = new RepetitiveElementsOwnerLayoutProcessor();

    vivliostyle.plugin.registerHook(vivliostyle.plugin.HOOKS.RESOLVE_LAYOUT_PROCESSOR, function(formattingContext) {
        if (formattingContext instanceof RepetitiveElementsOwnerFormattingContext) {
            return layoutProcessor;
        }
        return null;
    });

});
