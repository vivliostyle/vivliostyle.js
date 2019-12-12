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

import ko, { Observable } from "knockout";
import urlParameters from "../stores/url-parameters";
import PageStyle from "./page-style";
import stringUtil from "../utils/string-util";

function getDocumentOptionsFromURL() {
  const bookUrl = urlParameters.getParameter("b");
  const xUrl = urlParameters.getParameter("x");
  const fragment = urlParameters.getParameter("f");
  const style = urlParameters.getParameter("style");
  const userStyle = urlParameters.getParameter("userStyle");
  return {
    bookUrl: bookUrl[0] || null, // bookUrl and xUrl are exclusive
    xUrl: !bookUrl[0] && xUrl.length && xUrl[0] ? xUrl : null,
    fragment: fragment[0] || null,
    authorStyleSheet: style.length ? style : [],
    userStyleSheet: userStyle.length ? userStyle : [],
  };
}

class DocumentOptions {
  pageStyle: PageStyle;
  dataUserStyleIndex: number;
  bookUrl?: Observable<string>;
  xUrl?: Observable<Array<string> | null>;
  fragment?: Observable<string>;
  authorStyleSheet?: Observable<Array<unknown>>;
  userStyleSheet?: Observable<Array<unknown>>;

  constructor() {
    const urlOptions = getDocumentOptionsFromURL();
    this.bookUrl = ko.observable(urlOptions.bookUrl || "");
    this.xUrl = ko.observable(urlOptions.xUrl || null);
    this.fragment = ko.observable(urlOptions.fragment || "");
    this.authorStyleSheet = ko.observable(urlOptions.authorStyleSheet);
    this.userStyleSheet = ko.observable(urlOptions.userStyleSheet);
    this.pageStyle = new PageStyle();
    this.dataUserStyleIndex = -1;

    // write fragment back to URL when updated
    this.fragment.subscribe((fragment) => {
      if (/^epubcfi\(\/([246]\/)?2!\)/.test(fragment)) {
        urlParameters.removeParameter("f");
      } else {
        const encoded = fragment.replace(
          /[\s+&?=#\u007F-\uFFFF]+/g,
          encodeURIComponent,
        );
        urlParameters.setParameter("f", encoded);
      }
    });

    // read userStyle=data:.<cssText> URL parameter
    urlOptions.userStyleSheet.find((userStyle, index) => {
      // Find userStyle parameter that starts with "data:" and contains "/*<viewer>*/".
      if (/^data:,.*?\/\*(?:<|%3C)viewer(?:>|%3E)\*\//.test(userStyle)) {
        this.dataUserStyleIndex = index;
        const data = userStyle
          .replace(/^data:,/, "")
          // Escape unescaped "%" that causes error in decodeURIComponent()
          .replace(/%(?![0-9A-Fa-f]{2})/g, "%25");
        const cssText = decodeURIComponent(data);
        this.pageStyle.cssText(cssText);
        return true;
      } else {
        return false;
      }
    });

    // write cssText back to URL parameter userStyle= when updated
    this.pageStyle.cssText.subscribe((cssText) => {
      this.updateUserStyleSheetFromCSSText(cssText);
    });
  }

  toObject() {
    function convertStyleSheetArray(arr) {
      return arr.map((url) => ({
        url,
      }));
    }
    const userStyleSheetArray = convertStyleSheetArray(this.userStyleSheet());
    if (this.pageStyle.pageSizeMode() == PageStyle.Mode.Default) {
      // Put default page size auto. This is needed to output auto size PDF.
      userStyleSheetArray.unshift({ text: "@page{size:auto}" });
    }
    // Do not include url
    // (url is a required argument to Viewer.loadDocument, separated from other options)
    return {
      fragment: this.fragment(),
      authorStyleSheet: convertStyleSheetArray(this.authorStyleSheet()),
      userStyleSheet: userStyleSheetArray,
    };
  }

  updateUserStyleSheetFromCSSText(cssText?: string) {
    if (cssText == undefined) {
      cssText = this.pageStyle.toCSSText();
    }
    const userStyleSheet = this.userStyleSheet();
    if (!cssText || /^\s*(\/\*.*?\*\/\s*)*$/.test(cssText)) {
      if (userStyleSheet.length <= (this.dataUserStyleIndex == -1 ? 0 : 1)) {
        userStyleSheet.pop();
        this.dataUserStyleIndex = -1;
        this.userStyleSheet(userStyleSheet);
        urlParameters.removeParameter("userStyle");
        return;
      }
    }
    const dataUserStyle =
      "data:," + stringUtil.percentEncodeForDataURI(cssText.trim());
    if (this.dataUserStyleIndex == -1) {
      userStyleSheet.push(dataUserStyle);
      this.dataUserStyleIndex = userStyleSheet.length - 1;
    } else {
      userStyleSheet[this.dataUserStyleIndex] = dataUserStyle;
    }
    this.userStyleSheet(userStyleSheet);
    urlParameters.setParameter(
      "userStyle",
      dataUserStyle,
      this.dataUserStyleIndex,
    );
  }
}

export default DocumentOptions;
