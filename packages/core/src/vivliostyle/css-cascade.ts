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
import * as RangeClientRects from "./range-client-rects";
import * as SemanticFootnote from "./semantic-footnote";
import * as Vtree from "./vtree";
import { CssCascade, CssStyler, Layout } from "./types";
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
  return [...polyfilledInheritedProps, ...hooks.flatMap((f) => f())];
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

/**
 * A cascade layer (CSS `@layer`, css-cascade-5 §6.4).
 *
 * `order` is (re)assigned by {@link CascadeLayerTree} whenever a layer is added
 * so that it always reflects the current layer ordering; a larger value means
 * a higher precedence for normal declarations.
 */
export class CascadeLayer {
  order: number = 0;
  readonly children: CascadeLayer[] = [];

  constructor(
    public readonly name: string | null,
    public readonly parent: CascadeLayer | null,
  ) {}
}

/**
 * The layer tree of one cascade origin. Layers are ordered by a post-order
 * traversal, because the declarations directly contained in a layer form an
 * implicit final sub-layer of it.
 */
export class CascadeLayerTree {
  readonly root = new CascadeLayer(null, null);

  /**
   * @param nameList `null` for an anonymous layer, otherwise the dot-separated
   *     `<layer-name>` split into its parts.
   */
  register(
    parent: CascadeLayer | null,
    nameList: string[] | null,
  ): CascadeLayer {
    let layer = parent ?? this.root;
    if (nameList) {
      for (const name of nameList) {
        let child = layer.children.find((c) => c.name === name);
        if (!child) {
          child = new CascadeLayer(name, layer);
          layer.children.push(child);
        }
        layer = child;
      }
    } else {
      const child = new CascadeLayer(null, layer);
      layer.children.push(child);
      layer = child;
    }
    this.renumber();
    return layer;
  }

  private renumber(): void {
    let order = 0;
    const visit = (layer: CascadeLayer): void => {
      for (const child of layer.children) {
        visit(child);
      }
      layer.order = order++;
    };
    for (const child of this.root.children) {
      visit(child);
    }
  }
}

/**
 * Size of the range of `CascadeValue.priority` values assigned to one cascade
 * origin (see the `SPECIFICITY_*` constants in css-parser).
 */
const ORIGIN_UNIT = 0x1000000;

/**
 * The lowest origin bucket that holds `!important` declarations, for which the
 * layer order is reversed.
 */
const FIRST_IMPORTANT_ORIGIN = 4;

/** Whether a winning declaration belongs to an important cascade origin. */
export function isImportant(cascVal: CascadePriority): boolean {
  return Math.floor(cascVal.priority / ORIGIN_UNIT) >= FIRST_IMPORTANT_ORIGIN;
}

let lastRuleId = 0;

/**
 * A fresh identity for one declaration block, so that `revert-rule` can tell
 * the declarations of its own rule from the rest of the cascade. Zero is
 * reserved for values the engine synthesizes outside of any rule.
 */
export function nextRuleId(): number {
  return ++lastRuleId;
}

/**
 * What the cascade sorts by, apart from the document order. Cascaded values
 * are the usual case, but the name-defining at-rules (`@font-face`,
 * `@counter-style`, `@-epubx-page-master`) are sorted the same way
 * (css-cascade-5 §6.4).
 */
export interface CascadePriority {
  readonly priority: number;
  readonly layer: CascadeLayer | null;
}

/**
 * The cascade origin a cascaded value belongs to, disregarding `!important`:
 * 0 for the user-agent origin, 1 for the user origin and 2 for the author
 * origin, of which the style attribute is a part.
 */
function originOf(cascVal: CascadeValue): number {
  switch (Math.floor(cascVal.priority / ORIGIN_UNIT)) {
    case 0:
      return 0; // user agent (shares one bucket with its !important side)
    case 1:
    case 6:
      return 1; // user
    default:
      return 2; // author, including the style attribute
  }
}

/**
 * The set of declarations within which cascade layers are compared. Layers
 * belong to one origin, and the element-attached styles (the `style`
 * attribute) form a set of their own, so that `revert-layer` used there rolls
 * back only the style attribute and lands on the author style sheets
 * (css-cascade-5 §7.3.5, WPT css-cascade/revert-layer-009).
 */
function layerSetOf(cascVal: CascadeValue): number {
  switch (Math.floor(cascVal.priority / ORIGIN_UNIT)) {
    case 0:
      return 0; // user agent
    case 1:
    case 6:
      return 1; // user
    case 3:
    case 4:
      return 3; // element-attached styles
    default:
      return 2; // author style sheets
  }
}

/**
 * The position of a cascaded value's layer in its origin. Unlayered
 * declarations act as the final layer (css-cascade-5 §6.4.2).
 */
function layerOrderOf(cascVal: CascadePriority): number {
  return cascVal.layer ? cascVal.layer.order : Infinity;
}

/**
 * Compares two cascaded values (or two name-defining at-rules). Cascade layers
 * are sorted between the origin and the selector specificity, and unlayered
 * declarations act as a final layer (css-cascade-5 §6.4.2).
 */
export function comparePriority(
  a: CascadePriority,
  b: CascadePriority,
): number {
  const originA = Math.floor(a.priority / ORIGIN_UNIT);
  const originB = Math.floor(b.priority / ORIGIN_UNIT);
  if (originA !== originB) {
    return originA - originB;
  }
  if (a.layer !== b.layer) {
    const orderA = layerOrderOf(a);
    const orderB = layerOrderOf(b);
    if (orderA !== orderB) {
      const higher = orderA > orderB ? 1 : -1;
      return originA >= FIRST_IMPORTANT_ORIGIN ? -higher : higher;
    }
  }
  return a.priority - b.priority;
}

export class CascadeValue implements CssCascade.CascadeValue {
  constructor(
    public readonly value: Css.Val,
    public readonly priority: number,
    public readonly layer: CascadeLayer | null = null,
    public readonly ruleId: number = 0,
  ) {}

  getBaseValue(): CascadeValue {
    return this;
  }

  /**
   * A copy of this cascaded value carrying another CSS value, keeping
   * everything the cascade sorts by (priority, layer and rule identity).
   */
  withValue(value: Css.Val): CascadeValue {
    if (value === this.value) {
      return this;
    }
    return new CascadeValue(value, this.priority, this.layer, this.ruleId);
  }

  filterValue(visitor: Css.Visitor): CascadeValue {
    return this.withValue(this.value.visit(visitor));
  }

  increaseSpecificity(specificity: number): CascadeValue {
    if (specificity == 0) {
      return this;
    }
    return new CascadeValue(
      this.value,
      this.priority + specificity,
      this.layer,
      this.ruleId,
    );
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
    layer: CascadeLayer | null = null,
    ruleId: number = 0,
  ) {
    super(value, priority, layer, ruleId);
  }

  override getBaseValue(): CascadeValue {
    return new CascadeValue(this.value, this.priority, this.layer, this.ruleId);
  }

  override withValue(value: Css.Val): CascadeValue {
    if (value === this.value) {
      return this;
    }
    return new ConditionalCascadeValue(
      value,
      this.priority,
      this.condition,
      this.layer,
      this.ruleId,
    );
  }

