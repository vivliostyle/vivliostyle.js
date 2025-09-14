/**
 * Copyright 2013 Google, Inc.
 * Copyright 2015 Daishinsha Inc.
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
 * @fileoverview Vtree - Basic view tree data structures and support utilities.
 */
import * as Base from "./base";
import * as Break from "./break";
import * as Constants from "./constants";
import * as Css from "./css";
import * as CssParser from "./css-parser";
import * as CssProp from "./css-prop";
import * as CssTokenizer from "./css-tokenizer";
import * as Diff from "./diff";
import * as Exprs from "./exprs";
import * as GeometryUtil from "./geometry-util";
import * as TaskUtil from "./task-util";
import { assert } from "./asserts";
import {
  CssStyler,
  PageFloats,
  PseudoElement,
  Selectors,
  Vtree,
  XmlDoc,
} from "./types";

export const delayedProps = {
  transform: true,
  "transform-origin": true,
};

export const delayedPropsIfRelativePositioned = {
  top: true,
  bottom: true,
  left: true,
  right: true,
};

export class DelayedItem {
  constructor(
    public target: Element,
    public name: string,
    public value: Css.Val,
  ) {}
}

export type PageHyperlinkEvent = {
  type: string;
  target;
  currentTarget;
  anchorElement: Element;
  href: string;
};

export type Trigger = {
  observer: string;
  event: string;
  action: string;
  ref: string;
};

export const actions = {
  show: function (obj) {
    obj.style.visibility = "visible";
  },
  hide: function (obj) {
    obj.style.visibility = "hidden";
  },
  play: function (obj) {
    obj.currentTime = 0;
    obj.play();
  },
  pause: function (obj) {
    obj.pause();
  },
  resume: function (obj) {
    obj.play();
  },
  mute: function (obj) {
    obj.muted = true;
  },
  unmute: function (obj) {
    obj.muted = false;
  },
};

export function makeListener(
  refs: Element[],
  action: string,
): EventListener | null {
  const actionFn = actions[action];
  if (actionFn) {
    return () => {
      for (let k = 0; k < refs.length; k++) {
        try {
          actionFn(refs[k]);
        } catch (err) {}
      }
    };
  }
  return null;
}

export class Page extends Base.SimpleEventTarget {
  private static AUTO_PAGE_WIDTH_ATTRIBUTE: string =
    "data-vivliostyle-auto-page-width";
  private static AUTO_PAGE_HEIGHT_ATTRIBUTE: string =
    "data-vivliostyle-auto-page-height";
  pageAreaElement: HTMLElement | null = null;
  delayedItems: DelayedItem[] = [];
  hrefHandler: (e: Event) => void;
  elementsById: { [key: string]: Element[] } = {};
  dimensions: { width: number; height: number } = { width: 0, height: 0 };
  isFirstPage: boolean = false;
  isLastPage: boolean = false;
  isBlankPage: boolean = false;
  isAutoPageWidth: boolean = true;
  isAutoPageHeight: boolean = true;
  spineIndex: number = 0;
  position: LayoutPosition = null;
  offset: number = -1;
  side: Constants.PageSide | null = null;
  fetchers: TaskUtil.Fetcher<{}>[] = [];
  marginBoxes: {
    top: { [key: string]: Container };
    bottom: { [key: string]: Container };
    left: { [key: string]: Container };
    right: { [key: string]: Container };
  } = { top: {}, bottom: {}, left: {}, right: {} };
  pageType: string | null = null;

  constructor(
    public readonly container: HTMLElement,
    public readonly bleedBox: HTMLElement,
  ) {
    super();
    this.hrefHandler = (e: Event) => {
      const anchorElement = e.currentTarget as Element;
      const href =
        anchorElement.getAttribute("href") ||
        anchorElement.getAttributeNS(Base.NS.XLINK, "href");
      if (href) {
        const evt = {
          type: "hyperlink",
          target: null,
          currentTarget: null,
          anchorElement,
          href,
          preventDefault() {
            e.preventDefault();
          },
        };
        this.dispatchEvent(evt);
      }
    };
  }

  setAutoPageWidth(isAuto: boolean) {
    this.isAutoPageWidth = isAuto;
    if (isAuto) {
      this.container.setAttribute(Page.AUTO_PAGE_WIDTH_ATTRIBUTE, "true");
    } else {
      this.container.removeAttribute(Page.AUTO_PAGE_WIDTH_ATTRIBUTE);
    }
  }

