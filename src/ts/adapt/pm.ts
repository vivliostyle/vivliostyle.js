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
 * @fileoverview Deal with page masters, partition groups, and partitions.
 */
import * as base from "./base";
import * as css from "./css";
import * as csscasc from "./csscasc";
import * as exprs from "./expr";
import * as vtree from "./vtree";

import { DispatchParserHandler } from "./cssparse";
import * as cssparse from "./cssparse";
import { ValidatorSet, PropertyReceiver } from "./cssvalid";
import { DocumentFaces } from "./font";

export let keyCount: number = 1;

/**
 * Represent an at-rule which creates a page-level CSS box (page-master,
 * partition, and partition-group).
 */
export abstract class PageBox<
  I extends PageBoxInstance = PageBoxInstance<any>
> {
  // styles specified in the at-rule
  specified: csscasc.ElementStyle = {};
  children: PageBox[] = [];
  pageMaster: PageMaster = null;
  index: number = 0;
  key: any;

  protected _scope: exprs.LexicalScope;

  get scope(): exprs.LexicalScope {
    return this._scope;
  }

  constructor(
    scope: exprs.LexicalScope,
    public readonly name: string | null,
    public readonly pseudoName: string | null,
    public readonly classes: string[],
    public readonly parent: PageBox
  ) {
    this._scope = scope;
    this.key = `p${keyCount++}`;
    if (parent) {
      this.index = parent.children.length;
      parent.children.push(this);
    }
  }

  createInstance(parentInstance: PageBoxInstance): PageBoxInstance {
    throw new Error("E_UNEXPECTED_CALL");
  }

  /**
   * Clone the PageBox.
   * @param param parent: The parent of the cloned PageBox.
   *     pseudoName: Assign this value as the pseudoName of the cloned PageBox.
   */
  clone(param: { parent?: PageBox; pseudoName?: string }): PageBox<I> {
    throw new Error("E_UNEXPECTED_CALL");
  }

  /**
   * Copy 'specified' properties to another instance.
   * @param dest The PageBox into which 'specified' properties are copied
   */
  protected copySpecified(dest: PageBox) {
    const specified = this.specified;
    const destSpecified = dest.specified;
    for (const prop in specified) {
      if (Object.prototype.hasOwnProperty.call(specified, prop)) {
        destSpecified[prop] = specified[prop];
      }
    }
  }

  /**
   * Clone children with the specified PageBox as their parent.
   */
  protected cloneChildren(parent: PageBox) {
    for (let i = 0; i < this.children.length; i++) {
      // the cloned child is added to parent.children in the child constructor.
      this.children[i].clone({ parent });
    }
  }
}

/**
 * Parent of all page masters
 */
export class RootPageBox extends PageBox<RootPageBoxInstance> {
  constructor(scope: exprs.LexicalScope) {
    super(scope, null, null, [], null);
    this.specified["width"] = new csscasc.CascadeValue(css.fullWidth, 0);
    this.specified["height"] = new csscasc.CascadeValue(css.fullHeight, 0);
  }
}

export class PageMasterScope extends exprs.LexicalScope {
  constructor(scope: exprs.LexicalScope, public pageMaster: PageMaster) {
    super(scope, resolver);
    const self = this;
    function resolver(qualifiedName, isFunc) {
      const r = qualifiedName.match(/^([^.]+)\.([^.]+)$/);
      if (r) {
        const key = self.pageMaster.keyMap[r[1]];
        if (key) {
          const holder = this as InstanceHolder;
          const boxInstance = holder.lookupInstance(key);
          if (boxInstance) {
            if (isFunc) {
              return boxInstance.resolveFunc(r[2]);
            } else {
              return boxInstance.resolveName(r[2]);
            }
          }
        }
      }
      return null;
    }
  }
}

/**
 * Represent a page-master rule
 */
export class PageMaster<
  I extends PageMasterInstance = PageMasterInstance<any>
> extends PageBox<I> {
  pageMaster: any;
  keyMap: { [key: string]: string } = {};

  constructor(
    scope: exprs.LexicalScope,
    name: string | null,
    pseudoName: string | null,
    classes: string[],
    parent: RootPageBox,
    public readonly condition: exprs.Val,
    public readonly specificity: number
  ) {
    super(scope, name, pseudoName, classes, parent);
    // if PageMasterScope object is passed, use (share) it.
    if (!(scope instanceof PageMasterScope)) {
      this._scope = new PageMasterScope(scope, this);
    }
    this.pageMaster = this;
    this.specified["width"] = new csscasc.CascadeValue(css.fullWidth, 0);
    this.specified["height"] = new csscasc.CascadeValue(css.fullHeight, 0);
    this.specified["wrap-flow"] = new csscasc.CascadeValue(css.ident.auto, 0);
    this.specified["position"] = new csscasc.CascadeValue(
      css.ident.relative,
      0
    );
    this.specified["overflow"] = new csscasc.CascadeValue(css.ident.visible, 0);

    // Shift 1px to workaround Chrome printing bug
    this.specified["top"] = new csscasc.CascadeValue(
      new css.Numeric(-1, "px"),
      0
    );
  }

  /**
   * @override
   */
  createInstance(parentInstance): PageBoxInstance {
    return new PageMasterInstance(parentInstance, this);
  }

  /**
   * @override
   */
  clone(param): PageMaster {
    // The cloned page master shares the same scope object with the original
    // one.
    const cloned = new PageMaster(
      this.scope,
      this.name,
      param.pseudoName || this.pseudoName,
      this.classes,
      this.parent as RootPageBox,
      this.condition,
      this.specificity
    );
    this.copySpecified(cloned);
    this.cloneChildren(cloned);
    return cloned;
  }

  /**
   * Point the pageMaster reference in the PageMasterScope to the current page
   * master. This is needed when a page master is cloned and shares a common
   * scope with the original page master. Since every exprs.Val which the
   * page master holds has a reference to the scope and uses it for variable
   * resolution, this reference must be updated properly before the page master
   * instance is used.
   */
  resetScope() {
    (this.scope as any).pageMaster = this;
  }
}

/**
 * Represent a partition-group rule
 */
export class PartitionGroup extends PageBox<PartitionGroupInstance> {
  pageMaster: any;

  constructor(
    scope: exprs.LexicalScope,
    name: string | null,
    pseudoName: string | null,
    classes: string[],
    parent: PageBox
  ) {
    super(scope, name, pseudoName, classes, parent);
    this.pageMaster = parent.pageMaster;
    if (name) {
      this.pageMaster.keyMap[name] = this.key;
    }
    this.specified["wrap-flow"] = new csscasc.CascadeValue(css.ident.auto, 0);
  }

  /**
   * @override
   */
  createInstance(parentInstance) {
    return new PartitionGroupInstance(parentInstance, this);
  }

