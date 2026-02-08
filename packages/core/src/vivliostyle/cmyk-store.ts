/**
 * Copyright 2025 Vivliostyle Foundation
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

/**
 * The Vivliostyle CMYK implementation primarily in this file is not "true"
 * CMYK support in the sense that the web browser outputs CMYK, but rather a
 * feature that enables post-processing to replace RGB with CMYK using RGB as
 * a key.
 *
 * This processing leverages the fact that Chromium can transparently reflect
 * `color(srgb ...)` into PDF. Each RGB component has 4 decimal places (the
 * 5th digit is half-up rounded). Specifically, this is based on reading the
 * source code at the following commits.
 *
 * | Repository              | Commit Hash                              |
 * | ----------------------- | ---------------------------------------- |
 * | Chromium                | a2652c6fc5817d5cc643c3935e1363ddc48abb6e |
 * | Skia (third_party/skia) | 3544942c9d424d37d82d756d6dbbbc04327e8dbb |
 *
 * This implementation has several inherent limitations.
 *
 * - The RGB display shown in the browser is merely a key and does not
 *   necessarily reproduce the color appearance after output. Also, it is not
 *   possible to use more than ((10^4)+1)^3 CMYK colors.
 * - Only Chromium is supported. Similar replacement may be possible by
 *   analyzing other web browser implementations, but this is currently
 *   outside the scope of this module.
 * - This implementation is not designed to create PDFs with mixed RGB and
 *   CMYK. If you use this feature, you should specify CMYK colors for all
 *   rendered objects.
 *   There is no way to distinguish between "colors converted from CMYK to
 *   RGB" and "colors originally specified as RGB" in the post-processing
 *   stage. If these colors collide, the post-processing stage has no choice
 *   but to replace both with CMYK.
 * - Raster images are not handled at all. In the first place, there is no
 *   raster image format (at the time of implementation) that can handle CMYK
 *   and be displayed in a web browser. The possibility of replacement in the
 *   post-processing stage is not ruled out.
 */

import * as Css from "./css";
import * as Logging from "./logging";

class SRGBValue {
  static readonly MAX = 10000;

  readonly #r: number;
  readonly #g: number;
  readonly #b: number;

  private constructor(r: number, g: number, b: number) {
    this.#r = Math.round(Math.max(0, Math.min(r, SRGBValue.MAX)));
    this.#g = Math.round(Math.max(0, Math.min(g, SRGBValue.MAX)));
    this.#b = Math.round(Math.max(0, Math.min(b, SRGBValue.MAX)));
  }

  static fromInt(r: number, g: number, b: number): SRGBValue {
    return new SRGBValue(r, g, b);
  }

