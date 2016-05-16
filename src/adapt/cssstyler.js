/**
 * Copyright 2013 Google, Inc.
 * Copyright 2015 Vivliostyle Inc.
 * @fileoverview Apply CSS cascade to a document incrementally and cache the result.
 */
goog.provide('adapt.cssstyler');

goog.require('goog.asserts');
goog.require('adapt.vtree');
goog.require('adapt.csscasc');
goog.require('adapt.xmldoc');
goog.require('adapt.cssprop');

/**
 * @constructor
 */
adapt.cssstyler.SlipRange = function(endStuckFixed, endFixed, endSlipped) {
	/** @type {number} */ this.endStuckFixed = endStuckFixed;
	/** @type {number} */ this.endFixed = endFixed;
	/** @type {number} */ this.endSlipped = endSlipped;	
};

/**
 * Maps all ints in a range ("fixed") to ints with slippage ("slipped")
 * @constructor
 */
adapt.cssstyler.SlipMap = function() {
    /** @const */ this.map = /** @type {Array.<adapt.cssstyler.SlipRange>} */ ([]);
};

/**
 * @return {number}
 */
adapt.cssstyler.SlipMap.prototype.getMaxFixed = function() {
    if (this.map.length == 0)
        return 0;
    var range = this.map[this.map.length - 1];
    return range.endFixed;
};

/**
 * @return {number}
 */
adapt.cssstyler.SlipMap.prototype.getMaxSlipped = function() {
    if (this.map.length == 0)
        return 0;
    var range = this.map[this.map.length - 1];
    return range.endSlipped;
};

/**
 * @param {number} endFixed
 * @return {void}
 */
adapt.cssstyler.SlipMap.prototype.addStuckRange = function(endFixed) {
    if (this.map.length == 0) {
        this.map.push(new adapt.cssstyler.SlipRange(endFixed, endFixed, endFixed));
    } else {
        var range = this.map[this.map.length - 1];
        var endSlipped = range.endSlipped + endFixed - range.endFixed;
        if (range.endFixed == range.endStuckFixed) {
            range.endFixed = endFixed;
            range.endStuckFixed = endFixed;
            range.endSlipped = endSlipped;
        } else {
            this.map.push(new adapt.cssstyler.SlipRange(endFixed, endFixed, endSlipped));
        }
    }
};

/**
 * @param {number} endFixed
 * @return {void}
 */
adapt.cssstyler.SlipMap.prototype.addSlippedRange = function(endFixed) {
    if (this.map.length == 0) {
        this.map.push(new adapt.cssstyler.SlipRange(endFixed, 0, 0));
    } else {
        this.map[this.map.length - 1].endFixed = endFixed;
    }
};

/**
 * @param {number} fixed
 * @return {number}
 */
adapt.cssstyler.SlipMap.prototype.slippedByFixed = function(fixed) {
	var self = this;
    var index = adapt.base.binarySearch(this.map.length, function(index) {
        return fixed <= self.map[index].endFixed;
    });
    var range = this.map[index];
    return range.endSlipped - Math.max(0, range.endStuckFixed - fixed);
};

/**
 * Smallest fixed for a given slipped.
 * @param {number} slipped
 * @return {number}
 */
adapt.cssstyler.SlipMap.prototype.fixedBySlipped = function(slipped) {
	var self = this;
    var index = adapt.base.binarySearch(this.map.length, function(index) {
        return slipped <= self.map[index].endSlipped;
    });
    var range = this.map[index];
    return range.endStuckFixed - (range.endSlipped - slipped);
};

/**
 * @interface
 */
adapt.cssstyler.FlowListener = function() {};

/**
 * @param {adapt.vtree.FlowChunk} flowChunk
 * @param {adapt.vtree.Flow} flow
 * @return void
 */
adapt.cssstyler.FlowListener.prototype.encounteredFlowChunk = function(flowChunk, flow) {};

/**
 * @interface
 */
adapt.cssstyler.AbstractStyler = function() {};

