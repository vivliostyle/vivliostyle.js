#include "adapt/base/rc_list.h"

namespace adapt {

RefCountedList::RefCountedList(const rc_value* list, size_t length)
    : RefCounted(LIST), size_(length) {
  rc_value* values = const_cast<rc_value*>(values_);
  // Clear all entries except the first, as they were not initialized.
  if (length > 1) {
    // It's valid to have zero-size list.
    memset(values + 1, 0, sizeof(rc_value) * (length - 1));
  }
  for (int i = 0; i < length; ++i) {
    values[i] = list[i];
  }
}

RefCountedList::RefCountedList(const std::vector<rc_value>& list,
    size_t off, size_t length) : RefCounted(LIST), size_(length) {
  rc_value* values = const_cast<rc_value*>(values_);
  // Clear all entries except the first, as they were not initialized.
  if (length > 1) {
    // It's valid to have zero-size list.
    memset(values + 1, 0, sizeof(rc_value) * (length - 1));
  }
  for (size_t i = 0; i < length; ++i) {
    values[i] = list[off + i];
  }
}

RefCountedList::RefCountedList(const RefCountedList* list, size_t off,
    size_t length) : RefCounted(LIST), size_(length) {
  rc_value* values = const_cast<rc_value*>(values_);
  // Clear all entries except the first, as they were not initialized.
  if (length > 1) {
    // It's valid to have zero-size list.
    memset(values + 1, 0, sizeof(rc_value) * (length - 1));
  }
  for (int i = 0; i < length; ++i) {
    values[i] = list->values_[i + off];
  }
}

size_t RefCountedList::hash() const {
  size_t result = 0;
  for (const rc_value& value : *this) {
    result = 101 * result + (value.is_null() ? 0 : value->hash());
  }
  return result;
}

bool RefCountedList::operator==(const RefCountedList& other) const {
  if (size_ != other.size_) {
    return false;
  }
  for (size_t i = 0; i < size_; ++i) {
    if (values_[i] != other.values_[i]) {
      return false;
    }
  }
  return true;
}

void RefCountedList::write_to(Writer* writer) const {
  // Confirm to CSS space-separated list
  const char* sep = "";
  for (const rc_value& value : *this) {
    *writer << sep << value;
    sep = " ";
  }
}

RefCountedList* RefCountedList::concat(const RefCountedList* other) const {
  std::vector<rc_value> tmp;
  for (const rc_value& value : *this) {
    tmp.push_back(value);
  }
  for (const rc_value& value : *other) {
    tmp.push_back(value);
  }
  return new(tmp.size()) RefCountedList(tmp, 0, tmp.size());
}

void RefCountedList::destroy() {
  for (int i = 0; i < size_; ++i) {
    rc_value::kill(const_cast<rc_value*>(&values_[i]));
  }
  delete this;
}

const rc_value& RefCountedList::empty_list() {
  static rc_list<rc_value> empty_list(nullptr, 0);
  return empty_list;
}

}
