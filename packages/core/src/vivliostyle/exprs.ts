/**
 * Copyright 2013 Google, Inc.
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
 * @fileoverview Exprs - `-epubx-expr` Adaptive Layout expressions.
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
  defaultPaperSize?: { [key: string]: number };
};

export function defaultPreferences(): Preferences {
  return {
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
    defaultPaperSize: undefined,
  };
}

export function clonePreferences(pref: Preferences): Preferences {
  return {
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
      : undefined,
  };
}

export const defaultPreferencesInstance = defaultPreferences();

interface Pending {}
type Special = Pending;

/**
 * Special marker value that indicates that the expression result is being
 * calculated.
 */
// eslint-disable-next-line no-redeclare
export const Special = {
  PENDING: {} as Pending,
};

export type Result = string | number | boolean | undefined;

export function letterbox(
  viewW: number,
  viewH: number,
  objW: number,
  objH: number,
): string {
  const scale = Math.min((viewW - 0) / objW, (viewH - 0) / objH);
  return `matrix(${scale},0,0,${scale},0,0)`;
}

/**
 * @return string that can be parsed as CSS string with value str
 */
export function cssString(str: string): string {
  return `"${Base.escapeCSSStr(`${str}`)}"`;
}

/**
 * @return string that can be parsed as CSS name
 */
export function cssIdent(name: string): string {
  return Base.escapeCSSIdent(`${name}`);
}

export function makeQualifiedName(
  objName: string | null,
  memberName: string,
): string {
  if (objName) {
    return `${Base.escapeCSSIdent(objName)}.${Base.escapeCSSIdent(memberName)}`;
  }
  return Base.escapeCSSIdent(memberName);
}

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
  values: { [key: string]: Val | null } = {};
  funcs: { [key: string]: Val } = {};
  builtIns: { [key: string]: (...p1: Result[]) => Result } = {};

  constructor(
    public parent: LexicalScope | null,
    public resolver?: (p1: string, p2: boolean) => Val | null,
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
      builtIns["round"] = round;
      builtIns["mod"] = mod;
      builtIns["log"] = log;
      builtIns["clamp"] = clamp;
      builtIns["sqrt"] = Math.sqrt;
      builtIns["min"] = Math.min;
      builtIns["max"] = Math.max;
      // The math functions of CSS Values 4, which the calculations of a CSS
      // value can use: the values are evaluated in px by this expression
      // language, so a function of them returns the px value of the CSS
      // function. Completing the set lets the engine resolve a font size or a
      // line height that a detached descendant resolves against, instead of
      // leaving the whole value to the browser, which would resolve it in the
      // synthetic parent that the element is reparented into. (Review)
      builtIns["abs"] = abs;
      builtIns["sign"] = sign;
      builtIns["hypot"] = hypot;
      builtIns["pow"] = pow;
      builtIns["exp"] = exp;
      builtIns["rem"] = rem;
      builtIns["letterbox"] = letterbox;
      builtIns["css-string"] = cssString;
      builtIns["css-name"] = cssIdent;
      builtIns["typeof"] = (x) => typeof x;
      this.defineBuiltInName("page-width", function () {
        return this.pageWidth();
      });
      this.defineBuiltInName("page-height", function () {
        return this.pageHeight();
      });
      this.defineBuiltInName("pref-font-family", function () {
        return this.pref.fontFamily;
      });
      this.defineBuiltInName("pref-night-mode", function () {
        return this.pref.nightMode;
      });
      this.defineBuiltInName("pref-hyphenate", function () {
        return this.pref.hyphenate;
      });
      this.defineBuiltInName("pref-margin", function () {
        return this.pref.margin;
      });
      this.defineBuiltInName("pref-line-height", function () {
        return this.pref.lineHeight;
      });
      this.defineBuiltInName("pref-column-width", function () {
        return this.pref.columnWidth * this.fontSize;
      });
      this.defineBuiltInName("pref-horizontal", function () {
        return this.pref.horizontal;
      });
      this.defineBuiltInName("pref-spread-view", function () {
        return this.pref.spreadView;
      });

      // For env(pub-title) and env(doc-title)
      this.defineBuiltInName("pub-title", function () {
        return this.pubTitle ? this.pubTitle : "";
      });
      this.defineBuiltInName("doc-title", function () {
        return this.docTitle ? this.docTitle : "";
      });
    }
  }

  defineBuiltInName(name: string, fn: () => Result) {
    this.values[name] = new Native(this, fn, name);
  }

  defineName(qualifiedName: string, val: Val | null): void {
    this.values[qualifiedName] = val;
  }

  defineFunc(qualifiedName: string, val: Val): void {
    this.funcs[qualifiedName] = val;
  }

  defineBuiltIn(qualifiedName: string, fn: (...p1: Result[]) => Result): void {
    this.builtIns[qualifiedName] = fn;
  }
}

