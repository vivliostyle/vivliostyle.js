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
import ViewerOptions from "../models/viewer-options";

const Mode = {
    DEFAULT: "",
    AUTO: "auto",
    PRESET: "preset",
    CUSTOM: "custom",
    ZERO: "0"
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

const Constants = {
    customWidth: "210mm",
    customHeight: "297mm",
    customMargin: "10%",
    widowsOrphans_min: "1",     // Allow all widows/orphans
    widowsOrphans_max: "999",  // Never page break inside a paragraph
};

class PageStyle {
    constructor(pageStyle) {
        this.pageSizeMode = ko.observable(Mode.DEFAULT);
        this.presetSize = ko.observable(PresetSize[1]);
        this.isLandscape = ko.observable(false);
        this.customWidth = ko.observable(Constants.customWidth);
        this.customHeight = ko.observable(Constants.customHeight);
        this.pageSizeImportant = ko.observable(false);
        this.pageMarginMode = ko.observable(Mode.DEFAULT);
        this.customMargin = ko.observable(Constants.customMargin);
        this.pageMarginImportant = ko.observable(false);
        this.firstPageMarginZero = ko.observable(false);
        this.firstPageMarginZeroImportant = ko.observable(false);
        this.forceHtmlBodyMarginZero = ko.observable(false);
        this.widowsOrphans = ko.observable(Mode.DEFAULT);
        this.widowsOrphansImportant = ko.observable(false);
        this.imageMaxSizeToFitPage = ko.observable(false);
        this.imageMaxSizeToFitPageImportant = ko.observable(false);
        this.imageKeepAspectRatio = ko.observable(false);
        this.imageKeepAspectRatioImportant = ko.observable(false);
        this.viewerFontSizePercent = ko.observable(100);
        this.baseFontSize = ko.observable("");
        this.baseFontSizeImportant = ko.observable(false);
        this.baseLineHeight = ko.observable("");
        this.baseLineHeightImportant = ko.observable(false);
        this.baseFontFamily = ko.observable("");
        this.baseFontFamilyImportant = ko.observable(false);
        this.allImportant = ko.observable(false);
        this.pageOtherStyle = ko.observable("");
        this.firstPageOtherStyle = ko.observable("");
        this.rootOtherStyle = ko.observable("");
        this.beforeOtherStyle = ko.observable("");
        this.afterOtherStyle = ko.observable("");
        
        this.cssText = ko.pureComputed({
            read() {
                return this.toCSSText();
            },
            write(cssText) {
                this.fromCSSText(cssText);
            },
            owner: this
        });

        this.allImportant.subscribe(allImportant => {
            this.pageSizeImportant(allImportant);
            this.pageMarginImportant(allImportant);
            this.firstPageMarginZeroImportant(allImportant);
            this.widowsOrphansImportant(allImportant);
            this.imageMaxSizeToFitPageImportant(allImportant);
            this.imageKeepAspectRatioImportant(allImportant);
            this.baseFontSizeImportant(allImportant);
            this.baseLineHeightImportant(allImportant);
            this.baseFontFamilyImportant(allImportant);
        });
        
        this.pageStyleRegExp = new RegExp(

            // 1. beforeOtherStyle, viewerFontSizePercent,
            /^(.*?)\/\*<viewer>\*\/\s*(?:\/\*(?:[^*]*;)?\s*font-size:\s*([.\d]+)%\s*(?:;[^*]*)?\*\/\s*)?@page\s*\{\s*/.source +

            // 3. sizeW, sizeH, sizeImportant,
            /(?:size:\s*([^\s!;{}]+)(?:\s+([^\s!;{}]+))?\s*(!important)?;\s*)?/.source +

            // 6. pageMargin, pageMarginImportant,
            /(?:margin:\s*([^\s!;{}]+(?:\s+[^\s!;{}]+)?(?:\s+[^\s!;{}]+)?(?:\s+[^\s!;{}]+)?)\s*(!important)?;\s*)?/.source +

            // 8. pageOtherStyle,
            /((?:[^{}]+|\{[^{}]*\})*)\s*\}\s*/.source +

            // 9. firstPageMarginZero, firstPageMarginZeroImportant, firstPageOtherStyle,
            /(?:@page\s*:first\s*\{\s*(margin:\s*0(?:\w+|%)?\s*(!important)?;\s*)?((?:[^{}]+|\{[^{}]*\})*)\}\s*)?/.source +

            // 12. forceHtmlBodyMarginZero,
            /((?:html|:root),\s*body\s*\{\s*margin:\s*0(?:\w+|%)?\s*!important;\s*\}\s*)?/.source +

            // 13. baseFontSize, baseFontSizeImportant, baseLineHeight, baseLineHeightImportant, baseFontFamily, baseFontFamilyImportant, rootOtherStyle,
            /(?:(?:html|:root)\s*\{\s*(?:font-size:\s*([^\s!;{}]+)\s*(!important)?;\s*)?(?:line-height:\s*([^\s!;{}]+)\s*(!important)?;\s*)?(?:font-family:\s*([^\s!;{}]+)\s*(!important)?;\s*)?([^{}]*)\}\s*)?/.source +

            // body {font-size: inherit !important;} etc.
            /(?:body\s*\{\s*(?:[-\w]+:\s*inherit\s*!important;\s*)+\}\s*)?/.source +

            // 20. widowsOrphans, widowsOrphansImportant,
            /(\*\s*\{\s*widows:\s*(1|999)\s*(!important)?;\s*orphans:\s*\20\s*\21;\s*\}\s*)?/.source +

            // 22. imageMaxSizeToFitPage, imageMaxSizeToFitPageImportant, imageKeepAspectRatio, imageKeepAspectRatioImportant,
            /(img,\s*svg\s*\{\s*max-inline-size:\s*100%\s*(!important)?;\s*max-block-size:\s*100vb\s*\23\s*(object-fit:\s*contain\s*(!important)?;\s*)?\}\s*)?/.source +

            // 26. afterOtherStyle
            /(.*)$/.source
        );
    }

    fromCSSText(cssText) {
        const r = this.pageStyleRegExp.exec(cssText);
        if (r) {
            let [,
                beforeOtherStyle, viewerFontSizePercent,
                sizeW, sizeH, sizeImportant,
                pageMargin, pageMarginImportant,
                pageOtherStyle,
                firstPageMarginZero, firstPageMarginZeroImportant, firstPageOtherStyle,
                forceHtmlBodyMarginZero,
                baseFontSize, baseFontSizeImportant, baseLineHeight, baseLineHeightImportant, baseFontFamily, baseFontFamilyImportant, rootOtherStyle,
                widowsOrphans, widowsOrphansImportant,
                imageMaxSizeToFitPage, imageMaxSizeToFitPageImportant, imageKeepAspectRatio, imageKeepAspectRatioImportant,
                afterOtherStyle
            ] = r;

            let countImportant = 0;
            let countNotImportant = 0;

            beforeOtherStyle = beforeOtherStyle && beforeOtherStyle.trim() || "";
            if (beforeOtherStyle) {
                this.beforeOtherStyle(beforeOtherStyle);
            }

            if (viewerFontSizePercent) {
                this.viewerFontSizePercent(viewerFontSizePercent);
            }

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
                        this.pageSizeMode(Mode.AUTO);
                    } else {
                        const presetSize = PresetSize.find(presetSize => presetSize.name.toLowerCase() == sizeW.toLowerCase());
                        if (presetSize) {
                            this.pageSizeMode(Mode.PRESET);
                            this.presetSize(presetSize);
                        } else {
                            this.pageSizeMode(Mode.CUSTOM);
                            this.customWidth(sizeW);
                            this.customHeight(sizeW);
                        }
                    }
                } else {
                    this.pageSizeMode(Mode.CUSTOM);
                    this.customWidth(sizeW);
                    this.customHeight(sizeH);
                }
                this.pageSizeImportant(!!sizeImportant);
                if (sizeImportant)
                    countImportant++;
                else
                    countNotImportant++;
            }
            if (pageMargin != null) {
                this.pageMarginMode(pageMargin == "0" ? Mode.ZERO : Mode.CUSTOM);
                if (pageMargin == "0") {
                    this.pageMarginMode(Mode.ZERO);
                } else {
                    this.pageMarginMode(Mode.CUSTOM);
                    this.customMargin = pageMargin;
                }
                this.pageMarginImportant(!!pageMarginImportant);
                if (pageMarginImportant)
                    countImportant++;
                else
                    countNotImportant++;
            }
            pageOtherStyle = pageOtherStyle && pageOtherStyle.trim() || "";
            if (pageOtherStyle) {
                this.pageOtherStyle(pageOtherStyle);
            }

            if (firstPageMarginZero) {
                this.firstPageMarginZero(true);
                this.firstPageMarginZeroImportant(!!firstPageMarginZeroImportant);
                if (firstPageMarginZeroImportant)
                    countImportant++;
                else
                    countNotImportant++;
            }
            firstPageOtherStyle = firstPageOtherStyle && firstPageOtherStyle.trim() || "";
            if (firstPageOtherStyle) {
                this.firstPageOtherStyle(firstPageOtherStyle);
            }

            if (forceHtmlBodyMarginZero) {
                this.forceHtmlBodyMarginZero(true);
            }

            if (baseFontSize != null) {
                // This may be calc() e.g. "calc(1.25 * 12pt)" when viewer font size is 125%.
                baseFontSize = baseFontSize.replace(/^\s*calc\([.\d]+\s*\*\s*([.\d]+\w+)\)\s*$/, "$1");
                this.baseFontSize(baseFontSize);
                this.baseFontSizeImportant(!!baseFontSizeImportant);
                if (baseFontSizeImportant)
                    countImportant++;
                else
                    countNotImportant++;
            }
            if (baseLineHeight != null) {
                this.baseLineHeight(baseLineHeight);
                this.baseLineHeightImportant(!!baseLineHeightImportant);
                if (baseLineHeightImportant)
                    countImportant++;
                else
                    countNotImportant++;
            }
            if (baseFontFamily != null) {
                this.baseFontSize(baseFontFamily);
                this.baseFontSizeImportant(!!baseFontFamilyImportant);
                if (baseFontFamilyImportant)
                    countImportant++;
                else
                    countNotImportant++;
            }
            rootOtherStyle = rootOtherStyle && rootOtherStyle.trim() || "";
            if (rootOtherStyle) {
                this.rootOtherStyle(rootOtherStyle);
            }

            if (widowsOrphans != null) {
                this.widowsOrphans(widowsOrphans);
                this.widowsOrphansImportant(!!widowsOrphansImportant);
                if (widowsOrphansImportant)
                    countImportant++;
                else
                    countNotImportant++;
            }

            if (imageMaxSizeToFitPage) {
                this.imageMaxSizeToFitPage(true);
                this.imageMaxSizeToFitPageImportant(!!imageMaxSizeToFitPageImportant);
                if (imageMaxSizeToFitPageImportant)
                    countImportant++;
                else
                    countNotImportant++;
            }

            if (imageKeepAspectRatio) {
                this.imageKeepAspectRatio(true);
                this.imageKeepAspectRatioImportant(!!imageKeepAspectRatioImportant);
                if (imageKeepAspectRatioImportant)
                    countImportant++;
                else
                    countNotImportant++;
            }

            afterOtherStyle = afterOtherStyle && afterOtherStyle.replace(/\/\*<\/viewer>\*\/\s*/, "").trim() || "";
            if (afterOtherStyle) {
                this.afterOtherStyle(afterOtherStyle);
            }

            this.allImportant(countImportant > 0 && countNotImportant == 0);

        } else {
            // When not match
            this.afterOtherStyle(cssText);
        }
    }

    toCSSText() {
        function imp(important) {
            return important ? " !important" : "";
        }

        let cssText = this.beforeOtherStyle();
        if (cssText) {
            cssText += "\n";
        }
        cssText += "/*<viewer>*/\n";
        if (this.viewerFontSizePercent() != 100) {
            cssText += `/*font-size:${this.viewerFontSizePercent()}%;*/`;
        }
        if (this.pageSizeMode() != Mode.DEFAULT || this.pageMarginMode() != Mode.DEFAULT || this.pageOtherStyle()) {
            cssText += "@page { ";
            if (this.pageSizeMode() != Mode.DEFAULT) {
                cssText += "size: ";

                switch (this.pageSizeMode()) {
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
                        throw new Error(`Unknown pageSizeMode ${this.pageSizeMode()}`);
                }
                cssText += `${imp(this.pageSizeImportant())}; `;
            }
            if (this.pageMarginMode() != Mode.DEFAULT) {
                cssText += "margin: ";

                switch (this.pageMarginMode()) {
                    case Mode.AUTO:
                        cssText += "auto";
                        break;
                    case Mode.ZERO:
                        cssText += "0";
                        break;
                    case Mode.CUSTOM:
                        cssText += `${this.customMargin()}`;
                        break;
                    default:
                        throw new Error(`Unknown pageMarginMode ${this.pageMarginMode()}`);
                }
                cssText += `${imp(this.pageMarginImportant())}; `;
            }
            cssText += this.pageOtherStyle();
            cssText += "}\n";
        }

        if (this.firstPageMarginZero() || this.firstPageOtherStyle()) {
            cssText += "@page :first { ";
            if (this.firstPageMarginZero()) {
                cssText += `margin: 0${imp(this.firstPageMarginZeroImportant())}; `;
            }
            cssText += this.firstPageOtherStyle();
            cssText += "}\n";
        }

        if (this.forceHtmlBodyMarginZero()) {
            cssText += ":root, body { margin: 0 !important; }\n";
        }

        if (this.baseFontSize() || this.baseLineHeight() || this.rootOtherStyle()) {
            cssText += ":root { ";
            const baseFontSize = this.baseFontSize();
            if (baseFontSize) {
                if (this.viewerFontSizePercent() != 100 && !baseFontSize.endsWith("%")) {
                    cssText += `font-size: calc(${this.viewerFontSizePercent() / 100} * ${baseFontSize})${imp(this.baseFontSizeImportant())}; `;
                } else {
                    cssText += `font-size: ${this.baseFontSize()}${imp(this.baseFontSizeImportant())}; `;
                }
            }
            if (this.baseLineHeight()) {
                cssText += `line-height: ${this.baseLineHeight()}${imp(this.baseLineHeightImportant())}; `;
            }
            if (this.baseFontFamily()) {
                cssText += `font-family: ${this.baseFontFamily()}${imp(this.baseFontFamilyImportant())}; `;
            }
            cssText += this.rootOtherStyle();
            cssText += "}\n";
        }
        if (this.baseFontSize() && this.baseFontSizeImportant()
                || this.baseLineHeight() && this.baseLineHeightImportant()
                || this.baseFontFamily() && this.baseFontFamilyImportant()) {
            cssText += "body { ";
            if (this.baseFontSize() && this.baseFontSizeImportant()) {
                cssText += "font-size: inherit !important; ";
            }
            if (this.baseLineHeight() && this.baseLineHeightImportant()) {
                cssText += "line-height: inherit !important; ";
            }
            if (this.baseFontFamily() && this.baseFontFamilyImportant()) {
                cssText += "font-family: inherit !important; ";
            }
            cssText += "}\n";
        }

        if (this.widowsOrphans()) {
            cssText += "* { ";
            cssText += `widows: ${this.widowsOrphans()}${imp(this.widowsOrphansImportant())}; `;
            cssText += `orphans: ${this.widowsOrphans()}${imp(this.widowsOrphansImportant())}; `;
            cssText += "}\n";
        }

        if (this.imageMaxSizeToFitPage() || this.imageKeepAspectRatio()) {
            cssText += "img, svg { ";
            if (this.imageMaxSizeToFitPage()) {
                cssText += `max-inline-size: 100%${imp(this.imageMaxSizeToFitPageImportant())}; `;
                cssText += `max-block-size: 100vb${imp(this.imageMaxSizeToFitPageImportant())}; `;
            }
            if (this.imageKeepAspectRatio()) {
                cssText += `object-fit: contain${imp(this.imageKeepAspectRatioImportant())}; `;
            }
            cssText += "}\n";
        }

        cssText += "/*</viewer>*/\n";
        cssText += this.afterOtherStyle();

        return cssText;
    }

    copyFrom(other) {
        this.pageSizeMode(other.pageSizeMode());
        this.presetSize(other.presetSize());
        this.isLandscape(other.isLandscape());
        this.customWidth(other.customWidth());
        this.customHeight(other.customHeight());
        this.pageSizeImportant(other.pageSizeImportant());
        this.pageMarginMode(other.pageMarginMode());
        this.customMargin(other.customMargin());
        this.pageMarginImportant(other.pageMarginImportant());
        this.firstPageMarginZero(other.firstPageMarginZero());
        this.firstPageMarginZeroImportant(other.firstPageMarginZeroImportant());
        this.forceHtmlBodyMarginZero(other.forceHtmlBodyMarginZero());
        this.widowsOrphans(other.widowsOrphans());
        this.widowsOrphansImportant(other.widowsOrphansImportant());
        this.imageMaxSizeToFitPage(other.imageMaxSizeToFitPage());
        this.imageMaxSizeToFitPageImportant(other.imageMaxSizeToFitPageImportant());
        this.imageKeepAspectRatio(other.imageKeepAspectRatio());
        this.imageKeepAspectRatioImportant(other.imageKeepAspectRatioImportant());
        this.viewerFontSizePercent(other.viewerFontSizePercent());
        this.baseFontSize(other.baseFontSize());
        this.baseFontSizeImportant(other.baseFontSizeImportant());
        this.baseLineHeight(other.baseLineHeight());
        this.baseLineHeightImportant(other.baseLineHeightImportant());
        this.baseFontFamily(other.baseFontFamily());
        this.baseFontFamilyImportant(other.baseFontFamilyImportant());
        this.allImportant(other.allImportant());
        this.pageOtherStyle(other.pageOtherStyle());
        this.firstPageOtherStyle(other.firstPageOtherStyle());
        this.rootOtherStyle(other.rootOtherStyle());
        this.beforeOtherStyle(other.beforeOtherStyle());
        this.afterOtherStyle(other.afterOtherStyle());
   }

    equivalentTo(other) {
        if (this.pageSizeMode() !== other.pageSizeMode()) return false;
        if (this.pageSizeMode() === Mode.PRESET && this.presetSize() !== other.presetSize()) return false;
        if (this.pageSizeMode() === Mode.PRESET && this.isLandscape() !== other.isLandscape()) return false;
        if (this.pageSizeMode() === Mode.CUSTOM && this.customWidth() !== other.customWidth()) return false;
        if (this.pageSizeMode() === Mode.CUSTOM && this.customHeight() !== other.customHeight()) return false;
        if (this.pageSizeImportant() !== other.pageSizeImportant()) return false;

        if (this.pageMarginMode() !== other.pageMarginMode()) return false;
        if (this.pageMarginMode() === Mode.CUSTOM && this.customMargin() !== other.customMargin()) return false;
        if (this.pageMarginImportant() !== other.pageMarginImportant()) return false;
        if (this.firstPageMarginZero() !== other.firstPageMarginZero()) return false;
        if (this.firstPageMarginZeroImportant() !== other.firstPageMarginZeroImportant()) return false;
        if (this.forceHtmlBodyMarginZero() !== other.forceHtmlBodyMarginZero()) return false;

        if (this.widowsOrphans() !== other.widowsOrphans()) return false;
        if (this.widowsOrphansImportant() !== other.widowsOrphansImportant()) return false;

        if (this.imageMaxSizeToFitPage() !== other.imageMaxSizeToFitPage()) return false;
        if (this.imageMaxSizeToFitPageImportant() !== other.imageMaxSizeToFitPageImportant()) return false;
        if (this.imageKeepAspectRatio() !== other.imageKeepAspectRatio()) return false;
        if (this.imageKeepAspectRatioImportant() !== other.imageKeepAspectRatioImportant()) return false;

        if (this.viewerFontSizePercent() !== other.viewerFontSizePercent()) return false;
        if (this.baseFontSize() !== other.baseFontSize()) return false;
        if (this.baseFontSizeImportant() !== other.baseFontSizeImportant()) return false;
        if (this.baseLineHeight() !== other.baseLineHeight()) return false;
        if (this.baseLineHeightImportant() !== other.baseLineHeightImportant()) return false;
        if (this.baseFontFamily() !== other.baseFontFamily()) return false;
        if (this.baseFontFamilyImportant() !== other.baseFontFamilyImportant()) return false;

        if (this.allImportant() !== other.allImportant()) return false;
        if (this.pageOtherStyle() !== other.pageOtherStyle()) return false;
        if (this.firstPageOtherStyle() !== other.firstPageOtherStyle()) return false;
        if (this.rootOtherStyle() !== other.rootOtherStyle()) return false;
        if (this.beforeOtherStyle() !== other.beforeOtherStyle()) return false;
        if (this.afterOtherStyle() !== other.afterOtherStyle()) return false;

        return true;
    }
}

PageStyle.Mode = Mode;
PageStyle.Constants = Constants;
PageStyle.PresetSize = PageStyle.prototype.PresetSize = PresetSize;

export default PageStyle;
