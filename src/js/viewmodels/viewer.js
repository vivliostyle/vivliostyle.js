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
        
        this.epage = ko.observable();
        this.epageCount = ko.observable();
        this.firstPage = ko.observable();
        this.lastPage = ko.observable();
        this.tocVisible = ko.observable();
        this.tocPinned = ko.observable();

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
            const {cfi, first, last, epage, epageCount, metadata, itemTitle} = payload;
            if (cfi) {
                this.documentOptions_.fragment(cfi);
            }
            if (first !== undefined) {
                this.firstPage(first);
            }
            if (last !== undefined) {
                this.lastPage(last);
            }
            if (epage !== undefined) {
                this.epage(epage);
            }
            if (epageCount !== undefined) {
                this.epageCount(epageCount);
            }
            if (metadata || itemTitle) {
                const bookTitles = metadata && metadata["http://purl.org/dc/terms/title"];
                const bookTitle = bookTitles && bookTitles[0] && bookTitles[0]["v"];
                if (!bookTitle) {
                    document.title = itemTitle ? itemTitle : "Vivliostyle viewer";
                } else if (!itemTitle || itemTitle === bookTitle || this.firstPage() ||
                        (/\.xhtml$/).test(itemTitle)) { // ignore ugly titles copied from *.xhtml file name
                    document.title = bookTitle;
                } else {
                    document.title = `${itemTitle} | ${bookTitle}`;
                }
            }

            const tocVisibleOld = this.tocVisible();
            const tocVisibleNew = this.viewer_.isTOCVisible();
            if (tocVisibleOld && !tocVisibleNew) {
                // When resize, TOC box will be regenerated and hidden temporarily.
                // So keep TOC toggle button status on.
            } else {
                this.tocVisible(tocVisibleNew);
            }
        });
        this.viewer_.addListener("hyperlink", payload => {
            if (payload.internal) {
                this.navigateToInternalUrl(payload.href);

                // When navigate from TOC, TOC box may or may not become hidden by autohide.
                // Here set tocVisible false and it may become true again in "nav" event.
                if (this.tocVisible()) {
                    this.tocVisible(false);
                }
                
                document.getElementById("vivliostyle-viewer-viewport").focus();
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

        if (documentOptions.xUrl()) {
            this.viewer_.loadDocument(documentOptions.xUrl(), documentOptions.toObject(), this.viewerOptions_.toObject());
        } else if (documentOptions.bookUrl()) {
            this.viewer_.loadEPUB(documentOptions.bookUrl(), documentOptions.toObject(), this.viewerOptions_.toObject());
        }
    }

    navigateToPrevious() {
        this.viewer_.navigateToPage("previous");
    }

    navigateToNext() {
        this.viewer_.navigateToPage("next");
    }

    navigateToLeft() {
        this.viewer_.navigateToPage("left");
    }

    navigateToRight() {
        this.viewer_.navigateToPage("right");
    }

    navigateToFirst() {
        this.viewer_.navigateToPage("first");
    }

    navigateToLast() {
        this.viewer_.navigateToPage("last");
    }

    navigateToEPage(epage) {
        this.viewer_.navigateToPage("epage", epage);
    }

    navigateToInternalUrl(href) {
        this.viewer_.navigateToInternalUrl(href);
    }

    queryZoomFactor(type) {
        return this.viewer_.queryZoomFactor(type);
    }

    epageToPageNumber(epage) {
        if (!epage && epage != 0) {
            return undefined;
        }
        let pageNumber = Math.round(epage + 1);
        return pageNumber;
    }
    epageFromPageNumber(pageNumber) {
        if (!pageNumber && pageNumber != 0) {
            return undefined;
        }
        let epage = pageNumber - 1;
        return epage;
    }

    showTOC(opt_show, opt_autohide) {
        if (this.viewer_.isTOCVisible() == null) {
            // TOC is unavailable
            return;
        }
        const show = opt_show == null ? !this.tocVisible() : opt_show;
        this.tocVisible(show);
        this.tocPinned(show ? !opt_autohide : false);
        this.viewer_.showTOC(show, opt_autohide);
    }
}

export default Viewer;