  /**
   * @override
   */
  clone(param): PartitionGroup {
    const cloned = new PartitionGroup(
      param.parent.scope,
      this.name,
      this.pseudoName,
      this.classes,
      param.parent
    );
    this.copySpecified(cloned);
    this.cloneChildren(cloned);
    return cloned;
  }
}

/**
 * Represent a partition rule
 */
export class Partition<
  I extends PartitionInstance = PartitionInstance
> extends PageBox<I> {
  pageMaster: any;

  constructor(
    scope: exprs.LexicalScope,
    name: string | null,
    pseudoName: string | null,
    classes: string[],
    parent: PageBox
  ) {
    super(scope, name, pseudoName, classes, parent);
    this.pageMaster = parent.pageMaster;
    if (name) {
      this.pageMaster.keyMap[name] = this.key;
    }
  }

  /**
   * @override
   */
  createInstance(parentInstance): PageBoxInstance {
    return new PartitionInstance(parentInstance, this);
  }

  /**
   * @override
   */
  clone(param): Partition {
    const cloned = new Partition(
      param.parent.scope,
      this.name,
      this.pseudoName,
      this.classes,
      param.parent
    );
    this.copySpecified(cloned);
    this.cloneChildren(cloned);
    return cloned;
  }
}

//---------------------------- Instance --------------------------------

/**
 * @param def default value
 */
export const toExprIdent = (
  scope: exprs.LexicalScope,
  val: css.Val,
  def: string
): exprs.Val => {
  if (!val) {
    return new exprs.Const(scope, def);
  }
  return val.toExpr(scope, scope.zero);
};

export const toExprAuto = (
  scope: exprs.LexicalScope,
  val: css.Val,
  ref: exprs.Val
): exprs.Val => {
  if (!val || val === css.ident.auto) {
    return null;
  }
  return val.toExpr(scope, ref);
};

export const toExprNormal = (
  scope: exprs.LexicalScope,
  val: css.Val,
  ref: exprs.Val
): exprs.Val => {
  if (!val || val === css.ident.normal) {
    return null;
  }
  return val.toExpr(scope, ref);
};

export const toExprZero = (
  scope: exprs.LexicalScope,
  val: css.Val,
  ref: exprs.Val
): exprs.Val => {
  if (!val || val === css.ident.auto) {
    return scope.zero;
  }
  return val.toExpr(scope, ref);
};

/**
 * If the value is not specified (null), returns zero.
 * If the value is 'auto', returns null.
 * Otherwise, return the value itself.
 */
export const toExprZeroAuto = (
  scope: exprs.LexicalScope,
  val: css.Val,
  ref: exprs.Val
): exprs.Val => {
  if (!val) {
    return scope.zero;
  } else if (val === css.ident.auto) {
    return null;
  } else {
    return val.toExpr(scope, ref);
  }
};

export const toExprZeroBorder = (
  scope: exprs.LexicalScope,
  val: css.Val,
  styleVal: css.Val,
  ref: exprs.Val
): exprs.Val => {
  if (!val || styleVal === css.ident.none) {
    return scope.zero;
  }
  return val.toExpr(scope, ref);
};

export const toExprBool = (
  scope: exprs.LexicalScope,
  val: css.Val,
  def: exprs.Val
): exprs.Val => {
  if (!val) {
    return def;
  }
  if (val === css.ident._true) {
    return scope._true;
  }
  if (val === css.ident._false) {
    return scope._false;
  }
  return val.toExpr(scope, scope.zero);
};

export interface InstanceHolder extends exprs.Context {
  registerInstance(key: string, instance: PageBoxInstance): void;

  /**
   * @return instance
   */
  lookupInstance(key: string): PageBoxInstance;
}

export class PageBoxInstance<P extends PageBox = PageBox<any>> {
  /**
   * cascaded styles, geometric ones converted to css.Expr
   */
  protected cascaded: csscasc.ElementStyle = {};
  style: { [key: string]: css.Val } = {};
  private autoWidth: exprs.Native = null;
  private autoHeight: exprs.Native = null;
  children: PageBoxInstance[] = [];
  isAutoWidth: boolean = false;
  isAutoHeight: boolean = false;
  isTopDependentOnAutoHeight: boolean = false;
  isRightDependentOnAutoWidth: boolean = false;
  private calculatedWidth: number = 0;
  private calculatedHeight: number = 0;
  pageMasterInstance: PageMasterInstance = null;
  namedValues: { [key: string]: exprs.Val } = {};
  namedFuncs: { [key: string]: exprs.Val } = {};
  vertical: boolean = false;
  rtl: boolean = false;
  suppressEmptyBoxGeneration: boolean = false;

  constructor(
    public readonly parentInstance: PageBoxInstance,
    public readonly pageBox: P
  ) {
    if (parentInstance) {
      parentInstance.children.push(this);
    }
  }

  /**
   * Reset information related to layout.
   */
  reset() {
    this.calculatedWidth = 0;
    this.calculatedHeight = 0;
  }

  private addNamedValues(name1: string, name2: string): exprs.Val {
    const v1 = this.resolveName(name1);
    const v2 = this.resolveName(name2);
    if (!v1 || !v2) {
      throw new Error("E_INTERNAL");
    }
    return exprs.add(this.pageBox.scope, v1, v2);
  }

  resolveName(name: string): exprs.Val {
    let expr = this.namedValues[name];
    if (expr) {
      return expr;
    }
    const val = this.style[name];
    if (val) {
      expr = val.toExpr(this.pageBox.scope, this.pageBox.scope.zero);
    }
    switch (name) {
      case "margin-left-edge":
        expr = this.resolveName("left");
        break;
      case "margin-top-edge":
        expr = this.resolveName("top");
        break;
      case "margin-right-edge":
        expr = this.addNamedValues("border-right-edge", "margin-right");
        break;
      case "margin-bottom-edge":
        expr = this.addNamedValues("border-bottom-edge", "margin-bottom");
        break;
      case "border-left-edge":
        expr = this.addNamedValues("margin-left-edge", "margin-left");
        break;
      case "border-top-edge":
        expr = this.addNamedValues("margin-top-edge", "margin-top");
        break;
      case "border-right-edge":
        expr = this.addNamedValues("padding-right-edge", "border-right-width");
        break;
      case "border-bottom-edge":
        expr = this.addNamedValues(
          "padding-bottom-edge",
          "border-bottom-width"
        );
        break;
      case "padding-left-edge":
        expr = this.addNamedValues("border-left-edge", "border-left-width");
        break;
      case "padding-top-edge":
        expr = this.addNamedValues("border-top-edge", "border-top-width");
        break;
      case "padding-right-edge":
        expr = this.addNamedValues("right-edge", "padding-right");
        break;
      case "padding-bottom-edge":
        expr = this.addNamedValues("bottom-edge", "padding-bottom");
        break;
      case "left-edge":
        expr = this.addNamedValues("padding-left-edge", "padding-left");
        break;
      case "top-edge":
        expr = this.addNamedValues("padding-top-edge", "padding-top");
        break;
      case "right-edge":
        expr = this.addNamedValues("left-edge", "width");
        break;
      case "bottom-edge":
        expr = this.addNamedValues("top-edge", "height");
        break;
    }
    if (!expr) {
      let altName;
      if (name == "extent") {
        altName = this.vertical ? "width" : "height";
      } else if (name == "measure") {
        altName = this.vertical ? "height" : "width";
      } else {
        const map = this.vertical
          ? csscasc.couplingMapVert
          : csscasc.couplingMapHor;
        altName = name;
        for (const key in map) {
          altName = altName.replace(key, map[key]);
        }
      }
      if (altName != name) {
        expr = this.resolveName(altName);
      }
    }
    if (expr) {
      this.namedValues[name] = expr;
    }
    return expr;
  }

