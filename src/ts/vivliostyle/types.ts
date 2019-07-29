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
import * as Base from "../adapt/base";
import * as Css from "../adapt/css";
import * as Exprs from "../adapt/expr";
import * as Geom from "../adapt/geom";
import * as Task from "../adapt/task";
import * as TaskUtil from "../adapt/taskutil";
import * as Vtree from "../adapt/vtree";
import * as Diff from "./diff";

export type FormattingContextType =
  | "Block"
  | "RepetitiveElementsOwner"
  | "Table";

export type FragmentLayoutConstraintType =
  | "AfterIfContinue"
  | "EntireTable"
  | "RepetitiveElementsOwner"
  | "TableRow";

export namespace CssCasc {
  export interface ElementStyle {}
}

export namespace CssStyler {
  export interface AbstractStyler {
    getStyle(element: Element, deep: boolean): CssCasc.ElementStyle;
    processContent(element: Element, styles: { [key: string]: Css.Val });
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
    allowLayout(nodeContext: ViewTree.NodeContext): boolean;
  }
  /**
   * Represents constraints on laying out fragments
   */
  export interface FragmentLayoutConstraint {
    flagmentLayoutConstraintType: FragmentLayoutConstraintType;
    allowLayout(
      nodeContext: ViewTree.NodeContext,
      overflownNodeContext: ViewTree.NodeContext,
      column: Column
    ): boolean;
    nextCandidate(nodeContext: ViewTree.NodeContext): boolean;
    postLayout(
      allowed: boolean,
      positionAfter: ViewTree.NodeContext,
      initialPosition: ViewTree.NodeContext,
      column: Column
    );
    finishBreak(
      nodeContext: ViewTree.NodeContext,
      column: Column
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
    findAcceptableBreak(column: Column, penalty: number): ViewTree.NodeContext;
    /**
     * @return penalty for this break position
     */
    getMinBreakPenalty(): number;
    calculateOffset(column: Column): { current: number; minimum: number };
    breakPositionChosen(column: Column): void;
  }

  export interface AbstractBreakPosition extends BreakPosition {
    getNodeContext(): ViewTree.NodeContext;
  }

  export type BreakPositionAndNodeContext = {
    breakPosition: BreakPosition;
    nodeContext: ViewTree.NodeContext;
  };

  /**
   * Potential breaking position inside CSS box (between lines).
   * @param checkPoints array of breaking points for
   *    breakable block
   */
  export interface BoxBreakPosition extends AbstractBreakPosition {
    breakNodeContext: ViewTree.NodeContext;
    readonly checkPoints: ViewTree.NodeContext[];
    readonly penalty: number;
  }

  /**
   * Potential edge breaking position.
   */
  export interface EdgeBreakPosition extends AbstractBreakPosition {
    overflowIfRepetitiveElementsDropped: boolean;
    readonly position: ViewTree.NodeContext;
    readonly breakOnEdge: string | null;
    overflows: boolean;
    readonly computedBlockSize: number;
  }

  export interface Column extends ViewTree.Container {
    last: Node;
    viewDocument: Document;
    flowRootFormattingContext: ViewTree.FormattingContext;
    isFloat: boolean;
    isFootnote: boolean;
    startEdge: number;
    endEdge: number;
    beforeEdge: number;
    afterEdge: number;
    footnoteEdge: number;
    box: Geom.Rect;
    chunkPositions: ViewTree.ChunkPosition[];
    bands: Geom.Band[];
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
    lastAfterPosition: ViewTree.NodePosition | null;
    fragmentLayoutConstraints: FragmentLayoutConstraint[];
    pseudoParent: Column;
    nodeContextOverflowingDueToRepetitiveElements: ViewTree.NodeContext | null;
    blockDistanceToBlockEndFloats: number;
    computedBlockSize: number;

    layoutContext: ViewTree.LayoutContext;
    clientLayout: ViewTree.ClientLayout;
    readonly layoutConstraint: LayoutConstraint;
    readonly pageFloatLayoutContext: PageFloats.PageFloatLayoutContext;

