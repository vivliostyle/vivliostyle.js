/**
 * Copyright 2013 Google, Inc.
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
 * @fileoverview AdaptiveViewer - Viewer implementation.
 */
import * as Asserts from "./asserts";
import * as Base from "./base";
import * as Constants from "./constants";
import * as Epub from "./epub";
import * as Exprs from "./exprs";
import * as Font from "./font";
import * as Logging from "./logging";
import * as Plugin from "./plugin";
import * as Profile from "./profile";
import * as Scripts from "./scripts";
import * as Task from "./task";
import * as TaskUtil from "./task-util";
import * as Vgen from "./vgen";
import * as Vtree from "./vtree";
import {
  VivliostylePolyfillCss,
  VivliostyleViewportCss,
  VivliostyleViewportScreenCss,
} from "./assets";

export type Action = (p1: Base.JSON) => Task.Result<boolean>;

export type ViewportSize = {
  marginLeft: number;
  marginRight: number;
  marginTop: number;
  marginBottom: number;
  width: number;
  height: number;
};

export const VIEWPORT_STATUS_ATTRIBUTE = "data-vivliostyle-viewer-status";

export const VIEWPORT_SPREAD_VIEW_ATTRIBUTE = "data-vivliostyle-spread-view";

/**
 * @enum {string}
 */
export enum PageViewMode {
  SINGLE_PAGE = "singlePage",
  SPREAD = "spread",
  AUTO_SPREAD = "autoSpread",
}

export type SingleDocumentParam = {
  url: string;
  startPage: number | null;
  skipPagesBefore: number | null;
};

export class AdaptiveViewer {
  fontMapper: Font.Mapper;
  kick: () => void;
  sendCommand: (p1: Base.JSON | string) => void;
  resizeListener: () => void;
  hyperlinkListener: Base.EventListener;
  pageRuleStyleElement: HTMLElement;
  pageSheetSizeAlreadySet: boolean = false;
  renderTask: Task.Task | null = null;
  actions: { [key: string]: Action };
  readyState: Constants.ReadyState;
  packageURL: string[];
  opf: Epub.OPFDoc;
  touchActive: boolean;
  touchX: number;
  touchY: number;
  needResize: boolean;
  resized: boolean;
  needRefresh: boolean;
  viewportSize: ViewportSize | null;
  currentPage: Vtree.Page;
  currentSpread: Vtree.Spread | null;
  pagePosition: Epub.Position | null;
  fontSize: number;
  zoom: number;
  fitToScreen: boolean;
  pageViewMode: PageViewMode;
  waitForLoading: boolean;
  renderAllPages: boolean;
  pref: Exprs.Preferences;
  pageSizes: { width: number; height: number }[];
  pixelRatio: number;
  pixelRatioLimit: number;

  // force relayout
  viewport: Vgen.Viewport | null;
  opfView: Epub.OPFView;

  constructor(
    public readonly window: Window,
    public readonly viewportElement: HTMLElement,
    public readonly instanceId: string,
    public readonly callbackFn: (p1: Base.JSON) => void,
  ) {
    const document = viewportElement.ownerDocument;
    const findOrCreateStyleElement = (
      id: string,
      cssText?: string,
    ): HTMLElement => {
      let styleElement = document.getElementById(id);
      if (!styleElement) {
        styleElement = document.createElement("style");
        styleElement.id = id;
        if (cssText) {
          styleElement.textContent = cssText;
        }
        document.head.appendChild(styleElement);
      }
      return styleElement;
    };
    findOrCreateStyleElement(
      "vivliostyle-viewport-screen-css",
      VivliostyleViewportScreenCss,
    );
    findOrCreateStyleElement(
      "vivliostyle-viewport-css",
      VivliostyleViewportCss,
    );
    findOrCreateStyleElement(
      "vivliostyle-polyfill-css",
      VivliostylePolyfillCss,
    );

    viewportElement.setAttribute("data-vivliostyle-viewer-viewport", true);
    if (Constants.isDebug) {
      viewportElement.setAttribute("data-vivliostyle-debug", true);
    }
    viewportElement.setAttribute(VIEWPORT_STATUS_ATTRIBUTE, "loading");
    this.fontMapper = new Font.Mapper(document.head, viewportElement);
    this.init();
    this.kick = () => {};
    this.sendCommand = () => {};
    this.resizeListener = () => {
      this.needResize = true;
      this.resized = true;
      this.kick();
    };
    this.pageReplacedListener = this.pageReplacedListener.bind(this);
    this.hyperlinkListener = (evt) => {};
    this.pageRuleStyleElement = findOrCreateStyleElement(
      "vivliostyle-page-rules",
    );
    this.actions = {
      loadPublication: this.loadPublication,
      loadXML: this.loadXML,
      configure: this.configure,
      moveTo: this.moveTo,
      toc: this.showTOC,
    };
    this.addLogListeners();
  }

