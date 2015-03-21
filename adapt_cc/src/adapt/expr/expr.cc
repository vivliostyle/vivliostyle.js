#include "adapt/expr/expr.h"

#include <limits>

#include "adapt/base/rc_primitive.h"

namespace adapt {
namespace expr {

namespace {

rc_list<rc_list<rc_qname>> builtin_args_list() {
  rc_qname all[] = { rc_qname::atom(ID_arg0), rc_qname::atom(ID_arg1),
      rc_qname::atom(ID_arg2), rc_qname::atom(ID_arg3),
      rc_qname::atom(ID_arg4), rc_qname::atom(ID_arg5),
      rc_qname::atom(ID_arg6), rc_qname::atom(ID_arg7) };
  std::vector<rc_list<rc_qname>> list;
  for (size_t i = 0; i < sizeof(all) / sizeof(*all); ++i) {
    list.push_back(rc_list<rc_qname>(all, i));
  }
  return rc_list<rc_list<rc_qname>>(list);
}

rc_list<rc_qname> builtin_args(size_t count) {
  static rc_list<rc_list<rc_qname>> list = builtin_args_list();
  return list[count];
}

class Sqrt : public GreedyBuiltin {
 public:
  Sqrt() : GreedyBuiltin(1) {}
  virtual rc_value apply(Context* cx, const rc_value* args) const override {
    return rc_real(sqrt(as_number(args[0])));
  }
};

class Floor : public GreedyBuiltin {
 public:
  Floor() : GreedyBuiltin(1) {}
  virtual rc_value apply(Context* cx, const rc_value* args) const override {
    return rc_real(floor(as_number(args[0])));
  }
};

class Ceil : public GreedyBuiltin {
 public:
  Ceil() : GreedyBuiltin(1) {}
  virtual rc_value apply(Context* cx, const rc_value* args) const override {
    return rc_real(ceil(as_number(args[0])));
  }
};

class Max : public GreedyBuiltin {
 public:
  Max() : GreedyBuiltin(2) {}
  virtual rc_value apply(Context* cx, const rc_value* args) const override {
    double arg0 = as_number(args[0]);
    double arg1 = as_number(args[1]);
    return rc_real(arg0 > arg1 ? arg0 : arg1);
  }
};

class Min : public GreedyBuiltin {
 public:
  Min() : GreedyBuiltin(2) {}
  virtual rc_value apply(Context* cx, const rc_value* args) const override {
    double arg0 = as_number(args[0]);
    double arg1 = as_number(args[1]);
    return rc_real(arg0 < arg1 ? arg0 : arg1);
  }
};

class Letterbox : public GreedyBuiltin {
 public:
  Letterbox() : GreedyBuiltin(4) {}
  virtual rc_value apply(Context* cx, const rc_value* args) const override {
    double viewW = as_number(args[0]);
    double viewH = as_number(args[1]);
    double objW = as_number(args[2]);
    double objH = as_number(args[3]);
    double scale = std::min(viewW / objW, viewH / objH);
    double x = (viewW - objW) / 2;
    double y = (viewH - objH) / 2;
    StringWriter w;
    w << "matrix(" << scale << ",0,0," << scale << "," << x << "," << y << ")";
    return w.to_string();
  }
};

class Typeof : public GreedyBuiltin {
 public:
  Typeof() : GreedyBuiltin(1) {}
  virtual rc_value apply(Context* cx, const rc_value* args) const override {
    if ((*args)->is<rc_string>()) {
      return rc_qname::atom(ID_string)->name();
    }
    if ((*args)->is<rc_ref<List>>()) {
      return rc_qname::atom(ID_list)->name();
    }
    if ((*args)->is<rc_boolean>()) {
      return rc_qname::atom(ID_boolean)->name();
    }
    if ((*args)->is<rc_real>() || (*args)->is<rc_integer>()) {
      return rc_qname::atom(ID_number)->name();
    }
    return rc_qname::atom(ID_unknown)->name();
  }
};

class Trace : public GreedyBuiltin {
 public:
  Trace() : GreedyBuiltin(2) {}
  virtual rc_value apply(Context* cx, const rc_value* args) const override {
    rc_string out = args[0]->to_string();
    if (out->find_first("%s") != rc_string::npos) {
      out = out->replace_first("%s", args[1]->to_string()->utf8());
    }
    fprintf(stderr, "Trace: %s\n", out->utf8());
    return args[1];
  }
};

class Cons : public AbstractClosure {
 public:
  virtual rc_value apply(Context* context,
      const rc_ref<Frame>& params) override {
    return new List(
        new Partial(params->defs[rc_qname::atom(ID_arg0)], params->frames),
        new Partial(params->defs[rc_qname::atom(ID_arg1)], params->frames));
  }

