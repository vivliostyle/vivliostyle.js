#ifndef adapt_doc_content_layout_h
#define adapt_doc_content_layout_h

#include <map>
#include <memory>
#include <vector>

#include "adapt/base/rc_value.h"
#include "adapt/expr/expr.h"
#include "adapt/css/cascade.h"
#include "adapt/css/styler.h"
#include "adapt/css/unit.h"
#include "adapt/pm/page_box.h"
#include "adapt/layout/position.h"
#include "adapt/layout/page.h"
#include "adapt/doc/environment.h"
#include "adapt/dom/dom.h"
#include "adapt/geom/polygon.h"

namespace adapt {

namespace layout {

class ViewIterator;

}

namespace doc {

class XMLContentDocument;
class XMLContentRenderer;
class ContentLayoutInstance;

struct FlowChunkPosition {
  FlowChunkPosition(const css::FlowChunk& fc, int pg)
      : flow_chunk(fc), start_page(pg) {

  }

  css::FlowChunk flow_chunk;
  layout::ChunkPosition chunk_position;
  int start_page = 0;
};

struct LayoutPosition {
  int page = 0;  // One-based, incremented before building a page.
  dom::node_offset_t highest_seen_offset = 0;  // flows are built up to here
  std::map<rc_qname, std::vector<FlowChunkPosition>> flows;
};

class ContentLayout : public RefCountedObject {
  friend class ContentLayoutInstance;
 public:
  ContentLayout(const rc_ref<expr::Scope>& root_scope,
      const rc_ref<css::Cascade>& cascade,
      const rc_list<rc_ref<pm::PageMaster>>& page_masters);

  const rc_ref<css::Cascade>& cascade() const { return cascade_; }

 private:
  rc_ref<expr::Scope> root_scope_;
  rc_ref<css::Cascade> cascade_;
  rc_list<rc_ref<pm::PageMaster>> page_masters_;
};

class ContentLayoutInstance : public expr::Context, css::FlowSink {
 public:
  ContentLayoutInstance(const rc_ref<ContentLayout>& content_layout,
      const rc_ref<XMLContentDocument>& xmldoc, const Environment& environment);

  void init();

  virtual double query_unit_size(const rc_qname& unit) override;
  virtual rc_value query_context_data(const rc_qname& key) override;

  bool done() const;
  std::unique_ptr<layout::Page> next_page(XMLContentRenderer* xmlrend);

  bool has_content(const rc_qname& flow_name) const;
  int page_number() const { return page_number_; }

  css::CascadeStyler* styler() const { return styler_.get(); }

  // implement css::FlowSink
  virtual void encountered_flow_chunk(const css::FlowChunk& flowchunk) override;

 private:
  rc_ref<pm::PageMasterInstance> select_page_master();
  dom::node_offset_t current_offset() const;
  void init_flow_linger();
  void apply_flow_linger();
  void layout_container(XMLContentRenderer* xmlrend, layout::Page* page,
      pm::PageBoxInstance* page_box, layout::Container* container,
      double offset_x, double offset_y, std::vector<geom::Polygon>* exclusions);
  double layout_column(layout::ViewIterator* view_iterator, layout::Page* page,
      pm::PageBoxInstance* box_instance, const rc_qname& flow_name,
      layout::Container* column_container, double offset_x, double offset_y,
      std::vector<geom::Polygon>* exclusions);
  std::vector<FlowChunkPosition>::iterator select_chunk(
      std::vector<FlowChunkPosition>& chunks);

  rc_ref<ContentLayout> content_layout_;
  rc_ref<XMLContentDocument> xmldoc_;
  rc_qname lang_;
  int page_number_ = 0;
  rc_list<rc_ref<pm::PageMasterInstance>> page_master_instances_;
  std::unique_ptr<css::CascadeStyler> styler_;
  LayoutPosition position_;
  dom::node_offset_t lookup_offset_ = 0;
  rc_ref<Environment> environment_;
  css::RelativeSizes sizes_;
  std::unordered_set<rc_qname> primary_flows_;
};

rc_ref<expr::Scope> create_page_scope(
    const rc_ref<expr::Scope>& parent);


}
}

#endif
