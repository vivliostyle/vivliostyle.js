/**
 * Copyright 2013 Google, Inc.
 * Copyright 2015 Vivliostyle Inc.
 * @fileoverview Deal with META-INF/ and .opf files in EPUB container.
 */
goog.provide('adapt.epub');

goog.require("vivliostyle.constants");
goog.require("vivliostyle.logging");
goog.require('adapt.net');
goog.require('adapt.xmldoc');
goog.require('adapt.csscasc');
goog.require('adapt.font');
goog.require('adapt.ops');
goog.require('adapt.cfi');
goog.require('adapt.sha1');
goog.require('adapt.toc');

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
	/** @const */ this.plainXMLStore = adapt.xmldoc.newXMLDocStore();
	/** @const */ this.jsonStore = adapt.net.newJSONStore();
	/** @type {Object.<string,adapt.epub.OPFDoc>} */ this.opfByURL = {};
	/** @type {Object.<string,adapt.epub.OPFDoc>} */ this.primaryOPFByEPubURL = {};
	/** @type {Object.<string,function(Blob):adapt.task.Result.<Blob>>} */ this.deobfuscators = {};
    /** @type {Object.<string,!adapt.task.Result.<adapt.xmldoc.XMLDocHolder>>} */ this.documents = {};
};
goog.inherits(adapt.epub.EPUBDocStore, adapt.ops.OPSDocStore);

/**
 * @return {?function(string):?function(Blob):adapt.task.Result.<Blob>}
 */
adapt.epub.EPUBDocStore.prototype.makeDeobfuscatorFactory = function() {
	var self = this;
	return (
	/**
	 * @param {string} url
	 * @return {?function(Blob):adapt.task.Result.<Blob>}
	 */
	function(url) {
		return self.deobfuscators[url];
	}
	);
};

/**
 * @param {string} url
 * @param {boolean=} opt_required
 * @param {string=} opt_message
 * @return {!adapt.task.Result.<adapt.xmldoc.XMLDocHolder>}
 */
adapt.epub.EPUBDocStore.prototype.loadAsPlainXML = function(url, opt_required, opt_message) {
	return this.plainXMLStore.load(url, opt_required, opt_message);
};

/**
 * @param {string} url
 * @return {void}
 */
adapt.epub.EPUBDocStore.prototype.startLoadingAsPlainXML = function(url) {
	this.plainXMLStore.fetch(url);	
};

/**
 * @param {string} url
 * @return {!adapt.task.Result.<adapt.base.JSON>}
 */
adapt.epub.EPUBDocStore.prototype.loadAsJSON = function(url) {
	return this.jsonStore.load(url);	
};

/**
 * @param {string} url
 * @return {void}
 */
adapt.epub.EPUBDocStore.prototype.startLoadingAsJSON = function(url) {
	this.jsonStore.fetch(url);	
};

/**
 * @param {string} url
 * @param {boolean} haveZipMetadata
 * @return {!adapt.task.Result.<adapt.epub.OPFDoc>}
 */
adapt.epub.EPUBDocStore.prototype.loadEPUBDoc = function(url, haveZipMetadata) {
	var self = this;
	/** @type {!adapt.task.Frame.<adapt.epub.OPFDoc>} */ var frame
		= adapt.task.newFrame("loadEPUBDoc");
	if (url.substring(url.length - 1) !== "/") {
		url = url + "/";
	}
	if (haveZipMetadata) {
		self.startLoadingAsJSON(url + "?r=list");
	}
	self.startLoadingAsPlainXML(url + "META-INF/encryption.xml");
	var containerURL = url + "META-INF/container.xml";
	self.loadAsPlainXML(containerURL, true, "Failed to fetch EPUB container.xml from " + containerURL).then(function(containerXML){
		if (!containerXML) {
			vivliostyle.logging.logger.error("Received an empty response for EPUB container.xml " + containerURL + ". This may be caused by the server not allowing cross origin requests.");
		} else {
			var roots = containerXML.doc().child("container").child("rootfiles")
				.child("rootfile").attribute("full-path");
			for (var i = 0; i < roots.length; i++) {
				var root = roots[i];
				if (root) {
					self.loadOPF(url, root, haveZipMetadata).thenFinish(frame);
					return;
				}
			}
			frame.finish(null);
		}
	});
	return frame.result();
};

/**
 * @param {string} epubURL
 * @param {string} root
 * @param {boolean} haveZipMetadata
 * @return {!adapt.task.Result.<adapt.epub.OPFDoc>}
 */
adapt.epub.EPUBDocStore.prototype.loadOPF = function(epubURL, root, haveZipMetadata) {
	var self = this;
	var url = epubURL + root;
	var opf = self.opfByURL[url];
	if (opf) {
		return adapt.task.newResult(opf);
	}
	/** @type {!adapt.task.Frame.<adapt.epub.OPFDoc>} */ var frame
		= adapt.task.newFrame("loadOPF");
	self.loadAsPlainXML(url).then(function(opfXML){
		if (!opfXML) {
			vivliostyle.logging.logger.error("Received an empty response for EPUB OPF " + url + ". This may be caused by the server not allowing cross origin requests.");
		} else {
			self.loadAsPlainXML(epubURL + "META-INF/encryption.xml").then(function (encXML) {
				var zipMetadataResult = haveZipMetadata ?
					self.loadAsJSON(epubURL + "?r=list") : adapt.task.newResult(null);
				zipMetadataResult.then(function (zipMetadata) {
					opf = new adapt.epub.OPFDoc(self, epubURL);
					opf.initWithXMLDoc(opfXML, encXML, zipMetadata, epubURL + "?r=manifest").then(function () {
						self.opfByURL[url] = opf;
						self.primaryOPFByEPubURL[epubURL] = opf;
						frame.finish(opf);
					});
				});
			});
		}
	});
	return frame.result();
};

/**
 * @param {string} url
 * @param {!Document} doc
 */
adapt.epub.EPUBDocStore.prototype.addDocument = function(url, doc) {
    var frame = adapt.task.newFrame("EPUBDocStore.load");
    var docURL = adapt.base.stripFragment(url);
    var r = this.documents[docURL] = this.parseOPSResource(
        {status: 200, url: docURL, contentType: doc.contentType, responseText: null, responseXML: doc, responseBlob: null}
    );
    r.thenFinish(frame);
    return frame.result();
};

/**
 * @override
 */
adapt.epub.EPUBDocStore.prototype.load = function(url) {
    var docURL = adapt.base.stripFragment(url);
    var r = this.documents[docURL];
    if (r) {
        return r.isPending() ? r : adapt.task.newResult(r.get());
    } else {
		var frame = adapt.task.newFrame("EPUBDocStore.load");
		r = adapt.epub.EPUBDocStore.superClass_.load.call(this, docURL, true, "Failed to fetch a source document from " + docURL);
		r.then(function(xmldoc) {
			if (!xmldoc) {
				vivliostyle.logging.logger.error("Received an empty response for " + docURL + ". This may be caused by the server not allowing cross origin requests.");
			} else {
				frame.finish(xmldoc);
			}
		});
		return frame.result();
    }
};

