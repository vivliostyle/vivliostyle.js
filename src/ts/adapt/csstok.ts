/**
 * Copyright 2013 Google, Inc.
 * Copyright 2017 Trim-marks Inc.
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
 * @fileoverview CSS Tokenizer.
 */
import * as base from './base';

export interface TokenizerHandler {
  error(mnemonics: string, token: Token): void;
}

export const escapeParseSingle = (str: string): string => {
  str = str.substr(1);
  if (str.match(/^[^0-9a-fA-F\n\r]$/)) {
    return str;
  }
  const code = parseInt(str, 16);
  if (isNaN(code)) {
    return '';
  }
  if (code <= 65535) {
    return String.fromCharCode(code);
  }
  if (code <= 1114111) {
    // non-BMP characters: convert to a surrogate pair
    return String.fromCharCode(55296 | code >> 10 & 1023, 56320 | code & 1023);
  }

  // not a valid Unicode value
  return '\ufffd';
};

export const escapeParse = (str: string): string => str.replace(
    /\\([0-9a-fA-F]{0,6}(\r\n|[ \n\r\t\f])?|[^0-9a-fA-F\n\r])/g,
    escapeParseSingle);

/**
 * @enum {number}
 */
export enum TokenType {
  EOF,
  IDENT,
  STR,
  NUMERIC,
  NUM,
  INT,
  FUNC,
  HASH,
  URL,
  CLASS,
  O_PAR,
  C_PAR,
  O_BRC,
  C_BRC,
  O_BRK,
  C_BRK,
  COMMA,
  SEMICOL,
  COLON,
  SLASH,
  AT,
  PERCENT,
  QMARK,
  PLUS,
  MINUS,
  BAR_BAR,
  AMP_AMP,

  // those can have "=" at the end
  BANG = 31,
  DOLLAR,
  HAT,
  BAR,
  TILDE,
  STAR,
  GT,
  LT,
  EQ,

  // tokens above plus "=" at the end, order must be the same
  BANG_EQ = 41,
  DOLLAR_EQ,
  HAT_EQ,
  BAR_EQ,
  TILDE_EQ,
  STAR_EQ,
  GT_EQ,
  LT_EQ,
  EQ_EQ,
  COL_COL,
  INVALID,
  LAST = 51
}

export class Token {
  type: TokenType;
  precededBySpace: boolean = false;
  num: number = 0;
  text: string = '';
  position: number = 0;

  constructor() {
    this.type = TokenType.EOF;
  }
}

/**
 * @enum {number}
 */
export enum Action {
  SPACE = 1,
  INT,
  IDENT,
  BANG,
  HASH = 6,
  DOLLAR,
  PERCENT,
  AMP,
  O_PAR,
  C_PAR,
  STAR,
  PLUS,
  COMMA,
  MINUS,
  DOT,
  SLASH,
  COLON,
  SEMICOL,
  LT,
  EQ,
  GT,
  QMARK,
  AT,
  O_BRK,
  C_BRK,
  O_BRC,
  C_BRC,
  BSLASH,
  HAT,
  BAR,
  TILDE,
  STR1,
  STR2,
  END,
  EQTAIL,
  ENDINT,
  ENDNUM,
  CONT,
  UNIT,
  PCUNIT,
  NUMBER,
  ENDIDNT,
  IDNTESC,
  ENDIDES,

  // end of identifier with escapes
  ENDSTR,
  ENDESTR,

  // end of string with escapes
  STR1ESC,
  STR2ESC,
  BAR_BAR,
  AMP_AMP,
  FUNC,
  FUNCES,
  COMMENT,
  COMMST,
  ENDNOTK,
  MINMIN,
  TOINT,
  TONUM,
  TOIDENT,
  TOIDES,
  KILL1,
  KILL2,
  URL,
  URL1,
  URL2,
  ENDURL,
  TERMURL,
  FINURL,
  LT_BG,
  LT_BG_M,
  INVALID,
  CHKPOSS,
  CHKPOSN,
  URLESC,
  IDESCH,
  COL_COL,
  TOCLASS,
  CHKSP,
  EOF
}

export const makeActions = (def: Action, spec: Action[]): Action[] => {
  const a: number[] = Array(128);
  let i: number;
  for (i = 0; i < 128; i++) {
    a[i] = def;
  }
  a[NaN] = def == Action.END ? Action.END : Action.INVALID;
  for (i = 0; i < spec.length; i += 2) {
    a[spec[i]] = spec[i + 1];
  }
  return a;
};

/**
 * Start of the token.
 */
export const actionsNormal: Action[] = [
  Action.INVALID, Action.INVALID, Action.INVALID, Action.INVALID,
  Action.INVALID, Action.INVALID, Action.INVALID, Action.INVALID,
  // 0x00-0x07
  Action.INVALID, Action.SPACE, Action.SPACE, Action.INVALID, Action.SPACE,
  Action.SPACE, Action.INVALID, Action.INVALID,
  // 0x08-0x0F
  Action.INVALID, Action.INVALID, Action.INVALID, Action.INVALID,
  Action.INVALID, Action.INVALID, Action.INVALID, Action.INVALID,
  // 0x10-0x17
  Action.INVALID, Action.INVALID, Action.INVALID, Action.INVALID,
  Action.INVALID, Action.INVALID, Action.INVALID, Action.INVALID,
  // 0x18-0x1F
  Action.SPACE, Action.BANG, Action.STR2, Action.HASH, Action.DOLLAR,
  Action.PERCENT, Action.AMP, Action.STR1,
  // 0x20-0x27
  Action.O_PAR, Action.C_PAR, Action.STAR, Action.PLUS, Action.COMMA,
  Action.MINUS, Action.DOT, Action.SLASH,
  // 0x28-0x2F
  Action.INT, Action.INT, Action.INT, Action.INT, Action.INT, Action.INT,
  Action.INT, Action.INT,
  // 0x30-0x37
  Action.INT, Action.INT, Action.COLON, Action.SEMICOL, Action.LT, Action.EQ,
  Action.GT, Action.QMARK,
  // 0x38-0x3F
  Action.AT, Action.IDENT, Action.IDENT, Action.IDENT, Action.IDENT,
  Action.IDENT, Action.IDENT, Action.IDENT,
  // 0x40-0x47
  Action.IDENT, Action.IDENT, Action.IDENT, Action.IDENT, Action.IDENT,
  Action.IDENT, Action.IDENT, Action.IDENT,
  // 0x48-0x4F
  Action.IDENT, Action.IDENT, Action.IDENT, Action.IDENT, Action.IDENT,
  Action.IDENT, Action.IDENT, Action.IDENT,
  // 0x50-0x57
  Action.IDENT, Action.IDENT, Action.IDENT, Action.O_BRK, Action.BSLASH,
  Action.C_BRK, Action.HAT, Action.IDENT,
  // 0x58-0x5F
  Action.INVALID, Action.IDENT, Action.IDENT, Action.IDENT, Action.IDENT,
  Action.IDENT, Action.IDENT, Action.IDENT,
  // 0x60-0x67
  Action.IDENT, Action.IDENT, Action.IDENT, Action.IDENT, Action.IDENT,
  Action.IDENT, Action.IDENT, Action.IDENT,
  // 0x68-0x6F
  Action.IDENT, Action.IDENT, Action.IDENT, Action.IDENT, Action.IDENT,
  Action.IDENT, Action.IDENT, Action.IDENT,
  // 0x70-0x77
  Action.IDENT, Action.IDENT, Action.IDENT, Action.O_BRC, Action.BAR,
  Action.C_BRC, Action.TILDE, Action.INVALID
];

