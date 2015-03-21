#include "adapt/css/valid.h"

#include <memory>
#include <unordered_map>
#include <unordered_set>
#include <vector>

#include "adapt/base/rc_map.h"
#include "adapt/load/app_package.h"
#include "adapt/css/tok.h"

namespace adapt {
namespace css {

namespace {

class PropertyValidator;
class ValidatingGroup;
class CommaListValidator;
class SpaceListValidator;
class ShorthandValidator;

}

struct CSSValidatorSetData {
  std::unordered_map<rc_qname, rc_ref<PropertyValidator>> validators;
  std::unordered_map<rc_qname, rc_qname> prefixed_map;
  std::unordered_map<rc_qname, rc_ref<CSSValue>> default_values;
  std::unordered_map<rc_qname, std::unique_ptr<ValidatingGroup>> named;
  std::unordered_map<rc_qname, rc_map<rc_ref<CSSValue>>> system_fonts;
  std::unordered_map<rc_qname, std::unique_ptr<ShorthandValidator>> shorthands;
  std::unordered_map<rc_qname, rc_ref<CSSValue>> layout_props;
  std::unordered_map<rc_qname, rc_ref<CSSValue>> background_props;
};


namespace {

/**
 * Abstract class to validate simple CSS property value (not a shorthand)
 */
class PropertyValidator : public RefCountedObject, public css::CSSVisitor {
 public:
  virtual rc_list<rc_ref<CSSValue>> validate_for_shorthand(
      const rc_list<rc_ref<CSSValue>>& values, size_t index) {
    rc_ref<CSSValue> rval = values[index]->visit(this);
    if (rval.is_null()) {
      return rc_list<rc_ref<CSSValue>>::empty();
    }
    return rc_list<rc_ref<CSSValue>>(&rval, 1);
  }

  virtual bool primitive() { return false; }

  static const char* type_tag() { return "PropertyValidator"; }

protected:
  virtual bool instance_of(const char* type_tag) const override {
    return type_tag == PropertyValidator::type_tag()
        || RefCountedObject::instance_of(type_tag);
  }
};

const rc_ref<PropertyValidator>& always_fail();

rc_ref<PropertyValidator> combine_primitive(PropertyValidator* validator1,
    PropertyValidator* validator2);

class Node {
  friend class ValidatingGroup;
  enum NodeType {
    NORMAL,
    START_GROUP,
    END_GROUP,
    START_ALTERNATE,
    END_ALTERNATE
  };
  
 public:
  Node(const rc_ref<PropertyValidator>& validator)
      : validator_(validator), success_(nullptr), failure_(nullptr),
        type_(NORMAL), index_(0) {}

  Node(const Node& node)
      : validator_(node.validator_), success_(nullptr), failure_(nullptr),
        type_(node.type_), index_(node.index_) {
    assert(!node.success_);
    assert(!node.failure_);
  }

  Node(Node&& node)
      : validator_(std::move(node.validator_)), success_(nullptr),
        failure_(nullptr), type_(node.type_), index_(node.index_) {
    assert(!node.success_);
    assert(!node.failure_);
  }

  bool special() const { return type_ != NORMAL; }

  void mark_as_start_group() { type_ = START_GROUP; }
  bool is_start_group() const { return type_ == START_GROUP; }
  void mark_as_end_group() { type_ = END_GROUP; }
  bool is_end_group() const { return type_ == END_GROUP; }

  void mark_as_start_alternate(int index) {
    type_ = START_ALTERNATE;
    index_ = index;
    assert(index == index_);
  }

  bool is_start_alternate() const { return type_ == START_ALTERNATE; }

  void mark_as_end_alternate(int index) {
    type_ = END_ALTERNATE;
    index_ = index;
    assert(index == index_);
  }

  bool is_end_alternate() const { return type_ == END_ALTERNATE; }

  int alternate() const { return index_; }

  PropertyValidator* validator() const { return validator_.ptr(); }

  const Node* success() const { return success_; }
  const Node* failure() const { return failure_; }

 private:
  rc_ref<PropertyValidator> validator_;
  short type_;
  short index_;
  Node* success_;
  Node* failure_;
};

struct Connection {
  size_t what;
  size_t where;
  bool success;

  static const size_t npos = static_cast<size_t>(-1);

  Connection(size_t wherei, bool successi)
      : where(wherei), success(successi), what(npos) {}
};

enum Add {
  FOLLOW = 1,
  OPTIONAL = 2,
  REPEATED = 3,
  ALTERNATE = 4
};

/**
 * A class to build a list validator from other validators.
 */
class ValidatingGroup {
 public:
  ValidatingGroup() : empty_head_(true) {}

  std::unique_ptr<ValidatingGroup> clone() const {
    return std::unique_ptr<ValidatingGroup>(new ValidatingGroup(*this));
  }

  void connect(std::vector<size_t>* arr, size_t node_index) {
    for (size_t connection_index : *arr) {
      connections_[connection_index].what = node_index;
    }
    arr->clear();
  }

  void end_special_group() {
    std::vector<size_t>* arrs[3] = {&match_, &nomatch_, &error_};
    for (std::vector<size_t>* arr : arrs) {
      add_special_to_arr(arr, false, -1);
    }
  }

  void start_special_group() {
    assert(nodes_.empty());
    add_special_to_arr(&match_, true, -1);
  }
  
  void end_clause(int clause) {
    add_special_to_arr(&match_, false, clause);
  }

  void start_clause(int clause) {
    assert(nodes_.empty());
    nodes_.push_back(Node(always_fail()));
    nodes_.back().mark_as_end_alternate(clause);
    nomatch_.push_back(connections_.size());
    connections_.push_back(Connection(0, false));
    match_.push_back(connections_.size());
    connections_.push_back(Connection(0, true));
    check_connections();
  }

  void add_primitive(const rc_ref<PropertyValidator>& validator) {
    size_t index = nodes_.size();
    nodes_.push_back(Node(validator));
    connect(&match_, index);
    if (empty_head_) {
      // if did not validate -> no match
      nomatch_.push_back(connections_.size());
      empty_head_ = false;
    } else {
      // if did not validate -> failure
      error_.push_back(connections_.size());
    }
    connections_.push_back(Connection(index, false));
    match_.push_back(connections_.size());
    connections_.push_back(Connection(index, true));
    check_connections();
  }

  bool simple() {
    return nodes_.size() == 1 && !nodes_[0].special();
  }

  bool primitive() {
    return simple() && nodes_[0].validator()->primitive();
  }

  bool pending_connection(size_t index) {
    const std::vector<size_t>* matches[] = {&match_, &nomatch_, &error_};
    for (const std::vector<size_t>* m : matches) {
      auto it = std::find_if(m->begin(), m->end(),
          [index](size_t o) {return o == index;} );
      if (it != m->end()) {
        return true;
      }
    }
    return false;
  }

  void check_connections() {
    size_t i = 0;
    for (const Connection& connection : connections_) {
      if (connection.what == Connection::npos) {
        assert(pending_connection(i));
      }
      i++;
    }
  }

  void add_group(std::unique_ptr<ValidatingGroup>&& group, Add how) {
    if (group->nodes_.empty())
      return;
    group->check_connections();
    size_t index = nodes_.size();
    // optimization for alternate primitive validators
    if (how == ALTERNATE && index == 1 && group->primitive() && primitive()) {
      nodes_[0].validator_ = combine_primitive(nodes_[0].validator(),
          group->nodes_[0].validator());
      check_connections();
      return;
    }
    for (const Node& node : group->nodes_) {
      nodes_.push_back(node);
    }
    // nodes[index] is group start
    if (how == ALTERNATE) {
      empty_head_ = true;
      connect(&nomatch_, index);
    } else {
      connect(&match_, index);
    }
    size_t connection_index = connections_.size();
    for (Connection connection : group->connections_) {
      connection.where += index;
      if (connection.what != Connection::npos)
        connection.what += index;
      connections_.push_back(connection);
    }
    for (size_t match : group->match_) {
      match_.push_back(match + connection_index);
    }
    if (how == REPEATED) {
      connect(&match_, index);
    }
    if (how == OPTIONAL || how == REPEATED) {
      for (size_t nomatch : group->nomatch_) {
        match_.push_back(nomatch + connection_index);
      }
    } else if (empty_head_) {
      for (size_t nomatch : group->nomatch_) {
        nomatch_.push_back(nomatch + connection_index);
      }
      empty_head_ = group->empty_head_;
    } else {
      for (size_t nomatch : group->nomatch_) {
        error_.push_back(nomatch + connection_index);
      }
    }
    for (size_t error : group->error_) {
      error_.push_back(error + connection_index);
    }
    check_connections();
    // invalidate group
    group->nodes_.clear();
    group->connections_.clear();
  }

