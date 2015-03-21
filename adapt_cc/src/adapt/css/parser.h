#ifndef adapt_css_parser_h
#define adapt_css_parser_h

#include <stack>
#include <unordered_map>

#include "adapt/css/value.h"
#include "adapt/css/tok.h"
#include "adapt/expr/expr.h"

namespace adapt {
namespace css {

  /*
enum StylesheetFlavor {
  AUTHOR = 0,
  USER_AGENT = 1,
  USER = 2
};
   */

// Interface for a CSS property value validator
class PropertyReceiver {
 public:
  virtual void unknown_property(const rc_qname& name,
      const rc_ref<CSSValue>& value) {}
  virtual void invalid_property_value(const rc_qname& name,
      const rc_ref<CSSValue>& value) {}
  virtual void simple_property(const rc_qname& name,
      const rc_ref<CSSValue>& value, bool important) {}
};

// SAX-like callback interface for CSS parser
class ParserHandler : public PropertyReceiver {
 public:
  ParserHandler();
  virtual ~ParserHandler();

  // Used to create expr::Expr objects in the parser.
  virtual rc_ref<expr::Scope> scope() = 0;

  virtual void error(const rc_string& mnemonics) {}
  virtual void start_stylesheet(cascade_priority_t base_priority,
      cascade_priority_t important_priority) {}
  virtual void tag_selector(const rc_qname& name) {}
  virtual void class_selector(const rc_qname& name) {}
  virtual void pseudoclass_selector(const rc_qname& name,
      const rc_list<rc_value>& params) {}
  virtual void pseudoelement_selector(const rc_qname& name,
      const rc_list<rc_value>& params) {}
  virtual void id_selector(const rc_qname& name) {}
  virtual void attribute_selector(const rc_qname& name,
      TokenType op, const rc_string& value) {}
  virtual void descendant_selector() {}
  virtual void child_selector() {}
  virtual void adjacent_sibling_selector() {}
  virtual void following_sibling_selector() {}
  virtual void next_selector() {}
  virtual void start_selector_rule() {}
  virtual void start_font_face_rule() {}
  virtual void start_footnote_rule(const rc_qname& name) {}
  virtual void start_viewport_rule() {}
  virtual void start_define_rule() {}
  virtual void start_region_rule() {}
  virtual void start_when_rule(const rc_ref<CSSExpr>& cond) {}
  virtual void start_media_rule(const rc_ref<CSSExpr>& cond) {}
  virtual void start_flow_rule(const rc_qname& name) {}
  virtual void start_page_template_rule() {}
  virtual void start_page_master_rule(const rc_qname& name,
      const rc_qname& pseudoname, const rc_list<rc_qname>& classes) {}
  virtual void start_partition_group_rule(const rc_qname& name,
      const rc_qname& pseudoname, const rc_list<rc_qname>& classes) {}
  virtual void start_partition_rule(const rc_qname& name,
      const rc_qname& pseudoname, const rc_list<rc_qname>& classes) {}
  virtual void start_rule_body() {}
  virtual void property(const rc_qname& name, const rc_ref<CSSValue>& value,
      bool important) {}
  virtual void end_rule() {}
};

class Parser {
 public:

  enum ContentType {
    STYLESHEET,
    PROPERTIES,
    PROPERTY_VALUE
  };

  enum SyntaxContext {
    PROPERTY,
    WHEN,
    MEDIA,
    IMPORT
  };

  Parser(ContentType content_type, const char* input, size_t length,
      ParserHandler* handler, const rc_string& base_url);

  const Tokenizer& tokenizer() const { return tokenizer_; }

  bool run_parser(int count);

  const rc_ref<CSSValue>& result() const { return result_; }
  
 private:
  rc_list<rc_ref<CSSValue>> extract_vals(const rc_qname& sep, size_t index);
  rc_ref<CSSValue> val_stack_reduce(const rc_qname& sep);
  void expr_error(const rc_string& mnemonics);
  void expr_stack_reduce(TokenType op);
  bool expr_stack_close(bool final);
  rc_list<rc_value> read_pseudo_params();
  rc_ref<CSSExpr> make_condition(const rc_string& classes,
      const rc_string& media);
  bool inside_property_only_rule();

	unsigned char* actions_;
	Tokenizer tokenizer_;
	ParserHandler* handler_;
	rc_string base_url_;
  std::vector<rc_value> val_stack_;
  std::unordered_map<rc_string, rc_qname> prefix_to_ns_;
  rc_qname default_ns_;
  rc_qname prop_name_;
  bool prop_important_;
  SyntaxContext expr_syntax_context_;
  rc_ref<CSSValue> result_;
  bool import_ready_;
  rc_string import_url_;
  rc_ref<expr::Expr> import_condition_;
  std::vector<int> error_brackets_;
  std::stack<rc_qname> rule_stack_;
  bool region_rule_;
  ContentType content_type_;
};

}
}

#endif
