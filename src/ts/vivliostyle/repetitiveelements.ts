/**
 * Copyright 2016 Trim-marks Inc.
 * @fileoverview Elements repeated in every fragment by repeat-on-break
 * property.
 */
import * as asserts from './asserts';

import * as task from '../adapt/task';
import * as vtree from '../adapt/vtree';

import {LayoutMode, LayoutIterator, EdgeSkipper, AbstractLayoutRetryer, PseudoColumn} from './layoututil';

import * as layout from '../adapt/layout';

import * as selectors from './selectors';
import * as table from './table';
import * as plugin from './plugin';

export class RepetitiveElementsOwnerFormattingContext implements
    vtree.FormattingContext {
  isRoot: boolean = false;
  repetitiveElements: RepetitiveElements = null;

  constructor(
      public readonly parent: vtree.FormattingContext,
      public readonly rootSourceNode: Element) {}

  /**
   * @override
   */
  getName() {return 'Repetitive elements owner formatting context (RepetitiveElementsOwnerFormattingContext)';}

  /**
   * @override
   */
  isFirstTime(nodeContext, firstTime) {return firstTime;}

  /**
   * @override
   */
  getParent() {
    return this.parent;
  }

  getRepetitiveElements(): RepetitiveElements {
    return this.repetitiveElements;
  }

  getRootViewNode(position: vtree.NodeContext): Element|null {
    const root = this.getRootNodeContext(position);
    return root ? (root.viewNode as Element) : null;
  }

  getRootNodeContext(nodeContext: vtree.NodeContext): vtree.NodeContext|null {
    do {
      if (!nodeContext.belongsTo(this) &&
          nodeContext.sourceNode === this.rootSourceNode) {
        return nodeContext;
      }
    } while (nodeContext = nodeContext.parent);
    return null;
  }

  initializeRepetitiveElements(vertical: boolean) {
    if (this.repetitiveElements) {
      return;
    }
    const found = repetitiveElementsCache.some((entry) => {
      if (entry.root === this.rootSourceNode) {
        this.repetitiveElements = entry.elements;
        return true;
      }
      return false;
    });
    if (!found) {
      this.repetitiveElements =
          new RepetitiveElements(vertical, this.rootSourceNode);
      repetitiveElementsCache.push(
          {root: this.rootSourceNode, elements: this.repetitiveElements});
    }
  }

  /** @override */
  saveState() {}

  /** @override */
  restoreState(state) {}
}

let repetitiveElementsCache: {root: Element, elements: RepetitiveElements}[] =
    [];

export const clearCache = () => {
  repetitiveElementsCache = [];
};

export interface ElementsOffset {
  calculateOffset(nodeContext: vtree.NodeContext): number;

  calculateMinimumOffset(nodeContext: vtree.NodeContext): number;
}

export class RepetitiveElements implements ElementsOffset {
  private headerSourceNode: Element|null = null;
  private footerSourceNode: Element|null = null;
  private headerViewNode: Element|null = null;
  private footerViewNode: Element|null = null;
  private headerNodePosition: vtree.NodePosition|null = null;
  private footerNodePosition: vtree.NodePosition|null = null;
  private headerHeight: number = 0;
  private footerHeight: number = 0;
  isSkipHeader: boolean = false;
  isSkipFooter: boolean = false;
  enableSkippingFooter: boolean = true;
  enableSkippingHeader: boolean = true;
  doneInitialLayout: boolean = false;
  firstContentSourceNode: Element|null = null;
  lastContentSourceNode: Element|null = null;
  private affectedNodeCache: {nodeContext: vtree.NodeContext,
                              result: boolean}[] = [];
  private afterLastContentNodeCache:
      {nodeContext: vtree.NodeContext, result: boolean}[] = [];
  allowInsert: any = false;
  allowInsertRepeatitiveElements: any;

  constructor(
      private readonly vertical: boolean, public ownerSourceNode: Element) {}

  setHeaderNodeContext(nodeContext: vtree.NodeContext) {
    if (this.headerNodePosition) {
      return;
    }

    // use first one.
    this.headerNodePosition =
        vtree.newNodePositionFromNodeContext(nodeContext, 0);
    this.headerSourceNode = (nodeContext.sourceNode as Element);
    this.headerViewNode = (nodeContext.viewNode as Element);
  }

