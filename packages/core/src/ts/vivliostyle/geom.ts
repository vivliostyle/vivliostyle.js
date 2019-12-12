/**
 * Copyright 2013 Google, Inc.
 * Copyright 2016 Trim-marks Inc.
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
 * @fileoverview Geom - Geometric utilities.
 */
import * as Logging from "../vivliostyle/logging";

export class Rect {
  constructor(
    public x1: number,
    public y1: number,
    public x2: number,
    public y2: number,
  ) {}
}

export class Point {
  constructor(public x: number, public y: number) {}
}

export class Insets {
  constructor(
    public left: number,
    public top: number,
    public right: number,
    public bottom: number,
  ) {}
}

export class Segment {
  constructor(
    public low: Point,
    public high: Point,
    public winding: number,
    public shapeId: number,
  ) {}
}

/**
 * A single band for exclusion result. Left float is from the left box edge
 * to x1. Right float is from x2 to the right box edge.
 */
export class Band {
  /** Left float. */
  left: Element | null = null;

  /** Right float. */
  right: Element | null = null;

  constructor(
    public y1: number,
    public y2: number,
    public x1: number,
    public x2: number,
  ) {}
}

export function segmentCompare(s1: Segment, s2: Segment): number {
  return s1.low.y - s2.low.y || s1.low.x - s2.low.x;
}

export class Shape {
  constructor(public points: Point[]) {}

  /**
   * Converts this shape to a sequence of Segments and adds segments to the
   * given array.
   * @param arr array to add segments.
   * @param id shapeId to write into segments.
   */
  addSegments(arr: Segment[], id: number): void {
    const points = this.points;
    const length = points.length;
    let prev = points[length - 1];
    for (let i = 0; i < length; i++) {
      const curr = points[i];
      let s: Segment;
      if (prev.y < curr.y) {
        s = new Segment(prev, curr, 1, id);
      } else {
        s = new Segment(curr, prev, -1, id);
      }
      arr.push(s);
      prev = curr;
    }
  }

  withOffset(offsetX: number, offsetY: number): Shape {
    const points = [];
    for (const p of this.points) {
      points.push(new Point(p.x + offsetX, p.y + offsetY));
    }
    return new Shape(points);
  }
}

export function shapeForEllipse(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
): Shape {
  const count = 20;
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i * 2 * Math.PI) / count;
    points.push(new Point(cx + rx * Math.sin(a), cy + ry * Math.cos(a)));
  }
  return new Shape(points);
}

export function shapeForRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): Shape {
  return new Shape([
    new Point(x1, y1),
    new Point(x2, y1),
    new Point(x2, y2),
    new Point(x1, y2),
  ]);
}

export function shapeForRectObj(r: Rect): Shape {
  return new Shape([
    new Point(r.x1, r.y1),
    new Point(r.x2, r.y1),
    new Point(r.x2, r.y2),
    new Point(r.x1, r.y2),
  ]);
}

export class BandIntersection {
  constructor(
    public x: number,
    public winding: number,
    public shapeId: number,
    public lowOrHigh: number,
  ) {}
}

export function intersectY(s: Segment, y: number): number {
  const x =
    s.low.x + ((s.high.x - s.low.x) * (y - s.low.y)) / (s.high.y - s.low.y);
  if (isNaN(x)) {
    throw new Error("Bad intersection");
  }
  return x;
}

export function addBandIntersections(
  intersections: BandIntersection[],
  s: Segment,
  y1: number,
  y2: number,
): void {
  let x1: number;
  let w1: number;
  let x2: number;
  let w2: number;
  if (s.high.y < y1) {
    Logging.logger.warn("Error: inconsistent segment (1)");
  }
  if (s.low.y <= y1) {
    // outside
    x1 = intersectY(s, y1);
    w1 = s.winding;
  } else {
    x1 = s.low.x;
    w1 = 0;
  }
  if (s.high.y >= y2) {
    // outside
    x2 = intersectY(s, y2);
    w2 = s.winding;
  } else {
    x2 = s.high.x;
    w2 = 0;
  }
  if (x1 < x2) {
    intersections.push(new BandIntersection(x1, w1, s.shapeId, -1));
    intersections.push(new BandIntersection(x2, w2, s.shapeId, 1));
  } else {
    intersections.push(new BandIntersection(x2, w2, s.shapeId, -1));
    intersections.push(new BandIntersection(x1, w1, s.shapeId, 1));
  }
}

