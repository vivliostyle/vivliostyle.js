/**
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
 * @fileoverview Types - Type definiions.
 */
import * as Base from "./base";
import * as Css from "./css";
import * as Diff from "./diff";
import * as Exprs from "./exprs";
import * as GeometryUtil from "./geometry-util";
import * as Task from "./task";
import * as TaskUtil from "./task-util";

export type FormattingContextType =
  "Block" | "RepetitiveElementsOwner" | "Table";

export type FragmentLayoutConstraintType =
  "AfterIfContinue" | "EntireTable" | "RepetitiveElementsOwner" | "TableRow";

export namespace CssCascade {
  export type ElementStyle = { [key: string]: any };

  export interface CascadeValue {
    readonly value: Css.Val;
    readonly priority: number;
    getBaseValue(): CascadeValue;
    filterValue(visitor: Css.Visitor): CascadeValue;
    increaseSpecificity(specificity: number): CascadeValue;
    evaluate(
      context: Exprs.Context,
      propName?: string,
      percentRef?: number,
      vertical?: boolean,
    ): Css.Val;
    isEnabled(context: Exprs.Context): boolean;
  }
}

export namespace CssStyler {
  export interface AbstractStyler {
    getStyle(element: Element, deep: boolean): CssCascade.ElementStyle;
    processContent(
      element: Element,
      styles: { [key: string]: Css.Val },
      nodeContext: Vtree.NodeContext,
    );
  }
}

export namespace Layout {
  /**
   * Represents a constraint on layout
   */
  export interface LayoutConstraint {
    /**
     * Returns if this constraint allows the node context to be laid out at the
     * current position.
     */
    allowLayout(nodeContext: Vtree.NodeContext): boolean;
  }
  /**
   * Represents constraints on laying out fragments
   */
  export interface FragmentLayoutConstraint {
    flagmentLayoutConstraintType: FragmentLayoutConstraintType;
    allowLayout(
      nodeContext: Vtree.NodeContext | null,
      overflownNodeContext: Vtree.NodeContext | null,
      column: Column,
    ): boolean;
    nextCandidate(nodeContext: Vtree.NodeContext | null): boolean;
    postLayout(
      allowed: boolean,
      positionAfter: Vtree.NodeContext | null,
      initialPosition: Vtree.NodeContext | null,
      column: Column,
    );
    finishBreak(
      nodeContext: Vtree.NodeContext | null,
      column: Column,
    ): Task.Result<boolean>;
    equalsTo(constraint: FragmentLayoutConstraint): boolean;
    getPriorityOfFinishBreak(): number;
  }

  /**
   * Potential breaking position.
   */
  export interface BreakPosition {
    /**
     * @return break position, if found
     */
    findAcceptableBreak(
      column: Column,
      penalty: number,
    ): Vtree.NodeContext | null;
    /**
     * @return penalty for this break position
     */
    getMinBreakPenalty(): number;
    calculateOffset(column: Column): { current: number; minimum: number };
    breakPositionChosen(column: Column): void;
  }

  export interface AbstractBreakPosition extends BreakPosition {
    getNodeContext(): Vtree.NodeContext | null;
  }

  export type BreakPositionAndNodeContext = {
    breakPosition: BreakPosition;
    nodeContext: Vtree.NodeContext;
  };

  export type OverflowCheckResult = {
    overflown: boolean;
    recordedRepetitiveOverflow: boolean;
  };

  export type LineStylingResult = {
    nodeContext: Vtree.NodeContext | null;
    checkPoints: Vtree.RenderedNodeContext[];
  };

  /**
   * Potential breaking position inside CSS box (between lines).
   * @param checkPoints array of breaking points for
   *    breakable block
   */
  export interface BoxBreakPosition extends AbstractBreakPosition {
    breakNodeContext: Vtree.NodeContext | null;
    readonly checkPoints: Vtree.RenderedNodeContext[];
    readonly penalty: number;
  }

  /**
   * Potential edge breaking position.
   */
  export interface EdgeBreakPosition extends AbstractBreakPosition {
    overflowIfRepetitiveElementsDropped: boolean;
    readonly position: Vtree.NodeContext;
    readonly breakOnEdge: string | null;
    overflows: boolean;
    readonly computedBlockSize: number;
  }

  export interface Column extends Vtree.Container {
    last: Node | null;
    viewDocument: Document;
    flowRootFormattingContext: Vtree.FormattingContext;
    // Issue #1842: distinguishes auto-advanced follow-up columns from the first
    // column on a page so leading-edge forced breaks can be handled differently.
    isNonFirstColumn: boolean;
    isFloat: boolean;
    isFootnote: boolean;
    startEdge: number;
    endEdge: number;
    beforeEdge: number;
    afterEdge: number;
    footnoteEdge: number;
    chunkPositions: Vtree.ChunkPosition[];
    bands: GeometryUtil.Band[];
    overflown: boolean;
    breakPositions: BreakPosition[];
    pageBreakType: string | null;
    forceNonfitting: boolean;
    leftFloatEdge: number;
    /**
     * bottom of the bottommost left float
     */
    rightFloatEdge: number;
    /**
     * bottom of the bottommost right float
     */
    bottommostFloatTop: number;
    /**
     * Top of the bottommost float
     */
    stopAtOverflow: boolean;
    lastAfterPosition: Vtree.NodePosition | null;
    fragmentLayoutConstraints: FragmentLayoutConstraint[];
    pseudoParent: Column | null;
    nodeContextOverflowingDueToRepetitiveElements: Vtree.NodeContext | null;
    blockDistanceToBlockEndFloats: number;
    lastLineStride: number;
    computedBlockSize: number;

    layoutContext: Vtree.LayoutContext;
    clientLayout: Vtree.ClientLayout;
    readonly layoutConstraint: LayoutConstraint;
    readonly pageFloatLayoutContext: PageFloats.AttachedPageFloatLayoutContext;

