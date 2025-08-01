/**
 * Copyright 2015 Daishinsha Inc.
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
 * @fileoverview Sizing - CSS Intrinsic & Extrinsic Sizing
 */
import * as Base from "./base";
import * as Vtree from "./vtree";

/**
 * Box sizes defined in css-sizing.
 * @enum {string}
 */
export enum Size {
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
  FIT_CONTENT_HEIGHT = "fit-content height",
}

/**
 * Get specified sizes for the element.
 */
export function getSize(
  clientLayout: Vtree.ClientLayout,
  element: Element,
  sizes: Size[],
): { [key in Size]: number } {
  const element1 = element as HTMLElement;
  const original = {
    width: element1.style.width,
    height: element1.style.height,
  };

  function getComputedValue(name: string): string {
    return clientLayout.getElementComputedStyle(element).getPropertyValue(name);
  }

  const writingModeValue = getComputedValue("writing-mode");
  const isVertical = writingModeValue !== "horizontal-tb";
  const inlineSizeName = isVertical ? "height" : "width";
  const blockSizeName = isVertical ? "width" : "height";

  function getSizeValue(
    sizeName: "width" | "height",
    minMaxFitContent: "min-content" | "max-content" | "fit-content",
  ): string {
    element1.style[sizeName] = minMaxFitContent;
    const r = getComputedValue(sizeName);
    element1.style[sizeName] = original[sizeName];
    return r;
  }

  const result = {} as { [key in Size]: number };
  for (const size of sizes) {
    let r: string;
    switch (size) {
      case Size.MAX_CONTENT_INLINE_SIZE:
        r = getSizeValue(inlineSizeName, "max-content");
        break;
      case Size.MIN_CONTENT_INLINE_SIZE:
        r = getSizeValue(inlineSizeName, "min-content");
        break;
      case Size.FIT_CONTENT_INLINE_SIZE:
        r = getSizeValue(inlineSizeName, "fit-content");
        break;
      case Size.MAX_CONTENT_BLOCK_SIZE:
        r = getSizeValue(blockSizeName, "max-content");
        break;
      case Size.MIN_CONTENT_BLOCK_SIZE:
        r = getSizeValue(blockSizeName, "min-content");
        break;
      case Size.FIT_CONTENT_BLOCK_SIZE:
        r = getSizeValue(blockSizeName, "fit-content");
        break;
      case Size.MAX_CONTENT_WIDTH:
        r = getSizeValue("width", "max-content");
        break;
      case Size.MAX_CONTENT_HEIGHT:
        r = getSizeValue("height", "max-content");
        break;
      case Size.MIN_CONTENT_WIDTH:
        r = getSizeValue("width", "min-content");
        break;
      case Size.MIN_CONTENT_HEIGHT:
        r = getSizeValue("height", "min-content");
        break;
      case Size.FIT_CONTENT_WIDTH:
        r = getSizeValue("width", "fit-content");
        break;
      case Size.FIT_CONTENT_HEIGHT:
        r = getSizeValue("height", "fit-content");
        break;
    }
    // Workaround for the case that the element has an image that is
    // not loaded yet. Use 1px instead of 0px to avoid wrong layout.
    if (
      r === "0px" &&
      element.childNodes.length === 1 &&
      element.firstElementChild?.localName === "img" &&
      !(element.firstElementChild as HTMLImageElement).complete
    ) {
      r = "1px";
    }
    result[size] = parseFloat(r);
  }

  return result;
}
