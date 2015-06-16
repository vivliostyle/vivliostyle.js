/**
 * Copyright 2013 Google, Inc.
 * Copyright 2015 Vivliostyle Inc.
 * @fileoverview View tree generator.
 */
goog.provide('adapt.vgen');

goog.require('adapt.task');
goog.require('adapt.taskutil');
goog.require('adapt.css');
goog.require('adapt.csscasc');
goog.require('adapt.cssstyler');
goog.require('adapt.vtree');
goog.require('adapt.xmldoc');
goog.require('adapt.font');


/**
 * @private
 * @const
 * @type {!Object.<string,string>}
 */
adapt.vgen.frontEdgeBlackListHor = {
    "text-indent": "0px",
    "margin-top": "0px",
    "padding-top": "0px",
    "border-top-width": "0px",
    "border-top-style": "none",
    "border-top-color": "transparent"
};

/**
 * @private
 * @const
 * @type {!Object.<string,string>}
 */
adapt.vgen.frontEdgeBlackListVert = {
    "text-indent": "0px",
    "margin-right": "0px",
    "padding-right": "0px",
    "border-right-width": "0px",
    "border-right-style": "none",
    "border-right-color": "transparent"
};


/**
 * Function taking source element, parent view node and CSS properties and returning
 * Result holding view element.
 * @typedef function(Element,Element,Object.<string,adapt.css.Val>):!adapt.task.Result.<Element>
 */
adapt.vgen.CustomRenderer;

/**
 * @interface
 */
adapt.vgen.CustomRendererFactory = function() {};

/**
 * @param {adapt.xmldoc.XMLDocHolder} xmldoc
 * @return {adapt.vgen.CustomRenderer}
 */
adapt.vgen.CustomRendererFactory.prototype.makeCustomRenderer = function(xmldoc) {};


/**
 * @type {Object.<string,string>}
 */
adapt.vgen.namespacePrefixMap = {};


/**
 * Creates an epubReadingSystem object in the iframe.contentWindow.navigator when
 * load event fires.
 * @param {HTMLIFrameElement} iframe
 */
adapt.vgen.initIFrame = function(iframe) {
	iframe.addEventListener("load", function() {
		iframe.contentWindow.navigator["epubReadingSystem"] = {
			"name": "adapt",
			"version": "0.1",
			"layoutStyle": "paginated",
			"hasFeature": function(name, version) {
				switch(name) {
				case "mouse-events":
					return true;
				}
				return false;
			}
		};
	}, false);
};

/**
 * @interface
 */
adapt.vgen.StylerProducer = function() {};

/**
 * @param {adapt.xmldoc.XMLDocHolder} xmldoc
 * @return {adapt.cssstyler.AbstractStyler}
 */
adapt.vgen.StylerProducer.prototype.getStylerForDoc = function(xmldoc) {};


adapt.vgen.pseudoelementDoc = (new DOMParser()).parseFromString(
		'<root xmlns="' + adapt.base.NS.SHADOW + '"/>', "text/xml");

/**
 * Pseudoelement names in the order they should be inserted in the shadow DOM, empty string
 * is the place where the element's DOM children are processed.
 * @const
 */
adapt.vgen.pseudoNames = ["footnote-marker", "first-5-lines", "first-4-lines",
                          "first-3-lines", "first-2-lines", "first-line", "first-letter", "before",
                             "" /* content */, "after"];


/**
 * @param {Element} element
 * @param {adapt.csscasc.ElementStyle} style
 * @param {adapt.cssstyler.AbstractStyler} styler
 * @param {adapt.expr.Context} context
 * @constructor
 * @implements {adapt.cssstyler.AbstractStyler}
 */
adapt.vgen.PseudoelementStyler = function(element, style, styler, context) {
	/** @type {adapt.csscasc.ElementStyle} */ this.style = style;
	/** @const */ this.element = element;
	/** @type {adapt.cssstyler.AbstractStyler} */ this.styler = styler;
	/** @const */ this.context = context;
	/** @type {Object.<string,boolean>} */ this.contentProcessed = {};
};

/**
 * @override
 */
adapt.vgen.PseudoelementStyler.prototype.getStyle = function(element, deep) {
	var className = element.getAttribute("class") || "";
	if (this.styler && className && className.match(/after$/)) {
		// after content: update style
		this.style = this.styler.getStyle(this.element, true);
		this.styler = null;
	}
    var pseudoMap = adapt.csscasc.getStyleMap(this.style, "_pseudos");
	var style = pseudoMap[className] || /** @type {adapt.csscasc.ElementStyle} */ ({});
	if (!this.contentProcessed[className]) {
		this.contentProcessed[className] = true;
	    var content = style["content"];
	    if (content) {
	    	var contentVal = content.evaluate(this.context);
	    	if (adapt.vtree.nonTrivialContent(contentVal))
	    		contentVal.visit(new adapt.vtree.ContentPropertyHandler(element));
	    }    	
	}
	if (className.match(/^first-/) && !style["x-first-pseudo"]) {
		var nest = 1;
		var r;
		if (className == "first-letter") {
			nest = 0;
		} else if ((r = className.match(/^first-([0-9]+)-lines$/)) != null) {
			nest = r[1] - 0;
		}
		style["x-first-pseudo"] = new adapt.csscasc.CascadeValue(new adapt.css.Int(nest), 0);
	}
	return style;
};


/**
 * @param {string} flowName
 * @param {adapt.expr.Context} context
 * @param {adapt.vgen.Viewport} viewport
 * @param {adapt.cssstyler.Styler} styler
 * @param {Array.<string>} regionIds
 * @param {adapt.xmldoc.XMLDocHolder} xmldoc
 * @param {adapt.font.DocumentFaces} docFaces
 * @param {adapt.csscasc.ElementStyle} footnoteStyle
 * @param {adapt.vgen.StylerProducer} stylerProducer
 * @param {adapt.vtree.Page} page
 * @param {adapt.vgen.CustomRenderer} customRenderer
 * @param {Object.<string,string>} fallbackMap
 * @constructor
 * @implements {adapt.vtree.LayoutContext}
 */
