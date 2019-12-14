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

export * from "./vivliostyle/constants";
export * from "./vivliostyle/plugin";
export * from "./vivliostyle/profile";
export * from "./vivliostyle/core-viewer";
export * from "./vivliostyle/print";

// NOTE: leave 'export default' clause for backward compatibility
// only useful for nonESM browser environment
// import { constants } from "./vivliostyle/constants";
// import { plugin } from "./vivliostyle/plugin";
// import { profile } from "./vivliostyle/profile";
// import { coreviewer } from "./vivliostyle/core-viewer";
// export default { constants, plugin, profile, coreviewer };
