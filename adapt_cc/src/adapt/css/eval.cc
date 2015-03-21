#include "adapt/css/eval.h"

#include <unordered_set>

#include "adapt/base/rc_primitive.h"
#include "adapt/css/value.h"
#include "adapt/css/parsing.h"

namespace adapt {
namespace css {

namespace {

const std::unordered_set<rc_qname>& number_properties() {
  static std::unordered_set<rc_qname> map = {
    rc_qname::atom(ID_z_index),
    rc_qname::atom(ID_column_count),
    rc_qname::atom(ID_flow_linger),
    rc_qname::atom(ID_opacity),
    rc_qname::atom(ID_page),
    rc_qname::atom(ID_flow_priority),
    rc_qname::atom(ID_utilization)
  };
  return map;
}

}

rc_ref<CSSValue> evaluate(expr::Context* context, expr::Scope* scope,
    const rc_ref<expr::Expr>& val, const rc_qname& prop_name) {
  // TODO: validate
  rc_value result = val->evaluate(context, scope->frames());
  if (result.is_null()) {
    return CSSEmpty::instance();
  }
  double value;
  switch (result->kind()) {
    default:
      result = result->to_string();
      // fall through
    case rc_string::KIND:
      // TODO: where baseURL should come from???
      return parse_value(scope, rc_cast<rc_string>(result), rc_string());
    case rc_boolean::KIND :
      return rc_cast<rc_boolean>(result)->value()
          ? CSSIdent::ident_true() : CSSIdent::ident_false();
    case rc_real::KIND:
      value = rc_cast<rc_real>(result)->value();
      break;
    case rc_integer::KIND:
      value = rc_cast<rc_integer>(result)->value();
      break;
  }
  const std::unordered_set<rc_qname>& np = number_properties();
  if (np.find(prop_name) != np.end()) {
    if (value == static_cast<int>(round(value))) {
      return new CSSInteger(static_cast<int>(value));
    } else {
      return new CSSNumber(value);
    }
  } else {
    return new CSSNumeric(value, rc_qname::atom(ID_px));
  }
}

rc_ref<CSSValue> evaluate(expr::Context* context, const rc_ref<CSSValue>& val,
    const rc_qname& prop_name) {
  if (val->is<rc_ref<CSSExpr>>()) {
    CSSExpr* css_expr = static_cast<CSSExpr*>(val.ptr());
    return evaluate(context, css_expr->scope().ptr(),
        css_expr->expr(), prop_name);
  }
  return val;
}

}
}
