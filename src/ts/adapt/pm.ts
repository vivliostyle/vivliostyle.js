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
 * @fileoverview Pm - Deal with page masters, partition groups, and partitions.
 */
import * as Base from "./base";
import * as Css from "./css";
import * as CssCasc from "./csscasc";
import * as CssParse from "./cssparse";
import * as CssValid from "./cssvalid";
import * as Exprs from "./expr";
import * as Font from "./font";
import * as Vtree from "./vtree";

export let keyCount: number = 1;

/**
 * Represent an at-rule which creates a page-level CSS box (page-master,
 * partition, and partition-group).
 */
export abstract class PageBox<
  I extends PageBoxInstance = PageBoxInstance<any>
> {
  // styles specified in the at-rule
  specified: CssCasc.ElementStyle = {};
  children: PageBox[] = [];
  pageMaster: PageMaster = null;
  index: number = 0;
  key: string;

  protected _scope: Exprs.LexicalScope;

  get scope(): Exprs.LexicalScope {
    return this._scope;
  }

  constructor(
    scope: Exprs.LexicalScope,
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
  constructor(scope: Exprs.LexicalScope) {
    super(scope, null, null, [], null);
    this.specified["width"] = new CssCasc.CascadeValue(Css.fullWidth, 0);
    this.specified["height"] = new CssCasc.CascadeValue(Css.fullHeight, 0);
  }
}

export class PageMasterScope extends Exprs.LexicalScope {
  constructor(scope: Exprs.LexicalScope, public pageMaster: PageMaster) {
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
  pageMaster: PageMaster;
  keyMap: { [key: string]: string } = {};

  constructor(
    scope: Exprs.LexicalScope,
    name: string | null,
    pseudoName: string | null,
    classes: string[],
    parent: RootPageBox,
    public readonly condition: Exprs.Val,
    public readonly specificity: number
  ) {
    super(scope, name, pseudoName, classes, parent);
    // if PageMasterScope object is passed, use (share) it.
    if (!(scope instanceof PageMasterScope)) {
      this._scope = new PageMasterScope(scope, this);
    }
    this.pageMaster = this;
    this.specified["width"] = new CssCasc.CascadeValue(Css.fullWidth, 0);
    this.specified["height"] = new CssCasc.CascadeValue(Css.fullHeight, 0);
    this.specified["wrap-flow"] = new CssCasc.CascadeValue(Css.ident.auto, 0);
    this.specified["position"] = new CssCasc.CascadeValue(
      Css.ident.relative,
      0
    );
    this.specified["overflow"] = new CssCasc.CascadeValue(Css.ident.visible, 0);

    // Shift 1px to workaround Chrome printing bug
    // this.specified["top"] = new CssCasc.CascadeValue(new Css.Numeric(-1, "px"), 0);
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
   * scope with the original page master. Since every Exprs.Val which the
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
  pageMaster: PageMaster;

  constructor(
    scope: Exprs.LexicalScope,
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
    this.specified["wrap-flow"] = new CssCasc.CascadeValue(Css.ident.auto, 0);
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
  pageMaster: PageMaster;

  constructor(
    scope: Exprs.LexicalScope,
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
  scope: Exprs.LexicalScope,
  val: Css.Val,
  def: string
): Exprs.Val => {
  if (!val) {
    return new Exprs.Const(scope, def);
  }
  return val.toExpr(scope, scope.zero);
};

export const toExprAuto = (
  scope: Exprs.LexicalScope,
  val: Css.Val,
  ref: Exprs.Val
): Exprs.Val => {
  if (!val || val === Css.ident.auto) {
    return null;
  }
  return val.toExpr(scope, ref);
};

export const toExprNormal = (
  scope: Exprs.LexicalScope,
  val: Css.Val,
  ref: Exprs.Val
): Exprs.Val => {
  if (!val || val === Css.ident.normal) {
    return null;
  }
  return val.toExpr(scope, ref);
};

export const toExprZero = (
  scope: Exprs.LexicalScope,
  val: Css.Val,
  ref: Exprs.Val
): Exprs.Val => {
  if (!val || val === Css.ident.auto) {
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
  scope: Exprs.LexicalScope,
  val: Css.Val,
  ref: Exprs.Val
): Exprs.Val => {
  if (!val) {
    return scope.zero;
  } else if (val === Css.ident.auto) {
    return null;
  } else {
    return val.toExpr(scope, ref);
  }
};

export const toExprZeroBorder = (
  scope: Exprs.LexicalScope,
  val: Css.Val,
  styleVal: Css.Val,
  ref: Exprs.Val
): Exprs.Val => {
  if (!val || styleVal === Css.ident.none) {
    return scope.zero;
  }
  return val.toExpr(scope, ref);
};

export const toExprBool = (
  scope: Exprs.LexicalScope,
  val: Css.Val,
  def: Exprs.Val
): Exprs.Val => {
  if (!val) {
    return def;
  }
  if (val === Css.ident._true) {
    return scope._true;
  }
  if (val === Css.ident._false) {
    return scope._false;
  }
  return val.toExpr(scope, scope.zero);
};

export interface InstanceHolder extends Exprs.Context {
  registerInstance(key: string, instance: PageBoxInstance): void;

  /**
   * @return instance
   */
  lookupInstance(key: string): PageBoxInstance;
}

export class PageBoxInstance<P extends PageBox = PageBox<any>> {
  /**
   * cascaded styles, geometric ones converted to Css.Expr
   */
  protected cascaded: CssCasc.ElementStyle = {};
  style: { [key: string]: Css.Val } = {};
  private autoWidth: Exprs.Native = null;
  private autoHeight: Exprs.Native = null;
  children: PageBoxInstance[] = [];
  isAutoWidth: boolean = false;
  isAutoHeight: boolean = false;
  isTopDependentOnAutoHeight: boolean = false;
  isRightDependentOnAutoWidth: boolean = false;
  private calculatedWidth: number = 0;
  private calculatedHeight: number = 0;
  pageMasterInstance: PageMasterInstance = null;
  namedValues: { [key: string]: Exprs.Val } = {};
  namedFuncs: { [key: string]: Exprs.Val } = {};
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

  private addNamedValues(name1: string, name2: string): Exprs.Val {
    const v1 = this.resolveName(name1);
    const v2 = this.resolveName(name2);
    if (!v1 || !v2) {
      throw new Error("E_INTERNAL");
    }
    return Exprs.add(this.pageBox.scope, v1, v2);
  }

  resolveName(name: string): Exprs.Val {
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
          ? CssCasc.couplingMapVert
          : CssCasc.couplingMapHor;
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
        const count = new Exprs.Param(scope, 0);
        const columnCount = this.resolveName("column-count");
        const columnWidth = this.resolveName("column-width");
        const columnGap = this.resolveName("column-gap");
        expr = Exprs.sub(
          scope,
          Exprs.mul(
            scope,
            new Exprs.Call(scope, "min", [count, columnCount]),
            Exprs.add(scope, columnWidth, columnGap)
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
      const currentPage = new Exprs.Named(scope, "page-number");
      enabled = Exprs.and(
        scope,
        enabled,
        new Exprs.Eq(scope, page, currentPage)
      );
    }
    const minPageWidth = toExprAuto(scope, style["min-page-width"], scope.zero);
    if (minPageWidth) {
      enabled = Exprs.and(
        scope,
        enabled,
        new Exprs.Ge(scope, new Exprs.Named(scope, "page-width"), minPageWidth)
      );
    }
    const minPageHeight = toExprAuto(
      scope,
      style["min-page-height"],
      scope.zero
    );
    if (minPageHeight) {
      enabled = Exprs.and(
        scope,
        enabled,
        new Exprs.Ge(
          scope,
          new Exprs.Named(scope, "page-height"),
          minPageHeight
        )
      );
    }
    enabled = this.boxSpecificEnabled(enabled);
    style["enabled"] = new Css.Expr(enabled);
  }

  protected boxSpecificEnabled(enabled: Exprs.Val): Exprs.Val {
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
    const leftBP = Exprs.add(scope, borderLeftWidth, paddingLeft);
    const rightBP = Exprs.add(scope, borderLeftWidth, paddingRight);
    if (left && right && width) {
      let extra = Exprs.sub(
        scope,
        parentWidth,
        Exprs.add(
          scope,
          width,
          Exprs.add(scope, Exprs.add(scope, left, leftBP), rightBP)
        )
      );
      if (!marginLeft) {
        extra = Exprs.sub(scope, extra, right);
        if (!marginRight) {
          marginLeft = Exprs.mul(scope, extra, new Exprs.Const(scope, 0.5));
          marginRight = marginLeft;
        } else {
          marginLeft = Exprs.sub(scope, extra, marginRight);
        }
      } else {
        if (!marginRight) {
          marginRight = Exprs.sub(
            scope,
            extra,
            Exprs.add(scope, right, marginLeft)
          );
        } else {
          // overconstraint
          right = Exprs.sub(scope, extra, marginRight);
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
      const remains = Exprs.sub(
        scope,
        parentWidth,
        Exprs.add(
          scope,
          Exprs.add(scope, marginLeft, leftBP),
          Exprs.add(scope, marginRight, rightBP)
        )
      );
      if (this.isAutoWidth) {
        if (!maxWidth) {
          // TODO: handle the case when right/left depends on width
          maxWidth = Exprs.sub(scope, remains, left ? left : right);
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
        left = Exprs.sub(scope, remains, Exprs.add(scope, right, width));
      } else if (!width) {
        width = Exprs.sub(scope, remains, Exprs.add(scope, left, right));
      } else if (!right) {
        right = Exprs.sub(scope, remains, Exprs.add(scope, left, width));
      }
    }

    // snap-width is inherited
    const snapWidthVal =
      style["snap-width"] ||
      (this.parentInstance ? this.parentInstance.style["snap-width"] : null);
    const snapWidth = toExprZero(scope, snapWidthVal, parentWidth);
    style["left"] = new Css.Expr(left);
    style["margin-left"] = new Css.Expr(marginLeft);
    style["border-left-width"] = new Css.Expr(borderLeftWidth);
    style["padding-left"] = new Css.Expr(paddingLeft);
    style["width"] = new Css.Expr(width);
    style["max-width"] = new Css.Expr(maxWidth ? maxWidth : width);
    style["padding-right"] = new Css.Expr(paddingRight);
    style["border-right-width"] = new Css.Expr(borderRightWidth);
    style["margin-right"] = new Css.Expr(marginRight);
    style["right"] = new Css.Expr(right);
    style["snap-width"] = new Css.Expr(snapWidth);
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
    const topBP = Exprs.add(scope, borderTopWidth, paddingTop);
    const bottomBP = Exprs.add(scope, borderBottomWidth, paddingBottom);
    if (top && bottom && height) {
      let extra = Exprs.sub(
        scope,
        parentHeight,
        Exprs.add(
          scope,
          height,
          Exprs.add(scope, Exprs.add(scope, top, topBP), bottomBP)
        )
      );
      if (!marginTop) {
        extra = Exprs.sub(scope, extra, bottom);
        if (!marginBottom) {
          marginTop = Exprs.mul(scope, extra, new Exprs.Const(scope, 0.5));
          marginBottom = marginTop;
        } else {
          marginTop = Exprs.sub(scope, extra, marginBottom);
        }
      } else {
        if (!marginBottom) {
          marginBottom = Exprs.sub(
            scope,
            extra,
            Exprs.add(scope, bottom, marginTop)
          );
        } else {
          // overconstraint
          bottom = Exprs.sub(scope, extra, marginTop);
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
      const remains = Exprs.sub(
        scope,
        parentHeight,
        Exprs.add(
          scope,
          Exprs.add(scope, marginTop, topBP),
          Exprs.add(scope, marginBottom, bottomBP)
        )
      );
      if (this.isAutoHeight) {
        if (!maxHeight) {
          // TODO: handle the case when top/bottom depends on height
          maxHeight = Exprs.sub(scope, remains, top ? top : bottom);
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
        top = Exprs.sub(scope, remains, Exprs.add(scope, bottom, height));
      } else if (!height) {
        height = Exprs.sub(scope, remains, Exprs.add(scope, bottom, top));
      } else if (!bottom) {
        bottom = Exprs.sub(scope, remains, Exprs.add(scope, top, height));
      }
    }

    // snap-height is inherited
    const snapHeightVal =
      style["snap-height"] ||
      (this.parentInstance ? this.parentInstance.style["snap-height"] : null);
    const snapHeight = toExprZero(scope, snapHeightVal, parentWidth);
    style["top"] = new Css.Expr(top);
    style["margin-top"] = new Css.Expr(marginTop);
    style["border-top-width"] = new Css.Expr(borderTopWidth);
    style["padding-top"] = new Css.Expr(paddingTop);
    style["height"] = new Css.Expr(height);
    style["max-height"] = new Css.Expr(maxHeight ? maxHeight : height);
    style["padding-bottom"] = new Css.Expr(paddingBottom);
    style["border-bottom-width"] = new Css.Expr(borderBottomWidth);
    style["margin-bottom"] = new Css.Expr(marginBottom);
    style["bottom"] = new Css.Expr(bottom);
    style["snap-height"] = new Css.Expr(snapHeight);
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
      columnGap = new Exprs.Numeric(scope, 1, "em");
    }
    if (columnWidth && !columnCount) {
      columnCount = new Exprs.Call(scope, "floor", [
        Exprs.div(
          scope,
          Exprs.add(scope, width, columnGap),
          Exprs.add(scope, columnWidth, columnGap)
        )
      ]);
      columnCount = new Exprs.Call(scope, "max", [scope.one, columnCount]);
    }
    if (!columnCount) {
      columnCount = scope.one;
    }
    columnWidth = Exprs.sub(
      scope,
      Exprs.div(scope, Exprs.add(scope, width, columnGap), columnCount),
      columnGap
    );
    style["column-width"] = new Css.Expr(columnWidth);
    style["column-count"] = new Css.Expr(columnCount);
    style["column-gap"] = new Css.Expr(columnGap);
  }

  private depends(
    propName: string,
    val: Exprs.Val,
    context: Exprs.Context
  ): boolean {
    return this.style[propName]
      .toExpr(this.pageBox.scope, null)
      .depend(val, context);
  }

  private init(context: Exprs.Context): void {
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
    const cascMap = CssCasc.flattenCascadedStyle(
      this.cascaded,
      context,
      regionIds,
      false,
      null
    );
    this.vertical = CssCasc.isVertical(
      cascMap,
      context,
      this.parentInstance ? this.parentInstance.vertical : false
    );
    this.rtl = CssCasc.isRtl(
      cascMap,
      context,
      this.parentInstance ? this.parentInstance.rtl : false
    );
    CssCasc.convertToPhysical(
      cascMap,
      style,
      this.vertical,
      this.rtl,
      (name, cascVal) => cascVal.value
    );
    this.autoWidth = new Exprs.Native(
      scope,
      () => self.calculatedWidth,
      "autoWidth"
    );
    this.autoHeight = new Exprs.Native(
      scope,
      () => self.calculatedHeight,
      "autoHeight"
    );
    this.initHorizontal();
    this.initVertical();
    this.initColumns();
    this.initEnabled();
  }

  getProp(context: Exprs.Context, name: string): Css.Val {
    let val = this.style[name];
    if (val) {
      val = CssParse.evaluateCSSToCSS(context, val, name);
    }
    return val;
  }

  getPropAsNumber(context: Exprs.Context, name: string): number {
    let val = this.style[name];
    if (val) {
      val = CssParse.evaluateCSSToCSS(context, val, name);
    }
    return Css.toNumber(val, context);
  }

  getSpecial(context: Exprs.Context, name: string): Css.Val[] {
    const arr = CssCasc.getSpecial(this.cascaded, name);
    if (arr) {
      const result = [] as Css.Val[];
      for (let i = 0; i < arr.length; i++) {
        const v = arr[i].evaluate(context, "");
        if (v && v !== Css.empty) {
          result.push(v);
        }
      }
      if (result.length) {
        return result;
      }
    }
    return null;
  }

  getActiveRegions(context: Exprs.Context): string[] {
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
    context: Exprs.Context,
    container: Vtree.Container,
    name: string,
    docFaces: Font.DocumentFaces
  ): void {
    this.propagatePropertyToElement(context, container.element, name, docFaces);
  }

  propagatePropertyToElement(
    context: Exprs.Context,
    element: Element,
    name: string,
    docFaces: Font.DocumentFaces
  ): void {
    let val = this.getProp(context, name);
    if (val) {
      if (
        val.isNumeric() &&
        Exprs.needUnitConversion((val as Css.Numeric).unit)
      ) {
        val = Css.convertNumericToPx(val, context);
      }
      if (name === "font-family") {
        val = docFaces.filterFontFamily(val);
      }
      Base.setCSSProperty(element, name, val.toString());
    }
  }

  propagateDelayedProperty(
    context: Exprs.Context,
    container: Vtree.Container,
    name: string,
    delayedItems: Vtree.DelayedItem[]
  ): void {
    const val = this.getProp(context, name);
    if (val) {
      delayedItems.push(new Vtree.DelayedItem(container.element, name, val));
    }
  }

  assignLeftPosition(context: Exprs.Context, container: Vtree.Container): void {
    const left = this.getPropAsNumber(context, "left");
    const marginLeft = this.getPropAsNumber(context, "margin-left");
    const paddingLeft = this.getPropAsNumber(context, "padding-left");
    const borderLeftWidth = this.getPropAsNumber(context, "border-left-width");
    const width = this.getPropAsNumber(context, "width");
    container.setHorizontalPosition(left, width);
    Base.setCSSProperty(container.element, "margin-left", `${marginLeft}px`);
    Base.setCSSProperty(container.element, "padding-left", `${paddingLeft}px`);
    Base.setCSSProperty(
      container.element,
      "border-left-width",
      `${borderLeftWidth}px`
    );
    container.marginLeft = marginLeft;
    container.borderLeft = borderLeftWidth;
    container.paddingLeft = paddingLeft;
  }

  assignRightPosition(
    context: Exprs.Context,
    container: Vtree.Container
  ): void {
    const right = this.getPropAsNumber(context, "right");
    const snapWidth = this.getPropAsNumber(context, "snap-height");
    const marginRight = this.getPropAsNumber(context, "margin-right");
    let paddingRight = this.getPropAsNumber(context, "padding-right");
    const borderRightWidth = this.getPropAsNumber(
      context,
      "border-right-width"
    );
    Base.setCSSProperty(container.element, "margin-right", `${marginRight}px`);
    Base.setCSSProperty(
      container.element,
      "padding-right",
      `${paddingRight}px`
    );
    Base.setCSSProperty(
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

  assignTopPosition(context: Exprs.Context, container: Vtree.Container): void {
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
    Base.setCSSProperty(container.element, "top", `${top}px`);
    Base.setCSSProperty(container.element, "margin-top", `${marginTop}px`);
    Base.setCSSProperty(container.element, "padding-top", `${paddingTop}px`);
    Base.setCSSProperty(
      container.element,
      "border-top-width",
      `${borderTopWidth}px`
    );
  }

  assignBottomPosition(
    context: Exprs.Context,
    container: Vtree.Container
  ): void {
    const marginBottom = this.getPropAsNumber(context, "margin-bottom");
    const paddingBottom = this.getPropAsNumber(context, "padding-bottom");
    const borderBottomWidth = this.getPropAsNumber(
      context,
      "border-bottom-width"
    );
    const height =
      this.getPropAsNumber(context, "height") - container.snapOffsetY;
    Base.setCSSProperty(container.element, "height", `${height}px`);
    Base.setCSSProperty(
      container.element,
      "margin-bottom",
      `${marginBottom}px`
    );
    Base.setCSSProperty(
      container.element,
      "padding-bottom",
      `${paddingBottom}px`
    );
    Base.setCSSProperty(
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
    context: Exprs.Context,
    container: Vtree.Container
  ): void {
    if (this.vertical) {
      this.assignRightPosition(context, container);
    } else {
      this.assignTopPosition(context, container);
    }
  }

  assignAfterPosition(
    context: Exprs.Context,
    container: Vtree.Container
  ): void {
    if (this.vertical) {
      this.assignLeftPosition(context, container);
    } else {
      this.assignBottomPosition(context, container);
    }
  }

  assignStartEndPosition(
    context: Exprs.Context,
    container: Vtree.Container
  ): void {
    if (this.vertical) {
      this.assignTopPosition(context, container);
      this.assignBottomPosition(context, container);
    } else {
      this.assignRightPosition(context, container);
      this.assignLeftPosition(context, container);
    }
  }

  sizeWithMaxHeight(context: Exprs.Context, container: Vtree.Container): void {
    Base.setCSSProperty(container.element, "border-top-width", "0px");
    let height = this.getPropAsNumber(context, "max-height");
    if (this.isTopDependentOnAutoHeight) {
      container.setVerticalPosition(0, height);
    } else {
      this.assignTopPosition(context, container);
      height -= container.snapOffsetY;
      container.height = height;
      Base.setCSSProperty(container.element, "height", `${height}px`);
    }
  }

  sizeWithMaxWidth(context: Exprs.Context, container: Vtree.Container): void {
    Base.setCSSProperty(container.element, "border-left-width", "0px");
    let width = this.getPropAsNumber(context, "max-width");
    if (this.isRightDependentOnAutoWidth) {
      container.setHorizontalPosition(0, width);
    } else {
      this.assignRightPosition(context, container);
      width -= container.snapOffsetX;
      container.width = width;
      const right = this.getPropAsNumber(context, "right");
      Base.setCSSProperty(container.element, "right", `${right}px`);
      Base.setCSSProperty(container.element, "width", `${width}px`);
    }
  }

  prepareContainer(
    context: Exprs.Context,
    container: Vtree.Container,
    page: Vtree.Page,
    docFaces: Font.DocumentFaces,
    clientLayout: Vtree.ClientLayout
  ): void {
    if (!this.parentInstance || this.vertical != this.parentInstance.vertical) {
      Base.setCSSProperty(
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
    context: Exprs.Context,
    container: Vtree.Container,
    page: Vtree.Page,
    docFaces: Font.DocumentFaces
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
    context: Exprs.Context,
    element: Element,
    docFaces: Font.DocumentFaces
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
    context: Exprs.Context,
    container: Vtree.Container,
    page: Vtree.Page,
    column: Vtree.Container,
    columnCount: number,
    clientLayout: Vtree.ClientLayout,
    docFaces: Font.DocumentFaces
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
        Base.setCSSProperty(container.element, "width", "auto");
      }
      if (readHeight) {
        Base.setCSSProperty(container.element, "height", "auto");
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
        ruleStyle != Css.ident.none &&
        ruleColor != Css.ident.transparent
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
          Base.setCSSProperty(rule, "position", "absolute");
          Base.setCSSProperty(rule, this.vertical ? "left" : "top", "0px");
          Base.setCSSProperty(rule, this.vertical ? "top" : "left", `${pos}px`);
          Base.setCSSProperty(rule, this.vertical ? "height" : "width", "0px");
          Base.setCSSProperty(
            rule,
            this.vertical ? "width" : "height",
            `${size}px`
          );
          Base.setCSSProperty(
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
    cascade: CssCasc.CascadeInstance,
    docElementStyle: CssCasc.ElementStyle
  ): void {
    const style = this.cascaded;
    const specified = this.pageBox.specified;
    for (const name in specified) {
      if (CssCasc.isPropName(name)) {
        CssCasc.setProp(style, name, CssCasc.getProp(specified, name));
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
        new CssCasc.ContentPropVisitor(cascade, null, cascade.counterResolver)
      );
    }
    this.init(cascade.context);
    for (const child of this.pageBox.children) {
      const childInstance = child.createInstance(this);
      childInstance.applyCascadeAndInit(cascade, docElementStyle);
    }
    cascade.popRule();
  }

  resolveAutoSizing(context: Exprs.Context): void {
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
  "z-index",
  "background-blend-mode",
  "isolation",
  "mix-blend-mode",
  "filter"
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
  "word-spacing",
  "font-feature-settings",
  "font-kerning",
  "font-size-adjust",
  "font-variant-east-asian",
  "font-stretch",
  "text-decoration-color",
  "text-decoration-line",
  "text-decoration-skip",
  "text-decoration-style",
  "text-emphasis",
  "text-emphasis-color",
  "text-emphasis-position",
  "text-emphasis-style",
  "text-shadow",
  "text-underline-position"
];

export const passSingleUriContentProperties = [
  "width",
  "height",
  "image-resolution",
  "object-fit",
  "object-position"
];

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
  pageMasterInstance: PageMasterInstance;

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
      enabled = Exprs.and(pageMaster.scope, enabled, pageMaster.condition);
    }
    return enabled;
  }

  /**
   * Called after layout of contents of the page has done to adjust the overall
   * page layout. Override in subclasses.
   */
  adjustPageLayout(
    context: Exprs.Context,
    page: Vtree.Page,
    clientLayout: Vtree.ClientLayout
  ) {}
}

export class PartitionGroupInstance extends PageBoxInstance<PartitionGroup> {
  pageMasterInstance: PageMasterInstance;

  constructor(parentInstance: PageBoxInstance, pageBox: PageBox) {
    super(parentInstance, pageBox);
    this.pageMasterInstance = parentInstance.pageMasterInstance;
  }
}

export class PartitionInstance<
  P extends Partition = Partition<PartitionInstance<any>>
> extends PageBoxInstance<P> {
  pageMasterInstance: PageMasterInstance;

  constructor(parentInstance: PageBoxInstance, pageBox: P) {
    super(parentInstance, pageBox);
    this.pageMasterInstance = parentInstance.pageMasterInstance;
  }

  processPartitionList(
    enabled: Exprs.Val,
    listVal: Css.Val,
    conflicting: boolean
  ): Exprs.Val {
    let list = null;
    if (listVal instanceof Css.Ident) {
      list = [listVal];
    }
    if (listVal instanceof Css.CommaList) {
      list = (listVal as Css.CommaList).values;
    }
    if (list) {
      const scope = this.pageBox.scope;
      for (let i = 0; i < list.length; i++) {
        if (list[i] instanceof Css.Ident) {
          const qname = Exprs.makeQualifiedName(
            (list[i] as Css.Ident).name,
            "enabled"
          );
          let term: Exprs.Val = new Exprs.Named(scope, qname);
          if (conflicting) {
            term = new Exprs.Not(scope, term);
          }
          enabled = Exprs.and(scope, enabled, term);
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
      const hasContent = new Exprs.Call(scope, "has-content", [flowName]);
      enabled = Exprs.and(scope, enabled, hasContent);
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
      pmEnabled = Exprs.and(scope, pmEnabled, enabled);
      this.pageMasterInstance.style["enabled"] = new Css.Expr(pmEnabled);
    }
    return enabled;
  }

  /**
   * @override
   */
  prepareContainer(context, container, delayedItems, docFaces, clientLayout) {
    Base.setCSSProperty(container.element, "overflow", "hidden"); // default value
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
export class PageBoxParserHandler extends CssParse.SlaveParserHandler
  implements CssValid.PropertyReceiver {
  constructor(
    scope: Exprs.LexicalScope,
    owner: CssParse.DispatchParserHandler,
    public readonly target: PageBox,
    public readonly validatorSet: CssValid.ValidatorSet
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
    this.target.specified[name] = new CssCasc.CascadeValue(
      value,
      important
        ? CssParse.SPECIFICITY_STYLE
        : CssParse.SPECIFICITY_STYLE_IMPORTANT
    );
  }
}

export class PartitionParserHandler extends PageBoxParserHandler {
  constructor(
    scope: Exprs.LexicalScope,
    owner: CssParse.DispatchParserHandler,
    target: Partition,
    validatorSet: CssValid.ValidatorSet
  ) {
    super(scope, owner, target, validatorSet);
  }
}

export class PartitionGroupParserHandler extends PageBoxParserHandler {
  constructor(
    scope: Exprs.LexicalScope,
    owner: CssParse.DispatchParserHandler,
    target: PartitionGroup,
    validatorSet: CssValid.ValidatorSet
  ) {
    super(scope, owner, target, validatorSet);
    target.specified["width"] = new CssCasc.CascadeValue(Css.hundredPercent, 0);
    target.specified["height"] = new CssCasc.CascadeValue(
      Css.hundredPercent,
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
    scope: Exprs.LexicalScope,
    owner: CssParse.DispatchParserHandler,
    target: PageMaster,
    validatorSet: CssValid.ValidatorSet
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
