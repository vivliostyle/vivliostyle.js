#include "adapt/dom/cfi.h"

#include <stdlib.h>

#include "adapt/base/rc_map.h"
#include "adapt/base/rc_list.h"

namespace adapt {
namespace dom {

namespace {

void escape(Writer* writer, const rc_string& text) {
  const char* s = text->utf8();
  while (true) {
    char c = *(s++);
    switch (c) {
      case '\0' :
        break;
      case '[' :
      case ']' :
      case '(' :
      case ')' :
      case ',' :
      case '=' :
      case ';' :
      case '^' :
        *writer << '^' << c;
        break;
      default:
        *writer << c;
    }
  }
}

rc_list<rc_string> parse_value(const char** sp) {
  StringWriter w;
  std::vector<rc_string> values;
  const char* s = *sp;
  while (*s != ';' && *s != ']') {
    if (*s == ',') {
      values.push_back(w.to_string());
      w.clear();
    }
    if (*s == '^') {
      ++s;
      if (!*s) {
        return rc_list<rc_string>::empty();
      }
    }
    w << *s;
    ++s;
  }
  values.push_back(w.to_string());
  *sp = s;
  return rc_list<rc_string>(values);
}

rc_map<rc_list<rc_string>> parse_ext(const char** sp) {
  const char* s = *sp;
  std::map<rc_qname, rc_list<rc_string>> ext;
  while (*s == ';') {
    ++s;
    const char *p = s;
    while (*s != '=' && *s != ';' && *s != ']') {
      ++s;
    }
    if (*s != '=') {
      break;
    }
    rc_qname name(p, s - p);
    ++s;
    rc_list<rc_string> list = parse_value(&s);
    if (list->empty()) {
      break;
    }
    ext[name] = list;
  }
  *sp = s;
  return rc_map<rc_list<rc_string>>(ext);
}

SideBias get_bias(const rc_map<rc_list<rc_string>>& ext) {
  rc_list<rc_string> bias_str = ext[rc_qname::atom(ID_s)];
  if (!bias_str.is_null() && bias_str->size() == 1) {
    if (bias_str[0] == "b") {
      return BIAS_BEFORE;
    } else if (bias_str[0] == "a"){
      return BIAS_AFTER;
    }
  }
  return BIAS_NONE;
}

class RefStep : public CFIStep {
 public:
  virtual bool apply_to(Position* pos, rc_string* err) const {
    return false;
  }

  virtual void write_to(Writer* writer) const override {
    *writer << '!';
  }
};

class ChildStep : public CFIStep {
 public:
  ChildStep(size_t index, const rc_qname& id, SideBias side_bias)
      : index_(index), id_(id), side_bias_(side_bias) {}

  virtual bool apply_to(Position* pos, rc_string* err) const {
    if (index_ == 1) {
      // text content
      pos->offset = 1;
      pos->after = false;
      return true;
    }
    size_t element_index = index_ / 2 - 1;
    const dom::Children* children = pos->element->children();
    if (!children || element_index >= children->size()) {
      *err = "E_CFI_NO_CHILD";
      return true;
    }
    pos->element = children->element(element_index);
    pos->offset = 0;
    pos->after = (index_ & 1) != 0;
    if (!id_.empty()) {
      rc_map<rc_value> attrs = pos->element->attributes();
      if (attrs[rc_qname::atom(ID_id)] != id_ &&
          attrs[rc_qname::atom(ID_XML_id)] != id_) {
        *err = "E_CFI_ID_MISMATCH";
      }
    }
    pos->side_bias = side_bias_;
    return true;
  }

  virtual void write_to(Writer* writer) const override {
    *writer << '/' << index_;
    if (!id_.empty() || side_bias_ != BIAS_NONE) {
      *writer << '[';
      if (!id_.empty()) {
        *writer << (id_->to_string());
      }
      if (side_bias_ != BIAS_NONE) {
        *writer << (side_bias_ == BIAS_AFTER ? ";s=a" : ";s=b");
      }
      *writer << ']';
    }
  }

