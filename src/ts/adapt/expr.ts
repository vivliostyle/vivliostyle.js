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
 * @fileoverview Exprs - Adaptive Layout expressions.
 */
import * as Base from "./base";

export type Preferences = {
  fontFamily: string;
  lineHeight: number;
  margin: number;
  hyphenate: boolean;
  columnWidth: number;
  horizontal: boolean;
  nightMode: boolean;
  spreadView: boolean;
  pageBorder: number;
  enabledMediaTypes: { [key: string]: boolean };
  defaultPaperSize: { [key: string]: number } | undefined;
};

export const defaultPreferences = (): Preferences => ({
  fontFamily: "serif",
  lineHeight: 1.25,
  margin: 8,
  hyphenate: false,
  columnWidth: 25,
  horizontal: false,
  nightMode: false,
  spreadView: false,
  pageBorder: 1,
  enabledMediaTypes: { vivliostyle: true, print: true },
  defaultPaperSize: undefined
});

export const clonePreferences = (pref: Preferences): Preferences => ({
  fontFamily: pref.fontFamily,
  lineHeight: pref.lineHeight,
  margin: pref.margin,
  hyphenate: pref.hyphenate,
  columnWidth: pref.columnWidth,
  horizontal: pref.horizontal,
  nightMode: pref.nightMode,
  spreadView: pref.spreadView,
  pageBorder: pref.pageBorder,
  enabledMediaTypes: Object.assign({}, pref.enabledMediaTypes),
  defaultPaperSize: pref.defaultPaperSize
    ? Object.assign({}, pref.defaultPaperSize)
    : undefined
});

export const defaultPreferencesInstance = defaultPreferences();

interface Pending {}
type Special = Pending;

/**
 * Special marker value that indicates that the expression result is being
 * calculated.
 */
export const Special = {
  PENDING: {} as Pending
};

export type Result = string | number | boolean | undefined;

export type PendingResult = Special | Result;

export const letterbox = (
  viewW: number,
  viewH: number,
  objW: number,
  objH: number
): string => {
  const scale = Math.min((viewW - 0) / objW, (viewH - 0) / objH);
  return `matrix(${scale},0,0,${scale},0,0)`;
};

/**
 * @return string that can be parsed as CSS string with value str
 */
export const cssString = (str: string): string =>
  `"${Base.escapeCSSStr(`${str}`)}"`;

/**
 * @return string that can be parsed as CSS name
 */
export const cssIdent = (name: string): string =>
  Base.escapeCSSIdent(`${name}`);

export const makeQualifiedName = (
  objName: string | null,
  memberName: string
): string => {
  if (objName) {
    return `${Base.escapeCSSIdent(objName)}.${Base.escapeCSSIdent(memberName)}`;
  }
  return Base.escapeCSSIdent(memberName);
};

export let nextKeyIndex: number = 0;

/**
 * Lexical scope of the expression.
 */
export class LexicalScope {
  scopeKey: string;
  children: LexicalScope[] = [];
  zero: Const;
  one: Const;
  _true: Const;
  _false: Const;
  values: { [key: string]: Val } = {};
  funcs: { [key: string]: Val } = {};
  builtIns: { [key: string]: (...p1: Result[]) => Result } = {};

