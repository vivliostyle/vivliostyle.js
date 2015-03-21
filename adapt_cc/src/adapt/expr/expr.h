#ifndef adapt_expr_expr_h
#define adapt_expr_expr_h

#include <vector>
#include <unordered_map>

#include "adapt/base/rc_value.h"
#include "adapt/base/rc_string.h"
#include "adapt/base/rc_list.h"
#include "adapt/base/rc_primitive.h"
#include "adapt/base/rc_map.h"

namespace adapt {
namespace expr {

class Expr;
class Resolver;
class Scope;
class Context;
struct FrameList;

enum DependencyState {
  HAS_DEPENDENCY,
  NO_DEPENDENCY,
  PENDING
};

typedef std::unordered_map<const Expr*, DependencyState> dependency_cache_t;
typedef std::unordered_map<const Expr*, rc_value> computed_value_cache_t;
typedef std::unordered_map<size_t, computed_value_cache_t> scope_cache_t;


class Expr : public RefCountedObject {
 public:
  Expr() {}

  bool depend(Scope* scope, Expr* other);
	bool depend_outer(const rc_ref<FrameList>& frames, Expr* other,
      dependency_cache_t* dependency_cache);
  rc_value evaluate(Context* context, const rc_ref<FrameList>& frames);
  virtual void write_to(Writer* writer) const override;
  virtual void write_to(Writer* writer, int priority) const = 0;

  static const char* type_tag();

 protected:
  virtual bool instance_of(const char* type_tag) const;
  virtual rc_value evaluate_core(Context* context,
      const rc_ref<FrameList>& frames) = 0;
	virtual bool depend_core(const rc_ref<FrameList>& frames, Expr* other,
      dependency_cache_t* dependency_cache);
};

class Resolver : public RefCountedObject {
 public:
  virtual rc_ref<Expr> resolve_name(const rc_qname& name) = 0;
};

// Actual parameters or named values bound in the given scope
struct Frame : public RefCountedObject {
  Frame(size_t k, const rc_ref<FrameList>& f, const rc_map<rc_ref<Expr>>& a)
      : key(k), frames(f), defs(a) {}

  virtual void write_to(Writer* writer) const override;

  size_t key;
  rc_ref<FrameList> frames;  // only for actual parameters
  rc_map<rc_ref<Expr>> defs;
  rc_ref<Resolver> resolver;
};

struct FrameList : public RefCountedObject {
  FrameList(const rc_ref<Frame>& f, const rc_ref<FrameList>& o)
      : frame(f), outer(o) {}

  virtual void write_to(Writer* writer) const override;

  rc_ref<Frame> frame;
  rc_ref<FrameList> outer;
};

class Context;

/**
 * Top-level scopes (root, stylesheet, page, page-master). In general, there
 * can be only a single Frame for a given StaticScope.
 */
class Scope : public RefCountedObject {
 public:
  Scope(const rc_ref<Scope>& parent, size_t key);

  rc_ref<FrameList> frames();

  void define_name(const rc_qname& name, const rc_ref<Expr>& definition);

  Scope* parent() const { return parent_.ptr(); }

  rc_ref<Scope> clone(const rc_ref<Resolver>& resolver);

  enum {
    ROOT_KEY = 0,
    PAGE_KEY = 1,
    FIRST_TRANSIENT_KEY = 2
  };
  
  virtual void write_to(Writer* writer) const override;

 protected:
  Scope(const Scope& other, const rc_ref<Resolver>& resolver);

  rc_ref<Scope> parent_;
  std::map<rc_qname, rc_ref<Expr>> definitions_;
  size_t key_;
  rc_ref<FrameList> frames_;
  rc_ref<Resolver> resolver_;
};

struct Common;

const Common& common();

struct Common {
  rc_ref<Scope> scope;
  rc_ref<Expr> v_zero;
  rc_ref<Expr> v_one;
  rc_ref<Expr> v_true;
  rc_ref<Expr> v_false;
  rc_ref<Expr> v_nan;
  rc_ref<Expr> v_empty;

