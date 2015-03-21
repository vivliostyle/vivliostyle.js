#ifndef adapt_css_cascade_h
#define adapt_css_cascade_h

#include <unordered_map>
#include <unordered_set>

#include "adapt/base/rc_list.h"
#include "adapt/base/rc_map.h"
#include "adapt/base/rc_value.h"
#include "adapt/css/parsing.h"
#include "adapt/css/value.h"
#include "adapt/css/valid.h"
#include "adapt/dom/dom.h"

namespace adapt {
namespace css {

bool is_inherited(const rc_qname& name);
bool is_font_property(const rc_qname& name);
bool is_special_name(const rc_qname& name);
bool is_geometric_name(const rc_qname& name);

const std::unordered_map<rc_qname, rc_qname>& coupling_map(bool vertical);

class CascadeValue : public RefCountedObject {
 public:
  CascadeValue(const rc_ref<CSSValue>& value, cascade_priority_t priority);

  virtual void write_to(Writer* writer) const override;

  virtual rc_ref<CascadeValue> base_value();
  virtual rc_ref<CascadeValue> filter_value(CSSVisitor* filter);
  virtual rc_ref<CascadeValue> increase_priority(cascade_priority_t extra);
  virtual rc_ref<CSSValue> evaluate(expr::Context* context,
      const rc_qname& prop_name);
  virtual bool enabled(expr::Context* context);

  cascade_priority_t priority() const { return priority_; }

  // In most cases evaluate should be used instead.
  const rc_ref<CSSValue>& value() const { return value_; }

  static const char* type_tag();
 protected:
  virtual bool instance_of(const char* type_tag) const;

  const rc_ref<CSSValue> value_;
  const cascade_priority_t priority_;
};

class element_style : public rc_map<rc_value> {
 public:
  element_style() : rc_map(rc_map::empty()) {}
  explicit element_style(const std::map<rc_qname, rc_value>& map)
      : rc_map<rc_value>(map) {}

  const rc_ref<CascadeValue>& operator[](const rc_qname& key) const {
    assert(key->ns()->empty());
    const rc_value& v = ptr()->get(key);
    assert(v.is_null() || v->is<rc_ref<CascadeValue>>());
    return *static_cast<const rc_ref<CascadeValue>*>(&v);
  }

  rc_map<element_style> regions() const {
    return rc_nullable_cast<rc_map<element_style>>(ptr()->get(
        rc_qname::atom(ID_PRIVATE_regions)));
  }

  rc_map<element_style> pseudos() const {
    return rc_nullable_cast<rc_map<element_style>>(ptr()->get(
        rc_qname::atom(ID_PRIVATE_pseudos)));
  }
};

class StyleAttributeParser : public dom::SingleAttributeParser {
 public:
  StyleAttributeParser(CSSValidatorSet* validator_set);
  virtual rc_value parse(const rc_string& base_url,
     const char* text, size_t length) override;
 private:
  CSSValidatorSet* validator_set_;
};

class ClassAttributeParser : public dom::SingleAttributeParser {
 public:
  virtual rc_value parse(const rc_string& base_url,
      const char* text, size_t length) override;
};
  

class PropertyMap : public RefCountedObject {
 public:
  std::unordered_map<rc_qname, rc_ref<CascadeValue>> properties_;
};

class Cascade;
class CascadeAction;
class ChainedAction;
class CascadeInstance;
class ConditionItem;

class CascadeParserHandler : public SlaveParserHandler {
 public:
  CascadeParserHandler(const rc_ref<expr::Scope>& scope,
      DispatchingParserHandler* owner, const rc_ref<expr::Expr>& condition,
      CascadeParserHandler* parent, const rc_qname& region_id,
      CSSValidatorSet* validator_set, bool top_level);
  ~CascadeParserHandler();

  Cascade* cascade() { return cascade_; }

