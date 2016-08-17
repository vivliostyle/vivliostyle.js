/**
 * Copyright 2013 Google, Inc.
 * Copyright 2015 Vivliostyle Inc.
 * @fileoverview Sample EPUB rendering application.
 */
goog.provide('adapt.viewer');

goog.require('goog.asserts');
goog.require('vivliostyle.logging');
goog.require('adapt.task');
goog.require('adapt.vgen');
goog.require('adapt.expr');
goog.require('adapt.epub');

/**
 * @typedef {function(this:adapt.viewer.Viewer,adapt.base.JSON):adapt.task.Result.<boolean>}
 */
adapt.viewer.Action;

/**
 * @typedef {{
 * 	marginLeft: number,
 * 	marginRight: number,
 * 	marginTop: number,
 * 	marginBottom: number,
 * 	width: number,
 * 	height: number
 * }}
 */
adapt.viewer.ViewportSize;

/** @const */
adapt.viewer.VIEWPORT_STATUS_ATTRIBUTE = "data-vivliostyle-viewer-status";

/**
 * @typedef {{
 *     url: string,
 *     startPage: ?number,
 *     skipPagesBefore: ?number
 * }}
 */
adapt.viewer.SingleDocumentParam;

/**
 * @param {Window} window
 * @param {!HTMLElement} viewportElement
 * @param {string} instanceId
 * @param {function(adapt.base.JSON):void} callbackFn
 * @constructor
 */
adapt.viewer.Viewer = function(window, viewportElement, instanceId, callbackFn) {
    var self = this;
    /** @const */ this.window = window;
    /** @const */ this.viewportElement = viewportElement;
    viewportElement.setAttribute("data-vivliostyle-viewer-viewport", true);
    viewportElement.setAttribute(adapt.viewer.VIEWPORT_STATUS_ATTRIBUTE, "loading");
    /** @const */ this.instanceId = instanceId;
    /** @const */ this.callbackFn = callbackFn;
    var document = window.document;
    /** @const */ this.fontMapper = new adapt.font.Mapper(document.head, viewportElement);
    this.init();
    /** @type {function():void} */ this.kick = function() {};
    /** @type {function((adapt.base.JSON|string)):void} */ this.sendCommand = function() {};
    /** @const */ this.resizeListener = function() {
        self.needResize = true;
        self.kick();
    };
    /** @const */ this.pageReplacedListener = this.pageReplacedListener.bind(this);
    /** @type {adapt.base.EventListener} */ this.hyperlinkListener = function(evt) {};
    /** @const */ this.pageRuleStyleElement = document.getElementById("vivliostyle-page-rules");
    /** @type {boolean} */ this.pageSheetSizeAlreadySet = false;
    /**
     * @type {Object.<string, adapt.viewer.Action>}
     */
    this.actions = {
        "loadEPUB": this.loadEPUB,
        "loadXML": this.loadXML,
        "configure": this.configure,
        "moveTo": this.moveTo,
        "toc": this.showTOC
    };
    this.addLogListeners();
};

/**
 * @private
 * @return {void}
 */
adapt.viewer.Viewer.prototype.init = function() {
    /** @type {!Array.<string>} */ this.packageURL = [];
    /** @type {adapt.epub.OPFDoc} */ this.opf = null;
    /** @type {boolean} */ this.haveZipMetadata = false;
    /** @type {boolean} */ this.touchActive = false;
    /** @type {number} */ this.touchX = 0;
    /** @type {number} */ this.touchY = 0;
    /** @type {boolean} */ this.needResize = false;
    /** @type {boolean} */ this.needRefresh = false;
    /** @type {?adapt.viewer.ViewportSize} */ this.viewportSize = null;
    /** @type {adapt.vtree.Page} */ this.currentPage = null;
    /** @type {?adapt.vtree.Spread} */ this.currentSpread = null;
    /** @type {?adapt.epub.Position} */ this.pagePosition = null;
    /** @type {number} */ this.fontSize = 16;
    /** @type {number} */ this.zoom = 1;
    /** @type {boolean} */ this.waitForLoading = false;
    /** @type {boolean} */ this.renderAllPages = true;
    /** @type {adapt.expr.Preferences} */ this.pref = adapt.expr.defaultPreferences();
};

