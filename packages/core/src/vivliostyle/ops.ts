/**
 * Copyright 2013 Google, Inc.
 * Copyright 2015 Trim-marks Inc.
 * Copyright 2019 Vivliostyle Foundation
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
 * @fileoverview Ops - Render EPUB content files by applying page masters,
 * styling and layout.
 */
import "./footnotes";
import "./table";
import * as Asserts from "./asserts";
import * as Base from "./base";
import * as Break from "./break";
import * as Columns from "./columns";
import * as Constants from "./constants";
import * as Counters from "./counters";
import * as Css from "./css";
import * as CssCascade from "./css-cascade";
import * as CssParser from "./css-parser";
import * as CssProp from "./css-prop";
import * as CssStyler from "./css-styler";
import * as CssTokenizer from "./css-tokenizer";
import * as CssValidator from "./css-validator";
import * as Exprs from "./exprs";
import * as Font from "./font";
import * as GeometryUtil from "./geometry-util";
import * as Layout from "./layout";
import * as LayoutProcessor from "./layout-processor";
import * as Logging from "./logging";
import * as Net from "./net";
import * as PageFloats from "./page-floats";
import * as CssPage from "./css-page";
import * as Plugin from "./plugin";
import * as PageMaster from "./page-master";
import * as Task from "./task";
import * as TaskUtil from "./task-util";
import * as Vgen from "./vgen";
import * as Vtree from "./vtree";
import * as XmlDoc from "./xml-doc";
import { Layout as LayoutType } from "./types";
import { UserAgentBaseCss, UserAgentPageCss } from "./assets";

export const uaStylesheetBaseFetcher: TaskUtil.Fetcher<boolean> = new TaskUtil.Fetcher(
  () => {
    const frame: Task.Frame<boolean> = Task.newFrame("uaStylesheetBase");
    const validatorSet = CssValidator.baseValidatorSet();
    const url = Base.resolveURL("user-agent-base.css", Base.resourceBaseURL);
    const handler = new CssCascade.CascadeParserHandler(
      null,
      null,
      null,
      null,
      null,
      validatorSet,
      true,
    );
    handler.startStylesheet(CssParser.StylesheetFlavor.USER_AGENT);
    CssCascade.setUABaseCascade(handler.cascade);
    CssParser.parseStylesheetFromText(
      UserAgentBaseCss,
      handler,
      url,
      null,
      null,
    ).thenFinish(frame);
    return frame.result();
  },
  "uaStylesheetBaseFetcher",
);

export function loadUABase(): Task.Result<boolean> {
  return uaStylesheetBaseFetcher.get();
}

export type FontFace = {
  properties: CssCascade.ElementStyle;
  condition: Exprs.Val;
};

export class Style {
  fontDeobfuscator:
    | ((p1: string) => ((p1: Blob) => Task.Result<Blob>) | null)
    | null;
  validatorSet: CssValidator.ValidatorSet;

  constructor(
    public readonly store: OPSDocStore,
    public readonly rootScope: Exprs.LexicalScope,
    public readonly pageScope: Exprs.LexicalScope,
    public readonly cascade: CssCascade.Cascade,
    public readonly rootBox: PageMaster.RootPageBox,
    public readonly fontFaces: FontFace[],
    public readonly footnoteProps: CssCascade.ElementStyle,
    public readonly flowProps: { [key: string]: CssCascade.ElementStyle },
    public readonly viewportProps: CssCascade.ElementStyle[],
    public readonly pageProps: { [key: string]: CssCascade.ElementStyle },
  ) {
    this.fontDeobfuscator = store.fontDeobfuscator;
    this.validatorSet = store.validatorSet;
    this.pageScope.defineBuiltIn("has-content", function (name) {
      name = name as string;
      const styleInstance = this as StyleInstance;
      const cp = styleInstance.currentLayoutPosition;
      const flowChunk = cp.firstFlowChunkOfFlow(name);
      return (
        styleInstance.matchPageSide(cp.startSideOfFlow(name as string)) &&
        cp.hasContent(name as string, styleInstance.lookupOffset) &&
        !!flowChunk &&
        !styleInstance.flowChunkIsAfterParentFlowForcedBreak(flowChunk)
      );
    });
    this.pageScope.defineName(
      "page-number",
      new Exprs.Native(
        this.pageScope,
        function () {
          const styleInstance = this as StyleInstance;
          return (
            styleInstance.pageNumberOffset +
            styleInstance.currentLayoutPosition.page
          );
        },
        "page-number",
      ),
    );
  }

  sizeViewport(
    viewportWidth: number,
    viewportHeight: number,
    fontSize: number,
    pref?: Exprs.Preferences,
  ): { width: number; height: number; fontSize: number } {
    if (this.viewportProps.length) {
      const context = new Exprs.Context(
        this.rootScope,
        viewportWidth,
        viewportHeight,
        fontSize,
      );
      const viewportProps = CssCascade.mergeAll(context, this.viewportProps);
      const width = viewportProps["width"];
      const height = viewportProps["height"];
      const textZoom = viewportProps["text-zoom"];
      let scaleFactor = 1;
      if ((width && height) || textZoom) {
        const defaultFontSize = Exprs.defaultUnitSizes["em"];
        const zoomVal = textZoom
          ? textZoom.evaluate(context, "text-zoom")
          : null;
        if (zoomVal === Css.ident.scale) {
          scaleFactor = defaultFontSize / fontSize;
          fontSize = defaultFontSize;
          viewportWidth *= scaleFactor;
          viewportHeight *= scaleFactor;
        }
        if (width && height) {
          const widthVal = Css.toNumber(
            width.evaluate(context, "width"),
            context,
          );
          const heightVal = Css.toNumber(
            height.evaluate(context, "height"),
            context,
          );
          if (widthVal > 0 && heightVal > 0) {
            const spreadWidth =
              pref && pref.spreadView
                ? (widthVal + pref.pageBorder) * 2
                : widthVal;
            return { width: spreadWidth, height: heightVal, fontSize };
          }
        }
      }
    }
    return { width: viewportWidth, height: viewportHeight, fontSize };
  }
}

