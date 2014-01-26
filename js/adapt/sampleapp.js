/**
 * Copyright 2013 Google, Inc.
 * @fileoverview Sample EPUB rendering application.
 */
goog.provide('adapt.sampleapp');

goog.require('adapt.task');
goog.require('adapt.vgen');
goog.require('adapt.expr');
goog.require('adapt.epub');
goog.require('adapt.devel');

/**
 * @const
 */
adapt.sampleapp.embedded = !!window["adapt_embedded"];

/**
 * @param {adapt.epub.OPFDoc} opf
 * @constructor
 */
adapt.sampleapp.Viewer = function(opf) {
	/** @const */ this.opf = opf;
    /** @const */ this.fontMapper = new adapt.font.Mapper(document.head, document.body);
    /** @type {boolean} */ this.touchActive = false;
    /** @type {number} */ this.touchX = 0;
    /** @type {number} */ this.touchY = 0;
    /** @type {adapt.vtree.Page} */ this.newPage = null;
    /** @type {adapt.vtree.Page} */ this.currentPage = null;
    /** @type {?adapt.epub.Position} */ this.pagePosition = null;
    /** @type {adapt.task.EventSource} */ this.eventSource = adapt.task.newEventSource();
    /** @type {number} */ this.fontSize = 16;
    /** @const */ this.pref = adapt.expr.defaultPreferences();
};

/**
 * @return {void}
 */
adapt.sampleapp.Viewer.prototype.showPage = function() {
    if (this.newPage) {
	    if (this.currentPage) {
	        this.viewport.root.removeChild(this.currentPage.container);
	    }
	    if (this.currentPage) {
	    	this.eventSource.detach(this.currentPage, "hyperlink");
	    }
	    this.currentPage = this.newPage;
    	adapt.base.setCSSProperty(this.newPage.container, "visibility", "visible");
	    this.newPage = null;
    }
};

/**
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.sampleapp.Viewer.prototype.showPosition = function() {
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
			location.replace(adapt.base.setURLParam(location.href,
					"f", adapt.base.lightURLEncode(cfi || "")));
			frame.finish(true);
		});
    return frame.result();
};

/**
 * @return {void}
 */
adapt.sampleapp.Viewer.prototype.startEventLoop = function() {
	var self = this;
    adapt.task.start(function() {
    	/** @type {!adapt.task.Frame.<boolean>} */ var frame =
    		adapt.task.newFrame("EventLoop");
    	frame.loop(function() {
    		/** @type {!adapt.task.Frame.<boolean>} */ var innerFrame =
    			adapt.task.newFrame("EventProcessior.loop");
	    	self.eventSource.nextEvent().then (function(eventParam) {
	    		var event = /** @type {Event} */ (eventParam);
	    		switch (event.type) {
	    		case "resize" :
	    			self.resize().then(function() {
	    				innerFrame.finish(true);
	    			});
	    			break;
	    		case "keydown" :
	    			self.keydown(/** @type {KeyboardEvent} */ (event)).then(function() {
	    				innerFrame.finish(true);
	    			});
	    			break;
	    		case "touchstart" :
	    		case "touchmove" :
	    		case "touchend" :
	    			self.touch(/** @type {TouchEvent} */ (event)).then(function() {
	    				innerFrame.finish(true);
	    			});
	    			break;
	    		case "hyperlink":
	    			var hrefEvent = /** @type {adapt.vtree.PageHyperlinkEvent} */ (event);
	    			self.navigateTo(hrefEvent.href).then(function() {
	    				innerFrame.finish(true);
	    			});
	    			break;
	    		case "adapt-command":
	    			var command = /** @type {string} */ (/** @type {*} */ (event.detail));
	    			self.command(command).then(function() {
	    				innerFrame.finish(true);
	    			});
	    			break;
	    		default:
		    		innerFrame.finish(true);
	    		}
	    	});
	    	return innerFrame.result();
    	}).thenFinish(frame);
    	return frame.result();
    });	
};

/**
 * @param {string} command
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.sampleapp.Viewer.prototype.command = function(command) {
	var self = this;
	/** @type {!adapt.task.Frame.<boolean>} */ var frame = adapt.task.newFrame("command");
    switch (command) {
    case "firstPage":
    	self.firstPage().then(function() {
        	self.showPage();
        	self.showPosition().thenFinish(frame);
        });
    	break;
    case "lastPage":
    	self.lastPage().then(function() {
        	self.showPage();
        	self.showPosition().thenFinish(frame);
        });
    	break;
    case "nextPage":
    	self.nextPage().then(function() {
        	self.showPage();
        	self.showPosition().thenFinish(frame);
        });
    	break;
    case "previousPage":
    	self.previousPage().then(function() {
        	self.showPage();
        	self.showPosition().thenFinish(frame);
        });
    	break;
    default:
    	adapt.base.log("Unknown command: " + command);
    	frame.finish(true);
    }
    return frame.result();
};

