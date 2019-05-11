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
 * @fileoverview Type definiions.
 */
import * as base from '../adapt/base';
import * as css from '../adapt/css';
import * as expr from '../adapt/expr';
import * as geom from '../adapt/geom';
import * as task from '../adapt/task';
import * as taskutil from '../adapt/taskutil';
import * as diff from './diff';

export namespace csscasc {
  export interface ElementStyle {}
}

export namespace cssstyler {
  export interface AbstractStyler {
    getStyle(element: Element, deep: boolean): csscasc.ElementStyle;
    processContent(element: Element, styles: { [key: string]: css.Val });
  }
}

export namespace layout {
  /**
   * Represents a constraint on layout
   */
  export interface LayoutConstraint {
    /**
     * Returns if this constraint allows the node context to be laid out at the
     * current position.
     */
    allowLayout(nodeContext: vtree.NodeContext): boolean;
  }
  /**
   * Represents constraints on laying out fragments
   */
  export interface FragmentLayoutConstraint {
    allowLayout(
        nodeContext: vtree.NodeContext, overflownNodeContext: vtree.NodeContext,
        column: Column): boolean;
    nextCandidate(nodeContext: vtree.NodeContext): boolean;
    postLayout(
        allowed: boolean, positionAfter: vtree.NodeContext,
        initialPosition: vtree.NodeContext, column: Column);
    finishBreak(nodeContext: vtree.NodeContext, column: Column):
        task.Result<boolean>;
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
    findAcceptableBreak(column: Column, penalty: number): vtree.NodeContext;
    /**
     * @return penalty for this break position
     */
    getMinBreakPenalty(): number;
    calculateOffset(column: Column): { current: number; minimum: number };
    breakPositionChosen(column: Column): void;
  }

  export interface AbstractBreakPosition extends BreakPosition {
    findAcceptableBreak(column: Column, penalty: number): vtree.NodeContext;
    getMinBreakPenalty(): number;
    getNodeContext(): vtree.NodeContext;
  }


  export type BreakPositionAndNodeContext = {
    breakPosition: BreakPosition,
    nodeContext: vtree.NodeContext
  };

  /**
   * Potential breaking position inside CSS box (between lines).
   * @param checkPoints array of breaking points for
   *    breakable block
   */
  export interface BoxBreakPosition extends AbstractBreakPosition {
    breakNodeContext: vtree.NodeContext;
    readonly checkPoints: vtree.NodeContext[];
    readonly penalty: number;
  }

  /**
   * Potential edge breaking position.
   */
  export interface EdgeBreakPosition extends AbstractBreakPosition {
    overflowIfRepetitiveElementsDropped: boolean;
    readonly position: vtree.NodeContext;
    readonly breakOnEdge: string|null;
    overflows: boolean;
    readonly computedBlockSize: number;
  }

  export interface Column extends vtree.Container {
    last: Node;
    viewDocument: Document;
    flowRootFormattingContext: vtree.FormattingContext;
    isFloat: boolean;
    isFootnote: boolean;
    startEdge: number;
    endEdge: number;
    beforeEdge: number;
    afterEdge: number;
    footnoteEdge: number;
    box: geom.Rect;
    chunkPositions: vtree.ChunkPosition[];
    bands: geom.Band[];
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
    lastAfterPosition: vtree.NodePosition | null;
    fragmentLayoutConstraints: FragmentLayoutConstraint[];
    pseudoParent: Column;
    nodeContextOverflowingDueToRepetitiveElements: vtree.NodeContext | null;
    blockDistanceToBlockEndFloats: number;
    computedBlockSize: any;

    layoutContext: vtree.LayoutContext;
    clientLayout: vtree.ClientLayout;
    readonly layoutConstraint: LayoutConstraint;
    readonly pageFloatLayoutContext: pagefloat.PageFloatLayoutContext;

