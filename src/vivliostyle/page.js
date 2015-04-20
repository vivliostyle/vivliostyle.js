/**
 * Copyright 2015 Vivliostyle Inc.
 * @fileoverview @page rule (CSS Paged Media) support
 */
goog.provide("vivliostyle.page");

goog.require("adapt.expr");
goog.require("adapt.css");
goog.require("adapt.cssparse");
goog.require("adapt.csscasc");
goog.require("adapt.cssvalid");
goog.require("adapt.pm");

/**
 * Dynamically generate and manage page masters combining page at-rules and already defined page masters.
 * In generating a new instance, it generates a new page master for the page size and margin settings and a new partition group for the page border and padding settings.
 * Then the children of the original page master are copied as the children of the newly generated partition group.
 * @param {adapt.csscasc.CascadeInstance} cascadeInstance
 * @param {adapt.expr.LexicalScope} pageScope
 * @param {!adapt.expr.Context} context
 * @param {adapt.csscasc.ElementStyle} docElementStyle
 * @constructor
 */
vivliostyle.page.PageManager = function(cascadeInstance, pageScope, context, docElementStyle) {
    /** @const @private */ this.cascadeInstance = cascadeInstance;
    /** @const @private */ this.pageScope = pageScope;
    /** @const @private */ this.context = context;
    /** @const @private */ this.docElementStyle = docElementStyle;
    /** @const @private */ this.pageMasterCache = /** @type {Object.<string, adapt.pm.PageMasterInstance>} */ ({});
};

/**
 * Return a PageMasterInstance with page rules applied. Return a cached instance if there already exists one with the same styles.
 * @param {!adapt.pm.PageMasterInstance} pageMaster
 * @return {!adapt.pm.PageMasterInstance}
 */
vivliostyle.page.PageManager.prototype.getPageRuleAppliedPageMaster = function(pageMaster) {
    /** @const */ var style = /** @type {!adapt.csscasc.ElementStyle} */ ({});
    this.cascadeInstance.pushRule([], "", style);
    /** @const */ var key = this.makeCacheKey(style, pageMaster);
    var applied = this.pageMasterCache[key];
    if (applied) {
        return applied;
    } else {
        applied = this.generatePageMaster(style, pageMaster);
        this.pageMasterCache[key] = applied;
        return applied;
    }
};

/**
 * Generate a cache key from the specified styles and the original page master key.
 * @private
 * @param {!adapt.csscasc.ElementStyle} style
 * @param {!adapt.pm.PageMasterInstance} pageMaster
 * @return {string}
 */
vivliostyle.page.PageManager.prototype.makeCacheKey = function(style, pageMaster) {
    /** @const */ var props = /** @type {Array.<string>} */ ([]);
    for (var prop in style) {
        if (Object.prototype.hasOwnProperty.call(style, prop)) {
            props.push(prop + style[prop].value);
        }
    }
    var key = props.join("^");
    return key + "^" + pageMaster.pageBox.key;
};

/**
 * Represent page size.
 *  @typedef {{width: !adapt.css.Numeric, height: !adapt.css.Numeric}}
 */
vivliostyle.page.PageSize;

/**
 * Named page sizes.
 * @const
 * @private
 * @type {Object.<string, !vivliostyle.page.PageSize>}
 */
vivliostyle.page.pageSizes = {
    "a5": {width: new adapt.css.Numeric(148, "mm"), height: new adapt.css.Numeric(210, "mm")},
    "a4": {width: new adapt.css.Numeric(210, "mm"), height: new adapt.css.Numeric(297, "mm")},
    "a3": {width: new adapt.css.Numeric(297, "mm"), height: new adapt.css.Numeric(420, "mm")},
    "b5": {width: new adapt.css.Numeric(176, "mm"), height: new adapt.css.Numeric(250, "mm")},
    "b4": {width: new adapt.css.Numeric(250, "mm"), height: new adapt.css.Numeric(353, "mm")},
    "letter": {width: new adapt.css.Numeric(8.5, "in"), height: new adapt.css.Numeric(11, "in")},
    "legal": {width: new adapt.css.Numeric(8.5, "in"), height: new adapt.css.Numeric(14, "in")},
    "ledger": {width: new adapt.css.Numeric(11, "in"), height: new adapt.css.Numeric(17, "in")}
};

/**
 * @private
 * @param {!adapt.csscasc.ElementStyle} style
 * @param {!adapt.pm.PageMasterInstance} original
 * @return {!adapt.pm.PageMasterInstance}
 */