/**
 * @param {KeyboardEvent} evt
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.sampleapp.Viewer.prototype.keydown = function(evt) {
	var self = this;
	/** @type {!adapt.task.Frame.<boolean>} */ var frame = adapt.task.newFrame("keydown");
    switch (evt.keyCode) {
    case 35:  // end
    	self.lastPage().then(function() {
        	self.showPage();
        	self.showPosition().thenFinish(frame);
        });
    	break;
    case 36:  // home
    	self.firstPage().then(function() {
        	self.showPage();
        	self.showPosition().thenFinish(frame);
        });
    	break;
    case 39:  // right arrow
        self.nextPage().then(function() {
        	self.showPage();
        	self.showPosition().thenFinish(frame);
        });
        break;
    case 37:  // left arrow
        self.previousPage().then(function() {
        	self.showPage();
        	self.showPosition().thenFinish(frame);
        });
        break;
    case 48:  // zero
    	self.fontSize = 16;
    	self.resize().thenFinish(frame);
    	break;
    case 68:  // D - developer tool
    	adapt.devel.showTools(self.opfView);
    	frame.finish(true);    	
    	break;
    case 78:  // N - night toggle
    	self.pref.nightMode = !self.pref.nightMode;
    	self.viewport = null;
    	self.resize().thenFinish(frame);
    	break;
    case 86:  // V - vertical toggle
    	self.pref.horizontal = !self.pref.horizontal;
    	self.viewport = null;
    	self.resize().thenFinish(frame);
    	break;
    case 187:  // plus
    	self.fontSize = Math.round(self.fontSize * 1.2);
    	self.resize().thenFinish(frame);
    	break;
    case 189:  // minus
    	self.fontSize = Math.round(self.fontSize / 1.2);
    	self.resize().thenFinish(frame);
    	break;
    default:
    	frame.finish(true);    	
    }
    return frame.result();
};

/**
 * @param {TouchEvent} evt
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.sampleapp.Viewer.prototype.touch = function(evt) {
	var self = this;
	/** @type {!adapt.task.Frame.<boolean>} */ var frame = adapt.task.newFrame("touch");
	if (evt.touches.length == 1) {
		var x = evt.touches[0].pageX;
		var y = evt.touches[0].pageY;
		if (evt.type == "touchstart") {
			self.touchActive = true;
			self.touchX = x;
			self.touchY = y;
		} else if (self.touchActive) {
			var dx = x - self.touchX;
			var dy = y - self.touchY;
			if (evt.type == "touchend") {
				self.touchActive = false;
			}
			if (dy < 10 && Math.abs(dx) > 25) {
				self.touchActive = false;
				var result;
				if (dx > 0) {
					result = self.previousPage();
				} else {
					result = self.nextPage();
				}
				result.then(function() {
		        	self.showPage();
		        	self.showPosition().thenFinish(frame);
		        });
				return frame.result();
			}
		}
	} else if (evt.touches.length == 2) {
		var px = evt.touches[0].pageX - evt.touches[1].pageX;
		var py = evt.touches[0].pageY - evt.touches[1].pageY;
		var pinchDist = Math.sqrt(px*px + py*py);
		if (evt.type == "touchstart") {
			self.zoomActive = true;
			self.zoomDist = pinchDist;
		} else if (self.zoomActive) {
			if (evt.type == "touchend") {
				self.zoomActive = false;
			}
			var scale = pinchDist / this.zoomDist;
			if (scale > 1.5) {
		    	self.fontSize = Math.round(self.fontSize * 1.2);
				self.zoomActive = false;
		    	self.resize().thenFinish(frame);
		    	return frame.result();
			} else if (scale < 1/1.5) {
		    	self.fontSize = Math.round(self.fontSize / 1.2);
				self.zoomActive = false;
		    	self.resize().thenFinish(frame);
		    	return frame.result();
			}
		}
	}
	frame.finish(true);
	return frame.result();	
};

/**
 * @return {adapt.vgen.Viewport}
 */
adapt.sampleapp.Viewer.prototype.createViewport = function() {
    var viewportRoot = document.getElementById("adapt_viewport");
    return new adapt.vgen.Viewport(window, this.fontSize, viewportRoot);	
};

/**
 * @return {boolean}
 */
adapt.sampleapp.Viewer.prototype.sizeIsGood = function() {
	if (!this.viewport || this.viewport.fontSize != this.fontSize) {
		return false;
	}
	var viewport = this.createViewport();
	return viewport.width == this.viewport.width && viewport.height == this.viewport.height;
};

