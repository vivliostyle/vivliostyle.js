#ifndef adapt_base_rc_value_h
#define adapt_base_rc_value_h

#include <string.h>

#include "adapt/base/common.h"
#include "adapt/base/writer.h"

namespace adapt {

class rc_value;
class rc_string;
class rc_qname;

class RefCountedQName;

bool rc_init_atoms();

class RefCounted {
  friend class rc_value;
  friend bool rc_init_atoms();
  friend class RefCountedQName;
 public:
  enum Kind {
    STRING,
    BINARY,
    INTEGER,
    REAL,
    BOOLEAN,
    LIST,
    MAP,
    QNAME,
    OBJECT
  };

  RefCounted(Kind kind)
      : ref_count_and_kind_(static_cast<size_t>(kind) << REF_COUNT_OFFSET) {}
  
  Kind kind() const {
    return static_cast<Kind>((ref_count_and_kind_ >> REF_COUNT_OFFSET) & 0xFF);
  }

  // These are non virtual, but smart (dispatch to the right object).
  size_t hash() const;
  bool operator==(const RefCounted& other) const;
  void write_to(Writer* writer) const;

  rc_string to_string() const;

  template<typename rc_type> inline bool is() const;

  bool uniquely_referenced() const {
    return (ref_count_and_kind_ & REF_COUNT_MASK) == 1;
  }

  // for integration with other libraries
  static void explicit_add_ref(RefCounted* ptr) {
    ptr->add_ref();
  }

  static void explicit_release(RefCounted* ptr) {
    ptr->release();
  }

 private:
  static const size_t REF_COUNT_OFFSET = (sizeof(size_t) - 1) * 8;
  static const size_t REF_COUNT_MASK = ~((size_t) -1 << REF_COUNT_OFFSET);
  
  static const char* type_tag();

  void add_ref() {
    ref_count_and_kind_++;
  }
  
  void release() {
    if ((--ref_count_and_kind_ & REF_COUNT_MASK) == 0) {
      destroy();
    }
  }

  void destroy();

  size_t ref_count_and_kind_;
};

class rc_value {
 public:
  rc_value() : ptr_(nullptr) {}

  rc_value(RefCounted* ptr) : ptr_(ptr) {
    if (ptr_) {
      ptr->add_ref();
    }
  }

  rc_value(const rc_value& other) : ptr_(other.ptr_) {
    if (ptr_) {
      ptr_->add_ref();
    }
  }

  rc_value(rc_value&& other) : ptr_(other.ptr_) {
    other.ptr_ = nullptr;
  }

  ~rc_value() {
    if (ptr_) {
      ptr_->release();
    }
  }

  const rc_value& operator=(const rc_value& other) {
    RefCounted* prev = ptr_;
    ptr_ = other.ptr_;
    if (ptr_) {
      ptr_->add_ref();
    }
    if (prev) {
      prev->release();
    }
    return *this;
  }

  const rc_value& operator=(rc_value&& other) {
    RefCounted* prev = ptr_;
    ptr_ = other.ptr_;
    if (ptr_) {
      other.ptr_ = nullptr;
    }
    if (prev) {
      prev->release();
    }
    return *this;
  }

  const rc_value& operator=(RefCounted* other) {
    RefCounted* prev = ptr_;
    ptr_ = other;
    if (ptr_) {
      ptr_->add_ref();
    }
    if (prev) {
      prev->release();
    }
    return *this;
  }

  RefCounted* operator->() const {
    return ptr_;
  }

  RefCounted* raw_ptr() const {
    return ptr_;
  }

  bool operator==(const rc_value& other) const {
    if (ptr_ == other.ptr_) {
      return true;
    }
    if (!ptr_ || !other.ptr_) {
      return false;
    }
    return *ptr_ == *other.ptr_;
  }

  bool operator!=(const rc_value& other) const {
    return !(*this == other);
  }

  bool operator==(const char* other) const;

  bool operator!=(const char* other) const {
    return !(*this == other);
  }

  bool is_null() const {
    return ptr_ == nullptr;
  }

  // Clear the value, so it is safe to apandon memory without a destructor
  // call. This is used only in places where some memory manipulation is
  // required. The value will be null after this call, which may be not
  // consistent with subclass (e.g. rc_string) expectations.
  static void kill(rc_value* victim) {
    if (victim->ptr_) {
      victim->ptr_->release();
      victim->ptr_ = nullptr;
    }
  }

  static const rc_value null;

  // debug-only, always returns "" and prints the value to stdout
  const char* print() const;

 private:
  RefCounted* ptr_;
};

class RefCountedObject : public RefCounted {
  friend class RefCounted;
 public:
  RefCountedObject() : RefCounted(OBJECT) {}
  virtual ~RefCountedObject() {}

  virtual size_t hash() const;
  virtual bool operator==(const RefCountedObject& other) const;
  virtual void write_to(Writer* writer) const;

  static const char* type_tag();
 protected:
  virtual bool instance_of(const char* type_tag) const;
  bool same_class(const RefCountedObject& other) const;
};

template<class RC> class rc_ref : public rc_value {
 public:
  rc_ref() : rc_value() {}
  rc_ref(RC* ptr) : rc_value(ptr) {}

  RC* operator->() const { return ptr(); }
  const RC& operator*() const { return *ptr(); }
  RC* ptr() const { return static_cast<RC*>(raw_ptr()); }

  typedef RC object_type;
  static const RefCounted::Kind KIND = RefCounted::OBJECT;
};

template<> inline bool RefCounted::is<rc_value>() const {
  return true;
}

template<typename rc_type> inline bool RefCounted::is() const {
  typedef typename rc_type::object_type object_type;
  if (kind() != rc_type::KIND) {
    return false;
  }
  if (rc_type::KIND != OBJECT) {
    return true;
  }
  const RefCountedObject* obj = static_cast<const RefCountedObject*>(this);
  return obj->instance_of(object_type::type_tag());
}

template<typename rc_type> rc_type rc_cast(const rc_value& value) {
  typedef typename rc_type::object_type object_type;
  assert(!value.is_null() && value->is<rc_type>());
  return rc_type(static_cast<object_type*>(value.raw_ptr()));
}

template<typename rc_type> rc_type rc_nullable_cast(const rc_value& value) {
  if (value.is_null()) {
    return *(const rc_type*)&rc_value::null;
  }
  return rc_cast<rc_type>(value);
}
  
}  // namespace adapt

#endif
