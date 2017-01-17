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
        if (nodeContext && !this.isInherited(nodeContext) && nodeContext.after) return true;
        for (; nodeContext; nodeContext = nodeContext.parent) {
            if (this.isInherited(nodeContext)) {
                return false;
            }
        }
        return true;
    };

    /**
     * @param {adapt.vtree.NodeContext} position
     * @returns {Element}
     */
    RepetitiveElementsOwnerFormattingContext.prototype.getRootViewNode = function(position) {
        var root = this.getRootNodeContext(position);
        return root ? /** @type {Element} */ (root.viewNode) : null;
    };

    /**
     * @param {adapt.vtree.NodeContext} nodeContext
     * @returns {adapt.vtree.NodeContext}
     */
    RepetitiveElementsOwnerFormattingContext.prototype.getRootNodeContext = function(nodeContext) {
        do {
            if (!this.isInherited(nodeContext)) {
                return nodeContext;
            }
        } while (nodeContext = nodeContext.parent);
        return null;
    };

    /**
     * @param {adapt.vtree.NodeContext} nodeContext
     * @returns {boolean}
     */
    RepetitiveElementsOwnerFormattingContext.prototype.isInherited = function(nodeContext) {
        return !!(nodeContext
          && nodeContext.formattingContext === this
          && nodeContext.sourceNode !== this.rootSourceNode);
    };

    /**
     * @param {boolean} vertical
     */
    RepetitiveElementsOwnerFormattingContext.prototype.initializeRepetitiveElements = function(vertical) {
        if (this.repetitiveElements) return;
        var found = repetitiveElementsCache.some(function(entry) {
            if (entry.root === this.rootSourceNode) {
                this.repetitiveElements = entry.elements;
                return true;
            }
            return false;
        }.bind(this));
        if (!found) {
            this.repetitiveElements = new RepetitiveElements(vertical);
            repetitiveElementsCache.push({
                root: this.rootSourceNode,
                elements: this.repetitiveElements
            });
        }
    };

    /** @override */
    RepetitiveElementsOwnerFormattingContext.prototype.saveState = function() {};

    /** @override */
    RepetitiveElementsOwnerFormattingContext.prototype.restoreState = function(state) {};

    /** @type {Array.<{root:Element, elements:vivliostyle.repetitiveelements.RepetitiveElements}>} */
    var repetitiveElementsCache = [];

    vivliostyle.repetitiveelements.clearCache = function() {
        repetitiveElementsCache = [];
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
     * @param {!Element} element
     */
    RepetitiveElements.prototype.setHeaderElement = function(element) {
        if (this.headerElement) return; // use first one.
        this.headerElement = element;
        this.headerViewNodes.push(element);
    };
    /**
     * @param {!Element} element
     */
    RepetitiveElements.prototype.setFooterElement = function(element) {
        if (this.footerElement) return; // use first one.
        this.footerElement = element;
        this.footerViewNodes.push(element);
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
        if (!this.headerElement || this.isSkipHeader || this.headerViewNodes.length > 0) return;
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
        if (!this.footerElement || this.isSkipFooter  || this.footerViewNodes.length > 0) return;
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
            if (viewNode.parentNode) viewNode.parentNode.removeChild(viewNode);
        });
        this.headerViewNodes = [];
    };
    RepetitiveElements.prototype.removeFooterFromFragment = function() {
        this.footerViewNodes.forEach(function(viewNode) {
            if (viewNode.parentNode) viewNode.parentNode.removeChild(viewNode);
        });
        this.footerViewNodes = [];
    };

    /**
     * @param {Node} node
     * @return {boolean}
     */
    RepetitiveElements.prototype.isHeaderViewNode = function(node) {
        return this.headerViewNodes.some(function(viewNode) {
            return viewNode === node;
        });
    };

    /**
     * @param {Node} node
     * @return {boolean}
     */
    RepetitiveElements.prototype.isFooterViewNode = function(node) {
        return this.footerViewNodes.some(function(viewNode) {
            return viewNode === node;
        });
    };

    /**
     * @constructor
     * @param {vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext} formattingContext
     * @implements {vivliostyle.layoututil.LayoutMode}
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
    LayoutEntireBlock.prototype.postLayout = function(positionAfter, initialPosition, column, accepted) {
        var repetitiveElements = this.formattingContext.getRepetitiveElements();
        if (repetitiveElements) {
            goog.asserts.assert(column.clientLayout);
            repetitiveElements.updateHeight(column.clientLayout);
        }
        this.formattingContext.doneInitialLayout = true;
        if (!accepted) {
            repetitiveElements.removeHeaderFromFragment();
            repetitiveElements.removeFooterFromFragment();
        }
    };

    /**
     * @constructor
     * @param {vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext} formattingContext
     * @implements {vivliostyle.layoututil.LayoutMode}
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
     * @override
     */
    LayoutFragmentedBlock.prototype.accept = function(nodeContext, column) {
        return true;
    };

    /**
     * @override
     */
    LayoutFragmentedBlock.prototype.postLayout = function(positionAfter, initialPosition, column, accepted) {};

    /**
     * @param {!adapt.vtree.NodeContext} nodeContext
     */
    LayoutFragmentedBlock.prototype.appendHeaders = function(nodeContext) {
        if (!this.formattingContext.isInherited(nodeContext)) {
            appendHeader(this.formattingContext, nodeContext);
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
        LayoutEntireBlock.prototype.doLayout.call(this, nodeContext, column);
        return this.processor.doInitialLayout(nodeContext, column);
    };

    /**
     * @override
     */
    LayoutEntireOwnerBlock.prototype.accept = function(nodeContext, column) {
        return false;
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
        LayoutFragmentedBlock.prototype.appendHeaders.call(this, nodeContext);
        column.fragmentLayoutConstraints.unshift(
          new RepetitiveElementsOwnerLayoutConstraint(nodeContext));
        return this.processor.doLayout(nodeContext, column);
    };


    /**
     * @constructor
     * @param {!adapt.vtree.NodeContext} nodeContext
     * @implements {adapt.layout.FragmentLayoutConstraint}
     */
    vivliostyle.repetitiveelements.RepetitiveElementsOwnerLayoutConstraint = function(nodeContext) {
        var formattingContext = getRepetitiveElementsOwnerFormattingContext(nodeContext.formattingContext);
        this.nodeContext = formattingContext.getRootNodeContext(nodeContext);
    };
    /** @const */ var RepetitiveElementsOwnerLayoutConstraint = vivliostyle.repetitiveelements.RepetitiveElementsOwnerLayoutConstraint;

    /** @override */
    RepetitiveElementsOwnerLayoutConstraint.prototype.allowLayout = function(nodeContext, column) {
        var formattingContext = getRepetitiveElementsOwnerFormattingContext(this.nodeContext.formattingContext);
        var repetitiveElements = this.getRepetitiveElements();
        if (!repetitiveElements) return true;

        if (adapt.layout.isOrphan(this.nodeContext.viewNode)) return true;

        if (formattingContext.isAfterContextOfRootElement(nodeContext)) {
            repetitiveElements.preventSkippingFooter();
            vivliostyle.repetitiveelements.appendFooter(formattingContext, this.nodeContext);
        }

        if (!repetitiveElements.isEnableToUpdateState()) return true;

        if ((nodeContext && nodeContext.overflow) || !this.isContentExist(repetitiveElements)) {
            return false;
        } else {
            return true;
        }
    };

    /** @override */
    RepetitiveElementsOwnerLayoutConstraint.prototype.nextCandidate = function(nodeContext) {
        var repetitiveElements = this.getRepetitiveElements();
        if (!repetitiveElements) return false;
        if (repetitiveElements.isEnableToUpdateState()) {
            repetitiveElements.updateState();
            return true;
        } else {
            return false;
        }
    };

    /** @override */
    RepetitiveElementsOwnerLayoutConstraint.prototype.postLayout = function(allowed) {
        var repetitiveElements = this.getRepetitiveElements();
        if (!repetitiveElements) return;
        if (allowed) {
            repetitiveElements.prepareLayoutFragment();
        } else {
            repetitiveElements.removeHeaderFromFragment();
            repetitiveElements.removeFooterFromFragment();
        }
    };

    RepetitiveElementsOwnerLayoutConstraint.prototype.getRepetitiveElements = function() {
        var formattingContext = getRepetitiveElementsOwnerFormattingContext(this.nodeContext.formattingContext);
        return formattingContext.getRepetitiveElements();
    };

    /**
     * @private
     * @param {!vivliostyle.repetitiveelements.RepetitiveElements} repetitiveElements
     * @return {boolean}
     */
    RepetitiveElementsOwnerLayoutConstraint.prototype.isContentExist = function(repetitiveElements) {
        for (var child = this.nodeContext.viewNode.firstChild; child; child = child.nextSibling) {
            if (child.nodeType === 1) {
                return true;
            } else {
                if (!repetitiveElements.isHeaderViewNode(child)
                  && !repetitiveElements.isFooterViewNode(child)) {
                    return true;
                }
            }
        }
        return false;
    };


    /**
     * @constructor
     * @param {!vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext} formattingContext
     * @param {!vivliostyle.repetitiveelements.RepetitiveElementsOwnerLayoutProcessor} processor
     * @extends {vivliostyle.layoututil.AbstractLayoutRetryer}
     */
    vivliostyle.repetitiveelements.RepetitiveElementsOwnerLayoutRetryer = function(formattingContext, processor) {
        vivliostyle.layoututil.AbstractLayoutRetryer.call(this);
        /** @const */ this.formattingContext = formattingContext;
        /** @private @const */ this.processor = processor;
    };
    /** @const */ var RepetitiveElementsOwnerLayoutRetryer = vivliostyle.repetitiveelements.RepetitiveElementsOwnerLayoutRetryer;
    goog.inherits(RepetitiveElementsOwnerLayoutRetryer, vivliostyle.layoututil.AbstractLayoutRetryer);

    /**
     * @override
     */
    RepetitiveElementsOwnerLayoutRetryer.prototype.resolveLayoutMode = function(nodeContext) {
        if (!this.formattingContext.isInherited(nodeContext)
          && !this.formattingContext.doneInitialLayout) {
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
        if (!formattingContext.isInherited(nodeContext)) {
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
            if (nodeContext.viewNode.parentNode) nodeContext.viewNode.parentNode.removeChild(nodeContext.viewNode); //TODO
            return true;
        } else if (formattingContext && !formattingContext.isInherited(nodeContext)) {
            appendFooter(formattingContext, nodeContext);
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

    /**
     * @private
     * @param {adapt.vtree.NodeContext} nodeContext
     * @param {!adapt.layout.Column} column
     * @returns {!adapt.task.Result.<adapt.vtree.NodeContext>}
     */
    RepetitiveElementsOwnerLayoutProcessor.prototype.doLayout = function(nodeContext, column) {
        var formattingContext = getRepetitiveElementsOwnerFormattingContext(nodeContext.formattingContext);
        return adapt.layout.BlockLayoutProcessor.prototype.layout.call(this, nodeContext, column);
    };

    /**
     * @override
     */
    RepetitiveElementsOwnerLayoutProcessor.prototype.finishBreak = function(column, nodeContext, forceRemoveSelf, endOfRegion) {
        var formattingContext = getRepetitiveElementsOwnerFormattingContext(nodeContext.formattingContext);

        /** @type {!adapt.task.Frame.<boolean>} */ var frame =
            adapt.task.newFrame("RepetitiveElementsOwnerLayoutProcessor.finishBreak");
        adapt.layout.BlockLayoutProcessor.prototype.finishBreak.call(
            this, column, nodeContext, forceRemoveSelf, endOfRegion).then(function(result) {
                if (nodeContext) appendFooter(formattingContext, nodeContext);
                frame.finish(result);
            });
        return frame.result();
    };

    /**
     * @param {adapt.vtree.NodeContext} nodeContext
     * @param {function(vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext)} callback
     */
    function eachAncestorRepetitiveElementsOwnerFormattingContext(nodeContext, callback) {
        adapt.vtree.eachAncestorFormattingContext(nodeContext, function(formattingContext) {
            if (formattingContext && formattingContext instanceof RepetitiveElementsOwnerFormattingContext) {
                callback(/** @type {RepetitiveElementsOwnerFormattingContext} */ (formattingContext));
            }
        });
    };

    /**
     * @param {adapt.vtree.NodeContext} nodeContext
     * @param {!function(!vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext, !adapt.vtree.NodeContext)} callback
     */
    function eachAncestorNodeContext(nodeContext, callback) {
        for (var nc = nodeContext; nc; nc = nc.parent) {
            var formattingContext = nc.formattingContext;
            if (formattingContext
              && formattingContext instanceof RepetitiveElementsOwnerFormattingContext
              && !formattingContext.isInherited(nc)) {
                callback(formattingContext, nc);
            }
        }
    };


    /**
     * @param {adapt.vtree.NodeContext} nodeContext
     * @param {!adapt.layout.Column} column
     */
    function appendHeaderToAncestors(nodeContext, column) {
        eachAncestorNodeContext(nodeContext, function(formattingContext, nc) {
            appendHeader(formattingContext, nc);
            column.fragmentLayoutConstraints.push(
              new RepetitiveElementsOwnerLayoutConstraint(nc));
        });
    };

    /**
     * @param {!vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext} formattingContext
     * @param {!adapt.vtree.NodeContext} nodeContext
     */
    function appendHeader(formattingContext, nodeContext) {
        var repetitiveElements = formattingContext.getRepetitiveElements();
        if (repetitiveElements) {
            var rootViewNode = formattingContext.getRootViewNode(nodeContext);
            if (!rootViewNode) {
                return;
            }
            var firstChild = rootViewNode.firstChild;
            repetitiveElements.appendHeaderToFragment(rootViewNode, firstChild);
        }
    };

    /**
     * @param {adapt.vtree.NodeContext} nodeContext
     */
    function appendFooterToAncestors(nodeContext) {
        eachAncestorNodeContext(nodeContext, function(formattingContext, nc) {
            appendFooter(formattingContext, nc);
        });
    };

    /**
     * @param {!vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext} formattingContext
     * @param {!adapt.vtree.NodeContext} nodeContext
     */
    function appendFooter(formattingContext, nodeContext) {
        var repetitiveElements = formattingContext.getRepetitiveElements();
        if (repetitiveElements) {
            if (!repetitiveElements.isSkipFooter) {
                var rootViewNode = formattingContext.getRootViewNode(nodeContext);
                if (!rootViewNode) {
                    return;
                }
                repetitiveElements.appendFooterToFragment(rootViewNode, null);
            }
        }
    };
    vivliostyle.repetitiveelements.eachAncestorRepetitiveElementsOwnerFormattingContext
        = eachAncestorRepetitiveElementsOwnerFormattingContext;
    vivliostyle.repetitiveelements.appendHeaderToAncestors = appendHeaderToAncestors;
    vivliostyle.repetitiveelements.appendHeader = appendHeader;
    vivliostyle.repetitiveelements.appendFooterToAncestors = appendFooterToAncestors;
    vivliostyle.repetitiveelements.appendFooter = appendFooter;

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
        if (formattingContext instanceof RepetitiveElementsOwnerFormattingContext
         && !(formattingContext instanceof vivliostyle.table.TableFormattingContext)) {
            return layoutProcessor;
        }
        return null;
    });

});
