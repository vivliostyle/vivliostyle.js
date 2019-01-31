/**
 * Copyright 2013 Google, Inc.
 * Copyright 2015 Trim-marks Inc.
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
 *
 * @fileoverview View tree generator.
 */
goog.provide('adapt.vgen');

goog.require('adapt.task');
goog.require('adapt.taskutil');
goog.require('adapt.css');
goog.require('vivliostyle.display');
goog.require('adapt.csscasc');
goog.require('adapt.cssstyler');
goog.require('adapt.vtree');
goog.require('adapt.xmldoc');
goog.require('adapt.font');
goog.require('vivliostyle.urls');

/**
 * @private
 * @const
 * @type {!Object.<string,string>}
 */
adapt.vgen.frontEdgeBlackListHor = {
    "text-indent": "0px",
    "margin-top": "0px",
    "padding-top": "0px",
    "border-top-width": "0px",
    "border-top-style": "none",
    "border-top-color": "transparent",
    "border-top-left-radius": "0px",
    "border-top-right-radius": "0px"
};

/**
 * @private
 * @const
 * @type {!Object.<string,string>}
 */
adapt.vgen.frontEdgeBlackListVert = {
    "text-indent": "0px",
    "margin-right": "0px",
    "padding-right": "0px",
    "border-right-width": "0px",
    "border-right-style": "none",
    "border-right-color": "transparent",
    "border-top-right-radius": "0px",
    "border-bottom-right-radius": "0px"
};

/**
 * @private
 * @const
 * @type {!Object.<string,string>}
 */
adapt.vgen.frontEdgeUnforcedBreakBlackListHor = {
    "margin-top": "0px"
};

/**
 * @private
 * @const
 * @type {!Object.<string,string>}
 */
adapt.vgen.frontEdgeUnforcedBreakBlackListVert = {
    "margin-right": "0px"
};


/**
 * Function taking source element, parent view node and CSS properties and returning
 * Result holding view element.
 * @typedef function(Element,Element,Object.<string,adapt.css.Val>):!adapt.task.Result.<Element>
 */
adapt.vgen.CustomRenderer;

/**
 * @interface
 */
adapt.vgen.CustomRendererFactory = function() {};

/**
 * @param {adapt.xmldoc.XMLDocHolder} xmldoc
 * @return {adapt.vgen.CustomRenderer}
 */
adapt.vgen.CustomRendererFactory.prototype.makeCustomRenderer = xmldoc => {};


/**
 * @type {Object.<string,string>}
 */
adapt.vgen.namespacePrefixMap = {};


/**
 * Creates an epubReadingSystem object in the iframe.contentWindow.navigator when
 * load event fires.
 * @param {HTMLIFrameElement} iframe
 */
adapt.vgen.initIFrame = iframe => {
    iframe.addEventListener("load", () => {
        iframe.contentWindow.navigator["epubReadingSystem"] = {
            "name": "adapt",
            "version": "0.1",
            "layoutStyle": "paginated",
            "hasFeature": function(name, version) {
                switch (name) {
                    case "mouse-events":
                        return true;
                }
                return false;
            }
        };
    }, false);
};

/**
 * @interface
 */
adapt.vgen.StylerProducer = function() {};

/**
 * @param {adapt.xmldoc.XMLDocHolder} xmldoc
 * @return {adapt.cssstyler.AbstractStyler}
 */
adapt.vgen.StylerProducer.prototype.getStylerForDoc = xmldoc => {};


adapt.vgen.pseudoelementDoc = (new DOMParser()).parseFromString(
    `<root xmlns="${adapt.base.NS.SHADOW}"/>`, "text/xml");

/**
 * Pseudoelement names in the order they should be inserted in the shadow DOM, empty string
 * is the place where the element's DOM children are processed.
 * @const
 */
adapt.vgen.pseudoNames = ["footnote-marker", "first-5-lines", "first-4-lines",
    "first-3-lines", "first-2-lines", "first-line", "first-letter", "before",
    "" /* content */, "after"];

adapt.vgen.PSEUDO_ATTR = "data-adapt-pseudo";

/**
 * @param {Element} element
 * @returns {string}
 */
adapt.vgen.getPseudoName = element => element.getAttribute(adapt.vgen.PSEUDO_ATTR) || "";

/**
 * @param {!Element} element
 * @param {string} name
 */
adapt.vgen.setPseudoName = (element, name) => {
    element.setAttribute(adapt.vgen.PSEUDO_ATTR, name);
};

/**
 * @param {Element} element
 * @param {adapt.csscasc.ElementStyle} style
 * @param {adapt.cssstyler.AbstractStyler} styler
 * @param {adapt.expr.Context} context
 * @param {!adapt.vtree.ExprContentListener} exprContentListener
 * @constructor
 * @implements {adapt.cssstyler.AbstractStyler}
 */
adapt.vgen.PseudoelementStyler = function(element, style, styler, context, exprContentListener) {
    /** @type {adapt.csscasc.ElementStyle} */ this.style = style;
    /** @const */ this.element = element;
    /** @type {adapt.cssstyler.AbstractStyler} */ this.styler = styler;
    /** @const */ this.context = context;
    /** @const */ this.exprContentListener = exprContentListener;
    /** @type {Object.<string,boolean>} */ this.contentProcessed = {};
};

/**
 * @override
 */
adapt.vgen.PseudoelementStyler.prototype.getStyle = function(element, deep) {
    const pseudoName = adapt.vgen.getPseudoName(element);
    if (this.styler && pseudoName && pseudoName.match(/after$/)) {
        // after content: update style
        this.style = this.styler.getStyle(this.element, true);
        this.styler = null;
    }
    const pseudoMap = adapt.csscasc.getStyleMap(this.style, "_pseudos");
    const style = pseudoMap[pseudoName] || /** @type {adapt.csscasc.ElementStyle} */ ({});
    if (pseudoName.match(/^first-/) && !style["x-first-pseudo"]) {
        let nest = 1;
        let r;
        if (pseudoName == "first-letter") {
            nest = 0;
        } else if ((r = pseudoName.match(/^first-([0-9]+)-lines$/)) != null) {
            nest = r[1] - 0;
        }
        style["x-first-pseudo"] = new adapt.csscasc.CascadeValue(new adapt.css.Int(nest), 0);
    }
    return style;
};

/**
 * @override
 */
adapt.vgen.PseudoelementStyler.prototype.processContent = function(element, style) {
    const pseudoName = adapt.vgen.getPseudoName(element);
    if (!this.contentProcessed[pseudoName]) {
        this.contentProcessed[pseudoName] = true;
        const contentVal = style["content"];
        if (contentVal) {
            if (adapt.vtree.nonTrivialContent(contentVal))
                contentVal.visit(new adapt.vtree.ContentPropertyHandler(element, this.context,
                    contentVal, this.exprContentListener));
        }
    }
};


/**
 * @param {string} flowName
 * @param {adapt.expr.Context} context
 * @param {adapt.vgen.Viewport} viewport
 * @param {adapt.cssstyler.Styler} styler
 * @param {Array.<string>} regionIds
 * @param {adapt.xmldoc.XMLDocHolder} xmldoc
 * @param {adapt.font.DocumentFaces} docFaces
 * @param {adapt.csscasc.ElementStyle} footnoteStyle
 * @param {adapt.vgen.StylerProducer} stylerProducer
 * @param {adapt.vtree.Page} page
 * @param {adapt.vgen.CustomRenderer} customRenderer
 * @param {Object.<string,string>} fallbackMap
 * @param {!adapt.base.DocumentURLTransformer} documentURLTransformer
 * @constructor
 * @implements {adapt.vtree.LayoutContext}
 * @extends {adapt.base.SimpleEventTarget}
 */
adapt.vgen.ViewFactory = function(flowName, context, viewport, styler, regionIds,
    xmldoc, docFaces, footnoteStyle, stylerProducer, page, customRenderer, fallbackMap,
    documentURLTransformer) {
    adapt.base.SimpleEventTarget.call(this);
    // from constructor parameters
    /** @const */ this.flowName = flowName;
    /** @const */ this.context = context;
    /** @const */ this.viewport = viewport;
    /** @const */ this.document = viewport.document;
    /** @const */ this.styler = styler;
    /** @const */ this.exprContentListener = styler.counterListener.getExprContentListener();
    /** @const */ this.regionIds = regionIds;
    /** @const */ this.xmldoc = xmldoc;
    /** @const */ this.docFaces = docFaces;
    /** @const */ this.footnoteStyle = footnoteStyle;
    /** @const */ this.stylerProducer = stylerProducer;
    /** @const */ this.page = page;
    /** @const */ this.customRenderer = customRenderer;
    /** @const */ this.fallbackMap = fallbackMap;
    /** @const */ this.documentURLTransformer = documentURLTransformer;

    // provided by layout
    /** @type {adapt.vtree.NodeContext} */ this.nodeContext = null;
    /** @type {Element} */ this.viewRoot = null;
    /** @type {boolean} */ this.isFootnote = false;
    /** @type {Node} */ this.sourceNode = null;
    /** @type {number} */ this.offsetInNode = 0;

    // computed
    // TODO: only set it on NodeContext
    /** @type {Node} */ this.viewNode = null;
};
goog.inherits(adapt.vgen.ViewFactory, adapt.base.SimpleEventTarget);

/**
 * @override
 */
adapt.vgen.ViewFactory.prototype.clone = function() {
    return new adapt.vgen.ViewFactory(this.flowName, this.context, this.viewport,
        this.styler, this.regionIds,
        this.xmldoc, this.docFaces, this.footnoteStyle, this.stylerProducer,
        this.page, this.customRenderer, this.fallbackMap, this.documentURLTransformer);
};

/**
 * @param {Element} element
 * @param {boolean} isRoot
 * @param {adapt.csscasc.ElementStyle} cascStyle
 * @param {Object.<string,adapt.css.Val>} computedStyle
 * @param {adapt.cssstyler.AbstractStyler} styler
 * @param {adapt.expr.Context} context
 * @param {adapt.vtree.ShadowContext} parentShadow
 * @param {adapt.vtree.ShadowContext} subShadow
 * @return {adapt.vtree.ShadowContext}
 */
