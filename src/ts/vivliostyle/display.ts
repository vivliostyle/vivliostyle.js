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
 * @fileoverview CSS Display Module
 */
import * as css from "../adapt/css";

export const FLOW_ROOT_ATTR = "data-vivliostyle-flow-root";

export const isFlowRoot = (element: Element): boolean =>
  element.getAttribute(FLOW_ROOT_ATTR) === "true";

/**
 * 'Blockify' a display value.
 * cf. https://drafts.csswg.org/css-display/#transformations
 *     https://drafts.csswg.org/css2/visuren.html#dis-pos-flo
 */
export const blockify = (display: css.Ident): css.Ident => {
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
  return css.getName(blockifiedStr);
};

/**
 * Judge if the generated box is absolutely positioned.
 */
export const isAbsolutelyPositioned = (position: css.Ident): boolean =>
  position === css.ident.absolute || position === css.ident.fixed;

/**
 * Get computed values of display, position and float.
 * cf. https://drafts.csswg.org/css-display/#transformations
 *     https://drafts.csswg.org/css2/visuren.html#dis-pos-flo
 */
export const getComputedDislayValue = (
  display: css.Ident,
  position: css.Ident,
  float: css.Ident,
  isRoot: boolean
): { display: css.Ident; position: css.Ident; float: css.Ident } => {
  if (display === css.ident.none) {
    // no need to convert values when 'display' is 'none'
  } else if (isAbsolutelyPositioned(position)) {
    float = css.ident.none;
    display = blockify(display);
  } else if ((float && float !== css.ident.none) || isRoot) {
    display = blockify(display);
  }
  return { display, position, float };
};

/**
 * Judges if the generated box is block.
 */
export const isBlock = (
  display: css.Ident,
  position: css.Ident,
  float: css.Ident,
  isRoot: boolean
): boolean =>
  getComputedDislayValue(display, position, float, isRoot).display ===
  css.ident.block;

export const isInlineLevel = (display: css.Ident): boolean => {
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

export const isRubyInternalDisplay = (display: css.Ident): boolean => {
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
  display: css.Ident,
  position: css.Ident,
  float: css.Ident,
  overflow: css.Ident,
  writingMode?: css.Ident,
  parentWritingMode?: css.Ident,
  isFlowRoot?: boolean
): boolean => {
  writingMode = writingMode || parentWritingMode || css.ident.horizontal_tb;
  return (
    !!isFlowRoot ||
    (!!float && float !== css.ident.none) ||
    isAbsolutelyPositioned(position) ||
    (display === css.ident.inline_block ||
      display === css.ident.table_cell ||
      display === css.ident.table_caption ||
      display == css.ident.flex) ||
    (((display === css.ident.block || display === css.ident.list_item) &&
      (!!overflow && overflow !== css.ident.visible)) ||
      (!!parentWritingMode && writingMode !== parentWritingMode))
  );
};

/**
 * Judges if the generated box establishes a containing block for descendant
 * boxes with 'position: absolute'.
 */
export const establishesCBForAbsolute = (position: css.Ident): boolean =>
  position === css.ident.relative ||
  position === css.ident.absolute ||
  position === css.ident.fixed;
