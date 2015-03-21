#include "adapt/css/cascade.h"

#include <map>
#include <unordered_map>

#include "adapt/base/rc_primitive.h"
#include "adapt/css/eval.h"

namespace adapt {
namespace css {

//------------------- CascadeValue ----------------------------------

CascadeValue::CascadeValue(const rc_ref<CSSValue>& value,
    cascade_priority_t priority) : value_(value), priority_(priority) {
  assert(!value.is_null());
  assert(value->is<rc_ref<CSSValue>>());
}

void CascadeValue::write_to(Writer* writer) const {
  *writer << value_ << " !pri" << hex(priority_);
}

rc_ref<CascadeValue> CascadeValue::base_value() {
  return this;
}

rc_ref<CascadeValue> CascadeValue::filter_value(CSSVisitor* filter) {
  rc_ref<CSSValue> value = value_->visit(filter);
  if (value.ptr() == value_.ptr())
    return this;
  return new CascadeValue(value, priority_);
}

rc_ref<CascadeValue> CascadeValue::increase_priority(cascade_priority_t extra) {
  if (extra == 0)
    return this;
  return new CascadeValue(value_, priority_ + extra);
}

rc_ref<CSSValue> CascadeValue::evaluate(expr::Context* context,
    const rc_qname& prop_name) {
  return css::evaluate(context, value_, prop_name);
}

bool CascadeValue::enabled(expr::Context* context) {
  return true;
}

const char* CascadeValue::type_tag() {
  return "CascadeValue";
}

bool CascadeValue::instance_of(const char* type_tag) const {
  return type_tag == CascadeValue::type_tag()
      || RefCountedObject::instance_of(type_tag);
}

//------------------- ConditionalCascadeValue --------------------------
// Internal class, should never make out of cascade engine

namespace {

class ConditionalCascadeValue : public CascadeValue {
 public:
  ConditionalCascadeValue(const rc_ref<CSSValue>& value,
      cascade_priority_t priority, const rc_ref<expr::Expr>& condition,
      const rc_ref<expr::Scope>& scope)
        : CascadeValue(value, priority), condition_(condition), scope_(scope) {
    assert(!condition.is_null());
    assert(condition->is<rc_ref<expr::Expr>>());
  }

  virtual rc_ref<CascadeValue> base_value() override {
    return new CascadeValue(value_, priority_);
  }

  virtual rc_ref<CascadeValue> filter_value(CSSVisitor* filter) override {
    rc_ref<CSSValue> value = value_->visit(filter);
    if (value.ptr() == value_.ptr())
      return this;
    return new ConditionalCascadeValue(value, priority_, condition_, scope_);
  }

  virtual rc_ref<CascadeValue> increase_priority(
      cascade_priority_t extra) override {
    if (extra == 0)
      return this;
    return new ConditionalCascadeValue(value_, priority_ + extra,
        condition_, scope_);
  }

  virtual bool enabled(expr::Context* context) override {
    return as_bool(condition_->evaluate(context, scope_->frames()));
  }
  
  static rc_ref<CascadeValue> cascade(expr::Context* context,
        const rc_ref<CascadeValue>& tv, const rc_ref<CascadeValue>& av) {
    if ((tv.is_null() || av->priority() > tv->priority())
        && av->enabled(context)) {
      return av->base_value();
    }
    return tv;
  };

 private:
  rc_ref<expr::Expr> condition_;
  rc_ref<expr::Scope> scope_;
};

const std::unordered_set<rc_qname>& inherited_properties() {
  static std::unordered_set<rc_qname> map = {
    rc_qname::atom(ID_azimuth),
    rc_qname::atom(ID_border_collapse),
    rc_qname::atom(ID_border_spacing),
    rc_qname::atom(ID_caption_side),
    rc_qname::atom(ID_color),
    rc_qname::atom(ID_cursor),
    rc_qname::atom(ID_direction),
    rc_qname::atom(ID_elevation),
    rc_qname::atom(ID_empty_cells),
    rc_qname::atom(ID_font_size),
    rc_qname::atom(ID_font_family),
    rc_qname::atom(ID_font_style),
    rc_qname::atom(ID_font_variant),
    rc_qname::atom(ID_font_weight),
    rc_qname::atom(ID_letter_spacing),
    rc_qname::atom(ID_line_height),
    rc_qname::atom(ID_list_style_image),
    rc_qname::atom(ID_list_style_position),
    rc_qname::atom(ID_list_style_type),
    rc_qname::atom(ID_orphans),
    rc_qname::atom(ID_pitch_range),
    rc_qname::atom(ID_quotes),
    rc_qname::atom(ID_richness),
    rc_qname::atom(ID_speak_header),
    rc_qname::atom(ID_speak_numeral),
    rc_qname::atom(ID_speak_punctuation),
    rc_qname::atom(ID_speech_rate),
    rc_qname::atom(ID_stress),
    rc_qname::atom(ID_text_align),
    rc_qname::atom(ID_text_indent),
    rc_qname::atom(ID_text_transform),
    rc_qname::atom(ID_visibility),
    rc_qname::atom(ID_voice_family),
    rc_qname::atom(ID_volume),
    rc_qname::atom(ID_white_space),
    rc_qname::atom(ID_widows),
    rc_qname::atom(ID_word_spacing),
    rc_qname::atom(ID_writing_mode)
  };
  return map;
}

const std::unordered_set<rc_qname>& font_properties() {
  static std::unordered_set<rc_qname> map = {
    rc_qname::atom(ID_font_size),
    rc_qname::atom(ID_font_family),
    rc_qname::atom(ID_font_style),
    rc_qname::atom(ID_font_variant),
    rc_qname::atom(ID_font_weight)
  };
  return map;
}

void merge_style(expr::Context* context,
    CascadeInstance::CascadeElementStyle* target,
    const rc_ref<PropertyMap>& prop_map, cascade_priority_t specificity,
    const rc_qname& pseudoelement, const rc_qname& region) {
  if (!pseudoelement.empty()) {
    target = &target->pseudos[pseudoelement];
  }
  if (!region.empty()) {
    target = &target->regions[region];
  }
  for (auto entry : prop_map->properties_) {
    if (is_special_name(entry.first)) {
      // special properties: list of all assigned values
      target->specials[entry.first].push_back(entry.second);
    } else {
      // regular properties: higher priority wins
      auto& pos = target->props[entry.first];
      rc_ref<CascadeValue> av = entry.second->increase_priority(specificity);
      if (pos.is_null()) {
        pos = av;
      } else {
        pos = ConditionalCascadeValue::cascade(context, pos, av);
      }
    }
  }
}

class PropertyParserHandler : public ErrorHandler {
 public:
  PropertyParserHandler(const rc_ref<expr::Scope> scope,
      CSSValidatorSet* validator_set) : ErrorHandler(scope),
          validator_set_(validator_set) {}

