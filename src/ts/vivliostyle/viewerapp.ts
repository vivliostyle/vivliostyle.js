/**
 * Copyright 2013 Google, Inc.
 * Copyright 2015 Trim-marks Inc.
 * Copyright 2019 Vivliostyle Foundation
 *
 * Vivliostyle.js is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle.js is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle.js.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @fileoverview ViewerApp - (Deprecated) Vivliostyle page viewer base on adapt.sampleapp
 */
import * as AdaptViewer from "../adapt/adaptviewer";
import * as Base from "../adapt/base";
import * as Constants from "./constants";

export let fontSize: number = 16;

export let touchActive: boolean = false;

export let touchX: number = 0;

export let touchY: number = 0;

export let zoomActive: boolean = false;

export let pinchDist: number = 0;

export let currentPageProgression: Constants.PageProgression =
  Constants.PageProgression.LTR;

export function sendCommand(cmd: Base.JSON): void {
  window["adapt_command"](cmd);
}

export function navigateToLeftPage(): void {
  sendCommand({
    a: "moveTo",
    where:
      currentPageProgression === Constants.PageProgression.LTR
        ? "previous"
        : "next"
  });
}

export function navigateToRightPage(): void {
  sendCommand({
    a: "moveTo",
    where:
      currentPageProgression === Constants.PageProgression.LTR
        ? "next"
        : "previous"
  });
}

export function keydown(evt: KeyboardEvent): void {
  const key = evt.key;
  const keyIdentifier = (evt as any).keyIdentifier;
  const location = evt.location;
  if (key === "End" || keyIdentifier === "End") {
    sendCommand({ a: "moveTo", where: "last" });
    evt.preventDefault();
  } else if (key === "Home" || keyIdentifier === "Home") {
    sendCommand({ a: "moveTo", where: "first" });
    evt.preventDefault();
  } else if (key === "ArrowUp" || key === "Up" || keyIdentifier === "Up") {
    sendCommand({ a: "moveTo", where: "previous" });
    evt.preventDefault();
  } else if (
    key === "ArrowDown" ||
    key === "Down" ||
    keyIdentifier === "Down"
  ) {
    sendCommand({ a: "moveTo", where: "next" });
    evt.preventDefault();
  } else if (
    key === "ArrowRight" ||
    key === "Right" ||
    keyIdentifier === "Right"
  ) {
    navigateToRightPage();
    evt.preventDefault();
  } else if (
    key === "ArrowLeft" ||
    key === "Left" ||
    keyIdentifier === "Left"
  ) {
    navigateToLeftPage();
    evt.preventDefault();
  } else if (key === "0" || keyIdentifier === "U+0030") {
    sendCommand({ a: "configure", fontSize: Math.round(fontSize) });
    evt.preventDefault();
    /*
  } else if (key === "n" || keyIdentifier === "U+004E") {
  // N - night toggle
  self.pref.nightMode = !self.pref.nightMode;
  self.viewport = null;
  self.resize().thenFinish(frame);
  } else if (key === "v" || keyIdentifier === "U+0056") {
  self.pref.horizontal = !self.pref.horizontal;
  self.viewport = null;
  self.resize().thenFinish(frame);
  */
  } else if (key === "t" || keyIdentifier === "U+0054") {
    sendCommand({ a: "toc", v: "toggle", autohide: true });
    evt.preventDefault();
  } else if (
    key === "+" ||
    key === "Add" ||
    keyIdentifier === "U+002B" ||
    keyIdentifier === "U+00BB" ||
    (keyIdentifier === "U+004B" &&
      location === KeyboardEvent.DOM_KEY_LOCATION_NUMPAD)
  ) {
    /* workaround for Chrome for Windows */
    fontSize *= 1.2;
    sendCommand({ a: "configure", fontSize: Math.round(fontSize) });
    evt.preventDefault();
  } else if (
    key === "-" ||
    key === "Subtract" ||
    keyIdentifier === "U+002D" ||
    keyIdentifier === "U+00BD" ||
    (keyIdentifier === "U+004D" &&
      location === KeyboardEvent.DOM_KEY_LOCATION_NUMPAD)
  ) {
    /* workaround for Chrome for Windows */
    fontSize /= 1.2;
    sendCommand({ a: "configure", fontSize: Math.round(fontSize) });
    evt.preventDefault();
  }
}

let zoomDist: number;

export function touch(evt: TouchEvent): void {
  if (evt.type == "touchmove") {
    evt.preventDefault();
  }
  if (evt.touches.length == 1) {
    const x = evt.touches[0].pageX;
    const y = evt.touches[0].pageY;
    if (evt.type == "touchstart") {
      touchActive = true;
      touchX = x;
      touchY = y;
    } else if (touchActive) {
      const dx = x - touchX;
      const dy = y - touchY;
      if (evt.type == "touchend") {
        touchActive = false;
      }
      if (Math.abs(dy) < 0.5 * Math.abs(dx) && Math.abs(dx) > 15) {
        touchActive = false;
        if (dx > 0) {
          sendCommand({
            a: "moveTo",
            where:
              currentPageProgression === Constants.PageProgression.LTR
                ? "previous"
                : "next"
          });
        } else {
          sendCommand({
            a: "moveTo",
            where:
              currentPageProgression === Constants.PageProgression.LTR
                ? "next"
                : "previous"
          });
        }
      }
    }
  } else if (evt.touches.length == 2) {
    const px = evt.touches[0].pageX - evt.touches[1].pageX;
    const py = evt.touches[0].pageY - evt.touches[1].pageY;
    const pinchDist = Math.sqrt(px * px + py * py);
    if (evt.type == "touchstart") {
      zoomActive = true;
      zoomDist = pinchDist;
    } else if (zoomActive) {
      if (evt.type == "touchend") {
        zoomActive = false;
      }
      const scale = pinchDist / zoomDist;
      if (scale > 1.5) {
        fontSize *= 1.2;
        sendCommand({ a: "configure", fontSize: Math.round(fontSize) });
      } else if (scale < 1 / 1.5) {
        fontSize *= 1.2;
        sendCommand({ a: "configure", fontSize: Math.round(fontSize) });
      }
    }
  }
}