  setFooterNodeContext(nodeContext: vtree.NodeContext) {
    if (this.footerNodePosition) {
      return;
    }

    // use first one.
    this.footerNodePosition =
        vtree.newNodePositionFromNodeContext(nodeContext, 0);
    this.footerSourceNode = (nodeContext.sourceNode as Element);
    this.footerViewNode = (nodeContext.viewNode as Element);
  }

  updateHeight(column: layout.Column) {
    if (this.headerViewNode) {
      this.headerHeight =
          layout.getElementHeight(this.headerViewNode, column, this.vertical);
      this.headerViewNode = null;
    }
    if (this.footerViewNode) {
      this.footerHeight =
          layout.getElementHeight(this.footerViewNode, column, this.vertical);
      this.footerViewNode = null;
    }
  }

  prepareLayoutFragment() {
    this.isSkipHeader = this.isSkipFooter = false;
    this.enableSkippingFooter = true;
    this.enableSkippingHeader = true;
  }

  appendHeaderToFragment(
      rootNodeContext: vtree.NodeContext, firstChild: Node|null,
      column: layout.Column) {
    if (!this.headerNodePosition || this.isSkipHeader) {
      return task.newResult(true);
    }
    return this.appendElementToFragment(
        this.headerNodePosition, rootNodeContext, firstChild, column);
  }

  appendFooterToFragment(
      rootNodeContext: vtree.NodeContext, firstChild: Node|null,
      column: layout.Column) {
    if (!this.footerNodePosition || this.isSkipFooter) {
      return task.newResult(true);
    }
    return this.appendElementToFragment(
        this.footerNodePosition, rootNodeContext, firstChild, column);
  }

  /**
   * @return
   */
  appendElementToFragment(
      nodePosition: vtree.NodePosition, rootNodeContext: vtree.NodeContext,
      firstChild: Node|null, column: layout.Column): any {
    const doc = rootNodeContext.viewNode.ownerDocument;
    const rootViewNode = (rootNodeContext.viewNode as Element);
    const viewRoot = doc.createElement('div');
    rootViewNode.appendChild(viewRoot);
    const pseudoColumn = new PseudoColumn(column, viewRoot, rootNodeContext);
    const initialPageBreakType = pseudoColumn.getColumn().pageBreakType;
    pseudoColumn.getColumn().pageBreakType = null;
    this.allowInsertRepeatitiveElements = true;
    return pseudoColumn.layout(new vtree.ChunkPosition(nodePosition), true)
        .thenAsync(() => {
          this.allowInsertRepeatitiveElements = false;
          rootViewNode.removeChild(viewRoot);
          this.moveChildren(viewRoot, rootViewNode, firstChild);
          pseudoColumn.getColumn().pageBreakType = initialPageBreakType;
          return task.newResult(true);
        });
  }

  moveChildren(from: Element, to: Element, firstChild: Node|null) {
    if (!to) {
      return;
    }
    while (from.firstChild) {
      const child = from.firstChild;
      from.removeChild(child);
      (child as Element).setAttribute(vtree.SPECIAL_ATTR, '1');
      if (firstChild) {
        to.insertBefore(child, firstChild);
      } else {
        to.appendChild(child);
      }
    }
  }

  /** @override */
  calculateOffset(nodeContext) {
    let offset = 0;
    if (nodeContext && !this.affectTo(nodeContext)) {
      return offset;
    }
    if (!this.isSkipFooter ||
        nodeContext && this.isAfterLastContent(nodeContext)) {
      offset += this.footerHeight;
    }
    if (!this.isSkipHeader) {
      offset += this.headerHeight;
    }
    return offset;
  }

  /** @override */
  calculateMinimumOffset(nodeContext) {
    let offset = 0;
    if (nodeContext && !this.affectTo(nodeContext)) {
      return offset;
    }
    if (nodeContext && this.isAfterLastContent(nodeContext)) {
      offset += this.footerHeight;
    }
    if (!this.enableSkippingHeader) {
      offset += this.headerHeight;
    }
    return offset;
  }

  isAfterLastContent(nodeContext: vtree.NodeContext): boolean {
    return this.findResultFromCache(
        nodeContext, this.afterLastContentNodeCache,
        (nc) => this.isAfterNodeContextOf(
            this.lastContentSourceNode as Element, nodeContext, false));
  }

  private affectTo(nodeContext: vtree.NodeContext): boolean {
    return this.findResultFromCache(
        nodeContext, this.affectedNodeCache,
        (nc) =>
            this.isAfterNodeContextOf(this.ownerSourceNode, nodeContext, true));
  }

