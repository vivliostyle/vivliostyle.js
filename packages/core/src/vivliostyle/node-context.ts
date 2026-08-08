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
 * @fileoverview NodeContext - Construction of node contexts.
 */
import * as Diff from "./diff";
import * as LegacyPluginSurface from "./legacy-plugin-surface";
import * as PseudoElement from "./pseudo-element";
import * as VtreeImpl from "./vtree";
import { PageFloats, Vtree } from "./types";

export type ShadowPlacement = {
  shadowType: Vtree.ShadowType;
  shadowContext: Vtree.ShadowContext | null;
  nodeShadow?: Vtree.ShadowContext | null;
  shadowSibling?: Vtree.NodeContext | null;
};

export type PositionHead = {
  offsetInNode: number;
  after: boolean;
  preprocessedTextContent?: Diff.Change[] | null;
};

const unstyled: Vtree.UnstyledFields = {
  floatReference: PageFloats.FloatReference.INLINE,
  clearSide: null,
  floatMinWrapBlock: null,
  columnSpan: null,
  flexContainer: false,
  containingBlockForAbsolute: false,
  breakAfter: null,
  repeatOnBreak: null,
  afterIfContinues: null,
  footnotePolicy: null,
};

function derivedFromParent(parent: Vtree.ParentNodeContext | null): Pick<
  Vtree.NodeContextCore,
  "direction" | "inheritedProps"
> & {
  lang: null;
} {
  return {
    lang: null,
    direction: parent ? parent.direction : "ltr",
    inheritedProps: parent ? parent.inheritedProps : {},
  };
}

function derived<T extends Vtree.NodeContext>(nodeContext: T): T {
  return { ...nodeContext, ...derivedFromParent(nodeContext.parent) };
}

function openCore<P extends Vtree.ParentNodeContext | null>(
  sourceNode: Node,
  parent: P,
  boxOffset: number,
  formattingContext: Vtree.FormattingContext,
  blockContainer: Vtree.ElementNodeContext | null,
): Omit<Vtree.OpenNodeContext, "parent"> & { readonly parent: P } {
  return {
    kind: "open",
    after: false,
    viewNode: null,
    preprocessedTextContent: null,
    sourceNode,
    parent,
    boxOffset,
    formattingContext,
    blockContainer,
    offsetInNode: 0,
    shadowType: Vtree.ShadowType.NONE,
    shadowContext: parent ? parent.shadowContext : null,
    nodeShadow: null,
    shadowSibling: null,
    fragmentIndex: 1,
    inline: true,
    overflow: false,
    breakBefore: null,
    breakPenalty: parent ? parent.breakPenalty : 0,
    whitespace: parent ? parent.whitespace : Vtree.Whitespace.IGNORE,
    hyphenateCharacter: parent ? parent.hyphenateCharacter : null,
    breakWord: parent ? parent.breakWord : false,
    firstPseudo: parent ? parent.firstPseudo : null,
    pageType: parent ? parent.pageType : null,
    vertical: parent ? parent.vertical : false,
    direction: parent ? parent.direction : "ltr",
    lang: null,
    inheritedProps: parent ? parent.inheritedProps : {},
    pluginProps: {},
    clearSpacer: null,
    display: null,
    floatSide: null,
    establishesBFC: false,
    captionSide: "top",
    inlineBorderSpacing: 0,
    blockBorderSpacing: 0,
    ...unstyled,
  };
}

function withShadowPlacement<T extends Vtree.NodeContext>(
  nodeContext: T,
  placement: ShadowPlacement,
): T {
  return {
    ...nodeContext,
    shadowType: placement.shadowType,
    shadowContext: placement.shadowContext,
    nodeShadow: placement.nodeShadow ?? null,
    shadowSibling: placement.shadowSibling ?? null,
  };
}

function withPositionHead(
  nodeContext: Vtree.OpenNodeContext,
  head: PositionHead,
): Vtree.OpenNodeContext | Vtree.AfterNoneNodeContext {
  const positioned = {
    ...nodeContext,
    offsetInNode: head.offsetInNode,
    preprocessedTextContent: head.preprocessedTextContent ?? null,
  };
  return head.after
    ? { ...positioned, kind: "after-none", after: true }
    : positioned;
}

