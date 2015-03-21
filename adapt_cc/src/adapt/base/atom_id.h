#ifndef adapt_base_atom_id_h
#define adapt_base_atom_id_h

namespace adapt {

#define adapt_def_ns(ns, str) NS_##ns,
#define adapt_def_name(n) ID_##n,
#define adapt_def_name_str(n, str) ID_##n,
#define adapt_def_qname(ns, n) ID_##ns##_##n,
#define adapt_def_qname2(ns, n) ID_##n, ID_##ns##_##n,

enum AtomID {
  ID_EMPTY = 0,
#define adapt_include_atom_list
#include "adapt/base/atom_list.h"
#undef adapt_include_atom_list
  ID_MAX_ATOM
};

#undef adapt_def_ns
#undef adapt_def_name
#undef adapt_def_name_str
#undef adapt_def_qname
#undef adapt_def_qname2

}

#endif