  virtual void property(const rc_qname& name, const rc_ref<CSSValue>& value,
      bool important) override {
    validator_set_->validate_property_and_handle_shorthand(
        name, value, important, this);
  }

  virtual void simple_property(const rc_qname& name,
      const rc_ref<CSSValue>& value, bool important) override {
    cascade_priority_t specificity = PRI_ORIGIN_UNIT * (important ? 5 : 4);
    map_[name] = new CascadeValue(value, specificity);
  }

  rc_map<rc_ref<CascadeValue>> style() {
    return rc_map<rc_ref<CascadeValue>>(map_);
  }

 public:
  std::map<rc_qname, rc_ref<CascadeValue>> map_;
  CSSValidatorSet* validator_set_;
};

const char* patterns[] = {
  "margin-%", "margin-%-edge", "padding-%", "padding-%-edge",
  "border-%-width", "border-%-style", "border-%-color", "border-%-edge",
  "%", "%-edge"
};

std::unordered_map<rc_qname, rc_qname> build_coupling_map(
    std::initializer_list<std::pair<const char*, const char*>> args) {
  std::unordered_map<rc_qname, rc_qname> map;
  for (const std::pair<const char*, const char*>& arg : args) {
    for (const char* patt : patterns) {
      rc_string p(patt);
      rc_qname name1(p->replace_first("%", arg.first));
      rc_qname name2(p->replace_first("%", arg.second));
      map[name1] = name2;
      map[name2] = name1;
    }
  }
  return map;
}

const std::unordered_map<rc_qname, rc_qname>& coupling_map_vertical() {
  static std::unordered_map<rc_qname, rc_qname> map = build_coupling_map( {
    {"before", "right"},
    {"after", "left"},
    {"start", "top"},
    {"end", "bottom"}
  });
  return map;
}

const std::unordered_map<rc_qname, rc_qname>& coupling_map_horizontal() {
  static std::unordered_map<rc_qname, rc_qname> map = build_coupling_map( {
    {"before", "top"},
    {"after", "bottom"},
    {"start", "left"},
    {"end", "right"}
  });
  return map;
}

std::unordered_set<rc_qname> build_geometric_name_set() {
  std::unordered_set<rc_qname> set {
    rc_qname::atom(ID_width), rc_qname::atom(ID_height)
  };
  const char* sides[] = {"left", "right", "top", "bottom"};
  for (const char* pattern : patterns) {
    for (const char* side : sides) {
      set.insert(rc_qname(rc_string(pattern)->replace_first("%", side)));
    }
  }
  return set;
}


}

const std::unordered_map<rc_qname, rc_qname>& coupling_map(bool vertical) {
  return vertical ? coupling_map_vertical() : coupling_map_horizontal();
}


bool is_special_name(const rc_qname& name) {
  return name->id() == ID_PRIVATE_regionid;
}

bool is_inherited(const rc_qname& name) {
  return inherited_properties().count(name) > 0;
}

bool is_font_property(const rc_qname& name) {
  return font_properties().count(name) > 0;
}

bool is_geometric_name(const rc_qname& name) {
  static std::unordered_set<rc_qname> set = build_geometric_name_set();
  return set.find(name) != set.end();
}

//------------------------ StyleAttributeParser ---------------------------

StyleAttributeParser::StyleAttributeParser(CSSValidatorSet* validator_set)
    : validator_set_(validator_set) {}


rc_value StyleAttributeParser::parse(const rc_string& base_url,
    const char* text, size_t length) {
  PropertyParserHandler handler(expr::common().scope, validator_set_);
  Parser parser(Parser::PROPERTIES, text, length, &handler, base_url);
  parser.run_parser(std::numeric_limits<int>::max());
  return handler.style();
}

//------------------------ ClassAttributeParser ----------------------------

rc_value ClassAttributeParser::parse(const rc_string& base_url,
    const char* text, size_t length) {
  Tokenizer tok(text, length);
  std::vector<rc_qname> classes;
  while (tok.token().type() == TT_IDENT) {
    classes.push_back(rc_qname(tok.token().text()));
    tok.consume();
  }
  if (classes.size() == 0) {
    return rc_list<rc_qname>::empty();
  }
  if (classes.size() == 1) {
    return classes[0];
  }
  return rc_list<rc_qname>(classes);
}

//---------------------- ConditionItem ------------------------

/**
 * An object that is notified as elements are pushed and popped and typically
 * controls a "named condition" (which is a count associated with a name).
 */
class ConditionItem : public RefCountedObject {
 public:
  ConditionItem(unsigned int condition_index)
      : condition_index_(condition_index) {}

