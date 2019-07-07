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
 * @fileoverview Parse validation rules (validation.txt), validate properties
 * and shorthands.
 */
import * as logging from '../vivliostyle/logging';
import * as base from './base';
import * as css from './css';
import * as cssparse from './cssparse';
import * as csstok from './csstok';
import * as net from './net';
import * as task from './task';
import * as taskutil from './taskutil';

export interface PropertyReceiver {
  unknownProperty(name: string, value: css.Val): void;

  invalidPropertyValue(name: string, value: css.Val): void;

  simpleProperty(name: string, value: css.Val, important): void;
}

export class Node {
  success: Node = null;
  failure: Node = null;
  code: number = 0;

  constructor(public validator: PropertyValidator) {}

  isSpecial(): boolean {
    return this.code != 0;
  }

  markAsStartGroup(): void {
    this.code = -1;
  }

  isStartGroup(): boolean {
    return this.code == -1;
  }

  markAsEndGroup(): void {
    this.code = -2;
  }

  isEndGroup(): boolean {
    return this.code == -2;
  }

  markAsStartAlternate(index: number): void {
    this.code = 2 * index + 1;
  }

  isStartAlternate(): boolean {
    return this.code > 0 && this.code % 2 != 0;
  }

  markAsEndAlternate(index: number): void {
    this.code = 2 * index + 2;
  }

  isEndAlternate(): boolean {
    return this.code > 0 && this.code % 2 == 0;
  }

  getAlternate(): number {
    return Math.floor((this.code - 1) / 2);
  }
}

export class Connection {
  what: number = -1;

  constructor(public where: number, public success: boolean) {}
}

/**
 * @enum {number}
 */
export enum Add {
  FOLLOW = 1,
  OPTIONAL,
  REPEATED,
  ALTERNATE
}

/**
 * A class to build a list validator from other validators.
 */
export class ValidatingGroup {
  nodes: Node[] = [];
  connections: Connection[] = [];
  match: number[] = [];

  // connector indicies
  nomatch: number[] = [];

  // connector indicies
  error: number[] = [];

  // connector indicies
  emptyHead: boolean = true;

  connect(arr: number[], nodeIndex: number): void {
    for (let i = 0; i < arr.length; i++) {
      this.connections[arr[i]].what = nodeIndex;
    }
    arr.splice(0, arr.length);
  }

  clone(): ValidatingGroup {
    const group = new ValidatingGroup();
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      const clonedNode = new Node(node.validator);
      clonedNode.code = node.code;
      group.nodes.push(clonedNode);
    }
    for (let i = 0; i < this.connections.length; i++) {
      const connection = this.connections[i];
      const groupConnection =
          new Connection(connection.where, connection.success);
      groupConnection.what = connection.what;
      group.connections.push(groupConnection);
    }
    group.match.push(...this.match);
    group.nomatch.push(...this.nomatch);
    group.error.push(...this.error);
    return group;
  }

  /**
   * Add "special" validation node to a given array (match, nomatch, or error).
   * @param start if this a start or the end of a clause/group
   * @param clause 0 indicates group start/end, otherwise clause index
   */
  private addSpecialToArr(arr: number[], start: boolean, clause: number): void {
    const index = this.nodes.length;
    const node = new Node(ALWAYS_FAIL);
    if (clause >= 0) {
      if (start) {
        node.markAsStartAlternate(clause);
      } else {
        node.markAsEndAlternate(clause);
      }
    } else {
      if (start) {
        node.markAsStartGroup();
      } else {
        node.markAsEndGroup();
      }
    }
    this.nodes.push(node);
    this.connect(arr, index);
    const success = new Connection(index, true);
    const failure = new Connection(index, false);
    arr.push(this.connections.length);
    this.connections.push(failure);
    arr.push(this.connections.length);
    this.connections.push(success);
  }

  endSpecialGroup(): void {
    const arrs = [this.match, this.nomatch, this.error];
    for (let i = 0; i < arrs.length; i++) {
      this.addSpecialToArr(arrs[i], false, -1);
    }
  }

  startSpecialGroup(): void {
    if (this.nodes.length) {
      throw new Error('invalid call');
    }
    this.addSpecialToArr(this.match, true, -1);
  }

  endClause(clause: number): void {
    this.addSpecialToArr(this.match, false, clause);
  }

  startClause(clause: number): void {
    if (this.nodes.length) {
      throw new Error('invalid call');
    }
    const node = new Node(ALWAYS_FAIL);
    node.markAsStartAlternate(clause);
    this.nodes.push(node);
    const success = new Connection(0, true);
    const failure = new Connection(0, false);
    this.nomatch.push(this.connections.length);
    this.connections.push(failure);
    this.match.push(this.connections.length);
    this.connections.push(success);
  }

  addPrimitive(validator: PropertyValidator): void {
    const index = this.nodes.length;
    this.nodes.push(new Node(validator));
    const success = new Connection(index, true);
    const failure = new Connection(index, false);
    this.connect(this.match, index);
    if (this.emptyHead) {
      // if did not validate -> no match
      this.nomatch.push(this.connections.length);
      this.emptyHead = false;
    } else {
      // if did not validate -> failure
      this.error.push(this.connections.length);
    }
    this.connections.push(failure);
    this.match.push(this.connections.length);
    this.connections.push(success);
  }

  isSimple(): boolean {
    return this.nodes.length == 1 && !this.nodes[0].isSpecial();
  }

  isPrimitive(): boolean {
    return this.isSimple() &&
        this.nodes[0].validator instanceof PrimitiveValidator;
  }

  addGroup(group: ValidatingGroup, how: Add): void {
    if (group.nodes.length == 0) {
      return;
    }
    const index = this.nodes.length;

    // optimization for alternate primitive validators
    if (how == Add.ALTERNATE && index == 1 && group.isPrimitive() &&
        this.isPrimitive()) {
      this.nodes[0].validator =
          (this.nodes[0].validator as PrimitiveValidator)
              .combine((group.nodes[0].validator as PrimitiveValidator));
      return;
    }
    for (let i = 0; i < group.nodes.length; i++) {
      this.nodes.push(group.nodes[i]);
    }

    // nodes[index] is group start
    if (how == Add.ALTERNATE) {
      this.emptyHead = true;
      this.connect(this.nomatch, index);
    } else {
      this.connect(this.match, index);
    }
    const connectionIndex = this.connections.length;
    for (let i = 0; i < group.connections.length; i++) {
      const connection = group.connections[i];
      connection.where += index;
      if (connection.what >= 0) {
        connection.what += index;
      }
      this.connections.push(connection);
    }
    for (let i = 0; i < group.match.length; i++) {
      this.match.push(group.match[i] + connectionIndex);
    }
    if (how == Add.REPEATED) {
      this.connect(this.match, index);
    }
    if (how == Add.OPTIONAL || how == Add.REPEATED) {
      for (let i = 0; i < group.nomatch.length; i++) {
        this.match.push(group.nomatch[i] + connectionIndex);
      }
    } else if (this.emptyHead) {
      for (let i = 0; i < group.nomatch.length; i++) {
        this.nomatch.push(group.nomatch[i] + connectionIndex);
      }
      this.emptyHead = group.emptyHead;
    } else {
      for (let i = 0; i < group.nomatch.length; i++) {
        this.error.push(group.nomatch[i] + connectionIndex);
      }
    }
    for (let i = 0; i < group.error.length; i++) {
      this.error.push(group.error[i] + connectionIndex);
    }

    // invalidate group
    group.nodes = null;
    group.connections = null;
  }

  /**
   * @return how
   */
  finish(successTerminal: Node, failTerminal: Node): Node {
    const index = this.nodes.length;
    this.nodes.push(successTerminal);
    this.nodes.push(failTerminal);
    this.connect(this.match, index);
    this.connect(this.nomatch, index + 1);
    this.connect(this.error, index + 1);
    for (const connection of this.connections) {
      if (connection.success) {
        this.nodes[connection.where].success = this.nodes[connection.what];
      } else {
        this.nodes[connection.where].failure = this.nodes[connection.what];
      }
    }

    // make sure that our data structure is correct
    for (let j = 0; j < index; j++) {
      if (this.nodes[j].failure == null || this.nodes[j].success == null) {
        throw new Error('Invalid validator state');
      }
    }
    return this.nodes[0];
  }
}

