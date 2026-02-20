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
 * @fileoverview CssCascade - CSS Cascade.
 */
import * as Asserts from "./asserts";
import * as Base from "./base";
import * as CmykStore from "./cmyk-store";
import * as CounterStyle from "./counter-style";
import * as Css from "./css";
import * as CssParser from "./css-parser";
import * as CssProp from "./css-prop";
import * as CssTokenizer from "./css-tokenizer";
import * as CssValidator from "./css-validator";
import * as Display from "./display";
import * as Exprs from "./exprs";
import * as LayoutHelper from "./layout-helper";
import * as Logging from "./logging";
import * as Matchers from "./matchers";
import * as Plugin from "./plugin";
import * as Vtree from "./vtree";
import { CssStyler, Layout } from "./types";
import { TokenType } from "./css-tokenizer";
import { AbstractStyler } from "./css-styler";

export type ElementStyle = {
  [key: string]:
    | CascadeValue
    | CascadeValue[]
    | ElementStyleMap
    | { matcher: Matchers.Matcher; styles: ElementStyle }[];
};

export const inheritedProps = {
  "border-collapse": true,
  "border-spacing": true,
  "caption-side": true,
  "clip-rule": true,
  color: true,
  "color-interpolation": true,
  "color-rendering": true,
  cursor: true,
  direction: true,
  "empty-cells": true,
  fill: true,
  "fill-opacity": true,
  "fill-rule": true,
  "font-kerning": true,
  "font-size": true,
  "font-size-adjust": true,
  "font-family": true,
  "font-feature-settings": true,
  "font-style": true,
  "font-stretch": true,
  "font-variant-ligatures": true,
  "font-variant-caps": true,
  "font-variant-numeric": true,
  "font-variant-east-asian": true,
  "font-weight": true,
  "glyph-orientation-vertical": true,
  "hanging-punctuation": true,
  hyphens: true,
  "hyphenate-character": true,
  "hyphenate-limit-chars": true,
  "hyphenate-limit-last": true,
  "image-rendering": true,
  "image-resolution": true,
  "letter-spacing": true,
  "line-break": true,
  "line-height": true,
  "list-style-image": true,
  "list-style-position": true,
  "list-style-type": true,
  marker: true,
  "marker-end": true,
  "marker-mid": true,
  "marker-start": true,
  orphans: true,
  "overflow-wrap": true,
  "paint-order": true,
  "pointer-events": true,
  quotes: true,
  "ruby-align": true,
  "ruby-position": true,
  "shape-rendering": true,
  stroke: true,
  "stroke-dasharray": true,
  "stroke-dashoffset": true,
  "stroke-linecap": true,
  "stroke-linejoin": true,
  "stroke-miterlimit": true,
  "stroke-opacity": true,
  "stroke-width": true,
  "tab-size": true,
  "text-align": true,
  "text-align-last": true,
  "text-anchor": true,
  "text-autospace": true,
  "text-decoration-skip": true,
  "text-decoration-skip-ink": true,
  "text-emphasis-color": true,
  "text-emphasis-position": true,
  "text-emphasis-style": true,
  "text-fill-color": true,
  "text-combine-upright": true,
  "text-indent": true,
  "text-justify": true,
  "text-orientation": true,
  "text-rendering": true,
  "text-shadow": true,
  "text-size-adjust": true,
  "text-spacing-trim": true,
  "text-stroke-color": true,
  "text-stroke-width": true,
  "text-transform": true,
  "text-underline-offset": true,
  "text-underline-position": true,
  "text-wrap": true,
  "text-wrap-mode": true,
  "text-wrap-style": true,
  visibility: true,
  "white-space": true,
  widows: true,
  "word-break": true,
  "word-spacing": true,
  "writing-mode": true,
};

export const polyfilledInheritedProps = [
  "image-resolution",
  "orphans",
  "widows",
];

export function getPolyfilledInheritedProps(): string[] {
  const hooks: Plugin.PolyfilledInheritedPropsHook[] = Plugin.getHooksForName(
    Plugin.HOOKS.POLYFILLED_INHERITED_PROPS,
  );
  return hooks.reduce(
    (props, f) => props.concat(f()),
    [].concat(polyfilledInheritedProps),
  );
}

export const supportedNamespaces = {
  "http://www.idpf.org/2007/ops": true,
  "http://www.w3.org/1999/xhtml": true,
  "http://www.w3.org/2000/svg": true,
  "http://www.w3.org/1998/Math/MathML": true,
};

export const coupledPatterns = [
  "margin-%",
  "padding-%",
  "border-%-width",
  "border-%-style",
  "border-%-color",
  "%",
];

export const coupledExtentPatterns = ["max-%", "min-%", "%"];

export const geomNames: { [key: string]: boolean } = (() => {
  const sides = ["left", "right", "top", "bottom"];
  const names = {
    width: true,
    height: true,
    "max-width": true,
    "max-height": true,
    "min-width": true,
    "min-height": true,
  };
  for (let i = 0; i < coupledPatterns.length; i++) {
    for (let k = 0; k < sides.length; k++) {
      const name = coupledPatterns[i].replace("%", sides[k]);
      names[name] = true;
    }
  }
  return names;
})();

export function buildCouplingMap(
  sideMap: { [key: string]: string },
  extentMap: { [key: string]: string },
): { [key: string]: string } {
  const map: { [key: string]: string } = {};
  for (const pattern of coupledPatterns) {
    for (const side in sideMap) {
      const name1 = pattern.replace("%", side);
      const name2 = pattern.replace("%", sideMap[side]);
      map[name1] = name2;
      map[name2] = name1;
    }
  }
  for (const extentPattern of coupledExtentPatterns) {
    for (const extent in extentMap) {
      const name1 = extentPattern.replace("%", extent);
      const name2 = extentPattern.replace("%", extentMap[extent]);
      map[name1] = name2;
      map[name2] = name1;
    }
  }
  return map;
}

export const couplingMapVert = buildCouplingMap(
  {
    "block-start": "right",
    "block-end": "left",
    "inline-start": "top",
    "inline-end": "bottom",
  },
  { "block-size": "width", "inline-size": "height" },
);

export const couplingMapHor = buildCouplingMap(
  {
    "block-start": "top",
    "block-end": "bottom",
    "inline-start": "left",
    "inline-end": "right",
  },
  { "block-size": "height", "inline-size": "width" },
);

export const couplingMapVertRtl = buildCouplingMap(
  {
    "block-start": "right",
    "block-end": "left",
    "inline-start": "bottom",
    "inline-end": "top",
  },
  { "block-size": "width", "inline-size": "height" },
);

export const couplingMapHorRtl = buildCouplingMap(
  {
    "block-start": "top",
    "block-end": "bottom",
    "inline-start": "right",
    "inline-end": "left",
  },
  { "block-size": "height", "inline-size": "width" },
);

const couplingMapLeftPage = buildCouplingMap(
  { inside: "right", outside: "left" },
  {},
);

const couplingMapRightPage = buildCouplingMap(
  { inside: "left", outside: "right" },
  {},
);

export class CascadeValue {
  constructor(
    public readonly value: Css.Val,
    public readonly priority: number,
  ) {}

  getBaseValue(): CascadeValue {
    return this;
  }

  filterValue(visitor: Css.Visitor): CascadeValue {
    const value = this.value.visit(visitor);
    if (value === this.value) {
      return this;
    }
    return new CascadeValue(value, this.priority);
  }

  increaseSpecificity(specificity: number): CascadeValue {
    if (specificity == 0) {
      return this;
    }
    return new CascadeValue(this.value, this.priority + specificity);
  }

  evaluate(
    context: Exprs.Context,
    propName?: string,
    percentRef?: number,
    vertical?: boolean,
  ): Css.Val {
    if (propName && Css.isCustomPropName(propName)) {
      return this.value;
    }
    return evaluateCSSToCSS(
      context,
      this.value,
      propName,
      percentRef,
      vertical,
    );
  }

  isEnabled(context: Exprs.Context): boolean {
    return true;
  }
}

/**
 * Internal subclass of CascadeValue. Should never be seen outside of the
 * cascade engine.
 */
export class ConditionalCascadeValue extends CascadeValue {
  constructor(
    value: Css.Val,
    priority: number,
    public readonly condition: Exprs.Val,
  ) {
    super(value, priority);
  }

  override getBaseValue(): CascadeValue {
    return new CascadeValue(this.value, this.priority);
  }

  override filterValue(visitor: Css.Visitor): CascadeValue {
    const value = this.value.visit(visitor);
    if (value === this.value) {
      return this;
    }
    return new ConditionalCascadeValue(value, this.priority, this.condition);
  }

  override increaseSpecificity(specificity: number): CascadeValue {
    if (specificity == 0) {
      return this;
    }
    return new ConditionalCascadeValue(
      this.value,
      this.priority + specificity,
      this.condition,
    );
  }

  isEnabled(context: Exprs.Context): boolean {
    try {
      return !!this.condition.evaluate(context);
    } catch (err) {
      Logging.logger.warn(err);
    }
    return false;
  }
}

/**
 * @param tv current value (cannot be conditional)
 * @param av cascaded value (can be conditional)
 */
export function cascadeValues(
  context: Exprs.Context,
  tv: CascadeValue,
  av: CascadeValue,
): CascadeValue {
  if ((!tv || av.priority >= tv.priority) && av.isEnabled(context)) {
    return av.getBaseValue();
  }
  return tv;
}

/**
 * setProp with priority checking.
 * If context is given it is same as
 * setProp(style, name, cascadeValues(context, getProp(style, name), value))
 */
export function setPropCascadeValue(
  style: ElementStyle,
  name: string,
  value: CascadeValue,
  context?: Exprs.Context,
): void {
  if (!style) {
    return;
  }
  if (!value) {
    delete style[name];
  } else {
    const tv = style[name] as CascadeValue;
    if (!tv || value.priority >= tv.priority) {
      if (context) {
        if (value.isEnabled(context)) {
          style[name] = value.getBaseValue();
        }
      } else {
        style[name] = value;
      }
    }
  }
}

export type ElementStyleMap = {
  [key: string]: ElementStyle;
};

export const SPECIALS = {
  "region-id": true,
  "fragment-selector-id": true,
};

// Persist footnote-call counter values on the call element so footnote-marker
// can render the same value even if page-based counters reset on the footnote
// page or during re-layout.
const FOOTNOTE_COUNTER_ATTR = "data-viv-footnote-counter";
function getFootnoteCounterMap(element: Element): Record<string, number[]> {
  const stored = element.getAttribute(FOOTNOTE_COUNTER_ATTR);
  if (!stored) {
    return Object.create(null);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch {
    return Object.create(null);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return Object.create(null);
  }
  const map: Record<string, number[]> = Object.create(null);
  Object.entries(parsed as Record<string, unknown>).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      const nums = value.filter(
        (item): item is number => typeof item === "number" && isFinite(item),
      );
      map[key] = nums;
    } else if (typeof value === "number" && isFinite(value)) {
      map[key] = [value];
    }
  });
  return map;
}

function setFootnoteCounterValues(
  element: Element,
  counterName: string,
  values: number[],
): void {
  const map = getFootnoteCounterMap(element);
  map[counterName] = values;
  element.setAttribute(FOOTNOTE_COUNTER_ATTR, JSON.stringify(map));
}

export function isSpecialName(name: string): boolean {
  return !!SPECIALS[name];
}

export function isMapName(name: string): boolean {
  return name.charAt(0) === "_" && name !== "_viewConditionalStyles";
}

export function isPropName(name: string): boolean {
  return name.charAt(0) !== "_" && !SPECIALS[name];
}

export function isInherited(name: string): boolean {
  return !!inheritedProps[name] || Css.isCustomPropName(name);
}

export function getProp(style: ElementStyle, name: string): CascadeValue {
  return style[name] as CascadeValue;
}

export function setProp(
  style: ElementStyle,
  name: string,
  value: CascadeValue,
): void {
  if (!value) {
    delete style[name];
  } else {
    style[name] = value;
  }
}

export function getStyleMap(
  style: ElementStyle,
  name: string,
): ElementStyleMap {
  return style[name] as ElementStyleMap;
}

export function getMutableStyleMap(
  style: ElementStyle,
  name: string,
): ElementStyleMap {
  let r = style[name] as ElementStyleMap;
  if (!r) {
    r = {};
    style[name] = r;
  }
  return r;
}

export const getViewConditionalStyleMap = (
  style: ElementStyle,
): { matcher: Matchers.Matcher; styles: ElementStyle }[] => {
  let r = style["_viewConditionalStyles"] as {
    matcher: Matchers.Matcher;
    styles: ElementStyle;
  }[];
  if (!r) {
    r = [];
    style["_viewConditionalStyles"] = r;
  }
  return r;
};

export function getSpecial(style: ElementStyle, name: string): CascadeValue[] {
  return style[name] as CascadeValue[];
}

export function getMutableSpecial(
  style: ElementStyle,
  name: string,
): CascadeValue[] {
  let r = style[name] as CascadeValue[];
  if (!r) {
    r = [];
    style[name] = r;
  }
  return r;
}

export function mergeIn(
  context: Exprs.Context,
  target: ElementStyle,
  style: ElementStyle,
  specificity: number,
  pseudoelement: string | null,
  regionId: string | null,
  viewConditionMatcher: Matchers.Matcher | null,
): void {
  const hierarchy = [
    { id: pseudoelement, styleKey: "_pseudos" },
    { id: regionId, styleKey: "_regions" },
  ];
  hierarchy.forEach((item) => {
    if (item.id) {
      const styleMap = getMutableStyleMap(target, item.styleKey);
      target = styleMap[item.id];
      if (!target) {
        target = {} as ElementStyle;
        styleMap[item.id] = target;
      }
    }
  });
  if (viewConditionMatcher) {
    const styleMap = getViewConditionalStyleMap(target);
    target = {} as ElementStyle;
    styleMap.push({
      styles: target,
      matcher: viewConditionMatcher,
    });
  }
  for (const prop in style) {
    if (isMapName(prop)) {
      continue;
    }
    if (isSpecialName(prop)) {
      // special properties: list of all assigned values
      const as = getSpecial(style, prop);
      const ts = getMutableSpecial(target, prop);
      Array.prototype.push.apply(ts, as);
    } else {
      // regular properties: higher priority wins
      const cascval = getProp(style, prop);
      if (!cascval.isEnabled(context)) {
        continue;
      }
      const av = cascval.increaseSpecificity(specificity);
      setPropCascadeValue(target, prop, av, context);

      // Expand shorthand property (its value contains variables).
      const propListLH = (
        context as Exprs.Context & {
          style: { validatorSet: CssValidator.ValidatorSet };
        }
      ).style?.validatorSet.shorthands[prop]?.propList;
      if (propListLH) {
        for (const propLH of propListLH) {
          const avLH = new CascadeValue(Css.empty, av.priority);
          setPropCascadeValue(target, propLH, avLH, context);
        }
      }
    }
  }
}

export function mergeAll(
  context: Exprs.Context,
  styles: ElementStyle[],
): ElementStyle {
  const target = {} as ElementStyle;
  for (let k = 0; k < styles.length; k++) {
    mergeIn(context, target, styles[k], 0, null, null, null);
  }
  return target;
}

export function chainActions(
  chain: ChainedAction[],
  action: CascadeAction,
): CascadeAction {
  if (chain.length > 0) {
    chain.sort((a, b) => b.getPriority() - a.getPriority());
    let chained: ChainedAction | null = null;
    for (let i = chain.length - 1; i >= 0; i--) {
      chained = chain[i];
      chained.chained = action;
      action = chained;
    }
    return chained;
  }
  return action;
}

export class InheritanceVisitor extends Css.FilterVisitor {
  propName: string = "";

  constructor(
    public readonly props: ElementStyle,
    public readonly context: Exprs.Context,
  ) {
    super();
  }

  setPropName(name: string): void {
    this.propName = name;
  }

  private getFontSize() {
    const cascval = getProp(this.props, "font-size");
    if (!cascval.value.isNumeric()) {
      // FIXME: cascval may be Ident value e.g. "smaller"
      return Exprs.defaultUnitSizes["em"];
    }
    const n = cascval.value as Css.Numeric;
    if (!Exprs.isAbsoluteLengthUnit(n.unit)) {
      throw new Error("Unexpected state");
    }
    return n.num * Exprs.defaultUnitSizes[n.unit];
  }

  override visitNumeric(numeric: Css.Numeric): Css.Val {
    Asserts.assert(this.context);
    if (this.propName === "font-size") {
      return convertFontSizeToPx(numeric, this.getFontSize(), this.context);
    } else if (
      numeric.unit === "em" ||
      numeric.unit === "rem" ||
      numeric.unit === "lh" ||
      numeric.unit === "rlh"
    ) {
      return convertFontRelativeLengthToPx(
        numeric,
        this.getFontSize(),
        this.context,
      );
    }
    return numeric;
  }

  override visitExpr(expr: Css.Expr): Css.Val {
    if (this.propName == "font-size") {
      const val = evaluateCSSToCSS(this.context, expr, this.propName);
      return val.visit(this);
    }
    return expr;
  }
}

export function convertFontRelativeLengthToPx(
  numeric: Css.Numeric,
  baseFontSize: number,
  context: Exprs.Context,
): Css.Numeric {
  const unit = numeric.unit;
  const num = numeric.num;
  if (unit === "em") {
    return new Css.Numeric(num * baseFontSize, "px");
  } else if (unit === "rem") {
    return new Css.Numeric(num * context.fontSize(), "px");
  } else if (unit === "rlh") {
    return new Css.Numeric(num * context.rootLineHeight, "px");
  } else {
    return numeric;
  }
}

export function convertFontSizeToPx(
  numeric: Css.Numeric,
  parentFontSize: number,
  context: Exprs.Context,
): Css.Numeric {
  numeric = convertFontRelativeLengthToPx(numeric, parentFontSize, context);
  const unit = numeric.unit;
  const num = numeric.num;
  if (unit === "px") {
    return numeric;
  } else if (unit === "%") {
    return new Css.Numeric((num / 100) * parentFontSize, "px");
  } else {
    return new Css.Numeric(num * context.queryUnitSize(unit, false), "px");
  }
}

export type ActionTable = {
  [key: string]: CascadeAction;
};

export class CascadeAction {
  apply(cascadeInstance: CascadeInstance): void {}

  mergeWith(other: CascadeAction): CascadeAction {
    return new CompoundAction([this, other]);
  }

  clone(): CascadeAction {
    // Mutable actions will override
    return this;
  }
}

export class ConditionItemAction extends CascadeAction {
  constructor(public readonly conditionItem: ConditionItem) {
    super();
  }

  override apply(cascadeInstance: CascadeInstance): void {
    cascadeInstance.pushConditionItem(
      this.conditionItem.fresh(cascadeInstance),
    );
  }
}

export class CompoundAction extends CascadeAction {
  constructor(public readonly list: CascadeAction[]) {
    super();
  }

