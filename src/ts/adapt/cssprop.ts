/**
 * Copyright 2013 Google, Inc.
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
 * @fileoverview Support utilities to extract information from various (parsed)
 * CSS values.
 */
import * as logging from "../vivliostyle/logging";
import * as css from "./css";
import * as exprs from "./expr";
import * as geom from "./geom";

//---------------------- value parsers ----------------------------------
export class SetVisitor extends css.Visitor {
  propSet: { [key: string]: boolean } = {};

  constructor() {
    super();
  }

  /**
   * @override
   */
  visitIdent(ident) {
    this.propSet[ident.name] = true;
    return ident;
  }

  /**
   * @override
   */
  visitSpaceList(list) {
    this.visitValues(list.values);
    return list;
  }
}

export const toSet = (val: css.Val): { [key: string]: boolean } => {
  if (val) {
    const visitor = new SetVisitor();
    try {
      val.visit(visitor);
      return visitor.propSet;
    } catch (err) {
      logging.logger.warn(err, "toSet:");
    }
  }
  return {};
};

export class IntVisitor extends css.Visitor {
  constructor(public value: number) {
    super();
  }

  /**
   * @override
   */
  visitInt(num) {
    this.value = num.num;
    return num;
  }
}

export const toInt = (val: css.Val, def: number): number => {
  if (val) {
    const visitor = new IntVisitor(def);
    try {
      val.visit(visitor);
      return visitor.value;
    } catch (err) {
      logging.logger.warn(err, "toInt: ");
    }
  }
  return def;
};

export class ShapeVisitor extends css.Visitor {
  collect: boolean = false;
  coords: css.Numeric[] = [];
  name: string | null = null;

  constructor() {
    super();
  }

  /**
   * @override
   */
  visitNumeric(numeric) {
    if (this.collect) {
      this.coords.push(numeric);
    }
    return null;
  }

  /**
   * @override
   */
  visitNum(num) {
    if (this.collect && num.num == 0) {
      this.coords.push(new css.Numeric(0, "px"));
    }
    return null;
  }

  /**
   * @override
   */
  visitSpaceList(list) {
    this.visitValues(list.values);
    return null;
  }

  /**
   * @override
   */
  visitFunc(func) {
    if (!this.collect) {
      this.collect = true;
      this.visitValues(func.values);
      this.collect = false;
      this.name = func.name.toLowerCase();
    }
    return null;
  }

  getShape(
    x: number,
    y: number,
    width: number,
    height: number,
    context: exprs.Context
  ): geom.Shape {
    if (this.coords.length > 0) {
      const numbers: number[] = [];
      this.coords.forEach((coord, i) => {
        if (coord.unit == "%") {
          let ref = i % 2 == 0 ? width : height;
          if (i == 3 && this.name == "circle") {
            ref = Math.sqrt((width * width + height * height) / 2);
          }
          numbers.push((coord.num * ref) / 100);
        } else {
          numbers.push(coord.num * context.queryUnitSize(coord.unit, false));
        }
      });
      switch (this.name) {
        case "polygon":
          if (numbers.length % 2 == 0) {
            const points: geom.Point[] = [];
            for (let k = 0; k < numbers.length; k += 2) {
              points.push(new geom.Point(x + numbers[k], y + numbers[k + 1]));
            }
            return new geom.Shape(points);
          }
          break;
        case "rectangle":
          if (numbers.length == 4) {
            return geom.shapeForRect(
              x + numbers[0],
              y + numbers[1],
              x + numbers[0] + numbers[2],
              y + numbers[1] + numbers[3]
            );
          }
          break;
        case "ellipse":
          if (numbers.length == 4) {
            return geom.shapeForEllipse(
              x + numbers[0],
              y + numbers[1],
              numbers[2],
              numbers[3]
            );
          }
          break;
        case "circle":
          if (numbers.length == 3) {
            return geom.shapeForEllipse(
              x + numbers[0],
              y + numbers[1],
              numbers[2],
              numbers[2]
            );
          }
          break;
      }
    }
    return null;
  }
}

export const toShape = (
  val: css.Val,
  x: number,
  y: number,
  width: number,
  height: number,
  context: exprs.Context
): geom.Shape => {
  if (val) {
    const visitor = new ShapeVisitor();
    try {
      val.visit(visitor);
      return visitor.getShape(x, y, width, height, context);
    } catch (err) {
      logging.logger.warn(err, "toShape:");
    }
  }
  return geom.shapeForRect(x, y, x + width, y + height);
};

export class CountersVisitor extends css.Visitor {
  counters: { [key: string]: number } = {};
  name: string | null = null;

  constructor(public readonly reset: boolean) {
    super();
  }

  /** @override */
  visitIdent(ident) {
    this.name = ident.toString();
    if (this.reset) {
      this.counters[this.name] = 0;
    } else {
      this.counters[this.name] = (this.counters[this.name] || 0) + 1;
    }
    return ident;
  }

  /** @override */
  visitInt(num) {
    if (this.name) {
      this.counters[this.name] += num.num - (this.reset ? 0 : 1);
    }
    return num;
  }

  /** @override */
  visitSpaceList(list) {
    this.visitValues(list.values);
    return list;
  }
}

export const toCounters = (
  val: css.Val,
  reset: boolean
): { [key: string]: number } => {
  const visitor = new CountersVisitor(reset);
  try {
    val.visit(visitor);
  } catch (err) {
    logging.logger.warn(err, "toCounters:");
  }
  return visitor.counters;
};

export class UrlTransformVisitor extends css.FilterVisitor {
  baseUrl: any;
  transformer: any;

  constructor(baseUrl, transformer) {
    super();
    this.baseUrl = baseUrl;
    this.transformer = transformer;
  }

  /** @override */
  visitURL(url) {
    return new css.URL(this.transformer.transformURL(url.url, this.baseUrl));
  }
}
