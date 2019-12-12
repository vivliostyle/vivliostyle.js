/**
 * Copyright 2013 Google, Inc.
 * Copyright 2015 Trim-marks Inc.
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
 * @fileoverview CssProp - Support utilities to extract information
 * from various (parsed) CSS values.
 */
import * as Base from "./base";
import * as Css from "./css";
import * as Exprs from "./exprs";
import * as Geom from "./geom";
import * as Logging from "./logging";

//---------------------- value parsers ----------------------------------
export class SetVisitor extends Css.Visitor {
  propSet: { [key: string]: boolean } = {};

  constructor() {
    super();
  }

  /**
   * @override
   */
  visitIdent(ident: Css.Ident): Css.Val {
    this.propSet[ident.name] = true;
    return ident;
  }

  /**
   * @override
   */
  visitSpaceList(list: Css.SpaceList): Css.Val {
    this.visitValues(list.values);
    return list;
  }
}

export function toSet(val: Css.Val): { [key: string]: boolean } {
  if (val) {
    const visitor = new SetVisitor();
    try {
      val.visit(visitor);
      return visitor.propSet;
    } catch (err) {
      Logging.logger.warn(err, "toSet:");
    }
  }
  return {};
}

export class IntVisitor extends Css.Visitor {
  constructor(public value: number) {
    super();
  }

  /**
   * @override
   */
  visitInt(num: Css.Int): Css.Val {
    this.value = num.num;
    return num;
  }
}

export function toInt(val: Css.Val, def: number): number {
  if (val) {
    const visitor = new IntVisitor(def);
    try {
      val.visit(visitor);
      return visitor.value;
    } catch (err) {
      Logging.logger.warn(err, "toInt: ");
    }
  }
  return def;
}

export class ShapeVisitor extends Css.Visitor {
  collect: boolean = false;
  coords: Css.Numeric[] = [];
  name: string | null = null;

  constructor() {
    super();
  }

  /**
   * @override
   */
  visitNumeric(numeric: Css.Numeric): Css.Val {
    if (this.collect) {
      this.coords.push(numeric);
    }
    return null;
  }

  /**
   * @override
   */
  visitNum(num: Css.Num): Css.Val {
    if (this.collect && num.num == 0) {
      this.coords.push(new Css.Numeric(0, "px"));
    }
    return null;
  }

  /**
   * @override
   */
  visitSpaceList(list: Css.SpaceList): Css.Val {
    this.visitValues(list.values);
    return null;
  }

  /**
   * @override
   */
  visitFunc(func: Css.Func): Css.Val {
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
    context: Exprs.Context,
  ): Geom.Shape {
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
            const points: Geom.Point[] = [];
            for (let k = 0; k < numbers.length; k += 2) {
              points.push(new Geom.Point(x + numbers[k], y + numbers[k + 1]));
            }
            return new Geom.Shape(points);
          }
          break;
        case "rectangle":
          if (numbers.length == 4) {
            return Geom.shapeForRect(
              x + numbers[0],
              y + numbers[1],
              x + numbers[0] + numbers[2],
              y + numbers[1] + numbers[3],
            );
          }
          break;
        case "ellipse":
          if (numbers.length == 4) {
            return Geom.shapeForEllipse(
              x + numbers[0],
              y + numbers[1],
              numbers[2],
              numbers[3],
            );
          }
          break;
        case "circle":
          if (numbers.length == 3) {
            return Geom.shapeForEllipse(
              x + numbers[0],
              y + numbers[1],
              numbers[2],
              numbers[2],
            );
          }
          break;
      }
    }
    return null;
  }
}

export function toShape(
  val: Css.Val,
  x: number,
  y: number,
  width: number,
  height: number,
  context: Exprs.Context,
): Geom.Shape {
  if (val) {
    const visitor = new ShapeVisitor();
    try {
      val.visit(visitor);
      return visitor.getShape(x, y, width, height, context);
    } catch (err) {
      Logging.logger.warn(err, "toShape:");
    }
  }
  return Geom.shapeForRect(x, y, x + width, y + height);
}

export class CountersVisitor extends Css.Visitor {
  counters: { [key: string]: number } = {};
  name: string | null = null;

  constructor(public readonly reset: boolean) {
    super();
  }

  /** @override */
  visitIdent(ident: Css.Ident): Css.Val {
    this.name = ident.toString();
    if (this.reset) {
      this.counters[this.name] = 0;
    } else {
      this.counters[this.name] = (this.counters[this.name] || 0) + 1;
    }
    return ident;
  }

  /** @override */
  visitInt(num: Css.Int): Css.Val {
    if (this.name) {
      this.counters[this.name] += num.num - (this.reset ? 0 : 1);
    }
    return num;
  }

  /** @override */
  visitSpaceList(list: Css.SpaceList): Css.Val {
    this.visitValues(list.values);
    return list;
  }
}

export function toCounters(
  val: Css.Val,
  reset: boolean,
): { [key: string]: number } {
  const visitor = new CountersVisitor(reset);
  try {
    val.visit(visitor);
  } catch (err) {
    Logging.logger.warn(err, "toCounters:");
  }
  return visitor.counters;
}

export class UrlTransformVisitor extends Css.FilterVisitor {
  constructor(
    public baseUrl: string,
    public transformer: Base.DocumentURLTransformer,
  ) {
    super();
  }

  /** @override */
  visitURL(url: Css.URL): Css.Val {
    return new Css.URL(this.transformer.transformURL(url.url, this.baseUrl));
  }
}