  override apply(cascadeInstance: CascadeInstance): void {
    for (let i = 0; i < this.list.length; i++) {
      this.list[i].apply(cascadeInstance);
    }
  }

  override mergeWith(other: CascadeAction): CascadeAction {
    this.list.push(other);
    return this;
  }

  override clone(): CascadeAction {
    return new CompoundAction([].concat(this.list));
  }
}

export class ApplyRuleAction extends CascadeAction {
  constructor(
    public readonly style: ElementStyle,
    public readonly specificity: number,
    public readonly pseudoelement: string | null,
    public readonly regionId: string | null,
    public readonly viewConditionId: string | null,
  ) {
    super();
  }

  override apply(cascadeInstance: CascadeInstance): void {
    mergeIn(
      cascadeInstance.context,
      cascadeInstance.currentStyle,
      this.style,
      this.specificity,
      this.pseudoelement,
      this.regionId,
      cascadeInstance.buildViewConditionMatcher(this.viewConditionId),
    );
  }
}

export class ChainedAction extends CascadeAction {
  chained: CascadeAction = null;

  constructor() {
    super();
  }

  override apply(cascadeInstance: CascadeInstance): void {
    this.chained.apply(cascadeInstance);
  }

  getPriority(): number {
    return 0;
  }

  makePrimary(cascade: Cascade): boolean {
    // cannot be made primary
    return false;
  }
}

export class CheckClassAction extends ChainedAction {
  constructor(public readonly className: string) {
    super();
  }

  override apply(cascadeInstance: CascadeInstance): void {
    if (cascadeInstance.currentClassNames.includes(this.className)) {
      this.chained.apply(cascadeInstance);
    }
  }

  override getPriority(): number {
    return 10;
  }
  // class should be checked after id

  override makePrimary(cascade: Cascade): boolean {
    if (this.chained) {
      cascade.insertInTable(cascade.classes, this.className, this.chained);
    }
    return true;
  }
}

export class CheckIdAction extends ChainedAction {
  constructor(public readonly id: string) {
    super();
  }

  override apply(cascadeInstance: CascadeInstance): void {
    if (
      cascadeInstance.currentId == this.id ||
      cascadeInstance.currentXmlId == this.id
    ) {
      this.chained.apply(cascadeInstance);
    }
  }

  override getPriority(): number {
    return 11;
  }
  // id should be checked after :root

  override makePrimary(cascade: Cascade): boolean {
    if (this.chained) {
      cascade.insertInTable(cascade.ids, this.id, this.chained);
    }
    return true;
  }
}

export class CheckLocalNameAction extends ChainedAction {
  constructor(public readonly localName: string) {
    super();
  }

  override apply(cascadeInstance: CascadeInstance): void {
    if (cascadeInstance.currentLocalName == this.localName) {
      this.chained.apply(cascadeInstance);
    }
  }

  override getPriority(): number {
    return 8;
  }
  // tag is a pretty good thing to check, after epub:type

  override makePrimary(cascade: Cascade): boolean {
    if (this.chained) {
      cascade.insertInTable(cascade.tags, this.localName, this.chained);
    }
    return true;
  }
}

export class CheckNSTagAction extends ChainedAction {
  constructor(
    public readonly ns: string,
    public readonly localName: string,
  ) {
    super();
  }

  override apply(cascadeInstance: CascadeInstance): void {
    if (
      cascadeInstance.currentLocalName == this.localName &&
      cascadeInstance.currentNamespace == this.ns
    ) {
      this.chained.apply(cascadeInstance);
    }
  }

  override getPriority(): number {
    return 8;
  }
  // tag is a pretty good thing to check, after epub:type

  override makePrimary(cascade: Cascade): boolean {
    if (this.chained) {
      let prefix = cascade.nsPrefix[this.ns];
      if (!prefix) {
        prefix = `ns${cascade.nsCount++}:`;
        cascade.nsPrefix[this.ns] = prefix;
      }
      const nsTag = prefix + this.localName;
      cascade.insertInTable(cascade.nstags, nsTag, this.chained);
    }
    return true;
  }
}

export class CheckTargetEpubTypeAction extends ChainedAction {
  constructor(
    public readonly epubTypePatt: RegExp,
    public readonly targetLocalName?: string,
    public readonly useRoleAttr = false,
  ) {
    super();
  }

  override apply(cascadeInstance: CascadeInstance): void {
    const elem = cascadeInstance.currentElement;
    if (elem instanceof HTMLAnchorElement) {
      if (
        elem.hash &&
        elem.href == elem.baseURI.replace(/#.*$/, "") + elem.hash
      ) {
        const id = elem.hash.substring(1);
        const target = elem.ownerDocument.getElementById(id);
        if (
          target &&
          (!this.targetLocalName || target.localName == this.targetLocalName)
        ) {
          const epubType = this.useRoleAttr
            ? target.getAttribute("role")
            : target.getAttributeNS(Base.NS.epub, "type") ||
              target.getAttribute("epub:type");
          if (epubType && epubType.match(this.epubTypePatt)) {
            this.chained.apply(cascadeInstance);
          }
        }
      }
    }
  }
}

export class CheckNamespaceAction extends ChainedAction {
  constructor(public readonly ns: string) {
    super();
  }

  override apply(cascadeInstance: CascadeInstance): void {
    if (cascadeInstance.currentNamespace == this.ns) {
      this.chained.apply(cascadeInstance);
    }
  }
}

function checkAttribute(
  element: Element,
  ns: string | null,
  name: string,
  pred: (element: Element, ns: string, name: string) => boolean,
): boolean {
  if (!element) {
    return false;
  }
  if (ns !== null) {
    return pred(element, ns, name);
  }
  // For wildcard namespace
  for (const qname of element.getAttributeNames()) {
    if (qname === name || qname.endsWith(`:${name}`)) {
      if (
        pred(
          element,
          qname === name ? "" : element.lookupNamespaceURI(qname.split(":")[0]),
          name,
        )
      ) {
        return true;
      }
    }
  }
  return false;
}

export class CheckAttributePresentAction extends ChainedAction {
  constructor(
    public readonly ns: string,
    public readonly name: string,
  ) {
    super();
  }

  override apply(cascadeInstance: CascadeInstance): void {
    if (
      checkAttribute(
        cascadeInstance.currentElement,
        this.ns,
        this.name,
        (element, ns, name) => element.hasAttributeNS(ns, name),
      )
    ) {
      this.chained.apply(cascadeInstance);
    }
  }
}

export class CheckAttributeEqAction extends ChainedAction {
  constructor(
    public readonly ns: string,
    public readonly name: string,
    public readonly value: string,
  ) {
    super();
  }

  override apply(cascadeInstance: CascadeInstance): void {
    if (
      checkAttribute(
        cascadeInstance.currentElement,
        this.ns,
        this.name,
        (element, ns, name) => element.getAttributeNS(ns, name) == this.value,
      )
    ) {
      this.chained.apply(cascadeInstance);
    }
  }

  override getPriority(): number {
    if (this.name == "type" && this.ns == Base.NS.epub) {
      return 9; // epub:type is a pretty good thing to check
    }
    return 0;
  }

  override makePrimary(cascade: Cascade): boolean {
    if (this.name == "type" && this.ns == Base.NS.epub) {
      if (this.chained) {
        cascade.insertInTable(cascade.epubtypes, this.value, this.chained);
      }
      return true;
    }
    return false;
  }
}

export class CheckNamespaceSupportedAction extends ChainedAction {
  constructor(
    public readonly ns: string,
    public readonly name: string,
  ) {
    super();
  }

  override apply(cascadeInstance: CascadeInstance): void {
    if (
      checkAttribute(
        cascadeInstance.currentElement,
        this.ns,
        this.name,
        (element, ns, name) =>
          !!supportedNamespaces[element.getAttributeNS(ns, name)],
      )
    ) {
      this.chained.apply(cascadeInstance);
    }
  }

  override getPriority(): number {
    return 0;
  }

  override makePrimary(cascade: Cascade): boolean {
    return false;
  }
}

export class CheckAttributeRegExpAction extends ChainedAction {
  constructor(
    public readonly ns: string,
    public readonly name: string,
    public readonly regexp: RegExp,
  ) {
    super();
  }

  override apply(cascadeInstance: CascadeInstance): void {
    if (
      checkAttribute(
        cascadeInstance.currentElement,
        this.ns,
        this.name,
        (element, ns, name) =>
          !!element.getAttributeNS(ns, name)?.match(this.regexp),
      )
    ) {
      this.chained.apply(cascadeInstance);
    }
  }
}

export class CheckLangAction extends ChainedAction {
  constructor(public readonly langRegExp: RegExp) {
    super();
  }

  override apply(cascadeInstance: CascadeInstance): void {
    if (cascadeInstance.lang.match(this.langRegExp)) {
      this.chained.apply(cascadeInstance);
    }
  }
}

export class IsFirstAction extends ChainedAction {
  constructor() {
    super();
  }

  override apply(cascadeInstance: CascadeInstance): void {
    if (cascadeInstance.isFirst) {
      this.chained.apply(cascadeInstance);
    }
  }

  override getPriority(): number {
    return 6;
  }
}

export class IsRootAction extends ChainedAction {
  constructor() {
    super();
  }

  override apply(cascadeInstance: CascadeInstance): void {
    if (cascadeInstance.isRoot) {
      this.chained.apply(cascadeInstance);
    }
  }

  override getPriority(): number {
    return 12; // :root is the first thing to check
  }
}

export class IsNthAction extends ChainedAction {
  constructor(
    public readonly a: number,
    public readonly b: number,
  ) {
    super();
  }

  /**
   * Checkes whether given order can be represented as an+b with a non-negative
   * interger n
   */
  protected matchANPlusB(order: number): boolean {
    return Matchers.matchANPlusB(order, this.a, this.b);
  }
}

export class IsNthSiblingAction extends IsNthAction {
  constructor(a: number, b: number) {
    super(a, b);
  }

  override apply(cascadeInstance: CascadeInstance): void {
    if (this.matchANPlusB(cascadeInstance.currentSiblingOrder)) {
      this.chained.apply(cascadeInstance);
    }
  }

  override getPriority(): number {
    return 5;
  }
}

export class IsNthSiblingOfTypeAction extends IsNthAction {
  constructor(a: number, b: number) {
    super(a, b);
  }

  override apply(cascadeInstance: CascadeInstance): void {
    const order =
      cascadeInstance.currentSiblingTypeCounts[
        cascadeInstance.currentNamespace
      ][cascadeInstance.currentLocalName];
    if (this.matchANPlusB(order)) {
      this.chained.apply(cascadeInstance);
    }
  }

  override getPriority(): number {
    return 5;
  }
}

export class IsNthLastSiblingAction extends IsNthAction {
  constructor(a: number, b: number) {
    super(a, b);
  }

  override apply(cascadeInstance: CascadeInstance): void {
    let order = cascadeInstance.currentFollowingSiblingOrder;
    if (order === null) {
      order = cascadeInstance.currentFollowingSiblingOrder =
        cascadeInstance.currentElement.parentNode.childElementCount -
        cascadeInstance.currentSiblingOrder +
        1;
    }
    if (this.matchANPlusB(order)) {
      this.chained.apply(cascadeInstance);
    }
  }

  override getPriority(): number {
    return 4;
  }
}

export class IsNthLastSiblingOfTypeAction extends IsNthAction {
  constructor(a: number, b: number) {
    super(a, b);
  }

  override apply(cascadeInstance: CascadeInstance): void {
    const counts = cascadeInstance.currentFollowingSiblingTypeCounts;
    if (!counts[cascadeInstance.currentNamespace]) {
      let elem = cascadeInstance.currentElement;
      do {
        const ns = elem.namespaceURI;
        const localName = elem.localName;
        let nsCounts = counts[ns];
        if (!nsCounts) {
          nsCounts = counts[ns] = {};
        }
        nsCounts[localName] = (nsCounts[localName] || 0) + 1;
      } while ((elem = elem.nextElementSibling));
    }
    if (
      this.matchANPlusB(
        counts[cascadeInstance.currentNamespace][
          cascadeInstance.currentLocalName
        ],
      )
    ) {
      this.chained.apply(cascadeInstance);
    }
  }

  override getPriority(): number {
    return 4;
  }
}

export class IsEmptyAction extends ChainedAction {
  constructor() {
    super();
  }

  override apply(cascadeInstance: CascadeInstance): void {
    let node: Node | null = cascadeInstance.currentElement.firstChild;
    while (node) {
      switch (node.nodeType) {
        case Node.ELEMENT_NODE:
          return;
        case Node.TEXT_NODE:
          if ((node as Text).length > 0) {
            return;
          }
      }
      node = node.nextSibling;
    }
    this.chained.apply(cascadeInstance);
  }

  override getPriority(): number {
    return 4;
  }
}

export class IsEnabledAction extends ChainedAction {
  constructor() {
    super();
  }

  override apply(cascadeInstance: CascadeInstance): void {
    const elem = cascadeInstance.currentElement;
    if ((elem as any).disabled === false) {
      this.chained.apply(cascadeInstance);
    }
  }

  override getPriority(): number {
    return 5;
  }
}

export class IsDisabledAction extends ChainedAction {
  constructor() {
    super();
  }

  override apply(cascadeInstance: CascadeInstance): void {
    const elem = cascadeInstance.currentElement;
    if ((elem as any).disabled === true) {
      this.chained.apply(cascadeInstance);
    }
  }

  override getPriority(): number {
    return 5;
  }
}

export class IsCheckedAction extends ChainedAction {
  constructor() {
    super();
  }

  override apply(cascadeInstance: CascadeInstance): void {
    const elem = cascadeInstance.currentElement;
    if ((elem as any).selected === true || (elem as any).checked === true) {
      this.chained.apply(cascadeInstance);
    }
  }

  override getPriority(): number {
    return 5;
  }
}

export class CheckConditionAction extends ChainedAction {
  constructor(public readonly condition: string) {
    super();
  }

  override apply(cascadeInstance: CascadeInstance): void {
    if (cascadeInstance.conditions[this.condition]) {
      try {
        cascadeInstance.dependentConditions.push(this.condition);
        this.chained.apply(cascadeInstance);
      } finally {
        cascadeInstance.dependentConditions.pop();
      }
    }
  }

  override getPriority(): number {
    return 5;
  }
}

export class CheckAppliedAction extends CascadeAction {
  applied = false;

  constructor() {
    super();
  }

  override apply(cascadeInstance: CascadeInstance): void {
    this.applied = true;
  }

  override clone(): CascadeAction {
    const cloned = new CheckAppliedAction();
    cloned.applied = this.applied;
    return cloned;
  }
}

/**
 * Cascade Action for :is() and similar pseudo-classes
 */
export class MatchesAction extends ChainedAction {
  checkAppliedAction: CheckAppliedAction;
  firstActions: CascadeAction[] = [];

  constructor(chains: ChainedAction[][]) {
    super();
    this.checkAppliedAction = new CheckAppliedAction();
    for (const chain of chains) {
      this.firstActions.push(chainActions(chain, this.checkAppliedAction));
    }
  }

  override apply(cascadeInstance: CascadeInstance): void {
    for (const firstAction of this.firstActions) {
      firstAction.apply(cascadeInstance);
      if (this.checkAppliedAction.applied) {
        break;
      }
    }
    if (this.checkAppliedAction.applied === this.positive()) {
      this.chained.apply(cascadeInstance);
    }
    this.checkAppliedAction.applied = false;
  }

  override getPriority(): number {
    return Math.max(
      ...this.firstActions.map((firstAction) =>
        firstAction instanceof ChainedAction ? firstAction.getPriority() : 0,
      ),
    );
  }

  positive(): boolean {
    return true;
  }

  relational(): boolean {
    return false;
  }
}

/**
 * Cascade Action for :not() pseudo-class
 */
export class MatchesNoneAction extends MatchesAction {
  override positive(): boolean {
    return false;
  }
}

/**
 * Cascade Action for :has() pseudo-class
 */
export class MatchesRelationalAction extends MatchesAction {
  constructor(public selectorTexts: string[]) {
    super([]);
  }

  override apply(cascadeInstance: CascadeInstance): void {
    for (const selectorText of this.selectorTexts) {
      let selectorWithScope: string;
      let scopingRoot: ParentNode;
      if (/^\s*[+~]/.test(selectorText)) {
        // :has(+ F) or :has(~ F)
        scopingRoot = cascadeInstance.currentElement.parentNode;
        const index = Array.from(scopingRoot.children).indexOf(
          cascadeInstance.currentElement,
        );
        selectorWithScope = `:scope > :nth-child(${index + 1}) ${selectorText}`;
      } else {
        // :has(F) or :has(> F)
        scopingRoot = cascadeInstance.currentElement;
        selectorWithScope = `:scope ${selectorText}`;
      }
      try {
        if (scopingRoot.querySelector(selectorWithScope)) {
          this.checkAppliedAction.apply(cascadeInstance);
          break;
        }
      } catch (e) {}
    }
    if (this.checkAppliedAction.applied) {
      this.chained.apply(cascadeInstance);
    }
    this.checkAppliedAction.applied = false;
  }

  override relational(): boolean {
    return true;
  }
}

/**
 * Cascade Action for :nth-child(An+B of S) pseudo-class
 */
export class IsNthSiblingOfSelectorAction extends IsNthAction {
  checkAppliedAction: CheckAppliedAction;
  firstActions: CascadeAction[] = [];

  constructor(a: number, b: number, chains: ChainedAction[][]) {
    super(a, b);
    this.checkAppliedAction = new CheckAppliedAction();
    for (const chain of chains) {
      this.firstActions.push(chainActions(chain, this.checkAppliedAction));
    }
  }

  override apply(cascadeInstance: CascadeInstance): void {
    // Check if current element matches the selector
    for (const firstAction of this.firstActions) {
      firstAction.apply(cascadeInstance);
      if (this.checkAppliedAction.applied) {
        break;
      }
    }
    if (!this.checkAppliedAction.applied) {
      return; // Element doesn't match selector, so :nth-child(of S) doesn't match
    }
    this.checkAppliedAction.applied = false;

    // Count siblings that match the selector
    const elem = cascadeInstance.currentElement;
    let order = 1;
    let sibling = elem.previousElementSibling;
    while (sibling) {
      if (this.matchesSelector(sibling, cascadeInstance)) {
        order++;
      }
      sibling = sibling.previousElementSibling;
    }

    if (this.matchANPlusB(order)) {
      this.chained.apply(cascadeInstance);
    }
  }