  resolveFunc(name) {
    let expr = this.namedFuncs[name];
    if (expr) {
      return expr;
    }
    switch (name) {
      case "columns": {
        // min(count,column-count) * (column-width + column-gap) - column-gap
        const scope = this.pageBox.scope;
        const count = new exprs.Param(scope, 0);
        const columnCount = this.resolveName("column-count");
        const columnWidth = this.resolveName("column-width");
        const columnGap = this.resolveName("column-gap");
        expr = exprs.sub(
          scope,
          exprs.mul(
            scope,
            new exprs.Call(scope, "min", [count, columnCount]),
            exprs.add(scope, columnWidth, columnGap)
          ),
          columnGap
        );
        break;
      }
    }
    if (expr) {
      this.namedFuncs[name] = expr;
    }
    return expr;
  }

  private initEnabled(): void {
    const scope = this.pageBox.scope;
    const style = this.style;
    let enabled = toExprBool(scope, style["enabled"], scope._true);
    const page = toExprAuto(scope, style["page"], scope.zero);
    if (page) {
      const currentPage = new exprs.Named(scope, "page-number");
      enabled = exprs.and(
        scope,
        enabled,
        new exprs.Eq(scope, page, currentPage)
      );
    }
    const minPageWidth = toExprAuto(scope, style["min-page-width"], scope.zero);
    if (minPageWidth) {
      enabled = exprs.and(
        scope,
        enabled,
        new exprs.Ge(scope, new exprs.Named(scope, "page-width"), minPageWidth)
      );
    }
    const minPageHeight = toExprAuto(
      scope,
      style["min-page-height"],
      scope.zero
    );
    if (minPageHeight) {
      enabled = exprs.and(
        scope,
        enabled,
        new exprs.Ge(
          scope,
          new exprs.Named(scope, "page-height"),
          minPageHeight
        )
      );
    }
    enabled = this.boxSpecificEnabled(enabled);
    style["enabled"] = new css.Expr(enabled);
  }

  protected boxSpecificEnabled(enabled: exprs.Val): exprs.Val {
    return enabled;
  }

  protected initHorizontal(): void {
    const scope = this.pageBox.scope;
    const style = this.style;
    const parentWidth = this.parentInstance
      ? this.parentInstance.style["width"].toExpr(scope, null)
      : null;
    let left = toExprAuto(scope, style["left"], parentWidth);
    let marginLeft = toExprAuto(scope, style["margin-left"], parentWidth);
    const borderLeftWidth = toExprZeroBorder(
      scope,
      style["border-left-width"],
      style["border-left-style"],
      parentWidth
    );
    const paddingLeft = toExprZero(scope, style["padding-left"], parentWidth);
    let width = toExprAuto(scope, style["width"], parentWidth);
    let maxWidth = toExprAuto(scope, style["max-width"], parentWidth);
    const paddingRight = toExprZero(scope, style["padding-right"], parentWidth);
    const borderRightWidth = toExprZeroBorder(
      scope,
      style["border-right-width"],
      style["border-right-style"],
      parentWidth
    );
    let marginRight = toExprAuto(scope, style["margin-right"], parentWidth);
    let right = toExprAuto(scope, style["right"], parentWidth);
    const leftBP = exprs.add(scope, borderLeftWidth, paddingLeft);
    const rightBP = exprs.add(scope, borderLeftWidth, paddingRight);
    if (left && right && width) {
      let extra = exprs.sub(
        scope,
        parentWidth,
        exprs.add(
          scope,
          width,
          exprs.add(scope, exprs.add(scope, left, leftBP), rightBP)
        )
      );
      if (!marginLeft) {
        extra = exprs.sub(scope, extra, right);
        if (!marginRight) {
          marginLeft = exprs.mul(scope, extra, new exprs.Const(scope, 0.5));
          marginRight = marginLeft;
        } else {
          marginLeft = exprs.sub(scope, extra, marginRight);
        }
      } else {
        if (!marginRight) {
          marginRight = exprs.sub(
            scope,
            extra,
            exprs.add(scope, right, marginLeft)
          );
        } else {
          // overconstraint
          right = exprs.sub(scope, extra, marginRight);
        }
      }
    } else {
      if (!marginLeft) {
        marginLeft = scope.zero;
      }
      if (!marginRight) {
        marginRight = scope.zero;
      }
      if (!left && !right && !width) {
        left = scope.zero;
      }
      if (!left && !width) {
        width = this.autoWidth;
        this.isAutoWidth = true;
      } else if (!left && !right) {
        left = scope.zero;
      } else if (!width && !right) {
        width = this.autoWidth;
        this.isAutoWidth = true;
      }
      const remains = exprs.sub(
        scope,
        parentWidth,
        exprs.add(
          scope,
          exprs.add(scope, marginLeft, leftBP),
          exprs.add(scope, marginRight, rightBP)
        )
      );
      if (this.isAutoWidth) {
        if (!maxWidth) {
          // TODO: handle the case when right/left depends on width
          maxWidth = exprs.sub(scope, remains, left ? left : right);
        }

        // For multi-column layout, width is max-width.
        if (
          !this.vertical &&
          (toExprAuto(scope, style["column-width"], null) ||
            toExprAuto(scope, style["column-count"], null))
        ) {
          width = maxWidth;
          this.isAutoWidth = false;
        }
      }
      if (!left) {
        left = exprs.sub(scope, remains, exprs.add(scope, right, width));
      } else if (!width) {
        width = exprs.sub(scope, remains, exprs.add(scope, left, right));
      } else if (!right) {
        right = exprs.sub(scope, remains, exprs.add(scope, left, width));
      }
    }

    // snap-width is inherited
    const snapWidthVal =
      style["snap-width"] ||
      (this.parentInstance ? this.parentInstance.style["snap-width"] : null);
    const snapWidth = toExprZero(scope, snapWidthVal, parentWidth);
    style["left"] = new css.Expr(left);
    style["margin-left"] = new css.Expr(marginLeft);
    style["border-left-width"] = new css.Expr(borderLeftWidth);
    style["padding-left"] = new css.Expr(paddingLeft);
    style["width"] = new css.Expr(width);
    style["max-width"] = new css.Expr(maxWidth ? maxWidth : width);
    style["padding-right"] = new css.Expr(paddingRight);
    style["border-right-width"] = new css.Expr(borderRightWidth);
    style["margin-right"] = new css.Expr(marginRight);
    style["right"] = new css.Expr(right);
    style["snap-width"] = new css.Expr(snapWidth);
  }

