#include "adapt/base/rc_primitive.h"

#include "adapt/base/rc_string.h"

namespace adapt {

const rc_boolean& rc_boolean::true_value() {
  static rc_boolean true_val(new RefCountedPrimitive<bool>(KIND, true));
  return true_val;
}

const rc_boolean& rc_boolean::false_value() {
  static rc_boolean false_val(new RefCountedPrimitive<bool>(KIND, false));
  return false_val;
}

bool as_bool(const rc_value& value) {
  if (value->is<rc_real>()) {
    return rc_cast<rc_real>(value)->value() != 0;
  }
  if (value->is<rc_integer>()) {
    return rc_cast<rc_integer>(value)->value() != 0;
  }
  if (value->is<rc_boolean>()) {
    return rc_cast<rc_boolean>(value)->value();
  }
  if (value->is<rc_string>()) {
    return !rc_cast<rc_string>(value)->empty();
  }
  return true;
}

double as_number(const rc_value& value) {
  if (value.is_null()) {
    return NAN;
  }
  if (value->is<rc_real>()) {
    return rc_cast<rc_real>(value)->value();
  }
  if (value->is<rc_integer>()) {
    return rc_cast<rc_integer>(value)->value();
  }
  if (value->is<rc_boolean>()) {
    return rc_cast<rc_boolean>(value)->value() ? 1 : 0;
  }
  if (value->is<rc_string>()) {
    const char* s = rc_cast<rc_string>(value)->utf8();
    char* end;
    double v = strtod(s, &end);
    if (*end == '\0') {
      return v;
    }
  }
  return NAN;
}

rc_string as_string(const rc_value& value) {
  if (value.is_null()) {
    return rc_string::empty_string();
  }
  return value->to_string();
}

bool values_equal(const rc_value& v1, const rc_value& v2) {
  if (v1->is<rc_real>() || v1->is<rc_integer>()
      || v2->is<rc_real>() || v2->is<rc_integer>()) {
    return as_number(v1) == as_number(v2);
  }
  return v1 == v2;
}


}
