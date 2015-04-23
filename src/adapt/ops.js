/**
 * Copyright 2013 Google, Inc.
 * Copyright 2015 Vivliostyle Inc.
 * @fileoverview Render EPUB content files by applying page masters, styling and layout.
 */
goog.provide('adapt.ops');

goog.require('adapt.task');
goog.require('adapt.geom');
goog.require('adapt.expr');
goog.require('adapt.css');
goog.require('adapt.csstok');
goog.require('adapt.cssparse');
goog.require('adapt.cssvalid');
goog.require('adapt.csscasc');
goog.require('adapt.cssstyler');
goog.require('adapt.pm');
goog.require('adapt.vtree');
goog.require('adapt.layout');
goog.require('adapt.vgen');
goog.require('adapt.xmldoc');
goog.require('adapt.font');
goog.require('vivliostyle.page');

/**
 * @typedef {{properties:adapt.csscasc.ElementStyle,condition:adapt.expr.Val}}
 */
adapt.ops.FontFace;

/**
 * @param {adapt.ops.OPSDocStore} store
 * @param {adapt.expr.LexicalScope} rootScope
 * @param {adapt.expr.LexicalScope} pageScope
 * @param {adapt.csscasc.Cascade} cascade
 * @param {adapt.pm.RootPageBox} rootBox
 * @param {Array.<adapt.ops.FontFace>} fontFaces
 * @param {adapt.csscasc.ElementStyle} footnoteProps
 * @param {Object.<string,adapt.csscasc.ElementStyle>} flowProps
 * @param {Array.<adapt.csscasc.ElementStyle>} viewportProps
 * @constructor
 */
adapt.ops.Style = function(store, rootScope, pageScope, cascade, rootBox,
		fontFaces, footnoteProps, flowProps, viewportProps) {
	/** @const */ this.store = store;
	/** @const */ this.rootScope = rootScope;
	/** @const */ this.pageScope = pageScope;
	/** @const */ this.cascade = cascade;
	/** @const */ this.rootBox = rootBox;
	/** @const */ this.fontFaces = fontFaces;
	/** @const */ this.fontDeobfuscator = store.fontDeobfuscator;
	/** @const */ this.footnoteProps = footnoteProps;
	/** @const */ this.flowProps = flowProps;
	/** @const */ this.viewportProps = viewportProps;
	/** @const */ this.validatorSet = store.validatorSet;
    this.pageScope.defineBuiltIn("has-content", function(name) {
    	var styleInstance = /** @type {adapt.ops.StyleInstance} */ (this);
    	return styleInstance.currentLayoutPosition.hasContent(/** @type {string} */ (name), styleInstance.lookupOffset);
    });  
    this.pageScope.defineName("page-number", new adapt.expr.Native(this.pageScope, function() {    	
    	var styleInstance = /** @type {adapt.ops.StyleInstance} */ (this);
    	return styleInstance.currentLayoutPosition.page;
    }, "page-number"));
};

/**
 * @param {number} viewportWidth
 * @param {number} viewportHeight
 * @param {number} fontSize
 * @return {{width:number, height:number, fontSize:number}}
 */
adapt.ops.Style.prototype.sizeViewport = function(viewportWidth, viewportHeight, fontSize) {
	if (this.viewportProps.length) {
		var context = new adapt.expr.Context(this.rootScope, viewportWidth,
				viewportHeight, fontSize);
		var viewportProps = adapt.csscasc.mergeAll(context, this.viewportProps);
		var width = viewportProps["width"];
		var height = viewportProps["height"];
		var textZoom = viewportProps["text-zoom"];
		var scaleFactor = 1;
		if ((width && height) || textZoom) {
			var defaultFontSize = adapt.expr.defaultUnitSizes["em"];
			var zoomVal = textZoom ? textZoom.evaluate(context, "text-zoom") : null;
			if (zoomVal === adapt.css.ident.scale) {
				scaleFactor = defaultFontSize / fontSize;
				fontSize = defaultFontSize;
				viewportWidth *= scaleFactor;
				viewportHeight *= scaleFactor;
			}
			if (width && height) {
				var widthVal = adapt.css.toNumber(width.evaluate(context, "width"), context);
				var heightVal = adapt.css.toNumber(height.evaluate(context, "height"), context);
				if (widthVal > 0 && heightVal > 0) {
					return {width:widthVal, height:heightVal, fontSize: fontSize};		
				}
			}
		}
	}
	return {width:viewportWidth, height:viewportHeight, fontSize:fontSize};	
};

//-------------------------------------------------------------------------------

/**
 * @param {adapt.ops.Style} style
 * @param {adapt.xmldoc.XMLDocHolder} xmldoc
 * @param {?string} defaultLang
 * @param {adapt.vgen.Viewport} viewport
 * @param {adapt.vtree.ClientLayout} clientLayout
 * @param {adapt.font.Mapper} fontMapper
 * @param {adapt.vgen.CustomRenderer} customRenderer
 * @param {Object.<string,string>} fallbackMap
 * @constructor
 * @extends {adapt.expr.Context}
 * @implements {adapt.cssstyler.FlowListener}
 * @implements {adapt.pm.InstanceHolder}
 * @implements {adapt.vgen.StylerProducer}
 */