  protected matchesSelector(
    element: Element,
    cascadeInstance: CascadeInstance,
  ): boolean {
    // Temporarily save and restore cascade state to test against sibling
    const savedElement = cascadeInstance.currentElement;
    const savedNS = cascadeInstance.currentNamespace;
    const savedLocalName = cascadeInstance.currentLocalName;
    const savedId = cascadeInstance.currentId;
    const savedClassNames = cascadeInstance.currentClassNames;
    const savedSiblingOrder = cascadeInstance.currentSiblingOrder;

    cascadeInstance.currentElement = element;
    cascadeInstance.currentNamespace = element.namespaceURI || "";
    cascadeInstance.currentLocalName = element.localName;
    cascadeInstance.currentId = element.id;
    cascadeInstance.currentClassNames = element.classList
      ? Array.from(element.classList)
      : [];

    // Calculate sibling order for the element
    let siblingOrder = 1;
    let sib = element.previousElementSibling;
    while (sib) {
      siblingOrder++;
      sib = sib.previousElementSibling;
    }
    cascadeInstance.currentSiblingOrder = siblingOrder;

    for (const firstAction of this.firstActions) {
      firstAction.apply(cascadeInstance);
      if (this.checkAppliedAction.applied) {
        break;
      }
    }
    const matched = this.checkAppliedAction.applied;
    this.checkAppliedAction.applied = false;

    // Restore cascade state
    cascadeInstance.currentElement = savedElement;
    cascadeInstance.currentNamespace = savedNS;
    cascadeInstance.currentLocalName = savedLocalName;
    cascadeInstance.currentId = savedId;
    cascadeInstance.currentClassNames = savedClassNames;
    cascadeInstance.currentSiblingOrder = savedSiblingOrder;

    return matched;
  }

  override getPriority(): number {
    return 5;
  }
}

/**
 * Cascade Action for :nth-last-child(An+B of S) pseudo-class
 */
export class IsNthLastSiblingOfSelectorAction extends IsNthSiblingOfSelectorAction {
  constructor(a: number, b: number, chains: ChainedAction[][]) {
    super(a, b, chains);
  }

  override apply(cascadeInstance: CascadeInstance): void {
    // Check if current element matches the selector
    for (const firstAction of this.firstActions) {
      firstAction.apply(cascadeInstance);
      if (this.checkAppliedAction.applied) {
        break;
      }
    }
    if (!this.checkAppliedAction.applied) {
      return; // Element doesn't match selector, so :nth-last-child(of S) doesn't match
    }
    this.checkAppliedAction.applied = false;

    // Count siblings (from end) that match the selector
    const elem = cascadeInstance.currentElement;
    let order = 1;
    let sibling = elem.nextElementSibling;
    while (sibling) {
      if (this.matchesSelector(sibling, cascadeInstance)) {
        order++;
      }
      sibling = sibling.nextElementSibling;
    }

    if (this.matchANPlusB(order)) {
      this.chained.apply(cascadeInstance);
    }
  }

  override getPriority(): number {
    return 4;
  }
}

/**
 * An object that is notified as elements are pushed and popped and typically
 * controls a "named condition" (which is a count associated with a name).
 */
export interface ConditionItem {
  /**
   * Returns a "fresh" copy of this item. May be this if immutable.
   */
  fresh(cascadeInstance: CascadeInstance): ConditionItem;

  /**
   * Depth is 0 for element itself and its siblings, 1 for direct children and
   * -1 for the parent.
   */
  push(cascadeInstance: CascadeInstance, depth: number): boolean;

  /**
   * @return return true if no more notifications are desired
   */
  pop(cascadeInstance: CascadeInstance, depth: number): boolean;
}

export class AbstractConditionItem {
  constructor(
    public readonly condition: string,
    public readonly viewConditionId: string | null,
    public readonly viewCondition: Matchers.Matcher,
  ) {}

  increment(cascadeInstance: CascadeInstance) {
    cascadeInstance.increment(this.condition, this.viewCondition);
  }

  decrement(cascadeInstance: CascadeInstance) {
    cascadeInstance.decrement(this.condition, this.viewCondition);
  }

  buildViewConditionMatcher(
    cascadeInstance: CascadeInstance,
  ): Matchers.Matcher {
    return cascadeInstance.buildViewConditionMatcher(this.viewConditionId);
  }
}

export class DescendantConditionItem
  extends AbstractConditionItem
  implements ConditionItem
{
  constructor(
    condition: string,
    viewConditionId: string | null,
    viewCondition: Matchers.Matcher,
  ) {
    super(condition, viewConditionId, viewCondition);
  }

  /** @override */
  fresh(cascadeInstance: CascadeInstance): ConditionItem {
    return new DescendantConditionItem(
      this.condition,
      this.viewConditionId,
      this.buildViewConditionMatcher(cascadeInstance),
    );
  }

  /** @override */
  push(cascadeInstance: CascadeInstance, depth: number): boolean {
    if (depth == 0) {
      this.increment(cascadeInstance);
    }
    return false;
  }

  /** @override */
  pop(cascadeInstance: CascadeInstance, depth: number): boolean {
    if (depth == 0) {
      this.decrement(cascadeInstance);
      return true;
    }
    return false;
  }
}

export class ChildConditionItem
  extends AbstractConditionItem
  implements ConditionItem
{
  constructor(
    condition: string,
    viewConditionId: string | null,
    viewCondition: Matchers.Matcher,
  ) {
    super(condition, viewConditionId, viewCondition);
  }

  /** @override */
  fresh(cascadeInstance: CascadeInstance): ConditionItem {
    return new ChildConditionItem(
      this.condition,
      this.viewConditionId,
      this.buildViewConditionMatcher(cascadeInstance),
    );
  }

  /** @override */
  push(cascadeInstance: CascadeInstance, depth: number): boolean {
    if (depth == 0) {
      this.increment(cascadeInstance);
    } else if (depth == 1) {
      this.decrement(cascadeInstance);
    }
    return false;
  }

  /** @override */
  pop(cascadeInstance: CascadeInstance, depth: number): boolean {
    if (depth == 0) {
      this.decrement(cascadeInstance);
      return true;
    } else if (depth == 1) {
      this.increment(cascadeInstance);
    }
    return false;
  }
}

export class AdjacentSiblingConditionItem
  extends AbstractConditionItem
  implements ConditionItem
{
  fired: boolean = false;

  constructor(
    condition: string,
    viewConditionId: string | null,
    viewCondition: Matchers.Matcher,
  ) {
    super(condition, viewConditionId, viewCondition);
  }

  /** @override */
  fresh(cascadeInstance: CascadeInstance): ConditionItem {
    return new AdjacentSiblingConditionItem(
      this.condition,
      this.viewConditionId,
      this.buildViewConditionMatcher(cascadeInstance),
    );
  }

  /** @override */
  push(cascadeInstance: CascadeInstance, depth: number): boolean {
    if (this.fired) {
      this.decrement(cascadeInstance);
      return true;
    }
    return false;
  }

  /** @override */
  pop(cascadeInstance: CascadeInstance, depth: number): boolean {
    if (this.fired) {
      this.decrement(cascadeInstance);
      return true;
    }
    if (depth == 0) {
      // Leaving element that triggered this item.
      this.fired = true;
      this.increment(cascadeInstance);
    }
    return false;
  }
}

export class FollowingSiblingConditionItem
  extends AbstractConditionItem
  implements ConditionItem
{
  fired: boolean = false;

  constructor(
    condition: string,
    viewConditionId: string | null,
    viewCondition: Matchers.Matcher,
  ) {
    super(condition, viewConditionId, viewCondition);
  }

  /** @override */
  fresh(cascadeInstance: CascadeInstance): ConditionItem {
    return new FollowingSiblingConditionItem(
      this.condition,
      this.viewConditionId,
      this.buildViewConditionMatcher(cascadeInstance),
    );
  }

  /** @override */
  push(cascadeInstance: CascadeInstance, depth: number): boolean {
    if (this.fired) {
      if (depth == -1) {
        this.increment(cascadeInstance);
      } else if (depth == 0) {
        this.decrement(cascadeInstance);
      }
    }
    return false;
  }

  /** @override */
  pop(cascadeInstance: CascadeInstance, depth: number): boolean {
    if (this.fired) {
      if (depth == -1) {
        this.decrement(cascadeInstance);
        return true;
      } else if (depth == 0) {
        this.increment(cascadeInstance);
      }
    } else {
      if (depth == 0) {
        // Leaving element that triggered this item.
        this.fired = true;
        this.increment(cascadeInstance);
      }
    }
    return false;
  }
}

/**
 * Not a true condition item, this class manages proper handling of "after"
 * pseudoelement.
 */
export class AfterPseudoelementItem implements ConditionItem {
  constructor(
    public readonly afterprop: ElementStyle,
    public readonly element: Element,
  ) {}

  /** @override */
  fresh(cascadeInstance: CascadeInstance): ConditionItem {
    return this;
  }

  /** @override */
  push(cascadeInstance: CascadeInstance, depth: number): boolean {
    return false;
  }

  /** @override */
  pop(cascadeInstance: CascadeInstance, depth: number): boolean {
    if (depth == 0) {
      cascadeInstance.processPseudoelementProps(this.afterprop, this.element);
      return true;
    }
    return false;
  }
}

/**
 * Not a true condition item, this class restores current language.
 */
export class RestoreLangItem implements ConditionItem {
  constructor(public readonly lang: string) {}

  /** @override */
  fresh(cascadeInstance: CascadeInstance): ConditionItem {
    return this;
  }

  /** @override */
  push(cascadeInstance: CascadeInstance, depth: number): boolean {
    return false;
  }

  /** @override */
  pop(cascadeInstance: CascadeInstance, depth: number): boolean {
    if (depth == 0) {
      cascadeInstance.lang = this.lang;
      return true;
    }
    return false;
  }
}

/**
 * Not a true condition item, this class manages inheritance of quotes property
 */
export class QuotesScopeItem implements ConditionItem {
  constructor(public readonly oldQuotes: Css.Str[]) {}

  /** @override */
  fresh(cascadeInstance: CascadeInstance): ConditionItem {
    return this;
  }

  /** @override */
  push(cascadeInstance: CascadeInstance, depth: number): boolean {
    return false;
  }

  /** @override */
  pop(cascadeInstance: CascadeInstance, depth: number): boolean {
    if (depth == 0) {
      cascadeInstance.quotes = this.oldQuotes;
      return true;
    }
    return false;
  }
}
export type CounterValues = {
  [key: string]: number[];
};

export interface CounterListener {
  countersOfId(id: string, counters: CounterValues);

  getExprContentListener(): Vtree.ExprContentListener;
}

export interface CounterResolver {
  setStyler(styler: CssStyler.AbstractStyler): void;

  /**
   * Returns an Exprs.Val, whose value is calculated at the layout time by
   * retrieving the innermost page-based counter (null if it does not exist) by
   * its name and formatting the value into a string.
   * @param name Name of the page-based counter to be retrieved
   * @param format A function that formats the counter value into a string
   */
  getPageCounterVal(
    name: string,
    format: (p1: number | null) => string,
  ): Exprs.Val;

  /**
   * Returns an Exprs.Val, whose value is calculated at the layout time by
   * retrieving the page-based counters by its name and formatting the values
   * into a string.
   * @param name Name of the page-based counters to be retrieved
   * @param format A function that formats the counter values (passed as an
   *     array ordered by the nesting depth with the outermost counter first and
   *     the innermost last) into a string
   */
  getPageCountersVal(name: string, format: (p1: number[]) => string): Exprs.Val;

  getTargetCounterVal(
    url: string,
    name: string,
    format: (p1: number | null) => string,
  ): Exprs.Val;

  getTargetCountersVal(
    url: string,
    name: string,
    format: (p1: number[]) => string,
  ): Exprs.Val;

  /**
   * Get value of the CSS target-text() function
   * https://drafts.csswg.org/css-content-3/#target-text
   * @param url Target URL (with fragment identifier)
   * @param pseudoElement Pseudo-element selector ('content', 'before', 'after', 'first-letter', 'marker')
   */
  getTargetTextVal(url: string, pseudoElement: string): Exprs.Val;

  /**
   * Get value of the CSS string() function
   * https://drafts.csswg.org/css-gcpm-3/#using-named-strings
   */
  getNamedStringVal(name: string, retrievePosition: string): Exprs.Val;

  /**
   * Set named string for the CSS string-set property
   * https://drafts.csswg.org/css-gcpm-3/#setting-named-strings-the-string-set-pro
   */
  setNamedString(
    name: string,
    stringValue: string,
    elementOffset: number,
  ): void;

  /**
   * Get value of the CSS element() function
   * https://drafts.csswg.org/css-gcpm-3/#running-elements
   */
  getRunningElementVal(name: string, retrievePosition: string): Exprs.Val;

  /**
   * Set running element
   * https://drafts.csswg.org/css-gcpm-3/#running-elements
   */
  setRunningElement(name: string, elementOffset: number): void;
}

export class AttrValueFilterVisitor extends Css.FilterVisitor {
  constructor(public element: Element) {
    super();
  }

  private createValueFromString(str: string | null, type: string): Css.Val {
    switch (type) {
      case "url":
        if (str) {
          return new Css.URL(str); // TODO should convert to absolute path
        }
        return new Css.URL("about:invalid");
      case "string":
      default:
        if (str) {
          return new Css.Str(str);
        }
        return new Css.Str("");
    }
  }

  override visitFunc(func: Css.Func): Css.Val {
    if (func.name !== "attr") {
      return super.visitFunc(func);
    }
    let type = "string";
    let attributeName: string | null = null;
    let defaultValue: Css.Val = null;
    if (func.values[0] instanceof Css.SpaceList) {
      const values = (func.values[0] as Css.SpaceList).values;
      if (values.length >= 2) {
        type = values[1].stringValue();
      }
      attributeName = values[0].stringValue();
    } else {
      attributeName = func.values[0].stringValue();
    }
    if (func.values.length > 1) {
      defaultValue = this.createValueFromString(
        func.values[1].stringValue(),
        type,
      );
    } else {
      defaultValue = this.createValueFromString(null, type);
    }
    if (this.element && this.element.hasAttribute(attributeName)) {
      return this.createValueFromString(
        this.element.getAttribute(attributeName),
        type,
      );
    }
    return defaultValue;
  }
}

/**
 * Get concatenated string value from CSS `string-set` and `content` property.
 * When context is provided, evaluates Css.Expr objects (e.g., counter() functions)
 * to their string values. Non-string results (except numbers) are ignored.
 */
function getStringValueFromCssContentVal(
  val: Css.Val,
  context?: Exprs.Context,
): string {
  if (Vtree.nonTrivialContent(val)) {
    if (val instanceof Css.Str) {
      return val.stringValue();
    }
    if (val instanceof Css.Expr && context) {
      // Evaluate expressions like counter() to get their string value.
      // Non-string results are ignored (except numbers, which are explicitly
      // stringified if desired).
      const result = val.expr.evaluate(context);
      if (typeof result === "string") {
        return result;
      }
      if (typeof result === "number") {
        return String(result);
      }
      return "";
    }
    if (val instanceof Css.SpaceList) {
      return val.values
        .map((v) => getStringValueFromCssContentVal(v, context))
        .join("");
    }
  }
  return "";
}

export class ContentPropVisitor extends Css.FilterVisitor {
  constructor(
    public cascade: CascadeInstance,
    public element: Element,
    public readonly counterResolver: CounterResolver,
    private readonly pseudoName?: string,
  ) {
    super();
  }

  private getCounterStore(): {
    currentPageCounters?: CounterValues;
    currentPageDocCounters?: CounterValues | null;
    isPageControlledCounter?: (name: string) => boolean;
    registerPageCounterExpr?: (
      name: string,
      format: (p1: number[]) => string,
      expr: Exprs.Val,
    ) => void;
  } | null {
    return ((this.cascade.context as { counterStore?: unknown })
      ?.counterStore ?? null) as {
      currentPageCounters?: CounterValues;
      currentPageDocCounters?: CounterValues | null;
      isPageControlledCounter?: (name: string) => boolean;
      registerPageCounterExpr?: (
        name: string,
        format: (p1: number[]) => string,
        expr: Exprs.Val,
      ) => void;
    } | null;
  }

  private getPageScope(): Exprs.LexicalScope | null {
    return (
      this.cascade.context as {
        style?: { pageScope?: Exprs.LexicalScope | null };
      }
    )?.style?.pageScope;
  }

  /**
   * Helper method to evaluate CSS values containing counter() and other functions,
   * then convert to string.
   */
  private evaluateAndGetString(val: Css.Val | null | undefined): string {
    if (!val) {
      return "";
    }
    // Snapshot quoteDepth to avoid leaking state changes from this evaluation.
    const originalQuoteDepth = this.cascade.quoteDepth;
    // Visit the value to resolve counter() and other functions
    const resolvedVal = val.visit(this);
    // Convert to string, evaluating any Css.Expr objects
    const result = getStringValueFromCssContentVal(
      resolvedVal,
      this.cascade.context,
    );
    // Restore quoteDepth so that later processing (e.g., ::before/::after)
    // is not affected by this helper.
    this.cascade.quoteDepth = originalQuoteDepth;
    return result;
  }

  override visitIdent(ident: Css.Ident): Css.Val {
    const cascade = this.cascade;
    const quotes = cascade.quotes;
    const maxDepth = Math.floor(quotes.length / 2) - 1;
    switch (ident.name) {
      case "open-quote": {
        const result = quotes[2 * Math.min(maxDepth, cascade.quoteDepth)];
        cascade.quoteDepth++;
        return result;
      }
      case "close-quote":
        if (cascade.quoteDepth > 0) {
          cascade.quoteDepth--;
        }
        return quotes[2 * Math.min(maxDepth, cascade.quoteDepth) + 1];
      case "no-open-quote":
        cascade.quoteDepth++;
        return new Css.Str("");
      case "no-close-quote":
        if (cascade.quoteDepth > 0) {
          cascade.quoteDepth--;
        }
        return new Css.Str("");
    }
    return ident;
  }

  private format(num: number, type: string): string {
    return this.cascade.counterStyleStore.format(type, num);
  }

  private formatCounterList(
    values: number[],
    separator: string,
    type: string,
  ): string {
    if (!values.length) {
      return this.format(0, type);
    }
    const sb = new Base.StringBuffer();
    for (let i = 0; i < values.length; i++) {
      if (i > 0) {
        sb.append(separator);
      }
      sb.append(this.format(values[i], type));
    }
    return sb.toString();
  }

  private formatLastValue(values: number[], type: string): string {
    const last = values.length ? values[values.length - 1] : 0;
    return this.format(last, type);
  }