//-------------------------------------------------------------------------------
export class StyleInstance
  extends Exprs.Context
  implements
    CssStyler.FlowListener,
    PageMaster.InstanceHolder,
    Vgen.StylerProducer {
  lang: string | null;
  primaryFlows = { body: true } as { [key: string]: boolean };
  rootPageBoxInstance: PageMaster.RootPageBoxInstance = null;
  styler: CssStyler.Styler = null;
  stylerMap: { [key: string]: CssStyler.Styler } = null;
  currentLayoutPosition: Vtree.LayoutPosition = null;
  layoutPositionAtPageStart: Vtree.LayoutPosition = null;
  lookupOffset: number = 0;
  faces: Font.DocumentFaces;
  pageBoxInstances: { [key: string]: PageMaster.PageBoxInstance } = {};
  pageManager: CssPage.PageManager = null;
  private rootPageFloatLayoutContext: PageFloats.PageFloatLayoutContext;
  pageBreaks: { [key: string]: boolean } = {};
  pageProgression: Constants.PageProgression | null = null;
  pageSheetSize: { [key: string]: { width: number; height: number } } = {};
  pageSheetHeight: number = 0;
  pageSheetWidth: number = 0;
  actualPageWidth: number;
  actualPageHeight: number;

  constructor(
    public readonly style: Style,
    public readonly xmldoc: XmlDoc.XMLDocHolder,
    defaultLang: string | null,
    public readonly viewport: Vgen.Viewport,
    public readonly clientLayout: Vtree.ClientLayout,
    public readonly fontMapper: Font.Mapper,
    public readonly customRenderer: Vgen.CustomRenderer,
    public readonly fallbackMap: { [key: string]: string },
    public readonly pageNumberOffset: number,
    public readonly documentURLTransformer: Base.DocumentURLTransformer,
    public readonly counterStore: Counters.CounterStore,
    pageProgression?: Constants.PageProgression,
  ) {
    super(style.rootScope, viewport.width, viewport.height, viewport.fontSize);
    this.lang = xmldoc.lang || defaultLang;
    this.faces = new Font.DocumentFaces(this.style.fontDeobfuscator);
    this.rootPageFloatLayoutContext = new PageFloats.PageFloatLayoutContext(
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    );
    this.pageProgression = pageProgression || null;
    for (const flowName in style.flowProps) {
      const flowStyle = style.flowProps[flowName];
      const consume = CssCascade.getProp(flowStyle, "flow-consume");
      if (consume) {
        const consumeVal = consume.evaluate(this, "flow-consume");
        if (consumeVal == Css.ident.all) {
          this.primaryFlows[flowName] = true;
        } else {
          delete this.primaryFlows[flowName];
        }
      }
    }
  }

  init(): Task.Result<boolean> {
    const frame: Task.Frame<boolean> = Task.newFrame("StyleInstance.init");
    const counterListener = this.counterStore.createCounterListener(
      this.xmldoc.url,
    );
    const counterResolver = this.counterStore.createCounterResolver(
      this.xmldoc.url,
      this.style.rootScope,
      this.style.pageScope,
    );
    this.styler = new CssStyler.Styler(
      this.xmldoc,
      this.style.cascade,
      this.style.rootScope,
      this,
      this.primaryFlows,
      this.style.validatorSet,
      counterListener,
      counterResolver,
    );
    counterResolver.setStyler(this.styler);
    this.styler.resetFlowChunkStream(this);
    this.stylerMap = {};
    this.stylerMap[this.xmldoc.url] = this.styler;
    const docElementStyle = this.styler.getTopContainerStyle();
    if (!this.pageProgression) {
      this.pageProgression = CssPage.resolvePageProgression(docElementStyle);
    }
    const rootBox = this.style.rootBox;
    this.rootPageBoxInstance = new PageMaster.RootPageBoxInstance(rootBox);
    const cascadeInstance = this.style.cascade.createInstance(
      this,
      counterListener,
      counterResolver,
      this.lang,
    );
    this.rootPageBoxInstance.applyCascadeAndInit(
      cascadeInstance,
      docElementStyle,
    );
    this.rootPageBoxInstance.resolveAutoSizing(this);
    this.pageManager = new CssPage.PageManager(
      cascadeInstance,
      this.style.pageScope,
      this.rootPageBoxInstance,
      this,
      docElementStyle,
    );
    const srcFaces = [] as Font.Face[];
    for (const fontFace of this.style.fontFaces) {
      if (fontFace.condition && !fontFace.condition.evaluate(this)) {
        continue;
      }
      const properties = Font.prepareProperties(fontFace.properties, this);
      const srcFace = new Font.Face(properties);
      srcFaces.push(srcFace);
    }
    this.fontMapper.findOrLoadFonts(srcFaces, this.faces).thenFinish(frame);

    // Determine page sheet sizes corresponding to page selectors
    const pageProps = this.style.pageProps;
    Object.keys(pageProps).forEach((selector) => {
      const pageSizeAndBleed = CssPage.evaluatePageSizeAndBleed(
        CssPage.resolvePageSizeAndBleed(pageProps[selector] as any),
        this,
      );
      this.pageSheetSize[selector] = {
        width: pageSizeAndBleed.pageWidth + pageSizeAndBleed.cropOffset * 2,
        height: pageSizeAndBleed.pageHeight + pageSizeAndBleed.cropOffset * 2,
      };
    });
    return frame.result();
  }

  /**
   * @override
   */
  getStylerForDoc(xmldoc: XmlDoc.XMLDocHolder): CssStyler.AbstractStyler {
    let styler = this.stylerMap[xmldoc.url];
    if (!styler) {
      const style = this.style.store.getStyleForDoc(xmldoc);

      // We need a separate content, so that variables can get potentially
      // different values.
      const context = new Exprs.Context(
        style.rootScope,
        this.pageWidth(),
        this.pageHeight(),
        this.initialFontSize,
      );
      const counterListener = this.counterStore.createCounterListener(
        xmldoc.url,
      );
      const counterResolver = this.counterStore.createCounterResolver(
        xmldoc.url,
        style.rootScope,
        style.pageScope,
      );
      styler = new CssStyler.Styler(
        xmldoc,
        style.cascade,
        style.rootScope,
        context,
        this.primaryFlows,
        style.validatorSet,
        counterListener,
        counterResolver,
      );
      this.stylerMap[xmldoc.url] = styler;
    }
    return styler;
  }

  /**
   * @override
   */
  registerInstance(key: string, instance: PageMaster.PageBoxInstance): void {
    this.pageBoxInstances[key] = instance;
  }

  /**
   * @override
   */
  lookupInstance(key: string): PageMaster.PageBoxInstance {
    return this.pageBoxInstances[key];
  }

  /**
   * @override
   */
  encounteredFlowChunk(flowChunk: Vtree.FlowChunk, flow: Vtree.Flow): any {
    const cp = this.currentLayoutPosition;
    if (cp) {
      if (!cp.flows[flowChunk.flowName]) {
        cp.flows[flowChunk.flowName] = flow;
      } else {
        flow = cp.flows[flowChunk.flowName];
      }
      let flowPosition = cp.flowPositions[flowChunk.flowName];
      if (!flowPosition) {
        flowPosition = new Vtree.FlowPosition();
        cp.flowPositions[flowChunk.flowName] = flowPosition;
      }
      const nodePosition = Vtree.newNodePositionFromNode(flowChunk.element);
      const chunkPosition = new Vtree.ChunkPosition(nodePosition);
      const flowChunkPosition = new Vtree.FlowChunkPosition(
        chunkPosition,
        flowChunk,
      );
      flowPosition.positions.push(flowChunkPosition);
    }
  }

  getConsumedOffset(flowPosition: Vtree.FlowPosition): number {
    let offset = Number.POSITIVE_INFINITY;
    for (let i = 0; i < flowPosition.positions.length; i++) {
      const pos = flowPosition.positions[i].chunkPosition.primary;
      let node = pos.steps[0].node;
      let offsetInNode = pos.offsetInNode;
      let after = pos.after;
      let k = 0;
      while (node.ownerDocument != this.xmldoc.document) {
        k++;
        node = pos.steps[k].node;
        after = false;
        offsetInNode = 0;
      }
      const chunkOffset = this.xmldoc.getNodeOffset(node, offsetInNode, after);
      if (chunkOffset < offset) {
        offset = chunkOffset;
      }
    }
    return offset;
  }

  /**
   * @param noLookAhead Do not look ahead elements that are not styled yet
   * @return document offset of the given layoutPosition
   */
  getPosition(
    layoutPosition?: Vtree.LayoutPosition,
    noLookAhead?: boolean,
  ): number {
    if (!layoutPosition) {
      return 0;
    }
    let currentPosition = Number.POSITIVE_INFINITY;
    for (const flowName in this.primaryFlows) {
      let flowPosition = layoutPosition.flowPositions[flowName];
      if (
        !noLookAhead &&
        (!flowPosition || flowPosition.positions.length == 0) &&
        this.currentLayoutPosition
      ) {
        this.styler.styleUntilFlowIsReached(flowName);
        flowPosition = this.currentLayoutPosition.flowPositions[flowName];
        if (layoutPosition != this.currentLayoutPosition) {
          if (flowPosition) {
            flowPosition = flowPosition.clone();
            layoutPosition.flowPositions[flowName] = flowPosition;
          }
        }
      }
      if (flowPosition) {
        const consumedOffset = this.getConsumedOffset(flowPosition);
        if (consumedOffset < currentPosition) {
          currentPosition = consumedOffset;
        }
      }
    }
    return currentPosition;
  }

  dumpLocation(position) {
    Logging.logger.debug("Location - page", this.currentLayoutPosition.page);
    Logging.logger.debug("  current:", position);
    Logging.logger.debug("  lookup:", this.lookupOffset);
    for (const flowName in this.currentLayoutPosition.flowPositions) {
      const flowPosition = this.currentLayoutPosition.flowPositions[flowName];
      for (const p of flowPosition.positions) {
        Logging.logger.debug(
          "  Chunk",
          `${flowName}:`,
          p.flowChunk.startOffset,
        );
      }
    }
  }

  matchPageSide(side: string): boolean {
    switch (side) {
      case "left":
      case "right":
      case "recto":
      case "verso":
        return new Exprs.Named(this.style.pageScope, `${side}-page`).evaluate(
          this,
        ) as boolean;
      default:
        return true;
    }
  }

  updateStartSide(layoutPosition: Vtree.LayoutPosition) {
    for (const name in layoutPosition.flowPositions) {
      const flowPos = layoutPosition.flowPositions[name];
      if (flowPos && flowPos.positions.length > 0) {
        const flowChunk = flowPos.positions[0].flowChunk;
        if (this.getConsumedOffset(flowPos) === flowChunk.startOffset) {
          const flowChunkBreakBefore =
            flowPos.positions[0].flowChunk.breakBefore;
          const flowBreakAfter = Break.startSideValueToBreakValue(
            flowPos.startSide,
          );
          flowPos.startSide = Break.breakValueToStartSideValue(
            Break.resolveEffectiveBreakValue(
              flowBreakAfter,
              flowChunkBreakBefore,
            ),
          );
        }
      }
    }
  }

  /**
   * @param cascadedPageStyle Cascaded page style specified in page context
   */
  selectPageMaster(
    cascadedPageStyle: CssCascade.ElementStyle,
  ): PageMaster.PageMasterInstance {
    const cp = this.currentLayoutPosition;

    // 3.5. Page Layout Processing Model
    // 1. Determine current position in the document: Find the minimal
    // consumed-offset for all elements not fully-consumed in each primary flow.
    // Current position is maximum of the results among all primary flows.
    const currentPosition = this.getPosition(cp);
    if (currentPosition == Number.POSITIVE_INFINITY) {
      // end of primary content is reached
      return null;
    }

    // 2. Page master selection: for each page master:
    const pageMasters = this.rootPageBoxInstance
      .children as PageMaster.PageMasterInstance[];
    let pageMaster: PageMaster.PageMasterInstance;
    for (let i = 0; i < pageMasters.length; i++) {
      pageMaster = pageMasters[i];

      // Skip a page master generated for @page rules
      if (pageMaster.pageBox.pseudoName === CssPage.pageRuleMasterPseudoName) {
        continue;
      }
      let coeff = 1;

      // A. Calculate lookup position using current position and utilization
      // (see -epubx-utilization property)
      const utilization = pageMaster.getProp(this, "utilization");
      if (utilization && utilization.isNum()) {
        coeff = (utilization as Css.Num).num;
      }
      const em = this.queryUnitSize("em", false);
      const pageArea = this.pageWidth() * this.pageHeight();
      const lookup = Math.ceil((coeff * pageArea) / (em * em));

      // B. Determine element eligibility. Each element in a flow is considered
      // eligible if it is is not marked as fully consumed and it comes in the
      // document before the lookup position. Feed lookupOffset and flow
      // availability into the context
      this.lookupOffset = this.styler.styleUntil(currentPosition, lookup);
      Asserts.assert(cp);
      this.updateStartSide(cp);

      // update layoutPositionAtPageStart since startSide of FlowChunks may be
      // updated
      this.layoutPositionAtPageStart = cp.clone();
      this.initLingering();
      this.clearScope(this.style.pageScope);

      // C. Determine content availability. Flow has content available if it
      // contains eligible elements. D. Determine if page master is enabled
      // using rules in Section 3.4.7
      const enabled = pageMaster.getProp(this, "enabled");

      // E. First enabled page master is used for the next page
      if (!enabled || enabled === Css.ident._true) {
        if (VIVLIOSTYLE_DEBUG) {
          this.dumpLocation(currentPosition);
        }

        // Apply @page rules
        return this.pageManager.getPageRulePageMaster(
          pageMaster,
          cascadedPageStyle,
        );
      }
    }
    throw new Error("No enabled page masters");
  }

  flowChunkIsAfterParentFlowForcedBreak(flowChunk: Vtree.FlowChunk): boolean {
    const flows = this.layoutPositionAtPageStart.flows;
    const parentFlowName = flows[flowChunk.flowName].parentFlowName;
    if (parentFlowName) {
      const startOffset = flowChunk.startOffset;
      const forcedBreakOffsets = flows[parentFlowName].forcedBreakOffsets;
      if (!forcedBreakOffsets.length || startOffset < forcedBreakOffsets[0]) {
        return false;
      }
      const breakOffsetBeforeStartIndex =
        Base.binarySearch(
          forcedBreakOffsets.length,
          (i) => forcedBreakOffsets[i] > startOffset,
        ) - 1;
      const breakOffsetBeforeStart =
        forcedBreakOffsets[breakOffsetBeforeStartIndex];
      const parentFlowPosition = this.layoutPositionAtPageStart.flowPositions[
        parentFlowName
      ];
      const parentStartOffset = this.getConsumedOffset(parentFlowPosition);
      if (breakOffsetBeforeStart < parentStartOffset) {
        return false;
      }
      if (parentStartOffset < breakOffsetBeforeStart) {
        return true;
      }

      // Special case: parentStartOffset === breakOffsetBeforeStart
      // In this case, the flowChunk can be used if the start side of the parent
      // flow matches the current page side.
      return !this.matchPageSide(parentFlowPosition.startSide);
    }
    return false;
  }

  setFormattingContextToColumn(column: LayoutType.Column, flowName: string) {
    const flow = this.currentLayoutPosition.flows[flowName];
    if (!flow.formattingContext) {
      flow.formattingContext = new LayoutProcessor.BlockFormattingContext(null);
    }
    column.flowRootFormattingContext = flow.formattingContext;
  }

  layoutDeferredPageFloats(column: LayoutType.Column): Task.Result<boolean> {
    const pageFloatLayoutContext = column.pageFloatLayoutContext;
    const deferredFloats = pageFloatLayoutContext.getDeferredPageFloatContinuations();
    const frame = Task.newFrame<boolean>("layoutDeferredPageFloats");
    let invalidated = false;
    let i = 0;
    frame
      .loopWithFrame((loopFrame) => {
        if (i === deferredFloats.length) {
          loopFrame.breakLoop();
          return;
        }
        const continuation = deferredFloats[i++];
        const float = continuation.float;
        const strategy = new PageFloats.PageFloatLayoutStrategyResolver().findByFloat(
          float,
        );
        const pageFloatFragment = strategy.findPageFloatFragment(
          float,
          pageFloatLayoutContext,
        );
        if (pageFloatFragment && pageFloatFragment.hasFloat(float)) {
          loopFrame.continueLoop();
          return;
        } else if (
          pageFloatLayoutContext.isForbidden(float) ||
          pageFloatLayoutContext.hasPrecedingFloatsDeferredToNext(float)
        ) {
          pageFloatLayoutContext.deferPageFloat(continuation);
          loopFrame.breakLoop();
          return;
        }
        column
          .layoutPageFloatInner(continuation, strategy, null, pageFloatFragment)
          .then((success) => {
            if (!success) {
              loopFrame.breakLoop();
              return;
            }
            const parentInvalidated = pageFloatLayoutContext.parent.isInvalidated();
            if (parentInvalidated) {
              loopFrame.breakLoop();
              return;
            } else if (
              pageFloatLayoutContext.isInvalidated() &&
              !parentInvalidated
            ) {
              invalidated = true;
              pageFloatLayoutContext.validate();
            }
            loopFrame.continueLoop();
          });
      })
      .then(() => {
        if (invalidated) {
          pageFloatLayoutContext.invalidate();
        }
        frame.finish(true);
      });
    return frame.result();
  }

  getLastAfterPositionIfDeferredFloatsExists(
    column: LayoutType.Column,
    newPosition: Vtree.ChunkPosition | null,
  ): Vtree.ChunkPosition | null {
    const pageFloatLayoutContext = column.pageFloatLayoutContext;
    const deferredFloats = pageFloatLayoutContext.getPageFloatContinuationsDeferredToNext();
    if (deferredFloats.length > 0) {
      if (column.lastAfterPosition) {
        let result: Vtree.ChunkPosition;
        if (newPosition) {
          // Need overflown footnotes owned by newPosition
          result = newPosition.clone();
          result.primary = column.lastAfterPosition;
        } else {
          result = new Vtree.ChunkPosition(column.lastAfterPosition);
        }
        return result;
      } else {
        Asserts.assert("column.lastAfterPosition === null");
        return null;
      }
    } else {
      return null;
    }
  }

  /**
   * @return holding true
   */
  layoutColumn(
    column: LayoutType.Column,
    flowName: string,
  ): Task.Result<boolean> {
    const flowPosition = this.currentLayoutPosition.flowPositions[flowName];
    if (!flowPosition || !this.matchPageSide(flowPosition.startSide)) {
      return Task.newResult(true);
    }
    flowPosition.startSide = "any";
    this.setFormattingContextToColumn(column, flowName);
    column.init();
    if (this.primaryFlows[flowName] && column.bands.length > 0) {
      // In general, we force non-fitting content. Exception is only for primary
      // flow columns that have exclusions.
      column.forceNonfitting = false;
    }
    const frame: Task.Frame<boolean> = Task.newFrame("layoutColumn");
    this.layoutDeferredPageFloats(column).then(() => {
      if (column.pageFloatLayoutContext.isInvalidated()) {
        frame.finish(true);
        return;
      }

      // Record indices of repeated positions and removed positions
      const repeatedIndices = [] as number[];
      const removedIndices = [] as number[];
      let leadingEdge = true;
      frame
        .loopWithFrame((loopFrame) => {
          if (
            column.pageFloatLayoutContext.hasContinuingFloatFragmentsInFlow(
              flowName,
            )
          ) {
            loopFrame.breakLoop();
            return;
          }
          while (flowPosition.positions.length - removedIndices.length > 0) {
            let index = 0;

            // Skip all removed positions
            while (removedIndices.includes(index)) {
              index++;
            }
            let selected = flowPosition.positions[index];
            if (
              selected.flowChunk.startOffset > this.lookupOffset ||
              this.flowChunkIsAfterParentFlowForcedBreak(selected.flowChunk)
            ) {
              break;
            }
            for (let k = index + 1; k < flowPosition.positions.length; k++) {
              if (removedIndices.includes(k)) {
                continue; // Skip removed positions
              }
              const alt = flowPosition.positions[k];
              if (
                alt.flowChunk.startOffset > this.lookupOffset ||
                this.flowChunkIsAfterParentFlowForcedBreak(alt.flowChunk)
              ) {
                break;
              }
              if (alt.flowChunk.isBetter(selected.flowChunk)) {
                selected = alt;
                index = k;
              }
            }
            const flowChunk = selected.flowChunk;
            let pending = true;
            column
              .layout(
                selected.chunkPosition,
                leadingEdge,
                flowPosition.breakAfter,
              )
              .then((newPosition) => {
                if (column.pageFloatLayoutContext.isInvalidated()) {
                  loopFrame.breakLoop();
                  return;
                }
                leadingEdge = false;

                // static: keep in the flow
                if (
                  selected.flowChunk.repeated &&
                  (newPosition === null || flowChunk.exclusive)
                ) {
                  repeatedIndices.push(index);
                }
                if (flowChunk.exclusive) {
                  // exclusive, only can have one, remove from the flow even
                  // if it did not fit
                  removedIndices.push(index);
                  loopFrame.breakLoop();
                  return;
                } else {
                  // not exclusive
                  const endOfColumn = !!newPosition || !!column.pageBreakType;
                  const lastAfterPosition = this.getLastAfterPositionIfDeferredFloatsExists(
                    column,
                    newPosition,
                  );
                  if (column.pageBreakType && lastAfterPosition) {
                    selected.chunkPosition = lastAfterPosition;

                    // TODO propagate pageBreakType
                    flowPosition.breakAfter = column.pageBreakType;
                    column.pageBreakType = null;
                  } else {
                    // go to the next element in the flow
                    removedIndices.push(index);
                    if (newPosition || lastAfterPosition) {
                      // did not fit completely
                      selected.chunkPosition = newPosition || lastAfterPosition;
                      repeatedIndices.push(index);
                    }
                    if (column.pageBreakType) {
                      // forced break
                      flowPosition.startSide = Break.breakValueToStartSideValue(
                        column.pageBreakType,
                      );
                    }
                  }
                  if (endOfColumn) {
                    loopFrame.breakLoop();
                    return;
                  }
                }

                // Since at least one flowChunk has been placed in the
                // column, the next flowChunk of the flow can be deferred to
                // the next partition if there is not enough space in the
                // current partition.
                column.forceNonfitting = false;
                if (pending) {
                  // Sync result
                  pending = false;
                } else {
                  // Async result
                  loopFrame.continueLoop();
                }
              });
            if (pending) {
              // Async result
              pending = false;
              return;
            }
          }

          // Sync result
          loopFrame.breakLoop();
        })
        .then(() => {
          if (!column.pageFloatLayoutContext.isInvalidated()) {
            // Keep positions repeated or not removed
            flowPosition.positions = flowPosition.positions.filter(
              (pos, i) =>
                repeatedIndices.includes(i) || !removedIndices.includes(i),
            );
            if (flowPosition.breakAfter === "column") {
              flowPosition.breakAfter = null;
            }
            column.saveDistanceToBlockEndFloats();
            const edge = column.pageFloatLayoutContext.getMaxReachedAfterEdge();
            column.updateMaxReachedAfterEdge(edge);
          }
          frame.finish(true);
        });
    });
    return frame.result();
  }

  createLayoutConstraint(
    pageFloatLayoutContext: PageFloats.PageFloatLayoutContext,
  ): LayoutType.LayoutConstraint {
    const pageIndex = this.currentLayoutPosition.page - 1;
    const counterConstraint = this.counterStore.createLayoutConstraint(
      pageIndex,
    );
    return new Layout.AllLayoutConstraint(
      [counterConstraint].concat(pageFloatLayoutContext.getLayoutConstraints()),
    );
  }

  private createAndLayoutColumn(
    boxInstance: PageMaster.PageBoxInstance,
    offsetX: number,
    offsetY: number,
    exclusions: GeometryUtil.Shape[],
    layoutContainer: Vtree.Container,
    currentColumnIndex: number,
    flowNameStr: string,
    regionPageFloatLayoutContext: PageFloats.PageFloatLayoutContext,
    columnCount: number,
    columnGap: number,
    columnWidth: number,
    innerShape: GeometryUtil.Shape,
    layoutContext: Vtree.LayoutContext,
    forceNonFitting: boolean,
  ): Task.Result<LayoutType.Column> {
    const dontApplyExclusions = boxInstance.vertical
      ? boxInstance.isAutoWidth && boxInstance.isRightDependentOnAutoWidth
      : boxInstance.isAutoHeight && boxInstance.isTopDependentOnAutoHeight;
    const boxContainer = layoutContainer.element;
    const columnPageFloatLayoutContext = new PageFloats.PageFloatLayoutContext(
      regionPageFloatLayoutContext,
      PageFloats.FloatReference.COLUMN,
      null,
      flowNameStr,
      null,
      null,
      null,
    );
    const positionAtColumnStart = this.currentLayoutPosition.clone();
    const frame: Task.Frame<LayoutType.Column> = Task.newFrame(
      "createAndLayoutColumn",
    );
    let column: LayoutType.Column;
    frame
      .loopWithFrame((loopFrame) => {
        const layoutConstraint = this.createLayoutConstraint(
          columnPageFloatLayoutContext,
        );
        if (columnCount > 1) {
          const columnContainer = this.viewport.document.createElement("div");
          Base.setCSSProperty(columnContainer, "position", "absolute");
          boxContainer.appendChild(columnContainer);
          column = new Layout.Column(
            columnContainer,
            layoutContext,
            this.clientLayout,
            layoutConstraint,
            columnPageFloatLayoutContext,
          );
          column.forceNonfitting = forceNonFitting;
          column.vertical = layoutContainer.vertical;
          column.snapHeight = layoutContainer.snapHeight;
          column.snapWidth = layoutContainer.snapWidth;
          if (layoutContainer.vertical) {
            const columnY =
              currentColumnIndex * (columnWidth + columnGap) +
              layoutContainer.paddingTop;
            column.setHorizontalPosition(
              layoutContainer.paddingLeft,
              layoutContainer.width,
            );
            column.setVerticalPosition(columnY, columnWidth);
          } else {
            const columnX =
              currentColumnIndex * (columnWidth + columnGap) +
              layoutContainer.paddingLeft;
            column.setVerticalPosition(
              layoutContainer.paddingTop,
              layoutContainer.height,
            );
            column.setHorizontalPosition(columnX, columnWidth);
          }
          column.originX = offsetX;
          column.originY = offsetY;
        } else {
          column = new Layout.Column(
            boxContainer,
            layoutContext,
            this.clientLayout,
            layoutConstraint,
            columnPageFloatLayoutContext,
          );
          column.copyFrom(layoutContainer);
        }
        column.exclusions = dontApplyExclusions ? [] : exclusions.concat();
        column.innerShape = innerShape;
        columnPageFloatLayoutContext.setContainer(column);
        if (column.width >= 0) {
          // column.element.style.outline = "1px dotted green";
          this.layoutColumn(column, flowNameStr).then(() => {
            if (!columnPageFloatLayoutContext.isInvalidated()) {
              columnPageFloatLayoutContext.finish();
            }
            if (
              column.pageFloatLayoutContext.isInvalidated() &&
              !regionPageFloatLayoutContext.isInvalidated()
            ) {
              column.pageFloatLayoutContext.validate();
              this.currentLayoutPosition = positionAtColumnStart.clone();
              if (column.element !== boxContainer) {
                boxContainer.removeChild(column.element);
              }
              loopFrame.continueLoop();
            } else {
              loopFrame.breakLoop();
            }
          });
        } else {
          columnPageFloatLayoutContext.finish();
          loopFrame.breakLoop();
        }
      })
      .then(() => {
        frame.finish(column);
      });
    return frame.result();
  }

  setPagePageFloatLayoutContextContainer(
    pagePageFloatLayoutContext: PageFloats.PageFloatLayoutContext,
    boxInstance: PageMaster.PageBoxInstance,
    layoutContainer: Vtree.Container,
  ) {
    if (
      boxInstance instanceof CssPage.PageRulePartitionInstance ||
      (boxInstance instanceof PageMaster.PageMasterInstance &&
        !(boxInstance instanceof CssPage.PageRuleMasterInstance))
    ) {
      pagePageFloatLayoutContext.setContainer(layoutContainer);
    }
  }

  getRegionPageFloatLayoutContext(
    pagePageFloatLayoutContext: PageFloats.PageFloatLayoutContext,
    boxInstance: PageMaster.PageBoxInstance,
    layoutContainer: Vtree.Container,
    flowName: string,
  ): PageFloats.PageFloatLayoutContext {
    Asserts.assert(boxInstance instanceof PageMaster.PartitionInstance);
    const writingMode = boxInstance.getProp(this, "writing-mode") || null;
    const direction = boxInstance.getProp(this, "direction") || null;
    return new PageFloats.PageFloatLayoutContext(
      pagePageFloatLayoutContext,
      PageFloats.FloatReference.REGION,
      layoutContainer,
      flowName,
      null,
      writingMode,
      direction,
    );
  }

  layoutFlowColumnsWithBalancing(
    page: Vtree.Page,
    boxInstance: PageMaster.PageBoxInstance,
    offsetX: number,
    offsetY: number,
    exclusions: GeometryUtil.Shape[],
    pagePageFloatLayoutContext: PageFloats.PageFloatLayoutContext,
    layoutContainer: Vtree.Container,
    flowNameStr: string,
    columnCount: number,
  ): Task.Result<LayoutType.Column[]> {
    const positionAtContainerStart = this.currentLayoutPosition.clone();
    const regionPageFloatLayoutContext = this.getRegionPageFloatLayoutContext(
      pagePageFloatLayoutContext,
      boxInstance,
      layoutContainer,
      flowNameStr,
    );
    let isFirstTime = true;

    const layoutColumns = () => {
      this.currentLayoutPosition = positionAtContainerStart.clone();
      return this.layoutFlowColumns(
        page,
        boxInstance,
        offsetX,
        offsetY,
        exclusions,
        pagePageFloatLayoutContext,
        regionPageFloatLayoutContext,
        layoutContainer,
        flowNameStr,
        columnCount,
        isFirstTime,
      ).thenAsync((columns) => {
        if (columns) {
          return Task.newResult({
            columns,
            position: this.currentLayoutPosition,
          });
        } else {
          return Task.newResult(null);
        }
      });
    };

    return layoutColumns().thenAsync((generatorResult) => {
      if (!generatorResult) {
        return Task.newResult(null);
      }
      if (columnCount <= 1) {
        return Task.newResult(generatorResult.columns);
      }
      const columnFill =
        (boxInstance.getProp(this, "column-fill") as Css.Ident) ||
        Css.ident.balance;
      const flowPosition = this.currentLayoutPosition.flowPositions[
        flowNameStr
      ];
      Asserts.assert(flowPosition);
      const columnBalancer = Columns.createColumnBalancer(
        columnCount,
        columnFill,
        layoutColumns,
        regionPageFloatLayoutContext,
        layoutContainer,
        generatorResult.columns,
        flowPosition,
      );
      if (!columnBalancer) {
        return Task.newResult(generatorResult.columns);
      }
      isFirstTime = false;
      pagePageFloatLayoutContext.lock();
      regionPageFloatLayoutContext.lock();
      return columnBalancer
        .balanceColumns(generatorResult)
        .thenAsync((result) => {
          pagePageFloatLayoutContext.unlock();
          pagePageFloatLayoutContext.validate();
          regionPageFloatLayoutContext.unlock();
          this.currentLayoutPosition = result.position;
          return Task.newResult(result.columns);
        });
    });
  }

  layoutFlowColumns(
    page: Vtree.Page,
    boxInstance: PageMaster.PageBoxInstance,
    offsetX: number,
    offsetY: number,
    exclusions: GeometryUtil.Shape[],
    pagePageFloatLayoutContext: PageFloats.PageFloatLayoutContext,
    regionPageFloatLayoutContext: PageFloats.PageFloatLayoutContext,
    layoutContainer: Vtree.Container,
    flowNameStr: string,
    columnCount: number,
    forceNonFitting: boolean,
  ): Task.Result<LayoutType.Column[] | null> {
    const frame: Task.Frame<LayoutType.Column[] | null> = Task.newFrame(
      "layoutFlowColumns",
    );
    const positionAtContainerStart = this.currentLayoutPosition.clone();
    const columnGap = boxInstance.getPropAsNumber(this, "column-gap");

    // Don't query columnWidth when it's not needed, so that width calculation
    // can be delayed for width: auto columns.
    const columnWidth =
      columnCount > 1
        ? boxInstance.getPropAsNumber(this, "column-width")
        : layoutContainer.width;
    const regionIds = boxInstance.getActiveRegions(this);
    const innerShapeVal = boxInstance.getProp(this, "shape-inside");
    const innerShape = CssProp.toShape(
      innerShapeVal,
      0,
      0,
      layoutContainer.width,
      layoutContainer.height,
      this,
    );
    const layoutContext = new Vgen.ViewFactory(
      flowNameStr,
      this,
      this.viewport,
      this.styler,
      regionIds,
      this.xmldoc,
      this.faces,
      this.style.footnoteProps,
      this,
      page,
      this.customRenderer,
      this.fallbackMap,
      this.documentURLTransformer,
    );
    let columnIndex = 0;
    let column: LayoutType.Column = null;
    let columns: LayoutType.Column[] = [];
    frame
      .loopWithFrame((loopFrame) => {
        this.createAndLayoutColumn(
          boxInstance,
          offsetX,
          offsetY,
          exclusions,
          layoutContainer,
          columnIndex++,
          flowNameStr,
          regionPageFloatLayoutContext,
          columnCount,
          columnGap,
          columnWidth,
          innerShape,
          layoutContext,
          forceNonFitting,
        ).then((c) => {
          if (pagePageFloatLayoutContext.isInvalidated()) {
            columns = null;
            loopFrame.breakLoop();
            return;
          }
          const forcedRegionBreak =
            !!c.pageBreakType && c.pageBreakType !== "column";
          if (
            (forcedRegionBreak || columnIndex === columnCount) &&
            !regionPageFloatLayoutContext.isInvalidated()
          ) {
            regionPageFloatLayoutContext.finish();
          }
          if (regionPageFloatLayoutContext.isInvalidated()) {
            columnIndex = 0;
            this.currentLayoutPosition = positionAtContainerStart.clone();
            regionPageFloatLayoutContext.validate();
            if (regionPageFloatLayoutContext.isLocked()) {
              columns = null;
              loopFrame.breakLoop();
            } else {
              loopFrame.continueLoop();
            }
            return;
          }
          column = c;
          columns[columnIndex - 1] = column;
          if (column.pageBreakType) {
            if (column.pageBreakType != "column") {
              // skip remaining columns
              columnIndex = columnCount;
              if (column.pageBreakType != "region") {
                // skip remaining regions
                this.pageBreaks[flowNameStr] = true;
              }
            }
          }
          if (columnIndex < columnCount) {
            loopFrame.continueLoop();
          } else {
            loopFrame.breakLoop();
          }
        });
      })
      .then(() => {
        frame.finish(columns);
      });
    return frame.result();
  }

  /**
   * @return holding true
   */
  layoutContainer(
    page: Vtree.Page,
    boxInstance: PageMaster.PageBoxInstance,
    parentContainer: HTMLElement,
    offsetX: number,
    offsetY: number,
    exclusions: GeometryUtil.Shape[],
    pagePageFloatLayoutContext: PageFloats.PageFloatLayoutContext,
  ): Task.Result<boolean> {
    boxInstance.reset();
    const enabled = boxInstance.getProp(this, "enabled");
    if (enabled && enabled !== Css.ident._true) {
      return Task.newResult(true);
    }
    const frame: Task.Frame<boolean> = Task.newFrame("layoutContainer");
    const wrapFlow = boxInstance.getProp(this, "wrap-flow");
    const dontExclude = wrapFlow === Css.ident.auto;
    const flowName = boxInstance.getProp(this, "flow-from");
    const boxContainer = this.viewport.document.createElement("div");
    const position = boxInstance.getProp(this, "position");
    Base.setCSSProperty(
      boxContainer,
      "position",
      position ? (position as any).name : "absolute",
    );

    // The -epubx-page-master partitions are laid out in the reverse order
    // (see the spec http://idpf.org/epub/pgt/ ),
    // but for css-page rules, now use forward order, i.e., the page-area first.
    // This is necessary for running headers named strings support.
    const forwardOrderInLayout =
      boxInstance instanceof CssPage.PageRuleMasterInstance;
    const forwardOrderInTree =
      boxInstance instanceof PageMaster.PartitionInstance;

    if (forwardOrderInTree) {
      parentContainer.appendChild(boxContainer);
    } else {
      parentContainer.insertBefore(boxContainer, parentContainer.firstChild);
    }

    let layoutContainer = new Vtree.Container(boxContainer);
    layoutContainer.vertical = boxInstance.vertical;
    layoutContainer.exclusions = exclusions;
    boxInstance.prepareContainer(
      this,
      layoutContainer,
      page,
      this.faces,
      this.clientLayout,
    );
    layoutContainer.originX = offsetX;
    layoutContainer.originY = offsetY;
    offsetX +=
      layoutContainer.left +
      layoutContainer.marginLeft +
      layoutContainer.borderLeft;
    offsetY +=
      layoutContainer.top +
      layoutContainer.marginTop +
      layoutContainer.borderTop;
    this.setPagePageFloatLayoutContextContainer(
      pagePageFloatLayoutContext,
      boxInstance,
      layoutContainer,
    );
    let cont: Task.Result<boolean>;
    let removed = false;
    if (!flowName || !flowName.isIdent()) {
      const contentVal = boxInstance.getProp(this, "content");
      if (contentVal && Vtree.nonTrivialContent(contentVal)) {
        let innerContainerTag = "span";
        if ((contentVal as any).url) {
          innerContainerTag = "img";
        }
        const innerContainer = this.viewport.document.createElement(
          innerContainerTag,
        );
        contentVal.visit(
          new Vtree.ContentPropertyHandler(
            innerContainer,
            this,
            contentVal,
            this.counterStore.getExprContentListener(),
          ),
        );
        boxContainer.appendChild(innerContainer);
        if (innerContainerTag == "img") {
          boxInstance.transferSinglUriContentProps(
            this,
            innerContainer,
            this.faces,
          );
        }
        boxInstance.transferContentProps(
          this,
          layoutContainer,
          page,
          this.faces,
        );
      } else if (boxInstance.suppressEmptyBoxGeneration) {
        parentContainer.removeChild(boxContainer);
        removed = true;
      }
      if (!removed) {
        boxInstance.finishContainer(
          this,
          layoutContainer,
          page,
          null,
          1,
          this.clientLayout,
          this.faces,
        );
      }
      cont = Task.newResult(true);
    } else if (!this.pageBreaks[flowName.toString()]) {
      const innerFrame: Task.Frame<boolean> = Task.newFrame(
        "layoutContainer.inner",
      );
      const flowNameStr = flowName.toString();

      // for now only a single column in vertical case
      const columnCount = boxInstance.getPropAsNumber(this, "column-count");
      this.layoutFlowColumnsWithBalancing(
        page,
        boxInstance,
        offsetX,
        offsetY,
        exclusions,
        pagePageFloatLayoutContext,
        layoutContainer,
        flowNameStr,
        columnCount,
      ).then((columns) => {
        if (!pagePageFloatLayoutContext.isInvalidated()) {
          const column = columns[0];
          Asserts.assert(column);
          if (column.element === boxContainer) {
            layoutContainer = column;
          }
          layoutContainer.computedBlockSize = Math.max.apply(
            null,
            columns.map((c) => c.computedBlockSize),
          );
          boxInstance.finishContainer(
            this,
            layoutContainer,
            page,
            column,
            columnCount,
            this.clientLayout,
            this.faces,
          );
          const flowPosition = this.currentLayoutPosition.flowPositions[
            flowNameStr
          ];
          if (flowPosition && flowPosition.breakAfter === "region") {
            flowPosition.breakAfter = null;
          }
        }
        innerFrame.finish(true);
      });
      cont = innerFrame.result();
    } else {
      if (!pagePageFloatLayoutContext.isInvalidated()) {
        boxInstance.finishContainer(
          this,
          layoutContainer,
          page,
          null,
          1,
          this.clientLayout,
          this.faces,
        );
      }
      cont = Task.newResult(true);
    }
    cont.then(() => {
      if (pagePageFloatLayoutContext.isInvalidated()) {
        frame.finish(true);
        return;
      }
      if (
        !boxInstance.isAutoHeight ||
        Math.floor(layoutContainer.computedBlockSize) > 0
      ) {
        if (!removed && !dontExclude) {
          const outerShapeProp = boxInstance.getProp(this, "shape-outside");
          const outerShape = layoutContainer.getOuterShape(
            outerShapeProp,
            this,
          );

          // Though it seems that LShapeFloatBug still exists in Firefox, it
          // apparently does not occur on exclusion floats. See the test file:
          // test/files/column-break-bug.html
          // if (Base.checkLShapeFloatBug(this.viewport.root)) {
          // 	// Simplistic bug workaround: add a copy of the shape translated up.
          //     exclusions.push(outerShape.withOffset(0, -1.25 * this.queryUnitSize("em", false)));
          // }
          exclusions.push(outerShape);
        }
      } else if (boxInstance.children.length == 0) {
        parentContainer.removeChild(boxContainer);
        frame.finish(true);
        return;
      }
      let i = forwardOrderInLayout ? 0 : boxInstance.children.length - 1;
      frame
        .loop(() => {
          while (i >= 0 && i < boxInstance.children.length) {
            const child =
              boxInstance.children[forwardOrderInLayout ? i++ : i--];
            const r = this.layoutContainer(
              page,
              child,
              boxContainer as HTMLElement,
              offsetX,
              offsetY,
              exclusions,
              pagePageFloatLayoutContext,
            );
            if (r.isPending()) {
              return r.thenAsync(() =>
                Task.newResult(!pagePageFloatLayoutContext.isInvalidated()),
              );
            } else if (pagePageFloatLayoutContext.isInvalidated()) {
              break;
            }
          }
          return Task.newResult(false);
        })
        .then(() => {
          frame.finish(true);
        });
    });
    return frame.result();
  }

  processLinger(): void {
    const pageNumber = this.currentLayoutPosition.page;
    for (const flowName in this.currentLayoutPosition.flowPositions) {
      const flowPosition = this.currentLayoutPosition.flowPositions[flowName];
      for (let i = flowPosition.positions.length - 1; i >= 0; i--) {
        const pos = flowPosition.positions[i];
        if (
          pos.flowChunk.startPage >= 0 &&
          pos.flowChunk.startPage + pos.flowChunk.linger - 1 <= pageNumber
        ) {
          flowPosition.positions.splice(i, 1);
        }
      }
    }
  }

  initLingering(): void {
    const pageNumber = this.currentLayoutPosition.page;
    for (const flowName in this.currentLayoutPosition.flowPositions) {
      const flowPosition = this.currentLayoutPosition.flowPositions[flowName];
      for (let i = flowPosition.positions.length - 1; i >= 0; i--) {
        const pos = flowPosition.positions[i];
        if (
          pos.flowChunk.startPage < 0 &&
          pos.flowChunk.startOffset < this.lookupOffset
        ) {
          pos.flowChunk.startPage = pageNumber;
        }
      }
    }
  }

  noMorePrimaryFlows(cp: Vtree.LayoutPosition): boolean {
    for (const flowName in this.primaryFlows) {
      const flowPosition = cp.flowPositions[flowName];
      if (flowPosition && flowPosition.positions.length > 0) {
        return false;
      }
    }
    return true;
  }

  layoutNextPage(
    page: Vtree.Page,
    cp?: Vtree.LayoutPosition,
  ): Task.Result<Vtree.LayoutPosition> {
    // TOC box is special page container, no pagination
    const isTocBox = page.container === page.bleedBox;

    this.pageBreaks = {};
    if (cp) {
      this.currentLayoutPosition = cp.clone();
      this.styler.replayFlowElementsFromOffset(cp.highestSeenOffset);
    } else {
      this.currentLayoutPosition = new Vtree.LayoutPosition();
      this.styler.replayFlowElementsFromOffset(-1);
    }
    if (this.lang) {
      page.bleedBox.setAttribute("lang", this.lang);
    }
    cp = this.currentLayoutPosition;
    cp.page++;
    this.clearScope(this.style.pageScope);
    this.layoutPositionAtPageStart = cp.clone();

    // Resolve page size before page master selection.
    const cascadedPageStyle = isTocBox
      ? ({} as CssCascade.ElementStyle)
      : this.pageManager.getCascadedPageStyle();
    const pageMaster = this.selectPageMaster(cascadedPageStyle);
    if (!pageMaster) {
      // end of primary content
      return Task.newResult(null as Vtree.LayoutPosition);
    }
    let bleedBoxPaddingEdge = 0;
    if (!isTocBox) {
      page.setAutoPageWidth(
        pageMaster.pageBox.specified["width"].value === Css.fullWidth,
      );
      page.setAutoPageHeight(
        pageMaster.pageBox.specified["height"].value === Css.fullHeight,
      );
      this.counterStore.setCurrentPage(page);
      this.counterStore.updatePageCounters(cascadedPageStyle, this);

      // setup bleed area and crop marks
      const evaluatedPageSizeAndBleed = CssPage.evaluatePageSizeAndBleed(
        CssPage.resolvePageSizeAndBleed(cascadedPageStyle as any),
        this,
      );
      this.setPageSizeAndBleed(evaluatedPageSizeAndBleed, page);
      CssPage.addPrinterMarks(
        cascadedPageStyle,
        evaluatedPageSizeAndBleed,
        page,
        this,
      );
      bleedBoxPaddingEdge =
        evaluatedPageSizeAndBleed.bleedOffset + evaluatedPageSizeAndBleed.bleed;
    }

    const writingMode =
      (!isTocBox && pageMaster.getProp(this, "writing-mode")) ||
      Css.ident.horizontal_tb;

    this.pageVertical = writingMode != Css.ident.horizontal_tb;

    const direction = pageMaster.getProp(this, "direction") || Css.ident.ltr;
    const pageFloatLayoutContext = new PageFloats.PageFloatLayoutContext(
      this.rootPageFloatLayoutContext,
      PageFloats.FloatReference.PAGE,
      null,
      null,
      null,
      writingMode,
      direction,
    );
    const frame: Task.Frame<Vtree.LayoutPosition> = Task.newFrame(
      "layoutNextPage",
    );
    frame
      .loopWithFrame((loopFrame) => {
        // this.layoutContainer(page, pageMaster, page.bleedBox, bleedBoxPaddingEdge, bleedBoxPaddingEdge+1, // Compensate 'top: -1px' on page master
        this.layoutContainer(
          page,
          pageMaster,
          page.bleedBox,
          bleedBoxPaddingEdge,
          bleedBoxPaddingEdge,
          [],
          pageFloatLayoutContext,
        ).then(() => {
          if (!pageFloatLayoutContext.isInvalidated()) {
            pageFloatLayoutContext.finish();
          }
          if (pageFloatLayoutContext.isInvalidated()) {
            this.currentLayoutPosition = this.layoutPositionAtPageStart.clone();
            pageFloatLayoutContext.validate();
            loopFrame.continueLoop();
          } else {
            loopFrame.breakLoop();
          }
        });
      })
      .then(() => {
        pageMaster.adjustPageLayout(this, page, this.clientLayout);
        if (!isTocBox) {
          const isLeftPage = new Exprs.Named(
            pageMaster.pageBox.scope,
            "left-page",
          );
          page.side = isLeftPage.evaluate(this)
            ? Constants.PageSide.LEFT
            : Constants.PageSide.RIGHT;
          this.processLinger();
          cp = this.currentLayoutPosition;
          Object.keys(cp.flowPositions).forEach((flowName) => {
            const flowPosition = cp.flowPositions[flowName];
            const breakAfter = flowPosition.breakAfter;
            if (
              breakAfter &&
              (breakAfter === "page" || !this.matchPageSide(breakAfter))
            ) {
              flowPosition.breakAfter = null;
            }
          });
        }
        this.currentLayoutPosition = this.layoutPositionAtPageStart = null;
        cp.highestSeenOffset = this.styler.getReachedOffset();
        const triggers = this.style.store.getTriggersForDoc(this.xmldoc);
        page.finish(triggers, this.clientLayout);
        if (this.noMorePrimaryFlows(cp)) {
          cp = null;
        }
        frame.finish(cp);
      });
    return frame.result();
  }

  /**
   * Set actual page width, height and bleed from style specified in page
   * context.
   */
  private setPageSizeAndBleed(
    evaluatedPageSizeAndBleed: CssPage.EvaluatedPageSizeAndBleed,
    page: Vtree.Page,
  ) {
    this.actualPageWidth = evaluatedPageSizeAndBleed.pageWidth;
    this.actualPageHeight = evaluatedPageSizeAndBleed.pageHeight;
    this.pageSheetWidth =
      evaluatedPageSizeAndBleed.pageWidth +
      evaluatedPageSizeAndBleed.cropOffset * 2;
    this.pageSheetHeight =
      evaluatedPageSizeAndBleed.pageHeight +
      evaluatedPageSizeAndBleed.cropOffset * 2;
    page.container.style.width = `${this.pageSheetWidth}px`;
    page.container.style.height = `${this.pageSheetHeight}px`;
    page.bleedBox.style.left = `${evaluatedPageSizeAndBleed.bleedOffset}px`;
    page.bleedBox.style.right = `${evaluatedPageSizeAndBleed.bleedOffset}px`;
    page.bleedBox.style.top = `${evaluatedPageSizeAndBleed.bleedOffset}px`;
    page.bleedBox.style.bottom = `${evaluatedPageSizeAndBleed.bleedOffset}px`;
    page.bleedBox.style.padding = `${evaluatedPageSizeAndBleed.bleed}px`;

    // Shift 1px to workaround Chrome printing bug (Canceled because of another Chrome problem)
    // page.bleedBox.style.paddingTop = `${evaluatedPageSizeAndBleed.bleed+1}px`;

    // Shift 0.01px to workaround Firefox printing problem
    // (This small value (< 1/64 px) has no effect to Chrome)
    page.bleedBox.style.paddingTop = `${
      evaluatedPageSizeAndBleed.bleed + 0.01
    }px`;
  }
}