adapt.viewer.Viewer.prototype.addLogListeners = function() {
    /** @const */ var LogLevel = vivliostyle.logging.LogLevel;
    vivliostyle.logging.logger.addListener(LogLevel.DEBUG, function(info) {
        this.callback({"t": "debug", "content": info});
    }.bind(this));
    vivliostyle.logging.logger.addListener(LogLevel.INFO, function(info) {
        this.callback({"t": "info", "content": info});
    }.bind(this));
    vivliostyle.logging.logger.addListener(LogLevel.WARN, function(info) {
        this.callback({"t": "warn", "content": info});
    }.bind(this));
    vivliostyle.logging.logger.addListener(LogLevel.ERROR, function(info) {
        this.callback({"t": "error", "content": info});
    }.bind(this));
};

/**
 * @private
 * @param {adapt.base.JSON} message
 * @return {void}
 */
adapt.viewer.Viewer.prototype.callback = function(message) {
    message["i"] = this.instanceId;
    this.callbackFn(message);
};

/**
 * @param {adapt.base.JSON} command
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.viewer.Viewer.prototype.loadEPUB = function(command) {
    vivliostyle.profile.profiler.registerStartTiming("loadEPUB");
    vivliostyle.profile.profiler.registerStartTiming("loadFirstPage");
    this.viewportElement.setAttribute(adapt.viewer.VIEWPORT_STATUS_ATTRIBUTE, "loading");
    var url = /** @type {string} */ (command["url"]);
    var fragment = /** @type {?string} */ (command["fragment"]);
    var haveZipMetadata = !!command["zipmeta"];
    var userStyleSheet = /** @type {Array.<{url: ?string, text: ?string}>} */ (command["userStyleSheet"]);
    // force relayout
    this.viewport = null;
    /** @type {!adapt.task.Frame.<boolean>} */ var frame = adapt.task.newFrame("loadEPUB");
    var self = this;
    self.configure(command).then(function() {
        var store = new adapt.epub.EPUBDocStore();
        if (userStyleSheet) {
            for (var i = 0; i < userStyleSheet.length; i++) {
                store.addUserStyleSheet(userStyleSheet[i]);
            }
        }
        store.init().then(function() {
            var epubURL = adapt.base.resolveURL(url, self.window.location.href);
            self.packageURL = [epubURL];
            store.loadEPUBDoc(epubURL, haveZipMetadata).then(function(opf) {
                self.opf = opf;
                self.opf.resolveFragment(fragment).then(function(position) {
                    self.pagePosition = position;
                    self.resize().then(function() {
                        self.viewportElement.setAttribute(adapt.viewer.VIEWPORT_STATUS_ATTRIBUTE, "complete");
                        vivliostyle.profile.profiler.registerEndTiming("loadEPUB");
                        self.callback({"t":"loaded", "metadata": self.opf.getMetadata()});
                        frame.finish(true);
                    });
                });
            });
        });
    });
    return frame.result();
};

