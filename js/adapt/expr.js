/**
 * Copyright 2013 Google, Inc.
 * @fileoverview Adaptive Layout expressions.
 */
goog.provide('adapt.expr');

goog.require('adapt.base');

/**
 * @typedef {{fontFamily:string, lineHeight:number, margin:number, hyphenate:boolean,
 *   	columnWidth:number, horizontal:boolean, nightMode:boolean, renderAllPages:boolean}}
 *  }}
 */
adapt.expr.Preferences;

/**
 * @return {adapt.expr.Preferences}
 */
adapt.expr.defaultPreferences = function() {
	return {fontFamily:"serif", lineHeight:1.25, margin:8, hyphenate:true, columnWidth:25,
				horizontal:false, nightMode:false, renderAllPages:false};
};

/**
 * @param {adapt.expr.Preferences} pref
 * @return {adapt.expr.Preferences}
 */
adapt.expr.clonePreferences = function(pref) {
	return {fontFamily:pref.fontFamily, lineHeight:pref.lineHeight, margin:pref.margin,
		hyphenate:pref.hyphenate, columnWidth:pref.columnWidth, horizontal:pref.horizontal,
		nightMode:pref.nightMode, renderAllPages:pref.renderAllPages};
};

/**
 * @const
 */
adapt.expr.defaultPreferencesInstance = adapt.expr.defaultPreferences();

/**
 * Special marker value that indicates that the expression result is being
 * calculated.
 * @enum {!Object}
 */
adapt.expr.Special = {
	PENDING: {}
};

/**
 * @typedef {string|number|boolean|undefined}
 */
adapt.expr.Result;


/**
 * @typedef {adapt.expr.Special|adapt.expr.Result}
 */
adapt.expr.PendingResult;

/**
 * @param {number} viewW
 * @param {number} viewH
 * @param {number} objW
 * @param {number} objH
 * @return {string}
 */
adapt.expr.letterbox = function(viewW, viewH, objW, objH) {
    var scale = Math.min((viewW - 0) / objW, (viewH - 0) / objH);
    var x = (viewW - objW) / 2;
    var y = (viewH - objH) / 2;
    return "matrix(" + scale + ",0,0," + scale + "," + x + "," + y + ")";
};

/**
 * @param {string} str
 * @return {string} string that can be parsed as CSS string with value str
 */
adapt.expr.cssString = function(str) {
    return '"' + adapt.base.escapeCSSStr(str + "") + '"';
};

/**
 * @param {string} name
 * @return {string} string that can be parsed as CSS name
 */
adapt.expr.cssIdent = function(name) {
    return adapt.base.escapeCSSIdent(name + "");
};

/**
 * @param {?string} objName
 * @param {string} memberName
 * @return {string}
 */
adapt.expr.makeQualifiedName = function(objName, memberName) {
    if (objName) {
        return adapt.base.escapeCSSIdent(objName) + "." + 
        	adapt.base.escapeCSSIdent(memberName);
    }
    return adapt.base.escapeCSSIdent(memberName);
};

/**
 * @type {number}
 */
adapt.expr.nextKeyIndex = 0;


/**
 * Lexical scope of the expression.
 * @param {adapt.expr.LexicalScope} parent
 * @param {function(this:adapt.expr.Context,string,boolean):adapt.expr.Val=} resolver
 * @constructor
 */
adapt.expr.LexicalScope = function(parent, resolver) {
	this.parent = parent;
    /** @type {string} */ this.scopeKey = "S" + (adapt.expr.nextKeyIndex++);
    /** @type {Array.<adapt.expr.LexicalScope>} */ this.children = [];
    /** @type {adapt.expr.Const} */ this.zero = new adapt.expr.Const(this, 0);
    /** @type {adapt.expr.Const} */ this.one = new adapt.expr.Const(this, 1);
    /** @type {adapt.expr.Const} */ this._true = new adapt.expr.Const(this, true);
    /** @type {adapt.expr.Const} */ this._false = new adapt.expr.Const(this, false);
    /** @type {adapt.expr.Numeric} */ this.viewportWidth =
    	new adapt.expr.Numeric(this, 100, "vw");
    /** @type {adapt.expr.Numeric} */ this.viewportHeight =
    	new adapt.expr.Numeric(this, 100, "vh");
    if (parent)
        parent.children.push(this);
    /** @type {Object.<string,adapt.expr.Val>} */ this.values = {};
    /** @type {Object.<string,adapt.expr.Val>} */ this.funcs = {};
    /** @type {Object.<string,function(this:adapt.expr.Context,...adapt.expr.Result):adapt.expr.Result>} */
    this.builtIns = {};
    /** @const */ this.resolver = resolver;
    if (!parent) {
    	// root scope
        var builtIns = this.builtIns;
        builtIns["floor"] = Math.floor;
        builtIns["ceil"] = Math.ceil;
        builtIns["round"] = Math.round;
        builtIns["sqrt"] = Math.sqrt;
        builtIns["min"] = Math.min;
        builtIns["max"] = Math.max;
        builtIns["letterbox"] = adapt.expr.letterbox;
        builtIns["css-string"] = adapt.expr.cssString;
        builtIns["css-name"] = adapt.expr.cssIdent;
        builtIns["typeof"] = function(x) { return typeof(x); };
        this.defineBuiltInName("page-width", function() { return this.pageWidth; });
        this.defineBuiltInName("page-height", function() { return this.pageHeight; });
        this.defineBuiltInName("pref-font-family", function() { return this.pref.fontFamily; });
        this.defineBuiltInName("pref-night-mode", function() { return this.pref.nightMode; });
        this.defineBuiltInName("pref-hyphenate", function() { return this.pref.hyphenate; });
        this.defineBuiltInName("pref-margin", function() { return this.pref.margin; });
        this.defineBuiltInName("pref-line-height", function() { return this.pref.lineHeight; });
        this.defineBuiltInName("pref-column-width", function() { return this.pref.columnWidth * this.fontSize; });
        this.defineBuiltInName("pref-horizontal", function() {
        	return this.pref.horizontal;
        });
    }
};