export class BaseParserHandler extends CssCascade.CascadeParserHandler {
  insideRegion: boolean = false;

  constructor(
    public masterHandler: StyleParserHandler,
    condition: Exprs.Val,
    parent: BaseParserHandler,
    regionId: string | null,
  ) {
    super(
      masterHandler.rootScope,
      masterHandler,
      condition,
      parent,
      regionId,
      masterHandler.validatorSet,
      !parent,
    );
  }

  /**
   * @override
   */
  startPageTemplateRule(): void {}

  /**
   * @override
   */
  startPageMasterRule(
    name: string | null,
    pseudoName: string | null,
    classes: string[],
  ): void {
    const pageMaster = new PageMaster.PageMaster(
      this.masterHandler.pageScope,
      name,
      pseudoName,
      classes,
      this.masterHandler.rootBox,
      this.condition,
      this.owner.getBaseSpecificity(),
    );
    this.masterHandler.pushHandler(
      new PageMaster.PageMasterParserHandler(
        pageMaster.scope,
        this.masterHandler,
        pageMaster,
        this.validatorSet,
      ),
    );
  }

  /**
   * @override
   */
  startWhenRule(expr: Css.Expr): void {
    let condition = expr.expr;
    if (this.condition != null) {
      condition = Exprs.and(this.scope, this.condition, condition);
    }
    this.masterHandler.pushHandler(
      new BaseParserHandler(this.masterHandler, condition, this, this.regionId),
    );
  }