export const ALLOW_EMPTY = 1;

export const ALLOW_STR = 2;

export const ALLOW_IDENT = 4;

export const ALLOW_POS_NUMERIC = 8;

export const ALLOW_POS_NUM = 16;

export const ALLOW_POS_INT = 32;

export const ALLOW_COLOR = 64;

export const ALLOW_URL = 128;

export const ALLOW_NEGATIVE = 256;

export const ALLOW_ZERO = 512;

export const ALLOW_ZERO_PERCENT = 1024;

export const ALLOW_SLASH = 2048;

export type ValueMap = {
  [key: string]: css.Val
};

/**
 * Abstract class to validate simple CSS property value (not a shorthand)
 */
export class PropertyValidator extends css.Visitor {
  constructor() {
    super();
  }

  /**
   * Validate a subsequence of the given values from the given index. Return the
   * list of matched values or null if there is no match.
   */
  validateForShorthand(values: css.Val[], index: number): css.Val[] {
    const rval = values[index].visit(this);
    if (rval) {
      return [rval];
    }
    return null;
  }
}

/**
 * Validate a primitive CSS value (not a list or function).
 * @param allowed mask of ALLOW_*** constants.
 */
export class PrimitiveValidator extends PropertyValidator {
  constructor(
      public readonly allowed: number, public readonly idents: ValueMap,
      public readonly units: ValueMap) {
    super();
  }

  /**
   * @override
   */
  visitEmpty(empty) {
    if (this.allowed & ALLOW_EMPTY) {
      return empty;
    }
    return null;
  }

  /**
   * @override
   */
  visitSlash(slash) {
    if (this.allowed & ALLOW_SLASH) {
      return slash;
    }
    return null;
  }

  /**
   * @override
   */
  visitStr(str) {
    if (this.allowed & ALLOW_STR) {
      return str;
    }
    return null;
  }

  /**
   * @override
   */
  visitIdent(ident) {
    const val = this.idents[ident.name.toLowerCase()];
    if (val) {
      return val;
    }
    if (this.allowed & ALLOW_IDENT) {
      return ident;
    }
    return null;
  }

  /**
   * @override
   */
  visitNumeric(numeric) {
    if (numeric.num == 0 && !(this.allowed & ALLOW_ZERO)) {
      if (numeric.unit == '%' && this.allowed & ALLOW_ZERO_PERCENT) {
        return numeric;
      }
      return null;
    }
    if (numeric.num < 0 && !(this.allowed & ALLOW_NEGATIVE)) {
      return null;
    }
    if (this.units[numeric.unit]) {
      return numeric;
    }
    return null;
  }

  /**
   * @override
   */
  visitNum(num) {
    if (num.num == 0) {
      return this.allowed & ALLOW_ZERO ? num : null;
    }
    if (num.num <= 0 && !(this.allowed & ALLOW_NEGATIVE)) {
      return null;
    }
    if (this.allowed & ALLOW_POS_NUM) {
      return num;
    }
    return null;
  }

  /**
   * @override
   */
  visitInt(num) {
    if (num.num == 0) {
      return this.allowed & ALLOW_ZERO ? num : null;
    }
    if (num.num <= 0 && !(this.allowed & ALLOW_NEGATIVE)) {
      return null;
    }
    if (this.allowed & (ALLOW_POS_INT | ALLOW_POS_NUM)) {
      return num;
    }
    const val = this.idents[`${num.num}`];
    if (val) {
      return val;
    }
    return null;
  }

  /**
   * @override
   */
  visitColor(color) {
    if (this.allowed & ALLOW_COLOR) {
      return color;
    }
    return null;
  }

  /**
   * @override
   */
  visitURL(url) {
    if (this.allowed & ALLOW_URL) {
      return url;
    }
    return null;
  }

  /**
   * @override
   */
  visitSpaceList(list) {return null;}

  /**
   * @override
   */
  visitCommaList(list) {return null;}

  /**
   * @override
   */
  visitFunc(func) {return null;}

  /**
   * @override
   */
  visitExpr(expr) {return null;}

  combine(other: PrimitiveValidator): PrimitiveValidator {
    const idents: ValueMap = {};
    const units: ValueMap = {};
    for (let ident in this.idents) {
      idents[ident] = this.idents[ident];
    }
    for (let ident in other.idents) {
      idents[ident] = other.idents[ident];
    }
    for (let unit in this.units) {
      units[unit] = this.units[unit];
    }
    for (let unit in other.units) {
      units[unit] = other.units[unit];
    }
    return new PrimitiveValidator(this.allowed | other.allowed, idents, units);
  }
}