/**
 * @param {string} name
 * @param {function(this:adapt.expr.Context):adapt.expr.Result} fn
 */
adapt.expr.LexicalScope.prototype.defineBuiltInName = function(name, fn) {
	this.values[name] = new adapt.expr.Native(this, fn, name);
};

/**
 * @param {string} qualifiedName
 * @param {adapt.expr.Val} val
 * @return {void}
 */
adapt.expr.LexicalScope.prototype.defineName = function(qualifiedName, val) {
    this.values[qualifiedName] = val;
};

/**
 * @param {string} qualifiedName
 * @param {adapt.expr.Val} val
 * @return {void}
 */
adapt.expr.LexicalScope.prototype.defineFunc = function(qualifiedName, val) {
    this.funcs[qualifiedName] = val;
};

/**
 * @param {string} qualifiedName
 * @param {function(this:adapt.expr.Context,...adapt.expr.Result):adapt.expr.Result} fn
 * @return {void}
 */
adapt.expr.LexicalScope.prototype.defineBuiltIn = function(qualifiedName, fn) {
    this.builtIns[qualifiedName] = fn;
};


/**
 * @const
 * @type {!Object.<string,number>}
 */
adapt.expr.defaultUnitSizes = {
    "px": 1,
    "in": 96,
    "pt": 4/3,
    "cm": 96/2.54,
    "mm":  96/25.4,
    "em": 16,
    "rem": 16,
    "ex": 8,
    "rex": 8
};

/**
 * @typedef {Object.<string,adapt.expr.Result>}
 */
adapt.expr.ScopeContext;

/**
 * Run-time instance of a scope and its children.
 * @param {adapt.expr.LexicalScope} rootScope
 * @param {number} pageWidth
 * @param {number} pageHeight
 * @param {number} fontSize
 * @constructor
 */
adapt.expr.Context = function(rootScope, pageWidth, pageHeight, fontSize) {
	/** @const */ this.rootScope = rootScope;
	/** @const */ this.pageWidth = pageWidth;
	/** @const */ this.pageHeight = pageHeight;
	/** @const */ this.fontSize = fontSize;
	this.pref = adapt.expr.defaultPreferencesInstance;
	/** @type {Object.<string,adapt.expr.ScopeContext>} */ this.scopes = {};
};

/**
 * @private
 * @param {adapt.expr.LexicalScope} scope
 * @return {!adapt.expr.ScopeContext}
 */
adapt.expr.Context.prototype.getScopeContext = function(scope) {
    var s = this.scopes[scope.scopeKey];
    if (!s) {
        s = {};
        this.scopes[scope.scopeKey] = s;
    }
    return s;
};

/**
 * @param {adapt.expr.LexicalScope} scope
 * @return {void}
 */
adapt.expr.Context.prototype.clearScope = function(scope) {
    this.scopes[scope.scopeKey] = {};
    for (var k = 0; k < scope.children.length; k++) {
        this.clearScope(scope.children[k]);
    }
};

/**
 * @param {string} unit
 * @return {number}
 */
adapt.expr.Context.prototype.queryUnitSize = function(unit) {
    if (unit == "vw")
        return this.pageWidth / 100;
    if (unit == "vh")
        return this.pageHeight / 100;
    if (unit == "em" || unit == "rem")
        return this.fontSize;
    if (unit == "ex" || unit == "rex")
        return adapt.expr.defaultUnitSizes["ex"] * this.fontSize / adapt.expr.defaultUnitSizes["em"];
    return adapt.expr.defaultUnitSizes[unit];
};

//---------- name resolution --------------

/**
 * @param {adapt.expr.LexicalScope} scope
 * @param {string} qualifiedName
 * @return {adapt.expr.Val}
 */
adapt.expr.Context.prototype.evalName = function(scope, qualifiedName) {
    do {
        var val = scope.values[qualifiedName];
        if (val)
            return val;
        if (scope.resolver) {
        	val = scope.resolver.call(this, qualifiedName, false);
        	if (val)
        		return val;
        }
        scope = scope.parent;
    } while (scope);
    throw new Error("Name '" + qualifiedName + "' is undefined");
};

/**
 * @param {adapt.expr.LexicalScope} scope
 * @param {string} qualifiedName
 * @param {Array.<adapt.expr.Val>} params
 * @param {boolean} noBuiltInEval don't evaluate built-ins (for dependency calculations)
 * @return {adapt.expr.Val}
 */
adapt.expr.Context.prototype.evalCall = function(scope, qualifiedName, params, noBuiltInEval) {
    do {
        var body = scope.funcs[qualifiedName];
        if (body)
            return body; // will be expanded by callee
        if (scope.resolver) {
        	body = scope.resolver.call(this, qualifiedName, true);
        	if (body)
        		return body;
        }        
        var fn = scope.builtIns[qualifiedName];
        if (fn) {
        	if (noBuiltInEval)
        		return scope.zero;
            var args = Array(params.length);
            for (var i = 0; i < params.length; i++) {
                args[i] = params[i].evaluate(this);
            }
            return new adapt.expr.Const(scope, fn.apply(this, args));
        }
        scope = scope.parent;
    } while (scope);
    throw new Error("Function '" + qualifiedName + "' is undefined");
};

/**
 * @param {string} feature
 * @param {adapt.expr.Val} value
 * @return {boolean}
 */
