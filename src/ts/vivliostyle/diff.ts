/**
 * Copyright 2016 Trim-marks Inc.
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

import * as fastdiff from 'fast-diff';

import * as namespace from './namespace';

type Change = (number|string)[];

export {Change};

export const diffChars = (originalText: string, newText: string): Change[] =>
    fastdiff(originalText, newText, 0);

/**
 * @returns string
 */
export const restoreOriginalText = (changes: Change[]): any =>
    changes.reduce((result, item) => {
      if (item[0] === fastdiff.INSERT) {
        return result;
      }
      return result + item[1];
    }, '');

/**
 * @returns string
 */
export const restoreNewText = (changes: Change[]): any =>
    changes.reduce((result, item) => {
      if (item[0] === fastdiff.DELETE) {
        return result;
      }
      return result + item[1];
    }, '');

export const resolveNewIndex = (changes: Change[], oldIndex: number): number =>
    resolveIndex(changes, oldIndex, 1);

export const resolveOriginalIndex =
    (changes: Change[], newIndex: number): number =>
        resolveIndex(changes, newIndex, -1);

export const resolveIndex =
    (changes: Change[], index: number, coef: number): number => {
      let diff = 0;
      let current = 0;
      changes.some((change) => {
        for (let i = 0; i < change[1].length; i++) {
          switch (change[0] * coef) {
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
    };
