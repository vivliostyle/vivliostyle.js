#ifndef adapt_font_font_mac_h
#define adapt_font_font_mac_h

#include <CoreText/CoreText.h>
#include <CoreText/CTFont.h>

#include "adapt/font/font.h"
#include "adapt/platform/platform_mac.h"

namespace adapt {
namespace font {

struct MacPlatformFont : public RefCountedObject {
  mac::cf_ref<CTFontRef> font;

  MacPlatformFont(CTFontRef fontref) : font(fontref) {}
};

}
}

#endif
