#ifndef adapt_base_rc_primitive_h
#define adapt_base_rc_primitive_h

#include <unordered_set>

#include "adapt/base/rc_value.h"
#include "adapt/base/atom_id.h"

namespace adapt {

template<typename ptype>
class RefCountedPrimitive : public RefCounted {
 public:
  RefCountedPrimitive(Kind kind, ptype value)
      : RefCounted(kind), value_(value) {}

  ptype value() const { return value_; }

  size_t hash() const { return std::hash<ptype>()(value_); }

  bool operator==(const RefCountedPrimitive<ptype>& other) const {
    return value_ == other.value_;
  }

  bool operator!=(const RefCountedPrimitive<ptype>& other) const {
    return !(*this == other);
  }

  void write_to(Writer* writer) const {
    writer->write(value_);
  }

 private:
  ptype value_;
};

class rc_integer : public rc_value {
  friend rc_integer rc_cast<rc_integer>(const rc_value& value);
 public:
  typedef RefCountedPrimitive<int> object_type;
  static const RefCounted::Kind KIND = RefCounted::INTEGER;

  rc_integer() : rc_value(new RefCountedPrimitive<int>(KIND, 0)) {}
  rc_integer(int v) : rc_value(new RefCountedPrimitive<int>(KIND, v)) {}

  RefCountedPrimitive<int>* operator->() const { return rep(); }

  bool operator==(const rc_integer& other) const {
    return *rep() == *other.rep();
  }

  bool operator!=(const rc_integer& other) const {
    return !(*rep() == *other.rep());
  }

 private:
  rc_integer(object_type* v) : rc_value(v) {}
  object_type* rep() const { return static_cast<object_type*>(raw_ptr()); }
};

class rc_real : public rc_value {
  friend rc_real rc_cast<rc_real>(const rc_value& value);
public:
  typedef RefCountedPrimitive<double> object_type;
  static const RefCounted::Kind KIND = RefCounted::REAL;

  rc_real() : rc_value(new object_type(KIND, 0)) {}
  rc_real(double v) : rc_value(new object_type(KIND, v)) {}

  const object_type* operator->() const { return rep(); }

  bool operator==(const rc_real& other) const {
    return *rep() == *other.rep();
  }

  bool operator!=(const rc_real& other) const {
    return !(*rep() == *other.rep());
  }

 private:
  rc_real(object_type* v) : rc_value(v) {}
  object_type* rep() const { return static_cast<object_type*>(raw_ptr()); }
};

class rc_boolean : public rc_value {
  friend rc_boolean rc_cast<rc_boolean>(const rc_value& value);
public:
  typedef RefCountedPrimitive<bool> object_type;
  static const RefCounted::Kind KIND = RefCounted::BOOLEAN;

  rc_boolean() : rc_value() {}
  rc_boolean(bool v) : rc_value(v ? true_value() : false_value()) {}

  object_type* operator->() const { return rep(); }

  static const rc_boolean& true_value();
  static const rc_boolean& false_value();
private:
  rc_boolean(object_type* v) : rc_value(v) {}
  object_type* rep() const { return static_cast<object_type*>(raw_ptr()); }
};

bool as_bool(const rc_value& value);
double as_number(const rc_value& value);
rc_string as_string(const rc_value& value);
bool values_equal(const rc_value& v1, const rc_value& v2);

}

#endif
