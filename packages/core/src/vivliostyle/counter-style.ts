/**
 * Copyright 2025 Vivliostyle Foundation
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
 */

/**
 * Not implemented:
 *
 * - Support using <image> in <symbol>
 *     https://drafts.csswg.org/css-counter-styles/#typedef-symbol
 *
 * - Make the disclosure-open/closed values respond to writing modes
 *     https://drafts.csswg.org/css-counter-styles/#disclosure-open
 *   CounterStyle.format may require the writing mode as an argument.
 *   It may be necessary to extend it so that the caller can obtain the writing mode.
 *
 * - Use grapheme clusters for character counting in CounterStyle.#applyPadding.
 *     https://drafts.csswg.org/css-counter-styles/#counter-style-pad
 *   Intl.Segmenter may be useful. CounterStyle.format may require the lang as an argument.
 *
 * - Implement symbols() for defining anonymous counter styles
 *     https://drafts.csswg.org/css-counter-styles/#symbols-function
 *   Extending CounterStyle.defineAnonymous( ... ) should work.
 *
 * - Extend list-style-type to support <counter-style-name> | <symbols()>
 *     https://drafts.csswg.org/css-counter-styles/#extending-css2
 *   Currently, marker generation is delegated to the browser, so extending list-style-type would
 *   likely require injecting the mangled @counter-style into the browser.
 */

import * as Css from "./css";
import * as CssCascade from "./css-cascade";

type SetElement<T> = T extends ReadonlySet<infer U> ? U : never;

/**
 * @see https://drafts.csswg.org/css-counter-styles-3/#non-overridable-counter-style-names
 */
const nonOverridableNameList = [
  "decimal",
  "disc",
  "square",
  "circle",
  "disclosure-open",
  "disclosure-closed",
] as const;
const nonOverridableNames: ReadonlySet<
  (typeof nonOverridableNameList)[number]
> = new Set(nonOverridableNameList);

function validateNameForDefinition(name: string): boolean {
  // case-insensitive for none
  // case-sensitive for non-overridable
  return !(
    name.toLowerCase() === "none" ||
    nonOverridableNames.has(
      // @ts-expect-error check membership
      name,
    )
  );
}

const systemsDefinedBySingleIdentList = [
  "cyclic",
  "numeric",
  "alphabetic",
  "symbolic",
  "additive",
  "fixed",
] as const;
const systemsDefinedBySingleIdent: ReadonlySet<
  (typeof systemsDefinedBySingleIdentList)[number]
> = new Set(systemsDefinedBySingleIdentList);

const systemsDefinedBySpaceListList = [
  // [ fixed <integer> ]
  "fixed",
  // [ extends <counter-style-name> ]
  "extends",
] as const;
const systemsDefinedBySpaceList: ReadonlySet<
  (typeof systemsDefinedBySpaceListList)[number]
> = new Set(systemsDefinedBySpaceListList);

const notCaseInsensitiveMatchForNoneBrand = Symbol();
/**
 * @see https://drafts.csswg.org/css-counter-styles/#typedef-counter-style-name
 */
type CounterStyleName = Css.Ident & {
  [notCaseInsensitiveMatchForNoneBrand]: unknown;
};
function validateCounterStyleName(value: Css.Val): value is CounterStyleName {
  return value instanceof Css.Ident && value.name.toLowerCase() !== "none";
}
function extractCounterStyleName(name: CounterStyleName): string {
  return name.name;
}

/**
 * @see https://drafts.csswg.org/css-counter-styles/#descdef-counter-style-system
 */
type CyclicSystemValue = Css.Ident & { name: "cyclic" };
type FixedSystemValue =
  | (Css.Ident & { name: "fixed" })
  | (Css.SpaceList & { values: [Css.Ident & { name: "fixed" }, Css.Int] });
type SymbolicSystemValue = Css.Ident & { name: "symbolic" };
type AlphabeticSystemValue = Css.Ident & { name: "alphabetic" };
type NumericSystemValue = Css.Ident & { name: "numeric" };
type AdditiveSystemValue = Css.Ident & { name: "additive" };
type ExtendsSystemValue = Css.SpaceList & {
  values: [Css.Ident & { name: "extends" }, CounterStyleName];
};

type SystemDescriptorValue =
  | CyclicSystemValue
  | FixedSystemValue
  | SymbolicSystemValue
  | AlphabeticSystemValue
  | NumericSystemValue
  | AdditiveSystemValue
  | ExtendsSystemValue;

function validateSystem(value: Css.Val): value is SystemDescriptorValue {
  if (value instanceof Css.Ident) {
    return systemsDefinedBySingleIdent.has(
      // @ts-expect-error check membership
      value.name,
    );
  }
  if (value instanceof Css.SpaceList && value.values.length === 2) {
    const first = value.values[0]!;
    const second = value.values[1]!;
    if (first instanceof Css.Ident) {
      const name = first.name;
      return (
        systemsDefinedBySpaceList.has(
          // @ts-expect-error check membership
          name,
        ) &&
        ((name === "fixed" && second instanceof Css.Int) ||
          (name === "extends" && validateCounterStyleName(second)))
      );
    }
  }
  return false;
}

// Descriptors type with specific system value
type SystemDescriptors<T extends SystemDescriptorValue> =
  CssCascade.ElementStyle & {
    system: CssCascade.CascadeValue & { value: T };
  };

type CyclicDescriptors = SystemDescriptors<CyclicSystemValue>;
type FixedDescriptors = SystemDescriptors<FixedSystemValue>;
type SymbolicDescriptors =
  | CssCascade.ElementStyle
  | SystemDescriptors<SymbolicSystemValue>;
type AlphabeticDescriptors = SystemDescriptors<AlphabeticSystemValue>;
type NumericDescriptors = SystemDescriptors<NumericSystemValue>;
type AdditiveDescriptors = SystemDescriptors<AdditiveSystemValue>;
type ExtendsDescriptors = SystemDescriptors<ExtendsSystemValue>;

function isCyclicDescriptors(
  descriptors: CssCascade.ElementStyle,
): descriptors is CyclicDescriptors {
  const system = getDescriptorValue(descriptors, "system");
  return system instanceof Css.Ident && system.name === "cyclic";
}

function isFixedDescriptors(
  descriptors: CssCascade.ElementStyle,
): descriptors is FixedDescriptors {
  const system = getDescriptorValue(descriptors, "system");
  if (system instanceof Css.Ident && system.name === "fixed") {
    return true;
  }
  if (system instanceof Css.SpaceList && system.values.length === 2) {
    const [first, second] = system.values;
    return (
      first instanceof Css.Ident &&
      first.name === "fixed" &&
      second instanceof Css.Int
    );
  }
  return false;
}

function extractFixedFirstSymbolValue(descriptors: FixedDescriptors): number {
  const system = getDescriptorValue(descriptors, "system") as FixedSystemValue;
  if (system instanceof Css.Ident) {
    return 1;
  }
  return system.values[1].num;
}