adapt.expr.Context.prototype.evalMediaTest = function(feature, value) {
    var prefix = "";
    var r = feature.match(/^(min|max)-(.*)$/);
    if (r) {
        prefix = r[1];
        feature = r[2];
    }
    var req = null;
    var actual = null;
    switch (feature) {
        case "width":
        case "height":
        case "device-width":
        case "device-height":
        case "color":
            if (value)
                req = value.evaluate(this);
            break;
    }
    switch (feature) {
        case "width":
            actual = this.pageWidth;
            break;
        case "height":
            actual = this.pageHeight;
            break;
        case "device-width":
            actual = window.screen.availWidth;
            break;
        case "device-height":
            actual = window.screen.availHeight;
            break;
        case "color":
            actual = window.screen.pixelDepth;
            break;
    }
    if (actual != null && req != null) {
        switch (prefix) {
            case "min" :
                return actual >= req;
            case "max" :
                return actual <= req;
            default:
                return actual == req;
        }
    }
    return false;
};

/**
 * @param {adapt.expr.LexicalScope} scope
 * @param {string} key
 * @return {adapt.expr.Result|undefined}
 */
adapt.expr.Context.prototype.queryVal = function(scope, key) {
    var s = this.scopes[scope.scopeKey];
    return s ? s[key] : undefined;
};

/**
 * @param {adapt.expr.LexicalScope} scope
 * @param {string} key
 * @param {adapt.expr.Result} val
 * @return {void}
 */
adapt.expr.Context.prototype.storeVal = function(scope, key, val) {
    this.getScopeContext(scope)[key] = val;
};


/**
 * @typedef {Object.<string,boolean|adapt.expr.Special>}
 */
adapt.expr.DependencyCache;


/**
 * @param {adapt.expr.LexicalScope} scope
 * @constructor
 */
adapt.expr.Val = function(scope) {
	this.scope = scope;
    this.key = "_" + adapt.expr.nextKeyIndex++;
};

/**
 * @return {string}
 * @override
 */
adapt.expr.Val.prototype.toString = function() {
    var buf = new adapt.base.StringBuffer();
    this.appendTo(buf, 0);
    return buf.toString();
};

/**
 * @param {adapt.base.StringBuffer} buf
 * @param {number} priority
 * @return {void}
 */
adapt.expr.Val.prototype.appendTo = function(buf, priority) {
    throw new Error("F_ABSTRACT");
};

/**
 * @protected
 * @param {adapt.expr.Context} context
 * @return {adapt.expr.Result}
 */
adapt.expr.Val.prototype.evaluateCore = function(context) {
    throw new Error("F_ABSTRACT");
};

/**
 * @param {adapt.expr.Context} context
 * @param {Array.<adapt.expr.Val>} params
 * @return {adapt.expr.Val}
 */
adapt.expr.Val.prototype.expand = function(context, params) {
    return this;
};

/**
 * @protected
 * @param {adapt.expr.Val} other
 * @param {adapt.expr.Context} context
 * @param {adapt.expr.DependencyCache} dependencyCache
 * @return {boolean}
 */
adapt.expr.Val.prototype.dependCore = function(other, context, dependencyCache) {
    return other === this;
};

/**
 * @protected
 * @param {adapt.expr.Val} other
 * @param {adapt.expr.Context} context
 * @param {adapt.expr.DependencyCache} dependencyCache
 * @return {boolean}
 */
adapt.expr.Val.prototype.dependOuter = function(other, context, dependencyCache) {
    var cached = dependencyCache[this.key];
    if (cached != null) {
        if (cached === adapt.expr.Special.PENDING)
            return false;
        return /** @type {boolean} */ (cached);
    } else {
        dependencyCache[this.key] = adapt.expr.Special.PENDING;
        var result = this.dependCore(other, context, dependencyCache);
        dependencyCache[this.key] = result;
        return result;
    }
};

/**
 * @param {adapt.expr.Val} other
 * @param {adapt.expr.Context} context
 * @return {boolean}
 */
adapt.expr.Val.prototype.depend = function(other, context) {
    return this.dependOuter(other, context, {});
};

/**
 * @param {adapt.expr.Context} context
 * @return {adapt.expr.Result}
 */
adapt.expr.Val.prototype.evaluate = function(context) {
    var result = context.queryVal(this.scope, this.key);
    if (typeof result != "undefined")
        return result;
    result = this.evaluateCore(context);
    context.storeVal(this.scope, this.key, result);
    return result;
};

/**
 * @return {boolean}
 */
adapt.expr.Val.prototype.isMediaName = function() {
    return false;
};


/**
 * @constructor
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.expr.Val} val
 * @extends {adapt.expr.Val}
 */
adapt.expr.Prefix = function(scope, val) {
	adapt.expr.Val.call(this, scope);
	/** @type {adapt.expr.Val} */ this.val = val;
};
goog.inherits(adapt.expr.Prefix, adapt.expr.Val);

/**
 * @protected
 * @return {string}
 */
adapt.expr.Prefix.prototype.getOp = function() {
    throw new Error("F_ABSTRACT");        
};

/**
 * @param {adapt.expr.Result} val
 * @return {adapt.expr.Result}
 */
adapt.expr.Prefix.prototype.evalPrefix = function(val) {
	throw new Error("F_ABSTRACT");        
};

/**
 * @override
 */
adapt.expr.Prefix.prototype.evaluateCore = function(context) {
    var val = this.val.evaluate(context);
    return this.evalPrefix(val);
};

/**
 * @override
 */
adapt.expr.Prefix.prototype.dependCore = function(other, context, dependencyCache) {
    return other === this || this.val.dependOuter(other, context, dependencyCache);
};

/**
 * @override
 */
adapt.expr.Prefix.prototype.appendTo = function(buf, priority) {
    if (10 < priority)
        buf.append("(");
    buf.append(this.getOp());
    this.val.appendTo(buf, 10);
    if (10 < priority)
        buf.append(")");
};