adapt.vgen.ViewFactory.prototype.createPseudoelementShadow = function(element, isRoot,
    cascStyle, computedStyle, styler, context, parentShadow, subShadow) {
    const pseudoMap = this.getPseudoMap(cascStyle, this.regionIds, this.isFootnote, this.nodeContext, context);
    if (!pseudoMap) {
        return subShadow;
    }
    const addedNames = [];
    const root = adapt.vgen.pseudoelementDoc.createElementNS(adapt.base.NS.SHADOW, "root");
    let att = root;

    for (const name of adapt.vgen.pseudoNames) {
        let elem;
        if (name) {
            if (!pseudoMap[name]) {
                continue;
            }
            if (name == "footnote-marker" && !(isRoot && this.isFootnote)) {
                continue;
            }
            if (name.match(/^first-/)) {
                const display = computedStyle["display"];
                if (!display || display === adapt.css.ident.inline) {
                    continue;
                }
            }
            if (name === "before" || name === "after") {
                const content = pseudoMap[name]["content"];
                if (!content || content === adapt.css.ident.normal || content === adapt.css.ident.none) {
                    continue;
                }
            }
            addedNames.push(name);
            elem = adapt.vgen.pseudoelementDoc.createElementNS(adapt.base.NS.XHTML, "span");
            adapt.vgen.setPseudoName(elem, name);
        } else {
            elem = adapt.vgen.pseudoelementDoc.createElementNS(adapt.base.NS.SHADOW, "content");
        }
        att.appendChild(elem);
        if (name.match(/^first-/)) {
            att = elem;
        }
    }

    if (!addedNames.length) {
        return subShadow;
    }
    const shadowStyler = new adapt.vgen.PseudoelementStyler(element, cascStyle, styler, context,
        this.exprContentListener);
    return new adapt.vtree.ShadowContext(element, root, null, parentShadow,
        subShadow, adapt.vtree.ShadowType.ROOTLESS, shadowStyler);
};


/**
 * @param {adapt.csscasc.ElementStyle} cascStyle
 * @param {Array.<string>} regionIds
 * @param {boolean} isFootnote
 * @param {adapt.vtree.NodeContext} nodeContext
 */
adapt.vgen.ViewFactory.prototype.getPseudoMap = (cascStyle, regionIds, isFootnote, nodeContext, context) => {
    const pseudoMap = adapt.csscasc.getStyleMap(cascStyle, "_pseudos");
    if (!pseudoMap) return null;
    const computedPseudoStyleMap = {};
    for (const key in pseudoMap) {
        const computedPseudoStyle = computedPseudoStyleMap[key] = {};
        adapt.csscasc.mergeStyle(computedPseudoStyle, pseudoMap[key], context);
        vivliostyle.selectors.mergeViewConditionalStyles(
            computedPseudoStyle, context, pseudoMap[key]);
        adapt.csscasc.forEachStylesInRegion(pseudoMap[key], regionIds, isFootnote, (regionId, regionStyle) => {
            adapt.csscasc.mergeStyle(computedPseudoStyle, regionStyle, context);
            vivliostyle.selectors.forEachViewConditionalStyles(regionStyle, viewConditionalStyles => {
                adapt.csscasc.mergeStyle(computedPseudoStyle, viewConditionalStyles, context);
            });
        });
    }
    return computedPseudoStyleMap;
};

/**
 * @param {string} href
 * @param {Element} element
 * @param {adapt.vtree.ShadowContext} parentShadow
 * @param {adapt.vtree.ShadowContext} subShadow
 * @return {adapt.task.Result.<adapt.vtree.ShadowContext>}
 */
adapt.vgen.ViewFactory.prototype.createRefShadow = function(href, type, element, parentShadow, subShadow) {
    const self = this;
    /** @type {!adapt.task.Frame.<adapt.vtree.ShadowContext>} */ const frame
        = adapt.task.newFrame("createRefShadow");
    self.xmldoc.store.load(href).then(refDocParam => {
        const refDoc = /** @type {adapt.xmldoc.XMLDocHolder} */ (refDocParam);
        if (refDoc) {
            const refElement = refDoc.getElement(href);
            if (refElement) {
                const refStyler = self.stylerProducer.getStylerForDoc(refDoc);
                subShadow = new adapt.vtree.ShadowContext(element, refElement, refDoc, parentShadow,
                    subShadow, type, refStyler);
            }
        }
        frame.finish(subShadow);
    });
    return frame.result();
};

/**
 * @param {Element} element
 * @param {adapt.csscasc.ElementStyle} cascStyle
 * @param {Object.<string,adapt.css.Val>} computedStyle
 * @param {adapt.cssstyler.AbstractStyler} styler
 * @param {adapt.expr.Context} context
 * @param {adapt.vtree.ShadowContext} shadowContext
 * @return {adapt.task.Result.<adapt.vtree.ShadowContext>}
 */
adapt.vgen.ViewFactory.prototype.createShadows = function(element, isRoot, cascStyle,
    computedStyle, styler, context, shadowContext) {
    const self = this;
    /** @type {!adapt.task.Frame.<adapt.vtree.ShadowContext>} */ const frame
        = adapt.task.newFrame("createShadows");
    const shadow = null;
    const templateURLVal = computedStyle["template"];
    let cont;
    if (templateURLVal instanceof adapt.css.URL) {
        const url = (/** @type {adapt.css.URL} */ (templateURLVal)).url;
        cont = self.createRefShadow(url, adapt.vtree.ShadowType.ROOTLESS,
            element, shadowContext, shadow);
    } else {
        cont = adapt.task.newResult(shadow);
    }
    cont.then(shadow => {
        let cont1 = null;
        if (element.namespaceURI == adapt.base.NS.SHADOW) {
            if (element.localName == "include") {
                let href = element.getAttribute("href");
                let xmldoc = null;
                if (href) {
                    xmldoc = shadowContext ? shadowContext.xmldoc : self.xmldoc;
                } else if (shadowContext) {
                    if (shadowContext.owner.namespaceURI == adapt.base.NS.XHTML)
                        href = shadowContext.owner.getAttribute("href");
                    else
                        href = shadowContext.owner.getAttributeNS(adapt.base.NS.XLINK, "href");
                    xmldoc = shadowContext.parentShadow ? shadowContext.parentShadow.xmldoc : self.xmldoc;
                }
                if (href) {
                    href = adapt.base.resolveURL(href, xmldoc.url);
                    cont1 = self.createRefShadow(href, adapt.vtree.ShadowType.ROOTED,
                        element, shadowContext, shadow);
                }
            }
        }
        if (cont1 == null)
            cont1 = adapt.task.newResult(shadow);
        let cont2 = null;
        cont1.then(shadow => {
            if (computedStyle["display"] === adapt.css.ident.table_cell) {
                const url = adapt.base.resolveURL("user-agent.xml#table-cell", adapt.base.resourceBaseURL);
                cont2 = self.createRefShadow(url, adapt.vtree.ShadowType.ROOTLESS, element, shadowContext, shadow);
            } else {
                cont2 = adapt.task.newResult(shadow);
            }
        });
        cont2.then(shadow => {
            shadow = self.createPseudoelementShadow(element, isRoot, cascStyle, computedStyle,
                styler, context, shadowContext, shadow);
            frame.finish(shadow);
        });
    });
    return frame.result();
};

/**
 * @override
 */
adapt.vgen.ViewFactory.prototype.setViewRoot = function(viewRoot, isFootnote) {
    this.viewRoot = viewRoot;
    this.isFootnote = isFootnote;
};

/**
 * @param {boolean} vertical
 * @param {boolean} rtl
 * @param {adapt.csscasc.ElementStyle} style
 * @param {!Object.<string,adapt.css.Val>} computedStyle
 * @return {boolean} vertical
 */
adapt.vgen.ViewFactory.prototype.computeStyle = function(vertical, rtl, style, computedStyle) {
    const context = this.context;
    const cascMap = adapt.csscasc.flattenCascadedStyle(style, context, this.regionIds, this.isFootnote, this.nodeContext);
    vertical = adapt.csscasc.isVertical(cascMap, context, vertical);
    rtl = adapt.csscasc.isRtl(cascMap, context, rtl);
    const self = this;
    adapt.csscasc.convertToPhysical(cascMap, computedStyle, vertical, rtl, (name, cascVal) => {
        let value = cascVal.evaluate(context, name);
        if (name == "font-family") {
            value = self.docFaces.filterFontFamily(value);
        }
        return value;
    });
    // Compute values of display, position and float
    const position = /** @type {adapt.css.Ident} */ (computedStyle["position"]);
    const float = /** @type {adapt.css.Ident} */ (computedStyle["float"]);
    const displayValues = vivliostyle.display.getComputedDislayValue(
        computedStyle["display"] || adapt.css.ident.inline, position, float, this.sourceNode === this.xmldoc.root);
    ["display", "position", "float"].forEach(name => {
        if (displayValues[name]) {
            computedStyle[name] = displayValues[name];
        }
    });
    return vertical;
};

/**
 * @private
 * @param {adapt.csscasc.ElementStyle} elementStyle
 * @return {{lang:?string, elementStyle:adapt.csscasc.ElementStyle}}
 */