adapt.ops.StyleInstance = function(style, xmldoc, defaultLang, viewport, clientLayout, 
		fontMapper, customRenderer, fallbackMap) {
	adapt.expr.Context.call(this, style.rootScope, viewport.width, viewport.height, viewport.fontSize);
	/** @const */ this.style = style;
	/** @const */ this.xmldoc = xmldoc;
	/** @const */ this.lang = xmldoc.lang || defaultLang;
	/** @const */ this.viewport = viewport;
    /** @const */ this.primaryFlows = /** @type {Object.<string,boolean>} */ ({ "body": true });
    /** @const */ this.clientLayout = clientLayout;
    /** @type {adapt.pm.RootPageBoxInstance} */ this.rootPageBoxInstance = null;
    /** @type {adapt.cssstyler.Styler} */ this.styler = null;
    /** @type {Object.<string,adapt.cssstyler.Styler>} */ this.stylerMap = null;
    /** @type {adapt.vtree.LayoutPosition} */ this.currentLayoutPosition = null;
    /** @type {number} */ this.lookupOffset = 0;
    /** @const */ this.fontMapper = fontMapper;
    /** @const */ this.faces = new adapt.font.DocumentFaces(this.style.fontDeobfuscator);
    /** @type {Object.<string,adapt.pm.PageBoxInstance>} */ this.pageBoxInstances = {};
    /** @type {vivliostyle.page.PageManager} */ this.pageManager = null;
    /** @type {boolean} */ this.regionBreak = false;
    /** @type {!Object.<string,boolean>} */ this.pageBreaks = {};
    /** @const */ this.customRenderer = customRenderer;
    /** @const */ this.fallbackMap = fallbackMap;
    for (var flowName in style.flowProps) {
    	var flowStyle = style.flowProps[flowName];
    	var consume = adapt.csscasc.getProp(flowStyle, "flow-consume");
    	if (consume) {
    		var consumeVal = consume.evaluate(this, "flow-consume");
    		if (consumeVal == adapt.css.ident.all) {
    			this.primaryFlows[flowName] = true;
    		} else {
    			delete this.primaryFlows[flowName];
    		}
    	}
    }
};
goog.inherits(adapt.ops.StyleInstance, adapt.expr.Context);

/**
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.ops.StyleInstance.prototype.init = function() {
    var self = this;
    /** @type {!adapt.task.Frame.<boolean>} */ var frame
    	= adapt.task.newFrame("StyleInstance.init");
    self.styler = new adapt.cssstyler.Styler(self.xmldoc, self.style.cascade, 
    		self.style.rootScope, self, this.primaryFlows, self.style.validatorSet);
    self.styler.resetFlowChunkStream(self);
    self.stylerMap = {};
    self.stylerMap[self.xmldoc.url] = self.styler;
    var docElementStyle = self.styler.getTopContainerStyle();
    var rootBox = this.style.rootBox;
    this.rootPageBoxInstance = new adapt.pm.RootPageBoxInstance(rootBox);
    var cascadeInstance = this.style.cascade.createInstance(self, this.lang);
    this.rootPageBoxInstance.applyCascadeAndInit(cascadeInstance, docElementStyle);
    this.rootPageBoxInstance.resolveAutoSizing(self);
    this.pageManager = new vivliostyle.page.PageManager(cascadeInstance, this.style.pageScope, this.rootPageBoxInstance, self, docElementStyle);
    var srcFaces = /** @type {Array.<adapt.font.Face>} */ ([]);
    for (var i = 0; i < self.style.fontFaces.length; i++) {
    	var fontFace = self.style.fontFaces[i++];
    	if (fontFace.condition && !fontFace.condition.evaluate(self))
    		continue;
    	var properties = adapt.font.prepareProperties(fontFace.properties, self);
    	var srcFace = new adapt.font.Face(properties);
    	srcFaces.push(srcFace);
    }
	self.fontMapper.findOrLoadFonts(srcFaces, self.faces).thenFinish(frame);
	return frame.result();
};

/**
 * @override
 */
adapt.ops.StyleInstance.prototype.getStylerForDoc = function(xmldoc) {
	var styler = this.stylerMap[xmldoc.url];
	if (!styler) {
		var style = this.style.store.getStyleForDoc(xmldoc);
		// We need a separate content, so that variables can get potentially different values.
		var context = new adapt.expr.Context(style.rootScope, this.pageWidth, this.pageHeight, this.fontSize);
		styler = new adapt.cssstyler.Styler(xmldoc, style.cascade, 
        		style.rootScope, context, this.primaryFlows, style.validatorSet);
		this.stylerMap[xmldoc.url] = styler;
	}
	return styler;
};

/**
 * @override
 */
adapt.ops.StyleInstance.prototype.registerInstance = function(key, instance) {
	this.pageBoxInstances[key] = instance;
};

/**
 * @override
 */
adapt.ops.StyleInstance.prototype.lookupInstance = function(key) {
	return this.pageBoxInstances[key];
};

/**
 * @override
 */
adapt.ops.StyleInstance.prototype.encounteredFlowChunk = function(flowChunk) {
    var cp = this.currentLayoutPosition;
    if (cp) {
	    var flowPosition = cp.flowPositions[flowChunk.flowName];
	    if (!flowPosition) {
	        flowPosition = new adapt.vtree.FlowPosition();
	        cp.flowPositions[flowChunk.flowName] = flowPosition;
	    }
	    var nodePosition = adapt.vtree.newNodePositionFromNode(flowChunk.element);
	    var chunkPosition = new adapt.vtree.ChunkPosition(nodePosition);
	    var flowChunkPosition = new adapt.vtree.FlowChunkPosition(chunkPosition, flowChunk);
	    flowPosition.positions.push(flowChunkPosition);
    }
};

/**
 * @param {adapt.vtree.FlowPosition} flowPosition
 * @return {number}
 */
adapt.ops.StyleInstance.prototype.getConsumedOffset = function(flowPosition) {
    var offset = Number.POSITIVE_INFINITY;
    for (var i = 0; i < flowPosition.positions.length; i++) {
        var pos = flowPosition.positions[i].chunkPosition.primary;
        var node = pos.steps[0].node;
        var offsetInNode = pos.offsetInNode;
        var after = pos.after;
        var k = 0;
        while (node.ownerDocument != this.xmldoc.document) {
        	k++;
        	node = pos.steps[k].node;
        	after = false;
        	offsetInNode = 0;
        }
        var chunkOffset = this.xmldoc.getNodeOffset(node, offsetInNode, after);
        if (chunkOffset < offset)
            offset = chunkOffset;
    }
    return offset;
};

/**
 * @param {adapt.vtree.LayoutPosition|undefined} layoutPosition
 * @return {number} document offset of the given layoutPosition
 */