    getTopEdge(): number;
    getBottomEdge(): number;
    getLeftEdge(): number;
    getRightEdge(): number;
    isFloatNodeContext(nodeContext: vtree.NodeContext): boolean;
    stopByOverflow(nodeContext: vtree.NodeContext): boolean;
    isOverflown(edge: number): boolean;
    getExclusions(): geom.Shape[];
    openAllViews(position: vtree.NodePosition): task.Result<vtree.NodeContext>;
    calculateOffsetInNodeForNodeContext(position: vtree.NodePosition): number;
    /**
     * @param count first-XXX nesting identifier
     */
    maybePeelOff(
      position: vtree.NodeContext,
      count: number
    ): task.Result<vtree.NodeContext>;
    /**
     * Builds the view until a CSS box edge is reached.
     * @param position start source position.
     * @param checkPoints array to append
     *                      possible breaking points.
     * @return holding box edge position reached
     *                      or null if the source is exhausted.
     */
    buildViewToNextBlockEdge(
      position: vtree.NodeContext,
      checkPoints: vtree.NodeContext[]
    ): task.Result<vtree.NodeContext>;
    nextInTree(
      position: vtree.NodeContext,
      atUnforcedBreak?: boolean
    ): task.Result<vtree.NodeContext>;
    /**
     * Builds the view for a single unbreakable element.
     * @param position start source position.
     * @return holding box edge position reached
     *       or null if the source is exhausted.
     */
    buildDeepElementView(
      position: vtree.NodeContext
    ): task.Result<vtree.NodeContext>;

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
      nodeContext: vtree.NodeContext,
      checkPoints: vtree.NodeContext[],
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
    getComputedMargin(element: Element): geom.Insets;
    /**
     * Reads element's computed padding + borders.
     */
    getComputedPaddingBorder(element: Element): geom.Insets;
    /**
     * Reads element's computed CSS insets(margins + border + padding or margins :
     * depends on box-sizing)
     */
    getComputedInsets(element: Element): geom.Insets;
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
      nodeContextIn: vtree.NodeContext
    ): task.Result<vtree.NodeContext>;
    /**
     * Layout a single float element.
     */
    layoutFloat(nodeContext: vtree.NodeContext): task.Result<vtree.NodeContext>;