// 0x78-0x7F
actionsNormal[NaN] = Action.EOF;

/**
 * Inside identifier.
 */
export const actionsIdent: Action[] = [
  Action.ENDIDNT, Action.ENDIDNT, Action.ENDIDNT, Action.ENDIDNT,
  Action.ENDIDNT, Action.ENDIDNT, Action.ENDIDNT, Action.ENDIDNT,
  // 0x00-0x07
  Action.ENDIDNT, Action.ENDIDNT, Action.ENDIDNT, Action.ENDIDNT,
  Action.ENDIDNT, Action.ENDIDNT, Action.ENDIDNT, Action.ENDIDNT,
  // 0x08-0x0F
  Action.ENDIDNT, Action.ENDIDNT, Action.ENDIDNT, Action.ENDIDNT,
  Action.ENDIDNT, Action.ENDIDNT, Action.ENDIDNT, Action.ENDIDNT,
  // 0x10-0x17
  Action.ENDIDNT, Action.ENDIDNT, Action.ENDIDNT, Action.ENDIDNT,
  Action.ENDIDNT, Action.ENDIDNT, Action.ENDIDNT, Action.ENDIDNT,
  // 0x18-0x1F
  Action.ENDIDNT, Action.ENDIDNT, Action.ENDIDNT, Action.ENDIDNT,
  Action.ENDIDNT, Action.ENDIDNT, Action.ENDIDNT, Action.ENDIDNT,
  // 0x20-0x27
  Action.FUNC, Action.ENDIDNT, Action.ENDIDNT, Action.ENDIDNT, Action.ENDIDNT,
  Action.CONT, Action.ENDIDNT, Action.ENDIDNT,
  // 0x28-0x2F
  Action.CONT, Action.CONT, Action.CONT, Action.CONT, Action.CONT, Action.CONT,
  Action.CONT, Action.CONT,
  // 0x30-0x37
  Action.CONT, Action.CONT, Action.ENDIDNT, Action.ENDIDNT, Action.ENDIDNT,
  Action.ENDIDNT, Action.ENDIDNT, Action.ENDIDNT,
  // 0x38-0x3F
  Action.ENDIDNT, Action.CONT, Action.CONT, Action.CONT, Action.CONT,
  Action.CONT, Action.CONT, Action.CONT,
  // 0x40-0x47
  Action.CONT, Action.CONT, Action.CONT, Action.CONT, Action.CONT, Action.CONT,
  Action.CONT, Action.CONT,
  // 0x48-0x4F
  Action.CONT, Action.CONT, Action.CONT, Action.CONT, Action.CONT, Action.CONT,
  Action.CONT, Action.CONT,
  // 0x50-0x57
  Action.CONT, Action.CONT, Action.CONT, Action.ENDIDNT, Action.IDNTESC,
  Action.ENDIDNT, Action.ENDIDNT, Action.CONT,
  // 0x58-0x5F
  Action.ENDIDNT, Action.CONT, Action.CONT, Action.CONT, Action.CONT,
  Action.CONT, Action.CONT, Action.CONT,
  // 0x60-0x67
  Action.CONT, Action.CONT, Action.CONT, Action.CONT, Action.CONT, Action.CONT,
  Action.CONT, Action.CONT,
  // 0x68-0x6F
  Action.CONT, Action.CONT, Action.CONT, Action.CONT, Action.CONT, Action.CONT,
  Action.CONT, Action.CONT,
  // 0x70-0x77
  Action.CONT, Action.CONT, Action.CONT, Action.ENDIDNT, Action.ENDIDNT,
  Action.ENDIDNT, Action.ENDIDNT, Action.ENDIDNT
];

// 0x78-0x7F
actionsIdent[NaN] = Action.ENDIDNT;

/**
 * After dot (either .class or .123)
 */