  constructor(
    public parent: LexicalScope,
    public resolver?: (p1: string, p2: boolean) => Val
  ) {
    this.scopeKey = `S${nextKeyIndex++}`;
    this.zero = new Const(this, 0);
    this.one = new Const(this, 1);
    this._true = new Const(this, true);
    this._false = new Const(this, false);
    if (parent) {
      parent.children.push(this);
    }
    if (!parent) {
      // root scope
      const builtIns = this.builtIns;
      builtIns["floor"] = Math.floor;
      builtIns["ceil"] = Math.ceil;
      builtIns["round"] = Math.round;
      builtIns["sqrt"] = Math.sqrt;
      builtIns["min"] = Math.min;
      builtIns["max"] = Math.max;
      builtIns["letterbox"] = letterbox;
      builtIns["css-string"] = cssString;
      builtIns["css-name"] = cssIdent;
      builtIns["typeof"] = x => typeof x;
      this.defineBuiltInName("page-width", function() {
        return this.pageWidth();
      });
      this.defineBuiltInName("page-height", function() {
        return this.pageHeight();
      });
      this.defineBuiltInName("pref-font-family", function() {
        return this.pref.fontFamily;
      });
      this.defineBuiltInName("pref-night-mode", function() {
        return this.pref.nightMode;
      });
      this.defineBuiltInName("pref-hyphenate", function() {
        return this.pref.hyphenate;
      });
      this.defineBuiltInName("pref-margin", function() {
        return this.pref.margin;
      });
      this.defineBuiltInName("pref-line-height", function() {
        return this.pref.lineHeight;
      });
      this.defineBuiltInName("pref-column-width", function() {
        return this.pref.columnWidth * this.fontSize;
      });
      this.defineBuiltInName("pref-horizontal", function() {
        return this.pref.horizontal;
      });
      this.defineBuiltInName("pref-spread-view", function() {
        return this.pref.spreadView;
      });

      // For env(pub-title) and env(doc-title)
      this.defineBuiltInName("pub-title", function() {
        return cssString(this.pubTitle ? this.pubTitle : "");
      });
      this.defineBuiltInName("doc-title", function() {
        return cssString(this.docTitle ? this.docTitle : "");
      });
    }
  }

  defineBuiltInName(name: string, fn: () => Result) {
    this.values[name] = new Native(this, fn, name);
  }

  defineName(qualifiedName: string, val: Val): void {
    this.values[qualifiedName] = val;
  }

  defineFunc(qualifiedName: string, val: Val): void {
    this.funcs[qualifiedName] = val;
  }

  defineBuiltIn(qualifiedName: string, fn: (...p1: Result[]) => Result): void {
    this.builtIns[qualifiedName] = fn;
  }
}

export const isAbsoluteLengthUnit = (unit: string): boolean => {
  switch (unit.toLowerCase()) {
    case "px":
    case "in":
    case "pt":
    case "pc":
    case "cm":
    case "mm":
    case "q":
      return true;
    default:
      return false;
  }
};

export const isViewportRelativeLengthUnit = (unit: string): boolean => {
  switch (unit.toLowerCase()) {
    case "vw":
    case "vh":
    case "vi":
    case "vb":
    case "vmin":
    case "vmax":
    case "pvw":
    case "pvh":
    case "pvi":
    case "pvb":
    case "pvmin":
    case "pvmax":
      return true;
    default:
      return false;
  }
};

export const isFontRelativeLengthUnit = (unit: string): boolean => {
  switch (unit.toLowerCase()) {
    case "em":
    case "ex":
    case "rem":
      return true;
    default:
      return false;
  }
};

export const defaultUnitSizes: { [key: string]: number } = {
  px: 1,
  in: 96,
  pt: 4 / 3,
  pc: 96 / 6,
  cm: 96 / 2.54,
  mm: 96 / 25.4,
  q: 96 / 2.54 / 40,
  em: 16,
  rem: 16,
  ex: 8,
  // <resolution>
  dppx: 1,
  dpi: 1 / 96,
  dpcm: 2.54 / 96
};

/**
 * Returns if a unit should be converted to px before applied to the raw DOM.
 */
export const needUnitConversion = (unit: string): boolean => {
  switch (unit) {
    case "q":
    case "rem":
      return true;
    default:
      return false;
  }
};

export type ScopeContext = {
  [key: string]: Result;
};

/**
 * Run-time instance of a scope and its children.
 */
export class Context {
  protected actualPageWidth: number | null = null;
  pageWidth: () => number;
  protected actualPageHeight: number | null = null;
  pageHeight: () => number;
  initialFontSize: number;
  rootFontSize: number | null = null;
  fontSize: () => number;
  pref: Preferences;
  scopes: { [key: string]: ScopeContext } = {};
  pageAreaWidth: number | null = null;
  pageAreaHeight: number | null = null;
  pageVertical: boolean | null = null;
  pubTitle: string | null = null;
  docTitle: string | null = null;

