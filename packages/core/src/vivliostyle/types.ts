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
  | "Block"
  | "RepetitiveElementsOwner"
  | "Table";

export type FragmentLayoutConstraintType =
  | "AfterIfContinue"
  | "EntireTable"
  | "RepetitiveElementsOwner"
  | "TableRow";

export namespace CssCascade {
  export type ElementStyle = { [key: string]: any };
}

export namespace CssStyler {
  export interface AbstractStyler {
    getStyle(element: Element, deep: boolean): CssCascade.ElementStyle;
    processContent(
      element: Element,
      styles: { [key: string]: Css.Val },
      viewNode: Node,
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
      nodeContext: Vtree.NodeContext,
      overflownNodeContext: Vtree.NodeContext,
      column: Column,
    ): boolean;
    nextCandidate(nodeContext: Vtree.NodeContext): boolean;
    postLayout(
      allowed: boolean,
      positionAfter: Vtree.NodeContext,
      initialPosition: Vtree.NodeContext,
      column: Column,
    );
    finishBreak(
      nodeContext: Vtree.NodeContext,
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
    findAcceptableBreak(column: Column, penalty: number): Vtree.NodeContext;
    /**
     * @return penalty for this break position
     */
    getMinBreakPenalty(): number;
    calculateOffset(column: Column): { current: number; minimum: number };
    breakPositionChosen(column: Column): void;
  }

  export interface AbstractBreakPosition extends BreakPosition {
    getNodeContext(): Vtree.NodeContext;
  }

  export type BreakPositionAndNodeContext = {
    breakPosition: BreakPosition;
    nodeContext: Vtree.NodeContext;
  };

  /**
   * Potential breaking position inside CSS box (between lines).
   * @param checkPoints array of breaking points for
   *    breakable block
   */
  export interface BoxBreakPosition extends AbstractBreakPosition {
    breakNodeContext: Vtree.NodeContext;
    readonly checkPoints: Vtree.NodeContext[];
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
    last: Node;
    viewDocument: Document;
    flowRootFormattingContext: Vtree.FormattingContext;
    isFloat: boolean;
    isFootnote: boolean;
    startEdge: number;
    endEdge: number;
    beforeEdge: number;
    afterEdge: number;
    footnoteEdge: number;
    box: GeometryUtil.Rect;
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
    pseudoParent: Column;
    nodeContextOverflowingDueToRepetitiveElements: Vtree.NodeContext | null;
    blockDistanceToBlockEndFloats: number;
    computedBlockSize: number;

    layoutContext: Vtree.LayoutContext;
    clientLayout: Vtree.ClientLayout;
    readonly layoutConstraint: LayoutConstraint;
    readonly pageFloatLayoutContext: PageFloats.PageFloatLayoutContext;

    getTopEdge(): number;
    getBottomEdge(): number;
    getLeftEdge(): number;
    getRightEdge(): number;
    isFloatNodeContext(nodeContext: Vtree.NodeContext): boolean;
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
      position: Vtree.NodeContext,
      checkPoints: Vtree.NodeContext[],
    ): Task.Result<Vtree.NodeContext>;
    nextInTree(
      position: Vtree.NodeContext,
      atUnforcedBreak?: boolean,
    ): Task.Result<Vtree.NodeContext>;
    /**
     * Builds the view for a single unbreakable element.
     * @param position start source position.
     * @return holding box edge position reached or null if the source is exhausted.
     */
    buildDeepElementView(
      position: Vtree.NodeContext,
    ): Task.Result<Vtree.NodeContext>;

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
      nodeContext: Vtree.NodeContext,
      checkPoints: Vtree.NodeContext[],
      index: number,
      boxOffset: number,
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
    ): Task.Result<Vtree.NodeContext>;
    /**
     * Layout a single float element.
     */
    layoutFloat(nodeContext: Vtree.NodeContext): Task.Result<Vtree.NodeContext>;

