#ifndef adapt_css_unit_h
#define adapt_css_unit_h

#include "adapt/css/value.h"

namespace adapt {
namespace css {

enum PercentageBase {
  WIDTH_BASED,
  HEIGHT_BASED,
  EM_BASED
};

// Environment to resolve unit sizes
struct BoxRelativeSizes {
  double width;
  double height;
};

struct FontRelativeSizes {
  double em_size;
  double ex_size;
  double ch_size;
  int weight;
};

struct ViewportRelativeSizes {
  double width;
  double height;
  double rem_size;
  double in_size;
};

struct RelativeSizes {
  BoxRelativeSizes box;
  FontRelativeSizes font;
  ViewportRelativeSizes viewport;
};

bool get_length_unit_size(const rc_qname& unit, PercentageBase percentage_base,
    const RelativeSizes& sizes, double* length);

PercentageBase percentage_base_by_property(const rc_qname& prop);

class UnitResolver : public CSSVisitor {
 public:
  UnitResolver(PercentageBase percentage_base, const RelativeSizes& sizes);
  virtual ~UnitResolver() {}
  virtual rc_ref<CSSValue> visit_numeric(CSSNumeric* value) override;
 protected:
  PercentageBase percentage_base_;
  const RelativeSizes& sizes_;
};

}
}

#endif
