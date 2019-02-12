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

const DefaultValue = {
    customWidth: "210mm",
    customHeight: "297mm",
    pageMargin: "10%",
    rootFontSize: "100%",
    rootLineHeight: "normal",
    widowsOrphans: "2",     // for Page Breaks Between Lines option:
    widowsOrphans_min: "1",     // Allow all widows/orphans
    widowsOrphans_max: "9999",  // Never page break inside a paragraph
};

class PageStyle {
    constructor(pageStyle) {
        this.mode = ko.observable(Mode.AUTO);
        this.presetSize = ko.observable(PresetSize[0]);
        this.isLandscape = ko.observable(false);
        this.customWidth = ko.observable(DefaultValue.customWidth);
        this.customHeight = ko.observable(DefaultValue.customHeight);
        this.pageSizeImportant = ko.observable(false);
        this.pageMargin = ko.observable(DefaultValue.pageMargin);
        this.pageMarginImportant = ko.observable(false);
        this.pageOtherStyle = ko.observable("");
        this.firstPageMarginZero = ko.observable(false);
        this.firstPageMarginZeroImportant = ko.observable(false);
        this.firstPageOtherStyle = ko.observable(false);
        this.forceHtmlBodyMarginZero = ko.observable(false);
        this.rootFontSize = ko.observable(DefaultValue.rootFontSize);
        this.rootFontSizeImportant = ko.observable(false);
        this.rootLineHeight = ko.observable(DefaultValue.rootLineHeight);
        this.rootLineHeightImportant = ko.observable(false);
        this.rootOtherStyle = ko.observable("");
        this.widowsOrphans = ko.observable(DefaultValue.widowsOrphans);
        this.widowsOrphansImportant = ko.observable(false);
        this.imageMaxSizeToFitPage = ko.observable(false);
        this.imageMaxSizeImportant = ko.observable(false);
        this.otherStyle = ko.observable("");
        this.allImportant = ko.observable(false);
        this.cssText = ko.pureComputed(() => this.toCSSText());

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

        if (pageStyle) {
            this.copyFrom(pageStyle);
        }

        setDisabledElements(this.mode());

        this.mode.subscribe(mode => {
            setDisabledElements(mode);
        });

        this.allImportant.subscribe(allImportant => {
            this.pageSizeImportant(allImportant);
            this.pageMarginImportant(allImportant);
            this.firstPageMarginZeroImportant(allImportant);
            this.rootFontSizeImportant(allImportant);
            this.rootLineHeightImportant(allImportant);
            this.widowsOrphansImportant(allImportant);
            this.imageMaxSizeImportant(allImportant);
        });
        
        this.pageStyleRegExp = new RegExp(/^@page\s*\{\s*/.source +
            // 1. sizeW, sizeH, sizeImportant,
            /(?:size:\s*([^\s!;{}]+)(?:\s+([^\s!;{}]+))?\s*(!important)?;?\s*)?/.source +

            // 4. pageMargin, pageMarginImportant,
            /(?:margin:\s*([^\s!;{}]+(?:\s+[^\s!;{}]+)?(?:\s+[^\s!;{}]+)?(?:\s+[^\s!;{}]+)?)\s*(!important)?;?\s*)?/.source +

            // 6. pageOtherStyle,
            /((?:[^{}]+|\{[^{}]*\})*)\s*\}\s*/.source +

            // 7. firstPageMarginZero, firstPageMarginZeroImportant, firstPageOtherStyle,
            /(?:@page\s*:first\s*\{\s*(margin:\s*0(?:\w+|%)?\s*(!important)?;?\s*)?((?:[^{}]+|\{[^{}]*\})*)\}\s*)?/.source +

            // 10. forceHtmlBodyMarginZero,
            /(html,\s*body\s*\{\s*margin:\s*0(?:\w+|%)?\s*!important;?\s*\}\s*)?/.source +

            // 11. rootFontSize, rootFontSizeImportant, rootLineHeight, rootLineHeightImportant, rootOtherStyle,
            /(?::root\s*\{\s*(?:font-size:\s*([^\s!;{}]+)\s*(!important)?;?\s*)?(?:line-height:\s*([^\s!;{}]+)\s*(!important)?;?\s*)?([^{}]*)\}\s*)?/.source +

            // 16. forceBodyFontSizeInherit, forceBodyLineHeightInherit,
            /(?:body\s*\{\s*(font-size:\s*inherit\s*!important;?\s*)?(line-height:\s*inherit\s*!important;?\s*)?\}\s*)?/.source +

            // 18. widowsOrphans, widowsOrphansImportant,
            /(\*\s*\{\s*widows:\s*(1|2|9999)\s*(!important)?;\s*orphans:\s*\18\s*\19;?\s*\}\s*)?/.source +

            // 20. imageMaxSizeToFitPage, imageMaxSizeImportant,
            /(img,\s*svg\s*\{\s*max-inline-size:\s*100%\s*(!important)?;\s*max-block-size:\s*100vb\s*\21;?\s*\}\s*)?/.source +

            // 22. otherStyle
            /(.*)$/.source
        );
    }

