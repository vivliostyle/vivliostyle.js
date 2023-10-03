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

import {
  CoreViewer,
  Navigation,
  ReadyState,
  PageProgression,
  profiler,
  ZoomType,
} from "@vivliostyle/core";
import ko, { Observable, PureComputed } from "knockout";

import DocumentOptions from "../models/document-options";
import ViewerOptions from "../models/viewer-options";
import Logger from "../logging/logger";
import obs, { ReadonlyObservable } from "../utils/observable-util";

type State = {
  status: PureComputed<ReadyState>;
  pageProgression: PureComputed<PageProgression>;
  navigatable?: PureComputed<boolean>;
  fixedLayout?: Observable<boolean>;
};

type PrivateState = {
  status: ReadonlyObservable<ReadyState>;
  pageProgression: ReadonlyObservable<PageProgression>;
};

export type ViewerSettings = {
  userAgentRootURL: string;
  viewportElement: HTMLElement;
  debug: boolean;
};

class Viewer {
  private viewerOptions: ViewerOptions;
  private coreViewer: CoreViewer;
  private privState: PrivateState;

  documentOptions: null | DocumentOptions;
  epage: Observable<number>;
  epageCount: Observable<number>;
  firstPage: Observable<boolean>;
  inputUrl: Observable<string>;
  rerenderTrigger: Observable<boolean>; // just flips valye.
  state: State;
  lastPage: Observable<boolean>;
  tocVisible: Observable<boolean>;
  tocPinned: Observable<boolean>;

  constructor(viewerSettings?: ViewerSettings, viewerOptions?: ViewerOptions) {
    this.viewerOptions = viewerOptions;
    this.documentOptions = null;
    this.coreViewer = new CoreViewer(viewerSettings, viewerOptions.toObject());
    const privState1 = (this.privState = {
      status: obs.readonlyObservable(ReadyState.LOADING),
      pageProgression: obs.readonlyObservable(PageProgression.LTR),
    });
    this.state = {
      status: privState1.status.getter.extend({
        rateLimit: { timeout: 100, method: "notifyWhenChangesStop" },
        notify: "always",
      }),
      navigatable: ko.pureComputed(
        () =>
          privState1.status.value() &&
          privState1.status.value() !== ReadyState.LOADING,
      ),
      fixedLayout: ko.observable(),
      pageProgression: privState1.pageProgression.getter,
    };

    this.epage = ko.observable();
    this.epageCount = ko.observable();
    this.firstPage = ko.observable();
    this.lastPage = ko.observable();
    this.tocVisible = ko.observable();
    this.tocPinned = ko.observable();

    this.inputUrl = ko.observable("");
    this.rerenderTrigger = ko.observable(false);
    this.setupViewerEventHandler();
    this.setupViewerOptionSubscriptions();

    // for Vivliostyle CLI
    window["coreViewer"] = this.coreViewer;
  }