adapt.vgen.ViewFactory.prototype.inheritFromSourceParent = function(elementStyle) {
    let node = this.nodeContext.sourceNode;
    const styles = [];
    let lang = null;
    // TODO: this is hacky. We need to recover the path through the shadow trees, but we do not
    // have the full shadow tree structure at this point. This code handles coming out of the
    // shadow trees, but does not go back in (through shadow:content element).
    let shadowContext = this.nodeContext.shadowContext;
    let steps = -1;
    while (node && node.nodeType == 1) {
        const shadowRoot = shadowContext && shadowContext.root == node;
        if (!shadowRoot || shadowContext.type == adapt.vtree.ShadowType.ROOTLESS) {
            const styler = shadowContext ?
                /** @type {adapt.cssstyler.AbstractStyler} */ (shadowContext.styler) : this.styler;
            const nodeStyle = styler.getStyle(/** @type {Element} */ (node), false);
            styles.push(nodeStyle);
            lang = lang || adapt.base.getLangAttribute(/** @type {Element} */ (node));
        }
        if (shadowRoot) {
            node = shadowContext.owner;
            shadowContext = shadowContext.parentShadow;
        } else {
            node = node.parentNode;
            steps++;
        }
    }
    const isRoot = steps === 0;
    const fontSize = this.context.queryUnitSize("em", isRoot);
    const props = /** @type {adapt.csscasc.ElementStyle} */
        ({"font-size": new adapt.csscasc.CascadeValue(new adapt.css.Numeric(fontSize, "px"), 0)});
    const inheritanceVisitor = new adapt.csscasc.InheritanceVisitor(props, this.context);
    for (let i = styles.length - 1; i >= 0; --i) {
        const style = styles[i];
        const propList = [];
        for (const propName in style) {
            if (adapt.csscasc.isInherited(propName)) {
                propList.push(propName);
            }
        }
        propList.sort(adapt.css.processingOrderFn);

        for (const name of propList) {
            inheritanceVisitor.setPropName(name);
            const value = adapt.csscasc.getProp(style, name);
            if (value.value !== adapt.css.ident.inherit) {
                props[name] = value.filterValue(inheritanceVisitor);
            }
        }
    }
    for (const sname in elementStyle) {
        if (!adapt.csscasc.isInherited(sname)) {
            props[sname] = elementStyle[sname];
        }
    }
    return {lang, elementStyle:props};
};

adapt.vgen.fb2Remap = {
    "a": "a",
    "sub": "sub",
    "sup": "sup",
    "table": "table",
    "tr": "tr",
    "td": "td",
    "th": "th",
    "code": "code",
    "body": "div",
    "p": "p",
    "v": "p",
    "date": "p",
    "emphasis": "em",
    "strong": "strong",
    "style": "span",
    "strikethrough": "del"
};

/**
 * @param {string} url
 * @return {string}
 */
adapt.vgen.ViewFactory.prototype.resolveURL = function(url) {
    url = adapt.base.resolveURL(url, this.xmldoc.url);
    return this.fallbackMap[url] || url;
};

/**
 */
adapt.vgen.ViewFactory.prototype.inheritLangAttribute = function() {
    this.nodeContext.lang = adapt.base.getLangAttribute(/** @type {Element} */ (this.nodeContext.sourceNode))
        || (this.nodeContext.parent && this.nodeContext.parent.lang)
        || this.nodeContext.lang;
};

/**
 *
 * @param {!Object.<string,adapt.css.Val>} computedStyle
 */
adapt.vgen.ViewFactory.prototype.transferPolyfilledInheritedProps = function(computedStyle) {
    const polyfilledInheritedProps = adapt.csscasc.getPolyfilledInheritedProps().filter(name => computedStyle[name]);
    if (polyfilledInheritedProps.length) {
        let props = this.nodeContext.inheritedProps;
        if (this.nodeContext.parent) {
            props = this.nodeContext.inheritedProps = {};
            for (const n in this.nodeContext.parent.inheritedProps) {
                props[n] = this.nodeContext.parent.inheritedProps[n];
            }
        }
        polyfilledInheritedProps.forEach(name => {
            const value = computedStyle[name];
            if (value) {
                if (value instanceof adapt.css.Int) {
                    props[name] = (/** @type {adapt.css.Int} */ (value)).num;
                } else if (value instanceof adapt.css.Ident) {
                    props[name] = (/** @type {adapt.css.Ident} */ (value)).name;
                } else if (value instanceof adapt.css.Numeric) {
                    const numericVal = (/** @type {adapt.css.Numeric} */ (value));
                    switch (numericVal.unit) {
                        case "dpi":
                        case "dpcm":
                        case "dppx":
                            props[name] = numericVal.num * adapt.expr.defaultUnitSizes[numericVal.unit];
                            break;
                    }
                } else {
                    props[name] = value;
                }
                delete computedStyle[name];
            }
        });
    }
};

/**
 * @param {adapt.vtree.NodeContext} nodeContext
 * @param {boolean} firstTime
 * @param {adapt.css.Ident} display
 * @param {adapt.css.Ident} position
 * @param {adapt.css.Ident} float
 * @param {boolean} isRoot
 */
adapt.vgen.ViewFactory.prototype.resolveFormattingContext = (nodeContext, firstTime, display, position, float, isRoot) => {
    /** @type {!Array<!vivliostyle.plugin.ResolveFormattingContextHook>} */ const hooks =
        vivliostyle.plugin.getHooksForName(vivliostyle.plugin.HOOKS.RESOLVE_FORMATTING_CONTEXT);
    for (let i = 0; i < hooks.length; i++) {
        const formattingContext = hooks[i](nodeContext, firstTime, display, position, float, isRoot);
        if (formattingContext) {
            nodeContext.formattingContext = formattingContext;
            return;
        }
    }
};

/**
 * @param {boolean} firstTime
 * @param {boolean} atUnforcedBreak
 * @private
 * @return {!adapt.task.Result.<boolean>} holding true if children should be processed
 */