    getTopEdge(): number;
    getBottomEdge(): number;
    getLeftEdge(): number;
    getRightEdge(): number;
    asFloatNodeContext(
      nodeContext: Vtree.NodeContext,
    ): Vtree.FloatNodeContext | null;
    stopByOverflow(nodeContext: Vtree.NodeContext): boolean;
    isOverflown(edge: number): boolean;
    getExclusions(): GeometryUtil.Shape[];
    openAllViews(position: Vtree.NodePosition): Task.Result<Vtree.NodeContext>;
    calculateOffsetInNodeForNodeContext(position: Vtree.NodePosition): number;
    /**
     * @param count first-XXX nesting identifier
     */
    maybePeelOff(
      position: Vtree.NodeContext,
      count: number,
    ): Task.Result<Vtree.NodeContext>;
    /**
     * Builds the view until a CSS box edge is reached.
     * @param position start source position.
     * @param checkPoints array to append possible breaking points.
     * @return holding box edge position reached or null if the source is exhausted.
     */
    buildViewToNextBlockEdge(
      position: Vtree.NodeContext | null,
      checkPoints: Vtree.RenderedNodeContext[],
    ): Task.Result<Vtree.NodeContext | null>;
    nextInTree(
      position: Vtree.NodeContext,
      atUnforcedBreak?: boolean,
    ): Task.Result<Vtree.NodeContext | null>;
    /**
     * Builds the view for a single unbreakable element.
     * @param position start source position.
     * @return holding box edge position reached or null if the source is exhausted.
     */
    buildDeepElementView(
      position: Vtree.NodeContext | null,
    ): Task.Result<Vtree.NodeContext | null>;

    /**
     * Create a single floating element (for exclusion areas).
     * @param ref container's child to insert float before (can be null).
     * @param side float side ("left" or "right").
     * @param width float inline dimension.
     * @param height float box progression dimension.
     * @return newly created float element.
     */
    createFloat(
      ref: Node | null,
      side: string,
      width: number,
      height: number,
    ): Element;
    /**
     * Remove all the exclusion floats.
     */
    killFloats(): void;
    /**
     * Create exclusion floats for a column.
     */
    createFloats(): void;
    /**
     * @param nodeContext position after the block
     * @param checkPoints array of possible breaking points.
     * @param index index of the breaking point
     * @param boxOffset box offset
     * @return edge position
     */
    calculateEdge(
      nodeContext: Vtree.NodeContext | null,
      checkPoints: Vtree.RenderedNodeContext[],
      index: number,
      boxOffset: number,
    ): number;
    /**
     * Parse CSS computed length (in pixels)
     * @param val CSS length in "px"
     * @return parsed and adjusted length value in pixels or 0 if not parsable
     */
    parseComputedLength(val: string): number;
    /**
     * Reads element's computed CSS margin.
     */
    getComputedMargin(element: Element): GeometryUtil.Insets;
    /**
     * Reads element's computed padding + borders.
     */
    getComputedPaddingBorder(element: Element): GeometryUtil.Insets;
    /**
     * Reads element's computed CSS insets(margins + border + padding or margins :
     * depends on box-sizing)
     */
    getComputedInsets(element: Element): GeometryUtil.Insets;
    /**
     * Set element's computed CSS insets to Column Container
     */
    setComputedInsets(element: Element, container: Column): void;
    /**
     * Set element's computed width and height to Column Container
     */
    setComputedWidthAndHeight(element: Element, container: Column): void;
    /**
     * Layout a single unbreakable element.
     */
    layoutUnbreakable(
      nodeContextIn: Vtree.NodeContext,
    ): Task.Result<Vtree.NodeContext | null>;
    /**
     * Layout a single float element.
     */
    layoutFloat(
      nodeContext: Vtree.RenderedNodeContext,
    ): Task.Result<Vtree.NodeContext | null>;

