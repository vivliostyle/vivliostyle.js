#ifndef adapt_doc_container_h
#define adapt_doc_container_h

#include <memory>
#include <unordered_map>

#include "adapt/load/package.h"
#include "adapt/base/rc_list.h"
#include "adapt/css/cascade.h"
#include "adapt/doc/xml_content.h"
#include "adapt/doc/content_layout.h"

namespace adapt {
namespace doc {

class ContainerRenderer;

/**
 * Package-based (e.g. EPUB) document that owns the content documents. Holds
 * the underlying load::Package object. Also stores common resources (e.g.
 * parsed stylesheet sequences).
 */
class ContainerDocument {
  friend class XMLContentDocument;
 public:
  ContainerDocument();
  ~ContainerDocument();

  virtual void init(std::unique_ptr<load::Package>&& package);

  const rc_string& root_url() const { return root_url_; }

  load::Package* package() const { return package_.get(); }

  rc_ref<ContentLayout> get_content_layout(const rc_list<rc_string>& urls);

  rc_ref<XMLContentDocument> get_xml_content(const rc_string& url);

  std::unique_ptr<ContainerRenderer> create_renderer(
      double width, double height);

 private:
  void remove_from_map(XMLContentDocument* doc);

  std::unique_ptr<load::Package> package_;
  rc_string root_url_;
  // holding map
  std::unordered_map<rc_list<rc_string>, rc_ref<ContentLayout>> layout_map_;
  // weak map, document will unlink itself on destruction
  std::unordered_map<rc_string, XMLContentDocument*> xml_documents_;
};


class ContainerRenderer {
  friend class ContainerDocument;
  friend class XMLContentRenderer;
 public:
  ~ContainerRenderer();

  rc_ref<XMLContentRenderer> get_xml_renderer(const rc_string& url);

 private:
  ContainerRenderer(ContainerDocument* contdoc, double width, double height);
  void remove_from_map(XMLContentRenderer* rend);

  ContainerDocument* contdoc_;
  // weak map, renderer will unlink itself on destruction
  std::unordered_map<rc_string, XMLContentRenderer*> xml_renderers_;
  double width_;
  double height_;
};
    
}
}

#endif