adapt.vgen.ViewFactory.prototype.createElementView = function(firstTime, atUnforcedBreak) {
    const self = this;
    let needToProcessChildren = true;
    /** @type {!adapt.task.Frame.<boolean>} */ const frame
        = adapt.task.newFrame("createElementView");
    // Figure out element's styles
    let element = /** @type {Element} */ (self.sourceNode);
    const styler = self.nodeContext.shadowContext ?
        /** @type {adapt.cssstyler.AbstractStyler} */ (self.nodeContext.shadowContext.styler) : self.styler;
    let elementStyle = styler.getStyle(element, false);
    if (!self.nodeContext.shadowContext) {
        const offset = this.xmldoc.getElementOffset(element);
        vivliostyle.selectors.registerFragmentIndex(offset, self.nodeContext.fragmentIndex, 0);
    }
    const computedStyle = {};
    if (!self.nodeContext.parent) {
        var inheritedValues = self.inheritFromSourceParent(elementStyle);
        elementStyle = inheritedValues.elementStyle;
        self.nodeContext.lang = inheritedValues.lang;
    }
    const floatReference = elementStyle["float-reference"] &&
        vivliostyle.pagefloat.FloatReference.of(elementStyle["float-reference"].value.toString());
    if (self.nodeContext.parent && floatReference && vivliostyle.pagefloat.isPageFloat(floatReference)) {
        // Since a page float will be detached from a view node of its parent,
        // inherited properties need to be inherited from its source parent.
        var inheritedValues = self.inheritFromSourceParent(elementStyle);
        elementStyle = inheritedValues.elementStyle;
        self.nodeContext.lang = inheritedValues.lang;
    }
    self.nodeContext.vertical = self.computeStyle(self.nodeContext.vertical, self.nodeContext.direction === "rtl", elementStyle, computedStyle);
    styler.processContent(element, computedStyle);

    this.transferPolyfilledInheritedProps(computedStyle);
    this.inheritLangAttribute();

    if (computedStyle["direction"]) {
        self.nodeContext.direction = computedStyle["direction"].toString();
    }
    // Sort out the properties
    const flow = computedStyle["flow-into"];
    if (flow && flow.toString() != self.flowName) {
        // foreign flow, don't create a view
        frame.finish(false);
        return frame.result();
    }
    let display = computedStyle["display"];
    if (display === adapt.css.ident.none) {
        // no content
        frame.finish(false);
        return frame.result();
    }
    const isRoot = self.nodeContext.parent == null;
    self.nodeContext.flexContainer = (display === adapt.css.ident.flex);
    self.createShadows(element, isRoot, elementStyle, computedStyle, styler, self.context, self.nodeContext.shadowContext).then(shadowParam => {
        self.nodeContext.nodeShadow = shadowParam;
        const position = computedStyle["position"];
        let floatSide = computedStyle["float"];
        let clearSide = computedStyle["clear"];
        const writingMode = self.nodeContext.vertical ? adapt.css.ident.vertical_rl : adapt.css.ident.horizontal_tb;
        const parentWritingMode = self.nodeContext.parent ?
            (self.nodeContext.parent.vertical ? adapt.css.ident.vertical_rl : adapt.css.ident.horizontal_tb) :
            writingMode;
        const isFlowRoot = vivliostyle.display.isFlowRoot(element);
        self.nodeContext.establishesBFC = vivliostyle.display.establishesBFC(display, position, floatSide,
            computedStyle["overflow"], writingMode, parentWritingMode, isFlowRoot);
        self.nodeContext.containingBlockForAbsolute = vivliostyle.display.establishesCBForAbsolute(position);
        if (self.nodeContext.isInsideBFC() &&
            floatSide !== adapt.css.ident.footnote &&
            !(floatReference && vivliostyle.pagefloat.isPageFloat(floatReference))) {
            // When the element is already inside a block formatting context (except one from the root),
            // float and clear can be controlled by the browser and we don't need to care.
            floatSide = null;
            clearSide = null;
        }
        let floating = floatSide === adapt.css.ident.left ||
            floatSide === adapt.css.ident.right ||
            floatSide === adapt.css.ident.top ||
            floatSide === adapt.css.ident.bottom ||
            floatSide === adapt.css.ident.inline_start ||
            floatSide === adapt.css.ident.inline_end ||
            floatSide === adapt.css.ident.block_start ||
            floatSide === adapt.css.ident.block_end ||
            floatSide === adapt.css.ident.snap_block ||
            floatSide === adapt.css.ident.footnote;
        if (floatSide) {
            // Don't want to set it in view DOM CSS.
            delete computedStyle["float"];
            if (floatSide === adapt.css.ident.footnote) {
                if (self.isFootnote) {
                    // No footnotes inside footnotes. self is most likely the root of the
                    // footnote body being rendered in footnote area. Treat as block.
                    floating = false;
                    computedStyle["display"] = adapt.css.ident.block;
                } else {
                    computedStyle["display"] = adapt.css.ident.inline;
                }
            }
        }
        if (clearSide) {
            if (clearSide === adapt.css.ident.inherit) {
                if (self.nodeContext.parent && self.nodeContext.parent.clearSide) {
                    clearSide = adapt.css.getName(self.nodeContext.parent.clearSide);
                }
            }
            if (clearSide === adapt.css.ident.left || clearSide === adapt.css.ident.right ||
                clearSide === adapt.css.ident.top || clearSide === adapt.css.ident.bottom ||
                clearSide === adapt.css.ident.both || clearSide === adapt.css.ident.all ||
                clearSide === adapt.css.ident.same) {
                delete computedStyle["clear"];
                if (computedStyle["display"] && computedStyle["display"] != adapt.css.ident.inline) {
                    self.nodeContext.clearSide = clearSide.toString();
                }
            }
        }
        const listItem = display === adapt.css.ident.list_item && computedStyle["ua-list-item-count"];
        if (floating ||
            (computedStyle["break-inside"] && computedStyle["break-inside"] !== adapt.css.ident.auto)) {
            self.nodeContext.breakPenalty++;
        }
        if (display && display !== adapt.css.ident.inline && vivliostyle.display.isInlineLevel(display)) {
            // Don't break inside ruby, inline-block, etc.
            self.nodeContext.breakPenalty++;
        }
        self.nodeContext.inline = !floating && !display || vivliostyle.display.isInlineLevel(display) || vivliostyle.display.isRubyInternalDisplay(display);
        self.nodeContext.display = display ? display.toString() : "inline";
        self.nodeContext.floatSide = floating ? floatSide.toString() : null;
        self.nodeContext.floatReference = floatReference || vivliostyle.pagefloat.FloatReference.INLINE;
        self.nodeContext.floatMinWrapBlock = computedStyle["float-min-wrap-block"] || null;
        self.nodeContext.columnSpan = computedStyle["column-span"];
        if (!self.nodeContext.inline) {
            const breakAfter = computedStyle["break-after"];
            if (breakAfter) {
                self.nodeContext.breakAfter = breakAfter.toString();
            }
            const breakBefore = computedStyle["break-before"];
            if (breakBefore) {
                self.nodeContext.breakBefore = breakBefore.toString();
            }
        }
        self.nodeContext.verticalAlign = computedStyle["vertical-align"] && computedStyle["vertical-align"].toString() || "baseline";
        self.nodeContext.captionSide = computedStyle["caption-side"] && computedStyle["caption-side"].toString() || "top";
        const borderCollapse = computedStyle["border-collapse"];
        if (!borderCollapse || borderCollapse === adapt.css.getName("separate")) {
            const borderSpacing = computedStyle["border-spacing"];
            let inlineBorderSpacing;
            let blockBorderSpacing;
            if (borderSpacing) {
                if (borderSpacing.isSpaceList()) {
                    inlineBorderSpacing = borderSpacing.values[0];
                    blockBorderSpacing = borderSpacing.values[1];
                } else {
                    inlineBorderSpacing = blockBorderSpacing = borderSpacing;
                }
                if (inlineBorderSpacing.isNumeric()) {
                    self.nodeContext.inlineBorderSpacing = adapt.css.toNumber(inlineBorderSpacing, self.context);
                }
                if (blockBorderSpacing.isNumeric()) {
                    self.nodeContext.blockBorderSpacing = adapt.css.toNumber(blockBorderSpacing, self.context);
                }
            }
        }
        self.nodeContext.footnotePolicy = computedStyle["footnote-policy"];
        const firstPseudo = computedStyle["x-first-pseudo"];
        if (firstPseudo) {
            const outerPseudo = self.nodeContext.parent ? self.nodeContext.parent.firstPseudo : null;
            self.nodeContext.firstPseudo = new adapt.vtree.FirstPseudo(
                outerPseudo, (/** adapt.css.Int */ (firstPseudo)).num);
        }
        if (!self.nodeContext.inline) self.processAfterIfcontinues(element, elementStyle, styler, self.context);
        const whitespace = computedStyle["white-space"];
        if (whitespace) {
            const whitespaceValue = adapt.vtree.whitespaceFromPropertyValue(whitespace.toString());
            if (whitespaceValue !== null) {
                self.nodeContext.whitespace = whitespaceValue;
            }
        }
        const hyphenateCharacter = computedStyle["hyphenate-character"];
        if (hyphenateCharacter && hyphenateCharacter !== adapt.css.ident.auto) {
            self.nodeContext.hyphenateCharacter = hyphenateCharacter.str;
        }
        const wordBreak = computedStyle["word-break"];
        const overflowWrap = computedStyle["overflow-wrap"] || ["word-wrap"];
        self.nodeContext.breakWord = (wordBreak === adapt.css.ident.break_all) || (overflowWrap === adapt.css.ident.break_word);
        // Resolve formatting context
        self.resolveFormattingContext(self.nodeContext, firstTime, display, position, floatSide, isRoot);
        if (self.nodeContext.parent && self.nodeContext.parent.formattingContext) {
            firstTime = self.nodeContext.parent.formattingContext.isFirstTime(self.nodeContext, firstTime);
        }
        if (!self.nodeContext.inline) {
            self.nodeContext.repeatOnBreak = self.processRepeatOnBreak(computedStyle);
            self.findAndProcessRepeatingElements(element, styler);
        }

        // Create the view element
        let custom = false;
        let inner = null;
        const fetchers = [];
        let ns = element.namespaceURI;
        let tag = element.localName;
        if (ns == adapt.base.NS.XHTML) {
            if (tag == "html" || tag == "body" || tag == "script" || tag == "link" || tag == "meta")
                tag = "div";
            else if (tag == "vide_")
                tag = "video";
            else if (tag == "audi_")
                tag = "audio";
            else if (tag == "object")
                custom = !!self.customRenderer;
            if (element.getAttribute(adapt.vgen.PSEUDO_ATTR)) {
                if (elementStyle["content"] && elementStyle["content"].value &&
                    elementStyle["content"].value.url) {
                    tag = "img";
                }
            }
        } else if (ns == adapt.base.NS.epub) {
            tag = "span";
            ns = adapt.base.NS.XHTML;
        } else if (ns == adapt.base.NS.FB2) {
            ns = adapt.base.NS.XHTML;
            if (tag == "image") {
                tag = "div";
                const imageRef = element.getAttributeNS(adapt.base.NS.XLINK, "href");
                if (imageRef && imageRef.charAt(0) == "#") {
                    const imageBinary = self.xmldoc.getElement(imageRef);
                    if (imageBinary) {
                        inner = self.createElement(ns, "img");
                        const mediaType = imageBinary.getAttribute("content-type") || "image/jpeg";
                        const innerSrc = `data:${mediaType};base64,${imageBinary.textContent.replace(/[ \t\n\t]/g, "")}`;
                        fetchers.push(adapt.taskutil.loadElement(inner, innerSrc));
                    }
                }
            } else {
                tag = adapt.vgen.fb2Remap[tag];
            }
            if (!tag) {
                tag = self.nodeContext.inline ? "span" : "div";
            }
        } else if (ns == adapt.base.NS.NCX) {
            ns = adapt.base.NS.XHTML;
            if (tag == "ncx" || tag == "navPoint") {
                tag = "div";
            } else if (tag == "navLabel") {
                // Cheat here. Translate source to HTML, so it will plug in into the rest of the
                // pipeline.
                tag = "span";
                const navParent = element.parentNode;
                if (navParent) {
                    // find the content element
                    let href = null;
                    for (let c = navParent.firstChild; c; c = c.nextSibling) {
                        if (c.nodeType != 1) {
                            continue;
                        }
                        const childElement = /** @type {Element} */ (c);
                        if (childElement.namespaceURI == adapt.base.NS.NCX
                            && childElement.localName == "content") {
                            href = childElement.getAttribute("src");
                            break;
                        }
                    }
                    if (href) {
                        tag = "a";
                        element = element.ownerDocument.createElementNS(ns, "a");
                        element.setAttribute("href", href);
                    }
                }
            } else {
                tag = "span";
            }
        } else if (ns == adapt.base.NS.SHADOW) {
            ns = adapt.base.NS.XHTML;
            tag = self.nodeContext.inline ? "span" : "div";
        } else {
            custom = !!self.customRenderer;
        }
        if (listItem) {
            if (firstTime) {
                tag = "li";
            } else {
                tag = "div";
                display = adapt.css.ident.block;
                computedStyle["display"] = display;
            }
        } else if (tag == "body" || tag == "li") {
            tag = "div";
        } else if (tag == "q") {
            tag = "span";
        } else if (tag == "a") {
            const hp = computedStyle["hyperlink-processing"];
            if (hp && hp.toString() != "normal") {
                tag = "span";
            }
        }
        if (computedStyle["behavior"]) {
            const behavior = computedStyle["behavior"].toString();
            if (behavior != "none" && self.customRenderer) {
                custom = true;
            }
        }
        if (element.dataset && element.getAttribute("data-math-typeset") === "true")
            custom = true;
        let elemResult;
        if (custom) {
            const parentNode = self.nodeContext.parent ? self.nodeContext.parent.viewNode : null;
            elemResult = self.customRenderer(element, /** @type {Element} */ (parentNode), computedStyle);
        } else {
            elemResult = adapt.task.newResult(null);
        }
        elemResult.then(result => {
            if (result) {
                if (custom) {
                    needToProcessChildren = result.getAttribute("data-adapt-process-children") == "true";
                }
            } else {
                result = self.createElement(ns, tag);
            }
            if (tag == "a") {
                result.addEventListener("click", self.page.hrefHandler, false);
            }
            if (inner) {
                self.applyPseudoelementStyle(self.nodeContext, "inner", inner);
                result.appendChild(inner);
            }
            if (result.localName == "iframe" && result.namespaceURI == adapt.base.NS.XHTML) {
                adapt.vgen.initIFrame(/** @type {HTMLIFrameElement} */ (result));
            }

            const imageResolution = /** @type {(number|undefined)} */
                (self.nodeContext.inheritedProps["image-resolution"]);
            /** @const {!Array<!{image: !Element, element: !Element, fetcher: !adapt.taskutil.Fetcher<string>}>} */ const images = [];
            const cssWidth = computedStyle["width"];
            const cssHeight = computedStyle["height"];
            const attrWidth = element.getAttribute("width");
            const attrHeight = element.getAttribute("height");
            const hasAutoWidth = cssWidth === adapt.css.ident.auto || (!cssWidth && !attrWidth);
            const hasAutoHeight = cssHeight === adapt.css.ident.auto || (!cssHeight && !attrHeight);

            if (element.namespaceURI != adapt.base.NS.FB2 || tag == "td") {
                const attributes = element.attributes;
                const attributeCount = attributes.length;
                let delayedSrc = null;
                for (let i = 0; i < attributeCount; i++) {
                    const attribute = attributes[i];
                    const attributeNS = attribute.namespaceURI;
                    let attributeName = attribute.localName;
                    let attributeValue = attribute.nodeValue;
                    if (!attributeNS) {
                        if (attributeName.match(/^on/))
                            continue; // don't propagate JavaScript code
                        if (attributeName == "style")
                            continue; // we do styling ourselves
                        if (attributeName == "id" || attributeName == "name") {
                            // Propagate transformed ids and collect them on the page (only first time).
                            if (firstTime) {
                                attributeValue = self.documentURLTransformer.transformFragment(attributeValue, self.xmldoc.url);
                                result.setAttribute(attributeName, attributeValue);
                                self.page.registerElementWithId(result, attributeValue);
                                continue;
                            }
                        }
                        // TODO: understand the element we are working with.
                        if (attributeName == "src" || attributeName == "href" || attributeName == "poster") {
                            attributeValue = self.resolveURL(attributeValue);
                            if (attributeName === "href") {
                                attributeValue = self.documentURLTransformer.transformURL(
                                    attributeValue, self.xmldoc.url);
                            }
                        } else if (attributeName == "srcset") {
                            attributeValue = attributeValue.split(",").map(value => self.resolveURL(value.trim())).join(",");
                        }
                        if (attributeName === "poster" && tag === "video" && ns === adapt.base.NS.XHTML &&
                            hasAutoWidth && hasAutoHeight) {
                            var image = new Image();
                            const fetcher = adapt.taskutil.loadElement(image, attributeValue);
                            fetchers.push(fetcher);
                            images.push({image, element: result, fetcher});
                        }
                    }
                    else if (attributeNS == "http://www.w3.org/2000/xmlns/") {
                        continue; //namespace declaration (in Firefox)
                    } else if (attributeNS == adapt.base.NS.XLINK) {
                        if (attributeName == "href")
                            attributeValue = self.resolveURL(attributeValue);
                    }
                    if (ns == adapt.base.NS.SVG && (/^[A-Z\-]+$/).test(attributeName)) {
                        // Workaround for Edge bug
                        // See https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/5579311/
                        attributeName = attributeName.toLowerCase();
                    }
                    if (self.isSVGUrlAttribute(attributeName)) {
                        attributeValue = vivliostyle.urls.transformURIs(
                            attributeValue, self.xmldoc.url, self.documentURLTransformer);
                    }
                    if (attributeNS) {
                        const attributePrefix = adapt.vgen.namespacePrefixMap[attributeNS];
                        if (attributePrefix)
                            attributeName = `${attributePrefix}:${attributeName}`;
                    }
                    if (attributeName == "src" && !attributeNS && (tag == "img" || tag == "input") && ns == adapt.base.NS.XHTML) {
                        // HTML img element should start loading only once all attributes are assigned.
                        delayedSrc = attributeValue;
                    } else if (attributeName == "href" && tag == "image" && ns == adapt.base.NS.SVG && attributeNS == adapt.base.NS.XLINK) {
                        self.page.fetchers.push(adapt.taskutil.loadElement(result, attributeValue));
                    } else {
                        // When the document is not XML document (e.g. non-XML HTML)
                        // attributeNS can be null
                        if (attributeNS) {
                            result.setAttributeNS(attributeNS, attributeName, attributeValue);
                        } else {
                            result.setAttribute(attributeName, attributeValue);
                        }
                    }
                }
                if (delayedSrc) {
                    var image = tag === "input" ? new Image() : result;
                    const imageFetcher = adapt.taskutil.loadElement(image, delayedSrc);
                    if (image !== result) {
                        result.src = delayedSrc;
                    }
                    if (!hasAutoWidth && !hasAutoHeight) {
                        // No need to wait for the image, does not affect layout
                        self.page.fetchers.push(imageFetcher);
                    } else {
                        if (hasAutoWidth && hasAutoHeight && imageResolution && imageResolution !== 1) {
                            images.push({image, element: result, fetcher: imageFetcher});
                        }
                        fetchers.push(imageFetcher);
                    }
                }
            }
            delete computedStyle["content"];
            const listStyleImage = computedStyle["list-style-image"];
            if (listStyleImage && listStyleImage instanceof adapt.css.URL) {
                const listStyleURL = (/** @type {adapt.css.URL} */ (listStyleImage)).url;
                fetchers.push(adapt.taskutil.loadElement(new Image(), listStyleURL));
            }

            self.preprocessElementStyle(computedStyle);

            self.applyComputedStyles(result, computedStyle);
            if (!self.nodeContext.inline) {
                let blackList = null;
                if (!firstTime) {
                    if (self.nodeContext.inheritedProps["box-decoration-break"] !== "clone") {
                        blackList = self.nodeContext.vertical ? adapt.vgen.frontEdgeBlackListVert : adapt.vgen.frontEdgeBlackListHor;
                    } else {
                        // When box-decoration-break: clone, cloned margins are always truncated to zero.
                        blackList = self.nodeContext.vertical ? adapt.vgen.frontEdgeUnforcedBreakBlackListVert : adapt.vgen.frontEdgeUnforcedBreakBlackListHor;
                    }
                } else if (atUnforcedBreak) {
                    blackList = self.nodeContext.vertical ? adapt.vgen.frontEdgeUnforcedBreakBlackListVert : adapt.vgen.frontEdgeUnforcedBreakBlackListHor;
                }
                if (blackList) {
                    for (const propName in blackList) {
                        adapt.base.setCSSProperty(result, propName, blackList[propName]);
                    }
                }
            }
            if (listItem) {
                result.setAttribute("value", computedStyle["ua-list-item-count"].stringValue());
            }
            self.viewNode = result;
            if (fetchers.length) {
                adapt.taskutil.waitForFetchers(fetchers).then(() => {
                    if (imageResolution > 0) {
                        self.modifyElemDimensionWithImageResolution(images, imageResolution, computedStyle, self.nodeContext.vertical);
                    }
                    frame.finish(needToProcessChildren);
                });
            } else {
                frame.timeSlice().then(() => {
                    frame.finish(needToProcessChildren);
                });
            }
        });
    });
    return frame.result();
};

