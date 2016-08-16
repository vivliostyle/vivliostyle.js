/**
 * Copyright 2013 Google, Inc.
 * @fileoverview CSS Tokenizer.
 */
goog.provide('adapt.csstok');

goog.require('adapt.base');

/**
 * @interface
 */
adapt.csstok.TokenizerHandler = function() {};

/**
 * @param {string} mnemonics
 * @param {adapt.csstok.Token} token
 * @return {void}
 */
adapt.csstok.TokenizerHandler.prototype.error = function(mnemonics, token) {};

/**
 * @param {string} str
 * @return {string}
 */
adapt.csstok.escapeParseSingle = function(str) {
    str = str.substr(1);
    if (str.match(/^[^0-9a-fA-F\n\r]$/))
        return str;
    var code = parseInt(str, 16);
    if (isNaN(code))
        return "";
    if (code <= 0xFFFF)
        return String.fromCharCode(code);
    if (code <= 0x10FFFF) {
        // non-BMP characters: convert to a surrogate pair
        return String.fromCharCode(0xD800 | ((code >> 10) & 0x3FF), 0xDC00 | (code & 0x3FF));
    }
    // not a valid Unicode value
    return "\uFFFD";
};

/**
 * @param {string} str
 * @return {string}
 */
adapt.csstok.escapeParse = function(str) {
    return str.replace(/\\([0-9a-fA-F]{0,6}(\r\n|[ \n\r\t\f])?|[^0-9a-fA-F\n\r])/g,
        adapt.csstok.escapeParseSingle);
};

/**
 * @enum {number}
 */
adapt.csstok.TokenType = {
    EOF: 0,
    IDENT: 1,
    STR: 2,
    NUMERIC: 3,
    NUM: 4,
    INT: 5,
    FUNC: 6,
    HASH: 7,
    URL: 8,
    CLASS: 9,
    O_PAR: 10,
    C_PAR: 11,
    O_BRC: 12,
    C_BRC: 13,
    O_BRK: 14,
    C_BRK: 15,
    COMMA: 16,
    SEMICOL: 17,
    COLON: 18,
    SLASH: 19,
    AT: 20,
    PERCENT: 21,
    QMARK: 22,
    PLUS: 23,
    MINUS: 24,
    BAR_BAR: 25,
    AMP_AMP: 26,
    // those can have "=" at the end
    BANG: 31,
    DOLLAR: 32,
    HAT: 33,
    BAR: 34,
    TILDE: 35,
    STAR: 36,
    GT: 37,
    LT: 38,
    EQ: 39,
    // tokens above plus "=" at the end, order must be the same
    BANG_EQ: 41,
    DOLLAR_EQ: 42,
    HAT_EQ: 43,
    BAR_EQ: 44,
    TILDE_EQ: 45,
    STAR_EQ: 46,
    GT_EQ: 47,
    LT_EQ: 48,
    EQ_EQ: 49,
    COL_COL: 50,
    INVALID: 51,
    LAST: 51
};

/**
 * @constructor
 */
adapt.csstok.Token = function() {
    /** @type {adapt.csstok.TokenType} */ this.type = adapt.csstok.TokenType.EOF;
    /** @type {boolean} */ this.precededBySpace = false;
    /** @type {number} */ this.num = 0;
    /** @type {string} */ this.text = "";
    /** @type {number} */ this.position = 0;
};

/**
 * @enum {number}
 */
adapt.csstok.Action = {
    SPACE: 1,
    INT: 2,
    IDENT: 3,
    BANG: 4,
    HASH: 6,
    DOLLAR: 7,
    PERCENT: 8,
    AMP: 9,
    O_PAR: 10,
    C_PAR: 11,
    STAR: 12,
    PLUS: 13,
    COMMA: 14,
    MINUS: 15,
    DOT: 16,
    SLASH: 17,
    COLON: 18,
    SEMICOL: 19,
    LT: 20,
    EQ: 21,
    GT: 22,
    QMARK: 23,
    AT: 24,
    O_BRK: 25,
    C_BRK: 26,
    O_BRC: 27,
    C_BRC: 28,
    BSLASH: 29,
    HAT: 30,
    BAR: 31,
    TILDE: 32,
    STR1: 33,
    STR2: 34,
    END: 35,
    EQTAIL: 36,
    ENDINT: 37,
    ENDNUM: 38,
    CONT: 39,
    UNIT: 40,
    PCUNIT: 41,
    NUMBER: 42,
    ENDIDNT: 43,
    IDNTESC: 44,
    ENDIDES: 45, // end of identifier with escapes
    ENDSTR: 46,
    ENDESTR: 47, // end of string with escapes
    STR1ESC: 48,
    STR2ESC: 49,
    BAR_BAR: 50,
    AMP_AMP: 51,
    FUNC: 52,
    FUNCES: 53,
    COMMENT: 54,
    COMMST: 55,
    ENDNOTK: 56,
    MINMIN: 57,
    TOINT: 58,
    TONUM: 59,
    TOIDENT: 60,
    TOIDES: 61,
    KILL1: 62,
    KILL2: 63,
    URL: 64,
    URL1: 65,
    URL2: 66,
    ENDURL: 67,
    TERMURL: 68,
    FINURL: 69,
    LT_BG: 70,
    LT_BG_M: 71,
    INVALID: 72,
    CHKPOSS: 73,
    CHKPOSN: 74,
    URLESC: 75,
    IDESCH: 76,
    COL_COL: 77,
    TOCLASS: 78,
    CHKSP: 79,
    EOF: 80
};

/**
 * @param {adapt.csstok.Action} def
 * @param {Array.<adapt.csstok.Action>} spec
 * @return {Array.<adapt.csstok.Action>}
 */
