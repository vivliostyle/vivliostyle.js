/**
 * Copyright 2015 Daishinsha Inc.
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
 * @fileoverview CssPage - `@page` rule (CSS Paged Media) support https://drafts.csswg.org/css-page/
 */
import * as Asserts from "./asserts";
import * as Base from "./base";
import * as Constants from "./constants";
import * as Css from "./css";
import * as CssCascade from "./css-cascade";
import * as CssParser from "./css-parser";
import * as CssValidator from "./css-validator";
import * as Exprs from "./exprs";
import * as Font from "./font";
import * as PageMaster from "./page-master";
import * as Sizing from "./sizing";
import * as Vtree from "./vtree";

/**
 * Resolve page progression direction from writing-mode and direction.
 */
export function resolvePageProgression(
  style: CssCascade.ElementStyle,
): Constants.PageProgression {
  const writingMode = (style["writing-mode"] as CssCascade.CascadeValue)?.value;
  const direction = (style["direction"] as CssCascade.CascadeValue)?.value;
  if (
    writingMode === Css.ident.vertical_lr ||
    (writingMode !== Css.ident.vertical_rl && direction !== Css.ident.rtl)
  ) {
    return Constants.PageProgression.LTR;
  } else {
    return Constants.PageProgression.RTL;
  }
}
export type PageSize = {
  width: Css.Numeric;
  height: Css.Numeric;
};

/**
 * Named page sizes.
 */
export const pageSizes: { [key: string]: PageSize } = {
  a10: { width: new Css.Numeric(26, "mm"), height: new Css.Numeric(37, "mm") },
  a9: { width: new Css.Numeric(37, "mm"), height: new Css.Numeric(52, "mm") },
  a8: { width: new Css.Numeric(52, "mm"), height: new Css.Numeric(74, "mm") },
  a7: { width: new Css.Numeric(74, "mm"), height: new Css.Numeric(105, "mm") },
  a6: { width: new Css.Numeric(105, "mm"), height: new Css.Numeric(148, "mm") },
  a5: { width: new Css.Numeric(148, "mm"), height: new Css.Numeric(210, "mm") },
  a4: { width: new Css.Numeric(210, "mm"), height: new Css.Numeric(297, "mm") },
  a3: { width: new Css.Numeric(297, "mm"), height: new Css.Numeric(420, "mm") },
  a2: { width: new Css.Numeric(420, "mm"), height: new Css.Numeric(594, "mm") },
  a1: { width: new Css.Numeric(594, "mm"), height: new Css.Numeric(841, "mm") },
  a0: {
    width: new Css.Numeric(841, "mm"),
    height: new Css.Numeric(1189, "mm"),
  },
  b10: { width: new Css.Numeric(31, "mm"), height: new Css.Numeric(44, "mm") },
  b9: { width: new Css.Numeric(44, "mm"), height: new Css.Numeric(62, "mm") },
  b8: { width: new Css.Numeric(62, "mm"), height: new Css.Numeric(88, "mm") },
  b7: { width: new Css.Numeric(88, "mm"), height: new Css.Numeric(125, "mm") },
  b6: { width: new Css.Numeric(125, "mm"), height: new Css.Numeric(176, "mm") },
  b5: { width: new Css.Numeric(176, "mm"), height: new Css.Numeric(250, "mm") },
  b4: { width: new Css.Numeric(250, "mm"), height: new Css.Numeric(353, "mm") },
  b3: { width: new Css.Numeric(353, "mm"), height: new Css.Numeric(500, "mm") },
  b2: { width: new Css.Numeric(500, "mm"), height: new Css.Numeric(707, "mm") },
  b1: {
    width: new Css.Numeric(707, "mm"),
    height: new Css.Numeric(1000, "mm"),
  },
  b0: {
    width: new Css.Numeric(1000, "mm"),
    height: new Css.Numeric(1414, "mm"),
  },
  c10: { width: new Css.Numeric(28, "mm"), height: new Css.Numeric(40, "mm") },
  c9: { width: new Css.Numeric(40, "mm"), height: new Css.Numeric(57, "mm") },
  c8: { width: new Css.Numeric(57, "mm"), height: new Css.Numeric(81, "mm") },
  c7: { width: new Css.Numeric(81, "mm"), height: new Css.Numeric(114, "mm") },
  c6: { width: new Css.Numeric(114, "mm"), height: new Css.Numeric(162, "mm") },
  c5: { width: new Css.Numeric(162, "mm"), height: new Css.Numeric(229, "mm") },
  c4: { width: new Css.Numeric(229, "mm"), height: new Css.Numeric(324, "mm") },
  c3: { width: new Css.Numeric(324, "mm"), height: new Css.Numeric(458, "mm") },
  c2: { width: new Css.Numeric(458, "mm"), height: new Css.Numeric(648, "mm") },
  c1: { width: new Css.Numeric(648, "mm"), height: new Css.Numeric(917, "mm") },
  c0: {
    width: new Css.Numeric(917, "mm"),
    height: new Css.Numeric(1297, "mm"),
  },
  "jis-b10": {
    width: new Css.Numeric(32, "mm"),
    height: new Css.Numeric(45, "mm"),
  },
  "jis-b9": {
    width: new Css.Numeric(45, "mm"),
    height: new Css.Numeric(64, "mm"),
  },
  "jis-b8": {
    width: new Css.Numeric(64, "mm"),
    height: new Css.Numeric(91, "mm"),
  },
  "jis-b7": {
    width: new Css.Numeric(91, "mm"),
    height: new Css.Numeric(128, "mm"),
  },
  "jis-b6": {
    width: new Css.Numeric(128, "mm"),
    height: new Css.Numeric(182, "mm"),
  },
  "jis-b5": {
    width: new Css.Numeric(182, "mm"),
    height: new Css.Numeric(257, "mm"),
  },
  "jis-b4": {
    width: new Css.Numeric(257, "mm"),
    height: new Css.Numeric(364, "mm"),
  },
  "jis-b3": {
    width: new Css.Numeric(364, "mm"),
    height: new Css.Numeric(515, "mm"),
  },
  "jis-b2": {
    width: new Css.Numeric(515, "mm"),
    height: new Css.Numeric(728, "mm"),
  },
  "jis-b1": {
    width: new Css.Numeric(728, "mm"),
    height: new Css.Numeric(1030, "mm"),
  },
  "jis-b0": {
    width: new Css.Numeric(1030, "mm"),
    height: new Css.Numeric(1456, "mm"),
  },
  letter: {
    width: new Css.Numeric(8.5, "in"),
    height: new Css.Numeric(11, "in"),
  },
  legal: {
    width: new Css.Numeric(8.5, "in"),
    height: new Css.Numeric(14, "in"),
  },
  ledger: {
    width: new Css.Numeric(11, "in"),
    height: new Css.Numeric(17, "in"),
  },
};

/**
 * Default value for line width of printer marks
 */
export const defaultPrinterMarkLineWidth: Css.Numeric = new Css.Numeric(
  0.24,
  "pt",
);

/**
 * Default value for distance between an edge of the page and printer marks
 */
export const defaultPrinterMarkOffset: Css.Numeric = new Css.Numeric(3, "mm");

/**
 * Default value for line length of the (shorter) line of a crop mark and the
 * shorter line of a cross mark
 */
export const defaultPrinterMarkLineLength: Css.Numeric = new Css.Numeric(
  10,
  "mm",
);

/**
 * Default value for bleed offset (= defaultPrinterMarkOffset +
 * defaultPrinterMarkLineLength)
 */
export const defaultBleedOffset: Css.Numeric = new Css.Numeric(3 + 10, "mm");

export type PageSizeAndBleed = {
  width: Css.Numeric;
  height: Css.Numeric;
  bleed: Css.Numeric;
  bleedOffset: Css.Numeric;
  cropOffset: Css.Numeric;
};

export function resolvePageSizeAndBleed(style: {
  [key: string]: CssCascade.CascadeValue;
}): PageSizeAndBleed {
  // default value (fit to viewport, no bleed)
  const pageSizeAndBleed: PageSizeAndBleed = {
    width: Css.fullWidth,
    height: Css.fullHeight,
    bleed: Css.numericZero,
    bleedOffset: Css.numericZero,
    cropOffset: Css.numericZero,
  };
  const size: CssCascade.CascadeValue = style["size"];

  if (!size || size.value === Css.ident.auto) {
    // if size is auto, fit to the viewport (use default value)
  } else {
    /** !type {!Css.Val} */
    const value = size.value;
    let val1: Css.Val;
    let val2: Css.Val;
    if (value.isSpaceList()) {
      val1 = (value as Css.SpaceList).values[0];
      val2 = (value as Css.SpaceList).values[1];
    } else {
      val1 = value;
      val2 = null;
    }
    if (val1.isNumeric()) {
      // <length>{1,2}
      pageSizeAndBleed.width = val1 as Css.Numeric;
      pageSizeAndBleed.height = (val2 || val1) as Css.Numeric;
    } else {
      // <page-size> || [ portrait | landscape ]
      const s =
        (val1 as any).name && pageSizes[(val1 as Css.Ident).name.toLowerCase()];
      if (!s) {
        // portrait or landscape is specified alone. fallback to fit to the
        // viewport (use default value)
      } else if (val2 && val2 === Css.ident.landscape) {
        // swap
        pageSizeAndBleed.width = s.height;
        pageSizeAndBleed.height = s.width;
      } else {
        // return {
        pageSizeAndBleed.width = s.width;
        pageSizeAndBleed.height = s.height;
      }
    }
  }
  const marksCV = style["marks"];
  const bleedCV = style["bleed"];
  const marks =
    marksCV && !Css.isDefaultingValue(marksCV.value)
      ? marksCV.value
      : Css.ident.none;
  const bleed =
    bleedCV && !Css.isDefaultingValue(bleedCV.value)
      ? bleedCV.value
      : Css.ident.auto;
  if (bleed === Css.ident.auto) {
    // "('auto' value) Computes to 6pt if marks has crop and to zero
    // otherwise." https://drafts.csswg.org/css-page/#valdef-page-bleed-auto
    if (marks !== Css.ident.none) {
      let hasCrop = false;
      if (marks.isSpaceList()) {
        hasCrop = (marks as Css.SpaceList).values.some(
          (v) => v === Css.ident.crop,
        );
      } else {
        hasCrop = marks === Css.ident.crop;
      }
      if (hasCrop) {
        pageSizeAndBleed.bleed = new Css.Numeric(6, "pt");
      }
    }
  } else if (bleed.isNumeric()) {
    pageSizeAndBleed.bleed = bleed as Css.Numeric;
  }

  // crop-offset (Issue #913)
  const cropOffsetCV = style["crop-offset"];
  const cropOffset =
    cropOffsetCV && !Css.isDefaultingValue(cropOffsetCV.value)
      ? cropOffsetCV.value
      : Css.ident.auto;
  if (cropOffset === Css.ident.auto) {
    if (marks !== Css.ident.none) {
      pageSizeAndBleed.bleedOffset = defaultBleedOffset;
    }
  } else if (cropOffset.isNumeric()) {
    pageSizeAndBleed.cropOffset = cropOffset as Css.Numeric;
  }
  return pageSizeAndBleed;
}

export type EvaluatedPageSizeAndBleed = {
  pageWidth: number;
  pageHeight: number;
  bleed: number;
  bleedOffset: number;
  cropOffset: number;
};

/**
 * Evaluate actual page width, height and bleed from style specified in page
 * context.
 */