adapt.vgen.ViewFactory = function(flowName, context, viewport, styler, regionIds,
		xmldoc, docFaces, footnoteStyle, stylerProducer, page, customRenderer, fallbackMap) {
	// from constructor parameters
	/** @const */ this.flowName = flowName;
	/** @const */ this.context = context;
	/** @const */ this.viewport = viewport;
	/** @const */ this.document = viewport.document;
	/** @const */ this.styler = styler;
	/** @const */ this.regionIds = regionIds;
	/** @const */ this.xmldoc = xmldoc;
	/** @const */ this.docFaces = docFaces;
	/** @const */ this.footnoteStyle = footnoteStyle;
	/** @const */ this.stylerProducer = stylerProducer;
	/** @const */ this.page = page;
	/** @const */ this.customRenderer = customRenderer;
	/** @const */ this.fallbackMap = fallbackMap;
	
    // provided by layout
	/** @type {adapt.vtree.NodeContext} */ this.nodeContext = null;
	/** @type {Element} */ this.viewRoot = null;
	/** @type {boolean} */ this.isFootnote = false;
    /** @type {Node} */ this.sourceNode = null;
    /** @type {number} */ this.offsetInNode = 0;

    // computed
    // TODO: only set it on NodeContext
    /** @type {Node} */ this.viewNode = null;
};

/**
 * @override
 */
adapt.vgen.ViewFactory.prototype.clone = function() {
	return new adapt.vgen.ViewFactory(this.flowName, this.context, this.viewport,
		this.styler, this.regionIds,
		this.xmldoc, this.docFaces, this.footnoteStyle, this.stylerProducer,
		this.page, this.customRenderer, this.fallbackMap);
};

/**
 * @param {Element} element
 * @param {boolean} isRoot
 * @param {adapt.csscasc.ElementStyle} cascStyle
 * @param {Object.<string,adapt.css.Val>} computedStyle
 * @param {adapt.cssstyler.AbstractStyler} styler
 * @param {adapt.expr.Context} context
 * @param {adapt.vtree.ShadowContext} parentShadow
 * @param {adapt.vtree.ShadowContext} subShadow
 * @return {adapt.vtree.ShadowContext}
 */
adapt.vgen.ViewFactory.prototype.createPseudoelementShadow = function(element, isRoot, 
		cascStyle, computedStyle, styler, context, parentShadow, subShadow) {
    var pseudoMap = adapt.csscasc.getStyleMap(cascStyle, "_pseudos");
    if (!pseudoMap) {
    	return subShadow;
    }
	var root = adapt.vgen.pseudoelementDoc.createElementNS(adapt.base.NS.SHADOW, "root");
	var att = root;
    for (var i = 0; i < adapt.vgen.pseudoNames.length; i++) {
    	var name = adapt.vgen.pseudoNames[i];
    	var elem;
    	if (name) {
    		if (!pseudoMap[name]) {
    			continue;
    		}
    		if (name == "footnote-marker" && !(isRoot && this.isFootnote)) {
    			continue;
    		}
        	if (name.match(/^first-/)) {
        		var display = computedStyle["display"];
        		if (!display || display === adapt.css.ident.inline) {
        			continue;
        		}
        	}
    		elem = adapt.vgen.pseudoelementDoc.createElementNS(adapt.base.NS.XHTML, "span");
    		elem.setAttribute("class", name);
    	} else {
    		elem = adapt.vgen.pseudoelementDoc.createElementNS(adapt.base.NS.SHADOW, "content");
    	}
    	att.appendChild(elem);
    	if (name.match(/^first-/)) {
    		att = elem;
    	}
    }
    var shadowStyler = new adapt.vgen.PseudoelementStyler(element, cascStyle, styler, context);
    return new adapt.vtree.ShadowContext(element, root, null, parentShadow, 
    		subShadow, adapt.vtree.ShadowType.ROOTLESS, shadowStyler);
};

/**
 * @param {string} href
 * @param {Element} element
 * @param {adapt.vtree.ShadowContext} parentShadow
 * @param {adapt.vtree.ShadowContext} subShadow
 * @return {adapt.task.Result.<adapt.vtree.ShadowContext>}
 */
adapt.vgen.ViewFactory.prototype.createRefShadow = function(href, type, element, parentShadow, subShadow) {
	var self = this;
	/** @type {!adapt.task.Frame.<adapt.vtree.ShadowContext>} */ var frame
		= adapt.task.newFrame("createRefShadow");
	self.xmldoc.store.load(href).then(function(refDocParam) {
		var refDoc = /** @type {adapt.xmldoc.XMLDocHolder} */ (refDocParam);
		if (refDoc) {
			var refElement = refDoc.getElement(href);
			if (refElement) {
				var refStyler = self.stylerProducer.getStylerForDoc(refDoc);
				subShadow = new adapt.vtree.ShadowContext(element, refElement, refDoc, parentShadow, 
			    		subShadow, type, refStyler);
			}
		}
		frame.finish(subShadow);
	});
	return frame.result();
};

/**
 * @param {Element} element
 * @param {adapt.csscasc.ElementStyle} cascStyle
 * @param {Object.<string,adapt.css.Val>} computedStyle
 * @param {adapt.cssstyler.AbstractStyler} styler
 * @param {adapt.expr.Context} context
 * @param {adapt.vtree.ShadowContext} shadowContext
 * @return {adapt.task.Result.<adapt.vtree.ShadowContext>}
 */
