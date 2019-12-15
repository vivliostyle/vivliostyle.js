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

import ko, { PureComputed, Observable } from "knockout";

export type ReadonlyObservable<T> = {
  getter: PureComputed<T>;
  value: Observable<T>;
};

const util = {
  readonlyObservable<T>(value: T): ReadonlyObservable<T> {
    const obs = ko.observable(value);
    return {
      getter: ko.pureComputed(() => obs()),
      value: obs,
    };
  },
};

export default util;