const NO_IDENTS = {};

export const ALWAYS_FAIL = new PrimitiveValidator(0, NO_IDENTS, NO_IDENTS);

/**
 * Base class for list validation.
 */
export class ListValidator extends PropertyValidator {
  successTerminal: Node;
  failureTerminal: Node;
  first: Node;

  constructor(group: ValidatingGroup) {
    super();
    this.successTerminal = new Node(null);
    this.failureTerminal = new Node(null);
    this.first = group.finish(this.successTerminal, this.failureTerminal);
  }

  validateList(arr: css.Val[], slice: boolean, startIndex: number): css.Val[] {
    let out: css.Val[] = slice ? [] : arr;
    let current = this.first;
    let index = startIndex;
    let alternativeStack = null;
    let alternatives = null;
    while (current !== this.successTerminal &&
           current !== this.failureTerminal) {
      if (index >= arr.length) {
        current = current.failure;
        continue;
      }
      const inval = arr[index];
      let outval = inval;
      if (current.isSpecial()) {
        let success = true;
        if (current.isStartGroup()) {
          if (alternativeStack) {
            alternativeStack.push(alternatives);
          } else {
            alternativeStack = [alternatives];
          }
          alternatives = [];
        } else if (current.isEndGroup()) {
          if (alternativeStack.length > 0) {
            alternatives = alternativeStack.pop();
          } else {
            alternatives = null;
          }
        } else if (current.isEndAlternate()) {
          alternatives[current.getAlternate()] = 'taken';
        } else {
          success = alternatives[current.getAlternate()] == null;
        }
        current = success ? current.success : current.failure;
      } else {
        if (index == 0 && !slice &&
            current.validator instanceof SpaceListValidator &&
            this instanceof SpaceListValidator) {
          // Special nesting case: validate the input space list as a whole.
          outval = (new css.SpaceList(arr)).visit(current.validator);
          if (outval) {
            index = arr.length;
            current = current.success;
            continue;
          }
        } else if (index == 0 && !slice &&
            current.validator instanceof CommaListValidator &&
            this instanceof SpaceListValidator) {
          // Special nesting case: validate the input comma list as a whole.
          outval = (new css.CommaList(arr)).visit(current.validator);
          if (outval) {
            index = arr.length;
            current = current.success;
            continue;
          }
        } else {
          outval = inval.visit(current.validator);
        }
        if (!outval) {
          current = current.failure;
          continue;
        }
        if (outval !== inval && arr === out) {
          // startIndex is zero here
          out = [];
          for (let k = 0; k < index; k++) {
            out[k] = arr[k];
          }
        }
        if (arr !== out) {
          out[index - startIndex] = outval;
        }
        index++;
        current = current.success;
      }
    }
    if (current === this.successTerminal) {
      if (slice ? out.length > 0 : index == arr.length) {
        return out;
      }
    }
    return null;
  }

  validateSingle(inval: css.Val): css.Val {
    // no need to worry about "specials"
    let outval: css.Val = null;
    let current = this.first;
    while (current !== this.successTerminal &&
           current !== this.failureTerminal) {
      if (!inval) {
        current = current.failure;
        continue;
      }
      if (current.isSpecial()) {
        current = current.success;
        continue;
      }
      outval = inval.visit(current.validator);
      if (!outval) {
        current = current.failure;
        continue;
      }
      inval = null;
      current = current.success;
    }
    if (current === this.successTerminal) {
      return outval;
    }
    return null;
  }

  /**
   * @override
   */
  visitEmpty(empty) {
    return this.validateSingle(empty);
  }

  /**
   * @override
   */
  visitSlash(slash) {
    return this.validateSingle(slash);
  }

  /**
   * @override
   */
  visitStr(str) {
    return this.validateSingle(str);
  }

  /**
   * @override
   */
  visitIdent(ident) {
    return this.validateSingle(ident);
  }

  /**
   * @override
   */
  visitNumeric(numeric) {
    return this.validateSingle(numeric);
  }

  /**
   * @override
   */
  visitNum(num) {
    return this.validateSingle(num);
  }

  /**
   * @override
   */
  visitInt(num) {
    return this.validateSingle(num);
  }

  /**
   * @override
   */
  visitColor(color) {
    return this.validateSingle(color);
  }

  /**
   * @override
   */
  visitURL(url) {
    return this.validateSingle(url);
  }

  /**
   * @override
   */
  visitSpaceList(list) {return null;}

  /**
   * @override
   */
  visitCommaList(list) {return null;}

  /**
   * @override
   */
  visitFunc(func) {
    return this.validateSingle(func);
  }

  /**
   * @override
   */
  visitExpr(expr) {return null;}
}

export class SpaceListValidator extends ListValidator {
  constructor(group: ValidatingGroup) {
    super(group);
  }

  /**
   * @override
   */
  visitSpaceList(list) {
    const arr = this.validateList(list.values, false, 0);
    if (arr === list.values) {
      return list;
    }
    if (!arr) {
      return null;
    }
    return new css.SpaceList(arr);
  }

  /**
   * @override
   */
  visitCommaList(list) {
    // Special Case : Issue #156
    let node = this.first;
    let hasCommaListValidator = false;
    while (node) {
      if (node.validator instanceof CommaListValidator) {
        hasCommaListValidator = true;
        break;
      }
      node = node.failure;
    }
    if (hasCommaListValidator) {
      const arr = this.validateList(list.values, false, 0);
      if (arr === list.values) {
        return list;
      }
      if (!arr) {
        return null;
      }
      return new css.CommaList(arr);
    }
    return null;
  }

  /**
   * @override
   */
  validateForShorthand(values, index) {
    return this.validateList(values, true, index);
  }
}

export class CommaListValidator extends ListValidator {
  constructor(group: ValidatingGroup) {
    super(group);
  }

  /**
   * @override
   */
  visitSpaceList(list) {
    return this.validateSingle(list);
  }

  /**
   * @override
   */
  visitCommaList(list) {
    const arr = this.validateList(list.values, false, 0);
    if (arr === list.values) {
      return list;
    }
    if (!arr) {
      return null;
    }
    return new css.CommaList(arr);
  }