/**
 * @param {Element} element
 * @param {boolean} deep
 * @return {adapt.csscasc.ElementStyle}
 */
adapt.cssstyler.AbstractStyler.prototype.getStyle = function(element, deep) {};


/**
 * @param {adapt.xmldoc.XMLDocHolder} xmldoc
 * @param {adapt.csscasc.Cascade} cascade
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.expr.Context} context
 * @param {Object.<string,boolean>} primaryFlows
 * @param {adapt.cssvalid.ValidatorSet} validatorSet
 * @param {adapt.csscasc.PageCounterResolver} pageCounterResolver
 * @constructor
 * @implements {adapt.cssstyler.AbstractStyler}
 */
adapt.cssstyler.Styler = function(xmldoc, cascade, scope, context, primaryFlows, validatorSet, pageCounterResolver) {
	/** @const */ this.xmldoc = xmldoc;
	/** @const */ this.root = xmldoc.root;
	/** @const */ this.cascadeHolder = cascade;
	/** @const */ this.scope = scope;
	/** @const */ this.context = context;
	/** @const */ this.validatorSet = validatorSet;
    /** @type {Node} */ this.last = this.root;
    /** @const */ this.rootStyle = /** @type {!adapt.csscasc.ElementStyle} */ ({});
    /** @type {Object.<string,adapt.csscasc.ElementStyle>} */ this.styleMap = {};
    /** @const */ this.flows = /** @type {Object<string, !adapt.vtree.Flow>} */ ({});
    /** @const */ this.flowChunks = /** @type {Array.<adapt.vtree.FlowChunk>} */ ([]);
    /** @type {!Array.<!adapt.vtree.FlowChunk>} */ this.flowChunkStack =  [];
    /** @type {adapt.cssstyler.FlowListener} */ this.flowListener = null;
    /** @type {?string} */ this.flowToReach = null;
    /** @type {boolean} */ this.atFlowStart = false;
    /** @const */ this.cascade = cascade.createInstance(context, pageCounterResolver, xmldoc.lang);
    /** @const */ this.offsetMap = new adapt.cssstyler.SlipMap();
    /** @type {boolean} */ this.primary = true;
    /** @const */ this.primaryStack = /** @type {Array.<boolean>} */ ([]);
    /** @const */ this.primaryFlows = primaryFlows;
    /** @type {boolean} */ this.rootBackgroundAssigned = false;
    /** @type {boolean} */ this.rootLayoutAssigned = false;
    var rootOffset = xmldoc.getElementOffset(this.root);
    /** @type {number} */ this.lastOffset = rootOffset;
    /** @type {!Array<?adapt.css.Val>} */ this.displayStack = [];
    /** @const */ this.breakBeforeValues = /** @type {!Object<number, ?string>} */ ({});
    
    this.offsetMap.addStuckRange(rootOffset);
    var style = this.getAttrStyle(this.root);
    this.cascade.pushElement(this.root, style);
    this.postprocessTopStyle(style, false);
    /** @type {boolean} */ this.bodyReached = true;
    switch (this.root.namespaceURI) {
    case adapt.base.NS.XHTML:
    case adapt.base.NS.FB2:
    	this.bodyReached = false;
    	break;
    }
    this.primaryStack.push(true);
    this.styleMap = {};
    this.styleMap["e" + rootOffset] = style;
    this.lastOffset++;
    this.replayFlowElementsFromOffset(-1);
};

/**
 * @param {adapt.csscasc.ElementStyle} style
 * @param {adapt.cssvalid.ValueMap} map
 * @param {string} name
 * @return {boolean}
 **/
adapt.cssstyler.Styler.prototype.hasProp = function(style, map, name) {
	var cascVal = style[name];
	return cascVal && cascVal.evaluate(this.context) !== map[name];
};

/**
 * @param {adapt.csscasc.ElementStyle} srcStyle
 * @param {adapt.cssvalid.ValueMap} map
 * @return {void}
 **/
