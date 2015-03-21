#include "adapt/load/app_package_mac.h"
#include "adapt/load/folder_package_std.h"
#include "adapt/platform/platform_mac.h"

namespace adapt {
namespace load {

namespace {

rc_string get_adapt_resource_folder() {
  CFBundleRef bundle = CFBundleGetMainBundle();
  mac::cf_ref<CFURLRef> folder(CFBundleCopyResourcesDirectoryURL(bundle));
  UInt8 path[4096];
  if (CFURLGetFileSystemRepresentation(folder.get(), true, path, sizeof path)) {
    // TODO: adapt subfolder in resource folder
    return reinterpret_cast<char*>(path);
  }
  assert(false);
  return "./";
}

}

Package* get_app_package() {
  static FolderPackageStd resource_package(get_adapt_resource_folder(),
      "res:///");
  return &resource_package;
}

}
}
