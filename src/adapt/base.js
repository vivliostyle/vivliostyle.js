/**
 * Copyright 2013 Google, Inc.
 * Copyright 2015 Vivliostyle Inc.
 * @fileoverview Common utilities.
 */
goog.provide('adapt.base');

goog.require('vivliostyle.logging');

/**
 * @typedef {*}
 */
adapt.base.JSON;

/**
 * @param {adapt.base.JSON} json
 * @return {string}
 */
adapt.base.jsonToString = function(json) {
    return JSON.stringify(json);
};

/**
 * @param {string} str
 * @return {adapt.base.JSON}
 */
adapt.base.stringToJSON = function(str) {
    return JSON.parse(str);
};

/**
 * @param {string} url
 * @return {string}
 */
adapt.base.stripFragment = function(url) {
    var r = url.match(/^([^#]*)/);
    if (r)
        return r[1];
    return url;
};

/**
 * @param {string} url
 * @return {string}
 */
adapt.base.stripFragmentAndQuery = function(url) {
    var r = url.match(/^([^#?]*)/);
    if (r)
        return r[1];
    return url;
};

/**
 * Base URL relative to which URLs of resources such as validation.txt and
 * user-agent.css are resolved.
 */
adapt.base.resourceBaseURL = window.location.href;

/**
 * @param {string} relURL relative URL
 * @param {string} baseURL base (absolute) URL
 * @return {string} resolved (absolute) URL
 */
adapt.base.resolveURL = function(relURL, baseURL) {
    if (!baseURL || relURL.match(/^\w{2,}:/)) {
        if (relURL.toLowerCase().match("^javascript:")) {
            return "#";
        }
        return relURL;
    }
    if (baseURL.match(/^\w{2,}:\/\/[^\/]+$/))
        baseURL = baseURL + '/';
    /** @type {Array.<string>} */ var r;
    if (relURL.match(/^\/\//)) {
        r = baseURL.match(/^(\w{2,}:)\/\//);
        if (r)
            return r[1] + relURL;
        return relURL;
    }
    if (relURL.match(/^\//)) {
        r = baseURL.match(/^(\w{2,}:\/\/[^\/]+)\//);
        if (r)
            return r[1] + relURL;
        return relURL;
    }
    if (relURL.match(/^\.(\/|$)/))
        relURL = relURL.substr(1);
    baseURL = adapt.base.stripFragmentAndQuery(baseURL);
    if (relURL.match(/^\#/))
        return baseURL + relURL;
    var i = baseURL.lastIndexOf('/');
    if (i < 0)
        return relURL;
    var url = baseURL.substr(0, i + 1) + relURL;
    while (true) {
        i = url.indexOf('/../');
        if (i <= 0)
            break;
        var j = url.lastIndexOf('/', i - 1);
        if (j <= 0)
            break;
        url = url.substr(0, j) + url.substr(i + 3);
    }
    return url.replace(/\/(\.\/)+/g, '/');
};

/**
 * @interface
 */
adapt.base.DocumentURLTransformer = function() {};

/**
 * @param {string} fragment
 * @param {string} baseURL
 * @returns {string}
 */
adapt.base.DocumentURLTransformer.prototype.transformFragment = function(fragment, baseURL) {};

/**
 * @param {string} url
 * @param {string} baseURL
 * @returns {string}
 */
adapt.base.DocumentURLTransformer.prototype.transformURL = function(url, baseURL) {};

/**
 * @param {string} encoded
 * @returns {!Array<string>}
 */
adapt.base.DocumentURLTransformer.prototype.restoreURL = function(encoded) {};

/**
 * Various namespaces.
 * @enum {string}
 */
adapt.base.NS = {
    FB2: "http://www.gribuser.ru/xml/fictionbook/2.0",
    epub: "http://www.idpf.org/2007/ops",
    EV: "http://www.w3.org/2001/xml-events",
    MATHML: "http://www.w3.org/1998/Math/MathML",
    XML: "http://www.w3.org/XML/1998/namespace",
    XHTML: "http://www.w3.org/1999/xhtml",
    XLINK: "http://www.w3.org/1999/xlink",
    SHADOW: "http://www.pyroxy.com/ns/shadow",
    SVG: "http://www.w3.org/2000/svg",
    DC: "http://purl.org/dc/elements/1.1/",
    NCX: "http://www.daisy.org/z3986/2005/ncx/",
    SSE: "http://example.com/sse" // temporary dummy namespace
};


/**
 * @param {string} name parameter name
 * @param {string=} opt_url URL; window.location.href is used if not provided
 * @return {?string} parameter value
 */
adapt.base.getURLParam = function(name, opt_url) {
    var rg = new RegExp('#(.*&)?' + adapt.base.escapeRegExp(name) + '=([^#&]*)');
    var url = opt_url || window.location.href;
    var r = url.match(rg);
    if (r)
        return r[2];
    return null;
};

/**
 * @param {string} url
 * @param {string} name parameter name
 * @param {string} value parameter value
 * @return {string} new url
 */
adapt.base.setURLParam = function(url, name, value) {
    var rg = new RegExp('#(.*&)?' + adapt.base.escapeRegExp(name) + '=([^#&]*)');
    var r = url.match(rg);
    if (r) {
        var length = r[2].length;
        var index = r.index + r[0].length - length;
        return url.substr(0, index) + value + url.substr(index + length);
    }
    if (!url.match(/#/)) {
        return url + "#" + name + "=" + value;
    } else {
        return url + "&" + name + "=" + value;
    }
};

/**
 * @param {*} v
 * @return ?string
 */
adapt.base.asString = function(v) {
    if (v == null)
        return v;
    return v.toString();
};

/**
 * @interface
 */
adapt.base.Comparable = function() {};

/**
 * @param {!adapt.base.Comparable} other
 * @return {number} -1 when this less then other, 0 when this equals other
 */
adapt.base.Comparable.prototype.compare = function(other) {};


/**
 * A priority queue.
 * @constructor
 */
adapt.base.PriorityQueue = function() {
    /** @type {Array.<adapt.base.Comparable>} */ this.queue = [null];
};

/**
 * @return {number}
 */
adapt.base.PriorityQueue.prototype.length = function() {
    return this.queue.length - 1;
};

/**
 * @param {!adapt.base.Comparable} item
 * @return {void}
 */
adapt.base.PriorityQueue.prototype.add = function(item) {
    var index = this.queue.length;
    while (index > 1) {
        var parentIndex = Math.floor(index / 2);
        var parent = this.queue[parentIndex];
        if (parent.compare(item) > 0) {
            this.queue[index] = item;
            return;
        }
        this.queue[index] = parent;
        index = parentIndex;
    }
    this.queue[1] = item;
};

/**
 * @return {adapt.base.Comparable} highest priority Comparable.
 */
adapt.base.PriorityQueue.prototype.peek = function() {
    return this.queue[1];
};


/**
 * Remove the highest-priority item from the queue.
 * @return {!adapt.base.Comparable} removed item.
 */
adapt.base.PriorityQueue.prototype.remove = function() {
    var result = /** @type {!adapt.base.Comparable} */ (this.queue[1]);
    var curr = /** @type {!adapt.base.Comparable} */ (this.queue.pop());
    var size = this.queue.length;
    if (size > 1) {
        var index = 1;
        while (true) {
            var childIndex = index*2;
            if (childIndex >= size)
                break;
            if (this.queue[childIndex].compare(curr) > 0) {
                if (childIndex+1 < size &&
                    this.queue[childIndex+1].compare(
                        /** @type {!adapt.base.Comparable} */ (this.queue[childIndex])) > 0) {
                    childIndex++;
                }
            } else if (childIndex+1 < size && this.queue[childIndex+1].compare(curr) > 0) {
                childIndex++;
            } else {
                break;
            }
            this.queue[index] = this.queue[childIndex];
            index = childIndex;
        }
        this.queue[index] = curr;
    }
    return result;
};

/**
 * @private
 * @param {string} prefix Prefix (containing leading and trailing hyphens)
 * @param {string} cssPropName CSS property name
 * @return {string} JavaScript property name
 */
adapt.base.cssToJSProp = function(prefix, cssPropName) {
    if (prefix) {
        cssPropName = "-" + cssPropName;
        prefix = prefix.replace(/-/g, "");
        if (prefix === "moz") {
            prefix = "Moz";
        }
    }
    return prefix + cssPropName.replace(/-[a-z]/g, function(txt) {return txt.substr(1).toUpperCase();});
};

/**
 * @private
 * @const
 */
adapt.base.knownPrefixes = ["", "-webkit-", "-moz-", "-ms-", "-o-", "-epub-"];

/**
 * @private
 * @const @type {Object<string, ?string>}
 */
adapt.base.propNameMap = {};

/**
 * @private
 * @param {string} prefix
 * @param {string} prop
 * @returns {boolean}
 */
adapt.base.checkIfPropertySupported = function(prefix, prop) {
    // Special case
    if (prop === "writing-mode") {
        var probe = document.createElement("span");
        if (prefix === "-ms-") {
            probe.style.setProperty(prefix + prop, "tb-rl");
            return probe.style["writing-mode"] === "tb-rl";
        } else {
            probe.style.setProperty(prefix + prop, "vertical-rl");
            return probe.style[prefix + prop] === "vertical-rl";
        }
    } else {
        var style = document.documentElement.style;
        return typeof style[adapt.base.cssToJSProp(prefix, prop)] === "string";
    }
};

/**
 * @param {string} prop
 * @returns {?string}
 */
adapt.base.getPrefixedProperty = function(prop) {
    var prefixed = adapt.base.propNameMap[prop];
    if (prefixed || prefixed === null) { // null means the browser does not support the property
        return prefixed;
    }
    switch (prop) {
        case "writing-mode":
            // Special case: prefer '-ms-writing-mode' to 'writing-mode'
            if (adapt.base.checkIfPropertySupported("-ms-", "writing-mode")) {
                adapt.base.propNameMap[prop] = "-ms-writing-mode";
                return "-ms-writing-mode";
            }
            break;
        case "filter":
            // Special case: prefer '-webkit-filter' to 'filter'
            if (adapt.base.checkIfPropertySupported("-webkit-", "filter")) {
                adapt.base.propNameMap[prop] = "-webkit-filter";
                return "-webkit-filter";
            }
            break;
    }


    for (var i = 0; i < adapt.base.knownPrefixes.length; i++) {
        var prefix = adapt.base.knownPrefixes[i];
        if (adapt.base.checkIfPropertySupported(prefix, prop)) {
            prefixed = prefix + prop;
            adapt.base.propNameMap[prop] = prefixed;
            return prefixed;
        }
    }
    // Not supported by the browser
    vivliostyle.logging.logger.warn("Property not supported by the browser: ", prop);
    adapt.base.propNameMap[prop] = null;
    return null;
};

/**
 * @param {Element} elem
 * @param {string} prop
 * @param {string} value
 * @return {void}
 */
adapt.base.setCSSProperty = function(elem, prop, value) {
    try {
        var prefixed = adapt.base.getPrefixedProperty(prop);
        if (!prefixed) {
            return;
        }
        if (prefixed === "-ms-writing-mode") {
            switch (value) {
                case "horizontal-tb":
                    value = "lr-tb";
                    break;
                case "vertical-rl":
                    value = "tb-rl";
                    break;
                case "vertical-lr":
                    value = "tb-lr";
                    break;
            }
        }
        if (elem && elem.style) {
            (/** @type {HTMLElement} */ (elem)).style.setProperty(prefixed, value);
        }
    } catch (err) {
        vivliostyle.logging.logger.warn(err);
    }
};

/**
 * @param {Element} elem
 * @param {string} prop
 * @param {string=} opt_value
 * @return {string}
 */
adapt.base.getCSSProperty = function(elem, prop, opt_value) {
    try {
        return (/** @type {HTMLElement} */ (elem)).style.getPropertyValue(
            adapt.base.propNameMap[prop] || prop);
    } catch (err) {
    }
    return opt_value || "";
};

/**
 * @constructor
 */
adapt.base.StringBuffer = function() {
    /** @type {Array.<string>} */ this.list = [];
};

/**
 * @param {string} str
 * @return {!adapt.base.StringBuffer}
 */
adapt.base.StringBuffer.prototype.append = function(str) {
    this.list.push(str);
    return this;
};

/**
 * @return {void}
 */
adapt.base.StringBuffer.prototype.clear = function() {
    this.list = [];
};

/**
 * @override
 * @return {string}
 */
adapt.base.StringBuffer.prototype.toString = function() {
    var str = this.list.join('');
    this.list = [str];
    return str;
};

/**
 * @param {string} str
 * @return {string}
 */
adapt.base.escapeChar = function(str) {
    // not called for surrogate pairs, no need to worry about them
    return '\\' + str.charCodeAt(0).toString(16) + ' ';
};

/**
 * @param {string} name
 * @return {string}
 */
adapt.base.escapeCSSIdent = function(name) {
    return name.replace(/[^-_a-zA-Z0-9\u0080-\uFFFF]/g, adapt.base.escapeChar);
};

/**
 * @param {string} str
 * @return {string}
 */
adapt.base.escapeCSSStr = function(str) {
    return str.replace(/[\u0000-\u001F"]/g, adapt.base.escapeChar);
};

/**
 * @param {string} str
 * @return {string}
 */
adapt.base.lightURLEncode = function(str) {
    return str.replace(/[\s+&?=#\u007F-\uFFFF]+/g, encodeURIComponent);
};

/**
 * @param {string} ch
 * @return {boolean}
 */
adapt.base.isLetter = function(ch) {
    return !!ch.match(/^[a-zA-Z\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]$/);
};

/**
 * @param {string} str
 * @return {string}
 */
adapt.base.escapeRegexpChar = function(str) {
    return '\\u' + (0x10000|str.charCodeAt(0)).toString(16).substr(1);
};

/**
 * @param {string} str
 * @return {string}
 */
adapt.base.escapeRegExp = function(str) {
    return str.replace(/[^-a-zA-Z0-9_]/g, adapt.base.escapeRegexpChar);
};

/**
 * @param {boolean} cond
 * @return {void}
 */
adapt.base.assert = function(cond) {
    if (!cond) {
        throw "Assert failed";
    }
};

/**
 * Function good is defined for ints from 0 to high-1. It is such that for
 * each i between 1 and high-1 !good(i-1) || good(i) is true. In other words,
 * it goes like false ... false true ... true.
 * Find i such that (i == 0 || !good(i-1)) && (i == h || good(i))
 * In other words, good(i) is the "first" good = true.
 * @param {number} high
 * @param {function(number): boolean} good
 * @return {number}
 */
adapt.base.binarySearch = function(high, good) {
    var l = 0;
    var h = high;
    while (true) {
        if (goog.DEBUG) {
            adapt.base.assert(l <= h);
            adapt.base.assert(l == 0 || !good(l - 1));
            adapt.base.assert(h == high || good(h));
        }
        if (l == h)
            return l;
        var m = (l + h) >> 1;
        if (good(m))
            h = m;
        else
            l = m + 1;
    }
};

/**
 * Function to sort numbers low to high
 * @param {number} a
 * @param {number} b
 * @return {number}
 */
adapt.base.numberCompare = function(a, b) {
    return a - b;
};

/** @const */
adapt.base.base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/**
 * @param {adapt.base.StringBuffer} sb
 * @param {string} data
 * @return {void}
 */
adapt.base.appendBase64 = function(sb, data) {
    var length = data.length;
    var length3 = Math.floor(length / 3) * 3;
    for (var i = 0; i < length3; i += 3) {
        var c1 = data.charCodeAt(i) & 0xFF;
        var c2 = data.charCodeAt(i+1) & 0xFF;
        var c3 = data.charCodeAt(i+2) & 0xFF;
        sb.append(adapt.base.base64Chars.charAt(c1 >> 2));
        sb.append(adapt.base.base64Chars.charAt(((c1 << 4) | (c2 >> 4)) & 0x3F));
        sb.append(adapt.base.base64Chars.charAt(((c2 << 2) | (c3 >> 6)) & 0x3F));
        sb.append(adapt.base.base64Chars.charAt(c3 & 0x3F));
    }
    switch (length - length3) {
        case 1:
            var p1 = data.charCodeAt(length3) & 0xFF;
            sb.append(adapt.base.base64Chars.charAt(p1 >> 2));
            sb.append(adapt.base.base64Chars.charAt((p1 << 4) & 0x3F));
            sb.append("==");
            break;
        case 2:
            var q1 = data.charCodeAt(length3) & 0xFF;
            var q2 = data.charCodeAt(length3+1) & 0xFF;
            sb.append(adapt.base.base64Chars.charAt(q1 >> 2));
            sb.append(adapt.base.base64Chars.charAt(((q1 << 4) | (q2 >> 4)) & 0x3F));
            sb.append(adapt.base.base64Chars.charAt((q2 << 2) & 0x3F));
            sb.append("=");
            break;
    }
};

/**
 * @template T
 * @param {T} param
 * @return {T}
 */
adapt.base.identity = function(param) {return param;};

/**
 * Index array using key function. First encountered item wins on collision. Elements with
 * empty and null keys are dropped.
 * @template T
 * @param {Array.<T>} arr
 * @param {function(T):?string} key
 * @return {Object.<string,T>}
 */
adapt.base.indexArray = function(arr, key) {
    var map = {};
    for (var i = 0; i < arr.length; i++) {
        var v = arr[i];
        var k = key(v);
        if (k && !map[k]) {
            map[k] = v;
        }
    }
    return map;
};

/** @const */
adapt.base.emptyObj = {};

/**
 * Convert array of strings to an object with the values in the array set to true.
 * @param {Array.<string>} arr
 * @return {Object.<string,boolean>}
 */
adapt.base.arrayToSet = function(arr) {
    var set = {};
    for (var i = 0; i < arr.length; i++) {
        set[arr[i]] = true;
    }
    return set;
};

/**
 * Index array using key function. Repeated indices are all combined into arrays. Elements with
 * empty and null keys are dropped. Ordering of the elements in arrays is preserved.
 * @template T
 * @param {Array.<T>} arr
 * @param {function(T):?string} key
 * @return {Object.<string,Array.<T>>}
 */
adapt.base.multiIndexArray = function(arr, key) {
    var map = {};
    for (var i = 0; i < arr.length; i++) {
        var v = arr[i];
        var k = key(v);
        if (k) {
            if (map[k]) {
                map[k].push(v);
            } else {
                map[k] = [v];
            }
        }
    }
    return map;
};

/**
 * Apply function to each element of the array
 * @template P, R
 * @param {Array.<P>} arr
 * @param {function(P,number):R} fn second parameter is the index
 * @return {Array.<R>}
 */
adapt.base.map = function(arr, fn) {
    var res = Array(arr.length);
    for (var i = 0; i < arr.length; i++) {
        res[i] = fn(arr[i], i);
    }
    return res;
};

/**
 * Apply function to each value of the object
 * @template P, R
 * @param {Object.<string, P>} obj
 * @param {function(P,string):R} fn second parameter is the key
 * @return {Object.<string, R>}
 */
adapt.base.mapObj = function(obj, fn) {
    var res = {};
    for (var n in obj) {
        res[n] = fn(obj[n], n);
    }
    return res;
};

/**
 * @param {Object} obj
 * @return {number}
 */
adapt.base.mapSize = function(obj) {
    var n = 0;
    for (var key in obj) {
        n++;
    }
    return n;
};

/**
 * @typedef {{type:string, target, currentTarget, preventDefault}|Event}
 */
adapt.base.Event;

/**
 * @typedef {function(adapt.base.Event):void}
 */
adapt.base.EventListener;

/**
 * Extemely simple-minded EventTarget implementation. Consider using
 * goog.events.EventTarget if you are using Closure library.
 * @constructor
 */
adapt.base.SimpleEventTarget = function() {
    /** @type {Object.<string,Array.<adapt.base.EventListener>>} */ this.listeners = {};
};

/**
 * @param {adapt.base.Event} evt
 * @return {void}
 */
adapt.base.SimpleEventTarget.prototype.dispatchEvent = function(evt) {
    var list = this.listeners[evt.type];
    if (list) {
        evt.target = this;
        evt.currentTarget = this;
        for (var i = 0; i < list.length; i++) {
            list[i](evt);
        }
    }
};

/**
 * @param {string} type
 * @param {adapt.base.EventListener} listener
 * @param {boolean} capture
 * @return {void}
 */
adapt.base.SimpleEventTarget.prototype.addEventListener = function(type, listener, capture) {
    if (capture) {
        return;
    }
    var list = this.listeners[type];
    if (list) {
        list.push(listener);
    } else {
        this.listeners[type] = [listener];
    }
};

/**
 * @param {string} type
 * @param {adapt.base.EventListener} listener
 * @param {boolean} capture
 * @return {void}
 */
adapt.base.SimpleEventTarget.prototype.removeEventListener = function(type, listener, capture) {
    if (capture) {
        return;
    }
    var list = this.listeners[type];
    if (list) {
        var index = list.indexOf(listener);
        if (index >= 0) {
            list.splice(index, 1);
        }
    }
};

/**
 * @typedef {EventTarget|adapt.base.SimpleEventTarget}
 */
adapt.base.EventTarget;

/**
 * @type {boolean|null}
 */
adapt.base.hasLShapeFloatBug = null;

/**
 * Check if there is a bug with L-shape floats overlapping text.
 * @param {HTMLElement} body
 * @return {boolean}
 */
adapt.base.checkLShapeFloatBug = function(body) {
    if (adapt.base.hasLShapeFloatBug == null) {
        var doc = body.ownerDocument;
        var container = /** @type {HTMLElement} */ (doc.createElement("div"));
        container.style.position = "absolute";
        container.style.top = "0px";
        container.style.left = "0px";
        container.style.width = "100px";
        container.style.height = "100px";
        container.style.overflow = "hidden";
        container.style.lineHeight = "16px";
        container.style.fontSize = "16px";
        body.appendChild(container);
        var f1 = /** @type {HTMLElement} */ (doc.createElement("div"));
        f1.style.width = "0px";
        f1.style.height = "14px";
        f1.style.cssFloat = "left";
        container.appendChild(f1);
        var f2 = /** @type {HTMLElement} */ (doc.createElement("div"));
        f2.style.width = "50px";
        f2.style.height = "50px";
        f2.style.cssFloat = "left";
        f2.style.clear = "left";
        container.appendChild(f2);
        var t = doc.createTextNode("a a a a a a a a a a a a a a a a");
        container.appendChild(t);
        var range = doc.createRange();
        range.setStart(t, 0);
        range.setEnd(t, 1);
        var leftEdge = range.getBoundingClientRect().left;
        adapt.base.hasLShapeFloatBug = leftEdge < 40;
        body.removeChild(container);
    }
    return adapt.base.hasLShapeFloatBug;
};

/**
 * @type {boolean|null}
 */
adapt.base.hasVerticalBBoxBug = null;

/**
 * Check if there is a bug with the bounding boxes of vertical text characters.
 * Though method used to be used check Chrome bug, it seems that the bug has been already fixed:
 *   https://bugs.chromium.org/p/chromium/issues/detail?id=297808
 * We now use this method to check Firefox bug:
 *   https://bugzilla.mozilla.org/show_bug.cgi?id=1159309
 * @param {HTMLElement} body
 * @return {boolean}
 */
adapt.base.checkVerticalBBoxBug = function(body) {
    if (adapt.base.hasVerticalBBoxBug == null) {
        var doc = body.ownerDocument;
        var container = /** @type {HTMLElement} */ (doc.createElement("div"));
        container.style.position = "absolute";
        container.style.top = "0px";
        container.style.left = "0px";
        container.style.width = "100px";
        container.style.height = "100px";
        container.style.overflow = "hidden";
        container.style.lineHeight = "16px";
        container.style.fontSize = "16px";
        adapt.base.setCSSProperty(container, "writing-mode", "vertical-rl");
        body.appendChild(container);
        var t = doc.createTextNode("a a a a a a a a a a a a a a a a");
        container.appendChild(t);
        var range = doc.createRange();
        range.setStart(t, 0);
        range.setEnd(t, 1);
        var box = range.getBoundingClientRect();
        adapt.base.hasVerticalBBoxBug = (box.right - box.left < 10);
        body.removeChild(container);
    }
    return adapt.base.hasVerticalBBoxBug;
};
