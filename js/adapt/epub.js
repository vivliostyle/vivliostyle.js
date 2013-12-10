/**
 * Copyright 2013 Google, Inc.
 * @fileoverview Deal with META-INF/ and .opf files in EPUB container.
 */
goog.provide('adapt.epub');

goog.require('adapt.font');
goog.require('adapt.ops');
goog.require('adapt.cfi');

/**
 * @typedef {{spineIndex:number,pageIndex:number,offsetInItem:number}}
 */
adapt.epub.Position;

/**
 * @constructor
 * @extends {adapt.ops.OPSDocStore}
 */
adapt.epub.EPUBDocStore = function() {
	adapt.ops.OPSDocStore.call(this, this.makeDeobfuscatorFactory());
	/** @type {Object.<string,boolean>} */ this.noStyling = {};
	/** @type {Object.<string,adapt.epub.OPFDoc>} */ this.opfByURL = {};
	/** @type {Object.<string,adapt.epub.OPFDoc>} */ this.primaryOPFByEPubURL = {};
	/** @type {Object.<string,function(string):string>} */ this.deobfuscators = {};
};
goog.inherits(adapt.epub.EPUBDocStore, adapt.ops.OPSDocStore);

/**
 * @return {?function(string):?function(string):string}
 */
adapt.epub.EPUBDocStore.prototype.makeDeobfuscatorFactory = function() {
	var self = this;
	/**
	 * @param {string} url
	 * @return {?function(string):string}
	 */
	return function(url) {
		return self.deobfuscators[url];
	};
};

/**
 * @override
 */
adapt.epub.EPUBDocStore.prototype.initXMLDocument = function(url, xml) {
	if (this.noStyling[url]) {
		return adapt.xmldoc.XMLDocStore.prototype.initXMLDocument.call(this, url, xml);
	} else {
		return adapt.ops.OPSDocStore.prototype.initXMLDocument.call(this, url, xml);		
	}
};

/**
 * @param {string} url
 * @return {!adapt.task.Result.<adapt.xmldoc.XMLDocHolder>}
 */
adapt.epub.EPUBDocStore.prototype.loadAsPlainXML = function(url) {
	this.noStyling[url] = true;
	return this.load(url);	
};

/**
 * @param {string} url
 * @return {void}
 */
adapt.epub.EPUBDocStore.prototype.startLoadingAsPlainXML = function(url) {
	this.noStyling[url] = true;
	this.fetch(url);	
};

/**
 * @param {string} url
 * @return {!adapt.task.Result.<adapt.epub.OPFDoc>}
 */
adapt.epub.EPUBDocStore.prototype.loadEPUBDoc = function(url) {
	var self = this;
	/** @type {!adapt.task.Frame.<adapt.epub.OPFDoc>} */ var frame
		= adapt.task.newFrame("loadEPUBDoc");
	self.startLoadingAsPlainXML(url + "META-INF/encryption.xml");
	var containerURL = url + "META-INF/container.xml";
	self.loadAsPlainXML(containerURL).then(function(containerXML){
		var roots = containerXML.doc().child("container").child("rootfiles")
			.child("rootfile").attribute("full-path");
		for (var i = 0; i < roots.length; i++) {
			var root = roots[i];
			if (root) {
				self.loadOPF(url, root).thenFinish(frame);
				return;
			}
		}
		frame.finish(null);
	});
	return frame.result();
};

/**
 * @param {string} epubURL
 * @param {string} root
 * @return {!adapt.task.Result.<adapt.epub.OPFDoc>}
 */
adapt.epub.EPUBDocStore.prototype.loadOPF = function(epubURL, root) {
	var self = this;
	var url = epubURL + root;
	var opf = self.opfByURL[url];
	if (opf) {
		return adapt.task.newResult(opf);
	}
	/** @type {!adapt.task.Frame.<adapt.epub.OPFDoc>} */ var frame
		= adapt.task.newFrame("loadOPF");
	self.loadAsPlainXML(url).then(function(opfXML){
		self.loadAsPlainXML(epubURL + "META-INF/encryption.xml").then(function(encXML) {
			opf = new adapt.epub.OPFDoc(self, epubURL);
			opf.initWithXMLDoc(opfXML, encXML);
			self.opfByURL[url] = opf;
			self.primaryOPFByEPubURL[epubURL] = opf;
			frame.finish(opf);
		});
	});
	return frame.result();
};

/**
 * @constructor
 */
