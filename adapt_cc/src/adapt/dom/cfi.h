#ifndef adapt_dom_cfi_h
#define adapt_dom_cfi_h

#include <string>
#include <unordered_map>
#include <vector>

#include "adapt/base/rc_string.h"
#include "adapt/base/rc_list.h"
#include "adapt/dom/dom.h"

namespace adapt {
namespace dom {

class CFIFragment;

class CFIStep : public RefCountedObject {
 public:
  virtual bool apply_to(Position* pos, rc_string* err) const = 0;
};


class CFIFragment : public RefCountedObject {
 public:
  static rc_ref<CFIFragment> from(const rc_string& str);
  static rc_ref<CFIFragment> from(const Position& pos);
  bool navigate(dom::DOM::iterator root, Position* pos);
  virtual void write_to(Writer* writer) const override;
 private:
  CFIFragment(const std::vector<rc_ref<CFIStep>>& steps);

  rc_list<rc_ref<CFIStep>> steps_;
};

}
}

#endif
