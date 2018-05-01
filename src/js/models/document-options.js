/*
 * Copyright 2015 Trim-marks Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

import ko from "knockout";
import urlParameters from "../stores/url-parameters";
import PageSize from "./page-size";

function getDocumentOptionsFromURL() {
    var epubUrl = urlParameters.getParameter("b");
    var url = urlParameters.getParameter("x");
    var fragment = urlParameters.getParameter("f", true);
    var style = urlParameters.getParameter("style");
    var userStyle = urlParameters.getParameter("userStyle");
    return {
        epubUrl: epubUrl[0] || null,
        url: url.length ? url : null,
        fragment: fragment[0] || null,
        authorStyleSheet: style.length ? style : [],
        userStyleSheet: userStyle.length ? userStyle : []
    };
}

function DocumentOptions() {
    var urlOptions = getDocumentOptionsFromURL();
    this.epubUrl = ko.observable(urlOptions.epubUrl || "");
    this.url = ko.observable(urlOptions.url || null);
    this.fragment = ko.observable(urlOptions.fragment || "");
    this.authorStyleSheet = ko.observable(urlOptions.authorStyleSheet);
    this.userStyleSheet = ko.observable(urlOptions.userStyleSheet);
    this.pageSize = new PageSize();

    // write fragment back to URL when updated
    this.fragment.subscribe(fragment => {
        var encoded = fragment.replace(/[\s+&?=#\u007F-\uFFFF]+/g, encodeURIComponent);
        urlParameters.setParameter("f", encoded, true);
    });
}

DocumentOptions.prototype.toObject = function() {
    function convertStyleSheetArray(arr) {
        return arr.map(url => ({
            url: url
        }));
    }
    var uss = convertStyleSheetArray(this.userStyleSheet());
    // Do not include url
    // (url is a required argument to Viewer.loadDocument, separated from other options)
    return {
        fragment: this.fragment(),
        authorStyleSheet: convertStyleSheetArray(this.authorStyleSheet()),
        userStyleSheet: [{
            text: "@page {" + this.pageSize.toCSSDeclarationString() + "}"
        }].concat(uss)
    };
};

export default DocumentOptions;
