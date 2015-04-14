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
 * @param {?string} width
 * @param {?string} height
 * @param {?string} size
 * @param {?string} orientation
 * @param {!Object.<string, *>} config
 * @return {void}
 */
function setViewportSize(width, height, size, orientation, config) {
    var pageSpec;
    if (!width || !height) {
        switch (size) {
            case "A5":
                width = "148mm";
                height = "210mm";
                break;
            case "A4":
                width = "210mm";
                height = "297mm";
                break;
            case "A3":
                width = "297mm";
                height = "420mm";
                break;
            case "B5":
                width = "176mm";
                height = "250mm";
                break;
            case "B4":
                width = "250mm";
                height = "353mm";
                break;
            case "letter":
                width = "8.5in";
                height = "11in";
                break;
            case "legal":
                width = "8.5in";
                height = "14in";
                break;
            case "ledger":
                width = "11in";
                height = "17in";
                break;
        }
        if (width && height) {
            pageSpec = size;
            if (orientation === "landscape") {
                pageSpec = pageSpec ? pageSpec + " landscape" : null;
                // swap
                var tmp = width;
                width = height;
                height = tmp;
            }
        }
    } else {
        pageSpec = width + " " + height;
    }

    if (width && height) {
        config.viewport = {"width": width, "height": height};
        var s = document.createElement("style");
        s.textContent = "@page { size: " + pageSpec + "; margin: 0; }";
        document.head.appendChild(s);
    }
}

/**
 * @return {void}
 */
adapt.vivliostyle.main = function(arg) {
    var fragment = (arg && arg.fragment) || adapt.base.getURLParam("f");
    var epubURL = (arg && arg.epubURL) || adapt.base.getURLParam("b");
    var xmlURL = (arg && arg.xmlURL) || adapt.base.getURLParam("x");
    var width = (arg && arg.defaultPageWidth) || adapt.base.getURLParam("w");
    var height = (arg && arg.defaultPageHeight) || adapt.base.getURLParam("h");
    var size = (arg && arg.defaultPageSize) || adapt.base.getURLParam("size");
    var orientation = (arg && arg.orientation) || adapt.base.getURLParam("orientation");
    var uaRoot = (arg && arg.uaRoot) || null;
	var viewer = new adapt.viewer.Viewer(window, "main", adapt.vivliostyle.callback);

    var config = {
        "autoresize": true,
        "fragment": fragment,
        // render all pages on load and resize
        "renderAllPages": true,
        "userAgentRootURL": uaRoot
    };
    setViewportSize(width, height, size, orientation, config);
    config["a"] = epubURL ? "loadEPUB" : "loadXML";
    config["url"] = epubURL || xmlURL;

    viewer.initEmbed(config);

    window.addEventListener("keydown", /** @type {Function} */ (adapt.vivliostyle.keydown), false);
    window.addEventListener("touchstart", /** @type {Function} */ (adapt.vivliostyle.touch), false);
    window.addEventListener("touchmove", /** @type {Function} */ (adapt.vivliostyle.touch), false);
    window.addEventListener("touchend", /** @type {Function} */ (adapt.vivliostyle.touch), false);	
};
