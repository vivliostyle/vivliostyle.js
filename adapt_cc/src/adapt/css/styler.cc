#include "adapt/css/styler.h"

#include <limits>

#include "adapt/css/unit.h"
#include "adapt/css/decode.h"

namespace adapt {
namespace css {

dom::node_offset_t SlipMap::max_fixed() {
  if (map_.empty()) {
    return 0;
  }
  return map_.back().end_fixed;
}

dom::node_offset_t SlipMap::max_slipped() {
  if (map_.empty()) {
    return 0;
  }
  return map_.back().end_slipped;
}

void SlipMap::add_stuck_range(dom::node_offset_t end_fixed) {
  if (map_.empty()) {
    map_.push_back(Range {end_fixed, end_fixed, end_fixed});
  } else {
    Range& range = map_.back();
    dom::node_offset_t end_slipped =
        range.end_slipped + end_fixed - range.end_fixed;
    if (range.end_fixed == range.end_stuck_fixed) {
      range.end_fixed = end_fixed;
      range.end_stuck_fixed = end_fixed;
      range.end_slipped = end_slipped;
    } else {
      map_.push_back(Range {end_fixed, end_fixed, end_slipped});
    }
  }
}

void SlipMap::add_slipped_range(dom::node_offset_t end_fixed) {
  if (map_.empty()) {
    map_.push_back(Range {end_fixed, 0, 0} );
  } else {
    map_.back().end_fixed = end_fixed;
  }
}

dom::node_offset_t SlipMap::slipped_by_fixed(dom::node_offset_t fixed) {
  assert(fixed <= max_fixed());
  Range r {0, fixed, 0};
  auto it = std::lower_bound(map_.begin(), map_.end(), r, CompareFixed());
  // Lower bound gives us first element which is greater or equal
  assert (it->end_fixed >= fixed);
  return it->end_slipped -
      std::max(static_cast<dom::node_offset_t>(0), it->end_stuck_fixed - fixed);
}

// Smallest fixed for a given slipped.
dom::node_offset_t SlipMap::fixed_by_slipped(dom::node_offset_t slipped) {
  assert(slipped <= max_slipped());
  Range r {0, 0, slipped};
  auto it = std::lower_bound(map_.begin(), map_.end(), r, CompareSlipped());
  // Lower bound gives us first element which is greater or equal
  assert (it->end_slipped >= slipped);
  return it->end_stuck_fixed - (it->end_slipped - slipped);
}



CascadeStyler::CascadeStyler(dom::DOM* xmldoc, Cascade* cascade,
    expr::Context* context, const std::unordered_set<rc_qname>& primary_flows)
    : xmldoc_(xmldoc), cascade_(cascade), context_(context),
      primary_flows_(primary_flows), last_offset_(0), last_(nullptr, nullptr),
      cascade_instance_(new CascadeInstance(cascade, context, xmldoc->lang())),
      flow_sink_(nullptr), in_primary_flow_(true) {}

bool CascadeStyler::done() const {
  return last_ == dom::DOM::iterator::null_iterator() && last_offset_ != 0;
}

dom::node_offset_t CascadeStyler::style_until(dom::node_offset_t start_offset,
    dom::node_offset_t window) {
  const dom::node_offset_t npos = static_cast<dom::node_offset_t>(-1);
  dom::node_offset_t target_slipped = npos;
  if (start_offset + window <= last_offset_ || done()) {
    // check if desired offset is already reached
    target_slipped = slip_map_.slipped_by_fixed(start_offset) + window;
    if (target_slipped <= slip_map_.max_slipped()) {
      // got to the desired point
      return slip_map_.fixed_by_slipped(target_slipped);
    } else if (done()) {
      return slip_map_.max_fixed();
    }
  }
  while (true) {
    if (last_offset_ == 0) {
      last_ = xmldoc_->root();
    } else if (!last_.has_children()) {
      while (true) {
        style_map_[last_->text_offset()] =
            cascade_instance_->pop_element(last_);
        in_primary_flow_ = in_primary_flow_stack_.top();
        in_primary_flow_stack_.pop();
        dom::DOM::iterator next = last_ + 1;
        if (next != last_.parent_end()) {
          last_ = next;
          break;
        }
        last_ = last_.parent();
        if (last_ == xmldoc_->root()) {
          // done
          last_ = dom::DOM::iterator::null_iterator();
          if (start_offset + window < last_offset_) {
            if (target_slipped == npos) {
              target_slipped =
                  slip_map_.slipped_by_fixed(start_offset) + window;
            }
            if (target_slipped <= slip_map_.max_slipped()) {
              // got to the desired point
              return slip_map_.fixed_by_slipped(target_slipped);
            }
          }
          return slip_map_.max_fixed();
        }
      }
    } else {
      last_ = last_.begin();
    }
    last_offset_ = last_->text_offset();
    if (in_primary_flow_) {
      slip_map_.add_stuck_range(last_offset_);
    } else {
      slip_map_.add_slipped_range(last_offset_);
    }
    element_style style = cascade_instance_->push_element(last_);
    in_primary_flow_stack_.push(in_primary_flow_);
    style_map_[last_offset_] = style;
    rc_ref<CascadeValue> flow_name_cv = style[rc_qname::atom(ID_flow_into)];
    if (!flow_name_cv.is_null()) {
      rc_ref<CSSValue> flow_name_v = flow_name_cv->evaluate(context_,
          rc_qname::atom(ID_flow_into));
      if (flow_name_v->id()) {
        rc_qname flow_name = static_cast<CSSIdent*>(flow_name_v.ptr())->name();
        encountered_flow_element(flow_name, style, last_, last_offset_);
        in_primary_flow_ =
            primary_flows_.find(flow_name) != primary_flows_.end();
      }
    }
    if (in_primary_flow_) {
      rc_ref<CascadeValue> display = style[rc_qname::atom(ID_display)];
      if (!display.is_null()) {
        if (display->evaluate(context_, rc_qname::atom(ID_display))->id()
            == ID_none) {
          in_primary_flow_ = false;
        }
      }
    }
    last_offset_++;
    if (in_primary_flow_) {
      slip_map_.add_stuck_range(last_offset_);
    } else {
      slip_map_.add_slipped_range(last_offset_);
    }
    if (start_offset + window <= last_offset_) {
      if (target_slipped == npos) {
        target_slipped = slip_map_.slipped_by_fixed(start_offset) + window;
      }
      if (target_slipped <= slip_map_.max_slipped()) {
        // got to the desired point
        return slip_map_.fixed_by_slipped(target_slipped);
      }
    }
  }
  // Not reached
}

void CascadeStyler::style_until_flow_is_reached(const rc_qname& flow_name) {
  flow_to_reach_ = flow_name;
  dom::node_offset_t offset = last_offset_;
  while (!flow_to_reach_->empty() && !done()) {
    offset += 5000;
    style_until(offset, 0);
  }
}

rc_string CascadeStyler::base_url(const dom::DOM::iterator& element) {
  // TODO: xml:base support
  return xmldoc_->document_url();
}

element_style CascadeStyler::get_style(const dom::DOM::iterator& element,
    bool deep) {
  dom::node_offset_t offset = deep
      ? xmldoc_->offset_by_position(dom::Position(element, 0, true))
      : element->text_offset();
  if (last_offset_ <= offset) {
    style_until(offset, 0);
  }
  return style_map_[element->text_offset()];
}

void CascadeStyler::encountered_flow_element(const rc_qname& flow_name,
    const element_style& style, const dom::DOM::iterator& elem,
    dom::node_offset_t start_offset) {
  int priority = 0;
  int linger = -1;
  bool exclusive = false;
  bool repeated = false;
  bool last = false;
  rc_ref<CascadeValue> options_cv = style[rc_qname::atom(ID_flow_options)];
  if (!options_cv.is_null()) {
    std::set<rc_qname> options;
    if (css::decode_set(options_cv->evaluate(context_,
        rc_qname::atom(ID_flow_options)), &options)) {
      exclusive = options.find(rc_qname::atom(ID_exclusive)) != options.end();
      repeated = options.find(rc_qname::atom(ID_static)) != options.end();
      last = options.find(rc_qname::atom(ID_last)) != options.end();
    }
  }
  rc_ref<CascadeValue> linger_cv = style[rc_qname::atom(ID_flow_linger)];
  if (!linger_cv.is_null()) {
    double num;
    if (css::decode_num(linger_cv->evaluate(context_,
        rc_qname::atom(ID_flow_linger)), context_, &num)) {
      if (num == floor(num)) {
        linger = static_cast<int>(num);
      }
    }
  }
  rc_ref<CascadeValue> priority_cv = style[rc_qname::atom(ID_flow_priority)];
  if (!priority_cv.is_null()) {
    double num;
    if (css::decode_num(linger_cv->evaluate(context_,
        rc_qname::atom(ID_flow_priority)), context_, &num)) {
      if (num == floor(num)) {
        priority = static_cast<int>(num);
      }
    }
  }
  flow_chunks_.push_back(FlowChunk(flow_name, elem, start_offset, priority,
      linger, exclusive, repeated, last));
  if (flow_to_reach_.ptr() == flow_name.ptr()) {
    flow_to_reach_ = rc_qname();
  }
  if (flow_sink_) {
    flow_sink_->encountered_flow_chunk(flow_chunks_.back());
  }
}

void CascadeStyler::reset_flow_chunk_stream(FlowSink* flow_sink) {
  flow_sink_ = flow_sink;
  for (const FlowChunk& flow_chunk : flow_chunks_) {
    flow_sink->encountered_flow_chunk(flow_chunk);
  }
}


}
}
