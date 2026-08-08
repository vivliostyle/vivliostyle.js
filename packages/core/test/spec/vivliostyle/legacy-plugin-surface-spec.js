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
import * as vivliostyle_vtree from "../../../src/vivliostyle/vtree";

import "../../../src/vivliostyle";

describe("legacy-plugin-surface", function () {
  "use strict";

  var hookNames = [
    "PREPROCESS_TEXT_CONTENT",
    "PREPROCESS_ELEMENT_STYLE",
    "RESOLVE_FORMATTING_CONTEXT",
    "RESOLVE_TEXT_NODE_BREAKER",
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
      expect(legacy.shared).toBe(true);
      expect(legacy.copy()).toBe(legacy);
      expect(legacy.isInsideBFC()).toBe(false);
      expect(legacy.getContainingBlockForAbsolute()).toBe(null);
      expect(legacy.toNodePositionStep().node).toBe(legacy.sourceNode);
      expect(legacy.toNodePosition().steps.length).toBe(1);
      expect(legacy.belongsTo(legacy.formattingContext)).toBe(false);
    });

    it("modifies into a separate value carrying the same position", function () {
      var legacy = vivliostyle_legacy.asLegacyNodeContext(
        hookName,
        openTextNodeContext(),
      );
      legacy.display = "block";
      var modified = legacy.modify();
      expect(modified).not.toBe(legacy);
      expect(modified.sourceNode).toBe(legacy.sourceNode);
      expect(modified.boxOffset).toBe(legacy.boxOffset);
      expect(modified.display).toBe("block");
      expect(modified.shared).toBe(true);
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
  });
});
