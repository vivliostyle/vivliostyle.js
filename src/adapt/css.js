/**
 * Copyright 2013 Google, Inc.
 * Copyright 2015 Vivliostyle Inc.
 * @fileoverview CSS Values and utilities to handle them.
 */
goog.provide('adapt.css');

goog.require('adapt.base');
goog.require('adapt.expr');


/**
 * Name table. Note that entries will be added to it at run time, but the table
 * itself stays the same.
 * @type {!Object.<string,adapt.css.Ident>}
 * @const
 */
adapt.css.nameTable = {};

/**
 * @constructor
 */
adapt.css.Visitor = function() {
};

/**
 * @param {Array.<adapt.css.Val>} values
 * @return void
 */
adapt.css.Visitor.prototype.visitValues = function(values) {
    for (var i = 0; i < values.length; i++) {
        values[i].visit(this);
    }
};

/**
 * @param {adapt.css.Val} empty
 * @return {adapt.css.Val}
 */
adapt.css.Visitor.prototype.visitEmpty = function(empty) {
    throw new Error("E_CSS_EMPTY_NOT_ALLOWED");
};

/**
 * @param {adapt.css.Val} slash
 * @return {adapt.css.Val}
 */
adapt.css.Visitor.prototype.visitSlash = function(slash) {
    throw new Error("E_CSS_SLASH_NOT_ALLOWED");
};

/**
 * @param {adapt.css.Str} str
 * @return {adapt.css.Val}
 */
adapt.css.Visitor.prototype.visitStr = function(str) {
    throw new Error("E_CSS_STR_NOT_ALLOWED");
};

/**
 * @param {adapt.css.Ident} ident
 * @return {adapt.css.Val}
 */
adapt.css.Visitor.prototype.visitIdent = function(ident) {
    throw new Error("E_CSS_IDENT_NOT_ALLOWED");
};

/**
 * @param {adapt.css.Numeric} numeric
 * @return {adapt.css.Val}
 */
adapt.css.Visitor.prototype.visitNumeric = function(numeric) {
    throw new Error("E_CSS_NUMERIC_NOT_ALLOWED");
};

/**
 * @param {adapt.css.Num} num
 * @return {adapt.css.Val}
 */
adapt.css.Visitor.prototype.visitNum = function(num) {
    throw new Error("E_CSS_NUM_NOT_ALLOWED");
};

/**
 * @param {adapt.css.Int} num
 * @return {adapt.css.Val}
 */
adapt.css.Visitor.prototype.visitInt = function(num) {
    return this.visitNum(num);
};

/**
 * @param {adapt.css.Color} color
 * @return {adapt.css.Val}
 */
adapt.css.Visitor.prototype.visitColor = function(color) {
    throw new Error("E_CSS_COLOR_NOT_ALLOWED");
};

/**
 * @param {adapt.css.URL} url
 * @return {adapt.css.Val}
 */
adapt.css.Visitor.prototype.visitURL = function(url) {
    throw new Error("E_CSS_URL_NOT_ALLOWED");
};

/**
 * @param {adapt.css.SpaceList} list
 * @return {adapt.css.Val}
 */
adapt.css.Visitor.prototype.visitSpaceList = function(list) {
    throw new Error("E_CSS_LIST_NOT_ALLOWED");
};

/**
 * @param {adapt.css.CommaList} list
 * @return {adapt.css.Val}
 */
adapt.css.Visitor.prototype.visitCommaList = function(list) {
    throw new Error("E_CSS_COMMA_NOT_ALLOWED");
};

/**
 * @param {adapt.css.Func} func
 * @return {adapt.css.Val}
 */
adapt.css.Visitor.prototype.visitFunc = function(func) {
    throw new Error("E_CSS_FUNC_NOT_ALLOWED");
};

/**
 * @param {adapt.css.Expr} expr
 * @return {adapt.css.Val}
 */
adapt.css.Visitor.prototype.visitExpr = function(expr) {
    throw new Error("E_CSS_EXPR_NOT_ALLOWED");
};

