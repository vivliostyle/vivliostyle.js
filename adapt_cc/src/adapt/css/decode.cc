#include "adapt/css/decode.h"

#include <string>

#include "adapt/base/rc_string.h"


namespace adapt {
namespace css {

namespace {

class PaintDecoder : public CSSVisitor {
 public:
  PaintDecoder() : components_ {0, 0, 0, 1}, index_(-1) {}

  virtual rc_ref<CSSValue> visit_numeric(CSSNumeric* value) {
    if (index < 0 || index_ >= 4 || value->unit()->id() != ID_percent) {
      return CSSVisitor::visit_numeric(value);
    }
    components_[index_] = value->num() / 100.0f;
    ++index_;
    return value;
  }

  virtual rc_ref<CSSValue> visit_number(CSSNumber* value) {
    if (index_ < 0 || index_ >= 4) {
      return CSSVisitor::visit_number(value);
    }
    float scale = index_ == 3 ? 1.0f : 255.0f;
    components_[index_] = value->num() / scale;
    ++index_;
    return value;
  }

  virtual rc_ref<CSSValue> visit_color(CSSColor* value) override {
    unsigned int rgb = value->rgb();
    components_[0] = ((rgb >> 16) & 0xFF) / 255.0f;
    components_[1] = ((rgb >> 8) & 0xFF) / 255.0f;
    components_[2] = (rgb & 0xFF) / 255.0f;
    return value;
  }

  virtual rc_ref<CSSValue> visit_function(CSSFunction* value) override {
    if (index_ >= 0) {
      return CSSVisitor::visit_function(value);
    }
    switch (value->name()->id()) {
      case ID_rgb :
      case ID_hsl :
        if (value->args()->size() != 3) {
          return CSSVisitor::visit_function(value);
        }
        break;
      case ID_rgba :
      case ID_hsla :
        if (value->args()->size() != 4) {
          return CSSVisitor::visit_function(value);
        }
        break;
      default:
        return CSSVisitor::visit_function(value);
    }
    index_ = 0;
    for (const rc_ref<CSSValue>& arg : value->args()) {
      arg->visit(this);
    }
    index_ = -1;
    switch (value->name()->id()) {
      case ID_hsl :
      case ID_hsla :
        hsl_to_rgb();
        break;
    }
    return value;
  }

  static double hue_to_rgb_component(double p, double q, double h6){
    h6 = h6 - 6 * floor(h6 / 6);
    if (h6 < 1) {
      return p + (q - p) * h6;
    }
    if(h6 < 3) {
      return q;
    }
    if(h6 < 4) {
      return p + (q - p) * (4 - h6);
    }
    return p;
  }
  
  void hsl_to_rgb() {
    double h6 = (255.0 * components_[0]) / 60.0;
    double s = components_[1];
    double l = components_[2];
    double q = l < 0.5 ? l * (1 + s) : s + l * (1 - s);
    double p = 2 * l - q;
    components_[0] = hue_to_rgb_component(p, q, h6 + 2);
    components_[1] = hue_to_rgb_component(p, q, h6);
    components_[2] = hue_to_rgb_component(p, q, h6 - 2);
  }

