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
import * as Logging from "./logging";
import * as VtreeImpl from "./vtree";
import { Layout, Vtree } from "./types";

/**
 * Though method used to be used as a workaround for Chrome bug, it seems that
 * the bug has been already fixed:
 *   https://bugs.chromium.org/p/chromium/issues/detail?id=297808
 * We now use this method as a workaround for Firefox bug:
 *   https://bugzilla.mozilla.org/show_bug.cgi?id=1159309
 */
export function fixBoxesForNode(
  clientLayout: Vtree.ClientLayout,
  boxes: Vtree.ClientRect[],
  node: Node,
): Vtree.ClientRect[] {
  const fullRange = node.ownerDocument.createRange();
  fullRange.setStart(node, 0);
  fullRange.setEnd(node, node.textContent.length);
  const fullBoxes = clientLayout.getRangeClientRects(fullRange);
  const result = [];
  for (const box of boxes) {
    let k: number;
    for (k = 0; k < fullBoxes.length; k++) {
      const fullBox = fullBoxes[k];
      if (
        box.top >= fullBox.top &&
        box.bottom <= fullBox.bottom &&
        Math.abs(box.left - fullBox.left) < 1
      ) {
        result.push({
          top: box.top,
          left: fullBox.left,
          bottom: box.bottom,
          right: fullBox.right,
        });
        break;
      }
    }
    if (k == fullBoxes.length) {
      Logging.logger.warn("Could not fix character box");
      result.push(box);
    }
  }
  return result;
}

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
  const element = node.nodeType == 1 ? (node as Element) : node.parentElement;
  if (element && element instanceof HTMLElement) {
    if (element.localName === "rt" && element.style["zoom"]) {
      // "zoom" is set in fixRubyTextFontSize() to fix the issue #673 for Chrome.
      // when zoom is set, it is hard to get the edge value, so return NaN.
      // (Fix for issues #804 and #808)
      return NaN;
    }
    if (/^([\d\.]|super|(text-)?top)/.test(element.style.verticalAlign)) {
      // (Fix for issue #811)
      return NaN;
    }
  }
  if (node.nodeType == 1) {
    if (nodeContext.after || !nodeContext.inline) {
      const cbox = clientLayout.getElementClientRect(node as Element);
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
    if (vertical && Base.checkVerticalBBoxBug(document.body)) {
      boxes = fixBoxesForNode(clientLayout, boxes, node);
    }
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
  let lastChild: Node;
  while ((lastChild = parentNode.lastChild) != viewNode) {
    parentNode.removeChild(lastChild);
  }
}

export function isSpecial(e: Element): boolean {
  return !!e.getAttribute(VtreeImpl.SPECIAL_ATTR);
}

const specialInlineDisplayTypes = {
  ruby: true,
  "ruby-base": true,
  "ruby-base-container": true,
  "ruby-text": true,
  "ruby-text-container": true,
  "inline-block": true,
  "inline-flex": true,
  "inline-grid": true,
  "inline-list-item": true,
  "inline-table": true,
};

export function isSpecialInlineDisplay(display: string): boolean {
  return !!specialInlineDisplayTypes[display];
}

export function isSpecialNodeContext(nodeContext: Vtree.NodeContext): boolean {
  if (!nodeContext) {
    return false;
  }
  const viewNode = nodeContext.viewNode;
  if (viewNode && viewNode.nodeType === 1 && isSpecial(viewNode as Element)) {
    return true;
  }
  for (let p = nodeContext.parent; p; p = p.parent) {
    if (isSpecialInlineDisplay(p.display)) {
      return true;
    }
  }
  return false;
}
