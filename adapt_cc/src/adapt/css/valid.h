#ifndef adapt_css_valid_h
#define adapt_css_valid_h

#include <memory>

#include "adapt/css/parser.h"
#include "adapt/css/value.h"

namespace adapt {
namespace css {

struct CSSValidatorSetData;

class CSSValidatorSet {
 public:
  CSSValidatorSet();
  
  void validate_property_and_handle_shorthand(const rc_qname& name,
      const rc_ref<CSSValue>& value, bool important,
      PropertyReceiver* receiver);

  static CSSValidatorSet* default_validator();

  const CSSValidatorSetData* data() const { return data_.get(); }
 private:
  std::unique_ptr<CSSValidatorSetData> data_;
};

}
}

#endif