export function evaluatePageSizeAndBleed(
  pageSizeAndBleed: PageSizeAndBleed,
  context: Exprs.Context,
): EvaluatedPageSizeAndBleed {
  const evaluated = {} as EvaluatedPageSizeAndBleed;
  const bleed =
    Math.max(0, pageSizeAndBleed.bleed.num) *
    context.queryUnitSize(pageSizeAndBleed.bleed.unit, false);
  const bleedOffset =
    !pageSizeAndBleed.cropOffset.num && pageSizeAndBleed.bleedOffset.num
      ? pageSizeAndBleed.bleedOffset.num *
        context.queryUnitSize(pageSizeAndBleed.bleedOffset.unit, false)
      : Math.max(
          0,
          pageSizeAndBleed.cropOffset.num *
            context.queryUnitSize(pageSizeAndBleed.cropOffset.unit, false) -
            bleed,
        );
  const cropOffset = bleed + bleedOffset;
  const width = pageSizeAndBleed.width;
  if (width === Css.fullWidth) {
    if (context.pref.defaultPaperSize) {
      evaluated.pageWidth =
        context.pref.defaultPaperSize.width *
        context.queryUnitSize("px", false);
    } else {
      evaluated.pageWidth =
        (context.pref.spreadView
          ? Math.floor(context.viewportWidth / 2) - context.pref.pageBorder
          : context.viewportWidth) -
        cropOffset * 2;
    }
  } else {
    evaluated.pageWidth = width.num * context.queryUnitSize(width.unit, false);
  }
  const height = pageSizeAndBleed.height;
  if (height === Css.fullHeight) {
    if (context.pref.defaultPaperSize) {
      evaluated.pageHeight =
        context.pref.defaultPaperSize.height *
        context.queryUnitSize("px", false);
    } else {
      evaluated.pageHeight = context.viewportHeight - cropOffset * 2;
    }
  } else {
    evaluated.pageHeight =
      height.num * context.queryUnitSize(height.unit, false);
  }
  evaluated.bleed = bleed;
  evaluated.bleedOffset = bleedOffset;
  evaluated.cropOffset = cropOffset;
  return evaluated;
}

/**
 * Create an 'svg' element for a printer mark.
 */
export function createPrinterMarkSvg(
  doc: Document,
  width: number,
  height: number,
): Element {
  const mark = doc.createElementNS(Base.NS.SVG, "svg");
  mark.setAttribute("width", width);
  mark.setAttribute("height", height);
  mark.style.position = "absolute";
  return mark;
}

/**
 * Create an SVG element for a printer mark line.
 * @param elementType Specifies which type of element to create. Default value
 *     is "polyline".
 */
export function createPrinterMarkElement(
  doc: Document,
  lineWidth: number,
  lineColor: Css.Val,
  elementType?: string,
): Element {
  elementType = elementType || "polyline";
  const line = doc.createElementNS(Base.NS.SVG, elementType);
  line.setAttribute(
    "stroke",
    lineColor === Css.ident.auto ? "#010101" : lineColor.toString(),
  );
  line.setAttribute("stroke-width", lineWidth);
  line.setAttribute("fill", "none");
  return line;
}

/**
 * Position of a corner mark
 * @enum {string}
 */
export enum CornerMarkPosition {
  TOP_LEFT = "top left",
  TOP_RIGHT = "top right",
  BOTTOM_LEFT = "bottom left",
  BOTTOM_RIGHT = "bottom right",
}

/**
 * Create a corner mark.
 */
export function createCornerMark(
  doc: Document,
  position: CornerMarkPosition,
  lineWidth: number,
  lineColor: Css.Val,
  cropMarkLineLength: number,
  bleed: number,
  offset: number,
): Element {
  let bleedMarkLineLength = cropMarkLineLength;

  // bleed mark line should be longer than bleed + 2mm
  if (bleedMarkLineLength <= bleed + 2 * Exprs.defaultUnitSizes["mm"]) {
    bleedMarkLineLength = bleed + cropMarkLineLength / 2;
  }
  const maxLineLength = Math.max(cropMarkLineLength, bleedMarkLineLength);
  const svgWidth = bleed + maxLineLength + lineWidth / 2;
  const mark = createPrinterMarkSvg(doc, svgWidth, svgWidth);
  let points1 = [
    [0, bleed + cropMarkLineLength],
    [cropMarkLineLength, bleed + cropMarkLineLength],
    [cropMarkLineLength, bleed + cropMarkLineLength - bleedMarkLineLength],
  ];

  // reflect with respect to y=x
  let points2 = points1.map((p) => [p[1], p[0]]);
  if (
    position === CornerMarkPosition.TOP_RIGHT ||
    position === CornerMarkPosition.BOTTOM_RIGHT
  ) {
    // reflect with respect to a vertical axis
    points1 = points1.map((p) => [bleed + maxLineLength - p[0], p[1]]);
    points2 = points2.map((p) => [bleed + maxLineLength - p[0], p[1]]);
  }
  if (
    position === CornerMarkPosition.BOTTOM_LEFT ||
    position === CornerMarkPosition.BOTTOM_RIGHT
  ) {
    // reflect with respect to a vertical axis
    points1 = points1.map((p) => [p[0], bleed + maxLineLength - p[1]]);
    points2 = points2.map((p) => [p[0], bleed + maxLineLength - p[1]]);
  }
  const line1 = createPrinterMarkElement(doc, lineWidth, lineColor);
  line1.setAttribute("points", points1.map((p) => p.join(",")).join(" "));
  mark.appendChild(line1);
  const line2 = createPrinterMarkElement(doc, lineWidth, lineColor);
  line2.setAttribute("points", points2.map((p) => p.join(",")).join(" "));
  mark.appendChild(line2);
  position.split(" ").forEach((side) => {
    (mark as any).style[side] = `${offset}px`;
  });
  return mark;
}

/**
 * Position of a cross mark
 * @enum {string}
 */
export enum CrossMarkPosition {
  TOP = "top",
  BOTTOM = "bottom",
  LEFT = "left",
  RIGHT = "right",
}

/**
 * Create a cross mark.
 */
export function createCrossMark(
  doc: Document,
  position: CrossMarkPosition,
  lineWidth: number,
  lineColor: Css.Val,
  lineLength: number,
  offset: number,
): Element {
  const longLineLength = lineLength * 2;
  let width: number;
  let height: number;
  if (
    position === CrossMarkPosition.TOP ||
    position === CrossMarkPosition.BOTTOM
  ) {
    width = longLineLength;
    height = lineLength;
  } else {
    width = lineLength;
    height = longLineLength;
  }
  const mark = createPrinterMarkSvg(doc, width, height);
  const horizontalLine = createPrinterMarkElement(doc, lineWidth, lineColor);
  horizontalLine.setAttribute(
    "points",
    `0,${height / 2} ${width},${height / 2}`,
  );
  mark.appendChild(horizontalLine);
  const verticalLine = createPrinterMarkElement(doc, lineWidth, lineColor);
  verticalLine.setAttribute("points", `${width / 2},0 ${width / 2},${height}`);
  mark.appendChild(verticalLine);
  const circle = createPrinterMarkElement(doc, lineWidth, lineColor, "circle");
  circle.setAttribute("cx", width / 2);
  circle.setAttribute("cy", height / 2);
  circle.setAttribute("r", lineLength / 4);
  mark.appendChild(circle);
  let opposite: CrossMarkPosition;
  switch (position) {
    case CrossMarkPosition.TOP:
      opposite = CrossMarkPosition.BOTTOM;
      break;
    case CrossMarkPosition.BOTTOM:
      opposite = CrossMarkPosition.TOP;
      break;
    case CrossMarkPosition.LEFT:
      opposite = CrossMarkPosition.RIGHT;
      break;
    case CrossMarkPosition.RIGHT:
      opposite = CrossMarkPosition.LEFT;
      break;
  }
  Object.keys(CrossMarkPosition).forEach((key) => {
    const side = CrossMarkPosition[key];
    if (side === position) {
      (mark as any).style[side] = `${offset}px`;
    } else if (side !== opposite) {
      (mark as any).style[side] = "0";
      (mark as any).style[`margin-${side}`] = "auto";
    }
  });
  return mark;
}

/**
 * Add printer marks to the page.
 */
export function addPrinterMarks(
  cascadedPageStyle: CssCascade.ElementStyle,
  evaluatedPageSizeAndBleed: EvaluatedPageSizeAndBleed,
  page: Vtree.Page,
  context: Exprs.Context,
): void {
  let crop = false;
  let cross = false;
  const marks = cascadedPageStyle["marks"] as CssCascade.CascadeValue;
  if (marks) {
    const value = marks.value;
    if (value instanceof Css.SpaceList) {
      value.values.forEach((v) => {
        if (v === Css.ident.crop) {
          crop = true;
        } else if (v === Css.ident.cross) {
          cross = true;
        }
      });
    } else if (value === Css.ident.crop) {
      crop = true;
    } else if (value === Css.ident.cross) {
      cross = true;
    }
  }

  const bleed = evaluatedPageSizeAndBleed.bleed;
  if (!crop && !cross) {
    return;
  }
  const container = page.container;
  const doc = container.ownerDocument as Document;
  Asserts.assert(doc);
  const lineWidth = Css.toNumber(defaultPrinterMarkLineWidth, context);
  const printerMarkOffset = Math.max(
    0,
    evaluatedPageSizeAndBleed.bleedOffset -
      Css.toNumber(defaultPrinterMarkLineLength, context),
  );
  const lineLength = evaluatedPageSizeAndBleed.bleedOffset - printerMarkOffset;

  const lineColorCV = cascadedPageStyle[
    "crop-marks-line-color"
  ] as CssCascade.CascadeValue;
  const lineColor =
    lineColorCV && !Css.isDefaultingValue(lineColorCV.value)
      ? lineColorCV.value
      : Css.ident.auto;

  // corner marks
  if (crop) {
    Object.keys(CornerMarkPosition).forEach((key) => {
      const position = CornerMarkPosition[key];
      const mark = createCornerMark(
        doc,
        position,
        lineWidth,
        lineColor,
        lineLength,
        bleed,
        printerMarkOffset,
      );
      container.appendChild(mark);
    });
  }

  // cross marks
  if (cross) {
    Object.keys(CrossMarkPosition).forEach((key) => {
      const position = CrossMarkPosition[key];
      const mark = createCrossMark(
        doc,
        position,
        lineWidth,
        lineColor,
        lineLength,
        printerMarkOffset,
      );
      container.appendChild(mark);
    });
  }
}

/**
 * Properties transfered from the PageRuleMaster to the PageRulePartition
 */
export const propertiesAppliedToPartition = (() => {
  const sides = [
    "left",
    "right",
    "top",
    "bottom",
    "before",
    "after",
    "start",
    "end",
    "block-start",
    "block-end",
    "inline-start",
    "inline-end",
  ];
  const props = {
    width: true,
    height: true,
    "block-size": true,
    "inline-size": true,
    margin: true,
    padding: true,
    border: true,
    outline: true,
    "outline-width": true,
    "outline-style": true,
    "outline-color": true,
  };
  sides.forEach((side) => {
    props[`margin-${side}`] = true;
    props[`padding-${side}`] = true;
    props[`border-${side}-width`] = true;
    props[`border-${side}-style`] = true;
    props[`border-${side}-color`] = true;
  });
  return props;
})();

/**
 * Represents position of a margin box along the variable dimension of the page.
 * START and END can be interpreted as 'inline-start' and 'inline-end' in
 * horizontal and vertical writing modes. For example, for top margin boxes
 * (@top-left-corner, @top-left, @top-center, @top-right, @top-right-corner),
 * @top-left corresponds to START, @top-center to CENTER, and @top-right to END.
 * The corner boxes (@top-left-corner and @top-right-corner) have a 'null'
 * position.
 * @enum {string}
 */
export enum MarginBoxPositionAlongVariableDimension {
  START = "start",
  CENTER = "center",
  END = "end",
}

export type PageMarginBoxInformation = {
  order: number;
  isInTopRow: boolean;
  isInBottomRow: boolean;
  isInLeftColumn: boolean;
  isInRightColumn: boolean;
  positionAlongVariableDimension: MarginBoxPositionAlongVariableDimension;
};

/**
 * Page-margin boxes.
 * @dict
 */