adapt.epub.OPFItem = function() {
	/** @type {?string} */ this.id = null;
	/** @type {?string} */ this.src = null;
	/** @type {?string} */ this.mediaType = null;
	/** @type {Element} */ this.itemRefElement = null;
	/** @type {number} */ this.spineIndex = -1;
};

/**
 * @param {Element} itemElem
 * @param {string} opfURL
 * @return {void}
 */
adapt.epub.OPFItem.prototype.initWithElement = function(itemElem, opfURL) {
	this.id = itemElem.getAttribute("id");
	this.src = adapt.base.resolveURL(itemElem.getAttribute("href"), opfURL);
	this.mediaType = itemElem.getAttribute("media-type");
};

/**
 * @param {adapt.epub.OPFItem} item
 * @return {?string}
 */
adapt.epub.getOPFItemId = function(item) {
	return item.id;
};

/**
 * @param {adapt.epub.OPFItem} item
 * @return {?string}
 */
adapt.epub.getOPFSrc = function(item) {
	return item.src;
};

/**
 * @param {string} uid
 * @return {function(string):string}
 */
adapt.epub.makeDeobfuscator = function(uid) {
	// TODO: use UTF8 of uid
	var sha1 = adapt.sha1.bytesToSHA1Int32(uid);
	return function(input) {
		var sb = new adapt.base.StringBuffer();
		var k = 0;
		while(k < 1040) {
			var word = adapt.sha1.decode32(input.substr(k, 4));
			word ^= sha1[(k / 4) % 5];
			sb.append(adapt.sha1.encode32(word));
			k += 4;
		}
		sb.append(input.substr(1040));
		return sb.toString().substr(0, input.length);
	};
};

/**
 * @constructor
 * @param {adapt.epub.EPUBDocStore} store
 * @param {string} epubURL
 */
adapt.epub.OPFDoc = function(store, epubURL) {
	/** @const */ this.store = store;
	/** @type {adapt.xmldoc.XMLDocHolder} */ this.opfXML = null;
	/** @type {adapt.xmldoc.XMLDocHolder} */ this.encXML = null;
	/** @type {Array.<adapt.epub.OPFItem>} */ this.items = null;
	/** @type {Object.<string,adapt.epub.OPFItem>} */ this.itemMap = null;
	/** @type {Object.<string,adapt.epub.OPFItem>} */ this.itemMapByURL = null;
	/** @const */ this.epubURL = epubURL;
	/** @type {?string} */ this.uid = null;
	/** @type {Object.<string,string>} */ this.bindings = {};
	/** @type {?string} */ this.lang = null;
};

/**
 * @param {adapt.xmldoc.XMLDocHolder} opfXML
 */
adapt.epub.OPFDoc.prototype.initWithXMLDoc = function(opfXML, encXML) {
	var self = this;
	this.opfXML = opfXML;
	this.encXML = encXML;
	var pkg = opfXML.doc().child("package");
	var uidref = pkg.attribute("unique-identifier")[0];
	if (uidref) {
		var uidElem = opfXML.getElement(opfXML.url + "#" + uidref);
		if (uidElem) {
			this.uid = uidElem.textContent.replace(/[ \n\r\t]/g, '');
		}
	}
	this.items = adapt.base.map(pkg.child("manifest").child("item").asArray(), 
		function(elem) {
			var item = new adapt.epub.OPFItem();
			item.initWithElement( /** @type {Element} */ (elem), opfXML.url);
			return item;
		});
	this.itemMap = adapt.base.indexArray(this.items,
			/** @type {function(*):?string} */ (adapt.epub.getOPFItemId));
	this.itemMapByURL = adapt.base.indexArray(this.items,
			/** @type {function(*):?string} */ (adapt.epub.getOPFSrc));
	this.spine = adapt.base.map(pkg.child("spine").child("itemref").asArray(),
			function(node, index) {
				var elem = /** @type {Element} */ (node);
				var id = elem.getAttribute("idref");
				var item = self.itemMap[/** @type {string} */ (id)];
				if (item) {
					item.itemRefElement = elem;
					item.spineIndex = index;
				}
				return item;
			});
	var idpfObfURLs = encXML.doc().child("encryption").child("EncryptedData")
		.predicate(adapt.xmldoc.predicate.withChild("EncryptionMethod",
				adapt.xmldoc.predicate.withAttribute("Algorithm",
						"http://www.idpf.org/2008/embedding")))
		.child("CipherData").child("CipherReference").attribute("URI");
	if (idpfObfURLs.length > 0 && this.uid) {
		var deobfuscator = adapt.epub.makeDeobfuscator(this.uid);
		for (var i = 0; i < idpfObfURLs.length; i++) {
			this.store.deobfuscators[this.epubURL + idpfObfURLs[i]] = deobfuscator;
		}
	}
	var mediaTypeElems = pkg.child("bindings").child("mediaType").asArray();
	for (var i = 0; i < mediaTypeElems.length; i++) {
		var handlerId = mediaTypeElems[i].getAttribute("handler");
        var mediaType = mediaTypeElems[i].getAttribute("media-type");
        if (mediaType && handlerId && this.itemMap[handlerId]) {
        	this.bindings[mediaType] = this.itemMap[handlerId].src;
        }
	}
	var langs = pkg.child("metadata").child("language").textContent();
	if (langs.length > 0) {
		this.lang = langs[0];
	}
};

