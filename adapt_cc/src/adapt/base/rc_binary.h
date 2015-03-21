#ifndef adapt_base_rc_binary_h
#define adapt_base_rc_binary_h

#include <memory>

#include <string.h>

#include "adapt/base/rc_value.h"

namespace adapt {

class SequentialReader {
 public:
  virtual ~SequentialReader() {}
  virtual rc_string media_type() = 0;
  virtual size_t length() = 0;  // can return SIZE_UNKNOWN
  virtual size_t read(unsigned char* buf, size_t size) = 0;

  static const size_t LENGTH_UNKNOWN = (size_t)-1;
};

class RandomAccessReader : public SequentialReader {
 public:
  virtual size_t read(size_t offset, unsigned char* buf, size_t size) = 0;
};

class rc_binary;

class RefCountedBinary : public RefCounted {
  friend class RefCounted;
  friend class rc_binary;
public:
  RefCountedBinary(const unsigned char* data, size_t length)
      : RefCounted(BINARY), length_(length) {
            memcpy(data_, data, length);
  }

  void* operator new(size_t size, size_t length) {
    return ::operator new(sizeof(RefCountedBinary) - 8 + length);
  }

  const unsigned char* data() const { return data_; }
  size_t length() const { return length_; }

  size_t hash() const;

  rc_binary slice(size_t index) const;
  rc_binary slice(size_t index, size_t len) const;

  bool operator==(const RefCountedBinary& other) const;

  bool operator!=(const RefCountedBinary& other) const {
    return !(*this == other);
  }

  int compare(const RefCountedBinary& other) const;

  // This string itself.
  rc_binary this_obj() const;

private:
  RefCountedBinary(size_t length) : RefCounted(BINARY), length_(length) {}

  size_t length_;
  unsigned char data_[8];
};

class rc_binary : public rc_value {
  friend rc_binary RefCountedBinary::this_obj() const;
  friend rc_binary rc_cast<rc_binary>(const rc_value& value);
public:
  rc_binary() : rc_value(empty_binary()) {}
  rc_binary(const rc_binary& other) : rc_value(other) {}
  rc_binary(RefCountedBinary* obj) : rc_value(obj) {}
  explicit rc_binary(std::unique_ptr<SequentialReader>&& r);

  rc_binary(const unsigned char* data, size_t length)
      : rc_value(new(length) RefCountedBinary(data, length)) {}

  RefCountedBinary* operator->() const { return ptr(); }

  bool operator==(const rc_binary& other) const {
    return *ptr() == *other.ptr();
  }

  bool operator!=(const rc_binary& other) const {
    return !(*ptr() == *other.ptr());
  }

  bool operator<(const rc_binary& other) const {
    return ptr()->compare(*other.ptr()) < 0;
  }

  bool operator<=(const rc_binary& other) const {
    return ptr()->compare(*other.ptr()) <= 0;
  }

  bool operator>(const rc_binary& other) const {
    return ptr()->compare(*other.ptr()) > 0;
  }

  bool operator>=(const rc_binary& other) const {
    return ptr()->compare(*other.ptr()) >= 0;
  }

  static const rc_binary& empty_binary();

  typedef RefCountedBinary object_type;
  static const RefCounted::Kind KIND = RefCounted::BINARY;

  RefCountedBinary* ptr() const {
    return static_cast<RefCountedBinary*>(raw_ptr());
  }
};

}

#endif