export const pageMarginBoxes: { [key: string]: PageMarginBoxInformation } = {
  "top-left-corner": {
    order: 1,
    isInTopRow: true,
    isInBottomRow: false,
    isInLeftColumn: true,
    isInRightColumn: false,
    positionAlongVariableDimension: null,
  },
  "top-left": {
    order: 2,
    isInTopRow: true,
    isInBottomRow: false,
    isInLeftColumn: false,
    isInRightColumn: false,
    positionAlongVariableDimension:
      MarginBoxPositionAlongVariableDimension.START,
  },
  "top-center": {
    order: 3,
    isInTopRow: true,
    isInBottomRow: false,
    isInLeftColumn: false,
    isInRightColumn: false,
    positionAlongVariableDimension:
      MarginBoxPositionAlongVariableDimension.CENTER,
  },
  "top-right": {
    order: 4,
    isInTopRow: true,
    isInBottomRow: false,
    isInLeftColumn: false,
    isInRightColumn: false,
    positionAlongVariableDimension: MarginBoxPositionAlongVariableDimension.END,
  },
  "top-right-corner": {
    order: 5,
    isInTopRow: true,
    isInBottomRow: false,
    isInLeftColumn: false,
    isInRightColumn: true,
    positionAlongVariableDimension: null,
  },
  "right-top": {
    order: 6,
    isInTopRow: false,
    isInBottomRow: false,
    isInLeftColumn: false,
    isInRightColumn: true,
    positionAlongVariableDimension:
      MarginBoxPositionAlongVariableDimension.START,
  },
  "right-middle": {
    order: 7,
    isInTopRow: false,
    isInBottomRow: false,
    isInLeftColumn: false,
    isInRightColumn: true,
    positionAlongVariableDimension:
      MarginBoxPositionAlongVariableDimension.CENTER,
  },
  "right-bottom": {
    order: 8,
    isInTopRow: false,
    isInBottomRow: false,
    isInLeftColumn: false,
    isInRightColumn: true,
    positionAlongVariableDimension: MarginBoxPositionAlongVariableDimension.END,
  },
  "bottom-right-corner": {
    order: 9,
    isInTopRow: false,
    isInBottomRow: true,
    isInLeftColumn: false,
    isInRightColumn: true,
    positionAlongVariableDimension: null,
  },
  "bottom-right": {
    order: 10,
    isInTopRow: false,
    isInBottomRow: true,
    isInLeftColumn: false,
    isInRightColumn: false,
    positionAlongVariableDimension: MarginBoxPositionAlongVariableDimension.END,
  },
  "bottom-center": {
    order: 11,
    isInTopRow: false,
    isInBottomRow: true,
    isInLeftColumn: false,
    isInRightColumn: false,
    positionAlongVariableDimension:
      MarginBoxPositionAlongVariableDimension.CENTER,
  },
  "bottom-left": {
    order: 12,
    isInTopRow: false,
    isInBottomRow: true,
    isInLeftColumn: false,
    isInRightColumn: false,
    positionAlongVariableDimension:
      MarginBoxPositionAlongVariableDimension.START,
  },
  "bottom-left-corner": {
    order: 13,
    isInTopRow: false,
    isInBottomRow: true,
    isInLeftColumn: true,
    isInRightColumn: false,
    positionAlongVariableDimension: null,
  },
  "left-bottom": {
    order: 14,
    isInTopRow: false,
    isInBottomRow: false,
    isInLeftColumn: true,
    isInRightColumn: false,
    positionAlongVariableDimension: MarginBoxPositionAlongVariableDimension.END,
  },
  "left-middle": {
    order: 15,
    isInTopRow: false,
    isInBottomRow: false,
    isInLeftColumn: true,
    isInRightColumn: false,
    positionAlongVariableDimension:
      MarginBoxPositionAlongVariableDimension.CENTER,
  },
  "left-top": {
    order: 16,
    isInTopRow: false,
    isInBottomRow: false,
    isInLeftColumn: true,
    isInRightColumn: false,
    positionAlongVariableDimension:
      MarginBoxPositionAlongVariableDimension.START,
  },
};

/**
 * Names for page-margin boxes order in the default painting order.
 */
export const pageMarginBoxNames: string[] = (() => {
  const boxes = pageMarginBoxes;
  return Object.keys(boxes).sort((a, b) => boxes[a].order - boxes[b].order);
})();

/**
 * Indicates that the page master is generated for `@page` rules.
 */
export const pageRuleMasterPseudoName = "vivliostyle-page-rule-master";

/**
 * Key for properties in margin contexts.
 * Styles in margin contexts are stored in pageStyle["_marginBoxes"][(margin
 * box's name)].
 */
export const marginBoxesKey: string = "_marginBoxes";

/**
 * Represent a page master generated for `@page` rules
 * @param style Cascaded style for `@page` rules
 */
export class PageRuleMaster extends PageMaster.PageMaster<PageRuleMasterInstance> {
  private bodyPartitionKey: string;
  private pageMarginBoxes = {} as {
    [key: string]: PageMarginBoxPartition;
  };

  constructor(
    scope: Exprs.LexicalScope,
    parent: PageMaster.RootPageBox,
    style: CssCascade.ElementStyle,
  ) {
    super(scope, null, pageRuleMasterPseudoName, [], parent, null, 0);
    const pageSize = resolvePageSizeAndBleed(style as any);
    const partition = new PageRulePartition(this.scope, this, style, pageSize);
    this.bodyPartitionKey = partition.key;
    this.createPageMarginBoxes(style);
    this.applySpecified(style, pageSize);
  }

  /**
   * Create page-margin boxes
   */
  createPageMarginBoxes(style: CssCascade.ElementStyle) {
    const marginBoxesMap = style[marginBoxesKey];
    if (marginBoxesMap) {
      pageMarginBoxNames.forEach((name) => {
        if (marginBoxesMap[name]) {
          this.pageMarginBoxes[name] = new PageMarginBoxPartition(
            this.scope,
            this,
            name,
            style,
          );
        }
      });
    }
  }

  /**
   * Transfer cascaded style for `@page` rules to 'specified' style of this
   * PageBox
   */
  private applySpecified(style: CssCascade.ElementStyle, pageSize: PageSize) {
    this.specified["position"] = new CssCascade.CascadeValue(
      Css.ident.relative,
      0,
    );
    this.specified["width"] = new CssCascade.CascadeValue(pageSize.width, 0);
    this.specified["height"] = new CssCascade.CascadeValue(pageSize.height, 0);
    for (const name in style) {
      if (!propertiesAppliedToPartition[name] && name !== "background-clip") {
        this.specified[name] = style[name];
      }
    }
  }

  override createInstance(parentInstance): PageRuleMasterInstance {
    return new PageRuleMasterInstance(parentInstance, this);
  }
}

/**
 * Represent a partition placed in a PageRuleMaster
 * @param style Cascaded style for `@page` rules
 */
export class PageRulePartition extends PageMaster.Partition<PageRulePartitionInstance> {
  constructor(
    scope: Exprs.LexicalScope,
    parent: PageRuleMaster,
    style: CssCascade.ElementStyle,
    public readonly pageSize: PageSize,
  ) {
    super(scope, null, null, [], parent);
    this.specified["z-index"] = new CssCascade.CascadeValue(new Css.Int(0), 0);
    this.applySpecified(style);
  }

  /**
   * Transfer cascaded style for `@page` rules to 'specified' style of this
   * PageBox
   */
  private applySpecified(style: CssCascade.ElementStyle) {
    this.specified["flow-from"] = new CssCascade.CascadeValue(
      Css.getName("body"),
      0,
    );

    // Use absolute positioning so that this partition's margins don't collapse
    // with its parent's margins
    this.specified["position"] = new CssCascade.CascadeValue(
      Css.ident.absolute,
      0,
    );
    this.specified["overflow"] = new CssCascade.CascadeValue(
      Css.ident.visible,
      0,
    );
    for (const prop in propertiesAppliedToPartition) {
      if (propertiesAppliedToPartition.hasOwnProperty(prop)) {
        this.specified[prop] = style[prop];
      }
    }
  }

  override createInstance(parentInstance): PageMaster.PageBoxInstance {
    return new PageRulePartitionInstance(parentInstance, this);
  }
}

/**
 * Represent a partition for a page-margin box
 */
export class PageMarginBoxPartition extends PageMaster.Partition<PageMarginBoxPartitionInstance> {
  constructor(
    scope: Exprs.LexicalScope,
    parent: PageRuleMaster,
    public readonly marginBoxName: string,
    style: CssCascade.ElementStyle,
  ) {
    super(scope, null, null, [], parent);
    this.applySpecified(style);
  }

  /**
   * Transfer cascaded style for `@page` rules to 'specified' style of this
   * PageMarginBox
   */
  applySpecified(style: CssCascade.ElementStyle) {
    const ownStyle = style[marginBoxesKey][
      this.marginBoxName
    ] as CssCascade.ElementStyle;

    // Inherit properties in the page context to the page-margin context
    for (const prop in style) {
      const val = style[prop] as CssCascade.CascadeValue;
      const ownVal = ownStyle[prop] as CssCascade.CascadeValue;
      if (
        CssCascade.inheritedProps[prop] ||
        (ownVal && ownVal.value === Css.ident.inherit)
      ) {
        this.specified[prop] = val;
      }
    }
    for (const prop in ownStyle) {
      if (Object.prototype.hasOwnProperty.call(ownStyle, prop)) {
        const val = ownStyle[prop] as CssCascade.CascadeValue;
        if (
          val &&
          val.value !== Css.empty &&
          val.value !== Css.ident.inherit &&
          val.value !== Css.ident.unset &&
          val.value !== Css.ident.revert
        ) {
          this.specified[prop] = val;
        }
      }
    }
  }

  override createInstance(parentInstance): PageMaster.PageBoxInstance {
    return new PageMarginBoxPartitionInstance(parentInstance, this);
  }
}

//---------------------------- Instance --------------------------------
export type PageAreaDimension = {
  borderBoxWidth: Exprs.Val;
  borderBoxHeight: Exprs.Val;
  marginTop: Exprs.Val;
  marginBottom: Exprs.Val;
  marginLeft: Exprs.Val;
  marginRight: Exprs.Val;
};

export class PageRuleMasterInstance extends PageMaster.PageMasterInstance<PageRuleMaster> {
  pageAreaDimension: PageAreaDimension | null = null;
  pageMarginBoxInstances: {
    [key: string]: PageMarginBoxPartitionInstance;
  } = {};

  constructor(
    parentInstance: PageMaster.PageBoxInstance,
    pageRuleMaster: PageRuleMaster,
  ) {
    super(parentInstance, pageRuleMaster);
  }

  override applyCascadeAndInit(
    cascade: CssCascade.CascadeInstance,
    docElementStyle: CssCascade.ElementStyle,
  ): void {
    const style = this.cascaded;
    for (const name in docElementStyle) {
      if (Object.prototype.hasOwnProperty.call(docElementStyle, name)) {
        switch (name) {
          case "writing-mode":
          case "direction":
            style[name] = docElementStyle[name];
        }
      }
    }
    super.applyCascadeAndInit(cascade, docElementStyle);
  }

  override initHorizontal(): void {
    const style = this.style;
    style["left"] = Css.numericZero;
    style["margin-left"] = Css.numericZero;
    style["border-left-width"] = Css.numericZero;
    style["padding-left"] = Css.numericZero;
    style["padding-right"] = Css.numericZero;
    style["border-right-width"] = Css.numericZero;
    style["margin-right"] = Css.numericZero;
    style["right"] = Css.numericZero;
  }

  override initVertical(): void {
    const style = this.style;

    // Shift 1px to workaround Chrome printing bug
    // style["top"] = new Css.Numeric(-1, "px");
    style["top"] = Css.numericZero;
    style["margin-top"] = Css.numericZero;
    style["border-top-width"] = Css.numericZero;
    style["padding-top"] = Css.numericZero;
    style["padding-bottom"] = Css.numericZero;
    style["border-bottom-width"] = Css.numericZero;
    style["margin-bottom"] = Css.numericZero;
    style["bottom"] = Css.numericZero;
  }

  setPageAreaDimension(dim: PageAreaDimension) {
    this.pageAreaDimension = dim;
    const style = this.style;
    style["width"] = new Css.Expr(dim.borderBoxWidth);
    style["height"] = new Css.Expr(dim.borderBoxHeight);
    style["padding-left"] = new Css.Expr(dim.marginLeft);
    style["padding-right"] = new Css.Expr(dim.marginRight);
    style["padding-top"] = new Css.Expr(dim.marginTop);
    style["padding-bottom"] = new Css.Expr(dim.marginBottom);
  }

