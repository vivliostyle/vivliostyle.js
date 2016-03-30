/**
 * Copyright 2013 Google, Inc.
 * Copyright 2015 Vivliostyle Inc.
 * @fileoverview CSS Parser.
 */
goog.require('vivliostyle.logging');
goog.require('adapt.base');
goog.require('adapt.expr');
goog.require('adapt.css');
goog.require('adapt.csstok');
goog.require('adapt.task');
goog.require('adapt.net');

goog.provide('adapt.cssparse');

/**
 * User agent stylesheet base specificity.
 * @type {number}
 * @const
 */
adapt.cssparse.SPECIFICITY_USER_AGENT = 0;

/**
 * User stylesheet base specificity.
 * @type {number}
 * @const
 */
adapt.cssparse.SPECIFICITY_USER = 0x1000000;

/**
 * Author stylesheet ("normal" stylesheet) base specificity.
 * @type {number}
 * @const
 */
adapt.cssparse.SPECIFICITY_AUTHOR = 0x2000000;

/**
 * Style attribute base specificity.
 * @type {number}
 * @const
 */
adapt.cssparse.SPECIFICITY_STYLE = 0x3000000;

/**
 * Style attribute base specificity when !important is used.
 * @type {number}
 * @const
 */
adapt.cssparse.SPECIFICITY_STYLE_IMPORTANT = 0x4000000;

/**
 * Author stylesheet base specificity when !important is used.
 * @type {number}
 * @const
 */
adapt.cssparse.SPECIFICITY_AUTHOR_IMPORTANT = 0x5000000;

/**
 * User stylesheet base specificity when !important is used.
 * @type {number}
 */
adapt.cssparse.SPECIFICITY_USER_IMPORTANT = 0x6000000; // User stylesheet !important

/**
 * @enum {string}
 */
adapt.cssparse.StylesheetFlavor = {
	USER_AGENT: "UA",
	USER: "User",
	AUTHOR: "Author"
};


/**
 * CSS Color value from hash text (without '#' character).
 * @param {string} text
 * @return {adapt.css.Color}
 */
adapt.cssparse.colorFromHash = function(text) {
    var num = parseInt(text, 16);
    if (isNaN(num))
        throw new Error("E_CSS_COLOR");
    if (text.length == 6)
        return new adapt.css.Color(num);
    if (text.length == 3) {
        num = (num & 0xF) | ((num & 0xF) << 4) | ((num & 0xF0) << 4) | ((num & 0xF0) << 8) |
                ((num & 0xF00) << 8) | ((num & 0xF00) << 12);
        return new adapt.css.Color(num);
    }
    throw new Error("E_CSS_COLOR");
};

/**
 * @param {adapt.expr.LexicalScope} scope
 * @constructor
 * @implements {adapt.csstok.TokenizerHandler}
 */
adapt.cssparse.ParserHandler = function(scope) {
	/** @type {adapt.expr.LexicalScope} */ this.scope = scope;
    /** @type {adapt.cssparse.StylesheetFlavor} */ this.flavor = adapt.cssparse.StylesheetFlavor.AUTHOR;
};

/**
 * @return {adapt.csstok.Token}
 */
adapt.cssparse.ParserHandler.prototype.getCurrentToken = function() {
    return null;
};

/**
 * @return {adapt.expr.LexicalScope}
 */
adapt.cssparse.ParserHandler.prototype.getScope = function() {
    return this.scope;
};

/**
 * @param {string} mnemonics
 * @param {adapt.csstok.Token} token
 * @return {void}
 */
adapt.cssparse.ParserHandler.prototype.error = function(mnemonics, token) {
};

/**
 * @param {adapt.cssparse.StylesheetFlavor} flavor
 * @return {void}
 */
adapt.cssparse.ParserHandler.prototype.startStylesheet = function(flavor) {
	this.flavor = flavor;
};

/**
 * @param {?string} ns
 * @param {?string} name
 * @return {void}
 */
adapt.cssparse.ParserHandler.prototype.tagSelector = function(ns, name) {
};

/**
 * @param {string} name
 * @return {void}
 */
adapt.cssparse.ParserHandler.prototype.classSelector = function(name) {
};

/**
 * @param {string} name
 * @param {Array.<number|string>} params
 * @return {void}
 */
adapt.cssparse.ParserHandler.prototype.pseudoclassSelector = function(name, params) {
};

/**
 * @param {string} name
 * @param {Array.<number|string>} params
 * @return {void}
 */
adapt.cssparse.ParserHandler.prototype.pseudoelementSelector = function(name, params) {
};

/**
 * @param {string} id
 * @return {void}
 */
adapt.cssparse.ParserHandler.prototype.idSelector = function(id) {
};

/**
 * @param {string} ns
 * @param {string} name
 * @param {adapt.csstok.TokenType} op
 * @param {?string} value
 * @return {void}
 */
adapt.cssparse.ParserHandler.prototype.attributeSelector = function(ns, name, op, value) {
};

/**
 * @return {void}
 */
adapt.cssparse.ParserHandler.prototype.descendantSelector = function() {
};

/**
 * @return {void}
 */
adapt.cssparse.ParserHandler.prototype.childSelector = function() {
};

/**
 * @return {void}
 */
adapt.cssparse.ParserHandler.prototype.adjacentSiblingSelector = function() {
};

/**
 * @return {void}
 */
adapt.cssparse.ParserHandler.prototype.followingSiblingSelector = function() {
};

/**
 * @return {void}
 */
adapt.cssparse.ParserHandler.prototype.nextSelector = function() {
};

/**
 * @return {void}
 */
adapt.cssparse.ParserHandler.prototype.startSelectorRule = function() {
};

/**
 * @return {void}
 */
adapt.cssparse.ParserHandler.prototype.startFontFaceRule = function() {
};

/**
 * @param {?string} pseudoelem
 * @return {void}
 */
adapt.cssparse.ParserHandler.prototype.startFootnoteRule = function(pseudoelem) {
};

/**
 * @return {void}
 */
adapt.cssparse.ParserHandler.prototype.startViewportRule = function() {
};

/**
 * @return {void}
 */
adapt.cssparse.ParserHandler.prototype.startDefineRule = function() {
};

/**
 * @return {void}
 */
adapt.cssparse.ParserHandler.prototype.startRegionRule = function() {
};

/**
 * @return {void}
 */
adapt.cssparse.ParserHandler.prototype.startPageRule = function() {
};

/**
 * @param {string} name
 * @return {void}
 */
adapt.cssparse.ParserHandler.prototype.startPageMarginBoxRule = function(name) {
};

/**
 * @param {adapt.css.Expr} expr
 * @return {void}
 */
adapt.cssparse.ParserHandler.prototype.startWhenRule = function(expr) {
};

/**
 * @param {adapt.css.Expr} expr
 * @return {void}
 */
adapt.cssparse.ParserHandler.prototype.startMediaRule = function(expr) {
    this.startWhenRule(expr);
};

/**
 * @param {string} flowName
 * @return {void}
 */
adapt.cssparse.ParserHandler.prototype.startFlowRule = function(flowName) {
};

/**
 * @return {void}
 */
adapt.cssparse.ParserHandler.prototype.startPageTemplateRule = function() {
};

/**
 * @param {?string} name
 * @param {?string} pseudoName
 * @param {Array.<string>} classes
 * @return {void}
 */
adapt.cssparse.ParserHandler.prototype.startPageMasterRule = function(name, pseudoName, classes) {
};

/**
 * @param {?string} name
 * @param {?string} pseudoName
 * @param {Array.<string>} classes
 * @return {void}
 */
adapt.cssparse.ParserHandler.prototype.startPartitionRule = function(name, pseudoName, classes) {
};

/**
 * @param {?string} name
 * @param {?string} pseudoName
 * @param {Array.<string>} classes
 * @return {void}
 */
adapt.cssparse.ParserHandler.prototype.startPartitionGroupRule = function(name, pseudoName, classes) {
};


/**
 * @return {void}
 */
adapt.cssparse.ParserHandler.prototype.startRuleBody = function() {
};

/**
 * @param {string} name
 * @param {adapt.css.Val} value
 * @param {boolean} important
 * @return {void}
 */
adapt.cssparse.ParserHandler.prototype.property = function(name, value, important) {
};

/**
 * @return {void}
 */
adapt.cssparse.ParserHandler.prototype.endRule = function() {
};

/**
 * @return {void}
 */
adapt.cssparse.ParserHandler.prototype.startNotRule = function() {
};


/**
 * @return {void}
 */
adapt.cssparse.ParserHandler.prototype.endFuncRule = function() {
};

/**
 * @return {number}
 */
adapt.cssparse.ParserHandler.prototype.getImportantSpecificity = function() {
    switch (this.flavor) {
    case adapt.cssparse.StylesheetFlavor.USER_AGENT:
        return adapt.cssparse.SPECIFICITY_USER_AGENT;
    case adapt.cssparse.StylesheetFlavor.USER:
        return adapt.cssparse.SPECIFICITY_USER_IMPORTANT;
    default:
        return adapt.cssparse.SPECIFICITY_AUTHOR_IMPORTANT;
    }
};

/**
 * @return {number}
 */
adapt.cssparse.ParserHandler.prototype.getBaseSpecificity = function() {
    switch (this.flavor) {
    case adapt.cssparse.StylesheetFlavor.USER_AGENT:
        return adapt.cssparse.SPECIFICITY_USER_AGENT;
    case adapt.cssparse.StylesheetFlavor.USER:
        return adapt.cssparse.SPECIFICITY_USER;
    default:
        return adapt.cssparse.SPECIFICITY_AUTHOR;
    }
};


/**
 * @constructor
 * @extends {adapt.cssparse.ParserHandler}
 */
adapt.cssparse.DispatchParserHandler = function() {
	adapt.cssparse.ParserHandler.call(this, null);
    /** @type {Array.<adapt.cssparse.ParserHandler>} */ this.stack = [];
    /** @type {adapt.csstok.Tokenizer} */ this.tokenizer = null;
    /** @type {adapt.cssparse.ParserHandler} */ this.slave = null;
};
goog.inherits(adapt.cssparse.DispatchParserHandler, adapt.cssparse.ParserHandler);

/**
 * @param {adapt.cssparse.ParserHandler} slave
 * @return {void}
 */
adapt.cssparse.DispatchParserHandler.prototype.pushHandler = function(slave) {
    this.stack.push(this.slave);
    this.slave = slave;
};

/**
 * @return {void}
 */
adapt.cssparse.DispatchParserHandler.prototype.popHandler = function() {
    this.slave = this.stack.pop();
};

/**
 * @override
 */
adapt.cssparse.DispatchParserHandler.prototype.getCurrentToken = function() {
    if (this.tokenizer)
        return this.tokenizer.token();
    return null;
};

/**
 * @override
 */
adapt.cssparse.DispatchParserHandler.prototype.getScope = function() {
    return this.slave.getScope();
};

/**
 * Forwards call to slave.
 * @override
 */
adapt.cssparse.DispatchParserHandler.prototype.error = function(mnemonics, token) {
	this.slave.error(mnemonics, token);
};

/**
 * Called by a slave.
 * @param {string} mnemonics
 * @param {adapt.csstok.Token} token
 * @return {void}
 */
adapt.cssparse.DispatchParserHandler.prototype.errorMsg = function(mnemonics, token) {
    vivliostyle.logging.logger.warn(mnemonics);
};

/**
 * @override
 */
adapt.cssparse.DispatchParserHandler.prototype.startStylesheet = function(flavor) {
	adapt.cssparse.ParserHandler.prototype.startStylesheet.call(this, flavor);
    if (this.stack.length > 0) {
    	// This can occur as a result of an error
    	this.slave = this.stack[0];
    	this.stack = [];
    }
    this.slave.startStylesheet(flavor);
};

/**
 * @override
 */
adapt.cssparse.DispatchParserHandler.prototype.tagSelector = function(ns, name) {
    this.slave.tagSelector(ns, name);
};

/**
 * @override
 */
adapt.cssparse.DispatchParserHandler.prototype.classSelector = function(name) {
    this.slave.classSelector(name);
};

/**
 * @override
 */
adapt.cssparse.DispatchParserHandler.prototype.pseudoclassSelector = function(name, params) {
    this.slave.pseudoclassSelector(name, params);
};

/**
 * @override
 */
adapt.cssparse.DispatchParserHandler.prototype.pseudoelementSelector = function(name, params) {
    this.slave.pseudoelementSelector(name, params);
};

/**
 * @override
 */
adapt.cssparse.DispatchParserHandler.prototype.idSelector = function(id) {
    this.slave.idSelector(id);
};

/**
 * @override
 */
adapt.cssparse.DispatchParserHandler.prototype.attributeSelector = function(ns, name, op, value) {
    this.slave.attributeSelector(ns, name, op, value);
};

/**
 * @override
 */