  setupViewerEventHandler(): void {
    const logger = Logger.getLogger();
    this.coreViewer.addListener("debug", (payload) => {
      logger.debug(payload.content);
    });
    this.coreViewer.addListener("info", (payload) => {
      logger.info(payload.content);
    });
    this.coreViewer.addListener("warn", (payload) => {
      logger.warn(payload.content);
    });
    this.coreViewer.addListener("error", (payload) => {
      logger.error(payload.content);
    });
    this.coreViewer.addListener("readystatechange", () => {
      const readyState = this.coreViewer.readyState;
      if (
        readyState === ReadyState.INTERACTIVE ||
        readyState === ReadyState.COMPLETE
      ) {
        this.privState.pageProgression.value(
          this.coreViewer.getCurrentPageProgression(),
        );
      }
      this.privState.status.value(readyState);
    });
    this.coreViewer.addListener("loaded", () => {
      if (this.viewerOptions.profile()) {
        profiler.printTimings();
      }
      this.rerenderTrigger(!this.rerenderTrigger());
    });
    let timeoutID = 0;
    this.coreViewer.addListener("nav", (payload) => {
      const { cfi, first, last, epage, epageCount, metadata, docTitle } =
        payload;
      this.rerenderTrigger(!this.rerenderTrigger());
      if (cfi) {
        if (timeoutID) {
          // Prevent SecurityError,
          // "Too many calls to Location or History APIs within a short timeframe" (Firefox)
          // "Attempt to use history.replaceState() more than 100 times per 30 seconds" (Safari)
          window.clearTimeout(timeoutID);
        }
        timeoutID = window.setTimeout(() => {
          this.documentOptions.fragment(cfi);
          timeoutID = 0;
        }, 300);
      }

      // Note that `this.epage(epage)` has to be set before `this.lastPage(last)`
      // because `this.lastPage(last)` invokes `navigation.totalPages()` that
      // calls `navigation.pageNumber()` that uses `this.epage()`.

      if (epage !== undefined) {
        this.epage(epage);
      }
      if (epageCount !== undefined) {
        this.epageCount(epageCount);
      }
      if (first !== undefined) {
        this.firstPage(first);
      }
      if (last !== undefined) {
        this.lastPage(last);
      }
      if (metadata || docTitle) {
        let title = document.title;
        const pubTitle =
          metadata?.["http://purl.org/dc/terms/title"]?.[0]?.["v"];
        if (!pubTitle) {
          title = docTitle ? docTitle : "Vivliostyle Viewer";
        } else if (
          !docTitle ||
          docTitle === pubTitle ||
          this.firstPage() ||
          /\.xhtml$/.test(docTitle)
        ) {
          // ignore ugly titles copied from *.xhtml file name
          title = pubTitle;
        } else {
          title = `${docTitle} | ${pubTitle}`;
        }
        if (title !== document.title) {
          document.title = title;
        }
        const layout =
          metadata?.["http://www.idpf.org/vocab/rendition/#layout"]?.[0]?.["v"];
        if (layout) {
          this.state.fixedLayout(layout === "pre-paginated");
        }
      }

      const tocVisibleOld = this.tocVisible();
      const tocVisibleNew = this.coreViewer.isTOCVisible();
      if (tocVisibleOld && !tocVisibleNew) {
        // When resize, TOC box will be regenerated and hidden temporarily.
        // So keep TOC toggle button status on.
      } else {
        this.tocVisible(tocVisibleNew);
      }
    });
    this.coreViewer.addListener("hyperlink", (payload) => {
      if (payload.internal) {
        window.history.pushState(null, null);
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

  setupViewerOptionSubscriptions(): void {
    ko.computed(() => {
      const viewerOptions = this.viewerOptions.toObject();
      this.coreViewer.setOptions(viewerOptions);
    }).extend({ rateLimit: 0 });
  }

  loadDocument(
    documentOptions: DocumentOptions,
    viewerOptions?: ViewerOptions,
  ): void {
    this.privState.status.value(ReadyState.LOADING);
    if (viewerOptions) {
      this.viewerOptions.copyFrom(viewerOptions);
    }
    this.documentOptions = documentOptions;

    if (documentOptions.srcUrls()) {
      if (!documentOptions.bookMode()) {
        this.coreViewer.loadDocument(
          documentOptions.srcUrls(),
          documentOptions.toObject(),
          this.viewerOptions.toObject(),
        );
      } else {
        this.coreViewer.loadPublication(
          documentOptions.srcUrls()[0],
          documentOptions.toObject(),
          this.viewerOptions.toObject(),
        );
      }
    } else {
      // No document specified, show welcome page
      this.privState.status.value(undefined);
    }
  }

  navigateToPrevious(): void {
    this.coreViewer.navigateToPage(Navigation.PREVIOUS);
  }

  navigateToNext(): void {
    this.coreViewer.navigateToPage(Navigation.NEXT);
  }

  navigateToLeft(): void {
    this.coreViewer.navigateToPage(Navigation.LEFT);
  }

  navigateToRight(): void {
    this.coreViewer.navigateToPage(Navigation.RIGHT);
  }

  navigateToFirst(): void {
    this.coreViewer.navigateToPage(Navigation.FIRST);
  }

  navigateToLast(): void {
    this.coreViewer.navigateToPage(Navigation.LAST);
  }

  navigateToEPage(epage: number): void {
    this.coreViewer.navigateToPage(Navigation.EPAGE, epage);
  }

  navigateToInternalUrl(href: string): void {
    this.coreViewer.navigateToInternalUrl(href);
  }

  navigateToPosition(position: {
    spineIndex: number;
    pageIndex?: number;
    offsetInItem?: number;
  }): void {
    this.coreViewer.navigateToPosition(position);
  }

  queryZoomFactor(type: ZoomType): number {
    return this.coreViewer.queryZoomFactor(type);
  }

  epageToPageNumber(epage: number | undefined): number {
    if (!epage && epage != 0) {
      return undefined;
    }
    const pageNumber = Math.round(epage + 1);
    return pageNumber;
  }
  epageFromPageNumber(pageNumber: number | undefined): number {
    if (!pageNumber && pageNumber != 0) {
      return undefined;
    }
    const epage = pageNumber - 1;
    return epage;
  }

  showTOC(shown?: boolean, autoHide?: boolean): void {
    if (this.coreViewer.isTOCVisible() == null) {
      // TOC is unavailable
      return;
    }
    const show = shown == null ? !this.tocVisible() : shown;
    this.tocVisible(show);
    this.tocPinned(show ? !autoHide : false);
    this.coreViewer.showTOC(show, autoHide);
  }
}

export default Viewer;