/**
 * @param {adapt.base.JSON} command
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.viewer.Viewer.prototype.loadXML = function(command) {
    vivliostyle.profile.profiler.registerStartTiming("loadXML");
    vivliostyle.profile.profiler.registerStartTiming("loadFirstPage");
    this.viewportElement.setAttribute(adapt.viewer.VIEWPORT_STATUS_ATTRIBUTE, "loading");
    /** @type {!Array<!adapt.viewer.SingleDocumentParam>} */ var params = command["url"];
    var doc = /** @type {Document} */ (command["document"]);
    var fragment = /** @type {?string} */ (command["fragment"]);
    var userStyleSheet = /** @type {Array.<{url: ?string, text: ?string}>} */ (command["userStyleSheet"]);
    // force relayout
    this.viewport = null;
    /** @type {!adapt.task.Frame.<boolean>} */ var frame = adapt.task.newFrame("loadXML");
    var self = this;
    self.configure(command).then(function() {
        var store = new adapt.epub.EPUBDocStore();
        if (userStyleSheet) {
            for (var i = 0; i < userStyleSheet.length; i++) {
                store.addUserStyleSheet(userStyleSheet[i]);
            }
        }
        store.init().then(function() {
            /** @type {!Array<!adapt.epub.OPFItemParam>} */ var resolvedParams = params.map(function(p, index) {
                return {
                    url: adapt.base.resolveURL(p.url, self.window.location.href),
                    index: index,
                    startPage: p.startPage,
                    skipPagesBefore: p.skipPagesBefore
                };
            });
            self.packageURL = resolvedParams.map(function(p) { return p.url; });
            self.opf = new adapt.epub.OPFDoc(store, "");
            self.opf.initWithChapters(resolvedParams, doc).then(function() {
                self.opf.resolveFragment(fragment).then(function(position) {
                    self.pagePosition = position;
                    self.resize().then(function() {
                        self.viewportElement.setAttribute(adapt.viewer.VIEWPORT_STATUS_ATTRIBUTE, "complete");
                        vivliostyle.profile.profiler.registerEndTiming("loadXML");
                        self.callback({"t":"loaded"});
                        frame.finish(true);
                    });
                });
            });
        });
    });
    return frame.result();
};

/**
 * @private
 * @param {string} specified
 * @returns {number}
 */
adapt.viewer.Viewer.prototype.resolveLength = function(specified) {
    var value = parseFloat(specified);
    var unitPattern = /[a-z]+$/;
    var matched;
    if (typeof specified === "string" && (matched = specified.match(unitPattern))) {
        var unit = matched[0];
        if (unit === "em" || unit === "rem") {
            return value * this.fontSize;
        }
        if (unit === "ex" || unit === "rex") {
            return value * adapt.expr.defaultUnitSizes["ex"] * this.fontSize / adapt.expr.defaultUnitSizes["em"];
        }
        var unitSize = adapt.expr.defaultUnitSizes[unit];
        if (unitSize) {
            return value * unitSize;
        }
    }
    return value;
};