adapt.cssparse.DispatchParserHandler.prototype.descendantSelector = function() {
    this.slave.descendantSelector();
};

/**
 * @override
 */
adapt.cssparse.DispatchParserHandler.prototype.childSelector = function() {
    this.slave.childSelector();
};

/**
 * @override
 */
adapt.cssparse.DispatchParserHandler.prototype.adjacentSiblingSelector = function() {
    this.slave.adjacentSiblingSelector();
};

/**
 * @override
 */
adapt.cssparse.DispatchParserHandler.prototype.followingSiblingSelector = function() {
    this.slave.followingSiblingSelector();
};

/**
 * @override
 */
adapt.cssparse.DispatchParserHandler.prototype.nextSelector = function() {
    this.slave.nextSelector();
};

/**
 * @override
 */
adapt.cssparse.DispatchParserHandler.prototype.startSelectorRule = function() {
    this.slave.startSelectorRule();
};

/**
 * @override
 */
adapt.cssparse.DispatchParserHandler.prototype.startFontFaceRule = function() {
    this.slave.startFontFaceRule();
};

/**
 * @override
 */
adapt.cssparse.DispatchParserHandler.prototype.startFootnoteRule = function(pseudoelem) {
    this.slave.startFootnoteRule(pseudoelem);
};

/**
 * @override
 */
adapt.cssparse.DispatchParserHandler.prototype.startViewportRule = function() {
    this.slave.startViewportRule();
};

/**
 * @override
 */
adapt.cssparse.DispatchParserHandler.prototype.startDefineRule = function() {
    this.slave.startDefineRule();
};

/**
 * @override
 */
adapt.cssparse.DispatchParserHandler.prototype.startRegionRule = function() {
    this.slave.startRegionRule();
};

/**
 * @override
 */
adapt.cssparse.DispatchParserHandler.prototype.startPageRule = function() {
    this.slave.startPageRule();
};

/**
 * @override
 */
adapt.cssparse.DispatchParserHandler.prototype.startPageMarginBoxRule = function(name) {
    this.slave.startPageMarginBoxRule(name);
};

/**
 * @override
 */
adapt.cssparse.DispatchParserHandler.prototype.startWhenRule = function(expr) {
    this.slave.startWhenRule(expr);
};

/**
 * @override
 */
adapt.cssparse.DispatchParserHandler.prototype.startFlowRule = function(flowName) {
    this.slave.startFlowRule(flowName);
};

/**
 * @override
 */
adapt.cssparse.DispatchParserHandler.prototype.startPageTemplateRule = function() {
    this.slave.startPageTemplateRule();
};

/**
 * @override
 */
adapt.cssparse.DispatchParserHandler.prototype.startPageMasterRule = function(name, pseudoName, classes) {
    this.slave.startPageMasterRule(name, pseudoName, classes);
};

/**
 * @override
 */
adapt.cssparse.DispatchParserHandler.prototype.startPartitionRule = function(name, pseudoName, classes) {
    this.slave.startPartitionRule(name, pseudoName, classes);
};

/**
 * @override
 */
adapt.cssparse.DispatchParserHandler.prototype.startPartitionGroupRule = function(name, pseudoName, classes) {
    this.slave.startPartitionGroupRule(name, pseudoName, classes);
};

/**
 * @override
 */
adapt.cssparse.DispatchParserHandler.prototype.startRuleBody = function() {
    this.slave.startRuleBody();
};

/**
 * @override
 */
adapt.cssparse.DispatchParserHandler.prototype.property = function(name, value, important) {
    this.slave.property(name, value, important);
};

/**
 * @override
 */
adapt.cssparse.DispatchParserHandler.prototype.endRule = function() {
    this.slave.endRule();
};

/**
 * @override
 */
adapt.cssparse.DispatchParserHandler.prototype.startNotRule = function() {
  this.slave.startNotRule();
};


/**
 * @override
 */
adapt.cssparse.DispatchParserHandler.prototype.endFuncRule = function() {
  this.slave.endFuncRule();
};

/**
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.cssparse.DispatchParserHandler} owner
 * @constructor
 * @extends {adapt.cssparse.ParserHandler}
 */
adapt.cssparse.SkippingParserHandler = function(scope, owner, topLevel) {
	adapt.cssparse.ParserHandler.call(this, scope);
	/** @const */ this.topLevel = topLevel;
    /** @type {number} */ this.depth = 0;
    /** @type {adapt.cssparse.DispatchParserHandler} */ this.owner = owner;
};
goog.inherits(adapt.cssparse.SkippingParserHandler, adapt.cssparse.ParserHandler);

/**
 * @override
 */
adapt.cssparse.SkippingParserHandler.prototype.getCurrentToken = function() {
    return this.owner.getCurrentToken();
};

/**
 * @override
 */
adapt.cssparse.SkippingParserHandler.prototype.error = function(mnemonics, token) {
    this.owner.errorMsg(mnemonics, token);
};

/**
 * @override
 */
adapt.cssparse.SkippingParserHandler.prototype.startRuleBody = function() {
    this.depth++;
};

/**
 * @override
 */
adapt.cssparse.SkippingParserHandler.prototype.endRule = function() {
    if (--this.depth == 0 && !this.topLevel) {
        this.owner.popHandler();
    }
};


/**
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.cssparse.DispatchParserHandler} owner
 * @param {boolean} topLevel
 * @constructor
 * @extends {adapt.cssparse.SkippingParserHandler}
 */
adapt.cssparse.SlaveParserHandler = function(scope, owner, topLevel) {
	adapt.cssparse.SkippingParserHandler.call(this, scope, owner, topLevel);
};
goog.inherits(adapt.cssparse.SlaveParserHandler, adapt.cssparse.SkippingParserHandler);

/**
 * @param {string} message
 * @return {void}
 */
adapt.cssparse.SlaveParserHandler.prototype.report = function(message) {
    this.error(message, this.getCurrentToken());
};

/**
 * @param {string} message
 * @return {void}
 */
adapt.cssparse.SlaveParserHandler.prototype.reportAndSkip = function(message) {
    this.report(message);
    this.owner.pushHandler(new adapt.cssparse.SkippingParserHandler(this.scope, this.owner, false));
};

/**
 * @override
 */
adapt.cssparse.SlaveParserHandler.prototype.startSelectorRule = function() {
    this.reportAndSkip("E_CSS_UNEXPECTED_SELECTOR");
};

/**
 * @override
 */
adapt.cssparse.SlaveParserHandler.prototype.startFontFaceRule = function() {
    this.reportAndSkip("E_CSS_UNEXPECTED_FONT_FACE");
};

/**
 * @override
 */
adapt.cssparse.SlaveParserHandler.prototype.startFootnoteRule = function(pseudoelem) {
    this.reportAndSkip("E_CSS_UNEXPECTED_FOOTNOTE");
};

/**
 * @override
 */
adapt.cssparse.SlaveParserHandler.prototype.startViewportRule = function() {
    this.reportAndSkip("E_CSS_UNEXPECTED_VIEWPORT");
};

/**
 * @override
 */
adapt.cssparse.SlaveParserHandler.prototype.startDefineRule = function() {
    this.reportAndSkip("E_CSS_UNEXPECTED_DEFINE");
};

/**
 * @override
 */
adapt.cssparse.SlaveParserHandler.prototype.startRegionRule = function() {
    this.reportAndSkip("E_CSS_UNEXPECTED_REGION");
};

/**
 * @override
 */
adapt.cssparse.SlaveParserHandler.prototype.startPageRule = function() {
    this.reportAndSkip("E_CSS_UNEXPECTED_PAGE");
};

/**
 * @override
 */
adapt.cssparse.SlaveParserHandler.prototype.startWhenRule = function(expr) {
    this.reportAndSkip("E_CSS_UNEXPECTED_WHEN");
};

/**
 * @override
 */
adapt.cssparse.SlaveParserHandler.prototype.startFlowRule = function(flowName) {
    this.reportAndSkip("E_CSS_UNEXPECTED_FLOW");
};

/**
 * @override
 */
adapt.cssparse.SlaveParserHandler.prototype.startPageTemplateRule = function() {
    this.reportAndSkip("E_CSS_UNEXPECTED_PAGE_TEMPLATE");
};

/**
 * @override
 */
adapt.cssparse.SlaveParserHandler.prototype.startPageMasterRule = function(name, pseudoName, classes) {
    this.reportAndSkip("E_CSS_UNEXPECTED_PAGE_MASTER");
};

/**
 * @override
 */
adapt.cssparse.SlaveParserHandler.prototype.startPartitionRule = function(name, pseudoName, classes) {
    this.reportAndSkip("E_CSS_UNEXPECTED_PARTITION");
};

/**
 * @override
 */
adapt.cssparse.SlaveParserHandler.prototype.startPartitionGroupRule = function(name, pseudoName, classes) {
    this.reportAndSkip("E_CSS_UNEXPECTED_PARTITION_GROUP");
};

/**
 * @override
 */
adapt.cssparse.SlaveParserHandler.prototype.property = function(name, value, important) {
    this.error("E_CSS_UNEXPECTED_PROPERTY", this.getCurrentToken());
};


/**
 * @type {!Array.<adapt.cssparse.Action>}
 * @const
 */
adapt.cssparse.actionsBase = [];

/**
 * @type {!Array.<adapt.cssparse.Action>}
 * @const
 */
adapt.cssparse.actionsStyleAttribute = [];

/**
 * @type {!Array.<adapt.cssparse.Action>}
 * @const
 */
adapt.cssparse.actionsSelector = [];

/**
 * @type {!Array.<adapt.cssparse.Action>}
 * @const
 */
adapt.cssparse.actionsSelectorCont = [];

/**
 * @type {!Array.<adapt.cssparse.Action>}
 * @const
 */
adapt.cssparse.actionsSelectorStart = [];

/**
 * @type {!Array.<adapt.cssparse.Action>}
 * @const
 */
adapt.cssparse.actionsPropVal = [];

/**
 * @type {!Array.<adapt.cssparse.Action>}
 * @const
 */
adapt.cssparse.actionsExprVal = [];

/**
 * @type {!Array.<adapt.cssparse.Action>}
 * @const
 */
adapt.cssparse.actionsExprOp = [];

/**
 * @type {!Array.<adapt.cssparse.Action>}
 * @const
 */
adapt.cssparse.actionsError = [];

/**
 * @type {!Array.<adapt.cssparse.Action>}
 * @const
 */
adapt.cssparse.actionsErrorDecl = [];

/**
 * @type {!Array.<adapt.cssparse.Action>}
 * @const
 */
adapt.cssparse.actionsErrorSelector = [];

/**
 * @type {!Array.<number>}
 * @const
 */
adapt.cssparse.priority = [];

/**
 * @enum {number}
 */
adapt.cssparse.Action = {
    SELECTOR_NAME_1: 1,
    SELECTOR_NAME: 2,
    SELECTOR_ANY_1: 3,
    SELECTOR_ANY: 4,
    SELECTOR_ID_1: 5,
    SELECTOR_ID: 6,
    SELECTOR_CLASS_1: 7,
    SELECTOR_CLASS: 8,
    SELECTOR_ATTR_1: 9,
    SELECTOR_ATTR: 10,
    SELECTOR_CHILD: 11,
    SELECTOR_SIBLING: 12,
    SELECTOR_BODY: 13,
    SELECTOR_PSEUDOCLASS: 14,
    VAL_IDENT: 15,
    VAL_HASH: 16,
    VAL_NUM: 17,
    VAL_INT: 18,
    VAL_NUMERIC: 19,
    VAL_STR: 20,
    VAL_URL: 21,
    VAL_COMMA: 22,
    VAL_SLASH: 23,
    VAL_FUNC: 24,
    VAL_C_PAR: 25,
    VAL_END: 26,
    RULE_END: 27,
    IDENT: 28,
    SELECTOR_START: 29,
    AT: 30,
    EXPR_IDENT: 31,
    EXPR_NUM: 32,
    EXPR_NUMERIC: 33,
    EXPR_STR: 34,
    EXPR_PARAM: 35,
    EXPR_PREFIX: 36,
    EXPR_INFIX: 37,
    EXPR_FUNC: 38,
    EXPR_C_PAR: 39,
    EXPR_O_PAR: 40,
    SELECTOR_NEXT: 41,
    SELECTOR_PSEUDOELEM: 42,
    EXPR_O_BRC: 43,
    VAL_FINISH: 44,
    EXPR_INFIX_NAME: 45,
    PROP: 46,
    VAL_BANG: 47,
    VAL_BRC: 48,
    EXPR_SEMICOL: 49,
    ERROR_PUSH: 50,
    ERROR_POP: 51,
    ERROR_POP_DECL: 52,
    ERROR_SEMICOL: 53,
    VAL_PLUS: 54,
    SELECTOR_PSEUDOCLASS_1: 55,
    SELECTOR_FOLLOWING_SIBLING: 56,    
    DONE: 200
};

