/**
 * Copyright 2013 Google, Inc.
 * @fileoverview Basic view tree data structures and support utilities.
 */
goog.require('vivliostyle.constants');
goog.require('adapt.base');
goog.require('adapt.geom');
goog.require('adapt.task');
goog.require('adapt.taskutil');
goog.require('adapt.xmldoc');
goog.require('adapt.css');

goog.provide('adapt.vtree');


/** @const */
adapt.vtree.delayedProps = {
	"transform": true,
	"transform-origin": true,
	"position": true  // only relative
};

/**
 * @constructor
 * @param {Element} target
 * @param {string} name
 * @param {adapt.css.Val} value
 */
adapt.vtree.DelayedItem = function(target, name, value) {
	this.target = target;
	this.name = name;
	this.value = value;
};


/**
 * "hyperlink" event
 * @typedef {{type:string, target, currentTarget, anchorElement:Element, href:string}}
 */
adapt.vtree.PageHyperlinkEvent;

/**
 * Corresponds to OPS trigger element.
 * @typedef {{observer:string, event:string, action:string, ref:string}}
 */
adapt.vtree.Trigger;

/**
 * @const
 */
adapt.vtree.actions = {
	"show": function(obj) { obj.style.visibility = "visible"; },
	"hide": function(obj) { obj.style.visibility = "hidden"; },
	"play": function(obj) { obj.currentTime = 0; obj.play(); },
	"pause": function(obj) { obj.pause(); },
	"resume": function(obj) { obj.play(); },
	"mute": function(obj) { obj.muted = true; },
	"unmute": function(obj) { obj.muted = false; }
};

/**
 * @param {Array.<Element>} refs
 * @param {string} action
 * @return {?Function}
 */
adapt.vtree.makeListener = function(refs, action) {
	var actionFn = adapt.vtree.actions[action];
	if (actionFn) {
		return function() {
			for (var k = 0; k < refs.length; k++) {
				try {
					actionFn(refs[k]);
				} catch(err) {
				}
			}
		};
	}
	return null;
};

/**
 * @param {HTMLElement} container
 * @constructor
 * @extends {adapt.base.SimpleEventTarget}
 */
adapt.vtree.Page = function(container) {
	adapt.base.SimpleEventTarget.call(this);
	/** @const */ this.container = container;
	/** @type {Array.<adapt.vtree.DelayedItem>} */ this.delayedItems = [];
	var self = this;
	/** @param {Event} e */
	this.hrefHandler = function(e) {
		var anchorElement = /** @type {Element} */ (e.currentTarget);
		var href = anchorElement.getAttribute("href") ||
			anchorElement.getAttributeNS(adapt.base.NS.XLINK, "href");
		if (href) {
			e.preventDefault();
			var evt = {
				type: "hyperlink",
				target: null,
				currentTarget: null,
				anchorElement: anchorElement,
				href: href
			};
			self.dispatchEvent(evt);
		}
	};
	/** @type {Object.<string,Array.<Element>>} */ this.elementsById = {};
	/** @type {boolean} */ this.isFirstPage = false;
	/** @type {boolean} */ this.isLastPage = false;
	/** @type {number} */ this.spineIndex = 0;
	/** @type {adapt.vtree.LayoutPosition} */ this.position = null;
	/** @type {number} */ this.offset = -1;
    /** @type {?vivliostyle.constants.PageSide} */ this.side = null;
	/** @type {Array.<adapt.taskutil.Fetcher>} */ this.fetchers = [];
};
goog.inherits(adapt.vtree.Page, adapt.base.SimpleEventTarget);

/**
 * @param {Element} element
 * @param {string} id
 */
adapt.vtree.Page.prototype.registerElementWithId = function(element, id) {
	var arr = this.elementsById[id];
	if (!arr) {
		this.elementsById[id] = [element];
	} else {
		arr.push(element);
	}
};

/**
 * @param {Array.<adapt.vtree.Trigger>} triggers
 * @return {void}
 */