function withNodePositionStep(
  nodeContext: Vtree.OpenNodeContext,
  step: Vtree.NodePositionStep,
): Vtree.OpenNodeContext {
  return {
    ...nodeContext,
    shadowType: step.shadowType,
    shadowContext: step.shadowContext,
    nodeShadow: step.nodeShadow,
    fragmentIndex: step.fragmentIndex + 1,
  };
}

export function openChildOf(
  sourceNode: Node,
  parent: Vtree.ParentNodeContext,
  boxOffset: number,
  placement?: ShadowPlacement,
): Vtree.OpenNodeContext & Vtree.ChildNodeContext {
  const nodeContext = openCore(
    sourceNode,
    parent,
    boxOffset,
    parent.formattingContext,
    VtreeImpl.blockContainerForChildrenOf(parent),
  );
  return placement ? withShadowPlacement(nodeContext, placement) : nodeContext;
}

export function openSiblingOf(
  sourceNode: Node,
  sibling: Vtree.NodeContext,
  boxOffset: number,
): Vtree.OpenNodeContext {
  const parent = sibling.parent;
  return openCore(
    sourceNode,
    parent,
    boxOffset,
    (parent ?? sibling).formattingContext,
    sibling.blockContainer,
  );
}

export function openNextSiblingOf<T extends Vtree.NodeContext>(
  nodeContext: T,
  sourceNode: Node,
  boxOffset?: number,
): Omit<Vtree.OpenNodeContext, "parent"> & { readonly parent: T["parent"] } {
  const parent = nodeContext.parent;
  return {
    ...nodeContext,
    ...unstyled,
    ...derivedFromParent(parent),
    kind: "open",
    after: false,
    viewNode: null,
    sourceNode,
    boxOffset: boxOffset === undefined ? nodeContext.boxOffset : boxOffset,
    inline: true,
    breakPenalty: parent ? parent.breakPenalty : 0,
    clearSpacer: null,
    display: null,
    floatSide: null,
    establishesBFC: false,
    offsetInNode: 0,
    whitespace: parent ? parent.whitespace : Vtree.Whitespace.IGNORE,
    hyphenateCharacter: parent ? parent.hyphenateCharacter : null,
    breakWord: parent ? parent.breakWord : false,
    breakBefore: null,
    nodeShadow: null,
    vertical: parent ? parent.vertical : false,
    preprocessedTextContent: null,
    formattingContext: parent
      ? parent.formattingContext
      : nodeContext.formattingContext,
    pluginProps: {},
    fragmentIndex: 1,
    pageType: parent ? parent.pageType : null,
  };
}

export function openAt(
  sourceNode: Node,
  parent: Vtree.ParentNodeContext | null,
  boxOffset: number,
  formattingContext: Vtree.FormattingContext,
  placement: ShadowPlacement,
  head?: PositionHead,
): Vtree.NodeContext {
  const nodeContext = openCore(
    sourceNode,
    parent,
    boxOffset,
    formattingContext,
    parent && VtreeImpl.blockContainerForChildrenOf(parent),
  );
  const positioned = head ? withPositionHead(nodeContext, head) : nodeContext;
  return withShadowPlacement(positioned, placement);
}

function retainedParent(
  parent: Vtree.ParentNodeContext,
): Vtree.ParentNodeContext {
  LegacyPluginSurface.noteRetained(parent);
  return parent;
}

export function openFromStep(
  step: Vtree.NodePositionStep,
  parent: Vtree.ParentNodeContext,
): Vtree.OpenNodeContext;
export function openFromStep( // eslint-disable-line no-redeclare
  step: Vtree.NodePositionStep,
  parent: Vtree.ParentNodeContext,
  head?: PositionHead,
): Vtree.NodeContext;
export function openFromStep( // eslint-disable-line no-redeclare
  step: Vtree.NodePositionStep,
  parent: Vtree.ParentNodeContext,
  head?: PositionHead,
): Vtree.NodeContext {
  const opened = withNodePositionStep(
    openCore(
      step.node,
      parent,
      0,
      step.formattingContext ?? parent.formattingContext,
      VtreeImpl.blockContainerForChildrenOf(parent),
    ),
    step,
  );
  const chained: Vtree.OpenNodeContext = {
    ...opened,
    shadowSibling: step.shadowSibling
      ? openFromStep(step.shadowSibling, retainedParent(parent))
      : null,
  };
  return head ? withPositionHead(chained, head) : chained;
}

