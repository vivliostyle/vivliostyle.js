#include "adapt/layout/page.h"

#include "adapt/load/package.h"
#include "adapt/css/eval.h"

namespace adapt {
namespace layout {

Container::Container(const geom::Rectangle& bounds)
    : bounds_(bounds) {}

Container::~Container() {
  attachments_.clear();
}


void Container::reset_content() {
  content_.reset(new dom::DOM(rc_string()));
}

Page::Page(float width, float height)
    : root_(geom::Rectangle::from_xywh(0, 0, width, height)) {
}

//-------------------------------------------------------

const char* BlockProperties::type_tag() {
  return "BlockProperties";
}

bool BlockProperties::instance_of(const char* type_tag) const {
  if (type_tag == BlockProperties::type_tag()) {
    return true;
  }
  return RefCountedObject::instance_of(type_tag);
}

//-------------------------------------------------------

const char* InlineProperties::type_tag() {
  return "InlineProperties";
}

bool InlineProperties::instance_of(const char* type_tag) const {
  if (type_tag == InlineProperties::type_tag()) {
    return true;
  }
  return RefCountedObject::instance_of(type_tag);
}

namespace {

double get_computed_box_dimension(const rc_ref<css::CSSValue>& v,
    unsigned int flag, unsigned int* mask) {
  if (v->is<rc_ref<css::CSSNumeric>>()) {
    css::CSSNumeric* num = static_cast<css::CSSNumeric*>(v.ptr());
    assert(num->unit()->id() == ID_px);  // should be resolved at this point
    *mask |= flag;
    return num->num();
  }
  return 0;
}

double get_box_dimension(expr::Context* cx, const rc_qname& name,
    rc_ref<css::CSSValue> v, unsigned int flag, unsigned int* mask) {
  v = css::evaluate(cx, v, name);
  return get_computed_box_dimension(v, flag, mask);
}

double get_margin_dimension(expr::Context* cx, const rc_qname& name,
    rc_ref<css::CSSValue> v, unsigned int flag, unsigned int* mask) {
  assert(Box::SPECIFIED_MARGIN_BOTTOM << 4 == Box::AUTO_MARGIN_BOTTOM);
  assert(Box::SPECIFIED_MARGIN_TOP << 4 == Box::AUTO_MARGIN_TOP);
  assert(Box::SPECIFIED_MARGIN_LEFT << 4 == Box::AUTO_MARGIN_LEFT);
  assert(Box::SPECIFIED_MARGIN_RIGHT << 4 == Box::AUTO_MARGIN_RIGHT);
  v = css::evaluate(cx, v, name);
  if (v->id() == ID_auto) {
    *mask |= flag | (flag << 4);
    return 0;
  }
  return get_computed_box_dimension(v, flag, mask);
}

void ensure_border(rc_ref<Border>* border) {
  if (border->is_null()) {
    *border = new Border();
  }
}

void fill_background_image(load::Package* package,
    Background* bg, const rc_ref<css::CSSValue>& v) {
  if (v->is<rc_ref<css::CSSUrl>>()) {
    const rc_string& url = static_cast<css::CSSUrl*>(v.ptr())->url();
    if (url->starts_with(package->root_url())) {
      rc_string path = url->substr(package->root_url()->length());
      rc_binary data = rc_binary(package->load(path));
      if (data->length() > 0) {
        bg->media = media::load(data, rc_string::empty_string());
      }
    }
  }
}

void fill_background(load::Package* package,
    rc_list<rc_ref<Background>>* bg_list, const rc_ref<css::CSSValue>& v) {
  if (v->is<rc_ref<css::CSSCommaList>>()) {
    const rc_list<rc_ref<css::CSSValue>> list =
    static_cast<css::CSSCommaList*>(v.ptr())->list();
    if ((*bg_list)->size() < list->size()) {
      rc_ref<Background>* bgs = new rc_ref<Background>[list->size()];
      for (size_t i = 0; i < list->size(); ++i) {
        if (bg_list->is_null() || i >= (*bg_list)->size()) {
          bgs[i] = new Background();
        } else {
          bgs[i] = (*bg_list)[i];
        }
      }
      *bg_list = rc_list<rc_ref<Background>>(bgs, list->size());
    }
    for (size_t i = 0; i < list->size(); ++i) {
      fill_background_image(package, (*bg_list)[i].ptr(), list[i]);
    }
  } else {
    if ((*bg_list)->size() < 1) {
      rc_ref<Background> bg = new Background();
      *bg_list = rc_list<rc_ref<Background>>(&bg, 1);
    }
    fill_background_image(package, (*bg_list)[0].ptr(), v);
  }
}



}

void Box::init_from(load::Package* package, expr::Context* context,
    const std::unordered_map<rc_qname,rc_ref<css::CSSValue>>& props) {
  auto it = props.find(rc_qname::atom(ID_writing_mode));
  if (it != props.end()) {
    vertical = it->second->id() == ID_vertical_rl;
  }
  for (const auto& prop : props) {
    switch (prop.first->id()) {
      case ID_margin_before:
        if (vertical) {
          if ((specified & SPECIFIED_MARGIN_RIGHT) == 0) {
            margin[RIGHT] = get_margin_dimension(context, prop.first,
                prop.second, SPECIFIED_MARGIN_RIGHT, &specified);
          }
        } else {
          if ((specified & SPECIFIED_MARGIN_TOP) == 0) {
            margin[TOP] = get_margin_dimension(context, prop.first,
                prop.second, SPECIFIED_MARGIN_TOP, &specified);
          }
        }
        break;
      case ID_margin_top:
        margin[TOP] = get_margin_dimension(context, prop.first,
            prop.second, SPECIFIED_MARGIN_TOP, &specified);
        break;
      case ID_margin_end:
        if (vertical) {
          if ((specified & SPECIFIED_MARGIN_BOTTOM) == 0) {
            margin[BOTTOM] = get_margin_dimension(context, prop.first,
                prop.second, SPECIFIED_MARGIN_BOTTOM, &specified);
          }
        } else {
          if ((specified & SPECIFIED_MARGIN_RIGHT) == 0) {
            margin[RIGHT] = get_margin_dimension(context, prop.first,
                prop.second, SPECIFIED_MARGIN_RIGHT, &specified);
          }
        }
        break;
      case ID_margin_right:
        margin[RIGHT] = get_margin_dimension(context, prop.first,
            prop.second, SPECIFIED_MARGIN_RIGHT, &specified);
        break;
      case ID_margin_after:
        if (vertical) {
          if ((specified & SPECIFIED_MARGIN_LEFT) == 0) {
            margin[LEFT] = get_margin_dimension(context, prop.first,
                prop.second, SPECIFIED_MARGIN_LEFT, &specified);
          }
        } else {
          if ((specified & SPECIFIED_MARGIN_BOTTOM) == 0) {
            margin[BOTTOM] = get_margin_dimension(context, prop.first,
                prop.second, SPECIFIED_MARGIN_BOTTOM, &specified);
          }
        }
        break;
      case ID_margin_bottom:
        margin[BOTTOM] = get_margin_dimension(context, prop.first,
            prop.second, SPECIFIED_MARGIN_BOTTOM, &specified);
        break;
      case ID_margin_start:
        if (vertical) {
          if ((specified & SPECIFIED_MARGIN_TOP) == 0) {
            margin[TOP] = get_box_dimension(context, prop.first,
                prop.second, SPECIFIED_MARGIN_TOP, &specified);
          }
        } else {
          if ((specified & SPECIFIED_MARGIN_LEFT) == 0) {
            margin[LEFT] = get_box_dimension(context, prop.first,
                prop.second, SPECIFIED_MARGIN_LEFT, &specified);
          }
        }
        break;
      case ID_margin_left:
        margin[LEFT] = get_box_dimension(context, prop.first,
            prop.second, SPECIFIED_MARGIN_LEFT, &specified);
        break;
      case ID_padding_top:
        padding[TOP] = get_box_dimension(context, prop.first,
            prop.second, SPECIFIED_PADDING_TOP, &specified);
        break;
      case ID_padding_right:
        padding[RIGHT] = get_box_dimension(context, prop.first,
            prop.second, SPECIFIED_PADDING_RIGHT, &specified);
        break;
      case ID_padding_bottom:
        padding[BOTTOM] = get_box_dimension(context, prop.first,
            prop.second, SPECIFIED_PADDING_BOTTOM, &specified);
        break;
      case ID_padding_left:
        padding[LEFT] = get_box_dimension(context, prop.first,
            prop.second, SPECIFIED_PADDING_LEFT, &specified);
        break;
      case ID_border_top_color:
        ensure_border(&border[TOP]);
        border[TOP]->color = prop.second;
        break;
      case ID_border_top_style:
        ensure_border(&border[TOP]);
        border[TOP]->style = prop.second;
        break;
      case ID_border_top_width:
        ensure_border(&border[TOP]);
        border[TOP]->width = get_box_dimension(context, prop.first,
            prop.second, SPECIFIED_BORDER_TOP, &specified);
        break;
      case ID_border_right_color:
        ensure_border(&border[RIGHT]);
        border[RIGHT]->color = prop.second;
        break;
      case ID_border_right_style:
        ensure_border(&border[RIGHT]);
        border[RIGHT]->style = prop.second;
        break;
      case ID_border_right_width:
        ensure_border(&border[RIGHT]);
        border[RIGHT]->width = get_box_dimension(context, prop.first,
            prop.second, SPECIFIED_BORDER_RIGHT, &specified);
        break;
      case ID_border_bottom_color:
        ensure_border(&border[BOTTOM]);
        border[BOTTOM]->color = prop.second;
        break;
      case ID_border_bottom_style:
        ensure_border(&border[BOTTOM]);
        border[BOTTOM]->style = prop.second;
        break;
      case ID_border_bottom_width:
        ensure_border(&border[BOTTOM]);
        border[BOTTOM]->width = get_box_dimension(context, prop.first,
            prop.second, SPECIFIED_BORDER_BOTTOM, &specified);
        break;
      case ID_border_left_color:
        ensure_border(&border[LEFT]);
        border[LEFT]->color = prop.second;
        break;
      case ID_border_left_style:
        ensure_border(&border[LEFT]);
        border[LEFT]->style = prop.second;
        break;
      case ID_border_left_width:
        ensure_border(&border[LEFT]);
        border[LEFT]->width = get_box_dimension(context, prop.first,
            prop.second, SPECIFIED_BORDER_LEFT, &specified);
        break;
      case ID_width:
        width = get_box_dimension(context, prop.first,
            prop.second, SPECIFIED_WIDTH, &specified);
        break;
      case ID_height:
        height = get_box_dimension(context, prop.first,
            prop.second, SPECIFIED_HEIGHT, &specified);
        break;
      case ID_background_color:
        background_color = prop.second;
        break;
      case ID_background_image:
        fill_background(package, &background, prop.second);
        break;
      case ID_background_attachment:
      case ID_background_position:
      case ID_background_size:
      case ID_background_repeat:
      case ID_background_clip:
      case ID_background_origin:
        break;
    }
  }
  for (int i = 0; i < 4; ++i) {
    if (!border[i].is_null()) {
      rc_ref<Border>& b = border[i];
      if (b->width == 0 || b->style->id() == ID_none) {
        b = rc_ref<Border>();
      }
    }
  }
  if (!media.is_null()) {
    // replaced element
    if (specified & SPECIFIED_WIDTH) {
      if (specified & SPECIFIED_HEIGHT) {
        // Both are specified, nothing to do.
      } else {
        // Compute height from width.
        height = width * media->height / media->width;
      }
    } else {
      if (specified & SPECIFIED_HEIGHT) {
        // Compute width from height.
        width = height * media->width / media->height;
      } else {
        // Take with and height from the media.
        width = media->width;
        height = media->height;
      }
    }
    media = media->resize(width, height);
    // treat as specified
    specified |= (SPECIFIED_WIDTH|SPECIFIED_HEIGHT);
  }
}

}
}