adapt.csstok.makeActions = function(def, spec) {
    /** @type {Array.<number>} */ var a = Array(128);
    /** @type {number} */ var i;
    for (i = 0; i < 128; i++) {
        a[i] = def;
    }
    a[NaN] = def == adapt.csstok.Action.END ?
        adapt.csstok.Action.END : adapt.csstok.Action.INVALID;
    for (i = 0; i < spec.length; i += 2) {
        a[spec[i]] = spec[i + 1];
    }
    return a;
};

/**
 * Start of the token.
 * @type {Array.<adapt.csstok.Action>}
 * @const
 */
adapt.csstok.actionsNormal = [
    adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, // 0x00-0x07
    adapt.csstok.Action.INVALID, adapt.csstok.Action.SPACE,   adapt.csstok.Action.SPACE,   adapt.csstok.Action.INVALID, adapt.csstok.Action.SPACE,   adapt.csstok.Action.SPACE,   adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, // 0x08-0x0F
    adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, // 0x10-0x17
    adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, // 0x18-0x1F
    adapt.csstok.Action.SPACE,   adapt.csstok.Action.BANG,    adapt.csstok.Action.STR2,    adapt.csstok.Action.HASH,    adapt.csstok.Action.DOLLAR,  adapt.csstok.Action.PERCENT, adapt.csstok.Action.AMP,     adapt.csstok.Action.STR1,    // 0x20-0x27
    adapt.csstok.Action.O_PAR,   adapt.csstok.Action.C_PAR,   adapt.csstok.Action.STAR,    adapt.csstok.Action.PLUS,    adapt.csstok.Action.COMMA,   adapt.csstok.Action.MINUS,   adapt.csstok.Action.DOT,     adapt.csstok.Action.SLASH,   // 0x28-0x2F
    adapt.csstok.Action.INT,     adapt.csstok.Action.INT,     adapt.csstok.Action.INT,     adapt.csstok.Action.INT,     adapt.csstok.Action.INT,     adapt.csstok.Action.INT,     adapt.csstok.Action.INT,     adapt.csstok.Action.INT,     // 0x30-0x37
    adapt.csstok.Action.INT,     adapt.csstok.Action.INT,     adapt.csstok.Action.COLON,   adapt.csstok.Action.SEMICOL, adapt.csstok.Action.LT,      adapt.csstok.Action.EQ,      adapt.csstok.Action.GT,      adapt.csstok.Action.QMARK,   // 0x38-0x3F
    adapt.csstok.Action.AT,      adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   // 0x40-0x47
    adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   // 0x48-0x4F
    adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   // 0x50-0x57
    adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   adapt.csstok.Action.O_BRK,   adapt.csstok.Action.BSLASH,  adapt.csstok.Action.C_BRK,   adapt.csstok.Action.HAT,     adapt.csstok.Action.IDENT,   // 0x58-0x5F
    adapt.csstok.Action.INVALID, adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   // 0x60-0x67
    adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   // 0x68-0x6F
    adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   // 0x70-0x77
    adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   adapt.csstok.Action.IDENT,   adapt.csstok.Action.O_BRC,   adapt.csstok.Action.BAR,     adapt.csstok.Action.C_BRC,   adapt.csstok.Action.TILDE,   adapt.csstok.Action.INVALID  // 0x78-0x7F
];
adapt.csstok.actionsNormal[NaN] = adapt.csstok.Action.EOF;

/**
 * Inside identifier.
 * @type {Array.<adapt.csstok.Action>}
 * @const
 */
adapt.csstok.actionsIdent = [
    adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, // 0x00-0x07
    adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, // 0x08-0x0F
    adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, // 0x10-0x17
    adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, // 0x18-0x1F
    adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, // 0x20-0x27
    adapt.csstok.Action.FUNC,    adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.CONT,    adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, // 0x28-0x2F
    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    // 0x30-0x37
    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, // 0x38-0x3F
    adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    // 0x40-0x47
    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    // 0x48-0x4F
    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    // 0x50-0x57
    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.IDNTESC, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.CONT,    // 0x58-0x5F
    adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    // 0x60-0x67
    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    // 0x68-0x6F
    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    // 0x70-0x77
    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT, adapt.csstok.Action.ENDIDNT  // 0x78-0x7F
];
adapt.csstok.actionsIdent[NaN] = adapt.csstok.Action.ENDIDNT;

/**
 * After dot (either .class or .123)
 * @type {Array.<adapt.csstok.Action>}
 * @const
 */
adapt.csstok.actionsNumOrClass = [
    adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, // 0x00-0x07
    adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, // 0x08-0x0F
    adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, // 0x10-0x17
    adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, // 0x18-0x1F
    adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, // 0x20-0x27
    adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TONUM,   adapt.csstok.Action.INVALID, // 0x28-0x2F
    adapt.csstok.Action.TONUM,   adapt.csstok.Action.TONUM,   adapt.csstok.Action.TONUM,   adapt.csstok.Action.TONUM,   adapt.csstok.Action.TONUM,   adapt.csstok.Action.TONUM,   adapt.csstok.Action.TONUM,   adapt.csstok.Action.TONUM,   // 0x30-0x37
    adapt.csstok.Action.TONUM,   adapt.csstok.Action.TONUM,   adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, // 0x38-0x3F
    adapt.csstok.Action.INVALID, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, // 0x40-0x47
    adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, // 0x48-0x4F
    adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, // 0x50-0x57
    adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.INVALID, adapt.csstok.Action.TOIDES,  adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.TOCLASS, // 0x58-0x5F
    adapt.csstok.Action.INVALID, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, // 0x60-0x67
    adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, // 0x68-0x6F
    adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, // 0x70-0x77
    adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.TOCLASS, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID, adapt.csstok.Action.INVALID  // 0x78-0x7F
];
adapt.csstok.actionsIdent[NaN] = adapt.csstok.Action.ENDIDNT;

