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
import { Layout, Vtree } from "./types";

/**
 * A large gap value used to separate columns when using the browser's
 * multi-column feature for page/column breaking.
 * This value should be significantly larger than any objects in the layout
 * to prevent overlapping content between columns, but not too large to cause
 * problems with browser rendering limits.
 */
const BIG_GAP = 100000;

/**
 * Enable page/column breaking using the browser's multi-column feature.
 * This function sets CSS properties on the column element to create a
 * single-column (column-count: 1) that splits into multiple columns
 * when content overflows the column's size. The large column gap
 * (column-gap) ensures that the browser creates new columns
 * apart from the original column position, and it helps determine
 * page/column breaking positions in our layout processing.
 */
export function setBrowserColumnBreaking(column: Vtree.Container): void {
  const style = column.element.style;
  style.columnGap = `${BIG_GAP - (column.vertical ? column.height : column.width)}px`;
  style.columnFill = "auto";
  style.columnCount = "1";
  // Workaround for Safari/WebKit(< 26.2) bug (column-count: 1 should create a multi-column container)
  // https://bugs.webkit.org/show_bug.cgi?id=299836
  style.columnWidth = "0";
}

/**
 * Disable the browser's multi-column feature for page/column breaking.
 * This function resets the CSS properties set by `setBrowserColumnBreaking`.
 */
export function unsetBrowserColumnBreaking(column: Vtree.Container): void {
  const style = column.element.style;
  style.columnWidth = "";
  style.columnCount = "";
  style.columnGap = "";
  style.columnFill = "";
}

/**
 * Check if the browser's multi-column feature is being used for page/column breaking.
 */
export function isUsingBrowserColumnBreaking(column: Vtree.Container): boolean {
  return column.element.style.columnCount === "1";
}

/**
 * Mark the column as a root column for Vivliostyle layout processing.
 */
export function setAsRootColumn(column: Vtree.Container): void {
  column.element.setAttribute("data-vivliostyle-column", "true");
}

/**
 * Check if the column is marked as a root column for Vivliostyle layout processing.
 */
export function isRootColumn(column: Vtree.Container): boolean {
  return column.element.hasAttribute("data-vivliostyle-column");
}

/**
 * Check if the client rectangle of an element or range is located
 * in a column beyond the current one due to the browser's column breaking.
 *
 * @param rect - The client rectangle to check.
 * @param vertical - Whether the layout is vertical.
 * @return the number of columns the end edge of the rectangle is after the current column.
 */
export function checkIfBeyondColumnBreaks(
  rect: Vtree.ClientRect,
  vertical: boolean,
): number {
  const distance = vertical
    ? rect.bottom
    : Math.max(Math.abs(rect.left), Math.abs(rect.right));
  return Math.round(distance / BIG_GAP);
}

/**
 * Adjust the client rectangle of an element or range to account for
 * the browser's column breaking.
 * This function modifies the rectangle's coordinates to ensure that
 * if the rectangle is located in a column beyond the current one,
 * its position in the block-progression direction is moved accordingly
 * so that overflow checks can be performed based solely on the
 * block-progression position.
 *
 * @param rect - The client rectangle to check.
 * @param vertical - Whether the layout is vertical.
 * @return the number of columns the start edge of the rectangle is after the current column.
 */
export function adjustRectForColumnBreaking(
  rect: Vtree.ClientRect,
  vertical: boolean,
): number {
  const columnOverEnd = checkIfBeyondColumnBreaks(rect, vertical);
  if (columnOverEnd === 0) {
    return 0;
  }
  const distanceStart = vertical
    ? rect.top
    : Math.min(Math.abs(rect.left), Math.abs(rect.right));
  const columnOverStart = Math.round(distanceStart / BIG_GAP);
  const shiftStart = columnOverStart * BIG_GAP;
  let shiftEnd = columnOverEnd * BIG_GAP;
  if (vertical) {
    // vertical writing mode, columns are top to bottom
    rect.top -= shiftStart;
    rect.bottom -= shiftEnd;
    if (rect.bottom < rect.top) {
      rect.bottom += BIG_GAP;
      shiftEnd -= BIG_GAP;
    }
    rect.right -= shiftStart;
    rect.left -= shiftEnd;
  } else if (rect.left < -BIG_GAP / 2) {
    // columns are right to left
    rect.right += shiftStart;
    rect.left += shiftEnd;
    if (rect.left > rect.right) {
      rect.left -= BIG_GAP;
      shiftEnd += BIG_GAP;
    }
    rect.top += shiftStart;
    rect.bottom += shiftEnd;
  } else {
    // columns are left to right
    rect.left -= shiftStart;
    rect.right -= shiftEnd;
    if (rect.right < rect.left) {
      rect.right += BIG_GAP;
      shiftEnd -= BIG_GAP;
    }
    rect.top += shiftStart;
    rect.bottom += shiftEnd;
  }
  rect.width = rect.right - rect.left;
  rect.height = rect.bottom - rect.top;

  return columnOverStart;
}