  /**
   * @override
   */
  validateForShorthand(values, index) {
    let current = this.first;
    let rval;
    while (current !== this.failureTerminal) {
      rval = current.validator.validateForShorthand(values, index);
      if (rval) {
        return rval;
      }
      current = current.failure;
    }
    return null;
  }
}

export class FuncValidator extends ListValidator {
  constructor(public readonly name: string, group: ValidatingGroup) {
    super(group);
  }

  /**
   * @override
   */
  validateSingle(inval) {return null;}

  /**
   * @override
   */
  visitFunc(func) {
    if (func.name.toLowerCase() != this.name) {
      return null;
    }
    const arr = this.validateList(func.values, false, 0);
    if (arr === func.values) {
      return func;
    }
    if (!arr) {
      return null;
    }
    return new css.Func(func.name, arr);
  }
}

//----------------------- Shorthands
//------------------------------------------------------------
export class ShorthandSyntaxNode {
  /**
   * @return new index.
   */
  tryParse(
      values: css.Val[], index: number,
      shorthandValidator: ShorthandValidator): number {return index;}

  success(rval: css.Val, shorthandValidator: ShorthandValidator): void {}
}

export class ShorthandSyntaxProperty extends
    ShorthandSyntaxNode {
  validator: PropertyValidator;

  constructor(validatorSet: ValidatorSet, public readonly name: string) {
    super();
    this.validator = validatorSet.validators[this.name];
  }

  /**
   * @override
   */
  tryParse(values, index, shorthandValidator) {
    if (shorthandValidator.values[this.name]) {
      return index;
    }
    const rvals = this.validator.validateForShorthand(values, index);
    if (rvals) {
      const len = rvals.length;
      const rval = len > 1 ? new css.SpaceList(rvals) : rvals[0];
      this.success(rval, shorthandValidator);
      return index + len;
    }
    return index;
  }

  /**
   * @override
   */
  success(rval, shorthandValidator) {
    shorthandValidator.values[this.name] = rval;
  }
}

export class ShorthandSyntaxPropertyN extends
    ShorthandSyntaxProperty {
  constructor(validatorSet: ValidatorSet, public readonly names: string[]) {
    super(validatorSet, names[0]);
  }

  /**
   * @override
   */
  success(rval, shorthandValidator) {
    for (let i = 0; i < this.names.length; i++) {
      shorthandValidator.values[this.names[i]] = rval;
    }
  }
}

export class ShorthandSyntaxCompound extends
    ShorthandSyntaxNode {
  constructor(
      public readonly nodes: ShorthandSyntaxNode[],
      public readonly slash: boolean) {
    super();
  }

  /**
   * @override
   */
  tryParse(values, index, shorthandValidator) {
    const index0 = index;
    if (this.slash) {
      if (values[index] == css.slash) {
        if (++index == values.length) {
          return index0;
        }
      } else {
        return index0;
      }
    }
    let newIndex = this.nodes[0].tryParse(values, index, shorthandValidator);
    if (newIndex == index) {
      return index0;
    }
    index = newIndex;
    for (let i = 1; i < this.nodes.length && index < values.length; i++) {
      newIndex = this.nodes[i].tryParse(values, index, shorthandValidator);
      if (newIndex == index) {
        break;
      }
      index = newIndex;
    }
    return index;
  }
}

export class ShorthandValidator extends css.Visitor {
  syntax: ShorthandSyntaxNode[] = null;
  propList: string[] = null;
  error: boolean = false;
  values: ValueMap = {};
  validatorSet: ValidatorSet = null;

  setOwner(validatorSet: ValidatorSet) {
    this.validatorSet = validatorSet;
  }

  syntaxNodeForProperty(name: string): ShorthandSyntaxNode {
    return new ShorthandSyntaxProperty(this.validatorSet, name);
  }

  clone(): ShorthandValidator {
    const other = new ShorthandValidator();
    other.syntax = this.syntax;
    other.propList = this.propList;
    other.validatorSet = this.validatorSet;
    return other;
  }

  init(syntax: ShorthandSyntaxNode[], propList: string[]): void {
    this.syntax = syntax;
    this.propList = propList;
  }

  finish(important: boolean, receiver: PropertyReceiver): boolean {
    if (!this.error) {
      for (const name of this.propList) {
        receiver.simpleProperty(
            name, this.values[name] || this.validatorSet.defaultValues[name],
            important);
      }
      return true;
    }
    return false;
  }

  propagateInherit(important: boolean, receiver: PropertyReceiver): void {
    for (const name of this.propList) {
      receiver.simpleProperty(name, css.ident.inherit, important);
    }
  }

  validateList(list: css.Val[]): number {
    this.error = true;
    return 0;
  }

  validateSingle(val: css.Val): css.Val {
    this.validateList([val]);
    return null;
  }

  /**
   * @override
   */
  visitEmpty(empty) {
    return this.validateSingle(empty);
  }

  /**
   * @override
   */
  visitStr(str) {
    return this.validateSingle(str);
  }

  /**
   * @override
   */
  visitIdent(ident) {
    return this.validateSingle(ident);
  }

  /**
   * @override
   */
  visitNumeric(numeric) {
    return this.validateSingle(numeric);
  }

  /**
   * @override
   */
  visitNum(num) {
    return this.validateSingle(num);
  }

  /**
   * @override
   */
  visitInt(num) {
    return this.validateSingle(num);
  }

  /**
   * @override
   */
  visitColor(color) {
    return this.validateSingle(color);
  }

  /**
   * @override
   */
  visitURL(url) {
    return this.validateSingle(url);
  }

  /**
   * @override
   */
  visitSpaceList(list) {
    this.validateList(list.values);
    return null;
  }

  /**
   * @override
   */
  visitCommaList(list) {
    this.error = true;
    return null;
  }

  /**
   * @override
   */
  visitFunc(func) {
    return this.validateSingle(func);
  }

  /**
   * @override
   */
  visitExpr(expr) {
    this.error = true;
    return null;
  }
}

export class SimpleShorthandValidator extends
    ShorthandValidator {
  error: any;

  constructor() {
    super();
  }

  /**
   * @override
   */
  validateList(list) {
    let index = 0;
    let i = 0;
    while (index < list.length) {
      const newIndex = this.syntax[i].tryParse(list, index, this);
      if (newIndex > index) {
        index = newIndex;
        i = 0;
        continue;
      }
      if (++i == this.syntax.length) {
        this.error = true;
        break;
      }
    }
    return index;
  }
}