/**
 * @constructor
 */
adapt.epub.OPFItem = function() {
	/** @type {?string} */ this.id = null;
	/** @type {string} */ this.src = "";
	/** @type {?string} */ this.mediaType = null;
	/** @type {Element} */ this.itemRefElement = null;
	/** @type {number} */ this.spineIndex = -1;
	/** @type {number} */ this.compressedSize = 0;
	/** @type {?boolean} */ this.compressed = null;
	/** @type {number} */ this.epage = 0;
	/** @type {number} */ this.epageCount = 0;
	/** @type {Object.<string,boolean>} */ this.itemProperties = adapt.base.emptyObj;
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
	var propStr = itemElem.getAttribute("properties");
	if (propStr) {
		this.itemProperties = adapt.base.arrayToSet(propStr.split(/\s+/));
	}
};

/**
 * @param {adapt.epub.OPFItem} item
 * @return {?string}
 */
adapt.epub.getOPFItemId = function(item) {
	return item.id;
};

/**
 * @param {string} uid
 * @return {function(Blob):adapt.task.Result.<Blob>}
 */
adapt.epub.makeDeobfuscator = function(uid) {
	// TODO: use UTF8 of uid
	var sha1 = adapt.sha1.bytesToSHA1Int8(uid);
	return /** @param {Blob} blob */ function(blob) {
		var frame = /** @type {adapt.task.Frame.<Blob>} */ (adapt.task.newFrame("deobfuscator"));
		var head;
		var tail;
		if (blob.slice) {
			head = blob.slice(0, 1040);
			tail = blob.slice(1040, blob.size);
		} else {
			head = blob["webkitSlice"](0, 1040);
			tail = blob["webkitSlice"](1040, blob.size - 1040);			
		}
		adapt.net.readBlob(head).then(function(buf) {
			var dataView = new DataView(buf);
			for (var k = 0; k < dataView.byteLength; k++) {
				var b = dataView.getUint8(k);
				b ^= sha1[k % 20];
				dataView.setUint8(k, b);
			}
			frame.finish(adapt.net.makeBlob([dataView, tail]));
		});
		return frame.result();
	};
};

/**
 * @param {string} uid
 * @return {string}
 */
adapt.epub.makeObfuscationKey = function(uid) {
	return "1040:" + adapt.sha1.bytesToSHA1Hex(uid);	
};

/**
 * @typedef {{
 *   name: string,
 *   value: string,
 *   id: ?string,
 *   refines: ?string,
 *   scheme: ?string,
 *   lang: ?string,
 *   order: number
 * }}
 */
adapt.epub.RawMetaItem;

/**
 * @const
 */
adapt.epub.predefinedPrefixes = {
	"dcterms": "http://purl.org/dc/terms/",
	"marc": "http://id.loc.gov/vocabulary/",
	"media": "http://www.idpf.org/epub/vocab/overlays/#",
	"onix":	"http://www.editeur.org/ONIX/book/codelists/current.html#",
	"xsd": "http://www.w3.org/2001/XMLSchema#"
};

/**
 * @const
 */
adapt.epub.defaultIRI = "http://idpf.org/epub/vocab/package/#";


/**
 * @const
 */
adapt.epub.metaTerms = {
	language: adapt.epub.predefinedPrefixes["dcterms"] + "language",
	title: adapt.epub.predefinedPrefixes["dcterms"] + "title",
	creator: adapt.epub.predefinedPrefixes["dcterms"] + "creator",
	titleType: adapt.epub.defaultIRI + "title-type",
	displaySeq: adapt.epub.defaultIRI + "display-seq",
	alternateScript: adapt.epub.defaultIRI + "alternate-script"
};

/**
 * @param {string} term
 * @param {string} lang
 * @return {function(adapt.base.JSON,adapt.base.JSON):number}
 */
adapt.epub.getMetadataComparator = function(term, lang) {
	var empty = {};
	return function(item1, item2) {
		var m1, m2;
		var r1 = item1["r"] || empty;
		var r2 = item2["r"] || empty;
		if (term == adapt.epub.metaTerms.title) {
			m1 = r1[adapt.epub.metaTerms.titleType] == "main";
			m2 = r2[adapt.epub.metaTerms.titleType] == "main";			
			if (m1 != m2) {
				return m1 ? -1 : 1;
			}
		}
		var i1 = parseInt(r1[adapt.epub.metaTerms.displaySeq], 10);
		if (isNaN(i1)) {
			i1 = Number.MAX_VALUE;
		}
		var i2 = parseInt(r2[adapt.epub.metaTerms.displaySeq], 10);			
		if (isNaN(i2)) {
			i2 = Number.MAX_VALUE;
		}
		if (i1 != i2) {
			return i1 - i2;
		}
		if (term != adapt.epub.metaTerms.language && lang) {
			m1 = (r1[adapt.epub.metaTerms.language] || r1[adapt.epub.metaTerms.alternateScript]) == lang;
			m2 = (r2[adapt.epub.metaTerms.language] || r2[adapt.epub.metaTerms.alternateScript]) == lang;
			if (m1 != m2) {
				return m1 ? -1 : 1;
			}
		}
		return item1["o"] - item2["o"];
	};
};


/**
 * @param {adapt.xmldoc.NodeList} mroot
 * @param {?string} prefixes
 * @return {adapt.base.JSON}
 */