/**
 * Creates a fake OPF "document" that contains a single OPS chapter.
 * @param url OPS (XHTML) document URL
 */
adapt.epub.OPFDoc.prototype.initWithSingleChapter = function(url) {
	var item = new adapt.epub.OPFItem();
	item.spineIndex = 0;
	item.id = "item1";
	item.src = url;
	this.itemMap = {"item1": item};
	this.itemMapByURL = {};
	this.itemMapByURL[url] = item;
	this.items = [item];
	this.spine = this.items;
};

/**
 * @param {number} spineIndex
 * @param {number} offsetInItem
 * @return {!adapt.task.Result.<?string>} cfi
 */
adapt.epub.OPFDoc.prototype.getCFI = function(spineIndex, offsetInItem) {
	var item = this.spine[spineIndex];
	/** @type {!adapt.task.Frame.<?string>} */ var frame = adapt.task.newFrame("getCFI");
	this.store.load(item.src).then(function (xmldoc) {
		var node = xmldoc.getNodeByOffset(offsetInItem);
		var cfi = null;
		if (node) {
			var startOffset = xmldoc.getNodeOffset(node, 0, false);
			var offsetInNode = offsetInItem - startOffset;
			var fragment = new adapt.cfi.Fragment();
			fragment.prependPathFromNode(node, offsetInNode, false, null);
			if (item.itemRefElement) {
				fragment.prependPathFromNode(item.itemRefElement, 0, false, null);
			}
			cfi = fragment.toString();
		}
		frame.finish(cfi);
	});
	return frame.result();
};

/**
 * @param {?string} fragstr
 * @return {!adapt.task.Result.<?adapt.epub.Position>}
 */
adapt.epub.OPFDoc.prototype.resolveFragment = function(fragstr) {
	var self = this;
	return adapt.task.handle("resolveFragment",
    	/**
    	 * @param {!adapt.task.Frame.<?adapt.epub.Position>} frame
    	 * @return {void}
    	 */			
		function(frame) {
			if (!fragstr) {
				frame.finish(null);
				return;
			}
			var fragment = new adapt.cfi.Fragment();
			fragment.fromString(fragstr);
			var item;
			if (self.opfXML) {
				var opfNav = fragment.navigate(self.opfXML.document);
				if (opfNav.node.nodeType != 1 || opfNav.after || !opfNav.ref) {
					frame.finish(null);
					return;
				}
				var elem = /** @type {Element} */ (opfNav.node);
				var idref = elem.getAttribute("idref");
				if (elem.localName != "itemref" || !idref || !self.itemMap[idref]) {
					frame.finish(null);
					return;					
				}
				item = self.itemMap[idref];
				fragment = opfNav.ref;
			} else {
				item = self.spine[0];
			}
			self.store.load(item.src).then(function (xmldoc) {
				var nodeNav = fragment.navigate(xmldoc.document);
				var offset = xmldoc.getNodeOffset(nodeNav.node, nodeNav.offset, nodeNav.after);
				frame.finish({spineIndex: item.spineIndex, offsetInItem: offset, pageIndex: -1});
			});
		},
    	/**
    	 * @param {!adapt.task.Frame.<?adapt.epub.Position>} frame
    	 * @param {Error} err
    	 * @return {void}
    	 */					
		function(frame, err) {
			adapt.base.log("Error resolving fragment " + fragstr);
			frame.finish(null);
		});
};

/**
 * @typedef {{
 * 		item: adapt.epub.OPFItem,
 * 		xmldoc: adapt.xmldoc.XMLDocHolder,
 * 		instance: adapt.ops.StyleInstance,
 * 		layoutPositions: Array.<adapt.vtree.LayoutPosition>,
 * 		complete: boolean
 * }}
 */