/**
 * @return {void}
 */
adapt.sampleapp.Viewer.prototype.reset = function() {
	this.viewport = this.createViewport();
    this.opfView = new adapt.epub.OPFView(this.opf, this.viewport, this.fontMapper, this.pref);
};

/**
 * @param {adapt.vtree.Page} page
 * @return {void}
 */
adapt.sampleapp.Viewer.prototype.setNewPage = function(page) {
	this.newPage = page;
	if (page) {
	    this.eventSource.attach(page, "hyperlink");
	}
};

/**
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.sampleapp.Viewer.prototype.resize = function() {
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
		self.showPosition().thenFinish(frame);
	});
	return frame.result();
};

/**
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.sampleapp.Viewer.prototype.nextPage = function() {
	var self = this;
	/** @type {!adapt.task.Frame.<boolean>} */ var frame = adapt.task.newFrame("nextPage");
	self.opfView.nextPage().then(function(page) {
		self.pagePosition = null;
		self.setNewPage(page);
		frame.finish(true);
	});
	return frame.result();
};

/**
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.sampleapp.Viewer.prototype.firstPage = function() {
	var self = this;
	/** @type {!adapt.task.Frame.<boolean>} */ var frame = adapt.task.newFrame("firstPage");
	self.opfView.firstPage().then(function(page) {
		self.pagePosition = null;
		self.setNewPage(page);
		frame.finish(true);
	});
	return frame.result();
};

/**
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.sampleapp.Viewer.prototype.lastPage = function() {
	var self = this;
	/** @type {!adapt.task.Frame.<boolean>} */ var frame = adapt.task.newFrame("lastPage");
	self.opfView.lastPage().then(function(page) {
		self.pagePosition = null;
		self.setNewPage(page);
		frame.finish(true);
	});
	return frame.result();
};

/**
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.sampleapp.Viewer.prototype.previousPage = function() {
	var self = this;
	/** @type {!adapt.task.Frame.<boolean>} */ var frame = adapt.task.newFrame("previousPage");
	self.opfView.previousPage().then(function(page) {
		self.pagePosition = null;
		self.setNewPage(page);
		frame.finish(true);
	});
	return frame.result();
};

/**
 * @param {string} href
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.sampleapp.Viewer.prototype.navigateTo = function(href) {
	var self = this;
	/** @type {!adapt.task.Frame.<boolean>} */ var frame = adapt.task.newFrame("navigateTo");
	self.opfView.navigateTo(href).then(function(page) {
		if (page) {
			self.setNewPage(page);
			self.showPage();
			self.pagePosition = self.opfView.getPagePosition();
			self.showPosition().thenFinish(frame);
		} else {
			frame.finish(true);			
		}
	});
	return frame.result();
};

/**
 * @param {?string} fragment
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.sampleapp.Viewer.prototype.init = function(fragment) {
    var self = this;
	/** @type {!adapt.task.Frame.<boolean>} */ var frame = adapt.task.newFrame("main");
    this.eventSource.attach(window, "keydown", true);
    this.eventSource.attach(window, "resize");
    this.eventSource.attach(window, "touchstart", true);
    this.eventSource.attach(window, "touchmove", true);
    this.eventSource.attach(window, "touchend", true);
    this.eventSource.attach(window, "adapt-command");
    self.opf.resolveFragment(fragment).then(function(position) {
    	self.pagePosition = position;
	    self.resize().then(function() {
	    	self.startEventLoop();  // Must be the last thing to do.
	    });
    });
    return frame.result();
};

/**
 * @param {?string} fragment
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.sampleapp.Viewer.prototype.initEmbed = function(fragment) {
    var self = this;
	/** @type {!adapt.task.Frame.<boolean>} */ var frame = adapt.task.newFrame("initEmbedViewer");
    self.opf.resolveFragment(fragment).then(function(position) {
    	self.pagePosition = position;
	    self.resize().thenFinish(frame);
    });
    return frame.result();
};

