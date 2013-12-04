/**
 * Copyright 2013 Google, Inc.
 * @fileoverview Fetch resource from a URL.
 */
goog.provide('adapt.net');

goog.require('adapt.task');

/** @typedef {{status:number, responseText:?string, responseXML:Document}}*/
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
    	{tag: "proxy", status: 0, responseText: null, responseXML: null};
    request.open(opt_method || "GET", url, true);
    if (opt_binary) {
    	if (request.overrideMimeType) {
    		request.overrideMimeType("text/plain; charset=x-user-defined");
    	} else {
    		request.responseType = "blob";
    	}
    }
    request.onreadystatechange = function() {
        if (request.readyState === 4) {
        	response.status = request.status;
        	if (response.status == 200 || response.status == 0) {
	        	if (!opt_binary && request.responseXML) {
	        		response.responseXML = request.responseXML;
	        	} else {
	        		var text = request.response;
	        		if (typeof text == "string") {
	        			response.responseText = text;
	        		} else if (!text) {
        				adapt.base.log("Unexpected empty success response for " + url);
        			} else {
        				// Lame path, only used for IE right now
        				var fileReader = new FileReader();
        				fileReader.readAsArrayBuffer(/** @type {!Blob} */ (text));
        				fileReader.addEventListener("load", function() {
        					var sb = new adapt.base.StringBuffer();
        					var arr = /** @type {ArrayBuffer} */ (fileReader.result);
        					var view = new DataView(arr);
        					var len = arr.byteLength;
        					for (var i = 0; i < len; i++) {
        						sb.append(String.fromCharCode(view.getUint8(i)));
        					}
        					response.responseText = sb.toString();
        		            continuation.schedule(response);
        				}, false);
        				return;
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