adapt.vtree.Page.prototype.finish = function(triggers) {
	var list = this.delayedItems;
	for (var i = 0; i < list.length; i++) {
		var item = list[i];
		adapt.base.setCSSProperty(item.target, item.name, item.value.toString());
	}
	for (var i = 0; i < triggers.length; i++) {
		var trigger = triggers[i];
		var refs = this.elementsById[trigger.ref];
		var observers = this.elementsById[trigger.observer];
		if (refs && observers) {
			var listener = adapt.vtree.makeListener(refs, trigger.action);
			if (listener) {
				for (var k = 0; k < observers.length; k++) {
					observers[k].addEventListener(trigger.event, listener, false);
				}
			}
		}
	}
};

/**
 * Marks an element as "special". It should not be used in bbox calculations.
 * @const
 */
adapt.vtree.SPECIAL_ATTR = "data-adapt-spec";


/**
 * Handling of purely whitespace sequences between blocks
 * @enum {number}
 */
adapt.vtree.Whitespace = {
	IGNORE: 0,  // Whitespace sequence between blocks is ignored
	NEWLINE: 1, // Whitespace sequence between blocks is ignored unless it containes newline
	PRESERVE: 2 // Whitespace sequence between blocks is preserved
};

/**
 * @param {Node} node
 * @param {adapt.vtree.Whitespace} whitespace
 * @return {boolean}
 */
adapt.vtree.canIgnore = function(node, whitespace) {
	if (node.nodeType == 1)
		return false;
	var text = node.textContent;
	switch (whitespace) {
	case adapt.vtree.Whitespace.IGNORE:
		return !!text.match(/^\s*$/);
	case adapt.vtree.Whitespace.NEWLINE:
		return !!text.match(/^[ \t\f]*$/);
	case adapt.vtree.Whitespace.PRESERVE:
		return text.length == 0;
	}
	throw new Error("Unexpected whitespace: " + whitespace);
};

/**
 * @param {string} flowName
 * @param {!Element} element
 * @param {number} startOffset
 * @param {number} priority
 * @param {number} linger
 * @param {boolean} exclusive
 * @param {boolean} repeated
 * @param {boolean} last
 * @constructor
 */
adapt.vtree.FlowChunk = function(flowName, element, startOffset,
        priority, linger, exclusive, repeated, last) {
	/** @type {string} */ this.flowName = flowName;
	/** @type {!Element} */ this.element = element;
	/** @type {number} */ this.startOffset = startOffset;
	/** @type {number} */ this.priority = priority;
	/** @type {number} */ this.linger = linger;
	/** @type {boolean} */ this.exclusive = exclusive;
	/** @type {boolean} */ this.repeated = repeated;
	/** @type {boolean} */ this.last = last;
	/** @type {number} */ this.startPage = -1;
};

/**
 * @param {adapt.vtree.FlowChunk} other
 * @return {boolean}
 */
adapt.vtree.FlowChunk.prototype.isBetter = function(other) {
    if (!this.exclusive)
        return false;
    if (!other.exclusive)
        return true;
    if (this.priority > other.priority)
        return true;
    return this.last;
};

/**
 * @typedef {{
 *   left: number,
 *   top: number,
 *   right: number,
 *   bottom: number
 * }}
 */
adapt.vtree.ClientRect;

/**
 * @param {adapt.vtree.ClientRect} r1
 * @param {adapt.vtree.ClientRect} r2
 * @return {number}
 */
adapt.vtree.clientrectIncreasingTop = function(r1, r2) {
	return r1.top - r2.top;
};

/**
 * @param {adapt.vtree.ClientRect} r1
 * @param {adapt.vtree.ClientRect} r2
 * @return {number}
 */
adapt.vtree.clientrectDecreasingRight = function(r1, r2) {
	return r2.right - r1.right;
};

/**
 * Interface to read the position assigned to the elements and ranges by the
 * browser.
 * @interface
 */
adapt.vtree.ClientLayout = function() {};