/**
 * @param {adapt.base.JSON} command
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.viewer.Viewer.prototype.configure = function(command) {
    if (typeof command["autoresize"] == "boolean") {
        if (command["autoresize"]) {
            this.viewportSize = null;
            this.window.addEventListener("resize", this.resizeListener, false);
            this.needResize = true;
        } else {
            this.window.removeEventListener("resize", this.resizeListener, false);
        }
    }
    if (typeof command["fontSize"] == "number") {
        var fontSize = /** @type {number} */ (command["fontSize"]);
        if (fontSize >= 5 && fontSize <= 72 && this.fontSize != fontSize) {
            this.fontSize = fontSize;
            this.needResize = true;
        }
    }
    if (typeof command["viewport"] == "object" && command["viewport"]) {
        var vp = command["viewport"];
        var viewportSize = {
            marginLeft: this.resolveLength(vp["margin-left"]) || 0,
            marginRight: this.resolveLength(vp["margin-right"]) || 0,
            marginTop: this.resolveLength(vp["margin-top"]) || 0,
            marginBottom: this.resolveLength(vp["margin-bottom"]) || 0,
            width: this.resolveLength(vp["width"]) || 0,
            height: this.resolveLength(vp["height"]) || 0
        };
        if (viewportSize.width >= 200 || viewportSize.height >= 200) {
            this.window.removeEventListener("resize", this.resizeListener, false);
            this.viewportSize = viewportSize;
            this.needResize = true;
        }
    }
    if (typeof command["hyphenate"] == "boolean") {
        this.pref.hyphenate = command["hyphenate"];
        this.needResize = true;
    }
    if (typeof command["horizontal"] == "boolean") {
        this.pref.horizontal = command["horizontal"];
        this.needResize = true;
    }
    if (typeof command["nightMode"] == "boolean") {
        this.pref.nightMode = command["nightMode"];
        this.needResize = true;
    }
    if (typeof command["lineHeight"] == "number") {
        this.pref.lineHeight = command["lineHeight"];
        this.needResize = true;
    }
    if (typeof command["columnWidth"] == "number") {
        this.pref.columnWidth = command["columnWidth"];
        this.needResize = true;
    }
    if (typeof command["fontFamily"] == "string") {
        this.pref.fontFamily = command["fontFamily"];
        this.needResize = true;
    }
    if (typeof command["load"] == "boolean") {
        this.waitForLoading = command["load"];  // Load images (and other resources) on the page.
    }
    if (typeof command["renderAllPages"] == "boolean") {
        this.renderAllPages = command["renderAllPages"];
    }
    if (typeof command["userAgentRootURL"] == "string") {
        adapt.base.resourceBaseURL = command["userAgentRootURL"];
    }
    if (typeof command["spreadView"] == "boolean" && command["spreadView"] !== this.pref.spreadView) {
        // Force relayout
        this.viewport = null;
        this.pref.spreadView = command["spreadView"];
        this.needResize = true;
    }
    if (typeof command["pageBorder"] == "number" && command["pageBorder"] !== this.pref.pageBorder) {
        // Force relayout
        this.viewport = null;
        this.pref.pageBorder = command["pageBorder"];
        this.needResize = true;
    }
    if (typeof command["zoom"] == "number" && command["zoom"] !== this.zoom) {
        this.zoom = command["zoom"];
        this.needRefresh = true;
    }
    return adapt.task.newResult(true);
};

/**
 * Refresh view when a currently displayed page is replaced (by re-layout caused by cross reference resolutions)
 * @param {adapt.base.Event} evt
 */
adapt.viewer.Viewer.prototype.pageReplacedListener = function(evt) {
    var currentPage = this.currentPage;
    var spread = this.currentSpread;
    var target = evt.target;
    if (spread) {
        if (spread.left === target || spread.right === target) {
            this.showCurrent(evt.newPage);
        }
    } else if (currentPage === evt.target) {
        this.showCurrent(evt.newPage);
    }
};

/**
 * Hide current pages (this.currentPage, this.currentSpread)
 * @private
 */
adapt.viewer.Viewer.prototype.hidePages = function() {
    var pages = [];
    if (this.currentPage) {
        pages.push(this.currentPage);
        this.currentPage = null;
    }
    if (this.currentSpread) {
        pages.push(this.currentSpread.left);
        pages.push(this.currentSpread.right);
        this.currentSpread = null;
    }
    pages.forEach(function(page) {
        if (page) {
            adapt.base.setCSSProperty(page.container, "display", "none");
            page.removeEventListener("hyperlink", this.hyperlinkListener, false);
            page.removeEventListener("replaced", this.pageReplacedListener, false);
        }
    }, this);
};

/**
 * @private
 * @param {!adapt.vtree.Page} page
 */
adapt.viewer.Viewer.prototype.showSinglePage = function(page) {
    page.addEventListener("hyperlink", this.hyperlinkListener, false);
    page.addEventListener("replaced", this.pageReplacedListener, false);
    adapt.base.setCSSProperty(page.container, "visibility", "visible");
    adapt.base.setCSSProperty(page.container, "display", "block");
};

/**
 * @private
 * @param {!adapt.vtree.Page} page
 * @return {void}
 */
adapt.viewer.Viewer.prototype.showPage = function(page) {
    this.hidePages();
    this.currentPage = page;
    this.showSinglePage(page);
};

