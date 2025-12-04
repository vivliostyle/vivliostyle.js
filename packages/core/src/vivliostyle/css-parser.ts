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
 * @fileoverview CssParser - CSS Parser.
 */
import * as Base from "./base";
import * as Css from "./css";
import * as CssTokenizer from "./css-tokenizer";
import * as Exprs from "./exprs";
import * as Logging from "./logging";
import * as Net from "./net";
import * as Task from "./task";
import { TokenType } from "./css-tokenizer";

/**
 * User agent stylesheet base specificity.
 */
export const SPECIFICITY_USER_AGENT: number = 0;

/**
 * User stylesheet base specificity.
 */
export const SPECIFICITY_USER: number = 0x1000000;

/**
 * Author stylesheet ("normal" stylesheet) base specificity.
 */
export const SPECIFICITY_AUTHOR: number = 0x2000000;

/**
 * Style attribute base specificity.
 */
export const SPECIFICITY_STYLE: number = 0x3000000;

/**
 * Style attribute base specificity when !important is used.
 */
export const SPECIFICITY_STYLE_IMPORTANT: number = 0x4000000;

/**
 * Author stylesheet base specificity when !important is used.
 */
export const SPECIFICITY_AUTHOR_IMPORTANT: number = 0x5000000;

/**
 * User stylesheet base specificity when !important is used.
 */
export const SPECIFICITY_USER_IMPORTANT: number = 0x6000000;

/**
 * @enum {string}
 */
export enum StylesheetFlavor {
  USER_AGENT = "UA",
  USER = "User",
  AUTHOR = "Author",
}

export class ParserHandler implements CssTokenizer.TokenizerHandler {
  flavor: StylesheetFlavor;

  constructor(public scope: Exprs.LexicalScope) {
    this.flavor = StylesheetFlavor.AUTHOR;
  }

  getCurrentToken(): CssTokenizer.Token {
    return null;
  }

  getScope(): Exprs.LexicalScope {
    return this.scope;
  }

  error(mnemonics: string, token: CssTokenizer.Token): void {}

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
    op: TokenType,
    value: string | null,
  ): void {}

  descendantSelector(): void {}

  childSelector(): void {}

  adjacentSiblingSelector(): void {}

  followingSiblingSelector(): void {}

  nextSelector(): void {}

  startSelectorRule(): void {}

  startFontFaceRule(): void {}

  startCounterStyleRule(name: string): void {}

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
    classes: string[],
  ): void {}

  startPartitionRule(
    name: string | null,
    pseudoName: string | null,
    classes: string[],
  ): void {}

  startPartitionGroupRule(
    name: string | null,
    pseudoName: string | null,
    classes: string[],
  ): void {}

  startRuleBody(): void {}

  property(name: string, value: Css.Val, important: boolean): void {}

  endRule(): void {}

  /**
   * @param funcName The name of the function taking a selector list as argument
   */
  startFuncWithSelector(funcName: string): void {}

  endFuncWithSelector(): void {}

  /**
   * For relational pseudo-class `:has()` support
   */
  pushSelectorText(selectorText: string) {}

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
  tokenizer: CssTokenizer.Tokenizer = null;
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

  override getCurrentToken(): CssTokenizer.Token {
    if (this.tokenizer) {
      return this.tokenizer.token();
    }
    return null;
  }

  override getScope(): Exprs.LexicalScope {
    return this.slave.getScope();
  }

  /**
   * Forwards call to slave.
   * @override
   */
  error(mnemonics: string, token: CssTokenizer.Token): void {
    this.slave.error(mnemonics, token);
  }

  /**
   * Called by a slave.
   */
  errorMsg(mnemonics: string, token: CssTokenizer.Token): void {
    Logging.logger.warn(mnemonics, token?.toString() ?? "");
  }

  override startStylesheet(flavor: StylesheetFlavor): void {
    super.startStylesheet(flavor);
    if (this.stack.length > 0) {
      // This can occur as a result of an error
      this.slave = this.stack[0];
      this.stack = [];
    }
    this.slave.startStylesheet(flavor);
  }

  override tagSelector(ns: string | null, name: string | null): void {
    this.slave.tagSelector(ns, name);
  }

  override classSelector(name: string): void {
    this.slave.classSelector(name);
  }

  override pseudoclassSelector(
    name: string,
    params: (number | string)[],
  ): void {
    this.slave.pseudoclassSelector(name, params);
  }

  override pseudoelementSelector(
    name: string,
    params: (number | string)[],
  ): void {
    this.slave.pseudoelementSelector(name, params);
  }

  override idSelector(id: string): void {
    this.slave.idSelector(id);
  }

  override attributeSelector(
    ns: string,
    name: string,
    op: TokenType,
    value: string | null,
  ): void {
    this.slave.attributeSelector(ns, name, op, value);
  }

  override descendantSelector(): void {
    this.slave.descendantSelector();
  }

  override childSelector(): void {
    this.slave.childSelector();
  }

  override adjacentSiblingSelector(): void {
    this.slave.adjacentSiblingSelector();
  }

  override followingSiblingSelector(): void {
    this.slave.followingSiblingSelector();
  }

  override nextSelector(): void {
    this.slave.nextSelector();
  }

  override startSelectorRule(): void {
    this.slave.startSelectorRule();
  }

  override startFontFaceRule(): void {
    this.slave.startFontFaceRule();
  }

  override startCounterStyleRule(name: string): void {
    this.slave.startCounterStyleRule(name);
  }

  override startFootnoteRule(pseudoelem: string | null): void {
    this.slave.startFootnoteRule(pseudoelem);
  }

  override startViewportRule(): void {
    this.slave.startViewportRule();
  }

  override startDefineRule(): void {
    this.slave.startDefineRule();
  }

  override startRegionRule(): void {
    this.slave.startRegionRule();
  }

  override startPageRule(): void {
    this.slave.startPageRule();
  }

  override startPageMarginBoxRule(name: string): void {
    this.slave.startPageMarginBoxRule(name);
  }

  override startWhenRule(expr: Css.Expr): void {
    this.slave.startWhenRule(expr);
  }

  override startFlowRule(flowName: string): void {
    this.slave.startFlowRule(flowName);
  }

  override startPageTemplateRule(): void {
    this.slave.startPageTemplateRule();
  }

  override startPageMasterRule(
    name: string | null,
    pseudoName: string | null,
    classes: string[],
  ): void {
    this.slave.startPageMasterRule(name, pseudoName, classes);
  }

  override startPartitionRule(
    name: string | null,
    pseudoName: string | null,
    classes: string[],
  ): void {
    this.slave.startPartitionRule(name, pseudoName, classes);
  }

  override startPartitionGroupRule(
    name: string | null,
    pseudoName: string | null,
    classes: string[],
  ): void {
    this.slave.startPartitionGroupRule(name, pseudoName, classes);
  }

  override startRuleBody(): void {
    this.slave.startRuleBody();
  }

  override property(name: string, value: Css.Val, important: boolean): void {
    this.slave.property(name, value, important);
  }

  override endRule(): void {
    this.slave.endRule();
  }

  override startFuncWithSelector(funcName: string): void {
    this.slave.startFuncWithSelector(funcName);
  }

  override endFuncWithSelector(): void {
    this.slave.endFuncWithSelector();
  }

  override pushSelectorText(selectorText: string): void {
    this.slave.pushSelectorText(selectorText);
  }
}

export class SkippingParserHandler extends ParserHandler {
  depth: number = 0;

  constructor(
    scope: Exprs.LexicalScope,
    public owner: DispatchParserHandler,
    public readonly topLevel,
  ) {
    super(scope);
    if (owner) {
      this.flavor = owner.flavor;
    }
  }