  private findResultFromCache(
      nodeContext: vtree.NodeContext,
      cache: {nodeContext: vtree.NodeContext, result: boolean}[],
      calculator: (p1: vtree.NodeContext) => boolean): boolean {
    const cacheEntry = cache.filter(
        (cache) => cache.nodeContext.sourceNode === nodeContext.sourceNode &&
            cache.nodeContext.after === nodeContext.after);
    if (cacheEntry.length > 0) {
      return cacheEntry[0].result;
    } else {
      const result = calculator(nodeContext);
      cache.push({nodeContext, result});
      return result;
    }
  }

  private isAfterNodeContextOf(
      node: Element, nodeContext: vtree.NodeContext,
      includeChildren: boolean): boolean {
    const parentsOfNode = [];
    for (let n: Node|null = node; n; n = n.parentNode) {
      if (nodeContext.sourceNode === n) {
        return nodeContext.after;
      } else {
        parentsOfNode.push(n);
      }
    }
    for (let currentParent: Node|null = nodeContext.sourceNode; currentParent;
         currentParent = currentParent.parentNode) {
      const index = parentsOfNode.indexOf(currentParent);
      if (index >= 0) {
        return includeChildren ? index === 0 : false;
      } else {
        for (let current: Element|null = currentParent as Element; current;
             current = current.previousElementSibling) {
          if (parentsOfNode.includes(current)) {
            return true;
          }
        }
      }
    }
    return nodeContext.after;
  }

  isFirstContentNode(nodeContext: vtree.NodeContext): boolean {
    return nodeContext &&
        this.firstContentSourceNode === nodeContext.sourceNode;
  }

  isEnableToUpdateState(): boolean {
    if (!this.isSkipFooter && this.enableSkippingFooter &&
            this.footerNodePosition ||
        !this.isSkipHeader && this.enableSkippingHeader &&
            this.headerNodePosition) {
      return true;
    } else {
      return false;
    }
  }

  updateState() {
    if (!this.isSkipFooter && this.enableSkippingFooter &&
        this.footerNodePosition) {
      this.isSkipFooter = true;
    } else if (!this.isSkipHeader && this.enableSkippingHeader &&
        this.headerNodePosition) {
      this.isSkipHeader = true;
    }
  }

  preventSkippingHeader() {
    this.isSkipHeader = false;
    this.enableSkippingHeader = false;
  }

  preventSkippingFooter() {
    this.isSkipFooter = false;
    this.enableSkippingFooter = false;
  }

  isHeaderRegistered(): boolean {
    return !!this.headerNodePosition;
  }

  isFooterRegistered(): boolean {
    return !!this.footerNodePosition;
  }

  isHeaderSourceNode(node: Node): boolean {
    return this.headerSourceNode === node;
  }

  isFooterSourceNode(node: Node): boolean {
    return this.footerSourceNode === node;
  }
}

/**
 * @abstract
 */
export abstract class LayoutEntireBlock implements LayoutMode {
  formattingContext: any;

  constructor(formattingContext: RepetitiveElementsOwnerFormattingContext) {
    this.formattingContext = formattingContext;
  }

  /**
   * @override
   */
  abstract doLayout(nodeContext: vtree.NodeContext, column: layout.Column):
      task.Result<vtree.NodeContext>;

  /**
   * @override
   */
  accept(nodeContext, column) {return !!nodeContext;}

  /**
   * @override
   */
  postLayout(positionAfter, initialPosition, column, accepted) {
    const repetitiveElements = this.formattingContext.getRepetitiveElements();
    if (repetitiveElements) {
      asserts.assert(column.clientLayout);
      if (!repetitiveElements.doneInitialLayout) {
        repetitiveElements.updateHeight(column);
        repetitiveElements.doneInitialLayout = true;
      }
    }
    return accepted;
  }
}

/**
 * @abstract
 */
export abstract class LayoutFragmentedBlock implements LayoutMode {
  formattingContext: any;

  constructor(formattingContext: RepetitiveElementsOwnerFormattingContext) {
    this.formattingContext = formattingContext;
  }

  /**
   * @override
   */
  abstract doLayout(nodeContext: vtree.NodeContext, column: layout.Column):
      task.Result<vtree.NodeContext>;

  /**
   * @override
   */
  accept(nodeContext, column) {return true;}