adapt.epub.OPFViewItem;

/**
 * @constructor
 * @param {adapt.epub.OPFDoc} opf
 * @param {adapt.vgen.Viewport} viewport
 * @param {adapt.font.Mapper} fontMapper
 * @param {adapt.expr.Preferences} pref
 */
adapt.epub.OPFView = function(opf, viewport, fontMapper, pref) {
	/** @const */ this.opf = opf;
	/** @const */ this.viewport = viewport;
	/** @const */ this.fontMapper = fontMapper;
	/** @type {Array.<adapt.epub.OPFViewItem>} */ this.spineItems = [];
	/** @type {number} */ this.spineIndex = 0;
	/** @type {number} */ this.pageIndex = 0;
	/** @type {number} */ this.offsetInItem = 0;
	/** @const */ this.pref = adapt.expr.clonePreferences(pref);
	/** @const */ this.clientLayout = new adapt.vgen.DefaultClientLayout(viewport.window);
};

/**
 * Renders the current page and normalizes current page position.
 * @return {!adapt.task.Result.<adapt.vtree.Page>}
 */
adapt.epub.OPFView.prototype.renderPage = function() {
	var self = this;
	/** @type {!adapt.task.Frame.<adapt.vtree.Page>} */ var frame
		= adapt.task.newFrame("renderPage");
	self.getPageViewItem().then(function(viewItem) {
		if (!viewItem) {
			frame.finish(null);
			return;
		}
		var seekOffset = -1;
		if (self.pageIndex < 0) {
			seekOffset = self.offsetInItem;
			// page with offset higher than seekOffset
			var pageIndex = adapt.base.binarySearch(viewItem.layoutPositions.length,
				function(pageIndex) {
					var offset = viewItem.instance.getPosition(viewItem.layoutPositions[pageIndex]);
					return offset > seekOffset;
				});
			if (pageIndex == viewItem.layoutPositions.length) {
				// need to search through pages that are not yet produced
				self.pageIndex = Number.POSITIVE_INFINITY;
			} else {
				// page that contains seekOffset
				self.pageIndex = pageIndex - 1;
			}
		}
		var resultPage = null;
		frame.loopWithFrame(function(loopFrame) {
			if (self.pageIndex < viewItem.layoutPositions.length) {
				loopFrame.breakLoop();
				return;
			}
			if (viewItem.complete) {
				self.pageIndex = viewItem.layoutPositions.length - 1;
				loopFrame.breakLoop();
				return;
			}
			var page = self.makePage(viewItem);
			var pos = viewItem.layoutPositions[viewItem.layoutPositions.length - 1];
		    viewItem.instance.layoutNextPage(page, pos).then(function(posParam) {
		    	pos = /** @type {adapt.vtree.LayoutPosition} */ (posParam);
			    if (pos) {
			    	viewItem.layoutPositions.push(pos);
			    	var offsetInItem = viewItem.instance.getPosition(pos);
			    	if (seekOffset >= 0) {
			    		// Searching for offset, don't know the page number.
			    		var offset = viewItem.instance.getPosition(pos);
			    		if (offset > seekOffset) {
					    	resultPage = page;
					    	self.pageIndex = viewItem.layoutPositions.length - 2;
					    	self.offsetInItem = offsetInItem;
							loopFrame.breakLoop();
			    			return;
			    		}
			    	}
			        self.viewport.root.removeChild(page.container);    	
			    	loopFrame.continueLoop();
			    } else {
			    	resultPage = page;
			    	self.pageIndex = viewItem.layoutPositions.length - 1;
			    	self.offsetInItem = Number.POSITIVE_INFINITY;
			    	viewItem.complete = true;
					loopFrame.breakLoop();
			    }
		    });
		}).then(function() {
			if (resultPage) {
			    frame.finish(resultPage);
			    return;
			}
			var pos = viewItem.layoutPositions[self.pageIndex];
	    	self.offsetInItem = viewItem.instance.getPosition(pos);
			var page = self.makePage(viewItem);
		    viewItem.instance.layoutNextPage(page, pos).then(function(posParam) {
		    	pos = /** @type {adapt.vtree.LayoutPosition} */ (posParam);
			    if (pos) {
			    	viewItem.layoutPositions[self.pageIndex + 1] = pos;
			    } else {
			    	viewItem.complete = true;
			    }
			    frame.finish(page);
		    });
		});		    
	});
	return frame.result();
};