adapt.vgen.ViewFactory.prototype.createShadows = function(element, isRoot, cascStyle,
		computedStyle, styler, context, shadowContext) {
	var self = this;
	/** @type {!adapt.task.Frame.<adapt.vtree.ShadowContext>} */ var frame
		= adapt.task.newFrame("createShadows");
	var shadow = null;
	var templateURLVal = computedStyle["template"];
	var cont;
	if (templateURLVal instanceof adapt.css.URL) {
		var url = (/** @type {adapt.css.URL} */ (templateURLVal)).url;
		cont = self.createRefShadow(url, adapt.vtree.ShadowType.ROOTLESS,
				element, shadowContext, shadow);			
	} else {
		cont = adapt.task.newResult(shadow);
	}
	cont.then(function(shadow) {
		var cont1 = null;
		if (element.namespaceURI == adapt.base.NS.SHADOW) {
			if (element.localName == "include") {
				var href = element.getAttribute("href");
				var xmldoc = null;
				if (href) {
					xmldoc = shadowContext ? shadowContext.xmldoc : self.xmldoc;
				} else if (shadowContext) {
					if (shadowContext.owner.namespaceURI == adapt.base.NS.XHTML)
						href = shadowContext.owner.getAttribute("href");
					else
						href = shadowContext.owner.getAttributeNS(adapt.base.NS.XLINK, "href");
					xmldoc = shadowContext.parentShadow ? shadowContext.parentShadow.xmldoc : self.xmldoc;
				}
				if (href) {
					href = adapt.base.resolveURL(href, xmldoc.url);
					cont1 = self.createRefShadow(href, adapt.vtree.ShadowType.ROOTED, 
							element, shadowContext, shadow);
				}
			}
		}
		if (cont1 == null)
			cont1 = adapt.task.newResult(shadow);
		cont1.then(function(shadow) {
			shadow = self.createPseudoelementShadow(element, isRoot, cascStyle, computedStyle,
					styler, context, shadowContext, shadow);
			frame.finish(shadow);
		});
	});
	return frame.result();
};

/**
 * @override
 */
adapt.vgen.ViewFactory.prototype.setViewRoot = function(viewRoot, isFootnote) {
	this.viewRoot = viewRoot;
	this.isFootnote = isFootnote;
};

/**                            
 * @param {boolean} vertical                                                                                                          
 * @param {adapt.csscasc.ElementStyle} style                                                                                             
 * @param {!Object.<string,adapt.css.Val>} computedStyle
 * @return {boolean} vertical                                                                                                                        
 */
adapt.vgen.ViewFactory.prototype.computeStyle = function(vertical, style, computedStyle) {
    var context = this.context;
    var cascMap = adapt.csscasc.flattenCascadedStyle(style, context, this.regionIds, this.isFootnote);
    vertical = adapt.csscasc.isVertical(cascMap, context, vertical);
    var self = this;
    adapt.csscasc.convertToPhysical(cascMap, computedStyle, vertical, function(name, cascVal) {
        var value = cascVal.evaluate(context, name);
        if (name == "font-family") {
            value = self.docFaces.filterFontFamily(value);
        }
        return value;
    });
    return vertical;
};

/**
 * @private
 * @param {adapt.csscasc.ElementStyle} elementStyle
 * @return {adapt.csscasc.ElementStyle}
 */
adapt.vgen.ViewFactory.prototype.inheritFromSourceParent = function(elementStyle) {
	var node = this.nodeContext.sourceNode;
	var styles = [];
	// TODO: this is hacky. We need to recover the path through the shadow trees, but we do not
	// have the full shadow tree structure at this point. This code handles coming out of the
	// shadow trees, but does not go back in (through shadow:content element).
	var shadowContext = this.nodeContext.shadowContext;
	while (node && node.nodeType == 1) {
		var shadowRoot = shadowContext && shadowContext.root == node;
		if (!shadowRoot || shadowContext.type == adapt.vtree.ShadowType.ROOTLESS) {
		    var styler = shadowContext ? 
		    		/** @type {adapt.cssstyler.AbstractStyler} */ (shadowContext.styler) : this.styler;	
			var nodeStyle = styler.getStyle(/** @type {Element} */ (node), false);
			styles.push(nodeStyle);
		}
		if (shadowRoot) {
			node = shadowContext.owner;
			shadowContext = shadowContext.parentShadow;
		} else {
			node = node.parentNode;
		}
	}
	var fontSize = this.context.queryUnitSize("em");
	var props = /** @type {adapt.csscasc.ElementStyle} */
		({"font-size": new adapt.csscasc.CascadeValue(new adapt.css.Numeric(fontSize, "px"), 0)});
	var inheritanceVisitor = new adapt.csscasc.InheritanceVisitor(props, this.context);
	for (var i = styles.length - 1; i >= 0; --i) {
		var style = styles[i];
		var propList = [];
		for (var propName in style) {
			if (adapt.csscasc.isInherited(propName)) {
				propList.push(propName);
			}
		}
		propList.sort(adapt.css.processingOrderFn);
		for (var k = 0; k < propList.length; k++) {
			var name = propList[k];
			inheritanceVisitor.setPropName(name);
			props[name] = adapt.csscasc.getProp(style, name).filterValue(inheritanceVisitor);
		}
	}
	for (var sname in elementStyle) {
		if (!adapt.csscasc.isInherited(sname)) {
			props[sname] = elementStyle[sname];
		}
	}
	return props;
};

adapt.vgen.fb2Remap = {
	"a": "a",
	"sub": "sub",
	"sup": "sup",
	"table": "table",
	"tr": "tr",
	"td": "td",
	"th": "th",
	"code": "code",
	"body": "div",
	"p": "p",
	"v": "p",
	"date": "p",
	"emphasis": "em",
	"strong": "strong",
	"style": "span",
	"strikethrough": "del"
};

/**
 * @param {string} url
 * @return {string}
 */
adapt.vgen.ViewFactory.prototype.resolveURL = function(url) {
    url = adapt.base.resolveURL(url, this.xmldoc.url);
    return this.fallbackMap[url] || url;
};

/**
 * @param {boolean} firstTime
 * @private
 * @return {!adapt.task.Result.<boolean>} holding true if children should be processed
 */
