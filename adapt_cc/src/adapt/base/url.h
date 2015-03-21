#ifndef adapt_base_url_h
#define adapt_base_url_h

#include "adapt/base/rc_string.h"

namespace adapt {

rc_string strip_url_fragment_and_query(const rc_string& url);
rc_string get_url_fragment(const rc_string& url);
bool is_absolute_url(const rc_string& url);
rc_string resolve_url(const rc_string& base_url, const rc_string& rel_url);

}

#endif
