/**
 * Copyright 2013 Google, Inc.
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
 * @fileoverview Basic view tree data structures and support utilities.
 */
import * as constants from '../vivliostyle/constants';
import {Change, resolveOriginalIndex} from '../vivliostyle/diff';
import {FloatReference} from '../vivliostyle/pagefloat';
import {AfterIfContinues} from '../vivliostyle/selectors';

import * as base from './base';
import * as css from './css';
import {toShape} from './cssprop';
import {Context} from './expr';
import {Val} from './expr';
import * as geom from './geom';
import * as task from './task';
import * as taskutil from './taskutil';
import * as xmldoc from './xmldoc';

export const delayedProps = {
  'transform': true,
  'transform-origin': true
};

export const delayedPropsIfRelativePositioned = {
  'top': true,
  'bottom': true,
  'left': true,
  'right': true
};

export class DelayedItem {
  target: any;
  name: any;
  value: any;

  constructor(target: Element, name: string, value: css.Val) {
    this.target = target;
    this.name = name;
    this.value = value;
  }
}
type PageHyperlinkEvent = {
  type: string,
  target,
  currentTarget,
  anchorElement: Element,
  href: string
};

export {PageHyperlinkEvent};
type Trigger = {
  observer: string,
  event: string,
  action: string,
  ref: string
};

export {Trigger};

export const actions = {
  'show': function(obj) {
    obj.style.visibility = 'visible';
  },
  'hide': function(obj) {
    obj.style.visibility = 'hidden';
  },
  'play': function(obj) {
    obj.currentTime = 0;
    obj.play();
  },
  'pause': function(obj) {
    obj.pause();
  },
  'resume': function(obj) {
    obj.play();
  },
  'mute': function(obj) {
    obj.muted = true;
  },
  'unmute': function(obj) {
    obj.muted = false;
  }
};

export const makeListener =
    (refs: Element[], action: string): Function|null => {
      const actionFn = actions[action];
      if (actionFn) {
        return () => {
          for (let k = 0; k < refs.length; k++) {
            try {
              actionFn(refs[k]);
            } catch (err) {
            }
          }
        };
      }
      return null;
    };

export class Page extends base.SimpleEventTarget {
  private static AUTO_PAGE_WIDTH_ATTRIBUTE: string =
      'data-vivliostyle-auto-page-width';
  private static AUTO_PAGE_HEIGHT_ATTRIBUTE: string =
      'data-vivliostyle-auto-page-height';
  pageAreaElement: HTMLElement = null;
  delayedItems: DelayedItem[] = [];
  hrefHandler: any;
  elementsById: {[key: string]: Element[]} = {};
  dimensions: {width: number, height: number} = {width: 0, height: 0};
  isFirstPage: boolean = false;
  isLastPage: boolean = false;
  isAutoPageWidth: boolean = true;
  isAutoPageHeight: boolean = true;
  spineIndex: number = 0;
  position: LayoutPosition = null;
  offset: number = -1;
  side: constants.PageSide|null = null;
  fetchers: taskutil.Fetcher[] = [];
  marginBoxes: {
    top: {[key: string]: Container},
    bottom: {[key: string]: Container},
    left: {[key: string]: Container},
    right: {[key: string]: Container}
  } = {top: {}, bottom: {}, left: {}, right: {}};

  constructor(
      public readonly container: HTMLElement,
      public readonly bleedBox: HTMLElement) {
    base.SimpleEventTarget.call(this);
    const self = this;
    this.hrefHandler = (e: Event) => {
      const anchorElement = (e.currentTarget as Element);
      const href = anchorElement.getAttribute('href') ||
          anchorElement.getAttributeNS(base.NS.XLINK, 'href');
      if (href) {
        const evt = {
          type: 'hyperlink',
          target: null,
          currentTarget: null,
          anchorElement,
          href,
          preventDefault() {
            e.preventDefault();
          }
        };
        self.dispatchEvent(evt);
      }
    };
  }

  setAutoPageWidth(isAuto: boolean) {
    this.isAutoPageWidth = isAuto;
    if (isAuto) {
      this.container.setAttribute(Page.AUTO_PAGE_WIDTH_ATTRIBUTE, true);
    } else {
      this.container.removeAttribute(Page.AUTO_PAGE_WIDTH_ATTRIBUTE);
    }
  }