  protected initVertical(): void {
    const scope = this.pageBox.scope;
    const style = this.style;
    const parentWidth = this.parentInstance
      ? this.parentInstance.style["width"].toExpr(scope, null)
      : null;
    const parentHeight = this.parentInstance
      ? this.parentInstance.style["height"].toExpr(scope, null)
      : null;
    let top = toExprAuto(scope, style["top"], parentHeight);
    let marginTop = toExprAuto(scope, style["margin-top"], parentWidth);
    const borderTopWidth = toExprZeroBorder(
      scope,
      style["border-top-width"],
      style["border-top-style"],
      parentWidth
    );
    const paddingTop = toExprZero(scope, style["padding-top"], parentWidth);
    let height = toExprAuto(scope, style["height"], parentHeight);
    let maxHeight = toExprAuto(scope, style["max-height"], parentHeight);
    const paddingBottom = toExprZero(
      scope,
      style["padding-bottom"],
      parentWidth
    );
    const borderBottomWidth = toExprZeroBorder(
      scope,
      style["border-bottom-width"],
      style["border-bottom-style"],
      parentWidth
    );
    let marginBottom = toExprAuto(scope, style["margin-bottom"], parentWidth);
    let bottom = toExprAuto(scope, style["bottom"], parentHeight);
    const topBP = exprs.add(scope, borderTopWidth, paddingTop);
    const bottomBP = exprs.add(scope, borderBottomWidth, paddingBottom);
    if (top && bottom && height) {
      let extra = exprs.sub(
        scope,
        parentHeight,
        exprs.add(
          scope,
          height,
          exprs.add(scope, exprs.add(scope, top, topBP), bottomBP)
        )
      );
      if (!marginTop) {
        extra = exprs.sub(scope, extra, bottom);
        if (!marginBottom) {
          marginTop = exprs.mul(scope, extra, new exprs.Const(scope, 0.5));
          marginBottom = marginTop;
        } else {
          marginTop = exprs.sub(scope, extra, marginBottom);
        }
      } else {
        if (!marginBottom) {
          marginBottom = exprs.sub(
            scope,
            extra,
            exprs.add(scope, bottom, marginTop)
          );
        } else {
          // overconstraint
          bottom = exprs.sub(scope, extra, marginTop);
        }
      }
    } else {
      if (!marginTop) {
        marginTop = scope.zero;
      }
      if (!marginBottom) {
        marginBottom = scope.zero;
      }
      if (!top && !bottom && !height) {
        top = scope.zero;
      }
      if (!top && !height) {
        height = this.autoHeight;
        this.isAutoHeight = true;
      } else if (!top && !bottom) {
        top = scope.zero;
      } else if (!height && !bottom) {
        height = this.autoHeight;
        this.isAutoHeight = true;
      }
      const remains = exprs.sub(
        scope,
        parentHeight,
        exprs.add(
          scope,
          exprs.add(scope, marginTop, topBP),
          exprs.add(scope, marginBottom, bottomBP)
        )
      );
      if (this.isAutoHeight) {
        if (!maxHeight) {
          // TODO: handle the case when top/bottom depends on height
          maxHeight = exprs.sub(scope, remains, top ? top : bottom);
        }

        // For multi-column layout in vertical writing, height is max-height.
        if (
          this.vertical &&
          (toExprAuto(scope, style["column-width"], null) ||
            toExprAuto(scope, style["column-count"], null))
        ) {
          height = maxHeight;
          this.isAutoHeight = false;
        }
      }
      if (!top) {
        top = exprs.sub(scope, remains, exprs.add(scope, bottom, height));
      } else if (!height) {
        height = exprs.sub(scope, remains, exprs.add(scope, bottom, top));
      } else if (!bottom) {
        bottom = exprs.sub(scope, remains, exprs.add(scope, top, height));
      }
    }

    // snap-height is inherited
    const snapHeightVal =
      style["snap-height"] ||
      (this.parentInstance ? this.parentInstance.style["snap-height"] : null);
    const snapHeight = toExprZero(scope, snapHeightVal, parentWidth);
    style["top"] = new css.Expr(top);
    style["margin-top"] = new css.Expr(marginTop);
    style["border-top-width"] = new css.Expr(borderTopWidth);
    style["padding-top"] = new css.Expr(paddingTop);
    style["height"] = new css.Expr(height);
    style["max-height"] = new css.Expr(maxHeight ? maxHeight : height);
    style["padding-bottom"] = new css.Expr(paddingBottom);
    style["border-bottom-width"] = new css.Expr(borderBottomWidth);
    style["margin-bottom"] = new css.Expr(marginBottom);
    style["bottom"] = new css.Expr(bottom);
    style["snap-height"] = new css.Expr(snapHeight);
  }

  private initColumns(): void {
    const scope = this.pageBox.scope;
    const style = this.style;
    const width = toExprAuto(
      scope,
      style[this.vertical ? "height" : "width"],
      null
    );
    let columnWidth = toExprAuto(scope, style["column-width"], width);
    let columnCount = toExprAuto(scope, style["column-count"], null);
    let columnGap = toExprNormal(scope, style["column-gap"], null);
    if (!columnGap) {
      columnGap = new exprs.Numeric(scope, 1, "em");
    }
    if (columnWidth && !columnCount) {
      columnCount = new exprs.Call(scope, "floor", [
        exprs.div(
          scope,
          exprs.add(scope, width, columnGap),
          exprs.add(scope, columnWidth, columnGap)
        )
      ]);
      columnCount = new exprs.Call(scope, "max", [scope.one, columnCount]);
    }
    if (!columnCount) {
      columnCount = scope.one;
    }
    columnWidth = exprs.sub(
      scope,
      exprs.div(scope, exprs.add(scope, width, columnGap), columnCount),
      columnGap
    );
    style["column-width"] = new css.Expr(columnWidth);
    style["column-count"] = new css.Expr(columnCount);
    style["column-gap"] = new css.Expr(columnGap);
  }