  std::vector<Node> finish() {
    size_t index = nodes_.size();
    nodes_.push_back(Node(rc_ref<PropertyValidator>()));
    nodes_.push_back(Node(rc_ref<PropertyValidator>()));
    connect(&match_, index);
    connect(&nomatch_, index + 1);
    connect(&error_, index + 1);
    for (const Connection& connection: connections_) {
      assert(connection.where < nodes_.size());
      assert(connection.what < nodes_.size());
      if (connection.success)
        nodes_[connection.where].success_ = &nodes_[connection.what];
      else
        nodes_[connection.where].failure_ = &nodes_[connection.what];
    }
    // make sure that our data structure is correct
    for (size_t i = 0; i < index; ++i) {
      const Node& node = nodes_[i];
      assert (node.failure_ && node.success_);
    }
    return std::move(nodes_);
  }

  const Node* first() { return &nodes_.front(); }

 private:
  /**
   * Add "special" validation node to a given array.
   * @param arr array to use: match, nomatch, or error
   * @param start if this a start or the end of a clause/group
   * @param clause -1 indicates group start/end, otherwise clause index
   */
  void add_special_to_arr(std::vector<size_t>* arr, bool start, int clause) {
    size_t index = nodes_.size();
    nodes_.push_back(Node(always_fail()));
    Node& node = nodes_.back();
    if (clause >= 0) {
      if (start)
        node.mark_as_start_alternate(clause);
      else
        node.mark_as_end_alternate(clause);
    } else {
      if (start)
        node.mark_as_start_group();
      else
        node.mark_as_end_group();
    }
    connect(arr, index);
    arr->push_back(connections_.size());
    connections_.push_back(Connection(index, false));
    arr->push_back(connections_.size());
    connections_.push_back(Connection(index, true));
    check_connections();
  }

  std::vector<Node> nodes_;
  std::vector<Connection> connections_;
  std::vector<size_t> match_;
  std::vector<size_t> nomatch_;
  std::vector<size_t> error_;
  bool empty_head_;
};

enum Allow {
  ALLOW_EMPTY = 0x01,
  ALLOW_STR = 0x02,
  ALLOW_IDENT = 0x04,
  ALLOW_POS_NUMERIC = 0x08,
  ALLOW_POS_NUM = 0x10,
  ALLOW_POS_INT = 0x20,
  ALLOW_COLOR = 0x40,
  ALLOW_URL = 0x80,
  ALLOW_NEGATIVE = 0x100,
  ALLOW_ZERO = 0x200,
  ALLOW_ZERO_PERCENT = 0x400,
  ALLOW_SLASH = 0x800
};

/**
 * Validate a primitive CSS value (not a list or function).
 */
class PrimitiveValidator : public PropertyValidator {
public:
  PrimitiveValidator(unsigned int allowed,
      const rc_map<rc_ref<CSSValue>>& idents,
      const rc_map<rc_ref<CSSValue>>& units)
          : allowed_(allowed), idents_(idents), units_(units) {
  }

  virtual bool primitive() override { return true; }

  virtual rc_ref<CSSValue> visit_empty(CSSEmpty* value) override {
    if (allowed_ & ALLOW_EMPTY) {
      return value;
    }
    return rc_ref<CSSValue>();
  }

  virtual rc_ref<CSSValue> visit_slash(CSSSlash* value) override {
    if (allowed_ & ALLOW_SLASH) {
      return value;
    }
    return rc_ref<CSSValue>();
  }

  virtual rc_ref<CSSValue> visit_string(CSSString* value) override {
    if (allowed_ & ALLOW_STR) {
      return value;
    }
    return rc_ref<CSSValue>();
  }

  virtual rc_ref<CSSValue> visit_ident(CSSIdent* value) override {
    if (!idents_->empty()) {
      rc_ref<CSSValue> val = idents_[value->name()->to_lower_ascii()];
      if (!val.is_null()) {
        return val;
      }
    }
    if (allowed_ & ALLOW_IDENT) {
      return value;
    }
    return rc_ref<CSSValue>();
  }

  virtual rc_ref<CSSValue> visit_numeric(CSSNumeric* value) override {
    if (value->num() == 0 && !(allowed_ & ALLOW_ZERO)) {
      if (value->unit()->id() == ID_percent && (allowed_ & ALLOW_ZERO_PERCENT))
        return value;
      return rc_ref<CSSValue>();
    }
    if (value->num() < 0 && !(allowed_ & ALLOW_NEGATIVE))
      return rc_ref<CSSValue>();
    if (!units_[value->unit()].is_null())
      return value;
    return rc_ref<CSSValue>();
  }

  virtual rc_ref<CSSValue> visit_number(CSSNumber* value) override {
    if (value->num() == 0) {
      return allowed_ & ALLOW_ZERO ? value : rc_ref<CSSValue>();
    }
    if (value->num() <= 0 && !(allowed_ & ALLOW_NEGATIVE)) {
      return rc_ref<CSSValue>();
    }
    if (allowed_ & ALLOW_POS_NUM) {
      return value;
    }
    return rc_ref<CSSValue>();
  }

  virtual rc_ref<CSSValue> visit_integer(CSSInteger* value) override {
    if (value->num() == 0) {
      return allowed_ & ALLOW_ZERO ? value : rc_ref<CSSValue>();
    }
    if (value->num() <= 0 && !(allowed_ & ALLOW_NEGATIVE)) {
      return rc_ref<CSSValue>();
    }
    if (allowed_ & (ALLOW_POS_NUM | ALLOW_POS_INT)) {
      return value;
    }
    return idents_[rc_qname(value->to_string())];
  }

  virtual rc_ref<CSSValue> visit_color(CSSColor* value) override {
    if (allowed_ & ALLOW_COLOR)
      return value;
    return rc_ref<CSSValue>();
  }

  virtual rc_ref<CSSValue> visit_url(CSSUrl* value) override {
    if (allowed_ & ALLOW_URL)
      return value;
    return rc_ref<CSSValue>();
  }

  virtual rc_ref<CSSValue> visit_space_list(CSSSpaceList* value) override {
    return rc_ref<CSSValue>();
  }

  virtual rc_ref<CSSValue> visit_comma_list(CSSCommaList* value) override {
    return rc_ref<CSSValue>();
  }

  virtual rc_ref<CSSValue> visit_function(CSSFunction* value) override {
    return rc_ref<CSSValue>();
  }

  virtual rc_ref<CSSValue> visit_expression(CSSExpr* value) override {
    return rc_ref<CSSValue>();
  }

  rc_ref<PropertyValidator> combine(const PrimitiveValidator& other) {
    std::map<rc_qname, rc_ref<CSSValue>> idents;
    std::map<rc_qname, rc_ref<CSSValue>> units;
    for (const rc_map<rc_ref<CSSValue>>::Entry& entry : idents_) {
      idents[entry.key] = entry.value;
    }
    for (const rc_map<rc_ref<CSSValue>>::Entry& entry : other.idents_) {
      idents[entry.key] = entry.value;
    }
    for (const rc_map<rc_ref<CSSValue>>::Entry& entry : units_) {
      units[entry.key] = entry.value;
    }
    for (const rc_map<rc_ref<CSSValue>>::Entry& entry : other.units_) {
      units[entry.key] = entry.value;
    }
    return new PrimitiveValidator(allowed_ | other.allowed_,
        rc_map<rc_ref<CSSValue>>(idents), rc_map<rc_ref<CSSValue>>(units));
  }

  void add_replacement(const rc_ref<CSSValue> rep) {
    std::map<rc_qname, rc_ref<CSSValue>> new_idents;
    for (const rc_map<rc_ref<CSSValue>>::Entry& entry : idents_) {
      new_idents[entry.key] = rep;
    }
    idents_ = rc_map<rc_ref<CSSValue>>(new_idents);
  }

  static const char* type_tag() { return "PrimitiveValidator"; }

 protected:
  virtual bool instance_of(const char* type_tag) const override {
    return type_tag == PrimitiveValidator::type_tag()
    || RefCountedObject::instance_of(type_tag);
  }

