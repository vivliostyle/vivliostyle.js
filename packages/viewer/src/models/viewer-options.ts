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

import {
  CoreViewerOptions,
  PageViewMode as CorePageViewMode,
} from "@vivliostyle/core";
import ko, { Observable } from "knockout";

import urlParameters from "../stores/url-parameters";
import PageViewMode, { PageViewModeInstance } from "./page-view-mode";
import ZoomOptions, { FitToScreen } from "./zoom-options";

interface ViewerOptionsType {
  renderAllPages: boolean;
  fontSize: number;
  profile: boolean;
  pageViewMode: CorePageViewMode;
  zoom: FitToScreen | undefined;
}

function getViewerOptionsFromURL(): ViewerOptionsType {
  const renderAllPages = urlParameters.getParameter("renderAllPages")[0];
  const fontSizeStr = urlParameters.getParameter("fontSize")[0];
  const r = /^([\d.]+)(?:(%25|%)|\/([\d.]+))?$/.exec(fontSizeStr);
  let fontSize: null | number = null;
  if (r) {
    const [, num, percent, denom] = r;
    fontSize = parseFloat(num);
    if (percent || denom) {
      fontSize = (16 * fontSize) / (percent ? 100 : parseFloat(denom));
    }
    if (fontSize < 5) fontSize = 5;
    if (fontSize > 72) fontSize = 72;
  }
  return {
    renderAllPages:
      renderAllPages === "true"
        ? true
        : renderAllPages === "false"
        ? false
        : urlParameters.hasParameter("b")
        ? false
        : null,
    fontSize,
    profile: urlParameters.getParameter("profile")[0] === "true",
    pageViewMode: PageViewMode.fromSpreadViewString(
      urlParameters.getParameter("spread")[0],
    ),
    zoom: undefined,
  };
}

function getDefaultValues(): ViewerOptionsType {
  return {
    renderAllPages: true,
    fontSize: 16,
    profile: false,
    pageViewMode: PageViewMode.defaultMode(),
    zoom: ZoomOptions.createDefaultOptions(),
  };
}

class ViewerOptions {
  renderAllPages: Observable<boolean>;
  fontSize: Observable<number | string>;
  profile: Observable<boolean>;
  pageViewMode: Observable<CorePageViewMode>;
  zoom: Observable<ZoomOptions>;

  static getDefaultValues: () => {
    renderAllPages: boolean;
    fontSize: number;
    profile: boolean;
    pageViewMode: CorePageViewMode;
    zoom: FitToScreen;
  };

  constructor(defaultRenderAllPages: boolean);
  constructor(options: ViewerOptions);

  constructor(arg: boolean | ViewerOptions) {
    const defaultRenderAllPages: boolean =
      typeof arg === "boolean" ? arg : undefined;
    const options: ViewerOptions = typeof arg === "object" ? arg : undefined;

    this.renderAllPages = ko.observable();
    this.fontSize = ko.observable();
    this.profile = ko.observable();
    this.pageViewMode = ko.observable();
    this.zoom = ko.observable();

    if (options) {
      this.copyFrom(options);
    } else {
      const defaultValues = getDefaultValues();
      const urlOptions = getViewerOptionsFromURL();
      this.renderAllPages(urlOptions.renderAllPages ?? defaultRenderAllPages);
      this.fontSize(urlOptions.fontSize || defaultValues.fontSize);
      this.profile(urlOptions.profile || defaultValues.profile);
      this.pageViewMode(urlOptions.pageViewMode || defaultValues.pageViewMode);
      this.zoom(defaultValues.zoom);

      // write spread parameter back to URL when updated
      this.pageViewMode.subscribe((pageViewMode) => {
        if (pageViewMode === defaultValues.pageViewMode) {
          urlParameters.removeParameter("spread");
        } else {
          urlParameters.setParameter(
            "spread",
            ((pageViewMode as unknown) as PageViewModeInstance).toSpreadViewString(),
          );
        }
      });
      this.renderAllPages.subscribe((renderAllPages) => {
        if (renderAllPages === defaultRenderAllPages) {
          urlParameters.removeParameter("renderAllPages");
        } else {
          urlParameters.setParameter(
            "renderAllPages",
            renderAllPages.toString(),
          );
        }
      });
      this.fontSize.subscribe((fontSize) => {
        if (typeof fontSize == "number") {
          fontSize = fontSize
            .toPrecision(10)
            .replace(/(?:\.0*|(\.\d*?)0+)$/, "$1");
        }
        if (Number(fontSize) == defaultValues.fontSize) {
          urlParameters.removeParameter("fontSize");
        } else {
          urlParameters.setParameter(
            "fontSize",
            `${fontSize}/${defaultValues.fontSize}`,
          );
        }
      });
    }
  }

  copyFrom(other: ViewerOptions): void {
    this.renderAllPages(other.renderAllPages());
    this.fontSize(other.fontSize());
    this.profile(other.profile());
    this.pageViewMode(other.pageViewMode());
    this.zoom(other.zoom());
  }

  toObject(): CoreViewerOptions {
    return {
      renderAllPages: this.renderAllPages() as boolean,
      fontSize: Number(this.fontSize()),
      pageViewMode: this.pageViewMode().toString() as CorePageViewMode,
      fitToScreen: this.zoom().fitToScreen,
      zoom: this.zoom().zoom,
    };
  }
}

ViewerOptions.getDefaultValues = getDefaultValues;

export default ViewerOptions;
