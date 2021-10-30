/*
 * Copyright 2021 Vivliostyle Foundation
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

const scale_regexp = /^scale\((?<scale>.+)\)$/;
const applyTransformToRect = (
  rect: DOMRect,
  scale: string,
  parentRect: DOMRect,
): DOMRect => {
  let x = rect.x - parentRect.x;
  let y = rect.y - parentRect.y;
  let width = rect.width;
  let height = rect.height;
  const scaleValue = parseFloat(scale.match(scale_regexp)?.groups?.scale);
  if (scaleValue && !isNaN(scaleValue)) {
    x /= scaleValue;
    y /= scaleValue;
    width /= scaleValue;
    height /= scaleValue;
  }
  return new DOMRect(x, y, width, height);
};

export default applyTransformToRect;