  private init(): void {
    this.readyState = Constants.ReadyState.LOADING;
    this.packageURL = [];
    this.opf = null;
    this.touchActive = false;
    this.touchX = 0;
    this.touchY = 0;
    this.needResize = false;
    this.resized = false;
    this.needRefresh = false;
    this.viewportSize = null;
    this.currentPage = null;
    this.currentSpread = null;
    this.pagePosition = null;
    this.fontSize = 16;
    this.zoom = 1;
    this.fitToScreen = false;
    this.pageViewMode = PageViewMode.SINGLE_PAGE;
    this.waitForLoading = false;
    this.renderAllPages = true;
    this.pref = Exprs.defaultPreferences();
    this.pageSizes = [];

    // Pixel ratio emulation on PDF output (PR #1079) does not work with
    // non-Chromium browsers.
    this.pixelRatioLimit = /Chrome/.test(navigator.userAgent)
      ? 16 // max pixelRatio value on Chromium browsers
      : 0; // disable pixelRatio emulation on non-Chromium browsers
    this.pixelRatio = Math.min(8, this.pixelRatioLimit);
  }

  addLogListeners() {
    const logLevel = Logging.LogLevel;
    Logging.logger.addListener(logLevel.DEBUG, (info) => {
      this.callback({ t: "debug", content: info });
    });
    Logging.logger.addListener(logLevel.INFO, (info) => {
      this.callback({ t: "info", content: info });
    });
    Logging.logger.addListener(logLevel.WARN, (info) => {
      this.callback({ t: "warn", content: info });
    });
    Logging.logger.addListener(logLevel.ERROR, (info) => {
      this.callback({ t: "error", content: info });
    });
  }

  private callback(message: Base.JSON): void {
    message["i"] = this.instanceId;
    this.callbackFn(message);
  }

  /**
   * Set readyState and notify to listeners
   */
  setReadyState(readyState: Constants.ReadyState) {
    if (this.readyState !== readyState) {
      this.readyState = readyState;
      this.viewportElement.setAttribute(VIEWPORT_STATUS_ATTRIBUTE, readyState);
      this.callback({ t: "readystatechange" });
    }
  }

  loadPublication(command: Base.JSON): Task.Result<boolean> {
    Profile.profiler.registerStartTiming("beforeRender");
    this.setReadyState(Constants.ReadyState.LOADING);
    const url = command["url"] as string;
    const fragment = command["fragment"] as string | null;
    const authorStyleSheet = command["authorStyleSheet"] as {
      url: string | null;
      text: string | null;
    }[];
    const userStyleSheet = command["userStyleSheet"] as {
      url: string | null;
      text: string | null;
    }[];
    this.viewport = null;
    const frame: Task.Frame<boolean> = Task.newFrame("loadPublication");
    this.configure(command).then(() => {
      const store = new Epub.EPUBDocStore();
      store.init(authorStyleSheet, userStyleSheet).then(() => {
        const pubURL = Base.resolveURL(
          Base.convertSpecialURL(url),
          this.window.location.href,
        );
        this.packageURL = [pubURL];
        store.loadPubDoc(pubURL).then((opf) => {
          if (opf) {
            this.opf = opf;
            this.render(fragment).then(() => {
              frame.finish(true);
            });
          } else {
            frame.finish(false);
          }
        });
      });
    });
    return frame.result();
  }

  loadXML(command: Base.JSON): Task.Result<boolean> {
    Profile.profiler.registerStartTiming("beforeRender");
    this.setReadyState(Constants.ReadyState.LOADING);
    const params: SingleDocumentParam[] = command["url"];
    const doc = command["document"] as Document;
    const fragment = command["fragment"] as string | null;
    const authorStyleSheet = command["authorStyleSheet"] as {
      url: string | null;
      text: string | null;
    }[];
    const userStyleSheet = command["userStyleSheet"] as {
      url: string | null;
      text: string | null;
    }[];

    // force relayout
    this.viewport = null;
    const frame: Task.Frame<boolean> = Task.newFrame("loadXML");
    this.configure(command).then(() => {
      const store = new Epub.EPUBDocStore();
      store.init(authorStyleSheet, userStyleSheet).then(() => {
        const resolvedParams: Epub.OPFItemParam[] = params.map((p, index) => ({
          url: Base.resolveURL(
            Base.convertSpecialURL(p.url),
            this.window.location.href,
          ),
          index,
          startPage: p.startPage,
          skipPagesBefore: p.skipPagesBefore,
        }));
        this.packageURL = resolvedParams.map((p) => p.url);
        this.opf = new Epub.OPFDoc(store, "");
        this.opf.initWithChapters(resolvedParams, doc).then(() => {
          this.render(fragment).then(() => {
            frame.finish(true);
          });
        });
      });
    });
    return frame.result();
  }

  private render(fragment?: string | null): Task.Result<boolean> {
    this.cancelRenderingTask();
    let cont: Task.Result<boolean>;
    if (fragment) {
      cont = this.opf.resolveFragment(fragment).thenAsync((position) => {
        this.pagePosition = position;
        return Task.newResult(true);
      });
    } else {
      cont = Task.newResult(true);
    }
    return cont.thenAsync(() => {
      Profile.profiler.registerEndTiming("beforeRender");
      return this.resize();
    });
  }

  private resolveLength(specified: string): number {
    const value = parseFloat(specified);
    const unitPattern = /[a-z]+$/;
    let matched: RegExpMatchArray;
    if (
      typeof specified === "string" &&
      (matched = specified.match(unitPattern))
    ) {
      const unit = matched[0];
      if (unit === "em" || unit === "rem") {
        return value * this.fontSize;
      }
      if (unit === "ex") {
        return (
          (value * Exprs.defaultUnitSizes["ex"] * this.fontSize) /
          Exprs.defaultUnitSizes["em"]
        );
      }
      const unitSize = Exprs.defaultUnitSizes[unit];
      if (unitSize) {
        return value * unitSize;
      }
    }
    return value;
  }

