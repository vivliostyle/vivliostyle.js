/**
 * Copyright 2015 Trim-marks Inc.
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
 * @fileoverview Constants
 */
import * as namespace from './namespace';

/**
 * Debug flag.
 */
export const isDebug: boolean = false;

/**
 * Page progression direction.
 * @enum {string}
 */
export enum PageProgression {
  LTR = 'ltr',
  RTL = 'rtl'
}
const PageProgression = PageProgression;

/**
 * Return PageProgressino corresponding to the specified string
 */
PageProgression.of = (str: string): PageProgression => {
  switch (str) {
    case 'ltr':
      return PageProgression.LTR;
    case 'rtl':
      return PageProgression.RTL;
    default:
      throw new Error(`unknown PageProgression: ${str}`);
  }
};
namespace.exportSymbol(
    'vivliostyle.constants.PageProgression', PageProgression);
goog.exportProperty(PageProgression, 'LTR', PageProgression.LTR);
goog.exportProperty(PageProgression, 'RTL', PageProgression.RTL);

/**
 * Page side (left/right).
 * @enum {string}
 */
export enum PageSide {
  LEFT = 'left',
  RIGHT = 'right'
}
const PageSide = PageSide;
namespace.exportSymbol('vivliostyle.constants.PageSide', PageSide);
goog.exportProperty(PageSide, 'LEFT', PageSide.LEFT);
goog.exportProperty(PageSide, 'RIGHT', PageSide.RIGHT);

/**
 * Viewer ready state.
 * @enum {string}
 */
export enum ReadyState {
  LOADING = 'loading',
  INTERACTIVE = 'interactive',
  COMPLETE = 'complete'
}
const ReadyState = ReadyState;
namespace.exportSymbol('vivliostyle.constants.ReadyState', ReadyState);
goog.exportProperty(ReadyState, 'LOADING', ReadyState.LOADING);
goog.exportProperty(ReadyState, 'INTERACTIVE', ReadyState.INTERACTIVE);
goog.exportProperty(ReadyState, 'COMPLETE', ReadyState.COMPLETE);
