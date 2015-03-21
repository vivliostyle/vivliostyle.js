#ifndef adapt_load_package_h
#define adapt_load_package_h

#include "adapt/base/rc_binary.h"
#include "adapt/base/rc_string.h"

#include <memory>

namespace adapt {
namespace load {

/**
 * Represents (possibly packaged) document sources, e.g, epub file.
 */
class Package {
 public:
  Package();
  virtual ~Package() {}
  virtual rc_string root_url() = 0;
  virtual std::unique_ptr<SequentialReader> read(const rc_string& path) = 0;
  virtual std::unique_ptr<RandomAccessReader> load(const rc_string& path);
};

}
}

#endif
