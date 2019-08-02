/**
 * Copyright 2015 Trim-marks Inc.
 * Copyright 2018 Vivliostyle Foundation
 *
 * Vivliostyle.js is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle.js is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle.js.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @fileoverview Viewer - Vivliostyle Viewer class
 */
import * as AdaptViewer from "../adapt/adaptviewer";
import * as Base from "../adapt/base";
import * as Constants from "./constants";
import * as Profile from "./profile";

const PageProgression = Constants.PageProgression;

/**
 * Viewer settings that must be passed to Viewer's constructor.
 * - userAgentRootURL: URL of a directory from which viewer resource files
 *   (under resources/ directory in the source repository) are served.
 * - viewportElement: An element used as the viewport of the displayed contents.
 * - window: Window object. If omitted, current `window` is used.
 * - debug: Debug flag.
 */
export type ViewerSettings = {
  userAgentRootURL: string;
  viewportElement: HTMLElement;
  window: Window | undefined;
  debug: boolean;
};

/**
 * Viewer options that can be set after the Viewer object is constructed.
 * - autoResize: Run layout again when the window is resized. default: true
 * - fontSize: Default font size (px). default: 16
 * - pageBorderWidth: Width of a border between two pages in a single
 *   spread (px). Effective only in spread view mode. default: 1
 * - renderAllPages: Render all pages at the document load time. default: true
 * - pageViewMode: Page view mode (singlePage / spread / autoSpread).
 *   default: singlePage
 * - zoom: Zoom factor with which pages are displayed. default: 1
 * - fitToScreen: Auto adjust zoom factor to fit the screen. default: false
 * - defaultPaperSize: Default paper size in px. Effective when `@page` size
 *   is set to auto. default: undefined (means the windows size is used as
 *   paper size).
 */
export type ViewerOptions = {
  autoResize: boolean | undefined;
  fontSize: number | undefined;
  pageBorderWidth: number | undefined;
  renderAllPages: boolean | undefined;
  pageViewMode: PageViewMode | undefined;
  zoom: number | undefined;
  fitToScreen: boolean | undefined;
  defaultPaperSize: { width: number; height: number } | undefined;
};

function getDefaultViewerOptions(): ViewerOptions {
  return {
    autoResize: true,
    fontSize: 16,
    pageBorderWidth: 1,
    renderAllPages: true,
    pageViewMode: PageViewMode.AUTO_SPREAD,
    zoom: 1,
    fitToScreen: false,
    defaultPaperSize: undefined
  };
}

function convertViewerOptions(options: ViewerOptions): object {
  const converted = {};
  Object.keys(options).forEach(key => {
    const v = options[key];
    switch (key) {
      case "autoResize":
        converted["autoresize"] = v;
        break;
      case "pageBorderWidth":
        converted["pageBorder"] = v;
        break;
      default:
        converted[key] = v;
    }
  });
  return converted;
}

/**
 * Options for the displayed document.
 * - documentObject: Document object for the document. If provided, it is used
 *   directly without parsing the source again.
 * - fragment: Fragmentation identifier (EPUB CFI) of the location in the
 *   document which is to be displayed.
 * - authorStyleSheet: An array of author style sheets to be injected after all
 *   author style sheets referenced from the document. A single stylesheet may
 *   be a URL of the style sheet or a text content of the style sheet.
 * - userStyleSheet: An array of user style sheets to be injected.
 *   A single stylesheet may be a URL of the style sheet or a text content of
 *   the style sheet.
 */
export type DocumentOptions = {
  documentObject: Document | undefined;
  fragment: string | undefined;
  authorStyleSheet:
    | { url: string | undefined; text: string | undefined }[]
    | undefined;
  userStyleSheet:
    | { url: string | undefined; text: string | undefined }[]
    | undefined;
};

/**
 * Options for a single source document.
 * - url: URL of the document.
 * - startPage: If specified, the `page` page-based counter is set to the
 *   specified value on the first page of the document. It is equivalent to
 *   specifying `counter-reset: page [specified value - 1]` on that page.
 * - skipPagesBefore: If specified, the `page` page-based counter is
 *   incremented by the specified value *before* updating page-based counters
 *   on the first page of the document.
 *   This option is ignored if `startPageNumber` option is also specified.
 */
export type SingleDocumentOptions =
  | string
  | {
      url: string;
      startPage: number | undefined;
      skipPagesBefore: number | undefined;
    };