  override getCurrentToken(): CssTokenizer.Token {
    return this.owner?.getCurrentToken();
  }

  override error(mnemonics: string, token: CssTokenizer.Token): void {
    this.owner?.errorMsg(mnemonics, token);
  }

  override startRuleBody(): void {
    this.depth++;
  }

  override endRule(): void {
    if (--this.depth == 0 && !this.topLevel) {
      this.owner.popHandler();
    }
  }
}

export class SlaveParserHandler extends SkippingParserHandler {
  constructor(
    scope: Exprs.LexicalScope,
    owner: DispatchParserHandler,
    topLevel: boolean,
  ) {
    super(scope, owner, topLevel);
  }

  report(message: string): void {
    this.error(message, this.getCurrentToken());
  }

  reportAndSkip(message: string): void {
    this.report(message);
    this.owner.pushHandler(
      new SkippingParserHandler(this.scope, this.owner, false),
    );
  }

  override startSelectorRule(): void {
    this.reportAndSkip("E_CSS_UNEXPECTED_SELECTOR");
  }

  override startFontFaceRule(): void {
    this.reportAndSkip("E_CSS_UNEXPECTED_FONT_FACE");
  }

  override startCounterStyleRule(name: string): void {
    this.reportAndSkip("E_CSS_UNEXPECTED_COUNTER_STYLE");
  }

  override startFootnoteRule(pseudoelem: string | null): void {
    this.reportAndSkip("E_CSS_UNEXPECTED_FOOTNOTE");
  }

  override startViewportRule(): void {
    this.reportAndSkip("E_CSS_UNEXPECTED_VIEWPORT");
  }

  override startDefineRule(): void {
    this.reportAndSkip("E_CSS_UNEXPECTED_DEFINE");
  }

  override startRegionRule(): void {
    this.reportAndSkip("E_CSS_UNEXPECTED_REGION");
  }

  override startPageRule(): void {
    this.reportAndSkip("E_CSS_UNEXPECTED_PAGE");
  }

  override startWhenRule(expr: Css.Expr): void {
    this.reportAndSkip("E_CSS_UNEXPECTED_WHEN");
  }

  override startFlowRule(flowName: string): void {
    this.reportAndSkip("E_CSS_UNEXPECTED_FLOW");
  }

  override startPageTemplateRule(): void {
    this.reportAndSkip("E_CSS_UNEXPECTED_PAGE_TEMPLATE");
  }

  override startPageMasterRule(
    name: string | null,
    pseudoName: string | null,
    classes: string[],
  ): void {
    this.reportAndSkip("E_CSS_UNEXPECTED_PAGE_MASTER");
  }

  override startPartitionRule(
    name: string | null,
    pseudoName: string | null,
    classes: string[],
  ): void {
    this.reportAndSkip("E_CSS_UNEXPECTED_PARTITION");
  }

  override startPartitionGroupRule(
    name: string | null,
    pseudoName: string | null,
    classes: string[],
  ): void {
    this.reportAndSkip("E_CSS_UNEXPECTED_PARTITION_GROUP");
  }

  override startFuncWithSelector(funcName: string): void {
    this.reportAndSkip("E_CSS_UNEXPECTED_SELECTOR_FUNC");
  }

  override endFuncWithSelector(): void {
    this.reportAndSkip("E_CSS_UNEXPECTED_END_SELECTOR_FUNC");
  }