adapt.epub.readMetadata = function(mroot, prefixes) {
	// Parse prefix map (if any)
	var prefixMap;
	if (!prefixes) {
		prefixMap = adapt.epub.predefinedPrefixes;
	} else {
		prefixMap = {};
		for (var pn in adapt.epub.predefinedPrefixes) {
			prefixMap[pn] = adapt.epub.predefinedPrefixes[pn];
		}
		var r;
		// This code permits any non-ASCII characters in the name to avoid bloating the pattern.
		while ((r = prefixes.match(/(^\s*[A-Z_a-z\u007F-\uFFFF][-.A-Z_a-z0-9\u007F-\uFFFF]*):\s*(\S+)/)) != null) {
			prefixes = prefixes.substr(r[0].length);
			prefixMap[r[1]] = r[2];
		}
	}
	/**
	 * @param {?string} val 
	 * @return {?string}
	 */
	var resolveProperty = function(val) {
		if (val) {
			var r = val.match(/^\s*(([^:]*):)?(\S+)\s*$/);
			if (r) {
				var iri = r[1] ? prefixMap[r[1]] : adapt.epub.defaultIRI;
				if (iri) {
					return iri + r[3];
				}
			}
		}
		return null;
	};
	var order = 1;
	// List of metadata items.
	var rawItems = mroot.childElements().forEachNonNull(/** @return {?adapt.epub.RawMetaItem} */ function(node) {
		if (node.localName == "meta") {
			var p = resolveProperty(node.getAttribute("property"));
			if (p) {
				return {name: p,
					value: node.textContent, id: node.getAttribute("id"), order: order++,
					refines: node.getAttribute("refines"), lang:null,
					scheme: resolveProperty(node.getAttribute("scheme"))};
			}
		} else if (node.namespaceURI == adapt.base.NS.DC) {
			return {name: adapt.epub.predefinedPrefixes["dcterms"] + node.localName, order: order++,
				lang: node.getAttribute("xml:lang"),
				value: node.textContent, id: node.getAttribute("id"), refines:null, scheme:null};
		}
		return null;
	});
	// Items grouped by their target id.
	var rawItemsByTarget = adapt.base.multiIndexArray(rawItems,
			function(rawItem) { return rawItem.refines; });
	var makeMetadata = function(map) {
		return adapt.base.mapObj(map, /** @return {Array} */ function(rawItemArr, itemName) {
			var result = adapt.base.map(rawItemArr, function(rawItem) {
				var entry = {"v": rawItem.value, "o": rawItem.order};
				if (rawItem.schema) {
					entry["s"] = rawItem.scheme;
				}
				if (rawItem.id || rawItem.lang) {
					var refs = rawItemsByTarget[rawItem.id];
					if (refs || rawItem.lang) {
						if (rawItem.lang) {
							// Special handling for xml:lang
							var langItem = {name:adapt.epub.metaTerms.language, value:rawItem.lang,
									lang:null, id:null, refines:rawItem.id, scheme:null,
									order: rawItem.order};
							if (refs) {
								refs.push(langItem);
							} else {
								refs = [langItem];
							}
						}
						var entryMap = adapt.base.multiIndexArray(refs, function(rawItem) { return rawItem.name; });
						entry["r"] = makeMetadata(entryMap);
					}
				}
				return entry;
			});
			return result;
		});
	};
	var metadata = makeMetadata(adapt.base.multiIndexArray(rawItems,
			function(rawItem) { return rawItem.refines ? null : rawItem.name; }));
	var lang = null;
	if (metadata[adapt.epub.metaTerms.language]) {
		lang = metadata[adapt.epub.metaTerms.language][0]["v"];
	}
	var sortMetadata = function(metadata) {
		for (var term in metadata) {
			var arr = /** @type {Array} */ (metadata[term]);
			arr.sort(adapt.epub.getMetadataComparator(term, lang));
			for (var i = 0; i < arr.length; i++) {
				var r = arr[i]["r"];
				if (r) {
					sortMetadata(r);
				}
			}
		}
	};
	sortMetadata(metadata);
	return metadata;
};

/**
 * @return {Object}
 */
adapt.epub.getMathJaxHub = function() {
	var math = window["MathJax"];
	if (math) {
		return math["Hub"];
	}
	return null;
};

/**
 * @return {void}
 */
adapt.epub.checkMathJax = function() {
	if (adapt.epub.getMathJaxHub()) {
		adapt.csscasc.supportedNamespaces[adapt.base.NS.MATHML] = true;
	}
};

/** @const */
adapt.epub.supportedMediaTypes = {
	"appliaction/xhtml+xml": true,
	"image/jpeg": true,
	"image/png": true,
	"image/svg+xml": true,
	"image/gif": true,
	"audio/mp3": true
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
	/** @type {Array.<adapt.epub.OPFItem>} */ this.spine = null;
	/** @type {Object.<string,adapt.epub.OPFItem>} */ this.itemMap = null;
	/** @type {Object.<string,adapt.epub.OPFItem>} */ this.itemMapByPath = null;
	/** @const */ this.epubURL = epubURL;
	/** @type {?string} */ this.uid = null;
	/** @type {Object.<string,string>} */ this.bindings = {};
	/** @type {?string} */ this.lang = null;
	/** @type {number} */ this.epageCount = 0;
	/** @type {adapt.base.JSON} */ this.metadata = {};
	/** @type {adapt.epub.OPFItem} */ this.ncxToc = null;
	/** @type {adapt.epub.OPFItem} */ this.xhtmlToc = null;
	/** @type {adapt.epub.OPFItem} */ this.cover = null;
	/** @type {Object.<string,string>} */ this.fallbackMap = {};
	/** @type {?vivliostyle.constants.PageProgression} */ this.pageProgression = null;
	/** @const */ this.documentURLTransformer = this.createDocumentURLTransformer();
	adapt.epub.checkMathJax();
};