/**
 * @private
 * @param {adapt.vtree.Spread} spread
 */
adapt.viewer.Viewer.prototype.showSpread = function(spread) {
    this.hidePages();
    this.currentSpread = spread;
    if (spread.left) {
        this.showSinglePage(spread.left);
        if (!spread.right) {
            spread.left.container.setAttribute("data-vivliostyle-unpaired-page", true);
        }
    }
    if (spread.right) {
        this.showSinglePage(spread.right);
        if (!spread.left) {
            spread.right.container.setAttribute("data-vivliostyle-unpaired-page", true);
        }
    }
};

/**
 * @private
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.viewer.Viewer.prototype.reportPosition = function() {
    /** @type {!adapt.task.Frame.<boolean>} */ var frame = adapt.task.newFrame("reportPosition");
    var self = this;
    if (!self.pagePosition) {
        self.pagePosition = self.opfView.getPagePosition();
    }
    self.opf.getCFI(this.pagePosition.spineIndex, this.pagePosition.offsetInItem).then(function(cfi) {
        var page = self.currentPage;
        var r = self.waitForLoading && page.fetchers.length > 0
            ? adapt.taskutil.waitForFetchers(page.fetchers) : adapt.task.newResult(true);
        r.then(function() {
            self.sendLocationNotification(page, cfi).thenFinish(frame);
        });
    });
    return frame.result();
};

/**
 * @private
 * @return {adapt.vgen.Viewport}
 */
adapt.viewer.Viewer.prototype.createViewport = function() {
    var viewportElement = this.viewportElement;
    if (this.viewportSize) {
        var vs = this.viewportSize;
        viewportElement.style.marginLeft = vs.marginLeft + "px";
        viewportElement.style.marginRight = vs.marginRight + "px";
        viewportElement.style.marginTop = vs.marginTop + "px";
        viewportElement.style.marginBottom = vs.marginBottom + "px";
        return new adapt.vgen.Viewport(this.window, this.fontSize, viewportElement, vs.width, vs.height);
    } else {
        return new adapt.vgen.Viewport(this.window, this.fontSize, viewportElement);
    }
};

/**
 * @private
 * @return {boolean}
 */
adapt.viewer.Viewer.prototype.sizeIsGood = function() {
    if (this.viewportSize || !this.viewport || this.viewport.fontSize != this.fontSize) {
        return false;
    }
    var viewport = this.createViewport();
    return (viewport.width == this.viewport.width && viewport.height == this.viewport.height) ||
        (this.opfView && !this.opfView.hasAutoSizedPages());
};

/**
 * @private
 * @param {!Object<string, !{width: number, height: number}>} pageSheetSize
 * @param {number} spineIndex
 * @param {number} pageIndex
 */
adapt.viewer.Viewer.prototype.setPageSizePageRules = function(pageSheetSize, spineIndex, pageIndex) {
    if (!this.pageSheetSizeAlreadySet && this.pageRuleStyleElement && spineIndex === 0 && pageIndex === 0) {
        var styleText = "";
        Object.keys(pageSheetSize).forEach(function(selector) {
            styleText += "@page " + selector + "{size:";
            var size = pageSheetSize[selector];
            styleText += size.width + "px " + size.height + "px;}";
        });
        this.pageRuleStyleElement.textContent = styleText;
        this.pageSheetSizeAlreadySet = true;
    }
};

adapt.viewer.Viewer.prototype.removePageSizePageRules = function() {
    if (this.pageRuleStyleElement) {
        this.pageRuleStyleElement.textContent = "";
        this.pageSheetSizeAlreadySet = false;
    }
};

/**
 * @private
 * @return {void}
 */
adapt.viewer.Viewer.prototype.reset = function() {
    if (this.opfView) {
        this.opfView.hideTOC();
        this.opfView.removeRenderedPages();
    }
    this.removePageSizePageRules();
    this.viewport = this.createViewport();
    this.viewport.resetZoom();
    this.opfView = new adapt.epub.OPFView(this.opf, this.viewport, this.fontMapper, this.pref,
        this.setPageSizePageRules.bind(this));
};