 private:
  friend const Common& common();
  Common();
};

const Common& common();

class Context {
 public:
	rc_value query_value(size_t frame_key, const Expr* value) {
    scope_cache_t::iterator si = scope_cache_.find(frame_key);
    if (si != scope_cache_.end()) {
      computed_value_cache_t::iterator vi = si->second.find(value);
      if (vi != si->second.end()) {
        return vi->second;
      }
    }
    return rc_value::null;
	}

	void store_value(size_t frame_key, const Expr* value, const rc_value& res) {
		scope_cache_[frame_key][value] = res;
	}

  size_t next_call_key() { return ++next_key_; }

  bool media_test(const rc_qname& name, const rc_value& value);

  virtual double query_unit_size(const rc_qname& unit) = 0;
  virtual rc_value query_context_data(const rc_qname& key) = 0;

  void clear_keys(size_t first_key_to_clear);

 private:
  size_t next_key_ = Scope::FIRST_TRANSIENT_KEY;
  scope_cache_t scope_cache_;
};

//--------------- specific expression classes ------------------

class ExprConst : public Expr {
 public:
  ExprConst(const rc_value& value);

  virtual void write_to(Writer* writer, int priority) const override;

 protected:
  virtual rc_value evaluate_core(Context* context,
      const rc_ref<FrameList>& frames) override;

 private:
  rc_value value_;
};

class ExprNumeric : public Expr {
 public:
  ExprNumeric(double value, const rc_qname& unit);

  virtual void write_to(Writer* writer, int priority) const override;

 protected:
  virtual rc_value evaluate_core(Context* context,
      const rc_ref<FrameList>& frames) override;

 private:
  double value_;
  rc_qname unit_;
};

class ExprPrefix : public Expr {
 public:
  ExprPrefix(const rc_ref<Expr>& operand);

  virtual void write_to(Writer* writer, int priority) const override;

 protected:
  virtual const char* op() const = 0;
  virtual rc_value eval_prefix(const rc_value& operand) = 0;
  virtual rc_value evaluate_core(Context* context,
      const rc_ref<FrameList>& frames) override;
  virtual bool depend_core(const rc_ref<FrameList>& frames, Expr* other,
      dependency_cache_t* dependency_cache) override;
 private:
  rc_ref<Expr> operand_;
};

class ExprNot : public ExprPrefix {
 public:
  ExprNot(const rc_ref<Expr>& operand);

 protected:
  virtual const char* op() const override;
  virtual rc_value eval_prefix(const rc_value& operand) override;
};

class ExprNegate : public ExprPrefix {
 public:
  ExprNegate(const rc_ref<Expr>& operand);

 protected:
  virtual const char* op() const override;
  virtual rc_value eval_prefix(const rc_value& operand) override;
};

class ExprInfix : public Expr {
 public:
  ExprInfix(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs);

  virtual void write_to(Writer* writer, int priority) const override;