  private buildCounterText(
    store: {
      currentPageCounters?: CounterValues;
      currentPageDocCounters?: CounterValues | null;
      isPageControlledCounter?: (name: string) => boolean;
    },
    counterName: string,
    type: string,
    cascadeDocCounters: number[],
    separator?: string,
  ): string {
    const isList = typeof separator === "string";
    const formatCounterValues = (values: number[]): string => {
      return isList
        ? this.formatCounterList(values, separator as string, type)
        : this.formatLastValue(values, type);
    };
    const storeFootnoteCounterValuesIfNeeded = (values: number[]): void => {
      if (this.pseudoName === "footnote-call" && this.element) {
        setFootnoteCounterValues(this.element, counterName, values);
      }
    };
    if (this.pseudoName === "footnote-marker" && this.element) {
      const map = getFootnoteCounterMap(this.element);
      const stored = map[counterName];
      if (stored) {
        return formatCounterValues(stored);
      }
    }
    let counterValues: number[];
    if (counterName === "pages") {
      return formatCounterValues([]);
    }

    if (!this.element) {
      const pageCounters = store.currentPageCounters?.[counterName] || [];
      if (pageCounters.length) {
        counterValues = pageCounters;
        storeFootnoteCounterValuesIfNeeded(counterValues);
        return formatCounterValues(counterValues);
      }
    }

    const docCounters = this.element
      ? cascadeDocCounters
      : store.currentPageDocCounters?.[counterName] || cascadeDocCounters;

    if (store.isPageControlledCounter?.(counterName)) {
      const docStartCounters =
        store.currentPageDocCounters?.[counterName] || [];
      const pageStartCounters = store.currentPageCounters?.[counterName] || [];
      const pageStartVal = pageStartCounters.length
        ? pageStartCounters[pageStartCounters.length - 1]
        : 0;
      // Adjust the outermost (first) counter value with the page contribution.
      // The page counter operates at the outermost scope, so only the first
      // level gets the cross-scope adjustment. Nested scopes created by
      // counter-reset in the document are not affected.
      const docStartVal = docStartCounters.length ? docStartCounters[0] : 0;
      const docVal0 = docCounters.length ? docCounters[0] : 0;
      const adjustedFirst = pageStartVal + (docVal0 - docStartVal);
      counterValues = docCounters.length
        ? [adjustedFirst, ...docCounters.slice(1)]
        : pageStartCounters.length
          ? pageStartCounters
          : [0];
      storeFootnoteCounterValuesIfNeeded(counterValues);
      return formatCounterValues(counterValues);
    }

    if (docCounters.length) {
      counterValues = docCounters;
      storeFootnoteCounterValuesIfNeeded(counterValues);
      return formatCounterValues(counterValues);
    }

    const pageCounters = store.currentPageCounters?.[counterName] || [];
    counterValues = pageCounters;
    storeFootnoteCounterValuesIfNeeded(counterValues);
    return formatCounterValues(counterValues);
  }

  visitFuncCounter(values: Css.Val[]): Css.Val {
    const counterName = values[0].toString();
    const type = values.length > 1 ? values[1].stringValue() : "decimal";
    const cascadeDocCounters = (
      this.cascade.counters[counterName] || []
    ).slice();
    // When a counter store is available, return a native expression so
    // page/document counters resolve at layout time.
    const counterStore = this.getCounterStore();
    if (counterStore) {
      const isPageCounter =
        counterName === "pages" ||
        counterStore?.isPageControlledCounter?.(counterName);
      const pageScope = this.getPageScope();
      const nativeExpr = new Exprs.Native(
        pageScope,
        () =>
          this.buildCounterText(
            counterStore,
            counterName,
            type,
            cascadeDocCounters,
          ),
        isPageCounter
          ? `page-counter-${counterName}`
          : `counter-${counterName}`,
      );
      if (isPageCounter && counterStore?.registerPageCounterExpr) {
        const arrayFormat = (arr: number[]) => this.formatLastValue(arr, type);
        counterStore.registerPageCounterExpr(
          counterName,
          arrayFormat,
          nativeExpr,
        );
      }
      return new Css.Expr(nativeExpr);
    }
    const arr = this.cascade.counters[counterName];
    if (arr && arr.length) {
      const numval = (arr && arr.length && arr[arr.length - 1]) || 0;
      return new Css.Str(this.format(numval, type));
    } else {
      const c = new Css.Expr(
        this.counterResolver.getPageCounterVal(counterName, (numval) =>
          this.format(numval || 0, type),
        ),
      );
      return new Css.SpaceList([c]);
    }
  }

  visitFuncCounters(values: Css.Val[]): Css.Val {
    const counterName = values[0].toString();
    const separator = values[1].stringValue();
    const type = values.length > 2 ? values[2].stringValue() : "decimal";
    const cascadeDocCounters = (
      this.cascade.counters[counterName] || []
    ).slice();
    const counterStore = this.getCounterStore();
    if (counterStore) {
      const isPageCounter =
        counterName === "pages" ||
        counterStore?.isPageControlledCounter?.(counterName);
      const pageScope = this.getPageScope();
      const nativeExpr = new Exprs.Native(
        pageScope,
        () =>
          this.buildCounterText(
            counterStore,
            counterName,
            type,
            cascadeDocCounters,
            separator,
          ),
        isPageCounter
          ? `page-counters-${counterName}`
          : `counters-${counterName}`,
      );
      if (isPageCounter && counterStore?.registerPageCounterExpr) {
        counterStore.registerPageCounterExpr(
          counterName,
          (arr: number[]) => {
            return this.formatCounterList(arr, separator, type);
          },
          nativeExpr,
        );
      }
      return new Css.Expr(nativeExpr);
    }
    const arr = this.cascade.counters[counterName];
    const sb = new Base.StringBuffer();
    if (arr && arr.length) {
      for (let i = 0; i < arr.length; i++) {
        if (i > 0) {
          sb.append(separator);
        }
        sb.append(this.format(arr[i], type));
      }
    }
    const c = new Css.Expr(
      this.counterResolver.getPageCountersVal(counterName, (numvals) => {
        const parts = [] as string[];
        if (numvals.length) {
          for (let i = 0; i < numvals.length; i++) {
            parts.push(this.format(numvals[i], type));
          }
        }
        const elementCounters = sb.toString();
        if (elementCounters.length) {
          parts.push(elementCounters);
        }
        if (parts.length) {
          return parts.join(separator);
        } else {
          return this.format(0, type);
        }
      }),
    );
    return new Css.SpaceList([c]);
  }

  visitFuncTargetCounter(values: Css.Val[]): Css.Val {
    const targetUrl = values[0];
    let targetUrlStr: string;
    if (targetUrl instanceof Css.URL) {
      targetUrlStr = targetUrl.url;
    } else {
      targetUrlStr = targetUrl.stringValue();
    }
    const counterName = values[1].toString();
    const type = values.length > 2 ? values[2].stringValue() : "decimal";
    const c = new Css.Expr(
      this.counterResolver.getTargetCounterVal(
        targetUrlStr,
        counterName,
        (numval) => this.format(numval || 0, type),
      ),
    );
    return new Css.SpaceList([c]);
  }

  visitFuncTargetCounters(values: Css.Val[]): Css.Val {
    const targetUrl = values[0];
    let targetUrlStr: string;
    if (targetUrl instanceof Css.URL) {
      targetUrlStr = targetUrl.url;
    } else {
      targetUrlStr = targetUrl.stringValue();
    }
    const counterName = values[1].toString();
    const separator = values[2].stringValue();
    const type = values.length > 3 ? values[3].stringValue() : "decimal";
    const c = new Css.Expr(
      this.counterResolver.getTargetCountersVal(
        targetUrlStr,
        counterName,
        (numvals) => {
          const parts = numvals.map((numval) => this.format(numval, type));
          if (parts.length) {
            return parts.join(separator);
          } else {
            return this.format(0, type);
          }
        },
      ),
    );
    return new Css.SpaceList([c]);
  }

  /**
   * CSS `target-text()` function
   * https://drafts.csswg.org/css-content-3/#target-text
   */
  visitFuncTargetText(values: Css.Val[]): Css.Val {
    const targetUrl = values[0];
    let targetUrlStr: string;
    if (targetUrl instanceof Css.URL) {
      targetUrlStr = targetUrl.url;
    } else {
      targetUrlStr = targetUrl.stringValue();
    }
    const pseudoElement =
      values.length > 1 ? values[1].stringValue() : "content";
    const c = new Css.Expr(
      this.counterResolver.getTargetTextVal(targetUrlStr, pseudoElement),
    );
    return new Css.SpaceList([c]);
  }

  /**
   * CSS `string()` function
   * https://drafts.csswg.org/css-gcpm-3/#using-named-strings
   */
  visitFuncString(values: Css.Val[]): Css.Val {
    const name = values.length > 0 ? values[0].stringValue() : "";
    const retrievePosition =
      values.length > 1 ? values[1].stringValue() : "first";

    return new Css.Expr(
      this.counterResolver.getNamedStringVal(name, retrievePosition),
    );
  }

  /**
   * CSS `element()` function
   * https://drafts.csswg.org/css-gcpm-3/#running-elements
   */
  visitFuncElement(values: Css.Val[]): Css.Val {
    const name = values.length > 0 ? values[0].stringValue() : "";
    const retrievePosition =
      values.length > 1 ? values[1].stringValue() : "first";

    return new Css.Expr(
      this.counterResolver.getRunningElementVal(name, retrievePosition),
    );
  }

  /**
   * CSS `content()` function
   * https://drafts.csswg.org/css-gcpm-3/#content-function-header
   */
  visitFuncContent(values: Css.Val[]): Css.Val {
    const pseudoName = values.length > 0 ? values[0].stringValue() : "text";
    let stringValue = "";
    switch (pseudoName) {
      case "text":
        stringValue = this.element.textContent;
        break;
      case "before":
      case "after":
      case "marker":
        {
          // Get the actual rendered text from the pseudo-element in the DOM.
          // Use querySelectorAll and check parentElement to avoid matching
          // nested pseudo-elements or user markup with data-adapt-pseudo.
          const pseudoElems = this.element?.querySelectorAll(
            `[data-adapt-pseudo="${pseudoName}"]`,
          );
          let pseudoElem: Element | null = null;
          if (pseudoElems && this.element) {
            for (let i = 0; i < pseudoElems.length; i++) {
              const candidate = pseudoElems[i] as Element;
              if (candidate.parentElement === this.element) {
                pseudoElem = candidate;
                break;
              }
            }
          }
          if (pseudoElem) {
            stringValue = pseudoElem.textContent || "";
          } else {
            // Fallback: get from stored styles and evaluate counter() functions
            const pseudos = getStyleMap(this.cascade.currentStyle, "_pseudos");
            const val = (pseudos?.[pseudoName]?.["content"] as CascadeValue)
              ?.value;
            stringValue = this.evaluateAndGetString(val);
          }
        }
        break;
      case "first-letter":
        {
          // Respect ::before/after pseudo-elements (Issue #1174)
          const pseudos = getStyleMap(this.cascade.currentStyle, "_pseudos");
          const beforeVal = (pseudos?.["before"]?.["content"] as CascadeValue)
            ?.value;
          const afterVal = (pseudos?.["after"]?.["content"] as CascadeValue)
            ?.value;
          const r = (
            this.evaluateAndGetString(beforeVal) ||
            this.element.textContent ||
            this.evaluateAndGetString(afterVal)
          ).match(Base.firstLetterPattern);
          stringValue = r ? r[0] : "";
        }
        break;
    }
    return new Css.Str(stringValue);
  }

  /**
   * CSS `leader()` function
   * https://www.w3.org/TR/css-content-3/#leaders
   */
  visitFuncLeader(values: Css.Val[]): Css.Val {
    let leader: string = "";
    if (values[0] instanceof Css.Ident) {
      switch (values[0].stringValue()) {
        case "dotted":
          leader = ".";
          break;
        case "solid":
          leader = "_";
          break;
        case "space":
          leader = " ";
          break;
      }
    } else if (values[0] instanceof Css.Str) {
      leader = values[0].stringValue();
    }
    if (leader.length == 0) {
      return new Css.Str("");
    }
    return new Css.Expr(new Exprs.Native(null, () => leader, "viv-leader"));
  }

  override visitFunc(func: Css.Func): Css.Val {
    switch (func.name) {
      case "counter":
        if (func.values.length <= 2) {
          return this.visitFuncCounter(func.values);
        }
        break;
      case "counters":
        if (func.values.length <= 3) {
          return this.visitFuncCounters(func.values);
        }
        break;
      case "target-counter":
        if (func.values.length <= 3) {
          return this.visitFuncTargetCounter(func.values);
        }
        break;
      case "target-counters":
        if (func.values.length <= 4) {
          return this.visitFuncTargetCounters(func.values);
        }
        break;
      case "target-text":
        if (func.values.length >= 1 && func.values.length <= 2) {
          return this.visitFuncTargetText(func.values);
        }
        break;
      case "string":
        if (func.values.length <= 2) {
          return this.visitFuncString(func.values);
        }
        break;
      case "element":
        if (func.values.length <= 2) {
          return this.visitFuncElement(func.values);
        }
        break;
      case "content":
        if (func.values.length <= 1) {
          return this.visitFuncContent(func.values);
        }
        break;
      case "leader":
        if (func.values.length <= 1) {
          return this.visitFuncLeader(func.values);
        }
        break;
    }
    // Logging.logger.warn("E_CSS_CONTENT_PROP:", func.toString());
    return func;
  }
}

/**
 * Get the total width of a node's content
 * @param node The node to measure (Element or Text)
 * @param clientLayout The client layout interface for accessing DOM
 * @param writingMode The writing mode (vertical-rl, vertical-lr, or horizontal)
 * @returns The total width (or height for vertical writing modes)
 */
function getContentWidth(
  node: Node,
  clientLayout: Vtree.ClientLayout,
  writingMode: string,
): number {
  let rects: { width: number; height: number }[];

  if (node.nodeType === 1) {
    rects = Array.from((node as Element).getClientRects());
  } else {
    const range = node.ownerDocument.createRange();
    range.selectNodeContents(node);
    rects = clientLayout.getRangeClientRects(range);
  }

  const totalWidth = rects.reduce(
    (acc, rect) =>
      acc +
      (writingMode === "vertical-rl" || writingMode === "vertical-lr"
        ? rect.height
        : rect.width),
    0,
  );

  return totalWidth;
}

/**
 * POST_LAYOUT_BLOCK hook function for CSS leader()
 * @param nodeContext
 * @param checkPoints
 * @param column
 */
const postLayoutBlockLeader: Plugin.PostLayoutBlockHook = (
  nodeContext: Vtree.NodeContext,
  checkPoints: Vtree.NodeContext[],
  column: Layout.Column,
) => {
  const leaders: Vtree.NodeContext[] = checkPoints.filter(
    (c) =>
      c.after &&
      c.viewNode.nodeType === 1 &&
      (c.viewNode as Element).getAttribute("data-viv-leader"),
  );
  for (const c of leaders) {
    // we want to access the bottom block element, which contains single leader().
    let container = c.parent;
    while (container && container.inline) {
      container = container.parent;
    }
    const leaderElem = c.viewNode as HTMLElement;
    const pseudoElem = leaderElem.parentElement;
    const pseudoName = pseudoElem.getAttribute("data-adapt-pseudo");
    const leader = leaderElem.getAttribute("data-viv-leader-value");
    const { writingMode, direction, marginInlineEnd } =
      column.clientLayout.getElementComputedStyle(pseudoElem);

    function setLeaderTextContent(leaderStr: string): void {
      if (direction === "rtl") {
        // in RTL direction, enclose the leader with U+200F (RIGHT-TO-LEFT MARK)
        // to ensure RTL order around the leader.
        const RLM = "\u200f";
        leaderElem.textContent =
          (leaderStr.startsWith(RLM) ? "" : RLM) +
          leaderStr +
          (leaderStr.endsWith(RLM) ? "" : RLM);
      } else {
        leaderElem.textContent = leaderStr;
      }
    }

    // prevent leader layout problem (Issue #1117)
    leaderElem.style.marginInlineStart = "1px";

    // reset the expanded leader
    setLeaderTextContent(leader);
    // setting inline-block removes the pseudo CONTENT from normal text flow
    pseudoElem.style.display = "inline-block";
    pseudoElem.style.textIndent = "0"; // cancel inherited text-indent

    // Workaround for Issue #1598:
    // In multi-column layout with column-fill: balance, changing leader length
    // triggers column rebalancing, making the initially measured `box` unreliable.
    // Temporarily switch column-fill to auto to prevent rebalancing during
    // leader calculation.
    // Note: findAncestorNonRootMultiColumn is correct here. Root-level multi-column
    // is handled by Vivliostyle's own column balancing (ColumnBalancer), not the
    // browser's column-fill: balance, so this issue only affects non-root multi-column.
    const columnContainer = LayoutHelper.findAncestorNonRootMultiColumn(
      container.viewNode,
    ) as HTMLElement | null;
    const originalColumnFill = columnContainer?.style.columnFill || null;
    if (columnContainer) {
      columnContainer.style.columnFill = "auto";
    }

    const box = column.clientLayout.getElementClientRect(
      container.viewNode as Element,
    );
    const innerInit = column.clientLayout.getElementClientRect(pseudoElem);
    const innerMarginInlineEnd = column.parseComputedLength(marginInlineEnd);

    // Calculate width of following inline siblings (Issue #1563)
    const inlineNodes: Node[] = [];

    // Find the topmost inline ancestor (child of block ancestor) that contains pseudoElement
    let topmostInlineAncestor: Element = pseudoElem.parentElement;
    while (
      topmostInlineAncestor.parentElement &&
      topmostInlineAncestor.parentElement !== (container.viewNode as Element)
    ) {
      topmostInlineAncestor = topmostInlineAncestor.parentElement;
    }

    // Start collecting siblings from the next sibling of the topmost inline ancestor
    let sibling = topmostInlineAncestor.nextSibling;

    // Collect all following inline siblings
    while (sibling) {
      if (sibling.nodeType === 1) {
        // Node.ELEMENT_NODE
        const elem = sibling as Element;
        const { display, float, position } =
          column.clientLayout.getElementComputedStyle(elem);

        // Skip out-of-flow elements
        if (
          float !== "none" ||
          position === "absolute" ||
          position === "fixed"
        ) {
          sibling = sibling.nextSibling;
          continue;
        }

        // Collect inline-level elements
        if (Display.isInlineLevel(display)) {
          inlineNodes.push(elem);
        } else if (Display.isBlockLevel(display)) {
          break;
        }
      } else if (sibling.nodeType === 3) {
        // Node.TEXT_NODE
        const text = sibling as Text;
        if (text.length > 0) {
          inlineNodes.push(text);
        }
      }
      sibling = sibling.nextSibling;
    }

    // Measure the width of following siblings by reducing each node's actual width
    let followingInlineSiblingsWidth = inlineNodes.reduce(
      (acc, node) =>
        acc + getContentWidth(node, column.clientLayout, writingMode),
      0,
    );

    // For ::before or content (non-::after), add parent element's remaining width
    // (content + ::after for ::before, ::after for content)
    if (pseudoName !== "after") {
      const parentWidth = getContentWidth(
        topmostInlineAncestor,
        column.clientLayout,
        writingMode,
      );
      const pseudoWidth = getContentWidth(
        pseudoElem,
        column.clientLayout,
        writingMode,
      );

      followingInlineSiblingsWidth += parentWidth - pseudoWidth;
    }

    // capture the line boundary
    // Some leader text ("_" e.g.) creates higher top than container.
    if (writingMode === "vertical-rl" || writingMode === "vertical-lr") {
      if (direction === "rtl") {
        box.top += innerMarginInlineEnd;
      } else {
        box.bottom -= innerMarginInlineEnd;
      }
      box.top = Math.min(innerInit.top, box.top);
      box.bottom = Math.max(innerInit.bottom, box.bottom);
    } else {
      if (direction === "rtl") {
        box.left += innerMarginInlineEnd;
      } else {
        box.right -= innerMarginInlineEnd;
      }
      box.left = Math.min(innerInit.left, box.left);
      box.right = Math.max(innerInit.right, box.right);
    }

    function overrun() {
      const inner = column.clientLayout.getElementClientRect(pseudoElem);
      if (writingMode === "vertical-rl" || writingMode === "vertical-lr") {
        if (direction === "rtl") {
          inner.top -= followingInlineSiblingsWidth;
        } else {
          inner.bottom += followingInlineSiblingsWidth;
        }
      } else {
        if (direction === "rtl") {
          inner.left -= followingInlineSiblingsWidth;
        } else {
          inner.right += followingInlineSiblingsWidth;
        }
      }
      if (
        box.left > inner.left ||
        box.right < inner.right ||
        box.top > inner.top ||
        box.bottom < inner.bottom
      ) {
        return true;
      }
      return false;
    }

    function setLeader() {
      // min-max search
      let lower: number;
      let upper: number;
      let templeader = leader.repeat(10000);
      setLeaderTextContent(templeader);
      if (overrun()) {
        lower = 1;
        upper = 10000;
      } else {
        return;
      }
      // leader is set to overrun state here
      for (let i = 0; i < 16; i++) {
        let templeader = "";
        const mid = Math.floor((lower + upper) / 2);
        for (let j = 0; j < mid; j++) {
          templeader += leader;
        }
        setLeaderTextContent(templeader);
        if (overrun()) {
          upper = mid;
        } else {
          if (lower == mid) {
            return;
          }
          lower = mid;
        }
      }
      setLeaderTextContent(leader);
    }

    // set the expanded leader
    setLeader();

    // Without inline-end, we use margin-inline-start to adjust the position.
    // To get the margin size, set float, calculate then cancel float.
    const innerInline = column.clientLayout.getElementClientRect(pseudoElem);
    if (direction == "rtl") {
      pseudoElem.style.float = "left";
    } else {
      pseudoElem.style.float = "right";
    }
    const innerAligned = column.clientLayout.getElementClientRect(pseudoElem);
    // When float is applied, the content will be removed from the normal
    // text flow, and box inset will be also removed.
    // When content comes back to the normal text flow, then inset effects again.
    function getInset(side: string): number {
      let inset = 0;
      let p = pseudoElem.parentElement;
      while (p && p !== container.viewNode) {
        inset += column.getComputedInsets(p)[side];
        p = p.parentElement;
      }
      return inset;
    }
    let padding = 0;
    if (direction == "rtl") {
      if (writingMode == "vertical-rl" || writingMode == "vertical-lr") {
        padding = innerInline.top - innerAligned.top - getInset("top");
      } else {
        padding = innerInline.left - innerAligned.left - getInset("left");
      }
    } else {
      if (writingMode == "vertical-rl" || writingMode == "vertical-lr") {
        padding = innerAligned.bottom - innerInline.bottom - getInset("bottom");
      } else {
        padding = innerAligned.right - innerInline.right - getInset("right");
      }
    }
    padding -= followingInlineSiblingsWidth;
    padding = Math.max(0, padding - 0.1); // prevent line wrapping (Issue #1112)
    pseudoElem.style.float = "";
    leaderElem.style.marginInlineStart = `${padding}px`;

    // Restore column-fill
    if (columnContainer) {
      if (originalColumnFill) {
        columnContainer.style.columnFill = originalColumnFill;
      } else {
        columnContainer.style.removeProperty("column-fill");
      }
    }
  }
};

Plugin.registerHook(Plugin.HOOKS.POST_LAYOUT_BLOCK, postLayoutBlockLeader);

export function roman(num: number): string {
  if (num <= 0 || num != Math.round(num) || num > 3999) {
    return "";
  }
  const digits = ["I", "V", "X", "L", "C", "D", "M"];
  let offset = 0;
  let acc = "";
  while (num > 0) {
    let digit = num % 10;
    num = (num - digit) / 10;
    let result = "";
    if (digit == 9) {
      result += digits[offset] + digits[offset + 2];
    } else if (digit == 4) {
      result += digits[offset] + digits[offset + 1];
    } else {
      if (digit >= 5) {
        result += digits[offset + 1];
        digit -= 5;
      }
      while (digit > 0) {
        result += digits[offset];
        digit--;
      }
    }
    acc = result + acc;
    offset += 2;
  }
  return acc;
}

/**
 * Fitting order and specificity in the same number. Order is recorded in the
 * fractional part. Select value so that
 *
 *   0x7FFFFFFF != 0x7FFFFFFF + ORDER_INCREMENT
 *
 */
export const ORDER_INCREMENT = 1 / 0x100000;

export function copyTable(src: ActionTable, dst: ActionTable): void {
  for (const n in src) {
    dst[n] = src[n].clone();
  }
}

export class Cascade {
  nsCount: number = 0;
  nsPrefix: { [key: string]: string } = {};
  tags: ActionTable = {};
  nstags: ActionTable = {};
  epubtypes: ActionTable = {};
  classes: ActionTable = {};
  ids: ActionTable = {};
  pagetypes: ActionTable = {};
  order: number = 0;