/**
 * Show current page or spread depending on the setting (this.pref.spreadView).
 * @private
 * @param {!adapt.vtree.Page} page
 * @returns {!adapt.task.Result}
 */
adapt.viewer.Viewer.prototype.showCurrent = function(page) {
    this.needRefresh = false;
    var self = this;
    if (this.pref.spreadView) {
        return this.opfView.getCurrentSpread().thenAsync(function(spread) {
            self.showSpread(spread);
            self.setSpreadZoom(spread);
            self.currentPage = page;
            return adapt.task.newResult(null);
        });
    } else {
        this.showPage(page);
        this.setPageZoom(page);
        this.currentPage = page;
        return adapt.task.newResult(null);
    }
};

/**
 * @param {!adapt.vtree.Page} page
 */
adapt.viewer.Viewer.prototype.setPageZoom = function(page) {
    this.viewport.zoom(page.dimensions.width, page.dimensions.height, this.zoom);
};

/**
 * @param {!adapt.vtree.Spread} spread
 */
adapt.viewer.Viewer.prototype.setSpreadZoom = function(spread) {
    var dim = this.getSpreadDimensions(spread);
    this.viewport.zoom(dim.width, dim.height, this.zoom);
};

/**
 * Returns width and height of the spread, including the margin between pages.
 * @param {!adapt.vtree.Spread} spread
 * @returns {!{width: number, height: number}}
 */
adapt.viewer.Viewer.prototype.getSpreadDimensions = function(spread) {
    var width = 0, height = 0;
    if (spread.left) {
        width += spread.left.dimensions.width;
        height = spread.left.dimensions.height;
    }
    if (spread.right) {
        width += spread.right.dimensions.width;
        height = Math.max(height, spread.right.dimensions.height);
    }
    if (spread.left && spread.right) {
        width += this.pref.pageBorder * 2;
    }
    return {width: width, height: height};
};

/**
 * @enum {string}
 */
adapt.viewer.ZoomType = {
    FIT_INSIDE_VIEWPORT: "fit inside viewport"
};

/**
 * Returns zoom factor corresponding to the specified zoom type.
 * @param {adapt.viewer.ZoomType} type
 * @returns {number}
 */
adapt.viewer.Viewer.prototype.queryZoomFactor = function(type) {
    if (!this.currentPage) {
        throw new Error("no page exists.");
    }
    switch (type) {
        case adapt.viewer.ZoomType.FIT_INSIDE_VIEWPORT:
            var pageDim;
            if (this.pref.spreadView) {
                goog.asserts.assert(this.currentSpread);
                pageDim = this.getSpreadDimensions(this.currentSpread);
            } else {
                pageDim = this.currentPage.dimensions;
            }
            var widthZoom = this.viewport.width / pageDim.width;
            var heightZoom = this.viewport.height / pageDim.height;
            return Math.min(widthZoom, heightZoom);
        default:
            throw new Error("unknown zoom type: " + type);
    }
};

