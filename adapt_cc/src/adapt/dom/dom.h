#ifndef adapt_dom_dom_h
#define adapt_dom_dom_h

#include <string>
#include <unordered_map>
#include <vector>

#include "adapt/base/rc_string.h"
#include "adapt/base/rc_map.h"

namespace adapt {
namespace dom {

typedef size_t node_offset_t;

class DOM;
class Builder;
class Children;
class SafeElementRef;

class SingleAttributeParser {
 public:
  virtual rc_value parse(const rc_string& base_url,
      const char* text, size_t length) = 0;
};

class IdAttributeParser : public SingleAttributeParser {
 public:
  virtual rc_value parse(const rc_string& base_url,
      const char* text, size_t length) override {
    return rc_qname(text, length);
  }
};


class AttributeParser {
  typedef std::unordered_map<rc_qname,
      std::unique_ptr<SingleAttributeParser>> tag_map_type;
  typedef std::unordered_map<rc_qname, tag_map_type> map_type;
 public:
  AttributeParser() {
    // Ensure the catch-all entry exists and install id and xml:id parsers
    map_[rc_qname::atom(ID_asterisk)][rc_qname::atom(ID_id)] =
        std::unique_ptr<SingleAttributeParser>(new IdAttributeParser());
    map_[rc_qname::atom(ID_asterisk)][rc_qname::atom(ID_XML_id)] =
        std::unique_ptr<SingleAttributeParser>(new IdAttributeParser());
  }

  ~AttributeParser() {
  }

  rc_value parse(const rc_qname& tag, const rc_qname& attr,
      const rc_string& base_url, const char* text, size_t length) const {
    map_type::const_iterator tag_map = map_.find(tag);
    if (tag_map != map_.end()) {
      return parse(tag_map->second, attr, base_url, text, length);
    }
    assert(map_.find(rc_qname::atom(ID_asterisk)) != map_.end());
    return parse(map_.find(rc_qname::atom(ID_asterisk))->second,
        attr, base_url, text, length);
  }

  void add_parser(const rc_qname& tag, const rc_qname& attr,
      std::unique_ptr<SingleAttributeParser> parser) {
    map_[tag][attr] = std::move(parser);
  }

 private:
  rc_value parse(const tag_map_type& tag_map, const rc_qname& attr,
      const rc_string& base_url, const char* text, size_t length) const {
    tag_map_type::const_iterator parser = tag_map.find(attr);
    if (parser != tag_map.end()) {
      return parser->second->parse(base_url, text, length);
    }
    return rc_string(text, length);
  }

  map_type map_;
};

class Element {
  friend class DOM;
  friend class Children;
  friend class Builder;
 public:
  const rc_qname& qname() const { return qname_; }
  const rc_map<rc_value>& attributes() const { return attributes_; }
  node_offset_t text_offset() const { return text_offset_; }
  const rc_string& leading_text() const { return leading_text_; }
  const rc_string& following_text() const { return following_text_; }
  const Children* children() const { return children_; }

 private:
  Element() : attributes_(rc_map<rc_value>::empty()),
      text_offset_(0), children_(nullptr) {}

  void kill();
  
  rc_qname qname_;
  rc_map<rc_value> attributes_;
  node_offset_t text_offset_;
  rc_string leading_text_;
  rc_string following_text_;
  Children* children_;
};

class Children {
  friend class DOM;
  friend class Element;
  friend class Builder;
  friend class SafeElementRef;
 public:
  class iterator {
    friend class DOM;
    friend class Builder;
  public:
    typedef const iterator self_type;
    typedef std::random_access_iterator_tag iterator_category;
    typedef const Element value_type;
    typedef size_t size_type;
    typedef std::ptrdiff_t difference_type;
    typedef const Element* pointer;
    typedef const Element* const_pointer;
    typedef const Element& reference;
    typedef const Element& const_reference;

    iterator(const Children* c, const Element* p) : ch_(c), pos_(p) {}

    // Standard iterator methods.
    const value_type& operator*() const { return *pos_; };
    const value_type *operator->() const { return pos_; }
    self_type& operator++() { ++pos_; return *this; }
    self_type operator++(int) { self_type r(*this); ++(*this); return r; }
    self_type &operator--()  { --pos_; return *this; }
    self_type operator--(int)  { self_type r(*this); --(*this); return r; }
    self_type operator+(difference_type n) { return self_type(ch_, pos_ + n); }
    self_type &operator+=(difference_type n) { pos_ += n; return *this; }
    self_type operator-(difference_type n) { return self_type(ch_, pos_ - n); }
    difference_type operator-(const self_type& it) { return pos_ - it.pos_; }
    self_type &operator-=(difference_type n) { pos_ -= n; return *this; }
    bool operator==(const self_type &it) const { return pos_ == it.pos_; }
    bool operator!=(const self_type &it) const { return pos_ != it.pos_; }

    // DOM-specific
    bool has_parent() const { return ch_->parent_.ch_ != nullptr; }
    bool has_children() const { return pos_->children() != nullptr; }
    self_type parent() const { return iterator(ch_->parent_); }
    self_type begin() const { return pos_->children()->begin(); }
    self_type end() const { return pos_->children()->end(); }
    self_type last_child() const { return pos_->children()->end() - 1; }
    size_t child_index() const { return pos_ - ch_->elements_; }

    self_type child(size_t index) const {
      return pos_->children()->element(index);
    }

    // equivalent to .parent().end()
    self_type parent_end() const { return ch_->end(); }
    // equivalent to .parent().begin()
    self_type parent_begin() const { return ch_->begin(); }

