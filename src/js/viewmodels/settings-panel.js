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
import ViewerOptions from "../models/viewer-options";
import PageSize from "../models/page-size";
import PageViewMode from "../models/page-view-mode";
import {Keys} from "../utils/key-util";

function SettingsPanel(viewerOptions, documentOptions, viewer, messageDialog, settingsPanelOptions) {
    this.viewerOptions_ = viewerOptions;
    this.documentOptions_ = documentOptions;
    this.viewer_ = viewer;

    this.isPageSizeChangeDisabled = !!settingsPanelOptions.disablePageSizeChange;
    this.isOverrideDocumentStyleSheetDisabled = this.isPageSizeChangeDisabled;
    this.isPageViewModeChangeDisabled = !!settingsPanelOptions.disablePageViewModeChange;

    this.opened = ko.observable(false);
    this.state = {
        viewerOptions: new ViewerOptions(viewerOptions),
        pageSize: new PageSize(documentOptions.pageSize),
        pageViewMode: ko.pureComputed({
            read: () => {
                return this.state.viewerOptions.pageViewMode().toString();
            },
            write: value => {
                this.state.viewerOptions.pageViewMode(PageViewMode.of(value));
            }
        })
    };

    ["close", "toggle", "apply", "reset"].forEach(function(methodName) {
        this[methodName] = this[methodName].bind(this);
    }, this);

    messageDialog.visible.subscribe(function(visible) {
        if (visible) this.close();
    }, this);
}

SettingsPanel.prototype.close = function() {
    this.opened(false);
    return true;
};

SettingsPanel.prototype.toggle = function() {
    this.opened(!this.opened());
};

SettingsPanel.prototype.apply = function() {
    if (this.state.pageSize.equivalentTo(this.documentOptions_.pageSize)) {
        this.viewerOptions_.copyFrom(this.state.viewerOptions);
    } else {
        this.documentOptions_.pageSize.copyFrom(this.state.pageSize);
        this.viewer_.loadDocument(this.documentOptions_, this.state.viewerOptions);
    }
};

SettingsPanel.prototype.reset = function() {
    this.state.viewerOptions.copyFrom(this.viewerOptions_);
    this.state.pageSize.copyFrom(this.documentOptions_.pageSize);
};

SettingsPanel.prototype.handleKey = function(key) {
    switch (key) {
        case Keys.Escape:
            this.close();
            return true;
        default:
            return true;
    }
};

export default SettingsPanel;
