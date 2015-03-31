/**
 * @fileoverview Vivliostyle page viewer base on adapt.sampleapp
 */
goog.provide('adapt.vivliostyle');

goog.require('adapt.base');
goog.require('adapt.viewer');

/** @type {number} */ adapt.vivliostyle.fontSize = 16;
/** @type {boolean} */ adapt.vivliostyle.touchActive = false;
/** @type {number} */ adapt.vivliostyle.touchX = 0;
/** @type {number} */ adapt.vivliostyle.touchY = 0;
/** @type {boolean} */ adapt.vivliostyle.zoomActive = false;
/** @type {number} */ adapt.vivliostyle.pinchDist = 0;


/**
 * @param {adapt.base.JSON} cmd
 */
adapt.vivliostyle.sendCommand = function(cmd) {
	window["adapt_command"](cmd);
};

/**
 * @param {KeyboardEvent} evt
 * @return {void}
 */
adapt.vivliostyle.keydown = function(evt) {
    switch (evt.keyCode) {
    case 35:  // end
    	adapt.vivliostyle.sendCommand({"a": "moveTo", "where": "last"});
    	break;
    case 36:  // home
    	adapt.vivliostyle.sendCommand({"a": "moveTo", "where": "first"});
    	break;
    case 39:  // right arrow
    	adapt.vivliostyle.sendCommand({"a": "moveTo", "where": "next"});
        break;
    case 37:  // left arrow
    	adapt.vivliostyle.sendCommand({"a": "moveTo", "where": "previous"});
        break;
    case 48:  // zero
    	adapt.vivliostyle.sendCommand({"a": "configure", "fontSize": Math.round(adapt.vivliostyle.fontSize)});
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
    	adapt.vivliostyle.sendCommand({"a": "toc", "v": "toggle", "autohide": true});
    	break;    	
    case 187:  // plus
    	adapt.vivliostyle.fontSize *= 1.2;
    	adapt.vivliostyle.sendCommand({"a": "configure", "fontSize": Math.round(adapt.vivliostyle.fontSize)});
    	break;
    case 189:  // minus
    	adapt.vivliostyle.fontSize /= 1.2;
    	adapt.vivliostyle.sendCommand({"a": "configure", "fontSize": Math.round(adapt.vivliostyle.fontSize)});
    	break;
    }
};

/**
 * @param {TouchEvent} evt
 * @return {void}
 */
adapt.vivliostyle.touch = function(evt) {
	if (evt.type == "touchmove") {
		evt.preventDefault();
	}
	if (evt.touches.length == 1) {
		var x = evt.touches[0].pageX;
		var y = evt.touches[0].pageY;
		if (evt.type == "touchstart") {
			adapt.vivliostyle.touchActive = true;
			adapt.vivliostyle.touchX = x;
			adapt.vivliostyle.touchY = y;
		} else if (adapt.vivliostyle.touchActive) {
			var dx = x - adapt.vivliostyle.touchX;
			var dy = y - adapt.vivliostyle.touchY;
			if (evt.type == "touchend") {
				adapt.vivliostyle.touchActive = false;
			}
			if (Math.abs(dy) < 0.5 * Math.abs(dx) && Math.abs(dx) > 15) {
				adapt.vivliostyle.touchActive = false;
				if (dx > 0) {
			    	adapt.vivliostyle.sendCommand({"a": "moveTo", "where": "previous"});					
				} else {
			    	adapt.vivliostyle.sendCommand({"a": "moveTo", "where": "next"});
				}
			}
		}
	} else if (evt.touches.length == 2) {
		var px = evt.touches[0].pageX - evt.touches[1].pageX;
		var py = evt.touches[0].pageY - evt.touches[1].pageY;
		var pinchDist = Math.sqrt(px*px + py*py);
		if (evt.type == "touchstart") {
			adapt.vivliostyle.zoomActive = true;
			adapt.vivliostyle.zoomDist = pinchDist;
		} else if (adapt.vivliostyle.zoomActive) {
			if (evt.type == "touchend") {
				adapt.vivliostyle.zoomActive = false;
			}
			var scale = pinchDist / adapt.vivliostyle.zoomDist;
			if (scale > 1.5) {
		    	adapt.vivliostyle.fontSize *= 1.2;
		    	adapt.vivliostyle.sendCommand({"a": "configure", "fontSize": Math.round(adapt.vivliostyle.fontSize)});
			} else if (scale < 1/1.5) {
		    	adapt.vivliostyle.fontSize *= 1.2;
		    	adapt.vivliostyle.sendCommand({"a": "configure", "fontSize": Math.round(adapt.vivliostyle.fontSize)});
			}
		}
	}
};

adapt.vivliostyle.callback = function(msg) {
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
	    	adapt.vivliostyle.sendCommand({"a": "moveTo", "url": msg["href"]});			
		}
	}
};

/**
 * @return {void}
 */
adapt.vivliostyle.main = function() {
    var fragment = adapt.base.getURLParam("f");
    var epubURL = adapt.base.getURLParam("b");
    var xmlURL = adapt.base.getURLParam("x");
	var viewer = new adapt.viewer.Viewer(window, "main", adapt.vivliostyle.callback);
	if (epubURL) {
		viewer.initEmbed({"a": "loadEPUB", "url": epubURL, "autoresize": false, "fragment": fragment,
            // temporarily fix to A4 paper size
            "viewport": {"width": "210mm", "height": "297mm"},
            // render all pages on load and resize
            "renderAllPages": true});
	} else {
		viewer.initEmbed({"a": "loadXML", "url": xmlURL, "autoresize": false, "fragment": fragment,
            // temporarily fix to A4 paper size
            "viewport": {"width": "210mm", "height": "297mm"},
            // render all pages on load and resize
            "renderAllPages": true});
	}
    window.addEventListener("keydown", /** @type {Function} */ (adapt.vivliostyle.keydown), false);
    window.addEventListener("touchstart", /** @type {Function} */ (adapt.vivliostyle.touch), false);
    window.addEventListener("touchmove", /** @type {Function} */ (adapt.vivliostyle.touch), false);
    window.addEventListener("touchend", /** @type {Function} */ (adapt.vivliostyle.touch), false);	
};

if(window["__loaded"])
	adapt.vivliostyle.main();
else
    window.onload = adapt.vivliostyle.main;