  setAutoPageHeight(isAuto: boolean) {
    this.isAutoPageHeight = isAuto;
    if (isAuto) {
      this.container.setAttribute(Page.AUTO_PAGE_HEIGHT_ATTRIBUTE, true);
    } else {
      this.container.removeAttribute(Page.AUTO_PAGE_HEIGHT_ATTRIBUTE);
    }
  }

  registerElementWithId(element: Element, id: string) {
    const arr = this.elementsById[id];
    if (!arr) {
      this.elementsById[id] = [element];
    } else {
      arr.push(element);
    }
  }

  finish(triggers: Trigger[], clientLayout: ClientLayout): void {
    // Remove ID of elements which eventually did not fit in the page
    // (Some nodes may have been removed after registration if they did not fit
    // in the page)
    Object.keys(this.elementsById).forEach(function(id) {
      const elems = this.elementsById[id];
      for (let i = 0; i < elems.length;) {
        if (this.container.contains(elems[i])) {
          i++;
        } else {
          elems.splice(i, 1);
        }
      }
      if (elems.length === 0) {
        delete this.elementsById[id];
      }
    }, this);
    const list = this.delayedItems;
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      base.setCSSProperty(item.target, item.name, item.value.toString());
    }

    // use size of the container of the PageMasterInstance
    const rect = clientLayout.getElementClientRect(this.container);
    this.dimensions.width = rect.width;
    this.dimensions.height = rect.height;
    for (let i = 0; i < triggers.length; i++) {
      const trigger = triggers[i];
      const refs = this.elementsById[trigger.ref];
      const observers = this.elementsById[trigger.observer];
      if (refs && observers) {
        const listener = makeListener(refs, trigger.action);
        if (listener) {
          for (let k = 0; k < observers.length; k++) {
            observers[k].addEventListener(trigger.event, listener, false);
          }
        }
      }
    }
  }

  /**
   * Zoom page.
   * @param scale Factor to which the page will be scaled.
   */
  zoom(scale: number) {
    base.setCSSProperty(this.container, 'transform', `scale(${scale})`);
  }

  /**
   * Returns the page area element.
   */
  getPageAreaElement(): HTMLElement {
    return this.pageAreaElement || this.container;
  }
}
goog.inherits(Page, base.SimpleEventTarget);
type Spread = {
  left: Page,
  right: Page
};

export {Spread};

/**
 * Marks an element as "special". It should not be used in bbox calculations.
 */
export const SPECIAL_ATTR = 'data-adapt-spec';

/**
 * Handling of purely whitespace sequences between blocks
 * @enum {number}
 */
export enum Whitespace {
  IGNORE,

  // Whitespace sequence between blocks is ignored
  NEWLINE,

  // Whitespace sequence between blocks is ignored unless it containes newline
  PRESERVE
}

// Whitespace sequence between blocks is preserved

/**
 * Resolves adapt.vtree.Whitespace value from a value of 'white-space' property
 * @param whitespace The value of 'white-space' property
 */
export const whitespaceFromPropertyValue =
    (whitespace: string): Whitespace|null => {
      switch (whitespace) {
        case 'normal':
        case 'nowrap':
          return Whitespace.IGNORE;
        case 'pre-line':
          return Whitespace.NEWLINE;
        case 'pre':
        case 'pre-wrap':
          return Whitespace.PRESERVE;
        default:
          return null;
      }
    };

export const canIgnore = (node: Node, whitespace: Whitespace): boolean => {
  if (node.nodeType == 1) {
    return false;
  }
  const text = node.textContent;
  switch (whitespace) {
    case Whitespace.IGNORE:
      return !!text.match(/^\s*$/);
    case Whitespace.NEWLINE:
      return !!text.match(/^[ \t\f]*$/);
    case Whitespace.PRESERVE:
      return text.length == 0;
  }
  throw new Error(`Unexpected whitespace: ${whitespace}`);
};

export class Flow {
  forcedBreakOffsets: any = ([] as number[]);
  formattingContext: FormattingContext|null = null;

  constructor(
      public readonly flowName: string,
      public readonly parentFlowName: string|null) {}
}

export class FlowChunk {
  startPage: number = -1;

  constructor(
      public flowName: string, public element: Element,
      public startOffset: number, public priority: number,
      public linger: number, public exclusive: boolean,
      public repeated: boolean, public last: boolean,
      public breakBefore: string|null) {}

  isBetter(other: FlowChunk): boolean {
    if (!this.exclusive) {
      return false;
    }
    if (!other.exclusive) {
      return true;
    }
    if (this.priority > other.priority) {
      return true;
    }
    return this.last;
  }
}
type ClientRect = {
  left: number,
  top: number,
  right: number,
  bottom: number,
  width: number,
  height: number
};