/**
 * @type {number}
 * @const
 */
adapt.cssparse.OP_MEDIA_AND = adapt.csstok.TokenType.LAST + 1;

(function() {
	var actionsBase = adapt.cssparse.actionsBase;
    actionsBase[adapt.csstok.TokenType.IDENT] = adapt.cssparse.Action.IDENT;
    actionsBase[adapt.csstok.TokenType.STAR] = adapt.cssparse.Action.SELECTOR_START;
    actionsBase[adapt.csstok.TokenType.HASH] = adapt.cssparse.Action.SELECTOR_START;
    actionsBase[adapt.csstok.TokenType.CLASS] = adapt.cssparse.Action.SELECTOR_START;
    actionsBase[adapt.csstok.TokenType.O_BRK] = adapt.cssparse.Action.SELECTOR_START;
    actionsBase[adapt.csstok.TokenType.COLON] = adapt.cssparse.Action.SELECTOR_START;
    actionsBase[adapt.csstok.TokenType.AT] = adapt.cssparse.Action.AT;
    actionsBase[adapt.csstok.TokenType.C_BRC] = adapt.cssparse.Action.RULE_END;
    actionsBase[adapt.csstok.TokenType.EOF] = adapt.cssparse.Action.DONE;
	var actionsStyleAttribute = adapt.cssparse.actionsStyleAttribute;
    actionsStyleAttribute[adapt.csstok.TokenType.IDENT] = adapt.cssparse.Action.PROP;
    actionsStyleAttribute[adapt.csstok.TokenType.EOF] = adapt.cssparse.Action.DONE;
    var actionsSelectorStart = adapt.cssparse.actionsSelectorStart;
    actionsSelectorStart[adapt.csstok.TokenType.IDENT] = adapt.cssparse.Action.SELECTOR_NAME;
    actionsSelectorStart[adapt.csstok.TokenType.STAR] = adapt.cssparse.Action.SELECTOR_ANY;
    actionsSelectorStart[adapt.csstok.TokenType.HASH] = adapt.cssparse.Action.SELECTOR_ID;
    actionsSelectorStart[adapt.csstok.TokenType.CLASS] = adapt.cssparse.Action.SELECTOR_CLASS;
    actionsSelectorStart[adapt.csstok.TokenType.O_BRK] = adapt.cssparse.Action.SELECTOR_ATTR;
    actionsSelectorStart[adapt.csstok.TokenType.COLON] = adapt.cssparse.Action.SELECTOR_PSEUDOCLASS;
    var actionsSelector = adapt.cssparse.actionsSelector;
    actionsSelector[adapt.csstok.TokenType.GT] = adapt.cssparse.Action.SELECTOR_CHILD;
    actionsSelector[adapt.csstok.TokenType.PLUS] = adapt.cssparse.Action.SELECTOR_SIBLING;
    actionsSelector[adapt.csstok.TokenType.TILDE] = adapt.cssparse.Action.SELECTOR_FOLLOWING_SIBLING;
    actionsSelector[adapt.csstok.TokenType.IDENT] = adapt.cssparse.Action.SELECTOR_NAME_1;
    actionsSelector[adapt.csstok.TokenType.STAR] = adapt.cssparse.Action.SELECTOR_ANY_1;
    actionsSelector[adapt.csstok.TokenType.HASH] = adapt.cssparse.Action.SELECTOR_ID_1;
    actionsSelector[adapt.csstok.TokenType.CLASS] = adapt.cssparse.Action.SELECTOR_CLASS_1;
    actionsSelector[adapt.csstok.TokenType.O_BRK] = adapt.cssparse.Action.SELECTOR_ATTR_1;
    actionsSelector[adapt.csstok.TokenType.O_BRC] = adapt.cssparse.Action.SELECTOR_BODY;
    actionsSelector[adapt.csstok.TokenType.COLON] = adapt.cssparse.Action.SELECTOR_PSEUDOCLASS_1;
    actionsSelector[adapt.csstok.TokenType.COL_COL] = adapt.cssparse.Action.SELECTOR_PSEUDOELEM;
    actionsSelector[adapt.csstok.TokenType.COMMA] = adapt.cssparse.Action.SELECTOR_NEXT;
    var actionsSelectorCont = adapt.cssparse.actionsSelectorCont;
    actionsSelectorCont[adapt.csstok.TokenType.IDENT] = adapt.cssparse.Action.SELECTOR_NAME;
    actionsSelectorCont[adapt.csstok.TokenType.STAR] = adapt.cssparse.Action.SELECTOR_ANY;
    actionsSelectorCont[adapt.csstok.TokenType.HASH] = adapt.cssparse.Action.SELECTOR_ID;
    actionsSelectorCont[adapt.csstok.TokenType.CLASS] = adapt.cssparse.Action.SELECTOR_CLASS;
    actionsSelectorCont[adapt.csstok.TokenType.COLON] = adapt.cssparse.Action.SELECTOR_PSEUDOCLASS;
    actionsSelectorCont[adapt.csstok.TokenType.COL_COL] = adapt.cssparse.Action.SELECTOR_PSEUDOELEM;
    actionsSelectorCont[adapt.csstok.TokenType.O_BRK] = adapt.cssparse.Action.SELECTOR_ATTR;
    actionsSelectorCont[adapt.csstok.TokenType.O_BRC] = adapt.cssparse.Action.SELECTOR_BODY;
    var actionsPropVal = adapt.cssparse.actionsPropVal;
    actionsPropVal[adapt.csstok.TokenType.IDENT] = adapt.cssparse.Action.VAL_IDENT;
    actionsPropVal[adapt.csstok.TokenType.HASH] = adapt.cssparse.Action.VAL_HASH;
    actionsPropVal[adapt.csstok.TokenType.NUM] = adapt.cssparse.Action.VAL_NUM;
    actionsPropVal[adapt.csstok.TokenType.INT] = adapt.cssparse.Action.VAL_INT;
    actionsPropVal[adapt.csstok.TokenType.NUMERIC] = adapt.cssparse.Action.VAL_NUMERIC;
    actionsPropVal[adapt.csstok.TokenType.STR] = adapt.cssparse.Action.VAL_STR;
    actionsPropVal[adapt.csstok.TokenType.URL] = adapt.cssparse.Action.VAL_URL;
    actionsPropVal[adapt.csstok.TokenType.COMMA] = adapt.cssparse.Action.VAL_COMMA;
    actionsPropVal[adapt.csstok.TokenType.SLASH] = adapt.cssparse.Action.VAL_SLASH;
    actionsPropVal[adapt.csstok.TokenType.FUNC] = adapt.cssparse.Action.VAL_FUNC;
    actionsPropVal[adapt.csstok.TokenType.C_PAR] = adapt.cssparse.Action.VAL_C_PAR;
    actionsPropVal[adapt.csstok.TokenType.SEMICOL] = adapt.cssparse.Action.VAL_END;
    actionsPropVal[adapt.csstok.TokenType.C_BRC] = adapt.cssparse.Action.VAL_BRC;
    actionsPropVal[adapt.csstok.TokenType.BANG] = adapt.cssparse.Action.VAL_BANG;
    actionsPropVal[adapt.csstok.TokenType.PLUS] = adapt.cssparse.Action.VAL_PLUS;
    actionsPropVal[adapt.csstok.TokenType.EOF] = adapt.cssparse.Action.VAL_FINISH;
    var actionsExprVal = adapt.cssparse.actionsExprVal;
    actionsExprVal[adapt.csstok.TokenType.IDENT] = adapt.cssparse.Action.EXPR_IDENT;
    actionsExprVal[adapt.csstok.TokenType.NUM] = adapt.cssparse.Action.EXPR_NUM;
    actionsExprVal[adapt.csstok.TokenType.INT] = adapt.cssparse.Action.EXPR_NUM;
    actionsExprVal[adapt.csstok.TokenType.NUMERIC] = adapt.cssparse.Action.EXPR_NUMERIC;
    actionsExprVal[adapt.csstok.TokenType.STR] = adapt.cssparse.Action.EXPR_STR;
    actionsExprVal[adapt.csstok.TokenType.O_PAR] = adapt.cssparse.Action.EXPR_O_PAR;
    actionsExprVal[adapt.csstok.TokenType.FUNC] = adapt.cssparse.Action.EXPR_FUNC;
    actionsExprVal[adapt.csstok.TokenType.BANG] = adapt.cssparse.Action.EXPR_PREFIX;
    actionsExprVal[adapt.csstok.TokenType.MINUS] = adapt.cssparse.Action.EXPR_PREFIX;
    actionsExprVal[adapt.csstok.TokenType.DOLLAR] = adapt.cssparse.Action.EXPR_PARAM;
    var actionsExprOp = adapt.cssparse.actionsExprOp;
    actionsExprOp[adapt.csstok.TokenType.IDENT] = adapt.cssparse.Action.EXPR_INFIX_NAME;
    actionsExprOp[adapt.csstok.TokenType.COMMA] = adapt.cssparse.Action.EXPR_INFIX;
    actionsExprOp[adapt.csstok.TokenType.GT] = adapt.cssparse.Action.EXPR_INFIX;
    actionsExprOp[adapt.csstok.TokenType.LT] = adapt.cssparse.Action.EXPR_INFIX;
    actionsExprOp[adapt.csstok.TokenType.GT_EQ] = adapt.cssparse.Action.EXPR_INFIX;
    actionsExprOp[adapt.csstok.TokenType.LT_EQ] = adapt.cssparse.Action.EXPR_INFIX;
    actionsExprOp[adapt.csstok.TokenType.EQ] = adapt.cssparse.Action.EXPR_INFIX;
    actionsExprOp[adapt.csstok.TokenType.EQ_EQ] = adapt.cssparse.Action.EXPR_INFIX;
    actionsExprOp[adapt.csstok.TokenType.AMP_AMP] = adapt.cssparse.Action.EXPR_INFIX;
    actionsExprOp[adapt.csstok.TokenType.BAR_BAR] = adapt.cssparse.Action.EXPR_INFIX;
    actionsExprOp[adapt.csstok.TokenType.PLUS] = adapt.cssparse.Action.EXPR_INFIX;
    actionsExprOp[adapt.csstok.TokenType.MINUS] = adapt.cssparse.Action.EXPR_INFIX;
    actionsExprOp[adapt.csstok.TokenType.SLASH] = adapt.cssparse.Action.EXPR_INFIX;
    actionsExprOp[adapt.csstok.TokenType.PERCENT] = adapt.cssparse.Action.EXPR_INFIX;
    actionsExprOp[adapt.csstok.TokenType.STAR] = adapt.cssparse.Action.EXPR_INFIX;
    actionsExprOp[adapt.csstok.TokenType.COLON] = adapt.cssparse.Action.EXPR_INFIX;
    actionsExprOp[adapt.csstok.TokenType.QMARK] = adapt.cssparse.Action.EXPR_INFIX;
    actionsExprOp[adapt.csstok.TokenType.C_PAR] = adapt.cssparse.Action.EXPR_C_PAR;
    actionsExprOp[adapt.csstok.TokenType.O_BRC] = adapt.cssparse.Action.EXPR_O_BRC;
    actionsExprOp[adapt.csstok.TokenType.SEMICOL] = adapt.cssparse.Action.EXPR_SEMICOL;
    var actionsError = adapt.cssparse.actionsError;
    actionsError[adapt.csstok.TokenType.EOF] = adapt.cssparse.Action.DONE;
    actionsError[adapt.csstok.TokenType.O_BRC] = adapt.cssparse.Action.ERROR_PUSH;
    actionsError[adapt.csstok.TokenType.C_BRC] = adapt.cssparse.Action.ERROR_POP;
    actionsError[adapt.csstok.TokenType.O_BRK] = adapt.cssparse.Action.ERROR_PUSH;
    actionsError[adapt.csstok.TokenType.C_BRK] = adapt.cssparse.Action.ERROR_POP;
    actionsError[adapt.csstok.TokenType.O_PAR] = adapt.cssparse.Action.ERROR_PUSH;
    actionsError[adapt.csstok.TokenType.C_PAR] = adapt.cssparse.Action.ERROR_POP;
    actionsError[adapt.csstok.TokenType.SEMICOL] = adapt.cssparse.Action.ERROR_SEMICOL;
    var actionsErrorDecl = adapt.cssparse.actionsErrorDecl;
    actionsErrorDecl[adapt.csstok.TokenType.EOF] = adapt.cssparse.Action.DONE;
    actionsErrorDecl[adapt.csstok.TokenType.O_BRC] = adapt.cssparse.Action.ERROR_PUSH;
    actionsErrorDecl[adapt.csstok.TokenType.C_BRC] = adapt.cssparse.Action.ERROR_POP_DECL;
    actionsErrorDecl[adapt.csstok.TokenType.O_BRK] = adapt.cssparse.Action.ERROR_PUSH;
    actionsErrorDecl[adapt.csstok.TokenType.C_BRK] = adapt.cssparse.Action.ERROR_POP;
    actionsErrorDecl[adapt.csstok.TokenType.O_PAR] = adapt.cssparse.Action.ERROR_PUSH;
    actionsErrorDecl[adapt.csstok.TokenType.C_PAR] = adapt.cssparse.Action.ERROR_POP;
    actionsErrorDecl[adapt.csstok.TokenType.SEMICOL] = adapt.cssparse.Action.ERROR_SEMICOL;
    var actionsErrorSelector = adapt.cssparse.actionsErrorSelector;
    actionsErrorSelector[adapt.csstok.TokenType.EOF] = adapt.cssparse.Action.DONE;
    actionsErrorSelector[adapt.csstok.TokenType.O_BRC] = adapt.cssparse.Action.ERROR_PUSH;
    actionsErrorSelector[adapt.csstok.TokenType.C_BRC] = adapt.cssparse.Action.ERROR_POP;
    actionsErrorSelector[adapt.csstok.TokenType.O_BRK] = adapt.cssparse.Action.ERROR_PUSH;
    actionsErrorSelector[adapt.csstok.TokenType.C_BRK] = adapt.cssparse.Action.ERROR_POP;
    actionsErrorSelector[adapt.csstok.TokenType.O_PAR] = adapt.cssparse.Action.ERROR_PUSH;
    actionsErrorSelector[adapt.csstok.TokenType.C_PAR] = adapt.cssparse.Action.ERROR_POP;

    var priority = adapt.cssparse.priority;
    priority[adapt.csstok.TokenType.C_PAR] = 0;
    priority[adapt.csstok.TokenType.COMMA] = 0;
    priority[adapt.csstok.TokenType.QMARK] = 1;
    priority[adapt.csstok.TokenType.COLON] = 1;
    priority[adapt.csstok.TokenType.AMP_AMP] = 2;
    priority[adapt.csstok.TokenType.BAR_BAR] = 2;
    priority[adapt.csstok.TokenType.LT] = 3;
    priority[adapt.csstok.TokenType.GT] = 3;
    priority[adapt.csstok.TokenType.LT_EQ] = 3;
    priority[adapt.csstok.TokenType.GT_EQ] = 3;
    priority[adapt.csstok.TokenType.EQ] = 3;
    priority[adapt.csstok.TokenType.EQ_EQ] = 3;
    priority[adapt.csstok.TokenType.BANG_EQ] = 3;
    priority[adapt.csstok.TokenType.PLUS] = 4;
    priority[adapt.csstok.TokenType.MINUS] = 4;
    priority[adapt.csstok.TokenType.STAR] = 5;
    priority[adapt.csstok.TokenType.SLASH] = 5;
    priority[adapt.csstok.TokenType.PERCENT] = 5;
    priority[adapt.csstok.TokenType.EOF] = 6;
    priority[adapt.cssparse.OP_MEDIA_AND] = 2;
})();