export function mergeIntersections(
  intersections: BandIntersection[],
  includeCount: number,
  excludeCount: number,
): number[] {
  const shapeCount = includeCount + excludeCount;
  const windings1: number[] = Array(shapeCount);
  const windings2: number[] = Array(shapeCount);
  let i: number;
  for (i = 0; i <= shapeCount; i++) {
    windings1[i] = 0;
    windings2[i] = 0;
  }
  const xranges: number[] = [];
  let inside: boolean = false;
  const intersectionCount = intersections.length;
  for (let k = 0; k < intersectionCount; k++) {
    const intersection = intersections[k];
    windings1[intersection.shapeId] += intersection.winding;
    windings2[intersection.shapeId] += intersection.lowOrHigh;
    let stillInside = false;
    for (i = 0; i < includeCount; i++) {
      if (windings1[i] && !windings2[i]) {
        stillInside = true;
        break;
      }
    }
    if (stillInside) {
      for (i = includeCount; i <= shapeCount; i++) {
        if (windings1[i] || windings2[i]) {
          stillInside = false;
          break;
        }
      }
    }
    if (inside != stillInside) {
      xranges.push(intersection.x);
      inside = stillInside;
    }
  }
  return xranges;
}

/**
 * Round v up to make it a multiple of unit. If unit is zero, return v.
 */
export function ceil(v: number, unit: number): number {
  return unit ? Math.ceil(v / unit) * unit : v;
}

/**
 * Round v down to make it a multiple of unit. If unit is zero, return v.
 */
export function floor(v: number, unit: number): number {
  return unit ? Math.floor(v / unit) * unit : v;
}

export function rotatePoint(point: Point): Point {
  return new Point(point.y, -point.x);
}

/**
 * Vertical box to pseudo-horizontal coords.
 */
export function rotateBox(box: Rect): Rect {
  return new Rect(box.y1, -box.x2, box.y2, -box.x1);
}

/**
 * Pseudo-horizontal coords to vertical.
 */
export function unrotateBox(box: Rect): Rect {
  return new Rect(-box.y2, box.x1, -box.y1, box.x2);
}

export function rotateShape(shape: Shape): Shape {
  return new Shape(shape.points.map((point) => rotatePoint(point)));
}

export function shapesToBands(
  box: Rect,
  include: Shape[],
  exclude: Shape[],
  granularity: number,
  snapHeight: number,
  vertical: boolean,
): Band[] {
  if (vertical) {
    box = rotateBox(box);
    include = include.map((shape) => rotateShape(shape));
    exclude = exclude.map((shape) => rotateShape(shape));
  }
  const includeCount = include.length;
  const excludeCount = exclude ? exclude.length : 0;
  const result: Band[] = [];
  const segments: Segment[] = [];
  let i: number;
  let k: number;
  let segment: Segment;
  for (i = 0; i < includeCount; i++) {
    include[i].addSegments(segments, i);
  }
  for (i = 0; i < excludeCount; i++) {
    exclude[i].addSegments(segments, i + includeCount);
  }
  const segmentCount = segments.length;
  segments.sort(segmentCompare);
  let lowestIncludeIndex = 0;
  while (segments[lowestIncludeIndex].shapeId >= includeCount) {
    lowestIncludeIndex++;
  }
  let y = segments[lowestIncludeIndex].low.y;
  if (y > box.y1) {
    result.push(new Band(box.y1, y, box.x2, box.x2));
  }
  let segmentIndex = 0;
  const activeSegments: Segment[] = [];
  while (
    segmentIndex < segmentCount &&
    (segment = segments[segmentIndex]).low.y < y
  ) {
    if (segment.high.y > y) {
      activeSegments.push(segment);
    }
    segmentIndex++;
  }

  // process the segments from low to high y values
  while (segmentIndex < segmentCount || activeSegments.length > 0) {
    // calculate the height of the band to work with
    let y2 = box.y2; // band bottom
    // min possible y2
    const y2min = Math.min(
      ceil(Math.ceil(y + granularity), snapHeight),
      box.y2,
    );
    for (k = 0; k < activeSegments.length && y2 > y2min; k++) {
      segment = activeSegments[k];
      if (segment.low.x == segment.high.x) {
        // vertical
        if (segment.high.y < y2) {
          y2 = Math.max(floor(segment.high.y, snapHeight), y2min);
        }
      } else if (segment.low.x != segment.high.x) {
        // TODO: should we compare y???
        // slanted (not horizontal)
        y2 = y2min;
      }
    }
    if (y2 > box.y2) {
      y2 = box.y2;
    }

    // include new segments, decreasing y2 if needed
    while (
      segmentIndex < segmentCount &&
      (segment = segments[segmentIndex]).low.y < y2
    ) {
      if (segment.high.y < y) {
        segmentIndex++;
        continue;
      }
      if (segment.low.y < y2min) {
        if (segment.low.y == segment.high.y && segment.low.y == y) {
          // Horizontal segment that goes right at y is not active,
          // but consume it anyway
        } else {
          activeSegments.push(segment);
          y2 = y2min;
        }
        segmentIndex++;
      } else {
        // Do not consume it, consider bottom edge "outside"
        const yn = floor(segment.low.y, snapHeight);
        if (yn < y2) {
          y2 = yn;
        }
        break;
      }
    }

    // now look at the band with top at y and bottom at y2
    // activeSegments should list all segments that intersect that band

    // find all intersections with the band
    const bandIntersections: BandIntersection[] = [];
    for (k = 0; k < activeSegments.length; k++) {
      addBandIntersections(bandIntersections, activeSegments[k], y, y2);
    }
    bandIntersections.sort(
      (bi1, bi2) => bi1.x - bi2.x || bi1.lowOrHigh - bi2.lowOrHigh,
    );
    const xranges = mergeIntersections(
      bandIntersections,
      includeCount,
      excludeCount,
    );
    if (xranges.length == 0) {
      result.push(new Band(y, y2, box.x2, box.x2));
    } else {
      // get the widest
      let width = 0;
      let x = box.x1;
      for (k = 0; k < xranges.length; k += 2) {
        const rx = Math.max(box.x1, xranges[k]);
        const rw = Math.min(box.x2, xranges[k + 1]) - rx;
        if (rw > width) {
          width = rw;
          x = rx;
        }
      }
      if (width == 0) {
        // no space left
        result.push(new Band(y, y2, box.x2, box.x2));
      } else {
        result.push(
          new Band(y, y2, Math.max(x, box.x1), Math.min(x + width, box.x2)),
        );
      }
    }
    if (y2 == box.y2) {
      break;
    }
    y = y2;
    for (k = activeSegments.length - 1; k >= 0; k--) {
      if (activeSegments[k].high.y <= y2) {
        activeSegments.splice(k, 1);
      }
    }
  }
  normalize(box, result);
  return result;
}