    getTopEdge(): number;
    getBottomEdge(): number;
    getLeftEdge(): number;
    getRightEdge(): number;
    isFloatNodeContext(nodeContext: ViewTree.NodeContext): boolean;
    stopByOverflow(nodeContext: ViewTree.NodeContext): boolean;
    isOverflown(edge: number): boolean;
    getExclusions(): Geom.Shape[];
    openAllViews(
      position: ViewTree.NodePosition
    ): Task.Result<ViewTree.NodeContext>;
    calculateOffsetInNodeForNodeContext(
      position: ViewTree.NodePosition
    ): number;
    /**
     * @param count first-XXX nesting identifier
     */
    maybePeelOff(
      position: ViewTree.NodeContext,
      count: number
    ): Task.Result<ViewTree.NodeContext>;
    /**
     * Builds the view until a CSS box edge is reached.
     * @param position start source position.
     * @param checkPoints array to append possible breaking points.
     * @return holding box edge position reached or null if the source is exhausted.
     */
    buildViewToNextBlockEdge(
      position: ViewTree.NodeContext,
      checkPoints: ViewTree.NodeContext[]
    ): Task.Result<ViewTree.NodeContext>;
    nextInTree(
      position: ViewTree.NodeContext,
      atUnforcedBreak?: boolean
    ): Task.Result<ViewTree.NodeContext>;
    /**
     * Builds the view for a single unbreakable element.
     * @param position start source position.
     * @return holding box edge position reached or null if the source is exhausted.
     */
    buildDeepElementView(
      position: ViewTree.NodeContext
    ): Task.Result<ViewTree.NodeContext>;

    /**
     * Create a single floating element (for exclusion areas).
     * @param ref container's child to insert float before (can be null).
     * @param side float side ("left" or "right").
     * @param width float inline dimension.
     * @param height float box progression dimension.
     * @return newly created float element.
     */
    createFloat(
      ref: Node,
      side: string,
      width: number,
      height: number
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
      nodeContext: ViewTree.NodeContext,
      checkPoints: ViewTree.NodeContext[],
      index: number,
      boxOffset: number
    ): number;
    /**
     * Parse CSS computed length (in pixels)
     * @param val CSS length in "px" units or a number.
     * @return value in pixels or 0 if not parsable
     */
    parseComputedLength(val: string | number): number;
    /**
     * Reads element's computed CSS margin.
     */
    getComputedMargin(element: Element): Geom.Insets;
    /**
     * Reads element's computed padding + borders.
     */
    getComputedPaddingBorder(element: Element): Geom.Insets;
    /**
     * Reads element's computed CSS insets(margins + border + padding or margins :
     * depends on box-sizing)
     */
    getComputedInsets(element: Element): Geom.Insets;
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
      nodeContextIn: ViewTree.NodeContext
    ): Task.Result<ViewTree.NodeContext>;
    /**
     * Layout a single float element.
     */
    layoutFloat(
      nodeContext: ViewTree.NodeContext
    ): Task.Result<ViewTree.NodeContext>;