    setupFloatArea(
      area: PageFloatArea,
      floatReference: PageFloats.FloatReference,
      floatSide: string,
      anchorEdge: number | null,
      strategy: PageFloats.PageFloatLayoutStrategy,
      condition: PageFloats.PageFloatPlacementCondition,
    ): Task.Result<boolean>;
    createPageFloatArea(
      float: PageFloats.PageFloat,
      floatSide: string,
      anchorEdge: number | null,
      strategy: PageFloats.PageFloatLayoutStrategy,
      condition: PageFloats.PageFloatPlacementCondition,
    ): Task.Result<PageFloatArea | null>;
    layoutSinglePageFloatFragment(
      continuations: PageFloats.PageFloatContinuation[],
      floatSide: string,
      clearSide: string | null,
      allowFragmented: boolean,
      strategy: PageFloats.PageFloatLayoutStrategy,
      anchorEdge: number | null,
      pageFloatFragment?: PageFloats.PageFloatFragment | null,
    ): Task.Result<SinglePageFloatLayoutResult>;
    layoutPageFloatInner(
      continuation: PageFloats.PageFloatContinuation,
      strategy: PageFloats.PageFloatLayoutStrategy,
      anchorEdge: number | null,
      pageFloatFragment?: PageFloats.PageFloatFragment | null,
    ): Task.Result<boolean>;
    setFloatAnchorViewNode(
      nodeContext: Vtree.RenderedNodeContext,
    ): Vtree.RenderedNodeContext;
    resolveFloatReferenceFromColumnSpan(
      floatReference: PageFloats.FloatReference,
      columnSpan: Css.Val | null,
      nodeContext: Vtree.NodeContext,
    ): Task.Result<PageFloats.FloatReference>;
    layoutPageFloat(
      nodeContext: Vtree.FloatNodeContext,
    ): Task.Result<Vtree.NodeContext | null>;
    processLineStyling(
      nodeContext: Vtree.NodeContext,
      resNodeContext: Vtree.NodeContext | null,
      checkPoints: Vtree.RenderedNodeContext[],
    ): Task.Result<LineStylingResult>;
    isLoneImage(checkPoints: Vtree.RenderedNodeContext[]): boolean;
    getTrailingMarginEdgeAdjustment(
      trailingEdgeContexts: Vtree.NodeContext[],
    ): number;
    /**
     * Layout a single CSS box.
     */
    layoutBreakableBlock(
      nodeContext: Vtree.NodeContext,
    ): Task.Result<Vtree.NodeContext | null>;
    postLayoutBlock(
      nodeContext: Vtree.NodeContext | null,
      checkPoints: Vtree.RenderedNodeContext[],
    ): void;
    findEndOfLine(
      linePosition: number,
      checkPoints: Vtree.RenderedNodeContext[],
      isUpdateMaxReachedAfterEdge: boolean,
    ): {
      nodeContext: Vtree.RenderedNodeContext;
      index: number;
      checkPointIndex: number;
    };
    findAcceptableBreakInside(
      checkPoints: Vtree.RenderedNodeContext[],
      edgePosition: number,
      force: boolean,
    ): Vtree.NodeContext | null;
    resolveTextNodeBreaker(nodeContext: Vtree.NodeContext): TextNodeBreaker;
    /**
     * Read ranges skipping special elments
     */
    getRangeBoxes(
      start: Element | Text,
      end: Element | Text,
    ): Vtree.ClientRect[];
    /**
     * Give block's initial and final nodes, find positions of the line bottoms.
     * This is, of course, somewhat hacky implementation.
     * @return position of line breaks
     */
    findLinePositions(checkPoints: Vtree.RenderedNodeContext[]): number[];
    calculateClonedPaddingBorder(nodeContext: Vtree.NodeContext): number;
    findBoxBreakPosition(
      bp: BoxBreakPosition,
      force: boolean,
    ): Vtree.NodeContext | null;
    getAfterEdgeOfBlockContainer(nodeContext: Vtree.NodeContext): number;
    findFirstOverflowingEdgeAndCheckPoint(
      checkPoints: Vtree.RenderedNodeContext[],
    ): {
      edge: number;
      checkPoint: Vtree.RenderedNodeContext | null;
    };
    findEdgeBreakPosition(bp: EdgeBreakPosition): Vtree.NodeContext;
    /**
     * Finalize a line break.
     * @return holing true
     */
    finishBreak(
      nodeContext: Vtree.NodeContext,
      forceRemoveSelf: boolean,
      endOfColumn: boolean,
    ): Task.Result<boolean>;
    findAcceptableBreakPosition(): BreakPositionAndNodeContext | null;
    doFinishBreak(
      nodeContext: Vtree.NodeContext | null,
      overflownNodeContext: Vtree.NodeContext | null,
      initialNodeContext: Vtree.NodeContext | null,
      initialComputedBlockSize: number,
    ): Task.Result<Vtree.NodeContext | null>;
    /**
     * Determines if a page break is acceptable at this position
     */
    isBreakable(flowPosition: Vtree.NodeContext): boolean;
    checkOverflowAndSaveEdge(
      nodeContext: Vtree.NodeContext | null,
      trailingEdgeContexts: Vtree.NodeContext[] | null,
    ): OverflowCheckResult;
    /**
     * Save a possible page break position on a CSS block edge. Check if it
     * overflows.
     * @return true if overflows
     */
    checkOverflowAndSaveEdgeAndBreakPosition(
      nodeContext: Vtree.NodeContext | null,
      trailingEdgeContexts: Vtree.NodeContext[] | null,
      saveEvenOverflown: boolean,
      breakAtTheEdge: string | null,
    ): boolean;
    applyClearance(nodeContext: Vtree.RenderedNodeContext): Element | null;
    isBFC(formattingContext: Vtree.FormattingContext): boolean;
    /**
     * Skips positions until either the start of unbreakable block or inline
     * content. Also sets breakBefore on the result combining break-before and
     * break-after properties from all elements that meet at the edge.
     */
    skipEdges(
      nodeContext: Vtree.NodeContext,
      leadingEdge: boolean,
      forcedBreakValue: string | null,
    ): Task.Result<Vtree.NodeContext | null>;
    /**
     * Skips non-renderable positions until it hits the end of the flow or some
     * renderable content. Returns the nodeContext that was passed in if some
     * content remains and null if all content could be skipped.
     */
    skipTailEdges(
      nodeContext: Vtree.NodeContext,
    ): Task.Result<Vtree.NodeContext | null>;
    layoutFloatOrFootnote(
      nodeContext: Vtree.FloatNodeContext,
    ): Task.Result<Vtree.NodeContext | null>;
    /**
     * Layout next portion of the source.
     */
    layoutNext(
      nodeContext: Vtree.NodeContext,
      leadingEdge: boolean,
      forcedBreakValue?: string | null,
    ): Task.Result<Vtree.NodeContext>;
    clearOverflownViewNodes(
      nodeContext: Vtree.NodeContext | null,
      removeSelf: boolean,
    ): void;
    /**
     * Save the potential breaking position at the edge. Should, in general, save
     * "after" position but only after skipping all of the "before" ones and
     * getting to the non-empty content (to get breakAtEdge right).
     */
    saveEdgeBreakPosition(
      position: Vtree.NodeContext,
      breakAtEdge: string | null,
      overflows: boolean,
    ): void;
    /**
     * @param checkPoints array of breaking points for breakable block
     */
    saveBoxBreakPosition(checkPoints: Vtree.RenderedNodeContext[]): void;
    updateMaxReachedAfterEdge(afterEdge: number): void;
    /**
     * @param chunkPosition starting position.
     * @return holding end position.
     */
    layout(
      chunkPosition: Vtree.ChunkPosition,
      leadingEdge: boolean,
      breakAfter?: string | null,
    ): Task.Result<Vtree.ChunkPosition | null>;
    isFullWithPageFloats(): boolean;
    getMaxBlockSizeOfPageFloats(): number;
    doFinishBreakOfFragmentLayoutConstraints(
      nodeContext: Vtree.NodeContext,
    ): Task.Result<boolean>;
    /**
     * @param nodeContext starting position.
     * @return holding end position.
     */
    doLayout(
      nodeContext: Vtree.NodeContext | null,
      leadingEdge: boolean,
      breakAfter?: string | null,
    ): Task.Result<{
      nodeContext: Vtree.NodeContext | null;
      overflownNodeContext: Vtree.NodeContext | null;
    }>;
    saveDistanceToBlockEndFloats(): void;
    collectElementsOffset(): RepetitiveElement.ElementsOffset[];
  }

  export type SinglePageFloatLayoutResult = {
    floatArea: PageFloatArea | null;
    pageFloatFragment: PageFloats.PageFloatFragment | null;
    newPosition: Vtree.ChunkPosition | null;
  };

  /**
   * breaking point resolver for Text Node.
   */
  export interface TextNodeBreaker {
    breakTextNode(
      textNode: Text,
      nodeContext: Vtree.NodeContext,
      low: number,
      checkPoints: Vtree.RenderedNodeContext[],
      checkpointIndex: number,
      force: boolean,
    ): Vtree.NodeContext;
    breakAfterSoftHyphen(
      textNode: Text,
      text: string,
      viewIndex: number,
      nodeContext: Vtree.NodeContext,
    ): { viewIndex: number; nodeContext: Vtree.NodeContext };
    breakAfterOtherCharacter(
      textNode: Text,
      text: string,
      viewIndex: number,
      nodeContext: Vtree.NodeContext,
    ): number;
    updateNodeContext(
      nodeContext: Vtree.NodeContext,
      viewIndex: number,
      textNode: Text,
    ): Vtree.NodeContext;
  }

