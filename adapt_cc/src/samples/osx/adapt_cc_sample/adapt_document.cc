#include "samples/osx/adapt_cc_sample/adapt_document.h"

#include <memory>

#include "adapt/base/url.h"
#include "adapt/load/folder_package.h"
#include "adapt/doc/container.h"
#include "adapt/doc/xml_content.h"
#include "adapt/render/render_mac.h"
#include "adapt/geom/base.h"

class AdaptRendererImpl;

class AdaptDocumentImpl {
  friend class AdaptRendererImpl;
 public:
  AdaptDocumentImpl(const adapt::rc_string& folder,
      const adapt::rc_string& path) {
    doc_ = std::unique_ptr<adapt::doc::ContainerDocument>(
        new adapt::doc::ContainerDocument());
    doc_->init(adapt::load::create_folder_package(folder, doc_->root_url()));
    content_ = doc_->get_xml_content(resolve_url(doc_->package()->root_url(), path));
  }

private:
  std::unique_ptr<adapt::doc::ContainerDocument> doc_;
  adapt::rc_ref<adapt::doc::XMLContentDocument> content_;
};

class AdaptRendererImpl {
 public:
  AdaptRendererImpl(AdaptDocumentImpl* doc) : doc_(doc), page_index_(0) {
  }

  void set_page_size(double width, double height) {
    if (!xmlrend_.is_null()) {
      if (xmlrend_->width() == width && xmlrend_->height() == height) {
        return;
      }
    }
    xmlrend_ = adapt::rc_ref<adapt::doc::XMLContentRenderer>();
    contrend_ = doc_->doc_->create_renderer(width, height);
    xmlrend_ = contrend_->get_xml_renderer(
        doc_->content_->dom()->document_url());
  }

  void next_page() {
    page_index_++;
  }

  void previous_page() {
    if(page_index_ > 0) {
      page_index_--;
    }
  }

  void render(CGContextRef context, double x, double y,
      double width, double height) {
    while (page_index_ >= xmlrend_->page_count()) {
      if (xmlrend_->content_layout_instance()->done()) {
        page_index_ = xmlrend_->page_count() - 1;
        break;
      }
      xmlrend_->layout_next_page();
    }
    adapt::layout::Page* page = xmlrend_->page(page_index_);
    CGContextSaveGState(context);
    CGContextTranslateCTM(context, 0, page->root()->bounds().dy());
    CGContextScaleCTM(context, 1.0, -1.0);
    std::unique_ptr<adapt::render::Renderer> renderer =
        adapt::render::create_renderer_mac(context);
    renderer->render(page,
        adapt::geom::Rectangle::from_xywh(x, y, width, height));
    CGContextRestoreGState(context);
  }

 private:
  AdaptDocumentImpl* doc_;
  size_t page_index_;
  std::unique_ptr<adapt::doc::ContainerRenderer> contrend_;
  adapt::rc_ref<adapt::doc::XMLContentRenderer> xmlrend_;
};

//----------------------------------------------------------------------------

AdaptDocument* adapt_document_open(CFURLRef url) {
  UInt8 path[4096];
  if (CFURLGetFileSystemRepresentation(url, true, path, sizeof path)) {
    char* f = strrchr((char*)path, '/');
    *f = '\0';
    const char* filename = f + 1;
    const char* folder = (const char*)path;
    return reinterpret_cast<AdaptDocument*>(
        new AdaptDocumentImpl(folder, filename));
  }
  return NULL;
}

AdaptDocumentRenderer* adapt_document_create_renderer(AdaptDocument* doc) {
  return reinterpret_cast<AdaptDocumentRenderer*>(
      new AdaptRendererImpl(reinterpret_cast<AdaptDocumentImpl*>(doc)));
}

void adapt_document_renderer_set_size(
    AdaptDocumentRenderer* renderer, int width, int height) {
  reinterpret_cast<AdaptRendererImpl*>(renderer)->set_page_size(width, height);
}

void adapt_document_renderer_next_page(AdaptDocumentRenderer* renderer) {
  reinterpret_cast<AdaptRendererImpl*>(renderer)->next_page();
}

void adapt_document_renderer_previous_page(AdaptDocumentRenderer* renderer) {
  reinterpret_cast<AdaptRendererImpl*>(renderer)->previous_page();
}

void adapt_document_renderer_render(
    AdaptDocumentRenderer* renderer, CGContextRef context, CGRect rect) {
  reinterpret_cast<AdaptRendererImpl*>(renderer)->render(context,
      CGRectGetMinX(rect), CGRectGetMinY(rect), CGRectGetWidth(rect),
      CGRectGetHeight(rect));
}


