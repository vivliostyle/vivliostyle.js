/**
 * Copyright 2016 Trim-marks Inc.
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
 * @fileoverview Control fragmentation
 */
import * as css from '../adapt/css';
import {plugin} from './plugin';

/**
 * Convert old page-break-* properties to break-* properties with appropriate
 * values as specified by CSS Fragmentation module:
 * https://drafts.csswg.org/css-break/#page-break-properties
 */
export const convertPageBreakAliases =
    (original: {name: string, value: css.Val, important: boolean}):
        {name: string, value: css.Val, important: boolean} => {
          const name = original['name'];
          const value = original['value'];
          switch (name) {
            case 'page-break-before':
            case 'page-break-after':
            case 'page-break-inside':
              return {
                'name': name.replace(/^page-/, ''),
                'value': value === css.ident.always ? css.ident.page : value,
                'important': original['important']
              };
            default:
              return original;
          }
        };

export function registerBreakPlugin() {
  plugin.registerHook('SIMPLE_PROPERTY', convertPageBreakAliases);
}

export const forcedBreakValues: {[key: string]: boolean|null} = {
  'page': true,
  'left': true,
  'right': true,
  'recto': true,
  'verso': true,
  'column': true,
  'region': true
};

/**
 * Returns if the value is one of the forced break values.
 * @param value The break value to be judged. Treats null as 'auto'.
 */
export const isForcedBreakValue = (value: string|null): boolean =>
    !!forcedBreakValues[value];

export const avoidBreakValues: {[key: string]: boolean|null} = {
  'avoid': true,
  'avoid-page': true,
  'avoid-column': true,
  'avoid-region': true
};

/**
 * Returns if the value is one of the avoid break values.
 * @param value The break value to be judged. Treats null as 'auto'.
 */
export const isAvoidBreakValue = (value: string|null): boolean =>
    !!avoidBreakValues[value];

/**
 * Resolves the effective break value given two break values at a single break
 * point. The order of the arguments are relevant, since a value specified on
 * the latter element takes precedence over one on the former. A forced break
 * value is chosen if present. Otherwise, an avoid break value is chosen if
 * present. See CSS Fragmentation Module for the rule:
 *  https://drafts.csswg.org/css-break/#forced-breaks
 *  https://drafts.csswg.org/css-break/#unforced-breaks
 * Note that though the spec requires to honor multiple break values at a single
 * break point, the current implementation choose one of them and discard the
 * others.
 * @param first The break value specified on the former element. null means
 *     'auto' (not specified)
 * @param second The break value specified on the latter element. null means
 *     'auto' (not specified)
 */
export const resolveEffectiveBreakValue =
    (first: string|null, second: string|null): string|null => {
      if (!first) {
        return second;
      } else if (!second) {
        return first;
      } else {
        const firstIsForcedBreakValue = isForcedBreakValue(first);
        const secondIsForcedBreakValue = isForcedBreakValue(second);
        if (firstIsForcedBreakValue && secondIsForcedBreakValue) {
          switch (second) {
            case 'column':

              // "column" is the weakest value
              return first;
            case 'region':

              // "region" is stronger than "column" but weaker than page
              // values
              return first === 'column' ? second : first;
            default:

              // page values are strongest
              return second;
          }
        } else if (secondIsForcedBreakValue) {
          return second;
        } else if (firstIsForcedBreakValue) {
          return first;
        } else if (isAvoidBreakValue(second)) {
          return second;
        } else if (isAvoidBreakValue(first)) {
          return first;
        } else {
          return second;
        }
      }
    };

export const breakValueToStartSideValue = (breakValue: string|null): string => {
  switch (breakValue) {
    case 'left':
    case 'right':
    case 'recto':
    case 'verso':
      return breakValue;
    default:
      return 'any';
  }
};

export const startSideValueToBreakValue =
    (startSideValue: string): string|null => {
      switch (startSideValue) {
        case 'left':
        case 'right':
        case 'recto':
        case 'verso':
          return startSideValue;
        default:
          return null;
      }
    };