 protected:
  virtual rc_value eval_infix(const rc_value& lhs, const rc_value& rhs) = 0;
  virtual const char* op() const = 0;
  virtual int priority() const = 0;
  virtual rc_value evaluate_core(Context* context,
      const rc_ref<FrameList>& frames) override;
  virtual bool depend_core(const rc_ref<FrameList>& frames, Expr* other,
      dependency_cache_t* dependency_cache) override;
 protected:
  rc_ref<Expr> lhs_;
  rc_ref<Expr> rhs_;
};

class ExprLogical : public ExprInfix {
 public:
  ExprLogical(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs);
 protected:
  virtual rc_value eval_infix(const rc_value& lhs,
      const rc_value& rhs) override;
  virtual int priority() const override;
  virtual rc_value evaluate_core(Context* context,
      const rc_ref<FrameList>& frames) = 0;
};

class ExprComparison : public ExprInfix {
 public:
  ExprComparison(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs);
 protected:
  virtual int priority() const override;
};

class ExprAdditive : public ExprInfix {
 public:
  ExprAdditive(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs);
 protected:
  virtual int priority() const override;
};
  
class ExprMultiplicative : public ExprInfix {
 public:
  ExprMultiplicative(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs);
 protected:
  virtual int priority() const override;
};

class ExprAnd : public ExprLogical {
 public:
  ExprAnd(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs);
 protected:
  virtual const char* op() const override;
  virtual rc_value evaluate_core(Context* context,
      const rc_ref<FrameList>& frames) override;
};

class ExprAndMedia : public ExprAnd {
 public:
  ExprAndMedia(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs);
 protected:
  virtual const char* op() const override;
};

class ExprOr : public ExprLogical {
 public:
  ExprOr(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs);
protected:
  virtual const char* op() const override;
  virtual rc_value evaluate_core(Context* context,
      const rc_ref<FrameList>& frames) override;
};

class ExprOrMedia : public ExprOr {
public:
  ExprOrMedia(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs);
protected:
  virtual const char* op() const override;
};

class ExprLt : public ExprComparison {
 public:
  ExprLt(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs);
 protected:
  virtual rc_value eval_infix(const rc_value& lhs,
      const rc_value& rhs) override;
  virtual const char* op() const override;
};

class ExprLe : public ExprComparison {
 public:
  ExprLe(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs);
 protected:
  virtual rc_value eval_infix(const rc_value& lhs,
      const rc_value& rhs) override;
  virtual const char* op() const override;
};

class ExprGt : public ExprComparison {
 public:
  ExprGt(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs);
 protected:
  virtual rc_value eval_infix(const rc_value& lhs,
      const rc_value& rhs) override;
  virtual const char* op() const override;
};

class ExprGe : public ExprComparison {
 public:
  ExprGe(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs);
 protected:
  virtual rc_value eval_infix(const rc_value& lhs,
      const rc_value& rhs) override;
  virtual const char* op() const override;
};

class ExprEq : public ExprComparison {
public:
  ExprEq(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs);
protected:
  virtual rc_value eval_infix(const rc_value& lhs,
      const rc_value& rhs) override;
  virtual const char* op() const override;
};

class ExprNe : public ExprComparison {
 public:
  ExprNe(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs);
 protected:
  virtual rc_value eval_infix(const rc_value& lhs,
      const rc_value& rhs) override;
  virtual const char* op() const override;
};

class ExprAdd : public ExprAdditive {
public:
  ExprAdd(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs);
protected:
  virtual rc_value eval_infix(const rc_value& lhs,
      const rc_value& rhs) override;
  virtual const char* op() const override;
};

class ExprSubtract : public ExprAdditive {
public:
  ExprSubtract(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs);
protected:
  virtual rc_value eval_infix(const rc_value& lhs,
      const rc_value& rhs) override;
  virtual const char* op() const override;
};

class ExprMultiply : public ExprMultiplicative {
public:
  ExprMultiply(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs);
protected:
  virtual rc_value eval_infix(const rc_value& lhs,
      const rc_value& rhs) override;
  virtual const char* op() const override;
};

class ExprDivide : public ExprMultiplicative {
public:
  ExprDivide(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs);
protected:
  virtual rc_value eval_infix(const rc_value& lhs,
      const rc_value& rhs) override;
  virtual const char* op() const override;
};

class ExprModulo : public ExprMultiplicative {
 public:
  ExprModulo(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs);
 protected:
  virtual rc_value eval_infix(const rc_value& lhs,
      const rc_value& rhs) override;
  virtual const char* op() const override;
};

class ExprNamed : public Expr {
 public:
  ExprNamed(const rc_qname& name);

  virtual void write_to(Writer* writer, int priority) const override;

  const rc_qname& name() const { return name_; }

