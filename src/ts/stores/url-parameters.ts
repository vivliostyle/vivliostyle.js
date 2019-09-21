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
    location: Location | { href: "" };
    storedUrl: string;

    constructor() {
        this.history = window ? window.history : null;
        this.location = window ? window.location : { href: "" };
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
     * @param {number=} opt_index specifies index in multiple parameters with same name.
     */
    setParameter(name: string, value: string, opt_index?: number): void {
        const url = this.location.href;
        let updated;
        const regexp = getRegExpForParameter(name);
        let r = regexp.exec(url);
        if (r && opt_index) {
            while (opt_index-- >= 1) {
                r = regexp.exec(url);
            }
        }
        if (r) {
            const l = r[1].length;
            const start = r.index + r[0].length - l;
            updated = url.substring(0, start) + value + url.substring(start + l);
        } else {
            updated = `${url + (url.match(/[#&]$/) ? "" : url.match(/#/) ? "&" : "#") + name}=${value}`;
        }
        if (this.history !== null && this.history.replaceState) {
            this.history.replaceState(null, "", updated);
        } else {
            this.location.href = updated;
        }
        this.storedUrl = updated;
    }

    /**
     * @param {string} name
     * @param {boolean=} opt_keepFirst If true, not remove the first one in multiple parameters with same name.
     */
    removeParameter(name: string, opt_keepFirst?: boolean): void {
        const url = this.location.href;
        let updated;
        const regexp = getRegExpForParameter(name);
        let r = regexp.exec(url);
        if (r && opt_keepFirst) {
            r = regexp.exec(url);
        }
        if (r) {
            updated = url;
            for (; r; r = regexp.exec(updated)) {
                const end = r.index + r[0].length;
                if (r[0].charAt(0) == "#") {
                    updated = updated.substring(0, r.index + 1) + updated.substring(end + 1);
                } else {
                    updated = updated.substring(0, r.index) + updated.substring(end);
                }
                regexp.lastIndex -= r[0].length;
            }
            updated = updated.replace(/^(.*?)[#&]$/, "$1");
            if (this.history !== null && this.history.replaceState) {
                this.history.replaceState(null, "", updated);
            } else {
                this.location.href = updated;
            }
        }
        this.storedUrl = updated;
    }
}

const instance = new URLParameterStore();
export default instance;
