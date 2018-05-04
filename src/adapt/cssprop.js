/**
 * Copyright 2013 Google, Inc.
 * Copyright 2015 Trim-marks Inc.
 *
 * Vivliostyle.js is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle.js is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle.js.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @fileoverview Support utilities to extract information from various (parsed) CSS values.
 */
goog.provide('adapt.cssprop');

goog.require('vivliostyle.logging');
goog.require('adapt.base');
goog.require('adapt.css');
goog.require('adapt.csstok');
goog.require('adapt.cssparse');
goog.require('adapt.expr');
goog.require('adapt.geom');


//---------------------- value parsers ----------------------------------

/**
 * @constructor
 * @extends {adapt.css.Visitor}
 */
adapt.cssprop.SetVisitor = function() {
    adapt.css.Visitor.call(this);
    /** @type {Object.<string,boolean>} */ this.propSet = {};
};
goog.inherits(adapt.cssprop.SetVisitor, adapt.css.Visitor);

/**
 * @override
 */
adapt.cssprop.SetVisitor.prototype.visitIdent = function(ident) {
    this.propSet[ident.name] = true;
    return ident;
};

/**
 * @override
 */
adapt.cssprop.SetVisitor.prototype.visitSpaceList = function(list) {
    this.visitValues(list.values);
    return list;
};

/**
 * @param {adapt.css.Val} val
 * @return {Object.<string,boolean>}
 */
adapt.cssprop.toSet = val => {
    if (val) {
        const visitor = new adapt.cssprop.SetVisitor();
        try {
            val.visit(visitor);
            return visitor.propSet;
        } catch (err) {
            vivliostyle.logging.logger.warn(err, "toSet:");
        }
    }
    return {};
};


/**
 * @param {number} value
 * @constructor
 * @extends {adapt.css.Visitor}
 */
adapt.cssprop.IntVisitor = function(value) {
    adapt.css.Visitor.call(this);
    /** @type {number} */ this.value = value;
};
goog.inherits(adapt.cssprop.IntVisitor, adapt.css.Visitor);

/**
 * @override
 */
adapt.cssprop.IntVisitor.prototype.visitInt = function(num) {
    this.value = num.num;
    return num;
};


/**
 * @param {adapt.css.Val} val
 * @param {number} def
 * @return {number}
 */
adapt.cssprop.toInt = (val, def) => {
    if (val) {
        const visitor = new adapt.cssprop.IntVisitor(def);
        try {
            val.visit(visitor);
            return visitor.value;
        } catch (err) {
            vivliostyle.logging.logger.warn(err, "toInt: ");
        }
    }
    return def;
};


/**
 * @constructor
 * @extends {adapt.css.Visitor}
 */
adapt.cssprop.ShapeVisitor = function() {
    adapt.css.Visitor.call(this);
    /** @type {boolean} */ this.collect = false;
    /** @type {Array.<adapt.css.Numeric>} */ this.coords = [];
    /** @type {?string} */ this.name = null;
};
goog.inherits(adapt.cssprop.ShapeVisitor, adapt.css.Visitor);

/**
 * @override
 */
adapt.cssprop.ShapeVisitor.prototype.visitNumeric = function(numeric) {
    if (this.collect)
        this.coords.push(numeric);
    return null;
};

/**
 * @override
 */
adapt.cssprop.ShapeVisitor.prototype.visitNum = function(num) {
    if (this.collect && num.num == 0)
        this.coords.push(new adapt.css.Numeric(0, "px"));
    return null;
};

/**
 * @override
 */
adapt.cssprop.ShapeVisitor.prototype.visitSpaceList = function(list) {
    this.visitValues(list.values);
    return null;
};

/**
 * @override
 */
adapt.cssprop.ShapeVisitor.prototype.visitFunc = function(func) {
    if (!this.collect) {
        this.collect = true;
        this.visitValues(func.values);
        this.collect = false;
        this.name = func.name.toLowerCase();
    }
    return null;
};

/**
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {adapt.expr.Context} context
 * @return {adapt.geom.Shape}
 */