export class InsetsShorthandValidator extends
    ShorthandValidator {
  error: any;

  constructor() {
    super();
  }

  /**
   * @override
   */
  validateList(list) {
    if (list.length > this.syntax.length || list.length == 0) {
      this.error = true;
      return 0;
    }
    for (let i = 0; i < this.syntax.length; i++) {
      let index = i;
      while (index >= list.length) {
        index = index == 1 ? 0 : index - 2;
      }
      if (this.syntax[i].tryParse(list, index, this) != index + 1) {
        this.error = true;
        return 0;
      }
    }
    return list.length;
  }

  createSyntaxNode(): ShorthandSyntaxPropertyN {
    return new ShorthandSyntaxPropertyN(this.validatorSet, this.propList);
  }
}

export class InsetsSlashShorthandValidator extends
    ShorthandValidator {
  error: any;

  constructor() {
    super();
  }

  /**
   * @override
   */
  validateList(list) {
    let slashIndex = list.length;
    for (let i = 0; i < list.length; i++) {
      if (list[i] === css.slash) {
        slashIndex = i;
        break;
      }
    }
    if (slashIndex > this.syntax.length || list.length == 0) {
      this.error = true;
      return 0;
    }
    for (let i = 0; i < this.syntax.length; i++) {
      let index0 = i;
      while (index0 >= slashIndex) {
        index0 = index0 == 1 ? 0 : index0 - 2;
      }
      let index1;
      if (slashIndex + 1 < list.length) {
        index1 = slashIndex + i + 1;
        while (index1 >= list.length) {
          index1 = index1 - (index1 == slashIndex + 2 ? 1 : 2);
        }
      } else {
        index1 = index0;
      }
      const vals = [list[index0], list[index1]];
      if (this.syntax[i].tryParse(vals, 0, this) != 2) {
        this.error = true;
        return 0;
      }
    }
    return list.length;
  }
}

export class CommaShorthandValidator extends
    SimpleShorthandValidator {
  values: any;
  error: any;

  constructor() {
    super();
  }

  mergeIn(acc: {[key: string]: css.Val[]}, values: ValueMap) {
    for (const name of this.propList) {
      const val = values[name] || this.validatorSet.defaultValues[name];
      let arr = acc[name];
      if (!arr) {
        arr = [];
        acc[name] = arr;
      }
      arr.push(val);
    }
  }

  /**
   * @override
   */
  visitCommaList(list) {
    const acc: {[key: string]: css.Val[]} = {};
    for (let i = 0; i < list.values.length; i++) {
      this.values = {};
      if (list.values[i] instanceof css.CommaList) {
        this.error = true;
      } else {
        list.values[i].visit(this);
        this.mergeIn(acc, this.values);
        if (this.values['background-color'] && i != list.values.length - 1) {
          this.error = true;
        }
      }
      if (this.error) {
        return null;
      }
    }
    this.values = {};
    for (const name in acc) {
      if (name == 'background-color') {
        this.values[name] = acc[name].pop();
      } else {
        this.values[name] = new css.CommaList(acc[name]);
      }
    }
    return null;
  }
}

export class FontShorthandValidator extends
    SimpleShorthandValidator {
  error: any;

  constructor() {
    super();
  }

  /**
   * @override
   */
  init(syntax, propList) {
    super.init(syntax, propList);
    this.propList.push('font-family', 'line-height', 'font-size');
  }

  /**
   * @override
   */
  validateList(list) {
    let index =
        super.validateList(list);

    // must at least have font-size and font-family at the end
    if (index + 2 > list.length) {
      this.error = true;
      return index;
    }
    this.error = false;
    const validators = this.validatorSet.validators;
    if (!list[index].visit(validators['font-size'])) {
      this.error = true;
      return index;
    }
    this.values['font-size'] = list[index++];
    if (list[index] === css.slash) {
      index++;

      // must at least have line-height and font-family at the end
      if (index + 2 > list.length) {
        this.error = true;
        return index;
      }
      if (!list[index].visit(validators['line-height'])) {
        this.error = true;
        return index;
      }
      this.values['line-height'] = list[index++];
    }
    const fontFamily = index == list.length - 1 ?
        list[index] :
        new css.SpaceList(list.slice(index, list.length));
    if (!fontFamily.visit(validators['font-family'])) {
      this.error = true;
      return index;
    }
    this.values['font-family'] = fontFamily;
    return list.length;
  }

  /**
   * @override
   */
  visitCommaList(list) {
    list.values[0].visit(this);
    if (this.error) {
      return null;
    }
    const familyList = [this.values['font-family']];
    for (let i = 1; i < list.values.length; i++) {
      familyList.push(list.values[i]);
    }
    const family = new css.CommaList(familyList);
    if (!family.visit(this.validatorSet.validators['font-family'])) {
      this.error = true;
    } else {
      this.values['font-family'] = family;
    }
    return null;
  }

  /**
   * @override
   */
  visitIdent(ident) {
    const props = this.validatorSet.systemFonts[ident.name];
    if (props) {
      for (const name in props) {
        this.values[name] = props[name];
      }
    } else {
      this.error = true;
    }
    return null;
  }
}

export const shorthandValidators: {[key: string]: typeof ShorthandValidator} = {
  'SIMPLE': SimpleShorthandValidator,
  'INSETS': InsetsShorthandValidator,
  'INSETS_SLASH': InsetsSlashShorthandValidator,
  'COMMA': CommaShorthandValidator,
  'FONT': FontShorthandValidator
};

//---- validation grammar parser and public property validator
//------------------------

/**
 * Object that validates simple and shorthand properties, breaking up shorthand
 * properties into corresponding simple ones, also stripping property prefixes.
 */
export class ValidatorSet {
  validators: {[key: string]: PropertyValidator} = {};
  prefixes: {[key: string]: {[key: string]: boolean}} = {};
  defaultValues: ValueMap = {};
  namedValidators: {[key: string]: ValidatingGroup} = {};
  systemFonts: {[key: string]: ValueMap} = {};
  shorthands: {[key: string]: ShorthandValidator} = {};
  layoutProps: ValueMap = {};
  backgroundProps: ValueMap = {};

