#include "adapt/load/folder_package_std.h"

#include <string>

namespace adapt {
namespace load {

namespace {

class FileReader : public RandomAccessReader {
public:
  FileReader(FILE* fp, const rc_string& media_type)
      : fp_(fp), media_type_(media_type) {}

  virtual ~FileReader() {
    fclose(fp_);
  }

  virtual rc_string media_type() override { return media_type_; }

  virtual size_t length() override {
    size_t off = ftell(fp_);
    fseek(fp_, 0, SEEK_END);
    size_t size = ftell(fp_);
    fseek(fp_, off, SEEK_SET);
    return size;
  }

  virtual size_t read(unsigned char* buf, size_t size) override {
    return fread(buf, 1, size, fp_);
  }

  virtual size_t read(size_t offset, unsigned char* buf, size_t size) override {
    fseek(fp_, offset, SEEK_SET);
    return fread(buf, 1, size, fp_);
  }

private:
  FILE* fp_;
  rc_string media_type_;
};

}

FolderPackageStd::FolderPackageStd(const rc_string& path,
      const rc_string& root_url) : path_(path), root_url_(root_url) {
  if (path->empty() || path->utf8()[path->length()-1] != '/') {
    StringWriter sw;
    sw << path;
    sw << "/";
    path_ = sw.to_string();
  }
}

std::unique_ptr<RandomAccessReader> FolderPackageStd::load(
    const rc_string& rpath) {
  std::basic_string<unsigned char> buffer;
  StringWriter sw;
  sw << path_;
  sw << rpath;
  FILE* fp = fopen(sw.to_string()->utf8(), "r");
  if (fp == nullptr) {
    return nullptr;
  }
  return std::unique_ptr<RandomAccessReader>(
      new FileReader(fp, rc_string::empty_string()));
}

rc_string FolderPackageStd::root_url() {
  return root_url_;
}

std::unique_ptr<SequentialReader> FolderPackageStd::read(
    const rc_string& rpath) {
  return std::unique_ptr<SequentialReader>(load(rpath).release());
}

std::unique_ptr<Package> create_folder_package(const rc_string& path,
    const rc_string& root_url) {
  return std::unique_ptr<Package>(new FolderPackageStd(path, root_url));
}

}
}