adapt.cssstyler.Styler.prototype.transferPropsToRoot = function(srcStyle, map) {
	for (var pname in map) {
		var cascval = srcStyle[pname];
		if (cascval) {
			this.rootStyle[pname] = cascval;
			delete srcStyle[pname];
		} else {
			var val = map[pname];
			if (val) {
				this.rootStyle[pname] = new adapt.csscasc.CascadeValue(val, adapt.cssparse.SPECIFICITY_AUTHOR);
			}
		}
	}
};

/**
 * @const
 */
adapt.cssstyler.columnProps = ["column-count", "column-width"];

/**
 * Transfer properties that should be applied on the container (partition) level
 * to this.rootStyle.
 * @param {adapt.csscasc.ElementStyle} elemStyle (source) element style
 * @param {boolean} isBody
 * @return {void}
 */
adapt.cssstyler.Styler.prototype.postprocessTopStyle = function(elemStyle, isBody) {
    if (!isBody) {
        ["writing-mode", "direction"].forEach(function (propName) {
            if (elemStyle[propName]) {
                // Copy it over, but keep it at the root element as well.
                this.rootStyle[propName] = elemStyle[propName];
            }
        }, this);
    }
	if (!this.rootBackgroundAssigned) {
        var backgroundColor = /** @type {adapt.css.Val} */
            (this.hasProp(elemStyle, this.validatorSet.backgroundProps, "background-color") ?
                elemStyle["background-color"].evaluate(this.context) : null);
        var backgroundImage = /** @type {adapt.css.Val} */
            (this.hasProp(elemStyle, this.validatorSet.backgroundProps, "background-image") ?
                elemStyle["background-image"].evaluate(this.context) : null);
		if ((backgroundColor && backgroundColor !== adapt.css.ident.inherit) ||
            (backgroundImage && backgroundImage !== adapt.css.ident.inherit)) {
			this.transferPropsToRoot(elemStyle, this.validatorSet.backgroundProps);
			this.rootBackgroundAssigned = true;
		}
	}
	if (!this.rootLayoutAssigned) {
		for (var i = 0; i < adapt.cssstyler.columnProps.length; i++) {
			if (this.hasProp(elemStyle, this.validatorSet.layoutProps, adapt.cssstyler.columnProps[i])) {
				this.transferPropsToRoot(elemStyle, this.validatorSet.layoutProps);
				this.rootLayoutAssigned = true;
				break;
			}
		}
	}
    if (!isBody) {
        var fontSize = elemStyle["font-size"];
        if (fontSize) {
            var val = fontSize.evaluate(this.context);
            var px = val.num;
            switch (val.unit) {
                case "em":
                case "rem":
                    px *= this.context.initialFontSize;
                    break;
                case "ex":
                case "rex":
                    px *= this.context.initialFontSize * adapt.expr.defaultUnitSizes["ex"] / adapt.expr.defaultUnitSizes["em"];
                    break;
                case "%":
                    px *= this.context.initialFontSize / 100;
                    break;
                default:
                    var unitSize = adapt.expr.defaultUnitSizes[val.unit];
                    if (unitSize) {
                        px *= unitSize;
                    }
            }
            this.context.rootFontSize = px;
        }
    }
};

/**
 * @return {!adapt.csscasc.ElementStyle}
 */
adapt.cssstyler.Styler.prototype.getTopContainerStyle = function() {
    var offset = 0;
    while (!this.bodyReached) {
        offset += 5000;
        if (this.styleUntil(offset, 0) == Number.POSITIVE_INFINITY)
            break;
    }
    return this.rootStyle;
};
/**
 * @param {Element} elem
 * @return {adapt.csscasc.ElementStyle}
 */
adapt.cssstyler.Styler.prototype.getAttrStyle = function(elem) {
    // skip cases in which elements for XML other than HTML or SVG
    // have 'style' attribute not for CSS declaration
    if (elem.style instanceof CSSStyleDeclaration) {
        var styleAttrValue = elem.getAttribute("style");
        if (styleAttrValue) {
            return adapt.csscasc.parseStyleAttribute(this.scope, this.validatorSet,
                this.xmldoc.url, styleAttrValue);
        }
    }
	return /** @type {adapt.csscasc.ElementStyle} */ ({});	
};

