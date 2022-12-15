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
 * @fileoverview CssCascade - CSS Cascade.
 */
import * as Asserts from "./asserts";
import * as Base from "./base";
import * as Css from "./css";
import * as CssParser from "./css-parser";
import * as CssProp from "./css-prop";
import * as CssTokenizer from "./css-tokenizer";
import * as CssValidator from "./css-validator";
import * as Exprs from "./exprs";
import * as Logging from "./logging";
import * as Matchers from "./matchers";
import * as Plugin from "./plugin";
import * as Vtree from "./vtree";
import { CssStyler } from "./types";
import { TokenType } from "./css-tokenizer";

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
  "text-decoration-skip": true,
  "text-emphasis-color": true,
  "text-emphasis-position": true,
  "text-emphasis-style": true,
  "text-fill-color": true,
  "text-combine-upright": true,
  "text-indent": true,
  "text-justify": true,
  "text-orientation": true,
  "text-rendering": true,
  "text-size-adjust": true,
  "text-spacing": true,
  "text-stroke-color": true,
  "text-stroke-width": true,
  "text-transform": true,
  "text-underline-position": true,
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

  evaluate(context: Exprs.Context, propName?: string): Css.Val {
    if (propName && Css.isCustomPropName(propName)) {
      return this.value;
    }
    return evaluateCSSToCSS(context, this.value, propName);
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
      const av = getProp(style, prop).increaseSpecificity(specificity);
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
      numeric.unit === "ex" ||
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
  if (unit === "em" || unit === "ex") {
    const ratio = Exprs.defaultUnitSizes[unit] / Exprs.defaultUnitSizes["em"];
    return new Css.Numeric(num * ratio * baseFontSize, "px");
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
  constructor(public readonly ns: string, public readonly localName: string) {
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
  constructor(public readonly epubTypePatt: RegExp) {
    super();
  }

  override apply(cascadeInstance: CascadeInstance): void {
    const elem = cascadeInstance.currentElement;
    if (elem && cascadeInstance.currentLocalName == "a") {
      const href = elem.getAttribute("href");
      if (href && href.match(/^#/)) {
        const id = href.substring(1);
        const target = elem.ownerDocument.getElementById(id);
        if (target) {
          const epubType = target.getAttributeNS(Base.NS.epub, "type");
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

export class CheckAttributePresentAction extends ChainedAction {
  constructor(public readonly ns: string, public readonly name: string) {
    super();
  }

  override apply(cascadeInstance: CascadeInstance): void {
    if (
      cascadeInstance.currentElement &&
      cascadeInstance.currentElement.hasAttributeNS(this.ns, this.name)
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
      cascadeInstance.currentElement &&
      cascadeInstance.currentElement.getAttributeNS(this.ns, this.name) ==
        this.value
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
  constructor(public readonly ns: string, public readonly name: string) {
    super();
  }

  override apply(cascadeInstance: CascadeInstance): void {
    if (cascadeInstance.currentElement) {
      const ns = cascadeInstance.currentElement.getAttributeNS(
        this.ns,
        this.name,
      );
      if (ns && supportedNamespaces[ns]) {
        this.chained.apply(cascadeInstance);
      }
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
    if (cascadeInstance.currentElement) {
      const attr = cascadeInstance.currentElement.getAttributeNS(
        this.ns,
        this.name,
      );
      if (attr && attr.match(this.regexp)) {
        this.chained.apply(cascadeInstance);
      }
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
  constructor(public readonly a: number, public readonly b: number) {
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
      let scopingRoot: Element;
      if (/^\s*[+~]/.test(selectorText)) {
        // :has(+ F) or :has(~ F)
        scopingRoot = cascadeInstance.currentElement.parentElement;
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
    cascadeInstance: CascadeInstance,
  ): void;
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
 * Get concatenated string value from CSS `string-set` and `content` property
 */
function getStringValueFromCssContentVal(val: Css.Val): string {
  // When this function is called, CSS `content()`, `attr()`, `counter()`
  // values are already resolved to strings values. Remaining non-string values
  // are ignored.
  if (Vtree.nonTrivialContent(val)) {
    if (val instanceof Css.Str) {
      return val.stringValue();
    }
    if (val instanceof Css.SpaceList) {
      return val.values.map((v) => getStringValueFromCssContentVal(v)).join("");
    }
  }
  return "";
}

export class ContentPropVisitor extends Css.FilterVisitor {
  constructor(
    public cascade: CascadeInstance,
    public element: Element,
    public readonly counterResolver: CounterResolver,
  ) {
    super();
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
    let upper = false; // type == "armenian";
    // content-counter-10.xht assumes armenian is uppercase, enable if desired

    let lower = false;
    let r: RegExpMatchArray;
    if ((r = type.match(/^upper-(.*)/)) != null) {
      upper = true;
      type = r[1];
    } else if ((r = type.match(/^lower-(.*)/)) != null) {
      lower = true;
      type = r[1];
    }
    let result = "";
    if (additiveNumbering[type]) {
      result = additiveFormat(additiveNumbering[type], num);
    } else if (alphabeticNumbering[type]) {
      result = alphabeticFormat(alphabeticNumbering[type], num);
    } else if (fixed[type] != null) {
      result = fixed[type];
    } else if (type == "decimal-leading-zero") {
      result = `${num}`;
      if (result.length == 1) {
        result = `0${result}`;
      }
    } else if (type == "cjk-ideographic" || type == "trad-chinese-informal") {
      result = chineseCounter(num, chineseTradInformal);
    } else {
      result = `${num}`;
    }
    if (upper) {
      return result.toUpperCase();
    }
    if (lower) {
      return result.toLowerCase();
    }
    return result;
  }

  visitFuncCounter(values: Css.Val[]): Css.Val {
    const counterName = values[0].toString();
    const type = values.length > 1 ? values[1].stringValue() : "decimal";
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
   * CSS `string()` function
   * https://drafts.csswg.org/css-gcpm-3/#using-named-strings
   */
  visitFuncString(values: Css.Val[]): Css.Val {
    const name = values.length > 0 ? values[0].stringValue() : "";
    const retrievePosition =
      values.length > 1 ? values[1].stringValue() : "first";
    const c = new Css.Expr(
      this.counterResolver.getNamedStringVal(name, retrievePosition),
    );
    return new Css.SpaceList([c]);
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
      case "first-letter":
        stringValue = this.element.textContent.trim().replace(/\s+/g, " ");
        if (pseudoName === "first-letter") {
          const r = stringValue.match(Base.firstLetterPattern);
          stringValue = r ? r[0] : "";
        }
        break;
      case "before":
      case "after":
        {
          const pseudos = getStyleMap(this.cascade.currentStyle, "_pseudos");
          const val = (pseudos?.[pseudoName]?.["content"] as CascadeValue)
            ?.value;
          stringValue = getStringValueFromCssContentVal(val);
        }
        break;
    }
    return new Css.Str(stringValue);
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
      case "string":
        if (func.values.length <= 2) {
          return this.visitFuncString(func.values);
        }
        break;
      case "content":
        if (func.values.length <= 1) {
          return this.visitFuncContent(func.values);
        }
        break;
    }
    // Logging.logger.warn("E_CSS_CONTENT_PROP:", func.toString());
    return func;
  }
}

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

export const additiveNumbering = {
  roman: [
    4999,
    1000,
    "M",
    900,
    "CM",
    500,
    "D",
    400,
    "CD",
    100,
    "C",
    90,
    "XC",
    50,
    "L",
    40,
    "XL",
    10,
    "X",
    9,
    "IX",
    5,
    "V",
    4,
    "IV",
    1,
    "I",
  ],
  armenian: [
    9999,
    9000,
    "\u0584",
    8000,
    "\u0583",
    7000,
    "\u0582",
    6000,
    "\u0581",
    5000,
    "\u0580",
    4000,
    "\u057f",
    3000,
    "\u057e",
    2000,
    "\u057d",
    1000,
    "\u057c",
    900,
    "\u057b",
    800,
    "\u057a",
    700,
    "\u0579",
    600,
    "\u0578",
    500,
    "\u0577",
    400,
    "\u0576",
    300,
    "\u0575",
    200,
    "\u0574",
    100,
    "\u0573",
    90,
    "\u0572",
    80,
    "\u0571",
    70,
    "\u0570",
    60,
    "\u056f",
    50,
    "\u056e",
    40,
    "\u056d",
    30,
    "\u056c",
    20,
    "\u056b",
    10,
    "\u056a",
    9,
    "\u0569",
    8,
    "\u0568",
    7,
    "\u0567",
    6,
    "\u0566",
    5,
    "\u0565",
    4,
    "\u0564",
    3,
    "\u0563",
    2,
    "\u0562",
    1,
    "\u0561",
  ],
  georgian: [
    19999,
    10000,
    "\u10f5",
    9000,
    "\u10f0",
    8000,
    "\u10ef",
    7000,
    "\u10f4",
    6000,
    "\u10ee",
    5000,
    "\u10ed",
    4000,
    "\u10ec",
    3000,
    "\u10eb",
    2000,
    "\u10ea",
    1000,
    "\u10e9",
    900,
    "\u10e8",
    800,
    "\u10e7",
    700,
    "\u10e6",
    600,
    "\u10e5",
    500,
    "\u10e4",
    400,
    "\u10f3",
    300,
    "\u10e2",
    200,
    "\u10e1",
    100,
    "\u10e0",
    90,
    "\u10df",
    80,
    "\u10de",
    70,
    "\u10dd",
    60,
    "\u10f2",
    50,
    "\u10dc",
    40,
    "\u10db",
    30,
    "\u10da",
    20,
    "\u10d9",
    10,
    "\u10d8",
    9,
    "\u10d7",
    8,
    "\u10f1",
    7,
    "\u10d6",
    6,
    "\u10d5",
    5,
    "\u10d4",
    4,
    "\u10d3",
    3,
    "\u10d2",
    2,
    "\u10d1",
    1,
    "\u10d0",
  ],
  hebrew: [
    999,
    400,
    "\u05ea",
    300,
    "\u05e9",
    200,
    "\u05e8",
    100,
    "\u05e7",
    90,
    "\u05e6",
    80,
    "\u05e4",
    70,
    "\u05e2",
    60,
    "\u05e1",
    50,
    "\u05e0",
    40,
    "\u05de",
    30,
    "\u05dc",
    20,
    "\u05db",
    19,
    "\u05d9\u05d8",
    18,
    "\u05d9\u05d7",
    17,
    "\u05d9\u05d6",
    16,
    "\u05d8\u05d6",
    15,
    "\u05d8\u05d5",
    10,
    "\u05d9",
    9,
    "\u05d8",
    8,
    "\u05d7",
    7,
    "\u05d6",
    6,
    "\u05d5",
    5,
    "\u05d4",
    4,
    "\u05d3",
    3,
    "\u05d2",
    2,
    "\u05d1",
    1,
    "\u05d0",
  ],
};

export const alphabeticNumbering = {
  latin: "a-z",
  alpha: "a-z",
  greek: "\u03b1-\u03c1\u03c3-\u03c9",
  russian: "\u0430-\u0438\u043a-\u0449\u044d-\u044f",
};

export const fixed = {
  square: "\u25a0",
  disc: "\u2022",
  circle: "\u25e6",
  none: "",
};

export function additiveFormat(entries: any[], num: number): string {
  const max = entries[0] as number;
  if (num > max || num <= 0 || num != Math.round(num)) {
    return "";
  }
  let result = "";
  for (let i = 1; i < entries.length; i += 2) {
    const value = entries[i] as number;
    let count = Math.floor(num / value);
    if (count > 20) {
      return "";
    }
    num -= count * value;
    while (count > 0) {
      result += entries[i + 1];
      count--;
    }
  }
  return result;
}

export function expandAlphabet(str: string): string[] | null {
  const arr = [];
  let i = 0;
  while (i < str.length) {
    if (str.substr(i + 1, 1) == "-") {
      const first = str.charCodeAt(i);
      const last = str.charCodeAt(i + 2);
      i += 3;
      for (let k = first; k <= last; k++) {
        arr.push(String.fromCharCode(k));
      }
    } else {
      arr.push(str.substr(i++, 1));
    }
  }
  return arr;
}

export function alphabeticFormat(alphabetStr: string, num: number): string {
  if (num <= 0 || num != Math.round(num)) {
    return "";
  }
  const alphabet = expandAlphabet(alphabetStr);
  let result = "";
  do {
    num--;
    const digit = num % alphabet.length;
    result = alphabet[digit] + result;
    num = (num - digit) / alphabet.length;
  } while (num > 0);
  return result;
}

export type ChineseNumbering = {
  digits: string;
  markers: string;
  negative: string;
  formal: boolean;
};

/**
 * From http://www.w3.org/TR/css3-lists/
 */
export const chineseTradInformal: ChineseNumbering = {
  formal: false,
  digits: "\u96f6\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d",
  markers: "\u5341\u767e\u5343",
  negative: "\u8ca0",
};

export function chineseCounter(
  num: number,
  numbering: ChineseNumbering,
): string {
  if (num > 9999 || num < -9999) {
    return `${num}`; // TODO: should be cjk-decimal
  }
  if (num == 0) {
    return numbering.digits.charAt(0);
  }
  const res = new Base.StringBuffer();
  if (num < 0) {
    res.append(numbering.negative);
    num = -num;
  }
  if (num < 10) {
    res.append(numbering.digits.charAt(num));
  } else if (!numbering.formal && num <= 19) {
    res.append(numbering.markers.charAt(0));
    if (num != 0) {
      res.append(numbering.digits.charAt(num - 10));
    }
  } else {
    const thousands = Math.floor(num / 1000);
    if (thousands) {
      res.append(numbering.digits.charAt(thousands));
      res.append(numbering.markers.charAt(2));
    }
    const hundreds = Math.floor(num / 100) % 10;
    if (hundreds) {
      res.append(numbering.digits.charAt(hundreds));
      res.append(numbering.markers.charAt(1));
    }
    const tens = Math.floor(num / 10) % 10;
    if (tens) {
      res.append(numbering.digits.charAt(tens));
      res.append(numbering.markers.charAt(0));
    }
    const ones = num % 10;
    if (ones) {
      res.append(numbering.digits.charAt(ones));
    }
  }

  // res.append("\u3001");
  return res.toString();
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
  ): CascadeInstance {
    return new CascadeInstance(
      this,
      context,
      counterListener,
      counterResolver,
      lang,
    );
  }

  nextOrder(): number {
    return (this.order += ORDER_INCREMENT);
  }
}

export class CascadeInstance {
  code: Cascade;
  stack = [[], []] as ConditionItem[][];
  conditions = {} as { [key: string]: number };
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
  isFirst: boolean = true;
  isRoot: boolean = true;
  counters: CounterValues = {};
  counterScoping: { [key: string]: boolean }[] = [{}];
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
  viewConditions: { [key: string]: Matchers.Matcher[] } = {};
  dependentConditions: string[] = [];
  elementStack: Element[];

  constructor(
    cascade: Cascade,
    public readonly context: Exprs.Context,
    public readonly counterListener: CounterListener,
    public readonly counterResolver: CounterResolver,
    lang: string,
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
    if (this.counters[counterName]) {
      this.counters[counterName].push(value);
    } else {
      this.counters[counterName] = [value];
    }
    let scoping = this.counterScoping[this.counterScoping.length - 1];
    if (!scoping) {
      scoping = {};
      this.counterScoping[this.counterScoping.length - 1] = scoping;
    }
    scoping[counterName] = true;
  }

  pushCounters(props: ElementStyle): void {
    let displayVal: Css.Val = Css.ident.inline;
    const display = props["display"] as CascadeValue;
    if (display) {
      displayVal = display.evaluate(this.context);
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
        resetMap = CssProp.toCounters(resetVal, true);
      }
    }
    const set = props["counter-set"] as CascadeValue;
    if (set) {
      const setVal = set.evaluate(this.context);
      if (setVal) {
        setMap = CssProp.toCounters(setVal, false);
      }
    }
    const increment = props["counter-increment"] as CascadeValue;
    if (increment) {
      const incrementVal = increment.evaluate(this.context);
      if (incrementVal) {
        incrementMap = CssProp.toCounters(incrementVal, false);
      }
    }
    if (
      (this.currentLocalName == "ol" || this.currentLocalName == "ul") &&
      this.currentNamespace == Base.NS.XHTML
    ) {
      if (!resetMap) {
        resetMap = {};
      }
      resetMap["ua-list-item"] = ((this.currentElement as any)?.start ?? 1) - 1;
    }
    if (displayVal === Css.ident.list_item) {
      if (!incrementMap) {
        incrementMap = {};
      }
      incrementMap["ua-list-item"] = 1;
      if (
        /^\s*[-+]?\d/.test(this.currentElement?.getAttribute("value") ?? "")
      ) {
        if (!resetMap) {
          resetMap = {};
        }
        resetMap["ua-list-item"] = (this.currentElement as any).value - 1;
      }
    }
    if (this.currentElement?.parentNode.nodeType === Node.DOCUMENT_NODE) {
      if (!resetMap) {
        resetMap = {};
      }
      // `counter-reset: footnote 0` is implicitly applied on the root element
      if (resetMap["footnote"] === undefined) {
        resetMap["footnote"] = 0;
      }
    }
    if (floatVal === Css.ident.footnote) {
      if (!incrementMap) {
        incrementMap = {};
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
        this.defineCounter(resetCounterName, resetMap[resetCounterName]);
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
    if (displayVal === Css.ident.list_item) {
      const listItemCounts = this.counters["ua-list-item"];
      const listItemCount = listItemCounts[listItemCounts.length - 1];
      props["ua-list-item-count"] = new CascadeValue(
        new Css.Num(listItemCount),
        0,
      );
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
          .map((v) => getStringValueFromCssContentVal(v))
          .join("");
        this.counterResolver.setNamedString(name, stringValue, this);
      }
    }
    delete props["string-set"];
  }

  processPseudoelementProps(pseudoprops: ElementStyle, element: Element): void {
    this.pushCounters(pseudoprops);
    const content = pseudoprops["content"] as CascadeValue;
    if (content) {
      pseudoprops["content"] = content.filterValue(
        new ContentPropVisitor(this, element, this.counterResolver),
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
      const counters: CounterValues = {};
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
            (pseudoName === "before" || pseudoName === "after") &&
            !Vtree.nonTrivialContent(
              (pseudoProps["content"] as CascadeValue)?.value,
            )
          ) {
            delete pseudos[pseudoName];
          } else if (before) {
            this.processPseudoelementProps(pseudoProps, element);
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

    if (itemToPushLast) {
      this.stack[this.stack.length - 2].push(itemToPushLast);
    }
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
      case "-adapt-href-epub-type":
      case "href-epub-type":
        if (params && params.length == 1 && typeof params[0] == "string") {
          const value = params[0] as string;
          const patt = new RegExp(`(^|s)${Base.escapeRegExp(value)}(\$|s)`);
          this.chain.push(new CheckTargetEpubTypeAction(patt));
        } else {
          this.chain.push(new CheckConditionAction("")); // always fails
        }
        break;
      case "-adapt-footnote-content":
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
      const specificity: number = this.specificity + this.cascade.nextOrder();
      this.processChain(this.makeApplyRuleAction(specificity));
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
    const cascval = this.condition
      ? new ConditionalCascadeValue(value, specificity, this.condition)
      : new CascadeValue(value, specificity);
    setPropCascadeValue(this.elementStyle, name, cascval);
  }

  finish(): Cascade {
    return this.cascade;
  }

  override startFuncWithSelector(funcName: string): void {
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
  transform: (p1: string, p2: CascadeValue) => T,
) => {
  const couplingMap = vertical
    ? rtl
      ? couplingMapVertRtl
      : couplingMapVert
    : rtl
    ? couplingMapHorRtl
    : couplingMapHor;
  for (const propName in src) {
    if (src.hasOwnProperty(propName)) {
      const cascVal = src[propName];
      if (!cascVal) {
        continue;
      }
      const coupledName = couplingMap[propName];
      let targetName: string;
      if (coupledName) {
        const coupledCascVal = src[coupledName];
        if (coupledCascVal && coupledCascVal.priority > cascVal.priority) {
          continue;
        }
        targetName = geomNames[coupledName] ? coupledName : propName;
      } else {
        targetName = propName;
      }
      dest[targetName] = transform(propName, cascVal);
    }
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
      const exprResult = exprVal.expr.evaluate(this.context);
      if (typeof exprResult === "number") {
        value = new Css.Numeric(exprResult, "px");
      }
    }
    return value;
  }

  override visitNumeric(numeric: Css.Numeric): Css.Val {
    if (
      this.resolveViewportUnit &&
      Exprs.isViewportRelativeLengthUnit(numeric.unit)
    ) {
      return new Css.Numeric(
        numeric.num * this.context.queryUnitSize(numeric.unit, false),
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
): Css.Val {
  try {
    if (val instanceof Css.Expr) {
      return CssParser.evaluateExprToCSS(context, val.expr, propName);
    }
    if (val instanceof Css.Numeric || val instanceof Css.Func) {
      return val.visit(new CalcFilterVisitor(context, true, percentRef));
    }
  } catch (err) {
    Logging.logger.warn(err);
    return Css.empty;
  }
  return val;
}