    setupFloatArea(
      area: PageFloatArea,
      floatReference: pagefloat.FloatReference,
      floatSide: string,
      anchorEdge: number | null,
      strategy: pagefloat.PageFloatLayoutStrategy,
      condition: pagefloat.PageFloatPlacementCondition
    ): boolean;
    createPageFloatArea(
      float: pagefloat.PageFloat | null,
      floatSide: string,
      anchorEdge: number | null,
      strategy: pagefloat.PageFloatLayoutStrategy,
      condition: pagefloat.PageFloatPlacementCondition
    ): PageFloatArea | null;
    layoutSinglePageFloatFragment(
      continuations: pagefloat.PageFloatContinuation[],
      floatSide: string,
      clearSide: string | null,
      allowFragmented: boolean,
      strategy: pagefloat.PageFloatLayoutStrategy,
      anchorEdge: number | null,
      pageFloatFragment?: pagefloat.PageFloatFragment | null
    ): task.Result<SinglePageFloatLayoutResult>;
    layoutPageFloatInner(
      continuation: pagefloat.PageFloatContinuation,
      strategy: pagefloat.PageFloatLayoutStrategy,
      anchorEdge: number | null,
      pageFloatFragment?: pagefloat.PageFloatFragment
    ): task.Result<boolean>;
    setFloatAnchorViewNode(nodeContext: vtree.NodeContext): vtree.NodeContext;
    resolveFloatReferenceFromColumnSpan(
      floatReference: pagefloat.FloatReference,
      columnSpan: css.Val,
      nodeContext: vtree.NodeContext
    ): task.Result<pagefloat.FloatReference>;
    layoutPageFloat(
      nodeContext: vtree.NodeContext
    ): task.Result<vtree.NodeContext>;
    createJustificationAdjustmentElement(
      insertionPoint: Node,
      doc: Document,
      parentNode: Node,
      vertical: boolean
    ): HTMLElement;
    addAndAdjustJustificationElement(
      nodeContext: vtree.NodeContext,
      insertAfter: boolean,
      node: Node,
      insertionPoint: Node,
      doc: Document,
      parentNode: Node
    ): HTMLElement;
    compensateJustificationLineHeight(
      span: Element,
      br: Element,
      nodeContext: vtree.NodeContext
    ): void;
    /**
     * Fix justification of the last line of text broken across pages (if
     * needed).
     */
    fixJustificationIfNeeded(
      nodeContext: vtree.NodeContext,
      endOfColumn: boolean
    ): void;
    processLineStyling(
      nodeContext: vtree.NodeContext,
      resNodeContext: vtree.NodeContext,
      checkPoints: vtree.NodeContext[]
    ): task.Result<vtree.NodeContext>;
    isLoneImage(checkPoints: vtree.NodeContext[]): boolean;
    getTrailingMarginEdgeAdjustment(
      trailingEdgeContexts: vtree.NodeContext[]
    ): number;
    /**
     * Layout a single CSS box.
     */
    layoutBreakableBlock(
      nodeContext: vtree.NodeContext
    ): task.Result<vtree.NodeContext>;
    postLayoutBlock(
      nodeContext: vtree.NodeContext,
      checkPoints: vtree.NodeContext[]
    ): void;
    findEndOfLine(
      linePosition: number,
      checkPoints: vtree.NodeContext[],
      isUpdateMaxReachedAfterEdge: boolean
    ): {
      nodeContext: vtree.NodeContext;
      index: number;
      checkPointIndex: number;
    };
    findAcceptableBreakInside(
      checkPoints: vtree.NodeContext[],
      edgePosition: number,
      force: boolean
    ): vtree.NodeContext;
    resolveTextNodeBreaker(nodeContext: vtree.NodeContext): TextNodeBreaker;
    /**
     * Read ranges skipping special elments
     */
    getRangeBoxes(start: Node, end: Node): vtree.ClientRect[];
    /**
     * Give block's initial and final nodes, find positions of the line bottoms.
     * This is, of course, somewhat hacky implementation.
     * @return position of line breaks
     */
    findLinePositions(checkPoints: vtree.NodeContext[]): number[];
    calculateClonedPaddingBorder(nodeContext: vtree.NodeContext): number;
    findBoxBreakPosition(
      bp: BoxBreakPosition,
      force: boolean
    ): vtree.NodeContext;
    getAfterEdgeOfBlockContainer(nodeContext: vtree.NodeContext): number;
    findFirstOverflowingEdgeAndCheckPoint(
      checkPoints: vtree.NodeContext[]
    ): { edge: number; checkPoint: vtree.NodeContext | null };
    findEdgeBreakPosition(bp: EdgeBreakPosition): vtree.NodeContext;
    /**
     * Finalize a line break.
     * @return holing true
     */
    finishBreak(
      nodeContext: vtree.NodeContext,
      forceRemoveSelf: boolean,
      endOfColumn: boolean
    ): task.Result<boolean>;
    findAcceptableBreakPosition(): BreakPositionAndNodeContext;
    doFinishBreak(
      nodeContext: vtree.NodeContext,
      overflownNodeContext: vtree.NodeContext,
      initialNodeContext: vtree.NodeContext,
      initialComputedBlockSize: number
    ): task.Result<vtree.NodeContext>;
    /**
     * Determines if a page break is acceptable at this position
     */
    isBreakable(flowPosition: vtree.NodeContext): boolean;
    /**
     * Determines if an indent value is zero
     */
    zeroIndent(val: string | number): boolean;
    /**
     * @return true if overflows
     */
    checkOverflowAndSaveEdge(
      nodeContext: vtree.NodeContext,
      trailingEdgeContexts: vtree.NodeContext[]
    ): boolean;
    /**
     * Save a possible page break position on a CSS block edge. Check if it
     * overflows.
     * @return true if overflows
     */
    checkOverflowAndSaveEdgeAndBreakPosition(
      nodeContext: vtree.NodeContext,
      trailingEdgeContexts: vtree.NodeContext[],
      saveEvenOverflown: boolean,
      breakAtTheEdge: string | null
    ): boolean;
    applyClearance(nodeContext: vtree.NodeContext): boolean;
    isBFC(formattingContext: vtree.FormattingContext): boolean;
    /**
     * Skips positions until either the start of unbreakable block or inline
     * content. Also sets breakBefore on the result combining break-before and
     * break-after properties from all elements that meet at the edge.
     */
    skipEdges(
      nodeContext: vtree.NodeContext,
      leadingEdge: boolean,
      forcedBreakValue: string | null
    ): task.Result<vtree.NodeContext>;
    /**
     * Skips non-renderable positions until it hits the end of the flow or some
     * renderable content. Returns the nodeContext that was passed in if some
     * content remains and null if all content could be skipped.
     */
    skipTailEdges(
      nodeContext: vtree.NodeContext
    ): task.Result<vtree.NodeContext>;
    layoutFloatOrFootnote(
      nodeContext: vtree.NodeContext
    ): task.Result<vtree.NodeContext>;
    /**
     * Layout next portion of the source.
     */
    layoutNext(
      nodeContext: vtree.NodeContext,
      leadingEdge: boolean,
      forcedBreakValue?: string | null
    ): task.Result<vtree.NodeContext>;
    clearOverflownViewNodes(
      nodeContext: vtree.NodeContext,
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
      position: vtree.NodeContext,
      breakAtEdge: string | null,
      overflows: boolean
    ): void;
    /**
     * @param checkPoints array of breaking points for breakable block
     */
    saveBoxBreakPosition(checkPoints: vtree.NodeContext[]): void;
    updateMaxReachedAfterEdge(afterEdge: number): void;
    /**
     * @param chunkPosition starting position.
     * @return holding end position.
     */
    layout(
      chunkPosition: vtree.ChunkPosition,
      leadingEdge: boolean,
      breakAfter?: string | null
    ): task.Result<vtree.ChunkPosition>;
    isFullWithPageFloats(): boolean;
    getMaxBlockSizeOfPageFloats(): number;
    doFinishBreakOfFragmentLayoutConstraints(nodeContext): void;
    /**
     * @param nodeContext starting position.
     * @return holding end position.
     */
    doLayout(
      nodeContext: vtree.NodeContext,
      leadingEdge: boolean,
      breakAfter?: string | null
    ): task.Result<{
      nodeContext: vtree.NodeContext;
      overflownNodeContext: vtree.NodeContext;
    }>;
    /**
     * Re-layout already laid-out chunks. Return the position of the last flow if
     * there is an overflow.
     * TODO: deal with chunks that did not fit at all.
     * @return holding end position.
     */
    redoLayout(): task.Result<vtree.ChunkPosition>;
    saveDistanceToBlockEndFloats(): void;
  }

  export type SinglePageFloatLayoutResult = {
    floatArea: PageFloatArea|null,
    pageFloatFragment: pagefloat.PageFloatFragment|null,
    newPosition: vtree.ChunkPosition|null
  };

  /**
   * breaking point resolver for Text Node.
   */
  export interface TextNodeBreaker {
    breakTextNode(
        textNode: Text, nodeContext: vtree.NodeContext, low: number,
        checkPoints: vtree.NodeContext[], checkpointIndex: number,
        force: boolean): vtree.NodeContext;
    breakAfterSoftHyphen(
        textNode: Text, text: string, viewIndex: number,
        nodeContext: vtree.NodeContext): number;
    breakAfterOtherCharacter(
        textNode: Text, text: string, viewIndex: number,
        nodeContext: vtree.NodeContext): number;
    updateNodeContext(
        nodeContext: vtree.NodeContext, viewIndex: number,
        textNode: Text): vtree.NodeContext;
  }

  export interface LayoutRetryer {
    initialBreakPositions: layout.BreakPosition[];
    initialStateOfFormattingContext: any;
    initialPosition: any;
    initialFragmentLayoutConstraints: any;

    layout(
      nodeContext: vtree.NodeContext,
      column: layout.Column
    ): task.Result<vtree.NodeContext>;
    resolveLayoutMode(nodeContext: vtree.NodeContext): LayoutMode;
    prepareLayout(nodeContext: vtree.NodeContext, column: layout.Column): void;
    clearNodes(initialPosition: vtree.NodeContext): void;
    saveState(nodeContext: vtree.NodeContext, column: layout.Column): void;
    restoreState(nodeContext: vtree.NodeContext, column: layout.Column): void;
  }

  export interface LayoutMode {
    doLayout(
      nodeContext: vtree.NodeContext,
      column: layout.Column
    ): task.Result<vtree.NodeContext>;
    accept(nodeContext: vtree.NodeContext, column: layout.Column): boolean;
    postLayout(
      positionAfter: vtree.NodeContext,
      initialPosition: vtree.NodeContext,
      column: layout.Column,
      accepted: boolean
    ): boolean;
  }

  export interface PageFloatArea extends Column {
    adjustContentRelativeSize: boolean;
    readonly floatSide: string;
    readonly parentContainer: vtree.Container;

    convertPercentageSizesToPx(target: Element): void;
    fixFloatSizeAndPosition(nodeContext: vtree.NodeContext): void;
    getContentInlineSize(): number;
  }
}

