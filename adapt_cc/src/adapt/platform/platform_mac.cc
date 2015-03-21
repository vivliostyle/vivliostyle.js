#include "adapt/platform/platform_mac.h"

namespace adapt {
namespace text {

const char* LineSequence::type_tag() {
  return "LineSequence";
}

bool LineSequence::instance_of(const char* type_tag) const {
  if (type_tag == LineSequence::type_tag()) {
    return true;
  }
  return RefCountedObject::instance_of(type_tag);
}

}
}
