#ifndef adapt_css_value_h
#define adapt_css_value_h

#include "adapt/base/rc_value.h"
#include "adapt/base/rc_string.h"
#include "adapt/base/rc_list.h"
#include "adapt/expr/expr.h"

namespace adapt {
namespace css {

// Need 64 bit.
typedef unsigned long long cascade_priority_t;

static const cascade_priority_t PRI_ORIGIN_MASK = 0xF000000000000000L;
static const cascade_priority_t PRI_ORIGIN_UNIT = 0x1000000000000000L;
static const cascade_priority_t PRI_ID_MASK =     0x0FF0000000000000L;
static const cascade_priority_t PRI_ID_UNIT =     0x0010000000000000L;
static const cascade_priority_t PRI_ATTR_MASK =   0x000FFF0000000000L;
static const cascade_priority_t PRI_ATTR_UNIT =   0x0000010000000000L;
static const cascade_priority_t PRI_TAG_MASK =    0x000000FFF0000000L;
static const cascade_priority_t PRI_TAG_UNIT =    0x0000000010000000L;
static const cascade_priority_t PRI_ORDER_MASK =  0x000000000FFFFFFFL;
static const cascade_priority_t PRI_ORDER_UNIT =  0x0000000000000001L;

class CSSVisitor;

class CSSValue : public RefCountedObject {
 public:
  virtual rc_ref<CSSValue> visit(CSSVisitor* visitor) = 0;
  virtual rc_ref<expr::Expr> to_expr(expr::Scope* scope,
      const rc_ref<expr::Expr>& ref);

  // if CSSIdent, name().id(), otherwise ID_EMPTY
  virtual int id() const;

  static const char* type_tag();

 protected:
  virtual bool instance_of(const char* type_tag) const override;
};

class CSSEmpty : public CSSValue {
 public:
  virtual rc_ref<CSSValue> visit(CSSVisitor* visitor);
  virtual size_t hash() const;
  virtual void write_to(Writer* writer) const;

  static rc_ref<CSSValue> instance();
 private:
  CSSEmpty() {}
};

class CSSSlash : public CSSValue {
 public:
  virtual rc_ref<CSSValue> visit(CSSVisitor* visitor);
  virtual size_t hash() const;
  virtual void write_to(Writer* writer) const;

  static rc_ref<CSSValue> instance();
 private:
  CSSSlash() {}
};

class CSSString : public CSSValue {
 public:
  CSSString(const rc_string& str);
  CSSString(const char* str, size_t length);

  virtual rc_ref<CSSValue> visit(CSSVisitor* visitor);
  virtual rc_ref<expr::Expr> to_expr(expr::Scope* scope,
      const rc_ref<expr::Expr>& ref) override;
  virtual size_t hash() const;
  virtual bool operator==(const RefCountedObject& other) const;
  virtual void write_to(Writer* writer) const;

  const rc_string& str() const { return str_; }

  static const char* type_tag();

 protected:
  virtual bool instance_of(const char* type_tag) const override;

 private:
  rc_string str_;
};

class CSSIdent : public CSSValue {
 public:
  CSSIdent(const rc_qname& name);
  CSSIdent(const char* str, size_t length);

  virtual rc_ref<CSSValue> visit(CSSVisitor* visitor);
  virtual rc_ref<expr::Expr> to_expr(expr::Scope* scope,
      const rc_ref<expr::Expr>& ref) override;
  virtual int id() const override;
  virtual size_t hash() const;
  virtual bool operator==(const RefCountedObject& other) const;
  virtual void write_to(Writer* writer) const;

  const rc_qname& name() const { return name_; }

  static const rc_ref<CSSValue> ident_true();
  static const rc_ref<CSSValue> ident_false();
  static const rc_ref<CSSValue> ident_inherit();

  static const char* type_tag();

protected:
  virtual bool instance_of(const char* type_tag) const override;

 private:
  rc_qname name_;
};

class CSSNumeric : public CSSValue {
public:
  CSSNumeric(double value, const rc_qname& unit);