export const actionsNumOrClass: Action[] = [
  Action.INVALID, Action.INVALID, Action.INVALID, Action.INVALID,
  Action.INVALID, Action.INVALID, Action.INVALID, Action.INVALID,
  // 0x00-0x07
  Action.INVALID, Action.INVALID, Action.INVALID, Action.INVALID,
  Action.INVALID, Action.INVALID, Action.INVALID, Action.INVALID,
  // 0x08-0x0F
  Action.INVALID, Action.INVALID, Action.INVALID, Action.INVALID,
  Action.INVALID, Action.INVALID, Action.INVALID, Action.INVALID,
  // 0x10-0x17
  Action.INVALID, Action.INVALID, Action.INVALID, Action.INVALID,
  Action.INVALID, Action.INVALID, Action.INVALID, Action.INVALID,
  // 0x18-0x1F
  Action.INVALID, Action.INVALID, Action.INVALID, Action.INVALID,
  Action.INVALID, Action.INVALID, Action.INVALID, Action.INVALID,
  // 0x20-0x27
  Action.INVALID, Action.INVALID, Action.INVALID, Action.INVALID,
  Action.INVALID, Action.TOCLASS, Action.TONUM, Action.INVALID,
  // 0x28-0x2F
  Action.TONUM, Action.TONUM, Action.TONUM, Action.TONUM, Action.TONUM,
  Action.TONUM, Action.TONUM, Action.TONUM,
  // 0x30-0x37
  Action.TONUM, Action.TONUM, Action.INVALID, Action.INVALID, Action.INVALID,
  Action.INVALID, Action.INVALID, Action.INVALID,
  // 0x38-0x3F
  Action.INVALID, Action.TOCLASS, Action.TOCLASS, Action.TOCLASS,
  Action.TOCLASS, Action.TOCLASS, Action.TOCLASS, Action.TOCLASS,
  // 0x40-0x47
  Action.TOCLASS, Action.TOCLASS, Action.TOCLASS, Action.TOCLASS,
  Action.TOCLASS, Action.TOCLASS, Action.TOCLASS, Action.TOCLASS,
  // 0x48-0x4F
  Action.TOCLASS, Action.TOCLASS, Action.TOCLASS, Action.TOCLASS,
  Action.TOCLASS, Action.TOCLASS, Action.TOCLASS, Action.TOCLASS,
  // 0x50-0x57
  Action.TOCLASS, Action.TOCLASS, Action.TOCLASS, Action.INVALID, Action.TOIDES,
  Action.INVALID, Action.INVALID, Action.TOCLASS,
  // 0x58-0x5F
  Action.INVALID, Action.TOCLASS, Action.TOCLASS, Action.TOCLASS,
  Action.TOCLASS, Action.TOCLASS, Action.TOCLASS, Action.TOCLASS,
  // 0x60-0x67
  Action.TOCLASS, Action.TOCLASS, Action.TOCLASS, Action.TOCLASS,
  Action.TOCLASS, Action.TOCLASS, Action.TOCLASS, Action.TOCLASS,
  // 0x68-0x6F
  Action.TOCLASS, Action.TOCLASS, Action.TOCLASS, Action.TOCLASS,
  Action.TOCLASS, Action.TOCLASS, Action.TOCLASS, Action.TOCLASS,
  // 0x70-0x77
  Action.TOCLASS, Action.TOCLASS, Action.TOCLASS, Action.INVALID,
  Action.INVALID, Action.INVALID, Action.INVALID, Action.INVALID
];

// 0x78-0x7F
actionsIdent[NaN] = Action.ENDIDNT;

/**
 * after '-'
 */
export const actionsMinus: Action[] = [
  Action.END, Action.END, Action.END, Action.END, Action.END, Action.END,
  Action.END, Action.END,
  // 0x00-0x07
  Action.END, Action.END, Action.END, Action.END, Action.END, Action.END,
  Action.END, Action.END,
  // 0x08-0x0F
  Action.END, Action.END, Action.END, Action.END, Action.END, Action.END,
  Action.END, Action.END,
  // 0x10-0x17
  Action.END, Action.END, Action.END, Action.END, Action.END, Action.END,
  Action.END, Action.END,
  // 0x18-0x1F
  Action.END, Action.END, Action.END, Action.END, Action.END, Action.END,
  Action.END, Action.END,
  // 0x20-0x27
  Action.END, Action.END, Action.END, Action.END, Action.END, Action.MINMIN,
  Action.TONUM, Action.END,
  // 0x28-0x2F
  Action.TOINT, Action.TOINT, Action.TOINT, Action.TOINT, Action.TOINT,
  Action.TOINT, Action.TOINT, Action.TOINT,
  // 0x30-0x37
  Action.TOINT, Action.TOINT, Action.END, Action.END, Action.END, Action.END,
  Action.END, Action.END,
  // 0x38-0x3F
  Action.END, Action.TOIDENT, Action.TOIDENT, Action.TOIDENT, Action.TOIDENT,
  Action.TOIDENT, Action.TOIDENT, Action.TOIDENT,
  // 0x40-0x47
  Action.TOIDENT, Action.TOIDENT, Action.TOIDENT, Action.TOIDENT,
  Action.TOIDENT, Action.TOIDENT, Action.TOIDENT, Action.TOIDENT,
  // 0x48-0x4F
  Action.TOIDENT, Action.TOIDENT, Action.TOIDENT, Action.TOIDENT,
  Action.TOIDENT, Action.TOIDENT, Action.TOIDENT, Action.TOIDENT,
  // 0x50-0x57
  Action.TOIDENT, Action.TOIDENT, Action.TOIDENT, Action.END, Action.TOIDES,
  Action.END, Action.END, Action.TOIDENT,
  // 0x58-0x5F
  Action.END, Action.TOIDENT, Action.TOIDENT, Action.TOIDENT, Action.TOIDENT,
  Action.TOIDENT, Action.TOIDENT, Action.TOIDENT,
  // 0x60-0x67
  Action.TOIDENT, Action.TOIDENT, Action.TOIDENT, Action.TOIDENT,
  Action.TOIDENT, Action.TOIDENT, Action.TOIDENT, Action.TOIDENT,
  // 0x68-0x6F
  Action.TOIDENT, Action.TOIDENT, Action.TOIDENT, Action.TOIDENT,
  Action.TOIDENT, Action.TOIDENT, Action.TOIDENT, Action.TOIDENT,
  // 0x70-0x77
  Action.TOIDENT, Action.TOIDENT, Action.TOIDENT, Action.END, Action.END,
  Action.END, Action.END, Action.END
];

// 0x78-0x7F
actionsMinus[NaN] = Action.END;

/**
 * Inside identifier with escape sequence
 */
