#include "adapt/pm/page_box.h"

#include "adapt/base/rc_primitive.h"
#include "adapt/css/decode.h"
#include "adapt/css/eval.h"
#include "adapt/layout/page.h"

namespace adapt {
namespace pm {

namespace {

rc_ref<expr::Expr> to_expr_bool(const rc_ref<expr::Scope>& scope,
    const rc_ref<css::CSSValue>& val, const rc_ref<expr::Expr>& def) {
  if (val.is_null()) {
    return def;
  }
  switch (val->id()) {
    case ID_true:
      return expr::common().v_true;
    case ID_false:
      return expr::common().v_false;
  }
  return val->to_expr(scope.ptr(), expr::common().v_zero);
}

rc_ref<expr::Expr> to_expr_ident(const rc_ref<expr::Scope>& scope,
    const rc_ref<css::CSSValue>& val, const rc_qname& def) {
  if (val.is_null()) {
    return new expr::ExprConst(def->to_string());
  }
  return val->to_expr(scope.ptr(), expr::common().v_zero);
}

rc_ref<expr::Expr> to_expr_auto(const rc_ref<expr::Scope>& scope,
    const rc_ref<css::CSSValue>& val, const rc_ref<expr::Expr>& ref) {
  if (val.is_null() || val->id() == ID_auto) {
    return rc_ref<expr::Expr>();
  }
  return val->to_expr(scope.ptr(), ref);
}

bool is_auto_or_null(const rc_ref<css::CSSValue>& val) {
  return val.is_null() || val->id() == ID_auto;
}


rc_ref<expr::Expr> to_expr_zero(const rc_ref<expr::Scope>& scope,
    const rc_ref<css::CSSValue>& val, const rc_ref<expr::Expr>& ref) {
  if (val.is_null() || val->id() == ID_auto) {
    return expr::common().v_zero;
  }
  return val->to_expr(scope.ptr(), ref);
}


rc_ref<expr::Expr> to_expr_zero_border(const rc_ref<expr::Scope>& scope,
    const rc_ref<css::CSSValue>& val, const rc_ref<css::CSSValue>& style_val,
    const rc_ref<expr::Expr>& ref) {
  if (val.is_null() || style_val->id() == ID_none)
    return expr::common().v_zero;
  return val->to_expr(scope.ptr(), ref);
}

rc_ref<css::CascadeValue> cascade_values(expr::Context* context,
    const rc_ref<css::CascadeValue>& tv, const rc_ref<css::CascadeValue>& av) {
  if ((tv.is_null() || av->priority() > tv->priority())
      && av->enabled(context)) {
    return av->base_value();
  }
  return tv;
}

class PageBoxAutoWidth : public expr::AbstractPartial {
 public:
  PageBoxAutoWidth(PageBoxInstance* instance) : instance_(instance) {}

  virtual void write_to(Writer* writer) const override {
    *writer << instance_->page_box()->name_nonempty();
    *writer << ".width";
  }

  virtual rc_value apply(expr::Context* context) override {
    return rc_real(instance_->calculated_width());
  }

 private:
  PageBoxInstance* instance_;
};

class PageBoxAutoHeight : public expr::AbstractPartial {
 public:
  PageBoxAutoHeight(PageBoxInstance* instance) : instance_(instance) {}

  virtual void write_to(Writer* writer) const override {
    *writer << instance_->page_box()->name_nonempty();
    *writer << ".height";
  }

  virtual rc_value apply(expr::Context* context) override {
    return rc_real(instance_->calculated_height());
  }

