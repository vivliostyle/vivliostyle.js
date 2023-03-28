/*
 * Copyright 2015 Trim-marks Inc.
 * Copyright 2019 Vivliostyle Foundation
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

import stringUtil from "../utils/string-util";

function getRegExpForParameter(name: string): RegExp {
  return new RegExp(`[#&]${stringUtil.escapeUnicodeString(name)}=([^&]*)`, "g");
}

class URLParameterStore {
  history: History | null;
  location: Location;
  storedUrl: string;
  localStorageKey: string | null = null;

  constructor() {
    this.history = window.history;
    this.location = window.location;
    this.storedUrl = this.location.href;
  }

  getBaseURL(): string {
    let url = this.location.href;
    url = url.replace(/#.*$/, "");
    return url.replace(/\/[^/]*$/, "/");
  }

  hasParameter(name: string): boolean {
    const url = this.location.href;
    const regexp = getRegExpForParameter(name);
    return regexp.test(url);
  }

  getParameter(name: string): Array<string> {
    const url = this.location.href;
    const regexp = getRegExpForParameter(name);
    const results = [];
    let r;
    while ((r = regexp.exec(url))) {
      results.push(r[1]);
    }
    return results;
  }

  /**
   * @param {string} name
   * @param {string} value
   * @param {number=} index specifies index in multiple parameters with same name.
   */
  setParameter(name: string, value: string, index?: number): void {
    const url = this.location.href;
    let updated = url;
    const regexp = getRegExpForParameter(name);
    let r = regexp.exec(url);
    if (r && index) {
      while (index-- >= 1) {
        r = regexp.exec(url);
      }
    }
    if (r) {
      const l = r[1].length;
      const start = r.index + r[0].length - l;
      updated = url.substring(0, start) + value + url.substring(start + l);
    } else {
      updated = `${
        url + (url.match(/[#&]$/) ? "" : url.match(/#/) ? "&" : "#") + name
      }=${value}`;
      if (name === "src") {
        // "src" should be the first parameter
        updated = updated.replace(/#(?!src)(.*?)&(src=[^&]*)/, "#$2&$1");
      }
    }
    if (updated !== url) {
      if (this.history?.replaceState) {
        this.history.replaceState(null, "", updated);
      } else {
        this.location.href = updated;
      }
      this.storedUrl = updated;
      this.saveViewSettings();
    }
  }

  /**
   * @param {string} name
   * @param {boolean=} keepFirst If true, not remove the first one in multiple parameters with same name.
   */
  removeParameter(name: string, keepFirst?: boolean): void {
    const url = this.location.href;
    let updated = url;
    const regexp = getRegExpForParameter(name);
    let r = regexp.exec(url);
    if (r && keepFirst) {
      r = regexp.exec(url);
    }
    if (r) {
      for (; r; r = regexp.exec(updated)) {
        const end = r.index + r[0].length;
        if (r[0].charAt(0) == "#") {
          updated =
            updated.substring(0, r.index + 1) + updated.substring(end + 1);
        } else {
          updated = updated.substring(0, r.index) + updated.substring(end);
        }
        regexp.lastIndex -= r[0].length;
      }
      updated = updated.replace(/^(.*?)[#&]$/, "$1");
    }
    if (updated !== url) {
      if (this.history?.replaceState) {
        this.history.replaceState(null, "", updated);
      } else {
        this.location.href = updated;
      }
      this.storedUrl = updated;
      this.saveViewSettings();
    }
  }

  /**
   * Enable or disable restoring view settings to the LocalStorage.
   * @param enable true to enable, false to disable
   */
  enableRestoreView(enable: boolean): void {
    const localStorageKey = this.generateLocalStorageKey();
    if (enable) {
      this.localStorageKey = localStorageKey;
    } else {
      this.localStorageKey = null;
      try {
        window.localStorage.removeItem(localStorageKey);
      } catch (e) {
        // ignore
      }
    }
  }

  /**
   * @returns true if restoring view settings to the LocalStorage is enabled.
   */
  isEnabledRestoreView(): boolean {
    return !!this.localStorageKey;
  }

  /**
   * Save view settings to the LocalStorage.
   */
  saveViewSettings(): void {
    if (this.localStorageKey) {
      if (!this.hasParameter("f")) {
        // This is necessary to restore viewing location
        this.setParameter("f", "epubcfi()");
      }
      try {
        window.localStorage.setItem(this.localStorageKey, this.location.hash);
      } catch (e) {
        // ignore
      }
    }
  }

  /**
   * Generate LocalStorage key for restoring view settings.
   * @returns the key, or null if not available
   */
  generateLocalStorageKey(): string | null {
    const src = this.getParameter("src").join();
    if (src) {
      return "view@" + src;
    } else {
      return null;
    }
  }

  /**
   * Restore view settings from the LocalStorage.
   * @returns true if restored
   */
  restoreViewSettings(): boolean {
    const key = this.generateLocalStorageKey();
    if (key) {
      try {
        const saved = window.localStorage.getItem(key);
        if (saved) {
          this.location.hash = saved;
          return true;
        }
      } catch (e) {
        // ignore
      }
    }
    return false;
  }
}

const instance = new URLParameterStore();
export default instance;
