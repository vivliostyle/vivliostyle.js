/**
 * Copyright 2013 Google, Inc.
 * Copyright 2015 Trim-marks Inc.
 *
 * Vivliostyle.js is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle.js is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle.js.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @fileoverview Fills a column with styled content. This file does not communicate with
 * the styling system directly. Instead it goes through the layout interface that gives it one
 * view tree node at a time.
 */
goog.require('goog.asserts');
goog.require('vivliostyle.logging');
goog.require('adapt.base');
goog.require('adapt.geom');
goog.require('adapt.task');
goog.require('vivliostyle.break');
goog.require('adapt.vtree');
goog.require("vivliostyle.layoututil");
goog.require('vivliostyle.pagefloat');

goog.provide('adapt.layout');

/** @const */
adapt.layout.mediaTags = {
    "img": true,
    "svg": true,
    "audio": true,
    "video": true
};

/**
 * Though method used to be used as a workaround for Chrome bug, it seems that the bug has been already fixed:
 *   https://bugs.chromium.org/p/chromium/issues/detail?id=297808
 * We now use this method as a workaround for Firefox bug:
 *   https://bugzilla.mozilla.org/show_bug.cgi?id=1159309
 * @param {adapt.vtree.ClientLayout} clientLayout
 * @param {Node} node
 * @param {Array.<adapt.vtree.ClientRect>} boxes
 * @return {Array.<adapt.vtree.ClientRect>}
 */
adapt.layout.fixBoxesForNode = (clientLayout, boxes, node) => {
    var fullRange = node.ownerDocument.createRange();
    fullRange.setStart(node, 0);
    fullRange.setEnd(node, node.textContent.length);
    var fullBoxes = clientLayout.getRangeClientRects(fullRange);
    var result = [];
    for (var i = 0; i < boxes.length; i++) {
        var box = boxes[i];
        var k;
        for (k = 0; k < fullBoxes.length; k++) {
            var fullBox = fullBoxes[k];
            if (box.top >= fullBox.top && box.bottom <= fullBox.bottom &&
                Math.abs(box.left - fullBox.left) < 1) {
                result.push({top:box.top, left:fullBox.left, bottom:box.bottom, right: fullBox.right});
                break;
            }
        }
        if (k == fullBoxes.length) {
            vivliostyle.logging.logger.warn("Could not fix character box");
            result.push(box);
        }
    }
    return result;
};

/**
 * Calculate the position of the "after" edge in the block-progression
 * dimension. Return 0 if position was determined successfully and return
 * non-zero if position could not be determined and the node should be
 * considered zero-height.
 * @param {adapt.vtree.NodeContext} nodeContext
 * @param {adapt.vtree.ClientLayout} clientLayout
 * @param {number} extraOffset
 * @param {boolean} vertical
 * @return {number}
 */
adapt.layout.calculateEdge = (nodeContext, clientLayout, extraOffset, vertical) => {
    var node = nodeContext.viewNode;
    if (!node)
        return NaN;
    if (node.nodeType == 1) {
        if (nodeContext.after || !nodeContext.inline) {
            var cbox = clientLayout.getElementClientRect(
                /** @type {Element} */ (node));
            if (cbox.right >= cbox.left && cbox.bottom >= cbox.top) {
                if (nodeContext.after) {
                    return vertical ? cbox.left : cbox.bottom;
                } else {
                    return vertical ? cbox.right : cbox.top;
                }
            }
        }
        return NaN;
    } else {
        var edge = NaN;
        var range = node.ownerDocument.createRange();
        var length = node.textContent.length;
        if (!length)
            return NaN;
        if (nodeContext.after)
            extraOffset += length;
        if (extraOffset >= length) {
            extraOffset = length - 1;
        }
        range.setStart(node, extraOffset);
        range.setEnd(node, extraOffset + 1);
        var boxes = clientLayout.getRangeClientRects(range);
        if (vertical && adapt.base.checkVerticalBBoxBug(document.body)) {
            boxes = adapt.layout.fixBoxesForNode(clientLayout, boxes, node);
        }
        var maxSize = 0;
        // Get first of the widest boxes (works around Chrome results for soft hyphens).
        for (var i = 0; i < boxes.length; i++) {
            var box = boxes[i];
            var boxSize = vertical ? box.bottom - box.top : box.right - box.left;
            if (box.right > box.left && box.bottom > box.top &&
                (isNaN(edge) || boxSize > maxSize)) {
                edge = vertical ? box.left : box.bottom;
                maxSize = boxSize;
            }
        }
        return edge; // NaN or not NaN
    }
};

/**
 * Processor doing some special layout (e.g. table layout)
 * @interface
 */
adapt.layout.LayoutProcessor = function() {};

/**
 * Do actual layout in the column starting from given NodeContext.
 * @param {!adapt.vtree.NodeContext} nodeContext
 * @param {!adapt.layout.Column} column
 * @param {boolean} leadingEdge
 * @return {!adapt.task.Result<adapt.vtree.NodeContext>}
 */
adapt.layout.LayoutProcessor.prototype.layout = (nodeContext, column, leadingEdge) => {};

/**
 * Potential edge breaking position.
 * @param {!adapt.vtree.NodeContext} position
 * @param {?string} breakOnEdge
 * @param {boolean} overflows
 * @param {number} columnBlockSize
 * @return {adapt.layout.BreakPosition}
 */
adapt.layout.LayoutProcessor.prototype.createEdgeBreakPosition = (position, breakOnEdge, overflows, columnBlockSize) => {};

/**
 * process nodecontext at the start of a non inline element.
 * @param {!adapt.vtree.NodeContext} nodeContext
 * @return {boolean} return true if you skip the subsequent nodes
 */
adapt.layout.LayoutProcessor.prototype.startNonInlineElementNode = nodeContext => {};

/**
 * process nodecontext after a non inline element.
 * @param {!adapt.vtree.NodeContext} nodeContext
 * @param {boolean} stopAtOverflow
 * @return {boolean} return true if you skip the subsequent nodes
 */
adapt.layout.LayoutProcessor.prototype.afterNonInlineElementNode = (nodeContext, stopAtOverflow) => {};

/**
 * @param {!adapt.layout.Column} column
 * @param {adapt.vtree.NodeContext} nodeContext
 * @param {boolean} forceRemoveSelf
 * @param {boolean} endOfColumn
 * @return {?adapt.task.Result.<boolean>} holing true
 */
adapt.layout.LayoutProcessor.prototype.finishBreak = (column, nodeContext, forceRemoveSelf, endOfColumn) => {};

/**
 * @param {!adapt.layout.Column} column
 * @param {adapt.vtree.NodeContext} parentNodeContext
 * @param {!adapt.vtree.NodeContext} nodeContext
 * @param {boolean} removeSelf
 */
adapt.layout.LayoutProcessor.prototype.clearOverflownViewNodes = (column, parentNodeContext, nodeContext, removeSelf) => {};

/**
 * Resolver finding an appropriate LayoutProcessor given a formatting context
 * @constructor
 */
adapt.layout.LayoutProcessorResolver = function() {};

/**
 * Find LayoutProcessor corresponding to given formatting context.
 * @param {!adapt.vtree.FormattingContext} formattingContext
 * @return {!adapt.layout.LayoutProcessor}
 */
adapt.layout.LayoutProcessorResolver.prototype.find = formattingContext => {
    /** @type {!Array<!vivliostyle.plugin.ResolveLayoutProcessorHook>} */ var hooks =
        vivliostyle.plugin.getHooksForName(vivliostyle.plugin.HOOKS.RESOLVE_LAYOUT_PROCESSOR);
    for (var i = 0; i < hooks.length; i++) {
        var processor = hooks[i](formattingContext);
        if (processor) {
            return processor;
        }
    }
    throw new Error("No processor found for a formatting context: " + formattingContext.getName());
};

/**
 * Represents a constraint on layout
 * @interface
 */
adapt.layout.LayoutConstraint = function() {};

/**
 * Returns if this constraint allows the node context to be laid out at the current position.
 * @param {adapt.vtree.NodeContext} nodeContext
 * @return {boolean}
 */
adapt.layout.LayoutConstraint.prototype.allowLayout = nodeContext => {};

/**
 * Represents a constraint that allows layout if all the constraints it contains allow layout.
 * @param {!Array<!adapt.layout.LayoutConstraint>} constraints
 * @constructor
 * @implements {adapt.layout.LayoutConstraint}
 */
adapt.layout.AllLayoutConstraint = function(constraints) {
    /** @const */ this.constraints = constraints;
};

/**
 * @override
 */
adapt.layout.AllLayoutConstraint.prototype.allowLayout = function(nodeContext) {
    return this.constraints.every(c => c.allowLayout(nodeContext));
};


/**
 * Represents constraints on laying out fragments
 * @interface
 */
adapt.layout.FragmentLayoutConstraint = function() {};

/**
 * @param {adapt.vtree.NodeContext} nodeContext
 * @param {adapt.vtree.NodeContext} overflownNodeContext
 * @param {!adapt.layout.Column} column
 * @return {boolean}
 */
adapt.layout.FragmentLayoutConstraint.prototype.allowLayout = (nodeContext, overflownNodeContext, column) => {};

/**
 * @param {adapt.vtree.NodeContext} nodeContext
 * @return {boolean}
 */
adapt.layout.FragmentLayoutConstraint.prototype.nextCandidate = nodeContext => {};

/**
 * @param {boolean} allowed
 * @param {adapt.vtree.NodeContext} positionAfter
 * @param {adapt.vtree.NodeContext} initialPosition
 * @param {!adapt.layout.Column} column
 */
adapt.layout.FragmentLayoutConstraint.prototype.postLayout = (allowed, positionAfter, initialPosition, column) => {};

/**
 * @param {adapt.vtree.NodeContext} nodeContext
 * @param {!adapt.layout.Column} column
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.layout.FragmentLayoutConstraint.prototype.finishBreak = (nodeContext, column) => {};

/**
 * @param {adapt.layout.FragmentLayoutConstraint} constraint
 * @return {boolean}
 */
adapt.layout.FragmentLayoutConstraint.prototype.equalsTo = constraint => {};

/**
 * @return {number}
 */
adapt.layout.FragmentLayoutConstraint.prototype.getPriorityOfFinishBreak = () => {};

/**
 * Potential breaking position.
 * @interface
 */
adapt.layout.BreakPosition = function() {};

/**
 * @param {!adapt.layout.Column} column
 * @param {number} penalty
 * @return {adapt.vtree.NodeContext} break position, if found
 */
adapt.layout.BreakPosition.prototype.findAcceptableBreak = (column, penalty) => {};

/**
 * @return {number} penalty for this break position
 */
adapt.layout.BreakPosition.prototype.getMinBreakPenalty = () => {};

/**
 * @param {!adapt.layout.Column} column
 * @return {{current:number, minimum:number}}
 */
adapt.layout.BreakPosition.prototype.calculateOffset = column => {};

/**
 * @param {!adapt.layout.Column} column
 */
adapt.layout.BreakPosition.prototype.breakPositionChosen = column => {};

/**
 * @abstract
 * @constructor
 * @implements {adapt.layout.BreakPosition}
 */
adapt.layout.AbstractBreakPosition = function() {};

/**
 * @abstract
 */
adapt.layout.AbstractBreakPosition.prototype.findAcceptableBreak = (column, penalty) => {};

/**
 * @abstract
 */
adapt.layout.AbstractBreakPosition.prototype.getMinBreakPenalty = () => {};

/**
 * @return {{current:number, minimum:number}}
 */
adapt.layout.AbstractBreakPosition.prototype.calculateOffset = function(column) {
    return calculateOffset(this.getNodeContext(),
        vivliostyle.repetitiveelements.collectElementsOffset(column));
};

/**
 * @override
 */
adapt.layout.AbstractBreakPosition.prototype.breakPositionChosen = column => {};

/**
 * @return {adapt.vtree.NodeContext}
 */
adapt.layout.AbstractBreakPosition.prototype.getNodeContext = () => null;

/**
 * @param {adapt.vtree.NodeContext} nodeContext
 * @param {Array.<vivliostyle.repetitiveelements.ElementsOffset>} elementsOffsets
 * @return {{current:number, minimum:number}}
 */
function calculateOffset(nodeContext, elementsOffsets) {
    return {
        current: elementsOffsets.reduce((val, repetitiveElement) => val + repetitiveElement.calculateOffset(nodeContext), 0),
        minimum: elementsOffsets.reduce((val, repetitiveElement) => val + repetitiveElement.calculateMinimumOffset(nodeContext), 0)
    };
};
adapt.layout.calculateOffset = calculateOffset;

/**
 * @typedef {{breakPosition: adapt.layout.BreakPosition, nodeContext: adapt.vtree.NodeContext}}
 */
adapt.layout.BreakPositionAndNodeContext;

/**
 * Potential breaking position inside CSS box (between lines).
 * @constructor
 * @param {Array.<adapt.vtree.NodeContext>} checkPoints array of breaking points for
 *    breakable block
 * @param {number} penalty
 * @extends {adapt.layout.AbstractBreakPosition}
 */
adapt.layout.BoxBreakPosition = function(checkPoints, penalty) {
    adapt.layout.AbstractBreakPosition.call(this);
    /** @const */ this.checkPoints = checkPoints;
    /** @const */ this.penalty = penalty;
    /** @private @type {boolean} */ this.alreadyEvaluated = false;
    /** @type {adapt.vtree.NodeContext} */ this.breakNodeContext = null;
};
goog.inherits(adapt.layout.BoxBreakPosition, adapt.layout.AbstractBreakPosition);

/**
 * @override
 */
adapt.layout.BoxBreakPosition.prototype.findAcceptableBreak = function(column, penalty) {
    if (penalty < this.getMinBreakPenalty())
        return null;
    if (!this.alreadyEvaluated) {
        this.breakNodeContext = column.findBoxBreakPosition(this, penalty > 0);
        this.alreadyEvaluated = true;
    }
    return this.breakNodeContext;
};

/**
 * @override
 */
adapt.layout.BoxBreakPosition.prototype.getMinBreakPenalty = function() {
    return this.penalty;
};

/** @override */
adapt.layout.BoxBreakPosition.prototype.getNodeContext = function() {
    return this.alreadyEvaluated
        ? this.breakNodeContext
        : this.checkPoints[this.checkPoints.length-1];
};

/**
 * Potential edge breaking position.
 * @constructor
 * @param {!adapt.vtree.NodeContext} position
 * @param {?string} breakOnEdge
 * @param {boolean} overflows
 * @param {number} computedBlockSize
 * @extends {adapt.layout.AbstractBreakPosition}
 */
adapt.layout.EdgeBreakPosition = function(position, breakOnEdge, overflows,
    computedBlockSize) {
    adapt.layout.AbstractBreakPosition.call(this);
    /** @const */ this.position = position;
    /** @const */ this.breakOnEdge = breakOnEdge;
    /** @type {boolean} */ this.overflows = overflows;
    /** @type {boolean} */ this.overflowIfRepetitiveElementsDropped = overflows;
    /** @const */ this.computedBlockSize = computedBlockSize;
    /** @protected @type {boolean} */ this.isEdgeUpdated = false;
    /** @private @type {number} */ this.edge = 0;
};
goog.inherits(adapt.layout.EdgeBreakPosition, adapt.layout.AbstractBreakPosition);

/**
 * @override
 */
adapt.layout.EdgeBreakPosition.prototype.findAcceptableBreak = function(column, penalty) {
    this.updateOverflows(column);
    if (penalty < this.getMinBreakPenalty()) {
        return null;
    }
    return column.findEdgeBreakPosition(this);
};

/**
 * @override
 */
adapt.layout.EdgeBreakPosition.prototype.getMinBreakPenalty = function() {
    if (!this.isEdgeUpdated) {
        throw new Error("EdgeBreakPosition.prototype.updateEdge not called");
    }
    var preferDropping = this.isFirstContentOfRepetitiveElementsOwner() && !this.overflowIfRepetitiveElementsDropped;
    return (vivliostyle.break.isAvoidBreakValue(this.breakOnEdge) ? 1 : 0)
        + (this.overflows && !preferDropping ? 3 : 0)
        + (this.position.parent ? this.position.parent.breakPenalty : 0);
};

/**
 * @private
 * @param {!adapt.layout.Column} column
 */
adapt.layout.EdgeBreakPosition.prototype.updateEdge = function(column) {
    var clonedPaddingBorder = column.calculateClonedPaddingBorder(this.position);
    this.edge = adapt.layout.calculateEdge(this.position, column.clientLayout, 0, column.vertical) + clonedPaddingBorder;
    this.isEdgeUpdated = true;
};

/**
 * @private
 * @param {!adapt.layout.Column} column
 */
adapt.layout.EdgeBreakPosition.prototype.updateOverflows = function(column) {
    if (!this.isEdgeUpdated) {
        this.updateEdge(column);
    }
    var edge = this.edge;
    var offsets = this.calculateOffset(column);
    this.overflowIfRepetitiveElementsDropped = column.isOverflown(edge + ((column.vertical ? -1 : 1) * offsets.minimum));
    this.overflows = this.position.overflow = column.isOverflown(edge + ((column.vertical ? -1 : 1) * offsets.current));
};

/** @override */
adapt.layout.EdgeBreakPosition.prototype.getNodeContext = function() {
    return this.position;
};

/**
 * @private
 * @return {boolean}
 */
adapt.layout.EdgeBreakPosition.prototype.isFirstContentOfRepetitiveElementsOwner = function() {
    return vivliostyle.repetitiveelements.isFirstContentOfRepetitiveElementsOwner(this.getNodeContext());
};

/**
 * @param {Array.<adapt.vtree.NodeContext>} checkPoints
 */
adapt.layout.validateCheckPoints = checkPoints => {
    for (var i = 1; i < checkPoints.length; i++) {
        var cp0 = checkPoints[i-1];
        var cp1 = checkPoints[i];
        if (cp0 === cp1) {
            vivliostyle.logging.logger.warn("validateCheckPoints: duplicate entry");
        } else if (cp0.boxOffset >= cp1.boxOffset) {
            vivliostyle.logging.logger.warn("validateCheckPoints: incorrect boxOffset");
        } else if (cp0.sourceNode == cp1.sourceNode) {
            if (cp1.after) {
                if (cp0.after) {
                    vivliostyle.logging.logger.warn("validateCheckPoints: duplicate after points");
                }
            } else {
                if (!cp0.after) {
                    if (cp1.boxOffset - cp0.boxOffset != cp1.offsetInNode - cp0.offsetInNode) {
                        vivliostyle.logging.logger.warn("validateCheckPoints: boxOffset inconsistent with offsetInNode");
                    }
                }
            }
        }
    }
};

