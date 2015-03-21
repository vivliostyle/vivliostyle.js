#ifndef adapt_render_render_h
#define adapt_render_render_h

#include "adapt/geom/base.h"
#include "adapt/layout/page.h"

namespace adapt {
namespace render {

class Renderer {
 public:
  virtual ~Renderer() {}
  virtual void render(layout::Page* page, const geom::Rectangle& rect) = 0;
};

}
}

#endif
