/*
 * Copyright 2015 Vivliostyle Inc.
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
import PageViewMode from "./page-view-mode";
import ZoomOptions from "./zoom-options";

function getViewerOptionsFromURL() {
    return {
        profile: (urlParameters.getParameter("profile")[0] === "true"),
        pageViewMode: PageViewMode.fromSpreadViewString(urlParameters.getParameter("spread")[0])
    };
}

function getDefaultValues() {
    return {
        fontSize: 16,
        profile: false,
        pageViewMode: PageViewMode.defaultMode(),
        zoom: ZoomOptions.createDefaultOptions()
    };
}

function ViewerOptions(options) {
    this.fontSize = ko.observable();
    this.profile = ko.observable();
    this.pageViewMode = ko.observable();
    this.zoom = ko.observable();
    if (options) {
        this.copyFrom(options);
    } else {
        var defaultValues = getDefaultValues();
        var urlOptions = getViewerOptionsFromURL();
        this.fontSize(defaultValues.fontSize);
        this.profile(urlOptions.profile || defaultValues.profile);
        this.pageViewMode(urlOptions.pageViewMode || defaultValues.pageViewMode);
        this.zoom(defaultValues.zoom);

        // write spread parameter back to URL when updated
        this.pageViewMode.subscribe(function(pageViewMode) {
            urlParameters.setParameter("spread", pageViewMode.toSpreadViewString());
        });
    }
}

ViewerOptions.prototype.copyFrom = function(other) {
    this.fontSize(other.fontSize());
    this.profile(other.profile());
    this.pageViewMode(other.pageViewMode());
    this.zoom(other.zoom());
};

ViewerOptions.prototype.toObject = function() {
    return {
        fontSize: this.fontSize(),
        pageViewMode: this.pageViewMode().toString(),
        zoom: this.zoom().zoom,
        fitToScreen: this.zoom().fitToScreen
    }
};

ViewerOptions.getDefaultValues = getDefaultValues;

export default ViewerOptions;
