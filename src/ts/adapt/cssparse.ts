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
 * @fileoverview CSS Parser.
 */
import * as logging from '../vivliostyle/logging';

import * as base from './base';
import * as css from './css';
import * as csstok from './csstok';
import * as expr from './expr';
import * as net from './net';
import * as task from './task';

/**
 * User agent stylesheet base specificity.
 */
export const SPECIFICITY_USER_AGENT: number = 0;

/**
 * User stylesheet base specificity.
 */
export const SPECIFICITY_USER: number = 16777216;

/**
 * Author stylesheet ("normal" stylesheet) base specificity.
 */
export const SPECIFICITY_AUTHOR: number = 33554432;

/**
 * Style attribute base specificity.
 */
export const SPECIFICITY_STYLE: number = 50331648;

/**
 * Style attribute base specificity when !important is used.
 */
export const SPECIFICITY_STYLE_IMPORTANT: number = 67108864;

/**
 * Author stylesheet base specificity when !important is used.
 */
export const SPECIFICITY_AUTHOR_IMPORTANT: number = 83886080;

/**
 * User stylesheet base specificity when !important is used.
 */
export const SPECIFICITY_USER_IMPORTANT: number = 100663296;

// User stylesheet !important

/**
 * @enum {string}
 */
export enum StylesheetFlavor {
  USER_AGENT = 'UA',
  USER = 'User',
  AUTHOR = 'Author'
}

/**
 * CSS Color value from hash text (without '#' character).
 */
export const colorFromHash = (text: string): css.Color => {
  let num = parseInt(text, 16);
  if (isNaN(num)) {
    throw new Error('E_CSS_COLOR');
  }
  if (text.length == 6) {
    return new css.Color(num);
  }
  if (text.length == 3) {
    num = num & 15 | (num & 15) << 4 | (num & 240) << 4 | (num & 240) << 8 |
        (num & 3840) << 8 | (num & 3840) << 12;
    return new css.Color(num);
  }
  throw new Error('E_CSS_COLOR');
};

export class ParserHandler implements csstok.TokenizerHandler {
  flavor: StylesheetFlavor;

  constructor(public scope: expr.LexicalScope) {
    this.flavor = StylesheetFlavor.AUTHOR;
  }

  getCurrentToken(): csstok.Token {return null;}

  getScope(): expr.LexicalScope {
    return this.scope;
  }

  error(mnemonics: string, token: csstok.Token): void {}

  startStylesheet(flavor: StylesheetFlavor): void {
    this.flavor = flavor;
  }

  tagSelector(ns: string|null, name: string|null): void {}

  classSelector(name: string): void {}

  pseudoclassSelector(name: string, params: (number|string)[]): void {}

  pseudoelementSelector(name: string, params: (number|string)[]): void {}

  idSelector(id: string): void {}

  attributeSelector(
      ns: string, name: string, op: csstok.TokenType,
      value: string|null): void {}

  descendantSelector(): void {}

  childSelector(): void {}

  adjacentSiblingSelector(): void {}

  followingSiblingSelector(): void {}

  nextSelector(): void {}

  startSelectorRule(): void {}

  startFontFaceRule(): void {}

  startFootnoteRule(pseudoelem: string|null): void {}

  startViewportRule(): void {}

  startDefineRule(): void {}

  startRegionRule(): void {}

  startPageRule(): void {}

  startPageMarginBoxRule(name: string): void {}

  startWhenRule(expr: css.Expr): void {}

  startMediaRule(expr: css.Expr): void {
    this.startWhenRule(expr);
  }

  startFlowRule(flowName: string): void {}

  startPageTemplateRule(): void {}

  startPageMasterRule(
      name: string|null, pseudoName: string|null, classes: string[]): void {}

  startPartitionRule(
      name: string|null, pseudoName: string|null, classes: string[]): void {}

  startPartitionGroupRule(
      name: string|null, pseudoName: string|null, classes: string[]): void {}

  startRuleBody(): void {}

  property(name: string, value: css.Val, important: boolean): void {}

  endRule(): void {}

  /**
   * @param funcName The name of the function taking a selector list as an
   *     argument
   */
  startFuncWithSelector(funcName: string): void {}

  endFuncWithSelector(): void {}

  getImportantSpecificity(): number {
    switch (this.flavor) {
      case StylesheetFlavor.USER_AGENT:
        return SPECIFICITY_USER_AGENT;
      case StylesheetFlavor.USER:
        return SPECIFICITY_USER_IMPORTANT;
      default:
        return SPECIFICITY_AUTHOR_IMPORTANT;
    }
  }

  getBaseSpecificity(): number {
    switch (this.flavor) {
      case StylesheetFlavor.USER_AGENT:
        return SPECIFICITY_USER_AGENT;
      case StylesheetFlavor.USER:
        return SPECIFICITY_USER;
      default:
        return SPECIFICITY_AUTHOR;
    }
  }
}

export class DispatchParserHandler extends ParserHandler {
  stack: ParserHandler[] = [];
  tokenizer: csstok.Tokenizer = null;
  slave: ParserHandler = null;

  constructor() {
    super(null);
  }

  pushHandler(slave: ParserHandler): void {
    this.stack.push(this.slave);
    this.slave = slave;
  }

  popHandler(): void {
    this.slave = this.stack.pop();
  }

  /**
   * @override
   */
  getCurrentToken() {
    if (this.tokenizer) {
      return this.tokenizer.token();
    }
    return null;
  }

  /**
   * @override
   */
  getScope() {
    return this.slave.getScope();
  }

  /**
   * Forwards call to slave.
   * @override
   */
  error(mnemonics, token) {
    this.slave.error(mnemonics, token);
  }

  /**
   * Called by a slave.
   */
  errorMsg(mnemonics: string, token: csstok.Token): void {
    logging.logger.warn(mnemonics);
  }

  /**
   * @override
   */
  startStylesheet(flavor) {
    super.startStylesheet(flavor);
    if (this.stack.length > 0) {
      // This can occur as a result of an error
      this.slave = this.stack[0];
      this.stack = [];
    }
    this.slave.startStylesheet(flavor);
  }

  /**
   * @override
   */
  tagSelector(ns, name) {
    this.slave.tagSelector(ns, name);
  }

  /**
   * @override
   */
  classSelector(name) {
    this.slave.classSelector(name);
  }

  /**
   * @override
   */
  pseudoclassSelector(name, params) {
    this.slave.pseudoclassSelector(name, params);
  }

  /**
   * @override
   */
  pseudoelementSelector(name, params) {
    this.slave.pseudoelementSelector(name, params);
  }

  /**
   * @override
   */
  idSelector(id) {
    this.slave.idSelector(id);
  }

  /**
   * @override
   */
  attributeSelector(ns, name, op, value) {
    this.slave.attributeSelector(ns, name, op, value);
  }

  /**
   * @override
   */
  descendantSelector() {
    this.slave.descendantSelector();
  }

  /**
   * @override
   */
  childSelector() {
    this.slave.childSelector();
  }

  /**
   * @override
   */
  adjacentSiblingSelector() {
    this.slave.adjacentSiblingSelector();
  }

  /**
   * @override
   */
  followingSiblingSelector() {
    this.slave.followingSiblingSelector();
  }

  /**
   * @override
   */
  nextSelector() {
    this.slave.nextSelector();
  }

  /**
   * @override
   */
  startSelectorRule() {
    this.slave.startSelectorRule();
  }

  /**
   * @override
   */
  startFontFaceRule() {
    this.slave.startFontFaceRule();
  }

  /**
   * @override
   */
  startFootnoteRule(pseudoelem) {
    this.slave.startFootnoteRule(pseudoelem);
  }

  /**
   * @override
   */
  startViewportRule() {
    this.slave.startViewportRule();
  }

  /**
   * @override
   */
  startDefineRule() {
    this.slave.startDefineRule();
  }

  /**
   * @override
   */
  startRegionRule() {
    this.slave.startRegionRule();
  }

  /**
   * @override
   */
  startPageRule() {
    this.slave.startPageRule();
  }

  /**
   * @override
   */
  startPageMarginBoxRule(name) {
    this.slave.startPageMarginBoxRule(name);
  }

  /**
   * @override
   */
  startWhenRule(expr) {
    this.slave.startWhenRule(expr);
  }

  /**
   * @override
   */
  startFlowRule(flowName) {
    this.slave.startFlowRule(flowName);
  }

  /**
   * @override
   */
  startPageTemplateRule() {
    this.slave.startPageTemplateRule();
  }

  /**
   * @override
   */
  startPageMasterRule(name, pseudoName, classes) {
    this.slave.startPageMasterRule(name, pseudoName, classes);
  }

  /**
   * @override
   */
  startPartitionRule(name, pseudoName, classes) {
    this.slave.startPartitionRule(name, pseudoName, classes);
  }

  /**
   * @override
   */
  startPartitionGroupRule(name, pseudoName, classes) {
    this.slave.startPartitionGroupRule(name, pseudoName, classes);
  }

  /**
   * @override
   */
  startRuleBody() {
    this.slave.startRuleBody();
  }

  /**
   * @override
   */
  property(name, value, important) {
    this.slave.property(name, value, important);
  }

  /**
   * @override
   */
  endRule() {
    this.slave.endRule();
  }

  /**
   * @override
   */
  startFuncWithSelector(funcName) {
    this.slave.startFuncWithSelector(funcName);
  }

  /**
   * @override
   */
  endFuncWithSelector() {
    this.slave.endFuncWithSelector();
  }
}

export class SkippingParserHandler extends ParserHandler {
  depth: number = 0;
  flavor: any;

  constructor(
      scope: expr.LexicalScope, public owner: DispatchParserHandler,
      public readonly topLevel) {
    super(scope);
    if (owner) {
      this.flavor = owner.flavor;
    }
  }

  /**
   * @override
   */
  getCurrentToken() {
    return this.owner.getCurrentToken();
  }

  /**
   * @override
   */
  error(mnemonics, token) {
    this.owner.errorMsg(mnemonics, token);
  }

  /**
   * @override
   */
  startRuleBody() {
    this.depth++;
  }

