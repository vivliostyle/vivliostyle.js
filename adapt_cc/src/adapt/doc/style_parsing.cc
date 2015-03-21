#include "adapt/doc/style_parsing.h"

#include "adapt/load/app_package.h"
#include "adapt/doc/container.h"
#include "adapt/doc/environment.h"
#include "adapt/doc/content_layout.h"
#include "adapt/pm/parsing.h"

namespace adapt {
namespace doc {

namespace {

class DefineParserHandler : public css::SlaveParserHandler {
 public:
  DefineParserHandler(const rc_ref<expr::Scope>& scope,
      css::DispatchingParserHandler* owner)
          : SlaveParserHandler(scope, owner, false) {}

  virtual void property(const rc_qname& name,
      const rc_ref<css::CSSValue>& value, bool important) override {
    rc_qname unit = rc_qname::atom(ID_vw);
    rc_qname local = name->local();
    if (local->to_string()->find_first("height") != rc_string::npos ||
        local->id() == ID_top || local->id() == ID_bottom) {
      unit = rc_qname::atom(ID_vh);
    }
    rc_ref<expr::Expr> dim = new expr::ExprNumeric(100, unit);
    scope_->define_name(name, value->to_expr(scope_.ptr(), dim));
  }
};


}

BaseParserHandler::BaseParserHandler(ContentLayoutBuilder* builder,
    const rc_ref<expr::Expr>& condition, css::CascadeParserHandler* parent,
    const rc_qname& region_id)
        : CascadeParserHandler(builder->root_scope_, &builder->handler_,
              condition, parent, region_id, builder->validator_set_,
              parent == nullptr), builder_(builder) {}

BaseParserHandler::~BaseParserHandler() {
}

void BaseParserHandler::start_page_template_rule() {
  // Just need this not to register an error.
}

void BaseParserHandler::start_when_rule(const rc_ref<css::CSSExpr>& cond) {
  assert(cond->scope().ptr() == scope_.ptr());
  rc_ref<expr::Expr> condition = cond->expr();
  if (!condition_.is_null()) {
    condition = condition_ && condition;
  }
  BaseParserHandler* handler =
      new BaseParserHandler(builder_, condition, this, region_id_);
  handler->set_top_scope(scope_);
  handler->set_page_scope(page_scope_);
  owner_->push_handler(std::unique_ptr<css::ParserHandler>(handler));
}

void BaseParserHandler::start_media_rule(const rc_ref<css::CSSExpr>& cond) {
  start_when_rule(cond);
}

void BaseParserHandler::start_define_rule() {
  owner_->push_handler(std::unique_ptr<css::ParserHandler>(
      new DefineParserHandler(scope_, owner_)));
}

void BaseParserHandler::start_region_rule() {
  inside_region_ = true;
  start_selector_rule();
}

void BaseParserHandler::start_page_master_rule(const rc_qname& name,
    const rc_qname& pseudoname, const rc_list<rc_qname>& classes) {
  rc_ref<expr::Scope> scope = new expr::Scope(page_scope_.ptr(),
      expr::Scope::PAGE_KEY);
  rc_ref<expr::Expr> cond = condition_;
  if (!cond.is_null() && cond.ptr() != expr::common().v_true.ptr()) {
    // translate to the root scope.
    cond = new expr::ExprFrameAdjust(cond, 2);
  }
  pm::PageMaster* page_master = new pm::PageMaster(scope, name,
      pseudoname, classes, cond, owner_->priority(false));
  builder_->page_masters_.push_back(page_master);
  owner_->push_handler(std::unique_ptr<css::ParserHandler>(
      new pm::PageMasterParserHandler(scope, owner_, page_master,
          validator_set_)));
}

void BaseParserHandler::start_rule_body() {
  CascadeParserHandler::start_rule_body();
  if (inside_region_) {
    inside_region_ = false;
    StringWriter w;
    w << "R" << builder_->region_count_++;
    rc_qname region_id(w.to_string());
    special_property(rc_qname::atom(ID_PRIVATE_regionid),
        new css::CSSIdent(region_id));
    end_rule();
    BaseParserHandler* region_handler = new BaseParserHandler(builder_,
        condition_, this, region_id);
    region_handler->set_top_scope(scope_);
    region_handler->set_page_scope(page_scope_);
    region_handler->start_rule_body();
    owner_->push_handler(std::unique_ptr<css::ParserHandler>(region_handler));
  }
}

void ContentLayoutBuilder::init(ContainerDocument* document) {
  document_ = document;
  validator_set_ = css::CSSValidatorSet::default_validator();
  root_scope_ = create_root_scope();
  cascade_handler_ = new BaseParserHandler(this,
      rc_ref<adapt::expr::Expr>(), nullptr,
      rc_qname::atom(adapt::ID_EMPTY));
  cascade_handler_->set_top_scope(root_scope_);
  cascade_handler_->set_page_scope(create_page_scope(root_scope_));
  handler_.push_handler(std::unique_ptr<css::ParserHandler>(cascade_handler_));
  handler_.start_stylesheet(css::PRI_USER_AGENT_BASE,
      css::PRI_USER_AGENT_IMPORTANT);
  adapt::rc_binary ua_css(load::get_app_package()->read("user-agent.css"));
  adapt::css::Parser ua_parser(adapt::css::Parser::STYLESHEET,
      reinterpret_cast<const char*>(ua_css->data()), ua_css->length(),
      &handler_, adapt::rc_string::empty_string());
  ua_parser.run_parser(std::numeric_limits<int>::max());
  handler_.finish_stylesheet();
}

void ContentLayoutBuilder::start_stylesheet(const rc_string& base_url) {
  // Each stylesheet has its own expression scope.
  handler_.start_stylesheet(css::PRI_AUTHOR_BASE, css::PRI_AUTHOR_IMPORTANT);
  ScopePair& scope_pair = stylesheet_scopes_[base_url];
  if (scope_pair.top_scope.is_null()) {
    scope_pair.top_scope = new expr::Scope(root_scope_, expr::Scope::ROOT_KEY);
    scope_pair.page_scope = create_page_scope(scope_pair.top_scope);
  }
  cascade_handler_->set_top_scope(scope_pair.top_scope);
  cascade_handler_->set_page_scope(scope_pair.page_scope);
}

void ContentLayoutBuilder::parse_from_url(const rc_string& url) {
  const rc_string& root_url = document_->root_url();
  assert(url->starts_with(root_url));
  start_stylesheet(url);
  adapt::rc_binary css(document_->package()->read(url->substr(
      root_url->length())));
  adapt::css::Parser parser(css::Parser::STYLESHEET,
      reinterpret_cast<const char*>(css->data()), css->length(),
      &handler_, url);
  parser.run_parser(std::numeric_limits<int>::max());
  handler_.finish_stylesheet();
}

void ContentLayoutBuilder::parse_from_text(const rc_string& base_url,
    const rc_string& text) {
  assert(base_url->starts_with(document_->root_url()));
  start_stylesheet(base_url);
  adapt::css::Parser parser(css::Parser::STYLESHEET,
      text->utf8(), text->length(), &handler_, base_url);
  parser.run_parser(std::numeric_limits<int>::max());
  handler_.finish_stylesheet();
}

rc_ref<ContentLayout> ContentLayoutBuilder::finish() {
  return new ContentLayout(root_scope_, cascade_handler_->cascade(),
      rc_list<rc_ref<pm::PageMaster>>(page_masters_));
}

}
}
