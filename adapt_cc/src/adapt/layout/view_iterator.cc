#include "adapt/layout/view_iterator.h"

#include "adapt/base/url.h"
#include "adapt/doc/xml_content.h"
#include "adapt/doc/container.h"

namespace adapt {
namespace layout {

namespace {

class PseudoelementStyler : public css::Styler {
 public:
  PseudoelementStyler(const rc_map<css::element_style>& pseudos,
      const rc_string& base_url) : pseudos_(pseudos), base_url_(base_url) {}

 rc_string base_url(const dom::DOM::iterator& element) override {
   return base_url_;
 }

 css::element_style get_style(const dom::DOM::iterator& element,
                                  bool deep) override {
   const auto& attrs = element->attributes();
   auto cl = attrs->find(rc_qname::atom(ID_class));
   if (cl != attrs.end()) {
     auto style = pseudos_.find(rc_cast<rc_qname>(cl->value));
     if (style != pseudos_.end()) {
       return style->value;
     }
   }
   return css::element_style();
 }

 private:
  rc_map<css::element_style> pseudos_;
  rc_string base_url_;
};

class ContentPropertyVisitor : public css::CSSVisitor {
 public:
  ContentPropertyVisitor(dom::DOM::iterator elem, dom::Builder* builder)
      : elem_(elem), builder_(builder) {}

  virtual rc_ref<css::CSSValue> visit_string(css::CSSString* value) override {
    builder_->characters(value->str());
    return value;
  }

  virtual rc_ref<css::CSSValue> visit_ident(css::CSSIdent* value) override {
    return value;
  }

  virtual rc_ref<css::CSSValue> visit_url(css::CSSUrl* value) override {
    return value;
  }

  virtual rc_ref<css::CSSValue> visit_comma_list(
      css::CSSCommaList* value) override {
    return filter_comma_list(value);
  }

