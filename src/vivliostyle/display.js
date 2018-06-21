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
goog.provide("vivliostyle.display");

goog.require("adapt.css");

goog.scope(() => {

    /** @private @const */
    vivliostyle.display.FLOW_ROOT_ATTR = "data-vivliostyle-flow-root";

    /**
     * @param {!Element} element
     * @returns {boolean}
     */
    vivliostyle.display.isFlowRoot = element => element.getAttribute(vivliostyle.display.FLOW_ROOT_ATTR) === "true";

    /**
     * 'Blockify' a display value.
     * cf. https://drafts.csswg.org/css-display/#transformations
     *     https://drafts.csswg.org/css2/visuren.html#dis-pos-flo
     * @param {!adapt.css.Ident} display
     * @returns {!adapt.css.Ident}
     */
    vivliostyle.display.blockify = display => {
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
        return adapt.css.getName(blockifiedStr);
    };

    /**
     * Judge if the generated box is absolutely positioned.
     * @param {adapt.css.Ident} position
     * @returns {boolean}
     */
    vivliostyle.display.isAbsolutelyPositioned = position => position === adapt.css.ident.absolute || position === adapt.css.ident.fixed;

    /**
     * Get computed values of display, position and float.
     * cf. https://drafts.csswg.org/css-display/#transformations
     *     https://drafts.csswg.org/css2/visuren.html#dis-pos-flo
     * @param {!adapt.css.Ident} display
     * @param {adapt.css.Ident} position
     * @param {adapt.css.Ident} float
     * @param {boolean} isRoot
     * @returns {{display: !adapt.css.Ident, position: adapt.css.Ident, float: adapt.css.Ident}}
     */
    vivliostyle.display.getComputedDislayValue = (display, position, float, isRoot) => {
        if (display === adapt.css.ident.none) {
            // no need to convert values when 'display' is 'none'
        } else if (vivliostyle.display.isAbsolutelyPositioned(position)) {
            float = adapt.css.ident.none;
            display = vivliostyle.display.blockify(display);
        } else if ((float && float !== adapt.css.ident.none) || isRoot) {
            display = vivliostyle.display.blockify(display);
        }
        return {
            display,
            position,
            float
        };
    };

    /**
     * Judges if the generated box is block.
     * @param {!adapt.css.Ident} display
     * @param {adapt.css.Ident} position
     * @param {adapt.css.Ident} float
     * @param {boolean} isRoot
     * @returns {boolean}
     */
    vivliostyle.display.isBlock = (display, position, float, isRoot) => vivliostyle.display.getComputedDislayValue(display, position, float, isRoot).display
        === adapt.css.ident.block;

    /**
     * @param {!adapt.css.Ident} display
     * @returns {boolean}
     */
    vivliostyle.display.isInlineLevel = display => {
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

    /**
     * @param {!adapt.css.Ident} display
     * @returns {boolean}
     */
    vivliostyle.display.isRubyInternalDisplay = display => {
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
     * @param {adapt.css.Ident} display
     * @param {adapt.css.Ident} position
     * @param {adapt.css.Ident} float
     * @param {adapt.css.Ident} overflow
     * @param {adapt.css.Ident=} writingMode
     * @param {adapt.css.Ident=} parentWritingMode
     * @param {boolean=} isFlowRoot
     * @returns {boolean}
     */
    vivliostyle.display.establishesBFC = (
        display,
        position,
        float,
        overflow,
        writingMode,
        parentWritingMode,
        isFlowRoot
    ) => {
        writingMode = writingMode || parentWritingMode || adapt.css.ident.horizontal_tb;
        return !!isFlowRoot || (!!float && float !== adapt.css.ident.none) ||
            vivliostyle.display.isAbsolutelyPositioned(position) ||
            (display === adapt.css.ident.inline_block || display === adapt.css.ident.table_cell || display === adapt.css.ident.table_caption || display == adapt.css.ident.flex) ||
            ((display === adapt.css.ident.block || display === adapt.css.ident.list_item) &&
                (!!overflow && overflow !== adapt.css.ident.visible) ||
                (!!parentWritingMode && writingMode !== parentWritingMode));
    };

    /**
     * Judges if the generated box establishes a containing block for descendant boxes with 'position: absolute'.
     * @param {adapt.css.Ident} position
     * @returns {boolean}
     */
    vivliostyle.display.establishesCBForAbsolute = position => position === adapt.css.ident.relative || position === adapt.css.ident.absolute || position === adapt.css.ident.fixed;
});