/**
 * @param {Range} range
 * @return {Array.<adapt.vtree.ClientRect>}
 */
adapt.vtree.ClientLayout.prototype.getRangeClientRects = function(range) {};

/**
 * @param {Element} element
 * @return {adapt.vtree.ClientRect}
 */
adapt.vtree.ClientLayout.prototype.getElementClientRect = function(element) {};

/**
 * @param {Element} element
 * @return {CSSStyleDeclaration} element's computed style
 */
adapt.vtree.ClientLayout.prototype.getElementComputedStyle = function(element) {};

/**
 * Styling, creating a single node's view, etc.
 * @interface
 */
adapt.vtree.LayoutContext = function() {};

/**
 * Creates a functionally equivalent, but uninitialized layout context,
 * suitable for building a separate column.
 * @return {adapt.vtree.LayoutContext}
 */
adapt.vtree.LayoutContext.prototype.clone = function() {};

/**
 * Set the current source node and create a view. Parameter firstTime
 * is true (and possibly offsetInNode > 0) if node was broken on
 * the previous page.
 * @param {adapt.vtree.NodeContext} nodeContext
 * @param {boolean} firstTime
 * @return {!adapt.task.Result.<boolean>} true if children should be processed as well
 */
adapt.vtree.LayoutContext.prototype.setCurrent = function(nodeContext, firstTime) {};

/**
 * Set the container element that holds view elements produced from the source.
 * @param {Element} container
 * @param {boolean} isFootnote
 */
adapt.vtree.LayoutContext.prototype.setViewRoot = function(container, isFootnote) {};

/**
 * Moves to the next view node, creating it and appending it to the view tree if needed.
 * @param {adapt.vtree.NodeContext} nodeContext
 * @return {!adapt.task.Result.<adapt.vtree.NodeContext>} that corresponds to the next view node
 */
adapt.vtree.LayoutContext.prototype.nextInTree = function(nodeContext) {};

/**
 * Apply pseudo-element styles (if any).
 * @param {adapt.vtree.NodeContext} nodeContext
 * @param {string} pseudoName
 * @param {Element} element element to apply styles to
 * @return {void}
 */
adapt.vtree.LayoutContext.prototype.applyPseudoelementStyle = function(nodeContext, pseudoName, element) {};

/**
 * Apply styles to footnote container.
 * @param {boolean} vertical
 * @param {Element} element element to apply styles to
 * @return {boolean} vertical
 */
adapt.vtree.LayoutContext.prototype.applyFootnoteStyle = function(vertical, element) {};


/**
 * Peel off innermost first-XXX pseudoelement, create and create view nodes after
 * the end of that pseudoelement.
 * @param {adapt.vtree.NodeContext} nodeContext
 * @param {number} nodeOffset
 * @return {!adapt.task.Result.<adapt.vtree.NodeContext>}
 */
adapt.vtree.LayoutContext.prototype.peelOff = function(nodeContext, nodeOffset) {};

/**
 * @typedef {{
 * 		node:Node,
 *      shadowType:adapt.vtree.ShadowType,
 *      shadowContext:adapt.vtree.ShadowContext,
 *      nodeShadow:adapt.vtree.ShadowContext,
 *      shadowSibling:adapt.vtree.NodePositionStep
 * }}
 */
adapt.vtree.NodePositionStep;

/**
 * NodePosition represents a position in the document
 * @typedef {{
 * 		steps:Array.<adapt.vtree.NodePositionStep>,
 * 		offsetInNode:number,
 *  	after:boolean
 * }}
 */
adapt.vtree.NodePosition;

/**
 * @param {Node} node
 * @return {adapt.vtree.NodePosition}
 */
adapt.vtree.newNodePositionFromNode = function(node) {
	var step = {
		node: node,
		shadowType: adapt.vtree.ShadowType.NONE,
		shadowContext: null,
		nodeShadow: null,
		shadowSibling: null
	};
	return {steps:[step], offsetInNode:0, after:false};
};

