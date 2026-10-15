/**
 * Copyright 2026 Vivliostyle Foundation
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
 * @fileoverview Font-relative length metrics measured by the browser.
 */

/** Font properties that affect the browser's font-relative length metrics. */
export const fontMetricProperties = [
  "font-family",
  "font-style",
  "font-weight",
  "font-stretch",
  "font-kerning",
  "font-feature-settings",
  "font-variation-settings",
  "font-optical-sizing",
  "font-size-adjust",
  "font-synthesis",
  "font-language-override",
  "font-variant",
  "font-variant-ligatures",
  "font-variant-caps",
  "font-variant-numeric",
  "font-variant-east-asian",
  "font-variant-position",
  "font-variant-alternates",
  "font-variant-emoji",
  "writing-mode",
  "text-orientation",
  "text-transform",
];

export type FontProperties = { [property: string]: string };

/** Measures CSS units in the source font, independently of the viewer's root. */
export class FontMetrics {
  private readonly cache = new Map<string, { [unit: string]: number }>();

  constructor(
    private readonly document: Document,
    private readonly mapFontFamily: (family: string) => string = (family) =>
      family,
  ) {}

  measure(
    unit: string,
    fontSize: number,
    properties: FontProperties = {},
  ): number | null {
    if (
      !["ex", "cap", "ch", "ic"].includes(unit) ||
      !Number.isFinite(fontSize) ||
      fontSize < 0
    ) {
      return null;
    }
    const entries = fontMetricProperties.map((name) => [
      name,
      name === "font-family" && properties[name]
        ? this.mapFontFamily(properties[name])
        : properties[name] || "",
    ]);
    const key = JSON.stringify([fontSize, entries, properties.lang]);
    let sizes = this.cache.get(key);
    if (!sizes) {
      const probe = this.document.createElement("span");
      probe.style.cssText =
        "all:initial;position:absolute;visibility:hidden;display:block;left:-10000px;top:0;";
      for (const [name, value] of entries) {
        if (value) probe.style.setProperty(name, value);
      }
      probe.lang = properties.lang || "";
      probe.style.fontSize = `${fontSize}px`;
      probe.textContent = "水0Hx";
      this.document.body.appendChild(probe);
      sizes = {};
      try {
        for (const name of ["ex", "cap", "ch", "ic"]) {
          if (
            this.document.defaultView.CSS.supports("margin-left", `1${name}`)
          ) {
            probe.style.marginLeft = `1${name}`;
            // Computed margins avoid both LayoutUnit rounding of a box's width
            // and transforms/zoom that would affect its bounding rectangle.
            sizes[name] = parseFloat(
              this.document.defaultView.getComputedStyle(probe).marginLeft,
            );
          }
        }
      } finally {
        probe.remove();
      }
      this.cache.set(key, sizes);
    }
    return Number.isFinite(sizes[unit]) ? sizes[unit] : null;
  }
}
