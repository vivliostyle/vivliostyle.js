#ifndef adapt_base_rc_string_h
#define adapt_base_rc_string_h

#include <functional>
#include <vector>

#include <string.h>

#include "adapt/base/rc_value.h"
#include "adapt/base/atom_id.h"

namespace adapt {

inline const char* utf8_next(const char* str, size_t* utf16_count) {
  unsigned char c = *str;
  if ((c & 0x80) == 0) {
    ++(*utf16_count);
    return str + 1;
  }
  if ((c & 0xE0) == 0xC0) {
    ++(*utf16_count);
    return str + 2;
  }
  if ((c & 0xF0) == 0xE0) {
    ++(*utf16_count);
    return str + 3;
  }
  if ((c & 0xF8) == 0xF0) {
    *utf16_count += 2;
    return str + 4;
  }
  assert(false); // invalid UTF-8
  ++(*utf16_count);
  return str + 1;
}

inline const char* utf8_skip16(const char* str, size_t n) {
  size_t count = 0;
  while (*str && count < n) {
    str = utf8_next(str, &count);
  }
  return str;
}
  
inline size_t utf8_length16(const char* str, size_t length) {
  size_t count = 0;
  const char* end = str + length;
  while (str < end) {
    str = utf8_next(str, &count);
  }
  assert(str == end);
  return count;
}
  
class RefCountedString : public RefCounted {
  friend class RefCounted;
 public:
  RefCountedString(const char* utf8, size_t length)
      : RefCounted(STRING), length_(length) {
    memcpy(utf8_, utf8, length);
    utf8_[length] = '\0';
  }
  
  void* operator new(size_t size, size_t length) {
    return ::operator new(sizeof(RefCountedString) - 7 + length);
  }

  bool empty() const { return length_ == 0; }

  const char* utf8() const { return utf8_; }
  size_t length() const { return length_; }

  size_t utf16_length() const { return utf8_length16(utf8_, length_); }

  size_t hash() const;

  rc_string substr(size_t index) const;
  rc_string substr(size_t index, size_t len) const;

  rc_string utf16_substr(size_t utf16_index) const;
  rc_string utf16_substr(size_t utf16_index, size_t utf16_len) const;

  rc_string to_lower_ascii() const;

  bool is_whitespace_and_newlines_only() const;
  bool is_whitespace_only() const;

  size_t find_first(const char* text) const;
  size_t find_first(const char* text, size_t pos) const;

  rc_string replace_first(const char* patt, const char* rep) const;

  bool starts_with(const rc_string& prefix);

  std::vector<rc_string> split_at_whitespace() const;

  bool operator==(const RefCountedString& other) const;

  bool operator==(const char* other) const {
    return compare(other) == 0;
  }

  bool operator!=(const RefCountedString& other) const {
    return !(*this == other);
  }

  bool operator!=(const char* other) const {
    return !(*this == other);
  }

  int compare(const RefCountedString& other) const;
  int compare(const char* other) const;

  void write_to(Writer* writer) const {
    writer->write(utf8_, length_);
  }

  // This string itself.
  rc_string this_str() const;

  static const size_t npos = static_cast<size_t>(-1);

 private:
  size_t length_;
  char utf8_[8];
};

class rc_string : public rc_value {
  friend rc_string RefCountedString::this_str() const;
  friend rc_string rc_cast<rc_string>(const rc_value& value);
 public:
  rc_string() : rc_value(empty_string()) {}
  rc_string(const rc_string& other) : rc_value(other) {}

  rc_string(const char* utf8) {
    *this = rc_string(utf8, ::strlen(utf8));
  }
  
  rc_string(const char* utf8, size_t length)
    : rc_value(new(length) RefCountedString(utf8, length)) {}
  
  RefCountedString* operator->() const { return ptr(); }

  bool operator==(const rc_string& other) const {
    return *ptr() == *other.ptr();
  }

  bool operator==(const char* other) const {
    return *ptr() == other;
  }

  bool operator!=(const rc_string& other) const {
    return !(*ptr() == *other.ptr());
  }

  bool operator!=(const char* other) const {
    return !(*ptr() == other);
  }

  bool operator<(const rc_string& other) const {
    return ptr()->compare(*other.ptr()) < 0;
  }

  bool operator<=(const rc_string& other) const {
    return ptr()->compare(*other.ptr()) <= 0;
  }