    // null iterator
    static iterator null_iterator() { return iterator(nullptr, nullptr); }

  private:
    const Children* ch_;
    const Element* pos_;
  };

  size_t size() const { return size_; }
  iterator begin() const { return iterator(this, elements_); }
  iterator end() const { return iterator(this, elements_ + size_); }
  iterator last() const { return iterator(this, elements_ + size_ - 1); }

  iterator element(size_t index) const {
    assert(index < size_);
    return iterator(this, elements_ + index);
  }

 private:
  Children(const iterator& parent);
  ~Children();
  void * operator new(size_t size, size_t child_count);

  iterator parent_;
  size_t size_;
  Element elements_[1];
};

struct Position;

class DOM {
  friend class Builder;
  friend class SafeElementRef;
 public:
  typedef Children::iterator iterator;
  typedef rc_ref<SafeElementRef> safe_ref;

  DOM(const rc_string& document_url);
  ~DOM() { clear(); }

  iterator root() const { return root_->begin(); }
  rc_string document_url() const { return document_url_; }
  rc_string prefix_for_ns(const rc_string& ns) const;

  // Accepts naked id fragment identifiers and CFIs
  Position from_fragment_identifier(const rc_string& fragment);

  // with "#" prefix, always returns CFI
  rc_string to_fragment_identifier(const Position& position);

  iterator by_id(const rc_qname& id);

  node_offset_t offset_by_position(const Position& pos);
  Position position_by_offset(node_offset_t offset);

  // Iterators become invalid when Builder methods are called. Use
  // SafePosition instead.
  std::unique_ptr<Builder> builder(AttributeParser* attribute_parser);

  rc_qname lang() const;

  safe_ref safe(const iterator& it) const;

 private:
  void clear();
  void collect_ids(const iterator& it);

  // Find the node (element or text) with the largest offset that is
  // smaller than the given one.
  bool find_by_offset(node_offset_t offset, const Children** ch,
      const Element** element, bool* after, size_t* offset_in_node);

  Children* root_;
  Builder* builder_;
  std::unordered_map<rc_qname, rc_string> ns_to_prefix_map_;
  std::unordered_map<rc_qname, iterator> id_map_;
  rc_string document_url_;
};

class Builder {
  friend class DOM;
  friend class SafeElementRef;
 public:
  typedef Children::iterator iterator;

  void start_element(const rc_qname& qname, const rc_map<rc_value>& attr);
  void start_element_expat(const char* name, const char** attributes);
  void end_element();
  void end_all_elements();
  void characters(const rc_string& text);
  void characters(const char* text, int length);
  void add_prefix_mapping(const char* prefix, const char* ns);

  DOM::safe_ref last_element_safe() const;
  dom::node_offset_t last_element_offset() const;
  node_offset_t offset() const { return offset_; }
  bool after() const { return after_; }

  // Remove content at offsets larger than specified.
  void split_off_at(node_offset_t offset);

  DOM* dom() const { return dom_; }

  ~Builder();

 private:
  Builder(DOM* dom, AttributeParser* attribute_parser);
  void flush_text();

  struct ChildrenBuilder : public RefCountedObject {
    Children* block_;  // block_->size_ <= allocated_
    size_t allocated_;  // number of nodes allocated in the block
    rc_ref<ChildrenBuilder> parent_;  // block_->parent_ == parent_->block_

    ChildrenBuilder(const rc_ref<ChildrenBuilder> parent,
          Children* block, size_t allocated)
              : parent_(parent), block_(block), allocated_(allocated) {}

    Element* last() const {
      return &block_->elements_[block_->size_ - 1];
    }
  };

  void realloc_curr(size_t size);

  DOM* const dom_;
  AttributeParser* const attribute_parser_;
  rc_ref<ChildrenBuilder> curr_;
  bool after_;  // inside or after the current element
  node_offset_t offset_;
  std::string buf_;
  rc_string text_;  // for use if only a single rc_string text data is added
};

class SafeElementRef : public RefCountedObject {
  friend class DOM;
  friend class Builder;
 public:

  DOM::iterator get() const {
    const Children* ch = ch_ ? ch_ : chb_->block_;
    return DOM::iterator(ch, ch->elements_ + element_index_);
  }

 private:
  SafeElementRef(const Children* ch, size_t element_index);
  SafeElementRef(const rc_ref<Builder::ChildrenBuilder>& chb,
      size_t element_index);

  const Children* ch_;
  const rc_ref<Builder::ChildrenBuilder> chb_;
  const size_t element_index_;
};

enum SideBias {
  BIAS_NONE, BIAS_BEFORE, BIAS_AFTER
};

struct Position {
  DOM::iterator element;
  // false - inside element with zero offset meaning element itself
  // true - after element with zero offset meaning the first character after
  bool after;
  node_offset_t offset;
  SideBias side_bias = BIAS_NONE;
  // fragment identifier drilling down in the content referenced by the element
  rc_value ref;

  Position() : element(nullptr, nullptr), after(false), offset(0) {}
  Position(const DOM::iterator& elem, bool after_elem, node_offset_t noffset)
      : element(elem), after(after_elem), offset(noffset) {}

  bool valid() const { return element != Children::iterator::null_iterator(); }
};

class Parser {
 public:
  virtual ~Parser() {}
  virtual void write(const unsigned char* data, size_t length) = 0;
  virtual void close() = 0;

  // Create default implementation.
  static Parser* create(std::unique_ptr<Builder> builder);
};

}
}

#endif