export const actionsIdentEsc: Action[] = [
  Action.ENDIDES, Action.ENDIDES, Action.ENDIDES, Action.ENDIDES,
  Action.ENDIDES, Action.ENDIDES, Action.ENDIDES, Action.ENDIDES,
  // 0x00-0x07
  Action.ENDIDES, Action.CHKPOSS, Action.ENDIDES, Action.ENDIDES,
  Action.ENDIDES, Action.ENDIDES, Action.ENDIDES, Action.ENDIDES,
  // 0x08-0x0F
  Action.ENDIDES, Action.ENDIDES, Action.ENDIDES, Action.ENDIDES,
  Action.ENDIDES, Action.ENDIDES, Action.ENDIDES, Action.ENDIDES,
  // 0x10-0x17
  Action.ENDIDES, Action.ENDIDES, Action.ENDIDES, Action.ENDIDES,
  Action.ENDIDES, Action.ENDIDES, Action.ENDIDES, Action.ENDIDES,
  // 0x18-0x1F
  Action.CHKPOSS, Action.ENDIDES, Action.ENDIDES, Action.ENDIDES,
  Action.ENDIDES, Action.ENDIDES, Action.ENDIDES, Action.ENDIDES,
  // 0x20-0x27
  Action.FUNCES, Action.ENDIDES, Action.ENDIDES, Action.ENDIDES, Action.ENDIDES,
  Action.ENDIDES, Action.ENDIDES, Action.ENDIDES,
  // 0x28-0x2F
  Action.CONT, Action.CONT, Action.CONT, Action.CONT, Action.CONT, Action.CONT,
  Action.CONT, Action.CONT,
  // 0x30-0x37
  Action.CONT, Action.CONT, Action.ENDIDES, Action.ENDIDES, Action.ENDIDES,
  Action.ENDIDES, Action.ENDIDES, Action.ENDIDES,
  // 0x38-0x3F
  Action.ENDIDES, Action.CONT, Action.CONT, Action.CONT, Action.CONT,
  Action.CONT, Action.CONT, Action.CONT,
  // 0x40-0x47
  Action.CONT, Action.CONT, Action.CONT, Action.CONT, Action.CONT, Action.CONT,
  Action.CONT, Action.CONT,
  // 0x48-0x4F
  Action.CONT, Action.CONT, Action.CONT, Action.CONT, Action.CONT, Action.CONT,
  Action.CONT, Action.CONT,
  // 0x50-0x57
  Action.CONT, Action.CONT, Action.CONT, Action.ENDIDES, Action.IDNTESC,
  Action.ENDIDES, Action.ENDIDES, Action.CONT,
  // 0x58-0x5F
  Action.ENDIDES, Action.CONT, Action.CONT, Action.CONT, Action.CONT,
  Action.CONT, Action.CONT, Action.CONT,
  // 0x60-0x67
  Action.CONT, Action.CONT, Action.CONT, Action.CONT, Action.CONT, Action.CONT,
  Action.CONT, Action.CONT,
  // 0x68-0x6F
  Action.CONT, Action.CONT, Action.CONT, Action.CONT, Action.CONT, Action.CONT,
  Action.CONT, Action.CONT,
  // 0x70-0x77
  Action.CONT, Action.CONT, Action.CONT, Action.ENDIDES, Action.ENDIDES,
  Action.ENDIDES, Action.ENDIDES, Action.ENDIDES
];

// 0x78-0x7F
actionsIdentEsc[NaN] = Action.ENDIDES;

/**
 * Inside integer
 */
export const actionsInt: Action[] = [
  Action.ENDINT, Action.ENDINT, Action.ENDINT, Action.ENDINT, Action.ENDINT,
  Action.ENDINT, Action.ENDINT, Action.ENDINT,
  // 0x00-0x07
  Action.ENDINT, Action.ENDINT, Action.ENDINT, Action.ENDINT, Action.ENDINT,
  Action.ENDINT, Action.ENDINT, Action.ENDINT,
  // 0x08-0x0F
  Action.ENDINT, Action.ENDINT, Action.ENDINT, Action.ENDINT, Action.ENDINT,
  Action.ENDINT, Action.ENDINT, Action.ENDINT,
  // 0x10-0x17
  Action.ENDINT, Action.ENDINT, Action.ENDINT, Action.ENDINT, Action.ENDINT,
  Action.ENDINT, Action.ENDINT, Action.ENDINT,
  // 0x18-0x1F
  Action.ENDINT, Action.ENDINT, Action.ENDINT, Action.ENDINT, Action.ENDINT,
  Action.PCUNIT, Action.ENDINT, Action.ENDINT,
  // 0x20-0x27
  Action.ENDINT, Action.ENDINT, Action.ENDINT, Action.ENDINT, Action.ENDINT,
  Action.ENDINT, Action.NUMBER, Action.ENDINT,
  // 0x28-0x2F
  Action.CONT, Action.CONT, Action.CONT, Action.CONT, Action.CONT, Action.CONT,
  Action.CONT, Action.CONT,
  // 0x30-0x37
  Action.CONT, Action.CONT, Action.ENDINT, Action.ENDINT, Action.ENDINT,
  Action.ENDINT, Action.ENDINT, Action.ENDINT,
  // 0x38-0x3F
  Action.ENDINT, Action.UNIT, Action.UNIT, Action.UNIT, Action.UNIT,
  Action.UNIT, Action.UNIT, Action.UNIT,
  // 0x40-0x47
  Action.UNIT, Action.UNIT, Action.UNIT, Action.UNIT, Action.UNIT, Action.UNIT,
  Action.UNIT, Action.UNIT,
  // 0x48-0x4F
  Action.UNIT, Action.UNIT, Action.UNIT, Action.UNIT, Action.UNIT, Action.UNIT,
  Action.UNIT, Action.UNIT,
  // 0x50-0x57
  Action.UNIT, Action.UNIT, Action.UNIT, Action.ENDINT, Action.ENDINT,
  Action.ENDINT, Action.ENDINT, Action.UNIT,
  // 0x58-0x5F
  Action.ENDINT, Action.UNIT, Action.UNIT, Action.UNIT, Action.UNIT,
  Action.UNIT, Action.UNIT, Action.UNIT,
  // 0x60-0x67
  Action.UNIT, Action.UNIT, Action.UNIT, Action.UNIT, Action.UNIT, Action.UNIT,
  Action.UNIT, Action.UNIT,
  // 0x68-0x6F
  Action.UNIT, Action.UNIT, Action.UNIT, Action.UNIT, Action.UNIT, Action.UNIT,
  Action.UNIT, Action.UNIT,
  // 0x70-0x77
  Action.UNIT, Action.UNIT, Action.UNIT, Action.ENDINT, Action.ENDINT,
  Action.ENDINT, Action.ENDINT, Action.ENDINT
];

