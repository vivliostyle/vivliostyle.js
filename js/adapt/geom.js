/**
 * Copyright 2013 Google, Inc.
 * @fileoverview Geometric utilities.
 */
goog.provide('adapt.geom');

/**
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @constructor
 */
adapt.geom.Rect = function(x1, y1, x2, y2) {
	/** @type {number} */ this.x1 = x1;
	/** @type {number} */ this.y1 = y1;
	/** @type {number} */ this.x2 = x2;
	/** @type {number} */ this.y2 = y2;
};

/**
 * @param {number} x
 * @param {number} y
 * @constructor
 */
adapt.geom.Point = function(x, y) {
    /** @type {number} */ this.x = x;
    /** @type {number} */ this.y = y;
};

/**
 * @param {number} left
 * @param {number} top
 * @param {number} right
 * @param {number} bottom
 * @constructor
 */
adapt.geom.Insets = function(left, top, right, bottom) {
	/** @type {number} */ this.left = left;
	/** @type {number} */ this.top = top;
	/** @type {number} */ this.right = right;
	/** @type {number} */ this.bottom = bottom;
};

/**
 * @param {adapt.geom.Point} low
 * @param {adapt.geom.Point} high
 * @param {number} winding
 * @param {number} shapeId
 * @constructor
 */
adapt.geom.Segment = function(low, high, winding, shapeId) {
	/** @type {adapt.geom.Point} */ this.low = low;
	/** @type {adapt.geom.Point} */ this.high = high;
	/** @type {number} */ this.winding = winding;
	/** @type {number} */ this.shapeId = shapeId;
};

/**
 * A single band for exclusion result. Left float is from the left box edge
 * to x1. Right float is from x2 to the right box edge.
 * @param {number} y1
 * @param {number} y2
 * @param {number} x1
 * @param {number} x2
 * @constructor
 */
adapt.geom.Band = function(y1, y2, x1, x2) {
    /** @type {number} */ this.y1 = y1;
    /** @type {number} */ this.y2 = y2;
    /** @type {number} */ this.x1 = x1;
    /** @type {number} */ this.x2 = x2;
    /** Left float. @type {Element} */ this.left = null;
    /** Right float. @type {Element} */ this.right = null;
};

/**
 * @param {adapt.geom.Segment} s1
 * @param {adapt.geom.Segment} s2
 * @return {number}
 */
adapt.geom.segmentCompare = function(s1, s2) {
    return s1.low.y - s2.low.y || s1.low.x - s2.low.x;
};

/**
 * @param {Array.<adapt.geom.Point>} points
 * @constructor
 */
adapt.geom.Shape = function(points) {
    /** @type {Array.<adapt.geom.Point>} */ this.points = points;
};

/**
 * Converts this shape to a sequence of Segments and adds segments to the
 * given array.
 * @param {Array.<adapt.geom.Segment>} arr array to add segments.
 * @param {number} id shapeId to write into segments.
 * @return {void}
 */
adapt.geom.Shape.prototype.addSegments = function(arr, id) {
    var points = this.points;
    var length = points.length;
    var prev = points[length - 1];
    for (var i = 0 ; i < length ; i++) {
        var curr = points[i];
        /** @type {adapt.geom.Segment} */ var s;
        if( prev.y < curr.y )
            s = new adapt.geom.Segment(prev, curr, 1, id);
        else
        	s = new adapt.geom.Segment(curr, prev, -1, id);
        arr.push(s);
        prev = curr;
    }
};

adapt.geom.Shape.prototype.withOffset = function(offsetX, offsetY) {
	var points = [];
	for (var i = 0; i < this.points.length; i++) {
		var p = this.points[i];
		points.push(new adapt.geom.Point(p.x + offsetX, p.y + offsetY));
	}
	return new adapt.geom.Shape(points);
};

/**
 * @param {number} cx
 * @param {number} cy
 * @param {number} rx
 * @param {number} ry
 * @return {adapt.geom.Shape}
 */
adapt.geom.shapeForEllipse = function(cx, cy, rx, ry) {
    var count = 20;
    /** @type {Array.<adapt.geom.Point>} */ var points = [];
    for (var i = 0; i < count; i++) {
        var a = i * 2 * Math.PI / count;
        points.push(new adapt.geom.Point(cx + rx * Math.sin(a),
        		cy + ry * Math.cos(a)));
    }
    return new adapt.geom.Shape(points);
};