  offset(dr: number, dg: number, db: number): SRGBValue {
    return new SRGBValue(this.#r + dr, this.#g + dg, this.#b + db);
  }

  toKey(): string {
    return JSON.stringify([this.#r, this.#g, this.#b]);
  }

  toColorFunc(alpha: number | null): Css.Func {
    return new Css.Func("color", [
      new Css.SpaceList([
        Css.getName("srgb"),
        new Css.Num(this.#r / SRGBValue.MAX),
        new Css.Num(this.#g / SRGBValue.MAX),
        new Css.Num(this.#b / SRGBValue.MAX),
        ...(alpha !== null ? [Css.slash, new Css.Num(alpha)] : []),
      ]),
    ]);
  }
}

export interface CMYKValueJSON {
  c: number;
  m: number;
  y: number;
  k: number;
}

export interface RGBValueJSON {
  r: number;
  g: number;
  b: number;
}

export type CmykReserveMapEntry = [RGBValueJSON, CMYKValueJSON];

export function isValidCmykReserveMap(
  data: unknown,
): data is CmykReserveMapEntry[] {
  if (!Array.isArray(data)) {
    return false;
  }
  return data.every((entry) => {
    if (!Array.isArray(entry) || entry.length !== 2) {
      return false;
    }
    const [rgb, cmyk] = entry;
    if (
      !rgb ||
      typeof rgb !== "object" ||
      Array.isArray(rgb) ||
      !cmyk ||
      typeof cmyk !== "object" ||
      Array.isArray(cmyk)
    ) {
      return false;
    }
    const rgbObj = rgb as { r: unknown; g: unknown; b: unknown };
    const cmykObj = cmyk as { c: unknown; m: unknown; y: unknown; k: unknown };
    return (
      Number.isFinite(rgbObj.r as number) &&
      Number.isFinite(rgbObj.g as number) &&
      Number.isFinite(rgbObj.b as number) &&
      Number.isFinite(cmykObj.c as number) &&
      Number.isFinite(cmykObj.m as number) &&
      Number.isFinite(cmykObj.y as number) &&
      Number.isFinite(cmykObj.k as number)
    );
  });
}

class CMYKValue {
  static readonly MAX = 10000;

  readonly #c: number;
  readonly #m: number;
  readonly #y: number;
  readonly #k: number;

  private constructor(c: number, m: number, y: number, k: number) {
    this.#c = Math.round(Math.max(0, Math.min(c, CMYKValue.MAX)));
    this.#m = Math.round(Math.max(0, Math.min(m, CMYKValue.MAX)));
    this.#y = Math.round(Math.max(0, Math.min(y, CMYKValue.MAX)));
    this.#k = Math.round(Math.max(0, Math.min(k, CMYKValue.MAX)));
  }

  static fromInt(c: number, m: number, y: number, k: number): CMYKValue {
    return new CMYKValue(c, m, y, k);
  }

  static fromNumber(c: number, m: number, y: number, k: number): CMYKValue {
    return new CMYKValue(
      c * CMYKValue.MAX,
      m * CMYKValue.MAX,
      y * CMYKValue.MAX,
      k * CMYKValue.MAX,
    );
  }

  /**
   * CSS Color Level 5 naive conversion.
   * https://www.w3.org/TR/css-color-5/#cmyk-rgb
   */
  toSRGB(): SRGBValue {
    const oneMinusK = CMYKValue.MAX - this.#k;
    return SRGBValue.fromInt(
      SRGBValue.MAX -
        Math.min(
          SRGBValue.MAX,
          Math.round((this.#c * oneMinusK) / CMYKValue.MAX) + this.#k,
        ),
      SRGBValue.MAX -
        Math.min(
          SRGBValue.MAX,
          Math.round((this.#m * oneMinusK) / CMYKValue.MAX) + this.#k,
        ),
      SRGBValue.MAX -
        Math.min(
          SRGBValue.MAX,
          Math.round((this.#y * oneMinusK) / CMYKValue.MAX) + this.#k,
        ),
    );
  }

  equals(other: CMYKValue): boolean {
    return (
      this.#c === other.#c &&
      this.#m === other.#m &&
      this.#y === other.#y &&
      this.#k === other.#k
    );
  }

  toJSON(): CMYKValueJSON {
    return { c: this.#c, m: this.#m, y: this.#y, k: this.#k };
  }
}

function getNumValue(v: Css.Val): number | null {
  return v instanceof Css.Num
    ? Math.max(0, Math.min(1, v.num))
    : v instanceof Css.Numeric && v.unit === "%"
      ? Math.max(0, Math.min(1, v.num / 100))
      : null;
}

export function parseDeviceCmyk(
  func: Css.Func,
): { cmyk: CMYKValue; alpha: number | null } | null {
  if (func.name !== "device-cmyk") {
    return null;
  }

  const values =
    // Modern syntax: space-separated values in a single SpaceList
    func.values.length === 1 && func.values[0]! instanceof Css.SpaceList
      ? (func.values[0]! as Css.SpaceList).values
      : // Legacy syntax: comma-separated values directly in func.values
        func.values;
  if (values.length < 4 || values.length > 6) {
    return null;
  }

  const c = getNumValue(values[0]!);
  const m = getNumValue(values[1]!);
  const y = getNumValue(values[2]!);
  const k = getNumValue(values[3]!);
  if (c === null || m === null || y === null || k === null) {
    return null;
  }

  let alpha: number | null = null;
  if (values.length >= 5) {
    if (values[4]! === Css.slash) {
      // Modern syntax: c m y k / alpha - must have exactly 6 values
      if (values.length !== 6) {
        return null;
      }
      alpha = getNumValue(values[5]!);
    } else {
      // Legacy syntax: c, m, y, k, alpha - must have exactly 5 values
      if (values.length !== 5) {
        return null;
      }
      alpha = getNumValue(values[4]!);
    }
    if (alpha === null) {
      return null;
    }
  }

  return { cmyk: CMYKValue.fromNumber(c, m, y, k), alpha };
}

function* getOffsets(distance: number): Generator<[number, number, number]> {
  for (let r = -distance; r <= distance; r++) {
    for (let g = -distance; g <= distance; g++) {
      for (let b = -distance; b <= distance; b++) {
        if (Math.abs(r) + Math.abs(g) + Math.abs(b) === distance) {
          yield [r, g, b];
        }
      }
    }
  }
}

export class CmykStore {
  #map = new Map<string, CMYKValue>();

  registerDeviceCmyk(func: Css.Func): Css.Func | null {
    const result = parseDeviceCmyk(func);
    if (!result) {
      return null;
    }
    const srgb = this.#register(result.cmyk);
    return srgb.toColorFunc(result.alpha);
  }

  #register(cmyk: CMYKValue): SRGBValue {
    const srgb = cmyk.toSRGB();
    const key = srgb.toKey();
    const existing = this.#map.get(key);
    if (existing) {
      return existing.equals(cmyk) ? srgb : this.#findAvailableSlot(cmyk, srgb);
    }
    this.#map.set(key, cmyk);
    return srgb;
  }

  registerCmykReserveMap(entries: CmykReserveMapEntry[]): void {
    for (const [rgb, cmyk] of entries) {
      const srgb = SRGBValue.fromInt(rgb.r, rgb.g, rgb.b);
      const cmykVal = CMYKValue.fromInt(cmyk.c, cmyk.m, cmyk.y, cmyk.k);
      this.#map.set(srgb.toKey(), cmykVal);
    }
  }

  toJSON(): Record<string, CMYKValueJSON> {
    const result: Record<string, CMYKValueJSON> = {};
    this.#map.forEach((value, key) => {
      result[key] = value.toJSON();
    });
    return result;
  }

  #findAvailableSlot(cmyk: CMYKValue, baseSrgb: SRGBValue): SRGBValue {
    for (let distance = 1; distance <= SRGBValue.MAX; distance++) {
      for (const [dr, dg, db] of getOffsets(distance)) {
        const candidate = baseSrgb.offset(dr, dg, db);
        const key = candidate.toKey();
        if (!this.#map.has(key)) {
          this.#map.set(key, cmyk);
          return candidate;
        }
      }
    }

    Logging.logger.warn(
      `CmykStore: Exceeded trackable color limit for ${JSON.stringify(cmyk.toJSON())}`,
    );
    return baseSrgb;
  }
}

export class CmykFilterVisitor extends Css.FilterVisitor {
  readonly #store: CmykStore;
  readonly #conversions = new Map<string, string>();
  #hasDeviceCmyk: boolean = false;

  constructor(store?: CmykStore) {
    super();
    this.#store = store ?? new CmykStore();
  }

  reset(): void {
    this.#hasDeviceCmyk = false;
  }
  hadDeviceCmyk(): boolean {
    return this.#hasDeviceCmyk;
  }

  recordConversion(propertyName: string, originalValue: string): void {
    this.#conversions.set(propertyName, originalValue);
  }
  getConversions(): Record<string, string> | null {
    if (this.#conversions.size === 0) {
      return null;
    }
    const result: Record<string, string> = {};
    this.#conversions.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  override visitFunc(func: Css.Func): Css.Val {
    const result = this.#store.registerDeviceCmyk(func);
    if (result) {
      this.#hasDeviceCmyk = true;
      return result;
    }
    return super.visitFunc(func);
  }
}