/**
 * @override
 */
adapt.expr.Prefix.prototype.expand = function(context, params) {
    var val = this.val.expand(context, params);
    if( val === this.val )
        return this;
    var r = new this.constructor(this.scope, val);
    return r;
};


/**
 * @constructor
 * @extends {adapt.expr.Val}
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.expr.Val} lhs
 * @param {adapt.expr.Val} rhs
 */
adapt.expr.Infix = function(scope, lhs, rhs) {
    adapt.expr.Val.call(this, scope);
    /** @type {adapt.expr.Val} */ this.lhs = lhs;
    /** @type {adapt.expr.Val} */ this.rhs = rhs;
};
goog.inherits(adapt.expr.Infix, adapt.expr.Val);

/**
 * @return {number}
 */
adapt.expr.Infix.prototype.getPriority = function() {
    throw new Error("F_ABSTRACT");
};

/**
 * @return {string}
 */
adapt.expr.Infix.prototype.getOp = function() {
    throw new Error("F_ABSTRACT");        
};

/**
 * @param {adapt.expr.Result} lhs
 * @param {adapt.expr.Result} rhs
 * @return {adapt.expr.Result}
 */
adapt.expr.Infix.prototype.evalInfix = function(lhs, rhs) {
    throw new Error("F_ABSTRACT");        
};

/**
 * @override
 */
adapt.expr.Infix.prototype.evaluateCore = function(context) {
    var lhs = this.lhs.evaluate(context);
    var rhs = this.rhs.evaluate(context);
    return this.evalInfix(lhs, rhs);
};

/**
 * @override
 */
adapt.expr.Infix.prototype.dependCore = function(other, context, dependencyCache) {
    return other === this || this.lhs.dependOuter(other, context, dependencyCache) ||
         this.rhs.dependOuter(other, context, dependencyCache);
};

/**
 * @override
 */
adapt.expr.Infix.prototype.appendTo = function(buf, priority) {
    var thisPriority = this.getPriority();
    if (thisPriority <= priority)
        buf.append("(");
    this.lhs.appendTo(buf, thisPriority);
    buf.append(this.getOp());
    this.rhs.appendTo(buf, thisPriority);
    if (thisPriority <= priority)
        buf.append(")");
};

/**
 * @override
 */
adapt.expr.Infix.prototype.expand = function(context, params) {
    var lhs = this.lhs.expand(context, params);
    var rhs = this.rhs.expand(context, params);
    if( lhs === this.lhs && rhs === this.rhs )
        return this;
    var r = new this.constructor(this.scope, lhs, rhs);
    return r;
};


/**
 * @constructor
 * @extends {adapt.expr.Infix}
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.expr.Val} lhs
 * @param {adapt.expr.Val} rhs
 */
adapt.expr.Logical = function(scope, lhs, rhs) {
	adapt.expr.Infix.call(this, scope, lhs, rhs);
};
goog.inherits(adapt.expr.Logical, adapt.expr.Infix);

/**
 * @override
 */
adapt.expr.Logical.prototype.getPriority = function() {
    return 1;
};


/**
 * @constructor
 * @extends {adapt.expr.Infix}
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.expr.Val} lhs
 * @param {adapt.expr.Val} rhs
 */
adapt.expr.Comparison = function(scope, lhs, rhs) {
	adapt.expr.Infix.call(this, scope, lhs, rhs);
};
goog.inherits(adapt.expr.Comparison, adapt.expr.Infix);

/**
 * @override
 */
adapt.expr.Comparison.prototype.getPriority = function() {
    return 2;
};


/**
 * @constructor
 * @extends {adapt.expr.Infix}
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.expr.Val} lhs
 * @param {adapt.expr.Val} rhs
 */
adapt.expr.Additive = function(scope, lhs, rhs) {
	adapt.expr.Infix.call(this, scope, lhs, rhs);
};
goog.inherits(adapt.expr.Additive, adapt.expr.Infix);

/**
 * @override
 */
adapt.expr.Additive.prototype.getPriority = function() {
    return 3;
};


/**
 * @constructor
 * @extends {adapt.expr.Infix}
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.expr.Val} lhs
 * @param {adapt.expr.Val} rhs
 */
adapt.expr.Multiplicative = function(scope, lhs, rhs) {
	adapt.expr.Infix.call(this, scope, lhs, rhs);
};
goog.inherits(adapt.expr.Multiplicative, adapt.expr.Infix);

/**
 * @override
 */
adapt.expr.Multiplicative.prototype.getPriority = function() {
    return 4;
};


/**
 * @constructor
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.expr.Val} val
 * @extends {adapt.expr.Prefix}
 */
adapt.expr.Not = function(scope, val) {
	adapt.expr.Prefix.call(this, scope, val);
};
goog.inherits(adapt.expr.Not, adapt.expr.Prefix);

/**
 * @override
 */
adapt.expr.Not.prototype.getOp = function() {
    return "!";
};

/**
 * @override
 */
adapt.expr.Not.prototype.evalPrefix = function(val) {
    return !val;
};


/**
 * @constructor
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.expr.Val} val
 * @extends {adapt.expr.Prefix}
 */
adapt.expr.Negate = function(scope, val) {
	adapt.expr.Prefix.call(this, scope, val);
};
goog.inherits(adapt.expr.Negate, adapt.expr.Prefix);

/**
 * @override
 */
adapt.expr.Negate.prototype.getOp = function() {
    return "-";
};

/**
 * @override
 */
adapt.expr.Negate.prototype.evalPrefix = function(val) {
    return -val;
};


/**
 * @constructor
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.expr.Val} lhs
 * @param {adapt.expr.Val} rhs
 * @extends {adapt.expr.Logical}
 */
