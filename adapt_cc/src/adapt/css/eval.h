#ifndef adapt_css_eval_h
#define adapt_css_eval_h

#include "adapt/css/value.h"

namespace adapt {
namespace css {

rc_ref<CSSValue> evaluate(expr::Context* context, expr::Scope* scope,
    const rc_ref<expr::Expr>& val, const rc_qname& prop_name);

rc_ref<CSSValue> evaluate(expr::Context* context, const rc_ref<CSSValue>& val,
    const rc_qname& prop_name);

}
}

#endif
