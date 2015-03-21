#include "adapt/geom/polygon.h"

namespace adapt {
namespace geom {


Polygon::Polygon(const Point* points, size_t size)
    : size_(size), points_(new Point[size]) {
  memcpy(points_.get(), points, size * sizeof(Point));
}

Polygon::Polygon(const std::vector<Point>& points)
    : size_(points.size()), points_(new Point[points.size()]) {
  for (size_t i = 0; i < size_; ++i) {
    points_[i] = points[i];
  }
}

Polygon::Polygon(float x, float y, float dx, float dy)
    : size_(4), points_(new Point[4]) {
  points_[0] = Point(x, y);
  points_[1] = Point(x + dx, y);
  points_[2] = Point(x + dx, y + dy);
  points_[3] = Point(x, y + dy);
}

Polygon::Polygon(const Rectangle& rectangle)
    : size_(4), points_(new Point[4]) {
  points_[0] = Point(rectangle.x1(), rectangle.y1());
  points_[1] = Point(rectangle.x2(), rectangle.y1());
  points_[2] = Point(rectangle.x2(), rectangle.y2());
  points_[3] = Point(rectangle.x1(), rectangle.y2());
}

Polygon::Polygon(const Polygon& polygon)
    : size_(polygon.size_), points_(new Point[polygon.size_]) {
  for (size_t i = 0; i < size_; ++i) {
    points_[i] = polygon.points_[i];
  }
}

Polygon::Polygon(const Polygon& polygon, float dx, float dy)
    : size_(polygon.size_), points_(new Point[polygon.size_]) {
  for (size_t i = 0; i < size_; ++i) {
    points_[i] = Point(polygon.points_[i], dx, dy);
  }
}


Polygon::Polygon(Polygon&& polygon)
    : size_(polygon.size_), points_(std::move(polygon.points_)) {
  assert(!polygon.points_);
  polygon.size_ = 0;
}

const Polygon& Polygon::operator=(const Polygon& polygon) {
  size_ = polygon.size_;
  points_ = std::unique_ptr<Point[]>(new Point[size_]);
  memcpy(points_.get(), polygon.points_.get(), size_ * sizeof(Point));
  return *this;
}

const Polygon& Polygon::operator=(Polygon&& polygon) {
  size_ = polygon.size_;
  points_ = std::move(polygon.points_);
  assert(!polygon.points_);
  polygon.size_ = 0;
  return *this;
}

Polygon::~Polygon() {
}

//-------------------------------------------------------------------------

// low.y <= high.y
struct Segment {
  Point low;
  Point high;
  int winding;  // segment going low->high (1) or high->low (-1)
  int shape_id;

  struct YXCompare {
    bool operator() (const Segment& s1, const Segment& s2) const {
      if (s1.low.y() == s2.low.y()) {
        return s1.low.x() < s2.low.x();
      } else {
        return s1.low.y() < s2.low.y();
      }
    }
  };
};

namespace {

/**
 * Record band/segment intersection data. A band is space delimited by two
 * horizontal lines.
 */
struct BandIntersection {
  double x;
  int winding; // segment going low->high (1) or high->low (-1)
  int xedge;  // intersection lower x edge (-1) or higher x edge (1)
  int shape_id;