function isAlphabeticDescriptors(
  descriptors: CssCascade.ElementStyle,
): descriptors is AlphabeticDescriptors {
  const system = getDescriptorValue(descriptors, "system");
  return system instanceof Css.Ident && system.name === "alphabetic";
}

function isNumericDescriptors(
  descriptors: CssCascade.ElementStyle,
): descriptors is NumericDescriptors {
  const system = getDescriptorValue(descriptors, "system");
  return system instanceof Css.Ident && system.name === "numeric";
}

function isAdditiveDescriptors(
  descriptors: CssCascade.ElementStyle,
): descriptors is AdditiveDescriptors {
  const system = getDescriptorValue(descriptors, "system");
  return system instanceof Css.Ident && system.name === "additive";
}

function isExtendsDescriptors(
  descriptors: CssCascade.ElementStyle,
): descriptors is ExtendsDescriptors {
  const system = getDescriptorValue(descriptors, "system");
  if (system instanceof Css.SpaceList && system.values.length === 2) {
    const [first, second] = system.values;
    return (
      first instanceof Css.Ident &&
      first.name === "extends" &&
      validateCounterStyleName(second)
    );
  }
  return false;
}

function extractExtendsBaseName(descriptors: ExtendsDescriptors): string {
  const system = getDescriptorValue(
    descriptors,
    "system",
  ) as ExtendsSystemValue;
  return extractCounterStyleName(system.values[1]);
}

/**
 * @see https://drafts.csswg.org/css-counter-styles/#typedef-symbol
 */
type SymbolType = Css.Str | Css.Ident;
function validateSymbol(value: Css.Val): value is SymbolType {
  return value instanceof Css.Str || value instanceof Css.Ident;
}
function extractSymbol(symbol: SymbolType): string {
  // > Identifiers are rendered as strings containing the same characters.
  return symbol instanceof Css.Str ? symbol.str : symbol.name;
}

/**
 * @see https://drafts.csswg.org/css-counter-styles/#descdef-counter-style-negative
 */
type NegativeDescriptorValue =
  | SymbolType
  | (Css.SpaceList & { values: [SymbolType, SymbolType] });
function validateNegative(value: Css.Val): value is NegativeDescriptorValue {
  if (validateSymbol(value)) {
    return true;
  }
  if (value instanceof Css.SpaceList && value.values.length === 2) {
    const first = value.values[0]!;
    const second = value.values[1]!;
    return validateSymbol(first) && validateSymbol(second);
  }
  return false;
}
type Negative = Readonly<{ prefix: string; suffix: string | null }>;
function extractNegative(negative: NegativeDescriptorValue): Negative {
  if (validateSymbol(negative)) {
    return { prefix: extractSymbol(negative), suffix: null };
  } else {
    const first = negative.values[0];
    const second = negative.values[1];
    return {
      prefix: extractSymbol(first),
      suffix: extractSymbol(second),
    };
  }
}

type RangeBound = Css.Int | (Css.Ident & { name: "infinite" });
function validateRangeBound(value: Css.Val): value is RangeBound {
  return (
    value instanceof Css.Int ||
    (value instanceof Css.Ident && value.name === "infinite")
  );
}
function extractRangeBound(bound: RangeBound, isLower: boolean): number {
  return bound instanceof Css.Int ? bound.num : isLower ? -Infinity : Infinity;
}

const upperAtOrAboveLowerBrand = Symbol();
type RangeTuple = Css.SpaceList & {
  values: [RangeBound, RangeBound] & {
    [upperAtOrAboveLowerBrand]: unknown;
  };
};
function validateRangeTuple(value: Css.Val): value is RangeTuple {
  if (!(value instanceof Css.SpaceList && value.values.length === 2)) {
    return false;
  }
  const first = value.values[0]!;
  const second = value.values[1]!;
  if (!(validateRangeBound(first) && validateRangeBound(second))) {
    return false;
  }
  const lower = extractRangeBound(first, true);
  const upper = extractRangeBound(second, false);
  if (lower > upper) {
    return false;
  }
  return true;
}
function extractRangeTuple(tuple: RangeTuple): RangeItem {
  return {
    lower: extractRangeBound(tuple.values[0], true),
    upper: extractRangeBound(tuple.values[1], false),
  };
}

/**
 * @see https://drafts.csswg.org/css-counter-styles/#descdef-counter-style-range
 */
type RangeDescriptorValue =
  | (Css.Ident & { name: "auto" })
  | RangeTuple
  | (Css.CommaList & { values: [RangeTuple, ...RangeTuple[]] });
function validateRange(value: Css.Val): value is RangeDescriptorValue {
  return (
    (value instanceof Css.Ident && value.name === "auto") ||
    validateRangeTuple(value) ||
    (value instanceof Css.CommaList &&
      value.values.length >= 1 &&
      value.values.every((tuple) => validateRangeTuple(tuple)))
  );
}
type RangeItem = Readonly<{ lower: number; upper: number }>;
type Range = readonly [RangeItem, ...RangeItem[]];
function extractRange(range: RangeDescriptorValue): Range | null {
  if (range instanceof Css.Ident) {
    return null;
  }
  // > The range of the counter style is the union of all the ranges defined in the list.
  const tuples = validateRangeTuple(range) ? [range] : range.values;
  return tuples.map((tuple) => extractRangeTuple(tuple)) as unknown as Range;
}

const nonNegativeBrand = Symbol();
type NonNegativeInt = Css.Int & { [nonNegativeBrand]: unknown };
/**
 * <integer [0,inf]> && <symbol>
 * @see https://drafts.csswg.org/css-counter-styles/#descdef-counter-style-pad
 * @see https://drafts.csswg.org/css-counter-styles/#descdef-counter-style-additive-symbols
 */
type NonNegativeIntAndSymbolSet = Css.SpaceList & {
  values: [NonNegativeInt, SymbolType] | [SymbolType, NonNegativeInt];
};
function validateNonNegativeIntAndSymbolSet(
  value: Css.Val,
): value is NonNegativeIntAndSymbolSet {
  if (!(value instanceof Css.SpaceList && value.values.length === 2)) {
    return false;
  }
  const first = value.values[0]!;
  const second = value.values[1]!;
  return (
    (first instanceof Css.Int && first.num >= 0 && validateSymbol(second)) ||
    (validateSymbol(first) && second instanceof Css.Int && second.num >= 0)
  );
}
function extractNonNegativeIntAndSymbolSet(
  set: NonNegativeIntAndSymbolSet,
): readonly [number, string] {
  const [first, second] = set.values;
  return first instanceof Css.Int
    ? [first.num, extractSymbol(second as SymbolType)]
    : [(second as NonNegativeInt).num, extractSymbol(first as SymbolType)];
}

/**
 * @see https://drafts.csswg.org/css-counter-styles/#descdef-counter-style-pad
 */
type PadDescriptorValue = NonNegativeIntAndSymbolSet;
function validatePad(value: Css.Val): value is PadDescriptorValue {
  return validateNonNegativeIntAndSymbolSet(value);
}
type Pad = Readonly<{ minLength: number; symbol: string }>;
function extractPad(pad: PadDescriptorValue): Pad {
  const [minLength, symbol] = extractNonNegativeIntAndSymbolSet(pad);
  return { minLength, symbol };
}

