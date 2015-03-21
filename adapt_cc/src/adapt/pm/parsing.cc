#include "adapt/pm/parsing.h"

namespace adapt {
namespace pm {


PageBoxParserHandler::PageBoxParserHandler(
    const rc_ref<expr::Scope>& scope,
    css::DispatchingParserHandler* owner, PageBox* target,
    css::CSSValidatorSet* validator_set)
        : SlaveParserHandler(scope, owner, false), target_(target),
          validator_set_(validator_set) {}

PageBoxParserHandler::~PageBoxParserHandler() {
  target_->style_ = rc_map<rc_ref<css::CascadeValue>>(style_);
  target_->children_ = rc_list<rc_ref<PageBox>>(children_);
}

void PageBoxParserHandler::init_for_page_dimensions() {
  static rc_ref<css::CSSValue> page_width =
      new css::CSSNumeric(100, rc_qname::atom(ID_vw));
  static rc_ref<css::CSSValue> page_height =
      new css::CSSNumeric(100, rc_qname::atom(ID_vh));
  style_[rc_qname::atom(ID_width)] = new css::CascadeValue(page_width, 0);
  style_[rc_qname::atom(ID_height)] = new css::CascadeValue(page_height, 0);

}

void PageBoxParserHandler::property(const rc_qname& name,
    const rc_ref<css::CSSValue>& value, bool important) {
  validator_set_->validate_property_and_handle_shorthand(name, value,
      important, this);
}

void PageBoxParserHandler::unknown_property(const rc_qname& name,
    const rc_ref<css::CSSValue>& value) {
  fprintf(stderr, "Invalid property: %s\n", name->to_string()->utf8());
}

void PageBoxParserHandler::invalid_property_value(const rc_qname& name,
    const rc_ref<css::CSSValue>& value) {
  fprintf(stderr, "Invalid property value: %s\n", name->to_string()->utf8());
}

void PageBoxParserHandler::simple_property(const rc_qname& name,
    const rc_ref<css::CSSValue>& value, bool important) {
  css::cascade_priority_t specificity = important ? css::PRI_ORIGIN_UNIT : 0;
  style_[name] = new css::CascadeValue(value, specificity);
}

PartitionParserHandler::PartitionParserHandler(
    const rc_ref<expr::Scope>& scope,
    css::DispatchingParserHandler* owner, Partition* target,
    css::CSSValidatorSet* validator_set)
        : PageBoxParserHandler(scope, owner, target, validator_set) {}

PartitionGroupParserHandler::PartitionGroupParserHandler(
    const rc_ref<expr::Scope>& scope, css::DispatchingParserHandler* owner,
    PartitionGroup* target, css::CSSValidatorSet* validator_set)
        : PageBoxParserHandler(scope, owner, target, validator_set) {
  init_for_page_dimensions();
}

void PartitionGroupParserHandler::start_partition_group_rule(
    const rc_qname& name, const rc_qname& pseudoname,
    const rc_list<rc_qname>& classes) {
  PartitionGroup* partition_group =
  new PartitionGroup(name, pseudoname, classes, target_);
  children_.push_back(partition_group);
  css::ParserHandler* handler = new PartitionGroupParserHandler(scope_, owner_,
      partition_group, validator_set_);
  owner_->push_handler(std::unique_ptr<css::ParserHandler>(handler));
}

void PartitionGroupParserHandler::start_partition_rule(const rc_qname& name,
    const rc_qname& pseudoname, const rc_list<rc_qname>& classes) {
  Partition* partition = new Partition(name, pseudoname, classes, target_);
  children_.push_back(partition);
  css::ParserHandler* handler = new PartitionParserHandler(scope_, owner_,
       partition, validator_set_);
  owner_->push_handler(std::unique_ptr<css::ParserHandler>(handler));
}

PageMasterParserHandler::PageMasterParserHandler(
    const rc_ref<expr::Scope>& scope,
    css::DispatchingParserHandler* owner, PageMaster* target,
    css::CSSValidatorSet* validator_set)
        : PageBoxParserHandler(scope, owner, target, validator_set) {
  init_for_page_dimensions();
}

void PageMasterParserHandler::start_partition_group_rule(const rc_qname& name,
    const rc_qname& pseudoname, const rc_list<rc_qname>& classes) {
  PartitionGroup* partition_group =
      new PartitionGroup(name, pseudoname, classes, target_);
  children_.push_back(partition_group);
  css::ParserHandler* handler = new PartitionGroupParserHandler(scope_, owner_,
      partition_group, validator_set_);
  owner_->push_handler(std::unique_ptr<css::ParserHandler>(handler));
}

void PageMasterParserHandler::start_partition_rule(const rc_qname& name,
    const rc_qname& pseudoname, const rc_list<rc_qname>& classes) {
  Partition* partition = new Partition(name, pseudoname, classes, target_);
  children_.push_back(partition);
  css::ParserHandler* handler = new PartitionParserHandler(scope_, owner_,
      partition, validator_set_);
  owner_->push_handler(std::unique_ptr<css::ParserHandler>(handler));
}


}
}