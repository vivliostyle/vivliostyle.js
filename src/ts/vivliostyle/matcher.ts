/**
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
 * @fileoverview Matcher - Definitions of Matcher.
 */
import * as Asserts from "./asserts";

/**
 * Checkes whether given order can be represented as an+b with a non-negative
 * interger n
 */
export const matchANPlusB = (order: number, a: number, b: number): boolean => {
  order -= b;
  if (a === 0) {
    return order === 0;
  } else {
    return order % a === 0 && order / a >= 0;
  }
};

export interface Matcher {
  matches(): boolean;
}

export class AnyMatcher implements Matcher {
  constructor(public readonly matchers: Matcher[]) {}

  /** @override */
  matches() {
    return this.matchers.some(matcher => matcher.matches());
  }
}

export class AllMatcher implements Matcher {
  constructor(public readonly matchers: Matcher[]) {}

  /** @override */
  matches() {
    return this.matchers.every(matcher => matcher.matches());
  }
}

export class NthFragmentMatcher implements Matcher {
  static fragmentIndices = {};

  static registerFragmentIndex(
    elementOffset: number,
    fragmentIndex: number,
    priority: number
  ) {
    const indices = NthFragmentMatcher.fragmentIndices;
    if (
      !indices[elementOffset] ||
      indices[elementOffset].priority <= priority
    ) {
      indices[elementOffset] = { fragmentIndex, priority };
    }
  }

  static clearFragmentIndices() {
    NthFragmentMatcher.fragmentIndices = {};
  }

  constructor(
    public readonly elementOffset: number,
    public readonly a: number,
    public readonly b: number
  ) {}

  /** @override */
  matches() {
    const entry = NthFragmentMatcher.fragmentIndices[this.elementOffset];
    return (
      entry != null &&
      entry.fragmentIndex != null &&
      matchANPlusB(entry.fragmentIndex, this.a, this.b)
    );
  }
}

export class MatcherBuilder {
  static buildViewConditionMatcher(
    elementOffset: number,
    viewCondition: string
  ): Matcher {
    const strs = viewCondition.split("_");
    if (strs[0] == "NFS") {
      return new NthFragmentMatcher(
        elementOffset,
        parseInt(strs[1], 10),
        parseInt(strs[2], 10)
      );
    } else {
      Asserts.fail(`unknown view condition. condition=${viewCondition}`);
      return null;
    }
  }

  static buildAllMatcher(matchers: Matcher[]): Matcher {
    return new AllMatcher(matchers);
  }

  static buildAnyMatcher(matchers: Matcher[]): Matcher {
    return new AnyMatcher(matchers);
  }
}
