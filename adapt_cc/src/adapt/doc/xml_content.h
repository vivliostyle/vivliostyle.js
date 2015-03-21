#ifndef adapt_doc_xml_content_h
#define adapt_doc_xml_content_h

#include <memory>

#include "adapt/load/package.h"
#include "adapt/dom/dom.h"
#include "adapt/css/cascade.h"
#include "adapt/css/styler.h"
#include "adapt/expr/expr.h"
#include "adapt/layout/page.h"
#include "adapt/layout/position.h"
#include "adapt/doc/content_layout.h"
#include "adapt/doc/environment.h"

namespace adapt {
namespace doc {

class ContainerDocument;
class ContainerRenderer;

/**
 *  XML-based (XHTML/SVG/FB2/DTBook) content document.
 */
class XMLContentDocument : public RefCountedObject {
  friend class ContainerDocument;
 public:
  ~XMLContentDocument();

  ContainerDocument* container() const { return container_; }
  dom::DOM* dom() const { return dom_.get(); }
  ContentLayout* content_layout() const { return content_layout_.ptr(); }

 private:
  XMLContentDocument(ContainerDocument* container);
  void load(const rc_string& path);

  ContainerDocument* container_;
  std::unique_ptr<dom::DOM> dom_;
  rc_ref<ContentLayout> content_layout_;
};

class XMLContentRenderer : public RefCountedObject {
  friend class ContainerRenderer;
 public:
  ~XMLContentRenderer();

  void init();

  double width() const { return width_; }
  double height() const { return height_; }

  void layout_next_page();

  size_t page_count() const { return pages_.size(); }
  layout::Page* page(size_t index) const { return pages_[index].get(); }

  const rc_ref<XMLContentDocument>& xmldoc() const { return doc_; }
  ContainerDocument* container() const { return doc_->container(); }
  ContainerRenderer* container_renderer() const { return contrend_; }
  XMLContentDocument* document() const { return doc_.ptr(); }
  load::Package* package() const;
  ContentLayoutInstance* content_layout_instance() const {
    return content_layout_instance_.get();
  }

 private:
  XMLContentRenderer(ContainerRenderer* contrend,
      const rc_ref<XMLContentDocument>& doc, const Environment& environment);

  rc_ref<XMLContentDocument> doc_;
  double width_;
  double height_;
  ContainerRenderer* contrend_;
  std::unique_ptr<ContentLayoutInstance> content_layout_instance_;
  std::vector<std::unique_ptr<layout::Page>> pages_;
};

}
}

#endif