adapt.epub.OPFDoc.prototype.createDocumentURLTransformer = function() {
	var self = this;

	/**
	 * @constructor
	 * @implements {adapt.base.DocumentURLTransformer}
     */
	function OPFDocumentURLTransformer() {}
	/**
	 * @override
     */
	OPFDocumentURLTransformer.prototype.transformFragment = function(fragment, baseURL) {
		var url = baseURL + (fragment ? "#" + fragment : "");
		return encodeURIComponent(url);
	};
	/**
	 * @override
     */
	OPFDocumentURLTransformer.prototype.transformURL = function(url, baseURL) {
		var r = url.match(/^([^#]*)#?(.*)$/);
		if (r) {
			var path = r[1] || baseURL;
			var fragment = r[2];
			if (path) {
				if (self.items.some(function(item) { return item.src === path; })) {
					return "#" + this.transformFragment(fragment, path);
				}
			}
		}
		return url;
	};
	/**
	 * @override
	 */
	OPFDocumentURLTransformer.prototype.restoreURL = function(encoded) {
		if (encoded.charAt(0) === "#") {
			encoded = encoded.substring(1);
		}
		var decoded = decodeURIComponent(encoded);
		var r = decoded.match(/^([^#]*)#?(.*)$/);
		return r ? [r[1], r[2]] : [];
	};

	return new OPFDocumentURLTransformer();
};

/**
 * Metadata is organized in the following way: fully-expanded property names (with IRI
 * prefixes prepended) point to an array of values. Array contains at least one element.
 * First element is primary and should be used by default.
 * Element values are objects have the following keys:
 * - "v" - item value as string,
 * - "s" - scheme,
 * - "o" - index in the order of appearing in the source,
 * - "r" - refinement submetadata (organized just like the top-level metadata).
 * @return {adapt.base.JSON}
 */
adapt.epub.OPFDoc.prototype.getMetadata = function() {
	return this.metadata;
};

/**
 * @param {string} url
 * @return {?string}
 */
adapt.epub.OPFDoc.prototype.getPathFromURL = function(url) {
	if (this.epubURL) {
		return url.substr(0, this.epubURL.length) == this.epubURL ?
				decodeURI(url.substr(this.epubURL.length)) : null;
	} else {
		return url;
	}
};

/**
 * @param {adapt.xmldoc.XMLDocHolder} opfXML
 * @param {adapt.xmldoc.XMLDocHolder} encXML
 * @param {adapt.base.JSON} zipMetadata
 * @param {string} manifestURL
 * @return {adapt.task.Result}
 */
adapt.epub.OPFDoc.prototype.initWithXMLDoc = function(opfXML, encXML, zipMetadata, manifestURL) {
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
	var srcToFallbackId = {};
	this.items = adapt.base.map(pkg.child("manifest").child("item").asArray(), 
		function(node) {
			var item = new adapt.epub.OPFItem();
			var elem = /** @type {Element} */ (node);
			item.initWithElement(elem, opfXML.url);
			var fallback = elem.getAttribute("fallback");
			if (fallback && !adapt.epub.supportedMediaTypes[item.mediaType]) {
				srcToFallbackId[item.src] = fallback;
			}
			if (!self.xhtmlToc && item.itemProperties["nav"]) {
				self.xhtmlToc = item;
			}
			if (!self.cover && item.itemProperties["cover-image"]) {
				self.cover = item;
			}
			return item;
		});
	this.itemMap = adapt.base.indexArray(this.items,
			/** @type {function(adapt.epub.OPFItem):?string} */ (adapt.epub.getOPFItemId));
	this.itemMapByPath = adapt.base.indexArray(this.items, function(item) {
				return self.getPathFromURL(item.src);
			});
	for (var src in srcToFallbackId) {
		var fallbackSrc = src;
		while(true) {
			var item = this.itemMap[srcToFallbackId[fallbackSrc]];
			if (!item) {
				break;
			}
			if (adapt.epub.supportedMediaTypes[item.mediaType]) {
				this.fallbackMap[src] = item.src;
				break;
			}
			fallbackSrc = item.src;
		}
	}
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
	var tocAttr = pkg.child("spine").attribute("toc")[0];
	if (tocAttr) {
		this.ncxToc = this.itemMap[tocAttr];
	}
	var pageProgressionAttr = pkg.child("spine").attribute("page-progression-direction")[0];
	if (pageProgressionAttr) {
		this.pageProgression = vivliostyle.constants.PageProgression.of(pageProgressionAttr);
	}
	var idpfObfURLs = !encXML ? [] : encXML.doc().child("encryption").child("EncryptedData")
		.predicate(adapt.xmldoc.predicate.withChild("EncryptionMethod",
				adapt.xmldoc.predicate.withAttribute("Algorithm",
						"http://www.idpf.org/2008/embedding")))
		.child("CipherData").child("CipherReference").attribute("URI");
	var mediaTypeElems = pkg.child("bindings").child("mediaType").asArray();
	for (var i = 0; i < mediaTypeElems.length; i++) {
		var handlerId = mediaTypeElems[i].getAttribute("handler");
        var mediaType = mediaTypeElems[i].getAttribute("media-type");
        if (mediaType && handlerId && this.itemMap[handlerId]) {
        	this.bindings[mediaType] = this.itemMap[handlerId].src;
        }
	}
	this.metadata = adapt.epub.readMetadata(pkg.child("metadata"), pkg.attribute("prefix")[0]);
	if (this.metadata[adapt.epub.metaTerms.language]) {
		this.lang = this.metadata[adapt.epub.metaTerms.language][0]["v"];
	}
	if (!zipMetadata) {
		if (idpfObfURLs.length > 0 && this.uid) {
			// Have to deobfuscate in JavaScript
			var deobfuscator = adapt.epub.makeDeobfuscator(this.uid);
			for (var i = 0; i < idpfObfURLs.length; i++) {
				this.store.deobfuscators[this.epubURL + idpfObfURLs[i]] = deobfuscator;
			}
		}
		return adapt.task.newResult(true);
	}
	var manifestText = new adapt.base.StringBuffer();
	var obfuscations = {};
	if (idpfObfURLs.length > 0 && this.uid) {
		// Deobfuscate in the server.
		var obfuscationKey = adapt.epub.makeObfuscationKey(this.uid);
		for (var i = 0; i < idpfObfURLs.length; i++) {
			obfuscations[idpfObfURLs[i]] = obfuscationKey;
		}
	}
	for (var i = 0; i < zipMetadata.length; i++) {
		var entry = zipMetadata[i];
		var encodedPath = entry["n"];
		if (encodedPath) {
			var path = decodeURI(encodedPath);
			var item = this.itemMapByPath[path];
			var mediaType = null;
			if (item) {
				item.compressed = entry["m"] != 0;
				item.compressedSize = entry["c"];
				if (item.mediaType) {
					mediaType = item.mediaType.replace(/\s+/g, "");
				}
			}
			var obfuscation = obfuscations[path];
			if (mediaType || obfuscation) {
				manifestText.append(encodedPath);
				manifestText.append(' ');
				manifestText.append(mediaType || "application/octet-stream");
				if (obfuscation) {
					manifestText.append(' ');
					manifestText.append(obfuscation);				
				}
				manifestText.append('\n');
			}
		}
	}
	self.assignAutoPages();
	return adapt.net.ajax(manifestURL, adapt.net.XMLHttpRequestResponseType.DEFAULT, "POST", manifestText.toString(), "text/plain");
};

/**
 * @return {void}
 */
adapt.epub.OPFDoc.prototype.assignAutoPages = function() {
	var epage = 0;
	for (var i = 0; i < this.spine.length; i++) {
		var item = this.spine[i];
		var epageCount = Math.ceil(item.compressedSize / 1024);
		item.epage = epage;
		item.epageCount = epageCount;
		epage += epageCount;
	}
	this.epageCount = epage;
};

/**
 * Creates a fake OPF "document" that contains a single OPS chapter.
 * @param {!Array<string>} urls OPS (XHTML) document URL
 * @param {?Document} doc
 */
adapt.epub.OPFDoc.prototype.initWithChapters = function(urls, doc) {
	this.itemMap = {};
	this.itemMapByPath = {};
	this.items = [];
	this.spine = this.items;
	// create a minimum fake OPF XML for navigation with EPUB CFI
	var opfXML = this.opfXML = new adapt.xmldoc.XMLDocHolder(null, "", new DOMParser().parseFromString("<spine></spine>", "text/xml"));

	urls.forEach(function(url, index) {
		var item = new adapt.epub.OPFItem();
		item.spineIndex = index;
		item.id = "item" + (index+1);
		item.src = url;

		var itemref = opfXML.document.createElement("itemref");
		itemref.setAttribute("idref", item.id);
		opfXML.root.appendChild(itemref);
		item.itemRefElement = itemref;

		this.itemMap[item.id] = item;
		this.itemMapByPath[url] = item;
		this.items.push(item);
	}, this);

    if (doc) {
        return this.store.addDocument(urls[0], doc);
    } else {
        return adapt.task.newResult(null);
    }
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
			vivliostyle.logging.logger.warn(err, "Cannot resolve fragment:", fragstr);
			frame.finish(null);
		});
};

/**
 * @param {number} epage
 * @return {!adapt.task.Result.<?adapt.epub.Position>}
 */
adapt.epub.OPFDoc.prototype.resolveEPage = function(epage) {
	var self = this;
	return adapt.task.handle("resolveEPage",
    	/**
    	 * @param {!adapt.task.Frame.<?adapt.epub.Position>} frame
    	 * @return {void}
    	 */			
		function(frame) {
			if (epage <= 0) {
				frame.finish({spineIndex: 0, offsetInItem: 0, pageIndex: -1});
				return;
			}
			var spineIndex = adapt.base.binarySearch(self.spine.length, function(index) {
				var item = self.spine[index];
				return item.epage + item.epageCount > epage;
			});
			var item = self.spine[spineIndex];
			self.store.load(item.src).then(function (xmldoc) {
				epage -= item.epage;
				if (epage > item.epageCount) {
					epage = item.epageCount;
				}
				var offset = 0;
				if (epage > 0) {
					var totalOffset = xmldoc.getTotalOffset();
					offset = Math.round(totalOffset * epage / item.epageCount);
					if (offset == totalOffset) {
						offset--;
					}
				}
				frame.finish({spineIndex: spineIndex, offsetInItem: offset, pageIndex: -1});
			});
		},
    	/**
    	 * @param {!adapt.task.Frame.<?adapt.epub.Position>} frame
    	 * @param {Error} err
    	 * @return {void}
    	 */					
		function(frame, err) {
			vivliostyle.logging.logger.warn(err, "Cannot resolve epage:", epage);
			frame.finish(null);
		});
};

/**
 * @param {adapt.epub.Position} position
 * @return {!adapt.task.Result.<number>}
 */
adapt.epub.OPFDoc.prototype.getEPageFromPosition = function(position) {
	var item = this.spine[position.spineIndex];
	if (position.offsetInItem <= 0) {
		return adapt.task.newResult(item.epage);
	}
	/** @type {!adapt.task.Frame.<number>} */ var frame = adapt.task.newFrame("getEPage");
	this.store.load(item.src).then(function (xmldoc) {
		var totalOffset = xmldoc.getTotalOffset();
		var offset = Math.min(totalOffset, position.offsetInItem);
		frame.finish(item.epage + offset * item.epageCount / totalOffset);
	});
	return frame.result();
};

/**
 * @typedef {{
 * 		item: adapt.epub.OPFItem,
 * 		xmldoc: adapt.xmldoc.XMLDocHolder,
 * 		instance: adapt.ops.StyleInstance,
 * 		layoutPositions: Array.<adapt.vtree.LayoutPosition>,
 * 		pages: Array.<adapt.vtree.Page>,
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
 * @param {!function(!Object<string, !{width: number, height: number}>, number, number)} pageSheetSizeReporter
 * @implements {adapt.vgen.CustomRendererFactory}
 */
adapt.epub.OPFView = function(opf, viewport, fontMapper, pref, pageSheetSizeReporter) {
	/** @const */ this.opf = opf;
	/** @const */ this.viewport = viewport;
	/** @const */ this.fontMapper = fontMapper;
	/** @const */ this.pageSheetSizeReporter = pageSheetSizeReporter;
	/** @type {Array.<adapt.epub.OPFViewItem>} */ this.spineItems = [];
	/** @type {number} */ this.spineIndex = 0;
	/** @type {number} */ this.pageIndex = 0;
	/** @type {number} */ this.offsetInItem = 0;
	/** @const */ this.pref = adapt.expr.clonePreferences(pref);
	/** @const */ this.clientLayout = new adapt.vgen.DefaultClientLayout(viewport.window);
};

/**
 * @return {boolean}
 */
adapt.epub.OPFView.prototype.isAtTheFirstPage = function() {
	return this.spineIndex == 0 && this.pageIndex == 0;
};

/**
 * @return {boolean}
 */
adapt.epub.OPFView.prototype.isAtTheLastPage = function() {
	if (this.spineIndex != this.opf.spine.length - 1) {
		return false;
	}
	var viewItem = this.spineItems[this.spineIndex];
	return viewItem && !viewItem.complete && this.pageIndex == viewItem.layoutPositions.length - 1;	
};

/**
 * @private
 * @returns {adapt.vtree.Page}
 */
adapt.epub.OPFView.prototype.getCurrentPage = function() {
    var viewItem = this.spineItems[this.spineIndex];
    return viewItem ? viewItem.pages[this.pageIndex] : null;
};

/**
 * @returns {?vivliostyle.constants.PageProgression}
 */
adapt.epub.OPFView.prototype.getCurrentPageProgression = function() {
	if (this.opf.pageProgression) {
		return this.opf.pageProgression;
	} else {
		var viewItem = this.spineItems[this.spineIndex];
		return viewItem ? viewItem.instance.pageProgression : null;
	}
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
		var resultPage = viewItem.pages[self.pageIndex];
        if (resultPage) {
            self.offsetInItem = resultPage.offset;
            frame.finish(resultPage);
            return;
        }
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
			var pos = viewItem.layoutPositions[viewItem.layoutPositions.length - 1];
			var page = self.makePage(viewItem, pos);
		    viewItem.instance.layoutNextPage(page, pos).then(function(posParam) {
                page.container.style.display = "none";
                page.container.style.visibility = "visible";
				page.container.style.position = "";
				page.container.style.top = "";
				page.container.style.left = "";
                page.container.setAttribute("data-vivliostyle-page-side", /** @type {string} */ (page.side));
				viewItem.instance.viewport.contentContainer.appendChild(page.container);
		    	pos = /** @type {adapt.vtree.LayoutPosition} */ (posParam);
				var pageIndex = pos ? pos.page - 1 : viewItem.layoutPositions.length - 1;
				self.pageSheetSizeReporter(viewItem.instance.pageSheetSize, viewItem.item.spineIndex, pageIndex);
			    if (pos) {
                    viewItem.pages[pageIndex] = page;
			    	viewItem.layoutPositions.push(pos);
			    	if (seekOffset >= 0) {
			    		// Searching for offset, don't know the page number.
			    		var offset = viewItem.instance.getPosition(pos);
			    		if (offset > seekOffset) {
					    	resultPage = page;
					    	self.pageIndex = viewItem.layoutPositions.length - 2;
							loopFrame.breakLoop();
			    			return;
			    		}
			    	}
                    page.isFirstPage = viewItem.item.spineIndex == 0 && pageIndex == 0;
			    	loopFrame.continueLoop();
			    } else {
                    viewItem.pages.push(page);
			    	resultPage = page;
			    	self.pageIndex = pageIndex;
			    	if (seekOffset < 0) {
			    		self.offsetInItem = page.offset;
			    	}
			    	viewItem.complete = true;
					page.isFirstPage = viewItem.item.spineIndex == 0 && pageIndex == 0;
					page.isLastPage = viewItem.item.spineIndex == self.opf.spine.length - 1;
					loopFrame.breakLoop();
			    }
		    });
		}).then(function() {
			resultPage = resultPage || viewItem.pages[self.pageIndex];
			var pos = viewItem.layoutPositions[self.pageIndex];
	    	if (seekOffset < 0) {
	    		self.offsetInItem = viewItem.instance.getPosition(pos);
	    	}
			if (resultPage) {
				frame.finish(resultPage);
				return;
			}
			var page = self.makePage(viewItem, pos);
		    viewItem.instance.layoutNextPage(page, pos).then(function(posParam) {
                page.container.style.display = "none";
                page.container.style.visibility = "visible";
				page.container.style.position = "";
				page.container.style.top = "";
				page.container.style.left = "";
                page.container.setAttribute("data-vivliostyle-page-side", /** @type {string} */ (page.side));
				viewItem.instance.viewport.contentContainer.appendChild(page.container);
		    	pos = /** @type {adapt.vtree.LayoutPosition} */ (posParam);
				var pageIndex = pos ? pos.page - 1 : viewItem.layoutPositions.length - 1;
				self.pageSheetSizeReporter(viewItem.instance.pageSheetSize, viewItem.item.spineIndex, pageIndex);
			    if (pos) {
                    viewItem.pages[pageIndex] = page;
			    	viewItem.layoutPositions[self.pageIndex + 1] = pos;
			    } else {
                    viewItem.pages.push(page);
			    	viewItem.complete = true;
			    	page.isLastPage = viewItem.item.spineIndex == self.opf.spine.length - 1;
			    }
				page.isFirstPage = viewItem.item.spineIndex == 0 && pageIndex == 0;
			    frame.finish(page);
		    });
		});		    
	});
	return frame.result();
};