 private:
  unsigned int allowed_;
  rc_map<rc_ref<CSSValue>> idents_;
  rc_map<rc_ref<CSSValue>> units_;
};

const rc_ref<PropertyValidator>& always_fail() {
  static rc_ref<PropertyValidator> always_fail(new PrimitiveValidator(0,
      rc_map<rc_ref<CSSValue>>::empty(), rc_map<rc_ref<CSSValue>>::empty()));
  return always_fail;
}

rc_ref<PropertyValidator> combine_primitive(PropertyValidator* validator1,
    PropertyValidator* validator2) {
  assert(validator1->primitive());
  assert(validator2->primitive());
  return static_cast<PrimitiveValidator*>(validator1)->combine(
      *static_cast<PrimitiveValidator*>(validator2));
}


/**
 * Base class for list validation.
 */
class ListValidator : public PropertyValidator {
  std::vector<Node> group_;
 public:
  ListValidator(std::vector<Node>&& group)
      : group_(std::move(group)) {}

  rc_list<rc_ref<CSSValue>> validate_list(const rc_list<rc_ref<CSSValue>>& arr,
      bool slice, size_t start_index) {
    std::vector<rc_ref<CSSValue>> out;
    bool no_change = !slice;
    const Node* current = &group_.front();
    const Node* success = &group_[group_.size() - 2];
    const Node* failure = &group_.back();
    size_t index = start_index;
    std::stack<std::vector<bool>> alternative_stack;
    std::vector<bool> alternatives;
    while (current != success && current != failure) {
      if (index >= arr->size()) {
        current = current->failure();
        continue;
      }
      const rc_ref<CSSValue>& inval = arr[index];
      rc_ref<CSSValue> outval = inval;
      if (current->special()) {
        bool is_success = true;
        if (current->is_start_group()) {
          alternative_stack.push(std::move(alternatives));
        } else if (current->is_end_group()) {
          if (!alternative_stack.empty()) {
            alternatives = std::move(alternative_stack.top());
            alternative_stack.pop();
          } else {
            alternatives.clear();
          }
        } else if (current->is_end_alternate()) {
          size_t req_size = current->alternate() + 1;
          if (req_size > alternatives.size()) {
            alternatives.resize(req_size);
          }
          alternatives[current->alternate()] = true;
        } else {
          is_success = current->alternate() >= alternatives.size()
              || !alternatives[current->alternate()];
        }
        current = is_success ? current->success() : current->failure();
      } else {
        if (index == 0 && !slice
            && current->validator()->is<rc_ref<CommaListValidator>>()
            && is<rc_ref<SpaceListValidator>>()) {
          // Special nesting case: validate the input space list as a whole.
          // Space lists cannot contain comma lists, so the only way for this
          // space list to match is to be the single-element space list.
          rc_ref<CSSSpaceList> space_list(new CSSSpaceList(arr));
          outval = space_list->visit(current->validator());
          if (!outval.is_null()) {
            index = arr->size();
            current = current->success();
            continue;
          }
        } else {
          outval = inval->visit(current->validator());
        }
        if (outval.is_null()) {
          current = current->failure();
          continue;
        }
        if (outval.ptr() != inval.ptr() && no_change) {
          // start_index is zero here
          no_change = false;
          for (size_t k = 0; k < index; ++k) {
            out.push_back(arr[k]);
          }
        }
        if (!no_change) {
          out.push_back(outval);
        }
        index++;
        current = current->success();
      }
    }
    if (current == success && slice ? !out.empty() : index == arr->size()) {
      if (no_change) {
        return arr;
      }
#ifndef NDEBUG
      for (const rc_ref<CSSValue>& e : out) {
        assert(!e.is_null());
      }
#endif
      return rc_list<rc_ref<CSSValue>>(out);
    }
    return rc_list<rc_ref<CSSValue>>::empty();
  }

  virtual rc_ref<CSSValue> validate_single(const rc_ref<CSSValue>& inval) {
    // no need to worry about "specials"
    rc_ref<CSSValue> outval;
    const Node* current = &group_.front();
    const Node* success = &group_[group_.size() - 2];
    const Node* failure = &group_.back();
    bool finished = false;
    while (current != success && current != failure) {
      if (finished) {
        current = current->failure();
        continue;
      }
      if (current->special()) {
        current = current->success();
        continue;
      }
      outval = inval->visit(current->validator());
      if (outval.is_null()) {
        current = current->failure();
        continue;
      }
      finished = true;
      current = current->success();
    }
    if (current == success)
      return outval;
    return rc_ref<CSSValue>();
  }

  virtual rc_ref<CSSValue> visit_empty(CSSEmpty* value) override {
    return validate_single(value);
  }

  virtual rc_ref<CSSValue> visit_slash(CSSSlash* value) override {
    return validate_single(value);
  }

  virtual rc_ref<CSSValue> visit_string(CSSString* value) override {
    return validate_single(value);
  }

  virtual rc_ref<CSSValue> visit_ident(CSSIdent* value) override {
    return validate_single(value);
  }

  virtual rc_ref<CSSValue> visit_numeric(CSSNumeric* value) override {
    return validate_single(value);
  }

  virtual rc_ref<CSSValue> visit_number(CSSNumber* value) override {
    return validate_single(value);
  }

  virtual rc_ref<CSSValue> visit_integer(CSSInteger* value) override {
    return validate_single(value);
  }

  virtual rc_ref<CSSValue> visit_color(CSSColor* value) override {
    return validate_single(value);
  }

  virtual rc_ref<CSSValue> visit_url(CSSUrl* value) override {
    return validate_single(value);
  }

  virtual rc_ref<CSSValue> visit_space_list(CSSSpaceList* value) override {
    return rc_ref<CSSValue>();
  }

  virtual rc_ref<CSSValue> visit_comma_list(CSSCommaList* value) override {
    return rc_ref<CSSValue>();
  }

  virtual rc_ref<CSSValue> visit_function(CSSFunction* value) override {
    return validate_single(value);
  }

  virtual rc_ref<CSSValue> visit_expression(CSSExpr* value) override {
    return rc_ref<CSSValue>();
  }

  static const char* type_tag() { return "ListValidator"; }

  rc_ref<PropertyValidator> first_validator() const {
    return group_.front().validator();
  }

 protected:
  virtual bool instance_of(const char* type_tag) const override {
    return type_tag == ListValidator::type_tag()
        || RefCountedObject::instance_of(type_tag);
  }
};

class SpaceListValidator : public ListValidator {
 public:
  SpaceListValidator(std::vector<Node>&& group)
      : ListValidator(std::move(group)) {}

  virtual rc_ref<CSSValue> visit_space_list(CSSSpaceList* value) override {
    rc_list<rc_ref<CSSValue>> list = validate_list(value->list(), false, 0);
    if (list.ptr() == value->list().ptr()) {
      return value;
    }
    if (list->empty()) {
      return rc_ref<CSSValue>();
    }
    return new CSSSpaceList(list);
  }

  virtual rc_list<rc_ref<CSSValue>> validate_for_shorthand(
      const rc_list<rc_ref<CSSValue>>& values, size_t index) {
    return validate_list(values, true, index);
  };

  static const char* type_tag() { return "SpaceListValidator"; }

 protected:
  virtual bool instance_of(const char* type_tag) const override {
    return type_tag == SpaceListValidator::type_tag()
        || RefCountedObject::instance_of(type_tag);
  }
};

class CommaListValidator : public ListValidator {
 public:
  CommaListValidator(std::vector<Node>&& group)
      : ListValidator(std::move(group)) {}

  virtual rc_ref<CSSValue> visit_space_list(CSSSpaceList* value) override {
    return validate_single(value);
  }

  virtual rc_ref<CSSValue> visit_comma_list(CSSCommaList* value) override {
    rc_list<rc_ref<CSSValue>> list = validate_list(value->list(), false, 0);
    if (list.ptr() == value->list().ptr()) {
      return value;
    }
    if (list->empty()) {
      return rc_ref<CSSValue>();
    }
    return new CSSCommaList(list);
  }

  static const char* type_tag() { return "CommaListValidator"; }

 protected:
  virtual bool instance_of(const char* type_tag) const override {
    return type_tag == CommaListValidator::type_tag()
        || RefCountedObject::instance_of(type_tag);
  }
};

class FunctionValidator : public ListValidator {
 public:
  FunctionValidator(const rc_qname& name, std::vector<Node>&& group)
      : name_(name), ListValidator(std::move(group)) {}

  virtual rc_ref<CSSValue> visit_function(CSSFunction* value) override {
    if (name_ != value->name()->to_lower_ascii()) {
      return rc_ref<CSSValue>();
    }
    rc_list<rc_ref<CSSValue>> list = validate_list(value->args(), false, 0);
    if (list.ptr() == value->args().ptr()) {
      return value;
    }
    if (list->empty()) {
      return rc_ref<CSSValue>();
    }
    return new CSSCommaList(list);
  }

  rc_ref<CSSValue> validate_single(const rc_ref<CSSValue>& inval) override {
    return rc_ref<CSSValue>();
  }