  configure(command: Base.JSON): Task.Result<boolean> {
    if (typeof command["autoresize"] == "boolean") {
      if (command["autoresize"]) {
        this.viewportSize = null;
        this.window.addEventListener("resize", this.resizeListener, false);
        this.needResize = true;
      } else {
        this.window.removeEventListener("resize", this.resizeListener, false);
      }
    }
    if (typeof command["fontSize"] == "number") {
      const fontSize = command["fontSize"] as number;
      if (fontSize >= 5 && fontSize <= 72 && this.fontSize != fontSize) {
        this.fontSize = fontSize;
        this.needResize = true;
      }
    }
    if (typeof command["viewport"] == "object" && command["viewport"]) {
      const vp = command["viewport"];
      const viewportSize = {
        marginLeft: this.resolveLength(vp["margin-left"]) || 0,
        marginRight: this.resolveLength(vp["margin-right"]) || 0,
        marginTop: this.resolveLength(vp["margin-top"]) || 0,
        marginBottom: this.resolveLength(vp["margin-bottom"]) || 0,
        width: this.resolveLength(vp["width"]) || 0,
        height: this.resolveLength(vp["height"]) || 0,
      };
      if (viewportSize.width >= 200 || viewportSize.height >= 200) {
        this.window.removeEventListener("resize", this.resizeListener, false);
        this.viewportSize = viewportSize;
        this.needResize = true;
      }
    }
    if (typeof command["hyphenate"] == "boolean") {
      this.pref.hyphenate = command["hyphenate"];
      this.needResize = true;
    }
    if (typeof command["horizontal"] == "boolean") {
      this.pref.horizontal = command["horizontal"];
      this.needResize = true;
    }
    if (typeof command["nightMode"] == "boolean") {
      this.pref.nightMode = command["nightMode"];
      this.needResize = true;
    }
    if (typeof command["lineHeight"] == "number") {
      this.pref.lineHeight = command["lineHeight"];
      this.needResize = true;
    }
    if (typeof command["columnWidth"] == "number") {
      this.pref.columnWidth = command["columnWidth"];
      this.needResize = true;
    }
    if (typeof command["fontFamily"] == "string") {
      this.pref.fontFamily = command["fontFamily"];
      this.needResize = true;
    }
    if (typeof command["load"] == "boolean") {
      this.waitForLoading = command["load"]; // Load images (and other resources) on the page.
    }
    if (typeof command["renderAllPages"] == "boolean") {
      this.renderAllPages = command["renderAllPages"];
    }
    // for backward compatibility
    if (typeof command["userAgentRootURL"] == "string") {
      Base.setBaseURL(command["userAgentRootURL"].replace(/resources\/?$/, ""));
      Base.setResourceBaseURL(command["userAgentRootURL"]);
    }
    if (typeof command["rootURL"] == "string") {
      Base.setBaseURL(command["rootURL"]);
      Base.setResourceBaseURL(`${Base.baseURL}resources/`);
    }
    if (
      typeof command["pageViewMode"] == "string" &&
      command["pageViewMode"] !== this.pageViewMode
    ) {
      this.pageViewMode = command["pageViewMode"] as PageViewMode;
      this.needResize = true;
    }
    if (
      typeof command["pageBorder"] == "number" &&
      command["pageBorder"] !== this.pref.pageBorder
    ) {
      // Force relayout
      this.viewport = null;
      this.pref.pageBorder = command["pageBorder"];
      this.needResize = true;
    }
    if (typeof command["zoom"] == "number" && command["zoom"] !== this.zoom) {
      this.zoom = command["zoom"];
      this.needRefresh = true;
    }
    if (
      typeof command["fitToScreen"] == "boolean" &&
      command["fitToScreen"] !== this.fitToScreen
    ) {
      this.fitToScreen = command["fitToScreen"];
      this.needRefresh = true;
    }
    if (
      typeof command["defaultPaperSize"] == "object" &&
      typeof command["defaultPaperSize"].width == "number" &&
      typeof command["defaultPaperSize"].height == "number"
    ) {
      this.viewport = null;
      this.pref.defaultPaperSize = command["defaultPaperSize"];
      this.needResize = true;
    }
    // JavaScript in HTML documents support
    if (
      typeof command["allowScripts"] == "boolean" &&
      command["allowScripts"] !== Scripts.allowScripts
    ) {
      Scripts.setAllowScripts(command["allowScripts"]);
      this.needResize = true;
    }
    // output pixel ratio emulation
    if (typeof command["pixelRatio"] == "number") {
      const pixelRatio = Math.min(command["pixelRatio"], this.pixelRatioLimit);
      if (pixelRatio !== this.pixelRatio) {
        this.pixelRatio = pixelRatio;
        this.needResize = true;
      }
    }
    this.configurePlugins(command);
    return Task.newResult(true);
  }

