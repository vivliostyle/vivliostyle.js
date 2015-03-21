#ifndef adapt_text_internal_mac_h
#define adapt_text_internal_mac_h

#include <memory>
#include <type_traits>

#include "adapt/base/rc_value.h"
#include "adapt/base/rc_string.h"
#include "adapt/dom/dom.h"

#include <CoreFoundation/CoreFoundation.h>
#include <CoreText/CoreText.h>

namespace adapt {
namespace mac {

template<typename cf_ref_t> struct cf_deleter {
  void operator() (std::remove_pointer<cf_ref_t>* ref) const {
    CFRelease(ref);
  }
};

template<typename cf_ref_t> class cf_ref : public std::unique_ptr<
  std::remove_pointer<cf_ref_t>, cf_deleter<cf_ref_t>> {
 public:
  using element_type = std::remove_pointer<cf_ref_t>;
  using deleter_type = cf_deleter<cf_ref_t>;
  using base = std::unique_ptr<element_type, deleter_type>;

  cf_ref() : base() {}
  explicit cf_ref(cf_ref_t ref)
    : base((element_type*)(ref), deleter_type()) {}
  cf_ref(cf_ref&& ref) : base(std::move(ref)) {}

  const cf_ref& operator=(cf_ref&& ref) {
    base::operator=(std::move(ref));
    return *this;
  }

  cf_ref_t get() const { return reinterpret_cast<cf_ref_t>(base::get()); }
};

inline cf_ref<CFStringRef> cf_str(const rc_string& text) {
  return cf_ref<CFStringRef>(CFStringCreateWithBytes(kCFAllocatorDefault,
      reinterpret_cast<const UInt8*>(text->utf8()), text->length(),
      kCFStringEncodingUTF8, false));
}

inline cf_ref<CFStringRef> cf_str(const char* text) {
  return cf_ref<CFStringRef>(CFStringCreateWithBytes(kCFAllocatorDefault,
      reinterpret_cast<const UInt8*>(text), strlen(text),
      kCFStringEncodingUTF8, false));
}
  
}

namespace text {

struct Run {
  mac::cf_ref<CTFontRef> font;
  CGAffineTransform matrix;
  dom::node_offset_t offset;
  size_t glyph_count;
  CGGlyph* glyphs;
  CGPoint* positions;

  Run() : glyph_count(0), offset(0), glyphs(nullptr), positions(nullptr) {}

  Run(const Run& other) : font(other.font.get()), matrix(other.matrix),
      glyph_count(other.glyph_count), offset(other.offset) {
    if (font) {
      CFRetain(font.get());
    }
    if (other.glyphs) {
      glyphs = new CGGlyph[glyph_count];
      memcpy(glyphs, other.glyphs, glyph_count * sizeof(CGGlyph));
    } else {
      glyphs = nullptr;
    }
    if (other.positions) {
      positions = new CGPoint[glyph_count];
      memcpy(positions, other.positions, glyph_count * sizeof(CGPoint));
    } else {
      positions = nullptr;
    }
  }

  Run(Run&& other) : font(std::move(other.font)), matrix(other.matrix),
      glyph_count(other.glyph_count), glyphs(other.glyphs),
      positions(other.positions), offset(other.offset) {
    other.glyphs = nullptr;
    other.positions = nullptr;
    other.glyph_count = 0;
  }

  const Run& operator=(Run&& other) {
    delete[] glyphs;
    delete[] positions;
    font = std::move(other.font);
    matrix = other.matrix;
    glyph_count = other.glyph_count;
    glyphs = other.glyphs;
    positions = other.positions,
    offset = other.offset;
    other.glyphs = nullptr;
    other.positions = nullptr;
    other.glyph_count = 0;
    return *this;
  }

  ~Run() {
    delete[] glyphs;
    delete[] positions;
  }

  struct StringIndexCompare {
    bool operator() (const Run& r1, const Run& r2) const {
      return r1.offset < r2.offset;
    }
  };
};

struct Line {
  std::vector<Run> runs;
  // edges
  float baseline;
  float start;
  float before;  // distance from before-edge to baseline (positive)
  float after;   // distance from after-edge to baseline (positive)
  dom::node_offset_t offset;

  Line(dom::node_offset_t off, double base, double start, double b, double a)
      : baseline(base), start(start), before(b), after(a), offset(off) {}

  Line(Line&& other) : before(other.before), baseline(other.baseline),
      start(other.start), after(other.after), offset(other.offset),
      runs(std::move(other.runs)) {}
};
      
class LineSequence : public RefCountedObject {
 public:
  std::vector<Line> lines_;

  static const char* type_tag();
 protected:
  virtual bool instance_of(const char* type_tag) const override;
};

}
}

#endif