/**
 * @param {adapt.vtree.NodeContext} nodeContext
 * @return {adapt.vtree.NodePosition}
 */
adapt.vtree.newNodePositionFromNodeContext = function(nodeContext) {
	var step = {
		node: nodeContext.sourceNode,
		shadowType: adapt.vtree.ShadowType.NONE,
		shadowContext: nodeContext.shadowContext,
		nodeShadow: null,
		shadowSibling: null
	};
	return {steps:[step], offsetInNode:0, after:false};
};

/**
 * @enum {number}
 */
adapt.vtree.ShadowType = {
	NONE: 0,
	CONTENT: 1,
	ROOTLESS: 2,
	ROOTED: 3
};

/**
 * Data about shadow tree instance.
 * @param {Element} owner
 * @param {Element} root
 * @param {adapt.xmldoc.XMLDocHolder} xmldoc
 * @param {adapt.vtree.ShadowContext} parentShadow
 * @param {adapt.vtree.ShadowContext} superShadow
 * @param {adapt.vtree.ShadowType} type
 * @param {Object} styler
 * @constructor
 */
adapt.vtree.ShadowContext = function(owner, root, xmldoc, parentShadow, superShadow, type, styler) {
	/** @const */ this.owner = owner;
	/** @const */ this.parentShadow = parentShadow;
	/** @const */ this.superShadow = superShadow;
	/** @type {adapt.vtree.ShadowContext} */ this.subShadow = null;
	/** @const */ this.root = root;
	/** @const */ this.xmldoc = xmldoc;
	/** @const */ this.type = type;
	if (superShadow) {
		superShadow.subShadow = this;
	}
	/** @const */ this.styler = styler;
};

/**
 * Information about :first-letter or :first-line pseudoelements
 * @param {adapt.vtree.FirstPseudo} outer
 * @param {number} count 0 - first-letter, 1 or more - first line(s)
 * @constructor
 */
adapt.vtree.FirstPseudo = function(outer, count) {
	/** @const */ this.outer = outer;
	/** @const */ this.count = count;
};

/**
 * NodeContext represents a position in the document + layout-related
 * information attached to it. When after=false and offsetInNode=0, the
 * position is inside the element (node), but just before its first child.
 * When offsetInNode>0 it represents offset in the textual content of the
 * node. When after=true it represents position right after the last child
 * of the node. boxOffset is incremented by 1 for any valid node position.
 * @param {Node} sourceNode
 * @param {adapt.vtree.NodeContext} parent
 * @param {number} boxOffset
 * @constructor
 */
adapt.vtree.NodeContext = function(sourceNode, parent, boxOffset) {
	/** @type {Node} */ this.sourceNode = sourceNode;
	/** @type {adapt.vtree.NodeContext} */ this.parent = parent;
	/** @type {number} */ this.boxOffset = boxOffset;
    // position itself
    /** @type {number} */ this.offsetInNode = 0;
    /** @type {boolean} */ this.after = false;
    /** @type {adapt.vtree.ShadowType} */ this.shadowType = adapt.vtree.ShadowType.NONE;  // parent's shadow type
    /** @type {adapt.vtree.ShadowContext} */ this.shadowContext = (parent ? parent.shadowContext : null);
    /** @type {adapt.vtree.ShadowContext} */ this.nodeShadow = null;
    /** @type {adapt.vtree.NodeContext} */ this.shadowSibling = null;  // next "sibling" in the shadow tree
    // other stuff
    /** @type {boolean} */ this.shared = false;
    /** @type {boolean} */ this.inline = true;
    /** @type {boolean} */ this.overflow = false;
    /** @type {number} */ this.breakPenalty = parent ? parent.breakPenalty : 0;
    /** @type {?string} */ this.floatSide = null;
    /** @type {?string} */ this.clearSide = null;
    /** @type {adapt.vtree.Whitespace} */ this.whitespace = parent ? parent.whitespace : adapt.vtree.Whitespace.IGNORE;
    /** @type {boolean} */ this.floatContainer = parent ? parent.floatContainer : false;
    /** @type {?string} */ this.breakBefore = null;
    /** @type {?string} */ this.breakAfter = null;
    /** @type {Node} */ this.viewNode = null;
    /** @type {Object.<string,number|string>} */ this.inheritedProps = parent ? parent.inheritedProps : {};
    /** @type {boolean} */ this.vertical = parent ? parent.vertical : false;
    /** @type {adapt.vtree.FirstPseudo} */ this.firstPseudo = parent ? parent.firstPseudo : null;
};