  static const char* type_tag() { return "FunctionValidator"; }

 protected:
  virtual bool instance_of(const char* type_tag) const override {
    return type_tag == CommaListValidator::type_tag()
        || RefCountedObject::instance_of(type_tag);
  }
 private:
  rc_qname name_;
};

//----------------------- Shorthands ------------------------------------------

class ShorthandValidator;
class ShorthandSyntaxPropertyN;

class ShorthandSyntaxNode : public RefCountedObject {
 public:
  virtual size_t try_parse(const rc_list<rc_ref<CSSValue>>& values,
      size_t index, ShorthandValidator* shorthand_validator) {
    return index;
  }

  virtual void success(const rc_ref<CSSValue>& rval,
      ShorthandValidator* shorthand_validator) {}
};

class ShorthandValidator : public CSSVisitor {
  friend class ShorthandSyntaxProperty;
  friend class ShorthandSyntaxPropertyN;

 public:
  ShorthandValidator(CSSValidatorSet* validator_set)
      : error_(false), validator_set_(validator_set),
        syntax_(rc_list<rc_ref<ShorthandSyntaxNode>>::empty()),
        prop_list_(rc_list<rc_qname>::empty()) {}

  virtual void init(const rc_list<rc_ref<ShorthandSyntaxNode>>& syntax,
      const rc_list<rc_qname>& prop_list) {
    syntax_ = syntax;
    prop_list_ = prop_list;
  }

  virtual bool is_insets_shorthand_validator() {
    return false;
  }

  virtual rc_ref<ShorthandSyntaxNode> syntax_node_for_property(
      const rc_qname& name);

  virtual std::unique_ptr<ShorthandValidator> clone() const {
    return std::unique_ptr<ShorthandValidator>(new ShorthandValidator(*this));
  }

  bool finish(bool important, PropertyReceiver* receiver) {
    if (!error_) {
      for (const rc_qname& name : prop_list_) {
        auto value_it = values_.find(name);
        receiver->simple_property(name,
            value_it != values_.end() ? value_it->second
                : validator_set_->data()->default_values.find(name)->second,
            important);
      }
      return true;
    }
    return false;
  }

  void propagate_inherit(bool important, PropertyReceiver* receiver) {
    for (const rc_qname& name : prop_list_) {
      receiver->simple_property(name, CSSIdent::ident_inherit(), important);
    }
  }

  virtual size_t validate_list(const rc_list<rc_ref<CSSValue>>& list) {
    error_ = true;
    return 0;
  }

  virtual rc_ref<CSSValue> validate_single(const rc_ref<CSSValue>& val) {
    validate_list(rc_list<rc_ref<CSSValue>>(&val, 1));
    return rc_ref<CSSValue>();
  }

  virtual rc_ref<CSSValue> visit_empty(CSSEmpty* value) override {
    return validate_single(value);
  }

  virtual rc_ref<CSSValue> visit_slash(CSSSlash* value) override {
    return validate_single(value);
  }

  virtual rc_ref<CSSValue> visit_string(CSSString* value) override {
    return validate_single(value);
  }

  virtual rc_ref<CSSValue> visit_ident(CSSIdent* value) override {
    return validate_single(value);
  }

  virtual rc_ref<CSSValue> visit_numeric(CSSNumeric* value) override {
    return validate_single(value);
  }

  virtual rc_ref<CSSValue> visit_number(CSSNumber* value) override {
    return validate_single(value);
  }

  virtual rc_ref<CSSValue> visit_integer(CSSInteger* value) override {
    return validate_single(value);
  }

  virtual rc_ref<CSSValue> visit_color(CSSColor* value) override {
    return validate_single(value);
  }

  virtual rc_ref<CSSValue> visit_url(CSSUrl* value) override {
    return validate_single(value);
  }

  virtual rc_ref<CSSValue> visit_space_list(CSSSpaceList* value) override {
    validate_list(value->list());
    return rc_ref<CSSValue>();
  }

  virtual rc_ref<CSSValue> visit_comma_list(CSSCommaList* value) override {
    error_ = true;
    return rc_ref<CSSValue>();
  }

  virtual rc_ref<CSSValue> visit_function(CSSFunction* value) override {
    return validate_single(value);
  }

  virtual rc_ref<CSSValue> visit_expression(CSSExpr* value) override {
    error_ = true;
    return rc_ref<CSSValue>();
  }

  rc_list<rc_qname> prop_list() const { return prop_list_; }

 protected:
  // TODO: factor those out into an immutable shared object?
  rc_list<rc_ref<ShorthandSyntaxNode>> syntax_;
  rc_list<rc_qname> prop_list_;
  CSSValidatorSet* validator_set_;
  bool error_;
  std::unordered_map<rc_qname, rc_ref<CSSValue>> values_;
};

class SimpleShorthandValidator : public ShorthandValidator {
 public:
  SimpleShorthandValidator(CSSValidatorSet* validator_set)
          : ShorthandValidator(validator_set) {}

  virtual std::unique_ptr<ShorthandValidator> clone() const override {
    return std::unique_ptr<ShorthandValidator>(
        new SimpleShorthandValidator(*this));
  }

  virtual size_t validate_list(const rc_list<rc_ref<CSSValue>>& list) override {
    size_t index = 0;
    size_t i = 0;
    while (index < list->size()) {
      size_t new_index = syntax_[i]->try_parse(list, index, this);
      if (new_index > index) {
        index = new_index;
        i = 0;
        continue;
      }
      if (++i == syntax_->size()) {
        error_ = true;
        break;
      }
    }
    return index;
  }
};

class ShorthandSyntaxProperty : public ShorthandSyntaxNode {
 public:
  ShorthandSyntaxProperty(CSSValidatorSet* validator_set, const rc_qname& name,
      bool nocomma) : name_(name) {
    validator_ = validator_set->data()->validators.find(name)->second;
    if (nocomma && validator_->is<rc_ref<CommaListValidator>>()) {
      validator_ =
          static_cast<CommaListValidator*>(validator_.ptr())->first_validator();
    }
  }

  virtual size_t try_parse(const rc_list<rc_ref<CSSValue>>& values,
      size_t index, ShorthandValidator* shorthand_validator) override {
    if (shorthand_validator->values_.find(name_)
        != shorthand_validator->values_.end()) {
      return index;
    }
    rc_list<rc_ref<CSSValue>> rvals =
        validator_->validate_for_shorthand(values, index);
    if (!rvals->empty()) {
      size_t len = rvals->size();
      rc_ref<CSSValue> rval = len > 1 ? new CSSSpaceList(rvals) : rvals[0];
      success(rval, shorthand_validator);
      return index + len;
    }
    return index;
  }

  virtual void success(const rc_ref<CSSValue>& rval,
      ShorthandValidator* shorthand_validator) override {
    assert(!rval.is_null());
    shorthand_validator->values_[name_] = rval;
  }

 private:
  rc_qname name_;
  rc_ref<PropertyValidator> validator_;
};

rc_ref<ShorthandSyntaxNode> ShorthandValidator::syntax_node_for_property(
    const rc_qname& name) {
  return new ShorthandSyntaxProperty(validator_set_, name, false);
}

class ShorthandSyntaxPropertyN : public ShorthandSyntaxProperty {
 public:
  ShorthandSyntaxPropertyN(CSSValidatorSet* validator_set,
      const rc_list<rc_qname>& names)
          : ShorthandSyntaxProperty(validator_set, names[0], false),
            names_(names) {}

  virtual void success(const rc_ref<CSSValue>& rval,
      ShorthandValidator* shorthand_validator) override {
    assert(!rval.is_null());
    for (const rc_qname& name : names_) {
      shorthand_validator->values_[name] = rval;
    }
  }

 protected:
  rc_list<rc_qname> names_;
};

class ShorthandSyntaxCompound : public ShorthandSyntaxNode {
 public:
  ShorthandSyntaxCompound(
      std::vector<rc_ref<ShorthandSyntaxNode>>&& nodes, bool slash)
          : nodes_(std::move(nodes)), slash_(slash) {}

  virtual size_t try_parse(const rc_list<rc_ref<CSSValue>>& values,
      size_t index, ShorthandValidator* shorthand_validator) override {
    size_t index0 = index;
    if (slash_) {
      if (values[index].ptr() == CSSSlash::instance().ptr()) {
        if (++index == values->size()) {
          return index0;
        }
      } else {
        return index0;
      }
    }
    size_t new_index = nodes_[0]->try_parse(values, index, shorthand_validator);
    if (new_index == index)
      return index0;
    index = new_index;
    for (size_t i = 1; i < nodes_.size() && index < values->size(); i++) {
      new_index = nodes_[i]->try_parse(values, index, shorthand_validator);
      if (new_index == index)
        break;
      index = new_index;
    }
    return index;
  }