export {ClientRect};

export const clientrectIncreasingTop =
    (r1: ClientRect, r2: ClientRect): number => r1.top - r2.top;

export const clientrectDecreasingRight =
    (r1: ClientRect, r2: ClientRect): number => r2.right - r1.right;

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

export const eachAncestorFormattingContext =
    (nodeContext: NodeContext, callback: (p1: FormattingContext) => any) => {
      if (!nodeContext) {
        return;
      }
      for (let fc = nodeContext.formattingContext; fc; fc = fc.getParent()) {
        callback(fc);
      }
    };
type NodePositionStep = {
  node: Node,
  shadowType: ShadowType,
  shadowContext: ShadowContext,
  nodeShadow: ShadowContext,
  shadowSibling: NodePositionStep,
  formattingContext: FormattingContext,
  fragmentIndex: number
};

export {NodePositionStep};

export const isSameNodePositionStep =
    (nps1: NodePositionStep, nps2: NodePositionStep): boolean => {
      if (nps1 === nps2) {
        return true;
      }
      if (!nps1 || !nps2) {
        return false;
      }
      return nps1.node === nps2.node && nps1.shadowType === nps2.shadowType &&
          isSameShadowContext(nps1.shadowContext, nps2.shadowContext) &&
          isSameShadowContext(nps1.nodeShadow, nps2.nodeShadow) &&
          isSameNodePositionStep(nps1.shadowSibling, nps2.shadowSibling);
    };
type NodePosition = {
  steps: NodePositionStep[],
  offsetInNode: number,
  after: boolean,
  preprocessedTextContent: Change[]|null
};

export {NodePosition};

export const isSameNodePosition =
    (np1: NodePosition|null, np2: NodePosition|null): boolean => {
      if (np1 === np2) {
        return true;
      }
      if (!np1 || !np2) {
        return false;
      }
      if (np1.offsetInNode !== np2.offsetInNode || np1.after !== np2.after ||
          np1.steps.length !== np2.steps.length) {
        return false;
      }
      for (let i = 0; i < np1.steps.length; i++) {
        if (!isSameNodePositionStep(np1.steps[i], np2.steps[i])) {
          return false;
        }
      }
      return true;
    };

export const newNodePositionFromNode = (node: Node): NodePosition => {
  const step = {
    node,
    shadowType: ShadowType.NONE,
    shadowContext: null,
    nodeShadow: null,
    shadowSibling: null,
    fragmentIndex: 0
  };
  return {
    steps: [step],
    offsetInNode: 0,
    after: false,
    preprocessedTextContent: null
  };
};

export const newNodePositionFromNodeContext =
    (nodeContext: NodeContext,
     initialFragmentIndex: number|null): NodePosition => {
      const step = {
        node: nodeContext.sourceNode,
        shadowType: ShadowType.NONE,
        shadowContext: nodeContext.shadowContext,
        nodeShadow: null,
        shadowSibling: null,
        fragmentIndex: initialFragmentIndex != null ? initialFragmentIndex :
                                                      nodeContext.fragmentIndex
      };
      return {
        steps: [step],
        offsetInNode: 0,
        after: false,
        preprocessedTextContent: nodeContext.preprocessedTextContent
      };
    };

export const makeNodeContextFromNodePositionStep =
    (step: NodePositionStep, parent: NodeContext): NodeContext => {
      const nodeContext = new NodeContext(step.node, parent, 0);
      nodeContext.shadowType = step.shadowType;
      nodeContext.shadowContext = step.shadowContext;
      nodeContext.nodeShadow = step.nodeShadow;
      nodeContext.shadowSibling = step.shadowSibling ?
          makeNodeContextFromNodePositionStep(
              step.shadowSibling, parent.copy()) :
          null;
      nodeContext.formattingContext = step.formattingContext;
      nodeContext.fragmentIndex = step.fragmentIndex + 1;
      return nodeContext;
    };

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
export class ShadowContext {
  subShadow: ShadowContext = null;

  constructor(
      public readonly owner: Element, public readonly root: Element,
      public readonly xmldoc: xmldoc.XMLDocHolder,
      public readonly parentShadow: ShadowContext, superShadow: ShadowContext,
      public readonly type: ShadowType, public readonly styler: Object) {
    if (superShadow) {
      superShadow.subShadow = this;
    }
  }

