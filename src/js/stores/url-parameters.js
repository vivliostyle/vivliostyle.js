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

import stringUtil from "../utils/string-util"

function getRegExpForParameter(name) {
    return new RegExp("[#&]" + stringUtil.escapeUnicodeString(name) + "=([^&]*)", "g");
}

class URLParameterStore {
    constructor() {
        this.history = window ? window.history : {};
        this.location = window ? window.location : {url: ""};
    }

    getBaseURL() {
        let url = this.location.href;
        url = url.replace(/#.*$/, "");
        return url.replace(/\/[^/]*$/, "/");
    }

    getParameter(name, dontPercentDecode) {
        const url = this.location.href;
        const regexp = getRegExpForParameter(name);
        const results = [];
        let r;
        while (r = regexp.exec(url)) {
            let value = r[1];
            if (!dontPercentDecode) value = stringUtil.percentDecodeAmpersandAndPercent(value);
            results.push(value);
        }
        return results;
    }

    setParameter(name, value, dontPercentEncode) {
        const url = this.location.href;
        if (!dontPercentEncode) value = stringUtil.percentEncodeAmpersandAndPercent(value);
        let updated;
        const regexp = getRegExpForParameter(name);
        const r = regexp.exec(url);
        if (r) {
            const l = r[1].length;
            const start = r.index + r[0].length - l;
            updated = url.substring(0, start) + value + url.substring(start + l);
        } else {
            updated = url + (url.match(/#/) ? "&" : "#") + name + "=" + value;
        }
        if (this.history.replaceState) {
            this.history.replaceState(null, "", updated);
        } else {
            this.location.href = updated;
        }
    }
}

export default new URLParameterStore();