    setupFloatArea(
      area: PageFloatArea,
      floatReference: PageFloats.FloatReference,
      floatSide: string,
      anchorEdge: number | null,
      strategy: PageFloats.PageFloatLayoutStrategy,
      condition: PageFloats.PageFloatPlacementCondition
    ): boolean;
    createPageFloatArea(
      float: PageFloats.PageFloat | null,
      floatSide: string,
      anchorEdge: number | null,
      strategy: PageFloats.PageFloatLayoutStrategy,
      condition: PageFloats.PageFloatPlacementCondition
    ): PageFloatArea | null;
    layoutSinglePageFloatFragment(
      continuations: PageFloats.PageFloatContinuation[],
      floatSide: string,
      clearSide: string | null,
      allowFragmented: boolean,
      strategy: PageFloats.PageFloatLayoutStrategy,
      anchorEdge: number | null,
      pageFloatFragment?: PageFloats.PageFloatFragment | null
    ): Task.Result<SinglePageFloatLayoutResult>;
    layoutPageFloatInner(
      continuation: PageFloats.PageFloatContinuation,
      strategy: PageFloats.PageFloatLayoutStrategy,
      anchorEdge: number | null,
      pageFloatFragment?: PageFloats.PageFloatFragment
    ): Task.Result<boolean>;
    setFloatAnchorViewNode(
      nodeContext: ViewTree.NodeContext
    ): ViewTree.NodeContext;
    resolveFloatReferenceFromColumnSpan(
      floatReference: PageFloats.FloatReference,
      columnSpan: Css.Val,
      nodeContext: ViewTree.NodeContext
    ): Task.Result<PageFloats.FloatReference>;
    layoutPageFloat(
      nodeContext: ViewTree.NodeContext
    ): Task.Result<ViewTree.NodeContext>;
    createJustificationAdjustmentElement(
      insertionPoint: Node,
      doc: Document,
      parentNode: Node,
      vertical: boolean
    ): HTMLElement;
    addAndAdjustJustificationElement(
      nodeContext: ViewTree.NodeContext,
      insertAfter: boolean,
      node: Node,
      insertionPoint: Node,
      doc: Document,
      parentNode: Node
    ): HTMLElement;
    compensateJustificationLineHeight(
      span: Element,
      br: Element,
      nodeContext: ViewTree.NodeContext
    ): void;
    /**
     * Fix justification of the last line of text broken across pages (if
     * needed).
     */
    fixJustificationIfNeeded(
      nodeContext: ViewTree.NodeContext,
      endOfColumn: boolean
    ): void;
    processLineStyling(
      nodeContext: ViewTree.NodeContext,
      resNodeContext: ViewTree.NodeContext,
      checkPoints: ViewTree.NodeContext[]
    ): Task.Result<ViewTree.NodeContext>;
    isLoneImage(checkPoints: ViewTree.NodeContext[]): boolean;
    getTrailingMarginEdgeAdjustment(
      trailingEdgeContexts: ViewTree.NodeContext[]
    ): number;
    /**
     * Layout a single CSS box.
     */
    layoutBreakableBlock(
      nodeContext: ViewTree.NodeContext
    ): Task.Result<ViewTree.NodeContext>;
    postLayoutBlock(
      nodeContext: ViewTree.NodeContext,
      checkPoints: ViewTree.NodeContext[]
    ): void;
    findEndOfLine(
      linePosition: number,
      checkPoints: ViewTree.NodeContext[],
      isUpdateMaxReachedAfterEdge: boolean
    ): {
      nodeContext: ViewTree.NodeContext;
      index: number;
      checkPointIndex: number;
    };
    findAcceptableBreakInside(
      checkPoints: ViewTree.NodeContext[],
      edgePosition: number,
      force: boolean
    ): ViewTree.NodeContext;
    resolveTextNodeBreaker(nodeContext: ViewTree.NodeContext): TextNodeBreaker;
    /**
     * Read ranges skipping special elments
     */
    getRangeBoxes(start: Node, end: Node): ViewTree.ClientRect[];
    /**
     * Give block's initial and final nodes, find positions of the line bottoms.
     * This is, of course, somewhat hacky implementation.
     * @return position of line breaks
     */
    findLinePositions(checkPoints: ViewTree.NodeContext[]): number[];
    calculateClonedPaddingBorder(nodeContext: ViewTree.NodeContext): number;
    findBoxBreakPosition(
      bp: BoxBreakPosition,
      force: boolean
    ): ViewTree.NodeContext;
    getAfterEdgeOfBlockContainer(nodeContext: ViewTree.NodeContext): number;
    findFirstOverflowingEdgeAndCheckPoint(
      checkPoints: ViewTree.NodeContext[]
    ): { edge: number; checkPoint: ViewTree.NodeContext | null };
    findEdgeBreakPosition(bp: EdgeBreakPosition): ViewTree.NodeContext;
    /**
     * Finalize a line break.
     * @return holing true
     */
    finishBreak(
      nodeContext: ViewTree.NodeContext,
      forceRemoveSelf: boolean,
      endOfColumn: boolean
    ): Task.Result<boolean>;
    findAcceptableBreakPosition(): BreakPositionAndNodeContext;
    doFinishBreak(
      nodeContext: ViewTree.NodeContext,
      overflownNodeContext: ViewTree.NodeContext,
      initialNodeContext: ViewTree.NodeContext,
      initialComputedBlockSize: number
    ): Task.Result<ViewTree.NodeContext>;
    /**
     * Determines if a page break is acceptable at this position
     */
    isBreakable(flowPosition: ViewTree.NodeContext): boolean;
    /**
     * Determines if an indent value is zero
     */
    zeroIndent(val: string | number): boolean;
    /**
     * @return true if overflows
     */
    checkOverflowAndSaveEdge(
      nodeContext: ViewTree.NodeContext,
      trailingEdgeContexts: ViewTree.NodeContext[]
    ): boolean;
    /**
     * Save a possible page break position on a CSS block edge. Check if it
     * overflows.
     * @return true if overflows
     */
    checkOverflowAndSaveEdgeAndBreakPosition(
      nodeContext: ViewTree.NodeContext,
      trailingEdgeContexts: ViewTree.NodeContext[],
      saveEvenOverflown: boolean,
      breakAtTheEdge: string | null
    ): boolean;
    applyClearance(nodeContext: ViewTree.NodeContext): boolean;
    isBFC(formattingContext: ViewTree.FormattingContext): boolean;
    /**
     * Skips positions until either the start of unbreakable block or inline
     * content. Also sets breakBefore on the result combining break-before and
     * break-after properties from all elements that meet at the edge.
     */
    skipEdges(
      nodeContext: ViewTree.NodeContext,
      leadingEdge: boolean,
      forcedBreakValue: string | null
    ): Task.Result<ViewTree.NodeContext>;
    /**
     * Skips non-renderable positions until it hits the end of the flow or some
     * renderable content. Returns the nodeContext that was passed in if some
     * content remains and null if all content could be skipped.
     */
    skipTailEdges(
      nodeContext: ViewTree.NodeContext
    ): Task.Result<ViewTree.NodeContext>;
    layoutFloatOrFootnote(
      nodeContext: ViewTree.NodeContext
    ): Task.Result<ViewTree.NodeContext>;
    /**
     * Layout next portion of the source.
     */
    layoutNext(
      nodeContext: ViewTree.NodeContext,
      leadingEdge: boolean,
      forcedBreakValue?: string | null
    ): Task.Result<ViewTree.NodeContext>;
    clearOverflownViewNodes(
      nodeContext: ViewTree.NodeContext,
      removeSelf: boolean
    ): void;
    initGeom(): void;
    init(): void;
    /**
     * Save the potential breaking position at the edge. Should, in general, save
     * "after" position but only after skipping all of the "before" ones and
     * getting to the non-empty content (to get breakAtEdge right).
     */
    saveEdgeBreakPosition(
      position: ViewTree.NodeContext,
      breakAtEdge: string | null,
      overflows: boolean
    ): void;
    /**
     * @param checkPoints array of breaking points for breakable block
     */
    saveBoxBreakPosition(checkPoints: ViewTree.NodeContext[]): void;
    updateMaxReachedAfterEdge(afterEdge: number): void;
    /**
     * @param chunkPosition starting position.
     * @return holding end position.
     */
    layout(
      chunkPosition: ViewTree.ChunkPosition,
      leadingEdge: boolean,
      breakAfter?: string | null
    ): Task.Result<ViewTree.ChunkPosition>;
    isFullWithPageFloats(): boolean;
    getMaxBlockSizeOfPageFloats(): number;
    doFinishBreakOfFragmentLayoutConstraints(nodeContext): void;
    /**
     * @param nodeContext starting position.
     * @return holding end position.
     */
    doLayout(
      nodeContext: ViewTree.NodeContext,
      leadingEdge: boolean,
      breakAfter?: string | null
    ): Task.Result<{
      nodeContext: ViewTree.NodeContext;
      overflownNodeContext: ViewTree.NodeContext;
    }>;
    /**
     * Re-layout already laid-out chunks. Return the position of the last flow if
     * there is an overflow.
     * TODO: deal with chunks that did not fit at all.
     * @return holding end position.
     */
    redoLayout(): Task.Result<ViewTree.ChunkPosition>;
    saveDistanceToBlockEndFloats(): void;
    collectElementsOffset(): RepetitiveElement.ElementsOffset[];
  }

