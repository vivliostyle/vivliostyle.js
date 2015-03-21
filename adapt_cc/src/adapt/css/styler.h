#ifndef adapt_css_styler_h
#define adapt_css_styler_h

#include <set>
#include <stack>
#include <unordered_map>

#include "adapt/base/rc_string.h"
#include "adapt/css/unit.h"
#include "adapt/css/cascade.h"
#include "adapt/dom/dom.h"
#include "adapt/expr/expr.h"

namespace adapt {
namespace css {

// Object that assigns styles to elements.
class Styler {
 public:
  virtual ~Styler() {}
  virtual rc_string base_url(const dom::DOM::iterator& element) = 0;
  virtual element_style get_style(const dom::DOM::iterator& element,
      bool deep) = 0;
};

struct FlowChunk {
  FlowChunk(const rc_qname& fn, dom::DOM::iterator e, dom::node_offset_t so,
      int pr, int li, bool exc, bool rep, bool lst)
          : flow_name(fn), element(e), start_offset(so), priority(pr),
            linger(li), exclusive(exc), repeated(rep), last(lst) {}

  rc_qname flow_name;
  dom::DOM::iterator element;
  dom::node_offset_t start_offset;
  int priority;
  int linger;
  bool exclusive;
  bool repeated;
  bool last;
};

class FlowSink {
 public:
  virtual void encountered_flow_chunk(const FlowChunk& flow_chunk) = 0;
};

class SlipMap {
 public:
  
  dom::node_offset_t max_fixed();
  dom::node_offset_t max_slipped();
  void add_stuck_range(dom::node_offset_t end_fixed);
  void add_slipped_range(dom::node_offset_t end_fixed);
  dom::node_offset_t slipped_by_fixed(dom::node_offset_t fixed);

  // Smallest fixed for a given slipped.
  dom::node_offset_t fixed_by_slipped(dom::node_offset_t slipped);
 private:
  struct Range {
    dom::node_offset_t end_stuck_fixed;
    dom::node_offset_t end_fixed;
    dom::node_offset_t end_slipped;
  };

  struct CompareFixed {
    bool operator() (const Range& r1, const Range& r2) const {
      return r1.end_fixed < r2.end_fixed;
    }
  };

  struct CompareSlipped {
    bool operator() (const Range& r1, const Range& r2) const {
      return r1.end_slipped < r2.end_slipped;
    }
  };

  std::vector<Range> map_;
};

class CascadeStyler : public Styler {
 public:
  CascadeStyler(dom::DOM* xmldoc, Cascade* cascade, expr::Context* context,
      const std::unordered_set<rc_qname>& primary_flows);

  dom::node_offset_t style_until(dom::node_offset_t start_offset,
      dom::node_offset_t window);
  void style_until_flow_is_reached(const rc_qname& flow_name);

  rc_string base_url(const dom::DOM::iterator& element) override;

  element_style get_style(const dom::DOM::iterator& element,
      bool deep) override;

  void reset_flow_chunk_stream(FlowSink* flow_sink);

  dom::node_offset_t reached_offset() const {
    return last_offset_;
  }

  bool done() const;

 private:
  void encountered_flow_element(const rc_qname& flow_name,
      const element_style& style, const dom::DOM::iterator& elem,
      dom::node_offset_t start_offset);

  dom::DOM* xmldoc_;
  dom::DOM::iterator last_;
  dom::node_offset_t last_offset_;
  bool in_primary_flow_;
  std::stack<bool> in_primary_flow_stack_;
  Cascade* cascade_;
  rc_ref<expr::Scope> scope_;
  expr::Context* context_;
  std::unordered_set<rc_qname> primary_flows_;
  std::unordered_map<dom::node_offset_t, element_style> style_map_;
  std::unique_ptr<CascadeInstance> cascade_instance_;
  FlowSink* flow_sink_;
  std::vector<FlowChunk> flow_chunks_;
  rc_qname flow_to_reach_;
  SlipMap slip_map_;
};

}
}


#endif
