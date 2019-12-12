/*
 * Copyright 2015 Trim-marks Inc.
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

export default {
  escapeUnicodeChar(ch) {
    return `\\u${(0x10000 | ch.charCodeAt(0)).toString(16).substring(1)}`;
  },
  escapeUnicodeString(str) {
    return str.replace(/[^-a-zA-Z0-9_]/g, this.escapeUnicodeChar);
  },
  percentEncodeAmpersandAndUnencodedPercent(str) {
    return str.replace(/%(?![0-9A-Fa-f]{2})/g, "%25").replace(/&/g, "%26");
  },
  percentEncodeAmpersandAndPercent(str) {
    return str.replace(/%/g, "%25").replace(/&/g, "%26");
  },
  percentDecodeAmpersandAndPercent(str) {
    return str.replace(/%26/g, "&").replace(/%25/g, "%");
  },
  percentEncodeForDataURI(str) {
    return encodeURI(str)
      .replace(/#/g, "%23")
      .replace(/&/g, "%26");
  },
};
