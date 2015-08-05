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
goog.require("adapt.vtree");
goog.require("vivliostyle.sizing");
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
 * Properties transfered from the PageRuleMaster to the PageRulePartition
 * @private
 * @const
 */
vivliostyle.page.propertiesAppliedToPartition = (function() {
    var sides = [
        "left", "right", "top", "bottom",
        "before", "after", "start", "end",
        "block-start", "block-end", "inline-start", "inline-end"
    ];
    var props = {
        "width": true,
        "height": true,
        "block-size": true,
        "inline-size": true,
        "margin": true,
        "padding": true,
        "border": true,
        "outline": true,
        "outline-width": true,
        "outline-style": true,
        "outline-color": true
    };
    sides.forEach(function(side) {
        props["margin-" + side] = true;
        props["padding-" + side] = true;
        props["border-" + side + "-width"] = true;
        props["border-" + side + "-style"] = true;
        props["border-" + side + "-color"] = true;
    });
    return props;
})();

/**
 * Represents position of a margin box along the variable dimension of the page.
 * START and END can be interpreted as 'inline-start' and 'inline-end' in horizontal and vertical writing modes.
 * For example, for top margin boxes (@top-left-corner, @top-left, @top-center, @top-right, @top-right-corner), @top-left corresponds to START, @top-center to CENTER, and @top-right to END.
 * The corner boxes (@top-left-corner and @top-right-corner) have a 'null' position.
 * @private
 * @enum {string}
 */
vivliostyle.page.MarginBoxPositionAlongVariableDimension = {
    START: "start",
    CENTER: "center",
    END: "end"
};

/**
 * Information associated with a page-margin box.
 * order: the default order in which page-margin boxes are painted (defined in css-page spec)
 * isInTopRow: indicates if the margin box is in the top row, i.e., @top-* margin box (including corner boxes)
 * isInBottomRow: indicates if the margin box is in the bottom row, i.e., @bottom-* margin box (including corner boxes)
 * isInLeftColumn: indicates if the margin box is in the left column, i.e., a @*-left-corner or @left-* margin box
 * isInRightColumn: indicates if the margin box is in the right column, i.e., a @*-right-corner or @right-* margin box
 * positionAlongVariableDimension: position of the margin box along the variable dimension of the page
 * @private
 * @typedef {{order: number, isInTopRow: boolean, isInBottomRow: boolean, isInLeftColumn: boolean, isInRightColumn: boolean, positionAlongVariableDimension: vivliostyle.page.MarginBoxPositionAlongVariableDimension}}
 */
vivliostyle.page.PageMarginBoxInformation;

/**
 * Page-margin boxes.
 * @private
 * @const
 * @dict
 * @type {!Object.<string, vivliostyle.page.PageMarginBoxInformation>}
 */
vivliostyle.page.pageMarginBoxes = {
    "top-left-corner": {
        order: 1,
        isInTopRow: true,
        isInBottomRow: false,
        isInLeftColumn: true,
        isInRightColumn: true,
        positionAlongVariableDimension: null
    },
    "top-left": {
        order: 2,
        isInTopRow: true,
        isInBottomRow: false,
        isInLeftColumn: false,
        isInRightColumn: false,
        positionAlongVariableDimension: vivliostyle.page.MarginBoxPositionAlongVariableDimension.START
    },
    "top-center": {
        order: 3,
        isInTopRow: true,
        isInBottomRow: false,
        isInLeftColumn: false,
        isInRightColumn: false,
        positionAlongVariableDimension: vivliostyle.page.MarginBoxPositionAlongVariableDimension.CENTER
    },
    "top-right": {
        order: 4,
        isInTopRow: true,
        isInBottomRow: false,
        isInLeftColumn: false,
        isInRightColumn: false,
        positionAlongVariableDimension: vivliostyle.page.MarginBoxPositionAlongVariableDimension.END
    },
    "top-right-corner": {
        order: 5,
        isInTopRow: true,
        isInBottomRow: false,
        isInLeftColumn: false,
        isInRightColumn: true,
        positionAlongVariableDimension: null
    },
    "right-top": {
        order: 6,
        isInTopRow: false,
        isInBottomRow: false,
        isInLeftColumn: false,
        isInRightColumn: true,
        positionAlongVariableDimension: vivliostyle.page.MarginBoxPositionAlongVariableDimension.START
    },
    "right-middle": {
        order: 7,
        isInTopRow: false,
        isInBottomRow: false,
        isInLeftColumn: false,
        isInRightColumn: true,
        positionAlongVariableDimension: vivliostyle.page.MarginBoxPositionAlongVariableDimension.CENTER
    },
    "right-bottom": {
        order: 8,
        isInTopRow: false,
        isInBottomRow: false,
        isInLeftColumn: false,
        isInRightColumn: true,
        positionAlongVariableDimension: vivliostyle.page.MarginBoxPositionAlongVariableDimension.END
    },
    "bottom-right-corner": {
        order: 9,
        isInTopRow: false,
        isInBottomRow: true,
        isInLeftColumn: false,
        isInRightColumn: true,
        positionAlongVariableDimension: null
    },
    "bottom-right": {
        order: 10,
        isInTopRow: false,
        isInBottomRow: true,
        isInLeftColumn: false,
        isInRightColumn: false,
        positionAlongVariableDimension: vivliostyle.page.MarginBoxPositionAlongVariableDimension.END
    },
    "bottom-center": {
        order: 11,
        isInTopRow: false,
        isInBottomRow: true,
        isInLeftColumn: false,
        isInRightColumn: false,
        positionAlongVariableDimension: vivliostyle.page.MarginBoxPositionAlongVariableDimension.CENTER
    },
    "bottom-left": {
        order: 12,
        isInTopRow: false,
        isInBottomRow: true,
        isInLeftColumn: false,
        isInRightColumn: false,
        positionAlongVariableDimension: vivliostyle.page.MarginBoxPositionAlongVariableDimension.START
    },
    "bottom-left-corner": {
        order: 13,
        isInTopRow: false,
        isInBottomRow: true,
        isInLeftColumn: true,
        isInRightColumn: false,
        positionAlongVariableDimension: null
    },
    "left-bottom": {
        order: 14,
        isInTopRow: false,
        isInBottomRow: false,
        isInLeftColumn: true,
        isInRightColumn: false,
        positionAlongVariableDimension: vivliostyle.page.MarginBoxPositionAlongVariableDimension.END
    },
    "left-middle": {
        order: 15,
        isInTopRow: false,
        isInBottomRow: false,
        isInLeftColumn: true,
        isInRightColumn: false,
        positionAlongVariableDimension: vivliostyle.page.MarginBoxPositionAlongVariableDimension.CENTER
    },
    "left-top": {
        order: 16,
        isInTopRow: false,
        isInBottomRow: false,
        isInLeftColumn: true,
        isInRightColumn: false,
        positionAlongVariableDimension: vivliostyle.page.MarginBoxPositionAlongVariableDimension.START
    }
};

/**
 * Names for page-margin boxes order in the default painting order.
 * @private
 * @const
 * @type {!Array.<string>}
 */