  constructor(
    public readonly rootScope: LexicalScope,
    public readonly viewportWidth: number,
    public readonly viewportHeight: number,
    fontSize: number
  ) {
    this.pageWidth = function() {
      if (this.actualPageWidth) {
        return this.actualPageWidth;
      } else {
        return this.pref.spreadView
          ? Math.floor(viewportWidth / 2) - this.pref.pageBorder
          : viewportWidth;
      }
    };
    this.pageHeight = function() {
      if (this.actualPageHeight) {
        return this.actualPageHeight;
      } else {
        return viewportHeight;
      }
    };
    this.initialFontSize = fontSize;
    this.fontSize = function() {
      if (this.rootFontSize) {
        return this.rootFontSize;
      } else {
        return fontSize;
      }
    };
    this.pref = defaultPreferencesInstance;
  }

  private getScopeContext(scope: LexicalScope): ScopeContext {
    let s = this.scopes[scope.scopeKey];
    if (!s) {
      s = {};
      this.scopes[scope.scopeKey] = s;
    }
    return s;
  }

  clearScope(scope: LexicalScope): void {
    this.scopes[scope.scopeKey] = {};
    for (let k = 0; k < scope.children.length; k++) {
      this.clearScope(scope.children[k]);
    }
  }

  queryUnitSize(unit: string, isRoot: boolean): number {
    if (isViewportRelativeLengthUnit(unit)) {
      const pvw = this.pageWidth() / 100;
      const pvh = this.pageHeight() / 100;
      const vw = this.pageAreaWidth != null ? this.pageAreaWidth / 100 : pvw;
      const vh = this.pageAreaHeight != null ? this.pageAreaHeight / 100 : pvh;

      switch (unit) {
        case "vw":
          return vw;
        case "vh":
          return vh;
        case "vi":
          return this.pageVertical ? vh : vw;
        case "vb":
          return this.pageVertical ? vw : vh;
        case "vmin":
          return vw < vh ? vw : vh;
        case "vmax":
          return vw > vh ? vw : vh;
        case "pvw":
          return pvw;
        case "pvh":
          return pvh;
        case "pvi":
          return this.pageVertical ? pvh : pvw;
        case "pvb":
          return this.pageVertical ? pvw : pvh;
        case "pvmin":
          return pvw < pvh ? pvw : pvh;
        case "pvmax":
          return pvw > pvh ? pvw : pvh;
      }
    }
    if (unit == "em" || unit == "rem") {
      return isRoot ? this.initialFontSize : this.fontSize();
    }
    if (unit == "ex") {
      return (
        (defaultUnitSizes["ex"] *
          (isRoot ? this.initialFontSize : this.fontSize())) /
        defaultUnitSizes["em"]
      );
    }
    return defaultUnitSizes[unit];
  }

  evalName(scope: LexicalScope, qualifiedName: string): Val {
    do {
      let val = scope.values[qualifiedName];
      if (val) {
        return val;
      }
      if (scope.resolver) {
        val = scope.resolver.call(this, qualifiedName, false);
        if (val) {
          return val;
        }
      }
      scope = scope.parent;
    } while (scope);
    throw new Error(`Name '${qualifiedName}' is undefined`);
  }

  /**
   * @param noBuiltInEval don't evaluate built-ins (for dependency calculations)
   */
  evalCall(
    scope: LexicalScope,
    qualifiedName: string,
    params: Val[],
    noBuiltInEval: boolean
  ): Val {
    do {
      let body = scope.funcs[qualifiedName];
      if (body) {
        return body; // will be expanded by callee
      }
      if (scope.resolver) {
        body = scope.resolver.call(this, qualifiedName, true);
        if (body) {
          return body;
        }
      }
      const fn = scope.builtIns[qualifiedName];
      if (fn) {
        if (noBuiltInEval) {
          return scope.zero;
        }
        const args = Array(params.length);
        for (let i = 0; i < params.length; i++) {
          args[i] = params[i].evaluate(this);
        }
        return new Const(scope, fn.apply(this, args));
      }
      scope = scope.parent;
    } while (scope);
    throw new Error(`Function '${qualifiedName}' is undefined`);
  }

  evalMediaName(name: string, not: boolean): boolean {
    const enabled = name === "all" || !!this.pref.enabledMediaTypes[name];
    return not ? !enabled : enabled;
  }