/**
 * @private
 * @param {Element} element
 * @param {adapt.csscasc.ElementStyle} cascStyle
 * @param {adapt.cssstyler.AbstractStyler} styler
 * @param {adapt.expr.Context} context
 */
adapt.vgen.ViewFactory.prototype.processAfterIfcontinues = function(element, cascStyle, styler, context) {
    const pseudoMap = this.getPseudoMap(cascStyle, this.regionIds, this.isFootnote, this.nodeContext, context);
    if (!pseudoMap) return;

    if (pseudoMap['after-if-continues']
        && pseudoMap['after-if-continues']['content']) {
        const shadowStyler = new adapt.vgen.PseudoelementStyler(element, cascStyle, styler, context,
            this.exprContentListener);
        this.nodeContext.afterIfContinues =
            new vivliostyle.selectors.AfterIfContinues(element, shadowStyler);
    }
};

/**
 * @private
 * @const
 * @type {Array.<string>}
 */
adapt.vgen.ViewFactory.SVG_URL_ATTRIBUTES = [
    "color-profile", "clip-path", "cursor", "filter",
    "marker", "marker-start", "marker-end", "marker-mid",
    "fill", "stroke", "mask"
];

/**
 * @param {string} attributeName
 * @return {boolean} isSVGUrlAttribute
 */
adapt.vgen.ViewFactory.prototype.isSVGUrlAttribute = attributeName => adapt.vgen.ViewFactory.SVG_URL_ATTRIBUTES.includes(attributeName.toLowerCase());

/**
 * @param {!Array<!{image: !HTMLElement, element: !HTMLElement, fetcher: !adapt.taskutil.Fetcher<string>}>} images
 * @param {number} imageResolution
 * @param {!Object.<string,adapt.css.Val>} computedStyle
 * @param {boolean} isVertical
 */
