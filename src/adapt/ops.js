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
 * @fileoverview Render EPUB content files by applying page masters, styling and layout.
 */
goog.provide('adapt.ops');

goog.require("goog.asserts");
goog.require("vivliostyle.constants");
goog.require("vivliostyle.logging");
goog.require('adapt.task');
goog.require('adapt.geom');
goog.require('adapt.expr');
goog.require('adapt.css');
goog.require('adapt.csstok');
goog.require('adapt.cssparse');
goog.require('adapt.cssvalid');
goog.require('adapt.csscasc');
goog.require('adapt.cssstyler');
goog.require('adapt.pm');
goog.require('vivliostyle.counters');
goog.require('adapt.vtree');
goog.require('vivliostyle.pagefloat');
goog.require('adapt.layout');
goog.require('adapt.vgen');
goog.require('adapt.xmldoc');
goog.require('adapt.font');
goog.require('vivliostyle.break');
goog.require('vivliostyle.page');
goog.require('vivliostyle.column');

/**
 * @type {adapt.taskutil.Fetcher.<boolean>}
 */
adapt.ops.uaStylesheetBaseFetcher = new adapt.taskutil.Fetcher(() => {
    /** @type {!adapt.task.Frame.<boolean>} */ const frame =
        adapt.task.newFrame("uaStylesheetBase");
    adapt.cssvalid.loadValidatorSet().then(validatorSet => {
        const url = adapt.base.resolveURL("user-agent-base.css", adapt.base.resourceBaseURL);
        const handler = new adapt.csscasc.CascadeParserHandler(null, null, null, null, null,
            validatorSet, true);
        handler.startStylesheet(adapt.cssparse.StylesheetFlavor.USER_AGENT);
        adapt.csscasc.uaBaseCascade = handler.cascade;
        adapt.cssparse.parseStylesheetFromURL(url, handler, null, null).thenFinish(frame);
    });
    return frame.result();
}, "uaStylesheetBaseFetcher");

/**
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.ops.loadUABase = () => adapt.ops.uaStylesheetBaseFetcher.get();



/**
 * @typedef {{properties:adapt.csscasc.ElementStyle,condition:adapt.expr.Val}}
 */
adapt.ops.FontFace;

/**
 * @param {adapt.ops.OPSDocStore} store
 * @param {adapt.expr.LexicalScope} rootScope
 * @param {adapt.expr.LexicalScope} pageScope
 * @param {adapt.csscasc.Cascade} cascade
 * @param {!adapt.pm.RootPageBox} rootBox
 * @param {Array.<adapt.ops.FontFace>} fontFaces
 * @param {adapt.csscasc.ElementStyle} footnoteProps
 * @param {Object.<string,adapt.csscasc.ElementStyle>} flowProps
 * @param {Array.<adapt.csscasc.ElementStyle>} viewportProps
 * @param {!Object.<string,!adapt.csscasc.ElementStyle>} pageProps
 * @constructor
 */
adapt.ops.Style = function(store, rootScope, pageScope, cascade, rootBox,
    fontFaces, footnoteProps, flowProps, viewportProps, pageProps) {
    /** @const */ this.store = store;
    /** @const */ this.rootScope = rootScope;
    /** @const */ this.pageScope = pageScope;
    /** @const */ this.cascade = cascade;
    /** @const */ this.rootBox = rootBox;
    /** @const */ this.fontFaces = fontFaces;
    /** @const */ this.fontDeobfuscator = store.fontDeobfuscator;
    /** @const */ this.footnoteProps = footnoteProps;
    /** @const */ this.flowProps = flowProps;
    /** @const */ this.viewportProps = viewportProps;
    /** @const */ this.pageProps = pageProps;
    /** @const */ this.validatorSet = store.validatorSet;
    this.pageScope.defineBuiltIn("has-content", function(name) {
        name = /** @type {string} */ (name);
        const styleInstance = /** @type {adapt.ops.StyleInstance} */ (this);
        const cp = styleInstance.currentLayoutPosition;
        const flowChunk = cp.firstFlowChunkOfFlow(name);
        return styleInstance.matchPageSide(cp.startSideOfFlow(/** @type {string} */ (name))) &&
            cp.hasContent(/** @type {string} */ (name), styleInstance.lookupOffset) &&
            !!flowChunk && !styleInstance.flowChunkIsAfterParentFlowForcedBreak(flowChunk);
    });
    this.pageScope.defineName("page-number", new adapt.expr.Native(this.pageScope, function() {
        const styleInstance = /** @type {adapt.ops.StyleInstance} */ (this);
        return styleInstance.pageNumberOffset + styleInstance.currentLayoutPosition.page;
    }, "page-number"));
};

/**
 * @param {number} viewportWidth
 * @param {number} viewportHeight
 * @param {number} fontSize
 * @param {adapt.expr.Preferences=} pref
 * @return {{width:number, height:number, fontSize:number}}
 */
adapt.ops.Style.prototype.sizeViewport = function(viewportWidth, viewportHeight, fontSize, pref) {
    if (this.viewportProps.length) {
        const context = new adapt.expr.Context(this.rootScope, viewportWidth,
            viewportHeight, fontSize);
        const viewportProps = adapt.csscasc.mergeAll(context, this.viewportProps);
        const width = viewportProps["width"];
        const height = viewportProps["height"];
        const textZoom = viewportProps["text-zoom"];
        let scaleFactor = 1;
        if ((width && height) || textZoom) {
            const defaultFontSize = adapt.expr.defaultUnitSizes["em"];
            const zoomVal = textZoom ? textZoom.evaluate(context, "text-zoom") : null;
            if (zoomVal === adapt.css.ident.scale) {
                scaleFactor = defaultFontSize / fontSize;
                fontSize = defaultFontSize;
                viewportWidth *= scaleFactor;
                viewportHeight *= scaleFactor;
            }
            if (width && height) {
                const widthVal = adapt.css.toNumber(width.evaluate(context, "width"), context);
                const heightVal = adapt.css.toNumber(height.evaluate(context, "height"), context);
                if (widthVal > 0 && heightVal > 0) {
                    const spreadWidth = pref && pref.spreadView ? (widthVal + pref.pageBorder) * 2 : widthVal;
                    return {width:spreadWidth, height:heightVal, fontSize};
                }
            }
        }
    }
    return {width:viewportWidth, height:viewportHeight, fontSize};
};

//-------------------------------------------------------------------------------

/**
 * @param {adapt.ops.Style} style
 * @param {adapt.xmldoc.XMLDocHolder} xmldoc
 * @param {?string} defaultLang
 * @param {adapt.vgen.Viewport} viewport
 * @param {adapt.vtree.ClientLayout} clientLayout
 * @param {adapt.font.Mapper} fontMapper
 * @param {adapt.vgen.CustomRenderer} customRenderer
 * @param {Object.<string,string>} fallbackMap
 * @param {number} pageNumberOffset
 * @param {!adapt.base.DocumentURLTransformer} documentURLTransformer
 * @param {!vivliostyle.counters.CounterStore} counterStore
 * @param {?vivliostyle.constants.PageProgression=} pageProgression
 * @constructor
 * @extends {adapt.expr.Context}
 * @implements {adapt.cssstyler.FlowListener}
 * @implements {adapt.pm.InstanceHolder}
 * @implements {adapt.vgen.StylerProducer}
 */
adapt.ops.StyleInstance = function(style, xmldoc, defaultLang, viewport, clientLayout,
    fontMapper, customRenderer, fallbackMap, pageNumberOffset, documentURLTransformer, counterStore,
    pageProgression) {
    adapt.expr.Context.call(this, style.rootScope, viewport.width, viewport.height, viewport.fontSize);
    /** @const */ this.style = style;
    /** @const */ this.xmldoc = xmldoc;
    /** @const */ this.lang = xmldoc.lang || defaultLang;
    /** @const */ this.viewport = viewport;
    /** @const */ this.primaryFlows = /** @type {Object.<string,boolean>} */ ({ "body": true });
    /** @const */ this.clientLayout = clientLayout;
    /** @type {adapt.pm.RootPageBoxInstance} */ this.rootPageBoxInstance = null;
    /** @type {adapt.cssstyler.Styler} */ this.styler = null;
    /** @type {Object.<string,adapt.cssstyler.Styler>} */ this.stylerMap = null;
    /** @type {adapt.vtree.LayoutPosition} */ this.currentLayoutPosition = null;
    /** @type {adapt.vtree.LayoutPosition} */ this.layoutPositionAtPageStart = null;
    /** @type {number} */ this.lookupOffset = 0;
    /** @const */ this.fontMapper = fontMapper;
    /** @const */ this.faces = new adapt.font.DocumentFaces(this.style.fontDeobfuscator);
    /** @type {Object.<string,adapt.pm.PageBoxInstance>} */ this.pageBoxInstances = {};
    /** @type {vivliostyle.page.PageManager} */ this.pageManager = null;
    /** @const */ this.counterStore = counterStore;
    /** @private @const */ this.rootPageFloatLayoutContext =
        new vivliostyle.pagefloat.PageFloatLayoutContext(null, null, null, null, null, null, null);
    /** @type {!Object.<string,boolean>} */ this.pageBreaks = {};
    /** @type {?vivliostyle.constants.PageProgression} */ this.pageProgression = pageProgression || null;
    /** @const */ this.customRenderer = customRenderer;
    /** @const */ this.fallbackMap = fallbackMap;
    /** @const @type {number} */ this.pageNumberOffset = pageNumberOffset;
    /** @const */ this.documentURLTransformer = documentURLTransformer;
    for (const flowName in style.flowProps) {
        const flowStyle = style.flowProps[flowName];
        const consume = adapt.csscasc.getProp(flowStyle, "flow-consume");
        if (consume) {
            const consumeVal = consume.evaluate(this, "flow-consume");
            if (consumeVal == adapt.css.ident.all) {
                this.primaryFlows[flowName] = true;
            } else {
                delete this.primaryFlows[flowName];
            }
        }
    }

    /** @const {!Object<string, !{width: number, height: number}>} */ this.pageSheetSize = {};
    /** @type {number} */ this.pageSheetHeight = 0;
    /** @type {number} */ this.pageSheetWidth = 0;
};
goog.inherits(adapt.ops.StyleInstance, adapt.expr.Context);

