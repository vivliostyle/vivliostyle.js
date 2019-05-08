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
 * @fileoverview Vivliostyle Viewer class
 */
import {profile} from './profile';
import * as constants from './constants';
import * as base from '../adapt/base';
import * as adaptviewer from '../adapt/viewer';

export namespace viewer {

const PageProgression = constants.PageProgression;

/**
 * Viewer settings that must be passed to Viewer's constructor.
 * - userAgentRootURL: URL of a directory from which viewer resource files (under resources/ directory in the source repository) are served.
 * - viewportElement: An element used as the viewport of the displayed contents.
 * - window: Window object. If omitted, current `window` is used.
 * - debug: Debug flag.
 */
export type ViewerSettings = {
  userAgentRootURL: string,
  viewportElement: HTMLElement,
  window: Window|undefined,
  debug: boolean
};

/**
 * Viewer options that can be set after the Viewer object is constructed.
 * - autoResize: Run layout again when the window is resized. default: true
 * - fontSize: Default font size (px). default: 16
 * - pageBorderWidth: Width of a border between two pages in a single spread (px). Effective only in spread view mode. default: 1
 * - renderAllPages: Render all pages at the document load time. default: true
 * - pageViewMode: Page view mode (singlePage / spread / autoSpread). default: singlePage
 * - zoom: Zoom factor with which pages are displayed. default: 1
 * - fitToScreen: Auto adjust zoom factor to fit the screen. default: false
 * - defaultPaperSize: Default paper size in px. Effective when @page size is set to auto. default: undefined (means the windows size is used as paper size).
 */
export type ViewerOptions = {
  autoResize: boolean|undefined,
  fontSize: number|undefined,
  pageBorderWidth: number|undefined,
  renderAllPages: boolean|undefined,
  pageViewMode: viewer.PageViewMode|undefined,
  zoom: number|undefined,
  fitToScreen: boolean|undefined,
  defaultPaperSize: {width: number, height: number}|undefined
};

function getDefaultViewerOptions(): ViewerOptions {
  return {
    'autoResize': true,
    'fontSize': 16,
    'pageBorderWidth': 1,
    'renderAllPages': true,
    'pageViewMode': PageViewMode.AUTO_SPREAD,
    'zoom': 1,
    'fitToScreen': false,
    'defaultPaperSize': undefined
  };
}

function convertViewerOptions(options: ViewerOptions): Object {
  const converted = {};
  Object.keys(options).forEach((key) => {
    const v = options[key];
    switch (key) {
      case 'autoResize':
        converted['autoresize'] = v;
        break;
      case 'pageBorderWidth':
        converted['pageBorder'] = v;
        break;
      default:
        converted[key] = v;
    }
  });
  return converted;
}

/**
 * Options for the displayed document.
 * - documentObject: Document object for the document. If provided, it is used directly without parsing the source again.
 * - fragment: Fragmentation identifier (EPUB CFI) of the location in the document which is to be displayed.
 * - authorStyleSheet: An array of author style sheets to be injected after all author style sheets referenced from the document. A single stylesheet may be a URL of the style sheet or a text content of the style sheet.
 * - userStyleSheet: An array of user style sheets to be injected. A single stylesheet may be a URL of the style sheet or a text content of the style sheet.
 */
export type DocumentOptions = {
  documentObject: Document|undefined,
  fragment: string|undefined,
  authorStyleSheet: {url: string|undefined, text: string|undefined}[]|undefined,
  userStyleSheet: {url: string|undefined, text: string|undefined}[]|undefined
};

/**
 * Options for a single source document.
 * - url: URL of the document.
 * - startPage: If specified, the `page` page-based counter is set to the specified value on the first page of the document. It is equivalent to specifying `counter-reset: page [specified value - 1]` on that page.
 * - skipPagesBefore: If specified, the `page` page-based counter is incremented by the specified value *before* updating page-based counters on the first page of the document. This option is ignored if `startPageNumber` option is also specified.
 */
export type SingleDocumentOptions = string|{
  url: string,
  startPage: number | undefined,
  skipPagesBefore: number | undefined
};

/**
 * Vivliostyle Viewer class.
 */
export class Viewer {
  private initialized: boolean = false;
  private adaptViewer: any;
  private options: ViewerOptions;
  private eventTarget: any;

