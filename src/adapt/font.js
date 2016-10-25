/**
 * Copyright 2013 Google, Inc.
 * Copyright 2015 Vivliostyle Inc.
 * @fileoverview Deal with embedded fonts.
 */
goog.provide('adapt.font');

goog.require('vivliostyle.logging');
goog.require('adapt.task');
goog.require('adapt.taskutil');
goog.require('adapt.net');
goog.require('adapt.expr');
goog.require('adapt.css');
goog.require('adapt.cssprop');
goog.require('adapt.cssparse');


/** @type {Object.<string,adapt.css.Val>} */
adapt.font.traitProps = {
    "font-style": adapt.css.ident.normal,
    "font-variant": adapt.css.ident.normal,
    "font-weight": adapt.css.ident.normal
};

/**
 * @const
 */
adapt.font.bogusFontData = "OTTO" + (new Date()).valueOf();

/**
 * @type {number}
 */
adapt.font.bogusFontCounter = 1;

/**
 * @param {Object.<string,adapt.css.Val>} properties
 * @return {string}
 */
adapt.font.makeFontTraitKey = function(properties) {
    var sb = new adapt.base.StringBuffer();
    for (var prop in adapt.font.traitProps) {
        sb.append(" ");
        sb.append(properties[prop].toString());
    }
    return sb.toString();
};

/**
 * @param {Object.<string,adapt.css.Val>} properties
 */
adapt.font.fillDefaults = function(properties) {
    for (var prop in adapt.font.traitProps) {
        if (!properties[prop])
            properties[prop] = adapt.font.traitProps[prop];
    }
};


/**
 * @param {adapt.csscasc.ElementStyle} properties
 * @param {adapt.expr.Context} context
 * @return {Object.<string,adapt.css.Val>}
 */
adapt.font.prepareProperties = function(properties, context) {
    var result = /** @type {Object.<string,adapt.css.Val>} */ ({});
    for (var prop in properties) {
        result[prop] = adapt.csscasc.getProp(properties, prop).evaluate(context, prop);
    }
    adapt.font.fillDefaults(result);
    return result;
};

/**
 * A font declared in a font-face rule.
 * @param {Object.<string,adapt.css.Val>} properties
 * @constructor
 */
adapt.font.Face = function(properties) {
    /** @const */ this.properties = properties;
    /** @const */ this.fontTraitKey = adapt.font.makeFontTraitKey(this.properties);
    /** @const */ this.src = this.properties["src"] ? this.properties["src"].toString() : null;
    /** @type {Array.<string>} */ this.blobURLs = [];
    /** @type {Array.<Blob>} */ this.blobs = [];
    var family = this.properties["font-family"];
    /** @const */ this.family = family ? family.stringValue() : null;
};

/**
 * Check if font traits are the same for two font faces
 * @param {adapt.font.Face} other
 * @return {boolean}
 */
adapt.font.Face.prototype.traitsEqual = function(other) {
    return this.fontTraitKey == other.fontTraitKey;
};

/**
 * Create "at" font-face rule.
 * @param {string} src
 * @param {Blob} fontBytes
 * @return {string}
 */
adapt.font.Face.prototype.makeAtRule = function(src, fontBytes) {
    var sb = new adapt.base.StringBuffer();
    sb.append('@font-face {\n  font-family: ');
    sb.append(/** @type {string} */ (this.family));
    sb.append(';\n  ');
    for (var prop in adapt.font.traitProps) {
        sb.append(prop);
        sb.append(': ');
        this.properties[prop].appendTo(sb, true);
        sb.append(';\n  ');
    }
    if (fontBytes) {
        sb.append('src: url("');
        var blobURL = adapt.net.createObjectURL(fontBytes);
        sb.append(blobURL);
        this.blobURLs.push(blobURL);
        this.blobs.push(fontBytes);
        sb.append('")');
    } else {
        sb.append('src: ');
        sb.append(src);
    }
    sb.append(';\n}\n');
    return sb.toString();
};

/**
 * Set of the fonts declared in all stylesheets of a document.
 * @param {?function(string):?function(Blob):adapt.task.Result.<Blob>} deobfuscator function
 *     that takes url and returns data deobfuscator
 * @constructor
 */
