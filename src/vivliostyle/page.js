/**
 * Copyright 2015 Vivliostyle Inc.
 * @fileoverview @page rule (CSS Paged Media) support
 */
goog.provide("vivliostyle.page");

goog.require("adapt.expr");
goog.require("adapt.cssparse");
goog.require("adapt.csscasc");
goog.require("adapt.cssvalid");

/**
 * @param {string} pageType
 * @constructor
 * @extends {adapt.csscasc.ChainedAction}
 */
vivliostyle.page.CheckPageTypeAction = function(pageType) {
    adapt.csscasc.ChainedAction.call(this);
    /** @const */ this.pageType = pageType;
};
goog.inherits(vivliostyle.page.CheckPageTypeAction, adapt.csscasc.ChainedAction);

/**
 * @override
 */
vivliostyle.page.CheckPageTypeAction.prototype.apply = function(cascadeInstance) {
    if (cascadeInstance.currentPageType === this.pageType) {
        this.chained.apply(cascadeInstance);
    }
};

/**
 * @override
 */
vivliostyle.page.CheckPageTypeAction.prototype.getPriority = function() {
    return 0;
};

/**
 * @override
 */
vivliostyle.page.CheckPageTypeAction.prototype.makePrimary = function(cascade) {
    if (this.chained) {
        cascade.insertInTable(cascade.pagetypes, this.pageType, this.chained);
    }
    return true;
};

/**
 * @param {!adapt.expr.LexicalScope} scope
 * @param {!adapt.cssparse.DispatchParserHandler} owner
 * @param {adapt.cssvalid.ValidatorSet} validatorSet
 * @constructor
 * @extends {adapt.csscasc.CascadeParserHandler}
 * @implements {adapt.cssvalid.PropertyReceiver}
 */
vivliostyle.page.PageParserHandler = function(scope, owner, validatorSet) {
    adapt.csscasc.CascadeParserHandler.call(this, scope, owner, null, null, null, validatorSet, false);
};
goog.inherits(vivliostyle.page.PageParserHandler, adapt.csscasc.CascadeParserHandler);

/**
 * @override
 */
vivliostyle.page.PageParserHandler.prototype.tagSelector = function(ns, name) {
    if (name) {
        this.chain.push(new vivliostyle.page.CheckPageTypeAction(name));
        this.specificity += 0x10000;
    }
};

/**
 * @override
 */
vivliostyle.page.PageParserHandler.prototype.pseudoclassSelector = function(name, params) {
    // TODO
};

/**
 * @override
 */
vivliostyle.page.PageParserHandler.prototype.insertNonPrimary = function(action) {
    // We represent page rules without selectors by *, though it is illegal in CSS
    this.cascade.insertInTable(this.cascade.pagetypes, "*", action);
};

/**
 * @override
 */
vivliostyle.page.PageParserHandler.prototype.property = function(name, value, important) {
    this.validatorSet.validatePropertyAndHandleShorthand(name, value, important, this);
};

/**
 * @override
 */
vivliostyle.page.PageParserHandler.prototype.unknownProperty = function(name, value) {
    this.report("E_INVALID_PROPERTY " + name + ": " + value.toString());
};

/**
 * @override
 */
vivliostyle.page.PageParserHandler.prototype.invalidPropertyValue = function(name, value) {
    this.report("E_INVALID_PROPERTY_VALUE " + name + ": " + value.toString());
};

/**
 * @override
 */
vivliostyle.page.PageParserHandler.prototype.simpleProperty = function(name, value, important) {
    // TODO
};
