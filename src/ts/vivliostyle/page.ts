/**
 * Copyright 2015 Trim-marks Inc.
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
 * @fileoverview \@page rule (CSS Paged Media) support
 */
import * as css from "../adapt/css";
import * as csscasc from "../adapt/csscasc";
import * as cssparse from "../adapt/cssparse";
import * as cssvalid from "../adapt/cssvalid";
import * as exprs from "../adapt/expr";
import * as pm from "../adapt/pm";
import * as vtree from "../adapt/vtree";
import * as constants from "./constants";
import * as sizing from "./sizing";

import * as base from "../adapt/base";
import * as asserts from "./asserts";

/**
 * Resolve page progression direction from writing-mode and direction.
 */
export const resolvePageProgression = (
  style: csscasc.ElementStyle
): constants.PageProgression => {
  let writingMode = style["writing-mode"];
  writingMode = writingMode && writingMode.value;
  let direction = style["direction"];
  direction = direction && direction.value;
  if (
    writingMode === css.ident.vertical_lr ||
    (writingMode !== css.ident.vertical_rl && direction !== css.ident.rtl)
  ) {
    return constants.PageProgression.LTR;
  } else {
    return constants.PageProgression.RTL;
  }
};
export type PageSize = {
  width: css.Numeric;
  height: css.Numeric;
};

/**
 * Named page sizes.
 */
export const pageSizes: { [key: string]: PageSize } = {
  a5: { width: new css.Numeric(148, "mm"), height: new css.Numeric(210, "mm") },
  a4: { width: new css.Numeric(210, "mm"), height: new css.Numeric(297, "mm") },
  a3: { width: new css.Numeric(297, "mm"), height: new css.Numeric(420, "mm") },
  b5: { width: new css.Numeric(176, "mm"), height: new css.Numeric(250, "mm") },
  b4: { width: new css.Numeric(250, "mm"), height: new css.Numeric(353, "mm") },
  "jis-b5": {
    width: new css.Numeric(182, "mm"),
    height: new css.Numeric(257, "mm")
  },
  "jis-b4": {
    width: new css.Numeric(257, "mm"),
    height: new css.Numeric(364, "mm")
  },
  letter: {
    width: new css.Numeric(8.5, "in"),
    height: new css.Numeric(11, "in")
  },
  legal: {
    width: new css.Numeric(8.5, "in"),
    height: new css.Numeric(14, "in")
  },
  ledger: {
    width: new css.Numeric(11, "in"),
    height: new css.Numeric(17, "in")
  }
};

/**
 * Default value for line width of printer marks
 */
export const defaultPrinterMarkLineWidth: css.Numeric = new css.Numeric(
  0.24,
  "pt"
);

/**
 * Default value for distance between an edge of the page and printer marks
 */
export const defaultPrinterMarkOffset: css.Numeric = new css.Numeric(3, "mm");

/**
 * Default value for line length of the (shorter) line of a crop mark and the
 * shorter line of a cross mark
 */
export const defaultPrinterMarkLineLength: css.Numeric = new css.Numeric(
  10,
  "mm"
);

/**
 * Default value for bleed offset (= defaultPrinterMarkOffset +
 * defaultPrinterMarkLineLength)
 */
export const defaultBleedOffset: css.Numeric = new css.Numeric(3 + 10, "mm");

export type PageSizeAndBleed = {
  width: css.Numeric;
  height: css.Numeric;
  bleed: css.Numeric;
  bleedOffset: css.Numeric;
};