adapt.vgen.ViewFactory.prototype.createElementView = function(firstTime) {
	var self = this;
	var needToProcessChildren = true;
	/** @type {!adapt.task.Frame.<boolean>} */ var frame
		= adapt.task.newFrame("createElementView");
	// Figure out element's styles
    var element = /** @type {Element} */ (self.sourceNode);
    var styler = self.nodeContext.shadowContext ? 
    		/** @type {adapt.cssstyler.AbstractStyler} */ (self.nodeContext.shadowContext.styler) : self.styler;
    var elementStyle = styler.getStyle(element, false);
    var computedStyle = {};
    if (!self.nodeContext.parent) {
    	elementStyle = self.inheritFromSourceParent(elementStyle);
    }
    self.nodeContext.vertical = self.computeStyle(self.nodeContext.vertical, elementStyle, computedStyle);
    // Sort out the properties
    var flow = computedStyle["flow-into"];
    if (flow && flow.toString() != self.flowName) {
        // foreign flow, don't create a view
    	frame.finish(false);
    	return frame.result();
    }
    // var position = computedStyle["position"]; // TODO: take it into account
    var display = computedStyle["display"];
    if (display === adapt.css.ident.none) {
        // no content
    	frame.finish(false);
    	return frame.result();
    }
    self.createShadows(element, self.nodeContext.parent == null, elementStyle, computedStyle, styler,
    		self.context, self.nodeContext.shadowContext).then(function(shadowParam) {
    	self.nodeContext.nodeShadow = shadowParam;    			
	    var inFloatContainer = self.nodeContext.parent && self.nodeContext.parent.floatContainer;
	    var floatSide = computedStyle["float"];
	    var clearSide = computedStyle["clear"];
	    if (computedStyle["position"] === adapt.css.ident.absolute || 
	    		computedStyle["position"] === adapt.css.ident.relative) {
	    	self.nodeContext.floatContainer = true;
	    	floatSide = null;
	    }
	    if (inFloatContainer) {
	    	clearSide = null;
	    	if (floatSide !== adapt.css.ident.footnote) {
	    		floatSide = null;
	    	}
	    }
	    var floating = floatSide === adapt.css.ident.left || 
	    	floatSide === adapt.css.ident.right || floatSide === adapt.css.ident.footnote;
	    if (floatSide) {
	    	// Don't want to set it in view DOM CSS.
	    	delete computedStyle["float"];
		    if (floatSide === adapt.css.ident.footnote) {
		    	if (self.isFootnote) {
		    		// No footnotes inside footnotes. self is most likely the root of the
		    		// footnote body being rendered in footnote area. Treat as block.
		    		floating = false;
		    		computedStyle["display"] = adapt.css.ident.block;
		    	} else {
			        computedStyle["display"] = adapt.css.ident.inline;
		    	}
		    }
		    self.nodeContext.floatContainer = true;
	    }
	    if (clearSide) {
	    	if (clearSide === adapt.css.ident.inherit) {
	    		if (self.nodeContext.parent && self.nodeContext.parent.clearSide) {
	    			clearSide = adapt.css.getName(self.nodeContext.parent.clearSide);
	    		}
	    	}
	    	if (clearSide === adapt.css.ident.left || clearSide === adapt.css.ident.right ||
	    		clearSide === adapt.css.ident.both) {
		    	delete computedStyle["clear"];	    	
		    	if (computedStyle["display"] && computedStyle["display"] != adapt.css.ident.inline) {
		    		self.nodeContext.clearSide = clearSide.toString();
		    	}
		    }
	    }
	    if (computedStyle["overflow"] === adapt.css.ident.hidden) {
		    self.nodeContext.floatContainer = true;
	    }
	    var listItem = display === adapt.css.ident.list_item && computedStyle["ua-list-item-count"];
	    if (floating || display === adapt.css.ident.table ||
				computedStyle["break-inside"] === adapt.css.ident.avoid ||
				computedStyle["page-break-inside"] === adapt.css.ident.avoid) {
	    	self.nodeContext.breakPenalty++;
	    } else if (display === adapt.css.ident.table_row) {
	    	self.nodeContext.breakPenalty += 10;
	    }
	    self.nodeContext.inline = !floating && !display || display === adapt.css.ident.inline;
	    self.nodeContext.floatSide = floating ? floatSide.toString() : null;
	    if (!self.nodeContext.inline) {
		    var breakAfter = computedStyle["break-after"] || computedStyle["page-break-after"];
		    if (breakAfter) {
		    	self.nodeContext.breakAfter = breakAfter.toString();
		    }
		    var breakBefore = computedStyle["break-before"] || computedStyle["page-break-before"];
		    if (breakBefore) {
		    	self.nodeContext.breakBefore = breakBefore.toString();
		    }
	    }
	    var firstPseudo = computedStyle["x-first-pseudo"];
	    if (firstPseudo) {
	    	var outerPseudo = self.nodeContext.parent ? self.nodeContext.parent.firstPseudo : null;
	    	self.nodeContext.firstPseudo = new adapt.vtree.FirstPseudo(
	    			outerPseudo, (/** adapt.css.Int */ (firstPseudo)).num);
	    }
	    var whitespace = computedStyle["white-space"];
	    if (whitespace) {
	    	switch (whitespace.toString()) {
	    	case "normal" :
	    	case "nowrap" :
	    		self.nodeContext.whitespace = adapt.vtree.Whitespace.IGNORE;
	    		break;
	    	case "pre-line" :
	    		self.nodeContext.whitespace = adapt.vtree.Whitespace.NEWLINE;
	    		break;    		
	    	case "pre" :
	    	case "pre-wrap" :
	    		self.nodeContext.whitespace = adapt.vtree.Whitespace.PRESERVE;
	    		break;
	    	}
	    }
	    // Create the view element
	    var custom = false;
	    var inner = null;
	    var fetchers = [];
	    var ns = element.namespaceURI;
	    var tag = element.localName;
		if (ns == adapt.base.NS.XHTML) {
			if (tag == "html" || tag == "body" || tag == "script" || tag == "link" || tag == "meta")
				tag = "div";
			else if (tag == "vide_")
				tag = "video";
			else if (tag == "audi_")
				tag = "audio";
			else if (tag == "object")
				custom = !!self.customRenderer;
		} else if (ns == adapt.base.NS.epub) {
			tag = "span";
			ns = adapt.base.NS.XHTML;
		} else if (ns == adapt.base.NS.FB2) {
			ns = adapt.base.NS.XHTML;
			if (tag == "image") {
				tag = "div";
				var imageRef = element.getAttributeNS(adapt.base.NS.XLINK, "href");
				if (imageRef && imageRef.charAt(0) == "#") {
	    			var imageBinary = self.xmldoc.getElement(imageRef);
	    			if (imageBinary) {
		    			inner = self.createElement(ns, "img");
	    				var mediaType = imageBinary.getAttribute("content-type") || "image/jpeg";
		    			var innerSrc = "data:" + mediaType + ";base64," + 
							imageBinary.textContent.replace(/[ \t\n\t]/g, "");
		    			fetchers.push(adapt.taskutil.loadElement(inner, innerSrc));
	    			}
				}
			} else {
				tag = adapt.vgen.fb2Remap[tag];
			}
			if (!tag) {
				tag = self.nodeContext.inline ? "span" : "div";
			}
		} else if (ns == adapt.base.NS.NCX) {
			ns = adapt.base.NS.XHTML;
			if (tag == "ncx" || tag == "navPoint") {
				tag = "div";
			} else if (tag == "navLabel") {
				// Cheat here. Translate source to HTML, so it will plug in into the rest of the
				// pipeline.
				tag = "span";
				var navParent = element.parentNode;
				if (navParent) {
					// find the content element
					var href = null;
					for (var c = navParent.firstChild; c; c = c.nextSibling) {
						if (c.nodeType != 1) {
							continue;
						}
						var childElement = /** @type {Element} */ (c);
						if (childElement.namespaceURI == adapt.base.NS.NCX 
								&& childElement.localName == "content") {
							href = childElement.getAttribute("src");
							break;
						}
					}
					if (href) {
						tag = "a";
						element = element.ownerDocument.createElementNS(ns, "a");
						element.setAttribute("href", href);
					}
				}
			} else {
				tag = "span";
			}
		} else if (ns == adapt.base.NS.SHADOW) {
		    ns = adapt.base.NS.XHTML;
			tag = self.nodeContext.inline ? "span" : "div";		
		} else {
			custom = !!self.customRenderer;			
		}
	    if (listItem) {
	        if (firstTime) {
	            tag = "li";
	        } else {
	            tag = "div";
	            display = adapt.css.ident.block;
	            computedStyle["display"] = display;
	        }
	    } else if (tag == "body" || tag == "li") {
	        tag = "div";
	    } else if (tag == "q") {
	        tag = "span";
	    } else if (tag == "a") {
	    	var hp = computedStyle["hyperlink-processing"];
	    	if (hp && hp.toString() != "normal") {
	    		tag = "span";
	    	}
	    }
	    if (computedStyle["behavior"]) {
	    	var behavior = computedStyle["behavior"].toString();
	    	if (behavior != "none" && self.customRenderer) {
	    		custom = true;
	    	}
	    }
	    var elemResult;
	    if (custom) {
	    	var parentNode = self.nodeContext.parent ? self.nodeContext.parent.viewNode : null;
	    	elemResult = self.customRenderer(element, /** @type {Element} */ (parentNode), computedStyle);
	    } else {
	    	elemResult = adapt.task.newResult(null);
	    }
	    elemResult.then(/** @param {Element} result */ function(result) {
	    	if (result) {
	    		if (custom) {
	    			needToProcessChildren = result.getAttribute("data-adapt-process-children") == "true";
	    		}
	    	} else {
	    		result = self.createElement(ns, tag);
	    	}
	    	if (tag == "a") {
	    		result.addEventListener("click", self.page.hrefHandler, false);
	    	}
		    if (inner) {
				self.applyPseudoelementStyle(self.nodeContext, "inner", inner);
		    	result.appendChild(inner);
		    }
		    if (result.localName == "iframe" && result.namespaceURI == adapt.base.NS.XHTML) {
		    	adapt.vgen.initIFrame(/** @type {HTMLIFrameElement} */ (result));   	
		    }
			if (element.namespaceURI != adapt.base.NS.FB2 || tag == "td") {
			    var attributes = element.attributes;
			    var attributeCount = attributes.length;
			    var delayedSrc = null;
			    for (var i = 0 ; i < attributeCount ; i++) {
			        var attribute = attributes[i];
			        var attributeNS = attribute.namespaceURI;
			        var attributeName = attribute.localName;
			        var attributeValue = attribute.nodeValue;
			        if (!attributeNS) {
			            if (attributeName.match(/^on/))
			                continue; // don't propagate JavaScript code
			            if (attributeName == "style")
			                continue; // we do styling ourselves
			            if (attributeName == "id") {
			            	// Don't propagate ids, but collect them on the page.
			            	self.page.registerElementWithId(result, attributeValue);
			            	continue;
			            }
			            // TODO: understand the element we are working with.
			            if (attributeName == "src" || attributeName == "href" || attributeName == "poster") {
			                attributeValue = self.resolveURL(attributeValue);
			            }
			        }
			        else if (attributeNS == "http://www.w3.org/2000/xmlns/") {
			            continue; //namespace declaration (in Firefox)
			        } else if (attributeNS == adapt.base.NS.XLINK) {
			            if (attributeName == "href")
			                attributeValue = self.resolveURL(attributeValue);		        	
			        }
			        if (attributeNS) {
			            var attributePrefix = adapt.vgen.namespacePrefixMap[attributeNS];
			            if (attributePrefix)
			                attributeName = attributePrefix + ":" + attributeName;
			        }
				    if (attributeName == "src" && !attributeNS && tag == "img" && ns == adapt.base.NS.XHTML) {
				    	// HTML img element should start loading only once all attributes are assigned.
				    	delayedSrc = attributeValue;
				    } else if (attributeName == "href" && tag == "image" && ns == adapt.base.NS.SVG && attributeNS == adapt.base.NS.XLINK) {
			        	self.page.fetchers.push(adapt.taskutil.loadElement(result, attributeValue));
			        } else {
                        // When the document is not XML document (e.g. non-XML HTML)
                        // attributeNS can be null
                        if (attributeNS) {
                            result.setAttributeNS(attributeNS, attributeName, attributeValue);
                        } else {
                            result.setAttribute(attributeName, attributeValue);
                        }
			        }
			    }
			    if (delayedSrc) {
		        	var imageFetcher = adapt.taskutil.loadElement(result, delayedSrc);
		        	if (computedStyle["width"] && computedStyle["height"]) {
		        		// No need to wait for the image, does not affect layout
		        		self.page.fetchers.push(imageFetcher);
		        	} else {
		    			fetchers.push(imageFetcher);
		        	}
			    }			    
			}
		    delete computedStyle["content"];
			var listStyleImage = computedStyle["list-style-image"];
			if (listStyleImage && listStyleImage instanceof adapt.css.URL) {
				var listStyleURL = (/** @type {adapt.css.URL} */ (listStyleImage)).url;
    			fetchers.push(adapt.taskutil.loadElement(new Image(), listStyleURL));				
			}
			self.applyComputedStyles(result, computedStyle);
		    var widows = computedStyle["widows"];
		    var orphans = computedStyle["orphans"];
		    if (widows || orphans) {
		    	if (self.nodeContext.parent) {
			    	self.nodeContext.inheritedProps = {};
			    	for (var n in self.nodeContext.parent.inheritedProps) {
			    		self.nodeContext.inheritedProps[n] = self.nodeContext.parent.inheritedProps[n];
			    	}
		    	}
		    	if (widows instanceof adapt.css.Int) {
		    		self.nodeContext.inheritedProps["widows"] = (/** @type {adapt.css.Int} */ (widows)).num;
		    	}
		    	if (orphans instanceof adapt.css.Int) {
		    		self.nodeContext.inheritedProps["orphans"] = (/** @type {adapt.css.Int} */ (orphans)).num;
		    	}
		    }
		    if (!firstTime && !self.nodeContext.inline) {
		    	var blackList = self.nodeContext.vertical ? adapt.vgen.frontEdgeBlackListVert : adapt.vgen.frontEdgeBlackListHor;
		        for (var propName in blackList) {
		            adapt.base.setCSSProperty(result, propName, blackList[propName]);
		        }
		    }
		    if (listItem) {
		    	result.setAttribute("value", computedStyle["ua-list-item-count"].stringValue());
		    }
		    self.viewNode = result;
		    if (fetchers.length) {
		    	adapt.taskutil.waitForFetchers(fetchers).then(function() {
		    		frame.finish(needToProcessChildren);
		    	});
		    } else {
		    	frame.timeSlice().then(function() {
		    		frame.finish(needToProcessChildren);
		    	});
		    }
	    });
    });
	return frame.result();    
};