  clone(): Cascade {
    const r = new Cascade();
    r.nsCount = this.nsCount;
    for (const p in this.nsPrefix) {
      r.nsPrefix[p] = this.nsPrefix[p];
    }
    copyTable(this.tags, r.tags);
    copyTable(this.nstags, r.nstags);
    copyTable(this.epubtypes, r.epubtypes);
    copyTable(this.classes, r.classes);
    copyTable(this.ids, r.ids);
    copyTable(this.pagetypes, r.pagetypes);
    r.order = this.order;
    return r;
  }

  insertInTable(table: ActionTable, key: string, action: CascadeAction): void {
    const a = table[key];
    if (a) {
      action = a.mergeWith(action);
    }
    table[key] = action;
  }

  createInstance(
    context: Exprs.Context,
    counterListener: CounterListener,
    counterResolver: CounterResolver,
    lang,
    counterStyleStore: CounterStyle.CounterStyleStore,
    cmykStore: CmykStore.CmykStore,
  ): CascadeInstance {
    return new CascadeInstance(
      this,
      context,
      counterListener,
      counterResolver,
      lang,
      counterStyleStore,
      cmykStore,
    );
  }

  nextOrder(): number {
    return (this.order += ORDER_INCREMENT);
  }
}

export class CascadeInstance {
  code: Cascade;
  stack = [[], []] as ConditionItem[][];
  conditions = Object.create(null) as { [key: string]: number };
  currentElement: Element | null = null;
  currentElementOffset: number | null = null;
  currentStyle: ElementStyle | null = null;
  currentClassNames: string[] | null = null;
  currentLocalName: string = "";
  currentNamespace: string = "";
  currentId: string = "";
  currentXmlId: string = "";
  currentNSTag: string = "";
  currentEpubTypes: string[] | null = null;
  currentPageType: string | null = null;
  previousPageType: string | null = null;
  firstPageType: string | null = null;
  pageTypePageCounts: { [pageType: string]: number } = Object.create(null);
  isFirst: boolean = true;
  isRoot: boolean = true;
  counters: CounterValues = Object.create(null);
  lastCounterChanges: string[] = [];
  lastCounterChangeTypes: {
    [key: string]: "reset" | "set" | "increment";
  } = Object.create(null);
  counterScoping: { [key: string]: boolean }[] = [Object.create(null)];
  quotes: Css.Str[];
  quoteDepth: number = 0;
  lang: string = "";
  siblingOrderStack: number[] = [0];
  currentSiblingOrder: number = 0;
  siblingTypeCountsStack: { [key: string]: { [key: string]: number } }[] = [{}];
  currentSiblingTypeCounts: { [key: string]: { [key: string]: number } };
  currentFollowingSiblingOrder: number | null = null;
  followingSiblingOrderStack: (number | null)[];
  followingSiblingTypeCountsStack: {
    [key: string]: { [key: string]: number };
  }[] = [{}];
  currentFollowingSiblingTypeCounts: {
    [key: string]: { [key: string]: number };
  };
  viewConditions: { [key: string]: Matchers.Matcher[] } = Object.create(null);
  dependentConditions: string[] = [];
  elementStack: Element[];

  constructor(
    cascade: Cascade,
    public readonly context: Exprs.Context,
    public readonly counterListener: CounterListener,
    public readonly counterResolver: CounterResolver,
    lang: string,
    public readonly counterStyleStore: CounterStyle.CounterStyleStore,
    public readonly cmykStore: CmykStore.CmykStore,
  ) {
    this.code = cascade;
    this.quotes = [
      new Css.Str("\u201c"),
      new Css.Str("\u201d"),
      new Css.Str("\u2018"),
      new Css.Str("\u2019"),
    ];
    this.currentSiblingTypeCounts = this.siblingTypeCountsStack[0];
    this.followingSiblingOrderStack = [this.currentFollowingSiblingOrder];
    this.currentFollowingSiblingTypeCounts = this.siblingTypeCountsStack[0];
    if (VIVLIOSTYLE_DEBUG) {
      this.elementStack = [];
    }
  }

  pushConditionItem(item: ConditionItem): void {
    this.stack[this.stack.length - 1].push(item);
  }

  increment(condition: string, viewCondition: Matchers.Matcher): void {
    this.conditions[condition] = (this.conditions[condition] || 0) + 1;
    if (!viewCondition) {
      return;
    }
    if (this.viewConditions[condition]) {
      this.viewConditions[condition].push(viewCondition);
    } else {
      this.viewConditions[condition] = [viewCondition];
    }
  }

  decrement(condition: string, viewCondition: Matchers.Matcher): void {
    this.conditions[condition]--;
    if (!this.viewConditions[condition]) {
      return;
    }
    this.viewConditions[condition] = this.viewConditions[condition].filter(
      (item) => item !== viewCondition,
    );
    if (this.viewConditions[condition].length === 0) {
      delete this.viewConditions[condition];
    }
  }

  buildViewConditionMatcher(viewConditionId: string | null): Matchers.Matcher {
    let matcher: Matchers.Matcher = null;
    if (viewConditionId) {
      Asserts.assert(this.currentElementOffset);
      matcher = Matchers.MatcherBuilder.buildViewConditionMatcher(
        this.currentElementOffset,
        viewConditionId,
      );
    }
    const dependentConditionMatchers = this.dependentConditions
      .map((conditionId) => {
        const conditions = this.viewConditions[conditionId];
        if (conditions && conditions.length > 0) {
          return conditions.length === 1
            ? conditions[0]
            : Matchers.MatcherBuilder.buildAnyMatcher([].concat(conditions));
        } else {
          return null;
        }
      })
      .filter((item) => item);
    if (dependentConditionMatchers.length <= 0) {
      return matcher;
    }
    if (matcher === null) {
      return dependentConditionMatchers.length === 1
        ? dependentConditionMatchers[0]
        : Matchers.MatcherBuilder.buildAllMatcher(dependentConditionMatchers);
    }
    return Matchers.MatcherBuilder.buildAllMatcher(
      [matcher].concat(dependentConditionMatchers),
    );
  }

  applyAction(table: ActionTable, key: string): void {
    const action = table[key];
    if (action) {
      action.apply(this);
    }
  }

  pushRule(
    classes: string[],
    pageType: string | null,
    baseStyle: ElementStyle,
  ): void {
    this.currentElement = null;
    this.currentElementOffset = null;
    this.currentStyle = baseStyle;
    this.currentNamespace = "";
    this.currentLocalName = "";
    this.currentId = "";
    this.currentXmlId = "";
    this.currentClassNames = classes;
    this.currentNSTag = "";
    this.currentEpubTypes = EMPTY;
    this.currentPageType = pageType;
    this.applyActions();
  }

  defineCounter(counterName: string, value: number) {
    let scoping = this.counterScoping[this.counterScoping.length - 1];
    if (!scoping) {
      scoping = Object.create(null);
      this.counterScoping[this.counterScoping.length - 1] = scoping;
    }
    if (this.counters[counterName]) {
      if (scoping[counterName]) {
        this.counters[counterName].pop();
      }
      this.counters[counterName].push(value);
    } else {
      this.counters[counterName] = [value];
    }
    scoping[counterName] = true;
  }

  pushCounters(props: ElementStyle): void {
    const counterChanges = new Set<string>();
    const counterChangeTypes: {
      [key: string]: "reset" | "set" | "increment";
    } = Object.create(null);
    let displayVal: Css.Val = Css.ident.inline;
    const display = props["display"] as CascadeValue;
    if (display) {
      displayVal = display.evaluate(this.context);
    }
    // Ignore counter-* on 'display: none' elements and their descendants
    if (displayVal === Css.ident.none) {
      this.currentElement.setAttribute("data-viv-display-none", "true");
      this.lastCounterChanges = [];
      this.lastCounterChangeTypes = Object.create(null);
      this.counterScoping.push(null);
      return;
    } else if (this.currentElement.closest("[data-viv-display-none]")) {
      this.lastCounterChanges = [];
      this.lastCounterChangeTypes = Object.create(null);
      this.counterScoping.push(null);
      return;
    }
    let floatVal: Css.Val = Css.ident.inline;
    const float = props["float"] as CascadeValue;
    if (float) {
      floatVal = float.evaluate(this.context);
    }
    let resetMap: { [key: string]: number } = null;
    let incrementMap: { [key: string]: number } = null;
    let setMap: { [key: string]: number } = null;
    const reset = props["counter-reset"] as CascadeValue;
    if (reset) {
      const resetVal = reset.evaluate(this.context);
      if (resetVal) {
        resetMap = CssProp.toCounters(resetVal, { reset: true });
      }
    }
    const set = props["counter-set"] as CascadeValue;
    if (set) {
      const setVal = set.evaluate(this.context);
      if (setVal) {
        setMap = CssProp.toCounters(setVal, { defaultValue: 0 });
      }
    }
    const increment = props["counter-increment"] as CascadeValue;
    if (increment) {
      const incrementVal = increment.evaluate(this.context);
      if (incrementVal) {
        incrementMap = CssProp.toCounters(incrementVal);
      }
    }
    if (
      (this.currentLocalName == "ol" || this.currentLocalName == "ul") &&
      this.currentNamespace == Base.NS.XHTML
    ) {
      if (!resetMap) {
        resetMap = Object.create(null);
      }
      resetMap["list-item"] = ((this.currentElement as any)?.start ?? 1) - 1;
    }
    if (Display.isListItem(displayVal)) {
      if (!incrementMap) {
        incrementMap = Object.create(null);
      }
      incrementMap["list-item"] = incrementMap["list-item"] ?? 1;
      if (
        /^\s*[-+]?\d/.test(this.currentElement?.getAttribute("value") ?? "")
      ) {
        if (!setMap) {
          setMap = Object.create(null);
        }
        setMap["list-item"] = (this.currentElement as any).value;
      }
    }
    if (this.currentElement?.parentNode.nodeType === Node.DOCUMENT_NODE) {
      if (!resetMap) {
        resetMap = Object.create(null);
      }
      // `counter-reset: footnote 0` is implicitly applied on the root element
      if (resetMap["footnote"] === undefined) {
        resetMap["footnote"] = 0;
      }
    }
    if (floatVal === Css.ident.footnote) {
      if (!incrementMap) {
        incrementMap = Object.create(null);
      }
      // `counter-increment: footnote 1` is implicitly applied on the
      // element (or pseudo element) with `float: footnote`,
      // unless `counter-increment: footnote` is explicitly specified
      // on the element (parent element of the pseudo element).
      if (incrementMap["footnote"] === undefined) {
        const incrPropValue = (
          this.currentStyle["counter-increment"] as CascadeValue
        )?.value;
        if (
          !incrPropValue ||
          !(
            incrPropValue === Css.ident.footnote ||
            (incrPropValue instanceof Css.SpaceList &&
              incrPropValue.values.includes(Css.ident.footnote))
          )
        ) {
          incrementMap["footnote"] = 1;
        }
      }
    }
    if (resetMap) {
      for (const resetCounterName in resetMap) {
        counterChanges.add(resetCounterName);
        counterChangeTypes[resetCounterName] = "reset";
      }
    }
    if (incrementMap) {
      for (const incrementCounterName in incrementMap) {
        counterChanges.add(incrementCounterName);
        if (!counterChangeTypes[incrementCounterName]) {
          counterChangeTypes[incrementCounterName] = "increment";
        }
      }
    }
    if (setMap) {
      for (const setCounterName in setMap) {
        counterChanges.add(setCounterName);
        counterChangeTypes[setCounterName] = "set";
      }
    }
    this.lastCounterChanges = Array.from(counterChanges);
    this.lastCounterChangeTypes = counterChangeTypes;
    if (resetMap) {
      for (const resetCounterName in resetMap) {
        this.defineCounter(resetCounterName, resetMap[resetCounterName]);
      }
    }
    if (incrementMap) {
      for (const incrementCounterName in incrementMap) {
        if (!this.counters[incrementCounterName]) {
          this.defineCounter(incrementCounterName, 0);
        }
        const counterValues = this.counters[incrementCounterName];
        counterValues[counterValues.length - 1] +=
          incrementMap[incrementCounterName];
      }
    }
    if (setMap) {
      for (const setCounterName in setMap) {
        if (!this.counters[setCounterName]) {
          this.defineCounter(setCounterName, setMap[setCounterName]);
        } else {
          const counterValues = this.counters[setCounterName];
          counterValues[counterValues.length - 1] = setMap[setCounterName];
        }
      }
    }
    if (Display.isListItem(displayVal)) {
      const listItemCounts = this.counters["list-item"];
      const listItemCount = listItemCounts[listItemCounts.length - 1];
      props["ua-list-item-count"] = new CascadeValue(
        new Css.Num(listItemCount),
        0,
      );
      // Ensure that ::marker pseudo-element exists for the list item
      const pseudos = getMutableStyleMap(props, "_pseudos");
      if (!pseudos["marker"]) {
        pseudos["marker"] = {};
      }
    }
    this.counterScoping.push(null);
  }

  popCounters(): void {
    const scoping = this.counterScoping.pop();
    if (scoping) {
      for (const counterName in scoping) {
        const arr = this.counters[counterName];
        if (arr) {
          if (arr.length == 1) {
            delete this.counters[counterName];
          } else {
            arr.pop();
          }
        }
      }
    }
  }