/**
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @return {adapt.geom.Shape}
 */
adapt.geom.shapeForRect = function(x1, y1, x2, y2) {
    return new adapt.geom.Shape([new adapt.geom.Point(x1, y1),
        new adapt.geom.Point(x2, y1), new adapt.geom.Point(x2, y2),
        new adapt.geom.Point(x1, y2)]);
};

/**
 * @param {adapt.geom.Rect} r
 * @return {adapt.geom.Shape}
 */
adapt.geom.shapeForRectObj = function(r) {
    return new adapt.geom.Shape([new adapt.geom.Point(r.x1, r.y1),
        new adapt.geom.Point(r.x2, r.y1), new adapt.geom.Point(r.x2, r.y2),
        new adapt.geom.Point(r.x1, r.y2)]);
};

/**
 * @param {number} x
 * @param {number} winding
 * @param {number} shapeId
 * @param {number} lowOrHigh
 * @constructor
 */
adapt.geom.BandIntersection = function(x, winding, shapeId, lowOrHigh) {
	/** @type {number} */ this.x = x;
	/** @type {number} */ this.winding = winding;
	/** @type {number} */ this.shapeId = shapeId;
	/** @type {number} */ this.lowOrHigh = lowOrHigh;
};

/**
 * @param {adapt.geom.Segment} s
 * @param {number} y
 * @return {number}
 */
adapt.geom.intersectY = function(s, y) {
    var x = s.low.x + (s.high.x - s.low.x) * (y - s.low.y) /
        (s.high.y - s.low.y);
    if (isNaN(x))
        throw new Error("Bad intersection");
    return x;
};

/**
 * @param {Array.<adapt.geom.BandIntersection>} intersections
 * @param {adapt.geom.Segment} s
 * @param {number} y1
 * @param {number} y2
 * @return {void}
 */
adapt.geom.addBandIntersections = function(intersections, s, y1, y2) {
    /** @type {number} */ var x1;
    /** @type {number} */ var w1;
    /** @type {number} */ var x2;
    /** @type {number} */ var w2;
    if (s.high.y < y1) {
    	adapt.base.log("Error: inconsistent segment (1)");
    }
    if (s.low.y <= y1) {
        // outside
        x1 = adapt.geom.intersectY(s, y1);
        w1 = s.winding;
    } else {
        x1 = s.low.x;
        w1 = 0;
    }
    if (s.high.y >= y2) {
        // outside
        x2 = adapt.geom.intersectY(s, y2);
        w2 = s.winding;
    } else {
        x2 = s.high.x;
        w2 = 0;
    }
    if (x1 < x2) {
        intersections.push(
            new adapt.geom.BandIntersection(x1, w1, s.shapeId, -1));
        intersections.push(
            new adapt.geom.BandIntersection(x2, w2, s.shapeId, 1));
    } else {
        intersections.push(
                new adapt.geom.BandIntersection(x2, w2, s.shapeId, -1));
        intersections.push(
                new adapt.geom.BandIntersection(x1, w1, s.shapeId, 1));
    }
};

/**
 * @param {Array.<adapt.geom.BandIntersection>} intersections
 * @param {number} includeCount
 * @param {number} excludeCount
 * @return {Array.<number>}
 */
adapt.geom.mergeIntersections = function(intersections, includeCount,
		excludeCount) {
    var shapeCount = includeCount + excludeCount;
    /** @type {Array.<number>} */ var windings1 = Array(shapeCount);
    /** @type {Array.<number>} */ var windings2 = Array(shapeCount);
    for (var i = 0 ; i <= shapeCount ; i++) {
        windings1[i] = 0;
        windings2[i] = 0;
    }
    /** @type {Array.<number>} */ var xranges = [];
    /** @type {boolean} */ var inside = false;
    var intersectionCount = intersections.length;
    for (var k = 0 ; k < intersectionCount ; k++) {
        var intersection = intersections[k];
        windings1[intersection.shapeId] += intersection.winding;
        windings2[intersection.shapeId] += intersection.lowOrHigh;
        var stillInside = false;
        for (i = 0 ; i < includeCount ; i++) {
            if (windings1[i] && !windings2[i]) {
                stillInside = true;
                break;
            }
        }
        if (stillInside) {
            for (i = includeCount ; i <= shapeCount ; i++) {
                if (windings1[i] || windings2[i]) {
                    stillInside = false;
                    break;
                }
            }
        }
        if (inside != stillInside) {
            xranges.push(intersection.x);
            inside = stillInside;
        }
    }
    return xranges;
};