  virtual rc_ref<CSSValue> visit(CSSVisitor* visitor);
  virtual rc_ref<expr::Expr> to_expr(expr::Scope* scope,
      const rc_ref<expr::Expr>& ref) override;
  virtual size_t hash() const;
  virtual bool operator==(const RefCountedObject& other) const;
  virtual void write_to(Writer* writer) const;

  double num() const { return value_; }
  const rc_qname& unit() const { return unit_; }

  static const char* type_tag();

 protected:
  virtual bool instance_of(const char* type_tag) const override;

 private:
  double value_;
  rc_qname unit_;
};

class CSSNumber : public CSSValue {
 public:
  CSSNumber(double value);

  virtual rc_ref<CSSValue> visit(CSSVisitor* visitor);
  virtual rc_ref<expr::Expr> to_expr(expr::Scope* scope,
      const rc_ref<expr::Expr>& ref) override;
  virtual size_t hash() const;
  virtual bool operator==(const RefCountedObject& other) const;
  virtual void write_to(Writer* writer) const;

  double num() const { return value_; }
  
  static const char* type_tag();

 protected:
  virtual bool instance_of(const char* type_tag) const override;

 private:
  double value_;
};

class CSSInteger : public CSSNumber {
public:
  CSSInteger(int value);

  virtual rc_ref<CSSValue> visit(CSSVisitor* visitor);

  static const char* type_tag();

protected:
  virtual bool instance_of(const char* type_tag) const override;
};

class CSSColor : public CSSValue {
 public:
  CSSColor(unsigned int value);

  virtual rc_ref<CSSValue> visit(CSSVisitor* visitor);
  virtual size_t hash() const;
  virtual bool operator==(const RefCountedObject& other) const;
  virtual void write_to(Writer* writer) const;

  unsigned int rgb() const { return value_; }

  static rc_ref<CSSValue> color_from_hash(const rc_string& text);

  static const char* type_tag();

 protected:
  virtual bool instance_of(const char* type_tag) const override;

 private:
  unsigned int value_;
};

class CSSUrl : public CSSValue {
 public:
  CSSUrl(const rc_string& url);

  virtual rc_ref<CSSValue> visit(CSSVisitor* visitor);
  virtual size_t hash() const;
  virtual bool operator==(const RefCountedObject& other) const;
  virtual void write_to(Writer* writer) const;

  const rc_string& url() const { return url_; }

  static const char* type_tag();

 protected:
  virtual bool instance_of(const char* type_tag) const override;

 private:
  rc_string url_;
};

class CSSSpaceList : public CSSValue {
 public:
  CSSSpaceList(const rc_list<rc_ref<CSSValue>>& list);

  virtual rc_ref<CSSValue> visit(CSSVisitor* visitor);
  virtual size_t hash() const;
  virtual bool operator==(const RefCountedObject& other) const;
  virtual void write_to(Writer* writer) const;

  const rc_list<rc_ref<CSSValue>> list() const { return list_; }

  static const char* type_tag();

 protected:
  virtual bool instance_of(const char* type_tag) const override;

 private:
  rc_list<rc_ref<CSSValue>> list_;
};

class CSSCommaList : public CSSValue {
 public:
  CSSCommaList(const rc_list<rc_ref<CSSValue>>& list);

  virtual rc_ref<CSSValue> visit(CSSVisitor* visitor);
  virtual size_t hash() const;
  virtual bool operator==(const RefCountedObject& other) const;
  virtual void write_to(Writer* writer) const;

  const rc_list<rc_ref<CSSValue>> list() const { return list_; }

  static const char* type_tag();

 protected:
  virtual bool instance_of(const char* type_tag) const override;

 private:
  rc_list<rc_ref<CSSValue>> list_;
};

class CSSFunction : public CSSValue {
 public:
  CSSFunction(const rc_qname& name, const rc_list<rc_ref<CSSValue>>& args);