  export interface LayoutMode {
    doLayout(
      nodeContext: Vtree.NodeContext,
      column: Layout.Column,
    ): Task.Result<Vtree.NodeContext | null>;
    accept(
      nodeContext: Vtree.NodeContext | null,
      column: Layout.Column,
    ): boolean;
    postLayout(
      positionAfter: Vtree.NodeContext | null,
      initialPosition: Vtree.NodeContext,
      column: Layout.Column,
      accepted: boolean,
    ): boolean;
  }

  export interface PageFloatArea extends Column {
    adjustContentRelativeSize: boolean;
    readonly floatSide: string;
    readonly parentContainer: Vtree.Container;
    readonly parentElement: Element | null;

    applyCompactFootnoteDisplay(): void;
    convertPercentageSizesToPx(target: Element): void;
    fixFloatSizeAndPosition(nodeContext: Vtree.NodeContext): void;
    getRootViewNodeCount(): number;
    hasNonPseudoTextContentAfter(rootViewNodeIndex: number): boolean;
    appendContentFrom(other: PageFloatArea): void;
    getContentBlockMarginAfter(): number;
    getContentInlineSize(): number;
  }
}

export namespace LayoutProcessor {
  export interface BlockFormattingContext extends Vtree.FormattingContext {}

  export function isInstanceOfBlockFormattingContext(
    object: Vtree.FormattingContext,
  ): object is BlockFormattingContext {
    return object.formattingContextType === "Block";
  }
}

export namespace Net {
  export type FetchResponse = {
    status: number;
    statusText: string | null;
    url: string;
    contentType: string | null;
    responseText: string | null;
    responseXML: Document | null;
    responseBlob: Blob | null;
  };

  export interface ResourceStore<Resource> {
    resources: { [key: string]: Resource | null };
    fetchers: { [key: string]: TaskUtil.Fetcher<Resource | null> };
    readonly parser: (
      p1: FetchResponse,
      p2: ResourceStore<Resource>,
    ) => Task.Result<Resource | null>;
    readonly type: XMLHttpRequestResponseType;

    /**
     * @return resource for the given URL
     */
    load(
      url: string,
      opt_required?: boolean,
      opt_message?: string,
    ): Task.Result<Resource | null>;
    /**
     * @return fetcher for the resource for the given URL
     */
    fetch(
      url: string,
      opt_required?: boolean,
      opt_message?: string,
    ): TaskUtil.Fetcher<Resource | null> | null;
    get(url: string): XmlDoc.XMLDocHolder;
    delete(url: string): void;
  }
}

export namespace PageFloats {
  /**
   * @enum {string}
   */
  export enum FloatReference {
    INLINE = "inline",
    COLUMN = "column",
    REGION = "region",
    PAGE = "page",
  }

  export type PageFloatID = string;

  export interface PageFloat {
    order: number | null;
    id: PageFloatID | null;
    insidePageFloatArea: boolean;
    parentPageFloat: PageFloat | null;
    readonly nodePosition: Vtree.NodePosition;
    readonly floatReference: FloatReference;
    readonly floatSide: string;
    readonly clearSide: string | null;
    readonly flowName: string;
    readonly floatMinWrapBlock: Css.Numeric | null;

    getOrder(): number;
    getId(): PageFloatID;
    isAllowedOnContext(
      pageFloatLayoutContext: AttachedPageFloatLayoutContext,
    ): boolean;
    isAllowedToPrecede(other: PageFloat): boolean;
  }

  export interface PageFloatFragment {
    readonly floatReference: FloatReference;
    readonly floatSide: string;
    readonly clearSide: string | null;
    readonly continuations: PageFloatContinuation[];
    readonly area: Vtree.Container;
    readonly continues: boolean;

    hasFloat(float: PageFloat): boolean;
    findNotAllowedFloat(
      context: AttachedPageFloatLayoutContext,
    ): PageFloat | null;
    getOuterShape(): GeometryUtil.Shape;
    getOuterRect(): GeometryUtil.Rect;
    getOrder(): number;
    shouldBeStashedBefore(float: PageFloat): boolean;
    addContinuations(continuations: PageFloatContinuation[]): void;
    getFlowName(): string;
  }

  export interface PageFloatContinuation {
    readonly float: PageFloat;
    readonly nodePosition: Vtree.NodePosition;

    equals(other: PageFloatContinuation | null): boolean;
  }

  export type PageFloatPlacementCondition = {
    [key: string]: boolean;
  };

  export interface PageFloatLayoutContext {
    direction: Css.Val;
    floatFragments: PageFloatFragment[];
    ignoreFootnoteAreaMaxHeight: boolean;
    readonly parent: PageFloatLayoutContext | null;
    readonly effectiveParent: PageFloatLayoutContext | null;
    readonly flowName: string | null;
    readonly generatingNodePosition: Vtree.NodePosition | null;

    addPageFloat(float: PageFloat): void;
    getPageFloatLayoutContext(
      floatReference: FloatReference,
    ): PageFloatLayoutContext;
    findPageFloatByNodePosition(
      nodePosition: Vtree.NodePosition,
    ): PageFloat | null;
    isForbidden(float: PageFloat): boolean;
    findPageFloatFragment(float: PageFloat): PageFloatFragment | null;
    hasFloatFragments(condition?: (p1: PageFloatFragment) => boolean): boolean;
    hasContinuingFloatFragmentsInFlow(flowName: string): boolean;
    markPageFloatAnchorSeen(float: PageFloat): void;
    registerPageFloatAnchor(float: PageFloat, anchorViewNode: Node): void;
    deferPageFloat(continuation: PageFloatContinuation): void;
    removeFloatDeferredToNext(float: PageFloat): void;
    hasPrecedingFloatsDeferredToNext(
      float: PageFloat,
      ignoreReference?: boolean,
    ): boolean;
    getDeferredPageFloatContinuations(
      flowName?: string | null,
    ): PageFloatContinuation[];
    getPageFloatContinuationsDeferredToNext(
      flowName?: string | null,
    ): PageFloatContinuation[];
    isInvalidated(): boolean;
    validate(): void;
    discardStashedFragments(floatReference: FloatReference): void;
    getStashedFloatFragments(
      floatReference: FloatReference,
    ): PageFloatFragment[];
    getFloatFragmentExclusions(): GeometryUtil.Shape[];
    getLayoutConstraints(): Layout.LayoutConstraint[];
    addLayoutConstraint(
      layoutConstraint: Layout.LayoutConstraint,
      floatReference: FloatReference,
    ): void;
    lock(): void;
    unlock(): void;
    isLocked(): boolean;
  }

