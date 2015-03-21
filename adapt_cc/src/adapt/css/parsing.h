#ifndef adapt_css_parsing_h
#define adapt_css_parsing_h

#include "adapt/css/parser.h"
#include "adapt/dom/dom.h"
#include "adapt/expr/expr.h"

namespace adapt {
namespace css {

static const cascade_priority_t PRI_USER_AGENT_BASE = 0;
static const cascade_priority_t PRI_USER_AGENT_IMPORTANT = 0;
static const cascade_priority_t PRI_AUTHOR_BASE = PRI_ORIGIN_UNIT;
static const cascade_priority_t PRI_AUTHOR_IMPORTANT = 2 * PRI_ORIGIN_UNIT;
static const cascade_priority_t PRI_USER_BASE = 3 * PRI_ORIGIN_UNIT;
static const cascade_priority_t PRI_USER_IMPORTANT = 4 * PRI_ORIGIN_UNIT;


class DispatchingParserHandler : public ParserHandler {
 public:
  void push_handler(std::unique_ptr<ParserHandler> slave);
  void pop_handler();
  virtual rc_ref<expr::Scope> scope();
  virtual void error(const rc_string& mnemonics);
  virtual void start_stylesheet(cascade_priority_t base_priority,
      cascade_priority_t important_priority);
  virtual void tag_selector(const rc_qname& name);
  virtual void class_selector(const rc_qname& name);
  virtual void pseudoclass_selector(const rc_qname& name,
     const rc_list<rc_value>& params);
  virtual void pseudoelement_selector(const rc_qname& name,
     const rc_list<rc_value>& params);
  virtual void id_selector(const rc_qname& name);
  virtual void attribute_selector(const rc_qname& name,
     TokenType op, const rc_string& value);
  virtual void descendant_selector();
  virtual void child_selector();
  virtual void adjacent_sibling_selector();
  virtual void following_sibling_selector();
  virtual void next_selector();
  virtual void start_selector_rule();
  virtual void start_font_face_rule();
  virtual void start_footnote_rule(const rc_qname& name);
  virtual void start_viewport_rule();
  virtual void start_define_rule();
  virtual void start_region_rule();
  virtual void start_when_rule(const rc_ref<CSSExpr>& cond);
  virtual void start_media_rule(const rc_ref<CSSExpr>& cond);
  virtual void start_flow_rule(const rc_qname& name);
  virtual void start_page_template_rule();
  virtual void start_page_master_rule(const rc_qname& name,
      const rc_qname& pseudoname, const rc_list<rc_qname>& classes);
  virtual void start_partition_group_rule(const rc_qname& name,
      const rc_qname& pseudoname, const rc_list<rc_qname>& classes);
  virtual void start_partition_rule(const rc_qname& name,
      const rc_qname& pseudoname, const rc_list<rc_qname>& classes);
  virtual void start_rule_body();
  virtual void property(const rc_qname& name, const rc_ref<CSSValue>& value,
      bool important);
  virtual void end_rule();
  void finish_stylesheet();

  cascade_priority_t priority(bool important) const {
    return important ? important_priority_ : base_priority_;
  }

 private:
  std::unique_ptr<ParserHandler> slave_;
  std::stack<std::unique_ptr<ParserHandler>> handler_stack_;
  cascade_priority_t base_priority_;
  cascade_priority_t important_priority_;
};

class SkippingParserHandler : public ParserHandler {
public:
  SkippingParserHandler(const rc_ref<expr::Scope>& scope,
      DispatchingParserHandler* owner, bool top_level);
  ~SkippingParserHandler();

  virtual rc_ref<expr::Scope> scope();
  virtual void start_rule_body();
  virtual void end_rule();
protected:
  rc_ref<expr::Scope> scope_;
  DispatchingParserHandler* owner_;
  bool top_level_;
  int depth_;
};

class SlaveParserHandler : public SkippingParserHandler {
public:
  SlaveParserHandler(const rc_ref<expr::Scope>& scope,
      DispatchingParserHandler* owner, bool top_level);

  void start_skipping();
  virtual void error(const rc_string& mnemonics);
  virtual void start_selector_rule();
  virtual void start_font_face_rule();
  virtual void start_footnote_rule(const rc_qname& name);
  virtual void start_viewport_rule();
  virtual void start_define_rule();
  virtual void start_region_rule();
  virtual void start_when_rule(const rc_ref<CSSExpr>& cond);
  virtual void start_media_rule(const rc_ref<CSSExpr>& cond);
  virtual void start_flow_rule(const rc_qname& name);
  virtual void start_page_template_rule();
  virtual void start_page_master_rule(const rc_qname& name,
      const rc_qname& pseudoname, const rc_list<rc_qname>& classes);
  virtual void start_partition_group_rule(const rc_qname& name,
      const rc_qname& pseudoname, const rc_list<rc_qname>& classes);
  virtual void start_partition_rule(const rc_qname& name,
      const rc_qname& pseudoname, const rc_list<rc_qname>& classes);
  virtual void property(const rc_qname& name, const rc_ref<CSSValue>& value,
      bool important);
};

class ErrorHandler : public ParserHandler {
 public:
  ErrorHandler(const rc_ref<expr::Scope>& scope)
      : scope_(scope), error_(false) {}

  virtual rc_ref<expr::Scope> scope() override { return scope_; }
  virtual void error(const rc_string& mnemonics) override { error_ = true; }

 private:
  bool error_;
  rc_ref<expr::Scope> scope_;
};

rc_ref<CSSValue> parse_value(const rc_ref<expr::Scope>& scope,
    const rc_string& text, const rc_string& base_url);

rc_ref<expr::Expr> parse_expr(const rc_ref<expr::Scope>& scope,
    const rc_string& text);

}
}

#endif