/**
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.sampleapp.loadAndRun = function() {
	var store = new adapt.epub.EPUBDocStore();
	/** @type {!adapt.task.Frame.<boolean>} */ var frame = adapt.task.newFrame("loadAndRun");
    store.init().then(function() {
	    var fragment = adapt.base.getURLParam("f");
	    if (fragment) {
	    	fragment = decodeURI(fragment);
	    }
	    var epubURL = adapt.base.getURLParam("b");
	    if (epubURL) {
	        epubURL = adapt.base.resolveURL(epubURL, window.location.href);
	        store.loadEPUBDoc(epubURL, false).then(function (opf) {
	            (new adapt.sampleapp.Viewer(opf)).init(fragment).thenFinish(frame);
	        });
	        return;
	    }
	    var xhtmlURL = adapt.base.getURLParam("x");
	    if (xhtmlURL) {
	    	xhtmlURL = adapt.base.resolveURL(xhtmlURL, window.location.href);
	    	var opf = new adapt.epub.OPFDoc(store, "");
	    	opf.initWithSingleChapter(xhtmlURL);
            (new adapt.sampleapp.Viewer(opf)).init(fragment).thenFinish(frame);
            return;
	    }
	    document.body.appendChild(document.createTextNode("Neither b nor x parameter is given"));
	    document.body.appendChild(document.createElement("br"));
	    document.body.appendChild(document.createTextNode("LShapeBug: " + adapt.base.checkLShapeFloatBug(document.body)));
	    document.body.appendChild(document.createElement("br"));
	    document.body.appendChild(document.createTextNode("VertBBoxBug: " + adapt.base.checkVerticalBBoxBug(document.body)));
	    frame.finish(true);
    });
    return frame.result();
};

/**
 * @return {void}
 */
adapt.sampleapp.main = function() {
    adapt.task.start(function() {
    	/** @type {!adapt.task.Frame.<boolean>} */ var frame = adapt.task.newFrame("main");
    	frame.sleep(1).then(function() {
			adapt.sampleapp.loadAndRun().then(function() {
				frame.finish(true);
			});
    	});
    	return frame.result();
    });
};

/**
 * @constructor
 */
adapt.sampleapp.EmbedContext = function(callbackURI) {
	/**
	 * @param {string} name
	 * @param {string} body
	 * @return {adapt.task.Result.<adapt.net.Response>}
	 */
	this.callback = function(name, body) {
		return adapt.net.ajax(callbackURI + name, false, "POST", body);
	};
	/** @type {adapt.sampleapp.Viewer} */ this.viewer = null;	
};

/**
 * @param {string} name
 * @param {?string} body
 * @return {adapt.task.Result.<boolean>}
 */
adapt.sampleapp.EmbedContext.prototype.runCommand = function(name, body) {
	var self = this;
	return adapt.task.handle("runCommand", function(frame) {
		(/** @type {adapt.task.Result.<boolean>} */ (self[name](name, body))).thenFinish(frame);
	}, function(frame, err) {
		self.callback("Error", "" + err).thenFinish(frame);
	});
};

/**
 * @param {string} name
 * @param {?string} body
 * @return {adapt.task.Result.<boolean>}
 */
adapt.sampleapp.EmbedContext.prototype["loadEPUB"] = function(name, body) {
	/** @type {!adapt.task.Frame.<boolean>} */ var frame = adapt.task.newFrame("loadEPUB");
	var args = body.split(/\s+/);  // URL CFI
	var store = new adapt.epub.EPUBDocStore();
	store.init().then(function() {
	    var epubURL = adapt.base.resolveURL(args[0], window.location.href);
	    store.loadEPUBDoc(epubURL, false).then(function (opf) {
	        self.viewer = new adapt.sampleapp.Viewer(opf);
	    	self.viewer.initEmbed(args[1] || "").thenFinish(frame);
	    });
	});
    return frame.result();
};

/**
 * @param {string} name
 * @param {?string} body
 * @return {adapt.task.Result.<boolean>}
 */
adapt.sampleapp.EmbedContext.prototype["resize"] = function(name, body) {
    return self.viewer.resize();
};

/**
 * @param {string} callbackURI
 */
adapt.sampleapp.initEmbed = function(callbackURI) {
	/** @type {?string} */ var commandName = null;
	/** @type {?string} */ var commandBody = null;
	var continuation = null;
	var context = new adapt.sampleapp.EmbedContext(callbackURI);
	adapt.task.start(function() {
    	/** @type {!adapt.task.Frame.<boolean>} */ var frame = adapt.task.newFrame("mainLoop");
		frame.loopWithFrame(function(loopFrame) {
			if (commandName) {
				var cmdName = commandName;
				var cmdBody = commandBody;
				commandName = null;
				commandBody = null;
				context.runCommand(cmdName, cmdBody).then(function() {
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
	
	window["adapt_command"] = function(name, body) {
		if (commandName) {
			return false;
		}
		commandName = name;
		commandBody = body;
		var cont = continuation;
		continuation = null;
		cont.schedule();
		return true;
	};
};

if (adapt.sampleapp.embedded) {
	// Embedded mode: export entry points for UI.
	window["adapt_init"] = adapt.sampleapp.initEmbed;
} else {
	// App mode: initialize.
	if(window["__loaded"])
		adapt.sampleapp.main();
	else
	    window.onload = adapt.sampleapp.main;
}