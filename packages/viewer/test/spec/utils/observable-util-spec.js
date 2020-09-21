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

import obs from "../../../src/utils/observable-util";

describe("Observable Utils", function () {
  describe("readonlyObservable", function () {
    it("returns a getter and a writable observable", function () {
      const o = obs.readonlyObservable(1);

      expect(o.getter()).toBe(1);
      expect(o.value()).toBe(1);

      o.value(2);

      expect(o.getter()).toBe(2);
      expect(o.value()).toBe(2);
    });

    it("the getter notifies when the value is updated", function () {
      const o = obs.readonlyObservable(1);
      let x = 1;
      o.getter.subscribe(function (y) {
        x = y;
      });
      o.value(2);

      expect(x).toBe(2);
    });

    it("throws when trying to write on the getter", function () {
      const o = obs.readonlyObservable(1);
      function set() {
        o.getter(2);
      }

      expect(set).toThrow();
    });
  });
});