/**
 * @enum {number}
 */
adapt.cssparse.ExprContext = {
    PROP: 0,
    WHEN: 1,
    MEDIA: 2,
    IMPORT: 3
};

/**
 * @param {!Array.<adapt.cssparse.Action>} actions
 * @param {adapt.csstok.Tokenizer} tokenizer
 * @param {adapt.cssparse.ParserHandler} handler
 * @param {string} baseURL
 * @constructor
 */
adapt.cssparse.Parser = function(actions, tokenizer, handler, baseURL) {
	/** @type {!Array.<adapt.cssparse.Action>} */ this.actions = actions;
	/** @type {adapt.csstok.Tokenizer} */ this.tokenizer = tokenizer;
	/** @const */ this.handler = handler;
	/** @type {string} baseURL */ this.baseURL = baseURL;
    /** @type {Array.<*>} */ this.valStack = [];
    /** @type {Object.<string,string>} */ this.namespacePrefixToURI = {};
    /** @type {?string} */ this.defaultNamespaceURI = null;
    /** @type {?string} */ this.propName = null;
    /** @type {boolean} */ this.propImportant = false;
    /** @type {adapt.cssparse.ExprContext} */ this.exprContext = adapt.cssparse.ExprContext.MEDIA;
    /** @type {adapt.css.Val} */ this.result = null;
    /** @type {boolean} */ this.importReady = false;
    /** @type {?string} */ this.importURL = null;
    /** @type {adapt.css.Expr} */ this.importCondition = null;
    /** @type {Array.<number>} */ this.errorBrackets = [];
    /** @type {Array.<string>} */ this.ruleStack = [];
    /** @type {boolean} */ this.regionRule = false;
    /** @type {boolean} */ this.pageRule = false;
};

/**
 * @param {string} sep
 * @param {number} index
 * @return {Array.<adapt.css.Val>}
 */
adapt.cssparse.Parser.prototype.extractVals = function(sep, index) {
    /** @type {Array.<adapt.css.Val>} */ var arr = [];
    var valStack = this.valStack;
    while (true) {
        arr.push(valStack[index++]);
        if (index == valStack.length)
            break;
        if (valStack[index++] != sep)
            throw new Error("Unexpected state");
    }
    return arr;
};

/**
 * @param {string} sep
 * @param {adapt.csstok.Token} token
 * @return {adapt.css.Val}
 */
adapt.cssparse.Parser.prototype.valStackReduce = function (sep, token) {
	var valStack = this.valStack;
    var index = valStack.length;
    var v;
    do {
        v = valStack[--index];
    }
    while (typeof v != "undefined" && typeof v != "string");
    var count = valStack.length - (index + 1);
    if (count > 1)
        valStack.splice(index + 1, count,
            new adapt.css.SpaceList(valStack.slice(index + 1, valStack.length)));
    if (sep == ",")
        return null;
    index++;
    do {
        v = valStack[--index];
    } while (typeof v != "undefined" && (typeof v != "string" || v == ","));
    count = valStack.length - (index + 1);
    if (v == "(") {
        if (sep != ")") {
            this.handler.error("E_CSS_MISMATCHED_C_PAR", token);
            this.actions = adapt.cssparse.actionsErrorDecl;
            return null;
        }
        var func = new adapt.css.Func(/** @type {string} */ (valStack[index - 1]),
            this.extractVals(",", index + 1));
        valStack.splice(index - 1, count + 2, func);
        return null;
    }
    if (sep != ";" || index >= 0) {
        this.handler.error("E_CSS_UNEXPECTED_VAL_END", token);
        this.actions = adapt.cssparse.actionsErrorDecl;
        return null;
    }
    if (count > 1)
        return new adapt.css.CommaList(this.extractVals(",", index + 1));
    return /** @type {adapt.css.Val} */ (valStack[0]);
};

/**
 * @param {string} mnemonics
 * @param {adapt.csstok.Token} token
 */
adapt.cssparse.Parser.prototype.exprError = function(mnemonics, token) {
	this.actions = this.propName ? adapt.cssparse.actionsErrorDecl : adapt.cssparse.actionsError;
    this.handler.error(mnemonics, token);
};

/**
 * @param {number} op
 * @param {adapt.csstok.Token} token
 * @return {boolean} 
 */
adapt.cssparse.Parser.prototype.exprStackReduce = function(op, token) {
	var valStack = this.valStack;
	var handler = this.handler;
    var val = /** @type {adapt.expr.Val} */ (valStack.pop());
    /** @type {adapt.expr.Val} */ var val2;
    while (true) {
        var tok = valStack.pop();
        if (op == adapt.csstok.TokenType.C_PAR) {
        	/** @type {Array.<adapt.expr.Val>} */ var args = [val];
            while (tok == adapt.csstok.TokenType.COMMA) {
                args.unshift(valStack.pop());
                tok = valStack.pop();
            }
            if (typeof tok == "string") {
                if (tok == "{") {
                    // reached CSS portion of the stack
                    while (args.length >= 2) {
                        var e1 = args.shift();
                        var e2 = args.shift();
                        var er = new adapt.expr.OrMedia(handler.getScope(), e1, e2);
                        args.unshift(er);
                    }
                    valStack.push(new adapt.css.Expr(args[0]));
                    return true;
                } else if (tok == "(") {
                    // call
                    var name2 = /** @type {string} */ (valStack.pop());
                    var name1 = /** @type {?string} */ (valStack.pop());
                    val = new adapt.expr.Call(handler.getScope(), 
                    		adapt.expr.makeQualifiedName(name1, name2), args);
                    op = adapt.csstok.TokenType.EOF;
                    continue;
                }
            }
            if (tok == adapt.csstok.TokenType.O_PAR) {
                if (val.isMediaName()) {
                    val = new adapt.expr.MediaTest(handler.getScope(), /** @type {!adapt.expr.MediaName} */(val), null);
                }
                op = adapt.csstok.TokenType.EOF;
                continue;
            }
        } else {
            if (typeof tok == "string") {
                // reached CSS portion of the stack or a call
                valStack.push(tok);
                break;
            }
        }
        if (/** @type {number} */ (tok) < 0) {
            // prefix
            if (tok == -adapt.csstok.TokenType.BANG) {
                val = new adapt.expr.Not(handler.getScope(), val);
            } else if (tok == -adapt.csstok.TokenType.MINUS) {
                val = new adapt.expr.Negate(handler.getScope(), val);
            } else {
                this.exprError("F_UNEXPECTED_STATE", token);
                return false;
            }
        } else {
            // infix
            if (adapt.cssparse.priority[op] > adapt.cssparse.priority[tok]) {
                valStack.push(tok);
                break;
            }
            val2 = /** @type {adapt.expr.Val} */ (valStack.pop());
            switch (tok) {
                case adapt.csstok.TokenType.AMP_AMP:
                    val = new adapt.expr.And(handler.getScope(), val2, val);
                    break;
                case adapt.cssparse.OP_MEDIA_AND:
                    val = new adapt.expr.AndMedia(handler.getScope(), val2, val);
                    break;
                case adapt.csstok.TokenType.BAR_BAR:
                    val = new adapt.expr.Or(handler.getScope(), val2, val);
                    break;
                case adapt.csstok.TokenType.LT:
                    val = new adapt.expr.Lt(handler.getScope(), val2, val);
                    break;
                case adapt.csstok.TokenType.GT:
                    val = new adapt.expr.Gt(handler.getScope(), val2, val);
                    break;
                case adapt.csstok.TokenType.LT_EQ:
                    val = new adapt.expr.Le(handler.getScope(), val2, val);
                    break;
                case adapt.csstok.TokenType.GT_EQ:
                    val = new adapt.expr.Ge(handler.getScope(), val2, val);
                    break;
                case adapt.csstok.TokenType.EQ:
                case adapt.csstok.TokenType.EQ_EQ:
                    val = new adapt.expr.Eq(handler.getScope(), val2, val);
                    break;
                case adapt.csstok.TokenType.BANG_EQ:
                    val = new adapt.expr.Ne(handler.getScope(), val2, val);
                    break;
                case adapt.csstok.TokenType.PLUS:
                    val = new adapt.expr.Add(handler.getScope(), val2, val);
                    break;
                case adapt.csstok.TokenType.MINUS:
                    val = new adapt.expr.Subtract(handler.getScope(), val2, val);
                    break;
                case adapt.csstok.TokenType.STAR:
                    val = new adapt.expr.Multiply(handler.getScope(), val2, val);
                    break;
                case adapt.csstok.TokenType.SLASH:
                    val = new adapt.expr.Divide(handler.getScope(), val2, val);
                    break;
                case adapt.csstok.TokenType.PERCENT:
                    val = new adapt.expr.Modulo(handler.getScope(), val2, val);
                    break;
                case adapt.csstok.TokenType.COLON:
                    if (valStack.length > 1) {
                        switch (valStack[valStack.length - 1]) {
                            case adapt.csstok.TokenType.QMARK:
                                valStack.pop();
                                val = new adapt.expr.Cond(handler.getScope(), 
                                    /** @type {adapt.expr.Val} */ (valStack.pop()), val2, val);
                                break;
                            case adapt.csstok.TokenType.O_PAR:
                                if (val2.isMediaName()) {
                                    val = new adapt.expr.MediaTest(handler.getScope(), 
                                        /** @type {adapt.expr.MediaName} */ (val2), val);
                                } else {
                                    this.exprError("E_CSS_MEDIA_TEST", token);
                                    return false;
                                }
                                break;
                        }
                    } else {
                        this.exprError("E_CSS_EXPR_COND", token);
                        return false;
                    }
                    break;
                case adapt.csstok.TokenType.QMARK:
                    if (op != adapt.csstok.TokenType.COLON) {
                        this.exprError("E_CSS_EXPR_COND", token);
                        return false;
                    }
                    // fall through
                case adapt.csstok.TokenType.O_PAR:
                    // don't reduce
                    valStack.push(val2);
                    valStack.push(tok);
                    valStack.push(val);
                    return false;
                default:
                    this.exprError("F_UNEXPECTED_STATE", token);
                    return false;
            }
        }
    }
    valStack.push(val);
    return false;
};

