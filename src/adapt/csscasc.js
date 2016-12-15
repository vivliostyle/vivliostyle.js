/**
 * Copyright 2013 Google, Inc.
 * Copyright 2015 Vivliostyle Inc.
 * @fileoverview CSS Cascade.
 */
goog.provide('adapt.csscasc');

goog.require('vivliostyle.logging');
goog.require('vivliostyle.plugin');
goog.require('adapt.expr');
goog.require('adapt.css');
goog.require('adapt.task');
goog.require('adapt.taskutil');
goog.require('adapt.cssprop');
goog.require('adapt.cssparse');
goog.require('adapt.cssvalid');

adapt.csscasc.inheritedProps = {
    "azimuth": true,
    "border-collapse": true,
    "border-spacing": true,
    "caption-side": true,
    "clip-rule": true,
    "color": true,
    "color-interpolation": true,
    "color-rendering": true,
    "cursor": true,
    "direction": true,
    "elevation": true,
    "empty-cells": true,
    "fill": true,
    "fill-opacity": true,
    "fill-rule": true,
    "font-kerning": true,
    "font-size": true,
    "font-size-adjust": true,
    "font-family": true,
    "font-feature-settings": true,
    "font-style": true,
    "font-stretch": true,
    "font-variant": true,
    "font-weight": true,
    "glyph-orientation-vertical": true,
    "hyphens": true,
    "hyphenate-character": true,
    "hyphenate-limit-chars": true,
    "hyphenate-limit-last": true,
    "image-rendering": true,
    "image-resolution": true,
    "letter-spacing": true,
    "line-break": true,
    "line-height": true,
    "list-style-image": true,
    "list-style-position": true,
    "list-style-type": true,
    "marker": true,
    "marker-end": true,
    "marker-mid": true,
    "marker-start": true,
    "orphans": true,
    "overflow-wrap": true,
    "paint-order": true,
    "pointer-events": true,
    "pitch-range": true,
    "quotes": true,
    "richness": true,
    "ruby-align": true,
    "ruby-position": true,
    "speak-header": true,
    "speak-numeral": true,
    "speak-punctuation": true,
    "speech-rate": true,
    "shape-rendering": true,
    "stress": true,
    "stroke": true,
    "stroke-dasharray": true,
    "stroke-dashoffset": true,
    "stroke-linecap": true,
    "stroke-linejoin": true,
    "stroke-miterlimit": true,
    "stroke-opacity": true,
    "stroke-width": true,
    "tab-size": true,
    "text-align": true,
    "text-align-last": true,
    "text-anchor": true,
    "text-decoration-skip": true,
    "text-emphasis-color": true,
    "text-emphasis-position": true,
    "text-emphasis-style": true,
    "text-combine-upright": true,
    "text-indent": true,
    "text-justify": true,
    "text-rendering": true,
    "text-size-adjust": true,
    "text-transform": true,
    "text-underline-position": true,
    "visibility": true,
    "voice-family": true,
    "volume": true,
    "white-space": true,
    "widows": true,
    "word-break": true,
    "word-spacing": true,
    "word-wrap": true,
    "writing-mode": true
};

/** @const */
adapt.csscasc.polyfilledInheritedProps = [
    "box-decoration-break", // TODO: box-decoration-block should not be inherited. https://github.com/vivliostyle/vivliostyle.js/issues/259
    "image-resolution",
    "orphans",
    "widows"
];

/**
 * @return {Array.<string>}
 */
adapt.csscasc.getPolyfilledInheritedProps = function() {
    /** @type {!Array.<vivliostyle.plugin.PolyfilledInheritedPropsHook>} */ var hooks =
        vivliostyle.plugin.getHooksForName(vivliostyle.plugin.HOOKS.POLYFILLED_INHERITED_PROPS);
    return hooks.reduce(function(props, f) {
        return props.concat(f());
    }, [].concat(adapt.csscasc.polyfilledInheritedProps));
};

/** @const */
adapt.csscasc.supportedNamespaces = {
    "http://www.idpf.org/2007/ops": true,
    "http://www.w3.org/1999/xhtml": true,
    "http://www.w3.org/2000/svg": true
};

/** @const */
adapt.csscasc.coupledPatterns = ["margin-%", "padding-%", "border-%-width", "border-%-style",
    "border-%-color", "%"];

/**
 * @const
 * @type {Object.<string,boolean>}
 */
adapt.csscasc.geomNames = (function() {
    var sides = ["left", "right", "top", "bottom"];
    var names = {"width": true, "height": true};
    for (var i = 0; i < adapt.csscasc.coupledPatterns.length; i++) {
        for (var k = 0; k < sides.length; k++) {
            var name = adapt.csscasc.coupledPatterns[i].replace("%", sides[k]);
            names[name] = true;
        }
    }
    return names;
})();

/**
 * @param {Object.<string,string>} sideMap
 * @return {Object.<string,string>}
 */
adapt.csscasc.buildCouplingMap = function(sideMap) {
    var map = {};
    for (var i = 0; i < adapt.csscasc.coupledPatterns.length; i++) {
        for (var side in sideMap) {
            var name1 = adapt.csscasc.coupledPatterns[i].replace("%", side);
            var name2 = adapt.csscasc.coupledPatterns[i].replace("%", sideMap[side]);
            map[name1] = name2;
            map[name2] = name1;
        }
    }
    return map;
};

/** @const */
adapt.csscasc.couplingMapVert = adapt.csscasc.buildCouplingMap({
    "before": "right",
    "after": "left",
    "start": "top",
    "end": "bottom"});

/** @const */
adapt.csscasc.couplingMapHor = adapt.csscasc.buildCouplingMap({
    "before": "top",
    "after": "bottom",
    "start": "left",
    "end": "right"});

/**
 * @param {adapt.css.Val} value
 * @param {number} priority
 * @constructor
 */
adapt.csscasc.CascadeValue = function(value, priority) {
    /** @const */ this.value = value;
    /** @const */ this.priority = priority;
};

/**
 * @return {!adapt.csscasc.CascadeValue}
 */
adapt.csscasc.CascadeValue.prototype.getBaseValue = function() { return this; };

/**
 * @param {adapt.css.Visitor} visitor
 * @return {!adapt.csscasc.CascadeValue}
 */
adapt.csscasc.CascadeValue.prototype.filterValue = function(visitor) {
    var value = this.value.visit(visitor);
    if (value === this.value)
        return this;
    return new adapt.csscasc.CascadeValue(value, this.priority);
};

/**
 * @param {number} specificity
 * @return {!adapt.csscasc.CascadeValue}
 */
adapt.csscasc.CascadeValue.prototype.increaseSpecificity = function(specificity) {
    if (specificity == 0)
        return this;
    return new adapt.csscasc.CascadeValue(this.value, this.priority + specificity);
};

/**
 * @param {adapt.expr.Context} context
 * @param {string} propName
 * @return {adapt.css.Val}
 */
adapt.csscasc.CascadeValue.prototype.evaluate = function(context, propName) {
    return adapt.cssparse.evaluateCSSToCSS(context, this.value, propName);
};

/**
 * @param {adapt.expr.Context} context
 * @return {boolean}
 */
adapt.csscasc.CascadeValue.prototype.isEnabled = function(context) {
    return true;
};


/**
 * Internal subclass of CascadeValue. Should never be seen outside of the cascade
 * engine.
 * @param {adapt.css.Val} value
 * @param {number} priority
 * @param {adapt.expr.Val} condition
 * @constructor
 * @extends {adapt.csscasc.CascadeValue}
 */
adapt.csscasc.ConditionalCascadeValue = function(value, priority, condition) {
    adapt.csscasc.CascadeValue.call(this, value, priority);
    /** @const */ this.condition = condition;
};
goog.inherits(adapt.csscasc.ConditionalCascadeValue, adapt.csscasc.CascadeValue);

/**
 * @override
 */
adapt.csscasc.ConditionalCascadeValue.prototype.getBaseValue = function() {
    return new adapt.csscasc.CascadeValue(this.value, this.priority);
};

/**
 * @override
 */
adapt.csscasc.ConditionalCascadeValue.prototype.filterValue = function(visitor) {
    var value = this.value.visit(visitor);
    if (value === this.value)
        return this;
    return new adapt.csscasc.ConditionalCascadeValue(value, this.priority, this.condition);
};

/**
 * @override
 */
adapt.csscasc.ConditionalCascadeValue.prototype.increaseSpecificity = function(specificity) {
    if (specificity == 0)
        return this;
    return new adapt.csscasc.ConditionalCascadeValue(this.value, this.priority + specificity,
        this.condition);
};

/**
 * @param {adapt.expr.Context} context
 * @return {boolean}
 */
adapt.csscasc.ConditionalCascadeValue.prototype.isEnabled = function(context) {
    return !!this.condition.evaluate(context);
};

/**
 * @param {adapt.expr.Context} context
 * @param {adapt.csscasc.CascadeValue} tv current value (cannot be conditional)
 * @param {!adapt.csscasc.CascadeValue} av cascaded value (can be conditional)
 * @return {adapt.csscasc.CascadeValue}
 */
adapt.csscasc.cascadeValues = function(context, tv, av) {
    if ((tv == null || av.priority > tv.priority) && av.isEnabled(context)) {
        return av.getBaseValue();
    }
    return tv;
};

/**
 * @dict
 * @constructor
 */
adapt.csscasc.ElementStyle = function() {};

/**
 * @typedef {Object.<string,adapt.csscasc.ElementStyle>}
 */
adapt.csscasc.ElementStyleMap;


/**
 * @const
 */
adapt.csscasc.SPECIALS = {
    "region-id": true
};

/**
 * @param {string} name
 */
adapt.csscasc.isSpecialName = function(name) {
    return !!adapt.csscasc.SPECIALS[name];
};

/**
 * @param {string} name
 */
adapt.csscasc.isMapName = function(name) {
    return name.charAt(0) == "_";
};

/**
 * @param {string} name
 */
adapt.csscasc.isPropName = function(name) {
    return name.charAt(0) != "_" && !adapt.csscasc.SPECIALS[name];
};

/**
 * @param {string} name
 * @return {boolean}
 */
adapt.csscasc.isInherited = function(name) {
    return !!adapt.csscasc.inheritedProps[name];
};

/**
 * @param {adapt.csscasc.ElementStyle} style
 * @param {string} name
 * @return {adapt.csscasc.CascadeValue}
 */
adapt.csscasc.getProp = function(style, name) {
    return /** @type {adapt.csscasc.CascadeValue} */ (style[name]);
};


/**
 * @param {adapt.csscasc.ElementStyle} style
 * @param {string} name
 * @param {adapt.csscasc.CascadeValue} value
 * @return void
 */
adapt.csscasc.setProp = function(style, name, value) {
    if (!value) {
        delete style[name];
    } else {
        style[name] = value;
    }
};

/**
 * @param {adapt.csscasc.ElementStyle} style
 * @param {string} name
 * @return {adapt.csscasc.ElementStyleMap}
 */
adapt.csscasc.getStyleMap = function(style, name) {
    return /** @type {adapt.csscasc.ElementStyleMap} */ (style[name]);
};

/**
 * @param {adapt.csscasc.ElementStyle} style
 * @param {string} name
 * @return {adapt.csscasc.ElementStyleMap}
 */
adapt.csscasc.getMutableStyleMap = function(style, name) {
    var r = /** @type {adapt.csscasc.ElementStyleMap} */ (style[name]);
    if (!r) {
        r = {};
        style[name] = r;
    }
    return r;
};

/**
 * @param {adapt.csscasc.ElementStyle} style
 * @param {string} name
 * @return {Array.<adapt.csscasc.CascadeValue>}
 */
adapt.csscasc.getSpecial = function(style, name) {
    return /** @type {Array.<adapt.csscasc.CascadeValue>} */ (style[name]);
};

/**
 * @param {adapt.csscasc.ElementStyle} style
 * @param {string} name
 * @return {Array.<adapt.csscasc.CascadeValue>}
 */
adapt.csscasc.getMutableSpecial = function(style, name) {
    var r = /** @type {Array.<adapt.csscasc.CascadeValue>} */ (style[name]);
    if (!r) {
        r = [];
        style[name] = r;
    }
    return r;
};


/**
 * @param {adapt.expr.Context} context
 * @param {adapt.csscasc.ElementStyle} target
 * @param {adapt.csscasc.ElementStyle} style
 * @param {number} specificity
 * @param {?string} pseudoelement
 * @param {?string} regionId
 * @return {void}
 */
adapt.csscasc.mergeIn = function(context, target, style, specificity, pseudoelement, regionId) {
    if (pseudoelement) {
        var pseudos = adapt.csscasc.getMutableStyleMap(target, "_pseudos");
        target = pseudos[pseudoelement];
        if (!target) {
            target = /** @type {adapt.csscasc.ElementStyle} */ ({});
            pseudos[pseudoelement] = target;
        }
    }
    if (regionId) {
        var regions = adapt.csscasc.getMutableStyleMap(target, "_regions");
        target = regions[regionId];
        if (!target) {
            target = /** @type {adapt.csscasc.ElementStyle} */ ({});
            regions[regionId] = target;
        }
    }
    for (var prop in style) {
        if (adapt.csscasc.isMapName(prop))
            continue;
        if (adapt.csscasc.isSpecialName(prop)) {
            // special properties: list of all assigned values
            var as = adapt.csscasc.getSpecial(style, prop);
            var ts = adapt.csscasc.getMutableSpecial(target, prop);
            Array.prototype.push.apply(ts, as);
        } else {
            // regular properties: higher priority wins
            var av = adapt.csscasc.getProp(style, prop).increaseSpecificity(specificity);
            var tv = adapt.csscasc.getProp(target, prop);
            adapt.csscasc.setProp(target, prop, adapt.csscasc.cascadeValues(context, tv, av));
        }
    }
};

/**
 * @param {adapt.expr.Context} context
 * @param {Array.<adapt.csscasc.ElementStyle>} styles
 * @return {adapt.csscasc.ElementStyle}
 */
adapt.csscasc.mergeAll = function(context, styles) {
    var target = /** @type {adapt.csscasc.ElementStyle} */ ({});
    for (var k = 0; k < styles.length; k++) {
        adapt.csscasc.mergeIn(context, target, styles[k], 0, null, null);
    }
    return target;
};

/**
 * @protected
 * @param {Array.<adapt.csscasc.ChainedAction>} chain
 * @param {adapt.csscasc.CascadeAction} action
 * @return {adapt.csscasc.CascadeAction}
 */
adapt.csscasc.chainActions = function(chain, action) {
    if (chain.length > 0) {
        chain.sort(
            /**
             * @param {adapt.csscasc.ChainedAction} a
             * @param {adapt.csscasc.ChainedAction} b
             * @return {number}
             */
            function(a, b) {
                return b.getPriority() - a.getPriority();
            });
        var chained = null;
        for (var i = chain.length - 1; i >= 0; i--) {
            chained = chain[i];
            chained.chained = action;
            action = chained;
        }
        return chained;
    }
    return action;
};


/**
 * @constructor
 * @param {adapt.csscasc.ElementStyle} props
 * @param {adapt.expr.Context} context
 * @extends {adapt.css.FilterVisitor}
 */