export function openRootFromStep(
  step: Vtree.RootNodePositionStep,
  flowRootFormattingContext: Vtree.FormattingContext,
  head?: PositionHead,
): Vtree.OpenNodeContext | Vtree.AfterNoneNodeContext {
  const opened = withNodePositionStep(
    openCore(
      step.node,
      null,
      0,
      step.formattingContext ?? flowRootFormattingContext,
      null,
    ),
    step,
  );
  const chained: Vtree.OpenNodeContext = {
    ...opened,
    shadowSibling: step.shadowSibling,
  };
  return head ? withPositionHead(chained, head) : chained;
}

export function afterHeadFromPosition(
  position: Vtree.NodePosition,
  offsetInNode: number,
): PositionHead {
  return {
    offsetInNode,
    after: position.after,
    preprocessedTextContent: position.preprocessedTextContent,
  };
}

export type ElementRenderResult = Pick<
  Vtree.BeforeElementNodeContext,
  | "nodeShadow"
  | "containingBlockForAbsolute"
  | "flexContainer"
  | "inline"
  | "breakPenalty"
  | "clearSide"
  | "floatReference"
  | "floatMinWrapBlock"
  | "columnSpan"
  | "breakAfter"
  | "pageType"
  | "captionSide"
  | "inlineBorderSpacing"
  | "blockBorderSpacing"
  | "footnotePolicy"
  | "firstPseudo"
  | "afterIfContinues"
  | "whitespace"
  | "hyphenateCharacter"
  | "breakWord"
  | "repeatOnBreak"
  | "lang"
  | "vertical"
  | "direction"
  | "inheritedProps"
  | "establishesBFC"
  | "display"
  | "floatSide"
  | "breakBefore"
  | "formattingContext"
>;

export type ElementRenderDraft = {
  -readonly [K in keyof ElementRenderResult]: ElementRenderResult[K];
};

export function elementRenderResultOf(
  nodeContext: Vtree.NodeContext,
): ElementRenderDraft {
  return {
    nodeShadow: nodeContext.nodeShadow,
    containingBlockForAbsolute: nodeContext.containingBlockForAbsolute,
    flexContainer: nodeContext.flexContainer,
    inline: nodeContext.inline,
    breakPenalty: nodeContext.breakPenalty,
    clearSide: nodeContext.clearSide,
    floatReference: nodeContext.floatReference,
    floatMinWrapBlock: nodeContext.floatMinWrapBlock,
    columnSpan: nodeContext.columnSpan,
    breakAfter: nodeContext.breakAfter,
    pageType: nodeContext.pageType,
    captionSide: nodeContext.captionSide,
    inlineBorderSpacing: nodeContext.inlineBorderSpacing,
    blockBorderSpacing: nodeContext.blockBorderSpacing,
    footnotePolicy: nodeContext.footnotePolicy,
    firstPseudo: nodeContext.firstPseudo,
    afterIfContinues: nodeContext.afterIfContinues,
    whitespace: nodeContext.whitespace,
    hyphenateCharacter: nodeContext.hyphenateCharacter,
    breakWord: nodeContext.breakWord,
    repeatOnBreak: nodeContext.repeatOnBreak,
    lang: nodeContext.lang,
    vertical: nodeContext.vertical,
    direction: nodeContext.direction,
    inheritedProps: nodeContext.inheritedProps,
    establishesBFC: nodeContext.establishesBFC,
    display: nodeContext.display,
    floatSide: nodeContext.floatSide,
    breakBefore: nodeContext.breakBefore,
    formattingContext: nodeContext.formattingContext,
  };
}

export type ViewlessChildNodeContext = (
  Vtree.OpenNodeContext | Vtree.AfterNoneNodeContext
) &
  Vtree.ChildNodeContext;

export type ElementRenderProgress = Pick<
  ElementRenderResult,
  | "lang"
  | "vertical"
  | "direction"
  | "inheritedProps"
  | "establishesBFC"
  | "display"
  | "floatSide"
  | "breakBefore"
  | "formattingContext"
>;