/**
 * @param {adapt.vtree.FormattingContext} parent
 * @constructor
 * @implements {adapt.vtree.FormattingContext}
 */
adapt.layout.BlockFormattingContext = function(parent) {
    /** @private @const */ this.parent = parent;
};

/**
 * @override
 */
adapt.layout.BlockFormattingContext.prototype.getName = () => "Block formatting context (adapt.layout.BlockFormattingContext)";

/**
 * @override
 */
adapt.layout.BlockFormattingContext.prototype.isFirstTime = (nodeContext, firstTime) => firstTime;

/**
 * @override
 */
adapt.layout.BlockFormattingContext.prototype.getParent = function() {
    return this.parent;
};

/** @override */
adapt.layout.BlockFormattingContext.prototype.saveState = () => {};

/** @override */
adapt.layout.BlockFormattingContext.prototype.restoreState = state => {};


/**
 * @constructor
 * @param {Element} element
 * @param {!adapt.vtree.LayoutContext} layoutContext
 * @param {adapt.vtree.ClientLayout} clientLayout
 * @param {adapt.layout.LayoutConstraint} layoutConstraint
 * @param {!vivliostyle.pagefloat.PageFloatLayoutContext} pageFloatLayoutContext
 * @extends {adapt.vtree.Container}
 */
adapt.layout.Column = function(element, layoutContext, clientLayout, layoutConstraint, pageFloatLayoutContext) {
    adapt.vtree.Container.call(this, element);
    /** @type {Node} */ this.last = element.lastChild;
    /** @type {!adapt.vtree.LayoutContext} */ this.layoutContext = layoutContext;
    /** @type {adapt.vtree.ClientLayout} */ this.clientLayout = clientLayout;
    /** @const */ this.layoutConstraint = layoutConstraint;
    /** @type {Document} */ this.viewDocument = element.ownerDocument;
    /** @const */ this.pageFloatLayoutContext = pageFloatLayoutContext;
    pageFloatLayoutContext.setContainer(this);
    /** @type {adapt.vtree.FormattingContext} */ this.flowRootFormattingContext = null;
    /** @type {boolean} */ this.isFloat = false;
    /** @type {boolean} */ this.isFootnote = false;
    /** @type {number} */ this.startEdge = 0;
    /** @type {number} */ this.endEdge = 0;
    /** @type {number} */ this.beforeEdge = 0;
    /** @type {number} */ this.afterEdge = 0;
    /** @type {number} */ this.footnoteEdge = 0;
    /** @type {adapt.geom.Rect} */ this.box = null;
    /** @type {Array.<adapt.vtree.ChunkPosition>} */ this.chunkPositions = null;
    /** @type {Array.<adapt.geom.Band>} */ this.bands = null;
    /** @type {boolean} */ this.overflown = false;
    /** @type {Array.<adapt.layout.BreakPosition>} */ this.breakPositions = null;
    /** @type {?string} */ this.pageBreakType = null;
    /** @type {boolean} */ this.forceNonfitting = true;
    /** @type {number} */ this.leftFloatEdge = 0;  // bottom of the bottommost left float
    /** @type {number} */ this.rightFloatEdge = 0;  // bottom of the bottommost right float
    /** @type {number} */ this.bottommostFloatTop = 0;  // Top of the bottommost float
    /** @type {boolean} */ this.stopAtOverflow = true;
    /** @type {?adapt.vtree.NodePosition} */ this.lastAfterPosition = null;
    /** @type {!Array.<adapt.layout.FragmentLayoutConstraint>} */ this.fragmentLayoutConstraints = [];
    /** @type {adapt.layout.Column} */ this.pseudoParent = null;
    /** @type {?adapt.vtree.NodeContext} */ this.nodeContextOverflowingDueToRepetitiveElements = null;
    /** @type {number} */ this.blockDistanceToBlockEndFloats = NaN;
};
goog.inherits(adapt.layout.Column, adapt.vtree.Container);

/**
 * @returns {number}
 */
adapt.layout.Column.prototype.getTopEdge = function() {
    return this.vertical ? this.startEdge : this.beforeEdge;
};

/**
 * @returns {number}
 */
adapt.layout.Column.prototype.getBottomEdge = function() {
    return this.vertical ? this.endEdge : this.afterEdge;
};

/**
 * @returns {number}
 */
adapt.layout.Column.prototype.getLeftEdge = function() {
    return this.vertical ? this.afterEdge : this.startEdge;
};

/**
 * @returns {number}
 */
adapt.layout.Column.prototype.getRightEdge = function() {
    return this.vertical ? this.beforeEdge : this.endEdge;
};

/**
 * @param {!adapt.vtree.NodeContext} nodeContext
 * @returns {boolean}
 */
adapt.layout.Column.prototype.isFloatNodeContext = function(nodeContext) {
    return !!nodeContext.floatSide && (!this.isFloat || !!nodeContext.parent);
};

/**
 * @param {adapt.vtree.NodeContext} nodeContext
 * @returns {boolean}
 */
adapt.layout.Column.prototype.stopByOverflow = function(nodeContext) {
    return this.stopAtOverflow && !!nodeContext && nodeContext.overflow;
};

/**
 * @param {number} edge
 * @return {boolean}
 */
adapt.layout.Column.prototype.isOverflown = function(edge) {
    if (this.vertical) {
        return edge < this.footnoteEdge;
    } else {
        return edge > this.footnoteEdge;
    }
};

/**
 * @returns {Array.<adapt.geom.Shape>}
 */
adapt.layout.Column.prototype.getExclusions = function() {
    var pageFloatExclusions = this.pageFloatLayoutContext.getFloatFragmentExclusions();
    return this.exclusions.concat(pageFloatExclusions);
};

/**
 * @param {Node} parentNode
 * @param {Node} viewNode
 * @return {void}
 */
adapt.layout.removeFollowingSiblings = (parentNode, viewNode) => {
    if (!parentNode)
        return;
    /** @type {Node} */ var lastChild;
    while ((lastChild = parentNode.lastChild) != viewNode)
        parentNode.removeChild(lastChild);
};

/**
 * @param {adapt.vtree.NodePosition} position
 * @return {!adapt.task.Result.<!adapt.vtree.NodeContext>}
 */
adapt.layout.Column.prototype.openAllViews = function(position) {
    var self = this;
    /** @type {!adapt.task.Frame.<!adapt.vtree.NodeContext>} */ var frame =
        adapt.task.newFrame("openAllViews");
    var steps = position.steps;
    self.layoutContext.setViewRoot(self.element, self.isFootnote);
    var stepIndex = steps.length - 1;
    var nodeContext = null;
    frame.loop(() => {
        while (stepIndex >= 0) {
            var prevContext = nodeContext;
            var step = steps[stepIndex];
            nodeContext = adapt.vtree.makeNodeContextFromNodePositionStep(step, prevContext);
            if (stepIndex === steps.length - 1 && !nodeContext.formattingContext) {
                nodeContext.formattingContext = self.flowRootFormattingContext;
            }
            if (stepIndex == 0) {
                nodeContext.offsetInNode = self.calculateOffsetInNodeForNodeContext(position);
                nodeContext.after = position.after;
                nodeContext.preprocessedTextContent = position.preprocessedTextContent;
                if (nodeContext.after) {
                    break;
                }
            }
            var r = self.layoutContext.setCurrent(nodeContext, stepIndex == 0 && nodeContext.offsetInNode == 0);
            stepIndex--;
            if (r.isPending())
                return r;
        }
        return adapt.task.newResult(false);
    }).then(() => {
        goog.asserts.assert(nodeContext);
        frame.finish(nodeContext);
    });
    return frame.result();
};

/**
 * @param {adapt.vtree.NodePosition} position
 * @return {number}
 */
adapt.layout.Column.prototype.calculateOffsetInNodeForNodeContext = position => position.preprocessedTextContent
    ? vivliostyle.diff.resolveNewIndex(position.preprocessedTextContent, position.offsetInNode)
    : position.offsetInNode;

adapt.layout.firstCharPattern =
    /^[^A-Za-z0-9_\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]*([A-Za-z0-9_\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527][^A-Za-z0-9_\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]*)?/;

/**
 * @param {adapt.vtree.NodeContext} position
 * @param {number} count first-XXX nesting identifier
 * @return {!adapt.task.Result.<adapt.vtree.NodeContext>}
 */
adapt.layout.Column.prototype.maybePeelOff = function(position, count) {
    if (position.firstPseudo && position.inline && !position.after && position.firstPseudo.count == 0) {
        // first char
        if (position.viewNode.nodeType != 1) {
            var text = position.viewNode.textContent;
            var r = text.match(adapt.layout.firstCharPattern);
            return this.layoutContext.peelOff(position, r[0].length);
        }
    }
    return /** @type {!adapt.task.Result.<adapt.vtree.NodeContext>} */ (adapt.task.newResult(position));
};

/**
 * Builds the view until a CSS box edge is reached.
 * @param {adapt.vtree.NodeContext} position start source position.
 * @param {Array.<adapt.vtree.NodeContext>} checkPoints array to append
 *                      possible breaking points.
 * @return {!adapt.task.Result.<adapt.vtree.NodeContext>} holding box edge position reached
 *                      or null if the source is exhausted.
 */
adapt.layout.Column.prototype.buildViewToNextBlockEdge = function(position, checkPoints) {
    var self = this;
    var violateConstraint = false;
    /** @type {!adapt.task.Frame.<adapt.vtree.NodeContext>} */ var frame
        = adapt.task.newFrame("buildViewToNextBlockEdge");
    frame.loopWithFrame(bodyFrame => {
        if (position.viewNode && !adapt.layout.isSpecialNodeContext(position))
            checkPoints.push(position.copy());
        self.maybePeelOff(position, 0).then(position1Param => {
            var position1 = /** @type {adapt.vtree.NodeContext} */ (position1Param);
            if (position1 !== position) {
                position = position1;
                if (!adapt.layout.isSpecialNodeContext(position))
                    checkPoints.push(position.copy());
            }
            self.nextInTree(position).then(positionParam => {
                position = /** @type {adapt.vtree.NodeContext} */ (positionParam);
                if (!position) {
                    // Exit the loop
                    bodyFrame.breakLoop();
                    return;
                }
                if (violateConstraint || !self.layoutConstraint.allowLayout(position)) {
                    violateConstraint = true;
                    position = position.modify();
                    position.overflow = true;
                }
                if (self.isFloatNodeContext(position) && !self.vertical) {
                    self.layoutFloatOrFootnote(position).then(positionParam => {
                        position = /** @type {adapt.vtree.NodeContext} */ (positionParam);
                        if (self.pageFloatLayoutContext.isInvalidated()) {
                            position = null;
                        }
                        if (!position) {
                            bodyFrame.breakLoop();
                            return;
                        }
                        bodyFrame.continueLoop();
                    });
                } else if (!position.inline) {
                    // Exit the loop
                    bodyFrame.breakLoop();
                } else {
                    // Continue the loop
                    bodyFrame.continueLoop();
                }
            });
        });
    }).then(() => {
        frame.finish(position);
    });
    return frame.result();
};

/**
 * @param {adapt.vtree.NodeContext} position
 * @param {boolean=} atUnforcedBreak
 * @return {!adapt.task.Result.<adapt.vtree.NodeContext>}
 */
adapt.layout.Column.prototype.nextInTree = function(position, atUnforcedBreak) {
    var cont = this.layoutContext.nextInTree(position, atUnforcedBreak);
    return vivliostyle.selectors.processAfterIfContinues(cont, this);
};

/**
 * Builds the view for a single unbreakable element.
 * @param {adapt.vtree.NodeContext} position start source position.
 * @return {!adapt.task.Result.<adapt.vtree.NodeContext>} holding box edge position reached
 *       or null if the source is exhausted.
 */
adapt.layout.Column.prototype.buildDeepElementView = function(position) {
    if (!position.viewNode) {
        return adapt.task.newResult(position);
    }
    /** @type {Array.<adapt.vtree.NodeContext>} */ var checkPoints = [];
    var sourceNode = position.sourceNode;
    var self = this;

    /** @type {!adapt.task.Frame.<adapt.vtree.NodeContext>} */ var frame =
        adapt.task.newFrame("buildDeepElementView");
    // TODO: end the loop based on depth, not sourceNode comparison
    frame.loopWithFrame(bodyFrame => {
        if (position.viewNode && position.inline && !adapt.layout.isSpecialNodeContext(position)) {
            checkPoints.push(position.copy());
        } else {
            if (checkPoints.length > 0) {
                self.postLayoutBlock(position, checkPoints);
            }
            checkPoints = [];
        }
        self.maybePeelOff(position, 0).then(position1Param => {
            var position1 = /** @type {adapt.vtree.NodeContext} */ (position1Param);
            if (position1 !== position) {
                var p = position1;
                while (p && p.sourceNode != sourceNode) {
                    p = p.parent;
                }
                if (p == null) {
                    // outside of the subtree
                    position = position1;
                    bodyFrame.breakLoop();
                    return;
                }
                if (!adapt.layout.isSpecialNodeContext(position1))
                    checkPoints.push(position1.copy());
            }
            self.nextInTree(position1).then(positionParam => {
                position = /** @type {adapt.vtree.NodeContext} */ (positionParam);
                if (!position || position.sourceNode == sourceNode) {
                    bodyFrame.breakLoop();
                } else if (!self.layoutConstraint.allowLayout(position)) {
                    position = position.modify();
                    position.overflow = true;
                    if (self.stopAtOverflow) {
                        bodyFrame.breakLoop();
                    } else {
                        bodyFrame.continueLoop();
                    }
                } else {
                    bodyFrame.continueLoop();
                }
            });
        });
    }).then(() => {
        if (checkPoints.length > 0) {
            self.postLayoutBlock(position, checkPoints);
        }
        frame.finish(position);
    });
    return frame.result();
};

/**
 * Create a single floating element (for exclusion areas).
 * @param {Node} ref container's child to insert float before (can be null).
 * @param {string} side float side ("left" or "right").
 * @param {number} width float inline dimension.
 * @param {number} height float box progression dimension.
 * @return {Element} newly created float element.
 */
adapt.layout.Column.prototype.createFloat = function(ref, side, width,
                                                     height) {
    var div = this.viewDocument.createElement("div");
    if (this.vertical) {
        if (height >= this.height) {
            height -= 0.1;
        }
        adapt.base.setCSSProperty(div, "height", width + "px");
        adapt.base.setCSSProperty(div, "width", height + "px");
    } else {
        if (width >= this.width) {
            width -= 0.1;
        }
        adapt.base.setCSSProperty(div, "width", width + "px");
        adapt.base.setCSSProperty(div, "height", height + "px");
    }
    adapt.base.setCSSProperty(div, "float", side);
    adapt.base.setCSSProperty(div, "clear", side);
    // enable to visualize
    // adapt.base.setCSSProperty(div, "background-color", "#50F0FF");
    this.element.insertBefore(div, ref);
    return div;
};

/**
 * Remove all the exclusion floats.
 * @return {void}
 */
adapt.layout.Column.prototype.killFloats = function() {
    var c = this.element.firstChild;
    while (c) {
        var nc = c.nextSibling;
        if (c.nodeType == 1) {
            var e = /** @type {HTMLElement} */ (c);
            var f = e.style.cssFloat;
            if (f == "left" || f == "right") {
                this.element.removeChild(e);
            } else {
                break;
            }
        }
        c = nc;
    }
};

/**
 * Create exclusion floats for a column.
 * @return {void}
 */
adapt.layout.Column.prototype.createFloats = function() {
    var ref = this.element.firstChild;
    var bands = this.bands;
    var x1 = this.vertical ? this.getTopEdge() : this.getLeftEdge();
    var x2 = this.vertical ? this.getBottomEdge() : this.getRightEdge();
    for (var ri = 0; ri < bands.length; ri++) {
        var band = bands[ri];
        var height = band.y2 - band.y1;
        band.left = this.createFloat(
            ref, "left", band.x1 - x1, height);
        band.right = this.createFloat(
            ref, "right", x2 - band.x2, height);
    }
};

/**
 * @param {adapt.vtree.NodeContext} nodeContext position after the block
 * @param {Array.<adapt.vtree.NodeContext>} checkPoints array of possible breaking points.
 * @param {number} index index of the breaking point
 * @param {number} boxOffset box offset
 * @return {number} edge position
 */
adapt.layout.Column.prototype.calculateEdge = function(nodeContext, checkPoints, index, boxOffset) {
    var edge;
    if (nodeContext && adapt.layout.isOrphan(nodeContext.viewNode)) {
        return NaN;
    } else if (nodeContext && nodeContext.after && !nodeContext.inline) {
        edge = adapt.layout.calculateEdge(nodeContext, this.clientLayout, 0, this.vertical);
        if (!isNaN(edge))
            return edge;
    }
    nodeContext = checkPoints[index];
    var offset = boxOffset - nodeContext.boxOffset;
    while (true) {
        edge = adapt.layout.calculateEdge(nodeContext, this.clientLayout, offset, this.vertical);
        if (!isNaN(edge))
            return edge;
        if (offset > 0) {
            offset--;
            continue;
        }
        index--;
        if (index < 0)
            return this.beforeEdge;
        nodeContext = checkPoints[index];
        if (nodeContext.viewNode.nodeType != 1)
            offset = nodeContext.viewNode.textContent.length;
    }
};

/**
 * Parse CSS computed length (in pixels)
 * @param {string|number} val CSS length in "px" units or a number.
 * @return {number} value in pixels or 0 if not parsable
 */
adapt.layout.Column.prototype.parseComputedLength = val => {
    if (typeof val == "number") {
        return val;
    }
    var r = val.match(/^(-?[0-9]*(\.[0-9]*)?)px$/);
    if (r)
        return parseFloat(r[0]);
    return 0;
};

/**
 * Reads element's computed CSS margin.
 * @param {Element} element
 * @return {!adapt.geom.Insets}
 */