adapt.ops.StyleInstance.prototype.getPosition = function(layoutPosition) {
	if (!layoutPosition)
		return 0;
    var currentPosition = Number.POSITIVE_INFINITY;
    for (var flowName in this.primaryFlows) {
        var flowPosition = layoutPosition.flowPositions[flowName];
        if ((!flowPosition || flowPosition.positions.length == 0) && this.currentLayoutPosition) {
            this.styler.styleUntilFlowIsReached(flowName);
        	flowPosition = this.currentLayoutPosition.flowPositions[flowName];
            if (layoutPosition != this.currentLayoutPosition) {
            	if (flowPosition) {
            		flowPosition = flowPosition.clone();
            		layoutPosition.flowPositions[flowName] = flowPosition;
            	}
            }
        }
        if (flowPosition) {
            var consumedOffset = this.getConsumedOffset(flowPosition);
            if (consumedOffset < currentPosition)
                currentPosition = consumedOffset;
        }
    }
    return currentPosition;
};

adapt.ops.StyleInstance.prototype.dumpLocation = function(position) {
	adapt.base.log("Location - page " + this.currentLayoutPosition.page);
	adapt.base.log("  currnt: " + position);
	adapt.base.log("  lookup: " + this.lookupOffset);
	for (var flowName in this.currentLayoutPosition.flowPositions) {
		var flowPosition = this.currentLayoutPosition.flowPositions[flowName];
		for (var i = 0; i < flowPosition.positions.length; i++) {
			var p = flowPosition.positions[i];
			adapt.base.log("  Chunk " + flowName + ": " + p.flowChunk.startOffset);
		}
	}
};

/**
 * @return {adapt.pm.PageMasterInstance}
 */
adapt.ops.StyleInstance.prototype.selectPageMaster = function() {
	var self = this;
    var cp = this.currentLayoutPosition;
    // 3.5. Page Layout Processing Model
    // 1. Determine current position in the document: Find the minimal consumed-offset for all elements
    // not fully-consumed in each primary flow. Current position is maximum of the results among all
    // primary flows.
    var currentPosition = this.getPosition(cp);
    if (currentPosition == Number.POSITIVE_INFINITY ) {
    	// end of primary content is reached
    	return null;
    }
    // If there is a page master generated for @page rules, use it.
    var pageMaster = this.pageManager.getPageRulePageMaster();
    if (pageMaster) {
        return pageMaster;
    }
    // 2. Page master selection: for each page master:
    var pageMasters = /** @type {Array.<adapt.pm.PageMasterInstance>} */ (this.rootPageBoxInstance.children);
    for (var i = 0; i < pageMasters.length; i++) {
        pageMaster = pageMasters[i];
        // Skip a page master generated for @page rules
        if (pageMaster.pageBox.pseudoName === vivliostyle.page.pageRuleMasterPseudoName)
            continue;
        var coeff = 1;
        // A. Calculate lookup position using current position and utilization
        // (see -epubx-utilization property)
        var utilization = pageMaster.getProp(self, "utilization");
        if (utilization && utilization.isNum())
            coeff = (/** @type {adapt.css.Num} */ (utilization)).num;
        var em = self.queryUnitSize("em");
        var pageArea = self.pageWidth * self.pageHeight;
        var lookup = Math.ceil(coeff * pageArea / (em * em));
        // B. Determine element eligibility. Each element in a flow is considered eligible if
        // it is is not marked as fully consumed and it comes in the document before the lookup position.
        // Feed lookupOffset and flow availability into the context
        this.lookupOffset = this.styler.styleUntil(currentPosition, lookup);
        this.initLingering();
        self.clearScope(this.style.pageScope);
        // C. Determine content availability. Flow has content available if it contains eligible elements.
        // D. Determine if page master is enabled using rules in Section 3.4.7
        var enabled = pageMaster.getProp(self, "enabled");
        // E. First enabled page master is used for the next page
        if (!enabled || enabled === adapt.css.ident._true) {
            if (goog.DEBUG) {
            	this.dumpLocation(currentPosition);
            }
            return pageMaster;
        }
    }
    throw new Error("No enabled page masters");
};

/**
 * @param {adapt.layout.Column} region
 * @param {string} flowName
 * @param {Array.<string>} regionIds
 * @return {adapt.task.Result.<boolean>} holding true
 */
adapt.ops.StyleInstance.prototype.layoutColumn = function(region, flowName, regionIds) {
    var flowPosition = this.currentLayoutPosition.flowPositions[flowName];
    if (!flowPosition)
        return adapt.task.newResult(true);
    if (this.primaryFlows[flowName] && region.exclusions.length > 0) {
        // In general, we force non-fitting content. Exception is only for primary flow regions
    	// that have exclusions.
    	region.forceNonfitting = false;
	}
    region.init();
    var self = this;
    /** @type {!adapt.task.Frame.<boolean>} */ var frame = adapt.task.newFrame("layoutColumn");
    var repeated = /** @type {Array.<adapt.vtree.FlowChunkPosition>} */ ([]);
    frame.loopWithFrame(function(loopFrame) {
	    while (flowPosition.positions.length > 0) {
	        var index = 0;
	        var selected = flowPosition.positions[index];
	        if (selected.flowChunk.startOffset > self.lookupOffset)
	            break;
	        for (var k = 1; k < flowPosition.positions.length; k++) {
	            var alt = flowPosition.positions[k];
	            if (alt.flowChunk.startOffset > self.lookupOffset)
	                break;
	            if (alt.flowChunk.isBetter(selected.flowChunk)) {
	                selected = alt;
	                index = k;
	            }
	        }
	        var flowChunk = selected.flowChunk;
	        var pending = true;
	        region.layout(selected.chunkPosition).then(function(newPosition) {
		        // static: add back to the flow
		        if (selected.flowChunk.repeated && (newPosition == null || flowChunk.exclusive))
		            repeated.push(selected);
		        if (flowChunk.exclusive) {
		            // exclusive, only can have one, remove from the flow even if it did not fit
		            flowPosition.positions.splice(index, 1);
		        	loopFrame.breakLoop();
		        	return;
		        } else {
		            // not exclusive, did not fit completely
		            if (newPosition) {
		                selected.chunkPosition = newPosition;
			        	loopFrame.breakLoop();
			        	return;
		            }
		            // go to the next element in the flow
		            flowPosition.positions.splice(index, 1);
		        }
		        if (pending) {
		        	// Sync result
		        	pending = false;
		        } else {
		        	// Async result
		        	loopFrame.continueLoop();
		        }
	        });
	        if (pending) {
	        	// Async result
	        	pending = false;
	        	return; 
	        }
	        // Sync result
	    }
	    loopFrame.breakLoop();
    }).then(function() {
	    // add all repeated back
	    if (repeated.length > 0)
	        flowPosition.positions = repeated.concat(flowPosition.positions);
	    frame.finish(true);
    });
    return frame.result();
};