  /** Only the root and an attached context can be one, and only these hold children. */
  export interface ParentPageFloatLayoutContext extends PageFloatLayoutContext {
    readonly children: readonly AttachedPageFloatLayoutContext[];
    collectPageFloatAnchors(): any;
    getFloatsDeferredToNextInChildContexts(): PageFloat[];
    detachChildren(): AttachedPageFloatLayoutContext[];
    attachChildren(children: AttachedPageFloatLayoutContext[]): void;
  }

  /** Where a float goes can only be asked of a context bound to a container. */
  export interface AttachedPageFloatLayoutContext extends ParentPageFloatLayoutContext {
    readonly container: Vtree.Container;
    getPageFloatLayoutContext(
      floatReference: FloatReference,
    ): AttachedPageFloatLayoutContext;
    restoreStashedFragments(floatReference: FloatReference): void;
    addPageFloatFragment(
      floatFragment: PageFloatFragment,
      dontInvalidate?: boolean,
    ): void;
    removePageFloatFragment(
      floatFragment: PageFloatFragment,
      dontInvalidate?: boolean,
    ): void;
    initFootnoteRetryFromEmptyFragment(
      float: PageFloat,
      area: Layout.PageFloatArea,
    ): boolean;
    finish(): void;
    hasSameContainerAs(other: AttachedPageFloatLayoutContext): boolean;
    invalidate(): void;
    stashEndFloatFragments(float: PageFloat): void;
    /**
     * @param anchorEdge Null indicates that the anchor is not in the current
     *     container.
     * @return Logical float side (snap-block is resolved when init=false). Null
     *     indicates that the float area does not fit inside the container
     */
    setFloatAreaDimensions(
      area: Layout.PageFloatArea,
      floatReference: FloatReference,
      floatSide: string,
      anchorEdge: number | null,
      init: boolean,
      force: boolean,
      condition: PageFloatPlacementCondition,
    ): string | null;
    getMaxReachedAfterEdge(): number;
    getBlockEndEdgeOfBlockStartFloats(inlinePos?: number): number;
    getBlockStartEdgeOfBlockEndFloats(inlinePos?: number): number;
    getPageFloatClearEdge(clear: string, column: Layout.Column): number;
    getPageFloatPlacementCondition(
      float: PageFloat,
      floatSide: string,
      clearSide: string | null,
    ): PageFloatPlacementCondition;
    getMaxBlockSizeOfPageFloats(): number;
  }

  export interface PageFloatLayoutStrategy {
    appliesToNodeContext(nodeContext: Vtree.NodeContext): boolean;
    appliesToFloat(float: PageFloat): boolean;
    createPageFloat(
      nodeContext: Vtree.FloatNodeContext,
      pageFloatLayoutContext: AttachedPageFloatLayoutContext,
      column: Layout.Column,
    ): Task.Result<PageFloat>;
    createPageFloatFragment(
      continuations: PageFloatContinuation[],
      floatSide: string,
      clearSide: string | null,
      floatArea: Layout.PageFloatArea,
      continues: boolean,
    ): PageFloatFragment;
    findPageFloatFragment(
      float: PageFloat,
      pageFloatLayoutContext: AttachedPageFloatLayoutContext,
    ): PageFloatFragment | null;
    adjustPageFloatArea(
      floatArea: Layout.PageFloatArea,
      floatContainer: Vtree.Container,
      column: Layout.Column,
    ): Task.Result<void>;
    forbid(
      float: PageFloat,
      pageFloatLayoutContext: AttachedPageFloatLayoutContext,
    );
  }
}

export namespace Selectors {
  export interface AfterIfContinues {
    readonly sourceNode: Element;
    readonly styler: PseudoElement.PseudoelementStyler;

    createElement(
      column: Layout.Column,
      parentNodeContext: Vtree.ElementNodeContext,
    ): Task.Result<Element>;
  }

  export interface AfterIfContinuesLayoutConstraint
    extends Layout.FragmentLayoutConstraint {
    nodeContext: Vtree.ElementNodeContext;
    afterIfContinues: AfterIfContinues;
    pseudoElementHeight: number;

    getRepetitiveElements(): AfterIfContinuesElementsOffset;
  }

  export function isInstanceOfAfterIfContinuesLayoutConstraint(
    object: Layout.FragmentLayoutConstraint,
  ): object is AfterIfContinuesLayoutConstraint {
    return object && object.flagmentLayoutConstraintType == "AfterIfContinue";
  }

  export interface AfterIfContinuesElementsOffset
    extends RepetitiveElement.ElementsOffset {
    nodeContext: Vtree.NodeContext;
    pseudoElementHeight: number;

    affectTo(nodeContext: Vtree.NodeContext): boolean;
  }
}

export namespace PseudoElement {
  export interface PseudoelementStyler extends CssStyler.AbstractStyler {
    contentProcessed: { [key: string]: boolean };
    readonly element: Element;
    style: CssCascade.ElementStyle;
    readonly styler: CssStyler.AbstractStyler;
    readonly context: Exprs.Context;
    readonly exprContentListener: Vtree.ExprContentListener;
  }
}

export namespace RepetitiveElement {
  export interface RepetitiveElementsOwnerFormattingContext
    extends Vtree.FormattingContext {
    isRoot: boolean;
    repetitiveElements: RepetitiveElements | null;
    readonly parent: Vtree.FormattingContext | null;
    readonly rootSourceNode: Element;
    getRepetitiveElements(): RepetitiveElements | null;
    getRootViewNode(position: Vtree.NodeContext): Element | null;
    getRootNodeContext(
      nodeContext: Vtree.NodeContext,
    ): Vtree.NodeContext | null;
    initializeRepetitiveElements(vertical: boolean): void;
  }

  export function isInstanceOfRepetitiveElementsOwnerFormattingContext(
    object: Vtree.FormattingContext,
  ): object is RepetitiveElementsOwnerFormattingContext {
    const type = object.formattingContextType;
    return (
      type === "RepetitiveElementsOwner" ||
      Table.isInstanceOfTableFormattingContext(object)
    ); // subset
  }

  export interface ElementsOffset {
    calculateOffset(nodeContext: Vtree.NodeContext | null): number;
    calculateMinimumOffset(nodeContext: Vtree.NodeContext | null): number;
  }

