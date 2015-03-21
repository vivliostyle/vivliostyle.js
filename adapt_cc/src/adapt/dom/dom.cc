#include "adapt/dom/dom.h"

#include <unordered_set>

#include "adapt/dom/dom_expat.h"
#include "adapt/dom/cfi.h"

namespace adapt {
namespace dom {

//---------------------- Element --------------------------

void Element::kill()
{
  rc_value::kill(&qname_);
  rc_value::kill(&attributes_);
  rc_value::kill(&leading_text_);
  rc_value::kill(&following_text_);
  delete children_;
  children_ = nullptr;
}

//------------------- Children ----------------------------

void* Children::operator new(size_t size, size_t child_count) {
  return ::operator new(
      sizeof(Children) + (child_count - 1) * sizeof(Element));
}

Children::Children(const iterator& parent)
  : parent_(parent), size_(1) {
    // Exactly one element is initialized.
}

Children::~Children() {
  // Have to manually clear elements, since automatic destructor does
  // not know about extra elements at the end.
  for (size_t i = 0; i < size_; ++i) {
    elements_[i].kill();
  }
}


//----------------------- DOM --------------------------------

DOM::DOM(const rc_string& document_url)
  : root_(nullptr), document_url_(document_url), builder_(nullptr) {
}

void DOM::clear() {
  assert(!builder_);
  ns_to_prefix_map_.clear();
  id_map_.clear();
  delete root_;
  root_ = nullptr;
}

std::unique_ptr<Builder> DOM::builder(AttributeParser* attribute_parser) {
  if (!builder_) {
    clear();
    builder_ = new Builder(this, attribute_parser);
  }
  return std::unique_ptr<Builder>(builder_);
}

Position DOM::from_fragment_identifier(const rc_string& fragment) {
  Position result;
  if (fragment->starts_with("#epubcfi(") || fragment->starts_with("epubcfi(")) {
    rc_ref<CFIFragment> cfi = CFIFragment::from(fragment);
    if (!cfi.is_null()) {
      cfi->navigate(root(), &result);
    }
  } else if (!fragment->empty()) {
    rc_string id = fragment;
    if (id->starts_with("#")) {
      id = id->substr(1);
    }
    result.element = by_id(rc_qname(id));
  }
  if (!result.valid()) {
    result.element = root();
  }
  return result;
}

rc_string DOM::to_fragment_identifier(const Position& position) {
  rc_ref<CFIFragment> cfi = CFIFragment::from(position);
  if (cfi.is_null()) {
    return rc_string();
  }
  return cfi->to_string();
}

DOM::iterator DOM::by_id(const rc_qname& id) {
  if (id_map_.empty()) {
    id_map_.insert({rc_qname(), root()});  // makes it non-empty
    collect_ids(root());
  }
  auto it = id_map_.find(id);
  if (it == id_map_.end()) {
    return Children::iterator::null_iterator();
  }
  return it->second;
}

void DOM::collect_ids(const iterator& it) {
  const rc_map<rc_value>& attrs = it->attributes();
  auto att = attrs.find(rc_qname::atom(ID_id));
  if (att != attrs.end()) {
    id_map_.insert({rc_cast<rc_qname>(att->value), it});
  }
  att = attrs.find(rc_qname::atom(ID_XML_id));
  if (att != attrs.end()) {
    id_map_.insert({rc_cast<rc_qname>(att->value), it});
  }
  if (it.has_children()) {
    for (iterator child = it.begin(); child != it.end(); ++child) {
      collect_ids(child);
    }
  }
}

namespace {

struct compare_offsets {
  bool operator() (const Element& e1, const Element& e2) const {
    return e1.text_offset() < e2.text_offset();
  }
};

}

bool DOM::find_by_offset(node_offset_t offset, const Children** ch,
    const Element** element, bool* after, size_t* offset_in_node) {
  // Reference Element, to make use of standard library function.
  Element target;
  target.text_offset_ = offset;
  // Descend into the tree, doing binary search on each level.
  const Children* level = root_;
  const Element* e;
  node_offset_t offset_end;
  while (true) {
    const Element* begin = level->elements_;
    const Element* end = level->elements_ + level->size_;
    e = std::lower_bound(begin, end, target, compare_offsets());
    assert(e == end || e->text_offset_ >= offset);
    if (e == end || e->text_offset_ > offset) {
      assert(e != begin);
      --e;
      assert(e->text_offset_ < offset);
      if (e->children_) {
        if (offset >= e->children_->elements_[0].text_offset_) {
          // Descend deeper
          level = e->children_;
          continue;
        }
      } else {
        offset_end = e->text_offset_ + 1 + e->leading_text()->utf16_length();
        if (offset >= offset_end) {
          // move on to following text
          break;
        }
      }
    }
    *ch = level;
    *element = e;
    *offset_in_node = offset - e->text_offset_;
    *after = false;
    return true;
  }
  assert(!e->children_);
  while (level) {
    assert(offset >= offset_end);
    node_offset_t next = offset_end + e->following_text()->utf16_length();
    if (offset < next) {
      *ch = level;
      *element = e;
      *offset_in_node = offset - offset_end;
      *after = true;
      return true;
    }
    offset_end = next;
    e = level->parent_.pos_;
    level = level->parent_.ch_;
  }
  return false;
}


node_offset_t DOM::offset_by_position(const Position& pos) {
  if (!pos.after) {
    return pos.element->text_offset() + pos.offset;
  }
  DOM::iterator element = pos.element;
  node_offset_t extra_offset = pos.offset;
  while (element->children()) {
    element = element->children()->last();
    extra_offset += element->following_text()->utf16_length();
  }
  extra_offset += element->leading_text()->utf16_length();
  ++extra_offset;
  return element->text_offset() + extra_offset;
}

Position DOM::position_by_offset(node_offset_t offset) {
  Position p;
  find_by_offset(offset, &p.element.ch_, &p.element.pos_, &p.after, &p.offset);
  return p;
}

rc_qname DOM::lang() const {
  return rc_qname::atom(ID_en);
}

DOM::safe_ref DOM::safe(const DOM::iterator& it) const {
  // Determine if the block to which we are pointing is fully built.
  size_t element_index = it.pos_ - it.ch_->elements_;
  if (builder_) {
    const rc_ref<Builder::ChildrenBuilder>* ptr = &builder_->curr_;
    while (!ptr->is_null()) {
      if ((*ptr)->block_ == it.ch_) {
        // Still being built, could be resized, save pointer to
        // ChildrenBuilder which will be updated with block pointer.
        return new SafeElementRef(*ptr, element_index);
      }
    }
  }
  // Safe to point to Children
  return new SafeElementRef(it.ch_, element_index);
}

//---------------------- Builder --------------------------

Builder::Builder(DOM* dom, AttributeParser* attribute_parser)
    : dom_(dom), after_(false), attribute_parser_(attribute_parser),
        offset_(0) {}

Builder::~Builder() {
  end_all_elements();
  dom_->builder_ = nullptr;
}

void Builder::flush_text() {
  rc_string* target;
  Element* last = curr_->last();
  if (after_) {
    target = &last->following_text_;
  } else {
    target = &last->leading_text_;
  }
  if (!buf_.empty()) {
    assert(target->is_null() || (*target)->empty());
    *target = rc_string(buf_.data(), buf_.length());
    buf_.erase();
  } else {
    assert(target->is_null() || (*target)->empty());
    *target = text_;
    text_ = rc_string();
  }
}

static rc_qname make_qname_expat(const char* name) {
  const char* sep = strchr(name, EXPAT_NS_SEPARATOR);
  if (sep) {
    return rc_qname(rc_string(name, sep - name), rc_string(sep + 1));
  }
  return rc_qname(name);
}

void Builder::realloc_curr(size_t new_allocated) {
  // Grow the children array.
  Children* blk = reinterpret_cast<Children*>(::operator new(
        sizeof(Children) + (new_allocated - 1) * sizeof(Element)));
  ::memcpy(blk, curr_->block_,
      sizeof(Children) + (curr_->block_->size_ - 1) * sizeof(Element));
  ::operator delete(curr_->block_);
  curr_->block_ = blk;
  curr_->allocated_ = new_allocated;
  // Now fix all the references.
  const_cast<Element*>(&*blk->parent_)->children_ = blk;
  for (size_t i = 0; i < blk->size_; ++i) {
    Element* element = &blk->elements_[i];
    if (element->children_) {
      element->children_->parent_ = iterator(blk, element);
    }
  }
}

void Builder::start_element(
    const rc_qname& qname, const rc_map<rc_value>& attributes) {
  if (!curr_.is_null()) {
    flush_text();
  }
  if (dom_->root_) {
    if (after_) {
      if (curr_->block_->size_ >= curr_->allocated_) {
        assert(curr_->block_->size_ == curr_->allocated_);
        realloc_curr(2 * curr_->allocated_);
      }
      ++curr_->block_->size_;
      memset(curr_->last(), 0, sizeof(Element));
    } else {
      // first child
      const size_t initial_size = 10;
      Element* last = curr_->last();
      Children* blk = new(initial_size) Children(curr_->block_->last());
      curr_ = new ChildrenBuilder(curr_, blk, initial_size);
      last->children_ = blk;
    }
  } else {
    // creating root element
    dom_->root_ = new(1) Children(Children::iterator::null_iterator());
    curr_ = new ChildrenBuilder(rc_ref<ChildrenBuilder>(), dom_->root_, 1);
  }
  after_ = false;
  Element* last = curr_->last();
  last->text_offset_ = offset_;
  ++offset_;
  last->qname_ = qname;
  last->attributes_ = attributes;
  last->leading_text_ = rc_string();
  last->following_text_ = rc_string();
}

void Builder::start_element_expat(const char* name, const char** atts) {
  rc_qname qname = make_qname_expat(name);
  std::map<rc_qname, rc_value> att_map;
  while (*atts) {
    rc_qname att_name = make_qname_expat(*(atts++));
    size_t length = strlen(*atts);
    att_map[att_name] = attribute_parser_->parse(qname, att_name,
        dom_->document_url(), *atts, length);
    atts++;
  }
  start_element(qname, rc_map<rc_value>(att_map));
}

void Builder::end_element() {
  flush_text();
  if (after_) {
    if (curr_->block_->size_ != curr_->allocated_) {
      realloc_curr(curr_->block_->size_);
    }
    curr_ = curr_->parent_;
  } else {
    after_ = true;
  }
}

void Builder::end_all_elements() {
  while (!curr_.is_null()) {
    end_element();
  }
}

void Builder::characters(const rc_string& text) {
  offset_ += text->utf16_length();
  if (text_->empty()) {
    if (buf_.empty()) {
      text_ = text;
      return;
    }
  } else {
    buf_.append(text_->utf8(), text_->length());
    text_ = rc_string::empty_string();
  }
  buf_.append(text->utf8(), text->length());
}

void Builder::characters(const char* text, int length) {
  offset_ += utf8_length16(text, length);
  if (!text_->empty()) {
    buf_.append(text_->utf8(), text_->length());
    text_ = rc_string::empty_string();
  }
  buf_.append(text, length);
}

void Builder::add_prefix_mapping(const char* prefix, const char* ns) {
  dom_->ns_to_prefix_map_[rc_qname(ns ? ns : "")] = prefix ? prefix : "";
}

dom::node_offset_t Builder::last_element_offset() const {
  return curr_->last()->text_offset();
}


DOM::safe_ref Builder::last_element_safe() const {
  return new SafeElementRef(curr_, curr_->block_->size_ - 1);
}

void Builder::split_off_at(dom::node_offset_t offset) {
  flush_text();
  const Children* ch;
  const Element* element;
  size_t offset_in_node;
  bool after;
  if (!dom_->find_by_offset(offset, &ch, &element, &after, &offset_in_node)) {
    assert(false);
    return;
  }
  assert(offset == dom_->offset_by_position(
      Position(Children::iterator(ch, element), after, offset_in_node)));

  std::unordered_set<const Children*> to_keep;
  for (const Children* p = ch; p; p = p->parent_.ch_) {
    to_keep.insert(p);
  }

  assert(buf_.empty());
  assert(text_->empty());
  offset_ = offset;
  after_ = after;

  size_t index = element - ch->elements_;
  if (element->text_offset_ == offset) {
    // Kill the element itself
    if (index == 0) {
      // Kill all the parent's children
      element = ch->parent_.pos_;
      index = element - ch->parent_.ch_->elements_;
      after_ = false;
      ch = ch->parent_.ch_;
      Element* elem = const_cast<Element*>(element);
      delete elem->children_;
      elem->children_ = nullptr;
      elem->following_text_ = rc_string();
      // "Unflush" the text
      text_ = element->leading_text_;
      elem->leading_text_ = rc_string();
    } else {
      index--;
      element--;
      after_ = true;
      // "Unflush" the text
      text_ = element->following_text_;
      const_cast<Element*>(element)->following_text_ = rc_string();
    }
  } else {
    // Trim the text
    Element* elem = const_cast<Element*>(element);
    rc_string* text;
    if (after) {
      text = &elem->following_text_;
    } else {
      // children follow leading text, kill them.
      offset_in_node--;
      text = &elem->leading_text_;
      Element* elem = const_cast<Element*>(element);
      delete elem->children_;
      elem->children_ = nullptr;
      // Also kill following text
      elem->following_text_ = rc_string();
    }
    printf("Trimmed: %s\n", (*text)->utf16_substr(offset_in_node)->utf8());
    // Also "unflush" it
    text_ = (*text)->utf16_substr(0, offset_in_node);
    *text = rc_string();
  }

  // See where ChildrenBuilder chain joins
  while (to_keep.find(curr_->block_) == to_keep.end()) {
    curr_ = curr_->parent_;
  }

  // Build new section of ChildrenBuilder chain
  rc_ref<ChildrenBuilder> target = curr_;
  rc_ref<ChildrenBuilder>* chain = &curr_;
  Children* block = const_cast<Children*>(ch);
  while (block != target->block_) {
    size_t allocated = block->size_;
    size_t new_size = index + 1;
    *chain = new ChildrenBuilder(target, block, allocated);
    (*chain)->block_->size_ = new_size;
    for (size_t k = new_size; k < allocated; ++k) {
      (*chain)->block_->elements_[k].kill();
    }
    chain = &(*chain)->parent_;
    index = block->parent_.pos_ - block->parent_.ch_->elements_;
    const_cast<Element*>(block->parent_.pos_)->following_text_ = rc_string();
    block = const_cast<Children*>(block->parent_.ch_);
  }

  // Adjust the existing ChildrenBuilder chain
  while (true) {
    Children* block = target->block_;
    size_t old_size = block->size_;
    size_t new_size = index + 1;
    block->size_ = new_size;
    for (size_t k = new_size; k < old_size; ++k) {
      block->elements_[k].kill();
    }
    if (!block->parent_.pos_) {
      break;
    }
    index = block->parent_.pos_ - block->parent_.ch_->elements_;
    const_cast<Element*>(block->parent_.pos_)->following_text_ = rc_string();
    target = target->parent_;
  }
}

//--------------------------------------------------------------------

Parser* Parser::create(std::unique_ptr<Builder> builder) {
  return create_expat_parser(std::move(builder));
}

//----------------------- SafeElementRef -----------------------------

SafeElementRef::SafeElementRef(const Children* ch,
    size_t element_index) : ch_(ch), element_index_(element_index) {}

SafeElementRef::SafeElementRef(
    const rc_ref<Builder::ChildrenBuilder>& chb, size_t element_index)
        : ch_(nullptr), chb_(chb), element_index_(element_index) {}

}
}
