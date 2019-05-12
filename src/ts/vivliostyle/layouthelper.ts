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
 * @fileoverview Helper functions of Layout.
 */
import * as base from '../adapt/base';
import * as vtreeImpl from '../adapt/vtree';
import * as logging from './logging';
import {layout, vtree} from './types';

/**
 * Though method used to be used as a workaround for Chrome bug, it seems that
 * the bug has been already fixed:
 *   https://bugs.chromium.org/p/chromium/issues/detail?id=297808
 * We now use this method as a workaround for Firefox bug:
 *   https://bugzilla.mozilla.org/show_bug.cgi?id=1159309
 */
export const fixBoxesForNode = (
  clientLayout: vtree.ClientLayout,
  boxes: vtree.ClientRect[],
  node: Node
): vtree.ClientRect[] => {
  const fullRange = node.ownerDocument.createRange();
  fullRange.setStart(node, 0);
  fullRange.setEnd(node, node.textContent.length);
  const fullBoxes = clientLayout.getRangeClientRects(fullRange);
  const result = [];
  for (const box of boxes) {
    let k;
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
      logging.logger.warn('Could not fix character box');
      result.push(box);
    }
  }
  return result;
};

/**
 * Calculate the position of the "after" edge in the block-progression
 * dimension. Return 0 if position was determined successfully and return
 * non-zero if position could not be determined and the node should be
 * considered zero-height.
 */
export const calculateEdge = (
  nodeContext: vtree.NodeContext,
  clientLayout: vtree.ClientLayout,
  extraOffset: number,
  vertical: boolean
): number => {
  const node = nodeContext.viewNode;
  if (!node) {
    return NaN;
  }
  if (node.nodeType == 1) {
    if (nodeContext.after || !nodeContext.inline) {
      const cbox = clientLayout.getElementClientRect(node as Element);
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
    if (vertical && base.checkVerticalBBoxBug(document.body)) {
      boxes = fixBoxesForNode(clientLayout, boxes, node);
    }
    let maxSize = 0;

    // Get first of the widest boxes (works around Chrome results for soft
    // hyphens).
    for (const box of boxes) {
      const boxSize = vertical ? box.bottom - box.top : box.right - box.left;
      if (
        box.right > box.left &&
        box.bottom > box.top &&
        (isNaN(edge) || boxSize > maxSize)
      ) {
        edge = vertical ? box.left : box.bottom;
        maxSize = boxSize;
      }
    }
    return edge;
  }
};

export const getElementHeight = (
  element: Element,
  column: layout.Column,
  vertical: boolean
): number => {
  const rect = column.clientLayout.getElementClientRect(element);
  const margin = column.getComputedMargin(element);
  return vertical
    ? rect['width'] + margin['left'] + margin['right']
    : rect['height'] + margin['top'] + margin['bottom'];
};

export const isOrphan = (node: Node): boolean => {
  while (node) {
    if (node.parentNode === node.ownerDocument) {
      return false;
    }
    node = node.parentNode;
  }
  return true;
};

export const removeFollowingSiblings = (
  parentNode: Node,
  viewNode: Node
): void => {
  if (!parentNode) {
    return;
  }
  let lastChild: Node;
  while ((lastChild = parentNode.lastChild) != viewNode) {
    parentNode.removeChild(lastChild);
  }
};

export const isSpecial = (e: Element): boolean =>
  !!e.getAttribute(vtreeImpl.SPECIAL_ATTR);

export const isSpecialNodeContext = (
  nodeContext: vtree.NodeContext
): boolean => {
  if (!nodeContext) {
    return false;
  }
  const viewNode = nodeContext.viewNode;
  if (viewNode && viewNode.nodeType === 1) {
    return isSpecial(viewNode as Element);
  } else {
    return false;
  }
};
