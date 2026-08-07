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
import * as VtreeImpl from "./vtree";
import { PageFloats, Vtree } from "./types";

export type ShadowPlacement = {
  shadowType: Vtree.ShadowType;
  shadowContext: Vtree.ShadowContext | null;
  nodeShadow?: Vtree.ShadowContext | null;
  shadowSibling?: VtreeImpl.NodeContext | null;
};

export type PositionHead = {
  offsetInNode: number;
  after: boolean;
  preprocessedTextContent?: Diff.Change[] | null;
  fragmentIndex?: number;
};

function applyShadowPlacement(
  nodeContext: VtreeImpl.NodeContext,
  placement: ShadowPlacement,
): void {
  nodeContext.shadowType = placement.shadowType;
  nodeContext.shadowContext = placement.shadowContext;
  nodeContext.nodeShadow = placement.nodeShadow ?? null;
  nodeContext.shadowSibling = placement.shadowSibling ?? null;
}

function applyPositionHead(
  nodeContext: VtreeImpl.NodeContext,
  head: PositionHead,
): void {
  nodeContext.offsetInNode = head.offsetInNode;
  nodeContext.after = head.after;
  nodeContext.preprocessedTextContent = head.preprocessedTextContent ?? null;
  if (head.fragmentIndex !== undefined) {
    nodeContext.fragmentIndex = head.fragmentIndex;
  }
}

function applyNodePositionStep(
  nodeContext: VtreeImpl.NodeContext,
  step: Vtree.NodePositionStep,
): void {
  nodeContext.shadowType = step.shadowType;
  nodeContext.shadowContext = step.shadowContext;
  nodeContext.nodeShadow = step.nodeShadow;
  nodeContext.fragmentIndex = step.fragmentIndex + 1;
}

export function openChildOf(
  sourceNode: Node,
  parent: VtreeImpl.NodeContext,
  boxOffset: number,
  placement?: ShadowPlacement,
): VtreeImpl.ChildNodeContext {
  const nodeContext = new VtreeImpl.NodeContext(
    sourceNode,
    parent,
    boxOffset,
    parent.formattingContext,
  );
  nodeContext.blockContainer = VtreeImpl.blockContainerForChildrenOf(parent);
  if (placement) {
    applyShadowPlacement(nodeContext, placement);
  }
  return nodeContext as VtreeImpl.ChildNodeContext;
}

export function openSiblingOf(
  sourceNode: Node,
  sibling: VtreeImpl.NodeContext,
  boxOffset: number,
): VtreeImpl.NodeContext {
  const parent = sibling.parent;
  const nodeContext = new VtreeImpl.NodeContext(
    sourceNode,
    parent,
    boxOffset,
    (parent ?? sibling).formattingContext,
  );
  nodeContext.blockContainer = sibling.blockContainer;
  return nodeContext;
}

export function openAt(
  sourceNode: Node,
  parent: VtreeImpl.NodeContext | null,
  boxOffset: number,
  formattingContext: Vtree.FormattingContext,
  placement: ShadowPlacement,
  head?: PositionHead,
): VtreeImpl.NodeContext {
  const nodeContext = new VtreeImpl.NodeContext(
    sourceNode,
    parent,
    boxOffset,
    formattingContext,
  );
  nodeContext.blockContainer =
    parent && VtreeImpl.blockContainerForChildrenOf(parent);
  if (head) {
    applyPositionHead(nodeContext, head);
  }
  applyShadowPlacement(nodeContext, placement);
  return nodeContext;
}

export function openFromStep(
  step: Vtree.NodePositionStep,
  parent: Vtree.NodeContext,
  head?: PositionHead,
): VtreeImpl.NodeContext {
  const parentContext = parent as VtreeImpl.NodeContext;
  const nodeContext = new VtreeImpl.NodeContext(
    step.node,
    parentContext,
    0,
    step.formattingContext ?? parentContext.formattingContext,
  );
  nodeContext.blockContainer =
    VtreeImpl.blockContainerForChildrenOf(parentContext);
  applyNodePositionStep(nodeContext, step);
  nodeContext.shadowSibling = step.shadowSibling
    ? openFromStep(step.shadowSibling, parent.copy())
    : null;
  if (head) {
    applyPositionHead(nodeContext, head);
  }
  return nodeContext;
}

