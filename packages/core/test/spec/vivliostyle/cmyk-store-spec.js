/**
 * Copyright 2025 Vivliostyle Foundation
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
 */

import * as CmykStore from "../../../src/vivliostyle/cmyk-store";
import * as Css from "../../../src/vivliostyle/css";

// Helper to create device-cmyk() function
function deviceCmyk(c, m, y, k, alpha) {
  var values = [new Css.Num(c), new Css.Num(m), new Css.Num(y), new Css.Num(k)];
  if (alpha !== undefined) {
    values.push(Css.slash, new Css.Num(alpha));
  }
  return new Css.Func("device-cmyk", [new Css.SpaceList(values)]);
}

describe("cmyk-store", function () {
  describe("CmykStore", function () {
    describe("convert", function () {
      it("converts pure cyan correctly", function () {
        // device-cmyk(1 0 0 0) → color(srgb 0 1 1)
        var store = new CmykStore.CmykStore();
        var result = store.registerDeviceCmyk(deviceCmyk(1, 0, 0, 0));
        expect(result.toString()).toBe("color(srgb 0 1 1)");
      });

      it("converts pure magenta correctly", function () {
        // device-cmyk(0 1 0 0) → color(srgb 1 0 1)
        var store = new CmykStore.CmykStore();
        var result = store.registerDeviceCmyk(deviceCmyk(0, 1, 0, 0));
        expect(result.toString()).toBe("color(srgb 1 0 1)");
      });

      it("converts pure yellow correctly", function () {
        // device-cmyk(0 0 1 0) → color(srgb 1 1 0)
        var store = new CmykStore.CmykStore();
        var result = store.registerDeviceCmyk(deviceCmyk(0, 0, 1, 0));
        expect(result.toString()).toBe("color(srgb 1 1 0)");
      });

      it("converts pure black correctly", function () {
        // device-cmyk(0 0 0 1) → color(srgb 0 0 0)
        var store = new CmykStore.CmykStore();
        var result = store.registerDeviceCmyk(deviceCmyk(0, 0, 0, 1));
        expect(result.toString()).toBe("color(srgb 0 0 0)");
      });

      it("converts white correctly", function () {
        // device-cmyk(0 0 0 0) → color(srgb 1 1 1)
        var store = new CmykStore.CmykStore();
        var result = store.registerDeviceCmyk(deviceCmyk(0, 0, 0, 0));
        expect(result.toString()).toBe("color(srgb 1 1 1)");
      });

      it("converts with alpha correctly", function () {
        // device-cmyk(1 0 0 0 / 0.5) → color(srgb 0 1 1 / 0.5)
        var store = new CmykStore.CmykStore();
        var result = store.registerDeviceCmyk(deviceCmyk(1, 0, 0, 0, 0.5));
        expect(result.toString()).toBe("color(srgb 0 1 1 / 0.5)");
      });

      it("returns null for invalid function", function () {
        var store = new CmykStore.CmykStore();
        var invalidFunc = new Css.Func("rgb", [new Css.Num(255)]);
        expect(store.registerDeviceCmyk(invalidFunc)).toBe(null);
      });
    });

    describe("toJSON", function () {
      it("returns plain object with registered values", function () {
        var store = new CmykStore.CmykStore();
        store.registerDeviceCmyk(deviceCmyk(1, 0, 0, 0));
        var json = store.toJSON();
        expect(typeof json).toBe("object");
        expect(Object.keys(json).length).toBe(1);
        var key = Object.keys(json)[0];
        expect(json[key].c).toBe(10000);
        expect(json[key].m).toBe(0);
        expect(json[key].y).toBe(0);
        expect(json[key].k).toBe(0);
      });

      it("uses sRGB key format '[r,g,b]' with integers (0-10000)", function () {
        var store = new CmykStore.CmykStore();
        store.registerDeviceCmyk(deviceCmyk(1, 0, 0, 0));
        var json = store.toJSON();
        var key = Object.keys(json)[0];
        expect(key).toBe("[0,10000,10000]");
      });
    });

    describe("registerCmykReserveMap", function () {
      it("registers entries that appear in toJSON", function () {
        var store = new CmykStore.CmykStore();
        store.registerCmykReserveMap([
          [
            { r: 5000, g: 5000, b: 5000 },
            { c: 1000, m: 2000, y: 3000, k: 4000 },
          ],
        ]);
        var json = store.toJSON();
        expect(Object.keys(json).length).toBe(1);
        var key = "[5000,5000,5000]";
        expect(json[key]).toBeDefined();
        expect(json[key].c).toBe(1000);
        expect(json[key].m).toBe(2000);
        expect(json[key].y).toBe(3000);
        expect(json[key].k).toBe(4000);
      });

      it("last entry wins for duplicate RGB keys", function () {
        var store = new CmykStore.CmykStore();
        store.registerCmykReserveMap([
          [
            { r: 5000, g: 5000, b: 5000 },
            { c: 1000, m: 0, y: 0, k: 0 },
          ],
          [
            { r: 5000, g: 5000, b: 5000 },
            { c: 0, m: 2000, y: 0, k: 0 },
          ],
        ]);
        var json = store.toJSON();
        expect(Object.keys(json).length).toBe(1);
        var key = "[5000,5000,5000]";
        expect(json[key].c).toBe(0);
        expect(json[key].m).toBe(2000);
      });

      it("CSS device-cmyk avoids reserved slots", function () {
        var store = new CmykStore.CmykStore();
        // Reserve the slot that pure cyan would normally occupy: [0,10000,10000]
        store.registerCmykReserveMap([
          [
            { r: 0, g: 10000, b: 10000 },
            { c: 5000, m: 5000, y: 5000, k: 5000 },
          ],
        ]);
        // Now register pure cyan via device-cmyk(1 0 0 0) which also maps to [0,10000,10000]
        store.registerDeviceCmyk(deviceCmyk(1, 0, 0, 0));

        var json = store.toJSON();
        // Should have 2 entries: reserved + offset
        expect(Object.keys(json).length).toBe(2);
        // Reserved entry should be preserved
        var reservedKey = "[0,10000,10000]";
        expect(json[reservedKey].c).toBe(5000);
        expect(json[reservedKey].m).toBe(5000);
      });

      it("handles empty array safely", function () {
        var store = new CmykStore.CmykStore();
        store.registerCmykReserveMap([]);
        expect(Object.keys(store.toJSON()).length).toBe(0);
      });
    });

    describe("collision handling", function () {
      it("handles multiple similar CMYK values", function () {
        var store = new CmykStore.CmykStore();

        for (var i = 0; i < 10; i++) {
          store.registerDeviceCmyk(
            deviceCmyk(0.25 + i * 0.0001, 0.25, 0.25, 0.25),
          );
        }

        // All values should be registered with unique keys
        expect(Object.keys(store.toJSON()).length).toBe(10);
      });

      it("preserves original CMYK values in map", function () {
        var store = new CmykStore.CmykStore();
        store.registerDeviceCmyk(deviceCmyk(1, 0, 0, 0));
        store.registerDeviceCmyk(deviceCmyk(0, 1, 0, 0));

        var json = store.toJSON();
        var values = Object.values(json);

        // Both original CMYK values should be preserved
        expect(
          values.some(function (v) {
            return v.c === 10000 && v.m === 0;
          }),
        ).toBe(true);
        expect(
          values.some(function (v) {
            return v.c === 0 && v.m === 10000;
          }),
        ).toBe(true);
      });
    });
  });
});
