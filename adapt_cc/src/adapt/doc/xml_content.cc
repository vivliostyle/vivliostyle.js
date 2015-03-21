#include "adapt/doc/xml_content.h"

#include <vector>

#include "adapt/base/url.h"
#include "adapt/doc/container.h"
#include "adapt/doc/style_parsing.h"
#include "adapt/text/inline_formatter.h"


namespace adapt {
namespace doc {

namespace {

struct StyleSource {
  rc_string url;
  rc_string text;
};

bool collect_styles(const adapt::dom::Element& element,
    const rc_string& doc_url, std::vector<StyleSource>* styles) {
  if (element.qname()->id() == ID_XHTML_style) {
    rc_string text = element.leading_text();
    if (text->empty()) {
      return false;
    }
    styles->push_back(StyleSource {doc_url, text});
    return true;
  }
  if (element.qname()->id() == ID_XHTML_link) {
    if (element.attributes()[rc_qname::atom(ID_rel)] == "stylesheet") {
      rc_value href = element.attributes()[rc_qname::atom(ID_href)];
      if (!href.is_null()) {
        styles->push_back(StyleSource {
          resolve_url(doc_url, rc_cast<rc_string>(href))});
      }
    }
    return false;
  }
  if (element.children()) {
    bool has_text = false;
    for (const adapt::dom::Element& child : *element.children()) {
      if (collect_styles(child, doc_url, styles)) {
        has_text = true;
      }
    }
    return has_text;
  }
  return false;
}

}


XMLContentDocument::XMLContentDocument(ContainerDocument* container)
    : container_(container) {}

XMLContentDocument::~XMLContentDocument() {
  container_->remove_from_map(this);
}

void XMLContentDocument::load(const rc_string& path) {
  rc_string url = resolve_url(container_->root_url(), path);
  dom_ = std::unique_ptr<dom::DOM>(new dom::DOM(url));
  adapt::dom::AttributeParser attr_parser;
  attr_parser.add_parser(rc_qname::atom(ID_asterisk), rc_qname::atom(ID_class),
      std::unique_ptr<dom::SingleAttributeParser>(
          new css::ClassAttributeParser()));
  std::unique_ptr<dom::Parser> xmlparser(dom::Parser::create(
      dom_->builder(&attr_parser)));
  std::unique_ptr<SequentialReader> reader = container_->package()->read(path);
  unsigned char buffer[4096];
  size_t len;
  while ((len = reader->read(buffer, sizeof buffer)) > 0) {
    xmlparser->write(buffer, len);
  }
  xmlparser->close();
  std::vector<StyleSource> sources;
  if (collect_styles(*dom_->root(), url, &sources)) {
    // has inline text, stylesheet is not sharable
    doc::ContentLayoutBuilder content_layout_builder;
    content_layout_builder.init(container_);
    for (const StyleSource& source : sources) {
      if (source.text->empty()) {
        content_layout_builder.parse_from_url(source.url);
      } else {
        content_layout_builder.parse_from_text(source.url, source.text);
      }
    }
    content_layout_ = content_layout_builder.finish();
  } else {
    // can share the parsed stylesheet
    std::vector<rc_string> urls;
    for (const StyleSource& source : sources) {
      assert(source.text->empty());
      urls.push_back(source.url);
    }
    content_layout_ = container_->get_content_layout(rc_list<rc_string>(urls));
  }
}


//---------------------------------------------------------------------

XMLContentRenderer::XMLContentRenderer(ContainerRenderer* contrend,
    const rc_ref<XMLContentDocument>& doc, const Environment& environment)
        : doc_(doc), contrend_(contrend) {
  content_layout_instance_ = std::unique_ptr<ContentLayoutInstance>(
      new ContentLayoutInstance(doc->content_layout(), doc, environment));
}

XMLContentRenderer::~XMLContentRenderer() {
  contrend_->remove_from_map(this);
}

void XMLContentRenderer::init() {
  content_layout_instance_->init();
}

load::Package* XMLContentRenderer::package() const {
  return container()->package();
}

void XMLContentRenderer::layout_next_page() {
  if (!content_layout_instance_->done()) {
    printf("---- Formatting page %ld  -----\n", pages_.size() + 1);
    pages_.push_back(content_layout_instance_->next_page(this));
  }
}

}
}
