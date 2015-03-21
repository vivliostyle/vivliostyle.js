#include <stdio.h>

#include "adapt/base/rc_value.h"
#include "adapt/base/rc_string.h"
#include "adapt/base/rc_map.h"
#include "adapt/base/rc_list.h"
#include "adapt/base/rc_primitive.h"
#include "adapt/load/app_package.h"
#include "adapt/dom/dom.h"
#include "adapt/dom/dom_serializer.h"
#include "adapt/css/cascade.h"
#include "adapt/css/parsing.h"
#include "adapt/css/styler.h"
#include "adapt/css/tok.h"
#include "adapt/css/valid.h"
#include "adapt/css/value.h"
#include "adapt/expr/expr.h"
#include "adapt/layout/engine.h"
#include "adapt/layout/page.h"
#include "adapt/layout/view_iterator.h"
#include "adapt/text/inline_formatter_mac.h"
#include "adapt/render/render_mac.h"
#include "adapt/load/folder_package.h"

using namespace adapt;
using namespace adapt::css;

extern "C" int main_0(int argc, char* argv[]) {
  rc_qname name1("my ns", "foo");
  rc_qname name2("my ns", "foo");
  Writer::stdout() << name1 << " eq:" << (name1.ptr() == name2.ptr()) << "\n";

  std::map<rc_qname, rc_value> mmap;
  mmap[rc_qname("key1")] = rc_string("test1");
  mmap[rc_qname("key2")] = rc_string("test2");
  mmap[rc_qname("keyZ")] = rc_string("testZ");
  mmap[rc_qname("a")] = rc_list<rc_string>::of(rc_string("A1"), rc_string("A2"),
                                    rc_string("A3"), rc_string("A4"));
  mmap[rc_qname("b")] = rc_list<rc_value>::of(rc_value(new CSSColor(0x3423FE)),
                                    rc_value(new CSSIdent("bl #ah", 6)));
  mmap[rc_qname("ZZZ")] = rc_value();
  rc_map<rc_value> map(mmap);
  Writer::stdout() << "Map: " << map << " map[key2]="
      << map[rc_qname("key2")] << "\n";

  dom::DOM* dom = new dom::DOM("blah");
  dom::AttributeParser attr_parser;
  dom::Parser* parser = dom::Parser::create(dom->builder(&attr_parser));
  const char * xml = "<foo xmlns='http://blah'><bar a='1' b='2'>aaaass</bar></foo>";
  parser->write((unsigned char*)xml, strlen(xml));
  parser->close();
  Writer::stdout() << dom->root() << "\n";

  const char* css = ".foo bar { font-size: 20pt; font-family: 'blubb\\21 aaa'; }";
  Tokenizer tk(css, strlen(css));

  while(true) {
    const Token& t = tk.token();
    Writer::stdout() << "Type: " << (int)t.type() << " str:" << t.text()
      << " num:" << t.num() << "\n";
    if (t.type() == TT_EOF) {
      break;
    }
    tk.consume();
  }

  rc_list<rc_string> list(rc_string(" aaa bbb\t  ccc  ")->split_at_whitespace());

  Writer::stdout() << list << "\n";

  return 0;
}

class Handler : public ParserHandler {
 public:
  Handler() {}

  virtual rc_ref<expr::Scope> scope() {
    return expr::Scope::common().scope;
  }

  virtual void error(const rc_string& mnemonics) {
    Writer::stdout() << "Error: " << mnemonics << "\n";
  }

  virtual void start_stylesheet(StylesheetFlavor flavor) {

  }

  virtual void tag_selector(const rc_qname& name) {
    Writer::stdout() << name;
  }

  virtual void class_selector(const rc_qname& name) {
    Writer::stdout() << "." << name;
  }

  virtual void pseudoclass_selector(const rc_qname& name,
                                    const rc_list<rc_value>& params) {
    Writer::stdout() << ":" << name;
  }

  virtual void pseudoelement_selector(const rc_qname& name,
                                      const rc_list<rc_value>& params) {
    Writer::stdout() << "::" << name;
  }

  virtual void id_selector(const rc_qname& name) {
    Writer::stdout() << "#" << name;
  }

  virtual void attribute_selector(const rc_qname& name,
                                  TokenType op, const rc_string& value) {
    Writer::stdout() << "[" << name << "/" << (int)op << "/" << value << "]";
  }

  virtual void descendant_selector() {
    Writer::stdout() << " ";
  }

  virtual void child_selector() {
    Writer::stdout() << " > ";
  }

  virtual void adjacent_sibling_selector() {
    Writer::stdout() << " + ";
  }

  virtual void following_sibling_selector() {
    Writer::stdout() << " ~ ";
  }

  virtual void next_selector() {
    Writer::stdout() << ", ";
  }

  virtual void start_selector_rule() {
    Writer::stdout() << "@selector ";
  }

  virtual void start_font_face_rule() {
    Writer::stdout() << "@font-face ";
  }

  virtual void start_footnote_rule(const rc_qname& name) {
    Writer::stdout() << "@footnote " << name;
  }

  virtual void start_viewport_rule() {
    Writer::stdout() << "@viewport ";
  }

  virtual void start_define_rule() {
    Writer::stdout() << "@define ";
  }

  virtual void start_region_rule() {
    Writer::stdout() << "@region ";
  }

  virtual void start_when_rule(const rc_ref<expr::Expr>& cond) {
    Writer::stdout() << "@when " << cond;
  }

  virtual void start_media_rule(const rc_ref<expr::Expr>& cond) {
    Writer::stdout() << "@media " << cond;
  }

  virtual void start_flow_rule(const rc_qname& name) {
    Writer::stdout() << "@flow " << name;
  }