 protected:
  std::vector<rc_ref<ShorthandSyntaxNode>> nodes_;
  bool slash_;
};


class InsetsShorthandValidator : public ShorthandValidator {
 public:
  InsetsShorthandValidator(CSSValidatorSet* validator_set)
      : ShorthandValidator(validator_set) {}

  virtual std::unique_ptr<ShorthandValidator> clone() const override {
    return std::unique_ptr<ShorthandValidator>(
        new InsetsShorthandValidator(*this));
  }

  virtual bool is_insets_shorthand_validator() {
    return true;
  }

  virtual size_t validate_list(const rc_list<rc_ref<CSSValue>>& list) override {
    if (list->size() > syntax_->size() || list->empty()) {
      error_ = true;
      return 0;
    }
    for (size_t i = 0; i < syntax_->size(); ++i) {
      size_t index = i;
      while (index >= list->size()) {
        index = index == 1 ? 0 : index - 2;
      }
      if (syntax_[i]->try_parse(list, index, this) != index + 1) {
        error_ = true;
        return 0;
      }
    }
    return list->size();
  }

  virtual rc_ref<ShorthandSyntaxNode> create_syntax_node() const {
    return new ShorthandSyntaxPropertyN(validator_set_, prop_list_);
  }
};

class InsetsSlashShorthandValidator : public ShorthandValidator {
 public:
  InsetsSlashShorthandValidator(CSSValidatorSet* validator_set)
      : ShorthandValidator(validator_set) {}

  virtual std::unique_ptr<ShorthandValidator> clone() const override {
    return std::unique_ptr<ShorthandValidator>(
        new InsetsSlashShorthandValidator(*this));
  }

  virtual size_t validate_list(const rc_list<rc_ref<CSSValue>>& list) override {
    size_t slash_index = list->size();
    for (size_t i = 0; i < list->size(); i++) {
      if (list[i].ptr() == CSSSlash::instance().ptr()) {
        slash_index = i;
        break;
      }
    }
    if (slash_index > syntax_->size() || list->empty()) {
      error_ = true;
      return 0;
    }
    for (size_t i = 0; i < syntax_->size(); ++i) {
      size_t index0 = i;
      while (index0 >= slash_index) {
        index0 = index0 == 1 ? 0 : index0 - 2;
      }
      size_t index1;
      if (slash_index + 1 < list->size()) {
        index1 = slash_index + i + 1;
        while (index1 >= list->size()) {
          index1 = index1 - (index1 == slash_index + 2 ? 1 : 2);
        }
      } else {
        index1 = index0;
      }
      rc_list<rc_ref<CSSValue>> vals =
          rc_list<rc_ref<CSSValue>>::of(list[index0], list[index1]);
      if (syntax_[i]->try_parse(vals, 0, this) != 2) {
        error_ = true;
        return 0;
      }
    }
    return list->size();
  }
};

class CommaShorthandValidator : public SimpleShorthandValidator {
 public:
  CommaShorthandValidator(CSSValidatorSet* validator_set)
      : SimpleShorthandValidator(validator_set) {}

  virtual std::unique_ptr<ShorthandValidator> clone() const override {
    return std::unique_ptr<ShorthandValidator>(
        new CommaShorthandValidator(*this));
  }

  virtual rc_ref<ShorthandSyntaxNode> syntax_node_for_property(
      const rc_qname& name) {
    return new ShorthandSyntaxProperty(validator_set_, name, true);
  }

  void merge_in(
      std::unordered_map<rc_qname, std::vector<rc_ref<CSSValue>>>* acc,
      const std::unordered_map<rc_qname, rc_ref<CSSValue>>& values) {
    for (const rc_qname& name : prop_list_) {
      auto val_it = values.find(name);
      rc_ref<CSSValue> val = val_it != values.end() ? val_it->second
          : validator_set_->data()->default_values.find(name)->second;
      (*acc)[name].push_back(std::move(val));
    }
  }

  virtual rc_ref<CSSValue> visit_comma_list(CSSCommaList* list) override {
    std::unordered_map<rc_qname, std::vector<rc_ref<CSSValue>>> acc;
    const rc_list<rc_ref<CSSValue>> values = list->list();
    for (size_t i = 0; i < values->size(); ++i) {
      values_.clear();
      values[i]->visit(this);
      merge_in(&acc, values_);
      if (values_.find(rc_qname::atom(ID_background_color)) != values_.end()
          && i != values->size() - 1) {
        error_ = true;
      }
      if (error_) {
        return rc_ref<CSSValue>();
      }
    }
    values_.clear();
    for (const auto& entry : acc) {
      if (entry.first->id() == ID_background_color) {
        assert(!entry.second.back().is_null());
        values_[entry.first] = entry.second.back();
      } else {
        values_[entry.first] = rc_ref<CSSValue>(
            new CSSCommaList(rc_list<rc_ref<CSSValue>>(entry.second)));
      }
    }
    return rc_ref<CSSValue>();
  }
};

class FontShorthandValidator : public SimpleShorthandValidator {
 public:
  FontShorthandValidator(CSSValidatorSet* validator_set)
      : SimpleShorthandValidator(validator_set) {}

  virtual void init(const rc_list<rc_ref<ShorthandSyntaxNode>>& syntax,
      const rc_list<rc_qname>& prop_list) override {
    SimpleShorthandValidator::init(syntax, prop_list);
    prop_list_ = prop_list_.concat(rc_list<rc_qname>::of(
        rc_qname::atom(ID_font_family), rc_qname::atom(ID_line_height),
        rc_qname::atom(ID_font_size)));
  }

  virtual std::unique_ptr<ShorthandValidator> clone() const override {
    return std::unique_ptr<ShorthandValidator>(
        new FontShorthandValidator(*this));
  }

  virtual size_t validate_list(const rc_list<rc_ref<CSSValue>>& list) override {
    size_t index = SimpleShorthandValidator::validate_list(list);
    // must at least have font-size and font-family at the end
    if (index + 2 > list->size()) {
      error_ = true;
      return index;
    }
    error_ = false;
    const std::unordered_map<rc_qname, rc_ref<PropertyValidator>>& validators =
        validator_set_->data()->validators;
    if (list[index]->visit(validators.find(
        rc_qname::atom(ID_font_size))->second.ptr()).is_null()) {
      error_ = true;
      return index;
    }
    values_[rc_qname::atom(ID_font_size)] = list[index++];
    if (list[index].ptr() == CSSSlash::instance().ptr()) {
      index++;
      // must at least have line-height and font-family at the end
      if (index + 2 > list->size()) {
        error_ = true;
        return index;
      }
      if (list[index]->visit(validators.find(
          rc_qname::atom(ID_line_height))->second.ptr()).is_null()) {
        error_ = true;
        return index;
      }
      values_[rc_qname::atom(ID_line_height)] = list[index++];
    }
    rc_ref<CSSValue> font_family = index == list->size() - 1 ? list[index]
        : rc_ref<CSSValue>(new CSSSpaceList(rc_list<rc_ref<CSSValue>>(
            list, index, list->size() - index)));
    if (font_family->visit(validators.find(
        rc_qname::atom(ID_font_family))->second.ptr()).is_null()) {
      error_ = true;
      return index;
    }
    values_[rc_qname::atom(ID_font_family)] = font_family;
    return list->size();
  }

  virtual rc_ref<CSSValue> visit_ident(CSSIdent* ident) override {
    rc_map<rc_ref<CSSValue>> props =
        validator_set_->data()->system_fonts.find(ident->name())->second;
    if (props.is_null()) {
      error_ = true;
    } else {
      for (const rc_map<rc_ref<CSSValue>>::Entry& entry : props) {
        assert(!entry.value.is_null());
        values_[entry.key] = entry.value;
      }
    }
    return rc_ref<CSSValue>();
  }
};

std::unique_ptr<ShorthandValidator> make_shorthand_validator(
    const rc_qname& name, CSSValidatorSet* validator_set) {
  switch (name->id()) {
    case ID_SIMPLE :
      return std::unique_ptr<ShorthandValidator>(
          new SimpleShorthandValidator(validator_set));
    case ID_INSETS :
      return std::unique_ptr<ShorthandValidator>(
          new InsetsShorthandValidator(validator_set));
    case ID_INSETS_SLASH :
      return std::unique_ptr<ShorthandValidator>(
          new InsetsSlashShorthandValidator(validator_set));
    case ID_COMMA :
      return std::unique_ptr<ShorthandValidator>(
          new CommaShorthandValidator(validator_set));
    case ID_FONT :
      return std::unique_ptr<ShorthandValidator>(
          new FontShorthandValidator(validator_set));
  }
  return nullptr;
}

//-------------------- Parsing validator.txt ---------------------------------

class ValidatorParser {
 public:
  ValidatorParser()
      : validator_set_(new CSSValidatorSet()),
        data_(const_cast<CSSValidatorSetData*>(validator_set_->data())) {}