/**
 * @param {boolean} firstTime
 * @return {!adapt.task.Result.<boolean>} holding true if children should be processed
 */
adapt.vgen.ViewFactory.prototype.createNodeView = function(firstTime) {
	var self = this;
	/** @type {!adapt.task.Frame.<boolean>} */ var frame
		= adapt.task.newFrame("createNodeView");
	var result;
	var needToProcessChildren = true;
    if (self.sourceNode.nodeType == 1) {
        result = self.createElementView(firstTime);
    } else {
    	if (self.sourceNode.nodeType == 8) {
	    	self.viewNode = null; // comment node
	    } else {
	        var offsetInNode = self.offsetInNode || 0;
	        self.viewNode = document.createTextNode(self.sourceNode.textContent.substr(offsetInNode));
	    }
    	result = adapt.task.newResult(true);
    }
    result.then(function(processChildren) {
    	needToProcessChildren = processChildren;
	    self.nodeContext.viewNode = self.viewNode;
	    if (self.viewNode) {
		    var parent = self.nodeContext.parent ? self.nodeContext.parent.viewNode : self.viewRoot;
		    if (parent) {
		    	parent.appendChild(self.viewNode);
		    }
	    }
	    frame.finish(needToProcessChildren);
    });
    return frame.result();
};

/**
 * @override
 */
