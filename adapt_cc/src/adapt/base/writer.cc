#include "adapt/base/writer.h"

#include <stdio.h>

#include "adapt/base/rc_string.h"

namespace adapt {

Writer::~Writer() {
}

Writer& Writer::flush() {
  return *this;
}

Writer& Writer::write(const char* s) {
  return write(s, ::strlen(s));
}

Writer& Writer::write(char c) {
  return write(&c, 1);
}

Writer& Writer::write(int number) {
  char buf[sizeof number * 3 + 1];
  sprintf(buf, "%d", number);
  return write(buf);
}

Writer& Writer::write(size_t number) {
  char buf[sizeof number * 3 + 1];
  sprintf(buf, "%zu", number);
  return write(buf);
}
  
Writer& Writer::write_hex(int number) {
  char buf[sizeof number * 3 + 1];
  sprintf(buf, "%x", number);
  return write(buf);
}
  
Writer& Writer::write_hex(size_t number) {
  char buf[sizeof number * 3 + 1];
  sprintf(buf, "%zx", number);
  return write(buf);
}
  
Writer& Writer::write_hex(unsigned long long number) {
  char buf[sizeof number * 3 + 1];
  sprintf(buf, "%llx", number);
  return write(buf);
}
  
Writer& Writer::write(double number) {
  char buf[64];
  sprintf(buf, "%lg", number);
  return write(buf);
}

Writer& Writer::write(bool value) {
  return write(value ? "true" : "false");
}

Writer& Writer::stdout() {
  static FILEWriter out(::stdout, false);
  return out;
}

Writer& Writer::stderr() {
  static FILEWriter err(::stderr, false);
  return err;
}

//------------ FILEWriter -------------------

FILEWriter::FILEWriter(FILE* fp, bool close)
  : fp_(fp), close_(close) {}

FILEWriter::~FILEWriter() {
  if (close_) {
    ::fclose(fp_);
  }
}

Writer& FILEWriter::flush() {
  ::fflush(fp_);
  return *this;
}

Writer& FILEWriter::write(const char* str, size_t len) {
  ::fwrite(str, 1, len, fp_);
  return *this;
}

//--------------- StringWriter -----------------

StringWriter::StringWriter() : size_(0), capacity_(100) {
  buffer_ = new char[capacity_];
}

StringWriter::~StringWriter() {
  delete[] buffer_;
}

Writer& StringWriter::write(const char* str, size_t len) {
  if (len + size_ > capacity_) {
    size_t new_capacity = len + size_ + capacity_;
    char* new_buffer = new char[new_capacity];
    memcpy(new_buffer, buffer_, size_);
    delete[] buffer_;
    buffer_ = new_buffer;
    capacity_ = new_capacity;
  }
  memcpy(buffer_ + size_, str, len);
  size_ += len;
  return *this;
}

rc_string StringWriter::to_string() const {
  return rc_string(buffer_, size_);
}

void StringWriter::clear() {
  size_ = 0;
}

//---------------- Filter Writer --------------------

FilterWriter::FilterWriter(Writer* chained) : chained_(chained) {}

FilterWriter::~FilterWriter() {}

Writer& FilterWriter::flush() {
  chained_->flush();
  return *this;
}

Writer& FilterWriter::write(const char* str, size_t len) {
  chained_->write(str, len);
  return *this;
}

//---------------- CSSIdentWriter --------------------

CSSIdentWriter::CSSIdentWriter(Writer* writer) : FilterWriter(writer) {}

CSSIdentWriter::~CSSIdentWriter() {}

Writer& CSSIdentWriter::write(const char* str, size_t len) {
  size_t start = 0;
  for (size_t i = 0; i < len; ++i) {
    unsigned char c = str[i];
    if ((c < 'a' || c > 'z') && (c < 'A' || c > 'Z') && (c < '0' || c > '9')
        && c != '-' && c != '_' && c < 127) {
      if (start < i) {
        chained_->write(str + start, i - start);
      }
      // Need escaping
      char buf[8];
      sprintf(buf, "\\%X ", c);
      chained_->write(buf, strlen(buf));
      start = i + 1;
    }
  }
  if (start < len) {
    chained_->write(str + start, len - start);
  }
  return *this;
}

//---------------- CSSStringWriter --------------------

CSSStringWriter::CSSStringWriter(Writer* writer) : FilterWriter(writer) {}

CSSStringWriter::~CSSStringWriter() {}

Writer& CSSStringWriter::write(const char* str, size_t len) {
  size_t start = 0;
  for (size_t i = 0; i < len; ++i) {
    unsigned char c = str[i];
    if (c < ' ' || c == '"') {
      if (start < i) {
        chained_->write(str + start, i - start);
      }
      // Need escaping
      char buf[8];
      sprintf(buf, "\\%X ", c);
      chained_->write(buf, strlen(buf));
      start = i + 1;
    }
  }
  if (start < len) {
    chained_->write(str + start, len - start);
  }
  return *this;
}

}
