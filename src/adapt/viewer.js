/**
 * Copyright 2013 Google, Inc.
 * Copyright 2015 Vivliostyle Inc.
 * @fileoverview Sample EPUB rendering application.
 */
goog.provide('adapt.viewer');

goog.require('adapt.task');
goog.require('adapt.vgen');
goog.require('adapt.expr');
goog.require('adapt.epub');
goog.require('adapt.devel');

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


/**
 * @param {Window} window
 * @param {string} instanceId
 * @param {function(adapt.base.JSON):void} callbackFn
 * @constructor
 */
adapt.viewer.Viewer = function(window, instanceId, callbackFn) {
	var self = this;
	/** @const */ this.window = window;
	/** @const */ this.instanceId = instanceId;
	/** @const */ this.callbackFn = callbackFn;
	var document = window.document;
    /** @const */ this.fontMapper = new adapt.font.Mapper(document.head, document.body);
    this.init();
    /** @type {function():void} */ this.kick = function(){};
    /** @const */ this.resizeListener = function() {
    	self.needResize = true;
    	self.kick();
    };
    /** @type {adapt.base.EventListener} */ this.hyperlinkListener = function(evt) {};
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
};

/**
 * @return {void}
 */
adapt.viewer.Viewer.prototype.init = function() {
	/** @type {string} */ this.packageURL = "";
	/** @type {adapt.epub.OPFDoc} */ this.opf = null;
    /** @type {boolean} */ this.haveZipMetadata = false;
    /** @type {boolean} */ this.touchActive = false;
    /** @type {number} */ this.touchX = 0;
    /** @type {number} */ this.touchY = 0;
    /** @type {boolean} */ this.needResize = false;
    /** @type {?adapt.viewer.ViewportSize} */ this.viewportSize = null;
    /** @type {adapt.vtree.Page} */ this.newPage = null;
    /** @type {adapt.vtree.Page} */ this.currentPage = null;
    /** @type {?adapt.epub.Position} */ this.pagePosition = null;
    /** @type {number} */ this.fontSize = 16;
    /** @type {boolean} */ this.waitForLoading = false;
    /** @type {adapt.expr.Preferences} */ this.pref = adapt.expr.defaultPreferences();	
};

adapt.viewer.Viewer.prototype.clearPages = function() {
    if (this.currentPage) {
        this.viewport.root.removeChild(this.currentPage.container);
        this.currentPage = null;
    }
	if (this.newPage) {
        this.viewport.root.removeChild(this.newPage.container);		
		this.newPage = null;
	}
};