adapt.layout.Column.prototype.getComputedMargin = function(element) {
    var style = this.clientLayout.getElementComputedStyle(element);
    var insets = new adapt.geom.Insets(0, 0, 0, 0);
    if (style) {
        insets.left = this.parseComputedLength(style.marginLeft);
        insets.top = this.parseComputedLength(style.marginTop);
        insets.right = this.parseComputedLength(style.marginRight);
        insets.bottom = this.parseComputedLength(style.marginBottom);
    }
    return insets;
};

/**
 * Reads element's computed padding + borders.
 * @param {Element} element
 * @returns {adapt.geom.Insets}
 */
adapt.layout.Column.prototype.getComputedPaddingBorder = function(element) {
    var style = this.clientLayout.getElementComputedStyle(element);
    var insets = new adapt.geom.Insets(0, 0, 0, 0);
    if (style) {
        insets.left =
            this.parseComputedLength(style.borderLeftWidth) +
            this.parseComputedLength(style.paddingLeft);
        insets.top =
            this.parseComputedLength(style.borderTopWidth) +
            this.parseComputedLength(style.paddingTop);
        insets.right =
            this.parseComputedLength(style.borderRightWidth) +
            this.parseComputedLength(style.paddingRight);
        insets.bottom =
            this.parseComputedLength(style.borderBottomWidth) +
            this.parseComputedLength(style.paddingBottom);
    }
    return insets;
};

/**
 * Reads element's computed CSS insets(margins + border + padding or margins : depends on box-sizing)
 * @param {Element} element
 * @return {adapt.geom.Insets}
 */
adapt.layout.Column.prototype.getComputedInsets = function(element) {
    var style = this.clientLayout.getElementComputedStyle(element);
    var insets = new adapt.geom.Insets(0, 0, 0, 0);
    if (style) {
        if (style.boxSizing == "border-box")
            return this.getComputedMargin(element);

        insets.left =
            this.parseComputedLength(style.marginLeft) +
            this.parseComputedLength(style.borderLeftWidth) +
            this.parseComputedLength(style.paddingLeft);
        insets.top =
            this.parseComputedLength(style.marginTop) +
            this.parseComputedLength(style.borderTopWidth) +
            this.parseComputedLength(style.paddingTop);
        insets.right =
            this.parseComputedLength(style.marginRight) +
            this.parseComputedLength(style.borderRightWidth) +
            this.parseComputedLength(style.paddingRight);
        insets.bottom =
            this.parseComputedLength(style.marginBottom) +
            this.parseComputedLength(style.borderBottomWidth) +
            this.parseComputedLength(style.paddingBottom);
    }
    return insets;
};


/**
 * Set element's computed CSS insets to Column Container
 * @param {Element} element
 * @param {adapt.layout.Column} container
 */
adapt.layout.Column.prototype.setComputedInsets = function(element, container) {
    var style = this.clientLayout.getElementComputedStyle(element);
    if (style) {
        container.marginLeft = this.parseComputedLength(style.marginLeft);
        container.borderLeft = this.parseComputedLength(style.borderLeftWidth);
        container.paddingLeft = this.parseComputedLength(style.paddingLeft);
        container.marginTop = this.parseComputedLength(style.marginTop);
        container.borderTop = this.parseComputedLength(style.borderTopWidth);
        container.paddingTop = this.parseComputedLength(style.paddingTop);
        container.marginRight = this.parseComputedLength(style.marginRight);
        container.borderRight = this.parseComputedLength(style.borderRightWidth);
        container.paddingRight = this.parseComputedLength(style.paddingRight);
        container.marginBottom = this.parseComputedLength(style.marginBottom);
        container.borderBottom = this.parseComputedLength(style.borderBottomWidth);
        container.paddingBottom = this.parseComputedLength(style.paddingBottom);
    }
};

/**
 * Set element's computed width and height to Column Container
 * @param {Element} element
 * @param {adapt.layout.Column} container
 */
adapt.layout.Column.prototype.setComputedWidthAndHeight = function(element, container) {
    var style = this.clientLayout.getElementComputedStyle(element);
    if (style) {
        container.width = this.parseComputedLength(style.width);
        container.height = this.parseComputedLength(style.height);
    }
};

/**
 * Layout a single unbreakable element.
 * @param {adapt.vtree.NodeContext} nodeContextIn
 * @return {!adapt.task.Result.<adapt.vtree.NodeContext>}
 */
adapt.layout.Column.prototype.layoutUnbreakable = function(nodeContextIn) {
    return this.buildDeepElementView(nodeContextIn);
};

/**
 * Layout a single float element.
 * @param {!adapt.vtree.NodeContext} nodeContext
 * @return {!adapt.task.Result.<adapt.vtree.NodeContext>}
 */
adapt.layout.Column.prototype.layoutFloat = function(nodeContext) {
    var self = this;
    /** @type {!adapt.task.Frame.<adapt.vtree.NodeContext>} */ var frame
        = adapt.task.newFrame("layoutFloat");
    var element = /** @type {!Element} */ (nodeContext.viewNode);
    var floatSide = /** @type {string} */ (nodeContext.floatSide);

    adapt.base.setCSSProperty(element, "float", "none");
    adapt.base.setCSSProperty(element, "display", "inline-block");
    adapt.base.setCSSProperty(element, "vertical-align", "top");
    self.buildDeepElementView(nodeContext).then(nodeContextAfter => {
        var floatBBox = self.clientLayout.getElementClientRect(element);
        var margin = self.getComputedMargin(element);
        var floatBox = new adapt.geom.Rect(floatBBox.left - margin.left,
            floatBBox.top - margin.top, floatBBox.right + margin.right,
            floatBBox.bottom + margin.bottom);

        var x1 = self.startEdge;
        var x2 = self.endEdge;
        var parent = nodeContext.parent;
        while (parent && parent.inline) {
            parent = parent.parent;
        }
        if (parent) {
            // Position it at the parent element's edge.
            // We need to get the edge of the parent's content area, calling getElementClientRect will
            // also give us borders. Avoid it by creating a temporary element and using it for measurment.
            var probe = parent.viewNode.ownerDocument.createElement("div");
            probe.style.left = "0px";
            probe.style.top = "0px";
            if (self.vertical) {
                probe.style.bottom = "0px";
                probe.style.width = "1px";
            } else {
                probe.style.right = "0px";
                probe.style.height = "1px";
            }
            parent.viewNode.appendChild(probe);
            var parentBox = self.clientLayout.getElementClientRect(probe);
            x1 = Math.max(self.getStartEdge(parentBox), x1);
            x2 = Math.min(self.getEndEdge(parentBox), x2);
            parent.viewNode.removeChild(probe);
            var floatBoxMeasure = self.vertical ? floatBox.y2 - floatBox.y1 : floatBox.x2 - floatBox.x1;
            if (floatSide == "left")
                x2 = Math.max(x2, x1 + floatBoxMeasure);
            else
                x1 = Math.min(x1, x2 - floatBoxMeasure);

            // Move the float below the block parent.
            // Otherwise, if the float is attached to an inline box with 'position: relative',
            // the absolute positioning of the float gets broken,
            // since the inline parent can be pushed horizontally by exclusion floats
            // after the layout of the float is done.
            parent.viewNode.appendChild(nodeContext.viewNode);
        }
        // box is rotated for vertical orientation
        var box = new adapt.geom.Rect(x1, self.getBoxDir() * self.beforeEdge, x2, self.getBoxDir() * self.afterEdge);
        var floatHorBox = floatBox;
        if (self.vertical) {
            floatHorBox = adapt.geom.rotateBox(floatBox);
        }
        var dir = self.getBoxDir();
        if (floatHorBox.y1 < self.bottommostFloatTop * dir) {
            var boxExtent = floatHorBox.y2 - floatHorBox.y1;
            floatHorBox.y1 = self.bottommostFloatTop * dir;
            floatHorBox.y2 = floatHorBox.y1 + boxExtent;
        }
        adapt.geom.positionFloat(box, self.bands, floatHorBox, floatSide);
        if (self.vertical) {
            floatBox = adapt.geom.unrotateBox(floatHorBox);
        }
        var insets = self.getComputedInsets(element);
        adapt.base.setCSSProperty(element, "width", floatBox.x2 - floatBox.x1 - insets.left - insets.right + "px");
        adapt.base.setCSSProperty(element, "height", floatBox.y2 - floatBox.y1 - insets.top - insets.bottom + "px");
        adapt.base.setCSSProperty(element, "position", "absolute");
        goog.asserts.assert(nodeContext.display);
        adapt.base.setCSSProperty(element, "display", nodeContext.display);

        var offsets;
        var containingBlockForAbsolute = null;
        if (parent) {
            if (parent.containingBlockForAbsolute) {
                containingBlockForAbsolute = parent;
            } else {
                containingBlockForAbsolute = parent.getContainingBlockForAbsolute();
            }
        }
        if (containingBlockForAbsolute) {
            var probe = containingBlockForAbsolute.viewNode.ownerDocument.createElement("div");
            probe.style.position = "absolute";
            if (containingBlockForAbsolute.vertical) {
                probe.style.right = "0";
            } else {
                probe.style.left = "0";
            }
            probe.style.top = "0";
            containingBlockForAbsolute.viewNode.appendChild(probe);
            offsets = self.clientLayout.getElementClientRect(probe);
            containingBlockForAbsolute.viewNode.removeChild(probe);
        } else {
            offsets = {
                left: self.getLeftEdge() - self.paddingLeft,
                right: self.getRightEdge() + self.paddingRight,
                top: self.getTopEdge() - self.paddingTop
            };
        }

        if (containingBlockForAbsolute ? containingBlockForAbsolute.vertical : self.vertical) {
            adapt.base.setCSSProperty(element, "right",
                (offsets.right - floatBox.x2) + "px");
        } else {
            adapt.base.setCSSProperty(element, "left",
                (floatBox.x1 - offsets.left) + "px");
        }
        adapt.base.setCSSProperty(element, "top",
            (floatBox.y1 - offsets.top) + "px");
        if (nodeContext.clearSpacer) {
            nodeContext.clearSpacer.parentNode.removeChild(nodeContext.clearSpacer);
            nodeContext.clearSpacer = null;
        }
        var floatBoxEdge = self.vertical ? floatBox.x1 : floatBox.y2;
        var floatBoxTop = self.vertical? floatBox.x2 : floatBox.y1;
        // TODO: subtract after margin when determining overflow.
        if (!self.isOverflown(floatBoxEdge) || self.breakPositions.length == 0) {
            // no overflow
            self.killFloats();
            box = new adapt.geom.Rect(self.getLeftEdge(), self.getTopEdge(), self.getRightEdge(), self.getBottomEdge());
            if (self.vertical) {
                box = adapt.geom.rotateBox(box);
            }
            adapt.geom.addFloatToBands(box, self.bands, floatHorBox, null, floatSide);
            self.createFloats();
            if (floatSide == "left") {
                self.leftFloatEdge = floatBoxEdge;
            } else {
                self.rightFloatEdge = floatBoxEdge;
            }
            self.bottommostFloatTop = floatBoxTop;
            self.updateMaxReachedAfterEdge(floatBoxEdge);
            frame.finish(nodeContextAfter);
        } else {
            nodeContext = nodeContext.modify();
            nodeContext.overflow = true;
            frame.finish(nodeContext);
        }
    });
    return frame.result();
};

/**
 * @param {!adapt.layout.PageFloatArea} area
 * @param {!vivliostyle.pagefloat.FloatReference} floatReference
 * @param {string} floatSide
 * @param {?number} anchorEdge
 * @param {!vivliostyle.pagefloat.PageFloatLayoutStrategy} strategy
 * @param {!vivliostyle.pagefloat.PageFloatPlacementCondition} condition
 * @returns {boolean}
 */
adapt.layout.Column.prototype.setupFloatArea = function(
    area, floatReference, floatSide, anchorEdge, strategy, condition) {
    var floatLayoutContext = this.pageFloatLayoutContext;
    var floatContainer = floatLayoutContext.getContainer(floatReference);
    var element = area.element;
    floatContainer.element.parentNode.appendChild(element);

    area.isFloat = true;
    area.originX = floatContainer.originX;
    area.originY = floatContainer.originY;
    area.vertical = floatContainer.vertical;
    area.marginLeft = area.marginRight = area.marginTop = area.marginBottom = 0;
    area.borderLeft = area.borderRight = area.borderTop = area.borderBottom = 0;
    area.paddingLeft = area.paddingRight = area.paddingTop = area.paddingBottom = 0;
    area.exclusions = (floatContainer.exclusions || []).concat();
    area.forceNonfitting = !floatLayoutContext.hasFloatFragments();
    area.innerShape = null;

    var containingBlockRect = floatContainer.getPaddingRect();
    area.setHorizontalPosition(containingBlockRect.x1 - floatContainer.originX,
        containingBlockRect.x2 - containingBlockRect.x1);
    area.setVerticalPosition(containingBlockRect.y1 - floatContainer.originY,
        containingBlockRect.y2 - containingBlockRect.y1);

    strategy.adjustPageFloatArea(area, floatContainer, this);

    // Calculate bands from the exclusions before setting float area dimensions
    area.init();
    var fitWithinContainer = !!floatLayoutContext.setFloatAreaDimensions(
        area, floatReference, floatSide, anchorEdge, true, !floatLayoutContext.hasFloatFragments(), condition);
    if (fitWithinContainer) {
        // New dimensions have been set, remove exclusion floats and re-init
        area.killFloats();
        area.init();
    } else {
        floatContainer.element.parentNode.removeChild(element);
    }
    return fitWithinContainer;
};

/**
 * @param {?vivliostyle.pagefloat.PageFloat} float
 * @param {string} floatSide
 * @param {?number} anchorEdge
 * @param {!vivliostyle.pagefloat.PageFloatLayoutStrategy} strategy
 * @param {!vivliostyle.pagefloat.PageFloatPlacementCondition} condition
 * @returns {?adapt.layout.PageFloatArea}
 */
adapt.layout.Column.prototype.createPageFloatArea = function(float, floatSide, anchorEdge, strategy, condition) {
    var floatAreaElement = this.element.ownerDocument.createElement("div");
    adapt.base.setCSSProperty(floatAreaElement, "position", "absolute");
    var parentPageFloatLayoutContext = this.pageFloatLayoutContext.getPageFloatLayoutContext(float.floatReference);
    // TODO: establish how to specify an appropriate generating element for the new page float layout context
    var pageFloatLayoutContext = new vivliostyle.pagefloat.PageFloatLayoutContext(
        null, vivliostyle.pagefloat.FloatReference.COLUMN, null,
        this.pageFloatLayoutContext.flowName, float.nodePosition, null, null);
    var parentContainer = parentPageFloatLayoutContext.getContainer();
    var floatArea = new adapt.layout.PageFloatArea(floatSide, floatAreaElement, this.layoutContext.clone(),
        this.clientLayout, this.layoutConstraint, pageFloatLayoutContext, parentContainer);
    pageFloatLayoutContext.setContainer(floatArea);
    if (this.setupFloatArea(floatArea, float.floatReference, floatSide, anchorEdge, strategy, condition)) {
        return floatArea;
    } else {
        return null;
    }
};

/**
 * @typedef {{
 *   floatArea: ?adapt.layout.PageFloatArea,
 *   pageFloatFragment: ?vivliostyle.pagefloat.PageFloatFragment,
 *   newPosition: ?adapt.vtree.ChunkPosition
 * }}
 */
adapt.layout.SinglePageFloatLayoutResult;

/**
 * @param {!Array<!vivliostyle.pagefloat.PageFloatContinuation>} continuations
 * @param {string} floatSide
 * @param {?string} clearSide
 * @param {boolean} allowFragmented
 * @param {!vivliostyle.pagefloat.PageFloatLayoutStrategy} strategy
 * @param {?number} anchorEdge
 * @param {?vivliostyle.pagefloat.PageFloatFragment=} pageFloatFragment
 * @returns {!adapt.task.Result.<!adapt.layout.SinglePageFloatLayoutResult>}
 */
adapt.layout.Column.prototype.layoutSinglePageFloatFragment = function(
    continuations, floatSide, clearSide, allowFragmented, strategy, anchorEdge, pageFloatFragment) {
    var context = this.pageFloatLayoutContext;
    var originalContinuations = pageFloatFragment ? pageFloatFragment.continuations : [];
    continuations = originalContinuations.concat(continuations);
    var firstFloat = continuations[0].float;
    var condition = context.getPageFloatPlacementCondition(firstFloat, floatSide, clearSide);
    var floatArea = this.createPageFloatArea(firstFloat, floatSide, anchorEdge, strategy, condition);
    /** @const {!adapt.layout.SinglePageFloatLayoutResult} */ var result =
        {floatArea, pageFloatFragment: null, newPosition: null};
    if (!floatArea) {
        return adapt.task.newResult(result);
    }
    var frame = adapt.task.newFrame("layoutSinglePageFloatFragment");
    var failed = false;
    var i = 0;
    frame.loopWithFrame(loopFrame => {
        if (i >= continuations.length) {
            loopFrame.breakLoop();
            return;
        }
        var c = continuations[i];
        var floatChunkPosition = new adapt.vtree.ChunkPosition(c.nodePosition);
        floatArea.layout(floatChunkPosition, true).then(newPosition => {
            result.newPosition = newPosition;
            if (!newPosition || allowFragmented) {
                i++;
                loopFrame.continueLoop();
            } else {
                failed = true;
                loopFrame.breakLoop();
            }
        });
    }).then(() => {
        if (!failed) {
            goog.asserts.assert(floatArea);
            var logicalFloatSide = context.setFloatAreaDimensions(floatArea, firstFloat.floatReference, floatSide, anchorEdge, false, allowFragmented, condition);
            if (!logicalFloatSide) {
                failed = true;
            } else {
                var newFragment = strategy.createPageFloatFragment(continuations, logicalFloatSide, floatArea, !!result.newPosition);
                context.addPageFloatFragment(newFragment, true);
                result.pageFloatFragment = newFragment;
            }
        }
        frame.finish(result);
    });
    return frame.result();
};

/**
 * @param {!vivliostyle.pagefloat.PageFloatContinuation} continuation
 * @param {!vivliostyle.pagefloat.PageFloatLayoutStrategy} strategy
 * @param {?number} anchorEdge
 * @param {vivliostyle.pagefloat.PageFloatFragment=} pageFloatFragment
 * @returns {!adapt.task.Result.<boolean>}
 */