    setupFloatArea(
      area: PageFloatArea,
      floatReference: PageFloats.FloatReference,
      floatSide: string,
      anchorEdge: number | null,
      strategy: PageFloats.PageFloatLayoutStrategy,
      condition: PageFloats.PageFloatPlacementCondition,
    ): boolean;
    createPageFloatArea(
      float: PageFloats.PageFloat | null,
      floatSide: string,
      anchorEdge: number | null,
      strategy: PageFloats.PageFloatLayoutStrategy,
      condition: PageFloats.PageFloatPlacementCondition,
    ): PageFloatArea | null;
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
      pageFloatFragment?: PageFloats.PageFloatFragment,
    ): Task.Result<boolean>;
    setFloatAnchorViewNode(nodeContext: Vtree.NodeContext): Vtree.NodeContext;
    resolveFloatReferenceFromColumnSpan(
      floatReference: PageFloats.FloatReference,
      columnSpan: Css.Val,
      nodeContext: Vtree.NodeContext,
    ): Task.Result<PageFloats.FloatReference>;
    layoutPageFloat(
      nodeContext: Vtree.NodeContext,
    ): Task.Result<Vtree.NodeContext>;
    createJustificationAdjustmentElement(
      insertionPoint: Node,
      doc: Document,
      parentNode: Node,
      vertical: boolean,
    ): HTMLElement;
    addAndAdjustJustificationElement(
      nodeContext: Vtree.NodeContext,
      insertAfter: boolean,
      node: Node,
      insertionPoint: Node,
      doc: Document,
      parentNode: Node,
    ): HTMLElement;
    compensateJustificationLineHeight(
      span: Element,
      br: Element,
      nodeContext: Vtree.NodeContext,
    ): void;
    /**
     * Fix justification of the last line of text broken across pages (if
     * needed).
     */
    fixJustificationIfNeeded(
      nodeContext: Vtree.NodeContext,
      endOfColumn: boolean,
    ): void;
    processLineStyling(
      nodeContext: Vtree.NodeContext,
      resNodeContext: Vtree.NodeContext,
      checkPoints: Vtree.NodeContext[],
    ): Task.Result<Vtree.NodeContext>;
    isLoneImage(checkPoints: Vtree.NodeContext[]): boolean;
    getTrailingMarginEdgeAdjustment(
      trailingEdgeContexts: Vtree.NodeContext[],
    ): number;
    /**
     * Layout a single CSS box.
     */
    layoutBreakableBlock(
      nodeContext: Vtree.NodeContext,
    ): Task.Result<Vtree.NodeContext>;
    postLayoutBlock(
      nodeContext: Vtree.NodeContext,
      checkPoints: Vtree.NodeContext[],
    ): void;
    findEndOfLine(
      linePosition: number,
      checkPoints: Vtree.NodeContext[],
      isUpdateMaxReachedAfterEdge: boolean,
    ): {
      nodeContext: Vtree.NodeContext;
      index: number;
      checkPointIndex: number;
    };
    findAcceptableBreakInside(
      checkPoints: Vtree.NodeContext[],
      edgePosition: number,
      force: boolean,
    ): Vtree.NodeContext;
    resolveTextNodeBreaker(nodeContext: Vtree.NodeContext): TextNodeBreaker;
    /**
     * Read ranges skipping special elments
     */
    getRangeBoxes(start: Node, end: Node): Vtree.ClientRect[];
    /**
     * Give block's initial and final nodes, find positions of the line bottoms.
     * This is, of course, somewhat hacky implementation.
     * @return position of line breaks
     */
    findLinePositions(checkPoints: Vtree.NodeContext[]): number[];
    calculateClonedPaddingBorder(nodeContext: Vtree.NodeContext): number;
    findBoxBreakPosition(
      bp: BoxBreakPosition,
      force: boolean,
    ): Vtree.NodeContext;
    getAfterEdgeOfBlockContainer(nodeContext: Vtree.NodeContext): number;
    findFirstOverflowingEdgeAndCheckPoint(checkPoints: Vtree.NodeContext[]): {
      edge: number;
      checkPoint: Vtree.NodeContext | null;
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
    findAcceptableBreakPosition(): BreakPositionAndNodeContext;
    doFinishBreak(
      nodeContext: Vtree.NodeContext,
      overflownNodeContext: Vtree.NodeContext,
      initialNodeContext: Vtree.NodeContext,
      initialComputedBlockSize: number,
    ): Task.Result<Vtree.NodeContext>;
    /**
     * Determines if a page break is acceptable at this position
     */
    isBreakable(flowPosition: Vtree.NodeContext): boolean;
    /**
     * Determines if an indent value is zero
     */
    zeroIndent(val: string | number): boolean;
    /**
     * @return true if overflows
     */
    checkOverflowAndSaveEdge(
      nodeContext: Vtree.NodeContext,
      trailingEdgeContexts: Vtree.NodeContext[],
    ): boolean;
    /**
     * Save a possible page break position on a CSS block edge. Check if it
     * overflows.
     * @return true if overflows
     */
    checkOverflowAndSaveEdgeAndBreakPosition(
      nodeContext: Vtree.NodeContext,
      trailingEdgeContexts: Vtree.NodeContext[],
      saveEvenOverflown: boolean,
      breakAtTheEdge: string | null,
    ): boolean;
    applyClearance(nodeContext: Vtree.NodeContext): boolean;
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
    ): Task.Result<Vtree.NodeContext>;
    /**
     * Skips non-renderable positions until it hits the end of the flow or some
     * renderable content. Returns the nodeContext that was passed in if some
     * content remains and null if all content could be skipped.
     */
    skipTailEdges(
      nodeContext: Vtree.NodeContext,
    ): Task.Result<Vtree.NodeContext>;
    layoutFloatOrFootnote(
      nodeContext: Vtree.NodeContext,
    ): Task.Result<Vtree.NodeContext>;
    /**
     * Layout next portion of the source.
     */
    layoutNext(
      nodeContext: Vtree.NodeContext,
      leadingEdge: boolean,
      forcedBreakValue?: string | null,
    ): Task.Result<Vtree.NodeContext>;
    clearOverflownViewNodes(
      nodeContext: Vtree.NodeContext,
      removeSelf: boolean,
    ): void;
    initGeom(): void;
    init(): void;
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
    saveBoxBreakPosition(checkPoints: Vtree.NodeContext[]): void;
    updateMaxReachedAfterEdge(afterEdge: number): void;
    /**
     * @param chunkPosition starting position.
     * @return holding end position.
     */
    layout(
      chunkPosition: Vtree.ChunkPosition,
      leadingEdge: boolean,
      breakAfter?: string | null,
    ): Task.Result<Vtree.ChunkPosition>;
    isFullWithPageFloats(): boolean;
    getMaxBlockSizeOfPageFloats(): number;
    doFinishBreakOfFragmentLayoutConstraints(nodeContext): void;
    /**
     * @param nodeContext starting position.
     * @return holding end position.
     */
    doLayout(
      nodeContext: Vtree.NodeContext,
      leadingEdge: boolean,
      breakAfter?: string | null,
    ): Task.Result<{
      nodeContext: Vtree.NodeContext;
      overflownNodeContext: Vtree.NodeContext;
    }>;
    /**
     * Re-layout already laid-out chunks. Return the position of the last flow if
     * there is an overflow.
     * TODO: deal with chunks that did not fit at all.
     * @return holding end position.
     */
    redoLayout(): Task.Result<Vtree.ChunkPosition>;
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
      checkPoints: Vtree.NodeContext[],
      checkpointIndex: number,
      force: boolean,
    ): Vtree.NodeContext;
    breakAfterSoftHyphen(
      textNode: Text,
      text: string,
      viewIndex: number,
      nodeContext: Vtree.NodeContext,
    ): number;
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
    ): Task.Result<Vtree.NodeContext>;
    accept(nodeContext: Vtree.NodeContext, column: Layout.Column): boolean;
    postLayout(
      positionAfter: Vtree.NodeContext,
      initialPosition: Vtree.NodeContext,
      column: Layout.Column,
      accepted: boolean,
    ): boolean;
  }

  export interface PageFloatArea extends Column {
    adjustContentRelativeSize: boolean;
    readonly floatSide: string;
    readonly parentContainer: Vtree.Container;

    convertPercentageSizesToPx(target: Element): void;
    fixFloatSizeAndPosition(nodeContext: Vtree.NodeContext): void;
    getContentInlineSize(): number;
  }
}

