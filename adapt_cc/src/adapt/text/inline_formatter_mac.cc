#include "adapt/text/inline_formatter_mac.h"

#include <memory>
#include <type_traits>

#include <CoreFoundation/CFAttributedString.h>
#include <CoreText/CoreText.h>
#include <CoreText/CTTypesetter.h>
#include <CoreText/CTRun.h>

#include "adapt/platform/platform_mac.h"
#include "adapt/font/font_mac.h"
#include "adapt/css/decode.h"

namespace adapt {
namespace text {

namespace {

using mac::cf_ref;

struct InputSpan {
  bool replaced;
  dom::node_offset_t offset;
  double line_height;  // only needed for replaced

  struct OffsetCompare {
    bool operator() (const InputSpan& o1, const InputSpan& o2) const {
      return o1.offset < o2.offset;
    }
  };
};


struct RawSpan {
  bool replaced;
  CFIndex index;
  dom::node_offset_t offset;
  rc_string text;
  double line_height;
  rc_ref<font::Font> font;
  double width;  // for replaced elements only
  bool no_breaks;

  struct IndexCompare {
    bool operator() (const RawSpan& o1, const RawSpan& o2) const {
      return o1.index < o2.index;
    }
  };

  struct OffsetCompare {
    bool operator() (const RawSpan& o1, const RawSpan& o2) const {
      return o1.offset < o2.offset;
    }
  };
};

// Uses CoreText to implement text layout.
class MacInlineFormatter : public InlineFormatter {
 public:
  MacInlineFormatter();
  virtual ~MacInlineFormatter();
  virtual void init(const rc_ref<font::Font>& block_font, double line_height,
      const rc_qname& text_align,
      double y, const geom::Rectangle& box, geom::BandedShape* shape) override;
  virtual void add_span(const rc_string& text, const rc_ref<font::Font>& font,
      const layout::ComputedElementStyle& style,
      dom::node_offset_t offset) override;
  virtual void add_replaced(double width, double height,
      const layout::ComputedElementStyle& style,
      dom::node_offset_t offset) override;
  virtual float format() override;  // returns last position
  virtual size_t break_count() override;
  virtual void get_break(size_t index, double* pos,
      dom::node_offset_t* offset) override;
  virtual void attach_render_data(RenderDataSink* sink) override;

 private:
  std::vector<RawSpan>::iterator raw_span_for_index(CFIndex index);
  std::vector<InputSpan>::iterator input_span_for_offset(
      dom::node_offset_t offset);
  dom::node_offset_t offset_for_index(CFIndex index);
  void attach_for_input_span(RenderDataSink* sink, const InputSpan& input_span,
      const rc_ref<LineSequence>& attachment);
  rc_string filter_text_normal(const rc_string& text);
  rc_string filter_text_ws(const rc_string& text);
  void add_raw_span(const rc_string& text, const rc_ref<font::Font>& font,
      const layout::ComputedElementStyle& style, double line_height,
      bool no_breaks, dom::node_offset_t offset);
  void add_preformatted(const rc_string& text, const rc_ref<font::Font>& font,
      const layout::ComputedElementStyle& style, double line_height,
      bool no_breaks, dom::node_offset_t offset);
  bool compute_line_width(double line_bottom, double* x, double* width);