/**
 * Adjust multiple client rectangles for column breaking.
 */
export function adjustRectsForColumnBreaking(
  rects: Vtree.ClientRect[],
  vertical: boolean,
): void {
  for (let i = 0; i < rects.length; i++) {
    adjustRectForColumnBreaking(rects[i], vertical);
  }
}

/**
 * Get the client rectangle of an element, adjusted for column breaking.
 */
export function getElementClientRectAdjusted(
  clientLayout: Vtree.ClientLayout,
  element: Element,
  vertical: boolean,
): Vtree.ClientRect {
  const rect = clientLayout.getElementClientRect(element);
  const columnOver = adjustRectForColumnBreaking(rect, vertical);

  // Workaround for Chromium bug on table fragmentation:
  //   https://issues.chromium.org/issues/458852795
  // To prevent the table cell from moving to the next column without breaking inside the cell due to the bug,
  // we try to reduce the column height so that a column break inside the cell can occur.
  if (columnOver === 1) {
    let style = clientLayout.getElementComputedStyle(element);
    if (
      style.display === "table-cell" ||
      (element.className === "-vivliostyle-table-cell-container" &&
        element.parentElement?.parentElement &&
        (style = clientLayout.getElementComputedStyle(
          element.parentElement.parentElement,
        )).display === "table-cell")
    ) {
      const columnElem = element.closest(
        "[data-vivliostyle-column]",
      ) as HTMLElement;
      const columnStyle = columnElem?.style;
      const blockSizeP = vertical ? "width" : "height";
      const columnHeight = columnStyle && parseFloat(columnStyle[blockSizeP]);
      if (columnHeight) {
        let columnHeight2 = columnHeight;
        let columnOver2 = columnOver;
        const paddingBlockEnd = parseFloat(style.paddingBlockEnd);
        const borderBlockEndWidth = parseFloat(style.borderBlockEndWidth);
        let count = Math.ceil(paddingBlockEnd + borderBlockEndWidth);
        while (
          count-- > 0 &&
          columnOver2 === columnOver &&
          --columnHeight2 > 0
        ) {
          columnStyle[blockSizeP] = `${columnHeight2}px`;
          const rect2 = clientLayout.getElementClientRect(element);
          columnOver2 = adjustRectForColumnBreaking(rect2, vertical);
          if (
            columnOver2 < columnOver ||
            (columnOver2 === columnOver &&
              (vertical ? rect2.right > rect.right : rect2.top < rect.top))
          ) {
            columnElem.setAttribute(
              "data-vivliostyle-column-height-adjusted",
              "true",
            );
            return rect2;
          }
        }
        columnStyle[blockSizeP] = `${columnHeight}px`;
      }
    }
  }
  return rect;
}

/**
 * Clear forced column breaks between two nodes.
 * This is used to prevent unnecessary blank pages.
 */
export function clearForcedColumnBreaks(prevNode: Node, currNode: Node): void {
  if (prevNode.nodeType === 1) {
    const elem = prevNode as HTMLElement;
    if (elem.style?.breakAfter === "column") {
      elem.style.breakAfter = "";
    }
  }
  if (currNode.nodeType === 1) {
    const elem = currNode as HTMLElement;
    if (elem.style?.breakBefore === "column") {
      elem.style.breakBefore = "";
    }
  }
}

/**
 * Find the nearest ancestor element that establishes a multi-column
 * layout but is not the root column element.
 */
