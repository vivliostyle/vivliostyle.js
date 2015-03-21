#ifndef adapt_text_inline_formatter_mac_h
#define adapt_text_inline_formatter_mac_h

#include "adapt/text/inline_formatter.h"

namespace adapt {
namespace text {

class MacInlineFormatterFactory : public InlineFormatterFactory {
public:
  virtual ~MacInlineFormatterFactory();
  virtual std::unique_ptr<InlineFormatter> create() override;
  virtual void trim_attachment(const rc_value& value,
      dom::node_offset_t offset) override;
};

}
}

#endif