/**
 * after '-'
 * @type {Array.<adapt.csstok.Action>}
 * @const
 */
adapt.csstok.actionsMinus = [
    adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     // 0x00-0x07
    adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     // 0x08-0x0F
    adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     // 0x10-0x17
    adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     // 0x18-0x1F
    adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     // 0x20-0x27
    adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.MINMIN,  adapt.csstok.Action.TONUM,   adapt.csstok.Action.END,     // 0x28-0x2F
    adapt.csstok.Action.TOINT,   adapt.csstok.Action.TOINT,   adapt.csstok.Action.TOINT,   adapt.csstok.Action.TOINT,   adapt.csstok.Action.TOINT,   adapt.csstok.Action.TOINT,   adapt.csstok.Action.TOINT,   adapt.csstok.Action.TOINT,   // 0x30-0x37
    adapt.csstok.Action.TOINT,   adapt.csstok.Action.TOINT,   adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     // 0x38-0x3F
    adapt.csstok.Action.END,     adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, // 0x40-0x47
    adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, // 0x48-0x4F
    adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, // 0x50-0x57
    adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, adapt.csstok.Action.END,     adapt.csstok.Action.TOIDES,  adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.TOIDENT, // 0x58-0x5F
    adapt.csstok.Action.END,     adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, // 0x60-0x67
    adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, // 0x68-0x6F
    adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, // 0x70-0x77
    adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, adapt.csstok.Action.TOIDENT, adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END,     adapt.csstok.Action.END      // 0x78-0x7F
];
adapt.csstok.actionsMinus[NaN] = adapt.csstok.Action.END;

/**
 * Inside identifier with escape sequence
 * @type {Array.<adapt.csstok.Action>}
 * @const
 */
adapt.csstok.actionsIdentEsc = [
    adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, // 0x00-0x07
    adapt.csstok.Action.ENDIDES, adapt.csstok.Action.CHKPOSS, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, // 0x08-0x0F
    adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, // 0x10-0x17
    adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, // 0x18-0x1F
    adapt.csstok.Action.CHKPOSS, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, // 0x20-0x27
    adapt.csstok.Action.FUNCES,  adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, // 0x28-0x2F
    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    // 0x30-0x37
    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, // 0x38-0x3F
    adapt.csstok.Action.ENDIDES, adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    // 0x40-0x47
    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    // 0x48-0x4F
    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    // 0x50-0x57
    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.ENDIDES, adapt.csstok.Action.IDNTESC, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.CONT,    // 0x58-0x5F
    adapt.csstok.Action.ENDIDES, adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    // 0x60-0x67
    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    // 0x68-0x6F
    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    // 0x70-0x77
    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES, adapt.csstok.Action.ENDIDES  // 0x78-0x7F
];
adapt.csstok.actionsIdentEsc[NaN] = adapt.csstok.Action.ENDIDES;

/**
 * Inside integer
 * @type {Array.<adapt.csstok.Action>}
 * @const
 */
adapt.csstok.actionsInt = [
    adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  // 0x00-0x07
    adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  // 0x08-0x0F
    adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  // 0x10-0x17
    adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  // 0x18-0x1F
    adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.PCUNIT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  // 0x20-0x27
    adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.NUMBER,  adapt.csstok.Action.ENDINT,  // 0x28-0x2F
    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    // 0x30-0x37
    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  // 0x38-0x3F
    adapt.csstok.Action.ENDINT,  adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    // 0x40-0x47
    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    // 0x48-0x4F
    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    // 0x50-0x57
    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.UNIT,    // 0x58-0x5F
    adapt.csstok.Action.ENDINT,  adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    // 0x60-0x67
    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    // 0x68-0x6F
    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    // 0x70-0x77
    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT,  adapt.csstok.Action.ENDINT   // 0x78-0x7F
];
adapt.csstok.actionsInt[NaN] = adapt.csstok.Action.ENDINT;

/**
 * inside real, after dot
 * @type {Array.<adapt.csstok.Action>}
 * @const
 */
adapt.csstok.actionsNumber = [
    adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  // 0x00-0x07
    adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  // 0x08-0x0F
    adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  // 0x10-0x17
    adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  // 0x18-0x1F
    adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.PCUNIT,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  // 0x20-0x27
    adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  // 0x28-0x2F
    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    // 0x30-0x37
    adapt.csstok.Action.CONT,    adapt.csstok.Action.CONT,    adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  // 0x38-0x3F
    adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    // 0x40-0x47
    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    // 0x48-0x4F
    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    // 0x50-0x57
    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.UNIT,    // 0x58-0x5F
    adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    // 0x60-0x67
    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    // 0x68-0x6F
    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    // 0x70-0x77
    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.UNIT,    adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM,  adapt.csstok.Action.ENDNUM   // 0x78-0x7F
];
adapt.csstok.actionsNumber[NaN] = adapt.csstok.Action.ENDNUM;

/**
 * @type {Array.<adapt.csstok.Action>}
 * @const
 */
adapt.csstok.actionsCheckEq = adapt.csstok.makeActions(adapt.csstok.Action.END, [61/*=*/, adapt.csstok.Action.EQTAIL]);

/**
 * @type {Array.<adapt.csstok.Action>}
 * @const
 */
adapt.csstok.actionsColon = adapt.csstok.makeActions(adapt.csstok.Action.END, [58/*:*/, adapt.csstok.Action.COL_COL]);

/**
 * @type {Array.<adapt.csstok.Action>}
 * @const
 */
