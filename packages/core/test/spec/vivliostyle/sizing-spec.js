/**
 * Copyright 2017 Daishinsha Inc.
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

import * as adapt_base from "../../../src/vivliostyle/base";
import * as adapt_vgen from "../../../src/vivliostyle/vgen";
import * as vivliostyle_sizing from "../../../src/vivliostyle/sizing";
import * as vivliostyle_test_util_dom from "../../util/dom";
import * as vivliostyle_test_util_matchers from "../../util/matchers";

describe("sizing", function () {
  "use strict";

  var domUtil = vivliostyle_test_util_dom;
  var sizing = vivliostyle_sizing;
  var Size = sizing.Size;

  var clientLayout = new adapt_vgen.DefaultClientLayout(domUtil.getWindow());
  var containingBlock, element;

  beforeAll(vivliostyle_test_util_matchers.addMatchers);

  beforeEach(function () {
    var container = domUtil.getDummyContainer();
    var doc = container.ownerDocument;
    containingBlock = doc.createElement("div");
    element = doc.createElement("div");
    containingBlock.appendChild(element);
    container.appendChild(containingBlock);
    setInitialProperties();
    setupContent();
  });

  var initialProperties = {
    containingBlockWidth: 91,
    containingBlockHeight: 130,
    containingBlockDisplay: "block",
    containingBlockPosition: "relative",
    elementWidth: 1,
    elementHeight: 1,
    elementDisplay: "block",
    elementPosition: "static",
    marginLeft: 5,
    marginRight: 6,
    marginTop: 11,
    marginBottom: 12,
    borderLeft: 1,
    borderRight: 2,
    borderTop: 7,
    borderBottom: 8,
    paddingLeft: 3,
    paddingRight: 4,
    paddingTop: 9,
    paddingBottom: 10,
  };

  function setInitialProperties() {
    var cStyle = containingBlock.style;
    cStyle.width = initialProperties.containingBlockWidth + "px";
    cStyle.height = initialProperties.containingBlockHeight + "px";
    cStyle.display = initialProperties.containingBlockDisplay;
    cStyle.position = initialProperties.containingBlockPosition;
    var eStyle = element.style;
    eStyle.width = initialProperties.elementWidth + "px";
    eStyle.height = initialProperties.elementHeight + "px";
    eStyle.display = initialProperties.elementDisplay;
    eStyle.position = initialProperties.elementPosition;
    eStyle.marginLeft = initialProperties.marginLeft + "px";
    eStyle.marginRight = initialProperties.marginRight + "px";
    eStyle.marginTop = initialProperties.marginTop + "px";
    eStyle.marginBottom = initialProperties.marginBottom + "px";
    eStyle.borderLeft = initialProperties.borderLeft + "px solid black";
    eStyle.borderRight = initialProperties.borderRight + "px solid black";
    eStyle.borderTop = initialProperties.borderTop + "px solid black";
    eStyle.borderBottom = initialProperties.borderBottom + "px solid black";
    eStyle.paddingLeft = initialProperties.paddingLeft + "px";
    eStyle.paddingRight = initialProperties.paddingRight + "px";
    eStyle.paddingTop = initialProperties.paddingTop + "px";
    eStyle.paddingBottom = initialProperties.paddingBottom + "px";
    eStyle.lineHeight = "0px"; // needed for consistent "ideal" block sizes
  }

  function checkInitialProperties() {
    var cStyle = containingBlock.style;
    expect(cStyle.width).toBe(initialProperties.containingBlockWidth + "px");
    expect(cStyle.height).toBe(initialProperties.containingBlockHeight + "px");
    expect(cStyle.display).toBe(initialProperties.containingBlockDisplay);
    expect(cStyle.position).toBe(initialProperties.containingBlockPosition);
    var eStyle = element.style;
    expect(eStyle.width).toBe(initialProperties.elementWidth + "px");
    expect(eStyle.height).toBe(initialProperties.elementHeight + "px");
    expect(eStyle.display).toBe(initialProperties.elementDisplay);
    expect(eStyle.position).toBe(initialProperties.elementPosition);
    expect(eStyle.marginLeft).toBe(initialProperties.marginLeft + "px");
    expect(eStyle.marginRight).toBe(initialProperties.marginRight + "px");
    expect(eStyle.marginTop).toBe(initialProperties.marginTop + "px");
    expect(eStyle.marginBottom).toBe(initialProperties.marginBottom + "px");
    expect(eStyle.borderLeft).toBe(
      initialProperties.borderLeft + "px solid black",
    );
    expect(eStyle.borderRight).toBe(
      initialProperties.borderRight + "px solid black",
    );
    expect(eStyle.borderTop).toBe(
      initialProperties.borderTop + "px solid black",
    );
    expect(eStyle.borderBottom).toBe(
      initialProperties.borderBottom + "px solid black",
    );
    expect(eStyle.paddingLeft).toBe(initialProperties.paddingLeft + "px");
    expect(eStyle.paddingRight).toBe(initialProperties.paddingRight + "px");
    expect(eStyle.paddingTop).toBe(initialProperties.paddingTop + "px");
    expect(eStyle.paddingBottom).toBe(initialProperties.paddingBottom + "px");
    expect(eStyle.lineHeight).toBe("0px");
  }

  function checkOriginalPropertiesAndDOMStructure() {
    checkInitialProperties();

    var childNodes = containingBlock.childNodes;
    expect(childNodes.length).toBe(1);
    expect(childNodes[0]).toBeSameNodeAs(element);
  }

  function setupContent() {
    var doc = element.ownerDocument;
    function createSpan(size) {
      var s = doc.createElement("span");
      s.style.display = "inline-block";
      s.style.height = size + "px";
      s.style.width = size + "px";
      return s;
    }

    element.appendChild(createSpan(10));
    element.appendChild(createSpan(20));
    element.appendChild(createSpan(30));
    element.appendChild(createSpan(20));
    element.appendChild(doc.createElement("br"));
    element.appendChild(createSpan(20));
  }

  function setVertical() {
    adapt_base.setCSSProperty(containingBlock, "writing-mode", "vertical-rl");
  }

  var horizontalBorderAndPadding =
    initialProperties.borderLeft +
    initialProperties.borderRight +
    initialProperties.paddingLeft +
    initialProperties.paddingRight;
  var horizontalMarginAndBorderAndPadding =
    horizontalBorderAndPadding +
    initialProperties.marginLeft +
    initialProperties.marginRight;
  var verticalBorderAndPadding =
    initialProperties.borderTop +
    initialProperties.borderBottom +
    initialProperties.paddingTop +
    initialProperties.paddingBottom;
  var verticalMarginAndBorderAndPadding =
    verticalBorderAndPadding +
    initialProperties.marginTop +
    initialProperties.marginBottom;

  var fillAvailableInlineSize =
    initialProperties.containingBlockWidth -
    horizontalBorderAndPadding -
    initialProperties.marginLeft -
    initialProperties.marginRight;
  var maxContentInlineSize = 10 + 20 + 30 + 20;
  var minContentInlineSize = 30;
  var idealBlockSize = 10 + 20 + 30 + 20 + 20; // was 30 + 20 + 20 before the fix in PR #1540

  describe("getSize", function () {
    describe("max-content inline size", function () {
      it("is the narrowest inline size it could take if none of the soft wrap opportunities were taken", function () {
        var size = sizing.getSize(clientLayout, element, [
          Size.MAX_CONTENT_INLINE_SIZE,
        ]);

        expect(size[Size.MAX_CONTENT_INLINE_SIZE]).toBeCloseTo(
          maxContentInlineSize,
          1,
        );
      });

      it("is the narrowest inline size it could take if none of the soft wrap opportunities were taken (in vertical writing mode)", function () {
        setVertical();

        var size = sizing.getSize(clientLayout, element, [
          Size.MAX_CONTENT_INLINE_SIZE,
        ]);

        expect(size[Size.MAX_CONTENT_INLINE_SIZE]).toBeCloseTo(
          maxContentInlineSize,
          1,
        );
      });

      it("the original properties and DOM structure are restored after measurement", function () {
        sizing.getSize(clientLayout, element, [Size.MAX_CONTENT_INLINE_SIZE]);

        checkOriginalPropertiesAndDOMStructure();
      });
    });

    describe("max-content block size", function () {
      it('is "ideal" size in the block axis', function () {
        var size = sizing.getSize(clientLayout, element, [
          Size.MAX_CONTENT_BLOCK_SIZE,
        ]);

        expect(size[Size.MAX_CONTENT_BLOCK_SIZE]).toBe(idealBlockSize);
      });

      it('is "ideal" size in the block axis (in vertical writing mode)', function () {
        setVertical();

        var size = sizing.getSize(clientLayout, element, [
          Size.MAX_CONTENT_BLOCK_SIZE,
        ]);

        expect(size[Size.MAX_CONTENT_BLOCK_SIZE]).toBe(idealBlockSize);
      });

      it("the original properties and DOM structure are restored after measurement", function () {
        sizing.getSize(clientLayout, element, [Size.MAX_CONTENT_BLOCK_SIZE]);

        checkOriginalPropertiesAndDOMStructure();
      });
    });

    describe("max-content width", function () {
      it("is max-content inline size in horizontal writing mode", function () {
        var size = sizing.getSize(clientLayout, element, [
          Size.MAX_CONTENT_WIDTH,
        ]);
        var maxContentInline = sizing.getSize(clientLayout, element, [
          Size.MAX_CONTENT_INLINE_SIZE,
        ]);

        expect(size[Size.MAX_CONTENT_WIDTH]).toBe(
          maxContentInline[Size.MAX_CONTENT_INLINE_SIZE],
        );
      });

      it("is max-content block size in vertical writing mode", function () {
        setVertical();
        var size = sizing.getSize(clientLayout, element, [
          Size.MAX_CONTENT_WIDTH,
        ]);
        var maxContentInline = sizing.getSize(clientLayout, element, [
          Size.MAX_CONTENT_BLOCK_SIZE,
        ]);

        expect(size[Size.MAX_CONTENT_WIDTH]).toBe(
          maxContentInline[Size.MAX_CONTENT_BLOCK_SIZE],
        );
      });
    });

    describe("max-content height", function () {
      it("is max-content block size in horizontal writing mode", function () {
        var size = sizing.getSize(clientLayout, element, [
          Size.MAX_CONTENT_HEIGHT,
        ]);
        var maxContentInline = sizing.getSize(clientLayout, element, [
          Size.MAX_CONTENT_BLOCK_SIZE,
        ]);

        expect(size[Size.MAX_CONTENT_HEIGHT]).toBe(
          maxContentInline[Size.MAX_CONTENT_BLOCK_SIZE],
        );
      });

      it("is max-content inline size in vertical writing mode", function () {
        setVertical();
        var size = sizing.getSize(clientLayout, element, [
          Size.MAX_CONTENT_HEIGHT,
        ]);
        var maxContentInline = sizing.getSize(clientLayout, element, [
          Size.MAX_CONTENT_INLINE_SIZE,
        ]);

        expect(size[Size.MAX_CONTENT_HEIGHT]).toBe(
          maxContentInline[Size.MAX_CONTENT_INLINE_SIZE],
        );
      });
    });

    describe("min-content inline size", function () {
      it("is the narrowest inline size it could take if all soft wrap opportunities were taken", function () {
        var size = sizing.getSize(clientLayout, element, [
          Size.MIN_CONTENT_INLINE_SIZE,
        ]);

        expect(size[Size.MIN_CONTENT_INLINE_SIZE]).toBe(minContentInlineSize);
      });

      it("is the narrowest inline size it could take if all soft wrap opportunities were taken (in vertical writing mode)", function () {
        setVertical();

        var size = sizing.getSize(clientLayout, element, [
          Size.MIN_CONTENT_INLINE_SIZE,
        ]);

        expect(size[Size.MIN_CONTENT_INLINE_SIZE]).toBe(minContentInlineSize);
      });

      it("the original properties and DOM structure are restored after measurement", function () {
        sizing.getSize(clientLayout, element, [Size.MIN_CONTENT_INLINE_SIZE]);

        checkOriginalPropertiesAndDOMStructure();
      });
    });

    describe("min-content block size", function () {
      it('is "ideal" size in the block axis', function () {
        var size = sizing.getSize(clientLayout, element, [
          Size.MIN_CONTENT_BLOCK_SIZE,
        ]);

        expect(size[Size.MIN_CONTENT_BLOCK_SIZE]).toBe(idealBlockSize);
      });

      it('is "ideal" size in the block axis (in vertical writing mode)', function () {
        setVertical();

        var size = sizing.getSize(clientLayout, element, [
          Size.MIN_CONTENT_BLOCK_SIZE,
        ]);

        expect(size[Size.MIN_CONTENT_BLOCK_SIZE]).toBe(idealBlockSize);
      });

      it("the original properties and DOM structure are restored after measurement", function () {
        sizing.getSize(clientLayout, element, [Size.MIN_CONTENT_BLOCK_SIZE]);

        checkOriginalPropertiesAndDOMStructure();
      });
    });

    describe("min-content width", function () {
      it("is min-content inline size in horizontal writing mode", function () {
        var size = sizing.getSize(clientLayout, element, [
          Size.MIN_CONTENT_WIDTH,
        ]);
        var minContentInline = sizing.getSize(clientLayout, element, [
          Size.MIN_CONTENT_INLINE_SIZE,
        ]);

        expect(size[Size.MIN_CONTENT_WIDTH]).toBe(
          minContentInline[Size.MIN_CONTENT_INLINE_SIZE],
        );
      });

      it("is min-content block size in vertical writing mode", function () {
        setVertical();
        var size = sizing.getSize(clientLayout, element, [
          Size.MIN_CONTENT_WIDTH,
        ]);
        var minContentInline = sizing.getSize(clientLayout, element, [
          Size.MIN_CONTENT_BLOCK_SIZE,
        ]);

        expect(size[Size.MIN_CONTENT_WIDTH]).toBe(
          minContentInline[Size.MIN_CONTENT_BLOCK_SIZE],
        );
      });
    });

    describe("min-content height", function () {
      it("is min-content block size in horizontal writing mode", function () {
        var size = sizing.getSize(clientLayout, element, [
          Size.MIN_CONTENT_HEIGHT,
        ]);
        var minContentInline = sizing.getSize(clientLayout, element, [
          Size.MIN_CONTENT_BLOCK_SIZE,
        ]);

        expect(size[Size.MIN_CONTENT_HEIGHT]).toBe(
          minContentInline[Size.MIN_CONTENT_BLOCK_SIZE],
        );
      });

      it("is min-content inline size in vertical writing mode", function () {
        setVertical();
        var size = sizing.getSize(clientLayout, element, [
          Size.MIN_CONTENT_HEIGHT,
        ]);
        var minContentInline = sizing.getSize(clientLayout, element, [
          Size.MIN_CONTENT_INLINE_SIZE,
        ]);

        expect(size[Size.MIN_CONTENT_HEIGHT]).toBe(
          minContentInline[Size.MIN_CONTENT_INLINE_SIZE],
        );
      });
    });

    describe("fit-content block size", function () {
      it('is "ideal" size in the block axis', function () {
        var size = sizing.getSize(clientLayout, element, [
          Size.FIT_CONTENT_BLOCK_SIZE,
        ]);

        expect(size[Size.FIT_CONTENT_BLOCK_SIZE]).toBe(idealBlockSize);
      });

      it('is "ideal" size in the block axis (in vertical writing mode)', function () {
        setVertical();

        var size = sizing.getSize(clientLayout, element, [
          Size.FIT_CONTENT_BLOCK_SIZE,
        ]);

        expect(size[Size.FIT_CONTENT_BLOCK_SIZE]).toBe(idealBlockSize);
      });

      it("the original properties and DOM structure are restored after measurement", function () {
        sizing.getSize(clientLayout, element, [Size.FIT_CONTENT_BLOCK_SIZE]);

        checkOriginalPropertiesAndDOMStructure();
      });
    });

    describe("fit-content width", function () {
      it("is fit-content inline size in horizontal writing mode", function () {
        var size = sizing.getSize(clientLayout, element, [
          Size.FIT_CONTENT_WIDTH,
        ]);
        var fitContentInline = sizing.getSize(clientLayout, element, [
          Size.FIT_CONTENT_INLINE_SIZE,
        ]);

        expect(size[Size.FIT_CONTENT_WIDTH]).toBe(
          fitContentInline[Size.FIT_CONTENT_INLINE_SIZE],
        );
      });

      it("is fit-content block size in vertical writing mode", function () {
        setVertical();
        var size = sizing.getSize(clientLayout, element, [
          Size.FIT_CONTENT_WIDTH,
        ]);
        var fitContentInline = sizing.getSize(clientLayout, element, [
          Size.FIT_CONTENT_BLOCK_SIZE,
        ]);

        expect(size[Size.FIT_CONTENT_WIDTH]).toBe(
          fitContentInline[Size.FIT_CONTENT_BLOCK_SIZE],
        );
      });
    });

    describe("fit-content height", function () {
      it("is fit-content block size in horizontal writing mode", function () {
        var size = sizing.getSize(clientLayout, element, [
          Size.FIT_CONTENT_HEIGHT,
        ]);
        var fitContentInline = sizing.getSize(clientLayout, element, [
          Size.FIT_CONTENT_BLOCK_SIZE,
        ]);

        expect(size[Size.FIT_CONTENT_HEIGHT]).toBe(
          fitContentInline[Size.FIT_CONTENT_BLOCK_SIZE],
        );
      });

      it("is fit-content inline size in vertical writing mode", function () {
        setVertical();
        var size = sizing.getSize(clientLayout, element, [
          Size.FIT_CONTENT_HEIGHT,
        ]);
        var fitContentInline = sizing.getSize(clientLayout, element, [
          Size.FIT_CONTENT_INLINE_SIZE,
        ]);

        expect(size[Size.FIT_CONTENT_HEIGHT]).toBe(
          fitContentInline[Size.FIT_CONTENT_INLINE_SIZE],
        );
      });
    });
  });
});
