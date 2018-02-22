/**
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
 * @fileoverview Setup namespace for Vivliostyle.
 */
/*globals enclosingObject */
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