export function elementRenderProgress<T extends Vtree.NodeContext>(
  nodeContext: T,
  progress: ElementRenderProgress,
): T {
  return {
    ...nodeContext,
    lang: progress.lang,
    vertical: progress.vertical,
    direction: progress.direction,
    inheritedProps: progress.inheritedProps,
    establishesBFC: progress.establishesBFC,
    display: progress.display,
    floatSide: progress.floatSide,
    breakBefore: progress.breakBefore,
    formattingContext: progress.formattingContext,
  };
}

export function viewless(
  nodeContext: Vtree.NodeContext,
): Vtree.OpenNodeContext | Vtree.AfterNoneNodeContext {
  switch (nodeContext.kind) {
    case "open":
    case "after-none":
      return nodeContext;
    case "element":
    case "text":
      return {
        ...nodeContext,
        ...unstyled,
        kind: "open",
        after: false,
        viewNode: null,
      };
  }
  return {
    ...nodeContext,
    ...unstyled,
    kind: "after-none",
    after: true,
    viewNode: null,
  };
}

export function viewlessRender(
  nodeContext: Vtree.NodeContext,
  result: ElementRenderResult,
): Vtree.OpenNodeContext | Vtree.AfterNoneNodeContext {
  return viewless({
    ...elementRenderProgress(nodeContext, result),
    nodeShadow: result.nodeShadow,
    inline: result.inline,
    breakPenalty: result.breakPenalty,
    pageType: result.pageType,
    captionSide: result.captionSide,
    inlineBorderSpacing: result.inlineBorderSpacing,
    blockBorderSpacing: result.blockBorderSpacing,
    firstPseudo: result.firstPseudo,
    whitespace: result.whitespace,
    hyphenateCharacter: result.hyphenateCharacter,
    breakWord: result.breakWord,
  });
}

export function renderedElement(
  nodeContext: Vtree.NodeContext,
  viewNode: Element,
  result: ElementRenderResult,
): Vtree.ElementNodeContext {
  const rendered = { ...nodeContext, ...result, viewNode };
  return nodeContext.after
    ? { ...rendered, kind: "after-element", after: true }
    : { ...rendered, kind: "element", after: false };
}

export function renderedText(
  nodeContext: ViewlessChildNodeContext,
  viewNode: Text,
  preprocessedTextContent: Diff.Change[],
): Vtree.TextNodeContext {
  const rendered = {
    ...nodeContext,
    viewNode,
    preprocessedTextContent,
    parent: nodeContext.parent,
  };
  return nodeContext.after
    ? { ...rendered, kind: "after-text", after: true }
    : { ...rendered, kind: "text", after: false };
}

export function afterEdgeOf(
  nodeContext: Vtree.NodeContext,
): Vtree.AfterEdgeNodeContext {
  return afterEdgeAt(nodeContext, nodeContext.boxOffset);
}

export function afterEdgeAt(
  nodeContext: Vtree.NodeContext,
  boxOffset: number,
): Vtree.AfterEdgeNodeContext {
  const moved = { ...derived(nodeContext), boxOffset };
  switch (moved.kind) {
    case "open":
    case "after-none":
      return { ...moved, kind: "after-none", after: true };
    case "element":
    case "after-element":
      return { ...moved, kind: "after-element", after: true };
  }
  return { ...moved, kind: "after-text", after: true };
}

export function beforeEdgeOf(
  nodeContext: Vtree.NodeContext,
): Vtree.BeforeEdgeNodeContext {
  const moved = derived(nodeContext);
  switch (moved.kind) {
    case "open":
    case "after-none":
      return { ...moved, kind: "open", after: false };
    case "element":
    case "after-element":
      return { ...moved, kind: "element", after: false };
  }
  return { ...moved, kind: "text", after: false };
}

export function skippedAfterOf(
  nodeContext: Vtree.NodeContext,
): Vtree.AfterEdgeNodeContext {
  const after = afterEdgeOf(nodeContext);
  return after.viewNode ? after : { ...after, inline: true };
}

export function anchoredAfterOf(
  nodeContext: Vtree.NodeContext,
  anchor: Element,
  asInline: boolean,
): Vtree.AfterElementNodeContext {
  const moved = derived(nodeContext);
  return {
    ...moved,
    kind: "after-element",
    after: true,
    viewNode: anchor,
    display: asInline ? "inline" : moved.display,
  };
}

export function withOverflow<T extends Vtree.NodeContext>(
  nodeContext: T,
  overflow: boolean,
): T {
  return { ...derived(nodeContext), overflow };
}

