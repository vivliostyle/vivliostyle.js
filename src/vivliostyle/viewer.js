/**
 * Copyright 2015 Vivliostyle Inc.
 * @fileoverview Vivliostyle Viewer class
 */
goog.provide("vivliostyle.viewer");

goog.require("vivliostyle.namespace");
goog.require("vivliostyle.constants");
goog.require("vivliostyle.util");
goog.require("adapt.base");
goog.require("adapt.viewer");

goog.scope(function() {
    /** @const */ var PageProgression = vivliostyle.constants.PageProgression;

    /**
     * Viewer settings that must be passed to Viewer's constructor.
     * - userAgentRootURL: URL of a directory from which viewer resource files (under resources/ directory in the source repository) are served.
     * - viewportElement: An element used as the viewport of the displayed contents.
     * - window: Window object. If omitted, current `window` is used.
     * @dict
     * @typedef {{
     *     userAgentRootURL: string,
     *     viewportElement: !HTMLElement,
     *     window: (!Window|undefined)
     * }}
     */
    vivliostyle.viewer.ViewerSettings;

    /**
     * Viewer options that can be set after the Viewer object is constructed.
     * - autoResize: Run layout again when the window is resized. default: true
     * - fontSize: Default font size (px). default: 16
     * - pageBorderWidth: Width of a border between two pages in a single spread (px). Effective only when spreadView option is true. default: 1
     * - renderAllPages: Render all pages at the document load time. default: true
     * - spreadView: Display two pages in a single spread at a time. default: false
     * - zoom: Zoom factor with which pages are displayed. default: 1
     * @dict
     * @typedef {{
     *     autoResize: (boolean|undefined),
     *     fontSize: (number|undefined),
     *     pageBorderWidth: (number|undefined),
     *     renderAllPages: (boolean|undefined),
     *     spreadView: (boolean|undefined),
     *     zoom: (number|undefined)
     * }}
     */
    vivliostyle.viewer.ViewerOptions;

    /**
     * @returns {!vivliostyle.viewer.ViewerOptions}
     */
    function getDefaultViewerOptions() {
        return {
            "autoResize": true,
            "fontSize": 16,
            "pageBorderWidth": 1,
            "renderAllPages": true,
            "spreadView": false,
            "zoom": 1
        };
    }

    /**
     * @param {!vivliostyle.viewer.ViewerOptions} options
     * @returns {!Object}
     */
    function convertViewerOptions(options) {
        var converted = {};
        Object.keys(options).forEach(function(key) {
            var v = options[key];
            switch (key) {
                case "autoResize":
                    converted["autoresize"] = v;
                    break;
                case "pageBorderWidth":
                    converted["pageBorder"] = v;
                    break;
                default:
                    converted[key] = v;
            }
        });
        return converted;
    }

    /**
     * Options for the displayed document.
     * - documentObject: Document object for the document. If provided, it is used directly without parsing the source again.
     * - fragment: Fragmentation identifier (EPUB CFI) of the location in the document which is to be displayed.
     * - userStyleSheet: An array of user style sheets to be injected. A single stylesheet may be a URL of the style sheet or a text content of the style sheet.
     * @dict
     * @typedef {{
     *     documentObject: (!Document|undefined),
     *     fragment: (string|undefined),
     *     userStyleSheet: (!Array<{url: (string|undefined), text: (string|undefined)}>|undefined)
     * }}
     */
    vivliostyle.viewer.DocumentOptions;

    /**
     * Vivliostyle Viewer class.
     * @param {!vivliostyle.viewer.ViewerSettings} settings
     * @param {!vivliostyle.viewer.ViewerOptions=} opt_options
     * @constructor
     */
    vivliostyle.viewer.Viewer = function(settings, opt_options) {
        /** @const @private */ this.settings = settings;
        /** @const @private */ this.adaptViewer = new adapt.viewer.Viewer(
            settings["window"] || window, settings["viewportElement"], "main", this.dispatcher.bind(this));
        /** @private @type {!vivliostyle.viewer.ViewerOptions} */
        this.options = getDefaultViewerOptions();
        if (opt_options) {
            this.setOptions(opt_options);
        }
        /** @const @private */ this.eventTarget = new adapt.base.SimpleEventTarget();
    };
    /** @const */ var Viewer = vivliostyle.viewer.Viewer;

    /**
     * Set ViewerOptions to the viewer.
     * @param {!vivliostyle.viewer.ViewerOptions} options
     */
    Viewer.prototype.setOptions = function(options) {
        var command = Object.assign({"a": "configure"}, convertViewerOptions(options));
        this.adaptViewer.sendCommand(command);
        Object.assign(this.options, options);
    };

    /**
     * @private
     * @param {!adapt.base.JSON} msg
     */
    Viewer.prototype.dispatcher = function(msg) {
        /** @dict */ var event = {"type": msg["t"]};
        var o = /** @type {!Object} */ (msg);
        Object.keys(o).forEach(function(key) {
            if (key !== "t") {
                event[key] = o[key];
            }
        });
        this.eventTarget.dispatchEvent(event);
    };

    /**
     * Add a listener function, which is invoked when the specified type of event is dispatched.
     * @param {string} type Event type.
     * @param {!function(!{type: string}):void} listener Listener function.
     */
    Viewer.prototype.addListener = function(type, listener) {
        this.eventTarget.addEventListener(type, /** @type {adapt.base.EventListener} */ (listener), false);
    };

    /**
     * Remove an event listener.
     * @param {string} type Event type.
     * @param {!function(!{type: string}):void} listener Listener function.
     */
    Viewer.prototype.removeListener = function(type, listener) {
        this.eventTarget.removeEventListener(type, /** @type {adapt.base.EventListener} */ (listener), false);
    };

    /**
     * Load an HTML or XML document.
     * @param {string} url
     * @param {!vivliostyle.viewer.DocumentOptions=} opt_documentOptions
     * @param {!vivliostyle.viewer.ViewerOptions=} opt_viewerOptions
     */
    Viewer.prototype.loadDocument = function(url, opt_documentOptions, opt_viewerOptions) {
        if (!url) {
            this.eventTarget.dispatchEvent({"type": "error", "content": "No URL specified"});
        }
        this.loadDocumentOrEPUB(url, null, opt_documentOptions, opt_viewerOptions);
    };

    /**
     * Load an EPUB document.
     * @param {string} epubUrl
     * @param {!vivliostyle.viewer.DocumentOptions=} opt_documentOptions
     * @param {!vivliostyle.viewer.ViewerOptions=} opt_viewerOptions
     */
    Viewer.prototype.loadEPUB = function(epubUrl, opt_documentOptions, opt_viewerOptions) {
        if (!epubUrl) {
            this.eventTarget.dispatchEvent({"type": "error", "content": "No URL specified"});
        }
        this.loadDocumentOrEPUB(null, epubUrl, opt_documentOptions, opt_viewerOptions);
    };

    /**
     * Load an HTML or XML document, or an EPUB document.
     * @private
     * @param {?string} url
     * @param {?string} epubUrl
     * @param {!vivliostyle.viewer.DocumentOptions=} opt_documentOptions
     * @param {!vivliostyle.viewer.ViewerOptions=} opt_viewerOptions
     */
    Viewer.prototype.loadDocumentOrEPUB = function(url, epubUrl, opt_documentOptions, opt_viewerOptions) {
        var documentOptions = opt_documentOptions || {};
        var userStyleSheet;
        var uss = documentOptions["userStyleSheet"];
        if (uss) {
            userStyleSheet = uss.map(function(s) {
                return { url: s.url || null, text: s.text || null};
            });
        }

        if (opt_viewerOptions) {
            Object.assign(this.options, opt_viewerOptions);
        }

        var command = Object.assign({
            "a": url ? "loadXML" : "loadEPUB",

            "userAgentRootURL": this.settings["userAgentRootURL"],

            "url": url || epubUrl,
            "document": documentOptions["documentObject"],
            "fragment": documentOptions["fragment"],
            "userStyleSheet": userStyleSheet
        }, convertViewerOptions(this.options));
        this.adaptViewer.initEmbed(command);
    };

    /**
     * Returns the current page progression of the viewer. If no document is loaded, returns null.
     * @returns {?vivliostyle.constants.PageProgression}
     */
    Viewer.prototype.getCurrentPageProgression = function() {
        return this.adaptViewer.getCurrentPageProgression();
    };

    /**
     * @enum {string}
     */
    vivliostyle.viewer.Navigation = {
        PREVIOUS: "previous",
        NEXT: "next",
        LEFT: "left",
        RIGHT: "right",
        FIRST: "first",
        LAST: "last"
    };
    /** @const */ var Navigation = vivliostyle.viewer.Navigation;

    /**
     * @private
     * @param {!vivliostyle.viewer.Navigation} nav
     * @returns {!vivliostyle.viewer.Navigation}
     */
    Viewer.prototype.resolveNavigation = function(nav) {
        switch (nav) {
            case Navigation.LEFT:
                return this.getCurrentPageProgression() === PageProgression.LTR ? Navigation.PREVIOUS : Navigation.NEXT;
            case Navigation.RIGHT:
                return this.getCurrentPageProgression() === PageProgression.LTR ? Navigation.NEXT : Navigation.PREVIOUS;
            default:
                return nav;
        }
    };

    /**
     * Navigate to the specified page.
     * @param {!vivliostyle.viewer.Navigation} nav
     */
    Viewer.prototype.navigateToPage = function(nav) {
        this.adaptViewer.sendCommand({"a": "moveTo", "where": this.resolveNavigation(nav)});
    };

    /**
     * Navigate to the specified internal URL.
     * @param {string} url
     */
    Viewer.prototype.navigateToInternalUrl = function(url) {
        this.adaptViewer.sendCommand({"a": "moveTo", "url": url});
    };

    /**
     * @enum {string}
     */
    vivliostyle.viewer.ZoomType = adapt.viewer.ZoomType;
    /** @const */ var ZoomType = vivliostyle.viewer.ZoomType;

    /**
     * Returns zoom factor corresponding to the specified zoom type.
     * @param {vivliostyle.viewer.ZoomType} type
     * @returns {number}
     */
    Viewer.prototype.queryZoomFactor = function(type) {
        return this.adaptViewer.queryZoomFactor(type);
    };

    vivliostyle.namespace.exportSymbol("vivliostyle.viewer.Viewer", Viewer);
    goog.exportProperty(Viewer.prototype, "setOptions", Viewer.prototype.setOptions);
    goog.exportProperty(Viewer.prototype, "addListener", Viewer.prototype.addListener);
    goog.exportProperty(Viewer.prototype, "removeListener", Viewer.prototype.removeListener);
    goog.exportProperty(Viewer.prototype, "loadDocument", Viewer.prototype.loadDocument);
    goog.exportProperty(Viewer.prototype, "getCurrentPageProgression", Viewer.prototype.getCurrentPageProgression);
    goog.exportProperty(Viewer.prototype, "navigateToPage", Viewer.prototype.navigateToPage);
    goog.exportProperty(Viewer.prototype, "navigateToInternalUrl", Viewer.prototype.navigateToInternalUrl);
    goog.exportProperty(Viewer.prototype, "queryZoomFactor", Viewer.prototype.queryZoomFactor);
    vivliostyle.namespace.exportSymbol("vivliostyle.viewer.ZoomType", ZoomType);
    goog.exportProperty(ZoomType, "FIT_INSIDE_VIEWPORT", ZoomType.FIT_INSIDE_VIEWPORT);
});
