#ifndef adapt_font_font_h
#define adapt_font_font_h

#include "adapt/base/rc_value.h"
#include "adapt/base/rc_list.h"

namespace adapt {
namespace font {

struct Font : public RefCountedObject {
  rc_value platform_font;
  double em_size;
  double ex_size;
  double ch_size;
  double ascent;
  double descent;
};

rc_ref<Font> lookup_font(const rc_list<rc_string>& family, int style,
    int weight, float size);

}
}

#endif