/**
 * @returns {!adapt.task.Result.<adapt.vtree.Page>}
 */
adapt.epub.OPFView.prototype.renderAllPages = function() {
	return this.renderPagesUpto(this.opf.spine.length - 1, Number.POSITIVE_INFINITY);
};

/**
 * Render pages from (spineIndex=0, pageIndex=0) to the specified (spineIndex, pageIndex).
 * @param {number} spineIndex
 * @param {number} pageIndex
 * @returns {!adapt.task.Result.<adapt.vtree.Page>}
 */
adapt.epub.OPFView.prototype.renderPagesUpto = function(spineIndex, pageIndex) {
    var self = this;
    /** @type {!adapt.task.Frame.<adapt.vtree.Page>} */ var frame
        = adapt.task.newFrame("renderAllPages");

    // backup original values
    var origSpineIndex = self.spineIndex;
    var origPageIndex = self.pageIndex;

    self.spineIndex = 0;
    frame.loopWithFrame(function(loopFrame) {
        self.pageIndex = self.spineIndex == spineIndex ? pageIndex : Number.POSITIVE_INFINITY;
        self.renderPage().then(function() {
            if (++self.spineIndex > spineIndex) {
                loopFrame.breakLoop();
            } else {
                loopFrame.continueLoop();
            }
        });
    }).then(function() {
        self.spineIndex = origSpineIndex;
        self.pageIndex = origPageIndex;
        self.renderPage().thenFinish(frame);
    });
    return frame.result();
};

