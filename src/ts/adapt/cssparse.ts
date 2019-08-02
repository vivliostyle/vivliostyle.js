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
 * @fileoverview CssParse - CSS Parser.
 */
import * as Base from "./base";
import * as Css from "./css";
import * as CssTok from "./csstok";
import * as Exprs from "./exprs";
import * as Net from "./net";
import * as Task from "./task";
import * as Logging from "../vivliostyle/logging";

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

/**
 * @enum {string}
 */
export enum StylesheetFlavor {
  USER_AGENT = "UA",
  USER = "User",
  AUTHOR = "Author"
}

/**
 * CSS Color value from hash text (without '#' character).
 */
export function colorFromHash(text: string): Css.Color {
  let num = parseInt(text, 16);
  if (isNaN(num)) {
    throw new Error("E_CSS_COLOR");
  }
  if (text.length == 6) {
    return new Css.Color(num);
  }
  if (text.length == 3) {
    num =
      (num & 15) |
      ((num & 15) << 4) |
      ((num & 240) << 4) |
      ((num & 240) << 8) |
      ((num & 3840) << 8) |
      ((num & 3840) << 12);
    return new Css.Color(num);
  }
  throw new Error("E_CSS_COLOR");
}

export class ParserHandler implements CssTok.TokenizerHandler {
  flavor: StylesheetFlavor;

  constructor(public scope: Exprs.LexicalScope) {
    this.flavor = StylesheetFlavor.AUTHOR;
  }

  getCurrentToken(): CssTok.Token {
    return null;
  }

  getScope(): Exprs.LexicalScope {
    return this.scope;
  }

  error(mnemonics: string, token: CssTok.Token): void {}

  startStylesheet(flavor: StylesheetFlavor): void {
    this.flavor = flavor;
  }

  tagSelector(ns: string | null, name: string | null): void {}

  classSelector(name: string): void {}

  pseudoclassSelector(name: string, params: (number | string)[]): void {}

  pseudoelementSelector(name: string, params: (number | string)[]): void {}

  idSelector(id: string): void {}

  attributeSelector(
    ns: string,
    name: string,
    op: CssTok.TokenType,
    value: string | null
  ): void {}

  descendantSelector(): void {}

  childSelector(): void {}

  adjacentSiblingSelector(): void {}

  followingSiblingSelector(): void {}

  nextSelector(): void {}

  startSelectorRule(): void {}

  startFontFaceRule(): void {}

  startFootnoteRule(pseudoelem: string | null): void {}

  startViewportRule(): void {}

  startDefineRule(): void {}

  startRegionRule(): void {}

  startPageRule(): void {}

  startPageMarginBoxRule(name: string): void {}

  startWhenRule(expr: Css.Expr): void {}

  startMediaRule(expr: Css.Expr): void {
    this.startWhenRule(expr);
  }

  startFlowRule(flowName: string): void {}

  startPageTemplateRule(): void {}

  startPageMasterRule(
    name: string | null,
    pseudoName: string | null,
    classes: string[]
  ): void {}

  startPartitionRule(
    name: string | null,
    pseudoName: string | null,
    classes: string[]
  ): void {}

  startPartitionGroupRule(
    name: string | null,
    pseudoName: string | null,
    classes: string[]
  ): void {}

  startRuleBody(): void {}

  property(name: string, value: Css.Val, important: boolean): void {}

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
  tokenizer: CssTok.Tokenizer = null;
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
  getCurrentToken(): CssTok.Token {
    if (this.tokenizer) {
      return this.tokenizer.token();
    }
    return null;
  }

  /**
   * @override
   */
  getScope(): Exprs.LexicalScope {
    return this.slave.getScope();
  }

  /**
   * Forwards call to slave.
   * @override
   */
  error(mnemonics: string, token: CssTok.Token): void {
    this.slave.error(mnemonics, token);
  }

  /**
   * Called by a slave.
   */
  errorMsg(mnemonics: string, token: CssTok.Token): void {
    Logging.logger.warn(mnemonics);
  }

  /**
   * @override
   */
  startStylesheet(flavor: StylesheetFlavor): void {
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
  tagSelector(ns: string | null, name: string | null): void {
    this.slave.tagSelector(ns, name);
  }

  /**
   * @override
   */
  classSelector(name: string): void {
    this.slave.classSelector(name);
  }

  /**
   * @override
   */
  pseudoclassSelector(name: string, params: (number | string)[]): void {
    this.slave.pseudoclassSelector(name, params);
  }

  /**
   * @override
   */
  pseudoelementSelector(name: string, params: (number | string)[]): void {
    this.slave.pseudoelementSelector(name, params);
  }

  /**
   * @override
   */
  idSelector(id: string): void {
    this.slave.idSelector(id);
  }

  /**
   * @override
   */
  attributeSelector(
    ns: string,
    name: string,
    op: CssTok.TokenType,
    value: string | null
  ): void {
    this.slave.attributeSelector(ns, name, op, value);
  }

  /**
   * @override
   */
  descendantSelector(): void {
    this.slave.descendantSelector();
  }

  /**
   * @override
   */
  childSelector(): void {
    this.slave.childSelector();
  }

  /**
   * @override
   */
  adjacentSiblingSelector(): void {
    this.slave.adjacentSiblingSelector();
  }

  /**
   * @override
   */
  followingSiblingSelector(): void {
    this.slave.followingSiblingSelector();
  }

  /**
   * @override
   */
  nextSelector(): void {
    this.slave.nextSelector();
  }

  /**
   * @override
   */
  startSelectorRule(): void {
    this.slave.startSelectorRule();
  }

  /**
   * @override
   */
  startFontFaceRule(): void {
    this.slave.startFontFaceRule();
  }

  /**
   * @override
   */
  startFootnoteRule(pseudoelem: string | null): void {
    this.slave.startFootnoteRule(pseudoelem);
  }

  /**
   * @override
   */
  startViewportRule(): void {
    this.slave.startViewportRule();
  }

  /**
   * @override
   */
  startDefineRule(): void {
    this.slave.startDefineRule();
  }

  /**
   * @override
   */
  startRegionRule(): void {
    this.slave.startRegionRule();
  }

  /**
   * @override
   */
  startPageRule(): void {
    this.slave.startPageRule();
  }

  /**
   * @override
   */
  startPageMarginBoxRule(name: string): void {
    this.slave.startPageMarginBoxRule(name);
  }

  /**
   * @override
   */
  startWhenRule(expr: Css.Expr): void {
    this.slave.startWhenRule(expr);
  }

  /**
   * @override
   */
  startFlowRule(flowName: string): void {
    this.slave.startFlowRule(flowName);
  }

  /**
   * @override
   */
  startPageTemplateRule(): void {
    this.slave.startPageTemplateRule();
  }

  /**
   * @override
   */
  startPageMasterRule(
    name: string | null,
    pseudoName: string | null,
    classes: string[]
  ): void {
    this.slave.startPageMasterRule(name, pseudoName, classes);
  }

  /**
   * @override
   */
  startPartitionRule(
    name: string | null,
    pseudoName: string | null,
    classes: string[]
  ): void {
    this.slave.startPartitionRule(name, pseudoName, classes);
  }

  /**
   * @override
   */
  startPartitionGroupRule(
    name: string | null,
    pseudoName: string | null,
    classes: string[]
  ): void {
    this.slave.startPartitionGroupRule(name, pseudoName, classes);
  }

  /**
   * @override
   */
  startRuleBody(): void {
    this.slave.startRuleBody();
  }

  /**
   * @override
   */
  property(name: string, value: Css.Val, important: boolean): void {
    this.slave.property(name, value, important);
  }

  /**
   * @override
   */
  endRule(): void {
    this.slave.endRule();
  }

  /**
   * @override
   */
  startFuncWithSelector(funcName: string): void {
    this.slave.startFuncWithSelector(funcName);
  }

  /**
   * @override
   */
  endFuncWithSelector(): void {
    this.slave.endFuncWithSelector();
  }
}

export class SkippingParserHandler extends ParserHandler {
  depth: number = 0;
  flavor: StylesheetFlavor;

  constructor(
    scope: Exprs.LexicalScope,
    public owner: DispatchParserHandler,
    public readonly topLevel
  ) {
    super(scope);
    if (owner) {
      this.flavor = owner.flavor;
    }
  }

  /**
   * @override
   */
  getCurrentToken(): CssTok.Token {
    return this.owner.getCurrentToken();
  }

  /**
   * @override
   */
  error(mnemonics: string, token: CssTok.Token): void {
    this.owner.errorMsg(mnemonics, token);
  }

  /**
   * @override
   */
  startRuleBody(): void {
    this.depth++;
  }