  setAutoPageHeight(isAuto: boolean) {
    this.isAutoPageHeight = isAuto;
    if (isAuto) {
      this.container.setAttribute(Page.AUTO_PAGE_HEIGHT_ATTRIBUTE, "true");
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
    Object.keys(this.elementsById).forEach((id) => {
      const elems = this.elementsById[id];
      for (let i = 0; i < elems.length; ) {
        if (this.container.contains(elems[i])) {
          i++;
        } else {
          elems.splice(i, 1);
        }
      }
      if (elems.length === 0) {
        delete this.elementsById[id];
      }
    });
    const list = this.delayedItems;
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      if (
        item.target === this.container &&
        item.name === "transform" &&
        !this.isAutoPageWidth &&
        !this.isAutoPageHeight
      ) {
        // When fixed page size is specified, cancel the transform property
        // set at OPFView.makePage() for the specified viewport size
        // (e.g. `<meta name="viewport" content="width=1307, height=1920"/>`)
        // to avoid wrong page resizing.
        continue;
      }
      Base.setCSSProperty(item.target, item.name, item.value.toString());
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
}

export type Spread = {
  left: Page;
  right: Page;
};

/**
 * Marks an element as "special". It should not be used in bbox calculations.
 */
export const SPECIAL_ATTR = "data-adapt-spec";

export const Whitespace = Vtree.Whitespace;
export type Whitespace = Vtree.Whitespace; // eslint-disable-line no-redeclare

/**
 * Resolves Whitespace value from a value of 'white-space' property
 * @param whitespace The value of 'white-space' property
 */
export function whitespaceFromPropertyValue(
  whitespace: string,
): Whitespace | null {
  switch (whitespace) {
    case "normal":
    case "nowrap":
      return Whitespace.IGNORE;
    case "pre-line":
      return Whitespace.NEWLINE;
    case "pre":
    case "pre-wrap":
    case "break-spaces":
      return Whitespace.PRESERVE;
    default:
      return null;
  }
}

export function canIgnore(node: Node, whitespace?: Whitespace): boolean {
  if (!node) {
    return true;
  }
  if (node.nodeType == 1) {
    return false;
  }
  const text = node.textContent;
  switch (whitespace) {
    case Whitespace.PRESERVE:
      return text.length == 0;
    case Whitespace.NEWLINE:
      return !!text.match(/^[ \t]*$/);
    case Whitespace.IGNORE:
    default:
      return !!text.match(/^[ \t\r\n\f]*$/);
  }
}

export class Flow {
  forcedBreakOffsets = [] as number[];
  formattingContext: FormattingContext | null = null;

  constructor(
    public readonly flowName: string,
    public readonly parentFlowName: string | null,
  ) {}
}

export class FlowChunk {
  startPage: number = -1;

  constructor(
    public flowName: string,
    public element: Element,
    public startOffset: number,
    public priority: number,
    public linger: number,
    public exclusive: boolean,
    public repeated: boolean,
    public last: boolean,
    public breakBefore: string | null,
  ) {}

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

export type ClientRect = Vtree.ClientRect;

export function clientrectIncreasingTop(
  r1: ClientRect,
  r2: ClientRect,
): number {
  return r1.top - r2.top;
}

export function clientrectDecreasingRight(
  r1: ClientRect,
  r2: ClientRect,
): number {
  return r2.right - r1.right;
}

/**
 * Interface to read the position assigned to the elements and ranges by the
 * browser.
 */
export type ClientLayout = Vtree.ClientLayout;

/**
 * Styling, creating a single node's view, etc.
 */
export type LayoutContext = Vtree.LayoutContext;

/**
 * Formatting context.
 */
export type FormattingContext = Vtree.FormattingContext;

export function eachAncestorFormattingContext(
  nodeContext: NodeContext,
  callback: (p1: FormattingContext) => any,
): void {
  if (!nodeContext) {
    return;
  }
  for (let fc = nodeContext.formattingContext; fc; fc = fc.getParent()) {
    callback(fc);
  }
}

export type NodePositionStep = Vtree.NodePositionStep;

export function isSameNodePositionStep(
  nps1: NodePositionStep,
  nps2: NodePositionStep,
): boolean {
  if (nps1 === nps2) {
    return true;
  }
  if (!nps1 || !nps2) {
    return false;
  }
  return (
    (nps1.node === nps2.node ||
      // Fix for issue #869
      (!!nps1.shadowContext &&
        !!nps2.shadowContext &&
        nps1.shadowType === Vtree.ShadowType.ROOTLESS &&
        nps2.shadowType === Vtree.ShadowType.ROOTLESS &&
        (nps1.node as Element)?.outerHTML ===
          (nps2.node as Element)?.outerHTML)) &&
    nps1.shadowType === nps2.shadowType &&
    isSameShadowContext(nps1.shadowContext, nps2.shadowContext) &&
    isSameShadowContext(nps1.nodeShadow, nps2.nodeShadow) &&
    isSameNodePositionStep(nps1.shadowSibling, nps2.shadowSibling)
  );
}

export type NodePosition = Vtree.NodePosition;

export function isSameNodePosition(
  np1: NodePosition | null,
  np2: NodePosition | null,
): boolean {
  if (np1 === np2) {
    return true;
  }
  if (!np1 || !np2) {
    return false;
  }
  if (
    np1.offsetInNode !== np2.offsetInNode ||
    np1.after !== np2.after ||
    np1.steps.length !== np2.steps.length
  ) {
    return false;
  }
  for (let i = 0; i < np1.steps.length; i++) {
    if (!isSameNodePositionStep(np1.steps[i], np2.steps[i])) {
      return false;
    }
  }
  return true;
}

export function newNodePositionFromNode(node: Node): NodePosition {
  const step: NodePositionStep = {
    node,
    shadowType: ShadowType.NONE,
    shadowContext: null,
    nodeShadow: null,
    shadowSibling: null,
    formattingContext: null,
    fragmentIndex: 0,
  };
  return {
    steps: [step],
    offsetInNode: 0,
    after: false,
    preprocessedTextContent: null,
  };
}

export function newNodePositionFromNodeContext(
  nodeContext: Vtree.NodeContext,
  initialFragmentIndex: number | null,
): NodePosition {
  const step: NodePositionStep = {
    node: nodeContext.sourceNode,
    shadowType: ShadowType.NONE,
    shadowContext: nodeContext.shadowContext,
    nodeShadow: null,
    shadowSibling: null,
    formattingContext: null,
    fragmentIndex:
      initialFragmentIndex != null
        ? initialFragmentIndex
        : nodeContext.fragmentIndex,
  };
  return {
    steps: [step],
    offsetInNode: 0,
    after: false,
    preprocessedTextContent: nodeContext.preprocessedTextContent,
  };
}

export function makeNodeContextFromNodePositionStep(
  step: NodePositionStep,
  parent: Vtree.NodeContext,
): NodeContext {
  const nodeContext = new NodeContext(step.node, parent as NodeContext, 0);
  nodeContext.shadowType = step.shadowType;
  nodeContext.shadowContext = step.shadowContext;
  nodeContext.nodeShadow = step.nodeShadow;
  nodeContext.shadowSibling = step.shadowSibling
    ? makeNodeContextFromNodePositionStep(step.shadowSibling, parent.copy())
    : null;
  nodeContext.formattingContext = step.formattingContext;
  nodeContext.fragmentIndex = step.fragmentIndex + 1;
  return nodeContext;
}

export const ShadowType = Vtree.ShadowType;
export type ShadowType = Vtree.ShadowType; // eslint-disable-line no-redeclare

/**
 * Data about shadow tree instance.
 */
export class ShadowContext implements Vtree.ShadowContext {
  subShadow: ShadowContext = null;

  constructor(
    public readonly owner: Element,
    public readonly root: Element,
    public readonly xmldoc: XmlDoc.XMLDocHolder,
    public readonly parentShadow: ShadowContext,
    superShadow: ShadowContext,
    public readonly type: ShadowType,
    public readonly styler: CssStyler.AbstractStyler,
  ) {
    if (superShadow) {
      superShadow.subShadow = this;
    }
  }

  equals(other: ShadowContext): boolean {
    if (!other) {
      return false;
    }
    return (
      this.owner === other.owner &&
      this.xmldoc === other.xmldoc &&
      this.type === other.type &&
      isSameShadowContext(this.parentShadow, other.parentShadow)
    );
  }
}

export function isSameShadowContext(
  sc1: Vtree.ShadowContext,
  sc2: Vtree.ShadowContext,
): boolean {
  return sc1 === sc2 || (!!sc1 && !!sc2 && sc1.equals(sc2));
}

/**
 * Information about :first-letter or :first-line pseudoelements
 * @param count 0 - first-letter, 1 or more - first line(s)
 */
export class FirstPseudo implements Vtree.FirstPseudo {
  constructor(
    public readonly outer: FirstPseudo,
    public readonly count: number,
  ) {}
}

/**
 * NodeContext represents a position in the document + layout-related
 * information attached to it. When after=false and offsetInNode=0, the
 * position is inside the element (node), but just before its first child.
 * When offsetInNode>0 it represents offset in the textual content of the
 * node. When after=true it represents position right after the last child
 * of the node. boxOffset is incremented by 1 for any valid node position.
 */
export class NodeContext implements Vtree.NodeContext {
  // position itself
  offsetInNode: number = 0;
  after: boolean = false;
  shadowType: ShadowType;

  // parent's shadow type
  shadowContext: Vtree.ShadowContext;
  nodeShadow: Vtree.ShadowContext = null;
  shadowSibling: NodeContext = null;

  // next "sibling" in the shadow tree
  // other stuff
  shared: boolean = false;
  inline: boolean = true;
  overflow: boolean = false;
  breakPenalty: number;
  display: string | null = null;
  floatReference: PageFloats.FloatReference;
  floatSide: string | null = null;
  clearSide: string | null = null;
  floatMinWrapBlock: Css.Numeric | null = null;
  columnSpan: Css.Val | null = null;
  verticalAlign: string = "baseline";
  captionSide: string = "top";
  inlineBorderSpacing: number = 0;
  blockBorderSpacing: number = 0;
  flexContainer: boolean = false;
  whitespace: Whitespace;
  hyphenateCharacter: string | null;
  breakWord: boolean;
  establishesBFC: boolean = false;
  containingBlockForAbsolute: boolean = false;
  breakBefore: string | null = null;
  breakAfter: string | null = null;
  viewNode: Node = null;
  clearSpacer: Node = null;
  inheritedProps: { [key: string]: number | string | Css.Val };
  vertical: boolean;
  direction: string;
  firstPseudo: FirstPseudo;
  lang: string | null = null;
  preprocessedTextContent: Diff.Change[] | null = null;
  formattingContext: FormattingContext;
  repeatOnBreak: string | null = null;
  pluginProps: {
    [key: string]: string | number | undefined | null | (number | null)[];
  } = {};
  fragmentIndex: number = 1;
  afterIfContinues: Selectors.AfterIfContinues = null;
  footnotePolicy: Css.Ident | null = null;
  pageType: string | null;

  constructor(
    public sourceNode: Node,
    public parent: NodeContext,
    public boxOffset: number,
  ) {
    this.shadowType = ShadowType.NONE;
    this.shadowContext = parent ? parent.shadowContext : null;
    this.breakPenalty = parent ? parent.breakPenalty : 0;
    this.floatReference = PageFloats.FloatReference.INLINE;
    this.whitespace = parent ? parent.whitespace : Whitespace.IGNORE;
    this.hyphenateCharacter = parent ? parent.hyphenateCharacter : null;
    this.breakWord = parent ? parent.breakWord : false;
    this.inheritedProps = parent ? parent.inheritedProps : {};
    this.vertical = parent ? parent.vertical : false;
    this.direction = parent ? parent.direction : "ltr";
    this.firstPseudo = parent ? parent.firstPseudo : null;
    this.formattingContext = parent ? parent.formattingContext : null;
    this.pageType = parent ? parent.pageType : null;
  }

  resetView(): void {
    this.inline = true;
    this.breakPenalty = this.parent ? this.parent.breakPenalty : 0;
    this.viewNode = null;
    this.clearSpacer = null;
    this.offsetInNode = 0;
    this.after = false;
    this.display = null;
    this.floatReference = PageFloats.FloatReference.INLINE;
    this.floatSide = null;
    this.clearSide = null;
    this.floatMinWrapBlock = null;
    this.columnSpan = null;
    this.verticalAlign = "baseline";
    this.flexContainer = false;
    this.whitespace = this.parent ? this.parent.whitespace : Whitespace.IGNORE;
    this.hyphenateCharacter = this.parent
      ? this.parent.hyphenateCharacter
      : null;
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
    let np: NodeContext = this;
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
    let npp: NodeContext;
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
      shadowSibling: this.shadowSibling
        ? this.shadowSibling.toNodePositionStep()
        : null,
      formattingContext: this.formattingContext,

      // fragmentIndex needs to be reset to 0 if this viewNode has been removed
      // from the view tree by forced break processing. (Issue #1557)
      fragmentIndex:
        this.viewNode?.parentNode === null ? 0 : this.fragmentIndex,
    };
  }

  toNodePosition(): NodePosition {
    let nc: NodeContext = this;
    const steps = [];

    // Fix for issue #703
    if (
      nc.shadowType === Vtree.ShadowType.ROOTLESS &&
      (nc.floatReference !== PageFloats.FloatReference.INLINE ||
        nc.floatSide === "footnote") &&
      (nc.shadowContext?.styler as PseudoElement.PseudoelementStyler)?.style?.[
        "_pseudos"
      ]
    ) {
      nc = nc.parent;
    }

    do {
      // We need fully "peeled" path, so don't record first-XXX pseudoelement
      // containers
      if (
        !nc.firstPseudo ||
        !nc.parent ||
        nc.parent.firstPseudo === nc.firstPseudo
      ) {
        steps.push(nc.toNodePositionStep());
      }
      nc = nc.parent;
    } while (nc);
    const actualOffsetInNode = this.preprocessedTextContent
      ? Diff.resolveOriginalIndex(
          this.preprocessedTextContent,
          this.offsetInNode,
        )
      : this.offsetInNode;
    return {
      steps,
      offsetInNode: actualOffsetInNode,
      after: this.after,
      preprocessedTextContent: this.preprocessedTextContent,
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

  belongsTo(formattingContext: FormattingContext): boolean {
    return (
      this.formattingContext === formattingContext &&
      !!this.parent &&
      this.parent.formattingContext === formattingContext
    );
  }
}

export class ChunkPosition implements Vtree.ChunkPosition {
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
    } else if (other.floats) {
      return false;
    }
    return true;
  }
}

export class FlowChunkPosition {
  constructor(
    public chunkPosition: ChunkPosition,
    public readonly flowChunk: FlowChunk,
  ) {}

  clone(): FlowChunkPosition {
    return new FlowChunkPosition(this.chunkPosition.clone(), this.flowChunk);
  }

  isSamePosition(other: FlowChunkPosition): boolean {
    return (
      !!other &&
      (this === other || this.chunkPosition.isSamePosition(other.chunkPosition))
    );
  }
}

export class FlowPosition {
  positions: FlowChunkPosition[] = [];
  startBreakType: string | null = null;
  breakAfter: string | null = null;

  clone(): FlowPosition {
    const newfp = new FlowPosition();
    const arr = this.positions;
    const newarr = newfp.positions;
    for (let i = 0; i < arr.length; i++) {
      newarr[i] = arr[i].clone();
    }
    newfp.startBreakType = this.startBreakType;
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
    return (
      this.positions.length > 0 &&
      this.positions[0].flowChunk.startOffset <= offset
    );
  }
}

export class LayoutPosition {
  /**
   * One-based, incremented before layout.
   */
  page: number = 0;
  flows: { [key: string]: Flow } = {};
  flowPositions: { [key: string]: FlowPosition } = {};
  isBlankPage: boolean = false;

  /**
   * flowPositions is built up to this offset.
   */
  highestSeenOffset: number = 0;

  // FIXME: This properties seem to be not used
  highestSeenNode: Node;
  lookupPositionOffset: number;

  clone(): LayoutPosition {
    const newcp = new LayoutPosition();
    newcp.page = this.page;
    newcp.isBlankPage = this.isBlankPage;
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
    if (
      !other ||
      this.page !== other.page
      // Removed:
      //   || this.highestSeenOffset !== other.highestSeenOffset
      // to prevent unnecessary re-layout (Issue #681-case2)
    ) {
      return false;
    }
    const thisFlowNames = Object.keys(this.flowPositions);
    const otherFlowNames = Object.keys(other.flowPositions);
    if (thisFlowNames.length !== otherFlowNames.length) {
      return false;
    }
    for (const flowName of thisFlowNames) {
      if (
        !this.flowPositions[flowName].isSamePosition(
          other.flowPositions[flowName],
        )
      ) {
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
    const startBreakType = this.flowPositions[name]?.startBreakType;
    return startBreakType && Break.isSpreadBreakValue(startBreakType)
      ? startBreakType
      : "any";
  }

  firstFlowChunkOfFlow(name: string): FlowChunk | null {
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

export class Container implements Vtree.Container {
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
  exclusions: GeometryUtil.Shape[] = null;
  innerShape: GeometryUtil.Shape = null;
  computedBlockSize: number = 0;
  snapWidth: number = 0;
  snapHeight: number = 0;
  snapOffsetX: number = 0;
  snapOffsetY: number = 0;
  vertical: boolean = false; // vertical writing
  rtl: boolean = false;
  borderBoxSizing: boolean = false;

  constructor(public element: Element) {}

  getInsetTop() {
    return (
      this.marginTop +
      (this.borderBoxSizing ? 0 : this.borderTop + this.paddingTop)
    );
  }

  getInsetBottom() {
    return (
      this.marginBottom +
      (this.borderBoxSizing ? 0 : this.borderBottom + this.paddingBottom)
    );
  }

  getInsetLeft() {
    return (
      this.marginLeft +
      (this.borderBoxSizing ? 0 : this.borderLeft + this.paddingLeft)
    );
  }

  getInsetRight() {
    return (
      this.marginRight +
      (this.borderBoxSizing ? 0 : this.borderRight + this.paddingRight)
    );
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
    return this.vertical
      ? this.rtl
        ? box.bottom
        : box.top
      : this.rtl
        ? box.right
        : box.left;
  }

  getEndEdge(box: ClientRect): number {
    return this.vertical
      ? this.rtl
        ? box.top
        : box.bottom
      : this.rtl
        ? box.left
        : box.right;
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

  getInlineDir(): number {
    return this.rtl ? -1 : 1;
  }

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
    this.rtl = other.rtl;
    this.borderBoxSizing = other.borderBoxSizing;
  }

  setVerticalPosition(top: number, height: number): void {
    this.top = top;
    this.height = height;
    Base.setCSSProperty(this.element, "top", `${top}px`);
    Base.setCSSProperty(this.element, "height", `${height}px`);
  }

  setHorizontalPosition(left: number, width: number): void {
    this.left = left;
    this.width = width;
    Base.setCSSProperty(this.element, "left", `${left}px`);
    Base.setCSSProperty(this.element, "width", `${width}px`);
  }

  setBlockPosition(start: number, extent: number): void {
    if (this.vertical) {
      const outerExtent =
        extent +
        this.marginLeft +
        this.marginRight +
        (this.borderBoxSizing
          ? 0
          : this.paddingLeft +
            this.paddingRight +
            this.borderLeft +
            this.borderRight);
      this.setHorizontalPosition(
        start + outerExtent * this.getBoxDir(),
        extent,
      );
    } else {
      this.setVerticalPosition(start, extent);
    }
  }

  setInlinePosition(start: number, extent: number): void {
    if (this.vertical) {
      if (this.rtl) {
        const outerExtent =
          extent +
          this.marginTop +
          this.marginBottom +
          (this.borderBoxSizing
            ? 0
            : this.paddingTop +
              this.paddingBottom +
              this.borderTop +
              this.borderBottom);
        this.setVerticalPosition(
          start + outerExtent * this.getInlineDir(),
          extent,
        );
      } else {
        this.setVerticalPosition(start, extent);
      }
    } else if (this.rtl) {
      const outerExtent =
        extent +
        this.marginLeft +
        this.marginRight +
        (this.borderBoxSizing
          ? 0
          : this.paddingLeft +
            this.paddingRight +
            this.borderLeft +
            this.borderRight);
      this.setHorizontalPosition(
        start + outerExtent * this.getInlineDir(),
        extent,
      );
    } else {
      this.setHorizontalPosition(start, extent);
    }
  }

  clear() {
    const parent = this.element;
    let c: Node;
    while ((c = parent.lastChild)) {
      parent.removeChild(c);
    }
  }

  getInnerShape(): GeometryUtil.Shape {
    const rect = this.getInnerRect();
    if (this.innerShape) {
      return this.innerShape.withOffset(rect.x1, rect.y1);
    }
    return GeometryUtil.shapeForRect(rect.x1, rect.y1, rect.x2, rect.y2);
  }

  getInnerRect(): GeometryUtil.Rect {
    const offsetX = this.originX + this.left + this.getInsetLeft();
    const offsetY = this.originY + this.top + this.getInsetTop();
    return new GeometryUtil.Rect(
      offsetX,
      offsetY,
      offsetX + this.width,
      offsetY + this.height,
    );
  }

  getPaddingRect(): GeometryUtil.Rect {
    const paddingX =
      this.originX + this.left + this.marginLeft + this.borderLeft;
    const paddingY = this.originY + this.top + this.marginTop + this.borderTop;
    const paddingWidth = this.paddingLeft + this.width + this.paddingRight;
    const paddingHeight = this.paddingTop + this.height + this.paddingBottom;
    return new GeometryUtil.Rect(
      paddingX,
      paddingY,
      paddingX + paddingWidth,
      paddingY + paddingHeight,
    );
  }

  getOuterShape(
    outerShapeProp: Css.Val,
    context: Exprs.Context,
  ): GeometryUtil.Shape {
    const rect = this.getOuterRect();
    return CssProp.toShape(
      outerShapeProp,
      rect.x1,
      rect.y1,
      rect.x2 - rect.x1,
      rect.y2 - rect.y1,
      context,
    );
  }

  getOuterRect(): GeometryUtil.Rect {
    const outerX = this.originX + this.left;
    const outerY = this.originY + this.top;
    const outerWidth = this.getInsetLeft() + this.width + this.getInsetRight();
    const outerHeight =
      this.getInsetTop() + this.height + this.getInsetBottom();
    return new GeometryUtil.Rect(
      outerX,
      outerY,
      outerX + outerWidth,
      outerY + outerHeight,
    );
  }
}

export type ExprContentListener = Vtree.ExprContentListener;

export class ContentPropertyHandler extends Css.Visitor {
  constructor(
    public readonly elem: Element,
    public readonly context: Exprs.Context,
    public readonly rootContentValue: Css.Val,
    public readonly exprContentListener: ExprContentListener,
  ) {
    super();
  }

  private visitStrInner(str: string, node?: Node | null) {
    if (!node) {
      if (this.elem.lastChild?.nodeType === 3) {
        this.elem.lastChild.textContent += str;
        return;
      }
      node = this.elem.ownerDocument.createTextNode(str);
    }
    this.elem.appendChild(node);
  }

  override visitStr(str: Css.Str): Css.Val {
    this.visitStrInner(str.str);
    return null;
  }

  override visitURL(url: Css.URL): Css.Val {
    if ((this.rootContentValue as any).url) {
      this.elem.setAttribute("src", url.url);
    } else {
      const img = this.elem.ownerDocument.createElementNS(Base.NS.XHTML, "img");
      img.setAttribute("src", url.url);
      this.elem.appendChild(img);
    }
    return null;
  }

  override visitSpaceList(list: Css.SpaceList): Css.Val {
    this.visitValues(list.values);
    return null;
  }

  override visitExpr(expr: Css.Expr): Css.Val {
    const ex = expr.toExpr();
    let val = ex.evaluate(this.context);
    if (typeof val === "string") {
      if (ex instanceof Exprs.Named) {
        // For env(pub-title) and env(doc-title)
        // Need to unquote the result. To be consistent with cssparse.evaluateExprToCSS()
        val = CssParser.parseValue(
          ex.scope,
          new CssTokenizer.Tokenizer(val, null),
          "",
        ).stringValue();
      }
      assert(this.elem.ownerDocument);
      const node = this.exprContentListener(ex, val, this.elem.ownerDocument);
      if (
        !node &&
        val &&
        ex instanceof Exprs.Native &&
        ex.str.startsWith("running-element-")
      ) {
        // Prevent wrong running element output when the element is not found (Issue #1196)
        val = "";
      }
      this.visitStrInner(val, node);
    }
    return null;
  }
}

export function nonTrivialContent(val: Css.Val): boolean {
  return (
    val != null &&
    val !== Css.empty &&
    val !== Css.ident.normal &&
    val !== Css.ident.none &&
    !Css.isDefaultingValue(val)
  );
}
