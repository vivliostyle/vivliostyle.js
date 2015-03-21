#ifndef adapt_media_media_h
#define adapt_media_media_h

#include "adapt/base/rc_value.h"
#include "adapt/base/rc_binary.h"

namespace adapt {
namespace media {

class MediaObject : public RefCountedObject {
};

struct Media : public RefCountedObject {
  const rc_ref<MediaObject> media_object;
  const double width;
  const double height;

  Media(const rc_ref<MediaObject>& mo, double w, double h)
      : media_object(mo), width(w), height(h) {}

  rc_ref<Media> resize(double width, double height) {
    return new Media(media_object, width, height);
  }
};

rc_ref<Media> load(const rc_binary& data, const rc_string& media_type);


}
}

#endif