/**
 * @constructor
 * @extends {adapt.css.Visitor}
 */
adapt.css.FilterVisitor = function() {
    adapt.css.Visitor.call(this);
};
goog.inherits(adapt.css.FilterVisitor, adapt.css.Visitor);

/**
 * @param {Array.<adapt.css.Val>} values
 * @return {Array.<adapt.css.Val>}
 */
adapt.css.FilterVisitor.prototype.visitValues = function(values) {
    /** @type {Array.<adapt.css.Val>} */ var arr = null;
    for (var i = 0; i < values.length; i++) {
        var before = values[i];
        var after = before.visit(this);
        if (arr) {
            arr[i] = after;
        } else if (before !== after) {
            arr = new Array(values.length);
            for (var k = 0; k < i; k++) {
                arr[k] = values[k];
            }
            arr[i] = after;
        }
    }
    return arr || values;
};

/**
 * @override
 */
adapt.css.FilterVisitor.prototype.visitStr = function(str) {
    return str;
};

/**
 * @override
 */
adapt.css.FilterVisitor.prototype.visitIdent = function(ident) {
    return ident;
};

/**
 * @override
 */
adapt.css.FilterVisitor.prototype.visitSlash = function(slash) {
    return slash;
};

/**
 * @override
 */
adapt.css.FilterVisitor.prototype.visitNumeric = function(numeric) {
    return numeric;
};

/**
 * @override
 */
adapt.css.FilterVisitor.prototype.visitNum = function(num) {
    return num;
};

/**
 * @override
 */
adapt.css.FilterVisitor.prototype.visitInt = function(num) {
    return num;
};

/**
 * @override
 */
adapt.css.FilterVisitor.prototype.visitColor = function(color) {
    return color;
};

/**
 * @override
 */
adapt.css.FilterVisitor.prototype.visitURL = function(url) {
    return url;
};

/**
 * @override
 */
adapt.css.FilterVisitor.prototype.visitSpaceList = function(list) {
    var values = this.visitValues(list.values);
    if (values === list.values)
        return list;
    return new adapt.css.SpaceList(values);
};

/**
 * @override
 */
adapt.css.FilterVisitor.prototype.visitCommaList = function(list) {
    var values = this.visitValues(list.values);
    if (values === list.values)
        return list;
    return new adapt.css.CommaList(values);
};

/**
 * @override
 */
adapt.css.FilterVisitor.prototype.visitFunc = function(func) {
    var values = this.visitValues(func.values);
    if (values === func.values)
        return func;
    return new adapt.css.Func(func.name, values);
};

/**
 * @override
 */
adapt.css.FilterVisitor.prototype.visitExpr = function(expr) {
    return expr;
};


/**
 * @constructor
 */
adapt.css.Val = function() {
};

/**
 * @override
 * @return {string}
 */
adapt.css.Val.prototype.toString = function() {
    var buf = new adapt.base.StringBuffer();
    this.appendTo(buf, true);
    return buf.toString();
};

/**
 * @return {string}
 */
adapt.css.Val.prototype.stringValue = function() {
    var buf = new adapt.base.StringBuffer();
    this.appendTo(buf, false);
    return buf.toString();
};

/**
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.expr.Val} ref
 * @return {adapt.expr.Val}
 */
adapt.css.Val.prototype.toExpr = function(scope, ref) {
    throw new Error("F_ABSTRACT");
};

/**
 * @param {adapt.base.StringBuffer} buf
 * @param {boolean} toString
 * @return {void}
 */
adapt.css.Val.prototype.appendTo = function(buf, toString) {
    buf.append("[error]");
};

/**
 * @param {adapt.css.Visitor} visitor
 * @return {adapt.css.Val}
 */
adapt.css.Val.prototype.visit = goog.abstractMethod;

/**
 * @return {boolean}
 */
adapt.css.Val.prototype.isExpr = function() {
    return false;
};

/**
 * @return {boolean}
 */
adapt.css.Val.prototype.isNumeric = function() {
    return false;
};