  configurePlugins(command: Base.JSON) {
    const hooks: Plugin.ConfigurationHook[] = Plugin.getHooksForName(
      Plugin.HOOKS.CONFIGURATION,
    );
    hooks.forEach((hook) => {
      const result = hook(command);
      this.needResize = result.needResize || this.needResize;
      this.needRefresh = result.needRefresh || this.needRefresh;
    });
  }

  /**
   * Refresh view when a currently displayed page is replaced (by re-layout
   * caused by cross reference resolutions)
   */
  pageReplacedListener(evt: Base.Event) {
    const currentPage = this.currentPage;
    const spread = this.currentSpread;
    const target = evt.target;
    if (spread) {
      if (spread.left === target || spread.right === target) {
        this.showCurrent(evt.newPage);
      }
    } else if (currentPage === evt.target) {
      this.showCurrent(evt.newPage);
    }
  }

  /**
   * Iterate through currently displayed pages and do something
   */
  private forCurrentPages(fn: (p1: Vtree.Page) => any) {
    const pages = [];
    if (this.currentPage) {
      pages.push(this.currentPage);
    }
    if (this.currentSpread) {
      pages.push(this.currentSpread.left);
      pages.push(this.currentSpread.right);
    }
    pages.forEach((page) => {
      if (page) {
        fn(page);
      }
    });
  }

  private removePageListeners() {
    this.forCurrentPages((page) => {
      page.removeEventListener("hyperlink", this.hyperlinkListener, false);
      page.removeEventListener("replaced", this.pageReplacedListener, false);
    });
  }

  /**
   * Hide current pages (this.currentPage, this.currentSpread)
   */
  private hidePages() {
    this.removePageListeners();
    this.forCurrentPages((page) => {
      Base.setCSSProperty(page.container, "display", "none");
    });
    this.currentPage = null;
    this.currentSpread = null;
  }

  private showSinglePage(page: Vtree.Page) {
    page.addEventListener("hyperlink", this.hyperlinkListener, false);
    page.addEventListener("replaced", this.pageReplacedListener, false);
    Base.setCSSProperty(page.container, "visibility", "visible");
    Base.setCSSProperty(page.container, "display", "block");
  }

  private showPage(page: Vtree.Page): void {
    this.hidePages();
    this.currentPage = page;
    page.container.style.marginLeft = "";
    page.container.style.marginRight = "";
    this.showSinglePage(page);
  }

  private showSpread(spread: Vtree.Spread) {
    this.hidePages();
    this.currentSpread = spread;
    if (spread.left && spread.right) {
      // Adjust spread horizontal alignment when left/right page widths differ
      let leftWidth = parseFloat(spread.left.container.style.width);
      let rightWidth = parseFloat(spread.right.container.style.width);
      if (leftWidth && rightWidth && leftWidth !== rightWidth) {
        if (leftWidth < rightWidth) {
          spread.left.container.style.marginLeft = `${
            rightWidth - leftWidth
          }px`;
        } else {
          spread.right.container.style.marginRight = `${
            leftWidth - rightWidth
          }px`;
        }
      }
    }
    if (spread.left) {
      this.showSinglePage(spread.left);
      if (!spread.right) {
        spread.left.container.setAttribute(
          "data-vivliostyle-unpaired-page",
          true,
        );
      } else {
        spread.left.container.removeAttribute("data-vivliostyle-unpaired-page");
      }
    }
    if (spread.right) {
      this.showSinglePage(spread.right);
      if (!spread.left) {
        spread.right.container.setAttribute(
          "data-vivliostyle-unpaired-page",
          true,
        );
      } else {
        spread.right.container.removeAttribute(
          "data-vivliostyle-unpaired-page",
        );
      }
    }
  }

  private reportPosition(): Task.Result<boolean> {
    const frame: Task.Frame<boolean> = Task.newFrame("reportPosition");
    Asserts.assert(this.pagePosition);
    this.opf
      .getCFI(this.pagePosition.spineIndex, this.pagePosition.offsetInItem)
      .then((cfi) => {
        const page = this.currentPage;
        const r =
          this.waitForLoading && page.fetchers.length > 0
            ? TaskUtil.waitForFetchers(page.fetchers)
            : Task.newResult(true);
        r.then(() => {
          this.sendLocationNotification(page, cfi).thenFinish(frame);
        });
      });
    return frame.result();
  }

  private createViewport(): Vgen.Viewport {
    const viewportElement = this.viewportElement;
    if (this.viewportSize) {
      const vs = this.viewportSize;
      viewportElement.style.marginLeft = `${vs.marginLeft}px`;
      viewportElement.style.marginRight = `${vs.marginRight}px`;
      viewportElement.style.marginTop = `${vs.marginTop}px`;
      viewportElement.style.marginBottom = `${vs.marginBottom}px`;
      return new Vgen.Viewport(
        this.window,
        this.fontSize,
        this.pixelRatio,
        viewportElement,
        vs.width,
        vs.height,
      );
    } else {
      return new Vgen.Viewport(
        this.window,
        this.fontSize,
        this.pixelRatio,
        viewportElement,
      );
    }
  }

  private resolveSpreadView(
    viewport: Vgen.Viewport,
    pageSize: { width: number; height: number } | null,
  ): boolean {
    switch (this.pageViewMode) {
      case PageViewMode.SINGLE_PAGE:
        return false;
      case PageViewMode.SPREAD:
        return true;
      case PageViewMode.AUTO_SPREAD:
      default:
        return (
          (viewport.width - this.pref.pageBorder) / viewport.height >=
            (pageSize ? (pageSize.width * 2) / pageSize.height : 1.45) &&
          (!!pageSize || viewport.width > 800)
        );
    }
  }