  private depends(
    propName: string,
    val: exprs.Val,
    context: exprs.Context
  ): boolean {
    return this.style[propName]
      .toExpr(this.pageBox.scope, null)
      .depend(val, context);
  }

  private init(context: exprs.Context): void {
    // If context does not implement InstanceHolder we would not be able to
    // resolve "partition.property" names later.
    const holder = context as InstanceHolder;
    holder.registerInstance(this.pageBox.key, this);
    const scope = this.pageBox.scope;
    const style = this.style;
    const self = this;
    const regionIds = this.parentInstance
      ? this.parentInstance.getActiveRegions(context)
      : null;
    const cascMap = csscasc.flattenCascadedStyle(
      this.cascaded,
      context,
      regionIds,
      false,
      null
    );
    this.vertical = csscasc.isVertical(
      cascMap,
      context,
      this.parentInstance ? this.parentInstance.vertical : false
    );
    this.rtl = csscasc.isRtl(
      cascMap,
      context,
      this.parentInstance ? this.parentInstance.rtl : false
    );
    csscasc.convertToPhysical(
      cascMap,
      style,
      this.vertical,
      this.rtl,
      (name, cascVal) => cascVal.value
    );
    this.autoWidth = new exprs.Native(
      scope,
      () => self.calculatedWidth,
      "autoWidth"
    );
    this.autoHeight = new exprs.Native(
      scope,
      () => self.calculatedHeight,
      "autoHeight"
    );
    this.initHorizontal();
    this.initVertical();
    this.initColumns();
    this.initEnabled();
  }

  getProp(context: exprs.Context, name: string): css.Val {
    let val = this.style[name];
    if (val) {
      val = cssparse.evaluateCSSToCSS(context, val, name);
    }
    return val;
  }

  getPropAsNumber(context: exprs.Context, name: string): number {
    let val = this.style[name];
    if (val) {
      val = cssparse.evaluateCSSToCSS(context, val, name);
    }
    return css.toNumber(val, context);
  }

  getSpecial(context: exprs.Context, name: string): css.Val[] {
    const arr = csscasc.getSpecial(this.cascaded, name);
    if (arr) {
      const result = [] as css.Val[];
      for (let i = 0; i < arr.length; i++) {
        const v = arr[i].evaluate(context, "");
        if (v && v !== css.empty) {
          result.push(v);
        }
      }
      if (result.length) {
        return result;
      }
    }
    return null;
  }

  getActiveRegions(context: exprs.Context): string[] {
    const arr = this.getSpecial(context, "region-id");
    if (arr) {
      const result = [] as string[];
      for (let i = 0; i < arr.length; i++) {
        result[i] = arr[i].toString();
      }
      return result;
    }
    return null;
  }

  propagateProperty(
    context: exprs.Context,
    container: vtree.Container,
    name: string,
    docFaces: DocumentFaces
  ): void {
    this.propagatePropertyToElement(context, container.element, name, docFaces);
  }

  propagatePropertyToElement(
    context: exprs.Context,
    element: Element,
    name: string,
    docFaces: DocumentFaces
  ): void {
    let val = this.getProp(context, name);
    if (val) {
      if (
        val.isNumeric() &&
        exprs.needUnitConversion((val as css.Numeric).unit)
      ) {
        val = css.convertNumericToPx(val, context);
      }
      if (name === "font-family") {
        val = docFaces.filterFontFamily(val);
      }
      base.setCSSProperty(element, name, val.toString());
    }
  }

  propagateDelayedProperty(
    context: exprs.Context,
    container: vtree.Container,
    name: string,
    delayedItems: vtree.DelayedItem[]
  ): void {
    const val = this.getProp(context, name);
    if (val) {
      delayedItems.push(new vtree.DelayedItem(container.element, name, val));
    }
  }

  assignLeftPosition(context: exprs.Context, container: vtree.Container): void {
    const left = this.getPropAsNumber(context, "left");
    const marginLeft = this.getPropAsNumber(context, "margin-left");
    const paddingLeft = this.getPropAsNumber(context, "padding-left");
    const borderLeftWidth = this.getPropAsNumber(context, "border-left-width");
    const width = this.getPropAsNumber(context, "width");
    container.setHorizontalPosition(left, width);
    base.setCSSProperty(container.element, "margin-left", `${marginLeft}px`);
    base.setCSSProperty(container.element, "padding-left", `${paddingLeft}px`);
    base.setCSSProperty(
      container.element,
      "border-left-width",
      `${borderLeftWidth}px`
    );
    container.marginLeft = marginLeft;
    container.borderLeft = borderLeftWidth;
    container.paddingLeft = paddingLeft;
  }

  assignRightPosition(
    context: exprs.Context,
    container: vtree.Container
  ): void {
    const right = this.getPropAsNumber(context, "right");
    const snapWidth = this.getPropAsNumber(context, "snap-height");
    const marginRight = this.getPropAsNumber(context, "margin-right");
    let paddingRight = this.getPropAsNumber(context, "padding-right");
    const borderRightWidth = this.getPropAsNumber(
      context,
      "border-right-width"
    );
    base.setCSSProperty(container.element, "margin-right", `${marginRight}px`);
    base.setCSSProperty(
      container.element,
      "padding-right",
      `${paddingRight}px`
    );
    base.setCSSProperty(
      container.element,
      "border-right-width",
      `${borderRightWidth}px`
    );
    container.marginRight = marginRight;
    container.borderRight = borderRightWidth;
    if (this.vertical && snapWidth > 0) {
      const xpos = right + container.getInsetRight();
      const r = xpos - Math.floor(xpos / snapWidth) * snapWidth;
      if (r > 0) {
        container.snapOffsetX = snapWidth - r;
        paddingRight += container.snapOffsetX;
      }
    }
    container.paddingRight = paddingRight;
    container.snapWidth = snapWidth;
  }

  assignTopPosition(context: exprs.Context, container: vtree.Container): void {
    const snapHeight = this.getPropAsNumber(context, "snap-height");
    const top = this.getPropAsNumber(context, "top");
    const marginTop = this.getPropAsNumber(context, "margin-top");
    let paddingTop = this.getPropAsNumber(context, "padding-top");
    const borderTopWidth = this.getPropAsNumber(context, "border-top-width");
    container.top = top;
    container.marginTop = marginTop;
    container.borderTop = borderTopWidth;
    container.snapHeight = snapHeight;
    if (!this.vertical && snapHeight > 0) {
      const ypos = top + container.getInsetTop();
      const r = ypos - Math.floor(ypos / snapHeight) * snapHeight;
      if (r > 0) {
        container.snapOffsetY = snapHeight - r;
        paddingTop += container.snapOffsetY;
      }
    }
    container.paddingTop = paddingTop;
    base.setCSSProperty(container.element, "top", `${top}px`);
    base.setCSSProperty(container.element, "margin-top", `${marginTop}px`);
    base.setCSSProperty(container.element, "padding-top", `${paddingTop}px`);
    base.setCSSProperty(
      container.element,
      "border-top-width",
      `${borderTopWidth}px`
    );
  }