  /**
   * Returns a "fresh" copy of this item. May be this if immutable.
   */
  virtual ConditionItem* fresh() { return this; }

  /**
   * Depth is 0 for element itself and its siblings, 1 for direct children and
   * -1 for the parent.
   */
  virtual bool push(CascadeInstance* cascade_instance, int depth) = 0;

  /**
   * return true if no more notifications are desired
   */
  virtual bool pop(CascadeInstance* cascade_instance, int depth) = 0;

 protected:
  void increment(CascadeInstance* cascade_instance) {
    ++cascade_instance->conditions_[condition_index_];
  }
  void decrement(CascadeInstance* cascade_instance) {
    ++cascade_instance->conditions_[condition_index_];
  }
 protected:
  unsigned int condition_index_;
};

//--------------------- various ConditionItem subclasses -----------------

namespace {

class DescendantConditionItem : public ConditionItem {
 public:
  DescendantConditionItem(unsigned int condition_index)
      : ConditionItem(condition_index) {}

  virtual bool push(CascadeInstance* cascade_instance, int depth) override {
    if (depth == 0) {
	    increment(cascade_instance);
    }
    return false;
  }

  virtual bool pop(CascadeInstance* cascade_instance, int depth) override {
    if (depth == 0) {
	    decrement(cascade_instance);
      return true;
    }
    return false;
  }
};

class ChildConditionItem : public ConditionItem {
 public:
  ChildConditionItem(unsigned int condition_index)
      : ConditionItem(condition_index) {}

  virtual bool push(CascadeInstance* cascade_instance, int depth) override {
    if (depth == 0) {
      increment(cascade_instance);
    } else if (depth == 1) {
      decrement(cascade_instance);
    }
    return false;
  }

  virtual bool pop(CascadeInstance* cascade_instance, int depth) override {
    if (depth == 0) {
      decrement(cascade_instance);
      return true;
    } else if (depth == 1) {
	    increment(cascade_instance);
    }
    return false;
  }
};

class AdjacentSiblingConditionItem : public ConditionItem {
 public:
  AdjacentSiblingConditionItem(unsigned int condition_index)
      : ConditionItem(condition_index), fired_(false) {}

  virtual ConditionItem* fresh() override {
    return new AdjacentSiblingConditionItem(condition_index_);
  }

  virtual bool push(CascadeInstance* cascade_instance, int depth) override {
    if (fired_) {
      decrement(cascade_instance);
      return true;
    }
    return false;
  }

  virtual bool pop(CascadeInstance* cascade_instance, int depth) override {
    if (fired_) {
	    decrement(cascade_instance);
      return true;
    }
    if (depth == 0) {  // Leaving element that triggered this item.
      fired_ = true;
    	increment(cascade_instance);
    }
    return false;
  }

 private:
  bool fired_;
};

class FollowingSiblingConditionItem : public ConditionItem {
 public:
  FollowingSiblingConditionItem(unsigned int condition_index)
      : ConditionItem(condition_index) {}

  virtual ConditionItem* fresh() override {
    return new FollowingSiblingConditionItem(condition_index_);
  }

  virtual bool push(CascadeInstance* cascade_instance, int depth) override {
    if (fired_) {
      if (depth == -1) {
        increment(cascade_instance);
      } else if (depth == 0) {
		    decrement(cascade_instance);
      }
    }
    return false;
  }

  virtual bool pop(CascadeInstance* cascade_instance, int depth) override {
    if (fired_) {
      if (depth == -1) {
        decrement(cascade_instance);
        return true;
      } else if (depth == 0) {
		    increment(cascade_instance);
      }
    } else {
      if (depth == 0) {
        // Leaving element that triggered this item.
        fired_ = true;
	    	increment(cascade_instance);
      }
    }
    return false;
  }

private:
  bool fired_;
};



}

//----------------------- CascadeAction ----------------------------------

class CascadeAction {
  friend class CascadeParserHandler;
 public:
  virtual void apply(CascadeInstance* cascade_instance) = 0;
  virtual bool merge(std::unique_ptr<CascadeAction>& other) { return false; }
  virtual std::unique_ptr<CascadeAction> clone() = 0;

  virtual bool make_primary(CascadeParserHandler* parser_handler) {
    return false;
  }

 protected:

  CascadeInstance::CascadeElementStyle* current_style(
      CascadeInstance* cascade_instance) {
    return &cascade_instance->current_style_;
  }

  const std::unordered_set<rc_qname>& current_classes(
      CascadeInstance* cascade_instance) {
    return cascade_instance->current_classes_;
  }

  const rc_qname& current_id(CascadeInstance* cascade_instance) {
    return cascade_instance->current_id_;
  }