/**
 * @return {void}
 */
adapt.vtree.NodeContext.prototype.resetView = function() {
    this.inline = true;
    this.breakPenalty = this.parent ? this.parent.breakPenalty : 0;
    this.viewNode = null;
    this.offsetInNode = 0;
    this.after = false;
    this.floatSide = null;
    this.clearSide = null;
    this.breakBefore = null;
    this.breakAfter = null;	
    this.nodeShadow = null;
    this.floatContainer = this.parent ? this.parent.floatContainer : false;
    this.vertical = this.parent ? this.parent.vertical : false;
    this.nodeShadow = null;
};

/**
 * @private
 * @return {adapt.vtree.NodeContext}
 */
adapt.vtree.NodeContext.prototype.cloneItem = function() {
    var np = new adapt.vtree.NodeContext(this.sourceNode, this.parent, this.boxOffset);
    np.offsetInNode = this.offsetInNode;
    np.after = this.after;
    np.nodeShadow = this.nodeShadow;
    np.shadowType = this.shadowType;
    np.shadowContext = this.shadowContext;
    np.shadowSibling = this.shadowSibling;
    np.inline = this.inline;
    np.breakPenalty = this.breakPenalty;
    np.floatSide = this.floatSide;
    np.clearSide = this.clearSide;
    np.floatContainer = this.floatContainer;
    np.whitespace = this.whitespace;
    np.breakBefore = this.breakBefore;
    np.breakAfter = this.breakAfter;
    np.viewNode = this.viewNode;
    np.firstPseudo = this.firstPseudo;
    np.vertical = this.vertical;
    np.overflow = this.overflow;
    return np;
};

/**
 * @return {adapt.vtree.NodeContext}
 */
adapt.vtree.NodeContext.prototype.modify = function() {
    if (!this.shared)
        return this;
    return this.cloneItem();
};

/**
 * @return {adapt.vtree.NodeContext}
 */
adapt.vtree.NodeContext.prototype.copy = function() {
    var np = this;
    do {
        if (np.shared)
            break;
        np.shared = true;
        np = np.parent;
    } while (np);
    return this;
};

/**
 * @return {adapt.vtree.NodeContext}
 */
adapt.vtree.NodeContext.prototype.clone = function() {
    var np = this.cloneItem();
    var npc = np;
    var npp;
    while ((npp = npc.parent) != null) {
        npp = npp.cloneItem();
        npc.parent = npp;
        npc = npp;
    }
    return np;
};

/**
 * @return {adapt.vtree.NodePositionStep}
 */
adapt.vtree.NodeContext.prototype.toNodePositionStep = function() {
	return {
		node: this.sourceNode,
		shadowType: this.shadowType,
		shadowContext: this.shadowContext,
		nodeShadow: this.nodeShadow,
		shadowSibling: this.shadowSibling ? this.shadowSibling.toNodePositionStep() : null
	};	
};

/**
 * @return {adapt.vtree.NodePosition}
 */
adapt.vtree.NodeContext.prototype.toNodePosition = function() {
	var nc = this;
	var steps = [];
	do {
		// We need fully "peeled" path, so don't record first-XXX pseudoelement containers
		if (!nc.firstPseudo || !nc.parent || nc.parent.firstPseudo === nc.firstPseudo) {
			steps.push(nc.toNodePositionStep());
		}
		nc = nc.parent;
	} while(nc);
	return {steps:steps, offsetInNode: this.offsetInNode, after: this.after};
};