  override increaseSpecificity(specificity: number): CascadeValue {
    if (specificity == 0) {
      return this;
    }
    return new ConditionalCascadeValue(
      this.value,
      this.priority + specificity,
      this.condition,
      this.layer,
      this.ruleId,
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
  if ((!tv || comparePriority(av, tv) >= 0) && av.isEnabled(context)) {
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
    return;
  }
  if (context && !value.isEnabled(context)) {
    return;
  }
  recordCascadeHistory(style, name, value);
  const tv = style[name] as CascadeValue;
  if (!tv || comparePriority(value, tv) >= 0) {
    style[name] = context ? value.getBaseValue() : value;
  }
}

/**
 * Property names for which a rollback keyword (`revert`, `revert-layer` or
 * `revert-rule`) has been seen in any parsed style sheet. Resolving such a
 * keyword is the only thing that needs to look below the winner of the
 * cascade, so the declarations that lose are kept only for these properties.
 */
const rollbackDeclaredProps = new Set<string>();

/**
 * Called for every declaration as it is parsed, to note the properties whose
 * cascade history has to be retained.
 */
export function noteRollbackDeclaration(
  name: string,
  value: Css.Val,
  validatorSet?: CssValidator.ValidatorSet,
): void {
  if (Css.isRollbackValue(value)) {
    rollbackDeclaredProps.add(name);
    return;
  }
  if (!Css.containsRollbackValue(value)) {
    return;
  }
  // A keyword that is not the whole value only survives validation inside a
  // var() fallback, from where substitution can still make it the whole value
  // — of this property, or of the longhands a shorthand expands into once the
  // substituted value turns out to be a CSS-wide keyword.
  rollbackDeclaredProps.add(name);
  const propList = validatorSet?.getShorthand(name, value)?.propList;
  if (propList) {
    for (const nameLH of propList) {
      rollbackDeclaredProps.add(nameLH);
    }
  }
}

/**
 * The declarations that lost the cascade, for the properties in
 * {@link rollbackDeclaredProps}. Held outside of the ElementStyle so that the
 * code walking a style is not disturbed by an entry of a different shape, and
 * dropped together with the style it belongs to.
 */
const cascadeHistories = new WeakMap<
  ElementStyle,
  { [name: string]: CascadeValue[] }
>();

function recordCascadeHistory(
  style: ElementStyle,
  name: string,
  value: CascadeValue,
): void {
  if (!rollbackDeclaredProps.has(name) || value.value === Css.empty) {
    // `Css.empty` only reserves a longhand slot for a shorthand declaration,
    // so it is not something a rollback can land on.
    return;
  }
  let history = cascadeHistories.get(style);
  if (!history) {
    history = {};
    cascadeHistories.set(style, history);
  }
  let values = history[name];
  if (!values) {
    values = history[name] = [];
    // The style may already hold a declaration that never passed through here,
    // most notably the one from the `style` attribute.
    const current = style[name] as CascadeValue;
    if (current && current.value !== Css.empty) {
      values.push(current);
    }
  }
  values.push(value);
}

/**
 * Whether `candidate` is one of the declarations that `reverting` rolls back,
 * i.e. one of those the cascade has to be run without.
 */
function isRolledBackBy(
  candidate: CascadeValue,
  reverting: CascadeValue,
): boolean {
  // The kind has to be dispatched case-insensitively as well: a value that a
  // var() substitution puts into the declaration is not canonicalized, and
  // mixing the kinds up would drop declarations of the wrong origins or rules.
  // (Review)
  switch (Css.getRollbackKind(reverting.value)) {
    case "revert-rule":
      return candidate.ruleId === reverting.ruleId;
    case "revert-layer":
      // `revert-layer` rolls back to the layers *before* the current one, so
      // the current layer and every later one drop out — including the
      // important declarations of later layers, which outrank the current
      // layer for normal declarations but are rolled back all the same
      // (WPT css-cascade/revert-layer-005).
      return (
        layerSetOf(candidate) === layerSetOf(reverting) &&
        layerOrderOf(candidate) >= layerOrderOf(reverting)
      );
    default:
      // `revert` rolls back to the earlier origin, so the current origin and
      // every later one drop out: a user declaration reverts past the author
      // origin as well (css-cascade-5 §7.3.4).
      return originOf(candidate) >= originOf(reverting);
  }
}

/**
 * The value a rollback keyword resolves to: the winner of the cascade run
 * again without the declarations the keyword rolls back. The value found may
 * itself be a rollback keyword, in which case the rollback is applied again on
 * top of the previous one; a cycle exhausts the candidates and ends up with no
 * declaration at all.
 */
function resolveRollbackValue(
  name: string,
  reverting: CascadeValue,
  candidates: CascadeValue[],
): Css.Val {
  let remaining = candidates;
  while (Css.isRollbackValue(reverting.value)) {
    // The reverting declaration itself always belongs to what it rolls back,
    // so `remaining` strictly shrinks and this terminates.
    remaining = remaining.filter((v) => !isRolledBackBy(v, reverting));
    let winner: CascadeValue | null = null;
    for (const candidate of remaining) {
      if (!winner || comparePriority(candidate, winner) >= 0) {
        winner = candidate;
      }
    }
    if (!winner) {
      // Nothing is left in Vivliostyle's own cascade to roll back to. A custom
      // property is then the guaranteed-invalid value, which this engine
      // spells `initial`.
      //
      // Any other property keeps the keyword, so that the browser resolves it
      // in the cascade of the generated document, where the declaration lands
      // in the `style` attribute. What is left there below it is exactly what
      // Vivliostyle does not model: the browser's own user-agent style sheet,
      // which knows the widget styles of `input`, `button` and the like that
      // Vivliostyle's user-agent style sheet deliberately does not define, and
      // the presentational hints of attributes such as `width` or `hidden`,
      // which are author-origin declarations below every author rule.
      // Resolving the keyword here instead would mean `unset`, dropping the
      // border of a form control that reverts (WPT css-ui/appearance-revert-001,
      // compute-kind-widget-fallback-props-revert-001).
      return Css.isCustomPropName(name) ? Css.ident.initial : reverting.value;
    }
    reverting = winner;
  }
  return reverting.value;
}

/**
 * Replace every rollback keyword that won the cascade with the declaration it
 * rolls back to, so that the layout engine sees a real value instead of the
 * keyword. When Vivliostyle's own cascade has nothing left to roll back to,
 * the keyword survives on purpose and is handed to the browser through the
 * `style` attribute of the generated element (see `resolveRollbackValue`).
 *
 * This runs twice: once as soon as the cascade is settled, because the value
 * rolled back to may itself be a shorthand or contain var(), and once more
 * after var() substitution, because a keyword written in a var() fallback
 * only becomes the whole value there.
 *
 * @param afterVarSubstitution whether this is the second pass. Custom
 *     properties are left alone then: a custom property whose *substituted*
 *     value happens to spell a rollback keyword is not a rollback, it is just
 *     a token stream that no property can use (WPT-matching browser
 *     behavior). This pass also discards the retained cascade history.
 * @returns whether a value was rolled back to one that still contains var()
 */
export function resolveRollbackValues(
  style: ElementStyle,
  afterVarSubstitution: boolean = false,
): boolean {
  if (!rollbackDeclaredProps.size) {
    return false;
  }
  const history = cascadeHistories.get(style);
  let varSubstitutionNeeded = false;
  for (const name in style) {
    if (isMapName(name)) {
      const styleMap = getStyleMap(style, name);
      for (const key in styleMap) {
        // Note: `||=` would short-circuit the recursion away once one of the
        // sub-styles has asked for another var() pass.
        if (resolveRollbackValues(styleMap[key], afterVarSubstitution)) {
          varSubstitutionNeeded = true;
        }
      }
    } else if (name === "_viewConditionalStyles") {
      for (const entry of getViewConditionalStyleMap(style)) {
        if (resolveRollbackValues(entry.styles, afterVarSubstitution)) {
          varSubstitutionNeeded = true;
        }
      }
    } else if (isPropName(name)) {
      const cascVal = getProp(style, name);
      if (!cascVal || !Css.isRollbackValue(cascVal.value)) {
        continue;
      }
      if (afterVarSubstitution && Css.isCustomPropName(name)) {
        // A custom property whose *substituted* value happens to spell a
        // rollback keyword is not a rollback: it is a token stream that no
        // property can use, which is the guaranteed-invalid value.
        style[name] = cascVal.withValue(Css.ident.initial);
        continue;
      }
      const value = resolveRollbackValue(name, cascVal, history?.[name] ?? []);
      style[name] = cascVal.withValue(value);
      if (CssValidator.containsVar(value)) {
        varSubstitutionNeeded = true;
      }
    }
  }
  if (afterVarSubstitution) {
    // The cascade for this style is over, so the declarations that lost it are
    // of no further use.
    cascadeHistories.delete(style);
  }
  return varSubstitutionNeeded;
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
export const FOOTNOTE_COUNTER_ATTR = "data-viv-footnote-counter";
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

function getDuplicateSemanticFootnoteCounterValues(
  element: Element,
  counterName: string,
): number[] | null {
  if (
    !SemanticFootnote.isSemanticFootnoteNoterefElement(element) ||
    element.hasAttribute(SemanticFootnote.SEMANTIC_FOOTNOTE_FIRST_REF_ATTR)
  ) {
    return null;
  }
  const storedOnElement = getFootnoteCounterMap(element)[counterName];
  if (storedOnElement) {
    return storedOnElement;
  }
  const href =
    element.getAttribute("href") ||
    element.getAttributeNS(Base.NS.XLINK, "href");
  if (!href) {
    return null;
  }
  const baseURL = element.baseURI || element.ownerDocument?.baseURI || "";
  const resolvedHref = Base.resolveReferenceURL(href, baseURL);
  if (resolvedHref === "#") {
    return null;
  }
  if (resolvedHref.replace(/#.*$/, "") !== baseURL.replace(/#.*$/, "")) {
    return null;
  }
  const hashIndex = resolvedHref.indexOf("#");
  if (hashIndex < 0 || hashIndex === resolvedHref.length - 1) {
    return null;
  }
  const target = element.ownerDocument?.getElementById(
    resolvedHref.substring(hashIndex + 1),
  );
  if (!(target instanceof Element)) {
    return null;
  }
  const storedOnTarget = getFootnoteCounterMap(target)[counterName];
  if (storedOnTarget) {
    setFootnoteCounterValues(element, counterName, storedOnTarget);
    return storedOnTarget;
  }
  return null;
}

function hasNonTrivialFootnotePseudoContent(
  pseudoProps: ElementStyle,
): boolean {
  const content = getProp(pseudoProps, "content");
  return !!content && Vtree.nonTrivialContent(content.value);
}

export function isSpecialName(name: string): boolean {
  return !!SPECIALS[name];
}

export function isMapName(name: string): boolean {
  return name.startsWith("_") && name !== "_viewConditionalStyles";
}

export function isPropName(name: string): boolean {
  return !name.startsWith("_") && !SPECIALS[name];
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
  validatorSet: CssValidator.ValidatorSet | null,
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
      ts.push(...as);
    } else {
      // regular properties: higher priority wins
      const cascval = getProp(style, prop);
      if (!cascval.isEnabled(context)) {
        continue;
      }
      const av = cascval.increaseSpecificity(specificity);
      setPropCascadeValue(target, prop, av, context);

      // Reserve longhand slots for shorthand declarations, including
      // browser-supported shorthands discovered lazily by ValidatorSet.
      const propListLH = validatorSet?.getShorthand(prop, av.value)?.propList;
      if (propListLH) {
        for (const propLH of propListLH) {
          const avLH = av.withValue(Css.empty);
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
    mergeIn(context, target, styles[k], 0, null, null, null, null);
  }
  return target;
}

export function chainActions(
  chain: ChainedAction[],
  action: CascadeAction,
): CascadeAction {
  if (chain.length > 0) {
    chain.sort((a, b) => b.getPriority() - a.getPriority());
    for (let i = chain.length - 1; i >= 0; i--) {
      action = chain[i].wire(action);
    }
  }
  return action;
}

/**
 * Check whether the value is the given CSS keyword. The CSS keywords are ASCII
 * case-insensitive, and values substituted from a custom property (`var()`)
 * are not canonicalized to lowercase by the validator, so the names are
 * compared case-insensitively. (Issue #2174 follow-up)
 */
export function hasKeywordName(value: Css.Val, name: string): boolean {
  return value instanceof Css.Ident && value.name.toLowerCase() === name;
}

/**
 * Resolve the relative font-size keywords `larger`/`smaller` against the
 * parent font-size, using the same factor (1.2) as browsers. (Issue #2174)
 */
export function resolveRelativeFontSizeKeyword(
  ident: Css.Ident,
  parentFontSize: number,
): number {
  return hasKeywordName(ident, "larger")
    ? parentFontSize * 1.2
    : parentFontSize / 1.2;
}

/**
 * Resolve the relative font-weight keyword `bolder`/`lighter` against the
 * inherited font weight, following the CSS Fonts 4 relative weights table:
 * `bolder` uses 400 for an inherited weight below 350, 700 below 550 and 900
 * up to 900, while a heavier inherited weight (up to 1000) is kept as it is;
 * `lighter` uses 100 (or the inherited weight when it is smaller than 100),
 * 400 below 750 and 700 otherwise.
 */
export function resolveRelativeFontWeight(
  keyword: Css.Ident,
  inheritedWeight: number,
): number {
  if (hasKeywordName(keyword, "bolder")) {
    if (inheritedWeight < 350) {
      return 400;
    }
    if (inheritedWeight < 550) {
      return 700;
    }
    return inheritedWeight > 900 ? inheritedWeight : 900;
  }
  if (inheritedWeight < 550) {
    return Math.min(inheritedWeight, 100);
  }
  return inheritedWeight < 750 ? 400 : 700;
}

/**
 * The absolute font-size keywords in the order of the tables below: the rows
 * of the table are the default font size in px (9 to 16, the range that the
 * engines have a table for) and the columns are xx-small..xxx-large. The
 * engines share this table (Blink `font_size_functions.cc`, Gecko
 * `to_length_without_context` and its `nsRuleNode::CalcFontPointSize`, WebKit
 * `StyleFontSizeFunctions.cpp`), e.g. the 16px row is 9/10/13/16/18/24/32/48 px;
 * `xxx-small` is not a keyword of CSS Fonts 4. The quirks mode table of the
 * engines and the table of the fixed default size, which a monospace element
 * uses, are not modelled. CSS Fonts 4 gives the factors of
 * `fontSizeKeywordFactors` as a guideline for the table, and the engines use
 * exactly those factors, with 8/9 rounded to 0.89, when the default font size
 * is outside the table; `medium` is then the default font size. Vivliostyle
 * models the default font size as `context.initialFontSize`. (Issue #2174
 * follow-up, Review)
 */
const fontSizeKeywordNames = [
  "xx-small",
  "x-small",
  "small",
  "medium",
  "large",
  "x-large",
  "xx-large",
  "xxx-large",
];

const fontSizeKeywordTable = [
  [9, 9, 9, 9, 11, 14, 18, 27],
  [9, 9, 9, 10, 12, 15, 20, 30],
  [9, 9, 10, 11, 13, 17, 22, 33],
  [9, 9, 10, 12, 14, 18, 24, 36],
  [9, 10, 12, 13, 16, 20, 26, 39],
  [9, 10, 12, 14, 17, 21, 28, 42],
  [9, 10, 13, 15, 18, 23, 30, 45],
  [9, 10, 13, 16, 18, 24, 32, 48],
];

// The scaling factors of CSS Fonts 4, in the order of the keywords, as the
// engines apply them: 3/5, 3/4, 8/9 (rounded to 0.89), 1, 6/5, 3/2, 2/1, 3/1.
const fontSizeKeywordFactors = [0.6, 0.75, 0.89, 1, 1.2, 1.5, 2, 3];

/**
 * Resolve an absolute font-size keyword (e.g. "small") to px against the
 * default font size. Returns null when the value is not an absolute keyword.
 */
export function resolveAbsoluteFontSizeKeyword(
  value: Css.Val,
  defaultFontSize: number,
): number | null {
  if (value instanceof Css.Ident) {
    const index = fontSizeKeywordNames.indexOf(value.name.toLowerCase());
    if (index < 0) {
      return null;
    }
    // The engines look the table up with a rounded default font size and apply
    // the factors to the exact one. (Review)
    const rounded = Math.round(defaultFontSize);
    return rounded >= 9 && rounded <= 16
      ? fontSizeKeywordTable[rounded - 9][index]
      : defaultFontSize * fontSizeKeywordFactors[index];
  }
  return null;
}

/**
 * Whether a font weight number is in the range of CSS Fonts 4, which accepts
 * `<number [1,1000]>` (or the `normal`/`bold` keywords). (Review)
 */
export function isValidFontWeight(num: number): boolean {
  return Number.isFinite(num) && num >= 1 && num <= 1000;
}

/**
 * Whether a declared font-size value is valid although it cannot be resolved to
 * a length here: a browser-supported value that the validator passes through,
 * e.g. the `math` keyword (whose value depends on the math depth) or a unit
 * that only the browser resolves such as `ch`. A value that a var()
 * substitution made invalid and a value with an unresolved var() are not
 * preserved. (Review)
 */
export function isValidUnresolvedFontSize(
  context: Exprs.Context,
  value: Css.Val,
): boolean {
  return (
    !CssValidator.containsVar(value) &&
    // A supported function whose computation is not a number, e.g. the
    // `round(20px, 0px)` of a declaration, is not a value that only the
    // browser resolves: it is invalid at computed-value time, so the element
    // keeps the font size that the source parent accumulated, as the browser
    // inherits it. (Review)
    !evaluatesToNaN(context, value) &&
    CSS.supports("font-size", value.toString())
  );
}

/**
 * Whether a value is a calculation of a supported math function that evaluates
 * to `NaN`, e.g. the `log(100, 0)` or the `round(40px, 0)` of a declaration:
 * the browser accepts such a declaration but its computed value is not a
 * number, which makes the declaration invalid at computed-value time, so the
 * property inherits the parent's value. A value that this engine cannot
 * evaluate, e.g. one with a unit that only the browser resolves, is not
 * reported: it may well become a number in the browser. (Review)
 */
export function evaluatesToNaN(
  context: Exprs.Context,
  value: Css.Val,
): boolean {
  if (
    !(value instanceof Css.Func || value instanceof Css.Expr) ||
    CssValidator.containsVar(value)
  ) {
    return false;
  }
  if (/infinity|nan/i.test(value.toString())) {
    // A calculation that already contains a number that is not finite, e.g.
    // the `calc(exp(1000))` that a length cannot represent, is not evaluable
    // here: the expression language would take the token for a name.
    return false;
  }
  const visitor = new CalcFilterVisitor(context, true);
  // The expression evaluator reduces a math function when it is the
  // calculation of a `calc()`, so the value is wrapped like the callers of the
  // number and length resolvers wrap it.
  new Css.Func("calc", [value]).visit(visitor);
  return visitor.evaluatedToNaN;
}

/**
 * Whether a declared line height is invalid: `line-height` accepts `normal`, a
 * non-negative number or a non-negative length or percentage, so any other
 * post-substitution value is rejected by the browser, which keeps the inherited
 * line height. (Review)
 */
export function isInvalidLineHeight(
  context: Exprs.Context,
  value: Css.Val,
): boolean {
  if (
    value === Css.empty ||
    CssValidator.containsVar(value) ||
    Css.isDefaultingValue(value) ||
    hasKeywordName(value, "normal")
  ) {
    // The CSS-wide keywords are materialized by the walk, and a value with an
    // unresolved var() is not known to be invalid here.
    return false;
  }
  if (value instanceof Css.Expr || value instanceof Css.Func) {
    // A math function is allowed until it is evaluated, but one that is invalid
    // at computed-value time, e.g. the `min(10px, 2)` that a var() substitution
    // put into the declaration, makes the browser reject the declaration and
    // keep the inherited line height. `CSS.supports()` only knows the syntax,
    // so a supported function whose result is not a number, e.g.
    // `log(100, 0)`, is detected by evaluating it. The internal viewport units
    // of this engine are treated as the lengths they are, because the browser
    // does not know them, while a value that mixes types (`min(2pvw, 1)`) or
    // uses an unknown function is rejected like any other. (Review)
    return (
      !CSS.supports("line-height", checkableText(value)) ||
      evaluatesToNaN(context, value)
    );
  }
  if (value instanceof Css.Num) {
    return value.num < 0;
  }
  if (value instanceof Css.Numeric) {
    return value.num < 0 || !CSS.supports("line-height", checkableText(value));
  }
  return value instanceof Css.Ident;
}

/**
 * Whether a declared font-weight value is invalid: `font-weight` accepts a
 * number in the 1-1000 range of CSS Fonts 4 and the keywords (the relative
 * `bolder`/`lighter` are resolved by the visitor), so every other
 * post-substitution form, e.g. the `nonsense` or `700px` that a var()
 * substitution put into the declaration, is rejected by the browser, which
 * inherits the parent font weight. A math function is valid and is validated
 * after it has been evaluated (a value outside the range is clamped, one whose
 * result is not a number, e.g. `log(100, 0)`, is invalid). (Review)
 */
export function isInvalidFontWeight(
  context: Exprs.Context,
  value: Css.Val,
): boolean {
  if (value instanceof Css.Num) {
    return !isValidFontWeight(value.num);
  }
  if (value instanceof Css.Ident) {
    if (value === Css.empty || Css.isRollbackValue(value)) {
      // Not a value of this property: it is handled elsewhere.
      return false;
    }
    return !(
      hasKeywordName(value, "normal") ||
      hasKeywordName(value, "bold") ||
      hasKeywordName(value, "bolder") ||
      hasKeywordName(value, "lighter") ||
      // The CSS-wide keywords are handled by the walk of the detached content;
      // compare the names, because a keyword that comes from a custom property
      // is not canonicalized.
      hasKeywordName(value, "initial") ||
      hasKeywordName(value, "inherit") ||
      hasKeywordName(value, "unset")
    );
  }
  if (value instanceof Css.Func || value instanceof Css.Expr) {
    // A math function is valid as long as the browser accepts it: a function
    // that is invalid at computed-value time, e.g. the `min(900px, 1em)` that a
    // var() substitution put into the declaration, is rejected, while one whose
    // value this engine does not evaluate, e.g. `round(650, 100)`, is left for
    // the browser. A supported function whose result is not a number, e.g.
    // `log(100, 0)`, is invalid as well: the element inherits the parent font
    // weight, which a relative keyword of a descendant must resolve against.
    // (Review)
    return (
      !CSS.supports("font-weight", value.toString()) ||
      evaluatesToNaN(context, value)
    );
  }
  return true;
}

/**
 * Whether a function value is valid for a property in the sense of the
 * browser. The math functions of CSS Values 4 are evaluated by this engine as
 * numbers of its expression language, which converts every dimension to px, so
 * a function whose arguments or result have a type that the property does not
 * accept — e.g. the `round(20px, 7)` that rounds a length to a multiple of a
 * number, or the number that `sign()` returns — must not become a computed
 * value here: such a declaration is invalid, and the element inherits. A
 * value that is not a function is valid as far as this check is concerned.
 * (Review)
 */
function isSupportedFunctionValue(propName: string, value: Css.Val): boolean {
  return (
    !(value instanceof Css.Func || value instanceof Css.Expr) ||
    CSS.supports(propName, value.toString())
  );
}

/**
 * Whether a function value is one that the browser rejects for the property,
 * while the math functions of this engine could evaluate it: e.g. the
 * `calc(round(20px, 7))` that a var() substitution put into a declaration,
 * whose `round()` step has a type that the property does not accept. Such a
 * declaration is invalid at computed-value time, so the browser keeps the
 * inherited value, and this engine must not make it valid by evaluating the
 * function. A function with an internal viewport unit (`pv*`) is not such a
 * value: the browser does not know those units, while this engine resolves
 * them. (Review)
 */
function isFunctionRejectedByBrowser(
  propName: string,
  value: Css.Val,
): boolean {
  return (
    value instanceof Css.Func && !CSS.supports(propName, checkableText(value))
  );
}

/**
 * The value in the form that `CSS.supports()` can check: the internal page
 * viewport units of this engine are replaced by a length, as
 * `Css.withoutPageViewportUnits()` does, because a browser does not know those
 * units although this engine resolves them, e.g. against the size of the page
 * box. A declaration that uses one is a valid length for a browser, so the
 * syntax and the types of the value are checked as if it were written with
 * such a length: a value that mixes types, e.g. `min(2pvw, 1)`, and an unknown
 * function, e.g. `foo(2pvw)`, stay invalid. (Review)
 */
function checkableText(value: Css.Val): string {
  return Css.withoutPageViewportUnits(value.toString());
}

/**
 * Whether a declared font-size value is a negative literal length. Such a value
 * is outside the non-negative range of `font-size`, so it is invalid: the
 * browser rejects the declaration and the element inherits the parent font
 * size, e.g. when a var() substitution puts such a length into the declaration.
 * A math function that computes a negative value is valid instead and is
 * clamped to zero. (Review)
 */
export function isNegativeLiteralFontSize(value: Css.Val): boolean {
  return value instanceof Css.Numeric && value.num < 0;
}

/**
 * Whether a line height is a negative literal, e.g. the `-5px` that a var()
 * substitution put into the declaration: the computed-value range of
 * `line-height` is non-negative, so the browser rejects such a declaration and
 * inherits the parent line height, while a math function that computes a
 * negative value is valid and is clamped to zero instead. (Review)
 */
export function isNegativeLiteralLineHeight(value: Css.Val): boolean {
  return (
    (value instanceof Css.Numeric || value instanceof Css.Num) && value.num < 0
  );
}

/**
 * The size of a font relative unit that only the browser resolves, as a
 * multiple of the font size. These units come from the glyph metrics of the
 * actual font, which this engine cannot obtain before the source document is
 * laid out, and which differ with the font, the platform and the user settings,
 * so the assumptions of CSS Values 4 §6.1 are used: it defines them for the
 * cases where it is "impossible or impractical to determine" the metric (the
 * `0` glyph of `ch` and the x-height of `ex` are assumed to be 0.5em, and the
 * ideographic advance of `ic` is 1em). Only the cap height of `cap` has no
 * numeric assumption there ("the font's ascent must be used", which is not
 * obtainable here either), so the typical cap height of the Latin fonts is
 * used, about 0.7em (0.57em for Courier, 0.73em for Verdana). Returns null for
 * every other unit, including the ones `Exprs.defaultUnitSizes` covers.
 * (Review)
 */
export function browserFontRelativeUnitRatio(unit: string): number | null {
  switch (unit) {
    case "ch":
    case "ex":
      // "In the cases where it is impossible or impractical to determine the
      // measure of the “0” glyph, it must be assumed to be 0.5em wide" and
      // "In the cases where it is impossible or impractical to determine the
      // x-height, a value of 0.5em must be assumed."
      return 0.5;
    case "cap":
      return 0.7;
    case "ic":
      // "In the cases where it is impossible or impractical to determine the
      // ideographic advance measure, it must be assumed to be 1em."
      return 1;
    default:
      return null;
  }
}

/**
 * Resolve a font-size value that is neither a keyword nor a Css.Numeric to px:
 * a unitless number (valid for font-size only as zero, e.g. `font-size: 0`),
 * a calc() expression, or a clamp()/min()/max() function. The em/% and
 * viewport units in these values have already been converted to px by
 * visitNumeric while the inherited values were accumulated, so an expression
 * whose remaining units are all resolvable can be evaluated here.
 *
 * `parentFontSize` is the font size that the `em`/`%` arguments refer to. It is
 * only needed for a value that has not been through that conversion, e.g. the
 * root font size, whose parent font size is the initial font size. A resolved
 * value is clamped to the non-negative computed-value range of `font-size`.
 * Returns null when the value cannot be resolved to a length. (Issue #2174
 * follow-up)
 */
export function resolveFontSizeValueToPx(
  context: Exprs.Context,
  value: Css.Val,
  parentFontSize?: number,
): number | null {
  if (!isSupportedFunctionValue("font-size", value)) {
    return null;
  }
  if (value instanceof Css.Num) {
    // Only a unitless zero is a valid font-size. Any other unitless number,
    // e.g. one that a var() substitution put into the declaration, is rejected
    // by the browser, which inherits the parent font size instead.
    return value.num === 0 ? 0 : null;
  }
  if (parentFontSize != null && value instanceof Css.Func) {
    value = convertParentRelativeFontSizeUnits(context, value, parentFontSize);
  }
  const px =
    value instanceof Css.Func && isMathFunction(value)
      ? evaluateMathFunctionToPx(context, value)
      : evaluateValueToPx(context, value);
  // A conversion of a dimension that has no unit size, e.g. the `5s` that a
  // var() substitution put into `font-size: var(--size)`, is not a length
  // (`NaN`), so the declaration is invalid and the element inherits the parent
  // font size. (Review)
  return px == null || !Number.isFinite(px) ? null : Math.max(0, px);
}

/**
 * Convert the parts of a font-size value that resolve against the inherited
 * font size (`em`, `%`, and the units that such values resolve to) into px,
 * using the given parent font size as that inherited value. The conversion of
 * the walk is reused; the parts that do not depend on the parent font size are
 * left for the caller.
 */
function convertParentRelativeFontSizeUnits(
  context: Exprs.Context,
  func: Css.Func,
  parentFontSize: number,
  parentLineHeight?: number,
): Css.Val {
  const parentProps = {
    "font-size": new CascadeValue(new Css.Numeric(parentFontSize, "px"), 0),
  } as ElementStyle;
  if (parentLineHeight != null) {
    // The `lh` unit refers to the line height of the parent, so that it does
    // not fall back to the preferred line height. (Review)
    parentProps["line-height"] = new CascadeValue(
      new Css.Numeric(parentLineHeight, "px"),
      0,
    );
  }
  const visitor = new InheritanceVisitor(parentProps, context);
  visitor.setPropName("font-size");
  return func.visit(visitor);
}

class LineHeightUnitVisitor extends Css.FilterVisitor {
  found = false;

  override visitNumeric(numeric: Css.Numeric): Css.Val {
    if (numeric.unit === "lh") {
      this.found = true;
    }
    return numeric;
  }
}

/**
 * Whether a value uses the `lh` unit, which refers to the line height of the
 * parent and is not accumulated in a detached subtree. (Review)
 */
export function usesLineHeightUnit(value: Css.Val): boolean {
  const visitor = new LineHeightUnitVisitor();
  value.visit(visitor);
  return visitor.found;
}

/**
 * Replace the `lh` units of a value with px, using the line height that the
 * element inherits. (Review)
 */
class LineHeightUnitReplacer extends Css.FilterVisitor {
  constructor(private readonly inheritedLineHeight: number) {
    super();
  }

  override visitNumeric(numeric: Css.Numeric): Css.Val {
    return numeric.unit === "lh"
      ? new Css.Numeric(numeric.num * this.inheritedLineHeight, "px")
      : numeric;
  }
}

/**
 * Whether a value is a unitless number: a value that contains a dimension, e.g.
 * the `1px` of `min(1px, 2px)`, is a length instead. This engine converts every
 * dimension to px while a value is accumulated, so a `Css.Numeric` in a value
 * here means such a length. (Review)
 */
class DimensionVisitor extends Css.FilterVisitor {
  found = false;

  override visitFunc(func: Css.Func): Css.Val {
    // The arguments of a function that returns a `<number>` whatever its
    // arguments are, e.g. the `20px` of `sign(20px)`, are a number and not a
    // length: they do not make the surrounding value a length, so the
    // arguments are not visited. (Review)
    if (NUMBER_MATH_FUNCTION_NAMES.includes(func.name.toLowerCase())) {
      return func;
    }
    return super.visitFunc(func);
  }

  override visitNumeric(numeric: Css.Numeric): Css.Val {
    this.found = true;
    return numeric;
  }
}

export function isUnitlessNumberValue(value: Css.Val): boolean {
  const visitor = new DimensionVisitor();
  value.visit(visitor);
  return !visitor.found;
}

/**
 * The px value of a math function of unitless numbers, e.g. the `min(1, 2)` of
 * `line-height: min(1, 2)`: `line-height` accepts a `<number>`, whose computed
 * value is the number multiplied by the font size of the element (`fontSize`),
 * and a function that this engine evaluates but that is not a length is such a
 * number. Returns null when the value is not such a function or evaluates to a
 * value that is not a finite number. (Review)
 */
function resolveUnitlessLineHeightFunctionToPx(
  context: Exprs.Context,
  value: Css.Val,
  fontSize: number,
): number | null {
  if (!(value instanceof Css.Func) || !isUnitlessNumberValue(value)) {
    return null;
  }
  const num = evaluateValueToNumber(context, value);
  if (num == null || !Number.isFinite(num)) {
    return null;
  }
  // `line-height` has a non-negative computed-value range, as a length has.
  return Math.max(0, num * fontSize);
}

/**
 * Resolve a computed line-height value that uses the `lh` unit, e.g.
 * `line-height: calc(1lh + 10px)`, against the line height that the element
 * inherits. Returns null when the value cannot be resolved to a length.
 * (Review)
 */
export function resolveLineHeightValueToPx(
  context: Exprs.Context,
  func: Css.Func,
  parentFontSize: number,
  inheritedLineHeight: number,
): number | null {
  if (!isSupportedFunctionValue("line-height", func)) {
    return null;
  }
  // The `lh` unit of a line height refers to the line height that the element
  // inherits, which the walk accumulates for the source parent. The visitor
  // converts the other parent relative units, but it leaves `lh` alone for a
  // property other than `font-size`. (Review)
  func = func.visit(
    new LineHeightUnitReplacer(inheritedLineHeight),
  ) as Css.Func;
  const converted = convertParentRelativeFontSizeUnits(
    context,
    func,
    parentFontSize,
    inheritedLineHeight,
  );
  // `evaluateValueToPx()` reduces the math functions of the value (including
  // the other functions of CSS Values 4, e.g. the `round(1lh, 7px)` that has
  // become `round(40px, 7px)` here) and the arithmetic around them. (Review)
  const px = evaluateValueToPx(context, converted);
  if (px == null) {
    // A function of unitless numbers, e.g. `min(1, 2)`, is not a length: it is
    // a number, whose computed line height is the number multiplied by the
    // font size of the element. (Review)
    return resolveUnitlessLineHeightFunctionToPx(
      context,
      converted,
      parentFontSize,
    );
  }
  // A length cannot be an infinity, and the browser clamps such a calculation
  // itself, so it is left unresolved (as a font size is). (Review)
  if (!Number.isFinite(px)) {
    return null;
  }
  // `line-height` has a non-negative computed-value range, so a math function
  // that computes below zero is clamped: `calc(1lh - 100px)` with a 40px
  // inherited line height is 0, and materializing the -60 that the expression
  // evaluates to would make the browser reject the declaration and inherit the
  // 40px instead of applying zero. (Review)
  return Math.max(0, px);
}

/**
 * Evaluate a clamp()/min()/max() function of numbers, e.g. the font-weight
 * `min(900, 1000)`. Returns null when any argument cannot be resolved to a
 * number.
 */
function evaluateMathFunctionToNumber(
  context: Exprs.Context,
  func: Css.Func,
): number | null {
  const name = func.name.toLowerCase();
  const isClamp = name === "clamp";
  if (func.values.length === 0 || (isClamp && func.values.length !== 3)) {
    return null;
  }
  const numbers: number[] = [];
  for (const value of func.values) {
    const num = evaluateValueToNumber(context, value);
    if (num == null) {
      return null;
    }
    numbers.push(num);
  }
  if (isClamp) {
    return Math.max(numbers[0], Math.min(numbers[1], numbers[2]));
  }
  return name === "min" ? Math.min(...numbers) : Math.max(...numbers);
}

/**
 * Evaluate a value that is expected to be a number, e.g. a plain number or a
 * sum such as `800 + 100`. Returns null when it is not a resolvable number.
 */
function evaluateValueToNumber(
  context: Exprs.Context,
  value: Css.Val,
): number | null {
  if (value instanceof Css.Func && isMathFunction(value)) {
    // A nested math function, e.g. the inner max() of `min(900, max(100, 800))`.
    return evaluateMathFunctionToNumber(context, value);
  }
  const evaluated = evaluateCSSToCSS(context, value, "font-weight");
  if (evaluated instanceof Css.Num) {
    return evaluated.num;
  }
  if (
    value instanceof Css.Expr ||
    value instanceof Css.Func ||
    value instanceof Css.SpaceList
  ) {
    // A calc() expression evaluates a sum or product, which a plain value
    // (e.g. a math function argument) is not parsed as.
    const asCalc = evaluateCSSToCSS(
      context,
      new Css.Func("calc", [value]),
      "font-weight",
    );
    if (asCalc instanceof Css.Num) {
      return asCalc.num;
    }
  }
  return null;
}

/**
 * Replace the clamp()/min()/max() functions of a number value with their
 * value, from the innermost one outwards, so that the expression evaluator can
 * evaluate the arithmetic expression around them.
 */
class NumberMathFunctionReducer extends Css.FilterVisitor {
  constructor(private readonly context: Exprs.Context) {
    super();
  }

  override visitFunc(func: Css.Func): Css.Val {
    const visited = super.visitFunc(func) as Css.Func;
    if (isMathFunction(visited)) {
      const num = evaluateMathFunctionToNumber(this.context, visited);
      if (num != null) {
        return new Css.Num(num);
      }
    }
    return visited;
  }
}

/**
 * Evaluate a number-valued math function of `font-weight`, e.g. the
 * `min(900, 1000)` or the `calc(650 + 50)` of a declaration, or the same value
 * of an accumulated weight. Returns null when the value does not reduce to a
 * number other than `NaN`; a number outside the range of CSS Fonts 4, which an
 * overflowing calculation such as `exp(1000)` is as well, is clamped to the
 * range. (Review)
 */
export function evaluateFontWeightMathFunction(
  context: Exprs.Context,
  value: Css.Val,
): Css.Num | null {
  if (!isSupportedFunctionValue("font-weight", value)) {
    return null;
  }
  const reduced = value.visit(new NumberMathFunctionReducer(context));
  // `evaluateValueToNumber()` also evaluates a function that is not wrapped in
  // a `calc()`, e.g. the `round(650, 100)` of a declaration, which the
  // expression evaluator resolves through the math functions of CSS Values 4.
  // (Review)
  const num = evaluateValueToNumber(context, reduced);
  if (num == null || Number.isNaN(num)) {
    return null;
  }
  // A calculation that overflows to an infinity is clamped to the range of
  // CSS Fonts 4, like any other out of range result: `font-weight: exp(1000)`
  // is 1000 for the element itself and for a detached descendant whose
  // relative keyword resolves against it. (Review)
  return new Css.Num(Math.min(1000, Math.max(1, num)));
}

function isMathFunction(func: Css.Func): boolean {
  const name = func.name.toLowerCase();
  return name === "clamp" || name === "min" || name === "max";
}

/**
 * Evaluate a clamp()/min()/max() function of lengths, e.g. the font-size
 * `clamp(1rem, 2vw + 1em, 3rem)`. Returns null when any argument cannot be
 * resolved to px.
 */
function evaluateMathFunctionToPx(
  context: Exprs.Context,
  func: Css.Func,
): number | null {
  const name = func.name.toLowerCase();
  const isClamp = name === "clamp";
  if (func.values.length === 0 || (isClamp && func.values.length !== 3)) {
    return null;
  }
  const pxValues: number[] = [];
  for (const value of func.values) {
    const px = evaluateValueToPx(context, value);
    if (px == null) {
      return null;
    }
    pxValues.push(px);
  }
  if (isClamp) {
    return Math.max(pxValues[0], Math.min(pxValues[1], pxValues[2]));
  }
  return name === "min" ? Math.min(...pxValues) : Math.max(...pxValues);
}

/**
 * Evaluate a value that is expected to be a length in px, e.g. a single
 * absolute length or a sum such as `2vw + 1em` that visitNumeric has already
 * converted to `12.85px + 16px`. Returns null when it is not a resolvable
 * absolute length.
 */
function evaluateValueToPx(
  context: Exprs.Context,
  value: Css.Val,
): number | null {
  if (value instanceof Css.Func && isMathFunction(value)) {
    // A nested math function, e.g. the inner max() of
    // `min(40px, max(1em, 20px))`.
    return evaluateMathFunctionToPx(context, value);
  }
  // A math function can be embedded in an arithmetic expression, e.g. the
  // clamp() of `calc(clamp(10px, 20px, 30px) + 5px)`. The expression evaluator
  // only supports lengths and min()/max(), so those functions are reduced to
  // their px value first.
  const reduced = value.visit(new MathFunctionReducer(context));
  const evaluated = evaluateCSSToCSS(context, reduced, "font-size");
  if (isAbsoluteLengthValue(evaluated)) {
    const numeric = evaluated as Css.Numeric;
    const px = numeric.num * Exprs.defaultUnitSizes[numeric.unit];
    // A length cannot be an infinity (an overflowing calculation is clamped
    // by the browser), and a dimension without a unit size is not a length
    // at all. (Review)
    return Number.isFinite(px) ? px : null;
  }
  if (
    reduced instanceof Css.Numeric ||
    reduced instanceof Css.Func ||
    reduced instanceof Css.SpaceList
  ) {
    // A calc() expression evaluates a sum or product, which a plain value
    // (e.g. a math function argument) is not parsed as.
    const asCalc = evaluateCSSToCSS(
      context,
      new Css.Func("calc", [reduced]),
      "font-size",
    );
    if (isAbsoluteLengthValue(asCalc)) {
      const numeric = asCalc as Css.Numeric;
      const px = numeric.num * Exprs.defaultUnitSizes[numeric.unit];
      return Number.isFinite(px) ? px : null;
    }
  }
  return null;
}

/**
 * Replace the `clamp()`/`min()`/`max()` functions of a value with their px
 * value, from the innermost one outwards, so that the expression evaluator can
 * evaluate the arithmetic expression around them.
 */
class MathFunctionReducer extends Css.FilterVisitor {
  constructor(private readonly context: Exprs.Context) {
    super();
  }

  override visitFunc(func: Css.Func): Css.Val {
    const visited = super.visitFunc(func) as Css.Func;
    if (isMathFunction(visited)) {
      const px = evaluateMathFunctionToPx(this.context, visited);
      return px != null ? new Css.Numeric(px, "px") : visited;
    }
    // The other math functions of CSS Values 4 are evaluated by the expression
    // evaluator, which the `calc()` wrapper of this helper makes reduce them:
    // a value such as the `round(40px, 7px)` of an ancestor line height must
    // not stay unresolved, or a detached descendant that resolves the `lh`
    // unit against it would use the line height of the synthetic parent. The
    // evaluation does not visit the value through this reducer again, so it
    // cannot recurse. (Review)
    const px = evaluateOtherMathFunctionToPx(this.context, visited);
    return px != null ? new Css.Numeric(px, "px") : visited;
  }
}

/**
 * Whether an expression of the expression language is a single call to a math
 * function of CSS Values 4 that returns a `<number>` whatever its arguments
 * are. The other functions keep the type of their arguments (`abs()`, `mod()`,
 * `rem()`, `round()` and the `clamp()`/`min()`/`max()` family, and `hypot()`,
 * which computes to the common type of its arguments), and this language
 * converts every dimension to a number, so the result of such a call must not
 * be materialized as a length even when its argument is one:
 * `calc(sign(20px))` is the unitless number 1, which a property that needs a
 * length, e.g. `width`, rejects. (Review)
 */
function isNumberCalculation(expr: Exprs.Val): boolean {
  return (
    expr instanceof Exprs.Call &&
    NUMBER_MATH_FUNCTION_NAMES.includes(expr.qualifiedName.toLowerCase())
  );
}

const NUMBER_MATH_FUNCTION_NAMES = ["exp", "log", "pow", "sign", "sqrt"];

/**
 * Replace the arguments of the math functions that return a `<number>`
 * whatever their arguments are with nothing, e.g. the `20px` of `sign(20px)`:
 * such a dimension belongs to a number and must not make the calculation look
 * like a length. The value is visited structurally, so the arguments of a
 * nested call, e.g. the `abs(20px)` of `2 * sign(abs(20px))`, are opaque as
 * well. (Review)
 */
class NumberFunctionArgumentRemover extends Css.FilterVisitor {
  override visitFunc(func: Css.Func): Css.Val {
    const visited = super.visitFunc(func) as Css.Func;
    return NUMBER_MATH_FUNCTION_NAMES.includes(visited.name.toLowerCase())
      ? new Css.Func(visited.name, [])
      : visited;
  }
}

/**
 * The text of a calculation in which the arguments of those functions are
 * removed, which is the text that its type is inferred from. (Review)
 */
function withoutNumberMathFunctionArguments(value: Css.Val): string {
  return value.visit(new NumberFunctionArgumentRemover()).toString();
}

/**
 * The math functions of CSS Values 4, other than `clamp()`/`min()`/`max()`,
 * that the expression evaluator evaluates. A function that is not one of them,
 * e.g. a `translate()`, is not attempted.
 */
function isOtherMathFunction(func: Css.Func): boolean {
  return OTHER_MATH_FUNCTION_NAMES.includes(func.name.toLowerCase());
}

const OTHER_MATH_FUNCTION_NAMES = [
  "abs",
  "exp",
  "hypot",
  "log",
  "mod",
  "pow",
  "rem",
  "round",
  "sign",
  "sqrt",
];

/**
 * Evaluate a math function of CSS Values 4 that is not a `clamp()`/`min()`/
 * `max()`, e.g. `round(40px, 7px)`, to px. The expression evaluator knows the
 * functions of CSS Values 4, but it needs the function to be the calculation
 * of a `calc()`. Returns null when the value does not reduce. (Review)
 */
function evaluateOtherMathFunctionToPx(
  context: Exprs.Context,
  func: Css.Func,
): number | null {
  if (!isOtherMathFunction(func)) {
    return null;
  }
  const evaluated = evaluateCSSToCSS(
    context,
    new Css.Func("calc", [func]),
    "font-size",
  );
  if (!isAbsoluteLengthValue(evaluated)) {
    return null;
  }
  const numeric = evaluated as Css.Numeric;
  return numeric.num * Exprs.defaultUnitSizes[numeric.unit];
}

function isAbsoluteLengthValue(value: Css.Val): boolean {
  return value instanceof Css.Numeric && Exprs.isAbsoluteLengthUnit(value.unit);
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

  /**
   * The font size in px that the accumulated values inherit, i.e. the font size
   * of the parent, or null when it is a value that only the browser resolves,
   * e.g. the `math` keyword or the `ch` unit. (Used by the walk to resolve the
   * `lh` unit of a computed line height. Review)
   */
  getInheritedFontSize(): number | null {
    return this.getFontSize();
  }

  private getFontSize(): number | null {
    const cascval = getProp(this.props, "font-size");
    if (!cascval) {
      // The accumulated value is removed when `initial` (e.g. `font-size:
      // initial` or `all: initial`) is processed. (Issue #1696)
      return this.context.initialFontSize;
    }
    const value = cascval.value;
    const keywordSize = resolveAbsoluteFontSizeKeyword(
      value,
      this.context.initialFontSize,
    );
    if (keywordSize != null) {
      return keywordSize;
    }
    if (!value.isNumeric()) {
      const px = resolveFontSizeValueToPx(this.context, value);
      if (px != null) {
        return px;
      }
      if (isValidUnresolvedFontSize(this.context, value)) {
        // A valid value that only the browser resolves, e.g. the `math`
        // keyword, has no size in px here: the values that depend on it are
        // left to the browser as well, which resolves them against the
        // computed size instead of the inherited fallback. (Review)
        return null;
      }
      // FIXME: cascval may be a value that cannot be resolved to a length
      // here (the relative keywords "larger"/"smaller" are resolved in
      // visitIdent, the absolute size keywords just above, and expressions
      // that depend on an unresolved var() remain).
      return Exprs.defaultUnitSizes["em"];
    }
    const n = value as Css.Numeric;
    if (!Exprs.isAbsoluteLengthUnit(n.unit)) {
      // A unit that only the browser resolves, e.g. `ch`: see above. (Review)
      return null;
    }
    // `font-size` has a non-negative computed-value range.
    return Math.max(0, n.num * Exprs.defaultUnitSizes[n.unit]);
  }

  /**
   * The line height that the `lh` unit of a `font-size` refers to: the computed
   * line height of the parent, i.e. of the value that was accumulated for the
   * parent before the font size of the current element is processed. Returns
   * null when it cannot be determined. (Issue #2174 follow-up)
   */
  /**
   * The line height in px that the accumulated values inherit, i.e. the line
   * height of the parent. A relative value among them is resolved against
   * `parentFontSize` — the font size of the parent, which the font-relative
   * units of a line height refer to — defaulting to the font size that the
   * visitor currently sees, which is the parent's while a `font-size` value is
   * processed and the current level's own when a `line-height` value is. (Used
   * by the walk to resolve the `lh` unit of a computed line height. Review)
   */
  getInheritedLineHeight(parentFontSize?: number | null): number | null {
    return this.getInheritedLineHeightUnitSize(parentFontSize);
  }

  private getInheritedLineHeightUnitSize(
    parentFontSize: number | null = this.getFontSize(),
  ): number | null {
    let value = getProp(this.props, "line-height")?.value;
    // Whether the value is a function of this engine that has been reduced to
    // a number or a length here: such a computed value is clamped to the
    // non-negative range of `line-height`, while a negative literal is invalid
    // and the browser inherits the parent line height instead. (Review)
    let computedValue = false;
    if (value instanceof Css.Numeric) {
      const unit = value.unit;
      if (
        unit !== "em" &&
        unit !== "rem" &&
        unit !== "%" &&
        unit !== "lh" &&
        unit !== "rlh" &&
        Exprs.defaultUnitSizes[unit] != null
      ) {
        // An absolute line height, e.g. `line-height: 40px`, does not depend
        // on the font size, so it is resolved before one is required: an
        // inherited font size that only the browser resolves, e.g. the `math`
        // keyword of an ancestor, must not make such a line height unknown.
        // (Review)
        return value.num * Exprs.defaultUnitSizes[unit];
      }
      if (Exprs.isViewportRelativeLengthUnit(unit)) {
        // A viewport relative line height, e.g. the `line-height: 2pvw` that a
        // detached descendant resolves an `lh` unit against, does not depend on
        // the font size either, and the unit size of the internal units is
        // known to this engine only: a declaration that the browser rejects
        // (it does not know `pv*`) must not make the basis unknown. (Review)
        return value.num * this.context.queryUnitSize(unit, false);
      }
    }
    if (parentFontSize == null) {
      // Every remaining value is relative to a font size: a number and
      // `normal` to the inherited one, `em`/`%` to the same, and `rem`/`rlh`
      // to the root ones. That font size is a value that only the browser
      // resolves here, so the line height is not known either. (Review)
      return null;
    }
    if (value instanceof Css.Expr || value instanceof Css.Func) {
      computedValue = true;
      // A computed line height, e.g. `line-height: calc(1.5 * 16px)`, which is
      // still a function while the inherited values are accumulated. A
      // percentage of it refers to the font size of the element itself, so it
      // is converted before the expression is evaluated.
      if (value instanceof Css.Func) {
        value = convertParentRelativeFontSizeUnits(
          this.context,
          value,
          parentFontSize,
        );
        // A function of unitless numbers, e.g. `min(1, 2)`, is a number rather
        // than a length: it is not reduced by the visitors below, so it is
        // resolved here, or an inherited line height would fall back to the
        // preferred one. (Review)
        const numPx = resolveUnitlessLineHeightFunctionToPx(
          this.context,
          value,
          parentFontSize,
        );
        if (numPx != null) {
          return numPx;
        }
        // `evaluateCSSToCSS()` only reduces `calc()`, so a valid math function
        // such as `line-height: min(40px, 2em)` must be reduced to its px value
        // here: otherwise an inherited line height falls back to the preferred
        // line height for a detached descendant that resolves an `lh` unit. An
        // `lh` unit of this value refers to the line height of the level above,
        // which is not known here, so such a value is left unresolved instead
        // of using the placeholder size of the unit. (Review)
        if (!usesLineHeightUnit(value)) {
          value = value.visit(new MathFunctionReducer(this.context));
        }
      }
      value = evaluateCSSToCSS(this.context, value, "line-height");
    }
    // A computed value that is below zero is clamped, as `line-height` has a
    // non-negative computed-value range: `min(-10px, -20px)` is 0, and a
    // detached descendant that resolves an `lh` unit against it must use that
    // zero rather than the -20px of the calculation. (Review)
    const clampComputed = (lineHeight: number): number =>
      computedValue ? Math.max(0, lineHeight) : lineHeight;
    if (value instanceof Css.Num) {
      // A number that is not finite cannot be a line height: it is left
      // unknown instead of propagating an infinity into the `lh` unit.
      // (Review)
      return Number.isFinite(value.num)
        ? clampComputed(value.num * parentFontSize)
        : null;
    }
    if (value instanceof Css.Numeric) {
      switch (value.unit) {
        case "em":
        case "%":
          return clampComputed(
            (value.unit === "%" ? value.num / 100 : value.num) * parentFontSize,
          );
        case "lh":
        case "rlh":
          // The line height of the parent is relative to the line height of the
          // parent of the parent, which is not accumulated here.
          return null;
        default: {
          const unitSize = Exprs.defaultUnitSizes[value.unit];
          if (unitSize) {
            return clampComputed(value.num * unitSize);
          }
          const ratio = browserFontRelativeUnitRatio(value.unit);
          // A unit that only the browser resolves, e.g. the `ch` of
          // `line-height: 5ch`, has no unit size here: the assumption of CSS
          // Values 4 is used against the font size of the element, as the root
          // sizing does, so that a detached descendant that resolves an `lh`
          // unit against such a line height does not fall back to the root
          // line height. (Review)
          return ratio != null
            ? clampComputed(value.num * ratio * parentFontSize)
            : null;
        }
      }
    }
    // No line-height or `normal`: the multiplier of the preferred line height.
    return this.context.pref.lineHeight * parentFontSize;
  }

  private getFontWeight(): number {
    // The accumulated value is the inherited (parent's) font weight, or the
    // initial value 400 when no ancestor declared font-weight.
    const cascval = getProp(this.props, "font-weight");
    let value = cascval?.value;
    if (value instanceof Css.Expr || value instanceof Css.Func) {
      // `font-weight` also accepts a function, e.g. `calc(650)` or
      // `min(900, 1000)`, which `evaluateCSSToCSS()` alone does not reduce.
      value =
        evaluateFontWeightMathFunction(this.context, value) ??
        evaluateCSSToCSS(this.context, value, "font-weight");
    }
    if (value instanceof Css.Num) {
      // A number outside the range of CSS Fonts 4, e.g. one that a var()
      // substitution put into the declaration, is invalid: the element inherits
      // the parent font weight, so it must not become the base of a relative
      // keyword. (Review)
      return isValidFontWeight(value.num) ? value.num : 400;
    }
    if (value && hasKeywordName(value, "bold")) {
      return 700;
    }
    return 400;
  }

  override visitNumeric(numeric: Css.Numeric): Css.Val {
    if (this.propName === "font-size") {
      const parentFontSize = this.getFontSize();
      if (
        parentFontSize == null &&
        (numeric.unit === "em" || numeric.unit === "%")
      ) {
        // The value is relative to an inherited font size that only the
        // browser resolves, so it is preserved as it is and resolved by the
        // browser in the same context. (Review)
        return numeric;
      }
      return convertFontSizeToPx(
        numeric,
        parentFontSize,
        this.context,
        this.getInheritedLineHeightUnitSize(),
      );
    } else if (
      numeric.unit === "em" ||
      numeric.unit === "rem" ||
      numeric.unit === "lh" ||
      numeric.unit === "rlh"
    ) {
      const parentFontSize = this.getFontSize();
      if (parentFontSize == null && numeric.unit === "em") {
        // As above: the `em` unit of a dependent property must not be
        // resolved against the inherited fallback when the element's own font
        // size is a value that only the browser resolves. (Review)
        return numeric;
      }
      return convertFontRelativeLengthToPx(
        numeric,
        parentFontSize ?? 0,
        this.context,
      );
    }
    return numeric;
  }

  override visitIdent(ident: Css.Ident): Css.Val {
    if (this.propName === "font-size") {
      // Resolve the absolute size keywords (e.g. "small") against the default
      // font size, and the relative keywords "larger"/"smaller" against the
      // inherited font size, to numeric computed values, so that detached
      // content (footnotes, page floats, running elements) and the root's
      // inherited properties are not re-resolved per level. (Issue #2174)
      const keywordSize = resolveAbsoluteFontSizeKeyword(
        ident,
        this.context.initialFontSize,
      );
      if (keywordSize != null) {
        return new Css.Numeric(keywordSize, "px");
      }
      if (hasKeywordName(ident, "larger") || hasKeywordName(ident, "smaller")) {
        const parentFontSize = this.getFontSize();
        if (parentFontSize != null) {
          return new Css.Numeric(
            resolveRelativeFontSizeKeyword(ident, parentFontSize),
            "px",
          );
        }
        // The inherited font size is a value that only the browser resolves:
        // the keyword is preserved and resolved by the browser against its
        // own computed size. (Review)
      }
      if (hasKeywordName(ident, "math")) {
        // The math font size depends on the mathematical context of the
        // element: it is 1em of the inherited font size for the depths that
        // this engine represents, which is the value of a depth 0 element, so
        // it is resolved like `1em` and a detached element uses the font size
        // of its source parent instead of the one of the synthetic parent that
        // the browser would resolve the keyword in after the element is
        // reparented. A well formed MathML document keeps that meaning: the
        // `math` keyword of the `math` element is depth 0, and the deeper
        // elements take their scaling from the user agent stylesheet
        // (`math-depth: add(1)`), which this cascade does not see, so they are
        // resolved by the browser against the font size that is resolved here
        // (measured: an exponent of a footnote is 0.71em of its base, like its
        // inline reference). A `math` that an author declares on an element of
        // a deeper depth is the one case that is not modelled here: the
        // materialized 1em makes a relative value of a detached descendant
        // larger than the browser would compute it (measured: a footnote
        // inside an element whose `font-size: math` has
        // `math-depth: add(1)` is 64px, twice the 1em of 32px, instead of the
        // 45.4px that the browser computes from the 22.7px). `math-depth` is
        // not supported by this engine. (Review)
        const parentFontSize = this.getFontSize();
        if (parentFontSize != null) {
          return new Css.Numeric(parentFontSize, "px");
        }
      }
    } else if (this.propName === "font-weight") {
      if (hasKeywordName(ident, "bolder") || hasKeywordName(ident, "lighter")) {
        return new Css.Int(
          resolveRelativeFontWeight(ident, this.getFontWeight()),
        );
      }
    }
    return ident;
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
  parentFontSize: number | null,
  context: Exprs.Context,
  inheritedLineHeight?: number | null,
): Css.Numeric {
  // FIXME: This fallback to 0 is obviously an invalid value. A null arrives
  // from reading back the computed style of an element whose view is detached
  // from the document, as found in these files of the layout regression corpus:
  // - footnotes/footnotes-anywhere.html
  // - footnotes/footnotes-in-table.html
  // - footnotes/footnotes-in-table-2.html
  // - footnotes/footnotes-in-table-rowspan-colspan.html
  // In these documents the detachment is Container.clear() in
  // AttachedPageFloatLayoutContext.invalidate(). That trial is discarded. The
  // real DOM is built again while attached to the document, and the invalid
  // value does not reach the rendered result.
  if (numeric.unit === "lh" && inheritedLineHeight != null) {
    // For `font-size`, the `lh` unit refers to the computed line height of the
    // parent. (Issue #2174 follow-up)
    return new Css.Numeric(numeric.num * inheritedLineHeight, "px");
  }
  numeric = convertFontRelativeLengthToPx(
    numeric,
    parentFontSize ?? 0,
    context,
  );
  const unit = numeric.unit;
  const num = numeric.num;
  if (unit === "px") {
    return numeric;
  } else if (unit === "%") {
    return new Css.Numeric((num / 100) * (parentFontSize ?? 0), "px");
  } else {
    const unitSize = context.queryUnitSize(unit, false);
    if (Number.isFinite(unitSize)) {
      return new Css.Numeric(num * unitSize, "px");
    }
    // A unit that only the browser resolves, e.g. `ch`: it would be resolved
    // against the font metrics of the element, which for detached content are
    // the ones of the source parent, so the value must not be left to the
    // browser, which would resolve it against the synthetic parent it is
    // rendered in. The metric is not obtainable here, so the assumption of CSS
    // Values 4 for such a unit is used with the parent font size. (Review)
    const ratio = browserFontRelativeUnitRatio(unit);
    if (ratio != null && parentFontSize != null) {
      return new Css.Numeric(num * ratio * parentFontSize, "px");
    }
    return numeric;
  }
}

export type ActionTable = Map<string, CascadeAction>;

export class StyledCascadeInstance {
  constructor(
    public readonly instance: CascadeInstance,
    public readonly currentStyle: ElementStyle,
    public readonly currentClassNames: string[],
    public readonly currentEpubTypes: string[],
  ) {}
}

export class ElementCascadeInstance extends StyledCascadeInstance {
  constructor(
    instance: CascadeInstance,
    currentStyle: ElementStyle,
    currentClassNames: string[],
    currentEpubTypes: string[],
    public readonly currentElement: Base.ChildElement,
  ) {
    super(instance, currentStyle, currentClassNames, currentEpubTypes);
  }
}

export class CascadeAction {
  apply(cascadeInstance: StyledCascadeInstance): void {}

  mergeWith(other: CascadeAction): CascadeAction {
    return new CompoundAction([this, other]);
  }
}

export class ConditionItemAction extends CascadeAction {
  constructor(public readonly conditionItem: ConditionItem) {
    super();
  }

  override apply(cascadeInstance: StyledCascadeInstance): void {
    cascadeInstance.instance.pushConditionItem(
      this.conditionItem.fresh(cascadeInstance.instance),
    );
  }
}

export class CompoundAction extends CascadeAction {
  constructor(public readonly list: CascadeAction[]) {
    super();
  }

  override apply(cascadeInstance: StyledCascadeInstance): void {
    for (let i = 0; i < this.list.length; i++) {
      this.list[i].apply(cascadeInstance);
    }
  }

  override mergeWith(other: CascadeAction): CascadeAction {
    this.list.push(other);
    return this;
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

  override apply(cascadeInstance: StyledCascadeInstance): void {
    mergeIn(
      cascadeInstance.instance.context,
      cascadeInstance.currentStyle,
      this.style,
      this.specificity,
      this.pseudoelement,
      this.regionId,
      cascadeInstance.instance.buildViewConditionMatcher(this.viewConditionId),
      cascadeInstance.instance.mergeValidatorSet,
    );
  }
}

export type PrimarySlot = {
  table: ActionTable;
  key: string;
};

export abstract class ChainedAction {
  abstract matches(cascadeInstance: StyledCascadeInstance): boolean;

  getPriority(): number {
    return 0;
  }

  primarySlot(cascade: Cascade): PrimarySlot | null {
    // cannot be made primary
    return null;
  }

  wire(chained: CascadeAction): WiredAction {
    return new WiredGuard(this, chained);
  }
}

export abstract class WiredAction<
  T extends ChainedAction = ChainedAction,
> extends CascadeAction {
  constructor(
    protected readonly condition: T,
    protected readonly chained: CascadeAction,
  ) {
    super();
  }

  abstract override apply(cascadeInstance: StyledCascadeInstance): void;

  makePrimary(cascade: Cascade): boolean {
    const slot = this.condition.primarySlot(cascade);
    if (slot) {
      cascade.insertInTable(slot.table, slot.key, this.chained);
      return true;
    }
    return false;
  }
}

export class WiredGuard extends WiredAction {
  override apply(cascadeInstance: StyledCascadeInstance): void {
    if (this.condition.matches(cascadeInstance)) {
      this.chained.apply(cascadeInstance);
    }
  }
}

export class WiredConditionScope extends WiredAction<CheckConditionAction> {
  override apply(cascadeInstance: StyledCascadeInstance): void {
    if (this.condition.matches(cascadeInstance)) {
      cascadeInstance.instance.dependentConditions.push(
        this.condition.condition,
      );
      try {
        this.chained.apply(cascadeInstance);
      } finally {
        cascadeInstance.instance.dependentConditions.pop();
      }
    }
  }
}

export class CheckClassAction extends ChainedAction {
  constructor(public readonly className: string) {
    super();
  }

  override matches(cascadeInstance: StyledCascadeInstance): boolean {
    return cascadeInstance.currentClassNames.includes(this.className);
  }

  override getPriority(): number {
    return 10;
  }
  // class should be checked after id

  override primarySlot(cascade: Cascade): PrimarySlot | null {
    return { table: cascade.classes, key: this.className };
  }
}

export class CheckIdAction extends ChainedAction {
  constructor(public readonly id: string) {
    super();
  }

  override matches(cascadeInstance: StyledCascadeInstance): boolean {
    return (
      cascadeInstance.instance.currentId == this.id ||
      cascadeInstance.instance.currentXmlId == this.id
    );
  }

  override getPriority(): number {
    return 11;
  }
  // id should be checked after :root

  override primarySlot(cascade: Cascade): PrimarySlot | null {
    return { table: cascade.ids, key: this.id };
  }
}

export class CheckLocalNameAction extends ChainedAction {
  constructor(public readonly localName: string) {
    super();
  }

  override matches(cascadeInstance: StyledCascadeInstance): boolean {
    return cascadeInstance.instance.currentLocalName == this.localName;
  }

  override getPriority(): number {
    return 8;
  }
  // tag is a pretty good thing to check, after epub:type

  override primarySlot(cascade: Cascade): PrimarySlot | null {
    return { table: cascade.tags, key: this.localName };
  }
}

export class CheckNSTagAction extends ChainedAction {
  constructor(
    public readonly ns: string,
    public readonly localName: string,
  ) {
    super();
  }

  override matches(cascadeInstance: StyledCascadeInstance): boolean {
    return (
      cascadeInstance.instance.currentLocalName == this.localName &&
      cascadeInstance.instance.currentNamespace == this.ns
    );
  }

  override getPriority(): number {
    return 8;
  }
  // tag is a pretty good thing to check, after epub:type

  override primarySlot(cascade: Cascade): PrimarySlot | null {
    let prefix = cascade.nsPrefix.get(this.ns);
    if (!prefix) {
      prefix = `ns${cascade.nsCount++}:`;
      cascade.nsPrefix.set(this.ns, prefix);
    }
    return { table: cascade.nstags, key: prefix + this.localName };
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

  override matches(cascadeInstance: ElementCascadeInstance): boolean {
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
            return true;
          }
        }
      }
    }
    return false;
  }
}

export class CheckNamespaceAction extends ChainedAction {
  constructor(public readonly ns: string) {
    super();
  }

  override matches(cascadeInstance: StyledCascadeInstance): boolean {
    return cascadeInstance.instance.currentNamespace == this.ns;
  }
}

function checkAttribute(
  element: Element,
  ns: string | null,
  name: string,
  pred: (attribute: Attr) => boolean,
): boolean {
  if (!element) {
    return false;
  }
  const htmlAttributeNamesAreCaseInsensitive =
    element.ownerDocument?.contentType === "text/html";
  const selectorName = htmlAttributeNamesAreCaseInsensitive
    ? asciiLowerCase(name)
    : name;
  if (ns !== null) {
    const attribute = element.getAttributeNodeNS(ns || null, selectorName);
    return !!attribute && pred(attribute);
  }
  for (const attribute of Array.from(element.attributes)) {
    const attributeName = htmlAttributeNamesAreCaseInsensitive
      ? asciiLowerCase(attribute.localName)
      : attribute.localName;
    if (attributeName === selectorName && pred(attribute)) {
      return true;
    }
  }
  return false;
}

function asciiLowerCase(value: string): string {
  return value.replace(/[A-Z]/g, (char) => char.toLowerCase());
}

function isAttributeValueCaseInsensitive(
  caseSensitivity: CssParser.AttributeSelectorCaseSensitivity,
): boolean {
  return caseSensitivity === "i";
}

function escapeRegExpForAttributeValue(
  value: string,
  caseSensitivity: CssParser.AttributeSelectorCaseSensitivity,
): string {
  return Array.from(value, (char) => {
    const escapedChar = Base.escapeRegExp(char);
    if (!isAttributeValueCaseInsensitive(caseSensitivity)) {
      return escapedChar;
    }
    const lowerChar = asciiLowerCase(char);
    const upperChar = lowerChar.toUpperCase();
    if (lowerChar !== upperChar && /^[a-z]$/i.test(char)) {
      return `[${lowerChar}${upperChar}]`;
    }
    return escapedChar;
  }).join("");
}

function createAttributeValueRegExp(pattern: string): RegExp {
  return new RegExp(pattern);
}

function attributeValueEquals(
  actualValue: string,
  expectedValue: string,
  caseSensitivity: CssParser.AttributeSelectorCaseSensitivity,
): boolean {
  if (isAttributeValueCaseInsensitive(caseSensitivity)) {
    return asciiLowerCase(actualValue) === asciiLowerCase(expectedValue);
  }
  return actualValue === expectedValue;
}

export class CheckAttributePresentAction extends ChainedAction {
  constructor(
    public readonly ns: string | null,
    public readonly name: string,
  ) {
    super();
  }

  override matches(cascadeInstance: ElementCascadeInstance): boolean {
    return checkAttribute(
      cascadeInstance.currentElement,
      this.ns,
      this.name,
      () => true,
    );
  }
}

export class CheckAttributeEqAction extends ChainedAction {
  constructor(
    public readonly ns: string | null,
    public readonly name: string,
    public readonly value: string,
    public readonly caseSensitivity: CssParser.AttributeSelectorCaseSensitivity = null,
  ) {
    super();
  }

  override matches(cascadeInstance: ElementCascadeInstance): boolean {
    return checkAttribute(
      cascadeInstance.currentElement,
      this.ns,
      this.name,
      (attribute) =>
        attributeValueEquals(attribute.value, this.value, this.caseSensitivity),
    );
  }

  override getPriority(): number {
    if (this.name == "type" && this.ns == Base.NS.epub) {
      return 9; // epub:type is a pretty good thing to check
    }
    return 0;
  }

  override primarySlot(cascade: Cascade): PrimarySlot | null {
    if (this.name == "type" && this.ns == Base.NS.epub) {
      return { table: cascade.epubtypes, key: this.value };
    }
    return null;
  }
}

export class CheckNamespaceSupportedAction extends ChainedAction {
  constructor(
    public readonly ns: string | null,
    public readonly name: string,
  ) {
    super();
  }

  override matches(cascadeInstance: ElementCascadeInstance): boolean {
    return checkAttribute(
      cascadeInstance.currentElement,
      this.ns,
      this.name,
      (attribute) => !!supportedNamespaces[attribute.value],
    );
  }

  override getPriority(): number {
    return 0;
  }

  override primarySlot(cascade: Cascade): PrimarySlot | null {
    return null;
  }
}

export class CheckAttributeRegExpAction extends ChainedAction {
  constructor(
    public readonly ns: string | null,
    public readonly name: string,
    public readonly regexp: RegExp,
    public readonly caseSensitivity: CssParser.AttributeSelectorCaseSensitivity = null,
  ) {
    super();
  }

  override matches(cascadeInstance: ElementCascadeInstance): boolean {
    return checkAttribute(
      cascadeInstance.currentElement,
      this.ns,
      this.name,
      (attribute) => !!attribute.value.match(this.regexp),
    );
  }
}

export class CheckLangAction extends ChainedAction {
  constructor(public readonly langRegExp: RegExp) {
    super();
  }

  override matches(cascadeInstance: StyledCascadeInstance): boolean {
    return !!cascadeInstance.instance.lang.match(this.langRegExp);
  }
}

export class IsFirstAction extends ChainedAction {
  constructor() {
    super();
  }

  override matches(cascadeInstance: StyledCascadeInstance): boolean {
    return cascadeInstance.instance.isFirst;
  }

  override getPriority(): number {
    return 6;
  }
}

export class IsRootAction extends ChainedAction {
  constructor() {
    super();
  }

  override matches(cascadeInstance: StyledCascadeInstance): boolean {
    return cascadeInstance.instance.isRoot;
  }

  override getPriority(): number {
    return 12; // :root is the first thing to check
  }
}

export abstract class IsNthAction extends ChainedAction {
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

  override matches(cascadeInstance: StyledCascadeInstance): boolean {
    return this.matchANPlusB(cascadeInstance.instance.currentSiblingOrder);
  }

  override getPriority(): number {
    return 5;
  }
}

export type SiblingTypeCounts = {
  byNamespace: { [ns: string]: { [localName: string]: number } };
  noNamespace: { [localName: string]: number } | null;
};

function emptySiblingTypeCounts(): SiblingTypeCounts {
  return { byNamespace: {}, noNamespace: null };
}

function typeCountsForNamespace(
  counts: SiblingTypeCounts,
  ns: string | null,
): { [localName: string]: number } {
  let nsCounts = ns !== null ? counts.byNamespace[ns] : counts.noNamespace;
  if (!nsCounts) {
    nsCounts = {};
    if (ns !== null) {
      counts.byNamespace[ns] = nsCounts;
    } else {
      counts.noNamespace = nsCounts;
    }
  }
  return nsCounts;
}

export class IsNthSiblingOfTypeAction extends IsNthAction {
  constructor(a: number, b: number) {
    super(a, b);
  }

  override matches(cascadeInstance: StyledCascadeInstance): boolean {
    const order = typeCountsForNamespace(
      cascadeInstance.instance.currentSiblingTypeCounts,
      cascadeInstance.instance.currentNamespace,
    )[cascadeInstance.instance.currentLocalName];
    return this.matchANPlusB(order);
  }

  override getPriority(): number {
    return 5;
  }
}

export class IsNthLastSiblingAction extends IsNthAction {
  constructor(a: number, b: number) {
    super(a, b);
  }

  override matches(cascadeInstance: ElementCascadeInstance): boolean {
    let order = cascadeInstance.instance.currentFollowingSiblingOrder;
    if (order === null) {
      order = cascadeInstance.instance.currentFollowingSiblingOrder =
        cascadeInstance.currentElement.parentNode.childElementCount -
        cascadeInstance.instance.currentSiblingOrder +
        1;
    }
    return this.matchANPlusB(order);
  }

  override getPriority(): number {
    return 4;
  }
}

export class IsNthLastSiblingOfTypeAction extends IsNthAction {
  constructor(a: number, b: number) {
    super(a, b);
  }

  override matches(cascadeInstance: ElementCascadeInstance): boolean {
    const counts = cascadeInstance.instance.currentFollowingSiblingTypeCounts;
    let nsCounts =
      cascadeInstance.instance.currentNamespace !== null
        ? counts.byNamespace[cascadeInstance.instance.currentNamespace]
        : counts.noNamespace;
    if (!nsCounts) {
      let elem: Base.ChildElement | null = cascadeInstance.currentElement;
      do {
        const ns = elem.namespaceURI;
        const localName = elem.localName;
        const elemCounts = typeCountsForNamespace(counts, ns);
        elemCounts[localName] = (elemCounts[localName] || 0) + 1;
      } while ((elem = Base.nextElementSiblingOf(elem)));
      nsCounts = typeCountsForNamespace(
        counts,
        cascadeInstance.instance.currentNamespace,
      );
    }
    return this.matchANPlusB(
      nsCounts[cascadeInstance.instance.currentLocalName],
    );
  }

  override getPriority(): number {
    return 4;
  }
}

export class IsEmptyAction extends ChainedAction {
  constructor() {
    super();
  }

  override matches(cascadeInstance: ElementCascadeInstance): boolean {
    let node: Node | null = cascadeInstance.currentElement.firstChild;
    while (node) {
      switch (node.nodeType) {
        case Node.ELEMENT_NODE:
          return false;
        case Node.TEXT_NODE:
          if ((node as Text).length > 0) {
            return false;
          }
      }
      node = node.nextSibling;
    }
    return true;
  }

  override getPriority(): number {
    return 4;
  }
}

export class IsEnabledAction extends ChainedAction {
  constructor() {
    super();
  }

  override matches(cascadeInstance: ElementCascadeInstance): boolean {
    const elem = cascadeInstance.currentElement;
    return (elem as any).disabled === false;
  }

  override getPriority(): number {
    return 5;
  }
}

export class IsDisabledAction extends ChainedAction {
  constructor() {
    super();
  }

  override matches(cascadeInstance: ElementCascadeInstance): boolean {
    const elem = cascadeInstance.currentElement;
    return (elem as any).disabled === true;
  }

  override getPriority(): number {
    return 5;
  }
}

export class IsCheckedAction extends ChainedAction {
  constructor() {
    super();
  }

  override matches(cascadeInstance: ElementCascadeInstance): boolean {
    const elem = cascadeInstance.currentElement;
    return (elem as any).selected === true || (elem as any).checked === true;
  }

  override getPriority(): number {
    return 5;
  }
}

export class MatchesNativeSelectorAction extends ChainedAction {
  constructor(public readonly selector: string) {
    super();
  }

  override matches(cascadeInstance: ElementCascadeInstance): boolean {
    const element = cascadeInstance.currentElement;
    try {
      return !!element && element.matches(this.selector);
    } catch {
      return false;
    }
  }
}

export class CheckConditionAction extends ChainedAction {
  constructor(public readonly condition: string) {
    super();
  }

  override matches(cascadeInstance: StyledCascadeInstance): boolean {
    return !!cascadeInstance.instance.conditions.get(this.condition);
  }

  override wire(chained: CascadeAction): WiredAction {
    return new WiredConditionScope(this, chained);
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

  override apply(cascadeInstance: StyledCascadeInstance): void {
    this.applied = true;
  }
}

/**
 * Cascade Action for :is() and similar pseudo-classes
 */
export class MatchesAction extends ChainedAction {
  checkAppliedAction: CheckAppliedAction;
  firstActions: CascadeAction[] = [];
  readonly priority: number;

  constructor(chains: ChainedAction[][]) {
    super();
    this.checkAppliedAction = new CheckAppliedAction();
    this.priority = Math.max(
      ...chains.map((chain) =>
        chain.length > 0
          ? Math.max(...chain.map((action) => action.getPriority()))
          : 0,
      ),
    );
    for (const chain of chains) {
      this.firstActions.push(chainActions(chain, this.checkAppliedAction));
    }
  }

  override matches(cascadeInstance: ElementCascadeInstance): boolean {
    for (const firstAction of this.firstActions) {
      firstAction.apply(cascadeInstance);
      if (this.checkAppliedAction.applied) {
        break;
      }
    }
    const applied = this.checkAppliedAction.applied;
    this.checkAppliedAction.applied = false;
    return applied === this.positive();
  }

  override getPriority(): number {
    return this.priority;
  }

  positive(): boolean {
    return true;
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

  override matches(cascadeInstance: ElementCascadeInstance): boolean {
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
      } catch {}
    }
    const applied = this.checkAppliedAction.applied;
    this.checkAppliedAction.applied = false;
    return applied;
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

  override matches(cascadeInstance: ElementCascadeInstance): boolean {
    // Check if current element matches the selector
    for (const firstAction of this.firstActions) {
      firstAction.apply(cascadeInstance);
      if (this.checkAppliedAction.applied) {
        break;
      }
    }
    if (!this.checkAppliedAction.applied) {
      return false; // Element doesn't match selector, so :nth-child(of S) doesn't match
    }
    this.checkAppliedAction.applied = false;

    // Count siblings that match the selector
    const elem = cascadeInstance.currentElement;
    let order = 1;
    let sibling = Base.previousElementSiblingOf(elem);
    while (sibling) {
      if (this.matchesSelector(sibling, cascadeInstance)) {
        order++;
      }
      sibling = Base.previousElementSiblingOf(sibling);
    }

    return this.matchANPlusB(order);
  }

  protected matchesSelector(
    element: Base.ChildElement,
    cascadeInstance: ElementCascadeInstance,
  ): boolean {
    const instance = cascadeInstance.instance;
    // Temporarily save and restore cascade state to test against sibling
    const savedNS = instance.currentNamespace;
    const savedLocalName = instance.currentLocalName;
    const savedId = instance.currentId;
    const savedSiblingOrder = instance.currentSiblingOrder;

    instance.currentNamespace = element.namespaceURI;
    instance.currentLocalName = element.localName;
    instance.currentId = element.getAttribute("id");

    // Calculate sibling order for the element
    let siblingOrder = 1;
    let sib = element.previousElementSibling;
    while (sib) {
      siblingOrder++;
      sib = sib.previousElementSibling;
    }
    instance.currentSiblingOrder = siblingOrder;

    const siblingCascadeInstance = new ElementCascadeInstance(
      instance,
      cascadeInstance.currentStyle,
      element.classList ? Array.from(element.classList) : [],
      cascadeInstance.currentEpubTypes,
      element,
    );
    for (const firstAction of this.firstActions) {
      firstAction.apply(siblingCascadeInstance);
      if (this.checkAppliedAction.applied) {
        break;
      }
    }
    const matched = this.checkAppliedAction.applied;
    this.checkAppliedAction.applied = false;

    // Restore cascade state
    instance.currentNamespace = savedNS;
    instance.currentLocalName = savedLocalName;
    instance.currentId = savedId;
    instance.currentSiblingOrder = savedSiblingOrder;

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

  override matches(cascadeInstance: ElementCascadeInstance): boolean {
    // Check if current element matches the selector
    for (const firstAction of this.firstActions) {
      firstAction.apply(cascadeInstance);
      if (this.checkAppliedAction.applied) {
        break;
      }
    }
    if (!this.checkAppliedAction.applied) {
      return false; // Element doesn't match selector, so :nth-last-child(of S) doesn't match
    }
    this.checkAppliedAction.applied = false;

    // Count siblings (from end) that match the selector
    const elem = cascadeInstance.currentElement;
    let order = 1;
    let sibling = Base.nextElementSiblingOf(elem);
    while (sibling) {
      if (this.matchesSelector(sibling, cascadeInstance)) {
        order++;
      }
      sibling = Base.nextElementSiblingOf(sibling);
    }

    return this.matchANPlusB(order);
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
    public readonly viewCondition: Matchers.Matcher | null,
  ) {}

  increment(cascadeInstance: CascadeInstance) {
    cascadeInstance.increment(this.condition, this.viewCondition);
  }

  decrement(cascadeInstance: CascadeInstance) {
    cascadeInstance.decrement(this.condition, this.viewCondition);
  }

  buildViewConditionMatcher(
    cascadeInstance: CascadeInstance,
  ): Matchers.Matcher | null {
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
    viewCondition: Matchers.Matcher | null,
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
    viewCondition: Matchers.Matcher | null,
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
    viewCondition: Matchers.Matcher | null,
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
    viewCondition: Matchers.Matcher | null,
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
    public readonly elementStyle: ElementStyle,
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
      cascadeInstance.processPseudoelementProps(
        this.afterprop,
        this.element,
        this.elementStyle,
      );
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
  readonly rootScope: Exprs.LexicalScope;
  readonly pageScope: Exprs.LexicalScope;

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
    stringValue: string | Css.Val,
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
  hadAttrFunction = false;

  constructor(
    public element: Element,
    private readonly scope: Exprs.LexicalScope,
    private readonly propName: string,
    private readonly validatorSet: CssValidator.ValidatorSet,
  ) {
    super();
  }

  validatePropertyValue(value: Css.Val): Css.Val {
    if (Css.isDefaultingValue(value)) {
      return value;
    }
    const validator = this.validatorSet.validators.get(this.propName);
    if (validator) {
      return value.visit(validator) ?? Css.ident.unset;
    }
    if (!this.propName || CSS.supports(this.propName, value.toString())) {
      return value;
    }
    return Css.ident.unset;
  }

  override visitFunc(func: Css.Func): Css.Val {
    if (func.name.toLowerCase() !== "attr") {
      return super.visitFunc(func);
    }
    this.hadAttrFunction = true;
    const attr = CssValidator.parseAttrFunction(func);
    if (!attr) {
      return super.visitFunc(func);
    }

    const fallback = (
      attr.fallback ?? CssValidator.getImplicitAttrFallback(attr.type)
    ).visit(this);

    if (!this.element || !this.element.hasAttribute(attr.attributeName)) {
      return fallback;
    }

    const value = CssValidator.parseAttrValue(
      this.scope,
      this.element.getAttribute(attr.attributeName),
      attr.type,
    );
    if (!value) {
      return fallback;
    }
    return value;
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

/**
 * Returns true if the value contains a page-based counter expression
 * (`counter(page)` / `counter(pages)` or a counter that is page-controlled).
 * Such values must be kept as a content list so the counters are resolved per
 * page and patched with the final page count (Issue #1997).
 */
function containsPageCounter(val: Css.Val): boolean {
  if (val instanceof Css.Expr) {
    const ex = val.expr;
    return ex instanceof Exprs.Native && /^page-counters?-/.test(ex.str);
  }
  if (val instanceof Css.SpaceList || val instanceof Css.CommaList) {
    return val.values.some((v) => containsPageCounter(v));
  }
  return false;
}

/**
 * Build the deferred content list stored for a `string-set` value that
 * contains page-based counters (Issue #1997). Only the page-based counter
 * expressions are kept deferred (so they can be resolved per page and patched
 * with the final page count); every other part is stringified up front using
 * the same rules as the non-deferred path (`getStringValueFromCssContentVal`),
 * which ignores non-string content such as `url()`. This keeps `string()`
 * behaving like plain string-set stringification instead of injecting images
 * or other replaced content.
 */
function buildDeferredStringSetVal(
  val: Css.Val,
  context?: Exprs.Context,
): Css.Val {
  if (!containsPageCounter(val)) {
    return new Css.Str(getStringValueFromCssContentVal(val, context));
  }
  if (val instanceof Css.SpaceList) {
    return new Css.SpaceList(
      val.values.map((v) => buildDeferredStringSetVal(v, context)),
    );
  }
  if (val instanceof Css.CommaList) {
    return new Css.CommaList(
      val.values.map((v) => buildDeferredStringSetVal(v, context)),
    );
  }
  // A page-based counter expression: keep it deferred.
  return val;
}

export class ContentPropVisitor extends Css.FilterVisitor {
  constructor(
    public cascade: CascadeInstance,
    public element: Element | null,
    public readonly counterResolver: CounterResolver,
    private readonly elementStyle: ElementStyle,
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

  private hasLocalCounterResetOrSet(counterName: string): boolean {
    return (
      this.hasLocalCounter(counterName, "counter-reset", { reset: true }) ||
      this.hasLocalCounter(counterName, "counter-set", { defaultValue: 0 })
    );
  }

  private hasLocalCounterIncrement(counterName: string): boolean {
    return this.hasLocalCounter(counterName, "counter-increment", {});
  }

  private hasLocalCounter(
    counterName: string,
    propName: "counter-reset" | "counter-set" | "counter-increment",
    options: { reset?: boolean; defaultValue?: number },
  ): boolean {
    const cascVal = this.elementStyle[propName] as CascadeValue;
    if (!cascVal) {
      return false;
    }
    const value = cascVal.evaluate(this.cascade.context);
    if (!value || Css.isDefaultingValue(value)) {
      return false;
    }
    const counters = CssProp.toCounters(value, options);
    return Object.hasOwn(counters, counterName);
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
    const last = values.length ? values.at(-1) : 0;
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
    localCounterResetOrSet: boolean = false,
    localCounterIncrement: boolean = false,
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
    const counterValuesEqual = (a: number[], b: number[]): boolean => {
      return (
        a.length === b.length && a.every((value, index) => value === b[index])
      );
    };
    if (this.pseudoName === "footnote-call" && this.element) {
      const storedDuplicateSemanticFootnoteCounter =
        getDuplicateSemanticFootnoteCounterValues(this.element, counterName);
      if (storedDuplicateSemanticFootnoteCounter) {
        return formatCounterValues(storedDuplicateSemanticFootnoteCounter);
      }
    }
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
      // Issue #1999: a page or margin-box local reset/set shadows the page
      // counter state while resolving this generated content.
      if (localCounterResetOrSet && cascadeDocCounters.length) {
        counterValues = cascadeDocCounters;
        storeFootnoteCounterValuesIfNeeded(counterValues);
        return formatCounterValues(counterValues);
      }
      if (
        store.isPageControlledCounter?.(counterName) &&
        localCounterIncrement &&
        cascadeDocCounters.length
      ) {
        // Issue #1999: increment-only inside page/margin-box content is a
        // delta from the page-start counter value, not a fresh local counter.
        const pageCounters = store.currentPageCounters?.[counterName] || [];
        const pageStartVal = pageCounters.length ? pageCounters.at(-1) : 0;
        counterValues = [pageStartVal + cascadeDocCounters.at(-1)];
        storeFootnoteCounterValuesIfNeeded(counterValues);
        return formatCounterValues(counterValues);
      }
      if (!store.isPageControlledCounter?.(counterName)) {
        const pageCounters = store.currentPageCounters?.[counterName] || [];
        if (pageCounters.length) {
          counterValues = pageCounters;
          storeFootnoteCounterValuesIfNeeded(counterValues);
          return formatCounterValues(counterValues);
        }
      }
    }

    const pageDocCounters = store.currentPageDocCounters?.[counterName] || [];
    const useLocalPageCounters =
      !this.element &&
      cascadeDocCounters.length &&
      !counterValuesEqual(cascadeDocCounters, pageDocCounters);
    const docCounters = this.element
      ? cascadeDocCounters
      : useLocalPageCounters
        ? cascadeDocCounters
        : pageDocCounters.length
          ? pageDocCounters
          : cascadeDocCounters;

    if (store.isPageControlledCounter?.(counterName)) {
      const docStartCounters =
        store.currentPageDocCounters?.[counterName] || [];
      const pageStartCounters = store.currentPageCounters?.[counterName] || [];
      const pageStartVal = pageStartCounters.length
        ? pageStartCounters.at(-1)
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
    const localCounterResetOrSet =
      !this.element && this.hasLocalCounterResetOrSet(counterName);
    const localCounterIncrement =
      !this.element && this.hasLocalCounterIncrement(counterName);
    // When a counter store is available, return a native expression so
    // page/document counters resolve at layout time.
    const counterStore = this.getCounterStore();
    if (counterStore) {
      const isPageCounter =
        counterName === "pages" ||
        counterStore?.isPageControlledCounter?.(counterName);
      const pageScope = this.counterResolver.pageScope;
      const nativeExpr = new Exprs.Native(
        pageScope,
        () =>
          this.buildCounterText(
            counterStore,
            counterName,
            type,
            cascadeDocCounters,
            undefined,
            localCounterResetOrSet,
            localCounterIncrement,
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
      const numval = (arr && arr.length && arr.at(-1)) || 0;
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
    const localCounterResetOrSet =
      !this.element && this.hasLocalCounterResetOrSet(counterName);
    const localCounterIncrement =
      !this.element && this.hasLocalCounterIncrement(counterName);
    const counterStore = this.getCounterStore();
    if (counterStore) {
      const isPageCounter =
        counterName === "pages" ||
        counterStore?.isPageControlledCounter?.(counterName);
      const pageScope = this.counterResolver.pageScope;
      const nativeExpr = new Exprs.Native(
        pageScope,
        () =>
          this.buildCounterText(
            counterStore,
            counterName,
            type,
            cascadeDocCounters,
            separator,
            localCounterResetOrSet,
            localCounterIncrement,
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
            const pseudos = getStyleMap(this.elementStyle, "_pseudos");
            const val = (pseudos?.[pseudoName]?.["content"] as CascadeValue)
              ?.value;
            if (val) {
              stringValue = this.evaluateAndGetString(val);
            } else if (pseudoName === "marker") {
              // Native ::marker: content was extracted to --viv-marker-content
              const markerVal = (
                this.elementStyle["--viv-marker-content"] as CascadeValue
              )?.value;
              stringValue = getStringValueFromCssContentVal(
                markerVal,
                this.cascade.context,
              );
            }
          }
        }
        break;
      case "first-letter":
        {
          // Respect ::before/after pseudo-elements (Issue #1174)
          const pseudos = getStyleMap(this.elementStyle, "_pseudos");
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
    return new Css.Expr(
      new Exprs.Native(
        this.counterResolver.rootScope,
        () => leader,
        "viv-leader",
      ),
    );
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
  node: Element | Text,
  clientLayout: Vtree.ClientLayout,
  writingMode: string,
): number {
  let rects: { width: number; height: number }[];

  if (node.nodeType === 1) {
    rects = Array.from((node as Element).getClientRects());
  } else {
    rects = RangeClientRects.getLayoutClientRectsOfNodeContents(
      clientLayout,
      node,
    );
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

function asLeaderNodeContext(
  c: Vtree.RenderedNodeContext,
): Vtree.ContainedElementNodeContext | null {
  const element = Vtree.asElementNodeContext(c);
  return element !== null &&
    element.after &&
    element.viewNode.hasAttribute("data-viv-leader") &&
    // a leader is generated as the content of a pseudo element, so it is
    // always built under a parent
    element.blockContainer !== null
    ? (element as Vtree.ContainedElementNodeContext)
    : null;
}

/**
 * POST_LAYOUT_BLOCK hook function for CSS leader()
 * @param nodeContext
 * @param checkPoints
 * @param column
 */
const postLayoutBlockLeader: Plugin.PostLayoutBlockHook = (
  nodeContext: Vtree.NodeContext,
  checkPoints: Vtree.RenderedNodeContext[],
  column: Layout.Column,
) => {
  const leaders = checkPoints.flatMap((c) => {
    const leaderContext = asLeaderNodeContext(c);
    const pseudoElem = leaderContext?.viewNode.parentElement;
    const pseudoParent = pseudoElem?.parentElement;
    return leaderContext && pseudoElem && pseudoParent
      ? [{ leaderContext, pseudoElem, pseudoParent }]
      : [];
  });
  for (const { leaderContext: c, pseudoElem, pseudoParent } of leaders) {
    // the bottom block element, which contains single leader()
    const container = c.blockContainer;
    const leaderElem = c.viewNode as HTMLElement;
    const pseudoName = pseudoElem.getAttribute("data-adapt-pseudo");
    // written together with data-viv-leader by the leader content listener
    const leader = leaderElem.getAttribute("data-viv-leader-value")!;
    const { writingMode, direction, marginInlineEnd } =
      column.clientLayout.getElementComputedStyle(pseudoElem);

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

    // Firefox sends the line of a leader that overflows a column to the next
    // column and, until the event loop updates the rendering, keeps it there
    // through the layout that reading a client rect forces, however far the
    // leader shrinks again. Switching column-fill makes the container fragment
    // its contents again.
    const refragmentColumns =
      columnContainer && Base.browserType === "firefox"
        ? () => {
            columnContainer.style.columnFill = "balance";
            column.clientLayout.getElementClientRect(columnContainer);
            columnContainer.style.columnFill = "auto";
          }
        : () => {};

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
      refragmentColumns();
    }

    // prevent leader layout problem (Issue #1117)
    leaderElem.style.marginInlineStart = "1px";

    // reset the expanded leader
    setLeaderTextContent(leader);
    // setting inline-block removes the pseudo CONTENT from normal text flow
    pseudoElem.style.display = "inline-block";
    pseudoElem.style.textIndent = "0"; // cancel inherited text-indent

    const previousLineBreak = pseudoElem.previousElementSibling;
    if (previousLineBreak?.hasAttribute("data-viv-leader-break")) {
      previousLineBreak.remove();
    }

    const vertical =
      writingMode === "vertical-rl" || writingMode === "vertical-lr";
    const [inlineLowSide, inlineHighSide] = vertical
      ? (["top", "bottom"] as const)
      : (["left", "right"] as const);
    const [blockLowSide, blockHighSide] = vertical
      ? (["left", "right"] as const)
      : (["top", "bottom"] as const);
    const [blockStartSide, blockEndSide] =
      writingMode === "vertical-rl"
        ? ([blockHighSide, blockLowSide] as const)
        : ([blockLowSide, blockHighSide] as const);
    const blockSign = writingMode === "vertical-rl" ? -1 : 1;
    const [inlineStartSide, inlineEndSide] =
      direction === "rtl"
        ? ([inlineHighSide, inlineLowSide] as const)
        : ([inlineLowSide, inlineHighSide] as const);
    const inlineSign = direction === "rtl" ? -1 : 1;
    const inlineSizeOf = (rect: Vtree.ClientRect) =>
      rect[inlineHighSide] - rect[inlineLowSide];
    // The comparisons below run between client rects that separate layout
    // passes produced, where a box that has not moved can still come back with
    // a coordinate differing in its low bits, so they need a dead zone. Its
    // width is the tolerance `Column.almostEquals` compares client rect
    // coordinates with where the viewport emulates no pixel ratio. It stays
    // fixed because the displacements these comparisons separate are line and
    // content sizes in CSS pixels, while emulating a pixel ratio leaves those
    // sizes alone and only makes the rects finer.
    const subPixel = 0.5;
    // Where a leader is measured against the edge it grows toward, that width
    // would let it past the edge by half a pixel, so the comparison of the two
    // takes the width of the arithmetic alone. Client rect coordinates sit on
    // the layout unit of the viewport, so a sum of them can stand a unit away
    // from a coordinate it should equal.
    const coordinateNoise = 1 / column.clientLayout.layoutUnitPerPixel;

    // The lines run in the direction of the block container, which an author
    // can set against the direction of the leader itself.
    const containerStyle = column.clientLayout.getElementComputedStyle(
      container.viewNode,
    );
    const lineIsRtl = containerStyle.direction === "rtl";
    const lineStartSide = lineIsRtl ? inlineHighSide : inlineLowSide;
    const lineSign = lineIsRtl ? -1 : 1;
    const leaderRunsWithTheLine = lineIsRtl === (direction === "rtl");

    // The client rect of the block container is its border box, while its
    // lines end at its content box.
    const containerInset = (side: string) =>
      column.parseComputedLength(
        containerStyle.getPropertyValue(`padding-${side}`),
      ) +
      column.parseComputedLength(
        containerStyle.getPropertyValue(`border-${side}-width`),
      );

    // Alignment distributes the free space of a line between its two edges,
    // and every pattern the leader gains takes from that space, so the browser
    // moves the pseudo element along the line unless the free space all sits
    // at the end of the line. The number of patterns that fit does not depend
    // on where that space sits. The declarations go on the element itself
    // because a rule of the polyfill style sheet aligns the last line of a
    // split block to both edges.
    const physicalLineStart = lineIsRtl ? "right" : "left";
    const alignsToLineStart =
      ["start", physicalLineStart].includes(containerStyle.textAlign) &&
      ["auto", "start", physicalLineStart].includes(
        containerStyle.textAlignLast,
      );
    const containerInlineStyle = (container.viewNode as HTMLElement).style;
    const alignmentToRestore: {
      property: string;
      value: string;
      priority: string;
    }[] = [];
    if (leaderRunsWithTheLine && !alignsToLineStart) {
      for (const property of ["text-align", "text-align-last"] as const) {
        alignmentToRestore.push({
          property,
          value: containerInlineStyle.getPropertyValue(property),
          priority: containerInlineStyle.getPropertyPriority(property),
        });
        containerInlineStyle.setProperty(
          property,
          property === "text-align" ? "start" : "auto",
          "important",
        );
      }
      container.viewNode.setAttribute("data-viv-text-align-start", "");
    }

    // Calculate width of following inline siblings (Issue #1563)
    const inlineNodes: (Element | Text)[] = [];

    // Find the topmost inline ancestor (child of block ancestor) that contains pseudoElement
    let topmostInlineAncestor: Element = pseudoParent;
    while (
      topmostInlineAncestor.parentElement &&
      topmostInlineAncestor.parentElement !== container.viewNode
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

    const box = column.clientLayout.getElementClientRect(container.viewNode);
    let innerInit = column.clientLayout.getElementClientRect(pseudoElem);
    const innerMarginInlineEnd = column.parseComputedLength(marginInlineEnd);
    const patternSize = inlineSizeOf(
      column.clientLayout.getElementClientRect(leaderElem),
    );

    // A block container that continues in another column has a client rect for
    // each fragment, side by side in the inline direction, while its bounding
    // client rect spans all of them.
    const viewportBox = container.viewNode.getBoundingClientRect();
    const fragments = Array.from(container.viewNode.getClientRects());
    const boxOffset = box[inlineStartSide] - viewportBox[inlineStartSide];
    const boxWith = (sides: Partial<Vtree.ClientRect>): Vtree.ClientRect => {
      const { left, top, right, bottom } = { ...box, ...sides };
      return {
        left,
        top,
        right,
        bottom,
        width: right - left,
        height: bottom - top,
      };
    };
    const fragmentBoxes = (
      fragments.length > 0 ? fragments : [viewportBox]
    ).map((fragment) =>
      boxWith({
        [inlineStartSide]:
          fragment[inlineStartSide] +
          boxOffset +
          inlineSign * containerInset(inlineStartSide),
        [inlineEndSide]:
          fragment[inlineEndSide] +
          boxOffset -
          inlineSign * (containerInset(inlineEndSide) + innerMarginInlineEnd),
      }),
    );
    const inlineDistance = (fragmentBox: Vtree.ClientRect, center: number) =>
      Math.max(
        fragmentBox[inlineLowSide] - center,
        center - fragmentBox[inlineHighSide],
        0,
      );
    const fragmentBoxOf = (rect: Vtree.ClientRect) => {
      const center = (rect[inlineLowSide] + rect[inlineHighSide]) / 2;
      return fragmentBoxes.reduce((nearest, fragmentBox) =>
        inlineDistance(fragmentBox, center) < inlineDistance(nearest, center)
          ? fragmentBox
          : nearest,
      );
    };
    let initialFragmentBox = fragmentBoxOf(innerInit);

    // A range around a node yields a rect for each line it occupies, where the
    // contents of a replaced element or of an empty inline box yield none and
    // the bounding rect of an element spans every line it occupies at once.
    const firstInlineRectOf = (node: Element | Text) =>
      RangeClientRects.getLayoutClientRectsBetween(
        column.clientLayout,
        RangeClientRects.before(node),
        RangeClientRects.after(node),
      ).find((rect) => inlineSizeOf(rect) > 0);

    let followingInit: Vtree.ClientRect | undefined;
    for (const node of inlineNodes) {
      followingInit = firstInlineRectOf(node);
      if (followingInit) {
        break;
      }
    }

    // The following content is measured on a single line: where it wraps, the
    // browser gives the collapsible space at the wrap point no client rect
    // width, and justification stretches the spaces of the wrapped line.
    container.viewNode.setAttribute("data-viv-nowrap", "");

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

    container.viewNode.removeAttribute("data-viv-nowrap");

    // capture the line boundary
    // Some leader text ("_" e.g.) creates higher top than container.
    const lineBoxAround = (inner: Vtree.ClientRect) =>
      boxWith({
        ...initialFragmentBox,
        [inlineLowSide]: Math.min(
          inner[inlineLowSide],
          initialFragmentBox[inlineLowSide],
        ),
        [inlineHighSide]: Math.max(
          inner[inlineHighSide],
          initialFragmentBox[inlineHighSide],
        ),
      });
    let initialLineBox = lineBoxAround(innerInit);
    const lineBoxOf = (inner: Vtree.ClientRect) => {
      const fragmentBox = fragmentBoxOf(inner);
      return fragmentBox === initialFragmentBox ? initialLineBox : fragmentBox;
    };

    function overrun(inner: Vtree.ClientRect): boolean {
      const lineBox = lineBoxOf(inner);
      const end =
        inner[inlineEndSide] + inlineSign * followingInlineSiblingsWidth;
      return (
        lineBox[inlineLowSide] - Math.min(inner[inlineLowSide], end) >
          coordinateNoise ||
        Math.max(inner[inlineHighSide], end) - lineBox[inlineHighSide] >
          coordinateNoise ||
        lineBox[blockLowSide] - inner[blockLowSide] > subPixel ||
        inner[blockHighSide] - lineBox[blockHighSide] > subPixel
      );
    }

    // The browser moves the pseudo element along its line where it balances
    // the lines or redistributes the free space of its container again, and it
    // moves the lines in the block direction where the container aligns them
    // to its center or end.
    const hasMovedAlongLine = (inner: Vtree.ClientRect) =>
      fragmentBoxOf(inner) !== initialFragmentBox ||
      Math.abs(inner[lineStartSide] - innerInit[lineStartSide]) >= subPixel;
    const hasMovedAcrossLines = (inner: Vtree.ClientRect) =>
      fragmentBoxOf(inner) !== initialFragmentBox ||
      Math.abs(inner[blockLowSide] - innerInit[blockLowSide]) >= subPixel;

    // A leader belongs on the line where the content before it ends, and grows
    // while the content following it still fits on that line. Only where a
    // single pattern and that content do not fit there does the leader move to
    // the next line, and it then grows while it fits on that line.
    // TODO: CSS Generated Content 3 puts a leader and the content around it on
    // one line, so it leaves the length undefined where the content following
    // the leader carries a forced break or is longer than a line. That content
    // is measured here as a width on one line: the part after a break counts
    // as though it shared the line, which shortens the leader by that width,
    // and content longer than a line leaves no room, which keeps the leader at
    // a single pattern.
    // An inline box that `vertical-align` displaces can clear the leader in the
    // block direction while it stays on the line, so content that has left the
    // line is recognized by the direction of the line as well: it resumes at
    // the start of its line, no further along than the leader.
    const startsOnALaterLine = (rect: Vtree.ClientRect) =>
      (rect[blockStartSide] - innerInit[blockEndSide]) * blockSign >=
        -subPixel &&
      (rect[lineStartSide] - innerInit[lineStartSide]) * lineSign <= subPixel;
    const fitsWithOnePattern =
      !overrun(innerInit) &&
      (followingInit === undefined || !startsOnALaterLine(followingInit));
    // The room runs in the direction of the leader, which is the direction of
    // the line unless an author sets them against each other. On such a line
    // it measures the other way, and the search below pays for that in probes
    // rather than in the count it settles on.
    const roomOnTheLine = () =>
      (initialLineBox[inlineEndSide] -
        (fitsWithOnePattern
          ? innerInit[inlineStartSide]
          : initialLineBox[inlineStartSide])) *
        inlineSign -
      followingInlineSiblingsWidth;
    let lineRoom = roomOnTheLine();
    // CSS Generated Content 3 breaks the line after the content preceding a
    // leader where not one full copy of the leader is visible beside it, and
    // draws the leader and the content following it on the next line. A leader
    // long enough to fill that line reaches it on its own wherever it is also
    // too long for the room beside the content before it. The break goes into
    // the tree only where it does not, because a break of its own aligns the
    // line before it as the last line of a block.
    const roomBesideTheContentBefore =
      (initialLineBox[inlineEndSide] - innerInit[inlineStartSide]) * inlineSign;
    const startsTheNextLine =
      !fitsWithOnePattern &&
      lineRoom >= inlineSizeOf(innerInit) &&
      lineRoom <= roomBesideTheContentBefore;
    if (startsTheNextLine) {
      const lineBreak = pseudoElem.ownerDocument.createElementNS(
        Base.NS.XHTML,
        "br",
      );
      lineBreak.setAttribute("data-viv-leader-break", "");
      pseudoParent.insertBefore(lineBreak, pseudoElem);
      innerInit = column.clientLayout.getElementClientRect(pseudoElem);
      initialFragmentBox = fragmentBoxOf(innerInit);
      initialLineBox = lineBoxAround(innerInit);
      lineRoom = roomOnTheLine();
    }
    const leaderIsOnItsLine = fitsWithOnePattern || startsTheNextLine;
    const isTooLong = (inner: Vtree.ClientRect) =>
      leaderIsOnItsLine
        ? overrun(inner) ||
          (hasMovedAlongLine(inner) && hasMovedAcrossLines(inner))
        : overrun(inner) &&
          (hasMovedAlongLine(inner) ||
            inlineSizeOf(inner) > lineRoom + followingInlineSiblingsWidth);

    function setLeader() {
      const maxCount = 10000;
      // A pattern that advances the line by nothing, as a zero width space or
      // a combining mark does, reaches no edge however often it repeats. What
      // stands beside it in the pseudo element can still be too long for the
      // line, and repeating the pattern leaves that as it is.
      if (!(patternSize > 0)) {
        setLeaderTextContent(leader.repeat(maxCount));
        if (isTooLong(column.clientLayout.getElementClientRect(pseudoElem))) {
          setLeaderTextContent(leader);
        }
        return;
      }
      const sizeWithoutPatterns = inlineSizeOf(innerInit) - patternSize;
      const patternRoom = lineRoom - sizeWithoutPatterns;
      let notTooLong = {
        count: 1,
        fits: leaderIsOnItsLine && !overrun(innerInit),
      };
      let tooLongCount = maxCount + 1;
      let measuredCount = 1;
      let patternAdvance = patternSize;
      let step = 1;
      while (tooLongCount - notTooLong.count > 1) {
        // The browser decides whether a leader is too long on more than its
        // inline size, as it does where it reorders a bidirectional line or
        // gives the following content a line of its own, so the room can keep
        // proposing a count the search has already measured.
        const estimate = Math.min(
          Math.floor(patternRoom / patternAdvance),
          maxCount,
        );
        const half = Math.max(
          1,
          Math.floor((tooLongCount - notTooLong.count) / 2),
        );
        let count: number;
        if (estimate > notTooLong.count && estimate < tooLongCount) {
          count = estimate;
          step = 1;
        } else if (estimate >= tooLongCount) {
          count = notTooLong.count + half;
        } else {
          count = notTooLong.count + Math.min(step, half);
          step *= 2;
        }
        setLeaderTextContent(leader.repeat(count));
        measuredCount = count;
        const inner = column.clientLayout.getElementClientRect(pseudoElem);
        if (isTooLong(inner)) {
          tooLongCount = count;
        } else {
          notTooLong = { count, fits: leaderIsOnItsLine || !overrun(inner) };
        }
        const measuredAdvance =
          (inlineSizeOf(inner) - sizeWithoutPatterns) / count;
        if (measuredAdvance > 0) {
          patternAdvance = measuredAdvance;
        }
      }
      const expandedCount = notTooLong.fits ? notTooLong.count : 1;
      if (measuredCount !== expandedCount) {
        setLeaderTextContent(leader.repeat(expandedCount));
      }
    }

    // set the expanded leader
    setLeader();
    if (alignmentToRestore.length > 0) {
      container.viewNode.removeAttribute("data-viv-text-align-start");
      for (const { property, value, priority } of alignmentToRestore) {
        containerInlineStyle.setProperty(property, value, priority);
      }
    }

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
      let p: Element | null = pseudoElem.parentElement;
      while (p && p !== container.viewNode) {
        inset += column.getComputedInsets(p)[side];
        p = p.parentElement;
      }
      return inset;
    }
    let padding =
      (innerAligned[inlineEndSide] - innerInline[inlineEndSide]) * inlineSign -
      getInset(inlineEndSide) -
      followingInlineSiblingsWidth;
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

/**
 * Fitting order and specificity in the same number. Order is recorded in the
 * fractional part. Select value so that
 *
 *   0x7FFFFFFF != 0x7FFFFFFF + ORDER_INCREMENT
 *
 */
export const ORDER_INCREMENT = 1 / 0x100000;

export class Cascade {
  nsCount: number = 0;
  nsPrefix = new Map<string, string>();
  tags: ActionTable = new Map();
  nstags: ActionTable = new Map();
  epubtypes: ActionTable = new Map();
  classes: ActionTable = new Map();
  ids: ActionTable = new Map();
  pagetypes: ActionTable = new Map();
  order: number = 0;
  readonly layerTrees = new Map<string, CascadeLayerTree>();

  /**
   * Returns the cascade layer for a `@layer` rule of the given origin.
   * @param nameList `null` for an anonymous layer.
   */
  registerLayer(
    flavor: string,
    parent: CascadeLayer | null,
    nameList: string[] | null,
  ): CascadeLayer {
    let tree = this.layerTrees.get(flavor);
    if (!tree) {
      tree = new CascadeLayerTree();
      this.layerTrees.set(flavor, tree);
    }
    return tree.register(parent, nameList);
  }

  insertInTable(table: ActionTable, key: string, action: CascadeAction): void {
    const a = table.get(key);
    if (a) {
      action = a.mergeWith(action);
    }
    table.set(key, action);
  }

  createInstance(
    context: Exprs.Context,
    counterListener: CounterListener,
    counterResolver: CounterResolver,
    counterStyleStore: CounterStyle.CounterStyleStore,
    cmykStore: CmykStore.CmykStore,
    root: Element,
    scope: Exprs.LexicalScope,
    validatorSet: CssValidator.ValidatorSet,
    styles: StyleReader,
    mergeValidatorSet: CssValidator.ValidatorSet | null,
  ): CascadeInstance {
    return new CascadeInstance(
      this,
      context,
      counterListener,
      counterResolver,
      counterStyleStore,
      cmykStore,
      root,
      scope,
      validatorSet,
      styles,
      mergeValidatorSet,
    );
  }

  nextOrder(): number {
    return (this.order += ORDER_INCREMENT);
  }
}

export interface StyleReader {
  styleOf(element: Element): ElementStyle;
}

export class CascadeInstance {
  code: Cascade;
  stack = [[], []] as ConditionItem[][];
  conditions = new Map<string, number>();
  currentElement: Element | null = null;
  currentElementOffset: number | null = null;
  currentLocalName: string = "";
  currentNamespace: string | null = null;
  currentId: string | null = null;
  currentXmlId: string | null = null;
  currentNSTag: string = "";
  currentPageType: string | null = null;
  previousPageType: string | null = null;
  firstPageType: string | null = null;
  pageTypePageIndices: { [pageType: string]: number[] } = Object.create(null);
  isFirst: boolean = true;
  isRoot: boolean = true;
  counters: CounterValues = Object.create(null);
  lastCounterChanges: string[] = [];
  lastCounterChangeTypes: {
    [key: string]: "reset" | "set" | "increment";
  } = Object.create(null);
  counterScoping: ({ [key: string]: boolean } | null)[] = [Object.create(null)];
  quotes: Css.Str[];
  quoteDepth: number = 0;
  lang: string = "";
  siblingOrderStack: number[] = [0];
  currentSiblingOrder: number = 0;
  siblingTypeCountsStack: SiblingTypeCounts[] = [emptySiblingTypeCounts()];
  currentSiblingTypeCounts: SiblingTypeCounts;
  currentFollowingSiblingOrder: number | null = null;
  followingSiblingOrderStack: (number | null)[];
  followingSiblingTypeCountsStack: SiblingTypeCounts[] = [
    emptySiblingTypeCounts(),
  ];
  currentFollowingSiblingTypeCounts: SiblingTypeCounts;
  viewConditions = new Map<string, Matchers.Matcher[]>();
  dependentConditions: string[] = [];
  elementStack: Element[] = [];

  constructor(
    cascade: Cascade,
    public readonly context: Exprs.Context,
    public readonly counterListener: CounterListener,
    public readonly counterResolver: CounterResolver,
    public readonly counterStyleStore: CounterStyle.CounterStyleStore,
    public readonly cmykStore: CmykStore.CmykStore,
    public readonly root: Element,
    public readonly scope: Exprs.LexicalScope,
    public readonly validatorSet: CssValidator.ValidatorSet,
    public readonly styles: StyleReader,
    public readonly mergeValidatorSet: CssValidator.ValidatorSet | null,
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
  }

  pushConditionItem(item: ConditionItem): void {
    this.stack.at(-1).push(item);
  }

  increment(condition: string, viewCondition: Matchers.Matcher | null): void {
    this.conditions.set(condition, (this.conditions.get(condition) || 0) + 1);
    if (!viewCondition) {
      return;
    }
    const matchers = this.viewConditions.get(condition);
    if (matchers) {
      matchers.push(viewCondition);
    } else {
      this.viewConditions.set(condition, [viewCondition]);
    }
  }

  decrement(condition: string, viewCondition: Matchers.Matcher | null): void {
    this.conditions.set(condition, this.conditions.get(condition) - 1);
    const matchers = this.viewConditions.get(condition);
    if (!matchers) {
      return;
    }
    const remaining = matchers.filter((item) => item !== viewCondition);
    if (remaining.length === 0) {
      this.viewConditions.delete(condition);
    } else {
      this.viewConditions.set(condition, remaining);
    }
  }

  buildViewConditionMatcher(
    viewConditionId: string | null,
  ): Matchers.Matcher | null {
    let matcher: Matchers.Matcher | null = null;
    if (viewConditionId) {
      Asserts.assert(this.currentElementOffset);
      matcher = Matchers.MatcherBuilder.buildViewConditionMatcher(
        this.currentElementOffset,
        viewConditionId,
      );
    }
    const dependentConditionMatchers = this.dependentConditions
      .map((conditionId) => {
        const conditions = this.viewConditions.get(conditionId);
        if (conditions && conditions.length > 0) {
          return conditions.length === 1
            ? conditions[0]
            : Matchers.MatcherBuilder.buildAnyMatcher([...conditions]);
        } else {
          return null;
        }
      })
      .filter((item): item is Matchers.Matcher => item !== null);
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

  applyAction(
    cascadeInstance: StyledCascadeInstance,
    table: ActionTable,
    key: string,
  ): void {
    const action = table.get(key);
    if (action) {
      action.apply(cascadeInstance);
    }
  }

  pushRule(
    classes: string[],
    pageType: string | null,
    baseStyle: ElementStyle,
  ): void {
    this.currentElement = null;
    this.currentElementOffset = null;
    this.currentNamespace = null;
    this.currentLocalName = "";
    this.currentId = null;
    this.currentXmlId = null;
    this.currentNSTag = "";
    this.currentPageType = pageType;
    this.applyActions(
      new StyledCascadeInstance(this, baseStyle, classes, EMPTY),
    );
  }

  defineCounter(counterName: string, value: number) {
    let scoping = this.counterScoping.at(-1);
    if (!scoping) {
      scoping = Object.create(null) as { [key: string]: boolean };
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

  pushCounters(props: ElementStyle, elementStyle: ElementStyle): void {
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
      this.currentElement?.setAttribute("data-viv-display-none", "true");
      this.lastCounterChanges = [];
      this.lastCounterChangeTypes = Object.create(null);
      this.counterScoping.push(null);
      return;
    } else if (this.currentElement?.closest("[data-viv-display-none]")) {
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
    let resetMap: { [key: string]: number } | null = null;
    let incrementMap: { [key: string]: number } | null = null;
    let setMap: { [key: string]: number } | null = null;
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
        resetMap = Object.create(null) as { [key: string]: number };
      }
      resetMap["list-item"] = ((this.currentElement as any)?.start ?? 1) - 1;
    }
    if (Display.isListItem(displayVal)) {
      if (!incrementMap) {
        incrementMap = Object.create(null) as { [key: string]: number };
      }
      incrementMap["list-item"] = incrementMap["list-item"] ?? 1;
      if (
        /^\s*[-+]?\d/.test(this.currentElement?.getAttribute("value") ?? "")
      ) {
        if (!setMap) {
          setMap = Object.create(null) as { [key: string]: number };
        }
        setMap["list-item"] = (this.currentElement as any).value;
      }
    }
    if (this.currentElement?.parentNode?.nodeType === Node.DOCUMENT_NODE) {
      if (!resetMap) {
        resetMap = Object.create(null) as { [key: string]: number };
      }
      // `counter-reset: footnote 0` is implicitly applied on the root element
      if (resetMap["footnote"] === undefined) {
        resetMap["footnote"] = 0;
      }
    }
    if (
      floatVal === Css.ident.footnote &&
      !elementStyle["--viv-semantic-footnote-content"]
    ) {
      if (!incrementMap) {
        incrementMap = Object.create(null) as { [key: string]: number };
      }
      // `counter-increment: footnote 1` is implicitly applied on the
      // element (or pseudo element) with `float: footnote`,
      // unless `counter-increment: footnote` is explicitly specified
      // on the element (parent element of the pseudo element).
      if (incrementMap["footnote"] === undefined) {
        const incrPropValue = (
          elementStyle["counter-increment"] as CascadeValue
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
      const listItemCount = listItemCounts.at(-1);
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
  setNamedStrings(
    props: ElementStyle,
    element: Element,
    elementOffset: number,
  ): void {
    let stringSet = props["string-set"] as CascadeValue;
    if (!stringSet) {
      return;
    }
    stringSet = stringSet.filterValue(
      new ContentPropVisitor(this, element, this.counterResolver, props),
    );
    const sets =
      stringSet.value instanceof Css.CommaList
        ? stringSet.value.values
        : [stringSet.value];

    for (const set of sets) {
      if (set instanceof Css.SpaceList) {
        const name = set.values[0].stringValue();
        const valueParts = set.values.slice(1);
        if (valueParts.some((v) => containsPageCounter(v))) {
          // When the value contains page-based counters (counter(page) /
          // counter(pages)), keep the content list so the counters are
          // resolved at the page where the named string is used and patched
          // with the final page count (Issue #1997). Non-counter parts are
          // stringified up front so `string()` ignores non-string content
          // (e.g. url()) just like the plain stringification path.
          this.counterResolver.setNamedString(
            name,
            buildDeferredStringSetVal(
              new Css.SpaceList(valueParts),
              this.context,
            ),
            elementOffset,
          );
        } else {
          const stringValue = valueParts
            .map((v) => getStringValueFromCssContentVal(v, this.context))
            .join("");
          this.counterResolver.setNamedString(name, stringValue, elementOffset);
        }
      }
    }
    delete props["string-set"];
  }

  /**
   * Process CSS running elements
   * https://drafts.csswg.org/css-gcpm-3/#running-elements
   */
  setRunningElement(props: ElementStyle, elementOffset: number): void {
    const position = props["position"] as CascadeValue;
    if (
      position?.value instanceof Css.Func &&
      position.value.name === "running"
    ) {
      const name = position.value.values[0].stringValue();
      this.counterResolver.setRunningElement(name, elementOffset);
    }
  }

  processPseudoelementProps(
    pseudoprops: ElementStyle,
    element: Element,
    elementStyle: ElementStyle,
    pseudoName?: string,
  ): void {
    this.pushCounters(pseudoprops, elementStyle);
    const content = pseudoprops["content"] as CascadeValue;
    if (content) {
      pseudoprops["content"] = content.filterValue(
        new ContentPropVisitor(
          this,
          element,
          this.counterResolver,
          elementStyle,
          pseudoName,
        ),
      );
    }
    this.popCounters();
  }

  private dropPseudoelement(
    baseStyle: ElementStyle,
    pseudos: ElementStyleMap,
    pseudoName: string,
  ): ElementStyleMap {
    // Rebuilding keeps _pseudos out of V8 dictionary mode.
    const keptPseudos = {} as ElementStyleMap;
    for (const name in pseudos) {
      if (name !== pseudoName) {
        keptPseudos[name] = pseudos[name];
      }
    }
    baseStyle["_pseudos"] = keptPseudos;
    return keptPseudos;
  }

  pushElement(
    element: Base.ChildElement,
    baseStyle: ElementStyle,
    elementOffset: number,
  ): ElementCascadeInstance {
    if (VIVLIOSTYLE_DEBUG) {
      this.elementStack.push(element);
    }

    // Do not apply @page rules to element styles, but preserve the current
    // page-type progression state for layout code that reuses this instance.
    const savedCurrentPageType = this.currentPageType;
    this.currentPageType = null;
    this.currentElement = element;
    this.currentElementOffset = elementOffset;
    this.currentNamespace = element.namespaceURI;
    this.currentLocalName = element.localName;
    const prefix =
      this.currentNamespace !== null
        ? this.code.nsPrefix.get(this.currentNamespace)
        : undefined;
    if (prefix) {
      this.currentNSTag = prefix + this.currentLocalName;
    } else {
      this.currentNSTag = "";
    }
    this.currentId = element.getAttribute("id");
    this.currentXmlId = element.getAttributeNS(Base.NS.XML, "id");
    const classes = element.getAttribute("class");
    const classNames = classes ? classes.split(/\s+/) : EMPTY;
    const types = element.getAttributeNS(Base.NS.epub, "type");
    const epubTypes = types ? types.split(/\s+/) : EMPTY;
    const lang = Base.getLangAttribute(element);
    if (lang) {
      this.stack.at(-1).push(new RestoreLangItem(this.lang));
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
      siblingTypeCountsStack.at(-1));
    const currentNamespaceTypeCounts = typeCountsForNamespace(
      currentSiblingTypeCounts,
      this.currentNamespace,
    );
    currentNamespaceTypeCounts[this.currentLocalName] =
      (currentNamespaceTypeCounts[this.currentLocalName] || 0) + 1;
    siblingTypeCountsStack.push(emptySiblingTypeCounts());
    const followingSiblingOrderStack = this.followingSiblingOrderStack;
    const lastOrder = followingSiblingOrderStack.at(-1);
    if (lastOrder !== null) {
      this.currentFollowingSiblingOrder = followingSiblingOrderStack[
        followingSiblingOrderStack.length - 1
      ] = lastOrder - 1;
    } else {
      this.currentFollowingSiblingOrder = null;
    }
    followingSiblingOrderStack.push(null);
    const followingSiblingTypeCountsStack =
      this.followingSiblingTypeCountsStack;
    const currentFollowingSiblingTypeCounts =
      (this.currentFollowingSiblingTypeCounts =
        followingSiblingTypeCountsStack.at(-1));
    const followingNamespaceTypeCounts =
      currentFollowingSiblingTypeCounts &&
      (this.currentNamespace !== null
        ? currentFollowingSiblingTypeCounts.byNamespace[this.currentNamespace]
        : currentFollowingSiblingTypeCounts.noNamespace);
    if (followingNamespaceTypeCounts) {
      followingNamespaceTypeCounts[this.currentLocalName]--;
    }
    followingSiblingTypeCountsStack.push(emptySiblingTypeCounts());
    const cascadeInstance = new ElementCascadeInstance(
      this,
      baseStyle,
      classNames,
      epubTypes,
      element,
    );
    this.applyActions(cascadeInstance);
    this.currentPageType = savedCurrentPageType;

    // Substitute var()
    this.applyVarFilter([baseStyle], element);

    // Replace the rollback keywords that only became the whole value once
    // var() had been substituted. A rollback can land on a declaration that
    // uses var() itself, in which case one more substitution is needed.
    if (resolveRollbackValues(baseStyle, true)) {
      this.applyVarFilter([baseStyle], element);
    }

    // Calculate calc()
    this.applyCalcFilter(baseStyle, this.context);

    // Convert device-cmyk() to color(srgb ...)
    this.applyCmykFilter(baseStyle, element);

    this.applyAttrFilter(element, baseStyle);
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
    this.pushCounters(baseStyle, baseStyle);
    const id =
      this.currentId || this.currentXmlId || element.getAttribute("name") || "";
    if (isRoot || id) {
      const counters: CounterValues = Object.create(null);
      Object.keys(this.counters).forEach((name) => {
        counters[name] = Array.from(this.counters[name]);
      });
      this.counterListener.countersOfId(id, counters);
    }
    let pseudos = getStyleMap(baseStyle, "_pseudos");
    if (pseudos) {
      let before = true;
      for (const pseudoName of pseudoNames) {
        if (!pseudoName) {
          // content
          before = false;
        }
        const pseudoProps = pseudos[pseudoName];
        if (pseudoProps) {
          const floatValue = getProp(baseStyle, "float")?.value;
          const isSemanticNoteref =
            element instanceof Element &&
            SemanticFootnote.isSemanticFootnoteNoterefElement(element);
          const isSemanticFootnote =
            element instanceof Element &&
            SemanticFootnote.isSemanticFootnoteElement(element);
          const isSemanticFootnoteContent = !!getProp(
            baseStyle,
            "--viv-semantic-footnote-content",
          );
          const isFootnoteFloat = floatValue === Css.ident.footnote;
          // Keep explicit empty before/after pseudos on rendered footnotes so
          // author content:none can suppress the layout-level default separator.
          const allowFootnoteBeforeAfter =
            (pseudoName === "before" || pseudoName === "after") &&
            (isFootnoteFloat ||
              isSemanticFootnote ||
              isSemanticFootnoteContent) &&
            !!pseudoProps["content"];
          const hasSemanticFootnotePseudoContent =
            hasNonTrivialFootnotePseudoContent(pseudoProps);
          const allowSemanticFootnoteCall =
            pseudoName === "footnote-call" &&
            isSemanticNoteref &&
            hasSemanticFootnotePseudoContent;
          const allowSemanticFootnoteMarker =
            pseudoName === "footnote-marker" &&
            (isSemanticFootnote || isSemanticFootnoteContent) &&
            hasSemanticFootnotePseudoContent;
          if (
            ((pseudoName === "before" || pseudoName === "after") &&
              !(
                allowFootnoteBeforeAfter ||
                Vtree.nonTrivialContent(
                  (pseudoProps["content"] as CascadeValue)?.value,
                ) ||
                this.hasNonTrivialViewConditionalPseudoContent(pseudoProps)
              )) ||
            (pseudoName === "marker" &&
              !Display.isListItem(getProp(baseStyle, "display")?.value)) ||
            ((pseudoName === "footnote-call" ||
              pseudoName === "footnote-marker") &&
              floatValue !== Css.ident.footnote &&
              !allowSemanticFootnoteCall &&
              !allowSemanticFootnoteMarker) ||
            ((pseudoName === "footnote-call" ||
              pseudoName === "footnote-marker") &&
              isSemanticFootnoteContent &&
              !hasSemanticFootnotePseudoContent)
          ) {
            pseudos = this.dropPseudoelement(baseStyle, pseudos, pseudoName);
          } else if (before) {
            this.processPseudoelementProps(
              pseudoProps,
              element,
              baseStyle,
              pseudoName,
            );

            if (pseudoName === "marker") {
              // Extract ::marker properties into CSS custom properties on the
              // parent element, then remove the pseudo-element so the browser's
              // native ::marker is used instead.
              this.processMarkerPseudoelementProps(
                pseudoProps,
                element,
                baseStyle,
              );
              // Delete the pseudo to prevent fake element generation
              pseudos = this.dropPseudoelement(baseStyle, pseudos, pseudoName);
            } else if (pseudoName === "footnote-marker") {
              // For ::footnote-marker, use native ::marker only when
              // list-style-position: outside. When inside (default), use
              // traditional marker span to support properties like
              // vertical-align that ::marker doesn't support.
              const fnMarkerListStylePos =
                this.resolvePseudoelementInheritedPropertyValue(
                  pseudoProps,
                  "list-style-position",
                  element,
                  baseStyle,
                );
              if (fnMarkerListStylePos === Css.ident.outside) {
                // Use native ::marker with CSS custom properties
                this.processMarkerPseudoelementProps(
                  pseudoProps,
                  element,
                  baseStyle,
                );
                // Preserve the original footnote-marker content for semantic
                // footnotes so vgen can re-evaluate it with the final counter.
                const footnoteMarkerContent = pseudoProps[
                  "content"
                ] as CascadeValue;
                if (footnoteMarkerContent) {
                  baseStyle["_footnote-marker-content"] = footnoteMarkerContent;
                }
                // Set display: list-item for native ::marker to work
                baseStyle["display"] = new CascadeValue(
                  Css.getName("list-item"),
                  0,
                );
                baseStyle["list-style-position"] = new CascadeValue(
                  Css.ident.outside,
                  0,
                );
                baseStyle["list-style-type"] = new CascadeValue(
                  Css.ident.none,
                  0,
                );
                baseStyle["list-style-image"] = new CascadeValue(
                  Css.ident.none,
                  0,
                );
                // Delete the pseudo to prevent fake element generation
                pseudos = this.dropPseudoelement(
                  baseStyle,
                  pseudos,
                  pseudoName,
                );
              }
              // else: keep the pseudo for traditional span-based rendering
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
                baseStyle["--viv-initialLetter"] = new CascadeValue(
                  initialLetterVal,
                  0,
                );
              }
              delete pseudoProps["initial-letter"];
            }
          } else {
            this.stack[this.stack.length - 2].push(
              new AfterPseudoelementItem(pseudoProps, element, baseStyle),
            );
          }
        }
      }
    }

    // process CSS string-set property
    this.setNamedStrings(baseStyle, element, elementOffset);

    // process CSS running elements
    this.setRunningElement(baseStyle, elementOffset);

    if (itemToPushLast) {
      this.stack[this.stack.length - 2].push(itemToPushLast);
    }
    return cascadeInstance;
  }

  private hasNonTrivialViewConditionalPseudoContent(
    pseudoProps: ElementStyle,
  ): boolean {
    const viewConditionalStyles = pseudoProps["_viewConditionalStyles"] as
      { matcher: Matchers.Matcher; styles: ElementStyle }[] | undefined;
    if (!viewConditionalStyles || viewConditionalStyles.length <= 0) {
      return false;
    }
    return viewConditionalStyles.some((entry) =>
      Vtree.nonTrivialContent((entry.styles["content"] as CascadeValue)?.value),
    );
  }

  /**
   * Properties that are valid on ::marker and should be extracted
   * to CSS custom properties on the parent element.
   */
  static readonly markerAllowedProps: string[] = [
    "color",
    "font-family",
    "font-size",
    "font-style",
    "font-weight",
    "font-variant",
    "hyphens",
    "line-height",
    "tab-size",
    "text-combine-upright",
    "text-emphasis-color",
    "text-emphasis-position",
    "text-emphasis-style",
    "text-orientation",
    "text-shadow",
    "text-transform",
    "unicode-bidi",
    "direction",
    "white-space",
  ];

  /**
   * Extract ::marker or ::footnote-marker properties into CSS custom
   * properties (--viv-marker-*) on the parent element's style,
   * so that the browser's native ::marker can be controlled via polyfill CSS.
   *
   * For ::marker: the content is resolved from list-style-type/list-style-image
   * if not explicitly set.  For ::footnote-marker: the content comes from
   * ::footnote-marker { content: ... } declarations.
   */
  processMarkerPseudoelementProps(
    pseudoProps: ElementStyle,
    element: Element,
    elementStyle: ElementStyle,
  ): void {
    const isListItem = Display.isListItem(
      (elementStyle["display"] as CascadeValue)?.value,
    );

    // Resolve marker content from list-style-* if no explicit content
    if (
      !Vtree.nonTrivialContent(
        (pseudoProps["content"] as CascadeValue)?.value,
      ) &&
      isListItem
    ) {
      const listStyleType = this.getInheritedPropertyValue(
        "list-style-type",
        element,
        elementStyle,
      );
      const listStyleImage = this.getInheritedPropertyValue(
        "list-style-image",
        element,
        elementStyle,
      );
      if (listStyleImage instanceof Css.URL) {
        // list-style-image: <URL> -> content: <URL> " "
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
          (elementStyle["ua-list-item-count"] as CascadeValue)?.value as Css.Num
        )?.num;
        if (listItemCount != null) {
          const lowerName = listStyleType.name.toLowerCase();
          if (
            lowerName === "disc" ||
            lowerName === "circle" ||
            lowerName === "square" ||
            lowerName === "disclosure-open" ||
            lowerName === "disclosure-closed"
          ) {
            // Bullet types: let the browser handle natively via
            // list-style-type. Don't set --viv-marker-content.
          } else {
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
        }
      }
    }

    // Now extract the resolved content to CSS custom property
    const contentCasc = pseudoProps["content"] as CascadeValue;
    if (contentCasc) {
      const contentVal = contentCasc.value;
      if (Vtree.nonTrivialContent(contentVal)) {
        // Resolve any Css.Expr nodes (e.g., from counter()) to strings
        const resolvedContent = this.resolveMarkerContentVal(contentVal);
        elementStyle["--viv-marker-content"] = new CascadeValue(
          resolvedContent,
          0,
        );
      }
    }

    // Extract allowed ::marker properties to CSS custom properties
    for (const propName of CascadeInstance.markerAllowedProps) {
      const prop = pseudoProps[propName] as CascadeValue;
      if (prop) {
        const val = prop.evaluate(this.context, propName);
        if (val && !Css.isDefaultingValue(val)) {
          elementStyle[`--viv-marker-${propName}`] = new CascadeValue(val, 0);
        }
      }
    }

    // list-style-position
    if (!Display.isInlineLevel(getProp(elementStyle, "display")?.value)) {
      const listStylePosition = this.getInheritedPropertyValue(
        "list-style-position",
        element,
        elementStyle,
      );
      if (
        listStylePosition &&
        listStylePosition !== Css.ident.outside &&
        !Css.isDefaultingValue(listStylePosition)
      ) {
        elementStyle["list-style-position"] = new CascadeValue(
          listStylePosition,
          0,
        );
      }
    }
  }

  /**
   * Resolve Css.Expr nodes in marker content to static values.
   * counter() functions are evaluated to strings; URLs are kept as-is.
   */
  private resolveMarkerContentVal(val: Css.Val): Css.Val {
    if (val instanceof Css.Expr) {
      const result = val.expr.evaluate(this.context);
      if (typeof result === "string") {
        return new Css.Str(result);
      }
      if (typeof result === "number") {
        return new Css.Str(String(result));
      }
      return val;
    }
    if (val instanceof Css.SpaceList) {
      const resolved = val.values.map((v) => this.resolveMarkerContentVal(v));
      return new Css.SpaceList(resolved);
    }
    return val;
  }

  /**
   * Get inherited property value
   * @param propName
   * @param element
   * @param elementStyle style being cascaded for `element`, which the style
   *     store cannot serve until the cascade for it finishes
   * @returns the inherited property value, or the initial value (or null) if not found
   */
  getInheritedPropertyValue(
    propName: string,
    element: Element,
    elementStyle: ElementStyle,
  ): Css.Val | null {
    for (let e: Element | null = element; e; e = e.parentElement) {
      const style = e === element ? elementStyle : this.styles.styleOf(e);
      const prop = style[propName] as CascadeValue;
      if (prop) {
        const val = prop.evaluate(this.context, propName);
        if (
          val === Css.ident.inherit ||
          val === Css.ident.unset ||
          Css.isRollbackValue(val)
        ) {
          continue;
        } else if (val === Css.ident.initial) {
          break;
        }
        return val;
      }
    }
    return this.validatorSet.defaultValues.get(propName) ?? null;
  }

  resolvePseudoelementInheritedPropertyValue(
    pseudoProps: ElementStyle,
    propName: string,
    element: Element,
    elementStyle: ElementStyle,
  ): Css.Val | null {
    const prop = pseudoProps[propName] as CascadeValue;
    if (prop) {
      const val = prop.evaluate(this.context, propName);
      if (
        val !== Css.ident.inherit &&
        val !== Css.ident.unset &&
        !Css.isRollbackValue(val)
      ) {
        if (val === Css.ident.initial) {
          return this.validatorSet.defaultValues.get(propName) ?? null;
        }
        return val;
      }
    }
    return this.getInheritedPropertyValue(propName, element, elementStyle);
  }

  private applyAttrFilterInner(
    element: Element,
    elementStyle: ElementStyle,
  ): void {
    for (const propName in elementStyle) {
      if (isPropName(propName) && !Css.isCustomPropName(propName)) {
        const cascVal = elementStyle[propName] as CascadeValue;
        const visitor = new AttrValueFilterVisitor(
          element,
          this.scope,
          propName,
          this.validatorSet,
        );
        const filtered = cascVal.filterValue(visitor);
        if (!visitor.hadAttrFunction) {
          elementStyle[propName] = filtered;
          continue;
        }
        const validatedValue = visitor.validatePropertyValue(filtered.value);
        elementStyle[propName] = filtered.withValue(validatedValue);
      }
    }
  }

  private applyAttrFilter(element: Element, elementStyle: ElementStyle): void {
    const pseudoMap = getStyleMap(elementStyle, "_pseudos");
    for (const pseudoName in pseudoMap) {
      this.applyAttrFilterInner(element, pseudoMap[pseudoName]);
    }
    this.applyAttrFilterInner(element, elementStyle);
  }

  /**
   * Substitute all variables in property values in elementStyle
   */
  applyVarFilter(elementStyles: ElementStyle[], element: Element | null): void {
    const elementStyle = elementStyles[0];
    const sourceElementStyles = elementStyles.map((style) => ({ ...style }));
    const LIMIT_LOOP = 32; // prevent cyclic or too deep dependency
    const propsLH: ElementStyle = {}; // for shorthand -> longhand cascade
    const pendingPseudoMap = getStyleMap(elementStyle, "_pseudos");
    const propNames = Object.keys(elementStyle).filter(isPropName);

    const applyVarFilterToProperty = (name: string): void => {
      const cascVal = getProp(elementStyle, name);
      let value = cascVal.value;
      const lookupElementStyles = Css.isCustomPropName(name)
        ? sourceElementStyles
        : elementStyles;
      const visitor = new VarFilterVisitor(
        lookupElementStyles,
        this.styles,
        this.root,
        element,
        Css.isCustomPropName(name) ? name : null,
      );

      if (
        Css.isCustomPropName(name) &&
        visitor.getFallbackCycleMembers(value, lookupElementStyles, element)
      ) {
        value = Css.ident.initial;
      }

      for (let i = 0; ; i++) {
        if (i >= LIMIT_LOOP) {
          value = Css.isCustomPropName(name)
            ? Css.ident.initial
            : Css.ident.unset;
          break;
        }
        const after = value.visit(visitor);
        if (visitor.error) {
          // invalid or unresolved variable found
          value = Css.isCustomPropName(name)
            ? Css.ident.initial
            : Css.ident.unset;
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
        const shorthand = this.validatorSet
          .getShorthand(name, value)
          ?.clone(this.scope);
        if (shorthand) {
          if (Css.isDefaultingValue(value)) {
            for (const nameLH of shorthand.propList) {
              const avLH = cascVal.withValue(value);
              const tvLH = getProp(elementStyle, nameLH);
              setProp(propsLH, nameLH, cascadeValues(this.context, tvLH, avLH));
            }
            delete elementStyle[name];
          } else {
            // The var()-substituted value may have complex structure
            // (e.g. SpaceList in SpaceList) that ShorthandValidator
            // cannot handle directly, so normalize it through parseValue
            // before expanding the shorthand to longhands.
            const valueSH = CssParser.parseValue(
              this.scope,
              new CssTokenizer.Tokenizer(value.toString(), null),
              "",
            );
            if (valueSH) {
              valueSH.visit(shorthand);
              if (!shorthand.error) {
                for (const nameLH of shorthand.propList) {
                  const avLH = cascVal.withValue(
                    shorthand.values[nameLH] ??
                      this.validatorSet.defaultValues.get(nameLH) ??
                      Css.ident.initial,
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
          elementStyle[name] = cascVal.withValue(value);
        }
      }
      if (propsLH[name]) {
        const av = getProp(elementStyle, name);
        if (av && av.value !== Css.empty) {
          setPropCascadeValue(propsLH, name, av, this.context);
        }
      }
    };

    for (const name in elementStyle) {
      if (isMapName(name)) {
        if (name === "_pseudos") {
          continue;
        }
        const pseudoMap = getStyleMap(elementStyle, name);
        for (const pseudoName in pseudoMap) {
          this.applyVarFilter(
            [pseudoMap[pseudoName], ...elementStyles],
            element,
          );
        }
      }
    }
    for (const name of propNames) {
      if (Css.isCustomPropName(name)) {
        applyVarFilterToProperty(name);
      }
    }
    for (const name of propNames) {
      if (!Css.isCustomPropName(name)) {
        applyVarFilterToProperty(name);
      }
    }
    if (pendingPseudoMap) {
      for (const pseudoName in pendingPseudoMap) {
        this.applyVarFilter(
          [pendingPseudoMap[pseudoName], ...elementStyles],
          element,
        );
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
        // A negative literal length is invalid for `font-size` (its range is
        // non-negative), e.g. one that a var() substitution introduced into the
        // declaration. The browser rejects such a declaration and inherits the
        // parent font size, so the declaration is turned into `unset` here,
        // before the math functions are evaluated: a math function that
        // computes a negative value is valid and is clamped to zero below.
        // (Review)
        // A function that the browser rejects, e.g. the `calc(round(20px,
        // 7))` that a var() substitution put into a `font-size` or
        // `line-height` declaration, makes the declaration invalid at
        // computed-value time: the browser keeps the inherited value, so the
        // declaration is turned into `unset` here rather than being made valid
        // by the math functions that this engine evaluates below. (Review)
        const rejectedFunction =
          (name === "font-size" || name === "line-height") &&
          isFunctionRejectedByBrowser(name, cascVal.value);
        let value =
          (name === "font-size" && isNegativeLiteralFontSize(cascVal.value)) ||
          (name === "font-weight" &&
            isInvalidFontWeight(this.context, cascVal.value)) ||
          // A negative literal line height is invalid like a negative literal
          // font size, so the declaration becomes `unset` and the element
          // inherits the parent line height, as the browser does. (Review)
          (name === "line-height" &&
            isNegativeLiteralLineHeight(cascVal.value)) ||
          rejectedFunction
            ? Css.ident.unset
            : cascVal.value.visit(visitor);
        if (name === "font-weight") {
          if (value instanceof Css.Func || value instanceof Css.Expr) {
            // The validator passes browser-supported math functions through,
            // e.g. `min(900, 1000)`, but `CalcFilterVisitor` only reduces
            // `calc()`: reduce the other math functions here, before the range
            // is validated. A supported function that does not reduce to a
            // number, e.g. `round(650, 100)`, is kept and evaluated by the
            // browser; only a function that the browser rejects, e.g. the
            // `min(900px, 1em)` that a var() substitution put into the
            // declaration, is invalid (`isInvalidFontWeight` below). (Review)
            value =
              evaluateFontWeightMathFunction(this.context, value) ?? value;
          }
          if (value instanceof Css.Num) {
            // A weight that is not a literal, e.g. `calc(1200)`, is valid: the
            // computed value is clamped to the range of CSS Fonts 4, which
            // includes an overflowing calculation such as
            // `calc(exp(1000))`, while a result that is not a number is
            // invalid like a literal outside the range. (Review)
            value = Number.isNaN(value.num)
              ? Css.ident.unset
              : new Css.Num(Math.min(1000, Math.max(1, value.num)));
          } else if (isInvalidFontWeight(this.context, value)) {
            value = Css.ident.unset;
          }
        } else if (
          name === "font-size" &&
          value instanceof Css.Numeric &&
          value.num < 0
        ) {
          // A math function that computes a negative value is valid and its
          // computed value is clamped to the non-negative range of `font-size`,
          // but emitting the negative length would be rejected by the browser,
          // which would inherit the parent font size instead of computing zero.
          // (Review)
          value = new Css.Numeric(0, value.unit);
        } else if (
          // `font-weight` is the property whose range this engine applies to an
          // overflowing calculation itself (`evaluateFontWeightMathFunction`
          // below), so every other property keeps the declaration: the token
          // `Infinity` is not CSS at all, and the browser clamps such a
          // calculation, e.g. `opacity: calc(exp(1000))` to 1, while a stored
          // infinity would propagate into the root sizes and into the line
          // height that a detached descendant resolves an `lh` unit against.
          // (Review)
          name !== "font-weight" &&
          (value instanceof Css.Numeric || value instanceof Css.Num) &&
          !Number.isFinite(value.num)
        ) {
          value = cascVal.value;
        } else if (
          name === "line-height" &&
          (value instanceof Css.Numeric || value instanceof Css.Num) &&
          value.num < 0
        ) {
          // A math function that computes a negative line height is valid and
          // its computed value is clamped to the non-negative range of
          // `line-height`: materializing the negative length would make the
          // browser reject the declaration and inherit the parent line height
          // instead of applying zero. A negative literal was turned into
          // `unset` above, before the math functions were evaluated. (Review)
          value =
            value instanceof Css.Numeric
              ? new Css.Numeric(0, value.unit)
              : new Css.Num(0);
        }
        elementStyle[name] = cascVal.withValue(value);
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
          elementStyle[name] = cascVal.withValue(value);
        }
      }
    }
  }

  private applyActions(cascadeInstance: StyledCascadeInstance): void {
    let i: number;
    const classNames = cascadeInstance.currentClassNames;
    for (i = 0; i < classNames.length; i++) {
      this.applyAction(cascadeInstance, this.code.classes, classNames[i]);
    }
    const epubTypes = cascadeInstance.currentEpubTypes;
    for (i = 0; i < epubTypes.length; i++) {
      this.applyAction(cascadeInstance, this.code.epubtypes, epubTypes[i]);
    }
    if (this.currentId !== null) {
      this.applyAction(cascadeInstance, this.code.ids, this.currentId);
    }
    this.applyAction(cascadeInstance, this.code.tags, this.currentLocalName);
    if (this.currentLocalName != "") {
      // Universal selector does not apply to page-master-related rules.
      this.applyAction(cascadeInstance, this.code.tags, "*");
    }
    this.applyAction(cascadeInstance, this.code.nstags, this.currentNSTag);

    // Apply page rules only when currentPageType is not null
    if (this.currentPageType !== null) {
      this.applyAction(
        cascadeInstance,
        this.code.pagetypes,
        this.currentPageType,
      );

      // We represent page rules without selectors by *, though it is illegal in
      // CSS
      this.applyAction(cascadeInstance, this.code.pagetypes, "*");
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

    // The cascade is settled, so the rollback keywords can now be replaced by
    // the declarations they roll back to.
    resolveRollbackValues(cascadeInstance.currentStyle);
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
  "footnote-call",
  "footnote-marker",
  "marker",
  "inner",
  "first-letter",
  "first-line",
  "", // content
  "after",
];

/**
 * @enum {number}
 */
export enum ParseState {
  TOP,
  SELECTOR,
}

//------------- parsing ------------
export interface SelectorChain {
  push(action: ChainedAction): void;
  restartWith(action: ChainedAction): SelectorChain;
  emit(action: CascadeAction, handler: CascadeParserHandler): void;
  contributeTo(list: MatchesParameterParserHandler): void;
  recordTextIn(texts: string[], text: string): void;
  finishIn(handler: CascadeParserHandler): void;
}

class AccumulatedSelectorChain implements SelectorChain {
  readonly actions: ChainedAction[] = [];

  push(action: ChainedAction): void {
    this.actions.push(action);
  }

  restartWith(action: ChainedAction): SelectorChain {
    const restarted = new AccumulatedSelectorChain();
    restarted.push(action);
    return restarted;
  }

  emit(action: CascadeAction, handler: CascadeParserHandler): void {
    handler.insertChained(chainActions(this.actions, action));
  }

  contributeTo(list: MatchesParameterParserHandler): void {
    list.takeAlternative(this.actions);
  }

  recordTextIn(texts: string[], text: string): void {
    texts.push(text);
  }

  finishIn(handler: CascadeParserHandler): void {
    handler.applyRuleForSelector();
  }
}

class NoSelectorChain implements SelectorChain {
  push(): void {}

  restartWith(): SelectorChain {
    return this;
  }

  emit(): void {}

  contributeTo(): void {}

  recordTextIn(): void {}

  finishIn(): void {}
}

export class CascadeParserHandler
  extends CssParser.SlaveParserHandler
  implements CssValidator.PropertyReceiver
{
  chain: SelectorChain = new NoSelectorChain();
  selectorListVoided: boolean = false;
  private pendingChained: CascadeAction[] = [];
  specificity: number = 0;
  elementStyle: ElementStyle = {};
  /** Identity of the declaration block being parsed, for `revert-rule`. */
  ruleId: number = 0;
  pseudoelement: string | null = null;
  footnoteContent: boolean = false;
  cascade: Cascade;
  layer: CascadeLayer | null;
  state: ParseState;
  viewConditionId: string | null = null;
  invalid: boolean = false; // for `@supports selector()` check

  constructor(
    scope: Exprs.LexicalScope,
    owner: CssParser.DispatchParserHandler,
    public readonly condition: Exprs.Val | null,
    parent: CascadeParserHandler | null,
    public readonly regionId: string | null,
    public readonly validatorSet: CssValidator.ValidatorSet,
    delegation: CssParser.Delegation | null,
  ) {
    super(scope, owner, delegation);
    this.cascade = parent ? parent.cascade : new Cascade();
    this.layer = parent ? parent.layer : null;
    this.state = ParseState.TOP;
  }

  override layerStatementRule(nameLists: string[][]): void {
    for (const nameList of nameLists) {
      this.cascade.registerLayer(this.flavor, this.layer, nameList);
    }
  }

  protected insertNonPrimary(action: CascadeAction): void {
    this.cascade.insertInTable(this.cascade.tags, "*", action);
  }

  processChain(action: CascadeAction): void {
    this.chain.emit(action, this);
  }

  // Nothing enters the cascade until the whole selector list of the rule has
  // been read, so that an invalid selector takes with it the selectors that
  // precede it as well as those that follow.
  insertChained(chained: CascadeAction): void {
    this.pendingChained.push(chained);
  }

  private takePendingChained(): void {
    for (const chained of this.pendingChained) {
      if (chained instanceof WiredAction && chained.makePrimary(this.cascade)) {
        continue;
      }
      this.insertNonPrimary(chained);
    }
    this.pendingChained.splice(0);
  }

  private invalidContinuationAfterPseudoelement(continuation: string): boolean {
    if (this.pseudoelement) {
      this.invalidSelector(
        `::${this.pseudoelement} followed by ${continuation}`,
      );
      return true;
    }
    return false;
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
    if (this.invalidContinuationAfterPseudoelement(name ? name : "*")) {
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
    this.setInvalid();
    this.voidSelectorList();
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
    if (this.invalidContinuationAfterPseudoelement(`.${name}`)) {
      return;
    }
    this.specificity += 256;
    this.chain.push(new CheckClassAction(name));
  }

  override pseudoclassSelector(
    name: string,
    params: (number | string)[] | null,
  ): void {
    if (this.invalidContinuationAfterPseudoelement(`:${name}`)) {
      return;
    }
    // The parser reports the plain form with null params and the functional
    // form with an array.
    if (
      params
        ? !functionalPseudoClasses.has(name.toLowerCase())
        : functionalPseudoClasses.has(name.toLowerCase())
    ) {
      this.unsupportedPseudoclassSelector(name, params);
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
      case "any-link":
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
      case "dir":
        if (params && params.length == 1 && typeof params[0] == "string") {
          if (/^(ltr|rtl)$/i.test(params[0] as string)) {
            this.chain.push(
              new MatchesNativeSelectorAction(
                `:dir(${(params[0] as string).toLowerCase()})`,
              ),
            );
          } else {
            this.chain.push(new CheckConditionAction("")); // always fails
          }
          break;
        }
        this.invalidSelector(`Invalid pseudo-class :${name}`);
        return;
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
      default:
        this.unsupportedPseudoclassSelector(name, params);
        return;
    }
    this.specificity += 256;
  }

  private unsupportedPseudoclassSelector(
    name: string,
    params: (number | string)[] | null,
  ): void {
    if (
      CSS.supports(`selector(${unsupportedSelectorText(":", name, params)})`)
    ) {
      this.chain.push(new CheckConditionAction("")); // always fails
      this.specificity += 256;
    } else {
      this.invalidSelector(`Unsupported pseudo-class :${name}`);
    }
  }

  override pseudoelementSelector(
    name: string,
    params: (number | string)[] | null,
  ): void {
    name = name.toLowerCase();
    if (this.invalidContinuationAfterPseudoelement(`::${name}`)) {
      return;
    }
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
      default:
        this.unsupportedPseudoelementSelector(name, params);
        return;
    }
    this.specificity += 1;
  }

  private unsupportedPseudoelementSelector(
    name: string,
    params: (number | string)[] | null,
  ): void {
    if (
      CSS.supports(`selector(${unsupportedSelectorText("::", name, params)})`)
    ) {
      this.chain.push(new CheckConditionAction("")); // always fails
      this.specificity += 1;
    } else {
      this.invalidSelector(`Unknown pseudo-element ::${name}`);
    }
  }

  override idSelector(id: string): void {
    if (this.invalidContinuationAfterPseudoelement(`#${id}`)) {
      return;
    }
    this.specificity += 65536;
    this.chain.push(new CheckIdAction(id));
  }

  override attributeSelector(
    ns: string | null,
    name: string,
    op: TokenType,
    value: string | null,
    modifier?: CssParser.AttributeSelectorCaseSensitivity,
  ): void {
    if (this.invalidContinuationAfterPseudoelement(`[${name}]`)) {
      return;
    }
    this.specificity += 256;
    value = value || "";
    let action: ChainedAction;
    switch (op) {
      case TokenType.EOF:
        action = new CheckAttributePresentAction(ns, name);
        break;
      case TokenType.EQ:
        action = new CheckAttributeEqAction(ns, name, value, modifier ?? null);
        break;
      case TokenType.TILDE_EQ:
        if (!value || value.match(/\s/)) {
          action = new CheckConditionAction(""); // always fails
        } else {
          action = new CheckAttributeRegExpAction(
            ns,
            name,
            createAttributeValueRegExp(
              `(^|\\s)${escapeRegExpForAttributeValue(value, modifier ?? null)}(\$|\\s)`,
            ),
            modifier ?? null,
          );
        }
        break;
      case TokenType.BAR_EQ:
        action = new CheckAttributeRegExpAction(
          ns,
          name,
          createAttributeValueRegExp(
            `^${escapeRegExpForAttributeValue(value, modifier ?? null)}(\$|-)`,
          ),
          modifier ?? null,
        );
        break;
      case TokenType.HAT_EQ:
        if (!value) {
          action = new CheckConditionAction(""); // always fails
        } else {
          action = new CheckAttributeRegExpAction(
            ns,
            name,
            createAttributeValueRegExp(
              `^${escapeRegExpForAttributeValue(value, modifier ?? null)}`,
            ),
            modifier ?? null,
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
            createAttributeValueRegExp(
              `${escapeRegExpForAttributeValue(value, modifier ?? null)}\$`,
            ),
            modifier ?? null,
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
            createAttributeValueRegExp(
              escapeRegExpForAttributeValue(value, modifier ?? null),
            ),
            modifier ?? null,
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
    if (this.invalidContinuationAfterPseudoelement("descendant selector")) {
      return;
    }
    const condition = `d${conditionCount++}`;
    this.processChain(
      new ConditionItemAction(
        new DescendantConditionItem(condition, this.viewConditionId, null),
      ),
    );
    this.chain = this.chain.restartWith(new CheckConditionAction(condition));
    this.viewConditionId = null;
  }

  override childSelector(): void {
    if (this.invalidContinuationAfterPseudoelement("child selector")) {
      return;
    }
    const condition = `c${conditionCount++}`;
    this.processChain(
      new ConditionItemAction(
        new ChildConditionItem(condition, this.viewConditionId, null),
      ),
    );
    this.chain = this.chain.restartWith(new CheckConditionAction(condition));
    this.viewConditionId = null;
  }

  override adjacentSiblingSelector(): void {
    if (
      this.invalidContinuationAfterPseudoelement("adjacent sibling selector")
    ) {
      return;
    }
    const condition = `a${conditionCount++}`;
    this.processChain(
      new ConditionItemAction(
        new AdjacentSiblingConditionItem(condition, this.viewConditionId, null),
      ),
    );
    this.chain = this.chain.restartWith(new CheckConditionAction(condition));
    this.viewConditionId = null;
  }

  override followingSiblingSelector(): void {
    if (
      this.invalidContinuationAfterPseudoelement("following sibling selector")
    ) {
      return;
    }
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
    this.chain = this.chain.restartWith(new CheckConditionAction(condition));
    this.viewConditionId = null;
  }

  override nextSelector(): void {
    this.finishChain();
    this.pseudoelement = null;
    this.footnoteContent = false;
    this.specificity = 0;
    if (!this.selectorListVoided) {
      this.chain = new AccumulatedSelectorChain();
    }
  }

  override startSelectorRule(): void {
    if (this.isInsideSelectorRule("E_CSS_UNEXPECTED_SELECTOR")) {
      return;
    }
    this.state = ParseState.SELECTOR;
    this.elementStyle = {};
    this.ruleId = nextRuleId();
    this.pseudoelement = null;
    this.viewConditionId = null;
    this.specificity = 0;
    this.footnoteContent = false;
    this.selectorListVoided = false;
    this.pendingChained.splice(0);
    this.chain = new AccumulatedSelectorChain();
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
    if (this.selectorListVoided) {
      this.pendingChained.splice(0);
    } else {
      this.takePendingChained();
    }
    super.startRuleBody();
    if (this.state == ParseState.SELECTOR) {
      this.state = ParseState.TOP;
    }
  }

  finishChain(): void {
    this.chain.finishIn(this);
  }

  voidSelector(): void {
    this.chain = new NoSelectorChain();
    this.pseudoelement = null;
    // Neither `nextSelector` nor `startSelectorRule` resets this, so a voided
    // selector would leave it for the next rule to read.
    this.viewConditionId = null;
    this.footnoteContent = false;
    this.specificity = 0;
  }

  // A style rule takes a selector list that is not forgiving, so one invalid
  // selector takes the whole rule with it, including the selectors that follow
  // the comma.
  voidSelectorList(): void {
    this.voidSelector();
    this.selectorListVoided = true;
  }

  applyRuleForSelector(): void {
    this.processChain(this.makeApplyRuleAction(this.specificity));
    this.voidSelector();
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
      this.scope,
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
    noteRollbackDeclaration(name, value, this.validatorSet);
    const cascval = this.condition
      ? new ConditionalCascadeValue(
          value,
          priority,
          this.condition,
          this.layer,
          this.ruleId,
        )
      : new CascadeValue(value, priority, this.layer, this.ruleId);
    setPropCascadeValue(this.elementStyle, name, cascval);
  }

  finish(): Cascade {
    return this.cascade;
  }

  override startFuncWithSelector(
    funcName: string,
    params?: (number | string)[],
  ): void {
    let makeParameterParserHandler:
      | ((delegation: CssParser.Delegation) => MatchesParameterParserHandler)
      | undefined;
    switch (funcName) {
      case "is":
        makeParameterParserHandler = (delegation) =>
          new MatchesParameterParserHandler(this, delegation);
        break;
      case "not":
        makeParameterParserHandler = (delegation) =>
          new NotParameterParserHandler(this, delegation);
        break;
      case "where":
        makeParameterParserHandler = (delegation) =>
          new WhereParameterParserHandler(this, delegation);
        break;
      case "has":
        makeParameterParserHandler = (delegation) =>
          new HasParameterParserHandler(this, delegation);
        break;
      case "nth-child":
        if (params && params.length >= 2) {
          makeParameterParserHandler = (delegation) =>
            new NthChildOfSelectorParameterParserHandler(
              this,
              delegation,
              params[0] as number,
              params[1] as number,
            );
        }
        break;
      case "nth-last-child":
        if (params && params.length >= 2) {
          makeParameterParserHandler = (delegation) =>
            new NthLastChildOfSelectorParameterParserHandler(
              this,
              delegation,
              params[0] as number,
              params[1] as number,
            );
        }
        break;
    }
    if (makeParameterParserHandler) {
      this.owner.delegateTo((delegation) => {
        const parameterParserHandler = makeParameterParserHandler(delegation);
        parameterParserHandler.startSelectorRule();
        return parameterParserHandler;
      });
    }
  }
}

export const nthSelectorActionClasses: {
  [key: string]: new (a: number, b: number) => IsNthAction;
} = {
  "nth-child": IsNthSiblingAction,
  "nth-of-type": IsNthSiblingOfTypeAction,
  "nth-last-child": IsNthLastSiblingAction,
  "nth-last-of-type": IsNthLastSiblingOfTypeAction,
};

// The functional names the switch in `pseudoclassSelector` implements. Each
// name takes exactly one of the two forms.
const functionalPseudoClasses: ReadonlySet<string> = new Set([
  "dir",
  "href-epub-type",
  "href-role-type",
  "lang",
  "nth-child",
  "nth-last-child",
  "nth-last-of-type",
  "nth-of-type",
]);

/**
 * Source text of a pseudo-class or pseudo-element this engine does not
 * implement, for probing with `CSS.supports`. `params` holds the raw argument
 * text of a functional form, as the parser hands it over, and is null for the
 * plain form. The name is escaped again because the tokenizer has decoded the
 * escapes it was written with.
 */
function unsupportedSelectorText(
  colons: string,
  name: string,
  params: (number | string)[] | null,
): string {
  const ident = Base.escapeCSSIdent(name);
  return params ? `${colons}${ident}(${params[0]})` : `${colons}${ident}`;
}

export let conditionCount: number = 0;

/**
 * Cascade Parser Handler for :is() and similar pseudo-classes parameter
 */
export class MatchesParameterParserHandler extends CascadeParserHandler {
  parentChain: SelectorChain;
  chains: ChainedAction[][] = [];
  maxSpecificity: number = 0;
  selectorTexts: string[] = [];

  constructor(
    public readonly parent: CascadeParserHandler,
    delegation: CssParser.Delegation,
  ) {
    super(
      parent.scope,
      parent.owner,
      parent.condition,
      parent,
      parent.regionId,
      parent.validatorSet,
      delegation,
    );
    this.parentChain = parent.chain;
  }

  // The rule being parsed belongs to the handler this list is nested in.
  override insertChained(chained: CascadeAction): void {
    this.parent.insertChained(chained);
  }

  takeAlternative(actions: ChainedAction[]): void {
    this.chains.push(actions);
    this.maxSpecificity = Math.max(this.maxSpecificity, this.specificity);
  }

  override nextSelector(): void {
    this.chain.contributeTo(this);
    this.chain = new AccumulatedSelectorChain();
    this.pseudoelement = null;
    this.viewConditionId = null;
    this.footnoteContent = false;
    this.specificity = 0;
  }

  override endFuncWithSelector(): void {
    this.chain.contributeTo(this);
    if (this.chains.length > 0) {
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

    this.endDelegation();
  }

  override startRuleBody(): void {
    this.reportAndSkip("E_CSS_UNEXPECTED_RULE_BODY");
  }

  override error(mnemonics: string, token: CssTokenizer.Token): void {
    super.error(mnemonics, token);
    this.voidAlternative();
  }

  override pseudoelementSelector(
    name: string,
    params: (number | string)[] | null,
  ): void {
    // Selectors Level 4 keeps pseudo-elements out of every selector list a
    // pseudo-class takes: `:is()` and `:where()` exclude them outright, and the
    // <complex-real-selector-list> of `:not()` and of the S of
    // `:nth-child(An+B of S)` is real, which is what "real" means.
    this.invalidSelector(`Pseudo-element ::${name} in a selector list`);
  }

  // An alternative of this list is invalid, not the selector that contains it.
  override invalidSelector(message: string): void {
    Logging.logger.warn(message);
    this.setInvalid();
    this.voidAlternative();
  }

  private voidAlternative(): void {
    this.voidSelector();

    // A list that is not forgiving is invalid as a whole once one alternative
    // is voided, and so is the selector that contains it. The walk stops at the
    // first forgiving list, which drops that selector as one of its own
    // alternatives; reaching the top instead voids the rule and hands the parse
    // back.
    let handler: CascadeParserHandler = this;
    while (
      handler instanceof MatchesParameterParserHandler &&
      !handler.forgiving()
    ) {
      handler = handler.parent;
      handler.voidSelector();
    }
    if (!(handler instanceof MatchesParameterParserHandler)) {
      handler.voidSelectorList();
      this.endDelegation();
    }
  }

  override pushSelectorText(selectorText: string): void {
    // selectorText is used only for relational pseudo-class `:has()`
    if (this.relational()) {
      this.chain.recordTextIn(this.selectorTexts, selectorText);
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
   * @returns true if this takes a forgiving selector list (:is/where)
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

  // `:has()` took a <forgiving-relative-selector-list> in an earlier draft.
  // Selectors Level 4 gives it a <relative-selector-list>.
  override forgiving(): boolean {
    return false;
  }
}

/**
 * Cascade Parser Handler for :nth-child(An+B of S) pseudo-class parameter
 */
export class NthChildOfSelectorParameterParserHandler extends MatchesParameterParserHandler {
  constructor(
    parent: CascadeParserHandler,
    delegation: CssParser.Delegation,
    public readonly a: number,
    public readonly b: number,
  ) {
    super(parent, delegation);
  }

  override endFuncWithSelector(): void {
    this.chain.contributeTo(this);
    if (this.chains.length > 0) {
      this.parentChain.push(
        new IsNthSiblingOfSelectorAction(this.a, this.b, this.chains),
      );
      // :nth-child(An+B of S) specificity: pseudo-class + most specific selector in S
      this.parent.specificity += 256 + this.maxSpecificity;
    } else {
      // func argument is empty or all invalid
      this.parentChain.push(new CheckConditionAction("")); // always fails
    }

    this.endDelegation();
  }

  // Selectors Level 4 gives S a <complex-real-selector-list>.
  override forgiving(): boolean {
    return false;
  }
}

/**
 * Cascade Parser Handler for :nth-last-child(An+B of S) pseudo-class parameter
 */
export class NthLastChildOfSelectorParameterParserHandler extends NthChildOfSelectorParameterParserHandler {
  override endFuncWithSelector(): void {
    this.chain.contributeTo(this);
    if (this.chains.length > 0) {
      this.parentChain.push(
        new IsNthLastSiblingOfSelectorAction(this.a, this.b, this.chains),
      );
      // :nth-last-child(An+B of S) specificity: pseudo-class + most specific selector in S
      this.parent.specificity += 256 + this.maxSpecificity;
    } else {
      // func argument is empty or all invalid
      this.parentChain.push(new CheckConditionAction("")); // always fails
    }

    this.endDelegation();
  }
}

export class DefineParserHandler extends CssParser.SlaveParserHandler {
  constructor(
    scope: Exprs.LexicalScope,
    owner: CssParser.DispatchParserHandler,
    delegation: CssParser.Delegation,
  ) {
    super(scope, owner, delegation);
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
  readonly ruleId: number = nextRuleId();

  constructor(
    scope: Exprs.LexicalScope,
    owner: CssParser.DispatchParserHandler,
    public readonly condition: Exprs.Val | null,
    public readonly elementStyle: ElementStyle,
    public readonly validatorSet: CssValidator.ValidatorSet,
    delegation: CssParser.Delegation,
    public readonly ruleType?: string,
    public readonly layer: CascadeLayer | null = null,
  ) {
    super(scope, owner, delegation);
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
        this.scope,
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
    noteRollbackDeclaration(name, value, this.validatorSet);
    const cascval = this.condition
      ? new ConditionalCascadeValue(
          value,
          specificity,
          this.condition,
          this.layer,
          this.ruleId,
        )
      : new CascadeValue(value, specificity, this.layer, this.ruleId);
    setPropCascadeValue(this.elementStyle, name, cascval);
  }
}

export class PropertyParserHandler
  extends CssParser.ErrorHandler
  implements CssValidator.PropertyReceiver
{
  elementStyle = {} as ElementStyle;
  order: number = 0;
  readonly ruleId: number = nextRuleId();

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
      this.scope,
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
    noteRollbackDeclaration(name, value, this.validatorSet);
    const cascval = new CascadeValue(value, specificity, null, this.ruleId);
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
      writingMode !== Css.ident.unset &&
      !Css.isRollbackValue(writingMode)
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
      direction !== Css.ident.unset &&
      !Css.isRollbackValue(direction)
    ) {
      return direction === Css.ident.rtl;
    }
  }
  return rtl;
}

export function flattenCascadedStyle(
  style: ElementStyle,
  context: Exprs.Context,
  regionIds: string[] | null,
  isFootnote: boolean,
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
  regionIds: string[] | null,
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
      if (coupledCascVal && comparePriority(coupledCascVal, cascVal) > 0) {
        continue;
      }
      if (coupledName1 && coupledName2 && coupledName1 !== coupledName2) {
        coupledName = coupledName2;
        coupledCascVal = src[coupledName];
        if (coupledCascVal && comparePriority(coupledCascVal, cascVal) > 0) {
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
        cascVal = cascVal.withValue(
          leftPageSide === (cascVal.value === Css.ident.inside)
            ? Css.ident.right
            : Css.ident.left,
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
  private resolvingCustomProperties = [] as string[];
  private varResolutionState = { cycleMembers: new Set<string>() };

  constructor(
    public elementStyles: ElementStyle[],
    public readonly styles: StyleReader,
    public readonly root: Element,
    public element: Element | null,
    private readonly currentCustomPropertyName: string | null = null,
  ) {
    super();
    if (currentCustomPropertyName) {
      this.resolvingCustomProperties.push(currentCustomPropertyName);
    }
  }

  private getRawCustomPropertyLookup(
    name: string,
    elementStyles: ElementStyle[],
    element: Element | null,
  ): {
    found: boolean;
    value: Css.Val | null;
    elementStyles: ElementStyle[];
    element: Element | null;
  } {
    let elem: Element | null = element ?? this.root;
    if (elementStyles?.length) {
      for (let index = 0; index < elementStyles.length; index++) {
        const style = elementStyles[index];
        const val = (style[name] as CascadeValue)?.value;
        if (!val) {
          continue;
        }
        if (val === Css.ident.initial) {
          return {
            found: true,
            value: null,
            elementStyles: elementStyles.slice(index),
            element,
          };
        }
        if (
          val === Css.ident.inherit ||
          val === Css.ident.unset ||
          Css.isRollbackValue(val)
        ) {
          continue;
        }
        return {
          found: true,
          value: val,
          elementStyles: elementStyles.slice(index),
          element,
        };
      }
      if (element) {
        elem = element.parentElement;
      }
    }
    for (; elem; elem = elem.parentElement) {
      const style = this.styles.styleOf(elem);
      const val = (style?.[name] as CascadeValue)?.value;
      if (!val) {
        continue;
      }
      if (val === Css.ident.initial) {
        return {
          found: true,
          value: null,
          elementStyles: style ? [style] : [],
          element: elem,
        };
      }
      if (
        val === Css.ident.inherit ||
        val === Css.ident.unset ||
        Css.isRollbackValue(val)
      ) {
        continue;
      }
      return {
        found: true,
        value: val,
        elementStyles: style ? [style] : [],
        element: elem,
      };
    }
    return {
      found: false,
      value: null,
      elementStyles: [],
      element: null,
    };
  }

  private collectReferencedCustomProperties(val: Css.Val): string[] {
    const names = new Set<string>();
    class ReferenceVisitor extends Css.Visitor {
      override visitFunc(func: Css.Func): Css.Val | null {
        const name = func.values[0] instanceof Css.Ident && func.values[0].name;
        if (func.name === "var" && name && Css.isCustomPropName(name)) {
          names.add(name);
        }
        return super.visitFunc(func);
      }
    }
    val.visit(new ReferenceVisitor());
    return Array.from(names);
  }

  private findReferencedCycleStart(
    val: Css.Val,
    elementStyles: ElementStyle[],
    element: Element | null,
    visited = new Set<string>(),
  ): string | null {
    for (const name of this.collectReferencedCustomProperties(val)) {
      if (this.resolvingCustomProperties.includes(name)) {
        return name;
      }
      if (visited.has(name)) {
        continue;
      }
      visited.add(name);
      const lookup = this.getRawCustomPropertyLookup(
        name,
        elementStyles,
        element,
      );
      const cycleStartName =
        lookup.value &&
        this.findReferencedCycleStart(
          lookup.value,
          lookup.elementStyles,
          lookup.element,
          visited,
        );
      if (cycleStartName) {
        return cycleStartName;
      }
    }
    return null;
  }

  getFallbackCycleMembers(
    val: Css.Val,
    elementStyles: ElementStyle[],
    element: Element | null,
  ): Set<string> | null {
    let cycleStartName: string | null = null;
    const self = this;
    class FallbackReferenceVisitor extends Css.Visitor {
      override visitFunc(func: Css.Func): Css.Val | null {
        if (func.name === "var") {
          for (const fallbackVal of func.values.slice(1)) {
            const referencedCycleStart = self.findReferencedCycleStart(
              fallbackVal,
              elementStyles,
              element,
            );
            if (referencedCycleStart) {
              cycleStartName = referencedCycleStart;
              // detection-only visitor: the returned value is discarded
              return func;
            }
          }
        }
        return super.visitFunc(func);
      }
    }
    val.visit(new FallbackReferenceVisitor());
    if (!cycleStartName) {
      return null;
    }
    const cycleStartIndex =
      this.resolvingCustomProperties.indexOf(cycleStartName);
    return new Set(this.resolvingCustomProperties.slice(cycleStartIndex));
  }

  private resolveCustomProperty(
    name: string,
    val: Css.Val | null | undefined,
    elementStyles: ElementStyle[],
    element: Element | null,
  ): { found: boolean; value: Css.Val | null; continueLookup: boolean } {
    if (!val) {
      return { found: false, value: null, continueLookup: false };
    }
    if (val === Css.ident.initial) {
      return { found: true, value: null, continueLookup: false };
    }
    if (
      val === Css.ident.inherit ||
      val === Css.ident.unset ||
      Css.isRollbackValue(val)
    ) {
      return { found: true, value: null, continueLookup: true };
    }
    const fallbackCycleMembers = this.getFallbackCycleMembers(
      val,
      elementStyles,
      element,
    );
    if (fallbackCycleMembers) {
      fallbackCycleMembers.forEach((member) =>
        this.varResolutionState.cycleMembers.add(member),
      );
      return { found: true, value: null, continueLookup: false };
    }
    return {
      found: true,
      value: this.resolveReferencedCustomProperty(
        name,
        val,
        elementStyles,
        element,
      ),
      continueLookup: false,
    };
  }

  private resolveReferencedCustomProperty(
    name: string,
    value: Css.Val,
    elementStyles: ElementStyle[],
    element: Element | null,
  ): Css.Val | null {
    const cycleIndex = this.resolvingCustomProperties.indexOf(name);
    if (cycleIndex >= 0) {
      this.resolvingCustomProperties
        .slice(cycleIndex)
        .forEach((member) => this.varResolutionState.cycleMembers.add(member));
      return null;
    }

    const previousCycleMembers = new Set(this.varResolutionState.cycleMembers);
    this.varResolutionState.cycleMembers = new Set();
    const nestedVisitor = new VarFilterVisitor(
      elementStyles,
      this.styles,
      this.root,
      element,
      name,
    );
    nestedVisitor.resolvingCustomProperties = this.resolvingCustomProperties;
    nestedVisitor.resolvingCustomProperties.push(name);
    nestedVisitor.varResolutionState = this.varResolutionState;

    let resolvedValue: Css.Val | null = value;
    const LIMIT_LOOP = 32;
    for (let i = 0; ; i++) {
      if (i >= LIMIT_LOOP) {
        resolvedValue = null;
        break;
      }
      const after = resolvedValue.visit(nestedVisitor);
      if (nestedVisitor.error) {
        resolvedValue = null;
        break;
      }
      if (after === resolvedValue) {
        break;
      }
      resolvedValue = after;
    }

    const hadCycleMembers = this.varResolutionState.cycleMembers;
    this.varResolutionState.cycleMembers = new Set([
      ...previousCycleMembers,
      ...hadCycleMembers,
    ]);
    this.resolvingCustomProperties.pop();
    return hadCycleMembers.has(name) ? null : resolvedValue;
  }

  private getVarValue(name: string): Css.Val | null {
    let elem: Element | null = this.element ?? this.root;
    if (this.elementStyles?.length) {
      for (let index = 0; index < this.elementStyles.length; index++) {
        const style = this.elementStyles[index];
        const resolved = this.resolveCustomProperty(
          name,
          (style[name] as CascadeValue)?.value,
          this.elementStyles.slice(index),
          this.element,
        );
        if (!resolved.found) {
          continue;
        }
        if (resolved.value) {
          return resolved.value;
        }
        if (!resolved.continueLookup) {
          return null;
        }
      }
      if (this.element) {
        elem = this.element.parentElement;
      }
    }
    for (; elem; elem = elem.parentElement) {
      const style = this.styles.styleOf(elem);
      const resolved = this.resolveCustomProperty(
        name,
        (style?.[name] as CascadeValue)?.value,
        style ? [style] : [],
        elem,
      );
      if (!resolved.found) {
        continue;
      }
      if (resolved.value) {
        return resolved.value;
      }
      if (!resolved.continueLookup) {
        return null;
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
      return Css.canonicalWideKeyword(varVal);
    }
    if (
      this.currentCustomPropertyName &&
      this.varResolutionState.cycleMembers.has(this.currentCustomPropertyName)
    ) {
      this.error = true;
      return Css.empty;
    }
    // fallback value
    if (func.values.length < 2) {
      this.error = true;
      return Css.empty;
    }
    if (func.values.length === 2) {
      return Css.canonicalWideKeyword(func.values[1]);
    } else {
      return new Css.CommaList(func.values.slice(1));
    }
  }

  override visitSpaceList(list: Css.SpaceList): Css.Val {
    const values = this.visitValues(list.values);
    if (this.error) {
      return Css.empty;
    }
    if (values === list.values) {
      return list;
    }
    const flattenedValues: Css.Val[] = [];
    for (const value of values) {
      if (value instanceof Css.SpaceList) {
        flattenedValues.push(...value.values);
      } else {
        flattenedValues.push(value);
      }
    }
    return new Css.SpaceList(flattenedValues);
  }

  override visitCommaList(list: Css.CommaList): Css.Val {
    const values = this.visitValues(list.values);
    if (this.error) {
      return Css.empty;
    }
    if (values === list.values) {
      return list;
    }
    const flattenedValues: Css.Val[] = [];
    for (const value of values) {
      if (value instanceof Css.CommaList) {
        flattenedValues.push(...value.values);
      } else {
        flattenedValues.push(value);
      }
    }
    return new Css.CommaList(flattenedValues);
  }
}

/**
 * Whether a value contains a keyword, which this expression language cannot
 * evaluate as a number, e.g. the `<rounding-strategy>` of
 * `round(up, 650, 100)` (a keyword becomes a media name, which is not a
 * number). A value that contains one is valid CSS that the browser computes:
 * the calculation is left to the browser instead of being parsed here (the
 * parser would report the keyword as a syntax error) and must not be treated
 * as a calculation that computes NaN. The numeric keywords of CSS Values 4
 * (`infinity`, `NaN`) are numbers for the evaluator. (Review)
 */
class KeywordVisitor extends Css.Visitor {
  found = false;

  override visitIdent(ident: Css.Ident): Css.Val | null {
    const name = ident.name.toLowerCase();
    if (name !== "infinity" && name !== "nan") {
      this.found = true;
    }
    return null;
  }
}

function hasUnevaluableKeyword(value: Css.Val): boolean {
  const visitor = new KeywordVisitor();
  value.visit(visitor);
  return visitor.found;
}

/**
 * Convert calc() to its value
 */
export class CalcFilterVisitor extends Css.FilterVisitor {
  /**
   * Whether a calculation of the value that this visitor evaluated is `NaN`,
   * i.e. a supported function whose computed value is not a number, e.g. the
   * `log(100, 0)` of a declaration. Such a declaration is invalid at
   * computed-value time, so the property inherits, which the callers that
   * accumulate a value for a dependent property need to know. (Review)
   */
  evaluatedToNaN = false;

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
    // A function name is matched case-insensitively, e.g. `CALC(2em)`.
    if (func.name.toLowerCase() !== "calc") {
      return value;
    }
    const exprText = value.toString().replace(/^calc\b/i, "-epubx-expr");
    if (this.hasUnresolvableUnit(exprText) || hasUnevaluableKeyword(value)) {
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
        if (typeof exprResult === "number" && isNaN(exprResult)) {
          this.evaluatedToNaN = true;
        } else if (typeof exprResult === "number") {
          const numberCalculation = isNumberCalculation(exprVal.expr);
          // The dimensions of the arguments of a function that returns a
          // `<number>` whatever its arguments are, e.g. the `20px` of
          // `sign(20px)`, are numbers and not lengths, so only the dimensions
          // outside such a function say whether the calculation is a length.
          // (Review)
          const typeText = withoutNumberMathFunctionArguments(value);
          const isLength = !numberCalculation && this.isLengthExpr(typeText);
          if (isLength && Number.isFinite(exprResult)) {
            // length value
            value = new Css.Numeric(exprResult, "px");
          } else if (
            !isLength &&
            (numberCalculation || !/\d[a-z]/i.test(typeText))
          ) {
            // unitless number, which may be an infinity: a number valued
            // property such as `font-weight` clamps it to its range, while a
            // length cannot be represented as one — `calc(exp(1000) * 1px)`
            // would be serialized as the invalid `Infinitypx` — so an
            // overflowing length keeps the calc() for the browser to clamp.
            // (Review)
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

  protected hasUnresolvableUnit(exprText: string): boolean {
    return /\d(%|em|ex|cap|ch|ic|lh|p?v[whbi]|p?vmin|p?vmax)\W|\Wvar\(\s*--/i.test(
      exprText,
    );
  }

  protected isLengthExpr(exprText: string): boolean {
    return /\d(px|in|pt|pc|cm|mm|q|rem|rlh)\W/i.test(exprText);
  }

  override visitNumeric(numeric: Css.Numeric): Css.Val {
    if (
      (this.resolveViewportUnit &&
        Exprs.isViewportRelativeLengthUnit(numeric.unit)) ||
      (this.context.rootFontSize != null &&
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

export class RootSizingCalcFilterVisitor extends CalcFilterVisitor {
  protected override hasUnresolvableUnit(exprText: string): boolean {
    return /\d(%|em|ex|cap|ch|ic|p?v[whbi]|p?vmin|p?vmax)\W|\Wvar\(\s*--/i.test(
      exprText,
    );
  }

  protected override isLengthExpr(exprText: string): boolean {
    return /\d(px|in|pt|pc|cm|mm|q|rem|r?lh)\W/i.test(exprText);
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
