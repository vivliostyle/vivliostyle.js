#include "adapt/layout/nesting.h"

#include "adapt/css/decode.h"

namespace adapt {
namespace layout {

NestingProcessor::NestingProcessor(load::Package* package,
    expr::Context* context, const css::RelativeSizes& sizes,
    const rc_list<rc_qname>& regions)
        : package_(package), context_(context), regions_(regions),
          sizes_(sizes) {}

NestingProcessor::NestingProcessor(const NestingProcessor& other)
    : package_(other.package_), context_(other.context_),
      regions_(other.regions_) {}

void NestingProcessor::push(const css::element_style& style) {
  cascade_map cm;
  bool font_props = false;
  cascade_style(&cm, style, &font_props);
  rc_map<css::element_style> region_styles = style.regions();
  if (!region_styles.is_null()) {
    for (const rc_qname& region : regions_) {
      css::element_style region_style = region_styles[region];
      if (!region_style.is_null()) {
        cascade_style(&cm, region_style, &font_props);
      }
    }
  }
  push_inheritance(cm, font_props);
}

void NestingProcessor::enter_element(const rc_ref<media::Media>& media,
    bool first_time) {
  auto& ni_props = nesting_stack_.top().noninherited;
  auto display_it = ni_props.find(rc_qname::atom(ID_display));
  if (display_it == ni_props.end()) {
    // treat as inline
    enter_inline_element(media, first_time);
  } else {
    switch (display_it->second->id()) {
      case ID_inline:
      case ID_EMPTY:
        enter_inline_element(media, first_time);
        break;
      default:
        enter_block_element(media, first_time);
    }
  }
}

void NestingProcessor::fill_box_block(Box* box) {
  box->init_from(package_, context_, nesting_stack_.top().noninherited);
  if (box->specified & Box::SPECIFIED_WIDTH) {
    // Have specified width.
    if ((box->specified & (Box::AUTO_MARGIN_LEFT|Box::AUTO_MARGIN_RIGHT))
        == (Box::AUTO_MARGIN_LEFT|Box::AUTO_MARGIN_RIGHT)) {
      double computed_margin = (sizes_.box.width - box->width
          - box->border_width(Box::LEFT) - box->padding[Box::LEFT]
          - box->padding[Box::RIGHT] - box->border_width(Box::RIGHT)) / 2;
      box->margin[Box::LEFT] = computed_margin;
      box->margin[Box::RIGHT] = computed_margin;
    }
  } else {
    box->width = sizes_.box.width - box->margin[Box::LEFT]
        - box->border_width(Box::LEFT) - box->padding[Box::LEFT]
        - box->padding[Box::RIGHT] - box->border_width(Box::RIGHT)
        - box->margin[Box::RIGHT];
  }
}

void NestingProcessor::enter_block_element(const rc_ref<media::Media>& media,
    bool first_time) {
  nesting_stack_.top().saved_block_properties = block_properties_;
  double x_offset =
      block_properties_.is_null() ? 0.0 : block_properties_->x_absolute;
  block_properties_ = new BlockProperties();
  block_properties_->font = font();
  auto text_align_it = computed_inherited_.find(rc_qname::atom(ID_text_align));
  if (text_align_it != computed_inherited_.end()
      && text_align_it->second->id()) {
    block_properties_->text_align =
        static_cast<css::CSSIdent*>(text_align_it->second.ptr())->name();
  }
  Box* box = new Box(media);
  block_properties_->box = box;
  fill_box_block(box);
  if (!first_time) {
    box->margin[Box::TOP] = 0;
    box->border[Box::TOP] = rc_ref<Border>();
    box->padding[Box::TOP] = 0;
  }
  css::BoxRelativeSizes szbox;
  szbox.width = box->width;
  block_properties_->width = box->width;
  auto ci = computed_inherited_.find(rc_qname::atom(ID_line_height));
  if (ci == computed_inherited_.end() || !css::decode_line_height(
      ci->second, sizes_.font.em_size, &block_properties_->line_height)) {
    block_properties_->line_height =
        block_properties_->font->em_size * 1.25;
  }
  block_properties_->width = box->width;
  block_properties_->x = box->margin[Box::LEFT] + box->border_width(Box::LEFT)
      + box->padding[Box::LEFT];
  block_properties_->x_absolute = block_properties_->x + x_offset;
  szbox.height = box->height;
  block_properties_->height = box->height;
  block_properties_->y = box->border_width(Box::TOP) + box->padding[Box::TOP];
  if (outermost_leading_block_properties_.is_null()) {
    outermost_leading_block_properties_ = block_properties_;
  }
  report_box_size(szbox);
}

void NestingProcessor::enter_inline_element(const rc_ref<media::Media>& media,
    bool first_time) {
  inline_properties_ = new InlineProperties();
  Box* box = new Box(media);
  inline_properties_->box = box;
  box->init_from(package_, context_, nesting_stack_.top().noninherited);
  if (!first_time) {
    box->margin[Box::LEFT] = 0;
    box->border[Box::LEFT] = rc_ref<Border>();
    box->padding[Box::LEFT] = 0;
  }
}

void NestingProcessor::report_box_size(const css::BoxRelativeSizes& box_size) {
  Level& top = nesting_stack_.top();
  if (!top.saved_box_size) {
    top.saved_box_size = std::unique_ptr<css::BoxRelativeSizes>(
        new css::BoxRelativeSizes(sizes_.box));
  }
  sizes_.box = box_size;
}

void NestingProcessor::report_font_size(
    const css::FontRelativeSizes& font_size) {
  Level& top = nesting_stack_.top();
  if (!top.saved_font_size) {
    top.saved_font_size = std::unique_ptr<css::FontRelativeSizes>(
        new css::FontRelativeSizes(sizes_.font));
  }
  sizes_.font = font_size;
}

void NestingProcessor::pop() {
  Level& top = nesting_stack_.top();
  for (auto& entry : top.saved_inherited) {
    if (entry.second.is_null()) {
      computed_inherited_.erase(computed_inherited_.find(entry.first));
    } else {
      computed_inherited_[entry.first] = std::move(entry.second);
    }
  }
  if (top.saved_box_size) {
    sizes_.box = std::move(*top.saved_box_size);
  }
  if (top.saved_font_size) {
    sizes_.font = std::move(*top.saved_font_size);
  }
  if (!top.saved_block_properties.is_null()) {
    block_properties_ = std::move(top.saved_block_properties);
  }
  inline_properties_ = std::move(top.saved_inline_properties);
  nesting_stack_.pop();
}

rc_ref<css::CSSValue> NestingProcessor::compute(const rc_qname& prop,
    const rc_ref<css::CascadeValue>& value) {
  css::UnitResolver unit_resolver(
      css::percentage_base_by_property(prop), sizes_);
  rc_ref<css::CSSValue> v = value->evaluate(context_, prop);
  rc_ref<css::CSSValue> res = v->visit(&unit_resolver);
  assert(!res.is_null());
  return res;
}

void NestingProcessor::resolve_font() {
  css::FontRelativeSizes fs;
  fs.em_size = sizes_.font.em_size;
  css::decode_length(computed_inherited_[rc_qname::atom(ID_font_size)],
      css::EM_BASED, sizes_, &fs.em_size);
  rc_list<rc_string> font_family = rc_list<rc_string>::empty();
  css::decode_font_family(computed_inherited_[rc_qname::atom(ID_font_family)],
      &font_family);
  int weight = 400;
  const rc_ref<css::CSSValue>& weight_val =
      computed_inherited_[rc_qname::atom(ID_font_weight)];
  if (!weight_val.is_null()) {
    switch (weight_val->id()) {
      case ID_bold:
        weight = 700;
        break;
      case ID_normal:
        weight = 400;
        break;
      case ID_light:
        weight = 100;
        break;
      case ID_bolder:
        weight = std::min(900, sizes_.font.weight + 300);
        break;
      case ID_lighter:
        weight = std::max(100, sizes_.font.weight - 300);
        break;
      default:
        if (weight_val->is<rc_ref<css::CSSInteger>>()) {
          css::CSSInteger* wv = static_cast<css::CSSInteger*>(weight_val.ptr());
          weight = static_cast<int>(
              std::max(100.0, std::min(900.0, 100 * round(wv->num() / 100))));
        }
    }
  }
  int style = ID_normal;
  const rc_ref<css::CSSValue>& style_val =
      computed_inherited_[rc_qname::atom(ID_font_style)];
  if (!style_val.is_null()) {
    style = style_val->id();
  }
  rc_ref<font::Font> font =
      font::lookup_font(font_family, style, weight, fs.em_size);
  nesting_stack_.top().font_ = font;
  fs.ex_size = font->ex_size;
  fs.ch_size = font->ch_size;
  fs.weight = weight;
  report_font_size(fs);
}

void NestingProcessor::push_inheritance(const cascade_map& cm,
    bool font_props) {
  std::unordered_map<rc_qname, rc_ref<css::CSSValue>> saved;
  if (font_props || nesting_stack_.empty() == 1) {
    nesting_stack_.push(Level());
    for (const auto& entry : cm) {
      if (css::is_font_property(entry.first)) {
        assert(css::is_inherited(entry.first));
        rc_ref<css::CSSValue>& value_pos = computed_inherited_[entry.first];
        // save existing value, if any
        saved[entry.first] = std::move(value_pos);
        value_pos = compute(entry.first, entry.second);
      }
    }
    resolve_font();
  } else {
    rc_ref<font::Font> font = nesting_stack_.top().font_;
    nesting_stack_.push(Level());
    nesting_stack_.top().font_ = font;
  }
  nesting_stack_.top().saved_inline_properties = std::move(inline_properties_);
  assert(inline_properties_.is_null());
  for (const auto& entry : cm) {
    if (css::is_font_property(entry.first)) {
      assert(font_props);
      continue;
    }
    if (css::is_inherited(entry.first)) {
      rc_ref<css::CSSValue>& value_pos = computed_inherited_[entry.first];
      // save existing value, if any
      saved[entry.first] = std::move(value_pos);
      value_pos = compute(entry.first, entry.second);
    } else {
      nesting_stack_.top().noninherited[entry.first] =
          compute(entry.first, entry.second);
    }
  }
  nesting_stack_.top().saved_inherited = std::move(saved);
}

void NestingProcessor::cascade_style(
    cascade_map* cm, const css::element_style& style, bool* font_props) {
  for (const css::element_style::Entry& entry : style) {
    if (!entry.key->ns()->empty()) {
      // not a property
      continue;
    }
    if (css::is_font_property(entry.key)) {
      *font_props = true;
    }
    rc_ref<css::CascadeValue>& value = (*cm)[entry.key];
    if (value.is_null()) {
      value = rc_cast<rc_ref<css::CascadeValue>>(entry.value);
    } else {
      rc_ref<css::CascadeValue> v =
          rc_cast<rc_ref<css::CascadeValue>>(entry.value);
      if (value->priority() < v->priority()) {
        value = v;
      }
    }
  }
}

bool NestingProcessor::begin_content(float edge_margin) {
  if (!outermost_leading_block_properties_.is_null()) {
    outermost_leading_block_properties_->y += edge_margin;
    outermost_leading_block_properties_ = rc_ref<BlockProperties>();
    return true;
  }
  return false;
}


ComputedElementStyle NestingProcessor::computed_style() {
  return ComputedElementStyle(computed_inherited_,
      nesting_stack_.top().noninherited);
}

}
}
