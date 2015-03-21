#ifndef adapt_base_rc_list_h
#define adapt_base_rc_list_h

#include <vector>

#include "adapt/base/rc_value.h"
#include "adapt/base/rc_string.h"

namespace adapt {

class RefCountedList : public RefCounted {
  friend class RefCounted;
 public:
  RefCountedList(const rc_value* list, size_t length);
  RefCountedList(const std::vector<rc_value>& list,
      size_t index, size_t length);
  RefCountedList(const RefCountedList* list, size_t off, size_t length);

  void* operator new(size_t size, size_t entry_count) {
    if (entry_count == 0) {
      // Have to reserve at least that much.
      entry_count = 1;
    }
    return ::operator new(
        sizeof(RefCountedList) - 1 + entry_count * sizeof(rc_value));
  }

  bool empty() const { return size_ == 0; }

  const rc_value& get(size_t index) const {
    assert(index < size_);
    return values_[index];
  }

  size_t size() const { return size_; }

  size_t hash() const;
  bool operator==(const RefCountedList& other) const;
  void write_to(Writer* writer) const;

  RefCountedList* concat(const RefCountedList* other) const;

  template<typename rc_type> class iterator {
   public:
    typedef iterator<rc_type> self_type;
    typedef std::random_access_iterator_tag iterator_category;
    typedef rc_type value_type;
    typedef size_t size_type;
    typedef std::ptrdiff_t difference_type;
    typedef const rc_type* pointer;
    typedef const rc_type* const_pointer;
    typedef const rc_type& reference;
    typedef const rc_type& const_reference;

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
    const rc_type* pos_;
  };

  iterator<rc_value> begin() const { return iterator<rc_value>(values_); }
  iterator<rc_value> end() const { return iterator<rc_value>(values_ + size_); }

  static const rc_value& empty_list();

 private:
  void destroy();

  const size_t size_;
  const rc_value values_[1];
};

template<typename rc_type> class rc_list : public rc_value {
  friend rc_list rc_cast<rc_list>(const rc_value& value);
 public:
  typedef RefCountedList::iterator<rc_type> iterator;
  typedef RefCountedList object_type;
  static const RefCounted::Kind KIND = RefCounted::LIST;

  rc_list() : rc_value(empty()) {}

  explicit rc_list(const std::vector<rc_type>& list)
      : rc_value(new(list.size()) RefCountedList(
        *reinterpret_cast<const std::vector<rc_value>*>(&list),
            0, list.size())) {}

  explicit rc_list(const std::vector<rc_type>& list, size_t off, size_t length)
      : rc_value(new(length) RefCountedList(
        *reinterpret_cast<const std::vector<rc_value>*>(&list), off, length)) {}
  
  explicit rc_list(const rc_value* list, size_t length)
      : rc_value(new(length) RefCountedList(list, length)) {}

  explicit rc_list(const rc_list& list, size_t off, size_t length)
      : rc_value(new(length) RefCountedList(list.ptr(), off, length)) {}

  static rc_list of(const rc_value& v1) {
    return rc_list(&v1, 1);
  }

  static rc_list of(const rc_value& v1, const rc_value& v2) {
    rc_value arr[] = {v1, v2};
    return rc_list(arr, 2);
  }

  static rc_list of(const rc_value& v1, const rc_value& v2,
                    const rc_value& v3) {
    rc_value arr[] = {v1, v2, v3};
    return rc_list(arr, 3);
  }
  
  static rc_list of(const rc_value& v1, const rc_value& v2,
                    const rc_value& v3, const rc_value& v4) {
    rc_value arr[] = {v1, v2, v3, v4};
    return rc_list(arr, 4);
  }

  rc_list concat(const rc_list& other) const {
    return rc_list(ptr()->concat(other.ptr()));
  }
  
  RefCountedList* operator->() const { return ptr(); }

  const rc_type& operator[](size_t index) const {
    return *reinterpret_cast<const rc_type*>(&ptr()->get(index));
  }

  bool operator==(const rc_list& other) const {
    return *ptr() == *other.ptr();
  }
    
  bool operator!=(const rc_list& other) const {
    return !(*ptr() == *other.ptr());
  }

  RefCountedList* ptr() const {
    return static_cast<RefCountedList*>(raw_ptr());
  }
    
  iterator begin() const {
    RefCountedList::iterator<rc_value> raw_iterator = ptr()->begin();
    return *reinterpret_cast<iterator*>(&raw_iterator);
  }

  iterator end() const {
    RefCountedList::iterator<rc_value> raw_iterator = ptr()->end();
    return *reinterpret_cast<iterator*>(&raw_iterator);
  }
    
  static const rc_list<rc_type>& empty() {
    return *reinterpret_cast<const rc_list<rc_type>*>(
        &RefCountedList::empty_list());
  }

 private:
  explicit rc_list(RefCountedList* list) : rc_value(list) {}
};

}

namespace std {

template<> struct hash<adapt::rc_list<adapt::rc_string>> {
  size_t operator() (const adapt::rc_list<adapt::rc_string>& list) const {
    return list->hash();
  }
};
  
}


#endif