  override adjustPageLayout(
    context: Exprs.Context,
    page: Vtree.Page,
    clientLayout: Vtree.ClientLayout,
  ) {
    const marginBoxContainers = page.marginBoxes;
    const horizontalDimensions = {
      start: this.pageAreaDimension.marginLeft,
      end: this.pageAreaDimension.marginRight,
      extent: this.pageAreaDimension.borderBoxWidth,
    };
    const verticalDimensions = {
      start: this.pageAreaDimension.marginTop,
      end: this.pageAreaDimension.marginBottom,
      extent: this.pageAreaDimension.borderBoxHeight,
    };
    this.sizeMarginBoxesAlongVariableDimension(
      marginBoxContainers.top,
      true,
      horizontalDimensions,
      context,
      clientLayout,
    );
    this.sizeMarginBoxesAlongVariableDimension(
      marginBoxContainers.bottom,
      true,
      horizontalDimensions,
      context,
      clientLayout,
    );
    this.sizeMarginBoxesAlongVariableDimension(
      marginBoxContainers.left,
      false,
      verticalDimensions,
      context,
      clientLayout,
    );
    this.sizeMarginBoxesAlongVariableDimension(
      marginBoxContainers.right,
      false,
      verticalDimensions,
      context,
      clientLayout,
    );
  }

  /**
   * Determine and set margin boxes' sizes along variable dimension using an
   * algorithm specified in CSS Paged Media spec.
   * @param marginBoxContainers Containers corresponding to the target margin
   *     boxes in one page edge (top, bottom, left, right)
   * @param isHorizontal Indicates if the target margin boxes are on the
   *     horizontal edge (top or bottom) or not (left or right).
   * @param dimensions Page dimensions. start: margin-left or margin-top. end:
   *     margin-right or margin-bottom. extent: border-box width or height of
   *     the page area (= available width or height for the target margin boxes)
   */
  private sizeMarginBoxesAlongVariableDimension(
    marginBoxContainers: { [key: string]: Vtree.Container },
    isHorizontal: boolean,
    dimensions: { start: Exprs.Val; end: Exprs.Val; extent: Exprs.Val },
    context: Exprs.Context,
    clientLayout: Vtree.ClientLayout,
  ) {
    const START = MarginBoxPositionAlongVariableDimension.START;
    const CENTER = MarginBoxPositionAlongVariableDimension.CENTER;
    const END = MarginBoxPositionAlongVariableDimension.END;

    // prepare parameters
    const scope = this.pageBox.scope;
    const containers: {
      [key in MarginBoxPositionAlongVariableDimension]?: Vtree.Container;
    } = {};
    const boxInstances: {
      [key in MarginBoxPositionAlongVariableDimension]?: PageMarginBoxPartitionInstance;
    } = {};
    const boxParams: {
      [key in MarginBoxPositionAlongVariableDimension]?: MarginBoxSizingParam;
    } = {};
    for (const name in marginBoxContainers) {
      const boxInfo = pageMarginBoxes[name];
      if (boxInfo) {
        const container = marginBoxContainers[name];
        const boxInstance = this.pageMarginBoxInstances[name];
        const boxParam = new SingleBoxMarginBoxSizingParam(
          container,
          (boxInstance as any).style,
          isHorizontal,
          scope,
          clientLayout,
        );
        containers[boxInfo.positionAlongVariableDimension] = container;
        boxInstances[boxInfo.positionAlongVariableDimension] = boxInstance;
        boxParams[boxInfo.positionAlongVariableDimension] = boxParam;
      }
    }

    // determine sizes
    const evaluatedDim = {
      start: dimensions.start.evaluate(context) as number,
      end: dimensions.end.evaluate(context) as number,
      extent: dimensions.extent.evaluate(context) as number,
    };
    let sizes = this.getSizesOfMarginBoxesAlongVariableDimension(
      boxParams,
      evaluatedDim.extent,
    );
    let needRecalculate: boolean = false;

    // Check max-width/max-height
    const maxOuterSizes: {
      [key in MarginBoxPositionAlongVariableDimension]?: number;
    } = {};
    Object.keys(containers).forEach((n) => {
      const name = n as MarginBoxPositionAlongVariableDimension;
      const maxSize = PageMaster.toExprAuto(
        scope,
        boxInstances[name].style[isHorizontal ? "max-width" : "max-height"],
        dimensions.extent,
      );
      if (maxSize) {
        const evaluatedMaxSize = maxSize.evaluate(context) as number;
        if (sizes[name] > evaluatedMaxSize) {
          const p = (boxParams[name] = new FixedSizeMarginBoxSizingParam(
            containers[name],
            boxInstances[name].style,
            isHorizontal,
            scope,
            clientLayout,
            evaluatedMaxSize,
          ));
          maxOuterSizes[name] = p.getOuterSize();
          needRecalculate = true;
        }
      }
    });
    if (needRecalculate) {
      sizes = this.getSizesOfMarginBoxesAlongVariableDimension(
        boxParams,
        evaluatedDim.extent,
      );
      needRecalculate = false;
      [START, CENTER, END].forEach((name) => {
        sizes[name] = maxOuterSizes[name] || sizes[name];
      });
    }

    // Check min-width/min-height
    const minOuterSizes: {
      [key in MarginBoxPositionAlongVariableDimension]?: number;
    } = {};
    Object.keys(containers).forEach((n) => {
      const name = n as MarginBoxPositionAlongVariableDimension;
      const minSize = PageMaster.toExprAuto(
        scope,
        boxInstances[name].style[isHorizontal ? "min-width" : "min-height"],
        dimensions.extent,
      );
      if (minSize) {
        const evaluatedMinSize = minSize.evaluate(context) as number;
        if (sizes[name] < evaluatedMinSize) {
          const p = (boxParams[name] = new FixedSizeMarginBoxSizingParam(
            containers[name],
            boxInstances[name].style,
            isHorizontal,
            scope,
            clientLayout,
            evaluatedMinSize,
          ));
          minOuterSizes[name] = p.getOuterSize();
          needRecalculate = true;
        }
      }
    });
    if (needRecalculate) {
      sizes = this.getSizesOfMarginBoxesAlongVariableDimension(
        boxParams,
        evaluatedDim.extent,
      );
      [START, CENTER, END].forEach((name) => {
        sizes[name] = minOuterSizes[name] || sizes[name];
      });
    }

    // set sizes
    const endEdge = evaluatedDim.start + evaluatedDim.extent;
    const startEndSum =
      evaluatedDim.start + (evaluatedDim.start + evaluatedDim.extent);
    [START, CENTER, END].forEach((name) => {
      const outerSize = sizes[name];
      if (outerSize) {
        const container = containers[name];
        let offset = 0;
        switch (name) {
          case START:
            offset = isHorizontal ? container.left : container.top;
            break;
          case CENTER:
            offset = (startEndSum - outerSize) / 2;
            break;
          case END:
            offset = endEdge - outerSize;
            break;
        }
        if (isHorizontal) {
          container.setHorizontalPosition(
            offset,
            outerSize - container.getInsetLeft() - container.getInsetRight(),
          );
        } else {
          container.setVerticalPosition(
            offset,
            outerSize - container.getInsetTop() - container.getInsetBottom(),
          );
        }
      }
    });
  }

  private getSizesOfMarginBoxesAlongVariableDimension(
    boxParams: {
      [key in MarginBoxPositionAlongVariableDimension]?: MarginBoxSizingParam;
    },
    availableSize: number,
  ): { [key in MarginBoxPositionAlongVariableDimension]?: number } {
    const startBoxParam =
      boxParams[MarginBoxPositionAlongVariableDimension.START];
    const centerBoxParam =
      boxParams[MarginBoxPositionAlongVariableDimension.CENTER];
    const endBoxParam = boxParams[MarginBoxPositionAlongVariableDimension.END];
    const sizes: {
      [key in MarginBoxPositionAlongVariableDimension]?: number;
    } = {};
    if (!centerBoxParam) {
      const startEndSizes = this.distributeAutoMarginBoxSizes(
        startBoxParam,
        endBoxParam,
        availableSize,
      );
      if (startEndSizes.xSize) {
        sizes[MarginBoxPositionAlongVariableDimension.START] =
          startEndSizes.xSize;
      }
      if (startEndSizes.ySize) {
        sizes[MarginBoxPositionAlongVariableDimension.END] =
          startEndSizes.ySize;
      }
    } else {
      const params = [startBoxParam, endBoxParam].filter((p) => p);
      const startEndBoxParam = params.length
        ? new MultipleBoxesMarginBoxSizingParam(params)
        : null;
      const centerSizes = this.distributeAutoMarginBoxSizes(
        centerBoxParam,
        startEndBoxParam,
        availableSize,
      );
      if (centerSizes.xSize) {
        sizes[MarginBoxPositionAlongVariableDimension.CENTER] =
          centerSizes.xSize;
      }
      const centerSize = centerSizes.xSize || centerBoxParam.getOuterSize();
      const startEndAutoSize = (availableSize - centerSize) / 2;
      if (startBoxParam && startBoxParam.hasAutoSize()) {
        sizes[MarginBoxPositionAlongVariableDimension.START] = startEndAutoSize;
      }
      if (endBoxParam && endBoxParam.hasAutoSize()) {
        sizes[MarginBoxPositionAlongVariableDimension.END] = startEndAutoSize;
      }
    }
    return sizes;
  }

  /**
   * Distribute auto margin sizes among two margin boxes using an algorithm
   * specified in CSS Paged Media spec.
   * @param x Parameter for the first margin box. null if the box is not
   *     generated.
   * @param y Parameter for the second margin box. null if the box is not
   *     generated.
   * @param availableSize Available size for the margin boxes.
   * @returns Determined sizes for the two boxes. Each value is present only
   *     when the size of the corresponding box is 'auto'.
   */
  private distributeAutoMarginBoxSizes(
    x: MarginBoxSizingParam,
    y: MarginBoxSizingParam,
    availableSize: number,
  ): { xSize: number | null; ySize: number | null } {
    const result: { xSize: number | null; ySize: number | null } = {
      xSize: null,
      ySize: null,
    };
    if (x && y) {
      if (x.hasAutoSize() && y.hasAutoSize()) {
        const xOuterMaxContentSize = x.getOuterMaxContentSize();
        const yOuterMaxContentSize = y.getOuterMaxContentSize();
        if (xOuterMaxContentSize > 0 && yOuterMaxContentSize > 0) {
          const maxContentSizeSum = xOuterMaxContentSize + yOuterMaxContentSize;
          if (maxContentSizeSum < availableSize) {
            result.xSize =
              (availableSize * xOuterMaxContentSize) / maxContentSizeSum;
          } else {
            const xOuterMinContentSize = x.getOuterMinContentSize();
            const yOuterMinContentSize = y.getOuterMinContentSize();
            const minContentSizeSum =
              xOuterMinContentSize + yOuterMinContentSize;
            if (minContentSizeSum < availableSize) {
              result.xSize =
                xOuterMinContentSize +
                ((availableSize - minContentSizeSum) *
                  (xOuterMaxContentSize - xOuterMinContentSize)) /
                  (maxContentSizeSum - minContentSizeSum);
            } else if (minContentSizeSum > 0) {
              result.xSize =
                (availableSize * xOuterMinContentSize) / minContentSizeSum;
            }
          }
          if (result.xSize > 0) {
            result.ySize = availableSize - result.xSize;
          }
        } else if (xOuterMaxContentSize > 0) {
          result.xSize = availableSize;
        } else if (yOuterMaxContentSize > 0) {
          result.ySize = availableSize;
        }
      } else if (x.hasAutoSize()) {
        result.xSize = Math.max(availableSize - y.getOuterSize(), 0);
      } else if (y.hasAutoSize()) {
        result.ySize = Math.max(availableSize - x.getOuterSize(), 0);
      }
    } else if (x) {
      if (x.hasAutoSize()) {
        result.xSize = availableSize;
      }
    } else if (y) {
      if (y.hasAutoSize()) {
        result.ySize = availableSize;
      }
    }
    return result;
  }