  /**
   * @override
   */
  endRule() {
    if (--this.depth == 0 && !this.topLevel) {
      this.owner.popHandler();
    }
  }
}

export class SlaveParserHandler extends SkippingParserHandler {
  constructor(
      scope: expr.LexicalScope, owner: DispatchParserHandler,
      topLevel: boolean) {
    super(scope, owner, topLevel);
  }

  report(message: string): void {
    this.error(message, this.getCurrentToken());
  }

  reportAndSkip(message: string): void {
    this.report(message);
    this.owner.pushHandler(
        new SkippingParserHandler(this.scope, this.owner, false));
  }

  /**
   * @override
   */
  startSelectorRule() {
    this.reportAndSkip('E_CSS_UNEXPECTED_SELECTOR');
  }

  /**
   * @override
   */
  startFontFaceRule() {
    this.reportAndSkip('E_CSS_UNEXPECTED_FONT_FACE');
  }

  /**
   * @override
   */
  startFootnoteRule(pseudoelem) {
    this.reportAndSkip('E_CSS_UNEXPECTED_FOOTNOTE');
  }

  /**
   * @override
   */
  startViewportRule() {
    this.reportAndSkip('E_CSS_UNEXPECTED_VIEWPORT');
  }

  /**
   * @override
   */
  startDefineRule() {
    this.reportAndSkip('E_CSS_UNEXPECTED_DEFINE');
  }

  /**
   * @override
   */
  startRegionRule() {
    this.reportAndSkip('E_CSS_UNEXPECTED_REGION');
  }

  /**
   * @override
   */
  startPageRule() {
    this.reportAndSkip('E_CSS_UNEXPECTED_PAGE');
  }

  /**
   * @override
   */
  startWhenRule(expr) {
    this.reportAndSkip('E_CSS_UNEXPECTED_WHEN');
  }

  /**
   * @override
   */
  startFlowRule(flowName) {
    this.reportAndSkip('E_CSS_UNEXPECTED_FLOW');
  }

  /**
   * @override
   */
  startPageTemplateRule() {
    this.reportAndSkip('E_CSS_UNEXPECTED_PAGE_TEMPLATE');
  }

  /**
   * @override
   */
  startPageMasterRule(name, pseudoName, classes) {
    this.reportAndSkip('E_CSS_UNEXPECTED_PAGE_MASTER');
  }

  /**
   * @override
   */
  startPartitionRule(name, pseudoName, classes) {
    this.reportAndSkip('E_CSS_UNEXPECTED_PARTITION');
  }

  /**
   * @override
   */
  startPartitionGroupRule(name, pseudoName, classes) {
    this.reportAndSkip('E_CSS_UNEXPECTED_PARTITION_GROUP');
  }

  /**
   * @override
   */
  startFuncWithSelector(funcName) {
    this.reportAndSkip('E_CSS_UNEXPECTED_SELECTOR_FUNC');
  }

  /**
   * @override
   */
  endFuncWithSelector() {
    this.reportAndSkip('E_CSS_UNEXPECTED_END_SELECTOR_FUNC');
  }

  /**
   * @override
   */
  property(name, value, important) {
    this.error('E_CSS_UNEXPECTED_PROPERTY', this.getCurrentToken());
  }
}

export const actionsBase: Action[] = [];

export const actionsStyleAttribute: Action[] = [];

export const actionsSelector: Action[] = [];

export const actionsSelectorInFunc: Action[] = [];

export const actionsSelectorCont: Action[] = [];

export const actionsSelectorStart: Action[] = [];

export const actionsPropVal: Action[] = [];

export const actionsExprVal: Action[] = [];

export const actionsExprOp: Action[] = [];

export const actionsError: Action[] = [];

export const actionsErrorDecl: Action[] = [];

export const actionsErrorSelector: Action[] = [];

export const priority: number[] = [];

/**
 * @enum {number}
 */
export enum Action {
  SELECTOR_NAME_1 = 1,
  SELECTOR_NAME,
  SELECTOR_ANY_1,
  SELECTOR_ANY,
  SELECTOR_ID_1,
  SELECTOR_ID,
  SELECTOR_CLASS_1,
  SELECTOR_CLASS,
  SELECTOR_ATTR_1,
  SELECTOR_ATTR,
  SELECTOR_CHILD,
  SELECTOR_SIBLING,
  SELECTOR_BODY,
  SELECTOR_PSEUDOCLASS,
  VAL_IDENT,
  VAL_HASH,
  VAL_NUM,
  VAL_INT,
  VAL_NUMERIC,
  VAL_STR,
  VAL_URL,
  VAL_COMMA,
  VAL_SLASH,
  VAL_FUNC,
  VAL_C_PAR,
  VAL_END,
  RULE_END,
  IDENT,
  SELECTOR_START,
  AT,
  EXPR_IDENT,
  EXPR_NUM,
  EXPR_NUMERIC,
  EXPR_STR,
  EXPR_PARAM,
  EXPR_PREFIX,
  EXPR_INFIX,
  EXPR_FUNC,
  EXPR_C_PAR,
  EXPR_O_PAR,
  SELECTOR_NEXT,
  SELECTOR_PSEUDOELEM,
  EXPR_O_BRC,
  VAL_FINISH,
  EXPR_INFIX_NAME,
  PROP,
  VAL_BANG,
  VAL_BRC,
  EXPR_SEMICOL,
  ERROR_PUSH,
  ERROR_POP,
  ERROR_POP_DECL,
  ERROR_SEMICOL,
  VAL_PLUS,
  SELECTOR_PSEUDOCLASS_1,
  SELECTOR_FOLLOWING_SIBLING,
  DONE = 200
}

export const OP_MEDIA_AND: number = csstok.TokenType.LAST + 1;

