/*
 * Copyright 2015 Trim-marks Inc.
 * Copyright 2018 Vivliostyle Foundation
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
import {Keys} from "../utils/key-util";
import vivliostyle from "../models/vivliostyle";

class Navigation {
    constructor(viewerOptions, viewer, settingsPanel, navigationOptions) {
        this.viewerOptions_ = viewerOptions;
        this.viewer_ = viewer;
        this.settingsPanel_ = settingsPanel;

        this.isDisabled = ko.pureComputed(() => {
            return this.settingsPanel_.opened() || !this.viewer_.state.navigatable();
        });

        const navigationDisabled = ko.pureComputed(() => {
            return navigationOptions.disablePageNavigation || this.isDisabled();
        });

        this.isNavigateToPreviousDisabled = ko.pureComputed(() => {
            if (navigationDisabled()) {
                return true;
            }
            if (this.viewer_.state.status === undefined) {
                return false;   // needed for test/spec/viewmodels/navigation-spec.js
            }
            return this.viewer_.firstPage();
        });

        this.isNavigateToNextDisabled = ko.pureComputed(() => {
            if (navigationDisabled()) {
                return true;
            }
            if (this.viewer_.state.status === undefined) {
                return false;   // needed for test/spec/viewmodels/navigation-spec.js
            }
            if (this.viewerOptions_.renderAllPages() &&
                this.viewer_.state.status() != vivliostyle.constants.ReadyState.COMPLETE) {
                return false;
            }
            return this.viewer_.lastPage();
        });

        this.isNavigateToLeftDisabled = ko.pureComputed(() => {
            if (navigationDisabled()) {
                return true;
            }
            if (this.viewer_.state.pageProgression === undefined) {
                return false;   // needed for test/spec/viewmodels/navigation-spec.js
            }
            if (this.viewer_.state.pageProgression() === vivliostyle.constants.PageProgression.LTR) {
                return this.isNavigateToPreviousDisabled();
            } else {
                return this.isNavigateToNextDisabled();
            }
        });

        this.isNavigateToRightDisabled = ko.pureComputed(() => {
            if (navigationDisabled()) {
                return true;
            }
            if (this.viewer_.state.pageProgression === undefined) {
                return false;   // needed for test/spec/viewmodels/navigation-spec.js
            }
            if (this.viewer_.state.pageProgression() === vivliostyle.constants.PageProgression.LTR) {
                return this.isNavigateToNextDisabled();
            } else {
                return this.isNavigateToPreviousDisabled();
            }
        });

        this.isNavigateToFirstDisabled = this.isNavigateToPreviousDisabled;

        this.isNavigateToLastDisabled = ko.pureComputed(() => {
            if (navigationDisabled()) {
                return true;
            }
            if (this.viewer_.state.status === undefined) {
                return false;   // needed for test/spec/viewmodels/navigation-spec.js
            }
            if (this.viewerOptions_.renderAllPages() &&
                this.viewer_.state.status() != vivliostyle.constants.ReadyState.COMPLETE) {
                return true;
            }
            return this.viewer_.lastPage();
        });

        this.hidePageNavigation = !!navigationOptions.disablePageNavigation;

        const zoomDisabled = ko.pureComputed(() => {
            return navigationOptions.disableZoom || this.isDisabled();
        });

        this.isZoomOutDisabled = zoomDisabled;
        this.isZoomInDisabled = zoomDisabled;
        this.isZoomToActualSizeDisabled = zoomDisabled;
        this.isToggleFitToScreenDisabled = zoomDisabled;
        this.hideZoom = !!navigationOptions.disableZoom;

        this.fitToScreen = ko.pureComputed(() => viewerOptions.zoom().fitToScreen);

        const fontSizeChangeDisabled = ko.pureComputed(() => {
            return navigationOptions.disableFontSizeChange || this.isDisabled();
        });

        this.isIncreaseFontSizeDisabled = fontSizeChangeDisabled;
        this.isDecreaseFontSizeDisabled = fontSizeChangeDisabled;
        this.isDefaultFontSizeDisabled = fontSizeChangeDisabled;
        this.hideFontSizeChange = !!navigationOptions.disableFontSizeChange;

        this.pageNumber = ko.pureComputed({
            read() {
                return this.viewer_.epageToPageNumber(this.viewer_.epage());
            },
            write(pageNumberText) {
                // Accept non-integer, convert fullwidth to ascii
                let pageNumber = parseFloat(pageNumberText.replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))) || 0;
                if (pageNumber < 1) {
                    pageNumber = 1;
                } else {
                    const epageCount = this.viewer_.epageCount();
                    if (pageNumber > epageCount + 1) {
                        // Accept "+1" because the last epage may equal epageCount.
                        pageNumber = epageCount + 1;
                    }
                }
                const elem = document.getElementById('vivliostyle-page-number');
                elem.value = pageNumber;
                this.viewer_.navigateToEPage(this.viewer_.epageFromPageNumber(pageNumber));

                elem.blur();
            },
            owner: this
        });

        this.totalPages = ko.pureComputed(() => {
            return this.viewer_.epageCount();
        });

        [
            "navigateToPrevious",
            "navigateToNext",
            "navigateToLeft",
            "navigateToRight",
            "navigateToFirst",
            "navigateToLast",
            "zoomIn",
            "zoomOut",
            "zoomToActualSize",
            "toggleFitToScreen",
            "increaseFontSize",
            "decreaseFontSize",
            "defaultFontSize",
            "handleKey"
        ].forEach(methodName => {
            this[methodName] = this[methodName].bind(this);
        });
    }

    navigateToPrevious() {
        if (!this.isNavigateToPreviousDisabled()) {
            this.viewer_.navigateToPrevious();
            return true;
        } else {
            return false;
        }
    }

    navigateToNext() {
        if (!this.isNavigateToNextDisabled()) {
            this.viewer_.navigateToNext();
            return true;
        } else {
            return false;
        }
    }

    navigateToLeft() {
        if (!this.isNavigateToLeftDisabled()) {
            this.viewer_.navigateToLeft();
            return true;
        } else {
            return false;
        }
    }

    navigateToRight() {
        if (!this.isNavigateToRightDisabled()) {
            this.viewer_.navigateToRight();
            return true;
        } else {
            return false;
        }
    }

    navigateToFirst() {
        if (!this.isNavigateToFirstDisabled()) {
            this.viewer_.navigateToFirst();
            return true;
        } else {
            return false;
        }
    }

    navigateToLast() {
        if (!this.isNavigateToLastDisabled()) {
            this.viewer_.navigateToLast();
            return true;
        } else {
            return false;
        }
    }

    zoomIn() {
        if (!this.isZoomInDisabled()) {
            const zoom = this.viewerOptions_.zoom();
            this.viewerOptions_.zoom(zoom.zoomIn(this.viewer_));
            return true;
        } else {
            return false;
        }
    }

    zoomOut() {
        if (!this.isZoomOutDisabled()) {
            const zoom = this.viewerOptions_.zoom();
            this.viewerOptions_.zoom(zoom.zoomOut(this.viewer_));
            return true;
        } else {
            return false;
        }
    }

    zoomToActualSize() {
        if (!this.isZoomToActualSizeDisabled()) {
            const zoom = this.viewerOptions_.zoom();
            this.viewerOptions_.zoom(zoom.zoomToActualSize());
            return true;
        } else {
            return false;
        }
    }

    toggleFitToScreen() {
        if (!this.isToggleFitToScreenDisabled()) {
            const zoom = this.viewerOptions_.zoom();
            this.viewerOptions_.zoom(zoom.toggleFitToScreen());
            return true;
        } else {
            return false;
        }
    }

    increaseFontSize() {
        if (!this.isIncreaseFontSizeDisabled()) {
            const fontSize = this.viewerOptions_.fontSize();
            this.viewerOptions_.fontSize(fontSize * 1.25);
            return true;
        } else {
            return false;
        }
    }

    decreaseFontSize() {
        if (!this.isDecreaseFontSizeDisabled()) {
            const fontSize = this.viewerOptions_.fontSize();
            this.viewerOptions_.fontSize(fontSize * 0.8);
            return true;
        } else {
            return false;
        }
    }

    defaultFontSize() {
        if (!this.isDefaultFontSizeDisabled()) {
            const fontSize = ViewerOptions.getDefaultValues().fontSize;
            this.viewerOptions_.fontSize(fontSize);
            return true;
        } else {
            return false;
        }
    }

    handleKey(key) {
        const isInputActive = document.activeElement && document.activeElement.tagName.toLowerCase() === 'input';
        switch (key) {
            case Keys.ArrowDown:
            case Keys.PageDown:
                return !this.navigateToNext();
            case Keys.ArrowLeft:
                return isInputActive || !this.navigateToLeft();
            case Keys.ArrowRight:
                return isInputActive || !this.navigateToRight();
            case Keys.ArrowUp:
            case Keys.PageUp:
                return !this.navigateToPrevious();
            case Keys.Home:
                return !this.navigateToFirst();
            case Keys.End:
                return !this.navigateToLast();
            case "+":
                return isInputActive || !this.increaseFontSize();
            case "-":
                return isInputActive || !this.decreaseFontSize();
            case "0":
                return isInputActive || !this.defaultFontSize();
            case "g":
            case "G":
                document.getElementById('vivliostyle-page-number').focus();
                return false;
            default:
                return true;
        }
    }
}

export default Navigation;