  override prepareContainer(
    context: Exprs.Context,
    container: Vtree.Container,
    page: Vtree.Page,
    docFaces: Font.DocumentFaces,
    clientLayout: Vtree.ClientLayout,
  ): void {
    super.prepareContainer(context, container, page, docFaces, clientLayout);

    // Add an attribute to the element so that it can be refered from external
    // style sheets.
    container.element.setAttribute("data-vivliostyle-page-box", true);
  }
}

/**
 * Interface used for parameters passed to distributeAutoMarginBoxSizes method.
 */
interface MarginBoxSizingParam {
  hasAutoSize(): boolean;

  getOuterMaxContentSize(): number;

  getOuterMinContentSize(): number;

  getOuterSize(): number;
}

/**
 * MarginBoxSizingParam for a single page-margin box.
 * @param container A container corresponding to the target margin box.
 * @param style Styles specified to the target margin box.
 */
class SingleBoxMarginBoxSizingParam implements MarginBoxSizingParam {
  private hasAutoSize_: boolean;
  private size: { [key in Sizing.Size]: number } | null = null;

  constructor(
    protected readonly container: Vtree.Container,
    style: { [key: string]: Css.Val },
    protected readonly isHorizontal: boolean,
    scope: Exprs.LexicalScope,
    private readonly clientLayout: Vtree.ClientLayout,
  ) {
    const val = style[isHorizontal ? "width" : "height"];
    this.hasAutoSize_ =
      !val || val === Css.ident.auto || Css.isDefaultingValue(val);
  }

  /** @override */
  hasAutoSize(): boolean {
    return this.hasAutoSize_;
  }

  private getSize(): { [key in Sizing.Size]: number } {
    if (!this.size) {
      const sizes = this.isHorizontal
        ? [Sizing.Size.MAX_CONTENT_WIDTH, Sizing.Size.MIN_CONTENT_WIDTH]
        : [Sizing.Size.MAX_CONTENT_HEIGHT, Sizing.Size.MIN_CONTENT_HEIGHT];
      this.size = Sizing.getSize(
        this.clientLayout,
        this.container.element,
        sizes,
      );
    }
    return this.size;
  }

  /** @override */
  getOuterMaxContentSize(): number {
    const size = this.getSize();
    if (this.isHorizontal) {
      return (
        this.container.getInsetLeft() +
        size[Sizing.Size.MAX_CONTENT_WIDTH] +
        this.container.getInsetRight()
      );
    } else {
      return (
        this.container.getInsetTop() +
        size[Sizing.Size.MAX_CONTENT_HEIGHT] +
        this.container.getInsetBottom()
      );
    }
  }

  /** @override */
  getOuterMinContentSize(): number {
    const size = this.getSize();
    if (this.isHorizontal) {
      return (
        this.container.getInsetLeft() +
        size[Sizing.Size.MIN_CONTENT_WIDTH] +
        this.container.getInsetRight()
      );
    } else {
      return (
        this.container.getInsetTop() +
        size[Sizing.Size.MIN_CONTENT_HEIGHT] +
        this.container.getInsetBottom()
      );
    }
  }

  /** @override */
  getOuterSize(): number {
    if (this.isHorizontal) {
      return (
        this.container.getInsetLeft() +
        this.container.width +
        this.container.getInsetRight()
      );
    } else {
      return (
        this.container.getInsetTop() +
        this.container.height +
        this.container.getInsetBottom()
      );
    }
  }
}

/**
 * MarginBoxSizingParam with which multiple margin boxes are treated as one
 * margin box. Each method querying a dimension returns the maximum of the boxes
 * multiplied by the number of the boxes.
 * @param params MarginBoxSizingParam's of the target margin boxes.
 */
class MultipleBoxesMarginBoxSizingParam implements MarginBoxSizingParam {
  constructor(private readonly params: MarginBoxSizingParam[]) {}

  /** @override */
  hasAutoSize(): boolean {
    return this.params.some((p) => p.hasAutoSize());
  }

  /** @override */
  getOuterMaxContentSize(): number {
    const sizes = this.params.map((p) => p.getOuterMaxContentSize());
    return Math.max.apply(null, sizes) * sizes.length;
  }

  /** @override */
  getOuterMinContentSize(): number {
    const sizes = this.params.map((p) => p.getOuterMinContentSize());
    return Math.max.apply(null, sizes) * sizes.length;
  }

  /** @override */
  getOuterSize(): number {
    const sizes = this.params.map((p) => p.getOuterSize());
    return Math.max.apply(null, sizes) * sizes.length;
  }
}

/**
 * MarginBoxSizingParam for a single page-margin box with a fixed size along the
 * variable dimension.
 * @param container A container corresponding to the target margin box.
 * @param style Styles specified to the target margin box.
 * @param size The fixed size (width or height) along the variable dimension.
 */
class FixedSizeMarginBoxSizingParam extends SingleBoxMarginBoxSizingParam {
  private fixedSize: number;

  constructor(
    container: Vtree.Container,
    style: { [key: string]: Css.Val },
    isHorizontal: boolean,
    scope: Exprs.LexicalScope,
    clientLayout: Vtree.ClientLayout,
    size: number,
  ) {
    super(container, style, isHorizontal, scope, clientLayout);
    this.fixedSize = size;
  }

  override hasAutoSize(): boolean {
    return false;
  }

  override getOuterMaxContentSize(): number {
    return this.getOuterSize();
  }

  override getOuterMinContentSize(): number {
    return this.getOuterSize();
  }

  override getOuterSize(): number {
    if (this.isHorizontal) {
      return (
        this.container.getInsetLeft() +
        this.fixedSize +
        this.container.getInsetRight()
      );
    } else {
      return (
        this.container.getInsetTop() +
        this.fixedSize +
        this.container.getInsetBottom()
      );
    }
  }
}

export class PageRulePartitionInstance extends PageMaster.PartitionInstance<PageRulePartition> {
  borderBoxWidth: Exprs.Val = null;
  borderBoxHeight: Exprs.Val = null;
  marginTop: Exprs.Val = null;
  marginRight: Exprs.Val = null;
  marginBottom: Exprs.Val = null;
  marginLeft: Exprs.Val = null;

  constructor(
    parentInstance: PageMaster.PageBoxInstance,
    pageRulePartition: PageRulePartition,
  ) {
    super(parentInstance, pageRulePartition);
  }

  override applyCascadeAndInit(
    cascade: CssCascade.CascadeInstance,
    docElementStyle: CssCascade.ElementStyle,
  ): void {
    const style = this.cascaded;
    for (const name in docElementStyle) {
      if (Object.prototype.hasOwnProperty.call(docElementStyle, name)) {
        if (name.match(/^column.*$/) || name.match(/^background-/)) {
          style[name] = docElementStyle[name];
        }
      }
    }
    super.applyCascadeAndInit(cascade, docElementStyle);
    const pageRuleMasterInstance = this
      .parentInstance as PageRuleMasterInstance;
    pageRuleMasterInstance.setPageAreaDimension({
      borderBoxWidth: this.borderBoxWidth,
      borderBoxHeight: this.borderBoxHeight,
      marginTop: this.marginTop,
      marginRight: this.marginRight,
      marginBottom: this.marginBottom,
      marginLeft: this.marginLeft,
    });
  }

  override initHorizontal(): void {
    const dim = this.resolvePageBoxDimensions({
      start: "left",
      end: "right",
      extent: "width",
    });
    this.borderBoxWidth = dim.borderBoxExtent;
    this.marginLeft = dim.marginStart;
    this.marginRight = dim.marginEnd;
  }

  override initVertical(): void {
    const dim = this.resolvePageBoxDimensions({
      start: "top",
      end: "bottom",
      extent: "height",
    });
    this.borderBoxHeight = dim.borderBoxExtent;
    this.marginTop = dim.marginStart;
    this.marginBottom = dim.marginEnd;
  }

  /**
   * Calculate page dimensions as specified in CSS Paged Media
   * (http://dev.w3.org/csswg/css-page/#page-model) Page border box extent and
   * margins. Since the containing block can be resized in the over-constrained
   * case, the sum of these values is not necessarily same to the original page
   * dimension specified in the page at-rules.
   */
  private resolvePageBoxDimensions(names: {
    start: string;
    end: string;
    extent: string;
  }): {
    borderBoxExtent: Exprs.Val;
    marginStart: Exprs.Val;
    marginEnd: Exprs.Val;
  } {
    const style = this.style;
    const pageSize = this.pageBox.pageSize;
    const scope = this.pageBox.scope;
    const startSide = names.start;
    const endSide = names.end;
    const extentName = names.extent;
    const pageExtent = pageSize[extentName].toExpr(scope, null);
    let extent = PageMaster.toExprAuto(scope, style[extentName], pageExtent);
    let marginStart = PageMaster.toExprAuto(
      scope,
      style[`margin-${startSide}`],
      pageExtent,
    );
    let marginEnd = PageMaster.toExprAuto(
      scope,
      style[`margin-${endSide}`],
      pageExtent,
    );
    const paddingStart = PageMaster.toExprZero(
      scope,
      style[`padding-${startSide}`],
      pageExtent,
    );
    const paddingEnd = PageMaster.toExprZero(
      scope,
      style[`padding-${endSide}`],
      pageExtent,
    );
    const borderStartWidth = PageMaster.toExprZeroBorder(
      scope,
      style[`border-${startSide}-width`],
      style[`border-${startSide}-style`],
      pageExtent,
    );
    const borderEndWidth = PageMaster.toExprZeroBorder(
      scope,
      style[`border-${endSide}-width`],
      style[`border-${endSide}-style`],
      pageExtent,
    );
    let remains = Exprs.sub(
      scope,
      pageExtent,
      Exprs.add(
        scope,
        Exprs.add(scope, borderStartWidth, paddingStart),
        Exprs.add(scope, borderEndWidth, paddingEnd),
      ),
    );

    // The dimensions are calculated as for a non-replaced block element in
    // normal flow (http://www.w3.org/TR/CSS21/visudet.html#blockwidth)
    if (!extent) {
      if (!marginStart) {
        marginStart = scope.zero;
      }
      if (!marginEnd) {
        marginEnd = scope.zero;
      }
      extent = Exprs.sub(
        scope,
        remains,
        Exprs.add(scope, marginStart, marginEnd),
      );
    } else {
      remains = Exprs.sub(scope, remains, extent);
      if (!marginStart && !marginEnd) {
        marginStart = Exprs.mul(scope, remains, new Exprs.Const(scope, 0.5));
        marginEnd = marginStart;
      } else if (marginStart) {
        marginEnd = Exprs.sub(scope, remains, marginStart);
      } else {
        marginStart = Exprs.sub(scope, remains, marginEnd);
      }
    }

    // TODO over-constrained case
    // "if the values are over-constrained, instead of ignoring any margins, the
    // containing block is resized to coincide with the margin edges of the page
    // box." (CSS Paged Media http://dev.w3.org/csswg/css-page/#page-model)

    if (
      pageSize.width !== Css.fullWidth ||
      pageSize.height !== Css.fullHeight ||
      this.hasBorderOrOutline() ||
      (marginStart instanceof Exprs.Numeric && marginStart.num < 0) ||
      (marginEnd instanceof Exprs.Numeric && marginEnd.num < 0)
    ) {
      style[startSide] = new Css.Expr(marginStart);
      style[endSide] = new Css.Expr(marginEnd);
      style[`margin-${startSide}`] = Css.numericZero;
      style[`margin-${endSide}`] = Css.numericZero;
      style[`border-${startSide}-width`] = new Css.Expr(borderStartWidth);
      style[`border-${endSide}-width`] = new Css.Expr(borderEndWidth);
    } else {
      // If page size is auto and page box has no border or outline and margins are not negative,
      // use transparent borders for page margins. This is to improve text selection behavior.
      style[startSide] = Css.numericZero;
      style[endSide] = Css.numericZero;
      style[`margin-${startSide}`] = Css.numericZero;
      style[`margin-${endSide}`] = Css.numericZero;
      style[`border-${startSide}-width`] = new Css.Expr(marginStart);
      style[`border-${endSide}-width`] = new Css.Expr(marginEnd);
      style[`border-${startSide}-style`] = Css.ident.solid;
      style[`border-${endSide}-style`] = Css.ident.solid;
      style[`border-${startSide}-color`] = Css.ident.transparent;
      style[`border-${endSide}-color`] = Css.ident.transparent;
      style["background-clip"] = Css.ident.padding_box;
    }
    style[`padding-${startSide}`] = new Css.Expr(paddingStart);
    style[`padding-${endSide}`] = new Css.Expr(paddingEnd);
    style[extentName] = new Css.Expr(extent);
    style[`max-${extentName}`] = new Css.Expr(extent);
    return {
      borderBoxExtent: Exprs.sub(
        scope,
        pageExtent,
        Exprs.add(scope, marginStart, marginEnd),
      ),
      marginStart,
      marginEnd,
    };
  }