vivliostyle.page.PageManager.prototype.generatePageMaster = function(style, original) {
    var originalMaster = original.pageBox;
    var pageSize = this.resolvePageSize(style);

    var pageMaster = new adapt.pm.PageMaster(this.pageScope, null, null, [],
        /** @type {adapt.pm.RootPageBox} */ (originalMaster.parent),
        null, originalMaster.specificity);
    this.applyPageMasterStyle(style, pageSize, pageMaster);

    var partitionGroup = new adapt.pm.PartitionGroup(pageMaster.scope, null, null, [], pageMaster);
    for (var i = 0; i < originalMaster.children.length; i++) {
        partitionGroup.children.push(originalMaster.children[i]);
    }
    this.applyPartitionGroupStyle(style, pageSize, partitionGroup);

    var pageMasterInstance = /** @type {!adapt.pm.PageMasterInstance} */
        (pageMaster.createInstance(original.parentInstance));
    // Do the same initialization as in adapt.ops.StyleInstance.prototype.init
    pageMasterInstance.applyCascadeAndInit(this.cascadeInstance, this.docElementStyle);
    pageMasterInstance.resolveAutoSizing(this.context);
    return pageMasterInstance;
};

/**
 * @const
 * @type {!vivliostyle.page.PageSize}
 */
vivliostyle.page.fitToViewportSize = {
    width: adapt.css.fullWidth,
    height: adapt.css.fullHeight
};

/**
 * @private
 * @param {!adapt.csscasc.ElementStyle} style
 * @return {!vivliostyle.page.PageSize}
 */
vivliostyle.page.PageManager.prototype.resolvePageSize = function(style) {
    /** @type {adapt.csscasc.CascadeValue} */ var size = style["size"];
    if (!size || size.value === adapt.css.ident.auto) {
        // if size is auto, fit to the viewport
        return vivliostyle.page.fitToViewportSize;
    } else {
        /** !type {!adapt.css.Val} */ var value = size.value;
        var val1, val2;
        if (value.isSpaceList()) {
            val1 = value.values[0];
            val2 = value.values[1];
        } else {
            val1 = value;
            val2 = null;
        }
        if (val1.isNumeric()) {
            // <length>{1,2}
            return {
                width: val1,
                height: val2 || val1
            };
        } else {
            // <page-size> || [ portrait | landscape ]
            var s = vivliostyle.page.pageSizes[/** @type {adapt.css.Ident} */ (val1).name.toLowerCase()];
            if (!s) {
                // portrait or landscape is specified alone. fallback to fit to the viewport
                return vivliostyle.page.fitToViewportSize;
            } else if (val2 && val2 === adapt.css.ident.landscape) {
                // swap
                return {
                    width: s.height,
                    height: s.width
                };
            } else {
                return {
                    width: s.width,
                    height: s.height
                };
            }
        }
    }
};

/**
 * @private
 * @param {!adapt.csscasc.ElementStyle} style
 * @param {!vivliostyle.page.PageSize} pageSize
 * @param {!adapt.pm.PageMaster} pageMaster
 */
vivliostyle.page.PageManager.prototype.applyPageMasterStyle = function(style, pageSize, pageMaster) {
    pageMaster.specified["width"] = new adapt.csscasc.CascadeValue(pageSize.width, 0);
    pageMaster.specified["height"] = new adapt.csscasc.CascadeValue(pageSize.height, 0);
};

/**
 * @private
 * @param {!adapt.csscasc.ElementStyle} style
 * @param {!vivliostyle.page.PageSize} pageSize
 * @param {!adapt.pm.PartitionGroup} partitionGroup
 */
vivliostyle.page.PageManager.prototype.applyPartitionGroupStyle = function(style, pageSize, partitionGroup) {
    partitionGroup.specified["width"] = new adapt.csscasc.CascadeValue(pageSize.width, 0);
    partitionGroup.specified["height"] = new adapt.csscasc.CascadeValue(pageSize.height, 0);
};

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
 * @param {!adapt.csscasc.CascadeParserHandler} parent
 * @param {adapt.cssvalid.ValidatorSet} validatorSet
 * @constructor
 * @extends {adapt.csscasc.CascadeParserHandler}
 * @implements {adapt.cssvalid.PropertyReceiver}
 */
vivliostyle.page.PageParserHandler = function(scope, owner, parent, validatorSet) {
    adapt.csscasc.CascadeParserHandler.call(this, scope, owner, null, parent, null, validatorSet, false);
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