/**
 * @return {boolean}
 */
adapt.css.Val.prototype.isNum = function() {
    return false;
};

/**
 * @return {boolean}
 */
adapt.css.Val.prototype.isIdent = function() {
    return false;
};

/**
 * @return {boolean}
 */
adapt.css.Val.prototype.isSpaceList = function() {
    return false;
};


/**
 * @constructor
 * @extends {adapt.css.Val}
 */
adapt.css.Empty = function() {
    adapt.css.Val.call(this);
    if (adapt.css.empty)
        throw new Error("E_INVALID_CALL");
};
goog.inherits(adapt.css.Empty, adapt.css.Val);

/**
 * @override
 */
adapt.css.Empty.prototype.toExpr = function(scope, ref) {
    return new adapt.expr.Const(scope, "");
};

/**
 * @override
 */
adapt.css.Empty.prototype.appendTo = function(buf, toString) {
};

/**
 * @override
 */
adapt.css.Empty.prototype.visit = function(visitor) {
    return visitor.visitEmpty(this);
};


/**
 * @const
 * @type {adapt.css.Empty}
 */
adapt.css.empty = new adapt.css.Empty();


/**
 * @constructor
 * @extends {adapt.css.Val}
 */
adapt.css.Slash = function() {
    adapt.css.Val.call(this);
    if (adapt.css.slash)
        throw new Error("E_INVALID_CALL");
};
goog.inherits(adapt.css.Slash, adapt.css.Val);

/**
 * @override
 */
adapt.css.Slash.prototype.toExpr = function(scope, ref) {
    return new adapt.expr.Const(scope, "/");
};

/**
 * @override
 */
adapt.css.Slash.prototype.appendTo = function(buf, toString) {
    buf.append("/");
};

/**
 * @override
 */
adapt.css.Slash.prototype.visit = function(visitor) {
    return visitor.visitSlash(this);
};



/**
 * @const
 * @type {adapt.css.Slash}
 */
adapt.css.slash = new adapt.css.Slash();



/**
 * @param {string} str
 * @constructor
 * @extends {adapt.css.Val}
 */
adapt.css.Str = function(str) {
    adapt.css.Val.call(this);
    /** @type {string} */ this.str = str;
};
goog.inherits(adapt.css.Str, adapt.css.Val);

/**
 * @override
 */
adapt.css.Str.prototype.toExpr = function(scope, ref) {
    return new adapt.expr.Const(scope, this.str);
};

/**
 * @override
 */
adapt.css.Str.prototype.appendTo = function(buf, toString) {
    if (toString) {
        buf.append('"');
        buf.append(adapt.base.escapeCSSStr(this.str));
        buf.append('"');
    } else {
        buf.append(this.str);
    }
};

/**
 * @override
 */
adapt.css.Str.prototype.visit = function(visitor) {
    return visitor.visitStr(this);
};


/**
 * @param {string} name
 * @constructor
 * @extends {adapt.css.Val}
 */
adapt.css.Ident = function(name) {
    adapt.css.Val.call(this);
    /** @type {string} */this.name = name;
    if (adapt.css.nameTable[name])
        throw new Error("E_INVALID_CALL");
    adapt.css.nameTable[name] = this;
};
goog.inherits(adapt.css.Ident, adapt.css.Val);

/**
 * @override
 */
adapt.css.Ident.prototype.toExpr = function(scope, ref) {
    return new adapt.expr.Const(scope, this.name);
};

/**
 * @override
 */
adapt.css.Ident.prototype.appendTo = function(buf, toString) {
    if (toString) {
        buf.append(adapt.base.escapeCSSIdent(this.name));
    } else {
        buf.append(this.name);
    }
};

/**
 * @override
 */
adapt.css.Ident.prototype.visit = function(visitor) {
    return visitor.visitIdent(this);
};

/**
 * @override
 */
adapt.css.Ident.prototype.isIdent = function() {
    return true;
};


/**
 * @param {string} name
 * @return {!adapt.css.Ident}
 */