adapt.layout.Column.prototype.layoutPageFloatInner = function(continuation, strategy,
                                                              anchorEdge, pageFloatFragment) {
    var context = this.pageFloatLayoutContext;
    var float = continuation.float;
    context.stashEndFloatFragments(float);

    function cancelLayout(floatArea, pageFloatFragment) {
        if (pageFloatFragment) {
            context.removePageFloatFragment(pageFloatFragment, true);
        } else if (floatArea) {
            floatArea.element.parentNode.removeChild(floatArea.element);
        }
        context.restoreStashedFragments(float.floatReference);
        context.deferPageFloat(continuation);
    }

    /** @const {!adapt.task.Frame<boolean>} */ var frame = adapt.task.newFrame("layoutPageFloatInner");
    var self = this;
    this.layoutSinglePageFloatFragment([continuation], float.floatSide, float.clearSide, !context.hasFloatFragments(), strategy, anchorEdge, pageFloatFragment).then(result => {
        var floatArea = result.floatArea;
        var newFragment = result.pageFloatFragment;
        var newPosition = result.newPosition;
        if (newFragment) {
            self.layoutStashedPageFloats(float.floatReference, [pageFloatFragment]).then(success => {
                if (success) {
                    // Add again to invalidate the context
                    goog.asserts.assert(newFragment);
                    context.addPageFloatFragment(newFragment);
                    context.discardStashedFragments(float.floatReference);
                    if (newPosition) {
                        var continuation = new vivliostyle.pagefloat.PageFloatContinuation(
                            float, newPosition.primary);
                        context.deferPageFloat(continuation);
                    }
                    frame.finish(true);
                } else {
                    cancelLayout(floatArea, newFragment);
                    frame.finish(false);
                }
            });
        } else {
            cancelLayout(floatArea, newFragment);
            frame.finish(false);
        }
    });
    return frame.result();
};

/**
 * @private
 * @param {!vivliostyle.pagefloat.FloatReference} floatReference
 * @param {!Array<!vivliostyle.pagefloat.PageFloatFragment>} excluded
 * @returns {!adapt.task.Result.<boolean>} Represents if the layout was succeeded or not
 */
adapt.layout.Column.prototype.layoutStashedPageFloats = function(floatReference, excluded) {
    var context = this.pageFloatLayoutContext;
    var stashedFloatFragments = context.getStashedFloatFragments(floatReference);
    var newFloatAreas = [];
    var newFragments = [];
    var failed = false;
    var frame = adapt.task.newFrame("layoutStashedPageFloats");
    var self = this;
    var i = 0;
    frame.loopWithFrame(loopFrame => {
        if (i >= stashedFloatFragments.length) {
            loopFrame.breakLoop();
            return;
        }
        var stashedFragment = stashedFloatFragments[i];
        if (excluded.indexOf(stashedFragment) >= 0) {
            i++;
            loopFrame.continueLoop();
            return;
        }
        var strategy = new vivliostyle.pagefloat.PageFloatLayoutStrategyResolver()
            .findByFloat(stashedFragment.continuations[0].float);
        // Value of 'clear' is irrelevant when laying out stashed floats
        // since whether the 'clear' value allows placing the float
        // here is already resolved.
        self.layoutSinglePageFloatFragment(stashedFragment.continuations, stashedFragment.floatSide, null, false, strategy, null).then(result => {
            var floatArea = result.floatArea;
            if (floatArea) {
                newFloatAreas.push(floatArea);
            }
            var fragment = result.pageFloatFragment;
            if (fragment) {
                newFragments.push(fragment);
                i++;
                loopFrame.continueLoop();
            } else {
                failed = true;
                loopFrame.breakLoop();
            }
        });
    }).then(() => {
        if (failed) {
            newFragments.forEach(fragment => {
                context.removePageFloatFragment(fragment, true);
            });
            newFloatAreas.forEach(area => {
                var elem = area.element;
                if (elem && elem.parentNode) {
                    elem.parentNode.removeChild(elem);
                }
            });
        } else {
            stashedFloatFragments.forEach(fragment => {
                var elem = fragment.area.element;
                if (elem && elem.parentNode) {
                    elem.parentNode.removeChild(elem);
                }
            });
        }
        frame.finish(!failed);
    });
    return frame.result();
};

/**
 * @param {!adapt.vtree.NodeContext} nodeContext
 * @returns {!adapt.vtree.NodeContext}
 */
adapt.layout.Column.prototype.setFloatAnchorViewNode = function(nodeContext) {
    var parent = nodeContext.viewNode.parentNode;
    var anchor = parent.ownerDocument.createElement("span");
    anchor.setAttribute(adapt.vtree.SPECIAL_ATTR, "1");
    if (nodeContext.floatSide === "footnote") {
        // Defaults for footnote-call, can be overriden by the stylesheet.
        this.layoutContext.applyPseudoelementStyle(nodeContext, "footnote-call", anchor);
    }
    parent.appendChild(anchor);
    parent.removeChild(nodeContext.viewNode);
    var nodeContextAfter = nodeContext.modify();
    nodeContextAfter.after = true;
    nodeContextAfter.viewNode = anchor;
    return nodeContextAfter;
};

/**
 * @param {vivliostyle.pagefloat.FloatReference} floatReference
 * @param {adapt.css.Val} columnSpan
 * @param {!adapt.vtree.NodeContext} nodeContext
 * @returns {!adapt.task.Result<vivliostyle.pagefloat.FloatReference>}
 */
adapt.layout.Column.prototype.resolveFloatReferenceFromColumnSpan = function(
    floatReference, columnSpan, nodeContext) {
    var self = this;
    var frame = /** @type {!adapt.task.Frame<vivliostyle.pagefloat.FloatReference>} */
        (adapt.task.newFrame("resolveFloatReferenceFromColumnSpan"));
    var columnContext = this.pageFloatLayoutContext;
    var regionContext = columnContext.getPageFloatLayoutContext(vivliostyle.pagefloat.FloatReference.REGION);
    var isRegionWider = columnContext.getContainer().width < regionContext.getContainer().width;
    if (isRegionWider && floatReference === vivliostyle.pagefloat.FloatReference.COLUMN) {
        if (columnSpan === adapt.css.ident.auto) {
            this.buildDeepElementView(nodeContext.copy()).then(position => {
                var element = /** @type {Element} */ (position.viewNode);
                var inlineSize = vivliostyle.sizing.getSize(self.clientLayout, element,
                    [vivliostyle.sizing.Size.MIN_CONTENT_INLINE_SIZE])[vivliostyle.sizing.Size.MIN_CONTENT_INLINE_SIZE];
                var margin = self.getComputedMargin(element);
                if (self.vertical) {
                    inlineSize += margin.top + margin.bottom;
                } else {
                    inlineSize += margin.left + margin.right;
                }
                if (inlineSize > self.width) {
                    frame.finish(vivliostyle.pagefloat.FloatReference.REGION);
                } else {
                    frame.finish(floatReference);
                }
            });
        } else if (columnSpan === adapt.css.ident.all) {
            frame.finish(vivliostyle.pagefloat.FloatReference.REGION);
        } else {
            frame.finish(floatReference);
        }
    } else {
        frame.finish(floatReference);
    }
    return frame.result();
};

/**
 * @param {!adapt.vtree.NodeContext} nodeContext
 * @return {!adapt.task.Result<adapt.vtree.NodeContext>}
 */
adapt.layout.Column.prototype.layoutPageFloat = function(nodeContext) {
    var self = this;
    var context = this.pageFloatLayoutContext;
    var strategy = new vivliostyle.pagefloat.PageFloatLayoutStrategyResolver()
        .findByNodeContext(nodeContext);

    /** @type {adapt.task.Result<!vivliostyle.pagefloat.PageFloat>} */ var cont;
    var float = context.findPageFloatByNodePosition(nodeContext.toNodePosition());
    if (!float) {
        cont = strategy.createPageFloat(nodeContext, context, this);
    } else {
        cont = adapt.task.newResult(float);
    }

    return cont.thenAsync(float => {
        var nodePosition = adapt.vtree.newNodePositionFromNodeContext(nodeContext, 0);
        var nodeContextAfter = self.setFloatAnchorViewNode(nodeContext);
        var pageFloatFragment = strategy.findPageFloatFragment(float, context);
        var continuation = new vivliostyle.pagefloat.PageFloatContinuation(float, nodePosition);
        if (pageFloatFragment && pageFloatFragment.hasFloat(float)) {
            context.registerPageFloatAnchor(float, nodeContextAfter.viewNode);
            return adapt.task.newResult(/** @type {adapt.vtree.NodeContext} */ (nodeContextAfter));
        } else if (context.isForbidden(float) || context.hasPrecedingFloatsDeferredToNext(float)) {
            context.deferPageFloat(continuation);
            context.registerPageFloatAnchor(float, nodeContextAfter.viewNode);
            return adapt.task.newResult(/** @type {adapt.vtree.NodeContext} */ (nodeContextAfter));
        } else if (self.nodeContextOverflowingDueToRepetitiveElements) {
            return adapt.task.newResult(null);
        } else {
            var edge = adapt.layout.calculateEdge(nodeContextAfter, self.clientLayout, 0, self.vertical);
            if (self.isOverflown(edge)) {
                return adapt.task.newResult(nodeContextAfter);
            } else {
                return self.layoutPageFloatInner(continuation, strategy, edge, pageFloatFragment).thenAsync(success => {
                    goog.asserts.assert(float);
                    if (!success) {
                        context.registerPageFloatAnchor(float, nodeContextAfter.viewNode);
                        return adapt.task.newResult(nodeContextAfter);
                    } else {
                        return adapt.task.newResult(null);
                    }
                });
            }
        }
    });
};

/**
 * @param {adapt.vtree.NodeContext} nodeContext
 * @param {boolean} insertAfter
 * @param {Node} node
 * @param {Node} insertionPoint
 */
adapt.layout.fixJustificationOnHyphen = (nodeContext, insertAfter, node, insertionPoint) => {
    if (adapt.base.checkSoftWrapOpportunityAfterHyphenBug(document.body)) {
        var hyphenChar = adapt.layout.resolveHyphenateCharacter(nodeContext);
        var prevSibling = insertAfter ? node : node.previousSibling;
        var prevText = prevSibling ? prevSibling.textContent : "";
        if (prevText.charAt(prevText.length - 1) === hyphenChar) {
            var doc = node.ownerDocument;
            var parent = node.parentNode;
            if (adapt.base.checkSoftWrapOpportunityByWbrBug(document.body)) {
                // For IE
                parent.insertBefore(doc.createTextNode(" "), insertionPoint);
            } else {
                // For Edge
                parent.insertBefore(doc.createElement("wbr"), insertionPoint);
            }
        }
    }
};

/**
 * @param {Node} insertionPoint
 * @param {Document} doc
 * @param {Node} parentNode
 * @param {boolean} vertical
 * @return {HTMLElement}
 */
adapt.layout.Column.prototype.createJustificationAdjustmentElement = function(insertionPoint, doc, parentNode, vertical) {
    var span = /** @type {HTMLElement} */ (doc.createElement("span"));
    span.style.visibility = "hidden";

    span.style.verticalAlign = "top";
    span.setAttribute(adapt.vtree.SPECIAL_ATTR, "1");
    var inner = /** @type {HTMLElement} */ (doc.createElement("span"));
    inner.style.fontSize = "0";
    inner.style.lineHeight = "0";
    inner.textContent = " #";
    span.appendChild(inner);

    // Measure inline-start and inline-end edge positions of the line box,
    // taking (exclusion) floats into consideration
    span.style.display = "block";
    span.style.textIndent = "0";
    span.style.textAlign = "left";
    parentNode.insertBefore(span, insertionPoint);
    var leftPos = this.clientLayout.getElementClientRect(inner);
    span.style.textAlign = "right";
    var rightPos = this.clientLayout.getElementClientRect(inner);
    span.style.textAlign = "";

    if (adapt.base.checkInlineBlockJustificationBug(document.body)) {
        // For Chrome
        span.style.display = "inline";
    } else {
        // For Firefox, Edge and IE
        span.style.display = "inline-block";
    }

    var padding = vertical ? rightPos.top - leftPos.top : rightPos.left - leftPos.left;
    var paddingStr = padding >= 1 ? (padding - 1) + "px" : "100%";
    if (vertical) {
        span.style.paddingTop = paddingStr;
    } else {
        span.style.paddingLeft = paddingStr;
    }

    return span;
};

/**
 * @param {adapt.vtree.NodeContext} nodeContext
 * @param {boolean} insertAfter
 * @param {Node} node
 * @param {Node} insertionPoint
 * @param {Document} doc
 * @param {Node} parentNode
 * @returns {HTMLElement}
 */
adapt.layout.Column.prototype.addAndAdjustJustificationElement = function(nodeContext, insertAfter, node, insertionPoint, doc, parentNode) {
    adapt.layout.fixJustificationOnHyphen(nodeContext, insertAfter, node, insertionPoint);
    return this.createJustificationAdjustmentElement(
        insertionPoint, doc, parentNode, nodeContext.vertical);
};

/**
 * @param {Element} span
 * @param {Element} br
 * @param {adapt.vtree.NodeContext} nodeContext
 */
adapt.layout.Column.prototype.compensateJustificationLineHeight = function(span, br, nodeContext) {
    var spanRect = this.clientLayout.getElementClientRect(span);
    var brRect = this.clientLayout.getElementClientRect(br);
    if (nodeContext.vertical) {
        br.style.marginRight = (brRect.right - spanRect.right) + "px";
        br.style.width = "0px";
    } else {
        br.style.marginTop = (spanRect.top - brRect.top) + "px";
        br.style.height = "0px";
    }
    br.setAttribute(adapt.vtree.SPECIAL_ATTR, "1");
};

/**
 * Fix justification of the last line of text broken across pages (if
 * needed).
 * @param {adapt.vtree.NodeContext} nodeContext
 * @param {boolean} endOfColumn
 * @return {void}
 */
adapt.layout.Column.prototype.fixJustificationIfNeeded = function(nodeContext, endOfColumn) {
    if (nodeContext.after && !nodeContext.inline)
        return;
    if (endOfColumn) {
        var textAlign = "";
        for (var parent = nodeContext.parent; parent && !textAlign; parent = parent.parent) {
            if (!parent.inline && parent.viewNode)
                textAlign = (/** @type {HTMLElement} */ (parent.viewNode)).style.textAlign;
        }
        if (textAlign !== "justify")
            return;
    }

    var node = nodeContext.viewNode;
    var doc = node.ownerDocument;
    var insertAfter = endOfColumn && (nodeContext.after || node.nodeType != 1);
    var insertionPoint = insertAfter ? node.nextSibling : node;
    if (insertionPoint && !insertionPoint.parentNode) {
        // Possible if removeSelf = false in finishBreak()
        insertionPoint = null;
    }
    var parentNode = node.parentNode || (nodeContext.parent && nodeContext.parent.viewNode);
    if (!parentNode) {
        // Possible if nothing was added to the column
        return;
    }
    var span = this.addAndAdjustJustificationElement(
        nodeContext, insertAfter, node, insertionPoint, doc, parentNode);
    if (!endOfColumn) {
        var br = /** @type {HTMLElement} */ (doc.createElement("div"));
        parentNode.insertBefore(br, insertionPoint);
        this.compensateJustificationLineHeight(span, br, nodeContext);
    }
};

/**
 * @param {adapt.vtree.NodeContext} nodeContext
 * @param {adapt.vtree.NodeContext} resNodeContext
 * @param {Array.<adapt.vtree.NodeContext>} checkPoints
 * @return {adapt.task.Result.<adapt.vtree.NodeContext>}
 */
adapt.layout.Column.prototype.processLineStyling = function(nodeContext, resNodeContext, checkPoints) {
    var self = this;
    /** @type {!adapt.task.Frame.<adapt.vtree.NodeContext>} */ var frame
        = adapt.task.newFrame("processLineStyling");
    if (goog.DEBUG) {
        adapt.layout.validateCheckPoints(checkPoints);
    }
    var lastCheckPoints = checkPoints.concat([]);  // make a copy
    checkPoints.splice(0, checkPoints.length);  // make empty
    var totalLineCount = 0;
    var firstPseudo = nodeContext.firstPseudo;
    if (firstPseudo.count == 0)  // :first-letter is not processed here
        firstPseudo = firstPseudo.outer;  // move to line pseudoelement (if any)
    frame.loopWithFrame(loopFrame => {
        if (!firstPseudo) {
            loopFrame.breakLoop();
            return;
        }
        var linePositions = self.findLinePositions(lastCheckPoints);
        var count = firstPseudo.count - totalLineCount;
        if (linePositions.length <= count) {
            loopFrame.breakLoop();
            return;
        }
        var lineBreak = self.findAcceptableBreakInside(lastCheckPoints, linePositions[count-1], true);
        if (lineBreak == null) {
            loopFrame.breakLoop();
            return;
        }
        self.finishBreak(lineBreak, false, false).then(() => {
            totalLineCount += count;
            self.layoutContext.peelOff(lineBreak, 0).then(resNodeContextParam => {
                nodeContext = resNodeContextParam;
                self.fixJustificationIfNeeded(nodeContext, false);
                firstPseudo = nodeContext.firstPseudo;
                lastCheckPoints = [];  // Wipe out line breaks inside pseudoelements
                self.buildViewToNextBlockEdge(nodeContext, lastCheckPoints).then(resNodeContextParam => {
                    resNodeContext = resNodeContextParam;
                    loopFrame.continueLoop();
                });
            });
        });
    }).then(() => {
        Array.prototype.push.apply(checkPoints, lastCheckPoints);
        if (goog.DEBUG) {
            adapt.layout.validateCheckPoints(checkPoints);
        }
        frame.finish(resNodeContext);
    });
    return frame.result();
};

/**
 * @param {Array.<adapt.vtree.NodeContext>} checkPoints
 * @return {boolean}
 */
adapt.layout.Column.prototype.isLoneImage = function(checkPoints) {
    if (checkPoints.length != 2 && this.breakPositions.length > 0) {
        return false;
    }
    return checkPoints[0].sourceNode == checkPoints[1].sourceNode
        && adapt.layout.mediaTags[/** @type {Element} */(checkPoints[0].sourceNode).localName];
};

/**
 * @param {Array.<adapt.vtree.NodeContext>} trailingEdgeContexts
 * @return {number}
 */