    fromCSSText(cssText) {
        const r = this.pageStyleRegExp.exec(cssText);
        if (r) {
            let [,
                sizeW, sizeH, sizeImportant,
                pageMargin, pageMarginImportant,
                pageOtherStyle,
                firstPageMarginZero, firstPageMarginZeroImportant, firstPageOtherStyle,
                forceHtmlBodyMarginZero,
                rootFontSize, rootFontSizeImportant, rootLineHeight, rootLineHeightImportant, rootOtherStyle,
                forceBodyFontSizeInherit, forceBodyLineHeightInherit,
                widowsOrphans, widowsOrphansImportant,
                imageMaxSizeToFitPage, imageMaxSizeImportant,
                otherStyle
            ] = r;

            let count = 0;
            let countImportant = 0;
            let countNotImportant = 0;

            if (sizeW == "landscape" || sizeW == "portrait") {
                this.isLandscape(sizeW == "landscape");
                sizeW = sizeH;
                sizeH = null;
            } else if (sizeH == "landscape" || sizeH == "portrait") {
                this.isLandscape(sizeH == "landscape");
                sizeH = null;
            }
            if (sizeW != null) {
                if (sizeH == null) {
                    if (sizeW == "auto") {
                        this.mode(Mode.AUTO);
                    } else {
                        const presetSize = PresetSize.find(presetSize => presetSize.name.toLowerCase() == sizeW.toLowerCase());
                        if (presetSize) {
                            this.mode(Mode.PRESET);
                            this.presetSize(presetSize);
                        } else {
                            this.mode(Mode.CUSTOM);
                            this.customWidth(sizeW);
                            this.customHeight(sizeW);
                        }
                    }
                } else {
                    this.mode(Mode.CUSTOM);
                    this.customWidth(sizeW);
                    this.customHeight(sizeH);
                }
                this.pageSizeImportant(!!sizeImportant);
                count++;
                if (sizeImportant)
                    countImportant++;
                else
                    countNotImportant++;
            }
            if (pageMargin != null) {
                this.pageMargin(pageMargin);
                this.pageMarginImportant(!!pageMarginImportant);
                count++;
                if (pageMarginImportant)
                    countImportant++;
                else
                    countNotImportant++;
            }
            pageOtherStyle = pageOtherStyle && pageOtherStyle.trim() || "";
            if (pageOtherStyle) {
                this.pageOtherStyle(pageOtherStyle);
                count++;
            }

            if (firstPageMarginZero) {
                this.firstPageMarginZero(true);
                this.pageMarginImportant(!!firstPageMarginZeroImportant);
                count++;
                if (firstPageMarginZeroImportant)
                    countImportant++;
                else
                    countNotImportant++;
            }
            firstPageOtherStyle = firstPageOtherStyle && firstPageOtherStyle.trim() || "";
            if (firstPageOtherStyle) {
                this.pageOtherStyle(firstPageOtherStyle);
                count++;
            }

            if (forceHtmlBodyMarginZero) {
                this.forceHtmlBodyMarginZero(true);
                count++;
            }

            if (rootFontSize != null) {
                this.rootFontSize(rootFontSize);
                this.rootFontSizeImportant(!!rootFontSizeImportant);
                count++;
                if (rootFontSizeImportant)
                    countImportant++;
                else
                    countNotImportant++;
            }
            if (rootLineHeight != null) {
                this.rootLineHeight(rootLineHeight);
                this.rootLineHeightImportant(!!rootLineHeightImportant);
                count++;
                if (rootLineHeightImportant)
                    countImportant++;
                else
                    countNotImportant++;
            }
            rootOtherStyle = rootOtherStyle && rootOtherStyle.trim() || "";
            if (rootOtherStyle) {
                this.rootOtherStyle(rootOtherStyle);
                count++;
            }

            if (forceBodyFontSizeInherit) {
                // must be same bool value as rootFontSizeImportant
            }
            if (forceBodyLineHeightInherit) {
                // must be same bool value as rootLineHeightImportant
            }

            if (widowsOrphans != null) {
                this.widowsOrphans(widowsOrphans);
                this.widowsOrphansImportant(!!widowsOrphansImportant);
                count++;
                if (widowsOrphansImportant)
                    countImportant++;
                else
                    countNotImportant++;
            }

            if (imageMaxSizeToFitPage) {
                this.imageMaxSizeToFitPage(true);
                this.imageMaxSizeImportant(!!imageMaxSizeImportant);
                count++;
                if (imageMaxSizeImportant)
                    countImportant++;
                else
                    countNotImportant++;
            }

            otherStyle = otherStyle && otherStyle.trim() || "";
            if (otherStyle) {
                this.otherStyle(otherStyle);
                count++;
            }

            this.allImportant(countImportant > 0 && countNotImportant == 0);

        } else {
            // When not match
            this.otherStyle(cssText);
        }
    }

