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

import * as vivliostyle_layout_processor from "../../../src/vivliostyle/layout-processor";
import * as vivliostyle_node_context from "../../../src/vivliostyle/node-context";
import * as vivliostyle_vtree from "../../../src/vivliostyle/vtree";

describe("node-context", function () {
  "use strict";

  function openedAt(after) {
    return vivliostyle_node_context.openAt(
      document.createElement("div"),
      null,
      0,
      new vivliostyle_layout_processor.BlockFormattingContext(null),
      {
        shadowType: vivliostyle_vtree.ShadowType.NONE,
        shadowContext: null,
      },
      { offsetInNode: 0, after: !!after },
    );
  }

  function elementNodeContext() {
    var opened = openedAt(false);
    return vivliostyle_node_context.renderedElement(
      opened,
      document.createElement("div"),
      vivliostyle_node_context.elementRenderResultOf(opened),
    );
  }

  function textNodeContext() {
    var parent = elementNodeContext();
    var child = vivliostyle_node_context.openChildOf(
      document.createTextNode("text"),
      parent,
      1,
    );
    return vivliostyle_node_context.renderedText(
      child,
      document.createTextNode("text"),
      [],
    );
  }

  var renderProgress = {
    lang: "ja",
    vertical: true,
    direction: "rtl",
    inheritedProps: { "font-size": 12 },
    establishesBFC: true,
    display: "block",
    floatSide: "left",
    breakBefore: "page",
    formattingContext: new vivliostyle_layout_processor.BlockFormattingContext(
      null,
    ),
  };

  var renderedFields = {
    nodeShadow: { root: "shadow" },
    inline: false,
    breakPenalty: 7,
    pageType: "cover",
    captionSide: "bottom",
    inlineBorderSpacing: 3,
    blockBorderSpacing: 5,
    firstPseudo: { count: 1 },
    whitespace: vivliostyle_vtree.Whitespace.PRESERVE,
    hyphenateCharacter: "=",
    breakWord: true,
  };

  var elementStyleFields = {
    floatReference: "page",
    clearSide: "both",
    floatMinWrapBlock: { value: 1 },
    columnSpan: { value: "all" },
    flexContainer: true,
    containingBlockForAbsolute: true,
    breakAfter: "page",
    repeatOnBreak: "header",
    afterIfContinues: { source: "after" },
    footnotePolicy: { name: "line" },
  };

  function renderResultOf(nodeContext) {
    var result = vivliostyle_node_context.elementRenderResultOf(nodeContext);
    [renderProgress, renderedFields, elementStyleFields].forEach(
      function (fields) {
        Object.keys(fields).forEach(function (field) {
          result[field] = fields[field];
        });
      },
    );
    return result;
  }

  describe("viewlessRender", function () {
    it("carries the render progress of the result", function () {
      var opened = openedAt(false);
      var rendered = vivliostyle_node_context.viewlessRender(
        opened,
        renderResultOf(opened),
      );
      Object.keys(renderProgress).forEach(function (field) {
        expect(rendered[field]).toBe(renderProgress[field]);
      });
    });

    it("carries the rendered fields of the result", function () {
      var opened = openedAt(false);
      var rendered = vivliostyle_node_context.viewlessRender(
        opened,
        renderResultOf(opened),
      );
      Object.keys(renderedFields).forEach(function (field) {
        expect(rendered[field]).toBe(renderedFields[field]);
      });
    });

    it("leaves the element style fields of the result behind", function () {
      var opened = openedAt(false);
      var rendered = vivliostyle_node_context.viewlessRender(
        opened,
        renderResultOf(opened),
      );
      Object.keys(elementStyleFields).forEach(function (field) {
        expect(rendered[field]).not.toBe(elementStyleFields[field]);
        expect(rendered[field]).toBe(opened[field]);
      });
    });

    it("keeps the element style fields an open context already carries", function () {
      var opened = openedAt(false);
      opened.breakAfter = "column";
      var rendered = vivliostyle_node_context.viewlessRender(
        opened,
        renderResultOf(opened),
      );
      expect(rendered.breakAfter).toBe("column");
    });

    it("keeps an open context open and viewless", function () {
      var opened = openedAt(false);
      var rendered = vivliostyle_node_context.viewlessRender(
        opened,
        renderResultOf(opened),
      );
      expect(rendered.kind).toBe("open");
      expect(rendered.after).toBe(false);
      expect(rendered.viewNode).toBe(null);
    });

    it("keeps an after-none context after and viewless", function () {
      var opened = openedAt(true);
      expect(opened.kind).toBe("after-none");
      var rendered = vivliostyle_node_context.viewlessRender(
        opened,
        renderResultOf(opened),
      );
      expect(rendered.kind).toBe("after-none");
      expect(rendered.after).toBe(true);
      expect(rendered.viewNode).toBe(null);
    });
  });

  describe("openNextSiblingOf", function () {
    it("keeps the inherited fields the previous sibling carried", function () {
      var element = elementNodeContext();
      element.lang = "ja";
      element.direction = "rtl";
      element.inheritedProps = { widows: 3 };
      var next = vivliostyle_node_context.openNextSiblingOf(
        element,
        document.createTextNode("text"),
        7,
      );
      expect(next.lang).toBe("ja");
      expect(next.direction).toBe("rtl");
      expect(next.inheritedProps).toBe(element.inheritedProps);
    });

    it("opens the sibling on the view the previous one held", function () {
      var element = elementNodeContext();
      element.breakAfter = "page";
      var sourceNode = document.createTextNode("text");
      var next = vivliostyle_node_context.openNextSiblingOf(
        element,
        sourceNode,
        7,
      );
      expect(next.kind).toBe("open");
      expect(next.after).toBe(false);
      expect(next.viewNode).toBe(null);
      expect(next.breakAfter).toBe(null);
      expect(next.sourceNode).toBe(sourceNode);
      expect(next.boxOffset).toBe(7);
    });
  });

  describe("viewless", function () {
    it("hands an open context back as itself", function () {
      var opened = openedAt(false);
      expect(vivliostyle_node_context.viewless(opened)).toBe(opened);
    });

    it("hands an after-none context back as itself", function () {
      var opened = openedAt(true);
      expect(vivliostyle_node_context.viewless(opened)).toBe(opened);
    });

    it("opens an element context and unstyles it", function () {
      var element = elementNodeContext();
      element.breakAfter = "page";
      var viewless = vivliostyle_node_context.viewless(element);
      expect(element.kind).toBe("element");
      expect(viewless.kind).toBe("open");
      expect(viewless.after).toBe(false);
      expect(viewless.viewNode).toBe(null);
      expect(viewless.breakAfter).toBe(null);
    });

    it("opens a text context and unstyles it", function () {
      var text = textNodeContext();
      text.breakAfter = "page";
      var viewless = vivliostyle_node_context.viewless(text);
      expect(text.kind).toBe("text");
      expect(viewless.kind).toBe("open");
      expect(viewless.after).toBe(false);
      expect(viewless.viewNode).toBe(null);
      expect(viewless.breakAfter).toBe(null);
    });

    it("closes an after-element context and unstyles it", function () {
      var afterElement =
        vivliostyle_node_context.afterEdgeOf(elementNodeContext());
      afterElement.breakAfter = "page";
      var viewless = vivliostyle_node_context.viewless(afterElement);
      expect(afterElement.kind).toBe("after-element");
      expect(viewless.kind).toBe("after-none");
      expect(viewless.after).toBe(true);
      expect(viewless.viewNode).toBe(null);
      expect(viewless.breakAfter).toBe(null);
    });
  });
});