/**
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.ops.StyleInstance.prototype.init = function() {
    const self = this;
    /** @type {!adapt.task.Frame.<boolean>} */ const frame
            = adapt.task.newFrame("StyleInstance.init");
    const counterListener = self.counterStore.createCounterListener(self.xmldoc.url);
    const counterResolver = self.counterStore.createCounterResolver(self.xmldoc.url, self.style.rootScope, self.style.pageScope);
    self.styler = new adapt.cssstyler.Styler(self.xmldoc, self.style.cascade,
        self.style.rootScope, self, this.primaryFlows, self.style.validatorSet, counterListener, counterResolver);
    counterResolver.setStyler(self.styler);
    self.styler.resetFlowChunkStream(self);
    self.stylerMap = {};
    self.stylerMap[self.xmldoc.url] = self.styler;
    const docElementStyle = self.styler.getTopContainerStyle();
    if (!self.pageProgression)
        self.pageProgression = vivliostyle.page.resolvePageProgression(docElementStyle);
    const rootBox = this.style.rootBox;
    this.rootPageBoxInstance = new adapt.pm.RootPageBoxInstance(rootBox);
    const cascadeInstance = this.style.cascade.createInstance(self, counterListener, counterResolver, this.lang);
    this.rootPageBoxInstance.applyCascadeAndInit(cascadeInstance, docElementStyle);
    this.rootPageBoxInstance.resolveAutoSizing(self);
    this.pageManager = new vivliostyle.page.PageManager(cascadeInstance, this.style.pageScope, this.rootPageBoxInstance, self, docElementStyle);
    const srcFaces = /** @type {Array.<adapt.font.Face>} */ ([]);

    for (const fontFace of self.style.fontFaces) {
        if (fontFace.condition && !fontFace.condition.evaluate(self))
            continue;
        const properties = adapt.font.prepareProperties(fontFace.properties, self);
        const srcFace = new adapt.font.Face(properties);
        srcFaces.push(srcFace);
    }

    self.fontMapper.findOrLoadFonts(srcFaces, self.faces).thenFinish(frame);

    // Determine page sheet sizes corresponding to page selectors
    const pageProps = self.style.pageProps;
    Object.keys(pageProps).forEach(function(selector) {
        const pageSizeAndBleed = vivliostyle.page.evaluatePageSizeAndBleed(
            vivliostyle.page.resolvePageSizeAndBleed(pageProps[selector]), this);
        this.pageSheetSize[selector] = {
            width: pageSizeAndBleed.pageWidth + pageSizeAndBleed.cropOffset * 2,
            height: pageSizeAndBleed.pageHeight + pageSizeAndBleed.cropOffset * 2
        };
    }, this);

    return frame.result();
};

/**
 * @override
 */
adapt.ops.StyleInstance.prototype.getStylerForDoc = function(xmldoc) {
    let styler = this.stylerMap[xmldoc.url];
    if (!styler) {
        const style = this.style.store.getStyleForDoc(xmldoc);
        // We need a separate content, so that variables can get potentially different values.
        const context = new adapt.expr.Context(style.rootScope, this.pageWidth(), this.pageHeight(), this.initialFontSize);
        const counterListener = this.counterStore.createCounterListener(xmldoc.url);
        const counterResolver = this.counterStore.createCounterResolver(xmldoc.url, style.rootScope, style.pageScope);
        styler = new adapt.cssstyler.Styler(xmldoc, style.cascade,
            style.rootScope, context, this.primaryFlows, style.validatorSet, counterListener, counterResolver);
        this.stylerMap[xmldoc.url] = styler;
    }
    return styler;
};

/**
 * @override
 */
adapt.ops.StyleInstance.prototype.registerInstance = function(key, instance) {
    this.pageBoxInstances[key] = instance;
};

/**
 * @override
 */
adapt.ops.StyleInstance.prototype.lookupInstance = function(key) {
    return this.pageBoxInstances[key];
};

/**
 * @override
 */
adapt.ops.StyleInstance.prototype.encounteredFlowChunk = function(flowChunk, flow) {
    const cp = this.currentLayoutPosition;
    if (cp) {
        if (!cp.flows[flowChunk.flowName]) {
            cp.flows[flowChunk.flowName] = flow;
        } else {
            flow = cp.flows[flowChunk.flowName];
        }
        let flowPosition = cp.flowPositions[flowChunk.flowName];
        if (!flowPosition) {
            flowPosition = new adapt.vtree.FlowPosition();
            cp.flowPositions[flowChunk.flowName] = flowPosition;
        }
        const nodePosition = adapt.vtree.newNodePositionFromNode(flowChunk.element);
        const chunkPosition = new adapt.vtree.ChunkPosition(nodePosition);
        const flowChunkPosition = new adapt.vtree.FlowChunkPosition(chunkPosition, flowChunk);
        flowPosition.positions.push(flowChunkPosition);
    }
};

/**
 * @param {adapt.vtree.FlowPosition} flowPosition
 * @return {number}
 */
adapt.ops.StyleInstance.prototype.getConsumedOffset = function(flowPosition) {
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
        if (chunkOffset < offset)
            offset = chunkOffset;
    }
    return offset;
};

/**
 * @param {adapt.vtree.LayoutPosition|undefined} layoutPosition
 * @param {boolean=} noLookAhead Do not look ahead elements that are not styled yet
 * @return {number} document offset of the given layoutPosition
 */
adapt.ops.StyleInstance.prototype.getPosition = function(layoutPosition, noLookAhead) {
    if (!layoutPosition)
        return 0;
    let currentPosition = Number.POSITIVE_INFINITY;
    for (const flowName in this.primaryFlows) {
        let flowPosition = layoutPosition.flowPositions[flowName];
        if (!noLookAhead && (!flowPosition || flowPosition.positions.length == 0) && this.currentLayoutPosition) {
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
            if (consumedOffset < currentPosition)
                currentPosition = consumedOffset;
        }
    }
    return currentPosition;
};

adapt.ops.StyleInstance.prototype.dumpLocation = function(position) {
    vivliostyle.logging.logger.debug("Location - page", this.currentLayoutPosition.page);
    vivliostyle.logging.logger.debug("  current:", position);
    vivliostyle.logging.logger.debug("  lookup:", this.lookupOffset);
    for (const flowName in this.currentLayoutPosition.flowPositions) {
        const flowPosition = this.currentLayoutPosition.flowPositions[flowName];

        for (const p of flowPosition.positions) {
            vivliostyle.logging.logger.debug("  Chunk", `${flowName}:`, p.flowChunk.startOffset);
        }
    }
};

/**
 * @param {string} side
 * @returns {boolean}
 */
adapt.ops.StyleInstance.prototype.matchPageSide = function(side) {
    switch (side) {
        case "left":
        case "right":
        case "recto":
        case "verso":
            return (
                /** @type {boolean} */ (new adapt.expr.Named(this.style.pageScope, `${side}-page`).evaluate(this))
            );
        default:
            return true;
    }
};

/**
 * @param {!adapt.vtree.LayoutPosition} layoutPosition
 */
adapt.ops.StyleInstance.prototype.updateStartSide = function(layoutPosition) {
    for (const name in layoutPosition.flowPositions) {
        const flowPos = layoutPosition.flowPositions[name];
        if (flowPos && flowPos.positions.length > 0) {
            const flowChunk = flowPos.positions[0].flowChunk;
            if (this.getConsumedOffset(flowPos) === flowChunk.startOffset) {
                const flowChunkBreakBefore = flowPos.positions[0].flowChunk.breakBefore;
                const flowBreakAfter = vivliostyle.break.startSideValueToBreakValue(flowPos.startSide);
                flowPos.startSide = vivliostyle.break.breakValueToStartSideValue(
                    vivliostyle.break.resolveEffectiveBreakValue(flowBreakAfter, flowChunkBreakBefore));
            }
        }
    }
};

/**
 * @param {!adapt.csscasc.ElementStyle} cascadedPageStyle Cascaded page style specified in page context
 * @return {adapt.pm.PageMasterInstance}
 */