  /**
   * @override
   */
  postLayout(positionAfter, initialPosition, column, accepted) {return accepted;}
}

export class LayoutEntireOwnerBlock extends
    LayoutEntireBlock {
  constructor(
      formattingContext: RepetitiveElementsOwnerFormattingContext,
      public readonly processor: RepetitiveElementsOwnerLayoutProcessor) {
    super(formattingContext);
  }

  /**
   * @override
   */
  doLayout(nodeContext, column) {
    LayoutEntireBlock.prototype.doLayout.call(this, nodeContext, column);
    return this.processor.doInitialLayout(nodeContext, column);
  }

  /**
   * @override
   */
  accept(nodeContext, column) {return false;}
}

export class LayoutFragmentedOwnerBlock extends
    LayoutFragmentedBlock {
  constructor(
      formattingContext: RepetitiveElementsOwnerFormattingContext,
      public readonly processor: RepetitiveElementsOwnerLayoutProcessor) {
    super(formattingContext);
  }

  /**
   * @override
   */
  doLayout(nodeContext, column) {
    if (!nodeContext.belongsTo(this.formattingContext) && !nodeContext.after) {
      column.fragmentLayoutConstraints.unshift(
          new RepetitiveElementsOwnerLayoutConstraint(nodeContext));
    }
    return this.processor.doLayout(nodeContext, column);
  }
}

export class RepetitiveElementsOwnerLayoutConstraint implements
    layout.FragmentLayoutConstraint {
  nodeContext: any;

  constructor(nodeContext: vtree.NodeContext) {
    const formattingContext = getRepetitiveElementsOwnerFormattingContext(
        nodeContext.formattingContext);
    this.nodeContext = formattingContext.getRootNodeContext(nodeContext);
  }

  /** @override */
  allowLayout(nodeContext, overflownNodeContext, column) {
    const repetitiveElements = this.getRepetitiveElements();
    if (!repetitiveElements) {
      return true;
    }
    if (layout.isOrphan(this.nodeContext.viewNode)) {
      return true;
    }
    if (!repetitiveElements.isEnableToUpdateState()) {
      return true;
    }
    if (overflownNodeContext && !nodeContext ||
        nodeContext && nodeContext.overflow) {
      return false;
    } else {
      return true;
    }
  }

  /** @override */
  nextCandidate(nodeContext) {
    const repetitiveElements = this.getRepetitiveElements();
    if (!repetitiveElements) {
      return false;
    }
    if (repetitiveElements.isEnableToUpdateState()) {
      repetitiveElements.updateState();
      return true;
    } else {
      return false;
    }
  }

  /** @override */
  postLayout(allowed, nodeContext, initialPosition, column) {
    const repetitiveElements = this.getRepetitiveElements();
    if (!repetitiveElements) {
      return;
    }
    if (allowed) {
      if (column.stopAtOverflow) {
        if (nodeContext == null ||
            repetitiveElements.isAfterLastContent(nodeContext)) {
          repetitiveElements.preventSkippingFooter();
        }
      }
    }
  }

  /** @override */
  finishBreak(nodeContext, column) {
    const formattingContext = getRepetitiveElementsOwnerFormattingContext(
        this.nodeContext.formattingContext);
    const repetitiveElements = this.getRepetitiveElements();
    if (!repetitiveElements) {
      return task.newResult(true);
    }
    const rootNodeContext = this.nodeContext;
    return appendHeader(formattingContext, rootNodeContext, column)
        .thenAsync(
            () => appendFooter(formattingContext, rootNodeContext, column)
                      .thenAsync(() => {
                        repetitiveElements.prepareLayoutFragment();
                        return task.newResult(true);
                      }));
  }

  getRepetitiveElements() {
    const formattingContext = getRepetitiveElementsOwnerFormattingContext(
        this.nodeContext.formattingContext);
    return formattingContext.getRepetitiveElements();
  }

  /** @override */
  equalsTo(constraint) {
    if (!(constraint instanceof RepetitiveElementsOwnerLayoutConstraint)) {
      return false;
    }
    return getRepetitiveElementsOwnerFormattingContext(
               this.nodeContext.formattingContext) ===
        getRepetitiveElementsOwnerFormattingContext(
               constraint.nodeContext.formattingContext);
  }

  /** @override */
  getPriorityOfFinishBreak() {return 10;}
}