/**
 * Round v up to make it a multiple of unit. If unit is zero, return v.
 * @param {number} v
 * @param {number} unit
 * @return {number}
 */
adapt.geom.ceil = function(v, unit) {
	return unit ? Math.ceil(v/unit)*unit : v;
};

/**
 * Round v down to make it a multiple of unit. If unit is zero, return v.
 * @param {number} v
 * @param {number} unit
 * @return {number}
 */
adapt.geom.floor = function(v, unit) {
	return unit ? Math.floor(v/unit)*unit : v;
};

/**
 * @param {adapt.geom.Point} point
 * @return {adapt.geom.Point}
 */
adapt.geom.rotatePoint = function(point) {
	return new adapt.geom.Point(point.y, -point.x);
};

/**
 * Vertical box to pseudo-horizontal coords.
 * @param {adapt.geom.Rect} box
 * @return {adapt.geom.Rect}
 */
adapt.geom.rotateBox = function(box) {
	return new adapt.geom.Rect(box.y1, -box.x2, box.y2, -box.x1);
};

/**
 * Pseudo-horizontal coords to vertical.
 * @param {adapt.geom.Rect} box
 * @return {adapt.geom.Rect}
 */
adapt.geom.unrotateBox = function(box) {
	return new adapt.geom.Rect(-box.y2, box.x1, -box.y1, box.x2);
};

/**
 * @param {adapt.geom.Shape} shape
 * @return {adapt.geom.Shape}
 */
adapt.geom.rotateShape = function(shape) {
	return new adapt.geom.Shape(adapt.base.map(shape.points, adapt.geom.rotatePoint));
};

/**
 * @param {adapt.geom.Rect} box
 * @param {Array.<adapt.geom.Shape>} include
 * @param {Array.<adapt.geom.Shape>} exclude
 * @param {number} granularity
 * @param {number} snapHeight
 * @param {boolean} vertical
 * @return {Array.<adapt.geom.Band>}
 */
