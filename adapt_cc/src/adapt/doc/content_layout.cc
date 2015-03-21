#include "adapt/doc/content_layout.h"

#include "adapt/base/rc_primitive.h"
#include "adapt/expr/expr.h"
#include "adapt/css/unit.h"
#include "adapt/doc/xml_content.h"
#include "adapt/layout/engine.h"
#include "adapt/layout/view_iterator.h"

namespace adapt {
namespace doc {

namespace {

class HasContent : public expr::GreedyBuiltin {
 public:
  HasContent() : GreedyBuiltin(1) {}
  virtual rc_value apply(expr::Context* cx,
      const rc_value* args) const override {
    rc_string flow_name = as_string(*args);
    ContentLayoutInstance* instance = static_cast<ContentLayoutInstance*>(cx);
    return rc_boolean(instance->has_content(rc_qname(flow_name)));
  }
};

class PageNumber : public expr::AbstractPartial {
 public:
  virtual rc_value apply(expr::Context* cx) override {
    ContentLayoutInstance* instance = static_cast<ContentLayoutInstance*>(cx);
    return rc_real(instance->page_number());
  }
};

dom::node_offset_t flow_offset(const std::vector<FlowChunkPosition>& chunks) {
  dom::node_offset_t offset = std::numeric_limits<dom::node_offset_t>::max();
  for (const FlowChunkPosition& chunk : chunks) {
    offset = std::min(offset, chunk.chunk_position.primary.doc_offset);
  }
  return offset;
}

geom::Polygon decode_shape(const rc_ref<css::CSSValue>& shape_prop,
    double x, double y, double width, double height,
    const css::RelativeSizes& sizes) {
  return geom::Polygon(x, y, width, height);
}

}

rc_ref<expr::Scope> create_page_scope(
    const rc_ref<expr::Scope>& parent) {
  rc_ref<expr::Scope> scope = new expr::Scope(parent, expr::Scope::PAGE_KEY);
  scope->define_name(rc_qname::atom(ID_has_content),
      new expr::ExprConst(new HasContent()));
  scope->define_name(rc_qname::atom(ID_page_number),
      new expr::ExprConst(new PageNumber()));
  return scope;
}

ContentLayout::ContentLayout(const rc_ref<expr::Scope>& root_scope,
    const rc_ref<css::Cascade>& cascade,
    const rc_list<rc_ref<pm::PageMaster>>& page_masters)
        : root_scope_(root_scope), cascade_(cascade),
          page_masters_(page_masters) {}

ContentLayoutInstance::ContentLayoutInstance(
    const rc_ref<ContentLayout>& content_layout,
    const rc_ref<XMLContentDocument>& xmldoc, const Environment& environment)
    : content_layout_(content_layout), xmldoc_(xmldoc),
      page_master_instances_(rc_list<rc_ref<pm::PageMasterInstance>>::empty()),
      environment_(new Environment(environment)) {
  primary_flows_.insert(rc_qname::atom(ID_body));
  styler_ = std::unique_ptr<css::CascadeStyler>(new css::CascadeStyler(
      xmldoc->dom(), content_layout_->cascade().ptr(), this, primary_flows_));
  styler_->reset_flow_chunk_stream(this);
  rc_value url = xmldoc->dom()->document_url();
  css::FlowChunk chunk(rc_qname::atom(ID_body), xmldoc->dom()->root(), 0, 0,
      0, false, false, false);
  std::vector<FlowChunkPosition>& flows =
      position_.flows[rc_qname::atom(ID_body)];
  flows.push_back(FlowChunkPosition(chunk, 1));
  sizes_.viewport.width = environment.width;
  sizes_.viewport.height = environment.height;
  sizes_.viewport.rem_size = environment.font_size;
  sizes_.viewport.in_size = 96.0;
  sizes_.font.em_size = environment.font_size;
  sizes_.font.ex_size = 0.5 * sizes_.font.em_size;
  sizes_.font.ch_size = 0.5 * sizes_.font.em_size;
  sizes_.font.weight = 400;
  sizes_.box.width = environment.width;
  sizes_.box.height = environment.height;
}

void ContentLayoutInstance::init() {
  std::vector<rc_ref<pm::PageMasterInstance>> pmis;
  std::unique_ptr<css::CascadeInstance> cascade_instance(
      new css::CascadeInstance(content_layout_->cascade().ptr(), this, lang_));
  for (const rc_ref<pm::PageMaster>& pm : content_layout_->page_masters_) {
    rc_ref<pm::PageMasterInstance> pmi = pm->create_page_master_instance();
    pmis.push_back(pmi);
    pmi->apply_cascade(cascade_instance.get());
    pmi->init(this);
  }
  std::sort(pmis.begin(), pmis.end(),
      pm::PageMasterInstance::CompareSpecificity());
  page_master_instances_ = rc_list<rc_ref<pm::PageMasterInstance>>(pmis);
}

double ContentLayoutInstance::query_unit_size(const rc_qname& unit) {
  double size;
  if (css::get_length_unit_size(unit,
      css::percentage_base_by_property(rc_qname::atom(ID_width)),
      sizes_, &size)) {
    return size;
  }
  fprintf(stderr, "unknown unit: %s\n", unit->to_string()->utf8());
  return 1;
}

rc_value ContentLayoutInstance::query_context_data(const rc_qname& key) {
  switch (key->id()) {
    case ID_PRIVATE_environment:
      return environment_;
    default:
      assert(false);
      return rc_value();
  }
}

dom::node_offset_t ContentLayoutInstance::current_offset() const {
  dom::node_offset_t offset = std::numeric_limits<dom::node_offset_t>::max();
  for (const rc_qname& flow_name : primary_flows_) {
    auto flow = position_.flows.find(flow_name);
    if (flow == position_.flows.end() || flow->second.empty()) {
      styler_->style_until_flow_is_reached(flow_name);
      flow = position_.flows.find(flow_name);
    }
    if (flow != position_.flows.end()) {
      offset = std::min(offset, flow_offset(flow->second));
    }
  }
  return offset;
}

void ContentLayoutInstance::init_flow_linger() {
  for (auto& fl : position_.flows) {
    for (FlowChunkPosition& fcp : fl.second) {
      if (fcp.flow_chunk.start_offset >= lookup_offset_) {
        break;
      }
      if (fcp.start_page <= 0) {
        fcp.start_page = page_number_;
      }
    }
  }
}

void ContentLayoutInstance::apply_flow_linger() {
  for (auto& fl : position_.flows) {
    size_t i = fl.second.size();
    while (i > 0) {
      --i;
      const FlowChunkPosition& fcp = fl.second[i];
      if (fcp.start_page > 0 && fcp.flow_chunk.linger > 0 &&
          fcp.start_page + fcp.flow_chunk.linger - 1 <= page_number_) {
        fl.second.erase(fl.second.begin() + i);
      }
    }
  }
}

rc_ref<pm::PageMasterInstance> ContentLayoutInstance::select_page_master() {
  // 3.5. Page Layout Processing Model
  // 1. Determine current position in the document: Find the minimal
  // consumed-offset for all elements not fully-consumed in each primary flow.
  // Current position is maximum of the results among all primary flows.
  dom::node_offset_t offset = current_offset();
  if (offset == std::numeric_limits<dom::node_offset_t>::max()) {
    // end of primary content is reached
    return rc_ref<pm::PageMasterInstance>();
  }
  // 2. Page master selection: for each page master:
  for (const rc_ref<pm::PageMasterInstance>& pmi : page_master_instances_) {
    printf("Trying page master %s\n", pmi->page_box()->name_nonempty()->utf8());
    double coeff = 1;
    // A. Calculate lookup position using current position and utilization
    // (see -epubx-utilization property)
    rc_ref<css::CSSValue> utilization =
        pmi->get_prop(this, rc_qname::atom(ID_utilization));
    if (!utilization.is_null() && utilization->is<rc_ref<css::CSSNumber>>()) {
      coeff = static_cast<css::CSSNumber*>(utilization.ptr())->num();
    }
    double em = environment_->font_size;
    double page_area = environment_->width * environment_->height;
    dom::node_offset_t lookup = (dom::node_offset_t)ceil(
        coeff * page_area / (em * em));
    // B. Determine element eligibility. Each element in a flow is considered
    // eligible if it is is not marked as fully consumed and it comes in the
    // document before the lookup position. Feed lookup_offset and flow
    // availability into the context
    lookup_offset_ = styler_->style_until(offset, lookup);
    clear_keys(expr::Scope::PAGE_KEY);
    // C. Determine content availability. Flow has content available if it
    // contains eligible elements.
    // D. Determine if page master is enabled using rules in Section 3.4.7
    rc_ref<css::CSSValue> enabled =
        pmi->get_prop(this, rc_qname::atom(ID_enabled));
    // E. First enabled page master is used for the next page
    if (enabled.is_null() || enabled->id() == ID_true) {
      init_flow_linger();
      return pmi;
    }
  }
  fprintf(stderr, "No enabled page masters");
  assert(false);
  return rc_ref<pm::PageMasterInstance>();
}

namespace {

bool is_better(const css::FlowChunk& curr, const css::FlowChunk& other) {
  if (!curr.exclusive) {
    return false;
  }
  if (other.exclusive) {
    return true;
  }
  if (curr.priority > other.priority) {
    return true;
  }
  return curr.last;
}

}

std::vector<FlowChunkPosition>::iterator ContentLayoutInstance::select_chunk(
    std::vector<FlowChunkPosition>& chunks) {
  std::vector<FlowChunkPosition>::iterator best = chunks.begin();
  for (std::vector<FlowChunkPosition>::iterator curr = chunks.begin() + 1;
      curr != chunks.end() && curr->flow_chunk.start_offset < lookup_offset_;
      ++curr) {
    if (is_better(curr->flow_chunk, best->flow_chunk)) {
      best = curr;
    }
  }
  return best;
}

double ContentLayoutInstance::layout_column(layout::ViewIterator* view_iterator,
    layout::Page* page, pm::PageBoxInstance* box_instance,
    const rc_qname& flow_name, layout::Container* column_container,
    double offset_x, double offset_y,
    std::vector<geom::Polygon>* exclusions) {
  geom::Polygon polygon(0, 0, column_container->bounds().dx(), 1e+30);
  geom::BandedShape shape(polygon);
  if (exclusions) {
    for (const geom::Polygon& exclusion : *exclusions) {
      shape.add_exclusion(geom::Polygon(exclusion, -offset_x, -offset_y));
    }
  }
  auto it = position_.flows.find(flow_name);
  if (it == position_.flows.end()
      || it->second.front().flow_chunk.start_offset >= lookup_offset_) {
    return 0;
  }
  double y = 0;
  static dom::AttributeParser attribute_parser;
  column_container->reset_content();  // Ensures DOM exists.
  std::unique_ptr<dom::Builder> builder(
      column_container->content_->builder(&attribute_parser));
  builder->start_element(rc_qname::atom(ID_PRIVATE_column),
      rc_map<rc_value>::empty());
  std::vector<FlowChunkPosition> repeated;
  while (!it->second.empty()) {
    std::vector<FlowChunkPosition>::iterator selected =
        select_chunk(it->second);
    layout::ChunkPosition& cp = selected->chunk_position;
    if (cp.primary.steps->empty()) {
      StringWriter w;
      w << xmldoc_->dom()->document_url();
      dom::Position dom_pos(selected->flow_chunk.element, false, 0);
      w << xmldoc_->dom()->to_fragment_identifier(dom_pos);
      cp.primary.steps = rc_list<rc_value>::of(w.to_string());
      cp.primary.relpos = layout::ENTERING;
    }
    printf("Layout: %s [%s]\n", flow_name->to_string()->utf8(),
        cp.primary.steps->to_string()->utf8());
    layout::LayoutEngine layout_engine(view_iterator->content_renderer(),
        column_container, builder.get(), y, &shape, this, view_iterator,
        text::get_inline_formatter_factory());
    layout::ChunkPosition rp = layout_engine.layout(cp);
    y = layout_engine.block_size();
    if (selected->flow_chunk.repeated
        && (rp.done() || selected->flow_chunk.exclusive)) {
      repeated.push_back(*selected);
    }
    if (selected->flow_chunk.exclusive) {
      // exclusive, only can have one, remove from the flow even if it did
      // not fit
      it->second.erase(selected);
      break;
    }
    // not exclusive, did not fit completely
    if (!rp.done()) {
      cp = std::move(rp);
      break;
    }
    it->second.erase(selected);
  }
  builder->end_all_elements();
  if (!repeated.empty()) {
    // Must remain sorted in offset order
    for (FlowChunkPosition& rp : it->second) {
      repeated.push_back(std::move(rp));
    }
    it->second = std::move(repeated);
  }
  return y;
}

void ContentLayoutInstance::layout_container(XMLContentRenderer* xmlrend,
    layout::Page* page, pm::PageBoxInstance* box_instance,
    layout::Container* parent, double offset_x, double offset_y,
    std::vector<geom::Polygon>* exclusions) {
  rc_ref<css::CSSValue> enabled =
      box_instance->get_prop(this, rc_qname::atom(ID_enabled));
  if (!enabled.is_null() && enabled->id() != ID_true) {
    return;
  }
  rc_ref<css::CSSValue> wrap_flow =
      box_instance->get_prop(this, rc_qname::atom(ID_wrap_flow));
  bool dont_exclude = !wrap_flow.is_null() && wrap_flow->id() == ID_auto;
  bool dont_apply_exclusions = box_instance->vertical()
      ? box_instance->growing_right() : box_instance->growing_top();
  rc_ref<css::CSSValue> flow_name_val =
      box_instance->get_prop(this, rc_qname::atom(ID_flow_from));
  rc_ref<css::CSSValue> force_fill_val =
      box_instance->get_prop(this, rc_qname::atom(ID_force_fill));
  layout::Container* container = parent->create_child();
  box_instance->prepare_container(this, container);
  offset_x += container->bounds().x1();
  offset_y += container->bounds().y1();
  double computed_block_size = 0;
  bool has_content = false;
  if (flow_name_val.is_null() || !flow_name_val->is<rc_ref<css::CSSIdent>>()) {
    rc_ref<css::CSSValue> content_val =
        box_instance->get_prop(this, rc_qname::atom(ID_content));
    if (!content_val.is_null()) {
      // TODO: handle content
      has_content = true;
    }
    box_instance->finish_container(this, xmldoc_->container()->package(),
        container, page, nullptr, 1);
  } else {
    has_content = true;
    rc_qname flow_name =
        static_cast<css::CSSIdent*>(flow_name_val.ptr())->name();
    double column_count =
        box_instance->get_value(this, rc_qname::atom(ID_column_count));
    double column_gap =
        box_instance->get_value(this, rc_qname::atom(ID_column_gap));
    // Don't query columnWidth when it's not needed, so that width calculation
    // can be delayed for width: auto columns.
    double column_width = column_count > 1 ?
        box_instance->get_prop_as_number(this, rc_qname::atom(ID_column_width))
            : container->bounds().dx();
    rc_list<rc_qname> region_ids = box_instance->get_active_regions(this);
    /*
    var innerShapeVal = boxInstance.getProp(self, "shape-inside");
    var innerShape = adapt.cssprop.toShape(innerShapeVal, 0, 0,
          layoutContainer.width, layoutContainer.height, self);
    */
    layout::Container* target_container = container;
    for (size_t column_index = 0; column_index < column_count; ++column_index) {
      target_container = container;
      double target_offset_x = offset_x;
      double target_offset_y = offset_y;
      if (column_count > 1) {
        layout::Container* column_container = container->create_child();
        if (box_instance->vertical()) {
          double column_y = column_index * (column_width + column_gap);
          column_container->set_bounds(geom::Rectangle::from_xywh(
              0, column_y, container->bounds().dx(), column_width));
          target_offset_y += column_y;
        } else {
          double column_x = column_index * (column_width + column_gap);
          column_container->set_bounds(geom::Rectangle::from_xywh(
              column_x, 0, column_width, container->bounds().dy()));
          target_offset_x += column_x;
        }
        target_container = column_container;
      }
      /*
        if (forceFill && forceFill != adapt.css.ident.auto) {
          region.forceNonfitting = forceFill == adapt.css.ident._true;
        } else {
          // In general, we force non-fitting content. Exception is only for primary flow regions
          // that have exclusions.
          region.forceNonfitting = !self.primaryFlows[flowNameStr] || region.exclusions.length == 0;
        }
        region.innerShape = innerShape;
      */
      css::RelativeSizes sizes = sizes_;
      sizes.box.width = target_container->bounds().dx();
      sizes.box.height = target_container->bounds().dy();
      layout::ViewIterator view_iterator(xmlrend, flow_name, this, sizes,
          nullptr, styler_.get(), region_ids, nullptr, css::element_style(),
          page, nullptr, std::unordered_map<rc_string, adapt::rc_string>());
      double block_size = layout_column(&view_iterator, page, box_instance,
          flow_name, target_container, target_offset_x, target_offset_y,
          (dont_apply_exclusions ? nullptr : exclusions));
      computed_block_size = std::max(computed_block_size, block_size);
    }
    if (box_instance->vertical()) {
      box_instance->set_calculated_width(computed_block_size);
    } else {
      box_instance->set_calculated_height(computed_block_size);
    }
    box_instance->finish_container(this, xmldoc_->container()->package(),
        container, page, target_container, column_count);
  }
  if ((!box_instance->auto_height() || floor(computed_block_size) > 0) &&
      has_content && !dont_exclude) {
    double outer_x = offset_x;
    double outer_y = offset_y;
    double outer_width =
        box_instance->get_value(this, rc_qname::atom(ID_margin_right_edge)) -
        box_instance->get_value(this, rc_qname::atom(ID_margin_left_edge));
    double outer_height =
        box_instance->get_value(this, rc_qname::atom(ID_margin_bottom_edge)) -
        box_instance->get_value(this, rc_qname::atom(ID_margin_top_edge));
    rc_ref<css::CSSValue> outer_shape_val =
        box_instance->get_prop(this, rc_qname::atom(ID_shape_outside));
    printf("Excluding %g %g %g %g\n", outer_x, outer_y, outer_width,
        outer_height);
    geom::Polygon outer_shape = decode_shape(outer_shape_val,
        outer_x, outer_y, outer_width, outer_height, sizes_);
    exclusions->push_back(std::move(outer_shape));
  }
  const rc_list<rc_ref<pm::PageBoxInstance>>& children =
      box_instance->children();
  auto it = children.end();
  while (it != children.begin()) {
    --it;
    layout_container(xmlrend, page, it->ptr(), container, offset_x, offset_y,
        exclusions);
  }
}

std::unique_ptr<layout::Page> ContentLayoutInstance::next_page(
    XMLContentRenderer* xmlrend) {
  std::unique_ptr<layout::Page> page(
      new layout::Page(environment_->width, environment_->height));
  ++page_number_;
  clear_keys(expr::Scope::PAGE_KEY);
  rc_ref<pm::PageMasterInstance> page_master_instance = select_page_master();
  if (page_master_instance.is_null()) {
    return nullptr;
  }
  std::vector<geom::Polygon> exclusions;
  layout_container(xmlrend, page.get(), page_master_instance.ptr(),
      page->root(), 0, 0, &exclusions);
  apply_flow_linger();
  position_.highest_seen_offset = styler_->reached_offset();
  return std::move(page);
}

bool ContentLayoutInstance::has_content(const rc_qname& flow_name) const {
  auto it = position_.flows.find(flow_name);
  if (it == position_.flows.end() || it->second.empty()) {
    return false;
  }
  printf("has_content(%s): %ld <= %ld\n", flow_name->to_string()->utf8(),
      it->second[0].flow_chunk.start_offset, lookup_offset_);
  return it->second[0].flow_chunk.start_offset <= lookup_offset_;
}

bool ContentLayoutInstance::done() const {
  return current_offset() == std::numeric_limits<dom::node_offset_t>::max();
}

void ContentLayoutInstance::encountered_flow_chunk(
    const css::FlowChunk& flow_chunk) {
  position_.flows[flow_chunk.flow_name].push_back(
      FlowChunkPosition(flow_chunk, position_.page));
}


}
}