vivliostyle.page.pageMarginBoxNames = (function() {
    var boxes = vivliostyle.page.pageMarginBoxes;
    return Object.keys(boxes).sort(function(a, b) {
        return boxes[a].order - boxes[b].order;
    });
})();

/**
 * Indicates that the page master is generated for @page rules.
 * @const
 */
vivliostyle.page.pageRuleMasterPseudoName = "vivliostyle-page-rule-master";

/**
 * Key for properties in margin contexts.
 * Styles in margin contexts are stored in pageStyle["_marginBoxes"][(margin box's name)].
 * @private
 * @const
 * @type {string}
 */
vivliostyle.page.marginBoxesKey = "_marginBoxes";

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

    var pageSize = vivliostyle.page.resolvePageSize(style);
    var partition = new vivliostyle.page.PageRulePartition(this.scope, this, style, pageSize);
    /** @const @private */ this.bodyPartitionKey = partition.key;

    /** @const @private */ this.pageMarginBoxes = /** @type {Object.<string, !vivliostyle.page.PageMarginBoxPartition>} */ ({});
    this.createPageMarginBoxes(style);

    this.applySpecified(style, pageSize);
};
goog.inherits(vivliostyle.page.PageRuleMaster, adapt.pm.PageMaster);

/**
 * Create page-margin boxes
 * @param {!adapt.csscasc.ElementStyle} style
 */
vivliostyle.page.PageRuleMaster.prototype.createPageMarginBoxes = function(style) {
    var marginBoxesMap = style[vivliostyle.page.marginBoxesKey];
    if (marginBoxesMap) {
        var self = this;
        vivliostyle.page.pageMarginBoxNames.forEach(function(name) {
            if (marginBoxesMap[name]) {
                self.pageMarginBoxes[name] = new vivliostyle.page.PageMarginBoxPartition(self.scope, self, name, style);
            }
        });
    }
};

/**
 * Transfer cascaded style for @page rules to 'specified' style of this PageBox
 * @private
 * @param {!adapt.csscasc.ElementStyle} style
 * @param {!vivliostyle.page.PageSize} pageSize
 */
vivliostyle.page.PageRuleMaster.prototype.applySpecified = function(style, pageSize) {
    this.specified["position"] = new adapt.csscasc.CascadeValue(adapt.css.ident.relative, 0);
    this.specified["width"] = new adapt.csscasc.CascadeValue(pageSize.width, 0);
    this.specified["height"] = new adapt.csscasc.CascadeValue(pageSize.height, 0);
    for (var name in style) {
        if (!vivliostyle.page.propertiesAppliedToPartition[name] && name !== "background-clip") {
            this.specified[name] = style[name];
        }
    }
};

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
 * @param {!vivliostyle.page.PageSize} pageSize
 * @constructor
 * @extends {adapt.pm.Partition}
 */
vivliostyle.page.PageRulePartition = function(scope, parent, style, pageSize) {
    adapt.pm.Partition.call(this, scope, null, null, [], parent);
    /** @const */ this.pageSize = pageSize;
    this.specified["z-index"] = new adapt.csscasc.CascadeValue(new adapt.css.Int(0), 0);
    this.applySpecified(style);
};
goog.inherits(vivliostyle.page.PageRulePartition, adapt.pm.Partition);

/**
 * Transfer cascaded style for @page rules to 'specified' style of this PageBox
 * @private
 * @param {!adapt.csscasc.ElementStyle} style
 */