/**
 * @return {number} currently reached offset
 */
adapt.cssstyler.Styler.prototype.getReachedOffset = function() {
	return this.lastOffset;
};

/**
 * Replay flow elements that were encountered since the given offset
 * @param {number} offset
 * @return {void}
 */
adapt.cssstyler.Styler.prototype.replayFlowElementsFromOffset = function(offset) {
    if (offset >= this.lastOffset)
    	return;
    var context = this.context;
    var rootOffset = this.xmldoc.getElementOffset(this.root);
	if (offset < rootOffset) {
		var rootStyle = this.getStyle(this.root, false);
	    var flowName = adapt.csscasc.getProp(rootStyle, "flow-into");
	    var flowNameStr = flowName ? flowName.evaluate(context, "flow-into").toString() : "body";
        var display = adapt.csscasc.getProp(rootStyle, "display");
        this.displayStack = [display && display.evaluate(context, "display")];
        var newFlowChunk = this.encounteredFlowElement(flowNameStr, rootStyle, this.root, rootOffset);
        if (this.flowChunkStack.length === 0) {
            this.flowChunkStack.push(newFlowChunk);
        }
	}
	var node = this.xmldoc.getNodeByOffset(offset);
	var nodeOffset = this.xmldoc.getNodeOffset(node, 0, false);
    if (nodeOffset >= this.lastOffset)
    	return;
    while (true) {
        if (node.nodeType != 1) {
            nodeOffset += node.textContent.length;
        } else {
            var elem = /** @type {!Element} */ (node);
        	if (goog.DEBUG) {
        		if (nodeOffset != this.xmldoc.getElementOffset(elem)) {
        			throw new Error("Inconsistent offset");
        		}
        	}
            var style = this.getStyle(elem, false);
            var flowName = style["flow-into"];
            if (flowName) {
                var flowNameStr = flowName.evaluate(context,"flow-into").toString();
                this.encounteredFlowElement(flowNameStr, style, elem, nodeOffset);
            }
            nodeOffset++;
        }
        if (nodeOffset >= this.lastOffset)
        	break;
        var next = node.firstChild;
        if (next == null) {
            while (true) {
                next = node.nextSibling;
                if (next)
                    break;
                node = node.parentNode;
                if (node === this.root) {
                    return;
                }
            }
        }
        node = next;
    }
};

/**
 * @param {adapt.cssstyler.FlowListener} flowListener
 * @return {void}
 */
adapt.cssstyler.Styler.prototype.resetFlowChunkStream = function(flowListener) {
    this.flowListener = flowListener;
    for (var i = 0; i < this.flowChunks.length; i++) {
        this.flowListener.encounteredFlowChunk(this.flowChunks[i], this.flows[this.flowChunks[i].flowName]);
    }
};

/**
 * @param {string} flowName
 */
adapt.cssstyler.Styler.prototype.styleUntilFlowIsReached = function(flowName) {
    this.flowToReach = flowName;
    var offset = 0;
    while (true) {
        if (this.flowToReach == null)
            break;
        offset += 5000;
        if (this.styleUntil(offset, 0) == Number.POSITIVE_INFINITY)
            break;
    }
};

/**
 * @returns {boolean}
 */
adapt.cssstyler.Styler.prototype.isCurrentNodeDisplayed = function() {
    return this.displayStack.every(function(display) {
        return display !== adapt.css.ident.none;
    });
};

/**
 * Returns the effective value of 'break-before/after'.
 * Returns null if 'break-before/after' is not specified or the generated box is not a block-level box.
 * @param {!adapt.csscasc.ElementStyle} style
 * @param {string} edge 'before' or 'after
 * @param {boolean} isRoot
 * @returns {?string}
 */