/**
 * @see https://drafts.csswg.org/css-counter-styles/#descdef-counter-style-symbols
 */
type SymbolsDescriptorValue =
  | SymbolType
  | (Omit<Css.SpaceList, "values"> & {
      values: readonly [SymbolType, ...SymbolType[]];
    });
function validateSymbols(value: Css.Val): value is SymbolsDescriptorValue {
  return (
    validateSymbol(value) ||
    (value instanceof Css.SpaceList &&
      value.values.length >= 1 &&
      value.values.every((val) => validateSymbol(val)))
  );
}
function extractSymbols(
  symbols: SymbolsDescriptorValue,
): readonly [string, ...string[]] {
  return validateSymbol(symbols)
    ? [extractSymbol(symbols)]
    : (symbols.values.map((symbol) => extractSymbol(symbol)) as [
        string,
        ...string[],
      ]);
}

/**
 * @see https://drafts.csswg.org/css-counter-styles/#additive-tuple
 */
type AdditiveTuple = NonNegativeIntAndSymbolSet;
const strictlyDescendingWeightOrderBrand = Symbol();
/**
 * @see https://drafts.csswg.org/css-counter-styles/#descdef-counter-style-additive-symbols
 */
type AdditiveSymbolsDescriptorValue =
  | AdditiveTuple
  | (Omit<Css.CommaList, "values"> & {
      values: [AdditiveTuple, ...AdditiveTuple[]] & {
        [strictlyDescendingWeightOrderBrand]: unknown;
      };
    });
function validateAdditiveSymbols(
  value: Css.Val,
): value is AdditiveSymbolsDescriptorValue {
  if (validateNonNegativeIntAndSymbolSet(value)) {
    return true;
  }
  if (value instanceof Css.CommaList && value.values.length >= 1) {
    let prevWeight = Infinity;
    for (const set of value.values) {
      if (!validateNonNegativeIntAndSymbolSet(set)) {
        return false;
      }
      const [weight] = extractNonNegativeIntAndSymbolSet(set);
      // must be in strictly descending weight order
      if (weight >= prevWeight) {
        return false;
      }
      prevWeight = weight;
    }
    return true;
  }
  return false;
}
type AdditiveSymbol = Readonly<{ weight: number; symbol: string }>;
function extractAdditiveSymbols(
  additiveSymbols: AdditiveSymbolsDescriptorValue,
): readonly [AdditiveSymbol, ...AdditiveSymbol[]] {
  if (validateNonNegativeIntAndSymbolSet(additiveSymbols)) {
    const [weight, symbol] = extractNonNegativeIntAndSymbolSet(additiveSymbols);
    return [{ weight, symbol }];
  } else {
    return additiveSymbols.values.map((set) => {
      const [weight, symbol] = extractNonNegativeIntAndSymbolSet(set);
      return { weight, symbol };
    }) as [AdditiveSymbol, ...AdditiveSymbol[]];
  }
}

const speakAsIdentList = [
  "auto",
  "bullets",
  "numbers",
  "words",
  "spell-out",
] as const;
const speakAsIdents: ReadonlySet<(typeof speakAsIdentList)[number]> = new Set(
  speakAsIdentList,
);

/**
 * @see https://drafts.csswg.org/css-counter-styles/#descdef-counter-style-speak-as
 */
type SpeakAsDescriptorValue =
  | (Css.Ident & {
      name: SetElement<typeof speakAsIdents>;
    })
  | CounterStyleName;
function validateSpeakAs(value: Css.Val): value is SpeakAsDescriptorValue {
  return (
    (value instanceof Css.Ident &&
      speakAsIdents.has(
        // @ts-expect-error check membership
        value.name,
      )) ||
    validateCounterStyleName(value)
  );
}

/**
 * @see https://drafts.csswg.org/css-counter-styles/
 */
export function validateDescriptorValue(name: string, value: Css.Val): boolean {
  switch (name) {
    case "system":
      return validateSystem(value);
    case "negative":
      return validateNegative(value);
    case "prefix":
    case "suffix":
      return validateSymbol(value);
    case "range":
      return validateRange(value);
    case "pad":
      return validatePad(value);
    case "fallback":
      return validateCounterStyleName(value);
    case "symbols":
      return validateSymbols(value);
    case "additive-symbols":
      return validateAdditiveSymbols(value);
    case "speak-as":
      return validateSpeakAs(value);
    default:
      // accept without validation
      return true;
  }
}

function getDescriptorValue(
  descriptors: CssCascade.ElementStyle,
  name: string,
): Css.Val | null {
  const cascadeValue = (
    descriptors[name] as CssCascade.CascadeValue | undefined
  )?.value;
  if (cascadeValue == null) {
    return null;
  }
  return cascadeValue;
}

function isInRange(value: number, range: Range): boolean {
  // > The range of the counter style is the union of all the ranges defined in the list.
  return range.some(({ lower, upper }) => value >= lower && value <= upper);
}

type CounterStyleStoreMap = Map<string, CounterStyle>;

function getDecimal(store: CounterStyleStoreMap): CounterStyle {
  let decimal = store.get("decimal");
  if (!decimal) {
    decimal = CounterStyle.createDecimal(store);
    store.set("decimal", decimal);
  }
  return decimal;
}

abstract class CounterStyle {
  protected readonly _store: CounterStyleStoreMap;

  #negative: Negative | null;
  #prefix: string | null;
  #suffix: string | null;
  #range: Range | null;
  #pad: Pad | null;
  #fallbackName: string | null;
  #symbols: readonly [string, ...string[]] | null;
  #additiveSymbols: readonly [AdditiveSymbol, ...AdditiveSymbol[]] | null;

  protected constructor(
    store: CounterStyleStoreMap,
    descriptors: CssCascade.ElementStyle,
  ) {
    this._store = store;

    const negative = getDescriptorValue(descriptors, "negative");
    this.#negative =
      negative && validateNegative(negative) ? extractNegative(negative) : null;

    const prefix = getDescriptorValue(descriptors, "prefix");
    this.#prefix =
      prefix && validateSymbol(prefix) ? extractSymbol(prefix) : null;

    const suffix = getDescriptorValue(descriptors, "suffix");
    this.#suffix =
      suffix && validateSymbol(suffix) ? extractSymbol(suffix) : null;

    const range = getDescriptorValue(descriptors, "range");
    this.#range = range && validateRange(range) ? extractRange(range) : null;

    const pad = getDescriptorValue(descriptors, "pad");
    this.#pad = pad && validatePad(pad) ? extractPad(pad) : null;

    const fallbackName = getDescriptorValue(descriptors, "fallback");
    this.#fallbackName =
      fallbackName && validateCounterStyleName(fallbackName)
        ? extractCounterStyleName(fallbackName)
        : null;

    const symbols = getDescriptorValue(descriptors, "symbols");
    this.#symbols =
      symbols && validateSymbols(symbols) ? extractSymbols(symbols) : null;

    const additiveSymbols = getDescriptorValue(descriptors, "additive-symbols");
    this.#additiveSymbols =
      additiveSymbols && validateAdditiveSymbols(additiveSymbols)
        ? extractAdditiveSymbols(additiveSymbols)
        : null;
  }