/**
 * @param {adapt.vtree.Page} page
 * @param {adapt.pm.PageBoxInstance} boxInstance
 * @param {HTMLElement} parentContainer
 * @param {number} offsetX
 * @param {number} offsetY
 * @param {Array.<adapt.geom.Shape>} exclusions
 * @return {adapt.task.Result.<boolean>} holding true
 */
adapt.ops.StyleInstance.prototype.layoutContainer = function(page, boxInstance, 
		parentContainer, offsetX, offsetY, exclusions) {
	var self = this;
    var enabled = boxInstance.getProp(self, "enabled");
    if (enabled && enabled !== adapt.css.ident._true) {
    	return adapt.task.newResult(true);
    }
	/** @type {!adapt.task.Frame.<boolean>} */ var frame
		= adapt.task.newFrame("layoutContainer");
    var wrapFlow = boxInstance.getProp(self, "wrap-flow");
    var dontExclude = wrapFlow === adapt.css.ident.auto;
    var dontApplyExclusions = boxInstance.vertical
    	? boxInstance.isAutoWidth && boxInstance.isRightDependentOnAutoWidth
    	: boxInstance.isAutoHeight && boxInstance.isTopDependentOnAutoHeight;
    var flowName = boxInstance.getProp(self, "flow-from");
    var boxContainer = self.viewport.document.createElement("div");
    var position = boxInstance.getProp(self, "position");
    adapt.base.setCSSProperty(boxContainer, "position", position ? position.name : "absolute");
    parentContainer.insertBefore(boxContainer, parentContainer.firstChild);
    var layoutContainer = new adapt.vtree.Container(boxContainer);
    layoutContainer.vertical = boxInstance.vertical;
    boxInstance.prepareContainer(self, layoutContainer, page);
    layoutContainer.originX = offsetX;
    layoutContainer.originY = offsetY;
    offsetX += layoutContainer.left + layoutContainer.marginLeft + layoutContainer.borderLeft;
    offsetY += layoutContainer.top + layoutContainer.marginTop + layoutContainer.borderTop;
    var cont;
    if (!flowName || !flowName.isIdent()) {
	    var contentVal = boxInstance.getProp(self, "content");
	    if (contentVal) {
	    	if (adapt.vtree.nonTrivialContent(contentVal)) {
	    		contentVal.visit(new adapt.vtree.ContentPropertyHandler(boxContainer));
	    		boxInstance.transferContentProps(self, layoutContainer, page);
	    	}
	    } 	
        boxInstance.finishContainer(self, layoutContainer, page, null, 1, self.clientLayout);	    		
    	cont = adapt.task.newResult(true);
    } else if (!self.pageBreaks[flowName.toString()]) {
    	/** @type {!adapt.task.Frame.<boolean>} */ var innerFrame = adapt.task.newFrame("layoutContainer.inner");
        var flowNameStr = flowName.toString();
        // for now only a single column in vertical case
        var columnCount = boxInstance.getPropAsNumber(self, "column-count");
        var columnGap = boxInstance.getPropAsNumber(self, "column-gap");
        // Don't query columnWidth when it's not needed, so that width calculation can be delayed
        // for width: auto columns.
        var columnWidth = (columnCount > 1 ? boxInstance.getPropAsNumber(self, "column-width") : layoutContainer.width);
        var regionIds = boxInstance.getActiveRegions(self);
        var computedBlockSize = 0;
        var innerShapeVal = boxInstance.getProp(self, "shape-inside");
        var innerShape = adapt.cssprop.toShape(innerShapeVal, 0, 0,
        		layoutContainer.width, layoutContainer.height, self);
        var layoutContext = new adapt.vgen.ViewFactory(flowNameStr, self,
                self.viewport, self.styler, regionIds, self.xmldoc, self.faces,
                self.style.footnoteProps, self, page, self.customRenderer,
                self.fallbackMap);
        var columnIndex = 0;
        var region = null;
        frame.loopWithFrame(function(loopFrame) {
	        while(columnIndex < columnCount) {
	        	var column = columnIndex++;
	            if (columnCount > 1) {
	                var columnContainer = self.viewport.document.createElement("div");
	                adapt.base.setCSSProperty(columnContainer, "position", "absolute");
	                boxContainer.appendChild(columnContainer);
	                region = new adapt.layout.Column(columnContainer, layoutContext, self.clientLayout);
	                region.vertical = layoutContainer.vertical;
	                region.snapHeight = layoutContainer.snapHeight;
	                region.snapWidth = layoutContainer.snapWidth;
	                if (layoutContainer.vertical) {
		                adapt.base.setCSSProperty(columnContainer, "margin-left", layoutContainer.paddingLeft + "px");
		                adapt.base.setCSSProperty(columnContainer, "margin-right", layoutContainer.paddingRight + "px");
		                var columnY = column * (columnWidth + columnGap) + layoutContainer.paddingTop;
		                region.setHorizontalPosition(0, layoutContainer.width);
		                region.setVerticalPosition(columnY, columnWidth);	                	
	                } else {
		                adapt.base.setCSSProperty(columnContainer, "margin-top", layoutContainer.paddingTop + "px");
		                adapt.base.setCSSProperty(columnContainer, "margin-bottom", layoutContainer.paddingBottom + "px");
		                var columnX = column * (columnWidth + columnGap) + layoutContainer.paddingLeft;
		                region.setVerticalPosition(0, layoutContainer.height);
		                region.setHorizontalPosition(columnX, columnWidth);
	                }
	                region.originX = offsetX + layoutContainer.paddingLeft;
	                region.originY = offsetY + layoutContainer.paddingTop;
	            } else {
	                region = new adapt.layout.Column(boxContainer, layoutContext, self.clientLayout);
	                region.copyFrom(layoutContainer);
	                layoutContainer = region;
	            }
	            region.exclusions = dontApplyExclusions ? [] : exclusions;
	            region.innerShape = innerShape;
	            var lr;
	            if (region.width >= 0) {
	                // region.element.style.outline = "1px dotted green";
	            	/** @type {!adapt.task.Frame.<boolean>} */ var innerFrame = adapt.task.newFrame("inner");
	                self.layoutColumn(region, flowNameStr, regionIds).then(function() {
		                if (region.pageBreakType) {
		                	if (region.pageBreakType != "column") {
		                		// skip remaining columns
		                		columnIndex = columnCount;
		                		if (region.pageBreakType != "region") {
		                			// skip remaining regions
		                			self.pageBreaks[flowNameStr] = true;
		                		}
		                	}
		                }
		                innerFrame.finish(true);
	                });
	                lr = innerFrame.result();
	            } else {
	            	lr = adapt.task.newResult(true);
	            }
	            if (lr.isPending()) {
		            lr.then(function() {
		            	computedBlockSize = Math.max(computedBlockSize, region.computedBlockSize);
		            	loopFrame.continueLoop();
		            });
		            return;
	            } else {
	            	computedBlockSize = Math.max(computedBlockSize, region.computedBlockSize);	            	
	            }
	        }
	        loopFrame.breakLoop();
        }).then(function() {
	        layoutContainer.computedBlockSize = computedBlockSize;
	        boxInstance.finishContainer(self, layoutContainer, page, region, 
	        		columnCount, self.clientLayout);
	        innerFrame.finish(true);
        });
        cont = innerFrame.result();
    } else {
        boxInstance.finishContainer(self, layoutContainer, page, null, 1, self.clientLayout);	    		
    	cont = adapt.task.newResult(true);
    }
    cont.then(function() {
        if (!boxInstance.isAutoHeight || Math.floor(layoutContainer.computedBlockSize) > 0) {
        	if (!dontExclude) {
	            var outerX = layoutContainer.originX + layoutContainer.left;
	            var outerY = layoutContainer.originY + layoutContainer.top;
	            var outerWidth = layoutContainer.getInsetLeft() + layoutContainer.width + layoutContainer.getInsetRight();
	            var outerHeight = layoutContainer.getInsetTop() + layoutContainer.height + layoutContainer.getInsetBottom();
	            var outerShapeProp = boxInstance.getProp(self, "shape-outside");
	            var outerShape = adapt.cssprop.toShape(outerShapeProp, outerX, outerY,
	            		outerWidth, outerHeight, self);
	            if (adapt.base.checkLShapeFloatBug(self.viewport.root)) {
	            	// Simplistic bug workaround: add a copy of the shape translated up.
		            exclusions.push(outerShape.withOffset(0, -1.25 * self.queryUnitSize("em")));
	            }
	            exclusions.push(outerShape);
        	}
        } else if (boxInstance.children.length == 0) {
            parentContainer.removeChild(boxContainer);
            frame.finish(true);
            return;
        }
	    var i = boxInstance.children.length - 1;
	    frame.loop(function() {
	    	while (i >= 0) {
	    		var child = boxInstance.children[i--];
		        var r = self.layoutContainer(page, child, /** @type {HTMLElement} */ (boxContainer),
		             offsetX, offsetY, exclusions);
		        if (r.isPending()) {
		        	return r;
		        }
	    	}
	    	return adapt.task.newResult(false);
	    }).then(function() {
		    frame.finish(true);
	    });
    });
    return frame.result();
};