    toCSSText() {
        function imp(important) {
            return important ? "!important" : "";
        }

        let cssText = "@page{";
        if (this.mode() != Mode.AUTO || this.pageSizeImportant()) {
            cssText += "size:";

            switch (this.mode()) {
                case Mode.AUTO:
                    cssText += "auto";
                    break;
                case Mode.PRESET:
                    cssText += this.presetSize().name;
                    if (this.isLandscape()) {
                        cssText += " landscape";
                    }
                    break;
                case Mode.CUSTOM:
                    cssText += `${this.customWidth()} ${this.customHeight()}`;
                    break;
                default:
                    throw new Error(`Unknown mode ${this.mode()}`);
            }
            cssText += `${imp(this.pageSizeImportant())};`;
        }
        if (this.pageMargin() != DefaultValue.pageMargin || this.pageMarginImportant()) {
            cssText += `margin:${this.pageMargin()}${imp(this.pageMarginImportant())};`;
        }
        cssText += this.pageOtherStyle();
        cssText += "}";

        if (this.firstPageMarginZero() || this.firstPageOtherStyle()) {
            cssText += "@page:first{";
            if (this.firstPageMarginZero()) {
                cssText += `margin:0${imp(this.firstPageMarginZeroImportant())};`;
            }
            cssText += this.firstPageOtherStyle();
            cssText += "}";
        }

        if (this.forceHtmlBodyMarginZero()) {
            cssText += "html,body{margin:0!important;}";
        }

        if (this.rootFontSize() != DefaultValue.rootFontSize || this.rootLineHeight() != DefaultValue.rootLineHeight || this.rootOtherStyle()) {
            cssText += ":root{";
            if (this.rootFontSize() != DefaultValue.rootFontSize) {
                cssText += `font-size:${this.rootFontSize()}${imp(this.rootFontSizeImportant())};`;
            }
            if (this.rootLineHeight() != DefaultValue.rootLineHeight) {
                cssText += `line-height:${this.rootLineHeight()}${imp(this.rootLineHeightImportant())};`;
            }
            cssText += this.rootOtherStyle();
            cssText += "}";
        }
        if (this.rootFontSizeImportant() || this.rootLineHeightImportant()) {
            cssText += `body{`;
            if (this.rootFontSizeImportant()) {
                cssText += "font-size:inherit!important;";
            }
            if (this.rootLineHeightImportant()) {
                cssText += "line-height:inherit!important;";
            }
            cssText += "}";
        }

        if (this.widowsOrphans() != DefaultValue.widowsOrphans) {
            cssText += "*{";
            cssText += `widows:${this.widowsOrphans()}${imp(this.widowsOrphansImportant())};`;
            cssText += `orphans:${this.widowsOrphans()}${imp(this.widowsOrphansImportant())};`;
            cssText += "}";
        }

        if (this.imageMaxSizeToFitPage()) {
            cssText += "img,svg{";
            cssText += `max-inline-size:100%${imp(this.imageMaxSizeImportant())};`;
            cssText += `max-block-size:100vb${imp(this.imageMaxSizeImportant())};`;
            cssText += "}";
        }

        cssText += this.otherStyle();

        return cssText;
    }

