#ifndef adapt_layout_engine_h
#define adapt_layout_engine_h

#include "adapt/css/styler.h"
#include "adapt/layout/page.h"
#include "adapt/layout/position.h"
#include "adapt/layout/view_iterator.h"
#include "adapt/layout/nesting.h"
#include "adapt/text/inline_formatter.h"
#include "adapt/load/package.h"
#include "adapt/media/media.h"
#include "adapt/doc/container.h"

namespace adapt {
namespace layout {

class LayoutEngine {
 public:
  LayoutEngine(doc::XMLContentRenderer* xmlrend, Container* container,
      dom::Builder* builder, double edge_y, geom::BandedShape* shape,
      expr::Context* context, ViewIterator* view_iterator,
      text::InlineFormatterFactory* inline_formatter_factory);

  ChunkPosition layout(const ChunkPosition& position);

  void enter_block(BlockProperties* props);  // after entering
  void exit_block(BlockProperties* props);  // before exit

  double block_size() const {
    return edge_y_absolute_;
  }

 private:
  struct PossibleBreak {
    int score;
    dom::node_offset_t offset;
    double position;
  };

  static const int NO_BREAK = 0x7FFFFFFF;
  
  void open_all_views(const NodePosition& primary);
  void find_acceptable_break(const rc_ref<NodeContext>& initial_node_context,
      dom::node_offset_t initial_offset);
  void process();
  bool is_breakable();
  void start_element();  // start render tree element
  void end_element();  // end render tree element
  void characters();  // render tree text
  void position_leading_content_edge();
  void position_trailing_content_edge();
  void begin_content();
  void end_content();
  double length_value(const layout::ComputedElementStyle& style, int propid,
      double default_value = 0.0);
  void apply_edge_margin(double margin);
  void apply_edge_break(const rc_qname& break_prop);

  bool ignorable_text_node(const rc_string& text);

  int line_break_score();
  int edge_break_score();

  void clear_attachments(dom::node_offset_t offset);

  bool is_overflown(double abs_pos) const {
    return abs_pos > container_->bounds().dy();
  }

  ChunkPosition make_chunk_position();

  ViewIterator * view_iterator_;
  doc::XMLContentRenderer* xmlrend_;
  text::InlineFormatterFactory* inline_formatter_factory_;
  dom::Builder* builder_;
  std::unique_ptr<text::InlineFormatter> inline_formatter_;
  Container* container_;
  geom::BandedShape* shape_;
  double edge_y_;
  double edge_y_absolute_;
  double edge_y_inline_;
  double edge_margin_pos_;
  double edge_margin_neg_;
  bool overflown_;
  PossibleBreak best_break_;
  PossibleBreak tenative_edge_break_;
  int break_type_id_;
  int break_at_edge_id_;
};

}
}

#endif