/**
 * @return {void}
 */
adapt.ops.StyleInstance.prototype.processLinger = function() {
	var pageNumber = this.currentLayoutPosition.page;
    for (var flowName in this.currentLayoutPosition.flowPositions) {
        var flowPosition = this.currentLayoutPosition.flowPositions[flowName];
        for (var i = flowPosition.positions.length - 1; i >= 0; i--) {
            var pos = flowPosition.positions[i];
            if (pos.flowChunk.startPage >= 0 && 
            		pos.flowChunk.startPage + pos.flowChunk.linger - 1 <= pageNumber) {
                flowPosition.positions.splice(i, 1);
            }
        }
    }
};

/**
 * @return {void}
 */
adapt.ops.StyleInstance.prototype.initLingering = function() {
	var pageNumber = this.currentLayoutPosition.page;
    for (var flowName in this.currentLayoutPosition.flowPositions) {
        var flowPosition = this.currentLayoutPosition.flowPositions[flowName];
        for (var i = flowPosition.positions.length - 1; i >= 0; i--) {
            var pos = flowPosition.positions[i];
            if (pos.flowChunk.startPage < 0 && pos.flowChunk.startOffset < this.lookupOffset) {
            	pos.flowChunk.startPage = pageNumber;
            }
        }
    }
};

/**
 * @param {adapt.vtree.LayoutPosition} cp
 * @return {boolean}
 */
adapt.ops.StyleInstance.prototype.noMorePrimaryFlows = function(cp) {
	for (var flowName in this.primaryFlows) {
		var flowPosition = cp.flowPositions[flowName];
		if (flowPosition && flowPosition.positions.length > 0) {
			return false;
		}
	}
	return true;
};

/**
 * @param {adapt.vtree.Page} page
 * @param {adapt.vtree.LayoutPosition|undefined} cp
 * @return {adapt.task.Result.<adapt.vtree.LayoutPosition>}
 */