  static create(
    store: CounterStyleStoreMap,
    descriptors: CssCascade.ElementStyle,
  ): CounterStyle {
    if (isCyclicDescriptors(descriptors)) {
      return new Cyclic(store, descriptors);
    }
    if (isFixedDescriptors(descriptors)) {
      return new Fixed(store, descriptors);
    }
    if (isAlphabeticDescriptors(descriptors)) {
      return new Alphabetic(store, descriptors);
    }
    if (isNumericDescriptors(descriptors)) {
      return new Numeric(store, descriptors);
    }
    if (isAdditiveDescriptors(descriptors)) {
      return new Additive(store, descriptors);
    }
    if (isExtendsDescriptors(descriptors)) {
      return new Extends(store, descriptors);
    }
    // default
    return new Symbolic(store, descriptors);
  }

  static readonly #DECIMAL_DESCRIPTORS: CssCascade.ElementStyle = {
    system: new CssCascade.CascadeValue(Css.getName("numeric"), 0),
    symbols: new CssCascade.CascadeValue(
      new Css.SpaceList([
        new Css.Str("0"),
        new Css.Str("1"),
        new Css.Str("2"),
        new Css.Str("3"),
        new Css.Str("4"),
        new Css.Str("5"),
        new Css.Str("6"),
        new Css.Str("7"),
        new Css.Str("8"),
        new Css.Str("9"),
      ]),
      0,
    ),
  };
  static createDecimal(store: CounterStyleStoreMap): CounterStyle {
    return new Numeric(
      store,
      CounterStyle.#DECIMAL_DESCRIPTORS as NumericDescriptors,
    );
  }

  static readonly #DISC_DESCRIPTORS: CssCascade.ElementStyle = {
    system: new CssCascade.CascadeValue(Css.getName("cyclic"), 0),
    symbols: new CssCascade.CascadeValue(new Css.Str("\u2022"), 0),
    suffix: new CssCascade.CascadeValue(new Css.Str(" "), 0),
  };
  static createDisc(store: CounterStyleStoreMap): CounterStyle {
    return new Cyclic(
      store,
      CounterStyle.#DISC_DESCRIPTORS as CyclicDescriptors,
    );
  }

  static readonly #SQUARE_DESCRIPTORS: CssCascade.ElementStyle = {
    system: new CssCascade.CascadeValue(Css.getName("cyclic"), 0),
    symbols: new CssCascade.CascadeValue(new Css.Str("\u25AA"), 0),
    suffix: new CssCascade.CascadeValue(new Css.Str(" "), 0),
  };
  static createSquare(store: CounterStyleStoreMap): CounterStyle {
    return new Cyclic(
      store,
      CounterStyle.#SQUARE_DESCRIPTORS as CyclicDescriptors,
    );
  }

  static readonly #CIRCLE_DESCRIPTORS: CssCascade.ElementStyle = {
    system: new CssCascade.CascadeValue(Css.getName("cyclic"), 0),
    symbols: new CssCascade.CascadeValue(new Css.Str("\u25E6"), 0),
    suffix: new CssCascade.CascadeValue(new Css.Str(" "), 0),
  };
  static createCircle(store: CounterStyleStoreMap): CounterStyle {
    return new Cyclic(
      store,
      CounterStyle.#CIRCLE_DESCRIPTORS as CyclicDescriptors,
    );
  }

  static readonly #DISCLOSURE_OPEN_DESCRIPTORS: CssCascade.ElementStyle = {
    system: new CssCascade.CascadeValue(Css.getName("cyclic"), 0),
    symbols: new CssCascade.CascadeValue(new Css.Str("\u25BE"), 0),
    suffix: new CssCascade.CascadeValue(new Css.Str(" "), 0),
  };
  static createDisclosureOpen(store: CounterStyleStoreMap): CounterStyle {
    return new Cyclic(
      store,
      CounterStyle.#DISCLOSURE_OPEN_DESCRIPTORS as CyclicDescriptors,
    );
  }

  static readonly #DISCLOSURE_CLOSED_DESCRIPTORS: CssCascade.ElementStyle = {
    system: new CssCascade.CascadeValue(Css.getName("cyclic"), 0),
    symbols: new CssCascade.CascadeValue(new Css.Str("\u25B8"), 0),
    suffix: new CssCascade.CascadeValue(new Css.Str(" "), 0),
  };
  static createDisclosureClosed(store: CounterStyleStoreMap): CounterStyle {
    return new Cyclic(
      store,
      this.#DISCLOSURE_CLOSED_DESCRIPTORS as CyclicDescriptors,
    );
  }

  static readonly #NONE_DESCRIPTORS: CssCascade.ElementStyle = {
    system: new CssCascade.CascadeValue(Css.getName("cyclic"), 0),
    symbols: new CssCascade.CascadeValue(new Css.Str(""), 0),
    suffix: new CssCascade.CascadeValue(new Css.Str(""), 0),
  };
  static createNone(store: CounterStyleStoreMap): CounterStyle {
    return new Cyclic(
      store,
      CounterStyle.#NONE_DESCRIPTORS as CyclicDescriptors,
    );
  }

  static get CHINESE_LONGHAND_NAMES(): typeof ChineseLonghand.NAMES {
    return ChineseLonghand.NAMES;
  }
  static createChineseLonghand(
    store: CounterStyleStoreMap,
    name: SetElement<typeof ChineseLonghand.NAMES>,
  ): CounterStyle {
    return new ChineseLonghand(store, name);
  }

  static createEthiopicNumeric(store: CounterStyleStoreMap): CounterStyle {
    return new EthiopicNumeric(store);
  }

  protected _getNegative(): Negative | null {
    return this.#negative;
  }
  protected static _getNegativeFrom(style: CounterStyle): Negative | null {
    return style._getNegative();
  }
  #getNegative(): Negative {
    return this._getNegative() ?? { prefix: "-", suffix: null };
  }

  protected _getPrefix(): string | null {
    return this.#prefix;
  }
  protected static _getPrefixFrom(style: CounterStyle): string | null {
    return style._getPrefix();
  }
  #getPrefix(): string {
    return this._getPrefix() ?? "";
  }

  protected _getSuffix(): string | null {
    return this.#suffix;
  }
  protected static _getSuffixFrom(style: CounterStyle): string | null {
    return style._getSuffix();
  }
  #getSuffix(): string {
    return this._getSuffix() ?? ". ";
  }

  protected abstract _getAutoRange(): Range;
  protected static _getAutoRangeFrom(style: CounterStyle): Range {
    return style._getAutoRange();
  }
  protected _getRange(): Range | null {
    return this.#range;
  }
  protected static _getRangeFrom(style: CounterStyle): Range | null {
    return style._getRange();
  }
  #getRange(): Range {
    return this._getRange() ?? this._getAutoRange();
  }

  protected _getPad(): Pad | null {
    return this.#pad;
  }
  protected static _getPadFrom(style: CounterStyle): Pad | null {
    return style._getPad();
  }
  #getPad(): Pad {
    return this._getPad() ?? { minLength: 0, symbol: "" };
  }

  protected _getFallback(): CounterStyle | null {
    return this._store.get(this.#fallbackName) ?? null;
  }
  protected static _getFallbackFrom(style: CounterStyle): CounterStyle | null {
    return style._getFallback();
  }
  #getFallback(): CounterStyle {
    return this._getFallback() ?? getDecimal(this._store);
  }

  protected _getSymbols(): readonly [string, ...string[]] | null {
    return this.#symbols;
  }
  protected static _getSymbolsFrom(
    style: CounterStyle,
  ): readonly [string, ...string[]] | null {
    return style._getSymbols();
  }

  protected _getAdditiveSymbols():
    | readonly [AdditiveSymbol, ...AdditiveSymbol[]]
    | null {
    return this.#additiveSymbols;
  }
  protected static _getAdditiveSymbolsFrom(
    style: CounterStyle,
  ): readonly [AdditiveSymbol, ...AdditiveSymbol[]] | null {
    return style._getAdditiveSymbols();
  }

  /**
   * @see https://drafts.csswg.org/css-counter-styles-3/#generate-a-counter
   * @see https://drafts.csswg.org/css-counter-styles-3/#counter-style-pad
   */
  #applyPadding(initialRep: string, usesNegative: boolean): string {
    const { minLength, symbol: padSymbol } = this.#getPad();
    if (minLength === 0 || padSymbol === "") {
      return initialRep;
    }

    const { prefix: negPrefix, suffix: negSuffix } = this.#getNegative();
    const negativeLength = usesNegative
      ? [...negPrefix].length + (negSuffix ? [...negSuffix].length : 0)
      : 0;

    const diff = minLength - [...initialRep].length - negativeLength;
    if (diff <= 0) {
      return initialRep;
    }

    const padLength = [...padSymbol].length;
    const count = Math.ceil(diff / padLength);
    return padSymbol.repeat(count) + initialRep;
  }

  /**
   * @see https://drafts.csswg.org/css-counter-styles-3/#use-a-negative-sign
   */
  protected abstract _usesNegativeSign(value: number): boolean;
  protected static _useNegativeSignFrom(
    style: CounterStyle,
    value: number,
  ): boolean {
    return style._usesNegativeSign(value);
  }

  /**
   * @see https://drafts.csswg.org/css-counter-styles-3/#generate-a-counter
   */
  protected abstract _generateInitialRepresentation(
    value: number,
  ): string | null;
  protected static _generateInitialRepresentationFrom(
    style: CounterStyle,
    value: number,
  ): string | null {
    return style._generateInitialRepresentation(value);
  }

  /**
   * Format a counter value to its string representation.
   * @see https://drafts.csswg.org/css-counter-styles-3/#generate-a-counter
   */
  format(value: number): string {
    return this.#format(value, new Set());
  }
  #format(value: number, visited: Set<CounterStyle>): string {
    // Detect fallback loop
    if (visited.has(this)) {
      // Clear the visited set when falling back to decimal to avoid infinite recursion
      return getDecimal(this._store).#format(value, new Set());
    }
    visited.add(this);

    if (!isInRange(value, this.#getRange())) {
      const fallback = this.#getFallback();
      return fallback.#format(value, visited);
    }

    const usesNegative = this._usesNegativeSign(value);
    const absValue = usesNegative ? Math.abs(value) : value;

    const initialRep = this._generateInitialRepresentation(absValue);
    if (initialRep === null) {
      const fallback = this.#getFallback();
      return fallback.#format(value, visited);
    }

    let padded = this.#applyPadding(initialRep, usesNegative);

    if (usesNegative) {
      const { prefix: negPrefix, suffix: negSuffix } = this.#getNegative();
      padded = negPrefix + padded + (negSuffix ?? "");
    }

    return padded;
  }

  /**
   * Format a counter value with prefix and suffix for use in ::marker.
   * Unlike format(), this includes the prefix and suffix descriptors.
   * @see https://drafts.csswg.org/css-counter-styles-3/#counter-style-prefix
   * @see https://drafts.csswg.org/css-counter-styles-3/#counter-style-suffix
   */
  formatMarker(value: number): string {
    return this.#getPrefix() + this.format(value) + this.#getSuffix();
  }
}