adapt.vgen.ViewFactory.prototype.setCurrent = function(nodeContext, firstTime) {
	this.nodeContext = nodeContext;
    if (nodeContext) {
    	this.sourceNode = nodeContext.sourceNode;
    	this.offsetInNode = nodeContext.offsetInNode;
    } else {
    	this.sourceNode = null;
    	this.offsetInNode = -1;    	
    }
    this.viewNode = null;
    if (this.nodeContext) {
    	return this.createNodeView(firstTime);
    }
    return adapt.task.newResult(true);
};

adapt.vgen.ViewFactory.prototype.processShadowContent = function(pos) {
	if (pos.shadowContext == null || 
			pos.sourceNode.localName != "content" || pos.sourceNode.namespaceURI != adapt.base.NS.SHADOW) {
		return pos;
	}
	var boxOffset = pos.boxOffset;
	var shadow = pos.shadowContext;
	var parent = pos.parent;
	
	// content that will be inserted
    var contentNode;
    var contentShadowType;
    var contentShadow;
    if (shadow.subShadow) {
    	contentShadow = shadow.subShadow;
    	contentNode = shadow.root;
    	contentShadowType = shadow.type;
    	if (contentShadowType == adapt.vtree.ShadowType.ROOTLESS) {
    		contentNode = contentNode.firstChild;
    	}
    } else {
    	contentShadow = shadow.parentShadow;
    	contentNode = shadow.owner.firstChild;
    	contentShadowType = adapt.vtree.ShadowType.ROOTLESS;
    }
    var nextSibling = pos.sourceNode.nextSibling;
    if (nextSibling) {
    	pos.sourceNode = nextSibling;
	    pos.resetView();
    } else if (pos.shadowSibling) { 
        pos = pos.shadowSibling;
    } else if (contentNode) {
    	pos = null;
    } else {
        pos = pos.parent.modify();
        pos.after = true;
    }
    if (contentNode) {
	    var r = new adapt.vtree.NodeContext(contentNode, parent, boxOffset);
	    r.shadowContext = contentShadow;
	    r.shadowType = contentShadowType;
	    r.shadowSibling = pos;
	    return r;
    }
	pos.boxOffset = boxOffset;
	return pos;
};