/**
 * @param {adapt.vtree.NodePosition} primary
 * @constructor
 */
adapt.vtree.ChunkPosition = function(primary) {
	/** @type {adapt.vtree.NodePosition} */ this.primary = primary;
	/** @type {Array.<adapt.vtree.NodePosition>} */ this.floats = null;
	/** @type {Array.<adapt.vtree.NodePosition>} */ this.footnotes = null;
};

/**
 * @return {adapt.vtree.ChunkPosition}
 */
adapt.vtree.ChunkPosition.prototype.clone = function() {
	var result = new adapt.vtree.ChunkPosition(this.primary);
	if (this.floats) {
		result.floats = [];
		for (var i = 0; i < this.floats.length; ++i) {
			result.floats[i] = this.floats[i];
		}
	}
	if (this.footnotes) {
		result.footnotes = [];
		for (var i = 0; i < this.footnotes.length; ++i) {
			result.footnotes[i] = this.footnotes[i];
		}
	}
	return result;
};

/**
 * @param {adapt.vtree.ChunkPosition} chunkPosition
 * @param {adapt.vtree.FlowChunk} flowChunk
 * @constructor
 */
adapt.vtree.FlowChunkPosition = function(chunkPosition, flowChunk) {
	/** @type {adapt.vtree.ChunkPosition} */ this.chunkPosition = chunkPosition;
	/** @const */ this.flowChunk = flowChunk;
};

/**
 * @return {adapt.vtree.FlowChunkPosition}
 */
adapt.vtree.FlowChunkPosition.prototype.clone = function() {
    return new adapt.vtree.FlowChunkPosition(this.chunkPosition.clone(),
        this.flowChunk);
};

/**
 * @constructor
 */
adapt.vtree.FlowPosition = function() {
    /**
     * @type {Array.<adapt.vtree.FlowChunkPosition>}
     */
	this.positions = [];
};

/**
 * @return {adapt.vtree.FlowPosition}
 */
adapt.vtree.FlowPosition.prototype.clone = function() {
    var newfp = new adapt.vtree.FlowPosition();
    var arr = this.positions;
    var newarr = newfp.positions;
    for (var i = 0; i < arr.length; i++) {
        newarr[i] = arr[i].clone();
    }
    return newfp;
};

/**
 * @param {number} offset
 * @return {boolean}
 */
adapt.vtree.FlowPosition.prototype.hasContent = function(offset) {
	return this.positions.length > 0 &&
	    this.positions[0].flowChunk.startOffset <= offset;
};

/**
 * @constructor
 */
adapt.vtree.LayoutPosition = function() {
    /**
     * One-based, incremented before layout.
     * @type {number}
     */
	this.page = 0;
	/**
	 * @type {Object.<string,adapt.vtree.FlowPosition>}
	 */
    this.flowPositions = {};
    /**
     * flowPositions is built up to this offset.
     * @type {number}
     */
    this.highestSeenOffset = 0;
};

/**
 * @return {adapt.vtree.LayoutPosition}
 */
adapt.vtree.LayoutPosition.prototype.clone = function() {
    var newcp = new adapt.vtree.LayoutPosition();
    newcp.page = this.page;
    newcp.highestSeenNode = this.highestSeenNode;
    newcp.highestSeenOffset = this.highestSeenOffset;
    newcp.lookupPositionOffset = this.lookupPositionOffset;
    for (var name in this.flowPositions) {
        newcp.flowPositions[name] = this.flowPositions[name].clone();
    }
    return newcp;
};

/**
 * @param {string} name flow name.
 * @param {number} offset
 * @return {boolean}
 */
adapt.vtree.LayoutPosition.prototype.hasContent = function(name, offset) {
    var flowPos = this.flowPositions[name];
    if (!flowPos)
        return false;
    return flowPos.hasContent(offset);
};

/**
 * @param {Element} element
 * @constructor
 */