  assignBottomPosition(
    context: exprs.Context,
    container: vtree.Container
  ): void {
    const marginBottom = this.getPropAsNumber(context, "margin-bottom");
    const paddingBottom = this.getPropAsNumber(context, "padding-bottom");
    const borderBottomWidth = this.getPropAsNumber(
      context,
      "border-bottom-width"
    );
    const height =
      this.getPropAsNumber(context, "height") - container.snapOffsetY;
    base.setCSSProperty(container.element, "height", `${height}px`);
    base.setCSSProperty(
      container.element,
      "margin-bottom",
      `${marginBottom}px`
    );
    base.setCSSProperty(
      container.element,
      "padding-bottom",
      `${paddingBottom}px`
    );
    base.setCSSProperty(
      container.element,
      "border-bottom-width",
      `${borderBottomWidth}px`
    );
    container.height = height - container.snapOffsetY;
    container.marginBottom = marginBottom;
    container.borderBottom = borderBottomWidth;
    container.paddingBottom = paddingBottom;
  }

  assignBeforePosition(
    context: exprs.Context,
    container: vtree.Container
  ): void {
    if (this.vertical) {
      this.assignRightPosition(context, container);
    } else {
      this.assignTopPosition(context, container);
    }
  }

  assignAfterPosition(
    context: exprs.Context,
    container: vtree.Container
  ): void {
    if (this.vertical) {
      this.assignLeftPosition(context, container);
    } else {
      this.assignBottomPosition(context, container);
    }
  }

  assignStartEndPosition(
    context: exprs.Context,
    container: vtree.Container
  ): void {
    if (this.vertical) {
      this.assignTopPosition(context, container);
      this.assignBottomPosition(context, container);
    } else {
      this.assignRightPosition(context, container);
      this.assignLeftPosition(context, container);
    }
  }

  sizeWithMaxHeight(context: exprs.Context, container: vtree.Container): void {
    base.setCSSProperty(container.element, "border-top-width", "0px");
    let height = this.getPropAsNumber(context, "max-height");
    if (this.isTopDependentOnAutoHeight) {
      container.setVerticalPosition(0, height);
    } else {
      this.assignTopPosition(context, container);
      height -= container.snapOffsetY;
      container.height = height;
      base.setCSSProperty(container.element, "height", `${height}px`);
    }
  }

  sizeWithMaxWidth(context: exprs.Context, container: vtree.Container): void {
    base.setCSSProperty(container.element, "border-left-width", "0px");
    let width = this.getPropAsNumber(context, "max-width");
    if (this.isRightDependentOnAutoWidth) {
      container.setHorizontalPosition(0, width);
    } else {
      this.assignRightPosition(context, container);
      width -= container.snapOffsetX;
      container.width = width;
      const right = this.getPropAsNumber(context, "right");
      base.setCSSProperty(container.element, "right", `${right}px`);
      base.setCSSProperty(container.element, "width", `${width}px`);
    }
  }

  prepareContainer(
    context: exprs.Context,
    container: vtree.Container,
    page: vtree.Page,
    docFaces: DocumentFaces,
    clientLayout: vtree.ClientLayout
  ): void {
    if (!this.parentInstance || this.vertical != this.parentInstance.vertical) {
      base.setCSSProperty(
        container.element,
        "writing-mode",
        this.vertical ? "vertical-rl" : "horizontal-tb"
      );
    }
    if (this.vertical ? this.isAutoWidth : this.isAutoHeight) {
      if (this.vertical) {
        this.sizeWithMaxWidth(context, container);
      } else {
        this.sizeWithMaxHeight(context, container);
      }
    } else {
      this.assignBeforePosition(context, container);
      this.assignAfterPosition(context, container);
    }
    if (this.vertical ? this.isAutoHeight : this.isAutoWidth) {
      if (this.vertical) {
        this.sizeWithMaxHeight(context, container);
      } else {
        this.sizeWithMaxWidth(context, container);
      }
    } else {
      this.assignStartEndPosition(context, container);
    }
    for (let i = 0; i < passPreProperties.length; i++) {
      this.propagateProperty(
        context,
        container,
        passPreProperties[i],
        docFaces
      );
    }
  }

  transferContentProps(
    context: exprs.Context,
    container: vtree.Container,
    page: vtree.Page,
    docFaces: DocumentFaces
  ): void {
    for (let i = 0; i < passContentProperties.length; i++) {
      this.propagateProperty(
        context,
        container,
        passContentProperties[i],
        docFaces
      );
    }
  }

  transferSinglUriContentProps(
    context: exprs.Context,
    element: Element,
    docFaces: DocumentFaces
  ): void {
    for (let i = 0; i < passSingleUriContentProperties.length; i++) {
      this.propagatePropertyToElement(
        context,
        element,
        passSingleUriContentProperties[i],
        docFaces
      );
    }
  }