  export type SinglePageFloatLayoutResult = {
    floatArea: PageFloatArea | null;
    pageFloatFragment: PageFloats.PageFloatFragment | null;
    newPosition: ViewTree.ChunkPosition | null;
  };

  /**
   * breaking point resolver for Text Node.
   */
  export interface TextNodeBreaker {
    breakTextNode(
      textNode: Text,
      nodeContext: ViewTree.NodeContext,
      low: number,
      checkPoints: ViewTree.NodeContext[],
      checkpointIndex: number,
      force: boolean
    ): ViewTree.NodeContext;
    breakAfterSoftHyphen(
      textNode: Text,
      text: string,
      viewIndex: number,
      nodeContext: ViewTree.NodeContext
    ): number;
    breakAfterOtherCharacter(
      textNode: Text,
      text: string,
      viewIndex: number,
      nodeContext: ViewTree.NodeContext
    ): number;
    updateNodeContext(
      nodeContext: ViewTree.NodeContext,
      viewIndex: number,
      textNode: Text
    ): ViewTree.NodeContext;
  }

  export interface LayoutMode {
    doLayout(
      nodeContext: ViewTree.NodeContext,
      column: Layout.Column
    ): Task.Result<ViewTree.NodeContext>;
    accept(nodeContext: ViewTree.NodeContext, column: Layout.Column): boolean;
    postLayout(
      positionAfter: ViewTree.NodeContext,
      initialPosition: ViewTree.NodeContext,
      column: Layout.Column,
      accepted: boolean
    ): boolean;
  }

  export interface PageFloatArea extends Column {
    adjustContentRelativeSize: boolean;
    readonly floatSide: string;
    readonly parentContainer: ViewTree.Container;

    convertPercentageSizesToPx(target: Element): void;
    fixFloatSizeAndPosition(nodeContext: ViewTree.NodeContext): void;
    getContentInlineSize(): number;
  }
}

export namespace LayoutProcessor {
  export interface BlockFormattingContext extends ViewTree.FormattingContext {}

  export function isInstanceOfBlockFormattingContext(
    object: ViewTree.FormattingContext
  ): object is BlockFormattingContext {
    return object && object.formattingContextType === "Block";
  }
}

export namespace Net {
  export type Response = {
    status: number;
    statusText: string | null;
    url: string;
    contentType: string | null;
    responseText: string | null;
    responseXML: Document;
    responseBlob: Blob;
  };