(() => {
  actionsBase[csstok.TokenType.IDENT] = Action.IDENT;
  actionsBase[csstok.TokenType.STAR] = Action.SELECTOR_START;
  actionsBase[csstok.TokenType.HASH] = Action.SELECTOR_START;
  actionsBase[csstok.TokenType.CLASS] = Action.SELECTOR_START;
  actionsBase[csstok.TokenType.O_BRK] = Action.SELECTOR_START;
  actionsBase[csstok.TokenType.COLON] = Action.SELECTOR_START;
  actionsBase[csstok.TokenType.AT] = Action.AT;
  actionsBase[csstok.TokenType.C_BRC] = Action.RULE_END;
  actionsBase[csstok.TokenType.EOF] = Action.DONE;
  actionsStyleAttribute[csstok.TokenType.IDENT] = Action.PROP;
  actionsStyleAttribute[csstok.TokenType.EOF] = Action.DONE;
  actionsSelectorStart[csstok.TokenType.IDENT] = Action.SELECTOR_NAME;
  actionsSelectorStart[csstok.TokenType.STAR] = Action.SELECTOR_ANY;
  actionsSelectorStart[csstok.TokenType.HASH] = Action.SELECTOR_ID;
  actionsSelectorStart[csstok.TokenType.CLASS] = Action.SELECTOR_CLASS;
  actionsSelectorStart[csstok.TokenType.O_BRK] = Action.SELECTOR_ATTR;
  actionsSelectorStart[csstok.TokenType.COLON] = Action.SELECTOR_PSEUDOCLASS;

  actionsSelector[csstok.TokenType.GT] = Action.SELECTOR_CHILD;
  actionsSelector[csstok.TokenType.PLUS] = Action.SELECTOR_SIBLING;
  actionsSelector[csstok.TokenType.TILDE] = Action.SELECTOR_FOLLOWING_SIBLING;
  actionsSelector[csstok.TokenType.IDENT] = Action.SELECTOR_NAME_1;
  actionsSelector[csstok.TokenType.STAR] = Action.SELECTOR_ANY_1;
  actionsSelector[csstok.TokenType.HASH] = Action.SELECTOR_ID_1;
  actionsSelector[csstok.TokenType.CLASS] = Action.SELECTOR_CLASS_1;
  actionsSelector[csstok.TokenType.O_BRK] = Action.SELECTOR_ATTR_1;
  actionsSelector[csstok.TokenType.O_BRC] = Action.SELECTOR_BODY;
  actionsSelector[csstok.TokenType.COLON] = Action.SELECTOR_PSEUDOCLASS_1;
  actionsSelector[csstok.TokenType.COL_COL] = Action.SELECTOR_PSEUDOELEM;
  actionsSelector[csstok.TokenType.COMMA] = Action.SELECTOR_NEXT;
  actionsSelectorInFunc[csstok.TokenType.IDENT] = Action.SELECTOR_NAME_1;
  actionsSelectorInFunc[csstok.TokenType.STAR] = Action.SELECTOR_ANY_1;
  actionsSelectorInFunc[csstok.TokenType.HASH] = Action.SELECTOR_ID_1;
  actionsSelectorInFunc[csstok.TokenType.CLASS] = Action.SELECTOR_CLASS_1;
  actionsSelectorInFunc[csstok.TokenType.O_BRK] = Action.SELECTOR_ATTR_1;
  actionsSelectorInFunc[csstok.TokenType.C_PAR] = Action.DONE;
  actionsSelectorInFunc[csstok.TokenType.COLON] = Action.SELECTOR_PSEUDOCLASS_1;
  actionsSelectorCont[csstok.TokenType.IDENT] = Action.SELECTOR_NAME;
  actionsSelectorCont[csstok.TokenType.STAR] = Action.SELECTOR_ANY;
  actionsSelectorCont[csstok.TokenType.HASH] = Action.SELECTOR_ID;
  actionsSelectorCont[csstok.TokenType.CLASS] = Action.SELECTOR_CLASS;
  actionsSelectorCont[csstok.TokenType.COLON] = Action.SELECTOR_PSEUDOCLASS;
  actionsSelectorCont[csstok.TokenType.COL_COL] = Action.SELECTOR_PSEUDOELEM;
  actionsSelectorCont[csstok.TokenType.O_BRK] = Action.SELECTOR_ATTR;
  actionsSelectorCont[csstok.TokenType.O_BRC] = Action.SELECTOR_BODY;
  actionsPropVal[csstok.TokenType.IDENT] = Action.VAL_IDENT;
  actionsPropVal[csstok.TokenType.HASH] = Action.VAL_HASH;
  actionsPropVal[csstok.TokenType.NUM] = Action.VAL_NUM;
  actionsPropVal[csstok.TokenType.INT] = Action.VAL_INT;
  actionsPropVal[csstok.TokenType.NUMERIC] = Action.VAL_NUMERIC;
  actionsPropVal[csstok.TokenType.STR] = Action.VAL_STR;
  actionsPropVal[csstok.TokenType.URL] = Action.VAL_URL;
  actionsPropVal[csstok.TokenType.COMMA] = Action.VAL_COMMA;
  actionsPropVal[csstok.TokenType.SLASH] = Action.VAL_SLASH;
  actionsPropVal[csstok.TokenType.FUNC] = Action.VAL_FUNC;
  actionsPropVal[csstok.TokenType.C_PAR] = Action.VAL_C_PAR;
  actionsPropVal[csstok.TokenType.SEMICOL] = Action.VAL_END;
  actionsPropVal[csstok.TokenType.C_BRC] = Action.VAL_BRC;
  actionsPropVal[csstok.TokenType.BANG] = Action.VAL_BANG;
  actionsPropVal[csstok.TokenType.PLUS] = Action.VAL_PLUS;
  actionsPropVal[csstok.TokenType.EOF] = Action.VAL_FINISH;
  actionsExprVal[csstok.TokenType.IDENT] = Action.EXPR_IDENT;
  actionsExprVal[csstok.TokenType.NUM] = Action.EXPR_NUM;
  actionsExprVal[csstok.TokenType.INT] = Action.EXPR_NUM;
  actionsExprVal[csstok.TokenType.NUMERIC] = Action.EXPR_NUMERIC;
  actionsExprVal[csstok.TokenType.STR] = Action.EXPR_STR;
  actionsExprVal[csstok.TokenType.O_PAR] = Action.EXPR_O_PAR;
  actionsExprVal[csstok.TokenType.FUNC] = Action.EXPR_FUNC;
  actionsExprVal[csstok.TokenType.BANG] = Action.EXPR_PREFIX;
  actionsExprVal[csstok.TokenType.MINUS] = Action.EXPR_PREFIX;
  actionsExprVal[csstok.TokenType.DOLLAR] = Action.EXPR_PARAM;
  actionsExprOp[csstok.TokenType.IDENT] = Action.EXPR_INFIX_NAME;
  actionsExprOp[csstok.TokenType.COMMA] = Action.EXPR_INFIX;
  actionsExprOp[csstok.TokenType.GT] = Action.EXPR_INFIX;
  actionsExprOp[csstok.TokenType.LT] = Action.EXPR_INFIX;
  actionsExprOp[csstok.TokenType.GT_EQ] = Action.EXPR_INFIX;
  actionsExprOp[csstok.TokenType.LT_EQ] = Action.EXPR_INFIX;
  actionsExprOp[csstok.TokenType.EQ] = Action.EXPR_INFIX;
  actionsExprOp[csstok.TokenType.EQ_EQ] = Action.EXPR_INFIX;
  actionsExprOp[csstok.TokenType.AMP_AMP] = Action.EXPR_INFIX;
  actionsExprOp[csstok.TokenType.BAR_BAR] = Action.EXPR_INFIX;
  actionsExprOp[csstok.TokenType.PLUS] = Action.EXPR_INFIX;
  actionsExprOp[csstok.TokenType.MINUS] = Action.EXPR_INFIX;
  actionsExprOp[csstok.TokenType.SLASH] = Action.EXPR_INFIX;
  actionsExprOp[csstok.TokenType.PERCENT] = Action.EXPR_INFIX;
  actionsExprOp[csstok.TokenType.STAR] = Action.EXPR_INFIX;
  actionsExprOp[csstok.TokenType.COLON] = Action.EXPR_INFIX;
  actionsExprOp[csstok.TokenType.QMARK] = Action.EXPR_INFIX;
  actionsExprOp[csstok.TokenType.C_PAR] = Action.EXPR_C_PAR;
  actionsExprOp[csstok.TokenType.O_BRC] = Action.EXPR_O_BRC;
  actionsExprOp[csstok.TokenType.SEMICOL] = Action.EXPR_SEMICOL;
  actionsError[csstok.TokenType.EOF] = Action.DONE;
  actionsError[csstok.TokenType.O_BRC] = Action.ERROR_PUSH;
  actionsError[csstok.TokenType.C_BRC] = Action.ERROR_POP;
  actionsError[csstok.TokenType.O_BRK] = Action.ERROR_PUSH;
  actionsError[csstok.TokenType.C_BRK] = Action.ERROR_POP;
  actionsError[csstok.TokenType.O_PAR] = Action.ERROR_PUSH;
  actionsError[csstok.TokenType.C_PAR] = Action.ERROR_POP;
  actionsError[csstok.TokenType.SEMICOL] = Action.ERROR_SEMICOL;
  actionsErrorDecl[csstok.TokenType.EOF] = Action.DONE;
  actionsErrorDecl[csstok.TokenType.O_BRC] = Action.ERROR_PUSH;
  actionsErrorDecl[csstok.TokenType.C_BRC] = Action.ERROR_POP_DECL;
  actionsErrorDecl[csstok.TokenType.O_BRK] = Action.ERROR_PUSH;
  actionsErrorDecl[csstok.TokenType.C_BRK] = Action.ERROR_POP;
  actionsErrorDecl[csstok.TokenType.O_PAR] = Action.ERROR_PUSH;
  actionsErrorDecl[csstok.TokenType.C_PAR] = Action.ERROR_POP;
  actionsErrorDecl[csstok.TokenType.SEMICOL] = Action.ERROR_SEMICOL;
  actionsErrorSelector[csstok.TokenType.EOF] = Action.DONE;
  actionsErrorSelector[csstok.TokenType.O_BRC] = Action.ERROR_PUSH;
  actionsErrorSelector[csstok.TokenType.C_BRC] = Action.ERROR_POP;
  actionsErrorSelector[csstok.TokenType.O_BRK] = Action.ERROR_PUSH;
  actionsErrorSelector[csstok.TokenType.C_BRK] = Action.ERROR_POP;
  actionsErrorSelector[csstok.TokenType.O_PAR] = Action.ERROR_PUSH;
  actionsErrorSelector[csstok.TokenType.C_PAR] = Action.ERROR_POP;
  priority[csstok.TokenType.C_PAR] = 0;
  priority[csstok.TokenType.COMMA] = 0;
  priority[csstok.TokenType.QMARK] = 1;
  priority[csstok.TokenType.COLON] = 1;
  priority[csstok.TokenType.AMP_AMP] = 2;
  priority[csstok.TokenType.BAR_BAR] = 2;
  priority[csstok.TokenType.LT] = 3;
  priority[csstok.TokenType.GT] = 3;
  priority[csstok.TokenType.LT_EQ] = 3;
  priority[csstok.TokenType.GT_EQ] = 3;
  priority[csstok.TokenType.EQ] = 3;
  priority[csstok.TokenType.EQ_EQ] = 3;
  priority[csstok.TokenType.BANG_EQ] = 3;
  priority[csstok.TokenType.PLUS] = 4;
  priority[csstok.TokenType.MINUS] = 4;
  priority[csstok.TokenType.STAR] = 5;
  priority[csstok.TokenType.SLASH] = 5;
  priority[csstok.TokenType.PERCENT] = 5;
  priority[csstok.TokenType.EOF] = 6;
  priority[OP_MEDIA_AND] = 2;
})();

/**
 * @enum {number}
 */
export enum ExprContext {
  PROP,
  WHEN,
  MEDIA,
  IMPORT
}

export class Parser {
  valStack: any[] = [];
  namespacePrefixToURI: {[key: string]: string} = {};
  defaultNamespaceURI: string|null = null;
  propName: string|null = null;
  propImportant: boolean = false;
  exprContext: ExprContext;
  result: css.Val = null;
  importReady: boolean = false;
  importURL: string|null = null;
  importCondition: css.Expr = null;
  errorBrackets: number[] = [];
  ruleStack: string[] = [];
  regionRule: boolean = false;
  pageRule: boolean = false;

  constructor(
      public actions: Action[], public tokenizer: csstok.Tokenizer,
      public readonly handler: ParserHandler, public baseURL: string) {
    this.exprContext = ExprContext.MEDIA;
  }

  extractVals(sep: string, index: number): css.Val[] {
    const arr: css.Val[] = [];
    const valStack = this.valStack;
    while (true) {
      arr.push((valStack[index++] as css.Val));
      if (index == valStack.length) {
        break;
      }
      if (valStack[index++] != sep) {
        throw new Error('Unexpected state');
      }
    }
    return arr;
  }

  valStackReduce(sep: string, token: csstok.Token): css.Val {
    const valStack = this.valStack;
    let index = valStack.length;
    let v;
    do {
      v = valStack[--index];
    } while (typeof v != 'undefined' && typeof v != 'string');
    let count = valStack.length - (index + 1);
    if (count > 1) {
      valStack.splice(
          index + 1, count,
          new css.SpaceList(valStack.slice(index + 1, valStack.length)));
    }
    if (sep == ',') {
      return null;
    }
    index++;
    do {
      v = valStack[--index];
    } while (typeof v != 'undefined' && (typeof v != 'string' || v == ','));
    count = valStack.length - (index + 1);
    if (v == '(') {
      if (sep != ')') {
        this.handler.error('E_CSS_MISMATCHED_C_PAR', token);
        this.actions = actionsErrorDecl;
        return null;
      }
      const func = new css.Func(
          (valStack[index - 1] as string), this.extractVals(',', index + 1));
      valStack.splice(index - 1, count + 2, func);
      return null;
    }
    if (sep != ';' || index >= 0) {
      this.handler.error('E_CSS_UNEXPECTED_VAL_END', token);
      this.actions = actionsErrorDecl;
      return null;
    }
    if (count > 1) {
      return new css.CommaList(this.extractVals(',', index + 1));
    }
    return (valStack[0] as css.Val);
  }