  /**
   * @param column (null when content comes from the content property)
   */
  finishContainer(
    context: exprs.Context,
    container: vtree.Container,
    page: vtree.Page,
    column: vtree.Container,
    columnCount: number,
    clientLayout: vtree.ClientLayout,
    docFaces: DocumentFaces
  ): void {
    if (this.vertical) {
      this.calculatedWidth =
        container.computedBlockSize + container.snapOffsetX;
    } else {
      this.calculatedHeight =
        container.computedBlockSize + container.snapOffsetY;
    }
    const readHeight = (this.vertical || !column) && this.isAutoHeight;
    const readWidth = (!this.vertical || !column) && this.isAutoWidth;
    let bbox = null;
    if (readWidth || readHeight) {
      if (readWidth) {
        base.setCSSProperty(container.element, "width", "auto");
      }
      if (readHeight) {
        base.setCSSProperty(container.element, "height", "auto");
      }
      bbox = clientLayout.getElementClientRect(
        column ? column.element : container.element
      );
      if (readWidth) {
        this.calculatedWidth = Math.ceil(
          bbox.right -
            bbox.left -
            container.paddingLeft -
            container.borderLeft -
            container.paddingRight -
            container.borderRight
        );
        if (this.vertical) {
          this.calculatedWidth += container.snapOffsetX;
        }
      }
      if (readHeight) {
        this.calculatedHeight =
          bbox.bottom -
          bbox.top -
          container.paddingTop -
          container.borderTop -
          container.paddingBottom -
          container.borderBottom;
        if (!this.vertical) {
          this.calculatedHeight += container.snapOffsetY;
        }
      }
    }
    if (this.vertical ? this.isAutoHeight : this.isAutoWidth) {
      this.assignStartEndPosition(context, container);
    }
    if (this.vertical ? this.isAutoWidth : this.isAutoHeight) {
      if (
        this.vertical
          ? this.isRightDependentOnAutoWidth
          : this.isTopDependentOnAutoHeight
      ) {
        this.assignBeforePosition(context, container);
      }
      this.assignAfterPosition(context, container);
    }
    if (columnCount > 1) {
      const ruleWidth = this.getPropAsNumber(context, "column-rule-width");
      const ruleStyle = this.getProp(context, "column-rule-style");
      const ruleColor = this.getProp(context, "column-rule-color");
      if (
        ruleWidth > 0 &&
        ruleStyle &&
        ruleStyle != css.ident.none &&
        ruleColor != css.ident.transparent
      ) {
        const columnGap = this.getPropAsNumber(context, "column-gap");
        const containerSize = this.vertical
          ? container.height
          : container.width;
        const border = this.vertical ? "border-top" : "border-left";
        for (let i = 1; i < columnCount; i++) {
          const pos =
            ((containerSize + columnGap) * i) / columnCount -
            columnGap / 2 +
            container.paddingLeft -
            ruleWidth / 2;
          const size =
            container.height + container.paddingTop + container.paddingBottom;
          const rule = container.element.ownerDocument.createElement("div");
          base.setCSSProperty(rule, "position", "absolute");
          base.setCSSProperty(rule, this.vertical ? "left" : "top", "0px");
          base.setCSSProperty(rule, this.vertical ? "top" : "left", `${pos}px`);
          base.setCSSProperty(rule, this.vertical ? "height" : "width", "0px");
          base.setCSSProperty(
            rule,
            this.vertical ? "width" : "height",
            `${size}px`
          );
          base.setCSSProperty(
            rule,
            border,
            `${ruleWidth}px ${ruleStyle.toString()}${
              ruleColor ? ` ${ruleColor.toString()}` : ""
            }`
          );
          container.element.insertBefore(rule, container.element.firstChild);
        }
      }
    }
    for (let i = 0; i < passPostProperties.length; i++) {
      this.propagateProperty(
        context,
        container,
        passPostProperties[i],
        docFaces
      );
    }
    for (let i = 0; i < delayedProperties.length; i++) {
      this.propagateDelayedProperty(
        context,
        container,
        delayedProperties[i],
        page.delayedItems
      );
    }
  }

  applyCascadeAndInit(
    cascade: csscasc.CascadeInstance,
    docElementStyle: csscasc.ElementStyle
  ): void {
    const style = this.cascaded;
    const specified = this.pageBox.specified;
    for (const name in specified) {
      if (csscasc.isPropName(name)) {
        csscasc.setProp(style, name, csscasc.getProp(specified, name));
      }
    }
    if (this.pageBox.pseudoName == userAgentPageMasterPseudo) {
      for (const name in docElementStyle) {
        if (name.match(/^background-/) || name == "writing-mode") {
          style[name] = docElementStyle[name];
        }
      }
    }
    if (this.pageBox.pseudoName == "layout-host") {
      for (const name in docElementStyle) {
        if (!name.match(/^background-/) && name != "writing-mode") {
          style[name] = docElementStyle[name];
        }
      }
    }
    cascade.pushRule(this.pageBox.classes, null, style);
    if (style["content"]) {
      style["content"] = style["content"].filterValue(
        new csscasc.ContentPropVisitor(cascade, null, cascade.counterResolver)
      );
    }
    this.init(cascade.context);
    for (const child of this.pageBox.children) {
      const childInstance = child.createInstance(this);
      childInstance.applyCascadeAndInit(cascade, docElementStyle);
    }
    cascade.popRule();
  }

  resolveAutoSizing(context: exprs.Context): void {
    // all implicit dependencies are set up at this point
    if (this.isAutoWidth) {
      this.isRightDependentOnAutoWidth =
        this.depends("right", this.autoWidth, context) ||
        this.depends("margin-right", this.autoWidth, context) ||
        this.depends("border-right-width", this.autoWidth, context) ||
        this.depends("padding-right", this.autoWidth, context);
    }
    if (this.isAutoHeight) {
      this.isTopDependentOnAutoHeight =
        this.depends("top", this.autoHeight, context) ||
        this.depends("margin-top", this.autoHeight, context) ||
        this.depends("border-top-width", this.autoHeight, context) ||
        this.depends("padding-top", this.autoHeight, context);
    }
    for (const childInstance of this.children) {
      childInstance.resolveAutoSizing(context);
    }
  }
}

/**
 * Properties that are passed through before the layout.
 */
export const passPreProperties = [
  "border-left-style",
  "border-right-style",
  "border-top-style",
  "border-bottom-style",
  "border-left-color",
  "border-right-color",
  "border-top-color",
  "border-bottom-color",
  "outline-style",
  "outline-color",
  "outline-width",
  "overflow",
  "visibility"
];

/**
 * Properties that are passed through after the layout.
 */
export const passPostProperties = [
  "border-top-left-radius",
  "border-top-right-radius",
  "border-bottom-right-radius",
  "border-bottom-left-radius",
  "border-image-source",
  "border-image-slice",
  "border-image-width",
  "border-image-outset",
  "border-image-repeat",
  "background-attachment",
  "background-color",
  "background-image",
  "background-repeat",
  "background-position",
  "background-clip",
  "background-origin",
  "background-size",
  "opacity",
  "z-index"
];

/**
 * Only passed when there is content assigned by the content property.
 */
export const passContentProperties = [
  "color",
  "font-family",
  "font-size",
  "font-style",
  "font-weight",
  "font-variant",
  "line-height",
  "letter-spacing",
  "text-align",
  "text-decoration",
  "text-indent",
  "text-transform",
  "white-space",
  "word-spacing"
];

export const passSingleUriContentProperties = ["width", "height"];

export const delayedProperties = ["transform", "transform-origin"];

export const userAgentPageMasterPseudo = "background-host";

export class RootPageBoxInstance extends PageBoxInstance<RootPageBox> {
  constructor(pageBox: RootPageBox) {
    super(null, pageBox);
  }

  /**
   * @override
   */
  applyCascadeAndInit(cascade, docElementStyle) {
    super.applyCascadeAndInit(cascade, docElementStyle);

    // Sort page masters using order and specificity.
    const pageMasters = this.children;
    (pageMasters as PageMasterInstance[]).sort(
      (a, b) =>
        (b.pageBox as any).specificity - (a.pageBox as any).specificity || // probably cause NaN
        a.pageBox.index - b.pageBox.index
    );
  }
}

export class PageMasterInstance<
  P extends PageMaster = PageMaster<PageMasterInstance<any>>