  /**
   * @override
   */
  endRule(): void {
    if (--this.depth == 0 && !this.topLevel) {
      this.owner.popHandler();
    }
  }
}

export class SlaveParserHandler extends SkippingParserHandler {
  constructor(
    scope: Exprs.LexicalScope,
    owner: DispatchParserHandler,
    topLevel: boolean
  ) {
    super(scope, owner, topLevel);
  }

  report(message: string): void {
    this.error(message, this.getCurrentToken());
  }

  reportAndSkip(message: string): void {
    this.report(message);
    this.owner.pushHandler(
      new SkippingParserHandler(this.scope, this.owner, false)
    );
  }

  /**
   * @override
   */
  startSelectorRule(): void {
    this.reportAndSkip("E_CSS_UNEXPECTED_SELECTOR");
  }

  /**
   * @override
   */
  startFontFaceRule(): void {
    this.reportAndSkip("E_CSS_UNEXPECTED_FONT_FACE");
  }

  /**
   * @override
   */
  startFootnoteRule(pseudoelem: string | null): void {
    this.reportAndSkip("E_CSS_UNEXPECTED_FOOTNOTE");
  }

  /**
   * @override
   */
  startViewportRule(): void {
    this.reportAndSkip("E_CSS_UNEXPECTED_VIEWPORT");
  }

  /**
   * @override
   */
  startDefineRule(): void {
    this.reportAndSkip("E_CSS_UNEXPECTED_DEFINE");
  }

  /**
   * @override
   */
  startRegionRule(): void {
    this.reportAndSkip("E_CSS_UNEXPECTED_REGION");
  }

  /**
   * @override
   */
  startPageRule(): void {
    this.reportAndSkip("E_CSS_UNEXPECTED_PAGE");
  }

  /**
   * @override
   */
  startWhenRule(expr: Css.Expr): void {
    this.reportAndSkip("E_CSS_UNEXPECTED_WHEN");
  }

  /**
   * @override
   */
  startFlowRule(flowName: string): void {
    this.reportAndSkip("E_CSS_UNEXPECTED_FLOW");
  }

  /**
   * @override
   */
  startPageTemplateRule(): void {
    this.reportAndSkip("E_CSS_UNEXPECTED_PAGE_TEMPLATE");
  }

  /**
   * @override
   */
  startPageMasterRule(
    name: string | null,
    pseudoName: string | null,
    classes: string[]
  ): void {
    this.reportAndSkip("E_CSS_UNEXPECTED_PAGE_MASTER");
  }

  /**
   * @override
   */
  startPartitionRule(
    name: string | null,
    pseudoName: string | null,
    classes: string[]
  ): void {
    this.reportAndSkip("E_CSS_UNEXPECTED_PARTITION");
  }

  /**
   * @override
   */
  startPartitionGroupRule(
    name: string | null,
    pseudoName: string | null,
    classes: string[]
  ): void {
    this.reportAndSkip("E_CSS_UNEXPECTED_PARTITION_GROUP");
  }

  /**
   * @override
   */
  startFuncWithSelector(funcName: string): void {
    this.reportAndSkip("E_CSS_UNEXPECTED_SELECTOR_FUNC");
  }

  /**
   * @override
   */
  endFuncWithSelector(): void {
    this.reportAndSkip("E_CSS_UNEXPECTED_END_SELECTOR_FUNC");
  }

