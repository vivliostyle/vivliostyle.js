#ifndef adapt_geom_base_h
#define adapt_geom_base_h

#include <vector>

#include <assert.h>

namespace adapt {
namespace geom {

class Point {
 public:
  Point() : x_(0), y_(0) {}
  Point(float x, float y) : x_(x), y_(y) {}
  Point(const Point& p, float dx, float dy) : x_(p.x_ + dx), y_(p.y_ + dy) {}
  float x() const { return x_; }
  float y() const { return y_; }
 private:
  float x_;
  float y_;
};

class Rectangle {
 public:
  Rectangle() : x1_(0), y1_(0), x2_(-1), y2_(-1) {}

  static Rectangle from_xywh(float x, float y, float dx, float dy) {
    return Rectangle(x, y, x + dx, y + dy);
  }

  static Rectangle from_x1y1x2y2(float x1, float y1, float x2, float y2) {
    return Rectangle(x1, y1, x2, y2);
  }

  bool empty() const { return x1_ > x2_ || y1_ > y2_; }

  float x1() const { return x1_; }
  float y1() const { return y1_; }
  float x2() const { return x2_; }
  float y2() const { return y2_; }
  float dx() const { return x2_ - x1_; }
  float dy() const { return y2_ - y1_; }

  void set_x1(float x1) { x1_ = x1; }
  void set_x2(float x2) { x2_ = x2; }
  void set_dx(float dx) { x2_ = x1_ + dx; }
  void set_y1(float y1) { y1_ = y1; }
  void set_y2(float y2) { y2_ = y2; }
  void set_dy(float dy) { y2_ = y1_ + dy; }

 private:
  Rectangle(float x1, float y1, float x2, float y2)
      : x1_(x1), y1_(y1), x2_(x2), y2_(y2) {}

  float x1_;
  float y1_;
  float x2_;
  float y2_;
};

}
}

#endif