export function openRootFromStep(
  step: Vtree.RootNodePositionStep,
  flowRootFormattingContext: Vtree.FormattingContext,
  head?: PositionHead,
): VtreeImpl.NodeContext {
  const nodeContext = new VtreeImpl.NodeContext(
    step.node,
    null,
    0,
    step.formattingContext ?? flowRootFormattingContext,
  );
  applyNodePositionStep(nodeContext, step);
  nodeContext.shadowSibling = step.shadowSibling;
  if (head) {
    applyPositionHead(nodeContext, head);
  }
  return nodeContext;
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
  Vtree.NodeContext,
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
>;

export function elementRenderResultOf(
  nodeContext: Vtree.NodeContext,
): ElementRenderResult {
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
  };
}

export function renderedElement(
  nodeContext: VtreeImpl.NodeContext,
  result: ElementRenderResult,
): VtreeImpl.NodeContext {
  nodeContext.nodeShadow = result.nodeShadow;
  nodeContext.containingBlockForAbsolute = result.containingBlockForAbsolute;
  nodeContext.flexContainer = result.flexContainer;
  nodeContext.inline = result.inline;
  nodeContext.breakPenalty = result.breakPenalty;
  nodeContext.clearSide = result.clearSide;
  nodeContext.floatReference = result.floatReference;
  nodeContext.floatMinWrapBlock = result.floatMinWrapBlock;
  nodeContext.columnSpan = result.columnSpan;
  nodeContext.breakAfter = result.breakAfter;
  nodeContext.pageType = result.pageType;
  nodeContext.captionSide = result.captionSide;
  nodeContext.inlineBorderSpacing = result.inlineBorderSpacing;
  nodeContext.blockBorderSpacing = result.blockBorderSpacing;
  nodeContext.footnotePolicy = result.footnotePolicy;
  nodeContext.firstPseudo = result.firstPseudo;
  nodeContext.afterIfContinues = result.afterIfContinues;
  nodeContext.whitespace = result.whitespace;
  nodeContext.hyphenateCharacter = result.hyphenateCharacter;
  nodeContext.breakWord = result.breakWord;
  nodeContext.repeatOnBreak = result.repeatOnBreak;
  return nodeContext;
}

export function afterEdgeOf<T extends Vtree.NodeContext>(nodeContext: T): T {
  const afterEdge = nodeContext.modify();
  afterEdge.after = true;
  return afterEdge;
}

export function afterEdgeAt<T extends Vtree.NodeContext>(
  nodeContext: T,
  boxOffset: number,
): T {
  const afterEdge = nodeContext.modify();
  afterEdge.boxOffset = boxOffset;
  afterEdge.after = true;
  return afterEdge;
}

export function detachedAfterEdgeOf<T extends Vtree.NodeContext>(
  nodeContext: T,
): T {
  const afterEdge = nodeContext.copy().modify();
  afterEdge.after = true;
  return afterEdge;
}

export function detachedBeforeEdgeOf<T extends Vtree.NodeContext>(
  nodeContext: T,
): T {
  const beforeEdge = nodeContext.copy().modify();
  beforeEdge.after = false;
  return beforeEdge;
}

export function skippedAfterOf<T extends Vtree.NodeContext>(nodeContext: T): T {
  const skipped = nodeContext.modify();
  skipped.after = true;
  if (!skipped.viewNode) {
    skipped.inline = true;
  }
  return skipped;
}

export function anchoredAfterOf<T extends Vtree.NodeContext>(
  nodeContext: T,
  anchor: Element,
  asInline: boolean,
): T {
  const anchored = nodeContext.modify();
  anchored.after = true;
  anchored.viewNode = anchor;
  if (asInline) {
    anchored.display = "inline";
  }
  return anchored;
}

export function withOverflow<T extends Vtree.NodeContext>(
  nodeContext: T,
  overflow: boolean,
): T {
  const modified = nodeContext.modify();
  modified.overflow = overflow;
  return modified;
}