  private updateSpreadView(spreadView: boolean) {
    this.pref.spreadView = spreadView;
    this.viewportElement.setAttribute(
      VIEWPORT_SPREAD_VIEW_ATTRIBUTE,
      spreadView.toString(),
    );
  }

  private sizeIsGood(): boolean {
    const viewport = this.createViewport();
    const hasNoAutoSizedPages =
      this.opfView?.hasPages() && !this.opfView.hasAutoSizedPages();
    const spreadView = this.resolveSpreadView(
      viewport,
      this.resized && hasNoAutoSizedPages ? this.pageSizes[0] : null,
    );
    this.resized = false;
    const spreadViewChanged = this.pref.spreadView !== spreadView;
    this.updateSpreadView(spreadView);

    // check if window.devicePixelRatio is changed
    const scaleRatioChanged =
      this.pixelRatio &&
      this.opfView &&
      this.pixelRatio / this.window.devicePixelRatio !==
        this.opfView.clientLayout.scaleRatio;

    if (
      scaleRatioChanged ||
      this.viewportSize ||
      !this.viewport ||
      this.viewport.fontSize != this.fontSize
    ) {
      return false;
    }
    if (
      !spreadViewChanged &&
      viewport.width == this.viewport.width &&
      viewport.height == this.viewport.height
    ) {
      return true;
    }

    if (
      !spreadViewChanged &&
      viewport.width == this.viewport.width &&
      viewport.height != this.viewport.height &&
      /Android|iPhone|iPad|iPod/.test(navigator.userAgent)
    ) {
      // On mobile browsers, the viewport height may change unexpectedly
      // when soft keyboard appears or tab/address bar auto-hide occurs,
      // so ignore resizing in this condition.
      return true;
    }

    if (hasNoAutoSizedPages) {
      this.viewport.width = viewport.width;
      this.viewport.height = viewport.height;
      this.needRefresh = true;
      return true;
    }
    return false;
  }

  private setPageSize(
    pageSize: { width: number; height: number },
    pageSheetSize: { [key: string]: { width: number; height: number } },
    spineIndex: number,
    pageIndex: number,
  ) {
    this.pageSizes[pageIndex] = pageSize;
    this.setPageSizePageRules(pageSheetSize, spineIndex, pageIndex);
    if (
      pageIndex === 0 &&
      this.pageViewMode === PageViewMode.AUTO_SPREAD &&
      !this.opfView.hasAutoSizedPages()
    ) {
      this.updateSpreadView(this.resolveSpreadView(this.viewport, pageSize));
    }
  }

  private setPageSizePageRules(
    pageSheetSize: { [key: string]: { width: number; height: number } },
    spineIndex: number,
    pageIndex: number,
  ) {
    // In this implementation, it generates one page rule with the largest
    // page size both in width and height in the multiple page sizes.
    // (Resolve issue #751)
    if (
      this.pageRuleStyleElement &&
      (!this.pageSheetSizeAlreadySet ||
        this.pageSizes[pageIndex].width !==
          this.pageSizes[pageIndex - 1]?.width ||
        this.pageSizes[pageIndex].height !==
          this.pageSizes[pageIndex - 1]?.height)
    ) {
      const widthMax = Math.max(...this.pageSizes.map((p) => p.width));
      const heightMax = Math.max(...this.pageSizes.map((p) => p.height));

      function convertSize(px: number): number {
        const pt = px * 0.75;
        // Workaround for Chromium's rounded page size problem.
        // (Fix for issue #934 and #936)
        return Math.ceil(pt);
      }
      const widthPt = convertSize(widthMax);
      const heightPt = convertSize(heightMax);

      // Negative margin setting is necessary to prevent unexpected page breaking.
      // Note that the high pixel ratio emulation, the pixelRatio setting, uses the CSS zoom property
      // that enlarge the page content size, and Chromium splits such large pages unless this
      // negative margin is specified.
      const rightPt = widthPt * ((this.pixelRatio || 1) - 1) + 2;
      const bottomPt = heightPt * ((this.pixelRatio || 1) - 1) + 2; // "+ 2" is for issue #947
      const styleText = `@page {size: ${widthPt}pt ${heightPt}pt; margin: 0 ${-rightPt}pt ${-bottomPt}pt 0;}`;
      this.pageRuleStyleElement.textContent = styleText;
      this.pageSheetSizeAlreadySet = true;
    }
  }

  removePageSizePageRules() {
    if (this.pageRuleStyleElement) {
      this.pageRuleStyleElement.textContent = "";
      this.pageSheetSizeAlreadySet = false;
    }
  }

  private reset(): void {
    let tocVisible = false;
    let tocAutohide = false;
    if (this.opfView) {
      tocVisible = this.opfView.tocVisible;
      tocAutohide = this.opfView.tocAutohide;
      this.opfView.removeRenderedPages();
    }
    this.pageSizes = [];
    this.removePageSizePageRules();
    this.viewport = this.createViewport();
    this.viewport.resetZoom();
    this.opfView = new Epub.OPFView(
      this.opf,
      this.viewport,
      this.fontMapper,
      this.pref,
      this.setPageSize.bind(this),
    );
    if (tocVisible) {
      this.sendCommand({ a: "toc", v: "show", autohide: tocAutohide });
    }
  }