adapt.layout.Column.prototype.getTrailingMarginEdgeAdjustment = function(trailingEdgeContexts) {
    // Margins push the computed height, but are not counted as overflow. We need to find
    // the overall collapsed margin from all enclosed blocks.
    var maxPos = 0;
    var minNeg = 0;
    for (var i = trailingEdgeContexts.length - 1; i >= 0; i--) {
        var nodeContext = trailingEdgeContexts[i];
        if (!nodeContext.after || !nodeContext.viewNode || nodeContext.viewNode.nodeType != 1) {
            break;
        }
        var margin = this.getComputedMargin(/** @type {Element} */ (nodeContext.viewNode));
        var m = this.vertical ? -margin.left : margin.bottom;
        if (m > 0) {
            maxPos = Math.max(maxPos, m);
        } else {
            minNeg = Math.min(minNeg, m);
        }
    }
    return maxPos - minNeg;
};

/**
 * Layout a single CSS box.
 * @param {adapt.vtree.NodeContext} nodeContext
 * @return {!adapt.task.Result.<adapt.vtree.NodeContext>}
 */
adapt.layout.Column.prototype.layoutBreakableBlock = function(nodeContext) {
    var self = this;
    /** @type {!adapt.task.Frame.<adapt.vtree.NodeContext>} */ var frame
        = adapt.task.newFrame("layoutBreakableBlock");
    /** @type {Array.<adapt.vtree.NodeContext>} */ var checkPoints = [];
    self.buildViewToNextBlockEdge(nodeContext, checkPoints).then(resNodeContext => {
        // at this point a single block was appended to the column
        // flowPosition is either null or
        //  - if !after: contains view for the next block element
        //  - if after: contains view for the enclosing block element
        var checkPointIndex = checkPoints.length - 1;
        if (checkPointIndex < 0) {
            frame.finish(resNodeContext);
            return;
        }

        // Record the height
        // TODO: should this be done after first-line calculation?
        var edge = self.calculateEdge(resNodeContext, checkPoints, checkPointIndex,
            checkPoints[checkPointIndex].boxOffset);
        var overflown = false;
        if (!resNodeContext || !adapt.layout.isOrphan(resNodeContext.viewNode)) {
            var offsets = calculateOffset(
                resNodeContext, vivliostyle.repetitiveelements.collectElementsOffset(self));
            overflown = self.isOverflown(edge + ((self.vertical ? -1 : 1) * offsets.minimum));
            if (self.isOverflown(edge + ((self.vertical ? -1 : 1) * offsets.current))
                && !self.nodeContextOverflowingDueToRepetitiveElements) {
                self.nodeContextOverflowingDueToRepetitiveElements = resNodeContext;
            }
        }

        if (resNodeContext == null) {
            edge += self.getTrailingMarginEdgeAdjustment(checkPoints);
        }
        self.updateMaxReachedAfterEdge(edge);
        var lineCont;
        if (nodeContext.firstPseudo) {
            // possibly need to deal with :first-line and friends
            lineCont = self.processLineStyling(nodeContext, resNodeContext, checkPoints);
        } else {
            lineCont = adapt.task.newResult(resNodeContext);
        }
        lineCont.then(nodeContext => {
            self.postLayoutBlock(nodeContext, checkPoints);
            if (checkPoints.length > 0) {
                self.saveBoxBreakPosition(checkPoints);
                // TODO: how to signal overflow in the last pagargaph???
                if (overflown && !self.isLoneImage(checkPoints) && nodeContext) {
                    nodeContext = nodeContext.modify();
                    nodeContext.overflow = true;
                }
            }
            frame.finish(nodeContext);
        });
    });
    return frame.result();
};

/**
 * @param {adapt.vtree.NodeContext} nodeContext
 * @param {Array.<adapt.vtree.NodeContext>} checkPoints
 */
adapt.layout.Column.prototype.postLayoutBlock = function(nodeContext, checkPoints) {
    /** @type {!Array.<vivliostyle.plugin.PostLayoutBlockHook>} */ var hooks =
        vivliostyle.plugin.getHooksForName(vivliostyle.plugin.HOOKS.POST_LAYOUT_BLOCK);
    hooks.forEach(hook => {
        hook(nodeContext, checkPoints, this);
    });
};

/**
 * @param {number} linePosition
 * @param {Array.<adapt.vtree.NodeContext>} checkPoints
 * @param {boolean} isUpdateMaxReachedAfterEdge
 * @return {{nodeContext: adapt.vtree.NodeContext, index: number, checkPointIndex: number}}
 */
adapt.layout.Column.prototype.findEndOfLine = function(linePosition, checkPoints, isUpdateMaxReachedAfterEdge) {
    if (goog.DEBUG) {
        adapt.layout.validateCheckPoints(checkPoints);
    }
    // Workaround for Blink not returning correct fractional values for Range.getClientRects.
    // https://bugs.chromium.org/p/chromium/issues/detail?id=629828
    var effectiveLinePosition = this.vertical ? linePosition - 1 : linePosition + 1;
    // find the first character which is out
    var lowCP = 0;
    var low = checkPoints[0].boxOffset;
    var low1 = lowCP;
    var highCP = checkPoints.length - 1;
    var high = checkPoints[highCP].boxOffset;
    var mid;
    while (low < high) {
        mid = low + Math.ceil((high - low) / 2);
        // find the node which contains mid index
        low1 = lowCP;
        var high1 = highCP;
        while (low1 < high1) {
            var mid1 = low1 + Math.ceil((high1 - low1) / 2);
            if (checkPoints[mid1].boxOffset > mid)
                high1 = mid1 - 1;
            else
                low1 = mid1;
        }
        var edge = this.calculateEdge(null, checkPoints, low1, mid);
        if (this.vertical ? edge <= effectiveLinePosition : edge >= effectiveLinePosition) {
            high = mid - 1;
            while (checkPoints[low1].boxOffset == mid)
                low1--;
            highCP = low1;
        } else {
            if (isUpdateMaxReachedAfterEdge) this.updateMaxReachedAfterEdge(edge);
            low = mid;
            lowCP = low1;
        }
    }

    return {nodeContext: checkPoints[low1], index: low, checkPointIndex: low1};
};

/**
 * @param {Array.<adapt.vtree.NodeContext>} checkPoints
 * @param {number} edgePosition
 * @param {boolean} force
 * @return {adapt.vtree.NodeContext}
 */
adapt.layout.Column.prototype.findAcceptableBreakInside = function(checkPoints, edgePosition, force) {
    var position = this.findEndOfLine(edgePosition, checkPoints, true);
    var nodeContext = position.nodeContext;
    var viewNode = nodeContext.viewNode;
    if (viewNode.nodeType != 1) {
        var textNode = /** @type {Text} */ (viewNode);
        var textNodeBreaker = this.resolveTextNodeBreaker(nodeContext);
        nodeContext = textNodeBreaker.breakTextNode(textNode, nodeContext,
            position.index, checkPoints, position.checkPointIndex, force);
    }
    this.clearOverflownViewNodes(nodeContext, false);
    return nodeContext;
};

/**
 * @param {adapt.vtree.NodeContext} nodeContext
 * @return {!adapt.layout.TextNodeBreaker}
 */
adapt.layout.Column.prototype.resolveTextNodeBreaker = nodeContext => {
    /** @type {!Array.<vivliostyle.plugin.ResolveTextNodeBreakerHook>} */ var hooks =
        vivliostyle.plugin.getHooksForName(vivliostyle.plugin.HOOKS.RESOLVE_TEXT_NODE_BREAKER);
    return hooks.reduce((prev, hook) => hook(nodeContext) || prev, adapt.layout.TextNodeBreaker.instance);
};

/**
* breaking point resolver for Text Node.
* @constructor
 */
adapt.layout.TextNodeBreaker = function() {};

/**
 * @param {Text} textNode
 * @param {adapt.vtree.NodeContext} nodeContext
 * @param {number} low
 * @param {Array.<adapt.vtree.NodeContext>} checkPoints
 * @param {number} checkpointIndex
 * @param {boolean} force
 * @return {adapt.vtree.NodeContext}
 */
adapt.layout.TextNodeBreaker.prototype.breakTextNode = function(textNode,
    nodeContext, low, checkPoints, checkpointIndex, force) {
    if (nodeContext.after) {
        nodeContext.offsetInNode = textNode.length;
    } else {
        // Character with index low is the last one that fits.
        var viewIndex = low - nodeContext.boxOffset;
        var text = textNode.data;
        if (text.charCodeAt(viewIndex) == 0xAD) {
            viewIndex = this.breakAfterSoftHyphen(textNode, text, viewIndex, nodeContext);
        } else {
            viewIndex = this.breakAfterOtherCharacter(textNode, text, viewIndex, nodeContext);
        }
        if (viewIndex > 0) {
            nodeContext = this.updateNodeContext(nodeContext, viewIndex, textNode);
        }
    }
    return nodeContext;
};

/**
 * @param {Text} textNode
 * @param {string} text
 * @param {number} viewIndex
 * @param {adapt.vtree.NodeContext} nodeContext
 * @return {number}
 */
adapt.layout.TextNodeBreaker.prototype.breakAfterSoftHyphen = (textNode, text, viewIndex, nodeContext) => {
    // convert trailing soft hyphen to a real hyphen
    textNode.replaceData(viewIndex, text.length - viewIndex,
        !nodeContext.breakWord ? adapt.layout.resolveHyphenateCharacter(nodeContext) : "");
    return viewIndex+1;
};
/**
 * @param {Text} textNode
 * @param {string} text
 * @param {number} viewIndex
 * @param {adapt.vtree.NodeContext} nodeContext
 * @return {number}
 */
adapt.layout.TextNodeBreaker.prototype.breakAfterOtherCharacter = (textNode, text, viewIndex, nodeContext) => {
    // keep the trailing character (it may be a space or not)
    var ch0 = text.charAt(viewIndex);
    viewIndex++;
    var ch1 = text.charAt(viewIndex);

    // If automatic hyphen was inserted here, add a real hyphen.
    textNode.replaceData(viewIndex, text.length - viewIndex,
        !nodeContext.breakWord && adapt.base.isLetter(ch0) && adapt.base.isLetter(ch1)
            ? adapt.layout.resolveHyphenateCharacter(nodeContext) : "");
    return viewIndex;
};

/**
 * @param {adapt.vtree.NodeContext} nodeContext
 * @param {number} viewIndex
 * @param {Text} textNode
 * @return {adapt.vtree.NodeContext}
 */
adapt.layout.TextNodeBreaker.prototype.updateNodeContext = (nodeContext, viewIndex, textNode) => {
    nodeContext = nodeContext.modify();
    nodeContext.offsetInNode += viewIndex;
    nodeContext.breakBefore = null;
    return nodeContext;
};

adapt.layout.TextNodeBreaker.instance = new adapt.layout.TextNodeBreaker();

/**
 * @param {adapt.vtree.NodeContext} nodeContext
 * @return {string}
 */
adapt.layout.resolveHyphenateCharacter = nodeContext => nodeContext.hyphenateCharacter
    || (nodeContext.parent && nodeContext.parent.hyphenateCharacter)
    || "-";

/**
 * @param {Element} e
 * @return {boolean}
 */
adapt.layout.isSpecial = e => !!e.getAttribute(adapt.vtree.SPECIAL_ATTR);

/**
 * @param {adapt.vtree.NodeContext} nodeContext
 * @returns {boolean}
 */
adapt.layout.isSpecialNodeContext = nodeContext => {
    if (!nodeContext) return false;
    var viewNode = nodeContext.viewNode;
    if (viewNode && viewNode.nodeType === 1)
        return adapt.layout.isSpecial(/** @type {Element} */ (viewNode));
    else
        return false;
};

/**
 * Read ranges skipping special elments
 * @param {Node} start
 * @param {Node} end
 * @return {Array.<adapt.vtree.ClientRect>}
 */
adapt.layout.Column.prototype.getRangeBoxes = function(start, end) {
    var arr = [];
    var range = start.ownerDocument.createRange();
    var wentUp = false;
    var node = start;
    var lastGood = null;
    var haveStart = false;
    var endNotReached = true;
    while (endNotReached) {
        var seekRange = true;
        do {
            var next = null;
            if (node == end) {
                if (end.nodeType === 1) {
                    // If end is an element, continue traversing its children to find the last text node inside it.
                    // Finish when end has no child or when came back from its children (wentUp==true).
                    endNotReached = !(!end.firstChild || wentUp);
                } else {
                    endNotReached = false;
                }
            }
            if (node.nodeType != 1) {
                if (!haveStart) {
                    range.setStartBefore(node);
                    haveStart = true;
                }
                lastGood = node;
            } else if (wentUp) {
                wentUp = false;
            } else if (adapt.layout.isSpecial(/** @type {Element} */ (node))) {
                // Skip special
                seekRange = !haveStart;
            } else {
                next = node.firstChild;
            }
            if (!next) {
                next = node.nextSibling;
                if (!next) {
                    wentUp = true;
                    next = node.parentNode;
                }
            }
            node = next;
        } while (seekRange && endNotReached);
        if (haveStart) {
            range.setEndAfter(lastGood);
            var boxList = this.clientLayout.getRangeClientRects(range);
            for (var i = 0; i < boxList.length; i++) {
                arr.push(boxList[i]);
            }
            haveStart = false;
        }
    }
    return arr;
};

/**
 * Give block's initial and final nodes, find positions of the line bottoms.
 * This is, of course, somewhat hacky implementation.
 * @param {Array.<adapt.vtree.NodeContext>} checkPoints
 * @return {Array.<number>} position of line breaks
 */
adapt.layout.Column.prototype.findLinePositions = function(checkPoints) {
    var LOW_OVERLAP = 0.2;
    var MID_OVERLAP = 0.6;
    var positions = [];
    var boxes = this.getRangeBoxes(checkPoints[0].viewNode, checkPoints[checkPoints.length - 1].viewNode);
    boxes.sort(this.vertical ?
        adapt.vtree.clientrectDecreasingRight : adapt.vtree.clientrectIncreasingTop);
    var lineBefore = 0;
    var lineAfter = 0;
    var lineEnd = 0;
    var lineLength = 0;
    var i = 0;
    var dir = this.getBoxDir();
    while (true) {
        if (i < boxes.length) {
            var box = boxes[i];
            var overlap = 1;
            if (lineLength > 0) {
                var boxSize = Math.max(this.getBoxSize(box), 1);
                if (dir * this.getBeforeEdge(box) < dir * lineBefore) {
                    overlap = dir * (this.getAfterEdge(box) - lineBefore) / boxSize;
                } else if (dir * this.getAfterEdge(box) > dir * lineAfter) {
                    overlap = dir * (lineAfter - this.getBeforeEdge(box)) / boxSize;
                } else {
                    overlap = 1;
                }
            }
            if (lineLength == 0 || overlap >= MID_OVERLAP ||
                (overlap >= LOW_OVERLAP && this.getStartEdge(box) >= lineEnd-1)) {
                lineEnd = this.getEndEdge(box);
                if (this.vertical) {
                    lineBefore = lineLength == 0 ? box.right : Math.max(lineBefore, box.right);
                    lineAfter = lineLength == 0 ? box.left : Math.min(lineAfter, box.left);
                } else {
                    lineBefore = lineLength == 0 ? box.top : Math.min(lineBefore, box.top);
                    lineAfter = lineLength == 0 ? box.bottom : Math.max(lineAfter, box.bottom);
                }
                lineLength++;
                i++;
                continue;
            }
        }
        // Add line
        if (lineLength > 0) {
            positions.push(lineAfter);
            lineLength = 0;
        }
        if (i >= boxes.length)
            break;
    }
    positions.sort(adapt.base.numberCompare);
    if (this.vertical) {
        positions.reverse();
    }
    return positions;
};

/**
 * @param {!adapt.vtree.NodeContext} nodeContext
 * @returns {number}
 */
adapt.layout.Column.prototype.calculateClonedPaddingBorder = function(nodeContext) {
    var clonedPaddingBorder = 0;
    nodeContext.walkUpBlocks(block => {
        if (block.inheritedProps["box-decoration-break"] === "clone") {
            goog.asserts.assert(block.viewNode instanceof Element);
            var paddingBorders = this.getComputedPaddingBorder(block.viewNode);
            clonedPaddingBorder += block.vertical ? -paddingBorders.left : paddingBorders.bottom;
            if (block.display === "table") {
                clonedPaddingBorder += block.blockBorderSpacing;
            }
        }
    });
    return clonedPaddingBorder;
};

/**
 * @private
 * @param {!adapt.layout.BreakPosition=} bp
 * @returns {number}
 */
adapt.layout.Column.prototype.getOffsetByRepetitiveElements = function(bp) {
    var offset;
    if (bp) {
        offset = bp.calculateOffset(this);
    } else {
        offset = calculateOffset(null,
            vivliostyle.repetitiveelements.collectElementsOffset(this));
    }
    return offset.current;
};

/**
 * @param {adapt.layout.BoxBreakPosition} bp
 * @param {boolean} force
 * @return {adapt.vtree.NodeContext}
 */
