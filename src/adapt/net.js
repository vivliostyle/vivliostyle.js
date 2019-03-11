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
 * @fileoverview Fetch resource from a URL.
 */
goog.provide('adapt.net');

goog.require('vivliostyle.logging');
goog.require('adapt.task');

/**
 * @enum {string}
 */
adapt.net.XMLHttpRequestResponseType = {
    DEFAULT: "",
    ARRAYBUFFER: "arraybuffer",
    BLOB: "blob",
    DOCUMENT: "document",
    JSON: "json",
    TEXT: "text"
};

/** @typedef {{status:number, statusText:?string, url:string, contentType:?string, responseText:?string, responseXML:Document, responseBlob:Blob}} */
adapt.net.Response;

/**
 * @param {string} url
 * @param {adapt.net.XMLHttpRequestResponseType=} opt_type
 * @param {string=} opt_method
 * @param {string=} opt_data
 * @param {string=} opt_contentType
 * @return {!adapt.task.Result.<adapt.net.Response>}
 */
adapt.net.ajax = (url, opt_type, opt_method, opt_data, opt_contentType) => {
    /** @type {!adapt.task.Frame.<adapt.net.Response>} */ const frame =
        adapt.task.newFrame("ajax");
    const request = new XMLHttpRequest();
    const continuation = frame.suspend(request);
    /** @type {adapt.net.Response} */ const response =
    {status: 0, statusText: "", url, contentType: null, responseText: null, responseXML: null, responseBlob: null};
    request.open(opt_method || "GET", url, true);
    if (opt_type) {
        request.responseType = opt_type;
    }
    request.onreadystatechange = () => {
        if (request.readyState === 4) {
            response.status = request.status;
            response.statusText = request.statusText || request.status == 404 && "Not Found" || "";
            if (response.status == 200 || response.status == 0) {
                if ((!opt_type || opt_type === adapt.net.XMLHttpRequestResponseType.DOCUMENT) &&
                    request.responseXML &&
                    request.responseXML.documentElement.localName != 'parsererror') {
                    response.responseXML = request.responseXML;
                    response.contentType = request.responseXML.contentType;
                } else if ((!opt_type || opt_type === adapt.net.XMLHttpRequestResponseType.DOCUMENT) &&
                    request.response instanceof HTMLDocument) {
                    response.responseXML = request.response;
                    response.contentType = request.response.contentType;
                } else {
                    const text = request.response;
                    if ((!opt_type || opt_type === adapt.net.XMLHttpRequestResponseType.TEXT) && typeof text == "string") {
                        response.responseText = text;
                    } else if (!text) {
                        vivliostyle.logging.logger.warn("Unexpected empty success response for", url);
                    } else {
                        if (typeof text == "string") {
                            response.responseBlob = adapt.net.makeBlob([text]);
                        } else {
                            response.responseBlob = /** @type {Blob} */ (text);
                        }
                    }
                    const contentTypeHeader = request.getResponseHeader("Content-Type");
                    if (contentTypeHeader) {
                        response.contentType = contentTypeHeader.replace(/(.*);.*$/, "$1");
                    }
                }
            }
            continuation.schedule(response);
        }
    };
    try {
        if (opt_data) {
            request.setRequestHeader("Content-Type",
                opt_contentType || "text/plain; charset=UTF-8");
            request.send(opt_data);
        }
        else {
            if ((/^file:|^https?:\/\/[^/]+\.githubusercontent\.com/).test(url)) {
                // File or GitHub raw URL
                if ((/\/aozorabunko\/[^/]+\/cards\/[^/]+\/files\/[^/.]+\.html$/).test(url)) {
                    // Aozorabunko's (X)HTML support
                    request.overrideMimeType("text/html; charset=Shift_JIS");
                } else if ((/\.(html|htm)$/).test(url)) {
                    request.overrideMimeType("text/html; charset=UTF-8");
                } else if ((/\.(xhtml|xht|xml|opf)$/).test(url)) {
                    request.overrideMimeType("application/xml; charset=UTF-8");
                } else if ((/\.(txt|css)$/).test(url)) {
                    request.overrideMimeType("text/plain; charset=UTF-8");
                } else {
                    // fallback to HTML
                    request.overrideMimeType("text/html; charset=UTF-8");
                }
            } else if ((/^data:,(<|%3C|%3c)/).test(url)) {
                request.overrideMimeType("text/html; charset=UTF-8");
            } else if ((/^data:,/).test(url)) {
                request.overrideMimeType("text/plain; charset=UTF-8");
            }
            request.send(null);
        }
    } catch (e) {
        vivliostyle.logging.logger.warn(e, `Error fetching ${url}`);
        continuation.schedule(response);
    }
    return frame.result();
};

/**
 * @param {Array.<string|Blob|ArrayBuffer|ArrayBufferView>} parts
 * @param {string=} opt_type
 * @return Blob
 */
adapt.net.makeBlob = (parts, opt_type) => {
    const type = opt_type || "application/octet-stream";
    const builderCtr = window["WebKitBlobBuilder"] || window["MSBlobBuilder"]; // deprecated
    if (builderCtr) {
        const builder = new builderCtr();
        for (let i = 0; i < parts.length; i++) {
            builder.append(parts[i]);
        }
        return builder.getBlob(type);
    }
    return new Blob(parts, {type});
};

