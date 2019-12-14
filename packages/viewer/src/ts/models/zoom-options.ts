/*
 * Copyright 2016 Trim-marks Inc.
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

import { Viewer as VivliostyleViewer } from "vivliostyle";
import vivliostyle from "./vivliostyle";

class ZoomOptions {
  zoom: number;

  constructor(zoom) {
    this.zoom = zoom;
  }
  get fitToScreen(): null | boolean {
    return null;
  }
  getCurrentZoomFactor(_viewer?: VivliostyleViewer) {
    return 1;
  }
  toggleFitToScreen() {
    return new ZoomOptions(1);
  }
  zoomIn(viewer: VivliostyleViewer) {
    // FIXME: We want to stop disabling this rule to future
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new FixedZoomFactor(this.getCurrentZoomFactor(viewer) * 1.25);
  }
  zoomOut(viewer: VivliostyleViewer) {
    // FIXME: We want to stop disabling this rule to future
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new FixedZoomFactor(this.getCurrentZoomFactor(viewer) * 0.8);
  }
  zoomToActualSize() {
    // FIXME: We want to stop disabling this rule to future
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new FixedZoomFactor(1);
  }
  static createDefaultOptions() {
    // FIXME: We want to stop disabling this rule to future
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new FitToScreen();
  }
  static createFromZoomFactor(zoom) {
    // FIXME: We want to stop disabling this rule to future
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new FixedZoomFactor(zoom);
  }
}

export class FitToScreen extends ZoomOptions {
  constructor() {
    super(1);
  }
  get fitToScreen() {
    return true;
  }
  toggleFitToScreen() {
    // FIXME: We want to stop disabling this rule to future
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new FixedZoomFactor(1);
  }
  getCurrentZoomFactor(viewer: VivliostyleViewer) {
    return viewer.queryZoomFactor(
      vivliostyle.viewer.ZoomType.FIT_INSIDE_VIEWPORT
    );
  }
}
class FixedZoomFactor extends ZoomOptions {
  get fitToScreen() {
    return false;
  }
  toggleFitToScreen() {
    return new FitToScreen();
  }
  getCurrentZoomFactor() {
    return this.zoom;
  }
}

export default ZoomOptions;
