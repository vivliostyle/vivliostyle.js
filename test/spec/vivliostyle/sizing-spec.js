/**
 * Copyright 2017 Trim-marks Inc.
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

import * as adapt_base from "../../../src/ts/adapt/base";
import * as adapt_vgen from "../../../src/ts/adapt/vgen";
import * as vivliostyle_sizing from "../../../src/ts/vivliostyle/sizing";
import * as vivliostyle_test_util_dom from "../../util/dom";
import * as vivliostyle_test_util_matchers from "../../util/matchers";

describe("sizing", function() {
    "use strict";

    var domUtil = vivliostyle_test_util_dom;
    var sizing = vivliostyle_sizing;
    var Size = sizing.Size;

    var clientLayout = new adapt_vgen.DefaultClientLayout(domUtil.getWindow());
    var containingBlock, element;

    beforeAll(vivliostyle_test_util_matchers.addMatchers);

    beforeEach(function() {
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
        elementMaxWidth: 3,
        elementMinWidth: 2,
        elementHeight: 1,
        elementMaxHeight: 3,
        elementMinHeight: 2,
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
        paddingBottom: 10
    };

    function setInitialProperties() {
        var cStyle = containingBlock.style;
        cStyle.width = initialProperties.containingBlockWidth + "px";
        cStyle.height = initialProperties.containingBlockHeight + "px";
        cStyle.display = initialProperties.containingBlockDisplay;
        cStyle.position = initialProperties.containingBlockPosition;
        var eStyle = element.style;
        eStyle.width = initialProperties.elementWidth + "px";
        eStyle.maxWidth = initialProperties.elementMaxWidth + "px";
        eStyle.minWidth = initialProperties.elementMinWidth + "px";
        eStyle.height = initialProperties.elementHeight + "px";
        eStyle.maxHeight = initialProperties.elementMaxHeight + "px";
        eStyle.minHeight = initialProperties.elementMinHeight + "px";
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
        expect(eStyle.maxWidth).toBe(initialProperties.elementMaxWidth + "px");
        expect(eStyle.minWidth).toBe(initialProperties.elementMinWidth + "px");
        expect(eStyle.height).toBe(initialProperties.elementHeight + "px");
        expect(eStyle.maxHeight).toBe(initialProperties.elementMaxHeight + "px");
        expect(eStyle.minHeight).toBe(initialProperties.elementMinHeight + "px");
        expect(eStyle.display).toBe(initialProperties.elementDisplay);
        expect(eStyle.position).toBe(initialProperties.elementPosition);
        expect(eStyle.marginLeft).toBe(initialProperties.marginLeft + "px");
        expect(eStyle.marginRight).toBe(initialProperties.marginRight + "px");
        expect(eStyle.marginTop).toBe(initialProperties.marginTop + "px");
        expect(eStyle.marginBottom).toBe(initialProperties.marginBottom + "px");
        expect(eStyle.borderLeft).toBe(initialProperties.borderLeft + "px solid black");
        expect(eStyle.borderRight).toBe(initialProperties.borderRight + "px solid black");
        expect(eStyle.borderTop).toBe(initialProperties.borderTop + "px solid black");
        expect(eStyle.borderBottom).toBe(initialProperties.borderBottom + "px solid black");
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
        initialProperties.borderLeft + initialProperties.borderRight + initialProperties.paddingLeft + initialProperties.paddingRight;
    var horizontalMarginAndBorderAndPadding = horizontalBorderAndPadding + initialProperties.marginLeft + initialProperties.marginRight;
    var verticalBorderAndPadding =
        initialProperties.borderTop + initialProperties.borderBottom + initialProperties.paddingTop + initialProperties.paddingBottom;
    var verticalMarginAndBorderAndPadding = verticalBorderAndPadding + initialProperties.marginTop + initialProperties.marginBottom;

    var fillAvailableInlineSize = initialProperties.containingBlockWidth - horizontalBorderAndPadding
        - initialProperties.marginLeft - initialProperties.marginRight;
    var maxContentInlineSize = 10 + 20 + 30 + 20;
    var minContentInlineSize = 30;
    var idealBlockSize = 30 + 20 + 20;

    describe("getSize", function() {
        describe("fill-available inline size", function() {
            it("is the available inline size minus element's margins, border, and padding", function() {
                var size = sizing.getSize(clientLayout, element, [Size.FILL_AVAILABLE_INLINE_SIZE]);

                var expected = fillAvailableInlineSize;
                expect(size[Size.FILL_AVAILABLE_INLINE_SIZE]).toBe(expected);

                element.style.borderLeft = "none";

                size = sizing.getSize(clientLayout, element, [Size.FILL_AVAILABLE_INLINE_SIZE]);

                expected += initialProperties.borderLeft;
                expect(size[Size.FILL_AVAILABLE_INLINE_SIZE]).toBe(expected);

                element.style.borderRight = "none";

                size = sizing.getSize(clientLayout, element, [Size.FILL_AVAILABLE_INLINE_SIZE]);

                expected += initialProperties.borderRight;
                expect(size[Size.FILL_AVAILABLE_INLINE_SIZE]).toBe(expected);
            });

            it("any auto margin is treated as zero", function() {
                element.style.marginLeft = "auto";

                var size = sizing.getSize(clientLayout, element, [Size.FILL_AVAILABLE_INLINE_SIZE]);

                var expected = initialProperties.containingBlockWidth - horizontalBorderAndPadding - initialProperties.marginRight;
                expect(size[Size.FILL_AVAILABLE_INLINE_SIZE]).toBe(expected);

                element.style.marginRight = "auto";

                size = sizing.getSize(clientLayout, element, [Size.FILL_AVAILABLE_INLINE_SIZE]);

                expected = initialProperties.containingBlockWidth - horizontalBorderAndPadding;
                expect(size[Size.FILL_AVAILABLE_INLINE_SIZE]).toBe(expected);
            });

            it("is the available inline size minus element's margins, border, and padding (in vertical writing mode)", function() {
                setVertical();

                var size = sizing.getSize(clientLayout, element, [Size.FILL_AVAILABLE_INLINE_SIZE]);

                var expected = initialProperties.containingBlockHeight - verticalBorderAndPadding
                    - initialProperties.marginTop - initialProperties.marginBottom;
                expect(size[Size.FILL_AVAILABLE_INLINE_SIZE]).toBe(expected);

                element.style.borderTop = "none";

                size = sizing.getSize(clientLayout, element, [Size.FILL_AVAILABLE_INLINE_SIZE]);

                expected += initialProperties.borderTop;
                expect(size[Size.FILL_AVAILABLE_INLINE_SIZE]).toBe(expected);

                element.style.borderBottom = "none";

                size = sizing.getSize(clientLayout, element, [Size.FILL_AVAILABLE_INLINE_SIZE]);

                expected += initialProperties.borderBottom;
                expect(size[Size.FILL_AVAILABLE_INLINE_SIZE]).toBe(expected);
            });

            it("any auto margin is treated as zero (in vertical writing mode)", function() {
                setVertical();
                element.style.marginTop = "auto";

                var size = sizing.getSize(clientLayout, element, [Size.FILL_AVAILABLE_INLINE_SIZE]);

                var expected = initialProperties.containingBlockHeight - verticalBorderAndPadding - initialProperties.marginBottom;
                expect(size[Size.FILL_AVAILABLE_INLINE_SIZE]).toBe(expected);

                element.style.marginBottom = "auto";

                size = sizing.getSize(clientLayout, element, [Size.FILL_AVAILABLE_INLINE_SIZE]);

                expected = initialProperties.containingBlockHeight - verticalBorderAndPadding;
                expect(size[Size.FILL_AVAILABLE_INLINE_SIZE]).toBe(expected);
            });

            it("the original properties and DOM structure are restored after measurement", function() {
                sizing.getSize(clientLayout, element, [Size.FILL_AVAILABLE_INLINE_SIZE]);

                checkOriginalPropertiesAndDOMStructure();
            });
        });

        describe("fill-available width", function() {
            it("is fill-available inline size in horizontal writing mode", function() {
                var size = sizing.getSize(clientLayout, element, [Size.FILL_AVAILABLE_WIDTH]);
                var fillAvailableInline = sizing.getSize(clientLayout, element, [Size.FILL_AVAILABLE_INLINE_SIZE]);

                expect(size[Size.FILL_AVAILABLE_WIDTH]).toBe(fillAvailableInline[Size.FILL_AVAILABLE_INLINE_SIZE]);
            });
        });

        describe("fill-available height", function() {
            it("is fill-available inline size in vertical writing mode", function() {
                setVertical();
                var size = sizing.getSize(clientLayout, element, [Size.FILL_AVAILABLE_HEIGHT]);
                var fillAvailableInline = sizing.getSize(clientLayout, element, [Size.FILL_AVAILABLE_INLINE_SIZE]);

                expect(size[Size.FILL_AVAILABLE_HEIGHT]).toBe(fillAvailableInline[Size.FILL_AVAILABLE_INLINE_SIZE]);
            });
        });

        describe("max-content inline size", function() {
            it("is the narrowest inline size it could take if none of the soft wrap opportunities were taken", function() {
                var size = sizing.getSize(clientLayout, element, [Size.MAX_CONTENT_INLINE_SIZE]);

                expect(size[Size.MAX_CONTENT_INLINE_SIZE]).toBeCloseTo(maxContentInlineSize, 1);
            });

            it("is the narrowest inline size it could take if none of the soft wrap opportunities were taken (in vertical writing mode)", function() {
                setVertical();

                var size = sizing.getSize(clientLayout, element, [Size.MAX_CONTENT_INLINE_SIZE]);

                expect(size[Size.MAX_CONTENT_INLINE_SIZE]).toBeCloseTo(maxContentInlineSize, 1);
            });

            it("the original properties and DOM structure are restored after measurement", function() {
                sizing.getSize(clientLayout, element, [Size.MAX_CONTENT_INLINE_SIZE]);

                checkOriginalPropertiesAndDOMStructure();
            });
        });

        describe("max-content block size", function() {
            it("is \"ideal\" size in the block axis", function() {
                var size = sizing.getSize(clientLayout, element, [Size.MAX_CONTENT_BLOCK_SIZE]);

                expect(size[Size.MAX_CONTENT_BLOCK_SIZE]).toBe(idealBlockSize);
            });

            it("is \"ideal\" size in the block axis (in vertical writing mode)", function() {
                setVertical();

                var size = sizing.getSize(clientLayout, element, [Size.MAX_CONTENT_BLOCK_SIZE]);

                expect(size[Size.MAX_CONTENT_BLOCK_SIZE]).toBe(idealBlockSize);
            });

            it("the original properties and DOM structure are restored after measurement", function() {
                sizing.getSize(clientLayout, element, [Size.MAX_CONTENT_BLOCK_SIZE]);

                checkOriginalPropertiesAndDOMStructure();
            });
        });

        describe("max-content width", function() {
            it("is max-content inline size in horizontal writing mode", function() {
                var size = sizing.getSize(clientLayout, element, [Size.MAX_CONTENT_WIDTH]);
                var maxContentInline = sizing.getSize(clientLayout, element, [Size.MAX_CONTENT_INLINE_SIZE]);

                expect(size[Size.MAX_CONTENT_WIDTH]).toBe(maxContentInline[Size.MAX_CONTENT_INLINE_SIZE]);
            });

            it("is max-content block size in vertical writing mode", function() {
                setVertical();
                var size = sizing.getSize(clientLayout, element, [Size.MAX_CONTENT_WIDTH]);
                var maxContentInline = sizing.getSize(clientLayout, element, [Size.MAX_CONTENT_BLOCK_SIZE]);

                expect(size[Size.MAX_CONTENT_WIDTH]).toBe(maxContentInline[Size.MAX_CONTENT_BLOCK_SIZE]);
            });
        });

        describe("max-content height", function() {
            it("is max-content block size in horizontal writing mode", function() {
                var size = sizing.getSize(clientLayout, element, [Size.MAX_CONTENT_HEIGHT]);
                var maxContentInline = sizing.getSize(clientLayout, element, [Size.MAX_CONTENT_BLOCK_SIZE]);

                expect(size[Size.MAX_CONTENT_HEIGHT]).toBe(maxContentInline[Size.MAX_CONTENT_BLOCK_SIZE]);
            });

            it("is max-content inline size in vertical writing mode", function() {
                setVertical();
                var size = sizing.getSize(clientLayout, element, [Size.MAX_CONTENT_HEIGHT]);
                var maxContentInline = sizing.getSize(clientLayout, element, [Size.MAX_CONTENT_INLINE_SIZE]);

                expect(size[Size.MAX_CONTENT_HEIGHT]).toBe(maxContentInline[Size.MAX_CONTENT_INLINE_SIZE]);
            });
        });

        describe("min-content inline size", function() {
            it("is the narrowest inline size it could take if all soft wrap opportunities were taken", function() {
                var size = sizing.getSize(clientLayout, element, [Size.MIN_CONTENT_INLINE_SIZE]);

                expect(size[Size.MIN_CONTENT_INLINE_SIZE]).toBe(minContentInlineSize);
            });

            it("is the narrowest inline size it could take if all soft wrap opportunities were taken (in vertical writing mode)", function() {
                setVertical();

                var size = sizing.getSize(clientLayout, element, [Size.MIN_CONTENT_INLINE_SIZE]);

                expect(size[Size.MIN_CONTENT_INLINE_SIZE]).toBe(minContentInlineSize);
            });

            it("the original properties and DOM structure are restored after measurement", function() {
                sizing.getSize(clientLayout, element, [Size.MIN_CONTENT_INLINE_SIZE]);

                checkOriginalPropertiesAndDOMStructure();
            });
        });

        describe("min-content block size", function() {
            it("is \"ideal\" size in the block axis", function() {
                var size = sizing.getSize(clientLayout, element, [Size.MIN_CONTENT_BLOCK_SIZE]);

                expect(size[Size.MIN_CONTENT_BLOCK_SIZE]).toBe(idealBlockSize);
            });

            it("is \"ideal\" size in the block axis (in vertical writing mode)", function() {
                setVertical();

                var size = sizing.getSize(clientLayout, element, [Size.MIN_CONTENT_BLOCK_SIZE]);

                expect(size[Size.MIN_CONTENT_BLOCK_SIZE]).toBe(idealBlockSize);
            });

            it("the original properties and DOM structure are restored after measurement", function() {
                sizing.getSize(clientLayout, element, [Size.MIN_CONTENT_BLOCK_SIZE]);

                checkOriginalPropertiesAndDOMStructure();
            });
        });

        describe("min-content width", function() {
            it("is min-content inline size in horizontal writing mode", function() {
                var size = sizing.getSize(clientLayout, element, [Size.MIN_CONTENT_WIDTH]);
                var minContentInline = sizing.getSize(clientLayout, element, [Size.MIN_CONTENT_INLINE_SIZE]);

                expect(size[Size.MIN_CONTENT_WIDTH]).toBe(minContentInline[Size.MIN_CONTENT_INLINE_SIZE]);
            });

            it("is min-content block size in vertical writing mode", function() {
                setVertical();
                var size = sizing.getSize(clientLayout, element, [Size.MIN_CONTENT_WIDTH]);
                var minContentInline = sizing.getSize(clientLayout, element, [Size.MIN_CONTENT_BLOCK_SIZE]);

                expect(size[Size.MIN_CONTENT_WIDTH]).toBe(minContentInline[Size.MIN_CONTENT_BLOCK_SIZE]);
            });
        });

        describe("min-content height", function() {
            it("is min-content block size in horizontal writing mode", function() {
                var size = sizing.getSize(clientLayout, element, [Size.MIN_CONTENT_HEIGHT]);
                var minContentInline = sizing.getSize(clientLayout, element, [Size.MIN_CONTENT_BLOCK_SIZE]);

                expect(size[Size.MIN_CONTENT_HEIGHT]).toBe(minContentInline[Size.MIN_CONTENT_BLOCK_SIZE]);
            });

            it("is min-content inline size in vertical writing mode", function() {
                setVertical();
                var size = sizing.getSize(clientLayout, element, [Size.MIN_CONTENT_HEIGHT]);
                var minContentInline = sizing.getSize(clientLayout, element, [Size.MIN_CONTENT_INLINE_SIZE]);

                expect(size[Size.MIN_CONTENT_HEIGHT]).toBe(minContentInline[Size.MIN_CONTENT_INLINE_SIZE]);
            });
        });

        describe("fit-content inline size", function() {
            it("equals min-content size when (fill-available size) < (min-content size)", function() {
                containingBlock.style.width = (horizontalMarginAndBorderAndPadding + minContentInlineSize - 1) + "px";

                var size = sizing.getSize(clientLayout, element, [Size.FIT_CONTENT_INLINE_SIZE]);

                expect(size[Size.FIT_CONTENT_INLINE_SIZE]).toBe(minContentInlineSize);
            });

            it("equals fill-available size when (min-content size) <= (fill-available size) <= (max-content size)", function() {
                containingBlock.style.width = (horizontalMarginAndBorderAndPadding + minContentInlineSize + 1) + "px";

                var size = sizing.getSize(clientLayout, element, [Size.FIT_CONTENT_INLINE_SIZE]);

                expect(size[Size.FIT_CONTENT_INLINE_SIZE]).toBe(minContentInlineSize + 1);

                containingBlock.style.width = (horizontalMarginAndBorderAndPadding + maxContentInlineSize - 1) + "px";

                size = sizing.getSize(clientLayout, element, [Size.FIT_CONTENT_INLINE_SIZE]);

                expect(size[Size.FIT_CONTENT_INLINE_SIZE]).toBe(maxContentInlineSize - 1);
            });

            it("equals max-content size when (max-content size) < (fill-available size)", function() {
                containingBlock.style.width = (horizontalMarginAndBorderAndPadding + maxContentInlineSize + 1) + "px";

                var size = sizing.getSize(clientLayout, element, [Size.FIT_CONTENT_INLINE_SIZE]);

                expect(size[Size.FIT_CONTENT_INLINE_SIZE]).toBeCloseTo(maxContentInlineSize, 1);
            });

            it("the original properties and DOM structure are restored after measurement", function() {
                sizing.getSize(clientLayout, element, [Size.FIT_CONTENT_INLINE_SIZE]);

                checkOriginalPropertiesAndDOMStructure();
            });

            it("equals min-content size when (fill-available size) < (min-content size) (in vertical writing mode)", function() {
                setVertical();
                containingBlock.style.height = (verticalMarginAndBorderAndPadding + minContentInlineSize - 1) + "px";

                var size = sizing.getSize(clientLayout, element, [Size.FIT_CONTENT_INLINE_SIZE]);

                expect(size[Size.FIT_CONTENT_INLINE_SIZE]).toBe(minContentInlineSize);
            });

            it("equals fill-available size when (min-content size) <= (fill-available size) <= (max-content size) (in vertical writing mode)", function() {
                setVertical();
                containingBlock.style.height = (verticalMarginAndBorderAndPadding + minContentInlineSize + 1) + "px";

                var size = sizing.getSize(clientLayout, element, [Size.FIT_CONTENT_INLINE_SIZE]);

                expect(size[Size.FIT_CONTENT_INLINE_SIZE]).toBe(minContentInlineSize + 1);

                containingBlock.style.height = (verticalMarginAndBorderAndPadding + maxContentInlineSize - 1) + "px";

                size = sizing.getSize(clientLayout, element, [Size.FIT_CONTENT_INLINE_SIZE]);

                expect(size[Size.FIT_CONTENT_INLINE_SIZE]).toBe(maxContentInlineSize - 1);
            });

            it("equals max-content size when (max-content size) < (fill-available size) (in vertical writing mode)", function() {
                setVertical();
                containingBlock.style.height = (verticalMarginAndBorderAndPadding + maxContentInlineSize + 1) + "px";

                var size = sizing.getSize(clientLayout, element, [Size.FIT_CONTENT_INLINE_SIZE]);

                expect(size[Size.FIT_CONTENT_INLINE_SIZE]).toBeCloseTo(maxContentInlineSize, 1);
            });

            it("the original properties and DOM structure are restored after measurement", function() {
                sizing.getSize(clientLayout, element, [Size.FIT_CONTENT_BLOCK_SIZE]);

                checkOriginalPropertiesAndDOMStructure();
            });
        });

        describe("fit-content block size", function() {
            it("is \"ideal\" size in the block axis", function() {
                var size = sizing.getSize(clientLayout, element, [Size.FIT_CONTENT_BLOCK_SIZE]);

                expect(size[Size.FIT_CONTENT_BLOCK_SIZE]).toBe(idealBlockSize);
            });

            it("is \"ideal\" size in the block axis (in vertical writing mode)", function() {
                setVertical();

                var size = sizing.getSize(clientLayout, element, [Size.FIT_CONTENT_BLOCK_SIZE]);

                expect(size[Size.FIT_CONTENT_BLOCK_SIZE]).toBe(idealBlockSize);
            });

            it("the original properties and DOM structure are restored after measurement", function() {
                sizing.getSize(clientLayout, element, [Size.FIT_CONTENT_BLOCK_SIZE]);

                checkOriginalPropertiesAndDOMStructure();
            });
        });

        describe("fit-content width", function() {
            it("is fit-content inline size in horizontal writing mode", function() {
                var size = sizing.getSize(clientLayout, element, [Size.FIT_CONTENT_WIDTH]);
                var fitContentInline = sizing.getSize(clientLayout, element, [Size.FIT_CONTENT_INLINE_SIZE]);

                expect(size[Size.FIT_CONTENT_WIDTH]).toBe(fitContentInline[Size.FIT_CONTENT_INLINE_SIZE]);
            });

            it("is fit-content block size in vertical writing mode", function() {
                setVertical();
                var size = sizing.getSize(clientLayout, element, [Size.FIT_CONTENT_WIDTH]);
                var fitContentInline = sizing.getSize(clientLayout, element, [Size.FIT_CONTENT_BLOCK_SIZE]);

                expect(size[Size.FIT_CONTENT_WIDTH]).toBe(fitContentInline[Size.FIT_CONTENT_BLOCK_SIZE]);
            });
        });

        describe("fit-content height", function() {
            it("is fit-content block size in horizontal writing mode", function() {
                var size = sizing.getSize(clientLayout, element, [Size.FIT_CONTENT_HEIGHT]);
                var fitContentInline = sizing.getSize(clientLayout, element, [Size.FIT_CONTENT_BLOCK_SIZE]);

                expect(size[Size.FIT_CONTENT_HEIGHT]).toBe(fitContentInline[Size.FIT_CONTENT_BLOCK_SIZE]);
            });

            it("is fit-content inline size in vertical writing mode", function() {
                setVertical();
                var size = sizing.getSize(clientLayout, element, [Size.FIT_CONTENT_HEIGHT]);
                var fitContentInline = sizing.getSize(clientLayout, element, [Size.FIT_CONTENT_INLINE_SIZE]);

                expect(size[Size.FIT_CONTENT_HEIGHT]).toBe(fitContentInline[Size.FIT_CONTENT_INLINE_SIZE]);
            });
        });
    });
});