/**
 * @see https://drafts.csswg.org/css-counter-styles-3/#cyclic-system
 */
class Cyclic extends CounterStyle {
  constructor(store: CounterStyleStoreMap, descriptors: CyclicDescriptors) {
    super(store, descriptors);
  }

  protected override _getAutoRange(): Range {
    return [{ lower: -Infinity, upper: Infinity }];
  }

  protected override _usesNegativeSign(_: number): boolean {
    return false;
  }

  protected override _generateInitialRepresentation(
    value: number,
  ): string | null {
    const symbols = this._getSymbols();
    // > If the system is cyclic, the symbols descriptor must contain at least one counter symbol,
    // > otherwise the rule does not define a counter style (but is still a valid rule).
    if (!symbols || symbols.length === 0) {
      return null;
    }
    const n = symbols.length;
    // to get proper mathematical modulo for negative values
    const idx = (((value - 1) % n) + n) % n;
    return symbols[idx];
  }
}

/**
 * @see https://drafts.csswg.org/css-counter-styles-3/#fixed-system
 */
class Fixed extends CounterStyle {
  #firstSymbolValue: number;

  constructor(store: CounterStyleStoreMap, descriptors: FixedDescriptors) {
    super(store, descriptors);
    this.#firstSymbolValue = extractFixedFirstSymbolValue(descriptors);
  }

  protected override _getAutoRange(): Range {
    return [{ lower: -Infinity, upper: Infinity }];
  }

  protected override _usesNegativeSign(_: number): boolean {
    return false;
  }

  protected override _generateInitialRepresentation(
    value: number,
  ): string | null {
    const symbols = this._getSymbols();
    // > If the system is fixed, the symbols descriptor must contain at least one counter symbol,
    // > otherwise the rule does not define a counter style (but is still a valid rule).
    if (!symbols || symbols.length === 0) {
      return null;
    }
    const idx = value - this.#firstSymbolValue;
    return symbols[idx] ?? null;
  }
}

/**
 * @see https://drafts.csswg.org/css-counter-styles-3/#symbolic-system
 */
class Symbolic extends CounterStyle {
  // Symbolic is the default system, so it accepts any ElementStyle
  // (including those without a system descriptor)
  constructor(store: CounterStyleStoreMap, descriptors: SymbolicDescriptors) {
    super(store, descriptors);
  }

  protected override _getAutoRange(): Range {
    return [{ lower: 1, upper: Infinity }];
  }