  struct XCompare {
    bool operator() (const BandIntersection& b1,
        const BandIntersection& b2) const {
      if (b1.x == b2.x) {
        return b1.xedge < b2.xedge;
      } else {
        return b1.x < b2.x;
      }
    }
  };
};

/**
 * Converts this polygon to a sequence of Segments and adds segments to the
 * given array.
 * @param arr array to add segments.
 * @param id shapeId to write into segments.
 */
void add_segments(const Polygon& shape, int id, std::vector<Segment>* arr) {
  size_t length = shape.size();
  const Point* prev = &shape[length - 1];
  for (size_t i = 0 ; i < length ; ++i) {
    const Point* curr = &shape[i];
    if( prev->y() < curr->y() )
      arr->push_back(Segment {*prev, *curr, 1, id});
    else
      arr->push_back(Segment {*curr, *prev, -1, id});
    prev = curr;
  }
}

/**
 *  Find x coordinate of segment s intersection with horizontal line at y.
 */
double intersect_y(const Segment& s, double y) {
  return s.low.x()
      + (s.high.x() - s.low.x()) * (y - s.low.y()) / (s.high.y() - s.low.y());
}

void add_intersections(const Segment& s, double y1, double y2,
    std::vector<BandIntersection>* intersections) {
  assert(y2 >= y1);
  assert(s.high.y() >= y1);
  double x1;
  int w1;
  double x2;
  int w2;
  if (s.low.y() <= y1) {
    // low is outside of the band
    x1 = intersect_y(s, y1);
    w1 = s.winding;
  } else {
    // low is inside the the band
    x1 = s.low.x();
    w1 = 0;
  }
  if (s.high.y() >= y2) {
    // high is outside of the band
    x2 = intersect_y(s, y2);
    w2 = s.winding;
  } else {
    // high is inside of the band
    x2 = s.high.x();
    w2 = 0;
  }
  if (x1 < x2) {
    intersections->push_back(BandIntersection {x1, w1, -1, s.shape_id});
    intersections->push_back(BandIntersection {x2, w2, 1, s.shape_id});
  } else {
    intersections->push_back(BandIntersection {x2, w2, -1, s.shape_id});
    intersections->push_back(BandIntersection {x1, w1, 1, s.shape_id});
  }
}

void intersections_to_ranges(std::vector<BandIntersection>& intersections,
    size_t include_count, size_t exclude_count, std::vector<double>* ranges) {
  size_t shape_count = include_count + exclude_count;
  std::vector<int> winding(shape_count);
  std::vector<int> xedge(shape_count);
  bool was_inside = false;
  for (const BandIntersection& intersection : intersections) {
    winding[intersection.shape_id] += intersection.winding;
    xedge[intersection.shape_id] += intersection.xedge;
    bool is_inside = false;
    for (size_t i = 0; i < include_count; ++i) {
      // inside inclusion shape and not in the intersection rect of the band
      if (winding[i] && !xedge[i]) {
        is_inside = true;
        break;
      }
    }
    if (is_inside) {
      for (size_t i = include_count ; i < shape_count ; i++) {
        // inside exclusion shape or in the intersection rect of the band
        if (winding[i] || xedge[i]) {
          is_inside = false;
          break;
        }
      }
    }
    if (is_inside != was_inside) {
      ranges->push_back(intersection.x);
      was_inside = is_inside;
    }
  }
}

}

//-------------------------------------------------------------------------

BandedShape::BandedShape(const Polygon& polygon) {
  add_polygon(polygon, include_polygon_count_);
  ++include_polygon_count_;
}

BandedShape::BandedShape(const std::vector<const Polygon*>& polygons) {
  for (const Polygon* polygon : polygons) {
    add_polygon(*polygon, include_polygon_count_);
    ++include_polygon_count_;
  }
}

BandedShape::~BandedShape() {
}

void BandedShape::add_exclusion(const Polygon& exclusion) {
  int shape_id = include_polygon_count_ + exclude_polygon_count_;
  add_polygon(exclusion, shape_id);
  exclude_polygon_count_++;
}

void BandedShape::band_ranges(double y1, double y2, double x1, double x2,
    std::vector<double>* ranges) {
  assert(y2 >= y1);
  sort_segments();
  std::vector<BandIntersection> intersections;
  // TODO: go through segments more intelligently.
  std::vector<Segment>::iterator it = segments_.begin();
  while (it != segments_.end() && it->low.y() <= y2) {
    if (it->low.y() < y2 && it->high.y() > y1) {
      add_intersections(*it, y1, y2, &intersections);
    }
    ++it;
  }
  // add fake exclusion to only allow space between x1 and x2
  int shape_id = include_polygon_count_ + exclude_polygon_count_;
  intersections.push_back(BandIntersection {-1e30, 1, 0, shape_id});
  intersections.push_back(BandIntersection {x1, -1, 0, shape_id});
  intersections.push_back(BandIntersection {x2, 1, 0, shape_id});
  intersections.push_back(BandIntersection {1e30, -1, 0, shape_id});
  std::sort(intersections.begin(), intersections.end(),
      BandIntersection::XCompare());
  intersections_to_ranges(intersections, include_polygon_count_,
      exclude_polygon_count_ + 1, ranges);
}

void BandedShape::sort_segments() {
  if (sorted_segment_count_ < segments_.size()) {
    // TODO: sort only newly added segments, then mergesort them with the
    // already-present ones.
    std::sort(segments_.begin(), segments_.end(), Segment::YXCompare());
    sorted_segment_count_ = segments_.size();
  }
}

void BandedShape::add_polygon(const Polygon& polygon, int shape_id) {
  add_segments(polygon, shape_id, &segments_);
}


}
}