vivliostyle.page.PageRulePartition.prototype.applySpecified = function(style) {
    this.specified["flow-from"] = new adapt.csscasc.CascadeValue(adapt.css.getName("body"), 0);
    // Use absolute positioning so that this partition's margins don't collapse with its parent's margins
    this.specified["position"] = new adapt.csscasc.CascadeValue(adapt.css.ident.absolute, 0);
    this.specified["overflow"] = new adapt.csscasc.CascadeValue(adapt.css.ident.visible, 0);
    for (var prop in vivliostyle.page.propertiesAppliedToPartition) {
        if (vivliostyle.page.propertiesAppliedToPartition.hasOwnProperty(prop)) {
            this.specified[prop] = style[prop];
        }
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
 * Represent a partition for a page-margin box
 * @param {adapt.expr.LexicalScope} scope
 * @param {!vivliostyle.page.PageRuleMaster} parent
 * @param {string} marginBoxName
 * @param {!adapt.csscasc.ElementStyle} style
 * @constructor
 * @extends {adapt.pm.Partition}
 */
vivliostyle.page.PageMarginBoxPartition = function(scope, parent, marginBoxName, style) {
    adapt.pm.Partition.call(this, scope, null, null, [], parent);
    /** @const */ this.marginBoxName = marginBoxName;
    this.applySpecified(style);
};
goog.inherits(vivliostyle.page.PageMarginBoxPartition, adapt.pm.Partition);

/**
 * Transfer cascaded style for @page rules to 'specified' style of this PageMarginBox
 * @param {!adapt.csscasc.ElementStyle} style
 */
vivliostyle.page.PageMarginBoxPartition.prototype.applySpecified = function(style) {
    var ownStyle = /** @type {!adapt.csscasc.ElementStyle} */
        (style[vivliostyle.page.marginBoxesKey][this.marginBoxName]);
    // Inherit properties in the page context to the page-margin context
    for (var prop in style) {
        var val = /** @type {adapt.csscasc.CascadeValue} */ (style[prop]);
        var ownVal = /** @type {adapt.csscasc.CascadeValue} */ (ownStyle[prop]);
        if (adapt.csscasc.inheritedProps[prop] || (ownVal && ownVal.value === adapt.css.ident.inherit)) {
            this.specified[prop] = val;
        }
    }
    for (var prop in ownStyle) {
        if (Object.prototype.hasOwnProperty.call(ownStyle, prop)) {
            var val = /** @type {adapt.csscasc.CascadeValue} */ (ownStyle[prop]);
            if (val && val.value !== adapt.css.ident.inherit) {
                this.specified[prop] = val;
            }
        }
    }
};

/**
 * @return {!vivliostyle.page.PageMarginBoxPartitionInstance}
 * @override
 */
vivliostyle.page.PageMarginBoxPartition.prototype.createInstance = function(parentInstance) {
    return new vivliostyle.page.PageMarginBoxPartitionInstance(parentInstance, this);
};

//---------------------------- Instance --------------------------------

/**
 * @private
 * @typedef {{
 *     borderBoxWidth: adapt.expr.Val,
 *     borderBoxHeight: adapt.expr.Val,
 *     marginTop: adapt.expr.Val,
 *     marginBottom: adapt.expr.Val,
 *     marginLeft: adapt.expr.Val,
 *     marginRight: adapt.expr.Val
 * }}
 */
vivliostyle.page.PageAreaDimension;

/**
 * @param {!adapt.pm.PageBoxInstance} parentInstance
 * @param {!vivliostyle.page.PageRuleMaster} pageRuleMaster
 * @constructor
 * @extends {adapt.pm.PageMasterInstance}
 */
vivliostyle.page.PageRuleMasterInstance = function(parentInstance, pageRuleMaster) {
    adapt.pm.PageMasterInstance.call(this, parentInstance, pageRuleMaster);
    /** @type {?vivliostyle.page.PageAreaDimension} */ this.pageAreaDimension = null;
    /** @type {Object.<string, !vivliostyle.page.PageMarginBoxPartitionInstance>} */ this.pageMarginBoxInstances = {};
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
 * @private
 * @param {!vivliostyle.page.PageAreaDimension} dim
 */
vivliostyle.page.PageRuleMasterInstance.prototype.setPageAreaDimension = function(dim) {
    this.pageAreaDimension = dim;

    var style = this.style;
    style["width"] = new adapt.css.Expr(dim.borderBoxWidth);
    style["height"] = new adapt.css.Expr(dim.borderBoxHeight);
    style["padding-left"] = new adapt.css.Expr(dim.marginLeft);
    style["padding-right"] = new adapt.css.Expr(dim.marginRight);
    style["padding-top"] = new adapt.css.Expr(dim.marginTop);
    style["padding-bottom"] = new adapt.css.Expr(dim.marginBottom);
};

/**
 * @override
 */
vivliostyle.page.PageRuleMasterInstance.prototype.adjustPageLayout = function(context, page, clientLayout) {
    var marginBoxContainers = page.marginBoxes;
    var horizontalDimensions = {
        start: /** @type {number} */ (this.pageAreaDimension.marginLeft.evaluate(context)),
        end: /** @type {number} */ (this.pageAreaDimension.marginRight.evaluate(context)),
        extent: /** @type {number} */ (this.pageAreaDimension.borderBoxWidth.evaluate(context))
    };
    var verticalDimensions = {
        start: /** @type {number} */ (this.pageAreaDimension.marginTop.evaluate(context)),
        end: /** @type {number} */ (this.pageAreaDimension.marginBottom.evaluate(context)),
        extent: /** @type {number} */ (this.pageAreaDimension.borderBoxHeight.evaluate(context))
    };
    this.sizeMarginBoxesAlongVariableDimension(marginBoxContainers.top, true, horizontalDimensions, clientLayout);
    this.sizeMarginBoxesAlongVariableDimension(marginBoxContainers.bottom, true, horizontalDimensions, clientLayout);
    this.sizeMarginBoxesAlongVariableDimension(marginBoxContainers.left, false, verticalDimensions, clientLayout);
    this.sizeMarginBoxesAlongVariableDimension(marginBoxContainers.right, false, verticalDimensions, clientLayout);
};

/**
 * Interface used for parameters passed to distributeAutoMarginBoxSizes method.
 * @private
 * @interface
 */
vivliostyle.page.PageRuleMasterInstance.MarginBoxSizingParam = function() {};

/**
 *  @returns {boolean}
 */
vivliostyle.page.PageRuleMasterInstance.MarginBoxSizingParam.prototype.hasAutoSize = function() {};

/**
 *  @returns {number}
 */
vivliostyle.page.PageRuleMasterInstance.MarginBoxSizingParam.prototype.getOuterMaxContentSize = function() {};

/**
 *  @returns {number}
 */
vivliostyle.page.PageRuleMasterInstance.MarginBoxSizingParam.prototype.getOuterMinContentSize = function() {};

/**
 *  @returns {number}
 */
vivliostyle.page.PageRuleMasterInstance.MarginBoxSizingParam.prototype.getOuterSize = function() {};

/**
 * MarginBoxSizingParam for a single page-margin box.
 * @param {adapt.vtree.Container} container A container corresponding to the target margin box.
 * @param {!Object.<string,adapt.css.Val>} style Styles specified to the target margin box.
 * @param {boolean} isHorizontal
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.vtree.ClientLayout} clientLayout
 * @constructor
 * @implements {vivliostyle.page.PageRuleMasterInstance.MarginBoxSizingParam}
 */
vivliostyle.page.PageRuleMasterInstance.SingleBoxMarginBoxSizingParam = function(container, style, isHorizontal, scope, clientLayout) {
    /** @private @const */ this.container = container;
    /** @private @const */ this.clientLayout = clientLayout;
    /** @private @const @type {boolean} */ this.isHorizontal = isHorizontal;
    /** @private @const @type {boolean} */ this.hasAutoSize_ = !adapt.pm.toExprAuto(scope, style[isHorizontal ? "width" : "height"], new adapt.expr.Numeric(scope, 0, "px"));
    /** @private @type {Object.<vivliostyle.sizing.Size, number>} */ this.size = null;
};

/**
 *  @override
 */
vivliostyle.page.PageRuleMasterInstance.SingleBoxMarginBoxSizingParam.prototype.hasAutoSize = function() {
    return this.hasAutoSize_;
};

/**
 * @private
 * @returns {!Object.<vivliostyle.sizing.Size, number>}
 */
vivliostyle.page.PageRuleMasterInstance.SingleBoxMarginBoxSizingParam.prototype.getSize = function() {
    if (!this.size) {
        var sizes = this.isHorizontal ?
            [vivliostyle.sizing.Size.MAX_CONTENT_WIDTH, vivliostyle.sizing.Size.MIN_CONTENT_WIDTH] :
            [vivliostyle.sizing.Size.MAX_CONTENT_HEIGHT, vivliostyle.sizing.Size.MIN_CONTENT_HEIGHT];
        this.size = vivliostyle.sizing.getSize(this.clientLayout, this.container.element, sizes);
    }
    return this.size;
};

/**
 * @override
 */
vivliostyle.page.PageRuleMasterInstance.SingleBoxMarginBoxSizingParam.prototype.getOuterMaxContentSize = function() {
    var size = this.getSize();
    if (this.isHorizontal) {
        return this.container.getInsetLeft() + size[vivliostyle.sizing.Size.MAX_CONTENT_WIDTH] + this.container.getInsetRight();
    } else {
        return this.container.getInsetTop() + size[vivliostyle.sizing.Size.MAX_CONTENT_HEIGHT] + this.container.getInsetBottom();
    }
};

/**
 * @override
 */
vivliostyle.page.PageRuleMasterInstance.SingleBoxMarginBoxSizingParam.prototype.getOuterMinContentSize = function() {
    var size = this.getSize();
    if (this.isHorizontal) {
        return this.container.getInsetLeft() + size[vivliostyle.sizing.Size.MIN_CONTENT_WIDTH] + this.container.getInsetRight();
    } else {
        return this.container.getInsetTop() + size[vivliostyle.sizing.Size.MIN_CONTENT_HEIGHT] + this.container.getInsetBottom();
    }
};

/**
 * @override
 */
vivliostyle.page.PageRuleMasterInstance.SingleBoxMarginBoxSizingParam.prototype.getOuterSize = function() {
    if (this.isHorizontal) {
        return this.container.getInsetLeft() + this.container.width + this.container.getInsetRight();
    } else {
        return this.container.getInsetTop() + this.container.height + this.container.getInsetBottom();
    }
};

/**
 * MarginBoxSizingParam with which multiple margin boxes are treated as one margin box.
 * Each method querying a dimension returns the maximum of the boxes multiplied by the number of the boxes.
 * @param {!Array.<!vivliostyle.page.PageRuleMasterInstance.MarginBoxSizingParam>} params MarginBoxSizingParam's of the target margin boxes.
 * @constructor
 * @implements {vivliostyle.page.PageRuleMasterInstance.MarginBoxSizingParam}
 */
vivliostyle.page.PageRuleMasterInstance.MultipleBoxesMarginBoxSizingParam = function(params) {
    /** @private @const */ this.params = params;
};

/**
 * @override
 */
vivliostyle.page.PageRuleMasterInstance.MultipleBoxesMarginBoxSizingParam.prototype.hasAutoSize = function() {
    return this.params.some(function(p) {
        return p.hasAutoSize();
    });
};

/**
 *  @override
 */
vivliostyle.page.PageRuleMasterInstance.MultipleBoxesMarginBoxSizingParam.prototype.getOuterMaxContentSize = function() {
    var sizes = this.params.map(function(p) {
        return p.getOuterMaxContentSize();
    });
    return Math.max.apply(null, sizes) * sizes.length;
};

/**
 *  @override
 */
vivliostyle.page.PageRuleMasterInstance.MultipleBoxesMarginBoxSizingParam.prototype.getOuterMinContentSize = function() {
    var sizes = this.params.map(function(p) {
        return p.getOuterMinContentSize();
    });
    return Math.max.apply(null, sizes) * sizes.length;
};

/**
 *  @override
 */
vivliostyle.page.PageRuleMasterInstance.MultipleBoxesMarginBoxSizingParam.prototype.getOuterSize = function() {
    var sizes = this.params.map(function(p) {
        return p.getOuterSize();
    });
    return Math.max.apply(null, sizes) * sizes.length;
};

/**
 * Determine and set margin boxes' sizes along variable dimension using an algorithm specified in CSS Paged Media spec.
 * @private
 * @param {!Object.<string, adapt.vtree.Container>} marginBoxContainers Containers corresponding to the target margin boxes in one page edge (top, bottom, left, right)
 * @param {boolean} isHorizontal Indicates if the target margin boxes are on the horizontal edge (top or bottom) or not (left or right).
 * @param {!{start: number, end: number, extent: number}} dimensions Page dimensions. start: margin-left or margin-top. end: margin-right or margin-bottom. extent: border-box width or height of the page area (= available width or height for the target margin boxes)
 * @param {adapt.vtree.ClientLayout} clientLayout
 */
vivliostyle.page.PageRuleMasterInstance.prototype.sizeMarginBoxesAlongVariableDimension = function(marginBoxContainers, isHorizontal, dimensions, clientLayout) {
    // prepare parameters
    var scope = this.pageBox.scope;
    /** @type {?{container: adapt.vtree.Container, boxInstance: vivliostyle.page.PageMarginBoxPartitionInstance}} */ var startBox = null;
    /** @type {?vivliostyle.page.PageRuleMasterInstance.SingleBoxMarginBoxSizingParam} */ var startBoxParam = null;
    /** @type {?{container: adapt.vtree.Container, boxInstance: vivliostyle.page.PageMarginBoxPartitionInstance}} */ var centerBox = null;
    /** @type {?vivliostyle.page.PageRuleMasterInstance.SingleBoxMarginBoxSizingParam} */ var centerBoxParam = null;
    /** @type {?{container: adapt.vtree.Container, boxInstance: vivliostyle.page.PageMarginBoxPartitionInstance}} */ var endBox = null;
    /** @type {?vivliostyle.page.PageRuleMasterInstance.SingleBoxMarginBoxSizingParam} */ var endBoxParam = null;
    for (var name in marginBoxContainers) {
        var boxInfo = vivliostyle.page.pageMarginBoxes[name];
        if (boxInfo) {
            var box = {
                container: marginBoxContainers[name],
                boxInstance: this.pageMarginBoxInstances[name]
            };
            var boxParam = new vivliostyle.page.PageRuleMasterInstance.SingleBoxMarginBoxSizingParam(box.container, box.boxInstance.style, isHorizontal, scope, clientLayout);
            switch (boxInfo.positionAlongVariableDimension) {
                case vivliostyle.page.MarginBoxPositionAlongVariableDimension.START:
                    startBox = box;
                    startBoxParam = boxParam;
                    break;
                case vivliostyle.page.MarginBoxPositionAlongVariableDimension.CENTER:
                    centerBox = box;
                    centerBoxParam = boxParam;
                    break;
                case vivliostyle.page.MarginBoxPositionAlongVariableDimension.END:
                    endBox = box;
                    endBoxParam = boxParam;
                    break;
            }
        }
    }

    // determine sizes
    var sizes = {};
    if (!centerBox) {
        var startEndSizes = this.distributeAutoMarginBoxSizes(startBoxParam, endBoxParam, dimensions.extent);
        if (startEndSizes.xSize) {
            sizes.startSize = startEndSizes.xSize;
        }
        if (startEndSizes.ySize) {
            sizes.endSize = startEndSizes.ySize;
        }
    } else {
        var startEndBoxParam = new vivliostyle.page.PageRuleMasterInstance.MultipleBoxesMarginBoxSizingParam([startBoxParam, endBoxParam]);
        var centerSizes = this.distributeAutoMarginBoxSizes(centerBoxParam, startEndBoxParam, dimensions.extent);
        if (centerSizes.xSize) {
            sizes.centerSize = centerSizes.xSize;
        }
        var centerSize = centerSizes.xSize || centerBoxParam.getOuterSize();
        var startEndAutoSize = (dimensions.extent - centerSize) / 2;
        if (startBoxParam.hasAutoSize()) {
            sizes.startSize = startEndAutoSize;
        }
        if (endBoxParam.hasAutoSize()) {
            sizes.endSize = startEndAutoSize;
        }
    }

    // set sizes
    var endEdge = dimensions.start + dimensions.extent;
    var startEndSum = dimensions.start + (dimensions.start + dimensions.extent);
    if (isHorizontal) {
        if (sizes.startSize) {
            startBox.container.setHorizontalPosition(startBox.container.left, sizes.startSize - startBox.container.getInsetLeft() - startBox.container.getInsetRight());
        }
        if (sizes.centerSize) {
            centerBox.container.setHorizontalPosition((startEndSum - sizes.centerSize) / 2, sizes.centerSize - centerBox.container.getInsetLeft() - centerBox.container.getInsetRight());
        }
        if (sizes.endSize) {
            endBox.container.setHorizontalPosition(endEdge - sizes.endSize, sizes.endSize - endBox.container.getInsetLeft() - endBox.container.getInsetRight());
        }
    } else {
        if (sizes.startSize) {
            startBox.container.setVerticalPosition(startBox.container.top, sizes.startSize - startBox.container.getInsetTop() - startBox.container.getInsetBottom());
        }
        if (sizes.centerSize) {
            centerBox.container.setVerticalPosition((startEndSum - sizes.centerSize) / 2, sizes.centerSize - centerBox.container.getInsetTop() - centerBox.container.getInsetBottom());
        }
        if (sizes.endSize) {
            endBox.container.setVerticalPosition(endEdge - sizes.endSize, sizes.endSize - endBox.container.getInsetTop() - endBox.container.getInsetBottom());
        }
    }
};

/**
 * Distribute auto margin sizes among two margin boxes using an algorithm specified in CSS Paged Media spec.
 * @private
 * @param {vivliostyle.page.PageRuleMasterInstance.MarginBoxSizingParam} x Parameter for the first margin box. null if the box is not generated.
 * @param {vivliostyle.page.PageRuleMasterInstance.MarginBoxSizingParam} y Parameter for the second margin box. null if the box is not generated.
 * @param {number} availableSize Available size for the margin boxes.
 * @returns {!{xSize: number?, ySize: number?}} Determined sizes for the two boxes. Each value is present only when the size of the corresponding box is 'auto'.
 */
vivliostyle.page.PageRuleMasterInstance.prototype.distributeAutoMarginBoxSizes = function(x, y, availableSize) {
    /** @type {!{xSize: number?, ySize: number?}} */ var result = {xSize: null, ySize: null};
    if (x && y) {
        if (x.hasAutoSize() && y.hasAutoSize()) {
            var xOuterMaxContentSize = x.getOuterMaxContentSize();
            var yOuterMaxContentSize = y.getOuterMaxContentSize();
            if (xOuterMaxContentSize > 0 && yOuterMaxContentSize > 0) {
                var maxContentSizeSum = xOuterMaxContentSize + yOuterMaxContentSize;
                if (maxContentSizeSum < availableSize) {
                    result.xSize = availableSize * xOuterMaxContentSize / maxContentSizeSum;
                } else {
                    var xOuterMinContentSize = x.getOuterMinContentSize();
                    var yOuterMinContentSize = y.getOuterMinContentSize();
                    var minContentSizeSum = xOuterMinContentSize + yOuterMinContentSize;
                    if (minContentSizeSum < availableSize) {
                        result.xSize = xOuterMinContentSize + (availableSize - minContentSizeSum) * (xOuterMaxContentSize - xOuterMinContentSize) / (maxContentSizeSum - minContentSizeSum);
                    } else if (minContentSizeSum > 0) {
                        result.xSize = availableSize * xOuterMinContentSize / minContentSizeSum;
                    }
                }
                if (result.xSize > 0) {
                    result.ySize = availableSize - result.xSize;
                }
            } else if (xOuterMaxContentSize > 0) {
                result.xSize = availableSize;
            } else if (yOuterMaxContentSize > 0) {
                result.ySize = availableSize;
            }
        } else if (x.hasAutoSize()) {
            result.xSize = Math.max(availableSize - y.getOuterSize(), 0);
        } else if (y.hasAutoSize()) {
            result.ySize = Math.max(availableSize - x.getOuterSize(), 0);
        }
    } else if (x) {
        if (x.hasAutoSize()) {
            result.xSize = availableSize;
        }
    } else if (y) {
        if (y.hasAutoSize()) {
            result.ySize = availableSize;
        }
    }
    return result;
};

/**
 * @param {!adapt.pm.PageBoxInstance} parentInstance
 * @param {!vivliostyle.page.PageRulePartition} pageRulePartition
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
            if (name.match(/^column.*$/) ||
                name.match(/^background-/)) {
                style[name] = docElementStyle[name];
            }
        }
    }

    adapt.pm.PartitionInstance.prototype.applyCascadeAndInit.call(this, cascade, docElementStyle);

    var pageRuleMasterInstance = /** @type {vivliostyle.page.PageRuleMasterInstance} */ (this.parentInstance);
    pageRuleMasterInstance.setPageAreaDimension({
        borderBoxWidth: this.borderBoxWidth,
        borderBoxHeight: this.borderBoxHeight,
        marginTop: this.marginTop,
        marginRight: this.marginRight,
        marginBottom: this.marginBottom,
        marginLeft: this.marginLeft
    });
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

    style[startSide] = new adapt.css.Expr(marginStart);
    style[endSide] = new adapt.css.Expr(marginEnd);
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
 * @param {!adapt.pm.PageBoxInstance} parentInstance
 * @param {!vivliostyle.page.PageMarginBoxPartition} pageMarginBoxPartition
 * @constructor
 * @extends {adapt.pm.PartitionInstance}
 */
vivliostyle.page.PageMarginBoxPartitionInstance = function(parentInstance, pageMarginBoxPartition) {
    adapt.pm.PartitionInstance.call(this, parentInstance, pageMarginBoxPartition);
    var name = pageMarginBoxPartition.marginBoxName;
    /** @type {vivliostyle.page.PageMarginBoxInformation} */ this.boxInfo =
        vivliostyle.page.pageMarginBoxes[name];
    var pageRuleMasterInstance = /** @type {vivliostyle.page.PageRuleMasterInstance} */ (parentInstance);
    pageRuleMasterInstance.pageMarginBoxInstances[name] = this;
    this.suppressEmptyBoxGeneration = true;
};
goog.inherits(vivliostyle.page.PageMarginBoxPartitionInstance, adapt.pm.PartitionInstance);

/**
 * Calculate page-margin boxes positions along the variable dimension of the page.
 * For CENTER and END margin boxes, the position is calculated only if the dimension (width or height) is non-auto, so that it can be resolved at this point. If the dimension is auto, the calculation is deffered.
 * @private
 * @param {!{start: string, end: string, extent: string}} names
 * @param {?vivliostyle.page.PageAreaDimension} dim
 */
vivliostyle.page.PageMarginBoxPartitionInstance.prototype.positionAlongVariableDimension = function(names, dim) {
    var style = this.style;
    var scope = this.pageBox.scope;
    var startSide = names.start;
    var endSide = names.end;
    var extentName = names.extent;
    var isHorizontal = startSide === "left";
    var availableExtent = isHorizontal ? dim.borderBoxWidth : dim.borderBoxHeight;
    var extent = adapt.pm.toExprAuto(scope, style[extentName], availableExtent);
    var startOffset = isHorizontal ? dim.marginLeft : dim.marginTop;
    if (this.boxInfo.positionAlongVariableDimension === vivliostyle.page.MarginBoxPositionAlongVariableDimension.START) {
        style[startSide] = new adapt.css.Expr(startOffset);
    } else if (extent) {
        var marginStart = adapt.pm.toExprZero(scope, style["margin-" + startSide], availableExtent);
        var marginEnd = adapt.pm.toExprZero(scope, style["margin-" + endSide], availableExtent);
        var paddingStart = adapt.pm.toExprZero(scope, style["padding-" + startSide], availableExtent);
        var paddingEnd = adapt.pm.toExprZero(scope, style["padding-" + endSide], availableExtent);
        var borderStartWidth = adapt.pm.toExprZeroBorder(scope, style["border-" + startSide + "-width"], style["border-" + startSide + "-style"], availableExtent);
        var borderEndWidth = adapt.pm.toExprZeroBorder(scope, style["border-" + endSide + "-width"], style["border-" + endSide + "-style"], availableExtent);
        var outerExtent = adapt.expr.add(scope, extent,
            adapt.expr.add(scope,
                adapt.expr.add(scope, paddingStart, paddingEnd),
                adapt.expr.add(scope,
                    adapt.expr.add(scope, borderStartWidth, borderEndWidth),
                    adapt.expr.add(scope, marginStart, marginEnd)
                )
            )
        );
        switch (this.boxInfo.positionAlongVariableDimension) {
            case vivliostyle.page.MarginBoxPositionAlongVariableDimension.CENTER:
                style[startSide] = new adapt.css.Expr(
                    adapt.expr.add(scope,
                        startOffset,
                        adapt.expr.div(scope,
                            adapt.expr.sub(scope, availableExtent, outerExtent),
                            new adapt.expr.Const(scope, 2)
                        )
                    )
                );
                break;
            case vivliostyle.page.MarginBoxPositionAlongVariableDimension.END:
                style[startSide] = new adapt.css.Expr(
                    adapt.expr.sub(scope,
                        adapt.expr.add(scope, startOffset, availableExtent),
                        outerExtent
                    )
                );
                break;
        }
    }
};

/**
 * Calculate page-margin boxes positions along the fixed dimension of the page.
 * @private
 * @param {!{inside: string, outside: string, extent: string}} names
 * @param {?vivliostyle.page.PageAreaDimension} dim
 */
vivliostyle.page.PageMarginBoxPartitionInstance.prototype.positionAndSizeAlongFixedDimension =
    function(names, dim) {
        var style = this.style;
        var scope = this.pageBox.scope;
        var insideName = names.inside;
        var outsideName = names.outside;
        var extentName = names.extent;
        var pageMargin = dim["margin" + outsideName.charAt(0).toUpperCase() + outsideName.substring(1)];
        var marginInside = adapt.pm.toExprZeroAuto(scope, style["margin-" + insideName], pageMargin);
        var marginOutside = adapt.pm.toExprZeroAuto(scope, style["margin-" + outsideName], pageMargin);
        var paddingInside = adapt.pm.toExprZero(scope, style["padding-" + insideName], pageMargin);
        var paddingOutside = adapt.pm.toExprZero(scope, style["padding-" + outsideName], pageMargin);
        var borderInsideWidth = adapt.pm.toExprZeroBorder(scope, style["border-" + insideName + "-width"], style["border-" + insideName + "-style"], pageMargin);
        var borderOutsideWidth = adapt.pm.toExprZeroBorder(scope, style["border-" + outsideName + "-width"], style["border-" + outsideName + "-style"], pageMargin);
        var extent = adapt.pm.toExprAuto(scope, style[extentName], pageMargin);
        var result = null;
        /**
         * @param {adapt.expr.Context} context
         * @returns {{extent: (adapt.expr.Result|null), marginInside: (adapt.expr.Result|null), marginOutside: (adapt.expr.Result|null)}}
         */
        function getComputedValues(context) {
            if (result) {
                return result;
            }
            result = {
                extent: extent ? extent.evaluate(context) : null,
                marginInside: marginInside ? marginInside.evaluate(context) : null,
                marginOutside: marginOutside ? marginOutside.evaluate(context) : null
            };
            var pageMarginValue = pageMargin.evaluate(context);
            var borderAndPadding = 0;
            [borderInsideWidth, paddingInside, paddingOutside, borderOutsideWidth].forEach(function(x) {
                if (x) {
                    borderAndPadding += x.evaluate(context);
                }
            });
            if (result.marginInside === null || result.marginOutside === null) {
                var total = borderAndPadding + result.extent + result.marginInside + result.marginOutside;
                if (total > pageMarginValue) {
                    if (result.marginInside === null) {
                        result.marginInside = 0;
                    }
                    if (result.marginOutside === null) {
                        result.marginoutside = 0;
                    }
                }
            }
            if (result.extent !== null && result.marginInside !== null && result.marginOutside !== null) {
                // over-constrained
                result.marginOutside = null;
            }
            if (result.extent === null && result.marginInside !== null && result.marginOutside !== null) {
                result.extent = pageMarginValue - borderAndPadding - result.marginInside - result.marginOutside;
            } else if (result.extent !== null && result.marginInside === null && result.marginOutside !== null) {
                result.marginInside = pageMarginValue - borderAndPadding - result.extent - result.marginOutside;
            } else if (result.extent !== null && result.marginInside !== null && result.marginOutside === null) {
                result.marginOutside = pageMarginValue - borderAndPadding - result.extent - result.marginInside;
            } else if (result.extent === null) {
                result.marginInside = result.marginOutside = 0;
                result.extent = pageMarginValue - borderAndPadding;
            } else {
                result.marginInside = result.marginOutside = (pageMarginValue - borderAndPadding - result.extent) / 2;
            }
            return result;
        }

        style[extentName] = new adapt.css.Expr(new adapt.expr.Native(scope, function() {
            var value = getComputedValues(this).extent;
            return value === null ? 0 : value;
        }, extentName));
        style["margin-" + insideName] = new adapt.css.Expr(new adapt.expr.Native(scope, function() {
            var value = getComputedValues(this).marginInside;
            return value === null ? 0 : value;
        }, "margin-" + insideName));
        style["margin-" + outsideName] = new adapt.css.Expr(new adapt.expr.Native(scope, function() {
            var value = getComputedValues(this).marginOutside;
            return value === null ? 0 : value;
        }, "margin-" + outsideName));

        if (insideName === "left") {
            style["left"] = new adapt.css.Expr(adapt.expr.add(scope, dim.marginLeft, dim.borderBoxWidth));
        } else if (insideName === "top") {
            style["top"] = new adapt.css.Expr(adapt.expr.add(scope, dim.marginTop, dim.borderBoxHeight));
        }
};

/**
 * @override
 */
vivliostyle.page.PageMarginBoxPartitionInstance.prototype.initHorizontal = function() {
    var pageRuleMasterInstance = /** @type {!vivliostyle.page.PageRuleMasterInstance} */ (this.parentInstance);
    var dim = pageRuleMasterInstance.pageAreaDimension;
    if (this.boxInfo.isInLeftColumn) {
        this.positionAndSizeAlongFixedDimension({inside: "right", outside: "left", extent: "width"}, dim);
    } else if (this.boxInfo.isInRightColumn) {
        this.positionAndSizeAlongFixedDimension({inside: "left", outside: "right", extent: "width"}, dim);
    } else {
        this.positionAlongVariableDimension({start: "left", end: "right", extent: "width"}, dim);
    }
};

/**
 * @override
 */
vivliostyle.page.PageMarginBoxPartitionInstance.prototype.initVertical = function() {
    var pageRuleMasterInstance = /** @type {!vivliostyle.page.PageRuleMasterInstance} */ (this.parentInstance);
    var dim = pageRuleMasterInstance.pageAreaDimension;
    if (this.boxInfo.isInTopRow) {
        this.positionAndSizeAlongFixedDimension({inside: "bottom", outside: "top", extent: "height"}, dim);
    } else if (this.boxInfo.isInBottomRow) {
        this.positionAndSizeAlongFixedDimension({inside: "top", outside: "bottom", extent: "height"}, dim);
    } else {
        this.positionAlongVariableDimension({start: "top", end: "bottom", extent: "height"}, dim);
    }
};

/**
 * @override
 */
vivliostyle.page.PageMarginBoxPartitionInstance.prototype.finishContainer = function(
    context, container, page, column, columnCount, clientLayout) {
    adapt.pm.PartitionInstance.prototype.finishContainer.call(this,
        context, container, page, column, columnCount, clientLayout);

    // finishContainer is called only when the margin box is generated.
    // In this case, store the generated container for the margin box in the page object.
    // (except when it is a corner margin box, because size of a corner margin box does not need to be adjusted after the layout)
    var marginBoxes = page.marginBoxes;
    var name = this.pageBox.marginBoxName;
    var boxInfo = this.boxInfo;
    if (!boxInfo.isInLeftColumn && !boxInfo.isInRightColumn) {
        if (boxInfo.isInTopRow) {
            marginBoxes.top[name] = container;
        } else if (boxInfo.isInBottomRow) {
            marginBoxes.bottom[name] = container;
        }
    } else if (!boxInfo.isInTopRow && !boxInfo.isInBottomRow) {
        if (boxInfo.isInLeftColumn) {
            marginBoxes.left[name] = container;
        } else if (boxInfo.isInRightColumn) {
            marginBoxes.right[name] = container;
        }
    }
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
    /** @const @private */ this.pageMasterCache = /** @type {Object.<string, !adapt.pm.PageMasterInstance>} */ ({});
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
 * Get cascaded page style specified in page context for the current page.
 * @returns {!adapt.csscasc.ElementStyle}
 */
vivliostyle.page.PageManager.prototype.getCascadedPageStyle = function() {
    var style = /** @type {!adapt.csscasc.ElementStyle} */ ({});
    this.cascadeInstance.pushRule([], "", style);
    this.cascadeInstance.popRule();
    return style;
};

/**
 * Return a PageMasterInstance with page rules applied. Return a cached instance if there already exists one with the same styles.
 * @param {!adapt.pm.PageMasterInstance} pageMasterInstance The original page master instance.
 * @param {!adapt.csscasc.ElementStyle} cascadedPageStyle Cascaded page style specified in page context.
 * @return {!adapt.pm.PageMasterInstance}
 */
vivliostyle.page.PageManager.prototype.getPageRulePageMaster = function(pageMasterInstance, cascadedPageStyle) {
    var pageMaster = /** @type {!adapt.pm.PageMaster} */ (pageMasterInstance.pageBox);

    // If no properies are specified in @page rules, use the original page master.
    if (Object.keys(cascadedPageStyle).length === 0) {
        pageMaster.resetScope();
        return pageMasterInstance;
    }

    /** @const */ var key = this.makeCacheKey(cascadedPageStyle, pageMaster);
    var applied = this.pageMasterCache[key];

    if (!applied) {
        if (pageMaster.pseudoName === adapt.pm.userAgentPageMasterPseudo) {
            // If the passed page master is a UA page master,
            // ignore it and generate a new page master from @page rules.
            applied = this.generatePageRuleMaster(cascadedPageStyle);
        } else {
            // Otherwise cascade some properties from @page rules to the page master.
            applied = this.generateCascadedPageMaster(cascadedPageStyle, pageMaster);
        }
        this.pageMasterCache[key] = applied;
    }

    applied.pageBox.resetScope();
    return applied;
};

/**
 * Generate a cache key from the specified styles and the original page master key.
 * @private
 * @param {!adapt.csscasc.ElementStyle} style
 * @param {!adapt.pm.PageMaster} pageMaster
 * @return {string}
 */
vivliostyle.page.PageManager.prototype.makeCacheKey = function(style, pageMaster) {
    /** @const */ var props = /** @type {Array.<string>} */ ([]);
    for (var prop in style) {
        if (Object.prototype.hasOwnProperty.call(style, prop)) {
            var val = style[prop];
            props.push(prop + val.value + val.priority);
        }
    }
    props.push(pageMaster.key);
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
    pageMasterInstance.resolveAutoSizing(this.context);
    return pageMasterInstance;
};

/**
 * Cascade some properties from @page rules to a page master.
 * For now, only 'width' and 'height' resolved from 'size' value are cascaded.
 * @private
 * @param {!adapt.csscasc.ElementStyle} style Cascaded style in the page context
 * @param {!adapt.pm.PageMaster} pageMaster The original page master
 * @returns {!adapt.pm.PageMasterInstance}
 */
vivliostyle.page.PageManager.prototype.generateCascadedPageMaster = function(style, pageMaster) {
    var newPageMaster = pageMaster.clone({pseudoName: vivliostyle.page.pageRuleMasterPseudoName});
    var size = style["size"];
    if (size) {
        var pageSize = vivliostyle.page.resolvePageSize(style);
        var priority = size.priority;
        newPageMaster.specified["width"] = adapt.csscasc.cascadeValues(
            this.context, newPageMaster.specified["width"],
            new adapt.csscasc.CascadeValue(pageSize.width, priority));
        newPageMaster.specified["height"] = adapt.csscasc.cascadeValues(
            this.context, newPageMaster.specified["height"],
            new adapt.csscasc.CascadeValue(pageSize.height, priority));
    }

    var pageMasterInstance = newPageMaster.createInstance(this.rootPageBoxInstance);
    // Do the same initialization as in adapt.ops.StyleInstance.prototype.init
    pageMasterInstance.applyCascadeAndInit(this.cascadeInstance, this.docElementStyle);
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
 * Action applying an at-page rule
 * @param {adapt.csscasc.ElementStyle} style
 * @param {number} specificity
 * @constructor
 * @extends {adapt.csscasc.ApplyRuleAction}
 */
vivliostyle.page.ApplyPageRuleAction = function(style, specificity) {
    adapt.csscasc.ApplyRuleAction.call(this, style, specificity, null, null);
};
goog.inherits(vivliostyle.page.ApplyPageRuleAction, adapt.csscasc.ApplyRuleAction);

/**
 * @override
 */
vivliostyle.page.ApplyPageRuleAction.prototype.apply = function(cascadeInstance) {
    vivliostyle.page.mergeInPageRule(cascadeInstance.context, cascadeInstance.currentStyle,
        this.style, this.specificity, cascadeInstance);
};

/**
 * Merge page styles, including styles specified on page-margin boxes, considering specificity.
 * Intended to be used in place of adapt.csscasc.mergeIn, which is for element styles.
 * @param {adapt.expr.Context} context
 * @param {adapt.csscasc.ElementStyle} target
 * @param {adapt.csscasc.ElementStyle} style
 * @param {number} specificity
 * @param {!adapt.csscasc.CascadeInstance} cascadeInstance
 */
vivliostyle.page.mergeInPageRule = function(context, target, style, specificity, cascadeInstance) {
    adapt.csscasc.mergeIn(context, target, style, specificity, null, null);
    var marginBoxes = style[vivliostyle.page.marginBoxesKey];
    if (marginBoxes) {
        var targetMap = adapt.csscasc.getMutableStyleMap(target, vivliostyle.page.marginBoxesKey);
        for (var boxName in marginBoxes) {
            if (marginBoxes.hasOwnProperty(boxName)) {
                var targetBox = targetMap[boxName];
                if (!targetBox) {
                    targetBox = /** @type {adapt.csscasc.ElementStyle} */ ({});
                    targetMap[boxName] = targetBox;
                }
                adapt.csscasc.mergeIn(context, targetBox, marginBoxes[boxName], specificity, null, null);
                if (targetBox["content"]) {
                    targetBox["content"] = targetBox["content"].filterValue(
                        new adapt.csscasc.ContentPropVisitor(cascadeInstance, null));
                }
            }
        }
    }
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

/**
 * @override
 */
vivliostyle.page.PageParserHandler.prototype.makeApplyRuleAction = function(specificity) {
    return new vivliostyle.page.ApplyPageRuleAction(this.elementStyle, specificity);
};

/**
 * @override
 */
vivliostyle.page.PageParserHandler.prototype.startPageMarginBoxRule = function(name) {
    var marginBoxMap = adapt.csscasc.getMutableStyleMap(this.elementStyle, vivliostyle.page.marginBoxesKey);
    var boxStyle = marginBoxMap[name];
    if (!boxStyle) {
        boxStyle = /** @type {!adapt.csscasc.ElementStyle} */ ({});
        marginBoxMap[name] = boxStyle;
    }
    var handler = new vivliostyle.page.PageMarginBoxParserHandler(this.scope, this.owner,
        this.validatorSet, boxStyle);
    this.owner.pushHandler(handler);
};

/**
 * Parser handler for a page-margin box rule.
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.cssparse.DispatchParserHandler} owner
 * @param {adapt.cssvalid.ValidatorSet} validatorSet
 * @param {!adapt.csscasc.ElementStyle} boxStyle
 * @constructor
 * @extends {adapt.cssparse.SlaveParserHandler}
 * @implements {adapt.cssvalid.PropertyReceiver}
 */
vivliostyle.page.PageMarginBoxParserHandler = function(scope, owner, validatorSet, boxStyle) {
    adapt.cssparse.SlaveParserHandler.call(this, scope, owner, false);
    /** @const */ this.validatorSet = validatorSet;
    /** @const */ this.boxStyle = boxStyle;
};
goog.inherits(vivliostyle.page.PageMarginBoxParserHandler, adapt.cssparse.SlaveParserHandler);

/**
 * @override
 */
vivliostyle.page.PageMarginBoxParserHandler.prototype.property = function(name, value, important) {
    this.validatorSet.validatePropertyAndHandleShorthand(name, value, important, this);
};

/**
 * @override
 */
vivliostyle.page.PageMarginBoxParserHandler.prototype.invalidPropertyValue = function(name, value) {
    this.report("E_INVALID_PROPERTY_VALUE " + name + ": " + value.toString());
};

/**
 * @override
 */
vivliostyle.page.PageMarginBoxParserHandler.prototype.unknownProperty = function(name, value) {
    this.report("E_INVALID_PROPERTY " + name + ": " + value.toString());
};

/**
 * @override
 */
vivliostyle.page.PageMarginBoxParserHandler.prototype.simpleProperty = function(name, value, important) {
    var specificity = important ? this.getImportantSpecificity() : this.getBaseSpecificity();
    var cascval = new adapt.csscasc.CascadeValue(value, specificity);
    adapt.csscasc.setProp(this.boxStyle, name, cascval);
};


/**
 * Object storing page-based counters.
 * @param {adapt.expr.LexicalScope} pageScope Scope in which a page-based counter's adapt.expr.Val is defined. Since the page-based counters are updated per page, the scope should be a page scope, which is cleared per page.
 * @constructor
 * @implements {adapt.csscasc.PageCounterResolver}
 */
vivliostyle.page.PageCounterStore = function(pageScope) {
    /** @const */ this.pageScope = pageScope;
    /** @const @type {Object.<string,!Array.<number>>} */ this.counters = {};
    this.counters["page"] = [0];
};

/**
 * @override
 */
vivliostyle.page.PageCounterStore.prototype.getCounterVal = function(name, format) {
    var self = this;
    function getCounterNumber() {
        var values = self.counters[name];
        return (values && values.length) ? values[values.length - 1] : null;
    }
    return new adapt.expr.Native(this.pageScope, function() {
        return format(getCounterNumber());
    }, "page-counter-" + name);
};

/**
 * @override
 */
vivliostyle.page.PageCounterStore.prototype.getCountersVal = function(name, format) {
    var self = this;
    function getCounterNumbers() {
        return self.counters[name] || [];
    }
    return new adapt.expr.Native(this.pageScope, function() {
        return format(getCounterNumbers());
    }, "page-counters-" + name)
};

/**
 * @private
 * @param {string} counterName
 * @param {number} value
 */
vivliostyle.page.PageCounterStore.prototype.defineCounter = function(counterName, value) {
    if (this.counters[counterName]) {
        this.counters[counterName].push(value);
    } else {
        this.counters[counterName] = [value];
    }
};

/**
 * Update the page-based counters with 'counter-reset' and 'counter-increment' properties within the page context. Call before starting layout of the page.
 * @param {!adapt.csscasc.ElementStyle} cascadedPageStyle
 * @param {!adapt.expr.Context} context
 */
vivliostyle.page.PageCounterStore.prototype.updatePageCounters = function(cascadedPageStyle, context) {
    var resetMap;
    var reset = cascadedPageStyle["counter-reset"];
    if (reset) {
        var resetVal = reset.evaluate(context);
        if (resetVal) {
            resetMap = adapt.cssprop.toCounters(resetVal, true);
        }
    }
    if (resetMap) {
        for (var resetCounterName in resetMap) {
            this.defineCounter(resetCounterName, resetMap[resetCounterName]);
        }
    }

    var incrementMap;
    var increment = cascadedPageStyle["counter-increment"];
    if (increment) {
        var incrementVal = increment.evaluate(context);
        if (incrementVal) {
            incrementMap = adapt.cssprop.toCounters(incrementVal, false);
        }
    }
    // If 'counter-increment' for the builtin 'page' counter is absent, add it with value 1.
    if (incrementMap) {
        if (!("page" in incrementMap)) {
            incrementMap["page"] = 1;
        }
    } else {
        incrementMap = {};
        incrementMap["page"] = 1;
    }
    for (var incrementCounterName in incrementMap) {
        if (!this.counters[incrementCounterName]) {
            this.defineCounter(incrementCounterName, 0);
        }
        var counterValues = this.counters[incrementCounterName];
        counterValues[counterValues.length - 1] += incrementMap[incrementCounterName];
    }
};