  equals(other: ShadowContext): boolean {
    if (!other) {
      return false;
    }
    return this.owner === other.owner && this.xmldoc === other.xmldoc &&
        this.type === other.type &&
        isSameShadowContext(this.parentShadow, other.parentShadow);
  }
}

export const isSameShadowContext =
    (sc1: ShadowContext, sc2: ShadowContext): boolean =>
        sc1 === sc2 || !!sc1 && !!sc2 && sc1.equals(sc2);

/**
 * Information about :first-letter or :first-line pseudoelements
 * @param count 0 - first-letter, 1 or more - first line(s)
 */
export class FirstPseudo {
  constructor(
      public readonly outer: FirstPseudo, public readonly count: number) {}
}

/**
 * NodeContext represents a position in the document + layout-related
 * information attached to it. When after=false and offsetInNode=0, the
 * position is inside the element (node), but just before its first child.
 * When offsetInNode>0 it represents offset in the textual content of the
 * node. When after=true it represents position right after the last child
 * of the node. boxOffset is incremented by 1 for any valid node position.
 */
export class NodeContext {
  // position itself
  offsetInNode: number = 0;
  after: boolean = false;
  shadowType: ShadowType;

  // parent's shadow type
  shadowContext: ShadowContext;
  nodeShadow: ShadowContext = null;
  shadowSibling: NodeContext = null;

  // next "sibling" in the shadow tree
  // other stuff
  shared: boolean = false;
  inline: boolean = true;
  overflow: boolean = false;
  breakPenalty: number;
  display: string|null = null;
  floatReference: FloatReference;
  floatSide: string|null = null;
  clearSide: string|null = null;
  floatMinWrapBlock: css.Numeric|null = null;
  columnSpan: css.Val|null = null;
  verticalAlign: string = 'baseline';
  captionSide: string = 'top';
  inlineBorderSpacing: number = 0;
  blockBorderSpacing: number = 0;
  flexContainer: boolean = false;
  whitespace: Whitespace;
  hyphenateCharacter: string|null;
  breakWord: boolean;
  establishesBFC: boolean = false;
  containingBlockForAbsolute: boolean = false;
  breakBefore: string|null = null;
  breakAfter: string|null = null;
  viewNode: Node = null;
  clearSpacer: Node = null;
  inheritedProps: {[key: string]: number|string|css.Val};
  vertical: boolean;
  direction: string;
  firstPseudo: FirstPseudo;
  lang: string|null = null;
  preprocessedTextContent: Change[]|null = null;
  formattingContext: FormattingContext;
  repeatOnBreak: string|null = null;
  pluginProps: {[key: string]: string|number|undefined|null|
                (number|null)[]} = {};
  fragmentIndex: number = 1;
  afterIfContinues: AfterIfContinues = null;
  footnotePolicy: css.Ident|null = null;

  constructor(
      public sourceNode: Node, public parent: NodeContext,
      public boxOffset: number) {
    this.shadowType = ShadowType.NONE;
    this.shadowContext = parent ? parent.shadowContext : null;
    this.breakPenalty = parent ? parent.breakPenalty : 0;
    this.floatReference = FloatReference.INLINE;
    this.whitespace = parent ? parent.whitespace : Whitespace.IGNORE;
    this.hyphenateCharacter = parent ? parent.hyphenateCharacter : null;
    this.breakWord = parent ? parent.breakWord : false;
    this.inheritedProps = parent ? parent.inheritedProps : {};
    this.vertical = parent ? parent.vertical : false;
    this.direction = parent ? parent.direction : 'ltr';
    this.firstPseudo = parent ? parent.firstPseudo : null;
    this.formattingContext = parent ? parent.formattingContext : null;
  }

  resetView(): void {
    this.inline = true;
    this.breakPenalty = this.parent ? this.parent.breakPenalty : 0;
    this.viewNode = null;
    this.clearSpacer = null;
    this.offsetInNode = 0;
    this.after = false;
    this.display = null;
    this.floatReference = FloatReference.INLINE;
    this.floatSide = null;
    this.clearSide = null;
    this.floatMinWrapBlock = null;
    this.columnSpan = null;
    this.verticalAlign = 'baseline';
    this.flexContainer = false;
    this.whitespace = this.parent ? this.parent.whitespace : Whitespace.IGNORE;
    this.hyphenateCharacter =
        this.parent ? this.parent.hyphenateCharacter : null;
    this.breakWord = this.parent ? this.parent.breakWord : false;
    this.breakBefore = null;
    this.breakAfter = null;
    this.nodeShadow = null;
    this.establishesBFC = false;
    this.containingBlockForAbsolute = false;
    this.vertical = this.parent ? this.parent.vertical : false;
    this.nodeShadow = null;
    this.preprocessedTextContent = null;
    this.formattingContext = this.parent ? this.parent.formattingContext : null;
    this.repeatOnBreak = null;
    this.pluginProps = {};
    this.fragmentIndex = 1;
    this.afterIfContinues = null;
    this.footnotePolicy = null;
  }