adapt.expr.And = function(scope, lhs, rhs) {
	adapt.expr.Logical.call(this, scope, lhs, rhs);
};
goog.inherits(adapt.expr.And, adapt.expr.Logical);

/**
 * @override
 */
adapt.expr.And.prototype.getOp = function() {
    return "&&";
};

/**
 * @override
 */
adapt.expr.And.prototype.evaluateCore = function(context) {
    return this.lhs.evaluate(context) && this.rhs.evaluate(context);
};
    

/**
 * @constructor
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.expr.Val} lhs
 * @param {adapt.expr.Val} rhs
 * @extends {adapt.expr.And}
 */
adapt.expr.AndMedia = function(scope, lhs, rhs) {
	adapt.expr.And.call(this, scope, lhs, rhs);
};
goog.inherits(adapt.expr.AndMedia, adapt.expr.And);

/**
 * @override
 */
adapt.expr.AndMedia.prototype.getOp = function() {
    return " and ";
};


/**
 * @constructor
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.expr.Val} lhs
 * @param {adapt.expr.Val} rhs
 * @extends {adapt.expr.Logical}
 */
adapt.expr.Or = function(scope, lhs, rhs) {
	adapt.expr.Logical.call(this, scope, lhs, rhs);
};
goog.inherits(adapt.expr.Or, adapt.expr.Logical);

/**
 * @override
 */
adapt.expr.Or.prototype.getOp = function() {
    return "||";
};

/**
 * @override
 */
adapt.expr.Or.prototype.evaluateCore = function(context) {
    return this.lhs.evaluate(context) || this.rhs.evaluate(context);
};


/**
 * @constructor
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.expr.Val} lhs
 * @param {adapt.expr.Val} rhs
 * @extends {adapt.expr.Or}
 */
adapt.expr.OrMedia = function(scope, lhs, rhs) {
	adapt.expr.Or.call(this, scope, lhs, rhs);
};
goog.inherits(adapt.expr.OrMedia, adapt.expr.Or);

/**
 * @override
 */
adapt.expr.OrMedia.prototype.getOp = function() {
    return ", ";
};


/**
 * @constructor
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.expr.Val} lhs
 * @param {adapt.expr.Val} rhs
 * @extends {adapt.expr.Comparison}
 */
adapt.expr.Lt = function(scope, lhs, rhs) {
	adapt.expr.Comparison.call(this, scope, lhs, rhs);
};
goog.inherits(adapt.expr.Lt, adapt.expr.Comparison);

/**
 * @override
 */
adapt.expr.Lt.prototype.getOp = function() {
    return "<";
};

/**
 * @override
 */
adapt.expr.Lt.prototype.evalInfix = function(lhs, rhs) {
    return lhs < rhs;
};


/**
 * @constructor
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.expr.Val} lhs
 * @param {adapt.expr.Val} rhs
 * @extends {adapt.expr.Comparison}
 */
adapt.expr.Le = function(scope, lhs, rhs) {
	adapt.expr.Comparison.call(this, scope, lhs, rhs);
};
goog.inherits(adapt.expr.Le, adapt.expr.Comparison);

/**
 * @override
 */
adapt.expr.Le.prototype.getOp = function() {
    return "<=";
};

/**
 * @override
 */
adapt.expr.Le.prototype.evalInfix = function(lhs, rhs) {
    return lhs <= rhs;
};


/**
 * @constructor
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.expr.Val} lhs
 * @param {adapt.expr.Val} rhs
 * @extends {adapt.expr.Comparison}
 */
adapt.expr.Gt = function(scope, lhs, rhs) {
	adapt.expr.Comparison.call(this, scope, lhs, rhs);
};
goog.inherits(adapt.expr.Gt, adapt.expr.Comparison);

/**
 * @override
 */
adapt.expr.Gt.prototype.getOp = function() {
    return ">";
};

/**
 * @override
 */
adapt.expr.Gt.prototype.evalInfix = function(lhs, rhs) {
    return lhs > rhs;
};


/**
 * @constructor
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.expr.Val} lhs
 * @param {adapt.expr.Val} rhs
 * @extends {adapt.expr.Comparison}
 */
adapt.expr.Ge = function(scope, lhs, rhs) {
	adapt.expr.Comparison.call(this, scope, lhs, rhs);
};
goog.inherits(adapt.expr.Ge, adapt.expr.Comparison);

/**
 * @override
 */
adapt.expr.Ge.prototype.getOp = function() {
    return ">=";
};

/**
 * @override
 */
adapt.expr.Ge.prototype.evalInfix = function(lhs, rhs) {
    return lhs >= rhs;
};


/**
 * @constructor
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.expr.Val} lhs
 * @param {adapt.expr.Val} rhs
 * @extends {adapt.expr.Comparison}
 */
adapt.expr.Eq = function(scope, lhs, rhs) {
	adapt.expr.Comparison.call(this, scope, lhs, rhs);
};
goog.inherits(adapt.expr.Eq, adapt.expr.Comparison);

/**
 * @override
 */
adapt.expr.Eq.prototype.getOp = function() {
    return "==";
};

/**
 * @override
 */
adapt.expr.Eq.prototype.evalInfix = function(lhs, rhs) {
    return lhs == rhs;
};


/**
 * @constructor
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.expr.Val} lhs
 * @param {adapt.expr.Val} rhs
 * @extends {adapt.expr.Comparison}
 */
adapt.expr.Ne = function(scope, lhs, rhs) {
	adapt.expr.Comparison.call(this, scope, lhs, rhs);
};
goog.inherits(adapt.expr.Ne, adapt.expr.Comparison);

/**
 * @override
 */
adapt.expr.Ne.prototype.getOp = function() {
    return "!=";
};

/**
 * @override
 */
adapt.expr.Ne.prototype.evalInfix = function(lhs, rhs) {
    return lhs != rhs;
};