/**
 * Move to the next page position and render page.
 * @return {!adapt.task.Result.<adapt.vtree.Page>}
 */
adapt.epub.OPFView.prototype.nextPage = function() {
	var self = this;
	/** @type {!adapt.task.Frame.<adapt.vtree.Page>} */ var frame
		= adapt.task.newFrame("nextPage");
	self.getPageViewItem().then(function(viewItem) {
		if (!viewItem) {
			frame.finish(null);
			return;
		}
		if (viewItem.complete && self.pageIndex == viewItem.layoutPositions.length - 1) {
			if (self.spineIndex >= self.opf.spine.length - 1) {
				frame.finish(null);
				return;
			}
			self.spineIndex++;
			self.pageIndex = 0;
		} else {
			self.pageIndex++;
		}
		self.renderPage().thenFinish(frame);
	});
	return frame.result();
};

/**
 * Move to the previous page and render it.
 * @return {!adapt.task.Result.<adapt.vtree.Page>}
 */
adapt.epub.OPFView.prototype.previousPage = function() {
	if (this.pageIndex == 0) {
		if (this.spineIndex == 0) {
			return adapt.task.newResult(/** @type {adapt.vtree.Page} */ (null));
		}
		this.spineIndex--;
		this.pageIndex = Number.POSITIVE_INFINITY;
	} else {
		this.pageIndex--;
	}
	return this.renderPage();
};

/**
 * Move to the page specified by the given URL and render it.
 * @param {string} href
 * @return {!adapt.task.Result.<adapt.vtree.Page>}
 */
adapt.epub.OPFView.prototype.navigateTo = function(href) {
	adapt.base.log("Navigate to " + href);
	var fragmentIndex = href.indexOf("#");
	if (fragmentIndex < 0) {
		fragmentIndex = href.length;
	}
	var item = this.opf.itemMapByURL[adapt.base.stripFragment(href)];
	if (!item) {
		return adapt.task.newResult(/** @type {adapt.vtree.Page} */ (null));
	}
	// Commited to navigate. If not moving to a different item, current
	// page is good enough.
	if (item.spineIndex != this.spineIndex) {
		this.spineIndex = item.spineIndex;
		this.pageIndex = 0;
	}
	/** @type {!adapt.task.Frame.<adapt.vtree.Page>} */ var frame
		= adapt.task.newFrame("navigateTo");
	var self = this;
	self.getPageViewItem().then(function(viewItem) {
		var target = viewItem.xmldoc.getElement(href);
		if (target) {
			self.offsetInItem = viewItem.xmldoc.getElementOffset(target);
			self.pageIndex = -1;
		}
		self.renderPage().thenFinish(frame);
	});
	return frame.result();
};

/**
 * @return {adapt.vtree.Page}
 */
adapt.epub.OPFView.prototype.makePage = function(viewItem) {
	var viewport = viewItem.instance.viewport;
    var pageCont = /** @type {HTMLElement} */ (viewport.document.createElement("div"));
    viewport.root.appendChild(pageCont);
    pageCont.style.position = "absolute";
    pageCont.style.visibility = "hidden";
    pageCont.style.left = "0px";
    pageCont.style.top = "0px";
    pageCont.style.width = viewport.width + "px";
    pageCont.style.height = viewport.height + "px";
    var page = new adapt.vtree.Page(pageCont);
    if (viewport !== this.viewport) {
    	var matrix = adapt.expr.letterbox(this.viewport.width, this.viewport.height,
    			viewport.width, viewport.height);
    	var cssMatrix = adapt.cssparse.parseValue(null, new adapt.csstok.Tokenizer(matrix, null), "");
    	page.delayedItems.push(new adapt.vtree.DelayedItem(pageCont, "transform", cssMatrix));
    }
    return page;
};

/**
 * @param {adapt.xmldoc.XMLDocHolder} xmldoc
 * @return {adapt.vgen.CustomRenderer}
 */
