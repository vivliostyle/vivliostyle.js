#include "adapt/base/rc_binary.h"

#include <algorithm>
#include <string>

namespace adapt {

size_t RefCountedBinary::hash() const {
  size_t k = 0;
  for (size_t i = 0; i < length_; ++i) {
    k *= 33;
    k += data_[i];
  }
  return k;
}

rc_binary RefCountedBinary::slice(size_t index) const {
  assert(index <= length_);
  if (index == 0) {
    return this_obj();
  }
  return rc_binary(data_ + index, length_ - index);
}

rc_binary RefCountedBinary::slice(size_t index, size_t length) const {
  assert(index <= length_);
  assert(index + length <= length_);
  if (index == 0 && length == length_) {
    return this_obj();
  }
  return rc_binary(data_ + index, length);
}

bool RefCountedBinary::operator==(const RefCountedBinary& other) const {
  if (this == &other) {
    return true;
  }
  return length_ == other.length_ && memcmp(data_, other.data_, length_);
}

int RefCountedBinary::compare(const RefCountedBinary& other) const {
  if (this == &other) {
    return 0;
  }
  int prefix = memcmp(data_, other.data_, std::min(length_, other.length_));
  if (prefix != 0) {
    return prefix;
  }
  if (length_ < other.length_) {
    return -1;
  } else if (length_ > other.length_) {
    return 1;
  }
  return 0;
}

// This binary itself.
rc_binary RefCountedBinary::this_obj() const {
  return rc_binary(const_cast<RefCountedBinary*>(this));
}

rc_binary::rc_binary(std::unique_ptr<SequentialReader>&& r) {
  if (!r) {
    *this = empty_binary();
    return;
  }
  size_t length = r->length();
  if (length != SequentialReader::LENGTH_UNKNOWN) {
    *this = new (length) RefCountedBinary(length);
    size_t rs = r->read((*this)->data_, length);
    assert(rs == length);
    unsigned char dummy;
    rs = r->read(&dummy, 1);
    assert(rs == 0);
  } else {
    std::basic_string<unsigned char> buffer;
    unsigned char rbuf[2048];
    while ((length = r->read(rbuf, sizeof rbuf)) > 0) {
      buffer.append(rbuf, length);
    }
    *this = rc_binary(buffer.data(), buffer.size());
  }
}


const rc_binary& rc_binary::empty_binary() {
  static rc_binary empty(nullptr, 0);
  return empty;
}

}