  exprError(mnemonics: string, token: csstok.Token) {
    this.actions = this.propName ? actionsErrorDecl : actionsError;
    this.handler.error(mnemonics, token);
  }

  exprStackReduce(op: number, token: csstok.Token): boolean {
    const valStack = this.valStack;
    const handler = this.handler;
    let val = (valStack.pop() as expr.Val);
    let val2: expr.Val;
    while (true) {
      let tok = valStack.pop();
      if (op == csstok.TokenType.C_PAR) {
        const args: expr.Val[] = [val];
        while (tok == csstok.TokenType.COMMA) {
          args.unshift(valStack.pop());
          tok = valStack.pop();
        }
        if (typeof tok == 'string') {
          if (tok == '{') {
            // reached CSS portion of the stack
            while (args.length >= 2) {
              const e1 = args.shift();
              const e2 = args.shift();
              const er = new expr.OrMedia(handler.getScope(), e1, e2);
              args.unshift(er);
            }
            valStack.push(new css.Expr(args[0]));
            return true;
          } else {
            if (tok == '(') {
              // call
              const name2 = (valStack.pop() as string);
              const name1 = (valStack.pop() as string | null);
              val = new expr.Call(
                  handler.getScope(), expr.makeQualifiedName(name1, name2),
                  args);
              op = csstok.TokenType.EOF;
              continue;
            }
          }
        }
        if (tok == csstok.TokenType.O_PAR) {
          if (val.isMediaName()) {
            val = new expr.MediaTest(
                handler.getScope(), (val as expr.MediaName), null);
          }
          op = csstok.TokenType.EOF;
          continue;
        }
      } else {
        if (typeof tok == 'string') {
          // reached CSS portion of the stack or a call
          valStack.push(tok);
          break;
        }
      }
      if ((tok as number) < 0) {
        // prefix
        if (tok == -csstok.TokenType.BANG) {
          val = new expr.Not(handler.getScope(), val);
        } else {
          if (tok == -csstok.TokenType.MINUS) {
            val = new expr.Negate(handler.getScope(), val);
          } else {
            this.exprError('F_UNEXPECTED_STATE', token);
            return false;
          }
        }
      } else {
        // infix
        if (priority[op] > priority[(tok as number)]) {
          valStack.push(tok);
          break;
        }
        val2 = (valStack.pop() as expr.Val);
        switch (tok) {
          case csstok.TokenType.AMP_AMP:
            val = new expr.And(handler.getScope(), val2, val);
            break;
          case OP_MEDIA_AND:
            val = new expr.AndMedia(handler.getScope(), val2, val);
            break;
          case csstok.TokenType.BAR_BAR:
            val = new expr.Or(handler.getScope(), val2, val);
            break;
          case csstok.TokenType.LT:
            val = new expr.Lt(handler.getScope(), val2, val);
            break;
          case csstok.TokenType.GT:
            val = new expr.Gt(handler.getScope(), val2, val);
            break;
          case csstok.TokenType.LT_EQ:
            val = new expr.Le(handler.getScope(), val2, val);
            break;
          case csstok.TokenType.GT_EQ:
            val = new expr.Ge(handler.getScope(), val2, val);
            break;
          case csstok.TokenType.EQ:
          case csstok.TokenType.EQ_EQ:
            val = new expr.Eq(handler.getScope(), val2, val);
            break;
          case csstok.TokenType.BANG_EQ:
            val = new expr.Ne(handler.getScope(), val2, val);
            break;
          case csstok.TokenType.PLUS:
            val = new expr.Add(handler.getScope(), val2, val);
            break;
          case csstok.TokenType.MINUS:
            val = new expr.Subtract(handler.getScope(), val2, val);
            break;
          case csstok.TokenType.STAR:
            val = new expr.Multiply(handler.getScope(), val2, val);
            break;
          case csstok.TokenType.SLASH:
            val = new expr.Divide(handler.getScope(), val2, val);
            break;
          case csstok.TokenType.PERCENT:
            val = new expr.Modulo(handler.getScope(), val2, val);
            break;
          case csstok.TokenType.COLON:
            if (valStack.length > 1) {
              switch (valStack[valStack.length - 1]) {
                case csstok.TokenType.QMARK:
                  valStack.pop();
                  val = new expr.Cond(
                      handler.getScope(), (valStack.pop() as expr.Val), val2,
                      val);
                  break;
                case csstok.TokenType.O_PAR:
                  if (val2.isMediaName()) {
                    val = new expr.MediaTest(
                        handler.getScope(), (val2 as expr.MediaName), val);
                  } else {
                    this.exprError('E_CSS_MEDIA_TEST', token);
                    return false;
                  }
                  break;
              }
            } else {
              this.exprError('E_CSS_EXPR_COND', token);
              return false;
            }
            break;
          case csstok.TokenType.QMARK:
            if (op != csstok.TokenType.COLON) {
              this.exprError('E_CSS_EXPR_COND', token);
              return false;
            }

          // fall through
          case csstok.TokenType.O_PAR:

            // don't reduce
            valStack.push(val2);
            valStack.push(tok);
            valStack.push(val);
            return false;
          default:
            this.exprError('F_UNEXPECTED_STATE', token);
            return false;
        }
      }
    }
    valStack.push(val);
    return false;
  }

  readPseudoParams(): (number|string)[] {
    const arr = [];
    while (true) {
      const token = this.tokenizer.token();
      switch (token.type) {
        case csstok.TokenType.IDENT:
          arr.push(token.text);
          break;
        case csstok.TokenType.PLUS:
          arr.push('+');
          break;
        case csstok.TokenType.NUM:
        case csstok.TokenType.INT:
          arr.push(token.num);
          break;
        default:
          return arr;
      }
      this.tokenizer.consume();
    }
  }

  /**
   * Read `an+b` argument of pseudoclasses. Roughly based on the algorithm at
   * https://drafts.csswg.org/css-syntax/#the-anb-type
   */
  private readNthPseudoParams(): number[]|null {
    let hasLeadingPlus = false;
    let token = this.tokenizer.token();
    if (token.type === csstok.TokenType.PLUS) {
      // '+'
      hasLeadingPlus = true;
      this.tokenizer.consume();
      token = this.tokenizer.token();
    } else {
      if (token.type === csstok.TokenType.IDENT &&
          (token.text === 'even' || token.text === 'odd')) {
        // 'even' or 'odd'
        this.tokenizer.consume();
        return [2, token.text === 'odd' ? 1 : 0];
      }
    }
    switch (token.type) {
      case csstok.TokenType.NUMERIC:
        if (hasLeadingPlus && token.num < 0) {
          // reject '+-an'
          return null;
        }

      // FALLTHROUGH
      case csstok.TokenType.IDENT:
        if (hasLeadingPlus && token.text.charAt(0) === '-') {
          // reject '+-n'
          return null;
        }
        if (token.text === 'n' || token.text === '-n') {
          // 'an', 'an +b', 'an -b', 'n', 'n +b', 'n -b', '-n', '-n +b' '-n -b'
          if (hasLeadingPlus && token.precededBySpace) {
            // reject '+ an'
            return null;
          }
          let a = token.text === '-n' ? -1 : 1;
          if (token.type === csstok.TokenType.NUMERIC) {
            a = token.num;
          }
          let b = 0;
          this.tokenizer.consume();
          token = this.tokenizer.token();
          const hasMinusSign = token.type === csstok.TokenType.MINUS;
          const hasSign = token.type === csstok.TokenType.PLUS || hasMinusSign;
          if (hasSign) {
            // 'an +b', 'an - b'
            this.tokenizer.consume();
            token = this.tokenizer.token();
          }
          if (token.type === csstok.TokenType.INT) {
            b = token.num;

            // reject 'an + -0', 'an - -0'
            if (1 / b === 1 / -0) {
              // negative zero: 'an -0'
              b = 0;
              if (hasSign) {
                return null;
              }
            } else {
              // reject 'an + -b', 'an - -b'
              if (b < 0) {
                // negative: 'an -b'
                if (hasSign) {
                  return null;
                }
              } else {
                if (b >= 0) {
                  // positive or positive zero: 'an +b'
                  if (!hasSign) {
                    return null;
                  }
                }
              }
            }
            this.tokenizer.consume();
          } else {
            if (hasSign) {
              // reject 'an + (non-integer)'
              return null;
            }
          }
          return [a, hasMinusSign && b > 0 ? -b : b];
        } else {
          if (token.text === 'n-' || token.text === '-n-') {
            // 'an- b', '-n- b'
            if (hasLeadingPlus && token.precededBySpace) {
              // reject '+ an- b'
              return null;
            }
            let a = token.text === '-n-' ? -1 : 1;
            if (token.type === csstok.TokenType.NUMERIC) {
              a = token.num;
            }
            this.tokenizer.consume();
            token = this.tokenizer.token();
            if (token.type === csstok.TokenType.INT) {
              if (token.num < 0 || 1 / token.num === 1 / -0) {
                // reject 'an- -b', 'an- -0'
                return null;
              } else {
                this.tokenizer.consume();
                return [a, token.num];
              }
            }
          } else {
            let r = token.text.match(/^n(-[0-9]+)$/);
            if (r) {
              // 'n-b', 'an-b'
              if (hasLeadingPlus && token.precededBySpace) {
                // reject '+ an-b'
                return null;
              }
              this.tokenizer.consume();
              return [
                token.type === csstok.TokenType.NUMERIC ? token.num : 1,
                parseInt(r[1], 10)
              ];
            }
            r = token.text.match(/^-n(-[0-9]+)$/);

            // '-n-b'
            if (r) {
              this.tokenizer.consume();
              return [-1, parseInt(r[1], 10)];
            }
          }
        }
        return null;
      case csstok.TokenType.INT:
        if (hasLeadingPlus && (token.precededBySpace || token.num < 0)) {
          return null;
        }
        this.tokenizer.consume();
        return [0, token.num];
    }
    return null;
  }