  const rc_qname& current_xml_id(CascadeInstance* cascade_instance) {
    return cascade_instance->current_xml_id_;
  }

  const rc_qname& current_tag(CascadeInstance* cascade_instance) {
    return cascade_instance->current_tag_;
  }

  const dom::DOM::iterator& current_element(CascadeInstance* cascade_instance) {
    return cascade_instance->current_element_;
  }

  bool check_condition(CascadeInstance* cascade_instance,
      unsigned int condition_index) {
    return cascade_instance->conditions_[condition_index] > 0;
  }

  virtual void push_condition_item(CascadeInstance* cascade_instance,
                                   const rc_ref<ConditionItem>& item) {
    cascade_instance->push_condition_item(item->fresh());
  }

  static std::unique_ptr<CascadeAction> merge_actions(
      std::unique_ptr<CascadeAction> a1, std::unique_ptr<CascadeAction> a2);

  static void insert_in_table(ActionTable& table,
      const rc_qname& key, std::unique_ptr<CascadeAction> action) {
    std::unique_ptr<CascadeAction>& pos = table[key];
    if (pos) {
      pos = merge_actions(std::move(pos), std::move(action));
    } else {
      pos = std::move(action);
    }
  }
  
  static void insert_in_classes(Cascade* cascade, const rc_qname& key,
                         std::unique_ptr<CascadeAction> action) {
    insert_in_table(cascade->classes_, key, std::move(action));
  }

  static void insert_in_tags(Cascade* cascade, const rc_qname& key,
                             std::unique_ptr<CascadeAction> action) {
    insert_in_table(cascade->tags_, key, std::move(action));
  }
  
  static void insert_in_ns_tags(Cascade* cascade, const rc_qname& key,
                             std::unique_ptr<CascadeAction> action) {
    insert_in_table(cascade->ns_tags_, key, std::move(action));
  }
  
  static void insert_in_ids(Cascade* cascade, const rc_qname& key,
                         std::unique_ptr<CascadeAction> action) {
    insert_in_table(cascade->ids_, key, std::move(action));
  }

  static void insert_in_epubtypes(Cascade* cascade, const rc_qname& key,
                         std::unique_ptr<CascadeAction> action) {
    insert_in_table(cascade->epubtypes_, key, std::move(action));
  }
};

class ChainedAction : public CascadeAction {
  friend class CascadeParserHandler;
 public:
  ChainedAction(std::unique_ptr<CascadeAction> next)
    : next_(std::move(next)) {}

  virtual void apply(CascadeInstance* cascade_instance) override {
    next_->apply(cascade_instance);
  }

  virtual int priority() const { return 0; }

 protected:
  std::unique_ptr<CascadeAction> next_;
};

namespace {

class ConditionItemAction : public CascadeAction {
 public:
  ConditionItemAction(const rc_ref<ConditionItem>& item) : item_(item) {}

  virtual void apply(CascadeInstance* cascade_instance) override {
    push_condition_item(cascade_instance, item_);
  }

  virtual std::unique_ptr<CascadeAction> clone() {
    return std::unique_ptr<CascadeAction>(new ConditionItemAction(item_));
  }

 private:
  rc_ref<ConditionItem> item_;
};
  
class CompoundAction : public CascadeAction {
public:
  CompoundAction() {}

  CompoundAction(std::unique_ptr<CascadeAction> a1,
      std::unique_ptr<CascadeAction> a2) : actions_() {
    actions_.push_back(std::move(a1));
    actions_.push_back(std::move(a2));
  }

  virtual void apply(CascadeInstance* cascade_instance) override {
    for (const std::unique_ptr<CascadeAction>& it : actions_) {
      it->apply(cascade_instance);
    }
  }

  virtual bool merge(std::unique_ptr<CascadeAction>& other) {
    actions_.push_back(std::move(other));
    return true;
  }

  virtual std::unique_ptr<CascadeAction> clone() {
    CompoundAction* copy = new CompoundAction();
    for (const std::unique_ptr<CascadeAction>& it : actions_) {
      copy->actions_.push_back(it->clone());
    }
    return std::unique_ptr<CascadeAction>(copy);
  }

 private:
  std::vector<std::unique_ptr<CascadeAction>> actions_;
};

class ApplyRuleAction : public CascadeAction {
public:
  ApplyRuleAction(const rc_ref<PropertyMap>& style, cascade_priority_t specificity,
      const rc_qname& pseudoelement, const rc_qname& region_id)
          : style_(style), specificity_(specificity),
            pseudoelement_(pseudoelement), region_id_(region_id) {}

  virtual void apply(CascadeInstance* cascade_instance) override {
    merge_style(cascade_instance->context(), current_style(cascade_instance),
          style_, specificity_, pseudoelement_, region_id_);
  }

  virtual std::unique_ptr<CascadeAction> clone() {
    return std::unique_ptr<CascadeAction>(new ApplyRuleAction(style_,
        specificity_, pseudoelement_, region_id_));
  }

private:
  rc_ref<PropertyMap> style_;
  cascade_priority_t specificity_;
  rc_qname pseudoelement_;
  rc_qname region_id_;
};

class CheckClassAction : public ChainedAction {
 public:
  CheckClassAction(std::unique_ptr<CascadeAction>&& next, const rc_qname& name)
      : ChainedAction(std::move(next)), name_(name) {}