  protected override _usesNegativeSign(value: number): boolean {
    return value < 0;
  }

  protected override _generateInitialRepresentation(
    value: number,
  ): string | null {
    const symbols = this._getSymbols();
    // > If the system is symbolic, the symbols descriptor must contain at least one counter symbol,
    // > otherwise the rule does not define a counter style (but is still a valid rule).
    if (!symbols || symbols.length === 0) {
      return null;
    }
    // > This system is defined only over strictly positive counter values.
    if (value < 1) {
      return null;
    }
    const n = symbols.length;
    const chosen = symbols[(value - 1) % n];
    const count = Math.ceil(value / n);
    return chosen.repeat(count);
  }
}

/**
 * @see https://drafts.csswg.org/css-counter-styles-3/#alphabetic-system
 */
class Alphabetic extends CounterStyle {
  constructor(store: CounterStyleStoreMap, descriptors: AlphabeticDescriptors) {
    super(store, descriptors);
  }

  protected override _getAutoRange(): Range {
    return [{ lower: 1, upper: Infinity }];
  }

  protected override _usesNegativeSign(value: number): boolean {
    return value < 0;
  }

  protected override _generateInitialRepresentation(
    value: number,
  ): string | null {
    const symbols = this._getSymbols();
    // > If the system is alphabetic, the symbols descriptor must contain at least two counter symbols,
    // > otherwise the rule does not define a counter style (but is still a valid rule).
    if (!symbols || symbols.length < 2) {
      return null;
    }
    // > This system is defined only over strictly positive counter values.
    if (value < 1) {
      return null;
    }
    const n = symbols.length;
    let s = "";
    let v = value;
    while (v !== 0) {
      v = v - 1;
      s = symbols[v % n] + s;
      v = Math.floor(v / n);
    }
    return s;
  }
}

/**
 * @see https://drafts.csswg.org/css-counter-styles-3/#numeric-system
 */
class Numeric extends CounterStyle {
  constructor(store: CounterStyleStoreMap, descriptors: NumericDescriptors) {
    super(store, descriptors);
  }

  protected override _getAutoRange(): Range {
    return [{ lower: -Infinity, upper: Infinity }];
  }

  protected override _usesNegativeSign(value: number): boolean {
    return value < 0;
  }

  protected override _generateInitialRepresentation(
    value: number,
  ): string | null {
    const symbols = this._getSymbols();
    // > If the system is numeric, the symbols descriptor must contain at least two counter symbols,
    // > otherwise the rule does not define a counter style (but is still a valid rule).
    if (!symbols || symbols.length < 2) {
      return null;
    }
    const n = symbols.length;
    if (value === 0) {
      return symbols[0];
    }
    let s = "";
    let v = value;
    while (v !== 0) {
      s = symbols[v % n] + s;
      v = Math.floor(v / n);
    }
    return s;
  }
}

/**
 * @see https://drafts.csswg.org/css-counter-styles-3/#additive-system
 */
class Additive extends CounterStyle {
  constructor(store: CounterStyleStoreMap, descriptors: AdditiveDescriptors) {
    super(store, descriptors);
  }

  protected override _getAutoRange(): Range {
    return [{ lower: 0, upper: Infinity }];
  }

  protected override _usesNegativeSign(value: number): boolean {
    return value < 0;
  }

  protected override _generateInitialRepresentation(
    value: number,
  ): string | null {
    const tuples = this._getAdditiveSymbols();
    // > If the system is additive, the additive-symbols descriptor must contain at least one additive tuple,
    // > otherwise the rule does not define a counter style (but is still a valid rule).
    if (!tuples || tuples.length === 0) {
      return null;
    }

    let s = "";

    if (value === 0) {
      const zeroTuple = tuples.find((t) => t.weight === 0);
      return zeroTuple ? zeroTuple.symbol : null;
    }

    let remaining = value;
    for (const tuple of tuples) {
      const { weight, symbol } = tuple;
      if (weight === 0 || weight > remaining) {
        continue;
      }
      const reps = Math.floor(remaining / weight);
      s += symbol.repeat(reps);
      remaining -= weight * reps;
      if (remaining === 0) {
        return s;
      }
    }

    return null;
  }
}

/**
 * @see https://drafts.csswg.org/css-counter-styles/#extends-system
 */
class Extends extends CounterStyle {
  #baseName: string;

  constructor(store: CounterStyleStoreMap, descriptors: ExtendsDescriptors) {
    super(store, descriptors);
    const baseName = extractExtendsBaseName(descriptors);
    // > If the specified <counter-style-name> is an ASCII case-insensitive match
    // > for disc, circle, square, disclosure-open, or disclosure-closed ...
    const lowerName = baseName.toLowerCase();
    if (
      lowerName === "disc" ||
      lowerName === "circle" ||
      lowerName === "square" ||
      lowerName === "disclosure-open" ||
      lowerName === "disclosure-closed"
    ) {
      this.#baseName = lowerName;
    } else {
      this.#baseName = baseName;
    }
  }

  #resolveBaseStyle(visited: Set<CounterStyle> = new Set()): CounterStyle {
    // Detect cycle
    if (visited.has(this)) {
      return getDecimal(this._store);
    }
    visited.add(this);

    const targetStyle = this._store.get(this.#baseName);
    if (!targetStyle) {
      return getDecimal(this._store);
    }

    if (targetStyle instanceof Extends) {
      return targetStyle.#resolveBaseStyle(visited);
    }

    return targetStyle;
  }

