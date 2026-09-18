/**
 * Copyright 2026 Vivliostyle Foundation
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
 * @fileoverview Client rects of DOM ranges, measured through one Range per
 * document.
 *
 * A live Range stays registered with its document until it is
 * garbage-collected, and mutating the document costs time in proportion to the
 * number of registered Ranges. Range.detach() does nothing, so a Range created
 * for a single measurement keeps adding that cost until an unpredictable
 * garbage collection.
 */
import { Vtree } from "./types";

export type RangeBoundary =
  | { readonly position: "at"; readonly node: Node; readonly offset: number }
  | { readonly position: "before" | "after"; readonly node: Node };

export function at(node: Node, offset: number): RangeBoundary {
  return { position: "at", node, offset };
}

export function before(node: Node): RangeBoundary {
  return { position: "before", node };
}

export function after(node: Node): RangeBoundary {
  return { position: "after", node };
}

const measurementRanges = new WeakMap<Document, Range>();

function measure<T>(
  node: Node,
  setBoundaries: (range: Range) => void,
  read: (range: Range) => T,
): T {
  const document = node.ownerDocument ?? (node as Document);
  let range = measurementRanges.get(document);
  if (!range) {
    range = document.createRange();
    measurementRanges.set(document, range);
  }
  try {
    setBoundaries(range);
    return read(range);
  } finally {
    range.setStart(document, 0);
    range.collapse(true);
  }
}

function setBoundariesBetween(
  range: Range,
  start: RangeBoundary,
  end: RangeBoundary,
): void {
  if (start.position === "at") {
    range.setStart(start.node, start.offset);
  } else if (start.position === "before") {
    range.setStartBefore(start.node);
  } else {
    range.setStartAfter(start.node);
  }
  if (end.position === "at") {
    range.setEnd(end.node, end.offset);
  } else if (end.position === "before") {
    range.setEndBefore(end.node);
  } else {
    range.setEndAfter(end.node);
  }
}

export function getClientRectsBetween(
  start: RangeBoundary,
  end: RangeBoundary,
): DOMRectList {
  return measure(
    start.node,
    (range) => setBoundariesBetween(range, start, end),
    (range) => range.getClientRects(),
  );
}

export function getClientRectsOfNode(node: Node): DOMRectList {
  return measure(
    node,
    (range) => range.selectNode(node),
    (range) => range.getClientRects(),
  );
}

export function getLayoutClientRectsBetween(
  clientLayout: Vtree.ClientLayout,
  start: RangeBoundary,
  end: RangeBoundary,
): Vtree.ClientRect[] {
  return measure(
    start.node,
    (range) => setBoundariesBetween(range, start, end),
    (range) => clientLayout.getRangeClientRects(range),
  );
}

export function getLayoutClientRectsOfNodeContents(
  clientLayout: Vtree.ClientLayout,
  node: Node,
): Vtree.ClientRect[] {
  return measure(
    node,
    (range) => range.selectNodeContents(node),
    (range) => clientLayout.getRangeClientRects(range),
  );
}
