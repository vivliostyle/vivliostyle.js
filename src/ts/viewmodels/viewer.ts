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

import ko, { Observable, PureComputed } from "knockout";
import { Viewer as VivliostyleViewer } from "vivliostyle";
import obs, { ReadonlyObservable } from "../utils/observable-util";
import Logger from "../logging/logger";
import DocumentOptions from "../models/document-options";
import ViewerOptions from "../models/viewer-options";
import vivliostyle from "../models/vivliostyle";

type State = {
    status: PureComputed<unknown>;
    pageProgression: PureComputed<unknown>;
    navigatable?: PureComputed<boolean>;
};

type PrivateState = {
    status: ReadonlyObservable<unknown>;
    pageProgression: ReadonlyObservable<unknown>;
};

export type ViewerSettings = {
    userAgentRootURL: string;
    viewportElement: HTMLElement;
    debug: boolean;
};

class Viewer {
    private viewerOptions_: ViewerOptions;
    private viewer_: VivliostyleViewer;
    private state_: PrivateState;

    // FIXME: In used in viewmodels/navigation. This property is desirable private access.
    documentOptions_: null | DocumentOptions;

    epage: Observable<unknown>;
    epageCount: Observable<number>;
    firstPage: Observable<boolean>;
    inputUrl: Observable<string>;
    state: State;
    lastPage: Observable<boolean>;
    tocVisible: Observable<boolean>;
    tocPinned: Observable<unknown>;

    constructor(viewerSettings?: ViewerSettings, viewerOptions?: ViewerOptions) {
        this.viewerOptions_ = viewerOptions;
        this.documentOptions_ = null;
        this.viewer_ = new vivliostyle.viewer.Viewer(viewerSettings, viewerOptions.toObject());
        const state_ = (this.state_ = {
            status: obs.readonlyObservable(vivliostyle.constants.ReadyState.LOADING),
            pageProgression: obs.readonlyObservable(vivliostyle.constants.PageProgression.LTR)
        });
        this.state = {
            status: state_.status.getter.extend({
                rateLimit: { timeout: 100, method: "notifyWhenChangesStop" },
                notify: "always"
            }),
            navigatable: ko.pureComputed(() => state_.status.value() && state_.status.value() !== vivliostyle.constants.ReadyState.LOADING),
            pageProgression: state_.pageProgression.getter
        };

        this.epage = ko.observable();
        this.epageCount = ko.observable();
        this.firstPage = ko.observable();
        this.lastPage = ko.observable();
        this.tocVisible = ko.observable();
        this.tocPinned = ko.observable();

        this.inputUrl = ko.observable("");

        this.setupViewerEventHandler();
        this.setupViewerOptionSubscriptions();
    }

    setupViewerEventHandler() {
        const logger = Logger.getLogger();
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
            const { cfi, first, last, epage, epageCount, metadata, docTitle } = payload;
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
            if (metadata || docTitle) {
                const pubTitles = metadata && metadata["http://purl.org/dc/terms/title"];
                const pubTitle = pubTitles && pubTitles[0] && pubTitles[0]["v"];
                if (!pubTitle) {
                    document.title = docTitle ? docTitle : "Vivliostyle Viewer";
                } else if (!docTitle || docTitle === pubTitle || this.firstPage() || /\.xhtml$/.test(docTitle)) {
                    // ignore ugly titles copied from *.xhtml file name
                    document.title = pubTitle;
                } else {
                    document.title = `${docTitle} | ${pubTitle}`;
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
        }, this).extend({ rateLimit: 0 });
    }

    loadDocument(documentOptions: DocumentOptions, viewerOptions: ViewerOptions) {
        this.state_.status.value(vivliostyle.constants.ReadyState.LOADING);
        if (viewerOptions) {
            this.viewerOptions_.copyFrom(viewerOptions);
        }
        this.documentOptions_ = documentOptions;

        if (documentOptions.xUrl()) {
            this.viewer_.loadDocument(documentOptions.xUrl(), documentOptions.toObject(), this.viewerOptions_.toObject());
        } else if (documentOptions.bookUrl()) {
            if (this.viewer_.loadPublication)
                // new name
                this.viewer_.loadPublication(documentOptions.bookUrl(), documentOptions.toObject(), this.viewerOptions_.toObject());
            // old name
            else this.viewer_.loadEPUB(documentOptions.bookUrl(), documentOptions.toObject(), this.viewerOptions_.toObject());
        } else {
            // No document specified, show welcome page
            this.state_.status.value("");
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
        const pageNumber = Math.round(epage + 1);
        return pageNumber;
    }
    epageFromPageNumber(pageNumber) {
        if (!pageNumber && pageNumber != 0) {
            return undefined;
        }
        const epage = pageNumber - 1;
        return epage;
    }

    showTOC(shown?: boolean, autoHide?: boolean) {
        if (this.viewer_.isTOCVisible() == null) {
            // TOC is unavailable
            return;
        }
        const show = shown == null ? !this.tocVisible() : shown;
        this.tocVisible(show);
        this.tocPinned(show ? !autoHide : false);
        this.viewer_.showTOC(show, autoHide);
    }
}

export default Viewer;
