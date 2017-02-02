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
     * @param {!adapt.vtree.NodePosition} nodePosition
     * @param {!adapt.vtree.Container} area
     * @constructor
     */
    vivliostyle.pagefloat.PageFloatFragment = function(float, nodePosition, area) {
        /** @const */ this.pageFloatId = float.getId();
        /** @const */ this.nodePosition = nodePosition;
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
     * @param {?vivliostyle.pagefloat.PageFloatContinuation} other
     * @returns {boolean}
     */
    PageFloatContinuation.prototype.equals = function(other) {
        if (!other) return false;
        if (this === other) return true;
        return this.float === other.float &&
                adapt.vtree.isSameNodePosition(this.nodePosition, other.nodePosition);
    };

    /**
     * @param {vivliostyle.pagefloat.PageFloatLayoutContext} parent
     * @param {?vivliostyle.pagefloat.FloatReference} floatReference
     * @param {adapt.vtree.Container} container
     * @param {?string} flowName
     * @param {?Node} generatingElement Source element generating the context. Specify when a column context is generated by a non-root element (foe example page floats)
     * @param {?adapt.css.Val} writingMode
     * @param {?adapt.css.Val} direction
     * @constructor
     */
    vivliostyle.pagefloat.PageFloatLayoutContext = function(parent, floatReference, container, flowName,
                                                            generatingElement, writingMode, direction) {
        /** @const */ this.parent = parent;
        if (parent) {
            parent.children.push(this);
        }
        /** @private @const {!Array<!vivliostyle.pagefloat.PageFloatLayoutContext>} */ this.children = [];
        /** @private @const */ this.floatReference = floatReference;
        /** @private */ this.container = container;
        /** @const */ this.flowName = flowName;
        /** @const */ this.generatingElement = generatingElement;
        /** @const {!adapt.css.Val} */ this.writingMode =
            writingMode || (parent && parent.writingMode) || adapt.css.ident.horizontal_tb;
        /** @const {!adapt.css.Val} */ this.direction =
            direction || (parent && parent.direction) || adapt.css.ident.ltr;
        /** @private @type {boolean} */ this.invalidated = false;
        /** @private @const */ this.floatStore = parent ? parent.floatStore : new PageFloatStore();
        /** @private @const {!Array<vivliostyle.pagefloat.PageFloat.ID>} */ this.forbiddenFloats = [];
        /** @private @const {!Array<!vivliostyle.pagefloat.PageFloatFragment>} */ this.floatFragments = [];
        /** @private @const {!Array<!vivliostyle.pagefloat.PageFloatFragment>} */ this.stashedFloatFragments = [];
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
     * @param {?string} flowName
     * @param {?Node} generatingElement
     * @returns {?vivliostyle.pagefloat.PageFloatLayoutContext}
     */
    PageFloatLayoutContext.prototype.getPreviousSiblingOf = function(child, floatReference,
                                                                     flowName, generatingElement) {
        var index = this.children.indexOf(/** @type {!vivliostyle.pagefloat.PageFloatLayoutContext} */ (child));
        if (index < 0) {
            index = this.children.length;
        }
        for (var i = index - 1; i >= 0; i--) {
            var result = this.children[i];
            if (result.floatReference === floatReference && result.flowName === flowName &&
                result.generatingElement === generatingElement) {
                return result;
            } else {
                result = result.getPreviousSiblingOf(null, floatReference, flowName, generatingElement);
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
            result = parent.getPreviousSiblingOf(child, this.floatReference, this.flowName,
                this.generatingElement);
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
     * @returns {!PageFloat}
     */
    PageFloatLayoutContext.prototype.getFloatOfFragment = function(floatFragment) {
        var id = floatFragment.pageFloatId;
        return this.floatStore.findPageFloatById(id);
    };

    /**
     * @param {!vivliostyle.pagefloat.PageFloatFragment} floatFragment
     * @param {boolean=} dontInvalidate
     */
    PageFloatLayoutContext.prototype.addPageFloatFragment = function(floatFragment, dontInvalidate) {
        var float = this.getFloatOfFragment(floatFragment);
        goog.asserts.assert(float);
        var floatReference = float.floatReference;
        if (floatReference !== this.floatReference) {
            var parent = this.getParent(floatReference);
            parent.addPageFloatFragment(floatFragment, dontInvalidate);
        } else if (this.floatFragments.indexOf(floatFragment) < 0) {
            this.floatFragments.push(floatFragment);
            this.floatFragments.sort(function(fr1, fr2) {
                var f1 = this.getFloatOfFragment(fr1);
                var f2 = this.getFloatOfFragment(fr2);
                return f1.getOrder() - f2.getOrder();
            }.bind(this));
        }
        if (!dontInvalidate)
            this.invalidate();
    };

    /**
     * @param {!vivliostyle.pagefloat.PageFloatFragment} floatFragment
     * @param {boolean=} dontInvalidate
     */
    PageFloatLayoutContext.prototype.removePageFloatFragment = function(floatFragment, dontInvalidate) {
        var float = this.getFloatOfFragment(floatFragment);
        goog.asserts.assert(float);
        var floatReference = float.floatReference;
        if (floatReference !== this.floatReference) {
            var parent = this.getParent(floatReference);
            parent.removePageFloatFragment(floatFragment, dontInvalidate);
        } else {
            var index = this.floatFragments.indexOf(floatFragment);
            if (index >= 0) {
                var fragment = (this.floatFragments.splice(index, 1))[0];
                var element = fragment.area && fragment.area.element;
                if (element && element.parentNode) {
                    element.parentNode.removeChild(element);
                }
                if (!dontInvalidate)
                    this.invalidate();
            }
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
    PageFloatLayoutContext.prototype.hasFloatsDeferredToNext = function() {
        if (this.floatsDeferredToNext.length > 0) {
            return true;
        } else if (this.parent) {
            return this.parent.hasFloatsDeferredToNext();
        } else {
            return false;
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
                var float = this.getFloatOfFragment(fragment);
                this.forbid(float);
                // If the removed float is a block-end/inline-end float,
                // we should re-layout preceding floats with the same float direction.
                this.removeEndFloatFragments(float);
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
            if (this.floatsDeferredToNext.findIndex(function(c) { return continuation.equals(c); }) >= 0)
                return;
            var pageFloatId = continuation.float.getId();
            if (this.floatFragments.some(function(f) { return f.pageFloatId === pageFloatId; }))
                return;
            this.floatsDeferredToNext.push(continuation);
        }, this);
    };

    PageFloatLayoutContext.prototype.invalidate = function() {
        if (this.container) {
            this.children.forEach(function(child) {
                // Since the same container element is shared by a region page float layout context and
                // a column page float layout context in a single column region,
                // view elements of float fragments of the child (column) context need to be removed here.
                if (child.container && child.container.element === this.container.element) {
                    child.floatFragments.forEach(function(fragment) {
                        var elem = fragment.area.element;
                        if (elem && elem.parentNode)
                            elem.parentNode.removeChild(elem);
                    });
                }
            }, this);
            this.container.clear();
        }
        this.children.splice(0);
        Object.keys(this.floatAnchors).forEach(function(k) {
            delete this.floatAnchors[k];
        }, this);
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
     * @returns {string}
     */
    PageFloatLayoutContext.prototype.toLogical = function(side) {
        var writingMode = this.writingMode.toString();
        var direction = this.direction.toString();
        return vivliostyle.logical.toLogical(side, writingMode, direction);
    };

    /**
     * @private
     * @param {string} side
     * @returns {string}
     */
    PageFloatLayoutContext.prototype.toPhysical = function(side) {
        var writingMode = this.writingMode.toString();
        var direction = this.direction.toString();
        return vivliostyle.logical.toPhysical(side, writingMode, direction);
    };

    /**
     * @param {!vivliostyle.pagefloat.PageFloat} float
     */
    PageFloatLayoutContext.prototype.removeEndFloatFragments = function(float) {
        var logicalFloatSide = this.toLogical(float.floatSide);
        if (logicalFloatSide === "block-end" || logicalFloatSide === "inline-end") {
            var i = 0;
            while (i < this.floatFragments.length) {
                var fragment = this.floatFragments[i];
                var logicalFloatSide2 = this.toLogical(this.getFloatOfFragment(fragment).floatSide);
                if (logicalFloatSide2 === logicalFloatSide) {
                    this.removePageFloatFragment(fragment);
                } else {
                    i++;
                }
            }
        }
    };

    /**
     * @param {!vivliostyle.pagefloat.PageFloat} float
     */
    PageFloatLayoutContext.prototype.stashEndFloats = function(float) {
        if (float.floatReference !== this.floatReference) {
            this.getParent(float.floatReference).stashEndFloats(float);
            return;
        }

        var logicalFloatSide = this.toLogical(float.floatSide);
        if (logicalFloatSide === "block-end" || logicalFloatSide === "inline-end") {
            var i = 0;
            while (i < this.floatFragments.length) {
                var fragment = this.floatFragments[i];
                var logicalFloatSide2 = this.toLogical(this.getFloatOfFragment(fragment).floatSide);
                if (logicalFloatSide2 === logicalFloatSide) {
                    this.stashedFloatFragments.push(fragment);
                    this.floatFragments.splice(i, 1);
                } else {
                    i++;
                }
            }
        }
    };

    /**
     * @param {!vivliostyle.pagefloat.FloatReference} floatReference
     */
    PageFloatLayoutContext.prototype.restoreStashedFragments = function(floatReference) {
        if (floatReference !== this.floatReference) {
            this.getParent(floatReference).restoreStashedFragments(floatReference);
            return;
        }

        this.stashedFloatFragments.forEach(function(stashed) {
            this.addPageFloatFragment(stashed, true);
        }, this);
        this.stashedFloatFragments.splice(0);
    };

    /**
     * @param {!vivliostyle.pagefloat.FloatReference} floatReference
     */
    PageFloatLayoutContext.prototype.discardStashedFragments = function(floatReference) {
        if (floatReference !== this.floatReference) {
            this.getParent(floatReference).discardStashedFragments(floatReference);
            return;
        }

        this.stashedFloatFragments.splice(0);
    };

    /**
     * @param {!vivliostyle.pagefloat.FloatReference} floatReference
     * @returns {!Array.<!vivliostyle.pagefloat.PageFloatFragment>}
     */
    PageFloatLayoutContext.prototype.getStashedFloatFragments = function(floatReference) {
        if (floatReference === this.floatReference) {
            return this.stashedFloatFragments.concat().sort(function(fr1, fr2) {
                var f1 = this.getFloatOfFragment(fr1);
                var f2 = this.getFloatOfFragment(fr2);
                // return in reverse order
                return f2.getOrder() - f1.getOrder();
            }.bind(this));
        } else {
            return this.getParent(floatReference).getStashedFloatFragments(floatReference);
        }
    };

    /**
     * @private
     * @param {string} side
     * @returns {number}
     */
    PageFloatLayoutContext.prototype.getLimitValue = function(side) {
        goog.asserts.assert(this.container);
        var logicalSide = this.toLogical(side);
        var physicalSide = this.toPhysical(side);
        var limit = this.getLimitValueInner(logicalSide);
        goog.asserts.assert(limit >= 0);
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
                    goog.asserts.fail("Should be unreachable");
            }
        }
        return limit;
    };

    /**
     * @private
     * @return {number}
     */
    PageFloatLayoutContext.prototype.getLimitValueInner = function(logicalSide) {
        goog.asserts.assert(this.container);
        var self = this;
        var offsetX = this.container.originX;
        var offsetY = this.container.originY;
        var paddingRect = this.container.getPaddingRect();
        var limits = {
            top: paddingRect.y1 - offsetY,
            left: paddingRect.x1 - offsetX,
            bottom: paddingRect.y2 - offsetY,
            right: paddingRect.x2 - offsetX
        };

        var fragments = this.floatFragments;
        if (fragments.length > 0) {
            limits = fragments.reduce(function(l, f) {
                var float = self.getFloatOfFragment(f);
                var logicalFloatSide = this.toLogical(float.floatSide);
                var area = f.area;
                var top = l.top, left = l.left, bottom = l.bottom, right = l.right;
                switch (logicalFloatSide) {
                    case "inline-start":
                        if (area.vertical) {
                            top = Math.max(top, area.top + area.height);
                        } else {
                            left = Math.max(left, area.left + area.width);
                        }
                        break;
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
                            right = Math.min(right, area.left);
                        }
                        break;
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
            }.bind(this), limits);
        }

        limits.left += offsetX;
        limits.right += offsetX;
        limits.top += offsetY;
        limits.bottom += offsetY;

        switch (logicalSide) {
            case "block-start":
                return this.container.vertical ? limits.right : limits.top;
            case "block-end":
                return this.container.vertical ? limits.left : limits.bottom;
            case "inline-start":
                return this.container.vertical ? limits.top : limits.left;
            case "inline-end":
                return this.container.vertical ? limits.bottom : limits.right;
            default:
                throw new Error("Unknown logical side: " + logicalSide);
        }
    };

    /**
     * @param {!adapt.layout.PageFloatArea} area
     * @param {!vivliostyle.pagefloat.PageFloat} float
     * @param {boolean} init
     * @param {boolean} force
     * @return {boolean} Indicates if the float area fits inside the container or not
     */
    PageFloatLayoutContext.prototype.setFloatAreaDimensions = function(area, float, init, force) {
        if (float.floatReference !== this.floatReference) {
            var parent = this.getParent(float.floatReference);
            return parent.setFloatAreaDimensions(area, float, init, force);
        }

        var logicalFloatSide = this.toLogical(float.floatSide);
        var blockStart = this.getLimitValue("block-start");
        var blockEnd = this.getLimitValue("block-end");
        var inlineStart = this.getLimitValue("inline-start");
        var inlineEnd = this.getLimitValue("inline-end");

        var blockOffset = area.vertical ? area.originX : area.originY;
        var inlineOffset = area.vertical ? area.originY : area.originX;
        blockStart = area.vertical ?
            Math.min(blockStart, area.left + area.width + blockOffset) :
            Math.max(blockStart, area.top + blockOffset);
        blockEnd = area.vertical ?
            Math.max(blockEnd, area.left + blockOffset) :
            Math.min(blockEnd, area.top + area.height + blockOffset);

        var blockSize, inlineSize;
        if (init) {
            var rect = area.vertical ?
                adapt.geom.rotateBox(new adapt.geom.Rect(blockEnd, inlineStart, blockStart, inlineEnd)) :
                new adapt.geom.Rect(inlineStart, blockStart, inlineEnd, blockEnd);
            switch (logicalFloatSide) {
                case "block-start":
                case "inline-start":
                    var uppermostFullyOpenRect = adapt.geom.findUppermostFullyOpenRect(area.bands,
                        rect);
                    if (uppermostFullyOpenRect) {
                        if (area.vertical) {
                            uppermostFullyOpenRect = adapt.geom.unrotateBox(uppermostFullyOpenRect);
                        }
                        blockStart = area.vertical ?
                            Math.min(blockStart, uppermostFullyOpenRect.x2) :
                            Math.max(blockStart, uppermostFullyOpenRect.y1);
                        blockEnd = area.vertical ?
                            Math.max(blockEnd, uppermostFullyOpenRect.x1) :
                            Math.min(blockEnd, uppermostFullyOpenRect.y2);
                    } else if (!force) {
                        return false;
                    }
                    break;
                case "block-end":
                case "inline-end":
                    var bottommostFullyOpenRect = adapt.geom.findBottommostFullyOpenRect(area.bands,
                        rect);
                    if (bottommostFullyOpenRect) {
                        if (area.vertical) {
                            bottommostFullyOpenRect = adapt.geom.unrotateBox(bottommostFullyOpenRect);
                        }
                        blockStart = area.vertical ?
                            Math.min(blockStart, bottommostFullyOpenRect.x2) :
                            Math.max(blockStart, bottommostFullyOpenRect.y1);
                        blockEnd = area.vertical ?
                            Math.max(blockEnd, bottommostFullyOpenRect.x1) :
                            Math.min(blockEnd, bottommostFullyOpenRect.y2);
                    } else if (!force) {
                        return false;
                    }
                    break;
            }
            blockSize = (blockEnd - blockStart) * area.getBoxDir();
            inlineSize = inlineEnd - inlineStart;
            if (!force && (blockSize <= 0 || inlineSize <= 0))
                return false;
        } else {
            blockSize = area.computedBlockSize;
            var availableBlockSize = (blockEnd - blockStart) * area.getBoxDir();
            if (!force && availableBlockSize < blockSize)
                return false;
            var margin = area.floatMargin;
            blockSize = Math.min(blockSize + (area.vertical ? margin.left : margin.bottom),
                availableBlockSize);
            if (logicalFloatSide === "inline-start" || logicalFloatSide === "inline-end") {
                inlineSize = vivliostyle.sizing.getSize(area.clientLayout, area.element,
                    [vivliostyle.sizing.Size.FIT_CONTENT_INLINE_SIZE])[vivliostyle.sizing.Size.FIT_CONTENT_INLINE_SIZE];
            } else {
                var floatBBox = area.clientLayout.getElementClientRect(area.rootViewNode);
                inlineSize = floatBBox[area.vertical ? "height" : "width"] +
                    (area.vertical ? margin.top : margin.left) +
                    (area.vertical ? margin.bottom : margin.right);
            }
            var availableInlineSize = inlineEnd - inlineStart;
            if (!force && availableInlineSize < inlineSize)
                return false;
        }

        blockStart -= blockOffset;
        blockEnd -= blockOffset;
        inlineStart -= inlineOffset;
        inlineEnd -= inlineOffset;

        switch (logicalFloatSide) {
            case "inline-start":
            case "block-start":
                area.setInlinePosition(inlineStart, inlineSize);
                area.setBlockPosition(blockStart, blockSize);
                break;
            case "inline-end":
            case "block-end":
                area.setInlinePosition(inlineEnd - inlineSize, inlineSize);
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
