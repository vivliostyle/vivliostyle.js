/**
 * Copyright 2013 Google, Inc.
 * Copyright 2015 Trim-marks Inc.
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
 * @fileoverview Vivliostyle page viewer base on adapt.sampleapp
 */
goog.provide('vivliostyle.viewerapp');

goog.require("vivliostyle.namespace");
goog.require('vivliostyle.constants');
goog.require('adapt.base');
goog.require('adapt.viewer');

/** @type {number} */ vivliostyle.viewerapp.fontSize = 16;
/** @type {boolean} */ vivliostyle.viewerapp.touchActive = false;
/** @type {number} */ vivliostyle.viewerapp.touchX = 0;
/** @type {number} */ vivliostyle.viewerapp.touchY = 0;
/** @type {boolean} */ vivliostyle.viewerapp.zoomActive = false;
/** @type {number} */ vivliostyle.viewerapp.pinchDist = 0;
/** @type {vivliostyle.constants.PageProgression} */ vivliostyle.viewerapp.currentPageProgression = vivliostyle.constants.PageProgression.LTR;

/**
 * @param {adapt.base.JSON} cmd
 */
vivliostyle.viewerapp.sendCommand = function(cmd) {
    window["adapt_command"](cmd);
};

vivliostyle.viewerapp.navigateToLeftPage = function() {
    vivliostyle.viewerapp.sendCommand({
        "a": "moveTo",
        "where": vivliostyle.viewerapp.currentPageProgression === vivliostyle.constants.PageProgression.LTR ? "previous" : "next"
    });
};

vivliostyle.viewerapp.navigateToRightPage = function() {
    vivliostyle.viewerapp.sendCommand({
        "a": "moveTo",
        "where": vivliostyle.viewerapp.currentPageProgression === vivliostyle.constants.PageProgression.LTR ? "next" : "previous"
    });
};

/**
 * @param {KeyboardEvent} evt
 * @return {void}
 */
vivliostyle.viewerapp.keydown = function(evt) {
    var key = evt.key;
    var keyIdentifier = evt.keyIdentifier;
    var location = evt.location;
    if (key === "End" || keyIdentifier === "End") {
        vivliostyle.viewerapp.sendCommand({"a": "moveTo", "where": "last"});
        evt.preventDefault();
    } else if (key === "Home" || keyIdentifier === "Home") {
        vivliostyle.viewerapp.sendCommand({"a": "moveTo", "where": "first"});
        evt.preventDefault();
    } else if (key === "ArrowUp" || key === "Up" || keyIdentifier === "Up") {
        vivliostyle.viewerapp.sendCommand({
            "a": "moveTo",
            "where": "previous"
        });
        evt.preventDefault();
    } else if (key === "ArrowDown" || key === "Down" || keyIdentifier === "Down") {
        vivliostyle.viewerapp.sendCommand({
            "a": "moveTo",
            "where": "next"
        });
        evt.preventDefault();
    } else if (key === "ArrowRight" || key === "Right" || keyIdentifier === "Right") {
        vivliostyle.viewerapp.navigateToRightPage();
        evt.preventDefault();
    } else if (key === "ArrowLeft" || key === "Left" || keyIdentifier === "Left") {
        vivliostyle.viewerapp.navigateToLeftPage();
        evt.preventDefault();
    } else if (key === "0" || keyIdentifier === "U+0030") {
        vivliostyle.viewerapp.sendCommand({"a": "configure", "fontSize": Math.round(vivliostyle.viewerapp.fontSize)});
        evt.preventDefault();
        /*
         } else if (key === "n" || keyIdentifier === "U+004E") {
         // N - night toggle
         self.pref.nightMode = !self.pref.nightMode;
         self.viewport = null;
         self.resize().thenFinish(frame);
         } else if (key === "v" || keyIdentifier === "U+0056") {
         self.pref.horizontal = !self.pref.horizontal;
         self.viewport = null;
         self.resize().thenFinish(frame);
         */
    } else if (key === "t" || keyIdentifier === "U+0054") {
        vivliostyle.viewerapp.sendCommand({"a": "toc", "v": "toggle", "autohide": true});
        evt.preventDefault();
    } else if (key === "+" || key === "Add" || keyIdentifier === "U+002B"
        || keyIdentifier === "U+00BB" || (keyIdentifier === "U+004B" && location === KeyboardEvent.DOM_KEY_LOCATION_NUMPAD) /* workaround for Chrome for Windows */) {
        vivliostyle.viewerapp.fontSize *= 1.2;
        vivliostyle.viewerapp.sendCommand({"a": "configure", "fontSize": Math.round(vivliostyle.viewerapp.fontSize)});
        evt.preventDefault();
    } else if (key === "-" || key === "Subtract" || keyIdentifier === "U+002D"
        || keyIdentifier === "U+00BD" || (keyIdentifier === "U+004D" && location === KeyboardEvent.DOM_KEY_LOCATION_NUMPAD) /* workaround for Chrome for Windows */) {
        vivliostyle.viewerapp.fontSize /= 1.2;
        vivliostyle.viewerapp.sendCommand({"a": "configure", "fontSize": Math.round(vivliostyle.viewerapp.fontSize)});
        evt.preventDefault();
    }
};

