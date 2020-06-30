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

import { CoreViewer, ZoomType } from "@vivliostyle/core";

class ZoomOptions {
  zoom: number;

  constructor(zoom: number) {
    this.zoom = zoom;
  }
  get fitToScreen(): null | boolean {
    return null;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getCurrentZoomFactor(_viewer?: CoreViewer): number {
    return 1;
  }
  toggleFitToScreen(): ZoomOptions {
    return new ZoomOptions(1);
  }
  zoomIn(viewer: CoreViewer): FixedZoomFactor {
    // FIXME: We want to stop disabling this rule to future
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new FixedZoomFactor(this.getCurrentZoomFactor(viewer) * 1.25);
  }
  zoomOut(viewer: CoreViewer): FixedZoomFactor {
    // FIXME: We want to stop disabling this rule to future
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new FixedZoomFactor(this.getCurrentZoomFactor(viewer) * 0.8);
  }
  zoomToActualSize(): FixedZoomFactor {
    // FIXME: We want to stop disabling this rule to future
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new FixedZoomFactor(1);
  }
  static createDefaultOptions(): FitToScreen {
    // FIXME: We want to stop disabling this rule to future
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new FitToScreen();
  }
  static createFromZoomFactor(zoom: number): FixedZoomFactor {
    // FIXME: We want to stop disabling this rule to future
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new FixedZoomFactor(zoom);
  }
}

export class FitToScreen extends ZoomOptions {
  constructor() {
    super(1);
  }
  get fitToScreen(): boolean {
    return true;
  }
  toggleFitToScreen(): FixedZoomFactor {
    // FIXME: We want to stop disabling this rule to future
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new FixedZoomFactor(1);
  }
  getCurrentZoomFactor(viewer: CoreViewer): number {
    return viewer.queryZoomFactor(ZoomType.FIT_INSIDE_VIEWPORT);
  }
}
class FixedZoomFactor extends ZoomOptions {
  get fitToScreen(): boolean {
    return false;
  }
  toggleFitToScreen(): FitToScreen {
    return new FitToScreen();
  }
  getCurrentZoomFactor(): number {
    return this.zoom;
  }
}

export default ZoomOptions;