 private:
  PageBoxInstance* instance_;
};

}

//--------------------------------------------------------------------------

PageBox::PageBox(const rc_qname& name, const rc_qname& pseudoname,
    const rc_value& classes, PageBox* parent)
        : name_(name), pseudoname_(pseudoname), classes_(classes),
          children_(rc_list<rc_ref<PageBox>>::empty()), parent_(parent),
          page_master_(nullptr),
          style_(rc_map<rc_ref<css::CascadeValue>>::empty()) {
  if (parent) {
    page_master_ = parent->page_master_;
  }
}

rc_string PageBox::name_nonempty() const {
  if (name_->empty()) {
    StringWriter w;
    w << "__box";
    w << hex((reinterpret_cast<size_t>(this) >> 8) & 0xFFFF);
    return w.to_string();
  }
  return name_->to_string();
}


PageMaster::PageMaster(const rc_ref<expr::Scope>& scope,
    const rc_qname& name, const rc_qname& pseudoname, const rc_value& classes,
    const rc_ref<expr::Expr>& condition, css::cascade_priority_t specificity)
        : PageBox(name, pseudoname, classes, nullptr),
          condition_(condition), specificity_(specificity), scope_(scope) {
  page_master_ = this;
}

PageMasterInstance* PageMaster::create_page_master_instance() {
  PageMasterInstance* pmi = new PageMasterInstance(this);
  pmi->create_children();
  return pmi;
}

PageBoxInstance* PageMaster::create_instance(PageBoxInstance* parent) {
  assert(false);
  return nullptr;
}

PartitionGroup::PartitionGroup(const rc_qname& name, const rc_qname& pseudoname,
    const rc_value& classes, PageBox* parent)
        : PageBox(name, pseudoname, classes, parent) {}

PageBoxInstance* PartitionGroup::create_instance(PageBoxInstance* parent) {
  return new PartitionGroupInstance(parent, this);
}

Partition::Partition(const rc_qname& name, const rc_qname& pseudoname,
    const rc_value& classes, PageBox* parent)
        : PageBox(name, pseudoname, classes, parent) {}

PageBoxInstance* Partition::create_instance(PageBoxInstance* parent) {
  return new PartitionInstance(parent, this);
}

//----------------------------------------------------------------------

PageBoxInstance::PageBoxInstance(PageBoxInstance* parent_instance,
    PageBox* page_box) : parent_instance_(parent_instance), page_box_(page_box),
        children_(rc_list<rc_ref<PageBoxInstance>>::empty()) {}

void PageBoxInstance::create_children() {
  rc_list<rc_ref<PageBox>> box_children = page_box_->children_;
  if (box_children->empty()) {
    return;
  }
  std::vector<rc_ref<PageBoxInstance>> instance_children;
  for (const rc_ref<PageBox>& box_child : box_children) {
    PageBoxInstance* instance_child = box_child->create_instance(this);
    instance_children.push_back(instance_child);
    instance_child->create_children();
  }
  children_ = rc_list<rc_ref<PageBoxInstance>>(instance_children);
}

rc_ref<css::CSSValue> PageBoxInstance::get_prop(expr::Context* context,
    const rc_qname& name) {
  auto it = style_.find(name);
  if (it != style_.end()) {
    return css::evaluate(context, it->second, name);
  }
  const rc_ref<css::CascadeValue>& val = cascaded_[name];
  if (!val.is_null()) {
    return val->evaluate(context, name);
  }
  return rc_ref<css::CSSValue>();
}

double PageBoxInstance::get_prop_as_number(expr::Context* context,
    const rc_qname& name) {
  double result;
  if (!css::decode_num(get_prop(context, name), context, &result)) {
    result = 0;
  }
  return result;
}

rc_list<rc_qname> PageBoxInstance::get_active_regions(expr::Context* context) {
  auto it = cascaded_.find(rc_qname::atom(ID_PRIVATE_regionid));
  if (it != cascaded_.end()) {
    std::vector<rc_qname> acc;
    rc_list<rc_ref<css::CascadeValue>> list =
        rc_cast<rc_list<rc_ref<css::CascadeValue>>>(it->value);
    for (const rc_ref<css::CascadeValue> value : list) {
      rc_ref<css::CSSValue> r =
          value->evaluate(context, rc_qname::atom(ID_PRIVATE_regionid));
      if (r->is<rc_ref<css::CSSIdent>>()) {
        const css::CSSIdent* ident = static_cast<const css::CSSIdent*>(r.ptr());
        acc.push_back(ident->name());
      }
    }
    if (!acc.empty()) {
      return rc_list<rc_qname>(acc);
    }
  }
  return rc_list<rc_qname>::empty();
}

void PageBoxInstance::init_enabled() {
  const rc_ref<expr::Scope>& scope = page_master_instance_->scope();
  rc_ref<expr::Expr> enabled = to_expr_bool(scope,
      style_[rc_qname::atom(ID_enabled)], expr::common().v_true);
  rc_ref<expr::Expr> page = to_expr_auto(scope, style_[rc_qname::atom(ID_page)],
      expr::common().v_zero);
  if (!page.is_null()) {
    rc_ref<expr::Expr> current_page =
        new expr::ExprNamed(rc_qname::atom(ID_page_number));
    enabled = enabled && new expr::ExprEq(page, current_page);
  }
  rc_ref<expr::Expr> min_page_width =
      to_expr_auto(scope, style_[rc_qname::atom(ID_min_page_width)],
          expr::common().v_zero);
  if (!min_page_width.is_null()) {
    enabled = enabled && new expr::ExprGe(new expr::ExprNamed(
        rc_qname::atom(ID_page_width)), min_page_width);
  }
  rc_ref<expr::Expr> min_page_height =
      to_expr_auto(scope, style_[rc_qname::atom(ID_min_page_height)],
               expr::common().v_zero);
  if (!min_page_height.is_null()) {
    enabled = enabled && new expr::ExprGe(new expr::ExprNamed(
            rc_qname::atom(ID_page_height)), min_page_height);
  }
  enabled = box_specific_enabled(enabled);
  if (enabled.is_null()) {
    enabled = expr::common().v_true;
  }
  style_[rc_qname::atom(ID_enabled)] = new css::CSSExpr(enabled, scope);
}


void PageBoxInstance::init_horizontal() {
  const rc_ref<expr::Scope>& scope = page_master_instance_->scope();
  rc_ref<expr::Expr> parent_width;
  if (parent_instance_) {
    parent_width = parent_instance_->style_[
        rc_qname::atom(ID_width)]->to_expr(scope.ptr(), nullptr);
  } else {
    parent_width = new expr::ExprNamed(rc_qname::atom(ID_page_width));
  }
  rc_ref<expr::Expr> left =
      to_expr_auto(scope, style_[rc_qname::atom(ID_left)], parent_width);
  rc_ref<expr::Expr> margin_left =
      to_expr_auto(scope, style_[rc_qname::atom(ID_margin_left)], parent_width);
  rc_ref<expr::Expr> border_left_width = to_expr_zero_border(scope,
      style_[rc_qname::atom(ID_border_left_width)],
      style_[rc_qname::atom(ID_border_left_style)], parent_width);
  rc_ref<expr::Expr> padding_left = to_expr_zero(scope,
      style_[rc_qname::atom(ID_padding_left)], parent_width);
  rc_ref<expr::Expr> width =
      to_expr_auto(scope, style_[rc_qname::atom(ID_width)], parent_width);
  rc_ref<expr::Expr> max_width =
      to_expr_auto(scope, style_[rc_qname::atom(ID_max_width)], parent_width);
  rc_ref<expr::Expr> padding_right = to_expr_zero(scope,
      style_[rc_qname::atom(ID_padding_right)], parent_width);
  rc_ref<expr::Expr> border_right_width = to_expr_zero_border(scope,
      style_[rc_qname::atom(ID_border_right_width)],
      style_[rc_qname::atom(ID_border_right_style)], parent_width);
  rc_ref<expr::Expr> margin_right = to_expr_auto(scope,
      style_[rc_qname::atom(ID_margin_right)], parent_width);
  rc_ref<expr::Expr> right =
      to_expr_auto(scope, style_[rc_qname::atom(ID_right)], parent_width);

  rc_ref<expr::Expr> left_bp = border_left_width + padding_left;
  rc_ref<expr::Expr> right_bp = border_right_width + padding_right;
  if (!left.is_null() && !right.is_null() && !width.is_null()) {
    rc_ref<expr::Expr> extra =
        parent_width - (width + left + left_bp + right_bp);
    if (margin_left.is_null()) {
      extra = extra - right;
      if (margin_right.is_null()) {
        margin_left = 0.5 * extra;
        margin_right = margin_left;
      } else {
        margin_left = extra - margin_right;
      }
    } else {
      if (margin_right.is_null()) {
        margin_right = extra - (right + margin_left);
      } else {
        // overconstraint
        right = extra - margin_right;
      }
    }
  } else {
    if (margin_left.is_null()) {
      margin_left = expr::common().v_zero;
    }
    if (margin_right.is_null()) {
      margin_right = expr::common().v_zero;
    }
    if (left.is_null() && right.is_null() && width.is_null()) {
      left = expr::common().v_zero;
    }
    if (left.is_null() && width.is_null()) {
      width = auto_width_;
      is_auto_width_ = true;
    } else if (left.is_null() && right.is_null()) {
      left = expr::common().v_zero;
    } else if (width.is_null() && right.is_null()) {
      width = auto_width_;
      is_auto_width_ = true;
    }
    rc_ref<expr::Expr> remains =
        parent_width - (margin_left + left_bp + margin_right + right_bp);
    if (is_auto_width_) {
      if (max_width.is_null()) {
        // TODO: handle the case when right/left depends on width
        max_width = remains - (left.is_null() ? right : left);
      }
      // For multi-column layout, width is max-width.
      if (!is_vertical_ &&
          (!is_auto_or_null(style_[rc_qname::atom(ID_column_width)]) ||
              !is_auto_or_null(style_[rc_qname::atom(ID_column_count)]))) {
        width = max_width;
        is_auto_width_ = false;
      }
    }
    if (left.is_null()) {
      left = remains - (right + width);
    } else if (width.is_null()) {
      width = remains - (left + right);
    } else if (right.is_null()) {
      right = remains - (left + width);
    }
  }
  // snap-width is inherited
  rc_ref<css::CSSValue> snap_width_val = style_[rc_qname::atom(ID_snap_width)];
  if (snap_width_val.is_null() && parent_instance_) {
    snap_width_val = parent_instance_->style_[rc_qname::atom(ID_snap_width)];
  }
  rc_ref<expr::Expr> snap_width =
      to_expr_zero(scope, snap_width_val, parent_width);

  style_[rc_qname::atom(ID_left)] = new css::CSSExpr(left, scope);
  style_[rc_qname::atom(ID_margin_left)] = new css::CSSExpr(margin_left, scope);
  style_[rc_qname::atom(ID_border_left_width)] =
      new css::CSSExpr(border_left_width, scope);
  style_[rc_qname::atom(ID_padding_left)] =
      new css::CSSExpr(padding_left, scope);
  style_[rc_qname::atom(ID_width)] = new css::CSSExpr(width, scope);
  style_[rc_qname::atom(ID_max_width)] =
      new css::CSSExpr((max_width.is_null() ? width : max_width), scope);
  style_[rc_qname::atom(ID_padding_right)] =
      new css::CSSExpr(padding_right, scope);
  style_[rc_qname::atom(ID_border_right_width)] =
      new css::CSSExpr(border_right_width, scope);
  style_[rc_qname::atom(ID_margin_right)] =
      new css::CSSExpr(margin_right, scope);
  style_[rc_qname::atom(ID_right)] = new css::CSSExpr(right, scope);
  style_[rc_qname::atom(ID_snap_width)] = new css::CSSExpr(snap_width, scope);
}

void PageBoxInstance::init_vertical() {
  const rc_ref<expr::Scope>& scope = page_master_instance_->scope();
  rc_ref<expr::Expr> parent_width;
  if (parent_instance_) {
    parent_width = parent_instance_->style_[
        rc_qname::atom(ID_width)]->to_expr(scope.ptr(), nullptr);
  } else {
    parent_width = new expr::ExprNamed(rc_qname::atom(ID_page_width));
  }
  rc_ref<expr::Expr> parent_height;
  if (parent_instance_) {
    parent_height = parent_instance_->style_[
        rc_qname::atom(ID_height)]->to_expr(scope.ptr(), nullptr);
  } else {
    parent_height = new expr::ExprNamed(rc_qname::atom(ID_page_height));
  }
  rc_ref<expr::Expr> top =
      to_expr_auto(scope, style_[rc_qname::atom(ID_top)], parent_height);
  rc_ref<expr::Expr> margin_top = to_expr_auto(scope,
      style_[rc_qname::atom(ID_margin_top)], parent_width);
  rc_ref<expr::Expr> border_top_width = to_expr_zero_border(scope,
      style_[rc_qname::atom(ID_border_top_width)],
      style_[rc_qname::atom(ID_border_top_style)], parent_width);
  rc_ref<expr::Expr> padding_top = to_expr_zero(scope,
      style_[rc_qname::atom(ID_padding_top)], parent_width);
  rc_ref<expr::Expr> height = to_expr_auto(scope,
      style_[rc_qname::atom(ID_height)], parent_height);
  rc_ref<expr::Expr> max_height = to_expr_auto(scope,
      style_[rc_qname::atom(ID_max_height)], parent_height);
  rc_ref<expr::Expr> padding_bottom = to_expr_zero(scope,
      style_[rc_qname::atom(ID_padding_bottom)], parent_width);
  rc_ref<expr::Expr> border_bottom_width = to_expr_zero_border(scope,
      style_[rc_qname::atom(ID_border_bottom_width)],
      style_[rc_qname::atom(ID_border_bottom_style)], parent_width);
  rc_ref<expr::Expr> margin_bottom = to_expr_auto(scope,
      style_[rc_qname::atom(ID_margin_bottom)], parent_width);
  rc_ref<expr::Expr> bottom = to_expr_auto(scope,
      style_[rc_qname::atom(ID_bottom)], parent_height);
  rc_ref<expr::Expr> top_bp = border_top_width + padding_top;
  rc_ref<expr::Expr> bottom_bp = border_bottom_width + padding_bottom;
  if (!top.is_null() && !bottom.is_null() && !height.is_null()) {
    rc_ref<expr::Expr> extra =
        parent_height - (height + top + top_bp + bottom_bp);
    if (margin_top.is_null()) {
      extra = extra - bottom;
      if (margin_bottom.is_null()) {
        margin_top = 0.5 * extra;
        margin_bottom = margin_top;
      } else {
        margin_top = extra - margin_bottom;
      }
    } else {
      if (margin_bottom.is_null()) {
        margin_bottom = extra - (bottom + margin_top);
      } else {
        // overconstraint
        bottom = extra - margin_top;
      }
    }
  } else {
    if (margin_top.is_null())
      margin_top = expr::common().v_zero;
    if (margin_bottom.is_null())
      margin_bottom = expr::common().v_zero;
    if (top.is_null() && bottom.is_null() && height.is_null())
      top = expr::common().v_zero;
    if (top.is_null() && height.is_null()) {
      height = auto_height_;
      is_auto_height_ = true;
    } else if (top.is_null() && bottom.is_null()) {
      top = expr::common().v_zero;
    } else if (height.is_null() && bottom.is_null()) {
      height = auto_height_;
      is_auto_height_ = true;
    }
    rc_ref<expr::Expr> remains =
        parent_height - (margin_top + top_bp + margin_bottom + bottom_bp);
    if (is_auto_height_) {
      if (max_height.is_null()) {
        // TODO: handle the case when top/bottom depends on height
        max_height = remains - (top.is_null() ? bottom : top);
      }
      // For multi-column layout in vertical writing, height is max-height.
      if (is_vertical_ &&
          (!is_auto_or_null(style_[rc_qname::atom(ID_column_width)]) ||
              is_auto_or_null(style_[rc_qname::atom(ID_column_count)]))) {
        height = max_height;
        is_auto_height_ = false;
      }
    }
    if (top.is_null()) {
      top = remains - (bottom + height);
    } else if (height.is_null()) {
      height = remains - (bottom + top);
    } else if (bottom.is_null()) {
      bottom = remains - (top + height);
    }
  }
  // snap-height is inherited
  rc_ref<css::CSSValue> snap_height_val =
      style_[rc_qname::atom(ID_snap_height)];
  if (snap_height_val.is_null() && parent_instance_) {
    snap_height_val = parent_instance_->style_[rc_qname::atom(ID_snap_height)];
  }
  rc_ref<expr::Expr> snap_height =
      to_expr_zero(scope, snap_height_val, parent_width);

  style_[rc_qname::atom(ID_top)] = new css::CSSExpr(top, scope);
  style_[rc_qname::atom(ID_margin_top)] = new css::CSSExpr(margin_top, scope);
  style_[rc_qname::atom(ID_border_top_width)] =
      new css::CSSExpr(border_top_width, scope);
  style_[rc_qname::atom(ID_padding_top)] = new css::CSSExpr(padding_top, scope);
  style_[rc_qname::atom(ID_height)] = new css::CSSExpr(height, scope);
  style_[rc_qname::atom(ID_max_height)] =
      new css::CSSExpr((max_height.is_null() ? height : max_height), scope);
  style_[rc_qname::atom(ID_padding_bottom)] =
      new css::CSSExpr(padding_bottom, scope);
  style_[rc_qname::atom(ID_border_bottom_width)] =
      new css::CSSExpr(border_bottom_width, scope);
  style_[rc_qname::atom(ID_margin_bottom)] =
      new css::CSSExpr(margin_bottom, scope);
  style_[rc_qname::atom(ID_bottom)] = new css::CSSExpr(bottom, scope);
  style_[rc_qname::atom(ID_snap_height)] = new css::CSSExpr(snap_height, scope);
}

void PageBoxInstance::init_columns() {
  const rc_ref<expr::Scope>& scope = page_master_instance_->scope();
  rc_ref<expr::Expr> width = to_expr_auto(scope, style_[rc_qname::atom(
      is_vertical_ ? ID_height : ID_width)], rc_ref<expr::Expr>());
  rc_ref<expr::Expr> column_width =
      to_expr_auto(scope, style_[rc_qname::atom(ID_column_width)], width);
  rc_ref<expr::Expr> column_count = to_expr_auto(scope,
      style_[rc_qname::atom(ID_column_count)], rc_ref<expr::Expr>());
  rc_ref<expr::Expr> column_gap = to_expr_auto(scope,
      style_[rc_qname::atom(ID_column_gap)], rc_ref<expr::Expr>());
  if (column_gap.is_null()) {
    column_gap = new expr::ExprNumeric(1, rc_qname::atom(ID_em));
  }
  if (column_count.is_null()) {
    if (!column_width.is_null()) {
      column_count = new expr::ExprCall(
          new expr::ExprNamed(rc_qname::atom(ID_floor)),
          rc_list<rc_ref<expr::Expr>>::of(
              (width + column_gap) / (column_width + column_gap)));
      column_count = new expr::ExprCall(
          new expr::ExprNamed(rc_qname::atom(ID_max)),
          rc_list<rc_ref<expr::Expr>>::of(
              expr::common().v_one, column_count));
    } else {
      column_count = expr::common().v_one;
    }
  }
  column_width = (width + column_gap) / column_count - column_gap;
  style_[rc_qname::atom(ID_column_width)] =
      new css::CSSExpr(column_width, scope);
  style_[rc_qname::atom(ID_column_count)] =
      new css::CSSExpr(column_count, scope);
  style_[rc_qname::atom(ID_column_gap)] = new css::CSSExpr(column_gap, scope);
}

bool PageBoxInstance::depends(const rc_qname& name,
    const rc_ref<expr::Expr>& value, expr::Context* context) {
  const rc_ref<expr::Scope>& scope = page_master_instance_->scope();
  return style_[name]->to_expr(scope.ptr(),
      expr::common().v_zero)->depend(scope.ptr(), value.ptr());
}

void PageBoxInstance::apply_cascade(css::CascadeInstance* cascade_instance) {
  cascaded_ = cascade_instance->push_rule(
      page_box_->classes_, page_box_->style_);
  for (const rc_ref<PageBoxInstance>& child : children_) {
    child->apply_cascade(cascade_instance);
  }
  cascade_instance->pop_rule();
}

void PageBoxInstance::init(expr::Context* context) {
  rc_list<rc_qname> region_ids = parent_instance_
      ? parent_instance_->get_active_regions(context)
      : rc_list<rc_qname>::empty();

  // Flatten cascaded style
  std::unordered_map<rc_qname, rc_ref<css::CascadeValue>> casc_map;
  for (const css::element_style::Entry& entry : cascaded_) {
    if (entry.key->ns()->empty()) {
      // real property name, not special and not pseudoelement/region submap.
      casc_map[entry.key] = rc_cast<rc_ref<css::CascadeValue>>(entry.value);
    }
  }
  rc_map<css::element_style> regions = cascaded_.regions();
  if ((!region_ids->empty() || is_footnote_) && !regions.is_null() &&
      !regions->empty()) {
    if (is_footnote_) {
      rc_list<rc_qname> fr = rc_list<rc_qname>::of(rc_qname::atom(ID_footnote));
      if (region_ids->empty()) {
        region_ids = fr;
      } else {
        region_ids = region_ids.concat(fr);
      }
    }
    for (const rc_qname& region_id : region_ids) {
      const css::element_style& region_style = regions[region_id];
      for (const css::element_style::Entry& entry : region_style) {
        if (entry.key->ns()->empty()) {
          casc_map[entry.key] = cascade_values(context, casc_map[entry.key],
              rc_cast<rc_ref<css::CascadeValue>>(entry.value));
        }
      }
    }
  }

  // Determine writing mode
  if (parent_instance_) {
    is_vertical_ = parent_instance_->is_vertical_;
  }
  auto writing_mode_it = casc_map.find(rc_qname::atom(ID_writing_mode));
  if (writing_mode_it != casc_map.end()) {
    rc_ref<css::CSSValue> writing_mode = writing_mode_it->second->evaluate(
        context, rc_qname::atom(ID_writing_mode));
    if (writing_mode->id() != ID_inherit) {
      is_vertical_ = writing_mode->id() == ID_vertical_rl;
    }
  }

  // Fill style_ map sorting out logical and geometrical properties.
  const std::unordered_map<rc_qname, rc_qname>& coupling_map =
      css::coupling_map(is_vertical_);

  for (const auto& entry : casc_map) {
    auto coupled_name_it = coupling_map.find(entry.first);
    rc_qname target_name;
    if (coupled_name_it != coupling_map.end()) {
    	auto coupled_value_it = casc_map.find(coupled_name_it->second);
      if (coupled_value_it != casc_map.end() &&
          coupled_value_it->second->priority() > entry.second->priority()) {
        continue;
      }
      target_name = css::is_geometric_name(entry.first)
          ? entry.first : coupled_name_it->second;
    } else {
    	target_name = entry.first;
    }
    style_[target_name] = rescope(entry.second->value());
  }
  auto_width_ = new expr::ExprConst(new PageBoxAutoWidth(this));
  auto_height_ = new expr::ExprConst(new PageBoxAutoHeight(this));

  init_horizontal();
  init_vertical();
  init_columns();
  init_enabled();

  for (const rc_ref<PageBoxInstance>& child : children_) {
    child->init(context);
  }
}

rc_ref<expr::Expr> PageBoxInstance::box_specific_enabled(
    const rc_ref<expr::Expr>& base_enabled) {
  return base_enabled;
}

rc_ref<expr::Expr> PageBoxInstance::add_named_values(int id1, int id2) {
  rc_ref<expr::Expr> v1 = resolve_local(rc_qname::atom(id1));
  rc_ref<expr::Expr> v2 = resolve_local(rc_qname::atom(id2));
  return v1 + v2;
}

rc_ref<css::CSSValue> PageBoxInstance::rescope(
    const rc_ref<css::CSSValue>& value) {
  if (value->is<rc_ref<css::CSSExpr>>()) {
    css::CSSExpr* expr = static_cast<css::CSSExpr*>(value.ptr());
    if (expr->scope() == page_box_->page_master()->scope()) {
      return new css::CSSExpr(expr->expr(), page_master_instance_->scope());
    }
  }
  return value;
}


rc_ref<expr::Expr> PageBoxInstance::resolve_local(const rc_qname& name) {
  auto it = style_.find(name);
  if (it != style_.end()) {
    return it->second->to_expr(page_master_instance_->scope().ptr(),
        expr::common().v_zero);
  }
  rc_ref<expr::Expr> expr;
  switch (name->id()) {
    case ID_margin_left_edge:
      expr = resolve_local(rc_qname::atom(ID_left));
      break;
    case ID_margin_top_edge:
      expr = resolve_local(rc_qname::atom(ID_top));
      break;
    case ID_margin_right_edge:
      expr = add_named_values(ID_border_right_edge, ID_margin_right);
      break;
    case ID_margin_bottom_edge:
      expr = add_named_values(ID_border_bottom_edge, ID_margin_bottom);
      break;
    case ID_border_left_edge:
      expr = add_named_values(ID_margin_left_edge, ID_margin_left);
      break;
    case ID_border_top_edge:
      expr = add_named_values(ID_margin_top_edge, ID_margin_top);
      break;
    case ID_border_right_edge:
      expr = add_named_values(ID_padding_right_edge, ID_border_right_width);
      break;
    case ID_border_bottom_edge:
      expr = add_named_values(ID_padding_bottom_edge, ID_border_bottom_width);
      break;
    case ID_padding_left_edge:
      expr = add_named_values(ID_border_left_edge, ID_border_left_width);
      break;
    case ID_padding_top_edge:
      expr = add_named_values(ID_border_top_edge, ID_border_top_width);
      break;
    case ID_padding_right_edge:
      expr = add_named_values(ID_right_edge, ID_padding_right);
      break;
    case ID_padding_bottom_edge:
      expr = add_named_values(ID_bottom_edge, ID_padding_bottom);
      break;
    case ID_left_edge:
      expr = add_named_values(ID_padding_left_edge, ID_padding_left);
      break;
    case ID_top_edge:
      expr = add_named_values(ID_padding_top_edge, ID_padding_top);
      break;
    case ID_right_edge:
      expr = add_named_values(ID_left_edge, ID_width);
      break;
    case ID_bottom_edge:
      expr = add_named_values(ID_top_edge, ID_height);
      break;
  }
  if (expr.is_null()) {
    const std::unordered_map<rc_qname, rc_qname>& map =
        css::coupling_map(is_vertical_);
    auto it = map.find(name);
    if (it != map.end()) {
      expr = resolve_local(it->second);
    }
  }
  if (!expr.is_null()) {
    style_[name] = new css::CSSExpr(expr, page_master_instance_->scope());
  }
  return expr;
}

void PageBoxInstance::prepare_container(expr::Context* context,
    layout::Container* container) {
  if (is_vertical_ ? is_auto_width_ : is_auto_height_) {
    if (is_vertical_) {
      size_with_max_width(context, container);
    } else {
      size_with_max_height(context, container);
    }
  } else {
    assign_before_position(context, container);
    assign_after_position(context, container);
  }
  if (is_vertical_ ? is_auto_height_ : is_auto_width_) {
    if (is_vertical_) {
      size_with_max_height(context, container);
    } else {
      size_with_max_width(context, container);
    }
  } else {
    assign_start_end_position(context, container);
  }
}

void PageBoxInstance::finish_container(expr::Context* context,
    load::Package* package, layout::Container* container, layout::Page* page,
    layout::Container* column_container, size_t column_count) {
/*
  if (is_vertical_)
    calculated_width_ = container.computedBlockSize + container.snapOffsetX;
  else
    calculated_height_ = container.computedBlockSize + container.snapOffsetY;
*/
  if (is_vertical_ ? is_auto_height_ : is_auto_width_) {
    assign_start_end_position(context, container);
  }
  if (is_vertical_ ? is_auto_width_ : is_auto_height_) {
    if (is_vertical_ ? is_right_dependent_on_auto_width_
        : is_top_dependent_on_auto_height_) {
      assign_before_position(context, container);
    }
    assign_after_position(context, container);
  }
  container->box_ = new layout::Box();
  container->box_->init_from(package, context, style_);
}

double PageBoxInstance::get_value(expr::Context* cx, const rc_qname& name) {
  rc_ref<expr::Expr> expr = resolve_local(name);
  if (!expr.is_null()) {
    return as_number(expr->evaluate(cx,
        page_master_instance_->scope()->frames()));
  }
  assert(false);
  return 0;
}

void PageBoxInstance::assign_left_position(expr::Context* cx,
    layout::Container* cont) {
  double x = get_value(cx, rc_qname::atom(ID_left_edge));
  double width = get_value(cx, rc_qname::atom(ID_width));
  cont->bounds_.set_x1(x);
  cont->bounds_.set_dx(width);
}

void PageBoxInstance::assign_right_position(expr::Context* cx,
    layout::Container* cont) {
    
}

void PageBoxInstance::assign_top_position(expr::Context* cx,
    layout::Container* cont) {
  double snap_height = get_value(cx, rc_qname::atom(ID_snap_height));
  double y = get_value(cx, rc_qname::atom(ID_top_edge));
  if (!is_vertical_ && snap_height > 0) {
    double r = y - floor(y / snap_height) * snap_height;
    if (r > 0) {
    		// container.snapOffsetY = snapHeight - r;
    		y += snap_height - r;
    }
  }
  cont->bounds_.set_y1(y);
}

void PageBoxInstance::assign_bottom_position(expr::Context* cx,
    layout::Container* cont) {
  // TODO: minus snapOffsetY
  double height = get_value(cx, rc_qname::atom(ID_height));
  cont->bounds_.set_dy(height);
}

void PageBoxInstance::assign_before_position(expr::Context* cx,
    layout::Container* cont) {
  if (is_vertical_) {
    assign_right_position(cx, cont);
  } else {
    assign_top_position(cx, cont);
  }
}

void PageBoxInstance::assign_after_position(expr::Context* cx,
    layout::Container* cont) {
  if (is_vertical_) {
    assign_left_position(cx, cont);
  } else {
    assign_bottom_position(cx, cont);
  }
}

void PageBoxInstance::assign_start_end_position(expr::Context* cx,
    layout::Container* cont) {
  if (is_vertical_) {
    assign_top_position(cx, cont);
    assign_bottom_position(cx, cont);
  } else {
    assign_right_position(cx, cont);
    assign_left_position(cx, cont);
  }
}

void PageBoxInstance::size_with_max_height(expr::Context* cx,
    layout::Container* cont) {
  double height = get_value(cx, rc_qname::atom(ID_max_height));
  if (is_top_dependent_on_auto_height_) {
    cont->bounds_.set_y1(0);
    cont->bounds_.set_dy(height);
  } else {
    assign_top_position(cx, cont);
    // height -= container.snapOffsetY;
    cont->bounds_.set_dy(height);
  }
}

void PageBoxInstance::size_with_max_width(expr::Context* cx,
    layout::Container* cont) {
  double width = get_value(cx, rc_qname::atom(ID_max_width));
  if (is_right_dependent_on_auto_width_) {
    cont->bounds_.set_x1(0);
    cont->bounds_.set_dx(width);
  } else {
    assign_right_position(cx, cont);
    // width -= container.snapOffsetX;
    cont->bounds_.set_dx(width);
  }
}

//------------------- PageMasterInstance ----------------------------------

rc_ref<expr::Expr> PageMasterResolver::resolve_name(const rc_qname& name) {
  return page_master_instance_->resolve_name(name);
}

PageMasterInstance::PageMasterInstance(PageMaster* page_box)
    : PageBoxInstance(nullptr, page_box) {
  page_master_instance_ = this;
  resolver_ = new PageMasterResolver(this);
  scope_ = page_box->scope_->clone(resolver_.ptr());
}

PageMasterInstance::~PageMasterInstance() {
  resolver_->page_master_instance_ = nullptr;
}

rc_ref<expr::Expr> PageMasterInstance::box_specific_enabled(
    const rc_ref<expr::Expr>& base_enabled) {
  rc_ref<expr::Expr> cond = page_box_->page_master()->condition();
  if (cond.is_null()) {
    return base_enabled;
  }
  return base_enabled && cond;
}

PartitionGroupInstance::PartitionGroupInstance(PageBoxInstance* parent,
    PartitionGroup* page_box) : PageBoxInstance(parent, page_box) {
  page_master_instance_ = parent->page_master_instance_;
  if (!page_box_->name().empty()) {
    page_master_instance_->named_boxes_[page_box->name()] = this;
  }
}

PartitionInstance::PartitionInstance(PageBoxInstance* parent,
    Partition* page_box) : PageBoxInstance(parent, page_box) {
  page_master_instance_ = parent->page_master_instance_;
  if (!page_box_->name().empty()) {
    page_master_instance_->named_boxes_[page_box->name()] = this;
  }
}

rc_ref<expr::Expr> PartitionInstance::box_specific_enabled(
    const rc_ref<expr::Expr>& base_enabled) {
  const rc_ref<expr::Scope>& scope = page_master_instance_->scope();
  bool required = to_expr_bool(scope, style_[rc_qname::atom(ID_required)],
      expr::common().v_false).ptr() !=
          expr::common().v_false.ptr();
  rc_ref<expr::Expr> enabled = base_enabled;
  if (required || is_auto_height_) {
    rc_ref<expr::Expr> flow_name = to_expr_ident(scope,
        style_[rc_qname::atom(ID_flow_from)], rc_qname::atom(ID_body));
    rc_ref<expr::Expr> has_content = new expr::ExprCall(
        new expr::ExprNamed(rc_qname::atom(ID_has_content)),
        rc_list<rc_ref<expr::Expr>>::of(flow_name));
    enabled = enabled && has_content;
  }
  auto req = style_.find(rc_qname::atom(ID_required_partitions));
  if (req != style_.end()) {
    enabled = process_partition_list(enabled, req->second, false);
  }
  auto conf = style_.find(rc_qname::atom(ID_conflicting_partitions));
  if (conf != style_.end()) {
    enabled = process_partition_list(enabled, conf->second, true);
  }
  if (required) {
    auto en_it = page_master_instance_->style_.find(rc_qname::atom(ID_enabled));
    rc_ref<expr::Expr> pm_enabled = en_it != page_master_instance_->style_.end()
        ? en_it->second->to_expr(scope.ptr(), expr::common().v_zero)
        : expr::common().v_true;
    pm_enabled = pm_enabled && enabled;
    page_master_instance_->style_[rc_qname::atom(ID_enabled)] =
        new css::CSSExpr(pm_enabled, scope);
  }
  return enabled;
}

rc_ref<expr::Expr> PageMasterInstance::resolve_name(const rc_qname& name) {
  rc_qname box_name = name->ns();
  if (box_name->empty()) {
    return nullptr;
  }
  auto it = named_boxes_.find(box_name);
  if (it == named_boxes_.end()) {
    fprintf(stderr, "Cannot find page box %s\n", box_name->to_string()->utf8());
    return nullptr;
  }
  return it->second->resolve_local(name->local());
}

rc_ref<expr::Expr> PartitionInstance::process_partition_list(
    const rc_ref<expr::Expr>& enabled, const rc_ref<css::CSSValue>& list_val,
    bool conflicting) {
  rc_list<rc_ref<css::CSSValue>> list = rc_list<rc_ref<css::CSSValue>>::empty();
  if (list_val->is<rc_ref<css::CSSIdent>>()) {
    list = rc_list<rc_ref<css::CSSValue>>::of(list_val);
  }
  if (list_val->is<rc_ref<css::CSSCommaList>>()) {
    list = static_cast<css::CSSCommaList*>(list_val.ptr())->list();
  }
  rc_ref<expr::Expr> en = enabled;
  for (const rc_ref<css::CSSValue>& val : list) {
    if (val->is<rc_ref<css::CSSIdent>>()) {
      rc_qname qname(static_cast<css::CSSIdent*>(val.ptr())->name(),
          rc_qname::atom(ID_enabled)->to_string());
      rc_ref<expr::Expr> term = new expr::ExprNamed(qname);
      if (conflicting) {
        term = new expr::ExprNot(term);
      }
      en = en && term;
    }
  }
  return en;
}

}
}