  private addReplacement(val: ValidatingGroup, token: csstok.Token):
      ValidatingGroup {
    let cssval: css.Val;
    if (token.type == csstok.TokenType.NUMERIC) {
      cssval = new css.Numeric(token.num, token.text);
    } else if (token.type == csstok.TokenType.HASH) {
      cssval = cssparse.colorFromHash(token.text);
    } else if (token.type == csstok.TokenType.IDENT) {
      cssval = css.getName(token.text);
    } else {
      throw new Error('unexpected replacement');
    }
    if (val.isPrimitive()) {
      const validator = (val.nodes[0].validator as PrimitiveValidator);
      const idents = validator.idents;
      for (const ident in idents) {
        idents[ident] = cssval;
      }
      return val;
    }
    throw new Error('unexpected replacement');
  }

  private newGroup(op: string, vals: ValidatingGroup[]): ValidatingGroup {
    const group = new ValidatingGroup();
    if (op == '||') {
      for (let i = 0; i < vals.length; i++) {
        const subgroup = new ValidatingGroup();
        subgroup.startClause(i);
        subgroup.addGroup(vals[i], Add.FOLLOW);
        subgroup.endClause(i);
        group.addGroup(subgroup, i == 0 ? Add.FOLLOW : Add.ALTERNATE);
      }
      const outer = new ValidatingGroup();
      outer.startSpecialGroup();
      outer.addGroup(group, Add.REPEATED);
      outer.endSpecialGroup();
      return outer;
    } else {
      let how: Add;
      switch (op) {
        case ' ':
          how = Add.FOLLOW;
          break;
        case '|':
        case '||':
          how = Add.ALTERNATE;
          break;
        default:
          throw new Error('unexpected op');
      }
      for (let i = 0; i < vals.length; i++) {
        group.addGroup(vals[i], i == 0 ? Add.FOLLOW : how);
      }
      return group;
    }
  }

  private addCounts(val: ValidatingGroup, min: number, max: number):
      ValidatingGroup {
    const group = new ValidatingGroup();
    for (let i = 0; i < min; i++) {
      group.addGroup(val.clone(), Add.FOLLOW);
    }
    if (max == Number.POSITIVE_INFINITY) {
      group.addGroup(val, Add.REPEATED);
    } else {
      for (let i = min; i < max; i++) {
        group.addGroup(val.clone(), Add.OPTIONAL);
      }
    }
    return group;
  }

  private primitive(validator: PropertyValidator): ValidatingGroup {
    const group = new ValidatingGroup();
    group.addPrimitive(validator);
    return group;
  }

  private newFunc(fn: string, val: ValidatingGroup): ValidatingGroup {
    let validator: PropertyValidator;
    switch (fn) {
      case 'COMMA':
        validator = new CommaListValidator(val);
        break;
      case 'SPACE':
        validator = new SpaceListValidator(val);
        break;
      default:
        validator = new FuncValidator(fn.toLowerCase(), val);
        break;
    }
    return this.primitive(validator);
  }

  initBuiltInValidators(): void {
    this.namedValidators['HASHCOLOR'] = this.primitive(
        new PrimitiveValidator(ALLOW_COLOR, NO_IDENTS, NO_IDENTS));
    this.namedValidators['POS_INT'] = this.primitive(
        new PrimitiveValidator(ALLOW_POS_INT, NO_IDENTS, NO_IDENTS));
    this.namedValidators['POS_NUM'] = this.primitive(
        new PrimitiveValidator(ALLOW_POS_NUM, NO_IDENTS, NO_IDENTS));
    this.namedValidators['POS_PERCENTAGE'] = this.primitive(
        new PrimitiveValidator(ALLOW_POS_NUMERIC, NO_IDENTS, {'%': css.empty}));
    this.namedValidators['NEGATIVE'] = this.primitive(
        new PrimitiveValidator(ALLOW_NEGATIVE, NO_IDENTS, NO_IDENTS));
    this.namedValidators['ZERO'] = this.primitive(
        new PrimitiveValidator(ALLOW_ZERO, NO_IDENTS, NO_IDENTS));
    this.namedValidators['ZERO_PERCENTAGE'] = this.primitive(
        new PrimitiveValidator(ALLOW_ZERO_PERCENT, NO_IDENTS, NO_IDENTS));
    this.namedValidators['POS_LENGTH'] =
        this.primitive(new PrimitiveValidator(ALLOW_POS_NUMERIC, NO_IDENTS, {
          'em': css.empty,
          'ex': css.empty,
          'ch': css.empty,
          'rem': css.empty,
          'vh': css.empty,
          'vw': css.empty,
          'vmin': css.empty,
          'vmax': css.empty,
          'cm': css.empty,
          'mm': css.empty,
          'in': css.empty,
          'px': css.empty,
          'pt': css.empty,
          'pc': css.empty,
          'q': css.empty
        }));
    this.namedValidators['POS_ANGLE'] =
        this.primitive(new PrimitiveValidator(ALLOW_POS_NUMERIC, NO_IDENTS, {
          'deg': css.empty,
          'grad': css.empty,
          'rad': css.empty,
          'turn': css.empty
        }));
    this.namedValidators['POS_TIME'] = this.primitive(new PrimitiveValidator(
        ALLOW_POS_NUMERIC, NO_IDENTS, {'s': css.empty, 'ms': css.empty}));
    this.namedValidators['FREQUENCY'] = this.primitive(new PrimitiveValidator(
        ALLOW_POS_NUMERIC, NO_IDENTS, {'Hz': css.empty, 'kHz': css.empty}));
    this.namedValidators['RESOLUTION'] = this.primitive(new PrimitiveValidator(
        ALLOW_POS_NUMERIC, NO_IDENTS,
        {'dpi': css.empty, 'dpcm': css.empty, 'dppx': css.empty}));
    this.namedValidators['URI'] =
        this.primitive(new PrimitiveValidator(ALLOW_URL, NO_IDENTS, NO_IDENTS));
    this.namedValidators['IDENT'] = this.primitive(
        new PrimitiveValidator(ALLOW_IDENT, NO_IDENTS, NO_IDENTS));
    this.namedValidators['STRING'] =
        this.primitive(new PrimitiveValidator(ALLOW_STR, NO_IDENTS, NO_IDENTS));
    this.namedValidators['SLASH'] = this.primitive(
        new PrimitiveValidator(ALLOW_SLASH, NO_IDENTS, NO_IDENTS));
    const stdfont = {'font-family': css.getName('sans-serif')};
    this.systemFonts['caption'] = stdfont;
    this.systemFonts['icon'] = stdfont;
    this.systemFonts['menu'] = stdfont;
    this.systemFonts['message-box'] = stdfont;
    this.systemFonts['small-caption'] = stdfont;
    this.systemFonts['status-bar'] = stdfont;
  }