  /**
   * @override
   */
  startDefineRule(): void {
    this.masterHandler.pushHandler(
      new CssCascade.DefineParserHandler(this.scope, this.owner),
    );
  }

  /**
   * @override
   */
  startFontFaceRule(): void {
    const properties = {} as CssCascade.ElementStyle;
    this.masterHandler.fontFaces.push({
      properties,
      condition: this.condition,
    });
    this.masterHandler.pushHandler(
      new CssCascade.PropSetParserHandler(
        this.scope,
        this.owner,
        null,
        properties,
        this.masterHandler.validatorSet,
      ),
    );
  }

  /**
   * @override
   */
  startFlowRule(flowName: string): void {
    let style = this.masterHandler.flowProps[flowName];
    if (!style) {
      style = {} as CssCascade.ElementStyle;
      this.masterHandler.flowProps[flowName] = style;
    }
    this.masterHandler.pushHandler(
      new CssCascade.PropSetParserHandler(
        this.scope,
        this.owner,
        null,
        style,
        this.masterHandler.validatorSet,
      ),
    );
  }

  /**
   * @override
   */
  startViewportRule(): void {
    const viewportProps = {} as CssCascade.ElementStyle;
    this.masterHandler.viewportProps.push(viewportProps);
    this.masterHandler.pushHandler(
      new CssCascade.PropSetParserHandler(
        this.scope,
        this.owner,
        this.condition,
        viewportProps,
        this.masterHandler.validatorSet,
      ),
    );
  }