export function normalize(box: Rect, bands: Band[]): void {
  let k = bands.length - 1;

  // Merge bands with the same x1, x2 and remove unneeded bands at the end.
  // Create fictious last band to merge unneeded bands at the end
  let currBand = new Band(box.y2, box.y2, box.x1, box.x2);
  while (k >= 0) {
    const prevBand = currBand; // result[k+1]
    currBand = bands[k];
    if (
      currBand.y2 - currBand.y1 < 1 || // Remove bands with height less than 1px
      (currBand.x1 == prevBand.x1 && currBand.x2 == prevBand.x2)
    ) {
      prevBand.y1 = currBand.y1; // merge
      bands.splice(k, 1);
      currBand = prevBand;
    }
    k--;
  }
}

/**
 * Find the index of the bottommost band so that y < band.y2
 */
export function findBand(bands: Band[], y: number): number {
  let low = 0;
  let high = bands.length;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (y >= bands[mid].y2) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return low;
}

/**
 * Find the uppermost rectangle contained in the specified rect which occupies
 * full width of the rect without overlapping with any band in the specified
 * bands.
 * @returns Returns null if such rectangle does not exist.
 */
export function findUppermostFullyOpenRect(
  bands: Band[],
  rect: Rect,
): Rect | null {
  if (!bands.length) {
    return rect;
  }
  let topEdge = rect.y1;
  let band: Band;
  let i: number;
  for (i = 0; i < bands.length; i++) {
    band = bands[i];
    if (
      band.y2 > rect.y1 &&
      band.x1 - 0.1 <= rect.x1 &&
      band.x2 + 0.1 >= rect.x2
    ) {
      break;
    } else {
      topEdge = Math.max(topEdge, band.y2);
    }
  }
  let bottomEdge = topEdge;
  for (; i < bands.length; i++) {
    band = bands[i];
    if (
      band.y1 >= rect.y2 ||
      band.x1 - 0.1 > rect.x1 ||
      band.x2 + 0.1 < rect.x2
    ) {
      break;
    } else {
      bottomEdge = band.y2;
    }
  }
  if (i === bands.length) {
    bottomEdge = rect.y2;
  } else {
    bottomEdge = Math.min(bottomEdge, rect.y2);
  }
  if (bottomEdge <= topEdge) {
    return null;
  } else {
    return new Rect(rect.x1, topEdge, rect.x2, bottomEdge);
  }
}

/**
 * Find the bottommost rectangle contained in the specified rect which occupies
 * full width of the rect without overlapping with any band in the specified
 * bands.
 * @returns Returns null if such rectangle does not exist.
 */