// 0x78-0x7F
actionsInt[NaN] = Action.ENDINT;

/**
 * inside real, after dot
 */
export const actionsNumber: Action[] = [
  Action.ENDNUM, Action.ENDNUM, Action.ENDNUM, Action.ENDNUM, Action.ENDNUM,
  Action.ENDNUM, Action.ENDNUM, Action.ENDNUM,
  // 0x00-0x07
  Action.ENDNUM, Action.ENDNUM, Action.ENDNUM, Action.ENDNUM, Action.ENDNUM,
  Action.ENDNUM, Action.ENDNUM, Action.ENDNUM,
  // 0x08-0x0F
  Action.ENDNUM, Action.ENDNUM, Action.ENDNUM, Action.ENDNUM, Action.ENDNUM,
  Action.ENDNUM, Action.ENDNUM, Action.ENDNUM,
  // 0x10-0x17
  Action.ENDNUM, Action.ENDNUM, Action.ENDNUM, Action.ENDNUM, Action.ENDNUM,
  Action.ENDNUM, Action.ENDNUM, Action.ENDNUM,
  // 0x18-0x1F
  Action.ENDNUM, Action.ENDNUM, Action.ENDNUM, Action.ENDNUM, Action.ENDNUM,
  Action.PCUNIT, Action.ENDNUM, Action.ENDNUM,
  // 0x20-0x27
  Action.ENDNUM, Action.ENDNUM, Action.ENDNUM, Action.ENDNUM, Action.ENDNUM,
  Action.ENDNUM, Action.ENDNUM, Action.ENDNUM,
  // 0x28-0x2F
  Action.CONT, Action.CONT, Action.CONT, Action.CONT, Action.CONT, Action.CONT,
  Action.CONT, Action.CONT,
  // 0x30-0x37
  Action.CONT, Action.CONT, Action.ENDNUM, Action.ENDNUM, Action.ENDNUM,
  Action.ENDNUM, Action.ENDNUM, Action.ENDNUM,
  // 0x38-0x3F
  Action.ENDNUM, Action.UNIT, Action.UNIT, Action.UNIT, Action.UNIT,
  Action.UNIT, Action.UNIT, Action.UNIT,
  // 0x40-0x47
  Action.UNIT, Action.UNIT, Action.UNIT, Action.UNIT, Action.UNIT, Action.UNIT,
  Action.UNIT, Action.UNIT,
  // 0x48-0x4F
  Action.UNIT, Action.UNIT, Action.UNIT, Action.UNIT, Action.UNIT, Action.UNIT,
  Action.UNIT, Action.UNIT,
  // 0x50-0x57
  Action.UNIT, Action.UNIT, Action.UNIT, Action.ENDNUM, Action.ENDNUM,
  Action.ENDNUM, Action.ENDNUM, Action.UNIT,
  // 0x58-0x5F
  Action.ENDNUM, Action.UNIT, Action.UNIT, Action.UNIT, Action.UNIT,
  Action.UNIT, Action.UNIT, Action.UNIT,
  // 0x60-0x67
  Action.UNIT, Action.UNIT, Action.UNIT, Action.UNIT, Action.UNIT, Action.UNIT,
  Action.UNIT, Action.UNIT,
  // 0x68-0x6F
  Action.UNIT, Action.UNIT, Action.UNIT, Action.UNIT, Action.UNIT, Action.UNIT,
  Action.UNIT, Action.UNIT,
  // 0x70-0x77
  Action.UNIT, Action.UNIT, Action.UNIT, Action.ENDNUM, Action.ENDNUM,
  Action.ENDNUM, Action.ENDNUM, Action.ENDNUM
];

// 0x78-0x7F
actionsNumber[NaN] = Action.ENDNUM;

export const actionsCheckEq: Action[] = makeActions(Action.END, [
  61,
  /*=*/
  Action.EQTAIL
]);

export const actionsColon: Action[] = makeActions(Action.END, [
  58,
  /*:*/
  Action.COL_COL
]);

export const actionsBar: Action[] = makeActions(Action.END, [
  61,
  /*=*/
  Action.EQTAIL, 124,
  /*|*/
  Action.BAR_BAR
]);

export const actionsAmp: Action[] = makeActions(Action.END, [
  38,
  /*&*/
  Action.AMP_AMP
]);

export const actionsSlash: Action[] =
    makeActions(Action.END, [42, Action.COMMENT]);

export const actionsComment: Action[] =
    makeActions(Action.CONT, [42, Action.COMMST]);

export const actionsCommentStar: Action[] = makeActions(Action.COMMENT, [
  42, Action.COMMST, 47,
  /* / */
  Action.ENDNOTK
]);

export const actionsMinusMinus: Action[] = makeActions(Action.KILL1, [
  62,
  /* > */
  Action.ENDNOTK
]);

export const actionsLt: Action[] = makeActions(Action.END, [
  61,
  /*=*/
  Action.EQTAIL, 33,
  /*!*/
  Action.LT_BG
]);

export const actionsLtBang: Action[] = makeActions(Action.KILL1, [
  45,
  /*-*/
  Action.LT_BG_M
]);

export const actionsLtBangMinus: Action[] = makeActions(Action.KILL2, [
  45,
  /*-*/
  Action.ENDNOTK
]);

export const actionsIdentEscChr: Action[] = makeActions(Action.IDESCH, [
  9,
  /*tab*/
  Action.INVALID, 10,
  /*LF*/
  Action.INVALID, 13,
  /*CR*/
  Action.INVALID, 32,
  /*sp*/
  Action.INVALID
]);

export const actionsStr1: Action[] = makeActions(Action.CONT, [
  39,
  /*'*/
  Action.ENDSTR, 10,
  /*LF*/
  Action.INVALID, 13,
  /*CR*/
  Action.INVALID, 92,
  /*\*/
  Action.STR1ESC
]);

export const actionsStr2: Action[] = makeActions(Action.CONT, [
  34,
  /*"*/
  Action.ENDSTR, 10,
  /*LF*/
  Action.INVALID, 13,
  /*CR*/
  Action.INVALID, 92,
  /*\*/
  Action.STR2ESC
]);