/**
 * @constructor
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.expr.Val} lhs
 * @param {adapt.expr.Val} rhs
 * @extends {adapt.expr.Additive}
 */
adapt.expr.Add = function(scope, lhs, rhs) {
	adapt.expr.Additive.call(this, scope, lhs, rhs);
};
goog.inherits(adapt.expr.Add, adapt.expr.Additive);

/**
 * @override
 */
adapt.expr.Add.prototype.getOp = function() {
    return "+";
};

/**
 * @override
 */
adapt.expr.Add.prototype.evalInfix = function(lhs, rhs) {
    return lhs + rhs;
};


/**
 * @constructor
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.expr.Val} lhs
 * @param {adapt.expr.Val} rhs
 * @extends {adapt.expr.Additive}
 */
adapt.expr.Subtract = function(scope, lhs, rhs) {
	adapt.expr.Additive.call(this, scope, lhs, rhs);
};
goog.inherits(adapt.expr.Subtract, adapt.expr.Additive);

/**
 * @override
 */
adapt.expr.Subtract.prototype.getOp = function() {
    return " - ";
};

/**
 * @override
 */
adapt.expr.Subtract.prototype.evalInfix = function(lhs, rhs) {
    return lhs - rhs;
};


/**
 * @constructor
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.expr.Val} lhs
 * @param {adapt.expr.Val} rhs
 * @extends {adapt.expr.Multiplicative}
 */
adapt.expr.Multiply = function(scope, lhs, rhs) {
	adapt.expr.Multiplicative.call(this, scope, lhs, rhs);
};
goog.inherits(adapt.expr.Multiply, adapt.expr.Multiplicative);

/**
 * @override
 */
adapt.expr.Multiply.prototype.getOp = function() {
    return "*";
};

/**
 * @override
 */
adapt.expr.Multiply.prototype.evalInfix = function(lhs, rhs) {
    return lhs * rhs;
};


/**
 * @constructor
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.expr.Val} lhs
 * @param {adapt.expr.Val} rhs
 * @extends {adapt.expr.Multiplicative}
 */
adapt.expr.Divide = function(scope, lhs, rhs) {
	adapt.expr.Multiplicative.call(this, scope, lhs, rhs);
};
goog.inherits(adapt.expr.Divide, adapt.expr.Multiplicative);

/**
 * @override
 */
adapt.expr.Divide.prototype.getOp = function() {
    return "/";
};

/**
 * @override
 */
adapt.expr.Divide.prototype.evalInfix = function(lhs, rhs) {
    return lhs / rhs;
};


/**
 * @constructor
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.expr.Val} lhs
 * @param {adapt.expr.Val} rhs
 * @extends {adapt.expr.Multiplicative}
 */
adapt.expr.Modulo = function(scope, lhs, rhs) {
	adapt.expr.Multiplicative.call(this, scope, lhs, rhs);
};
goog.inherits(adapt.expr.Modulo, adapt.expr.Multiplicative);

/**
 * @override
 */
adapt.expr.Modulo.prototype.getOp = function() {
    return "%";
};

/**
 * @override
 */
adapt.expr.Modulo.prototype.evalInfix = function(lhs, rhs) {
    return lhs % rhs;
};


/**
 * Numerical value with a unit.
 * @constructor
 * @param {adapt.expr.LexicalScope} scope
 * @param {number} num
 * @param {string} unit
 * @extends {adapt.expr.Val}
 */
adapt.expr.Numeric = function(scope, num, unit) {
    adapt.expr.Val.call(this, scope);
    /** @type {number} */ this.num = num;
    /** @type {string} */ this.unit = unit;
};
goog.inherits(adapt.expr.Numeric, adapt.expr.Val);

/**
 * @override
 */
adapt.expr.Numeric.prototype.appendTo = function(buf, priority) {
    buf.append(this.num.toString());
    buf.append(adapt.base.escapeCSSIdent(this.unit));
};

/**
 * @override
 */
adapt.expr.Numeric.prototype.evaluateCore = function(context) {
    return this.num * context.queryUnitSize(this.unit);
};


/**
 * Named value.
 * @constructor
 * @param {adapt.expr.LexicalScope} scope
 * @param {string} qualifiedName CSS-escaped name sequence separated by dots. 
 * @extends {adapt.expr.Val}
 */
adapt.expr.Named = function(scope, qualifiedName) {
    adapt.expr.Val.call(this, scope);
    this.qualifiedName = qualifiedName;
};
goog.inherits(adapt.expr.Named, adapt.expr.Val);

/**
 * @override
 */
adapt.expr.Named.prototype.appendTo = function(buf, priority) {
    buf.append(this.qualifiedName);
};
    
/**
 * @override
 */
adapt.expr.Named.prototype.evaluateCore = function(context) {
    return context.evalName(this.scope, this.qualifiedName).evaluate(context);
};

/**
 * @override
 */
adapt.expr.Named.prototype.dependCore = function(other, context, dependencyCache) {
    return other === this || 
        context.evalName(this.scope, this.qualifiedName).dependOuter(other, context, dependencyCache);
};


/**
 * Named value.
 * @constructor
 * @param {adapt.expr.LexicalScope} scope
 * @param {boolean} not
 * @param {string} name
 * @extends {adapt.expr.Val}
 */
adapt.expr.MediaName = function(scope, not, name) {
	adapt.expr.Val.call(this, scope);
    /** @type {boolean} */ this.not = not;
    /** @type {string} */ this.name = name;
};
goog.inherits(adapt.expr.MediaName, adapt.expr.Val);

/**
 * @override
 */
adapt.expr.MediaName.prototype.appendTo = function(buf, priority) {
    if (this.not)
        buf.append('not ');
    buf.append(adapt.base.escapeCSSIdent(this.name));
};
    
/**
 * @override
 */
