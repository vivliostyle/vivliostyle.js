#ifndef adapt_pm_page_box_h
#define adapt_pm_page_box_h

#include <unordered_map>

#include "adapt/base/rc_list.h"
#include "adapt/base/rc_map.h"
#include "adapt/css/cascade.h"
#include "adapt/expr/expr.h"

// Page master description

namespace adapt {

namespace layout {

class Container;
class Page;

}

namespace load {

class Package;

}

namespace pm {

class PageMaster;
class PartitionGroup;
class Partition;
class PageBoxInstance;
class PageBoxParserHandler;
class PageMasterInstance;
class PartitionGroupInstance;
class PartitionInstance;

//------------------------------------------------------------------------

/**
 * Represent an at-rule which creates a page-level CSS box (page-master,
 * partition, and partition-group).
 */
class PageBox : public RefCountedObject {
  friend class PageBoxInstance;
  friend class PageBoxParserHandler;
 public:
  PageBox(const rc_qname& name, const rc_qname& pseudoname,
      const rc_value& classes, PageBox* parent);

  virtual PageBoxInstance* create_instance(PageBoxInstance* parent) = 0;

  PageMaster* page_master() const { return page_master_; }
  rc_string name_nonempty() const;  // for debug only

  rc_qname name() const { return name_; }

 protected:
  rc_qname name_;
  rc_qname pseudoname_;
  rc_value classes_;  // either rc_list<rc_qname> or rc_qname
  rc_map<rc_ref<css::CascadeValue>> style_;
  rc_list<rc_ref<PageBox>> children_;
  PageMaster* page_master_;
  PageBox* parent_;
};

class PageMaster : public PageBox {
  friend class PartitionGroup;
  friend class Partition;
  friend class PageMasterInstance;
 public:
  PageMaster(const rc_ref<expr::Scope>& scope, const rc_qname& name,
      const rc_qname& pseudoname, const rc_value& classes,
      const rc_ref<expr::Expr>& condition, css::cascade_priority_t specificity);

  PageMasterInstance* create_page_master_instance();
  virtual PageBoxInstance* create_instance(PageBoxInstance* parent) override;

  const rc_ref<expr::Expr>& condition() const { return condition_; }

  expr::Scope* scope() const { return scope_.ptr(); }

 protected:
  PageBoxInstance* page_box_instance_for(expr::Context* cx,
      const rc_qname& box_name);

  rc_ref<expr::Expr> condition_;
  css::cascade_priority_t specificity_;
  rc_ref<expr::Scope> scope_;
};

class PartitionGroup : public PageBox {
 public:
  PartitionGroup(const rc_qname& name, const rc_qname& pseudoname,
      const rc_value& classes, PageBox* parent);
  virtual PageBoxInstance* create_instance(PageBoxInstance* parent) override;
};

class Partition : public PageBox {
 public:
  Partition(const rc_qname& name, const rc_qname& pseudoname,
      const rc_value& classes, PageBox* parent);
  virtual PageBoxInstance* create_instance(PageBoxInstance* parent) override;
};

//----------------------------------------------------------------------

class PageMasterInstance;
class PartitionGroupInstance;
class PartitionInstance;
class PageBoxInstanceMap;

class PageBoxInstance : public RefCountedObject {
  friend class PartitionGroupInstance;
  friend class PartitionInstance;
 public:
  PageBoxInstance(PageBoxInstance* parent_instance, PageBox* page_box);

  rc_ref<expr::Expr> resolve_local(const rc_qname& name);

  rc_ref<css::CSSValue> get_prop(expr::Context* context, const rc_qname& name);
  double get_prop_as_number(expr::Context* context, const rc_qname& name);
  double get_value(expr::Context* context, const rc_qname& name);
  rc_list<rc_qname> get_active_regions(expr::Context* context);

  PageBox* page_box() const { return page_box_; }
  double calculated_width() const { return calculated_width_; }
  double calculated_height() const { return calculated_height_; }

  void create_children();

  void apply_cascade(css::CascadeInstance* cascade_instance);
  void init(expr::Context* context);

  bool vertical() const { return is_vertical_; }
  bool auto_width() const { return is_auto_width_; }
  bool auto_height() const { return is_auto_height_; }

  bool top_dependent_on_auto_height() const {
    return is_top_dependent_on_auto_height_;
  }
  bool right_dependent_on_auto_width() const {
    return is_right_dependent_on_auto_width_;
  }

  bool growing_top() const {
    return is_auto_height_ && is_top_dependent_on_auto_height_;
  }
  bool growing_right() const {
    return is_auto_width_ && is_right_dependent_on_auto_width_;
  }