  /**
   * @override
   */
  startFootnoteRule(pseudoelem: string | null): void {
    let style = this.masterHandler.footnoteProps;
    if (pseudoelem) {
      const pseudos = CssCascade.getMutableStyleMap(style, "_pseudos");
      style = pseudos[pseudoelem];
      if (!style) {
        style = {} as CssCascade.ElementStyle;
        pseudos[pseudoelem] = style;
      }
    }
    this.masterHandler.pushHandler(
      new CssCascade.PropSetParserHandler(
        this.scope,
        this.owner,
        null,
        style,
        this.masterHandler.validatorSet,
      ),
    );
  }

  /**
   * @override
   */
  startRegionRule(): void {
    this.insideRegion = true;
    this.startSelectorRule();
  }

  /**
   * @override
   */
  startPageRule(): void {
    const pageHandler = new CssPage.PageParserHandler(
      this.masterHandler.pageScope,
      this.masterHandler,
      this,
      this.validatorSet,
      this.masterHandler.pageProps,
    );
    this.masterHandler.pushHandler(pageHandler);
    pageHandler.startPageRule();
  }

  /**
   * @override
   */
  startRuleBody(): void {
    CssCascade.CascadeParserHandler.prototype.startRuleBody.call(this);
    if (this.insideRegion) {
      this.insideRegion = false;
      const regionId = `R${this.masterHandler.regionCount++}`;
      this.special("region-id", Css.getName(regionId));
      this.endRule();
      const regionHandler = new BaseParserHandler(
        this.masterHandler,
        this.condition,
        this,
        regionId,
      );
      this.masterHandler.pushHandler(regionHandler);
      regionHandler.startRuleBody();
    }
  }
}