adapt.ops.StyleInstance.prototype.selectPageMaster = function(cascadedPageStyle) {
    const self = this;
    const cp = this.currentLayoutPosition;
    // 3.5. Page Layout Processing Model
    // 1. Determine current position in the document: Find the minimal consumed-offset for all elements
    // not fully-consumed in each primary flow. Current position is maximum of the results among all
    // primary flows.
    const currentPosition = this.getPosition(cp);
    if (currentPosition == Number.POSITIVE_INFINITY) {
        // end of primary content is reached
        return null;
    }
    // 2. Page master selection: for each page master:
    const pageMasters = /** @type {Array.<adapt.pm.PageMasterInstance>} */ (this.rootPageBoxInstance.children);
    let pageMaster;
    for (let i = 0; i < pageMasters.length; i++) {
        pageMaster = pageMasters[i];
        // Skip a page master generated for @page rules
        if (pageMaster.pageBox.pseudoName === vivliostyle.page.pageRuleMasterPseudoName)
            continue;
        let coeff = 1;
        // A. Calculate lookup position using current position and utilization
        // (see -epubx-utilization property)
        const utilization = pageMaster.getProp(self, "utilization");
        if (utilization && utilization.isNum())
            coeff = (/** @type {adapt.css.Num} */ (utilization)).num;
        const em = self.queryUnitSize("em", false);
        const pageArea = self.pageWidth() * self.pageHeight();
        const lookup = Math.ceil(coeff * pageArea / (em * em));
        // B. Determine element eligibility. Each element in a flow is considered eligible if
        // it is is not marked as fully consumed and it comes in the document before the lookup position.
        // Feed lookupOffset and flow availability into the context
        this.lookupOffset = this.styler.styleUntil(currentPosition, lookup);
        goog.asserts.assert(cp);
        this.updateStartSide(cp);
        // update layoutPositionAtPageStart since startSide of FlowChunks may be updated
        this.layoutPositionAtPageStart = cp.clone();
        this.initLingering();
        self.clearScope(this.style.pageScope);
        // C. Determine content availability. Flow has content available if it contains eligible elements.
        // D. Determine if page master is enabled using rules in Section 3.4.7
        const enabled = pageMaster.getProp(self, "enabled");
        // E. First enabled page master is used for the next page
        if (!enabled || enabled === adapt.css.ident._true) {
            if (goog.DEBUG) {
                this.dumpLocation(currentPosition);
            }
            // Apply @page rules
            return this.pageManager.getPageRulePageMaster(pageMaster, cascadedPageStyle);
        }
    }
    throw new Error("No enabled page masters");
};

/**
 * @param {!adapt.vtree.FlowChunk} flowChunk
 * @returns {boolean}
 */
adapt.ops.StyleInstance.prototype.flowChunkIsAfterParentFlowForcedBreak = function(flowChunk) {
    const flows = this.layoutPositionAtPageStart.flows;
    const parentFlowName = flows[flowChunk.flowName].parentFlowName;
    if (parentFlowName) {
        const startOffset = flowChunk.startOffset;
        const forcedBreakOffsets = flows[parentFlowName].forcedBreakOffsets;
        if (!forcedBreakOffsets.length || startOffset < forcedBreakOffsets[0]) {
            return false;
        }
        const breakOffsetBeforeStartIndex = adapt.base.binarySearch(forcedBreakOffsets.length,
            i => forcedBreakOffsets[i] > startOffset) - 1;
        const breakOffsetBeforeStart = forcedBreakOffsets[breakOffsetBeforeStartIndex];
        const parentFlowPosition = this.layoutPositionAtPageStart.flowPositions[parentFlowName];
        const parentStartOffset = this.getConsumedOffset(parentFlowPosition);
        if (breakOffsetBeforeStart < parentStartOffset) {
            return false;
        }
        if (parentStartOffset < breakOffsetBeforeStart) {
            return true;
        }
        // Special case: parentStartOffset === breakOffsetBeforeStart
        // In this case, the flowChunk can be used if the start side of the parent flow matches the current page side.
        return !this.matchPageSide(parentFlowPosition.startSide);
    }
    return false;
};

/**
 * @param {adapt.layout.Column} column
 * @param {string} flowName
 */
adapt.ops.StyleInstance.prototype.setFormattingContextToColumn = function(column, flowName) {
    const flow = this.currentLayoutPosition.flows[flowName];
    if (!flow.formattingContext) {
        flow.formattingContext = new adapt.layout.BlockFormattingContext(null);
    }
    column.flowRootFormattingContext = flow.formattingContext;
};

/**
 * @param {!adapt.layout.Column} column
 * @returns {!adapt.task.Result.<boolean>}
 */
adapt.ops.StyleInstance.prototype.layoutDeferredPageFloats = column => {
    const pageFloatLayoutContext = column.pageFloatLayoutContext;
    const deferredFloats = pageFloatLayoutContext.getDeferredPageFloatContinuations();
    const frame = adapt.task.newFrame("layoutDeferredPageFloats");
    let invalidated = false;
    let i = 0;
    frame.loopWithFrame(loopFrame => {
        if (i === deferredFloats.length) {
            loopFrame.breakLoop();
            return;
        }
        const continuation = deferredFloats[i++];
        const float = continuation.float;
        const strategy = new vivliostyle.pagefloat.PageFloatLayoutStrategyResolver()
            .findByFloat(float);
        const pageFloatFragment = strategy.findPageFloatFragment(float, pageFloatLayoutContext);
        if (pageFloatFragment && pageFloatFragment.hasFloat(float)) {
            loopFrame.continueLoop();
            return;
        } else if (pageFloatLayoutContext.isForbidden(float) ||
            pageFloatLayoutContext.hasPrecedingFloatsDeferredToNext(float)) {
            pageFloatLayoutContext.deferPageFloat(continuation);
            loopFrame.breakLoop();
            return;
        }
        column.layoutPageFloatInner(continuation, strategy, null, pageFloatFragment).then(success => {
            if (!success) {
                loopFrame.breakLoop();
                return;
            }
            const parentInvalidated = pageFloatLayoutContext.parent.isInvalidated();
            if (parentInvalidated) {
                loopFrame.breakLoop();
                return;
            } else if (pageFloatLayoutContext.isInvalidated() && !parentInvalidated) {
                invalidated = true;
                pageFloatLayoutContext.validate();
            }
            loopFrame.continueLoop();
        });
    }).then(() => {
        if (invalidated)
            pageFloatLayoutContext.invalidate();
        frame.finish(true);
    });
    return frame.result();
};

/**
 * @param {!adapt.layout.Column} column
 * @param {?adapt.vtree.ChunkPosition} newPosition
 * @returns {?adapt.vtree.ChunkPosition}
 */
adapt.ops.StyleInstance.prototype.getLastAfterPositionIfDeferredFloatsExists = (column, newPosition) => {
    const pageFloatLayoutContext = column.pageFloatLayoutContext;
    const deferredFloats = pageFloatLayoutContext.getPageFloatContinuationsDeferredToNext();
    if (deferredFloats.length > 0) {
        if (column.lastAfterPosition) {
            let result;
            if (newPosition) {
                // Need overflown footnotes owned by newPosition
                result = newPosition.clone();
                result.primary = column.lastAfterPosition;
            } else {
                result = new adapt.vtree.ChunkPosition(column.lastAfterPosition);
            }
            return result;
        } else {
            goog.asserts.assert("column.lastAfterPosition === null");
            return null;
        }
    } else {
        return null;
    }
};

/**
 * @param {adapt.layout.Column} column
 * @param {string} flowName
 * @return {adapt.task.Result.<boolean>} holding true
 */
adapt.ops.StyleInstance.prototype.layoutColumn = function(column, flowName) {
    /** @const */ const flowPosition = this.currentLayoutPosition.flowPositions[flowName];
    if (!flowPosition || !this.matchPageSide(flowPosition.startSide))
        return adapt.task.newResult(true);
    flowPosition.startSide = "any";
    this.setFormattingContextToColumn(column, flowName);
    column.init();
    if (this.primaryFlows[flowName] && column.bands.length > 0) {
        // In general, we force non-fitting content. Exception is only for primary flow columns
        // that have exclusions.
        column.forceNonfitting = false;
    }
    const self = this;
    /** @type {!adapt.task.Frame.<boolean>} */ const frame = adapt.task.newFrame("layoutColumn");
    this.layoutDeferredPageFloats(column).then(() => {
        if (column.pageFloatLayoutContext.isInvalidated()) {
            frame.finish(true);
            return;
        }
        // Record indices of repeated positions and removed positions
        const repeatedIndices = /** @type {Array.<number>} */ ([]);
        const removedIndices = /** @type {Array.<number>} */ ([]);
        let leadingEdge = true;
        frame.loopWithFrame(loopFrame => {
            if (column.pageFloatLayoutContext.hasContinuingFloatFragmentsInFlow(flowName)) {
                loopFrame.breakLoop();
                return;
            }
            while (flowPosition.positions.length - removedIndices.length > 0) {
                let index = 0;
                // Skip all removed positions
                while (removedIndices.includes(index))
                    index++;
                let selected = flowPosition.positions[index];
                if (selected.flowChunk.startOffset > self.lookupOffset ||
                    self.flowChunkIsAfterParentFlowForcedBreak(selected.flowChunk))
                    break;
                for (let k = index + 1; k < flowPosition.positions.length; k++) {
                    if (removedIndices.includes(k)) continue; // Skip removed positions
                    const alt = flowPosition.positions[k];
                    if (alt.flowChunk.startOffset > self.lookupOffset ||
                        self.flowChunkIsAfterParentFlowForcedBreak(alt.flowChunk))
                        break;
                    if (alt.flowChunk.isBetter(selected.flowChunk)) {
                        selected = alt;
                        index = k;
                    }
                }
                const flowChunk = selected.flowChunk;
                let pending = true;
                column.layout(selected.chunkPosition, leadingEdge, flowPosition.breakAfter).then(newPosition => {
                    if (column.pageFloatLayoutContext.isInvalidated()) {
                        loopFrame.breakLoop();
                        return;
                    }
                    leadingEdge = false;
                    // static: keep in the flow
                    if (selected.flowChunk.repeated && (newPosition === null || flowChunk.exclusive))
                        repeatedIndices.push(index);
                    if (flowChunk.exclusive) {
                        // exclusive, only can have one, remove from the flow even if it did not fit
                        removedIndices.push(index);
                        loopFrame.breakLoop();
                        return;
                    } else {
                        // not exclusive
                        const endOfColumn = !!newPosition || !!column.pageBreakType;
                        const lastAfterPosition = self.getLastAfterPositionIfDeferredFloatsExists(column, newPosition);
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
                                flowPosition.startSide = vivliostyle.break.breakValueToStartSideValue(column.pageBreakType);
                            }
                        }
                        if (endOfColumn) {
                            loopFrame.breakLoop();
                            return;
                        }
                    }
                    // Since at least one flowChunk has been placed in the column,
                    // the next flowChunk of the flow can be deferred to the next partition
                    // if there is not enough space in the current partition.
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
                // Sync result
            }
            loopFrame.breakLoop();
        }).then(() => {
            if (!column.pageFloatLayoutContext.isInvalidated()) {
                // Keep positions repeated or not removed
                flowPosition.positions = flowPosition.positions.filter((pos, i) => repeatedIndices.includes(i) || !removedIndices.includes(i));
                if (flowPosition.breakAfter === "column")
                    flowPosition.breakAfter = null;
                column.saveDistanceToBlockEndFloats();
                const edge = column.pageFloatLayoutContext.getMaxReachedAfterEdge();
                column.updateMaxReachedAfterEdge(edge);
            }
            frame.finish(true);
        });
    });
    return frame.result();
};

