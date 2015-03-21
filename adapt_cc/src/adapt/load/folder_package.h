#ifndef adapt_load_folder_package_h
#define adapt_load_folder_package_h

#include "adapt/base/rc_string.h"
#include "adapt/load/package.h"

namespace adapt {
namespace load {

std::unique_ptr<Package> create_folder_package(const rc_string& path,
    const rc_string& root_url);

}
}

#endif
