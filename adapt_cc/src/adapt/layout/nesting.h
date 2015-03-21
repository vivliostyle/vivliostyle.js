#ifndef adapt_layout_nesting_h
#define adapt_layout_nesting_h

#include "adapt/css/value.h"
#include "adapt/css/styler.h"
#include "adapt/layout/page.h"
#include "adapt/font/font.h"
#include "adapt/load/package.h"

namespace adapt {
namespace layout {

class NestingProcessor;

// "Computed" CSS style for a single element. Note that this does not
// exactly correspond to what CSS standard defines as computed style; this
// is as computed as it can practically be before doing actual layout.
class ComputedElementStyle {
  typedef std::unordered_map<rc_qname, rc_ref<css::CSSValue>>::const_iterator
      raw_iterator;
  friend class NestingProcessor;
public:
  class iterator {
    friend class ComputedElementStyle;
  public:
    typedef iterator self_type;
    typedef std::forward_iterator_tag iterator_category;
    typedef raw_iterator::value_type value_type;
    typedef size_t size_type;
    typedef std::ptrdiff_t difference_type;
    typedef const value_type* pointer;
    typedef const value_type* const_pointer;
    typedef const value_type& reference;
    typedef const value_type& const_reference;

    const value_type& operator*() const { return iterator_.operator*(); };
    const value_type *operator->() const { return iterator_.operator->(); }

    self_type& operator++() {
      ++iterator_;
      if (inh_ && iterator_ == owner_->inherited_.end()) {
        iterator_ = owner_->noninherited_.begin();
        inh_ = false;
      }
      return *this;
    }

    self_type operator++(int) { self_type r(*this); ++(*this); return r; }

    bool operator==(const self_type &it) const {
      return iterator_ == it.iterator_ && inh_ == it.inh_;
    }

    bool operator!=(const self_type &it) const {
      return iterator_ != it.iterator_ || inh_ != it.inh_;
    }

  private:
    iterator(const ComputedElementStyle* owner, raw_iterator it, bool inh)
        : owner_(owner), iterator_(it), inh_(inh) {}
    raw_iterator iterator_;
    const ComputedElementStyle* owner_;
    bool inh_;
  };

  iterator begin() const {
    return inherited_.empty() ? wrap_noninh(noninherited_.begin())
        : wrap_inh(inherited_.begin());
  }
  
  iterator end() const { return wrap_noninh(noninherited_.end()); }
  iterator find(const rc_qname& prop) const {
    raw_iterator it = inherited_.find(prop);
    if (it != inherited_.end()) {
      return wrap_inh(it);
    }
    return wrap_noninh(noninherited_.find(prop));
  }

  rc_ref<css::CSSValue> operator[] (const rc_qname& prop) const {
    iterator it = find(prop);
    if (it == end()) {
      return css::CSSEmpty::instance();
    }
    return it->second;
  }

private:
  ComputedElementStyle(
      const std::unordered_map<rc_qname, rc_ref<css::CSSValue>>& inherited,
      const std::unordered_map<rc_qname, rc_ref<css::CSSValue>>& noninherited)
  : inherited_(inherited), noninherited_(noninherited) {}

  iterator wrap_inh(raw_iterator it) const {
    assert (it != inherited_.end());
    return iterator(this, it, true);
  }

  iterator wrap_noninh(raw_iterator it) const {
    return iterator(this, it, false);
  }

  const std::unordered_map<rc_qname, rc_ref<css::CSSValue>>& inherited_;
  const std::unordered_map<rc_qname, rc_ref<css::CSSValue>>& noninherited_;
};

// Handle inheritance to figure out the computed style.
class NestingProcessor {
public:
  NestingProcessor(load::Package* package, expr::Context* context,
      const css::RelativeSizes& sizes, const rc_list<rc_qname>& regions);

  NestingProcessor(const NestingProcessor& other);

  void push(const css::element_style& style);

  // Properties for enclosing block element for inline, this element for block.
  const rc_ref<BlockProperties>& block_properties() {
    return block_properties_;
  }

  // This element's properties (only if it is inline)
  const rc_ref<InlineProperties>& inline_properties() {
    return inline_properties_;
  }

  void enter_element(const rc_ref<media::Media>& media, bool first_time);

  void report_box_size(const css::BoxRelativeSizes& box_size);
  void report_font_size(const css::FontRelativeSizes& font_size);

  void pop();

  ComputedElementStyle computed_style();

  rc_ref<css::CSSValue> noninherited(const rc_qname& prop) {
    const Level& level = nesting_stack_.top();
    auto it = level.noninherited.find(prop);
    if (it == level.noninherited.end()) {
      return rc_ref<css::CSSValue>();
    }
    return it->second;
  }

  bool begin_content(float edge_margin);

  const css::RelativeSizes& sizes() const { return sizes_; }

  expr::Context* context() const { return context_; }

  rc_ref<font::Font> font() const { return nesting_stack_.top().font_; }

  size_t depth() const { return nesting_stack_.size(); }

 private:
  typedef std::unordered_map<rc_qname, rc_ref<css::CascadeValue>> cascade_map;
  typedef void (NestingProcessor::*bg_setter)(
      Background* bg, const rc_ref<css::CSSValue>& v);

  void enter_block_element(const rc_ref<media::Media>& media, bool first_time);
  void enter_inline_element(const rc_ref<media::Media>& media, bool first_time);

  void fill_box_block(Box* box);

  void resolve_font();
  void push_inheritance(const cascade_map& cm, bool font_props);
  void cascade_style(cascade_map* cm, const css::element_style& style,
      bool* font_props);

  rc_ref<media::Media> get_media(dom::DOM::iterator source_node);

  rc_ref<css::CSSValue> compute(const rc_qname& prop,
      const rc_ref<css::CascadeValue>& value);

  struct Level {
    std::unordered_map<rc_qname,rc_ref<css::CSSValue>> saved_inherited;
    std::unique_ptr<css::BoxRelativeSizes> saved_box_size;
    std::unique_ptr<css::FontRelativeSizes> saved_font_size;
    rc_ref<BlockProperties> saved_block_properties;
    rc_ref<InlineProperties> saved_inline_properties;
    std::unordered_map<rc_qname,rc_ref<css::CSSValue>> noninherited;
    rc_ref<font::Font> font_;
  };

  expr::Context* context_;
  load::Package* package_;
  rc_list<rc_qname> regions_;
  std::unordered_map<rc_qname, rc_ref<css::CSSValue>> computed_inherited_;
  css::RelativeSizes sizes_;
  rc_ref<InlineProperties> inline_properties_;
  rc_ref<BlockProperties> block_properties_;
  rc_ref<BlockProperties> outermost_leading_block_properties_;
  std::stack<Level> nesting_stack_;
};

}
}

#endif