/**
 * @param {!vivliostyle.pagefloat.PageFloatLayoutContext} pageFloatLayoutContext
 * @returns {!adapt.layout.LayoutConstraint}
 */
adapt.ops.StyleInstance.prototype.createLayoutConstraint = function(pageFloatLayoutContext) {
    const pageIndex = this.currentLayoutPosition.page - 1;
    const counterConstraint = this.counterStore.createLayoutConstraint(pageIndex);
    return new adapt.layout.AllLayoutConstraint(
        [counterConstraint].concat(pageFloatLayoutContext.getLayoutConstraints()));
};

/**
 * @private
 * @param {adapt.pm.PageBoxInstance} boxInstance
 * @param {number} offsetX
 * @param {number} offsetY
 * @param {Array.<adapt.geom.Shape>} exclusions
 * @param {!adapt.vtree.Container} layoutContainer
 * @param {number} currentColumnIndex
 * @param {string} flowNameStr
 * @param {!vivliostyle.pagefloat.PageFloatLayoutContext} regionPageFloatLayoutContext
 * @param {number} columnCount
 * @param {number} columnGap
 * @param {number} columnWidth
 * @param {adapt.geom.Shape} innerShape
 * @param {!adapt.vtree.LayoutContext} layoutContext
 * @param {boolean} forceNonFitting
 * @returns {!adapt.task.Result.<!adapt.layout.Column>}
 */
