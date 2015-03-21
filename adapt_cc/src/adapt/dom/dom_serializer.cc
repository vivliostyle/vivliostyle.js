#include "adapt/dom/dom_serializer.h"

namespace adapt {

namespace {

void write_element(Writer& writer, const dom::Element& elem,
    std::unordered_map<rc_qname, rc_string>* prefix_map,
    rc_qname current_ns) {
  writer << '<' << elem.qname()->name();
  if (elem.qname()->ns() != current_ns) {
    writer << " xmlns=\"" << elem.qname()->ns() << '"';
    current_ns = elem.qname()->ns();
  }
  for (const rc_map<rc_value>::Entry& e : elem.attributes()) {
    writer << ' ' << e.key << "=\"" << e.value << '"';
  }
  if (elem.children() || !elem.leading_text()->empty()) {
    writer << '>';
    writer << elem.leading_text();
    if (elem.children()) {
      for (const dom::Element& child : *elem.children()) {
        write_element(writer, child, prefix_map, current_ns);
      }
    }
    writer << "</" << elem.qname()->name() << '>';
  } else {
    writer << "/>";
  }
  writer << elem.following_text();
}

}

Writer& operator<< (Writer& writer, const dom::Children::iterator& elem) {
  std::unordered_map<rc_qname, rc_string> prefix_map;
  write_element(writer, *elem, &prefix_map, rc_qname::atom(ID_EMPTY));
  return writer;
}

}