  private hasBorderOrOutline(): boolean {
    const hasBorder1 = (propName: string): boolean => {
      const propValue = CssCascade.getProp(this.cascaded, propName)?.value;
      return !!propValue && propValue !== Css.ident.none;
    };
    return (
      hasBorder1("border-top-style") ||
      hasBorder1("border-bottom-style") ||
      hasBorder1("border-left-style") ||
      hasBorder1("border-right-style") ||
      hasBorder1("border-block-start-style") ||
      hasBorder1("border-block-end-style") ||
      hasBorder1("border-inline-start-style") ||
      hasBorder1("border-inline-end-style") ||
      hasBorder1("outline-style")
    );
  }

  override prepareContainer(
    context: Exprs.Context,
    container: Vtree.Container,
    page: Vtree.Page,
    docFaces: Font.DocumentFaces,
    clientLayout: Vtree.ClientLayout,
  ): void {
    page.pageAreaElement = container.element as HTMLElement;
    super.prepareContainer(context, container, page, docFaces, clientLayout);

    // Set page area size for vw/vh unit calculation
    context.pageAreaWidth = parseFloat(page.pageAreaElement.style.width);
    context.pageAreaHeight = parseFloat(page.pageAreaElement.style.height);
  }
}

export class PageMarginBoxPartitionInstance extends PageMaster.PartitionInstance<PageMarginBoxPartition> {
  boxInfo: PageMarginBoxInformation;
  suppressEmptyBoxGeneration: boolean = true;

  constructor(
    parentInstance: PageMaster.PageBoxInstance,
    pageMarginBoxPartition: PageMarginBoxPartition,
  ) {
    super(parentInstance, pageMarginBoxPartition);
    const name = pageMarginBoxPartition.marginBoxName;
    this.boxInfo = pageMarginBoxes[name];
    const pageRuleMasterInstance = parentInstance as PageRuleMasterInstance;
    pageRuleMasterInstance.pageMarginBoxInstances[name] = this;
  }

  override prepareContainer(
    context: Exprs.Context,
    container: Vtree.Container,
    page: Vtree.Page,
    docFaces: Font.DocumentFaces,
    clientLayout: Vtree.ClientLayout,
  ): void {
    this.applyVerticalAlign(context, container.element);
    super.prepareContainer(context, container, page, docFaces, clientLayout);
  }

  private applyVerticalAlign(context: Exprs.Context, element: Element) {
    Base.setCSSProperty(element, "display", "flex");
    Base.setCSSProperty(
      element,
      "flex-flow",
      this.vertical ? (this.rtl ? "row-reverse" : "row") : "column",
    );
    const verticalAlign: Css.Val = this.getProp(context, "vertical-align");
    let flexAlign: string | null = null;
    if (verticalAlign === Css.getName("middle")) {
      flexAlign = "center";
    } else if (verticalAlign === Css.getName("top")) {
      flexAlign = "flex-start";
    } else if (verticalAlign === Css.getName("bottom")) {
      flexAlign = "flex-end";
    }
    if (flexAlign) {
      Base.setCSSProperty(element, "justify-content", flexAlign);
    }
    const content: Css.Val = this.getProp(context, "content");
    if (
      this.vertical ||
      content instanceof Css.URL ||
      (content instanceof Css.Expr &&
        content.expr instanceof Exprs.Native &&
        content.expr.str.startsWith("running-element-"))
    ) {
      let align = "center";
      if (this.boxInfo.isInTopRow || this.boxInfo.isInBottomRow) {
        if (
          this.boxInfo.isInLeftColumn ||
          this.boxInfo.positionAlongVariableDimension ===
            MarginBoxPositionAlongVariableDimension.END
        ) {
          align = this.vertical || this.rtl ? "start" : "end";
        } else if (
          this.boxInfo.isInRightColumn ||
          this.boxInfo.positionAlongVariableDimension ===
            MarginBoxPositionAlongVariableDimension.START
        ) {
          align = this.vertical || this.rtl ? "end" : "start";
        }
      }
      Base.setCSSProperty(element, "align-items", align);
    }
  }

  /**
   * Calculate page-margin boxes positions along the variable dimension of the
   * page. For CENTER and END margin boxes, the position is calculated only if
   * the dimension (width or height) is non-auto, so that it can be resolved at
   * this point. If the dimension is auto, the calculation is deffered.
   */
  private positionAlongVariableDimension(
    names: { start: string; end: string; extent: string },
    dim: PageAreaDimension | null,
  ): void {
    const style = this.style;
    const scope = this.pageBox.scope;
    const startSide = names.start;
    const endSide = names.end;
    const extentName = names.extent;
    const isHorizontal = startSide === "left";
    const availableExtent = isHorizontal
      ? dim.borderBoxWidth
      : dim.borderBoxHeight;
    const extent = PageMaster.toExprAuto(
      scope,
      style[extentName],
      availableExtent,
    );
    const startOffset = isHorizontal ? dim.marginLeft : dim.marginTop;
    if (
      this.boxInfo.positionAlongVariableDimension ===
      MarginBoxPositionAlongVariableDimension.START
    ) {
      style[startSide] = new Css.Expr(startOffset);
    } else if (extent) {
      const marginStart = PageMaster.toExprZero(
        scope,
        style[`margin-${startSide}`],
        availableExtent,
      );
      const marginEnd = PageMaster.toExprZero(
        scope,
        style[`margin-${endSide}`],
        availableExtent,
      );
      const paddingStart = PageMaster.toExprZero(
        scope,
        style[`padding-${startSide}`],
        availableExtent,
      );
      const paddingEnd = PageMaster.toExprZero(
        scope,
        style[`padding-${endSide}`],
        availableExtent,
      );
      const borderStartWidth = PageMaster.toExprZeroBorder(
        scope,
        style[`border-${startSide}-width`],
        style[`border-${startSide}-style`],
        availableExtent,
      );
      const borderEndWidth = PageMaster.toExprZeroBorder(
        scope,
        style[`border-${endSide}-width`],
        style[`border-${endSide}-style`],
        availableExtent,
      );
      const outerExtent = Exprs.add(
        scope,
        extent,
        Exprs.add(
          scope,
          Exprs.add(scope, paddingStart, paddingEnd),
          Exprs.add(
            scope,
            Exprs.add(scope, borderStartWidth, borderEndWidth),
            Exprs.add(scope, marginStart, marginEnd),
          ),
        ),
      );
      switch (this.boxInfo.positionAlongVariableDimension) {
        case MarginBoxPositionAlongVariableDimension.CENTER:
          style[startSide] = new Css.Expr(
            Exprs.add(
              scope,
              startOffset,
              Exprs.div(
                scope,
                Exprs.sub(scope, availableExtent, outerExtent),
                new Exprs.Const(scope, 2),
              ),
            ),
          );
          break;
        case MarginBoxPositionAlongVariableDimension.END:
          style[startSide] = new Css.Expr(
            Exprs.sub(
              scope,
              Exprs.add(scope, startOffset, availableExtent),
              outerExtent,
            ),
          );
          break;
      }
    }
  }

  /**
   * Calculate page-margin boxes positions along the fixed dimension of the
   * page.
   */
  private positionAndSizeAlongFixedDimension(
    names: { inside: string; outside: string; extent: string },
    dim: PageAreaDimension | null,
  ): void {
    const style = this.style;
    const scope = this.pageBox.scope;
    const insideName = names.inside;
    const outsideName = names.outside;
    const extentName = names.extent;
    const pageMargin =
      dim[
        `margin${outsideName.charAt(0).toUpperCase()}${outsideName.substring(
          1,
        )}`
      ];
    const marginInside = PageMaster.toExprZeroAuto(
      scope,
      style[`margin-${insideName}`],
      pageMargin,
    );
    const marginOutside = PageMaster.toExprZeroAuto(
      scope,
      style[`margin-${outsideName}`],
      pageMargin,
    );
    const paddingInside = PageMaster.toExprZero(
      scope,
      style[`padding-${insideName}`],
      pageMargin,
    );
    const paddingOutside = PageMaster.toExprZero(
      scope,
      style[`padding-${outsideName}`],
      pageMargin,
    );
    const borderInsideWidth = PageMaster.toExprZeroBorder(
      scope,
      style[`border-${insideName}-width`],
      style[`border-${insideName}-style`],
      pageMargin,
    );
    const borderOutsideWidth = PageMaster.toExprZeroBorder(
      scope,
      style[`border-${outsideName}-width`],
      style[`border-${outsideName}-style`],
      pageMargin,
    );
    const extent = PageMaster.toExprAuto(scope, style[extentName], pageMargin);
    let result: {
      extent: Exprs.Result;
      marginInside: Exprs.Result;
      marginOutside: Exprs.Result;
    } = null;

    function getComputedValues(context: Exprs.Context): {
      extent: Exprs.Result | null;
      marginInside: Exprs.Result | null;
      marginOutside: Exprs.Result | null;
    } {
      if (result) {
        return result;
      }
      result = {
        extent: extent ? extent.evaluate(context) : null,
        marginInside: marginInside ? marginInside.evaluate(context) : null,
        marginOutside: marginOutside ? marginOutside.evaluate(context) : null,
      };
      const pageMarginValue = pageMargin.evaluate(context);
      let borderAndPadding = 0;
      [
        borderInsideWidth,
        paddingInside,
        paddingOutside,
        borderOutsideWidth,
      ].forEach((x) => {
        if (x) {
          borderAndPadding += x.evaluate(context) as number;
        }
      });
      if (result.marginInside === null || result.marginOutside === null) {
        const total =
          borderAndPadding +
          (result.extent as number) +
          (result.marginInside as number) +
          (result.marginOutside as number);
        if (total > pageMarginValue) {
          if (result.marginInside === null) {
            result.marginInside = 0;
          }
          if (result.marginOutside === null) {
            result.marginOutside = 0;
          }
        }
      }
      if (
        result.extent !== null &&
        result.marginInside !== null &&
        result.marginOutside !== null
      ) {
        // over-constrained
        result.marginOutside = null;
      }
      if (
        result.extent === null &&
        result.marginInside !== null &&
        result.marginOutside !== null
      ) {
        result.extent =
          pageMarginValue -
          borderAndPadding -
          (result.marginInside as number) -
          (result.marginOutside as number);
      } else if (
        result.extent !== null &&
        (result.marginInside as number) === null &&
        (result.marginOutside as number) !== null
      ) {
        result.marginInside =
          pageMarginValue -
          borderAndPadding -
          (result.extent as number) -
          (result.marginOutside as number);
      } else if (
        result.extent !== null &&
        result.marginInside !== null &&
        result.marginOutside === null
      ) {
        result.marginOutside =
          pageMarginValue -
          borderAndPadding -
          (result.extent as number) -
          (result.marginInside as number);
      } else if (result.extent === null) {
        result.marginInside = result.marginOutside = 0;
        result.extent = pageMarginValue - borderAndPadding;
      } else {
        result.marginInside = result.marginOutside =
          (pageMarginValue - borderAndPadding - (result.extent as number)) / 2;
      }
      return result;
    }
    style[extentName] = new Css.Expr(
      new Exprs.Native(
        scope,
        function () {
          const value = getComputedValues(this).extent;
          return value === null ? 0 : value;
        },
        extentName,
      ),
    );
    style[`margin-${insideName}`] = new Css.Expr(
      new Exprs.Native(
        scope,
        function () {
          const value = getComputedValues(this).marginInside;
          return value === null ? 0 : value;
        },
        `margin-${insideName}`,
      ),
    );
    style[`margin-${outsideName}`] = new Css.Expr(
      new Exprs.Native(
        scope,
        function () {
          const value = getComputedValues(this).marginOutside;
          return value === null ? 0 : value;
        },
        `margin-${outsideName}`,
      ),
    );
    if (insideName === "left") {
      style["left"] = new Css.Expr(
        Exprs.add(scope, dim.marginLeft, dim.borderBoxWidth),
      );
    } else if (insideName === "top") {
      style["top"] = new Css.Expr(
        Exprs.add(scope, dim.marginTop, dim.borderBoxHeight),
      );
    }
  }