  private cloneItem(): NodeContext {
    const np = new NodeContext(this.sourceNode, this.parent, this.boxOffset);
    np.offsetInNode = this.offsetInNode;
    np.after = this.after;
    np.nodeShadow = this.nodeShadow;
    np.shadowType = this.shadowType;
    np.shadowContext = this.shadowContext;
    np.shadowSibling = this.shadowSibling;
    np.inline = this.inline;
    np.breakPenalty = this.breakPenalty;
    np.display = this.display;
    np.floatReference = this.floatReference;
    np.floatSide = this.floatSide;
    np.clearSide = this.clearSide;
    np.floatMinWrapBlock = this.floatMinWrapBlock;
    np.columnSpan = this.columnSpan;
    np.verticalAlign = this.verticalAlign;
    np.captionSide = this.captionSide;
    np.inlineBorderSpacing = this.inlineBorderSpacing;
    np.blockBorderSpacing = this.blockBorderSpacing;
    np.establishesBFC = this.establishesBFC;
    np.containingBlockForAbsolute = this.containingBlockForAbsolute;
    np.flexContainer = this.flexContainer;
    np.whitespace = this.whitespace;
    np.hyphenateCharacter = this.hyphenateCharacter;
    np.breakWord = this.breakWord;
    np.breakBefore = this.breakBefore;
    np.breakAfter = this.breakAfter;
    np.viewNode = this.viewNode;
    np.clearSpacer = this.clearSpacer;
    np.firstPseudo = this.firstPseudo;
    np.vertical = this.vertical;
    np.overflow = this.overflow;
    np.preprocessedTextContent = this.preprocessedTextContent;
    np.formattingContext = this.formattingContext;
    np.repeatOnBreak = this.repeatOnBreak;
    np.pluginProps = Object.create(this.pluginProps);
    np.fragmentIndex = this.fragmentIndex;
    np.afterIfContinues = this.afterIfContinues;
    np.footnotePolicy = this.footnotePolicy;
    return np;
  }

  modify(): NodeContext {
    if (!this.shared) {
      return this;
    }
    return this.cloneItem();
  }

  copy(): NodeContext {
    let np = this;
    do {
      if (np.shared) {
        break;
      }
      np.shared = true;
      np = np.parent;
    } while (np);
    return this;
  }

  clone(): NodeContext {
    const np = this.cloneItem();
    let npc = np;
    let npp;
    while ((npp = npc.parent) != null) {
      npp = npp.cloneItem();
      npc.parent = npp;
      npc = npp;
    }
    return np;
  }

  toNodePositionStep(): NodePositionStep {
    return {
      node: this.sourceNode,
      shadowType: this.shadowType,
      shadowContext: this.shadowContext,
      nodeShadow: this.nodeShadow,
      shadowSibling:
          this.shadowSibling ? this.shadowSibling.toNodePositionStep() : null,
      formattingContext: this.formattingContext,
      fragmentIndex: this.fragmentIndex
    };
  }

  toNodePosition(): NodePosition {
    let nc = this;
    const steps = [];
    do {
      // We need fully "peeled" path, so don't record first-XXX pseudoelement
      // containers
      if (!nc.firstPseudo || !nc.parent ||
          nc.parent.firstPseudo === nc.firstPseudo) {
        steps.push(nc.toNodePositionStep());
      }
      nc = nc.parent;
    } while (nc);
    const actualOffsetInNode = this.preprocessedTextContent ?
        resolveOriginalIndex(
            this.preprocessedTextContent, this.offsetInNode) :
        this.offsetInNode;
    return {
      steps,
      offsetInNode: actualOffsetInNode,
      after: this.after,
      preprocessedTextContent: this.preprocessedTextContent
    };
  }

  isInsideBFC(): boolean {
    let parent = this.parent;
    while (parent) {
      if (parent.establishesBFC) {
        return true;
      }
      parent = parent.parent;
    }
    return false;
  }

  getContainingBlockForAbsolute(): NodeContext {
    let parent = this.parent;
    while (parent) {
      if (parent.containingBlockForAbsolute) {
        return parent;
      }
      parent = parent.parent;
    }
    return null;
  }