  evalMediaTest(feature: string, value: Val): boolean {
    let prefix = "";
    const r = feature.match(/^(min|max)-(.*)$/);
    if (r) {
      prefix = r[1];
      feature = r[2];
    }
    let req = null;
    let actual = null;
    switch (feature) {
      case "width":
      case "height":
      case "device-width":
      case "device-height":
      case "color":
        if (value) {
          req = value.evaluate(this);
        }
        break;
    }
    switch (feature) {
      case "width":
        actual = this.pageWidth();
        break;
      case "height":
        actual = this.pageHeight();
        break;
      case "device-width":
        actual = window.screen.availWidth;
        break;
      case "device-height":
        actual = window.screen.availHeight;
        break;
      case "color":
        actual = window.screen.pixelDepth;
        break;
    }
    if (actual != null && req != null) {
      switch (prefix) {
        case "min":
          return actual >= req;
        case "max":
          return actual <= req;
        default:
          return actual == req;
      }
    } else if (actual != null && value == null) {
      return actual !== 0;
    }
    return false;
  }

  queryVal(scope: LexicalScope, key: string): Result | undefined {
    const s = this.scopes[scope.scopeKey];
    return s ? s[key] : undefined;
  }

  storeVal(scope: LexicalScope, key: string, val: Result): void {
    this.getScopeContext(scope)[key] = val;
  }
}

//---------- name resolution --------------
export type DependencyCache = {
  [key: string]: boolean | Special;
};

export class Val {
  key: string;

  constructor(public scope: LexicalScope) {
    this.scope = scope;
    this.key = `_${nextKeyIndex++}`;
  }

  /**
   * @override
   */
  toString(): string {
    const buf = new Base.StringBuffer();
    this.appendTo(buf, 0);
    return buf.toString();
  }

  appendTo(buf: Base.StringBuffer, priority: number): void {
    throw new Error("F_ABSTRACT");
  }

  protected evaluateCore(context: Context): Result {
    throw new Error("F_ABSTRACT");
  }

  expand(context: Context, params: Val[]): Val {
    return this;
  }

  dependCore(
    other: Val,
    context: Context,
    dependencyCache: DependencyCache
  ): boolean {
    return other === this;
  }

  dependOuter(
    other: Val,
    context: Context,
    dependencyCache: DependencyCache
  ): boolean {
    const cached = dependencyCache[this.key];
    if (cached != null) {
      if (cached === Special.PENDING) {
        return false;
      }
      return cached as boolean;
    } else {
      dependencyCache[this.key] = Special.PENDING;
      const result = this.dependCore(other, context, dependencyCache);
      dependencyCache[this.key] = result;
      return result;
    }
  }

  depend(other: Val, context: Context): boolean {
    return this.dependOuter(other, context, {});
  }

  evaluate(context: Context): Result {
    let result = context.queryVal(this.scope, this.key);
    if (typeof result != "undefined") {
      return result;
    }
    result = this.evaluateCore(context);
    context.storeVal(this.scope, this.key, result);
    return result;
  }

  isMediaName(): boolean {
    return false;
  }
}

export class Prefix extends Val {
  constructor(scope: LexicalScope, public val: Val) {
    super(scope);
  }

  protected getOp(): string {
    throw new Error("F_ABSTRACT");
  }

  evalPrefix(val: Result): Result {
    throw new Error("F_ABSTRACT");
  }

  /**
   * @override
   */
evaluateCore(context: Context): Result {
    const val = this.val.evaluate(context);
    return this.evalPrefix(val);
  }

  /**
   * @override
   */
  dependCore(
    other: Val,
    context: Context,
    dependencyCache: DependencyCache
  ): boolean {
    return (
      other === this || this.val.dependOuter(other, context, dependencyCache)
    );
  }

  /**
   * @override
   */
  appendTo(buf: Base.StringBuffer, priority: number): void {
    if (10 < priority) {
      buf.append("(");
    }
    buf.append(this.getOp());
    this.val.appendTo(buf, 10);
    if (10 < priority) {
      buf.append(")");
    }
  }

  /**
   * @override
   */
  expand(context: Context, params: Val[]): Val {
    const val = this.val.expand(context, params);
    if (val === this.val) {
      return this;
    }
    const r = new (this.constructor as any)(this.scope, val);
    return r;
  }
}

export class Infix extends Val {
  constructor(scope: LexicalScope, public lhs: Val, public rhs: Val) {
    super(scope);
  }

  getPriority(): number {
    throw new Error("F_ABSTRACT");
  }

