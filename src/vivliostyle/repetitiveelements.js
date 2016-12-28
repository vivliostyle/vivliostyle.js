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

    /**
     * @abstract
     * @constructor
     */
    vivliostyle.repetitiveelements.RepetitiveElementsPossessable = function(rootSourceNode) {
        /** @type {boolean} */ this.doneInitialLayout = false;
        /** @private @const */ this.rootSourceNode = rootSourceNode;
        /** @type {vivliostyle.repetitiveelements.RepetitiveElements} */ this.repetitiveElements = null;
    };
    /** @const */ var RepetitiveElementsPossessable = vivliostyle.repetitiveelements.RepetitiveElementsPossessable;

    /**
     * @return {vivliostyle.repetitiveelements.RepetitiveElements}
     */
    RepetitiveElementsPossessable.prototype.getRepetitiveElements = function() {
        return this.repetitiveElements;
    };
    /**
     * @param {!adapt.vtree.NodeContext} nodeContext
     * @return {boolean}
     */
    RepetitiveElementsPossessable.prototype.isAfterContextOfRootelement = function(nodeContext) {
        return nodeContext.sourceNode === this.rootSourceNode
            && nodeContext.after;
    };
    /**
     * @param {adapt.vtree.NodeContext} position
     * @returns {Element}
     */
    RepetitiveElementsPossessable.prototype.getRootViewNode = function(position) {
        do {
            if (position.sourceNode === this.rootSourceNode) {
                return /** @type {Element} */ (position.viewNode);
            }
        } while (position = position.parent);
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
     * @constructor
     */
    vivliostyle.repetitiveelements.LayoutRetryer = function() {
        /** @type {adapt.vtree.NodeContext} */ this.initialPosition = null;
        /** @type {Array.<adapt.layout.BreakPosition>} */this.initialBreakPositions = null;
    };
    /** @const */ var LayoutRetryer = vivliostyle.repetitiveelements.LayoutRetryer;

    /**
     * @param {!adapt.vtree.NodeContext} nodeContext
     * @param {!adapt.layout.Column} column
     * @returns {!adapt.task.Result.<adapt.vtree.NodeContext>}
     */
    LayoutRetryer.prototype.layout = function(nodeContext, column) {
        this.prepareLayout(nodeContext, column);
        return this.tryLayout(nodeContext, column);
    };
    /**
     * @private
     * @param {!adapt.vtree.NodeContext} nodeContext
     * @param {!adapt.layout.Column} column
     * @returns {!adapt.task.Result.<adapt.vtree.NodeContext>}
     */
    LayoutRetryer.prototype.tryLayout = function(nodeContext, column) {
        var frame = adapt.task.newFrame("vivliostyle.repetitiveelements.layout");

        this.saveState(nodeContext, column);

        var mode = this.resolveLayoutMode(nodeContext);
        mode.doLayout(nodeContext, column).then(function(positionAfter) {
            var accepted = mode.accept(positionAfter, column);
            mode.postLayout(positionAfter, column, accepted);
            if (accepted) {
                frame.finish(positionAfter);
            } else {
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
    LayoutRetryer.prototype.resolveLayoutMode = function(nodeContext) {};

    /**
     * @private
     * @param {!adapt.vtree.NodeContext} nodeContext
     * @param {!adapt.layout.Column} column
     */
    LayoutRetryer.prototype.prepareLayout = function(nodeContext, column) {};

    /**
     * @private
     * @param {!adapt.vtree.NodeContext} initialPosition
     */
    LayoutRetryer.prototype.clearNodes = function(initialPosition) {
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
     * @private
     * @param {!adapt.vtree.NodeContext} nodeContext
     * @param {!adapt.layout.Column} column
     */
    LayoutRetryer.prototype.saveState = function(nodeContext, column) {
        this.initialPosition = nodeContext.copy();
        this.initialBreakPositions = [].concat(column.breakPositions);
    };

    /**
     * @private
     * @param {!adapt.vtree.NodeContext} nodeContext
     * @param {!adapt.layout.Column} column
     */
    LayoutRetryer.prototype.restoreState = function(nodeContext, column) {
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
     * @param {vivliostyle.repetitiveelements.RepetitiveElementsPossessable} formattingContext
     * @implements {vivliostyle.repetitiveelements.LayoutMode}
     */
    vivliostyle.repetitiveelements.LayoutEntireBlock = function(formattingContext) {
        this.formattingContext = formattingContext;
    };
    /** @const */ var LayoutEntireBlock = vivliostyle.repetitiveelements.LayoutEntireBlock;

    /**
     * @abstract
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
            repetitiveElements.updateHeight(column.clientLayout);
        }
        this.formattingContext.doneInitialLayout = true;
    };

    /**
     * @constructor
     * @param {vivliostyle.repetitiveelements.RepetitiveElementsPossessable} formattingContext
     * @implements {vivliostyle.repetitiveelements.LayoutMode}
     */
    vivliostyle.repetitiveelements.LayoutFragmentedBlock = function(formattingContext) {
        this.formattingContext = formattingContext;
    };
    /** @const */ var LayoutFragmentedBlock = vivliostyle.repetitiveelements.LayoutFragmentedBlock;

    /**
     * @override
     */
    LayoutFragmentedBlock.prototype.doLayout = function(nodeContext, column) {
        var repetitiveElements = this.formattingContext.getRepetitiveElements();
        if (repetitiveElements) {
            var rootViewNode = this.formattingContext.getRootViewNode(nodeContext);
            var firstChild = rootViewNode.firstChild;
            repetitiveElements.appendHeaderToFragment(rootViewNode, firstChild);
            repetitiveElements.appendFooterToFragment(rootViewNode, firstChild);
        }
    };

    /**
     * @override
     */
    LayoutFragmentedBlock.prototype.accept = function(nodeContext, column) {
        var repetitiveElements = this.formattingContext.getRepetitiveElements();
        if (!repetitiveElements) return true;

        var breakPosition = column.findAcceptableBreakPosition();

        if (this.formattingContext.isAfterContextOfRootelement(nodeContext)
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
});