export function setOverflow<T extends Vtree.NodeContext>(
  nodeContext: T,
  overflow: boolean,
): T {
  return { ...nodeContext, overflow };
}

export function withBoxOffset<T extends Vtree.NodeContext>(
  nodeContext: T,
  boxOffset: number,
): T {
  return { ...derived(nodeContext), boxOffset };
}

export function setBoxOffset<T extends Vtree.NodeContext>(
  nodeContext: T,
  boxOffset: number,
): T {
  return { ...nodeContext, boxOffset };
}

export function withOffsetInNode<T extends Vtree.NodeContext>(
  nodeContext: T,
  offsetInNode: number,
): T {
  return { ...derived(nodeContext), offsetInNode };
}

export function textBrokenAt<T extends Vtree.NodeContext>(
  nodeContext: T,
  viewIndex: number,
): T {
  return {
    ...derived(nodeContext),
    offsetInNode: nodeContext.offsetInNode + viewIndex,
    breakBefore: null,
  };
}

export function withBreakBefore<T extends Vtree.NodeContext>(
  nodeContext: T,
  breakBefore: string | null,
): T {
  return { ...derived(nodeContext), breakBefore };
}

export function setBreakBefore<T extends Vtree.NodeContext>(
  nodeContext: T,
  breakBefore: string | null,
): T {
  return { ...nodeContext, breakBefore };
}

export function withoutFloat<T extends Vtree.NodeContext>(nodeContext: T): T {
  return {
    ...derived(nodeContext),
    floatSide: null,
    floatReference: PageFloats.FloatReference.INLINE,
    clearSide: null,
  };
}

export function setClearSpacer<T extends Vtree.NodeContext>(
  nodeContext: T,
  clearSpacer: Element | null,
): T {
  return { ...nodeContext, clearSpacer };
}

export function setRepeatOnBreak(
  nodeContext: Vtree.ElementNodeContext,
  repeatOnBreak: string | null,
): Vtree.ElementNodeContext {
  return { ...nodeContext, repeatOnBreak };
}

export function setFragmentIndex<T extends Vtree.NodeContext>(
  nodeContext: T,
  fragmentIndex: number,
): T {
  return { ...nodeContext, fragmentIndex };
}

export function setPluginProp<T extends Vtree.NodeContext>(
  nodeContext: T,
  name: string,
  value: Vtree.PluginProps[string],
): T {
  return {
    ...nodeContext,
    pluginProps: { ...nodeContext.pluginProps, [name]: value },
  };
}

export function setInline<T extends Vtree.NodeContext>(
  nodeContext: T,
  inline: boolean,
): T {
  return { ...nodeContext, inline };
}

export function setShadowContext<T extends Vtree.NodeContext>(
  nodeContext: T,
  shadowContext: Vtree.ShadowContext | null,
): T {
  return { ...nodeContext, shadowContext };
}

export function setShadowSibling<T extends Vtree.NodeContext>(
  nodeContext: T,
  shadowSibling: Vtree.NodeContext | null,
): T {
  return { ...nodeContext, shadowSibling };
}

export function setPreprocessedTextContent<T extends Vtree.NodeContext>(
  nodeContext: T,
  preprocessedTextContent: Diff.Change[] | null,
): T {
  return { ...nodeContext, preprocessedTextContent };
}

type ContinuationHolder = { current: Vtree.NodeContext };

const continuationOfSlot = new WeakMap<Vtree.NodeContext, ContinuationHolder>();
const continuationAtValue = new WeakMap<
  Vtree.NodeContext,
  ContinuationHolder
>();

export function latestContinuation(slot: Vtree.NodeContext): Vtree.NodeContext {
  return continuationOfSlot.get(slot)?.current ?? slot;
}

export function resumeContinuation(
  slot: Vtree.NodeContext,
  resumed: Vtree.NodeContext,
): void {
  const holder = continuationOfSlot.get(slot);
  if (holder) {
    continuationAtValue.delete(holder.current);
    holder.current = resumed;
    continuationAtValue.set(resumed, holder);
    return;
  }
  const started = { current: resumed };
  continuationOfSlot.set(slot, started);
  continuationAtValue.set(resumed, started);
}

export function followContinuation(
  previous: Vtree.NodeContext,
  next: Vtree.NodeContext,
): void {
  const holder = continuationAtValue.get(previous);
  if (!holder) {
    return;
  }
  continuationAtValue.delete(previous);
  holder.current = next;
  continuationAtValue.set(next, holder);
}