  void prepare_container(expr::Context* context, layout::Container* container);
  void finish_container(expr::Context* context, load::Package* package,
      layout::Container* container, layout::Page* page,
      layout::Container* column_container, size_t column_count);

  const rc_list<rc_ref<PageBoxInstance>>& children() const { return children_; }

  void set_calculated_width(double calculated_width) {
    calculated_width_ = calculated_width;
  }

  void set_calculated_height(double calculated_height) {
    calculated_height_ = calculated_height;
  }

 protected:
  void init_enabled();
  void init_horizontal();
  void init_vertical();
  void init_columns();
  bool depends(const rc_qname& name, const rc_ref<expr::Expr>& value,
      expr::Context* context);

  virtual rc_ref<expr::Expr> box_specific_enabled(
      const rc_ref<expr::Expr>& base_enabled);

  rc_ref<expr::Expr> add_named_values(int id1, int id2);

  rc_ref<css::CSSValue> rescope(const rc_ref<css::CSSValue>& value);

  void assign_left_position(expr::Context* cx, layout::Container* cont);
  void assign_right_position(expr::Context* cx, layout::Container* cont);
  void assign_top_position(expr::Context* cx, layout::Container* cont);
  void assign_bottom_position(expr::Context* cx, layout::Container* cont);
  void assign_before_position(expr::Context* cx, layout::Container* cont);
  void assign_after_position(expr::Context* cx, layout::Container* cont);
  void assign_start_end_position(expr::Context* cx, layout::Container* cont);
  void size_with_max_height(expr::Context* cx, layout::Container* cont);
  void size_with_max_width(expr::Context* cx, layout::Container* cont);

  // cascaded styles, geometric ones converted to CSSExpr
  css::element_style cascaded_;
  std::unordered_map<rc_qname, rc_ref<css::CSSValue>> style_;
  rc_ref<expr::Expr> auto_width_;
  rc_ref<expr::Expr> auto_height_;
  rc_list<rc_ref<PageBoxInstance>> children_;
  bool is_auto_width_ = false;
  bool is_auto_height_ = false;
  bool is_top_dependent_on_auto_height_ = false;
  bool is_right_dependent_on_auto_width_ = false;
  bool is_vertical_ = false;
  bool is_footnote_ = false;
  double calculated_width_ = 0;
  double calculated_height_ = 0;
  PageMasterInstance* page_master_instance_ = nullptr;
  std::unordered_map<rc_qname, rc_ref<expr::Expr>> named_;
  PageBoxInstance* parent_instance_;
  PageBox* page_box_;
};

class PageMasterResolver : public expr::Resolver {
  friend class PageMasterInstance;
 public:
  virtual rc_ref<expr::Expr> resolve_name(const rc_qname& name) override;

 private:
  PageMasterResolver(PageMasterInstance* page_master_instance)
      : page_master_instance_(page_master_instance) {}

  PageMasterInstance* page_master_instance_;
};


class PageMasterInstance : public PageBoxInstance {
  friend class PartitionInstance;
  friend class PartitionGroupInstance;
 public:
  PageMasterInstance(PageMaster* pageBox);
  ~PageMasterInstance();
  
  const rc_ref<expr::Scope>& scope() const { return scope_; }

  rc_ref<expr::Expr> resolve_name(const rc_qname& name);

  struct CompareSpecificity {
    bool operator() (const rc_ref<PageMasterInstance>& pm1,
       const rc_ref<PageMasterInstance>& pm2) const {
      // higher specificity comes first
      return pm1->page_box()->page_master()->specificity_ >
          pm2->page_box()->page_master()->specificity_;
    }
  };
                     
 protected:
  virtual rc_ref<expr::Expr> box_specific_enabled(
      const rc_ref<expr::Expr>& base_enabled) override;

  rc_ref<PageMasterResolver> resolver_;
  rc_ref<expr::Scope> scope_;
  std::unordered_map<rc_qname, PageBoxInstance*> named_boxes_;
};

class PartitionGroupInstance : public PageBoxInstance {
 public:
  PartitionGroupInstance(PageBoxInstance* parentInstance,
      PartitionGroup* pageBox);
};

class PartitionInstance : public PageBoxInstance {
 public:
  PartitionInstance(PageBoxInstance* parentInstance, Partition* pageBox);

 protected:
  virtual rc_ref<expr::Expr> box_specific_enabled(
      const rc_ref<expr::Expr>& base_enabled) override;

 private:
  rc_ref<expr::Expr> process_partition_list(const rc_ref<expr::Expr>& enabled,
      const rc_ref<css::CSSValue>& list_val, bool conflicting);
};

}
}


#endif