  getOp(): string {
    throw new Error("F_ABSTRACT");
  }

  evalInfix(lhs: Result, rhs: Result): Result {
    throw new Error("F_ABSTRACT");
  }

  /**
   * @override
   */
evaluateCore(context: Context): Result {
    const lhs = this.lhs.evaluate(context);
    const rhs = this.rhs.evaluate(context);
    return this.evalInfix(lhs, rhs);
  }

  /**
   * @override
   */
  dependCore(
    other: Val,
    context: Context,
    dependencyCache: DependencyCache
  ): boolean {
    return (
      other === this ||
      this.lhs.dependOuter(other, context, dependencyCache) ||
      this.rhs.dependOuter(other, context, dependencyCache)
    );
  }

  /**
   * @override
   */
  appendTo(buf: Base.StringBuffer, priority: number): void {
    const thisPriority = this.getPriority();
    if (thisPriority <= priority) {
      buf.append("(");
    }
    this.lhs.appendTo(buf, thisPriority);
    buf.append(this.getOp());
    this.rhs.appendTo(buf, thisPriority);
    if (thisPriority <= priority) {
      buf.append(")");
    }
  }

  /**
   * @override
   */
  expand(context: Context, params: Val[]): Val {
    const lhs = this.lhs.expand(context, params);
    const rhs = this.rhs.expand(context, params);
    if (lhs === this.lhs && rhs === this.rhs) {
      return this;
    }
    const r = new (this.constructor as any)(this.scope, lhs, rhs);
    return r;
  }
}

export class Logical extends Infix {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  /**
   * @override
   */
  getPriority(): number {
    return 1;
  }
}

export class Comparison extends Infix {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  /**
   * @override
   */
  getPriority(): number {
    return 2;
  }
}

export class Additive extends Infix {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  /**
   * @override
   */
  getPriority(): number {
    return 3;
  }
}

export class Multiplicative extends Infix {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  /**
   * @override
   */
  getPriority(): number {
    return 4;
  }
}

export class Not extends Prefix {
  constructor(scope: LexicalScope, val: Val) {
    super(scope, val);
  }

  /**
   * @override
   */
  getOp(): string {
    return "!";
  }

  /**
   * @override
   */
  evalPrefix(val: Result): Result {
    return !val;
  }
}

export class Negate extends Prefix {
  constructor(scope: LexicalScope, val: Val) {
    super(scope, val);
  }

  /**
   * @override
   */
  getOp(): string {
    return "-";
  }

  /**
   * @override
   */
  evalPrefix(val: Result): Result {
    return -val;
  }
}

export class And extends Logical {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  /**
   * @override
   */
  getOp(): string {
    return "&&";
  }

  /**
   * @override
   */
evaluateCore(context: Context): Result {
    return this.lhs.evaluate(context) && this.rhs.evaluate(context);
  }
}

export class AndMedia extends And {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  /**
   * @override
   */
  getOp(): string {
    return " and ";
  }
}

export class Or extends Logical {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  /**
   * @override
   */
  getOp(): string {
    return "||";
  }

  /**
   * @override
   */
  evaluateCore(context: Context): Result {
    return this.lhs.evaluate(context) || this.rhs.evaluate(context);
  }
}

export class OrMedia extends Or {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  /**
   * @override
   */
  getOp(): string {
    return ", ";
  }
}

export class Lt extends Comparison {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  /**
   * @override
   */
  getOp(): string {
    return "<";
  }

  /**
   * @override
   */
  evalInfix(lhs: Result, rhs: Result): Result {
    return lhs < rhs;
  }
}

export class Le extends Comparison {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  /**
   * @override
   */
  getOp(): string {
    return "<=";
  }

  /**
   * @override
   */
  evalInfix(lhs: Result, rhs: Result): Result {
    return lhs <= rhs;
  }
}

export class Gt extends Comparison {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  /**
   * @override
   */
  getOp(): string {
    return ">";
  }

  /**
   * @override
   */
  evalInfix(lhs: Result, rhs: Result): Result {
    return lhs > rhs;
  }
}

export class Ge extends Comparison {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  /**
   * @override
   */
  getOp(): string {
    return ">=";
  }

  /**
   * @override
   */
  evalInfix(lhs: Result, rhs: Result): Result {
    return lhs >= rhs;
  }
}

