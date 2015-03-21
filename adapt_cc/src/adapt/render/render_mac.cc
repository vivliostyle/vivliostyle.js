#include "adapt/render/render_mac.h"

#include <CoreFoundation/CoreFoundation.h>
#include <CoreGraphics/CoreGraphics.h>

#include "adapt/platform/platform_mac.h"

#include "adapt/css/decode.h"
#include "adapt/media/image_mac.h"

namespace adapt {
namespace render {

struct RendererEnvironment {
  const layout::Page* page;
  const layout::Container* container;
  geom::Rectangle rect;
  dom::node_offset_t offset;
  std::unordered_map<rc_qname, rc_ref<css::CSSValue>> props;
};

class MacRenderer : public Renderer {
 public:
  MacRenderer(CGContextRef context);
  virtual ~MacRenderer();
  virtual void render(layout::Page* page, const geom::Rectangle& rect) override;
 private:

  void render_container(RendererEnvironment* env);
  void render_element(RendererEnvironment* env, const dom::Element& element);
  void render_attachment(RendererEnvironment* env, const rc_value& attachment);
  void render_media(RendererEnvironment* env,
      const rc_ref<media::Media>& media);
  void render_box(RendererEnvironment* env, const layout::Box& box);
  void render_background(RendererEnvironment* env, const layout::Box& box,
      const layout::Background& bg);

  void apply_property(RendererEnvironment* env, const rc_qname& prop,
      rc_ref<css::CSSValue> value);

 protected:
  CGContextRef context_;
};

//----------------------------------------------------------------------------

class MacPDFRenderer : public MacRenderer {
 public:
  MacPDFRenderer(CGContextRef context, float width, float height,
      CFMutableDataRef pdf_data, const rc_string& file_path);
  virtual ~MacPDFRenderer();
  virtual void render(layout::Page* page, const geom::Rectangle& rect) override;