export const resolvePageSizeAndBleed = (style: {
  [key: string]: csscasc.CascadeValue;
}): PageSizeAndBleed => {
  // default value (fit to viewport, no bleed)
  const pageSizeAndBleed: PageSizeAndBleed = {
    width: css.fullWidth,
    height: css.fullHeight,
    bleed: css.numericZero,
    bleedOffset: css.numericZero
  };
  const size: csscasc.CascadeValue = style["size"];

  if (!size || size.value === css.ident.auto) {
    // if size is auto, fit to the viewport (use default value)
  } else {
    /** !type {!css.Val} */
    const value = size.value;
    let val1;
    let val2;
    if (value.isSpaceList()) {
      val1 = (value as css.SpaceList).values[0];
      val2 = (value as css.SpaceList).values[1];
    } else {
      val1 = value;
      val2 = null;
    }
    if (val1.isNumeric()) {
      // <length>{1,2}
      pageSizeAndBleed.width = val1;
      pageSizeAndBleed.height = val2 || val1;
    } else {
      // <page-size> || [ portrait | landscape ]
      const s = pageSizes[(val1 as css.Ident).name.toLowerCase()];
      if (!s) {
        // portrait or landscape is specified alone. fallback to fit to the
        // viewport (use default value)
      } else if (val2 && val2 === css.ident.landscape) {
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
  const marks = style["marks"];
  if (marks && marks.value !== css.ident.none) {
    pageSizeAndBleed.bleedOffset = defaultBleedOffset;
  }
  const bleed = style["bleed"];
  if (!bleed || bleed.value === css.ident.auto) {
    // "('auto' value) Computes to 6pt if marks has crop and to zero
    // otherwise." https://drafts.csswg.org/css-page/#valdef-page-bleed-auto
    if (marks) {
      let hasCrop = false;
      if (marks.value.isSpaceList()) {
        hasCrop = (marks.value as css.SpaceList).values.some(
          v => v === css.ident.crop
        );
      } else {
        hasCrop = marks.value === css.ident.crop;
      }
      if (hasCrop) {
        pageSizeAndBleed.bleed = new css.Numeric(6, "pt");
      }
    }
  } else if (bleed.value && bleed.value.isNumeric()) {
    pageSizeAndBleed.bleed = bleed.value as css.Numeric;
  }
  return pageSizeAndBleed;
};

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
export const evaluatePageSizeAndBleed = (
  pageSizeAndBleed: PageSizeAndBleed,
  context: exprs.Context
): EvaluatedPageSizeAndBleed => {
  const evaluated = {} as EvaluatedPageSizeAndBleed;
  const bleed =
    pageSizeAndBleed.bleed.num *
    context.queryUnitSize(pageSizeAndBleed.bleed.unit, false);
  const bleedOffset =
    pageSizeAndBleed.bleedOffset.num *
    context.queryUnitSize(pageSizeAndBleed.bleedOffset.unit, false);
  const cropOffset = bleed + bleedOffset;
  const width = pageSizeAndBleed.width;
  if (width === css.fullWidth) {
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
  if (height === css.fullHeight) {
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
};

/**
 * Create an 'svg' element for a printer mark.
 */
export const createPrinterMarkSvg = (
  doc: Document,
  width: number,
  height: number
): Element => {
  const mark = doc.createElementNS(base.NS.SVG, "svg");
  mark.setAttribute("width", width);
  mark.setAttribute("height", height);
  mark.style.position = "absolute";
  return mark;
};

/**
 * Create an SVG element for a printer mark line.
 * @param elementType Specifies which type of element to create. Default value
 *     is "polyline".
 */
export const createPrinterMarkElement = (
  doc: Document,
  lineWidth: number,
  elementType?: string
): Element => {
  elementType = elementType || "polyline";
  const line = doc.createElementNS(base.NS.SVG, elementType);
  line.setAttribute("stroke", "black");
  line.setAttribute("stroke-width", lineWidth);
  line.setAttribute("fill", "none");
  return line;
};

/**
 * Position of a corner mark
 * @enum {string}
 */
export enum CornerMarkPosition {
  TOP_LEFT = "top left",
  TOP_RIGHT = "top right",
  BOTTOM_LEFT = "bottom left",
  BOTTOM_RIGHT = "bottom right"
}

/**
 * Create a corner mark.
 */
export const createCornerMark = (
  doc: Document,
  position: CornerMarkPosition,
  lineWidth: number,
  cropMarkLineLength: number,
  bleed: number,
  offset: number
): Element => {
  let bleedMarkLineLength = cropMarkLineLength;

  // bleed mark line should be longer than bleed + 2mm
  if (bleedMarkLineLength <= bleed + 2 * exprs.defaultUnitSizes["mm"]) {
    bleedMarkLineLength = bleed + cropMarkLineLength / 2;
  }
  const maxLineLength = Math.max(cropMarkLineLength, bleedMarkLineLength);
  const svgWidth = bleed + maxLineLength + lineWidth / 2;
  const mark = createPrinterMarkSvg(doc, svgWidth, svgWidth);
  let points1 = [
    [0, bleed + cropMarkLineLength],
    [cropMarkLineLength, bleed + cropMarkLineLength],
    [cropMarkLineLength, bleed + cropMarkLineLength - bleedMarkLineLength]
  ];

  // reflect with respect to y=x
  let points2 = points1.map(p => [p[1], p[0]]);
  if (
    position === CornerMarkPosition.TOP_RIGHT ||
    position === CornerMarkPosition.BOTTOM_RIGHT
  ) {
    // reflect with respect to a vertical axis
    points1 = points1.map(p => [bleed + maxLineLength - p[0], p[1]]);
    points2 = points2.map(p => [bleed + maxLineLength - p[0], p[1]]);
  }
  if (
    position === CornerMarkPosition.BOTTOM_LEFT ||
    position === CornerMarkPosition.BOTTOM_RIGHT
  ) {
    // reflect with respect to a vertical axis
    points1 = points1.map(p => [p[0], bleed + maxLineLength - p[1]]);
    points2 = points2.map(p => [p[0], bleed + maxLineLength - p[1]]);
  }
  const line1 = createPrinterMarkElement(doc, lineWidth);
  line1.setAttribute("points", points1.map(p => p.join(",")).join(" "));
  mark.appendChild(line1);
  const line2 = createPrinterMarkElement(doc, lineWidth);
  line2.setAttribute("points", points2.map(p => p.join(",")).join(" "));
  mark.appendChild(line2);
  position.split(" ").forEach(side => {
    (mark as any).style[side] = `${offset}px`;
  });
  return mark;
};

/**
 * Position of a cross mark
 * @enum {string}
 */
export enum CrossMarkPosition {
  TOP = "top",
  BOTTOM = "bottom",
  LEFT = "left",
  RIGHT = "right"
}

/**
 * Create a cross mark.
 */
export const createCrossMark = (
  doc: Document,
  position: CrossMarkPosition,
  lineWidth: number,
  lineLength: number,
  offset: number
): Element => {
  const longLineLength = lineLength * 2;
  let width;
  let height;
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
  const horizontalLine = createPrinterMarkElement(doc, lineWidth);
  horizontalLine.setAttribute(
    "points",
    `0,${height / 2} ${width},${height / 2}`
  );
  mark.appendChild(horizontalLine);
  const verticalLine = createPrinterMarkElement(doc, lineWidth);
  verticalLine.setAttribute("points", `${width / 2},0 ${width / 2},${height}`);
  mark.appendChild(verticalLine);
  const circle = createPrinterMarkElement(doc, lineWidth, "circle");
  circle.setAttribute("cx", width / 2);
  circle.setAttribute("cy", height / 2);
  circle.setAttribute("r", lineLength / 4);
  mark.appendChild(circle);
  let opposite;
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
  Object.keys(CrossMarkPosition).forEach(key => {
    const side = CrossMarkPosition[key];
    if (side === position) {
      (mark as any).style[side] = `${offset}px`;
    } else if (side !== opposite) {
      (mark as any).style[side] = "0";
      (mark as any).style[`margin-${side}`] = "auto";
    }
  });
  return mark;
};

/**
 * Add printer marks to the page.
 */
export const addPrinterMarks = (
  cascadedPageStyle: csscasc.ElementStyle,
  evaluatedPageSizeAndBleed: EvaluatedPageSizeAndBleed,
  page: vtree.Page,
  context: exprs.Context
) => {
  let crop = false;
  let cross = false;
  const marks = cascadedPageStyle["marks"];
  if (marks) {
    const value = marks.value;
    if (value.isSpaceList()) {
      value.values.forEach(v => {
        if (v === css.ident.crop) {
          crop = true;
        } else if (v === css.ident.cross) {
          cross = true;
        }
      });
    } else if (value === css.ident.crop) {
      crop = true;
    } else if (value === css.ident.cross) {
      cross = true;
    }
  }
  if (!crop && !cross) {
    return;
  }
  const container = page.container;
  const doc = container.ownerDocument as Document;
  asserts.assert(doc);
  const bleed = evaluatedPageSizeAndBleed.bleed;
  const lineWidth = css.toNumber(defaultPrinterMarkLineWidth, context);
  const printerMarkOffset = css.toNumber(defaultPrinterMarkOffset, context);
  const lineLength = css.toNumber(defaultPrinterMarkLineLength, context);

  // corner marks
  if (crop) {
    Object.keys(CornerMarkPosition).forEach(key => {
      const position = CornerMarkPosition[key];
      const mark = createCornerMark(
        doc,
        position,
        lineWidth,
        lineLength,
        bleed,
        printerMarkOffset
      );
      container.appendChild(mark);
    });
  }

  // cross marks
  if (cross) {
    Object.keys(CrossMarkPosition).forEach(key => {
      const position = CrossMarkPosition[key];
      const mark = createCrossMark(
        doc,
        position,
        lineWidth,
        lineLength,
        printerMarkOffset
      );
      container.appendChild(mark);
    });
  }
};

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
    "inline-end"
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
    "outline-color": true
  };
  sides.forEach(side => {
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
  END = "end"
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
    isInRightColumn: true,
    positionAlongVariableDimension: null
  },
  "top-left": {
    order: 2,
    isInTopRow: true,
    isInBottomRow: false,
    isInLeftColumn: false,
    isInRightColumn: false,
    positionAlongVariableDimension:
      MarginBoxPositionAlongVariableDimension.START
  },
  "top-center": {
    order: 3,
    isInTopRow: true,
    isInBottomRow: false,
    isInLeftColumn: false,
    isInRightColumn: false,
    positionAlongVariableDimension:
      MarginBoxPositionAlongVariableDimension.CENTER
  },
  "top-right": {
    order: 4,
    isInTopRow: true,
    isInBottomRow: false,
    isInLeftColumn: false,
    isInRightColumn: false,
    positionAlongVariableDimension: MarginBoxPositionAlongVariableDimension.END
  },
  "top-right-corner": {
    order: 5,
    isInTopRow: true,
    isInBottomRow: false,
    isInLeftColumn: false,
    isInRightColumn: true,
    positionAlongVariableDimension: null
  },
  "right-top": {
    order: 6,
    isInTopRow: false,
    isInBottomRow: false,
    isInLeftColumn: false,
    isInRightColumn: true,
    positionAlongVariableDimension:
      MarginBoxPositionAlongVariableDimension.START
  },
  "right-middle": {
    order: 7,
    isInTopRow: false,
    isInBottomRow: false,
    isInLeftColumn: false,
    isInRightColumn: true,
    positionAlongVariableDimension:
      MarginBoxPositionAlongVariableDimension.CENTER
  },
  "right-bottom": {
    order: 8,
    isInTopRow: false,
    isInBottomRow: false,
    isInLeftColumn: false,
    isInRightColumn: true,
    positionAlongVariableDimension: MarginBoxPositionAlongVariableDimension.END
  },
  "bottom-right-corner": {
    order: 9,
    isInTopRow: false,
    isInBottomRow: true,
    isInLeftColumn: false,
    isInRightColumn: true,
    positionAlongVariableDimension: null
  },
  "bottom-right": {
    order: 10,
    isInTopRow: false,
    isInBottomRow: true,
    isInLeftColumn: false,
    isInRightColumn: false,
    positionAlongVariableDimension: MarginBoxPositionAlongVariableDimension.END
  },
  "bottom-center": {
    order: 11,
    isInTopRow: false,
    isInBottomRow: true,
    isInLeftColumn: false,
    isInRightColumn: false,
    positionAlongVariableDimension:
      MarginBoxPositionAlongVariableDimension.CENTER
  },
  "bottom-left": {
    order: 12,
    isInTopRow: false,
    isInBottomRow: true,
    isInLeftColumn: false,
    isInRightColumn: false,
    positionAlongVariableDimension:
      MarginBoxPositionAlongVariableDimension.START
  },
  "bottom-left-corner": {
    order: 13,
    isInTopRow: false,
    isInBottomRow: true,
    isInLeftColumn: true,
    isInRightColumn: false,
    positionAlongVariableDimension: null
  },
  "left-bottom": {
    order: 14,
    isInTopRow: false,
    isInBottomRow: false,
    isInLeftColumn: true,
    isInRightColumn: false,
    positionAlongVariableDimension: MarginBoxPositionAlongVariableDimension.END
  },
  "left-middle": {
    order: 15,
    isInTopRow: false,
    isInBottomRow: false,
    isInLeftColumn: true,
    isInRightColumn: false,
    positionAlongVariableDimension:
      MarginBoxPositionAlongVariableDimension.CENTER
  },
  "left-top": {
    order: 16,
    isInTopRow: false,
    isInBottomRow: false,
    isInLeftColumn: true,
    isInRightColumn: false,
    positionAlongVariableDimension:
      MarginBoxPositionAlongVariableDimension.START
  }
};

/**
 * Names for page-margin boxes order in the default painting order.
 */
export const pageMarginBoxNames: string[] = (() => {
  const boxes = pageMarginBoxes;
  return Object.keys(boxes).sort((a, b) => boxes[a].order - boxes[b].order);
})();

/**
 * Indicates that the page master is generated for @page rules.
 */
export const pageRuleMasterPseudoName = "vivliostyle-page-rule-master";

/**
 * Key for properties in margin contexts.
 * Styles in margin contexts are stored in pageStyle["_marginBoxes"][(margin
 * box's name)].
 */
export const marginBoxesKey: string = "_marginBoxes";

/**
 * Represent a page master generated for @page rules
 * @param style Cascaded style for @page rules
 */
export class PageRuleMaster extends pm.PageMaster<PageRuleMasterInstance> {
  private bodyPartitionKey: any;
  private pageMarginBoxes: any = {} as {
    [key: string]: PageMarginBoxPartition;
  };

  constructor(
    scope: exprs.LexicalScope,
    parent: pm.RootPageBox,
    style: csscasc.ElementStyle
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
  createPageMarginBoxes(style: csscasc.ElementStyle) {
    const marginBoxesMap = style[marginBoxesKey];
    if (marginBoxesMap) {
      const self = this;
      pageMarginBoxNames.forEach(name => {
        if (marginBoxesMap[name]) {
          self.pageMarginBoxes[name] = new PageMarginBoxPartition(
            self.scope,
            self,
            name,
            style
          );
        }
      });
    }
  }

  /**
   * Transfer cascaded style for @page rules to 'specified' style of this
   * PageBox
   */
  private applySpecified(style: csscasc.ElementStyle, pageSize: PageSize) {
    this.specified["position"] = new csscasc.CascadeValue(
      css.ident.relative,
      0
    );
    this.specified["width"] = new csscasc.CascadeValue(pageSize.width, 0);
    this.specified["height"] = new csscasc.CascadeValue(pageSize.height, 0);
    for (const name in style) {
      if (!propertiesAppliedToPartition[name] && name !== "background-clip") {
        this.specified[name] = style[name];
      }
    }
  }

  /**
   * @override
   */
  createInstance(parentInstance): PageRuleMasterInstance {
    return new PageRuleMasterInstance(parentInstance, this);
  }
}

/**
 * Represent a partition placed in a PageRuleMaster
 * @param style Cascaded style for @page rules
 */
export class PageRulePartition extends pm.Partition<PageRulePartitionInstance> {
  constructor(
    scope: exprs.LexicalScope,
    parent: PageRuleMaster,
    style: csscasc.ElementStyle,
    public readonly pageSize: PageSize
  ) {
    super(scope, null, null, [], parent);
    this.specified["z-index"] = new csscasc.CascadeValue(new css.Int(0), 0);
    this.applySpecified(style);
  }

  /**
   * Transfer cascaded style for @page rules to 'specified' style of this
   * PageBox
   */
  private applySpecified(style: csscasc.ElementStyle) {
    this.specified["flow-from"] = new csscasc.CascadeValue(
      css.getName("body"),
      0
    );

    // Use absolute positioning so that this partition's margins don't collapse
    // with its parent's margins
    this.specified["position"] = new csscasc.CascadeValue(
      css.ident.absolute,
      0
    );
    this.specified["overflow"] = new csscasc.CascadeValue(css.ident.visible, 0);
    for (const prop in propertiesAppliedToPartition) {
      if (propertiesAppliedToPartition.hasOwnProperty(prop)) {
        this.specified[prop] = style[prop];
      }
    }
  }

  /**
   * @override
   */
  createInstance(parentInstance): pm.PageBoxInstance {
    return new PageRulePartitionInstance(parentInstance, this);
  }
}

/**
 * Represent a partition for a page-margin box
 */
export class PageMarginBoxPartition extends pm.Partition<
  PageMarginBoxPartitionInstance
> {
  constructor(
    scope: exprs.LexicalScope,
    parent: PageRuleMaster,
    public readonly marginBoxName: string,
    style: csscasc.ElementStyle
  ) {
    super(scope, null, null, [], parent);
    this.applySpecified(style);
  }

  /**
   * Transfer cascaded style for @page rules to 'specified' style of this
   * PageMarginBox
   */
  applySpecified(style: csscasc.ElementStyle) {
    const ownStyle = style[marginBoxesKey][
      this.marginBoxName
    ] as csscasc.ElementStyle;

    // Inherit properties in the page context to the page-margin context
    for (let prop in style) {
      let val = style[prop] as csscasc.CascadeValue;
      const ownVal = ownStyle[prop] as csscasc.CascadeValue;
      if (
        csscasc.inheritedProps[prop] ||
        (ownVal && ownVal.value === css.ident.inherit)
      ) {
        this.specified[prop] = val;
      }
    }
    for (let prop in ownStyle) {
      if (Object.prototype.hasOwnProperty.call(ownStyle, prop)) {
        let val = ownStyle[prop] as csscasc.CascadeValue;
        if (val && val.value !== css.ident.inherit) {
          this.specified[prop] = val;
        }
      }
    }
  }

  /**
   * @override
   */
  createInstance(parentInstance): pm.PageBoxInstance {
    return new PageMarginBoxPartitionInstance(parentInstance, this);
  }
}

//---------------------------- Instance --------------------------------
export type PageAreaDimension = {
  borderBoxWidth: exprs.Val;
  borderBoxHeight: exprs.Val;
  marginTop: exprs.Val;
  marginBottom: exprs.Val;
  marginLeft: exprs.Val;
  marginRight: exprs.Val;
};

export class PageRuleMasterInstance extends pm.PageMasterInstance<
  PageRuleMaster
> {
  pageAreaDimension: PageAreaDimension | null = null;
  pageMarginBoxInstances: {
    [key: string]: PageMarginBoxPartitionInstance;
  } = {};

  constructor(
    parentInstance: pm.PageBoxInstance,
    pageRuleMaster: PageRuleMaster
  ) {
    super(parentInstance, pageRuleMaster);
  }

  /**
   * @override
   */
  applyCascadeAndInit(cascade, docElementStyle) {
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

  /**
   * @override
   */
  initHorizontal() {
    const style = this.style;
    style["left"] = css.numericZero;
    style["margin-left"] = css.numericZero;
    style["border-left-width"] = css.numericZero;
    style["padding-left"] = css.numericZero;
    style["padding-right"] = css.numericZero;
    style["border-right-width"] = css.numericZero;
    style["margin-right"] = css.numericZero;
    style["right"] = css.numericZero;
  }

  /**
   * @override
   */
  initVertical() {
    const style = this.style;

    // Shift 1px to workaround Chrome printing bug
    style["top"] = new css.Numeric(-1, "px");
    style["margin-top"] = css.numericZero;
    style["border-top-width"] = css.numericZero;
    style["padding-top"] = css.numericZero;
    style["padding-bottom"] = css.numericZero;
    style["border-bottom-width"] = css.numericZero;
    style["margin-bottom"] = css.numericZero;
    style["bottom"] = css.numericZero;
  }

  setPageAreaDimension(dim: PageAreaDimension) {
    this.pageAreaDimension = dim;
    const style = this.style;
    style["width"] = new css.Expr(dim.borderBoxWidth);
    style["height"] = new css.Expr(dim.borderBoxHeight);
    style["padding-left"] = new css.Expr(dim.marginLeft);
    style["padding-right"] = new css.Expr(dim.marginRight);
    style["padding-top"] = new css.Expr(dim.marginTop);
    style["padding-bottom"] = new css.Expr(dim.marginBottom);
  }

  /**
   * @override
   */
  adjustPageLayout(context, page, clientLayout) {
    const marginBoxContainers = page.marginBoxes;
    const horizontalDimensions = {
      start: this.pageAreaDimension.marginLeft,
      end: this.pageAreaDimension.marginRight,
      extent: this.pageAreaDimension.borderBoxWidth
    };
    const verticalDimensions = {
      start: this.pageAreaDimension.marginTop,
      end: this.pageAreaDimension.marginBottom,
      extent: this.pageAreaDimension.borderBoxHeight
    };
    this.sizeMarginBoxesAlongVariableDimension(
      marginBoxContainers.top,
      true,
      horizontalDimensions,
      context,
      clientLayout
    );
    this.sizeMarginBoxesAlongVariableDimension(
      marginBoxContainers.bottom,
      true,
      horizontalDimensions,
      context,
      clientLayout
    );
    this.sizeMarginBoxesAlongVariableDimension(
      marginBoxContainers.left,
      false,
      verticalDimensions,
      context,
      clientLayout
    );
    this.sizeMarginBoxesAlongVariableDimension(
      marginBoxContainers.right,
      false,
      verticalDimensions,
      context,
      clientLayout
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
    marginBoxContainers: { [key: string]: vtree.Container },
    isHorizontal: boolean,
    dimensions: { start: exprs.Val; end: exprs.Val; extent: exprs.Val },
    context: exprs.Context,
    clientLayout: vtree.ClientLayout
  ) {
    const START = MarginBoxPositionAlongVariableDimension.START;
    const CENTER = MarginBoxPositionAlongVariableDimension.CENTER;
    const END = MarginBoxPositionAlongVariableDimension.END;

    // prepare parameters
    const scope = this.pageBox.scope;
    const containers: {
      [key in MarginBoxPositionAlongVariableDimension]?: vtree.Container
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
          clientLayout
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
      extent: dimensions.extent.evaluate(context) as number
    };
    let sizes = this.getSizesOfMarginBoxesAlongVariableDimension(
      boxParams,
      evaluatedDim.extent
    );
    let needRecalculate: boolean = false;

    // Check max-width/max-height
    const maxOuterSizes: {
      [key in MarginBoxPositionAlongVariableDimension]?: number
    } = {};
    Object.keys(containers).forEach(n => {
      const name = n as MarginBoxPositionAlongVariableDimension;
      const maxSize = pm.toExprAuto(
        scope,
        boxInstances[name].style[isHorizontal ? "max-width" : "max-height"],
        dimensions.extent
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
            evaluatedMaxSize
          ));
          maxOuterSizes[name] = p.getOuterSize();
          needRecalculate = true;
        }
      }
    });
    if (needRecalculate) {
      sizes = this.getSizesOfMarginBoxesAlongVariableDimension(
        boxParams,
        evaluatedDim.extent
      );
      needRecalculate = false;
      [START, CENTER, END].forEach(name => {
        sizes[name] = maxOuterSizes[name] || sizes[name];
      });
    }

    // Check min-width/min-height
    const minOuterSizes: {
      [key in MarginBoxPositionAlongVariableDimension]?: number
    } = {};
    Object.keys(containers).forEach(n => {
      const name = n as MarginBoxPositionAlongVariableDimension;
      const minSize = pm.toExprAuto(
        scope,
        boxInstances[name].style[isHorizontal ? "min-width" : "min-height"],
        dimensions.extent
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
            evaluatedMinSize
          ));
          minOuterSizes[name] = p.getOuterSize();
          needRecalculate = true;
        }
      }
    });
    if (needRecalculate) {
      sizes = this.getSizesOfMarginBoxesAlongVariableDimension(
        boxParams,
        evaluatedDim.extent
      );
      [START, CENTER, END].forEach(name => {
        sizes[name] = minOuterSizes[name] || sizes[name];
      });
    }

    // set sizes
    const endEdge = evaluatedDim.start + evaluatedDim.extent;
    const startEndSum =
      evaluatedDim.start + (evaluatedDim.start + evaluatedDim.extent);
    [START, CENTER, END].forEach(name => {
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
            outerSize - container.getInsetLeft() - container.getInsetRight()
          );
        } else {
          container.setVerticalPosition(
            offset,
            outerSize - container.getInsetTop() - container.getInsetBottom()
          );
        }
      }
    });
  }

  private getSizesOfMarginBoxesAlongVariableDimension(
    boxParams: {
      [key in MarginBoxPositionAlongVariableDimension]?: MarginBoxSizingParam;
    },
    availableSize: number
  ): { [key in MarginBoxPositionAlongVariableDimension]?: number } {
    const startBoxParam =
      boxParams[MarginBoxPositionAlongVariableDimension.START];
    const centerBoxParam =
      boxParams[MarginBoxPositionAlongVariableDimension.CENTER];
    const endBoxParam = boxParams[MarginBoxPositionAlongVariableDimension.END];
    const sizes: {
      [key in MarginBoxPositionAlongVariableDimension]?: number
    } = {};
    if (!centerBoxParam) {
      const startEndSizes = this.distributeAutoMarginBoxSizes(
        startBoxParam,
        endBoxParam,
        availableSize
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
      const params = [startBoxParam, endBoxParam].filter(p => p);
      const startEndBoxParam = params.length
        ? new MultipleBoxesMarginBoxSizingParam(params)
        : null;
      const centerSizes = this.distributeAutoMarginBoxSizes(
        centerBoxParam,
        startEndBoxParam,
        availableSize
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
    availableSize: number
  ): { xSize: number | null; ySize: number | null } {
    const result: { xSize: number | null; ySize: number | null } = {
      xSize: null,
      ySize: null
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

  /**
   * @override
   */
  prepareContainer(context, container, page, docFaces, clientLayout) {
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
  private size: { [key in sizing.Size]: number } | null = null;

  constructor(
    protected readonly container: vtree.Container,
    style: { [key: string]: css.Val },
    protected readonly isHorizontal: boolean,
    scope: exprs.LexicalScope,
    private readonly clientLayout: vtree.ClientLayout
  ) {
    this.hasAutoSize_ = !pm.toExprAuto(
      scope,
      style[isHorizontal ? "width" : "height"],
      new exprs.Numeric(scope, 0, "px")
    );
  }

  /**
   *  @override
   */
  hasAutoSize() {
    return this.hasAutoSize_;
  }

  private getSize(): { [key in sizing.Size]: number } {
    if (!this.size) {
      const sizes = this.isHorizontal
        ? [sizing.Size.MAX_CONTENT_WIDTH, sizing.Size.MIN_CONTENT_WIDTH]
        : [sizing.Size.MAX_CONTENT_HEIGHT, sizing.Size.MIN_CONTENT_HEIGHT];
      this.size = sizing.getSize(
        this.clientLayout,
        this.container.element,
        sizes
      );
    }
    return this.size;
  }

  /**
   * @override
   */
  getOuterMaxContentSize() {
    const size = this.getSize();
    if (this.isHorizontal) {
      return (
        this.container.getInsetLeft() +
        size[sizing.Size.MAX_CONTENT_WIDTH] +
        this.container.getInsetRight()
      );
    } else {
      return (
        this.container.getInsetTop() +
        size[sizing.Size.MAX_CONTENT_HEIGHT] +
        this.container.getInsetBottom()
      );
    }
  }

  /**
   * @override
   */
  getOuterMinContentSize() {
    const size = this.getSize();
    if (this.isHorizontal) {
      return (
        this.container.getInsetLeft() +
        size[sizing.Size.MIN_CONTENT_WIDTH] +
        this.container.getInsetRight()
      );
    } else {
      return (
        this.container.getInsetTop() +
        size[sizing.Size.MIN_CONTENT_HEIGHT] +
        this.container.getInsetBottom()
      );
    }
  }

  /**
   * @override
   */
  getOuterSize() {
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

  /**
   * @override
   */
  hasAutoSize() {
    return this.params.some(p => p.hasAutoSize());
  }

  /**
   *  @override
   */
  getOuterMaxContentSize() {
    const sizes = this.params.map(p => p.getOuterMaxContentSize());
    return Math.max.apply(null, sizes) * sizes.length;
  }

  /**
   *  @override
   */
  getOuterMinContentSize() {
    const sizes = this.params.map(p => p.getOuterMinContentSize());
    return Math.max.apply(null, sizes) * sizes.length;
  }

  /**
   *  @override
   */
  getOuterSize() {
    const sizes = this.params.map(p => p.getOuterSize());
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
  private fixedSize: any;

  constructor(
    container: vtree.Container,
    style: { [key: string]: css.Val },
    isHorizontal: boolean,
    scope: exprs.LexicalScope,
    clientLayout: vtree.ClientLayout,
    size: number
  ) {
    super(container, style, isHorizontal, scope, clientLayout);
    this.fixedSize = size;
  }

  /**
   * @override
   */
  hasAutoSize() {
    return false;
  }

  /**
   *  @override
   */
  getOuterMaxContentSize() {
    return this.getOuterSize();
  }

  /**
   *  @override
   */
  getOuterMinContentSize() {
    return this.getOuterSize();
  }

  /**
   * @override
   */
  getOuterSize() {
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

export class PageRulePartitionInstance extends pm.PartitionInstance<
  PageRulePartition
> {
  borderBoxWidth: exprs.Val = null;
  borderBoxHeight: exprs.Val = null;
  marginTop: exprs.Val = null;
  marginRight: exprs.Val = null;
  marginBottom: exprs.Val = null;
  marginLeft: exprs.Val = null;

  constructor(
    parentInstance: pm.PageBoxInstance,
    pageRulePartition: PageRulePartition
  ) {
    super(parentInstance, pageRulePartition);
  }

  /**
   * @override
   */
  applyCascadeAndInit(cascade, docElementStyle) {
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
      marginLeft: this.marginLeft
    });
  }

  /**
   * @override
   */
  initHorizontal() {
    const dim = this.resolvePageBoxDimensions({
      start: "left",
      end: "right",
      extent: "width"
    });
    this.borderBoxWidth = dim.borderBoxExtent;
    this.marginLeft = dim.marginStart;
    this.marginRight = dim.marginEnd;
  }

  /**
   * @override
   */
  initVertical() {
    const dim = this.resolvePageBoxDimensions({
      start: "top",
      end: "bottom",
      extent: "height"
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
    borderBoxExtent: exprs.Val;
    marginStart: exprs.Val;
    marginEnd: exprs.Val;
  } {
    const style = this.style;
    const pageSize = this.pageBox.pageSize;
    const scope = this.pageBox.scope;
    const startSide = names.start;
    const endSide = names.end;
    const extentName = names.extent;
    const pageExtent = pageSize[extentName].toExpr(scope, null);
    let extent = pm.toExprAuto(scope, style[extentName], pageExtent);
    let marginStart = pm.toExprAuto(
      scope,
      style[`margin-${startSide}`],
      pageExtent
    );
    let marginEnd = pm.toExprAuto(
      scope,
      style[`margin-${endSide}`],
      pageExtent
    );
    const paddingStart = pm.toExprZero(
      scope,
      style[`padding-${startSide}`],
      pageExtent
    );
    const paddingEnd = pm.toExprZero(
      scope,
      style[`padding-${endSide}`],
      pageExtent
    );
    const borderStartWidth = pm.toExprZeroBorder(
      scope,
      style[`border-${startSide}-width`],
      style[`border-${startSide}-style`],
      pageExtent
    );
    const borderEndWidth = pm.toExprZeroBorder(
      scope,
      style[`border-${endSide}-width`],
      style[`border-${endSide}-style`],
      pageExtent
    );
    let remains = exprs.sub(
      scope,
      pageExtent,
      exprs.add(
        scope,
        exprs.add(scope, borderStartWidth, paddingStart),
        exprs.add(scope, borderEndWidth, paddingEnd)
      )
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
      extent = exprs.sub(
        scope,
        remains,
        exprs.add(scope, marginStart, marginEnd)
      );
    } else {
      remains = exprs.sub(scope, remains, extent);
      if (!marginStart && !marginEnd) {
        marginStart = exprs.mul(scope, remains, new exprs.Const(scope, 0.5));
        marginEnd = marginStart;
      } else if (marginStart) {
        marginEnd = exprs.sub(scope, remains, marginStart);
      } else {
        marginStart = exprs.sub(scope, remains, marginEnd);
      }
    }

    // TODO over-constrained case
    // "if the values are over-constrained, instead of ignoring any margins, the
    // containing block is resized to coincide with the margin edges of the page
    // box." (CSS Paged Media http://dev.w3.org/csswg/css-page/#page-model)
    style[startSide] = new css.Expr(marginStart);
    style[endSide] = new css.Expr(marginEnd);
    style[`margin-${startSide}`] = css.numericZero;
    style[`margin-${endSide}`] = css.numericZero;
    style[`padding-${startSide}`] = new css.Expr(paddingStart);
    style[`padding-${endSide}`] = new css.Expr(paddingEnd);
    style[`border-${startSide}-width`] = new css.Expr(borderStartWidth);
    style[`border-${endSide}-width`] = new css.Expr(borderEndWidth);
    style[extentName] = new css.Expr(extent);
    style[`max-${extentName}`] = new css.Expr(extent);
    return {
      borderBoxExtent: exprs.sub(
        scope,
        pageExtent,
        exprs.add(scope, marginStart, marginEnd)
      ),
      marginStart,
      marginEnd
    };
  }

  /**
   * @override
   */
  prepareContainer(context, container, page, docFaces, clientLayout) {
    super.prepareContainer(context, container, page, docFaces, clientLayout);
    page.pageAreaElement = container.element as HTMLElement;
  }
}

export class PageMarginBoxPartitionInstance extends pm.PartitionInstance<
  PageMarginBoxPartition
> {
  boxInfo: PageMarginBoxInformation;
  suppressEmptyBoxGeneration: any = true;

  constructor(
    parentInstance: pm.PageBoxInstance,
    pageMarginBoxPartition: PageMarginBoxPartition
  ) {
    super(parentInstance, pageMarginBoxPartition);
    const name = pageMarginBoxPartition.marginBoxName;
    this.boxInfo = pageMarginBoxes[name];
    const pageRuleMasterInstance = parentInstance as PageRuleMasterInstance;
    pageRuleMasterInstance.pageMarginBoxInstances[name] = this;
  }

  /**
   * @override
   */
  prepareContainer(context, container, page, docFaces, clientLayout) {
    this.applyVerticalAlign(context, container.element);
    super.prepareContainer(context, container, page, docFaces, clientLayout);
  }

  private applyVerticalAlign(context: exprs.Context, element: Element) {
    base.setCSSProperty(element, "display", "flex");
    const verticalAlign: css.Val = this.getProp(context, "vertical-align");
    let flexAlign: string | null = null;
    if (verticalAlign === css.getName("middle")) {
      flexAlign = "center";
    } else if (verticalAlign === css.getName("top")) {
      flexAlign = "flex-start";
    } else if (verticalAlign === css.getName("bottom")) {
      flexAlign = "flex-end";
    }
    if (flexAlign) {
      base.setCSSProperty(
        element,
        "flex-flow",
        this.vertical ? "row" : "column"
      );
      base.setCSSProperty(element, "justify-content", flexAlign);
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
    dim: PageAreaDimension | null
  ) {
    const style = this.style;
    const scope = this.pageBox.scope;
    const startSide = names.start;
    const endSide = names.end;
    const extentName = names.extent;
    const isHorizontal = startSide === "left";
    const availableExtent = isHorizontal
      ? dim.borderBoxWidth
      : dim.borderBoxHeight;
    const extent = pm.toExprAuto(scope, style[extentName], availableExtent);
    const startOffset = isHorizontal ? dim.marginLeft : dim.marginTop;
    if (
      this.boxInfo.positionAlongVariableDimension ===
      MarginBoxPositionAlongVariableDimension.START
    ) {
      style[startSide] = new css.Expr(startOffset);
    } else if (extent) {
      const marginStart = pm.toExprZero(
        scope,
        style[`margin-${startSide}`],
        availableExtent
      );
      const marginEnd = pm.toExprZero(
        scope,
        style[`margin-${endSide}`],
        availableExtent
      );
      const paddingStart = pm.toExprZero(
        scope,
        style[`padding-${startSide}`],
        availableExtent
      );
      const paddingEnd = pm.toExprZero(
        scope,
        style[`padding-${endSide}`],
        availableExtent
      );
      const borderStartWidth = pm.toExprZeroBorder(
        scope,
        style[`border-${startSide}-width`],
        style[`border-${startSide}-style`],
        availableExtent
      );
      const borderEndWidth = pm.toExprZeroBorder(
        scope,
        style[`border-${endSide}-width`],
        style[`border-${endSide}-style`],
        availableExtent
      );
      const outerExtent = exprs.add(
        scope,
        extent,
        exprs.add(
          scope,
          exprs.add(scope, paddingStart, paddingEnd),
          exprs.add(
            scope,
            exprs.add(scope, borderStartWidth, borderEndWidth),
            exprs.add(scope, marginStart, marginEnd)
          )
        )
      );
      switch (this.boxInfo.positionAlongVariableDimension) {
        case MarginBoxPositionAlongVariableDimension.CENTER:
          style[startSide] = new css.Expr(
            exprs.add(
              scope,
              startOffset,
              exprs.div(
                scope,
                exprs.sub(scope, availableExtent, outerExtent),
                new exprs.Const(scope, 2)
              )
            )
          );
          break;
        case MarginBoxPositionAlongVariableDimension.END:
          style[startSide] = new css.Expr(
            exprs.sub(
              scope,
              exprs.add(scope, startOffset, availableExtent),
              outerExtent
            )
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
    dim: PageAreaDimension | null
  ) {
    const style = this.style;
    const scope = this.pageBox.scope;
    const insideName = names.inside;
    const outsideName = names.outside;
    const extentName = names.extent;
    const pageMargin =
      dim[
        `margin${outsideName.charAt(0).toUpperCase()}${outsideName.substring(
          1
        )}`
      ];
    const marginInside = pm.toExprZeroAuto(
      scope,
      style[`margin-${insideName}`],
      pageMargin
    );
    const marginOutside = pm.toExprZeroAuto(
      scope,
      style[`margin-${outsideName}`],
      pageMargin
    );
    const paddingInside = pm.toExprZero(
      scope,
      style[`padding-${insideName}`],
      pageMargin
    );
    const paddingOutside = pm.toExprZero(
      scope,
      style[`padding-${outsideName}`],
      pageMargin
    );
    const borderInsideWidth = pm.toExprZeroBorder(
      scope,
      style[`border-${insideName}-width`],
      style[`border-${insideName}-style`],
      pageMargin
    );
    const borderOutsideWidth = pm.toExprZeroBorder(
      scope,
      style[`border-${outsideName}-width`],
      style[`border-${outsideName}-style`],
      pageMargin
    );
    const extent = pm.toExprAuto(scope, style[extentName], pageMargin);
    let result = null;

    function getComputedValues(
      context: exprs.Context
    ): {
      extent: exprs.Result | null;
      marginInside: exprs.Result | null;
      marginOutside: exprs.Result | null;
    } {
      if (result) {
        return result;
      }
      result = {
        extent: extent ? extent.evaluate(context) : null,
        marginInside: marginInside ? marginInside.evaluate(context) : null,
        marginOutside: marginOutside ? marginOutside.evaluate(context) : null
      };
      const pageMarginValue = pageMargin.evaluate(context);
      let borderAndPadding = 0;
      [
        borderInsideWidth,
        paddingInside,
        paddingOutside,
        borderOutsideWidth
      ].forEach(x => {
        if (x) {
          borderAndPadding += x.evaluate(context) as number;
        }
      });
      if (result.marginInside === null || result.marginOutside === null) {
        const total =
          borderAndPadding +
          result.extent +
          result.marginInside +
          result.marginOutside;
        if (total > pageMarginValue) {
          if (result.marginInside === null) {
            result.marginInside = 0;
          }
          if (result.marginOutside === null) {
            result.marginoutside = 0;
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
          result.marginInside -
          result.marginOutside;
      } else if (
        result.extent !== null &&
        result.marginInside === null &&
        result.marginOutside !== null
      ) {
        result.marginInside =
          pageMarginValue -
          borderAndPadding -
          result.extent -
          result.marginOutside;
      } else if (
        result.extent !== null &&
        result.marginInside !== null &&
        result.marginOutside === null
      ) {
        result.marginOutside =
          pageMarginValue -
          borderAndPadding -
          result.extent -
          result.marginInside;
      } else if (result.extent === null) {
        result.marginInside = result.marginOutside = 0;
        result.extent = pageMarginValue - borderAndPadding;
      } else {
        result.marginInside = result.marginOutside =
          (pageMarginValue - borderAndPadding - result.extent) / 2;
      }
      return result;
    }
    style[extentName] = new css.Expr(
      new exprs.Native(
        scope,
        function() {
          const value = getComputedValues(this).extent;
          return value === null ? 0 : value;
        },
        extentName
      )
    );
    style[`margin-${insideName}`] = new css.Expr(
      new exprs.Native(
        scope,
        function() {
          const value = getComputedValues(this).marginInside;
          return value === null ? 0 : value;
        },
        `margin-${insideName}`
      )
    );
    style[`margin-${outsideName}`] = new css.Expr(
      new exprs.Native(
        scope,
        function() {
          const value = getComputedValues(this).marginOutside;
          return value === null ? 0 : value;
        },
        `margin-${outsideName}`
      )
    );
    if (insideName === "left") {
      style["left"] = new css.Expr(
        exprs.add(scope, dim.marginLeft, dim.borderBoxWidth)
      );
    } else if (insideName === "top") {
      style["top"] = new css.Expr(
        exprs.add(scope, dim.marginTop, dim.borderBoxHeight)
      );
    }
  }

  /**
   * @override
   */
  initHorizontal() {
    const pageRuleMasterInstance = this
      .parentInstance as PageRuleMasterInstance;
    const dim = pageRuleMasterInstance.pageAreaDimension;
    if (this.boxInfo.isInLeftColumn) {
      this.positionAndSizeAlongFixedDimension(
        { inside: "right", outside: "left", extent: "width" },
        dim
      );
    } else if (this.boxInfo.isInRightColumn) {
      this.positionAndSizeAlongFixedDimension(
        { inside: "left", outside: "right", extent: "width" },
        dim
      );
    } else {
      this.positionAlongVariableDimension(
        { start: "left", end: "right", extent: "width" },
        dim
      );
    }
  }

  /**
   * @override
   */
  initVertical() {
    const pageRuleMasterInstance = this
      .parentInstance as PageRuleMasterInstance;
    const dim = pageRuleMasterInstance.pageAreaDimension;
    if (this.boxInfo.isInTopRow) {
      this.positionAndSizeAlongFixedDimension(
        { inside: "bottom", outside: "top", extent: "height" },
        dim
      );
    } else if (this.boxInfo.isInBottomRow) {
      this.positionAndSizeAlongFixedDimension(
        { inside: "top", outside: "bottom", extent: "height" },
        dim
      );
    } else {
      this.positionAlongVariableDimension(
        { start: "top", end: "bottom", extent: "height" },
        dim
      );
    }
  }

  /**
   * @override
   */
  finishContainer(
    context,
    container,
    page,
    column,
    columnCount,
    clientLayout,
    docFaces
  ) {
    super.finishContainer(
      context,
      container,
      page,
      column,
      columnCount,
      clientLayout,
      docFaces
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
  private pageMasterCache: any = {} as { [key: string]: pm.PageMasterInstance };

  constructor(
    private readonly cascadeInstance: csscasc.CascadeInstance,
    private readonly pageScope: exprs.LexicalScope,
    private readonly rootPageBoxInstance: pm.RootPageBoxInstance,
    private readonly context: exprs.Context,
    private readonly docElementStyle: csscasc.ElementStyle
  ) {
    this.definePageProgression();
  }

  /**
   * Determine the page progression and define left/right/recto/verso pages.
   */
  private definePageProgression() {
    // TODO If a page break is forced before the root element, recto/verso pages
    // are no longer odd/even pages. left/right are reversed too.
    const scope = this.pageScope;
    const pageNumber = new exprs.Named(scope, "page-number");
    const isEvenPage = new exprs.Eq(
      scope,
      new exprs.Modulo(scope, pageNumber, new exprs.Const(scope, 2)),
      scope.zero
    );
    scope.defineName("recto-page", new exprs.Not(scope, isEvenPage));
    scope.defineName("verso-page", isEvenPage);
    const styleInstance: any /* ops.StyleInstance */ = this.context;
    const pageProgression =
      styleInstance.pageProgression ||
      resolvePageProgression(this.docElementStyle);
    if (pageProgression === constants.PageProgression.LTR) {
      scope.defineName("left-page", isEvenPage);
      scope.defineName("right-page", new exprs.Not(scope, isEvenPage));
    } else {
      scope.defineName("left-page", new exprs.Not(scope, isEvenPage));
      scope.defineName("right-page", isEvenPage);
    }
  }

  /**
   * Get cascaded page style specified in page context for the current page.
   */
  getCascadedPageStyle(): csscasc.ElementStyle {
    const style = {} as csscasc.ElementStyle;
    this.cascadeInstance.pushRule([], "", style);
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
    pageMasterInstance: pm.PageMasterInstance,
    cascadedPageStyle: csscasc.ElementStyle
  ): pm.PageMasterInstance {
    const pageMaster = pageMasterInstance.pageBox as pm.PageMaster;

    // If no properies are specified in @page rules, use the original page
    // master.
    if (Object.keys(cascadedPageStyle).length === 0) {
      pageMaster.resetScope();
      return pageMasterInstance;
    }
    const key = this.makeCacheKey(cascadedPageStyle, pageMaster);
    let applied = this.pageMasterCache[key];
    if (!applied) {
      if (pageMaster.pseudoName === pm.userAgentPageMasterPseudo) {
        // If the passed page master is a UA page master,
        // ignore it and generate a new page master from @page rules.
        applied = this.generatePageRuleMaster(cascadedPageStyle);
      } else {
        // Otherwise cascade some properties from @page rules to the page
        // master.
        applied = this.generateCascadedPageMaster(
          cascadedPageStyle,
          pageMaster
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
    style: csscasc.ElementStyle,
    pageMaster: pm.PageMaster
  ): string {
    const propsStr = this.makeCascadeValueObjectKey(style);
    return `${pageMaster.key}^${propsStr}`;
  }

  private makeCascadeValueObjectKey(object: csscasc.ElementStyle): string {
    const props = [] as string[];
    for (const prop in object) {
      if (Object.prototype.hasOwnProperty.call(object, prop)) {
        const val = object[prop];
        let str: string;
        if (val instanceof csscasc.CascadeValue) {
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
    style: csscasc.ElementStyle
  ): PageRuleMasterInstance {
    const pageMaster = new PageRuleMaster(
      this.pageScope,
      this.rootPageBoxInstance.pageBox as pm.RootPageBox,
      style
    );
    const pageMasterInstance = pageMaster.createInstance(
      this.rootPageBoxInstance
    );

    // Do the same initialization as in adapt.ops.StyleInstance.prototype.init
    pageMasterInstance.applyCascadeAndInit(
      this.cascadeInstance,
      this.docElementStyle
    );
    pageMasterInstance.resolveAutoSizing(this.context);
    return pageMasterInstance;
  }

  /**
   * Cascade some properties from @page rules to a page master.
   * For now, only 'width' and 'height' resolved from 'size' value are cascaded.
   * @param style Cascaded style in the page context
   * @param pageMaster The original page master
   */
  private generateCascadedPageMaster(
    style: csscasc.ElementStyle,
    pageMaster: pm.PageMaster
  ): pm.PageMasterInstance {
    const newPageMaster = pageMaster.clone({
      pseudoName: pageRuleMasterPseudoName
    });
    const pageMasterStyle = newPageMaster.specified;
    const size = style["size"];
    if (size) {
      const pageSize = resolvePageSizeAndBleed(style as any);
      const priority = size.priority;
      pageMasterStyle["width"] = csscasc.cascadeValues(
        this.context,
        pageMasterStyle["width"],
        new csscasc.CascadeValue(pageSize.width, priority)
      );
      pageMasterStyle["height"] = csscasc.cascadeValues(
        this.context,
        pageMasterStyle["height"],
        new csscasc.CascadeValue(pageSize.height, priority)
      );
    }

    // Transfer counter properties to the page style so that these specified in
    // the page master are also effective. Note that these values (if specified)
    // always override values in page contexts.
    ["counter-reset", "counter-increment"].forEach(name => {
      if (pageMasterStyle[name]) {
        style[name] = pageMasterStyle[name];
      }
    });
    const pageMasterInstance = newPageMaster.createInstance(
      this.rootPageBoxInstance
    ) as pm.PageMasterInstance;

    // Do the same initialization as in adapt.ops.StyleInstance.prototype.init
    pageMasterInstance.applyCascadeAndInit(
      this.cascadeInstance,
      this.docElementStyle
    );
    pageMasterInstance.resolveAutoSizing(this.context);
    return pageMasterInstance;
  }
}

export class CheckPageTypeAction extends csscasc.ChainedAction {
  constructor(public readonly pageType: string) {
    super();
  }

  /**
   * @override
   */
  apply(cascadeInstance) {
    if (cascadeInstance.currentPageType === this.pageType) {
      this.chained.apply(cascadeInstance);
    }
  }

  /**
   * @override
   */
  getPriority() {
    return 3;
  }

  /**
   * @override
   */
  makePrimary(cascade) {
    if (this.chained) {
      cascade.insertInTable(cascade.pagetypes, this.pageType, this.chained);
    }
    return true;
  }
}

export class IsFirstPageAction extends csscasc.ChainedAction {
  constructor(public readonly scope: exprs.LexicalScope) {
    super();
  }

  /**
   * @override
   */
  apply(cascadeInstace) {
    const pageNumber = new exprs.Named(this.scope, "page-number");
    if (pageNumber.evaluate(cascadeInstace.context) === 1) {
      this.chained.apply(cascadeInstace);
    }
  }

  /**
   * @override
   */
  getPriority() {
    return 2;
  }
}

export class IsLeftPageAction extends csscasc.ChainedAction {
  constructor(public readonly scope: exprs.LexicalScope) {
    super();
  }

  /**
   * @override
   */
  apply(cascadeInstace) {
    const leftPage = new exprs.Named(this.scope, "left-page");
    if (leftPage.evaluate(cascadeInstace.context)) {
      this.chained.apply(cascadeInstace);
    }
  }

  /**
   * @override
   */
  getPriority() {
    return 1;
  }
}

export class IsRightPageAction extends csscasc.ChainedAction {
  constructor(public readonly scope: exprs.LexicalScope) {
    super();
  }

  /**
   * @override
   */
  apply(cascadeInstace) {
    const rightPage = new exprs.Named(this.scope, "right-page");
    if (rightPage.evaluate(cascadeInstace.context)) {
      this.chained.apply(cascadeInstace);
    }
  }

  /**
   * @override
   */
  getPriority() {
    return 1;
  }
}

export class IsRectoPageAction extends csscasc.ChainedAction {
  constructor(public readonly scope: exprs.LexicalScope) {
    super();
  }

  /**
   * @override
   */
  apply(cascadeInstace) {
    const rectoPage = new exprs.Named(this.scope, "recto-page");
    if (rectoPage.evaluate(cascadeInstace.context)) {
      this.chained.apply(cascadeInstace);
    }
  }

  /**
   * @override
   */
  getPriority() {
    return 1;
  }
}

export class IsVersoPageAction extends csscasc.ChainedAction {
  constructor(public readonly scope: exprs.LexicalScope) {
    super();
  }

  /**
   * @override
   */
  apply(cascadeInstace) {
    const versoPage = new exprs.Named(this.scope, "verso-page");
    if (versoPage.evaluate(cascadeInstace.context)) {
      this.chained.apply(cascadeInstace);
    }
  }

  /**
   * @override
   */
  getPriority() {
    return 1;
  }
}

/**
 * Action applying an at-page rule
 */
export class ApplyPageRuleAction extends csscasc.ApplyRuleAction {
  constructor(style: csscasc.ElementStyle, specificity: number) {
    super(style, specificity, null, null, null);
  }

  /**
   * @override
   */
  apply(cascadeInstance) {
    mergeInPageRule(
      cascadeInstance.context,
      cascadeInstance.currentStyle,
      this.style,
      this.specificity,
      cascadeInstance
    );
  }
}

/**
 * Merge page styles, including styles specified on page-margin boxes,
 * considering specificity. Intended to be used in place of
 * csscasc.mergeIn, which is for element styles.
 */
export const mergeInPageRule = (
  context: exprs.Context,
  target: csscasc.ElementStyle,
  style: csscasc.ElementStyle,
  specificity: number,
  cascadeInstance: csscasc.CascadeInstance
) => {
  csscasc.mergeIn(context, target, style, specificity, null, null, null);
  const marginBoxes = style[marginBoxesKey];
  if (marginBoxes) {
    const targetMap = csscasc.getMutableStyleMap(target, marginBoxesKey);
    for (const boxName in marginBoxes) {
      if (marginBoxes.hasOwnProperty(boxName)) {
        let targetBox = targetMap[boxName];
        if (!targetBox) {
          targetBox = {} as csscasc.ElementStyle;
          targetMap[boxName] = targetBox;
        }
        csscasc.mergeIn(
          context,
          targetBox,
          marginBoxes[boxName],
          specificity,
          null,
          null,
          null
        );
      }
    }
  }
};

/**
 * ParserHandler for @page rules. It handles properties specified with page
 * contexts. It also does basic cascading (which can be done without information
 * other than the page rules themselves) and stores the result in `pageProps`
 * object as a map from page selectors to sets of properties. This result is
 * later used for adding @page rules to the real DOM, which are then used by the
 * PDF renderer (Chromium) to determine page sizes.
 */
export class PageParserHandler extends csscasc.CascadeParserHandler
  implements cssvalid.PropertyReceiver {
  private currentPageSelectors: {
    selectors: string[] | null;
    specificity: number;
  }[] = [];
  private currentNamedPageSelector: string = "";
  private currentPseudoPageClassSelectors: string[] = [];

  constructor(
    scope: exprs.LexicalScope,
    owner: cssparse.DispatchParserHandler,
    parent: csscasc.CascadeParserHandler,
    validatorSet: cssvalid.ValidatorSet,
    private readonly pageProps: { [key: string]: csscasc.ElementStyle }
  ) {
    super(scope, owner, null, parent, null, validatorSet, false);
  }

  /**
   * @override
   */
  startPageRule() {
    this.startSelectorRule();
  }

  /**
   * @override
   */
  tagSelector(ns, name) {
    asserts.assert(name);
    this.currentNamedPageSelector = name;
    if (name) {
      this.chain.push(new CheckPageTypeAction(name));
      this.specificity += 65536;
    }
  }

  /**
   * @override
   */
  pseudoclassSelector(name, params) {
    if (params) {
      this.reportAndSkip(
        `E_INVALID_PAGE_SELECTOR :${name}(${params.join("")})`
      );
    }
    this.currentPseudoPageClassSelectors.push(`:${name}`);
    switch (name.toLowerCase()) {
      case "first":
        this.chain.push(new IsFirstPageAction(this.scope));
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

  /**
   * Save currently processed selector and reset variables.
   */
  private finishSelector() {
    let selectors;
    if (
      !this.currentNamedPageSelector &&
      !this.currentPseudoPageClassSelectors.length
    ) {
      selectors = null;
    } else {
      selectors = [this.currentNamedPageSelector].concat(
        this.currentPseudoPageClassSelectors.sort()
      );
    }
    this.currentPageSelectors.push({
      selectors,
      specificity: this.specificity
    });
    this.currentNamedPageSelector = "";
    this.currentPseudoPageClassSelectors = [];
  }

  /**
   * @override
   */
  nextSelector() {
    this.finishSelector();
    super.nextSelector();
  }

  /**
   * @override
   */
  startRuleBody() {
    this.finishSelector();
    super.startRuleBody();
  }

  /**
   * @override
   */
  simpleProperty(name, value, important) {
    // we limit 'bleed' and 'marks' to be effective only when specified without
    // page selectors
    if (
      (name === "bleed" || name === "marks") &&
      !this.currentPageSelectors.some(s => s.selectors === null)
    ) {
      return;
    }
    super.simpleProperty(name, value, important);
    const cascVal = csscasc.getProp(this.elementStyle, name);
    const pageProps = this.pageProps;
    if (name === "bleed" || name === "marks") {
      if (!pageProps[""]) {
        pageProps[""] = {} as csscasc.ElementStyle;
      }

      // we can simply overwrite without considering specificity
      // since 'bleed' and 'marks' always come from a page rule without page
      // selectors.
      Object.keys(pageProps).forEach(selector => {
        csscasc.setProp(pageProps[selector], name, cascVal);
      });
    } else if (name === "size") {
      const noPageSelectorProps = pageProps[""];
      this.currentPageSelectors.forEach(function(s) {
        // update specificity to reflect the specificity of the selector
        let result = new csscasc.CascadeValue(
          cascVal.value,
          cascVal.priority + s.specificity
        );
        const selector = s.selectors ? s.selectors.join("") : "";
        let props = pageProps[selector];
        if (!props) {
          // since no properties for this selector have been stored before,
          // we can simply set the 'size', 'bleed' and 'marks' properties.
          props = pageProps[selector] = {} as csscasc.ElementStyle;
          csscasc.setProp(props, name, result);
          if (noPageSelectorProps) {
            ["bleed", "marks"].forEach(n => {
              if (noPageSelectorProps[n]) {
                csscasc.setProp(props, n, noPageSelectorProps[n]);
              }
            }, this);
          }
        } else {
          // consider specificity when setting 'size' property.
          // we don't have to set 'bleed' and 'marks' since they should have
          // been already updated.
          const prevCascVal = csscasc.getProp(props, name);
          result = prevCascVal
            ? csscasc.cascadeValues(null, result, prevCascVal)
            : result;
          csscasc.setProp(props, name, result);
        }
      }, this);
    }
  }

  /**
   * @override
   */
  insertNonPrimary(action) {
    // We represent page rules without selectors by *, though it is illegal in
    // CSS
    this.cascade.insertInTable(this.cascade.pagetypes, "*", action);
  }

  /**
   * @override
   */
  makeApplyRuleAction(specificity) {
    return new ApplyPageRuleAction(this.elementStyle, specificity);
  }

  /**
   * @override
   */
  startPageMarginBoxRule(name) {
    const marginBoxMap = csscasc.getMutableStyleMap(
      this.elementStyle,
      marginBoxesKey
    );
    let boxStyle = marginBoxMap[name];
    if (!boxStyle) {
      boxStyle = {} as csscasc.ElementStyle;
      marginBoxMap[name] = boxStyle;
    }
    const handler = new PageMarginBoxParserHandler(
      this.scope,
      this.owner,
      this.validatorSet,
      boxStyle
    );
    this.owner.pushHandler(handler);
  }
}

/**
 * Parser handler for a page-margin box rule.
 */
export class PageMarginBoxParserHandler extends cssparse.SlaveParserHandler
  implements cssvalid.PropertyReceiver {
  constructor(
    scope: exprs.LexicalScope,
    owner: cssparse.DispatchParserHandler,
    public readonly validatorSet: cssvalid.ValidatorSet,
    public readonly boxStyle: csscasc.ElementStyle
  ) {
    super(scope, owner, false);
  }

  /**
   * @override
   */
  property(name, value, important) {
    this.validatorSet.validatePropertyAndHandleShorthand(
      name,
      value,
      important,
      this
    );
  }

  /**
   * @override
   */
  invalidPropertyValue(name, value) {
    this.report(`E_INVALID_PROPERTY_VALUE ${name}: ${value.toString()}`);
  }

  /**
   * @override
   */
  unknownProperty(name, value) {
    this.report(`E_INVALID_PROPERTY ${name}: ${value.toString()}`);
  }

  /**
   * @override
   */
  simpleProperty(name, value, important) {
    const specificity = important
      ? this.getImportantSpecificity()
      : this.getBaseSpecificity();
    const cascval = new csscasc.CascadeValue(value, specificity);
    csscasc.setProp(this.boxStyle, name, cascval);
  }
}