 private:
  enum Section { VALIDATORS, DEFAULTS, SHORTHANDS };

  static void parsing_error(const char* err) {
    assert(false);
  }
  
  static std::unique_ptr<ValidatingGroup> add_replacement(
      std::unique_ptr<ValidatingGroup>&& valg, const Token& token) {
    rc_ref<CSSValue> cssval;
    switch (token.type()) {
      case TT_NUMERIC:
        cssval = new CSSNumeric(token.num(), rc_qname(token.text()));
        break;
      case TT_HASH:
        cssval = CSSColor::color_from_hash(token.text());
        break;
      case TT_IDENT:
        cssval = new CSSIdent(rc_qname(token.text()));
        break;
      default:
        ;
    }
    if (cssval.is_null()) {
      parsing_error("unexpected replacement");
    } else if (valg->primitive()) {
      PrimitiveValidator* validator =
          static_cast<PrimitiveValidator*>(valg->first()->validator());
      validator->add_replacement(cssval);
    }
    return std::move(valg);
  }

  static std::unique_ptr<ValidatingGroup> new_group(TokenType op,
      std::vector<std::unique_ptr<ValidatingGroup>>&& vals) {
    std::unique_ptr<ValidatingGroup> group(new ValidatingGroup());
    if (op == TT_BAR_BAR) {
      for (int i = 0; i < vals.size(); i++) {
        std::unique_ptr<ValidatingGroup> subgroup(new ValidatingGroup());
        subgroup->start_clause(i);
        subgroup->add_group(std::move(vals[i]), FOLLOW);
        subgroup->end_clause(i);
        group->add_group(std::move(subgroup), i == 0 ? FOLLOW : ALTERNATE);
      }
      vals.clear();
      std::unique_ptr<ValidatingGroup> outer(new ValidatingGroup());
      outer->start_special_group();
      outer->add_group(std::move(group), REPEATED);
      outer->end_special_group();
      return outer;
    }
    Add how;
    switch (op) {
      case TT_EOF :
        how = FOLLOW;
        break;
      case TT_BAR:
        how = ALTERNATE;
        break;
      default:
        parsing_error("unexpected op");
        how = FOLLOW;
    }
    bool first = true;
    for (std::unique_ptr<ValidatingGroup>& subgroup : vals) {
      group->add_group(std::move(subgroup), first ? FOLLOW : how);
      first = false;
    }
    vals.clear();
    return group;
  }

  static std::unique_ptr<ValidatingGroup> add_counts(
      std::unique_ptr<ValidatingGroup>&& val, int min) {
    std::unique_ptr<ValidatingGroup> group(new ValidatingGroup());
    for (int i = 0; i < min; i++) {
      group->add_group(val->clone(), FOLLOW);
    }
    group->add_group(std::move(val), REPEATED);
    return group;
  }
  
  static std::unique_ptr<ValidatingGroup> add_counts(
      std::unique_ptr<ValidatingGroup>&& val, int min, int max) {
    std::unique_ptr<ValidatingGroup> group(new ValidatingGroup());
    for (int i = 0; i < min; i++) {
      group->add_group(val->clone(), FOLLOW);
    }
    for (int i = min; i < max; i++) {
      group->add_group(val->clone(), OPTIONAL);
    }
    return group;
  }

  static std::unique_ptr<ValidatingGroup> primitive(
      const rc_ref<PropertyValidator>& validator) {
    std::unique_ptr<ValidatingGroup> group(new ValidatingGroup());
    group->add_primitive(validator);
    return group;
  }

  static std::unique_ptr<ValidatingGroup> new_func(const rc_qname& fn,
      std::unique_ptr<ValidatingGroup>&& val) {
    rc_ref<PropertyValidator> validator;
    switch (fn->id()) {
      case ID_COMMA :
        validator = new CommaListValidator(val->finish());
        break;
      case ID_SPACE :
        validator = new SpaceListValidator(val->finish());
        break;
      default:
        validator = new FunctionValidator(fn->to_lower_ascii(), val->finish());
        break;
    }
    return primitive(validator);
  }

  void init_built_in_validators() {
    rc_map<rc_ref<CSSValue>> no_idents = rc_map<rc_ref<CSSValue>>::empty();
    rc_map<rc_ref<CSSValue>> percentage {
      { rc_qname::atom(ID_percent), CSSEmpty::instance()}
    };
    rc_map<rc_ref<CSSValue>> length_units {
      { rc_qname::atom(ID_em), CSSEmpty::instance()},
      { rc_qname::atom(ID_ex), CSSEmpty::instance()},
      { rc_qname::atom(ID_ch), CSSEmpty::instance()},
      { rc_qname::atom(ID_rem), CSSEmpty::instance()},
      { rc_qname::atom(ID_vh), CSSEmpty::instance()},
      { rc_qname::atom(ID_vw), CSSEmpty::instance()},
      { rc_qname::atom(ID_vmin), CSSEmpty::instance()},
      { rc_qname::atom(ID_vmax), CSSEmpty::instance()},
      { rc_qname::atom(ID_cm), CSSEmpty::instance()},
      { rc_qname::atom(ID_mm), CSSEmpty::instance()},
      { rc_qname::atom(ID_in), CSSEmpty::instance()},
      { rc_qname::atom(ID_px), CSSEmpty::instance()},
      { rc_qname::atom(ID_pt), CSSEmpty::instance()},
      { rc_qname::atom(ID_pc), CSSEmpty::instance()},
    };
    rc_map<rc_ref<CSSValue>> angle_units {
      { rc_qname::atom(ID_deg), CSSEmpty::instance()},
      { rc_qname::atom(ID_grad), CSSEmpty::instance()},
      { rc_qname::atom(ID_rad), CSSEmpty::instance()},
      { rc_qname::atom(ID_turn), CSSEmpty::instance()},
    };
    rc_map<rc_ref<CSSValue>> time_units {
      { rc_qname::atom(ID_s), CSSEmpty::instance()},
      { rc_qname::atom(ID_ms), CSSEmpty::instance()},
    };
    rc_map<rc_ref<CSSValue>> freq_units {
      { rc_qname::atom(ID_Hz), CSSEmpty::instance()},
      { rc_qname::atom(ID_kHz), CSSEmpty::instance()},
    };
    rc_map<rc_ref<CSSValue>> res_units {
      { rc_qname::atom(ID_dpi), CSSEmpty::instance()},
      { rc_qname::atom(ID_dpcm), CSSEmpty::instance()},
      { rc_qname::atom(ID_dppx), CSSEmpty::instance()},
    };
    std::pair<rc_qname, std::unique_ptr<ValidatingGroup>> named_data[] = {
      { rc_qname::atom(ID_HASHCOLOR), primitive(
          new PrimitiveValidator(ALLOW_COLOR, no_idents, no_idents)) },
      { rc_qname::atom(ID_POS_INT), primitive(
          new PrimitiveValidator(ALLOW_POS_INT, no_idents, no_idents)) },
      { rc_qname::atom(ID_POS_NUM), primitive(
          new PrimitiveValidator(ALLOW_POS_NUM, no_idents, no_idents)) },
      { rc_qname::atom(ID_POS_PERCENTAGE), primitive(
          new PrimitiveValidator(ALLOW_POS_NUMERIC, no_idents, percentage)) },
      { rc_qname::atom(ID_NEGATIVE), primitive(
          new PrimitiveValidator(ALLOW_NEGATIVE, no_idents, no_idents)) },
      { rc_qname::atom(ID_ZERO), primitive(
          new PrimitiveValidator(ALLOW_ZERO, no_idents, no_idents)) },
      { rc_qname::atom(ID_ZERO_PERCENTAGE), primitive(
          new PrimitiveValidator(ALLOW_ZERO_PERCENT, no_idents, no_idents)) },
      { rc_qname::atom(ID_POS_LENGTH), primitive(
          new PrimitiveValidator(ALLOW_POS_NUMERIC, no_idents, length_units)) },
      { rc_qname::atom(ID_POS_ANGLE), primitive(
          new PrimitiveValidator(ALLOW_POS_NUMERIC, no_idents, angle_units)) },
      { rc_qname::atom(ID_POS_TIME), primitive(
          new PrimitiveValidator(ALLOW_POS_NUMERIC, no_idents, time_units)) },
      { rc_qname::atom(ID_FREQUENCY), primitive(
          new PrimitiveValidator(ALLOW_POS_NUMERIC, no_idents, freq_units)) },
      { rc_qname::atom(ID_RESOLUTION), primitive(
          new PrimitiveValidator(ALLOW_POS_NUMERIC, no_idents, res_units)) },
      { rc_qname::atom(ID_URI), primitive(
          new PrimitiveValidator(ALLOW_URL, no_idents, no_idents)) },
      { rc_qname::atom(ID_IDENT), primitive(
          new PrimitiveValidator(ALLOW_IDENT, no_idents, no_idents)) },
      { rc_qname::atom(ID_STRING), primitive(
          new PrimitiveValidator(ALLOW_STR, no_idents, no_idents)) },
    };
    data_->named =
        std::unordered_map<rc_qname, std::unique_ptr<ValidatingGroup>> {
            std::make_move_iterator(std::begin(named_data)),
            std::make_move_iterator(std::end(named_data))
        };
    printf("%ld\n", data_->named.size());
    rc_map<rc_ref<CSSValue>> stdfont {
      { rc_qname::atom(ID_font_family),
          new CSSIdent(rc_qname::atom(ID_sans_serif)) },
    };
    data_->system_fonts =
        std::unordered_map<rc_qname, rc_map<rc_ref<CSSValue>>> {
          { rc_qname::atom(ID_caption), stdfont },
          { rc_qname::atom(ID_icon), stdfont },
          { rc_qname::atom(ID_menu), stdfont },
          { rc_qname::atom(ID_message_box), stdfont },
          { rc_qname::atom(ID_small_caption), stdfont },
          { rc_qname::atom(ID_status_bar), stdfont },
        };
  }