  export interface RepetitiveElements extends ElementsOffset {
    isSkipHeader: boolean;
    isSkipFooter: boolean;
    enableSkippingFooter: boolean;
    enableSkippingHeader: boolean;
    doneInitialLayout: boolean;
    firstContentSourceNode: Element | null;
    lastContentSourceNode: Element | null;
    allowInsert: boolean;
    allowInsertRepeatitiveElements: boolean;
    ownerSourceNode: Element;

    setHeaderNodeContext(nodeContext: Vtree.NodeContext): void;
    setFooterNodeContext(nodeContext: Vtree.NodeContext): void;
    updateHeight(column: Layout.Column): void;
    prepareLayoutFragment(): void;
    appendHeaderToFragment(
      rootNodeContext: Vtree.ElementNodeContext,
      firstChild: Node | null,
      column: Layout.Column,
    ): Task.Result<boolean>;
    appendFooterToFragment(
      rootNodeContext: Vtree.ElementNodeContext,
      firstChild: Node | null,
      column: Layout.Column,
    ): Task.Result<boolean>;
    appendElementToFragment(
      nodePosition: Vtree.NodePosition,
      rootNodeContext: Vtree.ElementNodeContext,
      firstChild: Node | null,
      column: Layout.Column,
    ): Task.Result<boolean>;
    moveChildren(from: Element, to: Element, firstChild: Node | null): void;
    isAfterLastContent(nodeContext: Vtree.NodeContext): boolean;
    isFirstContentNode(nodeContext: Vtree.NodeContext): boolean;
    isEnableToUpdateState(): boolean;
    updateState(): void;
    preventSkippingHeader(): void;
    preventSkippingFooter(): void;
    isHeaderRegistered(): boolean;
    isFooterRegistered(): boolean;
    isHeaderSourceNode(node: Node): boolean;
    isFooterSourceNode(node: Node): boolean;
  }

  export interface RepetitiveElementsOwnerLayoutConstraint
    extends Layout.FragmentLayoutConstraint {
    getRepetitiveElements(): RepetitiveElements | null;
  }

  export function isInstanceOfRepetitiveElementsOwnerLayoutConstraint(
    object: Layout.FragmentLayoutConstraint,
  ): object is RepetitiveElementsOwnerLayoutConstraint {
    if (!object) {
      return false;
    }
    const type = object.flagmentLayoutConstraintType;
    return (
      type === "RepetitiveElementsOwner" ||
      Table.isInstanceOfTableRowLayoutConstraint(object)
    ); // subset
  }
}

export namespace Table {
  export interface TableFormattingContext
    extends RepetitiveElement.RepetitiveElementsOwnerFormattingContext {
    // FIXME
  }

  export function isInstanceOfTableFormattingContext(
    object: Vtree.FormattingContext,
  ): object is TableFormattingContext {
    return object.formattingContextType === "Table";
  }

  export interface TableRowLayoutConstraint
    extends RepetitiveElement.RepetitiveElementsOwnerLayoutConstraint {
    cellFragmentLayoutConstraints: {
      constraints: Layout.FragmentLayoutConstraint[];
      breakPosition: Vtree.NodeContext | null;
    }[];

    removeDummyRowNodes(nodeContext: Vtree.NodeContext): void;
    getElementsOffsetsForTableCell(
      column: Layout.Column | null,
    ): RepetitiveElement.ElementsOffset[];
  }

  export function isInstanceOfTableRowLayoutConstraint(
    object: Layout.FragmentLayoutConstraint,
  ): object is TableRowLayoutConstraint {
    return object && object.flagmentLayoutConstraintType === "TableRow";
  }
}

export namespace Vtree {
  export type ClientRect = {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
  };

  /**
   * Interface to read the position assigned to the elements and ranges by the
   * browser.
   */
  export interface ClientLayout {
    layoutBox: Element;
    window: Window;
    pixelRatio: number;
    scaleRatio: number;
    layoutUnitPerPixel: number;
    getRangeClientRects(range: Range): ClientRect[];
    getElementClientRect(element: Element): ClientRect;
    /**
     * @return element's computed style
     */
    getElementComputedStyle(element: Element): CSSStyleDeclaration;
    /**
     * Adjust length value with rendering precision.
     * @param value Length value to adjust
     * @return Adjusted length value
     */
    adjustLengthValue(value: number): number;
  }

  /**
   * Styling, creating a single node's view, etc.
   */
  export interface LayoutContext {
    /**
     * Creates a functionally equivalent, but uninitialized layout context,
     * suitable for building a separate column.
     */
    clone(): LayoutContext;
    /**
     * Set the current source node and create a view. Parameter firstTime
     * is true (and possibly offsetInNode > 0) if node was broken on
     * the previous page.
     * @return the rendered node context and whether children should be
     *     processed as well
     */
    setCurrent(
      nodeContext: BeforeEdgeNodeContext,
      firstTime: boolean,
      atUnforcedBreak?: boolean,
    ): Task.Result<RenderResult<BeforeEdgeNodeContext>>;
    setCurrent(
      nodeContext: NodeContext,
      firstTime: boolean,
      atUnforcedBreak?: boolean,
    ): Task.Result<RenderResult<NodeContext>>;
    /**
     * Set the container element that holds view elements produced from the
     * source.
     */
    setViewRoot(viewRoot: Element, isFootnote: boolean);
    /**
     * Moves to the next view node, creating it and appending it to the view tree
     * if needed.
     * @return that corresponds to the next view node
     */
    nextInTree(
      nodeContext: NodeContext,
      atUnforcedBreak?: boolean,
    ): Task.Result<NodeContext | null>;
    /**
     * Apply pseudo-element styles (if any).
     * @param target element to apply styles to
     */
    applyPseudoelementStyle(
      nodeContext: NodeContext,
      pseudoName: string,
      target: Element,
    ): void;
    /**
     * Apply styles to footnote container.
     * @param target element to apply styles to
     * @return vertical
     */
    applyFootnoteStyle(
      vertical: boolean,
      rtl: boolean,
      target: Element,
    ): Task.Result<boolean>;
    /**
     * Peel off innermost first-XXX pseudoelement, create and create view nodes
     * after the end of that pseudoelement.
     */
    peelOff(
      nodeContext: ChildNodeContext,
      nodeOffset: number,
    ): Task.Result<NodeContext>;
    /**
     * Process a block-end edge of a fragmented block.
     */
    processFragmentedBlockEdge(nodeContext: NodeContext);
    convertLengthToPx(
      numeric: Css.Numeric,
      viewNode: Node,
      clientLayout: ClientLayout,
    ): number | Css.Numeric;
    /**
     * Returns if two NodePositions represents the same position in the document.
     */
    isSameNodePosition(
      nodePosition1: NodePosition,
      nodePosition2: NodePosition,
    ): boolean;
    addEventListener(
      type: string,
      listener: Base.EventListener,
      capture?: boolean,
    ): void;
    removeEventListener(
      type: string,
      listener: Base.EventListener,
      capture?: boolean,
    ): void;
    dispatchEvent(evt: Base.Event): void;
  }

