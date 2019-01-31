/**
 * Copyright 2016 Trim-marks Inc.
 * @fileoverview Elements repeated in every fragment by repeat-on-break property.
 */
goog.provide("vivliostyle.repetitiveelements");

goog.require("adapt.task");
goog.require("adapt.vtree");
goog.require("vivliostyle.break");
goog.require("adapt.layout");

goog.scope(() => {

    /** @const */ const LayoutIterator = vivliostyle.layoututil.LayoutIterator;
    /** @const */ const EdgeSkipper = vivliostyle.layoututil.EdgeSkipper;
    /** @const */ const AbstractLayoutRetryer = vivliostyle.layoututil.AbstractLayoutRetryer;
    /** @const */ const BlockLayoutProcessor = adapt.layout.BlockLayoutProcessor;
    /** @const */ const PseudoColumn = vivliostyle.layoututil.PseudoColumn;

    /**
     * @param {adapt.vtree.FormattingContext} parent
     * @param {!Element} rootSourceNode
     * @constructor
     * @implements {adapt.vtree.FormattingContext}
     */
    vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext = function(parent, rootSourceNode) {
        /** @const */ this.parent = parent;
        /** @const */ this.rootSourceNode = rootSourceNode;
        /** @type {boolean} */ this.isRoot = false;
        /** @type {vivliostyle.repetitiveelements.RepetitiveElements} */ this.repetitiveElements = null;
    };
    /** @const */ const RepetitiveElementsOwnerFormattingContext = vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext;

    /**
     * @override
     */
    RepetitiveElementsOwnerFormattingContext.prototype.getName = () => "Repetitive elements owner formatting context (vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext)";

    /**
     * @override
     */
    RepetitiveElementsOwnerFormattingContext.prototype.isFirstTime = (nodeContext, firstTime) => firstTime;

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
        const root = this.getRootNodeContext(position);
        return root ? /** @type {Element} */ (root.viewNode) : null;
    };

    /**
     * @param {adapt.vtree.NodeContext} nodeContext
     * @returns {adapt.vtree.NodeContext}
     */
    RepetitiveElementsOwnerFormattingContext.prototype.getRootNodeContext = function(nodeContext) {
        do {
            if (!nodeContext.belongsTo(this)
                && nodeContext.sourceNode === this.rootSourceNode) {
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
        const found = repetitiveElementsCache.some(entry => {
            if (entry.root === this.rootSourceNode) {
                this.repetitiveElements = entry.elements;
                return true;
            }
            return false;
        });
        if (!found) {
            this.repetitiveElements = new RepetitiveElements(vertical, this.rootSourceNode);
            repetitiveElementsCache.push({
                root: this.rootSourceNode,
                elements: this.repetitiveElements
            });
        }
    };

    /** @override */
    RepetitiveElementsOwnerFormattingContext.prototype.saveState = () => {};

    /** @override */
    RepetitiveElementsOwnerFormattingContext.prototype.restoreState = state => {};

    /** @type {Array.<{root:Element, elements:vivliostyle.repetitiveelements.RepetitiveElements}>} */
    var repetitiveElementsCache = [];

    vivliostyle.repetitiveelements.clearCache = () => {
        repetitiveElementsCache = [];
    };


    /**
     * @interface
     */
    vivliostyle.repetitiveelements.ElementsOffset = function() {};
    /** @const */ const ElementsOffset = vivliostyle.repetitiveelements.ElementsOffset;

    /**
     * @param {adapt.vtree.NodeContext} nodeContext
     * @return {number}
     */
    ElementsOffset.prototype.calculateOffset = nodeContext => {};

    /**
    * @param {adapt.vtree.NodeContext} nodeContext
    * @return {number}
     */
    ElementsOffset.prototype.calculateMinimumOffset = nodeContext => {};


    /**
     * @constructor
     * @param {boolean} vertical
     * @param {Element} ownerSourceNode
     * @implements {vivliostyle.repetitiveelements.ElementsOffset}
     */
    vivliostyle.repetitiveelements.RepetitiveElements = function(vertical, ownerSourceNode) {
        /** @private @const */ this.vertical = vertical;
        /** @private @type {Element} */ this.headerSourceNode = null;
        /** @private @type {Element} */ this.footerSourceNode = null;
        /** @private @type {Element} */ this.headerViewNode = null;
        /** @private @type {Element} */ this.footerViewNode = null;
        /** @private @type {?adapt.vtree.NodePosition} */ this.headerNodePosition = null;
        /** @private @type {?adapt.vtree.NodePosition} */ this.footerNodePosition = null;
        /** @private @type {number} */ this.headerHeight = 0;
        /** @private @type {number} */ this.footerHeight = 0;
        /** @type {boolean} */ this.isSkipHeader = false;
        /** @type {boolean} */ this.isSkipFooter = false;
        /** @type {boolean} */ this.enableSkippingFooter = true;
        /** @type {boolean} */ this.enableSkippingHeader = true;
        /** @type {boolean} */ this.doneInitialLayout = false;
        /** @type {Element} */ this.ownerSourceNode = ownerSourceNode;
        /** @type {Element} */ this.firstContentSourceNode = null;
        /** @type {Element} */ this.lastContentSourceNode = null;
        /** @private @const {!Array.<{nodeContext:adapt.vtree.NodeContext,result:boolean}>} */ this.affectedNodeCache = [];
        /** @private @const {!Array.<{nodeContext:adapt.vtree.NodeContext,result:boolean}>} */ this.afterLastContentNodeCache = [];
        this.allowInsert = false;
    };
    /** @const */ var RepetitiveElements = vivliostyle.repetitiveelements.RepetitiveElements;

    /**
     * @param {!adapt.vtree.NodeContext} nodeContext
     */
    RepetitiveElements.prototype.setHeaderNodeContext = function(nodeContext) {
        if (this.headerNodePosition) return; // use first one.
        this.headerNodePosition = adapt.vtree.newNodePositionFromNodeContext(nodeContext, 0);
        this.headerSourceNode = /** @type {Element} */ (nodeContext.sourceNode);
        this.headerViewNode = /** @type {Element} */ (nodeContext.viewNode);
    };
    /**
     * @param {!adapt.vtree.NodeContext} nodeContext
     */
    RepetitiveElements.prototype.setFooterNodeContext = function(nodeContext) {
        if (this.footerNodePosition) return; // use first one.
        this.footerNodePosition = adapt.vtree.newNodePositionFromNodeContext(nodeContext, 0);
        this.footerSourceNode = /** @type {Element} */ (nodeContext.sourceNode);
        this.footerViewNode = /** @type {Element} */ (nodeContext.viewNode);
    };

    /**
     * @param {!adapt.layout.Column} column
     */
    RepetitiveElements.prototype.updateHeight = function(column) {
        if (this.headerViewNode) {
            this.headerHeight = adapt.layout.getElementHeight(this.headerViewNode, column, this.vertical);
            this.headerViewNode = null;
        }
        if (this.footerViewNode) {
            this.footerHeight = adapt.layout.getElementHeight(this.footerViewNode, column, this.vertical);
            this.footerViewNode = null;
        }
    };

    RepetitiveElements.prototype.prepareLayoutFragment = function() {
        this.isSkipHeader = this.isSkipFooter = false;
        this.enableSkippingFooter = true;
        this.enableSkippingHeader = true;
    };
    /**
     * @param {!adapt.vtree.NodeContext} rootNodeContext
     * @param {?Node} firstChild
     * @param {!adapt.layout.Column} column
     */
    RepetitiveElements.prototype.appendHeaderToFragment = function(rootNodeContext, firstChild, column) {
        if (!this.headerNodePosition || this.isSkipHeader) return adapt.task.newResult(true);
        return this.appendElementToFragment(this.headerNodePosition, rootNodeContext, firstChild, column);
    };

    /**
     * @param {!adapt.vtree.NodeContext} rootNodeContext
     * @param {?Node} firstChild
     * @param {!adapt.layout.Column} column
     */
    RepetitiveElements.prototype.appendFooterToFragment = function(rootNodeContext, firstChild, column) {
        if (!this.footerNodePosition || this.isSkipFooter) return adapt.task.newResult(true);
        return this.appendElementToFragment(this.footerNodePosition, rootNodeContext, firstChild, column);
    };

    /**
     * @param {!adapt.vtree.NodePosition} nodePosition
     * @param {!adapt.vtree.NodeContext} rootNodeContext
     * @param {?Node} firstChild
     * @param {!adapt.layout.Column} column
     * @return
     */
    RepetitiveElements.prototype.appendElementToFragment = function(nodePosition, rootNodeContext, firstChild, column) {
        const doc = rootNodeContext.viewNode.ownerDocument;
        const rootViewNode = /** @type {Element} */ (rootNodeContext.viewNode);
        const viewRoot = doc.createElement("div");
        rootViewNode.appendChild(viewRoot);
        const pseudoColumn = new PseudoColumn(column, viewRoot, rootNodeContext);
        const initialPageBreakType = pseudoColumn.getColumn().pageBreakType;
        pseudoColumn.getColumn().pageBreakType = null;
        this.allowInsertRepeatitiveElements = true;
        return pseudoColumn.layout(new adapt.vtree.ChunkPosition(nodePosition), true).thenAsync(() => {
            this.allowInsertRepeatitiveElements = false;
            rootViewNode.removeChild(viewRoot);
            this.moveChildren(viewRoot, rootViewNode, firstChild);
            pseudoColumn.getColumn().pageBreakType = initialPageBreakType;
            return adapt.task.newResult(true);
        });
    };

    /**
     * @param {!Element} from
     * @param {Element} to
     * @param {?Node} firstChild
     */
    RepetitiveElements.prototype.moveChildren = (from, to, firstChild) => {
        if (!to) return;
        while (from.firstChild) {
            const child = from.firstChild;
            from.removeChild(child);
            child.setAttribute(adapt.vtree.SPECIAL_ATTR, "1");
            if (firstChild) {
                to.insertBefore(child, firstChild);
            } else {
                to.appendChild(child);
            }
        }
    };

    /** @override */
    RepetitiveElements.prototype.calculateOffset = function(nodeContext) {
        let offset = 0;
        if (nodeContext && !this.affectTo(nodeContext)) return offset;

        if (!this.isSkipFooter
          || (nodeContext && this.isAfterLastContent(nodeContext))) {
            offset += this.footerHeight;
        }
        if (!this.isSkipHeader) {
            offset += this.headerHeight;
        }
        return offset;
    };

    /** @override */
    RepetitiveElements.prototype.calculateMinimumOffset = function(nodeContext) {
        let offset = 0;
        if (nodeContext && !this.affectTo(nodeContext)) return offset;

        if (nodeContext && this.isAfterLastContent(nodeContext)) {
            offset += this.footerHeight;
        }
        if (!this.enableSkippingHeader) {
            offset += this.headerHeight;
        }
        return offset;
    };

    /**
     * @param {!adapt.vtree.NodeContext} nodeContext
     * @return {boolean}
     */
    RepetitiveElements.prototype.isAfterLastContent = function(nodeContext) {
        return this.findResultFromCache(nodeContext, this.afterLastContentNodeCache, nc => this.isAfterNodeContextOf(this.lastContentSourceNode, nodeContext, false));
    };

    /**
     *  @private
     * @param {!adapt.vtree.NodeContext} nodeContext
     * @return {boolean}
     */
    RepetitiveElements.prototype.affectTo = function(nodeContext) {
        return this.findResultFromCache(nodeContext, this.affectedNodeCache, nc => this.isAfterNodeContextOf(this.ownerSourceNode, nodeContext, true));
    };

    /**
     * @private
     * @param {!adapt.vtree.NodeContext} nodeContext
     * @param {!Array.<{nodeContext:adapt.vtree.NodeContext,result:boolean}>} cache
     * @param {function(adapt.vtree.NodeContext):boolean} calculator
     * @return {boolean}
     */
    RepetitiveElements.prototype.findResultFromCache = (nodeContext, cache, calculator) => {
        const cacheEntry = cache.filter(cache => cache.nodeContext.sourceNode === nodeContext.sourceNode
            && cache.nodeContext.after === nodeContext.after);
        if (cacheEntry.length > 0) {
            return cacheEntry[0].result;
        } else {
            const result = calculator(nodeContext);
            cache.push({
                nodeContext, result
            });
            return result;
        }
    };

    /**
     * @private
     * @param {Element} node
     * @param {!adapt.vtree.NodeContext} nodeContext
     * @param {boolean} includeChildren
     * @return {boolean}
     */
    RepetitiveElements.prototype.isAfterNodeContextOf = (node, nodeContext, includeChildren) => {
        const parentsOfNode = [];
        for (let n=node; n; n=n.parentNode) {
            if (nodeContext.sourceNode === n) {
                return nodeContext.after;
            } else {
                parentsOfNode.push(n);
            }
        }
        for (let currentParent=nodeContext.sourceNode; currentParent; currentParent=currentParent.parentNode) {
            const index = parentsOfNode.indexOf(currentParent);
            if (index >= 0) {
                return includeChildren ? index === 0 : false;
            } else {
                for (let current=currentParent; current; current=current.previousElementSibling) {
                    if (parentsOfNode.includes(current)) {
                        return true;
                    }
                }
            }
        }
        return nodeContext.after;
    };

    /**
     * @param {!adapt.vtree.NodeContext} nodeContext
     * @return {boolean}
     */
    RepetitiveElements.prototype.isFirstContentNode = function(nodeContext) {
        return nodeContext && this.firstContentSourceNode === nodeContext.sourceNode;
    };

    /**
     * @return {boolean}
     */
    RepetitiveElements.prototype.isEnableToUpdateState = function() {
        if ((!this.isSkipFooter && this.enableSkippingFooter && this.footerNodePosition)
          || (!this.isSkipHeader && this.enableSkippingHeader && this.headerNodePosition)) {
            return true;
        } else {
            return false;
        }
    };

    RepetitiveElements.prototype.updateState = function() {
        if (!this.isSkipFooter && this.enableSkippingFooter && this.footerNodePosition) {
            this.isSkipFooter = true;
        } else if (!this.isSkipHeader && this.enableSkippingHeader && this.headerNodePosition) {
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

    /**
     * @return {boolean}
     */
    RepetitiveElements.prototype.isHeaderRegistered = function() {
        return !!this.headerNodePosition;
    };
    /**
     * @return {boolean}
     */
    RepetitiveElements.prototype.isFooterRegistered = function() {
        return !!this.footerNodePosition;
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
     * @abstract
     * @constructor
     * @param {vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext} formattingContext
     * @implements {vivliostyle.layoututil.LayoutMode}
     */
    vivliostyle.repetitiveelements.LayoutEntireBlock = function(formattingContext) {
        this.formattingContext = formattingContext;
    };
    /** @const */ const LayoutEntireBlock = vivliostyle.repetitiveelements.LayoutEntireBlock;

    /**
     * @override
     */
    LayoutEntireBlock.prototype.doLayout = (nodeContext, column) => {};

    /**
     * @override
     */
    LayoutEntireBlock.prototype.accept = (nodeContext, column) => !!nodeContext;

    /**
     * @override
     */
    LayoutEntireBlock.prototype.postLayout = function(positionAfter, initialPosition, column, accepted) {
        const repetitiveElements = this.formattingContext.getRepetitiveElements();
        if (repetitiveElements) {
            goog.asserts.assert(column.clientLayout);
            if (!repetitiveElements.doneInitialLayout) {
                repetitiveElements.updateHeight(column);
                repetitiveElements.doneInitialLayout = true;
            }
        }
        return accepted;
    };

    /**
     * @abstract
     * @constructor
     * @param {!vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext} formattingContext
     * @implements {vivliostyle.layoututil.LayoutMode}
     */
    vivliostyle.repetitiveelements.LayoutFragmentedBlock = function(formattingContext) {
        this.formattingContext = formattingContext;
    };
    /** @const */ const LayoutFragmentedBlock = vivliostyle.repetitiveelements.LayoutFragmentedBlock;

    /**
     * @override
     */
    LayoutFragmentedBlock.prototype.doLayout = (nodeContext, column) => {};

    /**
     * @override
     */
    LayoutFragmentedBlock.prototype.accept = (nodeContext, column) => true;

    /**
     * @override
     */
    LayoutFragmentedBlock.prototype.postLayout = (positionAfter, initialPosition, column, accepted) => accepted;

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
    /** @const */ const LayoutEntireOwnerBlock = vivliostyle.repetitiveelements.LayoutEntireOwnerBlock;
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
    LayoutEntireOwnerBlock.prototype.accept = (nodeContext, column) => false;

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
    /** @const */ const LayoutFragmentedOwnerBlock = vivliostyle.repetitiveelements.LayoutFragmentedOwnerBlock;
    goog.inherits(LayoutFragmentedOwnerBlock, LayoutFragmentedBlock);

    /**
     * @override
     */
    LayoutFragmentedOwnerBlock.prototype.doLayout = function(nodeContext, column) {
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
        const formattingContext = getRepetitiveElementsOwnerFormattingContext(nodeContext.formattingContext);
        this.nodeContext = formattingContext.getRootNodeContext(nodeContext);
    };
    /** @const */ var RepetitiveElementsOwnerLayoutConstraint = vivliostyle.repetitiveelements.RepetitiveElementsOwnerLayoutConstraint;

    /** @override */
    RepetitiveElementsOwnerLayoutConstraint.prototype.allowLayout = function(nodeContext, overflownNodeContext, column) {
        const repetitiveElements = this.getRepetitiveElements();
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
        const repetitiveElements = this.getRepetitiveElements();
        if (!repetitiveElements) return false;
        if (repetitiveElements.isEnableToUpdateState()) {
            repetitiveElements.updateState();
            return true;
        } else {
            return false;
        }
    };

    /** @override */
    RepetitiveElementsOwnerLayoutConstraint.prototype.postLayout = function(allowed, nodeContext, initialPosition, column) {
        const repetitiveElements = this.getRepetitiveElements();
        if (!repetitiveElements) return;
        if (allowed) {
            if (column.stopAtOverflow) {
                if (nodeContext == null || repetitiveElements.isAfterLastContent(nodeContext)) {
                    repetitiveElements.preventSkippingFooter();
                }
            }
        }
    };

    /** @override */
    RepetitiveElementsOwnerLayoutConstraint.prototype.finishBreak = function(nodeContext, column) {
        const formattingContext = getRepetitiveElementsOwnerFormattingContext(this.nodeContext.formattingContext);
        const repetitiveElements = this.getRepetitiveElements();
        if (!repetitiveElements) return adapt.task.newResult(true);

        const rootNodeContext = this.nodeContext;
        return vivliostyle.repetitiveelements.appendHeader(formattingContext, rootNodeContext, column).thenAsync(() =>
            vivliostyle.repetitiveelements.appendFooter(formattingContext, rootNodeContext, column).thenAsync(() => {
                repetitiveElements.prepareLayoutFragment();
                return adapt.task.newResult(true);
            }));
    };

    RepetitiveElementsOwnerLayoutConstraint.prototype.getRepetitiveElements = function() {
        const formattingContext = getRepetitiveElementsOwnerFormattingContext(this.nodeContext.formattingContext);
        return formattingContext.getRepetitiveElements();
    };

    /** @override */
    RepetitiveElementsOwnerLayoutConstraint.prototype.equalsTo = function(constraint) {
        if (!(constraint instanceof RepetitiveElementsOwnerLayoutConstraint)) return false;
        return getRepetitiveElementsOwnerFormattingContext(this.nodeContext.formattingContext)
           === getRepetitiveElementsOwnerFormattingContext(constraint.nodeContext.formattingContext);
    };

    /** @override */
    RepetitiveElementsOwnerLayoutConstraint.prototype.getPriorityOfFinishBreak = () => 10;


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
    /** @const */ const RepetitiveElementsOwnerLayoutRetryer = vivliostyle.repetitiveelements.RepetitiveElementsOwnerLayoutRetryer;
    goog.inherits(RepetitiveElementsOwnerLayoutRetryer, AbstractLayoutRetryer);

    /**
     * @override
     */
    RepetitiveElementsOwnerLayoutRetryer.prototype.resolveLayoutMode = function(nodeContext) {
        const repetitiveElements = this.formattingContext.getRepetitiveElements();
        if (!nodeContext.belongsTo(this.formattingContext)
          && !repetitiveElements.doneInitialLayout) {
            return new LayoutEntireOwnerBlock(this.formattingContext, this.processor);
        } else {
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
    /** @const */ const EntireBlockLayoutStrategy = vivliostyle.repetitiveelements.EntireBlockLayoutStrategy;
    goog.inherits(EntireBlockLayoutStrategy, EdgeSkipper);

    /**
     * @override
     */
    EntireBlockLayoutStrategy.prototype.startNonInlineElementNode = function(state) {
        /** @const */ const formattingContext = this.formattingContext;
        /** @const */ const nodeContext = state.nodeContext;
        /** @const */ const repetitiveElements = formattingContext.getRepetitiveElements();
        if (nodeContext.parent && formattingContext.rootSourceNode === nodeContext.parent.sourceNode) {
            switch (nodeContext.repeatOnBreak) {
                case "header":
                    if (!repetitiveElements.isHeaderRegistered()) {
                        repetitiveElements.setHeaderNodeContext(nodeContext);
                        return adapt.task.newResult(true);
                    } else {
                        nodeContext.repeatOnBreak = "none";
                    }
                    break;
                case "footer":
                    if (!repetitiveElements.isFooterRegistered()) {
                        repetitiveElements.setFooterNodeContext(nodeContext);
                        return adapt.task.newResult(true);
                    } else {
                        nodeContext.repeatOnBreak = "none";
                    }
                    break;
            }
            if (!repetitiveElements.firstContentSourceNode) {
                repetitiveElements.firstContentSourceNode = /** @type {!Element} */ (nodeContext.sourceNode);
            }
        }
        return EdgeSkipper.prototype.startNonInlineElementNode.call(this, state);
    };

    /**
     * @override
     */
    EntireBlockLayoutStrategy.prototype.afterNonInlineElementNode = function(state) {
        /** @const */ const formattingContext = this.formattingContext;
        /** @const */ const nodeContext = state.nodeContext;
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
    /** @const */ const FragmentedBlockLayoutStrategy = vivliostyle.repetitiveelements.FragmentedBlockLayoutStrategy;
    goog.inherits(FragmentedBlockLayoutStrategy, EdgeSkipper);

    /**
     * @constructor
     * @implements {adapt.layout.LayoutProcessor}
     * @extends {adapt.layout.BlockLayoutProcessor}
     */
    vivliostyle.repetitiveelements.RepetitiveElementsOwnerLayoutProcessor = function() {};
    /** @const */ const RepetitiveElementsOwnerLayoutProcessor = vivliostyle.repetitiveelements.RepetitiveElementsOwnerLayoutProcessor;
    goog.inherits(RepetitiveElementsOwnerLayoutProcessor, BlockLayoutProcessor);

    /**
     * @override
     */
    RepetitiveElementsOwnerLayoutProcessor.prototype.layout = function(nodeContext, column, leadingEdge) {
        if (column.isFloatNodeContext(nodeContext)) {
            return column.layoutFloatOrFootnote(nodeContext);
        }

        const formattingContext = getRepetitiveElementsOwnerFormattingContext(nodeContext.formattingContext);
        const rootViewNode = formattingContext.getRootViewNode(nodeContext);
        if (!rootViewNode) {
            return column.buildDeepElementView(nodeContext);
        } else {
            if (leadingEdge) vivliostyle.repetitiveelements.appendHeaderToAncestors(nodeContext.parent, column);

            if (!nodeContext.belongsTo(formattingContext)) {
                return new RepetitiveElementsOwnerLayoutRetryer(formattingContext, this).layout(nodeContext, column);
            } else {
                return adapt.layout.BlockLayoutProcessor.prototype.layout.call(this, nodeContext, column, leadingEdge);
            }
        }
    };

    /**
     * @override
     */
    RepetitiveElementsOwnerLayoutProcessor.prototype.startNonInlineElementNode = nodeContext => {
        const formattingContext = getRepetitiveElementsOwnerFormattingContextOrNull(nodeContext);
        const repetitiveElements = formattingContext.getRepetitiveElements();
        if (!repetitiveElements) return false;

        if (!repetitiveElements.allowInsertRepeatitiveElements
            && (repetitiveElements.isHeaderSourceNode(nodeContext.sourceNode)
             || repetitiveElements.isFooterSourceNode(nodeContext.sourceNode))) {
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
        const formattingContext = getRepetitiveElementsOwnerFormattingContext(nodeContext.formattingContext);
        const frame = adapt.task.newFrame("BlockLayoutProcessor.doInitialLayout");
        this.layoutEntireBlock(nodeContext, column).thenFinish(frame);
        return frame.result();
    };

    /**
     * @private
     * @param {adapt.vtree.NodeContext} nodeContext
     * @param {!adapt.layout.Column} column
     * @returns {!adapt.task.Result.<adapt.vtree.NodeContext>}
     */
    RepetitiveElementsOwnerLayoutProcessor.prototype.layoutEntireBlock = (nodeContext, column) => {
        const formattingContext = getRepetitiveElementsOwnerFormattingContext(nodeContext.formattingContext);
        /** @const */ const strategy = new EntireBlockLayoutStrategy(formattingContext, column);
        /** @const */ const iterator = new LayoutIterator(strategy, column.layoutContext);
        return iterator.iterate(nodeContext);
    };

    /**
     * @private
     * @param {adapt.vtree.NodeContext} nodeContext
     * @param {!adapt.layout.Column} column
     * @returns {!adapt.task.Result.<adapt.vtree.NodeContext>}
     */
    RepetitiveElementsOwnerLayoutProcessor.prototype.doLayout = (nodeContext, column) => {
        const formattingContext = getRepetitiveElementsOwnerFormattingContext(nodeContext.formattingContext);

        /**
         * @type {!adapt.task.Frame.<adapt.vtree.NodeContext>}
         */
        const frame = adapt.task.newFrame("doLayout");
        const cont = column.layoutContext.nextInTree(nodeContext, false);
        vivliostyle.selectors.processAfterIfContinues(cont, column).then(resNodeContext => {
            let nextNodeContext = resNodeContext;
            frame.loopWithFrame(loopFrame => {
                while (nextNodeContext) {
                    let pending = true;
                    column.layoutNext(nextNodeContext, false).then(nodeContextParam => {
                        nextNodeContext = nodeContextParam;
                        if (column.pageFloatLayoutContext.isInvalidated()) {
                            loopFrame.breakLoop();
                        } else if (column.pageBreakType) {
                            loopFrame.breakLoop(); // Loop end
                        } else if (nextNodeContext && column.stopByOverflow(nextNodeContext)) {
                            loopFrame.breakLoop(); // Loop end
                        } else if (nextNodeContext && nextNodeContext.after && nextNodeContext.sourceNode == formattingContext.rootSourceNode) {
                            loopFrame.breakLoop(); // Loop end
                        } else {
                            if (pending) {
                                // Sync case
                                pending = false;
                            } else {
                                // Async case
                                loopFrame.continueLoop();
                            }
                        }
                    });
                    if (pending) {
                        // Async case and loop end
                        pending = false;
                        return;
                    }
                    // Sync case
                }
                loopFrame.breakLoop();
            }).then(() => {
                frame.finish(nextNodeContext);
            });
        });
        return frame.result();
    };

    /**
     * @override
     */
    RepetitiveElementsOwnerLayoutProcessor.prototype.finishBreak = function(column, nodeContext, forceRemoveSelf, endOfColumn) {
        return adapt.layout.BlockLayoutProcessor.prototype.finishBreak.call(
            this, column, nodeContext, forceRemoveSelf, endOfColumn);
    };

    /**
     * @override
     */
    RepetitiveElementsOwnerLayoutProcessor.prototype.clearOverflownViewNodes = (column, parentNodeContext, nodeContext, removeSelf) => {
        adapt.layout.BlockLayoutProcessor.prototype.clearOverflownViewNodes(column, parentNodeContext, nodeContext, removeSelf);
    };


    /**
     * @param {adapt.vtree.NodeContext} nodeContext
     * @param {!function(!vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext, !adapt.vtree.NodeContext)} callback
     */
    function eachAncestorNodeContext(nodeContext, callback) {
        for (let nc = nodeContext; nc; nc = nc.parent) {
            const formattingContext = nc.formattingContext;
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
        eachAncestorNodeContext(nodeContext.after ? nodeContext.parent : nodeContext, (formattingContext, nc) => {
            if (formattingContext instanceof vivliostyle.table.TableFormattingContext) return;
            column.fragmentLayoutConstraints.push(
                new RepetitiveElementsOwnerLayoutConstraint(nc));
        });
    };

    /**
     * @param {!vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext} formattingContext
     * @param {!adapt.vtree.NodeContext} nodeContext
     */
    function appendHeader(formattingContext, nodeContext, column) {
        const repetitiveElements = formattingContext.getRepetitiveElements();
        if (repetitiveElements) {
            const rootNodeContext = formattingContext.getRootNodeContext(nodeContext);
            if (rootNodeContext.viewNode) {
                const firstChild = rootNodeContext.viewNode.firstChild;
                return repetitiveElements.appendHeaderToFragment(rootNodeContext, firstChild, column);
            }
        }
        return adapt.task.newResult(true);
    };

    /**
     * @param {!vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext} formattingContext
     * @param {!adapt.vtree.NodeContext} nodeContext
     */
    function appendFooter(formattingContext, nodeContext, column) {
        const repetitiveElements = formattingContext.getRepetitiveElements();
        if (repetitiveElements) {
            if (!repetitiveElements.isSkipFooter) {
                const rootNodeContext = formattingContext.getRootNodeContext(nodeContext);
                if (rootNodeContext.viewNode) {
                    return repetitiveElements.appendFooterToFragment(rootNodeContext, null, column);
                }
            }
        }
        return adapt.task.newResult(true);
    };

    /**
     * @param {adapt.vtree.NodeContext} nodeContext
     * @return {boolean}
     */
    function isFirstContentOfRepetitiveElementsOwner(nodeContext) {
        if (!nodeContext || !nodeContext.parent) return false;
        const formattingContext = getRepetitiveElementsOwnerFormattingContextOrNull(nodeContext.parent);
        if (!formattingContext) return false;
        const repetitiveElements = formattingContext.getRepetitiveElements();
        if (!repetitiveElements) return false;
        return repetitiveElements.isFirstContentNode(nodeContext);
    };

    vivliostyle.repetitiveelements.isFirstContentOfRepetitiveElementsOwner
        = isFirstContentOfRepetitiveElementsOwner;
    vivliostyle.repetitiveelements.appendHeaderToAncestors = appendHeaderToAncestors;
    vivliostyle.repetitiveelements.appendHeader = appendHeader;
    vivliostyle.repetitiveelements.appendFooter = appendFooter;

    /**
     * @param {!adapt.layout.Column} column
     * @return {Array.<!vivliostyle.repetitiveelements.ElementsOffset>}
     */
    vivliostyle.repetitiveelements.collectElementsOffset = column => {
        /** @type {Array.<!vivliostyle.repetitiveelements.ElementsOffset>} */ const repetitiveElements = [];
        for (let current = column; current; current = current.pseudoParent) {
            current.fragmentLayoutConstraints.forEach(constraint => {
                if (constraint instanceof RepetitiveElementsOwnerLayoutConstraint) {
                    var repetitiveElement = constraint.getRepetitiveElements();
                    repetitiveElements.push(repetitiveElement);
                }
                if (constraint instanceof vivliostyle.selectors.AfterIfContinuesLayoutConstraint) {
                    var repetitiveElement = constraint.getRepetitiveElements();
                    repetitiveElements.push(repetitiveElement);
                }
                if (constraint instanceof vivliostyle.table.TableRowLayoutConstraint) {
                    constraint.getElementsOffsetsForTableCell(column).forEach(repetitiveElement => {
                        repetitiveElements.push(repetitiveElement);
                    });
                }
            });
        }
        return repetitiveElements;
    };

    /**
     * @param {adapt.vtree.NodeContext} nodeContext
     * @return {vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext}
     */
    function getRepetitiveElementsOwnerFormattingContextOrNull(nodeContext) {
        const formattingContext = nodeContext.formattingContext;
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
    const layoutProcessor = new RepetitiveElementsOwnerLayoutProcessor();

    vivliostyle.plugin.registerHook(vivliostyle.plugin.HOOKS.RESOLVE_LAYOUT_PROCESSOR, formattingContext => {
        if (formattingContext instanceof RepetitiveElementsOwnerFormattingContext
         && !(formattingContext instanceof vivliostyle.table.TableFormattingContext)) {
            return layoutProcessor;
        }
        return null;
    });

});