  virtual rc_list<rc_qname> formals() const override {
    return builtin_args(2);
  }
};

class Head : public GreedyBuiltin {
 public:
  Head() : GreedyBuiltin(1) {}
  virtual rc_value apply(Context* cx, const rc_value* args) const override {
    if (!args[0]->is<rc_ref<List>>()) {
      return rc_real(std::numeric_limits<double>::quiet_NaN());
    }
    return rc_cast<rc_ref<List>>(args[0])->head(cx);
  }
};

class Tail : public GreedyBuiltin {
 public:
  Tail() : GreedyBuiltin(1) {}
  virtual rc_value apply(Context* cx, const rc_value* args) const override {
    if (!args[0]->is<rc_ref<List>>()) {
      return rc_real(std::numeric_limits<double>::quiet_NaN());
    }
    return rc_cast<rc_ref<List>>(args[0])->tail(cx);
  }
};

void process_partial(rc_value* value, Context* context) {
  while ((*value)->is<rc_ref<AbstractPartial>>()) {
    *value = static_cast<AbstractPartial*>(value->raw_ptr())->apply(context);
  }
}

}

//-------------------------- Frame ------------------------------------------

void Frame::write_to(Writer* writer) const {
  defs->write_to(writer);
}

//-------------------------- FrameList ------------------------------------------

void FrameList::write_to(Writer* writer) const {
  frame->write_to(writer);
  if (!outer.is_null()) {
    *writer << "\n-----------------\n";
    outer->write_to(writer);
  }
}

//-------------------------- Context ----------------------------------------


bool Context::media_test(const rc_qname& name, const rc_value& value) {
  return false;
}

void Context::clear_keys(size_t first_key_to_clear) {
  scope_cache_t new_cache;
  for (size_t key = Scope::ROOT_KEY; key < first_key_to_clear; ++key) {
    new_cache[key] = std::move(scope_cache_[key]);
  }
  scope_cache_ = std::move(new_cache);
  next_key_ = std::max(size_t(Scope::FIRST_TRANSIENT_KEY), first_key_to_clear);
}

//-------------------------- Common ----------------------------------------

Common::Common() : scope(new Scope(rc_ref<Scope>(), Scope::ROOT_KEY)) {
  v_zero = new ExprConst(rc_integer(0));
  v_one = new ExprConst(rc_integer(1));
  v_true = new ExprConst(rc_boolean::true_value());
  v_false = new ExprConst(rc_boolean::false_value());
  v_nan = new ExprConst(rc_real(NAN));
  v_empty = new ExprConst(rc_string());
  scope->define_name(rc_qname::atom(ID_sqrt), new expr::ExprConst(new Sqrt()));
  scope->define_name(rc_qname::atom(ID_floor),
      new expr::ExprConst(new Floor()));
  scope->define_name(rc_qname::atom(ID_ceil), new expr::ExprConst(new Ceil()));
  scope->define_name(rc_qname::atom(ID_min), new expr::ExprConst(new Min()));
  scope->define_name(rc_qname::atom(ID_max), new expr::ExprConst(new Max()));
  scope->define_name(rc_qname::atom(ID_typeof),
      new expr::ExprConst(new Typeof()));
  scope->define_name(rc_qname::atom(ID_letterbox),
      new expr::ExprConst(new Letterbox()));
  scope->define_name(rc_qname::atom(ID_trace),
      new expr::ExprConst(new Trace()));
  scope->define_name(rc_qname::atom(ID_cons), new expr::ExprConst(new Cons()));
  scope->define_name(rc_qname::atom(ID_tail), new expr::ExprConst(new Tail()));
  scope->define_name(rc_qname::atom(ID_head), new expr::ExprConst(new Head()));
  scope->define_name(rc_qname::atom(ID_nil), new expr::ExprConst(List::empty()));
  scope->define_name(rc_qname::atom(ID_true), v_true);
  scope->define_name(rc_qname::atom(ID_false), v_false);
}

const Common& common() {
  static Common comm;
  return comm;
}

//------------------------ Scope --------------------------------------

Scope::Scope(const rc_ref<Scope>& parent, size_t key)
    : parent_(parent), key_(key) {}

Scope::Scope(const Scope& other,
    const rc_ref<Resolver>& resolver)
        : parent_(other.parent_), key_(other.key_), resolver_(resolver),
            definitions_(other.definitions_) {}

rc_ref<FrameList> Scope::frames() {
  rc_ref<FrameList> outer;
  if (!parent_.is_null()) {
    outer = static_cast<Scope*>(parent_.ptr())->frames();
  }
  if (frames_.is_null()) {
    Frame* frame = new Frame(key_, rc_ref<FrameList>(),
        rc_map<rc_ref<expr::Expr>>(definitions_));
    frame->resolver = resolver_;
    frames_ = new FrameList(frame, outer);
  } else {
    if (frames_->outer.ptr() == outer.ptr()) {
      return frames_;
    }
    frames_ = new FrameList(frames_->frame, outer);
  }
  return frames_;
}

void Scope::define_name(const rc_qname& name, const rc_ref<Expr>& value) {
  frames_ = rc_ref<FrameList>();
  rc_ref<expr::Expr>& slot = definitions_[name];
  if (!slot.is_null()) {
    fprintf(stderr, "%s already defined", name->to_string()->utf8());
    return;
  }
  slot = value;
}

rc_ref<Scope> Scope::clone(const rc_ref<Resolver>& resolver) {
  return new Scope(*this, resolver);
}

void Scope::write_to(Writer* writer) const {
  for (const auto& def : definitions_) {
    *writer << def.first;
    *writer << ": ";
    *writer << def.second;
    *writer << "; ";
  }
  if (!parent_.is_null()) {
    *writer << "\n===================\n";
    parent_->write_to(writer);
  }
}


//-------------------------- Expr -------------------------------------------

bool Expr::depend(Scope* scope, Expr* other) {
  dependency_cache_t dependency_cache;
  return depend_outer(scope->frames(), other, &dependency_cache);
}

rc_value Expr::evaluate(Context* context, const rc_ref<FrameList>& frames) {
  size_t key = frames->frame->key;
  rc_value result = context->query_value(key, this);
  if (!result.is_null())
    return result;
  result = evaluate_core(context, frames);
  context->store_value(key, this, result);
  return result;
}

void Expr::write_to(Writer* writer) const {
  write_to(writer, 0);
}

const char* Expr::type_tag() {
  return "Expr";
}

bool Expr::instance_of(const char* type_tag) const {
  return type_tag == Expr::type_tag()
      || RefCountedObject::instance_of(type_tag);
}

bool Expr::depend_core(const rc_ref<FrameList>& frames, Expr* other,
    dependency_cache_t* dependency_cache) {
  return other == this;
}

bool Expr::depend_outer(const rc_ref<FrameList>& frames, Expr* other,
    dependency_cache_t* dependency_cache) {
  dependency_cache_t::iterator cached = dependency_cache->find(this);
  if (cached != dependency_cache->end()) {
    // PENDING should return false.
    return cached->second == HAS_DEPENDENCY;
  }
  (*dependency_cache)[this] = PENDING;
  bool result = depend_core(frames, other, dependency_cache);
  (*dependency_cache)[this] = result ? HAS_DEPENDENCY : NO_DEPENDENCY;
  return result;
}

//-------------------- ExprConst ---------------------------------

ExprConst::ExprConst(const rc_value& value) : value_(value) {}

void ExprConst::write_to(Writer* writer, int priority) const {
  if (value_->is<rc_string>()) {
    (*writer) << '"';
    CSSStringWriter string_writer(writer);
    string_writer << value_;
    (*writer) << '"';
  } else {
    *writer << value_;
  }
}

rc_value ExprConst::evaluate_core(Context* context,
    const rc_ref<FrameList>& frames) {
  if (value_->is<rc_ref<AbstractPartial>>()) {
    return static_cast<AbstractPartial*>(value_.raw_ptr())->apply(context);
  }
  return value_;
}

//----------------------- ExprNumeric ------------------------------

ExprNumeric::ExprNumeric(double value, const rc_qname& unit)
    : value_(value), unit_(unit) {}

void ExprNumeric::write_to(Writer* writer, int priority) const {
  *writer << value_ << unit_;
}

rc_value ExprNumeric::evaluate_core(Context* context,
    const rc_ref<FrameList>& frames) {
  return rc_real(value_ * context->query_unit_size(unit_));
}

//----------------------- ExprPrefix ------------------------------

ExprPrefix::ExprPrefix(const rc_ref<Expr>& operand) : operand_(operand) {}

void ExprPrefix::write_to(Writer* writer, int priority) const {
  if (10 < priority)
    *writer << '(';
  *writer << op();
  operand_->write_to(writer, 10);
  if (10 < priority)
    *writer << ')';
}

rc_value ExprPrefix::evaluate_core(Context* context,
    const rc_ref<FrameList>& frames) {
  return eval_prefix(operand_->evaluate(context, frames));
}

bool ExprPrefix::depend_core(const rc_ref<FrameList>& frames, Expr* other,
    dependency_cache_t* dependency_cache) {
  return other == this
      || operand_->depend_outer(frames, other, dependency_cache);
}

//------------------------ ExprNot -----------------------------------

ExprNot::ExprNot(const rc_ref<Expr>& operand) : ExprPrefix(operand) {}

const char* ExprNot::op() const {
  return "!";
}

rc_value ExprNot::eval_prefix(const rc_value& operand) {
  return rc_boolean(!as_bool(operand));
}

//------------------------ ExprNegate -----------------------------------

ExprNegate::ExprNegate(const rc_ref<Expr>& operand) : ExprPrefix(operand) {}

const char* ExprNegate::op() const {
  return "-";
}

rc_value ExprNegate::eval_prefix(const rc_value& operand) {
  return rc_real(-as_number(operand));
}

//------------------------ ExprInfix ---------------------------------

ExprInfix::ExprInfix(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs)
    : lhs_(lhs), rhs_(rhs) { assert(!lhs_.is_null() && !rhs_.is_null()); }

void ExprInfix::write_to(Writer* writer, int priority) const {
  int pri = this->priority();
  if (pri <= priority)
    *writer << '(';
  lhs_->write_to(writer, pri);
  *writer << op();
  rhs_->write_to(writer, pri);
  if (pri <= priority)
    *writer << ')';
}

rc_value ExprInfix::evaluate_core(Context* context,
    const rc_ref<FrameList>& frames) {
  return eval_infix(lhs_->evaluate(context, frames),
      rhs_->evaluate(context, frames));
}

bool ExprInfix::depend_core(const rc_ref<FrameList>& frames, Expr* other,
    dependency_cache_t* dependency_cache) {
  return other == this
      || lhs_->depend_outer(frames, other, dependency_cache)
      || lhs_->depend_outer(frames, other, dependency_cache);
}

//------------------------ ExprLogical ------------------------------

ExprLogical::ExprLogical(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs)
    : ExprInfix(lhs, rhs) {}

rc_value ExprLogical::eval_infix(const rc_value& lhs, const rc_value& rhs) {
  assert(false);
  return rc_real(0.0);
}

int ExprLogical::priority() const {
  return 3;
}

//------------------------ ExprComparison ------------------------------

ExprComparison::ExprComparison(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs)
    : ExprInfix(lhs, rhs) {}

int ExprComparison::priority() const {
  return 4;
}

//------------------------ ExprAdditive ------------------------------

ExprAdditive::ExprAdditive(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs)
    : ExprInfix(lhs, rhs) {}

int ExprAdditive::priority() const {
  return 5;
}

//------------------------ ExprMultiplicative ------------------------------

ExprMultiplicative::ExprMultiplicative(const rc_ref<Expr>& lhs,
    const rc_ref<Expr>& rhs) : ExprInfix(lhs, rhs) {}

int ExprMultiplicative::priority() const {
  return 4;
}

//------------------------ ExprAnd ---------------------------------------

ExprAnd::ExprAnd(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs)
    : ExprLogical(lhs, rhs) {}

const char* ExprAnd::op() const {
  return "&&";
}

rc_value ExprAnd::evaluate_core(Context* context,
    const rc_ref<FrameList>& frames) {
  return rc_boolean(as_bool(lhs_->evaluate(context, frames))
      && as_bool(rhs_->evaluate(context, frames)));
}

//------------------------ ExprAndMedia ---------------------------------------

ExprAndMedia::ExprAndMedia(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs)
    : ExprAnd(lhs, rhs) {}

const char* ExprAndMedia::op() const {
  return " and ";
}

//------------------------ ExprOr ---------------------------------------

ExprOr::ExprOr(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs)
    : ExprLogical(lhs, rhs) {}

const char* ExprOr::op() const {
  return "||";
}

rc_value ExprOr::evaluate_core(Context* context,
    const rc_ref<FrameList>& frames) {
  return rc_boolean(as_bool(lhs_->evaluate(context, frames))
                    || as_bool(rhs_->evaluate(context, frames)));
}

//------------------------ ExprOrMedia ---------------------------------------

ExprOrMedia::ExprOrMedia(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs)
    : ExprOr(lhs, rhs) {}

const char* ExprOrMedia::op() const {
  return ", ";
}

//------------------------- ExprLt -----------------------------------------

ExprLt::ExprLt(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs)
    : ExprComparison(lhs, rhs) {}

rc_value ExprLt::eval_infix(const rc_value& lhs, const rc_value& rhs) {
  if (lhs->is<rc_string>() && rhs->is<rc_string>()) {
    return rc_boolean(rc_cast<rc_string>(lhs) < rc_cast<rc_string>(rhs));
  }
  return rc_boolean(as_number(lhs) < as_number(rhs));
}

const char* ExprLt::op() const {
  return "<";
}

//------------------------- ExprLe -----------------------------------------

ExprLe::ExprLe(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs)
    : ExprComparison(lhs, rhs) {}

rc_value ExprLe::eval_infix(const rc_value& lhs, const rc_value& rhs) {
  if (lhs->is<rc_string>() && rhs->is<rc_string>()) {
    return rc_boolean(rc_cast<rc_string>(lhs) <= rc_cast<rc_string>(rhs));
  }
  return rc_boolean(as_number(lhs) <= as_number(rhs));
}

const char* ExprLe::op() const {
  return "<=";
}

//------------------------- ExprGt -----------------------------------------

ExprGt::ExprGt(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs)
    : ExprComparison(lhs, rhs) {}

rc_value ExprGt::eval_infix(const rc_value& lhs, const rc_value& rhs) {
  if (lhs->is<rc_string>() && rhs->is<rc_string>()) {
    return rc_boolean(rc_cast<rc_string>(lhs) > rc_cast<rc_string>(rhs));
  }
  return rc_boolean(as_number(lhs) > as_number(rhs));
}

const char* ExprGt::op() const {
  return ">";
}

//------------------------- ExprGe -----------------------------------------

ExprGe::ExprGe(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs)
    : ExprComparison(lhs, rhs) {}

rc_value ExprGe::eval_infix(const rc_value& lhs, const rc_value& rhs) {
  if (lhs->is<rc_string>() && rhs->is<rc_string>()) {
    return rc_boolean(rc_cast<rc_string>(lhs) >= rc_cast<rc_string>(rhs));
  }
  return rc_boolean(as_number(lhs) >= as_number(rhs));
}

const char* ExprGe::op() const {
  return ">=";
}

//------------------------- ExprEq -----------------------------------------

ExprEq::ExprEq(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs)
    : ExprComparison(lhs, rhs) {}

rc_value ExprEq::eval_infix(const rc_value& lhs, const rc_value& rhs) {
  if (lhs->is<rc_ref<List>>() || lhs->is<rc_ref<List>>()) {
    return rc_boolean(lhs.raw_ptr() == rhs.raw_ptr());
  }
  if (lhs->is<rc_string>() && rhs->is<rc_string>()) {
    return rc_boolean(rc_cast<rc_string>(lhs) == rc_cast<rc_string>(rhs));
  }
  return rc_boolean(as_number(lhs) == as_number(rhs));
}

const char* ExprEq::op() const {
  return "==";
}

//------------------------- ExprLt -----------------------------------------

ExprNe::ExprNe(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs)
    : ExprComparison(lhs, rhs) {}

rc_value ExprNe::eval_infix(const rc_value& lhs, const rc_value& rhs) {
  if (lhs->is<rc_string>() && rhs->is<rc_string>()) {
    return rc_boolean(rc_cast<rc_string>(lhs) != rc_cast<rc_string>(rhs));
  }
  return rc_boolean(as_number(lhs) != as_number(rhs));
}

const char* ExprNe::op() const {
  return "!=";
}

//------------------------- ExprAdd -----------------------------------------

ExprAdd::ExprAdd(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs)
    : ExprAdditive(lhs, rhs) {}

rc_value ExprAdd::eval_infix(const rc_value& lhs, const rc_value& rhs) {
  if (lhs->is<rc_string>() || rhs->is<rc_string>()) {
    StringWriter sw;
    sw << lhs;
    sw << rhs;
    return sw.to_string();
  }
  return rc_real(as_number(lhs) + as_number(rhs));
}

const char* ExprAdd::op() const {
  return "+";
}

//------------------------- ExprSubtract --------------------------------------

ExprSubtract::ExprSubtract(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs)
    : ExprAdditive(lhs, rhs) {}

rc_value ExprSubtract::eval_infix(const rc_value& lhs, const rc_value& rhs) {
  return rc_real(as_number(lhs) - as_number(rhs));
}

const char* ExprSubtract::op() const {
  return "-";
}

//------------------------- ExprMultiply --------------------------------------

ExprMultiply::ExprMultiply(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs)
    : ExprMultiplicative(lhs, rhs) {}

rc_value ExprMultiply::eval_infix(const rc_value& lhs, const rc_value& rhs) {
  return rc_real(as_number(lhs) * as_number(rhs));
}

const char* ExprMultiply::op() const {
  return "*";
}

//------------------------- ExprModulo -----------------------------------------

ExprModulo::ExprModulo(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs)
    : ExprMultiplicative(lhs, rhs) {}

rc_value ExprModulo::eval_infix(const rc_value& lhs, const rc_value& rhs) {
  return rc_real(fmod(as_number(lhs), fabs(as_number(rhs))));
}

const char* ExprModulo::op() const {
  return "%";
}

//------------------------- ExprDivide ---------------------------------------

ExprDivide::ExprDivide(const rc_ref<Expr>& lhs, const rc_ref<Expr>& rhs)
    : ExprMultiplicative(lhs, rhs) {}

rc_value ExprDivide::eval_infix(const rc_value& lhs, const rc_value& rhs) {
  return rc_real(as_number(lhs) / as_number(rhs));
}

const char* ExprDivide::op() const {
  return "/";
}

//------------------------ ExprNamed -----------------------------------

ExprNamed::ExprNamed(const rc_qname& name) : name_(name) {}

void ExprNamed::write_to(Writer* writer, int priority) const {
  CSSIdentWriter iw(writer);
  if (name_->ns().empty()) {
    iw << name_;
  } else {
    iw << name_->ns();
    *writer << '.';
    iw << name_->name();
  }
}

const char* ExprNamed::type_tag() {
  return "ExprNamed";
}

bool ExprNamed::instance_of(const char* type_tag) const {
  return type_tag == ExprNamed::type_tag() || Expr::instance_of(type_tag);
}

bool ExprNamed::resolve_name(rc_ref<FrameList> frames,
    rc_ref<Expr>* def, rc_ref<FrameList>* cx_frames) {
  while (!frames.is_null()) {
    Frame* frame = frames->frame.ptr();
    auto it = frame->defs.find(name_);
    if (it != frame->defs.end()) {
      *cx_frames = frame->frames.is_null() ? frames : frame->frames;
      *def = it->value;
      return true;
    }
    if (!frame->resolver.is_null()) {
      *def = frame->resolver->resolve_name(name_);
      if (!def->is_null()) {
        *cx_frames = frames;
        return true;
      }
    }
    frames = frames->outer;
  }
  fprintf(stderr, "Not defined: %s\n", name_->to_string()->utf8());
  return false;
}

rc_value ExprNamed::evaluate_core(Context* context,
    const rc_ref<FrameList>& frames) {
  rc_ref<FrameList> cx_frames;
  rc_ref<Expr> def;
  if (resolve_name(frames, &def, &cx_frames)) {
    return def->evaluate(context, cx_frames);
  }
  return rc_real(std::numeric_limits<double>::quiet_NaN());
}

bool ExprNamed::depend_core(const rc_ref<FrameList>& frames, Expr* other,
    dependency_cache_t* dependency_cache) {
  if (other == this) {
    return true;
  }
  rc_ref<FrameList> cx_frames;
  rc_ref<Expr> def;
  if (resolve_name(frames, &def, &cx_frames)) {
    return def->depend_outer(cx_frames, other, dependency_cache);
  }
  return false;
}

//---------------------------- ExprMediaName -----------------------------

ExprMediaName::ExprMediaName(bool isnot, const rc_qname& name)
    : not_(isnot), name_(name) {}

void ExprMediaName::write_to(Writer* writer, int priority) const {
  if (not_) {
    *writer << "not ";
  }
  CSSIdentWriter iw(writer);
  iw << name_;
}

const char* ExprMediaName::type_tag() {
  return "ExprMediaName";
}

bool ExprMediaName::instance_of(const char* type_tag) const {
  return type_tag == ExprMediaName::type_tag()
      || Expr::instance_of(type_tag);
}

rc_value ExprMediaName::evaluate_core(Context* context,
    const rc_ref<FrameList>& frames) {
  return rc_boolean(true);
}

//--------------------------- ExprCall ------------------------------------

ExprCall::ExprCall(const rc_ref<Expr>& func,
    const rc_list<rc_ref<Expr>>& params) : func_(func), params_(params) {}

void ExprCall::write_to(Writer* writer, int priority) const {
  CSSIdentWriter iw(writer);
  func_->write_to(writer, 10);
  *writer << '(';
  const char* sep = "";
  for (const rc_ref<Expr>& param : params_) {
    *writer << sep;
    sep = ",";
    param->write_to(writer, 0);
  }
  *writer << ')';
}

rc_value ExprCall::evaluate_core(Context* context,
    const rc_ref<FrameList>& frames) {
  rc_value func = func_->evaluate(context, frames);
  if (!func->is<rc_ref<AbstractClosure>>()) {
    return rc_real(NAN);
  }
  AbstractClosure* closure = static_cast<AbstractClosure*>(func.raw_ptr());
  rc_list<rc_qname> formals = closure->formals();
  if (formals->size() != params_->size()) {
    fprintf(stderr, "Parameter count mismatch: expected %ld, got %ld\n",
        formals->size(), params_->size());
    return rc_real(std::numeric_limits<double>::quiet_NaN());
  }
  std::map<rc_qname, rc_ref<Expr>> args;
  for (size_t i = 0; i < params_->size(); ++i) {
    args[formals[i]] = params_[i];
  }
  rc_ref<Frame> frame = new Frame(context->next_call_key(), frames,
        rc_map<rc_ref<Expr>>(args));
  return closure->apply(context, frame);
}

bool ExprCall::depend_core(const rc_ref<FrameList>& frames, Expr* other,
    dependency_cache_t* dependency_cache) {
  if (other == this) {
    return true;
  }
  for (const rc_ref<Expr>& param : params_) {
    if (param->depend_outer(frames, other, dependency_cache)) {
      return true;
    }
  }
  return func_->depend_outer(frames, other, dependency_cache);
}

//------------------------- ExprCond -----------------------------------

ExprCond::ExprCond(const rc_ref<Expr>& cond,
    const rc_ref<Expr>& if_true, const rc_ref<Expr>& if_false)
        : cond_(cond), if_true_(if_true), if_false_(if_false) {}

void ExprCond::write_to(Writer* writer, int priority) const {
  if (priority > 2)
    *writer << '(';
  cond_->write_to(writer, 2);
  *writer << '?';
  if_true_->write_to(writer, 2);
  *writer << ':';
  if_false_->write_to(writer, 2);
  if (priority > 2)
    *writer << ')';
}

rc_value ExprCond::evaluate_core(Context* context,
    const rc_ref<FrameList>& frames) {
  if (as_bool(cond_->evaluate(context, frames))) {
    return if_true_->evaluate(context, frames);
  } else {
    return if_false_->evaluate(context, frames);
  }
}

bool ExprCond::depend_core(const rc_ref<FrameList>& frames, Expr* other,
    dependency_cache_t* dependency_cache) {
  return other == this || cond_->depend_outer(frames, other, dependency_cache)
      || if_true_->depend_outer(frames, other, dependency_cache)
      || if_false_->depend_outer(frames, other, dependency_cache);
}

//------------------------- ExprMediaTest -------------------------------

ExprMediaTest::ExprMediaTest(const rc_ref<ExprMediaName>& name,
    const rc_ref<Expr>& value) : name_(name), value_(value) {}

void ExprMediaTest::write_to(Writer* writer, int priority) const {
  *writer << '(';
  name_->write_to(writer, 0);
  *writer << ": ";
  value_->write_to(writer, 0);
  *writer << ')';
}

const char* ExprMediaTest::type_tag() {
  return "ExprMediaTest";
}

bool ExprMediaTest::instance_of(const char* type_tag) const {
  return type_tag == ExprMediaTest::type_tag()
      || Expr::instance_of(type_tag);
}

rc_value ExprMediaTest::evaluate_core(Context* context,
    const rc_ref<FrameList>& frames) {
  return rc_boolean(context->media_test(name_->name(),
      value_->evaluate(context, frames)));
}

bool ExprMediaTest::depend_core(const rc_ref<FrameList>& frames, Expr* other,
    dependency_cache_t* dependency_cache) {
  return this == other
      || value_->depend_outer(frames, other, dependency_cache);
}

//-------------------------- ExprFrameAdjust --------------------------------

ExprFrameAdjust::ExprFrameAdjust(const rc_ref<Expr>& body, size_t adjustment)
    : body_(body), adjustment_(adjustment) { assert(!body.is_null()); }

void ExprFrameAdjust::write_to(Writer* writer, int priority) const {
  *writer << "((";
  body_->write_to(writer, 0);
  *writer << "))";
}

rc_value ExprFrameAdjust::evaluate_core(Context* context,
    const rc_ref<FrameList>& frames) {
  rc_ref<FrameList> f = frames;
  for (size_t i = 0; i < adjustment_; ++i) {
    f = f->outer;
  }
  return body_->evaluate(context, f);
}

bool ExprFrameAdjust::depend_core(const rc_ref<FrameList>& frames, Expr* other,
    dependency_cache_t* dependency_cache) {
  if (this == other) {
    return true;
  }
  rc_ref<FrameList> f = frames;
  for (size_t i = 0; i < adjustment_; ++i) {
    f = f->outer;
  }
  return body_->depend_outer(f, other, dependency_cache);
}

//-------------------------- ExprLambda -----------------------------------

ExprLambda::ExprLambda(const rc_ref<Expr>& body, const rc_list<rc_qname>& names)
    : body_(body), names_(names) {}

void ExprLambda::write_to(Writer* writer, int priority) const {
  if (priority > 0) {
    *writer << '(';
  }
  *writer << "(" << names_ << ")=>";
  body_->write_to(writer, 1);
  if (priority > 0) {
    *writer << '(';
  }
}

rc_value ExprLambda::evaluate_core(Context* context,
    const rc_ref<FrameList>& frames) {
  return new Closure(body_, names_, frames);
}

bool ExprLambda::depend_core(const rc_ref<FrameList>& frames, Expr* other,
    dependency_cache_t* dependency_cache) {
  // create a dummy frame
  std::map<rc_qname, rc_ref<Expr>> args;
  for (size_t i = 0; i < names_->size(); ++i) {
    args[names_[i]] = common().v_zero;
  }
  rc_ref<Frame> frame = new Frame(Scope::FIRST_TRANSIENT_KEY, frames,
      rc_map<rc_ref<Expr>>(args));
  return body_->depend_outer(new FrameList(frame, frames),
      other, dependency_cache);
}

//--------------------------- ExprBlock -----------------------------------

ExprBlock::ExprBlock(const rc_ref<Expr> body,
    const rc_map<rc_ref<Expr>>& definitions)
        : body_(body), definitions_(definitions) {}

void ExprBlock::write_to(Writer* writer, int priority) const {
  if (priority > 1) {
    *writer << '(';
  }
  for (const auto& entry : definitions_) {
    *writer << entry.key;
    *writer << ':';
    entry.value->write_to(writer, 2);
  }
  body_->write_to(writer, 2);
  if (priority > 1) {
    *writer << ')';
  }
}

rc_value ExprBlock::evaluate_core(Context* context,
    const rc_ref<FrameList>& frames) {
  rc_ref<Frame> frame = new Frame(context->next_call_key(), rc_ref<FrameList>(),
      definitions_);
  rc_ref<FrameList> frame_list = new FrameList(frame, frames);
  return body_->evaluate(context, frame_list);
}

bool ExprBlock::depend_core(const rc_ref<FrameList>& frames, Expr* other,
    dependency_cache_t* dependency_cache) {
  rc_ref<Frame> frame = new Frame(Scope::FIRST_TRANSIENT_KEY,
      rc_ref<FrameList>(), definitions_);
  rc_ref<FrameList> frame_list = new FrameList(frame, frames);
  return body_->depend_outer(frame_list, other, dependency_cache);
}

//------------------------- List ---------------------------------------

List::List(const rc_value& head, const rc_value& tail)
    : head_(head), tail_(tail) {}

const rc_value& List::head(Context* context) {
  if (this == empty().ptr()) {
    fprintf(stderr, "head(nil)");
    return empty();
  }
  process_partial(&head_, context);
  return head_;
}

const rc_value& List::tail(Context* context) {
  if (this == empty().ptr()) {
    fprintf(stderr, "tail(nil)");
    return empty();
  }
  process_partial(&tail_, context);
  return tail_;
}

void List::write_to(Writer* writer) const {
  *writer << '[';
  const List* p = this;
  bool first = true;
  while (p && p != empty().ptr()) {
    if (first) {
      first = false;
    } else {
      *writer << ',';
    }
    p->head_->write_to(writer);
    if (!p->tail_->is<rc_ref<List>>()) {
      *writer << ':';
      p->tail_->write_to(writer);
      break;
    }
    p = static_cast<List*>(p->tail_.raw_ptr());
  }
  *writer << ']';
}


const rc_ref<List>& List::empty() {
  static rc_ref<List> empty = new List(rc_value(), rc_value());
  return empty;
}

const char* List::type_tag() {
  return "List";
}

bool List::instance_of(const char* type_tag) const {
  return type_tag == List::type_tag()
      || RefCountedObject::instance_of(type_tag);
}

//---------------------------- AbstractClosure ----------------------------

const char* AbstractClosure::type_tag() {
  return "AbstractClosure";
}

bool AbstractClosure::instance_of(const char* type_tag) const {
  return type_tag == AbstractClosure::type_tag() ||
      RefCountedObject::instance_of(type_tag);
}

//---------------------------- AbstractPartial ----------------------------

const char* AbstractPartial::type_tag() {
  return "AbstractPartial";
}

bool AbstractPartial::instance_of(const char* type_tag) const {
  return type_tag == AbstractPartial::type_tag() ||
      RefCountedObject::instance_of(type_tag);
}

//---------------------------- Closure -------------------------------------

Closure::Closure(const rc_ref<Expr>& body, const rc_list<rc_qname>& formals,
    const rc_ref<FrameList>& frames)
         : body_(body), formals_(formals), frames_(frames) {}

void Closure::write_to(Writer* writer) const {
  *writer << "@(" << formals_ << "){";
  body_->write_to(writer, 0);
  *writer << '}';
}

rc_list<rc_qname> Closure::formals() const {
  return formals_;
}

rc_value Closure::apply(Context* context, const rc_ref<Frame>& params) {
  return body_->evaluate(context, new FrameList(params, frames_));
}

//---------------------------- Partial -------------------------------------

Partial::Partial(const rc_ref<Expr>& body, const rc_ref<FrameList>& frames)
    : body_(body), frames_(frames) {}

void Partial::write_to(Writer* writer) const {
  *writer << "@{";
  body_->write_to(writer, 0);
  *writer << '}';
}

rc_value Partial::apply(Context* context) {
  return body_->evaluate(context, frames_);
}
  
//---------------------------- GreedyBuiltin -------------------------------

GreedyBuiltin::GreedyBuiltin(size_t arg_count) : arg_count_(arg_count) {}

rc_list<rc_qname> GreedyBuiltin::formals() const {
  return builtin_args(arg_count_);
}

rc_value GreedyBuiltin::apply(Context* context, const rc_ref<Frame>& params) {
  std::unique_ptr<rc_value[]> args(new rc_value[arg_count_]);
  int i = 0;
  for (const rc_qname& formal : formals()) {
    const rc_ref<expr::Expr> arg = params->defs[formal];
    args[i++] = arg->evaluate(context, params->frames);
  }
  return apply(context, args.get());
}

//------------------------- operators --------------------------------------

rc_ref<Expr> operator&&(const rc_ref<Expr>& v1, const rc_ref<Expr>& v2) {
  const Common& common = expr::common();
  if (v1.ptr() == common.v_false.ptr() || v1.ptr() == common.v_zero.ptr() ||
      v2.ptr() == common.v_false.ptr() || v2.ptr() == common.v_zero.ptr()) {
    return common.v_false;
  }
  if (v1.ptr() == common.v_true.ptr() || v1.ptr() == common.v_one.ptr()) {
    return v2;
  }
  if (v2.ptr() == common.v_true.ptr() || v2.ptr() == common.v_one.ptr()) {
    return v1;
  }
  return new ExprAnd(v1, v2);
}

rc_ref<Expr> operator||(const rc_ref<Expr>& v1, const rc_ref<Expr>& v2) {
  const Common& common = expr::common();
  if (v1.ptr() == common.v_true.ptr() || v1.ptr() == common.v_one.ptr() ||
      v2.ptr() == common.v_true.ptr() || v2.ptr() == common.v_one.ptr()) {
    return common.v_true;
  }
  if (v1.ptr() == common.v_false.ptr() || v1.ptr() == common.v_zero.ptr()) {
    return v2;
  }
  if (v2.ptr() == common.v_false.ptr() || v2.ptr() == common.v_zero.ptr()) {
    return v1;
  }
  return new ExprOr(v1, v2);
}

rc_ref<Expr> operator+(const rc_ref<Expr>& v1, const rc_ref<Expr>& v2) {
  const Common& common = expr::common();
  if (v1.ptr() == common.v_zero.ptr()) {
    return v2;
  }
  if (v2.ptr() == common.v_zero.ptr()) {
    return v1;
  }
  return new ExprAdd(v1, v2);
}

rc_ref<Expr> operator-(const rc_ref<Expr>& v1, const rc_ref<Expr>& v2) {
  const Common& common = expr::common();
  if (v1.ptr() == common.v_zero.ptr()) {
    if (v2.ptr() == common.v_zero.ptr()) {
      return common.v_zero;
    }
    return new ExprNegate(v2);
  }
  if (v2.ptr() == common.v_zero.ptr()) {
    return v1;
  }
  return new ExprSubtract(v1, v2);
}

rc_ref<Expr> operator*(double v1, const rc_ref<Expr>& v2) {
  const Common& common = expr::common();
  if (v1 == 0 || v2 == common.v_zero) {
    return common.v_zero;
  }
  if (v1 == 1) {
    return v2;
  }
  if (v2.ptr() == common.v_one.ptr()) {
    return new ExprConst(rc_real(v1));
  }
  return new ExprMultiply(new ExprConst(rc_real(v1)), v2);
}

rc_ref<Expr> operator*(const rc_ref<Expr>& v1, const rc_ref<Expr>& v2) {
  const Common& common = expr::common();
  if (v1.ptr() == common.v_zero.ptr() || v2.ptr() == common.v_zero.ptr()) {
    return common.v_zero;
  }
  if (v1.ptr() == common.v_one.ptr()) {
    return v2;
  }
  if (v2.ptr() == common.v_one.ptr()) {
    return v1;
  }
  return new ExprMultiply(v1, v2);
}

rc_ref<Expr> operator/(const rc_ref<Expr>& v1, const rc_ref<Expr>& v2) {
  const Common& common = expr::common();
  if (v1.ptr() == common.v_zero.ptr() || v2.ptr() == common.v_zero.ptr()) {
    return common.v_zero;
  }
  if (v2.ptr() == common.v_one.ptr()) {
    return v1;
  }
  return new ExprDivide(v1, v2);
}

}
}
