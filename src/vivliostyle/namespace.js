/**
 * Copyright 2015 Vivliostyle Inc.
 * @fileoverview Setup namespace for Vivliostyle.
 */
goog.provide("vivliostyle.namespace");

/**
 * Get an enclosing object, to which `vivliostyle` object (namespace) will be attached.
 * The enclosing object is passed from a wrapper function defined in `wrapper.js`.
 * @private
 * @returns {!Object}
 */
vivliostyle.namespace.getEnclosingObject = function() {
    if (typeof enclosingObject !== "undefined" && enclosingObject) {
        return enclosingObject;
    } else {
        return window;
    }
};

/**
 * Export a symbol to the enclosing object returned from `getEnclosingObject`.
 * @param {string} publicPath Unobfuscated name to export.
 * @param {*} object Object the name should point to.
 */
vivliostyle.namespace.exportSymbol = function(publicPath, object) {
    goog.exportSymbol(publicPath, object, vivliostyle.namespace.getEnclosingObject());
};