  override property(name: string, value: Css.Val, important: boolean): void {
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
  VAL_URANGE,
  SELECTOR_PSEUDOELEM_1,
  DONE = 200,
}

export const OP_MEDIA_AND: number = TokenType.LAST + 1;
export const OP_MEDIA_OR: number = TokenType.LAST + 2;
export const OP_MEDIA_NOT: number = TokenType.LAST + 3;

(() => {
  actionsBase[TokenType.IDENT] = Action.IDENT;
  actionsBase[TokenType.STAR] = Action.SELECTOR_START;
  actionsBase[TokenType.HASH] = Action.SELECTOR_START;
  actionsBase[TokenType.CLASS] = Action.SELECTOR_START;
  actionsBase[TokenType.O_BRK] = Action.SELECTOR_START;
  actionsBase[TokenType.COLON] = Action.SELECTOR_START;
  actionsBase[TokenType.COL_COL] = Action.SELECTOR_START;
  actionsBase[TokenType.AT] = Action.AT;
  actionsBase[TokenType.C_BRC] = Action.RULE_END;
  actionsBase[TokenType.EOF] = Action.DONE;
  actionsStyleAttribute[TokenType.IDENT] = Action.PROP;
  actionsStyleAttribute[TokenType.EOF] = Action.DONE;
  actionsSelectorStart[TokenType.IDENT] = Action.SELECTOR_NAME;
  actionsSelectorStart[TokenType.STAR] = Action.SELECTOR_ANY;
  actionsSelectorStart[TokenType.HASH] = Action.SELECTOR_ID;
  actionsSelectorStart[TokenType.CLASS] = Action.SELECTOR_CLASS;
  actionsSelectorStart[TokenType.O_BRK] = Action.SELECTOR_ATTR;
  actionsSelectorStart[TokenType.COLON] = Action.SELECTOR_PSEUDOCLASS;
  actionsSelectorStart[TokenType.COL_COL] = Action.SELECTOR_PSEUDOELEM;

  actionsSelector[TokenType.GT] = Action.SELECTOR_CHILD;
  actionsSelector[TokenType.PLUS] = Action.SELECTOR_SIBLING;
  actionsSelector[TokenType.TILDE] = Action.SELECTOR_FOLLOWING_SIBLING;
  actionsSelector[TokenType.IDENT] = Action.SELECTOR_NAME_1;
  actionsSelector[TokenType.STAR] = Action.SELECTOR_ANY_1;
  actionsSelector[TokenType.HASH] = Action.SELECTOR_ID_1;
  actionsSelector[TokenType.CLASS] = Action.SELECTOR_CLASS_1;
  actionsSelector[TokenType.O_BRK] = Action.SELECTOR_ATTR_1;
  actionsSelector[TokenType.O_BRC] = Action.SELECTOR_BODY;
  actionsSelector[TokenType.COLON] = Action.SELECTOR_PSEUDOCLASS_1;
  actionsSelector[TokenType.COL_COL] = Action.SELECTOR_PSEUDOELEM_1;
  actionsSelector[TokenType.COMMA] = Action.SELECTOR_NEXT;
  actionsSelectorInFunc[TokenType.GT] = Action.SELECTOR_CHILD;
  actionsSelectorInFunc[TokenType.PLUS] = Action.SELECTOR_SIBLING;
  actionsSelectorInFunc[TokenType.TILDE] = Action.SELECTOR_FOLLOWING_SIBLING;
  actionsSelectorInFunc[TokenType.IDENT] = Action.SELECTOR_NAME_1;
  actionsSelectorInFunc[TokenType.STAR] = Action.SELECTOR_ANY_1;
  actionsSelectorInFunc[TokenType.HASH] = Action.SELECTOR_ID_1;
  actionsSelectorInFunc[TokenType.CLASS] = Action.SELECTOR_CLASS_1;
  actionsSelectorInFunc[TokenType.O_BRK] = Action.SELECTOR_ATTR_1;
  actionsSelectorInFunc[TokenType.COLON] = Action.SELECTOR_PSEUDOCLASS_1;
  actionsSelectorCont[TokenType.IDENT] = Action.SELECTOR_NAME;
  actionsSelectorCont[TokenType.STAR] = Action.SELECTOR_ANY;
  actionsSelectorCont[TokenType.HASH] = Action.SELECTOR_ID;
  actionsSelectorCont[TokenType.CLASS] = Action.SELECTOR_CLASS;
  actionsSelectorCont[TokenType.COLON] = Action.SELECTOR_PSEUDOCLASS;
  actionsSelectorCont[TokenType.COL_COL] = Action.SELECTOR_PSEUDOELEM;
  actionsSelectorCont[TokenType.O_BRK] = Action.SELECTOR_ATTR;
  actionsSelectorCont[TokenType.O_BRC] = Action.SELECTOR_BODY;
  actionsPropVal[TokenType.IDENT] = Action.VAL_IDENT;
  actionsPropVal[TokenType.HASH] = Action.VAL_HASH;
  actionsPropVal[TokenType.NUM] = Action.VAL_NUM;
  actionsPropVal[TokenType.INT] = Action.VAL_INT;
  actionsPropVal[TokenType.NUMERIC] = Action.VAL_NUMERIC;
  actionsPropVal[TokenType.STR] = Action.VAL_STR;
  actionsPropVal[TokenType.URL] = Action.VAL_URL;
  actionsPropVal[TokenType.URANGE] = Action.VAL_URANGE;
  actionsPropVal[TokenType.COMMA] = Action.VAL_COMMA;
  actionsPropVal[TokenType.SLASH] = Action.VAL_SLASH;
  actionsPropVal[TokenType.FUNC] = Action.VAL_FUNC;
  actionsPropVal[TokenType.C_PAR] = Action.VAL_C_PAR;
  actionsPropVal[TokenType.SEMICOL] = Action.VAL_END;
  actionsPropVal[TokenType.C_BRC] = Action.VAL_BRC;
  actionsPropVal[TokenType.BANG] = Action.VAL_BANG;
  actionsPropVal[TokenType.PLUS] = Action.VAL_PLUS;
  actionsPropVal[TokenType.EOF] = Action.VAL_FINISH;
  actionsExprVal[TokenType.IDENT] = Action.EXPR_IDENT;
  actionsExprVal[TokenType.NUM] = Action.EXPR_NUM;
  actionsExprVal[TokenType.INT] = Action.EXPR_NUM;
  actionsExprVal[TokenType.NUMERIC] = Action.EXPR_NUMERIC;
  actionsExprVal[TokenType.STR] = Action.EXPR_STR;
  actionsExprVal[TokenType.O_PAR] = Action.EXPR_O_PAR;
  actionsExprVal[TokenType.FUNC] = Action.EXPR_FUNC;
  actionsExprVal[TokenType.BANG] = Action.EXPR_PREFIX;
  actionsExprVal[TokenType.MINUS] = Action.EXPR_PREFIX;
  actionsExprVal[TokenType.DOLLAR] = Action.EXPR_PARAM;
  actionsExprOp[TokenType.IDENT] = Action.EXPR_INFIX_NAME;
  actionsExprOp[TokenType.COMMA] = Action.EXPR_INFIX;
  actionsExprOp[TokenType.GT] = Action.EXPR_INFIX;
  actionsExprOp[TokenType.LT] = Action.EXPR_INFIX;
  actionsExprOp[TokenType.GT_EQ] = Action.EXPR_INFIX;
  actionsExprOp[TokenType.LT_EQ] = Action.EXPR_INFIX;
  actionsExprOp[TokenType.EQ] = Action.EXPR_INFIX;
  actionsExprOp[TokenType.EQ_EQ] = Action.EXPR_INFIX;
  actionsExprOp[TokenType.BANG_EQ] = Action.EXPR_INFIX;
  actionsExprOp[TokenType.AMP_AMP] = Action.EXPR_INFIX;
  actionsExprOp[TokenType.BAR_BAR] = Action.EXPR_INFIX;
  actionsExprOp[TokenType.PLUS] = Action.EXPR_INFIX;
  actionsExprOp[TokenType.MINUS] = Action.EXPR_INFIX;
  actionsExprOp[TokenType.SLASH] = Action.EXPR_INFIX;
  actionsExprOp[TokenType.PERCENT] = Action.EXPR_INFIX;
  actionsExprOp[TokenType.STAR] = Action.EXPR_INFIX;
  actionsExprOp[TokenType.COLON] = Action.EXPR_INFIX;
  actionsExprOp[TokenType.QMARK] = Action.EXPR_INFIX;
  actionsExprOp[TokenType.C_PAR] = Action.EXPR_C_PAR;
  actionsExprOp[TokenType.O_BRC] = Action.EXPR_O_BRC;
  actionsExprOp[TokenType.SEMICOL] = Action.EXPR_SEMICOL;
  actionsError[TokenType.EOF] = Action.DONE;
  actionsError[TokenType.O_BRC] = Action.ERROR_PUSH;
  actionsError[TokenType.C_BRC] = Action.ERROR_POP;
  actionsError[TokenType.O_BRK] = Action.ERROR_PUSH;
  actionsError[TokenType.C_BRK] = Action.ERROR_POP;
  actionsError[TokenType.O_PAR] = Action.ERROR_PUSH;
  actionsError[TokenType.C_PAR] = Action.ERROR_POP;
  actionsError[TokenType.SEMICOL] = Action.ERROR_SEMICOL;
  actionsErrorDecl[TokenType.EOF] = Action.DONE;
  actionsErrorDecl[TokenType.O_BRC] = Action.ERROR_PUSH;
  actionsErrorDecl[TokenType.C_BRC] = Action.ERROR_POP_DECL;
  actionsErrorDecl[TokenType.O_BRK] = Action.ERROR_PUSH;
  actionsErrorDecl[TokenType.C_BRK] = Action.ERROR_POP;
  actionsErrorDecl[TokenType.O_PAR] = Action.ERROR_PUSH;
  actionsErrorDecl[TokenType.C_PAR] = Action.ERROR_POP;
  actionsErrorDecl[TokenType.SEMICOL] = Action.ERROR_SEMICOL;
  actionsErrorSelector[TokenType.EOF] = Action.DONE;
  actionsErrorSelector[TokenType.O_BRC] = Action.ERROR_PUSH;
  actionsErrorSelector[TokenType.C_BRC] = Action.ERROR_POP;
  actionsErrorSelector[TokenType.O_BRK] = Action.ERROR_PUSH;
  actionsErrorSelector[TokenType.C_BRK] = Action.ERROR_POP;
  actionsErrorSelector[TokenType.O_PAR] = Action.ERROR_PUSH;
  actionsErrorSelector[TokenType.C_PAR] = Action.ERROR_POP;
  priority[TokenType.C_PAR] = 0;
  priority[TokenType.COMMA] = 0;
  priority[TokenType.QMARK] = 1;
  priority[TokenType.COLON] = 1;
  priority[TokenType.AMP_AMP] = 2;
  priority[TokenType.BAR_BAR] = 2;
  priority[TokenType.LT] = 3;
  priority[TokenType.GT] = 3;
  priority[TokenType.LT_EQ] = 3;
  priority[TokenType.GT_EQ] = 3;
  priority[TokenType.EQ] = 3;
  priority[TokenType.EQ_EQ] = 3;
  priority[TokenType.BANG_EQ] = 3;
  priority[TokenType.PLUS] = 4;
  priority[TokenType.MINUS] = 4;
  priority[TokenType.STAR] = 5;
  priority[TokenType.SLASH] = 5;
  priority[TokenType.PERCENT] = 5;
  priority[TokenType.EOF] = 6;
  priority[OP_MEDIA_AND] = 2;
  priority[OP_MEDIA_OR] = 2;
})();

/**
 * @enum {number}
 */
export enum ExprContext {
  PROP,
  WHEN,
  MEDIA,
  IMPORT,
  SUPPORTS,
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
  inStyleDeclaration: boolean = false;

  constructor(
    public actions: Action[],
    public tokenizer: CssTokenizer.Tokenizer,
    public readonly handler: ParserHandler,
    public baseURL: string,
  ) {
    this.exprContext = ExprContext.MEDIA;
  }

