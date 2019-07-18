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
 * @fileoverview Display - CSS Display Module
 */
import * as Css from "../adapt/css";

export const FLOW_ROOT_ATTR = "data-vivliostyle-flow-root";

export const isFlowRoot = (element: Element): boolean =>
  element.getAttribute(FLOW_ROOT_ATTR) === "true";

/**
 * 'Blockify' a display value.
 * cf. https://drafts.csswg.org/css-display/#transformations
 *     https://drafts.csswg.org/css2/visuren.html#dis-pos-flo
 */
export const blockify = (display: Css.Ident): Css.Ident => {
  const displayStr = display.toString();
  let blockifiedStr;
  switch (displayStr) {
    case "inline-flex":
      blockifiedStr = "flex";
      break;
    case "inline-grid":
      blockifiedStr = "grid";
      break;
    case "inline-table":
      blockifiedStr = "table";
      break;
    case "inline":
    case "table-row-group":
    case "table-column":
    case "table-column-group":
    case "table-header-group":
    case "table-footer-group":
    case "table-row":
    case "table-cell":
    case "table-caption":
    case "inline-block":
      blockifiedStr = "block";
      break;
    default:
      blockifiedStr = displayStr;
  }
  return Css.getName(blockifiedStr);
};

/**
 * Judge if the generated box is absolutely positioned.
 */
export const isAbsolutelyPositioned = (position: Css.Ident): boolean =>
  position === Css.ident.absolute || position === Css.ident.fixed;

/**
 * Get computed values of display, position and float.
 * cf. https://drafts.csswg.org/css-display/#transformations
 *     https://drafts.csswg.org/css2/visuren.html#dis-pos-flo
 */
export const getComputedDislayValue = (
  display: Css.Ident,
  position: Css.Ident,
  float: Css.Ident,
  isRoot: boolean
): { display: Css.Ident; position: Css.Ident; float: Css.Ident } => {
  if (display === Css.ident.none) {
    // no need to convert values when 'display' is 'none'
  } else if (isAbsolutelyPositioned(position)) {
    float = Css.ident.none;
    display = blockify(display);
  } else if ((float && float !== Css.ident.none) || isRoot) {
    display = blockify(display);
  }
  return { display, position, float };
};

/**
 * Judges if the generated box is block.
 */
export const isBlock = (
  display: Css.Ident,
  position: Css.Ident,
  float: Css.Ident,
  isRoot: boolean
): boolean =>
  getComputedDislayValue(display, position, float, isRoot).display ===
  Css.ident.block;

export const isInlineLevel = (display: Css.Ident): boolean => {
  switch (display.toString()) {
    case "inline":
    case "inline-block":
    case "inline-list-item":
    case "inline-flex":
    case "inline-grid":
    case "ruby":
    case "inline-table":
      return true;
    default:
      return false;
  }
};

export const isRubyInternalDisplay = (display: Css.Ident): boolean => {
  switch (display.toString()) {
    case "ruby-base":
    case "ruby-text":
    case "ruby-base-container":
    case "ruby-text-container":
      return true;
    default:
      return false;
  }
};

/**
 * Judges if the generated box establishes a new block formatting context.
 */
export const establishesBFC = (
  display: Css.Ident,
  position: Css.Ident,
  float: Css.Ident,
  overflow: Css.Ident,
  writingMode?: Css.Ident,
  parentWritingMode?: Css.Ident,
  isFlowRoot?: boolean
): boolean => {
  writingMode = writingMode || parentWritingMode || Css.ident.horizontal_tb;
  return (
    !!isFlowRoot ||
    (!!float && float !== Css.ident.none) ||
    isAbsolutelyPositioned(position) ||
    (display === Css.ident.inline_block ||
      display === Css.ident.table_cell ||
      display === Css.ident.table_caption ||
      display == Css.ident.flex) ||
    (((display === Css.ident.block || display === Css.ident.list_item) &&
      (!!overflow && overflow !== Css.ident.visible)) ||
      (!!parentWritingMode && writingMode !== parentWritingMode))
  );
};

/**
 * Judges if the generated box establishes a containing block for descendant
 * boxes with 'position: absolute'.
 */
export const establishesCBForAbsolute = (position: Css.Ident): boolean =>
  position === Css.ident.relative ||
  position === Css.ident.absolute ||
  position === Css.ident.fixed;