export class RepetitiveElementsOwnerLayoutRetryer extends
    AbstractLayoutRetryer {
  constructor(
      public readonly formattingContext:
          RepetitiveElementsOwnerFormattingContext,
      private readonly processor: RepetitiveElementsOwnerLayoutProcessor) {
    super();
  }

  /**
   * @override
   */
  resolveLayoutMode(nodeContext) {
    const repetitiveElements = this.formattingContext.getRepetitiveElements();
    if (!nodeContext.belongsTo(this.formattingContext) &&
        !repetitiveElements.doneInitialLayout) {
      return new LayoutEntireOwnerBlock(this.formattingContext, this.processor);
    } else {
      if (!nodeContext.belongsTo(this.formattingContext) &&
          !nodeContext.after) {
        if (repetitiveElements) {
          repetitiveElements.preventSkippingHeader();
        }
      }
      return new LayoutFragmentedOwnerBlock(
          this.formattingContext, this.processor);
    }
  }
}

export class EntireBlockLayoutStrategy extends
    EdgeSkipper {
  constructor(
      public readonly formattingContext:
          RepetitiveElementsOwnerFormattingContext,
      public readonly column: layout.Column) {
    super();
  }

  /**
   * @override
   */
  startNonInlineElementNode(state) {
    const formattingContext = this.formattingContext;
    const nodeContext = state.nodeContext;
    const repetitiveElements = formattingContext.getRepetitiveElements();
    if (nodeContext.parent &&
        formattingContext.rootSourceNode === nodeContext.parent.sourceNode) {
      switch (nodeContext.repeatOnBreak) {
        case 'header':
          if (!repetitiveElements.isHeaderRegistered()) {
            repetitiveElements.setHeaderNodeContext(nodeContext);
            return task.newResult(true);
          } else {
            nodeContext.repeatOnBreak = 'none';
          }
          break;
        case 'footer':
          if (!repetitiveElements.isFooterRegistered()) {
            repetitiveElements.setFooterNodeContext(nodeContext);
            return task.newResult(true);
          } else {
            nodeContext.repeatOnBreak = 'none';
          }
          break;
      }
      if (!repetitiveElements.firstContentSourceNode) {
        repetitiveElements.firstContentSourceNode =
            (nodeContext.sourceNode as Element);
      }
    }
    return EdgeSkipper.prototype.startNonInlineElementNode.call(this, state);
  }

  /**
   * @override
   */
  afterNonInlineElementNode(state) {
    const formattingContext = this.formattingContext;
    const nodeContext = state.nodeContext;
    if (nodeContext.sourceNode === formattingContext.rootSourceNode) {
      formattingContext.getRepetitiveElements().lastContentSourceNode =
          state.lastAfterNodeContext && state.lastAfterNodeContext.sourceNode;
      state.break = true;
    }
    if (nodeContext.repeatOnBreak === 'header' ||
        nodeContext.repeatOnBreak === 'footer') {
      return task.newResult(true);
    } else {
      return EdgeSkipper.prototype.afterNonInlineElementNode.call(this, state);
    }
  }
}

export class FragmentedBlockLayoutStrategy extends
    EdgeSkipper {
  constructor(
      public readonly formattingContext:
          RepetitiveElementsOwnerFormattingContext,
      public readonly column: layout.Column) {
    super();
  }
}