export const actionsStr1Esc: Action[] = makeActions(Action.CONT, [
  39,
  /*'*/
  Action.ENDESTR, 10,
  /*LF*/
  Action.CHKPOSN, 13,
  /*CR*/
  Action.CHKPOSN, 92,
  /*\*/
  Action.STR1ESC
]);

export const actionsStr2Esc: Action[] = makeActions(Action.CONT, [
  34,
  /*"*/
  Action.ENDESTR, 10,
  /*LF*/
  Action.CHKPOSN, 13,
  /*CR*/
  Action.CHKPOSN, 92,
  /*\*/
  Action.STR2ESC
]);

export const actionsURL: Action[] = makeActions(Action.URL, [
  9,
  /*tab*/
  Action.CONT, 32,
  /*sp*/
  Action.CONT, 34,
  /*"*/
  Action.URL2, 39,
  /*'*/
  Action.URL1, 41,
  /*)*/
  Action.INVALID, 10,
  /*LF*/
  Action.CONT, 13,
  /*CR*/
  Action.CONT
]);

export const actionsURLInside: Action[] = makeActions(Action.CONT, [
  41,
  /*)*/
  Action.ENDURL, 9,
  /*TAB*/
  Action.CHKSP, 10,
  /*LF*/
  Action.CHKSP, 13,
  /*CR*/
  Action.CHKSP, 32,
  /*sp*/
  Action.CHKSP, 92,
  /*\*/
  Action.URLESC, 40,
  /*(*/
  Action.INVALID, 91,
  /*[*/
  Action.INVALID, 93,
  /*]*/
  Action.INVALID, 123,
  /*{*/
  Action.INVALID, 125,
  /*}*/
  Action.INVALID, NaN, Action.ENDURL
]);

export const actionsURLInside1: Action[] = makeActions(Action.CONT, [
  39,
  /*'*/
  Action.TERMURL, 10,
  /*LF*/
  Action.CHKPOSN, 13,
  /*CR*/
  Action.CHKPOSN, 92,
  /*\*/
  Action.URLESC, NaN, Action.ENDURL
]);

export const actionsURLInside2: Action[] = makeActions(Action.CONT, [
  34,
  /*"*/
  Action.TERMURL, 10,
  /*LF*/
  Action.CHKPOSN, 13,
  /*CR*/
  Action.CHKPOSN, 92,
  /*\*/
  Action.URLESC, NaN, Action.ENDURL
]);

export const actionsURLTail: Action[] = makeActions(Action.INVALID, [
  9,
  /*tab*/
  Action.CONT, 10,
  /*LF*/
  Action.CONT, 13,
  /*CR*/
  Action.CONT, 32,
  /*sp*/
  Action.CONT, 41,
  /*)*/
  Action.FINURL
]);

export const INITIAL_INDEX_MASK = 15;

export class Tokenizer {
  indexMask: number;
  buffer: Token[];
  head: number = -1;

  // saved, occupied if >= 0
  tail: number = 0;

  // available, ready to write
  curr: number = 0;

  // ready to read
  position: number = 0;

  constructor(public input: string, public readonly handler: TokenizerHandler) {
    this.indexMask = INITIAL_INDEX_MASK;
    this.buffer = Array(this.indexMask + 1);
    for (let i = 0; i <= this.indexMask; i++) {
      this.buffer[i] = new Token();
    }
  }

  token(): Token {
    if (this.tail == this.curr) {
      this.fillBuffer();
    }
    return this.buffer[this.curr];
  }

  nthToken(n: number): Token {
    if ((this.tail - this.curr & this.indexMask) <= n) {
      this.fillBuffer();
    }
    return this.buffer[this.curr + n & this.indexMask];
  }

  consume(): void {
    this.curr = this.curr + 1 & this.indexMask;
  }

  mark(): void {
    if (this.head >= 0) {
      throw new Error('F_CSSTOK_BAD_CALL mark');
    }
    this.head = this.curr;
  }

  reset(): void {
    if (this.head < 0) {
      throw new Error('F_CSSTOK_BAD_CALL reset');
    }
    this.curr = this.head;
    this.head = -1;
  }

  unmark(): void {
    this.head = -1;
  }

  hasMark(): boolean {
    return this.head >= 0;
  }

  private reallocate(): void {
    const newIndexMask = 2 * (this.indexMask + 1) - 1;
    const newBuffer: Token[] = Array(newIndexMask + 1);
    let oldIndex = this.head;
    let newIndex = 0;
    while (oldIndex != this.tail) {
      newBuffer[newIndex] = this.buffer[oldIndex];
      if (oldIndex == this.curr) {
        this.curr = newIndex;
      }
      oldIndex = oldIndex + 1 & this.indexMask;
      newIndex++;
    }
    this.head = 0;
    this.tail = newIndex;
    this.indexMask = newIndexMask;
    this.buffer = newBuffer;
    while (newIndex <= newIndexMask) {
      newBuffer[newIndex++] = new Token();
    }
  }

  private error(position, token, mnemonics) {
    if (this.handler) {
      this.handler.error(mnemonics, token);
    }
  }