  /**
   * Process CSS string-set property
   * https://drafts.csswg.org/css-gcpm-3/#setting-named-strings-the-string-set-pro
   */
  setNamedStrings(props: ElementStyle): void {
    let stringSet = props["string-set"] as CascadeValue;
    if (!stringSet) {
      return;
    }
    stringSet = stringSet.filterValue(
      new ContentPropVisitor(this, this.currentElement, this.counterResolver),
    );
    const sets =
      stringSet.value instanceof Css.CommaList
        ? stringSet.value.values
        : [stringSet.value];

    for (const set of sets) {
      if (set instanceof Css.SpaceList) {
        const name = set.values[0].stringValue();
        const stringValue = set.values
          .slice(1)
          .map((v) => getStringValueFromCssContentVal(v, this.context))
          .join("");
        this.counterResolver.setNamedString(
          name,
          stringValue,
          this.currentElementOffset,
        );
      }
    }
    delete props["string-set"];
  }

  /**
   * Process CSS running elements
   * https://drafts.csswg.org/css-gcpm-3/#running-elements
   */
  setRunningElement(props: ElementStyle): void {
    const position = props["position"] as CascadeValue;
    if (
      position?.value instanceof Css.Func &&
      position.value.name === "running"
    ) {
      const name = position.value.values[0].stringValue();
      this.counterResolver.setRunningElement(name, this.currentElementOffset);
    }
  }

  processPseudoelementProps(
    pseudoprops: ElementStyle,
    element: Element,
    pseudoName?: string,
  ): void {
    this.pushCounters(pseudoprops);
    const content = pseudoprops["content"] as CascadeValue;
    if (content) {
      pseudoprops["content"] = content.filterValue(
        new ContentPropVisitor(this, element, this.counterResolver, pseudoName),
      );
    }
    this.popCounters();
  }

  pushElement(
    styler: CssStyler.AbstractStyler,
    element: Element,
    baseStyle: ElementStyle,
    elementOffset: number,
  ): void {
    if (VIVLIOSTYLE_DEBUG) {
      this.elementStack.push(element);
    }

    // do not apply page rules
    this.currentPageType = null;
    this.currentElement = element;
    this.currentElementOffset = elementOffset;
    this.currentStyle = baseStyle;
    this.currentNamespace = element.namespaceURI;
    this.currentLocalName = element.localName;
    const prefix = this.code.nsPrefix[this.currentNamespace];
    if (prefix) {
      this.currentNSTag = prefix + this.currentLocalName;
    } else {
      this.currentNSTag = "";
    }
    this.currentId = element.getAttribute("id");
    this.currentXmlId = element.getAttributeNS(Base.NS.XML, "id");
    const classes = element.getAttribute("class");
    if (classes) {
      this.currentClassNames = classes.split(/\s+/);
    } else {
      this.currentClassNames = EMPTY;
    }
    const types = element.getAttributeNS(Base.NS.epub, "type");
    if (types) {
      this.currentEpubTypes = types.split(/\s+/);
    } else {
      this.currentEpubTypes = EMPTY;
    }
    const lang = Base.getLangAttribute(element);
    if (lang) {
      this.stack[this.stack.length - 1].push(new RestoreLangItem(this.lang));
      this.lang = lang.toLowerCase();
    }
    const isRoot = this.isRoot;
    const siblingOrderStack = this.siblingOrderStack;
    this.currentSiblingOrder = ++siblingOrderStack[
      siblingOrderStack.length - 1
    ];
    siblingOrderStack.push(0);
    const siblingTypeCountsStack = this.siblingTypeCountsStack;
    const currentSiblingTypeCounts = (this.currentSiblingTypeCounts =
      siblingTypeCountsStack[siblingTypeCountsStack.length - 1]);
    let currentNamespaceTypeCounts =
      currentSiblingTypeCounts[this.currentNamespace];
    if (!currentNamespaceTypeCounts) {
      currentNamespaceTypeCounts = currentSiblingTypeCounts[
        this.currentNamespace
      ] = {};
    }
    currentNamespaceTypeCounts[this.currentLocalName] =
      (currentNamespaceTypeCounts[this.currentLocalName] || 0) + 1;
    siblingTypeCountsStack.push({});
    const followingSiblingOrderStack = this.followingSiblingOrderStack;
    if (
      followingSiblingOrderStack[followingSiblingOrderStack.length - 1] !== null
    ) {
      this.currentFollowingSiblingOrder = --followingSiblingOrderStack[
        followingSiblingOrderStack.length - 1
      ];
    } else {
      this.currentFollowingSiblingOrder = null;
    }
    followingSiblingOrderStack.push(null);
    const followingSiblingTypeCountsStack =
      this.followingSiblingTypeCountsStack;
    const currentFollowingSiblingTypeCounts =
      (this.currentFollowingSiblingTypeCounts =
        followingSiblingTypeCountsStack[
          followingSiblingTypeCountsStack.length - 1
        ]);
    if (
      currentFollowingSiblingTypeCounts &&
      currentFollowingSiblingTypeCounts[this.currentNamespace]
    ) {
      currentFollowingSiblingTypeCounts[this.currentNamespace][
        this.currentLocalName
      ]--;
    }
    followingSiblingTypeCountsStack.push({});
    this.applyActions();

    // Substitute var()
    this.applyVarFilter([this.currentStyle], styler, element);

    // Calculate calc()
    this.applyCalcFilter(this.currentStyle, this.context);

    // Convert device-cmyk() to color(srgb ...)
    this.applyCmykFilter(this.currentStyle, this.currentElement);

    this.applyAttrFilter(element);
    const quotesCasc = baseStyle["quotes"] as CascadeValue;
    let itemToPushLast: QuotesScopeItem | null = null;
    if (quotesCasc) {
      const quotesVal = quotesCasc.evaluate(this.context);
      if (quotesVal) {
        itemToPushLast = new QuotesScopeItem(this.quotes);
        if (quotesVal === Css.ident.none) {
          this.quotes = [new Css.Str(""), new Css.Str("")];
        } else if (
          quotesVal === Css.ident.auto ||
          quotesVal === Css.ident.initial
        ) {
          this.quotes = [
            new Css.Str("\u201c"),
            new Css.Str("\u201d"),
            new Css.Str("\u2018"),
            new Css.Str("\u2019"),
          ];
          // FIXME: quotes:auto should be based on the content language
        } else if (quotesVal instanceof Css.SpaceList) {
          this.quotes = (quotesVal as Css.SpaceList).values as Css.Str[];
        }
      }
    }
    this.pushCounters(this.currentStyle);
    const id =
      this.currentId || this.currentXmlId || element.getAttribute("name") || "";
    if (isRoot || id) {
      const counters: CounterValues = Object.create(null);
      Object.keys(this.counters).forEach((name) => {
        counters[name] = Array.from(this.counters[name]);
      });
      this.counterListener.countersOfId(id, counters);
    }
    const pseudos = getStyleMap(this.currentStyle, "_pseudos");
    if (pseudos) {
      let before = true;
      for (const pseudoName of pseudoNames) {
        if (!pseudoName) {
          // content
          before = false;
        }
        const pseudoProps = pseudos[pseudoName];
        if (pseudoProps) {
          if (
            ((pseudoName === "before" || pseudoName === "after") &&
              !Vtree.nonTrivialContent(
                (pseudoProps["content"] as CascadeValue)?.value,
              )) ||
            (pseudoName === "marker" &&
              !Display.isListItem(
                getProp(this.currentStyle, "display")?.value,
              )) ||
            ((pseudoName === "footnote-call" ||
              pseudoName === "footnote-marker") &&
              getProp(this.currentStyle, "float")?.value !== Css.ident.footnote)
          ) {
            delete pseudos[pseudoName];
          } else if (before) {
            this.processPseudoelementProps(pseudoProps, element, pseudoName);

            if (pseudoName === "marker") {
              // Make marker content from list-style-* properties
              this.processMarkerPseudoelementProps(
                pseudoProps,
                element,
                styler,
              );
            } else if (
              pseudoName === "first-letter" &&
              pseudoProps["initial-letter"]
            ) {
              // initial-letter on ::first-letter
              const initialLetter = pseudoProps[
                "initial-letter"
              ] as CascadeValue;
              const initialLetterVal = initialLetter.evaluate(this.context);
              if (
                initialLetterVal !== Css.ident.normal &&
                !Css.isDefaultingValue(initialLetterVal)
              ) {
                this.currentStyle["--viv-initialLetter"] = new CascadeValue(
                  initialLetterVal,
                  0,
                );
              }
              delete pseudoProps["initial-letter"];
            }
          } else {
            this.stack[this.stack.length - 2].push(
              new AfterPseudoelementItem(pseudoProps, element),
            );
          }
        }
      }
    }

    // process CSS string-set property
    this.setNamedStrings(this.currentStyle);

    // process CSS running elements
    this.setRunningElement(this.currentStyle);

    if (itemToPushLast) {
      this.stack[this.stack.length - 2].push(itemToPushLast);
    }
  }

  processMarkerPseudoelementProps(
    pseudoProps: ElementStyle,
    element: Element,
    styler: CssStyler.AbstractStyler,
  ): void {
    if (
      !Vtree.nonTrivialContent(
        (pseudoProps["content"] as CascadeValue)?.value,
      ) &&
      Display.isListItem((this.currentStyle["display"] as CascadeValue)?.value)
    ) {
      // If no ::marker content is specified and the element is a list-item,
      // make content from list-style-type or list-style-image.
      const listStyleType = this.getInheritedPropertyValue(
        "list-style-type",
        styler,
        element,
      );
      const listStyleImage = this.getInheritedPropertyValue(
        "list-style-image",
        styler,
        element,
      );
      if (listStyleImage instanceof Css.URL) {
        // list-style-image: <URL>
        // -> content: <URL> " "
        pseudoProps["content"] = new CascadeValue(
          new Css.SpaceList([listStyleImage, new Css.Str(" ")]),
          0,
        );
      } else if (listStyleType instanceof Css.Str) {
        // list-style-type: <string>
        pseudoProps["content"] = new CascadeValue(listStyleType, 0);
      } else if (
        listStyleType instanceof Css.Ident &&
        listStyleType !== Css.ident.none
      ) {
        // list-style-type: <counter-style>
        const listItemCount = (
          (this.currentStyle["ua-list-item-count"] as CascadeValue)
            ?.value as Css.Num
        )?.num;
        if (listItemCount != null) {
          pseudoProps["content"] = new CascadeValue(
            new Css.Str(
              this.counterStyleStore.formatMarker(
                listStyleType.name,
                listItemCount,
              ),
            ),
            0,
          );
        }
        // This is used in the marker layout processing in
        // `PseudoelementStyler.processMarker()` in pseudo-element.ts.
        pseudoProps["list-style-type"] = new CascadeValue(listStyleType, 0);
      }
    }

    // list-style-position
    if (!Display.isInlineLevel(getProp(this.currentStyle, "display")?.value)) {
      const listStylePosition = this.getInheritedPropertyValue(
        "list-style-position",
        styler,
        element,
      );
      if (listStylePosition) {
        // This is used in the marker layout processing in
        // `PseudoelementStyler.processMarker()` in pseudo-element.ts.
        pseudoProps["list-style-position"] = new CascadeValue(
          listStylePosition,
          0,
        );
      }
    }
  }

  /**
   * Get inherited property value
   * @param propName
   * @param styler
   * @param element
   * @returns the inherited property value, or the initial value (or null) if not found
   */
  getInheritedPropertyValue(
    propName: string,
    styler: CssStyler.AbstractStyler,
    element: Element,
  ): Css.Val | null {
    for (let e = element; e; e = e.parentElement) {
      const style =
        e === this.currentElement
          ? this.currentStyle
          : styler.getStyle(e, false);
      const prop = style[propName] as CascadeValue;
      if (prop) {
        const val = prop.evaluate(this.context, propName);
        if (
          val === Css.ident.inherit ||
          val === Css.ident.unset ||
          val === Css.ident.revert
        ) {
          continue;
        } else if (val === Css.ident.initial) {
          break;
        }
        return val;
      }
    }
    const validatorSet = (
      styler as AbstractStyler & { validatorSet: CssValidator.ValidatorSet }
    ).validatorSet;
    return validatorSet?.defaultValues[propName] ?? null;
  }

  private applyAttrFilterInner(
    visitor: Css.Visitor,
    elementStyle: ElementStyle,
  ): void {
    for (const propName in elementStyle) {
      if (isPropName(propName) && !Css.isCustomPropName(propName)) {
        elementStyle[propName] = (
          elementStyle[propName] as CascadeValue
        ).filterValue(visitor);
      }
    }
  }

  private applyAttrFilter(element: Element): void {
    const visitor = new AttrValueFilterVisitor(element);
    const currentStyle = this.currentStyle;
    const pseudoMap = getStyleMap(currentStyle, "_pseudos");
    for (const pseudoName in pseudoMap) {
      this.applyAttrFilterInner(visitor, pseudoMap[pseudoName]);
    }
    this.applyAttrFilterInner(visitor, currentStyle);
  }

  /**
   * Substitute all variables in property values in elementStyle
   */
  applyVarFilter(
    elementStyles: ElementStyle[],
    styler: CssStyler.AbstractStyler,
    element: Element | null,
  ): void {
    const elementStyle = elementStyles[0];
    const visitor = new VarFilterVisitor(elementStyles, styler, element);
    const LIMIT_LOOP = 32; // prevent cyclic or too deep dependency
    const propsLH: ElementStyle = {}; // for shorthand -> longhand cascade

    for (const name in elementStyle) {
      if (isMapName(name)) {
        const pseudoMap = getStyleMap(elementStyle, name);
        for (const pseudoName in pseudoMap) {
          this.applyVarFilter(
            [pseudoMap[pseudoName], ...elementStyles],
            styler,
            element,
          );
        }
      } else if (isPropName(name)) {
        const cascVal = getProp(elementStyle, name);
        let value = cascVal.value;

        for (let i = 0; ; i++) {
          if (i >= LIMIT_LOOP) {
            value = Css.empty;
            break;
          }
          const after = value.visit(visitor);
          if (visitor.error) {
            // invalid or unresolved variable found
            value = Css.empty;
            visitor.error = false;
            break;
          }
          if (after === value) {
            // no variable, or all variables substituted
            break;
          }
          // variables substituted, but the substituted value may contain variables
          value = after;
        }
        if (value !== cascVal.value) {
          // all variables substituted
          const validatorSet = (styler as any)
            .validatorSet as CssValidator.ValidatorSet;
          const shorthand = validatorSet?.shorthands[name]?.clone();
          if (shorthand) {
            if (Css.isDefaultingValue(value)) {
              for (const nameLH of shorthand.propList) {
                const avLH = new CascadeValue(value, cascVal.priority);
                const tvLH = getProp(elementStyle, nameLH);
                setProp(
                  propsLH,
                  nameLH,
                  cascadeValues(this.context, tvLH, avLH),
                );
              }
              delete elementStyle[name];
            } else {
              // The var()-substituted value may have complex structure
              // (e.g. SpaceList in SpaceList) that ShorthandValidator
              // cannot handle, so use toString and parseValue.
              const valueSH = CssParser.parseValue(
                (styler as any).scope,
                new CssTokenizer.Tokenizer(value.toString(), null),
                "",
              );
              if (valueSH) {
                valueSH.visit(shorthand);
                if (!shorthand.error) {
                  for (const nameLH of shorthand.propList) {
                    const avLH = new CascadeValue(
                      shorthand.values[nameLH] ??
                        validatorSet.defaultValues[nameLH] ??
                        Css.ident.initial,
                      cascVal.priority,
                    );
                    const tvLH = getProp(elementStyle, nameLH);
                    setProp(
                      propsLH,
                      nameLH,
                      cascadeValues(this.context, tvLH, avLH),
                    );
                  }
                  delete elementStyle[name];
                }
              }
            }
          } else {
            elementStyle[name] = new CascadeValue(value, cascVal.priority);
          }
        }
        if (propsLH[name]) {
          const av = getProp(elementStyle, name);
          if (av && av.value !== Css.empty) {
            setPropCascadeValue(propsLH, name, av, this.context);
          }
        }
      }
    }
    // Update elementStyle with shorthand -> longhand cascade result
    for (const name in propsLH) {
      elementStyle[name] = propsLH[name];
    }
  }

  /**
   * Calculate all calc() in property values in elementStyle
   */
  applyCalcFilter(elementStyle: ElementStyle, context: Exprs.Context): void {
    const visitor = new CalcFilterVisitor(context);
    for (const name in elementStyle) {
      if (isMapName(name)) {
        const pseudoMap = getStyleMap(elementStyle, name);
        for (const pseudoName in pseudoMap) {
          this.applyCalcFilter(pseudoMap[pseudoName], context);
        }
      } else if (isPropName(name) && !Css.isCustomPropName(name)) {
        const cascVal = getProp(elementStyle, name);
        const value = cascVal.value.visit(visitor);
        if (value !== cascVal.value) {
          elementStyle[name] = new CascadeValue(value, cascVal.priority);
        }
      }
    }
  }

  applyCmykFilter(elementStyle: ElementStyle, element?: Element): void {
    const visitor = new CmykStore.CmykFilterVisitor(this.cmykStore);
    this.applyCmykFilterInternal(elementStyle, visitor, "");
    if (element) {
      const conversions = visitor.getConversions();
      if (conversions) {
        element.setAttribute(
          "data-viv-device-cmyk",
          JSON.stringify(conversions),
        );
      }
    }
  }

  private applyCmykFilterInternal(
    elementStyle: ElementStyle,
    visitor: CmykStore.CmykFilterVisitor,
    pseudoPrefix: string,
  ): void {
    for (const name in elementStyle) {
      if (isMapName(name)) {
        const pseudoMap = getStyleMap(elementStyle, name);
        for (const pseudoName in pseudoMap) {
          this.applyCmykFilterInternal(
            pseudoMap[pseudoName],
            visitor,
            `::${pseudoName}:`,
          );
        }
      } else if (isPropName(name) && !Css.isCustomPropName(name)) {
        const cascVal = getProp(elementStyle, name);
        const originalValue = cascVal.value.toString();
        visitor.reset();
        const value = cascVal.value.visit(visitor);
        if (value !== cascVal.value) {
          if (visitor.hadDeviceCmyk()) {
            visitor.recordConversion(pseudoPrefix + name, originalValue);
          }
          elementStyle[name] = new CascadeValue(value, cascVal.priority);
        }
      }
    }
  }