  extractVals(sep: string, index: number): Css.Val[] {
    const arr: Css.Val[] = [];
    const valStack = this.valStack;
    while (index < valStack.length) {
      arr.push(valStack[index++] as Css.Val);
      if (index === valStack.length) {
        break;
      }
      if (valStack[index++] !== sep) {
        throw new Error("Unexpected state");
      }
      if (index === valStack.length) {
        // keep last comma in `var(--b , )`
        arr.push(Css.empty);
      }
    }
    return arr;
  }

  valStackReduce(sep: string, token: CssTokenizer.Token): Css.Val {
    const valStack = this.valStack;
    let index = valStack.length;
    let parLevel = 0;
    let v;
    do {
      v = valStack[--index];
      if (sep === ")" && v instanceof Css.AnyToken) {
        // For nested parens in calc() (Issue #1014)
        if (v.text === ")") {
          parLevel++;
        } else if (v.text === "(") {
          if (parLevel === 0) {
            return null;
          }
          parLevel--;
        }
      }
    } while (typeof v != "undefined" && typeof v != "string");
    let count = valStack.length - (index + 1);
    if (count > 1) {
      valStack.splice(
        index + 1,
        count,
        new Css.SpaceList(valStack.slice(index + 1, valStack.length)),
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
        if (token.type !== TokenType.EOF) {
          this.handler.error("E_CSS_MISMATCHED_C_PAR", token);
          this.actions = actionsErrorDecl;
        }
      }
      const func = new Css.Func(
        valStack[index - 1] as string,
        this.extractVals(",", index + 1),
      );
      valStack.splice(index - 1, count + 2, func);

      // Check invalid var()
      if (func.name === "var") {
        const name = func.values[0] instanceof Css.Ident && func.values[0].name;
        if (!Css.isCustomPropName(name) || name === this.propName) {
          this.handler.error(`E_CSS_INVALID_VAR ${func.toString()}`, token);
          this.actions = actionsErrorDecl;
        }
      }
      return func;
    }
    if (sep != ";" || index >= 0) {
      this.handler.error("E_CSS_UNEXPECTED_VAL_END", token);
      this.actions = actionsErrorDecl;
      return null;
    }
    if (count > 1) {
      return new Css.CommaList(this.extractVals(",", index + 1));
    }
    const val = valStack[0];
    if (val instanceof Css.Val) {
      return val;
    } else if (!val) {
      return Css.empty;
    } else {
      // custom property value can be arbitrary token e.g. ","
      return new Css.AnyToken(val.toString());
    }
  }

  exprError(mnemonics: string, token: CssTokenizer.Token) {
    this.actions = this.propName ? actionsErrorDecl : actionsError;
    // this.handler.error(mnemonics, token);
    // (should not throw error by expression syntax errors)
    Logging.logger.warn(mnemonics, token.toString());
  }

