/**
 * Copyright 2013 Google, Inc.
 * Copyright 2015 Trim-marks Inc.
 * Copyright 2018 Vivliostyle Foundation
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
 * @fileoverview Deal with META-INF/ and .opf files in EPUB container.
 */
goog.provide('adapt.epub');

goog.require("goog.asserts");
goog.require("vivliostyle.constants");
goog.require("vivliostyle.logging");
goog.require('adapt.net');
goog.require('adapt.xmldoc');
goog.require('adapt.csscasc');
goog.require('adapt.font');
goog.require('vivliostyle.counters');
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
    const self = this;
    return (
        /**
         * @param {string} url
         * @return {?function(Blob):adapt.task.Result.<Blob>}
         */
        url => {
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
    const self = this;
    /** @type {!adapt.task.Frame.<adapt.epub.OPFDoc>} */ const frame
        = adapt.task.newFrame("loadEPUBDoc");
    if (url.substring(url.length - 1) !== "/") {
        url = `${url}/`;
    }
    if (haveZipMetadata) {
        self.startLoadingAsJSON(`${url}?r=list`);
    }
    self.startLoadingAsPlainXML(`${url}META-INF/encryption.xml`);
    const containerURL = `${url}META-INF/container.xml`;
    self.loadAsPlainXML(containerURL, true, `Failed to fetch EPUB container.xml from ${containerURL}`).then(containerXML => {
        if (!containerXML) {
            vivliostyle.logging.logger.error(`Received an empty response for EPUB container.xml ${containerURL}. This may be caused by the server not allowing cross origin requests.`);
        } else {
            const roots = containerXML.doc().child("container").child("rootfiles")
                .child("rootfile").attribute("full-path");

            for (const root of roots) {
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
    const self = this;
    const url = epubURL + root;
    let opf = self.opfByURL[url];
    if (opf) {
        return adapt.task.newResult(opf);
    }
    /** @type {!adapt.task.Frame.<adapt.epub.OPFDoc>} */ const frame
        = adapt.task.newFrame("loadOPF");
    self.loadAsPlainXML(url).then(opfXML => {
        if (!opfXML) {
            vivliostyle.logging.logger.error(`Received an empty response for EPUB OPF ${url}. This may be caused by the server not allowing cross origin requests.`);
        } else {
            self.loadAsPlainXML(`${epubURL}META-INF/encryption.xml`).then(encXML => {
                const zipMetadataResult = haveZipMetadata ?
                    self.loadAsJSON(`${epubURL}?r=list`) : adapt.task.newResult(null);
                zipMetadataResult.then(zipMetadata => {
                    opf = new adapt.epub.OPFDoc(self, epubURL);
                    opf.initWithXMLDoc(opfXML, encXML, zipMetadata, `${epubURL}?r=manifest`).then(() => {
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
    const frame = adapt.task.newFrame("EPUBDocStore.load");
    const docURL = adapt.base.stripFragment(url);
    const r = this.documents[docURL] = this.parseOPSResource(
        {status: 200, url: docURL, contentType: doc.contentType, responseText: null, responseXML: doc, responseBlob: null}
    );
    r.thenFinish(frame);
    return frame.result();
};

/**
 * @override
 */
adapt.epub.EPUBDocStore.prototype.load = function(url) {
    const docURL = adapt.base.stripFragment(url);
    let r = this.documents[docURL];
    if (r) {
        return r.isPending() ? r : adapt.task.newResult(r.get());
    } else {
        const frame = adapt.task.newFrame("EPUBDocStore.load");
        r = adapt.epub.EPUBDocStore.superClass_.load.call(this, docURL, true, `Failed to fetch a source document from ${docURL}`);
        r.then(xmldoc => {
            if (!xmldoc) {
                vivliostyle.logging.logger.error(`Received an empty response for ${docURL}. This may be caused by the server not allowing cross origin requests.`);
            } else {
                frame.finish(xmldoc);
            }
        });
        return frame.result();
    }
};

/**
 * @typedef {{
 *     url: string,
 *     index: number,
 *     startPage: ?number,
 *     skipPagesBefore: ?number
 * }}
 */
adapt.epub.OPFItemParam;

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
    /** @type {?number} */ this.startPage = null;
    /** @type {?number} */ this.skipPagesBefore = null;
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
    const propStr = itemElem.getAttribute("properties");
    if (propStr) {
        this.itemProperties = adapt.base.arrayToSet(propStr.split(/\s+/));
    }
};

/**
 * @param {!adapt.epub.OPFItemParam} param
 */
adapt.epub.OPFItem.prototype.initWithParam = function(param) {
    this.spineIndex = param.index;
    this.id = `item${param.index+1}`;
    this.src = param.url;
    this.startPage = param.startPage;
    this.skipPagesBefore = param.skipPagesBefore;
};

/**
 * @param {adapt.epub.OPFItem} item
 * @return {?string}
 */
adapt.epub.getOPFItemId = item => item.id;

/**
 * @param {string} uid
 * @return {function(Blob):adapt.task.Result.<Blob>}
 */
adapt.epub.makeDeobfuscator = uid => {
    // TODO: use UTF8 of uid
    const sha1 = adapt.sha1.bytesToSHA1Int8(uid);
    return blob => {
        const frame = /** @type {adapt.task.Frame.<Blob>} */ (adapt.task.newFrame("deobfuscator"));
        let head;
        let tail;
        if (blob.slice) {
            head = blob.slice(0, 1040);
            tail = blob.slice(1040, blob.size);
        } else {
            head = blob["webkitSlice"](0, 1040);
            tail = blob["webkitSlice"](1040, blob.size - 1040);
        }
        adapt.net.readBlob(head).then(buf => {
            const dataView = new DataView(buf);
            for (let k = 0; k < dataView.byteLength; k++) {
                let b = dataView.getUint8(k);
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
adapt.epub.makeObfuscationKey = uid => `1040:${adapt.sha1.bytesToSHA1Hex(uid)}`;

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
    "rendition": "http://www.idpf.org/vocab/rendition/#",
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
    language: `${adapt.epub.predefinedPrefixes["dcterms"]}language`,
    title: `${adapt.epub.predefinedPrefixes["dcterms"]}title`,
    creator: `${adapt.epub.predefinedPrefixes["dcterms"]}creator`,
    layout: `${adapt.epub.predefinedPrefixes["rendition"]}layout`,
    titleType: `${adapt.epub.defaultIRI}title-type`,
    displaySeq: `${adapt.epub.defaultIRI}display-seq`,
    alternateScript: `${adapt.epub.defaultIRI}alternate-script`
};

/**
 * @param {string} term
 * @param {string} lang
 * @return {function(adapt.base.JSON,adapt.base.JSON):number}
 */
adapt.epub.getMetadataComparator = (term, lang) => {
    const empty = {};
    return (item1, item2) => {
        let m1;
        let m2;
        const r1 = item1["r"] || empty;
        const r2 = item2["r"] || empty;
        if (term == adapt.epub.metaTerms.title) {
            m1 = r1[adapt.epub.metaTerms.titleType] == "main";
            m2 = r2[adapt.epub.metaTerms.titleType] == "main";
            if (m1 != m2) {
                return m1 ? -1 : 1;
            }
        }
        let i1 = parseInt(r1[adapt.epub.metaTerms.displaySeq], 10);
        if (isNaN(i1)) {
            i1 = Number.MAX_VALUE;
        }
        let i2 = parseInt(r2[adapt.epub.metaTerms.displaySeq], 10);
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
adapt.epub.readMetadata = (mroot, prefixes) => {
    // Parse prefix map (if any)
    let prefixMap;
    if (!prefixes) {
        prefixMap = adapt.epub.predefinedPrefixes;
    } else {
        prefixMap = {};
        for (const pn in adapt.epub.predefinedPrefixes) {
            prefixMap[pn] = adapt.epub.predefinedPrefixes[pn];
        }
        let r;
        // This code permits any non-ASCII characters in the name to avoid bloating the pattern.
        while ((r = prefixes.match(/^\s*([A-Z_a-z\u007F-\uFFFF][-.A-Z_a-z0-9\u007F-\uFFFF]*):\s*(\S+)/)) != null) {
            prefixes = prefixes.substr(r[0].length);
            prefixMap[r[1]] = r[2];
        }
    }
    /**
     * @param {?string} val
     * @return {?string}
     */
    const resolveProperty = val => {
        if (val) {
            const r = val.match(/^\s*(([^:]*):)?(\S+)\s*$/);
            if (r) {
                const iri = r[2] ? prefixMap[r[2]] : adapt.epub.defaultIRI;
                if (iri) {
                    return iri + r[3];
                }
            }
        }
        return null;
    };
    let order = 1;
    // List of metadata items.
    const rawItems = mroot.childElements().forEachNonNull(node => {
        if (node.localName == "meta") {
            const p = resolveProperty(node.getAttribute("property"));
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
    const rawItemsByTarget = adapt.base.multiIndexArray(rawItems,
        rawItem => rawItem.refines);
    const makeMetadata = map => adapt.base.mapObj(map, (rawItemArr, itemName) => {
        const result = adapt.base.map(rawItemArr, rawItem => {
            const entry = {"v": rawItem.value, "o": rawItem.order};
            if (rawItem.schema) {
                entry["s"] = rawItem.scheme;
            }
            if (rawItem.id || rawItem.lang) {
                let refs = rawItemsByTarget[rawItem.id];
                if (refs || rawItem.lang) {
                    if (rawItem.lang) {
                        // Special handling for xml:lang
                        const langItem = {name:adapt.epub.metaTerms.language, value:rawItem.lang,
                            lang:null, id:null, refines:rawItem.id, scheme:null,
                            order: rawItem.order};
                        if (refs) {
                            refs.push(langItem);
                        } else {
                            refs = [langItem];
                        }
                    }
                    const entryMap = adapt.base.multiIndexArray(refs, rawItem => rawItem.name);
                    entry["r"] = makeMetadata(entryMap);
                }
            }
            return entry;
        });
        return result;
    });
    const metadata = makeMetadata(adapt.base.multiIndexArray(rawItems,
        rawItem => rawItem.refines ? null : rawItem.name));
    let lang = null;
    if (metadata[adapt.epub.metaTerms.language]) {
        lang = metadata[adapt.epub.metaTerms.language][0]["v"];
    }
    const sortMetadata = metadata => {
        for (const term in metadata) {
            const arr = /** @type {Array} */ (metadata[term]);
            arr.sort(adapt.epub.getMetadataComparator(term, lang));
            for (let i = 0; i < arr.length; i++) {
                const r = arr[i]["r"];
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
adapt.epub.getMathJaxHub = () => {
    const math = window["MathJax"];
    if (math) {
        return math["Hub"];
    }
    return null;
};

/**
 * @return {void}
 */
adapt.epub.checkMathJax = () => {
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

/** @private @const */
adapt.epub.transformedIdPrefix = "viv-id-";

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
    /** @type {boolean} */ this.prePaginated = false;
    /** @type {boolean} */ this.epageIsRenderedPage = false;
    /** @type {?function(number)} */ this.epageCountCallback = null;
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
    const self = this;

    /**
     * @implements {adapt.base.DocumentURLTransformer}
     */
    class OPFDocumentURLTransformer {
        /**
         * @override
         */
        transformFragment(fragment, baseURL) {
            const url = baseURL + (fragment ? `#${fragment}` : "");
            return adapt.epub.transformedIdPrefix + adapt.base.escapeNameStrToHex(url, ":");
        }

        /**
         * @override
         */
        transformURL(url, baseURL) {
            const r = url.match(/^([^#]*)#?(.*)$/);
            if (r) {
                const path = r[1] || baseURL;
                const fragment = r[2];
                if (path) {
                    if (self.items.some(item => item.src === path)) {
                        return `#${this.transformFragment(fragment, path)}`;
                    }
                }
            }
            return url;
        }

        /**
         * @override
         */
        restoreURL(encoded) {
            if (encoded.charAt(0) === "#") {
                encoded = encoded.substring(1);
            }
            if (encoded.indexOf(adapt.epub.transformedIdPrefix) === 0) {
                encoded = encoded.substring(adapt.epub.transformedIdPrefix.length);
            }
            const decoded = adapt.base.unescapeStrFromHex(encoded, ":");
            const r = decoded.match(/^([^#]*)#?(.*)$/);
            return r ? [r[1], r[2]] : [];
        }
    }

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
    const self = this;
    this.opfXML = opfXML;
    this.encXML = encXML;
    const pkg = opfXML.doc().child("package");
    const uidref = pkg.attribute("unique-identifier")[0];
    if (uidref) {
        const uidElem = opfXML.getElement(`${opfXML.url}#${uidref}`);
        if (uidElem) {
            this.uid = uidElem.textContent.replace(/[ \n\r\t]/g, '');
        }
    }
    const srcToFallbackId = {};
    this.items = adapt.base.map(pkg.child("manifest").child("item").asArray(),
        node => {
            const item = new adapt.epub.OPFItem();
            const elem = /** @type {Element} */ (node);
            item.initWithElement(elem, opfXML.url);
            const fallback = elem.getAttribute("fallback");
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
    this.itemMapByPath = adapt.base.indexArray(this.items, item => self.getPathFromURL(item.src));
    for (const src in srcToFallbackId) {
        let fallbackSrc = src;
        while (true) {
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
        (node, index) => {
            const elem = /** @type {Element} */ (node);
            const id = elem.getAttribute("idref");
            const item = self.itemMap[/** @type {string} */ (id)];
            if (item) {
                item.itemRefElement = elem;
                item.spineIndex = index;
            }
            return item;
        });
    const tocAttr = pkg.child("spine").attribute("toc")[0];
    if (tocAttr) {
        this.ncxToc = this.itemMap[tocAttr];
    }
    const pageProgressionAttr = pkg.child("spine").attribute("page-progression-direction")[0];
    if (pageProgressionAttr) {
        this.pageProgression = vivliostyle.constants.PageProgression.of(pageProgressionAttr);
    }
    const idpfObfURLs = !encXML ? [] : encXML.doc().child("encryption").child("EncryptedData")
        .predicate(adapt.xmldoc.predicate.withChild("EncryptionMethod",
            adapt.xmldoc.predicate.withAttribute("Algorithm",
                "http://www.idpf.org/2008/embedding")))
        .child("CipherData").child("CipherReference").attribute("URI");
    const mediaTypeElems = pkg.child("bindings").child("mediaType").asArray();
    for (var i = 0; i < mediaTypeElems.length; i++) {
        const handlerId = mediaTypeElems[i].getAttribute("handler");
        var mediaType = mediaTypeElems[i].getAttribute("media-type");
        if (mediaType && handlerId && this.itemMap[handlerId]) {
            this.bindings[mediaType] = this.itemMap[handlerId].src;
        }
    }
    this.metadata = adapt.epub.readMetadata(pkg.child("metadata"), pkg.attribute("prefix")[0]);
    if (this.metadata[adapt.epub.metaTerms.language]) {
        this.lang = this.metadata[adapt.epub.metaTerms.language][0]["v"];
    }
    if (this.metadata[adapt.epub.metaTerms.layout]) {
        this.prePaginated = this.metadata[adapt.epub.metaTerms.layout][0]["v"] === "pre-paginated";
    }

    if (!zipMetadata) {
        if (idpfObfURLs.length > 0 && this.uid) {
            // Have to deobfuscate in JavaScript
            const deobfuscator = adapt.epub.makeDeobfuscator(this.uid);
            for (var i = 0; i < idpfObfURLs.length; i++) {
                this.store.deobfuscators[this.epubURL + idpfObfURLs[i]] = deobfuscator;
            }
        }
        if (this.prePaginated) {
            this.assignAutoPages();
        }
        return adapt.task.newResult(true);
    }
    const manifestText = new adapt.base.StringBuffer();
    const obfuscations = {};
    if (idpfObfURLs.length > 0 && this.uid) {
        // Deobfuscate in the server.
        const obfuscationKey = adapt.epub.makeObfuscationKey(this.uid);
        for (var i = 0; i < idpfObfURLs.length; i++) {
            obfuscations[idpfObfURLs[i]] = obfuscationKey;
        }
    }
    for (var i = 0; i < zipMetadata.length; i++) {
        const entry = zipMetadata[i];
        const encodedPath = entry["n"];
        if (encodedPath) {
            const path = decodeURI(encodedPath);
            var item = this.itemMapByPath[path];
            var mediaType = null;
            if (item) {
                item.compressed = entry["m"] != 0;
                item.compressedSize = entry["c"];
                if (item.mediaType) {
                    mediaType = item.mediaType.replace(/\s+/g, "");
                }
            }
            const obfuscation = obfuscations[path];
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
    let epage = 0;

    for (const item of this.spine) {
        const epageCount = this.prePaginated ? 1 : Math.ceil(item.compressedSize / 1024);
        item.epage = epage;
        item.epageCount = epageCount;
        epage += epageCount;
    }

    this.epageCount = epage;

    if (this.epageCountCallback) {
        this.epageCountCallback(this.epageCount);
    }
};

/**
 * @param {boolean} epageIsRenderedPage
 * @param {?function(number)} epageCountCallback
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.epub.OPFDoc.prototype.countPages = function(epageIsRenderedPage, epageCountCallback) {
    this.epageIsRenderedPage = epageIsRenderedPage || this.prePaginated;
    this.epageCountCallback = epageCountCallback;

    if (this.epageIsRenderedPage) {
        if (this.epageCount == 0) {
            this.assignAutoPages();
        }
        return adapt.task.newResult(true);
    }

    let epage = 0;
    let i = 0;
    /** @type {!adapt.task.Frame.<boolean>} */ const frame = adapt.task.newFrame("estimatePageCount");
    frame.loopWithFrame(loopFrame => {
        if (i === this.spine.length) {
            loopFrame.breakLoop();
            return;
        }
        const item = this.spine[i++];
        item.epage = epage;
        this.store.load(item.src).then(xmldoc => {
            // According to the old comment,
            // "Estimate that offset=2700 roughly corresponds to 1024 bytes of compressed size."
            // However, it should depend on the language.
            let offsetPerEPage = 2700;
            const lang = xmldoc.lang || this.lang;
            if (lang && lang.match(/^(ja|ko|zh)/)) {
                offsetPerEPage /= 3;
            }
            item.epageCount = Math.ceil(xmldoc.getTotalOffset() / offsetPerEPage);
            epage += item.epageCount;
            this.epageCount = epage;
            if (this.epageCountCallback) {
                this.epageCountCallback(this.epageCount);
            }
            loopFrame.continueLoop();
        });
    }).thenFinish(frame);
    return frame.result();
};

/**
 * Creates a fake OPF "document" that contains OPS chapters.
 * @param {!Array<!adapt.epub.OPFItemParam>} params
 * @param {?Document} doc
 */
adapt.epub.OPFDoc.prototype.initWithChapters = function(params, doc) {
    this.itemMap = {};
    this.itemMapByPath = {};
    this.items = [];
    this.spine = this.items;
    // create a minimum fake OPF XML for navigation with EPUB CFI
    const opfXML = this.opfXML = new adapt.xmldoc.XMLDocHolder(null, "", new DOMParser().parseFromString("<spine></spine>", "text/xml"));

    params.forEach(function(param) {
        const item = new adapt.epub.OPFItem();
        item.initWithParam(param);
        goog.asserts.assert(item.id);

        const itemref = opfXML.document.createElement("itemref");
        itemref.setAttribute("idref", item.id);
        opfXML.root.appendChild(itemref);
        item.itemRefElement = itemref;

        this.itemMap[item.id] = item;
        this.itemMapByPath[param.url] = item;
        this.items.push(item);
    }, this);

    if (doc) {
        return this.store.addDocument(params[0].url, doc);
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
    const item = this.spine[spineIndex];
    /** @type {!adapt.task.Frame.<?string>} */ const frame = adapt.task.newFrame("getCFI");
    this.store.load(item.src).then(xmldoc => {
        const node = xmldoc.getNodeByOffset(offsetInItem);
        let cfi = null;
        if (node) {
            const startOffset = xmldoc.getNodeOffset(node, 0, false);
            const offsetInNode = offsetInItem - startOffset;
            const fragment = new adapt.cfi.Fragment();
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
    const self = this;
    return adapt.task.handle("resolveFragment",
        /**
         * @param {!adapt.task.Frame.<?adapt.epub.Position>} frame
         * @return {void}
         */
        frame => {
            if (!fragstr) {
                frame.finish(null);
                return;
            }
            let fragment = new adapt.cfi.Fragment();
            fragment.fromString(fragstr);
            let item;
            if (self.opfXML) {
                const opfNav = fragment.navigate(self.opfXML.document);
                if (opfNav.node.nodeType != 1 || opfNav.after || !opfNav.ref) {
                    frame.finish(null);
                    return;
                }
                const elem = /** @type {Element} */ (opfNav.node);
                const idref = elem.getAttribute("idref");
                if (elem.localName != "itemref" || !idref || !self.itemMap[idref]) {
                    frame.finish(null);
                    return;
                }
                item = self.itemMap[idref];
                fragment = opfNav.ref;
            } else {
                item = self.spine[0];
            }
            self.store.load(item.src).then(xmldoc => {
                const nodeNav = fragment.navigate(xmldoc.document);
                const offset = xmldoc.getNodeOffset(nodeNav.node, nodeNav.offset, nodeNav.after);
                frame.finish({spineIndex: item.spineIndex, offsetInItem: offset, pageIndex: -1});
            });
        },
        /**
         * @param {!adapt.task.Frame.<?adapt.epub.Position>} frame
         * @param {Error} err
         * @return {void}
         */
        (frame, err) => {
            vivliostyle.logging.logger.warn(err, "Cannot resolve fragment:", fragstr);
            frame.finish(null);
        });
};

/**
 * @param {number} epage
 * @return {!adapt.task.Result.<?adapt.epub.Position>}
 */
adapt.epub.OPFDoc.prototype.resolveEPage = function(epage) {
    const self = this;
    return adapt.task.handle("resolveEPage",
        /**
         * @param {!adapt.task.Frame.<?adapt.epub.Position>} frame
         * @return {void}
         */
        frame => {
            if (epage <= 0) {
                frame.finish({spineIndex: 0, offsetInItem: 0, pageIndex: -1});
                return;
            }
            if (self.epageIsRenderedPage) {
                let spineIndex = self.spine.findIndex(item => {
                    return item.epage == 0 && item.epageCount == 0 ||
                        item.epage <= epage && item.epage + item.epageCount > epage;
                });
                let item = self.spine[spineIndex];
                if (!item || item.epageCount == 0) {
                    item = self.spine[--spineIndex];
                }
                frame.finish({spineIndex, offsetInItem: -1, pageIndex: epage - item.epage});
                return;
            }
            let spineIndex = adapt.base.binarySearch(self.spine.length, index => {
                const item = self.spine[index];
                return item.epage + item.epageCount > epage;
            });
            if (spineIndex == self.spine.length) {
                spineIndex--;
            }
            const item = self.spine[spineIndex];
            self.store.load(item.src).then(xmldoc => {
                epage -= item.epage;
                if (epage > item.epageCount) {
                    epage = item.epageCount;
                }
                let offset = 0;
                if (epage > 0) {
                    const totalOffset = xmldoc.getTotalOffset();
                    offset = Math.round(totalOffset * epage / item.epageCount);
                    if (offset == totalOffset) {
                        offset--;
                    }
                }
                frame.finish({spineIndex, offsetInItem: offset, pageIndex: -1});
            });
        },
        /**
         * @param {!adapt.task.Frame.<?adapt.epub.Position>} frame
         * @param {Error} err
         * @return {void}
         */
        (frame, err) => {
            vivliostyle.logging.logger.warn(err, "Cannot resolve epage:", epage);
            frame.finish(null);
        });
};

/**
 * @param {adapt.epub.Position} position
 * @return {!adapt.task.Result.<number>}
 */
adapt.epub.OPFDoc.prototype.getEPageFromPosition = function(position) {
    const item = this.spine[position.spineIndex];
    if (position.offsetInItem <= 0) {
        return adapt.task.newResult(item.epage);
    }
    if (this.epageIsRenderedPage) {
        return adapt.task.newResult(item.epage + position.pageIndex);
    }
    /** @type {!adapt.task.Frame.<number>} */ const frame = adapt.task.newFrame("getEPage");
    this.store.load(item.src).then(xmldoc => {
        const totalOffset = xmldoc.getTotalOffset();
        const offset = Math.min(totalOffset, position.offsetInItem);
        frame.finish(item.epage + offset * item.epageCount / totalOffset);
    });
    return frame.result();
};

/**
 * @typedef {{page: !adapt.vtree.Page, position: !adapt.epub.Position}}
 */
adapt.epub.PageAndPosition;

/**
 * @param {!adapt.vtree.Page} page
 * @param {number} pageIndex
 * @returns {!adapt.epub.PageAndPosition}
 */
adapt.epub.makePageAndPosition = (page, pageIndex) => ({
    page,

    position: {
        spineIndex: page.spineIndex,
        pageIndex,
        offsetInItem: page.offset
    }
});

/**
 * @typedef {{
 * 		item: adapt.epub.OPFItem,
 * 		xmldoc: adapt.xmldoc.XMLDocHolder,
 * 		instance: adapt.ops.StyleInstance,
 * 		layoutPositions: Array.<adapt.vtree.LayoutPosition>,
 * 		pages: !Array.<adapt.vtree.Page>,
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
 * @param {!function({width: number, height: number}, !Object<string, !{width: number, height: number}>, number, number)} pageSheetSizeReporter
 * @implements {adapt.vgen.CustomRendererFactory}
 */
adapt.epub.OPFView = function(opf, viewport, fontMapper, pref, pageSheetSizeReporter) {
    /** @const */ this.opf = opf;
    /** @const */ this.viewport = viewport;
    /** @const */ this.fontMapper = fontMapper;
    /** @const */ this.pageSheetSizeReporter = pageSheetSizeReporter;
    /** @type {Array.<adapt.epub.OPFViewItem>} */ this.spineItems = [];
    /** @const {Array.<Array.<adapt.task.Continuation>>} */ this.spineItemLoadingContinuations = [];
    /** @const */ this.pref = adapt.expr.clonePreferences(pref);
    /** @const */ this.clientLayout = new adapt.vgen.DefaultClientLayout(viewport);
    /** @const */ this.counterStore = new vivliostyle.counters.CounterStore(opf.documentURLTransformer);
};

/**
 * @private
 * @param {!adapt.epub.Position} position
 * @returns {adapt.vtree.Page}
 */
adapt.epub.OPFView.prototype.getPage = function(position) {
    const viewItem = this.spineItems[position.spineIndex];
    return viewItem ? viewItem.pages[position.pageIndex] : null;
};

/**
 * @param {adapt.epub.Position} position
 * @returns {?vivliostyle.constants.PageProgression}
 */
adapt.epub.OPFView.prototype.getCurrentPageProgression = function(position) {
    if (this.opf.pageProgression) {
        return this.opf.pageProgression;
    } else {
        const viewItem = this.spineItems[position ? position.spineIndex : 0];
        return viewItem ? viewItem.instance.pageProgression : null;
    }
};

/**
 * @private
 * @param {adapt.epub.OPFViewItem} viewItem
 * @param {adapt.vtree.Page} page
 * @param {number} pageIndex
 */
adapt.epub.OPFView.prototype.finishPageContainer = function(viewItem, page, pageIndex) {
    page.container.style.display = "none";
    page.container.style.visibility = "visible";
    page.container.style.position = "";
    page.container.style.top = "";
    page.container.style.left = "";
    page.container.setAttribute("data-vivliostyle-page-side", /** @type {string} */ (page.side));
    const oldPage = viewItem.pages[pageIndex];
    page.isFirstPage = viewItem.item.spineIndex == 0 && pageIndex == 0;
    viewItem.pages[pageIndex] = page;

    if (this.opf.epageIsRenderedPage) {
        if (pageIndex == 0 && viewItem.item.spineIndex > 0) {
            const prevItem = this.opf.spine[viewItem.item.spineIndex - 1];
            viewItem.item.epage = prevItem.epage + prevItem.epageCount;
        }
        viewItem.item.epageCount = viewItem.pages.length;
        this.opf.epageCount = this.opf.spine.reduce((count, item) => count + item.epageCount, 0);

        if (this.opf.epageCountCallback) {
            this.opf.epageCountCallback(this.opf.epageCount);
        }
    }

    if (oldPage) {
        viewItem.instance.viewport.contentContainer.replaceChild(page.container, oldPage.container);
        oldPage.dispatchEvent({
            type: "replaced",
            target: null,
            currentTarget: null,
            newPage: page
        });
    } else {
        // Find insert position in contentContainer.
        let insertPos = null;
        if (pageIndex > 0) {
            insertPos = viewItem.pages[pageIndex - 1].container.nextElementSibling;
        } else {
            for (let i = viewItem.item.spineIndex + 1; i < this.spineItems.length; i++) {
                const item = this.spineItems[i];
                if (item && item.pages[0]) {
                    insertPos = item.pages[0].container;
                    break;
                }
            }
        }
        viewItem.instance.viewport.contentContainer.insertBefore(page.container, insertPos);
    }
    this.pageSheetSizeReporter({ width: viewItem.instance.pageSheetWidth, height: viewItem.instance.pageSheetHeight },
                               viewItem.instance.pageSheetSize, viewItem.item.spineIndex, viewItem.instance.pageNumberOffset + pageIndex);
};

/**
 * @private
 * @typedef {{
 *      pageAndPosition: !adapt.epub.PageAndPosition,
 *      nextLayoutPosition: adapt.vtree.LayoutPosition
 * }}
 */
adapt.epub.OPFView.RenderSinglePageResult;

/**
 * Render a single page. If the new page contains elements with ids that are referenced from other pages by 'target-counter()', those pages are rendered too (calling `renderSinglePage` recursively).
 * @private
 * @param {!adapt.epub.OPFViewItem} viewItem
 * @param {adapt.vtree.LayoutPosition} pos
 * @returns {!adapt.task.Result<!adapt.epub.OPFView.RenderSinglePageResult>}
 */
adapt.epub.OPFView.prototype.renderSinglePage = function(viewItem, pos) {
    /** @type {!adapt.task.Frame<!adapt.epub.OPFView.RenderSinglePageResult>} */ const frame
        = adapt.task.newFrame("renderSinglePage");
    let page = this.makePage(viewItem, pos);
    const self = this;
    viewItem.instance.layoutNextPage(page, pos).then(posParam => {
        pos = /** @type {adapt.vtree.LayoutPosition} */ (posParam);
        const pageIndex = pos ? pos.page - 1 : viewItem.layoutPositions.length - 1;
        self.finishPageContainer(viewItem, page, pageIndex);

        self.counterStore.finishPage(page.spineIndex, pageIndex);

        // If the position of the page break change, we should re-layout the next page too.
        let cont = null;
        if (pos) {
            const prevPos = viewItem.layoutPositions[pos.page];
            viewItem.layoutPositions[pos.page] = pos;
            if (prevPos && viewItem.pages[pos.page]) {
                if (!pos.isSamePosition(prevPos)) {
                    cont = self.renderSinglePage(viewItem, pos);
                }
            }
        }
        if (!cont) {
            cont = adapt.task.newResult(true);
        }

        cont.then(() => {
            const unresolvedRefs = self.counterStore.getUnresolvedRefsToPage(page);
            let index = 0;
            frame.loopWithFrame(loopFrame => {
                index++;
                if (index > unresolvedRefs.length) {
                    loopFrame.breakLoop();
                    return;
                }
                const refs = unresolvedRefs[index - 1];
                refs.refs = refs.refs.filter(ref => !ref.isResolved());
                if (refs.refs.length === 0) {
                    loopFrame.continueLoop();
                    return;
                }

                self.getPageViewItem(refs.spineIndex).then(viewItem => {
                    if (!viewItem) {
                        loopFrame.continueLoop();
                        return;
                    }
                    self.counterStore.pushPageCounters(refs.pageCounters);
                    self.counterStore.pushReferencesToSolve(refs.refs);
                    const pos = viewItem.layoutPositions[refs.pageIndex];
                    self.renderSinglePage(viewItem, pos).then(result => {
                        self.counterStore.popPageCounters();
                        self.counterStore.popReferencesToSolve();
                        const resultPosition = result.pageAndPosition.position;
                        if (resultPosition.spineIndex === page.spineIndex && resultPosition.pageIndex === pageIndex) {
                            page = result.pageAndPosition.page;
                        }
                        loopFrame.continueLoop();
                    });
                });
            }).then(() => {
                page.isLastPage = !pos &&
                    (viewItem.item.spineIndex === self.opf.spine.length - 1);
                if (page.isLastPage) {
                    goog.asserts.assert(self.viewport);
                    self.counterStore.finishLastPage(self.viewport);
                }
                frame.finish({
                    pageAndPosition: adapt.epub.makePageAndPosition(page, pageIndex),
                    nextLayoutPosition: pos
                });
            });
        });

    });
    return frame.result();
};

/**
 * @private
 * @param {!adapt.epub.Position} position
 * @param {!adapt.epub.OPFViewItem} viewItem
 * @returns {?adapt.epub.Position}
 */
adapt.epub.OPFView.prototype.normalizeSeekPosition = (position, viewItem) => {
    let pageIndex = position.pageIndex;
    let seekOffset = -1;
    if (pageIndex < 0) {
        seekOffset = position.offsetInItem;
        // page with offset higher than seekOffset
        const seekOffsetPageIndex = adapt.base.binarySearch(viewItem.layoutPositions.length,
            pageIndex => {
                // 'noLookAhead' argument of getPosition must be true, since otherwise
                // StyleInstance.currentLayoutPosition is modified unintentionally.
                const offset = viewItem.instance.getPosition(viewItem.layoutPositions[pageIndex], true);
                return offset > seekOffset;
            });
        if (seekOffsetPageIndex === viewItem.layoutPositions.length) {
            if (viewItem.complete) {
                pageIndex = viewItem.layoutPositions.length - 1;
            } else {
                // need to search through pages that are not yet produced
                pageIndex = Number.POSITIVE_INFINITY;
            }
        } else {
            // page that contains seekOffset
            pageIndex = seekOffsetPageIndex - 1;
        }
    } else if (pageIndex === Number.POSITIVE_INFINITY && position.offsetInItem !== -1) {
        seekOffset = position.offsetInItem;
    }
    return (
        /** @type {!adapt.epub.Position} */ ({
            spineIndex: position.spineIndex,
            pageIndex,
            offsetInItem: seekOffset
        })
    );
};

/**
 * Find a page corresponding to a specified position among already laid out pages.
 * @private
 * @param {!adapt.epub.Position} position
 * @param {boolean} sync If true, find the page synchronously (not waiting another rendering task)
 * @returns {!adapt.task.Result.<?adapt.epub.PageAndPosition>}
 */
adapt.epub.OPFView.prototype.findPage = function(position, sync) {
    const self = this;
    /** @type {!adapt.task.Frame.<?adapt.epub.PageAndPosition>} */ const frame
        = adapt.task.newFrame("findPage");
    self.getPageViewItem(position.spineIndex).then(viewItem => {
        if (!viewItem) {
            frame.finish(null);
            return;
        }
        let resultPage = null;
        let pageIndex;
        frame.loopWithFrame(loopFrame => {
            const normalizedPosition = self.normalizeSeekPosition(position, viewItem);
            pageIndex = normalizedPosition.pageIndex;
            resultPage = viewItem.pages[pageIndex];
            if (resultPage) {
                loopFrame.breakLoop();
            } else if (viewItem.complete) {
                pageIndex = viewItem.layoutPositions.length - 1;
                resultPage = viewItem.pages[pageIndex];
                loopFrame.breakLoop();
            } else if (sync) {
                self.renderPage(normalizedPosition).then(result => {
                    if (result) {
                        resultPage = result.page;
                        pageIndex = result.position.pageIndex;
                    }
                    loopFrame.breakLoop();
                });
            } else {
                // Wait for the layout task and retry
                frame.sleep(100).then(() => {
                    loopFrame.continueLoop();
                });
            }
        }).then(() => {
            goog.asserts.assert(resultPage);
            frame.finish(adapt.epub.makePageAndPosition(resultPage, pageIndex));
        });
    });
    return frame.result();
};

/**
 * Renders a page at the specified position.
 * @param {!adapt.epub.Position} position
 * @return {!adapt.task.Result.<?adapt.epub.PageAndPosition>}
 */
adapt.epub.OPFView.prototype.renderPage = function(position) {
    const self = this;
    /** @type {!adapt.task.Frame.<?adapt.epub.PageAndPosition>} */ const frame
        = adapt.task.newFrame("renderPage");
    self.getPageViewItem(position.spineIndex).then(viewItem => {
        if (!viewItem) {
            frame.finish(null);
            return;
        }
        const normalizedPosition = self.normalizeSeekPosition(position, viewItem);
        let pageIndex = normalizedPosition.pageIndex;
        const seekOffset = normalizedPosition.offsetInItem;
        let resultPage = viewItem.pages[pageIndex];
        if (resultPage) {
            frame.finish(adapt.epub.makePageAndPosition(resultPage, pageIndex));
            return;
        }
        frame.loopWithFrame(loopFrame => {
            if (pageIndex < viewItem.layoutPositions.length) {
                loopFrame.breakLoop();
                return;
            }
            if (viewItem.complete) {
                pageIndex = viewItem.layoutPositions.length - 1;
                loopFrame.breakLoop();
                return;
            }
            let pos = viewItem.layoutPositions[viewItem.layoutPositions.length - 1];
            self.renderSinglePage(viewItem, pos).then(result => {
                const page = result.pageAndPosition.page;
                pos = result.nextLayoutPosition;
                if (pos) {
                    if (seekOffset >= 0) {
                        // Searching for offset, don't know the page number.
                        const offset = viewItem.instance.getPosition(pos);
                        if (offset > seekOffset) {
                            resultPage = page;
                            pageIndex = viewItem.layoutPositions.length - 2;
                            loopFrame.breakLoop();
                            return;
                        }
                    }
                    loopFrame.continueLoop();
                } else {
                    resultPage = page;
                    pageIndex = result.pageAndPosition.position.pageIndex;
                    viewItem.complete = true;
                    loopFrame.breakLoop();
                }
            });
        }).then(() => {
            resultPage = resultPage || viewItem.pages[pageIndex];
            const pos = viewItem.layoutPositions[pageIndex];
            if (resultPage) {
                frame.finish(adapt.epub.makePageAndPosition(resultPage, pageIndex));
                return;
            }
            self.renderSinglePage(viewItem, pos).then(result => {
                if (!result.nextLayoutPosition) {
                    viewItem.complete = true;
                }
                frame.finish(result.pageAndPosition);
            });
        });
    });
    return frame.result();
};

/**
 * @returns {!adapt.task.Result.<?adapt.epub.PageAndPosition>}
 */
adapt.epub.OPFView.prototype.renderAllPages = function() {
    return this.renderPagesUpto({
        spineIndex: this.opf.spine.length - 1,
        pageIndex: Number.POSITIVE_INFINITY,
        offsetInItem: -1
    }, false);
};

/**
 * Render pages from (spineIndex=0, pageIndex=0) to the specified (spineIndex, pageIndex).
 * @param {adapt.epub.Position} position
 * @param {boolean} notAllPages If true, render from biginning of specified spine item.
 * @returns {!adapt.task.Result.<?adapt.epub.PageAndPosition>}
 */
adapt.epub.OPFView.prototype.renderPagesUpto = function(position, notAllPages) {
    const self = this;
    /** @type {!adapt.task.Frame.<?adapt.epub.PageAndPosition>} */ const frame
        = adapt.task.newFrame("renderPagesUpto");

    if (!position) {
        position = {
            spineIndex: 0,
            pageIndex: 0,
            offsetInItem: 0
        };
    }
    const spineIndex = position.spineIndex;
    const pageIndex = position.pageIndex;
    let s = 0;

    if (notAllPages) {
        // Render pages from biginning of specified spine item.
        s = spineIndex;
    }

    let lastResult;
    frame.loopWithFrame(loopFrame => {
        const pos = {
            spineIndex: s,
            pageIndex: s === spineIndex ? pageIndex : Number.POSITIVE_INFINITY,
            offsetInItem: s === spineIndex ? position.offsetInItem : -1
        };
        self.renderPage(pos).then(result => {
            lastResult = result;
            if (++s > spineIndex) {
                loopFrame.breakLoop();
            } else {
                loopFrame.continueLoop();
            }
        });
    }).then(() => {
        frame.finish(lastResult);
    });
    return frame.result();
};

/**
 * Move to the first page and render it.
 * @param {!adapt.epub.Position} position
 * @param {boolean} sync
 * @return {!adapt.task.Result.<?adapt.epub.PageAndPosition>}
 */
adapt.epub.OPFView.prototype.firstPage = function(position, sync) {
    return this.findPage({
        spineIndex: 0,
        pageIndex: 0,
        offsetInItem: -1
    }, sync);
};

/**
 * Move to the last page and render it.
 * @param {!adapt.epub.Position} position
 * @param {boolean} sync
 * @return {!adapt.task.Result.<?adapt.epub.PageAndPosition>}
 */
adapt.epub.OPFView.prototype.lastPage = function(position, sync) {
    return this.findPage({
        spineIndex: this.opf.spine.length - 1,
        pageIndex: Number.POSITIVE_INFINITY,
        offsetInItem: -1
    }, sync);
};

/**
 * Move to the next page position and render page.
 * @param {!adapt.epub.Position} position
 * @param {boolean} sync If true, get the page synchronously (not waiting another rendering task)
 * @return {!adapt.task.Result.<?adapt.epub.PageAndPosition>}
 */
adapt.epub.OPFView.prototype.nextPage = function(position, sync) {
    const self = this;
    let spineIndex = position.spineIndex;
    let pageIndex = position.pageIndex;
    /** @type {!adapt.task.Frame.<?adapt.epub.PageAndPosition>} */ const frame
        = adapt.task.newFrame("nextPage");
    self.getPageViewItem(spineIndex).then(viewItem => {
        if (!viewItem) {
            frame.finish(null);
            return;
        }
        if (viewItem.complete && pageIndex == viewItem.layoutPositions.length - 1) {
            if (spineIndex >= self.opf.spine.length - 1) {
                frame.finish(null);
                return;
            }
            spineIndex++;
            pageIndex = 0;
        } else {
            pageIndex++;
        }
        self.findPage({
            spineIndex,
            pageIndex,
            offsetInItem: -1
        }, sync).thenFinish(frame);
    });
    return frame.result();
};

/**
 * Move to the previous page and render it.
 * @param {!adapt.epub.Position} position
 * @param {boolean} sync
 * @return {!adapt.task.Result.<?adapt.epub.PageAndPosition>}
 */
adapt.epub.OPFView.prototype.previousPage = function(position, sync) {
    let spineIndex = position.spineIndex;
    let pageIndex = position.pageIndex;
    if (pageIndex == 0) {
        if (spineIndex == 0) {
            return adapt.task.newResult(/** @type {?adapt.epub.PageAndPosition} */ (null));
        }
        spineIndex--;
        pageIndex = Number.POSITIVE_INFINITY;
    } else {
        pageIndex--;
    }
    return this.findPage({
        spineIndex,
        pageIndex,
        offsetInItem: -1
    }, sync);
};

/**
 * @private
 * @param {adapt.vtree.Page} page This page should be a currently displayed page.
 * @param {adapt.epub.Position} position
 * @returns {boolean}
 */
adapt.epub.OPFView.prototype.isRectoPage = function(page, position) {
    const isLeft = page.side === vivliostyle.constants.PageSide.LEFT;
    const isLTR = this.getCurrentPageProgression(position) === vivliostyle.constants.PageProgression.LTR;
    return (!isLeft && isLTR) || (isLeft && !isLTR);
};

/**
 * Get a spread containing the currently displayed page.
 * @param {!adapt.epub.Position} position
 * @param {boolean} sync If true, get the spread synchronously (not waiting another rendering task)
 * @return {!adapt.task.Result.<!adapt.vtree.Spread>}
 */
adapt.epub.OPFView.prototype.getSpread = function(position, sync) {
    /** @type {!adapt.task.Frame.<adapt.vtree.Spread>} */ const frame
        = adapt.task.newFrame("getCurrentSpread");

    const page = this.getPage(position);
    if (!page) {
        return adapt.task.newResult(/** @type adapt.vtree.Spread */ ({left: null, right: null}));
    }

    const isLeft = page.side === vivliostyle.constants.PageSide.LEFT;
    let other;
    if (this.isRectoPage(page, position)) {
        other = this.previousPage(position, sync);
    } else {
        other = this.nextPage(position, sync);
    }
    other.then(otherPageAndPosition => {
        // this page may be replaced during nextPage(), so get thisPage again.
        const thisPage = this.getPage(position);

        let otherPage = otherPageAndPosition && otherPageAndPosition.page;
        if (otherPage && otherPage.side === thisPage.side) {
            // otherPage must not be same side
            otherPage = null;
        }

        if (isLeft) {
            frame.finish({left: thisPage, right: otherPage});
        } else {
            frame.finish({left: otherPage, right: thisPage});
        }
    });

    return frame.result();
};

/**
 * Move to the next spread and render pages.
 * @param {!adapt.epub.Position} position
 * @param {boolean} sync If true, get the spread synchronously (not waiting another rendering task)
 * @returns {!adapt.task.Result.<?adapt.epub.PageAndPosition>} The 'verso' page of the next spread.
 */
adapt.epub.OPFView.prototype.nextSpread = function(position, sync) {
    const page = this.getPage(position);
    if (!page) {
        return adapt.task.newResult(/** @type {?adapt.epub.PageAndPosition} */ (null));
    }
    const isRecto = this.isRectoPage(page, position);
    const next = this.nextPage(position, sync);
    if (isRecto) {
        return next;
    } else {
        const self = this;
        return next.thenAsync(result => {
            if (result) {
                if (result.page.side === page.side) {
                    // If same side, this is the next spread.
                    return next;
                }
                return self.nextPage(result.position, sync);
            } else {
                return adapt.task.newResult(/** @type {?adapt.epub.PageAndPosition} */ (null));
            }
        });
    }
};

/**
 * Move to the previous spread and render pages.
 * @param {!adapt.epub.Position} position
 * @param {boolean} sync
 * @returns {!adapt.task.Result.<?adapt.epub.PageAndPosition>} The 'recto' page of the previous spread.
 */
adapt.epub.OPFView.prototype.previousSpread = function(position, sync) {
    const page = this.getPage(position);
    if (!page) {
        return adapt.task.newResult(/** @type {?adapt.epub.PageAndPosition} */ (null));
    }
    const isRecto = this.isRectoPage(page, position);
    const prev = this.previousPage(position, sync);
    const oldPrevPageCont = page.container.previousElementSibling;
    if (isRecto) {
        const self = this;
        return prev.thenAsync(result => {
            if (result) {
                if (result.page.side === page.side) {
                    // If same side, this is the previous spread.
                    return prev;
                }
                if (result.page.container !== oldPrevPageCont) {
                    // If previous page is changed, return it.
                    return prev;
                }
                return self.previousPage(result.position, sync);
            } else {
                return adapt.task.newResult(/** @type {?adapt.epub.PageAndPosition} */ (null));
            }
        });
    } else {
        return prev;
    }
};

/**
 * Move to the epage specified by the given number (zero-based) and render it.
 * @param {number} epage
 * @param {!adapt.epub.Position} position
 * @param {boolean} sync
 * @return {!adapt.task.Result.<?adapt.epub.PageAndPosition>}
 */
adapt.epub.OPFView.prototype.navigateToEPage = function(epage, position, sync) {
    /** @type {!adapt.task.Frame.<?adapt.epub.PageAndPosition>} */ const frame
        = adapt.task.newFrame("navigateToEPage");
    const self = this;
    this.opf.resolveEPage(epage).then(position => {
        if (position) {
            self.findPage(position, sync).thenFinish(frame);
        } else {
            frame.finish(null);
        }
    });
    return frame.result();
};

/**
 * Move to the page specified by the given CFI and render it.
 * @param {string} fragment
 * @param {!adapt.epub.Position} position
 * @param {boolean} sync
 * @return {!adapt.task.Result.<?adapt.epub.PageAndPosition>}
 */
adapt.epub.OPFView.prototype.navigateToFragment = function(fragment, position, sync) {
    /** @type {!adapt.task.Frame.<?adapt.epub.PageAndPosition>} */ const frame
        = adapt.task.newFrame("navigateToCFI");
    const self = this;
    self.opf.resolveFragment(fragment).then(position => {
        if (position) {
            self.findPage(position, sync).thenFinish(frame);
        } else {
            frame.finish(null);
        }
    });
    return frame.result();
};


/**
 * Move to the page specified by the given URL and render it.
 * @param {string} href
 * @param {!adapt.epub.Position} position
 * @param {boolean} sync
 * @return {!adapt.task.Result.<?adapt.epub.PageAndPosition>}
 */
adapt.epub.OPFView.prototype.navigateTo = function(href, position, sync) {
    vivliostyle.logging.logger.debug("Navigate to", href);
    let path = this.opf.getPathFromURL(adapt.base.stripFragment(href));
    if (!path) {
        if (this.opf.opfXML && href.match(/^#epubcfi\(/)) {
            // CFI fragment is "relative" to OPF.
            path = this.opf.getPathFromURL(this.opf.opfXML.url);
        } else if (href.charAt(0) === "#") {
            const restored = this.opf.documentURLTransformer.restoreURL(href);
            if (this.opf.opfXML) {
                path = this.opf.getPathFromURL(restored[0]);
            } else {
                path = restored[0];
            }
            href = restored[0] + (restored[1] ? `#${restored[1]}` : "");
        }
        if (path == null) {
            return adapt.task.newResult(/** @type {?adapt.epub.PageAndPosition} */ (null));
        }
    }
    const item = this.opf.itemMapByPath[path];
    if (!item) {
        if (this.opf.opfXML && path == this.opf.getPathFromURL(this.opf.opfXML.url)) {
            // CFI link?
            const fragmentIndex = href.indexOf("#");
            if (fragmentIndex >= 0) {
                return this.navigateToFragment(href.substr(fragmentIndex + 1), position, sync);
            }
        }
        return adapt.task.newResult(/** @type {?adapt.epub.PageAndPosition} */ (null));
    }
    /** @type {!adapt.task.Frame.<?adapt.epub.PageAndPosition>} */ const frame
        = adapt.task.newFrame("navigateTo");
    const self = this;
    self.getPageViewItem(item.spineIndex).then(viewItem => {
        const target = viewItem.xmldoc.getElement(href);
        if (target) {
            self.findPage({
                spineIndex: item.spineIndex,
                pageIndex: -1,
                offsetInItem: viewItem.xmldoc.getElementOffset(target)
            }, sync).thenFinish(frame);
        } else if (position.spineIndex !== item.spineIndex) {
            // no fragment, different spine item
            self.findPage({
                spineIndex: item.spineIndex,
                pageIndex: 0,
                offsetInItem: -1
            }, sync).thenFinish(frame);
        } else {
            frame.finish(null);
        }
    });
    return frame.result();
};

/**
 * @param {adapt.epub.OPFViewItem} viewItem
 * @param {adapt.vtree.LayoutPosition} pos
 * @return {!adapt.vtree.Page}
 */
adapt.epub.OPFView.prototype.makePage = function(viewItem, pos) {
    const viewport = viewItem.instance.viewport;

    const pageCont = /** @type {HTMLElement} */ (viewport.document.createElement("div"));
    pageCont.setAttribute("data-vivliostyle-page-container", true);
    pageCont.style.position = "absolute";
    pageCont.style.top = "0";
    pageCont.style.left = "0";
    if (!vivliostyle.constants.isDebug) {
        pageCont.style.visibility = "hidden";
    }
    viewport.layoutBox.appendChild(pageCont);

    const bleedBox = /** @type {HTMLElement} */ (viewport.document.createElement("div"));
    bleedBox.setAttribute("data-vivliostyle-bleed-box", true);
    pageCont.appendChild(bleedBox);

    const page = new adapt.vtree.Page(pageCont, bleedBox);
    page.spineIndex = viewItem.item.spineIndex;
    page.position = pos;
    page.offset = viewItem.instance.getPosition(pos);
    if (page.offset === 0) {
        const id = this.opf.documentURLTransformer.transformFragment("", viewItem.item.src);
        bleedBox.setAttribute("id", id);
        page.registerElementWithId(bleedBox, id);
    }
    if (viewport !== this.viewport) {
        const matrix = adapt.expr.letterbox(this.viewport.width, this.viewport.height,
            viewport.width, viewport.height);
        const cssMatrix = adapt.cssparse.parseValue(null, new adapt.csstok.Tokenizer(matrix, null), "");
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
    let data = srcElem.getAttribute("data");
    /** @type {Element} */ let result = null;
    if (data) {
        data = adapt.base.resolveURL(data, xmldoc.url);
        let mediaType = srcElem.getAttribute("media-type");
        if (!mediaType) {
            const path = this.opf.getPathFromURL(data);
            if (path) {
                const item = this.opf.itemMapByPath[path];
                if (item) {
                    mediaType = item.mediaType;
                }
            }
        }
        if (mediaType) {
            const handlerSrc = this.opf.bindings[mediaType];
            if (handlerSrc) {
                result = this.viewport.document.createElement("iframe");
                result.style.border = "none";
                const srcParam = adapt.base.lightURLEncode(data);
                const typeParam = adapt.base.lightURLEncode(mediaType);
                const sb = new adapt.base.StringBuffer();
                sb.append(handlerSrc);
                sb.append("?src=");
                sb.append(srcParam);
                sb.append("&type=");
                sb.append(typeParam);
                for (let c = srcElem.firstChild; c; c = c.nextSibling) {
                    if (c.nodeType == 1) {
                        const ce = /** @type {Element} */ (c);
                        if (ce.localName == "param" && ce.namespaceURI == adapt.base.NS.XHTML) {
                            const pname = ce.getAttribute("name");
                            const pvalue = ce.getAttribute("value");
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
                const width = srcElem.getAttribute("width");
                if (width) {
                    result.setAttribute("width", width);
                }
                const height = srcElem.getAttribute("height");
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
    const hub = adapt.epub.getMathJaxHub();
    if (hub) {
        const doc = viewParent.ownerDocument;
        const span = doc.createElement("span");
        viewParent.appendChild(span);
        const clonedMath = doc.importNode(srcElem, true);
        this.resolveURLsInMathML(clonedMath, xmldoc);
        span.appendChild(clonedMath);
        const queue = hub["queue"];
        queue["Push"](["Typeset", hub, span]);
        /** @type {!adapt.task.Frame.<Element>} */ const frame
            = adapt.task.newFrame("makeMathJaxView");
        const continuation = frame.suspend();
        queue["Push"](() => {
            continuation.schedule(span);
        });
        return frame.result();
    }
    return adapt.task.newResult(/** @type {Element} */ (null));
};

/**
 * @private
 * @param {Node} node
 * @param {adapt.xmldoc.XMLDocHolder} xmldoc
 */
adapt.epub.OPFView.prototype.resolveURLsInMathML = function(node, xmldoc) {
    if (node == null) return;
    if (node.nodeType === 1 && node.tagName === "mglyph") {
        const attrs = node.attributes;

        for (const attr of attrs) {
            if (attr.name !== "src") continue;
            const newUrl = adapt.base.resolveURL(attr.nodeValue, xmldoc.url);
            if (attr.namespaceURI) {
                node.setAttributeNS(attr.namespaceURI, attr.name, newUrl);
            } else {
                node.setAttribute(attr.name, newUrl);
            }
        }
    }
    if (node.firstChild) this.resolveURLsInMathML(node.firstChild, xmldoc);
    if (node.nextSibling) this.resolveURLsInMathML(node.nextSibling, xmldoc);
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
    const doc = viewParent ? viewParent.ownerDocument : this.viewport.document;
    const srcTagName = srcElem.localName;
    let tagName;
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
    const result = doc.createElement(tagName);
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
    const self = this;
    return (
        /**
         * @param {Element} srcElem
         * @param {Element} viewParent
         * @return {!adapt.task.Result.<Element>}
         */
        (srcElem, viewParent, computedStyle) => {
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
 * @param {number} spineIndex
 * @return {!adapt.task.Result.<adapt.epub.OPFViewItem>}
 */
adapt.epub.OPFView.prototype.getPageViewItem = function(spineIndex) {
    const self = this;
    if (spineIndex >= self.opf.spine.length) {
        return adapt.task.newResult(/** @type {adapt.epub.OPFViewItem} */ (null));
    }
    let viewItem = self.spineItems[spineIndex];
    if (viewItem) {
        return adapt.task.newResult(viewItem);
    }
    /** @type {!adapt.task.Frame.<adapt.epub.OPFViewItem>} */ const frame
        = adapt.task.newFrame("getPageViewItem");

    // If loading for the item has already been started, suspend and wait for the result.
    let loadingContinuations = this.spineItemLoadingContinuations[spineIndex];
    if (loadingContinuations) {
        const cont = frame.suspend();
        loadingContinuations.push(cont);
        return frame.result();
    } else {
        loadingContinuations = this.spineItemLoadingContinuations[spineIndex] = [];
    }

    const item = self.opf.spine[spineIndex];
    const store = self.opf.store;
    store.load(item.src).then(xmldoc => {
        const style = store.getStyleForDoc(xmldoc);
        const customRenderer = self.makeCustomRenderer(xmldoc);
        let viewport = self.viewport;
        const viewportSize = style.sizeViewport(viewport.width, viewport.height, viewport.fontSize, self.pref);
        if (viewportSize.width != viewport.width || viewportSize.height != viewport.height ||
            viewportSize.fontSize != viewport.fontSize) {
            viewport = new adapt.vgen.Viewport(viewport.window, viewportSize.fontSize, viewport.root,
                viewportSize.width, viewportSize.height);
        }
        const previousViewItem = self.spineItems[spineIndex - 1];
        let pageNumberOffset;
        if (item.startPage !== null) {
            pageNumberOffset = item.startPage - 1;
        } else {
            if (spineIndex > 0 && (!previousViewItem || !previousViewItem.complete)) {
                // When navigate to a new spine item skipping the previous items,
                // give up calculate pageNumberOffset and use epage (or spineIndex if epage is unset).
                pageNumberOffset = item.epage || spineIndex;
            } else {
                pageNumberOffset = previousViewItem ? previousViewItem.instance.pageNumberOffset + previousViewItem.pages.length : 0;
            }
            if (item.skipPagesBefore !== null) {
                pageNumberOffset += item.skipPagesBefore;
            }
        }
        self.counterStore.forceSetPageCounter(pageNumberOffset);

        const instance = new adapt.ops.StyleInstance(style, xmldoc, self.opf.lang,
            viewport, self.clientLayout, self.fontMapper, customRenderer, self.opf.fallbackMap, pageNumberOffset,
            self.opf.documentURLTransformer, self.counterStore, self.opf.pageProgression);

        instance.pref = self.pref;
        instance.init().then(() => {
            viewItem = {item, xmldoc, instance,
                layoutPositions: [null], pages: [], complete: false};
            self.spineItems[spineIndex] = viewItem;
            frame.finish(viewItem);
            loadingContinuations.forEach(c => {
                c.schedule(viewItem);
            });
        });
    });
    return frame.result();
};

adapt.epub.OPFView.prototype.removeRenderedPages = function() {
    const items = this.spineItems;

    for (const item of items) {
        if (item) {
            item.pages.splice(0);
        }
    }

    this.viewport.clear();
};

/**
 * Returns if at least one page has 'auto' size
 * @returns {boolean}
 */
adapt.epub.OPFView.prototype.hasAutoSizedPages = function() {
    const items = this.spineItems;

    for (const item of items) {
        if (item) {
            const pages = item.pages;

            for (const page of pages) {
                if (page.isAutoPageWidth && page.isAutoPageHeight) {
                    return true;
                }
            }
        }
    }

    return false;
};

/**
 * @returns {boolean}
 */
adapt.epub.OPFView.prototype.hasPages = function() {
    return this.spineItems.some(item => item && item.pages.length > 0);
};

/**
 * @param {boolean} autohide
 * @return {!adapt.task.Result.<adapt.vtree.Page>}
 */
adapt.epub.OPFView.prototype.showTOC = function(autohide) {
    const opf = this.opf;
    const toc = opf.xhtmlToc || opf.ncxToc;
    if (!toc) {
        return adapt.task.newResult(/** @type {adapt.vtree.Page} */ (null));
    }
    /** @type {!adapt.task.Frame.<adapt.vtree.Page>} */ const frame
        = adapt.task.newFrame("showTOC");
    if (!this.tocView) {
        this.tocView = new adapt.toc.TOCView(opf.store, toc.src, opf.lang,
            this.clientLayout, this.fontMapper, this.pref, this, opf.fallbackMap, opf.documentURLTransformer,
            this.counterStore);
    }
    const viewport = this.viewport;
    const tocWidth = Math.min(350, Math.round(0.67 * viewport.width) - 16);
    const tocHeight = viewport.height - 6;
    const pageCont = /** @type {HTMLElement} */ (viewport.document.createElement("div"));
    viewport.root.appendChild(pageCont);
    pageCont.style.position = "absolute";
    pageCont.style.visibility = "hidden";
    pageCont.style.left = "3px";
    pageCont.style.top = "3px";
    pageCont.style.width = `${tocWidth + 10}px`;
    pageCont.style.maxHeight = `${tocHeight}px`;
    pageCont.style.overflow = "scroll";
    pageCont.style.overflowX = "hidden";
    pageCont.style.background = "#EEE";
    pageCont.style.border = "1px outset #999";
    pageCont.style["borderRadius"] = "2px";
    pageCont.style["boxShadow"] = " 5px 5px rgba(128,128,128,0.3)";
    this.tocView.showTOC(pageCont, viewport, tocWidth, tocHeight, this.viewport.fontSize).then(page => {
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

