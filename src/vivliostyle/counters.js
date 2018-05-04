/**
 * Copyright 2016 Trim-marks Inc.
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
 * @fileoverview Counters
 */

goog.provide("vivliostyle.counters");

goog.require("adapt.base");
goog.require("adapt.expr");
goog.require("adapt.csscasc");
goog.require("adapt.vtree");
goog.require("adapt.cssstyler");
goog.require("adapt.layout");

goog.scope(() => {

    /**
     * Clone counter values.
     * @param {!adapt.csscasc.CounterValues} counters
     * @returns {!adapt.csscasc.CounterValues}
     */
    function cloneCounterValues(counters) {
        var result = {};
        Object.keys(counters).forEach(name => {
            result[name] = Array.from(counters[name]);
        });
        return result;
    }

    /**
     * Class representing a reference by target-counter(s).
     * @param {string} targetId ID of the referenced element (transformed by DocumentURLTransformer to handle a reference across multiple source documents)
     * @param {boolean} resolved If the reference is already resolved or not
     * @constructor
     */
    vivliostyle.counters.TargetCounterReference = function(targetId, resolved) {
        /** @const */ this.targetId = targetId;
        /** @type {boolean} */ this.resolved = resolved;
        /** @type {adapt.csscasc.CounterValues} */ this.pageCounters = null;
        /** @type {number} */ this.spineIndex = -1;
        /** @type {number} */ this.pageIndex = -1;
    };

    /**
     * @param {vivliostyle.counters.TargetCounterReference} other
     * @returns {boolean}
     */
    vivliostyle.counters.TargetCounterReference.prototype.equals = function(other) {
        if (this === other) {
            return true;
        }
        if (!other) {
            return false;
        }
        return this.targetId === other.targetId &&
                this.resolved === other.resolved &&
                this.spineIndex === other.spineIndex &&
                this.pageIndex === other.pageIndex;
    };

    /**
     * Returns if the reference is resolved or not.
     * @returns {boolean}
     */
    vivliostyle.counters.TargetCounterReference.prototype.isResolved = function() {
        return this.resolved;
    };

    /**
     * Marks that this reference is resolved.
     */
    vivliostyle.counters.TargetCounterReference.prototype.resolve = function() {
        this.resolved = true;
    };

    /**
     * Marks that this reference is unresolved.
     */
    vivliostyle.counters.TargetCounterReference.prototype.unresolve = function() {
        this.resolved = false;
    };

    /**
     * @param {!vivliostyle.counters.CounterStore} counterStore
     * @param {string} baseURL
     * @constructor
     * @implements {adapt.csscasc.CounterListener}
     */
    function CounterListener(counterStore, baseURL) {
        /** @const */ this.counterStore = counterStore;
        /** @const */ this.baseURL = baseURL;
    }

    /**
     * @override
     */
    CounterListener.prototype.countersOfId = function(id, counters) {
        id = this.counterStore.documentURLTransformer.transformFragment(id, this.baseURL);
        this.counterStore.countersById[id] = counters;
    };

    /**
     * @returns {!adapt.vtree.ExprContentListener}
     */
    CounterListener.prototype.getExprContentListener = function() {
        return this.counterStore.getExprContentListener();
    };

    /**
     * @param {!vivliostyle.counters.CounterStore} counterStore
     * @param {string} baseURL
     * @param {adapt.expr.LexicalScope} rootScope
     * @param {adapt.expr.LexicalScope} pageScope
     * @constructor
     * @implements {adapt.csscasc.CounterResolver}
     */
    function CounterResolver(counterStore, baseURL, rootScope, pageScope) {
        /** @const */ this.counterStore = counterStore;
        /** @const */ this.baseURL = baseURL;
        /** @const */ this.rootScope = rootScope;
        /** @const */ this.pageScope = pageScope;
        /** @type {?adapt.cssstyler.Styler} */ this.styler = null;
    }

    /**
     *
     * @param {!adapt.cssstyler.Styler} styler
     */
    CounterResolver.prototype.setStyler = function(styler) {
        this.styler = styler;
    };

    /**
     * @private
     * @param {string} url
     * @returns {?string}
     */
    CounterResolver.prototype.getFragment = url => {
        var r = url.match(/^[^#]*#(.*)$/);
        return r ? r[1] : null;
    };

    /**
     * @private
     * @param {string} url
     * @returns {string}
     */
    CounterResolver.prototype.getTransformedId = function(url) {
        var transformedId = this.counterStore.documentURLTransformer.transformURL(
            adapt.base.resolveURL(url, this.baseURL), this.baseURL);
        if (transformedId.charAt(0) === "#") {
            transformedId = transformedId.substring(1);
        }
        return transformedId;
    };

    /**
     * @override
     */
    CounterResolver.prototype.getPageCounterVal = function(name, format) {
        var self = this;
        function getCounterNumber() {
            var values = self.counterStore.currentPageCounters[name];
            return (values && values.length) ? values[values.length - 1] : null;
        }
        var expr = new adapt.expr.Native(this.pageScope, () => format(getCounterNumber()), "page-counter-" + name);

        function arrayFormat(arr) { return format(arr[0]); }
        this.counterStore.registerPageCounterExpr(name, arrayFormat, expr);

        return expr;
    };

    /**
     * @override
     */
    CounterResolver.prototype.getPageCountersVal = function(name, format) {
        var self = this;
        function getCounterNumbers() {
            return self.counterStore.currentPageCounters[name] || [];
        }
        var expr = new adapt.expr.Native(this.pageScope, () => format(getCounterNumbers()), "page-counters-" + name);
        this.counterStore.registerPageCounterExpr(name, format, expr);
        return expr;
    };

    /**
     * Returns (non page-based) counter values for an element with the specified ID.
     * Returns null if the style of the elements has not been calculated yet (i.e. the element does not exit or it is in a source document which is not loaded yet).
     * @private
     * @param {?string} id Original ID value
     * @param {string} transformedId ID transformed by DocumentURLTransformer to handle a reference across multiple source documents
     * @param {boolean} lookForElement If true, look ahead for an element with the ID in the current source document when such an element has not appeared yet. Do not set to true during Styler.styleUntil is being called, since in that case Styler.styleUntil can be called again and may lead to internal inconsistency.
     * @returns {?adapt.csscasc.CounterValues}
     */
    CounterResolver.prototype.getTargetCounters = function(id, transformedId, lookForElement) {
        var targetCounters = this.counterStore.countersById[transformedId];
        if (!targetCounters && lookForElement && id) {
            this.styler.styleUntilIdIsReached(id);
            targetCounters = this.counterStore.countersById[transformedId];
        }
        return targetCounters || null;
    };

    /**
     * Returns page-based counter values for an element with the specified ID.
     * Returns null if the element has not been laid out yet.
     * @private
     * @param {string} transformedId ID transformed by DocumentURLTransformer to handle a reference across multiple source documents
     * @returns {?adapt.csscasc.CounterValues}
     */
    CounterResolver.prototype.getTargetPageCounters = function(transformedId) {
        if (this.counterStore.currentPage.elementsById[transformedId]) {
            return this.counterStore.currentPageCounters;
        } else {
            return this.counterStore.pageCountersById[transformedId] || null;
        }
    };

    /**
     * @override
     */
    CounterResolver.prototype.getTargetCounterVal = function(url, name, format) {
        var id = this.getFragment(url);
        var transformedId = this.getTransformedId(url);

        // Since this method is executed during Styler.styleUntil is being called, set false to lookForElement argument.
        var counters = this.getTargetCounters(id, transformedId, false);
        if (counters && counters[name]) {
            // Since an element-based counter is defined, any page-based counter is obscured even if it exists.
            var countersOfName = counters[name];
            return new adapt.expr.Const(this.rootScope, format(countersOfName[countersOfName.length - 1] || null));
        }

        var self = this;
        return new adapt.expr.Native(this.pageScope, () => {
            // Since This block is evaluated during layout, lookForElement argument can be set to true.
            counters = self.getTargetCounters(id, transformedId, true);
            if (counters) {
                if (counters[name]) {
                    // Since an element-based counter is defined, any page-based counter is obscured even if it exists.
                    var countersOfName = counters[name];
                    return format(countersOfName[countersOfName.length - 1] || null);
                } else {
                    var pageCounters = self.getTargetPageCounters(transformedId);
                    if (pageCounters) {
                        // The target element has already been laid out.
                        self.counterStore.resolveReference(transformedId);
                        if (pageCounters[name]) {
                            var pageCountersOfName = pageCounters[name];
                            return format(pageCountersOfName[pageCountersOfName.length - 1] || null);
                        } else {
                            // No corresponding counter with the name.
                            return format(0);
                        }
                    } else {
                        // The target element has not been laid out yet.
                        self.counterStore.saveReferenceOfCurrentPage(transformedId, false);
                        return "??"; // TODO more reasonable placeholder?
                    }
                }
            } else {
                // The style of target element has not been calculated yet.
                // (The element is in another source document that is not parsed yet)
                self.counterStore.saveReferenceOfCurrentPage(transformedId, false);
                return "??"; // TODO more reasonable placeholder?
            }
        }, "target-counter-" + name + "-of-" + url);
    };

    /**
     * @override
     */
    CounterResolver.prototype.getTargetCountersVal = function(url, name, format) {
        var id = this.getFragment(url);
        var transformedId = this.getTransformedId(url);
        var self = this;
        return new adapt.expr.Native(this.pageScope, () => {
            var pageCounters = self.getTargetPageCounters(transformedId);
            if (!pageCounters) {
                // The target element has not been laid out yet.
                self.counterStore.saveReferenceOfCurrentPage(transformedId, false);
                return "??"; // TODO more reasonable placeholder?
            } else {
                self.counterStore.resolveReference(transformedId);
                var pageCountersOfName = pageCounters[name] || [];
                var elementCounters = self.getTargetCounters(id, transformedId, true);
                var elementCountersOfName = elementCounters[name] || [];
                return format(pageCountersOfName.concat(elementCountersOfName));
            }
        }, "target-counters-" + name + "-of-" + url);
    };

    /**
     * @param {!adapt.base.DocumentURLTransformer} documentURLTransformer
     * @constructor
     */
    vivliostyle.counters.CounterStore = function(documentURLTransformer) {
        /** @const */ this.documentURLTransformer = documentURLTransformer;
        /** @const {!Object.<string, !adapt.csscasc.CounterValues>} */ this.countersById = {};
        /** @const {!Object.<string, !adapt.csscasc.CounterValues>} */ this.pageCountersById = {};
        /** @type {!adapt.csscasc.CounterValues} */ this.currentPageCounters = {};
        this.currentPageCounters["page"] = [0];
        /** @type {!adapt.csscasc.CounterValues} */ this.previousPageCounters = {};
        /** @const {!Array<!adapt.csscasc.CounterValues>} */ this.currentPageCountersStack = [];
        /** @const {!Object<string, !{spineIndex: number, pageIndex: number}>} */ this.pageIndicesById = {};
        /** @type {adapt.vtree.Page} */ this.currentPage = null;
        /** @const {!Array<!vivliostyle.counters.TargetCounterReference>} */ this.newReferencesOfCurrentPage = [];
        /** @type {!Array<!vivliostyle.counters.TargetCounterReference>} */ this.referencesToSolve = [];
        /** @type {!Array<!Array<!vivliostyle.counters.TargetCounterReference>>} */ this.referencesToSolveStack = [];
        /** @const {!Object<string, !Array<vivliostyle.counters.TargetCounterReference>>} */ this.unresolvedReferences = {};
        /** @const {!Object<string, !Array<vivliostyle.counters.TargetCounterReference>>} */ this.resolvedReferences = {};
        /** @private @const {!Array<{expr: !adapt.expr.Val, format: function(!Array<number>):string}>} */ this.pagesCounterExprs = [];
    };

    /**
     * @param {string} baseURL
     * @returns {!adapt.csscasc.CounterListener}
     */
    vivliostyle.counters.CounterStore.prototype.createCounterListener = function(baseURL) {
        return new CounterListener(this, baseURL);
    };

    /**
     * @param {string} baseURL
     * @param {adapt.expr.LexicalScope} rootScope
     * @param {adapt.expr.LexicalScope} pageScope
     * @returns {!adapt.csscasc.CounterResolver}
     */
    vivliostyle.counters.CounterStore.prototype.createCounterResolver = function(baseURL, rootScope, pageScope) {
        return new CounterResolver(this, baseURL, rootScope, pageScope);
    };

    /**
     * @param {adapt.vtree.Page} page
     */
    vivliostyle.counters.CounterStore.prototype.setCurrentPage = function(page) {
        this.currentPage = page;
    };

    /**
     * @private
     * @param {string} counterName
     * @param {number} value
     */
    vivliostyle.counters.CounterStore.prototype.definePageCounter = function(counterName, value) {
        if (this.currentPageCounters[counterName]) {
            this.currentPageCounters[counterName].push(value);
        } else {
            this.currentPageCounters[counterName] = [value];
        }
    };

    /**
     * Forcefully set the `page` page-based counter to the specified value.
     * @param {number} pageNumber
     */
    vivliostyle.counters.CounterStore.prototype.forceSetPageCounter = function(pageNumber) {
        var counters = this.currentPageCounters["page"];
        if (!counters || !counters.length) {
            this.currentPageCounters["page"] = [pageNumber];
        } else {
            counters[counters.length - 1] = pageNumber;
        }
    };

    /**
     * Update the page-based counters with 'counter-reset' and 'counter-increment' properties within the page context. Call before starting layout of the page.
     * @param {!adapt.csscasc.ElementStyle} cascadedPageStyle
     * @param {!adapt.expr.Context} context
     */
    vivliostyle.counters.CounterStore.prototype.updatePageCounters = function(cascadedPageStyle, context) {
        // Save page counters to previousPageCounters before updating
        this.previousPageCounters = cloneCounterValues(this.currentPageCounters);

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
                this.definePageCounter(resetCounterName, resetMap[resetCounterName]);
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
            if (!this.currentPageCounters[incrementCounterName]) {
                this.definePageCounter(incrementCounterName, 0);
            }
            var counterValues = this.currentPageCounters[incrementCounterName];
            counterValues[counterValues.length - 1] += incrementMap[incrementCounterName];
        }
    };

    /**
     * Save current page-based counters values and set them to the values passed in.
     * The saved counter values can be restored by popPageCounters method.
     * @param {!adapt.csscasc.CounterValues} counters
     */
    vivliostyle.counters.CounterStore.prototype.pushPageCounters = function(counters) {
        this.currentPageCountersStack.push(this.currentPageCounters);
        this.currentPageCounters = cloneCounterValues(counters);
    };

    /**
     * Restore previously saved page-based counter values.
     */
    vivliostyle.counters.CounterStore.prototype.popPageCounters = function() {
        this.currentPageCounters = this.currentPageCountersStack.pop();
    };

    /**
     * Resolve a reference with the specified ID.
     * @param {string} id
     */
    vivliostyle.counters.CounterStore.prototype.resolveReference = function(id) {
        var unresolvedRefs = this.unresolvedReferences[id];
        var resolvedRefs = this.resolvedReferences[id];
        if (!resolvedRefs) {
            resolvedRefs = this.resolvedReferences[id] = [];
        }
        var pushed = false;
        for (var i = 0; i < this.referencesToSolve.length;) {
            var ref = this.referencesToSolve[i];
            if (ref.targetId === id) {
                ref.resolve();
                this.referencesToSolve.splice(i, 1);
                if (unresolvedRefs) {
                    var j = unresolvedRefs.indexOf(ref);
                    if (j >= 0) {
                        unresolvedRefs.splice(j, 1);
                    }
                }
                resolvedRefs.push(ref);
                pushed = true;
            } else {
                i++;
            }
        }
        if (!pushed) {
            this.saveReferenceOfCurrentPage(id, true);
        }
    };

    /**
     * Save a reference appeared in the current page.
     * @param {string} id
     * @param {boolean} resolved If the reference is already resolved or not.
     */
    vivliostyle.counters.CounterStore.prototype.saveReferenceOfCurrentPage = function(id, resolved) {
        if (!this.newReferencesOfCurrentPage.some(ref => ref.targetId === id)) {
            var ref = new vivliostyle.counters.TargetCounterReference(id, resolved);
            this.newReferencesOfCurrentPage.push(ref);
        }
    };

    /**
     * Finish the current page; elements with ID are collected and saved with current page-based counter values internally.
     * @param {number} spineIndex Index of the currently laid out spine item
     * @param {number} pageIndex Index of the currently laid out page in its spine item
     */
    vivliostyle.counters.CounterStore.prototype.finishPage = function(spineIndex, pageIndex) {
        var ids = Object.keys(this.currentPage.elementsById);
        if (ids.length > 0) {
            var currentPageCounters = cloneCounterValues(this.currentPageCounters);
            ids.forEach(function(id) {
                this.pageCountersById[id] = currentPageCounters;
                var oldPageIndex = this.pageIndicesById[id];
                if (oldPageIndex && oldPageIndex.pageIndex < pageIndex) {
                    var resolvedRefs = this.resolvedReferences[id];
                    if (resolvedRefs) {
                        var unresolvedRefs = this.unresolvedReferences[id];
                        if (!unresolvedRefs) {
                            unresolvedRefs = this.unresolvedReferences[id] = [];
                        }
                        var ref;
                        while (ref = resolvedRefs.shift()) {
                            ref.unresolve();
                            unresolvedRefs.push(ref);
                        }
                    }
                }
                this.pageIndicesById[id] = {spineIndex: spineIndex, pageIndex: pageIndex};
            }, this);
        }

        var prevPageCounters = this.previousPageCounters;
        var ref;
        while (ref = this.newReferencesOfCurrentPage.shift()) {
            ref.pageCounters = prevPageCounters;
            ref.spineIndex = spineIndex;
            ref.pageIndex = pageIndex;
            var arr;
            if (ref.isResolved()) {
                arr = this.resolvedReferences[ref.targetId];
                if (!arr) {
                    arr = this.resolvedReferences[ref.targetId] = [];
                }
            } else {
                arr = this.unresolvedReferences[ref.targetId];
                if (!arr) {
                    arr = this.unresolvedReferences[ref.targetId] = [];
                }
            }
            if (arr.every(r => !ref.equals(r))) {
                arr.push(ref);
            }
        }

        this.currentPage = null;
    };

    /**
     * Returns unresolved references pointing to the specified page.
     * @param {adapt.vtree.Page} page
     * @returns {!Array<{spineIndex: number, pageIndex: number, pageCounters: !adapt.csscasc.CounterValues, refs: !Array<!vivliostyle.counters.TargetCounterReference>}>}
     */
    vivliostyle.counters.CounterStore.prototype.getUnresolvedRefsToPage = function(page) {
        var refs = [];
        var ids = Object.keys(page.elementsById);
        ids.forEach(function(id) {
            var idRefs = this.unresolvedReferences[id];
            if (idRefs) {
                refs = refs.concat(idRefs);
            }
        }, this);
        refs.sort((r1, r2) => (r1.spineIndex - r2.spineIndex) || (r1.pageIndex - r2.pageIndex));
        var result = [];
        var o = null;
        refs.forEach(ref => {
            if (!o || o.spineIndex !== ref.spineIndex || o.pageIndex !== ref.pageIndex) {
                o = {
                    spineIndex: ref.spineIndex,
                    pageIndex: ref.pageIndex,
                    pageCounters: ref.pageCounters,
                    refs: [ref]
                };
                result.push(o);
            } else {
                o.refs.push(ref);
            }
        });
        return result;
    };

    /**
     * Save current references to solve and set them to the values passed in.
     * The saved references can be restored by popReferencesToSolve method.
     * @param {!Array<!vivliostyle.counters.TargetCounterReference>} refs
     */
    vivliostyle.counters.CounterStore.prototype.pushReferencesToSolve = function(refs) {
        this.referencesToSolveStack.push(this.referencesToSolve);
        this.referencesToSolve = refs;
    };

    /**
     * Restore previously saved references to solve.
     */
    vivliostyle.counters.CounterStore.prototype.popReferencesToSolve = function() {
        this.referencesToSolve = this.referencesToSolveStack.pop();
    };

    vivliostyle.counters.PAGES_COUNTER_ATTR = "data-vivliostyle-pages-counter";

    /**
     * @param {string} name
     * @param {function(!Array<number>):string} format
     * @param {!adapt.expr.Val} expr
     */
    vivliostyle.counters.CounterStore.prototype.registerPageCounterExpr = function(name, format, expr) {
        if (name === "pages")
            this.pagesCounterExprs.push({expr: expr, format: format});
    };

    /**
     * @returns {!adapt.vtree.ExprContentListener}
     */
    vivliostyle.counters.CounterStore.prototype.getExprContentListener = function() {
        return this.exprContentListener.bind(this);
    };

    /**
     * @private
     * @type {adapt.vtree.ExprContentListener}
     */
    vivliostyle.counters.CounterStore.prototype.exprContentListener = function(expr, val, document) {
        var found = this.pagesCounterExprs.findIndex(o => o.expr === expr) >= 0;
        if (found) {
            var node = document.createElement("span");
            node.textContent = val;
            node.setAttribute(vivliostyle.counters.PAGES_COUNTER_ATTR, expr.key);
            return node;
        } else {
            return null;
        }
    };

    /**
     * @param {!adapt.vgen.Viewport} viewport
     */
    vivliostyle.counters.CounterStore.prototype.finishLastPage = function(viewport) {
        var nodes = viewport.root.querySelectorAll("[" + vivliostyle.counters.PAGES_COUNTER_ATTR + "]");
        var pages = this.currentPageCounters["page"][0];
        Array.from(nodes).forEach(function(node) {
            var key = node.getAttribute(vivliostyle.counters.PAGES_COUNTER_ATTR);
            var i = this.pagesCounterExprs.findIndex(o => o.expr.key === key);
            goog.asserts.assert(i >= 0);
            node.textContent = this.pagesCounterExprs[i].format([pages]);
        }, this);
    };

    /**
     * @param {!vivliostyle.counters.CounterStore} counterStore
     * @param {number} pageIndex
     * @constructor
     * @implements {adapt.layout.LayoutConstraint}
     */
    function LayoutConstraint(counterStore, pageIndex) {
        /** @const */ this.counterStore = counterStore;
        /** @const */ this.pageIndex = pageIndex;
    }

    /**
     * @override
     */
    LayoutConstraint.prototype.allowLayout = function(nodeContext) {
        if (!nodeContext || nodeContext.after) {
            return true;
        }
        var viewNode = nodeContext.viewNode;
        if (!viewNode || viewNode.nodeType !== 1) {
            return true;
        }
        var id = viewNode.getAttribute("id") || viewNode.getAttribute("name");
        if (!id) {
            return true;
        }
        if (!this.counterStore.resolvedReferences[id] && !this.counterStore.unresolvedReferences[id]) {
            return true;
        }
        var pageIndex = this.counterStore.pageIndicesById[id];
        if (!pageIndex) {
            return true;
        }
        return this.pageIndex >= pageIndex.pageIndex;
    };

    /**
     * @param {number} pageIndex
     * @returns {!adapt.layout.LayoutConstraint}
     */
    vivliostyle.counters.CounterStore.prototype.createLayoutConstraint = function(pageIndex) {
        return new LayoutConstraint(this, pageIndex);
    };
});