  /**
   * Formatting context.
   */
  export interface FormattingContext {
    formattingContextType: FormattingContextType;
    getName(): string;
    isFirstTime(nodeContext: NodeContext, firstTime: boolean): boolean;
    getParent(): FormattingContext | null;
    saveState(): any;
    restoreState(state: any);
  }

  export type NodePositionStep = {
    node: Node;
    shadowType: ShadowType;
    shadowContext: ShadowContext | null;
    nodeShadow: ShadowContext | null;
    shadowSibling: NodePositionStep | null;
    formattingContext: FormattingContext | null;
    fragmentIndex: number;
  };

  export type RootNodePositionStep = NodePositionStep & {
    shadowSibling: null;
  };

  export type NodePosition = {
    steps: [...NodePositionStep[], RootNodePositionStep];
    offsetInNode: number;
    after: boolean;
    preprocessedTextContent: Diff.Change[] | null;
  };

  /**
   * Handling of purely whitespace sequences between blocks
   * @enum {number}
   */
  export enum Whitespace {
    /**
     * Whitespace sequence between blocks is ignored
     */
    IGNORE,
    /**
     * Whitespace sequence between blocks is ignored unless it containes newline
     */
    NEWLINE,
    /**
     * Whitespace sequence between blocks is preserved
     */
    PRESERVE,
  }

  export interface ContainerGeometry {
    left: number;
    top: number;
    marginLeft: number;
    marginRight: number;
    marginTop: number;
    marginBottom: number;
    borderLeft: number;
    borderRight: number;
    borderTop: number;
    borderBottom: number;
    paddingLeft: number;
    paddingRight: number;
    paddingTop: number;
    paddingBottom: number;
    width: number;
    height: number;
    originX: number;
    originY: number;
    snapWidth: number;
    snapHeight: number;
    vertical: boolean; // vertical writing
    rtl: boolean;
    borderBoxSizing: boolean;
  }

  export interface Container extends ContainerGeometry {
    exclusions: GeometryUtil.Shape[] | null;
    innerShape: GeometryUtil.Shape | null;
    computedBlockSize: number;
    snapOffsetX: number;
    snapOffsetY: number;
    element: HTMLElement;

    getInsetTop(): number;
    getInsetBottom(): number;
    getInsetLeft(): number;
    getInsetRight(): number;
    getInsetBefore(): number;
    getInsetAfter(): number;
    getInsetStart(): number;
    getInsetEnd(): number;
    getBeforeEdge(box: ClientRect): number;
    getAfterEdge(box: ClientRect): number;
    getStartEdge(box: ClientRect): number;
    getEndEdge(box: ClientRect): number;
    getInlineSize(box: ClientRect): number;
    getBoxSize(box: ClientRect): number;
    getBoxDir(): number;
    getInlineDir(): number;
    copyFrom(other: Container): void;
    setVerticalPosition(top: number, height: number): void;
    setHorizontalPosition(left: number, width: number): void;
    setBlockPosition(start: number, extent: number): void;
    setInlinePosition(start: number, extent: number): void;
    clear(): void;
    getInnerShape(): GeometryUtil.Shape;
    getInnerRect(): GeometryUtil.Rect;
    getPaddingRect(): GeometryUtil.Rect;
    getOuterShape(
      outerShapeProp: Css.Val | null,
      context: Exprs.Context | null,
    ): GeometryUtil.Shape | null;
    getOuterRect(): GeometryUtil.Rect;
  }

  /**
   * @enum {number}
   */
  export enum ShadowType {
    NONE,
    CONTENT,
    ROOTLESS,
    ROOTED,
  }

  /**
   * Data about shadow tree instance.
   */
  export interface ShadowContext {
    readonly owner: Element;
    readonly root: Element;
    readonly xmldoc: XmlDoc.XMLDocHolder | null;
    readonly parentShadow: ShadowContext | null;
    subShadow: ShadowContext | null;
    readonly type: Vtree.ShadowType;
    readonly styler: CssStyler.AbstractStyler;

    equals(other: ShadowContext): boolean;
  }

  /**
   * Information about :first-letter or :first-line pseudoelements
   * @param count 0 - first-letter, 1 or more - first line(s)
   */
  export interface FirstPseudo {
    readonly outer: FirstPseudo | null;
    readonly count: number;
  }

  export type NodeContextKind =
    "open" | "element" | "text" | "after-element" | "after-text" | "after-none";

  export type PluginProps = {
    readonly [key: string]:
      string | number | undefined | null | (number | null)[];
  };

  export interface NodeContextCore {
    readonly kind: NodeContextKind;

    // position itself
    readonly offsetInNode: number;
    readonly shadowType: ShadowType; // parent's shadow type
    readonly shadowContext: Vtree.ShadowContext | null;
    readonly nodeShadow: Vtree.ShadowContext | null;
    readonly shadowSibling: NodeContext | null; // next "sibling" in the shadow tree
    // other stuff
    readonly inline: boolean;
    readonly overflow: boolean;
    readonly breakPenalty: number;
    readonly whitespace: Whitespace;
    readonly hyphenateCharacter: string | null;
    readonly breakWord: boolean;
    readonly breakBefore: string | null;
    readonly clearSpacer: Element | null;
    readonly display: string | null;
    readonly floatSide: string | null;
    readonly establishesBFC: boolean;
    readonly captionSide: string;
    readonly inlineBorderSpacing: number;
    readonly blockBorderSpacing: number;
    readonly inheritedProps: {
      [key: string]: number | string | Css.Val | undefined;
    };
    readonly vertical: boolean;
    readonly direction: string;
    readonly firstPseudo: FirstPseudo | null;
    readonly lang: string | null;
    readonly formattingContext: FormattingContext;
    readonly pluginProps: PluginProps;
    readonly fragmentIndex: number;
    readonly pageType: string | null;

    readonly sourceNode: Node;
    readonly parent: ParentNodeContext | null;
    readonly blockContainer: ElementNodeContext | null;
    readonly boxOffset: number;
  }