// override, so we don't register an error
export function processViewportMeta(meta: Element): string {
  let content = meta.getAttribute("content");
  if (!content) {
    return "";
  }
  const vals = {};
  let r: RegExpMatchArray;
  while (
    (r = content.match(
      /^,?\s*([-A-Za-z_.][-A-Za-z_0-9.]*)\s*=\s*([-+A-Za-z_0-9.]*)\s*/,
    )) != null
  ) {
    content = content.substr(r[0].length);
    vals[r[1]] = r[2];
  }
  const width = vals["width"] - 0;
  const height = vals["height"] - 0;
  if (width && height) {
    return `@-epubx-viewport{width:${width}px;height:${height}px;}`;
  }
  return "";
}

export class StyleParserHandler extends CssParser.DispatchParserHandler {
  rootScope: Exprs.LexicalScope;
  pageScope: Exprs.LexicalScope;
  rootBox: PageMaster.RootPageBox;
  cascadeParserHandler: BaseParserHandler;
  regionCount: number = 0;
  fontFaces = [] as FontFace[];
  footnoteProps = {} as CssCascade.ElementStyle;
  flowProps = {} as { [key: string]: CssCascade.ElementStyle };
  viewportProps = [] as CssCascade.ElementStyle[];
  pageProps = {} as { [key: string]: CssCascade.ElementStyle };
  slave: BaseParserHandler;