adapt.font.DocumentFaces = function(deobfuscator) {
    /** @const */ this.deobfuscator = deobfuscator;
    /**
     * Maps source font family names to the family names used in the HTML view.
     * @const
     */
    this.familyMap = /** @type {Object.<string,string>} */ ({});
};

/**
 * @param {adapt.font.Face} srcFace
 * @param {adapt.font.Face} viewFace
 * @return {void}
 */
adapt.font.DocumentFaces.prototype.registerFamily = function(srcFace, viewFace) {
    var srcFamily = /** @type {string} */ (srcFace.family);
    var viewFamilyFromSrc = this.familyMap[srcFamily];
    var viewFamilyFromView = viewFace.family;
    if (viewFamilyFromSrc) {
        if (viewFamilyFromSrc != viewFamilyFromView)
            throw new Error("E_FONT_FAMILY_INCONSISTENT " + srcFace.family);
    } else {
        this.familyMap[srcFamily] = /** @type {string} */ (viewFamilyFromView);
    }
};

/**
 * @param {adapt.css.Val} val
 * @return {adapt.css.Val}
 */
adapt.font.DocumentFaces.prototype.filterFontFamily = function(val) {
    if (val instanceof adapt.css.CommaList) {
        var list = (/** @type {adapt.css.CommaList} */ (val)).values;
        var newValues = /** @type {Array.<adapt.css.Val>} */ ([]);
        for (var i = 0; i < list.length; i++) {
            var v = list[i];
            var r = this.familyMap[v.stringValue()];
            if (r) {
                newValues.push(adapt.css.getName(r));
            }
            newValues.push(v);
        }
        return new adapt.css.CommaList(newValues);
    } else {
        var rf = this.familyMap[val.stringValue()];
        if (rf) {
            return new adapt.css.CommaList([adapt.css.getName(rf), val]);
        }
        return val;
    }
};


/**
 * Object that loads fonts in a document and allocates font families for them
 * in the view document
 * @param {Element} head where to add styles in the view document (normally head element)
 * @param {Element} body where to probe text in the view document (normally body element)
 * @param {string=} opt_familyPrefix
 * @constructor
 */
adapt.font.Mapper = function(head, body, opt_familyPrefix) {
    /** @const */ this.head = head;
    /** @const */ this.body = body;
    /**
     * Maps Face.src to an entry for an already-loaded font.
     * @const {Object.<string,adapt.taskutil.Fetcher.<adapt.font.Face>>}
     */
    this.srcURLMap = {};
    /** @const */ this.familyPrefix = opt_familyPrefix || "Fnt_";
    /** @type {number} */ this.familyCounter = 0;
};

/**
 * @param {adapt.font.Face} srcFace
 * @param {adapt.font.DocumentFaces} documentFaces
 * @return {string}
 */
adapt.font.Mapper.prototype.getViewFontFamily = function(srcFace, documentFaces) {
    var srcFamily = /** @type {string} */ (srcFace.family);
    var viewFamily = documentFaces.familyMap[srcFamily];
    if (viewFamily) {
        return viewFamily;
    }
    viewFamily = this.familyPrefix + (++this.familyCounter);
    documentFaces.familyMap[srcFamily] = viewFamily;
    return viewFamily;
};

/**
 * @private
 * @param {adapt.font.Face} srcFace
 * @param {Blob} fontBytes deobfuscated font bytes (if deobfuscation is needed)
 * @param {adapt.font.DocumentFaces} documentFaces
 * @return {!adapt.task.Result.<adapt.font.Face>}
 */