  private isBuiltIn(name: string): boolean {return !!name.match(/^[A-Z_0-9]+$/);}

      private readNameAndPrefixes(tok: csstok.Tokenizer, section: number):
          string|null {
    let token = tok.token();
    if (token.type == csstok.TokenType.EOF) {
      // Finished normally
      return null;
    }
    const rulePrefixes: {[key: string]: boolean} = {'': true};
    if (token.type == csstok.TokenType.O_BRK) {
      do {
        tok.consume();
        token = tok.token();
        if (token.type != csstok.TokenType.IDENT) {
          throw new Error('Prefix name expected');
        }
        rulePrefixes[token.text] = true;
        tok.consume();
        token = tok.token();
      } while (token.type == csstok.TokenType.COMMA);
      if (token.type != csstok.TokenType.C_BRK) {
        throw new Error('\']\' expected');
      }
      tok.consume();
      token = tok.token();
    }
    if (token.type != csstok.TokenType.IDENT) {
      throw new Error('Property name expected');
    }
    if (section == 2 ? token.text == 'SHORTHANDS' : token.text == 'DEFAULTS') {
      tok.consume();
      return null;
    }
    const name = token.text;
    tok.consume();
    if (section != 2) {
      if (tok.token().type != csstok.TokenType.EQ) {
        throw new Error('\'=\' expected');
      }
      if (!this.isBuiltIn(name)) {
        this.prefixes[name] = rulePrefixes;
      }
    } else {
      if (tok.token().type != csstok.TokenType.COLON) {
        throw new Error('\':\' expected');
      }
    }
    return name;
  }

  private parseValidators(tok: csstok.Tokenizer): void {
    while (true) {
      const ruleName = this.readNameAndPrefixes(tok, 1);
      if (!ruleName) {
        return;
      }
      let vals: ValidatingGroup[] = [];
      const stack = [];
      let op = '';
      let val;
      let expectval = true;
      const self = this;
      const reduce = (): ValidatingGroup => {
        if (vals.length == 0) {
          throw new Error('No values');
        }
        if (vals.length == 1) {
          return vals[0];
        }
        return self.newGroup(op, vals);
      };
      const setop = (currop: string): void => {
        if (expectval) {
          throw new Error(`'${currop}': unexpected`);
        }
        if (op && op != currop) {
          throw new Error(`mixed operators: '${currop}' and '${op}'`);
        }
        op = currop;
        expectval = true;
      };
      let result: ValidatingGroup = null;
      while (!result) {
        tok.consume();
        let token = tok.token();
        switch (token.type) {
          case csstok.TokenType.IDENT:
            if (!expectval) {
              setop(' ');
            }
            if (this.isBuiltIn(token.text)) {
              const builtIn = this.namedValidators[token.text];
              if (!builtIn) {
                throw new Error(`'${token.text}' unexpected`);
              }
              vals.push(builtIn.clone());
            } else {
              var idents = {};
              idents[token.text.toLowerCase()] = css.getName(token.text);
              vals.push(
                  this.primitive(new PrimitiveValidator(0, idents, NO_IDENTS)));
            }
            expectval = false;
            break;
          case csstok.TokenType.INT:
            var idents = {};
            idents[`${token.num}`] = new css.Int(token.num);
            vals.push(
                this.primitive(new PrimitiveValidator(0, idents, NO_IDENTS)));
            expectval = false;
            break;
          case csstok.TokenType.BAR:
            setop('|');
            break;
          case csstok.TokenType.BAR_BAR:
            setop('||');
            break;
          case csstok.TokenType.O_BRK:
            if (!expectval) {
              setop(' ');
            }
            stack.push({vals, op, b: '['});
            op = '';
            vals = [];
            expectval = true;
            break;
          case csstok.TokenType.FUNC:
            if (!expectval) {
              setop(' ');
            }
            stack.push({vals, op, b: '(', fn: token.text});
            op = '';
            vals = [];
            expectval = true;
            break;
          case csstok.TokenType.C_BRK:
            val = reduce();
            var open = stack.pop();
            if (open.b != '[') {
              throw new Error('\']\' unexpected');
            }
            vals = open.vals;
            vals.push(val);
            op = open.op;
            expectval = false;
            break;
          case csstok.TokenType.C_PAR:
            val = reduce();
            var open = stack.pop();
            if (open.b != '(') {
              throw new Error('\')\' unexpected');
            }
            vals = open.vals;
            vals.push(this.newFunc(open.fn, val));
            op = open.op;
            expectval = false;
            break;
          case csstok.TokenType.COLON:
            if (expectval) {
              throw new Error('\':\' unexpected');
            }
            tok.consume();
            vals.push(this.addReplacement(vals.pop(), tok.token()));
            break;
          case csstok.TokenType.QMARK:
            if (expectval) {
              throw new Error('\'?\' unexpected');
            }
            vals.push(this.addCounts(vals.pop(), 0, 1));
            break;
          case csstok.TokenType.STAR:
            if (expectval) {
              throw new Error('\'*\' unexpected');
            }
            vals.push(this.addCounts(vals.pop(), 0, Number.POSITIVE_INFINITY));
            break;
          case csstok.TokenType.PLUS:
            if (expectval) {
              throw new Error('\'+\' unexpected');
            }
            vals.push(this.addCounts(vals.pop(), 1, Number.POSITIVE_INFINITY));
            break;
          case csstok.TokenType.O_BRC:
            tok.consume();
            token = tok.token();
            if (token.type != csstok.TokenType.INT) {
              throw new Error('<int> expected');
            }
            const min = token.num;
            let max = min;
            tok.consume();
            token = tok.token();
            if (token.type == csstok.TokenType.COMMA) {
              tok.consume();
              token = tok.token();
              if (token.type != csstok.TokenType.INT) {
                throw new Error('<int> expected');
              }
              max = token.num;
              tok.consume();
              token = tok.token();
            }
            if (token.type != csstok.TokenType.C_BRC) {
              throw new Error('\'}\' expected');
            }
            vals.push(this.addCounts(vals.pop(), min, max));
            break;
          case csstok.TokenType.SEMICOL:
            result = reduce();
            if (stack.length > 0) {
              throw new Error(`unclosed '${stack.pop().b}'`);
            }
            break;
          default:
            throw new Error('unexpected token');
        }
      }
      tok.consume();
      if (this.isBuiltIn(ruleName)) {
        this.namedValidators[ruleName] = result;
      } else {
        if (result.isSimple()) {
          this.validators[ruleName] = result.nodes[0].validator;
        } else {
          this.validators[ruleName] = new SpaceListValidator(result);
        }
      }
    }
  }

