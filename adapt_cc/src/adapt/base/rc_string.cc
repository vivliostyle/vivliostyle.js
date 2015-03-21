#include "adapt/base/rc_string.h"

#include <unordered_set>
#include <string>

namespace adapt {

rc_string RefCountedString::substr(size_t index) const {
  assert(index <= length_);
  if (index == 0) {
    return this_str();
  }
  return rc_string(utf8_ + index, length_ - index);
}

rc_string RefCountedString::substr(size_t index, size_t length) const {
  assert(index <= length_);
  assert(index + length <= length_);
  if (index == 0 && length == length_) {
    return this_str();
  }
  return rc_string(utf8_ + index, length);
}

rc_string RefCountedString::utf16_substr(size_t utf16_index) const {
  if (index == 0) {
    return this_str();
  }
  const char* start = utf8_skip16(utf8_, utf16_index);
  return rc_string(start, length_ - (start - utf8_));
}

rc_string RefCountedString::utf16_substr(size_t utf16_index,
    size_t utf16_length) const {
  const char* start = utf8_skip16(utf8_, utf16_index);
  const char* end = utf8_skip16(start, utf16_length);
  if (start == utf8_ && end == utf8_ + length_) {
    return this_str();
  }
  return rc_string(start, end - start);
}

rc_string RefCountedString::to_lower_ascii() const {
  const char* start = utf8_;
  const char* end = start + length_;
  std::string buffer;
  for (const char* p = start; p < end; ++p) {
    char c = *p;
    if ('A' <= c && c <= 'Z') {
      buffer.append(start, p - start);
      buffer.append(1, char(c + ('a' - 'A')));
      start = p + 1;
    }
  }
  if (start != utf8_) {
    // Some upper-case ASCII characters
    buffer.append(start, end - start);
    return rc_string(buffer.data(), buffer.length());
  }
  // No upper-case ASCII characters
  return this_str();
}

bool RefCountedString::is_whitespace_and_newlines_only() const {
  size_t span = ::strspn(utf8_, " \t\f\r\n");
  return span == length_;
}

bool RefCountedString::is_whitespace_only() const {
  size_t span = ::strspn(utf8_, " \t\f");
  return span == length_;
}

size_t RefCountedString::find_first(const char* text) const {
  const char* p = strstr(utf8_, text);
  if (!p) {
    return npos;
  }
  return p - utf8_;
}

size_t RefCountedString::find_first(const char* text, size_t pos) const {
  assert(pos <= length());
  const char* p = strstr(utf8_ + pos, text);
  if (!p) {
    return npos;
  }
  return p - utf8_;
}

rc_string RefCountedString::replace_first(const char* patt,
    const char* rep) const {
  size_t pos = find_first(patt);
  if (pos == npos) {
    return this_str();
  }
  std::string buffer;
  buffer.append(utf8_, pos);
  buffer.append(rep);
  buffer.append(utf8_ + pos + strlen(patt));
  return rc_string(buffer.data(), buffer.length());
}

bool RefCountedString::starts_with(const rc_string& prefix) {
  size_t ps = prefix->length();
  if (ps > length_) {
    return false;
  }
  const char *s = utf8_ + ps;
  const char *p = prefix->utf8() + ps;
  while (s > utf8_) {
    --s;
    --p;
    if (*s != *p) {
      return false;
    }
  }
  return true;
}

std::vector<rc_string> RefCountedString::split_at_whitespace() const {
  std::vector<rc_string> result;
  const char* start = utf8_;
  const char* end = start + length_;
  for (const char* p = start; p < end; ++p) {
    char c = *p;
    if (c == ' ' || c == '\t' || c == '\n' || c == '\r') {
      if (p > start) {
        result.push_back(rc_string(start, p - start));
      }
      start = p + 1;
    }
  }
  if (end > start) {
    result.push_back(rc_string(start, end - start));
  }
  return result;
}

int RefCountedString::compare(const RefCountedString& other) const {
  if (this == &other) {
    return 0;
  }
  return strcmp(utf8_, other.utf8_);
}

int RefCountedString::compare(const char* other) const {
  return strcmp(utf8_, other);
}
  
rc_string RefCountedString::this_str() const {
  return rc_string(const_cast<RefCountedString*>(this));
}

size_t RefCountedString::hash() const {
  size_t k = 0;
  for (size_t i = 0; i < length_; ++i) {
    k *= 33;
    k += utf8_[i] & 0xFF;
  }
  return k;
}

bool RefCountedString::operator==(const RefCountedString& other) const {
  if (this == &other) {
    return true;
  }
  if (length_ != other.length_) {
    return false;
  }
  return memcmp(utf8_, other.utf8_, length_) == 0;
}

const rc_string& rc_string::empty_string() {
  static rc_string empty_string("", 0);
  return empty_string;
}


namespace {

struct RCQNameHash {
  size_t operator() (const RefCountedQName* qname) {
    return 31 * qname->ns()->hash() + qname->name()->hash();
  }
};

struct RCQNameEq {
  bool operator() (const RefCountedQName* v1, const RefCountedQName* v2) {
    return v1->name() == v2->name() && v1->ns() == v2->ns();
  }
};

typedef std::unordered_set<RefCountedQName*, RCQNameHash, RCQNameEq> name_map;

name_map* static_name_map() {
  static name_map nmap;
  return &nmap;
}

rc_qname* static_name_array() {
  static rc_value atom_array[ID_MAX_ATOM];
  return static_cast<rc_qname*>(atom_array);
}

}  // namespace

bool rc_init_atoms() {
  bool init_done;
  if (init_done) {
    return false;
  }
  static_name_map();  // Ensure name map exists.
  init_done = true;
  // Since empty qname is self-referencing it will never be reclaimed if
  // heap-allocated and therefore should be allocated statically instead.
  // However, its destructor could potentially be called before the last
  // reference to it is released (which will cause an attempt to deallocate).
  // Thus we manually bump the refcount by one.
  static RefCountedQName empty_qname;
  empty_qname.add_ref();
  rc_qname* atom_array = static_name_array();
  atom_array[0] = rc_qname(&empty_qname);

  int index = 1;

#define adapt_def_ns(ns, str) \
  atom_array[index] = rc_qname(atom_array[0], str); \
  assert(atom_array[index]->id() == adapt::NS_##ns); \
  ++index;
#define adapt_def_name(n) \
  atom_array[index] = rc_qname(atom_array[0], #n); \
  assert(atom_array[index]->id() == adapt::ID_##n); \
  ++index;
#define adapt_def_name_str(n, str) \
  atom_array[index] = rc_qname(atom_array[0], str); \
  assert(atom_array[index]->id() == adapt::ID_##n); \
  ++index;
#define adapt_def_qname(ns, n) \
  atom_array[index] = rc_qname(atom_array[adapt::NS_##ns], #n); \
  assert(atom_array[index]->id() == adapt::ID_##ns##_##n); \
  ++index;
#define adapt_def_qname2(ns, n) \
  atom_array[index] = rc_qname(atom_array[0], #n); \
  assert(atom_array[index]->id() == adapt::ID_##n); \
  ++index; \
  atom_array[index] = rc_qname(atom_array[adapt::NS_##ns], \
                              atom_array[index - 1]->name()); \
  assert(atom_array[index]->id() == adapt::ID_##ns##_##n); \
  ++index;

#define adapt_include_atom_list
#include "adapt/base/atom_list.h"
#undef adapt_include_atom_list

#undef adapt_def_ns
#undef adapt_def_name
#undef adapt_def_name_str
#undef adapt_def_qname
#undef adapt_def_qname2

  assert(index == ID_MAX_ATOM);

  return true;
}

const rc_qname& rc_qname::atom(int atom_id) {
  static bool done = rc_init_atoms();
  (void)done;
  assert(atom_id >= 0 && atom_id < ID_MAX_ATOM);
  return static_name_array()[atom_id];
}

RefCountedQName::RefCountedQName(int id, const rc_qname& ns,
    const rc_string& name) : RefCounted(QNAME), id_(id), ns_(ns), name_(name),
    local_(ns->empty() ? this : from(static_name_array()[ID_EMPTY], name)) {
  if (local_ != this) {
    local_->add_ref();
  }
}

RefCountedQName::~RefCountedQName() {
  if (local_ != this) {
    local_->release();
  }
}

RefCountedQName* RefCountedQName::from(
    const rc_string& ns, const rc_string& name) {
  if (ns->empty()) {
    return RefCountedQName::from(rc_qname::atom(ID_EMPTY), name);
  }
  return RefCountedQName::from(rc_qname(ns), name);
}

RefCountedQName* RefCountedQName::from(
    const rc_qname& ns, const rc_string& name) {
  // Note: this id allocation is simplistic and may not be approprtiate for
  // long-running applications (e.g. server environments), as we could loop
  // over.
  static int last_id = 0;
  RefCountedQName key(0, ns, name);
  name_map* nmap = static_name_map();
  name_map::iterator p = nmap->find(&key);
  if (p != nmap->end()) {
    return *p;
  }
  RefCountedQName* new_val = new RefCountedQName(++last_id, ns, name);
  nmap->insert(new_val);
  return new_val;
}

void RefCountedQName::write_to(Writer* writer) const {
  if (!ns_->empty()) {
    *writer << '{' << ns_ << '}';
  }
  CSSIdentWriter iw(writer);
  iw << name_;
}

rc_qname RefCountedQName::to_lower_ascii() const {
  assert(ns_->empty());
  rc_string lower = name_->to_lower_ascii();
  if (lower.ptr() == name_.ptr()) {
    return const_cast<RefCountedQName*>(this);
  }
  return rc_qname(ns_, lower);
}

void RefCountedQName::destroy() {
  static_name_map()->erase(this);
  delete this;
}

}  // namespace adapt