/**
 * @private
 * @param {adapt.vtree.NodeContext} pos
 * @return {adapt.vtree.NodeContext}
 */
adapt.vgen.ViewFactory.prototype.nextPositionInTree = function(pos) {
    var boxOffset = pos.boxOffset + 1; // offset for the next position
    if (pos.after) {
        if (!pos.parent)  // root, that was the last possible position
            return null;
        // we are done with this sourceNode, see if there is a next sibling, unless
        // this is the root of the shadow tree
        if (pos.shadowType != adapt.vtree.ShadowType.ROOTED) {
	        var next = pos.sourceNode.nextSibling;
	        if (next) {
	            pos = pos.modify();
	            // keep shadowType
	            pos.boxOffset = boxOffset;
	            pos.sourceNode = next;
	            pos.resetView();
	            return this.processShadowContent(pos);
	        }
        }
        // if no viable siblings, check if there are shadow siblings
        if (pos.shadowSibling) {
        	// our next position is the element after shadow:content in the parent shadow tree
        	pos = pos.shadowSibling.modify();
            pos.boxOffset = boxOffset;
            return pos;
        }
        // if not rootless shadow, move to the "after" position for the parent
        pos = pos.parent.modify();
        pos.boxOffset = boxOffset;
        pos.after = true;
        return pos;
    } else {
    	// any shadow trees?
        if (pos.nodeShadow) {
        	var shadowNode = pos.nodeShadow.root;
        	if (pos.nodeShadow.type == adapt.vtree.ShadowType.ROOTLESS) {
        		shadowNode = shadowNode.firstChild;
        	}
        	if (shadowNode) {
	    		var sr = new adapt.vtree.NodeContext(shadowNode, pos, boxOffset);
	    		sr.shadowContext = pos.nodeShadow;
	    		sr.shadowType = pos.nodeShadow.type;
	            return this.processShadowContent(sr);
        	}
    	}
        // any children?
        var child = pos.sourceNode.firstChild;
        if (child) {
        	return this.processShadowContent(new adapt.vtree.NodeContext(child, pos, boxOffset));
        }
        // no children - was there text content?
        if (pos.sourceNode.nodeType != 1) {
            boxOffset += pos.sourceNode.textContent.length - 1 - pos.offsetInNode;
        }
        pos = pos.modify();
        pos.boxOffset = boxOffset;
        pos.after = true;
        return pos;
    }
};

/**
 * @param {Element} element
 * @param {adapt.csscasc.ElementStyle} elementStyle
 * @param {?string} transclusionType
 */
adapt.vgen.ViewFactory.prototype.isTransclusion = function(element, elementStyle, transclusionType) {
	var proc = adapt.csscasc.getProp(elementStyle, "hyperlink-processing");
	if (!proc)
		return false;
	var prop = proc.evaluate(this.context, "hyperlink-processing");
	if (!prop)
		return false;
	return prop.toString() == transclusionType;
};


/**
 * @override
 */
adapt.vgen.ViewFactory.prototype.nextInTree = function(nodeContext) {
	nodeContext = this.nextPositionInTree(nodeContext);
	if (!nodeContext || nodeContext.after) {
		return adapt.task.newResult(nodeContext);
	}
	/** @type {!adapt.task.Frame.<adapt.vtree.NodeContext>} */ var frame
		= adapt.task.newFrame("nextInTree");
	this.setCurrent(nodeContext, true).then(function(processChildren) {
	    if (!nodeContext.viewNode || !processChildren) {
	    	nodeContext = nodeContext.modify();
	    	nodeContext.after = true; // skip
	    	if (!nodeContext.viewNode) {
	    		nodeContext.inline = true;
	    	}
	    }
		frame.finish(nodeContext);
	});
	return frame.result();
};

adapt.vgen.ViewFactory.prototype.addImageFetchers = function(bg) {
	if (bg instanceof adapt.css.CommaList) {
		var values = (/** @type {adapt.css.CommaList} */ (bg)).values;
		for (var i = 0; i < values.length; i++) {
			this.addImageFetchers(values[i]);
		}
	} else if (bg instanceof adapt.css.URL) {
		var url = (/** @type {adapt.css.URL} */(bg)).url;
		this.page.fetchers.push(adapt.taskutil.loadElement(new Image(), url));				
	}
};


/**
 * @param {Element} target
 * @param {Object.<string,adapt.css.Val>} computedStyle
 */
adapt.vgen.ViewFactory.prototype.applyComputedStyles = function(target, computedStyle) {
	var bg = computedStyle["background-image"];
	if (bg) {
		this.addImageFetchers(bg);
	}
	for (var propName in computedStyle) {
		var value = computedStyle[propName];
		if (adapt.vtree.delayedProps[propName]) {
			if (propName != "position" || value === adapt.css.ident.relative) {
				// Set it after page layout is done.
				this.page.delayedItems.push(
						new adapt.vtree.DelayedItem(target, propName, value));
				continue;
			}
		}
	    adapt.base.setCSSProperty(target, propName, value.toString());
	}	
};