adapt.css.getName = function(name) {
    var r = adapt.css.nameTable[name];
    if (!r) {
        r = new adapt.css.Ident(name);
    }
    return r;
};


/**
 * @param {number} num
 * @param {string} unit
 * @constructor
 * @extends {adapt.css.Val}
 */
adapt.css.Numeric = function(num, unit) {
    adapt.css.Val.call(this);
    /** @type {number} */ this.num = num;
    /** @type {string} */ this.unit = unit.toLowerCase(); // units are case-insensitive in CSS
};
goog.inherits(adapt.css.Numeric, adapt.css.Val);

/**
 * @override
 */
adapt.css.Numeric.prototype.toExpr = function(scope, ref) {
    if (this.num == 0)
        return scope.zero;
    if (ref && this.unit == "%") {
        if (this.num == 100)
            return ref;
        return new adapt.expr.Multiply(scope, ref, new adapt.expr.Const(scope, this.num/100));
    }
    return new adapt.expr.Numeric(scope, this.num, this.unit);
};

/**
 * @override
 */
adapt.css.Numeric.prototype.appendTo = function(buf, toString) {
    buf.append(this.num.toString());
    buf.append(this.unit);
};

/**
 * @override
 */
adapt.css.Numeric.prototype.visit = function(visitor) {
    return visitor.visitNumeric(this);
};

/**
 * @override
 */
adapt.css.Numeric.prototype.isNumeric = function() {
    return true;
};


/**
 * @param {number} num
 * @constructor
 * @extends {adapt.css.Val}
 */
adapt.css.Num = function(num) {
    adapt.css.Val.call(this);
    this.num = num;
};
goog.inherits(adapt.css.Num, adapt.css.Val);

/**
 * @override
 */
adapt.css.Num.prototype.toExpr = function(scope) {
    if (this.num == 0)
        return scope.zero;
    if (this.num == 1)
        return scope.one;
    return new adapt.expr.Const(scope, this.num);
};

/**
 * @override
 */
adapt.css.Num.prototype.appendTo = function(buf, toString) {
    buf.append(this.num.toString());
};

/**
 * @override
 */
adapt.css.Num.prototype.visit = function(visitor) {
    return visitor.visitNum(this);
};

/**
 * @override
 */
adapt.css.Num.prototype.isNum = function() {
    return true;
};


/**
 * @param {number} num
 * @constructor
 * @extends {adapt.css.Num}
 */
adapt.css.Int = function(num) {
    adapt.css.Num.call(this, num);
};
goog.inherits(adapt.css.Int, adapt.css.Num);

/**
 * @override
 */
adapt.css.Int.prototype.visit = function(visitor) {
    return visitor.visitInt(this);
};


/**
 * @param {number} rgb
 * @constructor
 * @extends {adapt.css.Val}
 */
adapt.css.Color = function(rgb) {
    adapt.css.Val.call(this);
    /** @type {number} */ this.rgb = rgb;
};
goog.inherits(adapt.css.Color, adapt.css.Val);

/**
 * @override
 */
adapt.css.Color.prototype.appendTo = function(buf, toString) {
    buf.append("#");
    var str = this.rgb.toString(16);
    buf.append("000000".substr(str.length));
    buf.append(str);
};

/**
 * @override
 */
adapt.css.Color.prototype.visit = function(visitor) {
    return visitor.visitColor(this);
};


/**
 * @param {string} url
 * @constructor
 * @extends {adapt.css.Val}
 */
adapt.css.URL = function(url) {
    adapt.css.Val.call(this);
    /** @type {string} */ this.url = url;
};
goog.inherits(adapt.css.URL, adapt.css.Val);


/**
 * @override
 */
adapt.css.URL.prototype.appendTo = function(buf, toString) {
    buf.append("url(\"");
    buf.append(adapt.base.escapeCSSStr(this.url));
    buf.append("\")");
};

/**
 * @override
 */
adapt.css.URL.prototype.visit = function(visitor) {
    return visitor.visitURL(this);
};