  /**
   * Show current page or spread depending on the setting
   * (this.pref.spreadView).
   * @param sync If true, get the necessary page synchronously (not waiting
   *     another rendering task)
   */
  private showCurrent(page: Vtree.Page, sync?: boolean): Task.Result<null> {
    this.needRefresh = false;
    this.removePageListeners();
    if (this.pref.spreadView) {
      return this.opfView
        .getSpread(this.pagePosition, sync)
        .thenAsync((spread) => {
          if (!spread.left && !spread.right) {
            return Task.newResult(null);
          }
          this.showSpread(spread);
          this.setSpreadZoom(spread);
          this.currentPage =
            page.side === Constants.PageSide.LEFT ? spread.left : spread.right;
          return Task.newResult(null);
        });
    } else {
      this.showPage(page);
      this.setPageZoom(page);
      this.currentPage = page;
      return Task.newResult(null);
    }
  }

  setPageZoom(page: Vtree.Page) {
    const zoom = this.getAdjustedZoomFactor(page.dimensions);
    this.viewport.zoom(page.dimensions.width, page.dimensions.height, zoom);
  }

  setSpreadZoom(spread: Vtree.Spread) {
    const dim = this.getSpreadDimensions(spread);
    this.viewport.zoom(dim.width, dim.height, this.getAdjustedZoomFactor(dim));
  }

  /**
   * @returns adjusted zoom factor
   */
  getAdjustedZoomFactor(pageDimension: {
    width: number;
    height: number;
  }): number {
    return this.fitToScreen
      ? this.calculateZoomFactorToFitInsideViewPort(pageDimension)
      : this.zoom;
  }

  /**
   * Returns width and height of the spread, including the margin between pages.
   */
  getSpreadDimensions(spread: Vtree.Spread): { width: number; height: number } {
    let width = 0;
    let height = 0;
    if (spread.left) {
      width += spread.left.dimensions.width;
      height = spread.left.dimensions.height;
    }
    if (spread.right) {
      width += spread.right.dimensions.width;
      height = Math.max(height, spread.right.dimensions.height);
    }
    if (spread.left && spread.right) {
      width += this.pref.pageBorder * 2;
      // Adjust spread horizontal alignment when left/right page widths differ
      width += Math.abs(
        spread.left.dimensions.width - spread.right.dimensions.width,
      );
    }
    return { width, height };
  }

  /**
   * Returns zoom factor corresponding to the specified zoom type.
   */
  queryZoomFactor(type: ZoomType): number {
    if (!this.currentPage) {
      throw new Error("no page exists.");
    }
    switch (type) {
      case ZoomType.FIT_INSIDE_VIEWPORT: {
        let pageDim: { width: number; height: number };
        if (this.pref.spreadView) {
          Asserts.assert(this.currentSpread);
          pageDim = this.getSpreadDimensions(this.currentSpread);
        } else {
          pageDim = this.currentPage.dimensions;
        }
        return this.calculateZoomFactorToFitInsideViewPort(pageDim);
      }
      default:
        throw new Error(`unknown zoom type: ${type}`);
    }
  }

  /**
   * @returns zoom factor to fit inside viewport
   */
  calculateZoomFactorToFitInsideViewPort(pageDimension: {
    width: number;
    height: number;
  }): number {
    if (!this.viewport) {
      return this.zoom;
    }
    const widthZoom = this.viewport.width / pageDimension.width;
    const heightZoom = this.viewport.height / pageDimension.height;
    return Math.min(widthZoom, heightZoom);
  }

  private cancelRenderingTask() {
    if (this.renderTask) {
      this.renderTask.interrupt(new RenderingCanceledError());
    }
    this.renderTask = null;
  }

