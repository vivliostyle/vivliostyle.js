/**
 * Copyright 2013 Google, Inc.
 * Copyright 2015 Trim-marks Inc.
 * Copyright 2019 Vivliostyle Foundation
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
 */
goog.provide('adapt.toc');

goog.require('adapt.vtree');
goog.require('adapt.vgen');
goog.require('adapt.ops');
goog.require('adapt.font');
goog.require('adapt.expr');
goog.require('vivliostyle.counters');

// closed: 25B8
// open: 25BE
// empty: 25B9

/** @const */
adapt.toc.bulletClosed = "\u25B8";
/** @const */
adapt.toc.bulletOpen = "\u25BE";
/** @const */
adapt.toc.bulletEmpty = "\u25B9";

/**
 * @param {adapt.ops.OPSDocStore} store
 * @param {string} url
 * @param {?string} lang
 * @param {adapt.vtree.ClientLayout} clientLayout
 * @param {adapt.font.Mapper} fontMapper
 * @param {adapt.expr.Preferences} pref
 * @param {adapt.vgen.CustomRendererFactory} rendererFactory
 * @param {Object.<string,string>} fallbackMap
 * @param {!adapt.base.DocumentURLTransformer} documentURLTransformer
 * @param {!vivliostyle.counters.CounterStore} counterStore
 * @constructor
 * @implements {adapt.vgen.CustomRendererFactory}
 */
adapt.toc.TOCView = function(store, url, lang, clientLayout, fontMapper, pref,
                             rendererFactory, fallbackMap, documentURLTransformer, counterStore) {
    /** @const */ this.store = store;
    /** @const */ this.url = url;
    /** @const */ this.lang = lang;
    /** @const */ this.clientLayout = clientLayout;
    /** @const */ this.fontMapper = fontMapper;
    /** @const */ this.pref = adapt.expr.clonePreferences(pref);
    this.pref.spreadView = false;   // No spred view for TOC box
    /** @const */ this.rendererFactory = rendererFactory;
    /** @const */ this.fallbackMap = fallbackMap;
    /** @const */ this.documentURLTransformer = documentURLTransformer;
    /** @const */ this.counterStore = counterStore;
    /** @type {adapt.vtree.Page} */ this.page = null;
    /** @type {adapt.ops.StyleInstance} */ this.instance = null;
};

/**
 * @param {Element} elem
 * @param {number} depth
 * @return {void}
 */
adapt.toc.TOCView.prototype.setAutoHeight = function(elem, depth) {
    if (depth-- == 0) {
        return;
    }
    for (let c = elem.firstChild; c; c = c.nextSibling) {
        if (c.nodeType == 1) {
            const e = /** @type {Element} */ (c);
            if (adapt.base.getCSSProperty(e, "height", "auto") != "auto") {
                adapt.base.setCSSProperty(e, "height", "auto");
                this.setAutoHeight(e, depth);
            }
            if (adapt.base.getCSSProperty(e, "position", "static") == "absolute") {
                adapt.base.setCSSProperty(e, "position", "relative");
                this.setAutoHeight(e, depth);
            }
        }
    }
};

/**
 * @param {Event} evt
 */
adapt.toc.toggleNodeExpansion = evt => {
    const elem = /** @type {Element} */ (evt.target);
    const open = elem.textContent == adapt.toc.bulletClosed;
    elem.textContent = open ? adapt.toc.bulletOpen : adapt.toc.bulletClosed;
    const tocNodeElem = /** @type {Element} */ (elem.parentNode);
    elem.setAttribute("aria-expanded", open ? "true" : "false");
    tocNodeElem.setAttribute("aria-expanded", open ? "true" : "false");
    let c = tocNodeElem.firstChild;
    while (c) {
        if (c.nodeType != 1) {
            c = c.nextSibling;
            continue;
        }
        const ce = /** @type {HTMLElement} */ (c);
        const adaptClass = ce.getAttribute("data-adapt-class");
        if (adaptClass == "toc-container") {
            ce.setAttribute("aria-hidden", !open ? "true" : "false");
            c = ce.firstChild;
            continue;
        }
        if (ce.getAttribute("data-adapt-class") == "toc-node") {
            ce.style.height = open ? "auto" : "0px";

            // Update enable/disable tab move to the button and anchor.
            if (ce.children.length >= 3) {
                ce.children[0].tabIndex = open ? 0 : -1;
            }
            if (ce.children.length >= 2) {
                ce.children[1].tabIndex = open ? 0 : -1;
            }
        }
        c = c.nextSibling;
    }
    evt.stopPropagation();
};

/**
 * @override
 */