/**
 * @param {TouchEvent} evt
 * @return {void}
 */
vivliostyle.viewerapp.touch = function(evt) {
    if (evt.type == "touchmove") {
        evt.preventDefault();
    }
    if (evt.touches.length == 1) {
        var x = evt.touches[0].pageX;
        var y = evt.touches[0].pageY;
        if (evt.type == "touchstart") {
            vivliostyle.viewerapp.touchActive = true;
            vivliostyle.viewerapp.touchX = x;
            vivliostyle.viewerapp.touchY = y;
        } else if (vivliostyle.viewerapp.touchActive) {
            var dx = x - vivliostyle.viewerapp.touchX;
            var dy = y - vivliostyle.viewerapp.touchY;
            if (evt.type == "touchend") {
                vivliostyle.viewerapp.touchActive = false;
            }
            if (Math.abs(dy) < 0.5 * Math.abs(dx) && Math.abs(dx) > 15) {
                vivliostyle.viewerapp.touchActive = false;
                if (dx > 0) {
                    vivliostyle.viewerapp.sendCommand({
                        "a": "moveTo",
                        "where": vivliostyle.viewerapp.currentPageProgression === vivliostyle.constants.PageProgression.LTR ? "previous" : "next"
                    });
                } else {
                    vivliostyle.viewerapp.sendCommand({
                        "a": "moveTo",
                        "where": vivliostyle.viewerapp.currentPageProgression === vivliostyle.constants.PageProgression.LTR ? "next" : "previous"
                    });
                }
            }
        }
    } else if (evt.touches.length == 2) {
        var px = evt.touches[0].pageX - evt.touches[1].pageX;
        var py = evt.touches[0].pageY - evt.touches[1].pageY;
        var pinchDist = Math.sqrt(px*px + py*py);
        if (evt.type == "touchstart") {
            vivliostyle.viewerapp.zoomActive = true;
            vivliostyle.viewerapp.zoomDist = pinchDist;
        } else if (vivliostyle.viewerapp.zoomActive) {
            if (evt.type == "touchend") {
                vivliostyle.viewerapp.zoomActive = false;
            }
            var scale = pinchDist / vivliostyle.viewerapp.zoomDist;
            if (scale > 1.5) {
                vivliostyle.viewerapp.fontSize *= 1.2;
                vivliostyle.viewerapp.sendCommand({"a": "configure", "fontSize": Math.round(vivliostyle.viewerapp.fontSize)});
            } else if (scale < 1/1.5) {
                vivliostyle.viewerapp.fontSize *= 1.2;
                vivliostyle.viewerapp.sendCommand({"a": "configure", "fontSize": Math.round(vivliostyle.viewerapp.fontSize)});
            }
        }
    }
};

