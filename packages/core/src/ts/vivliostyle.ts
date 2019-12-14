/*
 * Copyright 2018 Vivliostyle Foundation
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
 */

export { PageProgression, PageSide, ReadyState } from "./vivliostyle/constants";
export { registerHook, removeHook } from "./vivliostyle/plugin";
export { Profiler } from "./vivliostyle/profile";
export { Viewer, PageViewMode, ZoomType } from "./vivliostyle/viewer";
export { printHTML } from "./vivliostyle/print";

// leave 'export default' clause for backward compatibility
import { constants } from "./vivliostyle/constants";
import { plugin } from "./vivliostyle/plugin";
import { profile } from "./vivliostyle/profile";
import { viewer } from "./vivliostyle/viewer";
import { printHTML } from "./vivliostyle/print";
export default { constants, plugin, profile, viewer, printHTML };