  constructor(public readonly validatorSet: CssValidator.ValidatorSet) {
    super();
    this.rootScope = new Exprs.LexicalScope(null);
    this.pageScope = new Exprs.LexicalScope(this.rootScope);
    this.rootBox = new PageMaster.RootPageBox(this.rootScope);
    this.cascadeParserHandler = new BaseParserHandler(this, null, null, null);
    this.slave = this.cascadeParserHandler;
  }

  /**
   * @override
   */
  error(mnemonics: string, token: CssTokenizer.Token): void {
    Logging.logger.warn("CSS parser:", mnemonics);
  }
}

export type StyleSource = {
  url: string;
  text: string | null;
  flavor: CssParser.StylesheetFlavor;
  classes: string | null;
  media: string | null;
};

export function parseOPSResource(
  response: Net.Response,
  store: XmlDoc.XMLDocStore,
): Task.Result<XmlDoc.XMLDocHolder> {
  return (store as OPSDocStore).parseOPSResource(response);
}

export class OPSDocStore extends Net.ResourceStore<XmlDoc.XMLDocHolder> {
  styleByKey: { [key: string]: Style } = {};
  styleFetcherByKey: { [key: string]: TaskUtil.Fetcher<Style> } = {};
  styleByDocURL: { [key: string]: Style } = {};
  triggersByDocURL: { [key: string]: Vtree.Trigger[] } = {};
  validatorSet: CssValidator.ValidatorSet = null;
  private styleSheets: StyleSource[] = [];
  private triggerSingleDocumentPreprocessing: boolean = false;

