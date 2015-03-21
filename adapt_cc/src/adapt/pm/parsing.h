#ifndef adapt_pm_parsing_h
#define adapt_pm_parsing_h

#include <map>
#include <vector>

#include "adapt/css/parsing.h"
#include "adapt/css/cascade.h"
#include "adapt/css/valid.h"
#include "adapt/expr/expr.h"
#include "adapt/pm/page_box.h"

namespace adapt {
namespace pm {

class PageBoxParserHandler : public css::SlaveParserHandler {
 public:
  PageBoxParserHandler(const rc_ref<expr::Scope>& scope,
      css::DispatchingParserHandler* owner, PageBox* target,
      css::CSSValidatorSet* validator_set);
  virtual ~PageBoxParserHandler();
  virtual void property(const rc_qname& name,
      const rc_ref<css::CSSValue>& value, bool important) override;
  virtual void unknown_property(const rc_qname& name,
      const rc_ref<css::CSSValue>& value) override;
  virtual void invalid_property_value(const rc_qname& name,
      const rc_ref<css::CSSValue>& value) override;
  virtual void simple_property(const rc_qname& name,
      const rc_ref<css::CSSValue>& value, bool important) override;
 protected:
  void init_for_page_dimensions();

  PageBox* target_;
  css::CSSValidatorSet* validator_set_;
  std::vector<rc_ref<PageBox>> children_;
  std::map<rc_qname, rc_ref<css::CascadeValue>> style_;
};

class PartitionParserHandler : public PageBoxParserHandler {
 public:
  PartitionParserHandler(const rc_ref<expr::Scope>& scope,
      css::DispatchingParserHandler* owner, Partition* target,
      css::CSSValidatorSet* validator_set);
};

class PartitionGroupParserHandler : public PageBoxParserHandler {
 public:
  PartitionGroupParserHandler(const rc_ref<expr::Scope>& scope,
      css::DispatchingParserHandler* owner, PartitionGroup* target,
      css::CSSValidatorSet* validator_set);
  virtual void start_partition_group_rule(const rc_qname& name,
      const rc_qname& pseudoname, const rc_list<rc_qname>& classes) override;
  virtual void start_partition_rule(const rc_qname& name,
      const rc_qname& pseudoname, const rc_list<rc_qname>& classes) override;
};

class PageMasterParserHandler : public PageBoxParserHandler {
 public:
  PageMasterParserHandler(const rc_ref<expr::Scope>& scope,
      css::DispatchingParserHandler* owner, PageMaster* target,
      css::CSSValidatorSet* validator_set);
  virtual void start_partition_group_rule(const rc_qname& name,
      const rc_qname& pseudoname, const rc_list<rc_qname>& classes) override;
  virtual void start_partition_rule(const rc_qname& name,
      const rc_qname& pseudoname, const rc_list<rc_qname>& classes) override;
};


}
}


#endif
