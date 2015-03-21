#ifndef adapt_load_folder_package_std_h
#define adapt_load_folder_package_std_h

#include "adapt/load/folder_package.h"

namespace adapt {
namespace load {

class FolderPackageStd : public Package {
public:
  FolderPackageStd(const rc_string& path, const rc_string& root_url);

  rc_string root_url() override;
  std::unique_ptr<SequentialReader> read(const rc_string& path) override;
  std::unique_ptr<RandomAccessReader> load(const rc_string& path) override;

private:
  rc_string path_;
  rc_string root_url_;
};

}
}


#endif