  private fillBuffer(): void {
    let tail = this.tail;
    let head = this.head >= 0 ? this.head : this.curr;
    let indexMask = this.indexMask;
    if (tail >= head) {
      head += indexMask;
    } else {
      head--;
    }
    if (head == tail) {
      // only expect to get here when mark is in effect
      if (this.head < 0) {
        throw new Error('F_CSSTOK_INTERNAL');
      }
      this.reallocate();
      tail = this.tail;
      indexMask = this.indexMask;
      head = indexMask;
    }

    // this.head is zero
    let actions = actionsNormal;
    const input = this.input;
    let position = this.position;
    const buffer = this.buffer;
    let tokenType: TokenType = TokenType.EOF;
    let tokenPosition: number = 0;
    let tokenText: string = '';
    let tokenNum: number = 0;
    let seenSpace = false;
    let token: Token = buffer[tail];
    let backslashPos = -9;

    // far enough before the start of the string
    while (true) {
      const charCode = input.charCodeAt(position);
      switch (actions[charCode] || actions[65]) {
        /*A*/
        case Action.INVALID:
          tokenType = TokenType.INVALID;
          if (isNaN(charCode)) {
            tokenText = 'E_CSS_UNEXPECTED_EOF';
          } else {
            tokenText = 'E_CSS_UNEXPECTED_CHAR';
          }
          actions = actionsNormal;
          position++;
          break;
        case Action.SPACE:
          position++;
          seenSpace = true;
          continue;
        case Action.INT:
          tokenPosition = position++;
          actions = actionsInt;
          continue;
        case Action.IDENT:
          tokenType = TokenType.IDENT;
          tokenPosition = position++;
          actions = actionsIdent;
          continue;
        case Action.BANG:
          tokenPosition = position++;
          tokenType = TokenType.BANG;
          actions = actionsCheckEq;
          continue;
        case Action.STR1:
          tokenType = TokenType.STR;
          tokenPosition = ++position;

          // after quote
          actions = actionsStr1;
          continue;
        case Action.STR2:
          tokenType = TokenType.STR;
          tokenPosition = ++position;

          // after quote
          actions = actionsStr2;
          continue;
        case Action.HASH:
          tokenPosition = ++position;

          // after hash
          tokenType = TokenType.HASH;
          actions = actionsIdent;
          continue;
        case Action.DOLLAR:
          tokenPosition = position++;
          tokenType = TokenType.DOLLAR;
          actions = actionsCheckEq;
          continue;
        case Action.PERCENT:
          tokenPosition = position++;
          tokenType = TokenType.PERCENT;
          break;
        case Action.AMP:
          tokenPosition = position++;
          tokenType = TokenType.DOLLAR;
          actions = actionsAmp;
          continue;
        case Action.O_PAR:
          tokenPosition = position++;
          tokenType = TokenType.O_PAR;
          break;
        case Action.C_PAR:
          tokenPosition = position++;
          tokenType = TokenType.C_PAR;
          break;
        case Action.STAR:
          tokenPosition = position++;
          tokenType = TokenType.STAR;
          actions = actionsCheckEq;
          continue;
        case Action.PLUS:
          tokenPosition = position++;
          tokenType = TokenType.PLUS;
          break;
        case Action.COMMA:
          tokenPosition = position++;
          tokenType = TokenType.COMMA;
          break;
        case Action.MINUS:
          tokenType = TokenType.MINUS;
          tokenPosition = position++;
          actions = actionsMinus;
          continue;
        case Action.DOT:
          tokenPosition = position++;
          actions = actionsNumOrClass;
          continue;
        case Action.TOCLASS:
          tokenPosition = position++;
          tokenType = TokenType.CLASS;
          actions = actionsIdent;
          continue;
        case Action.SLASH:
          tokenPosition = position++;
          tokenType = TokenType.SLASH;
          actions = actionsSlash;
          continue;
        case Action.COLON:
          tokenPosition = position++;
          tokenType = TokenType.COLON;
          actions = actionsColon;
          continue;
        case Action.COL_COL:
          position++;
          tokenType = TokenType.COL_COL;
          break;
        case Action.SEMICOL:
          tokenPosition = position++;
          tokenType = TokenType.SEMICOL;
          break;
        case Action.LT:
          tokenPosition = position++;
          tokenType = TokenType.LT;
          actions = actionsLt;
          continue;
        case Action.EQ:
          tokenPosition = position++;
          tokenType = TokenType.EQ;
          actions = actionsCheckEq;
          continue;
        case Action.GT:
          tokenPosition = position++;
          tokenType = TokenType.GT;
          actions = actionsCheckEq;
          continue;
        case Action.QMARK:
          tokenPosition = position++;
          tokenType = TokenType.QMARK;
          break;
        case Action.AT:
          tokenPosition = ++position;

          // after "at" sign
          tokenType = TokenType.AT;
          actions = actionsIdent;
          continue;
        case Action.O_BRK:
          tokenPosition = position++;
          tokenType = TokenType.O_BRK;
          break;
        case Action.C_BRK:
          tokenPosition = position++;
          tokenType = TokenType.C_BRK;
          break;
        case Action.O_BRC:
          tokenPosition = position++;
          tokenType = TokenType.O_BRC;
          break;
        case Action.C_BRC:
          tokenPosition = position++;
          tokenType = TokenType.C_BRC;
          break;
        case Action.BSLASH:
          tokenPosition = position++;
          backslashPos = tokenPosition;
          tokenType = TokenType.IDENT;
          actions = actionsIdentEscChr;
          continue;
        case Action.HAT:
          tokenPosition = position++;
          tokenType = TokenType.HAT;
          actions = actionsCheckEq;
          continue;
        case Action.BAR:
          tokenPosition = position++;
          tokenType = TokenType.BAR;
          actions = actionsBar;
          continue;
        case Action.TILDE:
          tokenPosition = position++;
          tokenType = TokenType.TILDE;
          actions = actionsCheckEq;
          continue;
        case Action.END:

          // don't consume current char
          break;
        case Action.EQTAIL:
          position++;
          tokenType =
              (tokenType + TokenType.BANG_EQ - TokenType.BANG as TokenType);
          break;
        case Action.ENDINT:

          // don't consume current char
          tokenType = TokenType.INT;
          tokenNum = parseInt(input.substring(tokenPosition, position), 10);
          break;
        case Action.ENDNUM:

          // don't consume current char
          tokenType = TokenType.NUM;
          tokenNum = parseFloat(input.substring(tokenPosition, position));
          break;
        case Action.CONT:

          // just consume current char
          position++;
          continue;
        case Action.UNIT:
          tokenType = TokenType.NUMERIC;
          tokenNum = parseFloat(input.substring(tokenPosition, position));
          tokenPosition = position++;
          actions = actionsIdent;
          continue;
        case Action.PCUNIT:
          tokenType = TokenType.NUMERIC;
          tokenNum = parseFloat(input.substring(tokenPosition, position));
          tokenText = '%';
          tokenPosition = position++;

          // for consistency with alphabetic units
          break;
        case Action.NUMBER:
          position++;
          actions = actionsNumber;
          continue;
        case Action.ENDIDNT:

          // don't consume current char
          // tokenType should be set already
          tokenText = input.substring(tokenPosition, position);
          break;
        case Action.IDNTESC:
          backslashPos = position++;
          actions = actionsIdentEscChr;
          continue;
        case Action.ENDIDES:

          // end of identifier with escapes
          // don't consume current char
          // tokenType should be set already
          tokenText = escapeParse(input.substring(tokenPosition, position));
          break;
        case Action.ENDSTR:
          tokenText = input.substring(tokenPosition, position);

          // consume closing quote
          position++;
          break;
        case Action.ENDESTR:
          tokenText = escapeParse(input.substring(tokenPosition, position));

          // consume closing quote
          position++;
          break;
        case Action.STR1ESC:
          backslashPos = position;
          position += 2;

          // consume character after backslash in any case
          actions = actionsStr1Esc;
          continue;
        case Action.STR2ESC:
          backslashPos = position;
          position += 2;

          // consume character after backslash in any case
          actions = actionsStr2Esc;
          continue;
        case Action.BAR_BAR:
          position++;
          tokenType = TokenType.BAR_BAR;
          break;
        case Action.AMP_AMP:
          position++;
          tokenType = TokenType.AMP_AMP;
          break;
        case Action.FUNC:

          // tokenType can be TokenType.IDENT,
          // TokenType.CLASS, TokenType.AT,
          // TokenType.HASH, TokenType.NUMERIC
          tokenText = input.substring(tokenPosition, position);
          if (tokenType == TokenType.IDENT) {
            position++;

            // consume
            if (tokenText.toLowerCase() == 'url') {
              actions = actionsURL;
              continue;
            }
            tokenType = TokenType.FUNC;
          }
          break;
        case Action.FUNCES:

          // tokenType can be TokenType.IDENT,
          // TokenType.CLASS, TokenType.AT,
          // TokenType.HASH, T_NUMERIC
          tokenText = escapeParse(input.substring(tokenPosition, position));
          if (tokenType == TokenType.IDENT) {
            position++;

            // consume
            if (tokenText.toLowerCase() == 'url') {
              actions = actionsURL;
              continue;
            }
            tokenType = TokenType.FUNC;
          }
          break;
        case Action.COMMENT:
          actions = actionsComment;
          position++;
          continue;
        case Action.COMMST:
          actions = actionsCommentStar;
          position++;
          continue;
        case Action.ENDNOTK:
          actions = actionsNormal;
          position++;
          continue;
        case Action.MINMIN:
          actions = actionsMinusMinus;
          position++;
          continue;
        case Action.TOINT:
          tokenType = TokenType.INT;
          actions = actionsInt;
          position++;
          continue;
        case Action.TONUM:
          tokenType = TokenType.NUM;
          actions = actionsNumber;
          position++;
          continue;
        case Action.TOIDENT:
          tokenType = TokenType.IDENT;
          actions = actionsIdent;
          position++;
          continue;
        case Action.TOIDES:
          tokenType = TokenType.IDENT;
          actions = actionsIdentEscChr;
          backslashPos = position++;
          continue;
        case Action.KILL1:
          position--;
          break;
        case Action.KILL2:
          position -= 2;
          break;
        case Action.URL:
          tokenPosition = position++;
          actions = actionsURLInside;
          continue;
        case Action.URL1:
          tokenPosition = ++position;

          // skip quote
          actions = actionsURLInside1;
          continue;
        case Action.URL2:
          tokenPosition = ++position;

          // skip quote
          actions = actionsURLInside2;
          continue;
        case Action.ENDURL:
          tokenType = TokenType.URL;
          tokenText = escapeParse(input.substring(tokenPosition, position));
          position++;

          // skip ')'
          break;
        case Action.FINURL:
          position++;

          // skip ')'
          break;
        case Action.LT_BG:
          actions = actionsLtBang;
          position++;
          continue;
        case Action.LT_BG_M:
          actions = actionsLtBangMinus;
          position++;
          continue;
        case Action.CHKSP:

          // newline in non-quoted URL - check if end of url
          if (position - backslashPos < 8) {
            // close enough: may be valid
            if (input.substring(backslashPos + 1, position + 1)
                    .match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])|[ \t]$/)) {
              // valid, keep going
              position++;
              continue;
            }
          }

