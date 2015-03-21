#ifndef adapt_dom_dom_expat_h
#define adapt_dom_dom_expat_h

#include <memory>

namespace adapt {
namespace dom {

class Builder;
class Parser;

const char EXPAT_NS_SEPARATOR = '^';
Parser* create_expat_parser(std::unique_ptr<Builder> builder);

}
}

#endif
