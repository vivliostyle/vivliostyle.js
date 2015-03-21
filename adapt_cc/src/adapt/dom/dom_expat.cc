// LibXML2 Parser
#include "adapt/dom/dom_expat.h"
#include "adapt/dom/dom.h"

#include <memory>

#include "third_party/expat/lib/expat.h"

namespace adapt {
namespace dom {

namespace {

class ExpatParser : public Parser {
 public:
  ExpatParser(std::unique_ptr<Builder> builder)
      : builder_(std::move(builder)) {
    parser_ = XML_ParserCreateNS(nullptr, EXPAT_NS_SEPARATOR);
    XML_SetUserData(parser_, this);
    XML_SetElementHandler(parser_, start_element, end_element);
    XML_SetCharacterDataHandler(parser_, character_data);
    XML_SetStartNamespaceDeclHandler(parser_, start_namespace_decl);
  }

  virtual ~ExpatParser() {
    XML_ParserFree(parser_);
  }

  virtual void write(const unsigned char* data, size_t length) {
    XML_Parse(parser_, reinterpret_cast<const char *>(data),
              static_cast<int>(length), 0);
  }

  virtual void close() {
    XML_Parse(parser_, nullptr, 0, 1);
  }

 private:

  static void XMLCALL start_element(void *user_data, const XML_Char *name,
      const XML_Char **atts) {
    static_cast<ExpatParser*>(user_data)->builder_->start_element_expat(
        name, atts);
  }

  static void XMLCALL end_element(void* user_data, const XML_Char* name) {
    static_cast<ExpatParser*>(user_data)->builder_->end_element();
  }

  static void XMLCALL character_data(void *user_data, const XML_Char *s,
      int len) {
    static_cast<ExpatParser*>(user_data)->builder_->characters(s, len);
  }

  static void XMLCALL start_namespace_decl(void *user_data,
      const XML_Char *prefix, const XML_Char *uri) {
    static_cast<ExpatParser*>(user_data)->builder_->add_prefix_mapping(
        prefix, uri);
  }


  std::unique_ptr<Builder> builder_;
  XML_Parser parser_;
};


}  // namespace

Parser* create_expat_parser(std::unique_ptr<Builder> builder) {
  return new ExpatParser(std::move(builder));
}

}
}