  static const char* type_tag();

protected:
  virtual bool instance_of(const char* type_tag) const;
  virtual rc_value evaluate_core(Context* context,
      const rc_ref<FrameList>& frames) override;
	virtual bool depend_core(const rc_ref<FrameList>& frames, Expr* other,
      dependency_cache_t* dependency_cache) override;
  bool resolve_name(rc_ref<FrameList> frames, rc_ref<Expr>* def,
      rc_ref<FrameList>* cx_frames);
 private:
  static const size_t npos = static_cast<size_t>(-1);

  rc_qname name_;
};

class ExprMediaName : public Expr {
public:
  ExprMediaName(bool isnot, const rc_qname& name);

  const rc_qname& name() const { return name_; }

  virtual void write_to(Writer* writer, int priority) const override;
  static const char* type_tag();

protected:
  virtual bool instance_of(const char* type_tag) const;
  virtual rc_value evaluate_core(Context* context,
      const rc_ref<FrameList>& frames) override;
private:
  bool not_;
  rc_qname name_;
};

class ExprCall : public Expr {
 public:
  ExprCall(const rc_ref<Expr>& func, const rc_list<rc_ref<Expr>>& params);

  virtual void write_to(Writer* writer, int priority) const override;
 protected:
  virtual rc_value evaluate_core(Context* context,
      const rc_ref<FrameList>& frames) override;
	virtual bool depend_core(const rc_ref<FrameList>& frames, Expr* other,
      dependency_cache_t* dependency_cache) override;

 private:
  rc_ref<Expr> func_;
  rc_list<rc_ref<Expr>> params_;
};

class ExprCond : public Expr {
 public:
  ExprCond(const rc_ref<Expr>& cond, const rc_ref<Expr>& if_true,
      const rc_ref<Expr>& if_false);
  virtual void write_to(Writer* writer, int priority) const override;
 protected:
  virtual rc_value evaluate_core(Context* context,
      const rc_ref<FrameList>& frames) override;
	virtual bool depend_core(const rc_ref<FrameList>& frames, Expr* other,
      dependency_cache_t* dependency_cache) override;
  
 private:
  rc_ref<Expr> cond_;
  rc_ref<Expr> if_true_;
  rc_ref<Expr> if_false_;
};

class ExprMediaTest : public Expr {
 public:
  ExprMediaTest(const rc_ref<ExprMediaName>& name, const rc_ref<Expr>& value);
  virtual void write_to(Writer* writer, int priority) const override;

  const rc_qname& name() const { return name_->name(); }
  const rc_ref<Expr>& value() const { return value_; }

  static const char* type_tag();

protected:
  virtual bool instance_of(const char* type_tag) const;
  virtual rc_value evaluate_core(Context* context,
      const rc_ref<FrameList>& frames) override;
	virtual bool depend_core(const rc_ref<FrameList>& frames, Expr* other,
      dependency_cache_t* dependency_cache) override;

 private:
  rc_ref<ExprMediaName> name_;
  rc_ref<Expr> value_;
};

class ExprFrameAdjust : public Expr {
 public:
  ExprFrameAdjust(const rc_ref<Expr>& body, size_t adjustment);

  virtual void write_to(Writer* writer, int priority) const override;
 protected:
  virtual rc_value evaluate_core(Context* context,
      const rc_ref<FrameList>& frames) override;
  virtual bool depend_core(const rc_ref<FrameList>& frames, Expr* other,
      dependency_cache_t* dependency_cache) override;

 private:
  rc_ref<Expr> body_;
  size_t adjustment_;
};

class ExprLambda : public Expr {
 public:
  ExprLambda(const rc_ref<Expr>& body, const rc_list<rc_qname>& names);

  virtual void write_to(Writer* writer, int priority) const override;
 protected:
  virtual rc_value evaluate_core(Context* context,
      const rc_ref<FrameList>& frames) override;
  virtual bool depend_core(const rc_ref<FrameList>& frames, Expr* other,
      dependency_cache_t* dependency_cache) override;

