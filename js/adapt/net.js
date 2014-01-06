/**
 * Copyright 2013 Google, Inc.
 * @fileoverview Fetch resource from a URL.
 */
goog.provide('adapt.net');

goog.require('adapt.task');

/** @typedef {{status:number, responseText:?string, responseXML:Document, responseBlob:Blob}} */
adapt.net.Response;

/**
 * @param {string} url
 * @param {boolean=} opt_binary
 * @param {string=} opt_method
 * @param {string=} opt_data
 * @param {string=} opt_contentType 
 * @return {!adapt.task.Result.<adapt.net.Response>}
 */
adapt.net.ajax = function(url, opt_binary, opt_method, opt_data, opt_contentType) {
    /** @type {!adapt.task.Frame.<adapt.net.Response>} */ var frame =
    	adapt.task.newFrame("ajax");
    var request = new XMLHttpRequest();
    var continuation = frame.suspend(request);
    /** @type {adapt.net.Response} */ var response =
    	{status: 0, responseText: null, responseXML: null, responseBlob: null};
    request.open(opt_method || "GET", url, true);
    if (opt_binary) {
    	request.responseType = "blob";
    }
    request.onreadystatechange = function() {
        if (request.readyState === 4) {
        	response.status = request.status;
        	if (response.status == 200 || response.status == 0) {
	        	if (!opt_binary && request.responseXML) {
	        		response.responseXML = request.responseXML;
	        	} else {
	        		var text = request.response;
	        		if (!opt_binary && typeof text == "string") {
	        			response.responseText = text;
	        		} else if (!text) {
        				adapt.base.log("Unexpected empty success response for " + url);
        			} else {
        				if (typeof text == "string") {
        					response.responseBlob = adapt.net.makeBlob([text]);
        				} else {
        					response.responseBlob = /** @type {Blob} */ (text);
        				}
        			}
	        	}
        	}
            continuation.schedule(response);
        }
    };
    if (opt_data) {
        request.setRequestHeader("Content-Type",
        		opt_contentType || "text/plain; charset=UTF-8");
        request.send(opt_data);
    }
    else
        request.send(null);
    return frame.result();
};

/**
 * @param {Array.<string|Blob|ArrayBuffer|ArrayBufferView>} parts
 * @param {string=} opt_type
 * @return Blob
 */
adapt.net.makeBlob = function(parts, opt_type) {
	var type = opt_type || "application/octet-stream";
	var builderCtr = window["WebKitBlobBuilder"] || window["MSBlobBuilder"]; // deprecated
	if (builderCtr) {
		var builder = new builderCtr();
		for (var i = 0; i < parts.length; i++) {
			builder.append(parts[i]);
		}
		return builder.getBlob(type);
	}
	return new Blob(parts, {type: type});
};

/**
 * @param {!Blob} blob
 * @return adapt.task.Result.<ArrayBuffer> 
 */
adapt.net.readBlob = function(blob) {
    /** @type {!adapt.task.Frame.<ArrayBuffer>} */ var frame =
    	adapt.task.newFrame("readBlob");
	var fileReader = new FileReader();
    var continuation = frame.suspend(fileReader);
	fileReader.addEventListener("load", function() {
		continuation.schedule(/** @type {ArrayBuffer} */ (fileReader.result));
	}, false);
	fileReader.readAsArrayBuffer(blob);
	return frame.result();
};

/**
 * @param {string} url
 */
adapt.net.revokeObjectURL = function(url) {
	(window["URL"] || window["webkitURL"]).revokeObjectURL(url);	
};

/**
 * @param {Blob} blob
 * @return {string} url
 */
adapt.net.createObjectURL = function(blob) {
	return (window["URL"] || window["webkitURL"]).createObjectURL(blob);
};
