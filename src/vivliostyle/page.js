/**
 * Copyright 2015 Vivliostyle Inc.
 * @fileoverview @page rule (CSS Paged Media) support
 */
goog.provide("vivliostyle.page");

goog.require("vivliostyle.constants");
goog.require("adapt.expr");
goog.require("adapt.css");
goog.require("adapt.cssparse");
goog.require("adapt.csscasc");
goog.require("adapt.cssvalid");
goog.require("adapt.pm");

/**
 * Resolve page progression direction from writing-mode and direction.
 * @param {!adapt.csscasc.ElementStyle} style
 * @returns {vivliostyle.constants.PageProgression}
 */
vivliostyle.page.resolvePageProgression = function(style) {
    var writingMode = style["writing-mode"];
    writingMode = writingMode && writingMode.value;
    var direction = style["direction"];
    direction = direction && direction.value;
    if (writingMode === adapt.css.ident.vertical_lr ||
        (writingMode !== adapt.css.ident.vertical_rl && direction !== adapt.css.ident.rtl)) {
        return vivliostyle.constants.PageProgression.LTR;
    } else {
        return vivliostyle.constants.PageProgression.RTL;
    }
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
 * @const
 * @type {!vivliostyle.page.PageSize}
 */
vivliostyle.page.fitToViewportSize = {
    width: adapt.css.fullWidth,
    height: adapt.css.fullHeight
};

/**
 * @private
 * @param {!Object.<string, adapt.css.Val>} style
 * @return {!vivliostyle.page.PageSize}
 */
vivliostyle.page.resolvePageSize = function(style) {
    /** @type {adapt.css.Val} */ var size = style["size"];
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
 * Indicates that the page master is generated for @page rules.
 * @const
 */
vivliostyle.page.pageRuleMasterPseudoName = "vivliostyle-page-rule-master";

/**
 * Represent a page master generated for @page rules
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.pm.RootPageBox} parent
 * @param {!adapt.csscasc.ElementStyle} style Cascaded style for @page rules
 * @constructor
 * @extends {adapt.pm.PageMaster}
 */
vivliostyle.page.PageRuleMaster = function(scope, parent, style) {
    adapt.pm.PageMaster.call(this, scope, null, vivliostyle.page.pageRuleMasterPseudoName, [],
        parent, null, 0);
    /** @const @private */ this.style = style;
    var partition = new vivliostyle.page.PageRulePartition(this.scope, this, style);
    /** @const @private */ this.bodyPartitionKey = partition.key;
    this.specified["position"] = new adapt.csscasc.CascadeValue(adapt.css.ident.relative, 0);
};
goog.inherits(vivliostyle.page.PageRuleMaster, adapt.pm.PageMaster);

/**
 * @return {!vivliostyle.page.PageRuleMasterInstance}
 * @override
 */
vivliostyle.page.PageRuleMaster.prototype.createInstance = function(parentInstance) {
    return new vivliostyle.page.PageRuleMasterInstance(parentInstance, this);
};

/**
 * Represent a partition placed in a PageRuleMaster
 * @param {adapt.expr.LexicalScope} scope
 * @param {vivliostyle.page.PageRuleMaster} parent
 * @param {!adapt.csscasc.ElementStyle} style Cascaded style for @page rules
 * @constructor
 * @extends {adapt.pm.Partition}
 */
vivliostyle.page.PageRulePartition = function(scope, parent, style) {
    adapt.pm.Partition.call(this, scope, null, null, [], parent);
    /** @const */ this.pageSize = vivliostyle.page.resolvePageSize(style);
    this.applySpecified(style);
};
goog.inherits(vivliostyle.page.PageRulePartition, adapt.pm.Partition);

/**
 * @private
 * @const
 */
vivliostyle.page.PageRulePartition.sides = [
    "left", "right", "top", "bottom",
    "before", "after", "start", "end",
    "block-start", "block-end", "inline-start", "inline-end"
];

/**
 * Transfer cascaded style for @page rules to 'specified' style of this PageBox
 * @private
 * @param {!adapt.csscasc.ElementStyle} style
 */
vivliostyle.page.PageRulePartition.prototype.applySpecified = function(style) {
    this.specified["flow-from"] = new adapt.csscasc.CascadeValue(adapt.css.getName("body"), 0);
    this.specified["position"] = new adapt.csscasc.CascadeValue(adapt.css.ident.relative, 0);
    this.specified["overflow"] = new adapt.csscasc.CascadeValue(adapt.css.ident.visible, 0);

    var self = this;
    function copy(name) {
        self.specified[name] = style[name];
    }
    copy("width");
    copy("height");
    copy("block-size");
    copy("inline-size");
    for (var i = 0; i < vivliostyle.page.PageRulePartition.sides.length; i++) {
        var side = vivliostyle.page.PageRulePartition.sides[i];
        copy("margin-" + side);
        copy("padding-" + side);
        copy("border-" + side + "-width");
        copy("border-" + side + "-style");
        copy("border-" + side + "-color");
    }
};

/**
 * @return {!vivliostyle.page.PageRulePartitionInstance}
 * @override
 */
vivliostyle.page.PageRulePartition.prototype.createInstance = function(parentInstance) {
    return new vivliostyle.page.PageRulePartitionInstance(parentInstance, this);
};

/**
 * @param {adapt.pm.PageBoxInstance} parentInstance
 * @param {vivliostyle.page.PageRuleMaster} pageRuleMaster
 * @constructor
 * @extends {adapt.pm.PageMasterInstance}
 */
vivliostyle.page.PageRuleMasterInstance = function(parentInstance, pageRuleMaster) {
    adapt.pm.PageMasterInstance.call(this, parentInstance, pageRuleMaster);
};
goog.inherits(vivliostyle.page.PageRuleMasterInstance, adapt.pm.PageMasterInstance);

/**
 * @override
 */
vivliostyle.page.PageRuleMasterInstance.prototype.applyCascadeAndInit = function(cascade, docElementStyle) {
    var style = this.cascaded;

    for (var name in docElementStyle) {
        if (Object.prototype.hasOwnProperty.call(docElementStyle, name)) {
            switch (name) {
                case "writing-mode":
                case "direction":
                    style[name] = docElementStyle[name];
            }
        }
    }

    adapt.pm.PageMasterInstance.prototype.applyCascadeAndInit.call(this, cascade, docElementStyle);
};

/**
 * @override
 */
vivliostyle.page.PageRuleMasterInstance.prototype.initHorizontal = function() {
    var style = this.style;
    style["left"] = adapt.css.numericZero;
    style["margin-left"] = adapt.css.numericZero;
    style["border-left-width"] = adapt.css.numericZero;
    style["padding-left"] = adapt.css.numericZero;
    style["padding-right"] = adapt.css.numericZero;
    style["border-right-width"] = adapt.css.numericZero;
    style["margin-right"] = adapt.css.numericZero;
    style["right"] = adapt.css.numericZero;
};

/**
 * @override
 */
vivliostyle.page.PageRuleMasterInstance.prototype.initVertical = function() {
    var style = this.style;
    style["top"] = adapt.css.numericZero;
    style["margin-top"] = adapt.css.numericZero;
    style["border-top-width"] = adapt.css.numericZero;
    style["padding-top"] = adapt.css.numericZero;
    style["padding-bottom"] = adapt.css.numericZero;
    style["border-bottom-width"] = adapt.css.numericZero;
    style["margin-bottom"] = adapt.css.numericZero;
    style["bottom"] = adapt.css.numericZero;
};

/**
 * Adjust width and height using the actual dimensions calculated by the PageRuleParitionInstance.
 * @param {!adapt.expr.Context} context
 */
vivliostyle.page.PageRuleMasterInstance.prototype.adjustContainingBlock = function(context) {
    var holder = /** {!adapt.pm.InstanceHolder} */ (context);
    var partitionInstance = holder.lookupInstance(this.pageBox.bodyPartitionKey);

    var style = this.style;
    style["width"] = new adapt.css.Expr(partitionInstance.borderBoxWidth);
    style["height"] = new adapt.css.Expr(partitionInstance.borderBoxHeight);
    style["padding-left"] = new adapt.css.Expr(partitionInstance.marginLeft);
    style["padding-right"] = new adapt.css.Expr(partitionInstance.marginRight);
    style["padding-top"] = new adapt.css.Expr(partitionInstance.marginTop);
    style["padding-bottom"] = new adapt.css.Expr(partitionInstance.marginBottom);
};

/**
 * @param {adapt.pm.PageBoxInstance} parentInstance
 * @param {vivliostyle.page.PageRulePartition} pageRulePartition
 * @constructor
 * @extends {adapt.pm.PartitionInstance}
 */
vivliostyle.page.PageRulePartitionInstance = function(parentInstance, pageRulePartition) {
    adapt.pm.PartitionInstance.call(this, parentInstance, pageRulePartition);
    /** @type {adapt.expr.Val} */ this.borderBoxWidth = null;
    /** @type {adapt.expr.Val} */ this.borderBoxHeight = null;
    /** @type {adapt.expr.Val} */ this.marginTop = null;
    /** @type {adapt.expr.Val} */ this.marginRight = null;
    /** @type {adapt.expr.Val} */ this.marginBottom = null;
    /** @type {adapt.expr.Val} */ this.marginLeft = null;
};
goog.inherits(vivliostyle.page.PageRulePartitionInstance, adapt.pm.PartitionInstance);

/**
 * @override
 */
vivliostyle.page.PageRulePartitionInstance.prototype.applyCascadeAndInit = function(cascade, docElementStyle) {
    var style = this.cascaded;
    for (var name in docElementStyle) {
        if (Object.prototype.hasOwnProperty.call(docElementStyle, name)) {
            if (name.match(/^column.*$/)) {
                style[name] = docElementStyle[name];
            }
        }
    }

    adapt.pm.PartitionInstance.prototype.applyCascadeAndInit.call(this, cascade, docElementStyle);
};

/**
 * @override
 */
vivliostyle.page.PageRulePartitionInstance.prototype.initHorizontal = function() {
    var dim = this.resolvePageBoxDimensions({
        start: "left",
        end: "right",
        extent: "width"
    });
    this.borderBoxWidth = dim.borderBoxExtent;
    this.marginLeft = dim.marginStart;
    this.marginRight = dim.marginEnd;
};

/**
 * @override
 */
vivliostyle.page.PageRulePartitionInstance.prototype.initVertical = function() {
    var dim = this.resolvePageBoxDimensions({
        start: "top",
        end: "bottom",
        extent: "height"
    });
    this.borderBoxHeight = dim.borderBoxExtent;
    this.marginTop = dim.marginStart;
    this.marginBottom = dim.marginEnd;
};

/**
 * Calculate page dimensions as specified in CSS Paged Media (http://dev.w3.org/csswg/css-page/#page-model)
 * @private
 * @param {!{start: string, end: string, extent: string}} names
 * @return {{borderBoxExtent: adapt.expr.Val, marginStart: adapt.expr.Val, marginEnd: adapt.expr.Val}}
 *         Page border box extent and margins. Since the containing block can be resized in the over-constrained case, the sum of these values is not necessarily same to the original page dimension specified in the page at-rules.
 */
vivliostyle.page.PageRulePartitionInstance.prototype.resolvePageBoxDimensions = function(names) {
    var style = this.style;
    var pageSize = this.pageBox.pageSize;
    var scope = this.pageBox.scope;
    var startSide = names.start;
    var endSide = names.end;
    var extentName = names.extent;

    var pageExtent = pageSize[extentName].toExpr(scope, null);
    var extent = adapt.pm.toExprAuto(scope, style[extentName], pageExtent);
    var marginStart = adapt.pm.toExprAuto(scope, style["margin-" + startSide], pageExtent);
    var marginEnd = adapt.pm.toExprAuto(scope, style["margin-" + endSide], pageExtent);
    var paddingStart = adapt.pm.toExprZero(scope, style["padding-" + startSide], pageExtent);
    var paddingEnd = adapt.pm.toExprZero(scope, style["padding-" + endSide], pageExtent);
    var borderStartWidth = adapt.pm.toExprZeroBorder(scope, style["border-" + startSide + "-width"], style["border-" + startSide + "-style"], pageExtent);
    var borderEndWidth = adapt.pm.toExprZeroBorder(scope, style["border-" + endSide + "-width"], style["border-" + endSide + "-style"], pageExtent);
    var remains = adapt.expr.sub(scope, pageExtent,
        adapt.expr.add(scope,
            adapt.expr.add(scope, borderStartWidth, paddingStart),
            adapt.expr.add(scope, borderEndWidth, paddingEnd)
        )
    );

    // The dimensions are calculated as for a non-replaced block element in normal flow
    // (http://www.w3.org/TR/CSS21/visudet.html#blockwidth)
    if (!extent) {
        if (!marginStart) marginStart = scope.zero;
        if (!marginEnd) marginEnd = scope.zero;
        extent = adapt.expr.sub(scope, remains, adapt.expr.add(scope, marginStart, marginEnd));
    } else {
        remains = adapt.expr.sub(scope, remains, extent);
        if (!marginStart && !marginEnd) {
            marginStart = adapt.expr.mul(scope, remains, new adapt.expr.Const(scope, 0.5));
            marginEnd = marginStart;
        } else if (marginStart) {
            marginEnd = adapt.expr.sub(scope, remains, marginStart);
        } else {
            marginStart = adapt.expr.sub(scope, remains, marginEnd);
        }
    }
    // TODO over-constrained case
    // "if the values are over-constrained, instead of ignoring any margins, the containing block is resized to coincide with the margin edges of the page box."
    // (CSS Paged Media http://dev.w3.org/csswg/css-page/#page-model)

    style[startSide] = adapt.css.numericZero;
    style[endSide] = adapt.css.numericZero;
    style["margin-" + startSide] = adapt.css.numericZero;
    style["margin-" + endSide] = adapt.css.numericZero;
    style["padding-" + startSide] = new adapt.css.Expr(paddingStart);
    style["padding-" + endSide] = new adapt.css.Expr(paddingEnd);
    style["border-" + startSide + "-width"] = new adapt.css.Expr(borderStartWidth);
    style["border-" + endSide + "-width"] = new adapt.css.Expr(borderEndWidth);
    style[extentName] = new adapt.css.Expr(extent);
    style["max-" + extentName] = new adapt.css.Expr(extent);

    return {
        borderBoxExtent: adapt.expr.sub(scope, pageExtent, adapt.expr.add(scope, marginStart, marginEnd)),
        marginStart: marginStart,
        marginEnd: marginEnd
    };
};

/**
 * Dynamically generate and manage page masters corresponding to page at-rules.
 * @param {adapt.csscasc.CascadeInstance} cascadeInstance
 * @param {adapt.expr.LexicalScope} pageScope
 * @param {!adapt.pm.RootPageBoxInstance} rootPageBoxInstance
 * @param {!adapt.expr.Context} context
 * @param {!adapt.csscasc.ElementStyle} docElementStyle
 * @constructor
 */
vivliostyle.page.PageManager = function(cascadeInstance, pageScope, rootPageBoxInstance, context, docElementStyle) {
    /** @const @private */ this.cascadeInstance = cascadeInstance;
    /** @const @private */ this.pageScope = pageScope;
    /** @const @private */ this.rootPageBoxInstance = rootPageBoxInstance;
    /** @const @private */ this.context = context;
    /** @const @private */ this.docElementStyle = docElementStyle;
    /** @const @private */ this.pageMasterCache = /** @type {Object.<string, vivliostyle.page.PageRuleMasterInstance>} */ ({});
    this.definePageProgression();
};

/**
 * Determine the page progression and define left/right/recto/verso pages.
 * @private
 */
vivliostyle.page.PageManager.prototype.definePageProgression = function() {
    // TODO If a page break is forced before the root element, recto/verso pages are no longer odd/even pages. left/right are reversed too.
    var scope = this.pageScope;
    var pageNumber = new adapt.expr.Named(scope, "page-number");
    var isEvenPage = new adapt.expr.Eq(scope,
        new adapt.expr.Modulo(scope, pageNumber, new adapt.expr.Const(scope, 2)),
        scope.zero
    );
    scope.defineName("recto-page", new adapt.expr.Not(scope, isEvenPage));
    scope.defineName("verso-page", isEvenPage);

    var pageProgression = vivliostyle.page.resolvePageProgression(this.docElementStyle);
    if (pageProgression === vivliostyle.constants.PageProgression.LTR) {
        scope.defineName("left-page", isEvenPage);
        scope.defineName("right-page", new adapt.expr.Not(scope, isEvenPage));
    } else {
        scope.defineName("left-page", new adapt.expr.Not(scope, isEvenPage));
        scope.defineName("right-page", isEvenPage);
    }
};

/**
 * Return a PageMasterInstance with page rules applied. Return a cached instance if there already exists one with the same styles.
 * @return {adapt.pm.PageMasterInstance}
 */
vivliostyle.page.PageManager.prototype.getPageRulePageMaster = function() {
    /** @const */ var style = /** @type {!adapt.csscasc.ElementStyle} */ ({});
    this.cascadeInstance.pushRule([], "", style);
    /** @const */ var key = this.makeCacheKey(style);
    if (!key)
        return null;
    var applied = this.pageMasterCache[key];
    if (applied) {
        return applied;
    } else {
        applied = this.generatePageRuleMaster(style);
        this.pageMasterCache[key] = applied;
        return applied;
    }
};

/**
 * Generate a cache key from the specified styles and the original page master key.
 * @private
 * @param {!adapt.csscasc.ElementStyle} style
 * @return {string}
 */
vivliostyle.page.PageManager.prototype.makeCacheKey = function(style) {
    /** @const */ var props = /** @type {Array.<string>} */ ([]);
    for (var prop in style) {
        if (Object.prototype.hasOwnProperty.call(style, prop)) {
            var val = style[prop];
            props.push(prop + val.value + val.priority);
        }
    }
    return props.sort().join("^");
};

/**
 * @private
 * @param {!adapt.csscasc.ElementStyle} style
 * @return {!vivliostyle.page.PageRuleMasterInstance}
 */
vivliostyle.page.PageManager.prototype.generatePageRuleMaster = function(style) {
    var pageMaster = new vivliostyle.page.PageRuleMaster(this.pageScope,
        /** @type {adapt.pm.RootPageBox} */ (this.rootPageBoxInstance.pageBox), style);

    var pageMasterInstance = pageMaster.createInstance(this.rootPageBoxInstance);
    // Do the same initialization as in adapt.ops.StyleInstance.prototype.init
    pageMasterInstance.applyCascadeAndInit(this.cascadeInstance, this.docElementStyle);
    pageMasterInstance.adjustContainingBlock(this.context);
    pageMasterInstance.resolveAutoSizing(this.context);
    return pageMasterInstance;
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
    return 3;
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
 * @param {adapt.expr.LexicalScope} scope
 * @constructor
 * @extends {adapt.csscasc.ChainedAction}
 */
vivliostyle.page.IsFirstPageAction = function(scope) {
    adapt.csscasc.ChainedAction.call(this);
    /** @const */ this.scope = scope;
};
goog.inherits(vivliostyle.page.IsFirstPageAction, adapt.csscasc.ChainedAction);

/**
 * @override
 */
vivliostyle.page.IsFirstPageAction.prototype.apply = function(cascadeInstace) {
    var pageNumber = new adapt.expr.Named(this.scope, "page-number");
    if (pageNumber.evaluate(cascadeInstace.context) === 1) {
        this.chained.apply(cascadeInstace);
    }
};

/**
 * @override
 */
vivliostyle.page.IsFirstPageAction.prototype.getPriority = function() {
    return 2;
};

/**
 * @param {adapt.expr.LexicalScope} scope
 * @constructor
 * @extends {adapt.csscasc.ChainedAction}
 */
vivliostyle.page.IsLeftPageAction = function(scope) {
    adapt.csscasc.ChainedAction.call(this);
    /** @const */ this.scope = scope;
};
goog.inherits(vivliostyle.page.IsLeftPageAction, adapt.csscasc.ChainedAction);

/**
 * @override
 */
vivliostyle.page.IsLeftPageAction.prototype.apply = function(cascadeInstace) {
    var leftPage = new adapt.expr.Named(this.scope, "left-page");
    if (leftPage.evaluate(cascadeInstace.context)) {
        this.chained.apply(cascadeInstace);
    }
};

/**
 * @override
 */
vivliostyle.page.IsLeftPageAction.prototype.getPriority = function() {
    return 1;
};

/**
 * @param {adapt.expr.LexicalScope} scope
 * @constructor
 * @extends {adapt.csscasc.ChainedAction}
 */
vivliostyle.page.IsRightPageAction = function(scope) {
    adapt.csscasc.ChainedAction.call(this);
    /** @const */ this.scope = scope;
};
goog.inherits(vivliostyle.page.IsRightPageAction, adapt.csscasc.ChainedAction);

/**
 * @override
 */
vivliostyle.page.IsRightPageAction.prototype.apply = function(cascadeInstace) {
    var rightPage = new adapt.expr.Named(this.scope, "right-page");
    if (rightPage.evaluate(cascadeInstace.context)) {
        this.chained.apply(cascadeInstace);
    }
};

/**
 * @override
 */
vivliostyle.page.IsRightPageAction.prototype.getPriority = function() {
    return 1;
};

/**
 * @param {adapt.expr.LexicalScope} scope
 * @constructor
 * @extends {adapt.csscasc.ChainedAction}
 */
vivliostyle.page.IsRectoPageAction = function(scope) {
    adapt.csscasc.ChainedAction.call(this);
    /** @const */ this.scope = scope;
};
goog.inherits(vivliostyle.page.IsRectoPageAction, adapt.csscasc.ChainedAction);

/**
 * @override
 */
vivliostyle.page.IsRectoPageAction.prototype.apply = function(cascadeInstace) {
    var rectoPage = new adapt.expr.Named(this.scope, "recto-page");
    if (rectoPage.evaluate(cascadeInstace.context)) {
        this.chained.apply(cascadeInstace);
    }
};

/**
 * @override
 */
vivliostyle.page.IsRectoPageAction.prototype.getPriority = function() {
    return 1;
};

/**
 * @param {adapt.expr.LexicalScope} scope
 * @constructor
 * @extends {adapt.csscasc.ChainedAction}
 */
vivliostyle.page.IsVersoPageAction = function(scope) {
    adapt.csscasc.ChainedAction.call(this);
    /** @const */ this.scope = scope;
};
goog.inherits(vivliostyle.page.IsVersoPageAction, adapt.csscasc.ChainedAction);

/**
 * @override
 */
vivliostyle.page.IsVersoPageAction.prototype.apply = function(cascadeInstace) {
    var versoPage = new adapt.expr.Named(this.scope, "verso-page");
    if (versoPage.evaluate(cascadeInstace.context)) {
        this.chained.apply(cascadeInstace);
    }
};

/**
 * @override
 */
vivliostyle.page.IsVersoPageAction.prototype.getPriority = function() {
    return 1;
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
    /** @type {string} */ this.pageSizeRules = "";
};
goog.inherits(vivliostyle.page.PageParserHandler, adapt.csscasc.CascadeParserHandler);

/**
 * @override
 */
vivliostyle.page.PageParserHandler.prototype.startPageRule = function() {
    this.pageSizeRules += "@page ";
    this.startSelectorRule();
};

/**
 * @override
 */
vivliostyle.page.PageParserHandler.prototype.tagSelector = function(ns, name) {
    this.pageSizeRules += name;
    if (name) {
        this.chain.push(new vivliostyle.page.CheckPageTypeAction(name));
        this.specificity += 0x10000;
    }
};

/**
 * @override
 */
vivliostyle.page.PageParserHandler.prototype.pseudoclassSelector = function(name, params) {
    if (params) {
        this.reportAndSkip("E_INVALID_PAGE_SELECTOR :" + name + "(" + params.join("") + ")");
    }
    this.pageSizeRules += ":" + name;
    switch (name.toLowerCase()) {
        case "first":
            this.chain.push(new vivliostyle.page.IsFirstPageAction(this.scope));
            this.specificity += 0x100;
            break;
        case "left":
            this.chain.push(new vivliostyle.page.IsLeftPageAction(this.scope));
            this.specificity += 0x1;
            break;
        case "right":
            this.chain.push(new vivliostyle.page.IsRightPageAction(this.scope));
            this.specificity += 0x1;
            break;
        case "recto":
            this.chain.push(new vivliostyle.page.IsRectoPageAction(this.scope));
            this.specificity += 0x1;
            break;
        case "verso":
            this.chain.push(new vivliostyle.page.IsVersoPageAction(this.scope));
            this.specificity += 0x1;
            break;
        default:
            this.reportAndSkip("E_INVALID_PAGE_SELECTOR :" + name);
            break;
    }
};

/**
 * @override
 */
vivliostyle.page.PageParserHandler.prototype.startRuleBody = function() {
    this.pageSizeRules += "{";
    adapt.csscasc.CascadeParserHandler.prototype.startRuleBody.call(this);
};

/**
 * @override
 */
vivliostyle.page.PageParserHandler.prototype.endRule = function() {
    this.pageSizeRules += "}";

    // TODO This output to the style element should be done in an upper (view) layer
    document.getElementById("vivliostyle-page-rules").textContent += this.pageSizeRules;

    adapt.csscasc.CascadeParserHandler.prototype.endRule.call(this);
};

/**
 * @override
 */
vivliostyle.page.PageParserHandler.prototype.property = function(name, value, important) {
    if (name === "size") {
        this.pageSizeRules += "size: " + value.toString() + (important ? "!important" : "") + ";";
    }
    adapt.csscasc.CascadeParserHandler.prototype.property.call(this, name, value, important);
};

/**
 * @override
 */
vivliostyle.page.PageParserHandler.prototype.insertNonPrimary = function(action) {
    // We represent page rules without selectors by *, though it is illegal in CSS
    this.cascade.insertInTable(this.cascade.pagetypes, "*", action);
};
