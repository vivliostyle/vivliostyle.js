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
    baseFontSize: "12pt",
    baseLineHeight: "1.2",
    baseFontFamily: "serif",
    viewerFontSize: 16
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
        this.widowsOrphans = ko.observable("");
        this.widowsOrphansImportant = ko.observable(false);
        this.imageMaxSizeToFitPage = ko.observable(false);
        this.imageMaxSizeToFitPageImportant = ko.observable(false);
        this.imageKeepAspectRatio = ko.observable(false);
        this.imageKeepAspectRatioImportant = ko.observable(false);
        this.baseFontSize = ko.observable(Constants.baseFontSize);
        this.baseFontSizeCheck = ko.observable(false);
        this.baseFontSizeImportant = ko.observable(false);
        this.baseLineHeight = ko.observable(Constants.baseLineHeight);
        this.baseLineHeightCheck = ko.observable(false);
        this.baseLineHeightImportant = ko.observable(false);
        this.baseFontFamily = ko.observable(Constants.baseFontFamily);
        this.baseFontFamilyCheck = ko.observable(false);
        this.baseFontFamilyImportant = ko.observable(false);
        this.allImportant = ko.observable(false);
        this.pageOtherStyle = ko.observable("");
        this.firstPageOtherStyle = ko.observable("");
        this.rootOtherStyle = ko.observable("");
        this.beforeOtherStyle = ko.observable("");
        this.afterOtherStyle = ko.observable("");

        this.viewerFontSize = null; // ko.observable(Constants.viewerFontSize);

        this.viewerFontSizePercent = ko.pureComputed({
            read: () => {
                if (this.viewerFontSize) {
                    const percent = this.viewerFontSize() / Constants.viewerFontSize * 100;
                    const rounded = percent.toPrecision(10).replace(/(?:\.0*|(\.\d*?)0+)$/, "$1");
                    return 1 * rounded;
                } else {
                    return 100;
                }
            },
            write: (viewerFontSizePercent) => {
                if (this.viewerFontSize) {
                    this.viewerFontSize(viewerFontSizePercent / 100 * Constants.viewerFontSize);
                }
            },
            owner: this
        });

        this.cssText = ko.pureComputed({
            read: this.toCSSText,
            write: this.fromCSSText,
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

            // 1. beforeOtherStyle,
            "^(.*?)\\/\\*<viewer>\\*\\/\\s*(?:@page\\s*\\{\\s*" +

            // 2. sizeW, sizeH, sizeImportant,
            "(?:size:\\s*([^\\s!;{}]+)(?:\\s+([^\\s!;{}]+))?\\s*(!important)?;\\s*)?" +

            // 5. pageMargin, pageMarginImportant,
            "(?:margin:\\s*([^\\s!;{}]+(?:\\s+[^\\s!;{}]+)?(?:\\s+[^\\s!;{}]+)?(?:\\s+[^\\s!;{}]+)?)\\s*(!important)?;\\s*)?" +

            // 7. pageOtherStyle,
            "((?:[^{}]+|\\{[^{}]*\\})*)\\}\\s*)?" +

            // 8. firstPageMarginZero, firstPageMarginZeroImportant, firstPageOtherStyle,
            "(?:@page\\s*:first\\s*\\{\\s*(margin:\\s*0(?:\\w+|%)?\\s*(!important)?;\\s*)?((?:[^{}]+|\\{[^{}]*\\})*)\\}\\s*)?" +

            // 11. forceHtmlBodyMarginZero,
            "((?:html|:root),\\s*body\\s*\\{\\s*margin:\\s*0(?:\\w+|%)?\\s*!important;\\s*\\}\\s*)?" +

            // 12. baseFontSize, baseFontSizeImportant, baseLineHeight, baseLineHeightImportant, baseFontFamily, baseFontFamilyImportant, rootOtherStyle,
            "(?:(?:html|:root)\\s*\\{\\s*(?:font-size:\\s*(calc\\([^()]+\\)|[^\\s!;{}]+)\\s*(!important)?;\\s*)?(?:line-height:\\s*([^\\s!;{}]+)\\s*(!important)?;\\s*)?(?:font-family:\\s*([^\\s!;{}]+)\\s*(!important)?;\\s*)?([^{}]*)\\}\\s*)?" +

            // body {font-size: inherit !important;} etc.
            "(?:body\\s*\\{\\s*(?:[-\\w]+:\\s*inherit\\s*!important;\\s*)+\\}\\s*)?" +

            // 19. widowsOrphans, widowsOrphansImportant,
            "(?:\\*\\s*\\{\\s*widows:\\s*(1|999)\\s*(!important)?;\\s*orphans:\\s*\\19\\s*\\20;\\s*\\}\\s*)?" +

            // 21. imageMaxSizeToFitPage, imageMaxSizeToFitPageImportant, imageKeepAspectRatio, imageKeepAspectRatioImportant,
            "(?:img,\\s*svg\\s*\\{\\s*(max-inline-size:\\s*100%\\s*(!important)?;\\s*max-block-size:\\s*100vb\\s*\\22;\\s*)?(object-fit:\\s*contain\\s*(!important)?;\\s*)?\\}\\s*)?" +

            // 25. afterOtherStyle
            "((?:\n|.)*)$"
        );

        if (pageStyle) {
            this.copyFrom(pageStyle);
            this.viewerFontSize = pageStyle.viewerFontSize;
        }
    }

    fromCSSText(cssText) {
        const r = this.pageStyleRegExp.exec(cssText);
        if (r) {
            let [,
                beforeOtherStyle,
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

            this.beforeOtherStyle(beforeOtherStyle);

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
            } else {
                this.pageSizeMode(Mode.DEFAULT);
            }
            if (pageMargin != null) {
                this.pageMarginMode(pageMargin == "0" ? Mode.ZERO : Mode.CUSTOM);
                if (pageMargin == "0") {
                    this.pageMarginMode(Mode.ZERO);
                } else {
                    this.pageMarginMode(Mode.CUSTOM);
                    this.customMargin(pageMargin);
                }
                this.pageMarginImportant(!!pageMarginImportant);
                if (pageMarginImportant)
                    countImportant++;
                else
                    countNotImportant++;
            } else {
                this.pageMarginMode(Mode.DEFAULT);
            }
            pageOtherStyle = pageOtherStyle || "";
            this.pageOtherStyle(pageOtherStyle);

            if (firstPageMarginZero) {
                this.firstPageMarginZero(true);
                this.firstPageMarginZeroImportant(!!firstPageMarginZeroImportant);
                if (firstPageMarginZeroImportant)
                    countImportant++;
                else
                    countNotImportant++;
            } else {
                this.firstPageMarginZero(false);
            }
            firstPageOtherStyle = firstPageOtherStyle || "";
            this.firstPageOtherStyle(firstPageOtherStyle);

            if (forceHtmlBodyMarginZero) {
                this.forceHtmlBodyMarginZero(true);
            } else {
                this.forceHtmlBodyMarginZero(false);
            }

            if (baseFontSize != null) {
                // This may be calc() e.g. "calc(1.25 * 12pt)" when viewer font size is 125%.
                baseFontSize = baseFontSize.replace(/^\s*calc\([.\d]+\s*\*\s*([.\d]+\w+)\)\s*$/, "$1");
                this.baseFontSizeCheck(true);
                this.baseFontSize(baseFontSize);
                this.baseFontSizeImportant(!!baseFontSizeImportant);
                if (baseFontSizeImportant)
                    countImportant++;
                else
                    countNotImportant++;
            } else {
                this.baseFontSizeCheck(false);
            }
            if (baseLineHeight != null) {
                this.baseLineHeightCheck(true);
                this.baseLineHeight(baseLineHeight);
                this.baseLineHeightImportant(!!baseLineHeightImportant);
                if (baseLineHeightImportant)
                    countImportant++;
                else
                    countNotImportant++;
            } else {
                this.baseLineHeightCheck(false);
            }
            if (baseFontFamily != null) {
                this.baseFontSizeCheck(true);
                this.baseFontSize(baseFontFamily);
                this.baseFontSizeImportant(!!baseFontFamilyImportant);
                if (baseFontFamilyImportant)
                    countImportant++;
                else
                    countNotImportant++;
            } else {
                this.baseFontSizeCheck(false);
            }
            rootOtherStyle = rootOtherStyle || "";
            this.rootOtherStyle(rootOtherStyle);

            if (widowsOrphans != null) {
                this.widowsOrphans(widowsOrphans);
                this.widowsOrphansImportant(!!widowsOrphansImportant);
                if (widowsOrphansImportant)
                    countImportant++;
                else
                    countNotImportant++;
            } else {
                this.widowsOrphans(Mode.DEFAULT);
            }

            if (imageMaxSizeToFitPage) {
                this.imageMaxSizeToFitPage(true);
                this.imageMaxSizeToFitPageImportant(!!imageMaxSizeToFitPageImportant);
                if (imageMaxSizeToFitPageImportant)
                    countImportant++;
                else
                    countNotImportant++;
            } else {
                this.imageMaxSizeToFitPage(false);
            }

            if (imageKeepAspectRatio) {
                this.imageKeepAspectRatio(true);
                this.imageKeepAspectRatioImportant(!!imageKeepAspectRatioImportant);
                if (imageKeepAspectRatioImportant)
                    countImportant++;
                else
                    countNotImportant++;
            } else {
                this.imageKeepAspectRatio(false);
            }

            afterOtherStyle = afterOtherStyle.replace(/\/\*<\/?viewer>\*\/\n?/g, "") || "";
            this.afterOtherStyle(afterOtherStyle);

            this.allImportant(countImportant > 0 && countNotImportant == 0);

        } else {
            // When not match
            const afterOtherStyle = cssText.replace(/\/\*<\/?viewer>\*\/\n?/g, "") || "";
            this.afterOtherStyle(afterOtherStyle);
        }
    }

    toCSSText() {
        function imp(important) {
            return important ? " !important" : "";
        }

        let cssText = this.beforeOtherStyle();
        cssText += "/*<viewer>*/\n";
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

        if (this.baseFontSizeCheck() || this.baseLineHeightCheck() || this.baseFontFamilyCheck() || this.rootOtherStyle()) {
            cssText += ":root { ";
            const baseFontSize = this.baseFontSize();
            if (this.baseFontSizeCheck()) {
                if (this.viewerFontSizePercent() != 100 && !baseFontSize.endsWith("%")) {
                    cssText += `font-size: calc(${this.viewerFontSizePercent() / 100} * ${baseFontSize})${imp(this.baseFontSizeImportant())}; `;
                } else {
                    cssText += `font-size: ${this.baseFontSize()}${imp(this.baseFontSizeImportant())}; `;
                }
            }
            if (this.baseLineHeightCheck()) {
                cssText += `line-height: ${this.baseLineHeight()}${imp(this.baseLineHeightImportant())}; `;
            }
            if (this.baseFontFamilyCheck()) {
                cssText += `font-family: ${this.baseFontFamily()}${imp(this.baseFontFamilyImportant())}; `;
            }
            cssText += this.rootOtherStyle();
            cssText += "}\n";
        }
        if (this.baseFontSizeCheck() && this.baseFontSizeImportant()
                || this.baseLineHeightCheck() && this.baseLineHeightImportant()
                || this.baseFontFamilyCheck() && this.baseFontFamilyImportant()) {
            cssText += "body { ";
            if (this.baseFontSizeCheck() && this.baseFontSizeImportant()) {
                cssText += "font-size: inherit !important; ";
            }
            if (this.baseLineHeightCheck() && this.baseLineHeightImportant()) {
                cssText += "line-height: inherit !important; ";
            }
            if (this.baseFontFamilyCheck() && this.baseFontFamilyImportant()) {
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
        this.baseFontSize(other.baseFontSize());
        this.baseFontSizeCheck(other.baseFontSizeCheck());
        this.baseFontSizeImportant(other.baseFontSizeImportant());
        this.baseLineHeight(other.baseLineHeight());
        this.baseLineHeightCheck(other.baseLineHeightCheck());
        this.baseLineHeightImportant(other.baseLineHeightImportant());
        this.baseFontFamily(other.baseFontFamily());
        this.baseFontFamilyCheck(other.baseFontFamilyCheck());
        this.baseFontFamilyImportant(other.baseFontFamilyImportant());
        this.allImportant(other.allImportant());
        this.pageOtherStyle(other.pageOtherStyle());
        this.firstPageOtherStyle(other.firstPageOtherStyle());
        this.rootOtherStyle(other.rootOtherStyle());
        this.beforeOtherStyle(other.beforeOtherStyle());
        this.afterOtherStyle(other.afterOtherStyle());

        this.viewerFontSize = other.viewerFontSize;
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

        if (this.baseFontSizeCheck() !== other.baseFontSizeCheck()) return false;
        if (this.baseFontSizeCheck() && this.baseFontSize() !== other.baseFontSize()) return false;
        if (this.baseFontSizeImportant() !== other.baseFontSizeImportant()) return false;
        if (this.baseLineHeightCheck() !== other.baseLineHeightCheck()) return false;
        if (this.baseLineHeightCheck() && this.baseLineHeight() !== other.baseLineHeight()) return false;
        if (this.baseLineHeightImportant() !== other.baseLineHeightImportant()) return false;
        if (this.baseFontFamilyCheck() !== other.baseFontFamilyCheck()) return false;
        if (this.baseFontFamilyCheck() && this.baseFontFamily() !== other.baseFontFamily()) return false;
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