/**
 * @param {!Blob} blob
 * @return adapt.task.Result.<ArrayBuffer>
 */
adapt.net.readBlob = blob => {
    /** @type {!adapt.task.Frame.<ArrayBuffer>} */ const frame =
        adapt.task.newFrame("readBlob");
    const fileReader = new FileReader();
    const continuation = frame.suspend(fileReader);
    fileReader.addEventListener("load", () => {
        continuation.schedule(/** @type {ArrayBuffer} */ (fileReader.result));
    }, false);
    fileReader.readAsArrayBuffer(blob);
    return frame.result();
};

/**
 * @param {string} url
 */
adapt.net.revokeObjectURL = url => {
    (window["URL"] || window["webkitURL"]).revokeObjectURL(url);
};

/**
 * @param {Blob} blob
 * @return {string} url
 */
adapt.net.createObjectURL = blob => (window["URL"] || window["webkitURL"]).createObjectURL(blob);

/**
 * @template Resource
 * @constructor
 * @param {function(adapt.net.Response,adapt.net.ResourceStore.<Resource>):adapt.task.Result.<Resource>} parser
 * @param {adapt.net.XMLHttpRequestResponseType} type
 */
adapt.net.ResourceStore = function(parser, type) {
    /** @const */ this.parser = parser;
    /** @const */ this.type = type;
    /** @type {Object.<string,Resource>} */ this.resources = {};
    /** @type {Object.<string,adapt.taskutil.Fetcher.<Resource>>} */ this.fetchers = {};
};

/**
 * @param {string} url
 * @param {boolean=} opt_required
 * @param {string=} opt_message
 * @return {!adapt.task.Result.<Resource>} resource for the given URL
 */
adapt.net.ResourceStore.prototype.load = function(url, opt_required, opt_message) {
    url = adapt.base.stripFragment(url);
    const resource = this.resources[url];
    if (typeof resource != "undefined") {
        return adapt.task.newResult(resource);
    }
    return this.fetch(url, opt_required, opt_message).get();
};

/**
 * @private
 * @param {string} url
 * @param {boolean=} opt_required
 * @param {string=} opt_message
 * @return {!adapt.task.Result.<Resource>}
 */
adapt.net.ResourceStore.prototype.fetchInner = function(url, opt_required, opt_message) {
    const self = this;
    /** @type {adapt.task.Frame.<Resource>} */ const frame = adapt.task.newFrame("fetch");

    // Hack for TOCView.showTOC()
    const isTocBox = url.endsWith("?viv-toc-box");
    if (isTocBox) {
        url = url.replace("?viv-toc-box", "");
    }

    adapt.net.ajax(url, self.type).then(response => {
        if (response.status >= 400) {
            if (opt_required) {
                throw new Error((opt_message || `Failed to fetch required resource: ${url}`) +
                ` (${response.status}${response.statusText ? ' ' + response.statusText : ''})`);
            }
        }
        if (isTocBox) { // Hack for TOCView.showTOC()
            url += "?viv-toc-box";
            response.url += "?viv-toc-box";
        }
        self.parser(response, self).then(resource => {
            delete self.fetchers[url];
            self.resources[url] = resource;
            frame.finish(resource);
        });
    });
    return frame.result();
};

/**
 * @param {string} url
 * @param {boolean=} opt_required
 * @param {string=} opt_message
 * @return {adapt.taskutil.Fetcher.<Resource>} fetcher for the resource for the given URL
 */
adapt.net.ResourceStore.prototype.fetch = function(url, opt_required, opt_message) {
    url = adapt.base.stripFragment(url);
    const resource = this.resources[url];
    if (resource) {
        return null;
    }
    let fetcher = this.fetchers[url];
    if (!fetcher) {
        const self = this;
        fetcher = new adapt.taskutil.Fetcher(() => self.fetchInner(url, opt_required, opt_message), `Fetch ${url}`);
        self.fetchers[url] = fetcher;
        fetcher.start();
    }
    return fetcher;
};

/**
 * @param {string} url
 * @return {adapt.xmldoc.XMLDocHolder}
 */
adapt.net.ResourceStore.prototype.get = function(url) {
    return this.resources[adapt.base.stripFragment(url)];
};

/**
 * @param {string} url
 */
adapt.net.ResourceStore.prototype.delete = function(url) {
    delete this.resources[adapt.base.stripFragment(url)];
};

/**
 * @typedef adapt.net.ResourceStore.<adapt.base.JSON>
 */
adapt.net.JSONStore;

/**
 * @param {adapt.net.Response} response
 * @param {adapt.net.JSONStore} store
 * @return {!adapt.task.Result.<adapt.base.JSON>}
 */
adapt.net.parseJSONResource = (response, store) => {
    const text = response.responseText;
    return adapt.task.newResult(text ? adapt.base.stringToJSON(text) : null);
};

/**
 * return {adapt.net.JSONStore}
 */
adapt.net.newJSONStore = () => new adapt.net.ResourceStore(adapt.net.parseJSONResource, adapt.net.XMLHttpRequestResponseType.TEXT);
