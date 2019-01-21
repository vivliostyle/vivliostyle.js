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

class SettingsPanel {
    constructor(
        viewerOptions,
        documentOptions,
        viewer,
        messageDialog,
        settingsPanelOptions
    ) {
        this.viewerOptions_ = viewerOptions;
        this.documentOptions_ = documentOptions;
        this.viewer_ = viewer;

        this.isPageSizeChangeDisabled = !!settingsPanelOptions.disablePageSizeChange;
        this.isOverrideDocumentStyleSheetDisabled = this.isPageSizeChangeDisabled;
        this.isPageViewModeChangeDisabled = !!settingsPanelOptions.disablePageViewModeChange;
        this.isRenderAllPagesChangeDisabled = !!settingsPanelOptions.disableRenderAllPagesChange;

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
            }),
            renderAllPages: ko.pureComputed({
                read: () => {
                    return this.state.viewerOptions.renderAllPages();
                },
                write: value => {
                    this.state.viewerOptions.renderAllPages(value);
                }
            })
        };

        const settingsParent = document.getElementById("vivliostyle-menu-item_misc-toggle");
        this.settingsButton = settingsParent && settingsParent.firstElementChild;

        ["close", "toggle", "apply", "reset"].forEach(function(methodName) {
            this[methodName] = this[methodName].bind(this);
        }, this);

        messageDialog.visible.subscribe(function(visible) {
            if (visible) this.close();
        }, this);
    }

    close() {
        this.opened(false);
        const viewportElement = document.getElementById("vivliostyle-viewer-viewport");
        if (viewportElement) viewportElement.focus();
        return true;
    }

    toggle() {
        let open = !this.opened();
        if (open) {
            this.opened(open);
            if (this.settingsButton) {
                const inputElem = Array.from(this.settingsButton.parentElement.getElementsByTagName("input"))
                    .find(e => !e.disabled && e.checked);
                if (inputElem) {
                    inputElem.focus();
                }
            }
        } else {
            this.close();
        }
    }

    apply() {
        if (this.state.renderAllPages() === this.viewerOptions_.renderAllPages() &&
                this.state.pageSize.equivalentTo(this.documentOptions_.pageSize)) {
            this.viewerOptions_.copyFrom(this.state.viewerOptions);
        } else {
            this.documentOptions_.pageSize.copyFrom(this.state.pageSize);
            this.viewer_.loadDocument(this.documentOptions_, this.state.viewerOptions);
        }
        this.close();
    }

    reset() {
        this.state.viewerOptions.copyFrom(this.viewerOptions_);
        this.state.pageSize.copyFrom(this.documentOptions_.pageSize);
        this.close();
    }

    handleKey(key) {
        switch (key) {
            case Keys.Escape:
                if (this.opened()) {
                    this.reset();
                    return false;
                }
                return true;
            case "s":
            case "S":
                if (!this.opened() || document.activeElement === this.settingsButton) {
                    this.toggle();
                    return false;
                }
                return true;
            case Keys.Space:
                if (document.activeElement === this.settingsButton) {
                    this.toggle();
                    return false;
                }
                return true;
            case Keys.Enter:
                if (this.settingsButton && this.settingsButton.parentElement.contains(document.activeElement) &&
                        document.activeElement.id !== "vivliostyle-menu-button_apply" &&
                        document.activeElement.id !== "vivliostyle-menu-button_reset") {
                    document.getElementById("vivliostyle-menu-button_apply").focus();
                    return false;
                }
                return true;
            default:
                return true;
        }
    }
}

export default SettingsPanel;