  resize(): Task.Result<boolean> {
    this.needResize = false;
    this.needRefresh = false;
    if (this.sizeIsGood()) {
      return Task.newResult(true);
    }
    this.setReadyState(Constants.ReadyState.LOADING);
    this.cancelRenderingTask();
    const resizeTask = Task.currentTask()
      .getScheduler()
      .run(() =>
        Task.handle(
          "resize",
          (frame) => {
            if (!this.opf) {
              frame.finish(false);
              return;
            }
            this.renderTask = resizeTask;
            Profile.profiler.registerStartTiming("render (resize)");
            this.reset();
            if (this.pagePosition) {
              // When resizing, do not use the current page index, for a page
              // index corresponding to the current position in the document
              // (offsetInItem) can change due to different layout caused by
              // different viewport size.

              // Update(2019-03): to avoid unexpected page move (first page to next),
              // keep pageIndex == 0 when offsetInItem == 0
              if (
                !(
                  this.pagePosition.pageIndex == 0 &&
                  this.pagePosition.offsetInItem == 0
                )
              ) {
                this.pagePosition.pageIndex = -1;
              }
            }

            // epageCount counting depends renderAllPages mode
            this.opf.setEPageCountMode(this.renderAllPages);

            // With renderAllPages option specified, the rendering is
            // performed after the initial page display, otherwise users are
            // forced to wait the rendering finish in front of a blank page.
            this.opfView
              .renderPagesUpto(this.pagePosition, !this.renderAllPages)
              .then((result) => {
                if (!result) {
                  frame.finish(false);
                  return;
                }
                this.pagePosition = result.position;
                this.showCurrent(result.page, true).then(() => {
                  this.setReadyState(Constants.ReadyState.INTERACTIVE);

                  this.opf
                    .countEPages((epageCount) => {
                      const notification = {
                        t: "nav",
                        epageCount: epageCount,
                        first: this.currentPage.isFirstPage,
                        last: this.currentPage.isLastPage,
                        metadata: this.opf.metadata,
                        docTitle:
                          this.opf.spine[this.pagePosition.spineIndex].title,
                      };
                      if (
                        this.currentPage.isFirstPage ||
                        (this.pagePosition.pageIndex == 0 &&
                          this.opf.spine[this.pagePosition.spineIndex].epage)
                      ) {
                        notification["epage"] =
                          this.opf.spine[this.pagePosition.spineIndex].epage;
                      }
                      this.callback(notification);
                    })
                    .then(() => {
                      this.reportPosition().then((p) => {
                        const r = this.renderAllPages
                          ? this.opfView.renderAllPages()
                          : Task.newResult(null);
                        r.then(() => {
                          if (this.renderTask === resizeTask) {
                            this.renderTask = null;
                          }
                          Profile.profiler.registerEndTiming("render (resize)");
                          // JavaScript in HTML documents support
                          if (
                            Scripts.allowScripts &&
                            Scripts.hasScripts(this.window)
                          ) {
                            Scripts.loadScriptsAtEnd(this.window).then(() => {
                              if (this.renderAllPages) {
                                this.setReadyState(
                                  Constants.ReadyState.COMPLETE,
                                );
                              }
                              this.callback({ t: "loaded" });
                              frame.finish(p);
                            });
                          } else {
                            if (this.renderAllPages) {
                              this.setReadyState(Constants.ReadyState.COMPLETE);
                            }
                            this.callback({ t: "loaded" });
                            frame.finish(p);
                          }
                        });
                      });
                    });
                });
              });
          },
          (frame, err) => {
            if (err instanceof RenderingCanceledError) {
              Profile.profiler.registerEndTiming("render (resize)");
              Logging.logger.debug(err.message);
            } else {
              throw err;
            }
          },
        ),
      );
    return Task.newResult(true);
  }

  private sendLocationNotification(
    page: Vtree.Page,
    cfi: string | null,
  ): Task.Result<boolean> {
    const frame: Task.Frame<boolean> = Task.newFrame(
      "sendLocationNotification",
    );
    const notification = {
      t: "nav",
      first: page.isFirstPage,
      last: page.isLastPage,
      metadata: this.opf.metadata,
      docTitle: this.opf.spine[page.spineIndex].title,
    };
    this.opf
      .getEPageFromPosition(this.pagePosition as Epub.Position)
      .then((epage) => {
        notification["epage"] = epage;
        notification["epageCount"] = this.opf.epageCount;
        if (cfi) {
          notification["cfi"] = cfi;
        }
        this.callback(notification);
        frame.finish(true);
      });
    return frame.result();
  }

  getCurrentPageProgression(): Constants.PageProgression | null {
    return this.opfView
      ? this.opfView.getCurrentPageProgression(this.pagePosition)
      : null;
  }

  moveTo(command: Base.JSON): Task.Result<boolean> {
    let method: () => Task.Result<Epub.PageAndPosition>;
    if (
      this.readyState !== Constants.ReadyState.COMPLETE &&
      command["where"] !== "next"
    ) {
      this.setReadyState(Constants.ReadyState.LOADING);
    }
    if (typeof command["where"] == "string") {
      let m: (
        position: Epub.Position,
        sync: boolean,
      ) => Task.Result<Epub.PageAndPosition>;
      switch (command["where"]) {
        case "next":
          m = this.pref.spreadView
            ? this.opfView.nextSpread
            : this.opfView.nextPage;
          break;
        case "previous":
          m = this.pref.spreadView
            ? this.opfView.previousSpread
            : this.opfView.previousPage;
          break;
        case "last":
          m = this.opfView.lastPage;
          break;
        case "first":
          m = this.opfView.firstPage;
          break;
        default:
          return Task.newResult(true);
      }
      if (m) {
        method = () =>
          m.call(this.opfView, this.pagePosition, !this.renderAllPages);
      }
    } else if (typeof command["epage"] == "number") {
      const epage = command["epage"] as number;
      method = () =>
        this.opfView.navigateToEPage(
          epage,
          this.pagePosition,
          !this.renderAllPages,
        );
    } else if (typeof command["url"] == "string") {
      const url = command["url"] as string;
      method = () =>
        this.opfView.navigateTo(url, this.pagePosition, !this.renderAllPages);
    } else if (typeof command["position"]?.spineIndex == "number") {
      const position = command["position"] as Epub.Position;
      method = () => this.opfView.findPage(position, !this.renderAllPages);
    } else {
      return Task.newResult(true);
    }
    if (!this.opfView) {
      return Task.newResult(true);
    }
    const frame: Task.Frame<boolean> = Task.newFrame("moveTo");
    method.call(this.opfView).then((result) => {
      let cont: Task.Result<boolean>;
      if (result) {
        this.pagePosition = result.position;
        const innerFrame: Task.Frame<boolean> =
          Task.newFrame("moveTo.showCurrent");
        cont = innerFrame.result();
        this.showCurrent(result.page, !this.renderAllPages).then(() => {
          this.reportPosition().thenFinish(innerFrame);
        });
      } else {
        cont = Task.newResult(true);
      }
      cont.then((res) => {
        if (this.readyState === Constants.ReadyState.LOADING) {
          this.setReadyState(Constants.ReadyState.INTERACTIVE);
        }
        frame.finish(res);
      });
    });
    return frame.result();
  }