  int index_;
  double components_[4];
};
  
}

bool decode_paint(const rc_ref<css::CSSValue>& value, DecodedPaint* paint) {
  PaintDecoder decoder;
  if (value.is_null()) {
    return true;
  }
  value->visit(&decoder);
  if (decoder.error()) {
    return false;
  }
  paint->red = decoder.components_[0];
  paint->green = decoder.components_[1];
  paint->blue = decoder.components_[2];
  paint->alpha = decoder.components_[3];
  return true;
}

bool decode_length(const rc_ref<css::CSSValue>& value,
    PercentageBase percentage_base, const RelativeSizes& sizes,
    double* length) {
  if (value.is_null() || !value->is<rc_ref<CSSNumeric>>()) {
    return false;
  }
  CSSNumeric* numeric = static_cast<CSSNumeric*>(value.ptr());
  if (!get_length_unit_size(numeric->unit(), percentage_base, sizes, length)) {
    return false;
  }
  *length *= numeric->num();
  return true;
}

bool decode_num(const rc_ref<css::CSSValue>& value, expr::Context* context,
    double* length) {
  if (value.is_null()) {
    return false;
  }
  if (value->is<rc_ref<CSSNumber>>()) {
    CSSNumber* number = static_cast<CSSNumber*>(value.ptr());
    *length = number->num();
    return true;
  }
  if (value->is<rc_ref<CSSNumeric>>()) {
    CSSNumeric* numeric = static_cast<CSSNumeric*>(value.ptr());
    *length = numeric->num() * context->query_unit_size(numeric->unit());
    return true;
  }
  return false;
}

bool decode_line_height(const rc_ref<css::CSSValue>& value, double em_size,
    double* length) {
  if (value.is_null()) {
    return false;
  }
  if (value->is<rc_ref<CSSNumber>>()) {
    CSSNumber* number = static_cast<CSSNumber*>(value.ptr());
    *length = number->num() * em_size;
    return true;
  }
  if (value->is<rc_ref<CSSNumeric>>()) {
    CSSNumeric* numeric = static_cast<CSSNumeric*>(value.ptr());
    // should be computed to pixels at this point
    assert (numeric->unit()->id() == ID_px);
    *length = numeric->num();
    return true;
  }
  return false;
}

namespace {

class FontFamilyDecoder : public CSSVisitor {
public:
  FontFamilyDecoder() : quoted(false) {}

  virtual rc_ref<CSSValue> visit_ident(CSSIdent* value) override {
    if (!buffer.empty()) {
      if (!quoted) {
        error_ = true;
        return value;
      }
      buffer.append(" ");
    }
    quoted = true;
    buffer.append(value->name()->name()->utf8());
    return value;
  }

  virtual rc_ref<CSSValue> visit_string(CSSString* value) override {
    if (!buffer.empty() || quoted) {
      error_ = true;
    } else {
      buffer.append(value->str()->utf8());
    }
    return value;
  }

  virtual rc_ref<CSSValue> visit_space_list(CSSSpaceList* value) override {
    return filter_space_list(value);
  }

  virtual rc_ref<CSSValue> visit_comma_list(CSSCommaList* value) override {
    for (const rc_ref<CSSValue>& item : value->list()) {
      quoted = false;
      item->visit(this);
      finish_item();
    }
    return value;
  }

  void finish_item() {
    if (!buffer.empty()) {
      list.push_back(rc_string(buffer.c_str(), buffer.size()));
      buffer.clear();
    }
  }

  bool quoted;
  std::vector<rc_string> list;
  std::string buffer;
};

}

bool decode_font_family(const rc_ref<css::CSSValue>& value,
    rc_list<rc_string>* family) {
  if (value.is_null()) {
    return false;
  }
  FontFamilyDecoder decoder;
  value->visit(&decoder);
  if (decoder.error()) {
    return false;
  }
  decoder.finish_item();
  *family = rc_list<rc_string>(decoder.list);
  return true;
}

namespace {

class NameSetDecoder : public CSSVisitor {
 public:
  NameSetDecoder() {}

  virtual rc_ref<CSSValue> visit_ident(CSSIdent* value) override {
    set.insert(value->name());
    return value;
  }

  virtual rc_ref<CSSValue> visit_comma_list(CSSCommaList* value) override {
    for (const rc_ref<CSSValue>& item : value->list()) {
      item->visit(this);
    }
    return value;
  }

  std::set<rc_qname> set;
};
    
}


bool decode_set(const rc_ref<css::CSSValue>& value, std::set<rc_qname>* set) {
  if (value.is_null()) {
    return false;
  }
  NameSetDecoder decoder;
  value->visit(&decoder);
  if (decoder.error()) {
    return false;
  }
  *set = std::move(decoder.set);
  return true;
}




}
}


