#include "adapt/css/value.h"

#include "adapt/base/rc_primitive.h"

namespace adapt {
namespace css {

rc_ref<expr::Expr> CSSValue::to_expr(expr::Scope* scope,
    const rc_ref<expr::Expr>& ref) {
  return expr::common().v_nan;
}

int CSSValue::id() const {
  return ID_EMPTY;
}
  
bool CSSValue::instance_of(const char* type_tag) const {
  return type_tag == CSSValue::type_tag()
      || RefCountedObject::instance_of(type_tag);
}

const char* CSSValue::type_tag() {
  return "CSSValue";
}

//----------------- CSSEmpty --------------------------

rc_ref<CSSValue> CSSEmpty::visit(CSSVisitor* visitor) {
  return visitor->visit_empty(this);
}

size_t CSSEmpty::hash() const {
  return 0xF00BA9;
}

void CSSEmpty::write_to(Writer* writer) const {
}

rc_ref<CSSValue> CSSEmpty::instance() {
  static rc_ref<CSSValue> empty(new CSSEmpty());
  return empty;
}

//----------------- CSSSlash --------------------------

rc_ref<CSSValue> CSSSlash::visit(CSSVisitor* visitor) {
  return visitor->visit_slash(this);
}

size_t CSSSlash::hash() const {
  return 0xB00B001;
}

void CSSSlash::write_to(Writer* writer) const {
  *writer << '/';
}

rc_ref<CSSValue> CSSSlash::instance() {
  static rc_ref<CSSValue> slash(new CSSSlash());
  return slash;
}

//----------------- CSSString --------------------------

CSSString::CSSString(const rc_string& str) : str_(str) {}

CSSString::CSSString(const char* str, size_t length) : str_(str, length) {}

rc_ref<CSSValue> CSSString::visit(CSSVisitor* visitor) {
  return visitor->visit_string(this);
}

rc_ref<expr::Expr> CSSString::to_expr(expr::Scope* scope,
    const rc_ref<expr::Expr>& ref) {
  return new expr::ExprConst(str_);
}

size_t CSSString::hash() const {
  return str_->hash() + 178;
}

bool CSSString::operator==(const RefCountedObject& other) const {
  return same_class(other)
      && str_ == static_cast<const CSSString*>(&other)->str_;
}

void CSSString::write_to(Writer* writer) const {
  *writer << '"' << str_ << '"';
}

bool CSSString::instance_of(const char* type_tag) const {
  return type_tag == CSSString::type_tag()
      || CSSValue::instance_of(type_tag);
}

const char* CSSString::type_tag() {
  return "CSSString";
}


//----------------- CSSIdent ------------------------------

CSSIdent::CSSIdent(const rc_qname& name) : name_(name) {
  assert(name->kind() == QNAME);
}

CSSIdent::CSSIdent(const char* str, size_t length)
    : name_(rc_string(str, length)) {
  assert(name_->kind() == QNAME);
}

rc_ref<CSSValue> CSSIdent::visit(CSSVisitor* visitor) {
  return visitor->visit_ident(this);
}

rc_ref<expr::Expr> CSSIdent::to_expr(expr::Scope* scope,
    const rc_ref<expr::Expr>& ref) {
  return new expr::ExprConst(name_);
}

int CSSIdent::id() const {
  return name_->id();
}

size_t CSSIdent::hash() const {
  return name_->hash();
}

bool CSSIdent::operator==(const RefCountedObject& other) const {
  return same_class(other)
      && name_ == static_cast<const CSSIdent*>(&other)->name_;
}

void CSSIdent::write_to(Writer* writer) const {
  CSSIdentWriter esc_writer(writer);
  esc_writer << name_;
}

const rc_ref<CSSValue> CSSIdent::ident_true() {
  rc_ref<CSSValue> id_true(new CSSIdent(rc_qname::atom(ID_true)));
  return id_true;
}

const rc_ref<CSSValue> CSSIdent::ident_false() {
  rc_ref<CSSValue> id_false(new CSSIdent(rc_qname::atom(ID_false)));
  return id_false;
}

const rc_ref<CSSValue> CSSIdent::ident_inherit() {
  rc_ref<CSSValue> id_inherit(new CSSIdent(rc_qname::atom(ID_inherit)));
  return id_inherit;
}

bool CSSIdent::instance_of(const char* type_tag) const {
  return type_tag == CSSIdent::type_tag()
      || CSSValue::instance_of(type_tag);
}

const char* CSSIdent::type_tag() {
  return "CSSIdent";
}

//------------------ CSSNumeric ----------------------

CSSNumeric::CSSNumeric(double value, const rc_qname& unit)
  : value_(value), unit_(unit) {}

rc_ref<CSSValue> CSSNumeric::visit(CSSVisitor* visitor) {
  return visitor->visit_numeric(this);
}

rc_ref<expr::Expr> CSSNumeric::to_expr(expr::Scope* scope,
    const rc_ref<expr::Expr>& ref) {
  if (value_ == 0) {
    return expr::common().v_zero;
  }
  if (!ref.is_null() && unit_->id() == ID_percent) {
    if (value_ == 100) {
      return ref;
    }
    return (value_/100) * ref;
  }
  return new expr::ExprNumeric(value_, unit_);
}

size_t CSSNumeric::hash() const {
  return std::hash<double>()(value_) + 101 * unit_->hash();
}

bool CSSNumeric::operator==(const RefCountedObject& other) const {
  if (!same_class(other)) {
    return false;
  }
  const CSSNumeric* ov = static_cast<const CSSNumeric*>(&other);
  return value_ == ov->value_ && unit_ == ov->unit_;
}

void CSSNumeric::write_to(Writer* writer) const {
  *writer << value_;
  if (unit_->id() == ID_percent) {
    *writer << "%";
  } else {
    *writer << unit_;
  }
}

bool CSSNumeric::instance_of(const char* type_tag) const {
  return type_tag == CSSNumeric::type_tag()
      || CSSValue::instance_of(type_tag);
}

const char* CSSNumeric::type_tag() {
  return "CSSNumeric";
}

//----------------------- CSSNumber ---------------------------------

CSSNumber::CSSNumber(double value) : value_(value) {}

rc_ref<CSSValue> CSSNumber::visit(CSSVisitor* visitor) {
  return visitor->visit_number(this);
}

rc_ref<expr::Expr> CSSNumber::to_expr(expr::Scope* scope,
    const rc_ref<expr::Expr>& ref) {
  if (value_ == 0) {
    return expr::common().v_zero;
  }
  if (value_ == 1) {
    return expr::common().v_one;
  }
  return new expr::ExprConst(rc_real(value_));
}

size_t CSSNumber::hash() const {
  return std::hash<double>()(value_);
}

bool CSSNumber::operator==(const RefCountedObject& other) const {
  return same_class(other) &&
      value_ == static_cast<const CSSNumber*>(&other)->value_;
}

void CSSNumber::write_to(Writer* writer) const {
  *writer << value_;
}

bool CSSNumber::instance_of(const char* type_tag) const {
  return type_tag == CSSNumber::type_tag()
      || CSSValue::instance_of(type_tag);
}

const char* CSSNumber::type_tag() {
  return "CSSNumber";
}


//------------------------- CSSInteger ------------------------------

CSSInteger::CSSInteger(int value) : CSSNumber(value) {}

rc_ref<CSSValue> CSSInteger::visit(CSSVisitor* visitor) {
  return visitor->visit_integer(this);
}

bool CSSInteger::instance_of(const char* type_tag) const {
  return type_tag == CSSInteger::type_tag()
     || CSSNumber::instance_of(type_tag);
}

const char* CSSInteger::type_tag() {
  return "CSSInteger";
}

//-------------------------- CSSColor -------------------------------

CSSColor::CSSColor(unsigned int value) : value_(value) {
  assert(value <= 0xFFFFFF);
}

rc_ref<CSSValue> CSSColor::visit(CSSVisitor* visitor) {
  return visitor->visit_color(this);
}

size_t CSSColor::hash() const {
  return value_;
}

bool CSSColor::operator==(const RefCountedObject& other) const {
  return same_class(other) &&
      value_ == static_cast<const CSSColor*>(&other)->value_;
}

void CSSColor::write_to(Writer* writer) const {
  char buf[8];
  sprintf(buf, "%06X", value_);
  *writer << '#' << static_cast<const char*>(buf);
}

rc_ref<CSSValue> CSSColor::color_from_hash(const rc_string& text) {
  char* end;
  long num = strtol(text->utf8(), &end, 16);
  if (*end == '\0') {
    size_t len = text->length();
    if (len == 3 || len == 6) {
      if (len == 3 ) {
        num = (num & 0xF) | ((num & 0xF) << 4) | ((num & 0xF0) << 4)
        | ((num & 0xF0) << 8) | ((num & 0xF00) << 8)
        | ((num & 0xF00) << 12);
      }
      return new CSSColor((unsigned int)num);
    }
  }
  return rc_ref<CSSValue>();
}

bool CSSColor::instance_of(const char* type_tag) const {
  return type_tag == CSSColor::type_tag()
     || CSSValue::instance_of(type_tag);
}

const char* CSSColor::type_tag() {
  return "CSSColor";
}

//----------------------- CSSUrl ----------------------------------

CSSUrl::CSSUrl(const rc_string& url) : url_(url) {}

rc_ref<CSSValue> CSSUrl::visit(CSSVisitor* visitor) {
  return visitor->visit_url(this);
}

size_t CSSUrl::hash() const {
  return url_->hash() ^ 0x12345678;
}

bool CSSUrl::operator==(const RefCountedObject& other) const {
  return same_class(other) &&
      url_ == static_cast<const CSSUrl*>(&other)->url_;
}

void CSSUrl::write_to(Writer* writer) const {
  *writer << "url(" << url_ << ")";
}

bool CSSUrl::instance_of(const char* type_tag) const {
  return type_tag == CSSUrl::type_tag()
     || CSSValue::instance_of(type_tag);
}

const char* CSSUrl::type_tag() {
  return "CSSUrl";
}


//--------------- CSSSpaceList ------------------------------

CSSSpaceList::CSSSpaceList(const rc_list<rc_ref<CSSValue>>& list)
    : list_(list) {}

rc_ref<CSSValue> CSSSpaceList::visit(CSSVisitor* visitor) {
  return visitor->visit_space_list(this);
}

size_t CSSSpaceList::hash() const {
  return list_->hash() ^ 0xABCDEF01;
}

bool CSSSpaceList::operator==(const RefCountedObject& other) const {
  return same_class(other) &&
      list_ == static_cast<const CSSSpaceList*>(&other)->list_;
}

void CSSSpaceList::write_to(Writer* writer) const {
  const char * separator = "";
  for (const rc_value& item : list_) {
    *writer << separator << item;
    separator = " ";
  }
}

bool CSSSpaceList::instance_of(const char* type_tag) const {
  return type_tag == CSSSpaceList::type_tag()
     || CSSValue::instance_of(type_tag);
}

const char* CSSSpaceList::type_tag() {
  return "CSSSpaceList";
}


//--------------- CSSCommaList -------------------------------------------

CSSCommaList::CSSCommaList(const rc_list<rc_ref<CSSValue>>& list)
    : list_(list) {}

rc_ref<CSSValue> CSSCommaList::visit(CSSVisitor* visitor) {
  return visitor->visit_comma_list(this);
}

size_t CSSCommaList::hash() const {
  return list_->hash() ^ 0xEB3D1567;
}

bool CSSCommaList::operator==(const RefCountedObject& other) const {
  return same_class(other) &&
      list_ == static_cast<const CSSCommaList*>(&other)->list_;
}

void CSSCommaList::write_to(Writer* writer) const {
  const char * separator = "";
  for (const rc_value& item : list_) {
    *writer << separator << item;
    separator = ", ";
  }
}

bool CSSCommaList::instance_of(const char* type_tag) const {
  return type_tag == CSSCommaList::type_tag()
      || CSSValue::instance_of(type_tag);
}

const char* CSSCommaList::type_tag() {
  return "CSSCommaList";
}


//----------------- CSSFunction --------------------------------------

CSSFunction::CSSFunction(const rc_qname& name,
    const rc_list<rc_ref<CSSValue>>& args) : name_(name), args_(args) {}

rc_ref<CSSValue> CSSFunction::visit(CSSVisitor* visitor) {
  return visitor->visit_function(this);
}

size_t CSSFunction::hash() const {
  return (args_->hash() ^ 0xEB3D1567) + name_->hash();
}

bool CSSFunction::operator==(const RefCountedObject& other) const {
  if (!same_class(other)) {
    return false;
  }
  const CSSFunction* of = static_cast<const CSSFunction*>(&other);
  return name_ == of->name_ && args_ == of->args_;
}

void CSSFunction::write_to(Writer* writer) const {
  *writer << name_ << '(';
  const char * separator = "";
  for (const rc_value& arg : args_) {
    *writer << separator << arg;
    separator = ", ";
  }
  *writer << ')';
}

bool CSSFunction::instance_of(const char* type_tag) const {
  return type_tag == CSSFunction::type_tag()
      || CSSValue::instance_of(type_tag);
}

const char* CSSFunction::type_tag() {
  return "CSSFunction";
}


//-------------------- CSSExpr -----------------------------------

CSSExpr::CSSExpr(const rc_ref<expr::Expr>& expr,
    const rc_ref<expr::Scope>& scope) : expr_(expr), scope_(scope) {
  assert(!expr.is_null());
}

rc_ref<CSSValue> CSSExpr::visit(CSSVisitor* visitor) {
  return visitor->visit_expression(this);
}

rc_ref<expr::Expr> CSSExpr::to_expr(expr::Scope* scope,
    const rc_ref<expr::Expr>& ref) {
  size_t adjustment = 0;
  while (scope != scope_.ptr()) {
    if (!scope) {
      fprintf(stderr, "Illegal scope access\n");
      return expr_;
    }
    scope = scope->parent();
    ++adjustment;
  }
  if (adjustment == 0) {
    return expr_;
  }
  return new expr::ExprFrameAdjust(expr_, adjustment);
}

size_t CSSExpr::hash() const {
  return expr_->hash();
}

bool CSSExpr::operator==(const RefCountedObject& other) const {
  return same_class(other) &&
    expr_ == static_cast<const CSSExpr*>(&other)->expr_;
}

void CSSExpr::write_to(Writer* writer) const {
  (*writer) << "-epubx-expr(" << expr_ << ")";
}

const char* CSSExpr::type_tag() {
  return "CSSExpr";
}

bool CSSExpr::instance_of(const char* type_tag) const {
  return type_tag == CSSExpr::type_tag()
      || CSSValue::instance_of(type_tag);
}

//-------------------- CSSVisitor ---------------------------------

rc_ref<CSSValue> CSSVisitor::visit_empty(CSSEmpty* value) {
  error_ = true;
  return value;
}

rc_ref<CSSValue> CSSVisitor::visit_slash(CSSSlash* value) {
  error_ = true;
  return value;
}


rc_ref<CSSValue> CSSVisitor::visit_string(CSSString* value) {
  error_ = true;
  return value;
}


rc_ref<CSSValue> CSSVisitor::visit_ident(CSSIdent* value) {
  error_ = true;
  return value;
}

rc_ref<CSSValue> CSSVisitor::visit_numeric(CSSNumeric* value) {
  error_ = true;
  return value;
}

rc_ref<CSSValue> CSSVisitor::visit_number(CSSNumber* value) {
  error_ = true;
  return value;
}

rc_ref<CSSValue> CSSVisitor::visit_integer(CSSInteger* value) {
  return visit_number(value);
}

rc_ref<CSSValue> CSSVisitor::visit_color(CSSColor* value) {
  error_ = true;
  return value;
}

rc_ref<CSSValue> CSSVisitor::visit_url(CSSUrl* value) {
  error_ = true;
  return value;
}

rc_ref<CSSValue> CSSVisitor::visit_space_list(CSSSpaceList* value) {
  error_ = true;
  return value;
}

rc_ref<CSSValue> CSSVisitor::visit_comma_list(CSSCommaList* value) {
  error_ = true;
  return value;
}

rc_ref<CSSValue> CSSVisitor::visit_function(CSSFunction* value) {
  error_ = true;
  return value;
}

rc_ref<CSSValue> CSSVisitor::visit_expression(CSSExpr* value) {
  error_ = true;
  return value;
}

rc_ref<CSSValue> CSSVisitor::filter_space_list(CSSSpaceList* value) {
  const rc_list<rc_ref<CSSValue>>& list = value->list();
  for (size_t i = 0; i < list->size(); ++i) {
    const rc_ref<CSSValue>& e = list[i];
    rc_ref<CSSValue> f = e->visit(this);
    if (f.ptr() != e.ptr()) {
      std::vector<rc_ref<CSSValue>> new_list;
      for (size_t k = 0; k < i; ++k) {
        new_list.push_back(list[k]);
      }
      new_list.push_back(f);
      for (size_t k = i + 1; k < list->size(); ++k) {
        new_list.push_back(list[k]->visit(this));
      }
      return new CSSSpaceList(rc_list<rc_ref<CSSValue>>(new_list));
    }
  }
  return value;
}

rc_ref<CSSValue> CSSVisitor::filter_comma_list(CSSCommaList* value) {
  const rc_list<rc_ref<CSSValue>>& list = value->list();
  for (size_t i = 0; i < list->size(); ++i) {
    const rc_ref<CSSValue>& e = list[i];
    rc_ref<CSSValue> f = e->visit(this);
    if (f.ptr() != e.ptr()) {
      std::vector<rc_ref<CSSValue>> new_list;
      for (size_t k = 0; k < i; ++k) {
        new_list.push_back(list[k]);
      }
      new_list.push_back(f);
      for (size_t k = i + 1; k < list->size(); ++k) {
        new_list.push_back(list[k]->visit(this));
      }
      return new CSSCommaList(rc_list<rc_ref<CSSValue>>(new_list));
    }
  }
  return value;
}

rc_ref<CSSValue> CSSVisitor::filter_function(CSSFunction* value) {
  const rc_list<rc_ref<CSSValue>>& args = value->args();
  for (size_t i = 0; i < args->size(); ++i) {
    const rc_ref<CSSValue>& e = args[i];
    rc_ref<CSSValue> f = e->visit(this);
    if (f.ptr() != e.ptr()) {
      std::vector<rc_ref<CSSValue>> new_args;
      for (size_t k = 0; k < i; ++k) {
        new_args.push_back(args[k]);
      }
      new_args.push_back(f);
      for (size_t k = i + 1; k < args->size(); ++k) {
        new_args.push_back(args[k]->visit(this));
      }
      return new CSSFunction(value->name(),
          rc_list<rc_ref<CSSValue>>(new_args));
    }
  }
  return value;
}

//---------------------- CSSFilter --------------------------

rc_ref<CSSValue> CSSFilter::visit_empty(CSSEmpty* value) {
  return value;
}

rc_ref<CSSValue> CSSFilter::visit_slash(CSSSlash* value) {
  return value;
}

rc_ref<CSSValue> CSSFilter::visit_string(CSSString* value) {
  return value;
}

rc_ref<CSSValue> CSSFilter::visit_ident(CSSIdent* value) {
  return value;
}

rc_ref<CSSValue> CSSFilter::visit_numeric(CSSNumeric* value) {
  return value;
}

rc_ref<CSSValue> CSSFilter::visit_number(CSSNumber* value) {
  return value;
}

rc_ref<CSSValue> CSSFilter::visit_color(CSSColor* value) {
  return value;
}

rc_ref<CSSValue> CSSFilter::visit_url(CSSUrl* value) {
  return value;
}

rc_ref<CSSValue> CSSFilter::visit_space_list(CSSSpaceList* value) {
  return filter_space_list(value);
}

rc_ref<CSSValue> CSSFilter::visit_comma_list(CSSCommaList* value) {
  return filter_comma_list(value);
}

rc_ref<CSSValue> CSSFilter::visit_function(CSSFunction* value) {
  return filter_function(value);
}

rc_ref<CSSValue> CSSFilter::visit_expression(CSSExpr* value) {
  return value;
}

}
}


