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
 * @fileoverview CSS Intrinsic & Extrinsic Sizing
 */
import * as base from "../adapt/base";
import * as vtree from "../adapt/vtree";

/**
 * Box sizes defined in css-sizing.
 * @enum {string}
 */
export enum Size {
  FILL_AVAILABLE_INLINE_SIZE = "fill-available inline size",
  FILL_AVAILABLE_BLOCK_SIZE = "fill-available block size",
  FILL_AVAILABLE_WIDTH = "fill-available width",
  FILL_AVAILABLE_HEIGHT = "fill-available height",
  MAX_CONTENT_INLINE_SIZE = "max-content inline size",
  MAX_CONTENT_BLOCK_SIZE = "max-content block size",
  MAX_CONTENT_WIDTH = "max-content width",
  MAX_CONTENT_HEIGHT = "max-content height",
  MIN_CONTENT_INLINE_SIZE = "min-content inline size",
  MIN_CONTENT_BLOCK_SIZE = "min-content block size",
  MIN_CONTENT_WIDTH = "min-content width",
  MIN_CONTENT_HEIGHT = "min-content height",
  FIT_CONTENT_INLINE_SIZE = "fit-content inline size",
  FIT_CONTENT_BLOCK_SIZE = "fit-content block size",
  FIT_CONTENT_WIDTH = "fit-content width",
  FIT_CONTENT_HEIGHT = "fit-content height"
}

/**
 * Get specified sizes for the element.
 */
export const getSize = (
  clientLayout: vtree.ClientLayout,
  element: Element,
  sizes: Size[]
): { [key in Size]: number } => {
  const original = {
    display: (element as any).style.display,
    position: (element as any).style.position,
    width: (element as any).style.width as string,
    maxWidth: (element as any).style.maxWidth as string,
    minWidth: (element as any).style.minWidth as string,
    height: (element as any).style.height as string,
    maxHeight: (element as any).style.maxHeight as string,
    minHeight: (element as any).style.minHeight as string
  };
  const doc = element.ownerDocument;
  const parent = element.parentNode;

  // wrap the element with a dummy container element
  const container = doc.createElement("div");
  base.setCSSProperty(container, "position", original.position);
  parent.insertBefore(container, element);
  container.appendChild(element);
  base.setCSSProperty(element, "width", "auto");
  base.setCSSProperty(element, "max-width", "none");
  base.setCSSProperty(element, "min-width", "0");
  base.setCSSProperty(element, "height", "auto");
  base.setCSSProperty(element, "max-height", "none");
  base.setCSSProperty(element, "min-height", "0");

  function getComputedValue(name: string): string {
    return clientLayout.getElementComputedStyle(element).getPropertyValue(name);
  }
  const writingModeProperty = base.getPrefixedPropertyNames("writing-mode");
  const writingModeValue =
    (writingModeProperty ? getComputedValue(writingModeProperty[0]) : null) ||
    getComputedValue("writing-mode");
  const isVertical =
    writingModeValue === "vertical-rl" ||
    writingModeValue === "tb-rl" ||
    writingModeValue === "vertical-lr" ||
    writingModeValue === "tb-lr";
  const inlineSizeName = isVertical ? "height" : "width";
  const blockSizeName = isVertical ? "width" : "height";

  function getFillAvailableInline(): string {
    base.setCSSProperty(element, "display", "block");
    base.setCSSProperty(element, "position", "static");
    return getComputedValue(inlineSizeName);
  }

  // Inline size of an inline-block element is the fit-content
  // (shrink-to-fit) inline size.
  function getMaxContentInline(): string {
    base.setCSSProperty(element, "display", "inline-block");

    // When the available inline size is sufficiently large, the fit-content
    // inline size equals to the max-content inline size.
    base.setCSSProperty(container, inlineSizeName, "99999999px");

    // 'sufficiently large' value
    const r = getComputedValue(inlineSizeName);
    base.setCSSProperty(container, inlineSizeName, "");
    return r;
  }

  function getMinContentInline(): string {
    base.setCSSProperty(element, "display", "inline-block");

    // When the available inline size is zero, the fit-content inline size
    // equals to the min-content inline size.
    base.setCSSProperty(container, inlineSizeName, "0");
    const r = getComputedValue(inlineSizeName);
    base.setCSSProperty(container, inlineSizeName, "");
    return r;
  }

  function getFitContentInline(): string {
    const fillAvailableInline = getFillAvailableInline();
    const minContentInline = getMinContentInline();
    const parsedFillAvailable = parseFloat(fillAvailableInline);
    if (parsedFillAvailable <= parseFloat(minContentInline)) {
      return minContentInline;
    } else {
      const maxContentInline = getMaxContentInline();
      if (parsedFillAvailable <= parseFloat(maxContentInline)) {
        return fillAvailableInline;
      } else {
        return maxContentInline;
      }
    }
  }

  function getIdealBlock(): string {
    return getComputedValue(blockSizeName);
  }

  function getFillAvailableBlock(): string {
    throw new Error("Getting fill-available block size is not implemented");
  }
  const result = {} as { [key in Size]: number };
  sizes.forEach(size => {
    let r: string;
    switch (size) {
      case Size.FILL_AVAILABLE_INLINE_SIZE:
        r = getFillAvailableInline();
        break;
      case Size.MAX_CONTENT_INLINE_SIZE:
        r = getMaxContentInline();
        break;
      case Size.MIN_CONTENT_INLINE_SIZE:
        r = getMinContentInline();
        break;
      case Size.FIT_CONTENT_INLINE_SIZE:
        r = getFitContentInline();
        break;
      case Size.FILL_AVAILABLE_BLOCK_SIZE:
        r = getFillAvailableBlock();
        break;
      case Size.MAX_CONTENT_BLOCK_SIZE:
      case Size.MIN_CONTENT_BLOCK_SIZE:
      case Size.FIT_CONTENT_BLOCK_SIZE:
        r = getIdealBlock();
        break;
      case Size.FILL_AVAILABLE_WIDTH:
        r = isVertical ? getFillAvailableBlock() : getFillAvailableInline();
        break;
      case Size.FILL_AVAILABLE_HEIGHT:
        r = isVertical ? getFillAvailableInline() : getFillAvailableBlock();
        break;
      case Size.MAX_CONTENT_WIDTH:
        r = isVertical ? getIdealBlock() : getMaxContentInline();
        break;
      case Size.MAX_CONTENT_HEIGHT:
        r = isVertical ? getMaxContentInline() : getIdealBlock();
        break;
      case Size.MIN_CONTENT_WIDTH:
        r = isVertical ? getIdealBlock() : getMinContentInline();
        break;
      case Size.MIN_CONTENT_HEIGHT:
        r = isVertical ? getMinContentInline() : getIdealBlock();
        break;
      case Size.FIT_CONTENT_WIDTH:
        r = isVertical ? getIdealBlock() : getFitContentInline();
        break;
      case Size.FIT_CONTENT_HEIGHT:
        r = isVertical ? getFitContentInline() : getIdealBlock();
        break;
    }
    result[size] = parseFloat(r);
    base.setCSSProperty(element, "position", original.position);
    base.setCSSProperty(element, "display", original.display);
  });
  base.setCSSProperty(element, "width", original.width);
  base.setCSSProperty(element, "max-width", original.maxWidth);
  base.setCSSProperty(element, "min-width", original.minWidth);
  base.setCSSProperty(element, "height", original.height);
  base.setCSSProperty(element, "max-height", original.maxHeight);
  base.setCSSProperty(element, "min-height", original.minHeight);
  parent.insertBefore(element, container);
  parent.removeChild(container);
  return result;
};