adapt.csstok.actionsBar = adapt.csstok.makeActions(adapt.csstok.Action.END, [61/*=*/, adapt.csstok.Action.EQTAIL, 124 /*|*/, adapt.csstok.Action.BAR_BAR]);

/**
 * @type {Array.<adapt.csstok.Action>}
 * @const
 */
adapt.csstok.actionsAmp = adapt.csstok.makeActions(adapt.csstok.Action.END, [38 /*&*/, adapt.csstok.Action.AMP_AMP]);

/**
 * @type {Array.<adapt.csstok.Action>}
 * @const
 */
adapt.csstok.actionsSlash = adapt.csstok.makeActions(adapt.csstok.Action.END, [42/* * */, adapt.csstok.Action.COMMENT]);

/**
 * @type {Array.<adapt.csstok.Action>}
 * @const
 */
adapt.csstok.actionsComment = adapt.csstok.makeActions(adapt.csstok.Action.CONT, [42 /* * */, adapt.csstok.Action.COMMST]);

/**
 * @type {Array.<adapt.csstok.Action>}
 * @const
 */
adapt.csstok.actionsCommentStar = adapt.csstok.makeActions(adapt.csstok.Action.COMMENT, [42 /* * */, adapt.csstok.Action.COMMST, 47 /* / */, adapt.csstok.Action.ENDNOTK]);

/**
 * @type {Array.<adapt.csstok.Action>}
 * @const
 */
adapt.csstok.actionsMinusMinus = adapt.csstok.makeActions(adapt.csstok.Action.KILL1, [62 /* > */, adapt.csstok.Action.ENDNOTK]);

/**
 * @type {Array.<adapt.csstok.Action>}
 * @const
 */
adapt.csstok.actionsLt = adapt.csstok.makeActions(adapt.csstok.Action.END, [61/*=*/, adapt.csstok.Action.EQTAIL, 33 /*!*/, adapt.csstok.Action.LT_BG]);

/**
 * @type {Array.<adapt.csstok.Action>}
 * @const
 */
adapt.csstok.actionsLtBang = adapt.csstok.makeActions(adapt.csstok.Action.KILL1, [45 /*-*/, adapt.csstok.Action.LT_BG_M]);

/**
 * @type {Array.<adapt.csstok.Action>}
 * @const
 */
adapt.csstok.actionsLtBangMinus = adapt.csstok.makeActions(adapt.csstok.Action.KILL2, [45 /*-*/, adapt.csstok.Action.ENDNOTK]);

/**
 * @type {Array.<adapt.csstok.Action>}
 * @const
 */
adapt.csstok.actionsIdentEscChr = adapt.csstok.makeActions(adapt.csstok.Action.IDESCH, [9/*tab*/, adapt.csstok.Action.INVALID, 10/*LF*/, adapt.csstok.Action.INVALID, 13/*CR*/, adapt.csstok.Action.INVALID, 32/*sp*/, adapt.csstok.Action.INVALID]);

/**
 * @type {Array.<adapt.csstok.Action>}
 * @const
 */
adapt.csstok.actionsStr1 = adapt.csstok.makeActions(adapt.csstok.Action.CONT, [39/*'*/, adapt.csstok.Action.ENDSTR, 10/*LF*/, adapt.csstok.Action.INVALID, 13/*CR*/, adapt.csstok.Action.INVALID, 92/*\*/, adapt.csstok.Action.STR1ESC]);

/**
 * @type {Array.<adapt.csstok.Action>}
 * @const
 */
adapt.csstok.actionsStr2 = adapt.csstok.makeActions(adapt.csstok.Action.CONT, [34/*"*/, adapt.csstok.Action.ENDSTR, 10/*LF*/, adapt.csstok.Action.INVALID, 13/*CR*/, adapt.csstok.Action.INVALID, 92/*\*/, adapt.csstok.Action.STR2ESC]);

/**
 * @type {Array.<adapt.csstok.Action>}
 * @const
 */
adapt.csstok.actionsStr1Esc = adapt.csstok.makeActions(adapt.csstok.Action.CONT, [39/*'*/, adapt.csstok.Action.ENDESTR, 10/*LF*/, adapt.csstok.Action.CHKPOSN, 13/*CR*/, adapt.csstok.Action.CHKPOSN, 92/*\*/, adapt.csstok.Action.STR1ESC]);

/**
 * @type {Array.<adapt.csstok.Action>}
 * @const
 */
adapt.csstok.actionsStr2Esc = adapt.csstok.makeActions(adapt.csstok.Action.CONT, [34/*"*/, adapt.csstok.Action.ENDESTR, 10/*LF*/, adapt.csstok.Action.CHKPOSN, 13/*CR*/, adapt.csstok.Action.CHKPOSN, 92/*\*/, adapt.csstok.Action.STR2ESC]);

/**
 * @type {Array.<adapt.csstok.Action>}
 * @const
 */
adapt.csstok.actionsURL = adapt.csstok.makeActions(adapt.csstok.Action.URL, [9/*tab*/, adapt.csstok.Action.CONT, 32/*sp*/, adapt.csstok.Action.CONT, 34/*"*/, adapt.csstok.Action.URL2, 39/*'*/, adapt.csstok.Action.URL1, 41/*)*/, adapt.csstok.Action.INVALID, 10/*LF*/, adapt.csstok.Action.CONT, 13/*CR*/, adapt.csstok.Action.CONT]);

/**
 * @type {Array.<adapt.csstok.Action>}
 * @const
 */