export class Eq extends Comparison {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  /**
   * @override
   */
  getOp(): string {
    return "==";
  }

  /**
   * @override
   */
  evalInfix(lhs: Result, rhs: Result): Result {
    return lhs == rhs;
  }
}

export class Ne extends Comparison {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  /**
   * @override
   */
  getOp(): string {
    return "!=";
  }

  /**
   * @override
   */
  evalInfix(lhs: Result, rhs: Result): Result {
    return lhs != rhs;
  }
}

export class Add extends Additive {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  /**
   * @override
   */
  getOp(): string {
    return "+";
  }

  /**
   * @override
   */
  evalInfix(lhs: Result, rhs: Result): Result {
    return (lhs as any) + rhs;
  }
}

export class Subtract extends Additive {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  /**
   * @override
   */
  getOp(): string {
    return " - ";
  }

  /**
   * @override
   */
  evalInfix(lhs: Result, rhs: Result): Result {
    return (lhs as any) - (rhs as any);
  }
}

export class Multiply extends Multiplicative {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  /**
   * @override
   */
  getOp(): string {
    return "*";
  }

  /**
   * @override
   */
  evalInfix(lhs: Result, rhs: Result): Result {
    return (lhs as any) * (rhs as any);
  }
}

export class Divide extends Multiplicative {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  /**
   * @override
   */
  getOp(): string {
    return "/";
  }

  /**
   * @override
   */
  evalInfix(lhs: Result, rhs: Result): Result {
    return (lhs as any) / (rhs as any);
  }
}

export class Modulo extends Multiplicative {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  /**
   * @override
   */
  getOp(): string {
    return "%";
  }

  /**
   * @override
   */
  evalInfix(lhs: Result, rhs: Result): Result {
    return (lhs as any) % (rhs as any);
  }
}

/**
 * Numerical value with a unit.
 */
export class Numeric extends Val {
  unit: string;

  constructor(scope: LexicalScope, public num: number, unit: string) {
    super(scope);
    this.unit = unit.toLowerCase();
  }

  /**
   * @override
   */
  appendTo(buf: Base.StringBuffer, priority: number): void {
    buf.append(this.num.toString());
    buf.append(Base.escapeCSSIdent(this.unit));
  }

  /**
   * @override
   */
evaluateCore(context: Context): Result {
    return this.num * context.queryUnitSize(this.unit, false);
  }
}

/**
 * Named value.
 * @param qualifiedName CSS-escaped name sequence separated by dots.
 */
export class Named extends Val {
  constructor(scope: LexicalScope, public qualifiedName: string) {
    super(scope);
  }

  /**
   * @override
   */
  appendTo(buf: Base.StringBuffer, priority: number): void {
    buf.append(this.qualifiedName);
  }

  /**
   * @override
   */
evaluateCore(context: Context): Result {
    return context.evalName(this.scope, this.qualifiedName).evaluate(context);
  }

  /**
   * @override
   */
  dependCore(
    other: Val,
    context: Context,
    dependencyCache: DependencyCache
  ): boolean {
    return (
      other === this ||
      context
        .evalName(this.scope, this.qualifiedName)
        .dependOuter(other, context, dependencyCache)
    );
  }
}

/**
 * Named value.
 */
export class MediaName extends Val {
  // FIXME: This property is added to reduce TypeScript error on `dependCore`
  // but it is never initialized. Is it really correct code?
  value: Val;

  constructor(scope: LexicalScope, public not: boolean, public name: string) {
    super(scope);
  }

  /**
   * @override
   */
  appendTo(buf: Base.StringBuffer, priority: number): void {
    if (this.not) {
      buf.append("not ");
    }
    buf.append(Base.escapeCSSIdent(this.name));
  }

  /**
   * @override
   */
evaluateCore(context: Context): Result {
    return context.evalMediaName(this.name, this.not);
  }

  /**
   * @override
   */
  dependCore(
    other: Val,
    context: Context,
    dependencyCache: DependencyCache
  ): boolean {
    return (
      other === this || this.value.dependOuter(other, context, dependencyCache)
    );
  }

  /**
   * @override
   */
  isMediaName(): boolean {
    return true;
  }
}

