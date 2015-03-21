#ifndef adapt_css_tok_h
#define adapt_css_tok_h

#include "adapt/base/rc_string.h"

namespace adapt {
namespace css {

enum TokenType {
  TT_EOF = 0,
  TT_IDENT,
  TT_STR,
  TT_NUMERIC,
  TT_NUM,
  TT_INT,
  TT_FUNC,
  TT_HASH,
  TT_URL,
  TT_CLASS,
  TT_O_PAR,
  TT_C_PAR,
  TT_O_BRC,
  TT_C_BRC,
  TT_O_BRK,
  TT_C_BRK,
  TT_COMMA,
  TT_SEMICOL,
  TT_COLON,
  TT_SLASH,
  TT_AT,
  TT_PERCENT,
  TT_QMARK,
  TT_PLUS,
  TT_MINUS,
  TT_BAR_BAR,
  TT_AMP_AMP,
  TT_EQ_GT,
  // those can have "=" at the end
  TT_BANG,
  TT_DOLLAR,
  TT_HAT,
  TT_BAR,
  TT_TILDE,
  TT_STAR,
  TT_GT,
  TT_LT,
  TT_EQ,
  // tokens above plus "=" at the end, order must be the same
  TT_BANG_EQ,
  TT_DOLLAR_EQ,
  TT_HAT_EQ,
  TT_BAR_EQ,
  TT_TILDE_EQ,
  TT_STAR_EQ,
  TT_GT_EQ,
  TT_LT_EQ,
  TT_EQ_EQ,
  TT_COL_COL,
  TT_INVALID,
  TT_MEDIA_AND,  // Not a real token, needed in parser.
  TT_MAX_VALUE
};

class Tokenizer;

class Token {
  friend class Tokenizer;
 public:
  Token() {}

  TokenType type() const { return type_; }
  bool preceded_by_space() const { return preceded_by_space_; }
  double num() const { return num_; }
  const rc_string& text() const { return text_; }
  size_t position() const { return position_; }

 private:
  TokenType type_;
  bool preceded_by_space_;
  double num_;
  rc_string text_;
  size_t position_;
};

class Tokenizer {
 public:
  Tokenizer(const char* input, size_t length)
    : input_(input), position_(input), input_end_(input + length), head_(-1),
      tail_(0), curr_(0), index_mask_(7),
      buffer_(new Token[8]) {}

  ~Tokenizer() {
  }

  const Token& token() {
    if (tail_ == curr_) {
      fill_buffer();
    }
    return buffer_[curr_];
  }

  const Token& nth_token(int n) {
    if (((tail_ - curr_) & index_mask_) <= n)
      fill_buffer();
    return buffer_[(curr_ + n) & index_mask_];
  }

  void consume() {
    assert(tail_ != curr_);
    curr_ = (curr_ + 1) & index_mask_;
  };

  void mark() {
    assert(head_ < 0);
    head_ = curr_;
  };

  void reset() {
    assert(head_ >= 0);
    curr_ = head_;
    head_ = -1;
  };

  void unmark() {
    head_ = -1;
  };

  bool has_mark() {
    return head_ >= 0;
  };

 private:

  void fill_buffer();
  void grow_buffer();

  std::unique_ptr<Token[]> buffer_ ;  // buffer size is index_mask_ + 1
  int index_mask_;
  int head_; // saved, occupied if >= 0
  int tail_; // available, ready to write
  int curr_ ; // ready to read
	const char* input_;
  const char* position_;
  const char* input_end_;
  std::vector<std::unique_ptr<Token[]>> junk_;
};

}
}

#endif