  virtual void apply(CascadeInstance* cascade_instance) override {
    if (current_classes(cascade_instance).count(name_) > 0) {
      ChainedAction::apply(cascade_instance);
    }
  }

  virtual std::unique_ptr<CascadeAction> clone() {
    return std::unique_ptr<CascadeAction>(
        new CheckClassAction(next_->clone(), name_));
  }

  virtual int priority() const override {
    return 10; // class should be checked after id
  }

  virtual bool make_primary(CascadeParserHandler* parser_handler) override {
    if (next_) {
      insert_in_classes(parser_handler->cascade(), name_, std::move(next_));
    }
    return true;
  }

 private:
  rc_qname name_;
};

class CheckIdAction : public ChainedAction {
public:
  CheckIdAction(std::unique_ptr<CascadeAction>&& next, const rc_qname& name)
  : ChainedAction(std::move(next)), name_(name) {}

  virtual void apply(CascadeInstance* cascade_instance) override {
    if (current_id(cascade_instance) == name_
        || current_xml_id(cascade_instance) == name_) {
      ChainedAction::apply(cascade_instance);
    }
  }

  virtual std::unique_ptr<CascadeAction> clone() {
    return std::unique_ptr<CascadeAction>(
        new CheckIdAction(next_->clone(), name_));
  }

  virtual int priority() const override {
    return 11; // id is the first thing to check
  }
  
  virtual bool make_primary(CascadeParserHandler* parser_handler) override {
    if (next_) {
      insert_in_ids(parser_handler->cascade(), name_, std::move(next_));
    }
    return true;
  }

private:
  rc_qname name_;
};

class CheckLocalNameAction : public ChainedAction {
public:
  CheckLocalNameAction(std::unique_ptr<CascadeAction>&& next,
      const rc_qname& name) : ChainedAction(std::move(next)), name_(name) {}

  virtual void apply(CascadeInstance* cascade_instance) override {
    if (current_tag(cascade_instance)->local() == name_) {
      ChainedAction::apply(cascade_instance);
    }
  }

  virtual std::unique_ptr<CascadeAction> clone() {
    return std::unique_ptr<CascadeAction>(
        new CheckLocalNameAction(next_->clone(), name_));
  }

  virtual int priority() const override {
    return 8; // tag is a pretty good thing to check, after epub:type
  }
  
  virtual bool make_primary(CascadeParserHandler* parser_handler) override {
    if (next_) {
      insert_in_tags(parser_handler->cascade(), name_, std::move(next_));
    }
    return true;
  }

private:
  rc_qname name_;
};

class CheckQNameAction : public ChainedAction {
public:
  CheckQNameAction(std::unique_ptr<CascadeAction>&& next, const rc_qname& name)
      : ChainedAction(std::move(next)), name_(name) {}

  virtual void apply(CascadeInstance* cascade_instance) override {
    if (current_tag(cascade_instance) == name_) {
      ChainedAction::apply(cascade_instance);
    }
  }

  virtual std::unique_ptr<CascadeAction> clone() {
    return std::unique_ptr<CascadeAction>(
        new CheckQNameAction(next_->clone(), name_));
  }

  virtual int priority() const override {
    return 8; // tag is a pretty good thing to check, after epub:type
  }
  
  virtual bool make_primary(CascadeParserHandler* parser_handler) override {
    if (next_) {
      insert_in_ns_tags(parser_handler->cascade(), name_, std::move(next_));
    }
    return true;
  }

private:
  rc_qname name_;
};

class CheckNSAction : public ChainedAction {
public:
  CheckNSAction(std::unique_ptr<CascadeAction>&& next, const rc_qname& name)
      : ChainedAction(std::move(next)), name_(name) {}

  virtual void apply(CascadeInstance* cascade_instance) override {
    if (current_tag(cascade_instance)->ns() == name_) {
      ChainedAction::apply(cascade_instance);
    }
  }

  virtual std::unique_ptr<CascadeAction> clone() {
    return std::unique_ptr<CascadeAction>(
        new CheckNSAction(next_->clone(), name_));
  }

private:
  rc_qname name_;
};

class CheckAttributeEqAction : public ChainedAction {
public:
  CheckAttributeEqAction(std::unique_ptr<CascadeAction>&& next,
      const rc_qname& name, const rc_string& value)
          : ChainedAction(std::move(next)), name_(name), value_(value) {}

  virtual void apply(CascadeInstance* cascade_instance) override {
    const rc_map<rc_value>& attributes =
        current_element(cascade_instance)->attributes();
    rc_map<rc_value>::iterator it = attributes->find(name_);
    if (it != attributes->end() && it->value->to_string() == value_) {
      ChainedAction::apply(cascade_instance);
    }
  }

  virtual std::unique_ptr<CascadeAction> clone() {
    return std::unique_ptr<CascadeAction>(
        new CheckAttributeEqAction(next_->clone(), name_, value_));
  }

private:
  rc_qname name_;
  rc_string value_;
};

class CheckConditionAction : public ChainedAction {
 public:
  CheckConditionAction(std::unique_ptr<CascadeAction>&& next,
      unsigned int condition_index) : ChainedAction(std::move(next)),
          condition_index_(condition_index) {}

  virtual void apply(CascadeInstance* cascade_instance) override {
    if (check_condition(cascade_instance, condition_index_)) {
      ChainedAction::apply(cascade_instance);
    }
  }