/**
 * @param {adapt.base.StringBuffer} buf
 * @param {Array.<adapt.css.Val>} values
 * @param {string} separator
 * @param {boolean} toString
 * @return {void}
 */
adapt.css.appendList = function(buf, values, separator, toString) {
    var length = values.length;
    values[0].appendTo(buf, toString);
    for (var i = 1; i < length; i++) {
        buf.append(separator);
        values[i].appendTo(buf, toString);
    }
};


/**
 * @param {Array.<adapt.css.Val>} values
 * @constructor
 * @extends {adapt.css.Val}
 */
adapt.css.SpaceList = function(values) {
    adapt.css.Val.call(this);
    /** @type {Array.<adapt.css.Val>} */ this.values = values;
};
goog.inherits(adapt.css.SpaceList, adapt.css.Val);

/**
 * @override
 */
adapt.css.SpaceList.prototype.appendTo = function(buf, toString) {
    adapt.css.appendList(buf, this.values, " ", toString);
};

/**
 * @override
 */
adapt.css.SpaceList.prototype.visit = function(visitor) {
    return visitor.visitSpaceList(this);
};

/**
 * @override
 */
adapt.css.SpaceList.prototype.isSpaceList = function() {
    return true;
};


/**
 * @param {Array.<adapt.css.Val>} values
 * @constructor
 * @extends {adapt.css.Val}
 */
adapt.css.CommaList = function(values) {
    adapt.css.Val.call(this);
    /** @type {Array.<adapt.css.Val>} */ this.values = values;
};
goog.inherits(adapt.css.CommaList, adapt.css.Val);

/**
 * @override
 */
adapt.css.CommaList.prototype.appendTo = function(buf, toString) {
    adapt.css.appendList(buf, this.values, ",", toString);
};

/**
 * @override
 */
adapt.css.CommaList.prototype.visit = function(visitor) {
    return visitor.visitCommaList(this);
};


/**
 * @param {string} name
 * @param {Array.<adapt.css.Val>} values
 * @constructor
 * @extends {adapt.css.Val}
 */
adapt.css.Func = function(name, values) {
    adapt.css.Val.call(this);
    /** @type {string} */ this.name = name;
    /** @type {Array.<adapt.css.Val>} */ this.values = values;
};
goog.inherits(adapt.css.Func, adapt.css.Val);

/**
 * @override
 */
adapt.css.Func.prototype.appendTo = function(buf, toString) {
    buf.append(adapt.base.escapeCSSIdent(this.name));
    buf.append("(");
    adapt.css.appendList(buf, this.values, ",", toString);
    buf.append(")");
};

/**
 * @override
 */
adapt.css.Func.prototype.visit = function(visitor) {
    return visitor.visitFunc(this);
};


/**
 * @param {adapt.expr.Val} expr
 * @constructor
 * @extends {adapt.css.Val}
 */
adapt.css.Expr = function(expr) {
    adapt.css.Val.call(this);
    /** @type {adapt.expr.Val} */ this.expr = expr;
};
goog.inherits(adapt.css.Expr, adapt.css.Val);

/**
 * @override
 */
adapt.css.Expr.prototype.toExpr = function() {
    return this.expr;
};

/**
 * @override
 */
adapt.css.Expr.prototype.appendTo = function(buf, toString) {
    buf.append("-epubx-expr(");
    this.expr.appendTo(buf, 0);
    buf.append(")");
};

/**
 * @override
 */
adapt.css.Expr.prototype.visit = function(visitor) {
    return visitor.visitExpr(this);
};

/**
 * @override
 */
adapt.css.Expr.prototype.isExpr = function() {
    return true;
};

/**
 * @param {adapt.css.Val} val
 * @param {adapt.expr.Context} context
 * @return {number}
 */
adapt.css.toNumber = function(val, context) {
    if (val) {
        if (val.isNumeric()) {
            var numeric = /** @type {adapt.css.Numeric} */ (val);
            return context.queryUnitSize(numeric.unit, false) * numeric.num;
        }
        if (val.isNum()) {
            return (/** @type {adapt.css.Num} */ (val)).num;
        }
    }
    return 0;
};