adapt.csscasc.InheritanceVisitor = function(props, context) {
    adapt.css.Visitor.call(this);
    /** @const */ this.props = props;
    /** @const */ this.context = context;
    /** @type {string} */ this.propName = "";
};
goog.inherits(adapt.csscasc.InheritanceVisitor, adapt.css.FilterVisitor);

/**
 * @param {string} name
 * @return {void}
 */
adapt.csscasc.InheritanceVisitor.prototype.setPropName = function(name) {
    this.propName = name;
};

/**
 * @private
 */
adapt.csscasc.InheritanceVisitor.prototype.getFontSize = function() {
    var cascval = adapt.csscasc.getProp(this.props, "font-size");
    var n = /** @type {adapt.css.Numeric} */ (cascval.value);
    if (!adapt.expr.isAbsoluteLengthUnit(n.unit)) {
        throw new Error("Unexpected state");
    }
    return n.num * adapt.expr.defaultUnitSizes[n.unit];
};

/**
 * @override
 */
adapt.csscasc.InheritanceVisitor.prototype.visitNumeric = function(numeric) {
    if (numeric.unit == "em" || numeric.unit == "ex") {
        var ratio = this.context.queryUnitSize(numeric.unit, false) / this.context.queryUnitSize("em", false);
        return new adapt.css.Numeric(numeric.num * ratio * this.getFontSize(), "px");
    } else if (numeric.unit == "rem" || numeric.unit == "rex") {
        var ratio = this.context.queryUnitSize(numeric.unit, false) / this.context.queryUnitSize("rem", false);
        return new adapt.css.Numeric(numeric.num * ratio * this.context.fontSize(), "px");
    } else if (numeric.unit == "%") {
        if (this.propName === "font-size") {
            return new adapt.css.Numeric(numeric.num / 100 * this.getFontSize(), "px");
        } else if (this.propName === "line-height") {
            return numeric;
        }
        var unit = this.propName.match(/height|^(top|bottom)$/) ? "vh" : "vw";
        return new adapt.css.Numeric(numeric.num, unit);
    }
    return numeric;
};

/**
 * @override
 */
adapt.csscasc.InheritanceVisitor.prototype.visitExpr = function(expr) {
    if (this.propName == "font-size") {
        var val = adapt.cssparse.evaluateCSSToCSS(this.context, expr, this.propName);
        return val.visit(this);
    }
    return expr;
};


/**
 * @typedef {Object.<string,adapt.csscasc.CascadeAction>}
 */
adapt.csscasc.ActionTable;


/**
 * @constructor
 */
adapt.csscasc.CascadeAction = function() {};

/**
 * @param {adapt.csscasc.CascadeInstance} cascade
 * @return {void}
 */
adapt.csscasc.CascadeAction.prototype.apply = function(cascade) {};

/**
 * @param {!adapt.csscasc.CascadeAction} other
 * @return {!adapt.csscasc.CascadeAction}
 */
adapt.csscasc.CascadeAction.prototype.mergeWith = function(other) {
    return new adapt.csscasc.CompoundAction([this, other]);
};

/**
 * @return {adapt.csscasc.CascadeAction}
 */
adapt.csscasc.CascadeAction.prototype.clone = function() {
    // Mutable actions will override
    return this;
};

/**
 * @param {adapt.csscasc.ConditionItem} conditionItem
 * @constructor
 * @extends {adapt.csscasc.CascadeAction}
 */
adapt.csscasc.ConditionItemAction = function(conditionItem) {
    adapt.csscasc.CascadeAction.call(this);
    /** @const */ this.conditionItem = conditionItem;
};
goog.inherits(adapt.csscasc.ConditionItemAction, adapt.csscasc.CascadeAction);

/**
 * @override
 */
adapt.csscasc.ConditionItemAction.prototype.apply = function(cascadeInstance) {
    cascadeInstance.pushConditionItem(this.conditionItem.fresh());
};


/**
 * @param {Array.<adapt.csscasc.CascadeAction>} list
 * @constructor
 * @extends {adapt.csscasc.CascadeAction}
 */
adapt.csscasc.CompoundAction = function(list) {
    adapt.csscasc.CascadeAction.call(this);
    /** @const */ this.list = list;
};
goog.inherits(adapt.csscasc.CompoundAction, adapt.csscasc.CascadeAction);


/**
 * @override
 */
adapt.csscasc.CompoundAction.prototype.apply = function(cascadeInstance) {
    for (var i = 0; i < this.list.length; i++)
        this.list[i].apply(cascadeInstance);
};

/**
 * @override
 */
adapt.csscasc.CompoundAction.prototype.mergeWith = function(other) {
    this.list.push(other);
    return this;
};

/**
 * @override
 */
adapt.csscasc.CompoundAction.prototype.clone = function() {
    return new adapt.csscasc.CompoundAction([].concat(this.list));
};

/**
 * @param {adapt.csscasc.ElementStyle} style
 * @param {number} specificity
 * @param {?string} pseudoelement
 * @param {?string} regionId
 * @constructor
 * @extends {adapt.csscasc.CascadeAction}
 */
adapt.csscasc.ApplyRuleAction = function(style, specificity, pseudoelement, regionId) {
    adapt.csscasc.CascadeAction.call(this);
    /** @const */ this.style = style;
    /** @const */ this.specificity = specificity;
    /** @const */ this.pseudoelement = pseudoelement;
    /** @const */ this.regionId = regionId;
};
goog.inherits(adapt.csscasc.ApplyRuleAction, adapt.csscasc.CascadeAction);

/**
 * @override
 */
adapt.csscasc.ApplyRuleAction.prototype.apply = function(cascadeInstance) {
    adapt.csscasc.mergeIn(cascadeInstance.context, cascadeInstance.currentStyle,
        this.style, this.specificity, this.pseudoelement, this.regionId);
};


/**
 * @constructor
 * @extends {adapt.csscasc.CascadeAction}
 */
adapt.csscasc.ChainedAction = function() {
    adapt.csscasc.CascadeAction.call(this);
    /** @type {adapt.csscasc.CascadeAction} */ this.chained = null;
};
goog.inherits(adapt.csscasc.ChainedAction, adapt.csscasc.CascadeAction);

/**
 * @override
 */
adapt.csscasc.ChainedAction.prototype.apply = function(cascadeInstance) {
    this.chained.apply(cascadeInstance);
};

/**
 * @return {number}
 */
adapt.csscasc.ChainedAction.prototype.getPriority = function() {
    return 0;
};

/**
 * @param {adapt.csscasc.Cascade} cascade
 * @return {boolean}
 */
adapt.csscasc.ChainedAction.prototype.makePrimary = function(cascade) {
    return false; // cannot be made primary
};

/**
 * @param {string} className
 * @constructor
 * @extends {adapt.csscasc.ChainedAction}
 */
adapt.csscasc.CheckClassAction = function(className) {
    adapt.csscasc.ChainedAction.call(this);
    /** @const */ this.className = className;
};
goog.inherits(adapt.csscasc.CheckClassAction, adapt.csscasc.ChainedAction);

/**
 * @override
 */
adapt.csscasc.CheckClassAction.prototype.apply = function(cascadeInstance) {
    if (cascadeInstance.currentClassNames.indexOf(this.className) >= 0)
        this.chained.apply(cascadeInstance);
};

/**
 * @override
 */
adapt.csscasc.CheckClassAction.prototype.getPriority = function() {
    return 10; // class should be checked after id
};

/**
 * @override
 */
adapt.csscasc.CheckClassAction.prototype.makePrimary = function(cascade) {
    if (this.chained) {
        cascade.insertInTable(cascade.classes, this.className, this.chained);
    }
    return true;
};


/**
 * @param {string} id
 * @constructor
 * @extends {adapt.csscasc.ChainedAction}
 */
adapt.csscasc.CheckIdAction = function(id) {
    adapt.csscasc.ChainedAction.call(this);
    /** @const */ this.id = id;
};
goog.inherits(adapt.csscasc.CheckIdAction, adapt.csscasc.ChainedAction);

/**
 * @override
 */
adapt.csscasc.CheckIdAction.prototype.apply = function(cascadeInstance) {
    if (cascadeInstance.currentId == this.id || cascadeInstance.currentXmlId == this.id)
        this.chained.apply(cascadeInstance);
};

/**
 * @override
 */
adapt.csscasc.CheckIdAction.prototype.getPriority = function() {
    return 11; // id should be checked after :root
};

/**
 * @override
 */
adapt.csscasc.CheckIdAction.prototype.makePrimary = function(cascade) {
    if (this.chained) {
        cascade.insertInTable(cascade.ids, this.id, this.chained);
    }
    return true;
};


/**
 * @param {string} localName
 * @constructor
 * @extends {adapt.csscasc.ChainedAction}
 */
adapt.csscasc.CheckLocalNameAction = function(localName) {
    adapt.csscasc.ChainedAction.call(this);
    /** @const */ this.localName = localName;
};
goog.inherits(adapt.csscasc.CheckLocalNameAction, adapt.csscasc.ChainedAction);

/**
 * @override
 */
adapt.csscasc.CheckLocalNameAction.prototype.apply = function(cascadeInstance) {
    if (cascadeInstance.currentLocalName == this.localName)
        this.chained.apply(cascadeInstance);
};

/**
 * @override
 */
adapt.csscasc.CheckLocalNameAction.prototype.getPriority = function() {
    return 8; // tag is a pretty good thing to check, after epub:type
};

/**
 * @override
 */
adapt.csscasc.CheckLocalNameAction.prototype.makePrimary = function(cascade) {
    if (this.chained) {
        cascade.insertInTable(cascade.tags, this.localName, this.chained);
    }
    return true;
};


/**
 * @param {string} ns
 * @param {string} localName
 * @constructor
 * @extends {adapt.csscasc.ChainedAction}
 */
adapt.csscasc.CheckNSTagAction = function(ns, localName) {
    adapt.csscasc.ChainedAction.call(this);
    /** @const */ this.ns = ns;
    /** @const */ this.localName = localName;
};
goog.inherits(adapt.csscasc.CheckNSTagAction, adapt.csscasc.ChainedAction);

/**
 * @override
 */
adapt.csscasc.CheckNSTagAction.prototype.apply = function(cascadeInstance) {
    if (cascadeInstance.currentLocalName == this.localName && cascadeInstance.currentNamespace == this.ns)
        this.chained.apply(cascadeInstance);
};

/**
 * @override
 */
adapt.csscasc.CheckNSTagAction.prototype.getPriority = function() {
    return 8; // tag is a pretty good thing to check, after epub:type
};

/**
 * @override
 */
adapt.csscasc.CheckNSTagAction.prototype.makePrimary = function(cascade) {
    if (this.chained) {
        var prefix = cascade.nsPrefix[this.ns];
        if (!prefix) {
            prefix = "ns" + (cascade.nsCount++) + ":";
            cascade.nsPrefix[this.ns] = prefix;
        }
        var nsTag = prefix + this.localName;
        cascade.insertInTable(cascade.nstags, nsTag, this.chained);
    }
    return true;
};


/**
 * @param {RegExp} epubTypePatt
 * @constructor
 * @extends {adapt.csscasc.ChainedAction}
 */
adapt.csscasc.CheckTargetEpubTypeAction = function(epubTypePatt) {
    adapt.csscasc.ChainedAction.call(this);
    /** @const */ this.epubTypePatt = epubTypePatt;
};
goog.inherits(adapt.csscasc.CheckTargetEpubTypeAction, adapt.csscasc.ChainedAction);

/**
 * @override
 */
