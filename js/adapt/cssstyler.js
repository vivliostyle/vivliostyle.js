/**
 * Copyright 2013 Google, Inc.
 * @fileoverview Apply CSS cascade to a document incrementally and cache the result.
 */
goog.provide('adapt.cssstyler');

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
 * @return void
 */
adapt.cssstyler.FlowListener.prototype.encounteredFlowChunk = function(flowChunk) {};

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
 * @param {adapt.xmldoc.XMLDocHolder} xmldoc.
 * @param {adapt.csscasc.Cascade} cascade
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.expr.Context} context
 * @param {Object.<string,boolean>} primaryFlows
 * @param {adapt.cssvalid.ValidatorSet} validatorSet
 * @constructor
 * @implements {adapt.cssstyler.AbstractStyler}
 */
adapt.cssstyler.Styler = function(xmldoc, cascade, scope, context, primaryFlows, validatorSet) {
	/** @const */ this.xmldoc = xmldoc;
	/** @const */ this.root = xmldoc.root;
	/** @const */ this.cascadeHolder = cascade;
	/** @const */ this.scope = scope;
	/** @const */ this.context = context;
	/** @const */ this.validatorSet = validatorSet;
    /** @type {Node} */ this.last = this.root;
    /** @const */ this.rootStyle = /** @type {adapt.csscasc.ElementStyle} */ ({});
    /** @type {Object.<string,adapt.csscasc.ElementStyle>} */ this.styleMap = {};
    /** @const */ this.flowChunks = /** @type {Array.<adapt.vtree.FlowChunk>} */ ([]);
    /** @type {adapt.cssstyler.FlowListener} */ this.flowListener = null;
    /** @type {?string} */ this.flowToReach = null;
    /** @const */ this.cascade = cascade.createInstance(context, xmldoc.lang);
    /** @const */ this.offsetMap = new adapt.cssstyler.SlipMap();
    /** @type {boolean} */ this.primary = true;
    /** @const */ this.primaryStack = /** @type {Array.<boolean>} */ ([]);
    /** @const */ this.primaryFlows = primaryFlows;
    /** @type {boolean} */ this.rootBackgroundAssigned = false;
    /** @type {boolean} */ this.rootLayoutAssigned = false;
    var rootOffset = xmldoc.getElementOffset(this.root);
    /** @type {number} */ this.lastOffset = rootOffset;
    
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
 * Transfer properties that should be applied on the container (partition) level
 * to this.rootStyle.
 * @param {adapt.csscasc.ElementStyle} elemStyle (source) element style
 * @param {boolean} isBody
 * @return {void}
 */
adapt.cssstyler.Styler.prototype.postprocessTopStyle = function(elemStyle, isBody) {
	if (!isBody && elemStyle["writing-mode"]) {
		// Copy it over, but keep it at the root element as well.
		this.rootStyle["writing-mode"] = elemStyle["writing-mode"];
	}
	if (!this.rootBackgroundAssigned) {
		if (this.hasProp(elemStyle, this.validatorSet.backgroundProps, "background-color")
			|| this.hasProp(elemStyle, this.validatorSet.backgroundProps, "background-image")) {
			this.transferPropsToRoot(elemStyle, this.validatorSet.backgroundProps);
			this.rootBackgroundAssigned = true;
		}
	}
	if (!this.rootLayoutAssigned) {
		for (var pname in this.validatorSet.layoutProps) {
			if (this.hasProp(elemStyle, this.validatorSet.layoutProps, pname)) {
				this.transferPropsToRoot(elemStyle, this.validatorSet.layoutProps);
				this.rootLayoutAssigned = true;
				break;
			}
		}
	}
};

/**
 * @return {adapt.csscasc.ElementStyle}
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
    var styleAttrValue = elem.getAttribute("style");
    if (styleAttrValue) {
    	return adapt.csscasc.parseStyleAttribute(this.scope, this.validatorSet,
    			this.xmldoc.url, styleAttrValue);
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
	    this.encounteredFlowElement(flowNameStr, rootStyle, this.root, rootOffset);		
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
        this.flowListener.encounteredFlowChunk(this.flowChunks[i]);
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
 * @private
 * @param {string} flowName
 * @param {adapt.csscasc.ElementStyle} style
 * @param {!Element} elem
 * @param {number} startOffset
 * @return {void}
 */
adapt.cssstyler.Styler.prototype.encounteredFlowElement = function(flowName, style, elem, startOffset) {
    var priority = 0;
    var linger = Number.POSITIVE_INFINITY;
    var exclusive = false;
    var repeated = false;
    var last = false;
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
    var flowChunk = new adapt.vtree.FlowChunk(flowName, elem,
    		startOffset, priority, linger, exclusive, repeated, last);
    this.flowChunks.push(flowChunk);
    if (this.flowToReach == flowName)
        this.flowToReach = null;
    if (this.flowListener)
        this.flowListener.encounteredFlowChunk(flowChunk);
};

/**
 * @param {number} startOffset current position in the document
 * @param {number} lookup lookup window size for the next page
 * @return {number} lookup offset in the document for the next page
 */
adapt.cssstyler.Styler.prototype.styleUntil = function(startOffset, lookup) {
    var targetSlippedOffset = -1;
    var slippedOffset;
    if (this.last == null) {
        if (startOffset <= this.lastOffset) {
            slippedOffset = this.offsetMap.slippedByFixed(startOffset);
            targetSlippedOffset = slippedOffset + lookup;
            if (targetSlippedOffset < this.offsetMap.getMaxSlipped()) {
                // got to the desired point
                return this.offsetMap.fixedBySlipped(targetSlippedOffset);
            }
        }
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
                }
                next = this.last.nextSibling;
                if (next)
                    break;
                this.last = this.last.parentNode;
                if (this.last === this.root) {
                    this.last = null;
                    return Number.POSITIVE_INFINITY;
                }
            }
        }
        this.last = next;
        if (this.last.nodeType != 1) {
            this.lastOffset += this.last.textContent.length;
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
            var flowName = style["flow-into"];
            if (flowName) {
                var flowNameStr = flowName.evaluate(context,"flow-into").toString();
                this.encounteredFlowElement(flowNameStr, style, elem, this.lastOffset);
                this.primary = !!this.primaryFlows[flowNameStr];
            }
            if (this.primary) {
                var display = style["display"];
                if (display) {
                    if (display.evaluate(context, "display") === adapt.css.ident.none) {
                        this.primary = false;
                    }
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