 private:
  float width_;
  float height_;
  rc_string file_path_;
  CFMutableDataRef pdf_data_;
};

//----------------------------------------------------------------------------

MacRenderer::MacRenderer(CGContextRef context) : context_(context) {}

MacRenderer::~MacRenderer() {}

void MacRenderer::render(layout::Page* page, const geom::Rectangle& rect) {
  RendererEnvironment env;
  env.page = page;
  env.rect = rect;
  env.container = page->root();
  env.offset = 0;
  render_container(&env);
}

void MacRenderer::render_container(RendererEnvironment* env) {
  const layout::Container* container = env->container;
  CGContextSaveGState(context_);
  CGContextTranslateCTM(context_,
      container->bounds().x1(), container->bounds().y1());
  if (container->box()) {
    render_box(env, *container->box());
  }
  if (container->content()) {
    render_element(env, *container->content()->root());
  }
  for (const std::unique_ptr<layout::Container>& ch : container->children()) {
    env->container = ch.get();
    render_container(env);
  }
  CGContextRestoreGState(context_);
  env->container = container;
}

void MacRenderer::apply_property(RendererEnvironment* env,
    const rc_qname& prop, rc_ref<css::CSSValue> value) {}

void MacRenderer::render_element(RendererEnvironment* env,
    const dom::Element& element) {
  CGContextSaveGState(context_);
  // enter element: compute properties
  const std::map<dom::node_offset_t, rc_value>& attachments =
      env->container->attachments();
  env->offset = element.text_offset();
  auto rmap_it = attachments.find(env->offset);
  std::map<rc_qname, rc_ref<css::CSSValue>> saved;
  if (rmap_it != attachments.end()) {
    const rc_map<rc_ref<css::CSSValue>>* render_props;
    const layout::Box* box = nullptr;
    if (rmap_it->second->is<rc_ref<layout::InlineProperties>>()) {
      rc_ref<layout::InlineProperties> ip =
          rc_cast<rc_ref<layout::InlineProperties>>(rmap_it->second);
      box = ip->box.ptr();
      render_props = &ip->render_props;
      CGContextTranslateCTM(context_, ip->x, ip->y);
    } else {
      rc_ref<layout::BlockProperties> render_data =
          rc_cast<rc_ref<layout::BlockProperties>>(rmap_it->second);
      box = render_data->box.ptr();
      render_props = &render_data->render_props;
      CGContextTranslateCTM(context_, render_data->x, render_data->y);
    }
    for (const auto& entry : *render_props) {
      if (css::is_inherited(entry.key)) {
        rc_ref<css::CSSValue>& value = env->props[entry.key];
        saved[entry.key] = value;
        value = entry.value;
      } else {
        // TODO: collect them and apply in well-defined order
        apply_property(env, entry.key, entry.value);
      }
    }
    if (box) {
      render_box(env, *box);
    }
  }

  // content, start with leading text
  const rc_string& leading_text = element.leading_text();
  ++env->offset;
  if (!leading_text->empty()) {
    auto att_it = attachments.find(env->offset);
    if (att_it != attachments.end()) {
      render_attachment(env, att_it->second);
    }
  }
  if (element.children()) {
    for (const dom::Element& child : *element.children()) {
      render_element(env, child);
    }
  } else {
    env->offset += dom::node_offset_t(leading_text->utf16_length());
  }

  // restore env->props
  for (const auto& s : saved) {
    if (s.second.is_null()) {
      env->props.erase(s.first);
    } else {
      env->props[s.first] = s.second;
    }
  }
  CGContextRestoreGState(context_);

  // following text
  const rc_string& following_text = element.following_text();
  if (!following_text->empty()) {
    auto att_it = attachments.find(env->offset);
    if (att_it != attachments.end()) {
      render_attachment(env, att_it->second);
    }
    env->offset += dom::node_offset_t(following_text->utf16_length());
  }
}

void MacRenderer::render_media(RendererEnvironment* env,
    const rc_ref<media::Media>& media) {
  CGContextSaveGState(context_);
  CGAffineTransform transform;
  transform.a = 1;
  transform.b = 0;
  transform.c = 0;
  transform.d = -1;
  transform.tx = 0;
  transform.ty = media->height;
  CGContextConcatCTM(context_, transform);
  CGRect bnd = CGRectMake(0, 0, media->width, media->height);
  rc_ref<media::MacPlatformImage> mac_image =
      rc_cast<rc_ref<media::MacPlatformImage>>(media->media_object);
  CGContextDrawImage(context_, bnd, mac_image->image.get());
  CGContextRestoreGState(context_);
}

void MacRenderer::render_background(RendererEnvironment* env,
    const layout::Box& box, const layout::Background& bg) {
  typedef layout::Box B;
  if (!bg.media.is_null()) {
    // border box
    double bx = -box.padding[B::LEFT] - box.border_width(B::LEFT);
    double by = -box.padding[B::TOP] - box.border_width(B::TOP);
    double bw = -bx + box.width + box.padding[B::RIGHT]
        + box.border_width(B::RIGHT);
    double bh = -bx + box.height + box.padding[B::BOTTOM]
        + box.border_width(B::BOTTOM);
    CGContextSaveGState(context_);
    CGContextMoveToPoint(context_, bx, by);
    CGContextAddLineToPoint(context_, bx + bw, by);
    CGContextAddLineToPoint(context_, bx + bw, by + bh);
    CGContextAddLineToPoint(context_, bx, by + bh);
    CGContextClosePath(context_);
    CGContextClip(context_);
    for (double y = 0; y < bh; y += bg.media->height) {
      for (double x = 0; x < bw; x += bg.media->width) {
        CGContextSaveGState(context_);
        CGContextTranslateCTM(context_, bx + x, by + y);
        render_media(env, bg.media);
        CGContextRestoreGState(context_);
      }
    }
    CGContextRestoreGState(context_);
  }
}

void MacRenderer::render_box(RendererEnvironment* env, const layout::Box& box) {
  typedef layout::Box B;
  // border box
  double bx = -box.padding[B::LEFT] - box.border_width(B::LEFT);
  double by = -box.padding[B::TOP] - box.border_width(B::TOP);
  double bw = -bx + box.width + box.padding[B::RIGHT]
      + box.border_width(B::RIGHT);
  double bh = -by + box.height + box.padding[B::BOTTOM]
      + box.border_width(B::BOTTOM);
  if (!box.background_color.is_null()) {
    css::DecodedPaint paint;
    if (css::decode_paint(box.background_color, &paint)) {
      CGContextSetRGBFillColor(context_, paint.red,
          paint.green, paint.blue, paint.alpha);
      CGContextFillRect(context_, CGRectMake(bx, by, bw, bh));
    }
  }
  if (!box.background.is_null()) {
    for (off_t i = box.background->size() - 1; i >= 0; --i) {
      render_background(env, box, *box.background[i]);
    }
  }
  if (!box.border[B::TOP].is_null() || !box.border[B::RIGHT].is_null()
      || !box.border[B::BOTTOM].is_null() || !box.border[B::LEFT].is_null()) {
    if (!box.border[B::TOP].is_null()) {
      float th = box.border[B::TOP]->width;
      css::DecodedPaint paint;
      if (css::decode_paint(box.border[B::TOP]->color, &paint)) {
        CGContextSetRGBFillColor(context_, paint.red, paint.green, paint.blue,
            paint.alpha);
        CGContextFillRect(context_, CGRectMake(bx, by, bw, th));
      }
    }
    if (!box.border[B::RIGHT].is_null()) {
      float th = box.border[B::RIGHT]->width;
      css::DecodedPaint paint;
      if (css::decode_paint(box.border[B::RIGHT]->color, &paint)) {
        CGContextSetRGBFillColor(context_, paint.red, paint.green, paint.blue,
            paint.alpha);
        CGContextFillRect(context_, CGRectMake(bx + bw - th, by, th, bh));
      }
    }
    if (!box.border[B::BOTTOM].is_null()) {
      float th = box.border[B::BOTTOM]->width;
      css::DecodedPaint paint;
      if (css::decode_paint(box.border[B::BOTTOM]->color, &paint)) {
        CGContextSetRGBFillColor(context_, paint.red, paint.green, paint.blue,
                                 paint.alpha);
        CGContextFillRect(context_, CGRectMake(bx, by + bh - th, bw, th));
      }
    }
    if (!box.border[B::LEFT].is_null()) {
      float th = box.border[B::LEFT]->width;
      css::DecodedPaint paint;
      if (css::decode_paint(box.border[B::LEFT]->color, &paint)) {
        CGContextSetRGBFillColor(context_, paint.red, paint.green, paint.blue,
                                 paint.alpha);
        CGContextFillRect(context_, CGRectMake(bx, by, th, bh));
      }
    }
  }
  if (!box.media.is_null()) {
    render_media(env, box.media);
  }
}

void MacRenderer::render_attachment(RendererEnvironment* env,
    const rc_value& attachment) {
  rc_ref<text::LineSequence> text_attachment =
      rc_cast<rc_ref<text::LineSequence>>(attachment);
  for (const text::Line& line : text_attachment->lines_) {
    CGContextSaveGState(context_);
    CGContextSetTextDrawingMode(context_, kCGTextFill);
    css::DecodedPaint paint;
    rc_value cv = env->props[rc_qname::atom(ID_color)];
    if (!cv.is_null()) {
      css::decode_paint(rc_cast<rc_ref<css::CSSValue>>(cv), &paint);
    }
    CGContextSetRGBFillColor(context_, paint.red,
        paint.green, paint.blue, paint.alpha);
    for (const text::Run& run : line.runs) {
      mac::cf_ref<CGFontRef> font(
          CTFontCopyGraphicsFont(run.font.get(), nullptr));
      CGContextSetFont(context_, font.get());
      CGContextSetFontSize(context_, CTFontGetSize(run.font.get()));
      CGAffineTransform matrix = run.matrix;
      matrix.d = -matrix.d;
      CGContextSetTextMatrix(context_, matrix);
      CGContextSetTextPosition(context_, line.start, line.baseline);
      CGContextShowGlyphsAtPositions(context_, run.glyphs, run.positions,
          run.glyph_count);
    }
    CGContextRestoreGState(context_);
  }
}

//-----------------------------------------------------------------------------

MacPDFRenderer::MacPDFRenderer(CGContextRef context, float width, float height,
    CFMutableDataRef pdf_data, const rc_string& file_path)
    : MacRenderer(context), pdf_data_(pdf_data), file_path_(file_path),
      width_(width), height_(height) {}

MacPDFRenderer::~MacPDFRenderer() {
  CGPDFContextClose(context_);
  CGContextRelease(context_);
  FILE* fp = fopen(file_path_->utf8(), "w");
  fwrite(CFDataGetBytePtr(pdf_data_), 1, CFDataGetLength(pdf_data_), fp);
  fclose(fp);
  CFRelease(pdf_data_);
}

void MacPDFRenderer::render(layout::Page* page, const geom::Rectangle& rect) {
  CGPDFContextBeginPage(context_, NULL);
  CGContextTranslateCTM(context_, 0, height_);
  CGContextScaleCTM(context_, 1.0, -1.0);
  CGContextSetRGBFillColor(context_, 0, 0, 0, 1.0);
  MacRenderer::render(page, rect);
  CGPDFContextEndPage(context_);
}

//-----------------------------------------------------------------------------

std::unique_ptr<Renderer> create_pdf_renderer_mac(const rc_string& file_path,
    float width, float height, const std::map<rc_qname, rc_value>& metadata) {
  CFMutableDataRef pdf_data = CFDataCreateMutable(kCFAllocatorDefault, 0);
  CGDataConsumerRef consumer = CGDataConsumerCreateWithCFData(pdf_data);
  CGRect media_box = CGRectMake(0, 0, width, height);
  CFMutableDictionaryRef pdf_metadata =
      CFDictionaryCreateMutable(kCFAllocatorDefault, 0, NULL, NULL);
  auto title = metadata.find(rc_qname::atom(ID_DC_title));
  if (title != metadata.end()) {
    rc_string rc_title = title->second->to_string();
    CFStringRef cf_title = CFStringCreateWithBytes(kCFAllocatorDefault,
        reinterpret_cast<const UInt8*>(rc_title->utf8()), rc_title->length(),
        kCFStringEncodingUTF8, false);
    CFDictionaryAddValue(pdf_metadata, kCGPDFContextTitle, cf_title);
  }
  CGContextRef pdf_context =
      CGPDFContextCreate(consumer, &media_box, pdf_metadata);
  CGDataConsumerRelease(consumer);
  return std::unique_ptr<Renderer>(
      new MacPDFRenderer(pdf_context, width, height, pdf_data, file_path));
}

std::unique_ptr<Renderer> create_renderer_mac(CGContextRef context) {
  return std::unique_ptr<Renderer>(new MacRenderer(context));
}


}
}
