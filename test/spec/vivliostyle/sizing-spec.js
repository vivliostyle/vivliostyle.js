describe("sizing", function() {
   "use strict";

    var domUtil = vivliostyle.test.util.dom;
    var sizing = vivliostyle.sizing;
    var Size = sizing.Size;

    var clientLayout = new adapt.vgen.DefaultClientLayout(domUtil.getWindow());
    var containingBlock, element;

    beforeAll(vivliostyle.test.util.matchers.addMatchers);

    beforeEach(function() {
        var container = domUtil.getDummyContainer();
        var doc = container.ownerDocument;
        containingBlock = doc.createElement("div");
        element = doc.createElement("div");
        containingBlock.appendChild(element);
        container.appendChild(containingBlock);
    });

    var initialProperties = {
        containingBlockWidth: 100,
        containingBlockHeight: 120,
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
        expect(eStyle.borderLeft).toBe(initialProperties.borderLeft + "px solid black");
        expect(eStyle.borderRight).toBe(initialProperties.borderRight + "px solid black");
        expect(eStyle.borderTop).toBe(initialProperties.borderTop + "px solid black");
        expect(eStyle.borderBottom).toBe(initialProperties.borderBottom + "px solid black");
        expect(eStyle.paddingLeft).toBe(initialProperties.paddingLeft + "px");
        expect(eStyle.paddingRight).toBe(initialProperties.paddingRight + "px");
        expect(eStyle.paddingTop).toBe(initialProperties.paddingTop + "px");
        expect(eStyle.paddingBottom).toBe(initialProperties.paddingBottom + "px");
    }

    var initialHorizontalBorderAndPadding =
        initialProperties.borderLeft + initialProperties.borderRight + initialProperties.paddingLeft + initialProperties.paddingRight;
    var initialVerticalBorderAndPadding =
        initialProperties.borderTop + initialProperties.borderBottom + initialProperties.paddingTop + initialProperties.paddingBottom;

    describe("getSize", function() {
        describe("fill-available inline size", function() {
            it("is the available inline size minus element's margins, border, and padding", function() {
                setInitialProperties();

                var size = sizing.getSize(clientLayout, element, [Size.FILL_AVAILABLE_INLINE_SIZE]);

                var expected = initialProperties.containingBlockWidth - initialHorizontalBorderAndPadding
                    - initialProperties.marginLeft - initialProperties.marginRight;
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
                setInitialProperties();
                element.style.marginLeft = "auto";

                var size = sizing.getSize(clientLayout, element, [Size.FILL_AVAILABLE_INLINE_SIZE]);

                var expected = initialProperties.containingBlockWidth - initialHorizontalBorderAndPadding - initialProperties.marginRight;
                expect(size[Size.FILL_AVAILABLE_INLINE_SIZE]).toBe(expected);

                element.style.marginRight = "auto";

                size = sizing.getSize(clientLayout, element, [Size.FILL_AVAILABLE_INLINE_SIZE]);

                expected = initialProperties.containingBlockWidth - initialHorizontalBorderAndPadding;
                expect(size[Size.FILL_AVAILABLE_INLINE_SIZE]).toBe(expected);
            });

            it("is the available inline size minus element's margins, border, and padding (in vertical writing mode)", function() {
                setInitialProperties();
                adapt.base.setCSSProperty(containingBlock, "writing-mode", "vertical-rl");

                var size = sizing.getSize(clientLayout, element, [Size.FILL_AVAILABLE_INLINE_SIZE]);

                var expected = initialProperties.containingBlockHeight - initialVerticalBorderAndPadding
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
                setInitialProperties();
                adapt.base.setCSSProperty(containingBlock, "writing-mode", "vertical-rl");
                element.style.marginTop = "auto";

                var size = sizing.getSize(clientLayout, element, [Size.FILL_AVAILABLE_INLINE_SIZE]);

                var expected = initialProperties.containingBlockHeight - initialVerticalBorderAndPadding - initialProperties.marginBottom;
                expect(size[Size.FILL_AVAILABLE_INLINE_SIZE]).toBe(expected);

                element.style.marginBottom = "auto";

                size = sizing.getSize(clientLayout, element, [Size.FILL_AVAILABLE_INLINE_SIZE]);

                expected = initialProperties.containingBlockHeight - initialVerticalBorderAndPadding;
                expect(size[Size.FILL_AVAILABLE_INLINE_SIZE]).toBe(expected);
            });

            it("the original properties and DOM structure are restored after measurement", function() {
                setInitialProperties();

                sizing.getSize(clientLayout, element, [Size.FILL_AVAILABLE_INLINE_SIZE]);

                checkInitialProperties();

                var childNodes = containingBlock.childNodes;
                expect(childNodes.length).toBe(1);
                expect(childNodes[0]).toBeSameNodeAs(element);
            });
        });
    });
});