adapt.csscasc.CheckTargetEpubTypeAction.prototype.apply = function(cascadeInstance) {
    var elem = cascadeInstance.currentElement;
    if (elem && cascadeInstance.currentLocalName == "a") {
        var href = elem.getAttribute("href");
        if (href && href.match(/^#/)) {
            var id = href.substring(1);
            var target = elem.ownerDocument.getElementById(id);
            if (target) {
                var epubType = target.getAttributeNS(adapt.base.NS.epub, "type");
                if (epubType && epubType.match(this.epubTypePatt)) {
                    this.chained.apply(cascadeInstance);
                }
            }
        }
    }
};


/**
 * @param {string} ns
 * @constructor
 * @extends {adapt.csscasc.ChainedAction}
 */
adapt.csscasc.CheckNamespaceAction = function(ns) {
    adapt.csscasc.ChainedAction.call(this);
    /** @const */ this.ns = ns;
};
goog.inherits(adapt.csscasc.CheckNamespaceAction, adapt.csscasc.ChainedAction);

/**
 * @override
 */
adapt.csscasc.CheckNamespaceAction.prototype.apply = function(cascadeInstance) {
    if (cascadeInstance.currentNamespace == this.ns)
        this.chained.apply(cascadeInstance);
};


/**
 * @param {string} ns
 * @param {string} name
 * @constructor
 * @extends {adapt.csscasc.ChainedAction}
 */
adapt.csscasc.CheckAttributePresentAction = function(ns, name) {
    adapt.csscasc.ChainedAction.call(this);
    /** @const */ this.ns = ns;
    /** @const */ this.name = name;
};
goog.inherits(adapt.csscasc.CheckAttributePresentAction, adapt.csscasc.ChainedAction);

/**
 * @override
 */
adapt.csscasc.CheckAttributePresentAction.prototype.apply = function(cascadeInstance) {
    if (cascadeInstance.currentElement &&
        cascadeInstance.currentElement.hasAttributeNS(this.ns, this.name)) {
        this.chained.apply(cascadeInstance);
    }
};


/**
 * @param {string} ns
 * @param {string} name
 * @param {string} value
 * @constructor
 * @extends {adapt.csscasc.ChainedAction}
 */
adapt.csscasc.CheckAttributeEqAction = function(ns, name, value) {
    adapt.csscasc.ChainedAction.call(this);
    /** @const */ this.ns = ns;
    /** @const */ this.name = name;
    /** @const */ this.value = value;
};
goog.inherits(adapt.csscasc.CheckAttributeEqAction, adapt.csscasc.ChainedAction);

/**
 * @override
 */
adapt.csscasc.CheckAttributeEqAction.prototype.apply = function(cascadeInstance) {
    if (cascadeInstance.currentElement && cascadeInstance.currentElement.getAttributeNS(this.ns, this.name) == this.value)
        this.chained.apply(cascadeInstance);
};

/**
 * @override
 */
adapt.csscasc.CheckAttributeEqAction.prototype.getPriority = function() {
    if (this.name == "type" && this.ns == adapt.base.NS.epub) {
        return 9; // epub:type is a pretty good thing to check
    }
    return 0;
};

/**
 * @override
 */
adapt.csscasc.CheckAttributeEqAction.prototype.makePrimary = function(cascade) {
    if (this.name == "type" && this.ns == adapt.base.NS.epub) {
        if (this.chained) {
            cascade.insertInTable(cascade.epubtypes, this.value, this.chained);
        }
        return true;
    }
    return false;
};

/**
 * @constructor
 * @param {string} ns
 * @param {string} name
 * @extends {adapt.csscasc.ChainedAction}
 */
adapt.csscasc.CheckNamespaceSupportedAction = function(ns, name) {
    adapt.csscasc.ChainedAction.call(this);
    /** @const */ this.ns = ns;
    /** @const */ this.name = name;
};
goog.inherits(adapt.csscasc.CheckNamespaceSupportedAction, adapt.csscasc.ChainedAction);

/**
 * @override
 */
adapt.csscasc.CheckNamespaceSupportedAction.prototype.apply = function(cascadeInstance) {
    if (cascadeInstance.currentElement) {
        var ns = cascadeInstance.currentElement.getAttributeNS(this.ns, this.name);
        if (ns && adapt.csscasc.supportedNamespaces[ns]) {
            this.chained.apply(cascadeInstance);
        }
    }
};

/**
 * @override
 */
adapt.csscasc.CheckNamespaceSupportedAction.prototype.getPriority = function() {
    return 0;
};

/**
 * @override
 */
adapt.csscasc.CheckNamespaceSupportedAction.prototype.makePrimary = function(cascade) {
    return false;
};


/**
 * @param {string} ns
 * @param {string} name
 * @param {RegExp} regexp
 * @constructor
 * @extends {adapt.csscasc.ChainedAction}
 */
adapt.csscasc.CheckAttributeRegExpAction = function(ns, name, regexp) {
    adapt.csscasc.ChainedAction.call(this);
    /** @const */ this.ns = ns;
    /** @const */ this.name = name;
    /** @const */ this.regexp = regexp;
};
goog.inherits(adapt.csscasc.CheckAttributeRegExpAction, adapt.csscasc.ChainedAction);

/**
 * @override
 */
adapt.csscasc.CheckAttributeRegExpAction.prototype.apply = function(cascadeInstance) {
    if (cascadeInstance.currentElement) {
        var attr = cascadeInstance.currentElement.getAttributeNS(this.ns, this.name);
        if (attr && attr.match(this.regexp))
            this.chained.apply(cascadeInstance);
    }
};

/**
 * @param {RegExp} langRegExp
 * @constructor
 * @extends {adapt.csscasc.ChainedAction}
 */
adapt.csscasc.CheckLangAction = function(langRegExp) {
    adapt.csscasc.ChainedAction.call(this);
    /** @const */ this.langRegExp = langRegExp;
};
goog.inherits(adapt.csscasc.CheckLangAction, adapt.csscasc.ChainedAction);

/**
 * @override
 */
adapt.csscasc.CheckLangAction.prototype.apply = function(cascadeInstance) {
    if (cascadeInstance.lang.match(this.langRegExp))
        this.chained.apply(cascadeInstance);
};


/**
 * @constructor
 * @extends {adapt.csscasc.ChainedAction}
 */
adapt.csscasc.IsFirstAction = function() {
    adapt.csscasc.ChainedAction.call(this);
};
goog.inherits(adapt.csscasc.IsFirstAction, adapt.csscasc.ChainedAction);

/**
 * @override
 */
adapt.csscasc.IsFirstAction.prototype.apply = function(cascadeInstance) {
    if (cascadeInstance.isFirst)
        this.chained.apply(cascadeInstance);
};

/**
 * @override
 */
adapt.csscasc.IsFirstAction.prototype.getPriority = function() {
    return 6;
};

/**
 * @constructor
 * @extends {adapt.csscasc.ChainedAction}
 */
adapt.csscasc.IsRootAction = function() {
    adapt.csscasc.ChainedAction.call(this);
};
goog.inherits(adapt.csscasc.IsRootAction, adapt.csscasc.ChainedAction);

/**
 * @override
 */
adapt.csscasc.IsRootAction.prototype.apply = function(cascadeInstance) {
    if (cascadeInstance.isRoot)
        this.chained.apply(cascadeInstance);
};

/**
 * @override
 */
adapt.csscasc.IsRootAction.prototype.getPriority = function() {
    return 12; // :root is the first thing to check
};

/**
 * @param {number} a
 * @param {number} b
 * @private
 * @constructor
 * @extends {adapt.csscasc.ChainedAction}
 */
adapt.csscasc.IsNthAction = function(a, b) {
    adapt.csscasc.ChainedAction.call(this);
    /** @const */ this.a = a;
    /** @const */ this.b = b;
};
goog.inherits(adapt.csscasc.IsNthAction, adapt.csscasc.ChainedAction);

/**
 * Checkes whether given order can be represented as an+b with a non-negative interger n
 * @protected
 * @param {number} order
 * @returns {boolean}
 */
adapt.csscasc.IsNthAction.prototype.matchANPlusB = function(order) {
    var a = this.a;
    order -= this.b;
    if (a === 0) {
        return order === 0;
    } else {
        return (order % a === 0) && (order / a >= 0);
    }
};

/**
 * @param {number} a
 * @param {number} b
 * @constructor
 * @extends {adapt.csscasc.IsNthAction}
 */
adapt.csscasc.IsNthSiblingAction = function(a, b) {
    adapt.csscasc.IsNthAction.call(this, a, b);
};
goog.inherits(adapt.csscasc.IsNthSiblingAction, adapt.csscasc.IsNthAction);

/**
 * @override
 */
adapt.csscasc.IsNthSiblingAction.prototype.apply = function(cascadeInstance) {
    if (this.matchANPlusB(cascadeInstance.currentSiblingOrder))
        this.chained.apply(cascadeInstance);
};

/**
 * @override
 */
adapt.csscasc.IsNthSiblingAction.prototype.getPriority = function() {
    return 5;
};

/**
 * @param {number} a
 * @param {number} b
 * @constructor
 * @extends {adapt.csscasc.IsNthAction}
 */
adapt.csscasc.IsNthSiblingOfTypeAction = function(a, b) {
    adapt.csscasc.IsNthAction.call(this, a, b);
};
goog.inherits(adapt.csscasc.IsNthSiblingOfTypeAction, adapt.csscasc.IsNthAction);

/**
 * @override
 */
adapt.csscasc.IsNthSiblingOfTypeAction.prototype.apply = function(cascadeInstance) {
    var order = cascadeInstance.currentSiblingTypeCounts[cascadeInstance.currentNamespace][cascadeInstance.currentLocalName];
    if (this.matchANPlusB(order))
        this.chained.apply(cascadeInstance);
};

/**
 * @override
 */
adapt.csscasc.IsNthSiblingOfTypeAction.prototype.getPriority = function() {
    return 5;
};

/**
 * @param {number} a
 * @param {number} b
 * @constructor
 * @extends {adapt.csscasc.IsNthAction}
 */
adapt.csscasc.IsNthLastSiblingAction = function(a, b) {
    adapt.csscasc.IsNthAction.call(this, a, b);
};
goog.inherits(adapt.csscasc.IsNthLastSiblingAction, adapt.csscasc.IsNthAction);

/**
 * @override
 */
adapt.csscasc.IsNthLastSiblingAction.prototype.apply = function(cascadeInstance) {
    var order = cascadeInstance.currentFollowingSiblingOrder;
    if (order === null) {
        order = cascadeInstance.currentFollowingSiblingOrder = cascadeInstance.currentElement.parentNode.childElementCount - cascadeInstance.currentSiblingOrder + 1;
    }
    if (this.matchANPlusB(order))
        this.chained.apply(cascadeInstance);
};

/**
 * @override
 */
adapt.csscasc.IsNthLastSiblingAction.prototype.getPriority = function() {
    return 4;
};

/**
 * @param {number} a
 * @param {number} b
 * @constructor
 * @extends {adapt.csscasc.IsNthAction}
 */
adapt.csscasc.IsNthLastSiblingOfTypeAction = function(a, b) {
    adapt.csscasc.IsNthAction.call(this, a, b);
};
goog.inherits(adapt.csscasc.IsNthLastSiblingOfTypeAction, adapt.csscasc.IsNthAction);

/**
 * @override
 */
adapt.csscasc.IsNthLastSiblingOfTypeAction.prototype.apply = function(cascadeInstance) {
    var counts = cascadeInstance.currentFollowingSiblingTypeCounts;
    if (!counts[cascadeInstance.currentNamespace]) {
        var elem = cascadeInstance.currentElement;
        do {
            var ns = elem.namespaceURI;
            var localName = elem.localName;
            var nsCounts = counts[ns];
            if (!nsCounts) {
                nsCounts = counts[ns] = {};
            }
            nsCounts[localName] = (nsCounts[localName] || 0) + 1;
        } while (elem = elem.nextElementSibling);
    }
    if (this.matchANPlusB(counts[cascadeInstance.currentNamespace][cascadeInstance.currentLocalName]))
        this.chained.apply(cascadeInstance);
};

/**
 * @override
 */
adapt.csscasc.IsNthLastSiblingOfTypeAction.prototype.getPriority = function() {
    return 4;
};

/**
 * @constructor
 * @extends {adapt.csscasc.ChainedAction}
 */
adapt.csscasc.IsEmptyAction = function() {
    adapt.csscasc.ChainedAction.call(this);
};
goog.inherits(adapt.csscasc.IsEmptyAction, adapt.csscasc.ChainedAction);

/**
 * @override
 */
adapt.csscasc.IsEmptyAction.prototype.apply = function(cascadeInstance) {
    var node = cascadeInstance.currentElement.firstChild;
    while (node) {
        switch (node.nodeType) {
            case Node.ELEMENT_NODE:
                return;
            case Node.TEXT_NODE:
                if (/** @type {Text} */ (node).length > 0) {
                    return;
                }
        }
        node = node.nextSibling;
    }
    this.chained.apply(cascadeInstance);
};

/**
 * @override
 */
adapt.csscasc.IsEmptyAction.prototype.getPriority = function() {
    return 4;
};

/**
 * @constructor
 * @extends {adapt.csscasc.ChainedAction}
 */
adapt.csscasc.IsEnabledAction = function() {
    adapt.csscasc.ChainedAction.call(this);
};
goog.inherits(adapt.csscasc.IsEnabledAction, adapt.csscasc.ChainedAction);

/**
 * @override
 */
adapt.csscasc.IsEnabledAction.prototype.apply = function(cascadeInstance) {
    var elem = cascadeInstance.currentElement;
    if (elem.disabled === false) {
        this.chained.apply(cascadeInstance);
    }
};

/**
 * @override
 */
adapt.csscasc.IsEnabledAction.prototype.getPriority = function() {
    return 5;
};

/**
 * @constructor
 * @extends {adapt.csscasc.ChainedAction}
 */
adapt.csscasc.IsDisabledAction = function() {
    adapt.csscasc.ChainedAction.call(this);
};
goog.inherits(adapt.csscasc.IsDisabledAction, adapt.csscasc.ChainedAction);

/**
 * @override
 */
adapt.csscasc.IsDisabledAction.prototype.apply = function(cascadeInstance) {
    var elem = cascadeInstance.currentElement;
    if (elem.disabled === true) {
        this.chained.apply(cascadeInstance);
    }
};

/**
 * @override
 */
adapt.csscasc.IsDisabledAction.prototype.getPriority = function() {
    return 5;
};

/**
 * @constructor
 * @extends {adapt.csscasc.ChainedAction}
 */
adapt.csscasc.IsCheckedAction = function() {
    adapt.csscasc.ChainedAction.call(this);
};
goog.inherits(adapt.csscasc.IsCheckedAction, adapt.csscasc.ChainedAction);

/**
 * @override
 */
adapt.csscasc.IsCheckedAction.prototype.apply = function(cascadeInstance) {
    var elem = cascadeInstance.currentElement;
    if (elem.selected === true || elem.checked === true) {
        this.chained.apply(cascadeInstance);
    }
};

/**
 * @override
 */
adapt.csscasc.IsCheckedAction.prototype.getPriority = function() {
    return 5;
};

/**
 * @param {string} condition
 * @constructor
 * @extends {adapt.csscasc.ChainedAction}
 */
adapt.csscasc.CheckConditionAction = function(condition) {
    adapt.csscasc.ChainedAction.call(this);
    /** @const */ this.condition = condition;
};
goog.inherits(adapt.csscasc.CheckConditionAction, adapt.csscasc.ChainedAction);

/**
 * @override
 */
adapt.csscasc.CheckConditionAction.prototype.apply = function(cascadeInstance) {
    if (cascadeInstance.conditions[this.condition])
        this.chained.apply(cascadeInstance);
};

/**
 * @override
 */
adapt.csscasc.CheckConditionAction.prototype.getPriority = function() {
    return 5;
};

/**
 * @constructor
 * @extends {adapt.csscasc.CascadeAction}
 */
adapt.csscasc.CheckAppliedAction = function() {
    adapt.csscasc.CascadeAction.call(this);
    this.applied = false;
};
goog.inherits(adapt.csscasc.CheckAppliedAction, adapt.csscasc.CascadeAction);

/**
 * @override
 */
adapt.csscasc.CheckAppliedAction.prototype.apply = function(cascadeInstance) {
    this.applied = true;
};

/**
 * @override
 */
adapt.csscasc.CheckAppliedAction.prototype.clone = function() {
    var cloned = new adapt.csscasc.CheckAppliedAction();
    cloned.applied = this.applied;
    return cloned;
};

/**
 * @param {Array.<adapt.csscasc.ChainedAction>} list
 * @constructor
 * @extends {adapt.csscasc.ChainedAction}
 */
adapt.csscasc.NegateActionsSet = function(list) {
    adapt.csscasc.ChainedAction.call(this);
    this.checkAppliedAction = new adapt.csscasc.CheckAppliedAction();
    this.firstAction = adapt.csscasc.chainActions(list, this.checkAppliedAction);
};
goog.inherits(adapt.csscasc.NegateActionsSet, adapt.csscasc.ChainedAction);

/**
 * @override
 */
adapt.csscasc.NegateActionsSet.prototype.apply = function(cascadeInstance) {
    this.firstAction.apply(cascadeInstance);
    if (!this.checkAppliedAction.applied)
        this.chained.apply(cascadeInstance);
    this.checkAppliedAction.applied = false;
};

/**
 * @override
 */
adapt.csscasc.NegateActionsSet.prototype.getPriority = function() {
    return this.firstAction.getPriority();
};

/**
 * An object that is notified as elements are pushed and popped and typically
 * controls a "named condition" (which is a count associated with a name).
 * @interface
 */
adapt.csscasc.ConditionItem = function() {};

/**
 * Returns a "fresh" copy of this item. May be this if immutable.
 * @return {adapt.csscasc.ConditionItem}
 */
adapt.csscasc.ConditionItem.prototype.fresh = function() {};


/**
 * Depth is 0 for element itself and its siblings, 1 for direct children and -1 for the parent.
 * @param {adapt.csscasc.CascadeInstance} cascadeInstance
 * @param {number} depth
 * @return {boolean}
 */
adapt.csscasc.ConditionItem.prototype.push = function(cascadeInstance, depth) {};

/**
 * @param {adapt.csscasc.CascadeInstance} cascadeInstance
 * @param {number} depth
 * @return {boolean} return true if no more notifications are desired
 */
adapt.csscasc.ConditionItem.prototype.pop = function(cascadeInstance, depth) {};

/**
 * @param {string} condition
 * @constructor
 * @implements {adapt.csscasc.ConditionItem}
 */
adapt.csscasc.DescendantConditionItem = function(condition) {
    /** @const */ this.condition = condition;
};

/**
 * @override
 */
adapt.csscasc.DescendantConditionItem.prototype.fresh = function() {
    return this;
};

/**
 * @override
 */
adapt.csscasc.DescendantConditionItem.prototype.push = function(cascade, depth) {
    if (depth == 0) {
        cascade.increment(this.condition);
    }
    return false;
};

/**
 * @override
 */
adapt.csscasc.DescendantConditionItem.prototype.pop = function(cascade, depth) {
    if (depth == 0) {
        cascade.decrement(this.condition);
        return true;
    }
    return false;
};

/**
 * @param {string} condition
 * @constructor
 * @implements {adapt.csscasc.ConditionItem}
 */
adapt.csscasc.ChildConditionItem = function(condition) {
    /** @const */ this.condition = condition;
};

/**
 * @override
 */
adapt.csscasc.ChildConditionItem.prototype.fresh = function() {
    return this;
};

/**
 * @override
 */
adapt.csscasc.ChildConditionItem.prototype.push = function(cascade, depth) {
    if (depth == 0) {
        cascade.increment(this.condition);
    } else if (depth == 1) {
        cascade.decrement(this.condition);
    }
    return false;
};

/**
 * @override
 */
adapt.csscasc.ChildConditionItem.prototype.pop = function(cascade, depth) {
    if (depth == 0) {
        cascade.decrement(this.condition);
        return true;
    } else if (depth == 1) {
        cascade.increment(this.condition);
    }
    return false;
};

/**
 * @param {string} condition
 * @constructor
 * @implements {adapt.csscasc.ConditionItem}
 */
adapt.csscasc.AdjacentSiblingConditionItem = function(condition) {
    /** @const */ this.condition = condition;
    /** @type {boolean} */ this.fired = false;
};

/**
 * @override
 */
adapt.csscasc.AdjacentSiblingConditionItem.prototype.fresh = function() {
    return new adapt.csscasc.AdjacentSiblingConditionItem(this.condition);
};

/**
 * @override
 */
adapt.csscasc.AdjacentSiblingConditionItem.prototype.push = function(cascade, depth) {
    if (this.fired) {
        cascade.decrement(this.condition);
        return true;
    }
    return false;
};

/**
 * @override
 */
adapt.csscasc.AdjacentSiblingConditionItem.prototype.pop = function(cascade, depth) {
    if (this.fired) {
        cascade.decrement(this.condition);
        return true;
    }
    if (depth == 0) {  // Leaving element that triggered this item.
        this.fired = true;
        cascade.increment(this.condition);
    }
    return false;
};


/**
 * @param {string} condition
 * @constructor
 * @implements {adapt.csscasc.ConditionItem}
 */
adapt.csscasc.FollowingSiblingConditionItem = function(condition) {
    /** @const */ this.condition = condition;
    /** @type {boolean} */ this.fired = false;
};

/**
 * @override
 */
adapt.csscasc.FollowingSiblingConditionItem.prototype.fresh = function() {
    return new adapt.csscasc.FollowingSiblingConditionItem(this.condition);
};

/**
 * @override
 */
adapt.csscasc.FollowingSiblingConditionItem.prototype.push = function(cascade, depth) {
    if (this.fired) {
        if (depth == -1) {
            cascade.increment(this.condition);
        } else if (depth == 0) {
            cascade.decrement(this.condition);
        }
    }
    return false;
};

/**
 * @override
 */
adapt.csscasc.FollowingSiblingConditionItem.prototype.pop = function(cascade, depth) {
    if (this.fired) {
        if (depth == -1) {
            cascade.decrement(this.condition);
            return true;
        } else if (depth == 0) {
            cascade.increment(this.condition);
        }
    } else {
        if (depth == 0) {
            // Leaving element that triggered this item.
            this.fired = true;
            cascade.increment(this.condition);
        }
    }
    return false;
};


/**
 * Not a true condition item, this class manages proper handling of "after" pseudoelement.
 * @param {adapt.csscasc.ElementStyle} afterprop
 * @param {Element} element
 * @constructor
 * @implements {adapt.csscasc.ConditionItem}
 */
adapt.csscasc.AfterPseudoelementItem = function(afterprop, element) {
    /** @const */ this.afterprop = afterprop;
    /** @const */ this.element = element;
};

/**
 * @override
 */
adapt.csscasc.AfterPseudoelementItem.prototype.fresh = function() {
    return this;
};

/**
 * @override
 */
adapt.csscasc.AfterPseudoelementItem.prototype.push = function(cascade, depth) {
    return false;
};

/**
 * @override
 */
adapt.csscasc.AfterPseudoelementItem.prototype.pop = function(cascade, depth) {
    if (depth == 0) {
        cascade.processPseudoelementProps(this.afterprop, this.element);
        return true;
    }
    return false;
};


/**
 * Not a true condition item, this class restores current language.
 * @param {string} lang
 * @constructor
 * @implements {adapt.csscasc.ConditionItem}
 */
adapt.csscasc.RestoreLangItem = function(lang) {
    /** @const */ this.lang = lang;
};

/**
 * @override
 */
adapt.csscasc.RestoreLangItem.prototype.fresh = function() {
    return this;
};

/**
 * @override
 */
adapt.csscasc.RestoreLangItem.prototype.push = function(cascade, depth) {
    return false;
};

/**
 * @override
 */
adapt.csscasc.RestoreLangItem.prototype.pop = function(cascade, depth) {
    if (depth == 0) {
        cascade.lang = this.lang;
        return true;
    }
    return false;
};


/**
 * Not a true condition item, this class manages inheritance of quotes property
 * @param {Array.<adapt.css.Str>} oldQuotes
 * @constructor
 * @implements {adapt.csscasc.ConditionItem}
 */
adapt.csscasc.QuotesScopeItem = function(oldQuotes) {
    /** @const */ this.oldQuotes = oldQuotes;
};

/**
 * @override
 */
adapt.csscasc.QuotesScopeItem.prototype.fresh = function() {
    return this;
};

/**
 * @override
 */
adapt.csscasc.QuotesScopeItem.prototype.push = function(cascade, depth) {
    return false;
};

/**
 * @override
 */
adapt.csscasc.QuotesScopeItem.prototype.pop = function(cascade, depth) {
    if (depth == 0) {
        cascade.quotes = this.oldQuotes;
        return true;
    }
    return false;
};

/**
 * Represent a container for values of counters.
 * Key=name of a counter, Value=values of a corresponding counter ordered from outermost to innermost
 * @typedef {Object<string, !Array<number>>}
 */
adapt.csscasc.CounterValues;

/**
 * @interface
 */
adapt.csscasc.CounterListener = function() {};

/**
 * @param {string} id
 * @param {!adapt.csscasc.CounterValues} counters
 */
adapt.csscasc.CounterListener.prototype.countersOfId = function(id, counters) {};

/**
 * @interface
 */
adapt.csscasc.CounterResolver = function() {};

/**
 * Returns an adapt.expr.Val, whose value is calculated at the layout time by retrieving the innermost page-based counter (null if it does not exist) by its name and formatting the value into a string.
 * @param {string} name Name of the page-based counter to be retrieved
 * @param {function(?number):string} format A function that formats the counter value into a string
 * @returns {adapt.expr.Val}
 */
adapt.csscasc.CounterResolver.prototype.getPageCounterVal = function(name, format) {};

/**
 * Returns an adapt.expr.Val, whose value is calculated at the layout time by retrieving the page-based counters by its name and formatting the values into a string.
 * @param {string} name Name of the page-based counters to be retrieved
 * @param {function(!Array.<number>):string} format A function that formats the counter values (passed as an array ordered by the nesting depth with the outermost counter first and the innermost last) into a string
 * @returns {adapt.expr.Val}
 */
adapt.csscasc.CounterResolver.prototype.getPageCountersVal = function(name, format) {};

/**
 * @param {string} url
 * @param {string} name
 * @param {function(?number):string} format
 * @returns {!adapt.expr.Val}
 */
adapt.csscasc.CounterResolver.prototype.getTargetCounterVal = function(url, name, format) {};

/**
 * @param {string} url
 * @param {string} name
 * @param {function(!Array<number>):string} format
 * @returns {!adapt.expr.Val}
 */
adapt.csscasc.CounterResolver.prototype.getTargetCountersVal = function(url, name, format) {};

/**
 * @constructor
 * @param {Element} element
 * @extends {adapt.css.FilterVisitor}
 */
adapt.csscasc.AttrValueFilterVisitor = function(element) {
    adapt.css.FilterVisitor.call(this);
    this.element = element;
};
goog.inherits(adapt.csscasc.AttrValueFilterVisitor, adapt.css.FilterVisitor);

/**
 * @private
 * @param {?string} str
 * @param {string} type
 * @return {adapt.css.Val}
 */
adapt.csscasc.AttrValueFilterVisitor.prototype.createValueFromString = function(str, type) {
    switch (type) {
        case "url":
            if (str)
                return new adapt.css.URL(str); // TODO should convert to absolute path
            return new adapt.css.URL("about:invalid");
            break;
        case "string":
        default:
            if (str)
                return new adapt.css.Str(str);
            return new adapt.css.Str("");
            break;
    }
};
/**
 * @override
 */
adapt.csscasc.AttrValueFilterVisitor.prototype.visitFunc = function(func) {
    if (func.name !== "attr")
        return adapt.css.FilterVisitor.prototype.visitFunc.call(this, func);
    var type = "string";
    var attributeName = null;
    /** @type {adapt.css.Val} */ var defaultValue = null;

    if (func.values[0] instanceof adapt.css.SpaceList) {
        if (func.values[0].values.length >= 2)
            type = func.values[0].values[1].stringValue();
        attributeName = func.values[0].values[0].stringValue();
    } else {
        attributeName = func.values[0].stringValue();
    }

    if (func.values.length > 1) {
        defaultValue = this.createValueFromString(func.values[1].stringValue(), type);
    } else {
        defaultValue = this.createValueFromString(null, type);
    }
    if (this.element && this.element.hasAttribute(attributeName)) {
        return this.createValueFromString(this.element.getAttribute(attributeName), type);
    }
    return defaultValue;
};

/**
 * @constructor
 * @param {adapt.csscasc.CascadeInstance} cascade
 * @param {Element} element
 * @param {!adapt.csscasc.CounterResolver} counterResolver
 * @extends {adapt.css.FilterVisitor}
 */
adapt.csscasc.ContentPropVisitor = function(cascade, element, counterResolver) {
    adapt.css.FilterVisitor.call(this);
    this.cascade = cascade;
    this.element = element;
    /** @const */ this.counterResolver = counterResolver;
};
goog.inherits(adapt.csscasc.ContentPropVisitor, adapt.css.FilterVisitor);

/**
 * @override
 */
adapt.csscasc.ContentPropVisitor.prototype.visitIdent = function(ident) {
    var cascade = this.cascade;
    var quotes = cascade.quotes;
    var maxDepth = Math.floor(quotes.length / 2) - 1;
    switch (ident.name) {
        case "open-quote":
            var result = quotes[2 * Math.min(maxDepth, cascade.quoteDepth)];
            cascade.quoteDepth++;
            return result;
        case "close-quote":
            if (cascade.quoteDepth > 0)
                cascade.quoteDepth--;
            return quotes[2 * Math.min(maxDepth, cascade.quoteDepth) + 1];
        case "no-open-quote":
            cascade.quoteDepth++;
            return new adapt.css.Str("");
        case "no-close-quote":
            if (cascade.quoteDepth > 0)
                cascade.quoteDepth--;
            return new adapt.css.Str("");
    }
    return ident;
};

adapt.csscasc.roman = function(num) {
    if (num <= 0 || num != Math.round(num) || num > 3999) {
        return "";
    }
    var digits = ['I', 'V', 'X', 'L', 'C', 'D', 'M'];
    var offset = 0;
    var acc = "";
    while (num > 0) {
        var digit = num % 10;
        num = (num - digit) / 10;
        var result = "";
        if (digit == 9) {
            result += digits[offset] + digits[offset+2];
        } else if (digit == 4) {
            result += digits[offset] + digits[offset+1];
        } else {
            if (digit >= 5) {
                result += digits[offset+1];
                digit -= 5;
            }
            while (digit > 0) {
                result += digits[offset];
                digit--;
            }
        }
        acc = result + acc;
        offset += 2;
    }
    return acc;
};

/** @const */
adapt.csscasc.additiveNumbering = {
    "roman": [4999, 1000, 'M', 900, 'CM', 500, 'D', 400, 'CD', 100, 'C', 90, 'XC',
        50, 'L', 40, 'XL', 10, 'X', 9, 'IX', 5, 'V', 4, 'IV', 1, 'I'],
    "armenian": [9999, 9000, '\u0584', 8000, '\u0583', 7000, '\u0582', 6000, '\u0581',
        5000, '\u0580', 4000, '\u057F', 3000, '\u057E', 2000, '\u057D',
        1000, '\u057C', 900, '\u057B', 800, '\u057A', 700, '\u0579', 600, '\u0578',
        500, '\u0577', 400, '\u0576', 300, '\u0575', 200, '\u0574', 100, '\u0573',
        90, '\u0572', 80, '\u0571', 70, '\u0570', 60, '\u056F', 50, '\u056E',
        40, '\u056D', 30, '\u056C', 20, '\u056B', 10, '\u056A', 9, '\u0569',
        8, '\u0568', 7, '\u0567', 6, '\u0566', 5, '\u0565', 4, '\u0564',
        3, '\u0563', 2, '\u0562', 1, '\u0561'],
    "georgian": [19999, 10000, '\u10F5', 9000, '\u10F0', 8000, '\u10EF', 7000, '\u10F4',
        6000, '\u10EE', 5000, '\u10ED', 4000, '\u10EC', 3000, '\u10EB',
        2000, '\u10EA', 1000, '\u10E9', 900, '\u10E8', 800, '\u10E7', 700, '\u10E6',
        600, '\u10E5', 500, '\u10E4', 400, '\u10F3', 300, '\u10E2', 200, '\u10E1',
        100, '\u10E0', 90, '\u10DF', 80, '\u10DE', 70, '\u10DD', 60, '\u10F2',
        50, '\u10DC', 40, '\u10DB', 30, '\u10DA', 20, '\u10D9', 10, '\u10D8',
        9, '\u10D7', 8, '\u10F1', 7, '\u10D6', 6, '\u10D5', 5, '\u10D4', 4, '\u10D3',
        3, '\u10D2', 2, '\u10D1', 1, '\u10D0'],
    "hebrew": [999, 400, '\u05EA', 300, '\u05E9', 200, '\u05E8', 100, '\u05E7', 90, '\u05E6',
        80, '\u05E4', 70, '\u05E2', 60, '\u05E1', 50, '\u05E0', 40, '\u05DE', 30, '\u05DC',
        20, '\u05DB', 19, '\u05D9\u05D8', 18, '\u05D9\u05D7', 17, '\u05D9\u05D6',
        16, '\u05D8\u05D6', 15, '\u05D8\u05D5', 10, '\u05D9', 9, '\u05D8', 8, '\u05D7',
        7, '\u05D6', 6, '\u05D5', 5, '\u05D4', 4, '\u05D3', 3, '\u05D2', 2, '\u05D1',
        1, '\u05D0']
};

/** @const */
adapt.csscasc.alphabeticNumbering = {
    "latin": 'a-z',
    "alpha": 'a-z',
    "greek": '\u03B1-\u03C1\u03C3-\u03C9',
    'russian': '\u0430-\u0438\u043A-\u0449\u044D-\u044F'
};

/** @const */
adapt.csscasc.fixed = {
    "square": '\u25A0',
    "disc": '\u2022',
    "circle": '\u25E6',
    "none": ''
};

/**
 * @param {Array} entries
 * @param {number} num
 */
adapt.csscasc.additiveFormat = function(entries, num) {
    var max = /** @type {number} */ (entries[0]);
    if (num > max || num <= 0 || num != Math.round(num))
        return "";
    var result = "";
    for (var i = 1; i < entries.length; i+=2) {
        var value = /** @type {number} */ (entries[i]);
        var count = Math.floor(num / value);
        if (count > 20)
            return "";
        num -= count * value;
        while (count > 0) {
            result += entries[i+1];
            count--;
        }
    }
    return result;
};

adapt.csscasc.expandAlphabet = function(str) {
    var arr = [];
    var i = 0;
    while (i < str.length) {
        if (str.substr(i+1, 1) == "-") {
            var first = str.charCodeAt(i);
            var last = str.charCodeAt(i+2);
            i += 3;
            for (var k = first; k <= last; k++) {
                arr.push(String.fromCharCode(k));
            }
        } else {
            arr.push(str.substr(i++, 1));
        }
    }
    return arr;
};

/**
 * @param {String} alphabetStr
 * @param {number} num
 */
adapt.csscasc.alphabeticFormat = function(alphabetStr, num) {
    if (num <= 0 || num != Math.round(num))
        return "";
    var alphabet = adapt.csscasc.expandAlphabet(alphabetStr);
    var result = "";
    do {
        num--;
        var digit = num % alphabet.length;
        result = alphabet[digit] + result;
        num = (num - digit) / alphabet.length;
    } while (num > 0);
    return result;
};

/**
 * @typedef {{digits:string, markers:string, negative:string, formal:boolean}}
 */
adapt.csscasc.ChineseNumbering;

/**
 * From http://www.w3.org/TR/css3-lists/
 * @const
 * @type {adapt.csscasc.ChineseNumbering}
 */
adapt.csscasc.chineseTradInformal = {
    formal: false,
    digits: "\u96F6\u4E00\u4E8C\u4E09\u56DB\u4E94\u516D\u4E03\u516B\u4E5D",
    markers: "\u5341\u767E\u5343",
    negative: "\u8CA0"
};

/**
 * @param {number} num
 * @param {adapt.csscasc.ChineseNumbering} numbering
 */
adapt.csscasc.chineseCounter = function(num, numbering) {
    if (num > 9999 || num < -9999)
        return "" + num;  // TODO: should be cjk-decimal
    if (num == 0)
        return numbering.digits.charAt(0);
    var res = new adapt.base.StringBuffer();
    if (num < 0) {
        res.append(numbering.negative);
        num = -num;
    }
    if (num < 10) {
        res.append(numbering.digits.charAt(num));
    } else if (numbering.informal && num <= 19) {
        res.append(numbering.markers.charAt(0));
        if (num != 0) {
            res.append(numbering.markers.charAt(num - 10));
        }
    } else {
        var thousands = Math.floor(num/1000);
        if (thousands) {
            res.append(numbering.digits.charAt(thousands));
            res.append(numbering.markers.charAt(2));
        }
        var hundreds = Math.floor(num/100) % 10;
        if (hundreds) {
            res.append(numbering.digits.charAt(hundreds));
            res.append(numbering.markers.charAt(1));
        }
        var tens = Math.floor(num/10) % 10;
        if (tens) {
            res.append(numbering.digits.charAt(tens));
            res.append(numbering.markers.charAt(0));
        }
        var ones = num % 10;
        if (ones) {
            res.append(numbering.digits.charAt(ones));
        }
    }
    // res.append("\u3001");
    return res.toString();
};

/**
 * @private
 * @param {number} num
 * @param {string} type
 * @return {string}
 */
adapt.csscasc.ContentPropVisitor.prototype.format = function(num, type) {
    var upper = false; // type == "armenian"; // content-counter-10.xht assumes armenian is uppercase, enable if desired
    var lower = false;
    var r;
    if ((r = type.match(/^upper-(.*)/)) != null) {
        upper = true;
        type = r[1];
    } else if ((r = type.match(/^lower-(.*)/)) != null) {
        lower = true;
        type = r[1];
    }
    var result = "";
    if (adapt.csscasc.additiveNumbering[type]) {
        result = adapt.csscasc.additiveFormat(adapt.csscasc.additiveNumbering[type], num);
    } else if (adapt.csscasc.alphabeticNumbering[type]) {
        result = adapt.csscasc.alphabeticFormat(adapt.csscasc.alphabeticNumbering[type], num);
    } else if (adapt.csscasc.fixed[type] != null) {
        result = adapt.csscasc.fixed[type];
    } else if (type == "decimal-leading-zero") {
        result = num + "";
        if (result.length == 1)
            result = "0" + result;
    } else if (type == "cjk-ideographic" || type == "trad-chinese-informal") {
        result = adapt.csscasc.chineseCounter(num, adapt.csscasc.chineseTradInformal);
    } else {
        result = num + "";
    }
    if (upper) {
        return result.toUpperCase();
    }
    if (lower) {
        return result.toLowerCase();
    }
    return result;
};

/**
 * @param {Array.<adapt.css.Val>} values
 * @return {adapt.css.Val}
 */
adapt.csscasc.ContentPropVisitor.prototype.visitFuncCounter = function(values) {
    var counterName = values[0].toString();
    var type = values.length > 1 ? values[1].stringValue() : "decimal";
    var arr = this.cascade.counters[counterName];
    if (arr && arr.length) {
        var numval = (arr && arr.length && arr[arr.length - 1]) || 0;
        return new adapt.css.Str(this.format(numval, type));
    } else {
        var self = this;
        var c = new adapt.css.Expr(this.counterResolver.getPageCounterVal(counterName, function(numval) {
            return self.format(numval || 0, type);
        }));
        return new adapt.css.SpaceList([c]);
    }
};

/**
 * @param {Array.<adapt.css.Val>} values
 * @return {adapt.css.Val}
 */
adapt.csscasc.ContentPropVisitor.prototype.visitFuncCounters = function(values) {
    var counterName = values[0].toString();
    var separator = values[1].stringValue();
    var type = values.length > 2 ? values[2].stringValue() : "decimal";
    var arr = this.cascade.counters[counterName];
    var sb = new adapt.base.StringBuffer();
    if (arr && arr.length) {
        for (var i = 0; i < arr.length; i++) {
            if (i > 0)
                sb.append(separator);
            sb.append(this.format(arr[i], type));
        }
    }
    var self = this;
    var c = new adapt.css.Expr(this.counterResolver.getPageCountersVal(counterName, function(numvals) {
        var parts = /** @type {Array.<string>} */ ([]);
        if (numvals.length) {
            for (var i = 0; i < numvals.length; i++) {
                parts.push(self.format(numvals[i], type));
            }
        }
        var elementCounters = sb.toString();
        if (elementCounters.length) {
            parts.push(elementCounters);
        }
        if (parts.length) {
            return parts.join(separator);
        } else {
            return self.format(0, type);
        }
    }));
    return new adapt.css.SpaceList([c]);
};

/**
 * @param {Array.<adapt.css.Val>} values
 * @return {adapt.css.Val}
 */
adapt.csscasc.ContentPropVisitor.prototype.visitFuncTargetCounter = function(values) {
    var targetUrl = values[0];
    var targetUrlStr;
    if (targetUrl instanceof adapt.css.URL) {
        targetUrlStr = targetUrl.url;
    } else {
        targetUrlStr = targetUrl.stringValue();
    }
    var counterName = values[1].toString();
    var type = values.length > 2 ? values[2].stringValue() : "decimal";

    var self = this;
    var c = new adapt.css.Expr(this.counterResolver.getTargetCounterVal(targetUrlStr, counterName, function(numval) {
        return self.format(numval || 0, type);
    }));
    return new adapt.css.SpaceList([c]);
};

/**
 * @param {Array<adapt.css.Val>} values
 * @returns {adapt.css.Val}
 */
adapt.csscasc.ContentPropVisitor.prototype.visitFuncTargetCounters = function(values) {
    var targetUrl = values[0];
    var targetUrlStr;
    if (targetUrl instanceof adapt.css.URL) {
        targetUrlStr = targetUrl.url;
    } else {
        targetUrlStr = targetUrl.stringValue();
    }
    var counterName = values[1].toString();
    var separator = values[2].stringValue();
    var type = values.length > 3 ? values[3].stringValue() : "decimal";

    var self = this;
    var c = new adapt.css.Expr(this.counterResolver.getTargetCountersVal(targetUrlStr, counterName, function(numvals) {
        var parts = numvals.map(function(numval) {
            return self.format(numval, type);
        });
        if (parts.length) {
            return parts.join(separator);
        } else {
            return self.format(0, type);
        }
    }));
    return new adapt.css.SpaceList([c]);
};

/**
 * @override
 */
adapt.csscasc.ContentPropVisitor.prototype.visitFunc = function(func) {
    switch (func.name) {
        case "counter" :
            if (func.values.length <= 2) {
                return this.visitFuncCounter(func.values);
            }
            break;
        case "counters" :
            if (func.values.length <= 3) {
                return this.visitFuncCounters(func.values);
            }
            break;
        case "target-counter":
            if (func.values.length <= 3) {
                return this.visitFuncTargetCounter(func.values);
            }
            break;
        case "target-counters":
            if (func.values.length <= 4) {
                return this.visitFuncTargetCounters(func.values);
            }
            break;
    }
    vivliostyle.logging.logger.warn("E_CSS_CONTENT_PROP:", func.toString());
    return new adapt.css.Str("");
};


/**
 * Fitting order and specificity in the same number. Order is recorded in the
 * fractional part. Select value so that
 *
 *   0x7FFFFFFF != 0x7FFFFFFF + ORDER_INCREMENT
 *
 * @const
 */
adapt.csscasc.ORDER_INCREMENT = 1 / 0x100000;


/**
 * @param {!adapt.csscasc.ActionTable} src
 * @param {!adapt.csscasc.ActionTable} dst
 * @return {void}
 */
adapt.csscasc.copyTable = function(src, dst) {
    for (var n in src) {
        dst[n] = src[n].clone();
    }
};


/**
 * @constructor
 */
adapt.csscasc.Cascade = function() {
    /** @type {number} */ this.nsCount = 0;
    /** @type {!Object.<string,string>} */ this.nsPrefix = {};
    /** @type {!adapt.csscasc.ActionTable} */ this.tags = {};
    /** @type {!adapt.csscasc.ActionTable} */ this.nstags = {};
    /** @type {!adapt.csscasc.ActionTable} */ this.epubtypes = {};
    /** @type {!adapt.csscasc.ActionTable} */ this.classes = {};
    /** @type {!adapt.csscasc.ActionTable} */ this.ids = {};
    /** @type {!adapt.csscasc.ActionTable} */ this.pagetypes = {};
    /** @type {number} */ this.order = 0;
};

/**
 * @return {adapt.csscasc.Cascade}
 */
adapt.csscasc.Cascade.prototype.clone = function() {
    var r = new adapt.csscasc.Cascade();
    r.nsCount = this.nsCount;
    for (var p in this.nsPrefix) {
        r.nsPrefix[p] = this.nsPrefix[p];
    }
    adapt.csscasc.copyTable(this.tags, r.tags);
    adapt.csscasc.copyTable(this.nstags, r.nstags);
    adapt.csscasc.copyTable(this.epubtypes, r.epubtypes);
    adapt.csscasc.copyTable(this.classes, r.classes);
    adapt.csscasc.copyTable(this.ids, r.ids);
    adapt.csscasc.copyTable(this.pagetypes, r.pagetypes);
    r.order = this.order;
    return r;
};

/**
 * @param {!adapt.csscasc.ActionTable} table
 * @param {string} key
 * @param {!adapt.csscasc.CascadeAction} action
 * @return {void}
 */
adapt.csscasc.Cascade.prototype.insertInTable = function(table, key, action) {
    var a = table[key];
    if (a)
        action = a.mergeWith(action);
    table[key] = action;
};

/**
 * @param {adapt.expr.Context} context
 * @param {!adapt.csscasc.CounterListener} counterListener
 * @param {!adapt.csscasc.CounterResolver} counterResolver
 * @return {adapt.csscasc.CascadeInstance}
 */
adapt.csscasc.Cascade.prototype.createInstance = function(context, counterListener, counterResolver, lang) {
    return new adapt.csscasc.CascadeInstance(this, context, counterListener, counterResolver, lang);
};

/**
 * @return {number}
 */
adapt.csscasc.Cascade.prototype.nextOrder = function() {
    return this.order += adapt.csscasc.ORDER_INCREMENT;
};


/**
 * @param {adapt.csscasc.Cascade} cascade
 * @param {adapt.expr.Context} context
 * @param {!adapt.csscasc.CounterListener} counterListener
 * @param {!adapt.csscasc.CounterResolver} counterResolver
 * @param {string} lang
 * @constructor
 */
adapt.csscasc.CascadeInstance = function(cascade, context, counterListener, counterResolver, lang) {
    /** @const */ this.code = cascade;
    /** @const */ this.context = context;
    /** @const */ this.counterListener = counterListener;
    /** @const */ this.counterResolver = counterResolver;
    /** @const */ this.stack = /** @type {Array.<Array.<adapt.csscasc.ConditionItem>>} */ ([[], []]);
    /** @const */ this.conditions = /** @type {Object.<string,number>} */ ({});
    /** @type {Element} */ this.currentElement = null;
    /** @type {adapt.csscasc.ElementStyle} */ this.currentStyle = null;
    /** @type {Array.<string>} */ this.currentClassNames = null;
    /** @type {string} */ this.currentLocalName = "";
    /** @type {string} */ this.currentNamespace = "";
    /** @type {string} */ this.currentId = "";
    /** @type {string} */ this.currentXmlId = "";
    /** @type {string} */ this.currentNSTag = "";
    /** @type {Array.<string>} */ this.currentEpubTypes = null;
    /** @type {?string} */ this.currentPageType = null;
    /** @type {boolean} */ this.isFirst = true;
    /** @type {boolean} */ this.isRoot = true;
    /** @type {!Object.<string,!Array.<number>>} */ this.counters = {};
    /** @type {Array.<Object.<string,boolean>>} */ this.counterScoping = [{}];
    /** @type {Array.<adapt.css.Str>} */ this.quotes = [
        new adapt.css.Str("\u201C"), new adapt.css.Str("\u201D"),
        new adapt.css.Str("\u2018"), new adapt.css.Str("\u2019")
    ];
    /** @type {number} */ this.quoteDepth = 0;
    /** @type {string} */ this.lang = "";
    /** @type {Array.<number>} */ this.siblingOrderStack = [0];
    /** @type {number} */ this.currentSiblingOrder = 0;
    /** @const {!Array<!Object<string, !Object<string, number>>>} */ this.siblingTypeCountsStack = [{}];
    /** @type {!Object<string, !Object<string, number>>} */ this.currentSiblingTypeCounts = this.siblingTypeCountsStack[0];
    /** @type {?number} */ this.currentFollowingSiblingOrder = null;
    /** @type {Array.<?number>} */ this.followingSiblingOrderStack = [this.currentFollowingSiblingOrder];
    /** @const {!Array<!Object<string, !Object<string, number>>>} */ this.followingSiblingTypeCountsStack = [{}];
    /** @type {!Object<string, !Object<string, number>>} */ this.currentFollowingSiblingTypeCounts = this.siblingTypeCountsStack[0];
    if (goog.DEBUG) {
        /** @type {Array.<Element>} */ this.elementStack = [];
    }
};

/**
 * @param {adapt.csscasc.ConditionItem} item
 * @return {void}
 */
adapt.csscasc.CascadeInstance.prototype.pushConditionItem = function(item) {
    this.stack[this.stack.length - 1].push(item);
};

/**
 * @param {string} condition
 * @return {void}
 */
adapt.csscasc.CascadeInstance.prototype.increment = function(condition) {
    this.conditions[condition] = (this.conditions[condition] || 0) + 1;
};

/**
 * @param {string} condition
 * @return {void}
 */
adapt.csscasc.CascadeInstance.prototype.decrement = function(condition) {
    this.conditions[condition]--;
};

/**
 * @param {adapt.csscasc.ActionTable} table
 * @param {string} key
 * @return {void}
 */
adapt.csscasc.CascadeInstance.prototype.applyAction = function(table, key) {
    var action = table[key];
    action && action.apply(this);
};

/**
 * @const
 */
adapt.csscasc.EMPTY = [];

/**
 * @param {Array.<string>} classes
 * @param {?string} pageType
 * @param {adapt.csscasc.ElementStyle} baseStyle
 * @return {void}
 */
adapt.csscasc.CascadeInstance.prototype.pushRule = function(classes, pageType, baseStyle) {
    this.currentElement = null;
    this.currentStyle = baseStyle;
    this.currentNamespace = "";
    this.currentLocalName = "";
    this.currentId = "";
    this.currentXmlId = "";
    this.currentClassNames = classes;
    this.currentNSTag = "";
    this.currentEpubTypes = adapt.csscasc.EMPTY;
    this.currentPageType = pageType;
    this.applyActions();
};

/**
 * @param {string} counterName
 * @param {number} value
 */
adapt.csscasc.CascadeInstance.prototype.defineCounter = function(counterName, value) {
    if (this.counters[counterName])
        this.counters[counterName].push(value);
    else
        this.counters[counterName] = [value];
    var scoping = this.counterScoping[this.counterScoping.length - 1];
    if (!scoping) {
        scoping = {};
        this.counterScoping[this.counterScoping.length - 1] = scoping;
    }
    scoping[counterName] = true;
};

/**
 * @param {adapt.csscasc.ElementStyle} props
 * @return {void}
 */
adapt.csscasc.CascadeInstance.prototype.pushCounters = function(props) {
    var displayVal = adapt.css.ident.inline;
    var display = props["display"];
    if (display) {
        displayVal = display.evaluate(this.context);
    }
    var resetMap = null;
    var incrementMap = null;
    var setMap = null;

    var reset = props["counter-reset"];
    if (reset) {
        var resetVal = reset.evaluate(this.context);
        if (resetVal) {
            resetMap = adapt.cssprop.toCounters(resetVal, true);
        }
    }
    var set = props["counter-set"];
    if (set) {
        var setVal = set.evaluate(this.context);
        if (setVal) {
            setMap = adapt.cssprop.toCounters(setVal, false);
        }
    }
    var increment = props["counter-increment"];
    if (increment) {
        var incrementVal = increment.evaluate(this.context);
        if (incrementVal) {
            incrementMap = adapt.cssprop.toCounters(incrementVal, false);
        }
    }
    if ((this.currentLocalName == "ol" || this.currentLocalName == "ul") &&
        this.currentNamespace == adapt.base.NS.XHTML) {
        if (!resetMap)
            resetMap = {};
        resetMap["ua-list-item"] = 0;
    }
    if (displayVal === adapt.css.ident.list_item) {
        if (!incrementMap)
            incrementMap = {};
        incrementMap["ua-list-item"] = 1;
    }
    if (resetMap) {
        for (var resetCounterName in resetMap) {
            this.defineCounter(resetCounterName, resetMap[resetCounterName]);
        }
    }
    if (setMap) {
        for (var setCounterName in setMap) {
            if (!this.counters[setCounterName]) {
                this.defineCounter(setCounterName, setMap[setCounterName]);
            } else {
                var counterValues = this.counters[setCounterName];
                counterValues[counterValues.length - 1] = setMap[setCounterName];
            }
        }
    }
    if (incrementMap) {
        for (var incrementCounterName in incrementMap) {
            if (!this.counters[incrementCounterName]) {
                this.defineCounter(incrementCounterName, 0);
            }
            var counterValues = this.counters[incrementCounterName];
            counterValues[counterValues.length - 1] += incrementMap[incrementCounterName];
        }
    }
    if (displayVal === adapt.css.ident.list_item) {
        var listItemCounts = this.counters["ua-list-item"];
        var listItemCount = listItemCounts[listItemCounts.length - 1];
        props["ua-list-item-count"] =
            new adapt.csscasc.CascadeValue(new adapt.css.Num(listItemCount), 0);
    }
    this.counterScoping.push(null);
};

/**
 * @return {void}
 */
adapt.csscasc.CascadeInstance.prototype.popCounters = function() {
    var scoping = this.counterScoping.pop();
    if (scoping) {
        for (var counterName in scoping) {
            var arr = this.counters[counterName];
            if (arr) {
                if (arr.length == 1) {
                    delete this.counters[counterName];
                } else {
                    arr.pop();
                }
            }
        }
    }
};

/**
 * @param {adapt.csscasc.ElementStyle} pseudoprops
 * @param {Element} element
 * @return {void}
 */
adapt.csscasc.CascadeInstance.prototype.processPseudoelementProps = function(pseudoprops, element) {
    this.pushCounters(pseudoprops);
    if (pseudoprops["content"]) {
        pseudoprops["content"] = pseudoprops["content"].filterValue(
            new adapt.csscasc.ContentPropVisitor(this, element, this.counterResolver));
    }
    this.popCounters();
};

/**
 * Pseudoelement names in the order they should be processed, empty string is the place where
 * the element's DOM children are processed.
 * @const
 */
adapt.csscasc.pseudoNames = ["before", "transclusion-before",
    "footnote-call", "footnote-marker", "inner", "first-letter", "first-line",
    "" /* content */, "transclusion-after", "after"];

/**
 * @param {Element} element
 * @param {adapt.csscasc.ElementStyle} baseStyle
 * @return {void}
 */
adapt.csscasc.CascadeInstance.prototype.pushElement = function(element, baseStyle) {
    if (goog.DEBUG) {
        this.elementStack.push(element);
    }
    // do not apply page rules
    this.currentPageType = null;
    this.currentElement = element;
    this.currentStyle = baseStyle;
    this.currentNamespace = element.namespaceURI;
    this.currentLocalName = element.localName;
    var prefix = this.code.nsPrefix[this.currentNamespace];
    if (prefix) {
        this.currentNSTag = prefix + this.currentLocalName;
    } else {
        this.currentNSTag = "";
    }
    this.currentId = element.getAttribute("id");
    this.currentXmlId = element.getAttributeNS(adapt.base.NS.XML, "id");
    var classes = element.getAttribute("class");
    if (classes) {
        this.currentClassNames = classes.split(/\s+/);
    } else {
        this.currentClassNames = adapt.csscasc.EMPTY;
    }
    var types = element.getAttributeNS(adapt.base.NS.epub, "type");
    if (types) {
        this.currentEpubTypes = types.split(/\s+/);
    } else {
        this.currentEpubTypes = adapt.csscasc.EMPTY;
    }
    if (this.currentLocalName == "style" && this.currentNamespace == adapt.base.NS.FB2) {
        // special case
        var className = element.getAttribute("name") || "";
        this.currentClassNames = [className];
    }
    var lang = adapt.base.getLangAttribute(element);
    if (lang) {
        this.stack[this.stack.length - 1].push(
            new adapt.csscasc.RestoreLangItem(this.lang));
        this.lang = lang.toLowerCase();
    }
    var isRoot = this.isRoot;

    var siblingOrderStack = this.siblingOrderStack;
    this.currentSiblingOrder = ++siblingOrderStack[siblingOrderStack.length - 1];
    siblingOrderStack.push(0);

    var siblingTypeCountsStack = this.siblingTypeCountsStack;
    var currentSiblingTypeCounts = this.currentSiblingTypeCounts = siblingTypeCountsStack[siblingTypeCountsStack.length - 1];
    var currentNamespaceTypeCounts = currentSiblingTypeCounts[this.currentNamespace];
    if (!currentNamespaceTypeCounts) {
        currentNamespaceTypeCounts = currentSiblingTypeCounts[this.currentNamespace] = {};
    }
    currentNamespaceTypeCounts[this.currentLocalName] = (currentNamespaceTypeCounts[this.currentLocalName] || 0) + 1;
    siblingTypeCountsStack.push({});

    var followingSiblingOrderStack = this.followingSiblingOrderStack;
    if (followingSiblingOrderStack[followingSiblingOrderStack.length - 1] !== null) {
        this.currentFollowingSiblingOrder = --followingSiblingOrderStack[followingSiblingOrderStack.length - 1];
    } else {
        this.currentFollowingSiblingOrder = null;
    }
    followingSiblingOrderStack.push(null);

    var followingSiblingTypeCountsStack = this.followingSiblingTypeCountsStack;
    var currentFollowingSiblingTypeCounts = this.currentFollowingSiblingTypeCounts = followingSiblingTypeCountsStack[followingSiblingTypeCountsStack.length - 1];
    if (currentFollowingSiblingTypeCounts && currentFollowingSiblingTypeCounts[this.currentNamespace]) {
        currentFollowingSiblingTypeCounts[this.currentNamespace][this.currentLocalName]--;
    }
    followingSiblingTypeCountsStack.push({});

    this.applyActions();
    this.applyAttrFilter(element);
    var quotesCasc = baseStyle["quotes"];
    var itemToPushLast = null;
    if (quotesCasc) {
        var quotesVal = quotesCasc.evaluate(this.context);
        if (quotesVal) {
            itemToPushLast = new adapt.csscasc.QuotesScopeItem(this.quotes);
            if (quotesVal === adapt.css.ident.none)
                this.quotes = [new adapt.css.Str(""), new adapt.css.Str("")];
            else if (quotesVal instanceof adapt.css.SpaceList)
                this.quotes = /** @type {Array.<adapt.css.Str>} */
                    ((/** @type {adapt.css.SpaceList} */ (quotesVal)).values);
        }
    }
    this.pushCounters(this.currentStyle);
    var id = this.currentId || this.currentXmlId || element.getAttribute("name") || "";
    if (isRoot || id) {
        /** @type {!Object<string, Array<number>>} */ var counters = {};
        Object.keys(this.counters).forEach(function(name) {
            counters[name] = Array.from(this.counters[name]);
        }, this);
        this.counterListener.countersOfId(id, counters);
    }
    var pseudos = adapt.csscasc.getStyleMap(this.currentStyle, "_pseudos");
    if (pseudos) {
        var before = true;
        for (var k = 0; k < adapt.csscasc.pseudoNames.length; k++) {
            var pseudoName = adapt.csscasc.pseudoNames[k];
            if (!pseudoName) {
                // content
                before = false;
            }
            var pseudoProps = pseudos[pseudoName];
            if (pseudoProps) {
                if (before) {
                    this.processPseudoelementProps(pseudoProps, element);
                } else {
                    this.stack[this.stack.length - 2].push(
                        new adapt.csscasc.AfterPseudoelementItem(pseudoProps, element));
                }
            }
        }
    }
    if (itemToPushLast) {
        this.stack[this.stack.length - 2].push(itemToPushLast);
    }
};


/**
 * @private
 * @return {void}
 */
adapt.csscasc.CascadeInstance.prototype.applyAttrFilterInner = function(visitor, elementStyle) {
    for (var propName in elementStyle) {
        if (adapt.csscasc.isPropName(propName))
            elementStyle[propName] = elementStyle[propName].filterValue(visitor);
    }
};
/**
 * @private
 * @return {void}
 */
adapt.csscasc.CascadeInstance.prototype.applyAttrFilter = function(element) {
    var visitor = new adapt.csscasc.AttrValueFilterVisitor(element);
    var currentStyle = this.currentStyle;
    var pseudoMap = adapt.csscasc.getStyleMap(currentStyle, "_pseudos");
    for (var pseudoName in pseudoMap) {
        this.applyAttrFilterInner(visitor, pseudoMap[pseudoName]);
    }
    this.applyAttrFilterInner(visitor, currentStyle);
};
/**
 * @private
 * @return {void}
 */
adapt.csscasc.CascadeInstance.prototype.applyActions = function() {
    var i;
    for (i = 0; i < this.currentClassNames.length; i++) {
        this.applyAction(this.code.classes, this.currentClassNames[i]);
    }
    for (i = 0; i < this.currentEpubTypes.length; i++) {
        this.applyAction(this.code.epubtypes, this.currentEpubTypes[i]);
    }
    this.applyAction(this.code.ids, this.currentId);
    this.applyAction(this.code.tags, this.currentLocalName);
    if (this.currentLocalName != "") {
        // Universal selector does not apply to page-master-related rules.
        this.applyAction(this.code.tags, "*");
    }
    this.applyAction(this.code.nstags, this.currentNSTag);
    // Apply page rules only when currentPageType is not null
    if (this.currentPageType !== null) {
        this.applyAction(this.code.pagetypes, this.currentPageType);
        // We represent page rules without selectors by *, though it is illegal in CSS
        this.applyAction(this.code.pagetypes, "*");
    }
    this.currentElement = null;
    this.currentDoc = null;
    this.stack.push([]);
    for (var depth = 1; depth >= -1; --depth) {
        var list = this.stack[this.stack.length - depth - 2];
        i = 0;
        while (i < list.length) {
            if (list[i].push(this, depth)) {
                // done
                list.splice(i, 1);
            } else {
                i++;
            }
        }
    }
    this.isFirst = true;
    this.isRoot = false;
};

/**
 * @private
 * @return {void}
 */
adapt.csscasc.CascadeInstance.prototype.pop = function() {
    for (var depth = 1; depth >= -1; --depth) {
        var list = this.stack[this.stack.length - depth - 2];
        var i = 0;
        while (i < list.length) {
            if (list[i].pop(this, depth)) {
                // done
                list.splice(i, 1);
            } else {
                i++;
            }
        }
    }
    this.stack.pop();
    this.isFirst = false;
};

/**
 * @return {void}
 */
adapt.csscasc.CascadeInstance.prototype.popRule = function() {
    this.pop();
};

/**
 * @param {Element} element
 * @return {void}
 */
adapt.csscasc.CascadeInstance.prototype.popElement = function(element) {
    if (goog.DEBUG) {
        var e = this.elementStack.pop();
        if (e !== element) {
            throw new Error("Invalid call to popElement");
        }
    }
    this.siblingOrderStack.pop();
    this.siblingTypeCountsStack.pop();
    this.followingSiblingOrderStack.pop();
    this.followingSiblingTypeCountsStack.pop();
    this.pop();
    this.popCounters();
};

/**
 * @enum {number}
 */
adapt.csscasc.ParseState = {
    TOP: 0,
    SELECTOR: 1,
    RULE: 2
};

/**
 * Cascade for base User Agent stylesheet.
 * @type {adapt.csscasc.Cascade}
 */
adapt.csscasc.uaBaseCascade = null;

//------------- parsing ------------

/**
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.cssparse.DispatchParserHandler} owner
 * @param {adapt.expr.Val} condition
 * @param {adapt.csscasc.CascadeParserHandler} parent
 * @param {?string} regionId
 * @param {adapt.cssvalid.ValidatorSet} validatorSet
 * @param {boolean} topLevel
 * @constructor
 * @extends {adapt.cssparse.SlaveParserHandler}
 * @implements {adapt.cssvalid.PropertyReceiver}
 */
adapt.csscasc.CascadeParserHandler = function(scope, owner, condition, parent, regionId,
                                              validatorSet, topLevel) {
    adapt.cssparse.SlaveParserHandler.call(this, scope, owner, topLevel);
    /** @type {Array.<adapt.csscasc.ChainedAction>} */ this.chain = null;
    /** @type {number} */ this.specificity = 0;
    /** @type {adapt.csscasc.ElementStyle} */ this.elementStyle = null;
    /** @type {number} */ this.conditionCount = 0;
    /** @type {?string} */ this.pseudoelement = null;
    /** @type {boolean} */ this.footnoteContent = false;
    /** @const */ this.condition = condition;
    /** @const */ this.cascade = parent ? parent.cascade :
        (adapt.csscasc.uaBaseCascade ? adapt.csscasc.uaBaseCascade.clone() :
            new adapt.csscasc.Cascade());
    /** @const */ this.regionId = regionId;
    /** @const */ this.validatorSet = validatorSet;
    /** @type {adapt.csscasc.ParseState} */ this.state = adapt.csscasc.ParseState.TOP;
};
goog.inherits(adapt.csscasc.CascadeParserHandler, adapt.cssparse.SlaveParserHandler);

/**
 * @protected
 * @param {adapt.csscasc.CascadeAction} action
 * @return {void}
 */
adapt.csscasc.CascadeParserHandler.prototype.insertNonPrimary = function(action) {
    this.cascade.insertInTable(this.cascade.tags, "*", action);
};

/**
 * @param {adapt.csscasc.CascadeAction} action
 * @return {void}
 */
adapt.csscasc.CascadeParserHandler.prototype.processChain = function(action) {
    var chained = adapt.csscasc.chainActions(this.chain, action);
    if (chained !== action && chained.makePrimary(this.cascade))
        return;
    this.insertNonPrimary(chained);
};

/**
 * @param {string} mnemonics
 * @return {boolean}
 */
adapt.csscasc.CascadeParserHandler.prototype.isInsideSelectorRule = function(mnemonics) {
    if (this.state != adapt.csscasc.ParseState.TOP) {
        this.reportAndSkip(mnemonics);
        return true;
    }
    return false;
};

/**
 * @override
 */
adapt.csscasc.CascadeParserHandler.prototype.tagSelector = function(ns, name) {
    if (!name && !ns) {
        return;
    }
    this.specificity += 1;
    if (name && ns) {
        this.chain.push(new adapt.csscasc.CheckNSTagAction(ns, name.toLowerCase()));
    } else if (name) {
        this.chain.push(new adapt.csscasc.CheckLocalNameAction(name.toLowerCase()));
    } else {
        this.chain.push(new adapt.csscasc.CheckNamespaceAction(/** @type {string} */ (ns)));
    }
};

/**
 * @override
 */
adapt.csscasc.CascadeParserHandler.prototype.classSelector = function(name) {
    if (this.pseudoelement) {
        vivliostyle.logging.logger.warn("::" + this.pseudoelement, "followed by ." + name);
        this.chain.push(new adapt.csscasc.CheckConditionAction("")); // always fails
        return;
    }
    this.specificity += 0x100;
    this.chain.push(new adapt.csscasc.CheckClassAction(name));
};

/**
 * @private
 * @const {!Object<string, function(new: adapt.csscasc.IsNthAction, number, number)>}
 */
adapt.csscasc.nthSelectorActionClasses = {
    "nth-child": adapt.csscasc.IsNthSiblingAction,
    "nth-of-type": adapt.csscasc.IsNthSiblingOfTypeAction,
    "nth-last-child": adapt.csscasc.IsNthLastSiblingAction,
    "nth-last-of-type": adapt.csscasc.IsNthLastSiblingOfTypeAction
};

/**
 * @override
 */
adapt.csscasc.CascadeParserHandler.prototype.pseudoclassSelector = function(name, params) {
    if (this.pseudoelement) {
        vivliostyle.logging.logger.warn("::" + this.pseudoelement, "followed by :" + name);
        this.chain.push(new adapt.csscasc.CheckConditionAction("")); // always fails
        return;
    }
    switch (name.toLowerCase()) {
        case "enabled":
            this.chain.push(new adapt.csscasc.IsEnabledAction());
            break;
        case "disabled":
            this.chain.push(new adapt.csscasc.IsDisabledAction());
            break;
        case "checked":
            this.chain.push(new adapt.csscasc.IsCheckedAction());
            break;
        case "root":
            this.chain.push(new adapt.csscasc.IsRootAction());
            break;
        case "link":
            this.chain.push(new adapt.csscasc.CheckLocalNameAction("a"));
            this.chain.push(new adapt.csscasc.CheckAttributePresentAction("", "href"));
            break;
        case "-adapt-href-epub-type":
        case "href-epub-type":
            if (params && params.length == 1 && typeof params[0] == "string") {
                var value = /** @type {string} */ (params[0]);
                var patt = new RegExp("(^|\s)" + adapt.base.escapeRegExp(value) + "($|\s)");
                this.chain.push(new adapt.csscasc.CheckTargetEpubTypeAction(patt));
            } else {
                this.chain.push(new adapt.csscasc.CheckConditionAction("")); // always fails
            }
            break;
        case "-adapt-footnote-content":
        case "footnote-content":
            // content inside the footnote
            this.footnoteContent = true;
            break;
        case "visited":
        case "active":
        case "hover":
        case "focus":
            this.chain.push(new adapt.csscasc.CheckConditionAction("")); // always fails
            break;
        case "lang":
            if (params && params.length == 1 && typeof params[0] == "string") {
                var langValue = /** @type {string} */ (params[0]);
                this.chain.push(new adapt.csscasc.CheckLangAction(
                    new RegExp("^" + adapt.base.escapeRegExp(langValue.toLowerCase()) + "($|-)")));
            } else {
                this.chain.push(new adapt.csscasc.CheckConditionAction("")); // always fais
            }
            break;
        case "nth-child":
        case "nth-last-child":
        case "nth-of-type":
        case "nth-last-of-type":
            var ActionClass = adapt.csscasc.nthSelectorActionClasses[name.toLowerCase()];
            if (params && params.length == 2) {
                this.chain.push(new ActionClass(/** @type {number} */ (params[0]), /** @type {number} */ (params[1])));
            } else {
                this.chain.push(new adapt.csscasc.CheckConditionAction("")); // always fails
            }
            break;
        case "first-child":
            this.chain.push(new adapt.csscasc.IsFirstAction());
            break;
        case "last-child":
            this.chain.push(new adapt.csscasc.IsNthLastSiblingAction(0, 1));
            break;
        case "first-of-type":
            this.chain.push(new adapt.csscasc.IsNthSiblingOfTypeAction(0, 1));
            break;
        case "last-of-type":
            this.chain.push(new adapt.csscasc.IsNthLastSiblingOfTypeAction(0, 1));
            break;
        case "only-child":
            this.chain.push(new adapt.csscasc.IsFirstAction());
            this.chain.push(new adapt.csscasc.IsNthLastSiblingAction(0, 1));
            break;
        case "only-of-type":
            this.chain.push(new adapt.csscasc.IsNthSiblingOfTypeAction(0, 1));
            this.chain.push(new adapt.csscasc.IsNthLastSiblingOfTypeAction(0, 1));
            break;
        case "empty":
            this.chain.push(new adapt.csscasc.IsEmptyAction());
            break;
        case "before":
        case "after":
        case "first-line":
        case "first-letter":
            this.pseudoelementSelector(name, params);
            return;
        default:
            vivliostyle.logging.logger.warn("unknown pseudo-class selector: " + name);
            this.chain.push(new adapt.csscasc.CheckConditionAction("")); // always fails
            break;
    }
    this.specificity += 0x100;
};

/**
 * @override
 */
adapt.csscasc.CascadeParserHandler.prototype.pseudoelementSelector = function(name, params) {
    switch (name) {
        case "before":
        case "after":
        case "first-line":
        case "first-letter":
        case "footnote-call":
        case "footnote-marker":
        case "inner":
            if (!this.pseudoelement) {
                this.pseudoelement = name;
            } else {
                vivliostyle.logging.logger.warn("Double pseudoelement ::" + this.pseudoelement + "::" + name);
                this.chain.push(new adapt.csscasc.CheckConditionAction("")); // always fails
            }
            break;
        case "first-n-lines":
            if (params && params.length == 1 && typeof params[0] == "number") {
                var n = Math.round(params[0]);
                if (n > 0 && n == params[0]) {
                    if (!this.pseudoelement) {
                        this.pseudoelement = "first-" + n + "-lines";
                    } else {
                        vivliostyle.logging.logger.warn("Double pseudoelement ::" + this.pseudoelement + "::" + name);
                        this.chain.push(new adapt.csscasc.CheckConditionAction("")); // always fails
                    }
                    break;
                }
            }
        default:
            vivliostyle.logging.logger.warn("Unrecognized pseudoelement: ::" + name);
            this.chain.push(new adapt.csscasc.CheckConditionAction("")); // always fails
            break;
    }
    this.specificity += 1;
};

/**
 * @override
 */
adapt.csscasc.CascadeParserHandler.prototype.idSelector = function(id) {
    this.specificity += 0x10000;
    this.chain.push(new adapt.csscasc.CheckIdAction(id));
};

/**
 * @override
 */
adapt.csscasc.CascadeParserHandler.prototype.attributeSelector = function(ns, name, op, value) {
    this.specificity += 0x100;
    name = name.toLowerCase();
    value = value || "";
    var action;
    switch (op) {
        case adapt.csstok.TokenType.EOF:
            action = new adapt.csscasc.CheckAttributePresentAction(ns, name);
            break;
        case adapt.csstok.TokenType.EQ:
            action = new adapt.csscasc.CheckAttributeEqAction(ns, name, value);
            break;
        case adapt.csstok.TokenType.TILDE_EQ:
            if (!value || value.match(/\s/)) {
                action = new adapt.csscasc.CheckConditionAction(""); // always fails
            } else {
                action = new adapt.csscasc.CheckAttributeRegExpAction(ns, name,
                    new RegExp("(^|\\s)" + adapt.base.escapeRegExp(value) + "($|\\s)"));
            }
            break;
        case adapt.csstok.TokenType.BAR_EQ:
            action = new adapt.csscasc.CheckAttributeRegExpAction(ns, name,
                new RegExp("^" + adapt.base.escapeRegExp(value) + "($|-)"));
            break;
        case adapt.csstok.TokenType.HAT_EQ:
            if (!value) {
                action = new adapt.csscasc.CheckConditionAction(""); // always fails
            } else {
                action = new adapt.csscasc.CheckAttributeRegExpAction(ns, name,
                    new RegExp("^" + adapt.base.escapeRegExp(value)));
            }
            break;
        case adapt.csstok.TokenType.DOLLAR_EQ:
            if (!value) {
                action = new adapt.csscasc.CheckConditionAction(""); // always fails
            } else {
                action = new adapt.csscasc.CheckAttributeRegExpAction(ns, name,
                    new RegExp(adapt.base.escapeRegExp(value) + "$"));
            }
            break;
        case adapt.csstok.TokenType.STAR_EQ:
            if (!value) {
                action = new adapt.csscasc.CheckConditionAction(""); // always fails
            } else {
                action = new adapt.csscasc.CheckAttributeRegExpAction(ns, name,
                    new RegExp(adapt.base.escapeRegExp(value)));
            }
            break;
        case adapt.csstok.TokenType.COL_COL:
            if (value == "supported") {
                action = new adapt.csscasc.CheckNamespaceSupportedAction(ns, name);
            } else {
                vivliostyle.logging.logger.warn("Unsupported :: attr selector op:", value);
                action = new adapt.csscasc.CheckConditionAction(""); // always fails
            }
            break;
        default:
            vivliostyle.logging.logger.warn("Unsupported attr selector:", op);
            action = new adapt.csscasc.CheckConditionAction(""); // always fails
    }
    this.chain.push(action);
};

/**
 * @private
 * @type {number}
 */
adapt.csscasc.conditionCount = 0;

/**
 * @override
 */
adapt.csscasc.CascadeParserHandler.prototype.descendantSelector = function() {
    var condition = "d" + (adapt.csscasc.conditionCount++);
    this.processChain(new adapt.csscasc.ConditionItemAction(
        new adapt.csscasc.DescendantConditionItem(condition)));
    this.chain = [new adapt.csscasc.CheckConditionAction(condition)];
};

/**
 * @override
 */
adapt.csscasc.CascadeParserHandler.prototype.childSelector = function() {
    var condition = "c" + (adapt.csscasc.conditionCount++);
    this.processChain(new adapt.csscasc.ConditionItemAction(
        new adapt.csscasc.ChildConditionItem(condition)));
    this.chain = [new adapt.csscasc.CheckConditionAction(condition)];
};

/**
 * @override
 */
adapt.csscasc.CascadeParserHandler.prototype.adjacentSiblingSelector = function() {
    var condition = "a" + (adapt.csscasc.conditionCount++);
    this.processChain(new adapt.csscasc.ConditionItemAction(
        new adapt.csscasc.AdjacentSiblingConditionItem(condition)));
    this.chain = [new adapt.csscasc.CheckConditionAction(condition)];
};

/**
 * @override
 */
adapt.csscasc.CascadeParserHandler.prototype.followingSiblingSelector = function() {
    var condition = "f" + (adapt.csscasc.conditionCount++);
    this.processChain(new adapt.csscasc.ConditionItemAction(
        new adapt.csscasc.FollowingSiblingConditionItem(condition)));
    this.chain = [new adapt.csscasc.CheckConditionAction(condition)];
};

/**
 * @override
 */
adapt.csscasc.CascadeParserHandler.prototype.nextSelector = function() {
    this.finishChain();
    this.pseudoelement = null;
    this.footnoteContent = false;
    this.specificity = 0;
    this.chain = [];
};

/**
 * @override
 */
adapt.csscasc.CascadeParserHandler.prototype.startSelectorRule = function() {
    if (this.isInsideSelectorRule("E_CSS_UNEXPECTED_SELECTOR")) {
        return;
    }
    this.state = adapt.csscasc.ParseState.SELECTOR;
    this.elementStyle = /** @type {adapt.csscasc.ElementStyle} */ ({});
    this.pseudoelement = null;
    this.specificity = 0;
    this.footnoteContent = false;
    this.chain = [];
};

/**
 * @override
 */
adapt.csscasc.CascadeParserHandler.prototype.error = function(message, token) {
    adapt.cssparse.SlaveParserHandler.prototype.error.call(this, message, token);
    if (this.state == adapt.csscasc.ParseState.SELECTOR) {
        this.state = adapt.csscasc.ParseState.TOP;
    }
};

/**
 * @override
 */
adapt.csscasc.CascadeParserHandler.prototype.startStylesheet = function(flavor) {
    adapt.cssparse.SlaveParserHandler.prototype.startStylesheet.call(this, flavor);
    this.state = adapt.csscasc.ParseState.TOP;
};

/**
 * @override
 */
adapt.csscasc.CascadeParserHandler.prototype.startRuleBody = function() {
    this.finishChain();
    adapt.cssparse.SlaveParserHandler.prototype.startRuleBody.call(this);
    if (this.state == adapt.csscasc.ParseState.SELECTOR) {
        this.state = adapt.csscasc.ParseState.TOP;
    }
};

/**
 * @override
 */
adapt.csscasc.CascadeParserHandler.prototype.endRule = function() {
    adapt.cssparse.SlaveParserHandler.prototype.endRule.call(this);
    this.insideSelectorRule = adapt.csscasc.ParseState.TOP;
};

/**
 * @return {void}
 */
adapt.csscasc.CascadeParserHandler.prototype.finishChain = function() {
    if (this.chain) {
        /** @type {number} */ var specificity = this.specificity + this.cascade.nextOrder();
        this.processChain(this.makeApplyRuleAction(specificity));
        this.chain = null;
        this.pseudoelement = null;
        this.footnoteContent = false;
        this.specificity = 0;
    }
};

/**
 * @protected
 * @param {number} specificity
 * @return {adapt.csscasc.ApplyRuleAction}
 */
adapt.csscasc.CascadeParserHandler.prototype.makeApplyRuleAction = function(specificity) {
    var regionId = this.regionId;
    if (this.footnoteContent) {
        if (regionId)
            regionId = "xxx-bogus-xxx";
        else
            regionId = "footnote";
    }
    return new adapt.csscasc.ApplyRuleAction(this.elementStyle, specificity,
        this.pseudoelement, regionId);
};

/**
 * @param {string} name
 * @param {adapt.css.Val} value
 */
adapt.csscasc.CascadeParserHandler.prototype.special = function(name, value) {
    var val;
    if (!this.condition)
        val = new adapt.csscasc.CascadeValue(value, 0);
    else
        val = new adapt.csscasc.ConditionalCascadeValue(value, 0, this.condition);
    var arr = adapt.csscasc.getMutableSpecial(this.elementStyle, name);
    arr.push(val);
};

/**
 * @override
 */
adapt.csscasc.CascadeParserHandler.prototype.property = function(name, value, important) {
    this.validatorSet.validatePropertyAndHandleShorthand(name, value, important, this);
};

/**
 * @override
 */
adapt.csscasc.CascadeParserHandler.prototype.invalidPropertyValue = function(name, value) {
    this.report("E_INVALID_PROPERTY_VALUE " + name + ": " + value.toString());
};

/**
 * @override
 */
adapt.csscasc.CascadeParserHandler.prototype.unknownProperty = function(name, value) {
    this.report("E_INVALID_PROPERTY " + name + ": " + value.toString());
};

/**
 * @override
 */
adapt.csscasc.CascadeParserHandler.prototype.simpleProperty = function(name, value, important) {
    if (name == "display" && (value === adapt.css.ident.oeb_page_head ||
        value === adapt.css.ident.oeb_page_foot)) {
        this.simpleProperty("flow-options", new adapt.css.SpaceList([
            adapt.css.ident.exclusive, adapt.css.ident._static]), important);
        this.simpleProperty("flow-into", value, important);
        value = adapt.css.ident.block;
    }

    var hooks = vivliostyle.plugin.getHooksForName("SIMPLE_PROPERTY");
    hooks.forEach(function(hook) {
        var original = {"name": name, "value": value, "important": important};
        var converted = hook(original);
        name = converted["name"];
        value = converted["value"];
        important = converted["important"];
    });

    var specificity = important ? this.getImportantSpecificity() : this.getBaseSpecificity();
    var cascval = this.condition
        ? new adapt.csscasc.ConditionalCascadeValue(value, specificity, this.condition)
        : new adapt.csscasc.CascadeValue(value, specificity);
    adapt.csscasc.setProp(this.elementStyle, name, cascval);
};

/**
 * @return {adapt.csscasc.Cascade}
 */
adapt.csscasc.CascadeParserHandler.prototype.finish = function() {
    return this.cascade;
};


/**
 * @override
 */
adapt.csscasc.CascadeParserHandler.prototype.startFuncWithSelector = function(funcName) {
    switch (funcName) {
        case "not":
            var notParserHandler = new adapt.csscasc.NotParameterParserHandler(this);
            notParserHandler.startSelectorRule();
            this.owner.pushHandler(notParserHandler);
            break;
        default:
            // TODO
            break;
    }
};

/**
 * @param {adapt.csscasc.CascadeParserHandler} parent
 * @constructor
 * @extends {adapt.csscasc.CascadeParserHandler}
 */
adapt.csscasc.NotParameterParserHandler = function(parent) {
    adapt.csscasc.CascadeParserHandler.call(this, parent.scope, parent.owner, parent.condition, parent, parent.regionId, parent.validatorSet, false);
    /** @const */ this.parent = parent;
    /** @const */ this.parentChain = parent.chain;
};
goog.inherits(adapt.csscasc.NotParameterParserHandler, adapt.csscasc.CascadeParserHandler);

/**
 * @override
 */
adapt.csscasc.NotParameterParserHandler.prototype.startFuncWithSelector = function(funcName) {
    if (funcName == "not")
        this.reportAndSkip("E_CSS_UNEXPECTED_NOT");
};

/**
 * @override
 */
adapt.csscasc.NotParameterParserHandler.prototype.startRuleBody = function() {
    this.reportAndSkip("E_CSS_UNEXPECTED_RULE_BODY");
};

/**
 * @override
 */
adapt.csscasc.NotParameterParserHandler.prototype.nextSelector = function() {
    this.reportAndSkip("E_CSS_UNEXPECTED_NEXT_SELECTOR");
};

/**
 * @override
 */
adapt.csscasc.NotParameterParserHandler.prototype.endFuncWithSelector = function() {
    if (this.chain && this.chain.length > 0) {
        this.parentChain.push(new adapt.csscasc.NegateActionsSet(this.chain));
    }
    this.parent.specificity += this.specificity;
    this.owner.popHandler();
};

/**
 * @override
 */
adapt.csscasc.NotParameterParserHandler.prototype.error = function(mnemonics, token) {
    adapt.csscasc.CascadeParserHandler.prototype.error.call(this, mnemonics, token);
    this.owner.popHandler();
};


/**
 * @override
 */


/**
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.cssparse.DispatchParserHandler} owner
 * @constructor
 * @extends {adapt.cssparse.SlaveParserHandler}
 */
adapt.csscasc.DefineParserHandler = function(scope, owner) {
    adapt.cssparse.SlaveParserHandler.call(this, scope, owner, false);
};
goog.inherits(adapt.csscasc.DefineParserHandler, adapt.cssparse.SlaveParserHandler);

/**
 * @override
 */
adapt.csscasc.DefineParserHandler.prototype.property = function(propName, value, important) {
    if (this.scope.values[propName]) {
        this.error("E_CSS_NAME_REDEFINED " + propName, this.getCurrentToken());
    } else {
        var unit = propName.match(/height|^(top|bottom)$/) ? "vh" : "vw";
        var dim = new adapt.expr.Numeric(this.scope, 100, unit);
        this.scope.defineName(propName, value.toExpr(this.scope, dim));
    }
};


/**
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.cssparse.DispatchParserHandler} owner
 * @param {adapt.expr.Val} condition
 * @param {adapt.csscasc.ElementStyle} elementStyle
 * @param {adapt.cssvalid.ValidatorSet} validatorSet
 * @constructor
 * @extends {adapt.cssparse.SlaveParserHandler}
 * @implements {adapt.cssvalid.PropertyReceiver}
 */
adapt.csscasc.PropSetParserHandler = function(scope, owner, condition, elementStyle, validatorSet) {
    adapt.cssparse.SlaveParserHandler.call(this, scope, owner, false);
    /** @const */ this.elementStyle = elementStyle;
    /** @const */ this.condition = condition;
    /** @const */ this.validatorSet = validatorSet;
};
goog.inherits(adapt.csscasc.PropSetParserHandler, adapt.cssparse.SlaveParserHandler);

/**
 * @override
 */
adapt.csscasc.PropSetParserHandler.prototype.property = function(name, value, important) {
    if (important)
        vivliostyle.logging.logger.warn("E_IMPORTANT_NOT_ALLOWED");
    else
        this.validatorSet.validatePropertyAndHandleShorthand(name, value, important, this);
};

/**
 * @override
 */
adapt.csscasc.PropSetParserHandler.prototype.invalidPropertyValue = function(name, value) {
    vivliostyle.logging.logger.warn("E_INVALID_PROPERTY_VALUE", name + ":", value.toString());
};

/**
 * @override
 */
adapt.csscasc.PropSetParserHandler.prototype.unknownProperty = function(name, value) {
    vivliostyle.logging.logger.warn("E_INVALID_PROPERTY", name + ":", value.toString());
};

/**
 * @override
 */
adapt.csscasc.PropSetParserHandler.prototype.simpleProperty = function(name, value, important) {
    var specificity = important ? this.getImportantSpecificity() : this.getBaseSpecificity();
    specificity += this.order;
    this.order += adapt.csscasc.ORDER_INCREMENT;
    var av = this.condition
        ? new adapt.csscasc.ConditionalCascadeValue(value, specificity, this.condition)
        : new adapt.csscasc.CascadeValue(value, specificity);
    adapt.csscasc.setProp(this.elementStyle, name, av);
};


/**
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.cssvalid.ValidatorSet} validatorSet
 * @constructor
 * @extends {adapt.cssparse.ErrorHandler}
 * @implements {adapt.cssvalid.PropertyReceiver}
 */
adapt.csscasc.PropertyParserHandler = function(scope, validatorSet) {
    adapt.cssparse.ErrorHandler.call(this, scope);
    /** @const */ this.elementStyle = /** @type {adapt.csscasc.ElementStyle} */ ({});
    /** @const */ this.validatorSet = validatorSet;
    /** @type {number} */ this.order = 0;
};
goog.inherits(adapt.csscasc.PropertyParserHandler, adapt.cssparse.ErrorHandler);

/**
 * @override
 */
adapt.csscasc.PropertyParserHandler.prototype.property = function(name, value, important) {
    this.validatorSet.validatePropertyAndHandleShorthand(name, value, important, this);
};

/**
 * @override
 */
adapt.csscasc.PropertyParserHandler.prototype.invalidPropertyValue = function(name, value) {
    vivliostyle.logging.logger.warn("E_INVALID_PROPERTY_VALUE", name + ":", value.toString());
};

/**
 * @override
 */
adapt.csscasc.PropertyParserHandler.prototype.unknownProperty = function(name, value) {
    vivliostyle.logging.logger.warn("E_INVALID_PROPERTY", name + ":", value.toString());
};

/**
 * @override
 */
adapt.csscasc.PropertyParserHandler.prototype.simpleProperty = function(name, value, important) {
    var specificity = important ? adapt.cssparse.SPECIFICITY_STYLE_IMPORTANT : adapt.cssparse.SPECIFICITY_STYLE;
    specificity += this.order;
    this.order += adapt.csscasc.ORDER_INCREMENT;
    var cascval = new adapt.csscasc.CascadeValue(value, specificity);
    adapt.csscasc.setProp(this.elementStyle, name, cascval);
};


/**
 * @param {adapt.expr.LexicalScope} scope
 * @param {adapt.cssvalid.ValidatorSet} validatorSet
 * @param {string} baseURL
 * @param {string} styleAttrValue
 * @return {adapt.csscasc.ElementStyle}
 */
adapt.csscasc.parseStyleAttribute = function(scope, validatorSet, baseURL, styleAttrValue) {
    var handler = new adapt.csscasc.PropertyParserHandler(scope, validatorSet);
    var tokenizer = new adapt.csstok.Tokenizer(styleAttrValue, handler);
    try {
        adapt.cssparse.parseStyleAttribute(tokenizer, handler, baseURL);
    } catch (err) {
        vivliostyle.logging.logger.warn(err, "Style attribute parse error:");
    }
    return handler.elementStyle;
};

/**
 * @param {Object.<string,adapt.csscasc.CascadeValue>} cascaded
 * @param {adapt.expr.Context} context
 * @param {boolean} vertical
 * @return {boolean}
 */
adapt.csscasc.isVertical = function(cascaded, context, vertical) {
    var writingModeCasc = cascaded["writing-mode"];
    if (writingModeCasc) {
        var writingMode = writingModeCasc.evaluate(context, "writing-mode");
        if (writingMode && writingMode !== adapt.css.ident.inherit) {
            return writingMode === adapt.css.ident.vertical_rl;
        }
    }
    return vertical;
};

/**
 * @param {adapt.csscasc.ElementStyle} style
 * @param {adapt.expr.Context} context
 * @param {Array.<string>} regionIds
 * @param {boolean} isFootnote
 * @return {!Object.<string,adapt.csscasc.CascadeValue>}
 */
adapt.csscasc.flattenCascadedStyle = function(style, context, regionIds, isFootnote) {
    var cascMap = /** @type {!Object.<string,adapt.csscasc.CascadeValue>} */ ({});
    for (var n in style) {
        if (adapt.csscasc.isPropName(n))
            cascMap[n] = adapt.csscasc.getProp(style, n);
    }
    var regions = adapt.csscasc.getStyleMap(style, "_regions");
    if ((regionIds || isFootnote) && regions) {
        if (isFootnote) {
            var footnoteRegion = ["footnote"];
            if (!regionIds)
                regionIds = footnoteRegion;
            else
                regionIds = regionIds.concat(footnoteRegion);
        }
        for (var i = 0; i < regionIds.length; i++) {
            var regionId = regionIds[i];
            var regionStyle = regions[regionId];
            for (var rn in regionStyle) {
                if (adapt.csscasc.isPropName(rn)) {
                    var newVal = adapt.csscasc.getProp(regionStyle, rn);
                    var oldVal = cascMap[rn];
                    cascMap[rn] = adapt.csscasc.cascadeValues(context, oldVal,
                        /** @type {!adapt.csscasc.CascadeValue} */ (newVal));
                }
            }
        }
    }
    return cascMap;
};

/**
 * Convert logical properties to physical ones, taking specificity into account.
 * @param {!Object.<string, adapt.csscasc.CascadeValue>} src Source properties map
 * @param {!Object.<string, T>} dest Destination map
 * @param {boolean} vertical
 * @param {function(string, !adapt.csscasc.CascadeValue): T} transform If supplied, property values are transformed by this function before inserted into the destination map. The first parameter is the property name and the second one is the property value.
 * @template T
 */
adapt.csscasc.convertToPhysical = function(src, dest, vertical, transform) {
    var couplingMap = vertical ? adapt.csscasc.couplingMapVert : adapt.csscasc.couplingMapHor;
    for (var propName in src) {
        if (src.hasOwnProperty(propName)) {
            var cascVal = src[propName];
            if (!cascVal) continue;
            var coupledName = couplingMap[propName];
            var targetName;
            if (coupledName) {
                var coupledCascVal = src[coupledName];
                if (coupledCascVal && coupledCascVal.priority > cascVal.priority) {
                    continue;
                }
                targetName = adapt.csscasc.geomNames[coupledName] ? coupledName : propName;
            } else {
                targetName = propName;
            }
            dest[targetName] = transform(propName, cascVal);
        }
    }
};