export function findAncestorNonRootMultiColumn(node: Node): Element | null {
  for (
    let elem = node.nodeType === 1 ? (node as Element) : node.parentElement;
    elem;
    elem = elem.parentElement
  ) {
    const style = (elem as HTMLElement).style;
    if (!style) {
      break;
    }
    if (elem.hasAttribute("data-vivliostyle-column")) {
      // This is the root column element.
      break;
    }
    if (
      !isNaN(parseFloat(style.columnCount)) ||
      !isNaN(parseFloat(style.columnWidth))
    ) {
      return elem;
    }
    if (style.position === "absolute") {
      break;
    }
  }
  return null;
}

/**
 * Fix overflow caused by forced column breaks in non-root multi-column elements.
 */
export function fixOverflowAtForcedColumnBreak(node: Node): void {
  if (node.nodeType !== 1) {
    return;
  }
  const element = node as HTMLElement;
  const elementStyle = element.style;
  const breakBeforeColumn = elementStyle?.breakBefore === "column";
  const prevElem = element.previousElementSibling as HTMLElement;
  const breakAfterColumn = prevElem && prevElem.style?.breakAfter === "column";
  if (!breakBeforeColumn && !breakAfterColumn) {
    return;
  }
  const nonRootMultiColumn = findAncestorNonRootMultiColumn(element);
  if (!nonRootMultiColumn) {
    return;
  }
  const multiColumnStyle =
    nonRootMultiColumn.ownerDocument.defaultView.getComputedStyle(
      nonRootMultiColumn,
    );
  const { writingMode, direction, columnGap, fontSize } = multiColumnStyle;
  const vertical =
    writingMode === "vertical-rl" || writingMode === "vertical-lr";
  const isRtl = direction === "rtl";
  const halfGap = (parseFloat(columnGap) || parseFloat(fontSize) || 16) / 2;

  // Check if the element is overflowing the multi-column box
  const multiColumnRect = nonRootMultiColumn.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const columnOverflow = vertical
    ? elementRect.top > multiColumnRect.bottom + halfGap
    : isRtl
      ? elementRect.right < multiColumnRect.left - halfGap
      : elementRect.left > multiColumnRect.right + halfGap;
  if (columnOverflow) {
    // Fix overflow by removing the forced breaks and adding a large margin.
    // This large margin will cause a page break in our layout processing.
    if (breakBeforeColumn) {
      elementStyle.breakBefore = "";
    }
    if (breakAfterColumn && prevElem) {
      prevElem.style.breakAfter = "";
    }
    elementStyle.marginBlockStart = `${BIG_GAP}px`;
  }
}

/**
 * Calculate the position of the "after" edge in the block-progression.
 * Returns the edge position in pixels if it was determined successfully,
 * and returns NaN if the position could not be determined and the node
 * should be considered zero-height.
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
      element.localName === "br" ||
      element.localName === "wbr" ||
      (style &&
        Display.isInlineLevel(style.display) &&
        /^([\d\.]|super|(text-)?top)/.test(style.verticalAlign))
    ) {
      // Avoid incorrect edge calculation at BR or WBR element,
      // or inline element with positive vertical-align (issue #811).
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
      const cbox = getElementClientRectAdjusted(
        clientLayout,
        element,
        vertical,
      );
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

    // Adjust boxes' positions for column breaking
    adjustRectsForColumnBreaking(boxes, vertical);

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
  const usingBrowserColumnBreaking = isUsingBrowserColumnBreaking(column);
  if (usingBrowserColumnBreaking) {
    unsetBrowserColumnBreaking(column);
  }
  const rect = column.clientLayout.getElementClientRect(element);
  if (usingBrowserColumnBreaking) {
    setBrowserColumnBreaking(column);
  }
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

/**
 * Marks an element as "special". It should not be used in bbox calculations.
 */
export const SPECIAL_ATTR = "data-adapt-spec";

export function isSpecial(e: Element): boolean {
  return !!e.getAttribute(SPECIAL_ATTR);
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
    if (
      (p.display !== "inline" || p.vertical !== p.parent?.vertical) &&
      Display.isInlineLevel(p.display)
    ) {
      return p;
    }
  }
  return null;
}
