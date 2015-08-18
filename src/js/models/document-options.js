"use strict";
import ko from "knockout";
import urlParameters from "../stores/url-parameters";

function getDocumentOptionsFromURL() {
    return {
        url: urlParameters.getParameter("x"),
        fragment: urlParameters.getParameter("f")
    };
}

function DocumentOptions() {
    var urlOptions = getDocumentOptionsFromURL();
    this.url = ko.observable(urlOptions.url || "");
    this.fragment = ko.observable(urlOptions.fragment || "");
}

DocumentOptions.prototype.toObject = function() {
    // Do not include url
    // (url is a required argument to Viewer.loadDocument, separated from other options)
    return {
        fragment: this.fragment()
    };
};

export default DocumentOptions;