adapt.cssstyler.Styler.prototype.getBreakValue = function(style, edge, isRoot) {
    var breakValue = null;
    var displayCV = style["display"];
    var display = displayCV ? displayCV.evaluate(this.context, "display") : adapt.css.ident.inline;
    var positionCV = style["position"];
    var position = positionCV && positionCV.evaluate(this.context, "position");
    var floatCV = style["float"];
    var float = floatCV && floatCV.evaluate(this.context, "float");
    var isBlock = vivliostyle.display.isBlock(display, position, float, isRoot);
    if (isBlock) {
        var breakBeforeCV = style["break-" + edge];
        if (breakBeforeCV) {
            breakValue = breakBeforeCV.evaluate(this.context, "break-" + edge).toString();
        }
    }
    return breakValue;
};

/**
 * Returns the effective value of 'break-before/after' for a specified pseudoelement.
 * Returns null if 'break-before/after' is not specified or the generated box of the pseudoelement is not a block-level box.
 * When a callback function is passed, it is called only if the pseudoelement generates a box (i.e. the 'display' value is not none and the 'content' property has a value other than 'none' or 'normal').
 * @param {!adapt.csscasc.ElementStyle} style
 * @param {string} pseudoName
 * @param {string} edge 'before' or 'after'
 * @param {function(this:adapt.cssstyler.Styler)=} callback
 * @returns {?string}
 */
adapt.cssstyler.Styler.prototype.processPseudoBreakValue = function(style, pseudoName, edge, callback) {
    var breakValue = null;
    if (this.isCurrentNodeDisplayed()) {
        var pseudoMap = style["_pseudos"];
        if (pseudoMap) {
            var pseudoStyle = pseudoMap[pseudoName];
            if (pseudoStyle) {
                var displayCV = pseudoStyle["display"];
                var display = displayCV && displayCV.evaluate(this.context, "display");
                if (display !== adapt.css.ident.none) {
                    var contentCV = pseudoStyle["content"];
                    if (contentCV) {
                        var content = contentCV.evaluate(this.context, "content");
                        if (adapt.vtree.nonTrivialContent(content)) {
                            breakValue = this.getBreakValue(pseudoStyle, edge, false);
                            if (callback) {
                                callback.call(this);
                            }
                        }
                    }
                }
            }
        }
    }
    return breakValue;
};

/**
 * @private
 * @param {string} flowName
 * @param {adapt.csscasc.ElementStyle} style
 * @param {!Element} elem
 * @param {number} startOffset
 * @return {!adapt.vtree.FlowChunk}
 */
adapt.cssstyler.Styler.prototype.encounteredFlowElement = function(flowName, style, elem, startOffset) {
    var priority = 0;
    var linger = Number.POSITIVE_INFINITY;
    var exclusive = false;
    var repeated = false;
    var last = false;
    this.atFlowStart = true;
    var optionsCV = style["flow-options"];
    if (optionsCV) {
        var options = adapt.cssprop.toSet(optionsCV.evaluate(this.context, "flow-options"));
        exclusive = !!options["exclusive"];
        repeated = !!options["static"];
        last = !!options["last"];
    }
    var lingerCV = style["flow-linger"];
    if (lingerCV) {
        linger = adapt.cssprop.toInt(lingerCV.evaluate(this.context, "flow-linger"),
        		Number.POSITIVE_INFINITY);
    }
    var priorityCV = style["flow-priority"];
    if (priorityCV) {
        priority = adapt.cssprop.toInt(priorityCV.evaluate(this.context, "flow-priority"), 0);
    }
    var breakBefore = this.breakBeforeValues[startOffset] || null;
    var flow = this.flows[flowName];
    if (!flow) {
        var parentFlowChunk = this.flowChunkStack[this.flowChunkStack.length - 1];
        var parentFlowName = parentFlowChunk ? parentFlowChunk.flowName : null;
        flow = this.flows[flowName] = new adapt.vtree.Flow(flowName, parentFlowName);
    }
    var flowChunk = new adapt.vtree.FlowChunk(flowName, elem,
    		startOffset, priority, linger, exclusive, repeated, last, breakBefore);
    this.flowChunks.push(flowChunk);
    if (this.flowToReach == flowName)
        this.flowToReach = null;
    if (this.flowListener)
        this.flowListener.encounteredFlowChunk(flowChunk, flow);
    return flowChunk;
};