adapt.csstok.actionsURLInside = adapt.csstok.makeActions(adapt.csstok.Action.CONT, [41/*)*/, adapt.csstok.Action.ENDURL, 9/*TAB*/, adapt.csstok.Action.CHKSP, 10/*LF*/, adapt.csstok.Action.CHKSP, 13/*CR*/, adapt.csstok.Action.CHKSP, 32/*sp*/, adapt.csstok.Action.CHKSP, 92/*\*/, adapt.csstok.Action.URLESC,
    40/*(*/, adapt.csstok.Action.INVALID, 91/*[*/, adapt.csstok.Action.INVALID,  93/*]*/, adapt.csstok.Action.INVALID, 123/*{*/, adapt.csstok.Action.INVALID, 125/*}*/, adapt.csstok.Action.INVALID,
    NaN, adapt.csstok.Action.ENDURL]);

/**
 * @type {Array.<adapt.csstok.Action>}
 * @const
 */
adapt.csstok.actionsURLInside1 = adapt.csstok.makeActions(adapt.csstok.Action.CONT, [39/*'*/, adapt.csstok.Action.TERMURL, 10/*LF*/, adapt.csstok.Action.CHKPOSN, 13/*CR*/, adapt.csstok.Action.CHKPOSN, 92/*\*/, adapt.csstok.Action.URLESC, NaN, adapt.csstok.Action.ENDURL]);

/**
 * @type {Array.<adapt.csstok.Action>}
 * @const
 */
adapt.csstok.actionsURLInside2 = adapt.csstok.makeActions(adapt.csstok.Action.CONT, [34/*"*/, adapt.csstok.Action.TERMURL, 10/*LF*/, adapt.csstok.Action.CHKPOSN, 13/*CR*/, adapt.csstok.Action.CHKPOSN, 92/*\*/, adapt.csstok.Action.URLESC, NaN, adapt.csstok.Action.ENDURL]);

/**
 * @type {Array.<adapt.csstok.Action>}
 * @const
 */
adapt.csstok.actionsURLTail = adapt.csstok.makeActions(adapt.csstok.Action.INVALID, [9/*tab*/, adapt.csstok.Action.CONT, 10/*LF*/, adapt.csstok.Action.CONT, 13/*CR*/, adapt.csstok.Action.CONT, 32/*sp*/, adapt.csstok.Action.CONT, 41/*)*/, adapt.csstok.Action.FINURL]);

/**
 * @const
 */
adapt.csstok.INITIAL_INDEX_MASK = 0xF;

/**
 * @constructor
 * @param {string} input
 * @param {adapt.csstok.TokenizerHandler} handler
 */
adapt.csstok.Tokenizer = function(input, handler) {
    /** @const */ this.handler = handler;
    /** @type {number} */ this.indexMask = adapt.csstok.INITIAL_INDEX_MASK;
    /** @type {string} */ this.input = input;
    /** @type {Array.<adapt.csstok.Token>} */ this.buffer = Array(this.indexMask + 1);
    /** @type {number} */ this.head = -1; // saved, occupied if >= 0
    /** @type {number} */ this.tail = 0; // available, ready to write
    /** @type {number} */ this.curr = 0; // ready to read
    /** @type {number} */ this.position = 0;
    for (var i = 0; i <= this.indexMask; i++)
        this.buffer[i] = new adapt.csstok.Token();
};

/**
 * @return {adapt.csstok.Token}
 */
adapt.csstok.Tokenizer.prototype.token = function() {
    if (this.tail == this.curr)
        this.fillBuffer();
    return this.buffer[this.curr];
};

/**
 * @param {number} n
 * @return {adapt.csstok.Token}
 */
adapt.csstok.Tokenizer.prototype.nthToken = function(n) {
    if (((this.tail - this.curr) & this.indexMask) <= n)
        this.fillBuffer();
    return this.buffer[(this.curr + n) & this.indexMask];
};

/**
 * @return {void}
 */
adapt.csstok.Tokenizer.prototype.consume = function() {
    this.curr = (this.curr + 1) & this.indexMask;
};

/**
 * @return {void}
 */
adapt.csstok.Tokenizer.prototype.mark = function() {
    if (this.head >= 0)
        throw new Error("F_CSSTOK_BAD_CALL mark");
    this.head = this.curr;
};

/**
 * @return {void}
 */
adapt.csstok.Tokenizer.prototype.reset = function() {
    if (this.head < 0)
        throw new Error("F_CSSTOK_BAD_CALL reset");
    this.curr = this.head;
    this.head = -1;
};

/**
 * @return {void}
 */
adapt.csstok.Tokenizer.prototype.unmark = function() {
    this.head = -1;
};

/**
 * @return {boolean}
 */
adapt.csstok.Tokenizer.prototype.hasMark = function() {
    return this.head >= 0;
};

/**
 * @private
 * @return {void}
 */
adapt.csstok.Tokenizer.prototype.reallocate = function() {
    var newIndexMask = 2 * (this.indexMask + 1) - 1;
    /** @type {Array.<adapt.csstok.Token>} */ var newBuffer = Array(newIndexMask + 1);
    var oldIndex = this.head;
    var newIndex = 0;
    while (oldIndex != this.tail) {
        newBuffer[newIndex] = this.buffer[oldIndex];
        if (oldIndex == this.curr)
            this.curr = newIndex;
        oldIndex = (oldIndex + 1) & this.indexMask;
        newIndex++;
    }
    this.head = 0;
    this.tail = newIndex;
    this.indexMask = newIndexMask;
    this.buffer = newBuffer;
    while (newIndex <= newIndexMask) {
        newBuffer[newIndex++] = new adapt.csstok.Token();
    }
};

/**
 * @private
 */
adapt.csstok.Tokenizer.prototype.error = function(position, token, mnemonics) {
    if (this.handler) {
        this.handler.error(mnemonics, token);
    }
};

/**
 * @private
 * @return {void}
 */
