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
        containingBlockSize: 100,
        containingBlockDisplay: "block",
        containingBlockPosition: "relative",
        elementSize: 1,
        elementDisplay: "block",
        elementPosition: "static",
        marginLeft: 5,
        marginRight: 6,
        borderLeft: 1,
        borderRight: 2,
        paddingLeft: 3,
        paddingRight: 4
    };

    function setInitialProperties() {
        var cStyle = containingBlock.style;
        cStyle.width = initialProperties.containingBlockSize + "px";
        cStyle.display = initialProperties.containingBlockDisplay;
        cStyle.position = initialProperties.containingBlockPosition;
        var eStyle = element.style;
        eStyle.width = initialProperties.elementSize + "px";
        eStyle.display = initialProperties.elementDisplay;
        eStyle.position = initialProperties.elementPosition;
        eStyle.marginLeft = initialProperties.marginLeft + "px";
        eStyle.marginRight = initialProperties.marginRight + "px";
        eStyle.borderLeft = initialProperties.borderLeft + "px solid black";
        eStyle.borderRight = initialProperties.borderRight + "px solid black";
        eStyle.paddingLeft = initialProperties.paddingLeft + "px";
        eStyle.paddingRight = initialProperties.paddingRight + "px";
    }

    function checkInitialProperties() {
        var cStyle = containingBlock.style;
        expect(cStyle.width).toBe(initialProperties.containingBlockSize + "px");
        expect(cStyle.display).toBe(initialProperties.containingBlockDisplay);
        expect(cStyle.position).toBe(initialProperties.containingBlockPosition);
        var eStyle = element.style;
        expect(eStyle.width).toBe(initialProperties.elementSize + "px");
        expect(eStyle.display).toBe(initialProperties.elementDisplay);
        expect(eStyle.position).toBe(initialProperties.elementPosition);
        expect(eStyle.marginLeft).toBe(initialProperties.marginLeft + "px");
        expect(eStyle.marginRight).toBe(initialProperties.marginRight + "px");
        expect(eStyle.borderLeft).toBe(initialProperties.borderLeft + "px solid black");
        expect(eStyle.borderRight).toBe(initialProperties.borderRight + "px solid black");
        expect(eStyle.paddingLeft).toBe(initialProperties.paddingLeft + "px");
        expect(eStyle.paddingRight).toBe(initialProperties.paddingRight + "px");
    }

    var initialBorderAndPadding =
        initialProperties.borderLeft + initialProperties.borderRight + initialProperties.paddingLeft + initialProperties.paddingRight;

    describe("getSize", function() {
        describe("fill-available inline size", function() {
            it("is the available inline size minus element's margins, border, and padding", function() {
                setInitialProperties();

                var size = sizing.getSize(clientLayout, element, [Size.FILL_AVAILABLE_INLINE_SIZE]);

                var expected = initialProperties.containingBlockSize - initialBorderAndPadding
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

                var expected = initialProperties.containingBlockSize - initialBorderAndPadding - initialProperties.marginRight;
                expect(size[Size.FILL_AVAILABLE_INLINE_SIZE]).toBe(expected);

                element.style.marginRight = "auto";

                size = sizing.getSize(clientLayout, element, [Size.FILL_AVAILABLE_INLINE_SIZE]);

                expected = initialProperties.containingBlockSize - initialBorderAndPadding;
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
