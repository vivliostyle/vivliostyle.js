/**
 * Copyright 2015 Vivliostyle Inc.
 * @fileoverview CSS Intrinsic & Extrinsic Sizing
 */
goog.provide("vivliostyle.sizing");

goog.require("adapt.base");
goog.require("adapt.vtree");

/**
 * Box sizes defined in css-sizing.
 * @enum {string}
 */
vivliostyle.sizing.Size = {
    FILL_AVAILABLE_INLINE_SIZE: "fill-available inline size",
    FILL_AVAILABLE_BLOCK_SIZE: "fill-available block size",
    FILL_AVAILABLE_WIDTH: "fill-available width",
    FILL_AVAILABLE_HEIGHT: "fill-available height",
    MAX_CONTENT_INLINE_SIZE: "max-content inline size",
    MAX_CONTENT_BLOCK_SIZE: "max-content block size",
    MAX_CONTENT_WIDTH: "max-content width",
    MAX_CONTENT_HEIGHT: "max-content height",
    MIN_CONTENT_INLINE_SIZE: "min-content inline size",
    MIN_CONTENT_BLOCK_SIZE: "min-content block size",
    MIN_CONTENT_WIDTH: "min-content width",
    MIN_CONTENT_HEIGHT: "min-content height",
    FIT_CONTENT_INLINE_SIZE: "fit-content inline size",
    FIT_CONTENT_BLOCK_SIZE: "fit-content block size",
    FIT_CONTENT_WIDTH: "fit-content width",
    FIT_CONTENT_HEIGHT: "fit-content height"
};

/**
 * Get specified sizes for the element.
 * @param {adapt.vtree.ClientLayout} clientLayout
 * @param {Element} element
 * @param {!Array.<vivliostyle.sizing.Size>} sizes
 * @returns {!Object.<vivliostyle.sizing.Size, number>}
 */