        // end of url
        // fall through
        case Action.TERMURL:
          tokenType = TokenType.URL;
          tokenText = escapeParse(input.substring(tokenPosition, position));
          position++;

          // skip quote (or newline)
          actions = actionsURLTail;
          continue;
        case Action.CHKPOSN:

          // newline in string or quoted URL - check validity
          position++;
          if (position - backslashPos < 9) {
            // close enough: may be valid
            if (input.substring(backslashPos + 1, position)
                    .match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])$/)) {
              // valid, keep going
              continue;
            }
          }

          // invalid token
          tokenType = TokenType.INVALID;
          tokenText = 'E_CSS_UNEXPECTED_NEWLINE';
          actions = actionsNormal;
          break;
        case Action.CHKPOSS:

          // space in identifier - check validity
          if (position - backslashPos < 9) {
            // close enough: may be valid
            if (input.substring(backslashPos + 1, position + 1)
                    .match(/^[0-9a-fA-F]{0,6}[ \t]$/)) {
              // valid, keep going
              position++;
              continue;
            }
          }

          // end of identifier
          // don't consume current char
          // tokenType should be set already
          tokenText = escapeParse(input.substring(tokenPosition, position));
          break;
        case Action.URLESC:
          backslashPos = position++;
          continue;
        case Action.IDESCH:
          position++;
          actions = actionsIdentEsc;
          continue;
        default:

          // EOF
          if (actions !== actionsNormal) {
            tokenType = TokenType.INVALID;
            tokenText = 'E_CSS_UNEXPECTED_STATE';
            break;
          }
          tokenPosition = position;
          tokenType = TokenType.EOF;
      }
      token.type = tokenType;
      token.precededBySpace = seenSpace;
      token.num = tokenNum;
      token.text = tokenText;
      token.position = tokenPosition;
      tail++;
      if (tail >= head) {
        break;
      }
      actions = actionsNormal;
      seenSpace = false;
      token = buffer[tail & indexMask];
    }
    this.position = position;
    this.tail = tail & indexMask;
  }
}
