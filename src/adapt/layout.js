/**
 * Copyright 2013 Google, Inc.
 * Copyright 2015 Vivliostyle Inc.
 * @fileoverview Fills a region with styled content. This file does not communicate with
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

goog.provide('adapt.layout');

/** @const */
adapt.layout.mediaTags = {
	"img": true,
	"svg": true,
	"audio": true,
	"video": true
};

/**
 * Chrome bug workaround.
 * @param {adapt.vtree.ClientLayout} clientLayout
 * @param {Node} node
 * @param {Array.<adapt.vtree.ClientRect>} boxes
 * @return {Array.<adapt.vtree.ClientRect>}
 */
adapt.layout.fixBoxesForNode = function(clientLayout, boxes, node) {
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
					Math.abs(box.right - fullBox.right) < 1) {
				result.push({top:box.top, left:fullBox.left, bottom:fullBox.bottom, right: fullBox.right});
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
adapt.layout.calculateEdge = function(nodeContext, clientLayout,
		extraOffset, vertical) {
    var node = nodeContext.viewNode;
    if (!node)
        return NaN;
    if (node.nodeType == 1) {
        if (nodeContext.after) {
            var cbox = clientLayout.getElementClientRect(
            		/** @type {Element} */ (node));
            if (cbox.right >= cbox.left && cbox.bottom >= cbox.top) {
                return vertical ? cbox.left : cbox.bottom;
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
 * Represents a constraint on layout
 * @interface
 */
adapt.layout.LayoutConstraint = function() {};

/**
 * Returns if this constraint allows the node context to be laid out at the current position.
 * @param {adapt.vtree.NodeContext} nodeContext
 * @return {boolean}
 */
adapt.layout.LayoutConstraint.prototype.allowLayout = function(nodeContext) {};

/**
 * Potential breaking position.
 * @interface
 */
adapt.layout.BreakPosition = function() {};

/**
 * @param {adapt.layout.Column} column
 * @param {number} penalty
 * @return {adapt.vtree.NodeContext} break position, if found
 */
adapt.layout.BreakPosition.prototype.findAcceptableBreak = function(column, penalty) {};

/**
 * @return {number} penalty for this break position
 */
adapt.layout.BreakPosition.prototype.getMinBreakPenalty = function() {};

/**
 * Potential breaking position inside CSS box (between lines).
 * @constructor
 * @param {Array.<adapt.vtree.NodeContext>} checkPoints array of breaking points for
 *    breakable block
 * @param {number} penalty
 * @implements {adapt.layout.BreakPosition}
 */
adapt.layout.BoxBreakPosition = function(checkPoints, penalty) {
	/** @const */ this.checkPoints = checkPoints;
	/** @const */ this.penalty = penalty;
};

/**
 * @override
 */
adapt.layout.BoxBreakPosition.prototype.findAcceptableBreak = function(column, penalty) {
	if (penalty < this.penalty)
		return null;
	return column.findBoxBreakPosition(this, penalty > 0);
};

/**
 * @override
 */
adapt.layout.BoxBreakPosition.prototype.getMinBreakPenalty = function() {
	return this.penalty;
};

/**
 * Potential edge breaking position.
 * @constructor
 * @param {adapt.vtree.NodeContext} position
 * @param {?string} breakOnEdge
 * @param {boolean} overflows
 * @param {number} computedBlockSize
 * @implements {adapt.layout.BreakPosition}
 */
adapt.layout.EdgeBreakPosition = function(position, breakOnEdge, overflows, computedBlockSize) {
	/** @const */ this.position = position;
	/** @const */ this.breakOnEdge = breakOnEdge;
	/** @const */ this.overflows = overflows;
	/** @const */ this.computedBlockSize = computedBlockSize;
};

/**
 * @override
 */
adapt.layout.EdgeBreakPosition.prototype.findAcceptableBreak = function(column, penalty) {
	if (penalty < this.getMinBreakPenalty())
		return null;
	return column.findEdgeBreakPosition(this);
};

/**
 * @override
 */
adapt.layout.EdgeBreakPosition.prototype.getMinBreakPenalty = function() {
	return (vivliostyle.break.isAvoidBreakValue(this.breakOnEdge) ? 1 : 0)
		+ (this.overflows ? 3 : 0)
		+ (this.position.parent ? this.position.parent.breakPenalty : 0);
};


/**
 * Record describing added footnote
 * @constructor
 * @param {number} boxOffset
 * @param {adapt.vtree.NodePosition} startPosition
 * @param {?adapt.vtree.NodePosition} overflowPosition
 */
adapt.layout.FootnoteItem = function(boxOffset, startPosition, overflowPosition) {
	/** @const */ this.boxOffset = boxOffset;
	/** @const */ this.startPosition = startPosition;
	/** @const */ this.overflowPosition = overflowPosition;
};

/**
 * @param {Array.<adapt.vtree.NodeContext>} checkPoints 
 */
adapt.layout.validateCheckPoints = function(checkPoints) {
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
				if (cp0.after) {
					vivliostyle.logging.logger.warn("validateCheckPoints: inconsistent after point");
				} else {
					if (cp1.boxOffset - cp0.boxOffset != cp1.offsetInNode - cp0.offsetInNode) {
						vivliostyle.logging.logger.warn("validateCheckPoints: boxOffset inconsistent with offsetInNode");
					}
				}
			}
		}
	}
};

/**
 * @constructor
 * @param {Element} element
 * @param {adapt.vtree.LayoutContext} layoutContext
 * @param {adapt.vtree.ClientLayout} clientLayout
 * @param {adapt.layout.LayoutConstraint} layoutConstraint
 * @extends {adapt.vtree.Container}
 */
adapt.layout.Column = function(element, layoutContext, clientLayout, layoutConstraint) {
	adapt.vtree.Container.call(this, element);
	/** @type {Node} */ this.last = element.lastChild;
	/** @type {adapt.vtree.LayoutContext} */ this.layoutContext = layoutContext;
	/** @type {adapt.vtree.ClientLayout} */ this.clientLayout = clientLayout;
	/** @const */ this.layoutConstraint = layoutConstraint;
	/** @type {Document} */ this.viewDocument = element.ownerDocument;
    /** @type {boolean} */ this.isFootnote = false;
	/** @type {number} */ this.startEdge = 0;
	/** @type {number} */ this.endEdge = 0;
	/** @type {number} */ this.beforeEdge = 0;
	/** @type {number} */ this.afterEdge = 0;
	/** @type {number} */ this.footnoteEdge = 0;
	/** @type {adapt.geom.Rect} */ this.box = null;
	/** @type {adapt.layout.Column} */ this.footnoteArea = null;
	/** @type {Array.<adapt.vtree.ChunkPosition>} */ this.chunkPositions = null;
	/** @type {Array.<adapt.geom.Band>} */ this.bands = null;
	/** @type {boolean} */ this.overflown = false;
	/** @type {Array.<adapt.layout.BreakPosition>} */ this.breakPositions = null;
	/** @type {Array.<adapt.layout.FootnoteItem>} */ this.footnoteItems = null;
	/** @type {?string} */ this.pageBreakType = null;
	/** @type {boolean} */ this.forceNonfitting = true;
	/** @type {number} */ this.leftFloatEdge = 0;  // bottom of the bottommost left float
	/** @type {number} */ this.rightFloatEdge = 0;  // bottom of the bottommost right float
	/** @type {number} */ this.bottommostFloatTop = 0;  // Top of the bottommost float
};
goog.inherits(adapt.layout.Column, adapt.vtree.Container);

/**
 * Saves the state of this column. init() is required for the new column before doing layout.
 * @return {adapt.layout.Column}
 */
adapt.layout.Column.prototype.clone = function() {
	var copy = new adapt.layout.Column(this.element, this.layoutContext, this.clientLayout, this.layoutConstraint);
	copy.copyFrom(this);
	copy.last = this.last;
    copy.isFootnote = this.isFootnote;
	copy.footnoteArea = (this.footnoteArea ? this.footnoteArea.clone() : null);
	copy.chunkPositions = this.chunkPositions.concat();  // Make a copy
	return copy;
};

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
 * @returns {boolean}
 */
adapt.layout.Column.prototype.hasNewlyAddedPageFloats = function() {
	return this.layoutContext.getPageFloatHolder().hasNewlyAddedFloats();
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
 * @param {Node} parentNode
 * @param {Node} viewNode
 * @return {void}
 */
adapt.layout.Column.prototype.removeFollowingSiblings = function(parentNode, viewNode) {
    if (!parentNode)
        return;
    /** @type {Node} */ var lastChild;
    while ((lastChild = parentNode.lastChild) != viewNode)
        parentNode.removeChild(lastChild);
};

/**
 * @param {adapt.vtree.NodePositionStep} step
 * @param {adapt.vtree.NodeContext} parent
 * @return {adapt.vtree.NodeContext}
 * @private
 */
adapt.layout.Column.prototype.makeNodeContext = function(step, parent) {
	var nodeContext = new adapt.vtree.NodeContext(step.node, parent, 0);
	nodeContext.shadowType = step.shadowType;
	nodeContext.shadowContext = step.shadowContext,
	nodeContext.nodeShadow = step.nodeShadow;
	nodeContext.shadowSibling = step.shadowSibling ?
			this.makeNodeContext(step.shadowSibling, parent.copy()) : null;
	return nodeContext;
};

/**
 * @param {adapt.vtree.NodePosition} position
 * @return {!adapt.task.Result.<adapt.vtree.NodeContext>}
 */
adapt.layout.Column.prototype.openAllViews = function(position) {
	var self = this;
	/** @type {!adapt.task.Frame.<adapt.vtree.NodeContext>} */ var frame =
		adapt.task.newFrame("openAllViews");
	var steps = position.steps;
    self.layoutContext.setViewRoot(self.element, self.isFootnote);
    var stepIndex = steps.length - 1;
    var nodeContext = null;
    frame.loop(function() {
	    while (stepIndex >= 0) {
	    	var prevContext = nodeContext;
			var step = steps[stepIndex];
			nodeContext = self.makeNodeContext(step, prevContext);
			if (stepIndex == 0) {
				nodeContext.offsetInNode = position.offsetInNode;
				nodeContext.after = position.after;
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
    }).then(function() {
	    frame.finish(nodeContext);
    });
    return frame.result();
};

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
	/** @type {!adapt.task.Frame.<adapt.vtree.NodeContext>} */ var frame
		= adapt.task.newFrame("buildViewToNextBlockEdge");
	frame.loopWithFrame(function(bodyFrame) {
        if (position.viewNode)
            checkPoints.push(position.copy());
        self.maybePeelOff(position, 0).then(function(position1Param) {
        	var position1 = /** @type {adapt.vtree.NodeContext} */ (position1Param);
	        if (position1 !== position) {
	        	position = position1;
	            checkPoints.push(position.copy());
	        }
	        self.layoutContext.nextInTree(position).then(function(positionParam) {
	        	position = /** @type {adapt.vtree.NodeContext} */ (positionParam);
		        if (!position) {
		        	// Exit the loop
		        	bodyFrame.breakLoop();
		            return;
		        }
				if (!self.layoutConstraint.allowLayout(position)) {
					position = position.modify();
					position.overflow = true;
					bodyFrame.breakLoop();
					return;
				}
		        if (position.floatSide && !self.vertical) {
		        	// TODO: implement floats and footnotes properly
		        	self.layoutFloatOrFootnote(position).then(function(positionParam) {
			        	position = /** @type {adapt.vtree.NodeContext} */ (positionParam);
			        	if (!position || position.overflow || self.hasNewlyAddedPageFloats()) {
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
	}).then(function() {
		frame.finish(position);
	});
    return frame.result();
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
    var sourceNode = position.sourceNode;
    var self = this;
    /** @type {!adapt.task.Frame.<adapt.vtree.NodeContext>} */ var frame =
    	adapt.task.newFrame("buildDeepElementView");
    // TODO: end the loop based on depth, not sourceNode comparison
	frame.loopWithFrame(function(bodyFrame) {
        self.maybePeelOff(position, 0).then(function(position1Param) {
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
	        }
	        self.layoutContext.nextInTree(position1).then(function(positionParam) {
	        	position = /** @type {adapt.vtree.NodeContext} */ (positionParam);
		        if (!position || position.sourceNode == sourceNode) {
					bodyFrame.breakLoop();
				} else if (!self.layoutConstraint.allowLayout(position)) {
					position = position.modify();
					position.overflow = true;
					bodyFrame.breakLoop();
		        } else {
		        	bodyFrame.continueLoop();
		        }
	        });
        });
    }).then(function() {
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
	    adapt.base.setCSSProperty(div, "height", width + "px");
	    adapt.base.setCSSProperty(div, "width", height + "px");    	
    } else {
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
 * Create exclusion floats for a region.
 * @return {void}
 */
adapt.layout.Column.prototype.createFloats = function() {
    var ref = this.element.firstChild;
    var bands = this.bands;
    var x1 = this.vertical ? this.getTopEdge() : this.getLeftEdge();
    var x2 = this.vertical ? this.getBottomEdge() : this.getRightEdge();
    for (var ri = 0 ; ri < bands.length ; ri++) {
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
	if (nodeContext && nodeContext.after && !nodeContext.inline) {
		edge = adapt.layout.calculateEdge(nodeContext, this.clientLayout, 0, this.vertical);
		if (!isNaN(edge))
			return edge;
	}
    nodeContext = checkPoints[index];
    var offset = boxOffset - nodeContext.boxOffset;
    while(true) {
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
adapt.layout.Column.prototype.parseComputedLength = function(val) {
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
 * @return {adapt.geom.Insets}
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
 * Layout a single unbreakable element.
 * @param {adapt.vtree.NodeContext} nodeContextIn
 * @return {!adapt.task.Result.<adapt.vtree.NodeContext>}
 */
adapt.layout.Column.prototype.layoutUnbreakable = function(nodeContextIn) {
    return this.buildDeepElementView(nodeContextIn);
};

/**
 * @param {number} boxOffset
 * @param {adapt.vtree.NodePosition} footnoteNodePosition
 */
adapt.layout.Column.prototype.processFullyOverflownFootnote = function(boxOffset, footnoteNodePosition) {
	// already have overflowing footnotes, just add to the list
	var footnoteItem = new adapt.layout.FootnoteItem(boxOffset, footnoteNodePosition,
			footnoteNodePosition);
	if (this.footnoteItems) {
		this.footnoteItems.push(footnoteItem);
	} else {
		this.footnoteItems = [footnoteItem];
	}
};

/**
 * @param {number} boxOffset
 * @param {adapt.vtree.NodePosition} footnoteNodePosition
 * @param {number} boundingEdge
 * @return {!adapt.task.Result.<boolean>} holding true
 */
adapt.layout.Column.prototype.layoutFootnoteInner = function(boxOffset, footnoteNodePosition, boundingEdge) {
	var self = this;
	if (self.footnoteItems) {
		var lastItem = self.footnoteItems[self.footnoteItems.length - 1];
		if (lastItem.overflowPosition) {
			self.processFullyOverflownFootnote(boxOffset, footnoteNodePosition);
			return adapt.task.newResult(true);
		}
	}
	boundingEdge += self.getBoxDir() * 40; // Leave some space
	var footnoteArea = self.footnoteArea;
	var firstFootnoteInColumn = !footnoteArea;
    if (firstFootnoteInColumn) {
    	var footnoteContainer = self.element.ownerDocument.createElement("div");
        adapt.base.setCSSProperty(footnoteContainer, "position", "absolute");
        var layoutContext = self.layoutContext.clone();
    	footnoteArea = new adapt.layout.Column(footnoteContainer,
    			layoutContext, self.clientLayout, self.layoutConstraint);
    	self.footnoteArea = footnoteArea;
    	footnoteArea.vertical = self.layoutContext.applyFootnoteStyle(self.vertical, footnoteContainer);
    	footnoteArea.isFootnote = true;
    	if (self.vertical) {
	    	footnoteArea.left = 0;    		
	    	adapt.base.setCSSProperty(footnoteArea.element, "width", "2em");
    	} else {
	    	footnoteArea.top = self.afterEdge;
	    	adapt.base.setCSSProperty(footnoteArea.element, "height", "2em");
    	}
    }
	self.element.appendChild(footnoteArea.element);
	self.setComputedInsets(footnoteArea.element, footnoteArea);
	var before = self.getBoxDir() * (boundingEdge - self.beforeEdge);
	if (self.vertical) {
		footnoteArea.height = self.box.y2 - self.box.y1
			- footnoteArea.getInsetTop() - footnoteArea.getInsetBottom();		
	} else {
		footnoteArea.width = self.box.x2 - self.box.x1
			- footnoteArea.getInsetLeft() - footnoteArea.getInsetRight();
	}
	var blockDirInsets = self.vertical ? 
			footnoteArea.getInsetLeft() - footnoteArea.getInsetRight() :
			footnoteArea.getInsetTop() + footnoteArea.getInsetBottom();
	var extent = self.getBoxDir() * (self.afterEdge - boundingEdge) - blockDirInsets;
	if (firstFootnoteInColumn && extent < 18) {
		self.element.removeChild(footnoteArea.element);
		self.footnoteArea = null;
		self.processFullyOverflownFootnote(boxOffset, footnoteNodePosition);
		return adapt.task.newResult(true);
	}
	if (!self.vertical && footnoteArea.top < before) {  // Can be removed???
		self.element.removeChild(footnoteArea.element);
		self.processFullyOverflownFootnote(boxOffset, footnoteNodePosition);
		return adapt.task.newResult(true);
	}
	
	/** @type {!adapt.task.Frame.<boolean>} */ var frame
		= adapt.task.newFrame("layoutFootnoteInner");
	if (self.vertical) {
		footnoteArea.setHorizontalPosition(0, extent);		
	} else {
		footnoteArea.setVerticalPosition(before, extent);
	}
    footnoteArea.originX = self.originX + self.left + self.getInsetLeft();
    footnoteArea.originY = self.originY + self.top + self.getInsetTop();    
    footnoteArea.exclusions = self.exclusions;
    var footnotePosition = new adapt.vtree.ChunkPosition(footnoteNodePosition);
    var initResult;
    if (firstFootnoteInColumn) {
    	footnoteArea.init();
    	initResult = adapt.task.newResult(true);
    } else if (footnoteArea.exclusions.length == 0) {
    	// No need to redo, just reset the geometry
    	footnoteArea.initGeom();
    	initResult = adapt.task.newResult(true);
    } else {
    	// Don't expect overflow, as we gave it more space
    	initResult = footnoteArea.redoLayout();
    }
    initResult.then(function() {
		footnoteArea.layout(footnotePosition).then(function(footnoteOverflowParam) {
			var footnoteOverflow = /** @type {adapt.vtree.ChunkPosition} */ (footnoteOverflowParam);
			// If the footnote overflows, defer it to the next column entirely.
			// TODO: Possibility of infinite loops?
			if (firstFootnoteInColumn && footnoteOverflow) {
				self.element.removeChild(footnoteArea.element);
				self.processFullyOverflownFootnote(boxOffset, footnoteNodePosition);
				self.footnoteArea = null;
				frame.finish(true);
				return;
			}
			if (self.vertical) {
				self.footnoteEdge = self.afterEdge + (footnoteArea.computedBlockSize
						+ footnoteArea.getInsetLeft() + footnoteArea.getInsetRight());
				footnoteArea.setHorizontalPosition(0, footnoteArea.computedBlockSize);				
			} else {
				self.footnoteEdge = self.afterEdge - (footnoteArea.computedBlockSize
						+ footnoteArea.getInsetTop() + footnoteArea.getInsetBottom());
				var footnoteTop = self.footnoteEdge - self.beforeEdge;
				footnoteArea.setVerticalPosition(footnoteTop, footnoteArea.computedBlockSize);
			}
			var redoResult;
			if (!self.vertical && footnoteArea.exclusions.length > 0) {
				redoResult = footnoteArea.redoLayout();
			} else {
				redoResult = adapt.task.newResult(footnoteOverflow);
			}
			redoResult.then(function(footnoteOverflow) {
				var overflowPosition = footnoteOverflow ? footnoteOverflow.primary : null;
				var footnoteItem = new adapt.layout.FootnoteItem(boxOffset, footnoteNodePosition,
						overflowPosition);
				if (self.footnoteItems) {
					self.footnoteItems.push(footnoteItem);
				} else {
					self.footnoteItems = [footnoteItem];
				}
				frame.finish(true);
			});
		});
    });
	return frame.result();
};

/**
 * Layout a footnote.
 * @param {adapt.vtree.NodeContext} nodeContext
 * @return {!adapt.task.Result.<adapt.vtree.NodeContext>}
 */
adapt.layout.Column.prototype.layoutFootnote = function(nodeContext) {
	var self = this;
	/** @type {!adapt.task.Frame.<adapt.vtree.NodeContext>} */ var frame
		= adapt.task.newFrame("layoutFootnote");
    var element = /** @type {Element} */ (nodeContext.viewNode);
    element.setAttribute("style", ""); // clear styling
    // Default footnote call style
    adapt.base.setCSSProperty(element, "display", "inline-block");
    element.textContent = "M";  // To measure position
    var callBox = self.clientLayout.getElementClientRect(element);
    var callBoxAfter = self.getAfterEdge(callBox);
    element.textContent = "";
    // Defaults for footnote-call, can be overriden by the stylesheet.
    self.layoutContext.applyPseudoelementStyle(nodeContext, "footnote-call", element);
    if (!element.textContent) {
    	element.parentNode.removeChild(element);
    }
    var footnoteNodePosition = adapt.vtree.newNodePositionFromNodeContext(nodeContext);
    var boxOffset = nodeContext.boxOffset;
    nodeContext = nodeContext.modify();
    nodeContext.after = true;
    self.layoutFootnoteInner(boxOffset, footnoteNodePosition, callBoxAfter).then(function() {
	    if (self.footnoteArea && self.footnoteArea.element.parentNode) {
	    	self.element.removeChild(self.footnoteArea.element);
	    }
	    if (self.isOverflown(callBoxAfter) && self.breakPositions.length != 0) {
	    	nodeContext.overflow = true;
	    }
    	frame.finish(nodeContext);
    });
    return frame.result();
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
	var floatReference = /** @type {string} */ (nodeContext.floatReference);
	var direction = nodeContext.parent ? nodeContext.parent.direction : "ltr";
	var floatHolder = self.layoutContext.getPageFloatHolder();

	var originalViewNodeParent = nodeContext.viewNode.parentNode;

	if (floatReference === "page") {
		floatHolder.prepareFloatElement(element, floatSide);
	} else {
		adapt.base.setCSSProperty(element, "float", "none");
		adapt.base.setCSSProperty(element, "display", "inline-block");
		adapt.base.setCSSProperty(element, "vertical-align", "top");                
	}
    self.buildDeepElementView(nodeContext).then(function(nodeContextAfter) {
		var floatBBox = self.clientLayout.getElementClientRect(element);
	    var margin = self.getComputedMargin(element);
	    var floatBox = new adapt.geom.Rect(floatBBox.left - margin.left,
	    		floatBBox.top - margin.top, floatBBox.right + margin.right,
	    		floatBBox.bottom + margin.bottom);

		// page floats
		if (floatReference === "page") {
			goog.asserts.assert(self.layoutContext);
			var pageFloat = floatHolder.getFloat(nodeContext, self.layoutContext);
			if (pageFloat) {
				// Replace nodeContextAfter.viewNode with a dummy span.
				// Since the actual viewNode is moved and attached to a parent node
				// which is different from that of subsequent content nodes,
				// clearOverflownViewNodes method does not work correctly without this replacement.
				var dummy = originalViewNodeParent.ownerDocument.createElement("span");
				adapt.base.setCSSProperty(dummy, "width", "0");
				adapt.base.setCSSProperty(dummy, "height", "0");
				originalViewNodeParent.appendChild(dummy);
				nodeContextAfter.viewNode = dummy;
				frame.finish(nodeContextAfter);
			} else {
				floatHolder.tryToAddFloat(nodeContext, element, floatBox, floatSide).then(function() {
					frame.finish(null);
				});
			}
			return;
		}

		floatSide = vivliostyle.pagefloat.resolveInlineFloatDirection(floatSide, self.vertical, direction);
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
			offsets = {left: self.getLeftEdge(), right: self.getRightEdge(), top: self.getTopEdge()};
		}

		if (containingBlockForAbsolute ? containingBlockForAbsolute.vertical : self.vertical) {
			adapt.base.setCSSProperty(element, "right",
				(offsets.right - floatBox.x2 + self.paddingRight) + "px");
		} else {
			adapt.base.setCSSProperty(element, "left",
				(floatBox.x1 - offsets.left + self.paddingLeft) + "px");
		}
	    adapt.base.setCSSProperty(element, "top",
	    		(floatBox.y1 - offsets.top + self.paddingTop) + "px");
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
 * Fix justification of the last line of text broken across pages (if
 * needed).
 * @param {adapt.vtree.NodeContext} nodeContext
 * @param {boolean} endOfRegion
 * @return {void}
 */
adapt.layout.Column.prototype.fixJustificationIfNeeded = function(nodeContext, endOfRegion) {
	var node = nodeContext.viewNode;
	var textAlign = "";
    for (; node && endOfRegion && !textAlign; node = node.parentNode) {
    	if (node.nodeType != 1)
    		continue;
    	textAlign = (/** @type {HTMLElement} */ (node)).style.textAlign;
    	if (!endOfRegion)
    		break;
    }
    if (endOfRegion && textAlign != "justify")
    	return;
    node = nodeContext.viewNode;
	var doc = node.ownerDocument;
    var span = /** @type {HTMLElement} */ (doc.createElement("span"));
    span.style.visibility = "hidden";
    span.textContent = " ########################";
    span.setAttribute(adapt.vtree.SPECIAL_ATTR, "1");
    var insertionPoint = endOfRegion && (nodeContext.after || node.nodeType != 1) ? node.nextSibling : node;
    var parent = node.parentNode;
    if (!parent) {
    	// Possible if nothing was added to the column
    	return;
    }
    parent.insertBefore(span, insertionPoint);
    if (!endOfRegion) {
    	var br = /** @type {HTMLElement} */ (doc.createElement("div"));
        parent.insertBefore(br, insertionPoint);
        // TODO: see if it can be reduced
        span.style.lineHeight = "80px";
        br.style.marginTop = "-80px";
    	br.style.height = "0px";
        br.setAttribute(adapt.vtree.SPECIAL_ATTR, "1");
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
	frame.loopWithFrame(function(loopFrame) {
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
		var lineBreak = self.findAcceptableBreakInside(lastCheckPoints, linePositions[count-1]);
		self.finishBreak(lineBreak, false, false).then(function() {
			totalLineCount += count;
			self.layoutContext.peelOff(lineBreak, 0).then(function(resNodeContextParam) {
				nodeContext = resNodeContextParam;
		    	self.fixJustificationIfNeeded(nodeContext, false);		
				firstPseudo = nodeContext.firstPseudo;
				lastCheckPoints = [];  // Wipe out line breaks inside pseudoelements
				self.buildViewToNextBlockEdge(nodeContext, lastCheckPoints).then(function(resNodeContextParam) {
					resNodeContext = resNodeContextParam;
					if (self.hasNewlyAddedPageFloats()) {
						loopFrame.breakLoop();
					} else {
						loopFrame.continueLoop();
					}
				});
			});
		});
	}).then(function() {
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
    self.buildViewToNextBlockEdge(nodeContext, checkPoints).then(function(resNodeContext) {
		if (self.hasNewlyAddedPageFloats()) {
			frame.finish(resNodeContext);
			return;
		}

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
	    var overflown = self.isOverflown(edge);
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
	    lineCont.then(function(nodeContext) {
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
 * @param {Array.<adapt.vtree.NodeContext>} checkPoints
 * @param {number} edgePosition
 * @return {adapt.vtree.NodeContext}
 */
adapt.layout.Column.prototype.findAcceptableBreakInside = function(checkPoints, edgePosition) {
	if (goog.DEBUG) {
		adapt.layout.validateCheckPoints(checkPoints);
	}
    // find the first character which is out
    var lowCP = 0;
    var low = checkPoints[0].boxOffset;
    var low1 = lowCP;
    var highCP = checkPoints.length - 1;
    var high = checkPoints[highCP].boxOffset;
    var mid;
    var viewIndex;
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
        if (this.vertical ? edge < edgePosition : edge > edgePosition) {
            high = mid - 1;
            while (checkPoints[low1].boxOffset == mid)
            	low1--;
            highCP = low1;
        } else {
        	this.updateMaxReachedAfterEdge(edge);
            low = mid;
            lowCP = low1;
        }
    }

    var nodeContext = checkPoints[low1];
    var viewNode = nodeContext.viewNode;
    if (viewNode.nodeType != 1) {
        var textNode = /** @type {Text} */ (viewNode);
    	if (nodeContext.after) {    	
    		nodeContext.offsetInNode = textNode.length;
	    } else {
	    	// Character with index low is the last one that fits.
	        viewIndex = low - nodeContext.boxOffset;
	        var text = textNode.data;
	        if (text.charCodeAt(viewIndex) == 0xAD) {
	        	// convert trailing soft hyphen to a real hyphen
		        textNode.replaceData(viewIndex, text.length - viewIndex, "-");
		        viewIndex++;
	        } else {
	        	// keep the trailing character (it may be a space or not)
	        	var ch0 = text.charAt(viewIndex);
	        	viewIndex++;
	        	var ch1 = text.charAt(viewIndex);
	        	// If automatic hyphen was inserted here, add a real hyphen.
		        textNode.replaceData(viewIndex, text.length - viewIndex, 
		        		adapt.base.isLetter(ch0) && adapt.base.isLetter(ch1) ? "-" : "");	        	
	        }
	        if (viewIndex > 0) {
		        nodeContext = nodeContext.modify();
		        nodeContext.offsetInNode += viewIndex;
		        nodeContext.breakBefore = null;
	        }
	    }
    }
    return nodeContext;
};

/**
 * @param {Element} e
 * @return {boolean}
 */
adapt.layout.isSpecial = function(e) {
	return !!e.getAttribute(adapt.vtree.SPECIAL_ATTR);
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
	    		endNotReached = false;
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
    	} while(seekRange && endNotReached)
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
 * Removes footnotes that were introduced later than then given boxOffset
 * @param {number} boxOffset
 * @return {!adapt.task.Result.<boolean>} holding true
 */
adapt.layout.Column.prototype.clearFootnotes = function(boxOffset) {
	var self = this;
	if (!self.footnoteItems) {
		return adapt.task.newResult(true);
	}
	var redo = false;
	for (var i = self.footnoteItems.length - 1; i >= 0; --i) {
		var item = self.footnoteItems[i];
		if (item.boxOffset <= boxOffset) {
			break;
		}
		self.footnoteItems.pop();
		if (item.overflowPosition !== item.startPosition) {
			redo = true;
		}
	}
	if (!redo) {
		return adapt.task.newResult(true);
	}
	/** @type {!adapt.task.Frame.<boolean>} */ var frame = adapt.task.newFrame("clearFootnotes");
	var maxY = self.computedBlockSize + self.beforeEdge;
	var items = self.footnoteItems;
	self.footnoteArea = null;
	self.footnoteItems = null;
	var k = 0;
	frame.loop(function() {
		while (k < items.length) {
			var item = items[k++];
			var r = self.layoutFootnoteInner(item.boxOffset, item.startPosition, maxY);
			if (r.isPending())
				return r;
		}
		return adapt.task.newResult(false);
	}).then(function() {
		frame.finish(true);
	});
	return frame.result();
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
	var clonedPaddingBorder = 0;
	block.walkBlocksUpToBFC(function(block) {
		if (block.inheritedProps["box-decoration-break"] === "clone") {
			goog.asserts.assert(block.viewNode instanceof Element);
			var paddingBorders = self.getComputedPaddingBorder(block.viewNode);
			clonedPaddingBorder += block.vertical ? -paddingBorders.left : paddingBorders.bottom;
		}
	});

	// Select the first overflowing line break position
	var linePositions = this.findLinePositions(checkPoints);
	var edge = this.footnoteEdge - clonedPaddingBorder;
	var lineIndex = adapt.base.binarySearch(linePositions.length, function(i) {
		return self.vertical ? linePositions[i] < edge : linePositions[i] > edge;
	});
	// First edge after the one that both fits and satisfies widows constraint.
	lineIndex = Math.min(linePositions.length - widows, lineIndex);
	if (lineIndex < orphans) {
	    // Not enough lines to satisfy orphans constraint, cannot break here.
		return null;
	}
	edge = linePositions[lineIndex-1];
	var nodeContext = this.findAcceptableBreakInside(bp.checkPoints, edge);	
	if (nodeContext) {
		this.computedBlockSize = this.getBoxDir() * (edge - this.beforeEdge);		
	}
	return nodeContext;
};

/**
 * @param {adapt.layout.EdgeBreakPosition} bp
 * @return {adapt.vtree.NodeContext}
 */
adapt.layout.Column.prototype.findEdgeBreakPosition = function(bp) {
	this.computedBlockSize = bp.computedBlockSize;
	return bp.position;
};

/**
 * Finalize a line break.
 * @param {adapt.vtree.NodeContext} nodeContext
 * @param {boolean} forceRemoveSelf
 * @param {boolean} endOfRegion
 * @return {!adapt.task.Result.<boolean>} holing true
 */
adapt.layout.Column.prototype.finishBreak = function(nodeContext, forceRemoveSelf, endOfRegion) {
	var removeSelf = forceRemoveSelf || (nodeContext.viewNode != null && nodeContext.viewNode.nodeType == 1 && !nodeContext.after);
    this.clearOverflownViewNodes(nodeContext, removeSelf);
    if (endOfRegion)
    	this.fixJustificationIfNeeded(nodeContext, true);
    return this.clearFootnotes(nodeContext.boxOffset);	
};

/**
 * @param {adapt.vtree.NodeContext} overflownNodeContext
 * @param {adapt.vtree.NodeContext} initialNodeContext
 * @return {adapt.task.Result.<adapt.vtree.NodeContext>}
 */
adapt.layout.Column.prototype.findAcceptableBreak = function(overflownNodeContext, initialNodeContext) {
	/** @type {!adapt.task.Frame.<adapt.vtree.NodeContext>} */ var frame =
		adapt.task.newFrame("findAcceptableBreak");
	var self = this;
	var nodeContext = null;
	var penalty = 0;
	var nextPenalty = 0;
	do {
		penalty = nextPenalty;
		nextPenalty = Number.MAX_VALUE;
		for (var i = this.breakPositions.length - 1; i >= 0 && !nodeContext; --i) {
			nodeContext = this.breakPositions[i].findAcceptableBreak(this, penalty);
			var minPenalty = this.breakPositions[i].getMinBreakPenalty();
			if (minPenalty > penalty) {
				nextPenalty = Math.min(nextPenalty, minPenalty);
			}
		}
	} while(nextPenalty > penalty && !nodeContext)
	var forceRemoveSelf = false;
	if (!nodeContext) {
		vivliostyle.logging.logger.warn("Could not find any page breaks?!!");
		// Last resort
		if (this.forceNonfitting) {
			self.skipTailEdges(overflownNodeContext).then(function(nodeContext) {
				if (nodeContext) {
					nodeContext = nodeContext.modify();
					nodeContext.overflow = false;
					self.finishBreak(nodeContext, forceRemoveSelf, true).then(function() {
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
		}
	}
	this.finishBreak(nodeContext, forceRemoveSelf, true).then(function() {
	    frame.finish(nodeContext);
	});
	return frame.result();
};

/**
 * Determines if a page break is acceptable at this position
 * @param {adapt.vtree.NodeContext} flowPosition
 * @return {boolean}
 */
adapt.layout.Column.prototype.isBreakable = function(flowPosition) {
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
adapt.layout.Column.prototype.zeroIndent = function(val) {
	var s = val.toString();
	return s == "" || s == "auto" || !!s.match(/^0+(.0*)?[^0-9]/);
};

/**
 * Save a possible page break position on a CSS block edge. Check if it overflows.
 * @param {adapt.vtree.NodeContext} nodeContext
 * @param {Array.<adapt.vtree.NodeContext>} trailingEdgeContexts
 * @param {boolean} saveEvenOverflown
 * @param {?string} breakAtTheEdge
 * @return {boolean} true if overflows
 */
adapt.layout.Column.prototype.saveEdgeAndCheckForOverflow = function(nodeContext,
		trailingEdgeContexts, saveEvenOverflown, breakAtTheEdge) {
	if (!nodeContext) {
		return false;
	}
    var edge = adapt.layout.calculateEdge(nodeContext, this.clientLayout, 0, this.vertical);
	var overflown = this.isOverflown(edge);
	if (trailingEdgeContexts) {
		edge += this.getTrailingMarginEdgeAdjustment(trailingEdgeContexts);
	}
	this.updateMaxReachedAfterEdge(edge);
	if (saveEvenOverflown || !overflown) {
		this.saveEdgeBreakPosition(nodeContext, breakAtTheEdge, overflown);
	}
    return overflown;
};

/**
 * @param {adapt.vtree.NodeContext} nodeContext
 */
adapt.layout.Column.prototype.applyClearance = function(nodeContext) {
	if (!nodeContext.viewNode.parentNode) {
		// Cannot do ceralance for nodes without parents
		return;
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
	var clearEdge;
	switch (nodeContext.clearSide) {
	case "left" :
		clearEdge = this.leftFloatEdge;
		break;
	case "right" :
		clearEdge = this.rightFloatEdge;
		break;
	default :
		clearEdge = dir * Math.max(this.rightFloatEdge*dir, this.leftFloatEdge*dir);
	}
	// edge holds the position where element border "before" edge will be without clearance.
	// clearEdge is the "after" edge of the float to clear.
	if (edge * dir >= clearEdge * dir) {
		// No need for clearance
		nodeContext.viewNode.parentNode.removeChild(spacer);
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
	}
};

/**
 * Skips positions until either the start of unbreakable block or inline content.
 * Also sets breakBefore on the result combining break-before and break-after
 * properties from all elements that meet at the edge. 
 * @param {adapt.vtree.NodeContext} nodeContext
 * @param {boolean} leadingEdge
 * @return {!adapt.task.Result.<adapt.vtree.NodeContext>}
 */
adapt.layout.Column.prototype.skipEdges = function(nodeContext, leadingEdge) {
	var self = this;
	/** @type {!adapt.task.Frame.<adapt.vtree.NodeContext>} */ var frame
		= adapt.task.newFrame("skipEdges");
	// If a forced break occurred at the end of the previous column, nodeContext.after should be false.
	var atUnforcedBreak = leadingEdge && (nodeContext && nodeContext.after);
	var breakAtTheEdge = null;
	var lastAfterNodeContext = null;
	var leadingEdgeContexts = [];
	var trailingEdgeContexts = [];
	var onStartEdges = false;

	function needForcedBreak() {
		// leadingEdge=true means that we are at the beginning of the new column and hence must avoid a break
		// (Otherwise leading to an infinite loop)
		return !leadingEdge && vivliostyle.break.isForcedBreakValue(breakAtTheEdge);
	}

	function processForcedBreak() {
		nodeContext = leadingEdgeContexts[0] || nodeContext;
		nodeContext.viewNode.parentNode.removeChild(nodeContext.viewNode);
		self.pageBreakType = breakAtTheEdge;
	}

	frame.loopWithFrame(function(loopFrame) {
		while (nodeContext) {
			// A code block to be able to use break. Break moves to the next node position.
			do {
				if (!nodeContext.viewNode) {
					// Non-displayable content, skip
					break;
				}
				if (!self.layoutConstraint.allowLayout(nodeContext)) {
					nodeContext = nodeContext.modify();
					nodeContext.overflow = true;
					loopFrame.breakLoop();
					return;
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
						} else if (self.saveEdgeAndCheckForOverflow(lastAfterNodeContext, null, true, breakAtTheEdge)) {
							nodeContext = (lastAfterNodeContext || nodeContext).modify();
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
					if (nodeContext.clearSide) {
						// clear
						self.applyClearance(nodeContext);
					}
					if (nodeContext.floatSide || nodeContext.flexContainer) {
						// float or flex container (unbreakable)
						leadingEdgeContexts.push(nodeContext.copy());
						breakAtTheEdge = vivliostyle.break.resolveEffectiveBreakValue(breakAtTheEdge, nodeContext.breakBefore);
						// check if a forced break must occur before the block.
						if (needForcedBreak()) {
							processForcedBreak();
						} else if (self.saveEdgeAndCheckForOverflow(lastAfterNodeContext, null, true, breakAtTheEdge)) {
							// overflow
					    	nodeContext = (lastAfterNodeContext || nodeContext).modify();
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
						if (self.saveEdgeAndCheckForOverflow(lastAfterNodeContext, null, true, breakAtTheEdge)) {
							// overflow
					    	nodeContext = (lastAfterNodeContext || nodeContext).modify();
					    	nodeContext.overflow = true;
							loopFrame.breakLoop();
							return;
						}
						// Margins don't collapse across non-zero borders and paddings.
						trailingEdgeContexts = [lastAfterNodeContext];
						lastAfterNodeContext = null;
					}
				} else {
					// Leading edge
					leadingEdgeContexts.push(nodeContext.copy());
					breakAtTheEdge = vivliostyle.break.resolveEffectiveBreakValue(breakAtTheEdge, nodeContext.breakBefore);
					var viewTag = nodeContext.viewNode.localName;
					if (adapt.layout.mediaTags[viewTag]) {
						// elements that have inherent content
						// check if a forced break must occur before the block.
						if (needForcedBreak()) {
							processForcedBreak();
						} else if (self.saveEdgeAndCheckForOverflow(lastAfterNodeContext, null, true, breakAtTheEdge)) {
							// overflow
					    	nodeContext = (lastAfterNodeContext || nodeContext).modify();
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
			} while(false);  // End of block of code to use break
			var nextResult = self.layoutContext.nextInTree(nodeContext, atUnforcedBreak);
			if (nextResult.isPending()) {
				nextResult.then(function(nodeContextParam) {
					nodeContext = nodeContextParam;
					loopFrame.continueLoop();
				});
				return;
			} else {
				nodeContext = nextResult.get();
			}
		}
		if (self.saveEdgeAndCheckForOverflow(lastAfterNodeContext, trailingEdgeContexts, false, breakAtTheEdge)) {
			if (lastAfterNodeContext) {
		    	nodeContext = lastAfterNodeContext.modify();
		    	nodeContext.overflow = true;
			} else {
				// TODO: what to return here??
			}
		} else if (vivliostyle.break.isForcedBreakValue(breakAtTheEdge)) {
			self.pageBreakType = breakAtTheEdge;
		}
		loopFrame.breakLoop();
	}).then(function() {
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
	frame.loopWithFrame(function(loopFrame) {
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
					if (nodeContext.floatSide || nodeContext.flexContainer) {
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
			} while(false);  // End of block of code to use break
			var nextResult = self.layoutContext.nextInTree(nodeContext);
			if (nextResult.isPending()) {
				nextResult.then(function(nodeContextParam) {
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
	}).then(function() {
		frame.finish(resultNodeContext);
	});
	return frame.result();
};

/**
 * @param {adapt.vtree.NodeContext} nodeContext
 * @return {adapt.task.Result.<adapt.vtree.NodeContext>}
 */
adapt.layout.Column.prototype.layoutFloatOrFootnote = function(nodeContext) {
	if (nodeContext.floatSide == "footnote") {
		return this.layoutFootnote(nodeContext);
	}
    return this.layoutFloat(nodeContext);
};

/**
 * Layout next portion of the source.
 * @param {adapt.vtree.NodeContext} nodeContext
 * @param {boolean} leadingEdge
 * @return {adapt.task.Result.<adapt.vtree.NodeContext>}
 */
adapt.layout.Column.prototype.layoutNext = function(nodeContext, leadingEdge) {
	var self = this;
	/** @type {!adapt.task.Frame.<adapt.vtree.NodeContext>} */ var frame
		= adapt.task.newFrame("layoutNext");
	this.skipEdges(nodeContext, leadingEdge).then(function(nodeContextParam) {
		nodeContext = /** @type {adapt.vtree.NodeContext} */ (nodeContextParam);
		if (!nodeContext || self.pageBreakType || nodeContext.overflow) {
			// finished all content, explicit page break or overflow (automatic page break)
			frame.finish(nodeContext);
	    } else if (nodeContext.floatSide) {
	    	// TODO: implement floats and footnotes properly for vertical writing
	    	self.layoutFloatOrFootnote(nodeContext).thenFinish(frame);
		} else if (self.isBreakable(nodeContext)) {
	        self.layoutBreakableBlock(nodeContext).thenFinish(frame);
	    } else {
	        self.layoutUnbreakable(nodeContext).thenFinish(frame);
	    }
	});
	return frame.result();
};

/**
 * @param {adapt.vtree.NodeContext} nodePosition
 * @param {boolean} removeSelf
 * @return {void}
 */
adapt.layout.Column.prototype.clearOverflownViewNodes = function(nodePosition, removeSelf) {
    do {
    	var parent = nodePosition.viewNode.parentNode;
    	if (!parent)
    		return;
    	this.removeFollowingSiblings(parent, nodePosition.viewNode);
        if (removeSelf) {
            parent.removeChild(nodePosition.viewNode);
            removeSelf = false;
        }
        nodePosition = nodePosition.parent;
    } while (nodePosition);
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
    		this.exclusions, 8, this.snapHeight, this.vertical);
	this.createFloats();
	this.footnoteItems = null;
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
	var bp = new adapt.layout.EdgeBreakPosition(position.copy(), breakAtEdge, overflows, this.computedBlockSize);
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
	var size = this.getBoxDir() * (afterEdge - this.beforeEdge);
	this.computedBlockSize = Math.max(size, this.computedBlockSize);
};

/**
 * Add footnotes overflown from the previous pages
 * @param {adapt.vtree.ChunkPosition} chunkPosition starting position.
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.layout.Column.prototype.layoutOverflownFootnotes = function(chunkPosition) {
    var footnotes = chunkPosition.footnotes;
	if (!footnotes) {
		return adapt.task.newResult(true);
	}
	var self = this;
	/** @type {!adapt.task.Frame.<boolean>} */ var frame = adapt.task.newFrame("layoutOverflownFootnotes");
	var i = 0;
	frame.loop(function() {
		while(i < footnotes.length) {
			var footnote = footnotes[i++];
			var result = self.layoutFootnoteInner(0, footnote, self.beforeEdge);
			if (result.isPending()) {
				return result;
			}
		}
		return adapt.task.newResult(false);
	}).then(function() {
		frame.finish(true);
	});
	return frame.result();
};

/**
 * @param {adapt.vtree.ChunkPosition} chunkPosition starting position.
 * @param {boolean} leadingEdge
 * @return {adapt.task.Result.<adapt.vtree.ChunkPosition>} holding end position.
 */
adapt.layout.Column.prototype.layout = function(chunkPosition, leadingEdge) {
	this.chunkPositions.push(chunkPosition);  // So we can re-layout this column later
	if (this.overflown) {
		return adapt.task.newResult(chunkPosition);
	}
	var self = this;
	/** @type {!adapt.task.Frame.<adapt.vtree.ChunkPosition>} */ var frame = adapt.task.newFrame("layout");
	self.layoutOverflownFootnotes(chunkPosition).then(function() {
	    // ------ start the column -----------
	    self.openAllViews(chunkPosition.primary).then(function(nodeContext) {
	    	var initialNodeContext = nodeContext;
		    // ------ init backtracking list -----
			self.breakPositions = [];
		    // ------- fill the column -------------
			frame.loopWithFrame(function(loopFrame) {
			    while (nodeContext) {
			        // fill a single block
			    	var pending = true;
			        self.layoutNext(nodeContext, leadingEdge).then(function(nodeContextParam) {
			        	leadingEdge = false;
						nodeContext = nodeContextParam;

						if (self.hasNewlyAddedPageFloats()) {
							loopFrame.breakLoop();
							return;
						}

						if (self.pageBreakType) {
							// explicit page break
				            loopFrame.breakLoop(); // Loop end							
						} else if (nodeContext && nodeContext.overflow) {
				        	// overflow (implicit page break): back up and find a page break
				        	self.findAcceptableBreak(nodeContext, initialNodeContext).then(function(nodeContextParam) {
				        		nodeContext = nodeContextParam;
				        		loopFrame.breakLoop(); // Loop end
				        	});
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
			}).then(function() {
				var footnoteArea = self.footnoteArea;
			    if (footnoteArea) {
			    	self.element.appendChild(footnoteArea.element);
			    	if (self.vertical) {
				    	self.computedBlockSize = this.beforeEdge - this.afterEdge;
			    	} else {
				    	self.computedBlockSize = footnoteArea.top + footnoteArea.getInsetTop() +
	    					footnoteArea.computedBlockSize + footnoteArea.getInsetBottom();	
			    	}
			    }
			    // TODO: look at footnotes and floats as well
			    if (!nodeContext) {
			    	frame.finish(null);
			    } else if (self.hasNewlyAddedPageFloats()) {
					frame.finish(null);
				} else {
				    self.overflown = true;
				    var result = new adapt.vtree.ChunkPosition(nodeContext.toNodePosition());
				    // Transfer overflown footnotes
				    if (self.footnoteItems) {
				    	var overflowFootnotes = [];
				    	for (var i = 0; i < self.footnoteItems.length; i++) {
				    		var overflowPosition = self.footnoteItems[i].overflowPosition;
				    		if (overflowPosition) {
				    			overflowFootnotes.push(overflowPosition);
				    		}
				    	}
				    	result.footnotes = overflowFootnotes.length ? overflowFootnotes : null;
				    }
				    frame.finish(result);
			    }
			});
	    });
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
	frame.loopWithFrame(function(loopFrame) {
		if (i < chunkPositions.length) {
			var chunkPosition = chunkPositions[i++];
			self.layout(chunkPosition, leadingEdge).then(function(pos) {
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
	}).then (function() {
		frame.finish(res);
	});
	return frame.result();
};

