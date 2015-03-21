#include "adapt/base/rc_map.h"

namespace adapt {

RefCountedMap::RefCountedMap(const std::map<rc_qname, rc_value>& map)
    : RefCounted(MAP), entries_(), size_(map.size()) {
  Entry<rc_value>* entries = const_cast<Entry<rc_value>*>(entries_);
  // Clear all entries except the first, as they were not initialized.
  if (size_ > 0) {
    // It's valid to have zero-size map.
    memset(entries + 1, 0, sizeof(Entry<rc_value>) * (size_ - 1));
  }
  int index = 0;
  for(auto entry : map) {
    entries[index].key = entry.first;
    entries[index].value = entry.second;
    index++;
  }
}

RefCountedMap::RefCountedMap(std::initializer_list<Entry<rc_value>> list)
    : RefCounted(MAP), entries_(), size_(list.size()) {
  Entry<rc_value>* entries = const_cast<Entry<rc_value>*>(entries_);
  // Clear all entries except the first, as they were not initialized.
  if (size_ > 0) {
    // It's valid to have zero-size map.
    memset(entries + 1, 0, sizeof(Entry<rc_value>) * (size_ - 1));
  }
  int index = 0;
  for(auto entry : list) {
    entries[index].key = entry.key;
    entries[index].value = entry.value;
    index++;
  }
  std::sort(entries, entries + index);
}

const rc_value& RefCountedMap::get(const rc_qname& key) const {
  Entry<rc_value> key_entry(key);
  iterator<rc_value> entry = std::lower_bound(begin(), end(), key_entry);
  if (entry->key == key) {
    return entry->value;
  }
  return rc_value::null;
}

RefCountedMap::iterator<rc_value> RefCountedMap::find(
    const rc_qname& key) const {
  Entry<rc_value> key_entry(key);
  iterator<rc_value> entry = std::lower_bound(begin(), end(), key_entry);
  if (entry->key == key) {
    return entry;
  }
  return end();
}

size_t RefCountedMap::hash() const {
  return 0;
}

bool RefCountedMap::operator==(const RefCountedMap& other) const {
  return false;
}

void RefCountedMap::write_to(Writer* writer) const {
  // Confirm to style attribute syntax.
  const char* sep = "";
  for(auto entry : *this) {
    *writer << sep << entry.key << ": " << entry.value;
    sep = "; ";
  }
}

void RefCountedMap::destroy() {
  for (int i = 0; i < size_; ++i) {
    Entry<rc_value>* entry = const_cast<Entry<rc_value>*>(&entries_[i]);
    rc_value::kill(&entry->key);
    rc_value::kill(&entry->value);
  }
  delete this;
}

const rc_value& RefCountedMap::empty_map() {
  static const std::map<rc_qname, rc_value> empty_mmap;
  static rc_map<rc_value> empty_map(empty_mmap);
  return empty_map;
}

}
