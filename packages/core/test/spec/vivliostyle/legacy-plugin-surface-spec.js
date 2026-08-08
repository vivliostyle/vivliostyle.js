/**
 * Copyright 2026 Vivliostyle Foundation
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
 */

import * as vivliostyle_plugin from "../../../src/vivliostyle/plugin";
import * as vivliostyle_legacy from "../../../src/vivliostyle/legacy-plugin-surface";
import * as vivliostyle_node_context from "../../../src/vivliostyle/node-context";
import * as vivliostyle_layout_processor from "../../../src/vivliostyle/layout-processor";
import * as vivliostyle_layout from "../../../src/vivliostyle/layout";
import * as vivliostyle_break_position from "../../../src/vivliostyle/break-position";
import * as vivliostyle_vtree from "../../../src/vivliostyle/vtree";
import * as vivliostyle_break from "../../../src/vivliostyle/break";
import * as vivliostyle_task from "../../../src/vivliostyle/task";

import "../../../src/vivliostyle";

describe("legacy-plugin-surface", function () {
  "use strict";

  var hookNames = [
    "PREPROCESS_TEXT_CONTENT",
    "PREPROCESS_ELEMENT_STYLE",
    "RESOLVE_FORMATTING_CONTEXT",
    "RESOLVE_TEXT_NODE_BREAKER",
    "RESOLVE_LAYOUT_PROCESSOR",
    "POST_LAYOUT_BLOCK",
  ];

  function openTextNodeContext() {
    return vivliostyle_node_context.openAt(
      document.createTextNode("legacy"),
      null,
      3,
      new vivliostyle_layout_processor.BlockFormattingContext(null),
      {
        shadowType: vivliostyle_vtree.ShadowType.NONE,
        shadowContext: null,
      },
      { offsetInNode: 0, after: false },
    );
  }

  function elementNodeContext(overrides) {
    var opened = vivliostyle_node_context.openAt(
      document.createElement("div"),
      null,
      0,
      new vivliostyle_layout_processor.BlockFormattingContext(null),
      {
        shadowType: vivliostyle_vtree.ShadowType.NONE,
        shadowContext: null,
      },
      { offsetInNode: 0, after: false },
    );
    var rendered = vivliostyle_node_context.elementRenderResultOf(opened);
    Object.keys(overrides || {}).forEach(function (field) {
      rendered[field] = overrides[field];
    });
    return vivliostyle_node_context.renderedElement(
      opened,
      document.createElement("div"),
      rendered,
    );
  }

  function childNodeContext(parent) {
    return vivliostyle_node_context.openChildOf(
      document.createTextNode("child"),
      parent,
      1,
    );
  }

  function stubLayoutContext() {
    var layoutContext = {
      calls: [],
      cloned: null,
      rendered: null,
      setCurrent: function (nodeContext, firstTime, atUnforcedBreak) {
        layoutContext.calls.push([
          "setCurrent",
          nodeContext,
          firstTime,
          atUnforcedBreak,
        ]);
        return vivliostyle_task.newResult({
          nodeContext: layoutContext.rendered || Object.assign({}, nodeContext),
          processChildren: firstTime,
        });
      },
      clone: function () {
        return layoutContext.cloned;
      },
      applyPseudoelementStyle: function (nodeContext, pseudoName, target) {
        layoutContext.calls.push([
          "applyPseudoelementStyle",
          nodeContext,
          pseudoName,
          target,
        ]);
      },
      next: null,
      nextInTree: function (nodeContext, atUnforcedBreak) {
        layoutContext.calls.push(["nextInTree", nodeContext, atUnforcedBreak]);
        return vivliostyle_task.newResult(layoutContext.next);
      },
      peelOff: function (nodeContext, nodeOffset) {
        layoutContext.calls.push(["peelOff", nodeContext, nodeOffset]);
        return vivliostyle_task.newResult(nodeContext);
      },
    };
    return layoutContext;
  }

  function stubBreakPosition() {
    return {
      findAcceptableBreak: function () {
        return null;
      },
      getMinBreakPenalty: function () {
        return 0;
      },
      calculateOffset: function () {
        return { current: 0, minimum: 0 };
      },
      breakPositionChosen: function () {},
    };
  }

  function coreClassBreakPosition() {
    var breakPosition = Object.create(
      vivliostyle_break_position.AbstractBreakPosition.prototype,
    );
    breakPosition.findAcceptableBreak = function () {
      return null;
    };
    breakPosition.getMinBreakPenalty = function () {
      return 4;
    };
    return breakPosition;
  }

  function stubColumn() {
    var column = {
      calls: [],
      overflown: true,
      clearance: document.createElement("div"),
      layoutContext: stubLayoutContext(),
      checkOverflowAndSaveEdge: function (nodeContext, trailingEdgeContexts) {
        column.calls.push([
          "checkOverflowAndSaveEdge",
          nodeContext,
          trailingEdgeContexts,
        ]);
        return {
          overflown: column.overflown,
          recordedRepetitiveOverflow: false,
        };
      },
      applyClearance: function (nodeContext) {
        column.calls.push(["applyClearance", nodeContext]);
        return column.clearance;
      },
      processLineStyling: function (nodeContext, resNodeContext, checkPoints) {
        column.calls.push([
          "processLineStyling",
          nodeContext,
          resNodeContext,
          checkPoints,
        ]);
        return vivliostyle_task.newResult({
          nodeContext: resNodeContext,
          checkPoints: checkPoints,
        });
      },
      isOverflown: function (edge) {
        return edge > 0;
      },
      nodeContextOverflowingDueToRepetitiveElements: null,
      pseudoParent: null,
      breakPositions: [],
      nextBlockEdge: null,
      acceptableBreak: null,
      asFloatNodeContext: function (nodeContext) {
        column.calls.push(["asFloatNodeContext", nodeContext]);
        return nodeContext;
      },
      buildViewToNextBlockEdge: function (position, checkPoints) {
        column.calls.push(["buildViewToNextBlockEdge", position, checkPoints]);
        return vivliostyle_task.newResult(column.nextBlockEdge);
      },
      layoutNext: function (nodeContext, leadingEdge, forcedBreakValue) {
        column.calls.push([
          "layoutNext",
          nodeContext,
          leadingEdge,
          forcedBreakValue,
        ]);
        return vivliostyle_task.newResult(nodeContext);
      },
      doLayout: function (nodeContext, leadingEdge, breakAfter) {
        column.calls.push(["doLayout", nodeContext, leadingEdge, breakAfter]);
        return vivliostyle_task.newResult({
          nodeContext: nodeContext,
          overflownNodeContext: nodeContext,
        });
      },
      findEndOfLine: function (linePosition, checkPoints) {
        column.calls.push(["findEndOfLine", linePosition, checkPoints]);
        return { nodeContext: checkPoints[0], index: 1, checkPointIndex: 0 };
      },
      findFirstOverflowingEdgeAndCheckPoint: function (checkPoints) {
        column.calls.push([
          "findFirstOverflowingEdgeAndCheckPoint",
          checkPoints,
        ]);
        return { edge: 3, checkPoint: checkPoints[0] };
      },
      findAcceptableBreakPosition: function () {
        column.calls.push(["findAcceptableBreakPosition"]);
        return column.acceptableBreak;
      },
    };
    return column;
  }

  var columnStubScaffolding = [
    "calls",
    "clearance",
    "nextBlockEdge",
    "acceptableBreak",
  ];

  function constructedColumn() {
    var stop = {};
    var captured = null;
    var element = document.createElement("div");
    document.body.appendChild(element);
    try {
      new vivliostyle_layout.Column(
        element,
        stubLayoutContext(),
        {
          getElementClientRect: function () {
            throw stop;
          },
        },
        {
          allowLayout: function () {
            return true;
          },
        },
        {
          withContainer: function (column) {
            captured = column;
            return null;
          },
        },
        {},
        null,
        [],
        new vivliostyle_layout_processor.BlockFormattingContext(null),
      );
    } catch (e) {
      if (e !== stop) {
        throw e;
      }
    }
    element.parentNode.removeChild(element);
    return captured;
  }

  function realColumnMembers() {
    var members = Object.create(null);
    var instance = constructedColumn();
    Object.keys(instance).forEach(function (name) {
      members[name] = true;
    });
    for (
      var proto = Object.getPrototypeOf(instance);
      proto && proto !== Object.prototype;
      proto = Object.getPrototypeOf(proto)
    ) {
      Object.getOwnPropertyNames(proto).forEach(function (name) {
        members[name] = true;
      });
    }
    return members;
  }

  describe("the column stub", function () {
    it("stands in for a column the core can build", function () {
      expect(constructedColumn()).not.toBe(null);
    });

    it("declares only members the real column carries", function () {
      var members = realColumnMembers();
      expect(
        Object.keys(stubColumn()).filter(function (name) {
          return (
            columnStubScaffolding.indexOf(name) < 0 && members[name] !== true
          );
        }),
      ).toEqual([]);
    });

    it("keeps its scaffolding clear of the real column's members", function () {
      var members = realColumnMembers();
      expect(
        columnStubScaffolding.filter(function (name) {
          return members[name] === true;
        }),
      ).toEqual([]);
    });
  });

  describe("isCoreHook", function () {
    it("identifies every hook the core registered", function () {
      Object.keys(vivliostyle_plugin.HOOKS).forEach(function (name) {
        vivliostyle_plugin.getHooksForName(name).forEach(function (fn) {
          expect(vivliostyle_plugin.isCoreHook(fn)).toBe(true);
        });
      });
    });

    it("tells an externally registered hook apart wherever it sits", function () {
      var external = function () {};
      var name = "POST_LAYOUT_BLOCK";
      vivliostyle_plugin.registerHook(name, external, true);
      var registered = vivliostyle_plugin.getHooksForName(name);
      expect(registered[0]).toBe(external);
      expect(vivliostyle_plugin.isCoreHook(registered[0])).toBe(false);
      expect(vivliostyle_plugin.isCoreHook(registered[1])).toBe(true);
      vivliostyle_plugin.removeHook(name, external);
    });

    it("serves the projected column to a hook registered at the first", function () {
      var external = function () {};
      var name = "POST_LAYOUT_BLOCK";
      vivliostyle_plugin.registerHook(name, external, true);
      var registered = vivliostyle_plugin.getHooksForName(name);
      var column = stubColumn();
      expect(vivliostyle_legacy.asLegacyColumn(registered[0], column)).not.toBe(
        column,
      );
      expect(vivliostyle_legacy.asLegacyColumn(registered[1], column)).toBe(
        column,
      );
      vivliostyle_plugin.removeHook(name, external);
    });

    it("adapts the results of a processor hook registered at the first", function () {
      var external = function () {};
      var name = "RESOLVE_LAYOUT_PROCESSOR";
      vivliostyle_plugin.registerHook(name, external, true);
      var registered = vivliostyle_plugin.getHooksForName(name);
      var legacyProcessor = {};
      var formattingContext = { isFirstTime: function () {} };
      expect(
        vivliostyle_legacy.adaptLegacyLayoutProcessor(
          registered[0],
          legacyProcessor,
        ),
      ).not.toBe(legacyProcessor);
      expect(
        vivliostyle_legacy.adaptLegacyLayoutProcessor(
          registered[1],
          legacyProcessor,
        ),
      ).toBe(legacyProcessor);
      vivliostyle_plugin.removeHook(name, external);
      vivliostyle_plugin.registerHook(
        "RESOLVE_FORMATTING_CONTEXT",
        external,
        true,
      );
      var formattingHooks = vivliostyle_plugin.getHooksForName(
        "RESOLVE_FORMATTING_CONTEXT",
      );
      vivliostyle_legacy.adaptLegacyFormattingContext(
        formattingHooks[0],
        formattingContext,
      );
      expect(
        Object.prototype.hasOwnProperty.call(formattingContext, "isFirstTime"),
      ).toBe(true);
      vivliostyle_plugin.removeHook("RESOLVE_FORMATTING_CONTEXT", external);
    });
  });

  describe("noteRetained", function () {
    it("marks the value while no external hook is registered", function () {
      var nodeContext = openTextNodeContext();
      var legacy = vivliostyle_legacy.asLegacyNodeContext(
        "PREPROCESS_TEXT_CONTENT",
        nodeContext,
      );
      vivliostyle_legacy.noteRetained(nodeContext);
      var external = function () {};
      vivliostyle_plugin.registerHook("PREPROCESS_TEXT_CONTENT", external);
      expect(
        vivliostyle_legacy.asLegacyNodeContext(
          "PREPROCESS_TEXT_CONTENT",
          nodeContext,
        ).shared,
      ).toBe(true);
      vivliostyle_plugin.removeHook("PREPROCESS_TEXT_CONTENT", external);
      expect(legacy.sourceNode).toBe(nodeContext.sourceNode);
    });
  });

  describe("legacySurfaceActive", function () {
    it("is false while only the core has registered", function () {
      hookNames.forEach(function (name) {
        expect(vivliostyle_legacy.legacySurfaceActive(name)).toBe(false);
      });
    });

    it("is true while an external hook is registered", function () {
      var external = function () {};
      hookNames.forEach(function (name) {
        vivliostyle_plugin.registerHook(name, external);
        expect(vivliostyle_legacy.legacySurfaceActive(name)).toBe(true);
        vivliostyle_plugin.removeHook(name, external);
        expect(vivliostyle_legacy.legacySurfaceActive(name)).toBe(false);
      });
    });

    it("is true while an external hook is registered at the first", function () {
      var external = function () {};
      hookNames.forEach(function (name) {
        vivliostyle_plugin.registerHook(name, external, true);
        expect(vivliostyle_legacy.legacySurfaceActive(name)).toBe(true);
        vivliostyle_plugin.removeHook(name, external);
        expect(vivliostyle_legacy.legacySurfaceActive(name)).toBe(false);
      });
    });
  });

  describe("asLegacyNodeContext", function () {
    var hookName = "PREPROCESS_TEXT_CONTENT";
    var external = function () {};

    beforeEach(function () {
      vivliostyle_plugin.registerHook(hookName, external);
    });

    afterEach(function () {
      vivliostyle_plugin.removeHook(hookName, external);
    });

    it("hands out the value itself", function () {
      var nodeContext = openTextNodeContext();
      expect(
        vivliostyle_legacy.asLegacyNodeContext(hookName, nodeContext),
      ).toBe(nodeContext);
    });

    it("restores the removed members", function () {
      var legacy = vivliostyle_legacy.asLegacyNodeContext(
        hookName,
        openTextNodeContext(),
      );
      expect(legacy.copy()).toBe(legacy);
      expect(legacy.isInsideBFC()).toBe(false);
      expect(legacy.getContainingBlockForAbsolute()).toBe(null);
      expect(legacy.toNodePositionStep().node).toBe(legacy.sourceNode);
      expect(legacy.toNodePosition().steps.length).toBe(1);
      expect(legacy.belongsTo(legacy.formattingContext)).toBe(false);
    });

    it("decorates a shadow sibling a decorated value gains later", function () {
      var nodeContext = openTextNodeContext();
      vivliostyle_legacy.asLegacyNodeContext(hookName, nodeContext);
      var sibling = openTextNodeContext();
      nodeContext.shadowSibling = sibling;
      vivliostyle_legacy.asLegacyNodeContext(hookName, nodeContext);
      expect(typeof sibling.copy).toBe("function");
    });

    it("decorates a block container a decorated value gains later", function () {
      var nodeContext = openTextNodeContext();
      vivliostyle_legacy.asLegacyNodeContext(hookName, nodeContext);
      var container = elementNodeContext();
      nodeContext.blockContainer = container;
      vivliostyle_legacy.asLegacyNodeContext(hookName, nodeContext);
      expect(typeof container.copy).toBe("function");
    });

    it("decorates a shadow sibling cycle without running away", function () {
      var first = openTextNodeContext();
      var second = openTextNodeContext();
      first.shadowSibling = second;
      second.shadowSibling = first;
      vivliostyle_legacy.asLegacyNodeContext(hookName, first);
      expect(typeof first.copy).toBe("function");
      expect(typeof second.copy).toBe("function");
    });

    it("reports shared from the core's retention of the value", function () {
      var nodeContext = openTextNodeContext();
      var legacy = vivliostyle_legacy.asLegacyNodeContext(
        hookName,
        nodeContext,
      );
      expect(legacy.shared).toBe(false);
      expect(vivliostyle_legacy.noteRetained(nodeContext)).toBeUndefined();
      expect(legacy.shared).toBe(true);
    });

    it("marks the value on copy, as the class did", function () {
      var legacy = vivliostyle_legacy.asLegacyNodeContext(
        hookName,
        openTextNodeContext(),
      );
      expect(legacy.shared).toBe(false);
      expect(legacy.copy()).toBe(legacy);
      expect(legacy.shared).toBe(true);
    });

    it("modifies in place while the core does not keep the value", function () {
      var legacy = vivliostyle_legacy.asLegacyNodeContext(
        hookName,
        openTextNodeContext(),
      );
      expect(legacy.modify()).toBe(legacy);
    });

    it("modifies into a separate value once the core keeps it", function () {
      var nodeContext = openTextNodeContext();
      var legacy = vivliostyle_legacy.asLegacyNodeContext(
        hookName,
        nodeContext,
      );
      vivliostyle_legacy.noteRetained(nodeContext);
      legacy.display = "block";
      var modified = legacy.modify();
      expect(modified).not.toBe(legacy);
      expect(modified.sourceNode).toBe(legacy.sourceNode);
      expect(modified.boxOffset).toBe(legacy.boxOffset);
      expect(modified.display).toBe("block");
      expect(modified.shared).toBe(false);
      modified.display = "inline";
      expect(legacy.display).toBe("block");
    });

    it("takes plugin writes on the value the core keeps", function () {
      var nodeContext = openTextNodeContext();
      var legacy = vivliostyle_legacy.asLegacyNodeContext(
        hookName,
        nodeContext,
      );
      legacy.overflow = true;
      expect(nodeContext.overflow).toBe(true);
    });

    it("resets the view in place and retags the value", function () {
      var nodeContext = openTextNodeContext();
      var legacy = vivliostyle_legacy.asLegacyNodeContext(
        hookName,
        nodeContext,
      );
      legacy.after = true;
      legacy.fragmentIndex = 4;
      legacy.resetView();
      expect(nodeContext.after).toBe(false);
      expect(nodeContext.viewNode).toBe(null);
      expect(nodeContext.fragmentIndex).toBe(1);
      expect(nodeContext.kind).toBe("open");
    });

    it("marks the ancestors on copy, as the class did", function () {
      var parent = elementNodeContext();
      var legacy = vivliostyle_legacy.asLegacyNodeContext(
        hookName,
        childNodeContext(parent),
      );
      expect(legacy.parent.shared).toBe(false);
      legacy.copy();
      expect(legacy.shared).toBe(true);
      expect(legacy.parent.shared).toBe(true);
    });

    it("assigns shared to the value alone", function () {
      var parent = elementNodeContext();
      var legacy = vivliostyle_legacy.asLegacyNodeContext(
        hookName,
        childNodeContext(parent),
      );
      legacy.shared = true;
      expect(legacy.shared).toBe(true);
      expect(legacy.parent.shared).toBe(false);
    });

    it("clears shared on the value alone", function () {
      var parent = elementNodeContext();
      var legacy = vivliostyle_legacy.asLegacyNodeContext(
        hookName,
        childNodeContext(parent),
      );
      legacy.copy();
      legacy.shared = false;
      expect(legacy.shared).toBe(false);
      expect(legacy.parent.shared).toBe(true);
    });

    it("keeps shared off the value's own fields", function () {
      var legacy = vivliostyle_legacy.asLegacyNodeContext(
        hookName,
        openTextNodeContext(),
      );
      legacy.copy();
      var spread = { ...legacy };
      expect(Object.keys(legacy).indexOf("shared")).toBe(-1);
      expect(Object.prototype.hasOwnProperty.call(spread, "shared")).toBe(
        false,
      );
      expect(spread.shared).toBeUndefined();
    });

    it("gives each cloned chain item its own plugin properties", function () {
      var parent = elementNodeContext();
      var legacy = vivliostyle_legacy.asLegacyNodeContext(
        hookName,
        childNodeContext(parent),
      );
      legacy.pluginProps.mark = "self";
      legacy.parent.pluginProps.mark = "parent";
      var cloned = legacy.clone();
      expect(cloned).not.toBe(legacy);
      expect(cloned.pluginProps).not.toBe(legacy.pluginProps);
      expect(cloned.parent).not.toBe(legacy.parent);
      expect(cloned.parent.pluginProps).not.toBe(legacy.parent.pluginProps);
      cloned.pluginProps.mark = "clone";
      cloned.parent.pluginProps.mark = "clone";
      expect(legacy.pluginProps.mark).toBe("self");
      expect(legacy.parent.pluginProps.mark).toBe("parent");
    });

    it("refreshes the break fields at every boundary", function () {
      var nodeContext = elementNodeContext({
        breakBefore: "column",
        breakAfter: "column",
      });
      var legacy = vivliostyle_legacy.asLegacyNodeContext(
        hookName,
        nodeContext,
      );
      expect(legacy.breakBefore).toBe("column");
      expect(legacy.breakAfter).toBe("column");
      vivliostyle_break.suppressColumnBreakBefore(nodeContext.viewNode);
      vivliostyle_break.suppressColumnBreakAfter(nodeContext.viewNode);
      expect(legacy.breakBefore).toBe("column");
      vivliostyle_legacy.asLegacyNodeContext(hookName, nodeContext);
      expect(legacy.breakBefore).toBe(null);
      expect(legacy.breakAfter).toBe(null);
    });

    it("refreshes the break fields of a shadow sibling at every boundary", function () {
      var nodeContext = elementNodeContext({
        breakBefore: "column",
        breakAfter: "column",
      });
      var sibling = elementNodeContext({
        breakBefore: "column",
        breakAfter: "column",
      });
      nodeContext.shadowSibling = sibling;
      vivliostyle_legacy.asLegacyNodeContext(hookName, nodeContext);
      expect(sibling.breakBefore).toBe("column");
      vivliostyle_break.suppressColumnBreakBefore(sibling.viewNode);
      vivliostyle_break.suppressColumnBreakAfter(sibling.viewNode);
      vivliostyle_legacy.asLegacyNodeContext(hookName, nodeContext);
      expect(sibling.breakBefore).toBe(null);
      expect(sibling.breakAfter).toBe(null);
    });

    it("lifts the suppression a boundary wrote onto the break fields", function () {
      var nodeContext = elementNodeContext({
        breakBefore: "column",
        breakAfter: "column",
      });
      vivliostyle_legacy.asLegacyNodeContext(hookName, nodeContext);
      vivliostyle_break.suppressColumnBreakBefore(nodeContext.viewNode);
      vivliostyle_break.suppressColumnBreakAfter(nodeContext.viewNode);
      var legacy = vivliostyle_legacy.asLegacyNodeContext(
        hookName,
        nodeContext,
      );
      expect(legacy.breakBefore).toBe(null);
      expect(legacy.breakAfter).toBe(null);
      vivliostyle_break.unsuppressColumnBreakBefore(nodeContext.viewNode);
      vivliostyle_break.unsuppressColumnBreakAfter(nodeContext.viewNode);
      expect(vivliostyle_break.effectiveBreakBefore(nodeContext)).toBe(
        "column",
      );
      expect(vivliostyle_break.effectiveBreakAfter(nodeContext)).toBe("column");
      vivliostyle_legacy.asLegacyNodeContext(hookName, nodeContext);
      expect(legacy.breakBefore).toBe("column");
      expect(legacy.breakAfter).toBe("column");
    });

    it("suppresses again a break field a hook wrote back", function () {
      var nodeContext = elementNodeContext({ breakBefore: "column" });
      var legacy = vivliostyle_legacy.asLegacyNodeContext(
        hookName,
        nodeContext,
      );
      vivliostyle_break.suppressColumnBreakBefore(nodeContext.viewNode);
      vivliostyle_legacy.asLegacyNodeContext(hookName, nodeContext);
      expect(legacy.breakBefore).toBe(null);
      legacy.breakBefore = "column";
      expect(legacy.breakBefore).toBe("column");
      vivliostyle_legacy.asLegacyNodeContext(hookName, nodeContext);
      expect(legacy.breakBefore).toBe(null);
    });

    it("restores every unstyled field on resetView", function () {
      var legacy = vivliostyle_legacy.asLegacyNodeContext(
        hookName,
        elementNodeContext(),
      );
      var written = {
        floatReference: "page",
        clearSide: "left",
        floatMinWrapBlock: {},
        columnSpan: {},
        flexContainer: true,
        containingBlockForAbsolute: true,
        breakAfter: "page",
        repeatOnBreak: "header",
        afterIfContinues: {},
        footnotePolicy: {},
      };
      var initial = {};
      Object.keys(written).forEach(function (field) {
        initial[field] = legacy[field];
        legacy[field] = written[field];
        expect(legacy[field]).toBe(written[field]);
      });
      legacy.resetView();
      Object.keys(written).forEach(function (field) {
        expect(legacy[field]).toBe(initial[field]);
      });
    });

    it("decorates the shadow sibling and the block container", function () {
      var sibling = elementNodeContext();
      var container = elementNodeContext();
      var nodeContext = {
        ...elementNodeContext(),
        shadowSibling: sibling,
        blockContainer: container,
      };
      vivliostyle_legacy.asLegacyNodeContext(hookName, nodeContext);
      expect(typeof sibling.copy).toBe("function");
      expect(typeof container.copy).toBe("function");
    });

    it("decorates the value while the external hook sits first", function () {
      var atFirst = function () {};
      var plain = elementNodeContext();
      var decorated = elementNodeContext();
      expect(
        typeof vivliostyle_legacy.asLegacyNodeContext(
          "POST_LAYOUT_BLOCK",
          plain,
        ).copy,
      ).toBe("undefined");
      vivliostyle_plugin.registerHook("POST_LAYOUT_BLOCK", atFirst, true);
      expect(
        typeof vivliostyle_legacy.asLegacyNodeContext(
          "POST_LAYOUT_BLOCK",
          decorated,
        ).copy,
      ).toBe("function");
      vivliostyle_plugin.removeHook("POST_LAYOUT_BLOCK", atFirst);
    });
  });

  describe("normalizeLegacyNodeContext", function () {
    var hookName = "PREPROCESS_TEXT_CONTENT";
    var external = function () {};

    beforeEach(function () {
      vivliostyle_plugin.registerHook(hookName, external);
    });

    afterEach(function () {
      vivliostyle_plugin.removeHook(hookName, external);
    });

    function retagged(viewNode, after) {
      var legacy = vivliostyle_legacy.asLegacyNodeContext(
        hookName,
        openTextNodeContext(),
      );
      legacy.viewNode = viewNode;
      legacy.after = after;
      return vivliostyle_legacy.normalizeLegacyNodeContext(legacy);
    }

    it("tags a viewless position from its after flag", function () {
      expect(retagged(null, false).kind).toBe("open");
      expect(retagged(null, true).kind).toBe("after-none");
    });

    it("tags an element position from its view node", function () {
      var element = document.createElement("div");
      expect(retagged(element, false).kind).toBe("element");
      expect(retagged(element, true).kind).toBe("after-element");
    });

    it("tags a text position from its view node", function () {
      var text = document.createTextNode("legacy");
      expect(retagged(text, false).kind).toBe("text");
      expect(retagged(text, true).kind).toBe("after-text");
    });

    it("hands the value itself back to the core", function () {
      var nodeContext = openTextNodeContext();
      expect(
        vivliostyle_legacy.normalizeLegacyNodeContext(
          vivliostyle_legacy.asLegacyNodeContext(hookName, nodeContext),
        ),
      ).toBe(nodeContext);
    });

    it("passes a missing value through", function () {
      expect(vivliostyle_legacy.normalizeLegacyNodeContext(null)).toBe(null);
      expect(vivliostyle_legacy.normalizeLegacyNodeContext(undefined)).toBe(
        null,
      );
    });
  });

  describe("the element narrowing", function () {
    it("narrows a value whose view node is an element", function () {
      var nodeContext = elementNodeContext();
      expect(vivliostyle_vtree.asElementNodeContext(nodeContext)).toBe(
        nodeContext,
      );
      expect(vivliostyle_vtree.asRenderedNodeContext(nodeContext)).toBe(
        nodeContext,
      );
    });

    it("rejects an element kind a plugin left without a view node", function () {
      var nodeContext = elementNodeContext();
      nodeContext.viewNode = null;
      expect(nodeContext.kind).toBe("element");
      expect(vivliostyle_vtree.asElementNodeContext(nodeContext)).toBe(null);
      expect(vivliostyle_vtree.asRenderedNodeContext(nodeContext)).toBe(null);
    });

    it("rejects an element kind a plugin pointed at a text node", function () {
      var nodeContext = elementNodeContext();
      nodeContext.viewNode = document.createTextNode("legacy");
      nodeContext.after = true;
      expect(nodeContext.kind).toBe("element");
      expect(vivliostyle_vtree.asElementNodeContext(nodeContext)).toBe(null);
    });

    it("rejects a text kind a plugin pointed at another node", function () {
      var opened = childNodeContext(elementNodeContext());
      var nodeContext = vivliostyle_node_context.renderedText(
        opened,
        document.createTextNode("legacy"),
        [],
      );
      expect(vivliostyle_vtree.asTextNodeContext(nodeContext)).toBe(
        nodeContext,
      );
      nodeContext.viewNode = document.createComment("legacy");
      expect(nodeContext.kind).toBe("text");
      expect(vivliostyle_vtree.asTextNodeContext(nodeContext)).toBe(null);
      expect(vivliostyle_vtree.asRenderedNodeContext(nodeContext)).toBe(null);
    });

    it("narrows again once the hook boundary retagged the value", function () {
      var hookName = "POST_LAYOUT_BLOCK";
      var external = function () {};
      var opened = childNodeContext(elementNodeContext());
      var nodeContext = vivliostyle_node_context.renderedElement(
        opened,
        document.createElement("span"),
        vivliostyle_node_context.elementRenderResultOf(opened),
      );
      nodeContext.viewNode = document.createTextNode("legacy");
      vivliostyle_plugin.registerHook(hookName, external);
      try {
        vivliostyle_legacy.retagLegacyNodeContext(hookName, nodeContext);
      } finally {
        vivliostyle_plugin.removeHook(hookName, external);
      }
      expect(nodeContext.kind).toBe("text");
      expect(vivliostyle_vtree.asElementNodeContext(nodeContext)).toBe(null);
      expect(vivliostyle_vtree.asTextNodeContext(nodeContext)).toBe(
        nodeContext,
      );
    });

    it("carries the guard into the narrowings built on it", function () {
      var floatContext = elementNodeContext({ floatSide: "left" });
      var clearContext = elementNodeContext({ clearSide: "left" });
      var continuesContext = elementNodeContext({ afterIfContinues: {} });
      expect(vivliostyle_vtree.asFloatNodeContext(floatContext)).toBe(
        floatContext,
      );
      expect(vivliostyle_vtree.asClearNodeContext(clearContext)).toBe(
        clearContext,
      );
      expect(
        vivliostyle_vtree.asAfterIfContinuesNodeContext(continuesContext),
      ).toBe(continuesContext);
      floatContext.viewNode = null;
      clearContext.viewNode = null;
      continuesContext.viewNode = null;
      expect(vivliostyle_vtree.asFloatNodeContext(floatContext)).toBe(null);
      expect(vivliostyle_vtree.asClearNodeContext(clearContext)).toBe(null);
      expect(
        vivliostyle_vtree.asAfterIfContinuesNodeContext(continuesContext),
      ).toBe(null);
    });
  });

  describe("retagLegacyNodeContext", function () {
    var hookName = "POST_LAYOUT_BLOCK";
    var external = function () {};

    describe("while an external hook is registered", function () {
      beforeEach(function () {
        vivliostyle_plugin.registerHook(hookName, external);
      });

      afterEach(function () {
        vivliostyle_plugin.removeHook(hookName, external);
      });

      it("retags the value a hook moved to its after edge", function () {
        var nodeContext = elementNodeContext();
        var legacy = vivliostyle_legacy.asLegacyNodeContextOrNull(
          hookName,
          nodeContext,
        );
        expect(legacy).toBe(nodeContext);
        legacy.after = true;
        vivliostyle_legacy.retagLegacyNodeContext(hookName, nodeContext);
        expect(nodeContext.kind).toBe("after-element");
      });

      it("accepts a missing value", function () {
        expect(
          vivliostyle_legacy.asLegacyNodeContextOrNull(hookName, null),
        ).toBe(null);
        expect(
          vivliostyle_legacy.retagLegacyNodeContext(hookName, null),
        ).toBeUndefined();
      });

      it("retags the checkpoints a hook rewrote", function () {
        var checkPoints = [elementNodeContext(), elementNodeContext()];
        var legacy = vivliostyle_legacy.asLegacyRenderedNodeContexts(
          hookName,
          checkPoints,
        );
        expect(legacy).toBe(checkPoints);
        expect(typeof legacy[0].copy).toBe("function");
        legacy[0].viewNode = document.createTextNode("legacy");
        legacy[1].after = true;
        vivliostyle_legacy.retagLegacyNodeContexts(hookName, checkPoints);
        expect(checkPoints[0].kind).toBe("text");
        expect(checkPoints[1].kind).toBe("after-element");
      });
    });

    describe("while only the core has registered", function () {
      it("leaves the discriminant of the value alone", function () {
        var nodeContext = elementNodeContext();
        var checkPoints = [elementNodeContext()];
        nodeContext.after = true;
        checkPoints[0].after = true;
        vivliostyle_legacy.retagLegacyNodeContext(hookName, nodeContext);
        vivliostyle_legacy.retagLegacyNodeContexts(hookName, checkPoints);
        expect(nodeContext.kind).toBe("element");
        expect(checkPoints[0].kind).toBe("element");
      });
    });
  });

  describe("asLegacyRenderContext", function () {
    var hookName = "PREPROCESS_ELEMENT_STYLE";
    var external = function () {};

    function renderContextOf(nodeContext, rendered) {
      return vivliostyle_legacy.asLegacyRenderContext(
        hookName,
        nodeContext,
        vivliostyle_node_context.elementRenderProgress(nodeContext, rendered),
        rendered,
      );
    }

    describe("while an external hook is registered", function () {
      beforeEach(function () {
        vivliostyle_plugin.registerHook(hookName, external);
      });

      afterEach(function () {
        vivliostyle_plugin.removeHook(hookName, external);
      });

      it("hands out the rendered style the core has drafted", function () {
        var nodeContext = openTextNodeContext();
        var rendered =
          vivliostyle_node_context.elementRenderResultOf(nodeContext);
        rendered.display = "block";
        var legacy = renderContextOf(nodeContext, rendered);
        expect(legacy).not.toBe(nodeContext);
        expect(legacy.display).toBe("block");
        expect(legacy.sourceNode).toBe(nodeContext.sourceNode);
        expect(nodeContext.display).toBe(null);
      });

      it("keeps the core's retention of the value on the overlay", function () {
        var nodeContext = openTextNodeContext();
        vivliostyle_legacy.noteRetained(nodeContext);
        var legacy = renderContextOf(
          nodeContext,
          vivliostyle_node_context.elementRenderResultOf(nodeContext),
        );
        expect(legacy.shared).toBe(true);
      });

      it("carries only the fields a hook wrote into the draft", function () {
        var nodeContext = openTextNodeContext();
        var rendered =
          vivliostyle_node_context.elementRenderResultOf(nodeContext);
        var legacy = renderContextOf(nodeContext, rendered);
        var before = vivliostyle_legacy.captureRenderFields(hookName, legacy);
        rendered.display = "flex";
        legacy.floatSide = "left";
        vivliostyle_legacy.applyLegacyRenderWrites(
          [external],
          before,
          legacy,
          rendered,
        );
        expect(rendered.floatSide).toBe("left");
        expect(rendered.display).toBe("flex");
        expect(nodeContext.floatSide).toBe(null);
        expect(nodeContext.display).toBe(null);
      });

      it("adapts a formatting context a hook assigned to the field", function () {
        var nodeContext = openTextNodeContext();
        var rendered =
          vivliostyle_node_context.elementRenderResultOf(nodeContext);
        var legacy = renderContextOf(nodeContext, rendered);
        var before = vivliostyle_legacy.captureRenderFields(hookName, legacy);
        var seen = [];
        var assigned = {
          isFirstTime: function (ctx, firstTime) {
            seen.push(ctx);
            return firstTime;
          },
        };
        legacy.formattingContext = assigned;
        vivliostyle_legacy.applyLegacyRenderWrites(
          [external],
          before,
          legacy,
          rendered,
        );
        expect(rendered.formattingContext).toBe(assigned);
        var walked = openTextNodeContext();
        expect(rendered.formattingContext.isFirstTime(walked, true)).toBe(true);
        expect(seen[0]).toBe(walked);
        expect(typeof seen[0].copy).toBe("function");
      });

      it("leaves a formatting context only core hooks reached unpatched", function () {
        var coreHook =
          vivliostyle_plugin.getHooksForName("POST_LAYOUT_BLOCK")[0];
        var nodeContext = openTextNodeContext();
        var rendered =
          vivliostyle_node_context.elementRenderResultOf(nodeContext);
        var legacy = renderContextOf(nodeContext, rendered);
        var before = vivliostyle_legacy.captureRenderFields(hookName, legacy);
        var seen = [];
        var assigned = {
          isFirstTime: function (ctx, firstTime) {
            seen.push(ctx);
            return firstTime;
          },
        };
        var original = assigned.isFirstTime;
        legacy.formattingContext = assigned;
        vivliostyle_legacy.applyLegacyRenderWrites(
          [coreHook],
          before,
          legacy,
          rendered,
        );
        expect(rendered.formattingContext).toBe(assigned);
        expect(rendered.formattingContext.isFirstTime).toBe(original);
      });

      it("leaves a frozen formatting context a hook assigned unpatched", function () {
        var nodeContext = openTextNodeContext();
        var rendered =
          vivliostyle_node_context.elementRenderResultOf(nodeContext);
        var legacy = renderContextOf(nodeContext, rendered);
        var before = vivliostyle_legacy.captureRenderFields(hookName, legacy);
        var seen = [];
        var assigned = Object.freeze({
          isFirstTime: function (ctx, firstTime) {
            seen.push(ctx);
            return firstTime;
          },
        });
        var original = assigned.isFirstTime;
        legacy.formattingContext = assigned;
        vivliostyle_legacy.applyLegacyRenderWrites(
          [external],
          before,
          legacy,
          rendered,
        );
        expect(rendered.formattingContext).toBe(assigned);
        expect(rendered.formattingContext.isFirstTime).toBe(original);
        var walked = openTextNodeContext();
        expect(rendered.formattingContext.isFirstTime(walked, true)).toBe(true);
        expect(seen[0]).toBe(walked);
      });

      it("reports the writes the rendered style does not carry", function () {
        var nodeContext = openTextNodeContext();
        var rendered =
          vivliostyle_node_context.elementRenderResultOf(nodeContext);
        var legacy = renderContextOf(nodeContext, rendered);
        var before = vivliostyle_legacy.captureRenderFields(hookName, legacy);
        legacy.floatSide = "left";
        legacy.fragmentIndex = 7;
        legacy.overflow = true;
        legacy.offsetInNode = 5;
        var writes = vivliostyle_legacy.applyLegacyRenderWrites(
          [external],
          before,
          legacy,
          rendered,
        );
        expect(rendered.floatSide).toBe("left");
        expect(writes.floatSide).toBeUndefined();
        expect(writes.fragmentIndex).toBe(7);
        expect(writes.overflow).toBe(true);
        expect(writes.offsetInNode).toBe(5);
        var composed = vivliostyle_legacy.withLegacyContextWrites(
          nodeContext,
          writes,
        );
        expect(composed).not.toBe(nodeContext);
        expect(composed.fragmentIndex).toBe(7);
        expect(composed.overflow).toBe(true);
        expect(composed.offsetInNode).toBe(5);
        expect(nodeContext.fragmentIndex).toBe(1);
        expect(nodeContext.overflow).toBe(false);
      });

      it("retags the composed value when a hook moved it to its after edge", function () {
        var nodeContext = openTextNodeContext();
        var rendered =
          vivliostyle_node_context.elementRenderResultOf(nodeContext);
        var legacy = renderContextOf(nodeContext, rendered);
        var before = vivliostyle_legacy.captureRenderFields(hookName, legacy);
        legacy.after = true;
        var composed = vivliostyle_legacy.withLegacyContextWrites(
          nodeContext,
          vivliostyle_legacy.applyLegacyRenderWrites(
            [external],
            before,
            legacy,
            rendered,
          ),
        );
        expect(composed.after).toBe(true);
        expect(composed.kind).toBe("after-none");
        expect(nodeContext.kind).toBe("open");
      });

      it("retags the composed value when a hook gave it a view node", function () {
        var nodeContext = openTextNodeContext();
        var rendered =
          vivliostyle_node_context.elementRenderResultOf(nodeContext);
        var legacy = renderContextOf(nodeContext, rendered);
        var before = vivliostyle_legacy.captureRenderFields(hookName, legacy);
        legacy.viewNode = document.createElement("div");
        var composed = vivliostyle_legacy.withLegacyContextWrites(
          nodeContext,
          vivliostyle_legacy.applyLegacyRenderWrites(
            [external],
            before,
            legacy,
            rendered,
          ),
        );
        expect(composed.kind).toBe("element");
      });

      it("carries a retention claim into the composed value", function () {
        var nodeContext = openTextNodeContext();
        var rendered =
          vivliostyle_node_context.elementRenderResultOf(nodeContext);
        var legacy = renderContextOf(nodeContext, rendered);
        var before = vivliostyle_legacy.captureRenderFields(hookName, legacy);
        expect(legacy.shared).toBe(false);
        legacy.copy();
        legacy.fragmentIndex = 4;
        var composed = vivliostyle_legacy.withLegacyContextWrites(
          nodeContext,
          vivliostyle_legacy.applyLegacyRenderWrites(
            [external],
            before,
            legacy,
            rendered,
          ),
        );
        expect(composed).not.toBe(nodeContext);
        expect(
          vivliostyle_legacy.asLegacyNodeContext(hookName, composed).shared,
        ).toBe(true);
      });

      it("carries a retention claim onto the value the core keeps", function () {
        var nodeContext = openTextNodeContext();
        var rendered =
          vivliostyle_node_context.elementRenderResultOf(nodeContext);
        var legacy = renderContextOf(nodeContext, rendered);
        var before = vivliostyle_legacy.captureRenderFields(hookName, legacy);
        legacy.shared = true;
        var writes = vivliostyle_legacy.applyLegacyRenderWrites(
          [external],
          before,
          legacy,
          rendered,
        );
        expect(Object.keys(writes).length).toBe(0);
        expect(
          vivliostyle_legacy.withLegacyContextWrites(nodeContext, writes),
        ).toBe(nodeContext);
        expect(
          vivliostyle_legacy.asLegacyNodeContext(hookName, nodeContext).shared,
        ).toBe(true);
      });

      it("leaves the value unclaimed while a hook made no claim", function () {
        var nodeContext = openTextNodeContext();
        var rendered =
          vivliostyle_node_context.elementRenderResultOf(nodeContext);
        var legacy = renderContextOf(nodeContext, rendered);
        var before = vivliostyle_legacy.captureRenderFields(hookName, legacy);
        legacy.fragmentIndex = 4;
        var composed = vivliostyle_legacy.withLegacyContextWrites(
          nodeContext,
          vivliostyle_legacy.applyLegacyRenderWrites(
            [external],
            before,
            legacy,
            rendered,
          ),
        );
        expect(
          vivliostyle_legacy.asLegacyNodeContext(hookName, composed).shared,
        ).toBe(false);
      });

      it("carries a rewritten source node, parent and block container", function () {
        var nodeContext = openTextNodeContext();
        var parent = elementNodeContext();
        var sourceNode = document.createTextNode("rewritten");
        var rendered =
          vivliostyle_node_context.elementRenderResultOf(nodeContext);
        var legacy = renderContextOf(nodeContext, rendered);
        var before = vivliostyle_legacy.captureRenderFields(hookName, legacy);
        legacy.sourceNode = sourceNode;
        legacy.parent = parent;
        legacy.blockContainer = parent;
        var writes = vivliostyle_legacy.applyLegacyRenderWrites(
          [external],
          before,
          legacy,
          rendered,
        );
        expect(writes.sourceNode).toBe(sourceNode);
        expect(writes.parent).toBe(parent);
        expect(writes.blockContainer).toBe(parent);
        var composed = vivliostyle_legacy.withLegacyContextWrites(
          nodeContext,
          writes,
        );
        expect(composed.sourceNode).toBe(sourceNode);
        expect(composed.parent).toBe(parent);
        expect(composed.blockContainer).toBe(parent);
        expect(nodeContext.sourceNode).not.toBe(sourceNode);
        expect(nodeContext.parent).toBe(null);
      });

      it("leaves the discriminant alone for a write beside it", function () {
        var nodeContext = openTextNodeContext();
        var rendered =
          vivliostyle_node_context.elementRenderResultOf(nodeContext);
        var legacy = renderContextOf(nodeContext, rendered);
        var before = vivliostyle_legacy.captureRenderFields(hookName, legacy);
        legacy.fragmentIndex = 3;
        var composed = vivliostyle_legacy.withLegacyContextWrites(
          nodeContext,
          vivliostyle_legacy.applyLegacyRenderWrites(
            [external],
            before,
            legacy,
            rendered,
          ),
        );
        expect(composed.fragmentIndex).toBe(3);
        expect(composed.kind).toBe("open");
      });
    });

    describe("while only the core has registered", function () {
      it("hands out the value the core carries", function () {
        var nodeContext = openTextNodeContext();
        var rendered =
          vivliostyle_node_context.elementRenderResultOf(nodeContext);
        var progress = vivliostyle_node_context.elementRenderProgress(
          nodeContext,
          rendered,
        );
        expect(
          vivliostyle_legacy.asLegacyRenderContext(
            hookName,
            nodeContext,
            progress,
            rendered,
          ),
        ).toBe(progress);
        expect(vivliostyle_legacy.captureRenderFields(hookName, progress)).toBe(
          null,
        );
      });

      it("writes nothing into the draft without a snapshot", function () {
        var nodeContext = openTextNodeContext();
        var rendered =
          vivliostyle_node_context.elementRenderResultOf(nodeContext);
        var progress = vivliostyle_node_context.elementRenderProgress(
          nodeContext,
          rendered,
        );
        progress.display = "block";
        expect(
          vivliostyle_legacy.applyLegacyRenderWrites(
            [external],
            null,
            progress,
            rendered,
          ),
        ).toEqual({});
        expect(rendered.display).toBe(null);
      });

      it("keeps the value while a hook wrote nothing beside the style", function () {
        var nodeContext = openTextNodeContext();
        expect(
          vivliostyle_legacy.withLegacyContextWrites(nodeContext, {}),
        ).toBe(nodeContext);
      });
    });
  });

  describe("asLegacyColumn", function () {
    var externalHook = function () {};
    var coreHook = vivliostyle_plugin.getHooksForName("POST_LAYOUT_BLOCK")[0];

    it("hands the column itself to a hook the core registered", function () {
      var column = stubColumn();
      expect(vivliostyle_legacy.asLegacyColumn(coreHook, column)).toBe(column);
    });

    it("serves one view per column to an external hook", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      expect(view).not.toBe(column);
      expect(vivliostyle_legacy.asLegacyColumn(externalHook, column)).toBe(
        view,
      );
    });

    it("reports the overflow check as a boolean", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      var nodeContext = openTextNodeContext();
      expect(view.checkOverflowAndSaveEdge(nodeContext, null)).toBe(true);
      expect(column.calls[0][1]).toBe(nodeContext);
      column.overflown = false;
      expect(view.checkOverflowAndSaveEdge(null, null)).toBe(false);
    });

    it("reports the clearance as a boolean", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      var nodeContext = elementNodeContext();
      expect(view.applyClearance(nodeContext)).toBe(true);
      expect(column.calls[0][1]).toBe(nodeContext);
      column.clearance = null;
      expect(view.applyClearance(nodeContext)).toBe(false);
    });

    it("reports the line styling result as the node context alone", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      var nodeContext = openTextNodeContext();
      var resNodeContext = openTextNodeContext();
      var checkPoints = [elementNodeContext()];
      var result = view.processLineStyling(
        nodeContext,
        resNodeContext,
        checkPoints,
      );
      expect(result.get()).toBe(resNodeContext);
      expect(column.calls[0][3]).toBe(checkPoints);
    });

    it("serves the column's layout context through its legacy view", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      expect(view.layoutContext).not.toBe(column.layoutContext);
      expect(view.layoutContext).toBe(
        vivliostyle_legacy.asLegacyLayoutContext(column.layoutContext),
      );
    });

    it("passes the members the contract kept through to the column", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      expect(view.isOverflown(1)).toBe(true);
      expect(view.isOverflown(-1)).toBe(false);
    });

    it("calls the replacement after a member is written through the view", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      expect(view.isOverflown(1)).toBe(true);
      view.isOverflown = function () {
        return "patched";
      };
      expect(view.isOverflown(1)).toBe("patched");
      expect(column.isOverflown(1)).toBe("patched");
    });

    it("records the clearance on the node context it was given", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      var nodeContext = elementNodeContext();
      expect(view.applyClearance(nodeContext)).toBe(true);
      expect(nodeContext.clearSpacer).toBe(column.clearance);
    });

    it("serves the repetitive overflow position through its legacy view", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      expect(view.nodeContextOverflowingDueToRepetitiveElements).toBe(null);
      var nodeContext = elementNodeContext();
      column.nodeContextOverflowingDueToRepetitiveElements = nodeContext;
      expect(view.nodeContextOverflowingDueToRepetitiveElements).toBe(
        nodeContext,
      );
      expect(typeof nodeContext.copy).toBe("function");
    });

    it("retags the repetitive overflow position it serves", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      var nodeContext = elementNodeContext();
      nodeContext.after = true;
      column.nodeContextOverflowingDueToRepetitiveElements = nodeContext;
      expect(view.nodeContextOverflowingDueToRepetitiveElements.kind).toBe(
        "after-element",
      );
    });

    it("retags the repetitive overflow position a hook wrote to after reading", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      var nodeContext = elementNodeContext();
      column.nodeContextOverflowingDueToRepetitiveElements = nodeContext;
      view.nodeContextOverflowingDueToRepetitiveElements.after = true;
      expect(nodeContext.kind).toBe("element");
      vivliostyle_legacy.retagLegacyNodeContext("POST_LAYOUT_BLOCK", null);
      expect(nodeContext.kind).toBe("after-element");
    });

    it("retags the break position a hook wrote to after reading", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      var position = elementNodeContext();
      column.breakPositions.push(
        new vivliostyle_break_position.EdgeBreakPosition(
          position,
          null,
          false,
          0,
        ),
      );
      view.breakPositions[0].position.after = true;
      expect(position.kind).toBe("element");
      vivliostyle_legacy.retagLegacyNodeContexts("POST_LAYOUT_BLOCK", []);
      expect(position.kind).toBe("after-element");
    });

    it("serves the pseudo parent through its own legacy view", function () {
      var column = stubColumn();
      var pseudoParent = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      expect(view.pseudoParent).toBe(null);
      column.pseudoParent = pseudoParent;
      expect(view.pseudoParent).not.toBe(pseudoParent);
      expect(view.pseudoParent).toBe(
        vivliostyle_legacy.asLegacyColumn(externalHook, pseudoParent),
      );
      expect(view.pseudoParent.isOverflown(1)).toBe(true);
    });

    it("decorates the node contexts its members hand back", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      var nodeContext = openTextNodeContext();
      var checkPoints = [elementNodeContext()];
      column.acceptableBreak = {
        breakPosition: stubBreakPosition(),
        nodeContext: openTextNodeContext(),
      };
      expect(view.asFloatNodeContext(nodeContext)).toBe(nodeContext);
      expect(typeof nodeContext.copy).toBe("function");
      expect(typeof view.layoutNext(nodeContext, true).get().copy).toBe(
        "function",
      );
      var laidOut = view.doLayout(nodeContext, true).get();
      expect(typeof laidOut.nodeContext.copy).toBe("function");
      expect(typeof laidOut.overflownNodeContext.copy).toBe("function");
      expect(
        typeof view.findEndOfLine(1, checkPoints, false).nodeContext.copy,
      ).toBe("function");
      expect(
        typeof view.findFirstOverflowingEdgeAndCheckPoint(checkPoints)
          .checkPoint.copy,
      ).toBe("function");
      expect(typeof view.findAcceptableBreakPosition().nodeContext.copy).toBe(
        "function",
      );
    });

    it("serves the checkpoints its members pushed through their legacy view", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      var pushed = elementNodeContext();
      var checkPoints = [];
      column.buildViewToNextBlockEdge = function (position, points) {
        points.push(pushed);
        return vivliostyle_task.newResult(null);
      };
      expect(view.buildViewToNextBlockEdge(null, checkPoints).get()).toBe(null);
      expect(checkPoints[0]).toBe(pushed);
      expect(typeof pushed.copy).toBe("function");
    });

    it("replaces the checkpoints the line styling rebuilt", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      var nodeContext = openTextNodeContext();
      var resNodeContext = openTextNodeContext();
      var rebuilt = elementNodeContext();
      var checkPoints = [elementNodeContext()];
      column.processLineStyling = function (ctx, resCtx) {
        return vivliostyle_task.newResult({
          nodeContext: resCtx,
          checkPoints: [rebuilt],
        });
      };
      var result = view.processLineStyling(
        nodeContext,
        resNodeContext,
        checkPoints,
      );
      expect(result.get()).toBe(resNodeContext);
      expect(typeof resNodeContext.copy).toBe("function");
      expect(checkPoints.length).toBe(1);
      expect(checkPoints[0]).toBe(rebuilt);
      expect(typeof rebuilt.copy).toBe("function");
    });

    it("passes a missing node context through its members", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      expect(view.buildViewToNextBlockEdge(null, []).get()).toBe(null);
      expect(view.findAcceptableBreakPosition()).toBe(null);
    });

    it("serves the break position it found through its legacy view", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      var broken = elementNodeContext();
      var seen = [];
      var breakPosition = {
        findAcceptableBreak: function (col, penalty) {
          seen.push(["findAcceptableBreak", col, penalty]);
          return broken;
        },
        getMinBreakPenalty: function () {
          return 5;
        },
        calculateOffset: function (col) {
          seen.push(["calculateOffset", col]);
          return { current: 2, minimum: 1 };
        },
        breakPositionChosen: function (col) {
          seen.push(["breakPositionChosen", col]);
        },
        getNodeContext: function () {
          return broken;
        },
      };
      column.acceptableBreak = {
        breakPosition: breakPosition,
        nodeContext: openTextNodeContext(),
      };
      var found = view.findAcceptableBreakPosition();
      expect(found.breakPosition).not.toBe(breakPosition);
      expect(found.breakPosition).toBe(
        view.findAcceptableBreakPosition().breakPosition,
      );
      expect(found.breakPosition.getMinBreakPenalty()).toBe(5);
      expect(found.breakPosition.findAcceptableBreak(view, 3)).toBe(broken);
      expect(typeof broken.copy).toBe("function");
      expect(seen[0][1]).toBe(column);
      expect(seen[0][2]).toBe(3);
      expect(found.breakPosition.calculateOffset(view).current).toBe(2);
      expect(seen[1][1]).toBe(column);
      found.breakPosition.breakPositionChosen(view);
      expect(seen[2][1]).toBe(column);
      expect(found.breakPosition.getNodeContext()).toBe(broken);
    });

    it("mirrors the break position list between both contracts", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      var core = stubBreakPosition();
      core.getMinBreakPenalty = function () {
        return 4;
      };
      column.breakPositions = [core];
      var list = view.breakPositions;
      expect(list.length).toBe(1);
      expect(list[0]).not.toBe(core);
      expect(list[0]).toBe(view.breakPositions[0]);
      expect(list[0].getMinBreakPenalty()).toBe(4);
      list[0] = list[0];
      expect(column.breakPositions[0]).toBe(core);
    });

    it("adapts a break position a plugin pushed onto the list", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      var broken = elementNodeContext();
      var seen = [];
      var legacyBreakPosition = {
        findAcceptableBreak: function (col, penalty) {
          seen.push([col, penalty]);
          broken.after = true;
          return broken;
        },
        getMinBreakPenalty: function () {
          return 7;
        },
        calculateOffset: function () {
          return { current: 0, minimum: 0 };
        },
        breakPositionChosen: function () {},
      };
      view.breakPositions.push(legacyBreakPosition);
      expect(column.breakPositions.length).toBe(1);
      expect(column.breakPositions[0]).not.toBe(legacyBreakPosition);
      expect(column.breakPositions[0].getMinBreakPenalty()).toBe(7);
      expect(view.breakPositions[0].getMinBreakPenalty()).toBe(7);
      expect(column.breakPositions[0].findAcceptableBreak(column, 2)).toBe(
        broken,
      );
      expect(seen[0][0]).not.toBe(column);
      expect(seen[0][0].isOverflown(1)).toBe(true);
      expect(seen[0][1]).toBe(2);
      expect(broken.kind).toBe("after-element");
    });

    it("serves the text node breaker it resolved under the old contract", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      var nodeContext = openTextNodeContext();
      var broken = elementNodeContext();
      var textNode = document.createTextNode("legacy");
      var checkPoints = [elementNodeContext()];
      var seenCheckPoints = null;
      var seenNodeContext = null;
      var coreBreaker = {
        breakTextNode: function (node, ctx, low, points, index, force) {
          seenNodeContext = ctx;
          seenCheckPoints = points;
          return broken;
        },
        breakAfterSoftHyphen: function (node, text, viewIndex) {
          return viewIndex + 1;
        },
        breakAfterOtherCharacter: function (node, text, viewIndex) {
          return viewIndex - 1;
        },
        updateNodeContext: function () {
          return broken;
        },
      };
      column.resolveTextNodeBreaker = function () {
        return coreBreaker;
      };
      var breaker = view.resolveTextNodeBreaker(nodeContext);
      expect(breaker).not.toBe(coreBreaker);
      expect(view.resolveTextNodeBreaker(nodeContext)).toBe(breaker);
      expect(
        breaker.breakTextNode(textNode, nodeContext, 2, checkPoints, 0, true),
      ).toBe(broken);
      expect(seenNodeContext).toBe(nodeContext);
      expect(seenCheckPoints).toBe(checkPoints);
      expect(typeof broken.copy).toBe("function");
      expect(
        breaker.breakAfterSoftHyphen(textNode, "legacy", 4, nodeContext),
      ).toBe(5);
      expect(
        breaker.breakAfterOtherCharacter(textNode, "legacy", 4, nodeContext),
      ).toBe(3);
      expect(breaker.updateNodeContext(nodeContext, 2, textNode)).toBe(broken);
    });

    it("retags what it is handed before the core text breaker reads it", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      vivliostyle_plugin.registerHook("POST_LAYOUT_BLOCK", externalHook);
      var nodeContext = vivliostyle_legacy.asLegacyNodeContext(
        "POST_LAYOUT_BLOCK",
        openTextNodeContext(),
      );
      var checkPoints = vivliostyle_legacy.asLegacyRenderedNodeContexts(
        "POST_LAYOUT_BLOCK",
        [elementNodeContext()],
      );
      vivliostyle_plugin.removeHook("POST_LAYOUT_BLOCK", externalHook);
      var seen = [];
      var coreBreaker = {
        breakTextNode: function (node, ctx, low, points) {
          seen.push(ctx.kind, points[0].kind);
          return ctx;
        },
        breakAfterSoftHyphen: function (node, text, viewIndex, ctx) {
          seen.push(ctx.kind);
          return viewIndex;
        },
        breakAfterOtherCharacter: function (node, text, viewIndex, ctx) {
          seen.push(ctx.kind);
          return viewIndex;
        },
        updateNodeContext: function (ctx) {
          seen.push(ctx.kind);
          return ctx;
        },
      };
      column.resolveTextNodeBreaker = function () {
        return coreBreaker;
      };
      var breaker = view.resolveTextNodeBreaker(nodeContext);
      breaker.breakTextNode(
        document.createTextNode("legacy"),
        nodeContext,
        0,
        checkPoints,
        0,
        true,
      );
      expect(seen).toEqual(["open", "element"]);
      nodeContext.viewNode = document.createElement("div");
      checkPoints[0].after = true;
      breaker.breakTextNode(
        document.createTextNode("legacy"),
        nodeContext,
        0,
        checkPoints,
        0,
        true,
      );
      expect(seen.slice(2)).toEqual(["element", "after-element"]);
      nodeContext.after = true;
      breaker.breakAfterSoftHyphen(
        document.createTextNode("legacy"),
        "legacy",
        0,
        nodeContext,
      );
      breaker.breakAfterOtherCharacter(
        document.createTextNode("legacy"),
        "legacy",
        0,
        nodeContext,
      );
      breaker.updateNodeContext(nodeContext, 0, document.createTextNode("x"));
      expect(seen.slice(4)).toEqual([
        "after-element",
        "after-element",
        "after-element",
      ]);
    });

    it("keeps a write to a projected member inside the view", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      var replacement = function () {
        return "patched";
      };
      var applyClearance = column.applyClearance;
      view.applyClearance = replacement;
      expect(view.applyClearance).toBe(replacement);
      expect(view.applyClearance(null)).toBe("patched");
      expect(column.applyClearance).toBe(applyClearance);
      expect(
        vivliostyle_legacy.asLegacyColumn(externalHook, stubColumn())
          .applyClearance,
      ).not.toBe(replacement);
    });

    it("keeps a write to the projected layout context inside the view", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      var replacement = stubLayoutContext();
      var layoutContext = column.layoutContext;
      view.layoutContext = replacement;
      expect(view.layoutContext).toBe(replacement);
      expect(column.layoutContext).toBe(layoutContext);
    });

    it("answers the names every object inherits", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      expect(view.hasOwnProperty("breakPositions")).toBe(true);
      expect(view.hasOwnProperty("noSuchMember")).toBe(false);
      expect(view.propertyIsEnumerable("breakPositions")).toBe(true);
      expect(view.valueOf()).toBe(column);
      expect(String(view)).toBe("[object Object]");
      expect(view.toLocaleString()).toBe("[object Object]");
      expect(typeof view.constructor).toBe("function");
      expect(Object.getPrototypeOf(view)).toBe(Object.prototype);
    });

    it("writes a replacement of an inherited name through to the column", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      var replacement = function () {
        return "patched";
      };
      view.toString = replacement;
      expect(column.toString).toBe(replacement);
      expect(String(view)).toBe("patched");
    });

    it("retags a node context a plugin mutated before a member reads it", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      var nodeContext = openTextNodeContext();
      expect(view.asFloatNodeContext(nodeContext)).toBe(nodeContext);
      nodeContext.viewNode = document.createElement("div");
      expect(nodeContext.kind).toBe("open");
      view.asFloatNodeContext(nodeContext);
      expect(nodeContext.kind).toBe("element");
      nodeContext.after = true;
      view.layoutNext(nodeContext, true);
      expect(nodeContext.kind).toBe("after-element");
    });

    it("retags the node contexts inside an array a plugin hands over", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      var checkPoints = [elementNodeContext()];
      view.findEndOfLine(1, checkPoints, false);
      checkPoints[0].after = true;
      expect(checkPoints[0].kind).toBe("element");
      view.findEndOfLine(1, checkPoints, false);
      expect(checkPoints[0].kind).toBe("after-element");
    });
  });

  describe("the break position bridge", function () {
    var externalHook = function () {};

    it("keeps the class and the fields of an edge break position", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      var position = elementNodeContext();
      var core = new vivliostyle_break_position.EdgeBreakPosition(
        position,
        "column",
        true,
        120,
      );
      column.breakPositions = [core];
      var seen = view.breakPositions[0];
      expect(seen).not.toBe(core);
      expect(seen instanceof vivliostyle_break_position.EdgeBreakPosition).toBe(
        true,
      );
      expect(seen.position).toBe(position);
      expect(seen.breakOnEdge).toBe("column");
      expect(seen.overflows).toBe(true);
      expect(seen.computedBlockSize).toBe(120);
      expect(seen.overflowIfRepetitiveElementsDropped).toBe(true);
    });

    it("serves the node context of an edge break position under the old contract", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      var position = elementNodeContext();
      column.breakPositions = [
        new vivliostyle_break_position.EdgeBreakPosition(
          position,
          "column",
          true,
          120,
        ),
      ];
      var seen = view.breakPositions[0];
      expect(seen.position).toBe(position);
      expect(typeof seen.position.copy).toBe("function");
      expect(typeof seen.position.modify).toBe("function");
    });

    it("writes a replacement position through to the break position", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      var core = new vivliostyle_break_position.EdgeBreakPosition(
        elementNodeContext(),
        "column",
        true,
        120,
      );
      column.breakPositions = [core];
      var replacement = elementNodeContext();
      var seen = view.breakPositions[0];
      seen.position = replacement;
      expect(core.position).toBe(replacement);
      expect(seen.position).toBe(replacement);
      expect(typeof seen.position.copy).toBe("function");
    });

    it("serves the node contexts of a box break position under the old contract", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      var checkPoints = [elementNodeContext()];
      var core = new vivliostyle_layout.BoxBreakPosition(checkPoints, 3);
      core.breakNodeContext = elementNodeContext();
      column.breakPositions = [core];
      var seen = view.breakPositions[0];
      expect(seen.checkPoints).toBe(checkPoints);
      expect(typeof seen.checkPoints[0].copy).toBe("function");
      expect(seen.breakNodeContext).toBe(core.breakNodeContext);
      expect(typeof seen.breakNodeContext.copy).toBe("function");
    });

    it("keeps the class and the fields of a box break position", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      var checkPoints = [elementNodeContext()];
      var core = new vivliostyle_layout.BoxBreakPosition(checkPoints, 3);
      column.breakPositions = [core];
      var seen = view.breakPositions[0];
      expect(seen instanceof vivliostyle_layout.BoxBreakPosition).toBe(true);
      expect(seen.checkPoints).toBe(checkPoints);
      expect(seen.penalty).toBe(3);
      expect(seen.breakNodeContext).toBe(null);
      expect(seen.getMinBreakPenalty()).toBe(3);
    });

    it("hands a break position the core built back as itself", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      var core = new vivliostyle_layout.BoxBreakPosition(
        [elementNodeContext()],
        1,
      );
      column.breakPositions = [core];
      var seen = view.breakPositions[0];
      expect(view.breakPositions[0]).toBe(seen);
      view.breakPositions[0] = seen;
      expect(column.breakPositions[0]).toBe(core);
    });

    it("decorates the node context a break position reports", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      var position = elementNodeContext();
      column.breakPositions = [
        new vivliostyle_break_position.EdgeBreakPosition(
          position,
          "column",
          false,
          0,
        ),
      ];
      expect(view.breakPositions[0].getNodeContext()).toBe(position);
      expect(typeof position.copy).toBe("function");
    });

    it("retags the position a break position hands out", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      var position = elementNodeContext();
      column.breakPositions = [
        new vivliostyle_break_position.EdgeBreakPosition(
          position,
          "column",
          false,
          0,
        ),
      ];
      var seen = view.breakPositions[0];
      seen.position.viewNode = null;
      expect(seen.position).toBe(position);
      expect(position.kind).toBe("open");
    });

    it("retags the checkpoints a break position hands out", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      var checkPoints = [elementNodeContext()];
      var core = new vivliostyle_layout.BoxBreakPosition(checkPoints, 3);
      core.breakNodeContext = elementNodeContext();
      column.breakPositions = [core];
      var seen = view.breakPositions[0];
      seen.checkPoints[0].after = true;
      seen.breakNodeContext.after = true;
      expect(seen.checkPoints[0]).toBe(checkPoints[0]);
      expect(seen.checkPoints[0].kind).toBe("after-element");
      expect(seen.breakNodeContext.kind).toBe("after-element");
    });

    it("reports no node context for a break position without one", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      column.breakPositions = [stubBreakPosition()];
      expect(view.breakPositions[0].getNodeContext).toBeUndefined();
    });

    it("adapts a break position built on the core class for the column", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      var legacyBreakPosition = coreClassBreakPosition();
      var position = elementNodeContext();
      legacyBreakPosition.findAcceptableBreak = function (column) {
        return column.checkOverflowAndSaveEdge(position, null)
          ? position
          : null;
      };
      column.overflown = false;
      view.breakPositions.push(legacyBreakPosition);
      expect(column.breakPositions[0]).not.toBe(legacyBreakPosition);
      expect(column.breakPositions[0].findAcceptableBreak(column, 0)).toBe(
        null,
      );
      view.breakPositions[0] = view.breakPositions[0];
      expect(view.breakPositions[0]).toBe(legacyBreakPosition);
    });

    it("hands a break position built on the core class back as itself", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      var legacyBreakPosition = coreClassBreakPosition();
      view.breakPositions.push(legacyBreakPosition);
      var seen = view.breakPositions[0];
      expect(seen).toBe(legacyBreakPosition);
      expect(seen.getMinBreakPenalty()).toBe(4);
      expect(view.breakPositions.indexOf(legacyBreakPosition)).toBe(0);
    });

    it("finds a break position a plugin built for itself in the list", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      var legacyBreakPosition = stubBreakPosition();
      view.breakPositions.push(legacyBreakPosition);
      expect(view.breakPositions.indexOf(legacyBreakPosition)).toBe(0);
    });

    it("keeps the position a break position built on the core class holds", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      var legacyBreakPosition = coreClassBreakPosition();
      var position = elementNodeContext();
      legacyBreakPosition.position = position;
      view.breakPositions.push(legacyBreakPosition);
      expect(view.breakPositions[0].position).toBe(position);
    });

    it("hands a break position a plugin pushed back as itself", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      var legacyBreakPosition = stubBreakPosition();
      view.breakPositions.push(legacyBreakPosition);
      var adapted = column.breakPositions[0];
      expect(adapted).not.toBe(legacyBreakPosition);
      expect(view.breakPositions[0]).toBe(legacyBreakPosition);
      view.breakPositions[0] = view.breakPositions[0];
      expect(column.breakPositions[0]).toBe(adapted);
    });

    it("unwraps a break position on its way back to the column", function () {
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      var seen = [];
      column.findEdgeBreakPosition = function (bp) {
        seen.push(bp);
        return null;
      };
      column.findBoxBreakPosition = function (bp, force) {
        seen.push(bp, force);
        return null;
      };
      var edge = new vivliostyle_break_position.EdgeBreakPosition(
        elementNodeContext(),
        "column",
        true,
        1,
      );
      var box = new vivliostyle_layout.BoxBreakPosition(
        [elementNodeContext()],
        2,
      );
      column.breakPositions = [edge, box];
      view.findEdgeBreakPosition(view.breakPositions[0]);
      view.findBoxBreakPosition(view.breakPositions[1], true);
      expect(seen[0]).toBe(edge);
      expect(seen[1]).toBe(box);
      expect(seen[2]).toBe(true);
      var legacyBreakPosition = stubBreakPosition();
      legacyBreakPosition.getMinBreakPenalty = function () {
        return 9;
      };
      view.findEdgeBreakPosition(legacyBreakPosition);
      expect(seen[3]).not.toBe(legacyBreakPosition);
      expect(seen[3].getMinBreakPenalty()).toBe(9);
    });
  });

  describe("asLegacyLayoutContext", function () {
    it("reports setCurrent as whether children are processed", function () {
      var layoutContext = stubLayoutContext();
      var view = vivliostyle_legacy.asLegacyLayoutContext(layoutContext);
      var nodeContext = openTextNodeContext();
      expect(view.setCurrent(nodeContext, true, false).get()).toBe(true);
      expect(view.setCurrent(nodeContext, false, true).get()).toBe(false);
      expect(layoutContext.calls[0][1]).toBe(nodeContext);
      expect(layoutContext.calls[0][3]).toBe(false);
    });

    it("writes the rendered node context back into the one it was given", function () {
      var layoutContext = stubLayoutContext();
      var view = vivliostyle_legacy.asLegacyLayoutContext(layoutContext);
      var nodeContext = openTextNodeContext();
      var viewNode = document.createElement("div");
      var formattingContext =
        new vivliostyle_layout_processor.BlockFormattingContext(null);
      layoutContext.rendered = Object.assign({}, nodeContext, {
        kind: "element",
        viewNode: viewNode,
        display: "block",
        inline: false,
        floatSide: "left",
        formattingContext: formattingContext,
      });
      expect(view.setCurrent(nodeContext, true, false).get()).toBe(true);
      expect(nodeContext.viewNode).toBe(viewNode);
      expect(nodeContext.display).toBe("block");
      expect(nodeContext.inline).toBe(false);
      expect(nodeContext.floatSide).toBe("left");
      expect(nodeContext.formattingContext).toBe(formattingContext);
      expect(nodeContext.kind).toBe("element");
    });

    it("retags the node context it writes back from what the fields imply", function () {
      var layoutContext = stubLayoutContext();
      var view = vivliostyle_legacy.asLegacyLayoutContext(layoutContext);
      var nodeContext = openTextNodeContext();
      layoutContext.rendered = Object.assign({}, nodeContext, {
        kind: "open",
        viewNode: document.createTextNode("rendered"),
        after: true,
      });
      view.setCurrent(nodeContext, true, false).get();
      expect(nodeContext.kind).toBe("after-text");
      expect(typeof nodeContext.copy).toBe("function");
    });

    it("serves a cloned layout context through its legacy view", function () {
      var layoutContext = stubLayoutContext();
      layoutContext.cloned = stubLayoutContext();
      var cloned = vivliostyle_legacy
        .asLegacyLayoutContext(layoutContext)
        .clone();
      expect(cloned).not.toBe(layoutContext.cloned);
      expect(cloned).toBe(
        vivliostyle_legacy.asLegacyLayoutContext(layoutContext.cloned),
      );
      expect(cloned.setCurrent(openTextNodeContext(), true).get()).toBe(true);
    });

    it("passes applyPseudoelementStyle through to the layout context", function () {
      var layoutContext = stubLayoutContext();
      var view = vivliostyle_legacy.asLegacyLayoutContext(layoutContext);
      var nodeContext = openTextNodeContext();
      var target = document.createElement("span");
      view.applyPseudoelementStyle(nodeContext, "before", target);
      expect(layoutContext.calls[0][0]).toBe("applyPseudoelementStyle");
      expect(layoutContext.calls[0][1]).toBe(nodeContext);
      expect(layoutContext.calls[0][2]).toBe("before");
      expect(layoutContext.calls[0][3]).toBe(target);
    });

    it("serves the node contexts it walks to through their legacy view", function () {
      var layoutContext = stubLayoutContext();
      var view = vivliostyle_legacy.asLegacyLayoutContext(layoutContext);
      var nodeContext = openTextNodeContext();
      expect(view.nextInTree(nodeContext, true).get()).toBe(null);
      layoutContext.next = nodeContext;
      var walked = view.nextInTree(nodeContext, false).get();
      expect(walked).toBe(nodeContext);
      expect(typeof walked.copy).toBe("function");
      var peeled = view.peelOff(nodeContext, 2).get();
      expect(peeled).toBe(nodeContext);
      expect(typeof peeled.copy).toBe("function");
      expect(layoutContext.calls[2][0]).toBe("peelOff");
      expect(layoutContext.calls[2][2]).toBe(2);
    });

    it("retags a node context handed to a member the contract kept", function () {
      var layoutContext = stubLayoutContext();
      var view = vivliostyle_legacy.asLegacyLayoutContext(layoutContext);
      var nodeContext = openTextNodeContext();
      layoutContext.next = nodeContext;
      expect(view.nextInTree(nodeContext, false).get()).toBe(nodeContext);
      nodeContext.viewNode = document.createElement("div");
      expect(nodeContext.kind).toBe("open");
      view.applyPseudoelementStyle(
        nodeContext,
        "before",
        document.createElement("span"),
      );
      expect(nodeContext.kind).toBe("element");
    });
  });

  describe("adaptLegacyTextNodeBreaker", function () {
    var externalHook = function () {};
    var coreHook = vivliostyle_plugin.getHooksForName("POST_LAYOUT_BLOCK")[0];
    var calls;
    var legacyBreaker;
    var textNode;

    beforeEach(function () {
      calls = [];
      textNode = document.createTextNode("legacy");
      legacyBreaker = {
        breakTextNode: function (
          brokenNode,
          nodeContext,
          low,
          checkPoints,
          checkpointIndex,
          force,
        ) {
          calls.push({
            name: "breakTextNode",
            nodeContext: nodeContext,
            checkPoints: checkPoints,
            low: low,
            checkpointIndex: checkpointIndex,
            force: force,
          });
          nodeContext.after = true;
          return nodeContext;
        },
        breakAfterSoftHyphen: function (
          brokenNode,
          text,
          viewIndex,
          nodeContext,
        ) {
          calls.push({
            name: "breakAfterSoftHyphen",
            nodeContext: nodeContext,
            text: text,
          });
          return viewIndex + 1;
        },
        breakAfterOtherCharacter: function (
          brokenNode,
          text,
          viewIndex,
          nodeContext,
        ) {
          calls.push({
            name: "breakAfterOtherCharacter",
            nodeContext: nodeContext,
            text: text,
          });
          return viewIndex - 1;
        },
        updateNodeContext: function (nodeContext, viewIndex, updatedNode) {
          calls.push({
            name: "updateNodeContext",
            nodeContext: nodeContext,
            viewIndex: viewIndex,
          });
          nodeContext.viewNode = updatedNode;
          return nodeContext;
        },
      };
    });

    it("hands a breaker the core resolved back as itself", function () {
      expect(
        vivliostyle_legacy.adaptLegacyTextNodeBreaker(coreHook, legacyBreaker),
      ).toBe(legacyBreaker);
    });

    it("serves one adapter per legacy implementation", function () {
      expect(
        vivliostyle_legacy.adaptLegacyTextNodeBreaker(
          externalHook,
          legacyBreaker,
        ),
      ).toBe(
        vivliostyle_legacy.adaptLegacyTextNodeBreaker(
          externalHook,
          legacyBreaker,
        ),
      );
    });

    it("hands the node context and the checkpoints over as legacy views", function () {
      var nodeContext = openTextNodeContext();
      var checkPoints = [elementNodeContext()];
      var result = vivliostyle_legacy
        .adaptLegacyTextNodeBreaker(externalHook, legacyBreaker)
        .breakTextNode(textNode, nodeContext, 2, checkPoints, 0, true);
      expect(calls[0].nodeContext).toBe(nodeContext);
      expect(typeof calls[0].nodeContext.copy).toBe("function");
      expect(calls[0].checkPoints).toBe(checkPoints);
      expect(typeof checkPoints[0].copy).toBe("function");
      expect(calls[0].low).toBe(2);
      expect(calls[0].force).toBe(true);
      expect(result).toBe(nodeContext);
      expect(result.kind).toBe("after-none");
    });

    it("reports the soft hyphen index the legacy breaker returned", function () {
      var nodeContext = openTextNodeContext();
      var result = vivliostyle_legacy
        .adaptLegacyTextNodeBreaker(externalHook, legacyBreaker)
        .breakAfterSoftHyphen(textNode, "legacy", 4, nodeContext);
      expect(result).toBe(5);
      expect(typeof calls[0].nodeContext.copy).toBe("function");
    });

    it("reports the index of a break after another character", function () {
      var nodeContext = openTextNodeContext();
      expect(
        vivliostyle_legacy
          .adaptLegacyTextNodeBreaker(externalHook, legacyBreaker)
          .breakAfterOtherCharacter(textNode, "legacy", 4, nodeContext),
      ).toBe(3);
      expect(typeof calls[0].nodeContext.copy).toBe("function");
    });

    it("retags the value updateNodeContext hands back", function () {
      var nodeContext = openTextNodeContext();
      var result = vivliostyle_legacy
        .adaptLegacyTextNodeBreaker(externalHook, legacyBreaker)
        .updateNodeContext(nodeContext, 2, textNode);
      expect(typeof calls[0].nodeContext.copy).toBe("function");
      expect(result).toBe(nodeContext);
      expect(result.viewNode).toBe(textNode);
      expect(result.kind).toBe("text");
    });

    it("retags the checkpoints a text break mutated in place", function () {
      var nodeContext = openTextNodeContext();
      var checkPoints = [elementNodeContext()];
      legacyBreaker.breakTextNode = function (brokenNode, ctx, low, points) {
        points[0].after = true;
        return ctx;
      };
      vivliostyle_legacy
        .adaptLegacyTextNodeBreaker(externalHook, legacyBreaker)
        .breakTextNode(textNode, nodeContext, 2, checkPoints, 0, true);
      expect(checkPoints[0].kind).toBe("after-element");
    });

    it("retags the value a soft hyphen break mutated in place", function () {
      var nodeContext = openTextNodeContext();
      legacyBreaker.breakAfterSoftHyphen = function (
        brokenNode,
        text,
        viewIndex,
        ctx,
      ) {
        ctx.viewNode = brokenNode;
        return viewIndex;
      };
      var result = vivliostyle_legacy
        .adaptLegacyTextNodeBreaker(externalHook, legacyBreaker)
        .breakAfterSoftHyphen(textNode, "legacy", 4, nodeContext);
      expect(result).toBe(4);
      expect(nodeContext.kind).toBe("text");
    });

    it("retags the value a break after another character mutated", function () {
      var nodeContext = openTextNodeContext();
      legacyBreaker.breakAfterOtherCharacter = function (
        brokenNode,
        text,
        viewIndex,
        ctx,
      ) {
        ctx.after = true;
        return viewIndex;
      };
      vivliostyle_legacy
        .adaptLegacyTextNodeBreaker(externalHook, legacyBreaker)
        .breakAfterOtherCharacter(textNode, "legacy", 4, nodeContext);
      expect(nodeContext.kind).toBe("after-none");
    });

    it("hands a breaker a plugin registered back as itself", function () {
      var external = function () {};
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(external, column);
      var adapted = vivliostyle_legacy.adaptLegacyTextNodeBreaker(
        externalHook,
        legacyBreaker,
      );
      column.resolveTextNodeBreaker = function () {
        return adapted;
      };
      expect(view.resolveTextNodeBreaker(openTextNodeContext())).toBe(
        legacyBreaker,
      );
    });

    it("adapts a breaker view back to the breaker the core resolved", function () {
      var external = function () {};
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(external, column);
      var coreBreaker = {
        breakTextNode: function (node, ctx) {
          return ctx;
        },
        breakAfterSoftHyphen: function (node, text, viewIndex) {
          return viewIndex;
        },
        breakAfterOtherCharacter: function (node, text, viewIndex) {
          return viewIndex;
        },
        updateNodeContext: function (ctx) {
          return ctx;
        },
      };
      column.resolveTextNodeBreaker = function () {
        return coreBreaker;
      };
      var breakerView = view.resolveTextNodeBreaker(openTextNodeContext());
      expect(breakerView).not.toBe(coreBreaker);
      expect(
        vivliostyle_legacy.adaptLegacyTextNodeBreaker(
          externalHook,
          breakerView,
        ),
      ).toBe(coreBreaker);
    });

    it("retags the value updateNodeContext mutated but did not return", function () {
      var nodeContext = openTextNodeContext();
      var replacement = elementNodeContext();
      legacyBreaker.updateNodeContext = function (ctx, viewIndex, updatedNode) {
        ctx.viewNode = updatedNode;
        return replacement;
      };
      var result = vivliostyle_legacy
        .adaptLegacyTextNodeBreaker(externalHook, legacyBreaker)
        .updateNodeContext(nodeContext, 2, textNode);
      expect(result).toBe(replacement);
      expect(nodeContext.kind).toBe("text");
    });
  });

  describe("adaptLegacyLayoutProcessor", function () {
    var externalHook = function () {};
    var coreHook = vivliostyle_plugin.getHooksForName(
      "RESOLVE_LAYOUT_PROCESSOR",
    )[0];
    var calls;
    var breakPosition;
    var legacyProcessor;

    beforeEach(function () {
      calls = [];
      breakPosition = {
        broken: null,
        findAcceptableBreak: function (column, penalty) {
          calls.push({
            name: "findAcceptableBreak",
            column: column,
            penalty: penalty,
          });
          return breakPosition.broken;
        },
        getMinBreakPenalty: function () {
          return 3;
        },
        calculateOffset: function (column) {
          calls.push({ name: "calculateOffset", column: column });
          return { current: 1, minimum: 0 };
        },
        breakPositionChosen: function (column) {
          calls.push({ name: "breakPositionChosen", column: column });
        },
      };
      legacyProcessor = {
        layout: function (nodeContext, column, leadingEdge) {
          calls.push({
            name: "layout",
            nodeContext: nodeContext,
            column: column,
            leadingEdge: leadingEdge,
          });
          nodeContext.after = true;
          return vivliostyle_task.newResult(nodeContext);
        },
        createEdgeBreakPosition: function (
          position,
          breakOnEdge,
          overflows,
          columnBlockSize,
        ) {
          calls.push({
            name: "createEdgeBreakPosition",
            nodeContext: position,
            breakOnEdge: breakOnEdge,
            overflows: overflows,
            columnBlockSize: columnBlockSize,
          });
          return breakPosition;
        },
        startNonInlineElementNode: function (nodeContext) {
          calls.push({
            name: "startNonInlineElementNode",
            nodeContext: nodeContext,
          });
          return true;
        },
        afterNonInlineElementNode: function (nodeContext, stopAtOverflow) {
          calls.push({
            name: "afterNonInlineElementNode",
            nodeContext: nodeContext,
            stopAtOverflow: stopAtOverflow,
          });
          return false;
        },
        finishBreak: function (
          column,
          nodeContext,
          forceRemoveSelf,
          endOfColumn,
        ) {
          calls.push({
            name: "finishBreak",
            column: column,
            nodeContext: nodeContext,
            forceRemoveSelf: forceRemoveSelf,
            endOfColumn: endOfColumn,
          });
          return vivliostyle_task.newResult(true);
        },
        clearOverflownViewNodes: function (
          column,
          parentNodeContext,
          nodeContext,
          removeSelf,
        ) {
          calls.push({
            name: "clearOverflownViewNodes",
            column: column,
            parentNodeContext: parentNodeContext,
            nodeContext: nodeContext,
            removeSelf: removeSelf,
          });
        },
      };
    });

    it("hands the processor itself to a hook the core registered", function () {
      expect(
        vivliostyle_legacy.adaptLegacyLayoutProcessor(
          coreHook,
          legacyProcessor,
        ),
      ).toBe(legacyProcessor);
    });

    it("serves one adapter per legacy processor", function () {
      var adapted = vivliostyle_legacy.adaptLegacyLayoutProcessor(
        externalHook,
        legacyProcessor,
      );
      expect(adapted).not.toBe(legacyProcessor);
      expect(
        vivliostyle_legacy.adaptLegacyLayoutProcessor(
          externalHook,
          legacyProcessor,
        ),
      ).toBe(adapted);
    });

    it("hands layout the node context and the column as legacy views", function () {
      var nodeContext = openTextNodeContext();
      var column = stubColumn();
      var result = vivliostyle_legacy
        .adaptLegacyLayoutProcessor(externalHook, legacyProcessor)
        .layout(nodeContext, column, true);
      expect(calls[0].nodeContext).toBe(nodeContext);
      expect(typeof calls[0].nodeContext.copy).toBe("function");
      expect(calls[0].column).not.toBe(column);
      expect(calls[0].column.checkOverflowAndSaveEdge(null, null)).toBe(true);
      expect(result.get()).toBe(nodeContext);
      expect(result.get().kind).toBe("after-none");
    });

    it("wraps the break position the processor creates", function () {
      var position = openTextNodeContext();
      var column = stubColumn();
      var adapted = vivliostyle_legacy
        .adaptLegacyLayoutProcessor(externalHook, legacyProcessor)
        .createEdgeBreakPosition(position, "column", true, 120);
      expect(adapted).not.toBe(breakPosition);
      expect(calls[0].nodeContext).toBe(position);
      expect(typeof calls[0].nodeContext.copy).toBe("function");
      expect(calls[0].breakOnEdge).toBe("column");
      expect(calls[0].columnBlockSize).toBe(120);
      expect(adapted.getMinBreakPenalty()).toBe(3);
      expect(adapted.calculateOffset(column).current).toBe(1);
      expect(calls[1].column).not.toBe(column);
      breakPosition.broken = elementNodeContext();
      breakPosition.broken.after = true;
      expect(adapted.findAcceptableBreak(column, 2)).toBe(breakPosition.broken);
      expect(calls[2].column).not.toBe(column);
      expect(calls[2].column.isOverflown(1)).toBe(true);
      expect(breakPosition.broken.kind).toBe("after-element");
      breakPosition.broken = null;
      expect(adapted.findAcceptableBreak(column, 2)).toBe(null);
      adapted.breakPositionChosen(column);
      expect(calls[4].name).toBe("breakPositionChosen");
    });

    it("adapts the break position class a legacy processor created", function () {
      var position = elementNodeContext();
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      var core = new vivliostyle_break_position.EdgeBreakPosition(
        position,
        "column",
        true,
        120,
      );
      legacyProcessor.createEdgeBreakPosition = function () {
        return core;
      };
      var created = vivliostyle_legacy
        .adaptLegacyLayoutProcessor(externalHook, legacyProcessor)
        .createEdgeBreakPosition(position, "column", true, 120);
      expect(created).not.toBe(core);
      column.breakPositions = [created];
      expect(view.breakPositions[0]).toBe(core);
    });

    it("adapts a break position a legacy processor created only once", function () {
      var position = elementNodeContext();
      var adapted = vivliostyle_legacy
        .adaptLegacyLayoutProcessor(externalHook, legacyProcessor)
        .createEdgeBreakPosition(position, "column", true, 120);
      expect(adapted).not.toBe(breakPosition);
      var column = stubColumn();
      var view = vivliostyle_legacy.asLegacyColumn(externalHook, column);
      column.breakPositions = [adapted];
      expect(view.breakPositions[0]).toBe(breakPosition);
      view.breakPositions[0] = view.breakPositions[0];
      expect(column.breakPositions[0]).toBe(adapted);
    });

    it("hands the remaining node contexts over as legacy views", function () {
      var nodeContext = openTextNodeContext();
      var parentNodeContext = elementNodeContext();
      var column = stubColumn();
      var adapted = vivliostyle_legacy.adaptLegacyLayoutProcessor(
        externalHook,
        legacyProcessor,
      );
      expect(adapted.startNonInlineElementNode(nodeContext)).toBe(true);
      expect(adapted.afterNonInlineElementNode(nodeContext, true)).toBe(false);
      expect(adapted.finishBreak(column, nodeContext, false, true).get()).toBe(
        true,
      );
      adapted.clearOverflownViewNodes(
        column,
        parentNodeContext,
        nodeContext,
        true,
      );
      adapted.clearOverflownViewNodes(column, null, nodeContext, false);
      calls.forEach(function (call) {
        expect(call.nodeContext).toBe(nodeContext);
        expect(typeof call.nodeContext.copy).toBe("function");
      });
      expect(typeof calls[3].parentNodeContext.copy).toBe("function");
      expect(calls[4].parentNodeContext).toBe(null);
      expect(calls[2].column).not.toBe(column);
      expect(calls[2].column.isOverflown(1)).toBe(true);
    });

    it("retags the value layout mutated but did not return", function () {
      var nodeContext = openTextNodeContext();
      var column = stubColumn();
      legacyProcessor.layout = function (ctx) {
        ctx.after = true;
        return vivliostyle_task.newResult(null);
      };
      var result = vivliostyle_legacy
        .adaptLegacyLayoutProcessor(externalHook, legacyProcessor)
        .layout(nodeContext, column, true);
      expect(result.get()).toBe(null);
      expect(nodeContext.kind).toBe("after-none");
    });

    it("retags the values the remaining members mutated in place", function () {
      var nodeContext = openTextNodeContext();
      var parentNodeContext = elementNodeContext();
      var position = openTextNodeContext();
      var column = stubColumn();
      legacyProcessor.startNonInlineElementNode = function (ctx) {
        ctx.after = true;
        return true;
      };
      legacyProcessor.afterNonInlineElementNode = function (ctx) {
        ctx.after = true;
        return false;
      };
      legacyProcessor.createEdgeBreakPosition = function (ctx) {
        ctx.after = true;
        return breakPosition;
      };
      legacyProcessor.finishBreak = function (col, ctx) {
        ctx.after = true;
        return vivliostyle_task.newResult(true);
      };
      legacyProcessor.clearOverflownViewNodes = function (col, parent, ctx) {
        parent.after = true;
        ctx.after = true;
      };
      var adapted = vivliostyle_legacy.adaptLegacyLayoutProcessor(
        externalHook,
        legacyProcessor,
      );
      adapted.createEdgeBreakPosition(position, "column", true, 120);
      expect(position.kind).toBe("after-none");
      adapted.startNonInlineElementNode(nodeContext);
      expect(nodeContext.kind).toBe("after-none");
      adapted.afterNonInlineElementNode(nodeContext, true);
      expect(nodeContext.kind).toBe("after-none");
      expect(adapted.finishBreak(column, nodeContext, false, true).get()).toBe(
        true,
      );
      adapted.clearOverflownViewNodes(
        column,
        parentNodeContext,
        nodeContext,
        true,
      );
      expect(parentNodeContext.kind).toBe("after-element");
      expect(nodeContext.kind).toBe("after-none");
    });
  });

  describe("adaptLegacyFormattingContext", function () {
    var externalHook = function () {};
    var coreHook = vivliostyle_plugin.getHooksForName(
      "RESOLVE_FORMATTING_CONTEXT",
    )[0];

    function StubFormattingContext() {
      this.calls = [];
    }

    StubFormattingContext.prototype.isFirstTime = function (
      nodeContext,
      firstTime,
    ) {
      this.calls.push({ nodeContext: nodeContext, firstTime: firstTime });
      return firstTime;
    };

    it("leaves the formatting context of a core hook alone", function () {
      var formattingContext = new StubFormattingContext();
      expect(
        vivliostyle_legacy.adaptLegacyFormattingContext(
          coreHook,
          formattingContext,
        ),
      ).toBe(formattingContext);
      expect(
        Object.prototype.hasOwnProperty.call(formattingContext, "isFirstTime"),
      ).toBe(false);
    });

    it("keeps the identity and the prototype of the returned value", function () {
      var formattingContext = new StubFormattingContext();
      var adapted = vivliostyle_legacy.adaptLegacyFormattingContext(
        externalHook,
        formattingContext,
      );
      expect(adapted).toBe(formattingContext);
      expect(adapted instanceof StubFormattingContext).toBe(true);
      expect(Object.getPrototypeOf(adapted)).toBe(
        StubFormattingContext.prototype,
      );
      expect(
        Object.prototype.hasOwnProperty.call(formattingContext, "isFirstTime"),
      ).toBe(true);
    });

    it("hands the node context to isFirstTime as a legacy view", function () {
      var formattingContext = new StubFormattingContext();
      vivliostyle_legacy.adaptLegacyFormattingContext(
        externalHook,
        formattingContext,
      );
      var nodeContext = openTextNodeContext();
      expect(formattingContext.isFirstTime(nodeContext, true)).toBe(true);
      expect(formattingContext.calls.length).toBe(1);
      expect(formattingContext.calls[0].nodeContext).toBe(nodeContext);
      expect(typeof formattingContext.calls[0].nodeContext.copy).toBe(
        "function",
      );
    });

    it("replaces isFirstTime once", function () {
      var formattingContext = new StubFormattingContext();
      vivliostyle_legacy.adaptLegacyFormattingContext(
        externalHook,
        formattingContext,
      );
      var replaced = formattingContext.isFirstTime;
      expect(
        vivliostyle_legacy.adaptLegacyFormattingContext(
          externalHook,
          formattingContext,
        ),
      ).toBe(formattingContext);
      expect(formattingContext.isFirstTime).toBe(replaced);
      formattingContext.isFirstTime(openTextNodeContext(), false);
      expect(formattingContext.calls.length).toBe(1);
    });

    it("leaves a frozen formatting context unpatched", function () {
      var formattingContext = Object.freeze(new StubFormattingContext());
      var original = formattingContext.isFirstTime;
      expect(
        vivliostyle_legacy.adaptLegacyFormattingContext(
          externalHook,
          formattingContext,
        ),
      ).toBe(formattingContext);
      expect(formattingContext.isFirstTime).toBe(original);
      expect(
        Object.prototype.hasOwnProperty.call(formattingContext, "isFirstTime"),
      ).toBe(false);
      var nodeContext = openTextNodeContext();
      expect(formattingContext.isFirstTime(nodeContext, true)).toBe(true);
      expect(formattingContext.calls[0].nodeContext).toBe(nodeContext);
    });

    it("leaves a formatting context whose isFirstTime is read-only unpatched", function () {
      var calls = [];
      var formattingContext = {};
      var original = function (nodeContext, firstTime) {
        calls.push(nodeContext);
        return firstTime;
      };
      Object.defineProperty(formattingContext, "isFirstTime", {
        value: original,
        writable: false,
        enumerable: true,
        configurable: false,
      });
      expect(
        vivliostyle_legacy.adaptLegacyFormattingContext(
          externalHook,
          formattingContext,
        ),
      ).toBe(formattingContext);
      expect(formattingContext.isFirstTime).toBe(original);
      var nodeContext = openTextNodeContext();
      expect(formattingContext.isFirstTime(nodeContext, true)).toBe(true);
      expect(calls[0]).toBe(nodeContext);
    });

    it("patches a sealed formatting context that carries its own isFirstTime", function () {
      var calls = [];
      var formattingContext = Object.seal({
        isFirstTime: function (nodeContext, firstTime) {
          calls.push(nodeContext);
          return firstTime;
        },
      });
      var original = formattingContext.isFirstTime;
      vivliostyle_legacy.adaptLegacyFormattingContext(
        externalHook,
        formattingContext,
      );
      expect(formattingContext.isFirstTime).not.toBe(original);
      var nodeContext = openTextNodeContext();
      expect(formattingContext.isFirstTime(nodeContext, true)).toBe(true);
      expect(typeof calls[0].copy).toBe("function");
    });
  });

  describe("legacyFirstTime", function () {
    var hookName = "RESOLVE_FORMATTING_CONTEXT";
    var external = function () {};

    function firstTimeOf(formattingContext, nodeContext, firstTime) {
      return vivliostyle_legacy.legacyFirstTime(
        formattingContext,
        nodeContext,
        vivliostyle_node_context.elementRenderResultOf(nodeContext),
        firstTime,
      );
    }

    describe("while an external hook is registered", function () {
      beforeEach(function () {
        vivliostyle_plugin.registerHook(hookName, external);
      });

      afterEach(function () {
        vivliostyle_plugin.removeHook(hookName, external);
      });

      it("hands the rendered draft to the formatting context", function () {
        var nodeContext = elementNodeContext();
        var rendered =
          vivliostyle_node_context.elementRenderResultOf(nodeContext);
        rendered.display = "block";
        var seen = [];
        var resolved = vivliostyle_legacy.legacyFirstTime(
          {
            isFirstTime: function (ctx, firstTime) {
              seen.push(ctx);
              return !firstTime;
            },
          },
          nodeContext,
          rendered,
          false,
        );
        expect(resolved.firstTime).toBe(true);
        expect(seen[0]).not.toBe(nodeContext);
        expect(seen[0].display).toBe("block");
        expect(typeof seen[0].copy).toBe("function");
      });

      it("carries what the formatting context wrote back to the core", function () {
        var nodeContext = elementNodeContext();
        var rendered =
          vivliostyle_node_context.elementRenderResultOf(nodeContext);
        var resolved = vivliostyle_legacy.legacyFirstTime(
          {
            isFirstTime: function (ctx, firstTime) {
              ctx.floatSide = "left";
              ctx.fragmentIndex = 7;
              return firstTime;
            },
          },
          nodeContext,
          rendered,
          true,
        );
        expect(rendered.floatSide).toBe("left");
        expect(resolved.nodeContext).not.toBe(nodeContext);
        expect(resolved.nodeContext.fragmentIndex).toBe(7);
        expect(nodeContext.fragmentIndex).toBe(1);
      });

      it("retags the value the formatting context moved to its after edge", function () {
        var nodeContext = elementNodeContext();
        var resolved = firstTimeOf(
          {
            isFirstTime: function (ctx, firstTime) {
              ctx.after = true;
              return firstTime;
            },
          },
          nodeContext,
          true,
        );
        expect(resolved.nodeContext.kind).toBe("after-element");
        expect(nodeContext.kind).toBe("element");
      });
    });

    it("hands the core value on while no external hook is registered", function () {
      var nodeContext = elementNodeContext();
      var seen = [];
      var resolved = firstTimeOf(
        {
          isFirstTime: function (ctx, firstTime) {
            seen.push(ctx);
            return firstTime;
          },
        },
        nodeContext,
        false,
      );
      expect(resolved.firstTime).toBe(false);
      expect(resolved.nodeContext).toBe(nodeContext);
      expect(typeof seen[0].copy).toBe("undefined");
    });
  });

  describe("the post layout block boundary", function () {
    var hookName = "POST_LAYOUT_BLOCK";

    it("retags what a hook mutated before the next hook reads it", function () {
      var column = constructedColumn();
      var nodeContext = elementNodeContext();
      var checkPoints = [elementNodeContext()];
      var mutating = function (seenNodeContext, seenCheckPoints) {
        seenNodeContext.after = true;
        seenCheckPoints[0].after = true;
      };
      var seen = [];
      var reading = function (seenNodeContext, seenCheckPoints) {
        seen.push(seenNodeContext.kind, seenCheckPoints[0].kind);
      };
      vivliostyle_plugin.registerHook(hookName, reading, true);
      vivliostyle_plugin.registerHook(hookName, mutating, true);
      try {
        column.postLayoutBlock(nodeContext, checkPoints);
      } finally {
        vivliostyle_plugin.removeHook(hookName, mutating);
        vivliostyle_plugin.removeHook(hookName, reading);
      }
      expect(seen).toEqual(["after-element", "after-element"]);
      expect(nodeContext.kind).toBe("after-element");
      expect(checkPoints[0].kind).toBe("after-element");
    });
  });
});
