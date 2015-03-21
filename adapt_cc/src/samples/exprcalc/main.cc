#include <stdio.h>

#include "adapt/base/writer.h"
#include "adapt/expr/expr.h"
#include "adapt/css/parsing.h"

class MyContext : public adapt::expr::Context {
 public:
  virtual double query_unit_size(const adapt::rc_qname& unit) {
    return 1;
  }
  virtual adapt::rc_value query_context_data(const adapt::rc_qname& key) {
    return adapt::rc_value();
  }
};

int main(int argc, char** argv) {
  char buffer[2048];
  adapt::rc_ref<adapt::expr::StaticScope> scope =
      new adapt::expr::StaticScope(adapt::expr::Scope::common().scope, 1, true);
  while (true) {
    adapt::StringWriter w;
    printf("expr: ");
    fflush(stdout);
    while (fgets(buffer, sizeof buffer, stdin)) {
      if (buffer[0] < ' ') {
        break;
      }
      w << static_cast<const char*>(buffer);
      printf("expr> ");
      fflush(stdout);
    }
    scope->reset_resolve_queue();
    adapt::rc_ref<adapt::expr::Expr> expr =
        adapt::css::parse_expr(scope, w.to_string());
    if (expr.is_null()) {
      fprintf(stderr, "Failed to parse\n");
      continue;
    }
    if (expr->is<adapt::rc_ref<adapt::expr::ExprMediaTest>>()) {
      adapt::expr::ExprMediaTest* mt =
          static_cast<adapt::expr::ExprMediaTest*>(expr.ptr());
      scope->define_name(mt->name(), mt->value());
      scope->resolve_queued();
    } else {
      scope->resolve_queued();
      MyContext context;
      adapt::rc_value result = expr->evaluate(&context, scope->frames());
      if (result.is_null()) {
        fprintf(stderr, "Failed to evaluate\n");
        continue;
      }
      printf("Result: %s\n", result->to_string()->utf8());
    }
  }
}