 private:
  size_t index_;
  rc_qname id_;
  SideBias side_bias_;
};

class OffsetStep : public CFIStep {
 public:
  OffsetStep(dom::node_offset_t offset, const rc_string& text_before,
      const rc_string& text_after, SideBias side_bias)
          : offset_(offset), text_before_(text_before), text_after_(text_after),
            side_bias_(side_bias) {}

  virtual bool apply_to(Position* pos, rc_string* err) const {
    pos->offset += offset_;
    pos->side_bias = side_bias_;
    // TODO: text before/after validation
    return true;
  }

  virtual void write_to(Writer* writer) const override {
    *writer << ':' << offset_;
    if (!text_before_->empty() || !text_after_->empty()
        || side_bias_ != BIAS_NONE) {
      *writer << '[';
      if (!text_before_->empty() || !text_after_->empty()) {
        if (!text_before_->empty()) {
          escape(writer, text_before_);
        }
        *writer << ',';
        if (!text_after_->empty()) {
          escape(writer, text_after_);
        }
      }
      if (side_bias_ != BIAS_NONE) {
        *writer << (side_bias_ == BIAS_AFTER ? ";s=a" : ";s=b");
      }
      *writer << ']';
    }
  }

  dom::node_offset_t offset_;
  rc_string text_before_;
  rc_string text_after_;
  SideBias side_bias_;
};

}

rc_ref<CFIFragment> CFIFragment::from(const rc_string& str) {
  const char* s = str->utf8();
  if (*s == '#') {
    ++s;
  }
  if (strncmp(s, "epubcfi(", 8) != 0) {
    fprintf(stderr, "E_CFI_NOT_CFI\n");
    return rc_ref<CFIFragment>();
  }
  s += 8;
  std::vector<rc_ref<CFIStep>> steps;
  while(true) {
    switch (*s) {
      case ')':
        if (s[1] != '\0') {
          fprintf(stderr, "E_CFI_JUNK_AFTER_END\n");
          return rc_ref<CFIFragment>();
        }
        return new CFIFragment(steps);
      case '/': {
        ++s;
        if ('0' > *s || *s > '9') {
          fprintf(stderr, "E_CFI_NUMBER_EXPECTED\n");
          return rc_ref<CFIFragment>();
        }
        char* end;
        long index = ::strtol(s, &end, 10);
        if (index <= 1) {
          fprintf(stderr, "E_CFI_POSITIVE_NUMBER_EXPECTED\n");
          return rc_ref<CFIFragment>();
        }
        rc_qname id;
        rc_map<rc_list<rc_string>> ext = rc_map<rc_list<rc_string>>::empty();
        s = end;
        if (*s == '[') {
          ++s;
          const char *p = s;
          while (*s && *s != ']' && *s != ';') {
            ++s;
          }
          if (p > s) {
            id = rc_qname(p, s - p);
          }
          if (*s == '\0') {
            fprintf(stderr, "E_CFI_INCOMPLETE\n");
            return rc_ref<CFIFragment>();
          }
          if (*s == ';') {
            ext = parse_ext(&s);
            if (*s != ']') {
              fprintf(stderr, "E_CFI_SYNTAX\n");
              return rc_ref<CFIFragment>();
            }
            ++s;
          }
        }
        steps.push_back(new ChildStep(index, id, get_bias(ext)));
        break;
      }
      case ':': {
        ++s;
        if ('0' > *s || *s > '9') {
          fprintf(stderr, "E_CFI_NUMBER_EXPECTED\n");
          return rc_ref<CFIFragment>();
        }
        char* end;
        long offset = ::strtol(s, &end, 10);
        s = end;
        rc_list<rc_string> text = rc_list<rc_string>::empty();
        rc_map<rc_list<rc_string>> ext = rc_map<rc_list<rc_string>>::empty();
        if (*s == '[') {
          ++s;
          text = parse_value(&s);
          if (*s == ';') {
            ext = parse_ext(&s);
          }
          if (*s != ']') {
            fprintf(stderr, "E_CFI_SYNTAX\n");
            return rc_ref<CFIFragment>();
          }
          ++s;
        }
        rc_string text_before = text->size() >= 1 ? text[0] : rc_string();
        rc_string text_after = text->size() >= 2 ? text[1] : rc_string();
        steps.push_back(new OffsetStep(offset, text_before,
            text_after, get_bias(ext)));
        break;
      }
      case '!':
        s++;
        steps.push_back(new RefStep());
        break;
      case '~':
      case '@':
        // Time/space terminus; only useful for highlights/selections which are not yet
        // supported, skip for now.
        s += strlen(s) - 1;
        break;
      default:
        fprintf(stderr, "E_CFI_UNKNOWN_STEP\n");
        return rc_ref<CFIFragment>();
    }
  }
}

rc_ref<CFIFragment> CFIFragment::from(const Position& pos) {
  std::vector<rc_ref<CFIStep>> steps;
  SideBias side_bias = pos.side_bias;
  bool next = false;
  if (pos.after || pos.offset > 0) {
    assert(pos.ref.is_null());
    // Text node
    size_t off = pos.offset;
    rc_string text;
    if (pos.after) {
      next = true;
      text = pos.element->following_text();
    } else {
      --off;
      text = pos.element->leading_text();
    }
    const size_t sz = 8;
    size_t len = text->utf16_length();
    rc_string text_before = text->utf16_substr(std::max(off, sz) - sz, off);
    rc_string text_after = text->utf16_substr(off, std::min(len, off + sz));
    steps.push_back(new OffsetStep(off, text_before, text_after, side_bias));
    if (!pos.after) {
      steps.push_back(new ChildStep(0, rc_qname(), BIAS_NONE));
    }
    side_bias = BIAS_NONE;
  }
  dom::DOM::iterator element = pos.element;
  while(element.has_parent()) {
    size_t index = 2 * (element.child_index() + 1);
    rc_qname id;
    if (next) {
      ++index;
    } else {
      const rc_map<rc_value>& attr = element->attributes();
      rc_value idv = attr[rc_qname::atom(ID_id)];
      if (idv.is_null()) {
        idv = attr[rc_qname::atom(ID_XML_id)];
      }
      if (!idv.is_null()) {
        id = rc_cast<rc_qname>(idv);
      }
    }
    steps.push_back(new ChildStep(index, id, side_bias));
    side_bias = BIAS_NONE;
    element = element.parent();
  }
  std::reverse(steps.begin(), steps.end());
  if (!pos.ref.is_null() && pos.ref->is<rc_ref<CFIFragment>>()) {
    CFIFragment* ref = static_cast<CFIFragment*>(pos.ref.raw_ptr());
    steps.push_back(new RefStep());
    for (const rc_ref<CFIStep>& step : ref->steps_) {
      steps.push_back(step);
    }
  }
  return new CFIFragment(steps);
}

bool CFIFragment::navigate(dom::DOM::iterator root, Position* pos) {
  rc_string err;
  pos->element = root;
  pos->after = false;
  pos->offset = 0;
  pos->side_bias = BIAS_NONE;
  pos->ref = rc_value();
  for (auto it = steps_.begin(); it != steps_.end(); ++it) {
    const rc_ref<CFIStep>& step = *it;
    if (!step->apply_to(pos, &err)) {
      std::vector<rc_ref<CFIStep>> steps;
      for (++it; it != steps_.end(); ++it) {
        steps.push_back(*it);
      }
      pos->ref = new CFIFragment(steps);
      break;
    }
    if (!err->empty()) {
      return false;
    }
  }
  return true;
}

void CFIFragment::write_to(Writer* writer) const {
  *writer << "#epubcfi(";
  for (const rc_ref<CFIStep> step : steps_) {
    step->write_to(writer);
  }
  *writer << ')';
}

CFIFragment::CFIFragment(const std::vector<rc_ref<CFIStep>>& steps)
    : steps_(steps) {}

}
}