/**
 * @return {Array.<number|string>}
 */
adapt.cssparse.Parser.prototype.readPseudoParams = function() {
	var arr = [];
	while (true) {
		var token = this.tokenizer.token();
		switch (token.type) {
		case adapt.csstok.TokenType.IDENT:
			arr.push(token.text);
			break;
		case adapt.csstok.TokenType.PLUS:
			arr.push("+");
			break;
		case adapt.csstok.TokenType.NUM:
		case adapt.csstok.TokenType.INT:
			arr.push(token.num);
			break;
		default:
			return arr;
		}
		this.tokenizer.consume();
	}
};

/**
 * Read `an+b` argument of pseudoclasses. Roughly based on the algorithm at https://drafts.csswg.org/css-syntax/#the-anb-type
 * @private
 * @return {?Array<number>}
 */
adapt.cssparse.Parser.prototype.readNthPseudoParams = function() {
    var hasLeadingPlus = false;

    var token = this.tokenizer.token();

    if (token.type === adapt.csstok.TokenType.PLUS) {
        // '+'
        hasLeadingPlus = true;
        this.tokenizer.consume();
        token = this.tokenizer.token();
    } else if (token.type === adapt.csstok.TokenType.IDENT && (token.text === "even" || token.text === "odd")) {
        // 'even' or 'odd'
        this.tokenizer.consume();
        return [2, token.text === "odd" ? 1 : 0];
    }

    switch (token.type) {
        case adapt.csstok.TokenType.NUMERIC:
            if (hasLeadingPlus && token.num < 0) {
                // reject '+-an'
                return null;
            }
            // FALLTHROUGH
        case adapt.csstok.TokenType.IDENT:
            if (hasLeadingPlus && token.text.charAt(0) === "-") {
                // reject '+-n'
                return null;
            }
            if (token.text === "n" || token.text === "-n") {
                // 'an', 'an +b', 'an -b', 'n', 'n +b', 'n -b', '-n', '-n +b' '-n -b'
                if (hasLeadingPlus && token.precededBySpace) {
                    // reject '+ an'
                    return null;
                }
                var a = token.text === "-n" ? -1 : 1;
                if (token.type === adapt.csstok.TokenType.NUMERIC) {
                    a = token.num;
                }
                var b = 0;

                this.tokenizer.consume();
                token = this.tokenizer.token();
                var hasMinusSign = token.type === adapt.csstok.TokenType.MINUS;
                var hasSign = token.type === adapt.csstok.TokenType.PLUS || hasMinusSign;
                if (hasSign) {
                    // 'an +b', 'an - b'
                    this.tokenizer.consume();
                    token = this.tokenizer.token();
                }
                if (token.type === adapt.csstok.TokenType.INT) {
                    b = token.num;
                    if (1/b === 1/(-0)) {
                        // negative zero: 'an -0'
                        b = 0;
                        if (hasSign) return null; // reject 'an + -0', 'an - -0'
                    } else if (b < 0) {
                        // negative: 'an -b'
                        if (hasSign) return null; // reject 'an + -b', 'an - -b'
                    } else if (b >= 0) {
                        // positive or positive zero: 'an +b'
                        if (!hasSign) return null;
                    }
                    this.tokenizer.consume();
                } else if (hasSign) {
                    // reject 'an + (non-integer)'
                    return null;
                }
                return [a, hasMinusSign && b > 0 ? -b : b];
            } else if (token.text === "n-" || token.text === "-n-") {
                // 'an- b', '-n- b'
                if (hasLeadingPlus && token.precededBySpace) {
                    // reject '+ an- b'
                    return null;
                }
                var a = token.text === "-n-" ? -1 : 1;
                if (token.type === adapt.csstok.TokenType.NUMERIC) {
                    a = token.num;
                }
                this.tokenizer.consume();
                token = this.tokenizer.token();
                if (token.type === adapt.csstok.TokenType.INT) {
                    if (token.num < 0 || 1/token.num === 1/(-0)) {
                        // reject 'an- -b', 'an- -0'
                        return null;
                    } else {
                        this.tokenizer.consume();
                        return [a, token.num];
                    }
                }
            } else {
                var r = token.text.match(/^n(-[0-9]+)$/);
                if (r) {
                    // 'n-b', 'an-b'
                    if (hasLeadingPlus && token.precededBySpace) {
                        // reject '+ an-b'
                        return null;
                    }
                    this.tokenizer.consume();
                    return [token.type === adapt.csstok.TokenType.NUMERIC ? token.num : 1, parseInt(r[1], 10)];
                }
                r = token.text.match(/^-n(-[0-9]+)$/);
                // '-n-b'
                if (r) {
                    this.tokenizer.consume();
                    return [-1, parseInt(r[1], 10)];
                }
            }
            return null;
        case adapt.csstok.TokenType.INT:
            if (hasLeadingPlus && (token.precededBySpace || token.num < 0)) {
                return null;
            }
            this.tokenizer.consume();
            return [0, token.num];
    }
    return null;
};

/**
 * @param {?string} classes
 * @param {adapt.expr.Val} condition
 * @return {adapt.css.Expr}
 */
adapt.cssparse.Parser.prototype.makeCondition = function(classes, condition) {
	var scope = this.handler.getScope();
	if (!scope)
		return null;
	condition = condition || scope._true;
	if (classes) {
		var classList = classes.split(/\s+/);
		for (var i = 0; i < classList.length; i++) {
			var className = classList[i];
			switch(className) {
			case "vertical":
				condition = adapt.expr.and(scope, condition, new adapt.expr.Not(scope, new adapt.expr.Named(scope, "pref-horizontal")));
				break;
			case "horizontal":
				condition = adapt.expr.and(scope, condition, new adapt.expr.Named(scope, "pref-horizontal"));
				break;
			case "day":
				condition = adapt.expr.and(scope, condition, new adapt.expr.Not(scope, new adapt.expr.Named(scope, "pref-night-mode")));
				break;
			case "night":
				condition = adapt.expr.and(scope, condition, new adapt.expr.Named(scope, "pref-night-mode"));
				break;
			default:
				condition = scope._false;
			}
		}
	}
	if (condition === scope._true) {
		return null;
	}
	return new adapt.css.Expr(condition);
};

/**
 * @returns {boolean}
 */
adapt.cssparse.Parser.prototype.isInsidePropertyOnlyRule = function() {
	switch (this.ruleStack[this.ruleStack.length-1]) {
	case "[selector]":
	case "font-face":
	case "-epubx-flow":
	case "-epubx-viewport":
	case "-epubx-define":
	case "-adapt-footnote-area":
		return true;
	}
	return false;
};

/**
 * @param {number} count
 * @param {boolean} parsingStyleAttr
 * @return {boolean} 
 */
