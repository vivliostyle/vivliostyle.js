#ifndef adapt_layout_position_h
#define adapt_layout_position_h

#include "adapt/base/rc_value.h"
#include "adapt/base/rc_list.h"
#include "adapt/dom/dom.h"

namespace adapt {

namespace doc {

class XMLContentDocument;

}

namespace layout {

enum PositionRelativeToElement {
  ENTERING,  // at the element, but outside
  ENTERED,   // just inside the element
  EXITING,   // still inside the element, but about to exit
  EXITED     // just after exiting the element
};

// Source position
struct NodePosition {
  dom::node_offset_t offset = 0;  // offset in node
  dom::node_offset_t doc_offset = 0;  // offset in the document
  PositionRelativeToElement relpos = EXITED;  // "done" state
  // Encoded DOM path, outermost element first. Encoding is as follows:
  //   rc_integer - element child index
  //   rc_string - reference to the shadow tree in an external document
  //   rc_qname - pseudoelement, including shadow:content
  rc_list<rc_value> steps = rc_list<rc_value>::empty();

  bool done() const { return steps->empty() && relpos == EXITED; }
};

struct ChunkPosition {
  NodePosition primary;
  std::vector<NodePosition> footnotes;
  std::vector<NodePosition> floats;

  bool done() const {
    return primary.done() && footnotes.empty() && floats.empty();
  }
};

}
}

#endif
