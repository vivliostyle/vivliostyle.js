#ifndef adapt_base_writer_h
#define adapt_base_writer_h

#include <stdio.h>
#include <string.h>

namespace adapt {

class rc_string;

template<class N> struct HexBox {
  const N n_;
  HexBox(N n) : n_(n) {}
};

inline HexBox<int> hex(int n) {
  return HexBox<int>(n);
}
  
inline HexBox<size_t> hex(size_t n) {
  return HexBox<size_t>(n);
}
  
inline HexBox<unsigned long long> hex(unsigned long long n) {
  return HexBox<unsigned long long>(n);
}
  
class Writer {
 public:
  virtual ~Writer();
  virtual Writer& flush();
  virtual Writer& write(const char* str, size_t len) = 0;
  virtual Writer& write(const char* str);
  virtual Writer& write(char c);
  virtual Writer& write(int number);
  virtual Writer& write(size_t number);
  virtual Writer& write_hex(int number);
  virtual Writer& write_hex(size_t number);
  virtual Writer& write_hex(unsigned long long number);
  virtual Writer& write(double number);
  virtual Writer& write(bool value);

  static Writer& stdout();
  static Writer& stderr();
};

template<class T> inline Writer& operator<< (Writer& writer, const T& v) {
  if (!v.is_null()) {
    v->write_to(&writer);
  } else {
    writer.write("null");
  }
  return writer;
}

template<class T> inline Writer& operator<< (
    Writer& writer, const HexBox<T>& v) {
  writer.write_hex(v.n_);
  return writer;
}

inline Writer& operator<< (Writer& writer, const char* s) {
  writer.write(s);
  return writer;
}

inline Writer& operator<< (Writer& writer, bool b) {
  writer.write(b);
  return writer;
}

inline Writer& operator<< (Writer& writer, char c) {
  writer.write(c);
  return writer;
}

inline Writer& operator<< (Writer& writer, size_t num) {
  writer.write(num);
  return writer;
}

inline Writer& operator<< (Writer& writer, double num) {
  writer.write(num);
  return writer;
}

inline Writer& operator<< (Writer& writer, int num) {
  writer.write(num);
  return writer;
}

class FILEWriter : public Writer {
 public:
  FILEWriter(FILE* fp, bool close);
  virtual ~FILEWriter();
  virtual Writer& flush();
  virtual Writer& write(const char* str, size_t len);

 private:
  FILE* fp_;
  bool close_;
};
  
class StringWriter : public Writer {
 public:
  StringWriter();
  virtual ~StringWriter();
  virtual Writer& write(const char* str, size_t len);

  rc_string to_string() const;
  void clear();

 private:
  char* buffer_;
  size_t size_;
  size_t capacity_;
};

class FilterWriter : public Writer {
 public:
  FilterWriter(Writer* chained);
  virtual ~FilterWriter();
  virtual Writer& flush();
  virtual Writer& write(const char* str, size_t len);

 protected:
  Writer* chained_;
};

// Escapes characters in CSS name.
class CSSIdentWriter : public FilterWriter {
 public:
  CSSIdentWriter(Writer* writer);
  virtual ~CSSIdentWriter();
  virtual Writer& write(const char* str, size_t len);
};

// Escapes characters in CSS string.
class CSSStringWriter : public FilterWriter {
 public:
  CSSStringWriter(Writer* writer);
  virtual ~CSSStringWriter();
  virtual Writer& write(const char* str, size_t len);
};

}

#endif