  constructor(
      private readonly settings: ViewerSettings, opt_options?: ViewerOptions) {
    constants.setDebug(settings.debug);
    this.adaptViewer = new adaptviewer.Viewer(
        settings['window'] || window, settings['viewportElement'], 'main',
        this.dispatcher.bind(this));
    this.options = getDefaultViewerOptions();
    if (opt_options) {
      this.setOptions(opt_options);
    }
    this.eventTarget = new base.SimpleEventTarget();
    Object.defineProperty(this, 'readyState', {
      get() {
        return this.adaptViewer.readyState;
      }
    });
  }

  /**
   * Set ViewerOptions to the viewer.
   */
  setOptions(options: ViewerOptions) {
    const command =
        Object.assign({'a': 'configure'}, convertViewerOptions(options));
    this.adaptViewer.sendCommand(command);
    Object.assign(this.options, options);
  }

  private dispatcher(msg: base.JSON) {
    /** @dict */
    const event = {'type': msg['t']};
    const o = (msg as Object);
    Object.keys(o).forEach((key) => {
      if (key !== 't') {
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
  addListener(type: string, listener: (p1: {type: string}) => void) {
    this.eventTarget.addEventListener(
        type, (listener as base.EventListener), false);
  }

  /**
   * Remove an event listener.
   * @param type Event type.
   * @param listener Listener function.
   */
  removeListener(type: string, listener: (p1: {type: string}) => void) {
    this.eventTarget.removeEventListener(
        type, (listener as base.EventListener), false);
  }

  /**
   * Load an HTML or XML document(s).
   */
  loadDocument(
      singleDocumentOptions: SingleDocumentOptions|SingleDocumentOptions[],
      opt_documentOptions?: DocumentOptions,
      opt_viewerOptions?: ViewerOptions) {
    if (!singleDocumentOptions) {
      this.eventTarget.dispatchEvent(
          {'type': 'error', 'content': 'No URL specified'});
    }
    this.loadDocumentOrEPUB(
        singleDocumentOptions, null, opt_documentOptions, opt_viewerOptions);
  }

  /**
   * Load an EPUB document.
   */
  loadEPUB(
      epubUrl: string, opt_documentOptions?: DocumentOptions,
      opt_viewerOptions?: ViewerOptions) {
    if (!epubUrl) {
      this.eventTarget.dispatchEvent(
          {'type': 'error', 'content': 'No URL specified'});
    }
    this.loadDocumentOrEPUB(
        null, epubUrl, opt_documentOptions, opt_viewerOptions);
  }

  /**
   * Load an HTML or XML document, or an EPUB document.
   */
  private loadDocumentOrEPUB(
      singleDocumentOptions: SingleDocumentOptions|SingleDocumentOptions[]|null,
      epubUrl: string|null, opt_documentOptions?: DocumentOptions,
      opt_viewerOptions?: ViewerOptions) {
    const documentOptions = opt_documentOptions || {};

    function convertStyleSheetArray(arr) {
      if (arr) {
        return arr.map((s) => ({url: s.url || null, text: s.text || null}));
      } else {
        return undefined;
      }
    }
    const authorStyleSheet =
        convertStyleSheetArray(documentOptions['authorStyleSheet']);
    const userStyleSheet =
        convertStyleSheetArray(documentOptions['userStyleSheet']);
    if (opt_viewerOptions) {
      Object.assign(this.options, opt_viewerOptions);
    }
    const command = Object.assign(
        {
          'a': singleDocumentOptions ? 'loadXML' : 'loadEPUB',
          'userAgentRootURL': this.settings['userAgentRootURL'],
          'url': convertSingleDocumentOptions(singleDocumentOptions) || epubUrl,
          'document': documentOptions['documentObject'],
          'fragment': documentOptions['fragment'],
          'authorStyleSheet': authorStyleSheet,
          'userStyleSheet': userStyleSheet
        },
        convertViewerOptions(this.options));
    if (this.initialized) {
      this.adaptViewer.sendCommand(command);
    } else {
      this.initialized = true;
      this.adaptViewer.initEmbed(command);
    }
  }

  /**
   * Returns the current page progression of the viewer. If no document is
   * loaded, returns null.
   */
  getCurrentPageProgression(): constants.PageProgression|null {
    return this.adaptViewer.getCurrentPageProgression();
  }

  private resolveNavigation(nav: Navigation): Navigation {
    switch (nav) {
      case Navigation.LEFT:
        return this.getCurrentPageProgression() === PageProgression.LTR ?
            Navigation.PREVIOUS :
            Navigation.NEXT;
      case Navigation.RIGHT:
        return this.getCurrentPageProgression() === PageProgression.LTR ?
            Navigation.NEXT :
            Navigation.PREVIOUS;
      default:
        return nav;
    }
  }

  /**
   * Navigate to the specified page.
   */
  navigateToPage(nav: Navigation) {
    this.adaptViewer.sendCommand(
        {'a': 'moveTo', 'where': this.resolveNavigation(nav)});
  }

  /**
   * Navigate to the Nth page.
   */
  navigateToNthPage(nthPage: number) {
    this.adaptViewer.sendCommand({"a": "moveTo", "nthPage": nthPage});
  };

  /**
   * Navigate to the specified internal URL.
   */
  navigateToInternalUrl(url: string) {
    this.adaptViewer.sendCommand({'a': 'moveTo', 'url': url});
  }

  /**
   * Returns zoom factor corresponding to the specified zoom type.
   */
  queryZoomFactor(type: viewer.ZoomType): number {
    return this.adaptViewer.queryZoomFactor(type);
  }

  getPageSizes(): {width: number, height: number}[] {
    return this.adaptViewer.pageSizes;
  }
}

function convertSingleDocumentOptions(
    singleDocumentOptions: SingleDocumentOptions|
    SingleDocumentOptions[]): adaptviewer.SingleDocumentParam[]|null {
  function toNumberOrNull(num: any): number|null {
    return typeof num === 'number' ? num : null;
  }

  function convert(opt) {
    if (typeof opt === 'string') {
      return (
          {url: opt, startPage: null, skipPagesBefore: null} as
          adaptviewer.SingleDocumentParam);
    } else {
      return ({
        url: opt['url'],
        startPage: toNumberOrNull(opt['startPage']),
        skipPagesBefore: toNumberOrNull(opt['skipPagesBefore'])
      } as adaptviewer.SingleDocumentParam);
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
  PREVIOUS = 'previous',
  NEXT = 'next',
  LEFT = 'left',
  RIGHT = 'right',
  FIRST = 'first',
  LAST = 'last'
}

export type ZoomType = adaptviewer.ZoomType;
export const ZoomType = adaptviewer.ZoomType;

export type PageViewMode = adaptviewer.PageViewMode;
export const PageViewMode = adaptviewer.PageViewMode;

} // namespace viewer
// Old exports:
// vivliostyle.namespace.exportSymbol("vivliostyle.viewer.Viewer", Viewer);
// goog.exportProperty(Viewer.prototype, "setOptions", Viewer.prototype.setOptions);
// goog.exportProperty(Viewer.prototype, "addListener", Viewer.prototype.addListener);
// goog.exportProperty(Viewer.prototype, "removeListener", Viewer.prototype.removeListener);
// goog.exportProperty(Viewer.prototype, "loadDocument", Viewer.prototype.loadDocument);
// goog.exportProperty(Viewer.prototype, "loadEPUB", Viewer.prototype.loadEPUB);
// goog.exportProperty(Viewer.prototype, "getCurrentPageProgression", Viewer.prototype.getCurrentPageProgression);
// goog.exportProperty(Viewer.prototype, "navigateToPage", Viewer.prototype.navigateToPage);
// goog.exportProperty(Viewer.prototype, "navigateToNthPage", Viewer.prototype.navigateToNthPage);
// goog.exportProperty(Viewer.prototype, "navigateToInternalUrl", Viewer.prototype.navigateToInternalUrl);
// goog.exportProperty(Viewer.prototype, "queryZoomFactor", Viewer.prototype.queryZoomFactor);
// goog.exportProperty(Viewer.prototype, "getPageSizes", Viewer.prototype.getPageSizes);
// vivliostyle.namespace.exportSymbol("vivliostyle.viewer.ZoomType", ZoomType);
// goog.exportProperty(ZoomType, "FIT_INSIDE_VIEWPORT", ZoomType.FIT_INSIDE_VIEWPORT);
// vivliostyle.namespace.exportSymbol("vivliostyle.viewer.PageViewMode", PageViewMode);
// goog.exportProperty(PageViewMode, "SINGLE_PAGE", PageViewMode.SINGLE_PAGE);
// goog.exportProperty(PageViewMode, "SPREAD", PageViewMode.SPREAD);
// goog.exportProperty(PageViewMode, "AUTO_SPREAD", PageViewMode.AUTO_SPREAD);

profile.profiler.forceRegisterEndTiming('load_vivliostyle');