  static bool is_special(const rc_qname& name) {
    const char* s = name->name()->utf8();
    while(true) {
      char c = *s;
      if (c == '\0') {
        return true;
      }
      if (('A' > c || 'Z' < c) && c != '_') {
        return false;
      }
      ++s;
    }
  }

  rc_qname read_name_and_prefixes(Tokenizer* tok, Section section) {
    if (tok->token().type() == TT_EOF) {
      // Finished normally
      return rc_qname();
    }
    std::vector<rc_string> rule_prefixes;
    if (tok->token().type() == TT_O_BRK) {
      do {
        tok->consume();
        if (tok->token().type() != TT_IDENT) {
          parsing_error("Prefix name expected");
          return rc_qname();
        }
        rule_prefixes.push_back(tok->token().text());
        tok->consume();
      } while (tok->token().type() == TT_COMMA);
      if (tok->token().type() != TT_C_BRK) {
        parsing_error("']' expected");
        return rc_qname();
      }
      tok->consume();
    }
    if (tok->token().type() != TT_IDENT) {
      parsing_error("Property name expected");
      return rc_qname();
    }
    if (tok->token().text()
        == (section == VALIDATORS ? "DEFAULTS" : "SHORTHANDS")) {
      tok->consume();
      return rc_qname();
    }
    rc_qname name(tok->token().text());
    tok->consume();
    if (section != DEFAULTS) {
      if (tok->token().type() != TT_EQ) {
        parsing_error("'=' expected");
        return rc_qname();
      }
      if (!is_special(name)) {
        if (rule_prefixes.empty()) {
          data_->prefixed_map[name] = name;
        } else {
          for (const rc_string& prefix : rule_prefixes) {
            StringWriter w;
            w << "-" << prefix << "-" << name;
            rc_qname prefixed(w.to_string());
            data_->prefixed_map[prefixed] = name;
          }
        }
      }
    } else {
      if (tok->token().type() != TT_COLON) {
        parsing_error("'=' expected");
        return rc_qname();
      }
    }
    return name;
  }

  std::unique_ptr<ValidatingGroup> reduce(TokenType op,
      std::vector<std::unique_ptr<ValidatingGroup>>* vals) {
    if (vals->empty()) {
      parsing_error("No values");
      return nullptr;
    }
    if (vals->size() == 1)
      return std::move(vals->front());
    return new_group(op, std::move(*vals));
  }

  TokenType setop(bool* expectval, TokenType op, TokenType currop) {
    if (*expectval || (op != TT_INVALID && op != currop)) {
      parsing_error("inconsistent ops");
      return op;
    }
    *expectval = true;
    return currop;
  }

  struct PropStackEntry {
    std::vector<std::unique_ptr<ValidatingGroup>> vals;
    TokenType op;
    TokenType begin;
    rc_qname fn;
  };

  void parse_validators(Tokenizer* tok) {
    while (true) {
      rc_qname rule_name = read_name_and_prefixes(tok, VALIDATORS);
      if (rule_name.empty()) {
        return;
      }

      std::vector<std::unique_ptr<ValidatingGroup>> vals;
      std::stack<PropStackEntry> stack;
      TokenType op = TT_INVALID;
      std::unique_ptr<ValidatingGroup> val;
      bool expectval = true;

      std::unique_ptr<ValidatingGroup> result;
      while (!result) {
        tok->consume();
        const Token& token = tok->token();
        switch (token.type()) {
          case TT_IDENT : {
            if (!expectval) {
              op = setop(&expectval, op, TT_EOF);
            }
            rc_qname name(token.text());
            if (is_special(name)) {
              const std::unique_ptr<ValidatingGroup>& built_in =
                  data_->named[name];
              if (!built_in) {
                parsing_error("unknown built-in identifier");
                return;
              }
              vals.push_back(built_in->clone());
            } else {
              rc_map<rc_ref<CSSValue>> idents {{name, new CSSIdent(name)}};
              vals.push_back(primitive(new PrimitiveValidator(
                  0, idents, rc_map<rc_ref<CSSValue>>::empty())));
            }
            expectval = false;
            break;
          }
          case TT_INT: {
            StringWriter w;
            w << token.num();
            rc_qname name(w.to_string());
            rc_map<rc_ref<CSSValue>> idents {{name, new CSSIdent(name)}};
            vals.push_back(primitive(new PrimitiveValidator(
                0, idents, rc_map<rc_ref<CSSValue>>::empty())));
            expectval = false;
            break;
          }
          case TT_BAR:
          case TT_BAR_BAR:
            op = setop(&expectval, op, token.type());
            break;
          case TT_O_BRK:
            if (!expectval) {
              op = setop(&expectval, op, TT_EOF);
            }
            stack.push(PropStackEntry {std::move(vals), op, TT_O_BRK});
            op = TT_INVALID;
            assert(vals.empty());
            expectval = true;
            break;
          case TT_FUNC:
            if (!expectval) {
              op = setop(&expectval, op, TT_EOF);
            }
            stack.push(PropStackEntry {
              std::move(vals), op, TT_O_PAR, rc_qname(token.text())});
            op = TT_INVALID;
            assert(vals.empty());
            expectval = true;
            break;
          case TT_C_BRK: {
            val = reduce(op, &vals);
            PropStackEntry& open = stack.top();
            if (open.begin != TT_O_BRK) {
              parsing_error("']' unexpected");
              return;
            }
            vals = std::move(open.vals);
            vals.push_back(std::move(val));
            op = open.op;
            stack.pop();
            expectval = false;
            break;
          }
          case TT_C_PAR: {
            val = reduce(op, &vals);
            PropStackEntry& open = stack.top();
            if (open.begin != TT_O_PAR) {
              parsing_error("')' unexpected");
              return;
            }
            vals = std::move(open.vals);
            vals.push_back(new_func(open.fn, std::move(val)));
            op = open.op;
            stack.pop();
            expectval = false;
            break;
          }
          case TT_COLON:
            if (expectval) {
              parsing_error("':' unexpected");
              return;
            }
            tok->consume();
            vals.back() = add_replacement(std::move(vals.back()), tok->token());
            break;
          case TT_QMARK:
            if (expectval) {
              parsing_error("'?' unexpected");
              return;
            }
            vals.back() = add_counts(std::move(vals.back()), 0, 1);
            break;
          case TT_STAR:
            if (expectval) {
              parsing_error("'*' unexpected");
              return;
            }
            vals.back() = add_counts(std::move(vals.back()), 0);
            break;
          case TT_PLUS:
            if (expectval) {
              parsing_error("'+' unexpected");
              return;
            }
            vals.back() = add_counts(std::move(vals.back()), 1);
            break;
          case TT_O_BRC: {
            tok->consume();
            if (tok->token().type() != TT_INT) {
              parsing_error("<int> expected");
              return;
            }
            int min = static_cast<int>(tok->token().num());
            int max = min;
            tok->consume();
            if (tok->token().type() == TT_COMMA) {
              tok->consume();
              if (tok->token().type() != TT_INT) {
                parsing_error("<int> expected");
                return;
              }
              max = static_cast<int>(tok->token().num());
              tok->consume();
            }
            if (tok->token().type() != TT_C_BRC) {
              parsing_error("'}' expected");
              return;
            }
            vals.back() = add_counts(std::move(vals.back()), min, max);
            break;
          }
          case TT_SEMICOL:
            result = reduce(op, &vals);
            if (!stack.empty()) {
              parsing_error("unclosed bracket");
              return;
            }
            break;
          default:
            parsing_error("unexpected bracket");
            return;
        }
      }
      tok->consume();
      if (is_special(rule_name)) {
        data_->named[rule_name] = std::move(result);
      } else {
        if (result->simple()) {
          data_->validators[rule_name] = result->first()->validator();
        } else {
          data_->validators[rule_name] =
              new SpaceListValidator(result->finish());
        }
      }
    }
  }