  export interface ResourceStore<Resource> {
    resources: { [key: string]: Resource };
    fetchers: { [key: string]: TaskUtil.Fetcher<Resource> };
    readonly parser: (
      p1: Response,
      p2: ResourceStore<Resource>
    ) => Task.Result<Resource>;
    readonly type: XMLHttpRequestResponseType;

    /**
     * @return resource for the given URL
     */
    load(
      url: string,
      opt_required?: boolean,
      opt_message?: string
    ): Task.Result<Resource>;
    /**
     * @return fetcher for the resource for the given URL
     */
    fetch(
      url: string,
      opt_required?: boolean,
      opt_message?: string
    ): TaskUtil.Fetcher<Resource>;
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
    PAGE = "page"
  }

  export type PageFloatID = string;

  export interface PageFloat {
    order: number | null;
    id: PageFloatID | null;
    readonly nodePosition: ViewTree.NodePosition;
    readonly floatReference: FloatReference;
    readonly floatSide: string;
    readonly clearSide: string | null;
    readonly flowName: string;
    readonly floatMinWrapBlock: Css.Numeric | null;

    getOrder(): number;
    getId(): PageFloatID;
    isAllowedOnContext(pageFloatLayoutContext: PageFloatLayoutContext): boolean;
    isAllowedToPrecede(other: PageFloat): boolean;
  }

  export interface PageFloatFragment {
    readonly floatReference: FloatReference;
    readonly floatSide: string;
    readonly continuations: PageFloatContinuation[];
    readonly area: ViewTree.Container;
    readonly continues: boolean;

    hasFloat(float: PageFloat): boolean;
    findNotAllowedFloat(context: PageFloatLayoutContext): PageFloat | null;
    getOuterShape(): Geom.Shape;
    getOuterRect(): Geom.Rect;
    getOrder(): number;
    shouldBeStashedBefore(float: PageFloat): boolean;
    addContinuations(continuations: PageFloatContinuation[]): void;
    getFlowName(): string;
  }

  export interface PageFloatContinuation {
    readonly float: PageFloat;
    readonly nodePosition: ViewTree.NodePosition;

    equals(other: PageFloatContinuation | null): boolean;
  }

  export type PageFloatPlacementCondition = {
    [key: string]: boolean;
  };

  export interface PageFloatLayoutContext {
    writingMode: Css.Val;
    direction: Css.Val;
    floatFragments: PageFloatFragment[];
    readonly parent: PageFloatLayoutContext;
    readonly flowName: string | null;
    readonly generatingNodePosition: ViewTree.NodePosition | null;

    getContainer(floatReference?: FloatReference): ViewTree.Container;
    setContainer(container: ViewTree.Container);
    addPageFloat(float: PageFloat): void;
    getPageFloatLayoutContext(
      floatReference: FloatReference
    ): PageFloatLayoutContext;
    findPageFloatByNodePosition(
      nodePosition: ViewTree.NodePosition
    ): PageFloat | null;
    isForbidden(float: PageFloat): boolean;
    addPageFloatFragment(
      floatFragment: PageFloatFragment,
      dontInvalidate?: boolean
    ): void;
    removePageFloatFragment(
      floatFragment: PageFloatFragment,
      dontInvalidate?: boolean
    ): void;
    findPageFloatFragment(float: PageFloat): PageFloatFragment | null;
    hasFloatFragments(condition?: (p1: PageFloatFragment) => boolean): boolean;
    hasContinuingFloatFragmentsInFlow(flowName: string): boolean;
    registerPageFloatAnchor(float: PageFloat, anchorViewNode: Node): void;
    collectPageFloatAnchors(): any;
    isAnchorAlreadyAppeared(floatId: PageFloatID): boolean;
    deferPageFloat(continuation: PageFloatContinuation): void;
    hasPrecedingFloatsDeferredToNext(
      float: PageFloat,
      ignoreReference?: boolean
    ): boolean;
    getLastFollowingFloatInFragments(float: PageFloat): PageFloat | null;
    getDeferredPageFloatContinuations(
      flowName?: string | null
    ): PageFloatContinuation[];
    getPageFloatContinuationsDeferredToNext(
      flowName?: string | null
    ): PageFloatContinuation[];
    getFloatsDeferredToNextInChildContexts(): PageFloat[];
    checkAndForbidNotAllowedFloat(): boolean;
    checkAndForbidFloatFollowingDeferredFloat(): boolean;
    finish(): void;
    hasSameContainerAs(other: PageFloatLayoutContext): boolean;
    invalidate(): void;
    detachChildren(): PageFloatLayoutContext[];
    attachChildren(children: PageFloatLayoutContext[]): void;
    isInvalidated(): boolean;
    validate(): void;
    removeEndFloatFragments(floatSide: string): void;
    stashEndFloatFragments(float: PageFloat): void;
    restoreStashedFragments(floatReference: FloatReference): void;
    discardStashedFragments(floatReference: FloatReference): void;
    getStashedFloatFragments(
      floatReference: FloatReference
    ): PageFloatFragment[];
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
      condition: PageFloatPlacementCondition
    ): string | null;
    getFloatFragmentExclusions(): Geom.Shape[];
    getMaxReachedAfterEdge(): number;
    getBlockStartEdgeOfBlockEndFloats(): number;
    getPageFloatClearEdge(clear: string, column: Layout.Column): number;
    getPageFloatPlacementCondition(
      float: PageFloat,
      floatSide: string,
      clearSide: string | null
    ): PageFloatPlacementCondition;
    getLayoutConstraints(): Layout.LayoutConstraint[];
    addLayoutConstraint(
      layoutConstraint: Layout.LayoutConstraint,
      floatReference: FloatReference
    ): void;
    getMaxBlockSizeOfPageFloats(): number;
    lock(): void;
    unlock(): void;
    isLocked(): boolean;
  }

  export interface PageFloatLayoutStrategy {
    appliesToNodeContext(nodeContext: ViewTree.NodeContext): boolean;
    appliesToFloat(float: PageFloat): boolean;
    createPageFloat(
      nodeContext: ViewTree.NodeContext,
      pageFloatLayoutContext: PageFloatLayoutContext,
      column: Layout.Column
    ): Task.Result<PageFloat>;
    createPageFloatFragment(
      continuations: PageFloatContinuation[],
      logicalFloatSide: string,
      floatArea: Layout.PageFloatArea,
      continues: boolean
    ): PageFloatFragment;
    findPageFloatFragment(
      float: PageFloat,
      pageFloatLayoutContext: PageFloatLayoutContext
    ): PageFloatFragment | null;
    adjustPageFloatArea(
      floatArea: Layout.PageFloatArea,
      floatContainer: ViewTree.Container,
      column: Layout.Column
    );
    forbid(float: PageFloat, pageFloatLayoutContext: PageFloatLayoutContext);
  }
}

