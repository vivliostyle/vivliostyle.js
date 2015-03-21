#ifndef adapt_base_rc_map_h
#define adapt_base_rc_map_h

#include <initializer_list>
#include <string.h>
#include <map>

#include "adapt/base/rc_value.h"
#include "adapt/base/rc_string.h"

namespace adapt {

class RefCountedMap : public RefCounted {
  friend class RefCounted;
 public:
  template<typename rc_type> struct Entry {
    rc_qname key;
    rc_type value;

    Entry() {}
    Entry(const rc_qname& k) : key(k),
        value(*reinterpret_cast<const rc_type*>(&rc_value::null)) {}
    Entry(const rc_qname& k, const rc_type& v) : key(k), value(v) {}

    bool operator<(const Entry& e) const { return key->id() < e.key->id(); }
  };

  RefCountedMap(const std::map<rc_qname, rc_value>& map);

  RefCountedMap(std::initializer_list<Entry<rc_value>> list);

  void* operator new(size_t size, size_t entry_count) {
    if (entry_count == 0) {
      // Have to reserve at least that much.
      entry_count = 1;
    }
    return ::operator new(
        sizeof(RefCountedMap) - 1 + entry_count * sizeof(Entry<rc_value>));
  }

  bool empty() const { return size_ == 0; }

  const rc_value& get(const rc_qname& key) const;
  size_t size() const { return size_; }

  const Entry<rc_value>& get_entry(size_t index) const {
    return entries_[index];
  }

  size_t hash() const;
  bool operator==(const RefCountedMap& other) const;
  void write_to(Writer* writer) const;

  template<typename rc_type> class iterator {
   public:
    typedef iterator self_type;
    typedef std::random_access_iterator_tag iterator_category;
    typedef Entry<rc_type> value_type;
    typedef size_t size_type;
    typedef std::ptrdiff_t difference_type;
    typedef const Entry<rc_type>* pointer;
    typedef const Entry<rc_type>* const_pointer;
    typedef const Entry<rc_type>& reference;
    typedef const Entry<rc_type>& const_reference;

    explicit iterator(const value_type* pos) : pos_(pos) {}
    const value_type& operator*() const { return *pos_; };
    const value_type *operator->() const { return pos_; }
    self_type& operator++() { ++pos_; return *this; }
    self_type operator++(int) { self_type r(*this); ++(*this); return r; }
    self_type &operator--()  { --pos_; return *this; }
    self_type operator--(int)  { self_type r(*this); --(*this); return r; }
    self_type operator+(difference_type n) { return self_type(pos_ + n); }
    self_type &operator+=(difference_type n) { pos_ += n; return *this; }
    self_type operator-(difference_type n) { return self_type(pos_ - n); }
    difference_type operator-(const self_type& it) { return pos_ - it.pos_; }
    self_type &operator-=(difference_type n) { pos_ -= n; return *this; }
    bool operator==(const self_type &it) const { return pos_ == it.pos_; }
    bool operator!=(const self_type &it) const { return pos_ != it.pos_; }

   private:
    const Entry<rc_type>* pos_;
  };

  iterator<rc_value> begin() const {
    return iterator<rc_value>(entries_);
  }

  iterator<rc_value> end() const {
    return iterator<rc_value>(entries_ + size_);
  }

  iterator<rc_value> find(const rc_qname& key) const;

  static const rc_value& empty_map();

 private:
  void destroy();

  const size_t size_;
  const Entry<rc_value> entries_[1];
};

template<typename rc_type> class rc_map : public rc_value {
  friend rc_map rc_cast<rc_map>(const rc_value& value);
 public:
  typedef RefCountedMap::iterator<rc_type> iterator;
  typedef RefCountedMap::Entry<rc_type> Entry;
  typedef RefCountedMap object_type;
  static const RefCounted::Kind KIND = RefCounted::MAP;

  explicit rc_map(const std::map<rc_qname, rc_type>& map)
      : rc_value(new(map.size()) RefCountedMap(
          *reinterpret_cast<const std::map<rc_qname, rc_value>*>(&map))) {}

  rc_map(std::initializer_list<Entry> args)
      : rc_value(new(args.size()) RefCountedMap(*reinterpret_cast<
            std::initializer_list<RefCountedMap::Entry<rc_value>>*>(&args))) {}
  RefCountedMap* operator->() const { return ptr(); }

  const rc_type& operator[](const rc_qname& key) const {
    const rc_value& v = ptr()->get(key);
    assert(v.is_null() || v->is<rc_type>());
    return *static_cast<const rc_type*>(&v);
  }

  bool operator==(const rc_map<rc_type>& other) const {
    return *ptr() == *other.ptr();
  }

  bool operator!=(const rc_map<rc_type>& other) const {
    return !(*ptr() == *other.ptr());
  }

  RefCountedMap* ptr() const {
    return static_cast<RefCountedMap*>(raw_ptr());
  }

  iterator begin() const {
    RefCountedMap::iterator<rc_value> raw_iterator = ptr()->begin();
    return *reinterpret_cast<iterator*>(&raw_iterator);
  }

  iterator end() const {
    RefCountedMap::iterator<rc_value> raw_iterator = ptr()->end();
    return *reinterpret_cast<iterator*>(&raw_iterator);
  }

  iterator find(const rc_qname& key) const {
    RefCountedMap::iterator<rc_value> raw_iterator = ptr()->find(key);
    return *reinterpret_cast<iterator*>(&raw_iterator);
  }

  static const rc_map<rc_type>& empty() {
    return *reinterpret_cast<const rc_map<rc_type>*>(
        &RefCountedMap::empty_map());
  }
 private:
  explicit rc_map(RefCountedMap* map) : rc_value(map) {}
};

}

#endif
