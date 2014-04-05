/**
 * Copyright 2013 Google, Inc.
 * @fileoverview Sample EPUB rendering application.
 */
goog.provide('adapt.sampleapp');

goog.require('adapt.base');
goog.require('adapt.viewer');

/** @type {number} */ adapt.sampleapp.fontSize = 16;
/** @type {boolean} */ adapt.sampleapp.touchActive = false;
/** @type {number} */ adapt.sampleapp.touchX = 0;
/** @type {number} */ adapt.sampleapp.touchY = 0;
/** @type {boolean} */ adapt.sampleapp.zoomActive = false;
/** @type {number} */ adapt.sampleapp.pinchDist = 0;


/**
 * @param {adapt.base.JSON} cmd
 */
adapt.sampleapp.sendCommand = function(cmd) {
	window["adapt_command"](cmd);
};

/**
 * @param {KeyboardEvent} evt
 * @return {void}
 */
adapt.sampleapp.keydown = function(evt) {
    switch (evt.keyCode) {
    case 35:  // end
    	adapt.sampleapp.sendCommand({"a": "moveTo", "where": "last"});
    	break;
    case 36:  // home
    	adapt.sampleapp.sendCommand({"a": "moveTo", "where": "first"});
    	break;
    case 39:  // right arrow
    	adapt.sampleapp.sendCommand({"a": "moveTo", "where": "next"});
        break;
    case 37:  // left arrow
    	adapt.sampleapp.sendCommand({"a": "moveTo", "where": "previous"});
        break;
    case 48:  // zero
    	adapt.sampleapp.sendCommand({"a": "configure", "fontSize": Math.round(adapt.sampleapp.fontSize)});
    	break;
    	/*
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
    	*/
    case 84: // 'T' - show TOC
    	adapt.sampleapp.sendCommand({"a": "toc", "v": "toggle", "autohide": true});
    	break;    	
    case 187:  // plus
    	adapt.sampleapp.fontSize *= 1.2;
    	adapt.sampleapp.sendCommand({"a": "configure", "fontSize": Math.round(adapt.sampleapp.fontSize)});
    	break;
    case 189:  // minus
    	adapt.sampleapp.fontSize /= 1.2;
    	adapt.sampleapp.sendCommand({"a": "configure", "fontSize": Math.round(adapt.sampleapp.fontSize)});
    	break;
    }
};

/**
 * @param {TouchEvent} evt
 * @return {void}
 */
adapt.sampleapp.touch = function(evt) {
	if (evt.type == "touchmove") {
		evt.preventDefault();
	}
	if (evt.touches.length == 1) {
		var x = evt.touches[0].pageX;
		var y = evt.touches[0].pageY;
		if (evt.type == "touchstart") {
			adapt.sampleapp.touchActive = true;
			adapt.sampleapp.touchX = x;
			adapt.sampleapp.touchY = y;
		} else if (adapt.sampleapp.touchActive) {
			var dx = x - adapt.sampleapp.touchX;
			var dy = y - adapt.sampleapp.touchY;
			if (evt.type == "touchend") {
				adapt.sampleapp.touchActive = false;
			}
			if (Math.abs(dy) < 0.5 * Math.abs(dx) && Math.abs(dx) > 15) {
				adapt.sampleapp.touchActive = false;
				if (dx > 0) {
			    	adapt.sampleapp.sendCommand({"a": "moveTo", "where": "previous"});					
				} else {
			    	adapt.sampleapp.sendCommand({"a": "moveTo", "where": "next"});
				}
			}
		}
	} else if (evt.touches.length == 2) {
		var px = evt.touches[0].pageX - evt.touches[1].pageX;
		var py = evt.touches[0].pageY - evt.touches[1].pageY;
		var pinchDist = Math.sqrt(px*px + py*py);
		if (evt.type == "touchstart") {
			adapt.sampleapp.zoomActive = true;
			adapt.sampleapp.zoomDist = pinchDist;
		} else if (adapt.sampleapp.zoomActive) {
			if (evt.type == "touchend") {
				adapt.sampleapp.zoomActive = false;
			}
			var scale = pinchDist / adapt.sampleapp.zoomDist;
			if (scale > 1.5) {
		    	adapt.sampleapp.fontSize *= 1.2;
		    	adapt.sampleapp.sendCommand({"a": "configure", "fontSize": Math.round(adapt.sampleapp.fontSize)});
			} else if (scale < 1/1.5) {
		    	adapt.sampleapp.fontSize *= 1.2;
		    	adapt.sampleapp.sendCommand({"a": "configure", "fontSize": Math.round(adapt.sampleapp.fontSize)});
			}
		}
	}
};

adapt.sampleapp.callback = function(msg) {
	switch (msg["t"]) {
	case "error" :
		adapt.base.log("Error: " + msg["content"]);
		break;
	case "nav" :
		var cfi = msg["cfi"];
		if (cfi) {
			location.replace(adapt.base.setURLParam(location.href,
				"f", adapt.base.lightURLEncode(cfi || "")));
		}
		break;
	case "hyperlink" :
		if (msg["internal"]) {
	    	adapt.sampleapp.sendCommand({"a": "moveTo", "url": msg["href"]});			
		}
	}
};

/**
 * @return {void}
 */
adapt.sampleapp.main = function() {
    var fragment = adapt.base.getURLParam("f");
    var epubURL = adapt.base.getURLParam("b");
    var xmlURL = adapt.base.getURLParam("x");
	var viewer = new adapt.viewer.Viewer(window, "main", adapt.sampleapp.callback);
	if (epubURL) {
		viewer.initEmbed({"a": "loadEPUB", "url": epubURL, "autoresize": true, "fragment": fragment});
	} else {
		viewer.initEmbed({"a": "loadXML", "url": xmlURL, "autoresize": true, "fragment": fragment});
	}
    window.addEventListener("keydown", /** @type {Function} */ (adapt.sampleapp.keydown), false);
    window.addEventListener("touchstart", /** @type {Function} */ (adapt.sampleapp.touch), false);
    window.addEventListener("touchmove", /** @type {Function} */ (adapt.sampleapp.touch), false);
    window.addEventListener("touchend", /** @type {Function} */ (adapt.sampleapp.touch), false);	
};

if(window["__loaded"])
	adapt.sampleapp.main();
else
    window.onload = adapt.sampleapp.main;