/**
 * Convert numeric value to px
 * @param {!adapt.css.Val} val
 * @param {adapt.expr.Context} context
 * @returns {!adapt.css.Numeric}
 */
adapt.css.convertNumericToPx = function(val, context) {
    return new adapt.css.Numeric(adapt.css.toNumber(val, context), "px");
};


/**
 * @const
 * @type {Object.<string,adapt.css.Ident>}
 */
adapt.css.ident = {
    absolute: adapt.css.getName("absolute"),
    all: adapt.css.getName("all"),
    always: adapt.css.getName("always"),
    auto: adapt.css.getName("auto"),
    avoid: adapt.css.getName("avoid"),
    block: adapt.css.getName("block"),
    block_end: adapt.css.getName("block-end"),
    block_start: adapt.css.getName("block-start"),
    both: adapt.css.getName("both"),
    bottom: adapt.css.getName("bottom"),
    border_box: adapt.css.getName("border-box"),
    crop: adapt.css.getName("crop"),
    cross: adapt.css.getName("cross"),
    exclusive: adapt.css.getName("exclusive"),
    _false: adapt.css.getName("false"),
    fixed: adapt.css.getName("fixed"),
    flex: adapt.css.getName("flex"),
    footnote: adapt.css.getName("footnote"),
    hidden: adapt.css.getName("hidden"),
    horizontal_tb: adapt.css.getName("horizontal-tb"),
    inherit: adapt.css.getName("inherit"),
    inline: adapt.css.getName("inline"),
    inline_block: adapt.css.getName("inline-block"),
    inline_end: adapt.css.getName("inline-end"),
    inline_start: adapt.css.getName("inline-start"),
    landscape: adapt.css.getName("landscape"),
    left: adapt.css.getName("left"),
    list_item: adapt.css.getName("list-item"),
    ltr: adapt.css.getName("ltr"),
    none: adapt.css.getName("none"),
    normal: adapt.css.getName("normal"),
    oeb_page_foot: adapt.css.getName("oeb-page-foot"),
    oeb_page_head: adapt.css.getName("oeb-page-head"),
    page: adapt.css.getName("page"),
    relative: adapt.css.getName("relative"),
    right: adapt.css.getName("right"),
    scale: adapt.css.getName("scale"),
    _static: adapt.css.getName("static"),
    rtl: adapt.css.getName("rtl"),
    table: adapt.css.getName("table"),
    table_caption: adapt.css.getName("table-caption"),
    table_cell: adapt.css.getName("table-cell"),
    table_row: adapt.css.getName("table-row"),
    top: adapt.css.getName("top"),
    transparent: adapt.css.getName("transparent"),
    vertical_lr: adapt.css.getName("vertical-lr"),
    vertical_rl: adapt.css.getName("vertical-rl"),
    visible: adapt.css.getName("visible"),
    _true: adapt.css.getName("true")
};

/**
 * @const
 * @type {adapt.css.Numeric}
 */
adapt.css.hundredPercent = new adapt.css.Numeric(100, "%");

/**
 * @const
 * @type {!adapt.css.Numeric}
 */
adapt.css.fullWidth = new adapt.css.Numeric(100, "vw");

/**
 * @const
 * @type {!adapt.css.Numeric}
 */
adapt.css.fullHeight = new adapt.css.Numeric(100, "vh");

/**
 * @const
 * @type {!adapt.css.Numeric}
 */
adapt.css.numericZero = new adapt.css.Numeric(0, "px");

adapt.css.processingOrder = {
    "font-size": 1,
    "color": 2
};

/**
 * Function to sort property names in the order they should be processed
 * @param {string} name1
 * @param {string} name2
 * @return {number}
 */
adapt.css.processingOrderFn = function(name1, name2) {
    var n1 = adapt.css.processingOrder[name1] || Number.MAX_VALUE;
    var n2 = adapt.css.processingOrder[name2] || Number.MAX_VALUE;
    return n1 - n2;
};

