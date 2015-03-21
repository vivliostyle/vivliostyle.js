#include "adapt/font/font_mac.h"
#include "adapt/base/rc_string.h"

namespace adapt {
namespace font {

rc_ref<Font> lookup_font(const rc_list<rc_string>& family,
    int style, int weight, float size) {
  rc_string mac_family = family->empty() ? rc_string("Times") : family[0];
  if (mac_family == "serif") {
    mac_family = "Times";
  } else if (mac_family == "sans-serif") {
    mac_family = "Helvetica";
  } else if (mac_family == "monospace") {
    mac_family = "Menlo";
  }
  printf("Font: %s, size %g\n", mac_family->utf8(), size);
  mac::cf_ref<CFMutableDictionaryRef> attributes(
      CFDictionaryCreateMutable(kCFAllocatorDefault, 10,
      &kCFTypeDictionaryKeyCallBacks, &kCFTypeDictionaryValueCallBacks));
  mac::cf_ref<CFStringRef> cf_family(mac::cf_str(mac_family));
  CFDictionarySetValue(attributes.get(), kCTFontFamilyNameAttribute,
      cf_family.release());
  mac::cf_ref<CFMutableDictionaryRef> traits(
      CFDictionaryCreateMutable(kCFAllocatorDefault, 1,
      &kCFTypeDictionaryKeyCallBacks, &kCFTypeDictionaryValueCallBacks));
  int trait_mask = 0;
  if (style == ID_italic || style == ID_oblique) {
    trait_mask |= kCTFontItalicTrait;
  }
  if (weight > 400) {
    trait_mask |= kCTFontBoldTrait;
  }
  CFDictionarySetValue(traits.get(), kCTFontSymbolicTrait,
      CFNumberCreate(kCFAllocatorDefault, kCFNumberIntType, &trait_mask));
  CFDictionarySetValue(attributes.get(), kCTFontTraitsAttribute,
      traits.release());
  CFDictionarySetValue(attributes.get(), kCTFontSizeAttribute,
      CFNumberCreate(kCFAllocatorDefault, kCFNumberFloatType, &size));
  mac::cf_ref<CTFontDescriptorRef> descriptor(
      CTFontDescriptorCreateWithAttributes(attributes.get()));
  CTFontRef ctfont =
      CTFontCreateWithFontDescriptor(descriptor.get(), 0.0, nullptr);
  rc_ref<MacPlatformFont> platform_font = new MacPlatformFont(ctfont);
  rc_ref<Font> font = new Font();
  font->platform_font = platform_font;
  font->em_size = size;
  font->ex_size = CTFontGetXHeight(ctfont);
  font->ch_size = font->ex_size;
  font->ascent = CTFontGetAscent(ctfont);
  font->descent = CTFontGetDescent(ctfont);
  UniChar o = 'o';
  CGGlyph glyph;
  if (CTFontGetGlyphsForCharacters(ctfont, &o, &glyph, 1)) {
    double advance = CTFontGetAdvancesForGlyphs(
        ctfont, kCTFontOrientationHorizontal, &glyph, nullptr, 1);
    if (advance > 0) {
      font->ch_size = advance;
    }
  }
  mac::cf_ref<CFStringRef> psname(
      CTFontCopyPostScriptName(ctfont));
  char pscname[128];
  CFStringGetCString(psname.get(), pscname,
      sizeof pscname, kCFStringEncodingUTF8);
  printf("Got font: %s\n", pscname);
  return font;
}

}
}
