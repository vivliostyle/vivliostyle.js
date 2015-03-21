#ifndef adapt_layout_view_iterator_h
#define adapt_layout_view_iterator_h

#include <unordered_map>
#include <unordered_set>

#include "adapt/load/package.h"
#include "adapt/css/styler.h"
#include "adapt/dom/dom.h"
#include "adapt/expr/expr.h"
#include "adapt/layout/page.h"
#include "adapt/layout/position.h"
#include "adapt/layout/nesting.h"
#include "adapt/doc/xml_content.h"
#include "adapt/base/rc_list.h"

namespace adapt {
namespace layout {

class Viewport;
class FontFaces;
class CustomRenderer;

// Structure that describes the element's "shadow" tree that contains
// pseudo-elements, such as ::before and ::after, as well as more complex
// DOM structures (e.g. what's needed for EPUB footnotes).
struct ShadowTree : public RefCountedObject {
  ShadowTree();
  ~ShadowTree();

  bool rootless = false;
  bool content = false;  // shadow:content element
  std::unique_ptr<dom::DOM> tmp_dom;  // only set if using temporary DOM
  std::unique_ptr<css::Styler> tmp_styler;  // only set if using temporary DOM
  rc_ref<doc::XMLContentRenderer> xmlrend;  // only if referencing external doc
  rc_string text;

  rc_ref<ShadowTree> super_shadow;
  dom::DOM::iterator shadow_root = dom::Children::iterator::null_iterator();
  css::Styler* styler = nullptr;
};

// Info about the shadow tree that contains current node.
struct ShadowContext : public RefCountedObject {
  ShadowContext(css::Styler* s) : styler(s),
      owner(dom::Children::iterator::null_iterator()),
      owner_shadow(nullptr) {}

  ShadowContext(const rc_ref<ShadowContext>& cx, ShadowTree* st,
      dom::DOM::iterator e) : styler(st->styler), owner(e),
          owner_shadow(st), owner_context(cx), caller_context(cx) {}
  
  ShadowContext(const rc_ref<ShadowContext>& owner_cx,
      const rc_ref<ShadowContext>& caller_cx,  css::Styler* s, ShadowTree* st,
      dom::DOM::iterator e) : styler(s), owner(e), owner_shadow(st),
          owner_context(owner_cx), caller_context(caller_cx) {}
  
  css::Styler* styler;
  // Element to which this shadow tree attached, its shadow tree and
  // parent context.
  dom::DOM::iterator owner;
  ShadowTree* owner_shadow;
  rc_ref<ShadowContext> owner_context;
  // caller ShadowContext (context of the shadow owner or content element)
  rc_ref<ShadowContext> caller_context;
};

// TODO: split off relpos_
class NodeContext : public RefCountedObject {
 public:
  NodeContext(const rc_ref<NodeContext>& parent,
      const dom::DOM::iterator& source_node)
      : parent_(parent), source_node_(source_node),
        offset_in_node_(0), relpos_(ENTERING), kind_(INLINE),
        float_container_(false), vertical_(false), break_penalty_(0) {
    if (!parent.is_null()) {
      break_penalty_ = parent->break_penalty_;
      float_container_ = parent->float_container_;
      vertical_ = parent->vertical_;
    }
  }


  void reset_view() {
    kind_ = INLINE;
    break_penalty_ = parent_.is_null() ? 0 : parent_->break_penalty_;
    offset_in_node_ = 0;
    relpos_ = ENTERING;
    float_container_ = !parent_.is_null() && parent_->float_container_;
    vertical_ = !parent_.is_null() && parent_->vertical_;
    shadow_ = rc_ref<ShadowTree>();
  };

  rc_string text() const {
    switch (relpos_) {
      case ENTERING:
      case EXITING:
        return rc_string::empty_string();
      case ENTERED:
        if (shadow_.is_null()) {
          return source_node_->leading_text()->utf16_substr(offset_in_node_);
        }
        return shadow_->text->utf16_substr(offset_in_node_);
      case EXITED:
        if (parent_.is_null()) {
          return rc_string::empty_string();
        }
        return source_node_->following_text()->utf16_substr(offset_in_node_);
    }
    // Not reachable
  }

