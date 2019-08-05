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
 * @fileoverview Logical - CSS Logical Properties
 */
type ConversionMap = {
  regexp: RegExp;
  to: string;
};

function createRegExpMap(
  valueMaps: {
    [key: string]: { [key: string]: { logical: string; physical: string }[] };
  },
  toPhysical: boolean
): { [key: string]: { [key: string]: ConversionMap[] } } {
  const map = {};
  Object.keys(valueMaps as object).forEach(writingMode => {
    const dest = (map[writingMode] = {});
    const src = valueMaps[writingMode];
    Object.keys(src as object).forEach(direction => {
      dest[direction] = src[direction].map(p => {
        const from = toPhysical ? p.logical : p.physical;
        const to = toPhysical ? p.physical : p.logical;
        return { regexp: new RegExp(`(-?)${from}(-?)`), to: `\$1${to}\$2` };
      });
    });
  });
  return map;
}

function convert(
  value: string,
  writingMode: string,
  direction: string | null,
  maps: { [key: string]: { [key: string]: ConversionMap[] } }
): string {
  const maps2 = maps[writingMode];
  if (!maps2) {
    throw new Error(`unknown writing-mode: ${writingMode}`);
  }
  const map = maps2[direction || "ltr"];
  if (!map) {
    throw new Error(`unknown direction: ${direction}`);
  }
  for (const p of map) {
    const replaced = value.replace(p.regexp, p.to);
    if (replaced !== value) {
      return replaced;
    }
  }
  return value;
}
const values: {
  [key: string]: { [key: string]: { logical: string; physical: string }[] };
} = {
  "horizontal-tb": {
    ltr: [
      { logical: "inline-start", physical: "left" },
      { logical: "inline-end", physical: "right" },
      { logical: "block-start", physical: "top" },
      { logical: "block-end", physical: "bottom" },
      { logical: "inline-size", physical: "width" },
      { logical: "block-size", physical: "height" }
    ],
    rtl: [
      { logical: "inline-start", physical: "right" },
      { logical: "inline-end", physical: "left" },
      { logical: "block-start", physical: "top" },
      { logical: "block-end", physical: "bottom" },
      { logical: "inline-size", physical: "width" },
      { logical: "block-size", physical: "height" }
    ]
  },
  "vertical-rl": {
    ltr: [
      { logical: "inline-start", physical: "top" },
      { logical: "inline-end", physical: "bottom" },
      { logical: "block-start", physical: "right" },
      { logical: "block-end", physical: "left" },
      { logical: "inline-size", physical: "height" },
      { logical: "block-size", physical: "width" }
    ],
    rtl: [
      { logical: "inline-start", physical: "bottom" },
      { logical: "inline-end", physical: "top" },
      { logical: "block-start", physical: "right" },
      { logical: "block-end", physical: "left" },
      { logical: "inline-size", physical: "height" },
      { logical: "block-size", physical: "width" }
    ]
  },
  "vertical-lr": {
    ltr: [
      { logical: "inline-start", physical: "top" },
      { logical: "inline-end", physical: "bottom" },
      { logical: "block-start", physical: "left" },
      { logical: "block-end", physical: "right" },
      { logical: "inline-size", physical: "height" },
      { logical: "block-size", physical: "width" }
    ],
    rtl: [
      { logical: "inline-start", physical: "bottom" },
      { logical: "inline-end", physical: "top" },
      { logical: "block-start", physical: "left" },
      { logical: "block-end", physical: "right" },
      { logical: "inline-size", physical: "height" },
      { logical: "block-size", physical: "width" }
    ]
  }
};
const toPhysicalMaps = createRegExpMap(values, true);

export function toPhysical(
  value: string,
  writingMode: string,
  direction?: string | null
): string {
  return convert(value, writingMode, direction || null, toPhysicalMaps);
}
const toLogicalMaps = createRegExpMap(values, false);

export function toLogical(
  value: string,
  writingMode: string,
  direction?: string | null
): string {
  return convert(value, writingMode, direction || null, toLogicalMaps);
}
const lineRelativeValues: {
  [key: string]: { logical: string; physical: string }[];
} = {
  "horizontal-tb": [
    { logical: "line-left", physical: "left" },
    { logical: "line-right", physical: "right" },
    { logical: "over", physical: "top" },
    { logical: "under", physical: "bottom" }
  ],
  "vertical-rl": [
    { logical: "line-left", physical: "top" },
    { logical: "line-right", physical: "bottom" },
    { logical: "over", physical: "right" },
    { logical: "under", physical: "left" }
  ],
  "vertical-lr": [
    { logical: "line-left", physical: "top" },
    { logical: "line-right", physical: "bottom" },
    { logical: "over", physical: "right" },
    { logical: "under", physical: "left" }
  ]
};

export function toLineRelative(value: string, writingMode: string): string {
  const maps = lineRelativeValues[writingMode];
  if (!maps) {
    throw new Error(`unknown writing-mode: ${writingMode}`);
  }
  for (let i = 0; i < maps.length; i++) {
    if (maps[i].physical === value) {
      return maps[i].logical;
    }
  }
  return value;
}