  override initHorizontal(): void {
    const pageRuleMasterInstance = this
      .parentInstance as PageRuleMasterInstance;
    const dim = pageRuleMasterInstance.pageAreaDimension;
    if (this.boxInfo.isInLeftColumn) {
      this.positionAndSizeAlongFixedDimension(
        { inside: "right", outside: "left", extent: "width" },
        dim,
      );
    } else if (this.boxInfo.isInRightColumn) {
      this.positionAndSizeAlongFixedDimension(
        { inside: "left", outside: "right", extent: "width" },
        dim,
      );
    } else {
      this.positionAlongVariableDimension(
        { start: "left", end: "right", extent: "width" },
        dim,
      );
    }
  }

  override initVertical(): void {
    const pageRuleMasterInstance = this
      .parentInstance as PageRuleMasterInstance;
    const dim = pageRuleMasterInstance.pageAreaDimension;
    if (this.boxInfo.isInTopRow) {
      this.positionAndSizeAlongFixedDimension(
        { inside: "bottom", outside: "top", extent: "height" },
        dim,
      );
    } else if (this.boxInfo.isInBottomRow) {
      this.positionAndSizeAlongFixedDimension(
        { inside: "top", outside: "bottom", extent: "height" },
        dim,
      );
    } else {
      this.positionAlongVariableDimension(
        { start: "top", end: "bottom", extent: "height" },
        dim,
      );
    }
  }

  override finishContainer(
    context: Exprs.Context,
    container: Vtree.Container,
    page: Vtree.Page,
    column: Vtree.Container,
    columnCount: number,
    clientLayout: Vtree.ClientLayout,
    docFaces: Font.DocumentFaces,
  ): void {
    super.finishContainer(
      context,
      container,
      page,
      column,
      columnCount,
      clientLayout,
      docFaces,
    );

    // finishContainer is called only when the margin box is generated.
    // In this case, store the generated container for the margin box in the
    // page object. (except when it is a corner margin box, because size of a
    // corner margin box does not need to be adjusted after the layout)
    const marginBoxes = page.marginBoxes;
    const name = (this.pageBox as any).marginBoxName;
    const boxInfo = this.boxInfo;
    if (!boxInfo.isInLeftColumn && !boxInfo.isInRightColumn) {
      if (boxInfo.isInTopRow) {
        marginBoxes.top[name] = container;
      } else if (boxInfo.isInBottomRow) {
        marginBoxes.bottom[name] = container;
      }
    } else if (!boxInfo.isInTopRow && !boxInfo.isInBottomRow) {
      if (boxInfo.isInLeftColumn) {
        marginBoxes.left[name] = container;
      } else if (boxInfo.isInRightColumn) {
        marginBoxes.right[name] = container;
      }
    }
  }
}

/**
 * Dynamically generate and manage page masters corresponding to page at-rules.
 */
export class PageManager {
  private pageMasterCache: any = {} as {
    [key: string]: PageMaster.PageMasterInstance;
  };

  constructor(
    private readonly cascadeInstance: CssCascade.CascadeInstance,
    private readonly pageScope: Exprs.LexicalScope,
    private readonly rootPageBoxInstance: PageMaster.RootPageBoxInstance,
    private readonly context: Exprs.Context,
    private readonly docElementStyle: CssCascade.ElementStyle,
  ) {
    this.definePageProgression();
  }

  /**
   * Determine the page progression and define left/right/recto/verso pages.
   */
  private definePageProgression() {
    // If a page break is forced before the root element, recto/verso pages
    // are no longer odd/even pages. left/right are reversed too.
    const scope = this.pageScope;
    const styleInstance: any /* Ops.StyleInstance */ = this.context;
    const isVersoFirstPage = styleInstance.isVersoFirstPage;
    const pageNumber = new Exprs.Named(scope, "page-number");
    const isVersoPage = new Exprs.Eq(
      scope,
      new Exprs.Modulo(scope, pageNumber, new Exprs.Const(scope, 2)),
      isVersoFirstPage ? scope.one : scope.zero,
    );
    scope.defineName("recto-page", new Exprs.Not(scope, isVersoPage));
    scope.defineName("verso-page", isVersoPage);
    const pageProgression =
      styleInstance.pageProgression ||
      resolvePageProgression(this.docElementStyle);
    if (pageProgression === Constants.PageProgression.LTR) {
      scope.defineName("left-page", isVersoPage);
      scope.defineName("right-page", new Exprs.Not(scope, isVersoPage));
    } else {
      scope.defineName("left-page", new Exprs.Not(scope, isVersoPage));
      scope.defineName("right-page", isVersoPage);
    }
  }

  /**
   * Get cascaded page style specified in page context for the current page.
   */
  getCascadedPageStyle(pageType: string): CssCascade.ElementStyle {
    const style = {} as CssCascade.ElementStyle;
    this.cascadeInstance.pushRule([], pageType, style);
    this.cascadeInstance.popRule();
    return style;
  }

  /**
   * Return a PageMasterInstance with page rules applied. Return a cached
   * instance if there already exists one with the same styles.
   * @param pageMasterInstance The original page master instance.
   * @param cascadedPageStyle Cascaded page style specified in page context.
   */
  getPageRulePageMaster(
    pageMasterInstance: PageMaster.PageMasterInstance,
    cascadedPageStyle: CssCascade.ElementStyle,
  ): PageMaster.PageMasterInstance {
    const pageMaster = pageMasterInstance.pageBox as PageMaster.PageMaster;

    // If no properies are specified in @page rules, use the original page
    // master.
    if (Object.keys(cascadedPageStyle).length === 0) {
      pageMaster.resetScope();
      return pageMasterInstance;
    }
    const key = this.makeCacheKey(cascadedPageStyle, pageMaster);
    let applied = this.pageMasterCache[key];
    if (!applied) {
      if (pageMaster.pseudoName === PageMaster.userAgentPageMasterPseudo) {
        // If the passed page master is a UA page master,
        // ignore it and generate a new page master from @page rules.
        applied = this.generatePageRuleMaster(cascadedPageStyle);
      } else {
        // Otherwise cascade some properties from @page rules to the page
        // master.
        applied = this.generateCascadedPageMaster(
          cascadedPageStyle,
          pageMaster,
        );
      }
      this.pageMasterCache[key] = applied;
    }
    applied.pageBox.resetScope();
    return applied;
  }

  /**
   * Generate a cache key from the specified styles and the original page master
   * key.
   */
  private makeCacheKey(
    style: CssCascade.ElementStyle,
    pageMaster: PageMaster.PageMaster,
  ): string {
    const propsStr = this.makeCascadeValueObjectKey(style);
    return `${pageMaster.key}^${propsStr}`;
  }

  private makeCascadeValueObjectKey(object: CssCascade.ElementStyle): string {
    const props = [] as string[];
    for (const prop in object) {
      if (Object.prototype.hasOwnProperty.call(object, prop)) {
        const val = object[prop] as CssCascade.CascadeValue;
        let str: string;
        if (val instanceof CssCascade.CascadeValue) {
          str = `${val.value}`;
        } else {
          str = this.makeCascadeValueObjectKey(val);
        }
        props.push(prop + str + (val.priority || ""));
      }
    }
    return props.sort().join("^");
  }

  private generatePageRuleMaster(
    style: CssCascade.ElementStyle,
  ): PageRuleMasterInstance {
    const pageMaster = new PageRuleMaster(
      this.pageScope,
      this.rootPageBoxInstance.pageBox as PageMaster.RootPageBox,
      style,
    );
    const pageMasterInstance = pageMaster.createInstance(
      this.rootPageBoxInstance,
    );

    // Do the same initialization as in Ops.StyleInstance.prototype.init
    pageMasterInstance.applyCascadeAndInit(
      this.cascadeInstance,
      this.docElementStyle,
    );
    pageMasterInstance.resolveAutoSizing(this.context);
    return pageMasterInstance;
  }

  /**
   * Cascade some properties from `@page` rules to a page master.
   * For now, only 'width' and 'height' resolved from 'size' value are cascaded.
   * @param style Cascaded style in the page context
   * @param pageMaster The original page master
   */
  private generateCascadedPageMaster(
    style: CssCascade.ElementStyle,
    pageMaster: PageMaster.PageMaster,
  ): PageMaster.PageMasterInstance {
    const newPageMaster = pageMaster.clone({
      pseudoName: pageRuleMasterPseudoName,
    });
    const pageMasterStyle = newPageMaster.specified;
    const size = style["size"] as CssCascade.CascadeValue;
    if (size && !Css.isDefaultingValue(size.value)) {
      const pageSize = resolvePageSizeAndBleed(style as any);
      const priority = size.priority;
      CssCascade.setPropCascadeValue(
        pageMasterStyle,
        "width",
        new CssCascade.CascadeValue(pageSize.width, priority),
        this.context,
      );
      CssCascade.setPropCascadeValue(
        pageMasterStyle,
        "height",
        new CssCascade.CascadeValue(pageSize.height, priority),
        this.context,
      );
    }

    // Transfer counter properties to the page style so that these specified in
    // the page master are also effective. Note that these values (if specified)
    // always override values in page contexts.
    ["counter-reset", "counter-increment"].forEach((name) => {
      if (pageMasterStyle[name]) {
        style[name] = pageMasterStyle[name];
      }
    });
    const pageMasterInstance = newPageMaster.createInstance(
      this.rootPageBoxInstance,
    ) as PageMaster.PageMasterInstance;

    // Do the same initialization as in Ops.StyleInstance.prototype.init
    pageMasterInstance.applyCascadeAndInit(
      this.cascadeInstance,
      this.docElementStyle,
    );
    pageMasterInstance.resolveAutoSizing(this.context);
    return pageMasterInstance;
  }
}

export class CheckPageTypeAction extends CssCascade.ChainedAction {
  constructor(public readonly pageType: string) {
    super();
  }

  override apply(cascadeInstance: CssCascade.CascadeInstance): void {
    if (cascadeInstance.currentPageType === this.pageType) {
      this.chained.apply(cascadeInstance);
    }
  }

  override getPriority(): number {
    return 3;
  }

  override makePrimary(cascade: CssCascade.Cascade): boolean {
    if (this.chained) {
      cascade.insertInTable(cascade.pagetypes, this.pageType, this.chained);
    }
    return true;
  }
}

export class IsFirstPageAction extends CssCascade.ChainedAction {
  constructor(public readonly scope: Exprs.LexicalScope) {
    super();
  }

  override apply(cascadeInstance: CssCascade.CascadeInstance): void {
    const pageNumber = new Exprs.Named(this.scope, "page-number");
    if (pageNumber.evaluate(cascadeInstance.context) === 1) {
      this.chained.apply(cascadeInstance);
    }
  }

  override getPriority(): number {
    return 2;
  }
}

export class IsBlankPageAction extends CssCascade.ChainedAction {
  constructor(public readonly scope: Exprs.LexicalScope) {
    super();
  }

  override apply(cascadeInstance: CssCascade.CascadeInstance): void {
    const blankPage = new Exprs.Named(this.scope, "blank-page");
    if (blankPage.evaluate(cascadeInstance.context)) {
      this.chained.apply(cascadeInstance);
    }
  }

  override getPriority(): number {
    return 2;
  }
}