adapt.layout.Column.prototype.findBoxBreakPosition = function(bp, force) {
    var self = this;
    var checkPoints = bp.checkPoints;

    var block = checkPoints[0];
    while (block.parent && block.inline) {
        block = block.parent;
    }

    var widows;
    var orphans;
    if (force) {
        // Last resort, ignore widows/orphans
        widows = 1;
        orphans = 1;
    } else {
        // Get widows/orphans settings from the block element
        widows = Math.max((block.inheritedProps["widows"] || 2) - 0, 1);
        orphans = Math.max((block.inheritedProps["orphans"] || 2) - 0, 1);
    }

    // In case of box-decoration-break: clone, width (or height in vertical writing mode) of cloned paddings and borders should be taken into account.
    var clonedPaddingBorder = self.calculateClonedPaddingBorder(block);

    // Select the first overflowing line break position
    var linePositions = this.findLinePositions(checkPoints);
    var edge = this.footnoteEdge - clonedPaddingBorder;
    var dir = this.getBoxDir();
    var repetitiveElementsOffset = this.getOffsetByRepetitiveElements(bp);
    edge -= dir * repetitiveElementsOffset;

    // If an "overflowing" checkpoint (e.g. not allowed by LayoutConstraint) exists before the edge,
    // a line containing the checkpoint should be deferred to the next column.
    var firstOverflowing = this.findFirstOverflowingEdgeAndCheckPoint(checkPoints);
    if (isNaN(firstOverflowing.edge))
        firstOverflowing.edge = dir * Infinity;
    var lineIndex = adapt.base.binarySearch(linePositions.length, i => {
        var p = linePositions[i];
        return self.vertical ?
            (p < edge || p <= firstOverflowing.edge) :
            (p > edge || p >= firstOverflowing.edge);
    });
    // If no break point is found due to the "overflowing" checkpoint,
    // give up deferring a line containing the checkpoint and try to cut the line just before it.
    var forceCutBeforeOverflowing = lineIndex <= 0;
    if (forceCutBeforeOverflowing) {
        lineIndex = adapt.base.binarySearch(linePositions.length, i => self.vertical ? linePositions[i] < edge : linePositions[i] > edge);
    }

    // First edge after the one that both fits and satisfies widows constraint.
    lineIndex = Math.min(linePositions.length - widows, lineIndex);
    if (lineIndex < orphans) {
        // Not enough lines to satisfy orphans constraint, cannot break here.
        return null;
    }
    edge = linePositions[lineIndex-1];
    var nodeContext;
    if (forceCutBeforeOverflowing) {
        nodeContext = firstOverflowing.checkPoint;
    } else {
        nodeContext = this.findAcceptableBreakInside(bp.checkPoints, edge, force);
    }
    if (nodeContext) {
        // When line-height is small, the edge calculated above (using Range)
        // can be larger than the edge of the block container containing the text.
        // We update the edge by measuring the block edge.
        var blockEdge = this.getAfterEdgeOfBlockContainer(nodeContext);
        if (!isNaN(blockEdge) && blockEdge < edge)
            edge = blockEdge;
        this.computedBlockSize =
            dir * (edge - this.beforeEdge) + repetitiveElementsOffset;
    }
    return nodeContext;
};

/**
 * @param {!adapt.vtree.NodeContext} nodeContext
 * @returns {number}
 */
adapt.layout.Column.prototype.getAfterEdgeOfBlockContainer = function(nodeContext) {
    var blockParent = nodeContext;
    do {
        blockParent = blockParent.parent;
    } while (blockParent && blockParent.inline);

    if (blockParent) {
        blockParent = blockParent.copy().modify();
        blockParent.after = true;
        return adapt.layout.calculateEdge(blockParent, this.clientLayout, 0, this.vertical);
    } else {
        return NaN;
    }
};

/**
 * @param {Array.<adapt.vtree.NodeContext>} checkPoints
 * @returns {!{edge: number, checkPoint: ?adapt.vtree.NodeContext}}
 */
adapt.layout.Column.prototype.findFirstOverflowingEdgeAndCheckPoint = function(checkPoints) {
    var index = checkPoints.findIndex(cp => cp.overflow);
    if (index < 0) return { edge: NaN, checkPoint: null };
    var cp = checkPoints[index];
    return {
        edge: this.calculateEdge(null, checkPoints, index, cp.boxOffset),
        checkPoint: cp
    };
};

/**
 * @param {adapt.layout.EdgeBreakPosition} bp
 * @return {adapt.vtree.NodeContext}
 */
adapt.layout.Column.prototype.findEdgeBreakPosition = function(bp) {
    this.computedBlockSize =
        bp.computedBlockSize + this.getOffsetByRepetitiveElements(bp);
    return bp.position;
};

/**
 * Finalize a line break.
 * @param {adapt.vtree.NodeContext} nodeContext
 * @param {boolean} forceRemoveSelf
 * @param {boolean} endOfColumn
 * @return {!adapt.task.Result.<boolean>} holing true
 */
adapt.layout.Column.prototype.finishBreak = function(nodeContext, forceRemoveSelf, endOfColumn) {
    goog.asserts.assert(nodeContext.formattingContext);
    var layoutProcessor = new adapt.layout.LayoutProcessorResolver().find(nodeContext.formattingContext);
    var result = layoutProcessor.finishBreak(this, nodeContext, forceRemoveSelf, endOfColumn);
    if (!result) {
        result = adapt.layout.blockLayoutProcessor.finishBreak(this, nodeContext, forceRemoveSelf, endOfColumn);
    }
    return result;
};

/**
 * @returns {!adapt.layout.BreakPositionAndNodeContext}
 */
adapt.layout.Column.prototype.findAcceptableBreakPosition = function() {
    var bp = null;
    var nodeContext = null;
    var penalty = 0;
    var nextPenalty = 0;
    do {
        penalty = nextPenalty;
        nextPenalty = Number.MAX_VALUE;
        for (var i = this.breakPositions.length - 1; i >= 0 && !nodeContext; --i) {
            bp = this.breakPositions[i];
            nodeContext = bp.findAcceptableBreak(this, penalty);
            var minPenalty = bp.getMinBreakPenalty();
            if (minPenalty > penalty) {
                nextPenalty = Math.min(nextPenalty, minPenalty);
            }
        }
    // Don't need to find a non-optimal break position if forceNonfitting=false
    } while (nextPenalty > penalty && !nodeContext && this.forceNonfitting);
    return {
        breakPosition: nodeContext ? bp : null,
        nodeContext
    };
};

/**
 * @param {adapt.vtree.NodeContext} nodeContext
 * @param {adapt.vtree.NodeContext} overflownNodeContext
 * @param {adapt.vtree.NodeContext} initialNodeContext
 * @param {number} initialComputedBlockSize
 * @return {adapt.task.Result.<adapt.vtree.NodeContext>}
 */
adapt.layout.Column.prototype.doFinishBreak = function(nodeContext, overflownNodeContext, initialNodeContext, initialComputedBlockSize) {
    if (this.pageFloatLayoutContext.isInvalidated() || this.pageBreakType || !overflownNodeContext) {
        return adapt.task.newResult(nodeContext);
    }
    var self = this;
    /** @type {!adapt.task.Frame.<adapt.vtree.NodeContext>} */ var frame =
        adapt.task.newFrame("doFinishBreak");
    var forceRemoveSelf = false;
    if (!nodeContext) {
        // Last resort
        if (this.forceNonfitting) {
            vivliostyle.logging.logger.warn("Could not find any page breaks?!!");
            self.skipTailEdges(overflownNodeContext).then(nodeContext => {
                if (nodeContext) {
                    nodeContext = nodeContext.modify();
                    nodeContext.overflow = false;
                    self.finishBreak(nodeContext, forceRemoveSelf, true).then(() => {
                        frame.finish(nodeContext);
                    });
                } else {
                    frame.finish(nodeContext);
                }
            });
            return frame.result();
        } else {
            nodeContext = initialNodeContext;
            forceRemoveSelf = true;
            self.computedBlockSize = initialComputedBlockSize;
        }
    }
    this.finishBreak(nodeContext, forceRemoveSelf, true).then(() => {
        frame.finish(nodeContext);
    });
    return frame.result();
};

/**
 * Determines if a page break is acceptable at this position
 * @param {adapt.vtree.NodeContext} flowPosition
 * @return {boolean}
 */
adapt.layout.Column.prototype.isBreakable = flowPosition => {
    if (flowPosition.after)
        return true; // may be an empty block
    switch (flowPosition.sourceNode.namespaceURI) {
        case adapt.base.NS.SVG:
            return false;
    }
    return !flowPosition.flexContainer;
};

/**
 * Determines if an indent value is zero
 * @param {string|number} val
 * @return {boolean}
 */
adapt.layout.Column.prototype.zeroIndent = val => {
    var s = val.toString();
    return s == "" || s == "auto" || !!s.match(/^0+(.0*)?[^0-9]/);
};

/**
 * @param {adapt.vtree.NodeContext} nodeContext
 * @param {Array.<adapt.vtree.NodeContext>} trailingEdgeContexts
 * @return {boolean} true if overflows
 */
adapt.layout.Column.prototype.checkOverflowAndSaveEdge = function(nodeContext, trailingEdgeContexts) {
    if (!nodeContext) {
        return false;
    }
    if (adapt.layout.isOrphan(nodeContext.viewNode)) {
        return false;
    }
    var edge = adapt.layout.calculateEdge(nodeContext, this.clientLayout, 0, this.vertical);
    var offsets = calculateOffset(
        nodeContext, vivliostyle.repetitiveelements.collectElementsOffset(this));
    var overflown = this.isOverflown(edge + ((this.vertical ? -1 : 1) * offsets.minimum));
    if (this.isOverflown(edge + ((this.vertical ? -1 : 1) * offsets.current))
        && !this.nodeContextOverflowingDueToRepetitiveElements) {
        this.nodeContextOverflowingDueToRepetitiveElements = nodeContext;
    } else if (trailingEdgeContexts) {
        // If the edge does not overflow add the trailing margin, which is truncated to the remaining fragmentainer extent.
        var marginEdge = edge + this.getTrailingMarginEdgeAdjustment(trailingEdgeContexts);
        var footnoteEdge = this.footnoteEdge - this.getBoxDir() * offsets.current;
        edge = this.vertical ? Math.min(edge, Math.max(marginEdge, footnoteEdge)) :
            Math.max(edge, Math.min(marginEdge, footnoteEdge));
    }
    this.updateMaxReachedAfterEdge(edge);
    return overflown;
};

/**
 * Save a possible page break position on a CSS block edge. Check if it overflows.
 * @param {adapt.vtree.NodeContext} nodeContext
 * @param {Array.<adapt.vtree.NodeContext>} trailingEdgeContexts
 * @param {boolean} saveEvenOverflown
 * @param {?string} breakAtTheEdge
 * @return {boolean} true if overflows
 */
adapt.layout.Column.prototype.checkOverflowAndSaveEdgeAndBreakPosition = function(nodeContext,
                                                                                  trailingEdgeContexts, saveEvenOverflown, breakAtTheEdge) {
    if (!nodeContext) {
        return false;
    }
    if (adapt.layout.isOrphan(nodeContext.viewNode)) {
        return false;
    }
    var overflown = this.checkOverflowAndSaveEdge(nodeContext, trailingEdgeContexts);
    if (saveEvenOverflown || !overflown) {
        this.saveEdgeBreakPosition(nodeContext, breakAtTheEdge, overflown);
    }
    return overflown;
};

/**
 * @param {adapt.vtree.NodeContext} nodeContext
 * @returns {boolean}
 */
adapt.layout.Column.prototype.applyClearance = function(nodeContext) {
    if (!nodeContext.viewNode.parentNode) {
        // Cannot do ceralance for nodes without parents
        return false;
    }
    // measure where the edge of the element would be without clearance
    var margin = this.getComputedMargin(/** @type {Element} */ (nodeContext.viewNode));
    var spacer = nodeContext.viewNode.ownerDocument.createElement("div");
    if (this.vertical) {
        spacer.style.bottom = "0px";
        spacer.style.width = "1px";
        spacer.style.marginRight = margin.right + "px";
    } else {
        spacer.style.right = "0px";
        spacer.style.height = "1px";
        spacer.style.marginTop = margin.top + "px";
    }
    nodeContext.viewNode.parentNode.insertBefore(spacer, nodeContext.viewNode);
    var spacerBox = this.clientLayout.getElementClientRect(spacer);
    var edge = this.getBeforeEdge(spacerBox);
    var dir = this.getBoxDir();
    var clear = nodeContext.clearSide;
    var clearEdge = -this.getBoxDir() * Infinity;
    if (clear === "all") {
        clearEdge = this.pageFloatLayoutContext.getPageFloatClearEdge(clear, this);
    }
    switch (clear) {
        case "left" :
            clearEdge = dir * Math.max(clearEdge*dir, this.leftFloatEdge*dir);
            break;
        case "right" :
            clearEdge = dir * Math.max(clearEdge*dir, this.rightFloatEdge*dir);
            break;
        default :
            clearEdge = dir * Math.max(clearEdge*dir, Math.max(this.rightFloatEdge*dir, this.leftFloatEdge*dir));
    }
    // edge holds the position where element border "before" edge will be without clearance.
    // clearEdge is the "after" edge of the float to clear.
    if (edge * dir >= clearEdge * dir) {
        // No need for clearance
        nodeContext.viewNode.parentNode.removeChild(spacer);
        return false;
    } else {
        // Need some clearance, determine how much. Add the clearance node, measure its after
        // edge and adjust after margin (required due to possible margin collapse before
        // clearance was introduced).
        var height = Math.max(1, (clearEdge - edge) * dir);
        if (this.vertical) {
            spacer.style.width = height + "px";
        } else {
            spacer.style.height = height + "px";
        }
        spacerBox = this.clientLayout.getElementClientRect(spacer);
        var afterEdge = this.getAfterEdge(spacerBox);
        if (this.vertical) {
            var wAdj = (afterEdge + margin.right) - clearEdge;
            if ((wAdj > 0) == (margin.right >= 0)) {
                // In addition to collapsed portion
                wAdj += margin.right;
            }
            spacer.style.marginLeft = wAdj + "px";
        } else {
            var hAdj = clearEdge - (afterEdge + margin.top);
            if ((hAdj > 0) == (margin.top >= 0)) {
                // In addition to collapsed portion
                hAdj += margin.top;
            }
            spacer.style.marginBottom = hAdj + "px";
        }
        nodeContext.clearSpacer = spacer;
        return true;
    }
};

/**
 * @param {adapt.vtree.FormattingContext} formattingContext
 * @returns {boolean}
 */
adapt.layout.Column.prototype.isBFC = formattingContext => {
    if (formattingContext instanceof adapt.layout.BlockFormattingContext) return true;
    if (formattingContext instanceof vivliostyle.table.TableFormattingContext) return false;
    if (formattingContext instanceof vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext) return true;
    return false;
};


/**
 * Skips positions until either the start of unbreakable block or inline content.
 * Also sets breakBefore on the result combining break-before and break-after
 * properties from all elements that meet at the edge.
 * @param {adapt.vtree.NodeContext} nodeContext
 * @param {boolean} leadingEdge
 * @param {?string} forcedBreakValue
 * @return {!adapt.task.Result.<adapt.vtree.NodeContext>}
 */
adapt.layout.Column.prototype.skipEdges = function(nodeContext, leadingEdge, forcedBreakValue) {
    var fc = nodeContext.after ?
        (nodeContext.parent && nodeContext.parent.formattingContext) : nodeContext.formattingContext;
    if (fc && !this.isBFC(fc)) {
        return adapt.task.newResult(nodeContext);
    }

    var self = this;
    /** @type {!adapt.task.Frame.<adapt.vtree.NodeContext>} */ var frame
        = adapt.task.newFrame("skipEdges");
    // If a forced break occurred at the end of the previous column, nodeContext.after should be false.
    var atUnforcedBreak = !forcedBreakValue && leadingEdge && (nodeContext && nodeContext.after);
    var breakAtTheEdge = forcedBreakValue;
    var lastAfterNodeContext = null;
    var leadingEdgeContexts = [];
    var trailingEdgeContexts = [];
    var onStartEdges = false;

    function needForcedBreak() {
        // leadingEdge=true means that we are at the beginning of the new column and hence must avoid a break
        // (Otherwise leading to an infinite loop)
        return !!forcedBreakValue || (!leadingEdge && vivliostyle.break.isForcedBreakValue(breakAtTheEdge));
    }

    function processForcedBreak() {
        nodeContext = leadingEdgeContexts[0] || nodeContext;
        nodeContext.viewNode.parentNode.removeChild(nodeContext.viewNode);
        self.pageBreakType = breakAtTheEdge;
    }
    frame.loopWithFrame(loopFrame => {
        while (nodeContext) {
            goog.asserts.assert(nodeContext.formattingContext);
            var layoutProcessor = new adapt.layout.LayoutProcessorResolver().find(nodeContext.formattingContext);

            // A code block to be able to use break. Break moves to the next node position.
            do {
                if (!nodeContext.viewNode) {
                    // Non-displayable content, skip
                    break;
                }
                if (nodeContext.inline && nodeContext.viewNode.nodeType != 1) {
                    if (adapt.vtree.canIgnore(nodeContext.viewNode, nodeContext.whitespace)) {
                        // Ignorable text content, skip
                        break;
                    }
                    if (!nodeContext.after) {
                        // Leading edge of non-empty block -> finished going through all starting edges of the box
                        if (needForcedBreak()) {
                            processForcedBreak();
                        } else if (self.checkOverflowAndSaveEdgeAndBreakPosition(lastAfterNodeContext, null, true, breakAtTheEdge)) {
                            nodeContext = (self.stopAtOverflow ? (lastAfterNodeContext || nodeContext) : nodeContext).modify();
                            nodeContext.overflow = true;
                        } else {
                            nodeContext = nodeContext.modify();
                            nodeContext.breakBefore = breakAtTheEdge;
                        }
                        loopFrame.breakLoop();
                        return;
                    }
                }
                if (!nodeContext.after) {
                    if (layoutProcessor) {
                        if (layoutProcessor.startNonInlineElementNode(nodeContext)) break;
                    }
                    if (nodeContext.clearSide) {
                        // clear
                        if (self.applyClearance(nodeContext) && leadingEdge &&
                            self.breakPositions.length === 0) {
                            self.saveEdgeBreakPosition(nodeContext.copy(), breakAtTheEdge, false);
                        }
                    }
                    if (!self.isBFC(nodeContext.formattingContext)
                        || nodeContext.formattingContext instanceof vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext
                        || self.isFloatNodeContext(nodeContext) || nodeContext.flexContainer) {
                        // new formatting context, or float or flex container (unbreakable)
                        leadingEdgeContexts.push(nodeContext.copy());
                        breakAtTheEdge = vivliostyle.break.resolveEffectiveBreakValue(breakAtTheEdge, nodeContext.breakBefore);
                        // check if a forced break must occur before the block.
                        if (needForcedBreak()) {
                            processForcedBreak();
                        } else if (self.checkOverflowAndSaveEdgeAndBreakPosition(lastAfterNodeContext, null, true, breakAtTheEdge) || !self.layoutConstraint.allowLayout(nodeContext)) {
                            // overflow
                            nodeContext = (self.stopAtOverflow ? (lastAfterNodeContext || nodeContext) : nodeContext).modify();
                            nodeContext.overflow = true;
                        }
                        loopFrame.breakLoop();
                        return;
                    }
                }
                if (nodeContext.viewNode.nodeType != 1) {
                    // not an element
                    break;
                }
                var style = (/** @type {HTMLElement} */ (nodeContext.viewNode)).style;
                if (nodeContext.after) {
                    if (nodeContext.inline)
                        // Skip an empty inline box at the start of a block
                        // (An anonymous block consisting entirely of
                        // collapsible white space is removed from the rendering tree)
                        break;
                    if (layoutProcessor) {
                        if (layoutProcessor.afterNonInlineElementNode(nodeContext, self.stopAtOverflow)) break;
                    }
                    // Trailing edge
                    if (onStartEdges) {
                        // finished going through all starting edges of the box.
                        // check if a forced break must occur before the block.
                        if (needForcedBreak()) {
                            processForcedBreak();
                            loopFrame.breakLoop();
                            return;
                        }
                        // since a break did not occur, move to the next edge. this edge is no longer the leading edge.
                        leadingEdgeContexts = [];
                        leadingEdge = false;
                        atUnforcedBreak = false;
                        breakAtTheEdge = null;
                    }
                    onStartEdges = false; // we are now on end edges.
                    lastAfterNodeContext = nodeContext.copy();
                    trailingEdgeContexts.push(lastAfterNodeContext);
                    breakAtTheEdge = vivliostyle.break.resolveEffectiveBreakValue(breakAtTheEdge, nodeContext.breakAfter);
                    if (style && !(self.zeroIndent(style.paddingBottom) && self.zeroIndent(style.borderBottomWidth))) {
                        // Non-zero trailing inset.
                        // Margins don't collapse across non-zero borders and paddings.
                        trailingEdgeContexts = [lastAfterNodeContext];
                    }
                } else {
                    // Leading edge
                    leadingEdgeContexts.push(nodeContext.copy());
                    breakAtTheEdge = vivliostyle.break.resolveEffectiveBreakValue(breakAtTheEdge, nodeContext.breakBefore);
                    if (!self.layoutConstraint.allowLayout(nodeContext)) {
                        self.checkOverflowAndSaveEdgeAndBreakPosition(lastAfterNodeContext, null, !self.stopAtOverflow, breakAtTheEdge);
                        nodeContext = nodeContext.modify();
                        nodeContext.overflow = true;
                        if (self.stopAtOverflow) {
                            loopFrame.breakLoop();
                            return;
                        }
                    }
                    var viewTag = nodeContext.viewNode.localName;
                    if (adapt.layout.mediaTags[viewTag]) {
                        // elements that have inherent content
                        // check if a forced break must occur before the block.
                        if (needForcedBreak()) {
                            processForcedBreak();
                        } else if (self.checkOverflowAndSaveEdgeAndBreakPosition(lastAfterNodeContext, null, true, breakAtTheEdge)) {
                            // overflow
                            nodeContext = (self.stopAtOverflow ? (lastAfterNodeContext || nodeContext) : nodeContext).modify();
                            nodeContext.overflow = true;
                        }
                        loopFrame.breakLoop();
                        return;
                    }
                    if (style && !(self.zeroIndent(style.paddingTop) && self.zeroIndent(style.borderTopWidth))) {
                        // Non-zero leading inset
                        atUnforcedBreak = false;
                        trailingEdgeContexts = [];
                    }
                    onStartEdges = true; // we are now on starting edges.
                }
            } while (false);  // End of block of code to use break
            var nextResult = self.nextInTree(nodeContext, atUnforcedBreak);
            if (nextResult.isPending()) {
                nextResult.then(nodeContextParam => {
                    nodeContext = nodeContextParam;
                    loopFrame.continueLoop();
                });
                return;
            } else {
                nodeContext = nextResult.get();
            }
        }
        if (self.checkOverflowAndSaveEdgeAndBreakPosition(lastAfterNodeContext, trailingEdgeContexts, !self.stopAtOverflow, breakAtTheEdge)) {
            if (lastAfterNodeContext && self.stopAtOverflow) {
                nodeContext = lastAfterNodeContext.modify();
                nodeContext.overflow = true;
            } else {
                // TODO: what to return here??
            }
        } else if (vivliostyle.break.isForcedBreakValue(breakAtTheEdge)) {
            self.pageBreakType = breakAtTheEdge;
        }
        loopFrame.breakLoop();
    }).then(() => {
        if (lastAfterNodeContext) {
            self.lastAfterPosition = lastAfterNodeContext.toNodePosition();
        }
        frame.finish(nodeContext);
    });
    return frame.result();
};

