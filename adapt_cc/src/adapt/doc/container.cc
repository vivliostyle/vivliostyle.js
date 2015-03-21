#include "adapt/doc/container.h"

#include <limits>

#include "adapt/load/app_package.h"
#include "adapt/doc/style_parsing.h"

namespace adapt {
namespace doc {

ContainerDocument::ContainerDocument() {
  static int fake_url_count = 0;
  StringWriter out;
  out << "http://fake" << ++fake_url_count << "/";
  root_url_ = out.to_string();
}

ContainerDocument::~ContainerDocument() {
  assert(xml_documents_.empty());
}

void ContainerDocument::init(std::unique_ptr<load::Package>&& package) {
  package_ = std::move(package);
  layout_map_.clear();
}

rc_ref<ContentLayout> ContainerDocument::get_content_layout(
    const rc_list<rc_string>& urls) {
  auto it = layout_map_.find(urls);
  if (it != layout_map_.end()) {
    return it->second;
  }
  ContentLayoutBuilder content_layout_builder;
  content_layout_builder.init(this);
  for (const rc_string& url : urls) {
    content_layout_builder.parse_from_url(url);
  }
  rc_ref<ContentLayout> content_layout = content_layout_builder.finish();
  layout_map_[urls] = content_layout;
  return content_layout;
}

rc_ref<XMLContentDocument> ContainerDocument::get_xml_content(
    const rc_string& url) {
  if(!url->starts_with(root_url_)) {
    return rc_ref<XMLContentDocument>();
  }
  auto it = xml_documents_.find(url);
  if (it != xml_documents_.end()) {
    return it->second;
  }
  rc_ref<XMLContentDocument> doc = new XMLContentDocument(this);
  xml_documents_[url] = doc.ptr();
  rc_string path = url->substr(root_url_->length());
  doc->load(path);
  return doc;
}

void ContainerDocument::remove_from_map(XMLContentDocument* doc) {
  auto it = xml_documents_.find(doc->dom()->document_url());
  assert(it != xml_documents_.end() && it->second == doc);
  xml_documents_.erase(it);
}

std::unique_ptr<ContainerRenderer> ContainerDocument::create_renderer(
    double width, double height) {
  return std::unique_ptr<ContainerRenderer>(
      new ContainerRenderer(this, width, height));
}

//--------------------------------------------------------------------------

ContainerRenderer::ContainerRenderer(ContainerDocument* contdoc, double width,
    double height) : contdoc_(contdoc), width_(width), height_(height) {}

ContainerRenderer::~ContainerRenderer() {
  assert(xml_renderers_.empty());
}

rc_ref<XMLContentRenderer> ContainerRenderer::get_xml_renderer(
    const rc_string& url) {
  auto it = xml_renderers_.find(url);
  if (it != xml_renderers_.end()) {
    return it->second;
  }
  rc_ref<XMLContentDocument> xmldoc = contdoc_->get_xml_content(url);
  if (xmldoc.is_null()) {
    return rc_ref<XMLContentRenderer>();
  }
  Environment env;
  env.width = width_;
  env.height = height_;
  env.font_size = 16;
  rc_ref<XMLContentRenderer> renderer =
        new XMLContentRenderer(this, xmldoc, env);
  renderer->init();
  xml_renderers_[url] = renderer.ptr();
  return renderer;
}

void ContainerRenderer::remove_from_map(XMLContentRenderer* xmlrend) {
  auto it = xml_renderers_.find(xmlrend->xmldoc()->dom()->document_url());
  assert(it != xml_renderers_.end() && it->second == xmlrend);
  xml_renderers_.erase(it);
}

}
}