  makeCondition(classes: string|null, condition: expr.Val): css.Expr {
    const scope = this.handler.getScope();
    if (!scope) {
      return null;
    }
    condition = condition || scope._true;
    if (classes) {
      const classList = classes.split(/\s+/);
      for (const className of classList) {
        switch (className) {
          case 'vertical':
            condition = expr.and(
                scope, condition,
                new expr.Not(scope, new expr.Named(scope, 'pref-horizontal')));
            break;
          case 'horizontal':
            condition = expr.and(
                scope, condition, new expr.Named(scope, 'pref-horizontal'));
            break;
          case 'day':
            condition = expr.and(
                scope, condition,
                new expr.Not(scope, new expr.Named(scope, 'pref-night-mode')));
            break;
          case 'night':
            condition = expr.and(
                scope, condition, new expr.Named(scope, 'pref-night-mode'));
            break;
          default:
            condition = scope._false;
        }
      }
    }
    if (condition === scope._true) {
      return null;
    }
    return new css.Expr(condition);
  }

  isInsidePropertyOnlyRule(): boolean {
    switch (this.ruleStack[this.ruleStack.length - 1]) {
      case '[selector]':
      case 'font-face':
      case '-epubx-flow':
      case '-epubx-viewport':
      case '-epubx-define':
      case '-adapt-footnote-area':
        return true;
    }
    return false;
  }

