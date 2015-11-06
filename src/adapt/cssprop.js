/**
 * Copyright 2013 Google, Inc.
 * Copyright 2015 Vivliostyle Inc.
 * @fileoverview Support utilities to extract information from various (parsed) CSS values.
 */
goog.provide('adapt.cssprop');

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
adapt.cssprop.toSet = function(val) {
    if (val) {
        var visitor = new adapt.cssprop.SetVisitor();
        try {
            val.visit(visitor);
            return visitor.propSet;
        } catch (err) {
        	adapt.base.log("toSet: " + err);
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
adapt.cssprop.toInt = function(val, def) {
    if (val) {
        var visitor = new adapt.cssprop.IntVisitor(def);
        try {
            val.visit(visitor);
            return visitor.value;
        } catch (err) {
        	adapt.base.log("toInt: " + err);
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
        /** @type {Array.<number>} */ var numbers = [];
        for (var i = 0; i < this.coords.length; i++) {
            var coord = this.coords[i];
            if (coord.unit == "%") {
                var ref = i % 2 == 0 ? width : height;
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
                    /** @type {Array.<adapt.geom.Point>} */ var points = [];
                    for (var k = 0; k < numbers.length; k += 2) {
                        points.push({ x: x + numbers[k], y: y + numbers[k + 1] });
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
adapt.cssprop.toShape = function(val, x, y, width, height, context) {
    if (val) {
        var visitor = new adapt.cssprop.ShapeVisitor();
        try {
            val.visit(visitor);
            return visitor.getShape(x, y, width, height, context);
        } catch (err) {
        	adapt.base.log("toShape: " + err);
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
adapt.cssprop.toCounters = function(val, reset) {
    var visitor = new adapt.cssprop.CountersVisitor(reset);
    try {
        val.visit(visitor);
    } catch (err) {
    	adapt.base.log("toCounters: " + err);
    }
    return visitor.counters;
};
