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
import obs from "../utils/observable-util";
import Logger from "../logging/logger";
import vivliostyle from "../models/vivliostyle";

class Viewer {
    constructor(viewerSettings, viewerOptions) {
        this.viewerOptions_ = viewerOptions;
        this.documentOptions_ = null;
        this.viewer_ = new vivliostyle.viewer.Viewer(viewerSettings, viewerOptions.toObject());
        const state_ = this.state_= {
            status: obs.readonlyObservable(vivliostyle.constants.ReadyState.LOADING),
            pageProgression: obs.readonlyObservable(vivliostyle.constants.PageProgression.LTR)
        };
        this.state = {
            status: state_.status.getter.extend({
                rateLimit: { timeout: 100, method: "notifyWhenChangesStop" },
                notify: 'always'
            }),
            navigatable: ko.pureComputed(() => state_.status.value() !== vivliostyle.constants.ReadyState.LOADING),
            pageProgression: state_.pageProgression.getter
        };

        this.setupViewerEventHandler();
        this.setupViewerOptionSubscriptions();
    }

    setupViewerEventHandler() {
        const logger = Logger.getLogger();
        let intervalID = 0;
        this.viewer_.addListener("debug", payload => {
            logger.debug(payload.content);
        });
        this.viewer_.addListener("info", payload => {
            logger.info(payload.content);
        });
        this.viewer_.addListener("warn", payload => {
            logger.warn(payload.content);
        });
        this.viewer_.addListener("error", payload => {
            logger.error(payload.content);
        });
        this.viewer_.addListener("readystatechange", () => {
            const readyState = this.viewer_.readyState;
            if (intervalID === 0 && readyState === vivliostyle.constants.ReadyState.INTERACTIVE) {
                intervalID = setInterval(() => {
                    this.state_.status.value(vivliostyle.constants.ReadyState.LOADING);
                    this.state_.status.value(vivliostyle.constants.ReadyState.INTERACTIVE);
                }, 200);
            } else {
                clearInterval(intervalID);
                intervalID = 0;
            }
            if (readyState === vivliostyle.constants.ReadyState.INTERACTIVE || readyState === vivliostyle.constants.ReadyState.COMPLETE) {
                this.state_.pageProgression.value(this.viewer_.getCurrentPageProgression());
            }
            this.state_.status.value(readyState);
        });
        this.viewer_.addListener("loaded", () => {
            if (this.viewerOptions_.profile()) {
                vivliostyle.profile.profiler.printTimings();
            }
        });
        this.viewer_.addListener("nav", payload => {
            const cfi = payload.cfi;
            if (cfi) {
                this.documentOptions_.fragment(cfi);
            }
        });
        this.viewer_.addListener("hyperlink", payload => {
            if (payload.internal) {
                this.navigateToInternalUrl(payload.href);
            } else {
                window.location.href = payload.href;
            }
        });
    }

    setupViewerOptionSubscriptions() {
        ko.computed(function() {
            const viewerOptions = this.viewerOptions_.toObject();
            this.viewer_.setOptions(viewerOptions);
        }, this).extend({rateLimit: 0});
    }

    loadDocument(documentOptions, viewerOptions) {
        this.state_.status.value("loading");
        if (viewerOptions) {
            this.viewerOptions_.copyFrom(viewerOptions);
        }
        this.documentOptions_ = documentOptions;
        if (documentOptions.url()) {
            this.viewer_.loadDocument(documentOptions.url(), documentOptions.toObject(), this.viewerOptions_.toObject());
        } else if (documentOptions.epubUrl()) {
            this.viewer_.loadEPUB(documentOptions.epubUrl(), documentOptions.toObject(), this.viewerOptions_.toObject());
        }
    }

    afterNavigateToPage() {
        setTimeout(() => {
            // Update page navigation disable/enable
            this.state_.status.value(vivliostyle.constants.ReadyState.LOADING);
            this.state_.status.value(this.viewer_.readyState);
            const pageNumberElem = document.getElementById('vivliostyle-page-number');
            pageNumberElem.value = this.getPageNumber();
        }, 1);
    }

    getSpreadContainerElement() {
        const viewportElement = document.getElementById("vivliostyle-viewer-viewport");
        const outerZoomBoxElement = viewportElement && viewportElement.firstElementChild;
        return outerZoomBoxElement && outerZoomBoxElement.firstElementChild;
    }

    getTotalPages() {
        const spreadContainerElement = this.getSpreadContainerElement();
        if (!spreadContainerElement) {
            return 0;
        }
        return spreadContainerElement.childElementCount;
    }

    getPageNumber() {
        const spreadContainerElement = this.getSpreadContainerElement();
        if (!spreadContainerElement) {
            return 0;
        }
        const children = spreadContainerElement.children;
        let pageNumber = 0;
        for (let i = 0; i < children.length; i++) {
            if (children.item(i).style.display !== 'none') {
                pageNumber = i + 1;
                break;
            }
        }
        return pageNumber;
    }

    navigateToPrevious() {
        this.viewer_.navigateToPage("previous");
        this.afterNavigateToPage();
    }

    navigateToNext() {
        this.viewer_.navigateToPage("next");
        this.afterNavigateToPage();
    }

    navigateToLeft() {
        this.viewer_.navigateToPage("left");
        this.afterNavigateToPage();
    }

    navigateToRight() {
        this.viewer_.navigateToPage("right");
        this.afterNavigateToPage();
    }

    navigateToFirst() {
        this.viewer_.navigateToPage("first");
        this.afterNavigateToPage();
    }

    navigateToLast() {
        this.viewer_.navigateToPage("last");
        this.afterNavigateToPage();
    }

    navigateToNthPage(nthPage) {
        this.viewer_.navigateToNthPage(nthPage);
        this.afterNavigateToPage();
    }

    navigateToInternalUrl(href) {
        this.viewer_.navigateToInternalUrl(href);
        this.afterNavigateToPage();
    }

    queryZoomFactor(type) {
        return this.viewer_.queryZoomFactor(type);
    }
}

export default Viewer;