adapt.geom.shapesToBands = function(box, include, exclude,
        granularity, snapHeight, vertical) {
	if (vertical) {
		box = adapt.geom.rotateBox(box);
		include = adapt.base.map(include, adapt.geom.rotateShape);
		exclude = adapt.base.map(exclude, adapt.geom.rotateShape);
	}
    var includeCount = include.length;
    var excludeCount = exclude ? exclude.length : 0;
    /** @type {!Array.<adapt.geom.Band>} */ var result = [];
    /** @type {!Array.<adapt.geom.Segment>} */ var segments = [];
    /** @type {number} */ var i;
    /** @type {number} */ var k;
    /** @type {adapt.geom.Segment} */ var segment;
    for (i = 0 ; i < includeCount ; i++ )
        include[i].addSegments(segments,i);
    for (i = 0 ; i < excludeCount ; i++)
        exclude[i].addSegments(segments, i + includeCount);
    var segmentCount = segments.length;
    segments.sort(adapt.geom.segmentCompare);
    var lowestIncludeIndex = 0;
    while (segments[lowestIncludeIndex].shapeId >= includeCount) {
        lowestIncludeIndex++;
    }
    var y = segments[lowestIncludeIndex].low.y;
    if (y > box.y1) {
        result.push(new adapt.geom.Band(box.y1, y, box.x2, box.x2));
    }
    var segmentIndex = 0;
    /** @type {!Array.<adapt.geom.Segment>} */ var activeSegments = [];
    while (segmentIndex < segmentCount && (segment = segments[segmentIndex]).low.y < y) {
        if( segment.high.y > y )
            activeSegments.push(segment);
        segmentIndex++;
    }
    // process the segments from low to high y values
    while (segmentIndex < segmentCount || activeSegments.length > 0 ) {
        // calculate the height of the band to work with
        var y2 = box.y2;  // band bottom
        // min possible y2
        var y2min = adapt.geom.ceil(Math.ceil(y + granularity), snapHeight);
        for (k = 0 ; k < activeSegments.length && y2 > y2min ; k++) {
            segment = activeSegments[k];
            if (segment.low.x == segment.high.x) {
                // vertical
                if (segment.high.y < y2)
                    y2 = Math.max(adapt.geom.floor(segment.high.y, snapHeight), y2min);
            } else if (segment.low.x != segment.high.x) {  // TODO: should we compare y???
                // slanted (not horizontal)
                y2 = y2min;
            }
        }
        if (y2 > box.y2) {
        	y2 = box.y2;
        }
        // include new segments, decreasing y2 if needed
        while (segmentIndex < segmentCount && (segment = segments[segmentIndex]).low.y < y2) {
            if (segment.high.y < y) {
            	segmentIndex++;
            	continue;
            }
            if (segment.low.y < y2min) {
                if (segment.low.y == segment.high.y && segment.low.y == y) {
                    // Horizontal segment that goes right at y is not active, but consume it anyway
                } else {
                    activeSegments.push(segment);
                    y2 = y2min;
                }
                segmentIndex++;
            } else {
                // Do not consume it, consider bottom edge "outside"
            	var yn = adapt.geom.floor(segment.low.y, snapHeight);
            	if (yn < y2) {
	                y2 = yn;
            	}
	            break;
            }
        }
        // now look at the band with top at y and bottom at y2
        // activeSegments should list all segments that intersect that band

        // find all intersections with the band
        /**
         * @type {!Array.<adapt.geom.BandIntersection>}
         */
        var bandIntersections = [];
        for (k = 0 ; k < activeSegments.length ; k++) {
            adapt.geom.addBandIntersections(bandIntersections,
            		activeSegments[k], y, y2);
        }
        bandIntersections.sort(
        	/**
        	 * @param {adapt.geom.BandIntersection} bi1
        	 * @param {adapt.geom.BandIntersection} bi2
        	 * @return {number}
        	 */
    		function(bi1, bi2) {
    			return bi1.x - bi2.x || bi1.lowOrHigh - bi2.lowOrHigh;
    		});
        var xranges = adapt.geom.mergeIntersections(bandIntersections,
            includeCount, excludeCount);
        if (xranges.length == 0) {
            result.push(new adapt.geom.Band(y, y2, box.x2, box.x2));
        } else {
            // get the widest
            var width = 0;
            var x = box.x1;
            for (k = 0 ; k < xranges.length ; k += 2) {
                var rx = Math.max(box.x1, xranges[k]);
                var rw = Math.min(box.x2, xranges[k + 1]) - rx;
                if (rw > width) {
                    width = rw;
                    x = rx;
                }
            }
            if (width == 0) {
                // no space left
                result.push(new adapt.geom.Band(y, y2, box.x2, box.x2));
            } else {
                result.push(new adapt.geom.Band(y, y2, 
                    Math.max(x, box.x1), Math.min(x + width, box.x2)));
            }
        }
        if (y2 == box.y2)
            break;
        y = y2;
        for (k = activeSegments.length - 1 ; k >= 0 ; k--) {
            if (activeSegments[k].high.y <= y2) {
                activeSegments.splice(k, 1);
            }
        }
    }
    adapt.geom.normalize(box, result, false);
    return result;
};

/**
 * @param {adapt.geom.Rect} box
 * @param {Array.<adapt.geom.Band>} bands
 * @param {boolean} keepNonExcludingAtBottom
 * @return {void}
 */
adapt.geom.normalize = function(box, bands, keepNonExcludingAtBottom) {
    var k = bands.length - 1;
    // Merge bands with the same x1, x2 and remove unneeded bands at the end.
    // Create fictious last band to merge unneeded bands at the end
    var currBand = new adapt.geom.Band(box.y2, box.y2,
        (keepNonExcludingAtBottom ? NaN: box.x1), box.x2);
    while (k >= 0) {
        var prevBand = currBand; // result[k+1]
        currBand = bands[k];
        if (currBand.x1 == prevBand.x1 && currBand.x2 == prevBand.x2) {
            prevBand.y1 = currBand.y1; // merge
            bands.splice(k, 1);
            currBand = prevBand;
        }
        k--;
    }
};

