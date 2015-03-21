#include "adapt/base/url.h"

#include <string>

namespace adapt {

rc_string strip_url_fragment_and_query(const rc_string& url) {
  for (const char* s = url->utf8(); *s; ++s) {
    char c = *s;
    if (c == '#' || c == '?') {
      return url->substr(0, s - url->utf8());
    }
  }
  return url;
}

rc_string get_url_fragment(const rc_string& url) {
  const char * fragment = strchr(url->utf8(), '#');
  if (fragment) {
    return fragment + 1;
  }
  return rc_string();
}

bool is_absolute_url(const rc_string& url) {
  for (const char* s = url->utf8(); *s; ++s) {
    char c = *s;
    if (c == ':') {
      return s > url->utf8() + 2;
    }
    if (('a' > c || c > 'z') && ('A' > c || c > 'Z')) {
      return false;
    }
  }
  return false;
}

rc_string resolve_url(const rc_string& base_url, const rc_string& rel_url) {
  // No base url or rel_url is absolute, return rel_url
  if (base_url->empty() || is_absolute_url(rel_url)) {
    return rel_url;
  }
  std::string result;
  rc_string stripped_base = strip_url_fragment_and_query(base_url);
  result.append(stripped_base->utf8(), stripped_base->length());
  size_t domain_index = result.find("://");
  size_t domain_end_index = 0;
  if (domain_index != std::string::npos) {
    domain_index += 3;
    domain_end_index = result.find("/", domain_index, 1);
    if (domain_end_index == std::string::npos) {
      result.append("/");
      domain_end_index = result.size();
    }
  }
  char fch = rel_url->utf8()[0];
  if (fch != '#' && fch != '?') {
    size_t pos = result.rfind("/");
    if (pos == std::string::npos) {
      return rel_url;
    }
    result.resize(pos + 1);
  }
  result.append(rel_url->utf8(), rel_url->length());
  while (true) {
    size_t pos = result.find("/../");
    if (pos == std::string::npos || pos < domain_end_index) {
      break;
    }
    size_t spos = result.rfind("/", pos - 1);
    if (spos == std::string::npos || spos < domain_end_index) {
      break;
    }
    result.erase(spos, pos + 3);
  }
  return rc_string(result.c_str(), result.size());
}
  
}