adapt.ops.StyleInstance.prototype.layoutNextPage = function(page, cp) {
	var self = this;
	self.pageBreaks = {};
    if (cp) {
        self.currentLayoutPosition = cp.clone();
        self.styler.replayFlowElementsFromOffset(cp.highestSeenOffset);
    } else {
        self.currentLayoutPosition = new adapt.vtree.LayoutPosition();
        self.styler.replayFlowElementsFromOffset(-1);
    }
    if (this.lang) {
    	page.container.setAttribute("lang", this.lang);
    }
    cp = self.currentLayoutPosition;
    cp.page++;
    self.clearScope(self.style.pageScope);
    var pageMaster = self.selectPageMaster();
    if (!pageMaster) {
    	// end of primary content
    	return adapt.task.newResult(/** @type {adapt.vtree.LayoutPosition}*/ (null));
    }
    /** @type {!adapt.task.Frame.<adapt.vtree.LayoutPosition>} */ var frame
    	= adapt.task.newFrame("layoutNextPage");
    self.layoutContainer(page, pageMaster, page.container, 0, 0, []).then(function() {
	    self.processLinger();
	    self.currentLayoutPosition = null;
	    cp.highestSeenOffset = self.styler.getReachedOffset();
        var triggers = self.style.store.getTriggersForDoc(self.xmldoc);
	    page.finish(triggers);
	    if (self.noMorePrimaryFlows(cp)) {
	    	cp = null;
	    }
	    frame.finish(cp);
    });
    return frame.result();
};

/**
 * @param {adapt.ops.StyleParserHandler} masterHandler
 * @param {adapt.expr.Val} condition
 * @param {adapt.ops.BaseParserHandler} parent
 * @param {?string} regionId
 * @constructor
 * @extends {adapt.csscasc.CascadeParserHandler}
 */
adapt.ops.BaseParserHandler = function(masterHandler, condition, parent, regionId) {
	adapt.csscasc.CascadeParserHandler.call(this, masterHandler.rootScope, masterHandler,
			condition, parent, regionId, masterHandler.validatorSet, !parent);
    /** @type {adapt.ops.StyleParserHandler} */ this.masterHandler = masterHandler;
    /** @type {boolean} */ this.insideRegion = false;
};
goog.inherits(adapt.ops.BaseParserHandler, adapt.csscasc.CascadeParserHandler);

/**
 * @override
 */
adapt.ops.BaseParserHandler.prototype.startPageTemplateRule = function() {
    // override, so we don't register an error
};

/**
 * @override
 */
adapt.ops.BaseParserHandler.prototype.startPageMasterRule = function(name, pseudoName, classes) {
    var pageMaster = new adapt.pm.PageMaster(this.masterHandler.pageScope, name, pseudoName,
    		classes, this.masterHandler.rootBox, this.condition, this.owner.getBaseSpecificity());
    this.masterHandler.pushHandler(new adapt.pm.PageMasterParserHandler(pageMaster.scope,
    		this.masterHandler, pageMaster, this.validatorSet));
};

/**
 * @override
 */
adapt.ops.BaseParserHandler.prototype.startWhenRule = function(conditionVal) {
    var condition = conditionVal.expr;
    if (this.condition != null)
        condition = adapt.expr.and(this.scope, this.condition, condition);
    this.masterHandler.pushHandler(new adapt.ops.BaseParserHandler(
    		this.masterHandler, condition, this, this.regionId));
};

/**
 * @override
 */
adapt.ops.BaseParserHandler.prototype.startDefineRule = function() {
    this.masterHandler.pushHandler(new adapt.csscasc.DefineParserHandler(
    		this.scope, this.owner));
};

/**
 * @override
 */
adapt.ops.BaseParserHandler.prototype.startFontFaceRule = function() {
	var properties = /** @type {adapt.csscasc.ElementStyle} */ ({});
	this.masterHandler.fontFaces.push({properties: properties, condition: this.condition});
    this.masterHandler.pushHandler(new adapt.csscasc.PropSetParserHandler(
    		this.scope, this.owner, null, properties, this.masterHandler.validatorSet));
};

/**
 * @override
 */
adapt.ops.BaseParserHandler.prototype.startFlowRule = function(flowName) {
	var style = this.masterHandler.flowProps[flowName];
	if (!style) {
		style = /** @type {adapt.csscasc.ElementStyle} */ ({});
		this.masterHandler.flowProps[flowName] = style;
	}
    this.masterHandler.pushHandler(new adapt.csscasc.PropSetParserHandler(
    		this.scope, this.owner, null, style,
    		this.masterHandler.validatorSet));
};

/**
 * @override
 */
adapt.ops.BaseParserHandler.prototype.startViewportRule = function() {
	var viewportProps = /** @type {adapt.csscasc.ElementStyle} */ ({});
	this.masterHandler.viewportProps.push(viewportProps);
    this.masterHandler.pushHandler(new adapt.csscasc.PropSetParserHandler(
    		this.scope, this.owner, this.condition, viewportProps,
    		this.masterHandler.validatorSet));
};

/**
 * @override
 */
adapt.ops.BaseParserHandler.prototype.startFootnoteRule = function(pseudoelement) {
	var style = this.masterHandler.footnoteProps;
	if (pseudoelement) {
		var pseudos = adapt.csscasc.getMutableStyleMap(style, "_pseudos");
        style = pseudos[pseudoelement];
        if (!style) {
            style = /** @type {adapt.csscasc.ElementStyle} */ ({});
            pseudos[pseudoelement] = style;
        }		
	}
    this.masterHandler.pushHandler(new adapt.csscasc.PropSetParserHandler(
    		this.scope, this.owner, null, style,
    		this.masterHandler.validatorSet));
};

/**
 * @override
 */
adapt.ops.BaseParserHandler.prototype.startRegionRule = function() {
    this.insideRegion = true;
    this.startSelectorRule();
};

/**
 * @override
 */