adapt.vgen.ViewFactory.prototype.modifyElemDimensionWithImageResolution = function(images, imageResolution, computedStyle, isVertical) {
    const self = this;
    images.forEach(param => {
        if (param.fetcher.get().get() === "load") {
            const img = param.image;
            let scaledWidth = img.width / imageResolution;
            let scaledHeight = img.height / imageResolution;
            const elem = param.element;
            if (scaledWidth > 0 && scaledHeight > 0) {
                if (computedStyle["box-sizing"] === adapt.css.ident.border_box) {
                    if (computedStyle["border-left-style"] !== adapt.css.ident.none) {
                        scaledWidth += adapt.css.toNumber(computedStyle["border-left-width"], self.context);
                    }
                    if (computedStyle["border-right-style"] !== adapt.css.ident.none) {
                        scaledWidth += adapt.css.toNumber(computedStyle["border-right-width"], self.context);
                    }
                    if (computedStyle["border-top-style"] !== adapt.css.ident.none) {
                        scaledHeight += adapt.css.toNumber(computedStyle["border-top-width"], self.context);
                    }
                    if (computedStyle["border-bottom-style"] !== adapt.css.ident.none) {
                        scaledHeight += adapt.css.toNumber(computedStyle["border-bottom-width"], self.context);
                    }
                }
                if (imageResolution > 1) {
                    const maxWidth = computedStyle["max-width"] || adapt.css.ident.none;
                    const maxHeight = computedStyle["max-height"] || adapt.css.ident.none;
                    if (maxWidth === adapt.css.ident.none && maxHeight === adapt.css.ident.none) {
                        adapt.base.setCSSProperty(elem, "max-width", `${scaledWidth}px`);
                    } else if (maxWidth !== adapt.css.ident.none && maxHeight === adapt.css.ident.none) {
                        adapt.base.setCSSProperty(elem, "width", `${scaledWidth}px`);
                    } else if (maxWidth === adapt.css.ident.none && maxHeight !== adapt.css.ident.none) {
                        adapt.base.setCSSProperty(elem, "height", `${scaledHeight}px`);
                    } else {
                        // maxWidth != none && maxHeight != none
                        goog.asserts.assert(maxWidth.isNumeric());
                        goog.asserts.assert(maxHeight.isNumeric());
                        const numericMaxWidth = /** @type {adapt.css.Numeric} */ (maxWidth);
                        const numericMaxHeight = /** @type {adapt.css.Numeric} */ (maxHeight);
                        if (numericMaxWidth.unit !== "%") {
                            adapt.base.setCSSProperty(elem, "max-width",
                                `${Math.min(scaledWidth, adapt.css.toNumber(numericMaxWidth, self.context))}px`);
                        } else if (numericMaxHeight.unit !== "%") {
                            adapt.base.setCSSProperty(elem, "max-height",
                                `${Math.min(scaledHeight, adapt.css.toNumber(numericMaxHeight, self.context))}px`);
                        } else {
                            if (isVertical) {
                                adapt.base.setCSSProperty(elem, "height", `${scaledHeight}px`);
                            } else {
                                adapt.base.setCSSProperty(elem, "width", `${scaledWidth}px`);
                            }
                        }
                    }
                } else if (imageResolution < 1) {
                    const minWidth = computedStyle["min-width"] || adapt.css.numericZero;
                    const minHeight = computedStyle["min-height"] || adapt.css.numericZero;
                    goog.asserts.assert(minWidth.isNumeric());
                    goog.asserts.assert(minWidth.isNumeric());
                    const numericMinWidth = /** @type {adapt.css.Numeric} */ (minWidth);
                    const numericMinHeight = /** @type {adapt.css.Numeric} */ (minHeight);
                    if (numericMinWidth.num === 0 && numericMinHeight.num === 0) {
                        adapt.base.setCSSProperty(elem, "min-width", `${scaledWidth}px`);
                    } else if (numericMinWidth.num !== 0 && numericMinHeight.num === 0) {
                        adapt.base.setCSSProperty(elem, "width", `${scaledWidth}px`);
                    } else if (numericMinWidth.num === 0 && numericMinHeight.num !== 0) {
                        adapt.base.setCSSProperty(elem, "height", `${scaledHeight}px`);
                    } else {
                        // minWidth != 0 && minHeight != 0
                        if (numericMinWidth.unit !== "%") {
                            adapt.base.setCSSProperty(elem, "min-width",
                                `${Math.max(scaledWidth, adapt.css.toNumber(numericMinWidth, self.context))}px`);
                        } else if (numericMinHeight.unit !== "%") {
                            adapt.base.setCSSProperty(elem, "min-height",
                                `${Math.max(scaledHeight, adapt.css.toNumber(numericMinHeight, self.context))}px`);
                        } else {
                            if (isVertical) {
                                adapt.base.setCSSProperty(elem, "height", `${scaledHeight}px`);
                            } else {
                                adapt.base.setCSSProperty(elem, "width", `${scaledWidth}px`);
                            }
                        }
                    }
                }
            }
        }
    });
};

/**
 * @private
 * @param {!Object.<string,adapt.css.Val>} computedStyle
 */
adapt.vgen.ViewFactory.prototype.preprocessElementStyle = function(computedStyle) {
    const self = this;
    /** @type {!Array.<vivliostyle.plugin.PreProcessElementStyleHook>} */ const hooks =
        vivliostyle.plugin.getHooksForName(vivliostyle.plugin.HOOKS.PREPROCESS_ELEMENT_STYLE);
    hooks.forEach(hook => {
        hook(self.nodeContext, computedStyle);
    });
};

/**
 * @private
 * @param {Element} element
 * @param {adapt.cssstyler.AbstractStyler} styler
 */
adapt.vgen.ViewFactory.prototype.findAndProcessRepeatingElements = function(element, styler) {
    for (let child = element.firstChild; child; child = child.nextSibling) {
        if (child.nodeType !== 1) continue;
        const computedStyle = {};
        const elementStyle = styler.getStyle(/** @type {Element}*/ (child), false);
        this.computeStyle(this.nodeContext.vertical, this.nodeContext.direction === "rtl", elementStyle, computedStyle);
        const processRepeatOnBreak = this.processRepeatOnBreak(computedStyle);
        if (!processRepeatOnBreak) continue;

        if (this.nodeContext.formattingContext instanceof vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext
            && !this.nodeContext.belongsTo(this.nodeContext.formattingContext)) {
            return;
        }

        const parent = this.nodeContext.parent;
        const parentFormattingContext = parent && parent.formattingContext;
        this.nodeContext.formattingContext =
            new vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext(
                parentFormattingContext, /** @type {!Element}*/ (this.nodeContext.sourceNode));
        this.nodeContext.formattingContext.initializeRepetitiveElements(this.nodeContext.vertical);
        return;
    }
};

/**
 * @private
 * @param {!Object.<string,adapt.css.Val>} computedStyle
 */
adapt.vgen.ViewFactory.prototype.processRepeatOnBreak = computedStyle => {
    let repeatOnBreak = computedStyle["repeat-on-break"];
    if (repeatOnBreak !== adapt.css.ident.none) {
        if (repeatOnBreak === adapt.css.ident.auto) {
            if (computedStyle["display"] === adapt.css.ident.table_header_group) {
                repeatOnBreak = adapt.css.ident.header;
            } else if (computedStyle["display"] === adapt.css.ident.table_footer_group) {
                repeatOnBreak = adapt.css.ident.footer;
            } else {
                repeatOnBreak = adapt.css.ident.none;
            }
        }
        if (repeatOnBreak && repeatOnBreak !== adapt.css.ident.none) {
            return repeatOnBreak.toString();
        }
    }
    return null;
};


/**
 * @private
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.vgen.ViewFactory.prototype.createTextNodeView = function() {
    const self = this;
    /** @type {!adapt.task.Frame.<boolean>} */ const frame
        = adapt.task.newFrame("createTextNodeView");
    this.preprocessTextContent().then(() => {
        const offsetInNode = self.offsetInNode || 0;
        const textContent = vivliostyle.diff.restoreNewText(
            self.nodeContext.preprocessedTextContent).substr(offsetInNode);
        self.viewNode = document.createTextNode(textContent);
        frame.finish(true);
    });
    return frame.result();
};

/**
 * @private
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.vgen.ViewFactory.prototype.preprocessTextContent = function() {
    if (this.nodeContext.preprocessedTextContent != null) {
        return adapt.task.newResult(true);
    }
    const self = this;
    let originl;
    let textContent = originl = self.sourceNode.textContent;
    /** @type {!adapt.task.Frame.<boolean>} */ const frame
        = adapt.task.newFrame("preprocessTextContent");
    /** @type {!Array.<vivliostyle.plugin.PreProcessTextContentHook>} */ const hooks =
        vivliostyle.plugin.getHooksForName(vivliostyle.plugin.HOOKS.PREPROCESS_TEXT_CONTENT);
    let index = 0;
    frame.loop(() => {
        if (index >= hooks.length) return adapt.task.newResult(false);
        return hooks[index++](self.nodeContext, textContent).thenAsync(processedText => {
            textContent = processedText;
            return adapt.task.newResult(true);
        });
    }).then(() => {
        self.nodeContext.preprocessedTextContent =
            vivliostyle.diff.diffChars(originl, textContent);
        frame.finish(true);
    });
    return frame.result();
};

/**
 * @param {boolean} firstTime
 * @param {boolean} atUnforcedBreak
 * @return {!adapt.task.Result.<boolean>} holding true if children should be processed
 */
adapt.vgen.ViewFactory.prototype.createNodeView = function(firstTime, atUnforcedBreak) {
    const self = this;
    /** @type {!adapt.task.Frame.<boolean>} */ const frame
        = adapt.task.newFrame("createNodeView");
    let result;
    let needToProcessChildren = true;
    if (self.sourceNode.nodeType == 1) {
        result = self.createElementView(firstTime, atUnforcedBreak);
    } else {
        if (self.sourceNode.nodeType == 8) {
            self.viewNode = null; // comment node
            result = adapt.task.newResult(true);
        } else {
            result = self.createTextNodeView();
        }
    }
    result.then(processChildren => {
        needToProcessChildren = processChildren;
        self.nodeContext.viewNode = self.viewNode;
        if (self.viewNode) {
            const parent = self.nodeContext.parent ? self.nodeContext.parent.viewNode : self.viewRoot;
            if (parent) {
                parent.appendChild(self.viewNode);
            }
        }
        frame.finish(needToProcessChildren);
    });
    return frame.result();
};

/**
 * @override
 */
adapt.vgen.ViewFactory.prototype.setCurrent = function(nodeContext, firstTime, atUnforcedBreak) {
    this.nodeContext = nodeContext;
    if (nodeContext) {
        this.sourceNode = nodeContext.sourceNode;
        this.offsetInNode = nodeContext.offsetInNode;
    } else {
        this.sourceNode = null;
        this.offsetInNode = -1;
    }
    this.viewNode = null;
    if (this.nodeContext) {
        return this.createNodeView(firstTime, !!atUnforcedBreak);
    }
    return adapt.task.newResult(true);
};