export class RepetitiveElementsOwnerLayoutProcessor extends
    layout.BlockLayoutProcessor implements layout.LayoutProcessor {
  /**
   * @override
   */
  layout(nodeContext, column, leadingEdge) {
    if (column.isFloatNodeContext(nodeContext)) {
      return column.layoutFloatOrFootnote(nodeContext);
    }
    const formattingContext = getRepetitiveElementsOwnerFormattingContext(
        nodeContext.formattingContext);
    const rootViewNode = formattingContext.getRootViewNode(nodeContext);
    if (!rootViewNode) {
      return column.buildDeepElementView(nodeContext);
    } else {
      if (leadingEdge) {
        appendHeaderToAncestors(nodeContext.parent, column);
      }
      if (!nodeContext.belongsTo(formattingContext)) {
        return (new RepetitiveElementsOwnerLayoutRetryer(
                    formattingContext, this))
            .layout(nodeContext, column);
      } else {
        return layout.BlockLayoutProcessor.prototype.layout.call(
            this, nodeContext, column, leadingEdge);
      }
    }
  }

  /**
   * @override
   */
  startNonInlineElementNode(nodeContext) {
    const formattingContext =
        getRepetitiveElementsOwnerFormattingContextOrNull(nodeContext);
    const repetitiveElements = formattingContext.getRepetitiveElements();
    if (!repetitiveElements) {
      return false;
    }
    if (!repetitiveElements.allowInsertRepeatitiveElements &&
        (repetitiveElements.isHeaderSourceNode(nodeContext.sourceNode) ||
         repetitiveElements.isFooterSourceNode(nodeContext.sourceNode))) {
      nodeContext.viewNode.parentNode.removeChild(nodeContext.viewNode);
    }
    return false;
  }

  doInitialLayout(nodeContext: vtree.NodeContext, column: layout.Column):
      task.Result<vtree.NodeContext> {
    const formattingContext = getRepetitiveElementsOwnerFormattingContext(
        nodeContext.formattingContext);
    const frame = task.newFrame<vtree.NodeContext>('BlockLayoutProcessor.doInitialLayout');
    this.layoutEntireBlock(nodeContext, column).thenFinish(frame);
    return frame.result();
  }

  private layoutEntireBlock(
      nodeContext: vtree.NodeContext,
      column: layout.Column): task.Result<vtree.NodeContext> {
    const formattingContext = getRepetitiveElementsOwnerFormattingContext(
        nodeContext.formattingContext);
    const strategy = new EntireBlockLayoutStrategy(formattingContext, column);
    const iterator = new LayoutIterator(strategy, column.layoutContext);
    return iterator.iterate(nodeContext);
  }

  doLayout(nodeContext: vtree.NodeContext, column: layout.Column):
      task.Result<vtree.NodeContext> {
    const formattingContext = getRepetitiveElementsOwnerFormattingContext(
        nodeContext.formattingContext);
    const frame: task.Frame<vtree.NodeContext> = task.newFrame('doLayout');
    const cont = column.layoutContext.nextInTree(nodeContext, false);
    selectors.processAfterIfContinues(cont, column)
        .then((resNodeContext) => {
          let nextNodeContext = resNodeContext;
          frame
              .loopWithFrame((loopFrame) => {
                while (nextNodeContext) {
                  let pending = true;
                  column.layoutNext(nextNodeContext, false)
                      .then((nodeContextParam) => {
                        nextNodeContext = nodeContextParam;
                        if (column.pageFloatLayoutContext.isInvalidated()) {
                          loopFrame.breakLoop();
                        } else if (column.pageBreakType) {
                          loopFrame.breakLoop(); // Loop end
                        } else if (nextNodeContext &&
                            column.stopByOverflow(nextNodeContext)) {
                          loopFrame.breakLoop(); // Loop end
                        } else if (nextNodeContext && nextNodeContext.after &&
                            nextNodeContext.sourceNode ==
                                formattingContext.rootSourceNode) {
                          loopFrame.breakLoop(); // Loop end
                        } else {
                          if (pending) {
                            // Sync case
                            pending = false;
                          } else {
                            // Async case
                            loopFrame.continueLoop();
                          }
                        }
                      });
                  if (pending) {
                    // Async case and loop end
                    pending = false;
                    return;
                  }
                }

                // Sync case
                loopFrame.breakLoop();
              })
              .then(() => {
                frame.finish(nextNodeContext);
              });
        });
    return frame.result();
  }

  /**
   * @override
   */
  finishBreak(column, nodeContext, forceRemoveSelf, endOfColumn) {
    return layout.BlockLayoutProcessor.prototype.finishBreak.call(
        this, column, nodeContext, forceRemoveSelf, endOfColumn);
  }

  /**
   * @override
   */
  clearOverflownViewNodes(column, parentNodeContext, nodeContext, removeSelf) {
    layout.BlockLayoutProcessor.prototype.clearOverflownViewNodes(
        column, parentNodeContext, nodeContext, removeSelf);
  }
}

function eachAncestorNodeContext(
    nodeContext: vtree.NodeContext,
    callback:
        (p1: RepetitiveElementsOwnerFormattingContext, p2: vtree.NodeContext) =>
            any) {
  for (let nc = nodeContext; nc; nc = nc.parent) {
    const formattingContext = nc.formattingContext;
    if (formattingContext &&
        formattingContext instanceof RepetitiveElementsOwnerFormattingContext &&
        !nc.belongsTo(formattingContext)) {
      callback(formattingContext, nc);
    }
  }
}