export function findBottommostFullyOpenRect(
  bands: Band[],
  rect: Rect,
): Rect | null {
  if (!bands.length) {
    return rect;
  }
  let bottomEdge = rect.y2;
  let band: Band;
  let i: number;
  for (i = bands.length - 1; i >= 0; i--) {
    band = bands[i];
    if (i === bands.length - 1 && band.y2 < rect.y2) {
      break;
    } else if (
      band.y1 < rect.y2 &&
      band.x1 - 0.1 <= rect.x1 &&
      band.x2 + 0.1 >= rect.x2
    ) {
      break;
    } else {
      bottomEdge = Math.min(bottomEdge, band.y1);
    }
  }
  let topEdge = Math.min(bottomEdge, band.y2);
  for (; i >= 0; i--) {
    band = bands[i];
    if (
      band.y2 <= rect.y1 ||
      band.x1 - 0.1 > rect.x1 ||
      band.x2 + 0.1 < rect.x2
    ) {
      break;
    } else {
      topEdge = band.y1;
    }
  }
  topEdge = Math.max(topEdge, rect.y1);
  if (bottomEdge <= topEdge) {
    return null;
  } else {
    return new Rect(rect.x1, topEdge, rect.x2, bottomEdge);
  }
}

/**
 * @param side either "left" or "right"
 */
export function positionFloat(
  box: Rect,
  bands: Band[],
  floatBox: Rect,
  side: string,
): boolean {
  let y = floatBox.y1;
  const floatWidth = floatBox.x2 - floatBox.x1;
  const floatHeight = floatBox.y2 - floatBox.y1;
  let index = findBand(bands, y);
  while (true) {
    // Check if it fits
    const floatBottom = y + floatHeight;
    if (floatBottom > box.y2) {
      return false;
    }

    // does not fit vertically
    let x1 = box.x1;
    let x2 = box.x2;
    for (let i = index; i < bands.length && bands[i].y1 < floatBottom; i++) {
      const band = bands[i];
      if (band.x1 > x1) {
        x1 = band.x1;
      }
      if (band.x2 < x2) {
        x2 = band.x2;
      }
    }
    if (x1 + floatWidth <= x2 || index >= bands.length) {
      if (side == "left") {
        floatBox.x1 = x1;
        floatBox.x2 = x1 + floatWidth;
      } else {
        floatBox.x1 = x2 - floatWidth;
        floatBox.x2 = x2;
      }
      floatBox.y2 += y - floatBox.y1;
      floatBox.y1 = y;
      return true;
    }
    y = bands[index].y2;
    index++;
  }
}

export function addFloatToBands(
  box: Rect,
  bands: Band[],
  floatBox: Rect,
  floatBands: Band[],
  side: string,
): void {
  if (!floatBands) {
    floatBands = [new Band(floatBox.y1, floatBox.y2, floatBox.x1, floatBox.x2)];
  }
  while (floatBands.length > 0 && floatBands[0].y2 <= box.y1) {
    floatBands.shift();
  }
  if (floatBands.length == 0) {
    return;
  }
  if (floatBands[0].y1 < box.y1) {
    floatBands[0].y1 = box.y1;
  }
  let band: Band;
  const lastY = bands.length == 0 ? box.y1 : bands[bands.length - 1].y2;
  if (lastY < box.y2) {
    // add the tail band that we typically don't keep, it will be cleared by
    // normalize()
    bands.push(new Band(lastY, box.y2, box.x1, box.x2));
  }
  let index = findBand(bands, floatBands[0].y1);
  for (const floatBand of floatBands) {
    if (index == bands.length) {
      break;
    }
    if (bands[index].y1 < floatBand.y1) {
      // split it
      band = bands[index];
      index++;
      bands.splice(index, 0, new Band(floatBand.y1, band.y2, band.x1, band.x2));
      band.y2 = floatBand.y1;
    }
    while (index < bands.length) {
      band = bands[index++];
      if (band.y2 > floatBand.y2) {
        // split it
        bands.splice(
          index,
          0,
          new Band(floatBand.y2, band.y2, band.x1, band.x2),
        );
        band.y2 = floatBand.y2;
      }
      if (floatBand.x1 != floatBand.x2) {
        // non-empty floatBand
        if (side == "left") {
          band.x1 = Math.min(floatBand.x2, box.x2);
        } else {
          band.x2 = Math.max(floatBand.x1, box.x1);
        }
      }
      if (band.y2 == floatBand.y2) {
        break;
      }
    }
  }
  normalize(box, bands);
}
