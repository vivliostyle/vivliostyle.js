/**
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
 * @fileoverview Diff utility
 */

import fastdiff from "fast-diff";

export type Change = (number | string)[];

export function diffChars(originalText: string, newText: string): Change[] {
  return fastdiff(originalText, newText, 0);
}

/**
 * @returns string
 */
export function restoreOriginalText(changes: Change[]): any {
  return changes.reduce((result, item) => {
    if (item[0] === fastdiff.INSERT) {
      return result;
    }
    return result + item[1];
  }, "");
}

/**
 * @returns string
 */
export function restoreNewText(changes: Change[]): any {
  return changes.reduce((result, item) => {
    if (item[0] === fastdiff.DELETE) {
      return result;
    }
    return result + item[1];
  }, "");
}

export function resolveNewIndex(changes: Change[], oldIndex: number): number {
  return resolveIndex(changes, oldIndex, 1);
}

export function resolveOriginalIndex(
  changes: Change[],
  newIndex: number,
): number {
  return resolveIndex(changes, newIndex, -1);
}

export function resolveIndex(
  changes: Change[],
  index: number,
  coef: number,
): number {
  let diff = 0;
  let current = 0;
  changes.some((change) => {
    for (let i = 0; i < (change[1] as string).length; i++) {
      switch ((change[0] as number) * coef) {
        case fastdiff.INSERT:
          diff++;
          break;
        case fastdiff.DELETE:
          diff--;
          current++;
          break;
        case fastdiff.EQUAL:
          current++;
          break;
      }
      if (current > index) {
        return true;
      }
    }
    return false;
  });
  return Math.max(Math.min(index, current - 1) + diff, 0);
}