adapt.expr.MediaName.prototype.evaluateCore = function(context) {
    return true;
};

/**
 * @override
 */
adapt.expr.MediaName.prototype.isMediaName = function() {
    return true;
};

/**
 * A value that is calculated by calling a JavaScript function. Note that the
 * result is cached and this function will be called only once between any
 * clears for its scope in the context.
 * @constructor
 * @param {adapt.expr.LexicalScope} scope
 * @param {function(this:adapt.expr.Context):adapt.expr.Result} fn function to call.
 * @param {string} str a way to represent this value in toString() call.
 * @extends {adapt.expr.Val}
 */
adapt.expr.Native = function(scope, fn, str) {
    adapt.expr.Val.call(this, scope);
    /**
     * @type {function(this:adapt.expr.Context):adapt.expr.Result}
     */
    this.fn = fn;
    /** @type {string} */ this.str = str;
};
goog.inherits(adapt.expr.Native, adapt.expr.Val);

/**
 * @override
 */
adapt.expr.Native.prototype.appendTo = function(buf, priority) {
    buf.append(this.str);
};

/**
 * @override
 */
adapt.expr.Native.prototype.evaluateCore = function(context) {
    return this.fn.call(context);
};


/**
 * @param {adapt.base.StringBuffer} buf
 * @param {Array.<adapt.expr.Val>} arr
 * @return {void}
 */
adapt.expr.appendValArray = function(buf, arr) {
    buf.append("(");
    for (var i = 0 ; i < arr.length ; i++) {
        if (i) 
            buf.append(",");
        arr[i].appendTo(buf, 0);
    }
    buf.append(")");
};

/**
 * @param {adapt.expr.Context} context
 * @param {Array.<adapt.expr.Val>} arr
 * @param {Array.<adapt.expr.Val>} params
 * @return {Array.<adapt.expr.Val>}
 */
adapt.expr.expandValArray = function(context, arr, params) {
    /** @type {Array.<adapt.expr.Val>} */ var expanded = arr;
    for (var i = 0; i < arr.length; i++) {
        var p = arr[i].expand(context, params);
        if (arr !== expanded) {
        	expanded[i] = p;
        } else if (p !== arr[i]) {
        	expanded = Array(arr.length);
        	for (var j = 0; j < i; j++) {
        		expanded[j] = arr[j];
        	}
        	expanded[i] = p;
        }
    }
    return expanded;
};

/**
 * @param {adapt.expr.Context} context
 * @param {Array.<adapt.expr.Val>} arr
 * @return {Array.<adapt.expr.Result>}
 */
adapt.expr.evalValArray = function(context, arr) {
    /** @type {Array.<adapt.expr.Result>} */ var result = Array(arr.length);
    for (var i = 0; i < arr.length; i++) {
        result[i] = arr[i].evaluate(context);
    }
    return result;
};

/**
 * @constructor
 * @param {adapt.expr.LexicalScope} scope
 * @param {string} qualifiedName
 * @param {Array.<adapt.expr.Val>} params
 * @extends {adapt.expr.Val}
 */
adapt.expr.Call = function(scope, qualifiedName, params) {
    adapt.expr.Val.call(this, scope);
    /** @type {string} */ this.qualifiedName = qualifiedName;
    /** @type {Array.<adapt.expr.Val>} */ this.params = params;
};
goog.inherits(adapt.expr.Call, adapt.expr.Val);

/**
 * @override
 */
adapt.expr.Call.prototype.appendTo = function(buf, priority) {
    buf.append(this.qualifiedName);
    adapt.expr.appendValArray(buf, this.params);
};

/**
 * @override
 */
adapt.expr.Call.prototype.evaluateCore = function(context) {
    var body = context.evalCall(this.scope, this.qualifiedName, this.params, false);
    return body.expand(context, this.params).evaluate(context);
};

/**
 * @override
 */
adapt.expr.Call.prototype.dependCore = function(other, context, dependencyCache) {
    if (other === this)
        return true;
    for (var i = 0; i < this.params.length; i++) {
        if (this.params[i].dependOuter(other, context, dependencyCache))
            return true;
    }
    var body = context.evalCall(this.scope, this.qualifiedName, this.params, true);
    // No expansion here!
    return body.dependOuter(other, context, dependencyCache);
};

/**
 * @override
 */
adapt.expr.Call.prototype.expand = function(context, params) {
    var expandedParams = adapt.expr.expandValArray(context, this.params, params);
    if (expandedParams === this.params)
        return this;
    return new adapt.expr.Call(this.scope, this.qualifiedName, expandedParams);
};


/**
 * @constructor
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.expr.Val} cond
 * @param {adapt.expr.Val} ifTrue
 * @param {adapt.expr.Val} ifFalse
 * @extends {adapt.expr.Val}
 */
adapt.expr.Cond = function(scope, cond, ifTrue, ifFalse) {
	adapt.expr.Val.call(this, scope);
	/** @type {adapt.expr.Val} */ this.cond = cond;
	/** @type {adapt.expr.Val} */ this.ifTrue = ifTrue;
	/** @type {adapt.expr.Val} */ this.ifFalse = ifFalse;
};
goog.inherits(adapt.expr.Cond, adapt.expr.Val);

/**
 * @override
 */
adapt.expr.Cond.prototype.appendTo = function(buf, priority) {
    if( priority > 0 )
        buf.append("(");
    this.cond.appendTo(buf, 0);
    buf.append("?");
    this.ifTrue.appendTo(buf, 0);
    buf.append(":");
    this.ifFalse.appendTo(buf, 0);
    if( priority > 0 )
        buf.append(")");
};

/**
 * @override
 */
adapt.expr.Cond.prototype.evaluateCore = function(context) {
    if (this.cond.evaluate(context))
        return this.ifTrue.evaluate(context);
    else
        return this.ifFalse.evaluate(context);
};