vivliostyle.viewerapp.callback = function(msg) {
    switch (msg["t"]) {
        case "loaded" :
            var viewer = msg["viewer"];
            var pageProgression = vivliostyle.viewerapp.currentPageProgression
                = viewer.getCurrentPageProgression();
            viewer.viewportElement.setAttribute("data-vivliostyle-page-progression", pageProgression);
            viewer.viewportElement.setAttribute("data-vivliostyle-spread-view", viewer.pref.spreadView);

            window.addEventListener("keydown", /** @type {Function} */ (vivliostyle.viewerapp.keydown), false);
//        window.addEventListener("touchstart", /** @type {Function} */ (vivliostyle.viewerapp.touch), false);
//        window.addEventListener("touchmove", /** @type {Function} */ (vivliostyle.viewerapp.touch), false);
//        window.addEventListener("touchend", /** @type {Function} */ (vivliostyle.viewerapp.touch), false);

            document.body.setAttribute("data-vivliostyle-viewer-status", "complete");

            var leftButton = document.getElementById("vivliostyle-page-navigation-left");
            leftButton.addEventListener("click", /** @type {Function} */ (vivliostyle.viewerapp.navigateToLeftPage), false);
            var rightButton = document.getElementById("vivliostyle-page-navigation-right");
            rightButton.addEventListener("click", /** @type {Function} */ (vivliostyle.viewerapp.navigateToRightPage), false);
            [leftButton, rightButton].forEach(function(button) {
                button.setAttribute("data-vivliostyle-ui-state", "attention");
                window.setTimeout(function() {
                    button.removeAttribute("data-vivliostyle-ui-state");
                }, 1000);
            });

            break;
        case "error" :
            // adapt.base.log("Error: " + msg["content"]);
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
                vivliostyle.viewerapp.sendCommand({"a": "moveTo", "url": msg["href"]});
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
vivliostyle.viewerapp.main = function(arg) {
    var fragment = (arg && arg["fragment"]) || adapt.base.getURLParam("f");
    var epubURL = (arg && arg["epubURL"]) || adapt.base.getURLParam("b");
    var xmlURL = (arg && arg["xmlURL"]) || adapt.base.getURLParam("x");
    var width = (arg && arg["defaultPageWidth"]) || adapt.base.getURLParam("w");
    var height = (arg && arg["defaultPageHeight"]) || adapt.base.getURLParam("h");
    var size = (arg && arg["defaultPageSize"]) || adapt.base.getURLParam("size");
    var orientation = (arg && arg["orientation"]) || adapt.base.getURLParam("orientation");
    var spreadView = adapt.base.getURLParam("spread");
    spreadView = (arg && arg["spreadView"]) || (!!spreadView && spreadView != "false");
    var uaRoot = (arg && arg["uaRoot"]) || null;
    var doc = (arg && arg["document"]) || null;
    var userStyleSheet = (arg && arg["userStyleSheet"]) || null;
    var viewportElement = (arg && arg["viewportElement"]) || document.body;

    var config = {
        "a": epubURL ? "loadEPUB" : "loadXML",
        "url": epubURL || xmlURL,
        "autoresize": true,
        "fragment": fragment,
        // render all pages on load and resize
        "renderAllPages": true,
        "userAgentRootURL": uaRoot,
        "document": doc,
        "userStyleSheet": userStyleSheet,
        "spreadView": spreadView,
        "pageBorder": 1
    };
    setViewportSize(width, height, size, orientation, config);

    var viewer = new adapt.viewer.Viewer(window, viewportElement, "main", vivliostyle.viewerapp.callback);
    viewer.initEmbed(config);
};

vivliostyle.namespace.exportSymbol("vivliostyle.viewerapp.main", vivliostyle.viewerapp.main);