export namespace LayoutProcessor {
  export interface BlockFormattingContext extends Vtree.FormattingContext {}

  export function isInstanceOfBlockFormattingContext(
    object: Vtree.FormattingContext,
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
      p2: ResourceStore<Resource>,
    ) => Task.Result<Resource>;
    readonly type: XMLHttpRequestResponseType;

    /**
     * @return resource for the given URL
     */
    load(
      url: string,
      opt_required?: boolean,
      opt_message?: string,
    ): Task.Result<Resource>;
    /**
     * @return fetcher for the resource for the given URL
     */
    fetch(
      url: string,
      opt_required?: boolean,
      opt_message?: string,
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
    PAGE = "page",
  }

  export type PageFloatID = string;

  export interface PageFloat {
    order: number | null;
    id: PageFloatID | null;
    readonly nodePosition: Vtree.NodePosition;
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
    readonly area: Vtree.Container;
    readonly continues: boolean;

    hasFloat(float: PageFloat): boolean;
    findNotAllowedFloat(context: PageFloatLayoutContext): PageFloat | null;
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
    writingMode: Css.Val;
    direction: Css.Val;
    floatFragments: PageFloatFragment[];
    readonly parent: PageFloatLayoutContext;
    readonly flowName: string | null;
    readonly generatingNodePosition: Vtree.NodePosition | null;