export function isAbsoluteLengthUnit(unit: string): boolean {
  switch (unit?.toLowerCase()) {
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
}

export function isViewportRelativeLengthUnit(unit: string): boolean {
  switch (unit?.toLowerCase()) {
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
}

export function isFontRelativeLengthUnit(unit: string): boolean {
  switch (unit?.toLowerCase()) {
    case "em":
    case "rem":
    case "lh":
    case "rlh":
      return true;
    default:
      return false;
  }
}

export function isRootFontRelativeLengthUnit(unit: string): boolean {
  switch (unit?.toLowerCase()) {
    case "rem":
    case "rlh":
      return true;
    default:
      return false;
  }
}

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
  lh: 20,
  rlh: 20,
  // <resolution>
  dppx: 1,
  dpi: 1 / 96,
  dpcm: 2.54 / 96,
};

/**
 * Returns if a unit should be converted to px before applied to the raw DOM.
 */
export function needUnitConversion(unit: string): boolean {
  switch (unit) {
    case "q":
      return !CSS.supports("font-size", "1q");
    case "lh":
      return !CSS.supports("line-height", "1lh");
    case "rem":
    case "rlh":
      return true;
    default:
      return false;
  }
}

/**
 * The arguments of a math function of CSS Values 4 that this expression
 * language evaluates: each of them must have been evaluated to a number other
 * than `NaN` (every dimension is converted to px by this language, and a
 * keyword, such as the `<rounding-strategy>` of `round()`, becomes a media
 * name, which is not a number; a number that overflows to an infinity is kept,
 * because the property clamps it to its range) and their number must be one
 * that the function accepts. Returns null when the call must not be evaluated:
 * the caller then keeps the value unresolved and the browser resolves it.
 * (Review)
 */
function numericArgs(
  args: unknown[],
  min: number,
  max: number,
  allowNaN = false,
): number[] | null {
  if (args.length < min || args.length > max) {
    return null;
  }
  const numbers: number[] = [];
  for (const arg of args) {
    // An infinity is a number that the calculation keeps: the property clamps
    // it to its range, and a nested call such as the `abs()` of
    // `font-weight: abs(exp(1000))` must keep it as well. Only a NaN, a
    // keyword (e.g. the `<rounding-strategy>` of `round()`) and anything that
    // is not a number at all make the call unevaluable. A call whose own
    // function defines how a NaN combines with the other arguments, e.g.
    // `hypot()` where an infinite argument takes precedence, accepts a NaN.
    // (Review)
    if (typeof arg !== "number" || (Number.isNaN(arg) && !allowNaN)) {
      return null;
    }
    numbers.push(arg);
  }
  return numbers;
}

/**
 * The result of a built-in, or NaN to leave the value unresolved. An infinity
 * is kept: CSS Values 4 preserves it through the calculation and clamps it to
 * the computed-value range of the property (e.g. `font-weight: exp(1000)` is
 * 1000), so the callers that cannot represent one reject it themselves.
 * (Review)
 */
function result(value: number): number {
  return Number.isNaN(value) ? NaN : value;
}

/**
 * The `round()` of the stepped value functions of CSS Values 4: with a step,
 * the value is rounded to the nearest integer multiple of it (a value exactly
 * between two multiples is rounded up, which is the default `nearest`
 * strategy); without one, to the nearest integer. A call with a rounding
 * strategy or with an argument that is not a number is left to the browser:
 * this expression language cannot represent the strategy keyword, which it
 * evaluates to a media name. The sign of the step does not matter: its
 * multiples are the multiples of its absolute value, so `round(3.5px, -7px)`
 * is the 7px of the upper multiple, not the -0 that dividing by the negative
 * step gives. (Review)
 */
export function round(...args: unknown[]): number {
  const numbers = numericArgs(args, 1, 2);
  if (!numbers) {
    return NaN;
  }
  const [value, step] = numbers;
  if (step == null) {
    return result(Math.round(value));
  }
  if (step === 0) {
    return NaN;
  }
  if (!Number.isFinite(step)) {
    // An infinite step: a finite value rounds to zero (the `nearest`
    // strategy of CSS Values 4 §10.3.1), while an infinite value is NaN.
    return Number.isFinite(value) ? (value >= 0 ? 0 : -0) : NaN;
  }
  const interval = Math.abs(step);
  return result(Math.round(value / interval) * interval);
}

/**
 * The `mod()` of CSS Values 4: the result has the sign of the divisor, unlike
 * the congruence modulo of the `%` operator of this expression language and of
 * its `rem()`. (Review)
 */
export function mod(...args: unknown[]): number {
  const numbers = numericArgs(args, 2, 2);
  if (!numbers || numbers[1] === 0) {
    return NaN;
  }
  const [a, b] = numbers;
  if (!Number.isFinite(b)) {
    return moduloOfInfiniteDivisor(a, b, true);
  }
  const remainder = a - b * Math.floor(a / b);
  // A remainder of zero has the sign of the divisor as well. The subtraction
  // above loses it for a negative divisor (`mod(0, -8)` becomes `+0`), which a
  // nested calculation can observe, e.g. as `1 / mod(0, -8)` being `-Infinity`
  // instead of `+Infinity`. (Review)
  return result(remainder === 0 && b < 0 ? -0 : remainder);
}

/**
 * The result of `mod()`/`rem()` with an infinite divisor: A is returned as it
 * is, except that `mod()` is NaN when A has the opposite sign of B, including
 * an oppositely signed zero (CSS Values 4 §10.3.1). (Review)
 */
function moduloOfInfiniteDivisor(a: number, b: number, isMod: boolean): number {
  if (!Number.isFinite(a)) {
    return NaN;
  }
  if (isMod) {
    const aSign = a === 0 ? (Object.is(a, -0) ? -1 : 1) : Math.sign(a);
    if (aSign !== Math.sign(b)) {
      return NaN;
    }
  }
  return a;
}

/**
 * The `rem()` of CSS Values 4: the result has the sign of the dividend, like
 * the `%` operator of this expression language. (Review)
 */
export function rem(...args: unknown[]): number {
  const numbers = numericArgs(args, 2, 2);
  if (!numbers || numbers[1] === 0) {
    return NaN;
  }
  const [a, b] = numbers;
  if (!Number.isFinite(b)) {
    return moduloOfInfiniteDivisor(a, b, false);
  }
  return result(a % b);
}

/**
 * The `log()` of CSS Values 4: the natural logarithm, or the given base. A
 * base of 1, 0 or a negative number makes the result NaN (§10.5.1), which the
 * division would not: `Math.log(0)` is -Infinity and the quotient of a
 * positive value by it is the finite -0, which a caller would materialize as a
 * zero, and a base of 1 gives an infinity. (Review)
 */
export function log(...args: unknown[]): number {
  const numbers = numericArgs(args, 1, 2);
  if (!numbers) {
    return NaN;
  }
  const [value, base] = numbers;
  if (base != null && (base <= 0 || base === 1)) {
    return NaN;
  }
  return result(
    base == null ? Math.log(value) : Math.log(value) / Math.log(base),
  );
}

/** The `hypot()` of CSS Values 4. (Review) */
export function hypot(...args: unknown[]): number {
  // An infinite argument takes precedence over a `NaN` one, as `Math.hypot()`
  // implements it: `hypot(exp(1000), log(-1))` is +∞, so a `font-weight` that
  // uses the call is clamped to 1000 instead of inheriting. (Review)
  const numbers = numericArgs(args, 1, Infinity, true);
  return numbers ? result(Math.hypot(...numbers)) : NaN;
}

/**
 * The `clamp()` of CSS Values 4: `max(MIN, min(VAL, MAX))`, so that the minimum
 * takes precedence when the bounds are reversed. (Review)
 */
export function clamp(...args: unknown[]): number {
  const numbers = numericArgs(args, 3, 3);
  if (!numbers) {
    return NaN;
  }
  const [min, value, max] = numbers;
  return result(Math.max(min, Math.min(value, max)));
}

/** The `abs()` of CSS Values 4. (Review) */
export function abs(...args: unknown[]): number {
  const numbers = numericArgs(args, 1, 1);
  return numbers ? result(Math.abs(numbers[0])) : NaN;
}

/** The `sign()` of CSS Values 4, which returns a number. (Review) */
export function sign(...args: unknown[]): number {
  const numbers = numericArgs(args, 1, 1);
  return numbers ? Math.sign(numbers[0]) : NaN;
}

/** The `pow()` of CSS Values 4. (Review) */
export function pow(...args: unknown[]): number {
  const numbers = numericArgs(args, 2, 2);
  return numbers ? result(Math.pow(numbers[0], numbers[1])) : NaN;
}

/** The `exp()` of CSS Values 4. (Review) */
export function exp(...args: unknown[]): number {
  const numbers = numericArgs(args, 1, 1);
  return numbers ? result(Math.exp(numbers[0])) : NaN;
}

export type ScopeContext = Map<string, Result>;

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
  isRelativeRootFontSize: boolean | null = null;
  fontSize: () => number;
  rootLineHeight: number;
  isRootLineHeightFromRelativeCalc: boolean = false;
  pref: Preferences;
  scopes = new Map<string, ScopeContext>();
  pageAreaWidth: number | null = null;
  pageAreaHeight: number | null = null;
  pageVertical: boolean | null = null;
  pubTitle: string | null = null;
  docTitle: string | null = null;

  constructor(
    public readonly rootScope: LexicalScope,
    public readonly viewportWidth: number,
    public readonly viewportHeight: number,
    fontSize: number,
    rootLineHeight: number,
  ) {
    this.pageWidth = function () {
      if (this.actualPageWidth) {
        return this.actualPageWidth;
      } else {
        return this.pref.spreadView
          ? Math.floor(viewportWidth / 2) - this.pref.pageBorder
          : viewportWidth;
      }
    };
    this.pageHeight = function () {
      if (this.actualPageHeight) {
        return this.actualPageHeight;
      } else {
        return viewportHeight;
      }
    };
    this.initialFontSize = fontSize;
    this.rootLineHeight = rootLineHeight;
    this.fontSize = function () {
      if (this.rootFontSize != null) {
        return this.rootFontSize;
      } else {
        return fontSize;
      }
    };
    this.pref = defaultPreferencesInstance;
  }

  private getScopeContext(scope: LexicalScope): ScopeContext {
    let s = this.scopes.get(scope.scopeKey);
    if (!s) {
      s = new Map();
      this.scopes.set(scope.scopeKey, s);
    }
    return s;
  }

  clearScope(scope: LexicalScope): void {
    this.scopes.set(scope.scopeKey, new Map());
    for (let k = 0; k < scope.children.length; k++) {
      this.clearScope(scope.children[k]);
    }
  }

  queryUnitSize(unit: string, isRoot: boolean, vertical?: boolean): number {
    if (isViewportRelativeLengthUnit(unit)) {
      const pvw = this.pageWidth() / 100;
      const pvh = this.pageHeight() / 100;
      const vw = this.pageAreaWidth != null ? this.pageAreaWidth / 100 : pvw;
      const vh = this.pageAreaHeight != null ? this.pageAreaHeight / 100 : pvh;
      const isVertical = vertical ?? this.pageVertical;

      switch (unit) {
        case "vw":
          return vw;
        case "vh":
          return vh;
        case "vi":
          return isVertical ? vh : vw;
        case "vb":
          return isVertical ? vw : vh;
        case "vmin":
          return vw < vh ? vw : vh;
        case "vmax":
          return vw > vh ? vw : vh;
        case "pvw":
          return pvw;
        case "pvh":
          return pvh;
        case "pvi":
          return isVertical ? pvh : pvw;
        case "pvb":
          return isVertical ? pvw : pvh;
        case "pvmin":
          return pvw < pvh ? pvw : pvh;
        case "pvmax":
          return pvw > pvh ? pvw : pvh;
      }
    }
    if (unit == "em" || unit == "rem") {
      return isRoot ? this.initialFontSize : this.fontSize();
    }
    if (unit == "lh" || unit == "rlh") {
      // FIXME: "lh" unit is incorrect, treated same as "rlh"
      return this.rootLineHeight;
    }

    return defaultUnitSizes[unit];
  }

  evalName(scope: LexicalScope, qualifiedName: string): Val {
    let s: LexicalScope | null = scope;
    while (s) {
      let val: Val | null = s.values[qualifiedName];
      if (val) {
        return val;
      }
      if (s.resolver) {
        val = s.resolver.call(this, qualifiedName, false);
        if (val) {
          return val;
        }
      }
      s = s.parent;
    }
    // This engine represents a value that is not finite with the JavaScript
    // name: `Css.Num(Infinity)` serializes as `Infinity`, e.g. the value that
    // `evaluateFontWeightMathFunction()` materializes for
    // `font-weight: calc(exp(1000))` before the range of CSS Fonts 4 clamps
    // it. Such a value is evaluated again when the declaration is validated
    // afterwards, e.g. by `evaluatesToNaN()`, and the `nan` of CSS Values 4 is
    // represented as `NaN` in the same way: recognize both, or the evaluation
    // fails with an undefined name. (Review)
    switch (qualifiedName.toLowerCase()) {
      case "infinity":
        return new Const(scope, Number.POSITIVE_INFINITY);
      case "nan":
        return new Const(scope, Number.NaN);
    }
    throw new Error(`Name '${qualifiedName}' is undefined`);
  }

  /**
   * @param noBuiltInEval don't evaluate built-ins (for dependency calculations)
   */
  evalCall(
    scope: LexicalScope,
    qualifiedName: string,
    params: Val[],
    noBuiltInEval: boolean,
  ): Val {
    let s: LexicalScope | null = scope;
    while (s) {
      let body: Val | null = s.funcs[qualifiedName];
      if (body) {
        return body; // will be expanded by callee
      }
      if (s.resolver) {
        body = s.resolver.call(this, qualifiedName, true);
        if (body) {
          return body;
        }
      }
      const fn = s.builtIns[qualifiedName];
      if (fn) {
        if (noBuiltInEval) {
          return s.zero;
        }
        const args = Array(params.length);
        for (let i = 0; i < params.length; i++) {
          args[i] = params[i].evaluate(this);
        }
        return new Const(s, fn.apply(this, args));
      }
      s = s.parent;
    }
    throw new Error(`Function '${qualifiedName}' is undefined`);
  }

  evalMediaName(name: string, not: boolean): boolean {
    const enabled = name === "all" || !!this.pref.enabledMediaTypes[name];
    return not ? !enabled : enabled;
  }

  private parseMediaFeature(feature: string): {
    feature: string;
    prefix: string;
  } {
    let prefix = "";
    const r = feature.match(/^(min|max)-(.*)$/);
    if (r) {
      prefix = r[1];
      feature = r[2];
    }

    return { feature, prefix };
  }

  private actualMediaFeatureValue(feature: string): number | null {
    switch (feature) {
      case "width":
        return this.pageWidth();
      case "height":
        return this.pageHeight();
      case "device-width":
        return window.screen.availWidth;
      case "device-height":
        return window.screen.availHeight;
      case "color":
        return window.screen.pixelDepth;
      default:
        return null;
    }
  }

  evalMediaBooleanTest(feature: string): boolean {
    const parsedFeature = this.parseMediaFeature(feature);
    const actual = this.actualMediaFeatureValue(parsedFeature.feature);
    return actual != null && actual !== 0;
  }

  evalMediaTest(feature: string, value: Val): boolean {
    const parsedFeature = this.parseMediaFeature(feature);
    const actual = this.actualMediaFeatureValue(parsedFeature.feature);
    if (actual == null) {
      return false;
    }
    const req = value.evaluate(this);
    if (req == null) {
      return false;
    }
    switch (parsedFeature.prefix) {
      case "min":
        return actual >= Number(req);
      case "max":
        return actual <= Number(req);
      default:
        return actual == req;
    }
  }

  evalSupportsTest(name: string, value: string, isFunc: boolean): boolean {
    return false;
  }

  queryVal(scope: LexicalScope, key: string): Result | undefined {
    return this.scopes.get(scope.scopeKey)?.get(key);
  }

  storeVal(scope: LexicalScope, key: string, val: Result): void {
    this.getScopeContext(scope).set(key, val);
  }
}