adapt.csstok.Tokenizer.prototype.fillBuffer = function() {
    var tail = this.tail;
    var head = this.head >= 0 ? this.head : this.curr;
    var indexMask = this.indexMask;
    if (tail >= head)
        head += indexMask;
    else
        head--;
    if (head == tail) {
        // only expect to get here when mark is in effect
        if (this.head < 0)
            throw new Error("F_CSSTOK_INTERNAL");
        this.reallocate();
        tail = this.tail;
        indexMask = this.indexMask;
        head = indexMask; // this.head is zero
    }
    var actions = adapt.csstok.actionsNormal;
    var input = this.input;
    var position = this.position;
    var buffer = this.buffer;
    /** @type {adapt.csstok.TokenType} */ var tokenType = adapt.csstok.TokenType.EOF;
    /** @type {number} */ var tokenPosition = 0;
    /** @type {string} */ var tokenText = "";
    /** @type {number} */ var tokenNum = 0;
    var seenSpace = false;
    /** @type {adapt.csstok.Token} */ var token = buffer[tail];
    var backslashPos = -9; // far enough before the start of the string
    while (true) {
        var charCode = input.charCodeAt(position);
        switch (actions[charCode] || actions[65/*A*/]) {
            case adapt.csstok.Action.INVALID:
                tokenType = adapt.csstok.TokenType.INVALID;
                if (isNaN(charCode)) {
                    tokenText = "E_CSS_UNEXPECTED_EOF";
                } else {
                    tokenText = "E_CSS_UNEXPECTED_CHAR";
                }
                actions = adapt.csstok.actionsNormal;
                position++;
                break;
            case adapt.csstok.Action.SPACE:
                position++;
                seenSpace = true;
                continue;
            case adapt.csstok.Action.INT:
                tokenPosition = position++;
                actions = adapt.csstok.actionsInt;
                continue;
            case adapt.csstok.Action.IDENT:
                tokenType = adapt.csstok.TokenType.IDENT;
                tokenPosition = position++;
                actions = adapt.csstok.actionsIdent;
                continue;
            case adapt.csstok.Action.BANG:
                tokenPosition = position++;
                tokenType = adapt.csstok.TokenType.BANG;
                actions = adapt.csstok.actionsCheckEq;
                continue;
            case adapt.csstok.Action.STR1:
                tokenType = adapt.csstok.TokenType.STR;
                tokenPosition = ++position; // after quote
                actions = adapt.csstok.actionsStr1;
                continue;
            case adapt.csstok.Action.STR2:
                tokenType = adapt.csstok.TokenType.STR;
                tokenPosition = ++position; // after quote
                actions = adapt.csstok.actionsStr2;
                continue;
            case adapt.csstok.Action.HASH:
                tokenPosition = ++position; // after hash
                tokenType = adapt.csstok.TokenType.HASH;
                actions = adapt.csstok.actionsIdent;
                continue;
            case adapt.csstok.Action.DOLLAR:
                tokenPosition = position++;
                tokenType = adapt.csstok.TokenType.DOLLAR;
                actions = adapt.csstok.actionsCheckEq;
                continue;
            case adapt.csstok.Action.PERCENT:
                tokenPosition = position++;
                tokenType = adapt.csstok.TokenType.PERCENT;
                break;
            case adapt.csstok.Action.AMP:
                tokenPosition = position++;
                tokenType = adapt.csstok.TokenType.DOLLAR;
                actions = adapt.csstok.actionsAmp;
                continue;
            case adapt.csstok.Action.O_PAR:
                tokenPosition = position++;
                tokenType = adapt.csstok.TokenType.O_PAR;
                break;
            case adapt.csstok.Action.C_PAR:
                tokenPosition = position++;
                tokenType = adapt.csstok.TokenType.C_PAR;
                break;
            case adapt.csstok.Action.STAR:
                tokenPosition = position++;
                tokenType = adapt.csstok.TokenType.STAR;
                actions = adapt.csstok.actionsCheckEq;
                continue;
            case adapt.csstok.Action.PLUS:
                tokenPosition = position++;
                tokenType = adapt.csstok.TokenType.PLUS;
                break;
            case adapt.csstok.Action.COMMA:
                tokenPosition = position++;
                tokenType = adapt.csstok.TokenType.COMMA;
                break;
            case adapt.csstok.Action.MINUS:
                tokenType = adapt.csstok.TokenType.MINUS;
                tokenPosition = position++;
                actions = adapt.csstok.actionsMinus;
                continue;
            case adapt.csstok.Action.DOT:
                tokenPosition = position++;
                actions = adapt.csstok.actionsNumOrClass;
                continue;
            case adapt.csstok.Action.TOCLASS:
                tokenPosition = position++;
                tokenType = adapt.csstok.TokenType.CLASS;
                actions = adapt.csstok.actionsIdent;
                continue;
            case adapt.csstok.Action.SLASH:
                tokenPosition = position++;
                tokenType = adapt.csstok.TokenType.SLASH;
                actions = adapt.csstok.actionsSlash;
                continue;
            case adapt.csstok.Action.COLON:
                tokenPosition = position++;
                tokenType = adapt.csstok.TokenType.COLON;
                actions = adapt.csstok.actionsColon;
                continue;
            case adapt.csstok.Action.COL_COL:
                position++;
                tokenType = adapt.csstok.TokenType.COL_COL;
                break;
            case adapt.csstok.Action.SEMICOL:
                tokenPosition = position++;
                tokenType = adapt.csstok.TokenType.SEMICOL;
                break;
            case adapt.csstok.Action.LT:
                tokenPosition = position++;
                tokenType = adapt.csstok.TokenType.LT;
                actions = adapt.csstok.actionsLt;
                continue;
            case adapt.csstok.Action.EQ:
                tokenPosition = position++;
                tokenType = adapt.csstok.TokenType.EQ;
                actions = adapt.csstok.actionsCheckEq;
                continue;
            case adapt.csstok.Action.GT:
                tokenPosition = position++;
                tokenType = adapt.csstok.TokenType.GT;
                actions = adapt.csstok.actionsCheckEq;
                continue;
            case adapt.csstok.Action.QMARK:
                tokenPosition = position++;
                tokenType = adapt.csstok.TokenType.QMARK;
                break;
            case adapt.csstok.Action.AT:
                tokenPosition = ++position; // after "at" sign
                tokenType = adapt.csstok.TokenType.AT;
                actions = adapt.csstok.actionsIdent;
                continue;
            case adapt.csstok.Action.O_BRK:
                tokenPosition = position++;
                tokenType = adapt.csstok.TokenType.O_BRK;
                break;
            case adapt.csstok.Action.C_BRK:
                tokenPosition = position++;
                tokenType = adapt.csstok.TokenType.C_BRK;
                break;
            case adapt.csstok.Action.O_BRC:
                tokenPosition = position++;
                tokenType = adapt.csstok.TokenType.O_BRC;
                break;
            case adapt.csstok.Action.C_BRC:
                tokenPosition = position++;
                tokenType = adapt.csstok.TokenType.C_BRC;
                break;
            case adapt.csstok.Action.BSLASH:
                tokenPosition = position++;
                backslashPos = tokenPosition;
                tokenType = adapt.csstok.TokenType.IDENT;
                actions = adapt.csstok.actionsIdentEscChr;
                continue;
            case adapt.csstok.Action.HAT:
                tokenPosition = position++;
                tokenType = adapt.csstok.TokenType.HAT;
                actions = adapt.csstok.actionsCheckEq;
                continue;
            case adapt.csstok.Action.BAR:
                tokenPosition = position++;
                tokenType = adapt.csstok.TokenType.BAR;
                actions = adapt.csstok.actionsBar;
                continue;
            case adapt.csstok.Action.TILDE:
                tokenPosition = position++;
                tokenType = adapt.csstok.TokenType.TILDE;
                actions = adapt.csstok.actionsCheckEq;
                continue;
            case adapt.csstok.Action.END:
                // don't consume current char
                break;
            case adapt.csstok.Action.EQTAIL:
                position++;
                tokenType = /** @type {adapt.csstok.TokenType} */ (tokenType + adapt.csstok.TokenType.BANG_EQ - adapt.csstok.TokenType.BANG);
                break;
            case adapt.csstok.Action.ENDINT:
                // don't consume current char
                tokenType = adapt.csstok.TokenType.INT;
                tokenNum = parseInt(input.substring(tokenPosition, position), 10);
                break;
            case adapt.csstok.Action.ENDNUM:
                // don't consume current char
                tokenType = adapt.csstok.TokenType.NUM;
                tokenNum = parseFloat(input.substring(tokenPosition, position));
                break;
            case adapt.csstok.Action.CONT:
                // just consume current char
                position++;
                continue;
            case adapt.csstok.Action.UNIT:
                tokenType = adapt.csstok.TokenType.NUMERIC;
                tokenNum = parseFloat(input.substring(tokenPosition, position));
                tokenPosition = position++;
                actions = adapt.csstok.actionsIdent;
                continue;
            case adapt.csstok.Action.PCUNIT:
                tokenType = adapt.csstok.TokenType.NUMERIC;
                tokenNum = parseFloat(input.substring(tokenPosition, position));
                tokenText = "%";
                tokenPosition = position++; // for consistency with alphabetic units
                break;
            case adapt.csstok.Action.NUMBER:
                position++;
                actions = adapt.csstok.actionsNumber;
                continue;
            case adapt.csstok.Action.ENDIDNT:
                // don't consume current char
                // tokenType should be set already
                tokenText = input.substring(tokenPosition, position);
                break;
            case adapt.csstok.Action.IDNTESC:
                backslashPos = position++;
                actions = adapt.csstok.actionsIdentEscChr;
                continue;
            case adapt.csstok.Action.ENDIDES: // end of identifier with escapes
                // don't consume current char
                // tokenType should be set already
                tokenText = adapt.csstok.escapeParse(input.substring(tokenPosition, position));
                break;
            case adapt.csstok.Action.ENDSTR:
                tokenText = input.substring(tokenPosition, position);
                // consume closing quote
                position++;
                break;
            case adapt.csstok.Action.ENDESTR:
                tokenText = adapt.csstok.escapeParse(input.substring(tokenPosition, position));
                // consume closing quote
                position++;
                break;
            case adapt.csstok.Action.STR1ESC:
                backslashPos = position;
                position += 2; // consume character after backslash in any case
                actions = adapt.csstok.actionsStr1Esc;
                continue;
            case adapt.csstok.Action.STR2ESC:
                backslashPos = position;
                position += 2; // consume character after backslash in any case
                actions = adapt.csstok.actionsStr2Esc;
                continue;
            case adapt.csstok.Action.BAR_BAR:
                position++;
                tokenType = adapt.csstok.TokenType.BAR_BAR;
                break;
            case adapt.csstok.Action.AMP_AMP:
                position++;
                tokenType = adapt.csstok.TokenType.AMP_AMP;
                break;
            case adapt.csstok.Action.FUNC:
                // tokenType can be adapt.csstok.TokenType.IDENT, adapt.csstok.TokenType.CLASS, adapt.csstok.TokenType.AT, adapt.csstok.TokenType.HASH, adapt.csstok.TokenType.NUMERIC
                tokenText = input.substring(tokenPosition, position);
                if (tokenType == adapt.csstok.TokenType.IDENT) {
                    position++; // consume
                    if (tokenText.toLowerCase() == "url") {
                        actions = adapt.csstok.actionsURL;
                        continue;
                    }
                    tokenType = adapt.csstok.TokenType.FUNC;
                }
                break;
            case adapt.csstok.Action.FUNCES:
                // tokenType can be adapt.csstok.TokenType.IDENT, adapt.csstok.TokenType.CLASS, adapt.csstok.TokenType.AT, adapt.csstok.TokenType.HASH, T_NUMERIC
                tokenText = adapt.csstok.escapeParse(input.substring(tokenPosition, position));
                if (tokenType == adapt.csstok.TokenType.IDENT) {
                    position++; // consume
                    if (tokenText.toLowerCase() == "url") {
                        actions = adapt.csstok.actionsURL;
                        continue;
                    }
                    tokenType = adapt.csstok.TokenType.FUNC;
                }
                break;
            case adapt.csstok.Action.COMMENT:
                actions = adapt.csstok.actionsComment;
                position++;
                continue;
            case adapt.csstok.Action.COMMST:
                actions = adapt.csstok.actionsCommentStar;
                position++;
                continue;
            case adapt.csstok.Action.ENDNOTK:
                actions = adapt.csstok.actionsNormal;
                position++;
                continue;
            case adapt.csstok.Action.MINMIN:
                actions = adapt.csstok.actionsMinusMinus;
                position++;
                continue;
            case adapt.csstok.Action.TOINT:
                tokenType = adapt.csstok.TokenType.INT;
                actions = adapt.csstok.actionsInt;
                position++;
                continue;
            case adapt.csstok.Action.TONUM:
                tokenType = adapt.csstok.TokenType.NUM;
                actions = adapt.csstok.actionsNumber;
                position++;
                continue;
            case adapt.csstok.Action.TOIDENT:
                tokenType = adapt.csstok.TokenType.IDENT;
                actions = adapt.csstok.actionsIdent;
                position++;
                continue;
            case adapt.csstok.Action.TOIDES:
                tokenType = adapt.csstok.TokenType.IDENT;
                actions = adapt.csstok.actionsIdentEscChr;
                backslashPos = position++;
                continue;
            case adapt.csstok.Action.KILL1:
                position--;
                break;
            case adapt.csstok.Action.KILL2:
                position -= 2;
                break;
            case adapt.csstok.Action.URL:
                tokenPosition = position++;
                actions = adapt.csstok.actionsURLInside;
                continue;
            case adapt.csstok.Action.URL1:
                tokenPosition = ++position; // skip quote
                actions = adapt.csstok.actionsURLInside1;
                continue;
            case adapt.csstok.Action.URL2:
                tokenPosition = ++position; // skip quote
                actions = adapt.csstok.actionsURLInside2;
                continue;
            case adapt.csstok.Action.ENDURL:
                tokenType = adapt.csstok.TokenType.URL;
                tokenText = adapt.csstok.escapeParse(input.substring(tokenPosition, position));
                position++; // skip ')'
                break;
            case adapt.csstok.Action.FINURL:
                position++; // skip ')'
                break;
            case adapt.csstok.Action.LT_BG:
                actions = adapt.csstok.actionsLtBang;
                position++;
                continue;
            case adapt.csstok.Action.LT_BG_M:
                actions = adapt.csstok.actionsLtBangMinus;
                position++;
                continue;
            case adapt.csstok.Action.CHKSP:
                // newline in non-quoted URL - check if end of url
                if (position - backslashPos < 8) {
                    // close enough: may be valid
                    if (input.substring(backslashPos + 1, position + 1).match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])|[ \t]$/)) {
                        // valid, keep going
                        position++;
                        continue;
                    }
                }
            // end of url
            // fall through
            case adapt.csstok.Action.TERMURL:
                tokenType = adapt.csstok.TokenType.URL;
                tokenText = adapt.csstok.escapeParse(input.substring(tokenPosition, position));
                position++; // skip quote (or newline)
                actions = adapt.csstok.actionsURLTail;
                continue;
            case adapt.csstok.Action.CHKPOSN:
                // newline in string or quoted URL - check validity
                position++;
                if (position - backslashPos < 9) {
                    // close enough: may be valid
                    if (input.substring(backslashPos + 1, position).match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])$/)) {
                        // valid, keep going
                        continue;
                    }
                }
                // invalid token
                tokenType = adapt.csstok.TokenType.INVALID;
                tokenText = "E_CSS_UNEXPECTED_NEWLINE";
                actions = adapt.csstok.actionsNormal;
                break;
            case adapt.csstok.Action.CHKPOSS:
                // space in identifier - check validity
                if (position - backslashPos < 9) {
                    // close enough: may be valid
                    if (input.substring(backslashPos + 1, position + 1).match(/^[0-9a-fA-F]{0,6}[ \t]$/)) {
                        // valid, keep going
                        position++;
                        continue;
                    }
                }
                // end of identifier
                // don't consume current char
                // tokenType should be set already
                tokenText = adapt.csstok.escapeParse(input.substring(tokenPosition, position));
                break;
            case adapt.csstok.Action.URLESC:
                backslashPos = position++;
                continue;
            case adapt.csstok.Action.IDESCH:
                position++;
                actions = adapt.csstok.actionsIdentEsc;
                continue;
            default:
                // EOF
                if (actions !== adapt.csstok.actionsNormal) {
                    tokenType = adapt.csstok.TokenType.INVALID;
                    tokenText = "E_CSS_UNEXPECTED_STATE";
                    break;
                }
                tokenPosition = position;
                tokenType = adapt.csstok.TokenType.EOF;
        }
        token.type = tokenType;
        token.precededBySpace = seenSpace;
        token.num = tokenNum;
        token.text = tokenText;
        token.position = tokenPosition;
        tail++;
        if (tail >= head)
            break;
        actions = adapt.csstok.actionsNormal;
        seenSpace = false;
        token = buffer[tail & indexMask];
    }
    this.position = position;
    this.tail = tail & indexMask;
};