  constructor(
    public fontDeobfuscator:
      | ((p1: string) => ((p1: Blob) => Task.Result<Blob>) | null)
      | null,
  ) {
    super(parseOPSResource, Net.XMLHttpRequestResponseType.DOCUMENT);
  }

  init(
    authorStyleSheets: { url: string | null; text: string | null }[] | null,
    userStyleSheets: { url: string | null; text: string | null }[] | null,
  ): Task.Result<boolean> {
    this.setStyleSheets(authorStyleSheets as any, userStyleSheets as any);
    const userAgentXML = Base.resolveURL(
      "user-agent.xml",
      Base.resourceBaseURL,
    );
    const frame = Task.newFrame<boolean>("OPSDocStore.init");
    this.validatorSet = CssValidator.baseValidatorSet();
    loadUABase().then(() => {
      this.load(userAgentXML).then(() => {
        this.triggerSingleDocumentPreprocessing = true;
        frame.finish(true);
      });
    });
    return frame.result();
  }

  getStyleForDoc(xmldoc: XmlDoc.XMLDocHolder): Style {
    return this.styleByDocURL[xmldoc.url];
  }

  getTriggersForDoc(xmldoc: XmlDoc.XMLDocHolder): Vtree.Trigger[] {
    return this.triggersByDocURL[xmldoc.url];
  }

  /**
   * Set author stylesheets and user stylesheets. Existing style sheets are
   * removed.
   */
  private setStyleSheets(
    authorStyleSheets: StyleSource[] | null,
    userStyleSheets: StyleSource[] | null,
  ) {
    this.clearStyleSheets();
    if (authorStyleSheets) {
      authorStyleSheets.forEach(this.addAuthorStyleSheet, this);
    }
    if (userStyleSheets) {
      userStyleSheets.forEach(this.addUserStyleSheet, this);
    }
  }

  private clearStyleSheets() {
    this.styleSheets.splice(0);
  }

  private addAuthorStyleSheet(stylesheet: StyleSource) {
    let url = stylesheet.url;
    if (url) {
      url = Base.resolveURL(Base.convertSpecialURL(url), Base.baseURL);
    }
    this.styleSheets.push({
      url,
      text: stylesheet.text,
      flavor: CssParser.StylesheetFlavor.AUTHOR,
      classes: null,
      media: null,
    });
  }

  private addUserStyleSheet(stylesheet: StyleSource) {
    let url = stylesheet.url;
    if (url) {
      url = Base.resolveURL(Base.convertSpecialURL(url), Base.baseURL);
    }
    this.styleSheets.push({
      url,
      text: stylesheet.text,
      flavor: CssParser.StylesheetFlavor.USER,
      classes: null,
      media: null,
    });
  }

  parseOPSResource(response: Net.Response): Task.Result<XmlDoc.XMLDocHolder> {
    const frame: Task.Frame<XmlDoc.XMLDocHolder> = Task.newFrame(
      "OPSDocStore.load",
    );
    const url = response.url;

    // Hack for TOCView.showTOC()
    const isTocBox = url.endsWith("?viv-toc-box");

    XmlDoc.parseXMLResource(response, this).then(
      (xmldoc: XmlDoc.XMLDocHolder) => {
        if (!xmldoc) {
          frame.finish(null);
          return;
        }
        if (this.triggerSingleDocumentPreprocessing) {
          const hooks: Plugin.PreProcessSingleDocumentHook[] = Plugin.getHooksForName(
            Plugin.HOOKS.PREPROCESS_SINGLE_DOCUMENT,
          );
          for (let i = 0; i < hooks.length; i++) {
            try {
              hooks[i](xmldoc.document);
            } catch (e) {
              Logging.logger.warn(
                "Error during single document preprocessing:",
                e,
              );
            }
          }
        }
        const triggers = [];
        const triggerList = xmldoc.document.getElementsByTagNameNS(
          Base.NS.epub,
          "trigger",
        );
        for (let i = 0; i < triggerList.length; i++) {
          const triggerElem = triggerList[i];
          const observer = triggerElem.getAttributeNS(Base.NS.EV, "observer");
          const event = triggerElem.getAttributeNS(Base.NS.EV, "event");
          const action = triggerElem.getAttribute("action");
          const ref = triggerElem.getAttribute("ref");
          if (observer && event && action && ref) {
            triggers.push({ observer, event, action, ref });
          }
        }
        this.triggersByDocURL[url] = triggers;
        const sources = [] as StyleSource[];
        const userAgentURL = Base.resolveURL(
          "user-agent-page.css",
          Base.resourceBaseURL,
        );
        sources.push({
          url: userAgentURL,
          text: UserAgentPageCss,
          flavor: CssParser.StylesheetFlavor.USER_AGENT,
          classes: null,
          media: null,
        });
        if (!isTocBox) {
          const elemList = xmldoc.document.querySelectorAll(
            "style, link, meta",
          );
          for (const elem of elemList) {
            const ns = elem.namespaceURI;
            const localName = elem.localName;
            if (ns == Base.NS.XHTML) {
              if (localName == "style") {
                const classes = elem.getAttribute("class");
                const media = elem.getAttribute("media");
                const title = elem.getAttribute("title");
                sources.push({
                  url,
                  text: elem.textContent,
                  flavor: CssParser.StylesheetFlavor.AUTHOR,
                  classes: title ? classes : null,
                  media,
                });
              } else if (localName == "link") {
                const rel = elem.getAttribute("rel");
                const classes = elem.getAttribute("class");
                const media = elem.getAttribute("media");
                if (
                  rel == "stylesheet" ||
                  (rel == "alternate stylesheet" && classes)
                ) {
                  let src = elem.getAttribute("href");
                  src = Base.resolveURL(src, url);
                  const title = elem.getAttribute("title");
                  sources.push({
                    url: src,
                    text: null,
                    classes: title ? classes : null,
                    media,
                    flavor: CssParser.StylesheetFlavor.AUTHOR,
                  });
                }
              } else if (
                localName == "meta" &&
                elem.getAttribute("name") == "viewport"
              ) {
                sources.push({
                  url,
                  text: processViewportMeta(elem),
                  flavor: CssParser.StylesheetFlavor.AUTHOR,
                  classes: null,
                  media: null,
                });
              }
            }
          }
          for (let i = 0; i < this.styleSheets.length; i++) {
            sources.push(this.styleSheets[i]);
          }
        }
        let key = "";
        for (let i = 0; i < sources.length; i++) {
          key += sources[i].url;
          key += "^";
          if (sources[i].text) {
            key += sources[i].text;
          }
          key += "^";
        }
        let style = this.styleByKey[key];
        if (style) {
          this.styleByDocURL[url] = style;
          frame.finish(xmldoc);
          return;
        }
        let fetcher = this.styleFetcherByKey[key];
        if (!fetcher) {
          fetcher = new TaskUtil.Fetcher(() => {
            const innerFrame: Task.Frame<Style> = Task.newFrame(
              "fetchStylesheet",
            );
            let index = 0;
            const sph = new StyleParserHandler(this.validatorSet);
            innerFrame
              .loop(() => {
                if (index < sources.length) {
                  const source = sources[index++];
                  sph.startStylesheet(source.flavor);
                  if (source.text !== null) {
                    return CssParser.parseStylesheetFromText(
                      source.text,
                      sph,
                      source.url,
                      source.classes,
                      source.media,
                    ).thenReturn(true);
                  } else {
                    return CssParser.parseStylesheetFromURL(
                      source.url,
                      sph,
                      source.classes,
                      source.media,
                    );
                  }
                }
                return Task.newResult(false);
              })
              .then(() => {
                const cascade = sph.cascadeParserHandler.finish();
                style = new Style(
                  this,
                  sph.rootScope,
                  sph.pageScope,
                  cascade,
                  sph.rootBox,
                  sph.fontFaces,
                  sph.footnoteProps,
                  sph.flowProps,
                  sph.viewportProps,
                  sph.pageProps,
                );
                this.styleByKey[key] = style;
                delete this.styleFetcherByKey[key];
                innerFrame.finish(style);
              });
            return innerFrame.result();
          }, `FetchStylesheet ${url}`);
          this.styleFetcherByKey[key] = fetcher;
          fetcher.start();
        }
        fetcher.get().then((style) => {
          this.styleByDocURL[url] = style;
          frame.finish(xmldoc);
        });
      },
    );
    return frame.result();
  }
}