adapt.epub.OPFView.prototype.makeCustomRenderer = function(xmldoc) {
	var self = this;
	/**
	 * @param {Element} srcElem
	 * @param {Node} viewParent
	 * @return {!adapt.task.Result.<Element>}
	 */
	return function(srcElem, viewParent, computedStyle) {
		var result = null;
		if (srcElem.localName == "object" && srcElem.namespaceURI == adapt.base.NS.XHTML) {
			var data = srcElem.getAttribute("data");
			if (data) {
				data = adapt.base.resolveURL(data, xmldoc.url);
				var mediaType = srcElem.getAttribute("media-type");
				if (!mediaType) {
					var item = self.opf.itemMapByURL[data];
					if (item) {
						mediaType = item.mediaType;
					}
				}
				if (mediaType) {
					var handlerSrc = self.opf.bindings[mediaType];
					if (handlerSrc) {
						result = self.viewport.document.createElement("iframe");
						result.style.border = "none";
						var srcParam = adapt.base.lightURLEncode(data);
						var typeParam = adapt.base.lightURLEncode(mediaType);
						var sb = new adapt.base.StringBuffer();
						sb.append(handlerSrc);
						sb.append("?src=");
						sb.append(srcParam);
						sb.append("&type=");
						sb.append(typeParam);
						for (var c = srcElem.firstChild; c; c = c.nextSibling) {
							if (c.nodeType == 1) {
								var ce = /** @type {Element} */ (c);
								if (ce.localName == "param" && ce.namespaceURI == adapt.base.NS.XHTML) {
									var pname = ce.getAttribute("name");
									var pvalue = ce.getAttribute("value");
									if (pname && pvalue) {
										sb.append("&");
										sb.append(encodeURIComponent(pname));
										sb.append("=");
										sb.append(encodeURIComponent(pvalue));
									}
								}
							}
						}
						result.setAttribute("src", sb.toString());
						var width = srcElem.getAttribute("width");
						if (width) {
							result.setAttribute("width", width);
						}
						var height = srcElem.getAttribute("height");
						if (height) {
							result.setAttribute("height", height);
						}
					}
				}
			}
		}
		if (!result) {
			result = self.viewport.document.createElement("span");
		}
		return adapt.task.newResult(/** @type {Element} */ (result));
	};
};

/**
 * @return {!adapt.task.Result.<adapt.epub.OPFViewItem>}
 */
adapt.epub.OPFView.prototype.getPageViewItem = function() {
	var self = this;
	if (self.spineIndex >= self.opf.spine.length) {
		return adapt.task.newResult(/** @type {adapt.epub.OPFViewItem} */ (null));
	}
	var viewItem = self.spineItems[self.spineIndex];
	if (viewItem) {
		return adapt.task.newResult(viewItem);		
	}
	var item = self.opf.spine[self.spineIndex];
	var store = self.opf.store;
	/** @type {!adapt.task.Frame.<adapt.epub.OPFViewItem>} */ var frame
		= adapt.task.newFrame("getPageViewItem");
    store.load(item.src).then(function (xmldoc) {
    	var style = store.getStyleForDoc(xmldoc);
    	var customRenderer = self.makeCustomRenderer(xmldoc);
    	var viewport = self.viewport;
    	var viewportSize = style.sizeViewport(viewport.width, viewport.height, viewport.fontSize);
    	if (viewportSize.width != viewport.width || viewportSize.height != viewport.height ||
    			viewportSize.fontSize != viewport.fontSize) {
    		viewport = new adapt.vgen.Viewport(viewport.window, viewportSize.fontSize, viewport.root,
    				viewportSize.width, viewportSize.height);
    	}
        var instance = new adapt.ops.StyleInstance(style, xmldoc, self.opf.lang,
        		viewport, self.clientLayout, self.fontMapper, customRenderer);
        instance.pref = self.pref;
        instance.init().then(function() {
			viewItem = {item: item, xmldoc: xmldoc, instance: instance,
					layoutPositions: [null], complete: false};
			self.spineItems[self.spineIndex] = viewItem;
			frame.finish(viewItem);
        });
    });
    return frame.result();
};

/**
 * @return {adapt.epub.Position}
 */
adapt.epub.OPFView.prototype.getPagePosition = function() {
	return {spineIndex: this.spineIndex, pageIndex: this.pageIndex, offsetInItem: this.offsetInItem};
};

/**
 * @param {?adapt.epub.Position} pos
 * @return {!adapt.task.Result.<adapt.vtree.Page>}
 */
adapt.epub.OPFView.prototype.setPagePosition = function(pos) {
	if (pos) {
		this.spineIndex = pos.spineIndex;
		this.pageIndex = -1;
		this.offsetInItem = pos.offsetInItem;
	} else {
		this.spineIndex = 0;
		this.pageIndex = 0;
		this.offsetInItem = 0;		
	}
	return this.renderPage();
};

