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

import { constants } from "./vivliostyle/constants";
import { plugin } from "./vivliostyle/plugin";
import { profile } from "./vivliostyle/profile";
import { viewer } from "./vivliostyle/viewer";
import { viewerapp } from "./vivliostyle/viewerapp";
export { constants, plugin, profile, viewer, viewerapp };
export default { constants, plugin, profile, viewer, viewerapp };

import { registerPlugins } from "./plugins";
registerPlugins();
