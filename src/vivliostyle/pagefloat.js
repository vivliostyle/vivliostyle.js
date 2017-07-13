/**
 * Copyright 2015 Vivliostyle Inc.
 *
 * Vivliostyle.js is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle.js is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle.js.  If not, see <http://www.gnu.org/licenses/>.
 *
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
     * @param {!adapt.vtree.NodePosition} nodePosition
     * @param {!vivliostyle.pagefloat.FloatReference} floatReference
     * @param {string} floatSide
     * @param {?string} clearSide
     * @param {string} flowName
     * @constructor
     */
    vivliostyle.pagefloat.PageFloat = function(nodePosition, floatReference, floatSide, clearSide, flowName) {
        /** @const */ this.nodePosition = nodePosition;
        /** @const */ this.floatReference = floatReference;
        /** @const */ this.floatSide = floatSide;
        /** @const */ this.clearSide = clearSide;
        /** @const */ this.flowName = flowName;
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
     * @param {!vivliostyle.pagefloat.PageFloatLayoutContext} pageFloatLayoutContext
     * @returns {boolean}
     */
    PageFloat.prototype.isAllowedOnContext = function(pageFloatLayoutContext) {
        return pageFloatLayoutContext.isAnchorAlreadyAppeared(this.getId());
    };

    /**
     * @param {!PageFloat} other
     * @returns {boolean}
     */
    PageFloat.prototype.isAllowedToPrecede = function(other) {
        return false;
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
            return adapt.vtree.isSameNodePosition(f.nodePosition, float.nodePosition);
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
     * @param {!adapt.vtree.NodePosition} nodePosition
     * @returns {?vivliostyle.pagefloat.PageFloat}
     */
    PageFloatStore.prototype.findPageFloatByNodePosition = function(nodePosition) {
        var index = this.floats.findIndex(function(f) {
            return adapt.vtree.isSameNodePosition(f.nodePosition, nodePosition);
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
     * @param {!vivliostyle.pagefloat.FloatReference} floatReference
     * @param {string} floatSide
     * @param {!Array<!vivliostyle.pagefloat.PageFloatContinuation>} continuations
     * @param {!adapt.vtree.Container} area
     * @param {boolean} continues Represents whether the float is fragmented and continues after this fragment
     * @constructor
     */
    vivliostyle.pagefloat.PageFloatFragment = function(floatReference, floatSide, continuations, area, continues) {
        /** @const */ this.floatReference = floatReference;
        /** @const */ this.floatSide = floatSide;
        /** @const */ this.continuations = continuations;
        /** @const */ this.area = area;
        /** @const */ this.continues = continues;
    };
    /** @const */ var PageFloatFragment = vivliostyle.pagefloat.PageFloatFragment;

    /**
     * @param {!PageFloat} float
     * @returns {boolean}
     */
    PageFloatFragment.prototype.hasFloat = function(float) {
        return this.continuations.some(function(c) { return c.float === float; });
    };

    /**
     * @param {!PageFloatLayoutContext} context
     * @returns {?PageFloat}
     */
    PageFloatFragment.prototype.findNotAllowedFloat = function(context) {
        for (var i = this.continuations.length - 1; i >= 0; i--) {
            var f = this.continuations[i].float;
            if (!f.isAllowedOnContext(context))
                return f;
        }
        return null;
    };

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
     * @returns {number}
     */
    PageFloatFragment.prototype.getOrder = function() {
        /** @const */ var floats = this.continuations.map(function(c) { return c.float; });
        return Math.min.apply(null, floats.map(function(f) { return f.getOrder(); }));
    };

    /**
     * @param {!PageFloat} float
     * @returns {boolean}
     */
    PageFloatFragment.prototype.shouldBeStashedBefore = function(float) {
        return this.getOrder() < float.getOrder();
    };

    /**
     * @param {!Array<!PageFloatContinuation>} continuations
     */
    PageFloatFragment.prototype.addContinuations = function(continuations) {
        continuations.forEach(function(c) {
            this.continuations.push(c);
        }, this);
    };

    /**
     * @param {!vivliostyle.pagefloat.PageFloat} float
     * @param {!adapt.vtree.NodePosition} nodePosition
     * @constructor
     */
    vivliostyle.pagefloat.PageFloatContinuation = function(float, nodePosition) {
        /** @const */ this.float = float;
        /** @const */ this.nodePosition = nodePosition;
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
     * Represents whether a page float can be placed at each logical side of its container.
     * A false value means that the page float cannot be placed at the side
     * (e.g. due to 'clear' property)
     * @typedef {Object<string, boolean>}
     */
    vivliostyle.pagefloat.PageFloatPlacementCondition;
    /** @const */ var PageFloatPlacementCondition = vivliostyle.pagefloat.PageFloatPlacementCondition;

    /**
     * @param {vivliostyle.pagefloat.PageFloatLayoutContext} parent
     * @param {?vivliostyle.pagefloat.FloatReference} floatReference
     * @param {adapt.vtree.Container} container
     * @param {?string} flowName
     * @param {?adapt.vtree.NodePosition} generatingNodePosition Source NodePosition generating the context. Specify when a column context is generated by a non-root element (for example page floats)
     * @param {?adapt.css.Val} writingMode
     * @param {?adapt.css.Val} direction
     * @constructor
     */
    vivliostyle.pagefloat.PageFloatLayoutContext = function(parent, floatReference, container, flowName,
                                                            generatingNodePosition, writingMode, direction) {
        /** @const */ this.parent = parent;
        if (parent) {
            parent.children.push(this);
        }
        /** @private @const {!Array<!vivliostyle.pagefloat.PageFloatLayoutContext>} */ this.children = [];
        /** @private @const */ this.floatReference = floatReference;
        /** @private */ this.container = container;
        /** @const */ this.flowName = flowName;
        /** @const */ this.generatingNodePosition = generatingNodePosition;
        /** @const {!adapt.css.Val} */ this.writingMode =
            writingMode || (parent && parent.writingMode) || adapt.css.ident.horizontal_tb;
        /** @const {!adapt.css.Val} */ this.direction =
            direction || (parent && parent.direction) || adapt.css.ident.ltr;
        /** @private @type {boolean} */ this.invalidated = false;
        /** @private @const */ this.floatStore = parent ? parent.floatStore : new PageFloatStore();
        /** @private @const {!Array<vivliostyle.pagefloat.PageFloat.ID>} */ this.forbiddenFloats = [];
        /** @const {!Array<!vivliostyle.pagefloat.PageFloatFragment>} */ this.floatFragments = [];
        /** @private @const {!Array<!vivliostyle.pagefloat.PageFloatFragment>} */ this.stashedFloatFragments = [];
        /** @private @const {!Object<vivliostyle.pagefloat.PageFloat.ID, Node>} */ this.floatAnchors = {};
        /** @private @const {!Array<!vivliostyle.pagefloat.PageFloatContinuation>} */ this.floatsDeferredToNext = [];
        var previousSibling = this.getPreviousSibling();
        /** @private @const {!Array<!vivliostyle.pagefloat.PageFloatContinuation>} */
        this.floatsDeferredFromPrevious = previousSibling ? [].concat(previousSibling.floatsDeferredToNext) : [];
        /** @private @const {!Array<!adapt.layout.LayoutConstraint>} */ this.layoutConstraints = [];
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
     * @param {?adapt.vtree.NodePosition} generatingNodePosition
     * @returns {?vivliostyle.pagefloat.PageFloatLayoutContext}
     */
    PageFloatLayoutContext.prototype.getPreviousSiblingOf = function(child, floatReference,
                                                                     flowName, generatingNodePosition) {
        var index = this.children.indexOf(/** @type {!vivliostyle.pagefloat.PageFloatLayoutContext} */ (child));
        if (index < 0) {
            index = this.children.length;
        }
        for (var i = index - 1; i >= 0; i--) {
            var result = this.children[i];
            if (result.floatReference === floatReference && result.flowName === flowName &&
                adapt.vtree.isSameNodePosition(result.generatingNodePosition, generatingNodePosition)) {
                return result;
            } else {
                result = result.getPreviousSiblingOf(null, floatReference, flowName, generatingNodePosition);
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
                this.generatingNodePosition);
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
     * @param {!adapt.vtree.NodePosition} nodePosition
     * @returns {?vivliostyle.pagefloat.PageFloat}
     */
    PageFloatLayoutContext.prototype.findPageFloatByNodePosition = function(nodePosition) {
        return this.floatStore.findPageFloatByNodePosition(nodePosition);
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
                var strategy = new PageFloatLayoutStrategyResolver().findByFloat(float);
                strategy.forbid(float, this);
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
     * @param {boolean=} dontInvalidate
     */
    PageFloatLayoutContext.prototype.addPageFloatFragment = function(floatFragment, dontInvalidate) {
        var floatReference = floatFragment.floatReference;
        if (floatReference !== this.floatReference) {
            var parent = this.getParent(floatReference);
            parent.addPageFloatFragment(floatFragment, dontInvalidate);
        } else if (this.floatFragments.indexOf(floatFragment) < 0) {
            this.floatFragments.push(floatFragment);
            this.floatFragments.sort(function(fr1, fr2) {
                return fr1.getOrder() - fr2.getOrder();
            });
        }
        if (!dontInvalidate)
            this.invalidate();
    };

    /**
     * @param {!vivliostyle.pagefloat.PageFloatFragment} floatFragment
     * @param {boolean=} dontInvalidate
     */
    PageFloatLayoutContext.prototype.removePageFloatFragment = function(floatFragment, dontInvalidate) {
        var floatReference = floatFragment.floatReference;
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
        var index = this.floatFragments.findIndex(function(f) {
            return f.hasFloat(float);
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
     * @param {!vivliostyle.pagefloat.PageFloatContinuation} continuation
     */
    PageFloatLayoutContext.prototype.deferPageFloat = function(continuation) {
        var float = continuation.float;
        if (float.floatReference === this.floatReference) {
            var index = this.floatsDeferredToNext.findIndex(function(c) { return c.float === float; });
            if (index >= 0) {
                this.floatsDeferredToNext.splice(index, 1, continuation);
            } else {
                this.floatsDeferredToNext.push(continuation);
            }
        } else {
            var parent = this.getParent(float.floatReference);
            parent.deferPageFloat(continuation);
        }
    };

    /**
     * @param {!PageFloat} float
     * @param {boolean=} ignoreReference
     * @returns {boolean}
     */
    PageFloatLayoutContext.prototype.hasPrecedingFloatsDeferredToNext = function(float, ignoreReference) {
        if (!ignoreReference && float.floatReference !== this.floatReference) {
            return this.getParent(float.floatReference).hasPrecedingFloatsDeferredToNext(float, false);
        }
        var order = float.getOrder();
        var hasPrecedingFloatsDeferredToNext = this.floatsDeferredToNext.some(function(c) {
            return c.float.getOrder() < order && !float.isAllowedToPrecede(c.float);
        });
        if (hasPrecedingFloatsDeferredToNext) {
            return true;
        } else if (this.parent) {
            return this.parent.hasPrecedingFloatsDeferredToNext(float, true);
        } else {
            return false;
        }
    };

    /**
     * @param {!PageFloat} float
     * @returns {?PageFloat}
     */
    PageFloatLayoutContext.prototype.getLastFollowingFloatInFragments = function(float) {
        var order = float.getOrder();
        var lastFollowing = null;
        this.floatFragments.forEach(function(fragment) {
            fragment.continuations.forEach(function(c) {
                var f = c.float;
                var o = f.getOrder();
                if (o > order &&
                    (!lastFollowing || o > lastFollowing.getOrder())) {
                    lastFollowing = f;
                }
            });
        });
        if (this.parent) {
            var lastFollowingOfParent = this.parent.getLastFollowingFloatInFragments(float);
            if (lastFollowingOfParent &&
                (!lastFollowing || lastFollowingOfParent.getOrder() > lastFollowing.getOrder())) {
                lastFollowing = lastFollowingOfParent;
            }
        }
        return lastFollowing;
    };

    /**
     * @param {?string=} flowName
     * @returns {!Array<!vivliostyle.pagefloat.PageFloatContinuation>}
     */
    PageFloatLayoutContext.prototype.getDeferredPageFloatContinuations = function(flowName) {
        flowName = flowName || this.flowName;
        var result = this.floatsDeferredFromPrevious.filter(function(cont) {
            return !flowName || cont.float.flowName === flowName;
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
            return !flowName || cont.float.flowName === flowName;
        });
        if (this.parent) {
            return this.parent.getPageFloatContinuationsDeferredToNext(flowName).concat(result);
        } else {
            return result;
        }
    };

    /**
     * @returns {!Array<!PageFloat>}
     */
    PageFloatLayoutContext.prototype.getFloatsDeferredToNextInChildContexts = function() {
        var result = [];
        var done = [];
        for (var i = this.children.length - 1; i >= 0; i--) {
            var child = this.children[i];
            if (done.indexOf(child.flowName) >= 0) continue;
            done.push(child.flowName);
            result = result.concat(child.floatsDeferredToNext.map(function(c) {
                return c.float;
            }));
            result = result.concat(child.getFloatsDeferredToNextInChildContexts());
        }
        return result;
    };

    /**
     * @returns {boolean}
     */
    PageFloatLayoutContext.prototype.checkAndForbidFloatFollowingDeferredFloat = function() {
        var deferredFloats = this.getFloatsDeferredToNextInChildContexts();
        var floatsInFragments = this.floatFragments.reduce(function(r, fr) {
            return r.concat(fr.continuations.map(function(c) {
                return c.float;
            }));
        }, []);
        floatsInFragments.sort(function(f1, f2) {
            return f2.getOrder() - f1.getOrder();
        });
        for (var i = 0; i < floatsInFragments.length; i++) {
            var float = floatsInFragments[i];
            var order = float.getOrder();
            if (deferredFloats.some(function(d) {
                return !float.isAllowedToPrecede(d) && order > d.getOrder();
            })) {
                this.forbid(float);
                var fragment = this.findPageFloatFragment(float);
                goog.asserts.assert(fragment);
                this.removePageFloatFragment(fragment);
                return true;
            }
        }
        return false;
    };

    PageFloatLayoutContext.prototype.finish = function() {
        if (this.checkAndForbidFloatFollowingDeferredFloat())
            return;
        for (var i = this.floatFragments.length - 1; i >= 0; i--) {
            var fragment = this.floatFragments[i];
            var notAllowedFloat = fragment.findNotAllowedFloat(this);
            if (notAllowedFloat) {
                this.removePageFloatFragment(fragment);
                this.forbid(notAllowedFloat);
                // If the removed float is a block-end/inline-end float,
                // we should re-layout preceding floats with the same float direction.
                this.removeEndFloatFragments(fragment.floatSide);
                return;
            }
        }
        for (var i = this.floatsDeferredToNext.length - 1; i >= 0; i--) {
            var continuation = this.floatsDeferredToNext[i];
            if (!continuation.float.isAllowedOnContext(this)) {
                this.floatsDeferredToNext.splice(i, 1);
            }
        }
        this.floatsDeferredFromPrevious.forEach(function(continuation) {
            if (this.floatsDeferredToNext.findIndex(function(c) { return continuation.equals(c); }) >= 0)
                return;
            if (this.floatFragments.some(function(f) { return f.hasFloat(continuation.float); }))
                return;
            this.floatsDeferredToNext.push(continuation);
        }, this);
    };

    /**
     * @param {!PageFloatLayoutContext} other
     * @returns {boolean}
     */
    PageFloatLayoutContext.prototype.hasSameContainerAs = function(other) {
        return !!this.container && !!other.container &&
                this.container.element === other.container.element;
    };

    PageFloatLayoutContext.prototype.invalidate = function() {
        if (this.container) {
            this.children.forEach(function(child) {
                // Since the same container element is shared by a region page float layout context and
                // a column page float layout context in a single column region,
                // view elements of float fragments of the child (column) context need to be removed here.
                if (this.hasSameContainerAs(child)) {
                    child.floatFragments.forEach(function(fragment) {
                        var elem = fragment.area.element;
                        if (elem && elem.parentNode)
                            elem.parentNode.removeChild(elem);
                    });
                }
            }, this);
            this.container.clear();
        }
        this.children.forEach(function(child) {
            child.layoutConstraints.splice(0);
        });
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
     * @param {string} floatSide
     */
    PageFloatLayoutContext.prototype.removeEndFloatFragments = function(floatSide) {
        var logicalFloatSide = this.toLogical(floatSide);
        if (logicalFloatSide === "block-end" || logicalFloatSide === "inline-end") {
            var i = 0;
            while (i < this.floatFragments.length) {
                var fragment = this.floatFragments[i];
                var logicalFloatSide2 = this.toLogical(fragment.floatSide);
                if (logicalFloatSide2 === logicalFloatSide) {
                    this.removePageFloatFragment(fragment);
                } else {
                    i++;
                }
            }
        }
    };

    /**
     * @param {!PageFloat} float
     */
    PageFloatLayoutContext.prototype.stashEndFloatFragments = function(float) {
        var floatReference = float.floatReference;
        if (floatReference !== this.floatReference) {
            this.getParent(floatReference).stashEndFloatFragments(float);
            return;
        }

        var logicalFloatSide = this.toLogical(float.floatSide);
        if (logicalFloatSide === "block-end" || logicalFloatSide === "snap-block" ||
            logicalFloatSide === "inline-end") {
            var i = 0;
            while (i < this.floatFragments.length) {
                var fragment = this.floatFragments[i];
                var fragmentFloatSide = this.toLogical(fragment.floatSide);
                if ((fragmentFloatSide === logicalFloatSide ||
                    (logicalFloatSide === "snap-block" && fragmentFloatSide === "block-end")) &&
                    fragment.shouldBeStashedBefore(float)) {
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
                // return in reverse order
                return fr2.getOrder() - fr1.getOrder();
            });
        } else {
            return this.getParent(floatReference).getStashedFloatFragments(floatReference);
        }
    };

    /**
     * @private
     * @param {string} side
     * @param {function(PageFloatFragment, PageFloatLayoutContext):boolean=} condition
     * @returns {number}
     */
    PageFloatLayoutContext.prototype.getLimitValue = function(side, condition) {
        goog.asserts.assert(this.container);
        var logicalSide = this.toLogical(side);
        var physicalSide = this.toPhysical(side);
        var limit = this.getLimitValueInner(logicalSide, condition);
        goog.asserts.assert(limit >= 0);
        if (this.parent && this.parent.container) {
            var parentLimit = this.parent.getLimitValue(physicalSide, condition);
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
     * @param {string} logicalSide
     * @param {function(PageFloatFragment, PageFloatLayoutContext):boolean=} condition
     * @return {number}
     */
    PageFloatLayoutContext.prototype.getLimitValueInner = function(logicalSide, condition) {
        goog.asserts.assert(this.container);
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
                if (condition && !condition(f, this))
                    return l;
                var logicalFloatSide = this.toLogical(f.floatSide);
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
     * @param {!vivliostyle.pagefloat.FloatReference} floatReference
     * @param {string} floatSide
     * @param {?number} anchorEdge Null indicates that the anchor is not in the current container.
     * @param {boolean} init
     * @param {boolean} force
     * @param {!PageFloatPlacementCondition} condition
     * @return {?string} Logical float side (snap-block is resolved when init=false). Null indicates that the float area does not fit inside the container
     */
    PageFloatLayoutContext.prototype.setFloatAreaDimensions = function(
        area, floatReference, floatSide, anchorEdge, init, force, condition) {
        if (floatReference !== this.floatReference) {
            var parent = this.getParent(floatReference);
            return parent.setFloatAreaDimensions(area, floatReference, floatSide, anchorEdge, init, force, condition);
        }

        var logicalFloatSide = this.toLogical(floatSide);
        if (logicalFloatSide === "snap-block") {
            if (!condition["block-start"] && !condition["block-end"]) return null;
        } else {
            if (!condition[logicalFloatSide]) return null;
        }

        var blockStart = this.getLimitValue("block-start");
        var blockEnd = this.getLimitValue("block-end");
        var inlineStart = this.getLimitValue("inline-start");
        var inlineEnd = this.getLimitValue("inline-end");

        var blockOffset = area.vertical ? area.originX : area.originY;
        var inlineOffset = area.vertical ? area.originY : area.originX;
        blockStart = area.vertical ?
            Math.min(blockStart, area.left + area.getInsetLeft() + area.width + area.getInsetRight() + blockOffset) :
            Math.max(blockStart, area.top + blockOffset);
        blockEnd = area.vertical ?
            Math.max(blockEnd, area.left + blockOffset) :
            Math.min(blockEnd, area.top + area.getInsetTop() + area.height + area.getInsetBottom() + blockOffset);

        function limitBlockStartEndValueWithOpenRect(getRect, rect) {
            var openRect = getRect(area.bands, rect);
            if (openRect) {
                if (area.vertical) {
                    openRect = adapt.geom.unrotateBox(openRect);
                }
                blockStart = area.vertical ?
                    Math.min(blockStart, openRect.x2) :
                    Math.max(blockStart, openRect.y1);
                blockEnd = area.vertical ?
                    Math.max(blockEnd, openRect.x1) :
                    Math.min(blockEnd, openRect.y2);
                return true;
            } else {
                return force;
            }
        }

        var blockSize, inlineSize, outerBlockSize, outerInlineSize;
        if (init) {
            var rect = area.vertical ?
                adapt.geom.rotateBox(new adapt.geom.Rect(blockEnd, inlineStart, blockStart, inlineEnd)) :
                new adapt.geom.Rect(inlineStart, blockStart, inlineEnd, blockEnd);

            if (logicalFloatSide === "block-start" || logicalFloatSide === "snap-block"
                || logicalFloatSide === "inline-start") {
                if (!limitBlockStartEndValueWithOpenRect(adapt.geom.findUppermostFullyOpenRect, rect))
                    return null;
            }
            if (logicalFloatSide === "block-end" || logicalFloatSide === "snap-block"
                || logicalFloatSide === "inline-end") {
                if (!limitBlockStartEndValueWithOpenRect(adapt.geom.findBottommostFullyOpenRect, rect))
                    return null;
            }
            outerBlockSize = (blockEnd - blockStart) * area.getBoxDir();
            blockSize = outerBlockSize - area.getInsetBefore() - area.getInsetAfter();
            outerInlineSize = inlineEnd - inlineStart;
            inlineSize = outerInlineSize - area.getInsetStart() - area.getInsetEnd();
            if (!force && (blockSize <= 0 || inlineSize <= 0))
                return null;
        } else {
            blockSize = area.computedBlockSize;
            outerBlockSize = blockSize + area.getInsetBefore() + area.getInsetAfter();
            var availableBlockSize = (blockEnd - blockStart) * area.getBoxDir();

            if (logicalFloatSide === "snap-block") {
                if (anchorEdge === null) {
                    // Deferred from previous container
                    logicalFloatSide = "block-start";
                } else {
                    var containerRect = this.container.getPaddingRect();
                    var fromStart = this.container.getBoxDir() *
                        (anchorEdge - (this.container.vertical ? containerRect.x2 : containerRect.y1));
                    var fromEnd = this.container.getBoxDir() *
                        ((this.container.vertical ? containerRect.x1 : containerRect.y2)
                        - anchorEdge - outerBlockSize);
                    if (fromStart <= fromEnd) {
                        logicalFloatSide = "block-start";
                    } else {
                        logicalFloatSide = "block-end";
                    }
                }
                if (!condition[logicalFloatSide]) {
                    if (condition["block-end"]) {
                        logicalFloatSide = "block-end";
                    } else {
                        return null;
                    }
                }
            }

            if (!force && availableBlockSize < outerBlockSize)
                return null;
            if (logicalFloatSide === "inline-start" || logicalFloatSide === "inline-end") {
                inlineSize = vivliostyle.sizing.getSize(area.clientLayout, area.element,
                    [vivliostyle.sizing.Size.FIT_CONTENT_INLINE_SIZE])[vivliostyle.sizing.Size.FIT_CONTENT_INLINE_SIZE];
            } else if (area.adjustContentRelativeSize) {
                inlineSize = area.getContentInlineSize();
            } else {
                inlineSize = area.vertical ? area.height : area.width;
            }
            outerInlineSize = inlineSize + area.getInsetStart() + area.getInsetEnd();
            var availableInlineSize = inlineEnd - inlineStart;
            if (!force && availableInlineSize < outerInlineSize)
                return null;
        }

        blockStart -= blockOffset;
        blockEnd -= blockOffset;
        inlineStart -= inlineOffset;
        inlineEnd -= inlineOffset;

        switch (logicalFloatSide) {
            case "inline-start":
            case "block-start":
            case "snap-block":
                area.setInlinePosition(inlineStart, inlineSize);
                area.setBlockPosition(blockStart, blockSize);
                break;
            case "inline-end":
            case "block-end":
                area.setInlinePosition(inlineEnd - outerInlineSize, inlineSize);
                area.setBlockPosition(blockEnd - outerBlockSize * area.getBoxDir(), blockSize);
                break;
            default:
                throw new Error("unknown float direction: " + floatSide);
        }

        return logicalFloatSide;
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

    /**
     * @param {string} clear
     * @param {!adapt.layout.Column} column
     * @returns {number}
     */
    PageFloatLayoutContext.prototype.getPageFloatClearEdge = function(clear, column) {
        function isContinuationOfAlreadyAppearedFloat(context) {
            return function(continuation) {
                return context.isAnchorAlreadyAppeared(continuation.float.getId());
            };
        }
        function isFragmentWithAlreadyAppearedFloat(fragment, context) {
            return fragment.continuations.some(isContinuationOfAlreadyAppearedFloat(context));
        }

        var columnRect = column.getPaddingRect();
        var columnBlockEnd = column.vertical ? columnRect.x1 : columnRect.y2;
        var context = this;
        while (context) {
            if (context.floatsDeferredToNext.some(isContinuationOfAlreadyAppearedFloat(context)))
                return columnBlockEnd;
            context = context.parent;
        }
        var blockStartLimit = this.getLimitValue(
            "block-start", isFragmentWithAlreadyAppearedFloat);
        var blockEndLimit = this.getLimitValue(
            "block-end", isFragmentWithAlreadyAppearedFloat);
        if (blockEndLimit * column.getBoxDir() < columnBlockEnd * column.getBoxDir()) {
            return columnBlockEnd;
        } else {
            return blockStartLimit;
        }
    };

    /**
     * @param {!PageFloat} float
     * @param {string} floatSide
     * @param {?string} clearSide
     * @returns {!PageFloatPlacementCondition}
     */
    PageFloatLayoutContext.prototype.getPageFloatPlacementCondition = function(float, floatSide, clearSide) {
        if (float.floatReference !== this.floatReference) {
            var parent = this.getParent(float.floatReference);
            return parent.getPageFloatPlacementCondition(float, floatSide, clearSide);
        }

        /** @const {!PageFloatPlacementCondition} */ var result = {
            "block-start": true,
            "block-end": true,
            "inline-start": true,
            "inline-end": true
        };
        if (!clearSide) return result;

        var logicalFloatSide = this.toLogical(floatSide);
        var logicalClearSide = this.toLogical(clearSide);
        /** @type {Array<string>} */ var logicalSides;
        if (logicalClearSide === "all") {
            logicalSides = ["block-start", "block-end", "inline-start", "inline-end"];
        } else if (logicalClearSide === "same") {
            if (logicalFloatSide === "snap-block") {
                logicalSides = ["block-start", "block-end"];
            } else {
                logicalSides = [logicalFloatSide];
            }
        } else {
            logicalSides = [logicalClearSide];
        }

        var floatOrder = float.getOrder();

        /**
         * @param {string} side
         * @returns {function(!PageFloatFragment):boolean}
         */
        function isPrecedingFragment(side) {
            return function(fragment) {
                return fragment.floatSide === side && fragment.getOrder() < floatOrder;
            };
        }

        /**
         * @param {!PageFloatLayoutContext} context
         * @param {string} side
         * @returns {boolean}
         */
        function hasPrecedingFragmentInChildren(context, side) {
            return context.children.some(function(child) {
                return child.floatFragments.some(isPrecedingFragment(side)) ||
                    hasPrecedingFragmentInChildren(child, side);
            });
        }

        /**
         * @param {!PageFloatLayoutContext} context
         * @param {string} side
         * @returns {boolean}
         */
        function hasPrecedingFragmentInParents(context, side) {
            var parent = context.parent;
            return !!parent &&
                (parent.floatFragments.some(isPrecedingFragment(side)) ||
                hasPrecedingFragmentInParents(parent, side));
        }

        logicalSides.forEach(function(side) {
            switch (side) {
                case "block-start":
                case "inline-start":
                    result[side] = !hasPrecedingFragmentInChildren(this, side);
                    break;
                case "block-end":
                case "inline-end":
                    result[side] = !hasPrecedingFragmentInParents(this, side);
                    break;
                default:
                    throw new Error("Unexpected side: " + side);
            }
        }, this);

        return result;
    };

    /**
     * @returns {!Array.<!adapt.layout.LayoutConstraint>}
     */
    PageFloatLayoutContext.prototype.getLayoutConstraints = function() {
        var constraints = this.parent ? this.parent.getLayoutConstraints() : [];
        return constraints.concat(this.layoutConstraints);
    };

    /**
     * @param {!adapt.layout.LayoutConstraint} layoutConstraint
     * @param {!FloatReference} floatReference
     */
    PageFloatLayoutContext.prototype.addLayoutConstraint = function(layoutConstraint, floatReference) {
        if (floatReference === this.floatReference) {
            this.layoutConstraints.push(layoutConstraint);
        } else {
            this.getParent(floatReference).addLayoutConstraint(layoutConstraint, floatReference);
        }
    };

    /**
     * @interface
     */
    vivliostyle.pagefloat.PageFloatLayoutStrategy = function() {};
    /** @const */ var PageFloatLayoutStrategy = vivliostyle.pagefloat.PageFloatLayoutStrategy;

    /**
     * @param {!adapt.vtree.NodeContext} nodeContext
     * @returns {boolean}
     */
    PageFloatLayoutStrategy.prototype.appliesToNodeContext = function(nodeContext) {};

    /**
     * @param {!PageFloat} float
     * @returns {boolean}
     */
    PageFloatLayoutStrategy.prototype.appliesToFloat = function(float) {};

    /**
     * @param {!adapt.vtree.NodeContext} nodeContext
     * @param {!PageFloatLayoutContext} pageFloatLayoutContext
     * @param {!adapt.layout.Column} column
     * @returns {!adapt.task.Result<!PageFloat>}
     */
    PageFloatLayoutStrategy.prototype.createPageFloat =
        function(nodeContext, pageFloatLayoutContext, column) {};

    /**
     * @param {!Array<!PageFloatContinuation>} continuations
     * @param {string} logicalFloatSide
     * @param {!adapt.layout.PageFloatArea} floatArea
     * @param {boolean} continues
     * @returns {!PageFloatFragment}
     */
    PageFloatLayoutStrategy.prototype.createPageFloatFragment = function(continuations, logicalFloatSide, floatArea, continues) {};

    /**
     * @param {!PageFloat} float
     * @param {!PageFloatLayoutContext} pageFloatLayoutContext
     * @returns {?PageFloatFragment}
     */
    PageFloatLayoutStrategy.prototype.findPageFloatFragment =
        function(float, pageFloatLayoutContext) {};

    /**
     * @param {!adapt.layout.PageFloatArea} floatArea
     * @param {!adapt.vtree.Container} floatContainer
     * @param {!adapt.layout.Column} column
     */
    PageFloatLayoutStrategy.prototype.adjustPageFloatArea =
        function(floatArea, floatContainer, column) {};

    /**
     * @param {!PageFloat} float
     * @param {!PageFloatLayoutContext} pageFloatLayoutContext
     */
    PageFloatLayoutStrategy.prototype.forbid = function(float, pageFloatLayoutContext) {};

    /** @const {Array<!PageFloatLayoutStrategy>} */
    var pageFloatLayoutStrategies = [];

    /**
     * @constructor
     */
    vivliostyle.pagefloat.PageFloatLayoutStrategyResolver = function() {};
    /** @const */ var PageFloatLayoutStrategyResolver =
        vivliostyle.pagefloat.PageFloatLayoutStrategyResolver;

    /**
     * @param {!PageFloatLayoutStrategy} strategy
     */
    PageFloatLayoutStrategyResolver.register = function(strategy) {
        pageFloatLayoutStrategies.push(strategy);
    };

    /**
     * @param {!adapt.vtree.NodeContext} nodeContext
     * @returns {!PageFloatLayoutStrategy}
     */
    PageFloatLayoutStrategyResolver.prototype.findByNodeContext = function(nodeContext) {
        for (var i = pageFloatLayoutStrategies.length - 1; i >= 0; i--) {
            var strategy = pageFloatLayoutStrategies[i];
            if (strategy.appliesToNodeContext(nodeContext)) {
                return strategy;
            }
        }
        throw new Error("No PageFloatLayoutStrategy found for " + nodeContext);
    };

    /**
     * @param {!PageFloat} float
     * @returns {!PageFloatLayoutStrategy}
     */
    PageFloatLayoutStrategyResolver.prototype.findByFloat = function(float) {
        for (var i = pageFloatLayoutStrategies.length - 1; i >= 0; i--) {
            var strategy = pageFloatLayoutStrategies[i];
            if (strategy.appliesToFloat(float)) {
                return strategy;
            }
        }
        throw new Error("No PageFloatLayoutStrategy found for " + float);
    };

    /**
     * @constructor
     * @implements {PageFloatLayoutStrategy}
     */
    vivliostyle.pagefloat.NormalPageFloatLayoutStrategy = function() {};
    /** @const */ var NormalPageFloatLayoutStrategy =
        vivliostyle.pagefloat.NormalPageFloatLayoutStrategy;

    /**
     * @override
     */
    NormalPageFloatLayoutStrategy.prototype.appliesToNodeContext = function(nodeContext) {
        return vivliostyle.pagefloat.isPageFloat(nodeContext.floatReference);
    };

    /**
     * @override
     */
    NormalPageFloatLayoutStrategy.prototype.appliesToFloat = function(float) {
        return true;
    };

    /**
     * @override
     */
    NormalPageFloatLayoutStrategy.prototype.createPageFloat = function(
        nodeContext, pageFloatLayoutContext, column) {
        var floatReference = nodeContext.floatReference;
        goog.asserts.assert(nodeContext.floatSide);
        /** @const {string} */ var floatSide = nodeContext.floatSide;
        /** @const */ var nodePosition = nodeContext.toNodePosition();
        return column.resolveFloatReferenceFromColumnSpan(floatReference, nodeContext.columnSpan, nodeContext).thenAsync(function(ref) {
            floatReference = ref;
            goog.asserts.assert(pageFloatLayoutContext.flowName);
            var float = new vivliostyle.pagefloat.PageFloat(nodePosition, floatReference, floatSide,
                nodeContext.clearSide, pageFloatLayoutContext.flowName);
            pageFloatLayoutContext.addPageFloat(float);
            return adapt.task.newResult(float);
        });
    };

    /**
     * @override
     */
    NormalPageFloatLayoutStrategy.prototype.createPageFloatFragment = function(
        continuations, floatSide, floatArea, continues) {
        /** @const */ var f = continuations[0].float;
        return new PageFloatFragment(f.floatReference, floatSide, continuations, floatArea, continues);
    };

    /**
     * @override
     */
    NormalPageFloatLayoutStrategy.prototype.findPageFloatFragment = function(
        float, pageFloatLayoutContext) {
        return pageFloatLayoutContext.findPageFloatFragment(float);
    };

    /**
     * @override
     */
    NormalPageFloatLayoutStrategy.prototype.adjustPageFloatArea = function(
        floatArea, floatContainer, column) {};

    /**
     * @override
     */
    NormalPageFloatLayoutStrategy.prototype.forbid = function(float, pageFloatLayoutContext) {};

    PageFloatLayoutStrategyResolver.register(new NormalPageFloatLayoutStrategy());
});