/**
 * @param {?string} breakValue
 */
adapt.cssstyler.Styler.prototype.registerForcedBreakOffset = function(breakValue) {
    if (vivliostyle.break.isForcedBreakValue(breakValue)) {
        var currentFlowChunk = this.flowChunkStack[this.flowChunkStack.length - 1];
        var forcedBreakOffsets = this.flows[currentFlowChunk.flowName].forcedBreakOffsets;
        if (forcedBreakOffsets.length === 0 ||
            forcedBreakOffsets[forcedBreakOffsets.length - 1] < this.lastOffset) {
            forcedBreakOffsets.push(this.lastOffset);
        }
    }
};

/**
 * @param {number} startOffset current position in the document
 * @param {number} lookup lookup window size for the next page
 * @return {number} lookup offset in the document for the next page
 */
adapt.cssstyler.Styler.prototype.styleUntil = function(startOffset, lookup) {
    var targetSlippedOffset = -1;
    var slippedOffset;
    if (startOffset <= this.lastOffset) {
        slippedOffset = this.offsetMap.slippedByFixed(startOffset);
        targetSlippedOffset = slippedOffset + lookup;
        if (targetSlippedOffset < this.offsetMap.getMaxSlipped()) {
            // got to the desired point
            return this.offsetMap.fixedBySlipped(targetSlippedOffset);
        }
    }
    if (this.last == null) {
        return Number.POSITIVE_INFINITY;
    }
    var context = this.context;
    while (true) {
        var next = this.last.firstChild;
        if (next == null) {
            while (true) {
                if (this.last.nodeType == 1) {
                    this.cascade.popElement(/** @type {Element} */ (this.last));
                    this.primary = this.primaryStack.pop();
                    var afterPseudoStyle = this.getStyle(/** @type {Element} */ (this.last), false);
                    goog.asserts.assert(afterPseudoStyle);
                    var afterPseudoBreakBefore = this.processPseudoBreakValue(afterPseudoStyle, "after", "before");
                    this.registerForcedBreakOffset(afterPseudoBreakBefore);
                    if (this.atFlowStart && afterPseudoBreakBefore) {
                        var currentFlowChunk = this.flowChunkStack[this.flowChunkStack.length - 1];
                        this.breakBeforeValues[currentFlowChunk.startOffset] = currentFlowChunk.breakBefore =
                            vivliostyle.break.resolveEffectiveBreakValue(currentFlowChunk.breakBefore, afterPseudoBreakBefore);
                    }
                    var breakAfter = this.processPseudoBreakValue(afterPseudoStyle, "after", "after");
                    breakAfter = vivliostyle.break.resolveEffectiveBreakValue(breakAfter, this.getBreakValue(afterPseudoStyle, "after", this.last === this.root));
                    this.registerForcedBreakOffset(breakAfter);
                    this.flowChunkStack.pop();
                    if (this.displayStack.pop() !== adapt.css.ident.none) {
                        this.atFlowStart = false;
                    }
                }
                next = this.last.nextSibling;
                if (next)
                    break;
                this.last = this.last.parentNode;
                if (this.last === this.root) {
                    this.last = null;
                    if (startOffset < this.lastOffset) {
	                    if (targetSlippedOffset < 0) {
	                        slippedOffset = this.offsetMap.slippedByFixed(startOffset);
	                        targetSlippedOffset = slippedOffset + lookup;
	                    }
	                    if (targetSlippedOffset <= this.offsetMap.getMaxSlipped()) {
	                        // got to the desired point
	                        return this.offsetMap.fixedBySlipped(targetSlippedOffset);
	                    }
                    }
                    return Number.POSITIVE_INFINITY;
                }
            }
        }
        this.last = next;
        if (this.last.nodeType != 1) {
            this.lastOffset += this.last.textContent.length;
            if (this.atFlowStart && this.isCurrentNodeDisplayed()) {
                var whitespaceCV = this.getStyle(this.last.parentElement, false)["white-space"];
                var whitespaceValue = whitespaceCV ? whitespaceCV.evaluate(context, "white-space").toString() : "normal";
                var whitespace = adapt.vtree.whitespaceFromPropertyValue(whitespaceValue);
                goog.asserts.assert(whitespace !== null);
                if (!adapt.vtree.canIgnore(this.last, whitespace)) {
                    this.atFlowStart = false;
                }
            }
            if (this.primary)
                this.offsetMap.addStuckRange(this.lastOffset);
            else
                this.offsetMap.addSlippedRange(this.lastOffset);
        } else {
            var elem = /** @type {!Element} */ (this.last);
            var style = this.getAttrStyle(elem);
            this.primaryStack.push(this.primary);
            this.cascade.pushElement(elem, style);
            if (!this.bodyReached && elem.localName == "body" && elem.parentNode == this.root) { 
            	this.postprocessTopStyle(style, true);
            	this.bodyReached = true;
            }
            var display = style["display"] && style["display"].evaluate(context, "display");
            this.displayStack.push(display);
            var flowName = style["flow-into"];
            if (flowName) {
                var flowNameStr = flowName.evaluate(context,"flow-into").toString();
                var newFlowChunk = this.encounteredFlowElement(flowNameStr, style, elem, this.lastOffset);
                this.primary = !!this.primaryFlows[flowNameStr];
                this.flowChunkStack.push(newFlowChunk);
            } else {
                this.flowChunkStack.push(this.flowChunkStack[this.flowChunkStack.length - 1]);
            }
            var wasAtFlowStart = this.atFlowStart;
            var beforePseudoBreakBefore = this.processPseudoBreakValue(style, "before", "before", function() {
                // if ::before pseudoelement generates a box, we are no longer at the start of the flow
                this.atFlowStart = false;
            });
            var breakBefore = vivliostyle.break.resolveEffectiveBreakValue(
                this.getBreakValue(style, "before", elem === this.root), beforePseudoBreakBefore);
            this.registerForcedBreakOffset(breakBefore);
            if (wasAtFlowStart && breakBefore) {
                var currentFlowChunk = this.flowChunkStack[this.flowChunkStack.length - 1];
                this.breakBeforeValues[currentFlowChunk.startOffset] = currentFlowChunk.breakBefore =
                    vivliostyle.break.resolveEffectiveBreakValue(currentFlowChunk.breakBefore, breakBefore);
            }
            var beforePseudoBreakAfter = this.processPseudoBreakValue(style, "before", "after");
            this.registerForcedBreakOffset(beforePseudoBreakAfter);

            if (this.primary) {
                if (display === adapt.css.ident.none) {
                    this.primary = false;
                }
            }
            if (goog.DEBUG) {
	            var offset = this.xmldoc.getElementOffset(/** @type {Element} */ (this.last));
	            if (offset != this.lastOffset)
	                throw new Error("Inconsistent offset");
            }
            this.styleMap["e"+this.lastOffset] = style;
            this.lastOffset++;
            if (this.primary)
                this.offsetMap.addStuckRange(this.lastOffset);
            else
                this.offsetMap.addSlippedRange(this.lastOffset);
            if (startOffset < this.lastOffset) {
                if (targetSlippedOffset < 0) {
                    slippedOffset = this.offsetMap.slippedByFixed(startOffset);
                    targetSlippedOffset = slippedOffset + lookup;
                }
                if (targetSlippedOffset <= this.offsetMap.getMaxSlipped()) {
                    // got to the desired point
                    return this.offsetMap.fixedBySlipped(targetSlippedOffset);
                }
            }
        }
    }
};

/**
 * @override
 */
adapt.cssstyler.Styler.prototype.getStyle = function(element, deep) {
    var offset = this.xmldoc.getElementOffset(element);
    var key = "e" + offset;
    if (deep) {
    	offset = this.xmldoc.getNodeOffset(element, 0, true);
    }
    if (this.lastOffset <= offset) {
        this.styleUntil(offset, 0);
    }
    return this.styleMap[key];
};
