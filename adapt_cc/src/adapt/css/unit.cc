#include "adapt/css/unit.h"

namespace adapt {
namespace css {

bool get_length_unit_size(const rc_qname& unit, PercentageBase percentage_base,
    const RelativeSizes& sizes, double* length) {
  switch (unit->id()) {
    case ID_percent :
      switch (percentage_base) {
        case WIDTH_BASED:
          *length = sizes.box.width / 100;
          break;
        case HEIGHT_BASED:
          *length = sizes.box.height / 100;
          break;
        case EM_BASED:
          *length = sizes.font.em_size / 100;
          break;
      }
      return true;
    case ID_em :
      *length = sizes.font.em_size;
      return true;
    case ID_ex :
      *length = sizes.font.ex_size;
      return true;
    case ID_ch :
      *length = sizes.font.ch_size;
      return true;
    case ID_rem :
      *length = sizes.viewport.rem_size;
      return true;
    case ID_vh :
      *length = sizes.viewport.height / 100;
      return true;
    case ID_vw :
      *length = sizes.viewport.width / 100;
      return true;
    case ID_vmin :
      *length = std::min(sizes.viewport.height, sizes.viewport.width)  / 100;
      return true;
    case ID_vmax :
      *length = std::max(sizes.viewport.height, sizes.viewport.width)  / 100;
      return true;
    case ID_cm :
      *length = sizes.viewport.in_size / 2.54;
      return true;
    case ID_mm :
      *length = sizes.viewport.in_size / 25.4;
      return true;
    case ID_in :
      *length = sizes.viewport.in_size;
      return true;
    case ID_px :
      *length = 1;
      return true;
    case ID_pt :
      *length = sizes.viewport.in_size / 72;
      return true;
    case ID_pc :
      *length = sizes.viewport.in_size / 6;
      return true;
  }
  return false;
}

PercentageBase percentage_base_by_property(const rc_qname& prop) {
  static std::unordered_map<int, PercentageBase> base_map {
    {ID_font_size, EM_BASED},
    {ID_height, HEIGHT_BASED}
  };
  auto it = base_map.find(prop->id());
  if (it == base_map.end()) {
    return WIDTH_BASED;
  }
  return it->second;
}

UnitResolver::UnitResolver(PercentageBase percentage_base,
    const RelativeSizes& sizes)
        : percentage_base_(percentage_base), sizes_(sizes) {}

rc_ref<CSSValue> UnitResolver::visit_numeric(CSSNumeric* value) {
  if (value->unit()->id() == ID_px) {
    return value;
  }
  double length;
  if (get_length_unit_size(value->unit(), percentage_base_, sizes_, &length)) {
    return new CSSNumeric(length * value->num(), rc_qname::atom(ID_px));
  }
  return value;
}

}
}

