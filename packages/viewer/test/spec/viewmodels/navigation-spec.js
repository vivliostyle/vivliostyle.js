/* eslint-disable @typescript-eslint/no-empty-function */
/*
 * Copyright 2015 Daishinsha Inc.
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
import ViewerOptions from "../../../src/models/viewer-options";
import ZoomOptions from "../../../src/models/zoom-options";
import Navigation from "../../../src/viewmodels/navigation";
import vivliostyleMock from "../../mock/models/vivliostyle";

describe("Navigation", function () {
  let viewerOptions;
  let viewer;
  let settingsPanel;
  const defaultNavigationOptions = {
    disablePageNavigation: false,
    disableZoom: false,
    disableFontSizeChange: false,
  };

  vivliostyleMock();

  beforeEach(function () {
    viewerOptions = new ViewerOptions();
    viewer = {
      state: { navigatable: ko.observable(false) },
      navigateToPrevious: function () {},
      navigateToNext: function () {},
      navigateToLeft: function () {},
      navigateToRight: function () {},
      navigateToFirst: function () {},
      navigateToLast: function () {},
      queryZoomFactor: function () {},
    };
    settingsPanel = { opened: ko.observable(false) };
  });

  function createNavigation(options) {
    return new Navigation(
      viewerOptions,
      viewer,
      settingsPanel,
      options || defaultNavigationOptions,
    );
  }

  function setDisabled(val) {
    viewer.state.navigatable(!val);
  }

  // describe("isDisabled", function() {
  //     it("is true if viewer.state.navigatable is false", function() {
  //         let navigation = createNavigation();
  //         expect(navigation.isDisabled()).toBe(true);

  //         let isDisabled = true;
  //         navigation.isDisabled.subscribe(function(value) {
  //             isDisabled = value;
  //         });
  //         viewer.state.navigatable(true);

  //         expect(isDisabled).toBe(false);
  //     });

  //     it("is true if settingsPanel.opened is true", function() {
  //         let navigation = createNavigation();
  //         viewer.state.navigatable(true);

  //         expect(navigation.isDisabled()).toBe(false);

  //         settingsPanel.opened(true);

  //         expect(navigation.isDisabled()).toBe(true);
  //     });
  // });

  describe("navigateToPrevious", function () {
    beforeEach(function () {
      spyOn(viewer, "navigateToPrevious");
    });

    // it("calls viewer's navigateToPrevious and returns true", function() {
    //     let navigation = createNavigation();
    //     setDisabled(false);
    //     let ret = navigation.navigateToPrevious();

    //     expect(viewer.navigateToPrevious).toHaveBeenCalled();
    //     expect(ret).toBe(true);
    // });

    it("do nothing and returns false when navigation is disabled", function () {
      let navigation = createNavigation();
      setDisabled(true);
      let ret = navigation.navigateToPrevious();

      expect(viewer.navigateToPrevious).not.toHaveBeenCalled();
      expect(ret).toBe(false);

      // disabled by navigationOptions
      navigation = createNavigation({ disablePageNavigation: true });
      setDisabled(false);
      ret = navigation.navigateToPrevious();

      expect(viewer.navigateToPrevious).not.toHaveBeenCalled();
      expect(ret).toBe(false);
    });
  });

  describe("navigateToNext", function () {
    beforeEach(function () {
      spyOn(viewer, "navigateToNext");
    });

    // it("calls viewer's navigateToNext and returns true", function() {
    //     let navigation = createNavigation();
    //     setDisabled(false);
    //     let ret = navigation.navigateToNext();

    //     expect(viewer.navigateToNext).toHaveBeenCalled();
    //     expect(ret).toBe(true);
    // });

    it("do nothing and returns false when navigation is disabled", function () {
      let navigation = createNavigation();
      setDisabled(true);
      let ret = navigation.navigateToNext();

      expect(viewer.navigateToNext).not.toHaveBeenCalled();
      expect(ret).toBe(false);

      // disabled by navigationOptions
      navigation = createNavigation({ disablePageNavigation: true });
      setDisabled(false);
      ret = navigation.navigateToNext();

      expect(viewer.navigateToNext).not.toHaveBeenCalled();
      expect(ret).toBe(false);
    });
  });

  describe("navigateToLeft", function () {
    beforeEach(function () {
      spyOn(viewer, "navigateToLeft");
    });

    // it("calls viewer's navigateToLeft and returns true", function() {
    //     let navigation = createNavigation();
    //     setDisabled(false);
    //     let ret = navigation.navigateToLeft();

    //     expect(viewer.navigateToLeft).toHaveBeenCalled();
    //     expect(ret).toBe(true);
    // });

    it("do nothing and returns false when navigation is disabled", function () {
      let navigation = createNavigation();
      setDisabled(true);
      let ret = navigation.navigateToLeft();

      expect(viewer.navigateToLeft).not.toHaveBeenCalled();
      expect(ret).toBe(false);

      // disabled by navigationOptions
      navigation = createNavigation({ disablePageNavigation: true });
      setDisabled(false);
      ret = navigation.navigateToLeft();

      expect(viewer.navigateToLeft).not.toHaveBeenCalled();
      expect(ret).toBe(false);
    });
  });

  describe("navigateToRight", function () {
    beforeEach(function () {
      spyOn(viewer, "navigateToRight");
    });

    // it("calls viewer's navigateToRight and returns true", function() {
    //     let navigation = createNavigation();
    //     setDisabled(false);
    //     let ret = navigation.navigateToRight();

    //     expect(viewer.navigateToRight).toHaveBeenCalled();
    //     expect(ret).toBe(true);
    // });

    it("do nothing and returns false when navigation is disabled", function () {
      let navigation = createNavigation();
      setDisabled(true);
      let ret = navigation.navigateToRight();

      expect(viewer.navigateToRight).not.toHaveBeenCalled();
      expect(ret).toBe(false);

      // disabled by navigationOptions
      navigation = createNavigation({ disablePageNavigation: true });
      setDisabled(false);
      ret = navigation.navigateToRight();

      expect(viewer.navigateToRight).not.toHaveBeenCalled();
      expect(ret).toBe(false);
    });
  });

  describe("navigateToFirst", function () {
    beforeEach(function () {
      spyOn(viewer, "navigateToFirst");
    });

    // it("calls viewer's navigateToFirst and returns true", function() {
    //     let navigation = createNavigation();
    //     setDisabled(false);
    //     let ret = navigation.navigateToFirst();

    //     expect(viewer.navigateToFirst).toHaveBeenCalled();
    //     expect(ret).toBe(true);
    // });

    it("do nothing and returns false when navigation is disabled", function () {
      let navigation = createNavigation();
      setDisabled(true);
      let ret = navigation.navigateToFirst();

      expect(viewer.navigateToFirst).not.toHaveBeenCalled();
      expect(ret).toBe(false);

      // disabled by navigationOptions
      navigation = createNavigation({ disablePageNavigation: true });
      setDisabled(false);
      ret = navigation.navigateToFirst();

      expect(viewer.navigateToFirst).not.toHaveBeenCalled();
      expect(ret).toBe(false);
    });
  });

  describe("navigateToLast", function () {
    beforeEach(function () {
      spyOn(viewer, "navigateToLast");
    });

    // it("calls viewer's navigateToLast and returns true", function() {
    //     let navigation = createNavigation();
    //     setDisabled(false);
    //     let ret = navigation.navigateToLast();

    //     expect(viewer.navigateToLast).toHaveBeenCalled();
    //     expect(ret).toBe(true);
    // });

    it("do nothing and returns false when navigation is disabled", function () {
      let navigation = createNavigation();
      setDisabled(true);
      let ret = navigation.navigateToLast();

      expect(viewer.navigateToLast).not.toHaveBeenCalled();
      expect(ret).toBe(false);

      // disabled by navigationOptions
      navigation = createNavigation({ disablePageNavigation: true });
      setDisabled(false);
      ret = navigation.navigateToLast();

      expect(viewer.navigateToLast).not.toHaveBeenCalled();
      expect(ret).toBe(false);
    });
  });

  describe("hidePageNavigation", function () {
    it("is false by default", function () {
      const navigation = createNavigation();

      expect(navigation.hidePageNavigation).toBe(false);
    });

    it("is set to true by navigationOptions", function () {
      const navigation = createNavigation({ disablePageNavigation: true });

      expect(navigation.hidePageNavigation).toBe(true);
    });
  });

  describe("zoomIn", function () {
    beforeEach(function () {
      spyOn(viewer, "queryZoomFactor").and.returnValue(1);
    });
    // it("increases zoom factor stored in ViewerOptions model and returns true", function () {
    //     let navigation = createNavigation();
    //     setDisabled(false);
    //     let zoom = viewerOptions.zoom().zoom;
    //     let ret = navigation.zoomIn();

    //     expect(viewer.queryZoomFactor).toHaveBeenCalledWith("fit inside viewport");
    //     expect(viewerOptions.zoom().zoom).toBe(zoom * 1.25);
    //     expect(viewerOptions.zoom().fitToScreen).toBe(false);
    //     expect(ret).toBe(true);

    //     viewer.queryZoomFactor.calls.reset();
    //     ret = navigation.zoomIn();

    //     expect(viewer.queryZoomFactor).not.toHaveBeenCalled();
    //     expect(viewerOptions.zoom().zoom).toBe(zoom * 1.25 * 1.25);
    //     expect(viewerOptions.zoom().fitToScreen).toBe(false);
    //     expect(ret).toBe(true);
    // });

    it("do nothing and returns false when navigation is disabled", function () {
      let navigation = createNavigation();
      setDisabled(true);
      let zoom = viewerOptions.zoom().zoom;
      let ret = navigation.zoomIn();

      expect(viewer.queryZoomFactor).not.toHaveBeenCalled();
      expect(viewerOptions.zoom().zoom).toBe(zoom);
      expect(viewerOptions.zoom().fitToScreen).toBe(true);
      expect(ret).toBe(false);

      // disabled by navigationOptions
      navigation = createNavigation({ disableZoom: true });
      setDisabled(false);
      zoom = viewerOptions.zoom().zoom;
      ret = navigation.zoomIn();

      expect(viewer.queryZoomFactor).not.toHaveBeenCalled();
      expect(viewerOptions.zoom().zoom).toBe(zoom);
      expect(viewerOptions.zoom().fitToScreen).toBe(true);
      expect(ret).toBe(false);
    });
  });

  describe("zoomOut", function () {
    beforeEach(function () {
      spyOn(viewer, "queryZoomFactor").and.returnValue(1);
    });
    // it("decreases zoom factor stored in ViewerOptions model and returns true", function() {
    //     let navigation = createNavigation();
    //     setDisabled(false);
    //     let zoom = viewerOptions.zoom().zoom;
    //     let ret = navigation.zoomOut();

    //     expect(viewer.queryZoomFactor).toHaveBeenCalledWith("fit inside viewport");
    //     expect(viewerOptions.zoom().zoom).toBe(zoom * 0.8);
    //     expect(viewerOptions.zoom().fitToScreen).toBe(false);
    //     expect(ret).toBe(true);

    //     viewer.queryZoomFactor.calls.reset();
    //     ret = navigation.zoomOut();

    //     expect(viewer.queryZoomFactor).not.toHaveBeenCalled();
    //     expect(viewerOptions.zoom().zoom).toBe(zoom * 0.8 * 0.8);
    //     expect(viewerOptions.zoom().fitToScreen).toBe(false);
    //     expect(ret).toBe(true);
    // });

    it("do nothing and returns false when navigation is disabled", function () {
      let navigation = createNavigation();
      setDisabled(true);
      let zoom = viewerOptions.zoom().zoom;
      let ret = navigation.zoomOut();

      expect(viewer.queryZoomFactor).not.toHaveBeenCalled();
      expect(viewerOptions.zoom().zoom).toBe(zoom);
      expect(viewerOptions.zoom().fitToScreen).toBe(true);
      expect(ret).toBe(false);

      // disabled by navigationOptions
      navigation = createNavigation({ disableZoom: true });
      setDisabled(false);
      zoom = viewerOptions.zoom().zoom;
      ret = navigation.zoomOut();

      expect(viewer.queryZoomFactor).not.toHaveBeenCalled();
      expect(viewerOptions.zoom().zoom).toBe(zoom);
      expect(viewerOptions.zoom().fitToScreen).toBe(true);
      expect(ret).toBe(false);
    });
  });

  describe("zoomToActualSize", function () {
    beforeEach(function () {
      spyOn(viewer, "queryZoomFactor").and.returnValue(2);
    });
    // it("set zoom factor stored in ViewerOptions model to 1 and returns true", function() {
    //     let navigation = createNavigation();
    //     setDisabled(false);
    //     let zoom = viewerOptions.zoom().zoom;
    //     let ret = navigation.zoomToActualSize();

    //     expect(viewer.queryZoomFactor).not.toHaveBeenCalled();
    //     expect(viewerOptions.zoom().zoom).toBe(1);
    //     expect(viewerOptions.zoom().fitToScreen).toBe(false);
    //     expect(ret).toBe(true);

    //     ret = navigation.zoomToActualSize();

    //     expect(viewer.queryZoomFactor).not.toHaveBeenCalled();
    //     expect(viewerOptions.zoom().zoom).toBe(1);
    //     expect(viewerOptions.zoom().fitToScreen).toBe(false);
    //     expect(ret).toBe(true);
    // });

    it("do nothing and returns false when navigation is disabled", function () {
      let navigation = createNavigation();
      setDisabled(true);
      let zoom = viewerOptions.zoom().zoom;
      let ret = navigation.zoomToActualSize();

      expect(viewer.queryZoomFactor).not.toHaveBeenCalled();
      expect(viewerOptions.zoom().zoom).toBe(zoom);
      expect(viewerOptions.zoom().fitToScreen).toBe(true);
      expect(ret).toBe(false);

      // disabled by navigationOptions
      navigation = createNavigation({ disableZoom: true });
      setDisabled(false);
      zoom = viewerOptions.zoom().zoom;
      ret = navigation.zoomOut();

      expect(viewer.queryZoomFactor).not.toHaveBeenCalled();
      expect(viewerOptions.zoom().zoom).toBe(zoom);
      expect(viewerOptions.zoom().fitToScreen).toBe(true);
      expect(ret).toBe(false);
    });
  });

  describe("toggleFitToScreen", function () {
    beforeEach(function () {
      spyOn(viewer, "queryZoomFactor").and.returnValue(1.2);
    });

    // it("query zoom factor for 'fit inside viewport' to the viewer and set returned zoom factor in ViewerOptions model and returns true", function() {
    //     let navigation = createNavigation();
    //     setDisabled(false);
    //     viewerOptions.zoom(ZoomOptions.createFromZoomFactor(2));
    //     let ret = navigation.toggleFitToScreen();

    //     expect(viewer.queryZoomFactor).not.toHaveBeenCalled();
    //     expect(viewerOptions.zoom().zoom).toBe(1);
    //     expect(viewerOptions.zoom().fitToScreen).toBe(true);
    //     expect(ret).toBe(true);

    //     viewer.queryZoomFactor.calls.reset();
    //     ret = navigation.toggleFitToScreen();

    //     expect(viewer.queryZoomFactor).not.toHaveBeenCalled();
    //     expect(viewerOptions.zoom().zoom).toBe(1);
    //     expect(viewerOptions.zoom().fitToScreen).toBe(false);
    //     expect(ret).toBe(true);
    // });

    it("do nothing and returns false when navigation is disabled", function () {
      let navigation = createNavigation();
      setDisabled(true);
      viewerOptions.zoom(ZoomOptions.createFromZoomFactor(2));
      let ret = navigation.toggleFitToScreen();

      expect(viewer.queryZoomFactor).not.toHaveBeenCalled();
      expect(viewerOptions.zoom().zoom).toBe(2);
      expect(viewerOptions.zoom().fitToScreen).toBe(false);
      expect(ret).toBe(false);

      // disabled by navigationOptions
      navigation = createNavigation({ disableZoom: true });
      setDisabled(false);
      ret = navigation.toggleFitToScreen();

      expect(viewer.queryZoomFactor).not.toHaveBeenCalled();
      expect(viewerOptions.zoom().zoom).toBe(2);
      expect(viewerOptions.zoom().fitToScreen).toBe(false);
      expect(ret).toBe(false);
    });
  });

  describe("hideZoom", function () {
    it("is false by default", function () {
      const navigation = createNavigation();

      expect(navigation.hideZoom).toBe(false);
    });

    it("is set to true by navigationOptions", function () {
      const navigation = createNavigation({ disableZoom: true });

      expect(navigation.hideZoom).toBe(true);
    });
  });

  describe("increaseFontSize", function () {
    // it("increases font size stored in ViewerOptions model and returns true", function () {
    //     let navigation = createNavigation();
    //     setDisabled(false);
    //     let fontSize = viewerOptions.fontSize();
    //     let ret = navigation.increaseFontSize();

    //     expect(viewerOptions.fontSize()).toBe(fontSize * 1.25);
    //     expect(ret).toBe(true);

    //     ret = navigation.increaseFontSize();

    //     expect(viewerOptions.fontSize()).toBe(fontSize * 1.25 * 1.25);
    //     expect(ret).toBe(true);
    // });

    it("do nothing and returns false when navigation is disabled", function () {
      let navigation = createNavigation();
      setDisabled(true);
      const fontSize = viewerOptions.fontSize();
      let ret = navigation.increaseFontSize();

      expect(viewerOptions.fontSize()).toBe(fontSize);
      expect(ret).toBe(false);

      // disabled by navigationOptions
      navigation = createNavigation({ disableFontSizeChange: true });
      setDisabled(false);
      ret = navigation.increaseFontSize();

      expect(viewerOptions.fontSize()).toBe(fontSize);
      expect(ret).toBe(false);
    });
  });

  describe("decreaseFontSize", function () {
    // it("decreases font size stored in ViewerOptions model and returns true", function() {
    //     let navigation = createNavigation();
    //     setDisabled(false);
    //     let fontSize = viewerOptions.fontSize();
    //     let ret = navigation.decreaseFontSize();

    //     expect(viewerOptions.fontSize()).toBe(fontSize * 0.8);
    //     expect(ret).toBe(true);

    //     ret = navigation.decreaseFontSize();

    //     expect(viewerOptions.fontSize()).toBe(fontSize * 0.8 * 0.8);
    //     expect(ret).toBe(true);
    // });

    it("do nothing and returns false when navigation is disabled", function () {
      let navigation = createNavigation();
      setDisabled(true);
      const fontSize = viewerOptions.fontSize();
      let ret = navigation.decreaseFontSize();

      expect(viewerOptions.fontSize()).toBe(fontSize);
      expect(ret).toBe(false);

      // disabled by navigationOptions
      navigation = createNavigation({ disableFontSizeChange: true });
      setDisabled(false);
      ret = navigation.decreaseFontSize();

      expect(viewerOptions.fontSize()).toBe(fontSize);
      expect(ret).toBe(false);
    });
  });

  describe("defaultFontSize", function () {
    // it("set font size stored in ViewerOptions model to default and returns true", function() {
    //     let navigation = createNavigation();
    //     setDisabled(false);
    //     let fontSize = ViewerOptions.getDefaultValues().fontSize;
    //     viewerOptions.fontSize(20);
    //     let ret = navigation.defaultFontSize();

    //     expect(viewerOptions.fontSize()).toBe(fontSize);
    //     expect(ret).toBe(true);

    //     viewerOptions.fontSize(20);
    //     ret = navigation.defaultFontSize();

    //     expect(viewerOptions.fontSize()).toBe(fontSize);
    //     expect(ret).toBe(true);
    // });

    it("do nothing and returns false when navigation is disabled", function () {
      let navigation = createNavigation();
      setDisabled(true);
      const fontSize = 20;
      viewerOptions.fontSize(20);
      let ret = navigation.defaultFontSize();

      expect(viewerOptions.fontSize()).toBe(fontSize);
      expect(ret).toBe(false);

      // disabled by navigationOptions
      navigation = createNavigation({ disableFontSizeChange: true });
      setDisabled(false);
      ret = navigation.defaultFontSize();

      expect(viewerOptions.fontSize()).toBe(fontSize);
      expect(ret).toBe(false);
    });
  });

  describe("hideFontSizeChange", function () {
    it("is false by default", function () {
      const navigation = createNavigation();

      expect(navigation.hideFontSizeChange).toBe(false);
    });

    it("is set to true by navigationOptions", function () {
      const navigation = createNavigation({ disableFontSizeChange: true });

      expect(navigation.hideFontSizeChange).toBe(true);
    });
  });
});