  exprStackReduce(op: number, token: CssTokenizer.Token): boolean {
    const valStack = this.valStack;
    const handler = this.handler;
    let val = valStack.pop() as Exprs.Val;
    let val2: Exprs.Val;
    while (true) {
      let tok = valStack.pop();
      if (op == TokenType.C_PAR) {
        const args: Exprs.Val[] = [val];
        while (tok == TokenType.COMMA) {
          args.unshift(valStack.pop());
          tok = valStack.pop();
        }
        if (typeof tok == "string") {
          if (tok == "{") {
            // reached CSS portion of the stack
            while (args.length >= 2) {
              const e1 = args.shift();
              const e2 = args.shift();
              const er = new Exprs.Comma(handler.getScope(), e1, e2);
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
              args,
            );
            op = TokenType.EOF;
            continue;
          }
        }
        if (tok == TokenType.O_PAR) {
          if (val.isMediaName()) {
            val = new Exprs.MediaTest(
              handler.getScope(),
              val as Exprs.MediaName,
              null,
            );
          }
          op = TokenType.EOF;
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
        if (tok == -TokenType.BANG) {
          val = new Exprs.Not(handler.getScope(), val);
        } else if (tok == -TokenType.MINUS) {
          val = new Exprs.Negate(handler.getScope(), val);
        } else if (tok == -OP_MEDIA_NOT) {
          // `not` operator in `@media` or `@supports`
          val = new Exprs.NotMedia(handler.getScope(), val);
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
          case TokenType.AMP_AMP:
            val = new Exprs.And(handler.getScope(), val2, val);
            break;
          case OP_MEDIA_AND:
            // `and` operator in `@media` or `@supports`
            val = new Exprs.AndMedia(handler.getScope(), val2, val);
            break;
          case OP_MEDIA_OR:
            // `or` operator in `@media` or `@supports`
            val = new Exprs.OrMedia(handler.getScope(), val2, val);
            break;
          case TokenType.BAR_BAR:
            val = new Exprs.Or(handler.getScope(), val2, val);
            break;
          case TokenType.LT:
            val = new Exprs.Lt(handler.getScope(), val2, val);
            break;
          case TokenType.GT:
            val = new Exprs.Gt(handler.getScope(), val2, val);
            break;
          case TokenType.LT_EQ:
            val = new Exprs.Le(handler.getScope(), val2, val);
            break;
          case TokenType.GT_EQ:
            val = new Exprs.Ge(handler.getScope(), val2, val);
            break;
          case TokenType.EQ:
          case TokenType.EQ_EQ:
            val = new Exprs.Eq(handler.getScope(), val2, val);
            break;
          case TokenType.BANG_EQ:
            val = new Exprs.Ne(handler.getScope(), val2, val);
            break;
          case TokenType.PLUS:
            val = new Exprs.Add(handler.getScope(), val2, val);
            break;
          case TokenType.MINUS:
            val = new Exprs.Subtract(handler.getScope(), val2, val);
            break;
          case TokenType.STAR:
            val = new Exprs.Multiply(handler.getScope(), val2, val);
            break;
          case TokenType.SLASH:
            val = new Exprs.Divide(handler.getScope(), val2, val);
            break;
          case TokenType.PERCENT:
            val = new Exprs.Modulo(handler.getScope(), val2, val);
            break;
          case TokenType.COLON:
            if (valStack.length > 1) {
              switch (valStack[valStack.length - 1]) {
                case TokenType.QMARK:
                  valStack.pop();
                  val = new Exprs.Cond(
                    handler.getScope(),
                    valStack.pop() as Exprs.Val,
                    val2,
                    val,
                  );
                  break;
                case TokenType.O_PAR:
                  if (val2.isMediaName()) {
                    val = new Exprs.MediaTest(
                      handler.getScope(),
                      val2 as Exprs.MediaName,
                      val,
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
          case TokenType.QMARK:
            if (op != TokenType.COLON) {
              this.exprError("E_CSS_EXPR_COND", token);
              return false;
            }

          // fall through
          case TokenType.O_PAR:
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

  readSupportsTest(token: CssTokenizer.Token): Exprs.SupportsTest {
    // `@supports (prop-name:...)`
    // `@supports func-name(...)`
    const isFunc = token.type === TokenType.FUNC;
    const tokenizer = this.tokenizer;
    let startPosition: number;
    let name: string;
    if (isFunc) {
      name = token.text;
      startPosition = token.position + name.length + 1;
    } else if (token.type === TokenType.O_PAR) {
      const token1 = tokenizer.nthToken(1);
      const token2 = tokenizer.nthToken(2);
      if (token1.type === TokenType.IDENT && token2.type === TokenType.COLON) {
        tokenizer.consume();
        tokenizer.consume();
        name = token1.text;
        startPosition = token2.position + 1;
      } else if (
        token1.type === TokenType.O_PAR ||
        token1.type === TokenType.FUNC ||
        (token1.type === TokenType.IDENT &&
          token1.text.toLowerCase() === "not" &&
          (token2.type === TokenType.O_PAR || token2.type === TokenType.FUNC))
      ) {
        return null;
      } else {
        // Unknown `(...)` syntax, read until `)` and evaluate to false
        startPosition = token.position + 1;
      }
    } else {
      return null;
    }
    let parLevel = 0;
    let tokenN: CssTokenizer.Token;
    let commaCount = 0;
    while (parLevel >= 0) {
      tokenizer.consume();
      tokenN = tokenizer.token();
      switch (tokenN.type) {
        case TokenType.C_PAR:
          parLevel--;
          break;
        case TokenType.O_PAR:
        case TokenType.FUNC:
          parLevel++;
          break;
        case TokenType.COMMA:
          if (parLevel === 0) {
            commaCount++;
          }
          break;
        case TokenType.EOF:
          this.exprError("E_CSS_UNEXPECTED_EOF", tokenN);
          return null;
      }
    }
    tokenizer.consume();
    const endPosition = tokenN.position;
    const value =
      isFunc && name === "selector" && commaCount > 0
        ? "" // selector() with multiple selectors doesn't work
        : tokenizer.input.substring(startPosition, endPosition).trim();
    const supportsTest = new Exprs.SupportsTest(
      this.handler.getScope(),
      name,
      value,
      isFunc,
    );
    return supportsTest;
  }

  readPseudoParams(): (number | string)[] {
    const arr = [];
    while (true) {
      const token = this.tokenizer.token();
      switch (token.type) {
        case TokenType.IDENT:
          arr.push(token.text);
          break;
        case TokenType.PLUS:
          arr.push("+");
          break;
        case TokenType.NUM:
        case TokenType.INT:
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
    if (token.type === TokenType.PLUS) {
      // '+'
      hasLeadingPlus = true;
      this.tokenizer.consume();
      token = this.tokenizer.token();
    } else if (
      token.type === TokenType.IDENT &&
      (token.text === "even" || token.text === "odd")
    ) {
      // 'even' or 'odd'
      this.tokenizer.consume();
      return [2, token.text === "odd" ? 1 : 0];
    }
    switch (token.type) {
      case TokenType.NUMERIC:
        if (hasLeadingPlus && token.num < 0) {
          // reject '+-an'
          return null;
        }

      // FALLTHROUGH
      case TokenType.IDENT:
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
          if (token.type === TokenType.NUMERIC) {
            a = token.num;
          }
          let b = 0;
          this.tokenizer.consume();
          token = this.tokenizer.token();
          const hasMinusSign = token.type === TokenType.MINUS;
          const hasSign = token.type === TokenType.PLUS || hasMinusSign;
          if (hasSign) {
            // 'an +b', 'an - b'
            this.tokenizer.consume();
            token = this.tokenizer.token();
          }
          if (token.type === TokenType.INT) {
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
          if (token.type === TokenType.NUMERIC) {
            a = token.num;
          }
          this.tokenizer.consume();
          token = this.tokenizer.token();
          if (token.type === TokenType.INT) {
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
              token.type === TokenType.NUMERIC ? token.num : 1,
              parseInt(r[1], 10),
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
      case TokenType.INT:
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
              new Exprs.Not(scope, new Exprs.Named(scope, "pref-horizontal")),
            );
            break;
          case "horizontal":
            condition = Exprs.and(
              scope,
              condition,
              new Exprs.Named(scope, "pref-horizontal"),
            );
            break;
          case "day":
            condition = Exprs.and(
              scope,
              condition,
              new Exprs.Not(scope, new Exprs.Named(scope, "pref-night-mode")),
            );
            break;
          case "night":
            condition = Exprs.and(
              scope,
              condition,
              new Exprs.Named(scope, "pref-night-mode"),
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
      case "counter-style":
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
    parsingValue: boolean,
    parsingStyleAttr: boolean,
    parsingMediaQuery: boolean,
    parsingFunctionParam: boolean,
    parsingRelationalSelector?: boolean,
  ): boolean {
    const handler = this.handler;
    const tokenizer = this.tokenizer;
    const valStack = this.valStack;
    let token: CssTokenizer.Token;
    let token1: CssTokenizer.Token;
    let ns: string | null;
    let text: string | null;
    let num: number;
    let val: Css.Val;
    let params: (number | string)[];
    let selectorStartPosition: number | null = null;

    if (parsingStyleAttr) {
      this.inStyleDeclaration = true;
    }
    if (parsingMediaQuery) {
      this.exprContext = ExprContext.MEDIA;
      this.valStack.push("{");
    }

    for (; count > 0; --count) {
      token = tokenizer.token();

      // For relational pseudo-class `:has()` support
      if (parsingFunctionParam && selectorStartPosition === null) {
        // token.position may be token's start position + 1
        selectorStartPosition = token.position - 1;
        if (tokenizer.input[selectorStartPosition] === "(") {
          selectorStartPosition++;
        }
      }

      // Do not stop parsing on invalid property syntax as long as brackets are balanced.
      if (
        this.actions === actionsPropVal &&
        this.errorBrackets.length > 0 &&
        (token.type === this.errorBrackets[this.errorBrackets.length - 1] ||
          token.type === TokenType.SEMICOL ||
          token.type === TokenType.BANG)
      ) {
        if (token.type === this.errorBrackets[this.errorBrackets.length - 1]) {
          this.errorBrackets.pop();
          if (token.type === TokenType.C_PAR) {
            // For nested func in parens (Issue #1014)
            if (this.valStackReduce(")", token)) {
              tokenizer.consume();
              continue;
            }
          }
        }
        valStack.push(new Css.AnyToken(token.toString()));
        tokenizer.consume();
        continue;
      }

      switch (this.actions[token.type]) {
        case Action.IDENT:
          // figure out if this is a property assignment or selector
          if (
            !this.inStyleDeclaration ||
            tokenizer.nthToken(1).type != TokenType.COLON
          ) {
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
          // property assignment
          this.propName = token.text;
          this.propImportant = false;
          tokenizer.consume();
          tokenizer.consume();
          this.actions = actionsPropVal;
          valStack.splice(0, valStack.length);
          continue;
        case Action.PROP:
          // figure out if this is a property assignment or selector
          if (tokenizer.nthToken(1).type != TokenType.COLON) {
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
          if (tokenizer.nthToken(1).type == TokenType.BAR) {
            tokenizer.consume();
            tokenizer.consume();
            ns = this.namespacePrefixToURI[token.text];
            if (ns != null) {
              token = tokenizer.token();
              switch (token.type) {
                case TokenType.IDENT:
                  handler.tagSelector(ns, token.text);
                  if (parsingFunctionParam) {
                    this.actions = actionsSelectorInFunc;
                  } else {
                    this.actions = actionsSelector;
                  }
                  tokenizer.consume();
                  break;
                case TokenType.STAR:
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
          if (tokenizer.nthToken(1).type == TokenType.BAR) {
            tokenizer.consume();
            tokenizer.consume();
            token = tokenizer.token();
            switch (token.type) {
              case TokenType.IDENT:
                handler.tagSelector(null, token.text);
                if (parsingFunctionParam) {
                  this.actions = actionsSelectorInFunc;
                } else {
                  this.actions = actionsSelector;
                }
                tokenizer.consume();
                break;
              case TokenType.STAR:
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
          if (!token.text) {
            handler.error("E_CSS_SYNTAX", token);
            tokenizer.consume();
            continue;
          }
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
            case TokenType.IDENT:
              handler.pseudoclassSelector(token.text, null);
              tokenizer.consume();
              if (parsingFunctionParam) {
                this.actions = actionsSelectorInFunc;
              } else {
                this.actions = actionsSelector;
              }
              continue;
            case TokenType.FUNC:
              text = token.text;
              tokenizer.consume();
              switch (text) {
                case "is":
                case "not":
                case "where":
                case "has":
                  this.actions = actionsSelectorStart;
                  handler.startFuncWithSelector(text);
                  if (
                    this.runParser(
                      Number.POSITIVE_INFINITY,
                      false,
                      false,
                      false,
                      true,
                      text === "has",
                    )
                  ) {
                    this.actions = actionsSelector;
                  } else {
                    this.actions = actionsErrorSelector;
                  }
                  continue;
                case "lang":
                case "href-epub-type":
                  token = tokenizer.token();
                  if (token.type === TokenType.IDENT) {
                    params = [token.text];
                    tokenizer.consume();
                    if (
                      text === "href-epub-type" &&
                      tokenizer.token().type === TokenType.COMMA
                    ) {
                      tokenizer.consume();
                      token = tokenizer.token();
                      if (token.type === TokenType.IDENT) {
                        params.push(token.text);
                        tokenizer.consume();
                      }
                    }
                    break;
                  } else {
                    break pseudoclassType;
                  }
                case "nth-child":
                case "nth-of-type":
                case "nth-last-child":
                case "nth-last-of-type":
                case "nth":
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
              if (token.type == TokenType.C_PAR) {
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
        case Action.SELECTOR_PSEUDOELEM_1:
          if (token.precededBySpace) {
            handler.descendantSelector();
          }

        // fall through
        case Action.SELECTOR_PSEUDOELEM:
          tokenizer.consume();
          token = tokenizer.token();
          switch (token.type) {
            case TokenType.IDENT:
              handler.pseudoelementSelector(token.text, null);
              if (parsingFunctionParam) {
                this.actions = actionsSelectorInFunc;
              } else {
                this.actions = actionsSelector;
              }
              tokenizer.consume();
              continue;
            case TokenType.FUNC:
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
              if (token.type == TokenType.C_PAR) {
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
          if (token.type == TokenType.IDENT) {
            text = token.text;
            tokenizer.consume();
          } else if (token.type == TokenType.STAR) {
            text = null;
            tokenizer.consume();
          } else if (token.type == TokenType.BAR) {
            text = "";
          } else {
            this.actions = actionsErrorSelector;
            handler.error("E_CSS_ATTR", token);
            tokenizer.consume();
            continue;
          }
          token = tokenizer.token();
          if (token.type == TokenType.BAR) {
            ns = text && this.namespacePrefixToURI[text];
            // if ns === null, it's wildcard namespace
            if (ns === undefined) {
              this.actions = actionsErrorSelector;
              handler.error("E_CSS_UNDECLARED_PREFIX", token);
              tokenizer.consume();
              continue;
            }
            tokenizer.consume();
            token = tokenizer.token();
            if (token.type != TokenType.IDENT) {
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
            case TokenType.EQ:
            case TokenType.TILDE_EQ:
            case TokenType.BAR_EQ:
            case TokenType.HAT_EQ:
            case TokenType.DOLLAR_EQ:
            case TokenType.STAR_EQ:
            case TokenType.COL_COL:
              num = token.type;
              tokenizer.consume();
              token = tokenizer.token();
              break;
            case TokenType.C_BRK:
              handler.attributeSelector(
                ns as string,
                text as string,
                TokenType.EOF,
                null,
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
            case TokenType.IDENT:
            case TokenType.STR:
              handler.attributeSelector(
                ns as string,
                text as string,
                num,
                token.text,
              );
              tokenizer.consume();
              token = tokenizer.token();
              break;
            default:
              this.actions = actionsErrorSelector;
              handler.error("E_CSS_ATTR_VAL_EXPECTED", token);
              continue;
          }
          if (token.type != TokenType.C_BRK) {
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
            this.inStyleDeclaration = true;
          } else {
            this.ruleStack.push("[selector]");
            this.inStyleDeclaration = true;
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
          valStack.push(new Css.HexColor(token.text));
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
          valStack.push(new Css.Numeric(token.num, token.text));
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
        case Action.VAL_URANGE:
          valStack.push(new Css.URange(token.text));
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
          if (text == "-epubx-expr" || text == "env") {
            // special case
            this.actions = actionsExprVal;
            this.exprContext = ExprContext.PROP;
            valStack.push("{");
          } else {
            valStack.push(text);
            valStack.push("(");
            if (this.errorBrackets.length > 0) {
              // For nested func in parens (Issue #1014)
              this.errorBrackets.push(TokenType.C_PAR);
            }
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
            token.type == TokenType.IDENT &&
            token.text.toLowerCase() == "important" &&
            (token1.type == TokenType.SEMICOL ||
              token1.type == TokenType.EOF ||
              token1.type == TokenType.C_BRC)
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
            case TokenType.NUM:
            case TokenType.NUMERIC:
            case TokenType.INT:
              if (!token1.precededBySpace) {
                // Plus before number, ignore
                tokenizer.consume();
                continue;
              }
          }
          // this.exprError("E_CSS_UNEXPECTED_PLUS", token);
          valStack.push(new Css.AnyToken("+"));
          tokenizer.consume();
          continue;
        case Action.VAL_END:
          tokenizer.consume();

        // fall through
        case Action.VAL_BRC:
          val = this.valStackReduce(";", token);
          if (val && this.propName) {
            handler.property(this.propName as string, val, this.propImportant);
          }
          this.actions = parsingStyleAttr ? actionsStyleAttribute : actionsBase;
          continue;
        case Action.VAL_FINISH:
          tokenizer.consume();

          // for implicit closing parens, e.g. style="color: var(--a, var(--b"
          while (valStack.length > 0) {
            const len = valStack.length;
            val = this.valStackReduce(";", token);
            if (!val || valStack.length === len) {
              break;
            }
          }
          if (parsingValue) {
            this.result = val;
            return true;
          }
          if (this.propName && val) {
            handler.property(this.propName as string, val, this.propImportant);
          }
          return true;
        case Action.EXPR_IDENT:
          token1 = tokenizer.nthToken(1);
          if (token1.type == TokenType.CLASS) {
            if (
              tokenizer.nthToken(2).type == TokenType.O_PAR &&
              !tokenizer.nthToken(2).precededBySpace
            ) {
              valStack.push(token.text, token1.text, "(");
              tokenizer.consume();
            } else {
              valStack.push(
                new Exprs.Named(
                  handler.getScope(),
                  Exprs.makeQualifiedName(token.text, token1.text),
                ),
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
                  new Exprs.MediaName(handler.getScope(), true, token1.text),
                );
              } else {
                if (token.text.toLowerCase() == "only") {
                  tokenizer.consume();
                  token = token1;
                }
                valStack.push(
                  new Exprs.MediaName(handler.getScope(), false, token.text),
                );
              }
            } else if (
              this.exprContext === ExprContext.SUPPORTS &&
              token.text.toLowerCase() === "not" &&
              valStack[valStack.length - 1] !== OP_MEDIA_AND &&
              valStack[valStack.length - 1] !== OP_MEDIA_OR &&
              (token1.type === TokenType.O_PAR ||
                token1.type === TokenType.FUNC)
            ) {
              // for `@supports not (...)`
              valStack.push(-OP_MEDIA_NOT);
              tokenizer.consume();
              continue;
            } else {
              valStack.push(new Exprs.Named(handler.getScope(), token.text));
            }
            this.actions = actionsExprOp;
          }
          tokenizer.consume();
          continue;
        case Action.EXPR_FUNC:
          if (this.exprContext === ExprContext.SUPPORTS) {
            // `@supports selector(...)`
            valStack.push(this.readSupportsTest(token));
            this.actions = actionsExprOp;
            continue;
          }
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
          if (token.type != TokenType.INT || token.precededBySpace) {
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
          // `and` or `or` operator in `@media` or `@supports`
          if (
            token.text.toLowerCase() === "and" &&
            valStack[valStack.length - 2] !== OP_MEDIA_OR &&
            valStack[valStack.length - 2] !== -OP_MEDIA_NOT
          ) {
            this.actions = actionsExprVal;
            this.exprStackReduce(OP_MEDIA_AND, token);
            valStack.push(OP_MEDIA_AND);
            tokenizer.consume();
          } else if (
            token.text.toLowerCase() === "or" &&
            valStack[valStack.length - 2] !== OP_MEDIA_AND &&
            valStack[valStack.length - 2] !== -OP_MEDIA_NOT
          ) {
            this.actions = actionsExprVal;
            this.exprStackReduce(OP_MEDIA_OR, token);
            valStack.push(OP_MEDIA_OR);
            tokenizer.consume();
          } else {
            this.exprError("E_CSS_SYNTAX", token);
          }
          continue;
        case Action.EXPR_C_PAR:
          if (this.exprStackReduce(token.type, token)) {
            this.actions = actionsPropVal;
          }
          tokenizer.consume();
          continue;
        case Action.EXPR_O_BRC:
          if (this.exprStackReduce(TokenType.C_PAR, token)) {
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
          if (this.exprStackReduce(TokenType.C_PAR, token)) {
            if (this.propName || this.exprContext != ExprContext.IMPORT) {
              this.exprError("E_CSS_UNEXPECTED_SEMICOL", token);
              // `@media ...;` and `@supports ...;` should be ok
              this.actions = actionsBase;
              tokenizer.consume();
              return false;
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
          if (this.exprContext === ExprContext.SUPPORTS) {
            // `@supports (...)`
            const supportsTest = this.readSupportsTest(token);
            if (supportsTest) {
              valStack.push(supportsTest);
              this.actions = actionsExprOp;
              continue;
            }
          }
          valStack.push(token.type);
          tokenizer.consume();
          continue;
        case Action.RULE_END:
          this.actions = actionsBase;
          tokenizer.consume();
          handler.endRule();
          this.inStyleDeclaration = false;
          if (this.ruleStack.length) {
            this.ruleStack.pop();
            switch (this.ruleStack[this.ruleStack.length - 1]) {
              case "page":
              case "-epubx-page-master":
              case "-epubx-partition-group":
                this.inStyleDeclaration = true;
            }
          }
          continue;
        case Action.AT:
          text = token.text.toLowerCase();
          switch (text) {
            case "import":
              tokenizer.consume();
              token = tokenizer.token();
              if (token.type == TokenType.STR || token.type == TokenType.URL) {
                this.importURL = token.text;
                tokenizer.consume();
                token = tokenizer.token();
                if (
                  token.type == TokenType.SEMICOL ||
                  token.type == TokenType.EOF
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
                case TokenType.IDENT:
                  text = token.text; // Prefix
                  tokenizer.consume();
                  token = tokenizer.token();
                  if (
                    (token.type == TokenType.STR ||
                      token.type == TokenType.URL) &&
                    tokenizer.nthToken(1).type == TokenType.SEMICOL
                  ) {
                    this.namespacePrefixToURI[text] = token.text;
                    tokenizer.consume();
                    tokenizer.consume();
                    continue;
                  }
                  break;
                case TokenType.STR:
                case TokenType.URL:
                  if (tokenizer.nthToken(1).type == TokenType.SEMICOL) {
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
                token.type == TokenType.STR &&
                tokenizer.nthToken(1).type == TokenType.SEMICOL
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
              if (tokenizer.nthToken(1).type == TokenType.O_BRC) {
                tokenizer.consume();
                tokenizer.consume();
                switch (text) {
                  case "font-face":
                    handler.startFontFaceRule();
                    this.inStyleDeclaration = true;
                    break;
                  case "-epubx-page-template":
                    handler.startPageTemplateRule();
                    break;
                  case "-epubx-define":
                    handler.startDefineRule();
                    this.inStyleDeclaration = true;
                    break;
                  case "-epubx-viewport":
                    handler.startViewportRule();
                    this.inStyleDeclaration = true;
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
                case TokenType.O_BRC:
                  tokenizer.consume();
                  handler.startFootnoteRule(null);
                  this.ruleStack.push(text);
                  handler.startRuleBody();
                  this.inStyleDeclaration = true;
                  continue;
                case TokenType.COL_COL:
                  tokenizer.consume();
                  token = tokenizer.token();
                  if (
                    token.type == TokenType.IDENT &&
                    tokenizer.nthToken(1).type == TokenType.O_BRC
                  ) {
                    text = token.text;
                    tokenizer.consume();
                    tokenizer.consume();
                    handler.startFootnoteRule(text);
                    this.ruleStack.push("-adapt-footnote-area");
                    handler.startRuleBody();
                    this.inStyleDeclaration = true;
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
              if (token.type == TokenType.O_BRC) {
                tokenizer.consume();
                handler.startPageMarginBoxRule(text);
                this.ruleStack.push(text);
                handler.startRuleBody();
                this.inStyleDeclaration = true;
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
            case "supports":
              tokenizer.consume();
              this.propName = null; // signals @ rule
              this.exprContext = ExprContext.SUPPORTS;
              this.actions = actionsExprVal;
              valStack.push("{");
              continue;
            case "-epubx-flow":
              if (
                tokenizer.nthToken(1).type == TokenType.IDENT &&
                tokenizer.nthToken(2).type == TokenType.O_BRC
              ) {
                handler.startFlowRule(tokenizer.nthToken(1).text);
                tokenizer.consume();
                tokenizer.consume();
                tokenizer.consume();
                this.ruleStack.push(text);
                handler.startRuleBody();
                this.inStyleDeclaration = true;
                continue;
              }
              break;
            case "counter-style":
              if (
                tokenizer.nthToken(1).type == TokenType.IDENT &&
                tokenizer.nthToken(2).type == TokenType.O_BRC
              ) {
                handler.startCounterStyleRule(tokenizer.nthToken(1).text);
                tokenizer.consume();
                tokenizer.consume();
                tokenizer.consume();
                this.ruleStack.push(text);
                handler.startRuleBody();
                this.inStyleDeclaration = true;
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
              if (token.type == TokenType.IDENT) {
                ruleName = token.text;
                tokenizer.consume();
                token = tokenizer.token();
              }
              if (
                token.type == TokenType.COLON &&
                tokenizer.nthToken(1).type == TokenType.IDENT
              ) {
                rulePseudoName = tokenizer.nthToken(1).text;
                tokenizer.consume();
                tokenizer.consume();
                token = tokenizer.token();
              }
              while (
                token.type == TokenType.FUNC &&
                token.text.toLowerCase() == "class" &&
                tokenizer.nthToken(1).type == TokenType.IDENT &&
                tokenizer.nthToken(2).type == TokenType.C_PAR
              ) {
                classes.push(tokenizer.nthToken(1).text);
                tokenizer.consume();
                tokenizer.consume();
                tokenizer.consume();
                token = tokenizer.token();
              }
              if (token.type == TokenType.O_BRC) {
                tokenizer.consume();
                switch (text) {
                  case "-epubx-page-master":
                    handler.startPageMasterRule(
                      ruleName,
                      rulePseudoName,
                      classes,
                    );
                    break;
                  case "-epubx-partition":
                    handler.startPartitionRule(
                      ruleName,
                      rulePseudoName,
                      classes,
                    );
                    break;
                  case "-epubx-partition-group":
                    handler.startPartitionGroupRule(
                      ruleName,
                      rulePseudoName,
                      classes,
                    );
                    break;
                }
                this.ruleStack.push(text);
                handler.startRuleBody();
                this.inStyleDeclaration = true;
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
          this.errorBrackets.push(token.type + 1);

          // Expected closing bracket
          tokenizer.consume();
          continue;
        case Action.ERROR_POP_DECL:
          // Close bracket while skipping error syntax in declaration
          if (this.errorBrackets.length == 0) {
            this.actions = actionsBase;

            // Don't consume closing brace
            continue;
          }

        // fall through
        case Action.ERROR_POP:
          if (
            parsingFunctionParam &&
            this.errorBrackets.length == 0 &&
            token.type == TokenType.C_PAR
          ) {
            tokenizer.consume();
            handler.endFuncWithSelector();
            return true;
          }
          // Close bracket while skipping error syntax
          if (
            this.errorBrackets.length > 0 &&
            this.errorBrackets[this.errorBrackets.length - 1] == token.type
          ) {
            this.errorBrackets.pop();
          }
          if (this.errorBrackets.length == 0 && token.type == TokenType.C_BRC) {
            this.actions = actionsBase;
          }
          tokenizer.consume();
          continue;
        case Action.ERROR_SEMICOL:
          if (this.errorBrackets.length == 0) {
            this.actions = actionsBase;
          }
          tokenizer.consume();
          continue;
        case Action.DONE:
          return true;
        default:
          if (parsingMediaQuery) {
            if (this.exprStackReduce(TokenType.C_PAR, token)) {
              this.result = valStack.pop() as Css.Val;
              return true;
            }
            return false;
          }
          if (parsingFunctionParam) {
            switch (token.type) {
              case TokenType.COMMA:
              case TokenType.C_PAR:
                if (this.actions === actionsSelectorStart) {
                  handler.error("E_CSS_SYNTAX", token);
                } else {
                  const selectorText = tokenizer.input.substring(
                    selectorStartPosition,
                    token.position,
                  );
                  handler.pushSelectorText(selectorText);
                  selectorStartPosition = token.position + 1;
                }
                if (token.type === TokenType.COMMA) {
                  handler.nextSelector();
                  this.actions = actionsSelectorStart;
                  tokenizer.consume();
                  continue;
                } else {
                  handler.endFuncWithSelector();
                  tokenizer.consume();
                  return true;
                }
              case TokenType.GT:
              case TokenType.PLUS:
              case TokenType.TILDE:
                if (parsingRelationalSelector) {
                  // :has() takes relational selectors e.g. `:has(> F)`
                  this.actions = actionsSelector;
                  continue;
                }
                break;
              case TokenType.O_BRC:
              case TokenType.O_BRK:
              case TokenType.O_PAR:
                this.errorBrackets.push(token.type + 1);
                break;
            }
            handler.error("E_CSS_SYNTAX", token);
            tokenizer.consume();
            this.actions = actionsErrorSelector;
            continue;
          }
          if (
            this.actions !== actionsError &&
            this.actions !== actionsErrorSelector &&
            this.actions !== actionsErrorDecl
          ) {
            if (token.type == TokenType.INVALID) {
              handler.error("E_CSS_SYNTAX", token);
            } else if (this.actions === actionsPropVal) {
              // Do not stop parsing on invalid property syntax as long as brackets are balanced.
              switch (token.type) {
                case TokenType.O_PAR:
                case TokenType.O_BRC:
                case TokenType.O_BRK:
                  this.errorBrackets.push(token.type + 1);
                  break;
              }
              valStack.push(new Css.AnyToken(token.toString()));
              tokenizer.consume();
              continue;
            } else if (
              token.type === TokenType.O_BRC &&
              this.actions == actionsExprVal &&
              valStack.length > 0
            ) {
              // `@media {...}` and `@supports {...}` should be ok
              handler.startMediaRule(valStack.pop() as Css.Expr);
              this.ruleStack.push("media");
              handler.startRuleBody();
              this.actions = actionsBase;
              tokenizer.consume();
              continue;
            } else if (
              token.type === TokenType.SEMICOL &&
              this.actions == actionsExprVal
            ) {
              // `@media;` and `@supports;` should be ok
              this.actions = actionsBase;
              tokenizer.consume();
              return false;
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

  override error(mnemonics: string, token: CssTokenizer.Token): void {
    // throw new Error(mnemonics + " " + token);
    Logging.logger.warn(mnemonics, token.toString());
  }

  override getScope(): Exprs.LexicalScope {
    return this.scope;
  }
}

export function parseStylesheet(
  tokenizer: CssTokenizer.Tokenizer,
  handler: ParserHandler,
  baseURL: string,
  classes: string | null,
  media: string | null,
): Task.Result<boolean> {
  const frame: Task.Frame<boolean> = Task.newFrame("parseStylesheet");
  const parser = new Parser(actionsBase, tokenizer, handler, baseURL);
  let condition: Css.Expr = null;
  if (media) {
    condition = parseMediaQuery(
      new CssTokenizer.Tokenizer(media, handler),
      handler,
      baseURL,
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
            baseURL,
          );
          if (parser.importCondition) {
            handler.startMediaRule(parser.importCondition);
            handler.startRuleBody();
          }
          const innerFrame: Task.Frame<boolean> = Task.newFrame(
            "parseStylesheet.import",
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
  media: string | null,
): Task.Result<boolean> {
  return Task.handle(
    "parseStylesheetFromText",
    (frame) => {
      const tok = new CssTokenizer.Tokenizer(text, handler);
      parseStylesheet(tok, handler, baseURL, classes, media).thenFinish(frame);
    },
    (frame, err) => {
      Logging.logger.warn(err, `Failed to parse stylesheet text: ${text}`);
      frame.finish(false);
    },
  );
}

export function parseStylesheetFromURL(
  url: string,
  handler: ParserHandler,
  classes: string | null,
  media: string | null,
): Task.Result<boolean> {
  return Task.handle(
    "parseStylesheetFromURL",
    (frame) => {
      Net.fetchFromURL(url).then((response) => {
        if (!response.responseText) {
          frame.finish(true);
        } else {
          parseStylesheetFromText(
            response.responseText,
            handler,
            url,
            classes,
            media,
          ).then((result) => {
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
    },
  );
}

export function parseValue(
  scope: Exprs.LexicalScope,
  tokenizer: CssTokenizer.Tokenizer,
  baseURL: string,
): Css.Val {
  const parser = new Parser(
    actionsPropVal,
    tokenizer,
    new ErrorHandler(scope),
    baseURL,
  );
  parser.runParser(Number.POSITIVE_INFINITY, true, false, false, false);
  return parser.result;
}

export function parseStyleAttribute(
  tokenizer: CssTokenizer.Tokenizer,
  handler: ParserHandler,
  baseURL: string,
): void {
  const parser = new Parser(actionsStyleAttribute, tokenizer, handler, baseURL);
  parser.runParser(Number.POSITIVE_INFINITY, false, true, false, false);
}

export function parseMediaQuery(
  tokenizer: CssTokenizer.Tokenizer,
  handler: ParserHandler,
  baseURL: string,
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
  utilization: true,
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
  propName: string,
): Css.Val {
  // Preserve viv-leader expressions as Css.Expr (Issue #1563)
  // leader() must be processed by ContentPropertyHandler, not evaluated here
  if (val instanceof Exprs.Native && val.str === "viv-leader") {
    return new Css.Expr(val);
  }
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
        new CssTokenizer.Tokenizer(result as string, null),
        "",
      );
    case "boolean":
      return result ? Css.ident._true : Css.ident._false;
    case "undefined":
      return Css.empty;
  }
  throw new Error("E_UNEXPECTED");
}