    copyFrom(other) {
        this.mode(other.mode());
        this.presetSize(other.presetSize());
        this.isLandscape(other.isLandscape());
        this.customWidth(other.customWidth());
        this.customHeight(other.customHeight());
        this.pageSizeImportant(other.pageSizeImportant());
        this.pageMargin(other.pageMargin());
        this.pageMarginImportant(other.pageMarginImportant());
        this.pageOtherStyle(other.pageOtherStyle());
        this.firstPageMarginZero(other.firstPageMarginZero());
        this.firstPageMarginZeroImportant(other.firstPageMarginZeroImportant());
        this.firstPageOtherStyle(other.firstPageOtherStyle());
        this.forceHtmlBodyMarginZero(other.forceHtmlBodyMarginZero());
        this.rootFontSize(other.rootFontSize());
        this.rootFontSizeImportant(other.rootFontSizeImportant());
        this.rootLineHeight(other.rootLineHeight());
        this.rootLineHeightImportant(other.rootLineHeightImportant());
        this.rootOtherStyle(other.rootOtherStyle());
        this.widowsOrphans(other.widowsOrphans());
        this.widowsOrphansImportant(other.widowsOrphansImportant());
        this.imageMaxSizeToFitPage(other.imageMaxSizeToFitPage());
        this.imageMaxSizeImportant(other.imageMaxSizeImportant());
        this.otherStyle(other.otherStyle());
        this.allImportant(other.allImportant());
    }

    equivalentTo(other) {
        if (this.pageSizeImportant() !== other.pageSizeImportant()) return false;
        if (this.pageMargin() !== other.pageMargin()) return false;
        if (this.pageMarginImportant() !== other.pageMarginImportant()) return false;
        if (this.pageOtherStyle() !== other.pageOtherStyle()) return false;
        if (this.firstPageMarginZero() !== other.firstPageMarginZero()) return false;
        if (this.firstPageMarginZeroImportant() !== other.firstPageMarginZeroImportant()) return false;
        if (this.firstPageOtherStyle() !== other.firstPageOtherStyle()) return false;
        if (this.forceHtmlBodyMarginZero() !== other.forceHtmlBodyMarginZero()) return false;
        if (this.rootFontSize() !== other.rootFontSize()) return false;
        if (this.rootFontSizeImportant() !== other.rootFontSizeImportant()) return false;
        if (this.rootLineHeight() !== other.rootLineHeight()) return false;
        if (this.rootLineHeightImportant() !== other.rootLineHeightImportant()) return false;
        if (this.rootOtherStyle() !== other.rootOtherStyle()) return false;
        if (this.widowsOrphans() !== other.widowsOrphans()) return false;
        if (this.widowsOrphansImportant() !== other.widowsOrphansImportant()) return false;
        if (this.imageMaxSizeToFitPage() !== other.imageMaxSizeToFitPage()) return false;
        if (this.imageMaxSizeImportant() !== other.imageMaxSizeImportant()) return false;
        if (this.otherStyle() !== other.otherStyle()) return false;
        if (this.allImportant() !== other.allImportant()) return false;

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
}

PageStyle.Mode = Mode;
PageStyle.DefaultValue = DefaultValue;
PageStyle.PresetSize = PageStyle.prototype.PresetSize = PresetSize;

export default PageStyle;