  showTOC(command: Base.JSON): Task.Result<boolean> {
    const autohide = !!command["autohide"];
    const visibility = command["v"];
    const currentVisibility = this.opfView.isTOCVisible();
    const changeAutohide =
      autohide != this.opfView.tocAutohide && visibility != "hide";
    if (currentVisibility) {
      if (visibility == "show" && !changeAutohide) {
        return Task.newResult(true);
      }
    } else {
      if (visibility == "hide") {
        return Task.newResult(true);
      }
    }
    if (currentVisibility && visibility != "show") {
      this.opfView.hideTOC();
      return Task.newResult(true);
    } else {
      const frame: Task.Frame<boolean> = Task.newFrame("showTOC");
      this.opfView.showTOC(autohide).then((page) => {
        if (page) {
          if (changeAutohide) {
            page.listeners = {};
          }
          if (autohide) {
            const hideTOC = () => {
              this.opfView.hideTOC();
            };
            page.addEventListener("hyperlink", hideTOC, false);
            // page.container.addEventListener("click", hideTOC, false);
          }
          page.addEventListener("hyperlink", this.hyperlinkListener, false);
        }
        frame.finish(true);
      });
      return frame.result();
    }
  }

  runCommand(command: Base.JSON): Task.Result<boolean> {
    const actionName = command["a"] || "";
    return Task.handle(
      "runCommand",
      (frame) => {
        const action = this.actions[actionName];
        if (action) {
          action.call(this, command).then(() => {
            this.callback({ t: "done", a: actionName });
            frame.finish(true);
          });
        } else {
          Logging.logger.error("No such action:", actionName);
          frame.finish(true);
        }
      },
      (frame, err) => {
        Logging.logger.error(err, "Error during action:", actionName);
        frame.finish(true);
      },
    );
  }

  initEmbed(cmd: Base.JSON | string): void {
    let command = maybeParse(cmd);
    let continuation: Task.Continuation<boolean> | null = null;
    const viewer = this;
    Task.start(() => {
      const frame: Task.Frame<boolean> = Task.newFrame("commandLoop");
      const scheduler = Task.currentTask().getScheduler();
      viewer.hyperlinkListener = (evt) => {
        const hrefEvent = evt as Vtree.PageHyperlinkEvent;
        const internal =
          hrefEvent.href.charAt(0) === "#" ||
          viewer.packageURL.some(
            (url) => hrefEvent.href.substr(0, url.length) == url,
          );
        if (internal) {
          evt.preventDefault();
          const msg = {
            t: "hyperlink",
            href: hrefEvent.href,
            internal: internal,
          };
          scheduler.run(() => {
            viewer.callback(msg);
            return Task.newResult(true);
          });
        }
      };
      frame
        .loopWithFrame((loopFrame) => {
          if (viewer.needResize) {
            viewer.resize().then(() => {
              loopFrame.continueLoop();
            });
          } else if (viewer.needRefresh) {
            if (viewer.currentPage) {
              viewer
                .showCurrent(viewer.currentPage, !this.renderAllPages)
                .then(() => {
                  loopFrame.continueLoop();
                });
            }
          } else if (command) {
            const cmd = command;
            command = null;
            viewer.runCommand(cmd).then(() => {
              loopFrame.continueLoop();
            });
          } else {
            const frameInternal: Task.Frame<boolean> =
              Task.newFrame("waitForCommand");
            continuation = frameInternal.suspend(this);
            frameInternal.result().then(() => {
              loopFrame.continueLoop();
            });
          }
        })
        .thenFinish(frame);
      return frame.result();
    });
    viewer.kick = () => {
      const cont = continuation;
      if (cont) {
        continuation = null;
        cont.schedule(true);
      }
    };
    viewer.sendCommand = (cmd) => {
      if (command) {
        return false;
      }
      command = maybeParse(cmd);
      viewer.kick();
      return true;
    };
    this.window["adapt_command"] = viewer.sendCommand;
  }
}

/**
 * @enum {string}
 */
export enum ZoomType {
  FIT_INSIDE_VIEWPORT = "fit inside viewport",
}

/**
 * Error representing that the rendering has been canceled.
 */
class RenderingCanceledError extends Error {
  name: string = "RenderingCanceledError";
  message: string = "Page rendering has been canceled";
  stack: string;

  constructor() {
    super();
    // Set the prototype explicitly.
    // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, RenderingCanceledError.prototype);
    this.stack = new Error().stack;
  }
}

export function maybeParse(cmd: any): Base.JSON {
  if (typeof cmd == "string") {
    return Base.stringToJSON(cmd);
  }
  return cmd;
}
