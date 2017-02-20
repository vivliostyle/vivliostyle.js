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
    /** @const */ var AbstractLayoutRetryer = vivliostyle.layoututil.AbstractLayoutRetryer;
    /** @const */ var BlockLayoutProcessor = adapt.layout.BlockLayoutProcessor;

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
            if (!nodeContext.belongsTo(this)) {
                return nodeContext;
            }
        } while (nodeContext = nodeContext.parent);
        return null;
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
        /** @private @type {Element} */ this.headerSourceNode = null;
        /** @private @type {Element} */ this.footerSourceNode = null;
        /** @private @type {Element} */ this.headerViewNode = null;
        /** @private @type {Element} */ this.footerViewNode = null;
        /** @private @type {!Array.<!Element>} */ this.insertedHeaders = [];
        /** @private @type {!Array.<!Element>} */ this.insertedFooters = [];
        /** @private @type {number} */ this.headerHeight = 0;
        /** @private @type {number} */ this.footerHeight = 0;
        /** @type {boolean} */ this.isSkipHeader = false;
        /** @type {boolean} */ this.isSkipFooter = false;
        /** @type {boolean} */ this.enableSkippingFooter = true;
        /** @type {boolean} */ this.enableSkippingHeader = true;
        /** @type {boolean} */ this.doneInitialLayout = false;
    };
    /** @const */ var RepetitiveElements = vivliostyle.repetitiveelements.RepetitiveElements;

    /**
     * @param {!Element} viewNode
     * @param {!Element} sourceNode
     */
    RepetitiveElements.prototype.setHeaderElement = function(viewNode, sourceNode) {
        if (this.headerViewNode) return; // use first one.
        this.headerViewNode = viewNode;
        this.headerSourceNode = sourceNode;
        this.insertedHeaders.push(viewNode);
    };
    /**
     * @param {!Element} viewNode
     * @param {!Element} sourceNode
     */
    RepetitiveElements.prototype.setFooterElement = function(viewNode, sourceNode) {
        if (this.footerViewNode) return; // use first one.
        this.footerViewNode = viewNode;
        this.footerSourceNode = sourceNode;
        this.insertedFooters.push(viewNode);
    };

    /**
     * @param {!adapt.vtree.ClientLayout} clientLayout
     */
    RepetitiveElements.prototype.updateHeight = function(clientLayout) {
        if (this.headerViewNode) {
            this.headerHeight = this.getElementHeight(this.headerViewNode, clientLayout);
        }
        if (this.footerViewNode) {
            this.footerHeight = this.getElementHeight(this.footerViewNode, clientLayout);
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
        this.insertedHeaders = [];
        this.insertedFooters = [];
        this.enableSkippingFooter = true;
        this.enableSkippingHeader = true;
    };
    /**
     * @param {!Element} rootViewNode
     * @param {?Node} firstChild
     */
    RepetitiveElements.prototype.appendHeaderToFragment = function(rootViewNode, firstChild) {
        if (!this.headerViewNode || this.isSkipHeader || this.insertedHeaders.length > 0) return;
        var headerViewNode = this.headerViewNode.cloneNode(true);
        headerViewNode.setAttribute(adapt.vtree.SPECIAL_ATTR, "1");
        this.insertedHeaders.push(headerViewNode);
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
        if (!this.footerViewNode || this.isSkipFooter  || this.insertedFooters.length > 0) return;
        var footerViewNode = this.footerViewNode.cloneNode(true);
        footerViewNode.setAttribute(adapt.vtree.SPECIAL_ATTR, "1");
        this.insertedFooters.push(footerViewNode);
        if (firstChild) {
            rootViewNode.insertBefore(footerViewNode, firstChild);
        } else {
            rootViewNode.appendChild(footerViewNode);
        }
    };

    /**
     * @return {number}
     */
    RepetitiveElements.prototype.calculateOffset = function(nodeContext) {
        if (!this.isSkipFooter
          || (nodeContext && this.isAfterTheLastContent(nodeContext))) {
            return this.footerHeight;
        }
        return 0;
    };

    RepetitiveElements.prototype.isAfterTheLastContent = function(nodeContext) {
        var parentsOfLastContent = [];
        for (var n=this.lastContentSourceNode; n; n=n.parentNode) {
            if (nodeContext.sourceNode === n) {
                return nodeContext.after;
            } else {
                parentsOfLastContent.push(n);
            }
        }
        for (var currentParent=nodeContext.sourceNode; currentParent; currentParent=currentParent.parentNode) {
            if (parentsOfLastContent.indexOf(currentParent) >= 0) {
                return false;
            } else {
                for (var current=currentParent; current; current=current.previousElementSibling) {
                    if (parentsOfLastContent.indexOf(current) >= 0) {
                        return true;
                    }
                }
            }
        }
        return nodeContext.after;
    };

    /**
     * @return {boolean}
     */
    RepetitiveElements.prototype.isEnableToUpdateState = function() {
        if ((!this.isSkipFooter && this.enableSkippingFooter && this.footerViewNode)
          || (!this.isSkipHeader && this.enableSkippingHeader && this.headerViewNode)) {
            return true;
        } else {
            return false;
        }
    };

    RepetitiveElements.prototype.updateState = function() {
        if (!this.isSkipFooter && this.enableSkippingFooter && this.footerViewNode) {
            this.isSkipFooter = true;
        } else if (!this.isSkipHeader && this.enableSkippingHeader && this.headerViewNode) {
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
        this.insertedHeaders.forEach(function(viewNode) {
            if (viewNode.parentNode) viewNode.parentNode.removeChild(viewNode);
        });
        this.insertedHeaders = [];
    };
    RepetitiveElements.prototype.removeFooterFromFragment = function() {
        this.insertedFooters.forEach(function(viewNode) {
            if (viewNode.parentNode) viewNode.parentNode.removeChild(viewNode);
        });
        this.insertedFooters = [];
    };

    /**
     * @param {Node} node
     * @return {boolean}
     */
    RepetitiveElements.prototype.isHeaderViewNode = function(node) {
        return this.insertedHeaders.some(function(viewNode) {
            return viewNode === node;
        });
    };

    /**
     * @param {Node} node
     * @return {boolean}
     */
    RepetitiveElements.prototype.isFooterViewNode = function(node) {
        return this.insertedFooters.some(function(viewNode) {
            return viewNode === node;
        });
    };
    /**
     * @return {boolean}
     */
    RepetitiveElements.prototype.isHeaderRegisterd = function() {
        return !!this.headerViewNode;
    };
    /**
     * @return {boolean}
     */
    RepetitiveElements.prototype.isFooterRegisterd = function() {
        return !!this.footerViewNode;
    };
    /**
     * @param {Node} node
     * @return {boolean}
     */
    RepetitiveElements.prototype.isHeaderSourceNode = function(node) {
        return this.headerSourceNode === node;
    };
    /**
     * @param {Node} node
     * @return {boolean}
     */
    RepetitiveElements.prototype.isFooterSourceNode = function(node) {
        return this.footerSourceNode === node;
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
            if (!repetitiveElements.doneInitialLayout) {
                repetitiveElements.updateHeight(column.clientLayout);
                repetitiveElements.doneInitialLayout = true;
            }
        }
        this.formattingContext.doneInitialLayout = true;
        if (!accepted) {
            repetitiveElements.removeHeaderFromFragment();
            repetitiveElements.removeFooterFromFragment();
        }
    };

    /**
     * @constructor
     * @param {!vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext} formattingContext
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
        if (!nodeContext.belongsTo(this.formattingContext) && !nodeContext.after) {
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
    goog.inherits(LayoutEntireOwnerBlock, LayoutEntireBlock);

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
    goog.inherits(LayoutFragmentedOwnerBlock, LayoutFragmentedBlock);

    /**
     * @override
     */
    LayoutFragmentedOwnerBlock.prototype.doLayout = function(nodeContext, column) {
        LayoutFragmentedBlock.prototype.appendHeaders.call(this, nodeContext);
        if (!nodeContext.belongsTo(this.formattingContext) && !nodeContext.after) {
            column.fragmentLayoutConstraints.unshift(
                new RepetitiveElementsOwnerLayoutConstraint(nodeContext));
        }
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
    RepetitiveElementsOwnerLayoutConstraint.prototype.allowLayout = function(nodeContext, overflownNodeContext, column) {
        var formattingContext = getRepetitiveElementsOwnerFormattingContext(this.nodeContext.formattingContext);
        var repetitiveElements = this.getRepetitiveElements();
        if (!repetitiveElements) return true;

        if (adapt.layout.isOrphan(this.nodeContext.viewNode)) return true;
        if (!repetitiveElements.isEnableToUpdateState()) return true;

        if ((overflownNodeContext && !nodeContext) || (nodeContext && nodeContext.overflow)) {
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
    RepetitiveElementsOwnerLayoutConstraint.prototype.postLayout = function(allowed, nodeContext, column) {
        var formattingContext = getRepetitiveElementsOwnerFormattingContext(this.nodeContext.formattingContext);
        var repetitiveElements = this.getRepetitiveElements();
        if (!repetitiveElements) return;
        if (allowed) {
            if (column.stopAtOverflow) {
                if (nodeContext == null || repetitiveElements.isAfterTheLastContent(nodeContext)) {
                    repetitiveElements.preventSkippingFooter();
                }
            }
            vivliostyle.repetitiveelements.appendFooter(formattingContext, this.nodeContext);
        } else {
            repetitiveElements.removeHeaderFromFragment();
            repetitiveElements.removeFooterFromFragment();
        }
    };

    /** @override */
    RepetitiveElementsOwnerLayoutConstraint.prototype.finishBreak = function(nodeContext) {
        var repetitiveElements = this.getRepetitiveElements();
        if (!repetitiveElements) return;
        repetitiveElements.prepareLayoutFragment();
    };

    RepetitiveElementsOwnerLayoutConstraint.prototype.getRepetitiveElements = function() {
        var formattingContext = getRepetitiveElementsOwnerFormattingContext(this.nodeContext.formattingContext);
        return formattingContext.getRepetitiveElements();
    };


    /** @override */
    RepetitiveElementsOwnerLayoutConstraint.prototype.equalsTo = function(constraint) {
        if (!(constraint instanceof RepetitiveElementsOwnerLayoutConstraint)) return false;
        return getRepetitiveElementsOwnerFormattingContext(this.nodeContext.formattingContext)
           === getRepetitiveElementsOwnerFormattingContext(constraint.nodeContext.formattingContext);
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
    goog.inherits(RepetitiveElementsOwnerLayoutRetryer, AbstractLayoutRetryer);

    /**
     * @override
     */
    RepetitiveElementsOwnerLayoutRetryer.prototype.resolveLayoutMode = function(nodeContext) {
        if (!nodeContext.belongsTo(this.formattingContext)
          && !this.formattingContext.doneInitialLayout) {
            return new LayoutEntireOwnerBlock(this.formattingContext, this.processor);
        } else {
            var repetitiveElements = this.formattingContext.getRepetitiveElements();
            if (!nodeContext.belongsTo(this.formattingContext) && !nodeContext.after) {
                if (repetitiveElements) repetitiveElements.preventSkippingHeader();
            }
            return new LayoutFragmentedOwnerBlock(this.formattingContext, this.processor);
        }
    };

    /**
     * @param {!vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext} formattingContext
     * @param {!adapt.layout.Column} column
     * @constructor
     * @extends {vivliostyle.layoututil.EdgeSkipper}
     */
    vivliostyle.repetitiveelements.EntireBlockLayoutStrategy = function(formattingContext, column) {
        /** @const */ this.formattingContext = formattingContext;
        /** @const */ this.column = column;
    };
    /** @const */ var EntireBlockLayoutStrategy = vivliostyle.repetitiveelements.EntireBlockLayoutStrategy;
    goog.inherits(EntireBlockLayoutStrategy, EdgeSkipper);

    /**
     * @override
     */
    EntireBlockLayoutStrategy.prototype.startNonInlineElementNode = function(state) {
        /** @const */ var formattingContext = this.formattingContext;
        /** @const */ var nodeContext = state.nodeContext;
        /** @const */ var repetitiveElements = formattingContext.getRepetitiveElements();
        switch (nodeContext.repeatOnBreak) {
            case "header":
                if (!repetitiveElements.isHeaderRegisterd()) {
                    repetitiveElements.setHeaderElement(
                        /** @type {!Element} */ (nodeContext.viewNode),
                        /** @type {!Element} */ (nodeContext.sourceNode));
                    return adapt.task.newResult(true);
                } else {
                    nodeContext.repeatOnBreak = "none";
                }
                break;
            case "footer":
                if (!repetitiveElements.isFooterRegisterd()) {
                    repetitiveElements.setFooterElement(
                      /** @type {!Element} */ (nodeContext.viewNode),
                      /** @type {!Element} */ (nodeContext.sourceNode));
                    return adapt.task.newResult(true);
                } else {
                    nodeContext.repeatOnBreak = "none";
                }
                break;
        }
        return EdgeSkipper.prototype.startNonInlineElementNode.call(this, state);
    };

    /**
     * @override
     */
    EntireBlockLayoutStrategy.prototype.afterNonInlineElementNode = function(state) {
        /** @const */ var formattingContext = this.formattingContext;
        /** @const */ var nodeContext = state.nodeContext;
        if (nodeContext.sourceNode === formattingContext.rootSourceNode) {
            formattingContext.getRepetitiveElements().lastContentSourceNode =
                state.lastAfterNodeContext && state.lastAfterNodeContext.sourceNode;
            state.break = true;
        }
        if (nodeContext.repeatOnBreak === 'header'
            || nodeContext.repeatOnBreak === 'footer') {
            return adapt.task.newResult(true);
        } else {
            return EdgeSkipper.prototype.afterNonInlineElementNode.call(this, state);
        }
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
    goog.inherits(FragmentedBlockLayoutStrategy, EdgeSkipper);

    /**
     * @constructor
     * @implements {adapt.layout.LayoutProcessor}
     * @extends {adapt.layout.BlockLayoutProcessor}
     */
    vivliostyle.repetitiveelements.RepetitiveElementsOwnerLayoutProcessor = function() {};
    /** @const */ var RepetitiveElementsOwnerLayoutProcessor = vivliostyle.repetitiveelements.RepetitiveElementsOwnerLayoutProcessor;
    goog.inherits(RepetitiveElementsOwnerLayoutProcessor, BlockLayoutProcessor);

    /**
     * @override
     */
    RepetitiveElementsOwnerLayoutProcessor.prototype.layout = function(nodeContext, column, leadingEdge) {
        var formattingContext = getRepetitiveElementsOwnerFormattingContext(nodeContext.formattingContext);
        if (leadingEdge) vivliostyle.repetitiveelements.appendHeaderToAncestors(nodeContext.parent, column);

        if (!nodeContext.belongsTo(formattingContext)) {
            return new RepetitiveElementsOwnerLayoutRetryer(formattingContext, this).layout(nodeContext, column);
        } else {
            return adapt.layout.BlockLayoutProcessor.prototype.layout.call(this, nodeContext, column, leadingEdge);
        }
    };

    /**
     * @override
     */
    RepetitiveElementsOwnerLayoutProcessor.prototype.startNonInlineElementNode = function(nodeContext) {
        var formattingContext = getRepetitiveElementsOwnerFormattingContextOrNull(nodeContext);
        var repetitiveElements = formattingContext.getRepetitiveElements();
        if (!repetitiveElements) return false;

        if (repetitiveElements.isHeaderSourceNode(nodeContext.sourceNode)
           || repetitiveElements.isFooterSourceNode(nodeContext.sourceNode)) {
            nodeContext.viewNode.parentNode.removeChild(nodeContext.viewNode);
        }
        return false;
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
        this.layoutEntireBlock(nodeContext, column).thenFinish(frame);
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
        return adapt.layout.BlockLayoutProcessor.prototype.layout.call(this, nodeContext, column, false);
    };

    /**
     * @override
     */
    RepetitiveElementsOwnerLayoutProcessor.prototype.finishBreak = function(column, nodeContext, forceRemoveSelf, endOfRegion) {
        return adapt.layout.BlockLayoutProcessor.prototype.finishBreak.call(
            this, column, nodeContext, forceRemoveSelf, endOfRegion);
    };

    /**
     * @override
     */
    RepetitiveElementsOwnerLayoutProcessor.prototype.clearOverflownViewNodes = function(column, parentNodeContext, nodeContext, removeSelf) {
        vivliostyle.repetitiveelements.clearOverflownViewNodes(column, parentNodeContext, nodeContext, removeSelf);
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
              && !nc.belongsTo(formattingContext)) {
                callback(formattingContext, nc);
            }
        }
    };


    /**
     * @param {adapt.vtree.NodeContext} nodeContext
     * @param {!adapt.layout.Column} column
     */
    function appendHeaderToAncestors(nodeContext, column) {
        if (!nodeContext) return;
        eachAncestorNodeContext(nodeContext.after ? nodeContext.parent : nodeContext, function(formattingContext, nc) {
            if (formattingContext instanceof vivliostyle.table.TableFormattingContext) return;
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
    vivliostyle.repetitiveelements.appendFooter = appendFooter;

    /**
     * @param {!adapt.layout.Column} column
     * @return {Array.<!vivliostyle.repetitiveelements.RepetitiveElements>}
     */
    vivliostyle.repetitiveelements.collectRepetitiveElements = function(column) {
        /** @type {Array.<!vivliostyle.repetitiveelements.RepetitiveElements>} */ var repetitiveElements = [];
        for (var current = column; current; current = current.pseudoParent) {
            current.fragmentLayoutConstraints.forEach(function(constraint) {
                if (constraint instanceof RepetitiveElementsOwnerLayoutConstraint) {
                    var repetitiveElement = constraint.getRepetitiveElements();
                    repetitiveElements.push(repetitiveElement);
                }
            });
        }
        return repetitiveElements;
    };

    /**
     * @param {!adapt.layout.Column} column
     * @param {adapt.vtree.NodeContext} parentNodeContext
     * @param {!adapt.vtree.NodeContext} nodeContext
     * @param {boolean} removeSelf
     */
    vivliostyle.repetitiveelements.clearOverflownViewNodes = function(column, parentNodeContext, nodeContext, removeSelf) {
        if (!nodeContext.viewNode) return;
        var repetitiveElements = null;
        if (parentNodeContext) {
            var formattingContext = getRepetitiveElementsOwnerFormattingContext(parentNodeContext.formattingContext);
            repetitiveElements = formattingContext.getRepetitiveElements();
        }
        var parentNode = nodeContext.viewNode.parentNode;
        if (!parentNode) return;
        for (var lastChild = parentNode.lastChild; lastChild && lastChild != nodeContext.viewNode;) {
            var target = lastChild;
            lastChild = lastChild.previousSibling;
            if (repetitiveElements && repetitiveElements.isFooterViewNode(target)) continue;
            parentNode.removeChild(target);
        }
        if (removeSelf) {
            parentNode.removeChild(nodeContext.viewNode);
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
    vivliostyle.repetitiveelements.getRepetitiveElementsOwnerFormattingContext = getRepetitiveElementsOwnerFormattingContext;

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
