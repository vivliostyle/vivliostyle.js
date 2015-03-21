#ifndef adapt_dom_dom_serializer_h
#define adapt_dom_dom_serializer_h

#include "adapt/dom/dom_serializer.h"

#include <unordered_map>

#include "adapt/base/writer.h"
#include "adapt/dom/dom.h"

namespace adapt {

Writer& operator<< (Writer& writer, const dom::DOM::iterator& elem);
  
}


#endif
