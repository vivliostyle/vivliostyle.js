#include "adapt/css/parsing.h"

#include <limits>

namespace adapt {
namespace css {

//------------------------ DispatchingParserHandler ---------------------------

void DispatchingParserHandler::push_handler(
    std::unique_ptr<ParserHandler> slave) {
  handler_stack_.push(std::move(slave_));
  slave_ = std::move(slave);
};

void DispatchingParserHandler::pop_handler() {
  if (handler_stack_.size() > 1) {
    slave_ = std::move(handler_stack_.top());
    handler_stack_.pop();
  } else {
    error("E_CSS_EXTRA_CLOSING_BRACES");
  }
};

rc_ref<expr::Scope> DispatchingParserHandler::scope() {
  return slave_->scope();
}

void DispatchingParserHandler::error(const rc_string& mnemonics) {
  slave_->error(mnemonics);
}

void DispatchingParserHandler::start_stylesheet(
    cascade_priority_t base_priority, cascade_priority_t important_priority) {
  base_priority_ = base_priority;
  important_priority_ = important_priority;
  slave_->start_stylesheet(base_priority, important_priority);
}

void DispatchingParserHandler::tag_selector(const rc_qname& name) {
  slave_->tag_selector(name);
}

void DispatchingParserHandler::class_selector(const rc_qname& name) {
  slave_->class_selector(name);
}

void DispatchingParserHandler::pseudoclass_selector(const rc_qname& name,
    const rc_list<rc_value>& params) {
  slave_->pseudoclass_selector(name, params);
}

void DispatchingParserHandler::pseudoelement_selector(const rc_qname& name,
    const rc_list<rc_value>& params) {
  slave_->pseudoelement_selector(name, params);
}

void DispatchingParserHandler::id_selector(const rc_qname& name) {
  slave_->id_selector(name);
}

void DispatchingParserHandler::attribute_selector(const rc_qname& name,
    TokenType op, const rc_string& value) {
  slave_->attribute_selector(name, op, value);
}

void DispatchingParserHandler::descendant_selector() {
  slave_->descendant_selector();
}

void DispatchingParserHandler::child_selector() {
  slave_->child_selector();
}

void DispatchingParserHandler::adjacent_sibling_selector() {
  slave_->adjacent_sibling_selector();
}

void DispatchingParserHandler::following_sibling_selector() {
  slave_->following_sibling_selector();
}

void DispatchingParserHandler::next_selector() {
  slave_->next_selector();
}

void DispatchingParserHandler::start_selector_rule() {
  slave_->start_selector_rule();
}

void DispatchingParserHandler::start_font_face_rule() {
  slave_->start_font_face_rule();
}

void DispatchingParserHandler::start_footnote_rule(const rc_qname& name) {
  slave_->start_footnote_rule(name);
}

void DispatchingParserHandler::start_viewport_rule() {
  slave_->start_viewport_rule();
}

void DispatchingParserHandler::start_define_rule() {
  slave_->start_define_rule();
}

void DispatchingParserHandler::start_region_rule() {
  slave_->start_region_rule();
}

void DispatchingParserHandler::start_when_rule(const rc_ref<CSSExpr>& cond) {
  slave_->start_when_rule(cond);
}

void DispatchingParserHandler::start_media_rule(const rc_ref<CSSExpr>& cond) {
  slave_->start_media_rule(cond);
}

void DispatchingParserHandler::start_flow_rule(const rc_qname& name) {
  slave_->start_flow_rule(name);
}

void DispatchingParserHandler::start_page_template_rule() {
  slave_->start_page_template_rule();
}

void DispatchingParserHandler::start_page_master_rule(const rc_qname& name,
    const rc_qname& pseudoname, const rc_list<rc_qname>& classes) {
  slave_->start_page_master_rule(name, pseudoname, classes);
}

void DispatchingParserHandler::start_partition_group_rule(const rc_qname& name,
    const rc_qname& pseudoname, const rc_list<rc_qname>& classes) {
  slave_->start_partition_group_rule(name, pseudoname, classes);
}

void DispatchingParserHandler::start_partition_rule(const rc_qname& name,
    const rc_qname& pseudoname, const rc_list<rc_qname>& classes) {
  slave_->start_partition_rule(name, pseudoname, classes);
}

void DispatchingParserHandler::start_rule_body() {
  slave_->start_rule_body();
}

void DispatchingParserHandler::property(const rc_qname& name,
    const rc_ref<CSSValue>& value, bool important) {
  slave_->property(name, value, important);
}

void DispatchingParserHandler::end_rule() {
  slave_->end_rule();
}

void DispatchingParserHandler::finish_stylesheet() {
  if (handler_stack_.size() > 1) {
    error("E_CSS_UNCLOSED_RULES");
  }
  // Clear out all unclosed rules in the stylesheet.
  while (handler_stack_.size() > 1) {
    pop_handler();
  }
}


//----------------------- SkippingParserHandler -----------------------------

SkippingParserHandler::SkippingParserHandler(
    const rc_ref<expr::Scope>& scope, DispatchingParserHandler* owner,
    bool top_level)
        : scope_(scope), depth_(0), top_level_(top_level), owner_(owner) {}

SkippingParserHandler::~SkippingParserHandler() {}

rc_ref<expr::Scope> SkippingParserHandler::scope() {
  return scope_;
}

void SkippingParserHandler::start_rule_body() {
  depth_++;
}

void SkippingParserHandler::end_rule() {
  if (--depth_ == 0 && !top_level_) {
    owner_->pop_handler();  // will destroy this.
  }
}

//---------------------- SlaveParserHandler ----------------------------------

SlaveParserHandler::SlaveParserHandler(const rc_ref<expr::Scope>& scope,
    DispatchingParserHandler* owner, bool top_level)
        : SkippingParserHandler(scope, owner, top_level) {}

void SlaveParserHandler::start_skipping() {
  owner_->push_handler(std::unique_ptr<ParserHandler>(
      new SkippingParserHandler(scope_, owner_, false)));
}

void SlaveParserHandler::error(const rc_string& mnemonics) {
  fprintf(stderr, "Error: %s\n", mnemonics->utf8());
  start_skipping();
}

void SlaveParserHandler::start_selector_rule() {
  error("E_CSS_UNEXPECTED_SELECTOR");
}

void SlaveParserHandler::start_font_face_rule() {
  error("E_CSS_UNEXPECTED_FONT_FACE");
}

void SlaveParserHandler::start_footnote_rule(const rc_qname& name) {
  error("E_CSS_UNEXPECTED_FOOTNOTE");
}

void SlaveParserHandler::start_viewport_rule() {
  error("E_CSS_UNEXPECTED_VIEWPORT");
}

void SlaveParserHandler::start_define_rule() {
  error("E_CSS_UNEXPECTED_DEFINE");
}

void SlaveParserHandler::start_region_rule() {
  error("E_CSS_UNEXPECTED_REGION");
}

void SlaveParserHandler::start_when_rule(const rc_ref<CSSExpr>& cond) {
  error("E_CSS_UNEXPECTED_WHEN");
}

void SlaveParserHandler::start_media_rule(const rc_ref<CSSExpr>& cond) {
  error("E_CSS_UNEXPECTED_MEDIA");
}

void SlaveParserHandler::start_flow_rule(const rc_qname& name) {
  error("E_CSS_UNEXPECTED_FLOW");
}

void SlaveParserHandler::start_page_template_rule() {
  error("E_CSS_UNEXPECTED_PAGE_TEMPLATE");
}

void SlaveParserHandler::start_page_master_rule(const rc_qname& name,
    const rc_qname& pseudoname, const rc_list<rc_qname>& classes) {
  error("E_CSS_UNEXPECTED_PAGE_MASTER");
}

void SlaveParserHandler::start_partition_group_rule(const rc_qname& name,
    const rc_qname& pseudoname, const rc_list<rc_qname>& classes) {
  error("E_CSS_UNEXPECTED_PARTITION_GROUP");
}

void SlaveParserHandler::start_partition_rule(const rc_qname& name,
    const rc_qname& pseudoname, const rc_list<rc_qname>& classes) {
  error("E_CSS_UNEXPECTED_PARTITION");
}

void SlaveParserHandler::property(const rc_qname& name,
    const rc_ref<CSSValue>& value, bool important) {
  error("E_CSS_UNEXPECTED_PROPERTY");
}

//--------------------- parse_value -------------------------------------

rc_ref<CSSValue> parse_value(const rc_ref<expr::Scope>& scope,
    const rc_string& text, const rc_string& base_url) {
  ErrorHandler handler(scope);
  Parser parser(Parser::PROPERTY_VALUE, text->utf8(), text->length(),
      &handler, base_url);
  parser.run_parser(std::numeric_limits<int>::max());
  return parser.result();
}

// For testing only
rc_ref<expr::Expr> parse_expr(const rc_ref<expr::Scope>& scope,
    const rc_string& text) {
  StringWriter w;
  w << "-epubx-expr(" << text << ")";
  rc_ref<CSSValue> val = parse_value(scope, w.to_string(), rc_string());
  if (!val.is_null()) {
    return rc_cast<rc_ref<CSSExpr>>(val)->expr();
  }
  return rc_ref<expr::Expr>();
}

}
}


