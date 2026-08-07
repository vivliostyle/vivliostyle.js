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
import { Vtree } from "./types";

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