  runParser(
      count: number, parsingValue, parsingStyleAttr: boolean, parsingMediaQuery,
      parsingFunctionParam): boolean {
    const handler = this.handler;
    const tokenizer = this.tokenizer;
    const valStack = this.valStack;
    let token: csstok.Token;
    let token1: csstok.Token;
    let ns: string|null;
    let text: string|null;
    let num: number;
    let val: css.Val;
    let params: (number|string)[];
    if (parsingMediaQuery) {
      this.exprContext = ExprContext.MEDIA;
      this.valStack.push('{');
    }
    parserLoop: for (; count > 0; --count) {
      token = tokenizer.token();
      switch (this.actions[token.type]) {
        case Action.IDENT:

          // figure out if this is a property assignment or selector
          if (tokenizer.nthToken(1).type != csstok.TokenType.COLON) {
            // cannot be property assignment
            if (this.isInsidePropertyOnlyRule()) {
              handler.error('E_CSS_COLON_EXPECTED', tokenizer.nthToken(1));
              this.actions = actionsErrorDecl;
            } else {
              this.actions = actionsSelectorStart;
              handler.startSelectorRule();
            }
            continue;
          }
          token1 = tokenizer.nthToken(2);

          // cannot be a selector
          if (token1.precededBySpace ||
              token1.type != csstok.TokenType.IDENT &&
                  token1.type != csstok.TokenType.FUNC) {
          } else {
            // can be either a selector or a property assignment
            tokenizer.mark();
          }
          this.propName = token.text;
          this.propImportant = false;
          tokenizer.consume();
          tokenizer.consume();
          this.actions = actionsPropVal;
          valStack.splice(0, valStack.length);
          continue;
        case Action.PROP:

          // figure out if this is a property assignment or selector
          if (tokenizer.nthToken(1).type != csstok.TokenType.COLON) {
            // cannot be property assignment
            this.actions = actionsErrorDecl;
            handler.error('E_CSS_COLON_EXPECTED', tokenizer.nthToken(1));
            continue;
          }
          this.propName = token.text;
          this.propImportant = false;
          tokenizer.consume();
          tokenizer.consume();
          this.actions = actionsPropVal;
          valStack.splice(0, valStack.length);
          continue;
        case Action.SELECTOR_START:

          // don't consume, process again
          this.actions = actionsSelectorStart;
          handler.startSelectorRule();
          continue;
        case Action.SELECTOR_NAME_1:
          if (!token.precededBySpace) {
            this.actions = actionsErrorSelector;
            handler.error('E_CSS_SPACE_EXPECTED', token);
            continue;
          }
          handler.descendantSelector();

        // fall through
        case Action.SELECTOR_NAME:
          if (tokenizer.nthToken(1).type == csstok.TokenType.BAR) {
            tokenizer.consume();
            tokenizer.consume();
            ns = this.namespacePrefixToURI[token.text];
            if (ns != null) {
              token = tokenizer.token();
              switch (token.type) {
                case csstok.TokenType.IDENT:
                  handler.tagSelector(ns, token.text);
                  if (parsingFunctionParam) {
                    this.actions = actionsSelectorInFunc;
                  } else {
                    this.actions = actionsSelector;
                  }
                  tokenizer.consume();
                  break;
                case csstok.TokenType.STAR:
                  handler.tagSelector(ns, null);
                  if (parsingFunctionParam) {
                    this.actions = actionsSelectorInFunc;
                  } else {
                    this.actions = actionsSelector;
                  }
                  tokenizer.consume();
                  break;
                default:
                  this.actions = actionsError;
                  handler.error('E_CSS_NAMESPACE', token);
              }
            } else {
              this.actions = actionsError;
              handler.error('E_CSS_UNDECLARED_PREFIX', token);
            }
          } else {
            handler.tagSelector(this.defaultNamespaceURI, token.text);
            if (parsingFunctionParam) {
              this.actions = actionsSelectorInFunc;
            } else {
              this.actions = actionsSelector;
            }
            tokenizer.consume();
          }
          continue;
        case Action.SELECTOR_ANY_1:
          if (!token.precededBySpace) {
            this.actions = actionsErrorSelector;
            handler.error('E_CSS_SPACE_EXPECTED', token);
            continue;
          }
          handler.descendantSelector();

        // fall through
        case Action.SELECTOR_ANY:
          if (tokenizer.nthToken(1).type == csstok.TokenType.BAR) {
            tokenizer.consume();
            tokenizer.consume();
            token = tokenizer.token();
            switch (token.type) {
              case csstok.TokenType.IDENT:
                handler.tagSelector(null, token.text);
                if (parsingFunctionParam) {
                  this.actions = actionsSelectorInFunc;
                } else {
                  this.actions = actionsSelector;
                }
                tokenizer.consume();
                break;
              case csstok.TokenType.STAR:
                handler.tagSelector(null, null);
                if (parsingFunctionParam) {
                  this.actions = actionsSelectorInFunc;
                } else {
                  this.actions = actionsSelector;
                }
                tokenizer.consume();
                break;
              default:
                this.actions = actionsError;
                handler.error('E_CSS_NAMESPACE', token);
            }
          } else {
            handler.tagSelector(this.defaultNamespaceURI, null);
            if (parsingFunctionParam) {
              this.actions = actionsSelectorInFunc;
            } else {
              this.actions = actionsSelector;
            }
            tokenizer.consume();
          }
          continue;
        case Action.SELECTOR_ID_1:
          if (token.precededBySpace) {
            handler.descendantSelector();
          }

        // fall through
        case Action.SELECTOR_ID:
          handler.idSelector(token.text);
          if (parsingFunctionParam) {
            this.actions = actionsSelectorInFunc;
          } else {
            this.actions = actionsSelector;
          }
          tokenizer.consume();
          continue;
        case Action.SELECTOR_CLASS_1:
          if (token.precededBySpace) {
            handler.descendantSelector();
          }

        // fall through
        case Action.SELECTOR_CLASS:
          handler.classSelector(token.text);
          if (parsingFunctionParam) {
            this.actions = actionsSelectorInFunc;
          } else {
            this.actions = actionsSelector;
          }
          tokenizer.consume();
          continue;
        case Action.SELECTOR_PSEUDOCLASS_1:
          if (token.precededBySpace) {
            handler.descendantSelector();
          }

        // fall through
        case Action.SELECTOR_PSEUDOCLASS:
          tokenizer.consume();
          token = tokenizer.token();
          pseudoclassType: switch (token.type) {
            case csstok.TokenType.IDENT:
              handler.pseudoclassSelector(token.text, null);
              tokenizer.consume();
              if (parsingFunctionParam) {
                this.actions = actionsSelectorInFunc;
              } else {
                this.actions = actionsSelector;
              }
              continue;
            case csstok.TokenType.FUNC:
              text = token.text;
              tokenizer.consume();
              switch (text) {
                case 'not':
                  this.actions = actionsSelectorStart;
                  handler.startFuncWithSelector('not');
                  if (this.runParser(
                          Number.POSITIVE_INFINITY, false, false, false,
                          true)) {
                    this.actions = actionsSelector;
                  } else {
                    this.actions = actionsErrorSelector;
                  }
                  break parserLoop;
                case 'lang':
                case 'href-epub-type':
                  token = tokenizer.token();
                  if (token.type === csstok.TokenType.IDENT) {
                    params = [token.text];
                    tokenizer.consume();
                    break;
                  } else {
                    break pseudoclassType;
                  }
                case 'nth-child':
                case 'nth-of-type':
                case 'nth-last-child':
                case 'nth-last-of-type':
                  params = this.readNthPseudoParams();
                  if (!params) {
                    break pseudoclassType;
                  } else {
                    break;
                  }
                default:

                  // TODO
                  params = this.readPseudoParams();
              }
              token = tokenizer.token();
              if (token.type == csstok.TokenType.C_PAR) {
                handler.pseudoclassSelector((text as string), params);
                tokenizer.consume();
                if (parsingFunctionParam) {
                  this.actions = actionsSelectorInFunc;
                } else {
                  this.actions = actionsSelector;
                }
                continue;
              }
              break;
          }
          handler.error('E_CSS_PSEUDOCLASS_SYNTAX', token);
          this.actions = actionsError;
          continue;
        case Action.SELECTOR_PSEUDOELEM:
          tokenizer.consume();
          token = tokenizer.token();
          switch (token.type) {
            case csstok.TokenType.IDENT:
              handler.pseudoelementSelector(token.text, null);
              if (parsingFunctionParam) {
                this.actions = actionsSelectorInFunc;
              } else {
                this.actions = actionsSelector;
              }
              tokenizer.consume();
              continue;
            case csstok.TokenType.FUNC:
              text = token.text;
              tokenizer.consume();
              if (text == 'nth-fragment') {
                params = this.readNthPseudoParams();
                if (params === null) {
                  break;
                }
              } else {
                params = this.readPseudoParams();
              }
              token = tokenizer.token();
              if (token.type == csstok.TokenType.C_PAR) {
                handler.pseudoelementSelector((text as string), params);
                if (parsingFunctionParam) {
                  this.actions = actionsSelectorInFunc;
                } else {
                  this.actions = actionsSelector;
                }
                tokenizer.consume();
                continue;
              }
              break;
          }
          handler.error('E_CSS_PSEUDOELEM_SYNTAX', token);
          this.actions = actionsError;
          continue;
        case Action.SELECTOR_ATTR_1:
          if (token.precededBySpace) {
            handler.descendantSelector();
          }

        // fall through
        case Action.SELECTOR_ATTR:
          tokenizer.consume();
          token = tokenizer.token();
          if (token.type == csstok.TokenType.IDENT) {
            text = token.text;
            tokenizer.consume();
          } else {
            if (token.type == csstok.TokenType.STAR) {
              text = null;
              tokenizer.consume();
            } else {
              if (token.type == csstok.TokenType.BAR) {
                text = '';
              } else {
                this.actions = actionsErrorSelector;
                handler.error('E_CSS_ATTR', token);
                tokenizer.consume();
                continue;
              }
            }
          }
          token = tokenizer.token();
          if (token.type == csstok.TokenType.BAR) {
            ns = text ? this.namespacePrefixToURI[text] : text;
            if (ns == null) {
              this.actions = actionsErrorSelector;
              handler.error('E_CSS_UNDECLARED_PREFIX', token);
              tokenizer.consume();
              continue;
            }
            tokenizer.consume();
            token = tokenizer.token();
            if (token.type != csstok.TokenType.IDENT) {
              this.actions = actionsErrorSelector;
              handler.error('E_CSS_ATTR_NAME_EXPECTED', token);
              continue;
            }
            text = token.text;
            tokenizer.consume();
            token = tokenizer.token();
          } else {
            ns = '';
          }
          switch (token.type) {
            case csstok.TokenType.EQ:
            case csstok.TokenType.TILDE_EQ:
            case csstok.TokenType.BAR_EQ:
            case csstok.TokenType.HAT_EQ:
            case csstok.TokenType.DOLLAR_EQ:
            case csstok.TokenType.STAR_EQ:
            case csstok.TokenType.COL_COL:
              num = token.type;
              tokenizer.consume();
              token = tokenizer.token();
              break;
            case csstok.TokenType.C_BRK:
              handler.attributeSelector(
                  (ns as string), (text as string), csstok.TokenType.EOF, null);
              if (parsingFunctionParam) {
                this.actions = actionsSelectorInFunc;
              } else {
                this.actions = actionsSelector;
              }
              tokenizer.consume();
              continue;
            default:
              this.actions = actionsErrorSelector;
              handler.error('E_CSS_ATTR_OP_EXPECTED', token);
              continue;
          }
          switch (token.type) {
            case csstok.TokenType.IDENT:
            case csstok.TokenType.STR:
              handler.attributeSelector(
                  (ns as string), (text as string), num, token.text);
              tokenizer.consume();
              token = tokenizer.token();
              break;
            default:
              this.actions = actionsErrorSelector;
              handler.error('E_CSS_ATTR_VAL_EXPECTED', token);
              continue;
          }
          if (token.type != csstok.TokenType.C_BRK) {
            this.actions = actionsErrorSelector;
            handler.error('E_CSS_ATTR', token);
            continue;
          }
          if (parsingFunctionParam) {
            this.actions = actionsSelectorInFunc;
          } else {
            this.actions = actionsSelector;
          }
          tokenizer.consume();
          continue;
        case Action.SELECTOR_CHILD:
          handler.childSelector();
          this.actions = actionsSelectorCont;
          tokenizer.consume();
          continue;
        case Action.SELECTOR_SIBLING:
          handler.adjacentSiblingSelector();
          this.actions = actionsSelectorCont;
          tokenizer.consume();
          continue;
        case Action.SELECTOR_FOLLOWING_SIBLING:
          handler.followingSiblingSelector();
          this.actions = actionsSelectorCont;
          tokenizer.consume();
          continue;
        case Action.SELECTOR_BODY:
          if (this.regionRule) {
            this.ruleStack.push('-epubx-region');
            this.regionRule = false;
          } else {
            if (this.pageRule) {
              this.ruleStack.push('page');
              this.pageRule = false;
            } else {
              this.ruleStack.push('[selector]');
            }
          }
          handler.startRuleBody();
          this.actions = actionsBase;
          tokenizer.consume();
          continue;
        case Action.SELECTOR_NEXT:
          handler.nextSelector();
          this.actions = actionsSelectorStart;
          tokenizer.consume();
          continue;
        case Action.VAL_IDENT:
          valStack.push(css.getName(token.text));
          tokenizer.consume();
          continue;
        case Action.VAL_HASH:
          num = parseInt(token.text, 16);
          try {
            valStack.push(colorFromHash(token.text));
          } catch (err) {
            handler.error('E_CSS_COLOR', token);
            this.actions = actionsError;
          }
          tokenizer.consume();
          continue;
        case Action.VAL_NUM:
          valStack.push(new css.Num(token.num));
          tokenizer.consume();
          continue;
        case Action.VAL_INT:
          valStack.push(new css.Int(token.num));
          tokenizer.consume();
          continue;
        case Action.VAL_NUMERIC:
          valStack.push(new css.Numeric(token.num, token.text));
          tokenizer.consume();
          continue;
        case Action.VAL_STR:
          valStack.push(new css.Str(token.text));
          tokenizer.consume();
          continue;
        case Action.VAL_URL:
          valStack.push(new css.URL(base.resolveURL(token.text, this.baseURL)));
          tokenizer.consume();
          continue;
        case Action.VAL_COMMA:
          this.valStackReduce(',', token);
          valStack.push(',');
          tokenizer.consume();
          continue;
        case Action.VAL_SLASH:
          valStack.push(css.slash);
          tokenizer.consume();
          continue;
        case Action.VAL_FUNC:
          text = token.text.toLowerCase();
          if (text == '-epubx-expr') {
            // special case
            this.actions = actionsExprVal;
            this.exprContext = ExprContext.PROP;
            valStack.push('{');
          } else {
            valStack.push(text);
            valStack.push('(');
          }
          tokenizer.consume();
          continue;
        case Action.VAL_C_PAR:
          this.valStackReduce(')', token);
          tokenizer.consume();
          continue;
        case Action.VAL_BANG:
          tokenizer.consume();
          token = tokenizer.token();
          token1 = tokenizer.nthToken(1);
          if (token.type == csstok.TokenType.IDENT &&
              token.text.toLowerCase() == 'important' &&
              (token1.type == csstok.TokenType.SEMICOL ||
               token1.type == csstok.TokenType.EOF ||
               token1.type == csstok.TokenType.C_BRC)) {
            tokenizer.consume();
            this.propImportant = true;
            continue;
          }
          this.exprError('E_CSS_SYNTAX', token);
          continue;
        case Action.VAL_PLUS:
          token1 = tokenizer.nthToken(1);
          switch (token1.type) {
            case csstok.TokenType.NUM:
            case csstok.TokenType.NUMERIC:
            case csstok.TokenType.INT:
              if (!token1.precededBySpace) {
                // Plus before number, ignore
                tokenizer.consume();
                continue;
              }
          }
          if (this.actions === actionsPropVal && tokenizer.hasMark()) {
            tokenizer.reset();
            this.actions = actionsSelectorStart;
            handler.startSelectorRule();
            continue;
          } else {
            this.exprError('E_CSS_UNEXPECTED_PLUS', token);
            continue;
          }
        case Action.VAL_END:
          tokenizer.consume();

        // fall through
        case Action.VAL_BRC:
          tokenizer.unmark();
          val = this.valStackReduce(';', token);
          if (val && this.propName) {
            handler.property(
                (this.propName as string), val, this.propImportant);
          }
          this.actions = parsingStyleAttr ? actionsStyleAttribute : actionsBase;
          continue;
        case Action.VAL_FINISH:
          tokenizer.consume();
          tokenizer.unmark();
          val = this.valStackReduce(';', token);
          if (parsingValue) {
            this.result = val;
            return true;
          }
          if (this.propName && val) {
            handler.property(
                (this.propName as string), val, this.propImportant);
          }
          if (parsingStyleAttr) {
            return true;
          }
          this.exprError('E_CSS_SYNTAX', token);
          continue;
        case Action.EXPR_IDENT:
          token1 = tokenizer.nthToken(1);
          if (token1.type == csstok.TokenType.CLASS) {
            if (tokenizer.nthToken(2).type == csstok.TokenType.O_PAR &&
                !tokenizer.nthToken(2).precededBySpace) {
              valStack.push(token.text, token1.text, '(');
              tokenizer.consume();
            } else {
              valStack.push(new expr.Named(
                  handler.getScope(),
                  expr.makeQualifiedName(token.text, token1.text)));
              this.actions = actionsExprOp;
            }
            tokenizer.consume();
          } else {
            if (this.exprContext == ExprContext.MEDIA ||
                this.exprContext == ExprContext.IMPORT) {
              if (token.text.toLowerCase() == 'not') {
                tokenizer.consume();
                valStack.push(
                    new expr.MediaName(handler.getScope(), true, token1.text));
              } else {
                if (token.text.toLowerCase() == 'only') {
                  tokenizer.consume();
                  token = token1;
                }
                valStack.push(
                    new expr.MediaName(handler.getScope(), false, token.text));
              }
            } else {
              valStack.push(new expr.Named(handler.getScope(), token.text));
            }
            this.actions = actionsExprOp;
          }
          tokenizer.consume();
          continue;
        case Action.EXPR_FUNC:
          valStack.push(null, token.text, '(');
          tokenizer.consume();
          continue;
        case Action.EXPR_NUM:
          valStack.push(new expr.Const(handler.getScope(), token.num));
          tokenizer.consume();
          this.actions = actionsExprOp;
          continue;
        case Action.EXPR_NUMERIC:
          text = token.text;
          if (text == '%') {
            if (this.propName && this.propName.match(/height|^(top|bottom)$/)) {
              text = 'vh';
            } else {
              text = 'vw';
            }
          }
          valStack.push(new expr.Numeric(handler.getScope(), token.num, text));
          tokenizer.consume();
          this.actions = actionsExprOp;
          continue;
        case Action.EXPR_STR:
          valStack.push(new expr.Const(handler.getScope(), token.text));
          tokenizer.consume();
          this.actions = actionsExprOp;
          continue;
        case Action.EXPR_PARAM:
          tokenizer.consume();
          token = tokenizer.token();
          if (token.type != csstok.TokenType.INT || token.precededBySpace) {
            this.exprError('E_CSS_SYNTAX', token);
          } else {
            valStack.push(new expr.Param(handler.getScope(), token.num));
            tokenizer.consume();
            this.actions = actionsExprOp;
          }
          continue;
        case Action.EXPR_PREFIX:
          valStack.push(-token.type);
          tokenizer.consume();
          continue;
        case Action.EXPR_INFIX:
          this.actions = actionsExprVal;
          this.exprStackReduce(token.type, token);
          valStack.push(token.type);
          tokenizer.consume();
          continue;
        case Action.EXPR_INFIX_NAME:
          if (token.text.toLowerCase() == 'and') {
            this.actions = actionsExprVal;
            this.exprStackReduce(OP_MEDIA_AND, token);
            valStack.push(OP_MEDIA_AND);
            tokenizer.consume();
          } else {
            this.exprError('E_CSS_SYNTAX', token);
          }
          continue;
        case Action.EXPR_C_PAR:
          if (this.exprStackReduce(token.type, token)) {
            if (this.propName) {
              this.actions = actionsPropVal;
            } else {
              this.exprError('E_CSS_UNBALANCED_PAR', token);
            }
          }
          tokenizer.consume();
          continue;
        case Action.EXPR_O_BRC:
          if (this.exprStackReduce(csstok.TokenType.C_PAR, token)) {
            if (this.propName || this.exprContext == ExprContext.IMPORT) {
              this.exprError('E_CSS_UNEXPECTED_BRC', token);
            } else {
              if (this.exprContext == ExprContext.WHEN) {
                handler.startWhenRule((valStack.pop() as css.Expr));
              } else {
                handler.startMediaRule((valStack.pop() as css.Expr));
              }
              this.ruleStack.push('media');
              handler.startRuleBody();
              this.actions = actionsBase;
            }
          }
          tokenizer.consume();
          continue;
        case Action.EXPR_SEMICOL:
          if (this.exprStackReduce(csstok.TokenType.C_PAR, token)) {
            if (this.propName || this.exprContext != ExprContext.IMPORT) {
              this.exprError('E_CSS_UNEXPECTED_SEMICOL', token);
            } else {
              this.importCondition = (valStack.pop() as css.Expr);
              this.importReady = true;
              this.actions = actionsBase;
              tokenizer.consume();
              return false;
            }
          }
          tokenizer.consume();
          continue;
        case Action.EXPR_O_PAR:
          valStack.push(token.type);
          tokenizer.consume();
          continue;
        case Action.RULE_END:
          this.actions = actionsBase;
          tokenizer.consume();
          handler.endRule();
          if (this.ruleStack.length) {
            this.ruleStack.pop();
          }
          continue;
        case Action.AT:
          text = token.text.toLowerCase();
          switch (text) {
            case 'import':
              tokenizer.consume();
              token = tokenizer.token();
              if (token.type == csstok.TokenType.STR ||
                  token.type == csstok.TokenType.URL) {
                this.importURL = token.text;
                tokenizer.consume();
                token = tokenizer.token();
                if (token.type == csstok.TokenType.SEMICOL ||
                    token.type == csstok.TokenType.EOF) {
                  this.importReady = true;
                  tokenizer.consume();
                  return false;
                } else {
                  this.propName = null;

                  // signals @ rule
                  this.exprContext = ExprContext.IMPORT;
                  this.actions = actionsExprVal;
                  valStack.push('{');
                  continue;
                }
              }
              handler.error('E_CSS_IMPORT_SYNTAX', token);
              this.actions = actionsError;
              continue;
            case 'namespace':
              tokenizer.consume();
              token = tokenizer.token();
              switch (token.type) {
                case csstok.TokenType.IDENT:
                  text = token.text;

                  // Prefix
                  tokenizer.consume();
                  token = tokenizer.token();
                  if ((token.type == csstok.TokenType.STR ||
                       token.type == csstok.TokenType.URL) &&
                      tokenizer.nthToken(1).type == csstok.TokenType.SEMICOL) {
                    this.namespacePrefixToURI[text] = token.text;
                    tokenizer.consume();
                    tokenizer.consume();
                    continue;
                  }
                  break;
                case csstok.TokenType.STR:
                case csstok.TokenType.URL:
                  if (tokenizer.nthToken(1).type == csstok.TokenType.SEMICOL) {
                    this.defaultNamespaceURI = token.text;
                    tokenizer.consume();
                    tokenizer.consume();
                    continue;
                  }
                  break;
              }
              handler.error('E_CSS_NAMESPACE_SYNTAX', token);
              this.actions = actionsError;
              continue;
            case 'charset':

              // Useless in EPUB (only UTF-8 or UTF-16 is allowed anyway and
              // we are at the mercy of the browser charset handling anyway).
              tokenizer.consume();
              token = tokenizer.token();
              if (token.type == csstok.TokenType.STR &&
                  tokenizer.nthToken(1).type == csstok.TokenType.SEMICOL) {
                text = token.text.toLowerCase();
                if (text != 'utf-8' && text != 'utf-16') {
                  handler.error(`E_CSS_UNEXPECTED_CHARSET ${text}`, token);
                }
                tokenizer.consume();
                tokenizer.consume();
                continue;
              }
              handler.error('E_CSS_CHARSET_SYNTAX', token);
              this.actions = actionsError;
              continue;
            case 'font-face':
            case '-epubx-page-template':
            case '-epubx-define':
            case '-epubx-viewport':
              if (tokenizer.nthToken(1).type == csstok.TokenType.O_BRC) {
                tokenizer.consume();
                tokenizer.consume();
                switch (text) {
                  case 'font-face':
                    handler.startFontFaceRule();
                    break;
                  case '-epubx-page-template':
                    handler.startPageTemplateRule();
                    break;
                  case '-epubx-define':
                    handler.startDefineRule();
                    break;
                  case '-epubx-viewport':
                    handler.startViewportRule();
                    break;
                }
                this.ruleStack.push(text);
                handler.startRuleBody();
                continue;
              }
              break;
            case '-adapt-footnote-area':
              tokenizer.consume();
              token = tokenizer.token();
              switch (token.type) {
                case csstok.TokenType.O_BRC:
                  tokenizer.consume();
                  handler.startFootnoteRule(null);
                  this.ruleStack.push(text);
                  handler.startRuleBody();
                  continue;
                case csstok.TokenType.COL_COL:
                  tokenizer.consume();
                  token = tokenizer.token();
                  if (token.type == csstok.TokenType.IDENT &&
                      tokenizer.nthToken(1).type == csstok.TokenType.O_BRC) {
                    text = token.text;
                    tokenizer.consume();
                    tokenizer.consume();
                    handler.startFootnoteRule(text);
                    this.ruleStack.push('-adapt-footnote-area');
                    handler.startRuleBody();
                    continue;
                  }
                  break;
              }
              break;
            case '-epubx-region':
              tokenizer.consume();
              handler.startRegionRule();
              this.regionRule = true;
              this.actions = actionsSelectorStart;
              continue;
            case 'page':
              tokenizer.consume();
              handler.startPageRule();
              this.pageRule = true;
              this.actions = actionsSelectorCont;
              continue;
            case 'top-left-corner':
            case 'top-left':
            case 'top-center':
            case 'top-right':
            case 'top-right-corner':
            case 'right-top':
            case 'right-middle':
            case 'right-bottom':
            case 'bottom-right-corner':
            case 'bottom-right':
            case 'bottom-center':
            case 'bottom-left':
            case 'bottom-left-corner':
            case 'left-bottom':
            case 'left-middle':
            case 'left-top':
              tokenizer.consume();
              token = tokenizer.token();
              if (token.type == csstok.TokenType.O_BRC) {
                tokenizer.consume();
                handler.startPageMarginBoxRule(text);
                this.ruleStack.push(text);
                handler.startRuleBody();
                continue;
              }
              break;
            case '-epubx-when':
              tokenizer.consume();
              this.propName = null;

              // signals @ rule
              this.exprContext = ExprContext.WHEN;
              this.actions = actionsExprVal;
              valStack.push('{');
              continue;
            case 'media':
              tokenizer.consume();
              this.propName = null;

              // signals @ rule
              this.exprContext = ExprContext.MEDIA;
              this.actions = actionsExprVal;
              valStack.push('{');
              continue;
            case '-epubx-flow':
              if (tokenizer.nthToken(1).type == csstok.TokenType.IDENT &&
                  tokenizer.nthToken(2).type == csstok.TokenType.O_BRC) {
                handler.startFlowRule(tokenizer.nthToken(1).text);
                tokenizer.consume();
                tokenizer.consume();
                tokenizer.consume();
                this.ruleStack.push(text);
                handler.startRuleBody();
                continue;
              }
              break;
            case '-epubx-page-master':
            case '-epubx-partition':
            case '-epubx-partition-group':
              tokenizer.consume();
              token = tokenizer.token();
              let ruleName: string|null = null;
              let rulePseudoName: string|null = null;
              const classes: string[] = [];
              if (token.type == csstok.TokenType.IDENT) {
                ruleName = token.text;
                tokenizer.consume();
                token = tokenizer.token();
              }
              if (token.type == csstok.TokenType.COLON &&
                  tokenizer.nthToken(1).type == csstok.TokenType.IDENT) {
                rulePseudoName = tokenizer.nthToken(1).text;
                tokenizer.consume();
                tokenizer.consume();
                token = tokenizer.token();
              }
              while (token.type == csstok.TokenType.FUNC &&
                     token.text.toLowerCase() == 'class' &&
                     tokenizer.nthToken(1).type == csstok.TokenType.IDENT &&
                     tokenizer.nthToken(2).type == csstok.TokenType.C_PAR) {
                classes.push(tokenizer.nthToken(1).text);
                tokenizer.consume();
                tokenizer.consume();
                tokenizer.consume();
                token = tokenizer.token();
              }
              if (token.type == csstok.TokenType.O_BRC) {
                tokenizer.consume();
                switch (text) {
                  case '-epubx-page-master':
                    handler.startPageMasterRule(
                        ruleName, rulePseudoName, classes);
                    break;
                  case '-epubx-partition':
                    handler.startPartitionRule(
                        ruleName, rulePseudoName, classes);
                    break;
                  case '-epubx-partition-group':
                    handler.startPartitionGroupRule(
                        ruleName, rulePseudoName, classes);
                    break;
                }
                this.ruleStack.push(text);
                handler.startRuleBody();
                continue;
              }
              break;
            case '':

              // No text after @
              handler.error(`E_CSS_UNEXPECTED_AT${text}`, token);

              // Error recovery using selector rules.
              this.actions = actionsErrorSelector;
              continue;
            default:
              handler.error(`E_CSS_AT_UNKNOWN ${text}`, token);
              this.actions = actionsError;
              continue;
          }
          handler.error(`E_CSS_AT_SYNTAX ${text}`, token);
          this.actions = actionsError;
          continue;
        case Action.ERROR_PUSH:

          // Open bracket while skipping error syntax
          if (parsingValue || parsingStyleAttr) {
            return true;
          }
          this.errorBrackets.push(token.type + 1);

          // Expected closing bracket
          tokenizer.consume();
          continue;
        case Action.ERROR_POP_DECL:

          // Close bracket while skipping error syntax in declaration
          if (parsingValue || parsingStyleAttr) {
            return true;
          }
          if (this.errorBrackets.length == 0) {
            this.actions = actionsBase;

            // Don't consume closing brace
            continue;
          }

        // fall through
        case Action.ERROR_POP:

          // Close bracket while skipping error syntax
          if (this.errorBrackets.length > 0 &&
              this.errorBrackets[this.errorBrackets.length - 1] == token.type) {
            this.errorBrackets.pop();
          }
          if (this.errorBrackets.length == 0 &&
              token.type == csstok.TokenType.C_BRC) {
            this.actions = actionsBase;
          }
          tokenizer.consume();
          continue;
        case Action.ERROR_SEMICOL:
          if (parsingValue || parsingStyleAttr) {
            return true;
          }
          if (this.errorBrackets.length == 0) {
            this.actions = actionsBase;
          }
          tokenizer.consume();
          continue;
        case Action.DONE:
          if (parsingFunctionParam) {
            tokenizer.consume();
            handler.endFuncWithSelector();
          }
          return true;
        default:
          if (parsingValue || parsingStyleAttr) {
            return true;
          }
          if (parsingMediaQuery) {
            if (this.exprStackReduce(csstok.TokenType.C_PAR, token)) {
              this.result = (valStack.pop() as css.Val);
              return true;
            }
            return false;
          }
          if (parsingFunctionParam) {
            if (token.type == csstok.TokenType.INVALID) {
              handler.error(token.text, token);
            } else {
              handler.error('E_CSS_SYNTAX', token);
            }
            return false;
          }
          if (this.actions === actionsPropVal && tokenizer.hasMark()) {
            tokenizer.reset();
            this.actions = actionsSelectorStart;
            handler.startSelectorRule();
            continue;
          }
          if (this.actions !== actionsError &&
              this.actions !== actionsErrorSelector &&
              this.actions !== actionsErrorDecl) {
            if (token.type == csstok.TokenType.INVALID) {
              handler.error(token.text, token);
            } else {
              handler.error('E_CSS_SYNTAX', token);
            }
            if (this.isInsidePropertyOnlyRule()) {
              this.actions = actionsErrorDecl;
            } else {
              this.actions = actionsErrorSelector;
            }
            continue;
          }

          // Let error-recovery to re-process the offending token
          tokenizer.consume();
          continue;
      }
      break;
    }
    return false;
  }
}