adapt.cssparse.Parser.prototype.runParser = function(count, parsingValue, parsingStyleAttr, parsingMediaQuery, parsingFunctionParam) {
	var handler = this.handler;
	var tokenizer = this.tokenizer;
    var valStack = this.valStack;
    
    /** @type {adapt.csstok.Token} */ var token;
    /** @type {adapt.csstok.Token} */ var token1;
    /** @type {?string} */ var ns;
    /** @type {?string} */ var text;
    /** @type {number} */ var num;
    /** @type {adapt.css.Val} */ var val;
    /** @type {Array.<number|string>} */ var params;

    if (parsingMediaQuery) {
        this.exprContext = adapt.cssparse.ExprContext.MEDIA;
        this.valStack.push("{");
    }
    
    parserLoop: for(; count > 0; --count) {
        token = tokenizer.token();
        switch (this.actions[token.type]) {
	        case adapt.cssparse.Action.IDENT:
	            // figure out if this is a property assignment or selector
	            if (tokenizer.nthToken(1).type != adapt.csstok.TokenType.COLON) {
	                // cannot be property assignment
	            	if (this.isInsidePropertyOnlyRule()) {
                		handler.error("E_CSS_COLON_EXPECTED", tokenizer.nthToken(1));
                    	this.actions = adapt.cssparse.actionsErrorDecl;	            		
	            	} else {
	            		this.actions = adapt.cssparse.actionsSelectorStart;
	            		handler.startSelectorRule();
	            	}
	                continue;
	            }
	            token1 = tokenizer.nthToken(2);
	            if (token1.precededBySpace || (token1.type != adapt.csstok.TokenType.IDENT &&
	                    token1.type != adapt.csstok.TokenType.FUNC)) {
	                        // cannot be a selector
	            } else {
	                // can be either a selector or a property assignment
	                tokenizer.mark();
	            }
	            this.propName = token.text;
	            this.propImportant = false;
	            tokenizer.consume();
	            tokenizer.consume();
	            this.actions = adapt.cssparse.actionsPropVal;
	            valStack.splice(0, valStack.length);
	            continue;
	        case adapt.cssparse.Action.PROP:
	            // figure out if this is a property assignment or selector
	            if (tokenizer.nthToken(1).type != adapt.csstok.TokenType.COLON) {
	                // cannot be property assignment
                    this.actions = adapt.cssparse.actionsErrorDecl;
                    handler.error("E_CSS_COLON_EXPECTED", tokenizer.nthToken(1));
	                continue;
	            }
	            this.propName = token.text;
	            this.propImportant = false;
	            tokenizer.consume();
	            tokenizer.consume();
	            this.actions = adapt.cssparse.actionsPropVal;
	            valStack.splice(0, valStack.length);
	            continue;
            case adapt.cssparse.Action.SELECTOR_START:
                // don't consume, process again
                this.actions = adapt.cssparse.actionsSelectorStart;
                handler.startSelectorRule();
                continue;
            case adapt.cssparse.Action.SELECTOR_NAME_1:
            	if (!token.precededBySpace) {
                    this.actions = adapt.cssparse.actionsErrorSelector;
                    handler.error("E_CSS_SPACE_EXPECTED", token);
                    continue;
            	}
                handler.descendantSelector();
            // fall through
            case adapt.cssparse.Action.SELECTOR_NAME:
                if (tokenizer.nthToken(1).type == adapt.csstok.TokenType.BAR) {
                    tokenizer.consume();
                    tokenizer.consume();
                    ns = this.namespacePrefixToURI[token.text];
                    if (ns != null) {
                        token = tokenizer.token();
                        switch (token.type) {
                            case adapt.csstok.TokenType.IDENT:
                                handler.tagSelector(ns, token.text);
                                this.actions = adapt.cssparse.actionsSelector;
                                tokenizer.consume();
                                break;
                            case adapt.csstok.TokenType.STAR:
                                handler.tagSelector(ns, null);
                                this.actions = adapt.cssparse.actionsSelector;
                                tokenizer.consume();
                                break;
                            default:
                                this.actions = adapt.cssparse.actionsError;
                                handler.error("E_CSS_NAMESPACE", token);
                        }
                    } else {
                        this.actions = adapt.cssparse.actionsError;
                        handler.error("E_CSS_UNDECLARED_PREFIX", token);
                    }
                } else {
                    handler.tagSelector(this.defaultNamespaceURI, token.text);
                    this.actions = adapt.cssparse.actionsSelector;
                    tokenizer.consume();
                }
                continue;
            case adapt.cssparse.Action.SELECTOR_ANY_1:
            	if (!token.precededBySpace) {
                    this.actions = adapt.cssparse.actionsErrorSelector;
                    handler.error("E_CSS_SPACE_EXPECTED", token);
                    continue;
            	}
                handler.descendantSelector();
            // fall through
            case adapt.cssparse.Action.SELECTOR_ANY:
                if (tokenizer.nthToken(1).type == adapt.csstok.TokenType.BAR) {
                    tokenizer.consume();
                    tokenizer.consume();
                    token = tokenizer.token();
                    switch (token.type) {
                        case adapt.csstok.TokenType.IDENT:
                            handler.tagSelector(null, token.text);
                            this.actions = adapt.cssparse.actionsSelector;
                            tokenizer.consume();
                            break;
                        case adapt.csstok.TokenType.STAR:
                            handler.tagSelector(null, null);
                            this.actions = adapt.cssparse.actionsSelector;
                            tokenizer.consume();
                            break;
                        default:
                            this.actions = adapt.cssparse.actionsError;
                            handler.error("E_CSS_NAMESPACE", token);
                    }
                } else {
                    handler.tagSelector(this.defaultNamespaceURI, null);
                    this.actions = adapt.cssparse.actionsSelector;
                    tokenizer.consume();
                }
                continue;
            case adapt.cssparse.Action.SELECTOR_ID_1:
                if (token.precededBySpace)
                    handler.descendantSelector();
                // fall through
            case adapt.cssparse.Action.SELECTOR_ID:
                handler.idSelector(token.text);
                this.actions = adapt.cssparse.actionsSelector;
                tokenizer.consume();
                continue;
            case adapt.cssparse.Action.SELECTOR_CLASS_1:
                if (token.precededBySpace)
                    handler.descendantSelector();
                // fall through
            case adapt.cssparse.Action.SELECTOR_CLASS:
                handler.classSelector(token.text);
                this.actions = adapt.cssparse.actionsSelector;
                tokenizer.consume();
                continue;
            case adapt.cssparse.Action.SELECTOR_PSEUDOCLASS_1:
                if (token.precededBySpace)
                    handler.descendantSelector();
                // fall through
            case adapt.cssparse.Action.SELECTOR_PSEUDOCLASS:
                tokenizer.consume();
                token = tokenizer.token();
                pseudoclassType: switch (token.type) {
                    case adapt.csstok.TokenType.IDENT:
                        handler.pseudoclassSelector(token.text, null);
                        tokenizer.consume();
                        this.actions = adapt.cssparse.actionsSelector;
                        continue;
                    case adapt.csstok.TokenType.FUNC:
                        text = token.text;
                        tokenizer.consume();
                        switch (text) {
                          case "not":
                               this.actions = adapt.cssparse.actionsSelectorStart;
                               handler.startNotRule();
                               this.runParser(Number.POSITIVE_INFINITY, false, false, false, true);
                               this.actions = adapt.cssparse.actionsSelector;
                               break parserLoop;
                            case "lang":
                            case "href-epub-type":
                                token = tokenizer.token();
                                if (token.type === adapt.csstok.TokenType.IDENT) {
                                    params = [token.text];
                                    tokenizer.consume();
                                    break;
                                } else {
                                    break pseudoclassType;
                                }
                            case "nth-child":
                            case "nth-of-type":
                            case "nth-last-child":
                            case "nth-last-of-type":
                                params = this.readNthPseudoParams();
                                if (!params) {
                                    break pseudoclassType;
                                } else {
                                    break;
                                }
                            default: // TODO
                                params = this.readPseudoParams();
                        }
                        token = tokenizer.token();
                        if (token.type == adapt.csstok.TokenType.C_PAR) {
                            handler.pseudoclassSelector(/** @type {string} */ (text), params);
                            tokenizer.consume();
                            this.actions = adapt.cssparse.actionsSelector;
                            continue;
                        }
                        break;
                }
                handler.error("E_CSS_PSEUDOCLASS_SYNTAX", token);
                this.actions = adapt.cssparse.actionsError;
                continue;
            case adapt.cssparse.Action.SELECTOR_PSEUDOELEM:
                tokenizer.consume();
                token = tokenizer.token();
                switch (token.type) {
                    case adapt.csstok.TokenType.IDENT:
                        handler.pseudoelementSelector(token.text, null);
                        this.actions = adapt.cssparse.actionsSelector;
                        tokenizer.consume();
                        continue;
                    case adapt.csstok.TokenType.FUNC:
                        text = token.text;
                        tokenizer.consume();
                        params = this.readPseudoParams();
                        token = tokenizer.token();
                        if (token.type == adapt.csstok.TokenType.C_PAR) {
                            handler.pseudoelementSelector(/** @type {string} */ (text), params);
                            this.actions = adapt.cssparse.actionsSelector;
                            tokenizer.consume();
                            continue;
                        }
                        break;
                }
                handler.error("E_CSS_PSEUDOELEM_SYNTAX", token);
                this.actions = adapt.cssparse.actionsError;
                continue;
            case adapt.cssparse.Action.SELECTOR_ATTR_1:
                if (token.precededBySpace)
                    handler.descendantSelector();
            // fall through
            case adapt.cssparse.Action.SELECTOR_ATTR:
                tokenizer.consume();
                token = tokenizer.token();
                if (token.type == adapt.csstok.TokenType.IDENT) {
                    text = token.text;
                    tokenizer.consume();
                } else if (token.type == adapt.csstok.TokenType.STAR) {
                    text = null;
                    tokenizer.consume();
                } else if (token.type == adapt.csstok.TokenType.BAR) {
                    text = "";
                } else {
                    this.actions = adapt.cssparse.actionsErrorSelector;
                    handler.error("E_CSS_ATTR", token);
                    tokenizer.consume();
                    continue;
                }
                token = tokenizer.token();
                if (token.type == adapt.csstok.TokenType.BAR) {
                    ns = text ? this.namespacePrefixToURI[text] : text;
                    if (ns == null) {
                        this.actions = adapt.cssparse.actionsErrorSelector;
                        handler.error("E_CSS_UNDECLARED_PREFIX", token);
                        tokenizer.consume();
                        continue;
                    }
                    tokenizer.consume();
                    token = tokenizer.token();
                    if (token.type != adapt.csstok.TokenType.IDENT) {
                        this.actions = adapt.cssparse.actionsErrorSelector;
                        handler.error("E_CSS_ATTR_NAME_EXPECTED", token);
                        continue;
                    }
                    text = token.text;
                    tokenizer.consume();
                    token = tokenizer.token();
                } else {
                    ns = "";
                }
                switch (token.type) {
                    case adapt.csstok.TokenType.EQ:
                    case adapt.csstok.TokenType.TILDE_EQ:
                    case adapt.csstok.TokenType.BAR_EQ:
                    case adapt.csstok.TokenType.HAT_EQ:
                    case adapt.csstok.TokenType.DOLLAR_EQ:
                    case adapt.csstok.TokenType.STAR_EQ:
                    case adapt.csstok.TokenType.COL_COL:
                        num = token.type;
                        tokenizer.consume();
                        token = tokenizer.token();
                        break;
                    case adapt.csstok.TokenType.C_BRK:
                        handler.attributeSelector(/** @type {string} */ (ns),
                        		/** @type {string} */ (text), adapt.csstok.TokenType.EOF, null);
                        this.actions = adapt.cssparse.actionsSelector;
                        tokenizer.consume();
                        continue;
                    default:
                        this.actions = adapt.cssparse.actionsErrorSelector;
                        handler.error("E_CSS_ATTR_OP_EXPECTED", token);
                        continue;
                }
                switch (token.type) {
                    case adapt.csstok.TokenType.IDENT:
                    case adapt.csstok.TokenType.STR:
                        handler.attributeSelector(/** @type {string} */ (ns),
                        		/** @type {string} */ (text), num, token.text);
                        tokenizer.consume();
                        token = tokenizer.token();
                        break;
                    default:
                        this.actions = adapt.cssparse.actionsErrorSelector;
                        handler.error("E_CSS_ATTR_VAL_EXPECTED", token);
                        continue;
                }
                if (token.type != adapt.csstok.TokenType.C_BRK) {
                    this.actions = adapt.cssparse.actionsErrorSelector;
                    handler.error("E_CSS_ATTR", token);
                    continue;
                }
                this.actions = adapt.cssparse.actionsSelector;
                tokenizer.consume();
                continue;
            case adapt.cssparse.Action.SELECTOR_CHILD:
                handler.childSelector();
                this.actions = adapt.cssparse.actionsSelectorCont;
                tokenizer.consume();
                continue;
            case adapt.cssparse.Action.SELECTOR_SIBLING:
                handler.adjacentSiblingSelector();
                this.actions = adapt.cssparse.actionsSelectorCont;
                tokenizer.consume();
                continue;
            case adapt.cssparse.Action.SELECTOR_FOLLOWING_SIBLING:
                handler.followingSiblingSelector();
                this.actions = adapt.cssparse.actionsSelectorCont;
                tokenizer.consume();
                continue;
            case adapt.cssparse.Action.SELECTOR_BODY:
            	if (this.regionRule) {
                	this.ruleStack.push("-epubx-region");            		
                	this.regionRule = false;
                } else if (this.pageRule) {
                    this.ruleStack.push("page");
                    this.pageRule = false;
            	} else {
            		this.ruleStack.push("[selector]");
            	}
                handler.startRuleBody();
                this.actions = adapt.cssparse.actionsBase;
                tokenizer.consume();
                continue;
            case adapt.cssparse.Action.SELECTOR_NEXT:
                handler.nextSelector();
                this.actions = adapt.cssparse.actionsSelectorStart;
                tokenizer.consume();
                continue;
            case adapt.cssparse.Action.VAL_IDENT:
                valStack.push(adapt.css.getName(token.text));
                tokenizer.consume();
                continue;
            case adapt.cssparse.Action.VAL_HASH:
                num = parseInt(token.text, 16);
                try {
                    valStack.push(adapt.cssparse.colorFromHash(token.text));
                } catch (err) {
                    handler.error("E_CSS_COLOR", token);
                    this.actions = adapt.cssparse.actionsError;
                }
                tokenizer.consume();
                continue;
            case adapt.cssparse.Action.VAL_NUM:
                valStack.push(new adapt.css.Num(token.num));
                tokenizer.consume();
                continue;
            case adapt.cssparse.Action.VAL_INT:
                valStack.push(new adapt.css.Int(token.num));
                tokenizer.consume();
                continue;
            case adapt.cssparse.Action.VAL_NUMERIC:
                valStack.push(new adapt.css.Numeric(token.num, token.text));
                tokenizer.consume();
                continue;
            case adapt.cssparse.Action.VAL_STR:
                valStack.push(new adapt.css.Str(token.text));
                tokenizer.consume();
                continue;
            case adapt.cssparse.Action.VAL_URL:
                valStack.push(new adapt.css.URL(adapt.base.resolveURL(token.text, this.baseURL)));
                tokenizer.consume();
                continue;
            case adapt.cssparse.Action.VAL_COMMA:
                this.valStackReduce(",", token);
                valStack.push(",");
                tokenizer.consume();
                continue;
            case adapt.cssparse.Action.VAL_SLASH:
                valStack.push(adapt.css.slash);
                tokenizer.consume();
                continue;
            case adapt.cssparse.Action.VAL_FUNC:
                text = token.text.toLowerCase();
                if (text == "-epubx-expr") {
                    // special case
                    this.actions = adapt.cssparse.actionsExprVal;
                    this.exprContext = adapt.cssparse.ExprContext.PROP;
                    valStack.push("{");
                } else {
                    valStack.push(text);
                    valStack.push("(");
                }
                tokenizer.consume();
                continue;
            case adapt.cssparse.Action.VAL_C_PAR:
                this.valStackReduce(")", token);
                tokenizer.consume();
                continue;
            case adapt.cssparse.Action.VAL_BANG:
                tokenizer.consume();
                token = tokenizer.token();
                token1 = tokenizer.nthToken(1);
                if (token.type == adapt.csstok.TokenType.IDENT && 
                	token.text.toLowerCase() == "important" && 
                	(token1.type == adapt.csstok.TokenType.SEMICOL || 
                			token1.type == adapt.csstok.TokenType.EOF ||
                			token1.type == adapt.csstok.TokenType.C_BRC)) {
                    tokenizer.consume();
                	this.propImportant = true;
                	continue;
                }
                this.exprError("E_CSS_SYNTAX", token);
                continue;
            case adapt.cssparse.Action.VAL_PLUS:
                token1 = tokenizer.nthToken(1);
                switch (token1.type) {
                case adapt.csstok.TokenType.NUM:
                case adapt.csstok.TokenType.NUMERIC:
                case adapt.csstok.TokenType.INT:
                	if (!token1.precededBySpace) {
                		// Plus before number, ignore
                        tokenizer.consume();
                        continue;
                	}
                }
                this.exprError("E_CSS_UNEXPECTED_PLUS", token);
            	continue;
            case adapt.cssparse.Action.VAL_END:
                tokenizer.consume();
                // fall through
            case adapt.cssparse.Action.VAL_BRC:
                tokenizer.unmark();
                val = this.valStackReduce(";", token);
                if (val && this.propName) {
                    handler.property(/** @type {string} */ (this.propName), val, this.propImportant);
                }
                this.actions = parsingStyleAttr ? 
                    	adapt.cssparse.actionsStyleAttribute : adapt.cssparse.actionsBase;
                continue;
             case adapt.cssparse.Action.VAL_FINISH:
                tokenizer.consume();
                tokenizer.unmark();
                val = this.valStackReduce(";", token);
                if (parsingValue) {
                	this.result = val;
                	return true;
                }
                if (this.propName && val) {
                	handler.property(/** @type {string} */ (this.propName), val, this.propImportant);
                }
                if (parsingStyleAttr) {
                	return true;
                }	
                this.exprError("E_CSS_SYNTAX", token);
                continue;
            case adapt.cssparse.Action.EXPR_IDENT:
                token1 = tokenizer.nthToken(1);
                if (token1.type == adapt.csstok.TokenType.CLASS) {
                    if (tokenizer.nthToken(2).type == adapt.csstok.TokenType.O_PAR &&
                        !tokenizer.nthToken(2).precededBySpace) {
                        valStack.push(token.text, token1.text, "(");
                        tokenizer.consume();
                    } else {
                        valStack.push(new adapt.expr.Named(handler.getScope(), adapt.expr.makeQualifiedName(token.text, token1.text)));
                        this.actions = adapt.cssparse.actionsExprOp;
                    }
                    tokenizer.consume();
                } else {
                    if (this.exprContext == adapt.cssparse.ExprContext.MEDIA
                    		|| this.exprContext == adapt.cssparse.ExprContext.IMPORT) {
                        if (token.text.toLowerCase() == "not") {
                            tokenizer.consume();
                            valStack.push(new adapt.expr.MediaName(handler.getScope(), true, token1.text));
                        } else {
                            if (token.text.toLowerCase() == "only") {
                                tokenizer.consume();
                                token = token1;
                            }
                            valStack.push(new adapt.expr.MediaName(handler.getScope(), false, token.text));
                        }
                    } else {
                        valStack.push(new adapt.expr.Named(handler.getScope(), token.text));
                    }
                    this.actions = adapt.cssparse.actionsExprOp;
                }
                tokenizer.consume();
                continue;
            case adapt.cssparse.Action.EXPR_FUNC:
                valStack.push(null, token.text, "(");
                tokenizer.consume();
                continue;
            case adapt.cssparse.Action.EXPR_NUM:
                valStack.push(new adapt.expr.Const(handler.getScope(), token.num));
                tokenizer.consume();
                this.actions = adapt.cssparse.actionsExprOp;
                continue;
            case adapt.cssparse.Action.EXPR_NUMERIC:
                text = token.text;
                if (text == "%") {
                    if (this.propName && this.propName.match(/height|^(top|bottom)$/))
                        text = "vh";
                    else
                        text = "vw";
                }
                valStack.push(new adapt.expr.Numeric(handler.getScope(), token.num, text));
                tokenizer.consume();
                this.actions = adapt.cssparse.actionsExprOp;
                continue;
            case adapt.cssparse.Action.EXPR_STR:
                valStack.push(new adapt.expr.Const(handler.getScope(), token.text));
                tokenizer.consume();
                this.actions = adapt.cssparse.actionsExprOp;
                continue;
            case adapt.cssparse.Action.EXPR_PARAM:
                tokenizer.consume();
                token = tokenizer.token();
                if (token.type != adapt.csstok.TokenType.INT || token.precededBySpace) {
                    this.exprError("E_CSS_SYNTAX", token);
                } else {
                    valStack.push(new adapt.expr.Param(handler.getScope(), token.num));
                    tokenizer.consume();
                    this.actions = adapt.cssparse.actionsExprOp;
                }
                continue;
            case adapt.cssparse.Action.EXPR_PREFIX:
                valStack.push(-token.type);
                tokenizer.consume();
                continue;
            case adapt.cssparse.Action.EXPR_INFIX:
                this.actions = adapt.cssparse.actionsExprVal;
                this.exprStackReduce(token.type, token);
                valStack.push(token.type);
                tokenizer.consume();
                continue;
            case adapt.cssparse.Action.EXPR_INFIX_NAME:
                if (token.text.toLowerCase() == "and") {
                    this.actions = adapt.cssparse.actionsExprVal;
                    this.exprStackReduce(adapt.cssparse.OP_MEDIA_AND, token);
                    valStack.push(adapt.cssparse.OP_MEDIA_AND);
                    tokenizer.consume();
                } else {
                    this.exprError("E_CSS_SYNTAX", token);
                }
                continue;
            case adapt.cssparse.Action.EXPR_C_PAR:
                if (this.exprStackReduce(token.type, token)) {
                    if (this.propName) {
                        this.actions = adapt.cssparse.actionsPropVal;
                    } else {
                        this.exprError("E_CSS_UNBALANCED_PAR", token);
                    }
                }
                tokenizer.consume();
                continue;
            case adapt.cssparse.Action.EXPR_O_BRC:
                if (this.exprStackReduce(adapt.csstok.TokenType.C_PAR, token)) {
                    if (this.propName || this.exprContext == adapt.cssparse.ExprContext.IMPORT) {
                        this.exprError("E_CSS_UNEXPECTED_BRC", token);
                    } else {
                        if (this.exprContext == adapt.cssparse.ExprContext.WHEN)
                            handler.startWhenRule(/** @type {adapt.css.Expr} */ (valStack.pop()));
                        else
                            handler.startMediaRule(/** @type {adapt.css.Expr} */ (valStack.pop()));
                    	this.ruleStack.push("media");
                        handler.startRuleBody();
                        this.actions = adapt.cssparse.actionsBase;
                    }
                }
                tokenizer.consume();
                continue;
            case adapt.cssparse.Action.EXPR_SEMICOL:
                if (this.exprStackReduce(adapt.csstok.TokenType.C_PAR, token)) {
                    if (this.propName || this.exprContext != adapt.cssparse.ExprContext.IMPORT) {
                    	this.exprError("E_CSS_UNEXPECTED_SEMICOL", token);
                    } else {
                    	this.importCondition = /** @type {adapt.css.Expr} */ (valStack.pop());
                    	this.importReady = true;
                        this.actions = adapt.cssparse.actionsBase;
                        tokenizer.consume();
                        return false;
                    }
                }
                tokenizer.consume();
                continue;
            case adapt.cssparse.Action.EXPR_O_PAR:
                valStack.push(token.type);
                tokenizer.consume();
                continue;
            case adapt.cssparse.Action.RULE_END:
                this.actions = adapt.cssparse.actionsBase;
                tokenizer.consume();
                handler.endRule();
                if (this.ruleStack.length) {
                	this.ruleStack.pop();
                }
                continue;
            case adapt.cssparse.Action.AT:
                text = token.text.toLowerCase();
                switch (text) {
            		case "import":
                		tokenizer.consume();
                		token = tokenizer.token();
                		if (token.type == adapt.csstok.TokenType.STR ||
                				token.type == adapt.csstok.TokenType.URL) {
                			this.importURL = token.text;
                    		tokenizer.consume();
                    		token = tokenizer.token();
                    		if (token.type == adapt.csstok.TokenType.SEMICOL || token.type == adapt.csstok.TokenType.EOF) {
                    			this.importReady = true;
                        		tokenizer.consume();
                    			return false;
                    		} else {
                                this.propName = null; // signals @ rule
                                this.exprContext = adapt.cssparse.ExprContext.IMPORT;
                                this.actions = adapt.cssparse.actionsExprVal;
                                valStack.push("{");
                                continue;
                    		}
                		}
                        handler.error("E_CSS_IMPORT_SYNTAX", token);
                        this.actions = adapt.cssparse.actionsError;
                        continue;
            		case "namespace":
                		tokenizer.consume();
                		token = tokenizer.token();
                		switch (token.type) {
                			case adapt.csstok.TokenType.IDENT:
                				text = token.text;  // Prefix
                        		tokenizer.consume();
                        		token = tokenizer.token();
                				if ((token.type == adapt.csstok.TokenType.STR || 
                						token.type == adapt.csstok.TokenType.URL) &&
                						tokenizer.nthToken(1).type == adapt.csstok.TokenType.SEMICOL) {
                					this.namespacePrefixToURI[text] = token.text;
                            		tokenizer.consume();
                            		tokenizer.consume();
                            		continue;
                				}
                				break;
                			case adapt.csstok.TokenType.STR:
                			case adapt.csstok.TokenType.URL:
                				if (tokenizer.nthToken(1).type == adapt.csstok.TokenType.SEMICOL) {
	                				this.defaultNamespaceURI = token.text;
	                        		tokenizer.consume();
	                        		tokenizer.consume();
	                        		continue;
                				}
                				break;
                		}
                        handler.error("E_CSS_NAMESPACE_SYNTAX", token);
                        this.actions = adapt.cssparse.actionsError;
                        continue;
            		case "charset":
            			// Useless in EPUB (only UTF-8 or UTF-16 is allowed anyway and
            			// we are at the mercy of the browser charset handling anyway).
                		tokenizer.consume();
                		token = tokenizer.token();
                		if (token.type == adapt.csstok.TokenType.STR && 
                				tokenizer.nthToken(1).type == adapt.csstok.TokenType.SEMICOL) {
            				text = token.text.toLowerCase();
            				if (text != "utf-8" && text != "utf-16") {
                                handler.error("E_CSS_UNEXPECTED_CHARSET " + text, token);            					
            				}
            				tokenizer.consume();
            				tokenizer.consume();
            				continue;
                		}
                        handler.error("E_CSS_CHARSET_SYNTAX", token);
                        this.actions = adapt.cssparse.actionsError;
                        continue;                		
                    case "font-face":
                    case "-epubx-page-template":
                    case "-epubx-define":
                    case "-epubx-viewport":
                        if (tokenizer.nthToken(1).type == adapt.csstok.TokenType.O_BRC) {
                            tokenizer.consume();
                            tokenizer.consume();
                            switch (text) {
                                case "font-face":
                                    handler.startFontFaceRule();
                                    break;
                                case "-epubx-page-template":
                                    handler.startPageTemplateRule();
                                    break;
                                case "-epubx-define":
                                    handler.startDefineRule();
                                    break;
                                case "-epubx-viewport":
                                    handler.startViewportRule();
                                    break;
                            }
                        	this.ruleStack.push(text);
                            handler.startRuleBody();
                            continue;
                        }
                        break;
                    case "-adapt-footnote-area":
                        tokenizer.consume();
                		token = tokenizer.token();
                		switch (token.type) {
                			case adapt.csstok.TokenType.O_BRC:
                                tokenizer.consume();
		                    	handler.startFootnoteRule(null);
		                    	this.ruleStack.push(text);		                    	
		                    	handler.startRuleBody();
		                    	continue;
                			case adapt.csstok.TokenType.COL_COL:
                                tokenizer.consume();
                        		token = tokenizer.token();
                        		if (token.type == adapt.csstok.TokenType.IDENT &&
                        				tokenizer.nthToken(1).type == adapt.csstok.TokenType.O_BRC) {
                        			text = token.text;
                                    tokenizer.consume();
                                    tokenizer.consume();
    		                    	handler.startFootnoteRule(text);
    		                    	this.ruleStack.push("-adapt-footnote-area");		                    	
    		                    	handler.startRuleBody();
    		                    	continue;                        			
                        		}
                				break;
                		}
                    	break;
                    case "-epubx-region":
                        tokenizer.consume();
                        handler.startRegionRule();
                        this.regionRule = true;
                        this.actions = adapt.cssparse.actionsSelectorStart;
                        continue;
                    case "page":
                        tokenizer.consume();
                        handler.startPageRule();
                        this.pageRule = true;
                        this.actions = adapt.cssparse.actionsSelectorCont;
                        continue;
                    case "top-left-corner":
                    case "top-left":
                    case "top-center":
                    case "top-right":
                    case "top-right-corner":
                    case "right-top":
                    case "right-middle":
                    case "right-bottom":
                    case "bottom-right-corner":
                    case "bottom-right":
                    case "bottom-center":
                    case "bottom-left":
                    case "bottom-left-corner":
                    case "left-bottom":
                    case "left-middle":
                    case "left-top":
                        tokenizer.consume();
                        token = tokenizer.token();
                        if (token.type == adapt.csstok.TokenType.O_BRC) {
                            tokenizer.consume();
                            handler.startPageMarginBoxRule(text);
                            this.ruleStack.push(text);
                            handler.startRuleBody();
                            continue;
                        }
                        break;
                    case "-epubx-when":
                        tokenizer.consume();
                        this.propName = null; // signals @ rule
                        this.exprContext = adapt.cssparse.ExprContext.WHEN;
                        this.actions = adapt.cssparse.actionsExprVal;
                        valStack.push("{");
                        continue;
                    case "media":
                        tokenizer.consume();
                        this.propName = null; // signals @ rule
                        this.exprContext = adapt.cssparse.ExprContext.MEDIA;
                        this.actions = adapt.cssparse.actionsExprVal;
                        valStack.push("{");
                        continue;
                    case "-epubx-flow":
                        if (tokenizer.nthToken(1).type == adapt.csstok.TokenType.IDENT && 
                            tokenizer.nthToken(2).type == adapt.csstok.TokenType.O_BRC) {
                            handler.startFlowRule(tokenizer.nthToken(1).text);
                            tokenizer.consume();
                            tokenizer.consume();
                            tokenizer.consume();
                        	this.ruleStack.push(text);
                            handler.startRuleBody();
                            continue;
                        }
                        break;
                    case "-epubx-page-master":
                    case "-epubx-partition":
                    case "-epubx-partition-group":
                        tokenizer.consume();
                        token = tokenizer.token();
                        /** @type {?string} */ var ruleName = null;
                        /** @type {?string} */ var rulePseudoName = null;
                        /** @type {Array.<string>} */ var classes = [];
                        if (token.type == adapt.csstok.TokenType.IDENT) {
                            ruleName = token.text;
                            tokenizer.consume();
                            token = tokenizer.token();
                        }
                        if (token.type == adapt.csstok.TokenType.COLON &&
                        		tokenizer.nthToken(1).type == adapt.csstok.TokenType.IDENT) {
                        	rulePseudoName = tokenizer.nthToken(1).text;
                            tokenizer.consume();
                            tokenizer.consume();
                            token = tokenizer.token();
                        }
                        while (token.type == adapt.csstok.TokenType.FUNC && token.text.toLowerCase() == "class" &&
                                tokenizer.nthToken(1).type == adapt.csstok.TokenType.IDENT &&
                                tokenizer.nthToken(2).type == adapt.csstok.TokenType.C_PAR) {
                            classes.push(tokenizer.nthToken(1).text);
                            tokenizer.consume();
                            tokenizer.consume();
                            tokenizer.consume();
                            token = tokenizer.token();
                        }
                        if (token.type == adapt.csstok.TokenType.O_BRC) {
                            tokenizer.consume();
                            switch (text) {
                                case "-epubx-page-master":
                                    handler.startPageMasterRule(ruleName, rulePseudoName, classes);
                                    break;
                                case "-epubx-partition":
                                    handler.startPartitionRule(ruleName, rulePseudoName, classes);
                                    break;
                                case "-epubx-partition-group":
                                    handler.startPartitionGroupRule(ruleName, rulePseudoName, classes);
                                    break;
                            }
                        	this.ruleStack.push(text);
                            handler.startRuleBody();
                            continue;
                        }
                        break;
					case "":
						// No text after @
                        handler.error("E_CSS_UNEXPECTED_AT" + text, token);
                        // Error recovery using selector rules.
                        this.actions = adapt.cssparse.actionsErrorSelector;
						continue;
                    default:
                        handler.error("E_CSS_AT_UNKNOWN " + text, token);
                        this.actions = adapt.cssparse.actionsError;
                        continue;
                }
                handler.error("E_CSS_AT_SYNTAX " + text, token);
                this.actions = adapt.cssparse.actionsError;
                continue;
            case adapt.cssparse.Action.ERROR_PUSH:  // Open bracket while skipping error syntax
            	if (parsingValue || parsingStyleAttr)
            		return true;
            	this.errorBrackets.push(token.type + 1);  // Expected closing bracket
                tokenizer.consume();
                continue;
            case adapt.cssparse.Action.ERROR_POP_DECL:  // Close bracket while skipping error syntax in declaration
            	if (parsingValue || parsingStyleAttr)
            		return true;
            	if (this.errorBrackets.length == 0) {
                    this.actions = adapt.cssparse.actionsBase;
                    // Don't consume closing brace
                    continue;
            	}
            	// fall through
            case adapt.cssparse.Action.ERROR_POP:  // Close bracket while skipping error syntax            
                if (this.errorBrackets.length > 0 &&
                		this.errorBrackets[this.errorBrackets.length-1] == token.type) {
	                this.errorBrackets.pop();
                }
            	if (this.errorBrackets.length == 0 && token.type == adapt.csstok.TokenType.C_BRC) {
                    this.actions = adapt.cssparse.actionsBase;
            	}
                tokenizer.consume();
            	continue;
            case adapt.cssparse.Action.ERROR_SEMICOL:
            	if (parsingValue || parsingStyleAttr)
            		return true;
                if (this.errorBrackets.length == 0) {
                    this.actions = adapt.cssparse.actionsBase;                	
                }
	            tokenizer.consume();
	            continue;          
            case adapt.cssparse.Action.DONE:
                return true;
            default:
            	if (parsingValue || parsingStyleAttr)
            		return true;
                if (parsingMediaQuery) {
                    if (this.exprStackReduce(adapt.csstok.TokenType.C_PAR, token)) {
                        this.result = /** @type {adapt.css.Val} */ (valStack.pop());
                        return true;
                    }
                    return false;
                }
                if (parsingFunctionParam) {
                    if (token.type == adapt.csstok.TokenType.C_PAR) {
                      tokenizer.consume();
                      handler.endFuncRule();
                      return true;
                    }
                    return false;
                }
                if (this.actions === adapt.cssparse.actionsPropVal && tokenizer.hasMark()) {
                    tokenizer.reset();
                    this.actions = adapt.cssparse.actionsSelectorStart;
                    handler.startSelectorRule();
                    continue;
                }
                if (this.actions !== adapt.cssparse.actionsError &&
                		this.actions !== adapt.cssparse.actionsErrorSelector && 
                		this.actions !== adapt.cssparse.actionsErrorDecl) {
                	if (token.type == adapt.csstok.TokenType.INVALID)
                		handler.error(token.text, token);
                	else
                		handler.error("E_CSS_SYNTAX", token);
                	if (this.isInsidePropertyOnlyRule()) {
                		this.actions = adapt.cssparse.actionsErrorDecl;
                	} else {
                    	this.actions = adapt.cssparse.actionsErrorSelector;
                	}
                    continue;  // Let error-recovery to re-process the offending token
                }
                tokenizer.consume();
                continue;
        }
        break;
    }
    return false;  // Not done yet.
};

