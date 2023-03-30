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
import ZoomOptions from "./zoom-options";

/**
 * Viewer Options
 * See CoreViewerOptions in core/src/vivliostyle/core-viewer.ts
 */
interface ViewerOptionsType {
  allowScripts: boolean;
  renderAllPages: boolean;
  fontSize: number;
  profile: boolean;
  pageViewMode: CorePageViewMode;
  zoom: ZoomOptions;
  pixelRatio: number;
  enableMarker: boolean;
}

function getViewerOptionsFromURL(): ViewerOptionsType {
  const allowScripts = urlParameters.getParameter("allowScripts")[0];
  const renderAllPages = urlParameters.getParameter("renderAllPages")[0];
  const fontSizeStr = urlParameters.getParameter("fontSize")[0];
  const enableMarker = urlParameters.getParameter("enableMarker")[0];
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
  const zoomStr = urlParameters.getParameter("zoom")[0];
  const zoomFactor = parseFloat(zoomStr);

  const pixelRatioStr = urlParameters.getParameter("pixelRatio")[0];
  const pixelRatio = pixelRatioStr && parseFloat(pixelRatioStr);

  return {
    allowScripts:
      allowScripts === "true" ? true : allowScripts === "false" ? false : null,
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
    zoom:
      zoomFactor > 0
        ? ZoomOptions.createFromZoomFactor(zoomFactor)
        : ZoomOptions.createDefaultOptions(),
    pixelRatio,
    enableMarker:
      enableMarker === "true" ? true : enableMarker === "false" ? false : null,
  };
}

function getDefaultValues(): ViewerOptionsType {
  return {
    allowScripts: true,
    renderAllPages: true,
    fontSize: 16,
    profile: false,
    pageViewMode: PageViewMode.defaultMode(),
    zoom: ZoomOptions.createDefaultOptions(),
    pixelRatio: 8,
    enableMarker: false,
  };
}

function numberToString(number: number): string {
  return number.toPrecision(10).replace(/(?:\.0*|(\.\d*?)0+)$/, "$1");
}

class ViewerOptions {
  allowScripts: Observable<boolean>;
  renderAllPages: Observable<boolean>;
  fontSize: Observable<number | string>;
  profile: Observable<boolean>;
  pageViewMode: Observable<CorePageViewMode>;
  zoom: Observable<ZoomOptions>;
  pixelRatio: Observable<number>;
  enableMarker: Observable<boolean>;

  static getDefaultValues: () => {
    allowScripts: boolean;
    renderAllPages: boolean;
    fontSize: number;
    profile: boolean;
    pageViewMode: CorePageViewMode;
    zoom: ZoomOptions;
    pixelRatio: number;
    enableMarker: boolean;
  };

  constructor(defaultRenderAllPages: boolean);
  constructor(options: ViewerOptions);

  constructor(arg: boolean | ViewerOptions) {
    const defaultRenderAllPages: boolean =
      typeof arg === "boolean" ? arg : undefined;
    const options: ViewerOptions = typeof arg === "object" ? arg : undefined;

    this.allowScripts = ko.observable();
    this.renderAllPages = ko.observable();
    this.fontSize = ko.observable();
    this.profile = ko.observable();
    this.pageViewMode = ko.observable();
    this.zoom = ko.observable();
    this.pixelRatio = ko.observable();
    this.enableMarker = ko.observable();

    if (options) {
      this.copyFrom(options);
    } else {
      const defaultValues = getDefaultValues();
      const urlOptions = getViewerOptionsFromURL();
      this.allowScripts(urlOptions.allowScripts ?? defaultValues.allowScripts);
      this.renderAllPages(urlOptions.renderAllPages ?? defaultRenderAllPages);
      this.fontSize(urlOptions.fontSize || defaultValues.fontSize);
      this.profile(urlOptions.profile || defaultValues.profile);
      this.pageViewMode(urlOptions.pageViewMode || defaultValues.pageViewMode);
      this.zoom(urlOptions.zoom || defaultValues.zoom);
      this.pixelRatio(urlOptions.pixelRatio ?? defaultValues.pixelRatio);
      this.enableMarker(urlOptions.enableMarker || defaultValues.enableMarker);

      // write spread parameter back to URL when updated
      this.pageViewMode.subscribe((pageViewMode) => {
        if (pageViewMode === defaultValues.pageViewMode) {
          urlParameters.removeParameter("spread");
        } else {
          urlParameters.setParameter(
            "spread",
            (
              pageViewMode as unknown as PageViewModeInstance
            ).toSpreadViewString(),
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
          fontSize = numberToString(fontSize);
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
      this.zoom.subscribe((zoom) => {
        if (zoom.fitToScreen) {
          urlParameters.removeParameter("zoom");
        } else {
          urlParameters.setParameter(
            "zoom",
            numberToString(zoom.getCurrentZoomFactor()),
          );
        }
      });
      this.enableMarker.subscribe((enableMarker) => {
        if (!enableMarker) {
          urlParameters.removeParameter("enableMarker");
        } else {
          urlParameters.setParameter("enableMarker", "true");
        }
      });
    }
  }

  copyFrom(other: ViewerOptions): void {
    this.allowScripts(other.allowScripts());
    this.renderAllPages(other.renderAllPages());
    this.fontSize(other.fontSize());
    this.profile(other.profile());
    this.pageViewMode(other.pageViewMode());
    this.zoom(other.zoom());
    this.pixelRatio(other.pixelRatio());
    this.enableMarker(other.enableMarker());
  }

  toObject(): CoreViewerOptions {
    return {
      allowScripts: this.allowScripts() as boolean,
      renderAllPages: this.renderAllPages() as boolean,
      fontSize: Number(this.fontSize()),
      pageViewMode: this.pageViewMode().toString() as CorePageViewMode,
      fitToScreen: this.zoom().fitToScreen,
      zoom: this.zoom().zoom,
      pixelRatio: this.pixelRatio(),
    };
  }
}

ViewerOptions.getDefaultValues = getDefaultValues;

export default ViewerOptions;