  private applyActions(): void {
    let i: number;
    for (i = 0; i < this.currentClassNames.length; i++) {
      this.applyAction(this.code.classes, this.currentClassNames[i]);
    }
    for (i = 0; i < this.currentEpubTypes.length; i++) {
      this.applyAction(this.code.epubtypes, this.currentEpubTypes[i]);
    }
    this.applyAction(this.code.ids, this.currentId);
    this.applyAction(this.code.tags, this.currentLocalName);
    if (this.currentLocalName != "") {
      // Universal selector does not apply to page-master-related rules.
      this.applyAction(this.code.tags, "*");
    }
    this.applyAction(this.code.nstags, this.currentNSTag);

    // Apply page rules only when currentPageType is not null
    if (this.currentPageType !== null) {
      this.applyAction(this.code.pagetypes, this.currentPageType);

      // We represent page rules without selectors by *, though it is illegal in
      // CSS
      this.applyAction(this.code.pagetypes, "*");
    }

    this.stack.push([]);
    for (let depth = 1; depth >= -1; --depth) {
      const list = this.stack[this.stack.length - depth - 2];
      i = 0;
      while (i < list.length) {
        if (list[i].push(this, depth)) {
          // done
          list.splice(i, 1);
        } else {
          i++;
        }
      }
    }
    this.isFirst = true;
    this.isRoot = false;
  }

  private pop(): void {
    for (let depth = 1; depth >= -1; --depth) {
      const list = this.stack[this.stack.length - depth - 2];
      let i = 0;
      while (i < list.length) {
        if (list[i].pop(this, depth)) {
          // done
          list.splice(i, 1);
        } else {
          i++;
        }
      }
    }
    this.stack.pop();
    this.isFirst = false;
  }

  popRule(): void {
    this.pop();
  }

  popElement(element: Element): void {
    if (VIVLIOSTYLE_DEBUG) {
      const e = this.elementStack.pop();
      if (e !== element) {
        throw new Error("Invalid call to popElement");
      }
    }
    this.siblingOrderStack.pop();
    this.siblingTypeCountsStack.pop();
    this.followingSiblingOrderStack.pop();
    this.followingSiblingTypeCountsStack.pop();
    this.pop();
    this.popCounters();
  }
}

export const EMPTY: string[] = [];

/**
 * Pseudoelement names in the order they should be processed, empty string is
 * the place where the element's DOM children are processed.
 */
export const pseudoNames = [
  "before",
  "transclusion-before",
  "footnote-call",
  "footnote-marker",
  "marker",
  "inner",
  "first-letter",
  "first-line",
  "", // content
  "transclusion-after",
  "after",
];

/**
 * @enum {number}
 */
export enum ParseState {
  TOP,
  SELECTOR,
  RULE,
}

/**
 * Cascade for base User Agent stylesheet.
 */
export let uaBaseCascade: Cascade = null;
export function setUABaseCascade(value: Cascade): void {
  uaBaseCascade = value;
}

//------------- parsing ------------
export class CascadeParserHandler
  extends CssParser.SlaveParserHandler
  implements CssValidator.PropertyReceiver
{
  chain: ChainedAction[] = null;
  specificity: number = 0;
  elementStyle: ElementStyle = null;
  conditionCount: number = 0;
  pseudoelement: string | null = null;
  footnoteContent: boolean = false;
  cascade: Cascade;
  state: ParseState;
  viewConditionId: string | null = null;
  insideSelectorRule: ParseState;
  invalid: boolean = false; // for `@supports selector()` check

  constructor(
    scope: Exprs.LexicalScope,
    owner: CssParser.DispatchParserHandler,
    public readonly condition: Exprs.Val,
    parent: CascadeParserHandler,
    public readonly regionId: string | null,
    public readonly validatorSet: CssValidator.ValidatorSet,
    topLevel: boolean,
  ) {
    super(scope, owner, topLevel);
    this.cascade = parent
      ? parent.cascade
      : uaBaseCascade
        ? uaBaseCascade.clone()
        : new Cascade();
    this.state = ParseState.TOP;
  }

  protected insertNonPrimary(action: CascadeAction): void {
    this.cascade.insertInTable(this.cascade.tags, "*", action);
  }

  processChain(action: CascadeAction): void {
    const chained = chainActions(this.chain, action);
    if (
      chained !== action &&
      (chained as ChainedAction).makePrimary(this.cascade)
    ) {
      return;
    }
    this.insertNonPrimary(chained);
  }

  isInsideSelectorRule(mnemonics: string): boolean {
    if (this.state != ParseState.TOP) {
      this.reportAndSkip(mnemonics);
      return true;
    }
    return false;
  }

  override tagSelector(ns: string | null, name: string | null): void {
    if (!name && !ns) {
      return;
    }
    if (name) {
      this.specificity += 1;
    }
    if (name && ns) {
      this.chain.push(new CheckNSTagAction(ns, name.toLowerCase()));
    } else if (name) {
      this.chain.push(new CheckLocalNameAction(name.toLowerCase()));
    } else {
      this.chain.push(new CheckNamespaceAction(ns as string));
    }
  }

  invalidSelector(message: string): void {
    Logging.logger.warn(message);
    this.chain.push(new CheckConditionAction("")); // always fails
    this.setInvalid();
  }

  setInvalid(): void {
    this.invalid = true;
    for (
      let handler: CascadeParserHandler = this;
      handler instanceof MatchesParameterParserHandler;
      handler = handler.parent
    ) {
      handler.parent.invalid = true;
    }
  }

  override classSelector(name: string): void {
    if (this.pseudoelement) {
      this.invalidSelector(`::${this.pseudoelement} followed by .${name}`);
      return;
    }
    this.specificity += 256;
    this.chain.push(new CheckClassAction(name));
  }

  override pseudoclassSelector(
    name: string,
    params: (number | string)[],
  ): void {
    if (this.pseudoelement) {
      this.invalidSelector(`::${this.pseudoelement} followed by :${name}`);
      return;
    }
    switch (name.toLowerCase()) {
      case "enabled":
        this.chain.push(new IsEnabledAction());
        break;
      case "disabled":
        this.chain.push(new IsDisabledAction());
        break;
      case "checked":
        this.chain.push(new IsCheckedAction());
        break;
      case "root":
      case "scope":
        this.chain.push(new IsRootAction());
        break;
      case "link":
        this.chain.push(new CheckLocalNameAction("a"));
        this.chain.push(new CheckAttributePresentAction("", "href"));
        break;
      case "href-epub-type":
      case "href-role-type":
        if (params && params.length >= 1 && typeof params[0] == "string") {
          const value = params[0] as string;
          const patt = new RegExp(`(^|\\s)${Base.escapeRegExp(value)}(\$|\\s)`);
          const targetLocalName = params[1] as string;
          this.chain.push(
            new CheckTargetEpubTypeAction(
              patt,
              targetLocalName,
              name === "href-role-type",
            ),
          );
        } else {
          this.chain.push(new CheckConditionAction("")); // always fails
        }
        break;
      case "footnote-content":
        // content inside the footnote
        this.footnoteContent = true;
        break;
      case "visited":
      case "active":
      case "hover":
      case "focus":
        this.chain.push(new CheckConditionAction("")); // always fails
        break;
      case "lang":
        if (params && params.length == 1 && typeof params[0] == "string") {
          const langValue = params[0] as string;
          this.chain.push(
            new CheckLangAction(
              new RegExp(
                `^${Base.escapeRegExp(langValue.toLowerCase())}(\$|-)`,
              ),
            ),
          );
        } else {
          this.chain.push(new CheckConditionAction("")); // always fails
        }
        break;
      case "nth-child":
      case "nth-last-child":
      case "nth-of-type":
      case "nth-last-of-type": {
        const ActionClass = nthSelectorActionClasses[name.toLowerCase()];
        if (params && params.length == 2) {
          this.chain.push(
            new ActionClass(params[0] as number, params[1] as number),
          );
        } else {
          this.chain.push(new CheckConditionAction("")); // always fails
        }
        break;
      }
      case "first-child":
        this.chain.push(new IsFirstAction());
        break;
      case "last-child":
        this.chain.push(new IsNthLastSiblingAction(0, 1));
        break;
      case "first-of-type":
        this.chain.push(new IsNthSiblingOfTypeAction(0, 1));
        break;
      case "last-of-type":
        this.chain.push(new IsNthLastSiblingOfTypeAction(0, 1));
        break;
      case "only-child":
        this.chain.push(new IsFirstAction());
        this.chain.push(new IsNthLastSiblingAction(0, 1));
        break;
      case "only-of-type":
        this.chain.push(new IsNthSiblingOfTypeAction(0, 1));
        this.chain.push(new IsNthLastSiblingOfTypeAction(0, 1));
        break;
      case "empty":
        this.chain.push(new IsEmptyAction());
        break;
      case "before":
      case "after":
      case "first-line":
      case "first-letter":
        this.pseudoelementSelector(name, params);
        return;
      default: // always fails
        this.invalidSelector(`Unknown pseudo-class :${name}`);
        return;
    }
    this.specificity += 256;
  }

  override pseudoelementSelector(
    name: string,
    params: (number | string)[],
  ): void {
    switch (name) {
      case "before":
      case "after":
      case "first-line":
      case "first-letter":
      case "footnote-call":
      case "footnote-marker":
      case "marker":
      case "inner":
      case "after-if-continues":
        if (!this.pseudoelement) {
          this.pseudoelement = name;
        } else {
          this.invalidSelector(
            `Double pseudo-element ::${this.pseudoelement}::${name}`,
          );
          return;
        }
        break;
      case "first-n-lines":
        if (params && params.length == 1 && typeof params[0] == "number") {
          const n = Math.round(params[0] as number);
          if (n > 0 && n == params[0]) {
            if (!this.pseudoelement) {
              this.pseudoelement = `first-${n}-lines`;
            } else {
              this.invalidSelector(
                `Double pseudo-element ::${this.pseudoelement}::${name}`,
              );
              return;
            }
            break;
          }
        }
        this.chain.push(new CheckConditionAction("")); // always fails
        break;
      case "nth-fragment":
        if (params && params.length == 2) {
          this.viewConditionId = `NFS_${params[0]}_${params[1]}`;
        } else {
          this.chain.push(new CheckConditionAction("")); // always fails
        }
        break;
      default: // always fails
        this.invalidSelector(`Unknown pseudo-element ::${name}`);
        return;
    }
    this.specificity += 1;
  }

  override idSelector(id: string): void {
    this.specificity += 65536;
    this.chain.push(new CheckIdAction(id));
  }

  override attributeSelector(
    ns: string,
    name: string,
    op: TokenType,
    value: string | null,
  ): void {
    this.specificity += 256;
    name = name.toLowerCase();
    value = value || "";
    let action;
    switch (op) {
      case TokenType.EOF:
        action = new CheckAttributePresentAction(ns, name);
        break;
      case TokenType.EQ:
        action = new CheckAttributeEqAction(ns, name, value);
        break;
      case TokenType.TILDE_EQ:
        if (!value || value.match(/\s/)) {
          action = new CheckConditionAction(""); // always fails
        } else {
          action = new CheckAttributeRegExpAction(
            ns,
            name,
            new RegExp(`(^|\\s)${Base.escapeRegExp(value)}(\$|\\s)`),
          );
        }
        break;
      case TokenType.BAR_EQ:
        action = new CheckAttributeRegExpAction(
          ns,
          name,
          new RegExp(`^${Base.escapeRegExp(value)}(\$|-)`),
        );
        break;
      case TokenType.HAT_EQ:
        if (!value) {
          action = new CheckConditionAction(""); // always fails
        } else {
          action = new CheckAttributeRegExpAction(
            ns,
            name,
            new RegExp(`^${Base.escapeRegExp(value)}`),
          );
        }
        break;
      case TokenType.DOLLAR_EQ:
        if (!value) {
          action = new CheckConditionAction(""); // always fails
        } else {
          action = new CheckAttributeRegExpAction(
            ns,
            name,
            new RegExp(`${Base.escapeRegExp(value)}\$`),
          );
        }
        break;
      case TokenType.STAR_EQ:
        if (!value) {
          action = new CheckConditionAction(""); // always fails
        } else {
          action = new CheckAttributeRegExpAction(
            ns,
            name,
            new RegExp(Base.escapeRegExp(value)),
          );
        }
        break;
      case TokenType.COL_COL:
        if (value == "supported") {
          action = new CheckNamespaceSupportedAction(ns, name);
        } else {
          this.invalidSelector(`Unsupported :: attr selector op: ${value}`);
          return;
        }
        break;
      default:
        this.invalidSelector(`Unsupported attr selector: ${op}`);
        return;
    }
    this.chain.push(action);
  }

  override descendantSelector(): void {
    const condition = `d${conditionCount++}`;
    this.processChain(
      new ConditionItemAction(
        new DescendantConditionItem(condition, this.viewConditionId, null),
      ),
    );
    this.chain = [new CheckConditionAction(condition)];
    this.viewConditionId = null;
  }

  override childSelector(): void {
    const condition = `c${conditionCount++}`;
    this.processChain(
      new ConditionItemAction(
        new ChildConditionItem(condition, this.viewConditionId, null),
      ),
    );
    this.chain = [new CheckConditionAction(condition)];
    this.viewConditionId = null;
  }

  override adjacentSiblingSelector(): void {
    const condition = `a${conditionCount++}`;
    this.processChain(
      new ConditionItemAction(
        new AdjacentSiblingConditionItem(condition, this.viewConditionId, null),
      ),
    );
    this.chain = [new CheckConditionAction(condition)];
    this.viewConditionId = null;
  }

  override followingSiblingSelector(): void {
    const condition = `f${conditionCount++}`;
    this.processChain(
      new ConditionItemAction(
        new FollowingSiblingConditionItem(
          condition,
          this.viewConditionId,
          null,
        ),
      ),
    );
    this.chain = [new CheckConditionAction(condition)];
    this.viewConditionId = null;
  }

  override nextSelector(): void {
    this.finishChain();
    this.pseudoelement = null;
    this.footnoteContent = false;
    this.specificity = 0;
    this.chain = [];
  }

  override startSelectorRule(): void {
    if (this.isInsideSelectorRule("E_CSS_UNEXPECTED_SELECTOR")) {
      return;
    }
    this.state = ParseState.SELECTOR;
    this.elementStyle = {} as ElementStyle;
    this.pseudoelement = null;
    this.specificity = 0;
    this.footnoteContent = false;
    this.chain = [];
    this.invalid = false;
  }

  override error(mnemonics: string, token: CssTokenizer.Token): void {
    super.error(mnemonics, token);
    if (this.state == ParseState.SELECTOR) {
      this.state = ParseState.TOP;
    }
    this.setInvalid();
  }

  override startStylesheet(flavor: CssParser.StylesheetFlavor): void {
    super.startStylesheet(flavor);
    this.state = ParseState.TOP;
  }

  override startRuleBody(): void {
    this.finishChain();
    super.startRuleBody();
    if (this.state == ParseState.SELECTOR) {
      this.state = ParseState.TOP;
    }
  }

  override endRule(): void {
    super.endRule();
    this.insideSelectorRule = ParseState.TOP;
  }

  finishChain(): void {
    if (this.chain) {
      this.processChain(this.makeApplyRuleAction(this.specificity));
      this.chain = null;
      this.pseudoelement = null;
      this.viewConditionId = null;
      this.footnoteContent = false;
      this.specificity = 0;
    }
  }

  protected makeApplyRuleAction(specificity: number): ApplyRuleAction {
    let regionId = this.regionId;
    if (this.footnoteContent) {
      if (regionId) {
        regionId = "xxx-bogus-xxx";
      } else {
        regionId = "footnote";
      }
    }
    return new ApplyRuleAction(
      this.elementStyle,
      specificity,
      this.pseudoelement,
      regionId,
      this.viewConditionId,
    );
  }

  special(name: string, value: Css.Val) {
    let val: CascadeValue;
    if (!this.condition) {
      val = new CascadeValue(value, 0);
    } else {
      val = new ConditionalCascadeValue(value, 0, this.condition);
    }
    const arr = getMutableSpecial(this.elementStyle, name);
    arr.push(val);
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
    if (
      name == "display" &&
      (value === Css.ident.oeb_page_head || value === Css.ident.oeb_page_foot)
    ) {
      this.simpleProperty(
        "flow-options",
        new Css.SpaceList([Css.ident.exclusive, Css.ident._static]),
        important,
      );
      this.simpleProperty("flow-into", value, important);
      value = Css.ident.block;
    }
    const hooks = Plugin.getHooksForName("SIMPLE_PROPERTY");
    hooks.forEach((hook) => {
      const original = { name: name, value: value, important: important };
      const converted = hook(original);
      name = converted["name"];
      value = converted["value"];
      important = converted["important"];
    });
    const specificity = important
      ? this.getImportantSpecificity()
      : this.getBaseSpecificity();
    const priority = specificity + this.cascade.nextOrder();
    const cascval = this.condition
      ? new ConditionalCascadeValue(value, priority, this.condition)
      : new CascadeValue(value, priority);
    setPropCascadeValue(this.elementStyle, name, cascval);
  }

  finish(): Cascade {
    return this.cascade;
  }

  override startFuncWithSelector(
    funcName: string,
    params?: (number | string)[],
  ): void {
    let parameterParserHandler: MatchesParameterParserHandler;
    switch (funcName) {
      case "is":
        parameterParserHandler = new MatchesParameterParserHandler(this);
        break;
      case "not":
        parameterParserHandler = new NotParameterParserHandler(this);
        break;
      case "where":
        parameterParserHandler = new WhereParameterParserHandler(this);
        break;
      case "has":
        parameterParserHandler = new HasParameterParserHandler(this);
        break;
      case "nth-child":
        if (params && params.length >= 2) {
          parameterParserHandler = new NthChildOfSelectorParameterParserHandler(
            this,
            params[0] as number,
            params[1] as number,
          );
        }
        break;
      case "nth-last-child":
        if (params && params.length >= 2) {
          parameterParserHandler =
            new NthLastChildOfSelectorParameterParserHandler(
              this,
              params[0] as number,
              params[1] as number,
            );
        }
        break;
    }
    if (parameterParserHandler) {
      parameterParserHandler.startSelectorRule();
      this.owner.pushHandler(parameterParserHandler);
    }
  }
}

export const nthSelectorActionClasses: { [key: string]: typeof IsNthAction } = {
  "nth-child": IsNthSiblingAction,
  "nth-of-type": IsNthSiblingOfTypeAction,
  "nth-last-child": IsNthLastSiblingAction,
  "nth-last-of-type": IsNthLastSiblingOfTypeAction,
};

export let conditionCount: number = 0;

/**
 * Cascade Parser Handler for :is() and similar pseudo-classes parameter
 */
export class MatchesParameterParserHandler extends CascadeParserHandler {
  parentChain: ChainedAction[];
  chains: ChainedAction[][] = [];
  maxSpecificity: number = 0;
  selectorTexts: string[] = [];

  constructor(public readonly parent: CascadeParserHandler) {
    super(
      parent.scope,
      parent.owner,
      parent.condition,
      parent,
      parent.regionId,
      parent.validatorSet,
      false,
    );
    this.parentChain = parent.chain;
  }

  override nextSelector(): void {
    if (this.chain) {
      this.chains.push(this.chain);
    }
    this.maxSpecificity = Math.max(this.maxSpecificity, this.specificity);
    this.chain = [];
    this.pseudoelement = null;
    this.viewConditionId = null;
    this.footnoteContent = false;
    this.specificity = 0;
  }