adapt.ops.BaseParserHandler.prototype.startPageRule = function() {
    var pageHandler = new vivliostyle.page.PageParserHandler(this.masterHandler.pageScope,
        this.masterHandler, this, this.validatorSet);
    this.masterHandler.pushHandler(pageHandler);
    pageHandler.startSelectorRule();
};

/**
 * @override
 */
adapt.ops.BaseParserHandler.prototype.startRuleBody = function() {
    adapt.csscasc.CascadeParserHandler.prototype.startRuleBody.call(this);
    if (this.insideRegion) {
        this.insideRegion = false;
        var regionId = "R" + this.masterHandler.regionCount++;
        this.special("region-id", adapt.css.getName(regionId));
        this.endRule();
        var regionHandler = new adapt.ops.BaseParserHandler(this.masterHandler, this.condition, 
        		this, regionId);
        this.masterHandler.pushHandler(regionHandler);
        regionHandler.startRuleBody();
    }
};


/**
 * @param {Element} meta
 * @return {string}
 */
adapt.ops.processViewportMeta = function(meta) {
	var content = meta.getAttribute("content");
	if (!content) {
		return "";
	}
	var vals = {};
	var r;
	while ((r = content.match(/^,?\s*([-A-Za-z_.][-A-Za-z_0-9.]*)\s*=\s*([-+A-Za-z_0-9.]*)\s*/)) != null) {
		content = content.substr(r[0].length);
		vals[r[1]] = r[2];
	}
	var width = vals["width"] - 0;
	var height = vals["height"] - 0;
	if (width && height) {
		return "@-epubx-viewport{width:" + width + "px;height:" + height + "px;}";
	}
	return "";
};


/**
 * @param {adapt.cssvalid.ValidatorSet} validatorSet
 * @constructor
 * @extends {adapt.cssparse.DispatchParserHandler}
 */
adapt.ops.StyleParserHandler = function(validatorSet) {
	adapt.cssparse.DispatchParserHandler.call(this);
	/** @const */ this.validatorSet = validatorSet;
    /** @const */ this.rootScope = new adapt.expr.LexicalScope(null);
    /** @const */ this.pageScope = new adapt.expr.LexicalScope(this.rootScope);
    /** @const */ this.rootBox = new adapt.pm.RootPageBox(this.rootScope);
    /** @const */ this.cascadeParserHandler =
    	new adapt.ops.BaseParserHandler(this, null, null, null);
    /** @type {number} */ this.regionCount = 0;
	/** @const */ this.fontFaces = /** @type {Array.<adapt.ops.FontFace>} */ ([]);
	/** @const */ this.footnoteProps = /** @type {adapt.csscasc.ElementStyle} */ ({});
	/** @const */ this.flowProps = /** @type {Object.<string,adapt.csscasc.ElementStyle>} */ ({});
	/** @const */ this.viewportProps = /** @type {Array.<adapt.csscasc.ElementStyle>} */ ([]);

    this.slave = this.cascadeParserHandler;
};
goog.inherits(adapt.ops.StyleParserHandler, adapt.cssparse.DispatchParserHandler);

/**
 * @override
 */
adapt.ops.StyleParserHandler.prototype.error = function(mnemonics, token) {
    adapt.base.log("CSS parser: " + mnemonics);
};

/**
 * @typedef {{
 * 		url: string,
 * 		text: ?string,
 *      flavor: adapt.cssparse.StylesheetFlavor,
 *      classes: ?string,
 *      media: ?string
 * }}
 */
adapt.ops.StyleSource;

/**
 * @param {adapt.net.Response} response
 * @param {adapt.xmldoc.XMLDocStore} store
 * @return {!adapt.task.Result.<!adapt.xmldoc.XMLDocHolder>}
 */
adapt.ops.parseOPSResource = function(response, store) {
	return (/** @type {adapt.ops.OPSDocStore} */ (store)).parseOPSResource(response);
};

/**
 * @param {?function(string):?function(Blob):adapt.task.Result.<Blob>} fontDeobfuscator
 * @constructor
 * @extends {adapt.xmldoc.XMLDocStore}
 */
adapt.ops.OPSDocStore = function(fontDeobfuscator) {
	adapt.net.ResourceStore.call(this, adapt.ops.parseOPSResource, false);
	/** @type {?function(string):?function(Blob):adapt.task.Result.<Blob>} */ this.fontDeobfuscator = fontDeobfuscator;
	/** @type {Object.<string,adapt.ops.Style>} */ this.styleByKey = {};
	/** @type {Object.<string,adapt.taskutil.Fetcher.<adapt.ops.Style>>} */ this.styleFetcherByKey = {};
	/** @type {Object.<string,adapt.ops.Style>} */ this.styleByDocURL = {};
	/** @type {Object.<string,Array.<adapt.vtree.Trigger>>} */ this.triggersByDocURL = {};
	/** @type {adapt.cssvalid.ValidatorSet} */ this.validatorSet = null;
};
goog.inherits(adapt.ops.OPSDocStore, adapt.net.ResourceStore);

/**
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.ops.OPSDocStore.prototype.init = function() {
    var userAgentXML = adapt.base.resolveURL("user-agent.xml", adapt.base.resourceBaseURL);
    var frame = adapt.task.newFrame("OPSDocStore.init");
	var self = this;
    adapt.cssvalid.loadValidatorSet().then(function(validatorSet) {
    	self.validatorSet = validatorSet;
    	adapt.csscasc.loadUABase().then(function() {
    		self.load(userAgentXML).then(function() {
    			frame.finish(true);
    		});
    	});
    });
    return frame.result();
};

/**
 * @param {adapt.xmldoc.XMLDocHolder} xmldoc
 * @return {adapt.ops.Style}
 */
adapt.ops.OPSDocStore.prototype.getStyleForDoc = function(xmldoc) {
	return this.styleByDocURL[xmldoc.url];
};

/**
 * @param {adapt.xmldoc.XMLDocHolder} xmldoc
 * @return {Array.<adapt.vtree.Trigger>}
 */
adapt.ops.OPSDocStore.prototype.getTriggersForDoc = function(xmldoc) {
	return this.triggersByDocURL[xmldoc.url];
};

