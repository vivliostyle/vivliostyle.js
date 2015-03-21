#include "adapt/base/rc_value.h"

#include <unordered_set>
#include <typeinfo>

#include "adapt/base/rc_binary.h"
#include "adapt/base/rc_string.h"
#include "adapt/base/rc_map.h"
#include "adapt/base/rc_list.h"
#include "adapt/base/rc_primitive.h"

namespace adapt {

void RefCounted::destroy() {
  switch (kind()) {
    case QNAME:
      static_cast<RefCountedQName*>(this)->destroy();
      break;
    case MAP:
      static_cast<RefCountedMap*>(this)->destroy();
      break;
    case LIST:
      static_cast<RefCountedList*>(this)->destroy();
      break;
    case OBJECT:
      delete static_cast<RefCountedObject*>(this);
      break;
    default:
      delete this;
  }
}

size_t RefCounted::hash() const {
  switch (kind()) {
    case STRING:
      return static_cast<const RefCountedString*>(this)->hash();
    case BINARY:
      return static_cast<const RefCountedBinary*>(this)->hash();
    case QNAME:
      return static_cast<const RefCountedQName*>(this)->hash();
    case INTEGER:
      return static_cast<const RefCountedPrimitive<int>*>(this)->hash();
    case REAL:
      return static_cast<const RefCountedPrimitive<double>*>(this)->hash();
    case BOOLEAN:
      return static_cast<const RefCountedPrimitive<bool>*>(this)->hash();
    case MAP:
      return static_cast<const RefCountedMap*>(this)->hash();
    case LIST:
      return static_cast<const RefCountedList*>(this)->hash();
    case OBJECT:
      return static_cast<const RefCountedObject*>(this)->hash();
    default:
      return reinterpret_cast<size_t>(this);
  }
}

bool RefCounted::operator==(const RefCounted& other) const {
  int my_kind = kind();
  if (my_kind != other.kind()) {
    return false;
  }
  switch (my_kind) {
    case STRING:
      return *static_cast<const RefCountedString*>(this)
          == *static_cast<const RefCountedString*>(&other);
    case BINARY:
      return *static_cast<const RefCountedBinary*>(this)
          == *static_cast<const RefCountedBinary*>(&other);
    case INTEGER:
      return *static_cast<const RefCountedPrimitive<int>*>(this)
          == *static_cast<const RefCountedPrimitive<int>*>(&other);
    case REAL:
      return *static_cast<const RefCountedPrimitive<double>*>(this)
          == *static_cast<const RefCountedPrimitive<double>*>(&other);
    case BOOLEAN:
      return *static_cast<const RefCountedPrimitive<bool>*>(this)
          == *static_cast<const RefCountedPrimitive<bool>*>(&other);
    case MAP:
      return *static_cast<const RefCountedMap*>(this)
          == *static_cast<const RefCountedMap*>(&other);
    case LIST:
      return *static_cast<const RefCountedList*>(this)
          == *static_cast<const RefCountedList*>(&other);
    case OBJECT:
      return *static_cast<const RefCountedObject*>(this)
          == *static_cast<const RefCountedObject*>(&other);
    default:
      return this == &other;
  }
}

void RefCounted::write_to(Writer* writer) const {
  switch (kind()) {
    case STRING:
      static_cast<const RefCountedString*>(this)->write_to(writer);
      break;
    case BINARY:
      static_cast<const RefCountedBinary*>(this)->write_to(writer);
      break;
    case QNAME:
      static_cast<const RefCountedQName*>(this)->write_to(writer);
      break;
    case INTEGER:
      static_cast<const RefCountedPrimitive<int>*>(this)->write_to(writer);
      break;
    case REAL:
      static_cast<const RefCountedPrimitive<double>*>(this)->write_to(writer);
      break;
    case BOOLEAN:
      static_cast<const RefCountedPrimitive<bool>*>(this)->write_to(writer);
      break;
    case MAP:
      static_cast<const RefCountedMap*>(this)->write_to(writer);
      break;
    case LIST:
      static_cast<const RefCountedList*>(this)->write_to(writer);
      break;
    case OBJECT:
      static_cast<const RefCountedObject*>(this)->write_to(writer);
      break;
    default:
      *writer << "<kind:" << static_cast<int>(kind()) << ",ptr:"
              << hex(reinterpret_cast<size_t>(this)) << '>';
  }
}

rc_string RefCounted::to_string() const {
  StringWriter writer;
  write_to(&writer);
  return writer.to_string();
}

const char* RefCounted::type_tag() {
  return "value";
}

const rc_value rc_value::null;

bool rc_value::operator==(const char* other) const {
  return ptr_->kind() == RefCounted::STRING
      && *static_cast<const rc_string*>(this) == other;
}

const char* rc_value::print() const {
  if (!ptr_) {
    Writer::stdout() << "null\n";
  } else {
    ptr_->write_to(&Writer::stdout());
    Writer::stdout() << "\n";
  }
  return "";
}

size_t RefCountedObject::hash() const {
  return reinterpret_cast<size_t>(this);
}

bool RefCountedObject::operator==(const RefCountedObject& other) const {
  return this == &other;
}

void RefCountedObject::write_to(Writer* writer) const {
  *writer << "<obj:" << hex(reinterpret_cast<size_t>(this)) << '>';
}

bool RefCountedObject::same_class(const RefCountedObject& other) const {
  return typeid(*this) == typeid(other);
}

bool RefCountedObject::instance_of(const char* type_tag) const {
  return type_tag == RefCountedObject::type_tag();
}

const char* RefCountedObject::type_tag() {
  return "Object";
}


}  // namespace adapt