  virtual void tag_selector(const rc_qname& name) override;
  virtual void class_selector(const rc_qname& name) override;
  virtual void pseudoclass_selector(const rc_qname& name,
      const rc_list<rc_value>& params) override;
  virtual void pseudoelement_selector(const rc_qname& name,
      const rc_list<rc_value>& params) override;
  virtual void id_selector(const rc_qname& name) override;
  virtual void attribute_selector(const rc_qname& name,
      TokenType op, const rc_string& value) override;
  virtual void descendant_selector() override;
  virtual void child_selector() override;
  virtual void adjacent_sibling_selector() override;
  virtual void following_sibling_selector() override;
  virtual void next_selector() override;
  virtual void start_selector_rule() override;
  virtual void start_rule_body() override;
  virtual void property(const rc_qname& name, const rc_ref<CSSValue>& value,
      bool important) override;
  virtual void simple_property(const rc_qname& name,
      const rc_ref<CSSValue>& value, bool important) override;
  virtual void end_rule() override;

 protected:
  void special_property(const rc_qname& name, const rc_ref<CSSValue>& value);

 private:
  void process_chain(std::unique_ptr<CascadeAction> tail);
  void finish_chain();

  Cascade* cascade_;
  std::vector<std::unique_ptr<ChainedAction>> chain_;
  rc_ref<PropertyMap> property_map_;
  rc_qname pseudoelement_;
  bool footnote_content_ = false;
  bool expect_rule_ = true;

 protected:
  CSSValidatorSet* const validator_set_;
  cascade_priority_t specificity_ = 0;
	rc_ref<expr::Expr> condition_;
  rc_qname region_id_;
};

typedef std::unordered_map<rc_qname, std::unique_ptr<CascadeAction>>
    ActionTable;

class Cascade : public RefCountedObject {
  friend class CascadeParserHandler;
  friend class CascadeInstance;
  friend class CascadeAction;
  friend class ConditionItem;
 public:
  Cascade();
  ~Cascade();

 private:
  ActionTable tags_;
  ActionTable ns_tags_;
  ActionTable epubtypes_;
  ActionTable classes_;
  ActionTable ids_;
  unsigned int order_;
  unsigned int condition_count_ = 0;
};

class CascadeInstance {
  friend class ConditionItem;
  friend class CascadeAction;
 public:
  CascadeInstance(Cascade* cascade, expr::Context* context,
      const rc_qname& lang);

  element_style push_rule(const rc_value& classes,
      const rc_map<rc_ref<CascadeValue>>& base_style);
  element_style push_element(const dom::DOM::iterator& element);
  void pop_rule();
  element_style pop_element(const dom::DOM::iterator& element);

  expr::Context* context() { return context_; }

  struct CascadeElementStyle {
    std::unordered_map<rc_qname, rc_ref<CascadeValue>> props;
    std::unordered_map<rc_qname, std::vector<rc_ref<CascadeValue>>> specials;
    std::unordered_map<rc_qname, CascadeElementStyle> pseudos;
    std::unordered_map<rc_qname, CascadeElementStyle> regions;
    element_style to_element_style() const;
  };
  
 private:
  void apply_action(const ActionTable& table, const rc_qname& key);
  void set_base_style(const rc_map<rc_ref<CascadeValue>>& base);
  void set_classes(const rc_value& classes);
  void push_condition_item(ConditionItem* item);
  void apply_actions();
  void clear_style_and_classes();
  void pop();

  Cascade* cascade_;
  dom::DOM::iterator current_element_;
  std::vector<int> conditions_;
  std::vector<std::vector<rc_ref<ConditionItem>>> condition_item_stack_;
  expr::Context* context_;
  CascadeElementStyle current_style_;
  rc_qname current_tag_;
  std::unordered_set<rc_qname> current_classes_;
  rc_qname current_id_;
  rc_qname current_xml_id_;
  std::unordered_set<rc_qname> current_epubtypes_;
  bool is_first_;
  std::unordered_set<rc_qname, std::vector<int>> counters_;
  std::vector<std::unordered_set<rc_qname>> counter_scoping_;
  std::vector<rc_string> quotes_;
  std::vector<element_style> style_stack_;
  int quote_depth_;
  rc_qname lang_;
};

}
}



#endif
