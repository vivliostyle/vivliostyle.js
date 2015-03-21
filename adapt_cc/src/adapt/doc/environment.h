#ifndef adapt_doc_environment_h
#define adapt_doc_environment_h

#include "adapt/base/rc_value.h"
#include "adapt/expr/expr.h"

namespace adapt {
namespace doc {

struct Environment : public RefCountedObject {
  double width = 500;
  double height = 500;
  double font_size = 16;
};

rc_ref<expr::Scope> create_root_scope();

}
}

#endif