/**
 * @param {adapt.expr.LexicalScope} scope
 * @constructor
 * @extends {adapt.cssparse.ParserHandler}
 */
adapt.cssparse.ErrorHandler = function(scope) {
	adapt.cssparse.ParserHandler.call(this, null);
	/** @const */ this.scope = scope;
};
goog.inherits(adapt.cssparse.ErrorHandler, adapt.cssparse.ParserHandler);

/**
 * @override
 */
adapt.cssparse.ErrorHandler.prototype.error = function(mnemonics, token) {
    throw new Error(mnemonics);
};

/**
 * @override
 */
adapt.cssparse.ErrorHandler.prototype.getScope = function() {
    return this.scope;
};

/**
 * @param {adapt.csstok.Tokenizer} tokenizer
 * @param {adapt.cssparse.ParserHandler} handler
 * @param {string} baseURL
 * @param {?string} classes
 * @param {?string} media
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.cssparse.parseStylesheet = function(tokenizer, handler, baseURL, classes, media) {
	/** @type {adapt.task.Frame.<boolean>} */ var frame =
		adapt.task.newFrame("parseStylesheet");
	var parser = new adapt.cssparse.Parser(adapt.cssparse.actionsBase, tokenizer, handler, baseURL);

    var condition = null;
    if (media) {
        condition = adapt.cssparse.parseMediaQuery(new adapt.csstok.Tokenizer(media, handler), handler, baseURL);
    }
    condition = parser.makeCondition(classes, condition && condition.toExpr());
	if (condition) {
		handler.startMediaRule(condition);
		handler.startRuleBody();		
	}
	frame.loop(function() {
	    while (!parser.runParser(100, false, false, false, false)) {
			if (parser.importReady) {
				var resolvedURL = adapt.base.resolveURL(/** @type {string} */ (parser.importURL), baseURL);
				if (parser.importCondition) {
					handler.startMediaRule(parser.importCondition);
					handler.startRuleBody();
				}
				/** @type {adapt.task.Frame.<boolean>} */ var innerFrame =
					adapt.task.newFrame("parseStylesheet.import");
				adapt.cssparse.parseStylesheetFromURL(resolvedURL, handler, null, null).then(function() {
					if (parser.importCondition) {
						handler.endRule();
					}					
					parser.importReady = false;
					parser.importURL = null;
					parser.importCondition = null;
					innerFrame.finish(true);
				});
				return innerFrame.result();
			}
			var r = frame.timeSlice();
			if (r.isPending)
				return r;
		}
		return adapt.task.newResult(false);
	}).then(function() {
		if (condition) {
			handler.endRule();
		}					
		frame.finish(true);
	});
	return frame.result();
};

