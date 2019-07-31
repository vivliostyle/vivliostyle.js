/**
 * Copyright 2013 Google, Inc.
 * Copyright 2017 Trim-marks Inc.
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
 * @fileoverview Sha1 - Calculate SHA1 hash of the given content.
 */
import * as Base from "../adapt/base";

/**
 * @return big-endian byte sequence
 */
export const encode32 = (n: number): string =>
  String.fromCharCode(
    (n >>> 24) & 255,
    (n >>> 16) & 255,
    (n >>> 8) & 255,
    n & 255
  );

/**
 * @param bytes big-endian byte sequence
 */
export const decode32 = (bytes: string): number => {
  // Important facts: "".charCodeAt(0) == NaN, NaN & 0xFF == 0
  const b0 = bytes.charCodeAt(0) & 255;
  const b1 = bytes.charCodeAt(1) & 255;
  const b2 = bytes.charCodeAt(2) & 255;
  const b3 = bytes.charCodeAt(3) & 255;
  return (b0 << 24) | (b1 << 16) | (b2 << 8) | b3;
};

/**
 * @param bytes chars with codes 0 - 255 that represent message byte values
 * @return big-endian uint32 numbers representing sha1 hash
 */
export const bytesToSHA1Int32 = (bytes: string): number[] => {
  const sb = new Base.StringBuffer();
  sb.append(bytes);
  let appendCount = (55 - bytes.length) & 63;
  sb.append("\u0080");
  while (appendCount > 0) {
    appendCount--;
    sb.append("\x00");
  }
  sb.append("\x00\x00\x00\x00");
  sb.append(encode32(bytes.length * 8));
  bytes = sb.toString();
  const h = [1732584193, 4023233417, 2562383102, 271733878, 3285377520];
  const w =
    /** @type Array.<number> */
    [] as number[];
  let i;
  for (let bi = 0; bi < bytes.length; bi += 64) {
    for (i = 0; i < 16; i++) {
      w[i] = decode32(bytes.substr(bi + 4 * i, 4));
    }
    for (; i < 80; i++) {
      const q = w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16];
      w[i] = (q << 1) | (q >>> 31);
    }
    let a = h[0];
    let b = h[1];
    let c = h[2];
    let d = h[3];
    let e = h[4];
    let f;
    for (i = 0; i < 80; i++) {
      if (i < 20) {
        f = ((b & c) | (~b & d)) + 1518500249;
      } else if (i < 40) {
        f = (b ^ c ^ d) + 1859775393;
      } else if (i < 60) {
        f = ((b & c) | (b & d) | (c & d)) + 2400959708;
      } else {
        f = (b ^ c ^ d) + 3395469782;
      }
      f += ((a << 5) | (a >>> 27)) + e + w[i];
      e = d;
      d = c;
      c = (b << 30) | (b >>> 2);
      b = a;
      a = f;
    }
    h[0] = (h[0] + a) | 0;
    h[1] = (h[1] + b) | 0;
    h[2] = (h[2] + c) | 0;
    h[3] = (h[3] + d) | 0;
    h[4] = (h[4] + e) | 0;
  }
  return h;
};

/**
 * @param bytes chars with codes 0 - 255 that represent message byte values
 * @return uint8 numbers representing sha1 hash
 */
export const bytesToSHA1Int8 = (bytes: string): number[] => {
  const h = bytesToSHA1Int32(bytes);
  const res = [];
  for (const n of h) {
    res.push((n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255);
  }
  return res;
};

/**
 * @param bytes chars with codes 0 - 255 that represent message byte values
 * @return chars with codes 0 - 255 equal to SHA1 hash of the input
 */
export const bytesToSHA1Bytes = (bytes: string): string => {
  const h = bytesToSHA1Int32(bytes);
  const sb = new Base.StringBuffer();
  for (let i = 0; i < h.length; i++) {
    sb.append(encode32(h[i]));
  }
  return sb.toString();
};

/**
 * @param bytes chars with codes 0 - 255 that represent message byte values
 * @return hex-encoded SHA1 hash
 */
export const bytesToSHA1Hex = (bytes: string): string => {
  const sha1 = bytesToSHA1Bytes(bytes);
  const sb = new Base.StringBuffer();
  for (let i = 0; i < sha1.length; i++) {
    sb.append((sha1.charCodeAt(i) | 256).toString(16).substr(1));
  }
  return sb.toString();
};

/**
 * @param bytes chars with codes 0 - 255 that represent message byte values
 * @return base64-encoded SHA1 hash of the input
 */
export const bytesToSHA1Base64 = (bytes: string): string => {
  const sha1 = bytesToSHA1Bytes(bytes);
  const sb = new Base.StringBuffer();
  Base.appendBase64(sb, sha1);
  return sb.toString();
};