export namespace net {

  export type Response = {
    status: number,
    url: string,
    contentType: string|null,
    responseText: string|null,
    responseXML: Document,
    responseBlob: Blob
  };

  export interface ResourceStore<Resource> {
    resources: { [key: string]: Resource };
    fetchers: { [key: string]: taskutil.Fetcher<Resource> };
    readonly parser: (
      p1: Response,
      p2: ResourceStore<Resource>
    ) => task.Result<Resource>;
    readonly type: XMLHttpRequestResponseType;

    /**
     * @return resource for the given URL
     */
    load(
      url: string,
      opt_required?: boolean,
      opt_message?: string
    ): task.Result<Resource>;
    /**
     * @return fetcher for the resource for the given URL
     */
    fetch(
      url: string,
      opt_required?: boolean,
      opt_message?: string
    ): taskutil.Fetcher<Resource>;
    get(url: string): xmldoc.XMLDocHolder;
    delete(url: string): void;
  }
}

export namespace pagefloat {
  /**
   * @enum {string}
   */
  export enum FloatReference {
    INLINE = 'inline',
    COLUMN = 'column',
    REGION = 'region',
    PAGE = 'page',
  }

  export type PageFloatID = string;

  export interface PageFloat {
    order: number|null;
    id: PageFloatID|null;
    readonly nodePosition: vtree.NodePosition;
    readonly floatReference: FloatReference;
    readonly floatSide: string;
    readonly clearSide: string|null;
    readonly flowName: string;
    readonly floatMinWrapBlock: css.Numeric|null;

