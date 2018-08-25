/**
 * Copyright 2015 Trim-marks Inc.
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
import * as namespace from './namespace';
import * as profile from './profile';
import * as constants from './constants';
import * as base from '../adapt/base';
import * as viewer from '../adapt/viewer';
const PageProgression = constants.PageProgression;
type ViewerSettings = {
  userAgentRootURL: string,
  viewportElement: HTMLElement,
  window: Window|undefined,
  debug: boolean
};

export {ViewerSettings};
type ViewerOptions = {
  autoResize: boolean|undefined,
  fontSize: number|undefined,
  pageBorderWidth: number|undefined,
  renderAllPages: boolean|undefined,
  pageViewMode: viewer.PageViewMode|undefined,
  zoom: number|undefined,
  fitToScreen: boolean|undefined,
  defaultPaperSize: {width: number, height: number}|undefined
};

export {ViewerOptions};

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
type DocumentOptions = {
  documentObject: Document|undefined,
  fragment: string|undefined,
  styleSheet: {url: string|undefined, text: string|undefined}[]|undefined,
  userStyleSheet: {url: string|undefined, text: string|undefined}[]|undefined
};

export {DocumentOptions};
type SingleDocumentOptions = string|{
  url: string,
  startPage: number | undefined,
  skipPagesBefore: number | undefined
};

export {SingleDocumentOptions};

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
    constants.isDebug = settings.debug;
    this.adaptViewer = new viewer.Viewer(
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
    SingleDocumentOptions[]): viewer.SingleDocumentParam[]|null {
  function toNumberOrNull(num: any): number|null {
    return typeof num === 'number' ? num : null;
  }

  function convert(opt) {
    if (typeof opt === 'string') {
      return (
          {url: opt, startPage: null, skipPagesBefore: null} as
          viewer.SingleDocumentParam);
    } else {
      return ({
        url: opt['url'],
        startPage: toNumberOrNull(opt['startPage']),
        skipPagesBefore: toNumberOrNull(opt['skipPagesBefore'])
      } as viewer.SingleDocumentParam);
    }
  }
  if (Array.isArray(singleDocumentOptions)) {
    return singleDocumentOptions.map(convert);
  } else {
    if (singleDocumentOptions) {
      return [convert(singleDocumentOptions)];
    } else {
      return null;
    }
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
const ZoomType = viewer.ZoomType;
const PageViewMode = viewer.PageViewMode;
namespace.exportSymbol('Viewer', Viewer);
goog.exportProperty(
    Viewer.prototype, 'setOptions', Viewer.prototype.setOptions);
goog.exportProperty(
    Viewer.prototype, 'addListener', Viewer.prototype.addListener);
goog.exportProperty(
    Viewer.prototype, 'removeListener', Viewer.prototype.removeListener);
goog.exportProperty(
    Viewer.prototype, 'loadDocument', Viewer.prototype.loadDocument);
goog.exportProperty(Viewer.prototype, 'loadEPUB', Viewer.prototype.loadEPUB);
goog.exportProperty(
    Viewer.prototype, 'getCurrentPageProgression',
    Viewer.prototype.getCurrentPageProgression);
goog.exportProperty(
    Viewer.prototype, 'navigateToPage', Viewer.prototype.navigateToPage);
goog.exportProperty(
    Viewer.prototype, 'navigateToInternalUrl',
    Viewer.prototype.navigateToInternalUrl);
goog.exportProperty(
    Viewer.prototype, 'queryZoomFactor', Viewer.prototype.queryZoomFactor);
goog.exportProperty(
    Viewer.prototype, 'getPageSizes', Viewer.prototype.getPageSizes);
namespace.exportSymbol('ZoomType', ZoomType);
goog.exportProperty(
    ZoomType, 'FIT_INSIDE_VIEWPORT', ZoomType.FIT_INSIDE_VIEWPORT);
namespace.exportSymbol('PageViewMode', PageViewMode);
goog.exportProperty(PageViewMode, 'SINGLE_PAGE', PageViewMode.SINGLE_PAGE);
goog.exportProperty(PageViewMode, 'SPREAD', PageViewMode.SPREAD);
goog.exportProperty(PageViewMode, 'AUTO_SPREAD', PageViewMode.AUTO_SPREAD);
profile.profiler.forceRegisterEndTiming('load_vivliostyle');
