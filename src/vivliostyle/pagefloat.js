/**
 * Copyright 2015 Vivliostyle Inc.
 * @fileoverview CSS Page Floats
 */
goog.provide("vivliostyle.pagefloat");

goog.require("goog.asserts");
goog.require("vivliostyle.logging");
goog.require("adapt.base");
goog.require("adapt.task");
goog.require("adapt.geom");
goog.require("adapt.vtree");
goog.require("vivliostyle.logical");

goog.scope(function() {

    /**
     * @enum {string}
     */
    vivliostyle.pagefloat.FloatReference = {
        INLINE: "inline",
        COLUMN: "column",
        REGION: "region",
        PAGE: "page"
    };
    /** @const */ var FloatReference = vivliostyle.pagefloat.FloatReference;

    /**
     * @param {string} str
     * @returns {!vivliostyle.pagefloat.FloatReference}
     */
    FloatReference.of = function(str) {
        switch (str) {
            case "inline":
                return FloatReference.INLINE;
            case "column":
                return FloatReference.COLUMN;
            case "region":
                return FloatReference.REGION;
            case "page":
                return FloatReference.PAGE;
            default:
                throw new Error("Unknown float-reference: " + str);
        }
    };

    /**
     * @param {!vivliostyle.pagefloat.FloatReference} floatReference
     * @returns {boolean}
     */
    vivliostyle.pagefloat.isPageFloat = function(floatReference) {
        switch (floatReference) {
            case FloatReference.INLINE:
                return false;
            case FloatReference.COLUMN:
            case FloatReference.REGION:
            case FloatReference.PAGE:
                return true;
            default:
                throw new Error("Unknown float-reference: " + floatReference);
        }
    };

    /**
     * Interpret a float value with the writing-mode and direction assuming the float-reference is inline and returns "left" or "right".
     * @param {string} floatSide
     * @param {boolean} vertical
     * @param {string} direction
     * @returns {string}
     */
    vivliostyle.pagefloat.resolveInlineFloatDirection = function(floatSide, vertical, direction) {
        var writingMode = vertical ? "vertical-rl" : "horizontal-tb";
        if (floatSide === "top" || floatSide === "bottom") {
            floatSide = vivliostyle.logical.toLogical(floatSide, writingMode, direction);
        }
        if (floatSide === "block-start") {
            floatSide = "inline-start";
        }
        if (floatSide === "block-end") {
            floatSide = "inline-end";
        }
        if (floatSide === "inline-start" || floatSide === "inline-end") {
            var physicalValue = vivliostyle.logical.toPhysical(floatSide, writingMode, direction);
            var lineRelativeValue = vivliostyle.logical.toLineRelative(physicalValue, writingMode);
            if (lineRelativeValue === "line-left") {
                floatSide = "left";
            } else if (lineRelativeValue === "line-right") {
                floatSide = "right";
            }
        }
        if (floatSide !== "left" && floatSide !== "right") {
            vivliostyle.logging.logger.warn("Invalid float value: " + floatSide + ". Fallback to left.");
            floatSide = "left";
        }
        return floatSide;
    };

    /**
     * @param {!Node} sourceNode
     * @param {!vivliostyle.pagefloat.FloatReference} floatReference
     * @param {string} floatSide
     * @param {!adapt.geom.Insets} margin
     * @constructor
     */
    vivliostyle.pagefloat.PageFloat = function(sourceNode, floatReference, floatSide, margin) {
        /** @const */ this.sourceNode = sourceNode;
        /** @const */ this.floatReference = floatReference;
        /** @const */ this.floatSide = floatSide;
        /** @const */ this.margin = margin;
        /** @private @type {?number} */ this.order = null;
        /** @private @type {?vivliostyle.pagefloat.PageFloat.ID} */ this.id = null;
    };
    /** @const */ var PageFloat = vivliostyle.pagefloat.PageFloat;

    /**
     * @typedef {string}
     */
    PageFloat.ID;

    /**
     * @returns {number}
     */
    PageFloat.prototype.getOrder = function() {
        if (this.order === null) {
            throw new Error("The page float is not yet added");
        }
        return this.order;
    };

    /**
     * @returns {vivliostyle.pagefloat.PageFloat.ID}
     */
    PageFloat.prototype.getId = function() {
        if (!this.id) {
            throw new Error("The page float is not yet added");
        }
        return this.id;
    };

    /**
     * @private
     * @constructor
     */
    vivliostyle.pagefloat.PageFloatStore = function() {
        /** @private @const {!Array<!vivliostyle.pagefloat.PageFloat>} */ this.floats = [];
        /** @private @type {number} */ this.nextPageFloatIndex = 0;
    };
    /** @const */ var PageFloatStore = vivliostyle.pagefloat.PageFloatStore;

    /**
     * @private
     * @returns {number}
     */
    PageFloatStore.prototype.nextOrder = function() {
        return this.nextPageFloatIndex++;
    };

    /**
     * @private
     * @param {number} order
     * @returns {vivliostyle.pagefloat.PageFloat.ID}
     */
    PageFloatStore.prototype.createPageFloatId = function(order) {
        return "pf" + order;
    };

    /**
     * @param {!vivliostyle.pagefloat.PageFloat} float
     */
    PageFloatStore.prototype.addPageFloat = function(float) {
        var index = this.floats.findIndex(function(f) {
            return f.sourceNode === float.sourceNode;
        });
        if (index >= 0) {
            throw new Error("A page float with the same source node is already registered");
        } else {
            var order = float.order = this.nextOrder();
            float.id = this.createPageFloatId(order);
            this.floats.push(float);
        }
    };

    /**
     * @param {!Node} sourceNode
     * @returns {?vivliostyle.pagefloat.PageFloat}
     */
    PageFloatStore.prototype.findPageFloatBySourceNode = function(sourceNode) {
        var index = this.floats.findIndex(function(f) {
            return f.sourceNode === sourceNode;
        });
        return index >= 0 ? this.floats[index] : null;
    };

    /**
     * @param {vivliostyle.pagefloat.PageFloat.ID} id
     */
    PageFloatStore.prototype.findPageFloatById = function(id) {
        var index = this.floats.findIndex(function(f) {
            return f.id === id;
        });
        return index >= 0 ? this.floats[index] : null;
    };

    /**
     * @param {!vivliostyle.pagefloat.PageFloat} float
     * @param {!adapt.vtree.Container} area
     * @constructor
     */
    vivliostyle.pagefloat.PageFloatFragment = function(float, area) {
        /** @const */ this.pageFloatId = float.getId();
        /** @const */ this.area = area;
    };
    /** @const */ var PageFloatFragment = vivliostyle.pagefloat.PageFloatFragment;

    /**
     * @returns {adapt.geom.Shape}
     */
    PageFloatFragment.prototype.getOuterShape = function() {
        return this.area.getOuterShape(null, null);
    };

    /**
     * @returns {!adapt.geom.Rect}
     */
    PageFloatFragment.prototype.getOuterRect = function() {
        return this.area.getOuterRect();
    };

    /**
     * @param {!vivliostyle.pagefloat.PageFloat} float
     * @param {!adapt.vtree.NodePosition} nodePosition
     * @param {string} flowName
     * @constructor
     */
    vivliostyle.pagefloat.PageFloatContinuation = function(float, nodePosition, flowName) {
        /** @const */ this.float = float;
        /** @const */ this.nodePosition = nodePosition;
        /** @const */ this.flowName = flowName;
    };
    /** @const */ var PageFloatContinuation = vivliostyle.pagefloat.PageFloatContinuation;

    /**
     * @param {vivliostyle.pagefloat.PageFloatLayoutContext} parent
     * @param {?vivliostyle.pagefloat.FloatReference} floatReference
     * @param {adapt.vtree.Container} container
     * @param {?string} flowName
     * @param {?adapt.css.Val} writingMode
     * @param {?adapt.css.Val} direction
     * @constructor
     */
    vivliostyle.pagefloat.PageFloatLayoutContext = function(parent, floatReference, container, flowName,
                                                            writingMode, direction) {
        /** @const */ this.parent = parent;
        if (parent) {
            parent.children.push(this);
        }
        /** @private @const {!Array<!vivliostyle.pagefloat.PageFloatLayoutContext>} */ this.children = [];
        /** @private @const */ this.floatReference = floatReference;
        /** @private */ this.container = container;
        /** @const */ this.flowName = flowName;
        /** @const {!adapt.css.Val} */ this.writingMode =
            writingMode || (parent && parent.writingMode) || adapt.css.ident.horizontal_tb;
        /** @const {!adapt.css.Val} */ this.direction =
            direction || (parent && parent.direction) || adapt.css.ident.ltr;
        /** @private @type {boolean} */ this.invalidated = false;
        /** @private @const */ this.floatStore = parent ? parent.floatStore : new PageFloatStore();
        /** @private @const {!Array<vivliostyle.pagefloat.PageFloat.ID>} */ this.forbiddenFloats = [];
        /** @private @const {!Array<!vivliostyle.pagefloat.PageFloatFragment>} */ this.floatFragments = [];
        /** @private @const {!Object<vivliostyle.pagefloat.PageFloat.ID, Node>} */ this.floatAnchors = {};
        /** @private @const {!Array<!vivliostyle.pagefloat.PageFloatContinuation>} */ this.floatsDeferredToNext = [];
        var previousSibling = this.getPreviousSibling();
        /** @private @const {!Array<!vivliostyle.pagefloat.PageFloatContinuation>} */
        this.floatsDeferredFromPrevious = previousSibling ? [].concat(previousSibling.floatsDeferredToNext) : [];
        /** @private @type {?number} */ this.blockStartLimit = null;
        /** @private @type {?number} */ this.blockEndLimit = null;
        /** @private @type {?number} */ this.inlineStartLimit = null;
        /** @private @type {?number} */ this.inlineEndLimit = null;
    };
    /** @const */ var PageFloatLayoutContext = vivliostyle.pagefloat.PageFloatLayoutContext;

    /**
     * @private
     * @param {!vivliostyle.pagefloat.FloatReference} floatReference
     * @returns {!vivliostyle.pagefloat.PageFloatLayoutContext}
     */
    PageFloatLayoutContext.prototype.getParent = function(floatReference) {
        if (!this.parent) {
            throw new Error("No PageFloatLayoutContext for " + floatReference);
        }
        return this.parent;
    };

    /**
     * @private
     * @param {?vivliostyle.pagefloat.PageFloatLayoutContext} child
     * @param {?vivliostyle.pagefloat.FloatReference} floatReference
     * @returns {?vivliostyle.pagefloat.PageFloatLayoutContext}
     */
    PageFloatLayoutContext.prototype.getPreviousSiblingOf = function(child, floatReference) {
        var index = this.children.indexOf(/** @type {!vivliostyle.pagefloat.PageFloatLayoutContext} */ (child));
        if (index < 0) {
            index = this.children.length;
        }
        for (var i = index - 1; i >= 0; i--) {
            var result = this.children[i];
            if (result.floatReference === floatReference) {
                return result;
            } else {
                result = result.getPreviousSiblingOf(null, floatReference);
                if (result) {
                    return result;
                }
            }
        }
        return null;
    };

    /**
     * @private
     * @returns {?vivliostyle.pagefloat.PageFloatLayoutContext}
     */
    PageFloatLayoutContext.prototype.getPreviousSibling = function() {
        var child = this;
        var parent = this.parent;
        var result;
        while (parent) {
            result = parent.getPreviousSiblingOf(child, this.floatReference);
            if (result) return result;
            child = parent;
            parent = parent.parent;
        }
        return null;
    };

    /**
     * @param {vivliostyle.pagefloat.FloatReference=} floatReference
     * @returns {adapt.vtree.Container}
     */
    PageFloatLayoutContext.prototype.getContainer = function(floatReference) {
        if (!floatReference || floatReference === this.floatReference) {
            return this.container;
        }
        return this.getParent(floatReference).getContainer(floatReference);
    };

    /**
     * @param {!adapt.vtree.Container} container
     */
    PageFloatLayoutContext.prototype.setContainer = function(container) {
        this.container = container;
        this.reattachFloatFragments();
    };

    /**
     * @param {!vivliostyle.pagefloat.PageFloat} float
     */
    PageFloatLayoutContext.prototype.addPageFloat = function(float) {
        this.floatStore.addPageFloat(float);
    };

    /**
     * @param {!vivliostyle.pagefloat.FloatReference} floatReference
     * @returns {!vivliostyle.pagefloat.PageFloatLayoutContext}
     */
    PageFloatLayoutContext.prototype.getPageFloatLayoutContext = function(floatReference) {
        if (floatReference === this.floatReference) {
            return this;
        }
        return this.getParent(floatReference).getPageFloatLayoutContext(floatReference);
    };

    /**
     * @param {!Node} sourceNode
     * @returns {?vivliostyle.pagefloat.PageFloat}
     */
    PageFloatLayoutContext.prototype.findPageFloatBySourceNode = function(sourceNode) {
        return this.floatStore.findPageFloatBySourceNode(sourceNode);
    };

    /**
     * @private
     * @param {!vivliostyle.pagefloat.PageFloat} float
     */
    PageFloatLayoutContext.prototype.forbid = function(float) {
        var id = float.getId();
        var floatReference = float.floatReference;
        if (floatReference === this.floatReference) {
            if (this.forbiddenFloats.indexOf(id) < 0) {
                this.forbiddenFloats.push(id);
            }
        } else {
            var parent = this.getParent(floatReference);
            parent.forbid(float);
        }
    };

    /**
     * @param {!vivliostyle.pagefloat.PageFloat} float
     * @returns {boolean}
     */
    PageFloatLayoutContext.prototype.isForbidden = function(float) {
        var id = float.getId();
        var floatReference = float.floatReference;
        if (floatReference === this.floatReference) {
            return this.forbiddenFloats.indexOf(id) >= 0;
        } else {
            var parent = this.getParent(floatReference);
            return parent.isForbidden(float);
        }
    };

    /**
     * @param {!vivliostyle.pagefloat.PageFloatFragment} floatFragment
     */
    PageFloatLayoutContext.prototype.addPageFloatFragment = function(floatFragment) {
        var id = floatFragment.pageFloatId;
        var float = this.floatStore.findPageFloatById(id);
        goog.asserts.assert(float);
        var floatReference = float.floatReference;
        if (floatReference !== this.floatReference) {
            var parent = this.getParent(floatReference);
            parent.addPageFloatFragment(floatFragment);
        } else if (this.floatFragments.indexOf(floatFragment) < 0) {
            this.floatFragments.push(floatFragment);
            this.updateLimitValues();
        }
        this.invalidate();
    };

    /**
     * @private
     * @param {!vivliostyle.pagefloat.PageFloatFragment} floatFragment
     */
    PageFloatLayoutContext.prototype.removePageFloatFragment = function(floatFragment) {
        var index = this.floatFragments.indexOf(floatFragment);
        if (index >= 0) {
            var fragment = (this.floatFragments.splice(index, 1))[0];
            var element = fragment.area && fragment.area.element;
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
            this.updateLimitValues();
            this.invalidate();
        }
    };

    /**
     * @param {!vivliostyle.pagefloat.PageFloat} float
     * @returns {?vivliostyle.pagefloat.PageFloatFragment}
     */
    PageFloatLayoutContext.prototype.findPageFloatFragment = function(float) {
        if (float.floatReference !== this.floatReference) {
            var parent = this.getParent(float.floatReference);
            return parent.findPageFloatFragment(float);
        }
        var id = float.getId();
        var index = this.floatFragments.findIndex(function(f) {
            return f.pageFloatId === id;
        });
        if (index >= 0) {
            return this.floatFragments[index];
        } else {
            return null;
        }
    };

    /**
     * @returns {boolean}
     */
    PageFloatLayoutContext.prototype.hasFloatFragments = function() {
        if (this.floatFragments.length > 0) {
            return true;
        } else if (this.parent) {
            return this.parent.hasFloatFragments();
        } else {
            return false;
        }
    };

    /**
     * @param {!vivliostyle.pagefloat.PageFloat} float
     * @param {Node} anchorViewNode
     */
    PageFloatLayoutContext.prototype.registerPageFloatAnchor = function(float, anchorViewNode) {
        if (float.floatReference === this.floatReference) {
            this.floatAnchors[float.getId()] = anchorViewNode;
        } else {
            var parent = this.getParent(float.floatReference);
            parent.registerPageFloatAnchor(float, anchorViewNode);
        }
    };

    /**
     * @private
     * @param {vivliostyle.pagefloat.PageFloat.ID} floatId
     */
    PageFloatLayoutContext.prototype.isAnchorAlreadyAppeared = function(floatId) {
        var deferredFloats = this.getDeferredPageFloatContinuations();
        if (deferredFloats.some(function(cont) { return cont.float.getId() === floatId; })) {
            return true;
        }
        var anchorViewNode = this.floatAnchors[floatId];
        if (!anchorViewNode) return false;
        if (this.container && this.container.element) {
            return this.container.element.contains(anchorViewNode);
        }
        return false;
    };

    /**
     * @param {!vivliostyle.pagefloat.PageFloat} float
     * @param {!adapt.vtree.NodePosition} nodePosition
     * @param {?string=} flowName
     */
    PageFloatLayoutContext.prototype.deferPageFloat = function(float, nodePosition, flowName) {
        flowName = flowName || this.flowName;
        goog.asserts.assert(flowName);
        if (float.floatReference === this.floatReference) {
            var continuation = new PageFloatContinuation(float, nodePosition, flowName);
            var index = this.floatsDeferredToNext.findIndex(function(c) { return c.float === float; });
            if (index >= 0) {
                this.floatsDeferredToNext.splice(index, 1, continuation);
            } else {
                this.floatsDeferredToNext.push(continuation);
            }
        } else {
            var parent = this.getParent(float.floatReference);
            parent.deferPageFloat(float, nodePosition, flowName);
        }
    };

    /**
     * @returns {boolean}
     */
    PageFloatLayoutContext.prototype.hasPrecedingFloatsDeferredToNext = function(float) {
        var order = float.getOrder();
        var hasPrecedingFloatsDeferredToNext = this.floatsDeferredToNext.some(function(c) {
            return c.float.getOrder() < order;
        });
        if (hasPrecedingFloatsDeferredToNext) {
            return true;
        } else if (this.parent) {
            return this.parent.hasPrecedingFloatsDeferredToNext(float);
        } else {
            return false;
        }
    };

    /**
     * @param {?string=} flowName
     * @returns {!Array<!vivliostyle.pagefloat.PageFloatContinuation>}
     */
    PageFloatLayoutContext.prototype.getDeferredPageFloatContinuations = function(flowName) {
        flowName = flowName || this.flowName;
        var result = this.floatsDeferredFromPrevious.filter(function(cont) {
            return !flowName || cont.flowName === flowName;
        });
        if (this.parent) {
            result = this.parent.getDeferredPageFloatContinuations(flowName).concat(result);
        }
        return result.sort(function(c1, c2) {
            return c1.float.getOrder() - c2.float.getOrder();
        });
    };

    /**
     * @param {?string=} flowName
     * @returns {!Array<!vivliostyle.pagefloat.PageFloatContinuation>}
     */
    PageFloatLayoutContext.prototype.getPageFloatContinuationsDeferredToNext = function(flowName) {
        flowName = flowName || this.flowName;
        var result = this.floatsDeferredToNext.filter(function(cont) {
            return !flowName || cont.flowName === flowName;
        });
        if (this.parent) {
            return this.parent.getPageFloatContinuationsDeferredToNext(flowName).concat(result);
        } else {
            return result;
        }
    };

    PageFloatLayoutContext.prototype.finish = function() {
        for (var i = this.floatFragments.length - 1; i >= 0; i--) {
            var fragment = this.floatFragments[i];
            if (!this.isAnchorAlreadyAppeared(fragment.pageFloatId)) {
                this.removePageFloatFragment(fragment);
                var float = this.floatStore.findPageFloatById(fragment.pageFloatId);
                this.forbid(float);
                return;
            }
        }
        for (var i = this.floatsDeferredToNext.length - 1; i >= 0; i--) {
            var continuation = this.floatsDeferredToNext[i];
            if (!this.isAnchorAlreadyAppeared(continuation.float.getId())) {
                this.floatsDeferredToNext.splice(i, 1);
            }
        }
        this.floatsDeferredFromPrevious.forEach(function(continuation) {
            if (this.floatsDeferredToNext.indexOf(continuation) >= 0)
                return;
            var pageFloatId = continuation.float.getId();
            if (this.floatFragments.some(function(f) { return f.pageFloatId === pageFloatId; }))
                return;
            this.floatsDeferredToNext.push(continuation);
        }, this);
    };

    PageFloatLayoutContext.prototype.invalidate = function() {
        this.children.splice(0);
        Object.keys(this.floatAnchors).forEach(function(k) {
            delete this.floatAnchors[k];
        }, this);
        if (this.container) {
            this.container.clear();
        }
        this.invalidated = true;
    };

    PageFloatLayoutContext.prototype.isInvalidated = function() {
        return this.invalidated ||
            (!!this.parent && this.parent.isInvalidated());
    };

    PageFloatLayoutContext.prototype.validate = function() {
        this.invalidated = false;
    };

    /**
     * @private
     * @param {string} side
     * @returns {number}
     */
    PageFloatLayoutContext.prototype.getLimitValue = function(side) {
        goog.asserts.assert(this.container);
        var writingMode = this.writingMode.toString();
        var direction = this.direction.toString();
        var logicalSide = vivliostyle.logical.toLogical(side, writingMode, direction);
        var physicalSide = vivliostyle.logical.toPhysical(side, writingMode, direction);
        var limit = function() {
            switch (logicalSide) {
                case "block-start":
                    return this.blockStartLimit;
                case "block-end":
                    return this.blockEndLimit;
                case "inline-start":
                    return this.inlineStartLimit;
                case "inline-end":
                    return this.inlineEndLimit;
                default:
                    throw new Error("Unknown logical side: " + logicalSide);
            }
        }.call(this);
        if (limit === null) {
            limit = (function(container) {
                var rect = container.getOuterRect();
                switch (physicalSide) {
                    case "top":
                        return rect.y1;
                    case "bottom":
                        return rect.y2;
                    case "left":
                        return rect.x1;
                    case "right":
                        return rect.x2;
                    default:
                        throw new Error("Unknown physical side: " + physicalSide);
                }
            })(this.container);
        }
        goog.asserts.assert(limit !== null && limit >= 0);
        if (this.parent && this.parent.container) {
            var parentLimit = this.parent.getLimitValue(physicalSide);
            switch (physicalSide) {
                case "top":
                    return Math.max(limit, parentLimit);
                case "left":
                    return Math.max(limit, parentLimit);
                case "bottom":
                    return Math.min(limit, parentLimit);
                case "right":
                    return Math.min(limit, parentLimit);
                default:
                    goog.asserts.assert("Should be unreachable");
            }
        }
        return limit;
    };

    /**
     * @private
     */
    PageFloatLayoutContext.prototype.updateLimitValues = function() {
        if (!this.container) return;
        var self = this;
        var limits = {
            top: this.container.top,
            left: this.container.left,
            bottom: this.container.top + this.container.height,
            right: this.container.left + this.container.width
        };
        var offsetX = this.container.originX;
        var offsetY = this.container.originY;

        var fragments = this.floatFragments;
        if (fragments.length > 0) {
            var writingMode = this.writingMode.toString();
            var direction = this.direction.toString();
            limits = fragments.reduce(function(l, f) {
                var float = self.floatStore.findPageFloatById(f.pageFloatId);
                var logicalFloatSide = vivliostyle.logical.toLogical(float.floatSide,
                    writingMode, direction);
                var area = f.area;
                var top = l.top, left = l.left, bottom = l.bottom, right = l.right;
                switch (logicalFloatSide) {
                    case "inline-start":
                        if (area.vertical) {
                            top = Math.max(top, area.top + area.height);
                        } else {
                            left = Math.max(left, area.left + area.width);
                        }
                        // FALLTHROUGH
                    case "block-start":
                        if (area.vertical) {
                            right = Math.min(right, area.left);
                        } else {
                            top = Math.max(top, area.top + area.height);
                        }
                        break;
                    case "inline-end":
                        if (area.vertical) {
                            bottom = Math.min(bottom, area.top);
                        } else {
                            right = Math.min(right, area.left + area.width);
                        }
                        // FALLTHROUGH
                    case "block-end":
                        if (area.vertical) {
                            left = Math.max(left, area.left + area.width);
                        } else {
                            bottom = Math.min(bottom, area.top);
                        }
                        break;
                    default:
                        throw new Error("Unknown logical float side: " + logicalFloatSide);
                }
                return { top: top, left: left, bottom: bottom, right: right };
            }, limits);
        }
        if (this.container.vertical) {
            this.blockStartLimit = limits.right + offsetX;
            this.blockEndLimit = limits.left + offsetX;
            this.inlineStartLimit = limits.top + offsetY;
            this.inlineEndLimit = limits.bottom + offsetY;
        } else {
            this.blockStartLimit = limits.top + offsetY;
            this.blockEndLimit = limits.bottom + offsetY;
            this.inlineStartLimit = limits.left + offsetX;
            this.inlineEndLimit = limits.right + offsetX;
        }
    };

    /**
     * @param {!adapt.vtree.Container} area
     * @param {!vivliostyle.pagefloat.PageFloat} float
     * @param {boolean}  init
     * @return {boolean} Indicates if the float area fits inside the container or not
     */
    PageFloatLayoutContext.prototype.setFloatAreaDimensions = function(area, float, init) {
        if (float.floatReference !== this.floatReference) {
            var parent = this.getParent(float.floatReference);
            return parent.setFloatAreaDimensions(area, float, init);
        }

        var writingMode = this.writingMode.toString();
        var direction = this.direction.toString();
        var logicalFloatSide = vivliostyle.logical.toLogical(float.floatSide, writingMode, direction);
        var blockStart = this.getLimitValue("block-start");
        var blockEnd = this.getLimitValue("block-end");
        var inlineStart = this.getLimitValue("inline-start");
        var inlineEnd = this.getLimitValue("inline-end");

        var blockOffset = area.vertical ? area.originX : area.originY;
        var inlineOffset = area.vertical ? area.originY : area.originX;
        blockStart -= blockOffset;
        blockEnd -= blockOffset;
        inlineStart -= inlineOffset;
        inlineEnd -= inlineOffset;
        blockStart = Math.max(blockStart, area.top);
        blockEnd = Math.min(blockEnd, area.top + area.height);

        var blockSize, inlineSize;
        if (init) {
            var startExclusionSize = 0;
            for (var i = 0; i < area.bands.length; i++) {
                var band = area.bands[i];
                if (Math.abs(band.x2 - band.x1 - (area.vertical ? area.height : area.width)) < 0.01) {
                    break;
                } else {
                    startExclusionSize += band.y2 - band.y1;
                }
            }
            var nonExclusionSize = 0;
            for (; i < area.bands.length; i++) {
                var band = area.bands[i];
                if (Math.abs(band.x2 - band.x1 - (area.vertical ? area.height : area.width)) > 0.01) {
                    break;
                } else {
                    nonExclusionSize += band.y2 - band.y1;
                }
            }
            blockStart = Math.max(blockStart, area.top + startExclusionSize);
            if (i < area.bands.length) {
                blockEnd = Math.min(blockEnd, area.top + startExclusionSize + nonExclusionSize);
            }
            blockSize = (blockEnd - blockStart) * area.getBoxDir();
            inlineSize = inlineEnd - inlineStart;
            if (blockSize <= 0)
                return false;
        } else {
            blockSize = area.computedBlockSize;
            var availableBlockSize = (blockEnd - blockStart) * area.getBoxDir();
            if (availableBlockSize < blockSize)
                return false;
            blockSize = Math.min(blockSize + (area.vertical ? float.margin.right : float.margin.top),
                availableBlockSize);
            inlineSize = vivliostyle.sizing.getSize(area.clientLayout, area.element,
                [vivliostyle.sizing.Size.FIT_CONTENT_INLINE_SIZE])[vivliostyle.sizing.Size.FIT_CONTENT_INLINE_SIZE];
        }

        switch (logicalFloatSide) {
            case "inline-start":
                area.setInlinePosition(inlineStart, inlineSize);
                // FALLTHROUGH
            case "block-start":
                area.setBlockPosition(blockStart, blockSize);
                break;
            case "inline-end":
                area.setInlinePosition(inlineEnd - inlineSize, inlineSize);
                // FALLTHROUGH
            case "block-end":
                area.setBlockPosition(blockEnd - blockSize * area.getBoxDir(), blockSize);
                break;
            default:
                throw new Error("unknown float direction: " + float.floatSide);
        }

        return true;
    };

    /**
     * @returns {!Array<adapt.geom.Shape>}
     */
    PageFloatLayoutContext.prototype.getFloatFragmentExclusions = function() {
        var result = this.floatFragments.map(function(fragment) {
            return fragment.getOuterShape();
        });
        if (this.parent) {
            return this.parent.getFloatFragmentExclusions().concat(result);
        } else {
            return result;
        }
    };

    /**
     * @private
     */
    PageFloatLayoutContext.prototype.reattachFloatFragments = function() {
        var parent = this.container.element && this.container.element.parentNode;
        if (parent) {
            this.floatFragments.forEach(function(fragment) {
                parent.appendChild(fragment.area.element);
            });
        }
    };

    /**
     * @returns {number}
     */
    PageFloatLayoutContext.prototype.getMaxReachedAfterEdge = function() {
        var isVertical = this.getContainer().vertical;
        return this.floatFragments.reduce(function(edge, fragment) {
            var rect = fragment.getOuterRect();
            if (isVertical) {
                return Math.min(edge, rect.x1);
            } else {
                return Math.max(edge, rect.y2);
            }
        }, isVertical ? Infinity : 0);
    };
});