/**
 * @param {adapt.net.Response} response
 * @return {!adapt.task.Result.<!adapt.xmldoc.XMLDocHolder>}
 */
adapt.ops.OPSDocStore.prototype.parseOPSResource = function(response) {
    /** @type {!adapt.task.Frame.<!adapt.xmldoc.XMLDocHolder>} */ var frame
    	= adapt.task.newFrame("OPSDocStore.load");
	var self = this;
	var url = response.url;
	adapt.xmldoc.parseXMLResource(response, self).then(function(xmldoc) {
		var triggers = [];
		var triggerList = xmldoc.document.getElementsByTagNameNS(adapt.base.NS.epub, "trigger");
		for (var i = 0; i < triggerList.length; i++) {
			var triggerElem = triggerList[i];
			var observer = triggerElem.getAttributeNS(adapt.base.NS.EV, "observer");
			var event = triggerElem.getAttributeNS(adapt.base.NS.EV, "event");
			var action = triggerElem.getAttribute("action");
			var ref = triggerElem.getAttribute("ref");
			if (observer && event && action && ref) {
				triggers.push({observer:observer, event:event, action:action, ref:ref});
			}
		}
    	self.triggersByDocURL[url] = triggers;
		var sources = /** @type {Array.<adapt.ops.StyleSource>} */ ([]);
	    var userAgentURL = adapt.base.resolveURL("user-agent-page.css", adapt.base.resourceBaseURL);
		sources.push({url: userAgentURL, text:null,
			flavor:adapt.cssparse.StylesheetFlavor.USER_AGENT, classes: null, media: null});
	    var head = xmldoc.head;
	    if (head) {
	        for (var c = head.firstChild ; c ; c = c.nextSibling) {
	        	if (c.nodeType != 1)
	        		continue;
	        	var child = /** @type {Element} */ (c);
	        	var ns = child.namespaceURI;
	        	var localName = child.localName;
	        	if (ns == adapt.base.NS.XHTML) {
		            if (localName == "style") {
		                sources.push({url:url, text:child.textContent, 
		                	flavor:adapt.cssparse.StylesheetFlavor.AUTHOR, classes: null, media: null});
		            } else if (localName == "link") {
		            	var rel = child.getAttribute("rel");
		            	var classes = child.getAttribute("class");
		            	var media = child.getAttribute("media");
		            	if (rel == "stylesheet" || (rel == "alternate stylesheet" && classes)) {
			            	var src = child.getAttribute("href");
			            	src = adapt.base.resolveURL(src, url);
			            	sources.push({url:src, text:null, classes: classes, media: media,
			            		flavor:adapt.cssparse.StylesheetFlavor.AUTHOR});
		            	}
		            } else if (localName == "meta" && child.getAttribute("name") == "viewport") {
		            	sources.push({url:url, text: adapt.ops.processViewportMeta(child),
		            		flavor:adapt.cssparse.StylesheetFlavor.AUTHOR, condition: null, media: null});
		            }
	        	} else if (ns == adapt.base.NS.FB2) {
		            if (localName == "stylesheet" && child.getAttribute("type") == "text/css") {
		                sources.push({url:url, text:child.textContent, 
		                	flavor:adapt.cssparse.StylesheetFlavor.AUTHOR, classes: null, media: null});
		            }        		
	        	} else if (ns == adapt.base.NS.SSE && localName === "property") {
                    // look for stylesheet specification like:
                    // <property><name>stylesheet</name><value>style.css</value></property>
                    var name = child.getElementsByTagName("name")[0];
                    if (name && name.textContent === "stylesheet") {
                        var value = child.getElementsByTagName("value")[0];
                        if (value) {
                            var src = adapt.base.resolveURL(value.textContent, url);
                            sources.push({
                                url: src, text: null, classes: null, media: null,
                                flavor: adapt.cssparse.StylesheetFlavor.AUTHOR
                            });
                        }
                    }
                }
	        }
	    }
	    var key = "";
	    for (var i = 0; i < sources.length; i++) {
	    	key += sources[i].url;
	    	key += "^";
	    	if (sources[i].text) {
	    		key += sources[i].text;
	    	}
	    	key += "^";
	    }
	    var style = self.styleByKey[key];
	    if (style) {
	    	self.styleByDocURL[url] = style;
	    	frame.finish(xmldoc);
	    	return;
	    }
		var fetcher = self.styleFetcherByKey[key];
		if (!fetcher) {
			fetcher = new adapt.taskutil.Fetcher(function() {
				/** @type {!adapt.task.Frame.<adapt.ops.Style>} */ var innerFrame
					= adapt.task.newFrame("fetchStylesheet");
		    	var index = 0;
		    	var sph = new adapt.ops.StyleParserHandler(self.validatorSet);
		    	innerFrame.loop(function() {
		            if (index < sources.length) {
		                var source = sources[index++];
		                sph.startStylesheet(source.flavor);
		                if (source.text) {
		                    return adapt.cssparse.parseStylesheetFromText(source.text, sph, source.url, source.classes, source.media);
		                } else {
		                    return adapt.cssparse.parseStylesheetFromURL(source.url, sph, source.classes, source.media);
		                }
		            }
		            return adapt.task.newResult(false);
		        }).then(function() {
		        	var cascade = sph.cascadeParserHandler.finish();
		        	style = new adapt.ops.Style(self, sph.rootScope, sph.pageScope, cascade, sph.rootBox,
		        			sph.fontFaces, sph.footnoteProps, sph.flowProps, sph.viewportProps);
			    	self.styleByKey[key] = style;
			    	delete self.styleFetcherByKey[key];
		        	innerFrame.finish(style);
		        });
		    	return innerFrame.result();
			}, "FetchStylesheet " + url);
			self.styleFetcherByKey[key] = fetcher;
	        fetcher.start();
		}
		fetcher.get().then(function(style) {
	    	self.styleByDocURL[url] = style;
			frame.finish(xmldoc);			
		});
	});
    return frame.result();
};