/**
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
	var url = /** @type {string} */ (command["url"]);
	var fragment = /** @type {?string} */ (command["fragment"]);
	var haveZipMetadata = !!command["zipmeta"];
    var userStyleSheet = /** @type {Array.<{url: ?string, text: ?string}>} */ (command["userStyleSheet"]);
	/** @type {!adapt.task.Frame.<boolean>} */ var frame = adapt.task.newFrame("loadEPUB");
	var self = this;
	var store = new adapt.epub.EPUBDocStore();
    if (userStyleSheet) {
        for (var i = 0; i < userStyleSheet.length; i++) {
            store.addUserStyleSheet(userStyleSheet[i]);
        }
    }
	store.init().then(function() {
	    var epubURL = adapt.base.resolveURL(url, self.window.location.href);
	    self.packageURL = epubURL;
	    store.loadEPUBDoc(epubURL, haveZipMetadata).then(function (opf) {
	        self.opf = opf;
	        self.opf.resolveFragment(fragment).then(function(position) {
	        	self.pagePosition = position;
	        	self.configure(command).then(function() {
	        		self.resize().then(function() {
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
	var url = /** @type {string} */ (command["url"]);
    var doc = /** @type {Document} */ (command["document"]);
	var fragment = /** @type {?string} */ (command["fragment"]);
    var userStyleSheet = /** @type {Array.<{url: ?string, text: ?string}>} */ (command["userStyleSheet"]);
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
	    var xmlURL = adapt.base.resolveURL(url, self.window.location.href);
	    self.packageURL = xmlURL;
	    self.opf = new adapt.epub.OPFDoc(store, "");
	    self.opf.initWithSingleChapter(xmlURL, doc).then(function() {
            self.opf.resolveFragment(fragment).then(function(position) {
                self.pagePosition = position;
                self.callback({"t":"loaded"});
                self.resize().then(function() {
                    frame.finish(true);
                });
            });
        });
	});
    });
    return frame.result();
};

/**
 * @param {string} specified
 * @returns {number}
 */
adapt.viewer.Viewer.prototype.resolveLength = function (specified) {
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
        this.pref.renderAllPages = command["renderAllPages"];
    }
    if (typeof command["userAgentRootURL"] == "string") {
        adapt.base.resourceBaseURL = command["userAgentRootURL"];
    }
	return adapt.task.newResult(true);
};

/**
 * @return {void}
 */
adapt.viewer.Viewer.prototype.showPage = function() {
    if (this.newPage) {
	    if (this.currentPage) {
            adapt.base.setCSSProperty(this.currentPage.container, "display", "none");
	    	this.currentPage.removeEventListener("hyperlink", this.hyperlinkListener, false);
	    }
	    this.currentPage = this.newPage;
    	adapt.base.setCSSProperty(this.newPage.container, "visibility", "visible");
        adapt.base.setCSSProperty(this.newPage.container, "display", "block");
	    this.newPage = null;
    }
};

/**
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.viewer.Viewer.prototype.reportPosition = function() {
    /** @type {!adapt.task.Frame.<boolean>} */ var frame = adapt.task.newFrame("reportPosition");
    var self = this;
    if (!self.pagePosition) {
		self.pagePosition = self.opfView.getPagePosition();
    }
    self.opf.getCFI(this.pagePosition.spineIndex, 
		this.pagePosition.offsetInItem).then(function(cfi) {
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
 * @return {adapt.vgen.Viewport}
 */
adapt.viewer.Viewer.prototype.createViewport = function() {
	if (this.viewportSize) {
		var vs = this.viewportSize;
		var body = this.window.document.body;
		body.style.marginLeft = vs.marginLeft + "px";
		body.style.marginRight = vs.marginRight + "px";
		body.style.marginTop = vs.marginTop + "px";
		body.style.marginBottom = vs.marginBottom + "px";
		body.style.width = vs.width + "px";
		body.style.height = vs.height + "px";
		return new adapt.vgen.Viewport(this.window, this.fontSize, body, vs.width, vs.height);			
	} else {
		return new adapt.vgen.Viewport(this.window, this.fontSize);	
	}
};

/**
 * @return {boolean}
 */
adapt.viewer.Viewer.prototype.sizeIsGood = function() {
	if (this.viewportSize || !this.viewport || this.viewport.fontSize != this.fontSize) {
		return false;
	}
	var viewport = this.createViewport();
	return viewport.width == this.viewport.width && viewport.height == this.viewport.height;
};

/**
 * @return {void}
 */
adapt.viewer.Viewer.prototype.reset = function() {
	if (this.opfView) {
		this.opfView.hideTOC();
        this.opfView.removeRenderedPages();
	}
	this.viewport = this.createViewport();
    this.opfView = new adapt.epub.OPFView(this.opf, this.viewport, this.fontMapper, this.pref);
};

/**
 * @param {adapt.vtree.Page} page
 * @return {void}
 */
adapt.viewer.Viewer.prototype.setNewPage = function(page) {
	this.newPage = page;
	page.addEventListener("hyperlink", this.hyperlinkListener, false);
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
	/** @type {!adapt.task.Frame.<boolean>} */ var frame = adapt.task.newFrame("resize");
	if (self.opfView && !self.pagePosition) {
		self.pagePosition = self.opfView.getPagePosition();
	}
	self.reset();

    // With renderAllPages option specified, the rendering is performed after the initial page display,
    // otherwise users are forced to wait the rendering finish in front of a blank page.
    self.opfView.setPagePosition(self.pagePosition).then(function(page) {
        self.setNewPage(page);
        self.showPage();
        self.reportPosition().then(function(p) {
            var r = self.pref.renderAllPages ? self.opfView.renderAllPages() : adapt.task.newResult(null);
            r.then(function() { frame.finish(p); })
        })
    });
	return frame.result();
};

/**
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
 * @param {adapt.base.JSON} command
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.viewer.Viewer.prototype.moveTo = function(command) {
	var method;
	var self = this;
	if (typeof command["where"] == "string") {
		switch (command["where"]) {
		case "next":
			method = this.opfView.nextPage;
			break;
		case "previous":
			method = this.opfView.previousPage;
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
			self.setNewPage(page);
	    	self.showPage();
			self.reportPosition().thenFinish(frame);
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
			self.callback({"t": "error", "content": "No such action", "a": actionName});
			frame.finish(true);
		}
	}, function(frame, err) {
		self.callback({"t": "error", "content": err.toString(), "a": actionName});
		frame.finish(true);
	});
};

/**
 * @param {*} cmd
 * @return {adapt.base.JSON}
 */
adapt.viewer.maybeParse = function (cmd) {
    if (typeof cmd == "string") {
        return adapt.base.stringToJSON(cmd);
    }
    return cmd;
};

/**
 * @param {adapt.base.JSON|string} cmd
 * @return {void}
 */
adapt.viewer.Viewer.prototype.initEmbed = function (cmd) {
    var command = adapt.viewer.maybeParse(cmd);
	var continuation = null;
	var viewer = this;
	adapt.task.start(function() {
    	/** @type {!adapt.task.Frame.<boolean>} */ var frame = adapt.task.newFrame("commandLoop");
        var scheduler = adapt.task.currentTask().getScheduler();
        viewer.hyperlinkListener = function(evt) {
    		var hrefEvent = /** @type {adapt.vtree.PageHyperlinkEvent} */ (evt);
    		var internal = hrefEvent.href.substr(0, viewer.packageURL.length) == viewer.packageURL;
    		var msg = {"t":"hyperlink", "href":hrefEvent.href, "internal": internal};
    		scheduler.run(function() {
    			viewer.callback(msg);
    			return adapt.task.newResult(true);
    		});
        };    	
		frame.loopWithFrame(function(loopFrame) {
			if (viewer.needResize) {
				viewer.resize().then(function() {
					loopFrame.continueLoop();
				});
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
	
	this.window["adapt_command"] = function(cmd) {
		if (command) {
			return false;
		}
		command = adapt.viewer.maybeParse(cmd);
		viewer.kick();
		return true;
	};	
};

if (window["adapt_embedded"]) {
	/**
	 * @param {string} msgurl
	 * @param {adapt.base.JSON} command
	 * @return {void}
	 */
	window["adapt_initEmbed"] = function(msgurl, instanceId, command) {
		/**
		 * @param {adapt.base.JSON} msg
		 */
		var postMessage = function(msg) {
			var msgstr = adapt.base.jsonToString(msg);
			var fetcher = new adapt.taskutil.Fetcher(function() {
			    return adapt.net.ajax(msgurl, false, "POST", msgstr);
			});
			fetcher.start();	
		};		
		var viewer = new adapt.viewer.Viewer(window, instanceId, postMessage);
		viewer.initEmbed(command);
		delete window["adapt_initEmbed"];
	};
}