/**
 * A value that is calculated by calling a JavaScript function. Note that the
 * result is cached and this function will be called only once between any
 * clears for its scope in the context.
 * @param fn function to call.
 * @param str a way to represent this value in toString() call.
 */
export class Native extends Val {
  constructor(
    scope: LexicalScope,
    public fn: () => Result,
    public str: string
  ) {
    super(scope);
  }

  /**
   * @override
   */
  appendTo(buf: Base.StringBuffer, priority: number): void {
    buf.append(this.str);
  }

  /**
   * @override
   */
evaluateCore(context: Context): Result {
    return this.fn.call(context);
  }
}

export const appendValArray = (buf: Base.StringBuffer, arr: Val[]): void => {
  buf.append("(");
  for (let i = 0; i < arr.length; i++) {
    if (i) {
      buf.append(",");
    }
    arr[i].appendTo(buf, 0);
  }
  buf.append(")");
};

export const expandValArray = (
  context: Context,
  arr: Val[],
  params: Val[]
): Val[] => {
  let expanded: Val[] = arr;
  for (let i = 0; i < arr.length; i++) {
    const p = arr[i].expand(context, params);
    if (arr !== expanded) {
      expanded[i] = p;
    } else if (p !== arr[i]) {
      expanded = Array(arr.length);
      for (let j = 0; j < i; j++) {
        expanded[j] = arr[j];
      }
      expanded[i] = p;
    }
  }
  return expanded;
};

export const evalValArray = (context: Context, arr: Val[]): Result[] => {
  const result: Result[] = Array(arr.length);
  for (let i = 0; i < arr.length; i++) {
    result[i] = arr[i].evaluate(context);
  }
  return result;
};

export class Call extends Val {
  constructor(
    scope: LexicalScope,
    public qualifiedName: string,
    public params: Val[]
  ) {
    super(scope);
  }

  /**
   * @override
   */
  appendTo(buf: Base.StringBuffer, priority: number): void {
    buf.append(this.qualifiedName);
    appendValArray(buf, this.params);
  }

  /**
   * @override
   */
evaluateCore(context: Context): Result {
    const body = context.evalCall(
      this.scope,
      this.qualifiedName,
      this.params,
      false
    );
    return body.expand(context, this.params).evaluate(context);
  }

  /**
   * @override
   */
  dependCore(
    other: Val,
    context: Context,
    dependencyCache: DependencyCache
  ): boolean {
    if (other === this) {
      return true;
    }
    for (let i = 0; i < this.params.length; i++) {
      if (this.params[i].dependOuter(other, context, dependencyCache)) {
        return true;
      }
    }
    const body = context.evalCall(
      this.scope,
      this.qualifiedName,
      this.params,
      true
    );

    // No expansion here!
    return body.dependOuter(other, context, dependencyCache);
  }

  /**
   * @override
   */
  expand(context: Context, params: Val[]): Val {
    const expandedParams = expandValArray(context, this.params, params);
    if (expandedParams === this.params) {
      return this;
    }
    return new Call(this.scope, this.qualifiedName, expandedParams);
  }
}

export class Cond extends Val {
  constructor(
    scope: LexicalScope,
    public cond: Val,
    public ifTrue: Val,
    public ifFalse: Val
  ) {
    super(scope);
  }

  /**
   * @override
   */
  appendTo(buf: Base.StringBuffer, priority: number): void {
    if (priority > 0) {
      buf.append("(");
    }
    this.cond.appendTo(buf, 0);
    buf.append("?");
    this.ifTrue.appendTo(buf, 0);
    buf.append(":");
    this.ifFalse.appendTo(buf, 0);
    if (priority > 0) {
      buf.append(")");
    }
  }

  /**
   * @override
   */
evaluateCore(context: Context): Result {
    if (this.cond.evaluate(context)) {
      return this.ifTrue.evaluate(context);
    } else {
      return this.ifFalse.evaluate(context);
    }
  }

  /**
   * @override
   */
  dependCore(
    other: Val,
    context: Context,
    dependencyCache: DependencyCache
  ): boolean {
    return (
      other === this ||
      this.cond.dependOuter(other, context, dependencyCache) ||
      this.ifTrue.dependOuter(other, context, dependencyCache) ||
      this.ifFalse.dependOuter(other, context, dependencyCache)
    );
  }

