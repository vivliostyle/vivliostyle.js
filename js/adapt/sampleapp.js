/**
 * Copyright 2013 Google, Inc.
 * @fileoverview Sample EPUB rendering application.
 */
goog.provide('adapt.sampleapp');

goog.require('adapt.task');
goog.require('adapt.vgen');
goog.require('adapt.epub');


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
    /** @type {adapt.task.EventSource} */ this.eventSource = null;
    /** @type {number} */ this.fontSize = 16;
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
 * @param {KeyboardEvent} evt
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.sampleapp.Viewer.prototype.keydown = function(evt) {
	var self = this;
	/** @type {!adapt.task.Frame.<boolean>} */ var frame = adapt.task.newFrame("keydown");
    switch (evt.keyCode) {
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
 * @return {boolean}
 */
adapt.sampleapp.Viewer.prototype.sizeIsGood = function() {
	return this.viewport && window.innerWidth == this.viewport.width && 
			window.innerHeight == this.viewport.height && this.fontSize == this.viewport.fontSize;
};

/**
 * @return {void}
 */
adapt.sampleapp.Viewer.prototype.reset = function() {
    var viewportRoot = document.getElementById("adapt_viewport");
    this.viewport = new adapt.vgen.Viewport(window, this.fontSize, viewportRoot);
    this.opfView = new adapt.epub.OPFView(this.opf, this.viewport, this.fontMapper);
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
    this.eventSource = adapt.task.newEventSource();
    this.eventSource.attach(window, "keydown", true);
    this.eventSource.attach(window, "resize");
    this.eventSource.attach(window, "touchstart", true);
    this.eventSource.attach(window, "touchmove", true);
    this.eventSource.attach(window, "touchend", true);
    self.opf.resolveFragment(fragment).then(function(position) {
    	self.pagePosition = position;
	    self.resize().then(function() {
	    	self.startEventLoop();  // Must be the last thing to do.
	    });
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
	        store.loadEPUBDoc(epubURL).then(function (opf) {
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
	    document.body.textContent = "Neither b nor x parameter is given";
	    document.body.textContent += " " + adapt.base.checkLShapeFloatBug(document.body);
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

if(window["__loaded"])
	adapt.sampleapp.main();
else
    window.onload = adapt.sampleapp.main;