adapt.toc.TOCView.prototype.makeCustomRenderer = function(xmldoc) {
    const renderer = this.rendererFactory.makeCustomRenderer(xmldoc);
    return (
        /**
         * @param {Element} srcElem
         * @param {Element} viewParent
         * @return {!adapt.task.Result.<Element>}
         */
        (srcElem, viewParent, computedStyle) => {
            const behavior = computedStyle["behavior"];
            if (!behavior || (behavior.toString() != "toc-node" && behavior.toString() != "toc-container")) {
                return renderer(srcElem, viewParent, computedStyle);
            }
            const adaptParentClass = viewParent.getAttribute("data-adapt-class");
            if (adaptParentClass == "toc-node") {
                var button = /** @type {Element} */ (viewParent.firstChild);
                if (button.textContent != adapt.toc.bulletClosed) {
                    button.textContent = adapt.toc.bulletClosed;
                    adapt.base.setCSSProperty(button, "cursor", "pointer");
                    button.addEventListener("click", adapt.toc.toggleNodeExpansion, false);

                    button.setAttribute("role", "button");
                    button.setAttribute("aria-expanded", "false");
                    viewParent.setAttribute("aria-expanded", "false");

                    // Enable tab move to the button unless hidden.
                    if (viewParent.style.height !== "0px") {
                        button.tabIndex = 0;
                    }
                }
            }
            const element = viewParent.ownerDocument.createElement("div");
            element.setAttribute("data-adapt-process-children", "true");
            if (behavior.toString() == "toc-node") {
                var button = viewParent.ownerDocument.createElement("div");
                button.textContent = adapt.toc.bulletEmpty;
                // TODO: define pseudo-element for the button?
                adapt.base.setCSSProperty(button, "margin", "0.2em 0 0 -1em");
                adapt.base.setCSSProperty(button, "margin-inline-start", "-1em");
                adapt.base.setCSSProperty(button, "margin-inline-end", "0");
                adapt.base.setCSSProperty(button, "display", "inline-block");
                adapt.base.setCSSProperty(button, "width", "1em");
                adapt.base.setCSSProperty(button, "text-align", "center");
                adapt.base.setCSSProperty(button, "vertical-align", "top");
                adapt.base.setCSSProperty(button, "cursor", "default");
                adapt.base.setCSSProperty(button, "font-family", "Menlo,sans-serif");
                element.appendChild(button);
                adapt.base.setCSSProperty(element, "overflow", "hidden");
                element.setAttribute("data-adapt-class", "toc-node");
                element.setAttribute("role", "treeitem");

                if (adaptParentClass == "toc-node" || adaptParentClass == "toc-container") {
                    adapt.base.setCSSProperty(element, "height", "0px");

                    // Prevent tab move to hidden anchor.
                    const anchorElem = srcElem.firstElementChild;
                    if (anchorElem && anchorElem.localName === "a") {
                        anchorElem.tabIndex = -1;
                    }
                }
            } else {
                if (adaptParentClass == "toc-node") {
                    element.setAttribute("data-adapt-class", "toc-container");
                    element.setAttribute("role", "group");
                    element.setAttribute("aria-hidden", "true");
                } else if (adaptParentClass == null) {
                    // TOC tree root
                    element.setAttribute("role", "tree");
                }
            }
            return adapt.task.newResult(/** @type {Element} */ (element));
        }
    );
};

/**
 * @param {!HTMLElement} elem
 * @param {adapt.vgen.Viewport} viewport
 * @param {number} width
 * @param {number} height
 * @param {number} fontSize
 * @return {!adapt.task.Result.<adapt.vtree.Page>}
 */
adapt.toc.TOCView.prototype.showTOC = function(elem, viewport, width, height, fontSize) {
    if (this.page) {
        return adapt.task.newResult(/** @type {adapt.vtree.Page} */ (this.page));
    }
    const self = this;
    /** @type {!adapt.task.Frame.<adapt.vtree.Page>} */ const frame = adapt.task.newFrame("showTOC");
    const page = new adapt.vtree.Page(elem, elem);
    this.page = page;
    this.store.load(this.url).then(xmldoc => {
        let s = self.store.getStyleForDoc(xmldoc);
        // Abandon using document's style and use uaBaseCascade instead because
        // vertical writing-mode in TOC causes problem.
        const style = new adapt.ops.Style(self.store, s.rootScope, s.pageScope,
            adapt.csscasc.uaBaseCascade.clone(),
            s.rootBox, s.fontFaces, s.footnoteProps, s.flowProps, s.viewportProps, s.pageProps);
        const viewportSize = style.sizeViewport(width, 100000, fontSize);
        viewport = new adapt.vgen.Viewport(viewport.window, viewportSize.fontSize, viewport.root,
            viewportSize.width, viewportSize.height);
        const customRenderer = self.makeCustomRenderer(xmldoc);
        const instance = new adapt.ops.StyleInstance(style, xmldoc, self.lang,
            viewport, self.clientLayout, self.fontMapper, customRenderer, self.fallbackMap, 0,
            self.documentURLTransformer, self.counterStore);
        self.instance = instance;
        instance.pref = self.pref;
        instance.init().then(() => {
            instance.layoutNextPage(page, null).then(() => {
                self.setAutoHeight(elem, 2);
                frame.finish(page);
            });
        });
    });
    return frame.result();
};

/**
 * @return {void}
 */
adapt.toc.TOCView.prototype.hideTOC = function() {
    if (this.page) {
        this.page.container.style.visibility = "hidden";
        this.page.container.setAttribute("aria-hidden", "true");
    }
};

/**
 * @return {boolean}
 */
adapt.toc.TOCView.prototype.isTOCVisible = function() {
    return !!this.page && this.page.container.style.visibility === "visible";
};