adapt.vtree.Container = function(element) {
	/** @type {Element} */ this.element = element;
    /** @type {number} */ this.left = 0;
    /** @type {number} */ this.top = 0;
    /** @type {number} */ this.marginLeft = 0;
    /** @type {number} */ this.marginRight = 0;
    /** @type {number} */ this.marginTop = 0;
    /** @type {number} */ this.marginBottom = 0;
    /** @type {number} */ this.borderLeft = 0;
    /** @type {number} */ this.borderRight = 0;
    /** @type {number} */ this.borderTop = 0;
    /** @type {number} */ this.borderBottom = 0;
    /** @type {number} */ this.paddingLeft = 0;
    /** @type {number} */ this.paddingRight = 0;
    /** @type {number} */ this.paddingTop = 0;
    /** @type {number} */ this.paddingBottom = 0;
    /** @type {number} */ this.width = 0;
    /** @type {number} */ this.height = 0;
    /** @type {number} */ this.originX = 0;
    /** @type {number} */ this.originY = 0;
    /** @type {Array.<adapt.geom.Shape>} */ this.exclusions = null;
    /** @type {adapt.geom.Shape} */ this.innerShape = null;
    /** @type {number} */ this.computedBlockSize = 0;
    /** @type {number} */ this.snapWidth = 0;
    /** @type {number} */ this.snapHeight = 0;
    /** @type {number} */ this.snapOffsetX = 0;
    /** @type {number} */ this.snapOffsetY = 0;
    /** @type {boolean} */ this.vertical = false;  // vertical writing
};

adapt.vtree.Container.prototype.getInsetTop = function() {
	return this.marginTop + this.borderTop + this.paddingTop;
};

adapt.vtree.Container.prototype.getInsetBottom = function() {
	return this.marginBottom + this.borderBottom + this.paddingBottom;
};

adapt.vtree.Container.prototype.getInsetLeft = function() {
	return this.marginLeft + this.borderLeft + this.paddingLeft;
};

adapt.vtree.Container.prototype.getInsetRight = function() {
	return this.marginRight + this.borderRight + this.paddingRight;
};

adapt.vtree.Container.prototype.getInsetBefore = function() {
	if (this.vertical)
		return this.getInsetRight();
	else
		return this.getInsetTop();
};

adapt.vtree.Container.prototype.getInsetAfter = function() {
	if (this.vertical)
		return this.getInsetLeft();
	else
		return this.getInsetBottom();
};

adapt.vtree.Container.prototype.getInsetStart = function() {
	if (this.vertical)
		return this.getInsetTop();
	else
		return this.getInsetLeft();
};

adapt.vtree.Container.prototype.getInsetEnd = function() {
	if (this.vertical)
		return this.getInsetBottom();
	else
		return this.getInsetRight();
};

/**
 * @param {adapt.vtree.ClientRect} box
 * @return {number}
 */
adapt.vtree.Container.prototype.getBeforeEdge = function(box) {
	return this.vertical ? box.right : box.top;
};

/**
 * @param {adapt.vtree.ClientRect} box
 * @return {number}
 */
adapt.vtree.Container.prototype.getAfterEdge = function(box) {
	return this.vertical ? box.left : box.bottom;
};

/**
 * @param {adapt.vtree.ClientRect} box
 * @return {number}
 */
adapt.vtree.Container.prototype.getStartEdge = function(box) {
	return this.vertical ? box.top : box.left;
};

/**
 * @param {adapt.vtree.ClientRect} box
 * @return {number}
 */
adapt.vtree.Container.prototype.getEndEdge = function(box) {
	return this.vertical ? box.bottom : box.right;
};

/**
 * @param {adapt.vtree.ClientRect} box
 * @return {number}
 */
adapt.vtree.Container.prototype.getInlineSize = function(box) {
	return this.vertical ? box.bottom - box.top : box.right - box.left;
};

/**
 * @param {adapt.vtree.ClientRect} box
 * @return {number}
 */
