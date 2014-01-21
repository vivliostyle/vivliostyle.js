/**
 * Copyright 2013 Google, Inc.
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
 * 	height: number,
 * 	fontSize: number
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
	/** @type {adapt.epub.OPFDoc} */ this.opf = null;
    /** @const */ this.fontMapper = new adapt.font.Mapper(document.head, document.body);
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
    /** @const */ this.pref = adapt.expr.defaultPreferences();
    /** @type {function():void} */ this.kick = function(){};
    /** @const */ this.resizeListener = function() {
    	self.needResize = true;
    	self.kick();
    };
    /** @const {adapt.base.EventListener} */ this.hyperlinkListener = function(evt) {
		var hrefEvent = /** @type {adapt.vtree.PageHyperlinkEvent} */ (evt);
    	callbackFn({"t":"hyperlink", "href":hrefEvent.href, "i": instanceId});
    };
    /**
     * @type {Object.<string, adapt.viewer.Action>}
     */
    this.actions = {
        "loadEPUB": this.loadEPUB,
        "loadXML": this.loadXML,
        "configure": this.configure,
    	"moveToPage": this.moveToPage
    };
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
	/** @type {!adapt.task.Frame.<boolean>} */ var frame = adapt.task.newFrame("loadEPUB");
	var self = this;
	var store = new adapt.epub.EPUBDocStore();
	store.init().then(function() {
	    var epubURL = adapt.base.resolveURL(url, self.window.location.href);
	    store.loadEPUBDoc(epubURL, haveZipMetadata).then(function (opf) {
	        self.opf = opf;
	        self.opf.resolveFragment(fragment).then(function(position) {
	        	self.pagePosition = position;
	        	self.configure(command).then(function() {
	        		self.resize().then(function() {
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
 * @param {adapt.base.JSON} command
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.viewer.Viewer.prototype.loadXML = function(command) {
	var url = /** @type {string} */ (command["url"]);
	var fragment = /** @type {?string} */ (command["fragment"]);
	/** @type {!adapt.task.Frame.<boolean>} */ var frame = adapt.task.newFrame("loadXML");
	var self = this;
	var store = new adapt.epub.EPUBDocStore();
	store.init().then(function() {
	    var xmlURL = adapt.base.resolveURL(url, self.window.location.href);
	    self.opf = new adapt.epub.OPFDoc(store, "");
	    self.opf.initWithSingleChapter(xmlURL);
        self.opf.resolveFragment(fragment).then(function(position) {
        	self.pagePosition = position;
        	self.configure(command).then(function() {
        		self.resize().then(function() {
	    	    	self.callback({"t":"loaded"});
	    	    	frame.finish(true);
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
	if (typeof command["viewport"] == "object" && command["viewport"]) {
		var vp = command["viewport"];
		var viewportSize = {
			marginLeft: parseFloat(vp["margin-left"]) || 0,
			marginRight: parseFloat(vp["margin-right"]) || 0,
			marginTop: parseFloat(vp["margin-top"]) || 0,
			marginBottom: parseFloat(vp["margin-bottom"]) || 0,
			width: parseFloat(vp["width"]) || 0,
			height: parseFloat(vp["height"]) || 0,
			fontSize: parseFloat(vp["font-size"]) || 16
		};
		if (viewportSize.width >= 200 || viewportSize.height >= 200) {
			this.window.removeEventListener("resize", this.resizeListener, false);			
			this.viewportSize = viewportSize;
			this.needResize = true;
		}
	}
	return adapt.task.newResult(true);
};

/**
 * @return {void}
 */
adapt.viewer.Viewer.prototype.showPage = function() {
    if (this.newPage) {
	    if (this.currentPage) {
	        this.viewport.root.removeChild(this.currentPage.container);
	    }
	    if (this.currentPage) {
	    	this.currentPage.removeEventListener("hyperlink", this.hyperlinkListener, false);
	    }
	    this.currentPage = this.newPage;
    	adapt.base.setCSSProperty(this.newPage.container, "visibility", "visible");
	    this.newPage = null;
    }
};

/**
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.viewer.Viewer.prototype.showPosition = function() {
    if (!this.pagePosition) {
		this.pagePosition = this.opfView.getPagePosition();
		if (!this.pagePosition) {
			return adapt.task.newResult(false);
		}
    }
    /** @type {!adapt.task.Frame.<boolean>} */ var frame =
    		adapt.task.newFrame("showPosition");
    this.opf.getCFI(this.pagePosition.spineIndex, 
		this.pagePosition.offsetInItem).then(function(cfi) {
			// Report CFI
			frame.finish(true);
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
		return new adapt.vgen.Viewport(this.window, vs.fontSize, body, vs.width, vs.height);			
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
	self.opfView.setPagePosition(self.pagePosition).then(function(page) {
		self.setNewPage(page);
		self.showPage();
		self.showPosition().then(function() {
			self.sendLocationNotification(page).thenFinish(frame);
		});
	});
	return frame.result();
};

/**
 * @param {adapt.vtree.Page} page
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.viewer.Viewer.prototype.sendLocationNotification = function(page) {
	/** @type {!adapt.task.Frame.<boolean>} */ var frame = adapt.task.newFrame("sendLocationNotification");
	var notification = {"t": "nav", "first": page.isFirstPage,
			"last": page.isLastPage};
	var self = this;
	this.opf.getEPageFromIndices(page.spineIndex, page.offset).then(function(epage) {
		notification["epage"] = epage;
		notification["epageCount"] = self.opf.epageCount;
		self.callback(notification);
		frame.finish(true);
	});
	return frame.result();
};

/**
 * @param {adapt.base.JSON} command
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.viewer.Viewer.prototype.moveToPage = function(command) {
	var method;
	var waitForLoading = !!command["load"];  // Load images (and other resources) on the page.
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
	var self = this;
	/** @type {!adapt.task.Frame.<boolean>} */ var frame = adapt.task.newFrame("nextPage");
	method.call(self.opfView).then(function(page) {
		if (page) {
			self.pagePosition = null;
			self.setNewPage(page);
	    	self.showPage();
	    	self.showPosition().then(function() {
	    		var r = waitForLoading && page.fetchers.length > 0 
	    			? adapt.taskutil.waitForFetchers(page.fetchers) : adapt.task.newResult(true);
	    		r.then(function() {
	    			self.sendLocationNotification(page).thenFinish(frame);
	    		});
	    	});
		} else {
			frame.finish(true);
		}
	});
	return frame.result();
};

/**
 * @param {string} href
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.viewer.Viewer.prototype.navigateTo = function(href) {
	var self = this;
	/** @type {!adapt.task.Frame.<boolean>} */ var frame = adapt.task.newFrame("navigateTo");
	self.opfView.navigateTo(href).then(function(page) {
		if (page) {
			self.setNewPage(page);
			self.showPage();
			self.pagePosition = self.opfView.getPagePosition();
	    	self.showPosition().then(function() {
    			self.sendLocationNotification(page).thenFinish(frame);
	    	});
		} else {
			frame.finish(true);			
		}
	});
	return frame.result();
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
 * @param {adapt.base.JSON} command
 * @return {void}
 */
adapt.viewer.Viewer.prototype.initEmbed = function(command) {
	var continuation = null;
	var viewer = this;
	adapt.task.start(function() {
    	/** @type {!adapt.task.Frame.<boolean>} */ var frame = adapt.task.newFrame("commandLoop");
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
		command = cmd;
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
		var viewer = new adapt.viewer.Viewer(window, instanceId,
			/** @param {adapt.base.JSON} msg */ function(msg) {
				var msgstr = adapt.base.jsonToString(msg);
				var fetcher = new adapt.taskutil.Fetcher(function() {
				    return adapt.net.ajax(msgurl, false, "POST", msgstr);
				});
				fetcher.start();
			});
		viewer.initEmbed(command);
		delete window["adapt_initEmbed"];
	};
}
