#ifndef adapt_css_decode_h
#define adapt_css_decode_h

#include <set>

#include "adapt/base/rc_string.h"
#include "adapt/base/rc_list.h"
#include "adapt/css/value.h"
#include "adapt/css/unit.h"
#include "adapt/expr/expr.h"

namespace adapt {
namespace css {

struct DecodedPaint {
  double red = 0;
  double green = 0;
  double blue = 0;
  double alpha = 1;
};

bool decode_paint(const rc_ref<css::CSSValue>& value, DecodedPaint* paint);

bool decode_length(const rc_ref<css::CSSValue>& value,
    PercentageBase percentage_base, const RelativeSizes& sizes,
    double* length);

bool decode_num(const rc_ref<css::CSSValue>& value, expr::Context* context,
    double* length);

bool decode_font_family(const rc_ref<css::CSSValue>& value,
    rc_list<rc_string>* family);

bool decode_line_height(const rc_ref<css::CSSValue>& value, double em_size,
    double* length);

bool decode_set(const rc_ref<css::CSSValue>& value, std::set<rc_qname>* set);

}
}

#endif