/**
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.viewer.Viewer.prototype.resize = function() {
    this.needResize = false;
    if (this.sizeIsGood()) {
        return adapt.task.newResult(true);
    }
    var self = this;
    if (this.viewportElement.getAttribute(adapt.viewer.VIEWPORT_STATUS_ATTRIBUTE) === "complete") {
        this.viewportElement.setAttribute(adapt.viewer.VIEWPORT_STATUS_ATTRIBUTE, "resizing");
    }
    self.callback({"t": "resizestart"});
    /** @type {!adapt.task.Frame.<boolean>} */ var frame = adapt.task.newFrame("resize");
    if (self.opfView && !self.pagePosition) {
        self.pagePosition = self.opfView.getPagePosition();
    }
    self.reset();

    // With renderAllPages option specified, the rendering is performed after the initial page display,
    // otherwise users are forced to wait the rendering finish in front of a blank page.
    self.opfView.setPagePosition(self.pagePosition).then(function(page) {
        self.showCurrent(page).then(function() {
            self.reportPosition().then(function(p) {
                vivliostyle.profile.profiler.registerEndTiming("loadFirstPage");
                var r = self.renderAllPages ? self.opfView.renderAllPages() : adapt.task.newResult(null);
                r.then(function() {
                    self.viewportElement.setAttribute(adapt.viewer.VIEWPORT_STATUS_ATTRIBUTE, "complete");
                    self.callback({"t": "resizeend"});
                    frame.finish(p);
                });
            });
        });
    });
    return frame.result();
};

/**
 * @private
 * @param {adapt.vtree.Page} page
 * @param {?string} cfi
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.viewer.Viewer.prototype.sendLocationNotification = function(page, cfi) {
    /** @type {!adapt.task.Frame.<boolean>} */ var frame = adapt.task.newFrame("sendLocationNotification");
    var notification = {"t": "nav", "first": page.isFirstPage,
        "last": page.isLastPage};
    var self = this;
    this.opf.getEPageFromPosition(/** @type {adapt.epub.Position} */(self.pagePosition)).then(function(epage) {
        notification["epage"] = epage;
        notification["epageCount"] = self.opf.epageCount;
        if (cfi) {
            notification["cfi"] = cfi;
        }
        self.callback(notification);
        frame.finish(true);
    });
    return frame.result();
};

/**
 * @returns {?vivliostyle.constants.PageProgression}
 */
adapt.viewer.Viewer.prototype.getCurrentPageProgression = function() {
    return this.opfView ? this.opfView.getCurrentPageProgression() : null;
};

/**
 * @param {adapt.base.JSON} command
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.viewer.Viewer.prototype.moveTo = function(command) {
    var method;
    var self = this;
    if (typeof command["where"] == "string") {
        switch (command["where"]) {
            case "next":
                method = this.pref.spreadView ? this.opfView.nextSpread : this.opfView.nextPage;
                break;
            case "previous":
                method = this.pref.spreadView ? this.opfView.previousSpread : this.opfView.previousPage;
                break;
            case "last":
                method = this.opfView.lastPage;
                break;
            case "first":
                method = this.opfView.firstPage;
                break;
            default:
                return adapt.task.newResult(true);
        }
    } else if (typeof command["epage"] == "number") {
        var epage = /** @type {number} */ (command["epage"]);
        method = function() {
            return self.opfView.navigateToEPage(epage);
        };
    } else if (typeof command["url"] == "string") {
        var url = /** @type {string} */ (command["url"]);
        method = function() {
            return self.opfView.navigateTo(url);
        };
    } else {
        return adapt.task.newResult(true);
    }
    /** @type {!adapt.task.Frame.<boolean>} */ var frame = adapt.task.newFrame("nextPage");
    method.call(self.opfView).then(/** @param {adapt.vtree.Page} page */ function(page) {
        if (page) {
            self.pagePosition = null;
            self.showCurrent(page).then(function() {
                self.reportPosition().thenFinish(frame);
            });
        } else {
            frame.finish(true);
        }
    });
    return frame.result();
};

/**
 * @param {adapt.base.JSON} command
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.viewer.Viewer.prototype.showTOC = function(command) {
    var autohide = !!command["autohide"];
    var visibility = command["v"];
    var currentVisibility = this.opfView.isTOCVisible();
    if (currentVisibility) {
        if (visibility == "show") {
            return adapt.task.newResult(true);
        }
    } else {
        if (visibility == "hide") {
            return adapt.task.newResult(true);
        }
    }
    if (currentVisibility) {
        this.opfView.hideTOC();
        return adapt.task.newResult(true);
    } else {
        var self = this;
        /** @type {adapt.task.Frame.<boolean>} */ var frame = adapt.task.newFrame("showTOC");
        this.opfView.showTOC(autohide).then(function(page) {
            if (page) {
                if (autohide) {
                    var hideTOC = function() {self.opfView.hideTOC();};
                    page.addEventListener("hyperlink", hideTOC, false);
                    page.container.addEventListener("click", hideTOC, false);
                }
                page.addEventListener("hyperlink", self.hyperlinkListener, false);
            }
            frame.finish(true);
        });
        return frame.result();
    }
};