  void parse_defaults(Tokenizer* tok) {
    while (true) {
      rc_qname prop_name = read_name_and_prefixes(tok, DEFAULTS);
      if (prop_name.empty()) {
        return;
      }
      std::vector<rc_ref<CSSValue>> vals;
      while (true) {
        tok->consume();
        if (tok->token().type() == TT_SEMICOL) {
          tok->consume();
          break;
        }
        switch (tok->token().type()) {
          case TT_IDENT:
            vals.push_back(new CSSIdent(rc_qname(tok->token().text())));
            break;
          case TT_NUM:
            vals.push_back(new CSSNumber(tok->token().num()));
            break;
          case TT_INT:
            vals.push_back(new CSSInteger(
                static_cast<int>(tok->token().num())));
            break;
          case TT_NUMERIC:
            vals.push_back(new CSSNumeric(tok->token().num(),
                rc_qname(tok->token().text())));
            break;
          default:
            parsing_error("unexpected token");
            return;
        }
      }
      data_->default_values[prop_name] = vals.size() > 1
          ? rc_ref<CSSValue>(new CSSSpaceList(rc_list<rc_ref<CSSValue>>(vals)))
          : vals[0];
    }
  }

  struct ShortcutStackEntry {
    std::vector<rc_ref<ShorthandSyntaxNode>> syntax;
    bool slash;
  };

  void parse_shorthands(Tokenizer* tok) {
    while (true) {
      rc_qname rule_name = read_name_and_prefixes(tok, SHORTHANDS);
      if (rule_name.empty()) {
        return;
      }
      std::unique_ptr<ShorthandValidator> shorthand_validator;
      if (tok->nth_token(1).type() == TT_IDENT) {
        rc_qname type(tok->nth_token(1).text());
        shorthand_validator =
            make_shorthand_validator(type, validator_set_.get());
      }
      if (shorthand_validator) {
        tok->consume();
      } else {
        shorthand_validator.reset(
            new SimpleShorthandValidator(validator_set_.get()));
      }
      std::vector<rc_ref<ShorthandSyntaxNode>> syntax;
      bool result = false;
      bool slash = false;
      std::stack<ShortcutStackEntry> stack;
      std::vector<rc_qname> prop_list;
      while (!result) {
        tok->consume();
        const Token& token = tok->token();
        switch (token.type()) {
          case TT_IDENT : {
            rc_qname name(token.text());
            if (data_->validators.find(name) != data_->validators.end()) {
              syntax.push_back(
                  shorthand_validator->syntax_node_for_property(name));
              prop_list.push_back(name);
            } else {
              auto it = data_->shorthands.find(name);
              if (it != data_->shorthands.end()
                  && it->second->is_insets_shorthand_validator()) {
                InsetsShorthandValidator* inset_shorthand =
                  static_cast<InsetsShorthandValidator*>(it->second.get());
                syntax.push_back(inset_shorthand->create_syntax_node());
                for (const rc_qname& prop : inset_shorthand->prop_list()) {
                  prop_list.push_back(prop);
                }
              } else {
                parsing_error("not an an inset shorthand or a simple property");
                return;
              }
            }
            break;
          }
          case TT_SLASH :
            if (!syntax.empty() || slash) {
              parsing_error("unexpected slash");
              return;
            }
            slash = true;
            break;
          case TT_O_BRK :
            stack.push(ShortcutStackEntry {std::move(syntax), slash});
            assert(syntax.empty());
            slash = false;
            break;
          case TT_C_BRK : {
            rc_ref<ShorthandSyntaxNode> compound(
                new ShorthandSyntaxCompound(std::move(syntax), slash));
            syntax = std::move(stack.top().syntax);
            slash = stack.top().slash;
            stack.pop();
            syntax.push_back(std::move(compound));
            break;
          }
          case TT_SEMICOL:
            result = true;
            tok->consume();
            break;
          default:
            parsing_error("unexpected token");
            return;
        }
      }
      shorthand_validator->init(rc_list<rc_ref<ShorthandSyntaxNode>>(syntax),
          rc_list<rc_qname>(prop_list));
      data_->shorthands[rule_name] = std::move(shorthand_validator);
    }
  }

  std::unordered_map<rc_qname, rc_ref<CSSValue>> make_prop_set(
      std::initializer_list<int> atom_ids) {
    std::unordered_map<rc_qname, rc_ref<CSSValue>> map;
    for (int atom_id : atom_ids) {
      rc_qname prop = rc_qname::atom(atom_id);
      auto shorthand = data_->shorthands.find(prop);
      rc_list<rc_qname> list = shorthand != data_->shorthands.end()
          ? shorthand->second->prop_list() : rc_list<rc_qname>::of(prop);
      for (const rc_qname& pname : list) {
        auto pval = data_->default_values.find(pname);
        if (pval == data_->default_values.end()) {
          parsing_error("Unknown property in make_prop_set");
        } else {
          map[pname] = pval->second;
        }
      }
    }
    return map;
  }

 public:
  std::unique_ptr<CSSValidatorSet> parse(const rc_binary& text) {
    // Not as robust as CSS parser.
    init_built_in_validators();
    Tokenizer tok(reinterpret_cast<const char*>(text->data()), text->length());
    parse_validators(&tok);
    parse_defaults(&tok);
    parse_shorthands(&tok);
    data_->background_props = make_prop_set({ID_background});
    data_->layout_props = make_prop_set({ID_margin, ID_border, ID_padding,
        ID_columns, ID_column_gap, ID_column_rule, ID_column_fill});
    data_ = nullptr;
    return std::move(validator_set_);
  }

 private:
  std::unique_ptr<CSSValidatorSet> validator_set_;
  CSSValidatorSetData* data_;
};

}

CSSValidatorSet::CSSValidatorSet() : data_(new CSSValidatorSetData()) {}

void CSSValidatorSet::validate_property_and_handle_shorthand(
    const rc_qname& orig_name, const rc_ref<CSSValue>& value, bool important,
    PropertyReceiver* receiver) {
  auto it = data_->prefixed_map.find(orig_name);
  if (it != data_->prefixed_map.end()) {
    // known property (simple or shorthand)
    const rc_qname& name = it->second;
    auto validator_it = data_->validators.find(name);
    if (validator_it != data_->validators.end()) {
      // simple property
      if (value->id() == ID_inherit || value->is<rc_ref<CSSExpr>>()) {
        receiver->simple_property(name, value, important);
      } else {
        PropertyValidator* validator = validator_it->second.ptr();
        const rc_ref<CSSValue> rvalue = value->visit(validator);
        if (rvalue.is_null()) {
          receiver->invalid_property_value(orig_name, value);
        } else {
          receiver->simple_property(name, rvalue, important);
        }
      }
    } else {
      // must be a shorthand property
      std::unique_ptr<ShorthandValidator> shorthand =
          data_->shorthands.find(orig_name)->second->clone();
      if (value->id() == ID_inherit) {
        shorthand->propagate_inherit(important, receiver);
      } else {
        value->visit(shorthand.get());
        if (!shorthand->finish(important, receiver)) {
          receiver->invalid_property_value(orig_name, value);
        }
      }
    }
  } else {
    receiver->unknown_property(orig_name, value);
  }
}

CSSValidatorSet* CSSValidatorSet::default_validator() {
  static std::unique_ptr<CSSValidatorSet> default_instance =
      ValidatorParser().parse(rc_binary(load::get_app_package()->read(
          "validation.txt")));
  return default_instance.get();
}


}
}
