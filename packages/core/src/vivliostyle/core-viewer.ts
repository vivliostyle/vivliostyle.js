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
 * @fileoverview CoreViewer - Vivliostyle CoreViewer class
 */
import * as AdaptiveViewer from "./adaptive-viewer";
import * as Base from "./base";
import * as Constants from "./constants";
import * as Epub from "./epub";
import * as Profile from "./profile";
import * as Toc from "./toc";

export interface Payload {
  type: string;
  internal: boolean;
  href: string;
  content: string;
  cfi: string;
  first: boolean;
  last: boolean;
  epage: number;
  epageCount: number;
  metadata: unknown;
  docTitle: string;
}

const PageProgression = Constants.PageProgression;

/**
 * Viewer settings that must be passed to Viewer's constructor.
 * - userAgentRootURL: URL of a directory from which viewer resource files
 *   (under resources/ directory in the source repository) are served.
 * - viewportElement: An element used as the viewport of the displayed contents.
 * - window: Window object. If omitted, current `window` is used.
 * - debug: Debug flag.
 */
export type CoreViewerSettings = {
  userAgentRootURL?: string;
  viewportElement: HTMLElement;
  window?: Window;
  debug?: boolean;
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
 * - allowScripts: Allow JavaScript in documents. default: true
 * - pixelRatio: Set output pixel ratio. Enables very thin border width and
 *   improves layout precision, emulating high pixel ratio.
 *   default: 8. Set 0 to disable pixel ratio emulation.
 */
export type CoreViewerOptions = {
  autoResize?: boolean;
  fontSize?: number;
  pageBorderWidth?: number;
  renderAllPages?: boolean;
  pageViewMode?: AdaptiveViewer.PageViewMode;
  zoom?: number;
  fitToScreen?: boolean;
  defaultPaperSize?: { width: number; height: number };
  allowScripts?: boolean;
  pixelRatio?: number;
};

function getDefaultViewerOptions(): CoreViewerOptions {
  return {
    autoResize: true,
    fontSize: 16,
    pageBorderWidth: 1,
    renderAllPages: true,
    pageViewMode: AdaptiveViewer.PageViewMode.AUTO_SPREAD,
    zoom: 1,
    fitToScreen: false,
    defaultPaperSize: undefined,
    allowScripts: true,
    pixelRatio: 8,
  };
}

function convertViewerOptions(options: CoreViewerOptions): object {
  const converted = {};
  Object.keys(options).forEach((key) => {
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
  documentObject?: Document;
  fragment?: string;
  authorStyleSheet?: { url?: string; text?: string }[];
  userStyleSheet?: { url?: string; text?: string }[];
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
      startPage?: number;
      skipPagesBefore?: number;
    };

/**
 * Vivliostyle Viewer class.
 */
export class CoreViewer {
  private initialized: boolean = false;
  private adaptViewer_: AdaptiveViewer.AdaptiveViewer;
  private options: CoreViewerOptions;
  private eventTarget: Base.SimpleEventTarget;
  readyState: Constants.ReadyState;

  constructor(
    private readonly settings: CoreViewerSettings,
    opt_options?: CoreViewerOptions,
  ) {
    Constants.setDebug(settings.debug);
    this.adaptViewer_ = new AdaptiveViewer.AdaptiveViewer(
      settings["window"] || window,
      settings["viewportElement"],
      "main",
      this.dispatcher.bind(this),
    );
    this.options = getDefaultViewerOptions();
    if (opt_options) {
      this.setOptions(opt_options);
    }
    this.eventTarget = new Base.SimpleEventTarget();
    Object.defineProperty(this, "readyState", {
      get() {
        return this.adaptViewer_.readyState;
      },
    });
  }

  /**
   * Set ViewerOptions to the viewer.
   */
  setOptions(options: CoreViewerOptions) {
    const command = Object.assign(
      { a: "configure" },
      convertViewerOptions(options),
    );
    this.adaptViewer_.sendCommand(command);
    Object.assign(this.options, options);
  }

  private dispatcher(msg: Base.JSON) {
    /** @dict */
    const event = { type: msg["t"] };
    const o = msg as object;
    Object.keys(o).forEach((key) => {
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
  addListener(type: string, listener: (payload: Payload) => void) {
    this.eventTarget.addEventListener(
      type,
      listener as Base.EventListener,
      false,
    );
  }

  /**
   * Remove an event listener.
   * @param type Event type.
   * @param listener Listener function.
   */
  removeListener(type: string, listener: (payload: Payload) => void) {
    this.eventTarget.removeEventListener(
      type,
      listener as Base.EventListener,
      false,
    );
  }

  /**
   * Load an HTML or XML document(s).
   */
  loadDocument(
    singleDocumentOptions: SingleDocumentOptions | SingleDocumentOptions[],
    opt_documentOptions?: DocumentOptions,
    opt_viewerOptions?: CoreViewerOptions,
  ) {
    if (!singleDocumentOptions) {
      this.eventTarget.dispatchEvent({
        type: "error",
        content: "No URL specified",
      });
    }
    this.loadDocumentOrPublication(
      singleDocumentOptions,
      null,
      opt_documentOptions,
      opt_viewerOptions,
    );
  }

  /**
   * Load an EPUB/WebPub publication.
   */
  loadPublication(
    pubUrl: string,
    opt_documentOptions?: DocumentOptions,
    opt_viewerOptions?: CoreViewerOptions,
  ) {
    if (!pubUrl) {
      this.eventTarget.dispatchEvent({
        type: "error",
        content: "No URL specified",
      });
    }
    this.loadDocumentOrPublication(
      null,
      pubUrl,
      opt_documentOptions,
      opt_viewerOptions,
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
    opt_viewerOptions?: CoreViewerOptions,
  ) {
    const documentOptions = opt_documentOptions || {};

    function convertStyleSheetArray(arr) {
      if (arr) {
        return arr.map((s) => ({ url: s.url || null, text: s.text || null }));
      } else {
        return undefined;
      }
    }
    const authorStyleSheet = convertStyleSheetArray(
      documentOptions["authorStyleSheet"],
    );
    const userStyleSheet = convertStyleSheetArray(
      documentOptions["userStyleSheet"],
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
        userStyleSheet: userStyleSheet,
      },
      convertViewerOptions(this.options),
    );
    if (this.initialized) {
      this.adaptViewer_.sendCommand(command);
    } else {
      this.initialized = true;
      this.adaptViewer_.initEmbed(command);
    }
  }

  /**
   * Returns the current page progression of the viewer. If no document is
   * loaded, returns null.
   */
  getCurrentPageProgression(): Constants.PageProgression | null {
    return this.adaptViewer_.getCurrentPageProgression();
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
      this.adaptViewer_.sendCommand({
        a: "moveTo",
        epage: opt_epage,
      });
    } else {
      this.adaptViewer_.sendCommand({
        a: "moveTo",
        where: this.resolveNavigation(nav),
      });
    }
  }

  /**
   * Navigate to the specified internal URL.
   */
  navigateToInternalUrl(url: string) {
    this.adaptViewer_.sendCommand({ a: "moveTo", url: url });
  }

  /**
   * @returns True if TOC is visible, false if hidden, null if TOC is unavailable
   */
  isTOCVisible(): boolean | null {
    if (
      this.adaptViewer_.opfView &&
      this.adaptViewer_.opfView.opf &&
      (this.adaptViewer_.opfView.opf.xhtmlToc ||
        this.adaptViewer_.opfView.opf.ncxToc)
    ) {
      return !!this.adaptViewer_.opfView.isTOCVisible();
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
    this.adaptViewer_.sendCommand({
      a: "toc",
      v: visibility,
      autohide: opt_autohide,
    });
  }

  /**
   * Returns zoom factor corresponding to the specified zoom type.
   */
  queryZoomFactor(type: AdaptiveViewer.ZoomType): number {
    return this.adaptViewer_.queryZoomFactor(type);
  }

  getPageSizes(): { width: number; height: number }[] {
    return this.adaptViewer_.pageSizes;
  }

  /**
   * Returns the current structure of the TOC once it has
   * been shown, or the empty array if there is no TOC.
   */
  getTOC(): Toc.TOCItem[] {
    return this.adaptViewer_.opfView?.tocView?.getTOC();
  }

  /**
   * Returns metadata for the publication. Metadata is
   * organized as an object of fully-qualified IRI properties
   * containing arrays of metadata entries. The first element
   * in the array is primary and should be used by default. Other
   * entries may overload or refine that metadata.
   */
  getMetadata(): Epub.Meta {
    return this.adaptViewer_.opf.getMetadata();
  }

  /**
   * Returns the cover for an EPUB publication, if specified.
   */
  getCover(): Epub.OPFItem | null {
    return this.adaptViewer_.opf.cover;
  }
}

function convertSingleDocumentOptions(
  singleDocumentOptions: SingleDocumentOptions | SingleDocumentOptions[],
): AdaptiveViewer.SingleDocumentParam[] | null {
  function toNumberOrNull(num: any): number | null {
    return typeof num === "number" ? num : null;
  }

  function convert(opt) {
    if (typeof opt === "string") {
      return {
        url: opt,
        startPage: null,
        skipPagesBefore: null,
      } as AdaptiveViewer.SingleDocumentParam;
    } else {
      return {
        url: opt["url"],
        startPage: toNumberOrNull(opt["startPage"]),
        skipPagesBefore: toNumberOrNull(opt["skipPagesBefore"]),
      } as AdaptiveViewer.SingleDocumentParam;
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
  EPAGE = "epage",
}

export type ZoomType = AdaptiveViewer.ZoomType;
export const ZoomType = AdaptiveViewer.ZoomType; // eslint-disable-line no-redeclare

export type PageViewMode = AdaptiveViewer.PageViewMode;
export const PageViewMode = AdaptiveViewer.PageViewMode; // eslint-disable-line no-redeclare

Profile.profiler.forceRegisterEndTiming("load_vivliostyle");