/**
 * Move to the first page and render it.
 * @return {!adapt.task.Result.<adapt.vtree.Page>}
 */
adapt.epub.OPFView.prototype.firstPage = function() {
	this.spineIndex = 0;
	this.pageIndex = 0;
	return this.renderPage();
};

/**
 * Move to the last page and render it.
 * @return {!adapt.task.Result.<adapt.vtree.Page>}
 */
adapt.epub.OPFView.prototype.lastPage = function() {
	this.spineIndex = this.opf.spine.length - 1;
	this.pageIndex = Number.POSITIVE_INFINITY;
	return this.renderPage();
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
 * @private
 * @param {adapt.vtree.Page} page This page should be a currently displayed page.
 * @returns {boolean}
 */
adapt.epub.OPFView.prototype.isRectoPage = function(page) {
    var isLeft = page.side === vivliostyle.constants.PageSide.LEFT;
    var isLTR = this.getCurrentPageProgression() === vivliostyle.constants.PageProgression.LTR;
    return (!isLeft && isLTR) || (isLeft && !isLTR);
};

/**
 * Get a spread containing the currently displayed page.
 * @return {!adapt.task.Result.<!adapt.vtree.Spread>}
 */
adapt.epub.OPFView.prototype.getCurrentSpread = function() {
    var self = this;
    /** @type {!adapt.task.Frame.<adapt.vtree.Spread>} */ var frame
        = adapt.task.newFrame("getCurrentSpread");

    var page = this.getCurrentPage();
    if (!page) {
        return adapt.task.newResult(/** @type adapt.vtree.Spread */ ({left: null, right: null}));
    }

    // backup original values
    var spineIndex = self.spineIndex;
    var pageIndex = self.pageIndex;

    var isLeft = page.side === vivliostyle.constants.PageSide.LEFT;
    var other;
    if (this.isRectoPage(page)) {
        other = this.previousPage();
    } else {
        other = this.nextPage();
    }
    other.then(function(otherPage) {
        // restore original values
        self.spineIndex = spineIndex;
        self.pageIndex = pageIndex;
        self.renderPage().then(function() {
            if (isLeft) {
                frame.finish({left: page, right: otherPage});
            } else {
                frame.finish({left: otherPage, right: page});
            }
        });
    });

    return frame.result();
};

/**
 * Move to the next spread and render pages.
 * @returns {!adapt.task.Result.<adapt.vtree.Page>} The 'verso' page of the next spread.
 */
adapt.epub.OPFView.prototype.nextSpread = function() {
    var page = this.getCurrentPage();
    if (!page) {
        return adapt.task.newResult(/** @type {adapt.vtree.Page} */ (null));
    }
    var isRecto = this.isRectoPage(page);
    var next = this.nextPage();
    if (isRecto) {
        return next;
    } else {
        var self = this;
        return next.thenAsync(function(page) {
            return self.nextPage();
        });
    }
};

/**
 * Move to the previous spread and render pages.
 * @returns {!adapt.task.Result.<adapt.vtree.Page>} The 'recto' page of the previous spread.
 */
adapt.epub.OPFView.prototype.previousSpread = function() {
    var page = this.getCurrentPage();
    if (!page) {
        return adapt.task.newResult(/** @type {adapt.vtree.Page} */ (null));
    }
    var isRecto = this.isRectoPage(page);
    var prev = this.previousPage();
    if (isRecto) {
        var self = this;
        return prev.thenAsync(function(page) {
            return self.previousPage();
        });
    } else {
        return prev;
    }
};

/**
 * Move to the epage specified by the given number (zero-based) and render it.
 * @param {number} epage
 * @return {!adapt.task.Result.<adapt.vtree.Page>}
 */
adapt.epub.OPFView.prototype.navigateToEPage = function(epage) {
	/** @type {!adapt.task.Frame.<adapt.vtree.Page>} */ var frame
		= adapt.task.newFrame("navigateToEPage");
	var self = this;
	this.opf.resolveEPage(epage).then(function(position) {
		if (position) {
			self.spineIndex = position.spineIndex;
			self.pageIndex = position.pageIndex;
			self.offsetInItem = position.offsetInItem;
		}
		self.renderPage().thenFinish(frame);
	});
	return frame.result();
};

/**
 * Move to the page specified by the given CFI and render it.
 * @param {string} fragment
 * @return {!adapt.task.Result.<adapt.vtree.Page>}
 */
adapt.epub.OPFView.prototype.navigateToFragment = function(fragment) {
	/** @type {!adapt.task.Frame.<adapt.vtree.Page>} */ var frame
		= adapt.task.newFrame("navigateToCFI");
	var self = this;
	self.opf.resolveFragment(fragment).then(function(position) {
		if (position) {
			self.spineIndex = position.spineIndex;
			self.pageIndex = position.pageIndex;
			self.offsetInItem = position.offsetInItem;
		}
		self.renderPage().thenFinish(frame);		
	});
	return frame.result();
};


/**
 * Move to the page specified by the given URL and render it.
 * @param {string} href
 * @return {!adapt.task.Result.<adapt.vtree.Page>}
 */
adapt.epub.OPFView.prototype.navigateTo = function(href) {
	vivliostyle.logging.logger.debug("Navigate to", href);
	var path = this.opf.getPathFromURL(adapt.base.stripFragment(href));
	if (!path) {
		if (this.opf.opfXML && href.match(/^#epubcfi\(/)) {
			// CFI fragment is "relative" to OPF.
			path = this.opf.getPathFromURL(this.opf.opfXML.url);
		} else if (href.charAt(0) === "#") {
			var restored = this.opf.documentURLTransformer.restoreURL(href);
			if (this.opf.opfXML) {
				path = this.opf.getPathFromURL(restored[0]);
			} else {
				path = restored[0];
			}
			href = path + (restored[1] ? "#" + restored[1] : "");
		}
		if (path == null) {
			return adapt.task.newResult(/** @type {adapt.vtree.Page} */ (null));		
		}
	}
	var item = this.opf.itemMapByPath[path];
	if (!item) {
		if (this.opf.opfXML && path == this.opf.getPathFromURL(this.opf.opfXML.url)) {
			// CFI link?
			var fragmentIndex = href.indexOf("#");
			if (fragmentIndex >= 0) {
				return this.navigateToFragment(href.substr(fragmentIndex + 1));
			}
		}
		return adapt.task.newResult(/** @type {adapt.vtree.Page} */ (null));
	}
	// Committed to navigate. If not moving to a different item, current
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
 * @param {adapt.epub.OPFViewItem} viewItem
 * @param {adapt.vtree.LayoutPosition} pos
 * @return {!adapt.vtree.Page}
 */
adapt.epub.OPFView.prototype.makePage = function(viewItem, pos) {
	var viewport = viewItem.instance.viewport;

    var pageCont = /** @type {HTMLElement} */ (viewport.document.createElement("div"));
	pageCont.setAttribute("data-vivliostyle-page-container", true);
	pageCont.style.position = "absolute";
	pageCont.style.top = "0";
	pageCont.style.left = "0";
	if (!vivliostyle.constants.isDebug) {
		pageCont.style.visibility = "hidden";
	}
	viewport.root.appendChild(pageCont);

	var bleedBox = /** @type {HTMLElement} */ (viewport.document.createElement("div"));
	bleedBox.setAttribute("data-vivliostyle-bleed-box", true);
	pageCont.appendChild(bleedBox);

    var page = new adapt.vtree.Page(pageCont, bleedBox);
    page.spineIndex = viewItem.item.spineIndex;
    page.position = pos;
    page.offset = viewItem.instance.getPosition(pos);
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
 * @param {Element} srcElem
 * @param {Element} viewParent
 * @return {!adapt.task.Result.<Element>}
 */
adapt.epub.OPFView.prototype.makeObjectView = function(xmldoc, srcElem, viewParent, computedStyle) {
	var data = srcElem.getAttribute("data");
	/** @type {Element} */ var result = null;
	if (data) {
		data = adapt.base.resolveURL(data, xmldoc.url);
		var mediaType = srcElem.getAttribute("media-type");
		if (!mediaType) {
			var path = this.opf.getPathFromURL(data);
			if (path) {
				var item = this.opf.itemMapByPath[path];
				if (item) {
					mediaType = item.mediaType;
				}
			}
		}
		if (mediaType) {
			var handlerSrc = this.opf.bindings[mediaType];
			if (handlerSrc) {
				result = this.viewport.document.createElement("iframe");
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
	if (!result) {
		result = this.viewport.document.createElement("span");
		result.setAttribute("data-adapt-process-children", "true");
	}
	// Need to cast because we need {Element}, not {!Element}
	return adapt.task.newResult(/** @type {Element} */ (result));
};


/**
 * @param {adapt.xmldoc.XMLDocHolder} xmldoc
 * @param {Element} srcElem
 * @param {Element} viewParent
 * @return {!adapt.task.Result.<Element>}
 */
adapt.epub.OPFView.prototype.makeMathJaxView = function(xmldoc, srcElem, viewParent, computedStyle) {
	// See if MathJax installed, use it if it is.
	var hub = adapt.epub.getMathJaxHub();
	if (hub) {
		var doc = viewParent.ownerDocument;
		var span = doc.createElement("span");
		viewParent.appendChild(span);
		var clonedMath = doc.importNode(srcElem, true);
		span.appendChild(clonedMath);
		var queue = hub["queue"];
		queue["Push"](["Typeset", hub, span]);
		/** @type {!adapt.task.Frame.<Element>} */ var frame
					= adapt.task.newFrame("navigateToEPage");
		var continuation = frame.suspend();
		queue["Push"](function() {
			continuation.schedule(span);
		});
		return frame.result();
	}
	return adapt.task.newResult(/** @type {Element} */ (null));
};

// TODO move makeSSEView to a more appropriate class (SSE XML content is not allowed in EPUB)
/**
 * @param {adapt.xmldoc.XMLDocHolder} xmldoc
 * @param {Element} srcElem
 * @param {Element} viewParent
 * @param computedStyle
 * @returns {!adapt.task.Result.<Element>}
 */
adapt.epub.OPFView.prototype.makeSSEView = function(xmldoc, srcElem, viewParent, computedStyle) {
    var doc = viewParent ? viewParent.ownerDocument : this.viewport.document;
    var srcTagName = srcElem.localName;
    var tagName;
    switch (srcTagName) {
        case "t":
        case "tab":
        case "ec":
        case "nt":
        case "fraction":
        case "comment":
        case "mark":
            tagName = "span";
            break;
        case "ruby":
        case "rp":
        case "rt":
            tagName = srcTagName;
            break;
        default:
            tagName = "div";
    }
    var result = doc.createElement(tagName);
    result.setAttribute("data-adapt-process-children", "true");
    // Need to cast because we need {Element}, not {!Element}
    return adapt.task.newResult(/** @type {Element} */ (result));
};

/**
 * @param {adapt.xmldoc.XMLDocHolder} xmldoc
 * @return {adapt.vgen.CustomRenderer}
 * @override
 */
adapt.epub.OPFView.prototype.makeCustomRenderer = function(xmldoc) {
	var self = this;
	return (
	/**
	 * @param {Element} srcElem
	 * @param {Element} viewParent
	 * @return {!adapt.task.Result.<Element>}
	 */
	function(srcElem, viewParent, computedStyle) {
		if (srcElem.localName == "object" && srcElem.namespaceURI == adapt.base.NS.XHTML) {
			return self.makeObjectView(xmldoc, srcElem, viewParent, computedStyle);
		} else if (srcElem.namespaceURI == adapt.base.NS.MATHML) {
			return self.makeMathJaxView(xmldoc, srcElem, viewParent, computedStyle);
		} else if (srcElem.namespaceURI == adapt.base.NS.SSE) {
            return self.makeSSEView(xmldoc, srcElem, viewParent, computedStyle);
        } else if (srcElem.dataset && srcElem.dataset["mathTypeset"] == "true") {
			return self.makeMathJaxView(xmldoc, srcElem, viewParent, computedStyle);
        }
		return adapt.task.newResult(/** @type {Element} */ (null));
	}
	);
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
    	if (item.epageCount == 0 && self.opf.spine.length == 1) {
    		// Single-chapter doc without epages (e.g. FB2).
    		// Estimate that offset=2700 roughly corresponds to 1024 bytes of compressed size. 
    		item.epageCount = Math.ceil(xmldoc.getTotalOffset() / 2700);
    		self.opf.epageCount = item.epageCount;
    	}
    	var style = store.getStyleForDoc(xmldoc);
    	var customRenderer = self.makeCustomRenderer(xmldoc);
    	var viewport = self.viewport;
    	var viewportSize = style.sizeViewport(viewport.width, viewport.height, viewport.fontSize);
    	if (viewportSize.width != viewport.width || viewportSize.height != viewport.height ||
    			viewportSize.fontSize != viewport.fontSize) {
    		viewport = new adapt.vgen.Viewport(viewport.window, viewportSize.fontSize, viewport.root,
    				viewportSize.width, viewportSize.height);
    	}
		var previousViewItem = self.spineItems[self.spineIndex - 1];
		var pageNumberOffset = previousViewItem ?
			previousViewItem.instance.pageNumberOffset + previousViewItem.pages.length : 0;

        var instance = new adapt.ops.StyleInstance(style, xmldoc, self.opf.lang,
			viewport, self.clientLayout, self.fontMapper, customRenderer, self.opf.fallbackMap, pageNumberOffset,
			self.opf.documentURLTransformer);

		if (previousViewItem) {
			instance.pageCounterStore.copyFrom(previousViewItem.instance.pageCounterStore);
		}
        instance.pref = self.pref;
        instance.init().then(function() {
			viewItem = {item: item, xmldoc: xmldoc, instance: instance,
					layoutPositions: [null], pages: [], complete: false};
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
	return this.renderPagesUpto(this.spineIndex, this.pageIndex);
};

adapt.epub.OPFView.prototype.removeRenderedPages = function() {
    var items = this.spineItems;
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (item) {
            var pages = item.pages;
            var page;
            while (page = pages.shift()) {
                var container = page.container;
                container.parentNode.removeChild(container);
            }
        }
    }
};

/**
 * Returns if at least one page has 'auto' size
 * @returns {boolean}
 */
adapt.epub.OPFView.prototype.hasAutoSizedPages = function() {
	var items = this.spineItems;
	for (var i = 0; i < items.length; i++) {
		var item = items[i];
		if (item) {
			var pages = item.pages;
			for (var j = 0; j < pages.length; j++) {
				var page = pages[j];
				if (page.isAutoPageWidth && page.isAutoPageHeight) {
					return true;
				}
			}
		}
	}
	return false;
};

/**
 * @param {boolean} autohide
 * @return {!adapt.task.Result.<adapt.vtree.Page>}
 */
adapt.epub.OPFView.prototype.showTOC = function(autohide) {
	var opf = this.opf;
	var toc = opf.xhtmlToc || opf.ncxToc;
	if (!toc) {
		return adapt.task.newResult(/** @type {adapt.vtree.Page} */ (null));
	}
	/** @type {!adapt.task.Frame.<adapt.vtree.Page>} */ var frame
			= adapt.task.newFrame("showTOC");
	if (!this.tocView) {
		this.tocView = new adapt.toc.TOCView(opf.store, toc.src, opf.lang, 
				this.clientLayout, this.fontMapper, this.pref, this, opf.fallbackMap, opf.documentURLTransformer);
	}
	var viewport = this.viewport;
	var tocWidth = Math.min(350, Math.round(0.67 * viewport.width) - 16);
	var tocHeight = viewport.height - 6;
    var pageCont = /** @type {HTMLElement} */ (viewport.document.createElement("div"));
    viewport.root.appendChild(pageCont);
    pageCont.style.position = "absolute";
    pageCont.style.visibility = "hidden";
    pageCont.style.left = "3px";
    pageCont.style.top = "3px";
    pageCont.style.width = (tocWidth + 10) + "px";
    pageCont.style.maxHeight = tocHeight + "px";
    pageCont.style.overflow = "scroll";
    pageCont.style.overflowX = "hidden";
    pageCont.style.background = "#EEE";
    pageCont.style.border = "1px outset #999";
    pageCont.style["borderRadius"] = "2px";
    pageCont.style["boxShadow"] = " 5px 5px rgba(128,128,128,0.3)";
	this.tocView.showTOC(pageCont, viewport, tocWidth, tocHeight, this.viewport.fontSize).then(function(page) {
	    pageCont.style.visibility = "visible";
	    frame.finish(page);
	});
	return frame.result();
};

/**
 * @return {void}
 */
adapt.epub.OPFView.prototype.hideTOC = function() {
	if (this.tocView) {
		this.tocView.hideTOC();
	}
};

/**
 * @return {boolean}
 */
adapt.epub.OPFView.prototype.isTOCVisible = function(autohide) {
	return this.tocView && this.tocView.isTOCVisible();
};