adapt.cssprop.ShapeVisitor.prototype.getShape = function(x, y, width, height, context) {
    if (this.coords.length > 0) {
        /** @type {Array.<number>} */ const numbers = [];
        for (let i = 0; i < this.coords.length; i++) {
            const coord = this.coords[i];
            if (coord.unit == "%") {
                let ref = i % 2 == 0 ? width : height;
                if (i == 3 && this.name == "circle")
                    ref = Math.sqrt((width * width + height * height) / 2);
                numbers.push(coord.num * ref / 100);
            } else {
                numbers.push(coord.num * context.queryUnitSize(coord.unit, false));
            }
        }
        switch (this.name) {
            case "polygon":
                if (numbers.length % 2 == 0) {
                    /** @type {Array.<adapt.geom.Point>} */ const points = [];
                    for (let k = 0; k < numbers.length; k += 2) {
                        points.push(new adapt.geom.Point(x + numbers[k], y + numbers[k + 1]));
                    }
                    return new adapt.geom.Shape(points);
                }
                break;
            case "rectangle":
                if (numbers.length == 4) {
                    return adapt.geom.shapeForRect(x + numbers[0], y + numbers[1], x + numbers[0] + numbers[2], y + numbers[1] + numbers[3]);
                }
                break;
            case "ellipse":
                if (numbers.length == 4) {
                    return adapt.geom.shapeForEllipse(x + numbers[0], y + numbers[1], numbers[2], numbers[3]);
                }
                break;
            case "circle":
                if (numbers.length == 3) {
                    return adapt.geom.shapeForEllipse(x + numbers[0], y + numbers[1], numbers[2], numbers[2]);
                }
                break;
        }
    }
    return null;
};


/**
 * @param {adapt.css.Val} val
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {adapt.expr.Context} context
 * @return {adapt.geom.Shape}
 */
adapt.cssprop.toShape = (val, x, y, width, height, context) => {
    if (val) {
        const visitor = new adapt.cssprop.ShapeVisitor();
        try {
            val.visit(visitor);
            return visitor.getShape(x, y, width, height, context);
        } catch (err) {
            vivliostyle.logging.logger.warn(err, "toShape:");
        }
    }
    return adapt.geom.shapeForRect(x, y, x + width, y + height);
};

/**
 * @constructor
 * @param {boolean} reset
 * @extends {adapt.css.Visitor}
 */
adapt.cssprop.CountersVisitor = function(reset) {
    adapt.css.Visitor.call(this);
    /** @const */ this.reset = reset;
    /** @type {Object.<string,number>} */ this.counters = {};
    /** @type {?string} */ this.name = null;
};
goog.inherits(adapt.cssprop.CountersVisitor, adapt.css.Visitor);

/** @override */
adapt.cssprop.CountersVisitor.prototype.visitIdent = function(ident) {
    this.name = ident.toString();
    if (this.reset) {
        this.counters[this.name] = 0;
    } else {
        this.counters[this.name] = (this.counters[this.name] || 0) + 1;
    }
    return ident;
};

/** @override */
adapt.cssprop.CountersVisitor.prototype.visitInt = function(num) {
    if (this.name) {
        this.counters[this.name] += num.num - (this.reset ? 0 : 1);
    }
    return num;
};

/** @override */
adapt.cssprop.CountersVisitor.prototype.visitSpaceList = function(list) {
    this.visitValues(list.values);
    return list;
};

/**
 * @param {adapt.css.Val} val
 * @param {boolean} reset
 * @return {Object.<string,number>}
 */
adapt.cssprop.toCounters = (val, reset) => {
    const visitor = new adapt.cssprop.CountersVisitor(reset);
    try {
        val.visit(visitor);
    } catch (err) {
        vivliostyle.logging.logger.warn(err, "toCounters:");
    }
    return visitor.counters;
};


/**
 * @constructor
 * @extends {adapt.css.FilterVisitor}
 */
adapt.cssprop.UrlTransformVisitor = function(baseUrl, transformer) {
    adapt.css.FilterVisitor.call(this);
    this.baseUrl = baseUrl;
    this.transformer = transformer;
};
goog.inherits(adapt.cssprop.UrlTransformVisitor, adapt.css.FilterVisitor);

/** @override */
adapt.cssprop.UrlTransformVisitor.prototype.visitURL = function(url) {
    return new adapt.css.URL(
        this.transformer.transformURL(url.url, this.baseUrl));
};