    getContainer(floatReference?: FloatReference): Vtree.Container;
    setContainer(container: Vtree.Container);
    addPageFloat(float: PageFloat): void;
    getPageFloatLayoutContext(
      floatReference: FloatReference,
    ): PageFloatLayoutContext;
    findPageFloatByNodePosition(
      nodePosition: Vtree.NodePosition,
    ): PageFloat | null;
    isForbidden(float: PageFloat): boolean;
    addPageFloatFragment(
      floatFragment: PageFloatFragment,
      dontInvalidate?: boolean,
    ): void;
    removePageFloatFragment(
      floatFragment: PageFloatFragment,
      dontInvalidate?: boolean,
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
      ignoreReference?: boolean,
    ): boolean;
    getLastFollowingFloatInFragments(float: PageFloat): PageFloat | null;
    getDeferredPageFloatContinuations(
      flowName?: string | null,
    ): PageFloatContinuation[];
    getPageFloatContinuationsDeferredToNext(
      flowName?: string | null,
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
      floatReference: FloatReference,
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
      condition: PageFloatPlacementCondition,
    ): string | null;
    getFloatFragmentExclusions(): GeometryUtil.Shape[];
    getMaxReachedAfterEdge(): number;
    getBlockStartEdgeOfBlockEndFloats(): number;
    getPageFloatClearEdge(clear: string, column: Layout.Column): number;
    getPageFloatPlacementCondition(
      float: PageFloat,
      floatSide: string,
      clearSide: string | null,
    ): PageFloatPlacementCondition;
    getLayoutConstraints(): Layout.LayoutConstraint[];
    addLayoutConstraint(
      layoutConstraint: Layout.LayoutConstraint,
      floatReference: FloatReference,
    ): void;
    getMaxBlockSizeOfPageFloats(): number;
    lock(): void;
    unlock(): void;
    isLocked(): boolean;
  }

