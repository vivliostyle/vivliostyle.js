/*
 * Copyright 2023 Vivliostyle Foundation
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
 */

export const scaleRect = (rect: DOMRect): DOMRect => {
  const style = document.getElementById("vivliostyle-viewer-viewport").style;
  const scaleRectRatio = parseFloat(
    style.getPropertyValue("--viv-scaleRectRatio") || "1",
  );
  return new DOMRect(
    rect.x * scaleRectRatio,
    rect.y * scaleRectRatio,
    rect.width * scaleRectRatio,
    rect.height * scaleRectRatio,
  );
};

export const applyTransformToRect = (
  rect: DOMRect,
  parentRect: DOMRect,
): DOMRect => {
  let x = rect.x - parentRect.x;
  let y = rect.y - parentRect.y;
  let width = rect.width;
  let height = rect.height;
  const style = document.getElementById("vivliostyle-viewer-viewport").style;
  const scaleValue = parseFloat(
    style.getPropertyValue("--viv-outputScale") || "1",
  );
  if (scaleValue && !isNaN(scaleValue)) {
    x /= scaleValue;
    y /= scaleValue;
    width /= scaleValue;
    height /= scaleValue;
  }
  return new DOMRect(x, y, width, height);
};