    getOrder(): number;
    getId(): PageFloatID;
    isAllowedOnContext(pageFloatLayoutContext: PageFloatLayoutContext): boolean;
    isAllowedToPrecede(other: PageFloat): boolean;
  }

  export interface PageFloatFragment {
    readonly floatReference: FloatReference;
    readonly floatSide: string;
    readonly continuations: PageFloatContinuation[];
    readonly area: vtree.Container;
    readonly continues: boolean;

    hasFloat(float: PageFloat): boolean;
    findNotAllowedFloat(context: PageFloatLayoutContext): PageFloat|null;
    getOuterShape(): geom.Shape;
    getOuterRect(): geom.Rect;
    getOrder(): number;
    shouldBeStashedBefore(float: PageFloat): boolean;
    addContinuations(continuations: PageFloatContinuation[]): void;
    getFlowName(): string;
  }

  export interface PageFloatContinuation {
    readonly float: PageFloat;
    readonly nodePosition: vtree.NodePosition;

    equals(other: PageFloatContinuation|null): boolean;
  }

  export type PageFloatPlacementCondition = {
    [key: string]: boolean
  };

  export interface PageFloatLayoutContext {
    // FIXME
  }

  export interface PageFloatLayoutStrategy {
    appliesToNodeContext(nodeContext: vtree.NodeContext): boolean;
    appliesToFloat(float: PageFloat): boolean;
    createPageFloat(
        nodeContext: vtree.NodeContext,
        pageFloatLayoutContext: PageFloatLayoutContext,
        column: layout.Column): task.Result<PageFloat>;
    createPageFloatFragment(
        continuations: PageFloatContinuation[], logicalFloatSide: string,
        floatArea: layout.PageFloatArea, continues: boolean): PageFloatFragment;
    findPageFloatFragment(
        float: PageFloat,
        pageFloatLayoutContext: PageFloatLayoutContext): PageFloatFragment|null;
    adjustPageFloatArea(
        floatArea: layout.PageFloatArea, floatContainer: vtree.Container,
        column: layout.Column);
    forbid(float: PageFloat, pageFloatLayoutContext: PageFloatLayoutContext);
  }
}

export namespace selector {
  export interface AfterIfContinues {
    readonly sourceNode: Element;
    readonly styler: vgen.PseudoelementStyler;

    createElement(
      column: layout.Column,
      parentNodeContext: vtree.NodeContext
    ): task.Result<Element>;
  }
}

export namespace vgen {
  export interface PseudoelementStyler extends cssstyler.AbstractStyler {
    contentProcessed: { [key: string]: boolean };
    readonly element: Element;
    style: csscasc.ElementStyle;
    styler: cssstyler.AbstractStyler;
    readonly context: expr.Context;
    readonly exprContentListener: vtree.ExprContentListener;
  }
}

export namespace vtree {