> extends PageBoxInstance<P> {
  pageMasterInstance: any;

  constructor(parentInstance: PageBoxInstance, pageBox: P) {
    super(parentInstance, pageBox);
    this.pageMasterInstance = this;
  }

  /**
   * @override
   */
  boxSpecificEnabled(enabled) {
    const pageMaster = this.pageBox.pageMaster;
    if (pageMaster.condition) {
      enabled = exprs.and(pageMaster.scope, enabled, pageMaster.condition);
    }
    return enabled;
  }

  /**
   * Called after layout of contents of the page has done to adjust the overall
   * page layout. Override in subclasses.
   */
  adjustPageLayout(
    context: exprs.Context,
    page: vtree.Page,
    clientLayout: vtree.ClientLayout
  ) {}
}

export class PartitionGroupInstance extends PageBoxInstance<PartitionGroup> {
  pageMasterInstance: any;

  constructor(parentInstance: PageBoxInstance, pageBox: PageBox) {
    super(parentInstance, pageBox);
    this.pageMasterInstance = parentInstance.pageMasterInstance;
  }
}

export class PartitionInstance<
  P extends Partition = Partition<PartitionInstance<any>>
> extends PageBoxInstance<P> {
  pageMasterInstance: any;

  constructor(parentInstance: PageBoxInstance, pageBox: P) {
    super(parentInstance, pageBox);
    this.pageMasterInstance = parentInstance.pageMasterInstance;
  }

  processPartitionList(
    enabled: exprs.Val,
    listVal: css.Val,
    conflicting: boolean
  ): exprs.Val {
    let list = null;
    if (listVal instanceof css.Ident) {
      list = [listVal];
    }
    if (listVal instanceof css.CommaList) {
      list = (listVal as css.CommaList).values;
    }
    if (list) {
      const scope = this.pageBox.scope;
      for (let i = 0; i < list.length; i++) {
        if (list[i] instanceof css.Ident) {
          const qname = exprs.makeQualifiedName(
            (list[i] as css.Ident).name,
            "enabled"
          );
          let term: exprs.Val = new exprs.Named(scope, qname);
          if (conflicting) {
            term = new exprs.Not(scope, term);
          }
          enabled = exprs.and(scope, enabled, term);
        }
      }
    }
    return enabled;
  }

  /**
   * @override
   */
  boxSpecificEnabled(enabled) {
    const scope = this.pageBox.scope;
    const style = this.style;
    const required =
      toExprBool(scope, style["required"], scope._false) !== scope._false;
    if (required || this.isAutoHeight) {
      const flowName = toExprIdent(scope, style["flow-from"], "body");
      const hasContent = new exprs.Call(scope, "has-content", [flowName]);
      enabled = exprs.and(scope, enabled, hasContent);
    }
    enabled = this.processPartitionList(
      enabled,
      style["required-partitions"],
      false
    );
    enabled = this.processPartitionList(
      enabled,
      style["conflicting-partitions"],
      true
    );
    if (required) {
      const pmEnabledVal = this.pageMasterInstance.style["enabled"];
      let pmEnabled = pmEnabledVal
        ? pmEnabledVal.toExpr(scope, null)
        : scope._true;
      pmEnabled = exprs.and(scope, pmEnabled, enabled);
      this.pageMasterInstance.style["enabled"] = new css.Expr(pmEnabled);
    }
    return enabled;
  }

  /**
   * @override
   */
  prepareContainer(context, container, delayedItems, docFaces, clientLayout) {
    base.setCSSProperty(container.element, "overflow", "hidden"); // default value
    super.prepareContainer(
      context,
      container,
      delayedItems,
      docFaces,
      clientLayout
    );
  }
}

//--------------------- parsing -----------------------
export class PageBoxParserHandler extends cssparse.SlaveParserHandler
  implements PropertyReceiver {
  constructor(
    scope: exprs.LexicalScope,
    owner: DispatchParserHandler,
    public readonly target: PageBox,
    public readonly validatorSet: ValidatorSet
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
  unknownProperty(name, value) {
    this.report(`E_INVALID_PROPERTY ${name}: ${value.toString()}`);
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
  simpleProperty(name, value, important) {
    this.target.specified[name] = new csscasc.CascadeValue(
      value,
      important
        ? cssparse.SPECIFICITY_STYLE
        : cssparse.SPECIFICITY_STYLE_IMPORTANT
    );
  }
}

export class PartitionParserHandler extends PageBoxParserHandler {
  constructor(
    scope: exprs.LexicalScope,
    owner: DispatchParserHandler,
    target: Partition,
    validatorSet: ValidatorSet
  ) {
    super(scope, owner, target, validatorSet);
  }
}

export class PartitionGroupParserHandler extends PageBoxParserHandler {
  constructor(
    scope: exprs.LexicalScope,
    owner: DispatchParserHandler,
    target: PartitionGroup,
    validatorSet: ValidatorSet
  ) {
    super(scope, owner, target, validatorSet);
    target.specified["width"] = new csscasc.CascadeValue(css.hundredPercent, 0);
    target.specified["height"] = new csscasc.CascadeValue(
      css.hundredPercent,
      0
    );
  }

  /**
   * @override
   */
  startPartitionRule(name, pseudoName, classes) {
    const partition = new Partition(
      this.scope,
      name,
      pseudoName,
      classes,
      this.target
    );
    const handler = new PartitionParserHandler(
      this.scope,
      this.owner,
      partition,
      this.validatorSet
    );
    this.owner.pushHandler(handler);
  }

  /**
   * @override
   */
  startPartitionGroupRule(name, pseudoName, classes) {
    const partitionGroup = new PartitionGroup(
      this.scope,
      name,
      pseudoName,
      classes,
      this.target
    );
    const handler = new PartitionGroupParserHandler(
      this.scope,
      this.owner,
      partitionGroup,
      this.validatorSet
    );
    this.owner.pushHandler(handler);
  }
}

export class PageMasterParserHandler extends PageBoxParserHandler {
  constructor(
    scope: exprs.LexicalScope,
    owner: DispatchParserHandler,
    target: PageMaster,
    validatorSet: ValidatorSet
  ) {
    super(scope, owner, target, validatorSet);
  }

  /**
   * @override
   */
  startPartitionRule(name, pseudoName, classes) {
    const partition = new Partition(
      this.scope,
      name,
      pseudoName,
      classes,
      this.target
    );
    const handler = new PartitionParserHandler(
      this.scope,
      this.owner,
      partition,
      this.validatorSet
    );
    this.owner.pushHandler(handler);
  }

  /**
   * @override
   */
  startPartitionGroupRule(name, pseudoName, classes) {
    const partitionGroup = new PartitionGroup(
      this.scope,
      name,
      pseudoName,
      classes,
      this.target
    );
    const handler = new PartitionGroupParserHandler(
      this.scope,
      this.owner,
      partitionGroup,
      this.validatorSet
    );
    this.owner.pushHandler(handler);
  }
}
