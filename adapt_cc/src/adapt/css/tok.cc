#include "adapt/css/tok.h"

#include <string>

#include <stdlib.h>

namespace adapt {
namespace css {

enum TokenizerAction {
  TA_SPACE,
  TA_INT,
  TA_IDENT,
  TA_BANG,
  TA_HASH,
  TA_DOLLAR,
  TA_PERCENT,
  TA_AMP,
  TA_O_PAR,
  TA_C_PAR,
  TA_STAR,
  TA_PLUS,
  TA_COMMA,
  TA_MINUS,
  TA_DOT,
  TA_SLASH,
  TA_COLON,
  TA_SEMICOL,
  TA_LT,
  TA_EQ,
  TA_GT,
  TA_QMARK,
  TA_AT,
  TA_O_BRK,
  TA_C_BRK,
  TA_O_BRC,
  TA_C_BRC,
  TA_BSLASH,
  TA_HAT,
  TA_BAR,
  TA_TILDE,
  TA_STR1,
  TA_STR2,
  TA_END,
  TA_EQTAIL,
  TA_ENDINT,
  TA_ENDNUM,
  TA_CONT,
  TA_UNIT,
  TA_PCUNIT,
  TA_NUMBER,
  TA_ENDIDNT,
  TA_IDNTESC,
  TA_ENDIDES, // end of identifier with escapes
  TA_ENDSTR,
  TA_ENDESTR, // end of string with escapes
  TA_STR1ESC,
  TA_STR2ESC,
  TA_BAR_BAR,
  TA_AMP_AMP,
  TA_FUNC,
  TA_FUNCES,
  TA_COMMENT,
  TA_COMMST,
  TA_ENDNOTK,
  TA_MINMIN,
  TA_TOINT,
  TA_TONUM,
  TA_TOIDENT,
  TA_TOIDES,
  TA_KILL1,
  TA_KILL2,
  TA_URL,
  TA_URL1,
  TA_URL2,
  TA_ENDURL,
  TA_TERMURL,
  TA_FINURL,
  TA_LT_BG,
  TA_LT_BG_M,
  TA_INVALID,
  TA_CHKPOSS,
  TA_CHKPOSN,
  TA_URLESC,
  TA_IDESCH,
  TA_COL_COL,
  TA_TOCLASS,
  TA_CHKSP,
  TA_CHECK_EQ_GT,
  TA_EOF
};

typedef TokenizerAction TokenizerActions[129];

/**
 * Start of the token.
 */
static const TokenizerAction actionsNormal[] = {
  TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, // 0x00-0x07
  TA_INVALID, TA_SPACE,   TA_SPACE,   TA_INVALID, TA_SPACE,   TA_SPACE,   TA_INVALID, TA_INVALID, // 0x08-0x0F
  TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, // 0x10-0x17
  TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, // 0x18-0x1F
  TA_SPACE,   TA_BANG,    TA_STR2,    TA_HASH,    TA_DOLLAR,  TA_PERCENT, TA_AMP,     TA_STR1,    // 0x20-0x27
  TA_O_PAR,   TA_C_PAR,   TA_STAR,    TA_PLUS,    TA_COMMA,   TA_MINUS,   TA_DOT,     TA_SLASH,   // 0x28-0x2F
  TA_INT,     TA_INT,     TA_INT,     TA_INT,     TA_INT,     TA_INT,     TA_INT,     TA_INT,     // 0x30-0x37
  TA_INT,     TA_INT,     TA_COLON,   TA_SEMICOL, TA_LT,      TA_EQ,      TA_GT,      TA_QMARK,   // 0x38-0x3F
  TA_AT,      TA_IDENT,   TA_IDENT,   TA_IDENT,   TA_IDENT,   TA_IDENT,   TA_IDENT,   TA_IDENT,   // 0x40-0x47
  TA_IDENT,   TA_IDENT,   TA_IDENT,   TA_IDENT,   TA_IDENT,   TA_IDENT,   TA_IDENT,   TA_IDENT,   // 0x48-0x4F
  TA_IDENT,   TA_IDENT,   TA_IDENT,   TA_IDENT,   TA_IDENT,   TA_IDENT,   TA_IDENT,   TA_IDENT,   // 0x50-0x57
  TA_IDENT,   TA_IDENT,   TA_IDENT,   TA_O_BRK,   TA_BSLASH,  TA_C_BRK,   TA_HAT,     TA_IDENT,   // 0x58-0x5F
  TA_INVALID, TA_IDENT,   TA_IDENT,   TA_IDENT,   TA_IDENT,   TA_IDENT,   TA_IDENT,   TA_IDENT,   // 0x60-0x67
  TA_IDENT,   TA_IDENT,   TA_IDENT,   TA_IDENT,   TA_IDENT,   TA_IDENT,   TA_IDENT,   TA_IDENT,   // 0x68-0x6F
  TA_IDENT,   TA_IDENT,   TA_IDENT,   TA_IDENT,   TA_IDENT,   TA_IDENT,   TA_IDENT,   TA_IDENT,   // 0x70-0x77
  TA_IDENT,   TA_IDENT,   TA_IDENT,   TA_O_BRC,   TA_BAR,     TA_C_BRC,   TA_TILDE,   TA_INVALID, // 0x78-0x7F
  TA_EOF
};

/**
 * Inside identifier.
 */
static const TokenizerAction actionsIdent[] = {
  TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT, // 0x00-0x07
  TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT, // 0x08-0x0F
  TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT, // 0x10-0x17
  TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT, // 0x18-0x1F
  TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT, // 0x20-0x27
  TA_FUNC,    TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT, TA_CONT,    TA_ENDIDNT, TA_ENDIDNT, // 0x28-0x2F
  TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    // 0x30-0x37
  TA_CONT,    TA_CONT,    TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT, // 0x38-0x3F
  TA_ENDIDNT, TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    // 0x40-0x47
  TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    // 0x48-0x4F
  TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    // 0x50-0x57
  TA_CONT,    TA_CONT,    TA_CONT,    TA_ENDIDNT, TA_IDNTESC, TA_ENDIDNT, TA_ENDIDNT, TA_CONT,    // 0x58-0x5F
  TA_ENDIDNT, TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    // 0x60-0x67
  TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    // 0x68-0x6F
  TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    // 0x70-0x77
  TA_CONT,    TA_CONT,    TA_CONT,    TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT, TA_ENDIDNT,  // 0x78-0x7F
  TA_ENDIDNT
};

/**
 * After dot (either .class or .123)
 */
static const TokenizerAction actionsNumOrClass[] = {
  TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, // 0x00-0x07
  TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, // 0x08-0x0F
  TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, // 0x10-0x17
  TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, // 0x18-0x1F
  TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, // 0x20-0x27
  TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, TA_TOCLASS, TA_TONUM,   TA_INVALID, // 0x28-0x2F
  TA_TONUM,   TA_TONUM,   TA_TONUM,   TA_TONUM,   TA_TONUM,   TA_TONUM,   TA_TONUM,   TA_TONUM,   // 0x30-0x37
  TA_TONUM,   TA_TONUM,   TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, // 0x38-0x3F
  TA_INVALID, TA_TOCLASS, TA_TOCLASS, TA_TOCLASS, TA_TOCLASS, TA_TOCLASS, TA_TOCLASS, TA_TOCLASS, // 0x40-0x47
  TA_TOCLASS, TA_TOCLASS, TA_TOCLASS, TA_TOCLASS, TA_TOCLASS, TA_TOCLASS, TA_TOCLASS, TA_TOCLASS, // 0x48-0x4F
  TA_TOCLASS, TA_TOCLASS, TA_TOCLASS, TA_TOCLASS, TA_TOCLASS, TA_TOCLASS, TA_TOCLASS, TA_TOCLASS, // 0x50-0x57
  TA_TOCLASS, TA_TOCLASS, TA_TOCLASS, TA_INVALID, TA_TOIDES,  TA_INVALID, TA_INVALID, TA_TOCLASS, // 0x58-0x5F
  TA_INVALID, TA_TOCLASS, TA_TOCLASS, TA_TOCLASS, TA_TOCLASS, TA_TOCLASS, TA_TOCLASS, TA_TOCLASS, // 0x60-0x67
  TA_TOCLASS, TA_TOCLASS, TA_TOCLASS, TA_TOCLASS, TA_TOCLASS, TA_TOCLASS, TA_TOCLASS, TA_TOCLASS, // 0x68-0x6F
  TA_TOCLASS, TA_TOCLASS, TA_TOCLASS, TA_TOCLASS, TA_TOCLASS, TA_TOCLASS, TA_TOCLASS, TA_TOCLASS, // 0x70-0x77
  TA_TOCLASS, TA_TOCLASS, TA_TOCLASS, TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, TA_INVALID, // 0x78-0x7F
  TA_ENDIDNT
};

/**
 * after '-'
 */
static const TokenizerAction actionsMinus[] = {
  TA_END,     TA_END,     TA_END,     TA_END,     TA_END,     TA_END,     TA_END,     TA_END,     // 0x00-0x07
  TA_END,     TA_END,     TA_END,     TA_END,     TA_END,     TA_END,     TA_END,     TA_END,     // 0x08-0x0F
  TA_END,     TA_END,     TA_END,     TA_END,     TA_END,     TA_END,     TA_END,     TA_END,     // 0x10-0x17
  TA_END,     TA_END,     TA_END,     TA_END,     TA_END,     TA_END,     TA_END,     TA_END,     // 0x18-0x1F
  TA_END,     TA_END,     TA_END,     TA_END,     TA_END,     TA_END,     TA_END,     TA_END,     // 0x20-0x27
  TA_END,     TA_END,     TA_END,     TA_END,     TA_END,     TA_MINMIN,  TA_TONUM,   TA_END,     // 0x28-0x2F
  TA_TOINT,   TA_TOINT,   TA_TOINT,   TA_TOINT,   TA_TOINT,   TA_TOINT,   TA_TOINT,   TA_TOINT,   // 0x30-0x37
  TA_TOINT,   TA_TOINT,   TA_END,     TA_END,     TA_END,     TA_END,     TA_END,     TA_END,     // 0x38-0x3F
  TA_END,     TA_TOIDENT, TA_TOIDENT, TA_TOIDENT, TA_TOIDENT, TA_TOIDENT, TA_TOIDENT, TA_TOIDENT, // 0x40-0x47
  TA_TOIDENT, TA_TOIDENT, TA_TOIDENT, TA_TOIDENT, TA_TOIDENT, TA_TOIDENT, TA_TOIDENT, TA_TOIDENT, // 0x48-0x4F
  TA_TOIDENT, TA_TOIDENT, TA_TOIDENT, TA_TOIDENT, TA_TOIDENT, TA_TOIDENT, TA_TOIDENT, TA_TOIDENT, // 0x50-0x57
  TA_TOIDENT, TA_TOIDENT, TA_TOIDENT, TA_END,     TA_TOIDES,  TA_END,     TA_END,     TA_TOIDENT, // 0x58-0x5F
  TA_END,     TA_TOIDENT, TA_TOIDENT, TA_TOIDENT, TA_TOIDENT, TA_TOIDENT, TA_TOIDENT, TA_TOIDENT, // 0x60-0x67
  TA_TOIDENT, TA_TOIDENT, TA_TOIDENT, TA_TOIDENT, TA_TOIDENT, TA_TOIDENT, TA_TOIDENT, TA_TOIDENT, // 0x68-0x6F
  TA_TOIDENT, TA_TOIDENT, TA_TOIDENT, TA_TOIDENT, TA_TOIDENT, TA_TOIDENT, TA_TOIDENT, TA_TOIDENT, // 0x70-0x77
  TA_TOIDENT, TA_TOIDENT, TA_TOIDENT, TA_END,     TA_END,     TA_END,     TA_END,     TA_END,     // 0x78-0x7F
  TA_END
};

/**
 * Inside identifier with escape sequence
 */
static const TokenizerAction actionsIdentEsc[] = {
  TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, // 0x00-0x07
  TA_ENDIDES, TA_CHKPOSS, TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, // 0x08-0x0F
  TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, // 0x10-0x17
  TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, // 0x18-0x1F
  TA_CHKPOSS, TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, // 0x20-0x27
  TA_FUNCES,  TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, // 0x28-0x2F
  TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    // 0x30-0x37
  TA_CONT,    TA_CONT,    TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, // 0x38-0x3F
  TA_ENDIDES, TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    // 0x40-0x47
  TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    // 0x48-0x4F
  TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    // 0x50-0x57
  TA_CONT,    TA_CONT,    TA_CONT,    TA_ENDIDES, TA_IDNTESC, TA_ENDIDES, TA_ENDIDES, TA_CONT,    // 0x58-0x5F
  TA_ENDIDES, TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    // 0x60-0x67
  TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    // 0x68-0x6F
  TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    // 0x70-0x77
  TA_CONT,    TA_CONT,    TA_CONT,    TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, TA_ENDIDES, // 0x78-0x7F
  TA_ENDIDES
};

/**
 * Inside integer
 */
static const TokenizerAction actionsInt[] = {
  TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  // 0x00-0x07
  TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  // 0x08-0x0F
  TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  // 0x10-0x17
  TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  // 0x18-0x1F
  TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  TA_PCUNIT,  TA_ENDINT,  TA_ENDINT,  // 0x20-0x27
  TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  TA_NUMBER,  TA_ENDINT,  // 0x28-0x2F
  TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    // 0x30-0x37
  TA_CONT,    TA_CONT,    TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  // 0x38-0x3F
  TA_ENDINT,  TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    // 0x40-0x47
  TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    // 0x48-0x4F
  TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    // 0x50-0x57
  TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  TA_UNIT,    // 0x58-0x5F
  TA_ENDINT,  TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    // 0x60-0x67
  TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    // 0x68-0x6F
  TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    // 0x70-0x77
  TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  TA_ENDINT,  // 0x78-0x7F
  TA_ENDINT
};

/**
 * inside real, after dot
 */
static const TokenizerAction actionsNumber[] = {
  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  // 0x00-0x07
  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  // 0x08-0x0F
  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  // 0x10-0x17
  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  // 0x18-0x1F
  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  TA_PCUNIT,  TA_ENDNUM,  TA_ENDNUM,  // 0x20-0x27
  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  // 0x28-0x2F
  TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    TA_CONT,    // 0x30-0x37
  TA_CONT,    TA_CONT,    TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  // 0x38-0x3F
  TA_ENDNUM,  TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    // 0x40-0x47
  TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    // 0x48-0x4F
  TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    // 0x50-0x57
  TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  TA_UNIT,    // 0x58-0x5F
  TA_ENDNUM,  TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    // 0x60-0x67
  TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    // 0x68-0x6F
  TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_UNIT,    // 0x70-0x77
  TA_UNIT,    TA_UNIT,    TA_UNIT,    TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  TA_ENDNUM,  // 0x78-0x7F
  TA_ENDNUM
};

static TokenizerAction actionsCheckEq[129];
static TokenizerAction actionsColon[129];
static TokenizerAction actionsBar[129];
static TokenizerAction actionsAmp[129];
static TokenizerAction actionsSlash[129];
static TokenizerAction actionsComment[129];
static TokenizerAction actionsCommentStar[129];
static TokenizerAction actionsMinusMinus[129];
static TokenizerAction actionsLt[129];
static TokenizerAction actionsLtBang[129];
static TokenizerAction actionsLtBangMinus[129];
static TokenizerAction actionsIdentEscChr[129];
static TokenizerAction actionsStr1[129];
static TokenizerAction actionsStr2[129];
static TokenizerAction actionsStr1Esc[129];
static TokenizerAction actionsStr2Esc[129];
static TokenizerAction actionsURL[129];
static TokenizerAction actionsURLInside[129];
static TokenizerAction actionsURLInside1[129];
static TokenizerAction actionsURLInside2[129];
static TokenizerAction actionsURLTail[129];

void fill_actions(TokenizerActions& actions, TokenizerAction fill) {
  for (int i = 0; i < 128 ; i++) {
    actions[i] = fill;
  }
  actions[128] = fill == TA_END ? TA_END : TA_INVALID;
}

bool init_actions() {
  fill_actions(actionsCheckEq, TA_END);
  actionsCheckEq['='] = TA_EQTAIL;
  actionsCheckEq['>'] = TA_CHECK_EQ_GT;
  fill_actions(actionsColon, TA_END);
  actionsColon[':'] = TA_COL_COL;
  fill_actions(actionsBar, TA_END);
  actionsBar['='] = TA_EQTAIL;
  actionsBar['|'] = TA_BAR_BAR;
  fill_actions(actionsAmp, TA_END);
  actionsAmp['&'] = TA_AMP_AMP;
  fill_actions(actionsSlash, TA_END);
  actionsSlash['*'] = TA_COMMENT;
  fill_actions(actionsComment, TA_CONT);
  actionsComment['*'] = TA_COMMST;
  fill_actions(actionsCommentStar, TA_COMMENT);
  actionsCommentStar['*'] = TA_COMMST;
  actionsCommentStar['/'] = TA_ENDNOTK;
  fill_actions(actionsMinusMinus, TA_KILL1);
  actionsMinusMinus['>'] = TA_ENDNOTK;
  fill_actions(actionsLt, TA_END);
  actionsLt['='] = TA_EQTAIL;
  actionsLt['!'] = TA_LT_BG;
  fill_actions(actionsLtBang, TA_KILL1);
  actionsLtBang['-'] = TA_LT_BG_M;
  fill_actions(actionsLtBangMinus, TA_KILL2);
  actionsLtBangMinus['-'] = TA_ENDNOTK;
  fill_actions(actionsIdentEscChr, TA_IDESCH);
  actionsIdentEscChr['\t'] = TA_INVALID;
  actionsIdentEscChr['\n'] = TA_INVALID;
  actionsIdentEscChr['\r'] = TA_INVALID;
  actionsIdentEscChr[' '] = TA_INVALID;
  fill_actions(actionsStr1, TA_CONT);
  actionsStr1['\''] = TA_ENDSTR;
  actionsStr1['\n'] = TA_INVALID;
  actionsStr1['\r'] = TA_INVALID;
  actionsStr1['\\'] = TA_STR1ESC;
  fill_actions(actionsStr2, TA_CONT);
  actionsStr2['"'] = TA_ENDSTR;
  actionsStr2['\n'] = TA_INVALID;
  actionsStr2['\r'] = TA_INVALID;
  actionsStr2['\\'] = TA_STR2ESC;
  fill_actions(actionsStr1Esc, TA_CONT);
  actionsStr1Esc['\''] = TA_ENDESTR;
  actionsStr1Esc['\n'] = TA_CHKPOSN;
  actionsStr1Esc['\r'] = TA_CHKPOSN;
  actionsStr1Esc['\\'] = TA_STR1ESC;
  fill_actions(actionsStr2Esc, TA_CONT);
  actionsStr2Esc['\"'] = TA_ENDESTR;
  actionsStr2Esc['\n'] = TA_CHKPOSN;
  actionsStr2Esc['\r'] = TA_CHKPOSN;
  actionsStr2Esc['\\'] = TA_STR2ESC;
  fill_actions(actionsURL, TA_URL);
  actionsURL['\t'] = TA_CONT;
  actionsURL['\n'] = TA_CONT;
  actionsURL['\r'] = TA_CONT;
  actionsURL[' '] = TA_CONT;
  actionsURL['\''] = TA_URL1;
  actionsURL['\"'] = TA_URL2;
  actionsURL[')'] = TA_INVALID;
  fill_actions(actionsURLInside, TA_CONT);
  actionsURLInside[')'] = TA_ENDURL;
  actionsURLInside['\t'] = TA_CHKSP;
  actionsURLInside['\n'] = TA_CHKSP;
  actionsURLInside['\r'] = TA_CHKSP;
  actionsURLInside[' '] = TA_CHKSP;
  actionsURLInside['\\'] = TA_URLESC;
  actionsURLInside['('] = TA_INVALID;
  actionsURLInside['['] = TA_INVALID;
  actionsURLInside[']'] = TA_INVALID;
  actionsURLInside['{'] = TA_INVALID;
  actionsURLInside['}'] = TA_INVALID;
  actionsURLInside[128] = TA_ENDURL;
  fill_actions(actionsURLInside1, TA_CONT);
  actionsURLInside1['\''] = TA_TERMURL;
  actionsURLInside1['\n'] = TA_CHKPOSN;
  actionsURLInside1['\r'] = TA_CHKPOSN;
  actionsURLInside1['\\'] = TA_URLESC;
  actionsURLInside1[128] = TA_ENDURL;
  fill_actions(actionsURLInside2, TA_CONT);
  actionsURLInside2['"'] = TA_TERMURL;
  actionsURLInside2['\n'] = TA_CHKPOSN;
  actionsURLInside2['\r'] = TA_CHKPOSN;
  actionsURLInside2['\\'] = TA_URLESC;
  actionsURLInside2[128] = TA_ENDURL;
  fill_actions(actionsURLTail, TA_INVALID);
  actionsURLTail['\t'] = TA_CONT;
  actionsURLTail['\n'] = TA_CONT;
  actionsURLTail['\r'] = TA_CONT;
  actionsURLTail[' '] = TA_CONT;
  actionsURLTail[')'] = TA_FINURL;
  return true;
}

bool dummy_init = init_actions();

static int parse_int(const char* s, const char* end) {
  int result = 0;
  bool neg = false;
  if (*s == '-') {
    neg = true;
    ++s;
  }
  for ( ; s < end; ++s) {
    result = result * 10 + (*s - '0');
  }
  return neg ? -result : result;
}
  
static double parse_double(const char* s, const char* end) {
  double result = 0;
  bool neg = false;
  if (*s == '-') {
    neg = true;
    ++s;
  }
  for ( ; s < end; ++s) {
    if (*s == '.') {
      double frac = 0;
      for (--end; s < end; --end) {
        frac = frac / 10 + (*end - '0');
      }
      result += frac / 10;
      break;
    }
    result = result * 10 + (*s - '0');
  }
  return neg ? -result : result;
}

inline bool is_hex(char c) {
  return ('0' <= c && c <= '9') || ('A' <= c && c <= 'Z')
      || ('a' <= c && c <= 'z');
}

static rc_string parse_escapes(const char* s, const char* end) {
  std::string buffer;
  const char* p = s;
  while(p < end) {
    if (*p != '\\') {
      ++p;
    } else {
      buffer.append(s, p - s);
      char c = *(++p);
      if (c == '\r') {
        if(*(++p) == '\n') {
          ++p;
        }
      } else if (c == '\n') {
        ++p;
      } else {
        char hex[8];
        char* h = hex;
        while(true) {
          if (!is_hex(c)) {
            if (c == ' ' || c == '\t') {
              ++p;
            }
            break;
          }
          *(h++) = c;
          p++;
          if (p >= end) {
            break;
          }
          c = *p;
        }
        *h = '\0';
        int uc = static_cast<int>(strtol(hex, NULL, 16));
        // TODO: convert to UTF8
        buffer.append(1, (char)uc);
      }
      s = p;
    }
  }
  if (s < end) {
    buffer.append(s, end - s);
  }
  return rc_string(buffer.data(), buffer.length());
}

static bool check_if_valid_escape_hex(const char* s, const char* end) {
  if (end - s > 6) {
    return false;
  }
  for (; s < end; s++) {
    if (!is_hex(*s)) {
      return false;
    }
  }
  return true;
}

// substr.match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])$/)
static bool check_if_valid_string_escape(const char* s, const char* end) {
  char c = end[-1];
  if (c == '\n') {
    --end;
    c = end[-1];
  }
  if (c == '\r') {
    --end;
  }
  return check_if_valid_escape_hex(s, end);
}

// substr.match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])|[ \t]$/)
static bool check_if_valid_url_escape(const char* s, const char* end) {
  char c = end[-1];
  if (c == ' ' || c == '\t') {
    return s == end - 1;
  }
  return check_if_valid_string_escape(s, end);
}


// substr.match(/^[0-9a-fA-F]{0,6}[ \t]$/)
static bool check_if_valid_name_escape(const char* s, const char* end) {
  char c = end[-1];
  if (c == ' ' || c == '\t') {
    --end;
  }
  return check_if_valid_escape_hex(s, end);
}

void Tokenizer::fill_buffer() {
  int tail = tail_;
  int head = head_ >= 0 ? head_ : curr_;
  int index_mask = index_mask_;
  if (tail >= head)
    head += index_mask;
  else
    head--;
  if (head == tail) {
    // only expect to get here when mark is in effect
    assert(head >= 0);
    grow_buffer();
    assert(head_ == 0);
    tail = tail_;
    index_mask = index_mask_;
    head = index_mask_;
  }
  const TokenizerAction* actions = actionsNormal;
  const char* position = position_;
  const char* input_end = input_end_;
  TokenType tokenType = TT_EOF;
  const char* tokenPosition = 0;
  rc_string tokenText;
  double tokenNum = 0;
  bool seenSpace = false;
  Token* token = &buffer_[tail];
  const char* backslashPos = input_ - 9; // far enough before the start of the string
  while (true) {
    int charCode;
    if (position < input_end) {
      charCode = *position & 0xFF;
      if (charCode >= 128) {
        charCode = 'A';
      }
    } else {
      charCode = 128;
    }
    switch (actions[charCode]) {
      case TA_INVALID:
        tokenType = TT_INVALID;
        if (charCode == 128) {
          tokenText = "E_CSS_UNEXPECTED_EOF";
        } else {
          tokenText = "E_CSS_UNEXPECTED_CHAR";
        }
        actions = actionsNormal;
        position++;
        break;
      case TA_SPACE:
        position++;
        seenSpace = true;
        continue;
      case TA_INT:
        tokenPosition = position++;
        actions = actionsInt;
        continue;
      case TA_IDENT:
        tokenType = TT_IDENT;
        tokenPosition = position++;
        actions = actionsIdent;
        continue;
      case TA_BANG:
        tokenPosition = position++;
        tokenType = TT_BANG;
        actions = actionsCheckEq;
        continue;
      case TA_STR1:
        tokenType = TT_STR;
        tokenPosition = ++position; // after quote
        actions = actionsStr1;
        continue;
      case TA_STR2:
        tokenType = TT_STR;
        tokenPosition = ++position; // after quote
        actions = actionsStr2;
        continue;
      case TA_HASH:
        tokenPosition = ++position; // after hash
        tokenType = TT_HASH;
        actions = actionsIdent;
        continue;
      case TA_DOLLAR:
        tokenPosition = position++;
        tokenType = TT_DOLLAR;
        actions = actionsCheckEq;
        continue;
      case TA_PERCENT:
        tokenPosition = position++;
        tokenType = TT_PERCENT;
        break;
      case TA_AMP:
        tokenPosition = position++;
        tokenType = TT_DOLLAR;
        actions = actionsAmp;
        continue;
      case TA_O_PAR:
        tokenPosition = position++;
        tokenType = TT_O_PAR;
        break;
      case TA_C_PAR:
        tokenPosition = position++;
        tokenType = TT_C_PAR;
        break;
      case TA_STAR:
        tokenPosition = position++;
        tokenType = TT_STAR;
        actions = actionsCheckEq;
        continue;
      case TA_PLUS:
        tokenPosition = position++;
        tokenType = TT_PLUS;
        break;
      case TA_COMMA:
        tokenPosition = position++;
        tokenType = TT_COMMA;
        break;
      case TA_MINUS:
        tokenType = TT_MINUS;
        tokenPosition = position++;
        actions = actionsMinus;
        continue;
      case TA_DOT:
        tokenPosition = position++;
        actions = actionsNumOrClass;
        continue;
      case TA_TOCLASS:
        tokenPosition = position++;
        tokenType = TT_CLASS;
        actions = actionsIdent;
        continue;
      case TA_SLASH:
        tokenPosition = position++;
        tokenType = TT_SLASH;
        actions = actionsSlash;
        continue;
      case TA_COLON:
        tokenPosition = position++;
        tokenType = TT_COLON;
        actions = actionsColon;
        continue;
      case TA_COL_COL:
        position++;
        tokenType = TT_COL_COL;
        break;
      case TA_SEMICOL:
        tokenPosition = position++;
        tokenType = TT_SEMICOL;
        break;
      case TA_LT:
        tokenPosition = position++;
        tokenType = TT_LT;
        actions = actionsLt;
        continue;
      case TA_EQ:
        tokenPosition = position++;
        tokenType = TT_EQ;
        actions = actionsCheckEq;
        continue;
      case TA_GT:
        tokenPosition = position++;
        tokenType = TT_GT;
        actions = actionsCheckEq;
        continue;
      case TA_QMARK:
        tokenPosition = position++;
        tokenType = TT_QMARK;
        break;
      case TA_AT:
        tokenPosition = ++position; // after "at" sign
        tokenType = TT_AT;
        actions = actionsIdent;
        continue;
      case TA_O_BRK:
        tokenPosition = position++;
        tokenType = TT_O_BRK;
        break;
      case TA_C_BRK:
        tokenPosition = position++;
        tokenType = TT_C_BRK;
        break;
      case TA_O_BRC:
        tokenPosition = position++;
        tokenType = TT_O_BRC;
        break;
      case TA_C_BRC:
        tokenPosition = position++;
        tokenType = TT_C_BRC;
        break;
      case TA_BSLASH:
        tokenPosition = position++;
        backslashPos = tokenPosition;
        tokenType = TT_IDENT;
        actions = actionsIdentEscChr;
        continue;
      case TA_HAT:
        tokenPosition = position++;
        tokenType = TT_HAT;
        actions = actionsCheckEq;
        continue;
      case TA_BAR:
        tokenPosition = position++;
        tokenType = TT_BAR;
        actions = actionsBar;
        continue;
      case TA_TILDE:
        tokenPosition = position++;
        tokenType = TT_TILDE;
        actions = actionsCheckEq;
        continue;
      case TA_END:
        // don't consume current char
        break;
      case TA_EQTAIL:
        position++;
        tokenType = TokenType(tokenType + TT_BANG_EQ - TT_BANG);
        break;
      case TA_ENDINT:
        // don't consume current char
        tokenType = TT_INT;
        tokenNum = parse_int(tokenPosition, position);
        break;
      case TA_ENDNUM:
        // don't consume current char
        tokenType = TT_NUM;
        tokenNum = parse_double(tokenPosition, position);
        break;
      case TA_CONT:
        // just consume current char
        position++;
        continue;
      case TA_UNIT:
        tokenType = TT_NUMERIC;
        tokenNum = parse_double(tokenPosition, position);
        tokenPosition = position++;
        actions = actionsIdent;
        continue;
      case TA_PCUNIT:
        tokenType = TT_NUMERIC;
        tokenNum = parse_double(tokenPosition, position);
        tokenText = rc_qname::atom(ID_percent)->name();
        tokenPosition = position++; // for consistency with alphabetic units
        break;
      case TA_NUMBER:
        position++;
        actions = actionsNumber;
        continue;
      case TA_ENDIDNT:
        // don't consume current char
        // tokenType should be set already
        tokenText = rc_string(tokenPosition, position - tokenPosition);
        break;
      case TA_IDNTESC:
        backslashPos = position++;
        actions = actionsIdentEscChr;
        continue;
      case TA_ENDIDES: // end of identifier with escapes
        // don't consume current char
        // tokenType should be set already
        tokenText = parse_escapes(tokenPosition, position);
        break;
      case TA_ENDSTR:
        tokenText = rc_string(tokenPosition, position - tokenPosition);
        // consume closing quote
        position++;
        break;
      case TA_ENDESTR:
        tokenText = parse_escapes(tokenPosition, position);
        // consume closing quote
        position++;
        break;
      case TA_STR1ESC:
        backslashPos = position;
        position += 2; // consume character after backslash in any case
        actions = actionsStr1Esc;
        continue;
      case TA_STR2ESC:
        backslashPos = position;
        position += 2; // consume character after backslash in any case
        actions = actionsStr2Esc;
        continue;
      case TA_BAR_BAR:
        position++;
        tokenType = TT_BAR_BAR;
        break;
      case TA_AMP_AMP:
        position++;
        tokenType = TT_AMP_AMP;
        break;
      case TA_FUNC:
        // tokenType can be TT_IDENT, TT_CLASS, TT_AT, TT_HASH, TT_NUMERIC
        tokenText = rc_string(tokenPosition, position - tokenPosition);
        if (tokenType == TT_IDENT) {
          position++; // consume
          if (tokenText->to_lower_ascii() == "url") {
            actions = actionsURL;
            continue;
          }
          tokenType = TT_FUNC;
        }
        break;
      case TA_FUNCES:
        // tokenType can be TT_IDENT, TT_CLASS, TT_AT, TT_HASH, T_NUMERIC
        tokenText = rc_string(tokenPosition, position - tokenPosition);
        if (tokenType == TT_IDENT) {
          position++; // consume
          if (tokenText->to_lower_ascii() == "url") {
            actions = actionsURL;
            continue;
          }
          tokenType = TT_FUNC;
        }
        break;
      case TA_COMMENT:
        actions = actionsComment;
        position++;
        continue;
      case TA_COMMST:
        actions = actionsCommentStar;
        position++;
        continue;
      case TA_ENDNOTK:
        actions = actionsNormal;
        position++;
        continue;
      case TA_MINMIN:
        actions = actionsMinusMinus;
        position++;
        continue;
      case TA_TOINT:
        tokenType = TT_INT;
        actions = actionsInt;
        position++;
        continue;
      case TA_TONUM:
        tokenType = TT_NUM;
        actions = actionsNumber;
        position++;
        continue;
      case TA_TOIDENT:
        tokenType = TT_IDENT;
        actions = actionsIdent;
        position++;
        continue;
      case TA_TOIDES:
        tokenType = TT_IDENT;
        actions = actionsIdentEscChr;
        backslashPos = position++;
        continue;
      case TA_KILL1:
        position--;
        break;
      case TA_KILL2:
        position -= 2;
        break;
      case TA_URL:
        tokenPosition = position++;
        actions = actionsURLInside;
        continue;
      case TA_URL1:
        tokenPosition = ++position; // skip quote
        actions = actionsURLInside1;
        continue;
      case TA_URL2:
        tokenPosition = ++position; // skip quote
        actions = actionsURLInside2;
        continue;
      case TA_ENDURL:
        tokenType = TT_URL;
        tokenText = parse_escapes(tokenPosition, position);
        position++; // skip ')'
        break;
      case TA_FINURL:
        position++; // skip ')'
        break;
      case TA_LT_BG:
        actions = actionsLtBang;
        position++;
        continue;
      case TA_LT_BG_M:
        actions = actionsLtBangMinus;
        position++;
        continue;
      case TA_CHKSP:
        // newline in non-quoted URL - check if end of url
        if (position - backslashPos < 8) {
          // close enough: may be valid
          if (check_if_valid_url_escape(backslashPos + 1, position + 1)) {
            // valid, keep going
            position++;
            continue;
          }
        }
        // end of url
        // fall through
      case TA_TERMURL:
        tokenType = TT_URL;
        tokenText = parse_escapes(tokenPosition, position);
        position++; // skip quote (or newline)
        actions = actionsURLTail;
        continue;
      case TA_CHKPOSN:
        // newline in string or quoted URL - check validity
        position++;
        if (position - backslashPos < 9) {
          // close enough: may be valid
          if (check_if_valid_string_escape(backslashPos + 1, position)) {
            // valid, keep going
            continue;
          }
        }
        // invalid token
        tokenType = TT_INVALID;
        tokenText = "E_CSS_UNEXPECTED_NEWLINE";
        actions = actionsNormal;
        break;
      case TA_CHKPOSS:
        // space in identifier - check validity
        if (position - backslashPos < 9) {
          // close enough: may be valid
          if (check_if_valid_name_escape(backslashPos + 1, position + 1)) {
            // valid, keep going
            position++;
            continue;
          }
        }
        // end of identifier
        // don't consume current char
        // tokenType should be set already
        tokenText = parse_escapes(tokenPosition, position);
        break;
      case TA_URLESC:
        backslashPos = position++;
        continue;
      case TA_IDESCH:
        position++;
        actions = actionsIdentEsc;
        continue;
      case TA_CHECK_EQ_GT:
        if (tokenType == TT_EQ) {
          tokenType = TT_EQ_GT;
          position++;
        }
        break;
      default:
        // EOF
        if (actions != actionsNormal) {
          tokenType = TT_INVALID;
          tokenText = "E_CSS_UNEXPECTED_STATE";
          break;
        }
        tokenPosition = position;
        tokenType = TT_EOF;
    }
    token->type_ = tokenType;
    token->preceded_by_space_ = seenSpace;
    token->num_ = tokenNum;
    token->text_ = tokenText;
    token->position_ = tokenPosition - input_;
    tail++;
    if (tail >= head)
      break;
    actions = actionsNormal;
    seenSpace = false;
    tokenNum = 0;
    tokenText = rc_string::empty_string();
    token = &buffer_[tail & index_mask];
  }
  position_ = position;
  tail_ = tail & index_mask;
}

void Tokenizer::grow_buffer() {
  int new_index_mask = 2 * index_mask_ + 1;
  std::unique_ptr<Token[]> new_buffer(new Token[new_index_mask + 1]);
  int old_index = head_;
  int new_index = 0;
  int curr = curr_;
  while (old_index != tail_) {
    new_buffer[new_index] = buffer_[old_index];
    if (old_index == curr_)
      curr = new_index;
    old_index = (old_index + 1) & index_mask_;
    new_index++;
  }
  head_ = 0;
  tail_ = new_index;
  index_mask_ = new_index_mask;
  curr_ = curr;
  junk_.push_back(std::move(buffer_));
  buffer_.reset(std::move(new_buffer.release()));
}

}
}