  private parseDefaults(tok: csstok.Tokenizer): void {
    while (true) {
      const propName = this.readNameAndPrefixes(tok, 2);
      if (!propName) {
        return;
      }
      const vals: css.Val[] = [];
      while (true) {
        tok.consume();
        const token = tok.token();
        if (token.type == csstok.TokenType.SEMICOL) {
          tok.consume();
          break;
        }
        switch (token.type) {
          case csstok.TokenType.IDENT:
            vals.push(css.getName(token.text));
            break;
          case csstok.TokenType.NUM:
            vals.push(new css.Num(token.num));
            break;
          case csstok.TokenType.INT:
            vals.push(new css.Int(token.num));
            break;
          case csstok.TokenType.NUMERIC:
            vals.push(new css.Numeric(token.num, token.text));
            break;
          default:
            throw new Error('unexpected token');
        }
      }
      this.defaultValues[propName] =
          vals.length > 1 ? new css.SpaceList(vals) : vals[0];
    }
  }

  private parseShorthands(tok: csstok.Tokenizer): void {
    while (true) {
      const ruleName = this.readNameAndPrefixes(tok, 3);
      if (!ruleName) {
        return;
      }
      let token = tok.nthToken(1);
      let shorthandValidator;
      if (token.type == csstok.TokenType.IDENT &&
          shorthandValidators[token.text]) {
        shorthandValidator = new shorthandValidators[token.text]();
        tok.consume();
      } else {
        shorthandValidator = new SimpleShorthandValidator();
      }
      shorthandValidator.setOwner(this);
      let result = false;
      let syntax: ShorthandSyntaxNode[] = [];
      let slash = false;
      const stack = [];
      const propList = [];
      while (!result) {
        tok.consume();
        token = tok.token();
        switch (token.type) {
          case csstok.TokenType.IDENT:
            if (this.validators[token.text]) {
              syntax.push(shorthandValidator.syntaxNodeForProperty(token.text));
              propList.push(token.text);
            } else if (this.shorthands[token.text] instanceof
                InsetsShorthandValidator) {
              const insetShorthand =
                  (this.shorthands[token.text] as InsetsShorthandValidator);
              syntax.push(insetShorthand.createSyntaxNode());
              propList.push(...insetShorthand.propList);
            } else {
              throw new Error(`'${
                  token
                      .text}' is neither a simple property nor an inset shorthand`);
            }
            break;
          case csstok.TokenType.SLASH:
            if (syntax.length > 0 || slash) {
              throw new Error('unexpected slash');
            }
            slash = true;
            break;
          case csstok.TokenType.O_BRK:
            stack.push({slash, syntax});
            syntax = [];
            slash = false;
            break;
          case csstok.TokenType.C_BRK:
            const compound = new ShorthandSyntaxCompound(syntax, slash);
            const item = stack.pop();
            syntax = item.syntax;
            slash = item.slash;
            syntax.push(compound);
            break;
          case csstok.TokenType.SEMICOL:
            result = true;
            tok.consume();
            break;
          default:
            throw new Error('unexpected token');
        }
      }
      shorthandValidator.init(syntax, propList);
      this.shorthands[ruleName] = shorthandValidator;
    }
  }

  parse(text: string): void {
    // Not as robust as CSS parser.
    const tok = new csstok.Tokenizer(text, null);
    this.parseValidators(tok);
    this.parseDefaults(tok);
    this.parseShorthands(tok);
    this.backgroundProps = this.makePropSet(['background']);
    this.layoutProps = this.makePropSet([
      'margin', 'border', 'padding', 'columns', 'column-gap', 'column-rule',
      'column-fill'
    ]);
  }

  makePropSet(propList: string[]): ValueMap {
    const map: ValueMap = {};
    for (const prop of propList) {
      const shorthand = this.shorthands[prop];
      const list = shorthand ? shorthand.propList : [prop];
      for (const pname of list) {
        const pval = this.defaultValues[pname];
        if (!pval) {
          logging.logger.warn('Unknown property in makePropSet:', pname);
        } else {
          map[pname] = pval;
        }
      }
    }
    return map;
  }

  validatePropertyAndHandleShorthand(
      name: string, value: css.Val, important: boolean,
      receiver: PropertyReceiver): void {
    let prefix = '';
    const origName = name;
    name = name.toLowerCase();
    const r = name.match(/^-([a-z]+)-([-a-z0-9]+)$/);
    if (r) {
      prefix = r[1];
      name = r[2];
    }
    const px = this.prefixes[name];
    if (!px || !px[prefix]) {
      receiver.unknownProperty(origName, value);
      return;
    }
    const validator = this.validators[name];
    if (validator) {
      const rvalue = value === css.ident.inherit || value.isExpr() ?
          value :
          value.visit(validator);
      if (rvalue) {
        receiver.simpleProperty(name, rvalue, important);
      } else {
        receiver.invalidPropertyValue(origName, value);
      }
    } else {
      const shorthand = this.shorthands[name].clone();
      if (value === css.ident.inherit) {
        shorthand.propagateInherit(important, receiver);
      } else {
        value.visit(shorthand);
        if (!shorthand.finish(important, receiver)) {
          receiver.invalidPropertyValue(origName, value);
        }
      }
    }
  }
}

export const validatorFetcher: taskutil.Fetcher<ValidatorSet> =
    new taskutil.Fetcher(() => {
      const frame: task.Frame<ValidatorSet> =
          task.newFrame('loadValidatorSet.load');
      const url = base.resolveURL('validation.txt', base.resourceBaseURL);
      const result = net.ajax(url);
      const validatorSet = new ValidatorSet();
      validatorSet.initBuiltInValidators();
      result.then((xhr) => {
        try {
          if (xhr.responseText) {
            validatorSet.parse(xhr.responseText);
          } else {
            logging.logger.error('Error: missing', url);
          }
        } catch (err) {
          logging.logger.error(err, 'Error:');
        }
        frame.finish(validatorSet);
      });
      return frame.result();
    }, 'validatorFetcher');

export const loadValidatorSet = (): task.Result<ValidatorSet> =>
    validatorFetcher.get();