export class IsLeftPageAction extends CssCascade.ChainedAction {
  constructor(public readonly scope: Exprs.LexicalScope) {
    super();
  }

  override apply(cascadeInstance: CssCascade.CascadeInstance): void {
    const leftPage = new Exprs.Named(this.scope, "left-page");
    if (leftPage.evaluate(cascadeInstance.context)) {
      this.chained.apply(cascadeInstance);
    }
  }

  override getPriority(): number {
    return 1;
  }
}

export class IsRightPageAction extends CssCascade.ChainedAction {
  constructor(public readonly scope: Exprs.LexicalScope) {
    super();
  }

  override apply(cascadeInstance: CssCascade.CascadeInstance): void {
    const rightPage = new Exprs.Named(this.scope, "right-page");
    if (rightPage.evaluate(cascadeInstance.context)) {
      this.chained.apply(cascadeInstance);
    }
  }

  override getPriority(): number {
    return 1;
  }
}

export class IsRectoPageAction extends CssCascade.ChainedAction {
  constructor(public readonly scope: Exprs.LexicalScope) {
    super();
  }

  override apply(cascadeInstance: CssCascade.CascadeInstance): void {
    const rectoPage = new Exprs.Named(this.scope, "recto-page");
    if (rectoPage.evaluate(cascadeInstance.context)) {
      this.chained.apply(cascadeInstance);
    }
  }

  override getPriority(): number {
    return 1;
  }
}

export class IsVersoPageAction extends CssCascade.ChainedAction {
  constructor(public readonly scope: Exprs.LexicalScope) {
    super();
  }

  override apply(cascadeInstance: CssCascade.CascadeInstance): void {
    const versoPage = new Exprs.Named(this.scope, "verso-page");
    if (versoPage.evaluate(cascadeInstance.context)) {
      this.chained.apply(cascadeInstance);
    }
  }

  override getPriority(): number {
    return 1;
  }
}

export class IsNthPageAction extends CssCascade.IsNthAction {
  constructor(
    public readonly scope: Exprs.LexicalScope,
    public readonly a: number,
    public readonly b: number,
  ) {
    super(a, b);
  }

  override apply(cascadeInstance: CssCascade.CascadeInstance): void {
    const styleInstance: any /* Ops.StyleInstance */ = cascadeInstance.context;
    let pageNumber = styleInstance.layoutPositionAtPageStart.page;
    if (styleInstance.blankPageAtStart) {
      pageNumber--;
    }
    if (pageNumber && this.matchANPlusB(pageNumber)) {
      this.chained.apply(cascadeInstance);
    }
  }

  override getPriority(): number {
    return 2;
  }
}

/**
 * Action applying an at-page rule
 */
export class ApplyPageRuleAction extends CssCascade.ApplyRuleAction {
  constructor(style: CssCascade.ElementStyle, specificity: number) {
    super(style, specificity, null, null, null);
  }

  override apply(cascadeInstance: CssCascade.CascadeInstance): void {
    mergeInPageRule(
      cascadeInstance.context,
      cascadeInstance.currentStyle,
      this.style,
      this.specificity,
      cascadeInstance,
    );
  }
}

/**
 * Merge page styles, including styles specified on page-margin boxes,
 * considering specificity. Intended to be used in place of
 * CssCascade.mergeIn, which is for element styles.
 */
export function mergeInPageRule(
  context: Exprs.Context,
  target: CssCascade.ElementStyle,
  style: CssCascade.ElementStyle,
  specificity: number,
  cascadeInstance: CssCascade.CascadeInstance,
): void {
  CssCascade.mergeIn(context, target, style, specificity, null, null, null);
  const marginBoxes = style[marginBoxesKey];
  if (marginBoxes) {
    const targetMap = CssCascade.getMutableStyleMap(target, marginBoxesKey);
    for (const boxName in marginBoxes) {
      if (marginBoxes.hasOwnProperty(boxName)) {
        let targetBox = targetMap[boxName];
        if (!targetBox) {
          targetBox = {} as CssCascade.ElementStyle;
          targetMap[boxName] = targetBox;
        }
        CssCascade.mergeIn(
          context,
          targetBox,
          marginBoxes[boxName],
          specificity,
          null,
          null,
          null,
        );
      }
    }
  }
}

/**
 * ParserHandler for `@page` rules. It handles properties specified with page
 * contexts. It also does basic cascading (which can be done without information
 * other than the page rules themselves) and stores the result in `pageProps`
 * object as a map from page selectors to sets of properties. This result is
 * later used for adding `@page` rules to the real DOM, which are then used by
 * the PDF renderer (Chromium) to determine page sizes.
 */
export class PageParserHandler
  extends CssCascade.CascadeParserHandler
  implements CssValidator.PropertyReceiver
{
  private currentPageSelectors: {
    selectors: string[] | null;
    specificity: number;
  }[] = [];
  private currentNamedPageSelector: string = "";
  private currentPseudoPageClassSelectors: string[] = [];

  constructor(
    scope: Exprs.LexicalScope,
    owner: CssParser.DispatchParserHandler,
    parent: CssCascade.CascadeParserHandler,
    validatorSet: CssValidator.ValidatorSet,
    private readonly pageProps: { [key: string]: CssCascade.ElementStyle },
  ) {
    super(scope, owner, parent?.condition, parent, null, validatorSet, false);
  }

  override startPageRule(): void {
    this.startSelectorRule();
  }

  override tagSelector(ns: string | null, name: string | null): void {
    Asserts.assert(name);
    this.currentNamedPageSelector = name;
    if (name) {
      this.chain.push(new CheckPageTypeAction(name));
      this.specificity += 65536;
    }
  }

  override pseudoclassSelector(
    name: string,
    params: (number | string)[],
  ): void {
    name = name.toLowerCase();
    if (params) {
      switch (name) {
        case "nth":
          {
            const [a, b] = params as number[];
            this.currentPseudoPageClassSelectors.push(
              `:${name}(${a}n${b < 0 ? b : "+" + b})`,
            );
            this.chain.push(new IsNthPageAction(this.scope, a, b));
            this.specificity += 256;
          }
          break;
        default:
          this.reportAndSkip(
            `E_INVALID_PAGE_SELECTOR :${name}(${params.join("")})`,
          );
          break;
      }
    } else {
      this.currentPseudoPageClassSelectors.push(`:${name}`);
      switch (name) {
        case "first":
          this.chain.push(new IsFirstPageAction(this.scope));
          this.specificity += 256;
          break;
        case "blank":
          this.chain.push(new IsBlankPageAction(this.scope));
          this.specificity += 256;
          break;
        case "left":
          this.chain.push(new IsLeftPageAction(this.scope));
          this.specificity += 1;
          break;
        case "right":
          this.chain.push(new IsRightPageAction(this.scope));
          this.specificity += 1;
          break;
        case "recto":
          this.chain.push(new IsRectoPageAction(this.scope));
          this.specificity += 1;
          break;
        case "verso":
          this.chain.push(new IsVersoPageAction(this.scope));
          this.specificity += 1;
          break;
        default:
          this.reportAndSkip(`E_INVALID_PAGE_SELECTOR :${name}`);
          break;
      }
    }
  }

  /**
   * Save currently processed selector and reset variables.
   */
  private finishSelector() {
    let selectors: string[];
    if (
      !this.currentNamedPageSelector &&
      !this.currentPseudoPageClassSelectors.length
    ) {
      selectors = null;
    } else {
      selectors = [this.currentNamedPageSelector].concat(
        this.currentPseudoPageClassSelectors.sort(),
      );
    }
    this.currentPageSelectors.push({
      selectors,
      specificity: this.specificity,
    });
    this.currentNamedPageSelector = "";
    this.currentPseudoPageClassSelectors = [];
  }

  override nextSelector(): void {
    this.finishSelector();
    super.nextSelector();
  }

  override startRuleBody(): void {
    this.finishSelector();
    super.startRuleBody();
  }

  override simpleProperty(name: string, value: Css.Val, important): void {
    // we limit 'bleed' and 'marks' to be effective only when specified without
    // page selectors
    if (
      (name === "bleed" || name === "marks") &&
      !this.currentPageSelectors.some((s) => s.selectors === null)
    ) {
      return;
    }
    super.simpleProperty(name, value, important);
    const cascVal = CssCascade.getProp(this.elementStyle, name);
    const pageProps = this.pageProps;
    if (name === "bleed" || name === "marks") {
      if (!pageProps[""]) {
        pageProps[""] = {} as CssCascade.ElementStyle;
      }

      // we can simply overwrite without considering specificity
      // since 'bleed' and 'marks' always come from a page rule without page
      // selectors.
      Object.keys(pageProps).forEach((selector) => {
        CssCascade.setProp(pageProps[selector], name, cascVal);
      });
    } else if (name === "size") {
      const noPageSelectorProps = pageProps[""];
      this.currentPageSelectors.forEach((s) => {
        // update specificity to reflect the specificity of the selector
        const result = new CssCascade.CascadeValue(
          cascVal.value,
          cascVal.priority + s.specificity,
        );
        const selector = s.selectors ? s.selectors.join("") : "";
        let props = pageProps[selector];
        if (!props) {
          // since no properties for this selector have been stored before,
          // we can simply set the 'size', 'bleed' and 'marks' properties.
          props = pageProps[selector] = {} as CssCascade.ElementStyle;
          CssCascade.setProp(props, name, result);
          if (noPageSelectorProps) {
            ["bleed", "marks"].forEach((n) => {
              if (noPageSelectorProps[n]) {
                CssCascade.setProp(
                  props,
                  n,
                  noPageSelectorProps[n] as CssCascade.CascadeValue,
                );
              }
            });
          }
        } else {
          // consider specificity when setting 'size' property.
          // we don't have to set 'bleed' and 'marks' since they should have
          // been already updated.
          CssCascade.setPropCascadeValue(props, name, result);
        }
      });
    }
  }

  override insertNonPrimary(action: CssCascade.CascadeAction): void {
    // We represent page rules without selectors by *, though it is illegal in
    // CSS
    this.cascade.insertInTable(this.cascade.pagetypes, "*", action);
  }

  override makeApplyRuleAction(
    specificity: number,
  ): CssCascade.ApplyRuleAction {
    return new ApplyPageRuleAction(this.elementStyle, specificity);
  }

  override startPageMarginBoxRule(name: string): void {
    const marginBoxMap = CssCascade.getMutableStyleMap(
      this.elementStyle,
      marginBoxesKey,
    );
    let boxStyle = marginBoxMap[name];
    if (!boxStyle) {
      boxStyle = {} as CssCascade.ElementStyle;
      marginBoxMap[name] = boxStyle;
    }
    const handler = new PageMarginBoxParserHandler(
      this.scope,
      this.owner,
      this.validatorSet,
      boxStyle,
    );
    this.owner.pushHandler(handler);
  }
}

/**
 * Parser handler for a page-margin box rule.
 */
export class PageMarginBoxParserHandler
  extends CssParser.SlaveParserHandler
  implements CssValidator.PropertyReceiver
{
  constructor(
    scope: Exprs.LexicalScope,
    owner: CssParser.DispatchParserHandler,
    public readonly validatorSet: CssValidator.ValidatorSet,
    public readonly boxStyle: CssCascade.ElementStyle,
  ) {
    super(scope, owner, false);
  }

  override property(name: string, value: Css.Val, important: boolean): void {
    this.validatorSet.validatePropertyAndHandleShorthand(
      name,
      value,
      important,
      this,
    );
  }

  /** @override */
  invalidPropertyValue(name: string, value: Css.Val): void {
    this.report(`E_INVALID_PROPERTY_VALUE ${name}: ${value.toString()}`);
  }

  /** @override */
  unknownProperty(name: string, value: Css.Val): void {
    this.report(`E_INVALID_PROPERTY ${name}: ${value.toString()}`);
  }

  /** @override */
  simpleProperty(name: string, value: Css.Val, important): void {
    const specificity = important
      ? this.getImportantSpecificity()
      : this.getBaseSpecificity();
    const cascval = new CssCascade.CascadeValue(value, specificity);
    CssCascade.setProp(this.boxStyle, name, cascval);
  }
}
