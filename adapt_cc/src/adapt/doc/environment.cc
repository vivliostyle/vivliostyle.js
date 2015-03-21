#include "adapt/doc/environment.h"

#include "adapt/base/rc_primitive.h"
#include "adapt/base/rc_string.h"

namespace adapt {
namespace doc {

namespace {

class RootVariable : public expr::AbstractPartial {
 public:
  virtual void write_to(Writer* writer) const override {
    *writer << name();
  }

  rc_ref<Environment> environment(expr::Context* context) const {
    return rc_cast<rc_ref<Environment>>(
        context->query_context_data(rc_qname::atom(ID_PRIVATE_environment)));
  }

  virtual const rc_qname& name() const = 0;

  void define_in_scope(expr::Scope* scope) {
    scope->define_name(name(), new expr::ExprConst(this));
  }
};

class RootPageWidth : public RootVariable {
 public:
  virtual const rc_qname& name() const override {
    return rc_qname::atom(ID_page_width);
  }

  virtual rc_value apply(expr::Context* context) override {
    return rc_real(environment(context)->width);
  }
};

class RootPageHeight : public RootVariable {
 public:
  virtual const rc_qname& name() const override {
    return rc_qname::atom(ID_page_height);
  }

  virtual rc_value apply(expr::Context* context) override {
    return rc_real(environment(context)->height);
  }
};

}

rc_ref<expr::Scope> create_root_scope() {
  rc_ref<expr::Scope> scope = new expr::Scope(expr::common().scope,
      expr::Scope::ROOT_KEY);
  (new RootPageWidth())->define_in_scope(scope.ptr());
  (new RootPageHeight())->define_in_scope(scope.ptr());
  return scope;
}

}
}
