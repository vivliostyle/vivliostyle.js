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

import * as css from "../../../src/vivliostyle/css";
import * as footnotes from "../../../src/vivliostyle/footnotes";
import * as layoutProcessor from "../../../src/vivliostyle/layout-processor";
import * as pageFloats from "../../../src/vivliostyle/page-floats";
import * as vtree from "../../../src/vivliostyle/vtree";

describe("footnotes", function () {
  describe("line-policy constraints after table re-layout", function () {
    var container, context, formattingContext, sourceNote, sourcePosition;

    beforeEach(function () {
      container = document.createElement("div");
      document.body.appendChild(container);
      context = pageFloats.PageFloatLayoutContext.createWithContainer(
        { element: container, vertical: false },
        pageFloats.RootPageFloatLayoutContext.createRoot(),
        pageFloats.FloatReference.PAGE,
        "body",
        null,
        null,
        null,
      );
      formattingContext = new layoutProcessor.BlockFormattingContext(null);
      sourceNote = document.createElement("span");
      var tableContext = new vtree.NodeContext(
        document.createElement("table"),
        null,
        0,
        formattingContext,
      );
      var cellContext = new vtree.NodeContext(
        document.createElement("td"),
        tableContext,
        0,
        formattingContext,
      );
      sourcePosition = new vtree.NodeContext(
        sourceNote,
        cellContext,
        0,
        formattingContext,
      ).toNodePosition();
    });

    afterEach(function () {
      container.remove();
    });

    function viewNode(top, bottom) {
      var node = document.createElement("span");
      container.appendChild(node);
      var rect = {
        left: 0,
        right: 20,
        top: top,
        bottom: bottom,
        width: 20,
        height: bottom - top,
      };
      spyOn(node, "getBoundingClientRect").and.returnValue(rect);
      spyOn(node, "getClientRects").and.returnValue([rect]);
      return node;
    }

    function registerFootnote(position) {
      var float = new footnotes.Footnote(
        position,
        pageFloats.FloatReference.PAGE,
        "body",
        css.ident.line,
        null,
        sourceNote,
      );
      context.addPageFloat(float);
      return float;
    }

    function forbidFootnote(float, anchor) {
      context.registerPageFloatAnchor(float, anchor);
      new footnotes.FootnoteLayoutStrategy().forbid(float, context);
      return context.getLayoutConstraints()[0];
    }

    function currentCall(sourceNode, parent) {
      var nodeContext = new vtree.NodeContext(
        sourceNode,
        parent,
        0,
        formattingContext,
      );
      nodeContext.floatSide = "footnote";
      nodeContext.viewNode = viewNode(20, 30);
      return nodeContext;
    }

    it("keeps a forbidden call constrained when its pseudo-column position is shorter and moves earlier", function () {
      var float = registerFootnote(sourcePosition);
      var constraint = forbidFootnote(float, viewNode(90, 100));
      var call = currentCall(sourceNote, null);

      expect(call.toNodePosition().steps.length).toBeLessThan(
        sourcePosition.steps.length,
      );
      expect(constraint.allowLayout(call)).toBe(false);
      call.after = true;
      expect(constraint.allowLayout(call)).toBe(false);
    });

    it("allows another footnote that uses the same shadow template with a different owner", function () {
      var firstOwner = new vtree.NodeContext(
        document.createElement("a"),
        null,
        0,
        formattingContext,
      );
      var secondOwner = new vtree.NodeContext(
        document.createElement("a"),
        null,
        0,
        formattingContext,
      );
      var firstCall = currentCall(sourceNote, firstOwner);
      var secondCall = currentCall(sourceNote, secondOwner);
      var firstFloat = registerFootnote(firstCall.toNodePosition());
      registerFootnote(secondCall.toNodePosition());
      var constraint = forbidFootnote(firstFloat, viewNode(90, 100));

      expect(constraint.allowLayout(firstCall)).toBe(false);
      expect(constraint.allowLayout(secondCall)).toBe(true);
      firstCall.after = true;
      secondCall.after = true;
      expect(constraint.allowLayout(firstCall)).toBe(false);
      expect(constraint.allowLayout(secondCall)).toBe(true);
    });

    it("allows content before the call when its previous anchor has been removed", function () {
      var float = registerFootnote(sourcePosition);
      var anchor = document.createElement("span");
      container.appendChild(anchor);
      anchor.remove();
      var constraint = forbidFootnote(float, anchor);
      var preceding = new vtree.NodeContext(
        document.createElement("p"),
        null,
        0,
        formattingContext,
      );
      preceding.inline = false;
      preceding.viewNode = viewNode(40, 50);

      expect(constraint.allowLayout(preceding)).toBe(true);
      expect(constraint.allowLayout(currentCall(sourceNote, null))).toBe(false);
    });

    it("preserves geometric line constraints with a live anchor and no float context", function () {
      var constraint = new footnotes.LineFootnotePolicyLayoutConstraint(
        registerFootnote(sourcePosition),
        viewNode(90, 100),
        false,
      );
      var preceding = currentCall(document.createElement("span"), null);
      var following = currentCall(document.createElement("span"), null);
      following.viewNode = viewNode(100, 110);

      expect(constraint.allowLayout(preceding)).toBe(true);
      expect(constraint.allowLayout(following)).toBe(false);
    });
  });
});