// Not done yet.
export class ErrorHandler extends ParserHandler {
  constructor(public readonly scope: expr.LexicalScope) {
    super(null);
  }

  /**
   * @override
   */
  error(mnemonics, token) {
    throw new Error(mnemonics);
  }

  /**
   * @override
   */
  getScope() {
    return this.scope;
  }
}

export const parseStylesheet = (tokenizer: csstok.Tokenizer,
                                handler: ParserHandler, baseURL: string,
                                classes: string|null,
                                media: string|null): task.Result<boolean> => {
  const frame: task.Frame<boolean> = task.newFrame('parseStylesheet');
  const parser = new Parser(actionsBase, tokenizer, handler, baseURL);
  let condition = null;
  if (media) {
    condition =
        parseMediaQuery(new csstok.Tokenizer(media, handler), handler, baseURL);
  }
  condition = parser.makeCondition(classes, condition && condition.toExpr());
  if (condition) {
    handler.startMediaRule(condition);
    handler.startRuleBody();
  }
  frame
      .loop(() => {
        while (!parser.runParser(100, false, false, false, false)) {
          if (parser.importReady) {
            const resolvedURL =
                base.resolveURL((parser.importURL as string), baseURL);
            if (parser.importCondition) {
              handler.startMediaRule(parser.importCondition);
              handler.startRuleBody();
            }
            const innerFrame: task.Frame<boolean> =
                task.newFrame('parseStylesheet.import');
            parseStylesheetFromURL(resolvedURL, handler, null, null)
                .then(() => {
                  if (parser.importCondition) {
                    handler.endRule();
                  }
                  parser.importReady = false;
                  parser.importURL = null;
                  parser.importCondition = null;
                  innerFrame.finish(true);
                });
            return innerFrame.result();
          }
          const r = frame.timeSlice();
          if (r.isPending) {
            return r;
          }
        }
        return task.newResult(false);
      })
      .then(() => {
        if (condition) {
          handler.endRule();
        }
        frame.finish(true);
      });
  return frame.result();
};