/**
 * @override
 */
adapt.vgen.ViewFactory.prototype.applyPseudoelementStyle = function(nodeContext, pseudoName, target) {
	if (nodeContext.after)
		return;
    var element = /** @type {Element} */ (this.sourceNode);
    var styler = nodeContext.shadowContext ? 
    		/** @type {adapt.cssstyler.AbstractStyler} */ (nodeContext.shadowContext.styler) : this.styler;
    var elementStyle = styler.getStyle(element, false);
    var pseudoMap = adapt.csscasc.getStyleMap(elementStyle, "_pseudos");
    if (!pseudoMap)
    	return;
    elementStyle = pseudoMap[pseudoName];
    var computedStyle = {};
	nodeContext.vertical = this.computeStyle(nodeContext.vertical, elementStyle, computedStyle);
    var content = computedStyle["content"];
    if (adapt.vtree.nonTrivialContent(content)) {
        content.visit(new adapt.vtree.ContentPropertyHandler(target));
        delete computedStyle["content"];
    }
    this.applyComputedStyles(target, computedStyle);
};

/**
 * @override
 */
adapt.vgen.ViewFactory.prototype.peelOff = function(nodeContext, nodeOffset) {
	/** @type {!adapt.task.Frame.<adapt.vtree.NodeContext>} */ var frame
		= adapt.task.newFrame("peelOff");
	var firstPseudo = nodeContext.firstPseudo;
	var offsetInNode = nodeContext.offsetInNode;
	var after = nodeContext.after;
	if (nodeOffset > 0) {
		var text = nodeContext.viewNode.textContent;
		nodeContext.viewNode.textContent = text.substr(0, nodeOffset);
		offsetInNode += nodeOffset;
	} else if (!after && nodeContext.viewNode && offsetInNode == 0) {
		var parent = nodeContext.viewNode.parentNode;
		if (parent)
			parent.removeChild(nodeContext.viewNode);
	}
	var boxOffset = nodeContext.boxOffset + nodeOffset;
	var arr = [];
	while (nodeContext.firstPseudo === firstPseudo) {
		arr.push(nodeContext);
		nodeContext = nodeContext.parent;
	}
	var pn = arr.pop(); // container for that pseudoelement
	var shadowSibling = pn.shadowSibling;
	var self = this;
	frame.loop(function() {
		while (arr.length > 0) {
			pn = arr.pop();
			nodeContext = new adapt.vtree.NodeContext(pn.sourceNode, nodeContext, boxOffset);
			if (arr.length == 0) {
				nodeContext.offsetInNode = offsetInNode;
				nodeContext.after = after;
			}
			nodeContext.shadowType = pn.shadowType;
			nodeContext.shadowContext = pn.shadowContext,
			nodeContext.nodeShadow = pn.nodeShadow;
			nodeContext.shadowSibling = pn.shadowSibling ? pn.shadowSibling : shadowSibling;
			shadowSibling = null;
			var result = self.setCurrent(nodeContext, false);
			if (result.isPending())
				return result;
		}
		return adapt.task.newResult(false);
	}).then(function() {
		frame.finish(nodeContext);
	});
	return frame.result();
};


/**
 * @param {string} ns
 * @param {string} tag
 * @return {Element}
 */
adapt.vgen.ViewFactory.prototype.createElement = function(ns, tag) {
	if (ns == adapt.base.NS.XHTML)
		return this.document.createElement(tag);
	return this.document.createElementNS(ns, tag);
};

/**
 * @override
 */
adapt.vgen.ViewFactory.prototype.applyFootnoteStyle = function(vertical, target) {
    var computedStyle = {};
    var pseudoMap = adapt.csscasc.getStyleMap(this.footnoteStyle, "_pseudos");
    vertical = this.computeStyle(vertical, this.footnoteStyle, computedStyle);
    if (pseudoMap && pseudoMap["before"]) {
    	var childComputedStyle = {};
    	var span = this.createElement(adapt.base.NS.XHTML, "span");
    	target.appendChild(span);
    	this.computeStyle(vertical, pseudoMap["before"], childComputedStyle);
    	delete childComputedStyle["content"];
    	this.applyComputedStyles(span, childComputedStyle);
    }
	delete computedStyle["content"];
	this.applyComputedStyles(target, computedStyle);
	return vertical;
};

/**
 * @param {Window} window
 * @constructor
 * @implements {adapt.vtree.ClientLayout}
 */
adapt.vgen.DefaultClientLayout = function(window) {
	/** @const */ this.window = window;
};

/**
 * @override
 */
adapt.vgen.DefaultClientLayout.prototype.getRangeClientRects = function(range) {
	return range["getClientRects"]();
};

/**
 * @override
 */
adapt.vgen.DefaultClientLayout.prototype.getElementClientRect = function(element) {
	var htmlElement = /** @type {HTMLElement} */ (element);
	return /** @type {adapt.vtree.ClientRect} */ (htmlElement.getBoundingClientRect());
};

/**
 * @override
 */
adapt.vgen.DefaultClientLayout.prototype.getElementComputedStyle = function(element) {
	return this.window.getComputedStyle(element, null);
};

/**
 * @constructor
 * @param {Window} window
 * @param {number} fontSize
 * @param {HTMLElement=} opt_root
 * @param {number=} opt_width
 * @param {number=} opt_height
 */
adapt.vgen.Viewport = function(window, fontSize, opt_root, opt_width, opt_height) {
	/** @const */ this.window = window;
	/** @const */ this.fontSize = fontSize;
	/** @const */ this.document = window.document;
	/** @type {HTMLElement} */ this.root = opt_root || this.document.body;
	/** @type {number} */ this.width = opt_width || window.innerWidth;
	/** @type {number} */ this.height = opt_height || window.innerHeight;
    this.root.style["min-width"] = this.width + "px";
    this.root.style["min-height"] = this.height + "px";
};
