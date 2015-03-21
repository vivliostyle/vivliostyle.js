#ifndef adapt_geom_polygon_h
#define adapt_geom_polygon_h

#include <string.h>

#include <memory>

#include "adapt/geom/base.h"

namespace adapt {
namespace geom {

class Polygon {
public:
  Polygon(const Point* points, size_t size);
  Polygon(const std::vector<Point>& points);
  Polygon(float x, float y, float dx, float dy);
  Polygon(const Rectangle& rectangle);
  Polygon(const Polygon& polygon);
  Polygon(const Polygon& polygon, float dx, float dy);
  Polygon(Polygon&& polygon);
  const Polygon& operator=(const Polygon& polygon);
  const Polygon& operator=(Polygon&& polygon);
  ~Polygon();

  size_t size() const { return size_; }

  const Point& operator[](size_t index) const {
    assert(index < size_);
    return points_[index];
  }

private:
  size_t size_;
  std::unique_ptr<Point[]> points_;
};

struct Segment;

/**
 * A shape produced by a number of inclusion and exclusion Polygons, that
 * can provide a list of "inside" ranges for any "band" (space between two
 * horizontal lines.
 */
class BandedShape {
 public:
  BandedShape(const Polygon& polygon);
  BandedShape(const std::vector<const Polygon*>& polygons);
  ~BandedShape();

  void add_exclusion(const Polygon& exclusion);

  void band_ranges(double y1, double y2, double x1, double x2,
      std::vector<double>* ranges);

 private:
  void sort_segments();
  void add_polygon(const Polygon& polygon, int shape_id);

  std::vector<Segment> segments_;
  size_t sorted_segment_count_ = 0;
  int include_polygon_count_ = 0;
  int exclude_polygon_count_ = 0;
};

}
}

#endif
