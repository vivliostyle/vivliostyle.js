/**
 * Copyright 2016 Vivliostyle Inc.
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
 * @fileoverview Plugin mechanism
 */
goog.provide("vivliostyle.plugin");

goog.require("vivliostyle.namespace");
goog.require("vivliostyle.logging");

goog.scope(function() {

    /**
     * Type of implemented hooks.
     * @enum {string}
     */
    vivliostyle.plugin.HOOKS = {
        /**
         * Called when a single property declaration is parsed.
         *
         * The hook is called with an object with the following properties:
         *   {string} name: Property name
         *   {!adapt.css.Val} value: Property value
         *   {boolean} important: Whether '!important' flag is present or not
         * Functions called by this hook are expected to return a value with the same type as the above.
         * The declaration is then replaced by the returned value.
         *
         * Note that a shorthand declaration is not directly passed to this hook.
         * After the shorthand declaration is interpreted and broken into non-shorthand declarations, the hook is called for each of the non-shorthand declarations.
         */
        "SIMPLE_PROPERTY": "SIMPLE_PROPERTY",

        /**
         * Called when a single document (i.e. a single spine item) has been fetched, before parsing.
         *
         * The hook is called with the Document object.
         */
        "PREPROCESS_SINGLE_DOCUMENT": "PREPROCESS_SINGLE_DOCUMENT",

        /**
         * Called before creating a text node for modifying a text content.
         *
         * The hook is called with an object with the following properties:
         *   {adapt.vtree.NodeContext} nodeContext
         *   {string} sourceTextContent
         *
         * Functions called by this hook are expected to return a adapt.task.Result.<string>.
         * The text content is then replaced by the returned value.
         */
        "PREPROCESS_TEXT_CONTENT": "PREPROCESS_TEXT_CONTENT",

        /**
         * Called before creating a element for modifying a element style.
         *
         * The hook is called with an object with the following properties:
         *   {adapt.vtree.NodeContext} nodeContext
         *   {!Object} style
         */
        "PREPROCESS_ELEMENT_STYLE": "PREPROCESS_ELEMENT_STYLE",

        /**
         * Called before geting adapt.csscasc.polyfilledInheritedProps.
         *
         * The hook return a array of polyfilled inherited property name.
         */
        "POLYFILLED_INHERITED_PROPS": "POLYFILLED_INHERITED_PROPS",

        /**
         * Called when a Viewer is configured.
         *
         * The hook is called with an object with the following properties:
         *  {adapt.base.JSON} command
         */
        "CONFIGURATION": "CONFIGURATION",

        /**
         * Called when resolving a text node breaker
         * which detects an acceptable breakpoint and break text node at this point.
         *
         * The hook is called with an object with the following properties:
         *  {adapt.vtree.NodeContext} nodeContext
         *
         * Functions called by this hook are expected to
         * return an instnce of {adapt.layout.TextNodeBreaker} or null.
         */
        "RESOLVE_TEXT_NODE_BREAKER": "RESOLVE_TEXT_NODE_BREAKER",

        /**
         * Called when resolving a formatting context.
         *
         * The hook is called with the following parameters:
         *   nodeContext: a NodeContext object
         *   firstTime: a boolean flag representing whether this node is encountered for the first time or not
         *   display: an adapt.css.Ident value representing 'display' value of the node
         *   position: an adapt.css.Ident value representing 'position' value of the node
         *   float: an adapt.css.Ident value representing 'float' value of the node
         *   isRoot: a boolean flag representing whether this node is a root (of a flow) or not
         * Functions called by this hook are expected to return a formatting context for the NodeContext.
         */
        "RESOLVE_FORMATTING_CONTEXT": "RESOLVE_FORMATTING_CONTEXT",
        /**
         * Called when resolving a layout processor (adapt.layout.LayoutProcessor) for a formatting context.
         *
         * The hook is called with a formatting context (adapt.vtree.FormattingContext).
         * Functions called by this hook are expected to return a layout processor corresponding to the formatting context.
         */
        "RESOLVE_LAYOUT_PROCESSOR": "RESOLVE_LAYOUT_PROCESSOR",

        /**
         * Called after laid out a block contents.
         *
         * The hook is called with an object with the following properties:
         *  {adapt.vtree.NodeContext} nodeContext
         *  {Array.<adapt.vtree.NodeContext>} checkPoints
         *  {adapt.layout.Column} column
         */
        "POST_LAYOUT_BLOCK": "POST_LAYOUT_BLOCK"
    };

    /** @const */ var HOOKS = vivliostyle.plugin.HOOKS;

    /**
     * @typedef {function(Document)}
     */
    vivliostyle.plugin.PreProcessSingleDocumentHook;

    /**
     * @typedef {function(
     *   adapt.vtree.NodeContext,
     *   string
     * ):adapt.task.Result.<string>}
     */
    vivliostyle.plugin.PreProcessTextContentHook;

    /**
     * @typedef {function(
     *   adapt.vtree.NodeContext,
     *   !Object
     * ):undefined}
     */
    vivliostyle.plugin.PreProcessElementStyleHook;

    /**
     * @typedef {function():!Array.<string>}
     */
    vivliostyle.plugin.PolyfilledInheritedPropsHook;

    /**
     * @typedef {function(
     *   adapt.base.JSON
     * ):{needResize:(?boolean|undefined), needRefresh:(?boolean|undefined)}}
     */
    vivliostyle.plugin.ConfigurationHook;

    /**
     * @typedef {function(adapt.vtree.NodeContext):adapt.layout.TextNodeBreaker}
     */
    vivliostyle.plugin.ResolveTextNodeBreakerHook;
    /**
     * @typedef {function(adapt.vtree.NodeContext, boolean, adapt.css.Ident, adapt.css.Ident, adapt.css.Ident, boolean):adapt.vtree.FormattingContext}
     */
    vivliostyle.plugin.ResolveFormattingContextHook;

    /**
     * @typedef {function(!adapt.vtree.FormattingContext):adapt.layout.LayoutProcessor}
     */
    vivliostyle.plugin.ResolveLayoutProcessorHook;

    /**
     * @typedef {function(
     *   adapt.vtree.NodeContext,
     *   Array.<adapt.vtree.NodeContext>,
     *   adapt.layout.Column
     * ):undefined}
     */
    vivliostyle.plugin.PostLayoutBlockHook;


    /**
     * @private
     * @const
     * @type {Object<string, !Array<!function(...)>>}
     */
    vivliostyle.plugin.hooks = {};

    /**
     * Register a function to a hook with the specified name.
     * The registered function is called at appropriate timings by the core code.
     * Arguments passed to the function depend on the hook.
     * When multiple functions are registered, they are called by the order in which they are registered.
     * @param {string} name Name of the hook.
     * @param {!function(...)} fn Function to be registered to the hook.
     */
    vivliostyle.plugin.registerHook = function(name, fn) {
        if (!HOOKS[name]) {
            vivliostyle.logging.logger.warn(new Error("Skipping unknown plugin hook '" + name + "'."));
        } else {
            var hooksForName = vivliostyle.plugin.hooks[name];
            if (!hooksForName) {
                hooksForName = vivliostyle.plugin.hooks[name] = [];
            }
            hooksForName.push(fn);
        }
    };

    /**
     * Remove a function already registered to the specified name.
     * Note that even if the same function are registered multiple times, this method removes only the first one.
     * @param {string} name Name of the hook.
     * @param {!function(...)} fn Function to be removed from the hook.
     */
    vivliostyle.plugin.removeHook = function(name, fn) {
        if (!HOOKS[name]) {
            vivliostyle.logging.logger.warn(new Error("Ignoring unknown plugin hook '" + name + "'."));
        } else {
            var hooksForName = vivliostyle.plugin.hooks[name];
            if (hooksForName) {
                var index = hooksForName.indexOf(fn);
                if (index >= 0) {
                    hooksForName.splice(index, 1);
                }
            }
        }
    };

    /**
     * Get all hooks registered to the specified name.
     * This method is for internal use (from the core code).
     * @param {string} name
     * @returns {!Array.<!function(...)>}
     */
    vivliostyle.plugin.getHooksForName = function(name) {
        var hooksForName = vivliostyle.plugin.hooks[name];
        return hooksForName || [];
    };

    vivliostyle.namespace.exportSymbol("vivliostyle.plugin.registerHook", vivliostyle.plugin.registerHook);
    vivliostyle.namespace.exportSymbol("vivliostyle.plugin.removeHook", vivliostyle.plugin.removeHook);
});