/**
 * Skips non-renderable positions until it hits the end of the flow or some renderable
 * content. Returns the nodeContext that was passed in if some content remains and null
 * if all content could be skipped.
 * @param {adapt.vtree.NodeContext} nodeContext
 * @return {!adapt.task.Result.<adapt.vtree.NodeContext>}
 */
adapt.layout.Column.prototype.skipTailEdges = function(nodeContext) {
    var resultNodeContext = nodeContext.copy();
    var self = this;
    /** @type {!adapt.task.Frame.<adapt.vtree.NodeContext>} */ var frame
        = adapt.task.newFrame("skipEdges");
    var breakAtTheEdge = null;
    var onStartEdges = false;
    frame.loopWithFrame(loopFrame => {
        while (nodeContext) {
            // A code block to be able to use break. Break moves to the next node position.
            do {
                if (!nodeContext.viewNode) {
                    // Non-displayable content, skip
                    break;
                }
                if (nodeContext.inline && nodeContext.viewNode.nodeType != 1) {
                    if (adapt.vtree.canIgnore(nodeContext.viewNode, nodeContext.whitespace)) {
                        // Ignorable text content, skip
                        break;
                    }
                    if (!nodeContext.after) {
                        // Leading edge of non-empty block -> finished going through all starting edges of the box
                        if (vivliostyle.break.isForcedBreakValue(breakAtTheEdge)) {
                            self.pageBreakType = breakAtTheEdge;
                        }
                        loopFrame.breakLoop();
                        return;
                    }
                }
                if (!nodeContext.after) {
                    if (self.isFloatNodeContext(nodeContext) || nodeContext.flexContainer) {
                        // float or flex container (unbreakable)
                        breakAtTheEdge = vivliostyle.break.resolveEffectiveBreakValue(breakAtTheEdge, nodeContext.breakBefore);
                        // check if a forced break must occur before the block.
                        if (vivliostyle.break.isForcedBreakValue(breakAtTheEdge)) {
                            self.pageBreakType = breakAtTheEdge;
                        }
                        loopFrame.breakLoop();
                        return;
                    }
                }
                if (nodeContext.viewNode.nodeType != 1) {
                    // not an element
                    break;
                }
                var style = (/** @type {HTMLElement} */ (nodeContext.viewNode)).style;
                if (nodeContext.after) {
                    // Trailing edge
                    if (onStartEdges) {
                        // finished going through all starting edges of the box.
                        // check if a forced break must occur before the block.
                        if (vivliostyle.break.isForcedBreakValue(breakAtTheEdge)) {
                            self.pageBreakType = breakAtTheEdge;
                            loopFrame.breakLoop();
                            return;
                        }
                        // since a break did not occur, move to the next edge.
                        breakAtTheEdge = null;
                    }
                    onStartEdges = false; // we are now on end edges.
                    breakAtTheEdge = vivliostyle.break.resolveEffectiveBreakValue(breakAtTheEdge, nodeContext.breakAfter);
                } else {
                    // Leading edge
                    breakAtTheEdge = vivliostyle.break.resolveEffectiveBreakValue(breakAtTheEdge, nodeContext.breakBefore);
                    var viewTag = nodeContext.viewNode.localName;
                    if (adapt.layout.mediaTags[viewTag]) {
                        // elements that have inherent content
                        // check if a forced break must occur before the block.
                        if (vivliostyle.break.isForcedBreakValue(breakAtTheEdge)) {
                            self.pageBreakType = breakAtTheEdge;
                        }
                        loopFrame.breakLoop();
                        return;
                    }
                    if (style && !(self.zeroIndent(style.paddingTop) && self.zeroIndent(style.borderTopWidth))) {
                        // Non-zero leading inset
                        loopFrame.breakLoop();
                        return;
                    }
                }
                onStartEdges = true; // we are now on starting edges.
            } while (false);  // End of block of code to use break
            var nextResult = self.layoutContext.nextInTree(nodeContext);
            if (nextResult.isPending()) {
                nextResult.then(nodeContextParam => {
                    nodeContext = nodeContextParam;
                    loopFrame.continueLoop();
                });
                return;
            } else {
                nodeContext = nextResult.get();
            }
        }
        resultNodeContext = null;
        loopFrame.breakLoop();
    }).then(() => {
        frame.finish(resultNodeContext);
    });
    return frame.result();
};

/**
 * @param {adapt.vtree.NodeContext} nodeContext
 * @return {!adapt.task.Result.<adapt.vtree.NodeContext>}
 */
adapt.layout.Column.prototype.layoutFloatOrFootnote = function(nodeContext) {
    if (vivliostyle.pagefloat.isPageFloat(nodeContext.floatReference) ||
        nodeContext.floatSide === "footnote") {
        return this.layoutPageFloat(nodeContext);
    } else {
        return this.layoutFloat(nodeContext);
    }
};

/**
 * Layout next portion of the source.
 * @param {adapt.vtree.NodeContext} nodeContext
 * @param {boolean} leadingEdge
 * @param {?string=} forcedBreakValue
 * @return {adapt.task.Result.<adapt.vtree.NodeContext>}
 */
adapt.layout.Column.prototype.layoutNext = function(nodeContext, leadingEdge, forcedBreakValue) {
    var self = this;
    /** @type {!adapt.task.Frame.<adapt.vtree.NodeContext>} */ var frame
        = adapt.task.newFrame("layoutNext");
    this.skipEdges(nodeContext, leadingEdge, forcedBreakValue || null).then(nodeContextParam => {
        nodeContext = /** @type {adapt.vtree.NodeContext} */ (nodeContextParam);
        if (!nodeContext || self.pageBreakType || self.stopByOverflow(nodeContext)) {
            // finished all content, explicit page break or overflow (automatic page break)
            frame.finish(nodeContext);
        } else {
            var formattingContext = nodeContext.formattingContext;
            goog.asserts.assert(formattingContext);
            var layoutProcessor = new adapt.layout.LayoutProcessorResolver().find(formattingContext);
            layoutProcessor.layout(nodeContext, self, leadingEdge).thenFinish(frame);
        }
    });
    return frame.result();
};

/**
 * @param {adapt.vtree.NodeContext} nodeContext
 * @param {boolean} removeSelf
 * @return {void}
 */
adapt.layout.Column.prototype.clearOverflownViewNodes = function(nodeContext, removeSelf) {
    if (!nodeContext) return;
    for (var parent = nodeContext.parent; nodeContext; nodeContext = parent, parent = parent ? parent.parent : null) {
        var formattingContext = (parent || nodeContext).formattingContext;
        goog.asserts.assert(formattingContext);
        var layoutProcessor = new adapt.layout.LayoutProcessorResolver().find(formattingContext);
        layoutProcessor.clearOverflownViewNodes(this, parent, nodeContext, removeSelf);
        removeSelf = false;
    }
};

/**
 * @return {void}
 */
adapt.layout.Column.prototype.initGeom = function() {
    // TODO: we should be able to avoid querying the layout engine at this point.
    // Create an element that fills the content area and query its size. Calling
    // getElementClientRect on the container element includes element padding
    // which is wrong for our purposes.
    var probe = /** @type {HTMLElement} */ (this.element.ownerDocument.createElement("div"));
    probe.style.position = "absolute";
    probe.style.top = this.paddingTop + "px";
    probe.style.right = this.paddingRight + "px";
    probe.style.bottom = this.paddingBottom + "px";
    probe.style.left = this.paddingLeft + "px";
    this.element.appendChild(probe);
    var columnBBox = this.clientLayout.getElementClientRect(probe);
    this.element.removeChild(probe);
    var offsetX = this.originX + this.left + this.getInsetLeft();
    var offsetY = this.originY + this.top + this.getInsetTop();
    this.box = new adapt.geom.Rect(offsetX, offsetY, offsetX + this.width,
        offsetY + this.height);
    this.startEdge = columnBBox ? (this.vertical ? columnBBox.top : columnBBox.left) : 0;
    this.endEdge = columnBBox ? (this.vertical ? columnBBox.bottom : columnBBox.right) : 0;
    this.beforeEdge = columnBBox ? (this.vertical ? columnBBox.right : columnBBox.top) : 0;
    this.afterEdge = columnBBox ? (this.vertical ? columnBBox.left : columnBBox.bottom) : 0;
    this.leftFloatEdge = this.beforeEdge;
    this.rightFloatEdge = this.beforeEdge;
    this.bottommostFloatTop = this.beforeEdge;
    this.footnoteEdge = this.afterEdge;
    this.bands = adapt.geom.shapesToBands(this.box, [this.getInnerShape()],
        this.getExclusions(), 8, this.snapHeight, this.vertical);
    this.createFloats();
};

/**
 * @return {void}
 */
adapt.layout.Column.prototype.init = function() {
    this.chunkPositions = [];
    adapt.base.setCSSProperty(this.element, "width", this.width + "px");
    adapt.base.setCSSProperty(this.element, "height", this.height + "px");
    this.initGeom();
    this.computedBlockSize = 0;
    this.overflown = false;
    this.pageBreakType = null;
    this.lastAfterPosition = null;
};

/**
 * Save the potential breaking position at the edge. Should, in general, save "after" position
 * but only after skipping all of the "before" ones and getting to the non-empty content (to
 * get breakAtEdge right).
 * @param {adapt.vtree.NodeContext} position
 * @param {?string} breakAtEdge
 * @param {boolean} overflows
 * @return {void}
 */
adapt.layout.Column.prototype.saveEdgeBreakPosition = function(position, breakAtEdge, overflows) {
    goog.asserts.assert(position.formattingContext);
    var copy = position.copy();
    var layoutProcessor = new adapt.layout.LayoutProcessorResolver().find(position.formattingContext);
    var clonedPaddingBorder = this.calculateClonedPaddingBorder(copy);
    var bp = layoutProcessor.createEdgeBreakPosition(copy, breakAtEdge, overflows, this.computedBlockSize + clonedPaddingBorder);
    this.breakPositions.push(bp);
};

/**
 * @param {Array.<adapt.vtree.NodeContext>} checkPoints array of breaking points for breakable block
 * @return {void}
 */
adapt.layout.Column.prototype.saveBoxBreakPosition = function(checkPoints) {
    var penalty = checkPoints[0].breakPenalty;
    var bp = new adapt.layout.BoxBreakPosition(checkPoints, penalty);
    this.breakPositions.push(bp);
};

/**
 * @param {number} afterEdge
 */
adapt.layout.Column.prototype.updateMaxReachedAfterEdge = function(afterEdge) {
    if (!isNaN(afterEdge)) {
        var size = this.getBoxDir() * (afterEdge - this.beforeEdge);
        this.computedBlockSize = Math.max(size, this.computedBlockSize);
    }
};

/**
 * @param {adapt.vtree.ChunkPosition} chunkPosition starting position.
 * @param {boolean} leadingEdge
 * @param {?string=} breakAfter
 * @return {!adapt.task.Result.<adapt.vtree.ChunkPosition>} holding end position.
 */
adapt.layout.Column.prototype.layout = function(chunkPosition, leadingEdge, breakAfter) {
    this.chunkPositions.push(chunkPosition);  // So we can re-layout this column later
    if (chunkPosition.primary.after) {
        this.lastAfterPosition = chunkPosition.primary;
    }
    if (this.stopAtOverflow && this.overflown) {
        return adapt.task.newResult(/** @type {adapt.vtree.ChunkPosition} */ (chunkPosition));
    }
    if (this.isFullWithPageFloats()) {
        if (chunkPosition.primary.after && chunkPosition.primary.steps.length === 1) {
            // End of contents
            return adapt.task.newResult(/** @type {adapt.vtree.ChunkPosition} */ (null));
        } else {
            return adapt.task.newResult(/** @type {adapt.vtree.ChunkPosition} */ (chunkPosition));
        }
    }
    var self = this;
    /** @type {!adapt.task.Frame.<adapt.vtree.ChunkPosition>} */ var frame = adapt.task.newFrame("layout");
        // ------ start the column -----------
    self.openAllViews(chunkPosition.primary).then(nodeContext => {
        var initialNodeContext = null;
        if (nodeContext.viewNode) {
            initialNodeContext = nodeContext.copy();
        } else {
            var nextInTreeListener = evt => {
                if (evt.nodeContext.viewNode) {
                    initialNodeContext = evt.nodeContext;
                    self.layoutContext.removeEventListener("nextInTree", nextInTreeListener);
                }
            };
            self.layoutContext.addEventListener("nextInTree", nextInTreeListener);
        }
        var retryer = new adapt.layout.LayoutRetryer(leadingEdge, breakAfter);
        retryer.layout(nodeContext, self).then(nodeContextParam => {
            self.doFinishBreak(nodeContextParam, retryer.context.overflownNodeContext, initialNodeContext, retryer.initialComputedBlockSize).then(positionAfter => {
                var cont = null;
                if (!self.pseudoParent) {
                    cont = self.doFinishBreakOfFragmentLayoutConstraints(positionAfter);
                } else {
                    cont = adapt.task.newResult(null);
                }
                cont.then(() => {
                    if (self.pageFloatLayoutContext.isInvalidated()) {
                        frame.finish(null);
                        return;
                    }
                    if (!positionAfter) {
                        frame.finish(null);
                    } else {
                        self.overflown = true;
                        var result = new adapt.vtree.ChunkPosition(positionAfter.toNodePosition());
                        frame.finish(result);
                    }
                });
            });
        });
    });
    return frame.result();
};

/**
 * @returns {boolean}
 */
adapt.layout.Column.prototype.isFullWithPageFloats = function() {
    return this.pageFloatLayoutContext.isColumnFullWithPageFloats(this);
};

/**
 * @returns {number}
 */
adapt.layout.Column.prototype.getMaxBlockSizeOfPageFloats = function() {
    return this.pageFloatLayoutContext.getMaxBlockSizeOfPageFloats();
};

adapt.layout.Column.prototype.doFinishBreakOfFragmentLayoutConstraints = function(nodeContext) {
    /** @type {!adapt.task.Frame.<boolean>} */ var frame = adapt.task.newFrame("doFinishBreakOfFragmentLayoutConstraints");
    var sortedFragmentLayoutConstraints = [].concat(this.fragmentLayoutConstraints);
    sortedFragmentLayoutConstraints.sort((a, b) => a.getPriorityOfFinishBreak() - b.getPriorityOfFinishBreak());
    var i = 0;
    frame.loop(() => {
        if (i < sortedFragmentLayoutConstraints.length) {
            var result = sortedFragmentLayoutConstraints[i++].finishBreak(nodeContext, this);
            return result.thenReturn(true);
        } else {
            return adapt.task.newResult(false);
        }
    }).then(() => {
        frame.finish(true);
    });
    return frame.result();
};