/**
 * @param {adapt.base.JSON} command
 * @return {adapt.task.Result.<boolean>}
 */
adapt.viewer.Viewer.prototype.runCommand = function(command) {
    var self = this;
    var actionName = command["a"] || "";
    return adapt.task.handle("runCommand", function(frame) {
        var action = self.actions[actionName];
        if (action) {
            action.call(self, command).then(function() {
                self.callback({"t": "done", "a": actionName});
                frame.finish(true);
            });
        } else {
            vivliostyle.logging.logger.error("No such action:", actionName);
            frame.finish(true);
        }
    }, function(frame, err) {
        vivliostyle.logging.logger.error(err, "Error during action:", actionName);
        frame.finish(true);
    });
};

/**
 * @private
 * @param {*} cmd
 * @return {adapt.base.JSON}
 */
adapt.viewer.maybeParse = function(cmd) {
    if (typeof cmd == "string") {
        return adapt.base.stringToJSON(cmd);
    }
    return cmd;
};

/**
 * @param {adapt.base.JSON|string} cmd
 * @return {void}
 */
adapt.viewer.Viewer.prototype.initEmbed = function(cmd) {
    var command = adapt.viewer.maybeParse(cmd);
    var continuation = null;
    var viewer = this;
    adapt.task.start(function() {
        /** @type {!adapt.task.Frame.<boolean>} */ var frame = adapt.task.newFrame("commandLoop");
        var scheduler = adapt.task.currentTask().getScheduler();
        viewer.hyperlinkListener = function(evt) {
            var hrefEvent = /** @type {adapt.vtree.PageHyperlinkEvent} */ (evt);
            var internal = hrefEvent.href.charAt(0) === "#" ||
                viewer.packageURL.some(function(url) {
                    return hrefEvent.href.substr(0, url.length) == url;
                });
            if (internal) {
                evt.preventDefault();
                var msg = {"t":"hyperlink", "href":hrefEvent.href, "internal": internal};
                scheduler.run(function() {
                    viewer.callback(msg);
                    return adapt.task.newResult(true);
                });
            }
        };
        frame.loopWithFrame(function(loopFrame) {
            if (viewer.needResize) {
                viewer.resize().then(function() {
                    loopFrame.continueLoop();
                });
            } else if (viewer.needRefresh) {
                if (viewer.currentPage) {
                    viewer.showCurrent(viewer.currentPage).then(function() {
                        loopFrame.continueLoop();
                    });
                }
            } else if (command) {
                var cmd = command;
                command = null;
                viewer.runCommand(cmd).then(function() {
                    loopFrame.continueLoop();
                });
            } else {
                /** @type {!adapt.task.Frame.<boolean>} */ var frameInternal =
                    adapt.task.newFrame('waitForCommand');
                continuation = frameInternal.suspend(self);
                frameInternal.result().then(function() {
                    loopFrame.continueLoop();
                });
            }
        }).thenFinish(frame);
        return frame.result();
    });

    viewer.kick = function() {
        var cont = continuation;
        if (cont) {
            continuation = null;
            cont.schedule();
        }
    };

    viewer.sendCommand = function(cmd) {
        if (command) {
            return false;
        }
        command = adapt.viewer.maybeParse(cmd);
        viewer.kick();
        return true;
    };

    this.window["adapt_command"] = viewer.sendCommand;
};