/**
 * Find the index of the bottommost band so that y < band.y2
 * @param {Array.<adapt.geom.Band>} bands
 * @param {number} y
 * @return {number}
 */
adapt.geom.findBand = function(bands, y) {
    var low = 0;
    var high = bands.length;
    while (low < high) {
        var mid = Math.floor((low + high) / 2);
        if (y >= bands[mid].y2)
            low = mid + 1;
        else
            high = mid;
    }
    return low;
};

/**
 * @param {adapt.geom.Rect} box
 * @param {Array.<adapt.geom.Band>} bands
 * @param {adapt.geom.Rect} floatBox
 * @param {string} side either "left" or "right"
 * @return {boolean}
 */
adapt.geom.positionFloat = function(box, bands, floatBox, side) {
    var y = floatBox.y1;
    var floatWidth = floatBox.x2 - floatBox.x1;
    var floatHeight = floatBox.y2 - floatBox.y1;
    var index = adapt.geom.findBand(bands, y);
    while (true) {
        // Check if it fits
        var floatBottom = y + floatHeight;
        if (floatBottom > box.y2)
            return false; // does not fit vertically
        var x1 = box.x1;
        var x2 = box.x2;
        for (var i = index; i < bands.length && bands[i].y1 < floatBottom; i++) {
            var band = bands[i];
            if (band.x1 > x1)
                x1 = band.x1;
            if (band.x2 < x2)
                x2 = band.x2;
        }
        if (x1 + floatWidth <= x2 || index >= bands.length) {
            if (side == "left") {
                floatBox.x1 = x1;
                floatBox.x2 = x1 + floatWidth;
            } else {
                floatBox.x1 = x2 - floatWidth;
                floatBox.x2 = x2;
            }
            floatBox.y2 += (y - floatBox.y1);
            floatBox.y1 = y;
            return true;
        }
        y = bands[index].y2;
        index++;
    }
};

/**
 * @param {adapt.geom.Rect} box
 * @param {Array.<adapt.geom.Band>} bands
 * @param {adapt.geom.Rect} floatBox
 * @param {Array.<adapt.geom.Band>} floatBands
 * @param {string} side
 * @return {void}
 */
adapt.geom.addFloatToBands = function(box, bands, floatBox, floatBands, side) {
    if (!floatBands) {
        floatBands = [new adapt.geom.Band(floatBox.y1, floatBox.y2,
            floatBox.x1, floatBox.x2)];
    }
    while (floatBands.length > 0 && floatBands[0].y2 <= box.y1) {
        floatBands.shift();
    }
    if (floatBands.length == 0)
        return;
    if (floatBands[0].y1 < box.y1)
        floatBands[0].y1 = box.y1;
    /** @type {adapt.geom.Band} */ var band;
    var lastY = bands.length == 0 ? box.y1 : bands[bands.length - 1].y2;
    if (lastY < box.y2) {
        // add the tail band that we typically don't keep, it will be cleared by normalize()
        bands.push(new adapt.geom.Band(lastY, box.y2, box.x1, box.x2));
    }
    var index = adapt.geom.findBand(bands, floatBands[0].y1);
    for (var floatBandIndex = 0; floatBandIndex < floatBands.length; floatBandIndex++) {
        var floatBand = floatBands[floatBandIndex];
        if (index == bands.length) {
            break;
        }
        if (bands[index].y1 < floatBand.y1) {
            // split it
            band = bands[index];
            index++;
            bands.splice(index, 0,
            	new adapt.geom.Band(floatBand.y1, band.y2, band.x1, band.x2));
            band.y2 = floatBand.y1;
        }
        while (index < bands.length) {
            band = bands[index++];
            if (band.y2 > floatBand.y2) {
                // split it
                bands.splice(index, 0, 
                	new adapt.geom.Band(floatBand.y2, band.y2, band.x1, band.x2));
                band.y2 = floatBand.y2;
            }
            if (floatBand.x1 != floatBand.x2) {
                // non-empty floatBand
                if (side == "left") {
                    band.x1 = floatBand.x2;
                } else {
                    band.x2 = floatBand.x1;
                }
            }
            if (band.y2 == floatBand.y2)
                break;
        }
    }
    adapt.geom.normalize(box, bands, false);
};