  /**
   * Walk up NodeContext tree (starting from itself) and call the callback for
   * each block.
   */
  walkUpBlocks(callback: (p1: NodeContext) => any) {
    let nodeContext = this;
    while (nodeContext) {
      if (!nodeContext.inline) {
        callback(nodeContext);
      }
      nodeContext = nodeContext.parent;
    }
  }

  belongsTo(formattingContext: FormattingContext): boolean {
    return this.formattingContext === formattingContext && !!this.parent &&
        this.parent.formattingContext === formattingContext;
  }
}

export class ChunkPosition {
  floats: NodePosition[] = null;

  constructor(public primary: NodePosition) {}

  clone(): ChunkPosition {
    const result = new ChunkPosition(this.primary);
    if (this.floats) {
      result.floats = [];
      for (let i = 0; i < this.floats.length; ++i) {
        result.floats[i] = this.floats[i];
      }
    }
    return result;
  }

  isSamePosition(other: ChunkPosition): boolean {
    if (!other) {
      return false;
    }
    if (this === other) {
      return true;
    }
    if (!isSameNodePosition(this.primary, other.primary)) {
      return false;
    }
    if (this.floats) {
      if (!other.floats || this.floats.length !== other.floats.length) {
        return false;
      }
      for (let i = 0; i < this.floats.length; i++) {
        if (!isSameNodePosition(this.floats[i], other.floats[i])) {
          return false;
        }
      }
    } else {
      if (other.floats) {
        return false;
      }
    }
    return true;
  }
}

export class FlowChunkPosition {
  constructor(
      public chunkPosition: ChunkPosition,
      public readonly flowChunk: FlowChunk) {}

  clone(): FlowChunkPosition {
    return new FlowChunkPosition(this.chunkPosition.clone(), this.flowChunk);
  }

  isSamePosition(other: FlowChunkPosition): boolean {
    return !!other &&
        (this === other ||
         this.chunkPosition.isSamePosition(other.chunkPosition));
  }
}

export class FlowPosition {
  positions: FlowChunkPosition[] = [];
  startSide: string = 'any';
  breakAfter: string|null = null;

  clone(): FlowPosition {
    const newfp = new FlowPosition();
    const arr = this.positions;
    const newarr = newfp.positions;
    for (let i = 0; i < arr.length; i++) {
      newarr[i] = arr[i].clone();
    }
    newfp.startSide = this.startSide;
    newfp.breakAfter = this.breakAfter;
    return newfp;
  }

  isSamePosition(other: FlowPosition): boolean {
    if (this === other) {
      return true;
    }
    if (!other || this.positions.length !== other.positions.length) {
      return false;
    }
    for (let i = 0; i < this.positions.length; i++) {
      if (!this.positions[i].isSamePosition(other.positions[i])) {
        return false;
      }
    }
    return true;
  }

  hasContent(offset: number): boolean {
    return this.positions.length > 0 &&
        this.positions[0].flowChunk.startOffset <= offset;
  }
}

export class LayoutPosition {
  /**
   * One-based, incremented before layout.
   */
  page: number = 0;
  flows: {[key: string]: Flow} = {};
  flowPositions: {[key: string]: FlowPosition} = {};

  /**
   * flowPositions is built up to this offset.
   */
  highestSeenOffset: number = 0;

  clone(): LayoutPosition {
    const newcp = new LayoutPosition();
    newcp.page = this.page;
    newcp.highestSeenNode = this.highestSeenNode;
    newcp.highestSeenOffset = this.highestSeenOffset;
    newcp.lookupPositionOffset = this.lookupPositionOffset;
    newcp.flows = this.flows;
    for (const name in this.flowPositions) {
      newcp.flowPositions[name] = this.flowPositions[name].clone();
    }
    return newcp;
  }

  isSamePosition(other: LayoutPosition): boolean {
    if (this === other) {
      return true;
    }
    if (!other || this.page !== other.page ||
        this.highestSeenOffset !== other.highestSeenOffset) {
      return false;
    }
    const thisFlowNames = Object.keys(this.flowPositions);
    const otherFlowNames = Object.keys(other.flowPositions);
    if (thisFlowNames.length !== otherFlowNames.length) {
      return false;
    }
    for (const flowName of thisFlowNames) {
      if (!this.flowPositions[flowName].isSamePosition(
              other.flowPositions[flowName])) {
        return false;
      }
    }
    return true;
  }