/**
 * @override
 */
adapt.expr.Cond.prototype.dependCore = function(other, context, dependencyCache) {
    return other === this || this.cond.dependOuter(other, context, dependencyCache) ||
        this.ifTrue.dependOuter(other, context, dependencyCache) || this.ifFalse.dependOuter(other, context, dependencyCache);
};

/**
 * @override
 */
adapt.expr.Cond.prototype.expand = function(context, params) {
    var cond = this.cond.expand(context, params);
    var ifTrue = this.ifTrue.expand(context, params);
    var ifFalse = this.ifFalse.expand(context, params);
    if (cond === this.cond && ifTrue === this.ifTrue && ifFalse === this.ifFalse)
        return this;
    var r = new adapt.expr.Cond(this.scope, cond, ifTrue, ifFalse);
    return r;
};


/**
 * @constructor
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.expr.Result} val
 * @extends {adapt.expr.Val}
 */
adapt.expr.Const = function(scope, val) {
	adapt.expr.Val.call(this, scope);
    this.val = val;
};
goog.inherits(adapt.expr.Const, adapt.expr.Val);

/**
 * @override
 */
adapt.expr.Const.prototype.appendTo = function(buf, priority) {
    switch (typeof this.val) {
    case "number":
    case "boolean":
        buf.append(this.val.toString());
        break;
    case "string":
        buf.append('"');
        buf.append(adapt.base.escapeCSSStr(this.val));
        buf.append('"');
        break;
    default:
        throw new Error("F_UNEXPECTED_STATE");
    }
};

/**
 * @override
 */
adapt.expr.Const.prototype.evaluateCore = function(context) {
    return this.val;
};


/**
 * @constructor
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.expr.MediaName} name
 * @param {adapt.expr.Val} value
 * @extends {adapt.expr.Val}
 */
adapt.expr.MediaTest = function(scope, name, value) {
	adapt.expr.Val.call(this, scope);
    this.name = name;
    this.value = value;
};
goog.inherits(adapt.expr.MediaTest, adapt.expr.Val);

/**
 * @override
 */
adapt.expr.MediaTest.prototype.appendTo = function(buf, priority) {
    buf.append('(');
    buf.append(adapt.base.escapeCSSStr(this.name.name));
    buf.append(':');
    this.value.appendTo(buf, 0);
    buf.append(')');
};

/**
 * @override
 */
adapt.expr.MediaTest.prototype.evaluateCore = function(context) {
    return context.evalMediaTest(this.name.name, this.value);
};

/**
 * @override
 */
adapt.expr.MediaTest.prototype.dependCore = function(other, context, dependencyCache) {
    return other === this || this.value.dependOuter(other, context, dependencyCache);
};

/**
 * @override
 */
adapt.expr.MediaTest.prototype.expand = function(context, params) {
    var value = this.value.expand(context, params);
    if (value === this.value)
        return this;
    var r = new adapt.expr.MediaTest(this.scope, this.name, value);
    return r;
};

/**
 * @constructor
 * @param {adapt.expr.LexicalScope} scope
 * @param {number} index
 * @extends {adapt.expr.Val}
 */
adapt.expr.Param = function(scope, index) {
	adapt.expr.Val.call(this, scope);
    this.index = index;
};
goog.inherits(adapt.expr.Param, adapt.expr.Val);

/**
 * @override
 */
adapt.expr.Param.prototype.appendTo = function(buf, priority) {
    buf.append("$");
    buf.append(this.index.toString());
};

/**
 * @override
 */
adapt.expr.Param.prototype.expand = function(context, params) {
    var v = params[this.index];
    if (!v)
        throw new Error("Parameter missing: " + this.index);
    return /** @type {adapt.expr.Val} */ (v);
};


/**
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.expr.Val} v1
 * @param {adapt.expr.Val} v2
 * @return {adapt.expr.Val}
 */
adapt.expr.and = function(scope, v1, v2) {
    if (v1 === scope._false || v1 === scope.zero ||
        v2 == scope._false || v2 == scope.zero)
        return scope._false;
    if (v1 === scope._true || v1 === scope.one)
        return v2;
    if (v2 === scope._true || v2 === scope.one)
        return v1;
    return new adapt.expr.And(scope, v1, v2);
};

/**
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.expr.Val} v1
 * @param {adapt.expr.Val} v2
 * @return {adapt.expr.Val}
 */
adapt.expr.add = function(scope, v1, v2) {
    if (v1 === scope.zero)
        return v2;
    if (v2 === scope.zero)
        return v1;
    return new adapt.expr.Add(scope, v1, v2);
};

/**
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.expr.Val} v1
 * @param {adapt.expr.Val} v2
 * @return {adapt.expr.Val}
 */
adapt.expr.sub = function(scope, v1, v2) {
    if (v1 === scope.zero)
        return new adapt.expr.Negate(scope, v2);
    if (v2 === scope.zero)
        return v1;
    return new adapt.expr.Subtract(scope, v1, v2);
};

/**
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.expr.Val} v1
 * @param {adapt.expr.Val} v2
 * @return {adapt.expr.Val}
 */
adapt.expr.mul = function(scope, v1, v2) {
    if (v1 === scope.zero || v2 === scope.zero)
        return scope.zero;
    if (v1 === scope.one)
        return v2;
    if (v2 === scope.one)
        return v1;
    return new adapt.expr.Multiply(scope, v1, v2);
};

/**
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.expr.Val} v1
 * @param {adapt.expr.Val} v2
 * @return {adapt.expr.Val}
 */
adapt.expr.div = function(scope, v1, v2) {
    if (v1 === scope.zero)
        return scope.zero;
    if (v2 === scope.one)
        return v1;
    return new adapt.expr.Divide(scope, v1, v2);
};