export namespace Selectors {
  export interface AfterIfContinues {
    readonly sourceNode: Element;
    readonly styler: PseudoElement.PseudoelementStyler;

    createElement(
      column: Layout.Column,
      parentNodeContext: ViewTree.NodeContext
    ): Task.Result<Element>;
  }

  export interface AfterIfContinuesLayoutConstraint
    extends Layout.FragmentLayoutConstraint {
    nodeContext: Vtree.NodeContext;
    afterIfContinues: AfterIfContinues;
    pseudoElementHeight: number;

    getRepetitiveElements(): AfterIfContinuesElementsOffset;
  }

  export function isInstanceOfAfterIfContinuesLayoutConstraint(
    object: Layout.FragmentLayoutConstraint
  ): object is AfterIfContinuesLayoutConstraint {
    return object && object.flagmentLayoutConstraintType == "AfterIfContinue";
  }

  export interface AfterIfContinuesElementsOffset
    extends RepetitiveElement.ElementsOffset {
    nodeContext: Vtree.NodeContext;
    pseudoElementHeight: number;

    affectTo(nodeContext: ViewTree.NodeContext): boolean;
  }
}

export namespace PseudoElement {
  export interface PseudoelementStyler extends CssStyler.AbstractStyler {
    contentProcessed: { [key: string]: boolean };
    readonly element: Element;
    style: CssCasc.ElementStyle;
    styler: CssStyler.AbstractStyler;
    readonly context: Exprs.Context;
    readonly exprContentListener: ViewTree.ExprContentListener;
  }
}

export namespace RepetitiveElement {
  export interface RepetitiveElementsOwnerFormattingContext
    extends ViewTree.FormattingContext {
    isRoot: boolean;
    repetitiveElements: RepetitiveElements;
    readonly parent: ViewTree.FormattingContext;
    readonly rootSourceNode: Element;
    getRepetitiveElements(): RepetitiveElements;
    getRootViewNode(position: ViewTree.NodeContext): Element | null;
    getRootNodeContext(
      nodeContext: ViewTree.NodeContext
    ): ViewTree.NodeContext | null;
    initializeRepetitiveElements(vertical: boolean): void;
  }

  export function isInstanceOfRepetitiveElementsOwnerFormattingContext(
    object: ViewTree.FormattingContext
  ): object is RepetitiveElementsOwnerFormattingContext {
    if (!object) {
      return false;
    }
    const type = object.formattingContextType;
    return (
      type === "RepetitiveElementsOwner" ||
      Table.isInstanceOfTableFormattingContext(object)
    ); // subset
  }

  export interface ElementsOffset {
    calculateOffset(nodeContext: ViewTree.NodeContext): number;
    calculateMinimumOffset(nodeContext: ViewTree.NodeContext): number;
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