adapt.font.Mapper.prototype.initFont = function(srcFace, fontBytes, documentFaces) {
    /** @type {adapt.task.Frame.<adapt.font.Face>} */ var frame =
        adapt.task.newFrame("initFont");
    var self = this;
    var src = /** @type {string} */ (srcFace.src);
    var props = /** @type {Object.<string,adapt.css.Val>} */ ({});
    for (var prop in adapt.font.traitProps) {
        props[prop] = srcFace.properties[prop];
    }
    var fontFamily = self.getViewFontFamily(srcFace, documentFaces);
    props["font-family"] = adapt.css.getName(fontFamily);
    var viewFontFace = new adapt.font.Face(props);
    var probe = /** @type {HTMLElement} */ (self.body.ownerDocument.createElement("span"));
    probe.textContent = "M";
    var killTime = (new Date()).valueOf() + 1000;
    var style = self.head.ownerDocument.createElement("style");
    var bogusData = adapt.font.bogusFontData + (adapt.font.bogusFontCounter++);
    style.textContent = viewFontFace.makeAtRule("", adapt.net.makeBlob([bogusData]));
    self.head.appendChild(style);
    self.body.appendChild(probe);
    probe.style.visibility = "hidden";
    probe.style.fontFamily = fontFamily;
    for (var pname in adapt.font.traitProps) {
        adapt.base.setCSSProperty(probe, pname, props[pname].toString());
    }
    var rect = probe.getBoundingClientRect();
    var initWidth = rect.right - rect.left;
    var initHeight = rect.bottom - rect.top;
    style.textContent = viewFontFace.makeAtRule(src, fontBytes);
    vivliostyle.logging.logger.info("Starting to load font:", src);
    var loaded = false;
    frame.loop(function() {
        var rect = probe.getBoundingClientRect();
        var currWidth = rect.right - rect.left;
        var currHeight = rect.bottom - rect.top;
        if (initWidth != currWidth || initHeight != currHeight) {
            loaded = true;
            return adapt.task.newResult(false);
        }
        var currTime = (new Date()).valueOf();
        if (currTime > killTime) {
            return adapt.task.newResult(false);
        }
        return frame.sleep(10);
    }).then(function() {
        if (loaded) {
            vivliostyle.logging.logger.info("Loaded font:", src);
        } else {
            vivliostyle.logging.logger.warn("Failed to load font:", src);
        }
        self.body.removeChild(probe);
        frame.finish(viewFontFace);
    });
    return frame.result();
};

/**
 * @param {adapt.font.Face} srcFace
 * @param {adapt.font.DocumentFaces} documentFaces
 * @return {!adapt.taskutil.Fetcher.<adapt.font.Face>}
 */
adapt.font.Mapper.prototype.loadFont = function(srcFace, documentFaces) {
    var src = /** @type {string} */ (srcFace.src);
    var fetcher = this.srcURLMap[src];
    var self = this;
    if (fetcher) {
        fetcher.piggyback(function(viewFaceParam) {
            var viewFace = /** @type {adapt.font.Face} */ (viewFaceParam);
            if (!viewFace.traitsEqual(srcFace)) {
                vivliostyle.logging.logger.warn("E_FONT_FACE_INCOMPATIBLE", srcFace.src);
            } else {
                documentFaces.registerFamily(srcFace, viewFace);
                vivliostyle.logging.logger.warn("Found already-loaded font:", src);
            }
        });
    } else {
        fetcher = new adapt.taskutil.Fetcher(function() {
            /** @type {!adapt.task.Frame.<adapt.font.Face>} */ var frame =
                adapt.task.newFrame("loadFont");
            var deobfuscator = documentFaces.deobfuscator ? documentFaces.deobfuscator(src) : null;
            if (deobfuscator) {
                adapt.net.ajax(src, adapt.net.XMLHttpRequestResponseType.BLOB).then(function(xhr) {
                    if (!xhr.responseBlob) {
                        frame.finish(null);
                        return;
                    }
                    deobfuscator(xhr.responseBlob).then(function(fontBytes) {
                        self.initFont(srcFace, fontBytes, documentFaces).thenFinish(frame);
                    });
                });
            } else {
                self.initFont(srcFace, null, documentFaces).thenFinish(frame);
            }
            return frame.result();
        }, "loadFont " + src);
        this.srcURLMap[src] = fetcher;
        fetcher.start();
    }
    return fetcher;
};

/**
 * @param {Array.<adapt.font.Face>} srcFaces
 * @param {adapt.font.DocumentFaces} documentFaces
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.font.Mapper.prototype.findOrLoadFonts = function(srcFaces, documentFaces) {
    var fetchers = /** @type {Array.<adapt.taskutil.Fetcher.<adapt.font.Face>>} */ ([]);
    for (var i = 0; i < srcFaces.length; i++) {
        var srcFace = srcFaces[i];
        if (!srcFace.src || !srcFace.family) {
            vivliostyle.logging.logger.warn("E_FONT_FACE_INVALID");
            continue;
        }
        fetchers.push(this.loadFont(srcFace, documentFaces));
    }
    return adapt.taskutil.waitForFetchers(fetchers);
};
