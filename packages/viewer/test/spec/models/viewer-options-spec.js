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

import vivliostyle from "../../../src/vivliostyle";
import PageViewMode from "../../../src/models/page-view-mode";
import ViewerOptions from "../../../src/models/viewer-options";
import ZoomOptions from "../../../src/models/zoom-options";
import urlParameters from "../../../src/stores/url-parameters";
import vivliostyleMock from "../../mock/models/vivliostyle";

describe("ViewerOptions", function () {
  let history, location;

  vivliostyleMock();

  beforeEach(function () {
    history = urlParameters.history;
    urlParameters.history = {};
    location = urlParameters.location;
  });

  afterEach(function () {
    urlParameters.history = history;
    urlParameters.location = location;
  });

  describe("constructor", function () {
    it("retrieves parameters from URL", function () {
      urlParameters.location = { href: "http://example.com#spread=true" };
      let options = new ViewerOptions();

      expect(options.pageViewMode()).toEqual(PageViewMode.SPREAD);

      urlParameters.location = { href: "http://example.com#spread=false" };
      options = new ViewerOptions();

      expect(options.pageViewMode()).toBe(PageViewMode.SINGLE_PAGE);

      urlParameters.location = { href: "http://example.com#spread=auto" };
      options = new ViewerOptions();

      expect(options.pageViewMode()).toBe(PageViewMode.AUTO_SPREAD);
    });

    it("copies parameters from the argument", function () {
      const other = new ViewerOptions();
      other.pageViewMode(PageViewMode.SINGLE_PAGE);
      other.fontSize(20);
      other.zoom(ZoomOptions.createFromZoomFactor(1.2));
      const options = new ViewerOptions(other);

      expect(options.pageViewMode()).toBe(PageViewMode.SINGLE_PAGE);
      expect(options.fontSize()).toBe(20);
      expect(options.zoom().zoom).toBe(1.2);
      expect(options.zoom().fitToScreen).toBe(false);
    });
  });

  it("write spread option back to URL when update if it is constructed with no argument", function () {
    urlParameters.location = { href: "http://example.com#spread=true" };
    let options = new ViewerOptions();
    options.pageViewMode(PageViewMode.SINGLE_PAGE);

    expect(urlParameters.location.href).toBe("http://example.com#spread=false");

    options.pageViewMode(PageViewMode.SPREAD);

    expect(urlParameters.location.href).toBe("http://example.com#spread=true");

    // options.pageViewMode(PageViewMode.AUTO_SPREAD);

    // expect(urlParameters.location.href).toBe("http://example.com#spread=auto");

    // not write back if it is constructed with another ViewerOptions
    const other = new ViewerOptions();
    other.pageViewMode(PageViewMode.SINGLE_PAGE);
    other.fontSize(20);
    other.zoom(ZoomOptions.createFromZoomFactor(1.2));
    options = new ViewerOptions(other);
    options.pageViewMode(PageViewMode.SPREAD);

    expect(urlParameters.location.href).toBe("http://example.com#spread=false");
  });

  describe("copyFrom", function () {
    it("copies parameters from the argument to itself", function () {
      const options = new ViewerOptions();
      options.pageViewMode(PageViewMode.SPREAD);
      options.fontSize(10);
      options.zoom(ZoomOptions.createFromZoomFactor(1.4));
      const other = new ViewerOptions();
      other.pageViewMode(PageViewMode.SINGLE_PAGE);
      other.fontSize(20);
      other.zoom(ZoomOptions.createFromZoomFactor(1.2));
      options.copyFrom(other);

      expect(options.pageViewMode()).toBe(PageViewMode.SINGLE_PAGE);
      expect(options.fontSize()).toBe(20);
      expect(options.zoom().zoom).toBe(1.2);
      expect(options.zoom().fitToScreen).toBe(false);
    });
  });

  describe("toObject", function () {
    it("converts parameters to an object", function () {
      const options = new ViewerOptions();
      options.pageViewMode(PageViewMode.SPREAD);
      options.fontSize(20);
      options.zoom(ZoomOptions.createFromZoomFactor(1.2));

      expect(options.toObject()).toEqual({
        fontSize: 20,
        pageViewMode: vivliostyle.viewer.PageViewMode.SPREAD,
        zoom: 1.2,
        fitToScreen: false,
        renderAllPages: true,
      });
    });
  });
});