  protected override _getNegative(): Negative | null {
    return (
      super._getNegative() ??
      CounterStyle._getNegativeFrom(this.#resolveBaseStyle())
    );
  }

  protected override _getPrefix(): string | null {
    return (
      super._getPrefix() ??
      CounterStyle._getPrefixFrom(this.#resolveBaseStyle())
    );
  }

  protected override _getSuffix(): string | null {
    return (
      super._getSuffix() ??
      CounterStyle._getSuffixFrom(this.#resolveBaseStyle())
    );
  }

  protected override _getAutoRange(): Range {
    return CounterStyle._getAutoRangeFrom(this.#resolveBaseStyle());
  }
  protected override _getRange(): Range | null {
    return (
      super._getRange() ?? CounterStyle._getRangeFrom(this.#resolveBaseStyle())
    );
  }

  protected override _getPad(): Pad | null {
    return (
      super._getPad() ?? CounterStyle._getPadFrom(this.#resolveBaseStyle())
    );
  }

  protected override _getFallback(): CounterStyle | null {
    return (
      super._getFallback() ??
      CounterStyle._getFallbackFrom(this.#resolveBaseStyle())
    );
  }

  protected override _getSymbols(): readonly [string, ...string[]] | null {
    return (
      super._getSymbols() ??
      CounterStyle._getSymbolsFrom(this.#resolveBaseStyle())
    );
  }

  protected override _getAdditiveSymbols():
    | readonly [AdditiveSymbol, ...AdditiveSymbol[]]
    | null {
    return (
      super._getAdditiveSymbols() ??
      CounterStyle._getAdditiveSymbolsFrom(this.#resolveBaseStyle())
    );
  }

  protected override _usesNegativeSign(value: number): boolean {
    return CounterStyle._useNegativeSignFrom(this.#resolveBaseStyle(), value);
  }

  protected override _generateInitialRepresentation(
    value: number,
  ): string | null {
    // > If a @counter-style uses the extends system, it must not contain a symbols or additive-symbols descriptor,
    // > otherwise the rule does not define a counter style (but is still a valid rule).
    if (super._getSymbols() || super._getAdditiveSymbols()) {
      return null;
    }

    return CounterStyle._generateInitialRepresentationFrom(
      this.#resolveBaseStyle(),
      value,
    );
  }
}

type ChineseLonghandSetting = Readonly<{
  chars: Readonly<{
    digits: readonly [
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
    ];
    markers: readonly [string, string, string, string];
    informal: boolean;
  }>;
  descriptors: CssCascade.ElementStyle;
}>;

const chineseLonghandNameList = [
  "simp-chinese-informal",
  "simp-chinese-formal",
  "trad-chinese-informal",
  "trad-chinese-formal",
  "cjk-ideographic",
] as const;

/**
 * @see https://drafts.csswg.org/css-counter-styles-3/#limited-chinese
 */
class ChineseLonghand extends CounterStyle {
  static readonly #SIMP_CHINESE_INFORMAL: ChineseLonghandSetting = {
    chars: {
      digits: [
        "\u96F6",
        "\u4E00",
        "\u4E8C",
        "\u4E09",
        "\u56DB",
        "\u4E94",
        "\u516D",
        "\u4E03",
        "\u516B",
        "\u4E5D",
      ],
      markers: ["", "\u5341", "\u767E", "\u5343"],
      informal: true,
    },
    descriptors: {
      suffix: new CssCascade.CascadeValue(new Css.Str("\u3001"), 0),
      fallback: new CssCascade.CascadeValue(Css.getName("cjk-decimal"), 0),
      range: new CssCascade.CascadeValue(
        new Css.SpaceList([new Css.Int(-9999), new Css.Int(9999)]),
        0,
      ),
      negative: new CssCascade.CascadeValue(new Css.Str("\u8D1F"), 0),
    },
  };
  static readonly #SIMP_CHINESE_FORMAL: ChineseLonghandSetting = {
    chars: {
      digits: [
        "\u96F6",
        "\u58F9",
        "\u8D30",
        "\u53C1",
        "\u8086",
        "\u4F0D",
        "\u9646",
        "\u67D2",
        "\u634C",
        "\u7396",
      ],
      markers: ["", "\u62FE", "\u4F70", "\u4EDF"],
      informal: false,
    },
    descriptors: {
      suffix: new CssCascade.CascadeValue(new Css.Str("\u3001"), 0),
      fallback: new CssCascade.CascadeValue(Css.getName("cjk-decimal"), 0),
      range: new CssCascade.CascadeValue(
        new Css.SpaceList([new Css.Int(-9999), new Css.Int(9999)]),
        0,
      ),
      negative: new CssCascade.CascadeValue(new Css.Str("\u8D1F"), 0),
    },
  };
  static readonly #TRAD_CHINESE_INFORMAL: ChineseLonghandSetting = {
    chars: {
      digits: [
        "\u96F6",
        "\u4E00",
        "\u4E8C",
        "\u4E09",
        "\u56DB",
        "\u4E94",
        "\u516D",
        "\u4E03",
        "\u516B",
        "\u4E5D",
      ],
      markers: ["", "\u5341", "\u767E", "\u5343"],
      informal: true,
    },
    descriptors: {
      suffix: new CssCascade.CascadeValue(new Css.Str("\u3001"), 0),
      fallback: new CssCascade.CascadeValue(Css.getName("cjk-decimal"), 0),
      range: new CssCascade.CascadeValue(
        new Css.SpaceList([new Css.Int(-9999), new Css.Int(9999)]),
        0,
      ),
      negative: new CssCascade.CascadeValue(new Css.Str("\u8CA0"), 0),
    },
  };
  static readonly #TRAD_CHINESE_FORMAL: ChineseLonghandSetting = {
    chars: {
      digits: [
        "\u96F6",
        "\u58F9",
        "\u8CB3",
        "\u53C3",
        "\u8086",
        "\u4F0D",
        "\u9678",
        "\u67D2",
        "\u634C",
        "\u7396",
      ],
      markers: ["", "\u62FE", "\u4F70", "\u4EDF"],
      informal: false,
    },
    descriptors: {
      suffix: new CssCascade.CascadeValue(new Css.Str("\u3001"), 0),
      fallback: new CssCascade.CascadeValue(Css.getName("cjk-decimal"), 0),
      range: new CssCascade.CascadeValue(
        new Css.SpaceList([new Css.Int(-9999), new Css.Int(9999)]),
        0,
      ),
      negative: new CssCascade.CascadeValue(new Css.Str("\u8CA0"), 0),
    },
  };
  static readonly NAMES: ReadonlySet<(typeof chineseLonghandNameList)[number]> =
    new Set(chineseLonghandNameList);
  static readonly #SETTINGS: ReadonlyMap<
    SetElement<typeof ChineseLonghand.NAMES>,
    ChineseLonghandSetting
  > = new Map([
    ["simp-chinese-informal", ChineseLonghand.#SIMP_CHINESE_INFORMAL],
    ["simp-chinese-formal", ChineseLonghand.#SIMP_CHINESE_FORMAL],
    ["trad-chinese-informal", ChineseLonghand.#TRAD_CHINESE_INFORMAL],
    ["trad-chinese-formal", ChineseLonghand.#TRAD_CHINESE_FORMAL],
    // > This counter style is identical to trad-chinese-informal. (It exists for legacy reasons.)
    ["cjk-ideographic", ChineseLonghand.#TRAD_CHINESE_INFORMAL],
  ]);

  #chars: ChineseLonghandSetting["chars"];

  constructor(
    store: CounterStyleStoreMap,
    name: SetElement<typeof ChineseLonghand.NAMES>,
  ) {
    const { chars, descriptors } = ChineseLonghand.#SETTINGS.get(name)!;
    super(store, descriptors);
    this.#chars = chars;
  }

  protected override _getAutoRange(): Range {
    return [{ lower: -9999, upper: 9999 }];
  }

  protected override _usesNegativeSign(value: number): boolean {
    return value < 0;
  }

  protected override _generateInitialRepresentation(
    value: number,
  ): string | null {
    const chars = this.#chars;

    // Step 1: If the counter value is 0, return the character for 0
    if (value === 0) {
      return chars.digits[0];
    }

    // Build representation with digit markers
    // Process each digit from thousands to ones
    const digits: { digit: number; position: number }[] = [];
    let pos = 0;
    let temp = value;
    while (temp > 0) {
      digits.unshift({ digit: temp % 10, position: pos });
      temp = Math.floor(temp / 10);
      pos++;
    }

    // For informal styles, if value is 10-19, remove tens digit (leave marker)
    const removeTensDigit = chars.informal && value >= 10 && value <= 19;

    // Build the result string
    let result = "";
    let lastWasZero = false;

    for (let i = 0; i < digits.length; i++) {
      const { digit, position } = digits[i];
      const isLastDigit = i === digits.length - 1;

      if (digit === 0) {
        // Collapse consecutive zeros and drop trailing zeros
        if (!isLastDigit && !lastWasZero) {
          // Mark that we encountered a zero (will add it if followed by non-zero)
          lastWasZero = true;
        }
      } else {
        // Add collapsed zero if needed
        if (lastWasZero) {
          result += chars.digits[0];
          lastWasZero = false;
        }

        // Skip tens digit for informal 10-19
        if (removeTensDigit && position === 1) {
          // Add only the marker, not the digit
          result += chars.markers[position];
        } else {
          // Add digit + marker
          result += chars.digits[digit];
          if (position > 0) {
            result += chars.markers[position];
          }
        }
      }
    }

    return result;
  }
}

/**
 * @see https://drafts.csswg.org/css-counter-styles-3/#ethiopic-numeric-counter-style
 */
class EthiopicNumeric extends CounterStyle {
  static readonly #DESCRIPTORS = {
    range: new CssCascade.CascadeValue(
      new Css.SpaceList([new Css.Int(1), Css.getName("infinite")]),
      0,
    ),
    suffix: new CssCascade.CascadeValue(new Css.Str("/ "), 0),
  } as const;

  static readonly #TENS = [
    "", // 0
    "\u1372", // 10
    "\u1373", // 20
    "\u1374", // 30
    "\u1375", // 40
    "\u1376", // 50
    "\u1377", // 60
    "\u1378", // 70
    "\u1379", // 80
    "\u137A", // 90
  ] as const;

  static readonly #UNITS = [
    "", // 0
    "\u1369", // 1
    "\u136A", // 2
    "\u136B", // 3
    "\u136C", // 4
    "\u136D", // 5
    "\u136E", // 6
    "\u136F", // 7
    "\u1370", // 8
    "\u1371", // 9
  ] as const;

  static readonly #HUNDRED = "\u137B"; // U+137B (odd index separator / 100)
  static readonly #TEN_THOUSAND = "\u137C"; // U+137C (even index separator / 10000)

  constructor(store: CounterStyleStoreMap) {
    super(store, EthiopicNumeric.#DESCRIPTORS);
  }

  protected override _getAutoRange(): Range {
    return [{ lower: 1, upper: Infinity }];
  }

  protected override _usesNegativeSign(_: number): boolean {
    // > The ethiopic-numeric counter style is defined for all positive non-zero numbers.
    return false;
  }

  protected override _generateInitialRepresentation(
    value: number,
  ): string | null {
    // > The ethiopic-numeric counter style is defined for all positive non-zero numbers.
    if (value < 1) {
      return null;
    }

    // Step 1: If the number is 1, return U+1369
    if (value === 1) {
      return EthiopicNumeric.#UNITS[1];
    }

    // Step 2: Split the number into groups of two digits, starting with the least significant
    const groups: number[] = [];
    let remaining = value;
    while (remaining > 0) {
      groups.push(remaining % 100);
      remaining = Math.floor(remaining / 100);
    }

    // groups[0] is least significant, groups[length-1] is most significant
    const numGroups = groups.length;

    // Build output from most significant to least significant
    let result = "";
    for (let i = numGroups - 1; i >= 0; i--) {
      const groupValue = groups[i];
      const isOddIndex = i % 2 === 1;
      const isMostSignificant = i === numGroups - 1;

      // Step 4: Determine if digits should be removed
      // - If the group has the value zero
      // - If the group is the most significant one and has the value 1
      // - If the group has an odd index and has the value 1
      const removeDigits =
        groupValue === 0 ||
        (isMostSignificant && groupValue === 1) ||
        (isOddIndex && groupValue === 1);

      // Step 5: For each remaining digit, substitute the relevant ethiopic character
      if (!removeDigits) {
        const tens = Math.floor(groupValue / 10);
        const units = groupValue % 10;
        result += EthiopicNumeric.#TENS[tens] + EthiopicNumeric.#UNITS[units];
      }

      // Step 6 & 7: Append separators
      if (isOddIndex) {
        // Step 6: For odd index groups, except those with original value 0, append U+137B
        if (groupValue !== 0) {
          result += EthiopicNumeric.#HUNDRED;
        }
      } else {
        // Step 7: For even index groups, except group 0, append U+137C
        if (i !== 0) {
          result += EthiopicNumeric.#TEN_THOUSAND;
        }
      }
    }

    return result;
  }
}

export class CounterStyleStore {
  #store: CounterStyleStoreMap;

  constructor() {
    this.#store = new Map();

    this.#store.set("none", CounterStyle.createNone(this.#store));

    // non-overridable counter-style names
    // https://drafts.csswg.org/css-counter-styles/#non-overridable-counter-style-names
    this.#store.set("decimal", CounterStyle.createDecimal(this.#store));
    this.#store.set("disc", CounterStyle.createDisc(this.#store));
    this.#store.set("square", CounterStyle.createSquare(this.#store));
    this.#store.set("circle", CounterStyle.createCircle(this.#store));
    this.#store.set(
      "disclosure-open",
      CounterStyle.createDisclosureOpen(this.#store),
    );
    this.#store.set(
      "disclosure-closed",
      CounterStyle.createDisclosureClosed(this.#store),
    );

    // Chinese longhand styles
    // https://drafts.csswg.org/css-counter-styles/#limited-chinese
    for (const name of CounterStyle.CHINESE_LONGHAND_NAMES) {
      this.#store.set(
        name,
        CounterStyle.createChineseLonghand(this.#store, name),
      );
    }

    // Ethiopic numeric counter style
    // https://drafts.csswg.org/css-counter-styles/#ethiopic-numeric-counter-style
    this.#store.set(
      "ethiopic-numeric",
      CounterStyle.createEthiopicNumeric(this.#store),
    );
  }

  define(
    name: string,
    descriptors: CssCascade.ElementStyle,
  ): CounterStyle | null {
    if (!validateNameForDefinition(name)) {
      return null;
    }
    const counterStyle = CounterStyle.create(this.#store, descriptors);
    this.#store.set(name, counterStyle);
    return counterStyle;
  }

  getStyle(name: string): CounterStyle | null {
    return this.#store.get(name) ?? null;
  }

  /**
   * Format a counter value using the specified counter style.
   * @see https://drafts.csswg.org/css-counter-styles/
   */
  format(name: string, value: number): string {
    return (this.getStyle(name) ?? getDecimal(this.#store)).format(value);
  }

  /**
   * Format a counter value with prefix and suffix for use in ::marker.
   * Not yet in use, but will be used in the future. #732
   * @see https://drafts.csswg.org/css-counter-styles/
   */
  formatMarker(name: string, value: number): string {
    return (this.getStyle(name) ?? getDecimal(this.#store)).formatMarker(value);
  }
}