vivliostyle.sizing.getSize = function(clientLayout, element, sizes) {
    var original = {
        display: element.style.display,
        position: element.style.position,
        width: /** @type {string} */ (element.style.width),
        height: /** @type {string} */ (element.style.height)
    };
    var doc = element.ownerDocument;
    var parent = element.parentNode;

    // wrap the element with a dummy container element
    var container = doc.createElement("div");
    adapt.base.setCSSProperty(container, "position", original.position);
    parent.insertBefore(container, element);
    container.appendChild(element);

    adapt.base.setCSSProperty(element, "width", "auto");
    adapt.base.setCSSProperty(element, "height", "auto");

    /**
     * @param {string} name
     * @returns {string}
     */
    function getComputedValue(name) {
        return clientLayout.getElementComputedStyle(element).getPropertyValue(name);
    }

    var writingModeProperty = adapt.base.getPrefixedProperty("writing-mode");
    var writingModeValue = (writingModeProperty ? getComputedValue(writingModeProperty) : null) ||
        getComputedValue("writing-mode");
    var isVertical = writingModeValue === "vertical-rl" || writingModeValue === "tb-rl" ||
                     writingModeValue === "vertical-lr" || writingModeValue === "tb-lr";
    var inlineSizeName = isVertical ? "height" : "width";
    var blockSizeName = isVertical ? "width" : "height";

    /** @returns {string} */
    function getFillAvailableInline() {
        adapt.base.setCSSProperty(element, "display", "block");
        adapt.base.setCSSProperty(element, "position", "static");
        return getComputedValue(inlineSizeName);
    }

    // Inline size of an inline-block element is the fit-content (shrink-to-fit) inline size.

    /** @returns {string} */
    function getMaxContentInline() {
        adapt.base.setCSSProperty(element, "display", "inline-block");
        // When the available inline size is sufficiently large, the fit-content inline size equals to the max-content inline size.
        adapt.base.setCSSProperty(container, inlineSizeName, "99999999px"); // 'sufficiently large' value
        var r = getComputedValue(inlineSizeName);
        adapt.base.setCSSProperty(container, inlineSizeName, "");
        return r;
    }

    /** @returns {string} */
    function getMinContentInline() {
        adapt.base.setCSSProperty(element, "display", "inline-block");
        // When the available inline size is zero, the fit-content inline size equals to the min-content inline size.
        adapt.base.setCSSProperty(container, inlineSizeName, "0");
        var r = getComputedValue(inlineSizeName);
        adapt.base.setCSSProperty(container, inlineSizeName, "");
        return r;
    }

    /** @returns {string} */
    function getFitContentInline() {
        var fillAvailableInline = getFillAvailableInline();
        var minContentInline = getMinContentInline();
        var parsedFillAvailable = parseFloat(fillAvailableInline);
        if (parsedFillAvailable <= parseFloat(minContentInline)) {
            return minContentInline;
        } else {
            var maxContentInline = getMaxContentInline();
            if (parsedFillAvailable <= parseFloat(maxContentInline)) {
                return fillAvailableInline;
            } else {
                return maxContentInline;
            }
        }
    }

    /** @returns {string} */
    function getIdealBlock() {
        return getComputedValue(blockSizeName);
    }

    /** @returns {string} */
    function getFillAvailableBlock() {
        throw new Error("Getting fill-available block size is not implemented");
    }

    var result = /** @type {!Object.<vivliostyle.sizing.Size, number>} */ ({});
    sizes.forEach(function(size) {
        /** @type {string} */ var r;
        switch (size) {
            case vivliostyle.sizing.Size.FILL_AVAILABLE_INLINE_SIZE:
                r = getFillAvailableInline();
                break;
            case vivliostyle.sizing.Size.MAX_CONTENT_INLINE_SIZE:
                r = getMaxContentInline();
                break;
            case vivliostyle.sizing.Size.MIN_CONTENT_INLINE_SIZE:
                r = getMinContentInline();
                break;
            case vivliostyle.sizing.Size.FIT_CONTENT_INLINE_SIZE:
                r = getFitContentInline();
                break;
            case vivliostyle.sizing.Size.FILL_AVAILABLE_BLOCK_SIZE:
                r = getFillAvailableBlock();
                break;
            case vivliostyle.sizing.Size.MAX_CONTENT_BLOCK_SIZE:
            case vivliostyle.sizing.Size.MIN_CONTENT_BLOCK_SIZE:
            case vivliostyle.sizing.Size.FIT_CONTENT_BLOCK_SIZE:
                r = getIdealBlock();
                break;
            case vivliostyle.sizing.Size.FILL_AVAILABLE_WIDTH:
                r = isVertical ? getFillAvailableBlock() : getFillAvailableInline();
                break;
            case vivliostyle.sizing.Size.FILL_AVAILABLE_HEIGHT:
                r = isVertical ? getFillAvailableInline() : getFillAvailableBlock();
                break;
            case vivliostyle.sizing.Size.MAX_CONTENT_WIDTH:
                r = isVertical ? getIdealBlock() : getMaxContentInline();
                break;
            case vivliostyle.sizing.Size.MAX_CONTENT_HEIGHT:
                r = isVertical ? getMaxContentInline() : getIdealBlock();
                break;
            case vivliostyle.sizing.Size.MIN_CONTENT_WIDTH:
                r = isVertical ? getIdealBlock() : getMinContentInline();
                break;
            case vivliostyle.sizing.Size.MIN_CONTENT_HEIGHT:
                r = isVertical ? getMinContentInline() : getIdealBlock();
                break;
            case vivliostyle.sizing.Size.FIT_CONTENT_WIDTH:
                r = isVertical ? getIdealBlock() : getFitContentInline();
                break;
            case vivliostyle.sizing.Size.FIT_CONTENT_HEIGHT:
                r = isVertical ? getFitContentInline() : getIdealBlock();
                break;
        }
        result[size] = parseFloat(r);
        adapt.base.setCSSProperty(element, "position", original.position);
        adapt.base.setCSSProperty(element, "display", original.display);
    });

    adapt.base.setCSSProperty(element, "width", original.width);
    adapt.base.setCSSProperty(element, "height", original.height);

    parent.insertBefore(element, container);
    parent.removeChild(container);

    return result;
};