  bool operator>(const rc_string& other) const {
    return ptr()->compare(*other.ptr()) > 0;
  }

  bool operator>=(const rc_string& other) const {
    return ptr()->compare(*other.ptr()) >= 0;
  }

  static const rc_string& empty_string();

  typedef RefCountedString object_type;
  static const RefCounted::Kind KIND = RefCounted::STRING;

  static const size_t npos = static_cast<size_t>(-1);

  RefCountedString* ptr() const {
    return static_cast<RefCountedString*>(raw_ptr());
  }
  
 private:
  rc_string(RefCountedString* str_obj) : rc_value(str_obj) {}
};

class RefCountedQName;

class rc_qname : public rc_value {
  friend class RefCountedQName;
  friend rc_qname rc_cast<rc_qname>(const rc_value& value);
  friend bool rc_init_atoms();
 public:
  rc_qname() : rc_value(atom(ID_EMPTY)) {}

  explicit inline rc_qname(const rc_string& name);
  inline rc_qname(const rc_string& ns, const rc_string& name);
  inline rc_qname(const rc_qname& ns, const rc_string& name);
  inline rc_qname(const char* name, size_t length);

  RefCountedQName* operator->() const { return ptr(); }

  bool operator==(const rc_qname& other) const {
    return ptr() == other.ptr();
  }

  bool operator!=(const rc_qname& other) const {
    return ptr() != other.ptr();
  }

  inline bool empty() const;

  inline RefCountedQName* ptr() const;

  static const rc_qname& atom(int atom_id);

  typedef RefCountedQName object_type;
  static const RefCounted::Kind KIND = RefCounted::QNAME;

 private:
  inline rc_qname(RefCountedQName* qname);
};

class RefCountedQName : public RefCounted {
  friend class RefCounted;
  friend class rc_qname;
  friend bool rc_init_atoms();
 public:

  int id() const { return id_; }
  const rc_qname& ns() const { return ns_; }
  const rc_string& name() const { return name_; }

  const rc_qname local() const { return local_; }

  static RefCountedQName* from(const rc_string& name) {
    return from(rc_string::empty_string(), name);
  }

  static RefCountedQName* from(const rc_string& ns, const rc_string& name);
  static RefCountedQName* from(const rc_qname& ns, const rc_string& name);

  rc_qname to_lower_ascii() const;

  void write_to(Writer* writer) const;

  bool empty() const { return id_ == 0; }

  size_t hash() const { return id_; }

 private:
  ~RefCountedQName();

  RefCountedQName(int id, const rc_qname& ns, const rc_string& name);

  // special case: empty qname.
  RefCountedQName()
    : RefCounted(QNAME), id_(0), ns_(rc_qname(this)),
      name_(rc_string::empty_string()), local_(this) {}

  void destroy();
    
  const int id_;
  const rc_qname ns_;
  const rc_string name_;
  // When ns_ is empty, points to self, does not hold ref count
  // Otherwise points to a name with empty ns_, holds a ref count
  RefCountedQName* const local_;
};

rc_qname::rc_qname(const rc_string& name)
  : rc_value(RefCountedQName::from(name)) {}

rc_qname::rc_qname(const rc_string& ns, const rc_string& name)
  : rc_value(RefCountedQName::from(ns, name)) {}

rc_qname::rc_qname(const rc_qname& ns, const rc_string& name)
  : rc_value(RefCountedQName::from(ns, name)) {}

rc_qname::rc_qname(RefCountedQName* qname) : rc_value(qname) {}

rc_qname::rc_qname(const char* str, size_t length)
  : rc_value(RefCountedQName::from(rc_string(str, length))) {}

bool rc_qname::empty() const { return ptr()->id() == 0; }

RefCountedQName* rc_qname::ptr() const {
  return static_cast<RefCountedQName*>(raw_ptr());
}


}  // namespace adapt

namespace std {

template<> struct hash<adapt::rc_string> {
  size_t operator() (const adapt::rc_string& str) const {
    return str->hash();
  }
};
  
template<> struct hash<adapt::rc_qname> {
  size_t operator() (const adapt::rc_qname& qname) const {
    return qname->hash();
  }
};
  
// For use as a key in a map. Note that sorting order is the order of
// creation, not alphabetic.
template<> struct less<adapt::rc_qname> {
  bool operator()(adapt::rc_qname const& left,
      adapt::rc_qname const& right) const {
    return left->id() < right->id();
  }
};

}


#endif