    setHeaderNodeContext(nodeContext: ViewTree.NodeContext): void;
    setFooterNodeContext(nodeContext: ViewTree.NodeContext): void;
    updateHeight(column: Layout.Column): void;
    prepareLayoutFragment(): void;
    appendHeaderToFragment(
      rootNodeContext: ViewTree.NodeContext,
      firstChild: Node | null,
      column: Layout.Column
    ): Task.Result<boolean>;
    appendFooterToFragment(
      rootNodeContext: ViewTree.NodeContext,
      firstChild: Node | null,
      column: Layout.Column
    ): Task.Result<boolean>;
    appendElementToFragment(
      nodePosition: ViewTree.NodePosition,
      rootNodeContext: ViewTree.NodeContext,
      firstChild: Node | null,
      column: Layout.Column
    ): Task.Result<boolean>;
    moveChildren(from: Element, to: Element, firstChild: Node | null): void;
    isAfterLastContent(nodeContext: ViewTree.NodeContext): boolean;
    isFirstContentNode(nodeContext: ViewTree.NodeContext): boolean;
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
    getRepetitiveElements(): RepetitiveElements;
  }

  export function isInstanceOfRepetitiveElementsOwnerLayoutConstraint(
    object: Layout.FragmentLayoutConstraint
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
    object: ViewTree.FormattingContext
  ): object is TableFormattingContext {
    return object && object.formattingContextType === "Table";
  }

  export interface TableRowLayoutConstraint
    extends RepetitiveElement.RepetitiveElementsOwnerLayoutConstraint {
    cellFragmentLayoutConstraints: {
      constraints: Layout.FragmentLayoutConstraint[];
      breakPosition: ViewTree.NodeContext;
    }[];

    removeDummyRowNodes(nodeContext: ViewTree.NodeContext): void;
    getElementsOffsetsForTableCell(
      column: Layout.Column
    ): RepetitiveElement.ElementsOffset[];
  }

  export function isInstanceOfTableRowLayoutConstraint(
    object: Layout.FragmentLayoutConstraint
  ): object is TableRowLayoutConstraint {
    return object && object.flagmentLayoutConstraintType === "TableRow";
  }
}

