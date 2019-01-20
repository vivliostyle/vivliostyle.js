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

import ko from "knockout";

const Mode = {
    AUTO: "auto",
    PRESET: "preset",
    CUSTOM: "custom"
};

const PresetSize = [
    {name: "A5", description: "A5"},
    {name: "A4", description: "A4"},
    {name: "A3", description: "A3"},
    {name: "B5", description: "B5 (ISO)"},
    {name: "B4", description: "B4 (ISO)"},
    {name: "JIS-B5", description: "B5 (JIS)"},
    {name: "JIS-B4", description: "B4 (JIS)"},
    {name: "letter", description: "letter"},
    {name: "legal", description: "legal"},
    {name: "ledger", description: "ledger"}
];

class PageSize {
    constructor(pageSize) {
        this.mode = ko.observable(Mode.AUTO);
        this.presetSize = ko.observable(PresetSize[0]);
        this.isLandscape = ko.observable(false);
        this.customWidth = ko.observable("210mm");
        this.customHeight = ko.observable("297mm");
        this.isImportant = ko.observable(false);
        
        const setDisabledElements = (mode) => {
            const presetSelectElem = document.getElementsByName("vivliostyle-misc_paginate_page-size_preset-select")[0];
            if (!presetSelectElem) {
                return;
            }
            const presetLandscapeElem = document.getElementsByName("vivliostyle-misc_paginate_page-size_preset-landscape")[0];
            const customWidthElem = document.getElementsByName("vivliostyle-misc_paginate_page-size_custom-width")[0];
            const customHeightElem = document.getElementsByName("vivliostyle-misc_paginate_page-size_custom-height")[0];

            switch (mode) {
                case Mode.AUTO:
                    presetSelectElem.disabled = true;
                    presetLandscapeElem.disabled = true;
                    customWidthElem.disabled = true;
                    customHeightElem.disabled = true;
                    break;
                case Mode.PRESET:
                    presetSelectElem.disabled = false;
                    presetLandscapeElem.disabled = false;
                    customWidthElem.disabled = true;
                    customHeightElem.disabled = true;
                    break;
                case Mode.CUSTOM:
                    presetSelectElem.disabled = true;
                    presetLandscapeElem.disabled = true;
                    customWidthElem.disabled = false;
                    customHeightElem.disabled = false;
                    break;
            }
        };

        if (pageSize) {
            this.copyFrom(pageSize);
        }

        setDisabledElements(this.mode());

        this.mode.subscribe(mode => {
            setDisabledElements(mode);
        });
    }

    copyFrom(other) {
        this.mode(other.mode());
        this.presetSize(other.presetSize());
        this.isLandscape(other.isLandscape());
        this.customWidth(other.customWidth());
        this.customHeight(other.customHeight());
        this.isImportant(other.isImportant());
    }

    equivalentTo(other) {
        if (this.isImportant() !== other.isImportant()) {
            return false;
        }
        const mode = this.mode();
        if (other.mode() === mode) {
            switch (mode) {
                case Mode.AUTO:
                    return true;
                case Mode.PRESET:
                    return this.presetSize() === other.presetSize() && this.isLandscape() === other.isLandscape();
                case Mode.CUSTOM:
                    return this.customWidth() === other.customWidth() && this.customHeight() === other.customHeight();
                default:
                    throw new Error(`Unknown mode ${mode}`);
            }
        } else {
            return false;
        }
    }

    toCSSDeclarationString() {
        let declaration = "size: ";
        switch (this.mode()) {
            case Mode.AUTO:
                declaration += "auto";
                break;
            case Mode.PRESET:
                declaration += this.presetSize().name;
                if (this.isLandscape()) {
                    declaration += " landscape";
                }
                break;
            case Mode.CUSTOM:
                declaration += `${this.customWidth()} ${this.customHeight()}`;
                break;
            default:
                throw new Error(`Unknown mode ${this.mode()}`);
        }

        if (this.isImportant()) {
            declaration += " !important";
        }

        return `${declaration};`;
    }
}

PageSize.Mode = Mode;
PageSize.PresetSize = PageSize.prototype.PresetSize = PresetSize;

export default PageSize;