  virtual rc_ref<css::CSSValue> visit_function(
      css::CSSFunction* value) override {
    return value;
  }
 private:
  dom::DOM::iterator elem_;
  dom::Builder* builder_;
};

}

ShadowTree::ShadowTree() {
  printf("ShadowTree: %lx\n", (size_t)this);
}

ShadowTree::~ShadowTree() {
  xmlrend = rc_ref<doc::XMLContentRenderer>();
  printf("~ShadowTree: %lx\n", (size_t)this);
}


ViewIterator::ViewIterator(doc::XMLContentRenderer* xmlrend,
    const rc_qname& flow_name, expr::Context* context,
    const css::RelativeSizes& sizes, Viewport* viewport,
    css::Styler* styler, const rc_list<rc_qname>& region_ids,
    FontFaces* font_faces, const css::element_style& footnoteStyle,
    Page* page, CustomRenderer* custom_renderer,
    const std::unordered_map<rc_string, rc_string>& fallback_map)
       : page_(page), xmlrend_(xmlrend), flow_name_(flow_name),
         nesting_processor_(xmlrend->package(), context, sizes, region_ids) {
  shadow_context_ = new ShadowContext(styler);
}

ViewIterator::ViewIterator(const ViewIterator& other)
    : page_(other.page_), xmlrend_(other.xmlrend_),
      nesting_processor_(other.nesting_processor_) {}

bool ViewIterator::load_media(const rc_value& src, const rc_value& media_type) {
  if (!src.is_null()) {
    assert(src->is<rc_string>());
    rc_string src_str = rc_cast<rc_string>(src);
    rc_string base_url =
        shadow_context_->styler->base_url(node_context_->source_node_);
    src_str = resolve_url(base_url, src_str);
    load::Package* package = xmlrend_->package();
    if (src_str->starts_with(package->root_url())) {
      src_str = src_str->substr(package->root_url()->length());
      rc_binary data = rc_binary(package->read(src_str));
      if (data->length() > 0) {
        media_ = media::load(data, rc_string::empty_string());
        return !media_.is_null();
      }
    }
  }
  return false;
}


bool ViewIterator::init_element() {
  assert (node_context_->relpos_ != EXITING);
  // May not be entering element yet, but need to determine what kind of
  // element it is
  css::element_style applied_style =
      shadow_context_->styler->get_style(node_context_->source_node_, false);
  rc_ref<css::CascadeValue> cv = applied_style[rc_qname::atom(ID_display)];
  // elements are inline by default
  if (!cv.is_null()) {
    int display = cv->evaluate(
        nesting_processor_.context(), rc_qname::atom(ID_display))->id();
    switch (display) {
      case ID_EMPTY :
      case ID_inline :
      case ID_inline_block :
        // inline
        break;
      case ID_none :
        node_context_->kind_ = NodeContext::IS_IGNORED;
        return false;
      default:
        node_context_->kind_ = NodeContext::BLOCK;
    }
  }
  cv = applied_style[rc_qname::atom(ID_flow_into)];
  if (!cv.is_null()) {
    rc_ref<css::CSSValue> val = cv->evaluate(nesting_processor_.context(),
        rc_qname::atom(ID_flow_into));
    if (val->is<rc_ref<css::CSSIdent>>() &&
        static_cast<css::CSSIdent*>(val.ptr())->name().ptr()
            != flow_name_.ptr()) {
      node_context_->kind_ = NodeContext::IS_IGNORED;
      return false;
    }
  }
  dom::DOM::iterator source_node = node_context_->source_node_;
  switch (source_node->qname()->id()) {
    case ID_XHTML_img:
      node_context_->kind_ |= NodeContext::IS_MEDIA;
      load_media(source_node->attributes()[rc_qname::atom(ID_src)],
          source_node->attributes()[rc_qname::atom(ID_type)]);
      break;
  }
  return true;
}

bool ViewIterator::create_pseudoelement_node(dom::Builder* builder,
    const rc_map<css::element_style>& pseudoelements, const rc_qname& name) {
  auto props = pseudoelements.find(name);
  if (props == pseudoelements.end()) {
    return false;
  }
  rc_map<rc_value> class_attr {
    { rc_qname::atom(ID_class), name }
  };
  builder->start_element(rc_qname::atom(ID_XHTML_span), class_attr);
  rc_ref<css::CascadeValue> cv = props->value[rc_qname::atom(ID_content)];
  if (!cv.is_null()) {
    ContentPropertyVisitor cpv(node_context_->source_node_, builder);
    cv->evaluate(nesting_processor_.context(),
        rc_qname::atom(ID_content))->visit(&cpv);
  }
  return true;
}

void ViewIterator::create_pseudoelement_shadow_tree(
    const rc_map<css::element_style>& pseudoelements) {
  static dom::AttributeParser attribute_parser;
  std::unique_ptr<dom::DOM> dom(new dom::DOM(rc_string()));
  std::unique_ptr<dom::Builder> builder = dom->builder(&attribute_parser);
  bool need_shadow = false;
  builder->start_element(rc_qname::atom(ID_SHADOW_root),
      rc_map<rc_value>::empty());
  if (create_pseudoelement_node(builder.get(), pseudoelements,
      rc_qname::atom(ID_before))) {
    builder->end_element();
    need_shadow = true;
  }
  builder->start_element(rc_qname::atom(ID_SHADOW_content),
      rc_map<rc_value>::empty());
  builder->end_element();
  if (create_pseudoelement_node(builder.get(), pseudoelements,
      rc_qname::atom(ID_after))) {
    builder->end_element();
    need_shadow = true;
  }
  builder->end_element();
  builder.reset();
  if (need_shadow) {
    rc_ref<ShadowTree> shadow = new ShadowTree();
    shadow->rootless = true;
    shadow->shadow_root = dom->root();
    shadow->tmp_dom = std::move(dom);
    shadow->tmp_styler = std::unique_ptr<css::Styler>(
        new PseudoelementStyler(pseudoelements,
            shadow_context_->styler->base_url(node_context_->source_node_)));
    shadow->styler = shadow->tmp_styler.get();
    shadow->super_shadow = std::move(node_context_->shadow_);
    node_context_->shadow_ = std::move(shadow);
  }
}

void ViewIterator::create_template_shadow_tree(
    const rc_ref<css::CSSValue>& tmpl) {
  if (!tmpl->is<rc_ref<css::CSSUrl>>()) {
    return;
  }
  rc_string url = rc_cast<rc_ref<css::CSSUrl>>(tmpl)->url();
  rc_string docurl = strip_url_fragment_and_query(url);
  rc_ref<doc::XMLContentRenderer> res =
      xmlrend_->container_renderer()->get_xml_renderer(docurl);
  if (res.is_null()) {
    return;
  }
  rc_string fragment = get_url_fragment(url);
  if (fragment->empty()) {
    return;
  }
  dom::DOM::iterator root = res->xmldoc()->dom()->by_id(rc_qname(fragment));
  if (root == dom::Children::iterator::null_iterator()) {
    return;
  }
  rc_ref<ShadowTree> shadow = new ShadowTree();
  shadow->shadow_root = root;
  shadow->rootless = true;
  shadow->text = root->leading_text();
  shadow->xmlrend = res;
  shadow->styler = res->content_layout_instance()->styler();
  shadow->super_shadow = std::move(node_context_->shadow_);
  node_context_->shadow_ = std::move(shadow);
}

void ViewIterator::create_content_shadow_tree() {
  rc_ref<ShadowTree> shadow = new ShadowTree();
  shadow->rootless = true;
  shadow->content = true;
  shadow->shadow_root = shadow_context_->owner;
  shadow->text = shadow_context_->owner->leading_text();
  shadow->super_shadow = std::move(node_context_->shadow_);
  node_context_->shadow_ = std::move(shadow);
}


void ViewIterator::enter_element(bool first_time) {
  assert (node_context_->relpos_ == ENTERED);
  applied_style_ = shadow_context_->styler->get_style(
      node_context_->source_node_, false);
  nesting_processor_.push(applied_style_);
  nesting_processor_.enter_element(media_, first_time);
  media_ = rc_ref<media::Media>();
  // shadow:content
  if (node_context_->source_node_->qname()->id() == ID_SHADOW_content) {
    create_content_shadow_tree();
  }
  // -adapt-template property
  rc_ref<css::CSSValue> tmpl =
      nesting_processor_.noninherited(rc_qname::atom(ID_template));
  if (!tmpl.is_null() && tmpl->id() != ID_none) {
    create_template_shadow_tree(tmpl);
  }
  // pseudoelement shadow tree
  rc_map<css::element_style> pseudoelements = applied_style_.pseudos();
  if (!pseudoelements.is_null()) {
    create_pseudoelement_shadow_tree(pseudoelements);
  }
}

void ViewIterator::init_current(const rc_ref<NodeContext>& node_context) {
  assert(node_context->relpos_ != EXITING);
  if (!node_context_.is_null() && !node_context_->shadow_.is_null()) {
    create_shadow_context();
  }
  node_context_ = node_context;
  init_element();
  if (node_context_->relpos_ == ENTERED) {
    enter_element(false); // shadow tree may get attached here!
  }
}

void ViewIterator::create_shadow_context() {
  if (node_context_->shadow_->content) {
    const ShadowContext* owner = shadow_context_->owner_context.ptr();
    shadow_context_ = new ShadowContext(owner->owner_context,
        shadow_context_, owner->styler, owner->owner_shadow,
        owner->owner);
  } else {
    shadow_context_ = new ShadowContext(shadow_context_,
        node_context_->shadow_.ptr(), node_context_->source_node_);
  }
}

void ViewIterator::next_in_tree() {
  switch (node_context_->relpos_) {
    case ENTERING: {
      ensure_unique();
      node_context_->relpos_ = ENTERED;
      enter_element(true);  // shadow tree may get attached here!
      return;
    }
    case ENTERED: {
      if (!node_context_->shadow_.is_null()) {
        // if there is shadow tree, process it first
        dom::DOM::iterator shadow_child = node_context_->shadow_->shadow_root;
        if (node_context_->shadow_->rootless) {
          if(!shadow_child->children()) {
            ensure_unique();
            node_context_->relpos_ = EXITING;
            return;
          }
          shadow_child = shadow_child->children()->begin();
        }
        create_shadow_context();
        node_context_ = new NodeContext(node_context_, shadow_child);
        if (init_element()) {
          return;
        }
      } else if (node_context_->source_node_.has_children()) {
        // any children?
        dom::DOM::iterator child = node_context_->source_node_.begin();
        node_context_ = new NodeContext(node_context_, child);
        if (init_element()) {
          return;
        }
      } else {
        ensure_unique();
        node_context_->relpos_ = EXITING;
        return;
      }
      break;
    }
    case EXITING: {
      ensure_unique();
      node_context_->relpos_ = EXITED;
      nesting_processor_.pop();
      return;
    }
    case EXITED: {
      NodeContext* parent = node_context_->parent_.ptr();
      if (!parent) {
        // We are at root, that was the last possible position
        node_context_ = rc_ref<NodeContext>();
        return;
      }
      dom::DOM::iterator node = node_context_->source_node_;
      // If parent has shadow tree, we are "coming out" of the shadow
      // However if the shadow is rootless, we need to go through all the
      // siblings first
      ShadowTree* parent_shadow = parent->shadow_.ptr();
      if (parent_shadow && !parent_shadow->rootless) {
        // artificially move to the end
        node = node.parent_end();
      } else {
        ++node;
      }
      // Move to the next sibling, if any
      if (node != node.parent_end()) {
        ensure_unique();
        node_context_->source_node_ = node;
        node_context_->reset_view();
        if (init_element()) {
          return;
        }
      } else {
        // Move to EXITING position for the parent
        node_context_ = node_context_->parent_;
        ensure_unique();
        node_context_->relpos_ = EXITING;
        if (parent_shadow) {
          assert(shadow_context_->owner == node_context_->source_node_
              || node_context_->source_node_->qname()->id()
                  == ID_SHADOW_content);
          shadow_context_ = shadow_context_->caller_context;
        }
        return;
      }
      break;
    }
  }
  assert (node_context_->ignored());
  // skip
  node_context_->relpos_ = EXITED;  // still need to render text after
}

void ViewIterator::restore_node_context(
    const rc_ref<NodeContext>& initial_nx,
    dom::node_offset_t initial_offset, dom::node_offset_t target_offset) {
  // First, restore state to initial_nx
  // pop enough elements in nesting_processor to reach common ancestor with
  // initial_nx
  std::unordered_set<NodeContext*> chain;
  for (NodeContext* nx = initial_nx.ptr(); nx; nx = nx->parent_.ptr()) {
    chain.insert(nx);
  }
  while (!node_context_.is_null()
      && chain.find(node_context_.ptr()) == chain.end()) {
#ifndef NDEBUG
    dom::DOM::iterator source_node = node_context_->source_node_;
#endif
    if (node_context_->relpos_ == ENTERED
        || node_context_->relpos_ == EXITING) {
      nesting_processor_.pop();
    }
    node_context_ = node_context_->parent_;
    if (!node_context_.is_null()) {
      ShadowTree* parent_shadow = node_context_->shadow_.ptr();
      if (parent_shadow) {
        assert(shadow_context_->owner == node_context_->source_node_
            || source_node->qname()->id() == ID_SHADOW_content);
        shadow_context_ = shadow_context_->caller_context;
      }
    }
  }
  chain.clear();

  // push missing elements in
  NodeContext* t = node_context_.ptr();
  std::stack<NodeContext*> segment;
  for (NodeContext* nx = initial_nx.ptr(); nx != t; nx = nx->parent_.ptr()) {
    segment.push(nx);
  }
  while (!segment.empty()) {
    NodeContext* nx = segment.top();
    segment.pop();
    init_current(nx);
  }

  // interate to reach target_offset
  dom::node_offset_t offset = initial_offset;
  while (offset < target_offset) {
    size_t offset_increment;  // how much offset will increment on next_in_tree
    switch (node_context_->relpos_) {
      case ENTERING:
        offset_increment = 0;
        break;
      case ENTERED:
        offset_increment = 1 + node_context_->text()->utf16_length();
        break;
      case EXITING:
        offset_increment = 0;
        break;
      case EXITED:
        offset_increment = node_context_->text()->utf16_length();
        break;
    }
    dom::node_offset_t next_offset = offset + offset_increment;
    if (next_offset > target_offset) {
      assert(next_offset > 1);
      assert(node_context_->relpos_ == ENTERED
          || node_context_->relpos_ == EXITED);
      dom::node_offset_t extra_offset_in_node = target_offset - offset;
      if (node_context_->relpos_ == ENTERED) {
        extra_offset_in_node--;
      }
      ensure_unique();
      node_context_->offset_in_node_ += extra_offset_in_node;
      printf("Overflown ...%s\n", node_context_->text()->utf8());
      break;
    }
    offset = next_offset;
    next_in_tree();
  }
  if(node_context_->relpos_ == EXITING) {
    next_in_tree();
  }
}

void ViewIterator::apply_pseudoelement_style(
    const rc_ref<NodeContext>& node_context,
    const rc_qname& pseudo_name) {
}

}
}