  virtual void start_page_template_rule() {
    Writer::stdout() << "@page-template ";
  }

  virtual void start_page_master_rule(const rc_qname& name,
      const rc_qname& pseudoname, const rc_list<rc_qname>& classes) {
    Writer::stdout() << "@page-master " << name << " :" << pseudoname
        << classes;
  }

  virtual void start_partition_group_rule(const rc_qname& name,
      const rc_qname& pseudoname, const rc_list<rc_qname>& classes) {
    Writer::stdout() << "@partition-group " << name << " :" << pseudoname
        << classes;
  }

  virtual void start_partition_rule(const rc_qname& name,
      const rc_qname& pseudoname, const rc_list<rc_qname>& classes) {
    Writer::stdout() << "@partition " << name << " :" << pseudoname
        << classes;
  }

  virtual void start_rule_body() {
    Writer::stdout() << " {\n";
  }

  virtual void property(const rc_qname& name, const rc_ref<CSSValue>& value,
                        bool important) {
    Writer::stdout() << "  " << name << ": " << value;
    if (important) {
      Writer::stdout() << "!important";
    }
    Writer::stdout() << ";\n";
  }

  virtual void end_rule() {
    Writer::stdout() << "}\n\n";
  }

};

extern "C" int main_1(int argc, char* argv[]) {
  Handler handler;
  StringWriter sw;
  size_t len;
  char buf[2048];
  while ((len = fread(buf, 1, 2048, stdin)) > 0) {
    sw.write(buf, len);
  }
  rc_string input = sw.to_string();
  Parser parser(Parser::STYLESHEET, input->utf8(), input->length(), &handler,
                rc_string::empty_string());
  parser.run_parser(10000000);
  return 0;
}

void test_skia();

void print_styles(dom::DOM::iterator element, Styler* styler) {
  element_style s = styler->get_style(element, false);
  Writer::stdout() << "<" << element->qname()->local() << " style='"
    << s << "'>\n";
  if (element.has_children()) {
    for (dom::DOM::iterator child = element.begin();
        child != element.end(); ++child) {
      print_styles(child, styler);
    }
  }
  Writer::stdout() << "</" << element->qname()->local() << ">\n";
}

void parse_styles(const dom::Element& element, css::ParserHandler* handler) {
  if (element.qname()->id() == ID_XHTML_style) {
    const rc_string& css = element.leading_text();
    Parser parser(Parser::STYLESHEET, css->utf8(),
                  css->length(), handler, rc_string::empty_string());
    parser.run_parser(10000000);
  } else if (element.children()) {
    for (const dom::Element& child : *element.children()) {
      parse_styles(child, handler);
    }
  }
}

extern "C" int main(int argc, char* argv[]) {
  dom::DOM* dom = new dom::DOM("blah");
  dom::AttributeParser attr_parser;
  attr_parser.add_parser(rc_qname::atom(ID_asterisk), rc_qname::atom(ID_class),
      std::unique_ptr<dom::SingleAttributeParser>(new ClassAttributeParser()));
  dom::Parser* xmlparser = dom::Parser::create(dom->builder(&attr_parser));
  std::unique_ptr<load::Package> package =
      load::create_folder_package("/Users/peter/Sites/content/dev");
  rc_binary src = rc_binary(package->read("test.xhtml"));
  xmlparser->write(src->data(), src->length());
  xmlparser->close();
  rc_binary css =
      rc_binary(load::get_app_package()->read("user-agent-base.css"));
  DispatchingParserHandler handler;
  CascadeParserHandler* cascade_handler = new CascadeParserHandler(
      expr::Scope::common().scope, &handler, rc_ref<expr::Expr>(),
      nullptr, rc_qname::atom(ID_EMPTY), CSSValidatorSet::default_validator(),
      true);
  handler.push_handler(std::unique_ptr<ParserHandler>(cascade_handler));
  Parser parser(Parser::STYLESHEET, reinterpret_cast<const char*>(css->data()),
      css->length(), &handler, rc_string::empty_string());
  parser.run_parser(10000000);
  parse_styles(*dom->root(), &handler);
  Cascade* cascade = cascade_handler->cascade();
  expr::Context* context = new expr::Context();
  Styler styler(dom, cascade, expr::Scope::common().scope, context,
      std::unordered_set<rc_qname>());
  print_styles(dom->root(), &styler);
  layout::Page page(612, 792);
  text::MacInlineFormatterFactory inline_factory;
  css::RelativeSizes sizes {
    css::BoxRelativeSizes {612, 792},
    css::FontRelativeSizes {16, 8, 8},
    css::ViewportRelativeSizes {612, 792, 16}
  };
  layout::ViewIterator view_iterator(package.get(), rc_qname::atom(ID_EMPTY),
      context, sizes, nullptr, &styler, std::set<rc_qname>(), nullptr,
      css::element_style(), &page, nullptr, std::unordered_map<rc_string,
      rc_string>());
  layout::LayoutEngine layout_engine(package.get(), page.root(), context,
      &view_iterator, &inline_factory);
  Writer::stdout() << dom->root() << "\n";
  layout::ChunkPosition position;
  position.primary.steps.push_back(layout::NodePosition::Step(dom->root()));
  layout_engine.layout(position);
  std::map<rc_qname, rc_value> metadata;
  metadata[rc_qname::atom(ID_DC_title)] = rc_string("Test Document");
  std::unique_ptr<render::Renderer> renderer = render::create_pdf_renderer_mac(
      "/Users/peter/test_rend.pdf", 612, 792, metadata);
  renderer->render(&page, geom::Rectangle::from_xywh(0, 0, 612, 792));
  delete context;
  delete cascade;
  delete dom;
}