adapt.vgen.ViewFactory.prototype.processShadowContent = pos => {
    if (pos.shadowContext == null ||
        pos.sourceNode.localName != "content" || pos.sourceNode.namespaceURI != adapt.base.NS.SHADOW) {
        return pos;
    }
    const boxOffset = pos.boxOffset;
    const shadow = pos.shadowContext;
    const parent = pos.parent;

    // content that will be inserted
    let contentNode;
    let contentShadowType;
    let contentShadow;
    if (shadow.subShadow) {
        contentShadow = shadow.subShadow;
        contentNode = shadow.root;
        contentShadowType = shadow.type;
        if (contentShadowType == adapt.vtree.ShadowType.ROOTLESS) {
            contentNode = contentNode.firstChild;
        }
    } else {
        contentShadow = shadow.parentShadow;
        contentNode = shadow.owner.firstChild;
        contentShadowType = adapt.vtree.ShadowType.ROOTLESS;
    }
    const nextSibling = pos.sourceNode.nextSibling;
    if (nextSibling) {
        pos.sourceNode = nextSibling;
        pos.resetView();
    } else if (pos.shadowSibling) {
        pos = pos.shadowSibling;
    } else if (contentNode) {
        pos = null;
    } else {
        pos = pos.parent.modify();
        pos.after = true;
    }
    if (contentNode) {
        const r = new adapt.vtree.NodeContext(contentNode, parent, boxOffset);
        r.shadowContext = contentShadow;
        r.shadowType = contentShadowType;
        r.shadowSibling = pos;
        return r;
    }
    pos.boxOffset = boxOffset;
    return pos;
};

/**
 * @private
 * @param {adapt.vtree.NodeContext} pos
 * @return {adapt.vtree.NodeContext}
 */
adapt.vgen.ViewFactory.prototype.nextPositionInTree = function(pos) {
    let boxOffset = pos.boxOffset + 1; // offset for the next position
    if (pos.after) {
        if (!pos.parent)  // root, that was the last possible position
            return null;
        // we are done with this sourceNode, see if there is a next sibling, unless
        // this is the root of the shadow tree
        if (pos.shadowType != adapt.vtree.ShadowType.ROOTED) {
            const next = pos.sourceNode.nextSibling;
            if (next) {
                pos = pos.modify();
                // keep shadowType
                pos.boxOffset = boxOffset;
                pos.sourceNode = next;
                pos.resetView();
                return this.processShadowContent(pos);
            }
        }
        // if no viable siblings, check if there are shadow siblings
        if (pos.shadowSibling) {
            // our next position is the element after shadow:content in the parent shadow tree
            pos = pos.shadowSibling.modify();
            pos.boxOffset = boxOffset;
            return pos;
        }
        // if not rootless shadow, move to the "after" position for the parent
        pos = pos.parent.modify();
        pos.boxOffset = boxOffset;
        pos.after = true;
        return pos;
    } else {
        // any shadow trees?
        if (pos.nodeShadow) {
            let shadowNode = pos.nodeShadow.root;
            if (pos.nodeShadow.type == adapt.vtree.ShadowType.ROOTLESS) {
                shadowNode = shadowNode.firstChild;
            }
            if (shadowNode) {
                const sr = new adapt.vtree.NodeContext(shadowNode, pos, boxOffset);
                sr.shadowContext = pos.nodeShadow;
                sr.shadowType = pos.nodeShadow.type;
                return this.processShadowContent(sr);
            }
        }
        // any children?
        const child = pos.sourceNode.firstChild;
        if (child) {
            return this.processShadowContent(new adapt.vtree.NodeContext(child, pos, boxOffset));
        }
        // no children - was there text content?
        if (pos.sourceNode.nodeType != 1) {
            const content = vivliostyle.diff.restoreNewText(pos.preprocessedTextContent);
            boxOffset += content.length - 1 - pos.offsetInNode;
        }
        pos = pos.modify();
        pos.boxOffset = boxOffset;
        pos.after = true;
        return pos;
    }
};

/**
 * @param {Element} element
 * @param {adapt.csscasc.ElementStyle} elementStyle
 * @param {?string} transclusionType
 */
adapt.vgen.ViewFactory.prototype.isTransclusion = function(element, elementStyle, transclusionType) {
    const proc = adapt.csscasc.getProp(elementStyle, "hyperlink-processing");
    if (!proc)
        return false;
    const prop = proc.evaluate(this.context, "hyperlink-processing");
    if (!prop)
        return false;
    return prop.toString() == transclusionType;
};


/**
 * @override
 */
adapt.vgen.ViewFactory.prototype.nextInTree = function(nodeContext, atUnforcedBreak) {
    nodeContext = this.nextPositionInTree(nodeContext);
    if (!nodeContext || nodeContext.after) {
        return adapt.task.newResult(nodeContext);
    }
    /** @type {!adapt.task.Frame.<adapt.vtree.NodeContext>} */ const frame
        = adapt.task.newFrame("nextInTree");
    this.setCurrent(nodeContext, true, atUnforcedBreak).then(processChildren => {
        if (!nodeContext.viewNode || !processChildren) {
            nodeContext = nodeContext.modify();
            nodeContext.after = true; // skip
            if (!nodeContext.viewNode) {
                nodeContext.inline = true;
            }
        }
        this.dispatchEvent({
            type: "nextInTree",
            nodeContext
        });
        frame.finish(nodeContext);
    });
    return frame.result();
};

adapt.vgen.ViewFactory.prototype.addImageFetchers = function(bg) {
    if (bg instanceof adapt.css.CommaList) {
        const values = (/** @type {adapt.css.CommaList} */ (bg)).values;
        for (let i = 0; i < values.length; i++) {
            this.addImageFetchers(values[i]);
        }
    } else if (bg instanceof adapt.css.URL) {
        const url = (/** @type {adapt.css.URL} */(bg)).url;
        this.page.fetchers.push(adapt.taskutil.loadElement(new Image(), url));
    }
};

/**
 * @const
 */
adapt.vgen.propertiesNotPassedToDOM = {
    "box-decoration-break": true,
    "float-min-wrap-block": true,
    "float-reference": true,
    "flow-into": true,
    "flow-linger": true,
    "flow-options": true,
    "flow-priority": true,
    "footnote-policy": true,
    "page": true
};

/**
 * @param {Element} target
 * @param {Object.<string,adapt.css.Val>} computedStyle
 */
adapt.vgen.ViewFactory.prototype.applyComputedStyles = function(target, computedStyle) {
    const bg = computedStyle["background-image"];
    if (bg) {
        this.addImageFetchers(bg);
    }
    const isRelativePositioned = computedStyle["position"] === adapt.css.ident.relative;
    for (const propName in computedStyle) {
        if (adapt.vgen.propertiesNotPassedToDOM[propName]) {
            continue;
        }
        let value = computedStyle[propName];
        value = value.visit(new adapt.cssprop.UrlTransformVisitor(
            this.xmldoc.url, this.documentURLTransformer));
        if (value.isNumeric() && adapt.expr.needUnitConversion(value.unit)) {
            // font-size for the root element is already converted to px
            value = adapt.css.convertNumericToPx(value, this.context);
        }
        if (adapt.vtree.delayedProps[propName] ||
            (isRelativePositioned && adapt.vtree.delayedPropsIfRelativePositioned[propName])) {
            // Set it after page layout is done.
            this.page.delayedItems.push(
                new adapt.vtree.DelayedItem(target, propName, value));
            continue;
        }
        adapt.base.setCSSProperty(target, propName, value.toString());
    }
};

/**
 * @override
 */
adapt.vgen.ViewFactory.prototype.applyPseudoelementStyle = function(nodeContext, pseudoName, target) {
    if (nodeContext.after)
        return;
    const element = /** @type {Element} */ (this.sourceNode);
    const styler = nodeContext.shadowContext ?
        /** @type {adapt.cssstyler.AbstractStyler} */ (nodeContext.shadowContext.styler) : this.styler;
    let elementStyle = styler.getStyle(element, false);
    const pseudoMap = adapt.csscasc.getStyleMap(elementStyle, "_pseudos");
    if (!pseudoMap)
        return;
    elementStyle = pseudoMap[pseudoName];
    if (!elementStyle)
        return;
    const computedStyle = {};
    nodeContext.vertical = this.computeStyle(nodeContext.vertical, nodeContext.direction === "rtl", elementStyle, computedStyle);
    const content = computedStyle["content"];
    if (adapt.vtree.nonTrivialContent(content)) {
        content.visit(new adapt.vtree.ContentPropertyHandler(target, this.context, content,
            this.exprContentListener));
        delete computedStyle["content"];
    }
    this.applyComputedStyles(target, computedStyle);
};

/**
 * @override
 */
adapt.vgen.ViewFactory.prototype.peelOff = function(nodeContext, nodeOffset) {
    /** @type {!adapt.task.Frame.<adapt.vtree.NodeContext>} */ const frame
        = adapt.task.newFrame("peelOff");
    const firstPseudo = nodeContext.firstPseudo;
    let offsetInNode = nodeContext.offsetInNode;
    const after = nodeContext.after;
    if (nodeOffset > 0) {
        const text = nodeContext.viewNode.textContent;
        nodeContext.viewNode.textContent = text.substr(0, nodeOffset);
        offsetInNode += nodeOffset;
    } else if (!after && nodeContext.viewNode && offsetInNode == 0) {
        const parent = nodeContext.viewNode.parentNode;
        if (parent)
            parent.removeChild(nodeContext.viewNode);
    }
    const boxOffset = nodeContext.boxOffset + nodeOffset;
    const arr = [];
    while (nodeContext.firstPseudo === firstPseudo) {
        arr.push(nodeContext);
        nodeContext = nodeContext.parent;
    }
    let pn = arr.pop(); // container for that pseudoelement
    let shadowSibling = pn.shadowSibling;
    const self = this;
    frame.loop(() => {
        while (arr.length > 0) {
            pn = arr.pop();
            nodeContext = new adapt.vtree.NodeContext(pn.sourceNode, nodeContext, boxOffset);
            if (arr.length == 0) {
                nodeContext.offsetInNode = offsetInNode;
                nodeContext.after = after;
            }
            nodeContext.shadowType = pn.shadowType;
            nodeContext.shadowContext = pn.shadowContext,
            nodeContext.nodeShadow = pn.nodeShadow;
            nodeContext.shadowSibling = pn.shadowSibling ? pn.shadowSibling : shadowSibling;
            shadowSibling = null;
            const result = self.setCurrent(nodeContext, false);
            if (result.isPending())
                return result;
        }
        return adapt.task.newResult(false);
    }).then(() => {
        frame.finish(nodeContext);
    });
    return frame.result();
};