  /**
   * @param name flow name.
   */
  hasContent(name: string, offset: number): boolean {
    const flowPos = this.flowPositions[name];
    if (!flowPos) {
      return false;
    }
    return flowPos.hasContent(offset);
  }

  startSideOfFlow(name: string): string {
    const flowPos = this.flowPositions[name];
    if (!flowPos) {
      return 'any';
    }
    return flowPos.startSide;
  }

  firstFlowChunkOfFlow(name: string): FlowChunk|null {
    const flowPos = this.flowPositions[name];
    if (!flowPos) {
      return null;
    }
    const flowChunkPosition = flowPos.positions[0];
    if (!flowChunkPosition) {
      return null;
    }
    return flowChunkPosition.flowChunk;
  }
}

export class Container {
  left: number = 0;
  top: number = 0;
  marginLeft: number = 0;
  marginRight: number = 0;
  marginTop: number = 0;
  marginBottom: number = 0;
  borderLeft: number = 0;
  borderRight: number = 0;
  borderTop: number = 0;
  borderBottom: number = 0;
  paddingLeft: number = 0;
  paddingRight: number = 0;
  paddingTop: number = 0;
  paddingBottom: number = 0;
  width: number = 0;
  height: number = 0;
  originX: number = 0;
  originY: number = 0;
  exclusions: geom.Shape[] = null;
  innerShape: geom.Shape = null;
  computedBlockSize: number = 0;
  snapWidth: number = 0;
  snapHeight: number = 0;
  snapOffsetX: number = 0;
  snapOffsetY: number = 0;
  vertical: boolean = false;
  element: any;

  constructor(public element: Element) {}

  getInsetTop() {
    return this.marginTop + this.borderTop + this.paddingTop;
  }

  getInsetBottom() {
    return this.marginBottom + this.borderBottom + this.paddingBottom;
  }

  getInsetLeft() {
    return this.marginLeft + this.borderLeft + this.paddingLeft;
  }

  getInsetRight() {
    return this.marginRight + this.borderRight + this.paddingRight;
  }

  getInsetBefore() {
    if (this.vertical) {
      return this.getInsetRight();
    } else {
      return this.getInsetTop();
    }
  }

  getInsetAfter() {
    if (this.vertical) {
      return this.getInsetLeft();
    } else {
      return this.getInsetBottom();
    }
  }

  getInsetStart() {
    if (this.vertical) {
      return this.getInsetTop();
    } else {
      return this.getInsetLeft();
    }
  }

  getInsetEnd() {
    if (this.vertical) {
      return this.getInsetBottom();
    } else {
      return this.getInsetRight();
    }
  }

  getBeforeEdge(box: ClientRect): number {
    return this.vertical ? box.right : box.top;
  }

  getAfterEdge(box: ClientRect): number {
    return this.vertical ? box.left : box.bottom;
  }

  getStartEdge(box: ClientRect): number {
    return this.vertical ? box.top : box.left;
  }

  getEndEdge(box: ClientRect): number {
    return this.vertical ? box.bottom : box.right;
  }

  getInlineSize(box: ClientRect): number {
    return this.vertical ? box.bottom - box.top : box.right - box.left;
  }

  getBoxSize(box: ClientRect): number {
    return this.vertical ? box.right - box.left : box.bottom - box.top;
  }

  getBoxDir(): number {
    return this.vertical ? -1 : 1;
  }

  getInlineDir(): number 1

  copyFrom(other: Container): void {
    this.element = other.element;
    this.left = other.left;
    this.top = other.top;
    this.marginLeft = other.marginLeft;
    this.marginRight = other.marginRight;
    this.marginTop = other.marginTop;
    this.marginBottom = other.marginBottom;
    this.borderLeft = other.borderLeft;
    this.borderRight = other.borderRight;
    this.borderTop = other.borderTop;
    this.borderBottom = other.borderBottom;
    this.paddingLeft = other.paddingLeft;
    this.paddingRight = other.paddingRight;
    this.paddingTop = other.paddingTop;
    this.paddingBottom = other.paddingBottom;
    this.width = other.width;
    this.height = other.height;
    this.originX = other.originX;
    this.originY = other.originY;
    this.innerShape = other.innerShape;
    this.exclusions = other.exclusions;
    this.computedBlockSize = other.computedBlockSize;
    this.snapWidth = other.snapWidth;
    this.snapHeight = other.snapHeight;
    this.vertical = other.vertical;
  }

