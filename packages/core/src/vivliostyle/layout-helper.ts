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
 * @fileoverview LayoutHelper - Helper functions of Layout.
 */
import * as Base from "./base";
import * as Display from "./display";
import * as Logging from "./logging";
import * as VtreeImpl from "./vtree";
import { Layout, Vtree } from "./types";

/**
 * Calculate the position of the "after" edge in the block-progression
 * dimension. Return 0 if position was determined successfully and return
 * non-zero if position could not be determined and the node should be
 * considered zero-height.
 */
export function calculateEdge(
  nodeContext: Vtree.NodeContext,
  clientLayout: Vtree.ClientLayout,
  extraOffset: number,
  vertical: boolean,
): number {
  const node = nodeContext.viewNode;
  if (!node) {
    return NaN;
  }

  // NOTE: Do not replace `node.nodeType === 1` with `node instanceof Element`,
  // which does not work when the node is inside iframe. (Issue #1000)

  const element = node.nodeType === 1 ? (node as Element) : node.parentElement;
  if (element && element.namespaceURI === Base.NS.XHTML) {
    const style = (element as HTMLElement).style;
    if (
      style &&
      Display.isInlineLevel(style.display) &&
      /^([\d\.]|super|(text-)?top)/.test(style.verticalAlign)
    ) {
      // (Fix for issue #811)
      return NaN;
    }
  }
  if (node === element) {
    if (nodeContext.after || !nodeContext.inline) {
      if (
        nodeContext.after &&
        !nodeContext.inline &&
        element.querySelector("ruby")
      ) {
        // Workaround for issue #987 (unnecessary break caused by ruby)
        const parentNode = element.parentNode;
        const nextSibling = element.nextSibling;
        parentNode.removeChild(element);
        parentNode.insertBefore(element, nextSibling);
      }
      const cbox = clientLayout.getElementClientRect(element);
      if (
        cbox.left === 0 &&
        cbox.top === 0 &&
        cbox.right === 0 &&
        cbox.bottom === 0
      ) {
        // getBoundingClientRect() returns 0,0,0,0 for WBR element (Chrome)
        // (Fix for issue #802)
        return NaN;
      }
      if (cbox.right >= cbox.left && cbox.bottom >= cbox.top) {
        if (nodeContext.after) {
          return vertical ? cbox.left : cbox.bottom;
        } else {
          return vertical ? cbox.right : cbox.top;
        }
      }
    }
    return NaN;
  } else {
    let edge = NaN;
    const range = node.ownerDocument.createRange();
    const length = node.textContent.length;
    if (!length) {
      return NaN;
    }
    if (nodeContext.after) {
      extraOffset += length;
    }
    if (extraOffset >= length) {
      extraOffset = length - 1;
    }
    range.setStart(node, extraOffset);
    range.setEnd(node, extraOffset + 1);
    let boxes = clientLayout.getRangeClientRects(range);
    boxes = boxes.filter((box) => box.right > box.left && box.bottom > box.top);
    if (!boxes.length) {
      return NaN;
    }
    if (vertical) {
      edge = Math.min.apply(
        null,
        boxes.map((box) => box.left),
      );
    } else {
      edge = Math.max.apply(
        null,
        boxes.map((box) => box.bottom),
      );
    }
    return edge;
  }
}

export function getElementHeight(
  element: Element,
  column: Layout.Column,
  vertical: boolean,
): number {
  const rect = column.clientLayout.getElementClientRect(element);
  const margin = column.getComputedMargin(element);
  return vertical
    ? rect["width"] + margin["left"] + margin["right"]
    : rect["height"] + margin["top"] + margin["bottom"];
}

export function isOrphan(node: Node): boolean {
  while (node) {
    if (node.parentNode === node.ownerDocument) {
      return false;
    }
    node = node.parentNode;
  }
  return true;
}

export function removeFollowingSiblings(
  parentNode: Node,
  viewNode: Node,
): void {
  if (!parentNode) {
    return;
  }
  for (
    let lastChild = parentNode.lastChild, prevSibling = lastChild;
    lastChild !== viewNode;
    lastChild = prevSibling
  ) {
    prevSibling = lastChild.previousSibling;
    if (
      lastChild.nodeType === 1 &&
      (lastChild as Element).hasAttribute("data-vivliostyle-float-box-moved") &&
      (viewNode as HTMLElement).style?.display === "inline"
    ) {
      // Do not remove float box moved after parent inline (Issue #1383, #1422)
      continue;
    }
    parentNode.removeChild(lastChild);
  }
}

export function isSpecial(e: Element): boolean {
  return !!e.getAttribute(VtreeImpl.SPECIAL_ATTR);
}

export function isOutOfFlow(node: Node): boolean {
  if (!(node?.nodeType === 1)) return false;
  const e = node as HTMLElement;
  if (isSpecial(e)) return true;
  const position = e.style?.position;
  return position === "absolute" || position === "fixed";
}

export function isSpecialNodeContext(nodeContext: Vtree.NodeContext): boolean {
  const viewNode = nodeContext?.viewNode;
  return viewNode?.nodeType === 1 && isSpecial(viewNode as Element);
}

export function isSpecialInlineDisplay(display: string): boolean {
  return (
    display !== "inline" &&
    (Display.isInlineLevel(display) || Display.isRubyInternalDisplay(display))
  );
}

export function findAncestorSpecialInlineNodeContext(
  nodeContext: Vtree.NodeContext,
): Vtree.NodeContext | null {
  for (let p = nodeContext.parent; p; p = p.parent) {
    if (p.display !== "inline" && Display.isInlineLevel(p.display)) {
      return p;
    }
  }
  return null;
}