  virtual rc_ref<CSSValue> visit(CSSVisitor* visitor);
  virtual size_t hash() const;
  virtual bool operator==(const RefCountedObject& other) const;
  virtual void write_to(Writer* writer) const;

  const rc_qname& name() const { return name_; }
  const rc_list<rc_ref<CSSValue>> args() const { return args_; }

  static const char* type_tag();

 protected:
  virtual bool instance_of(const char* type_tag) const override;

 private:
  rc_qname name_;
  rc_list<rc_ref<CSSValue>> args_;
};

class CSSExpr : public CSSValue {
 public:
  CSSExpr(const rc_ref<expr::Expr>& expr, const rc_ref<expr::Scope>& scope);

  virtual rc_ref<CSSValue> visit(CSSVisitor* visitor);
  virtual rc_ref<expr::Expr> to_expr(expr::Scope* scope,
      const rc_ref<expr::Expr>& ref) override;
  virtual size_t hash() const;
  virtual bool operator==(const RefCountedObject& other) const;
  virtual void write_to(Writer* writer) const;

  const rc_ref<expr::Expr>& expr() const { return expr_; }
  const rc_ref<expr::Scope>& scope() const { return scope_; }

  static const char* type_tag();

 protected:
  virtual bool instance_of(const char* type_tag) const;

 private:
  rc_ref<expr::Expr> expr_;
  rc_ref<expr::Scope> scope_;
};

class CSSVisitor {
 public:
  virtual ~CSSVisitor() {}
  virtual rc_ref<CSSValue> visit_empty(CSSEmpty* value);
  virtual rc_ref<CSSValue> visit_slash(CSSSlash* value);
  virtual rc_ref<CSSValue> visit_string(CSSString* value);
  virtual rc_ref<CSSValue> visit_ident(CSSIdent* value);
  virtual rc_ref<CSSValue> visit_numeric(CSSNumeric* value);
  virtual rc_ref<CSSValue> visit_number(CSSNumber* value);
  virtual rc_ref<CSSValue> visit_integer(CSSInteger* value);
  virtual rc_ref<CSSValue> visit_color(CSSColor* value);
  virtual rc_ref<CSSValue> visit_url(CSSUrl* value);
  virtual rc_ref<CSSValue> visit_space_list(CSSSpaceList* value);
  virtual rc_ref<CSSValue> visit_comma_list(CSSCommaList* value);
  virtual rc_ref<CSSValue> visit_function(CSSFunction* value);
  virtual rc_ref<CSSValue> visit_expression(CSSExpr* value);

  bool error() const { return error_; }

 protected:
  rc_ref<CSSValue> filter_space_list(CSSSpaceList* value);
  rc_ref<CSSValue> filter_comma_list(CSSCommaList* value);
  rc_ref<CSSValue> filter_function(CSSFunction* value);

  bool error_;
};

class CSSFilter : public CSSVisitor {
public:
  virtual rc_ref<CSSValue> visit_empty(CSSEmpty* value) override;
  virtual rc_ref<CSSValue> visit_slash(CSSSlash* value) override;
  virtual rc_ref<CSSValue> visit_string(CSSString* value) override;
  virtual rc_ref<CSSValue> visit_ident(CSSIdent* value) override;
  virtual rc_ref<CSSValue> visit_numeric(CSSNumeric* value) override;
  virtual rc_ref<CSSValue> visit_number(CSSNumber* value) override;
  virtual rc_ref<CSSValue> visit_color(CSSColor* value) override;
  virtual rc_ref<CSSValue> visit_url(CSSUrl* value) override;
  virtual rc_ref<CSSValue> visit_space_list(CSSSpaceList* value) override;
  virtual rc_ref<CSSValue> visit_comma_list(CSSCommaList* value) override;
  virtual rc_ref<CSSValue> visit_function(CSSFunction* value) override;
  virtual rc_ref<CSSValue> visit_expression(CSSExpr* value) override;
};

}
}

#endif
