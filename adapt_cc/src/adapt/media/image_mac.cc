#include "adapt/media/image_mac.h"

#include <CoreGraphics/CGImage.h>

namespace adapt {
namespace media {

void release_data_callback(void *info, const void *data, size_t size) {
  RefCounted::explicit_release(static_cast<RefCountedBinary*>(info));
}

rc_ref<Media> load(const rc_binary& data, const rc_string& media_type) {
  RefCountedBinary* rep = data.ptr();
  RefCounted::explicit_add_ref(rep);
  mac::cf_ref<CGDataProviderRef> dp(CGDataProviderCreateWithData(rep,
      rep->data(), rep->length(), release_data_callback));
  CGImageRef cgimage = CGImageCreateWithJPEGDataProvider(
      dp.get(), nullptr, true, kCGRenderingIntentDefault);
  if (!cgimage) {
    cgimage = CGImageCreateWithPNGDataProvider(
        dp.get(), nullptr, true, kCGRenderingIntentDefault);
    if (!cgimage) {
      return rc_ref<Media>();
    }
  }
  rc_ref<MediaObject> mac_image = new MacPlatformImage(cgimage);
  return new Media(mac_image, CGImageGetWidth(cgimage),
      CGImageGetHeight(cgimage));
}

}
}