//---------- name resolution --------------
export type DependencyCache = {
  [key: string]: boolean | Special;
};

export abstract class Val {
  key: string;

  constructor(public readonly scope: LexicalScope) {
    this.key = `_${nextKeyIndex++}`;
  }

  toString(): string {
    const buf = new Base.StringBuffer();
    this.appendTo(buf, 0);
    return buf.toString();
  }

  abstract appendTo(buf: Base.StringBuffer, priority: number): void;

  protected abstract evaluateCore(context: Context): Result;

  expand(context: Context, params: Val[]): Val {
    return this;
  }

  dependCore(
    other: Val,
    context: Context,
    dependencyCache: DependencyCache,
  ): boolean {
    return other === this;
  }

  dependOuter(
    other: Val,
    context: Context,
    dependencyCache: DependencyCache,
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

export abstract class Prefix extends Val {
  constructor(
    scope: LexicalScope,
    public val: Val,
  ) {
    super(scope);
  }

  protected abstract getOp(): string;

  abstract evalPrefix(val: Result): Result;

  override evaluateCore(context: Context): Result {
    const val = this.val.evaluate(context);
    return this.evalPrefix(val);
  }

  override dependCore(
    other: Val,
    context: Context,
    dependencyCache: DependencyCache,
  ): boolean {
    return (
      other === this || this.val.dependOuter(other, context, dependencyCache)
    );
  }

  override appendTo(buf: Base.StringBuffer, priority: number): void {
    if (10 < priority) {
      buf.append("(");
    }
    buf.append(this.getOp());
    this.val.appendTo(buf, 10);
    if (10 < priority) {
      buf.append(")");
    }
  }

  override expand(context: Context, params: Val[]): Val {
    const val = this.val.expand(context, params);
    if (val === this.val) {
      return this;
    }
    const r = new (this.constructor as any)(this.scope, val);
    return r;
  }
}

export abstract class Infix extends Val {
  constructor(
    scope: LexicalScope,
    public lhs: Val,
    public rhs: Val,
  ) {
    super(scope);
  }

  abstract getPriority(): number;

  abstract getOp(): string;

  override dependCore(
    other: Val,
    context: Context,
    dependencyCache: DependencyCache,
  ): boolean {
    return (
      other === this ||
      this.lhs.dependOuter(other, context, dependencyCache) ||
      this.rhs.dependOuter(other, context, dependencyCache)
    );
  }

  override appendTo(buf: Base.StringBuffer, priority: number): void {
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

  override expand(context: Context, params: Val[]): Val {
    const lhs = this.lhs.expand(context, params);
    const rhs = this.rhs.expand(context, params);
    if (lhs === this.lhs && rhs === this.rhs) {
      return this;
    }
    const r = new (this.constructor as any)(this.scope, lhs, rhs);
    return r;
  }
}

export abstract class EagerInfix extends Infix {
  abstract evalInfix(lhs: Result, rhs: Result): Result;

  override evaluateCore(context: Context): Result {
    const lhs = this.lhs.evaluate(context);
    const rhs = this.rhs.evaluate(context);
    return this.evalInfix(lhs, rhs);
  }
}

export abstract class Logical extends Infix {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  override getPriority(): number {
    return 1;
  }
}

export abstract class Comparison extends EagerInfix {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  override getPriority(): number {
    return 2;
  }
}

export abstract class Additive extends EagerInfix {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  override getPriority(): number {
    return 3;
  }
}

export abstract class Multiplicative extends EagerInfix {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  override getPriority(): number {
    return 4;
  }
}

export class Not extends Prefix {
  constructor(scope: LexicalScope, val: Val) {
    super(scope, val);
  }

  override getOp(): string {
    return "!";
  }

  override evalPrefix(val: Result): Result {
    return !val;
  }
}

export class NotMedia extends Not {
  constructor(scope: LexicalScope, val: Val) {
    super(scope, val);
  }

  override getOp(): string {
    return "not ";
  }
}

export class Negate extends Prefix {
  constructor(scope: LexicalScope, val: Val) {
    super(scope, val);
  }

  override getOp(): string {
    return "-";
  }

  override evalPrefix(val: Result): Result {
    return -Number(val);
  }
}

export class And extends Logical {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  override getOp(): string {
    return "&&";
  }

  override evaluateCore(context: Context): Result {
    return this.lhs.evaluate(context) && this.rhs.evaluate(context);
  }
}

export class AndMedia extends And {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  override getOp(): string {
    return " and ";
  }
}

export class Or extends Logical {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  override getOp(): string {
    return "||";
  }

  override evaluateCore(context: Context): Result {
    return this.lhs.evaluate(context) || this.rhs.evaluate(context);
  }
}

export class Comma extends Or {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  override getOp(): string {
    return ", ";
  }
}

export class OrMedia extends Or {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  override getOp(): string {
    return " or ";
  }
}

export class Lt extends Comparison {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  override getOp(): string {
    return "<";
  }

  override evalInfix(lhs: Result, rhs: Result): Result {
    return typeof lhs === "string" && typeof rhs === "string"
      ? lhs < rhs
      : Number(lhs) < Number(rhs);
  }
}

export class Le extends Comparison {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  override getOp(): string {
    return "<=";
  }

  override evalInfix(lhs: Result, rhs: Result): Result {
    return typeof lhs === "string" && typeof rhs === "string"
      ? lhs <= rhs
      : Number(lhs) <= Number(rhs);
  }
}

export class Gt extends Comparison {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  override getOp(): string {
    return ">";
  }

  override evalInfix(lhs: Result, rhs: Result): Result {
    return typeof lhs === "string" && typeof rhs === "string"
      ? lhs > rhs
      : Number(lhs) > Number(rhs);
  }
}

export class Ge extends Comparison {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  override getOp(): string {
    return ">=";
  }

  override evalInfix(lhs: Result, rhs: Result): Result {
    return typeof lhs === "string" && typeof rhs === "string"
      ? lhs >= rhs
      : Number(lhs) >= Number(rhs);
  }
}

export class Eq extends Comparison {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  override getOp(): string {
    return "==";
  }

  override evalInfix(lhs: Result, rhs: Result): Result {
    return lhs == rhs;
  }
}

export class Ne extends Comparison {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  override getOp(): string {
    return "!=";
  }

  override evalInfix(lhs: Result, rhs: Result): Result {
    return lhs != rhs;
  }
}

export class Add extends Additive {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  override getOp(): string {
    return "+";
  }

  override evalInfix(lhs: Result, rhs: Result): Result {
    return typeof lhs === "string" || typeof rhs === "string"
      ? `${lhs}${rhs}`
      : Number(lhs) + Number(rhs);
  }
}

export class Subtract extends Additive {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  override getOp(): string {
    return " - ";
  }

  override evalInfix(lhs: Result, rhs: Result): Result {
    return Number(lhs) - Number(rhs);
  }
}

export class Multiply extends Multiplicative {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  override getOp(): string {
    return "*";
  }

  override evalInfix(lhs: Result, rhs: Result): Result {
    return Number(lhs) * Number(rhs);
  }
}

export class Divide extends Multiplicative {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  override getOp(): string {
    return "/";
  }

  override evalInfix(lhs: Result, rhs: Result): Result {
    return Number(lhs) / Number(rhs);
  }
}

export class Modulo extends Multiplicative {
  constructor(scope: LexicalScope, lhs: Val, rhs: Val) {
    super(scope, lhs, rhs);
  }

  override getOp(): string {
    return "%";
  }

  override evalInfix(lhs: Result, rhs: Result): Result {
    return Number(lhs) % Number(rhs);
  }
}

/**
 * Numerical value with a unit.
 */
export class Numeric extends Val {
  unit: string;

  constructor(
    scope: LexicalScope,
    public num: number,
    unit: string,
  ) {
    super(scope);
    this.unit = unit?.toLowerCase() ?? "";
  }

  override appendTo(buf: Base.StringBuffer, priority: number): void {
    buf.append(this.num.toString());
    buf.append(Base.escapeCSSIdent(this.unit));
  }

  override evaluateCore(context: Context): Result {
    return this.num * context.queryUnitSize(this.unit, false);
  }
}

/**
 * Named value.
 * @param qualifiedName CSS-escaped name sequence separated by dots.
 */
export class Named extends Val {
  constructor(
    scope: LexicalScope,
    public qualifiedName: string,
  ) {
    super(scope);
  }

  override appendTo(buf: Base.StringBuffer, priority: number): void {
    buf.append(this.qualifiedName);
  }

  override evaluateCore(context: Context): Result {
    return context.evalName(this.scope, this.qualifiedName).evaluate(context);
  }

  override dependCore(
    other: Val,
    context: Context,
    dependencyCache: DependencyCache,
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
  constructor(
    scope: LexicalScope,
    public not: boolean,
    public name: string,
  ) {
    super(scope);
  }

  override appendTo(buf: Base.StringBuffer, priority: number): void {
    if (this.not) {
      buf.append("not ");
    }
    buf.append(Base.escapeCSSIdent(this.name));
  }

  override evaluateCore(context: Context): Result {
    return context.evalMediaName(this.name, this.not);
  }

  override isMediaName(): boolean {
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
    public str: string,
  ) {
    super(scope);
  }

  override appendTo(buf: Base.StringBuffer, priority: number): void {
    buf.append(this.str);
  }

  override evaluateCore(context: Context): Result {
    return this.fn.call(context);
  }
}

export function appendValArray(buf: Base.StringBuffer, arr: Val[]): void {
  buf.append("(");
  for (let i = 0; i < arr.length; i++) {
    if (i) {
      buf.append(",");
    }
    arr[i].appendTo(buf, 0);
  }
  buf.append(")");
}

export function expandValArray(
  context: Context,
  arr: Val[],
  params: Val[],
): Val[] {
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
}

export class Call extends Val {
  constructor(
    scope: LexicalScope,
    public qualifiedName: string,
    public params: Val[],
  ) {
    super(scope);
  }

  override appendTo(buf: Base.StringBuffer, priority: number): void {
    buf.append(this.qualifiedName);
    appendValArray(buf, this.params);
  }

  override evaluateCore(context: Context): Result {
    const body = context.evalCall(
      this.scope,
      this.qualifiedName,
      this.params,
      false,
    );
    return body.expand(context, this.params).evaluate(context);
  }

  override dependCore(
    other: Val,
    context: Context,
    dependencyCache: DependencyCache,
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
      true,
    );

    // No expansion here!
    return body.dependOuter(other, context, dependencyCache);
  }

  override expand(context: Context, params: Val[]): Val {
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
    public ifFalse: Val,
  ) {
    super(scope);
  }

  override appendTo(buf: Base.StringBuffer, priority: number): void {
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

  override evaluateCore(context: Context): Result {
    if (this.cond.evaluate(context)) {
      return this.ifTrue.evaluate(context);
    } else {
      return this.ifFalse.evaluate(context);
    }
  }

  override dependCore(
    other: Val,
    context: Context,
    dependencyCache: DependencyCache,
  ): boolean {
    return (
      other === this ||
      this.cond.dependOuter(other, context, dependencyCache) ||
      this.ifTrue.dependOuter(other, context, dependencyCache) ||
      this.ifFalse.dependOuter(other, context, dependencyCache)
    );
  }

  override expand(context: Context, params: Val[]): Val {
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
  constructor(
    scope: LexicalScope,
    public val: Result,
  ) {
    super(scope);
  }

  override appendTo(buf: Base.StringBuffer, priority: number): void {
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

  override evaluateCore(context: Context): Result {
    return this.val;
  }
}

export class MediaBooleanTest extends Val {
  constructor(
    scope: LexicalScope,
    public name: MediaName,
  ) {
    super(scope);
  }

  override appendTo(buf: Base.StringBuffer, priority: number): void {
    buf.append("(");
    buf.append(Base.escapeCSSIdent(this.name.name));
    buf.append(")");
  }

  override evaluateCore(context: Context): Result {
    return context.evalMediaBooleanTest(this.name.name);
  }
}

export class MediaTest extends Val {
  constructor(
    scope: LexicalScope,
    public name: MediaName,
    public value: Val,
  ) {
    super(scope);
  }

  override appendTo(buf: Base.StringBuffer, priority: number): void {
    buf.append("(");
    buf.append(Base.escapeCSSIdent(this.name.name));
    buf.append(":");
    this.value.appendTo(buf, 0);
    buf.append(")");
  }

  override evaluateCore(context: Context): Result {
    return context.evalMediaTest(this.name.name, this.value);
  }

  override dependCore(
    other: Val,
    context: Context,
    dependencyCache: DependencyCache,
  ): boolean {
    return (
      other === this || this.value.dependOuter(other, context, dependencyCache)
    );
  }

  override expand(context: Context, params: Val[]): Val {
    const value = this.value.expand(context, params);
    if (value === this.value) {
      return this;
    }
    const r = new MediaTest(this.scope, this.name, value);
    return r;
  }
}

export class SupportsTest extends Val {
  constructor(
    scope: LexicalScope,
    public name: string,
    public value: string,
    public isFunc: boolean,
  ) {
    super(scope);
  }

  override appendTo(buf: Base.StringBuffer, priority: number): void {
    if (this.isFunc) {
      buf.append(this.name);
    }
    buf.append("(");
    if (!this.isFunc && this.name) {
      buf.append(this.name);
      buf.append(":");
    }
    buf.append(this.value);
    buf.append(")");
  }

  override evaluateCore(context: Context): Result {
    return context.evalSupportsTest(this.name, this.value, this.isFunc);
  }
}

export class Param extends Val {
  constructor(
    scope: LexicalScope,
    public index: number,
  ) {
    super(scope);
  }

  override appendTo(buf: Base.StringBuffer, priority: number): void {
    buf.append("$");
    buf.append(this.index.toString());
  }

  override evaluateCore(context: Context): Result {
    throw new Error(`Parameter not expanded: ${this.index}`);
  }

  override expand(context: Context, params: Val[]): Val {
    const v = params[this.index];
    if (!v) {
      throw new Error(`Parameter missing: ${this.index}`);
    }
    return v as Val;
  }
}

export function and(scope: LexicalScope, v1: Val, v2: Val): Val {
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
}

export function add(scope: LexicalScope, v1: Val | null, v2: Val | null): Val {
  if (v1 === scope.zero) {
    return v2;
  }
  if (v2 === scope.zero) {
    return v1;
  }
  return new Add(scope, v1, v2);
}

export function sub(scope: LexicalScope, v1: Val | null, v2: Val | null): Val {
  if (v1 === scope.zero) {
    return new Negate(scope, v2);
  }
  if (v2 === scope.zero) {
    return v1;
  }
  return new Subtract(scope, v1, v2);
}

export function mul(scope: LexicalScope, v1: Val, v2: Val): Val {
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
}

export function div(scope: LexicalScope, v1: Val, v2: Val): Val {
  if (v1 === scope.zero) {
    return scope.zero;
  }
  if (v2 === scope.one) {
    return v1;
  }
  return new Divide(scope, v1, v2);
}