  virtual std::unique_ptr<CascadeAction> clone() {
    return std::unique_ptr<CascadeAction>(
        new CheckConditionAction(next_->clone(), condition_index_));
  }
  
  virtual int priority() const override {
    return 5;
  }

 private:
  unsigned int condition_index_;
};

class PoisonAction : public ChainedAction {
public:
  PoisonAction() : ChainedAction(std::unique_ptr<CascadeAction>()) {}

  virtual void apply(CascadeInstance* cascade_instance) override {
  }

  virtual std::unique_ptr<CascadeAction> clone() {
    return std::unique_ptr<CascadeAction>(new PoisonAction());
  }

  virtual int priority() const override {
    return 12;
  }

private:
  unsigned int condition_index_;
};

}

std::unique_ptr<CascadeAction> CascadeAction::merge_actions(
       std::unique_ptr<CascadeAction> a1, std::unique_ptr<CascadeAction> a2) {
  if (a1->merge(a2)) {
    return a1;
  }
  return std::unique_ptr<CascadeAction>(
      new CompoundAction(std::move(a1), std::move(a2)));
}

//------------------------- Cascade -----------------------------------------

Cascade::Cascade() {}

Cascade::~Cascade() {}

//----------------------- CascadeInstance ------------------------------------

CascadeInstance::CascadeInstance(Cascade* cascade, expr::Context* context,
    const rc_qname& lang) : cascade_(cascade), context_(context),
        current_element_(nullptr, nullptr), is_first_(false), lang_(lang),
        quote_depth_(0) {
  condition_item_stack_.resize(2);  // Need for push/pop
  conditions_.resize(cascade->condition_count_);
// quotes      [new adapt.css.Str("\u201C"), new adapt.css.Str("\u201D"),
//       new adapt.css.Str("\u2018"), new adapt.css.Str("\u2019")];

}

element_style CascadeInstance::push_rule(const rc_value& classes,
    const rc_map<rc_ref<CascadeValue>>& base_style) {
  clear_style_and_classes();
  current_element_ = dom::DOM::iterator(nullptr, nullptr);
  current_tag_ = rc_qname::atom(ID_EMPTY);
  current_id_ = rc_qname::atom(ID_EMPTY);
  current_xml_id_ = rc_qname::atom(ID_EMPTY);
  current_epubtypes_.clear();
  set_classes(classes);
  set_base_style(base_style);
  apply_actions();
  return current_style_.to_element_style();
}

element_style CascadeInstance::push_element(const dom::DOM::iterator& element) {
  clear_style_and_classes();
  current_element_ = element;
  current_tag_ = element->qname();
  auto attrs = element->attributes();
  if (!attrs->empty()) {
    auto class_names = attrs.find(rc_qname::atom(ID_class));
    if (class_names != attrs.end()) {
      set_classes(class_names->value);
    }
    auto style = attrs.find(rc_qname::atom(ID_style));
    if (style != attrs.end()
        && style->value->is<rc_map<rc_ref<CascadeValue>>>()) {
      set_base_style(rc_cast<rc_map<rc_ref<CascadeValue>>>(style->value));
    }
    auto id = attrs.find(rc_qname::atom(ID_id));
    if (id != attrs.end() && id->value->is<rc_qname>()) {
      current_id_ = rc_cast<rc_qname>(id->value);
    }
    auto xml_id = attrs.find(rc_qname::atom(ID_XML_id));
    if (xml_id != attrs.end() && xml_id->value->is<rc_qname>()) {
      current_xml_id_ = rc_cast<rc_qname>(xml_id->value);
    }
    current_epubtypes_.clear();  // For now
  } else {
    current_id_ = rc_qname::atom(ID_EMPTY);
    current_xml_id_ = rc_qname::atom(ID_EMPTY);
    current_epubtypes_.clear();
  }
  apply_actions();
  element_style style = current_style_.to_element_style();
  style_stack_.push_back(style);
  return style;
}

void CascadeInstance::pop_rule() {
  pop();
}

element_style CascadeInstance::pop_element(const dom::DOM::iterator& element) {
  pop();
  element_style style = style_stack_.back();
  style_stack_.pop_back();
  return style;
}

void CascadeInstance::push_condition_item(ConditionItem* item) {
  condition_item_stack_.back().push_back(item);
}

void CascadeInstance::apply_action(const ActionTable& table,
    const rc_qname& key) {
  auto pos = table.find(key);
  if (pos != table.end()) {
    pos->second->apply(this);
  }
}

void CascadeInstance::clear_style_and_classes() {
  current_style_.pseudos.clear();
  current_style_.regions.clear();
  current_style_.props.clear();
  current_classes_.clear();
}

void CascadeInstance::set_base_style(const rc_map<rc_ref<CascadeValue>>& base) {
  for (const rc_map<rc_ref<CascadeValue>>::Entry entry : base) {
    current_style_.props[entry.key] = entry.value;
  }
}

void CascadeInstance::set_classes(const rc_value& classes) {
  if (classes->is<rc_qname>()) {
    current_classes_.insert(rc_cast<rc_qname>(classes));
  } else {
    for (const rc_qname& class_name : rc_cast<rc_list<rc_qname>>(classes)) {
      current_classes_.insert(class_name);
    }
  }
}

void CascadeInstance::apply_actions() {
  for (const rc_qname& class_name : current_classes_) {
    apply_action(cascade_->classes_, class_name);
  }
  for (const rc_qname& epubtype : current_epubtypes_) {
    apply_action(cascade_->epubtypes_, epubtype);
  }
  apply_action(cascade_->ids_, current_id_);
  apply_action(cascade_->tags_, current_tag_->local());
  apply_action(cascade_->ns_tags_, current_tag_);
  if (!current_tag_->empty()) {
    // Universal selector does not apply to page-master-related rules.
    apply_action(cascade_->tags_, rc_qname::atom(ID_asterisk));
  }
  condition_item_stack_.push_back(std::vector<rc_ref<ConditionItem>>());
  for (int depth = 1; depth >= -1; --depth) {
    std::vector<rc_ref<ConditionItem>>& items =
        condition_item_stack_[condition_item_stack_.size() - depth - 2];
    for (auto it = items.begin(); it != items.end(); ) {
      if ((*it)->push(this, depth)) {
        // done
        it = items.erase(it);
      } else {
        ++it;
      }
    }
  }
  is_first_ = true;
}

void CascadeInstance::pop() {
  for (int depth = 1; depth >= -1; --depth) {
    std::vector<rc_ref<ConditionItem>>& items =
        condition_item_stack_[condition_item_stack_.size() - depth - 2];
    for (auto it = items.begin(); it != items.end(); ) {
      if ((*it)->pop(this, depth)) {
        // done
        it = items.erase(it);
      } else {
        ++it;
      }
    }
  }
  is_first_ = false;
}

//------------ CascadeParserHandler::CascadeElementStyle ---------------------

namespace {

rc_map<element_style> to_element_style_map(const std::unordered_map<rc_qname,
    CascadeInstance::CascadeElementStyle> src_map) {
  std::map<rc_qname, element_style> map;
  for (auto entry : src_map) {
    map[entry.first] = entry.second.to_element_style();
  }
  return rc_map<element_style>(map);
}

}

element_style CascadeInstance::CascadeElementStyle::to_element_style() const {
  std::map<rc_qname, rc_value> map;
  for (auto entry : props) {
    map[entry.first] = entry.second;
  }
  for (auto entry : specials) {
    map[entry.first] = rc_list<rc_ref<CascadeValue>>(entry.second);
  }
  if (!pseudos.empty()) {
    map[rc_qname::atom(ID_PRIVATE_pseudos)] = to_element_style_map(pseudos);
  }
  if (!regions.empty()) {
    map[rc_qname::atom(ID_PRIVATE_regions)] = to_element_style_map(regions);
  }
  return element_style(map);
}

//------------------------ CascadeParserHandler ------------------------------

CascadeParserHandler::CascadeParserHandler(const rc_ref<expr::Scope>& scope,
    DispatchingParserHandler* owner, const rc_ref<expr::Expr>& condition,
    CascadeParserHandler* parent, const rc_qname& region_id,
    CSSValidatorSet* validator_set, bool top_level)
       : SlaveParserHandler(scope, owner, top_level), condition_(condition),
         region_id_(region_id), validator_set_(validator_set) {
  cascade_ = parent ? parent->cascade_ : new Cascade();
}

CascadeParserHandler::~CascadeParserHandler() {}

static bool action_compare(const std::unique_ptr<ChainedAction>& e1,
                           const std::unique_ptr<ChainedAction>& e2) {
  return e1->priority() > e2->priority();
}

void CascadeParserHandler::process_chain(std::unique_ptr<CascadeAction> tail) {
  if (chain_.size() > 0) {
    std::sort(chain_.begin(), chain_.end(), action_compare);
    for (auto it = chain_.begin() ; it != chain_.end(); ++it) {
      (*it)->next_ = std::move(tail);
      tail = std::move(*it);
    }
    chain_.clear();
    if (tail->make_primary(this)) {
      return;
    }
  }
  CascadeAction::insert_in_table(cascade_->tags_, rc_qname::atom(ID_asterisk),
      std::move(tail));
}

void CascadeParserHandler::finish_chain() {
  if (!chain_.empty()) {
    rc_qname region_id = region_id_;
    if (footnote_content_) {
      if (region_id_.empty()) {
        region_id = rc_qname::atom(ID_footnote);
      } else {
        region_id = rc_qname::atom(ID_PRIVATE_bogus);
      }
    }
    process_chain(std::unique_ptr<CascadeAction>(
        new ApplyRuleAction(property_map_, specificity_ + cascade_->order_++,
            pseudoelement_, region_id)));
    chain_.clear();
    pseudoelement_ = rc_qname::atom(ID_EMPTY);
    footnote_content_ = false;
    specificity_ = 0;
  }
}

void CascadeParserHandler::tag_selector(const rc_qname& name) {
  specificity_ += PRI_TAG_UNIT;
  if (name->ns()->id() == ID_asterisk) {
    rc_qname local = name->local();
    if (local->id() != ID_asterisk) {
      chain_.push_back(std::unique_ptr<ChainedAction>(new CheckLocalNameAction(
          std::unique_ptr<CascadeAction>(), local)));
    }
  } else if (name->local()->id() == ID_asterisk) {
    chain_.push_back(std::unique_ptr<ChainedAction>(new CheckNSAction(
        std::unique_ptr<CascadeAction>(), name->ns())));
  } else {
    chain_.push_back(std::unique_ptr<ChainedAction>(new CheckQNameAction(
        std::unique_ptr<CascadeAction>(), name)));
  }
}

void CascadeParserHandler::class_selector(const rc_qname& name) {
  if (!pseudoelement_->empty()) {
    // log("::" + pseudoelement_ + " followed by ." + name);
    // always fails
    chain_.push_back(std::unique_ptr<ChainedAction>(new PoisonAction()));
    return;
  }
  specificity_ += PRI_ATTR_UNIT;
  chain_.push_back(std::unique_ptr<ChainedAction>(new CheckClassAction(
      std::unique_ptr<CascadeAction>(), name)));
}

void CascadeParserHandler::pseudoclass_selector(const rc_qname& name,
    const rc_list<rc_value>& params) {
  switch (name->id()) {
    case ID_before:
    case ID_after:
      pseudoelement_selector(name, params);
      break;
  }
}

void CascadeParserHandler::pseudoelement_selector(const rc_qname& name,
    const rc_list<rc_value>& params) {
  switch (name->id()) {
    case ID_before:
    case ID_after:
      if (params->size() > 0) {
        // params unexpected
        chain_.push_back(std::unique_ptr<ChainedAction>(new PoisonAction()));
      } else {
        if (pseudoelement_.empty()) {
          pseudoelement_ = name;
        } else {
          // double pseudoelement
          chain_.push_back(std::unique_ptr<ChainedAction>(new PoisonAction()));
        }
      }
      break;
  }
}

void CascadeParserHandler::id_selector(const rc_qname& id) {
  specificity_ += PRI_ID_UNIT;
  chain_.push_back(std::unique_ptr<ChainedAction>(new CheckIdAction(
      std::unique_ptr<CascadeAction>(), id)));
}

void CascadeParserHandler::attribute_selector(const rc_qname& name,
    TokenType op, const rc_string& value) {
}

void CascadeParserHandler::descendant_selector() {
  unsigned int condition_index = cascade_->condition_count_++;
  process_chain(std::unique_ptr<CascadeAction>(new ConditionItemAction(
      rc_ref<ConditionItem>(new DescendantConditionItem(condition_index)))));
  chain_.push_back(std::unique_ptr<ChainedAction>(new CheckConditionAction(
      std::unique_ptr<CascadeAction>(), condition_index)));
}

void CascadeParserHandler::child_selector() {
  unsigned int condition_index = cascade_->condition_count_++;
  process_chain(std::unique_ptr<CascadeAction>(new ConditionItemAction(
      rc_ref<ConditionItem>(new ChildConditionItem(condition_index)))));
  chain_.push_back(std::unique_ptr<ChainedAction>(new CheckConditionAction(
       std::unique_ptr<CascadeAction>(), condition_index)));
}

void CascadeParserHandler::adjacent_sibling_selector() {
  unsigned int condition_index = cascade_->condition_count_++;
  process_chain(std::unique_ptr<CascadeAction>(new ConditionItemAction(
      rc_ref<ConditionItem>(new AdjacentSiblingConditionItem(condition_index)))));
  chain_.push_back(std::unique_ptr<ChainedAction>(new CheckConditionAction(
      std::unique_ptr<CascadeAction>(), condition_index)));
}

void CascadeParserHandler::following_sibling_selector() {
  unsigned int condition_index = cascade_->condition_count_++;
  process_chain(std::unique_ptr<CascadeAction>(new ConditionItemAction(
      rc_ref<ConditionItem>(new FollowingSiblingConditionItem(condition_index)))));
  chain_.push_back(std::unique_ptr<ChainedAction>(new CheckConditionAction(
      std::unique_ptr<CascadeAction>(), condition_index)));
}

void CascadeParserHandler::next_selector() {
  finish_chain();
  pseudoelement_ = rc_qname::atom(ID_EMPTY);
  footnote_content_ = false;
  specificity_ = 0;
  chain_.clear();
}

void CascadeParserHandler::start_selector_rule() {
  if (!expect_rule_) {
    error("E_CSS_UNEXPECTED_SELECTOR");
    return;
  }
  expect_rule_ = false;
  property_map_ = new PropertyMap();
  pseudoelement_ = rc_qname::atom(ID_EMPTY);
  specificity_ = 0;
  footnote_content_ = false;
  chain_.clear();
}

void CascadeParserHandler::start_rule_body() {
  finish_chain();
  SlaveParserHandler::start_rule_body();
  expect_rule_ = true;
}

void CascadeParserHandler::property(const rc_qname& name,
    const rc_ref<CSSValue>& value, bool important) {
  validator_set_->validate_property_and_handle_shorthand(
      name, value, important, this);
}

void CascadeParserHandler::simple_property(const rc_qname& name,
      const rc_ref<CSSValue>& value, bool important) {
  if (!property_map_.is_null()) {
    cascade_priority_t priority = owner_->priority(important);
    property_map_->properties_[name] = condition_.is_null()
        ? new CascadeValue(value, priority)
        : new ConditionalCascadeValue(value, priority, condition_, scope());
  }
}

void CascadeParserHandler::end_rule() {
  SlaveParserHandler::end_rule();
  expect_rule_ = true;
}

void CascadeParserHandler::special_property(const rc_qname& name,
    const rc_ref<CSSValue>& value) {
  assert(is_special_name(name));
  simple_property(name, value, false);
}


}
}