export const parseStylesheetFromText = (text: string, handler: ParserHandler,
                                        baseURL: string, classes: string|null,
                                        media: string|
                                        null): task.Result<boolean> => {
  return task.handle(
      'parseStylesheetFromText',
      (frame) => {
        const tok = new csstok.Tokenizer(text, handler);
        parseStylesheet(tok, handler, baseURL, classes, media)
            .thenFinish(frame);
      },
      (frame, err) => {
        logging.logger.warn(err, `Failed to parse stylesheet text: ${text}`);
        frame.finish(false);
      });
};

export const parseStylesheetFromURL = (url: string, handler: ParserHandler,
                                       classes: string|null,
                                       media: string|null):
                                          task.Result<boolean> => task.handle(
    'parseStylesheetFromURL',
    (frame) => {
      net.ajax(url).then((xhrParam) => {
        const xhr = (xhrParam as XMLHttpRequest);
        if (!xhr.responseText) {
          frame.finish(true);
        } else {
          parseStylesheetFromText(
              xhr.responseText, handler, url, classes, media)
              .then((result) => {
                if (!result) {
                  logging.logger.warn(`Failed to parse stylesheet from ${url}`);
                }
                frame.finish(true);
              });
        }
      });
    },
    (frame, err) => {
      logging.logger.warn(err, 'Exception while fetching and parsing:', url);
      frame.finish(true);
    });

export const parseValue = (scope: expr.LexicalScope,
                           tokenizer: csstok.Tokenizer,
                           baseURL: string): css.Val => {
  const parser =
      new Parser(actionsPropVal, tokenizer, new ErrorHandler(scope), baseURL);
  parser.runParser(Number.POSITIVE_INFINITY, true, false, false, false);
  return parser.result;
};

export const parseStyleAttribute =
    (tokenizer: csstok.Tokenizer, handler: ParserHandler, baseURL: string):
        void => {
          const parser =
              new Parser(actionsStyleAttribute, tokenizer, handler, baseURL);
          parser.runParser(Number.POSITIVE_INFINITY, false, true, false, false);
        };

export const parseMediaQuery =
    (tokenizer: csstok.Tokenizer, handler: ParserHandler,
     baseURL: string): css.Expr => {
      const parser = new Parser(actionsExprVal, tokenizer, handler, baseURL);
      parser.runParser(Number.POSITIVE_INFINITY, false, false, true, false);
      return (parser.result as css.Expr);
    };

export const numProp: {[key: string]: boolean} = {
  'z-index': true,
  'column-count': true,
  'flow-linger': true,
  'opacity': true,
  'page': true,
  'flow-priority': true,
  'utilization': true
};

export const takesOnlyNum = (propName: string): boolean => !!numProp[propName];

/**
 * @return val
 */
export const evaluateExprToCSS =
    (context: expr.Context, val: expr.Val, propName: string): css.Val => {
      const result = val.evaluate(context);
      switch (typeof result) {
        case 'number':
          if (!takesOnlyNum(propName)) {
            return new css.Numeric(result, 'px');
          } else {
            if (result == Math.round(result)) {
              return new css.Int(result);
            } else {
              return new css.Num(result);
            }
          }
        case 'string':
          if (!result) {
            return css.empty;
          }

          // TODO: where baseURL should come from???
          return parseValue(val.scope, new csstok.Tokenizer(result, null), '');
        case 'boolean':
          return result ? css.ident._true : css.ident._false;
        case 'undefined':
          return css.empty;
      }
      throw new Error('E_UNEXPECTED');
    };

/**
 * @return val
 */
export const evaluateCSSToCSS =
    (context: expr.Context, val: css.Val, propName: string): css.Val => {
      if (val.isExpr()) {
        return evaluateExprToCSS(context, (val as css.Expr).expr, propName);
      }
      return val;
    };