export namespace ViewTree {
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
    getRangeClientRects(range: Range): ClientRect[];
    getElementClientRect(element: Element): ClientRect;
    /**
     * @return element's computed style
     */
    getElementComputedStyle(element: Element): CSSStyleDeclaration;
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
     * @return true if children should be processed as well
     */
    setCurrent(
      nodeContext: NodeContext,
      firstTime: boolean,
      atUnforcedBreak?: boolean
    ): Task.Result<boolean>;
    /**
     * Set the container element that holds view elements produced from the
     * source.
     */
    setViewRoot(container: Element, isFootnote: boolean);
    /**
     * Moves to the next view node, creating it and appending it to the view tree
     * if needed.
     * @return that corresponds to the next view node
     */
    nextInTree(
      nodeContext: NodeContext,
      atUnforcedBreak?: boolean
    ): Task.Result<NodeContext>;
    /**
     * Apply pseudo-element styles (if any).
     * @param element element to apply styles to
     */
    applyPseudoelementStyle(
      nodeContext: NodeContext,
      pseudoName: string,
      element: Element
    ): void;
    /**
     * Apply styles to footnote container.
     * @param element element to apply styles to
     * @return vertical
     */
    applyFootnoteStyle(
      vertical: boolean,
      rtl: boolean,
      element: Element
    ): boolean;
    /**
     * Peel off innermost first-XXX pseudoelement, create and create view nodes
     * after the end of that pseudoelement.
     */
    peelOff(
      nodeContext: NodeContext,
      nodeOffset: number
    ): Task.Result<NodeContext>;
    /**
     * Process a block-end edge of a fragmented block.
     */
    processFragmentedBlockEdge(nodeContext: NodeContext);
    convertLengthToPx(
      numeric: Css.Numeric,
      viewNode: Node,
      clientLayout: ClientLayout
    ): number | Css.Numeric;
    /**
     * Returns if two NodePositions represents the same position in the document.
     */
    isSameNodePosition(
      nodePosition1: NodePosition,
      nodePosition2: NodePosition
    ): boolean;
    addEventListener(
      type: string,
      listener: Base.EventListener,
      capture?: boolean
    ): void;
    removeEventListener(
      type: string,
      listener: Base.EventListener,
      capture?: boolean
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
    getParent(): FormattingContext;
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

  export type NodePosition = {
    steps: NodePositionStep[];
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
    PRESERVE
  }

  export interface Container {
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
    exclusions: Geom.Shape[];
    innerShape: Geom.Shape;
    computedBlockSize: number;
    snapWidth: number;
    snapHeight: number;
    snapOffsetX: number;
    snapOffsetY: number;
    vertical: boolean; // vertical writing
    element: Element;

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
    getInnerShape(): Geom.Shape;
    getInnerRect(): Geom.Rect;
    getPaddingRect(): Geom.Rect;
    getOuterShape(outerShapeProp: Css.Val, context: Exprs.Context): Geom.Shape;
    getOuterRect(): Geom.Rect;
  }

  /**
   * @enum {number}
   */
  export enum ShadowType {
    NONE,
    CONTENT,
    ROOTLESS,
    ROOTED
  }

  /**
   * Data about shadow tree instance.
   */
  export interface ShadowContext {
    readonly owner: Element;
    readonly root: Element;
    readonly xmldoc: XmlDoc.XMLDocHolder;
    readonly parentShadow: ShadowContext;
    subShadow: ShadowContext;
    readonly type: ViewTree.ShadowType;
    readonly styler: object;

    equals(other: ShadowContext): boolean;
  }

  /**
   * Information about :first-letter or :first-line pseudoelements
   * @param count 0 - first-letter, 1 or more - first line(s)
   */
  export interface FirstPseudo {
    readonly outer: FirstPseudo;
    readonly count: number;
  }

  /**
   * NodeContext represents a position in the document + layout-related
   * information attached to it. When after=false and offsetInNode=0, the
   * position is inside the element (node), but just before its first child.
   * When offsetInNode>0 it represents offset in the textual content of the
   * node. When after=true it represents position right after the last child
   * of the node. boxOffset is incremented by 1 for any valid node position.
   */
  export interface NodeContext {
    // position itself
    offsetInNode: number;
    after: boolean;
    shadowType: ShadowType; // parent's shadow type
    shadowContext: ViewTree.ShadowContext;
    nodeShadow: ViewTree.ShadowContext;
    shadowSibling: NodeContext; // next "sibling" in the shadow tree
    // other stuff
    shared: boolean;
    inline: boolean;
    overflow: boolean;
    breakPenalty: number;
    display: string | null;
    floatReference: PageFloats.FloatReference;
    floatSide: string | null;
    clearSide: string | null;
    floatMinWrapBlock: Css.Numeric | null;
    columnSpan: Css.Val | null;
    verticalAlign: string;
    captionSide: string;
    inlineBorderSpacing: number;
    blockBorderSpacing: number;
    flexContainer: boolean;
    whitespace: Whitespace;
    hyphenateCharacter: string | null;
    breakWord: boolean;
    establishesBFC: boolean;
    containingBlockForAbsolute: boolean;
    breakBefore: string | null;
    breakAfter: string | null;
    viewNode: Node;
    clearSpacer: Node;
    inheritedProps: { [key: string]: number | string | Css.Val };
    vertical: boolean;
    direction: string;
    firstPseudo: FirstPseudo;
    lang: string | null;
    preprocessedTextContent: Diff.Change[] | null;
    formattingContext: FormattingContext;
    repeatOnBreak: string | null;
    pluginProps: {
      [key: string]: string | number | undefined | null | (number | null)[];
    };
    fragmentIndex: number;
    afterIfContinues: Selectors.AfterIfContinues;
    footnotePolicy: Css.Ident | null;

    sourceNode: Node;
    parent: NodeContext;
    boxOffset: number;

    resetView(): void;
    modify(): NodeContext;
    copy(): NodeContext;
    clone(): NodeContext;
    toNodePositionStep(): NodePositionStep;
    toNodePosition(): NodePosition;
    isInsideBFC(): boolean;
    getContainingBlockForAbsolute(): NodeContext;
    /**
     * Walk up NodeContext tree (starting from itself) and call the callback for
     * each block.
     */
    walkUpBlocks(callback: (p1: NodeContext) => any): void;
    belongsTo(formattingContext: FormattingContext): boolean;
  }

  export interface ChunkPosition {
    floats: NodePosition[];
    primary: NodePosition;

    clone(): ChunkPosition;
    isSamePosition(other: ChunkPosition): boolean;
  }

  export type ExprContentListener = (
    p1: Exprs.Val,
    p2: string,
    p3: Document
  ) => Node | null;
}

export namespace XmlDoc {
  export interface XMLDocHolder {
    lang: string | null;
    totalOffset: number;
    root: Element;
    body: Element;
    head: Element;
    last: Element;
    lastOffset: number;
    idMap: { [key: string]: Element };
    readonly store: XMLDocStore;
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
    forEachNonNull<T>(fn: (p1: Node) => T): T[];
    child(tag: string): NodeList;
    childElements(): NodeList;
    attribute(name: string): (string | null)[];
    textContent(): (string | null)[];
  }

  export type XMLDocStore = Net.ResourceStore<XMLDocHolder>;
}