  setVerticalPosition(top: number, height: number): void {
    this.top = top;
    this.height = height;
    base.setCSSProperty(this.element, 'top', `${top}px`);
    base.setCSSProperty(this.element, 'height', `${height}px`);
  }

  setHorizontalPosition(left: number, width: number): void {
    this.left = left;
    this.width = width;
    base.setCSSProperty(this.element, 'left', `${left}px`);
    base.setCSSProperty(this.element, 'width', `${width}px`);
  }

  setBlockPosition(start: number, extent: number): void {
    if (this.vertical) {
      this.setHorizontalPosition(start + extent * this.getBoxDir(), extent);
    } else {
      this.setVerticalPosition(start, extent);
    }
  }

  setInlinePosition(start: number, extent: number): void {
    if (this.vertical) {
      this.setVerticalPosition(start, extent);
    } else {
      this.setHorizontalPosition(start, extent);
    }
  }

  clear() {
    const parent = this.element;
    let c;
    while (c = parent.lastChild) {
      parent.removeChild(c);
    }
  }

  getInnerShape(): geom.Shape {
    const rect = this.getInnerRect();
    if (this.innerShape) {
      return this.innerShape.withOffset(rect.x1, rect.y1);
    }
    return geom.shapeForRect(rect.x1, rect.y1, rect.x2, rect.y2);
  }

  getInnerRect(): geom.Rect {
    const offsetX = this.originX + this.left + this.getInsetLeft();
    const offsetY = this.originY + this.top + this.getInsetTop();
    return new geom.Rect(
        offsetX, offsetY, offsetX + this.width, offsetY + this.height);
  }

  getPaddingRect(): geom.Rect {
    const paddingX =
        this.originX + this.left + this.marginLeft + this.borderLeft;
    const paddingY = this.originY + this.top + this.marginTop + this.borderTop;
    const paddingWidth = this.paddingLeft + this.width + this.paddingRight;
    const paddingHeight = this.paddingTop + this.height + this.paddingBottom;
    return new geom.Rect(
        paddingX, paddingY, paddingX + paddingWidth, paddingY + paddingHeight);
  }

  getOuterShape(outerShapeProp: css.Val, context: Context): geom.Shape {
    const rect = this.getOuterRect();
    return toShape(
        outerShapeProp, rect.x1, rect.y1, rect.x2 - rect.x1, rect.y2 - rect.y1,
        context);
  }

  getOuterRect(): geom.Rect {
    const outerX = this.originX + this.left;
    const outerY = this.originY + this.top;
    const outerWidth = this.getInsetLeft() + this.width + this.getInsetRight();
    const outerHeight =
        this.getInsetTop() + this.height + this.getInsetBottom();
    return new geom.Rect(
        outerX, outerY, outerX + outerWidth, outerY + outerHeight);
  }
}

// vertical writing
type ExprContentListener = (p1: Val, p2: string, p3: Document) => Node|null;

export {ExprContentListener};

export class ContentPropertyHandler extends css.Visitor {
  constructor(
      public readonly elem: Element, public readonly context: Context,
      public readonly rootContentValue: css.Val,
      public readonly exprContentListener: ExprContentListener) {
    css.Visitor.call(this);
  }

  private visitStrInner(str: string, node?: Node|null) {
    if (!node) {
      node = this.elem.ownerDocument.createTextNode(str);
    }
    this.elem.appendChild(node);
  }

  /** @override */
  visitStr(str) {
    this.visitStrInner(str.str);
    return null;
  }

  /** @override */
  visitURL(url) {
    if (this.rootContentValue.url) {
      this.elem.setAttribute('src', url.url);
    } else {
      const img = this.elem.ownerDocument.createElementNS(base.NS.XHTML, 'img');
      img.setAttribute('src', url.url);
      this.elem.appendChild(img);
    }
    return null;
  }

  /** @override */
  visitSpaceList(list) {
    this.visitValues(list.values);
    return null;
  }

  /** @override */
  visitExpr(expr) {
    const ex = expr.toExpr();
    const val = ex.evaluate(this.context);
    if (typeof val === 'string') {
      goog.asserts.assert(this.elem.ownerDocument);
      const node = this.exprContentListener(ex, val, this.elem.ownerDocument);
      this.visitStrInner(val, node);
    }
    return null;
  }
}
goog.inherits(ContentPropertyHandler, css.Visitor);

export const nonTrivialContent = (val: css.Val): boolean => val != null &&
    val !== css.ident.normal && val !== css.ident.none &&
    val !== css.ident.inherit;
