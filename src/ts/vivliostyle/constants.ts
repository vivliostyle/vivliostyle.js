/**
 * Copyright 2015 Trim-marks Inc.
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
 * @fileoverview Constants
 */

/**
 * Debug flag.
 */
export let isDebug: boolean = false;
export function setDebug(value: boolean) {
  isDebug = value;
}

/**
 * Page progression direction.
 * @enum {string}
 */
export enum PageProgression {
  LTR = "ltr",
  RTL = "rtl"
}

/**
 * Return PageProgression corresponding to the specified string
 */
export const pageProgressionOf = (str: string): PageProgression => {
  switch (str) {
    case "ltr":
      return PageProgression.LTR;
    case "rtl":
      return PageProgression.RTL;
    default:
      throw new Error(`unknown PageProgression: ${str}`);
  }
};

/**
 * Page side (left/right).
 * @enum {string}
 */
export enum PageSide {
  LEFT = "left",
  RIGHT = "right"
}

/**
 * Viewer ready state.
 * @enum {string}
 */
export enum ReadyState {
  LOADING = "loading",
  INTERACTIVE = "interactive",
  COMPLETE = "complete"
}

/**
 * Pubilc members of the bundled library.
 */
export const constants = {
  PageProgression,
  PageSide,
  ReadyState
};
