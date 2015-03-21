#include "adapt/layout/engine.h"

#include "adapt/base/rc_primitive.h"
#include "adapt/css/decode.h"
#include "adapt/media/media.h"
#include "adapt/dom/dom_serializer.h"

namespace adapt {
namespace layout {

namespace {

bool needed_for_rendering(const rc_qname& prop) {
  static std::unordered_set<int> render_prop_set {
    ID_color,
    ID_background_color
  };
  return render_prop_set.find(prop->id()) != render_prop_set.end();
}

class AttachmentSink : public text::RenderDataSink {
 public:
  AttachmentSink(std::map<dom::node_offset_t, rc_value>* attachments)
      : attachments_(attachments) {}
  virtual ~AttachmentSink() {}

  virtual void attach(dom::node_offset_t offset,
      const rc_value& attachment) override {
    printf("attaching at %lu: %lx\n", offset, (size_t)attachment.raw_ptr());
    rc_value& holder = (*attachments_)[offset];
    assert(holder.is_null());
    holder = attachment;
  }

  virtual void position_replaced(dom::node_offset_t offset,
      double x, double y) override {
    printf("positioning at %lu: %g %g\n", offset, x, y);
    rc_value& holder = (*attachments_)[offset];
    assert(holder->is<rc_ref<InlineProperties>>());
    InlineProperties* ip = static_cast<InlineProperties*>(holder.raw_ptr());
    ip->x = x - ip->box->margin_x();
    ip->y = y - ip->box->margin_y();
  }
 private:
  std::map<dom::node_offset_t, rc_value>* attachments_;
};
  
}

const float infinite = 1e20;

LayoutEngine::LayoutEngine(doc::XMLContentRenderer* xmlrend,
    Container* container, dom::Builder* builder,
    double edge_y, geom::BandedShape* shape,
    expr::Context* context, ViewIterator* view_iterator,
    text::InlineFormatterFactory* inline_formatter_factory)
  : container_(container), shape_(shape), xmlrend_(xmlrend),
    inline_formatter_factory_(inline_formatter_factory), overflown_(false),
    view_iterator_(view_iterator), edge_y_(edge_y), edge_y_absolute_(edge_y),
    edge_y_inline_(0), edge_margin_pos_(0), edge_margin_neg_(0),
    break_type_id_(ID_EMPTY), break_at_edge_id_(ID_EMPTY), builder_(builder),
    tenative_edge_break_{NO_BREAK,0,0}, best_break_{NO_BREAK,0,0} {}

double LayoutEngine::length_value(const layout::ComputedElementStyle& style,
    int propid, double default_value) {
  const rc_ref<css::CSSValue>& cssval = style[rc_qname::atom(propid)];
  if (cssval.ptr() != css::CSSEmpty::instance().ptr()) {
    double value;
    if (css::decode_length(cssval, css::WIDTH_BASED,
        view_iterator_->nesting()->sizes(), &value)) {
      return value;
    }
  }
  return default_value;
}

void LayoutEngine::position_leading_content_edge() {
  double edge_margin = edge_margin_pos_ + edge_margin_neg_;
  if (!view_iterator_->nesting()->begin_content(edge_margin)) {
    edge_y_ += edge_margin;
  }
  edge_y_absolute_ += edge_margin;
  edge_margin_pos_ = 0;
  edge_margin_neg_ = 0;
  break_at_edge_id_ = ID_EMPTY;
}

void LayoutEngine::position_trailing_content_edge() {
  double edge_margin = edge_margin_pos_ + edge_margin_neg_;
  edge_y_ += edge_margin;
  edge_y_absolute_ += edge_margin;
  edge_margin_pos_ = 0;
  edge_margin_neg_ = 0;
  break_at_edge_id_ = ID_EMPTY;
}

bool LayoutEngine::ignorable_text_node(const rc_string& text) {
  if (text->empty()) {
    return true;
  }
  const ComputedElementStyle& computed_style =
      view_iterator_->nesting()->computed_style();
  auto it = computed_style.find(rc_qname::atom(ID_white_space));
  if (it != computed_style.end()) {
    switch (it->second->id()) {
      case ID_pre_line:
        return text->is_whitespace_only();
      case ID_pre:
      case ID_pre_wrap:
        return false;
    }
  }
  // normal, nowrap
  return text->is_whitespace_and_newlines_only();
}

void LayoutEngine::start_element() {
  const rc_ref<NodeContext> node_context = view_iterator_->node_context();
  const ComputedElementStyle& computed_style =
      view_iterator_->nesting()->computed_style();
  std::map<rc_qname, rc_ref<css::CSSValue>> rmap_builder;
  for (const auto& entry : computed_style) {
    if (needed_for_rendering(entry.first)) {
      rmap_builder[entry.first] = entry.second;
    }
  }
  rc_map<rc_ref<css::CSSValue>> rmap(rmap_builder);
  if (node_context->block()) {
    rc_ref<BlockProperties> bp = view_iterator_->nesting()->block_properties();
    bp->render_props = rmap;
    container_->attachments()[builder_->offset()] = bp;
    enter_block(bp.ptr());
    if (node_context->media()) {
      position_leading_content_edge();
    }
  } else {
    const rc_ref<InlineProperties>& ip =
        view_iterator_->nesting()->inline_properties();
    ip->render_props = rmap;
    container_->attachments()[builder_->offset()] = ip;
    if (node_context->media()) {
      if (!inline_formatter_) {
        begin_content();
        if (overflown_) {
          return;
        }
      }
      if (!ip->box->media.is_null()) {
        inline_formatter_->add_replaced(ip->box->margin_width(),
            ip->box->margin_height(), computed_style, builder_->offset());
      }
    }
  }
  printf("+++ start element\n");
  builder_->start_element(node_context->source_node_->qname(),
      node_context->source_node_->attributes());
}

void LayoutEngine::end_element() {
  if (view_iterator_->node_context()->block()) {
    exit_block(view_iterator_->nesting()->block_properties().ptr());
  }
  printf("+++ end element\n");
  builder_->end_element();
}


void LayoutEngine::characters() {
  rc_string text = view_iterator_->node_context()->text();
  if (text->empty()) {
    return;
  }
  if (!inline_formatter_) {
    if (ignorable_text_node(text)) {
      // don't start inline formatting, but still append it to the view tree
      // for consistent node offset
      builder_->characters(text);
      return;
    }
    begin_content();
    if (overflown_) {
      return;
    }
  }
  if (inline_formatter_) {
    const ComputedElementStyle& style =
        view_iterator_->nesting()->computed_style();
    const rc_ref<font::Font>& font = view_iterator_->nesting()->font();
    inline_formatter_->add_span(text, font, style, builder_->offset());
  }
  builder_->characters(text);
}

void LayoutEngine::apply_edge_margin(double margin_val) {
  if (margin_val > 0) {
    edge_margin_pos_ = std::max(margin_val, edge_margin_pos_);
  } else {
    edge_margin_neg_ = std::min(margin_val, edge_margin_neg_);
  }
}

void LayoutEngine::apply_edge_break(const rc_qname& break_prop) {
  // It is important to prioritize "avoid" to prevent breaking after
  // a page/region break.
  if (break_at_edge_id_ == ID_avoid) {
    // avoid always wins
    return;
  }
  const ComputedElementStyle& computed_style =
      view_iterator_->nesting()->computed_style();
  int break_id = computed_style[break_prop]->id();
  if (break_id == ID_EMPTY) {
    return;
  }
  // TODO: combine in smarter ways?
  break_at_edge_id_ = break_id;
}

void LayoutEngine::enter_block(BlockProperties* props) {
  const Box& box = *props->box;
  double pnb = box.padding[Box::TOP] + box.border_width(Box::TOP);
  props->y = edge_y_ + pnb;
  edge_y_absolute_ += pnb;
  edge_y_ = 0;
  apply_edge_margin(box.margin[Box::TOP]);
  apply_edge_break(rc_qname::atom(ID_break_before));
  if (box.padding[Box::TOP] > 0 || !box.border[Box::TOP].is_null()) {
    position_leading_content_edge();
  }
}

void LayoutEngine::exit_block(BlockProperties* props) {
  const Box& box = *props->box;
  if ((box.specified & Box::SPECIFIED_HEIGHT) && box.height > 0) {
    position_leading_content_edge();
  }
  tenative_edge_break_.offset = builder_->offset();
  tenative_edge_break_.position = edge_y_absolute_;
  if (box.padding[Box::BOTTOM] > 0 || !box.border[Box::BOTTOM].is_null()) {
    position_trailing_content_edge();
  }
  apply_edge_margin(box.margin[Box::BOTTOM]);
  apply_edge_break(rc_qname::atom(ID_break_after));
  const rc_ref<NodeContext>& node_context = view_iterator_->node_context();
  double edge_y_start = edge_y_;
  if (node_context->media()) {
    edge_y_ += props->height;
  } else {
    if (props->box->height > edge_y_) {
      edge_y_ = props->box->height;
    } else {
      props->box->height = edge_y_;
    }
    props->height = props->box->height;
  }
  edge_y_ += box.padding[Box::BOTTOM] + box.border_width(Box::BOTTOM);
  edge_y_absolute_ += edge_y_ - edge_y_start;
  edge_y_ += props->y;
}

void LayoutEngine::process() {
  for ( ; !view_iterator_->node_context().is_null() && !overflown_;
       view_iterator_->next_in_tree()) {
    const rc_ref<NodeContext>& node_context = view_iterator_->node_context();
    printf("element %s, relpos %d, kind: %d, edge: %g\n",
           node_context->source_node_->qname()->name()->utf8(),
           node_context->relpos_, (int)node_context->kind_, edge_y_absolute_);
    switch (node_context->relpos_) {
      case ENTERING:
        if (node_context->block() && inline_formatter_) {
          end_content();
        }
        break;
      case ENTERED:
        if (!node_context->shadow_.is_null()) {
          printf("  shadow: %s\n",
              node_context->shadow_->shadow_root->qname()->to_string()->utf8());
        }
        // Leading edge
        start_element();
        if (!overflown_) {
          characters();
        }
        break;
      case EXITING:
        if (node_context->block() && inline_formatter_) {
          end_content();
        }
        // Trailing edge.
        end_element();
        break;
      case EXITED:
        characters();
        break;
    }
  }
  if (is_overflown(edge_y_absolute_)) {
    overflown_ = true;
  }
}

bool LayoutEngine::is_breakable() {
  const rc_ref<NodeContext>& node_context = view_iterator_->node_context();
  if (node_context->relpos_ == EXITED)
    return true; // may be an empty block
  if (node_context->source_node_->qname()->ns()->id() == NS_SVG) {
      return false;
  }
  return true;
}

int LayoutEngine::line_break_score() {
  return 0;
}

int LayoutEngine::edge_break_score() {
  return break_at_edge_id_ == ID_EMPTY ? 0 : 100;
}

void LayoutEngine::begin_content() {
  int edge_score = edge_break_score();
  if (edge_score <= best_break_.score
      && !is_overflown(tenative_edge_break_.position)) {
    best_break_ = tenative_edge_break_;
    best_break_.score = edge_score;
  }
  tenative_edge_break_.score = NO_BREAK;
  if (is_overflown(edge_y_absolute_)) {
    overflown_ = true;
    return;
  }
  position_leading_content_edge();
  printf("Begin content...\n");
  inline_formatter_ =
      inline_formatter_factory_->create();
  rc_ref<BlockProperties> bp = view_iterator_->nesting()->block_properties();
  if (!bp.is_null()) {
    geom::Rectangle box_rect = geom::Rectangle::from_xywh(
        bp->x_absolute, edge_y_absolute_ - edge_y_, bp->width, infinite);
    inline_formatter_->init(bp->font, bp->line_height, bp->text_align,
        edge_y_, box_rect, shape_);
  } else {
    geom::Rectangle box_rect = geom::Rectangle::from_xywh(
        0, 0, container_->bounds().dx(), infinite);
    double line_height = 1.25 * view_iterator_->nesting()->sizes().font.em_size;
    rc_ref<css::CSSValue> line_height_val =
        view_iterator_->nesting()->computed_style()[
            rc_qname::atom(ID_line_height)];
    if (!line_height_val.is_null()) {
      css::decode_line_height(line_height_val,
          view_iterator_->nesting()->sizes().font.em_size, &line_height);
    }
    inline_formatter_->init(view_iterator_->nesting()->font(),
        line_height, rc_qname(),
        edge_y_, box_rect, shape_);
  }
  edge_y_inline_ = edge_y_;
}

void LayoutEngine::end_content() {
  assert (inline_formatter_);
  edge_y_ = inline_formatter_->format();
  double inline_height = edge_y_ - edge_y_inline_;
  AttachmentSink sink(&container_->attachments_);
  inline_formatter_->attach_render_data(&sink);
  size_t break_count = inline_formatter_->break_count();
  if (break_count > 0) {
    size_t index = break_count - 1;
    // TODO: binary search
    while(true) {
      PossibleBreak pb;
      pb.score = line_break_score();
      inline_formatter_->get_break(index, &pb.position, &pb.offset);
      pb.position += (edge_y_absolute_ - edge_y_inline_);
      if (!is_overflown(pb.position)) {
        best_break_ = pb;
        break;
      }
      if (index == 0) {
        break;
      }
      --index;
    }
  }
  edge_y_absolute_ += inline_height;
  inline_formatter_.release();
  if (inline_height > 0) {
    tenative_edge_break_.offset = builder_->offset();
    tenative_edge_break_.position = edge_y_absolute_;
  }
}

void LayoutEngine::clear_attachments(dom::node_offset_t offset) {
  while (true) {
    auto it = container_->attachments_.end();
    if (it == container_->attachments_.begin()) {
      // empty
      break;
    }
    --it;
    if (it->first < offset) {
      inline_formatter_factory_->trim_attachment(it->second, offset);
      break;
    }
    container_->attachments_.erase(it);
  }
}

void LayoutEngine::find_acceptable_break(
    const rc_ref<NodeContext>& initial_node_context,
    dom::node_offset_t initial_offset) {
  if (best_break_.score < NO_BREAK && best_break_.position > 0) {
    printf("Found break at offset %lu, y=%g\n",
           best_break_.offset, best_break_.position);
    view_iterator_->restore_node_context(initial_node_context, initial_offset,
        best_break_.offset);
    builder_->split_off_at(best_break_.offset);
    builder_->end_all_elements();
    Writer::stdout() << container_->content()->root() << "\n";
    clear_attachments(best_break_.offset);
  }
}

ChunkPosition LayoutEngine::make_chunk_position() {
  rc_ref<NodeContext> node_context = view_iterator_->node_context();
  if (node_context.is_null()) {
    return ChunkPosition();
  }
  ChunkPosition position;
  position.primary.relpos = node_context->relpos_;
  position.primary.offset = node_context->offset_in_node_;
  bool set_doc_offset = true;
  bool after = node_context->relpos_ == EXITED;
  dom::node_offset_t offset_in_node = node_context->offset_in_node_;
  std::vector<rc_value> acc;
  while(true) {
    if (node_context->parent_.is_null()) {
      if (node_context->source_node_ == view_iterator_->dom()->root()) {
        acc.push_back(view_iterator_->dom()->document_url());
      } else {
        StringWriter w;
        w << view_iterator_->dom()->document_url();
        dom::Position pos;
        pos.element = node_context->source_node_;
        w << view_iterator_->dom()->to_fragment_identifier(pos);
        acc.push_back(w.to_string());
      }
      break;
    }
    bool shadow_child = false;
    if (!node_context->parent_->shadow_.is_null()) {
      if (node_context->source_node_->qname()->id() == ID_SHADOW_content) {
        acc.push_back(node_context->source_node_->qname());
        shadow_child = true;
      }
      rc_ref<ShadowTree> shadow = node_context->parent_->shadow_;
      do {
        if (shadow->tmp_dom) {
          if (node_context->source_node_->qname()->id() != ID_SHADOW_content) {
            shadow_child = true;
            rc_map<rc_value> attrs = node_context->source_node_->attributes();
            auto it = attrs.find(rc_qname::atom(ID_class));
            assert(it != attrs.end() && it->value->is<rc_qname>());
            acc.push_back(it->value);
          }
        }
        shadow = shadow->super_shadow;
      } while (!shadow.is_null());
    }
    if (set_doc_offset) {
      set_doc_offset = false;
      dom::Position pos;
      pos.element = node_context->source_node_;
      pos.after = after;
      pos.offset = offset_in_node + (after ? 0 : 1);
      position.primary.doc_offset =
          view_iterator_->dom()->offset_by_position(pos);
    }
    if (!shadow_child) {
      int index = static_cast<int>(node_context->source_node_.child_index());
      acc.push_back(rc_integer(index));
    }
    node_context = node_context->parent_;
  }
  std::reverse(acc.begin(), acc.end());
  position.primary.steps = rc_list<rc_value>(acc);
  Writer::stdout() << "Steps: " << position.primary.steps << "\n";
  return position;
}

ChunkPosition LayoutEngine::layout(const ChunkPosition& position) {
  // layout_overflown_footnotes();
  open_all_views(position.primary);
  rc_ref<NodeContext> initial_node_context = view_iterator_->node_context();
  dom::node_offset_t initial_offset = builder_->offset();
  break_at_edge_id_ = ID_avoid;
  process();
  if (overflown_) {
    // overflow (implicit page break): back up and find a page break
    find_acceptable_break(initial_node_context, initial_offset);
  }
  return make_chunk_position();
}

void LayoutEngine::open_all_views(const NodePosition& primary) {
  rc_ref<NodeContext> node_context;
  StringWriter out;
  size_t last = primary.steps->size() - 1;
  dom::DOM::iterator parent = view_iterator_->dom()->root();
  for (size_t index = 0; index <= last; ++index) {
    const rc_value& step = primary.steps[index];
    if (step->is<rc_string>()) {
      rc_string url = step->to_string();
      rc_string fragment;
      size_t fragment_index = url->find_first("#");
      if (fragment_index != rc_string::npos) {
        fragment = url->substr(fragment_index);
        url = url->substr(0, fragment_index);
      }
      assert(node_context.is_null());
      assert(url == view_iterator_->dom()->document_url());
      dom::Position pos =
          view_iterator_->dom()->from_fragment_identifier(fragment);
      node_context = new NodeContext(node_context, pos.element);
    } else if (step->is<rc_integer>()) {
      int index = rc_cast<rc_integer>(step)->value();
      parent = parent.child(index);
      node_context = new NodeContext(node_context, parent);
    } else if (step->is<rc_qname>()) {
      rc_qname name = rc_cast<rc_qname>(step);
      rc_ref<ShadowTree> shadow = node_context->shadow_;
      if (name->id() == ID_SHADOW_content) {
        parent = node_context->source_node_;
        if (!shadow.is_null() && shadow->tmp_dom) {
          dom::DOM::iterator shadow_root = shadow->tmp_dom->root();
          for (dom::DOM::iterator se = shadow_root.begin();
               se != shadow_root.end(); ++se) {
            if (se->qname()->id() == ID_SHADOW_content) {
              node_context = new NodeContext(node_context, se);
              break;
            }
          }
        }
      } else {
        dom::DOM::iterator shadow_root = shadow->tmp_dom->root();
        for (dom::DOM::iterator se = shadow_root.begin();
             se != shadow_root.end(); ++se) {
          if (se->attributes()[rc_qname::atom(ID_class)].raw_ptr()
              == name.raw_ptr()) {
            node_context = new NodeContext(node_context, se);
            parent = se;
            break;
          }
        }
      }
    }
    out << "/";
    out << node_context->source_node_->qname()->name();
    if (index == last) {
      node_context->offset_in_node_ = primary.offset;
      node_context->relpos_ = primary.relpos;
    } else {
      node_context->relpos_ = ENTERED;
    }
    view_iterator_->init_current(node_context);
    if (node_context->relpos_ == ENTERED && index != last) {
      // Leading edge
      start_element();
      if (overflown_) {
        assert(false);
        break;
      }
    }
  }
  printf("%s  depth:%ld\n", out.to_string()->utf8(),
      view_iterator_->nesting()->depth());
}


}
}