/**
 * Vivliostyle Viewer class.
 */
export class Viewer {
  private initialized: boolean = false;
  private viewer_: AdaptViewer.Viewer;
  private options: ViewerOptions;
  private eventTarget: Base.SimpleEventTarget;

  constructor(
    private readonly settings: ViewerSettings,
    opt_options?: ViewerOptions
  ) {
    Constants.setDebug(settings.debug);
    this.viewer_ = new AdaptViewer.Viewer(
      settings["window"] || window,
      settings["viewportElement"],
      "main",
      this.dispatcher.bind(this)
    );
    this.options = getDefaultViewerOptions();
    if (opt_options) {
      this.setOptions(opt_options);
    }
    this.eventTarget = new Base.SimpleEventTarget();
    Object.defineProperty(this, "readyState", {
      get() {
        return this.viewer_.readyState;
      }
    });
  }

  /**
   * Set ViewerOptions to the viewer.
   */
  setOptions(options: ViewerOptions) {
    const command = Object.assign(
      { a: "configure" },
      convertViewerOptions(options)
    );
    this.viewer_.sendCommand(command);
    Object.assign(this.options, options);
  }

  private dispatcher(msg: Base.JSON) {
    /** @dict */
    const event = { type: msg["t"] };
    const o = msg as object;
    Object.keys(o).forEach(key => {
      if (key !== "t") {
        event[key] = o[key];
      }
    });
    this.eventTarget.dispatchEvent(event);
  }

  /**
   * Add a listener function, which is invoked when the specified type of event
   * is dispatched.
   * @param type Event type.
   * @param listener Listener function.
   */
  addListener(type: string, listener: (p1: { type: string }) => void) {
    this.eventTarget.addEventListener(
      type,
      listener as Base.EventListener,
      false
    );
  }

  /**
   * Remove an event listener.
   * @param type Event type.
   * @param listener Listener function.
   */
  removeListener(type: string, listener: (p1: { type: string }) => void) {
    this.eventTarget.removeEventListener(
      type,
      listener as Base.EventListener,
      false
    );
  }

  /**
   * Load an HTML or XML document(s).
   */
  loadDocument(
    singleDocumentOptions: SingleDocumentOptions | SingleDocumentOptions[],
    opt_documentOptions?: DocumentOptions,
    opt_viewerOptions?: ViewerOptions
  ) {
    if (!singleDocumentOptions) {
      this.eventTarget.dispatchEvent({
        type: "error",
        content: "No URL specified"
      });
    }
    this.loadDocumentOrPublication(
      singleDocumentOptions,
      null,
      opt_documentOptions,
      opt_viewerOptions
    );
  }

  /**
   * Load an EPUB/WebPub publication.
   */
  loadPublication(
    pubUrl: string,
    opt_documentOptions?: DocumentOptions,
    opt_viewerOptions?: ViewerOptions
  ) {
    if (!pubUrl) {
      this.eventTarget.dispatchEvent({
        type: "error",
        content: "No URL specified"
      });
    }
    this.loadDocumentOrPublication(
      null,
      pubUrl,
      opt_documentOptions,
      opt_viewerOptions
    );
  }

  /**
   * Load an HTML or XML document, or an EPUB/WebPub publication.
   */
  private loadDocumentOrPublication(
    singleDocumentOptions:
      | SingleDocumentOptions
      | SingleDocumentOptions[]
      | null,
    pubUrl: string | null,
    opt_documentOptions?: DocumentOptions,
    opt_viewerOptions?: ViewerOptions
  ) {
    const documentOptions = opt_documentOptions || {};

    function convertStyleSheetArray(arr) {
      if (arr) {
        return arr.map(s => ({ url: s.url || null, text: s.text || null }));
      } else {
        return undefined;
      }
    }
    const authorStyleSheet = convertStyleSheetArray(
      documentOptions["authorStyleSheet"]
    );
    const userStyleSheet = convertStyleSheetArray(
      documentOptions["userStyleSheet"]
    );
    if (opt_viewerOptions) {
      Object.assign(this.options, opt_viewerOptions);
    }
    const command = Object.assign(
      {
        a: singleDocumentOptions ? "loadXML" : "loadPublication",
        userAgentRootURL: this.settings["userAgentRootURL"],
        url: convertSingleDocumentOptions(singleDocumentOptions) || pubUrl,
        document: documentOptions["documentObject"],
        fragment: documentOptions["fragment"],
        authorStyleSheet: authorStyleSheet,
        userStyleSheet: userStyleSheet
      },
      convertViewerOptions(this.options)
    );
    if (this.initialized) {
      this.viewer_.sendCommand(command);
    } else {
      this.initialized = true;
      this.viewer_.initEmbed(command);
    }
  }