  export type ClientRect = {
    left: number,
    top: number,
    right: number,
    bottom: number,
    width: number,
    height: number
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
        nodeContext: NodeContext, firstTime: boolean,
        atUnforcedBreak?: boolean): task.Result<boolean>;
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
    nextInTree(nodeContext: NodeContext, atUnforcedBreak?: boolean):
        task.Result<NodeContext>;
    /**
     * Apply pseudo-element styles (if any).
     * @param element element to apply styles to
     */
    applyPseudoelementStyle(
        nodeContext: NodeContext, pseudoName: string, element: Element): void;
    /**
     * Apply styles to footnote container.
     * @param element element to apply styles to
     * @return vertical
     */
    applyFootnoteStyle(vertical: boolean, rtl: boolean, element: Element):
        boolean;
    /**
     * Peel off innermost first-XXX pseudoelement, create and create view nodes
     * after the end of that pseudoelement.
     */
    peelOff(nodeContext: NodeContext, nodeOffset: number):
        task.Result<NodeContext>;
    /**
     * Process a block-end edge of a fragmented block.
     */
    processFragmentedBlockEdge(nodeContext: NodeContext);
    convertLengthToPx(
        numeric: css.Numeric, viewNode: Node, clientLayout: ClientLayout): number
        |css.Numeric;
    /**
     * Returns if two NodePositions represents the same position in the document.
     */
    isSameNodePosition(nodePosition1: NodePosition, nodePosition2: NodePosition):
        boolean;
    addEventListener(
        type: string, listener: base.EventListener, capture?: boolean): void;
    removeEventListener(
        type: string, listener: base.EventListener, capture?: boolean): void;
    dispatchEvent(evt: base.Event): void;
  }

  /**
   * Formatting context.
   */
  export interface FormattingContext {
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
    preprocessedTextContent: diff.Change[] | null;
  };

  /**
   * Handling of purely whitespace sequences between blocks
   * @enum {number}
   */
  export enum Whitespace {
    IGNORE,
    /**
     * Whitespace sequence between blocks is ignored
     */
    NEWLINE,
    /**
     * Whitespace sequence between blocks is ignored unless it containes newline
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
    exclusions: geom.Shape[];
    innerShape: geom.Shape;
    computedBlockSize: number;
    snapWidth: number;
    snapHeight: number;
    snapOffsetX: number;
    snapOffsetY: number;
    vertical: boolean;
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
    getInnerShape(): geom.Shape;
    getInnerRect(): geom.Rect;
    getPaddingRect(): geom.Rect;
    getOuterShape(outerShapeProp: css.Val, context: expr.Context): geom.Shape;
    getOuterRect(): geom.Rect;
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
    readonly xmldoc: xmldoc.XMLDocHolder;
    readonly parentShadow: ShadowContext;
    subShadow: ShadowContext;
    readonly type: vtree.ShadowType;
    readonly styler: Object;

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
    shadowType: ShadowType;

    // parent's shadow type
    shadowContext: vtree.ShadowContext;
    nodeShadow: vtree.ShadowContext;
    shadowSibling: NodeContext;

    // next "sibling" in the shadow tree
    // other stuff
    shared: boolean;
    inline: boolean;
    overflow: boolean;
    breakPenalty: number;
    display: string | null;
    floatReference: pagefloat.FloatReference;
    floatSide: string | null;
    clearSide: string | null;
    floatMinWrapBlock: css.Numeric | null;
    columnSpan: css.Val | null;
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
    inheritedProps: { [key: string]: number | string | css.Val };
    vertical: boolean;
    direction: string;
    firstPseudo: FirstPseudo;
    lang: string | null;
    preprocessedTextContent: diff.Change[] | null;
    formattingContext: FormattingContext;
    repeatOnBreak: string | null;
    pluginProps: {
      [key: string]: string | number | undefined | null | (number | null)[];
    };
    fragmentIndex: number;
    afterIfContinues: selector.AfterIfContinues;
    footnotePolicy: css.Ident | null;

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

  /**
   * vertical writing
   */
  export type ExprContentListener = (
    p1: expr.Val,
    p2: string,
    p3: Document
  ) => Node | null;
}

export namespace xmldoc {
  export interface XMLDocHolder {
    lang: string | null;
    totalOffset: number;
    root: Element;
    body: Element;
    head: Element;
    last: Element;
    lastOffset: number;
    idMap: any;
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
    size(): number ;
    /**
     * Filter with predicate
     */
    predicate(pr: Predicate): NodeList;
    forEachNode(fn: (p1: Node, p2: (p1: Node) => void) => void): NodeList;
    forEach<T>(fn: (p1: Node) => T): T[];
    forEachNonNull<T>(fn: (p1: Node) => T): T[];
    child(tag: string): NodeList;
    childElements(): NodeList;
    attribute(name: string): (string|null)[];
    textContent(): (string|null)[];
  }

  export type XMLDocStore = net.ResourceStore<XMLDocHolder>;
}