export function appendHeaderToAncestors(
    nodeContext: vtree.NodeContext, column: layout.Column) {
  if (!nodeContext) {
    return;
  }
  eachAncestorNodeContext(
      nodeContext.after ? nodeContext.parent : nodeContext,
      (formattingContext, nc) => {
        if (formattingContext instanceof
            table.TableFormattingContext) {
          return;
        }
        column.fragmentLayoutConstraints.push(
            new RepetitiveElementsOwnerLayoutConstraint(nc));
      });
}

export function appendHeader(
    formattingContext: RepetitiveElementsOwnerFormattingContext,
    nodeContext: vtree.NodeContext, column) {
  const repetitiveElements = formattingContext.getRepetitiveElements();
  if (repetitiveElements) {
    const rootNodeContext = formattingContext.getRootNodeContext(nodeContext);
    if (rootNodeContext.viewNode) {
      const firstChild = rootNodeContext.viewNode.firstChild;
      return repetitiveElements.appendHeaderToFragment(
          rootNodeContext, firstChild, column);
    }
  }
  return task.newResult(true);
}

export function appendFooter(
    formattingContext: RepetitiveElementsOwnerFormattingContext,
    nodeContext: vtree.NodeContext, column) {
  const repetitiveElements = formattingContext.getRepetitiveElements();
  if (repetitiveElements) {
    if (!repetitiveElements.isSkipFooter) {
      const rootNodeContext = formattingContext.getRootNodeContext(nodeContext);
      if (rootNodeContext.viewNode) {
        return repetitiveElements.appendFooterToFragment(
            rootNodeContext, null, column);
      }
    }
  }
  return task.newResult(true);
}

export function isFirstContentOfRepetitiveElementsOwner(
    nodeContext: vtree.NodeContext): boolean {
  if (!nodeContext || !nodeContext.parent) {
    return false;
  }
  const formattingContext =
      getRepetitiveElementsOwnerFormattingContextOrNull(nodeContext.parent);
  if (!formattingContext) {
    return false;
  }
  const repetitiveElements = formattingContext.getRepetitiveElements();
  if (!repetitiveElements) {
    return false;
  }
  return repetitiveElements.isFirstContentNode(nodeContext);
}

export const collectElementsOffset = (column:
                                          layout.Column): ElementsOffset[] => {
  const repetitiveElements: ElementsOffset[] = [];
  for (let current = column; current; current = current.pseudoParent) {
    current.fragmentLayoutConstraints.forEach((constraint) => {
      if (constraint instanceof RepetitiveElementsOwnerLayoutConstraint) {
        let repetitiveElement = constraint.getRepetitiveElements();
        repetitiveElements.push(repetitiveElement);
      }
      if (constraint instanceof
          selectors.AfterIfContinuesLayoutConstraint) {
        let repetitiveElement = constraint.getRepetitiveElements();
        repetitiveElements.push(repetitiveElement);
      }
      if (constraint instanceof table.TableRowLayoutConstraint) {
        constraint.getElementsOffsetsForTableCell(column).forEach(
            (repetitiveElement) => {
              repetitiveElements.push(repetitiveElement);
            });
      }
    });
  }
  return repetitiveElements;
};

function getRepetitiveElementsOwnerFormattingContextOrNull(
    nodeContext: vtree.NodeContext): RepetitiveElementsOwnerFormattingContext {
  const formattingContext = nodeContext.formattingContext;
  if (!formattingContext) {
    return null;
  }
  if (!(formattingContext instanceof
        RepetitiveElementsOwnerFormattingContext)) {
    return null;
  }
  return (formattingContext as RepetitiveElementsOwnerFormattingContext);
}

export function getRepetitiveElementsOwnerFormattingContext(
    formattingContext: vtree.FormattingContext):
    RepetitiveElementsOwnerFormattingContext {
  asserts.assert(
      formattingContext instanceof RepetitiveElementsOwnerFormattingContext);
  return (formattingContext as RepetitiveElementsOwnerFormattingContext);
}
const layoutProcessor = new RepetitiveElementsOwnerLayoutProcessor();
plugin.registerHook(
    plugin.HOOKS.RESOLVE_LAYOUT_PROCESSOR, (formattingContext) => {
      if (formattingContext instanceof
              RepetitiveElementsOwnerFormattingContext &&
          !(formattingContext instanceof
            table.TableFormattingContext)) {
        return layoutProcessor;
      }
      return null;
    });