  /**
   * @override
   */
  expand(context: Context, params: Val[]): Val {
    const cond = this.cond.expand(context, params);
    const ifTrue = this.ifTrue.expand(context, params);
    const ifFalse = this.ifFalse.expand(context, params);
    if (
      cond === this.cond &&
      ifTrue === this.ifTrue &&
      ifFalse === this.ifFalse
    ) {
      return this;
    }
    const r = new Cond(this.scope, cond, ifTrue, ifFalse);
    return r;
  }
}

export class Const extends Val {
  constructor(scope: LexicalScope, public val: Result) {
    super(scope);
  }

  /**
   * @override
   */
  appendTo(buf: Base.StringBuffer, priority: number): void {
    switch (typeof this.val) {
      case "number":
      case "boolean":
        buf.append(this.val.toString());
        break;
      case "string":
        buf.append('"');
        buf.append(Base.escapeCSSStr(this.val));
        buf.append('"');
        break;
      default:
        throw new Error("F_UNEXPECTED_STATE");
    }
  }

  /**
   * @override
   */
evaluateCore(context: Context): Result {
    return this.val;
  }
}

export class MediaTest extends Val {
  constructor(scope: LexicalScope, public name: MediaName, public value: Val) {
    super(scope);
  }

  /**
   * @override
   */
  appendTo(buf: Base.StringBuffer, priority: number): void {
    buf.append("(");
    buf.append(Base.escapeCSSStr(this.name.name));
    buf.append(":");
    this.value.appendTo(buf, 0);
    buf.append(")");
  }

  /**
   * @override
   */
evaluateCore(context: Context): Result {
    return context.evalMediaTest(this.name.name, this.value);
  }

  /**
   * @override
   */
  dependCore(
    other: Val,
    context: Context,
    dependencyCache: DependencyCache
  ): boolean {
    return (
      other === this || this.value.dependOuter(other, context, dependencyCache)
    );
  }

  /**
   * @override
   */
  expand(context: Context, params: Val[]): Val {
    const value = this.value.expand(context, params);
    if (value === this.value) {
      return this;
    }
    const r = new MediaTest(this.scope, this.name, value);
    return r;
  }
}

export class Param extends Val {
  constructor(scope: LexicalScope, public index: number) {
    super(scope);
  }

  /**
   * @override
   */
  appendTo(buf: Base.StringBuffer, priority: number): void {
    buf.append("$");
    buf.append(this.index.toString());
  }

  /**
   * @override
   */
  expand(context: Context, params: Val[]): Val {
    const v = params[this.index];
    if (!v) {
      throw new Error(`Parameter missing: ${this.index}`);
    }
    return v as Val;
  }
}

export const and = (scope: LexicalScope, v1: Val, v2: Val): Val => {
  if (
    v1 === scope._false ||
    v1 === scope.zero ||
    v2 == scope._false ||
    v2 == scope.zero
  ) {
    return scope._false;
  }
  if (v1 === scope._true || v1 === scope.one) {
    return v2;
  }
  if (v2 === scope._true || v2 === scope.one) {
    return v1;
  }
  return new And(scope, v1, v2);
};

export const add = (scope: LexicalScope, v1: Val, v2: Val): Val => {
  if (v1 === scope.zero) {
    return v2;
  }
  if (v2 === scope.zero) {
    return v1;
  }
  return new Add(scope, v1, v2);
};

export const sub = (scope: LexicalScope, v1: Val, v2: Val): Val => {
  if (v1 === scope.zero) {
    return new Negate(scope, v2);
  }
  if (v2 === scope.zero) {
    return v1;
  }
  return new Subtract(scope, v1, v2);
};

export const mul = (scope: LexicalScope, v1: Val, v2: Val): Val => {
  if (v1 === scope.zero || v2 === scope.zero) {
    return scope.zero;
  }
  if (v1 === scope.one) {
    return v2;
  }
  if (v2 === scope.one) {
    return v1;
  }
  return new Multiply(scope, v1, v2);
};

export const div = (scope: LexicalScope, v1: Val, v2: Val): Val => {
  if (v1 === scope.zero) {
    return scope.zero;
  }
  if (v2 === scope.one) {
    return v1;
  }
  return new Divide(scope, v1, v2);
};
