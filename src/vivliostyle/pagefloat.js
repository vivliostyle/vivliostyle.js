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
     * @constructor
     */
    vivliostyle.pagefloat.PageFloat = function(sourceNode, floatReference, floatSide) {
        /** @const */ this.sourceNode = sourceNode;
        /** @const */ this.floatReference = floatReference;
        /** @const */ this.floatSide = floatSide;
        /** @private @type {?vivliostyle.pagefloat.PageFloat.ID} */ this.id = null;
    };
    /** @const */ var PageFloat = vivliostyle.pagefloat.PageFloat;

    /**
     * @typedef {string}
     */
    PageFloat.ID;

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
     * @returns {vivliostyle.pagefloat.PageFloat.ID}
     */
    PageFloatStore.prototype.createPageFloatId = function() {
        return "pf" + (this.nextPageFloatIndex++);
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
            float.id = this.createPageFloatId();
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
        /** @const */ this.writingMode = writingMode || (parent && parent.writingMode);
        /** @const */ this.direction = direction || (parent && parent.direction);
        /** @private @const */ this.floatStore = parent ? parent.floatStore : new PageFloatStore();
        /** @private @const {!Array<vivliostyle.pagefloat.PageFloat.ID>} */ this.forbiddenFloats = [];
        /** @private @const {!Array<!vivliostyle.pagefloat.PageFloatFragment>} */ this.floatFragments = [];
        /** @private @const {!Object<vivliostyle.pagefloat.PageFloat.ID, Node>} */ this.floatAnchors = {};
        /** @private @const {!Array<!vivliostyle.pagefloat.PageFloatContinuation>} */ this.floatsDeferredToNext = [];
        var previousSibling = this.getPreviousSibling();
        /** @private @const {!Array<!vivliostyle.pagefloat.PageFloatContinuation>} */
        this.floatsDeferredFromPrevious = previousSibling ? [].concat(previousSibling.floatsDeferredToNext) : [];
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
            this.floatsDeferredToNext.push(new PageFloatContinuation(float, nodePosition, flowName));
        } else {
            var parent = this.getParent(float.floatReference);
            parent.deferPageFloat(float, nodePosition, flowName);
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
            return this.parent.getDeferredPageFloatContinuations(flowName).concat(result);
        } else {
            return result;
        }
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
        this.floatsDeferredFromPrevious.forEach(function(continuation) {
            if (this.floatsDeferredToNext.indexOf(continuation) >= 0)
                return;
            var pageFloatId = continuation.float.getId();
            if (this.floatFragments.some(function(f) { return f.pageFloatId === pageFloatId; }))
                return;
            this.floatsDeferredToNext.push(continuation);
        }, this);
    };

    /**
     * @private
     */
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
     * @param {!adapt.vtree.Container} area
     * @param {!vivliostyle.pagefloat.PageFloat} float
     */
    PageFloatLayoutContext.prototype.setFloatAreaDimensions = function(area, float) {
        if (float.floatReference !== this.floatReference) {
            var parent = this.getParent(float.floatReference);
            parent.setFloatAreaDimensions(area, float);
            return;
        }

        var writingMode = this.writingMode.toString();
        var direction = this.direction.toString();
        var logicalFloatSide = vivliostyle.logical.toLogical(float.floatSide, writingMode, direction);
        var blockStart = area.vertical ? (area.left + area.width) : area.top;
        var blockEnd = area.vertical ? area.left : area.top + area.height;
        var inlineStart = area.vertical ? area.top : area.left;
        var inlineEnd = area.vertical ? area.top + area.height : area.left + area.width;
        var fitContentInlineSize = vivliostyle.sizing.getSize(area.clientLayout, area.element,
            [vivliostyle.sizing.Size.FIT_CONTENT_INLINE_SIZE])[vivliostyle.sizing.Size.FIT_CONTENT_INLINE_SIZE];
        switch (logicalFloatSide) {
            case "inline-start":
                area.setBlockPosition(blockStart, area.computedBlockSize);
                area.setInlinePosition(inlineStart, fitContentInlineSize);
                break;
            case "inline-end":
                area.setBlockPosition(blockStart, area.computedBlockSize);
                area.setInlinePosition(inlineEnd - fitContentInlineSize, fitContentInlineSize);
                break;
            case "block-start":
                area.setBlockPosition(blockStart, area.computedBlockSize);
                break;
            case "block-end":
                area.setBlockPosition(blockEnd - area.computedBlockSize * area.getBoxDir(), area.computedBlockSize);
                break;
            default:
                throw new Error("unknown float direction: " + float.floatSide);
        }
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
});
