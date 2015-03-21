#ifndef adapt_text_inline_formatter_h
#define adapt_text_inline_formatter_h

#include <memory>

#include "adapt/dom/dom.h"
#include "adapt/geom/polygon.h"
#include "adapt/layout/nesting.h"
#include "adapt/font/font.h"
#include "adapt/media/media.h"

namespace adapt {
namespace text {

// Interface to "attach" data to DOM nodes based on node offset.
class RenderDataSink {
 public:
  virtual ~RenderDataSink() {}
  virtual void attach(dom::node_offset_t offset, const rc_value& rend_data) = 0;
  virtual void position_replaced(dom::node_offset_t offset,
      double x, double y) = 0;
};


class InlineFormatter {
public:
  virtual ~InlineFormatter() {}
  // y is in local space
  // box is enclosing CSS box dimensions in "global" space.
  // shape is in the "global" space
  virtual void init(const rc_ref<font::Font>& block_font, double line_height,
      const rc_qname& text_align,
      double y, const geom::Rectangle& box, geom::BandedShape* shape) = 0;
  virtual void add_span(const rc_string& text, const rc_ref<font::Font>& font,
      const layout::ComputedElementStyle& style, dom::node_offset_t offset) = 0;
  virtual void add_replaced(double width, double height,
      const layout::ComputedElementStyle& style, dom::node_offset_t offset) = 0;
  virtual float format() = 0;  // returns last position
  virtual size_t break_count() = 0;
  virtual void get_break(size_t index, double* pos,
      dom::node_offset_t* offset) = 0;
  virtual void attach_render_data(RenderDataSink* sink) = 0;
};

class InlineFormatterFactory {
 public:
  virtual ~InlineFormatterFactory() {}
  virtual std::unique_ptr<InlineFormatter> create() = 0;
  virtual void trim_attachment(const rc_value& value,
      dom::node_offset_t offset) = 0;
};

InlineFormatterFactory* get_inline_formatter_factory();

}
}

#endif