export function positionChainOf<T extends Vtree.NodeContext>(
  nodeContext: T,
): T {
  const parent = nodeContext.parent;
  if (!parent) {
    return derived(nodeContext);
  }
  const chainedParent = positionChainOf(parent);
  return {
    ...derived(nodeContext),
    parent: chainedParent,
    blockContainer: VtreeImpl.blockContainerForChildrenOf(chainedParent),
  };
}

export function toNodePositionStep(
  nodeContext: Vtree.NodeContext,
): Vtree.NodePositionStep {
  return {
    node: nodeContext.sourceNode,
    shadowType: nodeContext.shadowType,
    shadowContext: nodeContext.shadowContext,
    nodeShadow: nodeContext.nodeShadow,
    shadowSibling: nodeContext.shadowSibling
      ? toNodePositionStep(latestContinuation(nodeContext.shadowSibling))
      : null,
    formattingContext: nodeContext.formattingContext,

    // fragmentIndex needs to be reset to 0 if this viewNode has been removed
    // from the view tree by forced break processing. (Issue #1557)
    fragmentIndex:
      nodeContext.viewNode?.parentNode === null ? 0 : nodeContext.fragmentIndex,
  };
}

function toRootNodePositionStep(
  root: Vtree.RootNodeContext,
): Vtree.RootNodePositionStep {
  return {
    ...toNodePositionStep(root),
    shadowSibling: root.shadowSibling,
  };
}

export function toNodePosition(
  nodeContext: Vtree.NodeContext,
): Vtree.NodePosition {
  // Fix for issue #703
  // A float or footnote context inside a pseudo-element shadow is always a
  // descended one: restored heads keep the constructor's default float
  // fields and live roots carry no shadow context.
  const floatInPseudoContent =
    nodeContext.shadowType === Vtree.ShadowType.ROOTLESS &&
    (nodeContext.floatReference !== PageFloats.FloatReference.INLINE ||
      nodeContext.floatSide === "footnote") &&
    (nodeContext.shadowContext?.styler as PseudoElement.PseudoelementStyler)
      ?.style?.["_pseudos"]
      ? VtreeImpl.asChildNodeContext(nodeContext)
      : null;
  const steps: Vtree.NodePositionStep[] = [];
  let nc: Vtree.NodeContext = floatInPseudoContent
    ? floatInPseudoContent.parent
    : nodeContext;
  let parent: Vtree.ParentNodeContext | null;
  while ((parent = nc.parent) !== null) {
    // We need fully "peeled" path, so don't record first-XXX pseudoelement
    // containers
    if (!nc.firstPseudo || parent.firstPseudo === nc.firstPseudo) {
      steps.push(toNodePositionStep(nc));
    }
    nc = parent;
  }
  const actualOffsetInNode = nodeContext.preprocessedTextContent
    ? Diff.resolveOriginalIndex(
        nodeContext.preprocessedTextContent,
        nodeContext.offsetInNode,
      )
    : nodeContext.offsetInNode;
  return {
    steps: [...steps, toRootNodePositionStep(VtreeImpl.asRootNodeContext(nc))],
    offsetInNode: actualOffsetInNode,
    after: nodeContext.after,
    preprocessedTextContent: nodeContext.preprocessedTextContent,
  };
}

export function isInsideBFC(nodeContext: Vtree.NodeContext): boolean {
  let parent = nodeContext.parent;
  while (parent) {
    if (parent.establishesBFC) {
      return true;
    }
    parent = parent.parent;
  }
  return false;
}

export function containingBlockForAbsoluteOf(
  nodeContext: Vtree.NodeContext,
): Vtree.ElementNodeContext | null {
  let parent = nodeContext.parent;
  while (parent) {
    if (parent.containingBlockForAbsolute) {
      return VtreeImpl.asElementNodeContext(parent);
    }
    parent = parent.parent;
  }
  return null;
}

export function belongsTo(
  nodeContext: Vtree.NodeContext,
  formattingContext: Vtree.FormattingContext,
): boolean {
  return (
    nodeContext.formattingContext === formattingContext &&
    !!nodeContext.parent &&
    nodeContext.parent.formattingContext === formattingContext
  );
}
