#ifndef adapt_render_render_mac_h
#define adapt_render_render_mac_h

#include <map>
#include <memory>

#include <CoreGraphics/CGContext.h>

#include "adapt/base/rc_string.h"
#include "adapt/render/render.h"

namespace adapt {
namespace render {

std::unique_ptr<Renderer> create_pdf_renderer_mac(const rc_string& file_path,
    float width, float height, const std::map<rc_qname, rc_value>& metadata);

std::unique_ptr<Renderer> create_renderer_mac(CGContextRef context);

}
}

#endif