/**
 * @param {string} ns
 * @param {string} tag
 * @return {!Element}
 */
adapt.vgen.ViewFactory.prototype.createElement = function(ns, tag) {
    if (ns == adapt.base.NS.XHTML)
        return this.document.createElement(tag);
    return this.document.createElementNS(ns, tag);
};

/**
 * @override
 */
adapt.vgen.ViewFactory.prototype.applyFootnoteStyle = function(vertical, rtl, target) {
    const computedStyle = {};
    const pseudoMap = adapt.csscasc.getStyleMap(this.footnoteStyle, "_pseudos");
    vertical = this.computeStyle(vertical, rtl, this.footnoteStyle, computedStyle);
    if (pseudoMap && pseudoMap["before"]) {
        const childComputedStyle = {};
        const span = this.createElement(adapt.base.NS.XHTML, "span");
        adapt.vgen.setPseudoName(span, "before");
        target.appendChild(span);
        this.computeStyle(vertical, rtl, pseudoMap["before"], childComputedStyle);
        delete childComputedStyle["content"];
        this.applyComputedStyles(span, childComputedStyle);
    }
    delete computedStyle["content"];
    this.applyComputedStyles(target, computedStyle);
    return vertical;
};

/**
 * @override
 */
adapt.vgen.ViewFactory.prototype.processFragmentedBlockEdge = nodeContext => {
    if (nodeContext) {
        nodeContext.walkUpBlocks(block => {
            const boxDecorationBreak = block.inheritedProps["box-decoration-break"];
            if (!boxDecorationBreak || boxDecorationBreak === "slice") {
                const elem = block.viewNode;
                goog.asserts.assert(elem instanceof Element);
                if (block.vertical) {
                    adapt.base.setCSSProperty(elem, "padding-left", "0");
                    adapt.base.setCSSProperty(elem, "border-left", "none");
                    adapt.base.setCSSProperty(elem, "border-top-left-radius", "0");
                    adapt.base.setCSSProperty(elem, "border-bottom-left-radius", "0");
                } else {
                    adapt.base.setCSSProperty(elem, "padding-bottom", "0");
                    adapt.base.setCSSProperty(elem, "border-bottom", "none");
                    adapt.base.setCSSProperty(elem, "border-bottom-left-radius", "0");
                    adapt.base.setCSSProperty(elem, "border-bottom-right-radius", "0");
                }
            }
        });
    }
};

/**
 * @override
 */
adapt.vgen.ViewFactory.prototype.convertLengthToPx = function(numeric, viewNode, clientLayout) {
    const num = numeric.num;
    const unit = numeric.unit;
    if (adapt.expr.isFontRelativeLengthUnit(unit)) {
        let elem = viewNode;
        while (elem && elem.nodeType !== 1) {
            elem = elem.parentNode;
        }
        goog.asserts.assert(elem);
        const fontSize = parseFloat(clientLayout.getElementComputedStyle(/** @type {Element} */ (elem))["font-size"]);
        goog.asserts.assert(this.context);
        return adapt.csscasc.convertFontRelativeLengthToPx(numeric, fontSize, this.context).num;
    } else {
        const unitSize = this.context.queryUnitSize(unit, false);
        if (unitSize) {
            return num * unitSize;
        } else {
            return numeric;
        }
    }
};

/**
 * Returns if two NodePositionStep are equivalent.
 * @param {!adapt.vtree.NodePositionStep} step1
 * @param {!adapt.vtree.NodePositionStep} step2
 * @returns {boolean}
 */
adapt.vgen.ViewFactory.prototype.isSameNodePositionStep = (step1, step2) => {
    if (step1.shadowContext) {
        if (!step2.shadowContext) {
            return false;
        }
        const elem1 = step1.node.nodeType === 1 ? /** @type {Element} */ (step1.node) : step1.node.parentElement;
        const elem2 = step2.node.nodeType === 1 ? /** @type {Element} */ (step2.node) : step2.node.parentElement;
        return step1.shadowContext.owner === step2.shadowContext.owner
            && adapt.vgen.getPseudoName(elem1) === adapt.vgen.getPseudoName(elem2);
    } else {
        return step1.node === step2.node;
    }
};

/**
 * @override
 */
adapt.vgen.ViewFactory.prototype.isSameNodePosition = function(nodePosition1, nodePosition2) {
    return nodePosition1.offsetInNode === nodePosition2.offsetInNode
        && nodePosition1.after == nodePosition2.after
        && nodePosition1.steps.length === nodePosition2.steps.length
        && nodePosition1.steps.every((step1, i) => {
            const step2 = nodePosition2.steps[i];
            return this.isSameNodePositionStep(step1, step2);
        });
};

adapt.vgen.ViewFactory.prototype.isPseudoelement = elem => !!adapt.vgen.getPseudoName(elem);

/**
 * @param {adapt.vgen.Viewport} viewport
 * @constructor
 * @implements {adapt.vtree.ClientLayout}
 */
adapt.vgen.DefaultClientLayout = function(viewport) {
    /** @const */ this.layoutBox = viewport.layoutBox;
    /** @const */ this.window = viewport.window;
};

/**
 * @private
 * @param {adapt.vtree.ClientRect} rect
 * @param {adapt.vtree.ClientRect} originRect
 * @returns {adapt.vtree.ClientRect}
 */
adapt.vgen.DefaultClientLayout.prototype.subtractOffsets = (rect, originRect) => {
    const viewportLeft = originRect.left;
    const viewportTop = originRect.top;
    return /** @type {adapt.vtree.ClientRect} */ ({
        left: rect.left - viewportLeft,
        top: rect.top - viewportTop,
        right: rect.right - viewportLeft,
        bottom: rect.bottom - viewportTop,
        width: rect.width,
        height: rect.height
    });
};

/**
 * @override
 */
adapt.vgen.DefaultClientLayout.prototype.getRangeClientRects = function(range) {
    const rects = range["getClientRects"]();
    const layoutBoxRect = this.layoutBox.getBoundingClientRect();
    return Array.from(rects).map(function(rect) {
        return this.subtractOffsets(rect, layoutBoxRect);
    }, this);
};

/**
 * @override
 */
adapt.vgen.DefaultClientLayout.prototype.getElementClientRect = function(element) {
    const htmlElement = /** @type {HTMLElement} */ (element);
    const rect = /** @type {adapt.vtree.ClientRect} */ (htmlElement.getBoundingClientRect());
    const layoutBoxRect = this.layoutBox.getBoundingClientRect();
    return this.subtractOffsets(rect, layoutBoxRect);
};

/**
 * @override
 */
adapt.vgen.DefaultClientLayout.prototype.getElementComputedStyle = function(element) {
    return this.window.getComputedStyle(element, null);
};

/**
 * @constructor
 * @param {Window} window
 * @param {number} fontSize
 * @param {HTMLElement=} opt_root
 * @param {number=} opt_width
 * @param {number=} opt_height
 */
adapt.vgen.Viewport = function(window, fontSize, opt_root, opt_width, opt_height) {
    /** @const */ this.window = window;
    /** @const */ this.fontSize = fontSize;
    /** @const */ this.document = window.document;
    /** @type {HTMLElement} */ this.root = opt_root || this.document.body;
    let outerZoomBox = this.root.firstElementChild;
    if (!outerZoomBox) {
        outerZoomBox = this.document.createElement("div");
        outerZoomBox.setAttribute("data-vivliostyle-outer-zoom-box", true);
        this.root.appendChild(outerZoomBox);
    }
    let contentContainer = outerZoomBox.firstElementChild;
    if (!contentContainer) {
        contentContainer = this.document.createElement("div");
        contentContainer.setAttribute("data-vivliostyle-spread-container", true);
        outerZoomBox.appendChild(contentContainer);
    }
    let layoutBox = outerZoomBox.nextElementSibling;
    if (!layoutBox) {
        layoutBox = this.document.createElement("div");
        layoutBox.setAttribute("data-vivliostyle-layout-box", true);
        this.root.appendChild(layoutBox);
    }
    /** @private @type {!HTMLElement} */ this.outerZoomBox = /** @type {!HTMLElement} */ (outerZoomBox);
    /** @type {!HTMLElement} */ this.contentContainer = /** @type {!HTMLElement} */ (contentContainer);
    /** @const */ this.layoutBox = /** @type {!HTMLElement} */ (layoutBox);
    const clientLayout = new adapt.vgen.DefaultClientLayout(this);
    const computedStyle = clientLayout.getElementComputedStyle(this.root);
    /** @type {number} */ this.width = opt_width || parseFloat(computedStyle["width"]) || window.innerWidth;
    /** @type {number} */ this.height = opt_height || parseFloat(computedStyle["height"]) || window.innerHeight;
};

/**
 * Reset zoom.
 */
adapt.vgen.Viewport.prototype.resetZoom = function() {
    adapt.base.setCSSProperty(this.outerZoomBox, "width", "");
    adapt.base.setCSSProperty(this.outerZoomBox, "height", "");
    adapt.base.setCSSProperty(this.contentContainer, "width", "");
    adapt.base.setCSSProperty(this.contentContainer, "height", "");
    adapt.base.setCSSProperty(this.contentContainer, "transform", "");
};

/**
 * Zoom viewport.
 * @param {number} width Overall width of contents before scaling (px)
 * @param {number} height Overall height of contents before scaling (px)
 * @param {number} scale Factor to which the viewport will be scaled.
 */
adapt.vgen.Viewport.prototype.zoom = function(width, height, scale) {
    adapt.base.setCSSProperty(this.outerZoomBox, "width", `${width*scale}px`);
    adapt.base.setCSSProperty(this.outerZoomBox, "height", `${height*scale}px`);
    adapt.base.setCSSProperty(this.contentContainer, "width", `${width}px`);
    adapt.base.setCSSProperty(this.contentContainer, "height", `${height}px`);
    adapt.base.setCSSProperty(this.contentContainer, "transform", `scale(${scale})`);
};

/**
 * Remove all pages inside the viewport.
 */
adapt.vgen.Viewport.prototype.clear = function() {
    const root = this.root;
    while (root.lastChild) {
        root.removeChild(root.lastChild);
    }
};