  /**
   * @override
   */
  property(name: string, value: Css.Val, important: boolean): void {
    this.error("E_CSS_UNEXPECTED_PROPERTY", this.getCurrentToken());
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

export const OP_MEDIA_AND: number = CssTok.TokenType.LAST + 1;

(() => {
  actionsBase[CssTok.TokenType.IDENT] = Action.IDENT;
  actionsBase[CssTok.TokenType.STAR] = Action.SELECTOR_START;
  actionsBase[CssTok.TokenType.HASH] = Action.SELECTOR_START;
  actionsBase[CssTok.TokenType.CLASS] = Action.SELECTOR_START;
  actionsBase[CssTok.TokenType.O_BRK] = Action.SELECTOR_START;
  actionsBase[CssTok.TokenType.COLON] = Action.SELECTOR_START;
  actionsBase[CssTok.TokenType.AT] = Action.AT;
  actionsBase[CssTok.TokenType.C_BRC] = Action.RULE_END;
  actionsBase[CssTok.TokenType.EOF] = Action.DONE;
  actionsStyleAttribute[CssTok.TokenType.IDENT] = Action.PROP;
  actionsStyleAttribute[CssTok.TokenType.EOF] = Action.DONE;
  actionsSelectorStart[CssTok.TokenType.IDENT] = Action.SELECTOR_NAME;
  actionsSelectorStart[CssTok.TokenType.STAR] = Action.SELECTOR_ANY;
  actionsSelectorStart[CssTok.TokenType.HASH] = Action.SELECTOR_ID;
  actionsSelectorStart[CssTok.TokenType.CLASS] = Action.SELECTOR_CLASS;
  actionsSelectorStart[CssTok.TokenType.O_BRK] = Action.SELECTOR_ATTR;
  actionsSelectorStart[CssTok.TokenType.COLON] = Action.SELECTOR_PSEUDOCLASS;

  actionsSelector[CssTok.TokenType.GT] = Action.SELECTOR_CHILD;
  actionsSelector[CssTok.TokenType.PLUS] = Action.SELECTOR_SIBLING;
  actionsSelector[CssTok.TokenType.TILDE] = Action.SELECTOR_FOLLOWING_SIBLING;
  actionsSelector[CssTok.TokenType.IDENT] = Action.SELECTOR_NAME_1;
  actionsSelector[CssTok.TokenType.STAR] = Action.SELECTOR_ANY_1;
  actionsSelector[CssTok.TokenType.HASH] = Action.SELECTOR_ID_1;
  actionsSelector[CssTok.TokenType.CLASS] = Action.SELECTOR_CLASS_1;
  actionsSelector[CssTok.TokenType.O_BRK] = Action.SELECTOR_ATTR_1;
  actionsSelector[CssTok.TokenType.O_BRC] = Action.SELECTOR_BODY;
  actionsSelector[CssTok.TokenType.COLON] = Action.SELECTOR_PSEUDOCLASS_1;
  actionsSelector[CssTok.TokenType.COL_COL] = Action.SELECTOR_PSEUDOELEM;
  actionsSelector[CssTok.TokenType.COMMA] = Action.SELECTOR_NEXT;
  actionsSelectorInFunc[CssTok.TokenType.IDENT] = Action.SELECTOR_NAME_1;
  actionsSelectorInFunc[CssTok.TokenType.STAR] = Action.SELECTOR_ANY_1;
  actionsSelectorInFunc[CssTok.TokenType.HASH] = Action.SELECTOR_ID_1;
  actionsSelectorInFunc[CssTok.TokenType.CLASS] = Action.SELECTOR_CLASS_1;
  actionsSelectorInFunc[CssTok.TokenType.O_BRK] = Action.SELECTOR_ATTR_1;
  actionsSelectorInFunc[CssTok.TokenType.C_PAR] = Action.DONE;
  actionsSelectorInFunc[CssTok.TokenType.COLON] = Action.SELECTOR_PSEUDOCLASS_1;
  actionsSelectorCont[CssTok.TokenType.IDENT] = Action.SELECTOR_NAME;
  actionsSelectorCont[CssTok.TokenType.STAR] = Action.SELECTOR_ANY;
  actionsSelectorCont[CssTok.TokenType.HASH] = Action.SELECTOR_ID;
  actionsSelectorCont[CssTok.TokenType.CLASS] = Action.SELECTOR_CLASS;
  actionsSelectorCont[CssTok.TokenType.COLON] = Action.SELECTOR_PSEUDOCLASS;
  actionsSelectorCont[CssTok.TokenType.COL_COL] = Action.SELECTOR_PSEUDOELEM;
  actionsSelectorCont[CssTok.TokenType.O_BRK] = Action.SELECTOR_ATTR;
  actionsSelectorCont[CssTok.TokenType.O_BRC] = Action.SELECTOR_BODY;
  actionsPropVal[CssTok.TokenType.IDENT] = Action.VAL_IDENT;
  actionsPropVal[CssTok.TokenType.HASH] = Action.VAL_HASH;
  actionsPropVal[CssTok.TokenType.NUM] = Action.VAL_NUM;
  actionsPropVal[CssTok.TokenType.INT] = Action.VAL_INT;
  actionsPropVal[CssTok.TokenType.NUMERIC] = Action.VAL_NUMERIC;
  actionsPropVal[CssTok.TokenType.STR] = Action.VAL_STR;
  actionsPropVal[CssTok.TokenType.URL] = Action.VAL_URL;
  actionsPropVal[CssTok.TokenType.COMMA] = Action.VAL_COMMA;
  actionsPropVal[CssTok.TokenType.SLASH] = Action.VAL_SLASH;
  actionsPropVal[CssTok.TokenType.FUNC] = Action.VAL_FUNC;
  actionsPropVal[CssTok.TokenType.C_PAR] = Action.VAL_C_PAR;
  actionsPropVal[CssTok.TokenType.SEMICOL] = Action.VAL_END;
  actionsPropVal[CssTok.TokenType.C_BRC] = Action.VAL_BRC;
  actionsPropVal[CssTok.TokenType.BANG] = Action.VAL_BANG;
  actionsPropVal[CssTok.TokenType.PLUS] = Action.VAL_PLUS;
  actionsPropVal[CssTok.TokenType.EOF] = Action.VAL_FINISH;
  actionsExprVal[CssTok.TokenType.IDENT] = Action.EXPR_IDENT;
  actionsExprVal[CssTok.TokenType.NUM] = Action.EXPR_NUM;
  actionsExprVal[CssTok.TokenType.INT] = Action.EXPR_NUM;
  actionsExprVal[CssTok.TokenType.NUMERIC] = Action.EXPR_NUMERIC;
  actionsExprVal[CssTok.TokenType.STR] = Action.EXPR_STR;
  actionsExprVal[CssTok.TokenType.O_PAR] = Action.EXPR_O_PAR;
  actionsExprVal[CssTok.TokenType.FUNC] = Action.EXPR_FUNC;
  actionsExprVal[CssTok.TokenType.BANG] = Action.EXPR_PREFIX;
  actionsExprVal[CssTok.TokenType.MINUS] = Action.EXPR_PREFIX;
  actionsExprVal[CssTok.TokenType.DOLLAR] = Action.EXPR_PARAM;
  actionsExprOp[CssTok.TokenType.IDENT] = Action.EXPR_INFIX_NAME;
  actionsExprOp[CssTok.TokenType.COMMA] = Action.EXPR_INFIX;
  actionsExprOp[CssTok.TokenType.GT] = Action.EXPR_INFIX;
  actionsExprOp[CssTok.TokenType.LT] = Action.EXPR_INFIX;
  actionsExprOp[CssTok.TokenType.GT_EQ] = Action.EXPR_INFIX;
  actionsExprOp[CssTok.TokenType.LT_EQ] = Action.EXPR_INFIX;
  actionsExprOp[CssTok.TokenType.EQ] = Action.EXPR_INFIX;
  actionsExprOp[CssTok.TokenType.EQ_EQ] = Action.EXPR_INFIX;
  actionsExprOp[CssTok.TokenType.BANG_EQ] = Action.EXPR_INFIX;
  actionsExprOp[CssTok.TokenType.AMP_AMP] = Action.EXPR_INFIX;
  actionsExprOp[CssTok.TokenType.BAR_BAR] = Action.EXPR_INFIX;
  actionsExprOp[CssTok.TokenType.PLUS] = Action.EXPR_INFIX;
  actionsExprOp[CssTok.TokenType.MINUS] = Action.EXPR_INFIX;
  actionsExprOp[CssTok.TokenType.SLASH] = Action.EXPR_INFIX;
  actionsExprOp[CssTok.TokenType.PERCENT] = Action.EXPR_INFIX;
  actionsExprOp[CssTok.TokenType.STAR] = Action.EXPR_INFIX;
  actionsExprOp[CssTok.TokenType.COLON] = Action.EXPR_INFIX;
  actionsExprOp[CssTok.TokenType.QMARK] = Action.EXPR_INFIX;
  actionsExprOp[CssTok.TokenType.C_PAR] = Action.EXPR_C_PAR;
  actionsExprOp[CssTok.TokenType.O_BRC] = Action.EXPR_O_BRC;
  actionsExprOp[CssTok.TokenType.SEMICOL] = Action.EXPR_SEMICOL;
  actionsError[CssTok.TokenType.EOF] = Action.DONE;
  actionsError[CssTok.TokenType.O_BRC] = Action.ERROR_PUSH;
  actionsError[CssTok.TokenType.C_BRC] = Action.ERROR_POP;
  actionsError[CssTok.TokenType.O_BRK] = Action.ERROR_PUSH;
  actionsError[CssTok.TokenType.C_BRK] = Action.ERROR_POP;
  actionsError[CssTok.TokenType.O_PAR] = Action.ERROR_PUSH;
  actionsError[CssTok.TokenType.C_PAR] = Action.ERROR_POP;
  actionsError[CssTok.TokenType.SEMICOL] = Action.ERROR_SEMICOL;
  actionsErrorDecl[CssTok.TokenType.EOF] = Action.DONE;
  actionsErrorDecl[CssTok.TokenType.O_BRC] = Action.ERROR_PUSH;
  actionsErrorDecl[CssTok.TokenType.C_BRC] = Action.ERROR_POP_DECL;
  actionsErrorDecl[CssTok.TokenType.O_BRK] = Action.ERROR_PUSH;
  actionsErrorDecl[CssTok.TokenType.C_BRK] = Action.ERROR_POP;
  actionsErrorDecl[CssTok.TokenType.O_PAR] = Action.ERROR_PUSH;
  actionsErrorDecl[CssTok.TokenType.C_PAR] = Action.ERROR_POP;
  actionsErrorDecl[CssTok.TokenType.SEMICOL] = Action.ERROR_SEMICOL;
  actionsErrorSelector[CssTok.TokenType.EOF] = Action.DONE;
  actionsErrorSelector[CssTok.TokenType.O_BRC] = Action.ERROR_PUSH;
  actionsErrorSelector[CssTok.TokenType.C_BRC] = Action.ERROR_POP;
  actionsErrorSelector[CssTok.TokenType.O_BRK] = Action.ERROR_PUSH;
  actionsErrorSelector[CssTok.TokenType.C_BRK] = Action.ERROR_POP;
  actionsErrorSelector[CssTok.TokenType.O_PAR] = Action.ERROR_PUSH;
  actionsErrorSelector[CssTok.TokenType.C_PAR] = Action.ERROR_POP;
  priority[CssTok.TokenType.C_PAR] = 0;
  priority[CssTok.TokenType.COMMA] = 0;
  priority[CssTok.TokenType.QMARK] = 1;
  priority[CssTok.TokenType.COLON] = 1;
  priority[CssTok.TokenType.AMP_AMP] = 2;
  priority[CssTok.TokenType.BAR_BAR] = 2;
  priority[CssTok.TokenType.LT] = 3;
  priority[CssTok.TokenType.GT] = 3;
  priority[CssTok.TokenType.LT_EQ] = 3;
  priority[CssTok.TokenType.GT_EQ] = 3;
  priority[CssTok.TokenType.EQ] = 3;
  priority[CssTok.TokenType.EQ_EQ] = 3;
  priority[CssTok.TokenType.BANG_EQ] = 3;
  priority[CssTok.TokenType.PLUS] = 4;
  priority[CssTok.TokenType.MINUS] = 4;
  priority[CssTok.TokenType.STAR] = 5;
  priority[CssTok.TokenType.SLASH] = 5;
  priority[CssTok.TokenType.PERCENT] = 5;
  priority[CssTok.TokenType.EOF] = 6;
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
  namespacePrefixToURI: { [key: string]: string } = {};
  defaultNamespaceURI: string | null = null;
  propName: string | null = null;
  propImportant: boolean = false;
  exprContext: ExprContext;
  result: Css.Val = null;
  importReady: boolean = false;
  importURL: string | null = null;
  importCondition: Css.Expr = null;
  errorBrackets: number[] = [];
  ruleStack: string[] = [];
  regionRule: boolean = false;
  pageRule: boolean = false;

  constructor(
    public actions: Action[],
    public tokenizer: CssTok.Tokenizer,
    public readonly handler: ParserHandler,
    public baseURL: string
  ) {
    this.exprContext = ExprContext.MEDIA;
  }

  extractVals(sep: string, index: number): Css.Val[] {
    const arr: Css.Val[] = [];
    const valStack = this.valStack;
    while (true) {
      arr.push(valStack[index++] as Css.Val);
      if (index == valStack.length) {
        break;
      }
      if (valStack[index++] != sep) {
        throw new Error("Unexpected state");
      }
    }
    return arr;
  }

  valStackReduce(sep: string, token: CssTok.Token): Css.Val {
    const valStack = this.valStack;
    let index = valStack.length;
    let v;
    do {
      v = valStack[--index];
    } while (typeof v != "undefined" && typeof v != "string");
    let count = valStack.length - (index + 1);
    if (count > 1) {
      valStack.splice(
        index + 1,
        count,
        new Css.SpaceList(valStack.slice(index + 1, valStack.length))
      );
    }
    if (sep == ",") {
      return null;
    }
    index++;
    do {
      v = valStack[--index];
    } while (typeof v != "undefined" && (typeof v != "string" || v == ","));
    count = valStack.length - (index + 1);
    if (v == "(") {
      if (sep != ")") {
        this.handler.error("E_CSS_MISMATCHED_C_PAR", token);
        this.actions = actionsErrorDecl;
        return null;
      }
      const func = new Css.Func(
        valStack[index - 1] as string,
        this.extractVals(",", index + 1)
      );
      valStack.splice(index - 1, count + 2, func);
      return null;
    }
    if (sep != ";" || index >= 0) {
      this.handler.error("E_CSS_UNEXPECTED_VAL_END", token);
      this.actions = actionsErrorDecl;
      return null;
    }
    if (count > 1) {
      return new Css.CommaList(this.extractVals(",", index + 1));
    }
    return valStack[0] as Css.Val;
  }

  exprError(mnemonics: string, token: CssTok.Token) {
    this.actions = this.propName ? actionsErrorDecl : actionsError;
    this.handler.error(mnemonics, token);
  }

  exprStackReduce(op: number, token: CssTok.Token): boolean {
    const valStack = this.valStack;
    const handler = this.handler;
    let val = valStack.pop() as Exprs.Val;
    let val2: Exprs.Val;
    while (true) {
      let tok = valStack.pop();
      if (op == CssTok.TokenType.C_PAR) {
        const args: Exprs.Val[] = [val];
        while (tok == CssTok.TokenType.COMMA) {
          args.unshift(valStack.pop());
          tok = valStack.pop();
        }
        if (typeof tok == "string") {
          if (tok == "{") {
            // reached CSS portion of the stack
            while (args.length >= 2) {
              const e1 = args.shift();
              const e2 = args.shift();
              const er = new Exprs.OrMedia(handler.getScope(), e1, e2);
              args.unshift(er);
            }
            valStack.push(new Css.Expr(args[0]));
            return true;
          } else if (tok == "(") {
            // call
            const name2 = valStack.pop() as string;
            const name1 = valStack.pop() as string | null;
            val = new Exprs.Call(
              handler.getScope(),
              Exprs.makeQualifiedName(name1, name2),
              args
            );
            op = CssTok.TokenType.EOF;
            continue;
          }
        }
        if (tok == CssTok.TokenType.O_PAR) {
          if (val.isMediaName()) {
            val = new Exprs.MediaTest(
              handler.getScope(),
              val as Exprs.MediaName,
              null
            );
          }
          op = CssTok.TokenType.EOF;
          continue;
        }
      } else {
        if (typeof tok == "string") {
          // reached CSS portion of the stack or a call
          valStack.push(tok);
          break;
        }
      }
      if ((tok as number) < 0) {
        // prefix
        if (tok == -CssTok.TokenType.BANG) {
          val = new Exprs.Not(handler.getScope(), val);
        } else if (tok == -CssTok.TokenType.MINUS) {
          val = new Exprs.Negate(handler.getScope(), val);
        } else {
          this.exprError("F_UNEXPECTED_STATE", token);
          return false;
        }
      } else {
        // infix
        if (priority[op] > priority[tok as number]) {
          valStack.push(tok);
          break;
        }
        val2 = valStack.pop() as Exprs.Val;
        switch (tok) {
          case CssTok.TokenType.AMP_AMP:
            val = new Exprs.And(handler.getScope(), val2, val);
            break;
          case OP_MEDIA_AND:
            val = new Exprs.AndMedia(handler.getScope(), val2, val);
            break;
          case CssTok.TokenType.BAR_BAR:
            val = new Exprs.Or(handler.getScope(), val2, val);
            break;
          case CssTok.TokenType.LT:
            val = new Exprs.Lt(handler.getScope(), val2, val);
            break;
          case CssTok.TokenType.GT:
            val = new Exprs.Gt(handler.getScope(), val2, val);
            break;
          case CssTok.TokenType.LT_EQ:
            val = new Exprs.Le(handler.getScope(), val2, val);
            break;
          case CssTok.TokenType.GT_EQ:
            val = new Exprs.Ge(handler.getScope(), val2, val);
            break;
          case CssTok.TokenType.EQ:
          case CssTok.TokenType.EQ_EQ:
            val = new Exprs.Eq(handler.getScope(), val2, val);
            break;
          case CssTok.TokenType.BANG_EQ:
            val = new Exprs.Ne(handler.getScope(), val2, val);
            break;
          case CssTok.TokenType.PLUS:
            val = new Exprs.Add(handler.getScope(), val2, val);
            break;
          case CssTok.TokenType.MINUS:
            val = new Exprs.Subtract(handler.getScope(), val2, val);
            break;
          case CssTok.TokenType.STAR:
            val = new Exprs.Multiply(handler.getScope(), val2, val);
            break;
          case CssTok.TokenType.SLASH:
            val = new Exprs.Divide(handler.getScope(), val2, val);
            break;
          case CssTok.TokenType.PERCENT:
            val = new Exprs.Modulo(handler.getScope(), val2, val);
            break;
          case CssTok.TokenType.COLON:
            if (valStack.length > 1) {
              switch (valStack[valStack.length - 1]) {
                case CssTok.TokenType.QMARK:
                  valStack.pop();
                  val = new Exprs.Cond(
                    handler.getScope(),
                    valStack.pop() as Exprs.Val,
                    val2,
                    val
                  );
                  break;
                case CssTok.TokenType.O_PAR:
                  if (val2.isMediaName()) {
                    val = new Exprs.MediaTest(
                      handler.getScope(),
                      val2 as Exprs.MediaName,
                      val
                    );
                  } else {
                    this.exprError("E_CSS_MEDIA_TEST", token);
                    return false;
                  }
                  break;
              }
            } else {
              this.exprError("E_CSS_EXPR_COND", token);
              return false;
            }
            break;
          case CssTok.TokenType.QMARK:
            if (op != CssTok.TokenType.COLON) {
              this.exprError("E_CSS_EXPR_COND", token);
              return false;
            }

          // fall through
          case CssTok.TokenType.O_PAR:
            // don't reduce
            valStack.push(val2);
            valStack.push(tok);
            valStack.push(val);
            return false;
          default:
            this.exprError("F_UNEXPECTED_STATE", token);
            return false;
        }
      }
    }
    valStack.push(val);
    return false;
  }

  readPseudoParams(): (number | string)[] {
    const arr = [];
    while (true) {
      const token = this.tokenizer.token();
      switch (token.type) {
        case CssTok.TokenType.IDENT:
          arr.push(token.text);
          break;
        case CssTok.TokenType.PLUS:
          arr.push("+");
          break;
        case CssTok.TokenType.NUM:
        case CssTok.TokenType.INT:
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
  private readNthPseudoParams(): number[] | null {
    let hasLeadingPlus = false;
    let token = this.tokenizer.token();
    if (token.type === CssTok.TokenType.PLUS) {
      // '+'
      hasLeadingPlus = true;
      this.tokenizer.consume();
      token = this.tokenizer.token();
    } else if (
      token.type === CssTok.TokenType.IDENT &&
      (token.text === "even" || token.text === "odd")
    ) {
      // 'even' or 'odd'
      this.tokenizer.consume();
      return [2, token.text === "odd" ? 1 : 0];
    }
    switch (token.type) {
      case CssTok.TokenType.NUMERIC:
        if (hasLeadingPlus && token.num < 0) {
          // reject '+-an'
          return null;
        }

      // FALLTHROUGH
      case CssTok.TokenType.IDENT:
        if (hasLeadingPlus && token.text.charAt(0) === "-") {
          // reject '+-n'
          return null;
        }
        if (token.text === "n" || token.text === "-n") {
          // 'an', 'an +b', 'an -b', 'n', 'n +b', 'n -b', '-n', '-n +b' '-n -b'
          if (hasLeadingPlus && token.precededBySpace) {
            // reject '+ an'
            return null;
          }
          let a = token.text === "-n" ? -1 : 1;
          if (token.type === CssTok.TokenType.NUMERIC) {
            a = token.num;
          }
          let b = 0;
          this.tokenizer.consume();
          token = this.tokenizer.token();
          const hasMinusSign = token.type === CssTok.TokenType.MINUS;
          const hasSign = token.type === CssTok.TokenType.PLUS || hasMinusSign;
          if (hasSign) {
            // 'an +b', 'an - b'
            this.tokenizer.consume();
            token = this.tokenizer.token();
          }
          if (token.type === CssTok.TokenType.INT) {
            b = token.num;

            if (1 / b === 1 / -0) {
              // negative zero: 'an -0'
              b = 0;
              if (hasSign) {
                return null; // reject 'an + -0', 'an - -0'
              }
            } else if (b < 0) {
              // negative: 'an -b'
              if (hasSign) {
                return null; // reject 'an + -b', 'an - -b'
              }
            } else if (b >= 0) {
              // positive or positive zero: 'an +b'
              if (!hasSign) {
                return null;
              }
            }
            this.tokenizer.consume();
          } else if (hasSign) {
            // reject 'an + (non-integer)'
            return null;
          }
          return [a, hasMinusSign && b > 0 ? -b : b];
        } else if (token.text === "n-" || token.text === "-n-") {
          // 'an- b', '-n- b'
          if (hasLeadingPlus && token.precededBySpace) {
            // reject '+ an- b'
            return null;
          }
          let a = token.text === "-n-" ? -1 : 1;
          if (token.type === CssTok.TokenType.NUMERIC) {
            a = token.num;
          }
          this.tokenizer.consume();
          token = this.tokenizer.token();
          if (token.type === CssTok.TokenType.INT) {
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
              token.type === CssTok.TokenType.NUMERIC ? token.num : 1,
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
        return null;
      case CssTok.TokenType.INT:
        if (hasLeadingPlus && (token.precededBySpace || token.num < 0)) {
          return null;
        }
        this.tokenizer.consume();
        return [0, token.num];
    }
    return null;
  }

  makeCondition(classes: string | null, condition: Exprs.Val): Css.Expr {
    const scope = this.handler.getScope();
    if (!scope) {
      return null;
    }
    condition = condition || scope._true;
    if (classes) {
      const classList = classes.split(/\s+/);
      for (const className of classList) {
        switch (className) {
          case "vertical":
            condition = Exprs.and(
              scope,
              condition,
              new Exprs.Not(scope, new Exprs.Named(scope, "pref-horizontal"))
            );
            break;
          case "horizontal":
            condition = Exprs.and(
              scope,
              condition,
              new Exprs.Named(scope, "pref-horizontal")
            );
            break;
          case "day":
            condition = Exprs.and(
              scope,
              condition,
              new Exprs.Not(scope, new Exprs.Named(scope, "pref-night-mode"))
            );
            break;
          case "night":
            condition = Exprs.and(
              scope,
              condition,
              new Exprs.Named(scope, "pref-night-mode")
            );
            break;
          default:
            condition = scope._false;
        }
      }
    }
    if (condition === scope._true) {
      return null;
    }
    return new Css.Expr(condition);
  }

  isInsidePropertyOnlyRule(): boolean {
    switch (this.ruleStack[this.ruleStack.length - 1]) {
      case "[selector]":
      case "font-face":
      case "-epubx-flow":
      case "-epubx-viewport":
      case "-epubx-define":
      case "-adapt-footnote-area":
        return true;
    }
    return false;
  }

  runParser(
    count: number,
    parsingValue,
    parsingStyleAttr: boolean,
    parsingMediaQuery,
    parsingFunctionParam
  ): boolean {
    const handler = this.handler;
    const tokenizer = this.tokenizer;
    const valStack = this.valStack;
    let token: CssTok.Token;
    let token1: CssTok.Token;
    let ns: string | null;
    let text: string | null;
    let num: number;
    let val: Css.Val;
    let params: (number | string)[];
    if (parsingMediaQuery) {
      this.exprContext = ExprContext.MEDIA;
      this.valStack.push("{");
    }
    parserLoop: for (; count > 0; --count) {
      token = tokenizer.token();
      switch (this.actions[token.type]) {
        case Action.IDENT:
          // figure out if this is a property assignment or selector
          if (tokenizer.nthToken(1).type != CssTok.TokenType.COLON) {
            // cannot be property assignment
            if (this.isInsidePropertyOnlyRule()) {
              handler.error("E_CSS_COLON_EXPECTED", tokenizer.nthToken(1));
              this.actions = actionsErrorDecl;
            } else {
              this.actions = actionsSelectorStart;
              handler.startSelectorRule();
            }
            continue;
          }
          token1 = tokenizer.nthToken(2);
          if (
            token1.precededBySpace ||
            (token1.type != CssTok.TokenType.IDENT &&
              token1.type != CssTok.TokenType.FUNC)
          ) {
            // cannot be a selector
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
          if (tokenizer.nthToken(1).type != CssTok.TokenType.COLON) {
            // cannot be property assignment
            this.actions = actionsErrorDecl;
            handler.error("E_CSS_COLON_EXPECTED", tokenizer.nthToken(1));
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
            handler.error("E_CSS_SPACE_EXPECTED", token);
            continue;
          }
          handler.descendantSelector();

        // fall through
        case Action.SELECTOR_NAME:
          if (tokenizer.nthToken(1).type == CssTok.TokenType.BAR) {
            tokenizer.consume();
            tokenizer.consume();
            ns = this.namespacePrefixToURI[token.text];
            if (ns != null) {
              token = tokenizer.token();
              switch (token.type) {
                case CssTok.TokenType.IDENT:
                  handler.tagSelector(ns, token.text);
                  if (parsingFunctionParam) {
                    this.actions = actionsSelectorInFunc;
                  } else {
                    this.actions = actionsSelector;
                  }
                  tokenizer.consume();
                  break;
                case CssTok.TokenType.STAR:
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
                  handler.error("E_CSS_NAMESPACE", token);
              }
            } else {
              this.actions = actionsError;
              handler.error("E_CSS_UNDECLARED_PREFIX", token);
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
            handler.error("E_CSS_SPACE_EXPECTED", token);
            continue;
          }
          handler.descendantSelector();

        // fall through
        case Action.SELECTOR_ANY:
          if (tokenizer.nthToken(1).type == CssTok.TokenType.BAR) {
            tokenizer.consume();
            tokenizer.consume();
            token = tokenizer.token();
            switch (token.type) {
              case CssTok.TokenType.IDENT:
                handler.tagSelector(null, token.text);
                if (parsingFunctionParam) {
                  this.actions = actionsSelectorInFunc;
                } else {
                  this.actions = actionsSelector;
                }
                tokenizer.consume();
                break;
              case CssTok.TokenType.STAR:
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
                handler.error("E_CSS_NAMESPACE", token);
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
            case CssTok.TokenType.IDENT:
              handler.pseudoclassSelector(token.text, null);
              tokenizer.consume();
              if (parsingFunctionParam) {
                this.actions = actionsSelectorInFunc;
              } else {
                this.actions = actionsSelector;
              }
              continue;
            case CssTok.TokenType.FUNC:
              text = token.text;
              tokenizer.consume();
              switch (text) {
                case "not":
                  this.actions = actionsSelectorStart;
                  handler.startFuncWithSelector("not");
                  if (
                    this.runParser(
                      Number.POSITIVE_INFINITY,
                      false,
                      false,
                      false,
                      true
                    )
                  ) {
                    this.actions = actionsSelector;
                  } else {
                    this.actions = actionsErrorSelector;
                  }
                  break parserLoop;
                case "lang":
                case "href-epub-type":
                  token = tokenizer.token();
                  if (token.type === CssTok.TokenType.IDENT) {
                    params = [token.text];
                    tokenizer.consume();
                    break;
                  } else {
                    break pseudoclassType;
                  }
                case "nth-child":
                case "nth-of-type":
                case "nth-last-child":
                case "nth-last-of-type":
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
              if (token.type == CssTok.TokenType.C_PAR) {
                handler.pseudoclassSelector(text as string, params);
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
          handler.error("E_CSS_PSEUDOCLASS_SYNTAX", token);
          this.actions = actionsError;
          continue;
        case Action.SELECTOR_PSEUDOELEM:
          tokenizer.consume();
          token = tokenizer.token();
          switch (token.type) {
            case CssTok.TokenType.IDENT:
              handler.pseudoelementSelector(token.text, null);
              if (parsingFunctionParam) {
                this.actions = actionsSelectorInFunc;
              } else {
                this.actions = actionsSelector;
              }
              tokenizer.consume();
              continue;
            case CssTok.TokenType.FUNC:
              text = token.text;
              tokenizer.consume();
              if (text == "nth-fragment") {
                params = this.readNthPseudoParams();
                if (params === null) {
                  break;
                }
              } else {
                params = this.readPseudoParams();
              }
              token = tokenizer.token();
              if (token.type == CssTok.TokenType.C_PAR) {
                handler.pseudoelementSelector(text as string, params);
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
          handler.error("E_CSS_PSEUDOELEM_SYNTAX", token);
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
          if (token.type == CssTok.TokenType.IDENT) {
            text = token.text;
            tokenizer.consume();
          } else if (token.type == CssTok.TokenType.STAR) {
            text = null;
            tokenizer.consume();
          } else if (token.type == CssTok.TokenType.BAR) {
            text = "";
          } else {
            this.actions = actionsErrorSelector;
            handler.error("E_CSS_ATTR", token);
            tokenizer.consume();
            continue;
          }
          token = tokenizer.token();
          if (token.type == CssTok.TokenType.BAR) {
            ns = text ? this.namespacePrefixToURI[text] : text;
            if (ns == null) {
              this.actions = actionsErrorSelector;
              handler.error("E_CSS_UNDECLARED_PREFIX", token);
              tokenizer.consume();
              continue;
            }
            tokenizer.consume();
            token = tokenizer.token();
            if (token.type != CssTok.TokenType.IDENT) {
              this.actions = actionsErrorSelector;
              handler.error("E_CSS_ATTR_NAME_EXPECTED", token);
              continue;
            }
            text = token.text;
            tokenizer.consume();
            token = tokenizer.token();
          } else {
            ns = "";
          }
          switch (token.type) {
            case CssTok.TokenType.EQ:
            case CssTok.TokenType.TILDE_EQ:
            case CssTok.TokenType.BAR_EQ:
            case CssTok.TokenType.HAT_EQ:
            case CssTok.TokenType.DOLLAR_EQ:
            case CssTok.TokenType.STAR_EQ:
            case CssTok.TokenType.COL_COL:
              num = token.type;
              tokenizer.consume();
              token = tokenizer.token();
              break;
            case CssTok.TokenType.C_BRK:
              handler.attributeSelector(
                ns as string,
                text as string,
                CssTok.TokenType.EOF,
                null
              );
              if (parsingFunctionParam) {
                this.actions = actionsSelectorInFunc;
              } else {
                this.actions = actionsSelector;
              }
              tokenizer.consume();
              continue;
            default:
              this.actions = actionsErrorSelector;
              handler.error("E_CSS_ATTR_OP_EXPECTED", token);
              continue;
          }
          switch (token.type) {
            case CssTok.TokenType.IDENT:
            case CssTok.TokenType.STR:
              handler.attributeSelector(
                ns as string,
                text as string,
                num,
                token.text
              );
              tokenizer.consume();
              token = tokenizer.token();
              break;
            default:
              this.actions = actionsErrorSelector;
              handler.error("E_CSS_ATTR_VAL_EXPECTED", token);
              continue;
          }
          if (token.type != CssTok.TokenType.C_BRK) {
            this.actions = actionsErrorSelector;
            handler.error("E_CSS_ATTR", token);
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
            this.ruleStack.push("-epubx-region");
            this.regionRule = false;
          } else if (this.pageRule) {
            this.ruleStack.push("page");
            this.pageRule = false;
          } else {
            this.ruleStack.push("[selector]");
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
          valStack.push(Css.getName(token.text));
          tokenizer.consume();
          continue;
        case Action.VAL_HASH:
          num = parseInt(token.text, 16);
          try {
            valStack.push(colorFromHash(token.text));
          } catch (err) {
            handler.error("E_CSS_COLOR", token);
            this.actions = actionsError;
          }
          tokenizer.consume();
          continue;
        case Action.VAL_NUM:
          valStack.push(new Css.Num(token.num));
          tokenizer.consume();
          continue;
        case Action.VAL_INT:
          valStack.push(new Css.Int(token.num));
          tokenizer.consume();
          continue;
        case Action.VAL_NUMERIC:
          if (Exprs.isViewportRelativeLengthUnit(token.text)) {
            // Treat numeric value with viewport unit as numeric in expr.
            valStack.push(
              new Css.Expr(
                new Exprs.Numeric(handler.getScope(), token.num, token.text)
              )
            );
          } else {
            valStack.push(new Css.Numeric(token.num, token.text));
          }
          tokenizer.consume();
          continue;
        case Action.VAL_STR:
          valStack.push(new Css.Str(token.text));
          tokenizer.consume();
          continue;
        case Action.VAL_URL:
          valStack.push(new Css.URL(Base.resolveURL(token.text, this.baseURL)));
          tokenizer.consume();
          continue;
        case Action.VAL_COMMA:
          this.valStackReduce(",", token);
          valStack.push(",");
          tokenizer.consume();
          continue;
        case Action.VAL_SLASH:
          valStack.push(Css.slash);
          tokenizer.consume();
          continue;
        case Action.VAL_FUNC:
          text = token.text.toLowerCase();
          if (text == "-epubx-expr" || text == "calc" || text == "env") {
            // special case
            this.actions = actionsExprVal;
            this.exprContext = ExprContext.PROP;
            valStack.push("{");
          } else {
            valStack.push(text);
            valStack.push("(");
          }
          tokenizer.consume();
          continue;
        case Action.VAL_C_PAR:
          this.valStackReduce(")", token);
          tokenizer.consume();
          continue;
        case Action.VAL_BANG:
          tokenizer.consume();
          token = tokenizer.token();
          token1 = tokenizer.nthToken(1);
          if (
            token.type == CssTok.TokenType.IDENT &&
            token.text.toLowerCase() == "important" &&
            (token1.type == CssTok.TokenType.SEMICOL ||
              token1.type == CssTok.TokenType.EOF ||
              token1.type == CssTok.TokenType.C_BRC)
          ) {
            tokenizer.consume();
            this.propImportant = true;
            continue;
          }
          this.exprError("E_CSS_SYNTAX", token);
          continue;
        case Action.VAL_PLUS:
          token1 = tokenizer.nthToken(1);
          switch (token1.type) {
            case CssTok.TokenType.NUM:
            case CssTok.TokenType.NUMERIC:
            case CssTok.TokenType.INT:
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
            this.exprError("E_CSS_UNEXPECTED_PLUS", token);
            continue;
          }
        case Action.VAL_END:
          tokenizer.consume();

        // fall through
        case Action.VAL_BRC:
          tokenizer.unmark();
          val = this.valStackReduce(";", token);
          if (val && this.propName) {
            handler.property(this.propName as string, val, this.propImportant);
          }
          this.actions = parsingStyleAttr ? actionsStyleAttribute : actionsBase;
          continue;
        case Action.VAL_FINISH:
          tokenizer.consume();
          tokenizer.unmark();
          val = this.valStackReduce(";", token);
          if (parsingValue) {
            this.result = val;
            return true;
          }
          if (this.propName && val) {
            handler.property(this.propName as string, val, this.propImportant);
          }
          if (parsingStyleAttr) {
            return true;
          }
          this.exprError("E_CSS_SYNTAX", token);
          continue;
        case Action.EXPR_IDENT:
          token1 = tokenizer.nthToken(1);
          if (token1.type == CssTok.TokenType.CLASS) {
            if (
              tokenizer.nthToken(2).type == CssTok.TokenType.O_PAR &&
              !tokenizer.nthToken(2).precededBySpace
            ) {
              valStack.push(token.text, token1.text, "(");
              tokenizer.consume();
            } else {
              valStack.push(
                new Exprs.Named(
                  handler.getScope(),
                  Exprs.makeQualifiedName(token.text, token1.text)
                )
              );
              this.actions = actionsExprOp;
            }
            tokenizer.consume();
          } else {
            if (
              this.exprContext == ExprContext.MEDIA ||
              this.exprContext == ExprContext.IMPORT
            ) {
              if (token.text.toLowerCase() == "not") {
                tokenizer.consume();
                valStack.push(
                  new Exprs.MediaName(handler.getScope(), true, token1.text)
                );
              } else {
                if (token.text.toLowerCase() == "only") {
                  tokenizer.consume();
                  token = token1;
                }
                valStack.push(
                  new Exprs.MediaName(handler.getScope(), false, token.text)
                );
              }
            } else {
              valStack.push(new Exprs.Named(handler.getScope(), token.text));
            }
            this.actions = actionsExprOp;
          }
          tokenizer.consume();
          continue;
        case Action.EXPR_FUNC:
          valStack.push(null, token.text, "(");
          tokenizer.consume();
          continue;
        case Action.EXPR_NUM:
          valStack.push(new Exprs.Const(handler.getScope(), token.num));
          tokenizer.consume();
          this.actions = actionsExprOp;
          continue;
        case Action.EXPR_NUMERIC:
          text = token.text;
          if (text == "%") {
            if (this.propName && this.propName.match(/height|^(top|bottom)$/)) {
              text = "vh";
            } else {
              text = "vw";
            }
          }
          valStack.push(new Exprs.Numeric(handler.getScope(), token.num, text));
          tokenizer.consume();
          this.actions = actionsExprOp;
          continue;
        case Action.EXPR_STR:
          valStack.push(new Exprs.Const(handler.getScope(), token.text));
          tokenizer.consume();
          this.actions = actionsExprOp;
          continue;
        case Action.EXPR_PARAM:
          tokenizer.consume();
          token = tokenizer.token();
          if (token.type != CssTok.TokenType.INT || token.precededBySpace) {
            this.exprError("E_CSS_SYNTAX", token);
          } else {
            valStack.push(new Exprs.Param(handler.getScope(), token.num));
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
          if (token.text.toLowerCase() == "and") {
            this.actions = actionsExprVal;
            this.exprStackReduce(OP_MEDIA_AND, token);
            valStack.push(OP_MEDIA_AND);
            tokenizer.consume();
          } else {
            this.exprError("E_CSS_SYNTAX", token);
          }
          continue;
        case Action.EXPR_C_PAR:
          if (this.exprStackReduce(token.type, token)) {
            if (this.propName) {
              this.actions = actionsPropVal;
            } else {
              this.exprError("E_CSS_UNBALANCED_PAR", token);
            }
          }
          tokenizer.consume();
          continue;
        case Action.EXPR_O_BRC:
          if (this.exprStackReduce(CssTok.TokenType.C_PAR, token)) {
            if (this.propName || this.exprContext == ExprContext.IMPORT) {
              this.exprError("E_CSS_UNEXPECTED_BRC", token);
            } else {
              if (this.exprContext == ExprContext.WHEN) {
                handler.startWhenRule(valStack.pop() as Css.Expr);
              } else {
                handler.startMediaRule(valStack.pop() as Css.Expr);
              }
              this.ruleStack.push("media");
              handler.startRuleBody();
              this.actions = actionsBase;
            }
          }
          tokenizer.consume();
          continue;
        case Action.EXPR_SEMICOL:
          if (this.exprStackReduce(CssTok.TokenType.C_PAR, token)) {
            if (this.propName || this.exprContext != ExprContext.IMPORT) {
              this.exprError("E_CSS_UNEXPECTED_SEMICOL", token);
            } else {
              this.importCondition = valStack.pop() as Css.Expr;
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
            case "import":
              tokenizer.consume();
              token = tokenizer.token();
              if (
                token.type == CssTok.TokenType.STR ||
                token.type == CssTok.TokenType.URL
              ) {
                this.importURL = token.text;
                tokenizer.consume();
                token = tokenizer.token();
                if (
                  token.type == CssTok.TokenType.SEMICOL ||
                  token.type == CssTok.TokenType.EOF
                ) {
                  this.importReady = true;
                  tokenizer.consume();
                  return false;
                } else {
                  this.propName = null; // signals @ rule
                  this.exprContext = ExprContext.IMPORT;
                  this.actions = actionsExprVal;
                  valStack.push("{");
                  continue;
                }
              }
              handler.error("E_CSS_IMPORT_SYNTAX", token);
              this.actions = actionsError;
              continue;
            case "namespace":
              tokenizer.consume();
              token = tokenizer.token();
              switch (token.type) {
                case CssTok.TokenType.IDENT:
                  text = token.text; // Prefix
                  tokenizer.consume();
                  token = tokenizer.token();
                  if (
                    (token.type == CssTok.TokenType.STR ||
                      token.type == CssTok.TokenType.URL) &&
                    tokenizer.nthToken(1).type == CssTok.TokenType.SEMICOL
                  ) {
                    this.namespacePrefixToURI[text] = token.text;
                    tokenizer.consume();
                    tokenizer.consume();
                    continue;
                  }
                  break;
                case CssTok.TokenType.STR:
                case CssTok.TokenType.URL:
                  if (tokenizer.nthToken(1).type == CssTok.TokenType.SEMICOL) {
                    this.defaultNamespaceURI = token.text;
                    tokenizer.consume();
                    tokenizer.consume();
                    continue;
                  }
                  break;
              }
              handler.error("E_CSS_NAMESPACE_SYNTAX", token);
              this.actions = actionsError;
              continue;
            case "charset":
              // Useless in EPUB (only UTF-8 or UTF-16 is allowed anyway and
              // we are at the mercy of the browser charset handling anyway).
              tokenizer.consume();
              token = tokenizer.token();
              if (
                token.type == CssTok.TokenType.STR &&
                tokenizer.nthToken(1).type == CssTok.TokenType.SEMICOL
              ) {
                text = token.text.toLowerCase();
                if (text != "utf-8" && text != "utf-16") {
                  handler.error(`E_CSS_UNEXPECTED_CHARSET ${text}`, token);
                }
                tokenizer.consume();
                tokenizer.consume();
                continue;
              }
              handler.error("E_CSS_CHARSET_SYNTAX", token);
              this.actions = actionsError;
              continue;
            case "font-face":
            case "-epubx-page-template":
            case "-epubx-define":
            case "-epubx-viewport":
              if (tokenizer.nthToken(1).type == CssTok.TokenType.O_BRC) {
                tokenizer.consume();
                tokenizer.consume();
                switch (text) {
                  case "font-face":
                    handler.startFontFaceRule();
                    break;
                  case "-epubx-page-template":
                    handler.startPageTemplateRule();
                    break;
                  case "-epubx-define":
                    handler.startDefineRule();
                    break;
                  case "-epubx-viewport":
                    handler.startViewportRule();
                    break;
                }
                this.ruleStack.push(text);
                handler.startRuleBody();
                continue;
              }
              break;
            case "-adapt-footnote-area":
              tokenizer.consume();
              token = tokenizer.token();
              switch (token.type) {
                case CssTok.TokenType.O_BRC:
                  tokenizer.consume();
                  handler.startFootnoteRule(null);
                  this.ruleStack.push(text);
                  handler.startRuleBody();
                  continue;
                case CssTok.TokenType.COL_COL:
                  tokenizer.consume();
                  token = tokenizer.token();
                  if (
                    token.type == CssTok.TokenType.IDENT &&
                    tokenizer.nthToken(1).type == CssTok.TokenType.O_BRC
                  ) {
                    text = token.text;
                    tokenizer.consume();
                    tokenizer.consume();
                    handler.startFootnoteRule(text);
                    this.ruleStack.push("-adapt-footnote-area");
                    handler.startRuleBody();
                    continue;
                  }
                  break;
              }
              break;
            case "-epubx-region":
              tokenizer.consume();
              handler.startRegionRule();
              this.regionRule = true;
              this.actions = actionsSelectorStart;
              continue;
            case "page":
              tokenizer.consume();
              handler.startPageRule();
              this.pageRule = true;
              this.actions = actionsSelectorCont;
              continue;
            case "top-left-corner":
            case "top-left":
            case "top-center":
            case "top-right":
            case "top-right-corner":
            case "right-top":
            case "right-middle":
            case "right-bottom":
            case "bottom-right-corner":
            case "bottom-right":
            case "bottom-center":
            case "bottom-left":
            case "bottom-left-corner":
            case "left-bottom":
            case "left-middle":
            case "left-top":
              tokenizer.consume();
              token = tokenizer.token();
              if (token.type == CssTok.TokenType.O_BRC) {
                tokenizer.consume();
                handler.startPageMarginBoxRule(text);
                this.ruleStack.push(text);
                handler.startRuleBody();
                continue;
              }
              break;
            case "-epubx-when":
              tokenizer.consume();
              this.propName = null; // signals @ rule
              this.exprContext = ExprContext.WHEN;
              this.actions = actionsExprVal;
              valStack.push("{");
              continue;
            case "media":
              tokenizer.consume();
              this.propName = null; // signals @ rule
              this.exprContext = ExprContext.MEDIA;
              this.actions = actionsExprVal;
              valStack.push("{");
              continue;
            case "-epubx-flow":
              if (
                tokenizer.nthToken(1).type == CssTok.TokenType.IDENT &&
                tokenizer.nthToken(2).type == CssTok.TokenType.O_BRC
              ) {
                handler.startFlowRule(tokenizer.nthToken(1).text);
                tokenizer.consume();
                tokenizer.consume();
                tokenizer.consume();
                this.ruleStack.push(text);
                handler.startRuleBody();
                continue;
              }
              break;
            case "-epubx-page-master":
            case "-epubx-partition":
            case "-epubx-partition-group": {
              tokenizer.consume();
              token = tokenizer.token();
              let ruleName: string | null = null;
              let rulePseudoName: string | null = null;
              const classes: string[] = [];
              if (token.type == CssTok.TokenType.IDENT) {
                ruleName = token.text;
                tokenizer.consume();
                token = tokenizer.token();
              }
              if (
                token.type == CssTok.TokenType.COLON &&
                tokenizer.nthToken(1).type == CssTok.TokenType.IDENT
              ) {
                rulePseudoName = tokenizer.nthToken(1).text;
                tokenizer.consume();
                tokenizer.consume();
                token = tokenizer.token();
              }
              while (
                token.type == CssTok.TokenType.FUNC &&
                token.text.toLowerCase() == "class" &&
                tokenizer.nthToken(1).type == CssTok.TokenType.IDENT &&
                tokenizer.nthToken(2).type == CssTok.TokenType.C_PAR
              ) {
                classes.push(tokenizer.nthToken(1).text);
                tokenizer.consume();
                tokenizer.consume();
                tokenizer.consume();
                token = tokenizer.token();
              }
              if (token.type == CssTok.TokenType.O_BRC) {
                tokenizer.consume();
                switch (text) {
                  case "-epubx-page-master":
                    handler.startPageMasterRule(
                      ruleName,
                      rulePseudoName,
                      classes
                    );
                    break;
                  case "-epubx-partition":
                    handler.startPartitionRule(
                      ruleName,
                      rulePseudoName,
                      classes
                    );
                    break;
                  case "-epubx-partition-group":
                    handler.startPartitionGroupRule(
                      ruleName,
                      rulePseudoName,
                      classes
                    );
                    break;
                }
                this.ruleStack.push(text);
                handler.startRuleBody();
                continue;
              }
              break;
            }
            case "":
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
          if (
            this.errorBrackets.length > 0 &&
            this.errorBrackets[this.errorBrackets.length - 1] == token.type
          ) {
            this.errorBrackets.pop();
          }
          if (
            this.errorBrackets.length == 0 &&
            token.type == CssTok.TokenType.C_BRC
          ) {
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
            if (this.exprStackReduce(CssTok.TokenType.C_PAR, token)) {
              this.result = valStack.pop() as Css.Val;
              return true;
            }
            return false;
          }
          if (parsingFunctionParam) {
            if (token.type == CssTok.TokenType.INVALID) {
              handler.error(token.text, token);
            } else {
              handler.error("E_CSS_SYNTAX", token);
            }
            return false;
          }
          if (this.actions === actionsPropVal && tokenizer.hasMark()) {
            tokenizer.reset();
            this.actions = actionsSelectorStart;
            handler.startSelectorRule();
            continue;
          }
          if (
            this.actions !== actionsError &&
            this.actions !== actionsErrorSelector &&
            this.actions !== actionsErrorDecl
          ) {
            if (token.type == CssTok.TokenType.INVALID) {
              handler.error(token.text, token);
            } else {
              handler.error("E_CSS_SYNTAX", token);
            }
            if (this.isInsidePropertyOnlyRule()) {
              this.actions = actionsErrorDecl;
            } else {
              this.actions = actionsErrorSelector;
            }
            continue; // Let error-recovery to re-process the offending token
          }
          tokenizer.consume();
          continue;
      }
    }
    return false; // Not done yet.
  }
}

export class ErrorHandler extends ParserHandler {
  constructor(public readonly scope: Exprs.LexicalScope) {
    super(null);
  }

  /**
   * @override
   */
  error(mnemonics: string, token: CssTok.Token): void {
    throw new Error(mnemonics);
  }

  /**
   * @override
   */
  getScope(): Exprs.LexicalScope {
    return this.scope;
  }
}

export function parseStylesheet(
  tokenizer: CssTok.Tokenizer,
  handler: ParserHandler,
  baseURL: string,
  classes: string | null,
  media: string | null
): Task.Result<boolean> {
  const frame: Task.Frame<boolean> = Task.newFrame("parseStylesheet");
  const parser = new Parser(actionsBase, tokenizer, handler, baseURL);
  let condition: Css.Expr | null = null;
  if (media) {
    condition = parseMediaQuery(
      new CssTok.Tokenizer(media, handler),
      handler,
      baseURL
    );
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
          const resolvedURL = Base.resolveURL(
            parser.importURL as string,
            baseURL
          );
          if (parser.importCondition) {
            handler.startMediaRule(parser.importCondition);
            handler.startRuleBody();
          }
          const innerFrame: Task.Frame<boolean> = Task.newFrame(
            "parseStylesheet.import"
          );
          parseStylesheetFromURL(resolvedURL, handler, null, null).then(() => {
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
      return Task.newResult(false);
    })
    .then(() => {
      if (condition) {
        handler.endRule();
      }
      frame.finish(true);
    });
  return frame.result();
}

export function parseStylesheetFromText(
  text: string,
  handler: ParserHandler,
  baseURL: string,
  classes: string | null,
  media: string | null
): Task.Result<boolean> {
  return Task.handle(
    "parseStylesheetFromText",
    frame => {
      const tok = new CssTok.Tokenizer(text, handler);
      parseStylesheet(tok, handler, baseURL, classes, media).thenFinish(frame);
    },
    (frame, err) => {
      Logging.logger.warn(err, `Failed to parse stylesheet text: ${text}`);
      frame.finish(false);
    }
  );
}

export const parseStylesheetFromURL = (
  url: string,
  handler: ParserHandler,
  classes: string | null,
  media: string | null
): Task.Result<boolean> =>
  Task.handle(
    "parseStylesheetFromURL",
    frame => {
      Net.ajax(url).then(xhr => {
        if (!xhr.responseText) {
          frame.finish(true);
        } else {
          parseStylesheetFromText(
            xhr.responseText,
            handler,
            url,
            classes,
            media
          ).then(result => {
            if (!result) {
              Logging.logger.warn(`Failed to parse stylesheet from ${url}`);
            }
            frame.finish(true);
          });
        }
      });
    },
    (frame, err) => {
      Logging.logger.warn(err, "Exception while fetching and parsing:", url);
      frame.finish(true);
    }
  );

export function parseValue(
  scope: Exprs.LexicalScope,
  tokenizer: CssTok.Tokenizer,
  baseURL: string
): Css.Val {
  const parser = new Parser(
    actionsPropVal,
    tokenizer,
    new ErrorHandler(scope),
    baseURL
  );
  parser.runParser(Number.POSITIVE_INFINITY, true, false, false, false);
  return parser.result;
}

export function parseStyleAttribute(
  tokenizer: CssTok.Tokenizer,
  handler: ParserHandler,
  baseURL: string
): void {
  const parser = new Parser(actionsStyleAttribute, tokenizer, handler, baseURL);
  parser.runParser(Number.POSITIVE_INFINITY, false, true, false, false);
}

export function parseMediaQuery(
  tokenizer: CssTok.Tokenizer,
  handler: ParserHandler,
  baseURL: string
): Css.Expr {
  const parser = new Parser(actionsExprVal, tokenizer, handler, baseURL);
  parser.runParser(Number.POSITIVE_INFINITY, false, false, true, false);
  return parser.result as Css.Expr;
}

export const numProp: { [key: string]: boolean } = {
  "z-index": true,
  "column-count": true,
  "flow-linger": true,
  opacity: true,
  page: true,
  "flow-priority": true,
  utilization: true
};

export function takesOnlyNum(propName: string): boolean {
  return !!numProp[propName];
}

/**
 * @return val
 */
export function evaluateExprToCSS(
  context: Exprs.Context,
  val: Exprs.Val,
  propName: string
): Css.Val {
  const result = val.evaluate(context);
  switch (typeof result) {
    case "number":
      if (!takesOnlyNum(propName)) {
        return new Css.Numeric(result as number, "px");
      } else if (result == Math.round(result as number)) {
        return new Css.Int(result as number);
      } else {
        return new Css.Num(result as number);
      }
    case "string":
      if (!result) {
        return Css.empty;
      }

      // TODO: where baseURL should come from???
      return parseValue(
        val.scope,
        new CssTok.Tokenizer(result as string, null),
        ""
      );
    case "boolean":
      return result ? Css.ident._true : Css.ident._false;
    case "undefined":
      return Css.empty;
  }
  throw new Error("E_UNEXPECTED");
}

/**
 * @return val
 */
export function evaluateCSSToCSS(
  context: Exprs.Context,
  val: Css.Val,
  propName: string
): Css.Val {
  if (val.isExpr()) {
    return evaluateExprToCSS(context, (val as Css.Expr).expr, propName);
  }
  return val;
}