  double y_ = 0;
  double y1_ = 0;
  double y2_ = 0;
  double box_x_ = 0;
  double box_y_ = 0;
  double box_width_ = 0;
  geom::BandedShape* shape_ = nullptr;
  std::vector<Line> lines_;
  std::vector<RawSpan> raw_spans_;
  std::vector<InputSpan> input_spans_;
  bool trailing_space_ = true;
  rc_ref<font::Font> block_font_;
  double block_line_height_ = 0;
  rc_qname text_align_;
};

MacInlineFormatter::MacInlineFormatter() {}

MacInlineFormatter::~MacInlineFormatter() {}

void MacInlineFormatter::init(const rc_ref<font::Font>& block_font,
    double line_height, const rc_qname& text_align, double y,
    const geom::Rectangle& box, geom::BandedShape* shape) {
  assert(block_font_.is_null());  // was not initialized yet
  block_font_ = block_font;
  block_line_height_ = line_height;
  y1_ = y;
  y2_ = y + box.dy();
  y_ = y;
  box_y_ = box.y1();
  box_x_ = box.x1();
  box_width_ = box.dx();
  shape_ = shape;
  text_align_ = text_align;
}

static double line_height(const layout::ComputedElementStyle& style,
    double em) {
  auto it = style.find(rc_qname::atom(ID_line_height));
  if (it != style.end()) {
    double line_height;
    css::decode_line_height(it->second, em, &line_height);
    return line_height;
  }
  return 1.25 * em;
}

rc_string MacInlineFormatter::filter_text_normal(const rc_string& text) {
  std::string buffer;
  const char* s = text->utf8();
  const char* end = s + text->length();
  for ( ; s != end; ++s) {
    switch (*s) {
      case ' ':
      case '\r':
      case '\n':
      case '\t':
      case '\f':
        if (!trailing_space_) {
          buffer.push_back(' ');
          trailing_space_ = true;
        }
        break;
      default:
        trailing_space_ = false;
        buffer.push_back(*s);
    }
  }
  return rc_string(buffer.c_str(), buffer.size());
}

rc_string MacInlineFormatter::filter_text_ws(const rc_string& text) {
  std::string buffer;
  const char* s = text->utf8();
  const char* end = s + text->length();
  for ( ; s != end; ++s) {
    switch (*s) {
      case ' ':
      case '\t':
      case '\f':
        if (!trailing_space_) {
          buffer.push_back(' ');
          trailing_space_ = true;
        }
        break;
      default:
        trailing_space_ = false;
        buffer.push_back(*s);
    }
  }
  return rc_string(buffer.c_str(), buffer.size());
}

void MacInlineFormatter::add_span(const rc_string& text,
    const rc_ref<font::Font>& font, const layout::ComputedElementStyle& style,
    dom::node_offset_t offset) {
  double lh = line_height(style, font->em_size);

  input_spans_.push_back(InputSpan {false, offset, lh});

  auto it = style.find(rc_qname::atom(ID_white_space));
  if (it != style.end()) {
    switch (it->second->id()) {
      case ID_pre_line:
        add_preformatted(filter_text_ws(text), font, style, lh, false, offset);
        return;
      case ID_pre:
        add_preformatted(text, font, style, lh, true, offset);
        return;
      case ID_pre_wrap:
        add_preformatted(text, font, style, lh, false, offset);
        return;
      case ID_nowrap:
        add_raw_span(filter_text_normal(text), font, style, lh, true, offset);
        return;
    }
  }
  // normal case
  add_raw_span(filter_text_normal(text), font, style, lh, false, offset);
}

void MacInlineFormatter::add_preformatted(const rc_string& text,
    const rc_ref<font::Font>& font, const layout::ComputedElementStyle& style,
    double line_height, bool no_breaks, dom::node_offset_t offset) {
  const char* begin = text->utf8();
  const char* s = begin;
  while(true) {
    char c = *s;
    switch (c) {
      case '\0':
        if (s > begin) {
          add_raw_span(rc_string(begin, s - begin), font, style, line_height,
              no_breaks, offset);
          trailing_space_ = false;
        } else {
          trailing_space_ = true;
        }
        return;
      case '\r':
        if (s > begin) {
          add_raw_span(rc_string(begin, s - begin), font, style, line_height,
              no_breaks, offset);
        }
        ++s;
        if (*s == '\n') {
          ++s;
        }
        break;
      case '\n':
        if (s > begin) {
          add_raw_span(rc_string(begin, s - begin), font, style, line_height,
              no_breaks, offset);
        }
        ++s;
        break;
      default:
        ++s;
        continue;
    }
    // Format what we got and move to the next line
    double orig_y = y_;
    format();
    if (y_ == orig_y) {
      y_ += line_height;
    }
    begin = s;
  }
}

void MacInlineFormatter::add_raw_span(const rc_string& text,
    const rc_ref<font::Font>& font, const layout::ComputedElementStyle& style,
    double line_height, bool no_breaks, dom::node_offset_t offset) {
  // Ensure the entries come in increasing order.
  printf("add_span \"%s\"\n", text->utf8());
  assert(raw_spans_.empty() || raw_spans_.back().offset < offset);
  raw_spans_.push_back(RawSpan());
  RawSpan& span = raw_spans_.back();
  span.replaced = false;
  span.index = 0;
  span.offset = offset;
  span.font = font;
  span.line_height = line_height;
  span.text = text;
  span.no_breaks = no_breaks;
}

void MacInlineFormatter::add_replaced(double width, double height,
    const layout::ComputedElementStyle& style, dom::node_offset_t offset) {
  trailing_space_ = false;
  static rc_string placeholder("o");  // for now
  printf("Adding replaced: %g %g\n", width, height);

  input_spans_.push_back(InputSpan {true, offset, height});

  assert(raw_spans_.empty() || raw_spans_.back().offset < offset);
  raw_spans_.push_back(RawSpan());
  RawSpan& span = raw_spans_.back();
  span.replaced = true;
  span.index = 0;
  span.offset = offset;
  span.text = placeholder;
  span.font = block_font_;
  span.width = width;
  span.line_height = height;
}

std::vector<RawSpan>::iterator MacInlineFormatter::raw_span_for_index(
    CFIndex index) {
  std::vector<RawSpan>::iterator it = std::upper_bound(
      raw_spans_.begin(), raw_spans_.end(),
      RawSpan {false, index, 0}, RawSpan::IndexCompare());
  assert(it != raw_spans_.begin());
  --it;
  return it;
}

std::vector<InputSpan>::iterator MacInlineFormatter::input_span_for_offset(
    dom::node_offset_t offset) {
  std::vector<InputSpan>::iterator it = std::upper_bound(
      input_spans_.begin(), input_spans_.end(),
      InputSpan {false, offset}, InputSpan::OffsetCompare());
  assert(it != input_spans_.begin());
  --it;
  return it;
}


dom::node_offset_t MacInlineFormatter::offset_for_index(CFIndex index) {
  std::vector<RawSpan>::iterator it = raw_span_for_index(index);
  return it->offset + dom::node_offset_t(index - it->index);
}

void copy_run(Run* run, const RawSpan& span, CTRunRef ctrun, double add_x) {
  CFDictionaryRef attrs = CTRunGetAttributes(ctrun);
  if (attrs) {
    run->font = mac::cf_ref<CTFontRef>(static_cast<CTFontRef>(
        CFDictionaryGetValue(attrs, kCTFontAttributeName)));
    CFRetain(run->font.get());
  }
  run->offset = span.offset;
  run->matrix = CTRunGetTextMatrix(ctrun);
  run->glyph_count = CTRunGetGlyphCount(ctrun);
  CFRange all = CFRangeMake(0, run->glyph_count);
  run->glyphs = new CGGlyph[run->glyph_count];
  CTRunGetGlyphs(ctrun, all, run->glyphs);
  run->positions = new CGPoint[run->glyph_count];
  CTRunGetPositions(ctrun, all, run->positions);
  if (add_x > 0) {
    for (size_t i = 0; i < run->glyph_count; ++i) {
      run->positions[i].x += add_x;
    }
  }
}

void copy_run(Run* run, const RawSpan& span, CTRunRef ctrun,
    double add_x, CFRange index_range) {
  // Note: run order may be totally different from the order of
  // characters because of bidi.
  CFDictionaryRef attrs = CTRunGetAttributes(ctrun);
  if (attrs) {
    run->font = mac::cf_ref<CTFontRef>(static_cast<CTFontRef>(
        CFDictionaryGetValue(attrs, kCTFontAttributeName)));
    CFRetain(run->font.get());
  }
  run->offset = span.offset + index_range.location - span.index;
  run->matrix = CTRunGetTextMatrix(ctrun);
  CFIndex glyph_count = CTRunGetGlyphCount(ctrun);
  std::unique_ptr<CFIndex[]> indices(new CFIndex[glyph_count]);
  std::unique_ptr<CGGlyph[]> glyphs(new CGGlyph[glyph_count]);
  std::unique_ptr<CGPoint[]> positions(new CGPoint[glyph_count]);
  CFRange all = CFRangeMake(0, run->glyph_count);
  CTRunGetStringIndices(ctrun, all, indices.get());
  CTRunGetGlyphs(ctrun, all, glyphs.get());
  CTRunGetPositions(ctrun, all, positions.get());
  CFIndex run_glyph_count = 0;
  for (CFIndex glyph_index = 0; glyph_index < glyph_count; ++glyph_index) {
    CFIndex string_index = indices[glyph_index];
    if (string_index < index_range.location
        || string_index >= index_range.location + index_range.length) {
      continue;
    }
    ++run_glyph_count;
  }
  run->glyph_count = run_glyph_count;
  run->glyphs = new CGGlyph[run_glyph_count];
  run->positions = new CGPoint[run_glyph_count];
  CFIndex dest_index = 0;
  for (CFIndex glyph_index = 0; glyph_index < glyph_count; ++glyph_index) {
    CFIndex string_index = indices.get()[glyph_index];
    if (string_index < index_range.location
        || string_index >= index_range.location + index_range.length) {
      continue;
    }
    run->glyphs[dest_index] = glyphs[glyph_index];
    run->positions[dest_index] = positions[glyph_index];
    run->positions[dest_index].x += add_x;
    ++dest_index;
  }
}

void update_line_box(double* top, double* bottom, bool* changed,
    const RawSpan& span) {
  double span_top;
  double span_bottom;
  if (!span.replaced) {
    double half_leading =
        (span.line_height - span.font->ascent - span.font->descent) / 2;
    span_top = half_leading + span.font->ascent;
    span_bottom = half_leading + span.font->descent;
  } else {
    span_top = span.line_height;
    span_bottom = 0;
  }
  if (span_top > *top) {
    *top = span_top;
    *changed = true;
  }
  if (span_bottom > *bottom) {
    *bottom = span_bottom;
    *changed = true;
  }
}

bool MacInlineFormatter::compute_line_width(
    double line_bottom, double* x, double* width) {
  // Use it to compute the available width for this line.
  std::vector<double> available_line_ranges;
  shape_->band_ranges(box_y_ + y_, box_y_ + line_bottom,
      box_x_, box_x_ + box_width_, &available_line_ranges);
  if (available_line_ranges.empty()) {
    // Nothing fits
    y_ += block_line_height_;
    return false;
  }
  *width = 0;
  *x = 0;
  for (size_t i = 0; i < available_line_ranges.size(); i += 2) {
    double start = available_line_ranges[i];
    double end = available_line_ranges[i + 1];
    double w = end - start;
    if (w > *width) {
      *width = w;
      *x = start - box_x_;
    }
  }
  return true;
}

float MacInlineFormatter::format() {  // returns last position
  printf("formatting\n");
  static CTTextAlignment text_alignment = kCTLeftTextAlignment;
  static CTLineBreakMode line_break_mode = kCTLineBreakByWordWrapping;
  static CTParagraphStyleSetting settings[] = {
    { kCTParagraphStyleSpecifierAlignment,
      sizeof(text_alignment), &text_alignment },
    { kCTParagraphStyleSpecifierLineBreakMode,
      sizeof(line_break_mode), &line_break_mode },
  };
  cf_ref<CTParagraphStyleRef> paragraph_style(CTParagraphStyleCreate(
      settings, sizeof(settings) / sizeof(settings[0])));
  cf_ref<CFMutableAttributedStringRef> attrstr(
      CFAttributedStringCreateMutable(kCFAllocatorDefault, 0));
  for (RawSpan& span : raw_spans_) {
    cf_ref<CFStringRef> str(CFStringCreateWithBytes(kCFAllocatorDefault,
          reinterpret_cast<const UInt8*>(span.text->utf8()),
          span.text->length(), kCFStringEncodingUTF8, false));
    span.index = CFAttributedStringGetLength(attrstr.get());
    CFRange range = CFRangeMake(span.index, 0);
    CFAttributedStringReplaceString(attrstr.get(), range, str.get());
  }
  auto it = raw_spans_.begin();
  while (it != raw_spans_.end()) {
    RawSpan& span = *it;
    ++it;
    CFIndex next_index = it != raw_spans_.end() ? it->index
        : CFAttributedStringGetLength(attrstr.get());
    printf("range: %ld %ld\n", span.index, next_index);
    CFRange range = CFRangeMake(span.index, next_index - span.index);
    rc_ref<font::MacPlatformFont> pfont =
        rc_cast<rc_ref<font::MacPlatformFont>>(span.font->platform_font);
    CFAttributedStringSetAttribute(attrstr.get(), range,
        kCTFontAttributeName, pfont->font.get());
    if (span.replaced) {
      double req_width = span.width;
      double placeholder_width = span.font->ch_size;
      double adj = req_width - placeholder_width;
      CFAttributedStringSetAttribute(attrstr.get(), range, kCTKernAttributeName,
          CFNumberCreate(kCFAllocatorDefault, kCFNumberDoubleType, &adj));
    }
  }
  CFAttributedStringSetAttribute(attrstr.get(),
      CFRangeMake(0, CFAttributedStringGetLength(attrstr.get())),
      kCTParagraphStyleAttributeName, paragraph_style.get());
  CFAttributedStringSetAttribute(attrstr.get(),
      CFRangeMake(0, CFAttributedStringGetLength(attrstr.get())),
      kCTForegroundColorAttributeName,
      CGColorGetConstantColor(kCGColorBlack));
  cf_ref<CTTypesetterRef> typesetter(
      CTTypesetterCreateWithAttributedString(attrstr.get()));
  // Compute CSS line box "strut"
  double strut_half_leading =
      (block_line_height_ - block_font_->descent - block_font_->ascent) / 2;
  double strut_line_box_bottom = block_font_->descent + strut_half_leading;
  double strut_line_box_top = block_font_->ascent + strut_half_leading;
  std::vector<double> available_line_ranges;
  CFIndex index = 0;
  CFIndex length = CFAttributedStringGetLength(attrstr.get());
  double line_box_bottom = strut_line_box_bottom;
  double line_box_top = strut_line_box_top;
  while (index < length) {
    // TODO: implement filling in shapes with "holes". Currently, just pick
    // the longest available span.
    // Calculate provisional line box bottom
    double provisional_bottom = y_ + line_box_top + line_box_bottom;
    if (provisional_bottom >= y2_) {
      // out of vertical space
      break;
    }
    double x;
    double width;
    if (!compute_line_width(provisional_bottom, &x, &width)) {
      continue;
    }
    CFIndex char_count = CTTypesetterSuggestLineBreak(typesetter.get(),
        index, width);
    cf_ref<CTLineRef> ct_line(CTTypesetterCreateLine(typesetter.get(),
        CFRangeMake(index, char_count)));
    double add_x;
    switch (text_align_->id()) {
      case ID_right:
      case ID_center: {
        double line_width = CTLineGetTypographicBounds(ct_line.get(), nullptr,
            nullptr, nullptr);
        add_x = width - line_width;
        if (text_align_->id() == ID_center) {
          add_x /= 2;
        }
        break;
      }
      default:
        add_x = 0;
    }
    CFArrayRef runs = CTLineGetGlyphRuns(ct_line.get());  // no need to release
    CFIndex run_count = CFArrayGetCount(runs);
    if (run_count > 0) {
      lines_.push_back(Line(offset_for_index(index), 0, 0, 0, 0));
      Line& line = lines_.back();
      bool box_changed = false;
      for (CFIndex run_index = 0; run_index < run_count; ++run_index) {
        // Note: run order may be totally different from the order of
        // characters because of bidi.
        CTRunRef run = static_cast<CTRunRef>(
            CFArrayGetValueAtIndex(runs, run_index));
        // Check if this run crosses span boundaries. If so, split it, as we
        // do not want runs to be shared between spans (except in special
        // cases, e.g. ligatures).
        CFRange index_range = CTRunGetStringRange(run);
        auto base = raw_span_for_index(index_range.location);
        auto next = base + 1;  // next span data
        CFIndex end_index = index_range.location + index_range.length;
        // Checking that there is next span and its index is smaller than
        // the end of this run.
        if (next < raw_spans_.end() && next->index < end_index) {
          // If so, the run needs splitting
          do {
            // Index range that belongs to the current span
            index_range.location = base->index;
            index_range.length = next->index - base->index;
            printf("Split off: %ld %ld\n", index_range.location,
                   index_range.location + index_range.length);
            line.runs.push_back(Run());
            update_line_box(&line_box_top, &line_box_bottom,
                &box_changed, *base);
            copy_run(&line.runs.back(), *base, run, add_x, index_range);
            base = next;
            ++next;
          } while(next < raw_spans_.end() && next->index < end_index);
          index_range.location = base->index;
          index_range.length = end_index - base->index;
          printf("Finished: %ld %ld\n", index_range.location,
                 index_range.location + index_range.length);
          if (index_range.length > 0) {
            line.runs.push_back(Run());
            update_line_box(&line_box_top, &line_box_bottom,
                &box_changed, *base);
            copy_run(&line.runs.back(), *base, run, add_x, index_range);
          }
        } else {
          // No need to split the run
          printf("Not splitting: %ld %ld\n", index_range.location,
              index_range.location + index_range.length);
          line.runs.push_back(Run());
          update_line_box(&line_box_top, &line_box_bottom,
              &box_changed, *base);
          copy_run(&line.runs.back(), *base, run, add_x);
        }
      }
      if (box_changed) {
        // line box changed; need to recompute width
        double new_width;
        double new_x;
        double new_bottom = y_ + line_box_top + line_box_bottom;
        if (new_bottom > y2_) {
          break;
        }
        if (!compute_line_width(new_bottom, &new_x, &new_width)) {
          // Could not fit line! y_ was shifted down, reset line box and try
          // again.
          line_box_bottom = strut_line_box_bottom;
          line_box_top = strut_line_box_top;
          continue;
        }
        if (new_width < width) {
          // Too tight for our line. Try again with the same y_, but larger
          // line box.
          continue;
        }
        // Could not possibly get larger
        assert(width == new_width);
      }
      line.baseline = y_ + line_box_top;
      line.start = x;
      line.before = line_box_top;
      line.after = line_box_bottom;
      std::sort(line.runs.begin(), line.runs.end(), Run::StringIndexCompare());
    }
    // Move to the next line
    y_ += line_box_top + line_box_bottom;
    line_box_bottom = strut_line_box_bottom;
    line_box_top = strut_line_box_top;
    index += char_count;
  }
  raw_spans_.clear();
  printf("position: %g\n", y_);
  return y_;
}

size_t MacInlineFormatter::break_count() {
  if (lines_.empty()) {
    return 0;
  }
  return lines_.size() - 1;
}

void MacInlineFormatter::get_break(size_t index, double* pos,
    dom::node_offset_t* offset) {
  assert(index < break_count());
  const Line& line = lines_[index + 1];
  *pos = line.baseline - line.before;
  *offset = line.offset;
}

void MacInlineFormatter::attach_for_input_span(RenderDataSink* sink,
    const InputSpan& span, const rc_ref<LineSequence>& attachment) {
  if (span.replaced) {
    // Can be only one line with a single run.
    assert(attachment->lines_.size() == 1);
    assert(attachment->lines_[0].runs.size() == 1);
    double x = attachment->lines_[0].runs[0].positions->x;
    double y = attachment->lines_[0].baseline
        + attachment->lines_[0].runs[0].positions->y - span.line_height;
    sink->position_replaced(span.offset, x, y);
  } else {
    sink->attach(span.offset, attachment);
  }
}

void MacInlineFormatter::attach_render_data(RenderDataSink* sink) {
  rc_ref<LineSequence> attachment;
  std::vector<Line>::iterator line = lines_.begin();
  if (line == lines_.end()) {
    return;
  }
  std::vector<Run>::iterator run = line->runs.begin();
  std::vector<InputSpan>::iterator span = input_spans_.begin();
  if (span == input_spans_.end()) {
    return;
  }
  while (line != lines_.end()) {
    std::vector<InputSpan>::iterator curr_span
        = input_span_for_offset(run->offset);
    if (curr_span > span && !attachment.is_null()) {
      attach_for_input_span(sink, *span, attachment);
      attachment = rc_ref<LineSequence>();
    }
    if (attachment.is_null()) {
      attachment = new LineSequence();
      span = curr_span;
      attachment->lines_.push_back(Line(line->offset, line->baseline,
          line->start, line->before, line->after));
    }
    attachment->lines_.back().runs.push_back(std::move(*run));
    ++run;
    if (run == line->runs.end()) {
      ++line;
      if (line != lines_.end()) {
        attachment->lines_.push_back(Line(line->offset, line->baseline,
            line->start, line->before, line->after));
        run = line->runs.begin();
      }
    }
  }
  if (!attachment.is_null()) {
    attach_for_input_span(sink, *span, attachment);
  }
}

}

MacInlineFormatterFactory::~MacInlineFormatterFactory() {
}

std::unique_ptr<InlineFormatter> MacInlineFormatterFactory::create() {
  return std::unique_ptr<InlineFormatter>(new MacInlineFormatter());
}

void MacInlineFormatterFactory::trim_attachment(const rc_value& value,
    dom::node_offset_t offset) {
  if (!value->is<rc_ref<LineSequence>>()) {
    return;
  }
  rc_ref<LineSequence> ls = rc_cast<rc_ref<LineSequence>>(value);
  while (!ls->lines_.empty() && ls->lines_.back().offset >= offset) {
    ls->lines_.pop_back();
  }
}


InlineFormatterFactory* get_inline_formatter_factory() {
  static MacInlineFormatterFactory factory;
  return &factory;
}


}
}