 private:
  rc_ref<Expr> body_;
  rc_list<rc_qname> names_;
};

class ExprBlock : public Expr {
 public:
  ExprBlock(const rc_ref<Expr> body,
      const rc_map<rc_ref<Expr>>& definitions);
  virtual void write_to(Writer* writer, int priority) const override;
 protected:
  virtual rc_value evaluate_core(Context* context,
      const rc_ref<FrameList>& frames) override;
  virtual bool depend_core(const rc_ref<FrameList>& frames, Expr* other,
      dependency_cache_t* dependency_cache) override;
 private:
  rc_ref<Expr> body_;
  rc_map<rc_ref<Expr>> definitions_;
};

//-------------------- built-in data structures --------------------------

class List : public RefCountedObject {
 public:
  List(const rc_value& head, const rc_value& tail);

  const rc_value& head(Context* context);
  const rc_value& tail(Context* context);

  virtual void write_to(Writer* writer) const override;

  static const rc_ref<List>& empty();

  static const char* type_tag();
 protected:
  virtual bool instance_of(const char* type_tag) const;

 private:
  rc_value head_;
  rc_value tail_;
};


// Unevaluated part of a data structure (e.g. for list comprehensions).
class AbstractPartial : public RefCountedObject {
 public:
  virtual rc_value apply(Context* context) = 0;

  static const char* type_tag();
 protected:
  virtual bool instance_of(const char* type_tag) const;
};

class AbstractClosure : public RefCountedObject {
 public:
  virtual rc_value apply(Context* context, const rc_ref<Frame>& params) = 0;
  virtual rc_list<rc_qname> formals() const = 0;

  static const char* type_tag();
 protected:
  virtual bool instance_of(const char* type_tag) const;
};

class Closure : public AbstractClosure {
 public:
  Closure(const rc_ref<Expr>& body, const rc_list<rc_qname>& formals,
      const rc_ref<FrameList>& frames);

  virtual void write_to(Writer* writer) const override;
  rc_value apply(Context* context, const rc_ref<Frame>& params);
  virtual rc_list<rc_qname> formals() const override;

 private:
  rc_ref<Expr> body_;
  rc_list<rc_qname> formals_;
  rc_ref<FrameList> frames_;
};

class Partial : public AbstractPartial {
 public:
  Partial(const rc_ref<Expr>& body, const rc_ref<FrameList>& frames);

  virtual void write_to(Writer* writer) const override;
  rc_value apply(Context* context);

 private:
  rc_ref<Expr> body_;
  rc_ref<FrameList> frames_;
};

class GreedyBuiltin : public AbstractClosure {
 public:
  GreedyBuiltin(size_t arg_count);
  virtual rc_value apply(Context* context,
      const rc_ref<Frame>& params) override;
  virtual rc_value apply(Context* context, const rc_value* args) const = 0;
  virtual rc_list<rc_qname> formals() const override;
 private:
  size_t arg_count_;
};

//-------------------------- operators ---------------------------------

rc_ref<Expr> operator+(const rc_ref<Expr>& v1, const rc_ref<Expr>& v2);
rc_ref<Expr> operator-(const rc_ref<Expr>& v1, const rc_ref<Expr>& v2);
rc_ref<Expr> operator*(const rc_ref<Expr>& v1, const rc_ref<Expr>& v2);
rc_ref<Expr> operator*(double v1, const rc_ref<Expr>& v2);
rc_ref<Expr> operator/(const rc_ref<Expr>& v1, const rc_ref<Expr>& v2);
rc_ref<Expr> operator&&(const rc_ref<Expr>& v1, const rc_ref<Expr>& v2);
rc_ref<Expr> operator||(const rc_ref<Expr>& v1, const rc_ref<Expr>& v2);

}
}


#endif