adapt.vtree.Container.prototype.getBoxSize = function(box) {
	return this.vertical ? box.right - box.left : box.bottom - box.top;
};

/**
 * @return {number}
 */
adapt.vtree.Container.prototype.getBoxDir = function() {
	return this.vertical ? -1 : 1;
};

/**
 * @return {number}
 */
adapt.vtree.Container.prototype.getInlineDir = function() {
	return 1;
};


/**
 * @param {adapt.vtree.Container} other
 * @return {void}
 */
adapt.vtree.Container.prototype.copyFrom = function(other) {
	this.element = other.element;
    this.left = other.left;
    this.top = other.top;
    this.marginLeft = other.marginLeft;
    this.marginRight = other.marginRight;
    this.marginTop = other.marginTop;
    this.marginBottom = other.marginBottom;
    this.borderLeft = other.borderLeft;
    this.borderRight = other.borderRight;
    this.borderTop = other.borderTop;
    this.borderBottom = other.borderBottom;
    this.paddingLeft = other.paddingLeft;
    this.paddingRight = other.paddingRight;
    this.paddingTop = other.paddingTop;
    this.paddingBottom = other.paddingBottom;
    this.width = other.width;
    this.height = other.height;
    this.originX = other.originX;
    this.originY = other.originY;
    this.innerShape = other.innerShape;
    this.exclusions = other.exclusions;
    this.computedBlockSize = other.computedBlockSize;
    this.snapWidth = other.snapWidth;
    this.snapHeight = other.snapHeight;
    this.vertical = other.vertical;
};

/**
 * @param {number} top
 * @param {number} height
 * @return {void}
 */
adapt.vtree.Container.prototype.setVerticalPosition = function(top, height) {
    this.top = top;
    this.height = height;
    adapt.base.setCSSProperty(this.element, "top", top + "px");
    adapt.base.setCSSProperty(this.element, "height", height + "px");
};

/**
 * @param {number} left
 * @param {number} width
 * @return {void}
 */
adapt.vtree.Container.prototype.setHorizontalPosition = function(left, width) {
    this.left = left;
    this.width = width;
    adapt.base.setCSSProperty(this.element, "left", left + "px");
    adapt.base.setCSSProperty(this.element, "width", width + "px");
};

/**
 * @return {adapt.geom.Shape}
 */
adapt.vtree.Container.prototype.getInnerShape = function() {
	var offsetX = this.originX + this.left + this.getInsetLeft();
	var offsetY = this.originY + this.top + this.getInsetTop();
	if (this.innerShape)
		return this.innerShape.withOffset(offsetX, offsetY);
	return adapt.geom.shapeForRect(offsetX, offsetY,
			offsetX + this.width, offsetY + this.height);
};


/**
 * @constructor
 * @param {Element} elem
 * @extends {adapt.css.Visitor}
 */
adapt.vtree.ContentPropertyHandler = function(elem) {
	adapt.css.Visitor.call(this);
    /** @const */ this.elem = elem;
};
goog.inherits(adapt.vtree.ContentPropertyHandler, adapt.css.Visitor);

/** @override */
adapt.vtree.ContentPropertyHandler.prototype.visitStr = function(str) {
    this.elem.appendChild(this.elem.ownerDocument.createTextNode(str.str));
    return null;
};
    
/** @override */
adapt.vtree.ContentPropertyHandler.prototype.visitURL = function(url) {
    var img = this.elem.ownerDocument.createElementNS(adapt.base.NS.XHTML, "img");
    img.setAttribute("src", url.url);
    this.elem.appendChild(img);
    return null;
};

/** @override */
adapt.vtree.ContentPropertyHandler.prototype.visitSpaceList = function(list) {
    this.visitValues(list.values);
    return null;
};

/**
 * @param {adapt.css.Val} val
 * @return {boolean}
 */
adapt.vtree.nonTrivialContent = function(val) {
	return val != null && val !== adapt.css.ident.normal && val !== adapt.css.ident.none
		&& val !== adapt.css.ident.inherit;
};


