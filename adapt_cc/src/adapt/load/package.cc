#include "adapt/load/package.h"

namespace adapt {
namespace load {

namespace {

class BufferReader : public RandomAccessReader {
 public:
  BufferReader(const rc_binary& buffer, const rc_string& media_type)
      : buffer_(buffer), media_type_(media_type) {}

  virtual ~BufferReader() {
  }

  virtual rc_string media_type() override { return media_type_; }

  virtual size_t length() override { return buffer_->length(); }

  virtual size_t read(unsigned char* buf, size_t size) override {
    size = read(offset_, buf, size);
    return size;
  }

  virtual size_t read(size_t offset, unsigned char* buf, size_t size) override {
    if (offset >= buffer_->length()) {
      return 0;
    }
    size_t remains = buffer_->length() - offset;
    if (remains < size) {
      size = remains;
    }
    ::memcpy(buf, buffer_->data() + offset, size);
    offset_ = offset + size;
    return size;
  }

 private:

  rc_binary buffer_;
  rc_string media_type_;
  size_t offset_;
};

}

Package::Package() {}

std::unique_ptr<RandomAccessReader> Package::load(const rc_string& path) {
  std::unique_ptr<SequentialReader> reader = read(path);
  if (!reader) {
    return nullptr;
  }
  rc_string media_type = reader->media_type();
  return std::unique_ptr<RandomAccessReader>(
      new BufferReader(rc_binary(std::move(reader)), media_type));
}

}
}
