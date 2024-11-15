/*
 * Copyright 2015 Daishinsha Inc.
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

import { DocumentOptions as CoreDocumentOptions } from "@vivliostyle/core";
import ko, { Observable } from "knockout";

import PageStyle from "./page-style";
import urlParameters from "../stores/url-parameters";
import stringUtil from "../utils/string-util";

function getDocumentOptionsFromURL(): DocumentOptionsType {
  const srcUrls = urlParameters.getParameter("src");
  const bUrls = urlParameters.getParameter("b"); // (deprecated) => src & bookMode=true
  const xUrls = urlParameters.getParameter("x"); // (deprecated) => src & bookMode=false
  const bookMode = urlParameters.getParameter("bookMode")[0];
  const fragment = urlParameters.getParameter("f")[0];
  const style = urlParameters.getParameter("style");
  const userStyle = urlParameters.getParameter("userStyle");
  return {
    srcUrls: srcUrls.length
      ? srcUrls
      : bUrls.length
        ? bUrls
        : xUrls.length
          ? xUrls
          : null,
    bookMode:
      bookMode === "true"
        ? true
        : bookMode === "false"
          ? false
          : bUrls.length
            ? true
            : xUrls.length
              ? false
              : srcUrls.length > 1
                ? false // multiple srcUrls cannot be bookMode
                : null,
    fragment: fragment || null,
    authorStyleSheet: style.length ? style : [],
    userStyleSheet: userStyle.length ? userStyle : [],
  };
}

interface DocumentOptionsType {
  pageStyle?: PageStyle;
  dataCustomStyleIndex?: number;
  srcUrls?: Array<string>;
  bookMode?: boolean;
  fragment?: string;
  authorStyleSheet?: Array<string>;
  userStyleSheet?: Array<string>;
}

class DocumentOptions {
  pageStyle: PageStyle;
  dataCustomStyleIndex: number;
  srcUrls?: Observable<Array<string> | null>;
  bookMode: Observable<boolean>;
  fragment?: Observable<string>;
  authorStyleSheet?: Observable<Array<string>>;
  userStyleSheet?: Observable<Array<string>>;

  constructor(defaultBookMode: boolean) {
    const urlOptions = getDocumentOptionsFromURL();
    this.srcUrls = ko.observable(urlOptions.srcUrls || null);
    this.bookMode = ko.observable(urlOptions.bookMode ?? defaultBookMode);
    this.fragment = ko.observable(urlOptions.fragment || "");
    this.authorStyleSheet = ko.observable(
      urlOptions.authorStyleSheet as string[],
    );
    this.userStyleSheet = ko.observable(urlOptions.userStyleSheet as string[]);
    this.pageStyle = new PageStyle();
    this.dataCustomStyleIndex = -1;

    this.bookMode.subscribe((bookMode) => {
      if (bookMode === defaultBookMode) {
        urlParameters.removeParameter("bookMode");
      } else {
        urlParameters.setParameter("bookMode", bookMode.toString());
      }
    });

    // write fragment back to URL when updated
    this.fragment.subscribe((fragment) => {
      if (
        /^epubcfi\(\/([246]\/)?2!\)/.test(fragment) &&
        !urlParameters.isEnabledRestoreView()
      ) {
        urlParameters.removeParameter("f");
      } else {
        const encoded = fragment.replace(
          /[\s+&?=#\u007F-\uFFFF]+/g,
          encodeURIComponent,
        );
        urlParameters.setParameter("f", encoded);
      }
    });

    // read style=data:.<cssText> URL parameter
    const findDataCustomStyle = (style: string, index): boolean => {
      // Find style parameter that starts with "data:" and contains "/*<viewer>*/".
      if (/^data:,.*?\/\*(?:<|%3C)viewer(?:>|%3E)\*\//.test(style)) {
        this.dataCustomStyleIndex = index;
        const data = style
          .replace(/^data:,/, "")
          // Escape unescaped "%" that causes error in decodeURIComponent()
          .replace(/%(?![0-9A-Fa-f]{2})/g, "%25");
        const cssText = decodeURIComponent(data);
        this.pageStyle.cssText(cssText);
        return true;
      } else {
        return false;
      }
    };

    if (!urlOptions.authorStyleSheet.find(findDataCustomStyle)) {
      if (urlOptions.userStyleSheet.find(findDataCustomStyle)) {
        this.pageStyle.customStyleAsUserStyle(true);
      }
    }

    // write cssText back to URL parameter style= when updated
    this.pageStyle.cssText.subscribe((cssText) => {
      this.updateCustomStyleSheetFromCSSText(cssText);
    });
  }

  toObject(): CoreDocumentOptions {
    function convertStyleSheetArray(
      arr: string[],
    ): { url?: string; text?: string }[] {
      return arr.map((url) => ({
        url,
      }));
    }
    // Do not include url
    // (url is a required argument to Viewer.loadDocument, separated from other options)
    return {
      fragment: this.fragment(),
      authorStyleSheet: convertStyleSheetArray(this.authorStyleSheet()),
      userStyleSheet: convertStyleSheetArray(this.userStyleSheet()),
    };
  }

  updateCustomStyleSheetFromCSSText(cssText?: string): void {
    if (cssText == undefined) {
      cssText = this.pageStyle.toCSSText();
    }
    const customStyleAsUserStyle = this.pageStyle.customStyleAsUserStyle();
    const param = customStyleAsUserStyle ? "userStyle" : "style";
    const userOrAuthorStyleSheets = customStyleAsUserStyle
      ? this.userStyleSheet
      : this.authorStyleSheet;
    const styleSheets = userOrAuthorStyleSheets();
    if (!cssText || /^\s*(\/\*([^*]|\*(?!\/))*\*\/\s*)*$/.test(cssText)) {
      if (styleSheets.length <= (this.dataCustomStyleIndex == -1 ? 0 : 1)) {
        styleSheets.pop();
        this.dataCustomStyleIndex = -1;
        userOrAuthorStyleSheets(styleSheets);
        urlParameters.removeParameter(param);
        return;
      }
    }
    const dataCustomStyle =
      "data:," + stringUtil.percentEncodeForDataURI(cssText.trim());
    if (this.dataCustomStyleIndex == -1) {
      styleSheets.push(dataCustomStyle);
      this.dataCustomStyleIndex = styleSheets.length - 1;
    } else {
      styleSheets[this.dataCustomStyleIndex] = dataCustomStyle;
    }
    userOrAuthorStyleSheets(styleSheets);
    urlParameters.setParameter(
      param,
      dataCustomStyle,
      this.dataCustomStyleIndex,
    );
  }

  switchCustomStyleUserOrAuthorStyleSheets(): void {
    const customStyleAsUserStyle = this.pageStyle.customStyleAsUserStyle();
    if (this.dataCustomStyleIndex !== -1) {
      const [paramBefore, paramAfter] = customStyleAsUserStyle
        ? ["style", "userStyle"]
        : ["userStyle", "style"];
      const [userOrAuthorStyleSheetsBefore, userOrAuthorStyleSheetsAfter] =
        customStyleAsUserStyle
          ? [this.authorStyleSheet, this.userStyleSheet]
          : [this.userStyleSheet, this.authorStyleSheet];
      const styleSheetsBefore = userOrAuthorStyleSheetsBefore();
      const styleSheetsAfter = userOrAuthorStyleSheetsAfter();

      const dataCustomStyle = styleSheetsBefore[this.dataCustomStyleIndex];
      if (dataCustomStyle) {
        styleSheetsBefore.splice(this.dataCustomStyleIndex, 1);
        styleSheetsAfter.push(dataCustomStyle);
        this.dataCustomStyleIndex = styleSheetsAfter.length - 1;

        userOrAuthorStyleSheetsBefore(styleSheetsBefore);
        userOrAuthorStyleSheetsAfter(styleSheetsAfter);

        urlParameters.removeParameter(paramBefore);
        urlParameters.removeParameter(paramAfter);
        styleSheetsBefore.forEach((value, index) => {
          urlParameters.setParameter(paramBefore, value, index);
        });
        styleSheetsAfter.forEach((value, index) => {
          urlParameters.setParameter(paramAfter, value, index);
        });
      }
    }
  }
}

export default DocumentOptions;