export function setOverflow<T extends Vtree.NodeContext>(
  nodeContext: T,
  overflow: boolean,
): T {
  nodeContext.overflow = overflow;
  return nodeContext;
}

export function withBoxOffset<T extends Vtree.NodeContext>(
  nodeContext: T,
  boxOffset: number,
): T {
  const modified = nodeContext.modify();
  modified.boxOffset = boxOffset;
  return modified;
}

export function setBoxOffset<T extends Vtree.NodeContext>(
  nodeContext: T,
  boxOffset: number,
): T {
  nodeContext.boxOffset = boxOffset;
  return nodeContext;
}

export function withOffsetInNode<T extends Vtree.NodeContext>(
  nodeContext: T,
  offsetInNode: number,
): T {
  const modified = nodeContext.modify();
  modified.offsetInNode = offsetInNode;
  return modified;
}

export function textBrokenAt<T extends Vtree.NodeContext>(
  nodeContext: T,
  viewIndex: number,
): T {
  const modified = nodeContext.modify();
  modified.offsetInNode += viewIndex;
  modified.breakBefore = null;
  return modified;
}

export function withBreakBefore<T extends Vtree.NodeContext>(
  nodeContext: T,
  breakBefore: string | null,
): T {
  const modified = nodeContext.modify();
  modified.breakBefore = breakBefore;
  return modified;
}

export function setBreakBefore<T extends Vtree.NodeContext>(
  nodeContext: T,
  breakBefore: string | null,
): T {
  nodeContext.breakBefore = breakBefore;
  return nodeContext;
}

export function withoutFloat<T extends Vtree.NodeContext>(nodeContext: T): T {
  const modified = nodeContext.modify();
  modified.floatSide = null;
  modified.floatReference = PageFloats.FloatReference.INLINE;
  modified.clearSide = null;
  return modified;
}

export function setClearSpacer<T extends Vtree.NodeContext>(
  nodeContext: T,
  clearSpacer: Element | null,
): T {
  nodeContext.clearSpacer = clearSpacer;
  return nodeContext;
}

export function setRepeatOnBreak<T extends Vtree.NodeContext>(
  nodeContext: T,
  repeatOnBreak: string | null,
): T {
  nodeContext.repeatOnBreak = repeatOnBreak;
  return nodeContext;
}

export function setFragmentIndex<T extends Vtree.NodeContext>(
  nodeContext: T,
  fragmentIndex: number,
): T {
  nodeContext.fragmentIndex = fragmentIndex;
  return nodeContext;
}

export function setPluginProp<T extends Vtree.NodeContext>(
  nodeContext: T,
  name: string,
  value: Vtree.NodeContext["pluginProps"][string],
): T {
  nodeContext.pluginProps[name] = value;
  return nodeContext;
}

export function setViewNode<T extends Vtree.NodeContext>(
  nodeContext: T,
  viewNode: Element | Text | null,
): T {
  nodeContext.viewNode = viewNode;
  return nodeContext;
}

export function setPreprocessedTextContent<T extends Vtree.NodeContext>(
  nodeContext: T,
  preprocessedTextContent: Diff.Change[],
): T {
  nodeContext.preprocessedTextContent = preprocessedTextContent;
  return nodeContext;
}

export function setInline<T extends Vtree.NodeContext>(
  nodeContext: T,
  inline: boolean,
): T {
  nodeContext.inline = inline;
  return nodeContext;
}

export function setShadowContext<T extends Vtree.NodeContext>(
  nodeContext: T,
  shadowContext: Vtree.ShadowContext | null,
): T {
  nodeContext.shadowContext = shadowContext;
  return nodeContext;
}

export function setShadowSibling<T extends Vtree.NodeContext>(
  nodeContext: T,
  shadowSibling: Vtree.NodeContext | null,
): T {
  nodeContext.shadowSibling = shadowSibling;
  return nodeContext;
}

export function toNodePosition(
  nodeContext: Vtree.NodeContext,
): Vtree.NodePosition {
  return nodeContext.toNodePosition();
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