/**
 * @param {string} text
 * @param {adapt.cssparse.ParserHandler} handler
 * @param {string} baseURL
 * @param {?string} classes
 * @param {?string} media
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.cssparse.parseStylesheetFromText = function(text, handler, baseURL, classes, media) {
    return adapt.task.handle("parseStylesheetFromText", function(frame) {
        var tok = new adapt.csstok.Tokenizer(text, handler);
        adapt.cssparse.parseStylesheet(tok, handler, baseURL, classes, media).thenFinish(frame);
    }, function(frame, err) {
            vivliostyle.logging.logger.warn(err, "Failed to parse stylesheet text: " + text);
            frame.finish(false);
        }
    );
};

/**
 * @param {string} url
 * @param {adapt.cssparse.ParserHandler} handler
 * @param {?string} classes
 * @param {?string} media
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.cssparse.parseStylesheetFromURL = function(url, handler, classes, media) {
    return adapt.task.handle("parseStylesheetFromURL", 
    	/**
    	 * @param {!adapt.task.Frame.<boolean>} frame
    	 * @return {void}
    	 */
    	function(frame) {
		    adapt.net.ajax(url).then(function (xhrParam) {
		    	var xhr = /** @type {XMLHttpRequest} */ (xhrParam);
		        if (!xhr.responseText) {
		            frame.finish(true);
		        } else {
		        	adapt.cssparse.parseStylesheetFromText(xhr.responseText,
		        			handler, url, classes, media)
                        .then(function(result) {
                            if (!result) {
                                vivliostyle.logging.logger.warn("Failed to parse stylesheet from " + url);
                            }
                            frame.finish(true);
                        });
		        }
		    });
    	},
    	/**
    	 * @param {!adapt.task.Frame.<boolean>} frame
    	 * @param {Error} err
    	 * @return {void}
    	 */
    	function(frame, err) {
            vivliostyle.logging.logger.warn(err, "Exception while fetching and parsing:", url);
	    	frame.finish(true);
	    });
};

/**
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.csstok.Tokenizer} tokenizer
 * @param {string} baseURL
 * @return {adapt.css.Val}
 */
adapt.cssparse.parseValue = function(scope, tokenizer, baseURL) {
	var parser = new adapt.cssparse.Parser(adapt.cssparse.actionsPropVal, tokenizer, 
    		new adapt.cssparse.ErrorHandler(scope), baseURL);
    parser.runParser(Number.POSITIVE_INFINITY, true, false, false, false);
	return parser.result;
};

/**
 * @param {adapt.csstok.Tokenizer} tokenizer
 * @param {adapt.cssparse.ParserHandler} handler
 * @param {string} baseURL
 * @return {void}
 */
adapt.cssparse.parseStyleAttribute = function(tokenizer, handler, baseURL) {
	var parser = new adapt.cssparse.Parser(adapt.cssparse.actionsStyleAttribute, tokenizer, 
    		handler, baseURL);
    parser.runParser(Number.POSITIVE_INFINITY, false, true, false, false);
};

/**
 * @param {adapt.csstok.Tokenizer} tokenizer
 * @param {adapt.cssparse.ParserHandler} handler
 * @param {string} baseURL
 * @return {adapt.css.Expr}
 */
adapt.cssparse.parseMediaQuery = function(tokenizer, handler, baseURL) {
    var parser = new adapt.cssparse.Parser(adapt.cssparse.actionsExprVal, tokenizer, handler, baseURL);
    parser.runParser(Number.POSITIVE_INFINITY, false, false, true, false);
    return /** @type {adapt.css.Expr} */ (parser.result);
};

/**
 * @type {Object.<string, boolean>}
 */
adapt.cssparse.numProp = {
    "z-index": true,
    "column-count": true,
    "flow-linger": true,
    "opacity": true,
    "page": true,
    "flow-priority": true,
    "utilization": true
};

/**
 * @param {string} propName
 * @return {boolean}
 */
adapt.cssparse.takesOnlyNum = function(propName) {
    return !!adapt.cssparse.numProp[propName];
};

/**
 * @param {adapt.expr.Context} context
 * @param {adapt.expr.Val} val
 * @param {string} propName
 * @return {adapt.css.Val} val
 */
adapt.cssparse.evaluateExprToCSS = function(context, val, propName) {
    var result = val.evaluate(context);
    switch (typeof result) {
        case "number" :
            if (!adapt.cssparse.takesOnlyNum(propName))
                return new adapt.css.Numeric(result, "px");
            else if (result == Math.round(result))
                return new adapt.css.Int(result);
            else
                return new adapt.css.Num(result);
        case "string" :
            if (!result)
                return adapt.css.empty;
            // TODO: where baseURL should come from???
            return adapt.cssparse.parseValue(val.scope, new adapt.csstok.Tokenizer(result, null), "");
        case "boolean" :
            return result ? adapt.css.ident._true : adapt.css.ident._false;
        case "undefined" :
            return adapt.css.empty;
    }
    throw new Error("E_UNEXPECTED");
};

/**
 * @param {adapt.expr.Context} context
 * @param {adapt.css.Val} val
 * @param {string} propName
 * @return {adapt.css.Val} val
 */
adapt.cssparse.evaluateCSSToCSS = function(context, val, propName) {
    if (val.isExpr())
        return adapt.cssparse.evaluateExprToCSS(context, (/** @type {adapt.css.Expr} */ (val)).expr, propName);
    return val;
};
