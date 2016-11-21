/**
 * Copyright 2016 Vivliostyle Inc.
 * @fileoverview Utilities related to layout.
 */
goog.provide("vivliostyle.layoututil");

goog.require("adapt.task");
goog.require("adapt.vtree");
goog.require("vivliostyle.break");
goog.require("adapt.layout");

goog.scope(function() {
    /**
     * @typedef {{nodeContext: adapt.vtree.NodeContext, atUnforcedBreak: boolean, break: boolean}}
     */
    vivliostyle.layoututil.LayoutIteratorState;

    /**
     * @constructor
     */
    vivliostyle.layoututil.LayoutIteratorStrategy = function() {};
    /** @const */ var LayoutIteratorStrategy = vivliostyle.layoututil.LayoutIteratorStrategy;

    /**
     * @param {!adapt.vtree.NodeContext} initialNodeContext
     * @return {!vivliostyle.layoututil.LayoutIteratorState}
     */
    LayoutIteratorStrategy.prototype.initialState = function(initialNodeContext) {
        return {
            nodeContext: initialNodeContext,
            atUnforcedBreak: false,
            break: false
        };
    };

    /**
     * @param {!vivliostyle.layoututil.LayoutIteratorState} state
     * @return {undefined|adapt.task.Result<boolean>}
     */
    LayoutIteratorStrategy.prototype.startNonDisplayableNode = function(state) {};

    /**
     * @param {!vivliostyle.layoututil.LayoutIteratorState} state
     * @return {undefined|adapt.task.Result<boolean>}
     */
    LayoutIteratorStrategy.prototype.afterNonDisplayableNode = function(state) {};

    /**
     * @param {!vivliostyle.layoututil.LayoutIteratorState} state
     * @return {undefined|adapt.task.Result<boolean>}
     */
    LayoutIteratorStrategy.prototype.startIgnoredTextNode = function(state) {};

    /**
     * @param {!vivliostyle.layoututil.LayoutIteratorState} state
     * @return {undefined|adapt.task.Result<boolean>}
     */
    LayoutIteratorStrategy.prototype.afterIgnoredTextNode = function(state) {};

    /**
     * @param {!vivliostyle.layoututil.LayoutIteratorState} state
     * @return {undefined|adapt.task.Result<boolean>}
     */
    LayoutIteratorStrategy.prototype.startNonElementNode = function(state) {};

    /**
     * @param {!vivliostyle.layoututil.LayoutIteratorState} state
     * @return {undefined|adapt.task.Result<boolean>}
     */
    LayoutIteratorStrategy.prototype.afterNonElementNode = function(state) {};

    /**
     * @param {!vivliostyle.layoututil.LayoutIteratorState} state
     * @return {undefined|adapt.task.Result<boolean>}
     */
    LayoutIteratorStrategy.prototype.startInlineElementNode = function(state) {};

    /**
     * @param {!vivliostyle.layoututil.LayoutIteratorState} state
     * @return {undefined|adapt.task.Result<boolean>}
     */
    LayoutIteratorStrategy.prototype.afterInlineElementNode = function(state) {};

    /**
     * @param {!vivliostyle.layoututil.LayoutIteratorState} state
     * @return {undefined|adapt.task.Result<boolean>}
     */
    LayoutIteratorStrategy.prototype.startNonInlineElementNode = function(state) {};

    /**
     * @param {!vivliostyle.layoututil.LayoutIteratorState} state
     * @return {undefined|adapt.task.Result<boolean>}
     */
    LayoutIteratorStrategy.prototype.afterNonInlineElementNode = function(state) {};

    /**
     * @param {!vivliostyle.layoututil.LayoutIteratorState} state
     * @return {undefined|adapt.task.Result<boolean>}
     */
    LayoutIteratorStrategy.prototype.finish = function(state) {};

    /**
     * @param {!vivliostyle.layoututil.LayoutIteratorStrategy} strategy
     * @param {!adapt.vtree.LayoutContext} layoutContext
     * @constructor
     */
    vivliostyle.layoututil.LayoutIterator = function(strategy, layoutContext) {
        /** @private @const */ this.strategy = strategy;
        /** @private @const */ this.layoutContext = layoutContext;
    };
    /** @const */ var LayoutIterator = vivliostyle.layoututil.LayoutIterator;

    /**
     * @param {!adapt.vtree.NodeContext} initialNodeContext
     * @return {!adapt.task.Result<adapt.vtree.NodeContext>}
     */
    LayoutIterator.prototype.iterate = function(initialNodeContext) {
        /** @const */ var strategy = this.strategy;
        /** @const */ var state = strategy.initialState(initialNodeContext);
        /** @const {!adapt.task.Frame<adapt.vtree.NodeContext>} */ var frame = adapt.task.newFrame("LayoutIterator");
        frame.loopWithFrame(function(loopFrame) {
            var r;
            while (state.nodeContext) {
                if (!state.nodeContext.viewNode) {
                    if (state.nodeContext.after) {
                        r = strategy.afterNonDisplayableNode(state);
                    } else {
                        r = strategy.startNonDisplayableNode(state);
                    }
                } else if (state.nodeContext.viewNode.nodeType !== 1) {
                    if (adapt.vtree.canIgnore(state.nodeContext.viewNode, state.nodeContext.whitespace)) {
                        if (state.nodeContext.after) {
                            r = strategy.afterIgnoredTextNode(state);
                        } else {
                            r = strategy.startIgnoredTextNode(state);
                        }
                    } else {
                        if (state.nodeContext.after) {
                            r = strategy.afterNonElementNode(state);
                        } else {
                            r = strategy.startNonElementNode(state);
                        }
                    }
                } else {
                    if (state.nodeContext.inline) {
                        if (state.nodeContext.after) {
                            r = strategy.afterInlineElementNode(state);
                        } else {
                            r = strategy.startInlineElementNode(state);
                        }
                    } else {
                        if (state.nodeContext.after) {
                            r = strategy.afterNonInlineElementNode(state);
                        } else {
                            r = strategy.startNonInlineElementNode(state);
                        }
                    }
                }
                var cont = (r && r.isPending()) ? r : adapt.task.newResult(true);
                var nextResult = cont.thenAsync(function() {
                    if (state.break) {
                        return adapt.task.newResult(null);
                    }
                    return this.layoutContext.nextInTree(state.nodeContext, state.atUnforcedBreak);
                }.bind(this));
                if (nextResult.isPending()) {
                    nextResult.then(function(nextNodeContext) {
                        if (state.break) {
                            loopFrame.breakLoop();
                        } else {
                            state.nodeContext = nextNodeContext;
                            loopFrame.continueLoop();
                        }
                    });
                    return;
                } else if (state.break) {
                    loopFrame.breakLoop();
                    return;
                } else {
                    state.nodeContext = nextResult.get();
                }
            }
            strategy.finish(state);
            loopFrame.breakLoop();
        }.bind(this)).then(function() {
            frame.finish(state.nodeContext);
        });
        return frame.result();
    };

    /**
     * @param {boolean} leadingEdge
     * @constructor
     * @extends {vivliostyle.layoututil.LayoutIteratorStrategy}
     */
    vivliostyle.layoututil.EdgeSkipper = function(leadingEdge) {
        /** @protected @const */ this.leadingEdge = leadingEdge;
    };
    /** @const */ var EdgeSkipper = vivliostyle.layoututil.EdgeSkipper;
    goog.inherits(EdgeSkipper, LayoutIteratorStrategy);

    /**
     * @param {!vivliostyle.layoututil.LayoutIteratorState} state
     * @return {undefined|adapt.task.Result<boolean>}
     */
    EdgeSkipper.prototype.startNonInlineBox = function(state) {};

    /**
     * @param {!vivliostyle.layoututil.LayoutIteratorState} state
     * @return {undefined|adapt.task.Result<boolean>}
     */
    EdgeSkipper.prototype.endEmptyNonInlineBox = function(state) {};

    /**
     * @param {!vivliostyle.layoututil.LayoutIteratorState} state
     * @return {undefined|adapt.task.Result<boolean>}
     */
    EdgeSkipper.prototype.endNonInlineBox = function(state) {};

    /**
     * @param {!adapt.vtree.NodeContext} initialNodeContext
     * @return {!vivliostyle.layoututil.LayoutIteratorState}
     */
    EdgeSkipper.prototype.initialState = function(initialNodeContext) {
        return {
            nodeContext: initialNodeContext,
            atUnforcedBreak: !!this.leadingEdge && initialNodeContext.after,
            break: false,
            leadingEdge: this.leadingEdge,
            breakAtTheEdge: null,
            onStartEdges: false,
            leadingEdgeContexts: [],
            lastAfterNodeContext: null
        };
    };

    /**
     * @param {!vivliostyle.layoututil.LayoutIteratorState} state
     * @param {!adapt.layout.Column} column
     * @return {boolean} Returns true if a forced break occurs.
     */
    EdgeSkipper.prototype.processForcedBreak = function(state, column) {
        var needForcedBreak = !state.leadingEdge && vivliostyle.break.isForcedBreakValue(state.breakAtTheEdge);
        if (needForcedBreak) {
            var nodeContext = state.nodeContext = state.leadingEdgeContexts[0] || state.nodeContext;
            nodeContext.viewNode.parentNode.removeChild(nodeContext.viewNode);
            column.pageBreakType = state.breakAtTheEdge;
        }
        return needForcedBreak;
    };

    /**
     * @param {!vivliostyle.layoututil.LayoutIteratorState} state
     * @param {!adapt.layout.Column} column
     * @return {boolean} Returns true if the node overflows the column.
     */
    EdgeSkipper.prototype.saveEdgeAndProcessOverflow = function(state, column) {
        var overflow = column.saveEdgeAndCheckForOverflow(state.lastAfterNodeContext, null, true, state.breakAtTheEdge);
        if (overflow) {
            state.nodeContext = (state.lastAfterNodeContext || state.nodeContext).modify();
            state.nodeContext.overflow = true;
        }
        return overflow;
    };

    /**
     * @param {!vivliostyle.layoututil.LayoutIteratorState} state
     * @param {!adapt.layout.LayoutConstraint} layoutConstraint
     * @param {!adapt.layout.Column} column
     * @returns {boolean} Returns true if the layout constraint is violated.
     */
    EdgeSkipper.prototype.processLayoutConstraint = function(state, layoutConstraint, column) {
        var nodeContext = state.nodeContext;
        var violateConstraint = !layoutConstraint.allowLayout(nodeContext);
        if (violateConstraint) {
            column.saveEdgeAndCheckForOverflow(state.lastAfterNodeContext, null, false, state.breakAtTheEdge);
            nodeContext = state.nodeContext = nodeContext.modify();
            nodeContext.overflow = true;
        }
        return violateConstraint;
    };

    /**
     * @override
     */
    EdgeSkipper.prototype.startNonElementNode = function(state) {
        state.onStartEdges = false;
    };

    /**
     * @override
     */
    EdgeSkipper.prototype.startNonInlineElementNode = function(state) {
        state.leadingEdgeContexts.push(state.nodeContext.copy());
        state.breakAtTheEdge = vivliostyle.break.resolveEffectiveBreakValue(state.breakAtTheEdge, state.nodeContext.breakBefore);
        state.onStartEdges = true;
        return this.startNonInlineBox(state);
    };

    /**
     * @override
     */
    EdgeSkipper.prototype.afterNonInlineElementNode = function(state) {
        var r;
        var cont;
        if (state.onStartEdges) {
            r = this.endEmptyNonInlineBox(state);
            cont = (r && r.isPending()) ? r : adapt.task.newResult(true);
            cont = cont.thenAsync(function() {
                if (!state.break) {
                    state.leadingEdgeContexts = [];
                    state.leadingEdge = false;
                    state.atUnforcedBreak = false;
                    state.breakAtTheEdge = null;
                }
                return adapt.task.newResult(true);
            });
        } else {
            r = this.endNonInlineBox(state);
            cont = (r && r.isPending()) ? r : adapt.task.newResult(true);
        }
        return cont.thenAsync(function() {
            if (!state.break) {
                state.onStartEdges = false;
                state.lastAfterNodeContext = state.nodeContext.copy();
                state.breakAtTheEdge = vivliostyle.break.resolveEffectiveBreakValue(state.breakAtTheEdge, state.nodeContext.breakAfter);
            }
            return adapt.task.newResult(true);
        });
    };

    /**
     * Represents a "pseudo"-column nested inside a real column.
     * This class is created to handle parallel fragmented flows (e.g. table columns in a single table row).
     * A pseudo-column behaves in the same way as the original column, sharing its properties.
     * Property changes on the pseudo-column are not propagated to the original column.
     * The LayoutContext of the original column is also cloned and used by the pseudo-column,
     * not to propagate state changes of the LayoutContext caused by the pseudo-column.
     * @param {!adapt.layout.Column} column The original (parent) column
     * @param {Element} viewRoot Root element for the pseudo-column, i.e., the root of the fragmented flow.
     * @constructor
     */
    vivliostyle.layoututil.PseudoColumn = function(column, viewRoot) {
        /** @private @const */ this.column = /** @type {!adapt.layout.Column} */ (Object.create(column));
        this.column.element = viewRoot;
        this.column.layoutContext = column.layoutContext.clone();
        this.column.openAllViews = this.openAllViews.bind(this);
        this.column.findAndProcessAcceptableBreak = this.findAndProcessAcceptableBreak.bind(this);

        /** @type {adapt.vtree.NodeContext} */ this.firstOpenedPosition = null;
    };
    /** @const */ var PseudoColumn = vivliostyle.layoututil.PseudoColumn;

    /**
     * @param {adapt.vtree.ChunkPosition} chunkPosition starting position.
     * @param {boolean} leadingEdge
     * @return {adapt.task.Result.<adapt.vtree.ChunkPosition>} holding end position.
     */
    PseudoColumn.prototype.layout = function(chunkPosition, leadingEdge) {
        return this.column.layout(chunkPosition, leadingEdge);
    };

    /**
     * @param {adapt.vtree.NodePosition} position
     * @return {!adapt.task.Result.<adapt.vtree.NodeContext>}
     */
    PseudoColumn.prototype.openAllViews = function(position) {
        return adapt.layout.Column.prototype.openAllViews.call(this.column, position).thenAsync(function(nodeContext) {
            if (!this.firstOpenedPosition) {
                this.firstOpenedPosition = nodeContext;
            }
            return adapt.task.newResult(nodeContext);
        }.bind(this));
    };

    /**
     * @param {adapt.vtree.NodeContext} overflownNodeContext
     * @param {adapt.vtree.NodeContext} initialNodeContext
     * @return {adapt.task.Result.<adapt.vtree.NodeContext>}
     */
    PseudoColumn.prototype.findAndProcessAcceptableBreak = function(overflownNodeContext, initialNodeContext) {
        if (overflownNodeContext.sourceNode === initialNodeContext.sourceNode) {
            return adapt.task.newResult(/** @type {adapt.vtree.NodeContext} */ (null));
        } else {
            return adapt.layout.Column.prototype.findAndProcessAcceptableBreak.call(this.column,
                overflownNodeContext, initialNodeContext);
        }
    };
});

