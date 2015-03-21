#ifndef adapt_media_image_mac_h
#define adapt_media_image_mac_h

#include <CoreGraphics/CoreGraphics.h>

#include "adapt/media/media.h"
#include "adapt/platform/platform_mac.h"

namespace adapt {
namespace media {

struct MacPlatformImage : public MediaObject {
  mac::cf_ref<CGImageRef> image;

  MacPlatformImage(CGImageRef img) : image(img) {}
};

}
}

#endif