  export interface ElementStyleFields {
    readonly floatReference: PageFloats.FloatReference;
    readonly clearSide: string | null;
    readonly floatMinWrapBlock: Css.Numeric | null;
    readonly columnSpan: Css.Val | null;
    readonly flexContainer: boolean;
    readonly containingBlockForAbsolute: boolean;
    readonly breakAfter: string | null;
    readonly repeatOnBreak: string | null;
    readonly afterIfContinues: Selectors.AfterIfContinues | null;
    readonly footnotePolicy: Css.Ident | null;
  }

  export interface UnstyledFields {
    readonly floatReference: PageFloats.FloatReference.INLINE;
    readonly clearSide: null;
    readonly floatMinWrapBlock: null;
    readonly columnSpan: null;
    readonly flexContainer: false;
    readonly containingBlockForAbsolute: false;
    readonly breakAfter: null;
    readonly repeatOnBreak: null;
    readonly afterIfContinues: null;
    readonly footnotePolicy: null;
  }

  export interface OpenNodeContext extends NodeContextCore, UnstyledFields {
    readonly kind: "open";
    readonly after: false;
    readonly viewNode: null;
    readonly preprocessedTextContent: Diff.Change[] | null;
  }

  export interface BeforeElementNodeContext
    extends NodeContextCore, ElementStyleFields {
    readonly kind: "element";
    readonly after: false;
    readonly viewNode: Element;
    readonly preprocessedTextContent: Diff.Change[] | null;
  }

  export interface BeforeTextNodeContext
    extends NodeContextCore, UnstyledFields {
    readonly kind: "text";
    readonly after: false;
    readonly viewNode: Text;
    readonly parent: ParentNodeContext;
    readonly preprocessedTextContent: Diff.Change[];
  }

  export interface AfterElementNodeContext
    extends NodeContextCore, ElementStyleFields {
    readonly kind: "after-element";
    readonly after: true;
    readonly viewNode: Element;
    readonly preprocessedTextContent: Diff.Change[] | null;
  }

  export interface AfterTextNodeContext
    extends NodeContextCore, UnstyledFields {
    readonly kind: "after-text";
    readonly after: true;
    readonly viewNode: Text;
    readonly parent: ParentNodeContext;
    readonly preprocessedTextContent: Diff.Change[];
  }

  export interface AfterNoneNodeContext
    extends NodeContextCore, UnstyledFields {
    readonly kind: "after-none";
    readonly after: true;
    readonly viewNode: null;
    readonly preprocessedTextContent: Diff.Change[] | null;
  }

  /**
   * NodeContext represents a position in the document + layout-related
   * information attached to it. When after=false and offsetInNode=0, the
   * position is inside the element (node), but just before its first child.
   * When offsetInNode>0 it represents offset in the textual content of the
   * node. When after=true it represents position right after the last child
   * of the node. boxOffset is incremented by 1 for any valid node position.
   */
  export type NodeContext =
    | OpenNodeContext
    | BeforeElementNodeContext
    | BeforeTextNodeContext
    | AfterElementNodeContext
    | AfterTextNodeContext
    | AfterNoneNodeContext;

  export type BeforeEdgeNodeContext =
    OpenNodeContext | BeforeElementNodeContext | BeforeTextNodeContext;

  export type AfterEdgeNodeContext =
    AfterElementNodeContext | AfterTextNodeContext | AfterNoneNodeContext;

  export type ParentNodeContext = BeforeEdgeNodeContext;

  export type RenderResult<T extends NodeContext> = {
    readonly nodeContext: T;
    readonly processChildren: boolean;
  };

  export type ChildNodeContext = NodeContext & {
    readonly parent: ParentNodeContext;
  };

  export type RootNodeContext = NodeContext & {
    readonly parent: null;
    readonly shadowSibling: null;
  };

  export type TextNodeContext = BeforeTextNodeContext | AfterTextNodeContext;

  export type ElementNodeContext =
    BeforeElementNodeContext | AfterElementNodeContext;

  export type RenderedNodeContext = ElementNodeContext | TextNodeContext;

  export type ContainedElementNodeContext = ElementNodeContext & {
    readonly blockContainer: ElementNodeContext;
  };

  export type FloatNodeContext = ElementNodeContext & {
    readonly floatSide: string;
  };

  export type ClearNodeContext = ElementNodeContext & {
    readonly clearSide: string;
  };

  export type AfterIfContinuesNodeContext = ElementNodeContext & {
    readonly afterIfContinues: Selectors.AfterIfContinues;
  };

  export interface ChunkPosition {
    floats: NodePosition[] | null;
    primary: NodePosition;

    clone(): ChunkPosition;
    isSamePosition(other: ChunkPosition): boolean;
  }

  export type ExprContentListener = (
    p1: Exprs.Val,
    p2: string,
    p3: Document,
  ) => Node | null;
}

export namespace XmlDoc {
  export interface XMLDocHolder {
    lang: string | null;
    totalOffset: number;
    root: Base.ChildElement;
    body: Element;
    head: Element;
    last: Element;
    lastOffset: number;
    idMap: { [key: string]: Element } | null;
    readonly store: XMLDocStore | null;
    readonly url: string;
    readonly document: Document;

    doc(): NodeList;
    getElementOffset(element: Element): number;
    getNodeOffset(srcNode: Node, offsetInNode: number, after: boolean): number;
    getTotalOffset(): number;
    /**
     * @return last node such that its offset is less or equal to the given
     */
    getNodeByOffset(offset: number): Node;
    /**
     * Get element by URL in the source document(s). URL must be in either '#id'
     * or 'url#id' form.
     */
    getElement(url: string): Element | null;
  }

  export interface Predicate {
    readonly fn: (p1: Node) => boolean;

    check(node: Node): boolean;
    withAttribute(name: string, value: string): Predicate;
    withChild(name: string, opt_childPredicate?: Predicate): Predicate;
  }

  export interface NodeList {
    readonly nodes: Node[];

    asArray(): Node[];
    size(): number;
    /**
     * Filter with predicate
     */
    predicate(pr: Predicate): NodeList;
    forEachNode(fn: (p1: Node, p2: (p1: Node) => void) => void): NodeList;
    forEach<T>(fn: (p1: Node) => T): T[];
    forEachNonNull<T>(fn: (p1: Node) => T | null): T[];
    child(tag: string): NodeList;
    childElements(): NodeList;
    attribute(name: string): (string | null)[];
    textContent(): (string | null)[];
  }

  export type XMLDocStore = Net.ResourceStore<XMLDocHolder>;
}