/**
 * @param {adapt.vtree.NodeContext} nodeContext starting position.
 * @param {boolean} leadingEdge
 * @param {?string=} breakAfter
 * @return {!adapt.task.Result.<{nodeContext: adapt.vtree.NodeContext, overflownNodeContext: adapt.vtree.NodeContext}>} holding end position.
 */
adapt.layout.Column.prototype.doLayout = function(nodeContext, leadingEdge, breakAfter) {
    var self = this;
    /**
     * @type {!adapt.task.Frame.<{
     *   nodeContext: adapt.vtree.NodeContext,
     *   overflownNodeContext: adapt.vtree.NodeContext
     * }>}
     */
    var frame = adapt.task.newFrame("doLayout");
    /** @type {adapt.vtree.NodeContext} */ var overflownNodeContext = null;
    // ------ init backtracking list -----
    self.breakPositions = [];
    self.nodeContextOverflowingDueToRepetitiveElements = null;
    // ------- fill the column -------------
    frame.loopWithFrame(loopFrame => {
        while (nodeContext) {
            // fill a single block
            var pending = true;
            self.layoutNext(nodeContext, leadingEdge, breakAfter || null).then(nodeContextParam => {
                leadingEdge = false;
                breakAfter = null;

                if (self.nodeContextOverflowingDueToRepetitiveElements && self.stopAtOverflow) {
                    self.pageBreakType = null;
                    nodeContext = self.nodeContextOverflowingDueToRepetitiveElements;
                    nodeContext.overflow = true;
                } else {
                    nodeContext = nodeContextParam;
                }

                if (self.pageFloatLayoutContext.isInvalidated()) {
                    loopFrame.breakLoop();
                } else if (self.pageBreakType) {
                    // explicit page break
                    loopFrame.breakLoop(); // Loop end
                } else if (nodeContext && self.stopByOverflow(nodeContext)) {
                    // overflow (implicit page break): back up and find a page break
                    overflownNodeContext = nodeContext;
                    var bp = self.findAcceptableBreakPosition();
                    nodeContext = bp.nodeContext;
                    if (bp.breakPosition)
                        bp.breakPosition.breakPositionChosen(self);
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
        self.computedBlockSize += self.getOffsetByRepetitiveElements();
        loopFrame.breakLoop();
    }).then(() => {
        frame.finish({nodeContext, overflownNodeContext});
    });
    return frame.result();
};

/**
 * Re-layout already laid-out chunks. Return the position of the last flow if there is
 * an overflow.
 * TODO: deal with chunks that did not fit at all.
 * @return {adapt.task.Result.<adapt.vtree.ChunkPosition>} holding end position.
 */
adapt.layout.Column.prototype.redoLayout = function() {
    var chunkPositions = this.chunkPositions;
    var last = this.element.lastChild;
    while (last != this.last) {
        var prev = last.previousSibling;
        if (!(this.element === last.parentNode && this.layoutContext.isPseudoelement(last))) {
            this.element.removeChild(last);
        }
        last = prev;
    }
    this.killFloats();
    this.init();
    var self = this;
    /** @type {!adapt.task.Frame.<adapt.vtree.ChunkPosition>} */ var frame
        = adapt.task.newFrame("redoLayout");
    var i = 0;
    var res = null;
    var leadingEdge = true;
    frame.loopWithFrame(loopFrame => {
        if (i < chunkPositions.length) {
            var chunkPosition = chunkPositions[i++];
            self.layout(chunkPosition, leadingEdge).then(pos => {
                leadingEdge = false;
                if (pos) {
                    res = pos;
                    loopFrame.breakLoop();
                } else {
                    loopFrame.continueLoop();
                }
            });
            return;
        }
        loopFrame.breakLoop();
    }).then(() => {
        frame.finish(res);
    });
    return frame.result();
};

adapt.layout.Column.prototype.saveDistanceToBlockEndFloats = function() {
    var blockStartEdgeOfBlockEndFloats = this.pageFloatLayoutContext.getBlockStartEdgeOfBlockEndFloats();
    if (blockStartEdgeOfBlockEndFloats > 0 && isFinite(blockStartEdgeOfBlockEndFloats)) {
        this.blockDistanceToBlockEndFloats = this.getBoxDir() * (blockStartEdgeOfBlockEndFloats - this.beforeEdge - this.computedBlockSize);
    }
};


/**
 * @param {Node} node
 * @return {boolean}
 */
adapt.layout.isOrphan = node => {
    while (node) {
        if (node.parentNode === node.ownerDocument) return false;
        node = node.parentNode;
    }
    return true;
};

/**
 * @constructor
 * @param {boolean} leadingEdge
 * @param {?string=} breakAfter
 * @extends {vivliostyle.layoututil.AbstractLayoutRetryer}
 */
adapt.layout.LayoutRetryer = function(leadingEdge, breakAfter) {
    vivliostyle.layoututil.AbstractLayoutRetryer.call(this);
    /** @const */ this.leadingEdge = leadingEdge;
    /** @const */ this.breakAfter = breakAfter || null;
    /** @private @type {?string} */ this.initialPageBreakType = null;
    /** @private @type {number} */ this.initialComputedBlockSize = 0;
    /** @private @type {boolean} */ this.initialOverflown = false;
    /** @type {{overflownNodeContext: adapt.vtree.NodeContext}} */ this.context = {overflownNodeContext:null};
};
goog.inherits(adapt.layout.LayoutRetryer, vivliostyle.layoututil.AbstractLayoutRetryer);

/**
 * @override
 */
adapt.layout.LayoutRetryer.prototype.resolveLayoutMode = function(nodeContext) {
    return new adapt.layout.DefaultLayoutMode(this.leadingEdge, this.breakAfter, this.context);
};

/**
 * @override
 */
adapt.layout.LayoutRetryer.prototype.prepareLayout = (nodeContext, column) => {
    column.fragmentLayoutConstraints = [];
    if (!column.pseudoParent) vivliostyle.repetitiveelements.clearCache();
};

/**
 * @override
 */
adapt.layout.LayoutRetryer.prototype.clearNodes = function(initialPosition) {
    vivliostyle.layoututil.AbstractLayoutRetryer.prototype.clearNodes.call(this, initialPosition);
    var nodeContext = initialPosition;
    while (nodeContext) {
        var viewNode = nodeContext.viewNode;
        if (viewNode) {
            adapt.layout.removeFollowingSiblings(viewNode.parentNode, viewNode);
        }
        nodeContext = nodeContext.parent;
    }
};

/**
 * @override
 */
adapt.layout.LayoutRetryer.prototype.saveState = function(nodeContext, column) {
    vivliostyle.layoututil.AbstractLayoutRetryer.prototype.saveState.call(this, nodeContext, column);
    this.initialPageBreakType = column.pageBreakType;
    this.initialComputedBlockSize = column.computedBlockSize;
    this.initialOverflown = column.overflown;
};

/**
 * @override
 */
adapt.layout.LayoutRetryer.prototype.restoreState = function(nodeContext, column) {
    vivliostyle.layoututil.AbstractLayoutRetryer.prototype.restoreState.call(this, nodeContext, column);
    column.pageBreakType = this.initialPageBreakType;
    column.computedBlockSize = this.initialComputedBlockSize;
    column.overflown = this.initialOverflown;
};

/**
 * @constructor
 * @param {boolean} leadingEdge
 * @param {?string} breakAfter
 * @param {{overflownNodeContext: adapt.vtree.NodeContext}} context
 * @implements {vivliostyle.layoututil.LayoutMode}
 */
adapt.layout.DefaultLayoutMode = function(leadingEdge, breakAfter, context) {
    /** @const */ this.leadingEdge = leadingEdge;
    /** @const */ this.breakAfter = breakAfter;
    /** @const */ this.context = context;
};

/**
 * @override
 */
adapt.layout.DefaultLayoutMode.prototype.doLayout = function(nodeContext, column) {
    /** @type {!adapt.task.Frame.<adapt.vtree.NodeContext>} */ var frame =
        adapt.task.newFrame("adapt.layout.DefaultLayoutMode.doLayout");
    vivliostyle.selectors.processAfterIfContinuesOfAncestors(nodeContext, column).then(() => {
        column.doLayout(nodeContext, this.leadingEdge, this.breakAfter).then(result => {
            this.context.overflownNodeContext = result.overflownNodeContext;
            frame.finish(result.nodeContext);
        });
    });
    return frame.result();
};

/**
 * @override
 */
adapt.layout.DefaultLayoutMode.prototype.accept = function(nodeContext, column) {
    if (column.pageFloatLayoutContext.isInvalidated() || column.pageBreakType) {
        return true;
    }
    if (column.fragmentLayoutConstraints.length <= 0) return true;
    return column.fragmentLayoutConstraints.every(constraint => constraint.allowLayout(nodeContext, this.context.overflownNodeContext, column));
};

/**
 * @override
 */
adapt.layout.DefaultLayoutMode.prototype.postLayout = (positionAfter, initialPosition, column, accepted) => {
    if (!accepted) {
        var hasNextCandidate = column.fragmentLayoutConstraints.some(constraint => constraint.nextCandidate(positionAfter));
        // If there is no next candidate, we accept the current layout trial.
        // Later Column#doFinishBreak decides whether the overflowing content
        // should be placed as is or be deferred to the next column,
        // depending on the value of Column#forceNonfitting.
        accepted = !hasNextCandidate;
    }
    column.fragmentLayoutConstraints.forEach(constraint => {
        constraint.postLayout(accepted, positionAfter, initialPosition, column);
    });
    return accepted;
};

/**
 * @constructor
 * @implements {adapt.layout.LayoutProcessor}
 */
adapt.layout.BlockLayoutProcessor = function() {};

/**
 * @override
 */
adapt.layout.BlockLayoutProcessor.prototype.layout = (nodeContext, column, leadingEdge) => {
    if (column.isFloatNodeContext(nodeContext)) {
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
adapt.layout.BlockLayoutProcessor.prototype.createEdgeBreakPosition = (position, breakOnEdge, overflows, columnBlockSize) => new adapt.layout.EdgeBreakPosition(position.copy(), breakOnEdge, overflows, columnBlockSize);
/**
 * @override
 */
adapt.layout.BlockLayoutProcessor.prototype.startNonInlineElementNode = nodeContext => false;
/**
 * @override
 */
adapt.layout.BlockLayoutProcessor.prototype.afterNonInlineElementNode = nodeContext => false;

/**
 * @override
 */
adapt.layout.BlockLayoutProcessor.prototype.clearOverflownViewNodes = (column, parentNodeContext, nodeContext, removeSelf) => {
    if (!nodeContext.viewNode) return;
    if (!nodeContext.viewNode.parentNode) return;
    var parentNode = nodeContext.viewNode.parentNode;

    adapt.layout.removeFollowingSiblings(parentNode, nodeContext.viewNode);
    if (removeSelf) {
        parentNode.removeChild(nodeContext.viewNode);
    }
};

/**
 * @param {!adapt.layout.Column} column
 * @param {adapt.vtree.NodeContext} nodeContext
 * @param {boolean} forceRemoveSelf
 * @param {boolean} endOfColumn
 * @return {!adapt.task.Result.<boolean>} holing true
 * @override
 */
adapt.layout.BlockLayoutProcessor.prototype.finishBreak = (column, nodeContext, forceRemoveSelf, endOfColumn) => {
    var removeSelf = forceRemoveSelf || (nodeContext.viewNode != null && nodeContext.viewNode.nodeType == 1 && !nodeContext.after);
    column.clearOverflownViewNodes(nodeContext, removeSelf);
    if (endOfColumn) {
        column.fixJustificationIfNeeded(nodeContext, true);
        column.layoutContext.processFragmentedBlockEdge(removeSelf ? nodeContext : nodeContext.parent);
    }
    return adapt.task.newResult(true);
};

/**
 * @const
 */
adapt.layout.blockLayoutProcessor = new adapt.layout.BlockLayoutProcessor();

vivliostyle.plugin.registerHook(vivliostyle.plugin.HOOKS.RESOLVE_FORMATTING_CONTEXT,
    (nodeContext, firstTime, display, position, floatSide, isRoot) => {
        var parent = nodeContext.parent;
        if (!parent && nodeContext.formattingContext) {
            return null;
        } else if (parent && nodeContext.formattingContext !== parent.formattingContext) {
            return null;
        } else if (nodeContext.establishesBFC ||
            (!nodeContext.formattingContext && vivliostyle.display.isBlock(display, position, floatSide, isRoot))) {
            return new adapt.layout.BlockFormattingContext(parent ? parent.formattingContext : null);
        } else {
            return null;
        }
    }
);

vivliostyle.plugin.registerHook(vivliostyle.plugin.HOOKS.RESOLVE_LAYOUT_PROCESSOR, formattingContext => {
    if (formattingContext instanceof adapt.layout.BlockFormattingContext) {
        return adapt.layout.blockLayoutProcessor;
    }
    return null;
});

/**
 * @constructor
 * @param {string} floatSide
 * @param {Element} element
 * @param {!adapt.vtree.LayoutContext} layoutContext
 * @param {adapt.vtree.ClientLayout} clientLayout
 * @param {adapt.layout.LayoutConstraint} layoutConstraint
 * @param {!vivliostyle.pagefloat.PageFloatLayoutContext} pageFloatLayoutContext
 * @param {adapt.vtree.Container} parentContainer
 * @extends {adapt.layout.Column}
 */
adapt.layout.PageFloatArea = function(floatSide, element, layoutContext, clientLayout, layoutConstraint,
                                      pageFloatLayoutContext, parentContainer) {
    adapt.layout.Column.call(this, element, layoutContext, clientLayout, layoutConstraint,
        pageFloatLayoutContext);
    /** @const */ this.floatSide = floatSide;
    /** @const */ this.parentContainer = parentContainer;
    /** @private @type {!Array<!Element>} */ this.rootViewNodes = [];
    /** @private @type {!Array<!adapt.geom.Insets>} */ this.floatMargins = [];
    /** @type {boolean} */ this.adjustContentRelativeSize = true;
};
goog.inherits(adapt.layout.PageFloatArea, adapt.layout.Column);

/**
 * @override
 */
adapt.layout.PageFloatArea.prototype.openAllViews = function(position) {
    return adapt.layout.Column.prototype.openAllViews.call(this, position).thenAsync(nodeContext => {
        if (nodeContext)
            this.fixFloatSizeAndPosition(nodeContext);
        return adapt.task.newResult(nodeContext);
    });
};

/**
 * @param {!Element} target
 */
adapt.layout.PageFloatArea.prototype.convertPercentageSizesToPx = function(
    target) {
    var containingBlockRect = this.parentContainer.getPaddingRect();
    var refWidth = containingBlockRect.x2 - containingBlockRect.x1;
    var refHeight = containingBlockRect.y2 - containingBlockRect.y1;

    /**
     * @param {!Array<string>} props
     * @param {number} refValue
     */
    function convertPercentageToPx(props, refValue) {
        props.forEach(propName => {
            var valueString = adapt.base.getCSSProperty(target, propName);
            if (valueString && valueString.charAt(valueString.length - 1) === "%") {
                var percentageValue = parseFloat(valueString);
                var value = refValue * percentageValue / 100;
                adapt.base.setCSSProperty(target, propName, value + "px");
            }
        });
    }

    convertPercentageToPx(["width", "max-width", "min-width"], refWidth);
    convertPercentageToPx(["height", "max-height", "min-height"], refHeight);
    convertPercentageToPx([
        "margin-top", "margin-right", "margin-bottom", "margin-left",
        "padding-top", "padding-right", "padding-bottom", "padding-left"
    ], this.vertical ? refHeight : refWidth);
    ["margin-top", "margin-right", "margin-bottom", "margin-left"].forEach(propName => {
        var value = adapt.base.getCSSProperty(target, propName);
        if (value === "auto")
            adapt.base.setCSSProperty(target, propName, "0");
    });
};

/**
 * @param {adapt.vtree.NodeContext} nodeContext
 */
adapt.layout.PageFloatArea.prototype.fixFloatSizeAndPosition = function(nodeContext) {
    while (nodeContext.parent) {
        nodeContext = nodeContext.parent;
    }
    goog.asserts.assert(nodeContext.viewNode.nodeType === 1);
    var rootViewNode = /** @type {!Element} */ (nodeContext.viewNode);
    this.rootViewNodes.push(rootViewNode);

    if (this.adjustContentRelativeSize) {
        this.convertPercentageSizesToPx(rootViewNode);
    }

    this.floatMargins.push(this.getComputedMargin(rootViewNode));

    if (this.adjustContentRelativeSize) {
        var floatSide = this.floatSide;
        var isVertical = this.parentContainer.vertical;
        if (isVertical) {
            if (floatSide === "block-end" || floatSide === "left") {
                var height = adapt.base.getCSSProperty(rootViewNode, "height");
                if (height !== "" && height !== "auto")
                    adapt.base.setCSSProperty(rootViewNode, "margin-top", "auto");
            }
        } else {
            if (floatSide === "block-end" || floatSide === "bottom") {
                var width = adapt.base.getCSSProperty(rootViewNode, "width");
                if (width !== "" && width !== "auto")
                    adapt.base.setCSSProperty(rootViewNode, "margin-left", "auto");
            }
        }
    }
};

/**
 * @returns {number}
 */
adapt.layout.PageFloatArea.prototype.getContentInlineSize = function() {
    return Math.max.apply(null, this.rootViewNodes.map(function(r, i) {
        var box = this.clientLayout.getElementClientRect(r);
        var margin = this.floatMargins[i];
        return this.vertical ?
            margin.top + box.height + margin.bottom :
            margin.left + box.width + margin.right;
    }, this));
};

/**
 * @param {!Element} element
 * @param {!adapt.layout.Column} column
 * @param {boolean} vertical
 * @return {number}
 */
adapt.layout.getElementHeight = (element, column, vertical) => {
    var rect = column.clientLayout.getElementClientRect(element);
    var margin = column.getComputedMargin(element);
    return vertical
        ? rect["width"]  + margin["left"] + margin["right"]
        : rect["height"] + margin["top"]  + margin["bottom"];
};
