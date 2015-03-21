#include "adapt/css/parser.h"

#include <inttypes.h>

#include "adapt/base/rc_primitive.h"
#include "adapt/base/url.h"

namespace adapt {
namespace css {

ParserHandler::ParserHandler() {}
ParserHandler::~ParserHandler() {}

enum ParserAction {
  PA_NO_ACTION = 0,
  PA_SELECTOR_NAME_1,
  PA_SELECTOR_NAME,
  PA_SELECTOR_ANY_1,
  PA_SELECTOR_ANY,
  PA_SELECTOR_ID_1,
  PA_SELECTOR_ID,
  PA_SELECTOR_CLASS_1,
  PA_SELECTOR_CLASS,
  PA_SELECTOR_ATTR_1,
  PA_SELECTOR_ATTR,
  PA_SELECTOR_CHILD,
  PA_SELECTOR_SIBLING,
  PA_SELECTOR_BODY,
  PA_SELECTOR_PSEUDOCLASS,
  PA_VAL_IDENT,
  PA_VAL_HASH,
  PA_VAL_NUM,
  PA_VAL_INT,
  PA_VAL_NUMERIC,
  PA_VAL_STR,
  PA_VAL_URL,
  PA_VAL_COMMA,
  PA_VAL_SLASH,
  PA_VAL_FUNC,
  PA_VAL_C_PAR,
  PA_VAL_END,
  PA_RULE_END,
  PA_IDENT,
  PA_SELECTOR_START,
  PA_AT,
  PA_EXPR_IDENT,
  PA_EXPR_NUM,
  PA_EXPR_NUMERIC,
  PA_EXPR_STR,
  PA_EXPR_PARAM,
  PA_EXPR_PREFIX,
  PA_EXPR_INFIX,
  PA_EXPR_FUNC,
  PA_EXPR_C_PAR,
  PA_EXPR_O_PAR,
  PA_SELECTOR_NEXT,
  PA_SELECTOR_PSEUDOELEM,
  PA_EXPR_O_BRC,
  PA_VAL_FINISH,
  PA_EXPR_INFIX_NAME,
  PA_PROP,
  PA_VAL_BANG,
  PA_VAL_BRC,
  PA_EXPR_SEMICOL,
  PA_ERROR_PUSH,
  PA_ERROR_POP,
  PA_ERROR_POP_DECL,
  PA_ERROR_SEMICOL,
  PA_VAL_PLUS,
  PA_SELECTOR_PSEUDOCLASS_1,
  PA_SELECTOR_FOLLOWING_SIBLING,
  PA_DONE
};

static unsigned char actionsBase[TT_MAX_VALUE];
static unsigned char actionsStyleAttribute[TT_MAX_VALUE];
static unsigned char actionsSelector[TT_MAX_VALUE];
static unsigned char actionsSelectorCont[TT_MAX_VALUE];
static unsigned char actionsSelectorStart[TT_MAX_VALUE];
static unsigned char actionsPropVal[TT_MAX_VALUE];
static unsigned char actionsExprVal[TT_MAX_VALUE];
static unsigned char actionsExprOp[TT_MAX_VALUE];
static unsigned char actionsError[TT_MAX_VALUE];
static unsigned char actionsErrorDecl[TT_MAX_VALUE];
static unsigned char actionsErrorSelector[TT_MAX_VALUE];

static unsigned char priority[TT_MAX_VALUE];

static bool init_parser_tables() {
  actionsBase[TT_IDENT] = PA_IDENT;
  actionsBase[TT_STAR] = PA_SELECTOR_START;
  actionsBase[TT_HASH] = PA_SELECTOR_START;
  actionsBase[TT_CLASS] = PA_SELECTOR_START;
  actionsBase[TT_O_BRK] = PA_SELECTOR_START;
  actionsBase[TT_COLON] = PA_SELECTOR_START;
  actionsBase[TT_AT] = PA_AT;
  actionsBase[TT_C_BRC] = PA_RULE_END;
  actionsBase[TT_EOF] = PA_DONE;
  actionsStyleAttribute[TT_IDENT] = PA_PROP;
  actionsStyleAttribute[TT_EOF] = PA_DONE;
  actionsSelectorStart[TT_IDENT] = PA_SELECTOR_NAME;
  actionsSelectorStart[TT_STAR] = PA_SELECTOR_ANY;
  actionsSelectorStart[TT_HASH] = PA_SELECTOR_ID;
  actionsSelectorStart[TT_CLASS] = PA_SELECTOR_CLASS;
  actionsSelectorStart[TT_O_BRK] = PA_SELECTOR_ATTR;
  actionsSelectorStart[TT_COLON] = PA_SELECTOR_PSEUDOCLASS;
  actionsSelector[TT_GT] = PA_SELECTOR_CHILD;
  actionsSelector[TT_PLUS] = PA_SELECTOR_SIBLING;
  actionsSelector[TT_TILDE] = PA_SELECTOR_FOLLOWING_SIBLING;
  actionsSelector[TT_IDENT] = PA_SELECTOR_NAME_1;
  actionsSelector[TT_STAR] = PA_SELECTOR_ANY_1;
  actionsSelector[TT_HASH] = PA_SELECTOR_ID_1;
  actionsSelector[TT_CLASS] = PA_SELECTOR_CLASS_1;
  actionsSelector[TT_O_BRK] = PA_SELECTOR_ATTR_1;
  actionsSelector[TT_O_BRC] = PA_SELECTOR_BODY;
  actionsSelector[TT_COLON] = PA_SELECTOR_PSEUDOCLASS_1;
  actionsSelector[TT_COL_COL] = PA_SELECTOR_PSEUDOELEM;
  actionsSelector[TT_COMMA] = PA_SELECTOR_NEXT;
  actionsSelectorCont[TT_IDENT] = PA_SELECTOR_NAME;
  actionsSelectorCont[TT_STAR] = PA_SELECTOR_ANY;
  actionsSelectorCont[TT_HASH] = PA_SELECTOR_ID;
  actionsSelectorCont[TT_CLASS] = PA_SELECTOR_CLASS;
  actionsSelectorCont[TT_COLON] = PA_SELECTOR_PSEUDOCLASS;
  actionsSelectorCont[TT_COL_COL] = PA_SELECTOR_PSEUDOELEM;
  actionsSelectorCont[TT_O_BRK] = PA_SELECTOR_ATTR;
  actionsSelectorCont[TT_O_BRC] = PA_SELECTOR_BODY;
  actionsPropVal[TT_IDENT] = PA_VAL_IDENT;
  actionsPropVal[TT_HASH] = PA_VAL_HASH;
  actionsPropVal[TT_NUM] = PA_VAL_NUM;
  actionsPropVal[TT_INT] = PA_VAL_INT;
  actionsPropVal[TT_NUMERIC] = PA_VAL_NUMERIC;
  actionsPropVal[TT_STR] = PA_VAL_STR;
  actionsPropVal[TT_URL] = PA_VAL_URL;
  actionsPropVal[TT_COMMA] = PA_VAL_COMMA;
  actionsPropVal[TT_SLASH] = PA_VAL_SLASH;
  actionsPropVal[TT_FUNC] = PA_VAL_FUNC;
  actionsPropVal[TT_C_PAR] = PA_VAL_C_PAR;
  actionsPropVal[TT_SEMICOL] = PA_VAL_END;
  actionsPropVal[TT_C_BRC] = PA_VAL_BRC;
  actionsPropVal[TT_BANG] = PA_VAL_BANG;
  actionsPropVal[TT_PLUS] = PA_VAL_PLUS;
  actionsPropVal[TT_EOF] = PA_VAL_FINISH;
  actionsExprVal[TT_IDENT] = PA_EXPR_IDENT;
  actionsExprVal[TT_NUM] = PA_EXPR_NUM;
  actionsExprVal[TT_INT] = PA_EXPR_NUM;
  actionsExprVal[TT_NUMERIC] = PA_EXPR_NUMERIC;
  actionsExprVal[TT_STR] = PA_EXPR_STR;
  actionsExprVal[TT_O_PAR] = PA_EXPR_O_PAR;
  actionsExprVal[TT_FUNC] = PA_EXPR_FUNC;
  actionsExprVal[TT_BANG] = PA_EXPR_PREFIX;
  actionsExprVal[TT_MINUS] = PA_EXPR_PREFIX;
  actionsExprVal[TT_DOLLAR] = PA_EXPR_PARAM;
  actionsExprOp[TT_IDENT] = PA_EXPR_INFIX_NAME;
  actionsExprOp[TT_COMMA] = PA_EXPR_INFIX;
  actionsExprOp[TT_GT] = PA_EXPR_INFIX;
  actionsExprOp[TT_LT] = PA_EXPR_INFIX;
  actionsExprOp[TT_GT_EQ] = PA_EXPR_INFIX;
  actionsExprOp[TT_LT_EQ] = PA_EXPR_INFIX;
  actionsExprOp[TT_EQ] = PA_EXPR_INFIX;
  actionsExprOp[TT_EQ_EQ] = PA_EXPR_INFIX;
  actionsExprOp[TT_EQ_GT] = PA_EXPR_INFIX;
  actionsExprOp[TT_AMP_AMP] = PA_EXPR_INFIX;
  actionsExprOp[TT_BAR_BAR] = PA_EXPR_INFIX;
  actionsExprOp[TT_PLUS] = PA_EXPR_INFIX;
  actionsExprOp[TT_MINUS] = PA_EXPR_INFIX;
  actionsExprOp[TT_SLASH] = PA_EXPR_INFIX;
  actionsExprOp[TT_PERCENT] = PA_EXPR_INFIX;
  actionsExprOp[TT_STAR] = PA_EXPR_INFIX;
  actionsExprOp[TT_COLON] = PA_EXPR_INFIX;
  actionsExprOp[TT_QMARK] = PA_EXPR_INFIX;
  actionsExprOp[TT_C_PAR] = PA_EXPR_C_PAR;
  actionsExprOp[TT_O_BRC] = PA_EXPR_O_BRC;
  actionsExprOp[TT_SEMICOL] = PA_EXPR_SEMICOL;
  actionsError[TT_EOF] = PA_DONE;
  actionsError[TT_O_BRC] = PA_ERROR_PUSH;
  actionsError[TT_C_BRC] = PA_ERROR_POP;
  actionsError[TT_O_BRK] = PA_ERROR_PUSH;
  actionsError[TT_C_BRK] = PA_ERROR_POP;
  actionsError[TT_O_PAR] = PA_ERROR_PUSH;
  actionsError[TT_C_PAR] = PA_ERROR_POP;
  actionsError[TT_SEMICOL] = PA_ERROR_SEMICOL;
  actionsErrorDecl[TT_EOF] = PA_DONE;
  actionsErrorDecl[TT_O_BRC] = PA_ERROR_PUSH;
  actionsErrorDecl[TT_C_BRC] = PA_ERROR_POP_DECL;
  actionsErrorDecl[TT_O_BRK] = PA_ERROR_PUSH;
  actionsErrorDecl[TT_C_BRK] = PA_ERROR_POP;
  actionsErrorDecl[TT_O_PAR] = PA_ERROR_PUSH;
  actionsErrorDecl[TT_C_PAR] = PA_ERROR_POP;
  actionsErrorDecl[TT_SEMICOL] = PA_ERROR_SEMICOL;
  actionsErrorSelector[TT_EOF] = PA_DONE;
  actionsErrorSelector[TT_O_BRC] = PA_ERROR_PUSH;
  actionsErrorSelector[TT_C_BRC] = PA_ERROR_POP;
  actionsErrorSelector[TT_O_BRK] = PA_ERROR_PUSH;
  actionsErrorSelector[TT_C_BRK] = PA_ERROR_POP;
  actionsErrorSelector[TT_O_PAR] = PA_ERROR_PUSH;
  actionsErrorSelector[TT_C_PAR] = PA_ERROR_POP;

  priority[TT_C_PAR] = 0;
  priority[TT_COMMA] = 0;
  priority[TT_EQ_GT] = 1;
  priority[TT_SEMICOL] = 2;
  priority[TT_QMARK] = 3;
  priority[TT_COLON] = 3;
  priority[TT_AMP_AMP] = 4;
  priority[TT_BAR_BAR] = 4;
  priority[TT_LT] = 5;
  priority[TT_GT] = 5;
  priority[TT_LT_EQ] = 5;
  priority[TT_GT_EQ] = 5;
  priority[TT_EQ] = 5;
  priority[TT_EQ_EQ] = 5;
  priority[TT_BANG_EQ] = 5;
  priority[TT_PLUS] = 6;
  priority[TT_MINUS] = 6;
  priority[TT_STAR] = 7;
  priority[TT_SLASH] = 7;
  priority[TT_PERCENT] = 7;
  priority[TT_EOF] = 8;
  priority[TT_MEDIA_AND] = 5;

  return true;
}

Parser::Parser(ContentType content_type, const char* input, size_t length,
    ParserHandler* handler, const rc_string& base_url)
    : tokenizer_(input, length), handler_(handler), content_type_(content_type),
      base_url_(base_url), prop_important_(false),
      expr_syntax_context_(PROPERTY), import_ready_(false),
      region_rule_(false), default_ns_(rc_qname::atom(ID_asterisk)) {
  static bool init = init_parser_tables();
  (void)init;
  switch(content_type) {
    case STYLESHEET:
      actions_ = actionsBase;
      break;
    case PROPERTIES:
      actions_ = actionsStyleAttribute;
      break;
    case PROPERTY_VALUE:
      actions_ = actionsPropVal;
      prop_name_ = rc_qname::atom(ID_width);
      break;
  }
}


rc_list<rc_ref<CSSValue>> Parser::extract_vals(
    const rc_qname& sep, size_t index) {
  std::vector<rc_ref<CSSValue>> arr;
  while (true) {
    arr.push_back(rc_cast<rc_ref<CSSValue>>(val_stack_[index++]));
    if (index == val_stack_.size())
      break;
    assert (val_stack_[index++] == sep);
  }
  return rc_list<rc_ref<CSSValue>>(arr);
};

rc_ref<CSSValue> Parser::val_stack_reduce(const rc_qname& sep) {
  // First, combine all space-separated values into SpaceList
  size_t index = val_stack_.size();
  rc_value v;
  do {
    v = val_stack_[--index];
    if (v->is<rc_qname>()) {
      ++index;
      break;
    }
  }
  while (index > 0);
  size_t count = val_stack_.size() - index;
  if (count > 1) {
    rc_list<rc_value> val_list(val_stack_, index, count);
    val_stack_.resize(index);
    val_stack_.push_back(new CSSSpaceList(
        *reinterpret_cast<rc_list<rc_ref<CSSValue>>*>(&val_list)));
  }
  if (sep == rc_qname::atom(ID_comma))
    return rc_ref<CSSValue>();
  // Second, combine all comma-separated values into CommaList
  rc_value::kill(&v);
  while (index > 0) {
    v = val_stack_[--index];
    if (v->is<rc_qname>() && v != rc_qname::atom(ID_comma)) {
      ++index;
      break;
    }
  }
  count = val_stack_.size() - index;
  if (v == rc_qname::atom(ID_open_parenthesis)) {
    if (sep != rc_qname::atom(ID_close_parenthesis)) {
      handler_->error("E_CSS_MISMATCHED_C_PAR");
      actions_ = actionsErrorDecl;
      return rc_ref<CSSValue>();
    }
    rc_qname func_name = rc_cast<rc_qname>(val_stack_[index - 2]);
    rc_list<rc_ref<CSSValue>> args =
        extract_vals(rc_qname::atom(ID_comma), index);
    rc_ref<CSSFunction> func = new CSSFunction(func_name, args);
    val_stack_.resize(index - 2);
    val_stack_.push_back(func);
    return rc_ref<CSSValue>();
  }
  if (sep != rc_qname::atom(ID_semicolon) || index > 0) {
    handler_->error("E_CSS_UNEXPECTED_VAL_END");
    actions_ = actionsErrorDecl;
    return rc_ref<CSSValue>();
  }
  if (count > 1) {
    return new CSSCommaList(extract_vals(rc_qname::atom(ID_comma), index));
  }
  return rc_cast<rc_ref<CSSValue>>(val_stack_[0]);
}

void Parser::expr_error(const rc_string& mnemonics) {
	actions_ = prop_name_.empty() ? actionsErrorDecl : actionsError;
  handler_->error(mnemonics);
}

// Reduce the stack for a ')' (final is false) or when othe end delimiter is
// encounterd (final is true).
bool Parser::expr_stack_close(bool final) {
  expr_stack_reduce(TT_C_PAR);
  rc_value val = val_stack_.back();
  val_stack_.pop_back();
  rc_value tok = val_stack_.back();
  val_stack_.pop_back();
  if (!val->is<rc_ref<expr::Expr>>()) {
    expr_error("E_CSS_EXPR_SYNTAX");
    return false;
  }
  std::vector<rc_ref<expr::Expr>> args;  // in reverse order
  args.push_back(rc_cast<rc_ref<expr::Expr>>(val));
  while (tok == rc_integer(TT_COMMA)) {
    val = val_stack_.back();
    val_stack_.pop_back();
    if (!val->is<rc_ref<expr::Expr>>()) {
      expr_error("E_CSS_EXPR_SYNTAX");
      return false;
    }
    args.push_back(rc_cast<rc_ref<expr::Expr>>(val));
    tok = val_stack_.back();
    val_stack_.pop_back();
  }
  if (tok->is<rc_qname>()) {
    if (rc_cast<rc_qname>(tok)->id() == ID_open_brace) {
      // reached CSS portion of the stack
      while (args.size() >= 2) {
        rc_ref<expr::Expr> e1 = args.back();
        args.pop_back();
        rc_ref<expr::Expr> e2 = args.back();
        args.back() = new expr::ExprOrMedia(e1, e2);
      }
      val_stack_.push_back(new CSSExpr(args[0], handler_->scope().ptr()));
      return true;
    }
    expr_error("F_UNEXPECTED_STATE_C_PAR");
    return false;
  }
  if (!final && tok == rc_integer(TT_O_PAR)) {
    // call or arglist
    std::reverse(args.begin(), args.end());
    rc_list<rc_ref<expr::Expr>> list(args);
    if (val_stack_.back()->is<rc_ref<expr::Expr>>()) {
      val_stack_.back() = new expr::ExprCall(
          rc_cast<rc_ref<expr::Expr>>(val_stack_.back()), list);
    } else {
      if (list->size() == 1) {
        val_stack_.push_back(list[0]);
      } else {
        val_stack_.push_back(list);
      }
    }
    return false;
  }
  expr_error("E_CSS_EXPR_SYNTAX");
  return false;
}

void Parser::expr_stack_reduce(TokenType op) {
  rc_value v = val_stack_.back();
  val_stack_.pop_back();
  while (true) {
    rc_value tok = val_stack_.back();
    val_stack_.pop_back();
    if (tok->is<rc_qname>()) {
      // reached CSS portion of the stack or '(', quit the loop
      val_stack_.push_back(tok);
      break;
    }
    if (!tok->is<rc_integer>()) {
      expr_error("F_UNEXPECTED_STATE_TOK");
      return;
    }
    int tok_int = rc_cast<rc_integer>(tok)->value();
    if (tok_int < 0) {
      if (!v->is<rc_ref<expr::Expr>>()) {
        expr_error("E_CSS_EXPR_SYNTAX");
        return;
      }
      rc_ref<expr::Expr> exprval = rc_cast<rc_ref<expr::Expr>>(v);
      // prefix
      if (tok_int == -TT_BANG) {
        v = new expr::ExprNot(exprval);
      } else if (tok_int == -TT_MINUS) {
        v = new expr::ExprNegate(exprval);
      } else {
        expr_error("F_UNEXPECTED_STATE");
        return;
      }
    }
    // infix or '('
    if (tok_int == TT_O_PAR || priority[op] > priority[tok_int]) {
      val_stack_.push_back(tok);
      break;
    }
    if (!v->is<rc_ref<expr::Expr>>()) {
      expr_error("E_CSS_EXPR_SYNTAX");
      return;
    }
    rc_ref<expr::Expr> val = rc_cast<rc_ref<expr::Expr>>(v);
    rc_value v2 = val_stack_.back();
    val_stack_.pop_back();
    if (tok_int == TT_EQ_GT) {
      if (v2->is<rc_ref<expr::ExprNamed>>()) {
        rc_qname fname = static_cast<expr::ExprNamed*>(v2.raw_ptr())->name();
        v = new expr::ExprLambda(val, rc_list<rc_qname>::of(fname));
      } else if (v2->is<rc_list<rc_value>>()) {
        std::vector<rc_qname> formals;
        for (const rc_value& a : rc_cast<rc_list<rc_value>>(v2)) {
          rc_qname fname = static_cast<expr::ExprNamed*>(a.raw_ptr())->name();
          formals.push_back(fname);
        }
        v = new expr::ExprLambda(val, rc_list<rc_qname>(formals));
      } else {
        expr_error("E_CSS_EXPR_LAMBDA");
        return;
      }
      continue;
    }
    if (!v2->is<rc_ref<expr::Expr>>()) {
      expr_error("E_CSS_EXPR_SYNTAX");
      return;
    }
    rc_ref<expr::Expr> val2 = rc_cast<rc_ref<expr::Expr>>(v2);
    switch (tok_int) {
      case TT_SEMICOL: {
        if (val->is<rc_ref<expr::ExprMediaTest>>()) {
          // don't reduce
          val_stack_.push_back(val2);
          val_stack_.push_back(tok);
          val_stack_.push_back(val);
          return;
        }
        std::map<rc_qname, rc_ref<expr::Expr>> defs;
        while(true) {
          if (!v2->is<rc_ref<expr::ExprMediaTest>>()) {
            expr_error("E_CSS_EXPR_SYNTAX");
            return;
          }
          rc_ref<expr::ExprMediaTest> mt =
              rc_cast<rc_ref<expr::ExprMediaTest>>(v2);
          defs[mt->name()] = mt->value();
          if (val_stack_.back() != rc_integer(TT_SEMICOL)) {
            break;
          }
          val_stack_.pop_back();
          v2 = val_stack_.back();
          val_stack_.pop_back();
        }
        v = new expr::ExprBlock(val, rc_map<rc_ref<expr::Expr>>(defs));
        continue;
      }
      case TT_AMP_AMP:
        v = new expr::ExprAnd(val2, val);
        break;
      case TT_MEDIA_AND:
        v = new expr::ExprAndMedia(val2, val);
        break;
      case TT_BAR_BAR:
        v = new expr::ExprOr(val2, val);
        break;
      case TT_LT:
        v = new expr::ExprLt(val2, val);
        break;
      case TT_GT:
        v = new expr::ExprGt(val2, val);
        break;
      case TT_LT_EQ:
        v = new expr::ExprLe(val2, val);
        break;
      case TT_GT_EQ:
        v = new expr::ExprGe(val2, val);
        break;
      case TT_EQ:
      case TT_EQ_EQ:
        v = new expr::ExprEq(val2, val);
        break;
      case TT_BANG_EQ:
        v = new expr::ExprNe(val2, val);
        break;
      case TT_PLUS:
        v = new expr::ExprAdd(val2, val);
        break;
      case TT_MINUS:
        v = new expr::ExprSubtract(val2, val);
        break;
      case TT_STAR:
        v = new expr::ExprMultiply(val2, val);
        break;
      case TT_SLASH:
        v = new expr::ExprDivide(val2, val);
        break;
      case TT_PERCENT:
        v = new expr::ExprModulo(val2, val);
        break;
      case TT_COLON:
        if (!val_stack_.empty()) {
          if (val_stack_.back()->is<rc_integer>()
              && rc_cast<rc_integer>(val_stack_.back())->value() == TT_QMARK) {
            val_stack_.pop_back();
            if (!val_stack_.back()->is<rc_ref<expr::Expr>>()) {
              expr_error("E_CSS_EXPR_COND");
              return;
            }
            v = new expr::ExprCond(
                    rc_cast<rc_ref<expr::Expr>>(val_stack_.back()), val2, val);
            val_stack_.pop_back();
          } else if (val2->is<rc_ref<expr::ExprMediaName>>()) {
            v = new expr::ExprMediaTest(
                rc_cast<rc_ref<expr::ExprMediaName>>(val2), val);
          } else if (val2->is<rc_ref<expr::ExprNamed>>()) {
            rc_qname name = rc_cast<rc_ref<expr::ExprNamed>>(val2)->name();
            v = new expr::ExprMediaTest(new expr::ExprMediaName(false, name),
                val);
          } else {
            expr_error("E_CSS_EXPR_COLON");
            return;
          }
        }
        break;
      case TT_QMARK:
        if (op != TT_COLON) {
          expr_error("E_CSS_EXPR_COND");
          return;
        }
        // Fall through
      case TT_COMMA:
      case TT_O_PAR:
        // don't reduce
        val_stack_.push_back(val2);
        val_stack_.push_back(tok);
        val_stack_.push_back(val);
        return;
      default:
        expr_error("F_UNEXPECTED_STATE");
        return;
      }
  }
  val_stack_.push_back(v);
  return;
};

rc_list<rc_value> Parser::read_pseudo_params() {
	std::vector<rc_value> arr;
	while (true) {
		const Token& token = tokenizer_.token();
		switch (token.type()) {
      case TT_IDENT:
        arr.push_back(token.text());
        break;
      case TT_PLUS:
        arr.push_back(rc_qname::atom(ID_plus));
        break;
      case TT_NUM:
      case TT_INT:
        arr.push_back(rc_real(token.num()));
        break;
      default:
        return rc_list<rc_value>(arr);
		}
		tokenizer_.consume();
	}
}

rc_ref<CSSExpr> Parser::make_condition(
    const rc_string& classes, const rc_string&media) {
	rc_ref<expr::Scope> scope = handler_->scope();
	if (scope.is_null())
		return rc_ref<CSSExpr>();
	rc_ref<expr::Expr> condition = expr::common().v_true;
	if (!classes.is_null()) {
		std::vector<rc_string> class_list = classes->split_at_whitespace();
		for (const rc_string& class_name : class_list) {
      if (class_name == "vertical") {
        condition = condition && new expr::ExprNegate(
            new expr::ExprNamed(rc_qname::atom(ID_pref_horizontal)));
      } else if (class_name == "horizontal") {
        condition = condition &&
            new expr::ExprNamed(rc_qname::atom(ID_pref_horizontal));
      } else if (class_name == "day") {
        condition = condition && new expr::ExprNegate(
            new expr::ExprNamed(rc_qname::atom(ID_pref_night_mode)));
      } else if (class_name == "night") {
        condition = condition &&
            new expr::ExprNamed(rc_qname::atom(ID_pref_night_mode));
      } else {
        condition = expr::common().v_false;
      }
		}
	}
  // TODO: media
	if (condition.ptr() == expr::common().v_true.ptr()) {
		return rc_ref<CSSExpr>();
	}
	return new CSSExpr(condition, handler_->scope().ptr());
}

bool Parser::inside_property_only_rule() {
  if (rule_stack_.empty()) {
    return false;
  }
	switch (rule_stack_.top()->id()) {
    case ID_EMPTY:  // [selector]
    case ID_font_face:
    case ID_epubx_flow:
    case ID_epubx_viewport:
    case ID_epubx_define:
    case ID_adapt_footnote_area:
      return true;
	}
	return false;
}

/**
 * @param {number} count
 * @param {boolean} parsingStyleAttr
 * @return {boolean}
 */
bool Parser::run_parser(int count) {
  for(; count > 0; --count) {
    const Token& token = tokenizer_.token();
    switch (actions_[token.type()]) {
      case PA_IDENT: {
        // figure out if this is a property assignment or selector
        if (tokenizer_.nth_token(1).type() != TT_COLON) {
          // cannot be property assignment
          if (inside_property_only_rule()) {
            tokenizer_.consume();
            handler_->error("E_CSS_COLON_EXPECTED");
            actions_ = actionsErrorDecl;
          } else {
            actions_ = actionsSelectorStart;
            handler_->start_selector_rule();
          }
          continue;
        }
        const Token& token1 = tokenizer_.nth_token(2);
        if (token1.preceded_by_space()
            || (token1.type() != TT_IDENT && token1.type() != TT_FUNC)) {
          // cannot be a selector
        } else {
          // can be either a selector or a property assignment
          tokenizer_.mark();
        }
        // Prepare to parse property value.
        prop_name_ = rc_qname(token.text());
        prop_important_ = false;
        tokenizer_.consume();
        tokenizer_.consume();
        actions_ = actionsPropVal;
        val_stack_.clear();
        continue;
      }
      case PA_PROP:
        // figure out if this is a property assignment or selector
        if (tokenizer_.nth_token(1).type() != TT_COLON) {
          // cannot be property assignment
          actions_ = actionsErrorDecl;
          tokenizer_.consume();
          handler_->error("E_CSS_COLON_EXPECTED");
          continue;
        }
        prop_name_ = rc_qname(token.text());
        prop_important_ = false;
        tokenizer_.consume();
        tokenizer_.consume();
        actions_ = actionsPropVal;
        val_stack_.clear();
        continue;
      case PA_SELECTOR_START:
        // don't consume, process again
        actions_ = actionsSelectorStart;
        handler_->start_selector_rule();
        continue;
      case PA_SELECTOR_NAME_1:
        if (!token.preceded_by_space()) {
          actions_ = actionsErrorSelector;
          handler_->error("E_CSS_SPACE_EXPECTED");
          continue;
        }
        handler_->descendant_selector();
        // fall through
      case PA_SELECTOR_NAME: {
        if (tokenizer_.nth_token(1).type() == TT_BAR) {
          auto ns = prefix_to_ns_.find(token.text());
          tokenizer_.consume();
          tokenizer_.consume();
          if (ns == prefix_to_ns_.end()) {
            actions_ = actionsError;
            handler_->error("E_CSS_UNDECLARED_PREFIX");
          } else {
            const Token& token = tokenizer_.token();
            switch (token.type()) {
              case TT_IDENT:
                handler_->tag_selector(rc_qname(ns->second,
                    token.text()));
                actions_ = actionsSelector;
                tokenizer_.consume();
                break;
             case TT_STAR:
                handler_->tag_selector(rc_qname(ns->second,
                    rc_qname::atom(ID_asterisk)->to_string()));
                actions_ = actionsSelector;
                tokenizer_.consume();
                break;
              default:
                actions_ = actionsError;
                handler_->error("E_CSS_NAMESPACE");
            }
          }
        } else {
          handler_->tag_selector(rc_qname(default_ns_, token.text()));
          actions_ = actionsSelector;
          tokenizer_.consume();
        }
        continue;
      }
      case PA_SELECTOR_ANY_1:
        if (!token.preceded_by_space()) {
          actions_ = actionsErrorSelector;
          handler_->error("E_CSS_SPACE_EXPECTED");
          continue;
        }
        handler_->descendant_selector();
        // fall through
      case PA_SELECTOR_ANY:
        if (tokenizer_.nth_token(1).type() == TT_BAR) {
          tokenizer_.consume();
          tokenizer_.consume();
          const Token& token = tokenizer_.token();
          switch (token.type()) {
            case TT_IDENT:
              handler_->tag_selector(rc_qname(
                  rc_qname::atom(ID_asterisk), token.text()));
              actions_ = actionsSelector;
              tokenizer_.consume();
              break;
            case TT_STAR:
              handler_->tag_selector(rc_qname(
                  rc_qname::atom(ID_asterisk),
                  rc_qname::atom(ID_asterisk)->to_string()));
              actions_ = actionsSelector;
              tokenizer_.consume();
              break;
            default:
              actions_ = actionsError;
              handler_->error("E_CSS_NAMESPACE");
          }
        } else {
          rc_qname(rc_qname(default_ns_,
              rc_qname::atom(ID_asterisk)->to_string()));
          actions_ = actionsSelector;
          tokenizer_.consume();
        }
        continue;
      case PA_SELECTOR_ID_1:
        if (token.preceded_by_space())
          handler_->descendant_selector();
        // fall through
      case PA_SELECTOR_ID:
        handler_->id_selector(rc_qname(token.text()));
        actions_ = actionsSelector;
        tokenizer_.consume();
        continue;
      case PA_SELECTOR_CLASS_1:
        if (token.preceded_by_space())
          handler_->descendant_selector();
        // fall through
      case PA_SELECTOR_CLASS:
        handler_->class_selector(rc_qname(token.text()));
        actions_ = actionsSelector;
        tokenizer_.consume();
        continue;
      case PA_SELECTOR_PSEUDOCLASS_1:
        if (token.preceded_by_space())
          handler_->descendant_selector();
        // fall through
      case PA_SELECTOR_PSEUDOCLASS: {
        tokenizer_.consume();
        const Token& token = tokenizer_.token();
        switch (token.type()) {
          case TT_IDENT:
            handler_->pseudoclass_selector(rc_qname(token.text()),
                rc_list<rc_value>::empty());
            tokenizer_.consume();
            actions_ = actionsSelector;
            continue;
          case TT_FUNC: {
            rc_qname name = rc_qname(token.text());
            tokenizer_.consume();
            rc_list<rc_value> params = read_pseudo_params();
            const Token& token = tokenizer_.token();
            if (token.type() == TT_C_PAR) {
              handler_->pseudoclass_selector(name, params);
              tokenizer_.consume();
              actions_ = actionsSelector;
              continue;
            }
            break;
          }
          default: ;
            // fall through to handle the error
        }
        handler_->error("E_CSS_PSEUDOCLASS_SYNTAX");
        actions_ = actionsError;
        continue;
      }
      case PA_SELECTOR_PSEUDOELEM: {
        tokenizer_.consume();
        const Token& token = tokenizer_.token();
        switch (token.type()) {
          case TT_IDENT:
            handler_->pseudoelement_selector(rc_qname(token.text()),
                rc_list<rc_value>::empty());
            actions_ = actionsSelector;
            tokenizer_.consume();
            continue;
          case TT_FUNC: {
            rc_qname name = rc_qname(token.text());
            tokenizer_.consume();
            rc_list<rc_value> params = read_pseudo_params();
            const Token& token = tokenizer_.token();
            if (token.type() == TT_C_PAR) {
              handler_->pseudoelement_selector(name, params);
              actions_ = actionsSelector;
              tokenizer_.consume();
              continue;
            }
            break;
          }
          default: ;
            // fall through to handle the error
        }
        handler_->error("E_CSS_PSEUDOELEM_SYNTAX");
        actions_ = actionsError;
        continue;
      }
      case PA_SELECTOR_ATTR_1:
        if (token.preceded_by_space())
          handler_->descendant_selector();
        // fall through
      case PA_SELECTOR_ATTR: {
        tokenizer_.consume();
        const Token& token = tokenizer_.token();
        rc_string text;
        switch (token.type()) {
          case TT_IDENT:
            text = token.text();
            tokenizer_.consume();
            break;
          case TT_STAR:
            tokenizer_.consume();
            break;
          case TT_BAR:
            break;
          default:
            actions_ = actionsErrorSelector;
            handler_->error("E_CSS_ATTR");
            tokenizer_.consume();
            continue;
        }
        rc_qname ns;
        if (tokenizer_.token().type() == TT_BAR) {
          if (!text->empty()) {
            auto it = prefix_to_ns_.find(text);
            if (it == prefix_to_ns_.end()) {
              actions_ = actionsErrorSelector;
              handler_->error("E_CSS_UNDECLARED_PREFIX");
              tokenizer_.consume();
              continue;
            }
            ns = it->second;
          }
          tokenizer_.consume();
          const Token& token = tokenizer_.token();
          if (token.type() != TT_IDENT) {
            actions_ = actionsErrorSelector;
            handler_->error("E_CSS_ATTR_NAME_EXPECTED");
            continue;
          }
          text = token.text();
          tokenizer_.consume();
        }
        TokenType op = TT_EOF;
        switch (tokenizer_.token().type()) {
          case TT_EQ:
          case TT_TILDE_EQ:
          case TT_BAR_EQ:
          case TT_STAR_EQ:
          case TT_COL_COL:
            op = token.type();
            tokenizer_.consume();
            break;
          case TT_C_BRK:
            handler_->attribute_selector(rc_qname(ns, text), TT_EOF,
                rc_string::empty_string());
            actions_ = actionsSelector;
            tokenizer_.consume();
            continue;
          default:
            actions_ = actionsErrorSelector;
            handler_->error("E_CSS_ATTR_OP_EXPECTED");
            continue;
        }
        switch (tokenizer_.token().type()) {
          case TT_IDENT:
          case TT_STR:
            handler_->attribute_selector(rc_qname(ns, text), op,
                tokenizer_.token().text());
            tokenizer_.consume();
            break;
          default:
            actions_ = actionsErrorSelector;
            handler_->error("E_CSS_ATTR_VAL_EXPECTED");
            continue;
        }
        if (tokenizer_.token().type() != TT_C_BRK) {
          actions_ = actionsErrorSelector;
          handler_->error("E_CSS_ATTR");
          continue;
        }
        actions_ = actionsSelector;
        tokenizer_.consume();
        continue;
      }
      case PA_SELECTOR_CHILD:
        handler_->child_selector();
        actions_ = actionsSelectorCont;
        tokenizer_.consume();
        continue;
      case PA_SELECTOR_SIBLING:
        handler_->adjacent_sibling_selector();
        actions_ = actionsSelectorCont;
        tokenizer_.consume();
        continue;
      case PA_SELECTOR_FOLLOWING_SIBLING:
        handler_->following_sibling_selector();
        actions_ = actionsSelectorCont;
        tokenizer_.consume();
        continue;
      case PA_SELECTOR_BODY:
        if (region_rule_) {
          rule_stack_.push(rc_qname::atom(ID_epubx_region));
          region_rule_ = false;
        } else {
          rule_stack_.push(rc_qname::atom(ID_EMPTY));
        }
        handler_->start_rule_body();
        actions_ = actionsBase;
        tokenizer_.consume();
        continue;
      case PA_SELECTOR_NEXT:
        handler_->next_selector();
        actions_ = actionsSelectorStart;
        tokenizer_.consume();
        continue;
      case PA_VAL_IDENT:
        val_stack_.push_back(new CSSIdent(rc_qname(token.text())));
        tokenizer_.consume();
        continue;
      case PA_VAL_HASH: {
        rc_ref<CSSValue> color = CSSColor::color_from_hash(token.text());
        if (!color.is_null()) {
          val_stack_.push_back(std::move(color));
          tokenizer_.consume();
          continue;
        }
        handler_->error("E_CSS_COLOR");
        tokenizer_.consume();
        actions_ = actionsError;
        continue;
      }
      case PA_VAL_NUM:
        val_stack_.push_back(new CSSNumber(token.num()));
        tokenizer_.consume();
        continue;
      case PA_VAL_INT:
        val_stack_.push_back(new CSSInteger(token.num()));
        tokenizer_.consume();
        continue;
      case PA_VAL_NUMERIC:
        val_stack_.push_back(
            new CSSNumeric(token.num(), rc_qname(token.text())));
        tokenizer_.consume();
        continue;
      case PA_VAL_STR:
        val_stack_.push_back(new CSSString(token.text()));
        tokenizer_.consume();
        continue;
      case PA_VAL_URL:
        val_stack_.push_back(new CSSUrl(resolve_url(base_url_, token.text())));
        tokenizer_.consume();
        continue;
      case PA_VAL_COMMA:
        val_stack_reduce(rc_qname::atom(ID_comma));
        val_stack_.push_back(rc_qname::atom(ID_comma));
        tokenizer_.consume();
        continue;
      case PA_VAL_SLASH:
        val_stack_.push_back(CSSSlash::instance());
        tokenizer_.consume();
        continue;
      case PA_VAL_FUNC: {
        rc_qname name = rc_qname(token.text()->to_lower_ascii());
        if (name->id() == ID_epubx_expr) {
          // special case
          actions_ = actionsExprVal;
          expr_syntax_context_ = PROPERTY;
          val_stack_.push_back(rc_qname::atom(ID_open_brace));
        } else {
          val_stack_.push_back(name);
          val_stack_.push_back(rc_qname::atom(ID_open_parenthesis));
        }
        tokenizer_.consume();
        continue;
      }
      case PA_VAL_C_PAR:
        val_stack_reduce(rc_qname::atom(ID_close_parenthesis));
        tokenizer_.consume();
        continue;
      case PA_VAL_BANG: {
        tokenizer_.consume();
        const Token& token1 = tokenizer_.nth_token(1);
        const Token& token = tokenizer_.token();
        if (token.type() == TT_IDENT
            && token.text()->to_lower_ascii() == "important"
            && (token1.type() == TT_SEMICOL || token1.type() == TT_EOF
               || token1.type() == TT_C_BRC)) {
          tokenizer_.consume();
          prop_important_ = true;
          continue;
        }
        expr_error("E_CSS_SYNTAX");
        continue;
      }
      case PA_VAL_PLUS: {
        const Token& token1 = tokenizer_.nth_token(1);
        switch (token1.type()) {
          case TT_NUM:
          case TT_NUMERIC:
          case TT_INT:
            if (!token1.preceded_by_space()) {
              // Plus before number, ignore
              tokenizer_.consume();
              continue;
            }
            break;
          default:;
        }
        expr_error("E_CSS_UNEXPECTED_PLUS");
        continue;
      }
      case PA_VAL_END:
        tokenizer_.consume();
        // fall through
      case PA_VAL_BRC: {
        tokenizer_.unmark();
        rc_ref<CSSValue> val = val_stack_reduce(rc_qname::atom(ID_semicolon));
        if (!val.is_null() && !prop_name_.empty()) {
          handler_->property(prop_name_, val, prop_important_);
        }
        actions_ =
            content_type_ == PROPERTIES ? actionsStyleAttribute : actionsBase;
        continue;
      }
      case PA_VAL_FINISH: {
        tokenizer_.consume();
        tokenizer_.unmark();
        rc_ref<CSSValue> val = val_stack_reduce(rc_qname::atom(ID_semicolon));
        if (content_type_ == PROPERTY_VALUE) {
          result_ = val;
          return true;
        }
        if (!val.is_null() && !prop_name_.empty()) {
          handler_->property(prop_name_, val, prop_important_);
        }
        if (content_type_ == PROPERTIES) {
          return true;
        }
        expr_error("E_CSS_SYNTAX");
        continue;
      }
      case PA_EXPR_IDENT: {
        const Token& token1 = tokenizer_.nth_token(1);
        if (token1.type() == TT_CLASS) {
          rc_qname qname(token.text(), token1.text());
          if (tokenizer_.nth_token(2).type() == TT_O_PAR &&
              !tokenizer_.nth_token(2).preceded_by_space()) {
            val_stack_.push_back(new expr::ExprNamed(qname));
            val_stack_.push_back(rc_integer(TT_O_PAR));
            tokenizer_.consume();
          } else {
            val_stack_.push_back(new expr::ExprNamed(qname));
            actions_ = actionsExprOp;
          }
          tokenizer_.consume();
        } else {
          if (expr_syntax_context_ == MEDIA || expr_syntax_context_ == IMPORT) {
            if (token.text()->to_lower_ascii() == "not") {
              tokenizer_.consume();
              val_stack_.push_back(new expr::ExprMediaName(
                  true, rc_qname(token1.text())));
            } else {
              if (token.text()->to_lower_ascii() == "only") {
                tokenizer_.consume();
              }
              val_stack_.push_back(new expr::ExprMediaName(
                  false, rc_qname(tokenizer_.token().text())));
            }
          } else {
            val_stack_.push_back(new expr::ExprNamed(rc_qname(token.text())));
          }
          actions_ = actionsExprOp;
        }
        tokenizer_.consume();
        continue;
      }
      case PA_EXPR_FUNC:
        val_stack_.push_back(new expr::ExprNamed(rc_qname(token.text())));
        val_stack_.push_back(rc_integer(TT_O_PAR));
        tokenizer_.consume();
        continue;
      case PA_EXPR_NUM:
        val_stack_.push_back(new expr::ExprConst(rc_real(token.num())));
        tokenizer_.consume();
        actions_ = actionsExprOp;
        continue;
      case PA_EXPR_NUMERIC: {
        rc_qname unit(token.text()->to_lower_ascii());
        if (unit->id() == ID_percent) {
          if (prop_name_->to_string()->find_first("height") != rc_string::npos
              || prop_name_->id() == ID_top || prop_name_->id() == ID_bottom) {
            unit = rc_qname::atom(ID_vh);
          } else {
            unit = rc_qname::atom(ID_vw);
          }
        }
        val_stack_.push_back(new expr::ExprNumeric(token.num(), unit));
        tokenizer_.consume();
        actions_ = actionsExprOp;
        continue;
      }
      case PA_EXPR_STR:
        val_stack_.push_back(new expr::ExprConst(token.text()));
        tokenizer_.consume();
        actions_ = actionsExprOp;
        continue;
      case PA_EXPR_PARAM: {
        tokenizer_.consume();
        expr_error("E_CSS_SYNTAX");
        continue;
      }
      case PA_EXPR_PREFIX:
        val_stack_.push_back(rc_integer(-token.type()));
        tokenizer_.consume();
        continue;
      case PA_EXPR_INFIX:
        actions_ = actionsExprVal;
        expr_stack_reduce(token.type());
        val_stack_.push_back(rc_integer(token.type()));
        tokenizer_.consume();
        continue;
      case PA_EXPR_INFIX_NAME:
        if (token.text()->to_lower_ascii() == "and") {
          actions_ = actionsExprVal;
          expr_stack_reduce(TT_MEDIA_AND);
          val_stack_.push_back(rc_integer(TT_MEDIA_AND));
          tokenizer_.consume();
        } else {
          expr_error("E_CSS_SYNTAX");
        }
        continue;
      case PA_EXPR_C_PAR:
        if (expr_stack_close(false)) {
          if (!prop_name_.empty()) {
            actions_ = actionsPropVal;
          } else {
            expr_error("E_CSS_UNBALANCED_PAR");
          }
        }
        tokenizer_.consume();
        continue;
      case PA_EXPR_O_BRC:
        if (expr_stack_close(true)) {
          if (!prop_name_.empty() || expr_syntax_context_ == IMPORT) {
            expr_error("E_CSS_UNEXPECTED_BRC");
          } else {
            rc_ref<CSSExpr> cond = rc_cast<rc_ref<CSSExpr>>(val_stack_.back());
            val_stack_.pop_back();
            if (expr_syntax_context_ == WHEN) {
              handler_->start_when_rule(cond);
            } else {
              handler_->start_media_rule(cond);
            }
            rule_stack_.push(rc_qname::atom(ID_media));
            handler_->start_rule_body();
            actions_ = actionsBase;
          }
        }
        tokenizer_.consume();
        continue;
      case PA_EXPR_SEMICOL:
        if (!prop_name_.empty() || expr_syntax_context_ != IMPORT) {
          // Scoped definition op, same as infix.
          actions_ = actionsExprVal;
          expr_stack_reduce(token.type());
          val_stack_.push_back(rc_integer(TT_SEMICOL));
        } else {
          if (expr_stack_close(true)) {
            import_condition_ =
                rc_cast<rc_ref<CSSExpr>>(val_stack_.back())->expr();
            import_ready_ = true;
            actions_ = actionsBase;
          }
        }
        tokenizer_.consume();
        continue;
      case PA_EXPR_O_PAR:
        val_stack_.push_back(rc_integer(TT_O_PAR));
        tokenizer_.consume();
        continue;
      case PA_RULE_END:
        actions_ = actionsBase;
        tokenizer_.consume();
        handler_->end_rule();
        if (!rule_stack_.empty()) {
          rule_stack_.pop();
        }
        continue;
      case PA_AT: {
        rc_qname rule(token.text()->to_lower_ascii());
        switch (rule->id()) {
          case ID_import: {
            tokenizer_.consume();
            const Token& token = tokenizer_.token();
            if (token.type() == TT_STR || token.type() == TT_URL) {
              import_url_ = token.text();
              tokenizer_.consume();
              const Token& token1 = tokenizer_.token();
              if (token1.type() == TT_SEMICOL || token1.type() == TT_EOF) {
                import_ready_ = true;
                tokenizer_.consume();
                return false;
              } else {
                prop_name_ = rc_qname::atom(ID_EMPTY);  // signals at rule
                expr_syntax_context_ = IMPORT;
                actions_ = actionsExprVal;
                val_stack_.push_back(rc_qname::atom(ID_open_brace));
                continue;
              }
            }
            handler_->error("E_CSS_IMPORT_SYNTAX");
            actions_ = actionsError;
            continue;
          }
          case ID_namespace: {
            tokenizer_.consume();
            const Token& token = tokenizer_.token();
            switch (token.type()) {
              case TT_IDENT: {
                rc_string text = token.text();  // Prefix
                tokenizer_.consume();
                const Token& token = tokenizer_.token();
                if ((token.type() == TT_STR || token.type() == TT_URL)
                    && tokenizer_.nth_token(1).type() == TT_SEMICOL) {
                  prefix_to_ns_[text] = rc_qname(token.text());
                  tokenizer_.consume();
                  tokenizer_.consume();
                  continue;
                }
                break;
              }
              case TT_STR:
              case TT_URL:
                if (tokenizer_.nth_token(1).type() == TT_SEMICOL) {
                  default_ns_ = rc_qname(token.text());
                  tokenizer_.consume();
                  tokenizer_.consume();
                  continue;
                }
                break;
              default:;
            }
            handler_->error("E_CSS_NAMESPACE_SYNTAX");
            actions_ = actionsError;
            continue;
          }
          case ID_charset: {
            // Useless in EPUB (only UTF-8 or UTF-16 is allowed anyway).
            tokenizer_.consume();
            const Token& token = tokenizer_.token();
            if (token.type() == TT_STR &&
                tokenizer_.nth_token(1).type() == TT_SEMICOL) {
              rc_string text = token.text()->to_lower_ascii();
              if (text != "utf-8" && text != "utf-16") {
                handler_->error("E_CSS_UNEXPECTED_CHARSET");
              }
              tokenizer_.consume();
              tokenizer_.consume();
              continue;
            }
            handler_->error("E_CSS_CHARSET_SYNTAX");
            actions_ = actionsError;
            continue;
          }
          case ID_font_face:
          case ID_epubx_page_template:
          case ID_epubx_define:
          case ID_epubx_viewport:
            if (tokenizer_.nth_token(1).type() == TT_O_BRC) {
              tokenizer_.consume();
              tokenizer_.consume();
              switch (rule->id()) {
                case ID_font_face:
                  handler_->start_font_face_rule();
                  break;
                case ID_epubx_page_template:
                  handler_->start_page_template_rule();
                  break;
                case ID_epubx_define:
                  handler_->start_define_rule();
                  break;
                case ID_epubx_viewport:
                  handler_->start_viewport_rule();
                  break;
              }
              rule_stack_.push(rule);
              handler_->start_rule_body();
              continue;
            }
            break;
          case ID_adapt_footnote_area: {
            tokenizer_.consume();
            const Token& token = tokenizer_.token();
            switch (token.type()) {
              case TT_O_BRC:
                tokenizer_.consume();
                handler_->start_footnote_rule(rc_qname::atom(ID_EMPTY));
                rule_stack_.push(rule);
                handler_->start_rule_body();
                continue;
              case TT_COL_COL: {
                tokenizer_.consume();
                const Token& token = tokenizer_.token();
                if (token.type() == TT_IDENT &&
                    tokenizer_.nth_token(1).type() == TT_O_BRC) {
                  rc_string text = token.text();
                  tokenizer_.consume();
                  tokenizer_.consume();
                  handler_->start_footnote_rule(rc_qname(text));
                  rule_stack_.push(rule);
                  handler_->start_rule_body();
                  continue;
                }
                break;
              }
              default:;
            }
            break;
          }
          case ID_epubx_region:
            tokenizer_.consume();
            handler_->start_region_rule();
            region_rule_ = true;
            actions_ = actionsSelectorStart;
            continue;
          case ID_epubx_when:
            tokenizer_.consume();
            prop_name_ = rc_qname::atom(ID_EMPTY); // signals @ rule
            expr_syntax_context_ = WHEN;
            actions_ = actionsExprVal;
            val_stack_.push_back(rc_qname::atom(ID_open_brace));
            continue;
          case ID_media:
            tokenizer_.consume();
            prop_name_ = rc_qname::atom(ID_EMPTY); // signals @ rule
            expr_syntax_context_ = MEDIA;
            actions_ = actionsExprVal;
            val_stack_.push_back(rc_qname::atom(ID_open_brace));
            continue;
          case ID_epubx_flow:
            if (tokenizer_.nth_token(1).type() == TT_IDENT
                && tokenizer_.nth_token(2).type() == TT_O_BRC) {
              handler_->start_flow_rule(
                  rc_qname(tokenizer_.nth_token(1).text()));
              tokenizer_.consume();
              tokenizer_.consume();
              tokenizer_.consume();
              rule_stack_.push(rule);
              handler_->start_rule_body();
              continue;
            }
            break;
          case ID_epubx_page_master:
          case ID_epubx_partition:
          case ID_epubx_partition_group: {
            tokenizer_.consume();
            const Token* token_ptr = &tokenizer_.token();
            rc_qname rule_name;
            rc_qname rule_pseudo_name;
            std::vector<rc_qname> classes;
            if (token_ptr->type() == TT_IDENT) {
              rule_name = rc_qname(token_ptr->text());
              tokenizer_.consume();
              token_ptr = &tokenizer_.token();
            }
            if (token_ptr->type() == TT_COLON &&
                tokenizer_.nth_token(1).type() == TT_IDENT) {
              rule_pseudo_name = rc_qname(tokenizer_.nth_token(1).text());
              tokenizer_.consume();
              tokenizer_.consume();
              token_ptr = &tokenizer_.token();
            }
            while (token_ptr->type() == TT_FUNC
                   && token_ptr->text()->to_lower_ascii() == "class"
                   && tokenizer_.nth_token(1).type() == TT_IDENT
                   && tokenizer_.nth_token(2).type() == TT_C_PAR) {
              classes.push_back(rc_qname(tokenizer_.nth_token(1).text()));
              tokenizer_.consume();
              tokenizer_.consume();
              tokenizer_.consume();
              token_ptr = &tokenizer_.token();
            }
            if (token_ptr->type() == TT_O_BRC) {
              tokenizer_.consume();
              rc_list<rc_qname> class_list(classes);
              switch (rule->id()) {
                case ID_epubx_page_master:
                  handler_->start_page_master_rule(rule_name,
                      rule_pseudo_name, class_list);
                  break;
                case ID_epubx_partition:
                  handler_->start_partition_rule(rule_name,
                      rule_pseudo_name, class_list);
                  break;
                case ID_epubx_partition_group:
                  handler_->start_partition_group_rule(rule_name,
                      rule_pseudo_name, class_list);
                  break;
              }
              rule_stack_.push(rule);
              handler_->start_rule_body();
              continue;
            }
            break;
          }
					case ID_EMPTY:
						// No text after @
            handler_->error("E_CSS_UNEXPECTED_AT");
            // Error recovery using selector rules.
            actions_ = actionsErrorSelector;
						continue;
          default:
            handler_->error("E_CSS_AT_UNKNOWN");
            actions_ = actionsError;
            continue;
        }
        handler_->error("E_CSS_AT_SYNTAX");
        actions_ = actionsError;
        continue;
      }
      case PA_ERROR_PUSH:  // Open bracket while skipping error syntax
        if (content_type_ != STYLESHEET)
          return true;
        error_brackets_.push_back(token.type() + 1);  // Expected closing bracket
        tokenizer_.consume();
        continue;
      case PA_ERROR_POP_DECL:  // Close bracket while skipping error syntax in declaration
        if (content_type_ != STYLESHEET)
          return true;
        if (error_brackets_.empty()) {
          actions_ = actionsBase;
          // Don't consume closing brace
          continue;
        }
        // fall through
      case PA_ERROR_POP:  // Close bracket while skipping error syntax
        if (!error_brackets_.empty()
            && error_brackets_.back() == token.type()) {
          error_brackets_.pop_back();
        }
        if (error_brackets_.empty() && token.type() == TT_C_BRC) {
          actions_ = actionsBase;
        }
        tokenizer_.consume();
        continue;
      case PA_ERROR_SEMICOL:
        if (content_type_ != STYLESHEET)
          return true;
        if (error_brackets_.empty()) {
          actions_ = actionsBase;
        }
        tokenizer_.consume();
        continue;
      case PA_DONE:
        return true;
      default:
        if (content_type_ != STYLESHEET)
          return true;
        if (actions_ == actionsPropVal && tokenizer_.has_mark()) {
          tokenizer_.reset();
          actions_ = actionsSelectorStart;
          handler_->start_selector_rule();
          continue;
        }
        if (actions_ != actionsError && actions_ != actionsErrorSelector
            && actions_ != actionsErrorDecl) {
          if (token.type() == TT_INVALID)
            handler_->error(token.text());
          else
            handler_->error("E_CSS_SYNTAX");
          if (inside_property_only_rule()) {
            actions_ = actionsErrorDecl;
          } else {
            actions_ = actionsErrorSelector;
          }
          continue;  // Let error-recovery to re-process the offending token
        }
        tokenizer_.consume();
        continue;
    }
    break;
  }
  return false;  // Not done yet.
};

}
}