export function callback(msg: Base.JSON): void {
  switch (msg["t"]) {
    case "loaded": {
      const viewer = msg["viewer"];
      const pageProgression = (currentPageProgression = viewer.getCurrentPageProgression());
      viewer.viewportElement.setAttribute(
        "data-vivliostyle-page-progression",
        pageProgression
      );
      viewer.viewportElement.setAttribute(
        "data-vivliostyle-spread-view",
        viewer.pref.spreadView
      );
      window.addEventListener("keydown", keydown, false);

      //        window.addEventListener("touchstart", /** @type {Function} */
      //        (.touch), false);
      //        window.addEventListener("touchmove", /** @type {Function} */
      //        (.touch), false);
      //        window.addEventListener("touchend", /** @type {Function} */
      //        (.touch), false);
      document.body.setAttribute("data-vivliostyle-viewer-status", "complete");
      const leftButton = document.getElementById(
        "vivliostyle-page-navigation-left"
      );
      leftButton.addEventListener("click", navigateToLeftPage, false);
      const rightButton = document.getElementById(
        "vivliostyle-page-navigation-right"
      );
      rightButton.addEventListener("click", navigateToRightPage, false);
      [leftButton, rightButton].forEach(button => {
        button.setAttribute("data-vivliostyle-ui-state", "attention");
        window.setTimeout(() => {
          button.removeAttribute("data-vivliostyle-ui-state");
        }, 1000);
      });
      break;
    }
    case "error":
      // Base.log("Error: " + msg["content"]);
      break;
    case "nav": {
      const cfi = msg["cfi"];
      if (cfi) {
        location.replace(
          Base.setURLParam(location.href, "f", Base.lightURLEncode(cfi || ""))
        );
      }
      break;
    }
    case "hyperlink":
      if (msg["internal"]) {
        sendCommand({ a: "moveTo", url: msg["href"] });
      }
  }
}

function setViewportSize(
  width: string | null,
  height: string | null,
  size: string | null,
  orientation: string | null,
  config: { [key: string]: any }
): void {
  let pageSpec;
  if (!width || !height) {
    switch (size) {
      case "A5":
        width = "148mm";
        height = "210mm";
        break;
      case "A4":
        width = "210mm";
        height = "297mm";
        break;
      case "A3":
        width = "297mm";
        height = "420mm";
        break;
      case "B5":
        width = "176mm";
        height = "250mm";
        break;
      case "B4":
        width = "250mm";
        height = "353mm";
        break;
      case "letter":
        width = "8.5in";
        height = "11in";
        break;
      case "legal":
        width = "8.5in";
        height = "14in";
        break;
      case "ledger":
        width = "11in";
        height = "17in";
        break;
    }
    if (width && height) {
      pageSpec = size;
      if (orientation === "landscape") {
        pageSpec = pageSpec ? `${pageSpec} landscape` : null;

        // swap
        const tmp = width;
        width = height;
        height = tmp;
      }
    }
  } else {
    pageSpec = `${width} ${height}`;
  }
  if (width && height) {
    config.viewport = { width: width, height: height };
    const s = document.createElement("style");
    s.textContent = `@page { size: ${pageSpec}; margin: 0; }`;
    document.head.appendChild(s);
  }
}

export function main(arg): void {
  const fragment = (arg && arg["fragment"]) || Base.getURLParam("f");
  const epubURL = (arg && arg["epubURL"]) || Base.getURLParam("b");
  const xmlURL = (arg && arg["xmlURL"]) || Base.getURLParam("x");
  const width = (arg && arg["defaultPageWidth"]) || Base.getURLParam("w");
  const height = (arg && arg["defaultPageHeight"]) || Base.getURLParam("h");
  const size = (arg && arg["defaultPageSize"]) || Base.getURLParam("size");
  const orientation =
    (arg && arg["orientation"]) || Base.getURLParam("orientation");
  let spreadView = Base.getURLParam("spread");
  spreadView =
    (arg && arg["spreadView"]) || (!!spreadView && spreadView != "false");
  const uaRoot = (arg && arg["uaRoot"]) || null;
  const doc = (arg && arg["document"]) || null;
  const userStyleSheet = (arg && arg["userStyleSheet"]) || null;
  const viewportElement = (arg && arg["viewportElement"]) || document.body;
  const config = {
    a: epubURL ? "loadEPUB" : "loadXML",
    url: epubURL || xmlURL,
    autoresize: true,
    fragment: fragment,
    // render all pages on load and resize
    renderAllPages: true,
    userAgentRootURL: uaRoot,
    document: doc,
    userStyleSheet: userStyleSheet,
    spreadView: spreadView,
    pageBorder: 1
  };
  setViewportSize(width, height, size, orientation, config);
  const viewerInstance = new AdaptViewer.Viewer(
    window,
    viewportElement,
    "main",
    callback
  );
  viewerInstance.initEmbed(config);
}

export const viewerapp = {
  main
};