  /**
   * Returns the current page progression of the viewer. If no document is
   * loaded, returns null.
   */
  getCurrentPageProgression(): Constants.PageProgression | null {
    return this.viewer_.getCurrentPageProgression();
  }

  private resolveNavigation(nav: Navigation): Navigation {
    switch (nav) {
      case Navigation.LEFT:
        return this.getCurrentPageProgression() === PageProgression.LTR
          ? Navigation.PREVIOUS
          : Navigation.NEXT;
      case Navigation.RIGHT:
        return this.getCurrentPageProgression() === PageProgression.LTR
          ? Navigation.NEXT
          : Navigation.PREVIOUS;
      default:
        return nav;
    }
  }

  /**
   * Navigate to the specified page.
   */
  navigateToPage(nav: Navigation, opt_epage?: number) {
    if (nav === Navigation.EPAGE) {
      this.viewer_.sendCommand({
        a: "moveTo",
        epage: opt_epage
      });
    } else {
      this.viewer_.sendCommand({
        a: "moveTo",
        where: this.resolveNavigation(nav)
      });
    }
  }

  /**
   * Navigate to the specified internal URL.
   */
  navigateToInternalUrl(url: string) {
    this.viewer_.sendCommand({ a: "moveTo", url: url });
  }

  /**
   * @returns True if TOC is visible, false if hidden, null if TOC is unavailable
   */
  isTOCVisible(): boolean | null {
    if (
      this.viewer_.opfView &&
      this.viewer_.opfView.opf &&
      (this.viewer_.opfView.opf.xhtmlToc || this.viewer_.opfView.opf.ncxToc)
    ) {
      return !!this.viewer_.opfView.isTOCVisible();
    } else {
      return null;
    }
  }

  /**
   * Show or hide TOC box
   * @param opt_autohide If true, automatically hide when click TOC item
   * @param opt_show If true show TOC, false hide TOC. If null or undefined toggle TOC.
   */
  showTOC(opt_show?: boolean | null, opt_autohide?: boolean) {
    const visibility = opt_show == null ? "toggle" : opt_show ? "show" : "hide";
    this.viewer_.sendCommand({
      a: "toc",
      v: visibility,
      autohide: opt_autohide
    });
  }

  /**
   * Returns zoom factor corresponding to the specified zoom type.
   */
  queryZoomFactor(type: ZoomType): number {
    return this.viewer_.queryZoomFactor(type);
  }

  getPageSizes(): { width: number; height: number }[] {
    return this.viewer_.pageSizes;
  }
}

function convertSingleDocumentOptions(
  singleDocumentOptions: SingleDocumentOptions | SingleDocumentOptions[]
): AdaptViewer.SingleDocumentParam[] | null {
  function toNumberOrNull(num: any): number | null {
    return typeof num === "number" ? num : null;
  }

  function convert(opt) {
    if (typeof opt === "string") {
      return {
        url: opt,
        startPage: null,
        skipPagesBefore: null
      } as AdaptViewer.SingleDocumentParam;
    } else {
      return {
        url: opt["url"],
        startPage: toNumberOrNull(opt["startPage"]),
        skipPagesBefore: toNumberOrNull(opt["skipPagesBefore"])
      } as AdaptViewer.SingleDocumentParam;
    }
  }
  if (Array.isArray(singleDocumentOptions)) {
    return singleDocumentOptions.map(convert);
  } else if (singleDocumentOptions) {
    return [convert(singleDocumentOptions)];
  } else {
    return null;
  }
}

/**
 * @enum {string}
 */
export enum Navigation {
  PREVIOUS = "previous",
  NEXT = "next",
  LEFT = "left",
  RIGHT = "right",
  FIRST = "first",
  LAST = "last",
  EPAGE = "epage"
}

export type ZoomType = AdaptViewer.ZoomType;
export const ZoomType = AdaptViewer.ZoomType;

export type PageViewMode = AdaptViewer.PageViewMode;
export const PageViewMode = AdaptViewer.PageViewMode;

export const viewer = {
  Viewer,
  PageViewMode,
  ZoomType
};

Profile.profiler.forceRegisterEndTiming("load_vivliostyle");