  export interface PageFloatLayoutStrategy {
    appliesToNodeContext(nodeContext: Vtree.NodeContext): boolean;
    appliesToFloat(float: PageFloat): boolean;
    createPageFloat(
      nodeContext: Vtree.NodeContext,
      pageFloatLayoutContext: PageFloatLayoutContext,
      column: Layout.Column,
    ): Task.Result<PageFloat>;
    createPageFloatFragment(
      continuations: PageFloatContinuation[],
      floatSide: string,
      floatArea: Layout.PageFloatArea,
      continues: boolean,
    ): PageFloatFragment;
    findPageFloatFragment(
      float: PageFloat,
      pageFloatLayoutContext: PageFloatLayoutContext,
    ): PageFloatFragment | null;
    adjustPageFloatArea(
      floatArea: Layout.PageFloatArea,
      floatContainer: Vtree.Container,
      column: Layout.Column,
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
      parentNodeContext: Vtree.NodeContext,
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
    styler: CssStyler.AbstractStyler;
    readonly context: Exprs.Context;
    readonly exprContentListener: Vtree.ExprContentListener;
  }
}

export namespace RepetitiveElement {
  export interface RepetitiveElementsOwnerFormattingContext
    extends Vtree.FormattingContext {
    isRoot: boolean;
    repetitiveElements: RepetitiveElements;
    readonly parent: Vtree.FormattingContext;
    readonly rootSourceNode: Element;
    getRepetitiveElements(): RepetitiveElements;
    getRootViewNode(position: Vtree.NodeContext): Element | null;
    getRootNodeContext(
      nodeContext: Vtree.NodeContext,
    ): Vtree.NodeContext | null;
    initializeRepetitiveElements(vertical: boolean): void;
  }

  export function isInstanceOfRepetitiveElementsOwnerFormattingContext(
    object: Vtree.FormattingContext,
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
    calculateOffset(nodeContext: Vtree.NodeContext): number;
    calculateMinimumOffset(nodeContext: Vtree.NodeContext): number;
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
      rootNodeContext: Vtree.NodeContext,
      firstChild: Node | null,
      column: Layout.Column,
    ): Task.Result<boolean>;
    appendFooterToFragment(
      rootNodeContext: Vtree.NodeContext,
      firstChild: Node | null,
      column: Layout.Column,
    ): Task.Result<boolean>;
    appendElementToFragment(
      nodePosition: Vtree.NodePosition,
      rootNodeContext: Vtree.NodeContext,
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
    getRepetitiveElements(): RepetitiveElements;
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
    return object && object.formattingContextType === "Table";
  }

  export interface TableRowLayoutConstraint
    extends RepetitiveElement.RepetitiveElementsOwnerLayoutConstraint {
    cellFragmentLayoutConstraints: {
      constraints: Layout.FragmentLayoutConstraint[];
      breakPosition: Vtree.NodeContext;
    }[];

    removeDummyRowNodes(nodeContext: Vtree.NodeContext): void;
    getElementsOffsetsForTableCell(
      column: Layout.Column,
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
      atUnforcedBreak?: boolean,
    ): Task.Result<boolean>;
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
    ): Task.Result<NodeContext>;
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
    ): boolean;
    /**
     * Peel off innermost first-XXX pseudoelement, create and create view nodes
     * after the end of that pseudoelement.
     */
    peelOff(
      nodeContext: NodeContext,
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
    PRESERVE,
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
    exclusions: GeometryUtil.Shape[];
    innerShape: GeometryUtil.Shape;
    computedBlockSize: number;
    snapWidth: number;
    snapHeight: number;
    snapOffsetX: number;
    snapOffsetY: number;
    vertical: boolean; // vertical writing
    rtl: boolean;
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
    getInnerShape(): GeometryUtil.Shape;
    getInnerRect(): GeometryUtil.Rect;
    getPaddingRect(): GeometryUtil.Rect;
    getOuterShape(
      outerShapeProp: Css.Val,
      context: Exprs.Context,
    ): GeometryUtil.Shape;
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
    readonly xmldoc: XmlDoc.XMLDocHolder;
    readonly parentShadow: ShadowContext;
    subShadow: ShadowContext;
    readonly type: Vtree.ShadowType;
    readonly styler: CssStyler.AbstractStyler;

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
    shadowContext: Vtree.ShadowContext;
    nodeShadow: Vtree.ShadowContext;
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
    pageType: string | null;

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
    p3: Document,
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
