#ifndef adapt_layout_page_h
#define adapt_layout_page_h

#include <memory>
#include <vector>
#include <map>

#include "adapt/css/cascade.h"
#include "adapt/geom/base.h"
#include "adapt/dom/dom.h"
#include "adapt/media/media.h"
#include "adapt/font/font.h"

namespace adapt {

namespace pm {

class PageBoxInstance;

}

namespace doc {

class ContentLayoutInstance;
    
}

namespace load {

class Package;

}

namespace layout {

class LayoutEngine;
struct Box;

class Container {
  friend class LayoutEngine;
  friend class doc::ContentLayoutInstance;
  friend class pm::PageBoxInstance;
 public:
  typedef std::vector<std::unique_ptr<Container>> children_list;

  Container(const geom::Rectangle& bounds);
  virtual ~Container();

  const std::map<dom::node_offset_t, rc_value>& attachments() const {
    return attachments_;
  }

  std::map<dom::node_offset_t, rc_value>& attachments() {
    return attachments_;
  }

  void reset_content();
  dom::DOM* content() const { return content_.get(); }

  const children_list& children() const { return children_; }

  const geom::Rectangle& bounds() const { return bounds_; }

  Container* create_child() {
    children_.push_back(std::unique_ptr<Container>(new Container(
        geom::Rectangle::from_xywh(0, 0, bounds_.dx(), bounds_.dy()))));
    return children_.back().get();
  }

  void set_bounds(const geom::Rectangle& bounds) { bounds_ = bounds; }

  const Box* box() const { return box_.ptr(); }

 private:
  geom::Rectangle bounds_;
  rc_ref<Box> box_;
  css::element_style style_;
  std::unique_ptr<dom::DOM> content_;
  std::map<dom::node_offset_t, rc_value> attachments_;
  std::vector<std::unique_ptr<Container>> children_;
};

/**
 * Page is something that can be rendered. It is broken into Container
 * hierarchy.
 */
class Page {
 public:

  Page(float width, float height);

  Container* root() { return &root_; }

 private:
  Container root_;
};

struct Background : public RefCountedObject {
  rc_ref<media::Media> media;
};

struct Border : public RefCountedObject {
  double width = 0;
  rc_ref<css::CSSValue> color;
  rc_ref<css::CSSValue> style;
};

struct Box : public RefCountedObject {
  enum {
    SPECIFIED_MARGIN_TOP = 1,
    SPECIFIED_MARGIN_LEFT = 2,
    SPECIFIED_MARGIN_BOTTOM = 4,
    SPECIFIED_MARGIN_RIGHT = 8,
    AUTO_MARGIN_TOP = 0x10,
    AUTO_MARGIN_LEFT = 0x20,
    AUTO_MARGIN_BOTTOM = 0x40,
    AUTO_MARGIN_RIGHT = 0x80,
    SPECIFIED_PADDING_TOP = 0x100,
    SPECIFIED_PADDING_LEFT = 0x200,
    SPECIFIED_PADDING_BOTTOM = 0x400,
    SPECIFIED_PADDING_RIGHT = 0x800,
    SPECIFIED_BORDER_TOP = 0x1000,
    SPECIFIED_BORDER_LEFT = 0x2000,
    SPECIFIED_BORDER_BOTTOM = 0x4000,
    SPECIFIED_BORDER_RIGHT = 0x8000,
    SPECIFIED_WIDTH = 0x10000,
    SPECIFIED_HEIGHT = 0x20000
  };

  // top, right, bottom, left
  enum {
    TOP = 0,
    RIGHT = 1,
    BOTTOM = 2,
    LEFT = 3
  };

  bool vertical = false;
  double padding[4] = {0, 0, 0, 0};
  double margin[4] = {0, 0, 0, 0};
  unsigned int specified = 0;  // present and non-auto
  rc_ref<Border> border[4];
  rc_ref<Border> outline;
  rc_ref<css::CSSValue> border_style[4];
  rc_list<rc_ref<Background>> background = rc_list<rc_ref<Background>>::empty();
  rc_ref<media::Media> media;
  rc_ref<css::CSSValue> background_color;
  double width = 0;
  double height = 0;

  Box() {}
  Box(const rc_ref<media::Media> m) : media(m) {}

  double border_width(int index) const {
    const rc_ref<Border>& b = border[index];
    if (!b.is_null()) {
      return b->width;
    }
    return 0;
  }

  // Margin box relative to the content origin
  double margin_x() const {
    return -margin[Box::LEFT] - border_width(Box::LEFT) - padding[Box::LEFT];
  }

  double margin_y() const {
    return -margin[Box::TOP] - border_width(Box::TOP) - padding[Box::TOP];
  }

  double margin_width() const {
    return margin[Box::LEFT] + border_width(Box::LEFT) + padding[Box::LEFT]
        + width + padding[Box::RIGHT] + border_width(Box::RIGHT)
        + margin[Box::RIGHT];
  }

  double margin_height() const {
    return margin[Box::TOP] + border_width(Box::TOP) + padding[Box::TOP]
        + height + padding[Box::BOTTOM] + border_width(Box::BOTTOM)
        + margin[Box::BOTTOM];
  }

  void init_from(load::Package* package, expr::Context* context,
      const std::unordered_map<rc_qname,rc_ref<css::CSSValue>>& props);
};

// TODO: unify with InlineProperties?
struct BlockProperties : public RefCountedObject {
  rc_map<rc_ref<css::CSSValue>> render_props =
      rc_map<rc_ref<css::CSSValue>>::empty();
  rc_ref<Box> box;
  double x_absolute = 0;  // relative to container
  double x = 0;
  double y = 0;
  double width = 0;
  double height = 0;

  // TODO: only needed during formatting, stop keeping
  rc_ref<font::Font> font;
  double line_height = 0;
  rc_qname text_align;

  static const char* type_tag();

 protected:
  virtual bool instance_of(const char* type_tag) const override;
};

struct InlineProperties : public RefCountedObject {
  InlineProperties() {}

  rc_map<rc_ref<css::CSSValue>> render_props =
      rc_map<rc_ref<css::CSSValue>>::empty();
  rc_ref<Box> box;
  double x = 0;
  double y = 0;

  static const char* type_tag();

 protected:
  virtual bool instance_of(const char* type_tag) const override;
};


}
}

#endif
