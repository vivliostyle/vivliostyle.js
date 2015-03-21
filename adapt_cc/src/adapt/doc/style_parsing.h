#ifndef adapt_doc_style_parsing_h
#define adapt_doc_style_parsing_h

#include <memory>
#include <unordered_map>
#include <vector>

#include "adapt/base/rc_string.h"
#include "adapt/load/package.h"
#include "adapt/base/rc_list.h"
#include "adapt/css/cascade.h"
#include "adapt/css/parsing.h"
#include "adapt/css/valid.h"
#include "adapt/expr/expr.h"
#include "adapt/pm/page_box.h"
#include "adapt/doc/content_layout.h"

namespace adapt {
namespace doc {

class ContainerDocument;
class ContentLayoutBuilder;

class BaseParserHandler : public css::CascadeParserHandler {
 public:
  BaseParserHandler(ContentLayoutBuilder* builder,
      const rc_ref<expr::Expr>& condition, css::CascadeParserHandler* parent,
      const rc_qname& region_id);
  virtual ~BaseParserHandler() override;
  virtual void start_page_template_rule() override;
  virtual void start_when_rule(const rc_ref<css::CSSExpr>& cond) override;
  virtual void start_media_rule(const rc_ref<css::CSSExpr>& cond) override;
  virtual void start_define_rule() override;
  virtual void start_region_rule() override;
  virtual void start_page_master_rule(const rc_qname& name,
      const rc_qname& pseudoname, const rc_list<rc_qname>& classes);
  virtual void start_rule_body() override;

  void set_top_scope(const rc_ref<expr::Scope>& scope) {
    scope_ = scope;
  }
  
  void set_page_scope(const rc_ref<expr::Scope>& scope) {
    page_scope_ = scope;
  }

 private:
  ContentLayoutBuilder* builder_;
  rc_ref<expr::Scope> page_scope_;
  bool inside_region_ = false;
};

class ContentLayoutBuilder {
  friend class BaseParserHandler;
 public:
  void init(ContainerDocument* document);
  void parse_from_url(const rc_string& url);
  void parse_from_text(const rc_string& base_url, const rc_string& text);
  rc_ref<ContentLayout> finish();

 private:
  struct ScopePair {
    rc_ref<expr::Scope> top_scope;
    rc_ref<expr::Scope> page_scope;
  };

  void start_stylesheet(const rc_string& base_url);

  ContainerDocument* document_ = nullptr;
  css::DispatchingParserHandler handler_;
  BaseParserHandler* cascade_handler_ = nullptr;
  css::CSSValidatorSet* validator_set_ = nullptr;
  std::unordered_map<rc_string, ScopePair> stylesheet_scopes_;
  std::vector<rc_ref<pm::PageMaster>> page_masters_;
  rc_ref<expr::Scope> root_scope_;
  int region_count_ = 0;
};


}
}



#endif