adapt.ops.StyleInstance.prototype.createAndLayoutColumn = function(boxInstance, offsetX, offsetY, exclusions,
    layoutContainer, currentColumnIndex,
    flowNameStr, regionPageFloatLayoutContext,
    columnCount, columnGap, columnWidth,
    innerShape, layoutContext, forceNonFitting) {
    const self = this;
    const dontApplyExclusions = boxInstance.vertical
        ? boxInstance.isAutoWidth && boxInstance.isRightDependentOnAutoWidth
        : boxInstance.isAutoHeight && boxInstance.isTopDependentOnAutoHeight;
    const boxContainer = layoutContainer.element;
    const columnPageFloatLayoutContext = new vivliostyle.pagefloat.PageFloatLayoutContext(
        regionPageFloatLayoutContext, vivliostyle.pagefloat.FloatReference.COLUMN, null, flowNameStr,
        null, null, null);
    const positionAtColumnStart = self.currentLayoutPosition.clone();
    /** @type {!adapt.task.Frame<!adapt.layout.Column>} */ const frame = adapt.task.newFrame("createAndLayoutColumn");
    let column;
    frame.loopWithFrame(loopFrame => {
        const layoutConstraint = self.createLayoutConstraint(columnPageFloatLayoutContext);
        if (columnCount > 1) {
            const columnContainer = self.viewport.document.createElement("div");
            adapt.base.setCSSProperty(columnContainer, "position", "absolute");
            boxContainer.appendChild(columnContainer);
            column = new adapt.layout.Column(columnContainer, layoutContext, self.clientLayout,
                layoutConstraint, columnPageFloatLayoutContext);
            column.forceNonfitting = forceNonFitting;
            column.vertical = layoutContainer.vertical;
            column.snapHeight = layoutContainer.snapHeight;
            column.snapWidth = layoutContainer.snapWidth;
            if (layoutContainer.vertical) {
                const columnY = currentColumnIndex * (columnWidth + columnGap) + layoutContainer.paddingTop;
                column.setHorizontalPosition(layoutContainer.paddingLeft, layoutContainer.width);
                column.setVerticalPosition(columnY, columnWidth);
            } else {
                const columnX = currentColumnIndex * (columnWidth + columnGap) + layoutContainer.paddingLeft;
                column.setVerticalPosition(layoutContainer.paddingTop, layoutContainer.height);
                column.setHorizontalPosition(columnX, columnWidth);
            }
            column.originX = offsetX;
            column.originY = offsetY;
        } else {
            column = new adapt.layout.Column(boxContainer, layoutContext, self.clientLayout,
                layoutConstraint, columnPageFloatLayoutContext);
            column.copyFrom(layoutContainer);
        }
        column.exclusions = dontApplyExclusions ? [] : exclusions.concat();
        column.innerShape = innerShape;
        columnPageFloatLayoutContext.setContainer(column);
        if (column.width >= 0) {
            // column.element.style.outline = "1px dotted green";
            self.layoutColumn(column, flowNameStr).then(() => {
                if (!columnPageFloatLayoutContext.isInvalidated()) {
                    columnPageFloatLayoutContext.finish();
                }
                if (column.pageFloatLayoutContext.isInvalidated() && !regionPageFloatLayoutContext.isInvalidated()) {
                    column.pageFloatLayoutContext.validate();
                    self.currentLayoutPosition = positionAtColumnStart.clone();
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
    }).then(() => {
        frame.finish(column);
    });
    return frame.result();
};

/**
 * @param {!vivliostyle.pagefloat.PageFloatLayoutContext} pagePageFloatLayoutContext
 * @param {!adapt.pm.PageBoxInstance} boxInstance
 * @param {!adapt.vtree.Container} layoutContainer
 */
adapt.ops.StyleInstance.prototype.setPagePageFloatLayoutContextContainer = (pagePageFloatLayoutContext, boxInstance, layoutContainer) => {
    if (boxInstance instanceof vivliostyle.page.PageRulePartitionInstance ||
        (boxInstance instanceof adapt.pm.PageMasterInstance &&
        !(boxInstance instanceof vivliostyle.page.PageRuleMasterInstance))) {
        pagePageFloatLayoutContext.setContainer(layoutContainer);
    }
};

/**
 * @param {!vivliostyle.pagefloat.PageFloatLayoutContext} pagePageFloatLayoutContext
 * @param {!adapt.pm.PageBoxInstance} boxInstance
 * @param {!adapt.vtree.Container} layoutContainer
 * @param {string} flowName
 * @returns {!vivliostyle.pagefloat.PageFloatLayoutContext}
 */
adapt.ops.StyleInstance.prototype.getRegionPageFloatLayoutContext = function(
    pagePageFloatLayoutContext, boxInstance, layoutContainer, flowName) {
    goog.asserts.assert(boxInstance instanceof adapt.pm.PartitionInstance);
    const writingMode = boxInstance.getProp(this, "writing-mode") || null;
    const direction = boxInstance.getProp(this, "direction") || null;
    return new vivliostyle.pagefloat.PageFloatLayoutContext(pagePageFloatLayoutContext,
        vivliostyle.pagefloat.FloatReference.REGION, layoutContainer, flowName, null,
        writingMode, direction);
};

/**
 * @param {!adapt.vtree.Page} page
 * @param {!adapt.pm.PageBoxInstance} boxInstance
 * @param {number} offsetX
 * @param {number} offsetY
 * @param {Array.<adapt.geom.Shape>} exclusions
 * @param {!vivliostyle.pagefloat.PageFloatLayoutContext} pagePageFloatLayoutContext
 * @param {!adapt.vtree.Container} layoutContainer
 * @param {string} flowNameStr
 * @param {number} columnCount
 * @returns {!adapt.task.Result.<!Array.<!adapt.layout.Column>>}
 */
adapt.ops.StyleInstance.prototype.layoutFlowColumnsWithBalancing = function(
    page, boxInstance, offsetX, offsetY, exclusions, pagePageFloatLayoutContext, layoutContainer,
    flowNameStr, columnCount) {
    const self = this;
    const positionAtContainerStart = self.currentLayoutPosition.clone();
    const regionPageFloatLayoutContext =
        self.getRegionPageFloatLayoutContext(pagePageFloatLayoutContext, boxInstance, layoutContainer, flowNameStr);
    let isFirstTime = true;

    /**
     * @type {!vivliostyle.column.ColumnGenerator}
     */
    function layoutColumns() {
        self.currentLayoutPosition = positionAtContainerStart.clone();
        return self.layoutFlowColumns(
            page, boxInstance, offsetX, offsetY, exclusions, pagePageFloatLayoutContext, regionPageFloatLayoutContext,
            layoutContainer, flowNameStr, columnCount, isFirstTime).thenAsync(columns => {
            if (columns) {
                return adapt.task.newResult({
                    columns,
                    position: self.currentLayoutPosition
                });
            } else {
                return adapt.task.newResult(null);
            }
        });
    }

    return layoutColumns().thenAsync(generatorResult => {
        if (!generatorResult)
            return adapt.task.newResult(null);
        if (columnCount <= 1)
            return adapt.task.newResult(generatorResult.columns);
        const columnFill = boxInstance.getProp(self, "column-fill") || adapt.css.ident.balance;
        const flowPosition = self.currentLayoutPosition.flowPositions[flowNameStr];
        goog.asserts.assert(flowPosition);
        const columnBalancer = vivliostyle.column.createColumnBalancer(columnCount, columnFill, layoutColumns,
            regionPageFloatLayoutContext, layoutContainer, generatorResult.columns, flowPosition);
        if (!columnBalancer)
            return adapt.task.newResult(generatorResult.columns);

        isFirstTime = false;
        pagePageFloatLayoutContext.lock();
        regionPageFloatLayoutContext.lock();
        return columnBalancer.balanceColumns(generatorResult).thenAsync(result => {
            pagePageFloatLayoutContext.unlock();
            pagePageFloatLayoutContext.validate();
            regionPageFloatLayoutContext.unlock();
            self.currentLayoutPosition = result.position;
            return adapt.task.newResult(result.columns);
        });
    });
};

/**
 *
 * @param {!adapt.vtree.Page} page
 * @param {!adapt.pm.PageBoxInstance} boxInstance
 * @param {number} offsetX
 * @param {number} offsetY
 * @param {Array.<adapt.geom.Shape>} exclusions
 * @param {!vivliostyle.pagefloat.PageFloatLayoutContext} pagePageFloatLayoutContext
 * @param {!vivliostyle.pagefloat.PageFloatLayoutContext} regionPageFloatLayoutContext
 * @param {!adapt.vtree.Container} layoutContainer
 * @param {string} flowNameStr
 * @param {number} columnCount
 * @param {boolean} forceNonFitting
 * @returns {!adapt.task.Result.<?Array.<!adapt.layout.Column>>}
 */
adapt.ops.StyleInstance.prototype.layoutFlowColumns = function(
    page, boxInstance, offsetX, offsetY, exclusions, pagePageFloatLayoutContext, regionPageFloatLayoutContext,
    layoutContainer, flowNameStr, columnCount, forceNonFitting) {
    const self = this;
    /** @type {adapt.task.Frame<?Array<!adapt.layout.Column>>} */ const frame =
        adapt.task.newFrame("layoutFlowColumns");
    const positionAtContainerStart = self.currentLayoutPosition.clone();
    const columnGap = boxInstance.getPropAsNumber(self, "column-gap");
    // Don't query columnWidth when it's not needed, so that width calculation can be delayed
    // for width: auto columns.
    const columnWidth = (columnCount > 1 ? boxInstance.getPropAsNumber(self, "column-width") : layoutContainer.width);
    const regionIds = boxInstance.getActiveRegions(self);
    const innerShapeVal = boxInstance.getProp(self, "shape-inside");
    const innerShape = adapt.cssprop.toShape(innerShapeVal, 0, 0,
        layoutContainer.width, layoutContainer.height, self);
    const layoutContext = new adapt.vgen.ViewFactory(flowNameStr, self,
        self.viewport, self.styler, regionIds, self.xmldoc, self.faces,
        self.style.footnoteProps, self, page, self.customRenderer,
        self.fallbackMap, this.documentURLTransformer);
    let columnIndex = 0;
    let column = null;
    let columns = [];
    frame.loopWithFrame(loopFrame => {
        self.createAndLayoutColumn(boxInstance, offsetX, offsetY, exclusions, layoutContainer,
            columnIndex++, flowNameStr, regionPageFloatLayoutContext, columnCount, columnGap,
            columnWidth, innerShape, layoutContext, forceNonFitting).then(c => {
            if (pagePageFloatLayoutContext.isInvalidated()) {
                columns = null;
                loopFrame.breakLoop();
                return;
            }
            const forcedRegionBreak = !!c.pageBreakType && (c.pageBreakType !== "column");
            if ((forcedRegionBreak || columnIndex === columnCount) &&
                    !regionPageFloatLayoutContext.isInvalidated()) {
                regionPageFloatLayoutContext.finish();
            }
            if (regionPageFloatLayoutContext.isInvalidated()) {
                columnIndex = 0;
                self.currentLayoutPosition = positionAtContainerStart.clone();
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
                        self.pageBreaks[flowNameStr] = true;
                    }
                }
            }
            if (columnIndex < columnCount) {
                loopFrame.continueLoop();
            } else {
                loopFrame.breakLoop();
            }
        });
    }).then(() => {
        frame.finish(columns);
    });
    return frame.result();
};

/**
 * @param {!adapt.vtree.Page} page
 * @param {adapt.pm.PageBoxInstance} boxInstance
 * @param {HTMLElement} parentContainer
 * @param {number} offsetX
 * @param {number} offsetY
 * @param {Array.<adapt.geom.Shape>} exclusions
 * @param {!vivliostyle.pagefloat.PageFloatLayoutContext} pagePageFloatLayoutContext
 * @return {adapt.task.Result.<boolean>} holding true
 */
adapt.ops.StyleInstance.prototype.layoutContainer = function(page, boxInstance, parentContainer,
    offsetX, offsetY, exclusions,
    pagePageFloatLayoutContext) {
    const self = this;
    boxInstance.reset();
    const enabled = boxInstance.getProp(self, "enabled");
    if (enabled && enabled !== adapt.css.ident._true) {
        return adapt.task.newResult(true);
    }
    /** @type {!adapt.task.Frame.<boolean>} */ const frame
        = adapt.task.newFrame("layoutContainer");
    const wrapFlow = boxInstance.getProp(self, "wrap-flow");
    const dontExclude = wrapFlow === adapt.css.ident.auto;
    const flowName = boxInstance.getProp(self, "flow-from");
    const boxContainer = self.viewport.document.createElement("div");
    const position = boxInstance.getProp(self, "position");
    adapt.base.setCSSProperty(boxContainer, "position", position ? position.name : "absolute");
    parentContainer.insertBefore(boxContainer, parentContainer.firstChild);
    let layoutContainer = new adapt.vtree.Container(boxContainer);
    layoutContainer.vertical = boxInstance.vertical;
    layoutContainer.exclusions = exclusions;
    boxInstance.prepareContainer(self, layoutContainer, page, self.faces, self.clientLayout);
    layoutContainer.originX = offsetX;
    layoutContainer.originY = offsetY;
    offsetX += layoutContainer.left + layoutContainer.marginLeft + layoutContainer.borderLeft;
    offsetY += layoutContainer.top + layoutContainer.marginTop + layoutContainer.borderTop;
    this.setPagePageFloatLayoutContextContainer(pagePageFloatLayoutContext, boxInstance, layoutContainer);
    let cont;
    let removed = false;
    if (!flowName || !flowName.isIdent()) {
        const contentVal = boxInstance.getProp(self, "content");
        if (contentVal && adapt.vtree.nonTrivialContent(contentVal)) {
            let innerContainerTag = "span";
            if (contentVal.url) {
                innerContainerTag = "img";
            }
            const innerContainer = self.viewport.document.createElement(innerContainerTag);
            contentVal.visit(new adapt.vtree.ContentPropertyHandler(innerContainer, self, contentVal, self.counterStore.getExprContentListener()));
            boxContainer.appendChild(innerContainer);
            if (innerContainerTag == "img")
                boxInstance.transferSinglUriContentProps(self, innerContainer, self.faces);
            boxInstance.transferContentProps(self, layoutContainer, page, self.faces);
        } else if (boxInstance.suppressEmptyBoxGeneration) {
            parentContainer.removeChild(boxContainer);
            removed = true;
        }
        if (!removed) {
            boxInstance.finishContainer(self, layoutContainer, page, null, 1, self.clientLayout, self.faces);
        }
        cont = adapt.task.newResult(true);
    } else if (!self.pageBreaks[flowName.toString()]) {
        /** @type {!adapt.task.Frame.<boolean>} */ const innerFrame = adapt.task.newFrame("layoutContainer.inner");
        const flowNameStr = flowName.toString();
        // for now only a single column in vertical case
        const columnCount = boxInstance.getPropAsNumber(self, "column-count");

        self.layoutFlowColumnsWithBalancing(page, boxInstance, offsetX, offsetY, exclusions, pagePageFloatLayoutContext, layoutContainer, flowNameStr, columnCount).then(columns => {
            if (!pagePageFloatLayoutContext.isInvalidated()) {
                const column = columns[0];
                goog.asserts.assert(column);
                if (column.element === boxContainer) {
                    layoutContainer = column;
                }
                layoutContainer.computedBlockSize = Math.max.apply(null, columns.map(c => c.computedBlockSize));
                boxInstance.finishContainer(self, layoutContainer, page, column,
                    columnCount, self.clientLayout, self.faces);
                const flowPosition = self.currentLayoutPosition.flowPositions[flowNameStr];
                if (flowPosition && flowPosition.breakAfter === "region")
                    flowPosition.breakAfter = null;
            }
            innerFrame.finish(true);
        });
        cont = innerFrame.result();
    } else {
        if (!pagePageFloatLayoutContext.isInvalidated()) {
            boxInstance.finishContainer(self, layoutContainer, page, null, 1, self.clientLayout, self.faces);
        }
        cont = adapt.task.newResult(true);
    }
    cont.then(() => {
        if (pagePageFloatLayoutContext.isInvalidated()) {
            frame.finish(true);
            return;
        }
        if (!boxInstance.isAutoHeight || Math.floor(layoutContainer.computedBlockSize) > 0) {
            if (!removed && !dontExclude) {
                const outerShapeProp = boxInstance.getProp(self, "shape-outside");
                const outerShape = layoutContainer.getOuterShape(outerShapeProp, self);
                // Though it seems that LShapeFloatBug still exists in Firefox, it apparently does not occur on exclusion floats. See the test file: test/files/column-break-bug.html
                // if (adapt.base.checkLShapeFloatBug(self.viewport.root)) {
                // 	// Simplistic bug workaround: add a copy of the shape translated up.
                //     exclusions.push(outerShape.withOffset(0, -1.25 * self.queryUnitSize("em", false)));
                // }
                exclusions.push(outerShape);
            }
        } else if (boxInstance.children.length == 0) {
            parentContainer.removeChild(boxContainer);
            frame.finish(true);
            return;
        }
        let i = boxInstance.children.length - 1;
        frame.loop(() => {
            while (i >= 0) {
                const child = boxInstance.children[i--];
                const r = self.layoutContainer(page, child, /** @type {HTMLElement} */ (boxContainer),
                    offsetX, offsetY, exclusions, pagePageFloatLayoutContext);
                if (r.isPending()) {
                    return r.thenAsync(() => adapt.task.newResult(!pagePageFloatLayoutContext.isInvalidated()));
                } else if (pagePageFloatLayoutContext.isInvalidated()) {
                    break;
                }
            }
            return adapt.task.newResult(false);
        }).then(() => {
            frame.finish(true);
        });
    });
    return frame.result();
};

/**
 * @return {void}
 */
adapt.ops.StyleInstance.prototype.processLinger = function() {
    const pageNumber = this.currentLayoutPosition.page;
    for (const flowName in this.currentLayoutPosition.flowPositions) {
        const flowPosition = this.currentLayoutPosition.flowPositions[flowName];
        for (let i = flowPosition.positions.length - 1; i >= 0; i--) {
            const pos = flowPosition.positions[i];
            if (pos.flowChunk.startPage >= 0 &&
                pos.flowChunk.startPage + pos.flowChunk.linger - 1 <= pageNumber) {
                flowPosition.positions.splice(i, 1);
            }
        }
    }
};

/**
 * @return {void}
 */
adapt.ops.StyleInstance.prototype.initLingering = function() {
    const pageNumber = this.currentLayoutPosition.page;
    for (const flowName in this.currentLayoutPosition.flowPositions) {
        const flowPosition = this.currentLayoutPosition.flowPositions[flowName];
        for (let i = flowPosition.positions.length - 1; i >= 0; i--) {
            const pos = flowPosition.positions[i];
            if (pos.flowChunk.startPage < 0 && pos.flowChunk.startOffset < this.lookupOffset) {
                pos.flowChunk.startPage = pageNumber;
            }
        }
    }
};

/**
 * @param {adapt.vtree.LayoutPosition} cp
 * @return {boolean}
 */
adapt.ops.StyleInstance.prototype.noMorePrimaryFlows = function(cp) {
    for (const flowName in this.primaryFlows) {
        const flowPosition = cp.flowPositions[flowName];
        if (flowPosition && flowPosition.positions.length > 0) {
            return false;
        }
    }
    return true;
};

/**
 * @param {!adapt.vtree.Page} page
 * @param {adapt.vtree.LayoutPosition|undefined} cp
 * @return {adapt.task.Result.<adapt.vtree.LayoutPosition>}
 */
adapt.ops.StyleInstance.prototype.layoutNextPage = function(page, cp) {
    const self = this;

    // TOC box is special page container, no pagination
    const isTocBox = page.container === page.bleedBox;

    self.pageBreaks = {};
    if (cp) {
        self.currentLayoutPosition = cp.clone();
        self.styler.replayFlowElementsFromOffset(cp.highestSeenOffset);
    } else {
        self.currentLayoutPosition = new adapt.vtree.LayoutPosition();
        self.styler.replayFlowElementsFromOffset(-1);
    }
    if (this.lang) {
        page.bleedBox.setAttribute("lang", this.lang);
    }
    cp = self.currentLayoutPosition;
    cp.page++;
    self.clearScope(self.style.pageScope);
    self.layoutPositionAtPageStart = cp.clone();

    // Resolve page size before page master selection.
    const cascadedPageStyle = isTocBox ? /** @type {adapt.csscasc.ElementStyle} */ ({}) : self.pageManager.getCascadedPageStyle();
    const pageMaster = self.selectPageMaster(cascadedPageStyle);
    if (!pageMaster) {
        // end of primary content
        return adapt.task.newResult(/** @type {adapt.vtree.LayoutPosition}*/ (null));
    }

    let bleedBoxPaddingEdge = 0;
    if (!isTocBox) {
        page.setAutoPageWidth(pageMaster.pageBox.specified["width"].value === adapt.css.fullWidth);
        page.setAutoPageHeight(pageMaster.pageBox.specified["height"].value === adapt.css.fullHeight);
        self.counterStore.setCurrentPage(page);
        self.counterStore.updatePageCounters(cascadedPageStyle, self);

        // setup bleed area and crop marks
        const evaluatedPageSizeAndBleed = vivliostyle.page.evaluatePageSizeAndBleed(
            vivliostyle.page.resolvePageSizeAndBleed(cascadedPageStyle), this);
        self.setPageSizeAndBleed(evaluatedPageSizeAndBleed, page);
        vivliostyle.page.addPrinterMarks(cascadedPageStyle, evaluatedPageSizeAndBleed, page, this);
        bleedBoxPaddingEdge = evaluatedPageSizeAndBleed.bleedOffset + evaluatedPageSizeAndBleed.bleed;
    }

    const writingMode = !isTocBox && pageMaster.getProp(self, "writing-mode") || adapt.css.ident.horizontal_tb;

    this.pageVertical = writingMode != adapt.css.ident.horizontal_tb;

    const direction = pageMaster.getProp(self, "direction") || adapt.css.ident.ltr;
    const pageFloatLayoutContext = new vivliostyle.pagefloat.PageFloatLayoutContext(
        self.rootPageFloatLayoutContext, vivliostyle.pagefloat.FloatReference.PAGE, null, null, null,
        writingMode, direction);

    /** @type {!adapt.task.Frame.<adapt.vtree.LayoutPosition>} */ const frame
        = adapt.task.newFrame("layoutNextPage");
    frame.loopWithFrame(loopFrame => {
        self.layoutContainer(page, pageMaster, page.bleedBox, bleedBoxPaddingEdge, bleedBoxPaddingEdge+1, // Compensate 'top: -1px' on page master
            [], pageFloatLayoutContext).then(() => {
            if (!pageFloatLayoutContext.isInvalidated()) {
                pageFloatLayoutContext.finish();
            }
            if (pageFloatLayoutContext.isInvalidated()) {
                self.currentLayoutPosition = self.layoutPositionAtPageStart.clone();
                pageFloatLayoutContext.validate();
                loopFrame.continueLoop();
            } else {
                loopFrame.breakLoop();
            }
        });
    }).then(() => {
        pageMaster.adjustPageLayout(self, page, self.clientLayout);
        if (!isTocBox) {
            const isLeftPage = new adapt.expr.Named(pageMaster.pageBox.scope, "left-page");
            page.side = isLeftPage.evaluate(self) ? vivliostyle.constants.PageSide.LEFT : vivliostyle.constants.PageSide.RIGHT;
            self.processLinger();
            cp = self.currentLayoutPosition;
            Object.keys(cp.flowPositions).forEach(flowName => {
                const flowPosition = cp.flowPositions[flowName];
                const breakAfter = flowPosition.breakAfter;
                if (breakAfter && (breakAfter === "page" || !self.matchPageSide(breakAfter))) {
                    flowPosition.breakAfter = null;
                }
            });
        }
        self.currentLayoutPosition = self.layoutPositionAtPageStart = null;
        cp.highestSeenOffset = self.styler.getReachedOffset();
        const triggers = self.style.store.getTriggersForDoc(self.xmldoc);
        page.finish(triggers, self.clientLayout);
        if (self.noMorePrimaryFlows(cp)) {
            cp = null;
        }
        frame.finish(cp);
    });
    return frame.result();
};

/**
 * Set actual page width, height and bleed from style specified in page context.
 * @private
 * @param {!vivliostyle.page.EvaluatedPageSizeAndBleed} evaluatedPageSizeAndBleed
 * @param {adapt.vtree.Page} page
 */
adapt.ops.StyleInstance.prototype.setPageSizeAndBleed = function(evaluatedPageSizeAndBleed, page) {
    this.actualPageWidth = evaluatedPageSizeAndBleed.pageWidth;
    this.actualPageHeight = evaluatedPageSizeAndBleed.pageHeight;
    this.pageSheetWidth = evaluatedPageSizeAndBleed.pageWidth + evaluatedPageSizeAndBleed.cropOffset * 2;
    this.pageSheetHeight = evaluatedPageSizeAndBleed.pageHeight + evaluatedPageSizeAndBleed.cropOffset * 2;
    page.container.style.width = `${this.pageSheetWidth}px`;
    page.container.style.height = `${this.pageSheetHeight}px`;
    page.bleedBox.style.left = `${evaluatedPageSizeAndBleed.bleedOffset}px`;
    page.bleedBox.style.right = `${evaluatedPageSizeAndBleed.bleedOffset}px`;
    page.bleedBox.style.top = `${evaluatedPageSizeAndBleed.bleedOffset}px`;
    page.bleedBox.style.bottom = `${evaluatedPageSizeAndBleed.bleedOffset}px`;
    page.bleedBox.style.padding = `${evaluatedPageSizeAndBleed.bleed}px`;
    // Shift 1px to workaround Chrome printing bug
    page.bleedBox.style.paddingTop = `${evaluatedPageSizeAndBleed.bleed+1}px`;
};

/**
 * @param {adapt.ops.StyleParserHandler} masterHandler
 * @param {adapt.expr.Val} condition
 * @param {adapt.ops.BaseParserHandler} parent
 * @param {?string} regionId
 * @constructor
 * @extends {adapt.csscasc.CascadeParserHandler}
 */
adapt.ops.BaseParserHandler = function(masterHandler, condition, parent, regionId) {
    adapt.csscasc.CascadeParserHandler.call(this, masterHandler.rootScope, masterHandler,
        condition, parent, regionId, masterHandler.validatorSet, !parent);
    /** @type {adapt.ops.StyleParserHandler} */ this.masterHandler = masterHandler;
    /** @type {boolean} */ this.insideRegion = false;
};
goog.inherits(adapt.ops.BaseParserHandler, adapt.csscasc.CascadeParserHandler);

/**
 * @override
 */
adapt.ops.BaseParserHandler.prototype.startPageTemplateRule = () => {
    // override, so we don't register an error
};

/**
 * @override
 */
adapt.ops.BaseParserHandler.prototype.startPageMasterRule = function(name, pseudoName, classes) {
    const pageMaster = new adapt.pm.PageMaster(this.masterHandler.pageScope, name, pseudoName,
        classes, this.masterHandler.rootBox, this.condition, this.owner.getBaseSpecificity());
    this.masterHandler.pushHandler(new adapt.pm.PageMasterParserHandler(pageMaster.scope,
        this.masterHandler, pageMaster, this.validatorSet));
};

/**
 * @override
 */
adapt.ops.BaseParserHandler.prototype.startWhenRule = function(conditionVal) {
    let condition = conditionVal.expr;
    if (this.condition != null)
        condition = adapt.expr.and(this.scope, this.condition, condition);
    this.masterHandler.pushHandler(new adapt.ops.BaseParserHandler(
        this.masterHandler, condition, this, this.regionId));
};

/**
 * @override
 */
adapt.ops.BaseParserHandler.prototype.startDefineRule = function() {
    this.masterHandler.pushHandler(new adapt.csscasc.DefineParserHandler(
        this.scope, this.owner));
};

/**
 * @override
 */
adapt.ops.BaseParserHandler.prototype.startFontFaceRule = function() {
    const properties = /** @type {adapt.csscasc.ElementStyle} */ ({});
    this.masterHandler.fontFaces.push({properties, condition: this.condition});
    this.masterHandler.pushHandler(new adapt.csscasc.PropSetParserHandler(
        this.scope, this.owner, null, properties, this.masterHandler.validatorSet));
};

/**
 * @override
 */
adapt.ops.BaseParserHandler.prototype.startFlowRule = function(flowName) {
    let style = this.masterHandler.flowProps[flowName];
    if (!style) {
        style = /** @type {adapt.csscasc.ElementStyle} */ ({});
        this.masterHandler.flowProps[flowName] = style;
    }
    this.masterHandler.pushHandler(new adapt.csscasc.PropSetParserHandler(
        this.scope, this.owner, null, style,
        this.masterHandler.validatorSet));
};

/**
 * @override
 */
adapt.ops.BaseParserHandler.prototype.startViewportRule = function() {
    const viewportProps = /** @type {adapt.csscasc.ElementStyle} */ ({});
    this.masterHandler.viewportProps.push(viewportProps);
    this.masterHandler.pushHandler(new adapt.csscasc.PropSetParserHandler(
        this.scope, this.owner, this.condition, viewportProps,
        this.masterHandler.validatorSet));
};

/**
 * @override
 */
adapt.ops.BaseParserHandler.prototype.startFootnoteRule = function(pseudoelement) {
    let style = this.masterHandler.footnoteProps;
    if (pseudoelement) {
        const pseudos = adapt.csscasc.getMutableStyleMap(style, "_pseudos");
        style = pseudos[pseudoelement];
        if (!style) {
            style = /** @type {adapt.csscasc.ElementStyle} */ ({});
            pseudos[pseudoelement] = style;
        }
    }
    this.masterHandler.pushHandler(new adapt.csscasc.PropSetParserHandler(
        this.scope, this.owner, null, style,
        this.masterHandler.validatorSet));
};

/**
 * @override
 */
adapt.ops.BaseParserHandler.prototype.startRegionRule = function() {
    this.insideRegion = true;
    this.startSelectorRule();
};

/**
 * @override
 */
adapt.ops.BaseParserHandler.prototype.startPageRule = function() {
    const pageHandler = new vivliostyle.page.PageParserHandler(this.masterHandler.pageScope,
        this.masterHandler, this, this.validatorSet, this.masterHandler.pageProps);
    this.masterHandler.pushHandler(pageHandler);
    pageHandler.startPageRule();
};

/**
 * @override
 */
adapt.ops.BaseParserHandler.prototype.startRuleBody = function() {
    adapt.csscasc.CascadeParserHandler.prototype.startRuleBody.call(this);
    if (this.insideRegion) {
        this.insideRegion = false;
        const regionId = `R${this.masterHandler.regionCount++}`;
        this.special("region-id", adapt.css.getName(regionId));
        this.endRule();
        const regionHandler = new adapt.ops.BaseParserHandler(this.masterHandler, this.condition,
            this, regionId);
        this.masterHandler.pushHandler(regionHandler);
        regionHandler.startRuleBody();
    }
};


/**
 * @param {Element} meta
 * @return {string}
 */
adapt.ops.processViewportMeta = meta => {
    let content = meta.getAttribute("content");
    if (!content) {
        return "";
    }
    const vals = {};
    let r;
    while ((r = content.match(/^,?\s*([-A-Za-z_.][-A-Za-z_0-9.]*)\s*=\s*([-+A-Za-z_0-9.]*)\s*/)) != null) {
        content = content.substr(r[0].length);
        vals[r[1]] = r[2];
    }
    const width = vals["width"] - 0;
    const height = vals["height"] - 0;
    if (width && height) {
        return `@-epubx-viewport{width:${width}px;height:${height}px;}`;
    }
    return "";
};


/**
 * @param {adapt.cssvalid.ValidatorSet} validatorSet
 * @constructor
 * @extends {adapt.cssparse.DispatchParserHandler}
 */
adapt.ops.StyleParserHandler = function(validatorSet) {
    adapt.cssparse.DispatchParserHandler.call(this);
    /** @const */ this.validatorSet = validatorSet;
    /** @const */ this.rootScope = new adapt.expr.LexicalScope(null);
    /** @const */ this.pageScope = new adapt.expr.LexicalScope(this.rootScope);
    /** @const */ this.rootBox = new adapt.pm.RootPageBox(this.rootScope);
    /** @const */ this.cascadeParserHandler =
        new adapt.ops.BaseParserHandler(this, null, null, null);
    /** @type {number} */ this.regionCount = 0;
    /** @const */ this.fontFaces = /** @type {Array.<adapt.ops.FontFace>} */ ([]);
    /** @const */ this.footnoteProps = /** @type {adapt.csscasc.ElementStyle} */ ({});
    /** @const */ this.flowProps = /** @type {Object.<string,adapt.csscasc.ElementStyle>} */ ({});
    /** @const */ this.viewportProps = /** @type {Array.<adapt.csscasc.ElementStyle>} */ ([]);
    /** @const */ this.pageProps = /** @type {!Object.<string,!adapt.csscasc.ElementStyle>} */ ({});

    this.slave = this.cascadeParserHandler;
};
goog.inherits(adapt.ops.StyleParserHandler, adapt.cssparse.DispatchParserHandler);

/**
 * @override
 */
adapt.ops.StyleParserHandler.prototype.error = (mnemonics, token) => {
    vivliostyle.logging.logger.warn("CSS parser:", mnemonics);
};

/**
 * @typedef {{
 * 		url: string,
 * 		text: ?string,
 *      flavor: adapt.cssparse.StylesheetFlavor,
 *      classes: ?string,
 *      media: ?string
 * }}
 */
adapt.ops.StyleSource;

/**
 * @param {adapt.net.Response} response
 * @param {adapt.xmldoc.XMLDocStore} store
 * @return {!adapt.task.Result.<adapt.xmldoc.XMLDocHolder>}
 */
adapt.ops.parseOPSResource = (response, store) => (/** @type {adapt.ops.OPSDocStore} */ (store)).parseOPSResource(response);

/**
 * @param {?function(string):?function(Blob):adapt.task.Result.<Blob>} fontDeobfuscator
 * @constructor
 * @extends {adapt.xmldoc.XMLDocStore}
 */
adapt.ops.OPSDocStore = function(fontDeobfuscator) {
    adapt.net.ResourceStore.call(this, adapt.ops.parseOPSResource, adapt.net.XMLHttpRequestResponseType.DOCUMENT);
    /** @type {?function(string):?function(Blob):adapt.task.Result.<Blob>} */ this.fontDeobfuscator = fontDeobfuscator;
    /** @type {Object.<string,adapt.ops.Style>} */ this.styleByKey = {};
    /** @type {Object.<string,adapt.taskutil.Fetcher.<adapt.ops.Style>>} */ this.styleFetcherByKey = {};
    /** @type {Object.<string,adapt.ops.Style>} */ this.styleByDocURL = {};
    /** @type {Object.<string,Array.<adapt.vtree.Trigger>>} */ this.triggersByDocURL = {};
    /** @type {adapt.cssvalid.ValidatorSet} */ this.validatorSet = null;
    /** @private @const @type {Array.<adapt.ops.StyleSource>} */ this.styleSheets = [];
    /** @private @type {boolean} */ this.triggerSingleDocumentPreprocessing = false;
};
goog.inherits(adapt.ops.OPSDocStore, adapt.net.ResourceStore);

/**
 * @param {?Array.<{url: ?string, text: ?string}>} authorStyleSheets
 * @param {?Array.<{url: ?string, text: ?string}>} userStyleSheets
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.ops.OPSDocStore.prototype.init = function(authorStyleSheets, userStyleSheets) {
    this.setStyleSheets(authorStyleSheets, userStyleSheets);
    const userAgentXML = adapt.base.resolveURL("user-agent.xml", adapt.base.resourceBaseURL);
    const frame = adapt.task.newFrame("OPSDocStore.init");
    const self = this;
    adapt.cssvalid.loadValidatorSet().then(validatorSet => {
        self.validatorSet = validatorSet;
        adapt.ops.loadUABase().then(() => {
            self.load(userAgentXML).then(() => {
                self.triggerSingleDocumentPreprocessing = true;
                frame.finish(true);
            });
        });
    });
    return frame.result();
};

/**
 * @param {adapt.xmldoc.XMLDocHolder} xmldoc
 * @return {adapt.ops.Style}
 */
adapt.ops.OPSDocStore.prototype.getStyleForDoc = function(xmldoc) {
    return this.styleByDocURL[xmldoc.url];
};

/**
 * @param {adapt.xmldoc.XMLDocHolder} xmldoc
 * @return {Array.<adapt.vtree.Trigger>}
 */
adapt.ops.OPSDocStore.prototype.getTriggersForDoc = function(xmldoc) {
    return this.triggersByDocURL[xmldoc.url];
};

/**
 * Set author stylesheets and user stylesheets. Existing style sheets are removed.
 * @private
 * @param {?Array.<adapt.ops.StyleSource>} authorStyleSheets
 * @param {?Array.<adapt.ops.StyleSource>} userStyleSheets
 */
adapt.ops.OPSDocStore.prototype.setStyleSheets = function(authorStyleSheets, userStyleSheets) {
    this.clearStyleSheets();
    if (authorStyleSheets) {
        authorStyleSheets.forEach(this.addAuthorStyleSheet, this);
    }
    if (userStyleSheets) {
        userStyleSheets.forEach(this.addUserStyleSheet, this);
    }
};

/**
 * @private
 */
adapt.ops.OPSDocStore.prototype.clearStyleSheets = function() {
    this.styleSheets.splice(0);
};

/**
 * @private
 * @param {adapt.ops.StyleSource} stylesheet
 */
adapt.ops.OPSDocStore.prototype.addAuthorStyleSheet = function(stylesheet) {
    let url = stylesheet.url;
    if (url) url = adapt.base.resolveURL(adapt.base.convertSpecialURL(url), adapt.base.baseURL);
    this.styleSheets.push({url, text: stylesheet.text,
        flavor: adapt.cssparse.StylesheetFlavor.AUTHOR, classes: null, media: null});
};

/**
 * @private
 * @param {adapt.ops.StyleSource} stylesheet
 */
adapt.ops.OPSDocStore.prototype.addUserStyleSheet = function(stylesheet) {
    let url = stylesheet.url;
    if (url) url = adapt.base.resolveURL(adapt.base.convertSpecialURL(url), adapt.base.baseURL);
    this.styleSheets.push({url, text: stylesheet.text,
        flavor: adapt.cssparse.StylesheetFlavor.USER, classes: null, media: null});
};

/**
 * @param {adapt.net.Response} response
 * @return {!adapt.task.Result.<adapt.xmldoc.XMLDocHolder>}
 */
adapt.ops.OPSDocStore.prototype.parseOPSResource = function(response) {
    /** @type {!adapt.task.Frame.<adapt.xmldoc.XMLDocHolder>} */ const frame
        = adapt.task.newFrame("OPSDocStore.load");
    const self = this;
    const url = response.url;

    // Check "?viv-toc-box" appended in TOCView.showTOC()
    const isTocBox = url.endsWith("?viv-toc-box");

    adapt.xmldoc.parseXMLResource(response, self).then(xmldoc => {
        if (!xmldoc) {
            frame.finish(null);
            return;
        }
        if (self.triggerSingleDocumentPreprocessing) {
            /** @type {!Array<!vivliostyle.plugin.PreProcessSingleDocumentHook>} */ const hooks =
                vivliostyle.plugin.getHooksForName(vivliostyle.plugin.HOOKS.PREPROCESS_SINGLE_DOCUMENT);
            for (var i = 0; i < hooks.length; i++) {
                try {
                    hooks[i](xmldoc.document);
                } catch (e) {
                    vivliostyle.logging.logger.warn("Error during single document preprocessing:", e);
                }
            }
        }
        const triggers = [];
        const triggerList = xmldoc.document.getElementsByTagNameNS(adapt.base.NS.epub, "trigger");
        for (var i = 0; i < triggerList.length; i++) {
            const triggerElem = triggerList[i];
            const observer = triggerElem.getAttributeNS(adapt.base.NS.EV, "observer");
            const event = triggerElem.getAttributeNS(adapt.base.NS.EV, "event");
            const action = triggerElem.getAttribute("action");
            const ref = triggerElem.getAttribute("ref");
            if (observer && event && action && ref) {
                triggers.push({observer, event, action, ref});
            }
        }
        self.triggersByDocURL[url] = triggers;
        const sources = /** @type {Array.<adapt.ops.StyleSource>} */ ([]);
        const userAgentURL = adapt.base.resolveURL("user-agent-page.css", adapt.base.resourceBaseURL);
        sources.push({url: userAgentURL, text:null,
            flavor:adapt.cssparse.StylesheetFlavor.USER_AGENT, classes: null, media: null});
        const head = xmldoc.head;
        if (!isTocBox && head) {
            for (let c = head.firstChild; c; c = c.nextSibling) {
                if (c.nodeType != 1)
                    continue;
                const child = /** @type {Element} */ (c);
                const ns = child.namespaceURI;
                const localName = child.localName;
                if (ns == adapt.base.NS.XHTML) {
                    if (localName == "style") {
                        const classes = child.getAttribute("class");
                        const media = child.getAttribute("media");
                        const title = child.getAttribute("title");
                        sources.push({url, text:child.textContent,
                            flavor:adapt.cssparse.StylesheetFlavor.AUTHOR, classes: (title ? classes : null), media});
                    } else if (localName == "link") {
                        const rel = child.getAttribute("rel");
                        const classes = child.getAttribute("class");
                        const media = child.getAttribute("media");
                        if (rel == "stylesheet" || (rel == "alternate stylesheet" && classes)) {
                            var src = child.getAttribute("href");
                            src = adapt.base.resolveURL(src, url);
                            const title = child.getAttribute("title");
                            sources.push({url:src, text:null, classes: (title ? classes : null), media,
                                flavor:adapt.cssparse.StylesheetFlavor.AUTHOR});
                        }
                    } else if (localName == "meta" && child.getAttribute("name") == "viewport") {
                        sources.push({url, text: adapt.ops.processViewportMeta(child),
                            flavor:adapt.cssparse.StylesheetFlavor.AUTHOR, classes: null, media: null});
                    }
                } else if (ns == adapt.base.NS.FB2) {
                    if (localName == "stylesheet" && child.getAttribute("type") == "text/css") {
                        sources.push({url, text:child.textContent,
                            flavor:adapt.cssparse.StylesheetFlavor.AUTHOR, classes: null, media: null});
                    }
                } else if (ns == adapt.base.NS.SSE && localName === "property") {
                    // look for stylesheet specification like:
                    // <property><name>stylesheet</name><value>style.css</value></property>
                    const name = child.getElementsByTagName("name")[0];
                    if (name && name.textContent === "stylesheet") {
                        const value = child.getElementsByTagName("value")[0];
                        if (value) {
                            var src = adapt.base.resolveURL(value.textContent, url);
                            sources.push({
                                url: src, text: null, classes: null, media: null,
                                flavor: adapt.cssparse.StylesheetFlavor.AUTHOR
                            });
                        }
                    }
                }
            }
        }
        if (!isTocBox) {
            for (var i = 0; i < self.styleSheets.length; i++) {
                sources.push(self.styleSheets[i]);
            }
        }
        let key = "";
        for (var i = 0; i < sources.length; i++) {
            key += sources[i].url;
            key += "^";
            if (sources[i].text) {
                key += sources[i].text;
            }
            key += "^";
        }
        let style = self.styleByKey[key];
        if (style) {
            self.styleByDocURL[url] = style;
            frame.finish(xmldoc);
            return;
        }
        let fetcher = self.styleFetcherByKey[key];
        if (!fetcher) {
            fetcher = new adapt.taskutil.Fetcher(() => {
                /** @type {!adapt.task.Frame.<adapt.ops.Style>} */ const innerFrame
                    = adapt.task.newFrame("fetchStylesheet");
                let index = 0;
                const sph = new adapt.ops.StyleParserHandler(self.validatorSet);
                innerFrame.loop(() => {
                    if (index < sources.length) {
                        const source = sources[index++];
                        sph.startStylesheet(source.flavor);
                        if (source.text !== null) {
                            return adapt.cssparse.parseStylesheetFromText(source.text, sph, source.url, source.classes, source.media).thenReturn(true);
                        } else {
                            return adapt.cssparse.parseStylesheetFromURL(source.url, sph, source.classes, source.media);
                        }
                    }
                    return adapt.task.newResult(false);
                }).then(() => {
                    const cascade = sph.cascadeParserHandler.finish();
                    style = new adapt.ops.Style(self, sph.rootScope, sph.pageScope, cascade, sph.rootBox,
                        sph.fontFaces, sph.footnoteProps, sph.flowProps, sph.viewportProps, sph.pageProps);
                    self.styleByKey[key] = style;
                    delete self.styleFetcherByKey[key];
                    innerFrame.finish(style);
                });
                return innerFrame.result();
            }, `FetchStylesheet ${url}`);
            self.styleFetcherByKey[key] = fetcher;
            fetcher.start();
        }
        fetcher.get().then(style => {
            self.styleByDocURL[url] = style;
            frame.finish(xmldoc);
        });
    });
    return frame.result();
};
