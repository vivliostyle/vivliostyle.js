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

        navigationDisabled.subscribe(disabled => {
            const pageNumberElem = document.getElementById("vivliostyle-page-number");
            if (pageNumberElem) {
                pageNumberElem.disabled = disabled;
            }
        });

        this.isPageNumberDisabled = ko.pureComputed(() => {
            return navigationDisabled();
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
                const epageOld = this.viewer_.epage();
                const pageNumberOld = this.viewer_.epageToPageNumber(epageOld);

                // Accept non-integer, convert fullwidth to ascii
                let pageNumber = parseFloat(pageNumberText.replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))) || 0;
                if (/^[-+]/.test(pageNumberText)) {
                    // "+number" and "-number" to relative move.
                    pageNumber = pageNumberOld + pageNumber;
                }
                if (pageNumber < 1) {
                    pageNumber = 1;
                } else {
                    const epageCount = this.viewer_.epageCount();
                    if (this.viewerOptions_.renderAllPages()) {
                        if (pageNumber > epageCount) {
                            pageNumber = epageCount;
                        }
                    } else if (pageNumber > epageCount + 1) {
                        // Accept "epageCount + 1" because the last epage may equal epageCount.
                        pageNumber = epageCount + 1;
                    }
                }
                const epageNav = this.viewer_.epageFromPageNumber(pageNumber);
                const pageNumberElem = document.getElementById("vivliostyle-page-number");
                pageNumberElem.value = pageNumber;
                this.viewer_.navigateToEPage(epageNav);

                setTimeout(() => {
                    if (this.viewer_.state.status() != vivliostyle.constants.ReadyState.LOADING &&
                        this.viewer_.epage() === epageOld) {
                        pageNumberElem.value = pageNumberOld;
                    }
                    pageNumberElem.blur();
                }, 10);
            },
            owner: this
        });

        this.totalPages = ko.pureComputed(() => {
            let totalPages = this.viewer_.epageCount();
            if (!totalPages) {
                return totalPages;
            }
            const pageNumber = this.pageNumber();
            if (this.viewer_.lastPage()) {
                totalPages = pageNumber;
            } else if (pageNumber >= totalPages) {
                totalPages++;
            }
            return totalPages;
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
        if (document.getElementById("vivliostyle-menu_misc").contains(document.activeElement)) {
            return true;
        }

        const pageNumberElem = document.getElementById("vivliostyle-page-number");
        const viewportElement = document.getElementById("vivliostyle-viewer-viewport");
        const horizontalScrollable = viewportElement.scrollWidth > viewportElement.clientWidth;
        const verticalScrollable = viewportElement.scrollHeight > viewportElement.clientHeight;

        const isPageNumberInput = pageNumberElem === document.activeElement;

        if (!isPageNumberInput) {
            viewportElement.focus();
        }

        switch (key) {
            case "+":
                return isPageNumberInput || !this.increaseFontSize();
            case "-":
                return isPageNumberInput || !this.decreaseFontSize();
            case "0":
                return isPageNumberInput || !this.defaultFontSize();
            case "1":
                return isPageNumberInput || !this.zoomToActualSize();
            case Keys.ArrowLeft:
                return isPageNumberInput || horizontalScrollable || !this.navigateToLeft();
            case Keys.ArrowRight:
                return isPageNumberInput || horizontalScrollable || !this.navigateToRight();
            case Keys.ArrowDown:
                viewportElement.focus();
                return verticalScrollable || !this.navigateToNext();
            case Keys.ArrowUp:
                viewportElement.focus();
                return verticalScrollable || !this.navigateToPrevious();
            case Keys.PageDown:
                viewportElement.focus();
                return !this.navigateToNext();
            case Keys.PageUp:
                viewportElement.focus();
                return !this.navigateToPrevious();
            case Keys.Home:
                viewportElement.focus();
                return !this.navigateToFirst();
            case Keys.End:
                viewportElement.focus();
                return !this.navigateToLast();
            case "o":
            case "O":
                viewportElement.focus();
                return !this.zoomOut();
            case "i":
            case "I":
                viewportElement.focus();
                return !this.zoomIn();
            case "f":
            case "F":
                viewportElement.focus();
                return !this.toggleFitToScreen();
            case "g":
            case "G":
                pageNumberElem.focus();
                return false;
            default:
                return true;
        }
    }
}

export default Navigation;