  enum KindBits {
    IS_IGNORED = 1,
    IS_BLOCK = 2,
    IS_MEDIA = 4
  };

  enum Kind {
    INLINE = 0,
    BLOCK = IS_BLOCK,
    IGNORED = IS_IGNORED,
    INLINE_MEDIA = IS_MEDIA,
    BLOCK_MEDIA = IS_BLOCK | IS_MEDIA
  };

  bool block() const { return (kind_ & IS_BLOCK) != 0; }
  bool media() const { return (kind_ & IS_MEDIA) != 0; }
  bool ignored() const { return (kind_ & IS_IGNORED) != 0; }

  dom::DOM::iterator source_node_;
  rc_ref<NodeContext> parent_;
  rc_ref<ShadowTree> shadow_;
  // position itself
  dom::node_offset_t offset_in_node_;
  PositionRelativeToElement relpos_;
  // other stuff
  int16_t kind_;
  bool float_container_;
  bool vertical_;
  int break_penalty_;
};

class ViewIterator {
 public:
  ViewIterator(doc::XMLContentRenderer* xmlrend, const rc_qname& flowName,
      expr::Context* context, const css::RelativeSizes& sizes,
      Viewport* viewport, css::Styler* styler,
      const rc_list<rc_qname>& region_ids, FontFaces* font_faces,
      const css::element_style& footnoteStyle,
      Page* page, CustomRenderer* custom_renderer,
      const std::unordered_map<rc_string, rc_string>& fallback_map);

  /**
   * Creates a functionally equivalent, but uninitialized layout context,
   * suitable for building a separate column.
   */
  ViewIterator(const ViewIterator& other);

  /**
   * Sets the current source node and creates a view. Parameter first_time
   * is true (and possibly offset_in_node > 0) if node was broken on
   * the previous page.
   */
  void init_current(const rc_ref<NodeContext>& node_context);

  /**
   * Moves to the next view node, creating through DOM sink if needed.
   */
  void next_in_tree();

  /**
   * Apply pseudo-element styles (if any).
   */
  void apply_pseudoelement_style(const rc_ref<NodeContext>& node_context,
      const rc_qname& pseudo_name);

  const rc_ref<NodeContext>& node_context() const {
    return node_context_;
  }

  const rc_ref<NodeContext> unique_node_context() {
    if (!node_context_->uniquely_referenced()) {
      node_context_ = new NodeContext(*node_context_);
    }
    return node_context_;
  }

  const css::element_style& applied_style() const { return applied_style_; }

  NestingProcessor* nesting() { return &nesting_processor_; }

  void restore_node_context(const rc_ref<NodeContext>& initial_node_context,
      dom::node_offset_t initial_offset, dom::node_offset_t target_offset);

  dom::DOM* dom() { return xmlrend_->document()->dom(); }

  doc::XMLContentRenderer* content_renderer() const { return xmlrend_; }

 private:
  void ensure_unique() {
    if (!node_context_->uniquely_referenced()) {
      node_context_ = new NodeContext(*node_context_.ptr());
    }
  }

  bool load_media(const rc_value& src, const rc_value& media_type);
  bool init_element();
  void enter_element(bool first_time);
  void create_pseudoelement_shadow_tree(
      const rc_map<css::element_style>& pseudoelements);
  bool create_pseudoelement_node(dom::Builder* builder,
      const rc_map<css::element_style>& pseudoelements, const rc_qname& name);
  void create_template_shadow_tree(const rc_ref<css::CSSValue>& tmpl);
  void create_content_shadow_tree();
  void create_shadow_context();

  NestingProcessor nesting_processor_;
  Page* page_;
  doc::XMLContentRenderer* xmlrend_;
  rc_ref<ShadowContext> shadow_context_;
  css::element_style applied_style_;
  rc_ref<NodeContext> node_context_;
  rc_ref<media::Media> media_;
  rc_qname flow_name_;
};

}
}

#endif