  override endFuncWithSelector(): void {
    if (this.chain) {
      this.chains.push(this.chain);
    }
    if (this.chains.length > 0) {
      this.maxSpecificity = Math.max(this.maxSpecificity, this.specificity);
      this.parentChain.push(
        this.relational()
          ? new MatchesRelationalAction(this.selectorTexts)
          : this.positive()
            ? new MatchesAction(this.chains)
            : new MatchesNoneAction(this.chains),
      );
      if (this.increasingSpecificity()) {
        this.parent.specificity += this.maxSpecificity;
      }
    } else {
      // func argument is empty or all invalid
      this.parentChain.push(new CheckConditionAction("")); // always fails
    }

    this.owner.popHandler();
  }

  override startRuleBody(): void {
    this.reportAndSkip("E_CSS_UNEXPECTED_RULE_BODY");
  }

  override error(mnemonics: string, token: CssTokenizer.Token): void {
    super.error(mnemonics, token);
    this.chain = null;
    this.pseudoelement = null;
    this.viewConditionId = null;
    this.footnoteContent = false;
    this.specificity = 0;

    let forgiving = false;
    for (
      let handler: CascadeParserHandler = this;
      handler instanceof MatchesParameterParserHandler;
      handler = handler.parent
    ) {
      if (handler.forgiving()) {
        forgiving = true;
        break;
      }
    }
    if (!forgiving) {
      this.owner.popHandler();
    }
  }

  override pushSelectorText(selectorText: string): void {
    // selectorText is used only for relational pseudo-class `:has()`
    if (this.chain && this.relational()) {
      this.selectorTexts.push(selectorText);
    }
  }

  /**
   * @returns true unless this is `:not()`
   */
  positive(): boolean {
    return true;
  }

  /**
   * @returns true unless this is `:where()`
   */
  increasingSpecificity(): boolean {
    return true;
  }

  /**
   * @returns true if this takes a forgiving selector list (:is/where/has)
   */
  forgiving(): boolean {
    return true;
  }

  /**
   * @returns true if this is `:has()`
   */
  relational(): boolean {
    return false;
  }
}

/**
 * Cascade Parser Handler for :not() pseudo-class parameter
 */
export class NotParameterParserHandler extends MatchesParameterParserHandler {
  override positive(): boolean {
    return false;
  }

  forgiving(): boolean {
    return false;
  }
}

/**
 * Cascade Parser Handler for :where() pseudo-class parameter
 */
export class WhereParameterParserHandler extends MatchesParameterParserHandler {
  override increasingSpecificity(): boolean {
    return false;
  }
}

/**
 * Cascade Parser Handler for :has() pseudo-class parameter
 */
export class HasParameterParserHandler extends MatchesParameterParserHandler {
  override relational(): boolean {
    return true;
  }
}

/**
 * Cascade Parser Handler for :nth-child(An+B of S) pseudo-class parameter
 */
export class NthChildOfSelectorParameterParserHandler extends MatchesParameterParserHandler {
  constructor(
    parent: CascadeParserHandler,
    public readonly a: number,
    public readonly b: number,
  ) {
    super(parent);
  }

  override endFuncWithSelector(): void {
    if (this.chain) {
      this.chains.push(this.chain);
    }
    if (this.chains.length > 0) {
      this.maxSpecificity = Math.max(this.maxSpecificity, this.specificity);
      this.parentChain.push(
        new IsNthSiblingOfSelectorAction(this.a, this.b, this.chains),
      );
      // :nth-child(An+B of S) specificity: pseudo-class + most specific selector in S
      this.parent.specificity += 256 + this.maxSpecificity;
    } else {
      // func argument is empty or all invalid
      this.parentChain.push(new CheckConditionAction("")); // always fails
    }

    this.owner.popHandler();
  }

  override forgiving(): boolean {
    return true;
  }
}

/**
 * Cascade Parser Handler for :nth-last-child(An+B of S) pseudo-class parameter
 */
export class NthLastChildOfSelectorParameterParserHandler extends NthChildOfSelectorParameterParserHandler {
  override endFuncWithSelector(): void {
    if (this.chain) {
      this.chains.push(this.chain);
    }
    if (this.chains.length > 0) {
      this.maxSpecificity = Math.max(this.maxSpecificity, this.specificity);
      this.parentChain.push(
        new IsNthLastSiblingOfSelectorAction(this.a, this.b, this.chains),
      );
      // :nth-last-child(An+B of S) specificity: pseudo-class + most specific selector in S
      this.parent.specificity += 256 + this.maxSpecificity;
    } else {
      // func argument is empty or all invalid
      this.parentChain.push(new CheckConditionAction("")); // always fails
    }

    this.owner.popHandler();
  }
}

export class DefineParserHandler extends CssParser.SlaveParserHandler {
  constructor(
    scope: Exprs.LexicalScope,
    owner: CssParser.DispatchParserHandler,
  ) {
    super(scope, owner, false);
  }

  override property(name: string, value: Css.Val, important: boolean): void {
    if (this.scope.values[name]) {
      this.error(`E_CSS_NAME_REDEFINED ${name}`, this.getCurrentToken());
    } else {
      const unit = name.match(/height|^(top|bottom)$/) ? "vh" : "vw";
      const dim = new Exprs.Numeric(this.scope, 100, unit);
      this.scope.defineName(name, value.toExpr(this.scope, dim));
    }
  }
}

export class PropSetParserHandler
  extends CssParser.SlaveParserHandler
  implements CssValidator.PropertyReceiver
{
  order: number;

  constructor(
    scope: Exprs.LexicalScope,
    owner: CssParser.DispatchParserHandler,
    public readonly condition: Exprs.Val,
    public readonly elementStyle: ElementStyle,
    public readonly validatorSet: CssValidator.ValidatorSet,
    public readonly ruleType?: string,
  ) {
    super(scope, owner, false);
    this.order = 0;
  }

  override property(name: string, value: Css.Val, important: boolean): void {
    if (important) {
      Logging.logger.warn("E_IMPORTANT_NOT_ALLOWED");
    } else {
      this.validatorSet.validatePropertyAndHandleShorthand(
        name,
        value,
        important,
        this,
      );
    }
  }

  /** @override */
  invalidPropertyValue(name: string, value: Css.Val): void {
    Logging.logger.warn(
      "E_INVALID_PROPERTY_VALUE",
      `${name}:`,
      value.toString(),
    );
  }

  /** @override */
  unknownProperty(name: string, value: Css.Val): void {
    Logging.logger.warn("E_INVALID_PROPERTY", `${name}:`, value.toString());
  }

  /** @override */
  simpleProperty(name: string, value: Css.Val, important): void {
    let specificity = important
      ? this.getImportantSpecificity()
      : this.getBaseSpecificity();
    specificity += this.order;
    this.order += ORDER_INCREMENT;
    const cascval = this.condition
      ? new ConditionalCascadeValue(value, specificity, this.condition)
      : new CascadeValue(value, specificity);
    setPropCascadeValue(this.elementStyle, name, cascval);
  }
}

export class PropertyParserHandler
  extends CssParser.ErrorHandler
  implements CssValidator.PropertyReceiver
{
  elementStyle = {} as ElementStyle;
  order: number = 0;

  constructor(
    scope: Exprs.LexicalScope,
    public readonly validatorSet: CssValidator.ValidatorSet,
  ) {
    super(scope);
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
    Logging.logger.warn(
      "E_INVALID_PROPERTY_VALUE",
      `${name}:`,
      value.toString(),
    );
  }

  /** @override */
  unknownProperty(name: string, value: Css.Val): void {
    Logging.logger.warn("E_INVALID_PROPERTY", `${name}:`, value.toString());
  }

  /** @override */
  simpleProperty(name: string, value: Css.Val, important): void {
    let specificity = important
      ? CssParser.SPECIFICITY_STYLE_IMPORTANT
      : CssParser.SPECIFICITY_STYLE;
    specificity += this.order;
    this.order += ORDER_INCREMENT;
    const cascval = new CascadeValue(value, specificity);
    setPropCascadeValue(this.elementStyle, name, cascval);
  }
}

export function forEachViewConditionalStyles(
  style: ElementStyle,
  callback: (p1: ElementStyle) => any,
): void {
  const viewConditionalStyles = getViewConditionalStyleMap(style);
  if (!viewConditionalStyles) {
    return;
  }
  viewConditionalStyles.forEach((entry) => {
    if (!entry.matcher.matches()) {
      return;
    }
    callback(entry.styles);
  });
}

export function mergeViewConditionalStyles(
  cascMap: { [key: string]: CascadeValue },
  context: Exprs.Context,
  style: ElementStyle,
): void {
  forEachViewConditionalStyles(style, (viewConditionalStyles) => {
    mergeStyle(cascMap, viewConditionalStyles, context);
  });
}

export function parseStyleAttribute(
  scope: Exprs.LexicalScope,
  validatorSet: CssValidator.ValidatorSet,
  baseURL: string,
  styleAttrValue: string,
): ElementStyle {
  const handler = new PropertyParserHandler(scope, validatorSet);
  const tokenizer = new CssTokenizer.Tokenizer(styleAttrValue, handler);
  try {
    CssParser.parseStyleAttribute(tokenizer, handler, baseURL);
  } catch (err) {
    Logging.logger.warn(err, "Style attribute parse error:");
  }
  return handler.elementStyle;
}

export function isVertical(
  cascaded: { [key: string]: CascadeValue },
  context: Exprs.Context,
  vertical: boolean,
): boolean {
  const writingModeCasc = cascaded["writing-mode"];
  if (writingModeCasc) {
    const writingMode = writingModeCasc.evaluate(context, "writing-mode");
    if (
      writingMode &&
      writingMode !== Css.ident.inherit &&
      writingMode !== Css.ident.revert &&
      writingMode !== Css.ident.unset
    ) {
      return writingMode === Css.ident.vertical_rl;
    }
  }
  return vertical;
}

export function isRtl(
  cascaded: { [key: string]: CascadeValue },
  context: Exprs.Context,
  rtl: boolean,
): boolean {
  const directionCasc = cascaded["direction"];
  if (directionCasc) {
    const direction = directionCasc.evaluate(context, "direction");
    if (
      direction &&
      direction !== Css.ident.inherit &&
      direction !== Css.ident.revert &&
      direction !== Css.ident.unset
    ) {
      return direction === Css.ident.rtl;
    }
  }
  return rtl;
}

export function flattenCascadedStyle(
  style: ElementStyle,
  context: Exprs.Context,
  regionIds: string[],
  isFootnote: boolean,
  nodeContext: Vtree.NodeContext,
): { [key: string]: CascadeValue } {
  const cascMap = {} as { [key: string]: CascadeValue };
  for (const n in style) {
    if (isPropName(n)) {
      cascMap[n] = getProp(style, n);
    }
  }
  mergeViewConditionalStyles(cascMap, context, style);
  forEachStylesInRegion(
    style,
    regionIds,
    isFootnote,
    (regionId, regionStyle) => {
      mergeStyle(cascMap, regionStyle, context);
      mergeViewConditionalStyles(cascMap, context, regionStyle);
    },
  );
  return cascMap;
}

export function forEachStylesInRegion(
  style: ElementStyle,
  regionIds: string[],
  isFootnote: boolean,
  callback: (p1: string, p2: ElementStyle) => any,
): void {
  const regions = getStyleMap(style, "_regions");
  if ((regionIds || isFootnote) && regions) {
    if (isFootnote) {
      const footnoteRegion = ["footnote"];
      if (!regionIds) {
        regionIds = footnoteRegion;
      } else {
        regionIds = regionIds.concat(footnoteRegion);
      }
    }
    for (const regionId of regionIds) {
      const regionStyle = regions[regionId];
      if (regionStyle) {
        callback(regionId, regionStyle);
      }
    }
  }
}

export function mergeStyle(
  to: { [key: string]: CascadeValue },
  from: ElementStyle,
  context: Exprs.Context,
): void {
  for (const property in from) {
    if (isPropName(property)) {
      const newVal = getProp(from, property);
      const oldVal = to[property];
      to[property] = cascadeValues(context, oldVal, newVal as CascadeValue);
    }
  }
}

/**
 * Convert logical properties to physical ones, taking specificity into account.
 * @param src Source properties map
 * @param dest Destination map
 * @param transform If supplied, property values are transformed by this
 *     function before inserted into the destination map. The first parameter is
 *     the property name and the second one is the property value.
 * @template T
 */
export const convertToPhysical = <T>(
  src: { [key: string]: CascadeValue },
  dest: { [key: string]: T },
  vertical: boolean,
  rtl: boolean,
  leftPageSide: boolean,
  transform: (p1: string, p2: CascadeValue) => T,
) => {
  // for logical properties
  const couplingMap1 = vertical
    ? rtl
      ? couplingMapVertRtl
      : couplingMapVert
    : rtl
      ? couplingMapHorRtl
      : couplingMapHor;

  // for margin-inside/outside properties
  const couplingMap2 = leftPageSide
    ? couplingMapLeftPage
    : couplingMapRightPage;

  for (const propName in src) {
    let cascVal = src[propName];
    if (!cascVal) {
      continue;
    }
    const coupledName1 =
      couplingMap1[propName] ?? couplingMap1[couplingMap2[propName]];
    const coupledName2 =
      couplingMap2[propName] ?? couplingMap2[couplingMap1[propName]];
    let coupledName = coupledName1 ?? coupledName2;
    let targetName: string;
    if (coupledName) {
      let coupledCascVal = src[coupledName];
      if (coupledCascVal && coupledCascVal.priority > cascVal.priority) {
        continue;
      }
      if (coupledName1 && coupledName2 && coupledName1 !== coupledName2) {
        coupledName = coupledName2;
        coupledCascVal = src[coupledName];
        if (coupledCascVal && coupledCascVal.priority > cascVal.priority) {
          continue;
        }
      }
      targetName = geomNames[coupledName1]
        ? coupledName1
        : geomNames[coupledName2]
          ? coupledName2
          : propName;
    } else {
      targetName = propName;
      if (
        propName.startsWith("text-align") &&
        (cascVal.value === Css.ident.inside ||
          cascVal.value === Css.ident.outside)
      ) {
        cascVal = new CascadeValue(
          leftPageSide === (cascVal.value === Css.ident.inside)
            ? Css.ident.right
            : Css.ident.left,
          cascVal.priority,
        );
      }
    }
    dest[targetName] = transform(propName, cascVal);
  }
};

/**
 * Convert var() to its value
 */
export class VarFilterVisitor extends Css.FilterVisitor {
  constructor(
    public elementStyles: ElementStyle[],
    public styler: CssStyler.AbstractStyler,
    public element: Element | null,
  ) {
    super();
  }

  private getVarValue(name: string): Css.Val {
    let elem = this.element ?? ((this.styler as any).root as Element);
    if (this.elementStyles?.length) {
      for (const style of this.elementStyles) {
        const val = (style[name] as CascadeValue)?.value;
        if (val) {
          return val;
        }
      }
      if (this.element) {
        elem = this.element.parentElement;
      }
    }
    for (; elem; elem = elem.parentElement) {
      const val = (this.styler.getStyle(elem, false)?.[name] as CascadeValue)
        ?.value;
      if (val) {
        return val;
      }
    }
    return null;
  }

  override visitFunc(func: Css.Func): Css.Val {
    if (func.name !== "var") {
      return super.visitFunc(func);
    }
    const name = func.values[0] instanceof Css.Ident && func.values[0].name;
    if (!name || !Css.isCustomPropName(name)) {
      this.error = true;
      return Css.empty;
    }
    const varVal = this.getVarValue(name);
    if (varVal) {
      return varVal;
    }
    // fallback value
    if (func.values.length < 2) {
      this.error = true;
      return Css.empty;
    }
    if (func.values.length === 2) {
      return func.values[1];
    } else {
      return new Css.CommaList(func.values.slice(1));
    }
  }
}

/**
 * Convert calc() to its value
 */
export class CalcFilterVisitor extends Css.FilterVisitor {
  constructor(
    public context: Exprs.Context,
    public resolveViewportUnit?: boolean,
    public percentRef?: number,
    public vertical?: boolean,
  ) {
    super();
  }

  override visitFunc(func: Css.Func): Css.Val {
    // convert func args
    let value = super.visitFunc(func);
    if (func.name !== "calc") {
      return value;
    }
    const exprText = value.toString().replace(/^calc\b/, "-epubx-expr");
    if (
      /\d(%|em|ex|cap|ch|ic|lh|p?v[whbi]|p?vmin|p?vmax)\W|\Wvar\(\s*--/i.test(
        exprText,
      )
    ) {
      return value;
    }
    const exprVal = CssParser.parseValue(
      this.context.rootScope,
      new CssTokenizer.Tokenizer(exprText, null),
      "",
    );
    if (exprVal instanceof Css.Expr) {
      try {
        const exprResult = exprVal.expr.evaluate(this.context);
        if (typeof exprResult === "number" && !isNaN(exprResult)) {
          if (/\d(px|in|pt|pc|cm|mm|q|rem|rlh)\W/i.test(exprText)) {
            // length value
            value = new Css.Numeric(exprResult, "px");
          } else if (!/\d[a-z]/i.test(exprText)) {
            // unitless number
            value = new Css.Num(exprResult);
          }
          // otherwise, keep the original calc() expression
        }
      } catch (err) {
        Logging.logger.warn(err);
      }
    }
    return value;
  }

  override visitNumeric(numeric: Css.Numeric): Css.Val {
    if (
      this.resolveViewportUnit &&
      (Exprs.isViewportRelativeLengthUnit(numeric.unit) ||
        Exprs.isRootFontRelativeLengthUnit(numeric.unit))
    ) {
      return new Css.Numeric(
        numeric.num *
          this.context.queryUnitSize(numeric.unit, false, this.vertical),
        "px",
      );
    }
    if (typeof this.percentRef === "number" && numeric.unit === "%") {
      return new Css.Numeric((numeric.num * this.percentRef) / 100, "px");
    }
    return numeric;
  }
}

export function evaluateCSSToCSS(
  context: Exprs.Context,
  val: Css.Val,
  propName?: string,
  percentRef?: number,
  vertical?: boolean,
): Css.Val {
  try {
    if (val instanceof Css.Expr) {
      if (
        val.expr instanceof Exprs.Native &&
        (val.expr.str.startsWith("named-string-") ||
          val.expr.str.startsWith("running-element-"))
      ) {
        return val;
      }
      return CssParser.evaluateExprToCSS(context, val.expr, propName);
    }
    if (
      val instanceof Css.Numeric ||
      val instanceof Css.Func ||
      val instanceof Css.SpaceList ||
      val instanceof Css.CommaList
    ) {
      return val.visit(
        new CalcFilterVisitor(context, true, percentRef, vertical),
      );
    }
  } catch (err) {
    Logging.logger.warn(err);
    return Css.empty;
  }
  return val;
}
