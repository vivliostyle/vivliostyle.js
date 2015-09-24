(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*!
 * Knockout JavaScript library v3.3.0
 * (c) Steven Sanderson - http://knockoutjs.com/
 * License: MIT (http://www.opensource.org/licenses/mit-license.php)
 */

(function(){
var DEBUG=true;
(function(undefined){
    // (0, eval)('this') is a robust way of getting a reference to the global object
    // For details, see http://stackoverflow.com/questions/14119988/return-this-0-evalthis/14120023#14120023
    var window = this || (0, eval)('this'),
        document = window['document'],
        navigator = window['navigator'],
        jQueryInstance = window["jQuery"],
        JSON = window["JSON"];
(function(factory) {
    // Support three module loading scenarios
    if (typeof define === 'function' && define['amd']) {
        // [1] AMD anonymous module
        define(['exports', 'require'], factory);
    } else if (typeof require === 'function' && typeof exports === 'object' && typeof module === 'object') {
        // [2] CommonJS/Node.js
        factory(module['exports'] || exports);  // module.exports is for Node.js
    } else {
        // [3] No module loader (plain <script> tag) - put directly in global namespace
        factory(window['ko'] = {});
    }
}(function(koExports, amdRequire){
// Internally, all KO objects are attached to koExports (even the non-exported ones whose names will be minified by the closure compiler).
// In the future, the following "ko" variable may be made distinct from "koExports" so that private objects are not externally reachable.
var ko = typeof koExports !== 'undefined' ? koExports : {};
// Google Closure Compiler helpers (used only to make the minified file smaller)
ko.exportSymbol = function(koPath, object) {
    var tokens = koPath.split(".");

    // In the future, "ko" may become distinct from "koExports" (so that non-exported objects are not reachable)
    // At that point, "target" would be set to: (typeof koExports !== "undefined" ? koExports : ko)
    var target = ko;

    for (var i = 0; i < tokens.length - 1; i++)
        target = target[tokens[i]];
    target[tokens[tokens.length - 1]] = object;
};
ko.exportProperty = function(owner, publicName, object) {
    owner[publicName] = object;
};
ko.version = "3.3.0";

ko.exportSymbol('version', ko.version);
ko.utils = (function () {
    function objectForEach(obj, action) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                action(prop, obj[prop]);
            }
        }
    }

    function extend(target, source) {
        if (source) {
            for(var prop in source) {
                if(source.hasOwnProperty(prop)) {
                    target[prop] = source[prop];
                }
            }
        }
        return target;
    }

    function setPrototypeOf(obj, proto) {
        obj.__proto__ = proto;
        return obj;
    }

    var canSetPrototype = ({ __proto__: [] } instanceof Array);

    // Represent the known event types in a compact way, then at runtime transform it into a hash with event name as key (for fast lookup)
    var knownEvents = {}, knownEventTypesByEventName = {};
    var keyEventTypeName = (navigator && /Firefox\/2/i.test(navigator.userAgent)) ? 'KeyboardEvent' : 'UIEvents';
    knownEvents[keyEventTypeName] = ['keyup', 'keydown', 'keypress'];
    knownEvents['MouseEvents'] = ['click', 'dblclick', 'mousedown', 'mouseup', 'mousemove', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave'];
    objectForEach(knownEvents, function(eventType, knownEventsForType) {
        if (knownEventsForType.length) {
            for (var i = 0, j = knownEventsForType.length; i < j; i++)
                knownEventTypesByEventName[knownEventsForType[i]] = eventType;
        }
    });
    var eventsThatMustBeRegisteredUsingAttachEvent = { 'propertychange': true }; // Workaround for an IE9 issue - https://github.com/SteveSanderson/knockout/issues/406

    // Detect IE versions for bug workarounds (uses IE conditionals, not UA string, for robustness)
    // Note that, since IE 10 does not support conditional comments, the following logic only detects IE < 10.
    // Currently this is by design, since IE 10+ behaves correctly when treated as a standard browser.
    // If there is a future need to detect specific versions of IE10+, we will amend this.
    var ieVersion = document && (function() {
        var version = 3, div = document.createElement('div'), iElems = div.getElementsByTagName('i');

        // Keep constructing conditional HTML blocks until we hit one that resolves to an empty fragment
        while (
            div.innerHTML = '<!--[if gt IE ' + (++version) + ']><i></i><![endif]-->',
            iElems[0]
        ) {}
        return version > 4 ? version : undefined;
    }());
    var isIe6 = ieVersion === 6,
        isIe7 = ieVersion === 7;

    function isClickOnCheckableElement(element, eventType) {
        if ((ko.utils.tagNameLower(element) !== "input") || !element.type) return false;
        if (eventType.toLowerCase() != "click") return false;
        var inputType = element.type;
        return (inputType == "checkbox") || (inputType == "radio");
    }

    // For details on the pattern for changing node classes
    // see: https://github.com/knockout/knockout/issues/1597
    var cssClassNameRegex = /\S+/g;

    function toggleDomNodeCssClass(node, classNames, shouldHaveClass) {
        var addOrRemoveFn;
        if (classNames) {
            if (typeof node.classList === 'object') {
                addOrRemoveFn = node.classList[shouldHaveClass ? 'add' : 'remove'];
                ko.utils.arrayForEach(classNames.match(cssClassNameRegex), function(className) {
                    addOrRemoveFn.call(node.classList, className);
                });
            } else if (typeof node.className['baseVal'] === 'string') {
                // SVG tag .classNames is an SVGAnimatedString instance
                toggleObjectClassPropertyString(node.className, 'baseVal', classNames, shouldHaveClass);
            } else {
                // node.className ought to be a string.
                toggleObjectClassPropertyString(node, 'className', classNames, shouldHaveClass);
            }
        }
    }

    function toggleObjectClassPropertyString(obj, prop, classNames, shouldHaveClass) {
        // obj/prop is either a node/'className' or a SVGAnimatedString/'baseVal'.
        var currentClassNames = obj[prop].match(cssClassNameRegex) || [];
        ko.utils.arrayForEach(classNames.match(cssClassNameRegex), function(className) {
            ko.utils.addOrRemoveItem(currentClassNames, className, shouldHaveClass);
        });
        obj[prop] = currentClassNames.join(" ");
    }

    return {
        fieldsIncludedWithJsonPost: ['authenticity_token', /^__RequestVerificationToken(_.*)?$/],

        arrayForEach: function (array, action) {
            for (var i = 0, j = array.length; i < j; i++)
                action(array[i], i);
        },

        arrayIndexOf: function (array, item) {
            if (typeof Array.prototype.indexOf == "function")
                return Array.prototype.indexOf.call(array, item);
            for (var i = 0, j = array.length; i < j; i++)
                if (array[i] === item)
                    return i;
            return -1;
        },

        arrayFirst: function (array, predicate, predicateOwner) {
            for (var i = 0, j = array.length; i < j; i++)
                if (predicate.call(predicateOwner, array[i], i))
                    return array[i];
            return null;
        },

        arrayRemoveItem: function (array, itemToRemove) {
            var index = ko.utils.arrayIndexOf(array, itemToRemove);
            if (index > 0) {
                array.splice(index, 1);
            }
            else if (index === 0) {
                array.shift();
            }
        },

        arrayGetDistinctValues: function (array) {
            array = array || [];
            var result = [];
            for (var i = 0, j = array.length; i < j; i++) {
                if (ko.utils.arrayIndexOf(result, array[i]) < 0)
                    result.push(array[i]);
            }
            return result;
        },

        arrayMap: function (array, mapping) {
            array = array || [];
            var result = [];
            for (var i = 0, j = array.length; i < j; i++)
                result.push(mapping(array[i], i));
            return result;
        },

        arrayFilter: function (array, predicate) {
            array = array || [];
            var result = [];
            for (var i = 0, j = array.length; i < j; i++)
                if (predicate(array[i], i))
                    result.push(array[i]);
            return result;
        },

        arrayPushAll: function (array, valuesToPush) {
            if (valuesToPush instanceof Array)
                array.push.apply(array, valuesToPush);
            else
                for (var i = 0, j = valuesToPush.length; i < j; i++)
                    array.push(valuesToPush[i]);
            return array;
        },

        addOrRemoveItem: function(array, value, included) {
            var existingEntryIndex = ko.utils.arrayIndexOf(ko.utils.peekObservable(array), value);
            if (existingEntryIndex < 0) {
                if (included)
                    array.push(value);
            } else {
                if (!included)
                    array.splice(existingEntryIndex, 1);
            }
        },

        canSetPrototype: canSetPrototype,

        extend: extend,

        setPrototypeOf: setPrototypeOf,

        setPrototypeOfOrExtend: canSetPrototype ? setPrototypeOf : extend,

        objectForEach: objectForEach,

        objectMap: function(source, mapping) {
            if (!source)
                return source;
            var target = {};
            for (var prop in source) {
                if (source.hasOwnProperty(prop)) {
                    target[prop] = mapping(source[prop], prop, source);
                }
            }
            return target;
        },

        emptyDomNode: function (domNode) {
            while (domNode.firstChild) {
                ko.removeNode(domNode.firstChild);
            }
        },

        moveCleanedNodesToContainerElement: function(nodes) {
            // Ensure it's a real array, as we're about to reparent the nodes and
            // we don't want the underlying collection to change while we're doing that.
            var nodesArray = ko.utils.makeArray(nodes);
            var templateDocument = (nodesArray[0] && nodesArray[0].ownerDocument) || document;

            var container = templateDocument.createElement('div');
            for (var i = 0, j = nodesArray.length; i < j; i++) {
                container.appendChild(ko.cleanNode(nodesArray[i]));
            }
            return container;
        },

        cloneNodes: function (nodesArray, shouldCleanNodes) {
            for (var i = 0, j = nodesArray.length, newNodesArray = []; i < j; i++) {
                var clonedNode = nodesArray[i].cloneNode(true);
                newNodesArray.push(shouldCleanNodes ? ko.cleanNode(clonedNode) : clonedNode);
            }
            return newNodesArray;
        },

        setDomNodeChildren: function (domNode, childNodes) {
            ko.utils.emptyDomNode(domNode);
            if (childNodes) {
                for (var i = 0, j = childNodes.length; i < j; i++)
                    domNode.appendChild(childNodes[i]);
            }
        },

        replaceDomNodes: function (nodeToReplaceOrNodeArray, newNodesArray) {
            var nodesToReplaceArray = nodeToReplaceOrNodeArray.nodeType ? [nodeToReplaceOrNodeArray] : nodeToReplaceOrNodeArray;
            if (nodesToReplaceArray.length > 0) {
                var insertionPoint = nodesToReplaceArray[0];
                var parent = insertionPoint.parentNode;
                for (var i = 0, j = newNodesArray.length; i < j; i++)
                    parent.insertBefore(newNodesArray[i], insertionPoint);
                for (var i = 0, j = nodesToReplaceArray.length; i < j; i++) {
                    ko.removeNode(nodesToReplaceArray[i]);
                }
            }
        },

        fixUpContinuousNodeArray: function(continuousNodeArray, parentNode) {
            // Before acting on a set of nodes that were previously outputted by a template function, we have to reconcile
            // them against what is in the DOM right now. It may be that some of the nodes have already been removed, or that
            // new nodes might have been inserted in the middle, for example by a binding. Also, there may previously have been
            // leading comment nodes (created by rewritten string-based templates) that have since been removed during binding.
            // So, this function translates the old "map" output array into its best guess of the set of current DOM nodes.
            //
            // Rules:
            //   [A] Any leading nodes that have been removed should be ignored
            //       These most likely correspond to memoization nodes that were already removed during binding
            //       See https://github.com/SteveSanderson/knockout/pull/440
            //   [B] We want to output a continuous series of nodes. So, ignore any nodes that have already been removed,
            //       and include any nodes that have been inserted among the previous collection

            if (continuousNodeArray.length) {
                // The parent node can be a virtual element; so get the real parent node
                parentNode = (parentNode.nodeType === 8 && parentNode.parentNode) || parentNode;

                // Rule [A]
                while (continuousNodeArray.length && continuousNodeArray[0].parentNode !== parentNode)
                    continuousNodeArray.splice(0, 1);

                // Rule [B]
                if (continuousNodeArray.length > 1) {
                    var current = continuousNodeArray[0], last = continuousNodeArray[continuousNodeArray.length - 1];
                    // Replace with the actual new continuous node set
                    continuousNodeArray.length = 0;
                    while (current !== last) {
                        continuousNodeArray.push(current);
                        current = current.nextSibling;
                        if (!current) // Won't happen, except if the developer has manually removed some DOM elements (then we're in an undefined scenario)
                            return;
                    }
                    continuousNodeArray.push(last);
                }
            }
            return continuousNodeArray;
        },

        setOptionNodeSelectionState: function (optionNode, isSelected) {
            // IE6 sometimes throws "unknown error" if you try to write to .selected directly, whereas Firefox struggles with setAttribute. Pick one based on browser.
            if (ieVersion < 7)
                optionNode.setAttribute("selected", isSelected);
            else
                optionNode.selected = isSelected;
        },

        stringTrim: function (string) {
            return string === null || string === undefined ? '' :
                string.trim ?
                    string.trim() :
                    string.toString().replace(/^[\s\xa0]+|[\s\xa0]+$/g, '');
        },

        stringStartsWith: function (string, startsWith) {
            string = string || "";
            if (startsWith.length > string.length)
                return false;
            return string.substring(0, startsWith.length) === startsWith;
        },

        domNodeIsContainedBy: function (node, containedByNode) {
            if (node === containedByNode)
                return true;
            if (node.nodeType === 11)
                return false; // Fixes issue #1162 - can't use node.contains for document fragments on IE8
            if (containedByNode.contains)
                return containedByNode.contains(node.nodeType === 3 ? node.parentNode : node);
            if (containedByNode.compareDocumentPosition)
                return (containedByNode.compareDocumentPosition(node) & 16) == 16;
            while (node && node != containedByNode) {
                node = node.parentNode;
            }
            return !!node;
        },

        domNodeIsAttachedToDocument: function (node) {
            return ko.utils.domNodeIsContainedBy(node, node.ownerDocument.documentElement);
        },

        anyDomNodeIsAttachedToDocument: function(nodes) {
            return !!ko.utils.arrayFirst(nodes, ko.utils.domNodeIsAttachedToDocument);
        },

        tagNameLower: function(element) {
            // For HTML elements, tagName will always be upper case; for XHTML elements, it'll be lower case.
            // Possible future optimization: If we know it's an element from an XHTML document (not HTML),
            // we don't need to do the .toLowerCase() as it will always be lower case anyway.
            return element && element.tagName && element.tagName.toLowerCase();
        },

        registerEventHandler: function (element, eventType, handler) {
            var mustUseAttachEvent = ieVersion && eventsThatMustBeRegisteredUsingAttachEvent[eventType];
            if (!mustUseAttachEvent && jQueryInstance) {
                jQueryInstance(element)['bind'](eventType, handler);
            } else if (!mustUseAttachEvent && typeof element.addEventListener == "function")
                element.addEventListener(eventType, handler, false);
            else if (typeof element.attachEvent != "undefined") {
                var attachEventHandler = function (event) { handler.call(element, event); },
                    attachEventName = "on" + eventType;
                element.attachEvent(attachEventName, attachEventHandler);

                // IE does not dispose attachEvent handlers automatically (unlike with addEventListener)
                // so to avoid leaks, we have to remove them manually. See bug #856
                ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                    element.detachEvent(attachEventName, attachEventHandler);
                });
            } else
                throw new Error("Browser doesn't support addEventListener or attachEvent");
        },

        triggerEvent: function (element, eventType) {
            if (!(element && element.nodeType))
                throw new Error("element must be a DOM node when calling triggerEvent");

            // For click events on checkboxes and radio buttons, jQuery toggles the element checked state *after* the
            // event handler runs instead of *before*. (This was fixed in 1.9 for checkboxes but not for radio buttons.)
            // IE doesn't change the checked state when you trigger the click event using "fireEvent".
            // In both cases, we'll use the click method instead.
            var useClickWorkaround = isClickOnCheckableElement(element, eventType);

            if (jQueryInstance && !useClickWorkaround) {
                jQueryInstance(element)['trigger'](eventType);
            } else if (typeof document.createEvent == "function") {
                if (typeof element.dispatchEvent == "function") {
                    var eventCategory = knownEventTypesByEventName[eventType] || "HTMLEvents";
                    var event = document.createEvent(eventCategory);
                    event.initEvent(eventType, true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, element);
                    element.dispatchEvent(event);
                }
                else
                    throw new Error("The supplied element doesn't support dispatchEvent");
            } else if (useClickWorkaround && element.click) {
                element.click();
            } else if (typeof element.fireEvent != "undefined") {
                element.fireEvent("on" + eventType);
            } else {
                throw new Error("Browser doesn't support triggering events");
            }
        },

        unwrapObservable: function (value) {
            return ko.isObservable(value) ? value() : value;
        },

        peekObservable: function (value) {
            return ko.isObservable(value) ? value.peek() : value;
        },

        toggleDomNodeCssClass: toggleDomNodeCssClass,

        setTextContent: function(element, textContent) {
            var value = ko.utils.unwrapObservable(textContent);
            if ((value === null) || (value === undefined))
                value = "";

            // We need there to be exactly one child: a text node.
            // If there are no children, more than one, or if it's not a text node,
            // we'll clear everything and create a single text node.
            var innerTextNode = ko.virtualElements.firstChild(element);
            if (!innerTextNode || innerTextNode.nodeType != 3 || ko.virtualElements.nextSibling(innerTextNode)) {
                ko.virtualElements.setDomNodeChildren(element, [element.ownerDocument.createTextNode(value)]);
            } else {
                innerTextNode.data = value;
            }

            ko.utils.forceRefresh(element);
        },

        setElementName: function(element, name) {
            element.name = name;

            // Workaround IE 6/7 issue
            // - https://github.com/SteveSanderson/knockout/issues/197
            // - http://www.matts411.com/post/setting_the_name_attribute_in_ie_dom/
            if (ieVersion <= 7) {
                try {
                    element.mergeAttributes(document.createElement("<input name='" + element.name + "'/>"), false);
                }
                catch(e) {} // For IE9 with doc mode "IE9 Standards" and browser mode "IE9 Compatibility View"
            }
        },

        forceRefresh: function(node) {
            // Workaround for an IE9 rendering bug - https://github.com/SteveSanderson/knockout/issues/209
            if (ieVersion >= 9) {
                // For text nodes and comment nodes (most likely virtual elements), we will have to refresh the container
                var elem = node.nodeType == 1 ? node : node.parentNode;
                if (elem.style)
                    elem.style.zoom = elem.style.zoom;
            }
        },

        ensureSelectElementIsRenderedCorrectly: function(selectElement) {
            // Workaround for IE9 rendering bug - it doesn't reliably display all the text in dynamically-added select boxes unless you force it to re-render by updating the width.
            // (See https://github.com/SteveSanderson/knockout/issues/312, http://stackoverflow.com/questions/5908494/select-only-shows-first-char-of-selected-option)
            // Also fixes IE7 and IE8 bug that causes selects to be zero width if enclosed by 'if' or 'with'. (See issue #839)
            if (ieVersion) {
                var originalWidth = selectElement.style.width;
                selectElement.style.width = 0;
                selectElement.style.width = originalWidth;
            }
        },

        range: function (min, max) {
            min = ko.utils.unwrapObservable(min);
            max = ko.utils.unwrapObservable(max);
            var result = [];
            for (var i = min; i <= max; i++)
                result.push(i);
            return result;
        },

        makeArray: function(arrayLikeObject) {
            var result = [];
            for (var i = 0, j = arrayLikeObject.length; i < j; i++) {
                result.push(arrayLikeObject[i]);
            };
            return result;
        },

        isIe6 : isIe6,
        isIe7 : isIe7,
        ieVersion : ieVersion,

        getFormFields: function(form, fieldName) {
            var fields = ko.utils.makeArray(form.getElementsByTagName("input")).concat(ko.utils.makeArray(form.getElementsByTagName("textarea")));
            var isMatchingField = (typeof fieldName == 'string')
                ? function(field) { return field.name === fieldName }
                : function(field) { return fieldName.test(field.name) }; // Treat fieldName as regex or object containing predicate
            var matches = [];
            for (var i = fields.length - 1; i >= 0; i--) {
                if (isMatchingField(fields[i]))
                    matches.push(fields[i]);
            };
            return matches;
        },

        parseJson: function (jsonString) {
            if (typeof jsonString == "string") {
                jsonString = ko.utils.stringTrim(jsonString);
                if (jsonString) {
                    if (JSON && JSON.parse) // Use native parsing where available
                        return JSON.parse(jsonString);
                    return (new Function("return " + jsonString))(); // Fallback on less safe parsing for older browsers
                }
            }
            return null;
        },

        stringifyJson: function (data, replacer, space) {   // replacer and space are optional
            if (!JSON || !JSON.stringify)
                throw new Error("Cannot find JSON.stringify(). Some browsers (e.g., IE < 8) don't support it natively, but you can overcome this by adding a script reference to json2.js, downloadable from http://www.json.org/json2.js");
            return JSON.stringify(ko.utils.unwrapObservable(data), replacer, space);
        },

        postJson: function (urlOrForm, data, options) {
            options = options || {};
            var params = options['params'] || {};
            var includeFields = options['includeFields'] || this.fieldsIncludedWithJsonPost;
            var url = urlOrForm;

            // If we were given a form, use its 'action' URL and pick out any requested field values
            if((typeof urlOrForm == 'object') && (ko.utils.tagNameLower(urlOrForm) === "form")) {
                var originalForm = urlOrForm;
                url = originalForm.action;
                for (var i = includeFields.length - 1; i >= 0; i--) {
                    var fields = ko.utils.getFormFields(originalForm, includeFields[i]);
                    for (var j = fields.length - 1; j >= 0; j--)
                        params[fields[j].name] = fields[j].value;
                }
            }

            data = ko.utils.unwrapObservable(data);
            var form = document.createElement("form");
            form.style.display = "none";
            form.action = url;
            form.method = "post";
            for (var key in data) {
                // Since 'data' this is a model object, we include all properties including those inherited from its prototype
                var input = document.createElement("input");
                input.type = "hidden";
                input.name = key;
                input.value = ko.utils.stringifyJson(ko.utils.unwrapObservable(data[key]));
                form.appendChild(input);
            }
            objectForEach(params, function(key, value) {
                var input = document.createElement("input");
                input.type = "hidden";
                input.name = key;
                input.value = value;
                form.appendChild(input);
            });
            document.body.appendChild(form);
            options['submitter'] ? options['submitter'](form) : form.submit();
            setTimeout(function () { form.parentNode.removeChild(form); }, 0);
        }
    }
}());

ko.exportSymbol('utils', ko.utils);
ko.exportSymbol('utils.arrayForEach', ko.utils.arrayForEach);
ko.exportSymbol('utils.arrayFirst', ko.utils.arrayFirst);
ko.exportSymbol('utils.arrayFilter', ko.utils.arrayFilter);
ko.exportSymbol('utils.arrayGetDistinctValues', ko.utils.arrayGetDistinctValues);
ko.exportSymbol('utils.arrayIndexOf', ko.utils.arrayIndexOf);
ko.exportSymbol('utils.arrayMap', ko.utils.arrayMap);
ko.exportSymbol('utils.arrayPushAll', ko.utils.arrayPushAll);
ko.exportSymbol('utils.arrayRemoveItem', ko.utils.arrayRemoveItem);
ko.exportSymbol('utils.extend', ko.utils.extend);
ko.exportSymbol('utils.fieldsIncludedWithJsonPost', ko.utils.fieldsIncludedWithJsonPost);
ko.exportSymbol('utils.getFormFields', ko.utils.getFormFields);
ko.exportSymbol('utils.peekObservable', ko.utils.peekObservable);
ko.exportSymbol('utils.postJson', ko.utils.postJson);
ko.exportSymbol('utils.parseJson', ko.utils.parseJson);
ko.exportSymbol('utils.registerEventHandler', ko.utils.registerEventHandler);
ko.exportSymbol('utils.stringifyJson', ko.utils.stringifyJson);
ko.exportSymbol('utils.range', ko.utils.range);
ko.exportSymbol('utils.toggleDomNodeCssClass', ko.utils.toggleDomNodeCssClass);
ko.exportSymbol('utils.triggerEvent', ko.utils.triggerEvent);
ko.exportSymbol('utils.unwrapObservable', ko.utils.unwrapObservable);
ko.exportSymbol('utils.objectForEach', ko.utils.objectForEach);
ko.exportSymbol('utils.addOrRemoveItem', ko.utils.addOrRemoveItem);
ko.exportSymbol('utils.setTextContent', ko.utils.setTextContent);
ko.exportSymbol('unwrap', ko.utils.unwrapObservable); // Convenient shorthand, because this is used so commonly

if (!Function.prototype['bind']) {
    // Function.prototype.bind is a standard part of ECMAScript 5th Edition (December 2009, http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-262.pdf)
    // In case the browser doesn't implement it natively, provide a JavaScript implementation. This implementation is based on the one in prototype.js
    Function.prototype['bind'] = function (object) {
        var originalFunction = this;
        if (arguments.length === 1) {
            return function () {
                return originalFunction.apply(object, arguments);
            };
        } else {
            var partialArgs = Array.prototype.slice.call(arguments, 1);
            return function () {
                var args = partialArgs.slice(0);
                args.push.apply(args, arguments);
                return originalFunction.apply(object, args);
            };
        }
    };
}

ko.utils.domData = new (function () {
    var uniqueId = 0;
    var dataStoreKeyExpandoPropertyName = "__ko__" + (new Date).getTime();
    var dataStore = {};

    function getAll(node, createIfNotFound) {
        var dataStoreKey = node[dataStoreKeyExpandoPropertyName];
        var hasExistingDataStore = dataStoreKey && (dataStoreKey !== "null") && dataStore[dataStoreKey];
        if (!hasExistingDataStore) {
            if (!createIfNotFound)
                return undefined;
            dataStoreKey = node[dataStoreKeyExpandoPropertyName] = "ko" + uniqueId++;
            dataStore[dataStoreKey] = {};
        }
        return dataStore[dataStoreKey];
    }

    return {
        get: function (node, key) {
            var allDataForNode = getAll(node, false);
            return allDataForNode === undefined ? undefined : allDataForNode[key];
        },
        set: function (node, key, value) {
            if (value === undefined) {
                // Make sure we don't actually create a new domData key if we are actually deleting a value
                if (getAll(node, false) === undefined)
                    return;
            }
            var allDataForNode = getAll(node, true);
            allDataForNode[key] = value;
        },
        clear: function (node) {
            var dataStoreKey = node[dataStoreKeyExpandoPropertyName];
            if (dataStoreKey) {
                delete dataStore[dataStoreKey];
                node[dataStoreKeyExpandoPropertyName] = null;
                return true; // Exposing "did clean" flag purely so specs can infer whether things have been cleaned up as intended
            }
            return false;
        },

        nextKey: function () {
            return (uniqueId++) + dataStoreKeyExpandoPropertyName;
        }
    };
})();

ko.exportSymbol('utils.domData', ko.utils.domData);
ko.exportSymbol('utils.domData.clear', ko.utils.domData.clear); // Exporting only so specs can clear up after themselves fully

ko.utils.domNodeDisposal = new (function () {
    var domDataKey = ko.utils.domData.nextKey();
    var cleanableNodeTypes = { 1: true, 8: true, 9: true };       // Element, Comment, Document
    var cleanableNodeTypesWithDescendants = { 1: true, 9: true }; // Element, Document

    function getDisposeCallbacksCollection(node, createIfNotFound) {
        var allDisposeCallbacks = ko.utils.domData.get(node, domDataKey);
        if ((allDisposeCallbacks === undefined) && createIfNotFound) {
            allDisposeCallbacks = [];
            ko.utils.domData.set(node, domDataKey, allDisposeCallbacks);
        }
        return allDisposeCallbacks;
    }
    function destroyCallbacksCollection(node) {
        ko.utils.domData.set(node, domDataKey, undefined);
    }

    function cleanSingleNode(node) {
        // Run all the dispose callbacks
        var callbacks = getDisposeCallbacksCollection(node, false);
        if (callbacks) {
            callbacks = callbacks.slice(0); // Clone, as the array may be modified during iteration (typically, callbacks will remove themselves)
            for (var i = 0; i < callbacks.length; i++)
                callbacks[i](node);
        }

        // Erase the DOM data
        ko.utils.domData.clear(node);

        // Perform cleanup needed by external libraries (currently only jQuery, but can be extended)
        ko.utils.domNodeDisposal["cleanExternalData"](node);

        // Clear any immediate-child comment nodes, as these wouldn't have been found by
        // node.getElementsByTagName("*") in cleanNode() (comment nodes aren't elements)
        if (cleanableNodeTypesWithDescendants[node.nodeType])
            cleanImmediateCommentTypeChildren(node);
    }

    function cleanImmediateCommentTypeChildren(nodeWithChildren) {
        var child, nextChild = nodeWithChildren.firstChild;
        while (child = nextChild) {
            nextChild = child.nextSibling;
            if (child.nodeType === 8)
                cleanSingleNode(child);
        }
    }

    return {
        addDisposeCallback : function(node, callback) {
            if (typeof callback != "function")
                throw new Error("Callback must be a function");
            getDisposeCallbacksCollection(node, true).push(callback);
        },

        removeDisposeCallback : function(node, callback) {
            var callbacksCollection = getDisposeCallbacksCollection(node, false);
            if (callbacksCollection) {
                ko.utils.arrayRemoveItem(callbacksCollection, callback);
                if (callbacksCollection.length == 0)
                    destroyCallbacksCollection(node);
            }
        },

        cleanNode : function(node) {
            // First clean this node, where applicable
            if (cleanableNodeTypes[node.nodeType]) {
                cleanSingleNode(node);

                // ... then its descendants, where applicable
                if (cleanableNodeTypesWithDescendants[node.nodeType]) {
                    // Clone the descendants list in case it changes during iteration
                    var descendants = [];
                    ko.utils.arrayPushAll(descendants, node.getElementsByTagName("*"));
                    for (var i = 0, j = descendants.length; i < j; i++)
                        cleanSingleNode(descendants[i]);
                }
            }
            return node;
        },

        removeNode : function(node) {
            ko.cleanNode(node);
            if (node.parentNode)
                node.parentNode.removeChild(node);
        },

        "cleanExternalData" : function (node) {
            // Special support for jQuery here because it's so commonly used.
            // Many jQuery plugins (including jquery.tmpl) store data using jQuery's equivalent of domData
            // so notify it to tear down any resources associated with the node & descendants here.
            if (jQueryInstance && (typeof jQueryInstance['cleanData'] == "function"))
                jQueryInstance['cleanData']([node]);
        }
    };
})();
ko.cleanNode = ko.utils.domNodeDisposal.cleanNode; // Shorthand name for convenience
ko.removeNode = ko.utils.domNodeDisposal.removeNode; // Shorthand name for convenience
ko.exportSymbol('cleanNode', ko.cleanNode);
ko.exportSymbol('removeNode', ko.removeNode);
ko.exportSymbol('utils.domNodeDisposal', ko.utils.domNodeDisposal);
ko.exportSymbol('utils.domNodeDisposal.addDisposeCallback', ko.utils.domNodeDisposal.addDisposeCallback);
ko.exportSymbol('utils.domNodeDisposal.removeDisposeCallback', ko.utils.domNodeDisposal.removeDisposeCallback);
(function () {
    var leadingCommentRegex = /^(\s*)<!--(.*?)-->/;

    function simpleHtmlParse(html, documentContext) {
        documentContext || (documentContext = document);
        var windowContext = documentContext['parentWindow'] || documentContext['defaultView'] || window;

        // Based on jQuery's "clean" function, but only accounting for table-related elements.
        // If you have referenced jQuery, this won't be used anyway - KO will use jQuery's "clean" function directly

        // Note that there's still an issue in IE < 9 whereby it will discard comment nodes that are the first child of
        // a descendant node. For example: "<div><!-- mycomment -->abc</div>" will get parsed as "<div>abc</div>"
        // This won't affect anyone who has referenced jQuery, and there's always the workaround of inserting a dummy node
        // (possibly a text node) in front of the comment. So, KO does not attempt to workaround this IE issue automatically at present.

        // Trim whitespace, otherwise indexOf won't work as expected
        var tags = ko.utils.stringTrim(html).toLowerCase(), div = documentContext.createElement("div");

        // Finds the first match from the left column, and returns the corresponding "wrap" data from the right column
        var wrap = tags.match(/^<(thead|tbody|tfoot)/)              && [1, "<table>", "</table>"] ||
                   !tags.indexOf("<tr")                             && [2, "<table><tbody>", "</tbody></table>"] ||
                   (!tags.indexOf("<td") || !tags.indexOf("<th"))   && [3, "<table><tbody><tr>", "</tr></tbody></table>"] ||
                   /* anything else */                                 [0, "", ""];

        // Go to html and back, then peel off extra wrappers
        // Note that we always prefix with some dummy text, because otherwise, IE<9 will strip out leading comment nodes in descendants. Total madness.
        var markup = "ignored<div>" + wrap[1] + html + wrap[2] + "</div>";
        if (typeof windowContext['innerShiv'] == "function") {
            div.appendChild(windowContext['innerShiv'](markup));
        } else {
            div.innerHTML = markup;
        }

        // Move to the right depth
        while (wrap[0]--)
            div = div.lastChild;

        return ko.utils.makeArray(div.lastChild.childNodes);
    }

    function jQueryHtmlParse(html, documentContext) {
        // jQuery's "parseHTML" function was introduced in jQuery 1.8.0 and is a documented public API.
        if (jQueryInstance['parseHTML']) {
            return jQueryInstance['parseHTML'](html, documentContext) || []; // Ensure we always return an array and never null
        } else {
            // For jQuery < 1.8.0, we fall back on the undocumented internal "clean" function.
            var elems = jQueryInstance['clean']([html], documentContext);

            // As of jQuery 1.7.1, jQuery parses the HTML by appending it to some dummy parent nodes held in an in-memory document fragment.
            // Unfortunately, it never clears the dummy parent nodes from the document fragment, so it leaks memory over time.
            // Fix this by finding the top-most dummy parent element, and detaching it from its owner fragment.
            if (elems && elems[0]) {
                // Find the top-most parent element that's a direct child of a document fragment
                var elem = elems[0];
                while (elem.parentNode && elem.parentNode.nodeType !== 11 /* i.e., DocumentFragment */)
                    elem = elem.parentNode;
                // ... then detach it
                if (elem.parentNode)
                    elem.parentNode.removeChild(elem);
            }

            return elems;
        }
    }

    ko.utils.parseHtmlFragment = function(html, documentContext) {
        return jQueryInstance ? jQueryHtmlParse(html, documentContext)   // As below, benefit from jQuery's optimisations where possible
                              : simpleHtmlParse(html, documentContext);  // ... otherwise, this simple logic will do in most common cases.
    };

    ko.utils.setHtml = function(node, html) {
        ko.utils.emptyDomNode(node);

        // There's no legitimate reason to display a stringified observable without unwrapping it, so we'll unwrap it
        html = ko.utils.unwrapObservable(html);

        if ((html !== null) && (html !== undefined)) {
            if (typeof html != 'string')
                html = html.toString();

            // jQuery contains a lot of sophisticated code to parse arbitrary HTML fragments,
            // for example <tr> elements which are not normally allowed to exist on their own.
            // If you've referenced jQuery we'll use that rather than duplicating its code.
            if (jQueryInstance) {
                jQueryInstance(node)['html'](html);
            } else {
                // ... otherwise, use KO's own parsing logic.
                var parsedNodes = ko.utils.parseHtmlFragment(html, node.ownerDocument);
                for (var i = 0; i < parsedNodes.length; i++)
                    node.appendChild(parsedNodes[i]);
            }
        }
    };
})();

ko.exportSymbol('utils.parseHtmlFragment', ko.utils.parseHtmlFragment);
ko.exportSymbol('utils.setHtml', ko.utils.setHtml);

ko.memoization = (function () {
    var memos = {};

    function randomMax8HexChars() {
        return (((1 + Math.random()) * 0x100000000) | 0).toString(16).substring(1);
    }
    function generateRandomId() {
        return randomMax8HexChars() + randomMax8HexChars();
    }
    function findMemoNodes(rootNode, appendToArray) {
        if (!rootNode)
            return;
        if (rootNode.nodeType == 8) {
            var memoId = ko.memoization.parseMemoText(rootNode.nodeValue);
            if (memoId != null)
                appendToArray.push({ domNode: rootNode, memoId: memoId });
        } else if (rootNode.nodeType == 1) {
            for (var i = 0, childNodes = rootNode.childNodes, j = childNodes.length; i < j; i++)
                findMemoNodes(childNodes[i], appendToArray);
        }
    }

    return {
        memoize: function (callback) {
            if (typeof callback != "function")
                throw new Error("You can only pass a function to ko.memoization.memoize()");
            var memoId = generateRandomId();
            memos[memoId] = callback;
            return "<!--[ko_memo:" + memoId + "]-->";
        },

        unmemoize: function (memoId, callbackParams) {
            var callback = memos[memoId];
            if (callback === undefined)
                throw new Error("Couldn't find any memo with ID " + memoId + ". Perhaps it's already been unmemoized.");
            try {
                callback.apply(null, callbackParams || []);
                return true;
            }
            finally { delete memos[memoId]; }
        },

        unmemoizeDomNodeAndDescendants: function (domNode, extraCallbackParamsArray) {
            var memos = [];
            findMemoNodes(domNode, memos);
            for (var i = 0, j = memos.length; i < j; i++) {
                var node = memos[i].domNode;
                var combinedParams = [node];
                if (extraCallbackParamsArray)
                    ko.utils.arrayPushAll(combinedParams, extraCallbackParamsArray);
                ko.memoization.unmemoize(memos[i].memoId, combinedParams);
                node.nodeValue = ""; // Neuter this node so we don't try to unmemoize it again
                if (node.parentNode)
                    node.parentNode.removeChild(node); // If possible, erase it totally (not always possible - someone else might just hold a reference to it then call unmemoizeDomNodeAndDescendants again)
            }
        },

        parseMemoText: function (memoText) {
            var match = memoText.match(/^\[ko_memo\:(.*?)\]$/);
            return match ? match[1] : null;
        }
    };
})();

ko.exportSymbol('memoization', ko.memoization);
ko.exportSymbol('memoization.memoize', ko.memoization.memoize);
ko.exportSymbol('memoization.unmemoize', ko.memoization.unmemoize);
ko.exportSymbol('memoization.parseMemoText', ko.memoization.parseMemoText);
ko.exportSymbol('memoization.unmemoizeDomNodeAndDescendants', ko.memoization.unmemoizeDomNodeAndDescendants);
ko.extenders = {
    'throttle': function(target, timeout) {
        // Throttling means two things:

        // (1) For dependent observables, we throttle *evaluations* so that, no matter how fast its dependencies
        //     notify updates, the target doesn't re-evaluate (and hence doesn't notify) faster than a certain rate
        target['throttleEvaluation'] = timeout;

        // (2) For writable targets (observables, or writable dependent observables), we throttle *writes*
        //     so the target cannot change value synchronously or faster than a certain rate
        var writeTimeoutInstance = null;
        return ko.dependentObservable({
            'read': target,
            'write': function(value) {
                clearTimeout(writeTimeoutInstance);
                writeTimeoutInstance = setTimeout(function() {
                    target(value);
                }, timeout);
            }
        });
    },

    'rateLimit': function(target, options) {
        var timeout, method, limitFunction;

        if (typeof options == 'number') {
            timeout = options;
        } else {
            timeout = options['timeout'];
            method = options['method'];
        }

        limitFunction = method == 'notifyWhenChangesStop' ?  debounce : throttle;
        target.limit(function(callback) {
            return limitFunction(callback, timeout);
        });
    },

    'notify': function(target, notifyWhen) {
        target["equalityComparer"] = notifyWhen == "always" ?
            null :  // null equalityComparer means to always notify
            valuesArePrimitiveAndEqual;
    }
};

var primitiveTypes = { 'undefined':1, 'boolean':1, 'number':1, 'string':1 };
function valuesArePrimitiveAndEqual(a, b) {
    var oldValueIsPrimitive = (a === null) || (typeof(a) in primitiveTypes);
    return oldValueIsPrimitive ? (a === b) : false;
}

function throttle(callback, timeout) {
    var timeoutInstance;
    return function () {
        if (!timeoutInstance) {
            timeoutInstance = setTimeout(function() {
                timeoutInstance = undefined;
                callback();
            }, timeout);
        }
    };
}

function debounce(callback, timeout) {
    var timeoutInstance;
    return function () {
        clearTimeout(timeoutInstance);
        timeoutInstance = setTimeout(callback, timeout);
    };
}

function applyExtenders(requestedExtenders) {
    var target = this;
    if (requestedExtenders) {
        ko.utils.objectForEach(requestedExtenders, function(key, value) {
            var extenderHandler = ko.extenders[key];
            if (typeof extenderHandler == 'function') {
                target = extenderHandler(target, value) || target;
            }
        });
    }
    return target;
}

ko.exportSymbol('extenders', ko.extenders);

ko.subscription = function (target, callback, disposeCallback) {
    this._target = target;
    this.callback = callback;
    this.disposeCallback = disposeCallback;
    this.isDisposed = false;
    ko.exportProperty(this, 'dispose', this.dispose);
};
ko.subscription.prototype.dispose = function () {
    this.isDisposed = true;
    this.disposeCallback();
};

ko.subscribable = function () {
    ko.utils.setPrototypeOfOrExtend(this, ko.subscribable['fn']);
    this._subscriptions = {};
    this._versionNumber = 1;
}

var defaultEvent = "change";

var ko_subscribable_fn = {
    subscribe: function (callback, callbackTarget, event) {
        var self = this;

        event = event || defaultEvent;
        var boundCallback = callbackTarget ? callback.bind(callbackTarget) : callback;

        var subscription = new ko.subscription(self, boundCallback, function () {
            ko.utils.arrayRemoveItem(self._subscriptions[event], subscription);
            if (self.afterSubscriptionRemove)
                self.afterSubscriptionRemove(event);
        });

        if (self.beforeSubscriptionAdd)
            self.beforeSubscriptionAdd(event);

        if (!self._subscriptions[event])
            self._subscriptions[event] = [];
        self._subscriptions[event].push(subscription);

        return subscription;
    },

    "notifySubscribers": function (valueToNotify, event) {
        event = event || defaultEvent;
        if (event === defaultEvent) {
            this.updateVersion();
        }
        if (this.hasSubscriptionsForEvent(event)) {
            try {
                ko.dependencyDetection.begin(); // Begin suppressing dependency detection (by setting the top frame to undefined)
                for (var a = this._subscriptions[event].slice(0), i = 0, subscription; subscription = a[i]; ++i) {
                    // In case a subscription was disposed during the arrayForEach cycle, check
                    // for isDisposed on each subscription before invoking its callback
                    if (!subscription.isDisposed)
                        subscription.callback(valueToNotify);
                }
            } finally {
                ko.dependencyDetection.end(); // End suppressing dependency detection
            }
        }
    },

    getVersion: function () {
        return this._versionNumber;
    },

    hasChanged: function (versionToCheck) {
        return this.getVersion() !== versionToCheck;
    },

    updateVersion: function () {
        ++this._versionNumber;
    },

    limit: function(limitFunction) {
        var self = this, selfIsObservable = ko.isObservable(self),
            isPending, previousValue, pendingValue, beforeChange = 'beforeChange';

        if (!self._origNotifySubscribers) {
            self._origNotifySubscribers = self["notifySubscribers"];
            self["notifySubscribers"] = function(value, event) {
                if (!event || event === defaultEvent) {
                    self._rateLimitedChange(value);
                } else if (event === beforeChange) {
                    self._rateLimitedBeforeChange(value);
                } else {
                    self._origNotifySubscribers(value, event);
                }
            };
        }

        var finish = limitFunction(function() {
            // If an observable provided a reference to itself, access it to get the latest value.
            // This allows computed observables to delay calculating their value until needed.
            if (selfIsObservable && pendingValue === self) {
                pendingValue = self();
            }
            isPending = false;
            if (self.isDifferent(previousValue, pendingValue)) {
                self._origNotifySubscribers(previousValue = pendingValue);
            }
        });

        self._rateLimitedChange = function(value) {
            isPending = true;
            pendingValue = value;
            finish();
        };
        self._rateLimitedBeforeChange = function(value) {
            if (!isPending) {
                previousValue = value;
                self._origNotifySubscribers(value, beforeChange);
            }
        };
    },

    hasSubscriptionsForEvent: function(event) {
        return this._subscriptions[event] && this._subscriptions[event].length;
    },

    getSubscriptionsCount: function (event) {
        if (event) {
            return this._subscriptions[event] && this._subscriptions[event].length || 0;
        } else {
            var total = 0;
            ko.utils.objectForEach(this._subscriptions, function(eventName, subscriptions) {
                total += subscriptions.length;
            });
            return total;
        }
    },

    isDifferent: function(oldValue, newValue) {
        return !this['equalityComparer'] || !this['equalityComparer'](oldValue, newValue);
    },

    extend: applyExtenders
};

ko.exportProperty(ko_subscribable_fn, 'subscribe', ko_subscribable_fn.subscribe);
ko.exportProperty(ko_subscribable_fn, 'extend', ko_subscribable_fn.extend);
ko.exportProperty(ko_subscribable_fn, 'getSubscriptionsCount', ko_subscribable_fn.getSubscriptionsCount);

// For browsers that support proto assignment, we overwrite the prototype of each
// observable instance. Since observables are functions, we need Function.prototype
// to still be in the prototype chain.
if (ko.utils.canSetPrototype) {
    ko.utils.setPrototypeOf(ko_subscribable_fn, Function.prototype);
}

ko.subscribable['fn'] = ko_subscribable_fn;


ko.isSubscribable = function (instance) {
    return instance != null && typeof instance.subscribe == "function" && typeof instance["notifySubscribers"] == "function";
};

ko.exportSymbol('subscribable', ko.subscribable);
ko.exportSymbol('isSubscribable', ko.isSubscribable);

ko.computedContext = ko.dependencyDetection = (function () {
    var outerFrames = [],
        currentFrame,
        lastId = 0;

    // Return a unique ID that can be assigned to an observable for dependency tracking.
    // Theoretically, you could eventually overflow the number storage size, resulting
    // in duplicate IDs. But in JavaScript, the largest exact integral value is 2^53
    // or 9,007,199,254,740,992. If you created 1,000,000 IDs per second, it would
    // take over 285 years to reach that number.
    // Reference http://blog.vjeux.com/2010/javascript/javascript-max_int-number-limits.html
    function getId() {
        return ++lastId;
    }

    function begin(options) {
        outerFrames.push(currentFrame);
        currentFrame = options;
    }

    function end() {
        currentFrame = outerFrames.pop();
    }

    return {
        begin: begin,

        end: end,

        registerDependency: function (subscribable) {
            if (currentFrame) {
                if (!ko.isSubscribable(subscribable))
                    throw new Error("Only subscribable things can act as dependencies");
                currentFrame.callback(subscribable, subscribable._id || (subscribable._id = getId()));
            }
        },

        ignore: function (callback, callbackTarget, callbackArgs) {
            try {
                begin();
                return callback.apply(callbackTarget, callbackArgs || []);
            } finally {
                end();
            }
        },

        getDependenciesCount: function () {
            if (currentFrame)
                return currentFrame.computed.getDependenciesCount();
        },

        isInitial: function() {
            if (currentFrame)
                return currentFrame.isInitial;
        }
    };
})();

ko.exportSymbol('computedContext', ko.computedContext);
ko.exportSymbol('computedContext.getDependenciesCount', ko.computedContext.getDependenciesCount);
ko.exportSymbol('computedContext.isInitial', ko.computedContext.isInitial);
ko.exportSymbol('computedContext.isSleeping', ko.computedContext.isSleeping);

ko.exportSymbol('ignoreDependencies', ko.ignoreDependencies = ko.dependencyDetection.ignore);
ko.observable = function (initialValue) {
    var _latestValue = initialValue;

    function observable() {
        if (arguments.length > 0) {
            // Write

            // Ignore writes if the value hasn't changed
            if (observable.isDifferent(_latestValue, arguments[0])) {
                observable.valueWillMutate();
                _latestValue = arguments[0];
                if (DEBUG) observable._latestValue = _latestValue;
                observable.valueHasMutated();
            }
            return this; // Permits chained assignments
        }
        else {
            // Read
            ko.dependencyDetection.registerDependency(observable); // The caller only needs to be notified of changes if they did a "read" operation
            return _latestValue;
        }
    }
    ko.subscribable.call(observable);
    ko.utils.setPrototypeOfOrExtend(observable, ko.observable['fn']);

    if (DEBUG) observable._latestValue = _latestValue;
    observable.peek = function() { return _latestValue };
    observable.valueHasMutated = function () { observable["notifySubscribers"](_latestValue); }
    observable.valueWillMutate = function () { observable["notifySubscribers"](_latestValue, "beforeChange"); }

    ko.exportProperty(observable, 'peek', observable.peek);
    ko.exportProperty(observable, "valueHasMutated", observable.valueHasMutated);
    ko.exportProperty(observable, "valueWillMutate", observable.valueWillMutate);

    return observable;
}

ko.observable['fn'] = {
    "equalityComparer": valuesArePrimitiveAndEqual
};

var protoProperty = ko.observable.protoProperty = "__ko_proto__";
ko.observable['fn'][protoProperty] = ko.observable;

// Note that for browsers that don't support proto assignment, the
// inheritance chain is created manually in the ko.observable constructor
if (ko.utils.canSetPrototype) {
    ko.utils.setPrototypeOf(ko.observable['fn'], ko.subscribable['fn']);
}

ko.hasPrototype = function(instance, prototype) {
    if ((instance === null) || (instance === undefined) || (instance[protoProperty] === undefined)) return false;
    if (instance[protoProperty] === prototype) return true;
    return ko.hasPrototype(instance[protoProperty], prototype); // Walk the prototype chain
};

ko.isObservable = function (instance) {
    return ko.hasPrototype(instance, ko.observable);
}
ko.isWriteableObservable = function (instance) {
    // Observable
    if ((typeof instance == "function") && instance[protoProperty] === ko.observable)
        return true;
    // Writeable dependent observable
    if ((typeof instance == "function") && (instance[protoProperty] === ko.dependentObservable) && (instance.hasWriteFunction))
        return true;
    // Anything else
    return false;
}


ko.exportSymbol('observable', ko.observable);
ko.exportSymbol('isObservable', ko.isObservable);
ko.exportSymbol('isWriteableObservable', ko.isWriteableObservable);
ko.exportSymbol('isWritableObservable', ko.isWriteableObservable);
ko.observableArray = function (initialValues) {
    initialValues = initialValues || [];

    if (typeof initialValues != 'object' || !('length' in initialValues))
        throw new Error("The argument passed when initializing an observable array must be an array, or null, or undefined.");

    var result = ko.observable(initialValues);
    ko.utils.setPrototypeOfOrExtend(result, ko.observableArray['fn']);
    return result.extend({'trackArrayChanges':true});
};

ko.observableArray['fn'] = {
    'remove': function (valueOrPredicate) {
        var underlyingArray = this.peek();
        var removedValues = [];
        var predicate = typeof valueOrPredicate == "function" && !ko.isObservable(valueOrPredicate) ? valueOrPredicate : function (value) { return value === valueOrPredicate; };
        for (var i = 0; i < underlyingArray.length; i++) {
            var value = underlyingArray[i];
            if (predicate(value)) {
                if (removedValues.length === 0) {
                    this.valueWillMutate();
                }
                removedValues.push(value);
                underlyingArray.splice(i, 1);
                i--;
            }
        }
        if (removedValues.length) {
            this.valueHasMutated();
        }
        return removedValues;
    },

    'removeAll': function (arrayOfValues) {
        // If you passed zero args, we remove everything
        if (arrayOfValues === undefined) {
            var underlyingArray = this.peek();
            var allValues = underlyingArray.slice(0);
            this.valueWillMutate();
            underlyingArray.splice(0, underlyingArray.length);
            this.valueHasMutated();
            return allValues;
        }
        // If you passed an arg, we interpret it as an array of entries to remove
        if (!arrayOfValues)
            return [];
        return this['remove'](function (value) {
            return ko.utils.arrayIndexOf(arrayOfValues, value) >= 0;
        });
    },

    'destroy': function (valueOrPredicate) {
        var underlyingArray = this.peek();
        var predicate = typeof valueOrPredicate == "function" && !ko.isObservable(valueOrPredicate) ? valueOrPredicate : function (value) { return value === valueOrPredicate; };
        this.valueWillMutate();
        for (var i = underlyingArray.length - 1; i >= 0; i--) {
            var value = underlyingArray[i];
            if (predicate(value))
                underlyingArray[i]["_destroy"] = true;
        }
        this.valueHasMutated();
    },

    'destroyAll': function (arrayOfValues) {
        // If you passed zero args, we destroy everything
        if (arrayOfValues === undefined)
            return this['destroy'](function() { return true });

        // If you passed an arg, we interpret it as an array of entries to destroy
        if (!arrayOfValues)
            return [];
        return this['destroy'](function (value) {
            return ko.utils.arrayIndexOf(arrayOfValues, value) >= 0;
        });
    },

    'indexOf': function (item) {
        var underlyingArray = this();
        return ko.utils.arrayIndexOf(underlyingArray, item);
    },

    'replace': function(oldItem, newItem) {
        var index = this['indexOf'](oldItem);
        if (index >= 0) {
            this.valueWillMutate();
            this.peek()[index] = newItem;
            this.valueHasMutated();
        }
    }
};

// Populate ko.observableArray.fn with read/write functions from native arrays
// Important: Do not add any additional functions here that may reasonably be used to *read* data from the array
// because we'll eval them without causing subscriptions, so ko.computed output could end up getting stale
ko.utils.arrayForEach(["pop", "push", "reverse", "shift", "sort", "splice", "unshift"], function (methodName) {
    ko.observableArray['fn'][methodName] = function () {
        // Use "peek" to avoid creating a subscription in any computed that we're executing in the context of
        // (for consistency with mutating regular observables)
        var underlyingArray = this.peek();
        this.valueWillMutate();
        this.cacheDiffForKnownOperation(underlyingArray, methodName, arguments);
        var methodCallResult = underlyingArray[methodName].apply(underlyingArray, arguments);
        this.valueHasMutated();
        return methodCallResult;
    };
});

// Populate ko.observableArray.fn with read-only functions from native arrays
ko.utils.arrayForEach(["slice"], function (methodName) {
    ko.observableArray['fn'][methodName] = function () {
        var underlyingArray = this();
        return underlyingArray[methodName].apply(underlyingArray, arguments);
    };
});

// Note that for browsers that don't support proto assignment, the
// inheritance chain is created manually in the ko.observableArray constructor
if (ko.utils.canSetPrototype) {
    ko.utils.setPrototypeOf(ko.observableArray['fn'], ko.observable['fn']);
}

ko.exportSymbol('observableArray', ko.observableArray);
var arrayChangeEventName = 'arrayChange';
ko.extenders['trackArrayChanges'] = function(target) {
    // Only modify the target observable once
    if (target.cacheDiffForKnownOperation) {
        return;
    }
    var trackingChanges = false,
        cachedDiff = null,
        arrayChangeSubscription,
        pendingNotifications = 0,
        underlyingBeforeSubscriptionAddFunction = target.beforeSubscriptionAdd,
        underlyingAfterSubscriptionRemoveFunction = target.afterSubscriptionRemove;

    // Watch "subscribe" calls, and for array change events, ensure change tracking is enabled
    target.beforeSubscriptionAdd = function (event) {
        if (underlyingBeforeSubscriptionAddFunction)
            underlyingBeforeSubscriptionAddFunction.call(target, event);
        if (event === arrayChangeEventName) {
            trackChanges();
        }
    };
    // Watch "dispose" calls, and for array change events, ensure change tracking is disabled when all are disposed
    target.afterSubscriptionRemove = function (event) {
        if (underlyingAfterSubscriptionRemoveFunction)
            underlyingAfterSubscriptionRemoveFunction.call(target, event);
        if (event === arrayChangeEventName && !target.hasSubscriptionsForEvent(arrayChangeEventName)) {
            arrayChangeSubscription.dispose();
            trackingChanges = false;
        }
    };

    function trackChanges() {
        // Calling 'trackChanges' multiple times is the same as calling it once
        if (trackingChanges) {
            return;
        }

        trackingChanges = true;

        // Intercept "notifySubscribers" to track how many times it was called.
        var underlyingNotifySubscribersFunction = target['notifySubscribers'];
        target['notifySubscribers'] = function(valueToNotify, event) {
            if (!event || event === defaultEvent) {
                ++pendingNotifications;
            }
            return underlyingNotifySubscribersFunction.apply(this, arguments);
        };

        // Each time the array changes value, capture a clone so that on the next
        // change it's possible to produce a diff
        var previousContents = [].concat(target.peek() || []);
        cachedDiff = null;
        arrayChangeSubscription = target.subscribe(function(currentContents) {
            // Make a copy of the current contents and ensure it's an array
            currentContents = [].concat(currentContents || []);

            // Compute the diff and issue notifications, but only if someone is listening
            if (target.hasSubscriptionsForEvent(arrayChangeEventName)) {
                var changes = getChanges(previousContents, currentContents);
            }

            // Eliminate references to the old, removed items, so they can be GCed
            previousContents = currentContents;
            cachedDiff = null;
            pendingNotifications = 0;

            if (changes && changes.length) {
                target['notifySubscribers'](changes, arrayChangeEventName);
            }
        });
    }

    function getChanges(previousContents, currentContents) {
        // We try to re-use cached diffs.
        // The scenarios where pendingNotifications > 1 are when using rate-limiting or the Deferred Updates
        // plugin, which without this check would not be compatible with arrayChange notifications. Normally,
        // notifications are issued immediately so we wouldn't be queueing up more than one.
        if (!cachedDiff || pendingNotifications > 1) {
            cachedDiff = ko.utils.compareArrays(previousContents, currentContents, { 'sparse': true });
        }

        return cachedDiff;
    }

    target.cacheDiffForKnownOperation = function(rawArray, operationName, args) {
        // Only run if we're currently tracking changes for this observable array
        // and there aren't any pending deferred notifications.
        if (!trackingChanges || pendingNotifications) {
            return;
        }
        var diff = [],
            arrayLength = rawArray.length,
            argsLength = args.length,
            offset = 0;

        function pushDiff(status, value, index) {
            return diff[diff.length] = { 'status': status, 'value': value, 'index': index };
        }
        switch (operationName) {
            case 'push':
                offset = arrayLength;
            case 'unshift':
                for (var index = 0; index < argsLength; index++) {
                    pushDiff('added', args[index], offset + index);
                }
                break;

            case 'pop':
                offset = arrayLength - 1;
            case 'shift':
                if (arrayLength) {
                    pushDiff('deleted', rawArray[offset], offset);
                }
                break;

            case 'splice':
                // Negative start index means 'from end of array'. After that we clamp to [0...arrayLength].
                // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
                var startIndex = Math.min(Math.max(0, args[0] < 0 ? arrayLength + args[0] : args[0]), arrayLength),
                    endDeleteIndex = argsLength === 1 ? arrayLength : Math.min(startIndex + (args[1] || 0), arrayLength),
                    endAddIndex = startIndex + argsLength - 2,
                    endIndex = Math.max(endDeleteIndex, endAddIndex),
                    additions = [], deletions = [];
                for (var index = startIndex, argsIndex = 2; index < endIndex; ++index, ++argsIndex) {
                    if (index < endDeleteIndex)
                        deletions.push(pushDiff('deleted', rawArray[index], index));
                    if (index < endAddIndex)
                        additions.push(pushDiff('added', args[argsIndex], index));
                }
                ko.utils.findMovesInArrayComparison(deletions, additions);
                break;

            default:
                return;
        }
        cachedDiff = diff;
    };
};
ko.computed = ko.dependentObservable = function (evaluatorFunctionOrOptions, evaluatorFunctionTarget, options) {
    var _latestValue,
        _needsEvaluation = true,
        _isBeingEvaluated = false,
        _suppressDisposalUntilDisposeWhenReturnsFalse = false,
        _isDisposed = false,
        readFunction = evaluatorFunctionOrOptions,
        pure = false,
        isSleeping = false;

    if (readFunction && typeof readFunction == "object") {
        // Single-parameter syntax - everything is on this "options" param
        options = readFunction;
        readFunction = options["read"];
    } else {
        // Multi-parameter syntax - construct the options according to the params passed
        options = options || {};
        if (!readFunction)
            readFunction = options["read"];
    }
    if (typeof readFunction != "function")
        throw new Error("Pass a function that returns the value of the ko.computed");

    function addDependencyTracking(id, target, trackingObj) {
        if (pure && target === dependentObservable) {
            throw Error("A 'pure' computed must not be called recursively");
        }

        dependencyTracking[id] = trackingObj;
        trackingObj._order = _dependenciesCount++;
        trackingObj._version = target.getVersion();
    }

    function haveDependenciesChanged() {
        var id, dependency;
        for (id in dependencyTracking) {
            if (dependencyTracking.hasOwnProperty(id)) {
                dependency = dependencyTracking[id];
                if (dependency._target.hasChanged(dependency._version)) {
                    return true;
                }
            }
        }
    }

    function disposeComputed() {
        if (!isSleeping && dependencyTracking) {
            ko.utils.objectForEach(dependencyTracking, function (id, dependency) {
                if (dependency.dispose)
                    dependency.dispose();
            });
        }
        dependencyTracking = null;
        _dependenciesCount = 0;
        _isDisposed = true;
        _needsEvaluation = false;
        isSleeping = false;
    }

    function evaluatePossiblyAsync() {
        var throttleEvaluationTimeout = dependentObservable['throttleEvaluation'];
        if (throttleEvaluationTimeout && throttleEvaluationTimeout >= 0) {
            clearTimeout(evaluationTimeoutInstance);
            evaluationTimeoutInstance = setTimeout(function () {
                evaluateImmediate(true /*notifyChange*/);
            }, throttleEvaluationTimeout);
        } else if (dependentObservable._evalRateLimited) {
            dependentObservable._evalRateLimited();
        } else {
            evaluateImmediate(true /*notifyChange*/);
        }
    }

    function evaluateImmediate(notifyChange) {
        if (_isBeingEvaluated) {
            // If the evaluation of a ko.computed causes side effects, it's possible that it will trigger its own re-evaluation.
            // This is not desirable (it's hard for a developer to realise a chain of dependencies might cause this, and they almost
            // certainly didn't intend infinite re-evaluations). So, for predictability, we simply prevent ko.computeds from causing
            // their own re-evaluation. Further discussion at https://github.com/SteveSanderson/knockout/pull/387
            return;
        }

        // Do not evaluate (and possibly capture new dependencies) if disposed
        if (_isDisposed) {
            return;
        }

        if (disposeWhen && disposeWhen()) {
            // See comment below about _suppressDisposalUntilDisposeWhenReturnsFalse
            if (!_suppressDisposalUntilDisposeWhenReturnsFalse) {
                dispose();
                return;
            }
        } else {
            // It just did return false, so we can stop suppressing now
            _suppressDisposalUntilDisposeWhenReturnsFalse = false;
        }

        _isBeingEvaluated = true;

        try {
            // Initially, we assume that none of the subscriptions are still being used (i.e., all are candidates for disposal).
            // Then, during evaluation, we cross off any that are in fact still being used.
            var disposalCandidates = dependencyTracking,
                disposalCount = _dependenciesCount,
                isInitial = pure ? undefined : !_dependenciesCount;   // If we're evaluating when there are no previous dependencies, it must be the first time

            ko.dependencyDetection.begin({
                callback: function(subscribable, id) {
                    if (!_isDisposed) {
                        if (disposalCount && disposalCandidates[id]) {
                            // Don't want to dispose this subscription, as it's still being used
                            addDependencyTracking(id, subscribable, disposalCandidates[id]);
                            delete disposalCandidates[id];
                            --disposalCount;
                        } else if (!dependencyTracking[id]) {
                            // Brand new subscription - add it
                            addDependencyTracking(id, subscribable, isSleeping ? { _target: subscribable } : subscribable.subscribe(evaluatePossiblyAsync));
                        }
                    }
                },
                computed: dependentObservable,
                isInitial: isInitial
            });

            dependencyTracking = {};
            _dependenciesCount = 0;

            try {
                var newValue = evaluatorFunctionTarget ? readFunction.call(evaluatorFunctionTarget) : readFunction();

            } finally {
                ko.dependencyDetection.end();

                // For each subscription no longer being used, remove it from the active subscriptions list and dispose it
                if (disposalCount && !isSleeping) {
                    ko.utils.objectForEach(disposalCandidates, function(id, toDispose) {
                        if (toDispose.dispose)
                            toDispose.dispose();
                    });
                }

                _needsEvaluation = false;
            }

            if (dependentObservable.isDifferent(_latestValue, newValue)) {
                if (!isSleeping) {
                    notify(_latestValue, "beforeChange");
                }

                _latestValue = newValue;
                if (DEBUG) dependentObservable._latestValue = _latestValue;

                if (isSleeping) {
                    dependentObservable.updateVersion();
                } else if (notifyChange) {
                    notify(_latestValue);
                }
            }

            if (isInitial) {
                notify(_latestValue, "awake");
            }
        } finally {
            _isBeingEvaluated = false;
        }

        if (!_dependenciesCount)
            dispose();
    }

    function dependentObservable() {
        if (arguments.length > 0) {
            if (typeof writeFunction === "function") {
                // Writing a value
                writeFunction.apply(evaluatorFunctionTarget, arguments);
            } else {
                throw new Error("Cannot write a value to a ko.computed unless you specify a 'write' option. If you wish to read the current value, don't pass any parameters.");
            }
            return this; // Permits chained assignments
        } else {
            // Reading the value
            ko.dependencyDetection.registerDependency(dependentObservable);
            if (_needsEvaluation || (isSleeping && haveDependenciesChanged())) {
                evaluateImmediate();
            }
            return _latestValue;
        }
    }

    function peek() {
        // Peek won't re-evaluate, except while the computed is sleeping or to get the initial value when "deferEvaluation" is set.
        if ((_needsEvaluation && !_dependenciesCount) || (isSleeping && haveDependenciesChanged())) {
            evaluateImmediate();
        }
        return _latestValue;
    }

    function isActive() {
        return _needsEvaluation || _dependenciesCount > 0;
    }

    function notify(value, event) {
        dependentObservable["notifySubscribers"](value, event);
    }

    // By here, "options" is always non-null
    var writeFunction = options["write"],
        disposeWhenNodeIsRemoved = options["disposeWhenNodeIsRemoved"] || options.disposeWhenNodeIsRemoved || null,
        disposeWhenOption = options["disposeWhen"] || options.disposeWhen,
        disposeWhen = disposeWhenOption,
        dispose = disposeComputed,
        dependencyTracking = {},
        _dependenciesCount = 0,
        evaluationTimeoutInstance = null;

    if (!evaluatorFunctionTarget)
        evaluatorFunctionTarget = options["owner"];

    ko.subscribable.call(dependentObservable);
    ko.utils.setPrototypeOfOrExtend(dependentObservable, ko.dependentObservable['fn']);

    dependentObservable.peek = peek;
    dependentObservable.getDependenciesCount = function () { return _dependenciesCount; };
    dependentObservable.hasWriteFunction = typeof writeFunction === "function";
    dependentObservable.dispose = function () { dispose(); };
    dependentObservable.isActive = isActive;

    // Replace the limit function with one that delays evaluation as well.
    var originalLimit = dependentObservable.limit;
    dependentObservable.limit = function(limitFunction) {
        originalLimit.call(dependentObservable, limitFunction);
        dependentObservable._evalRateLimited = function() {
            dependentObservable._rateLimitedBeforeChange(_latestValue);

            _needsEvaluation = true;    // Mark as dirty

            // Pass the observable to the rate-limit code, which will access it when
            // it's time to do the notification.
            dependentObservable._rateLimitedChange(dependentObservable);
        }
    };

    if (options['pure']) {
        pure = true;
        isSleeping = true;     // Starts off sleeping; will awake on the first subscription
        dependentObservable.beforeSubscriptionAdd = function (event) {
            // If asleep, wake up the computed by subscribing to any dependencies.
            if (!_isDisposed && isSleeping && event == 'change') {
                isSleeping = false;
                if (_needsEvaluation || haveDependenciesChanged()) {
                    dependencyTracking = null;
                    _dependenciesCount = 0;
                    _needsEvaluation = true;
                    evaluateImmediate();
                } else {
                    // First put the dependencies in order
                    var dependeciesOrder = [];
                    ko.utils.objectForEach(dependencyTracking, function (id, dependency) {
                        dependeciesOrder[dependency._order] = id;
                    });
                    // Next, subscribe to each one
                    ko.utils.arrayForEach(dependeciesOrder, function(id, order) {
                        var dependency = dependencyTracking[id],
                            subscription = dependency._target.subscribe(evaluatePossiblyAsync);
                        subscription._order = order;
                        subscription._version = dependency._version;
                        dependencyTracking[id] = subscription;
                    });
                }
                if (!_isDisposed) {     // test since evaluating could trigger disposal
                    notify(_latestValue, "awake");
                }
            }
        };

        dependentObservable.afterSubscriptionRemove = function (event) {
            if (!_isDisposed && event == 'change' && !dependentObservable.hasSubscriptionsForEvent('change')) {
                ko.utils.objectForEach(dependencyTracking, function (id, dependency) {
                    if (dependency.dispose) {
                        dependencyTracking[id] = {
                            _target: dependency._target,
                            _order: dependency._order,
                            _version: dependency._version
                        };
                        dependency.dispose();
                    }
                });
                isSleeping = true;
                notify(undefined, "asleep");
            }
        };

        // Because a pure computed is not automatically updated while it is sleeping, we can't
        // simply return the version number. Instead, we check if any of the dependencies have
        // changed and conditionally re-evaluate the computed observable.
        dependentObservable._originalGetVersion = dependentObservable.getVersion;
        dependentObservable.getVersion = function () {
            if (isSleeping && (_needsEvaluation || haveDependenciesChanged())) {
                evaluateImmediate();
            }
            return dependentObservable._originalGetVersion();
        };
    } else if (options['deferEvaluation']) {
        // This will force a computed with deferEvaluation to evaluate when the first subscriptions is registered.
        dependentObservable.beforeSubscriptionAdd = function (event) {
            if (event == 'change' || event == 'beforeChange') {
                peek();
            }
        }
    }

    ko.exportProperty(dependentObservable, 'peek', dependentObservable.peek);
    ko.exportProperty(dependentObservable, 'dispose', dependentObservable.dispose);
    ko.exportProperty(dependentObservable, 'isActive', dependentObservable.isActive);
    ko.exportProperty(dependentObservable, 'getDependenciesCount', dependentObservable.getDependenciesCount);

    // Add a "disposeWhen" callback that, on each evaluation, disposes if the node was removed without using ko.removeNode.
    if (disposeWhenNodeIsRemoved) {
        // Since this computed is associated with a DOM node, and we don't want to dispose the computed
        // until the DOM node is *removed* from the document (as opposed to never having been in the document),
        // we'll prevent disposal until "disposeWhen" first returns false.
        _suppressDisposalUntilDisposeWhenReturnsFalse = true;

        // Only watch for the node's disposal if the value really is a node. It might not be,
        // e.g., { disposeWhenNodeIsRemoved: true } can be used to opt into the "only dispose
        // after first false result" behaviour even if there's no specific node to watch. This
        // technique is intended for KO's internal use only and shouldn't be documented or used
        // by application code, as it's likely to change in a future version of KO.
        if (disposeWhenNodeIsRemoved.nodeType) {
            disposeWhen = function () {
                return !ko.utils.domNodeIsAttachedToDocument(disposeWhenNodeIsRemoved) || (disposeWhenOption && disposeWhenOption());
            };
        }
    }

    // Evaluate, unless sleeping or deferEvaluation is true
    if (!isSleeping && !options['deferEvaluation'])
        evaluateImmediate();

    // Attach a DOM node disposal callback so that the computed will be proactively disposed as soon as the node is
    // removed using ko.removeNode. But skip if isActive is false (there will never be any dependencies to dispose).
    if (disposeWhenNodeIsRemoved && isActive() && disposeWhenNodeIsRemoved.nodeType) {
        dispose = function() {
            ko.utils.domNodeDisposal.removeDisposeCallback(disposeWhenNodeIsRemoved, dispose);
            disposeComputed();
        };
        ko.utils.domNodeDisposal.addDisposeCallback(disposeWhenNodeIsRemoved, dispose);
    }

    return dependentObservable;
};

ko.isComputed = function(instance) {
    return ko.hasPrototype(instance, ko.dependentObservable);
};

var protoProp = ko.observable.protoProperty; // == "__ko_proto__"
ko.dependentObservable[protoProp] = ko.observable;

ko.dependentObservable['fn'] = {
    "equalityComparer": valuesArePrimitiveAndEqual
};
ko.dependentObservable['fn'][protoProp] = ko.dependentObservable;

// Note that for browsers that don't support proto assignment, the
// inheritance chain is created manually in the ko.dependentObservable constructor
if (ko.utils.canSetPrototype) {
    ko.utils.setPrototypeOf(ko.dependentObservable['fn'], ko.subscribable['fn']);
}

ko.exportSymbol('dependentObservable', ko.dependentObservable);
ko.exportSymbol('computed', ko.dependentObservable); // Make "ko.computed" an alias for "ko.dependentObservable"
ko.exportSymbol('isComputed', ko.isComputed);

ko.pureComputed = function (evaluatorFunctionOrOptions, evaluatorFunctionTarget) {
    if (typeof evaluatorFunctionOrOptions === 'function') {
        return ko.computed(evaluatorFunctionOrOptions, evaluatorFunctionTarget, {'pure':true});
    } else {
        evaluatorFunctionOrOptions = ko.utils.extend({}, evaluatorFunctionOrOptions);   // make a copy of the parameter object
        evaluatorFunctionOrOptions['pure'] = true;
        return ko.computed(evaluatorFunctionOrOptions, evaluatorFunctionTarget);
    }
}
ko.exportSymbol('pureComputed', ko.pureComputed);

(function() {
    var maxNestedObservableDepth = 10; // Escape the (unlikely) pathalogical case where an observable's current value is itself (or similar reference cycle)

    ko.toJS = function(rootObject) {
        if (arguments.length == 0)
            throw new Error("When calling ko.toJS, pass the object you want to convert.");

        // We just unwrap everything at every level in the object graph
        return mapJsObjectGraph(rootObject, function(valueToMap) {
            // Loop because an observable's value might in turn be another observable wrapper
            for (var i = 0; ko.isObservable(valueToMap) && (i < maxNestedObservableDepth); i++)
                valueToMap = valueToMap();
            return valueToMap;
        });
    };

    ko.toJSON = function(rootObject, replacer, space) {     // replacer and space are optional
        var plainJavaScriptObject = ko.toJS(rootObject);
        return ko.utils.stringifyJson(plainJavaScriptObject, replacer, space);
    };

    function mapJsObjectGraph(rootObject, mapInputCallback, visitedObjects) {
        visitedObjects = visitedObjects || new objectLookup();

        rootObject = mapInputCallback(rootObject);
        var canHaveProperties = (typeof rootObject == "object") && (rootObject !== null) && (rootObject !== undefined) && (!(rootObject instanceof Date)) && (!(rootObject instanceof String)) && (!(rootObject instanceof Number)) && (!(rootObject instanceof Boolean));
        if (!canHaveProperties)
            return rootObject;

        var outputProperties = rootObject instanceof Array ? [] : {};
        visitedObjects.save(rootObject, outputProperties);

        visitPropertiesOrArrayEntries(rootObject, function(indexer) {
            var propertyValue = mapInputCallback(rootObject[indexer]);

            switch (typeof propertyValue) {
                case "boolean":
                case "number":
                case "string":
                case "function":
                    outputProperties[indexer] = propertyValue;
                    break;
                case "object":
                case "undefined":
                    var previouslyMappedValue = visitedObjects.get(propertyValue);
                    outputProperties[indexer] = (previouslyMappedValue !== undefined)
                        ? previouslyMappedValue
                        : mapJsObjectGraph(propertyValue, mapInputCallback, visitedObjects);
                    break;
            }
        });

        return outputProperties;
    }

    function visitPropertiesOrArrayEntries(rootObject, visitorCallback) {
        if (rootObject instanceof Array) {
            for (var i = 0; i < rootObject.length; i++)
                visitorCallback(i);

            // For arrays, also respect toJSON property for custom mappings (fixes #278)
            if (typeof rootObject['toJSON'] == 'function')
                visitorCallback('toJSON');
        } else {
            for (var propertyName in rootObject) {
                visitorCallback(propertyName);
            }
        }
    };

    function objectLookup() {
        this.keys = [];
        this.values = [];
    };

    objectLookup.prototype = {
        constructor: objectLookup,
        save: function(key, value) {
            var existingIndex = ko.utils.arrayIndexOf(this.keys, key);
            if (existingIndex >= 0)
                this.values[existingIndex] = value;
            else {
                this.keys.push(key);
                this.values.push(value);
            }
        },
        get: function(key) {
            var existingIndex = ko.utils.arrayIndexOf(this.keys, key);
            return (existingIndex >= 0) ? this.values[existingIndex] : undefined;
        }
    };
})();

ko.exportSymbol('toJS', ko.toJS);
ko.exportSymbol('toJSON', ko.toJSON);
(function () {
    var hasDomDataExpandoProperty = '__ko__hasDomDataOptionValue__';

    // Normally, SELECT elements and their OPTIONs can only take value of type 'string' (because the values
    // are stored on DOM attributes). ko.selectExtensions provides a way for SELECTs/OPTIONs to have values
    // that are arbitrary objects. This is very convenient when implementing things like cascading dropdowns.
    ko.selectExtensions = {
        readValue : function(element) {
            switch (ko.utils.tagNameLower(element)) {
                case 'option':
                    if (element[hasDomDataExpandoProperty] === true)
                        return ko.utils.domData.get(element, ko.bindingHandlers.options.optionValueDomDataKey);
                    return ko.utils.ieVersion <= 7
                        ? (element.getAttributeNode('value') && element.getAttributeNode('value').specified ? element.value : element.text)
                        : element.value;
                case 'select':
                    return element.selectedIndex >= 0 ? ko.selectExtensions.readValue(element.options[element.selectedIndex]) : undefined;
                default:
                    return element.value;
            }
        },

        writeValue: function(element, value, allowUnset) {
            switch (ko.utils.tagNameLower(element)) {
                case 'option':
                    switch(typeof value) {
                        case "string":
                            ko.utils.domData.set(element, ko.bindingHandlers.options.optionValueDomDataKey, undefined);
                            if (hasDomDataExpandoProperty in element) { // IE <= 8 throws errors if you delete non-existent properties from a DOM node
                                delete element[hasDomDataExpandoProperty];
                            }
                            element.value = value;
                            break;
                        default:
                            // Store arbitrary object using DomData
                            ko.utils.domData.set(element, ko.bindingHandlers.options.optionValueDomDataKey, value);
                            element[hasDomDataExpandoProperty] = true;

                            // Special treatment of numbers is just for backward compatibility. KO 1.2.1 wrote numerical values to element.value.
                            element.value = typeof value === "number" ? value : "";
                            break;
                    }
                    break;
                case 'select':
                    if (value === "" || value === null)       // A blank string or null value will select the caption
                        value = undefined;
                    var selection = -1;
                    for (var i = 0, n = element.options.length, optionValue; i < n; ++i) {
                        optionValue = ko.selectExtensions.readValue(element.options[i]);
                        // Include special check to handle selecting a caption with a blank string value
                        if (optionValue == value || (optionValue == "" && value === undefined)) {
                            selection = i;
                            break;
                        }
                    }
                    if (allowUnset || selection >= 0 || (value === undefined && element.size > 1)) {
                        element.selectedIndex = selection;
                    }
                    break;
                default:
                    if ((value === null) || (value === undefined))
                        value = "";
                    element.value = value;
                    break;
            }
        }
    };
})();

ko.exportSymbol('selectExtensions', ko.selectExtensions);
ko.exportSymbol('selectExtensions.readValue', ko.selectExtensions.readValue);
ko.exportSymbol('selectExtensions.writeValue', ko.selectExtensions.writeValue);
ko.expressionRewriting = (function () {
    var javaScriptReservedWords = ["true", "false", "null", "undefined"];

    // Matches something that can be assigned to--either an isolated identifier or something ending with a property accessor
    // This is designed to be simple and avoid false negatives, but could produce false positives (e.g., a+b.c).
    // This also will not properly handle nested brackets (e.g., obj1[obj2['prop']]; see #911).
    var javaScriptAssignmentTarget = /^(?:[$_a-z][$\w]*|(.+)(\.\s*[$_a-z][$\w]*|\[.+\]))$/i;

    function getWriteableValue(expression) {
        if (ko.utils.arrayIndexOf(javaScriptReservedWords, expression) >= 0)
            return false;
        var match = expression.match(javaScriptAssignmentTarget);
        return match === null ? false : match[1] ? ('Object(' + match[1] + ')' + match[2]) : expression;
    }

    // The following regular expressions will be used to split an object-literal string into tokens

        // These two match strings, either with double quotes or single quotes
    var stringDouble = '"(?:[^"\\\\]|\\\\.)*"',
        stringSingle = "'(?:[^'\\\\]|\\\\.)*'",
        // Matches a regular expression (text enclosed by slashes), but will also match sets of divisions
        // as a regular expression (this is handled by the parsing loop below).
        stringRegexp = '/(?:[^/\\\\]|\\\\.)*/\w*',
        // These characters have special meaning to the parser and must not appear in the middle of a
        // token, except as part of a string.
        specials = ',"\'{}()/:[\\]',
        // Match text (at least two characters) that does not contain any of the above special characters,
        // although some of the special characters are allowed to start it (all but the colon and comma).
        // The text can contain spaces, but leading or trailing spaces are skipped.
        everyThingElse = '[^\\s:,/][^' + specials + ']*[^\\s' + specials + ']',
        // Match any non-space character not matched already. This will match colons and commas, since they're
        // not matched by "everyThingElse", but will also match any other single character that wasn't already
        // matched (for example: in "a: 1, b: 2", each of the non-space characters will be matched by oneNotSpace).
        oneNotSpace = '[^\\s]',

        // Create the actual regular expression by or-ing the above strings. The order is important.
        bindingToken = RegExp(stringDouble + '|' + stringSingle + '|' + stringRegexp + '|' + everyThingElse + '|' + oneNotSpace, 'g'),

        // Match end of previous token to determine whether a slash is a division or regex.
        divisionLookBehind = /[\])"'A-Za-z0-9_$]+$/,
        keywordRegexLookBehind = {'in':1,'return':1,'typeof':1};

    function parseObjectLiteral(objectLiteralString) {
        // Trim leading and trailing spaces from the string
        var str = ko.utils.stringTrim(objectLiteralString);

        // Trim braces '{' surrounding the whole object literal
        if (str.charCodeAt(0) === 123) str = str.slice(1, -1);

        // Split into tokens
        var result = [], toks = str.match(bindingToken), key, values = [], depth = 0;

        if (toks) {
            // Append a comma so that we don't need a separate code block to deal with the last item
            toks.push(',');

            for (var i = 0, tok; tok = toks[i]; ++i) {
                var c = tok.charCodeAt(0);
                // A comma signals the end of a key/value pair if depth is zero
                if (c === 44) { // ","
                    if (depth <= 0) {
                        result.push((key && values.length) ? {key: key, value: values.join('')} : {'unknown': key || values.join('')});
                        key = depth = 0;
                        values = [];
                        continue;
                    }
                // Simply skip the colon that separates the name and value
                } else if (c === 58) { // ":"
                    if (!depth && !key && values.length === 1) {
                        key = values.pop();
                        continue;
                    }
                // A set of slashes is initially matched as a regular expression, but could be division
                } else if (c === 47 && i && tok.length > 1) {  // "/"
                    // Look at the end of the previous token to determine if the slash is actually division
                    var match = toks[i-1].match(divisionLookBehind);
                    if (match && !keywordRegexLookBehind[match[0]]) {
                        // The slash is actually a division punctuator; re-parse the remainder of the string (not including the slash)
                        str = str.substr(str.indexOf(tok) + 1);
                        toks = str.match(bindingToken);
                        toks.push(',');
                        i = -1;
                        // Continue with just the slash
                        tok = '/';
                    }
                // Increment depth for parentheses, braces, and brackets so that interior commas are ignored
                } else if (c === 40 || c === 123 || c === 91) { // '(', '{', '['
                    ++depth;
                } else if (c === 41 || c === 125 || c === 93) { // ')', '}', ']'
                    --depth;
                // The key will be the first token; if it's a string, trim the quotes
                } else if (!key && !values.length && (c === 34 || c === 39)) { // '"', "'"
                    tok = tok.slice(1, -1);
                }
                values.push(tok);
            }
        }
        return result;
    }

    // Two-way bindings include a write function that allow the handler to update the value even if it's not an observable.
    var twoWayBindings = {};

    function preProcessBindings(bindingsStringOrKeyValueArray, bindingOptions) {
        bindingOptions = bindingOptions || {};

        function processKeyValue(key, val) {
            var writableVal;
            function callPreprocessHook(obj) {
                return (obj && obj['preprocess']) ? (val = obj['preprocess'](val, key, processKeyValue)) : true;
            }
            if (!bindingParams) {
                if (!callPreprocessHook(ko['getBindingHandler'](key)))
                    return;

                if (twoWayBindings[key] && (writableVal = getWriteableValue(val))) {
                    // For two-way bindings, provide a write method in case the value
                    // isn't a writable observable.
                    propertyAccessorResultStrings.push("'" + key + "':function(_z){" + writableVal + "=_z}");
                }
            }
            // Values are wrapped in a function so that each value can be accessed independently
            if (makeValueAccessors) {
                val = 'function(){return ' + val + ' }';
            }
            resultStrings.push("'" + key + "':" + val);
        }

        var resultStrings = [],
            propertyAccessorResultStrings = [],
            makeValueAccessors = bindingOptions['valueAccessors'],
            bindingParams = bindingOptions['bindingParams'],
            keyValueArray = typeof bindingsStringOrKeyValueArray === "string" ?
                parseObjectLiteral(bindingsStringOrKeyValueArray) : bindingsStringOrKeyValueArray;

        ko.utils.arrayForEach(keyValueArray, function(keyValue) {
            processKeyValue(keyValue.key || keyValue['unknown'], keyValue.value);
        });

        if (propertyAccessorResultStrings.length)
            processKeyValue('_ko_property_writers', "{" + propertyAccessorResultStrings.join(",") + " }");

        return resultStrings.join(",");
    }

    return {
        bindingRewriteValidators: [],

        twoWayBindings: twoWayBindings,

        parseObjectLiteral: parseObjectLiteral,

        preProcessBindings: preProcessBindings,

        keyValueArrayContainsKey: function(keyValueArray, key) {
            for (var i = 0; i < keyValueArray.length; i++)
                if (keyValueArray[i]['key'] == key)
                    return true;
            return false;
        },

        // Internal, private KO utility for updating model properties from within bindings
        // property:            If the property being updated is (or might be) an observable, pass it here
        //                      If it turns out to be a writable observable, it will be written to directly
        // allBindings:         An object with a get method to retrieve bindings in the current execution context.
        //                      This will be searched for a '_ko_property_writers' property in case you're writing to a non-observable
        // key:                 The key identifying the property to be written. Example: for { hasFocus: myValue }, write to 'myValue' by specifying the key 'hasFocus'
        // value:               The value to be written
        // checkIfDifferent:    If true, and if the property being written is a writable observable, the value will only be written if
        //                      it is !== existing value on that writable observable
        writeValueToProperty: function(property, allBindings, key, value, checkIfDifferent) {
            if (!property || !ko.isObservable(property)) {
                var propWriters = allBindings.get('_ko_property_writers');
                if (propWriters && propWriters[key])
                    propWriters[key](value);
            } else if (ko.isWriteableObservable(property) && (!checkIfDifferent || property.peek() !== value)) {
                property(value);
            }
        }
    };
})();

ko.exportSymbol('expressionRewriting', ko.expressionRewriting);
ko.exportSymbol('expressionRewriting.bindingRewriteValidators', ko.expressionRewriting.bindingRewriteValidators);
ko.exportSymbol('expressionRewriting.parseObjectLiteral', ko.expressionRewriting.parseObjectLiteral);
ko.exportSymbol('expressionRewriting.preProcessBindings', ko.expressionRewriting.preProcessBindings);

// Making bindings explicitly declare themselves as "two way" isn't ideal in the long term (it would be better if
// all bindings could use an official 'property writer' API without needing to declare that they might). However,
// since this is not, and has never been, a public API (_ko_property_writers was never documented), it's acceptable
// as an internal implementation detail in the short term.
// For those developers who rely on _ko_property_writers in their custom bindings, we expose _twoWayBindings as an
// undocumented feature that makes it relatively easy to upgrade to KO 3.0. However, this is still not an official
// public API, and we reserve the right to remove it at any time if we create a real public property writers API.
ko.exportSymbol('expressionRewriting._twoWayBindings', ko.expressionRewriting.twoWayBindings);

// For backward compatibility, define the following aliases. (Previously, these function names were misleading because
// they referred to JSON specifically, even though they actually work with arbitrary JavaScript object literal expressions.)
ko.exportSymbol('jsonExpressionRewriting', ko.expressionRewriting);
ko.exportSymbol('jsonExpressionRewriting.insertPropertyAccessorsIntoJson', ko.expressionRewriting.preProcessBindings);
(function() {
    // "Virtual elements" is an abstraction on top of the usual DOM API which understands the notion that comment nodes
    // may be used to represent hierarchy (in addition to the DOM's natural hierarchy).
    // If you call the DOM-manipulating functions on ko.virtualElements, you will be able to read and write the state
    // of that virtual hierarchy
    //
    // The point of all this is to support containerless templates (e.g., <!-- ko foreach:someCollection -->blah<!-- /ko -->)
    // without having to scatter special cases all over the binding and templating code.

    // IE 9 cannot reliably read the "nodeValue" property of a comment node (see https://github.com/SteveSanderson/knockout/issues/186)
    // but it does give them a nonstandard alternative property called "text" that it can read reliably. Other browsers don't have that property.
    // So, use node.text where available, and node.nodeValue elsewhere
    var commentNodesHaveTextProperty = document && document.createComment("test").text === "<!--test-->";

    var startCommentRegex = commentNodesHaveTextProperty ? /^<!--\s*ko(?:\s+([\s\S]+))?\s*-->$/ : /^\s*ko(?:\s+([\s\S]+))?\s*$/;
    var endCommentRegex =   commentNodesHaveTextProperty ? /^<!--\s*\/ko\s*-->$/ : /^\s*\/ko\s*$/;
    var htmlTagsWithOptionallyClosingChildren = { 'ul': true, 'ol': true };

    function isStartComment(node) {
        return (node.nodeType == 8) && startCommentRegex.test(commentNodesHaveTextProperty ? node.text : node.nodeValue);
    }

    function isEndComment(node) {
        return (node.nodeType == 8) && endCommentRegex.test(commentNodesHaveTextProperty ? node.text : node.nodeValue);
    }

    function getVirtualChildren(startComment, allowUnbalanced) {
        var currentNode = startComment;
        var depth = 1;
        var children = [];
        while (currentNode = currentNode.nextSibling) {
            if (isEndComment(currentNode)) {
                depth--;
                if (depth === 0)
                    return children;
            }

            children.push(currentNode);

            if (isStartComment(currentNode))
                depth++;
        }
        if (!allowUnbalanced)
            throw new Error("Cannot find closing comment tag to match: " + startComment.nodeValue);
        return null;
    }

    function getMatchingEndComment(startComment, allowUnbalanced) {
        var allVirtualChildren = getVirtualChildren(startComment, allowUnbalanced);
        if (allVirtualChildren) {
            if (allVirtualChildren.length > 0)
                return allVirtualChildren[allVirtualChildren.length - 1].nextSibling;
            return startComment.nextSibling;
        } else
            return null; // Must have no matching end comment, and allowUnbalanced is true
    }

    function getUnbalancedChildTags(node) {
        // e.g., from <div>OK</div><!-- ko blah --><span>Another</span>, returns: <!-- ko blah --><span>Another</span>
        //       from <div>OK</div><!-- /ko --><!-- /ko -->,             returns: <!-- /ko --><!-- /ko -->
        var childNode = node.firstChild, captureRemaining = null;
        if (childNode) {
            do {
                if (captureRemaining)                   // We already hit an unbalanced node and are now just scooping up all subsequent nodes
                    captureRemaining.push(childNode);
                else if (isStartComment(childNode)) {
                    var matchingEndComment = getMatchingEndComment(childNode, /* allowUnbalanced: */ true);
                    if (matchingEndComment)             // It's a balanced tag, so skip immediately to the end of this virtual set
                        childNode = matchingEndComment;
                    else
                        captureRemaining = [childNode]; // It's unbalanced, so start capturing from this point
                } else if (isEndComment(childNode)) {
                    captureRemaining = [childNode];     // It's unbalanced (if it wasn't, we'd have skipped over it already), so start capturing
                }
            } while (childNode = childNode.nextSibling);
        }
        return captureRemaining;
    }

    ko.virtualElements = {
        allowedBindings: {},

        childNodes: function(node) {
            return isStartComment(node) ? getVirtualChildren(node) : node.childNodes;
        },

        emptyNode: function(node) {
            if (!isStartComment(node))
                ko.utils.emptyDomNode(node);
            else {
                var virtualChildren = ko.virtualElements.childNodes(node);
                for (var i = 0, j = virtualChildren.length; i < j; i++)
                    ko.removeNode(virtualChildren[i]);
            }
        },

        setDomNodeChildren: function(node, childNodes) {
            if (!isStartComment(node))
                ko.utils.setDomNodeChildren(node, childNodes);
            else {
                ko.virtualElements.emptyNode(node);
                var endCommentNode = node.nextSibling; // Must be the next sibling, as we just emptied the children
                for (var i = 0, j = childNodes.length; i < j; i++)
                    endCommentNode.parentNode.insertBefore(childNodes[i], endCommentNode);
            }
        },

        prepend: function(containerNode, nodeToPrepend) {
            if (!isStartComment(containerNode)) {
                if (containerNode.firstChild)
                    containerNode.insertBefore(nodeToPrepend, containerNode.firstChild);
                else
                    containerNode.appendChild(nodeToPrepend);
            } else {
                // Start comments must always have a parent and at least one following sibling (the end comment)
                containerNode.parentNode.insertBefore(nodeToPrepend, containerNode.nextSibling);
            }
        },

        insertAfter: function(containerNode, nodeToInsert, insertAfterNode) {
            if (!insertAfterNode) {
                ko.virtualElements.prepend(containerNode, nodeToInsert);
            } else if (!isStartComment(containerNode)) {
                // Insert after insertion point
                if (insertAfterNode.nextSibling)
                    containerNode.insertBefore(nodeToInsert, insertAfterNode.nextSibling);
                else
                    containerNode.appendChild(nodeToInsert);
            } else {
                // Children of start comments must always have a parent and at least one following sibling (the end comment)
                containerNode.parentNode.insertBefore(nodeToInsert, insertAfterNode.nextSibling);
            }
        },

        firstChild: function(node) {
            if (!isStartComment(node))
                return node.firstChild;
            if (!node.nextSibling || isEndComment(node.nextSibling))
                return null;
            return node.nextSibling;
        },

        nextSibling: function(node) {
            if (isStartComment(node))
                node = getMatchingEndComment(node);
            if (node.nextSibling && isEndComment(node.nextSibling))
                return null;
            return node.nextSibling;
        },

        hasBindingValue: isStartComment,

        virtualNodeBindingValue: function(node) {
            var regexMatch = (commentNodesHaveTextProperty ? node.text : node.nodeValue).match(startCommentRegex);
            return regexMatch ? regexMatch[1] : null;
        },

        normaliseVirtualElementDomStructure: function(elementVerified) {
            // Workaround for https://github.com/SteveSanderson/knockout/issues/155
            // (IE <= 8 or IE 9 quirks mode parses your HTML weirdly, treating closing </li> tags as if they don't exist, thereby moving comment nodes
            // that are direct descendants of <ul> into the preceding <li>)
            if (!htmlTagsWithOptionallyClosingChildren[ko.utils.tagNameLower(elementVerified)])
                return;

            // Scan immediate children to see if they contain unbalanced comment tags. If they do, those comment tags
            // must be intended to appear *after* that child, so move them there.
            var childNode = elementVerified.firstChild;
            if (childNode) {
                do {
                    if (childNode.nodeType === 1) {
                        var unbalancedTags = getUnbalancedChildTags(childNode);
                        if (unbalancedTags) {
                            // Fix up the DOM by moving the unbalanced tags to where they most likely were intended to be placed - *after* the child
                            var nodeToInsertBefore = childNode.nextSibling;
                            for (var i = 0; i < unbalancedTags.length; i++) {
                                if (nodeToInsertBefore)
                                    elementVerified.insertBefore(unbalancedTags[i], nodeToInsertBefore);
                                else
                                    elementVerified.appendChild(unbalancedTags[i]);
                            }
                        }
                    }
                } while (childNode = childNode.nextSibling);
            }
        }
    };
})();
ko.exportSymbol('virtualElements', ko.virtualElements);
ko.exportSymbol('virtualElements.allowedBindings', ko.virtualElements.allowedBindings);
ko.exportSymbol('virtualElements.emptyNode', ko.virtualElements.emptyNode);
//ko.exportSymbol('virtualElements.firstChild', ko.virtualElements.firstChild);     // firstChild is not minified
ko.exportSymbol('virtualElements.insertAfter', ko.virtualElements.insertAfter);
//ko.exportSymbol('virtualElements.nextSibling', ko.virtualElements.nextSibling);   // nextSibling is not minified
ko.exportSymbol('virtualElements.prepend', ko.virtualElements.prepend);
ko.exportSymbol('virtualElements.setDomNodeChildren', ko.virtualElements.setDomNodeChildren);
(function() {
    var defaultBindingAttributeName = "data-bind";

    ko.bindingProvider = function() {
        this.bindingCache = {};
    };

    ko.utils.extend(ko.bindingProvider.prototype, {
        'nodeHasBindings': function(node) {
            switch (node.nodeType) {
                case 1: // Element
                    return node.getAttribute(defaultBindingAttributeName) != null
                        || ko.components['getComponentNameForNode'](node);
                case 8: // Comment node
                    return ko.virtualElements.hasBindingValue(node);
                default: return false;
            }
        },

        'getBindings': function(node, bindingContext) {
            var bindingsString = this['getBindingsString'](node, bindingContext),
                parsedBindings = bindingsString ? this['parseBindingsString'](bindingsString, bindingContext, node) : null;
            return ko.components.addBindingsForCustomElement(parsedBindings, node, bindingContext, /* valueAccessors */ false);
        },

        'getBindingAccessors': function(node, bindingContext) {
            var bindingsString = this['getBindingsString'](node, bindingContext),
                parsedBindings = bindingsString ? this['parseBindingsString'](bindingsString, bindingContext, node, { 'valueAccessors': true }) : null;
            return ko.components.addBindingsForCustomElement(parsedBindings, node, bindingContext, /* valueAccessors */ true);
        },

        // The following function is only used internally by this default provider.
        // It's not part of the interface definition for a general binding provider.
        'getBindingsString': function(node, bindingContext) {
            switch (node.nodeType) {
                case 1: return node.getAttribute(defaultBindingAttributeName);   // Element
                case 8: return ko.virtualElements.virtualNodeBindingValue(node); // Comment node
                default: return null;
            }
        },

        // The following function is only used internally by this default provider.
        // It's not part of the interface definition for a general binding provider.
        'parseBindingsString': function(bindingsString, bindingContext, node, options) {
            try {
                var bindingFunction = createBindingsStringEvaluatorViaCache(bindingsString, this.bindingCache, options);
                return bindingFunction(bindingContext, node);
            } catch (ex) {
                ex.message = "Unable to parse bindings.\nBindings value: " + bindingsString + "\nMessage: " + ex.message;
                throw ex;
            }
        }
    });

    ko.bindingProvider['instance'] = new ko.bindingProvider();

    function createBindingsStringEvaluatorViaCache(bindingsString, cache, options) {
        var cacheKey = bindingsString + (options && options['valueAccessors'] || '');
        return cache[cacheKey]
            || (cache[cacheKey] = createBindingsStringEvaluator(bindingsString, options));
    }

    function createBindingsStringEvaluator(bindingsString, options) {
        // Build the source for a function that evaluates "expression"
        // For each scope variable, add an extra level of "with" nesting
        // Example result: with(sc1) { with(sc0) { return (expression) } }
        var rewrittenBindings = ko.expressionRewriting.preProcessBindings(bindingsString, options),
            functionBody = "with($context){with($data||{}){return{" + rewrittenBindings + "}}}";
        return new Function("$context", "$element", functionBody);
    }
})();

ko.exportSymbol('bindingProvider', ko.bindingProvider);
(function () {
    ko.bindingHandlers = {};

    // The following element types will not be recursed into during binding. In the future, we
    // may consider adding <template> to this list, because such elements' contents are always
    // intended to be bound in a different context from where they appear in the document.
    var bindingDoesNotRecurseIntoElementTypes = {
        // Don't want bindings that operate on text nodes to mutate <script> and <textarea> contents,
        // because it's unexpected and a potential XSS issue
        'script': true,
        'textarea': true
    };

    // Use an overridable method for retrieving binding handlers so that a plugins may support dynamically created handlers
    ko['getBindingHandler'] = function(bindingKey) {
        return ko.bindingHandlers[bindingKey];
    };

    // The ko.bindingContext constructor is only called directly to create the root context. For child
    // contexts, use bindingContext.createChildContext or bindingContext.extend.
    ko.bindingContext = function(dataItemOrAccessor, parentContext, dataItemAlias, extendCallback) {

        // The binding context object includes static properties for the current, parent, and root view models.
        // If a view model is actually stored in an observable, the corresponding binding context object, and
        // any child contexts, must be updated when the view model is changed.
        function updateContext() {
            // Most of the time, the context will directly get a view model object, but if a function is given,
            // we call the function to retrieve the view model. If the function accesses any obsevables or returns
            // an observable, the dependency is tracked, and those observables can later cause the binding
            // context to be updated.
            var dataItemOrObservable = isFunc ? dataItemOrAccessor() : dataItemOrAccessor,
                dataItem = ko.utils.unwrapObservable(dataItemOrObservable);

            if (parentContext) {
                // When a "parent" context is given, register a dependency on the parent context. Thus whenever the
                // parent context is updated, this context will also be updated.
                if (parentContext._subscribable)
                    parentContext._subscribable();

                // Copy $root and any custom properties from the parent context
                ko.utils.extend(self, parentContext);

                // Because the above copy overwrites our own properties, we need to reset them.
                // During the first execution, "subscribable" isn't set, so don't bother doing the update then.
                if (subscribable) {
                    self._subscribable = subscribable;
                }
            } else {
                self['$parents'] = [];
                self['$root'] = dataItem;

                // Export 'ko' in the binding context so it will be available in bindings and templates
                // even if 'ko' isn't exported as a global, such as when using an AMD loader.
                // See https://github.com/SteveSanderson/knockout/issues/490
                self['ko'] = ko;
            }
            self['$rawData'] = dataItemOrObservable;
            self['$data'] = dataItem;
            if (dataItemAlias)
                self[dataItemAlias] = dataItem;

            // The extendCallback function is provided when creating a child context or extending a context.
            // It handles the specific actions needed to finish setting up the binding context. Actions in this
            // function could also add dependencies to this binding context.
            if (extendCallback)
                extendCallback(self, parentContext, dataItem);

            return self['$data'];
        }
        function disposeWhen() {
            return nodes && !ko.utils.anyDomNodeIsAttachedToDocument(nodes);
        }

        var self = this,
            isFunc = typeof(dataItemOrAccessor) == "function" && !ko.isObservable(dataItemOrAccessor),
            nodes,
            subscribable = ko.dependentObservable(updateContext, null, { disposeWhen: disposeWhen, disposeWhenNodeIsRemoved: true });

        // At this point, the binding context has been initialized, and the "subscribable" computed observable is
        // subscribed to any observables that were accessed in the process. If there is nothing to track, the
        // computed will be inactive, and we can safely throw it away. If it's active, the computed is stored in
        // the context object.
        if (subscribable.isActive()) {
            self._subscribable = subscribable;

            // Always notify because even if the model ($data) hasn't changed, other context properties might have changed
            subscribable['equalityComparer'] = null;

            // We need to be able to dispose of this computed observable when it's no longer needed. This would be
            // easy if we had a single node to watch, but binding contexts can be used by many different nodes, and
            // we cannot assume that those nodes have any relation to each other. So instead we track any node that
            // the context is attached to, and dispose the computed when all of those nodes have been cleaned.

            // Add properties to *subscribable* instead of *self* because any properties added to *self* may be overwritten on updates
            nodes = [];
            subscribable._addNode = function(node) {
                nodes.push(node);
                ko.utils.domNodeDisposal.addDisposeCallback(node, function(node) {
                    ko.utils.arrayRemoveItem(nodes, node);
                    if (!nodes.length) {
                        subscribable.dispose();
                        self._subscribable = subscribable = undefined;
                    }
                });
            };
        }
    }

    // Extend the binding context hierarchy with a new view model object. If the parent context is watching
    // any obsevables, the new child context will automatically get a dependency on the parent context.
    // But this does not mean that the $data value of the child context will also get updated. If the child
    // view model also depends on the parent view model, you must provide a function that returns the correct
    // view model on each update.
    ko.bindingContext.prototype['createChildContext'] = function (dataItemOrAccessor, dataItemAlias, extendCallback) {
        return new ko.bindingContext(dataItemOrAccessor, this, dataItemAlias, function(self, parentContext) {
            // Extend the context hierarchy by setting the appropriate pointers
            self['$parentContext'] = parentContext;
            self['$parent'] = parentContext['$data'];
            self['$parents'] = (parentContext['$parents'] || []).slice(0);
            self['$parents'].unshift(self['$parent']);
            if (extendCallback)
                extendCallback(self);
        });
    };

    // Extend the binding context with new custom properties. This doesn't change the context hierarchy.
    // Similarly to "child" contexts, provide a function here to make sure that the correct values are set
    // when an observable view model is updated.
    ko.bindingContext.prototype['extend'] = function(properties) {
        // If the parent context references an observable view model, "_subscribable" will always be the
        // latest view model object. If not, "_subscribable" isn't set, and we can use the static "$data" value.
        return new ko.bindingContext(this._subscribable || this['$data'], this, null, function(self, parentContext) {
            // This "child" context doesn't directly track a parent observable view model,
            // so we need to manually set the $rawData value to match the parent.
            self['$rawData'] = parentContext['$rawData'];
            ko.utils.extend(self, typeof(properties) == "function" ? properties() : properties);
        });
    };

    // Returns the valueAccesor function for a binding value
    function makeValueAccessor(value) {
        return function() {
            return value;
        };
    }

    // Returns the value of a valueAccessor function
    function evaluateValueAccessor(valueAccessor) {
        return valueAccessor();
    }

    // Given a function that returns bindings, create and return a new object that contains
    // binding value-accessors functions. Each accessor function calls the original function
    // so that it always gets the latest value and all dependencies are captured. This is used
    // by ko.applyBindingsToNode and getBindingsAndMakeAccessors.
    function makeAccessorsFromFunction(callback) {
        return ko.utils.objectMap(ko.dependencyDetection.ignore(callback), function(value, key) {
            return function() {
                return callback()[key];
            };
        });
    }

    // Given a bindings function or object, create and return a new object that contains
    // binding value-accessors functions. This is used by ko.applyBindingsToNode.
    function makeBindingAccessors(bindings, context, node) {
        if (typeof bindings === 'function') {
            return makeAccessorsFromFunction(bindings.bind(null, context, node));
        } else {
            return ko.utils.objectMap(bindings, makeValueAccessor);
        }
    }

    // This function is used if the binding provider doesn't include a getBindingAccessors function.
    // It must be called with 'this' set to the provider instance.
    function getBindingsAndMakeAccessors(node, context) {
        return makeAccessorsFromFunction(this['getBindings'].bind(this, node, context));
    }

    function validateThatBindingIsAllowedForVirtualElements(bindingName) {
        var validator = ko.virtualElements.allowedBindings[bindingName];
        if (!validator)
            throw new Error("The binding '" + bindingName + "' cannot be used with virtual elements")
    }

    function applyBindingsToDescendantsInternal (bindingContext, elementOrVirtualElement, bindingContextsMayDifferFromDomParentElement) {
        var currentChild,
            nextInQueue = ko.virtualElements.firstChild(elementOrVirtualElement),
            provider = ko.bindingProvider['instance'],
            preprocessNode = provider['preprocessNode'];

        // Preprocessing allows a binding provider to mutate a node before bindings are applied to it. For example it's
        // possible to insert new siblings after it, and/or replace the node with a different one. This can be used to
        // implement custom binding syntaxes, such as {{ value }} for string interpolation, or custom element types that
        // trigger insertion of <template> contents at that point in the document.
        if (preprocessNode) {
            while (currentChild = nextInQueue) {
                nextInQueue = ko.virtualElements.nextSibling(currentChild);
                preprocessNode.call(provider, currentChild);
            }
            // Reset nextInQueue for the next loop
            nextInQueue = ko.virtualElements.firstChild(elementOrVirtualElement);
        }

        while (currentChild = nextInQueue) {
            // Keep a record of the next child *before* applying bindings, in case the binding removes the current child from its position
            nextInQueue = ko.virtualElements.nextSibling(currentChild);
            applyBindingsToNodeAndDescendantsInternal(bindingContext, currentChild, bindingContextsMayDifferFromDomParentElement);
        }
    }

    function applyBindingsToNodeAndDescendantsInternal (bindingContext, nodeVerified, bindingContextMayDifferFromDomParentElement) {
        var shouldBindDescendants = true;

        // Perf optimisation: Apply bindings only if...
        // (1) We need to store the binding context on this node (because it may differ from the DOM parent node's binding context)
        //     Note that we can't store binding contexts on non-elements (e.g., text nodes), as IE doesn't allow expando properties for those
        // (2) It might have bindings (e.g., it has a data-bind attribute, or it's a marker for a containerless template)
        var isElement = (nodeVerified.nodeType === 1);
        if (isElement) // Workaround IE <= 8 HTML parsing weirdness
            ko.virtualElements.normaliseVirtualElementDomStructure(nodeVerified);

        var shouldApplyBindings = (isElement && bindingContextMayDifferFromDomParentElement)             // Case (1)
                               || ko.bindingProvider['instance']['nodeHasBindings'](nodeVerified);       // Case (2)
        if (shouldApplyBindings)
            shouldBindDescendants = applyBindingsToNodeInternal(nodeVerified, null, bindingContext, bindingContextMayDifferFromDomParentElement)['shouldBindDescendants'];

        if (shouldBindDescendants && !bindingDoesNotRecurseIntoElementTypes[ko.utils.tagNameLower(nodeVerified)]) {
            // We're recursing automatically into (real or virtual) child nodes without changing binding contexts. So,
            //  * For children of a *real* element, the binding context is certainly the same as on their DOM .parentNode,
            //    hence bindingContextsMayDifferFromDomParentElement is false
            //  * For children of a *virtual* element, we can't be sure. Evaluating .parentNode on those children may
            //    skip over any number of intermediate virtual elements, any of which might define a custom binding context,
            //    hence bindingContextsMayDifferFromDomParentElement is true
            applyBindingsToDescendantsInternal(bindingContext, nodeVerified, /* bindingContextsMayDifferFromDomParentElement: */ !isElement);
        }
    }

    var boundElementDomDataKey = ko.utils.domData.nextKey();


    function topologicalSortBindings(bindings) {
        // Depth-first sort
        var result = [],                // The list of key/handler pairs that we will return
            bindingsConsidered = {},    // A temporary record of which bindings are already in 'result'
            cyclicDependencyStack = []; // Keeps track of a depth-search so that, if there's a cycle, we know which bindings caused it
        ko.utils.objectForEach(bindings, function pushBinding(bindingKey) {
            if (!bindingsConsidered[bindingKey]) {
                var binding = ko['getBindingHandler'](bindingKey);
                if (binding) {
                    // First add dependencies (if any) of the current binding
                    if (binding['after']) {
                        cyclicDependencyStack.push(bindingKey);
                        ko.utils.arrayForEach(binding['after'], function(bindingDependencyKey) {
                            if (bindings[bindingDependencyKey]) {
                                if (ko.utils.arrayIndexOf(cyclicDependencyStack, bindingDependencyKey) !== -1) {
                                    throw Error("Cannot combine the following bindings, because they have a cyclic dependency: " + cyclicDependencyStack.join(", "));
                                } else {
                                    pushBinding(bindingDependencyKey);
                                }
                            }
                        });
                        cyclicDependencyStack.length--;
                    }
                    // Next add the current binding
                    result.push({ key: bindingKey, handler: binding });
                }
                bindingsConsidered[bindingKey] = true;
            }
        });

        return result;
    }

    function applyBindingsToNodeInternal(node, sourceBindings, bindingContext, bindingContextMayDifferFromDomParentElement) {
        // Prevent multiple applyBindings calls for the same node, except when a binding value is specified
        var alreadyBound = ko.utils.domData.get(node, boundElementDomDataKey);
        if (!sourceBindings) {
            if (alreadyBound) {
                throw Error("You cannot apply bindings multiple times to the same element.");
            }
            ko.utils.domData.set(node, boundElementDomDataKey, true);
        }

        // Optimization: Don't store the binding context on this node if it's definitely the same as on node.parentNode, because
        // we can easily recover it just by scanning up the node's ancestors in the DOM
        // (note: here, parent node means "real DOM parent" not "virtual parent", as there's no O(1) way to find the virtual parent)
        if (!alreadyBound && bindingContextMayDifferFromDomParentElement)
            ko.storedBindingContextForNode(node, bindingContext);

        // Use bindings if given, otherwise fall back on asking the bindings provider to give us some bindings
        var bindings;
        if (sourceBindings && typeof sourceBindings !== 'function') {
            bindings = sourceBindings;
        } else {
            var provider = ko.bindingProvider['instance'],
                getBindings = provider['getBindingAccessors'] || getBindingsAndMakeAccessors;

            // Get the binding from the provider within a computed observable so that we can update the bindings whenever
            // the binding context is updated or if the binding provider accesses observables.
            var bindingsUpdater = ko.dependentObservable(
                function() {
                    bindings = sourceBindings ? sourceBindings(bindingContext, node) : getBindings.call(provider, node, bindingContext);
                    // Register a dependency on the binding context to support obsevable view models.
                    if (bindings && bindingContext._subscribable)
                        bindingContext._subscribable();
                    return bindings;
                },
                null, { disposeWhenNodeIsRemoved: node }
            );

            if (!bindings || !bindingsUpdater.isActive())
                bindingsUpdater = null;
        }

        var bindingHandlerThatControlsDescendantBindings;
        if (bindings) {
            // Return the value accessor for a given binding. When bindings are static (won't be updated because of a binding
            // context update), just return the value accessor from the binding. Otherwise, return a function that always gets
            // the latest binding value and registers a dependency on the binding updater.
            var getValueAccessor = bindingsUpdater
                ? function(bindingKey) {
                    return function() {
                        return evaluateValueAccessor(bindingsUpdater()[bindingKey]);
                    };
                } : function(bindingKey) {
                    return bindings[bindingKey];
                };

            // Use of allBindings as a function is maintained for backwards compatibility, but its use is deprecated
            function allBindings() {
                return ko.utils.objectMap(bindingsUpdater ? bindingsUpdater() : bindings, evaluateValueAccessor);
            }
            // The following is the 3.x allBindings API
            allBindings['get'] = function(key) {
                return bindings[key] && evaluateValueAccessor(getValueAccessor(key));
            };
            allBindings['has'] = function(key) {
                return key in bindings;
            };

            // First put the bindings into the right order
            var orderedBindings = topologicalSortBindings(bindings);

            // Go through the sorted bindings, calling init and update for each
            ko.utils.arrayForEach(orderedBindings, function(bindingKeyAndHandler) {
                // Note that topologicalSortBindings has already filtered out any nonexistent binding handlers,
                // so bindingKeyAndHandler.handler will always be nonnull.
                var handlerInitFn = bindingKeyAndHandler.handler["init"],
                    handlerUpdateFn = bindingKeyAndHandler.handler["update"],
                    bindingKey = bindingKeyAndHandler.key;

                if (node.nodeType === 8) {
                    validateThatBindingIsAllowedForVirtualElements(bindingKey);
                }

                try {
                    // Run init, ignoring any dependencies
                    if (typeof handlerInitFn == "function") {
                        ko.dependencyDetection.ignore(function() {
                            var initResult = handlerInitFn(node, getValueAccessor(bindingKey), allBindings, bindingContext['$data'], bindingContext);

                            // If this binding handler claims to control descendant bindings, make a note of this
                            if (initResult && initResult['controlsDescendantBindings']) {
                                if (bindingHandlerThatControlsDescendantBindings !== undefined)
                                    throw new Error("Multiple bindings (" + bindingHandlerThatControlsDescendantBindings + " and " + bindingKey + ") are trying to control descendant bindings of the same element. You cannot use these bindings together on the same element.");
                                bindingHandlerThatControlsDescendantBindings = bindingKey;
                            }
                        });
                    }

                    // Run update in its own computed wrapper
                    if (typeof handlerUpdateFn == "function") {
                        ko.dependentObservable(
                            function() {
                                handlerUpdateFn(node, getValueAccessor(bindingKey), allBindings, bindingContext['$data'], bindingContext);
                            },
                            null,
                            { disposeWhenNodeIsRemoved: node }
                        );
                    }
                } catch (ex) {
                    ex.message = "Unable to process binding \"" + bindingKey + ": " + bindings[bindingKey] + "\"\nMessage: " + ex.message;
                    throw ex;
                }
            });
        }

        return {
            'shouldBindDescendants': bindingHandlerThatControlsDescendantBindings === undefined
        };
    };

    var storedBindingContextDomDataKey = ko.utils.domData.nextKey();
    ko.storedBindingContextForNode = function (node, bindingContext) {
        if (arguments.length == 2) {
            ko.utils.domData.set(node, storedBindingContextDomDataKey, bindingContext);
            if (bindingContext._subscribable)
                bindingContext._subscribable._addNode(node);
        } else {
            return ko.utils.domData.get(node, storedBindingContextDomDataKey);
        }
    }

    function getBindingContext(viewModelOrBindingContext) {
        return viewModelOrBindingContext && (viewModelOrBindingContext instanceof ko.bindingContext)
            ? viewModelOrBindingContext
            : new ko.bindingContext(viewModelOrBindingContext);
    }

    ko.applyBindingAccessorsToNode = function (node, bindings, viewModelOrBindingContext) {
        if (node.nodeType === 1) // If it's an element, workaround IE <= 8 HTML parsing weirdness
            ko.virtualElements.normaliseVirtualElementDomStructure(node);
        return applyBindingsToNodeInternal(node, bindings, getBindingContext(viewModelOrBindingContext), true);
    };

    ko.applyBindingsToNode = function (node, bindings, viewModelOrBindingContext) {
        var context = getBindingContext(viewModelOrBindingContext);
        return ko.applyBindingAccessorsToNode(node, makeBindingAccessors(bindings, context, node), context);
    };

    ko.applyBindingsToDescendants = function(viewModelOrBindingContext, rootNode) {
        if (rootNode.nodeType === 1 || rootNode.nodeType === 8)
            applyBindingsToDescendantsInternal(getBindingContext(viewModelOrBindingContext), rootNode, true);
    };

    ko.applyBindings = function (viewModelOrBindingContext, rootNode) {
        // If jQuery is loaded after Knockout, we won't initially have access to it. So save it here.
        if (!jQueryInstance && window['jQuery']) {
            jQueryInstance = window['jQuery'];
        }

        if (rootNode && (rootNode.nodeType !== 1) && (rootNode.nodeType !== 8))
            throw new Error("ko.applyBindings: first parameter should be your view model; second parameter should be a DOM node");
        rootNode = rootNode || window.document.body; // Make "rootNode" parameter optional

        applyBindingsToNodeAndDescendantsInternal(getBindingContext(viewModelOrBindingContext), rootNode, true);
    };

    // Retrieving binding context from arbitrary nodes
    ko.contextFor = function(node) {
        // We can only do something meaningful for elements and comment nodes (in particular, not text nodes, as IE can't store domdata for them)
        switch (node.nodeType) {
            case 1:
            case 8:
                var context = ko.storedBindingContextForNode(node);
                if (context) return context;
                if (node.parentNode) return ko.contextFor(node.parentNode);
                break;
        }
        return undefined;
    };
    ko.dataFor = function(node) {
        var context = ko.contextFor(node);
        return context ? context['$data'] : undefined;
    };

    ko.exportSymbol('bindingHandlers', ko.bindingHandlers);
    ko.exportSymbol('applyBindings', ko.applyBindings);
    ko.exportSymbol('applyBindingsToDescendants', ko.applyBindingsToDescendants);
    ko.exportSymbol('applyBindingAccessorsToNode', ko.applyBindingAccessorsToNode);
    ko.exportSymbol('applyBindingsToNode', ko.applyBindingsToNode);
    ko.exportSymbol('contextFor', ko.contextFor);
    ko.exportSymbol('dataFor', ko.dataFor);
})();
(function(undefined) {
    var loadingSubscribablesCache = {}, // Tracks component loads that are currently in flight
        loadedDefinitionsCache = {};    // Tracks component loads that have already completed

    ko.components = {
        get: function(componentName, callback) {
            var cachedDefinition = getObjectOwnProperty(loadedDefinitionsCache, componentName);
            if (cachedDefinition) {
                // It's already loaded and cached. Reuse the same definition object.
                // Note that for API consistency, even cache hits complete asynchronously by default.
                // You can bypass this by putting synchronous:true on your component config.
                if (cachedDefinition.isSynchronousComponent) {
                    ko.dependencyDetection.ignore(function() { // See comment in loaderRegistryBehaviors.js for reasoning
                        callback(cachedDefinition.definition);
                    });
                } else {
                    setTimeout(function() { callback(cachedDefinition.definition); }, 0);
                }
            } else {
                // Join the loading process that is already underway, or start a new one.
                loadComponentAndNotify(componentName, callback);
            }
        },

        clearCachedDefinition: function(componentName) {
            delete loadedDefinitionsCache[componentName];
        },

        _getFirstResultFromLoaders: getFirstResultFromLoaders
    };

    function getObjectOwnProperty(obj, propName) {
        return obj.hasOwnProperty(propName) ? obj[propName] : undefined;
    }

    function loadComponentAndNotify(componentName, callback) {
        var subscribable = getObjectOwnProperty(loadingSubscribablesCache, componentName),
            completedAsync;
        if (!subscribable) {
            // It's not started loading yet. Start loading, and when it's done, move it to loadedDefinitionsCache.
            subscribable = loadingSubscribablesCache[componentName] = new ko.subscribable();
            subscribable.subscribe(callback);

            beginLoadingComponent(componentName, function(definition, config) {
                var isSynchronousComponent = !!(config && config['synchronous']);
                loadedDefinitionsCache[componentName] = { definition: definition, isSynchronousComponent: isSynchronousComponent };
                delete loadingSubscribablesCache[componentName];

                // For API consistency, all loads complete asynchronously. However we want to avoid
                // adding an extra setTimeout if it's unnecessary (i.e., the completion is already
                // async) since setTimeout(..., 0) still takes about 16ms or more on most browsers.
                //
                // You can bypass the 'always synchronous' feature by putting the synchronous:true
                // flag on your component configuration when you register it.
                if (completedAsync || isSynchronousComponent) {
                    // Note that notifySubscribers ignores any dependencies read within the callback.
                    // See comment in loaderRegistryBehaviors.js for reasoning
                    subscribable['notifySubscribers'](definition);
                } else {
                    setTimeout(function() {
                        subscribable['notifySubscribers'](definition);
                    }, 0);
                }
            });
            completedAsync = true;
        } else {
            subscribable.subscribe(callback);
        }
    }

    function beginLoadingComponent(componentName, callback) {
        getFirstResultFromLoaders('getConfig', [componentName], function(config) {
            if (config) {
                // We have a config, so now load its definition
                getFirstResultFromLoaders('loadComponent', [componentName, config], function(definition) {
                    callback(definition, config);
                });
            } else {
                // The component has no config - it's unknown to all the loaders.
                // Note that this is not an error (e.g., a module loading error) - that would abort the
                // process and this callback would not run. For this callback to run, all loaders must
                // have confirmed they don't know about this component.
                callback(null, null);
            }
        });
    }

    function getFirstResultFromLoaders(methodName, argsExceptCallback, callback, candidateLoaders) {
        // On the first call in the stack, start with the full set of loaders
        if (!candidateLoaders) {
            candidateLoaders = ko.components['loaders'].slice(0); // Use a copy, because we'll be mutating this array
        }

        // Try the next candidate
        var currentCandidateLoader = candidateLoaders.shift();
        if (currentCandidateLoader) {
            var methodInstance = currentCandidateLoader[methodName];
            if (methodInstance) {
                var wasAborted = false,
                    synchronousReturnValue = methodInstance.apply(currentCandidateLoader, argsExceptCallback.concat(function(result) {
                        if (wasAborted) {
                            callback(null);
                        } else if (result !== null) {
                            // This candidate returned a value. Use it.
                            callback(result);
                        } else {
                            // Try the next candidate
                            getFirstResultFromLoaders(methodName, argsExceptCallback, callback, candidateLoaders);
                        }
                    }));

                // Currently, loaders may not return anything synchronously. This leaves open the possibility
                // that we'll extend the API to support synchronous return values in the future. It won't be
                // a breaking change, because currently no loader is allowed to return anything except undefined.
                if (synchronousReturnValue !== undefined) {
                    wasAborted = true;

                    // Method to suppress exceptions will remain undocumented. This is only to keep
                    // KO's specs running tidily, since we can observe the loading got aborted without
                    // having exceptions cluttering up the console too.
                    if (!currentCandidateLoader['suppressLoaderExceptions']) {
                        throw new Error('Component loaders must supply values by invoking the callback, not by returning values synchronously.');
                    }
                }
            } else {
                // This candidate doesn't have the relevant handler. Synchronously move on to the next one.
                getFirstResultFromLoaders(methodName, argsExceptCallback, callback, candidateLoaders);
            }
        } else {
            // No candidates returned a value
            callback(null);
        }
    }

    // Reference the loaders via string name so it's possible for developers
    // to replace the whole array by assigning to ko.components.loaders
    ko.components['loaders'] = [];

    ko.exportSymbol('components', ko.components);
    ko.exportSymbol('components.get', ko.components.get);
    ko.exportSymbol('components.clearCachedDefinition', ko.components.clearCachedDefinition);
})();
(function(undefined) {

    // The default loader is responsible for two things:
    // 1. Maintaining the default in-memory registry of component configuration objects
    //    (i.e., the thing you're writing to when you call ko.components.register(someName, ...))
    // 2. Answering requests for components by fetching configuration objects
    //    from that default in-memory registry and resolving them into standard
    //    component definition objects (of the form { createViewModel: ..., template: ... })
    // Custom loaders may override either of these facilities, i.e.,
    // 1. To supply configuration objects from some other source (e.g., conventions)
    // 2. Or, to resolve configuration objects by loading viewmodels/templates via arbitrary logic.

    var defaultConfigRegistry = {};

    ko.components.register = function(componentName, config) {
        if (!config) {
            throw new Error('Invalid configuration for ' + componentName);
        }

        if (ko.components.isRegistered(componentName)) {
            throw new Error('Component ' + componentName + ' is already registered');
        }

        defaultConfigRegistry[componentName] = config;
    }

    ko.components.isRegistered = function(componentName) {
        return componentName in defaultConfigRegistry;
    }

    ko.components.unregister = function(componentName) {
        delete defaultConfigRegistry[componentName];
        ko.components.clearCachedDefinition(componentName);
    }

    ko.components.defaultLoader = {
        'getConfig': function(componentName, callback) {
            var result = defaultConfigRegistry.hasOwnProperty(componentName)
                ? defaultConfigRegistry[componentName]
                : null;
            callback(result);
        },

        'loadComponent': function(componentName, config, callback) {
            var errorCallback = makeErrorCallback(componentName);
            possiblyGetConfigFromAmd(errorCallback, config, function(loadedConfig) {
                resolveConfig(componentName, errorCallback, loadedConfig, callback);
            });
        },

        'loadTemplate': function(componentName, templateConfig, callback) {
            resolveTemplate(makeErrorCallback(componentName), templateConfig, callback);
        },

        'loadViewModel': function(componentName, viewModelConfig, callback) {
            resolveViewModel(makeErrorCallback(componentName), viewModelConfig, callback);
        }
    };

    var createViewModelKey = 'createViewModel';

    // Takes a config object of the form { template: ..., viewModel: ... }, and asynchronously convert it
    // into the standard component definition format:
    //    { template: <ArrayOfDomNodes>, createViewModel: function(params, componentInfo) { ... } }.
    // Since both template and viewModel may need to be resolved asynchronously, both tasks are performed
    // in parallel, and the results joined when both are ready. We don't depend on any promises infrastructure,
    // so this is implemented manually below.
    function resolveConfig(componentName, errorCallback, config, callback) {
        var result = {},
            makeCallBackWhenZero = 2,
            tryIssueCallback = function() {
                if (--makeCallBackWhenZero === 0) {
                    callback(result);
                }
            },
            templateConfig = config['template'],
            viewModelConfig = config['viewModel'];

        if (templateConfig) {
            possiblyGetConfigFromAmd(errorCallback, templateConfig, function(loadedConfig) {
                ko.components._getFirstResultFromLoaders('loadTemplate', [componentName, loadedConfig], function(resolvedTemplate) {
                    result['template'] = resolvedTemplate;
                    tryIssueCallback();
                });
            });
        } else {
            tryIssueCallback();
        }

        if (viewModelConfig) {
            possiblyGetConfigFromAmd(errorCallback, viewModelConfig, function(loadedConfig) {
                ko.components._getFirstResultFromLoaders('loadViewModel', [componentName, loadedConfig], function(resolvedViewModel) {
                    result[createViewModelKey] = resolvedViewModel;
                    tryIssueCallback();
                });
            });
        } else {
            tryIssueCallback();
        }
    }

    function resolveTemplate(errorCallback, templateConfig, callback) {
        if (typeof templateConfig === 'string') {
            // Markup - parse it
            callback(ko.utils.parseHtmlFragment(templateConfig));
        } else if (templateConfig instanceof Array) {
            // Assume already an array of DOM nodes - pass through unchanged
            callback(templateConfig);
        } else if (isDocumentFragment(templateConfig)) {
            // Document fragment - use its child nodes
            callback(ko.utils.makeArray(templateConfig.childNodes));
        } else if (templateConfig['element']) {
            var element = templateConfig['element'];
            if (isDomElement(element)) {
                // Element instance - copy its child nodes
                callback(cloneNodesFromTemplateSourceElement(element));
            } else if (typeof element === 'string') {
                // Element ID - find it, then copy its child nodes
                var elemInstance = document.getElementById(element);
                if (elemInstance) {
                    callback(cloneNodesFromTemplateSourceElement(elemInstance));
                } else {
                    errorCallback('Cannot find element with ID ' + element);
                }
            } else {
                errorCallback('Unknown element type: ' + element);
            }
        } else {
            errorCallback('Unknown template value: ' + templateConfig);
        }
    }

    function resolveViewModel(errorCallback, viewModelConfig, callback) {
        if (typeof viewModelConfig === 'function') {
            // Constructor - convert to standard factory function format
            // By design, this does *not* supply componentInfo to the constructor, as the intent is that
            // componentInfo contains non-viewmodel data (e.g., the component's element) that should only
            // be used in factory functions, not viewmodel constructors.
            callback(function (params /*, componentInfo */) {
                return new viewModelConfig(params);
            });
        } else if (typeof viewModelConfig[createViewModelKey] === 'function') {
            // Already a factory function - use it as-is
            callback(viewModelConfig[createViewModelKey]);
        } else if ('instance' in viewModelConfig) {
            // Fixed object instance - promote to createViewModel format for API consistency
            var fixedInstance = viewModelConfig['instance'];
            callback(function (params, componentInfo) {
                return fixedInstance;
            });
        } else if ('viewModel' in viewModelConfig) {
            // Resolved AMD module whose value is of the form { viewModel: ... }
            resolveViewModel(errorCallback, viewModelConfig['viewModel'], callback);
        } else {
            errorCallback('Unknown viewModel value: ' + viewModelConfig);
        }
    }

    function cloneNodesFromTemplateSourceElement(elemInstance) {
        switch (ko.utils.tagNameLower(elemInstance)) {
            case 'script':
                return ko.utils.parseHtmlFragment(elemInstance.text);
            case 'textarea':
                return ko.utils.parseHtmlFragment(elemInstance.value);
            case 'template':
                // For browsers with proper <template> element support (i.e., where the .content property
                // gives a document fragment), use that document fragment.
                if (isDocumentFragment(elemInstance.content)) {
                    return ko.utils.cloneNodes(elemInstance.content.childNodes);
                }
        }

        // Regular elements such as <div>, and <template> elements on old browsers that don't really
        // understand <template> and just treat it as a regular container
        return ko.utils.cloneNodes(elemInstance.childNodes);
    }

    function isDomElement(obj) {
        if (window['HTMLElement']) {
            return obj instanceof HTMLElement;
        } else {
            return obj && obj.tagName && obj.nodeType === 1;
        }
    }

    function isDocumentFragment(obj) {
        if (window['DocumentFragment']) {
            return obj instanceof DocumentFragment;
        } else {
            return obj && obj.nodeType === 11;
        }
    }

    function possiblyGetConfigFromAmd(errorCallback, config, callback) {
        if (typeof config['require'] === 'string') {
            // The config is the value of an AMD module
            if (amdRequire || window['require']) {
                (amdRequire || window['require'])([config['require']], callback);
            } else {
                errorCallback('Uses require, but no AMD loader is present');
            }
        } else {
            callback(config);
        }
    }

    function makeErrorCallback(componentName) {
        return function (message) {
            throw new Error('Component \'' + componentName + '\': ' + message);
        };
    }

    ko.exportSymbol('components.register', ko.components.register);
    ko.exportSymbol('components.isRegistered', ko.components.isRegistered);
    ko.exportSymbol('components.unregister', ko.components.unregister);

    // Expose the default loader so that developers can directly ask it for configuration
    // or to resolve configuration
    ko.exportSymbol('components.defaultLoader', ko.components.defaultLoader);

    // By default, the default loader is the only registered component loader
    ko.components['loaders'].push(ko.components.defaultLoader);

    // Privately expose the underlying config registry for use in old-IE shim
    ko.components._allRegisteredComponents = defaultConfigRegistry;
})();
(function (undefined) {
    // Overridable API for determining which component name applies to a given node. By overriding this,
    // you can for example map specific tagNames to components that are not preregistered.
    ko.components['getComponentNameForNode'] = function(node) {
        var tagNameLower = ko.utils.tagNameLower(node);
        return ko.components.isRegistered(tagNameLower) && tagNameLower;
    };

    ko.components.addBindingsForCustomElement = function(allBindings, node, bindingContext, valueAccessors) {
        // Determine if it's really a custom element matching a component
        if (node.nodeType === 1) {
            var componentName = ko.components['getComponentNameForNode'](node);
            if (componentName) {
                // It does represent a component, so add a component binding for it
                allBindings = allBindings || {};

                if (allBindings['component']) {
                    // Avoid silently overwriting some other 'component' binding that may already be on the element
                    throw new Error('Cannot use the "component" binding on a custom element matching a component');
                }

                var componentBindingValue = { 'name': componentName, 'params': getComponentParamsFromCustomElement(node, bindingContext) };

                allBindings['component'] = valueAccessors
                    ? function() { return componentBindingValue; }
                    : componentBindingValue;
            }
        }

        return allBindings;
    }

    var nativeBindingProviderInstance = new ko.bindingProvider();

    function getComponentParamsFromCustomElement(elem, bindingContext) {
        var paramsAttribute = elem.getAttribute('params');

        if (paramsAttribute) {
            var params = nativeBindingProviderInstance['parseBindingsString'](paramsAttribute, bindingContext, elem, { 'valueAccessors': true, 'bindingParams': true }),
                rawParamComputedValues = ko.utils.objectMap(params, function(paramValue, paramName) {
                    return ko.computed(paramValue, null, { disposeWhenNodeIsRemoved: elem });
                }),
                result = ko.utils.objectMap(rawParamComputedValues, function(paramValueComputed, paramName) {
                    var paramValue = paramValueComputed.peek();
                    // Does the evaluation of the parameter value unwrap any observables?
                    if (!paramValueComputed.isActive()) {
                        // No it doesn't, so there's no need for any computed wrapper. Just pass through the supplied value directly.
                        // Example: "someVal: firstName, age: 123" (whether or not firstName is an observable/computed)
                        return paramValue;
                    } else {
                        // Yes it does. Supply a computed property that unwraps both the outer (binding expression)
                        // level of observability, and any inner (resulting model value) level of observability.
                        // This means the component doesn't have to worry about multiple unwrapping. If the value is a
                        // writable observable, the computed will also be writable and pass the value on to the observable.
                        return ko.computed({
                            'read': function() {
                                return ko.utils.unwrapObservable(paramValueComputed());
                            },
                            'write': ko.isWriteableObservable(paramValue) && function(value) {
                                paramValueComputed()(value);
                            },
                            disposeWhenNodeIsRemoved: elem
                        });
                    }
                });

            // Give access to the raw computeds, as long as that wouldn't overwrite any custom param also called '$raw'
            // This is in case the developer wants to react to outer (binding) observability separately from inner
            // (model value) observability, or in case the model value observable has subobservables.
            if (!result.hasOwnProperty('$raw')) {
                result['$raw'] = rawParamComputedValues;
            }

            return result;
        } else {
            // For consistency, absence of a "params" attribute is treated the same as the presence of
            // any empty one. Otherwise component viewmodels need special code to check whether or not
            // 'params' or 'params.$raw' is null/undefined before reading subproperties, which is annoying.
            return { '$raw': {} };
        }
    }

    // --------------------------------------------------------------------------------
    // Compatibility code for older (pre-HTML5) IE browsers

    if (ko.utils.ieVersion < 9) {
        // Whenever you preregister a component, enable it as a custom element in the current document
        ko.components['register'] = (function(originalFunction) {
            return function(componentName) {
                document.createElement(componentName); // Allows IE<9 to parse markup containing the custom element
                return originalFunction.apply(this, arguments);
            }
        })(ko.components['register']);

        // Whenever you create a document fragment, enable all preregistered component names as custom elements
        // This is needed to make innerShiv/jQuery HTML parsing correctly handle the custom elements
        document.createDocumentFragment = (function(originalFunction) {
            return function() {
                var newDocFrag = originalFunction(),
                    allComponents = ko.components._allRegisteredComponents;
                for (var componentName in allComponents) {
                    if (allComponents.hasOwnProperty(componentName)) {
                        newDocFrag.createElement(componentName);
                    }
                }
                return newDocFrag;
            };
        })(document.createDocumentFragment);
    }
})();(function(undefined) {

    var componentLoadingOperationUniqueId = 0;

    ko.bindingHandlers['component'] = {
        'init': function(element, valueAccessor, ignored1, ignored2, bindingContext) {
            var currentViewModel,
                currentLoadingOperationId,
                disposeAssociatedComponentViewModel = function () {
                    var currentViewModelDispose = currentViewModel && currentViewModel['dispose'];
                    if (typeof currentViewModelDispose === 'function') {
                        currentViewModelDispose.call(currentViewModel);
                    }

                    // Any in-flight loading operation is no longer relevant, so make sure we ignore its completion
                    currentLoadingOperationId = null;
                },
                originalChildNodes = ko.utils.makeArray(ko.virtualElements.childNodes(element));

            ko.utils.domNodeDisposal.addDisposeCallback(element, disposeAssociatedComponentViewModel);

            ko.computed(function () {
                var value = ko.utils.unwrapObservable(valueAccessor()),
                    componentName, componentParams;

                if (typeof value === 'string') {
                    componentName = value;
                } else {
                    componentName = ko.utils.unwrapObservable(value['name']);
                    componentParams = ko.utils.unwrapObservable(value['params']);
                }

                if (!componentName) {
                    throw new Error('No component name specified');
                }

                var loadingOperationId = currentLoadingOperationId = ++componentLoadingOperationUniqueId;
                ko.components.get(componentName, function(componentDefinition) {
                    // If this is not the current load operation for this element, ignore it.
                    if (currentLoadingOperationId !== loadingOperationId) {
                        return;
                    }

                    // Clean up previous state
                    disposeAssociatedComponentViewModel();

                    // Instantiate and bind new component. Implicitly this cleans any old DOM nodes.
                    if (!componentDefinition) {
                        throw new Error('Unknown component \'' + componentName + '\'');
                    }
                    cloneTemplateIntoElement(componentName, componentDefinition, element);
                    var componentViewModel = createViewModel(componentDefinition, element, originalChildNodes, componentParams),
                        childBindingContext = bindingContext['createChildContext'](componentViewModel, /* dataItemAlias */ undefined, function(ctx) {
                            ctx['$component'] = componentViewModel;
                            ctx['$componentTemplateNodes'] = originalChildNodes;
                        });
                    currentViewModel = componentViewModel;
                    ko.applyBindingsToDescendants(childBindingContext, element);
                });
            }, null, { disposeWhenNodeIsRemoved: element });

            return { 'controlsDescendantBindings': true };
        }
    };

    ko.virtualElements.allowedBindings['component'] = true;

    function cloneTemplateIntoElement(componentName, componentDefinition, element) {
        var template = componentDefinition['template'];
        if (!template) {
            throw new Error('Component \'' + componentName + '\' has no template');
        }

        var clonedNodesArray = ko.utils.cloneNodes(template);
        ko.virtualElements.setDomNodeChildren(element, clonedNodesArray);
    }

    function createViewModel(componentDefinition, element, originalChildNodes, componentParams) {
        var componentViewModelFactory = componentDefinition['createViewModel'];
        return componentViewModelFactory
            ? componentViewModelFactory.call(componentDefinition, componentParams, { 'element': element, 'templateNodes': originalChildNodes })
            : componentParams; // Template-only component
    }

})();
var attrHtmlToJavascriptMap = { 'class': 'className', 'for': 'htmlFor' };
ko.bindingHandlers['attr'] = {
    'update': function(element, valueAccessor, allBindings) {
        var value = ko.utils.unwrapObservable(valueAccessor()) || {};
        ko.utils.objectForEach(value, function(attrName, attrValue) {
            attrValue = ko.utils.unwrapObservable(attrValue);

            // To cover cases like "attr: { checked:someProp }", we want to remove the attribute entirely
            // when someProp is a "no value"-like value (strictly null, false, or undefined)
            // (because the absence of the "checked" attr is how to mark an element as not checked, etc.)
            var toRemove = (attrValue === false) || (attrValue === null) || (attrValue === undefined);
            if (toRemove)
                element.removeAttribute(attrName);

            // In IE <= 7 and IE8 Quirks Mode, you have to use the Javascript property name instead of the
            // HTML attribute name for certain attributes. IE8 Standards Mode supports the correct behavior,
            // but instead of figuring out the mode, we'll just set the attribute through the Javascript
            // property for IE <= 8.
            if (ko.utils.ieVersion <= 8 && attrName in attrHtmlToJavascriptMap) {
                attrName = attrHtmlToJavascriptMap[attrName];
                if (toRemove)
                    element.removeAttribute(attrName);
                else
                    element[attrName] = attrValue;
            } else if (!toRemove) {
                element.setAttribute(attrName, attrValue.toString());
            }

            // Treat "name" specially - although you can think of it as an attribute, it also needs
            // special handling on older versions of IE (https://github.com/SteveSanderson/knockout/pull/333)
            // Deliberately being case-sensitive here because XHTML would regard "Name" as a different thing
            // entirely, and there's no strong reason to allow for such casing in HTML.
            if (attrName === "name") {
                ko.utils.setElementName(element, toRemove ? "" : attrValue.toString());
            }
        });
    }
};
(function() {

ko.bindingHandlers['checked'] = {
    'after': ['value', 'attr'],
    'init': function (element, valueAccessor, allBindings) {
        var checkedValue = ko.pureComputed(function() {
            // Treat "value" like "checkedValue" when it is included with "checked" binding
            if (allBindings['has']('checkedValue')) {
                return ko.utils.unwrapObservable(allBindings.get('checkedValue'));
            } else if (allBindings['has']('value')) {
                return ko.utils.unwrapObservable(allBindings.get('value'));
            }

            return element.value;
        });

        function updateModel() {
            // This updates the model value from the view value.
            // It runs in response to DOM events (click) and changes in checkedValue.
            var isChecked = element.checked,
                elemValue = useCheckedValue ? checkedValue() : isChecked;

            // When we're first setting up this computed, don't change any model state.
            if (ko.computedContext.isInitial()) {
                return;
            }

            // We can ignore unchecked radio buttons, because some other radio
            // button will be getting checked, and that one can take care of updating state.
            if (isRadio && !isChecked) {
                return;
            }

            var modelValue = ko.dependencyDetection.ignore(valueAccessor);
            if (isValueArray) {
                if (oldElemValue !== elemValue) {
                    // When we're responding to the checkedValue changing, and the element is
                    // currently checked, replace the old elem value with the new elem value
                    // in the model array.
                    if (isChecked) {
                        ko.utils.addOrRemoveItem(modelValue, elemValue, true);
                        ko.utils.addOrRemoveItem(modelValue, oldElemValue, false);
                    }

                    oldElemValue = elemValue;
                } else {
                    // When we're responding to the user having checked/unchecked a checkbox,
                    // add/remove the element value to the model array.
                    ko.utils.addOrRemoveItem(modelValue, elemValue, isChecked);
                }
            } else {
                ko.expressionRewriting.writeValueToProperty(modelValue, allBindings, 'checked', elemValue, true);
            }
        };

        function updateView() {
            // This updates the view value from the model value.
            // It runs in response to changes in the bound (checked) value.
            var modelValue = ko.utils.unwrapObservable(valueAccessor());

            if (isValueArray) {
                // When a checkbox is bound to an array, being checked represents its value being present in that array
                element.checked = ko.utils.arrayIndexOf(modelValue, checkedValue()) >= 0;
            } else if (isCheckbox) {
                // When a checkbox is bound to any other value (not an array), being checked represents the value being trueish
                element.checked = modelValue;
            } else {
                // For radio buttons, being checked means that the radio button's value corresponds to the model value
                element.checked = (checkedValue() === modelValue);
            }
        };

        var isCheckbox = element.type == "checkbox",
            isRadio = element.type == "radio";

        // Only bind to check boxes and radio buttons
        if (!isCheckbox && !isRadio) {
            return;
        }

        var isValueArray = isCheckbox && (ko.utils.unwrapObservable(valueAccessor()) instanceof Array),
            oldElemValue = isValueArray ? checkedValue() : undefined,
            useCheckedValue = isRadio || isValueArray;

        // IE 6 won't allow radio buttons to be selected unless they have a name
        if (isRadio && !element.name)
            ko.bindingHandlers['uniqueName']['init'](element, function() { return true });

        // Set up two computeds to update the binding:

        // The first responds to changes in the checkedValue value and to element clicks
        ko.computed(updateModel, null, { disposeWhenNodeIsRemoved: element });
        ko.utils.registerEventHandler(element, "click", updateModel);

        // The second responds to changes in the model value (the one associated with the checked binding)
        ko.computed(updateView, null, { disposeWhenNodeIsRemoved: element });
    }
};
ko.expressionRewriting.twoWayBindings['checked'] = true;

ko.bindingHandlers['checkedValue'] = {
    'update': function (element, valueAccessor) {
        element.value = ko.utils.unwrapObservable(valueAccessor());
    }
};

})();var classesWrittenByBindingKey = '__ko__cssValue';
ko.bindingHandlers['css'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        if (value !== null && typeof value == "object") {
            ko.utils.objectForEach(value, function(className, shouldHaveClass) {
                shouldHaveClass = ko.utils.unwrapObservable(shouldHaveClass);
                ko.utils.toggleDomNodeCssClass(element, className, shouldHaveClass);
            });
        } else {
            value = String(value || ''); // Make sure we don't try to store or set a non-string value
            ko.utils.toggleDomNodeCssClass(element, element[classesWrittenByBindingKey], false);
            element[classesWrittenByBindingKey] = value;
            ko.utils.toggleDomNodeCssClass(element, value, true);
        }
    }
};
ko.bindingHandlers['enable'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        if (value && element.disabled)
            element.removeAttribute("disabled");
        else if ((!value) && (!element.disabled))
            element.disabled = true;
    }
};

ko.bindingHandlers['disable'] = {
    'update': function (element, valueAccessor) {
        ko.bindingHandlers['enable']['update'](element, function() { return !ko.utils.unwrapObservable(valueAccessor()) });
    }
};
// For certain common events (currently just 'click'), allow a simplified data-binding syntax
// e.g. click:handler instead of the usual full-length event:{click:handler}
function makeEventHandlerShortcut(eventName) {
    ko.bindingHandlers[eventName] = {
        'init': function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            var newValueAccessor = function () {
                var result = {};
                result[eventName] = valueAccessor();
                return result;
            };
            return ko.bindingHandlers['event']['init'].call(this, element, newValueAccessor, allBindings, viewModel, bindingContext);
        }
    }
}

ko.bindingHandlers['event'] = {
    'init' : function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        var eventsToHandle = valueAccessor() || {};
        ko.utils.objectForEach(eventsToHandle, function(eventName) {
            if (typeof eventName == "string") {
                ko.utils.registerEventHandler(element, eventName, function (event) {
                    var handlerReturnValue;
                    var handlerFunction = valueAccessor()[eventName];
                    if (!handlerFunction)
                        return;

                    try {
                        // Take all the event args, and prefix with the viewmodel
                        var argsForHandler = ko.utils.makeArray(arguments);
                        viewModel = bindingContext['$data'];
                        argsForHandler.unshift(viewModel);
                        handlerReturnValue = handlerFunction.apply(viewModel, argsForHandler);
                    } finally {
                        if (handlerReturnValue !== true) { // Normally we want to prevent default action. Developer can override this be explicitly returning true.
                            if (event.preventDefault)
                                event.preventDefault();
                            else
                                event.returnValue = false;
                        }
                    }

                    var bubble = allBindings.get(eventName + 'Bubble') !== false;
                    if (!bubble) {
                        event.cancelBubble = true;
                        if (event.stopPropagation)
                            event.stopPropagation();
                    }
                });
            }
        });
    }
};
// "foreach: someExpression" is equivalent to "template: { foreach: someExpression }"
// "foreach: { data: someExpression, afterAdd: myfn }" is equivalent to "template: { foreach: someExpression, afterAdd: myfn }"
ko.bindingHandlers['foreach'] = {
    makeTemplateValueAccessor: function(valueAccessor) {
        return function() {
            var modelValue = valueAccessor(),
                unwrappedValue = ko.utils.peekObservable(modelValue);    // Unwrap without setting a dependency here

            // If unwrappedValue is the array, pass in the wrapped value on its own
            // The value will be unwrapped and tracked within the template binding
            // (See https://github.com/SteveSanderson/knockout/issues/523)
            if ((!unwrappedValue) || typeof unwrappedValue.length == "number")
                return { 'foreach': modelValue, 'templateEngine': ko.nativeTemplateEngine.instance };

            // If unwrappedValue.data is the array, preserve all relevant options and unwrap again value so we get updates
            ko.utils.unwrapObservable(modelValue);
            return {
                'foreach': unwrappedValue['data'],
                'as': unwrappedValue['as'],
                'includeDestroyed': unwrappedValue['includeDestroyed'],
                'afterAdd': unwrappedValue['afterAdd'],
                'beforeRemove': unwrappedValue['beforeRemove'],
                'afterRender': unwrappedValue['afterRender'],
                'beforeMove': unwrappedValue['beforeMove'],
                'afterMove': unwrappedValue['afterMove'],
                'templateEngine': ko.nativeTemplateEngine.instance
            };
        };
    },
    'init': function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        return ko.bindingHandlers['template']['init'](element, ko.bindingHandlers['foreach'].makeTemplateValueAccessor(valueAccessor));
    },
    'update': function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        return ko.bindingHandlers['template']['update'](element, ko.bindingHandlers['foreach'].makeTemplateValueAccessor(valueAccessor), allBindings, viewModel, bindingContext);
    }
};
ko.expressionRewriting.bindingRewriteValidators['foreach'] = false; // Can't rewrite control flow bindings
ko.virtualElements.allowedBindings['foreach'] = true;
var hasfocusUpdatingProperty = '__ko_hasfocusUpdating';
var hasfocusLastValue = '__ko_hasfocusLastValue';
ko.bindingHandlers['hasfocus'] = {
    'init': function(element, valueAccessor, allBindings) {
        var handleElementFocusChange = function(isFocused) {
            // Where possible, ignore which event was raised and determine focus state using activeElement,
            // as this avoids phantom focus/blur events raised when changing tabs in modern browsers.
            // However, not all KO-targeted browsers (Firefox 2) support activeElement. For those browsers,
            // prevent a loss of focus when changing tabs/windows by setting a flag that prevents hasfocus
            // from calling 'blur()' on the element when it loses focus.
            // Discussion at https://github.com/SteveSanderson/knockout/pull/352
            element[hasfocusUpdatingProperty] = true;
            var ownerDoc = element.ownerDocument;
            if ("activeElement" in ownerDoc) {
                var active;
                try {
                    active = ownerDoc.activeElement;
                } catch(e) {
                    // IE9 throws if you access activeElement during page load (see issue #703)
                    active = ownerDoc.body;
                }
                isFocused = (active === element);
            }
            var modelValue = valueAccessor();
            ko.expressionRewriting.writeValueToProperty(modelValue, allBindings, 'hasfocus', isFocused, true);

            //cache the latest value, so we can avoid unnecessarily calling focus/blur in the update function
            element[hasfocusLastValue] = isFocused;
            element[hasfocusUpdatingProperty] = false;
        };
        var handleElementFocusIn = handleElementFocusChange.bind(null, true);
        var handleElementFocusOut = handleElementFocusChange.bind(null, false);

        ko.utils.registerEventHandler(element, "focus", handleElementFocusIn);
        ko.utils.registerEventHandler(element, "focusin", handleElementFocusIn); // For IE
        ko.utils.registerEventHandler(element, "blur",  handleElementFocusOut);
        ko.utils.registerEventHandler(element, "focusout",  handleElementFocusOut); // For IE
    },
    'update': function(element, valueAccessor) {
        var value = !!ko.utils.unwrapObservable(valueAccessor()); //force boolean to compare with last value
        if (!element[hasfocusUpdatingProperty] && element[hasfocusLastValue] !== value) {
            value ? element.focus() : element.blur();
            ko.dependencyDetection.ignore(ko.utils.triggerEvent, null, [element, value ? "focusin" : "focusout"]); // For IE, which doesn't reliably fire "focus" or "blur" events synchronously
        }
    }
};
ko.expressionRewriting.twoWayBindings['hasfocus'] = true;

ko.bindingHandlers['hasFocus'] = ko.bindingHandlers['hasfocus']; // Make "hasFocus" an alias
ko.expressionRewriting.twoWayBindings['hasFocus'] = true;
ko.bindingHandlers['html'] = {
    'init': function() {
        // Prevent binding on the dynamically-injected HTML (as developers are unlikely to expect that, and it has security implications)
        return { 'controlsDescendantBindings': true };
    },
    'update': function (element, valueAccessor) {
        // setHtml will unwrap the value if needed
        ko.utils.setHtml(element, valueAccessor());
    }
};
// Makes a binding like with or if
function makeWithIfBinding(bindingKey, isWith, isNot, makeContextCallback) {
    ko.bindingHandlers[bindingKey] = {
        'init': function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            var didDisplayOnLastUpdate,
                savedNodes;
            ko.computed(function() {
                var dataValue = ko.utils.unwrapObservable(valueAccessor()),
                    shouldDisplay = !isNot !== !dataValue, // equivalent to isNot ? !dataValue : !!dataValue
                    isFirstRender = !savedNodes,
                    needsRefresh = isFirstRender || isWith || (shouldDisplay !== didDisplayOnLastUpdate);

                if (needsRefresh) {
                    // Save a copy of the inner nodes on the initial update, but only if we have dependencies.
                    if (isFirstRender && ko.computedContext.getDependenciesCount()) {
                        savedNodes = ko.utils.cloneNodes(ko.virtualElements.childNodes(element), true /* shouldCleanNodes */);
                    }

                    if (shouldDisplay) {
                        if (!isFirstRender) {
                            ko.virtualElements.setDomNodeChildren(element, ko.utils.cloneNodes(savedNodes));
                        }
                        ko.applyBindingsToDescendants(makeContextCallback ? makeContextCallback(bindingContext, dataValue) : bindingContext, element);
                    } else {
                        ko.virtualElements.emptyNode(element);
                    }

                    didDisplayOnLastUpdate = shouldDisplay;
                }
            }, null, { disposeWhenNodeIsRemoved: element });
            return { 'controlsDescendantBindings': true };
        }
    };
    ko.expressionRewriting.bindingRewriteValidators[bindingKey] = false; // Can't rewrite control flow bindings
    ko.virtualElements.allowedBindings[bindingKey] = true;
}

// Construct the actual binding handlers
makeWithIfBinding('if');
makeWithIfBinding('ifnot', false /* isWith */, true /* isNot */);
makeWithIfBinding('with', true /* isWith */, false /* isNot */,
    function(bindingContext, dataValue) {
        return bindingContext['createChildContext'](dataValue);
    }
);
var captionPlaceholder = {};
ko.bindingHandlers['options'] = {
    'init': function(element) {
        if (ko.utils.tagNameLower(element) !== "select")
            throw new Error("options binding applies only to SELECT elements");

        // Remove all existing <option>s.
        while (element.length > 0) {
            element.remove(0);
        }

        // Ensures that the binding processor doesn't try to bind the options
        return { 'controlsDescendantBindings': true };
    },
    'update': function (element, valueAccessor, allBindings) {
        function selectedOptions() {
            return ko.utils.arrayFilter(element.options, function (node) { return node.selected; });
        }

        var selectWasPreviouslyEmpty = element.length == 0,
            multiple = element.multiple,
            previousScrollTop = (!selectWasPreviouslyEmpty && multiple) ? element.scrollTop : null,
            unwrappedArray = ko.utils.unwrapObservable(valueAccessor()),
            valueAllowUnset = allBindings.get('valueAllowUnset') && allBindings['has']('value'),
            includeDestroyed = allBindings.get('optionsIncludeDestroyed'),
            arrayToDomNodeChildrenOptions = {},
            captionValue,
            filteredArray,
            previousSelectedValues = [];

        if (!valueAllowUnset) {
            if (multiple) {
                previousSelectedValues = ko.utils.arrayMap(selectedOptions(), ko.selectExtensions.readValue);
            } else if (element.selectedIndex >= 0) {
                previousSelectedValues.push(ko.selectExtensions.readValue(element.options[element.selectedIndex]));
            }
        }

        if (unwrappedArray) {
            if (typeof unwrappedArray.length == "undefined") // Coerce single value into array
                unwrappedArray = [unwrappedArray];

            // Filter out any entries marked as destroyed
            filteredArray = ko.utils.arrayFilter(unwrappedArray, function(item) {
                return includeDestroyed || item === undefined || item === null || !ko.utils.unwrapObservable(item['_destroy']);
            });

            // If caption is included, add it to the array
            if (allBindings['has']('optionsCaption')) {
                captionValue = ko.utils.unwrapObservable(allBindings.get('optionsCaption'));
                // If caption value is null or undefined, don't show a caption
                if (captionValue !== null && captionValue !== undefined) {
                    filteredArray.unshift(captionPlaceholder);
                }
            }
        } else {
            // If a falsy value is provided (e.g. null), we'll simply empty the select element
        }

        function applyToObject(object, predicate, defaultValue) {
            var predicateType = typeof predicate;
            if (predicateType == "function")    // Given a function; run it against the data value
                return predicate(object);
            else if (predicateType == "string") // Given a string; treat it as a property name on the data value
                return object[predicate];
            else                                // Given no optionsText arg; use the data value itself
                return defaultValue;
        }

        // The following functions can run at two different times:
        // The first is when the whole array is being updated directly from this binding handler.
        // The second is when an observable value for a specific array entry is updated.
        // oldOptions will be empty in the first case, but will be filled with the previously generated option in the second.
        var itemUpdate = false;
        function optionForArrayItem(arrayEntry, index, oldOptions) {
            if (oldOptions.length) {
                previousSelectedValues = !valueAllowUnset && oldOptions[0].selected ? [ ko.selectExtensions.readValue(oldOptions[0]) ] : [];
                itemUpdate = true;
            }
            var option = element.ownerDocument.createElement("option");
            if (arrayEntry === captionPlaceholder) {
                ko.utils.setTextContent(option, allBindings.get('optionsCaption'));
                ko.selectExtensions.writeValue(option, undefined);
            } else {
                // Apply a value to the option element
                var optionValue = applyToObject(arrayEntry, allBindings.get('optionsValue'), arrayEntry);
                ko.selectExtensions.writeValue(option, ko.utils.unwrapObservable(optionValue));

                // Apply some text to the option element
                var optionText = applyToObject(arrayEntry, allBindings.get('optionsText'), optionValue);
                ko.utils.setTextContent(option, optionText);
            }
            return [option];
        }

        // By using a beforeRemove callback, we delay the removal until after new items are added. This fixes a selection
        // problem in IE<=8 and Firefox. See https://github.com/knockout/knockout/issues/1208
        arrayToDomNodeChildrenOptions['beforeRemove'] =
            function (option) {
                element.removeChild(option);
            };

        function setSelectionCallback(arrayEntry, newOptions) {
            if (itemUpdate && valueAllowUnset) {
                // The model value is authoritative, so make sure its value is the one selected
                // There is no need to use dependencyDetection.ignore since setDomNodeChildrenFromArrayMapping does so already.
                ko.selectExtensions.writeValue(element, ko.utils.unwrapObservable(allBindings.get('value')), true /* allowUnset */);
            } else if (previousSelectedValues.length) {
                // IE6 doesn't like us to assign selection to OPTION nodes before they're added to the document.
                // That's why we first added them without selection. Now it's time to set the selection.
                var isSelected = ko.utils.arrayIndexOf(previousSelectedValues, ko.selectExtensions.readValue(newOptions[0])) >= 0;
                ko.utils.setOptionNodeSelectionState(newOptions[0], isSelected);

                // If this option was changed from being selected during a single-item update, notify the change
                if (itemUpdate && !isSelected) {
                    ko.dependencyDetection.ignore(ko.utils.triggerEvent, null, [element, "change"]);
                }
            }
        }

        var callback = setSelectionCallback;
        if (allBindings['has']('optionsAfterRender') && typeof allBindings.get('optionsAfterRender') == "function") {
            callback = function(arrayEntry, newOptions) {
                setSelectionCallback(arrayEntry, newOptions);
                ko.dependencyDetection.ignore(allBindings.get('optionsAfterRender'), null, [newOptions[0], arrayEntry !== captionPlaceholder ? arrayEntry : undefined]);
            }
        }

        ko.utils.setDomNodeChildrenFromArrayMapping(element, filteredArray, optionForArrayItem, arrayToDomNodeChildrenOptions, callback);

        ko.dependencyDetection.ignore(function () {
            if (valueAllowUnset) {
                // The model value is authoritative, so make sure its value is the one selected
                ko.selectExtensions.writeValue(element, ko.utils.unwrapObservable(allBindings.get('value')), true /* allowUnset */);
            } else {
                // Determine if the selection has changed as a result of updating the options list
                var selectionChanged;
                if (multiple) {
                    // For a multiple-select box, compare the new selection count to the previous one
                    // But if nothing was selected before, the selection can't have changed
                    selectionChanged = previousSelectedValues.length && selectedOptions().length < previousSelectedValues.length;
                } else {
                    // For a single-select box, compare the current value to the previous value
                    // But if nothing was selected before or nothing is selected now, just look for a change in selection
                    selectionChanged = (previousSelectedValues.length && element.selectedIndex >= 0)
                        ? (ko.selectExtensions.readValue(element.options[element.selectedIndex]) !== previousSelectedValues[0])
                        : (previousSelectedValues.length || element.selectedIndex >= 0);
                }

                // Ensure consistency between model value and selected option.
                // If the dropdown was changed so that selection is no longer the same,
                // notify the value or selectedOptions binding.
                if (selectionChanged) {
                    ko.utils.triggerEvent(element, "change");
                }
            }
        });

        // Workaround for IE bug
        ko.utils.ensureSelectElementIsRenderedCorrectly(element);

        if (previousScrollTop && Math.abs(previousScrollTop - element.scrollTop) > 20)
            element.scrollTop = previousScrollTop;
    }
};
ko.bindingHandlers['options'].optionValueDomDataKey = ko.utils.domData.nextKey();
ko.bindingHandlers['selectedOptions'] = {
    'after': ['options', 'foreach'],
    'init': function (element, valueAccessor, allBindings) {
        ko.utils.registerEventHandler(element, "change", function () {
            var value = valueAccessor(), valueToWrite = [];
            ko.utils.arrayForEach(element.getElementsByTagName("option"), function(node) {
                if (node.selected)
                    valueToWrite.push(ko.selectExtensions.readValue(node));
            });
            ko.expressionRewriting.writeValueToProperty(value, allBindings, 'selectedOptions', valueToWrite);
        });
    },
    'update': function (element, valueAccessor) {
        if (ko.utils.tagNameLower(element) != "select")
            throw new Error("values binding applies only to SELECT elements");

        var newValue = ko.utils.unwrapObservable(valueAccessor());
        if (newValue && typeof newValue.length == "number") {
            ko.utils.arrayForEach(element.getElementsByTagName("option"), function(node) {
                var isSelected = ko.utils.arrayIndexOf(newValue, ko.selectExtensions.readValue(node)) >= 0;
                ko.utils.setOptionNodeSelectionState(node, isSelected);
            });
        }
    }
};
ko.expressionRewriting.twoWayBindings['selectedOptions'] = true;
ko.bindingHandlers['style'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor() || {});
        ko.utils.objectForEach(value, function(styleName, styleValue) {
            styleValue = ko.utils.unwrapObservable(styleValue);

            if (styleValue === null || styleValue === undefined || styleValue === false) {
                // Empty string removes the value, whereas null/undefined have no effect
                styleValue = "";
            }

            element.style[styleName] = styleValue;
        });
    }
};
ko.bindingHandlers['submit'] = {
    'init': function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        if (typeof valueAccessor() != "function")
            throw new Error("The value for a submit binding must be a function");
        ko.utils.registerEventHandler(element, "submit", function (event) {
            var handlerReturnValue;
            var value = valueAccessor();
            try { handlerReturnValue = value.call(bindingContext['$data'], element); }
            finally {
                if (handlerReturnValue !== true) { // Normally we want to prevent default action. Developer can override this be explicitly returning true.
                    if (event.preventDefault)
                        event.preventDefault();
                    else
                        event.returnValue = false;
                }
            }
        });
    }
};
ko.bindingHandlers['text'] = {
    'init': function() {
        // Prevent binding on the dynamically-injected text node (as developers are unlikely to expect that, and it has security implications).
        // It should also make things faster, as we no longer have to consider whether the text node might be bindable.
        return { 'controlsDescendantBindings': true };
    },
    'update': function (element, valueAccessor) {
        ko.utils.setTextContent(element, valueAccessor());
    }
};
ko.virtualElements.allowedBindings['text'] = true;
(function () {

if (window && window.navigator) {
    var parseVersion = function (matches) {
        if (matches) {
            return parseFloat(matches[1]);
        }
    };

    // Detect various browser versions because some old versions don't fully support the 'input' event
    var operaVersion = window.opera && window.opera.version && parseInt(window.opera.version()),
        userAgent = window.navigator.userAgent,
        safariVersion = parseVersion(userAgent.match(/^(?:(?!chrome).)*version\/([^ ]*) safari/i)),
        firefoxVersion = parseVersion(userAgent.match(/Firefox\/([^ ]*)/));
}

// IE 8 and 9 have bugs that prevent the normal events from firing when the value changes.
// But it does fire the 'selectionchange' event on many of those, presumably because the
// cursor is moving and that counts as the selection changing. The 'selectionchange' event is
// fired at the document level only and doesn't directly indicate which element changed. We
// set up just one event handler for the document and use 'activeElement' to determine which
// element was changed.
if (ko.utils.ieVersion < 10) {
    var selectionChangeRegisteredName = ko.utils.domData.nextKey(),
        selectionChangeHandlerName = ko.utils.domData.nextKey();
    var selectionChangeHandler = function(event) {
        var target = this.activeElement,
            handler = target && ko.utils.domData.get(target, selectionChangeHandlerName);
        if (handler) {
            handler(event);
        }
    };
    var registerForSelectionChangeEvent = function (element, handler) {
        var ownerDoc = element.ownerDocument;
        if (!ko.utils.domData.get(ownerDoc, selectionChangeRegisteredName)) {
            ko.utils.domData.set(ownerDoc, selectionChangeRegisteredName, true);
            ko.utils.registerEventHandler(ownerDoc, 'selectionchange', selectionChangeHandler);
        }
        ko.utils.domData.set(element, selectionChangeHandlerName, handler);
    };
}

ko.bindingHandlers['textInput'] = {
    'init': function (element, valueAccessor, allBindings) {

        var previousElementValue = element.value,
            timeoutHandle,
            elementValueBeforeEvent;

        var updateModel = function (event) {
            clearTimeout(timeoutHandle);
            elementValueBeforeEvent = timeoutHandle = undefined;

            var elementValue = element.value;
            if (previousElementValue !== elementValue) {
                // Provide a way for tests to know exactly which event was processed
                if (DEBUG && event) element['_ko_textInputProcessedEvent'] = event.type;
                previousElementValue = elementValue;
                ko.expressionRewriting.writeValueToProperty(valueAccessor(), allBindings, 'textInput', elementValue);
            }
        };

        var deferUpdateModel = function (event) {
            if (!timeoutHandle) {
                // The elementValueBeforeEvent variable is set *only* during the brief gap between an
                // event firing and the updateModel function running. This allows us to ignore model
                // updates that are from the previous state of the element, usually due to techniques
                // such as rateLimit. Such updates, if not ignored, can cause keystrokes to be lost.
                elementValueBeforeEvent = element.value;
                var handler = DEBUG ? updateModel.bind(element, {type: event.type}) : updateModel;
                timeoutHandle = setTimeout(handler, 4);
            }
        };

        var updateView = function () {
            var modelValue = ko.utils.unwrapObservable(valueAccessor());

            if (modelValue === null || modelValue === undefined) {
                modelValue = '';
            }

            if (elementValueBeforeEvent !== undefined && modelValue === elementValueBeforeEvent) {
                setTimeout(updateView, 4);
                return;
            }

            // Update the element only if the element and model are different. On some browsers, updating the value
            // will move the cursor to the end of the input, which would be bad while the user is typing.
            if (element.value !== modelValue) {
                previousElementValue = modelValue;  // Make sure we ignore events (propertychange) that result from updating the value
                element.value = modelValue;
            }
        };

        var onEvent = function (event, handler) {
            ko.utils.registerEventHandler(element, event, handler);
        };

        if (DEBUG && ko.bindingHandlers['textInput']['_forceUpdateOn']) {
            // Provide a way for tests to specify exactly which events are bound
            ko.utils.arrayForEach(ko.bindingHandlers['textInput']['_forceUpdateOn'], function(eventName) {
                if (eventName.slice(0,5) == 'after') {
                    onEvent(eventName.slice(5), deferUpdateModel);
                } else {
                    onEvent(eventName, updateModel);
                }
            });
        } else {
            if (ko.utils.ieVersion < 10) {
                // Internet Explorer <= 8 doesn't support the 'input' event, but does include 'propertychange' that fires whenever
                // any property of an element changes. Unlike 'input', it also fires if a property is changed from JavaScript code,
                // but that's an acceptable compromise for this binding. IE 9 does support 'input', but since it doesn't fire it
                // when using autocomplete, we'll use 'propertychange' for it also.
                onEvent('propertychange', function(event) {
                    if (event.propertyName === 'value') {
                        updateModel(event);
                    }
                });

                if (ko.utils.ieVersion == 8) {
                    // IE 8 has a bug where it fails to fire 'propertychange' on the first update following a value change from
                    // JavaScript code. It also doesn't fire if you clear the entire value. To fix this, we bind to the following
                    // events too.
                    onEvent('keyup', updateModel);      // A single keystoke
                    onEvent('keydown', updateModel);    // The first character when a key is held down
                }
                if (ko.utils.ieVersion >= 8) {
                    // Internet Explorer 9 doesn't fire the 'input' event when deleting text, including using
                    // the backspace, delete, or ctrl-x keys, clicking the 'x' to clear the input, dragging text
                    // out of the field, and cutting or deleting text using the context menu. 'selectionchange'
                    // can detect all of those except dragging text out of the field, for which we use 'dragend'.
                    // These are also needed in IE8 because of the bug described above.
                    registerForSelectionChangeEvent(element, updateModel);  // 'selectionchange' covers cut, paste, drop, delete, etc.
                    onEvent('dragend', deferUpdateModel);
                }
            } else {
                // All other supported browsers support the 'input' event, which fires whenever the content of the element is changed
                // through the user interface.
                onEvent('input', updateModel);

                if (safariVersion < 5 && ko.utils.tagNameLower(element) === "textarea") {
                    // Safari <5 doesn't fire the 'input' event for <textarea> elements (it does fire 'textInput'
                    // but only when typing). So we'll just catch as much as we can with keydown, cut, and paste.
                    onEvent('keydown', deferUpdateModel);
                    onEvent('paste', deferUpdateModel);
                    onEvent('cut', deferUpdateModel);
                } else if (operaVersion < 11) {
                    // Opera 10 doesn't always fire the 'input' event for cut, paste, undo & drop operations.
                    // We can try to catch some of those using 'keydown'.
                    onEvent('keydown', deferUpdateModel);
                } else if (firefoxVersion < 4.0) {
                    // Firefox <= 3.6 doesn't fire the 'input' event when text is filled in through autocomplete
                    onEvent('DOMAutoComplete', updateModel);

                    // Firefox <=3.5 doesn't fire the 'input' event when text is dropped into the input.
                    onEvent('dragdrop', updateModel);       // <3.5
                    onEvent('drop', updateModel);           // 3.5
                }
            }
        }

        // Bind to the change event so that we can catch programmatic updates of the value that fire this event.
        onEvent('change', updateModel);

        ko.computed(updateView, null, { disposeWhenNodeIsRemoved: element });
    }
};
ko.expressionRewriting.twoWayBindings['textInput'] = true;

// textinput is an alias for textInput
ko.bindingHandlers['textinput'] = {
    // preprocess is the only way to set up a full alias
    'preprocess': function (value, name, addBinding) {
        addBinding('textInput', value);
    }
};

})();ko.bindingHandlers['uniqueName'] = {
    'init': function (element, valueAccessor) {
        if (valueAccessor()) {
            var name = "ko_unique_" + (++ko.bindingHandlers['uniqueName'].currentIndex);
            ko.utils.setElementName(element, name);
        }
    }
};
ko.bindingHandlers['uniqueName'].currentIndex = 0;
ko.bindingHandlers['value'] = {
    'after': ['options', 'foreach'],
    'init': function (element, valueAccessor, allBindings) {
        // If the value binding is placed on a radio/checkbox, then just pass through to checkedValue and quit
        if (element.tagName.toLowerCase() == "input" && (element.type == "checkbox" || element.type == "radio")) {
            ko.applyBindingAccessorsToNode(element, { 'checkedValue': valueAccessor });
            return;
        }

        // Always catch "change" event; possibly other events too if asked
        var eventsToCatch = ["change"];
        var requestedEventsToCatch = allBindings.get("valueUpdate");
        var propertyChangedFired = false;
        var elementValueBeforeEvent = null;

        if (requestedEventsToCatch) {
            if (typeof requestedEventsToCatch == "string") // Allow both individual event names, and arrays of event names
                requestedEventsToCatch = [requestedEventsToCatch];
            ko.utils.arrayPushAll(eventsToCatch, requestedEventsToCatch);
            eventsToCatch = ko.utils.arrayGetDistinctValues(eventsToCatch);
        }

        var valueUpdateHandler = function() {
            elementValueBeforeEvent = null;
            propertyChangedFired = false;
            var modelValue = valueAccessor();
            var elementValue = ko.selectExtensions.readValue(element);
            ko.expressionRewriting.writeValueToProperty(modelValue, allBindings, 'value', elementValue);
        }

        // Workaround for https://github.com/SteveSanderson/knockout/issues/122
        // IE doesn't fire "change" events on textboxes if the user selects a value from its autocomplete list
        var ieAutoCompleteHackNeeded = ko.utils.ieVersion && element.tagName.toLowerCase() == "input" && element.type == "text"
                                       && element.autocomplete != "off" && (!element.form || element.form.autocomplete != "off");
        if (ieAutoCompleteHackNeeded && ko.utils.arrayIndexOf(eventsToCatch, "propertychange") == -1) {
            ko.utils.registerEventHandler(element, "propertychange", function () { propertyChangedFired = true });
            ko.utils.registerEventHandler(element, "focus", function () { propertyChangedFired = false });
            ko.utils.registerEventHandler(element, "blur", function() {
                if (propertyChangedFired) {
                    valueUpdateHandler();
                }
            });
        }

        ko.utils.arrayForEach(eventsToCatch, function(eventName) {
            // The syntax "after<eventname>" means "run the handler asynchronously after the event"
            // This is useful, for example, to catch "keydown" events after the browser has updated the control
            // (otherwise, ko.selectExtensions.readValue(this) will receive the control's value *before* the key event)
            var handler = valueUpdateHandler;
            if (ko.utils.stringStartsWith(eventName, "after")) {
                handler = function() {
                    // The elementValueBeforeEvent variable is non-null *only* during the brief gap between
                    // a keyX event firing and the valueUpdateHandler running, which is scheduled to happen
                    // at the earliest asynchronous opportunity. We store this temporary information so that
                    // if, between keyX and valueUpdateHandler, the underlying model value changes separately,
                    // we can overwrite that model value change with the value the user just typed. Otherwise,
                    // techniques like rateLimit can trigger model changes at critical moments that will
                    // override the user's inputs, causing keystrokes to be lost.
                    elementValueBeforeEvent = ko.selectExtensions.readValue(element);
                    setTimeout(valueUpdateHandler, 0);
                };
                eventName = eventName.substring("after".length);
            }
            ko.utils.registerEventHandler(element, eventName, handler);
        });

        var updateFromModel = function () {
            var newValue = ko.utils.unwrapObservable(valueAccessor());
            var elementValue = ko.selectExtensions.readValue(element);

            if (elementValueBeforeEvent !== null && newValue === elementValueBeforeEvent) {
                setTimeout(updateFromModel, 0);
                return;
            }

            var valueHasChanged = (newValue !== elementValue);

            if (valueHasChanged) {
                if (ko.utils.tagNameLower(element) === "select") {
                    var allowUnset = allBindings.get('valueAllowUnset');
                    var applyValueAction = function () {
                        ko.selectExtensions.writeValue(element, newValue, allowUnset);
                    };
                    applyValueAction();

                    if (!allowUnset && newValue !== ko.selectExtensions.readValue(element)) {
                        // If you try to set a model value that can't be represented in an already-populated dropdown, reject that change,
                        // because you're not allowed to have a model value that disagrees with a visible UI selection.
                        ko.dependencyDetection.ignore(ko.utils.triggerEvent, null, [element, "change"]);
                    } else {
                        // Workaround for IE6 bug: It won't reliably apply values to SELECT nodes during the same execution thread
                        // right after you've changed the set of OPTION nodes on it. So for that node type, we'll schedule a second thread
                        // to apply the value as well.
                        setTimeout(applyValueAction, 0);
                    }
                } else {
                    ko.selectExtensions.writeValue(element, newValue);
                }
            }
        };

        ko.computed(updateFromModel, null, { disposeWhenNodeIsRemoved: element });
    },
    'update': function() {} // Keep for backwards compatibility with code that may have wrapped value binding
};
ko.expressionRewriting.twoWayBindings['value'] = true;
ko.bindingHandlers['visible'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        var isCurrentlyVisible = !(element.style.display == "none");
        if (value && !isCurrentlyVisible)
            element.style.display = "";
        else if ((!value) && isCurrentlyVisible)
            element.style.display = "none";
    }
};
// 'click' is just a shorthand for the usual full-length event:{click:handler}
makeEventHandlerShortcut('click');
// If you want to make a custom template engine,
//
// [1] Inherit from this class (like ko.nativeTemplateEngine does)
// [2] Override 'renderTemplateSource', supplying a function with this signature:
//
//        function (templateSource, bindingContext, options) {
//            // - templateSource.text() is the text of the template you should render
//            // - bindingContext.$data is the data you should pass into the template
//            //   - you might also want to make bindingContext.$parent, bindingContext.$parents,
//            //     and bindingContext.$root available in the template too
//            // - options gives you access to any other properties set on "data-bind: { template: options }"
//            // - templateDocument is the document object of the template
//            //
//            // Return value: an array of DOM nodes
//        }
//
// [3] Override 'createJavaScriptEvaluatorBlock', supplying a function with this signature:
//
//        function (script) {
//            // Return value: Whatever syntax means "Evaluate the JavaScript statement 'script' and output the result"
//            //               For example, the jquery.tmpl template engine converts 'someScript' to '${ someScript }'
//        }
//
//     This is only necessary if you want to allow data-bind attributes to reference arbitrary template variables.
//     If you don't want to allow that, you can set the property 'allowTemplateRewriting' to false (like ko.nativeTemplateEngine does)
//     and then you don't need to override 'createJavaScriptEvaluatorBlock'.

ko.templateEngine = function () { };

ko.templateEngine.prototype['renderTemplateSource'] = function (templateSource, bindingContext, options, templateDocument) {
    throw new Error("Override renderTemplateSource");
};

ko.templateEngine.prototype['createJavaScriptEvaluatorBlock'] = function (script) {
    throw new Error("Override createJavaScriptEvaluatorBlock");
};

ko.templateEngine.prototype['makeTemplateSource'] = function(template, templateDocument) {
    // Named template
    if (typeof template == "string") {
        templateDocument = templateDocument || document;
        var elem = templateDocument.getElementById(template);
        if (!elem)
            throw new Error("Cannot find template with ID " + template);
        return new ko.templateSources.domElement(elem);
    } else if ((template.nodeType == 1) || (template.nodeType == 8)) {
        // Anonymous template
        return new ko.templateSources.anonymousTemplate(template);
    } else
        throw new Error("Unknown template type: " + template);
};

ko.templateEngine.prototype['renderTemplate'] = function (template, bindingContext, options, templateDocument) {
    var templateSource = this['makeTemplateSource'](template, templateDocument);
    return this['renderTemplateSource'](templateSource, bindingContext, options, templateDocument);
};

ko.templateEngine.prototype['isTemplateRewritten'] = function (template, templateDocument) {
    // Skip rewriting if requested
    if (this['allowTemplateRewriting'] === false)
        return true;
    return this['makeTemplateSource'](template, templateDocument)['data']("isRewritten");
};

ko.templateEngine.prototype['rewriteTemplate'] = function (template, rewriterCallback, templateDocument) {
    var templateSource = this['makeTemplateSource'](template, templateDocument);
    var rewritten = rewriterCallback(templateSource['text']());
    templateSource['text'](rewritten);
    templateSource['data']("isRewritten", true);
};

ko.exportSymbol('templateEngine', ko.templateEngine);

ko.templateRewriting = (function () {
    var memoizeDataBindingAttributeSyntaxRegex = /(<([a-z]+\d*)(?:\s+(?!data-bind\s*=\s*)[a-z0-9\-]+(?:=(?:\"[^\"]*\"|\'[^\']*\'|[^>]*))?)*\s+)data-bind\s*=\s*(["'])([\s\S]*?)\3/gi;
    var memoizeVirtualContainerBindingSyntaxRegex = /<!--\s*ko\b\s*([\s\S]*?)\s*-->/g;

    function validateDataBindValuesForRewriting(keyValueArray) {
        var allValidators = ko.expressionRewriting.bindingRewriteValidators;
        for (var i = 0; i < keyValueArray.length; i++) {
            var key = keyValueArray[i]['key'];
            if (allValidators.hasOwnProperty(key)) {
                var validator = allValidators[key];

                if (typeof validator === "function") {
                    var possibleErrorMessage = validator(keyValueArray[i]['value']);
                    if (possibleErrorMessage)
                        throw new Error(possibleErrorMessage);
                } else if (!validator) {
                    throw new Error("This template engine does not support the '" + key + "' binding within its templates");
                }
            }
        }
    }

    function constructMemoizedTagReplacement(dataBindAttributeValue, tagToRetain, nodeName, templateEngine) {
        var dataBindKeyValueArray = ko.expressionRewriting.parseObjectLiteral(dataBindAttributeValue);
        validateDataBindValuesForRewriting(dataBindKeyValueArray);
        var rewrittenDataBindAttributeValue = ko.expressionRewriting.preProcessBindings(dataBindKeyValueArray, {'valueAccessors':true});

        // For no obvious reason, Opera fails to evaluate rewrittenDataBindAttributeValue unless it's wrapped in an additional
        // anonymous function, even though Opera's built-in debugger can evaluate it anyway. No other browser requires this
        // extra indirection.
        var applyBindingsToNextSiblingScript =
            "ko.__tr_ambtns(function($context,$element){return(function(){return{ " + rewrittenDataBindAttributeValue + " } })()},'" + nodeName.toLowerCase() + "')";
        return templateEngine['createJavaScriptEvaluatorBlock'](applyBindingsToNextSiblingScript) + tagToRetain;
    }

    return {
        ensureTemplateIsRewritten: function (template, templateEngine, templateDocument) {
            if (!templateEngine['isTemplateRewritten'](template, templateDocument))
                templateEngine['rewriteTemplate'](template, function (htmlString) {
                    return ko.templateRewriting.memoizeBindingAttributeSyntax(htmlString, templateEngine);
                }, templateDocument);
        },

        memoizeBindingAttributeSyntax: function (htmlString, templateEngine) {
            return htmlString.replace(memoizeDataBindingAttributeSyntaxRegex, function () {
                return constructMemoizedTagReplacement(/* dataBindAttributeValue: */ arguments[4], /* tagToRetain: */ arguments[1], /* nodeName: */ arguments[2], templateEngine);
            }).replace(memoizeVirtualContainerBindingSyntaxRegex, function() {
                return constructMemoizedTagReplacement(/* dataBindAttributeValue: */ arguments[1], /* tagToRetain: */ "<!-- ko -->", /* nodeName: */ "#comment", templateEngine);
            });
        },

        applyMemoizedBindingsToNextSibling: function (bindings, nodeName) {
            return ko.memoization.memoize(function (domNode, bindingContext) {
                var nodeToBind = domNode.nextSibling;
                if (nodeToBind && nodeToBind.nodeName.toLowerCase() === nodeName) {
                    ko.applyBindingAccessorsToNode(nodeToBind, bindings, bindingContext);
                }
            });
        }
    }
})();


// Exported only because it has to be referenced by string lookup from within rewritten template
ko.exportSymbol('__tr_ambtns', ko.templateRewriting.applyMemoizedBindingsToNextSibling);
(function() {
    // A template source represents a read/write way of accessing a template. This is to eliminate the need for template loading/saving
    // logic to be duplicated in every template engine (and means they can all work with anonymous templates, etc.)
    //
    // Two are provided by default:
    //  1. ko.templateSources.domElement       - reads/writes the text content of an arbitrary DOM element
    //  2. ko.templateSources.anonymousElement - uses ko.utils.domData to read/write text *associated* with the DOM element, but
    //                                           without reading/writing the actual element text content, since it will be overwritten
    //                                           with the rendered template output.
    // You can implement your own template source if you want to fetch/store templates somewhere other than in DOM elements.
    // Template sources need to have the following functions:
    //   text() 			- returns the template text from your storage location
    //   text(value)		- writes the supplied template text to your storage location
    //   data(key)			- reads values stored using data(key, value) - see below
    //   data(key, value)	- associates "value" with this template and the key "key". Is used to store information like "isRewritten".
    //
    // Optionally, template sources can also have the following functions:
    //   nodes()            - returns a DOM element containing the nodes of this template, where available
    //   nodes(value)       - writes the given DOM element to your storage location
    // If a DOM element is available for a given template source, template engines are encouraged to use it in preference over text()
    // for improved speed. However, all templateSources must supply text() even if they don't supply nodes().
    //
    // Once you've implemented a templateSource, make your template engine use it by subclassing whatever template engine you were
    // using and overriding "makeTemplateSource" to return an instance of your custom template source.

    ko.templateSources = {};

    // ---- ko.templateSources.domElement -----

    ko.templateSources.domElement = function(element) {
        this.domElement = element;
    }

    ko.templateSources.domElement.prototype['text'] = function(/* valueToWrite */) {
        var tagNameLower = ko.utils.tagNameLower(this.domElement),
            elemContentsProperty = tagNameLower === "script" ? "text"
                                 : tagNameLower === "textarea" ? "value"
                                 : "innerHTML";

        if (arguments.length == 0) {
            return this.domElement[elemContentsProperty];
        } else {
            var valueToWrite = arguments[0];
            if (elemContentsProperty === "innerHTML")
                ko.utils.setHtml(this.domElement, valueToWrite);
            else
                this.domElement[elemContentsProperty] = valueToWrite;
        }
    };

    var dataDomDataPrefix = ko.utils.domData.nextKey() + "_";
    ko.templateSources.domElement.prototype['data'] = function(key /*, valueToWrite */) {
        if (arguments.length === 1) {
            return ko.utils.domData.get(this.domElement, dataDomDataPrefix + key);
        } else {
            ko.utils.domData.set(this.domElement, dataDomDataPrefix + key, arguments[1]);
        }
    };

    // ---- ko.templateSources.anonymousTemplate -----
    // Anonymous templates are normally saved/retrieved as DOM nodes through "nodes".
    // For compatibility, you can also read "text"; it will be serialized from the nodes on demand.
    // Writing to "text" is still supported, but then the template data will not be available as DOM nodes.

    var anonymousTemplatesDomDataKey = ko.utils.domData.nextKey();
    ko.templateSources.anonymousTemplate = function(element) {
        this.domElement = element;
    }
    ko.templateSources.anonymousTemplate.prototype = new ko.templateSources.domElement();
    ko.templateSources.anonymousTemplate.prototype.constructor = ko.templateSources.anonymousTemplate;
    ko.templateSources.anonymousTemplate.prototype['text'] = function(/* valueToWrite */) {
        if (arguments.length == 0) {
            var templateData = ko.utils.domData.get(this.domElement, anonymousTemplatesDomDataKey) || {};
            if (templateData.textData === undefined && templateData.containerData)
                templateData.textData = templateData.containerData.innerHTML;
            return templateData.textData;
        } else {
            var valueToWrite = arguments[0];
            ko.utils.domData.set(this.domElement, anonymousTemplatesDomDataKey, {textData: valueToWrite});
        }
    };
    ko.templateSources.domElement.prototype['nodes'] = function(/* valueToWrite */) {
        if (arguments.length == 0) {
            var templateData = ko.utils.domData.get(this.domElement, anonymousTemplatesDomDataKey) || {};
            return templateData.containerData;
        } else {
            var valueToWrite = arguments[0];
            ko.utils.domData.set(this.domElement, anonymousTemplatesDomDataKey, {containerData: valueToWrite});
        }
    };

    ko.exportSymbol('templateSources', ko.templateSources);
    ko.exportSymbol('templateSources.domElement', ko.templateSources.domElement);
    ko.exportSymbol('templateSources.anonymousTemplate', ko.templateSources.anonymousTemplate);
})();
(function () {
    var _templateEngine;
    ko.setTemplateEngine = function (templateEngine) {
        if ((templateEngine != undefined) && !(templateEngine instanceof ko.templateEngine))
            throw new Error("templateEngine must inherit from ko.templateEngine");
        _templateEngine = templateEngine;
    }

    function invokeForEachNodeInContinuousRange(firstNode, lastNode, action) {
        var node, nextInQueue = firstNode, firstOutOfRangeNode = ko.virtualElements.nextSibling(lastNode);
        while (nextInQueue && ((node = nextInQueue) !== firstOutOfRangeNode)) {
            nextInQueue = ko.virtualElements.nextSibling(node);
            action(node, nextInQueue);
        }
    }

    function activateBindingsOnContinuousNodeArray(continuousNodeArray, bindingContext) {
        // To be used on any nodes that have been rendered by a template and have been inserted into some parent element
        // Walks through continuousNodeArray (which *must* be continuous, i.e., an uninterrupted sequence of sibling nodes, because
        // the algorithm for walking them relies on this), and for each top-level item in the virtual-element sense,
        // (1) Does a regular "applyBindings" to associate bindingContext with this node and to activate any non-memoized bindings
        // (2) Unmemoizes any memos in the DOM subtree (e.g., to activate bindings that had been memoized during template rewriting)

        if (continuousNodeArray.length) {
            var firstNode = continuousNodeArray[0],
                lastNode = continuousNodeArray[continuousNodeArray.length - 1],
                parentNode = firstNode.parentNode,
                provider = ko.bindingProvider['instance'],
                preprocessNode = provider['preprocessNode'];

            if (preprocessNode) {
                invokeForEachNodeInContinuousRange(firstNode, lastNode, function(node, nextNodeInRange) {
                    var nodePreviousSibling = node.previousSibling;
                    var newNodes = preprocessNode.call(provider, node);
                    if (newNodes) {
                        if (node === firstNode)
                            firstNode = newNodes[0] || nextNodeInRange;
                        if (node === lastNode)
                            lastNode = newNodes[newNodes.length - 1] || nodePreviousSibling;
                    }
                });

                // Because preprocessNode can change the nodes, including the first and last nodes, update continuousNodeArray to match.
                // We need the full set, including inner nodes, because the unmemoize step might remove the first node (and so the real
                // first node needs to be in the array).
                continuousNodeArray.length = 0;
                if (!firstNode) { // preprocessNode might have removed all the nodes, in which case there's nothing left to do
                    return;
                }
                if (firstNode === lastNode) {
                    continuousNodeArray.push(firstNode);
                } else {
                    continuousNodeArray.push(firstNode, lastNode);
                    ko.utils.fixUpContinuousNodeArray(continuousNodeArray, parentNode);
                }
            }

            // Need to applyBindings *before* unmemoziation, because unmemoization might introduce extra nodes (that we don't want to re-bind)
            // whereas a regular applyBindings won't introduce new memoized nodes
            invokeForEachNodeInContinuousRange(firstNode, lastNode, function(node) {
                if (node.nodeType === 1 || node.nodeType === 8)
                    ko.applyBindings(bindingContext, node);
            });
            invokeForEachNodeInContinuousRange(firstNode, lastNode, function(node) {
                if (node.nodeType === 1 || node.nodeType === 8)
                    ko.memoization.unmemoizeDomNodeAndDescendants(node, [bindingContext]);
            });

            // Make sure any changes done by applyBindings or unmemoize are reflected in the array
            ko.utils.fixUpContinuousNodeArray(continuousNodeArray, parentNode);
        }
    }

    function getFirstNodeFromPossibleArray(nodeOrNodeArray) {
        return nodeOrNodeArray.nodeType ? nodeOrNodeArray
                                        : nodeOrNodeArray.length > 0 ? nodeOrNodeArray[0]
                                        : null;
    }

    function executeTemplate(targetNodeOrNodeArray, renderMode, template, bindingContext, options) {
        options = options || {};
        var firstTargetNode = targetNodeOrNodeArray && getFirstNodeFromPossibleArray(targetNodeOrNodeArray);
        var templateDocument = (firstTargetNode || template || {}).ownerDocument;
        var templateEngineToUse = (options['templateEngine'] || _templateEngine);
        ko.templateRewriting.ensureTemplateIsRewritten(template, templateEngineToUse, templateDocument);
        var renderedNodesArray = templateEngineToUse['renderTemplate'](template, bindingContext, options, templateDocument);

        // Loosely check result is an array of DOM nodes
        if ((typeof renderedNodesArray.length != "number") || (renderedNodesArray.length > 0 && typeof renderedNodesArray[0].nodeType != "number"))
            throw new Error("Template engine must return an array of DOM nodes");

        var haveAddedNodesToParent = false;
        switch (renderMode) {
            case "replaceChildren":
                ko.virtualElements.setDomNodeChildren(targetNodeOrNodeArray, renderedNodesArray);
                haveAddedNodesToParent = true;
                break;
            case "replaceNode":
                ko.utils.replaceDomNodes(targetNodeOrNodeArray, renderedNodesArray);
                haveAddedNodesToParent = true;
                break;
            case "ignoreTargetNode": break;
            default:
                throw new Error("Unknown renderMode: " + renderMode);
        }

        if (haveAddedNodesToParent) {
            activateBindingsOnContinuousNodeArray(renderedNodesArray, bindingContext);
            if (options['afterRender'])
                ko.dependencyDetection.ignore(options['afterRender'], null, [renderedNodesArray, bindingContext['$data']]);
        }

        return renderedNodesArray;
    }

    function resolveTemplateName(template, data, context) {
        // The template can be specified as:
        if (ko.isObservable(template)) {
            // 1. An observable, with string value
            return template();
        } else if (typeof template === 'function') {
            // 2. A function of (data, context) returning a string
            return template(data, context);
        } else {
            // 3. A string
            return template;
        }
    }

    ko.renderTemplate = function (template, dataOrBindingContext, options, targetNodeOrNodeArray, renderMode) {
        options = options || {};
        if ((options['templateEngine'] || _templateEngine) == undefined)
            throw new Error("Set a template engine before calling renderTemplate");
        renderMode = renderMode || "replaceChildren";

        if (targetNodeOrNodeArray) {
            var firstTargetNode = getFirstNodeFromPossibleArray(targetNodeOrNodeArray);

            var whenToDispose = function () { return (!firstTargetNode) || !ko.utils.domNodeIsAttachedToDocument(firstTargetNode); }; // Passive disposal (on next evaluation)
            var activelyDisposeWhenNodeIsRemoved = (firstTargetNode && renderMode == "replaceNode") ? firstTargetNode.parentNode : firstTargetNode;

            return ko.dependentObservable( // So the DOM is automatically updated when any dependency changes
                function () {
                    // Ensure we've got a proper binding context to work with
                    var bindingContext = (dataOrBindingContext && (dataOrBindingContext instanceof ko.bindingContext))
                        ? dataOrBindingContext
                        : new ko.bindingContext(ko.utils.unwrapObservable(dataOrBindingContext));

                    var templateName = resolveTemplateName(template, bindingContext['$data'], bindingContext),
                        renderedNodesArray = executeTemplate(targetNodeOrNodeArray, renderMode, templateName, bindingContext, options);

                    if (renderMode == "replaceNode") {
                        targetNodeOrNodeArray = renderedNodesArray;
                        firstTargetNode = getFirstNodeFromPossibleArray(targetNodeOrNodeArray);
                    }
                },
                null,
                { disposeWhen: whenToDispose, disposeWhenNodeIsRemoved: activelyDisposeWhenNodeIsRemoved }
            );
        } else {
            // We don't yet have a DOM node to evaluate, so use a memo and render the template later when there is a DOM node
            return ko.memoization.memoize(function (domNode) {
                ko.renderTemplate(template, dataOrBindingContext, options, domNode, "replaceNode");
            });
        }
    };

    ko.renderTemplateForEach = function (template, arrayOrObservableArray, options, targetNode, parentBindingContext) {
        // Since setDomNodeChildrenFromArrayMapping always calls executeTemplateForArrayItem and then
        // activateBindingsCallback for added items, we can store the binding context in the former to use in the latter.
        var arrayItemContext;

        // This will be called by setDomNodeChildrenFromArrayMapping to get the nodes to add to targetNode
        var executeTemplateForArrayItem = function (arrayValue, index) {
            // Support selecting template as a function of the data being rendered
            arrayItemContext = parentBindingContext['createChildContext'](arrayValue, options['as'], function(context) {
                context['$index'] = index;
            });

            var templateName = resolveTemplateName(template, arrayValue, arrayItemContext);
            return executeTemplate(null, "ignoreTargetNode", templateName, arrayItemContext, options);
        }

        // This will be called whenever setDomNodeChildrenFromArrayMapping has added nodes to targetNode
        var activateBindingsCallback = function(arrayValue, addedNodesArray, index) {
            activateBindingsOnContinuousNodeArray(addedNodesArray, arrayItemContext);
            if (options['afterRender'])
                options['afterRender'](addedNodesArray, arrayValue);

            // release the "cache" variable, so that it can be collected by
            // the GC when its value isn't used from within the bindings anymore.
            arrayItemContext = null;
        };

        return ko.dependentObservable(function () {
            var unwrappedArray = ko.utils.unwrapObservable(arrayOrObservableArray) || [];
            if (typeof unwrappedArray.length == "undefined") // Coerce single value into array
                unwrappedArray = [unwrappedArray];

            // Filter out any entries marked as destroyed
            var filteredArray = ko.utils.arrayFilter(unwrappedArray, function(item) {
                return options['includeDestroyed'] || item === undefined || item === null || !ko.utils.unwrapObservable(item['_destroy']);
            });

            // Call setDomNodeChildrenFromArrayMapping, ignoring any observables unwrapped within (most likely from a callback function).
            // If the array items are observables, though, they will be unwrapped in executeTemplateForArrayItem and managed within setDomNodeChildrenFromArrayMapping.
            ko.dependencyDetection.ignore(ko.utils.setDomNodeChildrenFromArrayMapping, null, [targetNode, filteredArray, executeTemplateForArrayItem, options, activateBindingsCallback]);

        }, null, { disposeWhenNodeIsRemoved: targetNode });
    };

    var templateComputedDomDataKey = ko.utils.domData.nextKey();
    function disposeOldComputedAndStoreNewOne(element, newComputed) {
        var oldComputed = ko.utils.domData.get(element, templateComputedDomDataKey);
        if (oldComputed && (typeof(oldComputed.dispose) == 'function'))
            oldComputed.dispose();
        ko.utils.domData.set(element, templateComputedDomDataKey, (newComputed && newComputed.isActive()) ? newComputed : undefined);
    }

    ko.bindingHandlers['template'] = {
        'init': function(element, valueAccessor) {
            // Support anonymous templates
            var bindingValue = ko.utils.unwrapObservable(valueAccessor());
            if (typeof bindingValue == "string" || bindingValue['name']) {
                // It's a named template - clear the element
                ko.virtualElements.emptyNode(element);
            } else if ('nodes' in bindingValue) {
                // We've been given an array of DOM nodes. Save them as the template source.
                // There is no known use case for the node array being an observable array (if the output
                // varies, put that behavior *into* your template - that's what templates are for), and
                // the implementation would be a mess, so assert that it's not observable.
                var nodes = bindingValue['nodes'] || [];
                if (ko.isObservable(nodes)) {
                    throw new Error('The "nodes" option must be a plain, non-observable array.');
                }
                var container = ko.utils.moveCleanedNodesToContainerElement(nodes); // This also removes the nodes from their current parent
                new ko.templateSources.anonymousTemplate(element)['nodes'](container);
            } else {
                // It's an anonymous template - store the element contents, then clear the element
                var templateNodes = ko.virtualElements.childNodes(element),
                    container = ko.utils.moveCleanedNodesToContainerElement(templateNodes); // This also removes the nodes from their current parent
                new ko.templateSources.anonymousTemplate(element)['nodes'](container);
            }
            return { 'controlsDescendantBindings': true };
        },
        'update': function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            var value = valueAccessor(),
                dataValue,
                options = ko.utils.unwrapObservable(value),
                shouldDisplay = true,
                templateComputed = null,
                templateName;

            if (typeof options == "string") {
                templateName = value;
                options = {};
            } else {
                templateName = options['name'];

                // Support "if"/"ifnot" conditions
                if ('if' in options)
                    shouldDisplay = ko.utils.unwrapObservable(options['if']);
                if (shouldDisplay && 'ifnot' in options)
                    shouldDisplay = !ko.utils.unwrapObservable(options['ifnot']);

                dataValue = ko.utils.unwrapObservable(options['data']);
            }

            if ('foreach' in options) {
                // Render once for each data point (treating data set as empty if shouldDisplay==false)
                var dataArray = (shouldDisplay && options['foreach']) || [];
                templateComputed = ko.renderTemplateForEach(templateName || element, dataArray, options, element, bindingContext);
            } else if (!shouldDisplay) {
                ko.virtualElements.emptyNode(element);
            } else {
                // Render once for this single data point (or use the viewModel if no data was provided)
                var innerBindingContext = ('data' in options) ?
                    bindingContext['createChildContext'](dataValue, options['as']) :  // Given an explitit 'data' value, we create a child binding context for it
                    bindingContext;                                                        // Given no explicit 'data' value, we retain the same binding context
                templateComputed = ko.renderTemplate(templateName || element, innerBindingContext, options, element);
            }

            // It only makes sense to have a single template computed per element (otherwise which one should have its output displayed?)
            disposeOldComputedAndStoreNewOne(element, templateComputed);
        }
    };

    // Anonymous templates can't be rewritten. Give a nice error message if you try to do it.
    ko.expressionRewriting.bindingRewriteValidators['template'] = function(bindingValue) {
        var parsedBindingValue = ko.expressionRewriting.parseObjectLiteral(bindingValue);

        if ((parsedBindingValue.length == 1) && parsedBindingValue[0]['unknown'])
            return null; // It looks like a string literal, not an object literal, so treat it as a named template (which is allowed for rewriting)

        if (ko.expressionRewriting.keyValueArrayContainsKey(parsedBindingValue, "name"))
            return null; // Named templates can be rewritten, so return "no error"
        return "This template engine does not support anonymous templates nested within its templates";
    };

    ko.virtualElements.allowedBindings['template'] = true;
})();

ko.exportSymbol('setTemplateEngine', ko.setTemplateEngine);
ko.exportSymbol('renderTemplate', ko.renderTemplate);
// Go through the items that have been added and deleted and try to find matches between them.
ko.utils.findMovesInArrayComparison = function (left, right, limitFailedCompares) {
    if (left.length && right.length) {
        var failedCompares, l, r, leftItem, rightItem;
        for (failedCompares = l = 0; (!limitFailedCompares || failedCompares < limitFailedCompares) && (leftItem = left[l]); ++l) {
            for (r = 0; rightItem = right[r]; ++r) {
                if (leftItem['value'] === rightItem['value']) {
                    leftItem['moved'] = rightItem['index'];
                    rightItem['moved'] = leftItem['index'];
                    right.splice(r, 1);         // This item is marked as moved; so remove it from right list
                    failedCompares = r = 0;     // Reset failed compares count because we're checking for consecutive failures
                    break;
                }
            }
            failedCompares += r;
        }
    }
};

ko.utils.compareArrays = (function () {
    var statusNotInOld = 'added', statusNotInNew = 'deleted';

    // Simple calculation based on Levenshtein distance.
    function compareArrays(oldArray, newArray, options) {
        // For backward compatibility, if the third arg is actually a bool, interpret
        // it as the old parameter 'dontLimitMoves'. Newer code should use { dontLimitMoves: true }.
        options = (typeof options === 'boolean') ? { 'dontLimitMoves': options } : (options || {});
        oldArray = oldArray || [];
        newArray = newArray || [];

        if (oldArray.length <= newArray.length)
            return compareSmallArrayToBigArray(oldArray, newArray, statusNotInOld, statusNotInNew, options);
        else
            return compareSmallArrayToBigArray(newArray, oldArray, statusNotInNew, statusNotInOld, options);
    }

    function compareSmallArrayToBigArray(smlArray, bigArray, statusNotInSml, statusNotInBig, options) {
        var myMin = Math.min,
            myMax = Math.max,
            editDistanceMatrix = [],
            smlIndex, smlIndexMax = smlArray.length,
            bigIndex, bigIndexMax = bigArray.length,
            compareRange = (bigIndexMax - smlIndexMax) || 1,
            maxDistance = smlIndexMax + bigIndexMax + 1,
            thisRow, lastRow,
            bigIndexMaxForRow, bigIndexMinForRow;

        for (smlIndex = 0; smlIndex <= smlIndexMax; smlIndex++) {
            lastRow = thisRow;
            editDistanceMatrix.push(thisRow = []);
            bigIndexMaxForRow = myMin(bigIndexMax, smlIndex + compareRange);
            bigIndexMinForRow = myMax(0, smlIndex - 1);
            for (bigIndex = bigIndexMinForRow; bigIndex <= bigIndexMaxForRow; bigIndex++) {
                if (!bigIndex)
                    thisRow[bigIndex] = smlIndex + 1;
                else if (!smlIndex)  // Top row - transform empty array into new array via additions
                    thisRow[bigIndex] = bigIndex + 1;
                else if (smlArray[smlIndex - 1] === bigArray[bigIndex - 1])
                    thisRow[bigIndex] = lastRow[bigIndex - 1];                  // copy value (no edit)
                else {
                    var northDistance = lastRow[bigIndex] || maxDistance;       // not in big (deletion)
                    var westDistance = thisRow[bigIndex - 1] || maxDistance;    // not in small (addition)
                    thisRow[bigIndex] = myMin(northDistance, westDistance) + 1;
                }
            }
        }

        var editScript = [], meMinusOne, notInSml = [], notInBig = [];
        for (smlIndex = smlIndexMax, bigIndex = bigIndexMax; smlIndex || bigIndex;) {
            meMinusOne = editDistanceMatrix[smlIndex][bigIndex] - 1;
            if (bigIndex && meMinusOne === editDistanceMatrix[smlIndex][bigIndex-1]) {
                notInSml.push(editScript[editScript.length] = {     // added
                    'status': statusNotInSml,
                    'value': bigArray[--bigIndex],
                    'index': bigIndex });
            } else if (smlIndex && meMinusOne === editDistanceMatrix[smlIndex - 1][bigIndex]) {
                notInBig.push(editScript[editScript.length] = {     // deleted
                    'status': statusNotInBig,
                    'value': smlArray[--smlIndex],
                    'index': smlIndex });
            } else {
                --bigIndex;
                --smlIndex;
                if (!options['sparse']) {
                    editScript.push({
                        'status': "retained",
                        'value': bigArray[bigIndex] });
                }
            }
        }

        // Set a limit on the number of consecutive non-matching comparisons; having it a multiple of
        // smlIndexMax keeps the time complexity of this algorithm linear.
        ko.utils.findMovesInArrayComparison(notInSml, notInBig, smlIndexMax * 10);

        return editScript.reverse();
    }

    return compareArrays;
})();

ko.exportSymbol('utils.compareArrays', ko.utils.compareArrays);
(function () {
    // Objective:
    // * Given an input array, a container DOM node, and a function from array elements to arrays of DOM nodes,
    //   map the array elements to arrays of DOM nodes, concatenate together all these arrays, and use them to populate the container DOM node
    // * Next time we're given the same combination of things (with the array possibly having mutated), update the container DOM node
    //   so that its children is again the concatenation of the mappings of the array elements, but don't re-map any array elements that we
    //   previously mapped - retain those nodes, and just insert/delete other ones

    // "callbackAfterAddingNodes" will be invoked after any "mapping"-generated nodes are inserted into the container node
    // You can use this, for example, to activate bindings on those nodes.

    function mapNodeAndRefreshWhenChanged(containerNode, mapping, valueToMap, callbackAfterAddingNodes, index) {
        // Map this array value inside a dependentObservable so we re-map when any dependency changes
        var mappedNodes = [];
        var dependentObservable = ko.dependentObservable(function() {
            var newMappedNodes = mapping(valueToMap, index, ko.utils.fixUpContinuousNodeArray(mappedNodes, containerNode)) || [];

            // On subsequent evaluations, just replace the previously-inserted DOM nodes
            if (mappedNodes.length > 0) {
                ko.utils.replaceDomNodes(mappedNodes, newMappedNodes);
                if (callbackAfterAddingNodes)
                    ko.dependencyDetection.ignore(callbackAfterAddingNodes, null, [valueToMap, newMappedNodes, index]);
            }

            // Replace the contents of the mappedNodes array, thereby updating the record
            // of which nodes would be deleted if valueToMap was itself later removed
            mappedNodes.length = 0;
            ko.utils.arrayPushAll(mappedNodes, newMappedNodes);
        }, null, { disposeWhenNodeIsRemoved: containerNode, disposeWhen: function() { return !ko.utils.anyDomNodeIsAttachedToDocument(mappedNodes); } });
        return { mappedNodes : mappedNodes, dependentObservable : (dependentObservable.isActive() ? dependentObservable : undefined) };
    }

    var lastMappingResultDomDataKey = ko.utils.domData.nextKey();

    ko.utils.setDomNodeChildrenFromArrayMapping = function (domNode, array, mapping, options, callbackAfterAddingNodes) {
        // Compare the provided array against the previous one
        array = array || [];
        options = options || {};
        var isFirstExecution = ko.utils.domData.get(domNode, lastMappingResultDomDataKey) === undefined;
        var lastMappingResult = ko.utils.domData.get(domNode, lastMappingResultDomDataKey) || [];
        var lastArray = ko.utils.arrayMap(lastMappingResult, function (x) { return x.arrayEntry; });
        var editScript = ko.utils.compareArrays(lastArray, array, options['dontLimitMoves']);

        // Build the new mapping result
        var newMappingResult = [];
        var lastMappingResultIndex = 0;
        var newMappingResultIndex = 0;

        var nodesToDelete = [];
        var itemsToProcess = [];
        var itemsForBeforeRemoveCallbacks = [];
        var itemsForMoveCallbacks = [];
        var itemsForAfterAddCallbacks = [];
        var mapData;

        function itemMovedOrRetained(editScriptIndex, oldPosition) {
            mapData = lastMappingResult[oldPosition];
            if (newMappingResultIndex !== oldPosition)
                itemsForMoveCallbacks[editScriptIndex] = mapData;
            // Since updating the index might change the nodes, do so before calling fixUpContinuousNodeArray
            mapData.indexObservable(newMappingResultIndex++);
            ko.utils.fixUpContinuousNodeArray(mapData.mappedNodes, domNode);
            newMappingResult.push(mapData);
            itemsToProcess.push(mapData);
        }

        function callCallback(callback, items) {
            if (callback) {
                for (var i = 0, n = items.length; i < n; i++) {
                    if (items[i]) {
                        ko.utils.arrayForEach(items[i].mappedNodes, function(node) {
                            callback(node, i, items[i].arrayEntry);
                        });
                    }
                }
            }
        }

        for (var i = 0, editScriptItem, movedIndex; editScriptItem = editScript[i]; i++) {
            movedIndex = editScriptItem['moved'];
            switch (editScriptItem['status']) {
                case "deleted":
                    if (movedIndex === undefined) {
                        mapData = lastMappingResult[lastMappingResultIndex];

                        // Stop tracking changes to the mapping for these nodes
                        if (mapData.dependentObservable)
                            mapData.dependentObservable.dispose();

                        // Queue these nodes for later removal
                        nodesToDelete.push.apply(nodesToDelete, ko.utils.fixUpContinuousNodeArray(mapData.mappedNodes, domNode));
                        if (options['beforeRemove']) {
                            itemsForBeforeRemoveCallbacks[i] = mapData;
                            itemsToProcess.push(mapData);
                        }
                    }
                    lastMappingResultIndex++;
                    break;

                case "retained":
                    itemMovedOrRetained(i, lastMappingResultIndex++);
                    break;

                case "added":
                    if (movedIndex !== undefined) {
                        itemMovedOrRetained(i, movedIndex);
                    } else {
                        mapData = { arrayEntry: editScriptItem['value'], indexObservable: ko.observable(newMappingResultIndex++) };
                        newMappingResult.push(mapData);
                        itemsToProcess.push(mapData);
                        if (!isFirstExecution)
                            itemsForAfterAddCallbacks[i] = mapData;
                    }
                    break;
            }
        }

        // Call beforeMove first before any changes have been made to the DOM
        callCallback(options['beforeMove'], itemsForMoveCallbacks);

        // Next remove nodes for deleted items (or just clean if there's a beforeRemove callback)
        ko.utils.arrayForEach(nodesToDelete, options['beforeRemove'] ? ko.cleanNode : ko.removeNode);

        // Next add/reorder the remaining items (will include deleted items if there's a beforeRemove callback)
        for (var i = 0, nextNode = ko.virtualElements.firstChild(domNode), lastNode, node; mapData = itemsToProcess[i]; i++) {
            // Get nodes for newly added items
            if (!mapData.mappedNodes)
                ko.utils.extend(mapData, mapNodeAndRefreshWhenChanged(domNode, mapping, mapData.arrayEntry, callbackAfterAddingNodes, mapData.indexObservable));

            // Put nodes in the right place if they aren't there already
            for (var j = 0; node = mapData.mappedNodes[j]; nextNode = node.nextSibling, lastNode = node, j++) {
                if (node !== nextNode)
                    ko.virtualElements.insertAfter(domNode, node, lastNode);
            }

            // Run the callbacks for newly added nodes (for example, to apply bindings, etc.)
            if (!mapData.initialized && callbackAfterAddingNodes) {
                callbackAfterAddingNodes(mapData.arrayEntry, mapData.mappedNodes, mapData.indexObservable);
                mapData.initialized = true;
            }
        }

        // If there's a beforeRemove callback, call it after reordering.
        // Note that we assume that the beforeRemove callback will usually be used to remove the nodes using
        // some sort of animation, which is why we first reorder the nodes that will be removed. If the
        // callback instead removes the nodes right away, it would be more efficient to skip reordering them.
        // Perhaps we'll make that change in the future if this scenario becomes more common.
        callCallback(options['beforeRemove'], itemsForBeforeRemoveCallbacks);

        // Finally call afterMove and afterAdd callbacks
        callCallback(options['afterMove'], itemsForMoveCallbacks);
        callCallback(options['afterAdd'], itemsForAfterAddCallbacks);

        // Store a copy of the array items we just considered so we can difference it next time
        ko.utils.domData.set(domNode, lastMappingResultDomDataKey, newMappingResult);
    }
})();

ko.exportSymbol('utils.setDomNodeChildrenFromArrayMapping', ko.utils.setDomNodeChildrenFromArrayMapping);
ko.nativeTemplateEngine = function () {
    this['allowTemplateRewriting'] = false;
}

ko.nativeTemplateEngine.prototype = new ko.templateEngine();
ko.nativeTemplateEngine.prototype.constructor = ko.nativeTemplateEngine;
ko.nativeTemplateEngine.prototype['renderTemplateSource'] = function (templateSource, bindingContext, options, templateDocument) {
    var useNodesIfAvailable = !(ko.utils.ieVersion < 9), // IE<9 cloneNode doesn't work properly
        templateNodesFunc = useNodesIfAvailable ? templateSource['nodes'] : null,
        templateNodes = templateNodesFunc ? templateSource['nodes']() : null;

    if (templateNodes) {
        return ko.utils.makeArray(templateNodes.cloneNode(true).childNodes);
    } else {
        var templateText = templateSource['text']();
        return ko.utils.parseHtmlFragment(templateText, templateDocument);
    }
};

ko.nativeTemplateEngine.instance = new ko.nativeTemplateEngine();
ko.setTemplateEngine(ko.nativeTemplateEngine.instance);

ko.exportSymbol('nativeTemplateEngine', ko.nativeTemplateEngine);
(function() {
    ko.jqueryTmplTemplateEngine = function () {
        // Detect which version of jquery-tmpl you're using. Unfortunately jquery-tmpl
        // doesn't expose a version number, so we have to infer it.
        // Note that as of Knockout 1.3, we only support jQuery.tmpl 1.0.0pre and later,
        // which KO internally refers to as version "2", so older versions are no longer detected.
        var jQueryTmplVersion = this.jQueryTmplVersion = (function() {
            if (!jQueryInstance || !(jQueryInstance['tmpl']))
                return 0;
            // Since it exposes no official version number, we use our own numbering system. To be updated as jquery-tmpl evolves.
            try {
                if (jQueryInstance['tmpl']['tag']['tmpl']['open'].toString().indexOf('__') >= 0) {
                    // Since 1.0.0pre, custom tags should append markup to an array called "__"
                    return 2; // Final version of jquery.tmpl
                }
            } catch(ex) { /* Apparently not the version we were looking for */ }

            return 1; // Any older version that we don't support
        })();

        function ensureHasReferencedJQueryTemplates() {
            if (jQueryTmplVersion < 2)
                throw new Error("Your version of jQuery.tmpl is too old. Please upgrade to jQuery.tmpl 1.0.0pre or later.");
        }

        function executeTemplate(compiledTemplate, data, jQueryTemplateOptions) {
            return jQueryInstance['tmpl'](compiledTemplate, data, jQueryTemplateOptions);
        }

        this['renderTemplateSource'] = function(templateSource, bindingContext, options, templateDocument) {
            templateDocument = templateDocument || document;
            options = options || {};
            ensureHasReferencedJQueryTemplates();

            // Ensure we have stored a precompiled version of this template (don't want to reparse on every render)
            var precompiled = templateSource['data']('precompiled');
            if (!precompiled) {
                var templateText = templateSource['text']() || "";
                // Wrap in "with($whatever.koBindingContext) { ... }"
                templateText = "{{ko_with $item.koBindingContext}}" + templateText + "{{/ko_with}}";

                precompiled = jQueryInstance['template'](null, templateText);
                templateSource['data']('precompiled', precompiled);
            }

            var data = [bindingContext['$data']]; // Prewrap the data in an array to stop jquery.tmpl from trying to unwrap any arrays
            var jQueryTemplateOptions = jQueryInstance['extend']({ 'koBindingContext': bindingContext }, options['templateOptions']);

            var resultNodes = executeTemplate(precompiled, data, jQueryTemplateOptions);
            resultNodes['appendTo'](templateDocument.createElement("div")); // Using "appendTo" forces jQuery/jQuery.tmpl to perform necessary cleanup work

            jQueryInstance['fragments'] = {}; // Clear jQuery's fragment cache to avoid a memory leak after a large number of template renders
            return resultNodes;
        };

        this['createJavaScriptEvaluatorBlock'] = function(script) {
            return "{{ko_code ((function() { return " + script + " })()) }}";
        };

        this['addTemplate'] = function(templateName, templateMarkup) {
            document.write("<script type='text/html' id='" + templateName + "'>" + templateMarkup + "<" + "/script>");
        };

        if (jQueryTmplVersion > 0) {
            jQueryInstance['tmpl']['tag']['ko_code'] = {
                open: "__.push($1 || '');"
            };
            jQueryInstance['tmpl']['tag']['ko_with'] = {
                open: "with($1) {",
                close: "} "
            };
        }
    };

    ko.jqueryTmplTemplateEngine.prototype = new ko.templateEngine();
    ko.jqueryTmplTemplateEngine.prototype.constructor = ko.jqueryTmplTemplateEngine;

    // Use this one by default *only if jquery.tmpl is referenced*
    var jqueryTmplTemplateEngineInstance = new ko.jqueryTmplTemplateEngine();
    if (jqueryTmplTemplateEngineInstance.jQueryTmplVersion > 0)
        ko.setTemplateEngine(jqueryTmplTemplateEngineInstance);

    ko.exportSymbol('jqueryTmplTemplateEngine', ko.jqueryTmplTemplateEngine);
})();
}));
}());
})();

},{}],2:[function(require,module,exports){
/*
 * Copyright 2013 Google, Inc.
 * Copyright 2015 Vivliostyle Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function(factory) {
    if (typeof define === "function" && define.amd) {
        // AMD
        define([], factory);
    } else if (typeof module === "object") {
        // Node.js
        var enclosingObject = {};
        module.exports = factory(enclosingObject);
    } else if (typeof exports === "object") {
        // CommonJS
        var enclosingObject = {};
        exports = factory(enclosingObject);
    } else {
        // Attach to the window object
        factory(window);
    }
})(function(enclosingObject) {
    enclosingObject = enclosingObject || {};
    var m,aa=this;function ba(a,b){var c=a.split("."),d=("undefined"!==typeof enclosingObject&&enclosingObject?enclosingObject:window)||aa;c[0]in d||!d.execScript||d.execScript("var "+c[0]);for(var e;c.length&&(e=c.shift());)c.length||void 0===b?d[e]?d=d[e]:d=d[e]={}:d[e]=b}
function t(a,b){function c(){}c.prototype=b.prototype;a.Ed=b.prototype;a.prototype=new c;a.prototype.constructor=a;a.Pd=function(a,c,f){for(var g=Array(arguments.length-2),h=2;h<arguments.length;h++)g[h-2]=arguments[h];return b.prototype[c].apply(a,g)}};function ca(a){var b=a.match(/^([^#]*)/);return b?b[1]:a}var da=window.location.href;
function ea(a,b){if(!b||a.match(/^\w{2,}:/))return a.toLowerCase().match("^javascript:")?"#":a;b.match(/^\w{2,}:\/\/[^\/]+$/)&&(b+="/");var c;if(a.match(/^\/\//))return(c=b.match(/^(\w{2,}:)\/\//))?c[1]+a:a;if(a.match(/^\//))return(c=b.match(/^(\w{2,}:\/\/[^\/]+)\//))?c[1]+a:a;a.match(/^\.(\/|$)/)&&(a=a.substr(1));c=b;var d=c.match(/^([^#?]*)/);b=d?d[1]:c;if(a.match(/^\#/))return b+a;c=b.lastIndexOf("/");if(0>c)return a;for(d=b.substr(0,c+1)+a;;){c=d.indexOf("/../");if(0>=c)break;var e=d.lastIndexOf("/",
c-1);if(0>=e)break;d=d.substr(0,e)+d.substr(c+3)}return d.replace(/\/(\.\/)+/g,"/")}function fa(a){a=new RegExp("#(.*&)?"+ga(a)+"=([^#&]*)");return(a=window.location.href.match(a))?a[2]:null}function ha(a,b){var c=new RegExp("#(.*&)?"+ga("f")+"=([^#&]*)"),d=a.match(c);return d?(c=d[2].length,d=d.index+d[0].length-c,a.substr(0,d)+b+a.substr(d+c)):a.match(/#/)?a+"&f="+b:a+"#f="+b}function ia(a){return null==a?a:a.toString()}function ja(){this.b=[null]}
ja.prototype.length=function(){return this.b.length-1};function ka(){return la.replace(/-[a-z]/g,function(a){return a.substr(1).toUpperCase()})}var ma="-webkit- -moz- -ms- -o- -epub- ".split(" "),na;
a:{var oa="transform transform-origin hyphens writing-mode text-orientation box-decoration-break column-count column-width column-rule-color column-rule-style column-rule-width font-kerning text-size-adjust line-break tab-size text-align-last text-justify word-break word-wrap text-decoration-color text-decoration-line text-decoration-skip text-decoration-style text-emphasis-color text-emphasis-position text-emphasis-style text-underline-position backface-visibility text-overflow text-combine text-combine-horizontal text-combine-upright text-orientation touch-action".split(" "),pa=
{},qa=document.createElement("span"),ra=qa.style,sa=null;try{if(qa.style.setProperty("-ms-transform-origin","0% 0%"),"0% 0%"==qa.style.getPropertyValue("-ms-transform-origin")){for(var ta=0;ta<oa.length;ta++)pa[oa[ta]]="-ms-"+oa[ta];na=pa;break a}}catch(ua){}for(ta=0;ta<oa.length;ta++){var va=oa[ta],la=null,wa=null;sa&&(la=sa+va,wa=ka());if(!wa||null==ra[wa])for(var xa=0;xa<ma.length&&(sa=ma[xa],la=sa+va,wa=ka(),null==ra[wa]);xa++);null!=ra[wa]&&(pa[va]=la)}na=pa}var ya=na;
function u(a,b,c){try{b=ya[b]||b,"-ms-writing-mode"==b&&"vertical-rl"==c&&(c="tb-rl"),a.style.setProperty(b,c)}catch(d){}}function za(a,b){try{return a.style.getPropertyValue(ya[b]||b)}catch(c){}return""}function Aa(){this.b=[]}Aa.prototype.append=function(a){this.b.push(a);return this};Aa.prototype.toString=function(){var a=this.b.join("");this.b=[a];return a};function Ba(a){return"\\"+a.charCodeAt(0).toString(16)+" "}function Ca(a){return a.replace(/[^-_a-zA-Z0-9\u0080-\uFFFF]/g,Ba)}
function Da(a){return a.replace(/[\u0000-\u001F"]/g,Ba)}function Ea(a){return a.replace(/[\s+&?=#\u007F-\uFFFF]+/g,encodeURIComponent)}function Fa(a){return!!a.match(/^[a-zA-Z\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]$/)}function Ga(a){return"\\u"+(65536|a.charCodeAt(0)).toString(16).substr(1)}function ga(a){return a.replace(/[^-a-zA-Z0-9_]/g,Ga)}function v(a){window.console&&window.console.log&&window.console.log(a)}
function Ha(a){if(!a)throw"Assert failed";}function Ia(a,b){for(var c=0,d=a;;){Ha(c<=d);Ha(0==c||!b(c-1));Ha(d==a||b(d));if(c==d)return c;var e=c+d>>1;b(e)?d=e:c=e+1}}function Ja(a,b){return a-b}function Ka(a,b){for(var c={},d=0;d<a.length;d++){var e=a[d],f=b(e);f&&!c[f]&&(c[f]=e)}return c}var La={};function Ma(a,b){for(var c={},d=0;d<a.length;d++){var e=a[d],f=b(e);f&&(c[f]?c[f].push(e):c[f]=[e])}return c}function Na(a,b){for(var c=Array(a.length),d=0;d<a.length;d++)c[d]=b(a[d],d);return c}
function Oa(a,b){var c={},d;for(d in a)c[d]=b(a[d],d);return c}function Pa(){this.d={}}function Qa(a,b){var c=a.d[b.type];if(c){b.target=a;b.currentTarget=a;for(var d=0;d<c.length;d++)c[d](b)}}Pa.prototype.addEventListener=function(a,b,c){c||((c=this.d[a])?c.push(b):this.d[a]=[b])};Pa.prototype.removeEventListener=function(a,b,c){!c&&(a=this.d[a])&&(b=a.indexOf(b),0<=b&&a.splice(b,0))};var Ra=null;
function Sa(a){if(null==Ra){var b=a.ownerDocument,c=b.createElement("div");c.style.position="absolute";c.style.top="0px";c.style.left="0px";c.style.width="100px";c.style.height="100px";c.style.overflow="hidden";c.style.lineHeight="16px";c.style.fontSize="16px";a.appendChild(c);var d=b.createElement("div");d.style.width="0px";d.style.height="14px";d.style.cssFloat="left";c.appendChild(d);d=b.createElement("div");d.style.width="50px";d.style.height="50px";d.style.cssFloat="left";d.style.clear="left";
c.appendChild(d);d=b.createTextNode("a a a a a a a a a a a a a a a a");c.appendChild(d);b=b.createRange();b.setStart(d,0);b.setEnd(d,1);Ra=40>b.getBoundingClientRect().left;a.removeChild(c)}return Ra}var Ta=null;function Ua(a){return 1==a.nodeType&&(a=a.getAttribute("id"))&&a.match(/^[-a-zA-Z_0-9.\u007F-\uFFFF]+$/)?a:null}function Va(a){return"^"+a}function Xa(a){return a.substr(1)}function Ya(a){return a?a.replace(/\^[\[\]\(\),=;^]/g,Xa):a}
function Za(a){for(var b={};a;){var c=a.match(/^;([^;=]+)=(([^;]|\^;)*)/);if(!c)break;var d=c[1],e;a:{e=c[2];var f=[];do{var g=e.match(/^(\^,|[^,])*/),h=Ya(g[0]);e=e.substr(g[0].length+1);if(!e&&!f.length){e=h;break a}f.push(h)}while(e);e=f}b[d]=e;a=a.substr(c[0].length)}return b}function $a(){}$a.prototype.e=function(a){a.append("!")};$a.prototype.f=function(){return!1};function ab(a,b,c){this.b=a;this.id=b;this.Ma=c}
ab.prototype.e=function(a){a.append("/");a.append(this.b.toString());if(this.id||this.Ma)a.append("["),this.id&&a.append(this.id),this.Ma&&(a.append(";s="),a.append(this.Ma)),a.append("]")};
ab.prototype.f=function(a){if(1!=a.xa.nodeType)throw Error("E_CFI_NOT_ELEMENT");var b=a.xa,c=b.children,d=c.length,e=Math.floor(this.b/2)-1;0>e||0==d?(c=b.firstChild,a.xa=c||b):(c=c[Math.min(e,d-1)],this.b&1&&((b=c.nextSibling)&&1!=b.nodeType?c=b:a.I=!0),a.xa=c);if(this.id&&(a.I||this.id!=Ua(a.xa)))throw Error("E_CFI_ID_MISMATCH");a.Ma=this.Ma;return!0};function bb(a,b,c,d){this.offset=a;this.d=b;this.b=c;this.Ma=d}
bb.prototype.f=function(a){if(0<this.offset&&!a.I){for(var b=this.offset,c=a.xa;;){var d=c.nodeType;if(1==d)break;var e=c.nextSibling;if(3<=d&&5>=d){d=c.textContent.length;if(b<=d)break;if(!e){b=d;break}b-=d}if(!e){b=0;break}c=e}a.xa=c;a.offset=b}a.Ma=this.Ma;return!0};
bb.prototype.e=function(a){a.append(":");a.append(this.offset.toString());if(this.d||this.b||this.Ma){a.append("[");if(this.d||this.b)this.d&&a.append(this.d.replace(/[\[\]\(\),=;^]/g,Va)),a.append(","),this.b&&a.append(this.b.replace(/[\[\]\(\),=;^]/g,Va));this.Ma&&(a.append(";s="),a.append(this.Ma));a.append("]")}};function cb(){this.ja=null}
function db(a,b){var c=b.match(/^#?epubcfi\((.*)\)$/);if(!c)throw Error("E_CFI_NOT_CFI");for(var d=c[1],e=0,f=[];;)switch(d.charAt(e)){case "/":e++;c=d.substr(e).match(/^(0|[1-9][0-9]*)(\[([-a-zA-Z_0-9.\u007F-\uFFFF]+)(;([^\]]|\^\])*)?\])?/);if(!c)throw Error("E_CFI_NUMBER_EXPECTED");var e=e+c[0].length,g=parseInt(c[1],10),h=c[3],c=Za(c[4]);f.push(new ab(g,h,ia(c.s)));break;case ":":e++;c=d.substr(e).match(/^(0|[1-9][0-9]*)(\[((([^\];,]|\^[\];,])*)(,(([^\];,]|\^[\];,])*))?)(;([^]]|\^\])*)?\])?/);
if(!c)throw Error("E_CFI_NUMBER_EXPECTED");e+=c[0].length;g=parseInt(c[1],10);(h=c[4])&&(h=Ya(h));var k=c[7];k&&(k=Ya(k));c=Za(c[10]);f.push(new bb(g,h,k,ia(c.s)));break;case "!":e++;f.push(new $a);break;case "~":case "@":case "":a.ja=f;return;default:throw Error("E_CFI_PARSE_ERROR");}}function eb(a,b){for(var c={xa:b.documentElement,offset:0,I:!1,Ma:null,Db:null},d=0;d<a.ja.length;d++)if(!a.ja[d].f(c)){++d<a.ja.length&&(c.Db=new cb,c.Db.ja=a.ja.slice(d));break}return c}
function fb(a,b){return a.replace(/\s+/g," ").match(b?/^[ -\uD7FF\uE000-\uFFFF]{0,8}/:/[ -\uD7FF\uE000-\uFFFF]{0,8}$/)[0].replace(/^\s/,"").replace(/\s$/,"")}
function gb(a,b,c){for(var d=!1,e=null,f=[],g=b.parentNode,h="",k="";b;){switch(b.nodeType){case 3:case 4:case 5:var l=b.textContent,n=l.length;d?(c+=n,h||(h=l)):(c>n&&(c=n),d=!0,h=l.substr(0,c),k=l.substr(c));b=b.previousSibling;continue;case 8:b=b.previousSibling;continue}break}if(0<c||h||k)h=fb(h,!1),k=fb(k,!0),f.push(new bb(c,h,k,e)),e=null;for(;g&&g&&9!=g.nodeType;){c=d?null:Ua(b);for(d=d?1:0;b;)1==b.nodeType&&(d+=2),b=b.previousSibling;f.push(new ab(d,c,e));e=null;b=g;g=g.parentNode;d=!1}f.reverse();
a.ja?(f.push(new $a),a.ja=f.concat(a.ja)):a.ja=f}cb.prototype.toString=function(){if(!this.ja)return"";var a=new Aa;a.append("epubcfi(");for(var b=0;b<this.ja.length;b++)this.ja[b].e(a);a.append(")");return a.toString()};function hb(a){a=a.substr(1);if(a.match(/^[^0-9a-fA-F\n\r]$/))return a;a=parseInt(a,16);return isNaN(a)?"":65535>=a?String.fromCharCode(a):1114111>=a?String.fromCharCode(55296|a>>10&1023,56320|a&1023):"\ufffd"}function ib(a){return a.replace(/\\([0-9a-fA-F]{0,6}(\r\n|[ \n\r\t\f])?|[^0-9a-fA-F\n\r])/g,hb)}function jb(){this.type=0;this.b=!1;this.C=0;this.text="";this.position=0}
function kb(a,b){var c=Array(128),d;for(d=0;128>d;d++)c[d]=a;c[NaN]=35==a?35:72;for(d=0;d<b.length;d+=2)c[b[d]]=b[d+1];return c}var lb=[72,72,72,72,72,72,72,72,72,1,1,72,1,1,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,1,4,34,6,7,8,9,33,10,11,12,13,14,15,16,17,2,2,2,2,2,2,2,2,2,2,18,19,20,21,22,23,24,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,25,29,26,30,3,72,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,27,31,28,32,72];lb[NaN]=80;
var mb=[43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,52,43,43,43,43,39,43,43,39,39,39,39,39,39,39,39,39,39,43,43,43,43,43,43,43,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,43,44,43,43,39,43,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,43,43,43,43,43];mb[NaN]=43;
var nb=[72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,78,59,72,59,59,59,59,59,59,59,59,59,59,72,72,72,72,72,72,72,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,72,61,72,72,78,72,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,72,72,72,72,72];mb[NaN]=43;
var ob=[35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,57,59,35,58,58,58,58,58,58,58,58,58,58,35,35,35,35,35,35,35,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,35,61,35,35,60,35,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,35,35,35,35,35];ob[NaN]=35;
var pb=[45,45,45,45,45,45,45,45,45,73,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,73,45,45,45,45,45,45,45,53,45,45,45,45,45,45,45,39,39,39,39,39,39,39,39,39,39,45,45,45,45,45,45,45,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,45,44,45,45,39,45,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,45,45,45,45,45];pb[NaN]=45;
var qb=[37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,41,37,37,37,37,37,37,37,37,42,37,39,39,39,39,39,39,39,39,39,39,37,37,37,37,37,37,37,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,37,37,37,37,40,37,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,37,37,37,37,37];qb[NaN]=37;
var rb=[38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,41,38,38,38,38,38,38,38,38,38,38,39,39,39,39,39,39,39,39,39,39,38,38,38,38,38,38,38,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,38,38,38,38,40,38,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,38,38,38,38,38];rb[NaN]=38;
var sb=kb(35,[61,36]),tb=kb(35,[58,77]),ub=kb(35,[61,36,124,50]),vb=kb(35,[38,51]),wb=kb(35,[42,54]),xb=kb(39,[42,55]),yb=kb(54,[42,55,47,56]),zb=kb(62,[62,56]),Ab=kb(35,[61,36,33,70]),Bb=kb(62,[45,71]),Cb=kb(63,[45,56]),Db=kb(76,[9,72,10,72,13,72,32,72]),Eb=kb(39,[39,46,10,72,13,72,92,48]),Fb=kb(39,[34,46,10,72,13,72,92,49]),Gb=kb(39,[39,47,10,74,13,74,92,48]),Hb=kb(39,[34,47,10,74,13,74,92,49]),Ib=kb(64,[9,39,32,39,34,66,39,65,41,72,10,39,13,39]),Jb=kb(39,[41,67,9,79,10,79,13,79,32,79,92,75,40,
72,91,72,93,72,123,72,125,72,NaN,67]),Kb=kb(39,[39,68,10,74,13,74,92,75,NaN,67]),Lb=kb(39,[34,68,10,74,13,74,92,75,NaN,67]),Mb=kb(72,[9,39,10,39,13,39,32,39,41,69]);function Nb(a){this.e=15;this.h=a;this.g=Array(this.e+1);this.b=-1;for(a=this.position=this.d=this.f=0;a<=this.e;a++)this.g[a]=new jb}function w(a){a.f==a.d&&Ob(a);return a.g[a.d]}function z(a,b){(a.f-a.d&a.e)<=b&&Ob(a);return a.g[a.d+b&a.e]}function A(a){a.d=a.d+1&a.e}
function Ob(a){var b=a.f,c=0<=a.b?a.b:a.d,d=a.e;b>=c?c+=d:c--;if(c==b){if(0>a.b)throw Error("F_CSSTOK_INTERNAL");for(var b=2*(a.e+1)-1,c=Array(b+1),d=a.b,e=0;d!=a.f;)c[e]=a.g[d],d==a.d&&(a.d=e),d=d+1&a.e,e++;a.b=0;a.f=e;a.e=b;for(a.g=c;e<=b;)c[e++]=new jb;b=a.f;c=d=a.e}for(var e=lb,f=a.h,g=a.position,h=a.g,k=0,l=0,n="",p=0,r=!1,q=h[b],y=-9;;){var x=f.charCodeAt(g);switch(e[x]||e[65]){case 72:k=51;n=isNaN(x)?"E_CSS_UNEXPECTED_EOF":"E_CSS_UNEXPECTED_CHAR";g++;break;case 1:g++;r=!0;continue;case 2:l=
g++;e=qb;continue;case 3:k=1;l=g++;e=mb;continue;case 4:l=g++;k=31;e=sb;continue;case 33:k=2;l=++g;e=Eb;continue;case 34:k=2;l=++g;e=Fb;continue;case 6:l=++g;k=7;e=mb;continue;case 7:l=g++;k=32;e=sb;continue;case 8:l=g++;k=21;break;case 9:l=g++;k=32;e=vb;continue;case 10:l=g++;k=10;break;case 11:l=g++;k=11;break;case 12:l=g++;k=36;e=sb;continue;case 13:l=g++;k=23;break;case 14:l=g++;k=16;break;case 15:k=24;l=g++;e=ob;continue;case 16:l=g++;e=nb;continue;case 78:l=g++;k=9;e=mb;continue;case 17:l=g++;
k=19;e=wb;continue;case 18:l=g++;k=18;e=tb;continue;case 77:g++;k=50;break;case 19:l=g++;k=17;break;case 20:l=g++;k=38;e=Ab;continue;case 21:l=g++;k=39;e=sb;continue;case 22:l=g++;k=37;e=sb;continue;case 23:l=g++;k=22;break;case 24:l=++g;k=20;e=mb;continue;case 25:l=g++;k=14;break;case 26:l=g++;k=15;break;case 27:l=g++;k=12;break;case 28:l=g++;k=13;break;case 29:y=l=g++;k=1;e=Db;continue;case 30:l=g++;k=33;e=sb;continue;case 31:l=g++;k=34;e=ub;continue;case 32:l=g++;k=35;e=sb;continue;case 35:break;
case 36:g++;k=k+41-31;break;case 37:k=5;p=parseInt(f.substring(l,g),10);break;case 38:k=4;p=parseFloat(f.substring(l,g));break;case 39:g++;continue;case 40:k=3;p=parseFloat(f.substring(l,g));l=g++;e=mb;continue;case 41:k=3;p=parseFloat(f.substring(l,g));n="%";l=g++;break;case 42:g++;e=rb;continue;case 43:n=f.substring(l,g);break;case 44:y=g++;e=Db;continue;case 45:n=ib(f.substring(l,g));break;case 46:n=f.substring(l,g);g++;break;case 47:n=ib(f.substring(l,g));g++;break;case 48:y=g;g+=2;e=Gb;continue;
case 49:y=g;g+=2;e=Hb;continue;case 50:g++;k=25;break;case 51:g++;k=26;break;case 52:n=f.substring(l,g);if(1==k){g++;if("url"==n.toLowerCase()){e=Ib;continue}k=6}break;case 53:n=ib(f.substring(l,g));if(1==k){g++;if("url"==n.toLowerCase()){e=Ib;continue}k=6}break;case 54:e=xb;g++;continue;case 55:e=yb;g++;continue;case 56:e=lb;g++;continue;case 57:e=zb;g++;continue;case 58:k=5;e=qb;g++;continue;case 59:k=4;e=rb;g++;continue;case 60:k=1;e=mb;g++;continue;case 61:k=1;e=Db;y=g++;continue;case 62:g--;
break;case 63:g-=2;break;case 64:l=g++;e=Jb;continue;case 65:l=++g;e=Kb;continue;case 66:l=++g;e=Lb;continue;case 67:k=8;n=ib(f.substring(l,g));g++;break;case 69:g++;break;case 70:e=Bb;g++;continue;case 71:e=Cb;g++;continue;case 79:if(8>g-y&&f.substring(y+1,g+1).match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])|[ \t]$/)){g++;continue}case 68:k=8;n=ib(f.substring(l,g));g++;e=Mb;continue;case 74:g++;if(9>g-y&&f.substring(y+1,g).match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])$/))continue;k=51;n="E_CSS_UNEXPECTED_NEWLINE";
break;case 73:if(9>g-y&&f.substring(y+1,g+1).match(/^[0-9a-fA-F]{0,6}[ \t]$/)){g++;continue}n=ib(f.substring(l,g));break;case 75:y=g++;continue;case 76:g++;e=pb;continue;default:if(e!==lb){k=51;n="E_CSS_UNEXPECTED_STATE";break}l=g;k=0}q.type=k;q.b=r;q.C=p;q.text=n;q.position=l;b++;if(b>=c)break;e=lb;r=!1;q=h[b&d]}a.position=g;a.f=b&d};function Pb(){return{fontFamily:"serif",lineHeight:1.25,margin:8,wc:!0,sc:25,vc:!1,Dc:!1,Ta:!1,zb:1}}function Qb(a){return{fontFamily:a.fontFamily,lineHeight:a.lineHeight,margin:a.margin,wc:a.wc,sc:a.sc,vc:a.vc,Dc:a.Dc,Ta:a.Ta,zb:a.zb}}var Rb=Pb(),Sb={};function Tb(a,b,c,d){var e=Math.min((a-0)/c,(b-0)/d);return"matrix("+e+",0,0,"+e+","+(a-c)/2+","+(b-d)/2+")"}function Ub(a){return'"'+Da(a+"")+'"'}function Vb(a){return Ca(a+"")}function Wb(a,b){return a?Ca(a)+"."+Ca(b):Ca(b)}var Xb=0;
function Yb(a,b){this.parent=a;this.j="S"+Xb++;this.children=[];this.b=new Zb(this,0);this.d=new Zb(this,1);this.g=new Zb(this,!0);this.f=new Zb(this,!1);a&&a.children.push(this);this.values={};this.l={};this.k={};this.h=b;if(!a){var c=this.k;c.floor=Math.floor;c.ceil=Math.ceil;c.round=Math.round;c.sqrt=Math.sqrt;c.min=Math.min;c.max=Math.max;c.letterbox=Tb;c["css-string"]=Ub;c["css-name"]=Vb;c["typeof"]=function(a){return typeof a};$b(this,"page-width",function(){return this.k()});$b(this,"page-height",
function(){return this.j()});$b(this,"pref-font-family",function(){return this.Q.fontFamily});$b(this,"pref-night-mode",function(){return this.Q.Dc});$b(this,"pref-hyphenate",function(){return this.Q.wc});$b(this,"pref-margin",function(){return this.Q.margin});$b(this,"pref-line-height",function(){return this.Q.lineHeight});$b(this,"pref-column-width",function(){return this.Q.sc*this.fontSize});$b(this,"pref-horizontal",function(){return this.Q.vc});$b(this,"pref-spread-view",function(){return this.Q.Ta})}}
function $b(a,b,c){a.values[b]=new ac(a,c,b)}function bc(a,b){a.values["page-number"]=b}function cc(a,b){a.k["has-content"]=b}var dc={px:1,"in":96,pt:4/3,pc:16,cm:96/2.54,mm:96/25.4,q:96/2.54/40,em:16,rem:16,ex:8,rex:8};function ec(a,b,c,d){this.u=null;this.k=function(){return this.u?this.u:this.Q.Ta?Math.floor(b/2)-this.Q.zb:b};this.l=null;this.j=function(){return this.l?this.l:c};this.fontSize=d;this.Q=Rb;this.A={}}
function fc(a,b){a.A[b.j]={};for(var c=0;c<b.children.length;c++)fc(a,b.children[c])}function gc(a,b){return"vw"==b?a.k()/100:"vh"==b?a.j()/100:"em"==b||"rem"==b?a.fontSize:"ex"==b||"rex"==b?dc.ex*a.fontSize/dc.em:dc[b]}function hc(a,b,c){do{var d=b.values[c];if(d||b.h&&(d=b.h.call(a,c,!1)))return d;b=b.parent}while(b);throw Error("Name '"+c+"' is undefined");}
function ic(a,b,c,d,e){do{var f=b.l[c];if(f||b.h&&(f=b.h.call(a,c,!0)))return f;if(f=b.k[c]){if(e)return b.b;c=Array(d.length);for(e=0;e<d.length;e++)c[e]=d[e].evaluate(a);return new Zb(b,f.apply(a,c))}b=b.parent}while(b);throw Error("Function '"+c+"' is undefined");}
function jc(a,b,c){var d="",e=b.match(/^(min|max)-(.*)$/);e&&(d=e[1],b=e[2]);var f=e=null;switch(b){case "width":case "height":case "device-width":case "device-height":case "color":c&&(e=c.evaluate(a))}switch(b){case "width":f=a.k();break;case "height":f=a.j();break;case "device-width":f=window.screen.availWidth;break;case "device-height":f=window.screen.availHeight;break;case "color":f=window.screen.pixelDepth}if(null!=f&&null!=e)switch(d){case "min":return f>=e;case "max":return f<=e;default:return f==
e}return!1}function B(a){this.b=a;this.f="_"+Xb++}m=B.prototype;m.toString=function(){var a=new Aa;this.fa(a,0);return a.toString()};m.fa=function(){throw Error("F_ABSTRACT");};m.Ca=function(){throw Error("F_ABSTRACT");};m.ya=function(){return this};m.mb=function(a){return a===this};function kc(a,b,c,d){var e=d[a.f];if(null!=e)return e===Sb?!1:e;d[a.f]=Sb;b=a.mb(b,c,d);return d[a.f]=b}
m.evaluate=function(a){var b;b=(b=a.A[this.b.j])?b[this.f]:void 0;if("undefined"!=typeof b)return b;b=this.Ca(a);var c=this.f,d=this.b,e=a.A[d.j];e||(e={},a.A[d.j]=e);return e[c]=b};m.jd=function(){return!1};function lc(a,b){B.call(this,a);this.d=b}t(lc,B);m=lc.prototype;m.Qc=function(){throw Error("F_ABSTRACT");};m.Rc=function(){throw Error("F_ABSTRACT");};m.Ca=function(a){a=this.d.evaluate(a);return this.Rc(a)};m.mb=function(a,b,c){return a===this||kc(this.d,a,b,c)};
m.fa=function(a,b){10<b&&a.append("(");a.append(this.Qc());this.d.fa(a,10);10<b&&a.append(")")};m.ya=function(a,b){var c=this.d.ya(a,b);return c===this.d?this:new this.constructor(this.b,c)};function D(a,b,c){B.call(this,a);this.d=b;this.e=c}t(D,B);m=D.prototype;m.Ob=function(){throw Error("F_ABSTRACT");};m.wa=function(){throw Error("F_ABSTRACT");};m.Ka=function(){throw Error("F_ABSTRACT");};m.Ca=function(a){var b=this.d.evaluate(a);a=this.e.evaluate(a);return this.Ka(b,a)};
m.mb=function(a,b,c){return a===this||kc(this.d,a,b,c)||kc(this.e,a,b,c)};m.fa=function(a,b){var c=this.Ob();c<=b&&a.append("(");this.d.fa(a,c);a.append(this.wa());this.e.fa(a,c);c<=b&&a.append(")")};m.ya=function(a,b){var c=this.d.ya(a,b),d=this.e.ya(a,b);return c===this.d&&d===this.e?this:new this.constructor(this.b,c,d)};function mc(a,b,c){D.call(this,a,b,c)}t(mc,D);mc.prototype.Ob=function(){return 1};function nc(a,b,c){D.call(this,a,b,c)}t(nc,D);nc.prototype.Ob=function(){return 2};
function oc(a,b,c){D.call(this,a,b,c)}t(oc,D);oc.prototype.Ob=function(){return 3};function pc(a,b,c){D.call(this,a,b,c)}t(pc,D);pc.prototype.Ob=function(){return 4};function qc(a,b){lc.call(this,a,b)}t(qc,lc);qc.prototype.Qc=function(){return"!"};qc.prototype.Rc=function(a){return!a};function rc(a,b){lc.call(this,a,b)}t(rc,lc);rc.prototype.Qc=function(){return"-"};rc.prototype.Rc=function(a){return-a};function sc(a,b,c){D.call(this,a,b,c)}t(sc,mc);sc.prototype.wa=function(){return"&&"};
sc.prototype.Ca=function(a){return this.d.evaluate(a)&&this.e.evaluate(a)};function tc(a,b,c){D.call(this,a,b,c)}t(tc,sc);tc.prototype.wa=function(){return" and "};function uc(a,b,c){D.call(this,a,b,c)}t(uc,mc);uc.prototype.wa=function(){return"||"};uc.prototype.Ca=function(a){return this.d.evaluate(a)||this.e.evaluate(a)};function vc(a,b,c){D.call(this,a,b,c)}t(vc,uc);vc.prototype.wa=function(){return", "};function wc(a,b,c){D.call(this,a,b,c)}t(wc,nc);wc.prototype.wa=function(){return"<"};
wc.prototype.Ka=function(a,b){return a<b};function xc(a,b,c){D.call(this,a,b,c)}t(xc,nc);xc.prototype.wa=function(){return"<="};xc.prototype.Ka=function(a,b){return a<=b};function yc(a,b,c){D.call(this,a,b,c)}t(yc,nc);yc.prototype.wa=function(){return">"};yc.prototype.Ka=function(a,b){return a>b};function zc(a,b,c){D.call(this,a,b,c)}t(zc,nc);zc.prototype.wa=function(){return">="};zc.prototype.Ka=function(a,b){return a>=b};function Ac(a,b,c){D.call(this,a,b,c)}t(Ac,nc);Ac.prototype.wa=function(){return"=="};
Ac.prototype.Ka=function(a,b){return a==b};function Bc(a,b,c){D.call(this,a,b,c)}t(Bc,nc);Bc.prototype.wa=function(){return"!="};Bc.prototype.Ka=function(a,b){return a!=b};function Cc(a,b,c){D.call(this,a,b,c)}t(Cc,oc);Cc.prototype.wa=function(){return"+"};Cc.prototype.Ka=function(a,b){return a+b};function Dc(a,b,c){D.call(this,a,b,c)}t(Dc,oc);Dc.prototype.wa=function(){return" - "};Dc.prototype.Ka=function(a,b){return a-b};function Ec(a,b,c){D.call(this,a,b,c)}t(Ec,pc);Ec.prototype.wa=function(){return"*"};
Ec.prototype.Ka=function(a,b){return a*b};function Fc(a,b,c){D.call(this,a,b,c)}t(Fc,pc);Fc.prototype.wa=function(){return"/"};Fc.prototype.Ka=function(a,b){return a/b};function Gc(a,b,c){D.call(this,a,b,c)}t(Gc,pc);Gc.prototype.wa=function(){return"%"};Gc.prototype.Ka=function(a,b){return a%b};function Hc(a,b,c){B.call(this,a);this.C=b;this.d=c}t(Hc,B);Hc.prototype.fa=function(a){a.append(this.C.toString());a.append(Ca(this.d))};Hc.prototype.Ca=function(a){return this.C*gc(a,this.d)};
function Ic(a,b){B.call(this,a);this.d=b}t(Ic,B);Ic.prototype.fa=function(a){a.append(this.d)};Ic.prototype.Ca=function(a){return hc(a,this.b,this.d).evaluate(a)};Ic.prototype.mb=function(a,b,c){return a===this||kc(hc(b,this.b,this.d),a,b,c)};function Jc(a,b,c){B.call(this,a);this.d=b;this.name=c}t(Jc,B);Jc.prototype.fa=function(a){this.d&&a.append("not ");a.append(Ca(this.name))};Jc.prototype.Ca=function(){return!0};Jc.prototype.jd=function(){return!0};
function ac(a,b,c){B.call(this,a);this.nb=b;this.d=c}t(ac,B);ac.prototype.fa=function(a){a.append(this.d)};ac.prototype.Ca=function(a){return this.nb.call(a)};function Kc(a,b,c){B.call(this,a);this.e=b;this.d=c}t(Kc,B);Kc.prototype.fa=function(a){a.append(this.e);var b=this.d;a.append("(");for(var c=0;c<b.length;c++)c&&a.append(","),b[c].fa(a,0);a.append(")")};Kc.prototype.Ca=function(a){return ic(a,this.b,this.e,this.d,!1).ya(a,this.d).evaluate(a)};
Kc.prototype.mb=function(a,b,c){if(a===this)return!0;for(var d=0;d<this.d.length;d++)if(kc(this.d[d],a,b,c))return!0;return kc(ic(b,this.b,this.e,this.d,!0),a,b,c)};Kc.prototype.ya=function(a,b){for(var c,d=c=this.d,e=0;e<c.length;e++){var f=c[e].ya(a,b);if(c!==d)d[e]=f;else if(f!==c[e]){for(var d=Array(c.length),g=0;g<e;g++)d[g]=c[g];d[e]=f}}c=d;return c===this.d?this:new Kc(this.b,this.e,c)};function Lc(a,b,c,d){B.call(this,a);this.d=b;this.g=c;this.e=d}t(Lc,B);
Lc.prototype.fa=function(a,b){0<b&&a.append("(");this.d.fa(a,0);a.append("?");this.g.fa(a,0);a.append(":");this.e.fa(a,0);0<b&&a.append(")")};Lc.prototype.Ca=function(a){return this.d.evaluate(a)?this.g.evaluate(a):this.e.evaluate(a)};Lc.prototype.mb=function(a,b,c){return a===this||kc(this.d,a,b,c)||kc(this.g,a,b,c)||kc(this.e,a,b,c)};Lc.prototype.ya=function(a,b){var c=this.d.ya(a,b),d=this.g.ya(a,b),e=this.e.ya(a,b);return c===this.d&&d===this.g&&e===this.e?this:new Lc(this.b,c,d,e)};
function Zb(a,b){B.call(this,a);this.d=b}t(Zb,B);Zb.prototype.fa=function(a){switch(typeof this.d){case "number":case "boolean":a.append(this.d.toString());break;case "string":a.append('"');a.append(Da(this.d));a.append('"');break;default:throw Error("F_UNEXPECTED_STATE");}};Zb.prototype.Ca=function(){return this.d};function Mc(a,b,c){B.call(this,a);this.name=b;this.value=c}t(Mc,B);Mc.prototype.fa=function(a){a.append("(");a.append(Da(this.name.name));a.append(":");this.value.fa(a,0);a.append(")")};
Mc.prototype.Ca=function(a){return jc(a,this.name.name,this.value)};Mc.prototype.mb=function(a,b,c){return a===this||kc(this.value,a,b,c)};Mc.prototype.ya=function(a,b){var c=this.value.ya(a,b);return c===this.value?this:new Mc(this.b,this.name,c)};function Nc(a,b){B.call(this,a);this.d=b}t(Nc,B);Nc.prototype.fa=function(a){a.append("$");a.append(this.d.toString())};Nc.prototype.ya=function(a,b){var c=b[this.d];if(!c)throw Error("Parameter missing: "+this.d);return c};
function Oc(a,b,c){return b===a.f||b===a.b||c==a.f||c==a.b?a.f:b===a.g||b===a.d?c:c===a.g||c===a.d?b:new sc(a,b,c)}function E(a,b,c){return b===a.b?c:c===a.b?b:new Cc(a,b,c)}function F(a,b,c){return b===a.b?new rc(a,c):c===a.b?b:new Dc(a,b,c)}function Pc(a,b,c){return b===a.b||c===a.b?a.b:b===a.d?c:c===a.d?b:new Ec(a,b,c)}function Qc(a,b,c){return b===a.b?a.b:c===a.d?b:new Fc(a,b,c)};var Rc={};function Sc(){}m=Sc.prototype;m.Va=function(a){for(var b=0;b<a.length;b++)a[b].M(this)};m.Kc=function(){throw Error("E_CSS_EMPTY_NOT_ALLOWED");};m.Lc=function(){throw Error("E_CSS_SLASH_NOT_ALLOWED");};m.Jb=function(){throw Error("E_CSS_STR_NOT_ALLOWED");};m.eb=function(){throw Error("E_CSS_IDENT_NOT_ALLOWED");};m.ub=function(){throw Error("E_CSS_NUMERIC_NOT_ALLOWED");};m.tb=function(){throw Error("E_CSS_NUM_NOT_ALLOWED");};m.sb=function(a){return this.tb(a)};
m.hc=function(){throw Error("E_CSS_COLOR_NOT_ALLOWED");};m.vb=function(){throw Error("E_CSS_URL_NOT_ALLOWED");};m.Na=function(){throw Error("E_CSS_LIST_NOT_ALLOWED");};m.bb=function(){throw Error("E_CSS_COMMA_NOT_ALLOWED");};m.cb=function(){throw Error("E_CSS_FUNC_NOT_ALLOWED");};m.rb=function(){throw Error("E_CSS_EXPR_NOT_ALLOWED");};function Tc(){}t(Tc,Sc);m=Tc.prototype;
m.Va=function(a){for(var b=null,c=0;c<a.length;c++){var d=a[c],e=d.M(this);if(b)b[c]=e;else if(d!==e){b=Array(a.length);for(d=0;d<c;d++)b[d]=a[d];b[c]=e}}return b||a};m.Jb=function(a){return a};m.eb=function(a){return a};m.Lc=function(a){return a};m.ub=function(a){return a};m.tb=function(a){return a};m.sb=function(a){return a};m.hc=function(a){return a};m.vb=function(a){return a};m.Na=function(a){var b=this.Va(a.values);return b===a.values?a:new Uc(b)};
m.bb=function(a){var b=this.Va(a.values);return b===a.values?a:new Vc(b)};m.cb=function(a){var b=this.Va(a.values);return b===a.values?a:new Wc(a.name,b)};m.rb=function(a){return a};function Xc(){}m=Xc.prototype;m.toString=function(){var a=new Aa;this.sa(a,!0);return a.toString()};m.stringValue=function(){var a=new Aa;this.sa(a,!1);return a.toString()};m.da=function(){throw Error("F_ABSTRACT");};m.sa=function(a){a.append("[error]")};m.Sc=function(){return!1};m.Uc=function(){return!1};m.Tc=function(){return!1};
m.hd=function(){return!1};m.kd=function(){return!1};function Yc(){if(G)throw Error("E_INVALID_CALL");}t(Yc,Xc);Yc.prototype.da=function(a){return new Zb(a,"")};Yc.prototype.sa=function(){};Yc.prototype.M=function(a){return a.Kc(this)};var G=new Yc;function Zc(){if($c)throw Error("E_INVALID_CALL");}t(Zc,Xc);Zc.prototype.da=function(a){return new Zb(a,"/")};Zc.prototype.sa=function(a){a.append("/")};Zc.prototype.M=function(a){return a.Lc(this)};var $c=new Zc;function ad(a){this.d=a}t(ad,Xc);
ad.prototype.da=function(a){return new Zb(a,this.d)};ad.prototype.sa=function(a,b){b?(a.append('"'),a.append(Da(this.d)),a.append('"')):a.append(this.d)};ad.prototype.M=function(a){return a.Jb(this)};function bd(a){this.name=a;if(Rc[a])throw Error("E_INVALID_CALL");Rc[a]=this}t(bd,Xc);bd.prototype.da=function(a){return new Zb(a,this.name)};bd.prototype.sa=function(a,b){b?a.append(Ca(this.name)):a.append(this.name)};bd.prototype.M=function(a){return a.eb(this)};bd.prototype.hd=function(){return!0};
function H(a){var b=Rc[a];b||(b=new bd(a));return b}function K(a,b){this.C=a;this.b=b}t(K,Xc);K.prototype.da=function(a,b){return 0==this.C?a.b:b&&"%"==this.b?100==this.C?b:new Ec(a,b,new Zb(a,this.C/100)):new Hc(a,this.C,this.b)};K.prototype.sa=function(a){a.append(this.C.toString());a.append(this.b)};K.prototype.M=function(a){return a.ub(this)};K.prototype.Uc=function(){return!0};function cd(a){this.C=a}t(cd,Xc);cd.prototype.da=function(a){return 0==this.C?a.b:1==this.C?a.d:new Zb(a,this.C)};
cd.prototype.sa=function(a){a.append(this.C.toString())};cd.prototype.M=function(a){return a.tb(this)};cd.prototype.Tc=function(){return!0};function dd(a){this.C=a}t(dd,cd);dd.prototype.M=function(a){return a.sb(this)};function ed(a){this.d=a}t(ed,Xc);ed.prototype.sa=function(a){a.append("#");var b=this.d.toString(16);a.append("000000".substr(b.length));a.append(b)};ed.prototype.M=function(a){return a.hc(this)};function fd(a){this.url=a}t(fd,Xc);
fd.prototype.sa=function(a){a.append('url("');a.append(Da(this.url));a.append('")')};fd.prototype.M=function(a){return a.vb(this)};function gd(a,b,c,d){var e=b.length;b[0].sa(a,d);for(var f=1;f<e;f++)a.append(c),b[f].sa(a,d)}function Uc(a){this.values=a}t(Uc,Xc);Uc.prototype.sa=function(a,b){gd(a,this.values," ",b)};Uc.prototype.M=function(a){return a.Na(this)};Uc.prototype.kd=function(){return!0};function Vc(a){this.values=a}t(Vc,Xc);Vc.prototype.sa=function(a,b){gd(a,this.values,",",b)};
Vc.prototype.M=function(a){return a.bb(this)};function Wc(a,b){this.name=a;this.values=b}t(Wc,Xc);Wc.prototype.sa=function(a,b){a.append(Ca(this.name));a.append("(");gd(a,this.values,",",b);a.append(")")};Wc.prototype.M=function(a){return a.cb(this)};function L(a){this.e=a}t(L,Xc);L.prototype.da=function(){return this.e};L.prototype.sa=function(a){a.append("-epubx-expr(");this.e.fa(a,0);a.append(")")};L.prototype.M=function(a){return a.rb(this)};L.prototype.Sc=function(){return!0};
function hd(a,b){if(a){if(a.Uc())return gc(b,a.b)*a.C;if(a.Tc())return a.C}return 0}var id=H("absolute"),jd=H("all"),kd=H("auto"),ld=H("avoid"),md=H("block"),nd=H("both"),od=H("exclusive"),pd=H("false"),qd=H("footnote"),rd=H("hidden");H("horizontal-tb");var sd=H("inherit"),td=H("inline"),ud=H("landscape"),vd=H("left"),wd=H("list-item");H("ltr");
var xd=H("none"),yd=H("normal"),zd=H("oeb-page-foot"),Ad=H("oeb-page-head"),Bd=H("relative"),Cd=H("right"),Dd=H("scale"),Ed=H("static"),Fd=H("rtl"),Gd=H("table"),Hd=H("table-row"),Id=H("transparent"),Jd=H("vertical-lr"),Kd=H("vertical-rl"),Ld=H("visible"),Md=H("true"),Nd=new K(100,"%"),Od=new K(100,"vw"),Pd=new K(100,"vh"),Qd=new K(0,"px"),Sd={"font-size":1,color:2};function Td(a,b){return(Sd[a]||Number.MAX_VALUE)-(Sd[b]||Number.MAX_VALUE)};function Ud(a,b,c,d){this.V=a;this.R=b;this.U=c;this.O=d}function Vd(a,b){this.x=a;this.y=b}function Wd(){this.bottom=this.right=this.top=this.left=0}function Xd(a,b,c,d){this.b=a;this.d=b;this.f=c;this.e=d}function Yd(a,b,c,d){this.R=a;this.O=b;this.V=c;this.U=d;this.right=this.left=null}function Zd(a,b){return a.b.y-b.b.y||a.b.x-b.b.x}function $d(a){this.b=a}function ae(a,b,c){a=a.b;for(var d=a.length,e=a[d-1],f=0;f<d;f++){var g=a[f];b.push(e.y<g.y?new Xd(e,g,1,c):new Xd(g,e,-1,c));e=g}}
function be(a,b,c){for(var d=[],e=0;e<a.b.length;e++){var f=a.b[e];d.push(new Vd(f.x+b,f.y+c))}return new $d(d)}function ce(a,b,c,d){for(var e=[],f=0;20>f;f++){var g=2*f*Math.PI/20;e.push(new Vd(a+c*Math.sin(g),b+d*Math.cos(g)))}return new $d(e)}function de(a,b,c,d){return new $d([new Vd(a,b),new Vd(c,b),new Vd(c,d),new Vd(a,d)])}function ee(a,b,c,d){this.x=a;this.e=b;this.b=c;this.d=d}
function fe(a,b){var c=a.b.x+(a.d.x-a.b.x)*(b-a.b.y)/(a.d.y-a.b.y);if(isNaN(c))throw Error("Bad intersection");return c}function ge(a,b,c,d){var e,f;b.d.y<c&&v("Error: inconsistent segment (1)");b.b.y<=c?(c=fe(b,c),e=b.f):(c=b.b.x,e=0);b.d.y>=d?(d=fe(b,d),f=b.f):(d=b.d.x,f=0);c<d?(a.push(new ee(c,e,b.e,-1)),a.push(new ee(d,f,b.e,1))):(a.push(new ee(d,f,b.e,-1)),a.push(new ee(c,e,b.e,1)))}
function he(a,b,c){c=b+c;for(var d=Array(c),e=Array(c),f=0;f<=c;f++)d[f]=0,e[f]=0;for(var g=[],h=!1,k=a.length,l=0;l<k;l++){var n=a[l];d[n.b]+=n.e;e[n.b]+=n.d;for(var p=!1,f=0;f<b;f++)if(d[f]&&!e[f]){p=!0;break}if(p)for(f=b;f<=c;f++)if(d[f]||e[f]){p=!1;break}h!=p&&(g.push(n.x),h=p)}return g}function ie(a,b){return b?Math.ceil(a/b)*b:a}function je(a,b){return b?Math.floor(a/b)*b:a}function ke(a){return new Vd(a.y,-a.x)}function le(a){return new Ud(a.R,-a.U,a.O,-a.V)}
function me(a){return new $d(Na(a.b,ke))}
function ne(a,b,c,d,e){e&&(a=le(a),b=Na(b,me),c=Na(c,me));e=b.length;var f=c?c.length:0,g=[],h=[],k,l,n;for(k=0;k<e;k++)ae(b[k],h,k);for(k=0;k<f;k++)ae(c[k],h,k+e);b=h.length;h.sort(Zd);for(c=0;h[c].e>=e;)c++;c=h[c].b.y;c>a.R&&g.push(new Yd(a.R,c,a.U,a.U));k=0;for(var p=[];k<b&&(n=h[k]).b.y<c;)n.d.y>c&&p.push(n),k++;for(;k<b||0<p.length;){var r=a.O,q=ie(Math.ceil(c+8),d);for(l=0;l<p.length&&r>q;l++)n=p[l],n.b.x==n.d.x?n.d.y<r&&(r=Math.max(je(n.d.y,d),q)):n.b.x!=n.d.x&&(r=q);r>a.O&&(r=a.O);for(;k<
b&&(n=h[k]).b.y<r;)if(n.d.y<c)k++;else if(n.b.y<q){if(n.b.y!=n.d.y||n.b.y!=c)p.push(n),r=q;k++}else{l=je(n.b.y,d);l<r&&(r=l);break}q=[];for(l=0;l<p.length;l++)ge(q,p[l],c,r);q.sort(function(a,b){return a.x-b.x||a.d-b.d});q=he(q,e,f);if(0==q.length)g.push(new Yd(c,r,a.U,a.U));else{var y=0,x=a.V;for(l=0;l<q.length;l+=2){var I=Math.max(a.V,q[l]),J=Math.min(a.U,q[l+1])-I;J>y&&(y=J,x=I)}0==y?g.push(new Yd(c,r,a.U,a.U)):g.push(new Yd(c,r,Math.max(x,a.V),Math.min(x+y,a.U)))}if(r==a.O)break;c=r;for(l=p.length-
1;0<=l;l--)p[l].d.y<=r&&p.splice(l,1)}oe(a,g);return g}function oe(a,b){for(var c=b.length-1,d=new Yd(a.O,a.O,a.V,a.U);0<=c;){var e=d,d=b[c];d.V==e.V&&d.U==e.U&&(e.R=d.R,b.splice(c,1),d=e);c--}}function pe(a,b){for(var c=0,d=a.length;c<d;){var e=Math.floor((c+d)/2);b>=a[e].O?c=e+1:d=e}return c};function qe(a){return String.fromCharCode(a>>>24&255,a>>>16&255,a>>>8&255,a&255)}
function re(a){var b=new Aa;b.append(a);var c=55-a.length&63;for(b.append("\u0080");0<c;)c--,b.append("\x00");b.append("\x00\x00\x00\x00");b.append(qe(8*a.length));a=b.toString();for(var b=[1732584193,4023233417,2562383102,271733878,3285377520],c=[],d,e=0;e<a.length;e+=64){for(d=0;16>d;d++){var f=a.substr(e+4*d,4);c[d]=(f.charCodeAt(0)&255)<<24|(f.charCodeAt(1)&255)<<16|(f.charCodeAt(2)&255)<<8|f.charCodeAt(3)&255}for(;80>d;d++)f=c[d-3]^c[d-8]^c[d-14]^c[d-16],c[d]=f<<1|f>>>31;var f=b[0],g=b[1],h=
b[2],k=b[3],l=b[4],n;for(d=0;80>d;d++)n=20>d?(g&h|~g&k)+1518500249:40>d?(g^h^k)+1859775393:60>d?(g&h|g&k|h&k)+2400959708:(g^h^k)+3395469782,n+=(f<<5|f>>>27)+l+c[d],l=k,k=h,h=g<<30|g>>>2,g=f,f=n;b[0]=b[0]+f|0;b[1]=b[1]+g|0;b[2]=b[2]+h|0;b[3]=b[3]+k|0;b[4]=b[4]+l|0}return b}function se(a){a=re(a);for(var b=[],c=0;c<a.length;c++){var d=a[c];b.push(d>>>24&255,d>>>16&255,d>>>8&255,d&255)}return b}
function te(a){a=re(a);for(var b=new Aa,c=0;c<a.length;c++)b.append(qe(a[c]));a=b.toString();b=new Aa;for(c=0;c<a.length;c++)b.append((a.charCodeAt(c)|256).toString(16).substr(1));return b.toString()};var ue=null,ve=null;function M(a){if(!ue)throw Error("E_TASK_NO_CONTEXT");ue.name||(ue.name=a);var b=ue;a=new we(b,b.top,a);b.top=a;a.b=xe;return a}function O(a){return new ye(a)}function ze(a,b,c){a=M(a);a.g=c;try{b(a)}catch(d){Ae(a.d,d,a)}return P(a)}function Be(a){var b=Ce,c;ue?c=ue.d:(c=ve)||(c=new De(new Ee));b(c,a,void 0)}function Fe(a,b){var c=b.frameTrace;c?v(a+":\n"+c):v(a+":\n"+b.toString())}var xe=1;function Ee(){}Ee.prototype.currentTime=function(){return(new Date).valueOf()};
function Ge(a,b){return setTimeout(a,b)}Ee.prototype.log=function(a){window.console&&window.console.log&&window.console.log(a)};function De(a){this.e=a;this.f=1;this.slice=25;this.h=0;this.d=new ja;this.b=this.j=null;this.g=!1;this.K=0;ve||(ve=this)}
function He(a){if(!a.g){var b=a.d.b[1].b,c=a.e.currentTime();if(null!=a.b){if(c+a.f>a.j)return;clearTimeout(a.b)}b-=c;b<=a.f&&(b=a.f);a.j=c+b;a.b=Ge(function(){a.b=null;null!=a.b&&(clearTimeout(a.b),a.b=null);a.g=!0;try{var b=a.e.currentTime();for(a.h=b+a.slice;a.d.length();){var c=a.d.b[1];if(c.b>b)break;var f=a.d,g=f.b.pop(),h=f.b.length;if(1<h){for(var k=1;;){var l=2*k;if(l>=h)break;if(0<Ie(f.b[l],g))l+1<h&&0<Ie(f.b[l+1],f.b[l])&&l++;else if(l+1<h&&0<Ie(f.b[l+1],g))l++;else break;f.b[k]=f.b[l];
k=l}f.b[k]=g}var k=c,n=k.d;k.d=null;n&&n.e==k&&(n.e=null,l=ue,ue=n,Q(n.top,k.e),ue=l);b=a.e.currentTime();if(b>=a.h)break}}catch(p){}a.g=!1;a.d.length()&&He(a)},b)}}De.prototype.Sa=function(a,b){var c=this.e.currentTime();a.K=this.K++;a.b=c+(b||0);a:{for(var c=this.d,d=c.b.length;1<d;){var e=Math.floor(d/2),f=c.b[e];if(0<Ie(f,a)){c.b[d]=a;break a}c.b[d]=f;d=e}c.b[1]=a}He(this)};
function Ce(a,b,c){var d=new Je(a,c||"");d.top=new we(d,null,"bootstrap");d.top.b=xe;d.top.then(function(){function a(){d.h=!1;for(var b=0;b<d.g.length;b++){var c=d.g[b];try{c()}catch(e){}}}try{b().then(function(b){d.f=b;a()})}catch(c){Ae(d,c),a()}});c=ue;ue=d;a.Sa(Ke(d.top,"bootstrap"));ue=c;return d}function Le(a){this.d=a;this.K=this.b=0;this.e=null}function Ie(a,b){return b.b-a.b||b.K-a.K}Le.prototype.Sa=function(a,b){this.e=a;this.d.d.Sa(this,b)};
function Je(a,b){this.d=a;this.name=b;this.g=[];this.b=null;this.h=!0;this.e=this.top=this.j=this.f=null}function Me(a,b){a.g.push(b)}Je.prototype.join=function(){var a=M("Task.join");if(this.h){var b=Ke(a,this),c=this;Me(this,function(){b.Sa(c.f)})}else Q(a,this.f);return P(a)};
function Ae(a,b,c){var d=b.frameTrace;if(!d){for(var d=b.stack?b.stack+"\n\t---- async ---\n":"",e=a.top;e;e=e.parent)d+="\t",d+=e.name,d+="\n";b.frameTrace=d}if(c){for(d=a.top;d&&d!=c;)d=d.parent;d==c&&(a.top=d)}for(a.b=b;a.top&&!a.top.g;)a.top=a.top.parent;a.top?(b=a.b,a.b=null,a.top.g(a.top,b)):a.b&&Fe("Unhandled exception in task "+a.name,a.b)}function ye(a){this.value=a}m=ye.prototype;m.then=function(a){a(this.value)};m.fc=function(a){return a(this.value)};m.Zc=function(a){return new ye(a)};
m.ka=function(a){Q(a,this.value)};m.ua=function(){return!1};m.Pb=function(){return this.value};function Ne(a){this.b=a}m=Ne.prototype;m.then=function(a){this.b.then(a)};m.fc=function(a){if(this.ua()){var b=new we(this.b.d,this.b.parent,"AsyncResult.thenAsync");b.b=xe;this.b.parent=b;this.b.then(function(c){a(c).then(function(a){Q(b,a)})});return P(b)}return a(this.b.e)};m.Zc=function(a){return this.ua()?this.fc(function(){return new ye(a)}):new ye(a)};
m.ka=function(a){this.ua()?this.then(function(b){Q(a,b)}):Q(a,this.b.e)};m.ua=function(){return this.b.b==xe};m.Pb=function(){if(this.ua())throw Error("Result is pending");return this.b.e};function we(a,b,c){this.d=a;this.parent=b;this.name=c;this.e=null;this.b=0;this.g=this.f=null}function Oe(a){if(!ue)throw Error("F_TASK_NO_CONTEXT");if(a!==ue.top)throw Error("F_TASK_NOT_TOP_FRAME");}function P(a){return new Ne(a)}
function Q(a,b){Oe(a);ue.b||(a.e=b);a.b=2;var c=a.parent;ue.top=c;if(a.f){try{a.f(b)}catch(d){Ae(a.d,d,c)}a.b=3}}we.prototype.then=function(a){switch(this.b){case xe:if(this.f)throw Error("F_TASK_FRAME_ALREADY_HAS_CALLBACK");this.f=a;break;case 2:var b=this.d,c=this.parent;try{a(this.e),this.b=3}catch(d){this.b=3,Ae(b,d,c)}break;case 3:throw Error("F_TASK_DEAD_FRAME");default:throw Error("F_TASK_UNEXPECTED_FRAME_STATE "+this.b);}};
function Pe(){var a=M("Frame.timeSlice"),b=a.d.d;b.e.currentTime()>=b.h?(v("-- time slice --"),Ke(a).Sa(!0)):Q(a,!0);return P(a)}function Qe(a){function b(d){try{for(;d;){var e=a();if(e.ua()){e.then(b);return}e.then(function(a){d=a})}Q(c,!0)}catch(f){Ae(c.d,f,c)}}var c=M("Frame.loop");b(!0);return P(c)}function Re(a){var b=ue;if(!b)throw Error("E_TASK_NO_CONTEXT");return Qe(function(){var c;do c=new Se(b,b.top),b.top=c,c.b=xe,a(c),c=P(c);while(!c.ua()&&c.Pb());return c})}
function Ke(a,b){Oe(a);if(a.d.e)throw Error("E_TASK_ALREADY_SUSPENDED");var c=new Le(a.d);a.d.e=c;ue=null;a.d.j=b||null;return c}function Se(a,b){we.call(this,a,b,"loop")}t(Se,we);function Te(a){Q(a,!0)}function R(a){Q(a,!1)};function Ue(a,b,c,d,e){var f=M("ajax"),g=new XMLHttpRequest,h=Ke(f,g),k={status:0,url:a,responseText:null,responseXML:null,Xb:null};g.open(c||"GET",a,!0);b&&(g.responseType="blob");g.onreadystatechange=function(){if(4===g.readyState){k.status=g.status;if(200==k.status||0==k.status)if(!b&&g.responseXML)k.responseXML=g.responseXML;else{var c=g.response;b||"string"!=typeof c?c?"string"==typeof c?k.Xb=Ve([c]):k.Xb=c:v("Unexpected empty success response for "+a):k.responseText=c}h.Sa(k)}};d?(g.setRequestHeader("Content-Type",
e||"text/plain; charset=UTF-8"),g.send(d)):g.send(null);return P(f)}function Ve(a){var b=window.WebKitBlobBuilder||window.MSBlobBuilder;if(b){for(var b=new b,c=0;c<a.length;c++)b.append(a[c]);return b.getBlob("application/octet-stream")}return new Blob(a,{type:"application/octet-stream"})}function We(a){var b=M("readBlob"),c=new FileReader,d=Ke(b,c);c.addEventListener("load",function(){d.Sa(c.result)},!1);c.readAsArrayBuffer(a);return P(b)}function Xe(a,b){this.P=a;this.H=b;this.g={};this.e={}}
Xe.prototype.load=function(a){a=ca(a);var b=this.g[a];return"undefined"!=typeof b?O(b):Ye(this.Rb(a))};function Ze(a,b){var c=M("fetch");Ue(b,a.H).then(function(d){a.P(d,a).then(function(d){delete a.e[b];a.g[b]=d;Q(c,d)})});return P(c)}Xe.prototype.Rb=function(a){a=ca(a);if(this.g[a])return null;var b=this.e[a];if(!b){var c=this,b=new $e(function(){return Ze(c,a)},"Fetch "+a);c.e[a]=b;b.start()}return b};function af(a){a=a.responseText;return O(a?JSON.parse(a):null)};function bf(a){var b=parseInt(a,16);if(isNaN(b))throw Error("E_CSS_COLOR");if(6==a.length)return new ed(b);if(3==a.length)return new ed(b&15|(b&15)<<4|(b&240)<<4|(b&240)<<8|(b&3840)<<8|(b&3840)<<12);throw Error("E_CSS_COLOR");}function cf(a){this.e=a;this.Qa="Author"}m=cf.prototype;m.xb=function(){return null};m.S=function(){return this.e};m.N=function(){};m.qb=function(a){this.Qa=a};m.Ua=function(){};m.rc=function(){};m.Bb=function(){};m.Cb=function(){};m.xc=function(){};m.Qb=function(){};m.Wa=function(){};
m.qc=function(){};m.nc=function(){};m.uc=function(){};m.Cc=function(){};m.ab=function(){};m.ac=function(){};m.Fb=function(){};m.ec=function(){};m.Zb=function(){};m.dc=function(){};m.pb=function(){};m.Jc=function(){};m.hb=function(){};m.$b=function(){};m.cc=function(){};m.bc=function(){};m.Hb=function(){};m.Gb=function(){};m.ha=function(){};m.Ea=function(){};m.Pa=function(){};function df(a){switch(a.Qa){case "UA":return 0;case "User":return 100663296;default:return 83886080}}
function ef(a){switch(a.Qa){case "UA":return 0;case "User":return 16777216;default:return 33554432}}function ff(){cf.call(this,null);this.d=[];this.b=null}t(ff,cf);function gf(a,b){a.d.push(a.b);a.b=b}m=ff.prototype;m.xb=function(){return null};m.S=function(){return this.b.S()};m.N=function(a,b){this.b.N(a,b)};m.qb=function(a){cf.prototype.qb.call(this,a);0<this.d.length&&(this.b=this.d[0],this.d=[]);this.b.qb(a)};m.Ua=function(a,b){this.b.Ua(a,b)};m.rc=function(a){this.b.rc(a)};
m.Bb=function(a,b){this.b.Bb(a,b)};m.Cb=function(a,b){this.b.Cb(a,b)};m.xc=function(a){this.b.xc(a)};m.Qb=function(a,b,c,d){this.b.Qb(a,b,c,d)};m.Wa=function(){this.b.Wa()};m.qc=function(){this.b.qc()};m.nc=function(){this.b.nc()};m.uc=function(){this.b.uc()};m.Cc=function(){this.b.Cc()};m.ab=function(){this.b.ab()};m.ac=function(){this.b.ac()};m.Fb=function(a){this.b.Fb(a)};m.ec=function(){this.b.ec()};m.Zb=function(){this.b.Zb()};m.dc=function(){this.b.dc()};m.pb=function(){this.b.pb()};m.Jc=function(a){this.b.Jc(a)};
m.hb=function(a){this.b.hb(a)};m.$b=function(a){this.b.$b(a)};m.cc=function(){this.b.cc()};m.bc=function(a,b,c){this.b.bc(a,b,c)};m.Hb=function(a,b,c){this.b.Hb(a,b,c)};m.Gb=function(a,b,c){this.b.Gb(a,b,c)};m.ha=function(){this.b.ha()};m.Ea=function(a,b,c){this.b.Ea(a,b,c)};m.Pa=function(){this.b.Pa()};function hf(a,b,c){cf.call(this,a);this.H=c;this.F=0;this.Z=b}t(hf,cf);hf.prototype.xb=function(){return this.Z.xb()};hf.prototype.N=function(a){v(a)};hf.prototype.ha=function(){this.F++};
hf.prototype.Pa=function(){if(0==--this.F&&!this.H){var a=this.Z;a.b=a.d.pop()}};function jf(a,b,c){hf.call(this,a,b,c)}t(jf,hf);function kf(a,b){a.N(b,a.xb())}function lf(a,b){kf(a,b);gf(a.Z,new hf(a.e,a.Z,!1))}m=jf.prototype;m.ab=function(){lf(this,"E_CSS_UNEXPECTED_SELECTOR")};m.ac=function(){lf(this,"E_CSS_UNEXPECTED_FONT_FACE")};m.Fb=function(){lf(this,"E_CSS_UNEXPECTED_FOOTNOTE")};m.ec=function(){lf(this,"E_CSS_UNEXPECTED_VIEWPORT")};m.Zb=function(){lf(this,"E_CSS_UNEXPECTED_DEFINE")};
m.dc=function(){lf(this,"E_CSS_UNEXPECTED_REGION")};m.pb=function(){lf(this,"E_CSS_UNEXPECTED_PAGE")};m.hb=function(){lf(this,"E_CSS_UNEXPECTED_WHEN")};m.$b=function(){lf(this,"E_CSS_UNEXPECTED_FLOW")};m.cc=function(){lf(this,"E_CSS_UNEXPECTED_PAGE_TEMPLATE")};m.bc=function(){lf(this,"E_CSS_UNEXPECTED_PAGE_MASTER")};m.Hb=function(){lf(this,"E_CSS_UNEXPECTED_PARTITION")};m.Gb=function(){lf(this,"E_CSS_UNEXPECTED_PARTITION_GROUP")};m.Ea=function(){this.N("E_CSS_UNEXPECTED_PROPERTY",this.xb())};
var mf=[],nf=[],S=[],of=[],pf=[],qf=[],rf=[],T=[],sf=[],tf=[],uf=[],vf=[];mf[1]=28;mf[36]=29;mf[7]=29;mf[9]=29;mf[14]=29;mf[18]=29;mf[20]=30;mf[13]=27;mf[0]=200;nf[1]=46;nf[0]=200;pf[1]=2;pf[36]=4;pf[7]=6;pf[9]=8;pf[14]=10;pf[18]=14;S[37]=11;S[23]=12;S[35]=56;S[1]=1;S[36]=3;S[7]=5;S[9]=7;S[14]=9;S[12]=13;S[18]=55;S[50]=42;S[16]=41;of[1]=2;of[36]=4;of[7]=6;of[9]=8;of[18]=14;of[50]=42;of[14]=10;of[12]=13;qf[1]=15;qf[7]=16;qf[4]=17;qf[5]=18;qf[3]=19;qf[2]=20;qf[8]=21;qf[16]=22;qf[19]=23;qf[6]=24;
qf[11]=25;qf[17]=26;qf[13]=48;qf[31]=47;qf[23]=54;qf[0]=44;rf[1]=31;rf[4]=32;rf[5]=32;rf[3]=33;rf[2]=34;rf[10]=40;rf[6]=38;rf[31]=36;rf[24]=36;rf[32]=35;T[1]=45;T[16]=37;T[37]=37;T[38]=37;T[47]=37;T[48]=37;T[39]=37;T[49]=37;T[26]=37;T[25]=37;T[23]=37;T[24]=37;T[19]=37;T[21]=37;T[36]=37;T[18]=37;T[22]=37;T[11]=39;T[12]=43;T[17]=49;sf[0]=200;sf[12]=50;sf[13]=51;sf[14]=50;sf[15]=51;sf[10]=50;sf[11]=51;sf[17]=53;tf[0]=200;tf[12]=50;tf[13]=52;tf[14]=50;tf[15]=51;tf[10]=50;tf[11]=51;tf[17]=53;uf[0]=200;
uf[12]=50;uf[13]=51;uf[14]=50;uf[15]=51;uf[10]=50;uf[11]=51;vf[11]=0;vf[16]=0;vf[22]=1;vf[18]=1;vf[26]=2;vf[25]=2;vf[38]=3;vf[37]=3;vf[48]=3;vf[47]=3;vf[39]=3;vf[49]=3;vf[41]=3;vf[23]=4;vf[24]=4;vf[36]=5;vf[19]=5;vf[21]=5;vf[0]=6;vf[52]=2;function wf(a,b,c,d){this.b=a;this.w=b;this.h=c;this.ba=d;this.u=[];this.F={};this.d=this.A=null;this.k=!1;this.f=2;this.Y=null;this.l=!1;this.j=this.B=null;this.g=[];this.e=[];this.H=this.P=!1}
function xf(a,b){for(var c=[],d=a.u;;){c.push(d[b++]);if(b==d.length)break;if(","!=d[b++])throw Error("Unexpected state");}return c}
function yf(a,b,c){var d=a.u,e=d.length,f;do f=d[--e];while("undefined"!=typeof f&&"string"!=typeof f);var g=d.length-(e+1);1<g&&d.splice(e+1,g,new Uc(d.slice(e+1,d.length)));if(","==b)return null;e++;do f=d[--e];while("undefined"!=typeof f&&("string"!=typeof f||","==f));g=d.length-(e+1);if("("==f){if(")"!=b)return a.h.N("E_CSS_MISMATCHED_C_PAR",c),a.b=tf,null;a=new Wc(d[e-1],xf(a,e+1));d.splice(e-1,g+2,a);return null}return";"!=b||0<=e?(a.h.N("E_CSS_UNEXPECTED_VAL_END",c),a.b=tf,null):1<g?new Vc(xf(a,
e+1)):d[0]}function zf(a,b,c){a.b=a.d?tf:sf;a.h.N(b,c)}
function Af(a,b,c){for(var d=a.u,e=a.h,f=d.pop(),g;;){var h=d.pop();if(11==b){for(g=[f];16==h;)g.unshift(d.pop()),h=d.pop();if("string"==typeof h){if("{"==h){for(;2<=g.length;)a=g.shift(),c=g.shift(),a=new vc(e.S(),a,c),g.unshift(a);d.push(new L(g[0]));return!0}if("("==h){b=d.pop();f=d.pop();f=new Kc(e.S(),Wb(f,b),g);b=0;continue}}if(10==h){b=0;continue}}else if("string"==typeof h){d.push(h);break}if(0>h)if(-31==h)f=new qc(e.S(),f);else if(-24==h)f=new rc(e.S(),f);else return zf(a,"F_UNEXPECTED_STATE",
c),!1;else{if(vf[b]>vf[h]){d.push(h);break}g=d.pop();switch(h){case 26:f=new sc(e.S(),g,f);break;case 52:f=new tc(e.S(),g,f);break;case 25:f=new uc(e.S(),g,f);break;case 38:f=new wc(e.S(),g,f);break;case 37:f=new yc(e.S(),g,f);break;case 48:f=new xc(e.S(),g,f);break;case 47:f=new zc(e.S(),g,f);break;case 39:case 49:f=new Ac(e.S(),g,f);break;case 41:f=new Bc(e.S(),g,f);break;case 23:f=new Cc(e.S(),g,f);break;case 24:f=new Dc(e.S(),g,f);break;case 36:f=new Ec(e.S(),g,f);break;case 19:f=new Fc(e.S(),
g,f);break;case 21:f=new Gc(e.S(),g,f);break;case 18:if(1<d.length)switch(d[d.length-1]){case 22:d.pop();f=new Lc(e.S(),d.pop(),g,f);break;case 10:if(g.jd())f=new Mc(e.S(),g,f);else return zf(a,"E_CSS_MEDIA_TEST",c),!1}else return zf(a,"E_CSS_EXPR_COND",c),!1;break;case 22:if(18!=b)return zf(a,"E_CSS_EXPR_COND",c),!1;case 10:return d.push(g),d.push(h),d.push(f),!1;default:return zf(a,"F_UNEXPECTED_STATE",c),!1}}}d.push(f);return!1}
function Bf(a){for(var b=[];;){var c=w(a.w);switch(c.type){case 1:b.push(c.text);break;case 23:b.push("+");break;case 4:case 5:b.push(c.C);break;default:return b}A(a.w)}}
function Cf(a,b){var c=a.h.S();if(!c)return null;var d=c.g;if(b)for(var e=b.split(/\s+/),f=0;f<e.length;f++)switch(e[f]){case "vertical":d=Oc(c,d,new qc(c,new Ic(c,"pref-horizontal")));break;case "horizontal":d=Oc(c,d,new Ic(c,"pref-horizontal"));break;case "day":d=Oc(c,d,new qc(c,new Ic(c,"pref-night-mode")));break;case "night":d=Oc(c,d,new Ic(c,"pref-night-mode"));break;default:d=c.f}return d===c.g?null:new L(d)}
function Df(a){switch(a.e[a.e.length-1]){case "[selector]":case "font-face":case "-epubx-flow":case "-epubx-viewport":case "-epubx-define":case "-adapt-footnote-area":return!0}return!1}
function Ef(a,b,c,d){for(var e=a.h,f=a.w,g=a.u,h,k,l,n;0<b;--b)switch(h=w(f),a.b[h.type]){case 28:if(18!=z(f,1).type){Df(a)?(e.N("E_CSS_COLON_EXPECTED",z(f,1)),a.b=tf):(a.b=pf,e.ab());continue}k=z(f,2);if(!(k.b||1!=k.type&&6!=k.type)){if(0<=f.b)throw Error("F_CSSTOK_BAD_CALL mark");f.b=f.d}a.d=h.text;a.k=!1;A(f);A(f);a.b=qf;g.splice(0,g.length);continue;case 46:if(18!=z(f,1).type){a.b=tf;e.N("E_CSS_COLON_EXPECTED",z(f,1));continue}a.d=h.text;a.k=!1;A(f);A(f);a.b=qf;g.splice(0,g.length);continue;case 29:a.b=
pf;e.ab();continue;case 1:if(!h.b){a.b=uf;e.N("E_CSS_SPACE_EXPECTED",h);continue}e.Wa();case 2:if(34==z(f,1).type)if(A(f),A(f),l=a.F[h.text],null!=l)switch(h=w(f),h.type){case 1:e.Ua(l,h.text);a.b=S;A(f);break;case 36:e.Ua(l,null);a.b=S;A(f);break;default:a.b=sf,e.N("E_CSS_NAMESPACE",h)}else a.b=sf,e.N("E_CSS_UNDECLARED_PREFIX",h);else e.Ua(a.A,h.text),a.b=S,A(f);continue;case 3:if(!h.b){a.b=uf;e.N("E_CSS_SPACE_EXPECTED",h);continue}e.Wa();case 4:if(34==z(f,1).type)switch(A(f),A(f),h=w(f),h.type){case 1:e.Ua(null,
h.text);a.b=S;A(f);break;case 36:e.Ua(null,null);a.b=S;A(f);break;default:a.b=sf,e.N("E_CSS_NAMESPACE",h)}else e.Ua(a.A,null),a.b=S,A(f);continue;case 5:h.b&&e.Wa();case 6:e.xc(h.text);a.b=S;A(f);continue;case 7:h.b&&e.Wa();case 8:e.rc(h.text);a.b=S;A(f);continue;case 55:h.b&&e.Wa();case 14:A(f);h=w(f);switch(h.type){case 1:e.Bb(h.text,null);A(f);a.b=S;continue;case 6:if(k=h.text,A(f),l=Bf(a),h=w(f),11==h.type){e.Bb(k,l);A(f);a.b=S;continue}}e.N("E_CSS_PSEUDOCLASS_SYNTAX",h);a.b=sf;continue;case 42:A(f);
h=w(f);switch(h.type){case 1:e.Cb(h.text,null);a.b=S;A(f);continue;case 6:if(k=h.text,A(f),l=Bf(a),h=w(f),11==h.type){e.Cb(k,l);a.b=S;A(f);continue}}e.N("E_CSS_PSEUDOELEM_SYNTAX",h);a.b=sf;continue;case 9:h.b&&e.Wa();case 10:A(f);h=w(f);if(1==h.type)k=h.text,A(f);else if(36==h.type)k=null,A(f);else if(34==h.type)k="";else{a.b=uf;e.N("E_CSS_ATTR",h);A(f);continue}h=w(f);if(34==h.type){l=k?a.F[k]:k;if(null==l){a.b=uf;e.N("E_CSS_UNDECLARED_PREFIX",h);A(f);continue}A(f);h=w(f);if(1!=h.type){a.b=uf;e.N("E_CSS_ATTR_NAME_EXPECTED",
h);continue}k=h.text;A(f);h=w(f)}else l="";switch(h.type){case 39:case 45:case 44:case 46:case 50:n=h.type;A(f);h=w(f);break;case 15:e.Qb(l,k,0,null);a.b=S;A(f);continue;default:a.b=uf;e.N("E_CSS_ATTR_OP_EXPECTED",h);continue}switch(h.type){case 1:case 2:e.Qb(l,k,n,h.text);A(f);h=w(f);break;default:a.b=uf;e.N("E_CSS_ATTR_VAL_EXPECTED",h);continue}if(15!=h.type){a.b=uf;e.N("E_CSS_ATTR",h);continue}a.b=S;A(f);continue;case 11:e.qc();a.b=of;A(f);continue;case 12:e.nc();a.b=of;A(f);continue;case 56:e.uc();
a.b=of;A(f);continue;case 13:a.P?(a.e.push("-epubx-region"),a.P=!1):a.H?(a.e.push("page"),a.H=!1):a.e.push("[selector]");e.ha();a.b=mf;A(f);continue;case 41:e.Cc();a.b=pf;A(f);continue;case 15:g.push(H(h.text));A(f);continue;case 16:try{g.push(bf(h.text))}catch(p){e.N("E_CSS_COLOR",h),a.b=sf}A(f);continue;case 17:g.push(new cd(h.C));A(f);continue;case 18:g.push(new dd(h.C));A(f);continue;case 19:g.push(new K(h.C,h.text));A(f);continue;case 20:g.push(new ad(h.text));A(f);continue;case 21:g.push(new fd(ea(h.text,
a.ba)));A(f);continue;case 22:yf(a,",",h);g.push(",");A(f);continue;case 23:g.push($c);A(f);continue;case 24:k=h.text.toLowerCase();"-epubx-expr"==k?(a.b=rf,a.f=0,g.push("{")):(g.push(k),g.push("("));A(f);continue;case 25:yf(a,")",h);A(f);continue;case 47:A(f);h=w(f);k=z(f,1);if(1==h.type&&"important"==h.text.toLowerCase()&&(17==k.type||0==k.type||13==k.type)){A(f);a.k=!0;continue}zf(a,"E_CSS_SYNTAX",h);continue;case 54:k=z(f,1);switch(k.type){case 4:case 3:case 5:if(!k.b){A(f);continue}}zf(a,"E_CSS_UNEXPECTED_PLUS",
h);continue;case 26:A(f);case 48:f.b=-1;(k=yf(a,";",h))&&a.d&&e.Ea(a.d,k,a.k);a.b=d?nf:mf;continue;case 44:A(f);f.b=-1;k=yf(a,";",h);if(c)return a.Y=k,!0;a.d&&k&&e.Ea(a.d,k,a.k);if(d)return!0;zf(a,"E_CSS_SYNTAX",h);continue;case 31:k=z(f,1);9==k.type?(10!=z(f,2).type||z(f,2).b?(g.push(new Ic(e.S(),Wb(h.text,k.text))),a.b=T):(g.push(h.text,k.text,"("),A(f)),A(f)):(2==a.f||3==a.f?"not"==h.text.toLowerCase()?(A(f),g.push(new Jc(e.S(),!0,k.text))):("only"==h.text.toLowerCase()&&(A(f),h=k),g.push(new Jc(e.S(),
!1,h.text))):g.push(new Ic(e.S(),h.text)),a.b=T);A(f);continue;case 38:g.push(null,h.text,"(");A(f);continue;case 32:g.push(new Zb(e.S(),h.C));A(f);a.b=T;continue;case 33:k=h.text;"%"==k&&(k=a.d&&a.d.match(/height|^(top|bottom)$/)?"vh":"vw");g.push(new Hc(e.S(),h.C,k));A(f);a.b=T;continue;case 34:g.push(new Zb(e.S(),h.text));A(f);a.b=T;continue;case 35:A(f);h=w(f);5!=h.type||h.b?zf(a,"E_CSS_SYNTAX",h):(g.push(new Nc(e.S(),h.C)),A(f),a.b=T);continue;case 36:g.push(-h.type);A(f);continue;case 37:a.b=
rf;Af(a,h.type,h);g.push(h.type);A(f);continue;case 45:"and"==h.text.toLowerCase()?(a.b=rf,Af(a,52,h),g.push(52),A(f)):zf(a,"E_CSS_SYNTAX",h);continue;case 39:Af(a,h.type,h)&&(a.d?a.b=qf:zf(a,"E_CSS_UNBALANCED_PAR",h));A(f);continue;case 43:Af(a,11,h)&&(a.d||3==a.f?zf(a,"E_CSS_UNEXPECTED_BRC",h):(1==a.f?e.hb(g.pop()):(h=g.pop(),e.hb(h)),a.e.push("media"),e.ha(),a.b=mf));A(f);continue;case 49:Af(a,11,h)&&(a.d||3!=a.f?zf(a,"E_CSS_UNEXPECTED_SEMICOL",h):(a.j=g.pop(),a.l=!0,a.b=mf));A(f);continue;case 40:g.push(h.type);
A(f);continue;case 27:a.b=mf;A(f);e.Pa();a.e.length&&a.e.pop();continue;case 30:k=h.text.toLowerCase();switch(k){case "import":A(f);h=w(f);if(2==h.type||8==h.type){a.B=h.text;A(f);h=w(f);if(17==h.type||0==h.type)return a.l=!0,A(f),!1;a.d=null;a.f=3;a.b=rf;g.push("{");continue}e.N("E_CSS_IMPORT_SYNTAX",h);a.b=sf;continue;case "namespace":A(f);h=w(f);switch(h.type){case 1:k=h.text;A(f);h=w(f);if((2==h.type||8==h.type)&&17==z(f,1).type){a.F[k]=h.text;A(f);A(f);continue}break;case 2:case 8:if(17==z(f,
1).type){a.A=h.text;A(f);A(f);continue}}e.N("E_CSS_NAMESPACE_SYNTAX",h);a.b=sf;continue;case "charset":A(f);h=w(f);if(2==h.type&&17==z(f,1).type){k=h.text.toLowerCase();"utf-8"!=k&&"utf-16"!=k&&e.N("E_CSS_UNEXPECTED_CHARSET "+k,h);A(f);A(f);continue}e.N("E_CSS_CHARSET_SYNTAX",h);a.b=sf;continue;case "font-face":case "-epubx-page-template":case "-epubx-define":case "-epubx-viewport":if(12==z(f,1).type){A(f);A(f);switch(k){case "font-face":e.ac();break;case "-epubx-page-template":e.cc();break;case "-epubx-define":e.Zb();
break;case "-epubx-viewport":e.ec()}a.e.push(k);e.ha();continue}break;case "-adapt-footnote-area":A(f);h=w(f);switch(h.type){case 12:A(f);e.Fb(null);a.e.push(k);e.ha();continue;case 50:if(A(f),h=w(f),1==h.type&&12==z(f,1).type){k=h.text;A(f);A(f);e.Fb(k);a.e.push("-adapt-footnote-area");e.ha();continue}}break;case "-epubx-region":A(f);e.dc();a.P=!0;a.b=pf;continue;case "page":A(f);e.pb();a.H=!0;a.b=of;continue;case "top-left-corner":case "top-left":case "top-center":case "top-right":case "top-right-corner":case "right-top":case "right-middle":case "right-bottom":case "bottom-right-corner":case "bottom-right":case "bottom-center":case "bottom-left":case "bottom-left-corner":case "left-bottom":case "left-middle":case "left-top":A(f);
h=w(f);if(12==h.type){A(f);e.Jc(k);a.e.push(k);e.ha();continue}break;case "-epubx-when":A(f);a.d=null;a.f=1;a.b=rf;g.push("{");continue;case "media":A(f);a.d=null;a.f=2;a.b=rf;g.push("{");continue;case "-epubx-flow":if(1==z(f,1).type&&12==z(f,2).type){e.$b(z(f,1).text);A(f);A(f);A(f);a.e.push(k);e.ha();continue}break;case "-epubx-page-master":case "-epubx-partition":case "-epubx-partition-group":A(f);h=w(f);n=l=null;var r=[];1==h.type&&(l=h.text,A(f),h=w(f));18==h.type&&1==z(f,1).type&&(n=z(f,1).text,
A(f),A(f),h=w(f));for(;6==h.type&&"class"==h.text.toLowerCase()&&1==z(f,1).type&&11==z(f,2).type;)r.push(z(f,1).text),A(f),A(f),A(f),h=w(f);if(12==h.type){A(f);switch(k){case "-epubx-page-master":e.bc(l,n,r);break;case "-epubx-partition":e.Hb(l,n,r);break;case "-epubx-partition-group":e.Gb(l,n,r)}a.e.push(k);e.ha();continue}break;case "":e.N("E_CSS_UNEXPECTED_AT"+k,h);a.b=uf;continue;default:e.N("E_CSS_AT_UNKNOWN "+k,h);a.b=sf;continue}e.N("E_CSS_AT_SYNTAX "+k,h);a.b=sf;continue;case 50:if(c||d)return!0;
a.g.push(h.type+1);A(f);continue;case 52:if(c||d)return!0;if(0==a.g.length){a.b=mf;continue}case 51:0<a.g.length&&a.g[a.g.length-1]==h.type&&a.g.pop();0==a.g.length&&13==h.type&&(a.b=mf);A(f);continue;case 53:if(c||d)return!0;0==a.g.length&&(a.b=mf);A(f);continue;case 200:return!0;default:if(c||d)return!0;if(a.b===qf&&0<=f.b){h=f;if(0>h.b)throw Error("F_CSSTOK_BAD_CALL reset");h.d=h.b;h.b=-1;a.b=pf;e.ab();continue}if(a.b!==sf&&a.b!==uf&&a.b!==tf){51==h.type?e.N(h.text,h):e.N("E_CSS_SYNTAX",h);a.b=
Df(a)?tf:uf;continue}A(f)}return!1}function Ff(a){cf.call(this,null);this.e=a}t(Ff,cf);Ff.prototype.N=function(a){throw Error(a);};Ff.prototype.S=function(){return this.e};
function Gf(a,b,c,d){var e=M("parseStylesheet"),f=new wf(mf,a,b,c),g=Cf(f,d);g&&(b.hb(g),b.ha());Qe(function(){for(;!Ef(f,100,!1,!1);){if(f.l){var a=ea(f.B,c);f.j&&(b.hb(f.j),b.ha());var d=M("parseStylesheet.import");Hf(a,b,null).then(function(){f.j&&b.Pa();f.l=!1;f.B=null;f.j=null;Q(d,!0)});return P(d)}a=Pe();if(a.ua)return a}return O(!1)}).then(function(){g&&b.Pa();Q(e,!0)});return P(e)}
function Hf(a,b,c){return ze("parseStylesheetFromURL",function(d){Ue(a).then(function(e){e.responseText?(e=new Nb(e.responseText),Gf(e,b,a,c).ka(d)):Q(d,!0)})},function(b,c){Fe("Exception while parsing: "+a,c);Q(b,!0)})}function If(a,b){var c=new wf(qf,b,new Ff(a),"");Ef(c,Number.POSITIVE_INFINITY,!0,!1);return c.Y}var Jf={"z-index":!0,"column-count":!0,"flow-linger":!0,opacity:!0,page:!0,"flow-priority":!0,utilization:!0};
function Kf(a,b,c){if(b.Sc())a:{b=b.e;a=b.evaluate(a);switch(typeof a){case "number":c=Jf[c]?a==Math.round(a)?new dd(a):new cd(a):new K(a,"px");break a;case "string":c=a?If(b.b,new Nb(a)):G;break a;case "boolean":c=a?Md:pd;break a;case "undefined":c=G;break a}throw Error("E_UNEXPECTED");}else c=b;return c};function Lf(){this.b={}}t(Lf,Sc);Lf.prototype.eb=function(a){this.b[a.name]=!0;return a};Lf.prototype.Na=function(a){this.Va(a.values);return a};function Mf(a){this.value=a}t(Mf,Sc);Mf.prototype.sb=function(a){this.value=a.C;return a};function Nf(a,b){if(a){var c=new Mf(b);try{return a.M(c),c.value}catch(d){v("toInt: "+d)}}return b}function Of(){this.d=!1;this.b=[];this.name=null}t(Of,Sc);Of.prototype.ub=function(a){this.d&&this.b.push(a);return null};
Of.prototype.tb=function(a){this.d&&0==a.C&&this.b.push(new K(0,"px"));return null};Of.prototype.Na=function(a){this.Va(a.values);return null};Of.prototype.cb=function(a){this.d||(this.d=!0,this.Va(a.values),this.d=!1,this.name=a.name.toLowerCase());return null};
function Pf(a,b,c,d,e,f){if(a){var g=new Of;try{a.M(g);var h;a:{if(0<g.b.length){a=[];for(var k=0;k<g.b.length;k++){var l=g.b[k];if("%"==l.b){var n=0==k%2?d:e;3==k&&"circle"==g.name&&(n=Math.sqrt((d*d+e*e)/2));a.push(l.C*n/100)}else a.push(l.C*gc(f,l.b))}switch(g.name){case "polygon":if(0==a.length%2){f=[];for(g=0;g<a.length;g+=2)f.push({x:b+a[g],y:c+a[g+1]});h=new $d(f);break a}break;case "rectangle":if(4==a.length){h=de(b+a[0],c+a[1],b+a[0]+a[2],c+a[1]+a[3]);break a}break;case "ellipse":if(4==a.length){h=
ce(b+a[0],c+a[1],a[2],a[3]);break a}break;case "circle":if(3==a.length){h=ce(b+a[0],c+a[1],a[2],a[2]);break a}}}h=null}return h}catch(p){v("toShape: "+p)}}return de(b,c,b+d,c+e)}function Qf(a){this.d=a;this.b={};this.name=null}t(Qf,Sc);Qf.prototype.eb=function(a){this.name=a.toString();this.b[this.name]=this.d?0:(this.b[this.name]||0)+1;return a};Qf.prototype.sb=function(a){this.name&&(this.b[this.name]+=a.C-(this.d?0:1));return a};Qf.prototype.Na=function(a){this.Va(a.values);return a};
function Rf(a,b){var c=new Qf(b);try{a.M(c)}catch(d){v("toCounters: "+d)}return c.b}function Sf(){this.url=null;this.b=!1}t(Sf,Sc);Sf.prototype.vb=function(a){this.url||(this.url=a.url);return a};var Tf={opentype:!0,truetype:!0,woff:!0,woff2:!0};Sf.prototype.cb=function(a){if("format"==a.name.toLowerCase())for(var b=0;b<a.values.length;b++)if(Tf[a.values[b].stringValue()]){this.b=!0;break}return a};
Sf.prototype.Na=function(a){2==a.values.length&&(this.b=!1,a.values[1].M(this),this.b&&a.values[0].M(this));return a};Sf.prototype.bb=function(a){this.Va(a.values);return a};function $e(a,b){this.Rb=a;this.name=b;this.d=!1;this.e=this.b=this.f=null}$e.prototype.start=function(){if(!this.b){var a=this;this.b=Ce(ue.d,function(){var b=M("Fetcher.run");a.Rb().then(function(c){var d=a.e;a.d=!0;a.f=c;a.b=null;a.e=null;if(d)for(var e=0;e<d.length;e++)try{d[e](c)}catch(f){v("Error: "+f)}Q(b,c)});return P(b)},this.name)}};function Uf(a,b){a.d?b(a.f):a.e.push(b)}function Ye(a){if(a.d)return O(a.f);a.start();return a.b.join()}
function Vf(a){if(0==a.length)return O(!0);if(1==a.length)return Ye(a[0]).Zc(!0);var b=M("waitForFetches"),c=0;Qe(function(){for(;c<a.length;){var b=a[c++];if(!b.d)return Ye(b).Zc(!0)}return O(!1)}).then(function(){Q(b,!0)});return P(b)}
function Wf(a,b){var c=null,d=null;"img"==a.localName&&(c=a.getAttribute("width"),d=a.getAttribute("height"));var e=new $e(function(){function e(b){"img"==a.localName&&(c||a.removeAttribute("width"),d||a.removeAttribute("height"));h.Sa(b?b.type:"timeout")}var g=M("loadImage"),h=Ke(g,a);a.addEventListener("load",e,!1);a.addEventListener("error",e,!1);a.addEventListener("abort",e,!1);"http://www.w3.org/2000/svg"==a.namespaceURI?(a.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",b),setTimeout(e,
300)):a.src=b;return P(g)},"loadElement "+b);e.start();return e};function Xf(a){this.f=this.e=null;this.b=0;this.d=a}function Yf(a,b){this.b=-1;this.d=a;this.e=b}function Zf(){this.b=[];this.d=[];this.match=[];this.e=[];this.f=[];this.g=!0}function $f(a,b,c){for(var d=0;d<b.length;d++)a.d[b[d]].b=c;b.splice(0,b.length)}
Zf.prototype.clone=function(){for(var a=new Zf,b=0;b<this.b.length;b++){var c=this.b[b],d=new Xf(c.d);d.b=c.b;a.b.push(d)}for(b=0;b<this.d.length;b++)c=this.d[b],d=new Yf(c.d,c.e),d.b=c.b,a.d.push(d);a.match.push.apply(a.match,this.match);a.e.push.apply(a.e,this.e);a.f.push.apply(a.f,this.f);return a};function ag(a,b,c,d){var e=a.b.length,f=new Xf(bg);f.b=0<=d?c?2*d+1:2*d+2:c?-1:-2;a.b.push(f);$f(a,b,e);c=new Yf(e,!0);e=new Yf(e,!1);b.push(a.d.length);a.d.push(e);b.push(a.d.length);a.d.push(c)}
function cg(a){return 1==a.b.length&&0==a.b[0].b&&a.b[0].d instanceof dg}
function eg(a,b,c){if(0!=b.b.length){var d=a.b.length;if(4==c&&1==d&&cg(b)&&cg(a)){c=a.b[0].d;b=b.b[0].d;var d={},e={},f;for(f in c.d)d[f]=c.d[f];for(f in b.d)d[f]=b.d[f];for(var g in c.e)e[g]=c.e[g];for(g in b.e)e[g]=b.e[g];a.b[0].d=new dg(c.b|b.b,d,e)}else{for(f=0;f<b.b.length;f++)a.b.push(b.b[f]);4==c?(a.g=!0,$f(a,a.e,d)):$f(a,a.match,d);g=a.d.length;for(f=0;f<b.d.length;f++)e=b.d[f],e.d+=d,0<=e.b&&(e.b+=d),a.d.push(e);for(f=0;f<b.match.length;f++)a.match.push(b.match[f]+g);3==c&&$f(a,a.match,
d);if(2==c||3==c)for(f=0;f<b.e.length;f++)a.match.push(b.e[f]+g);else if(a.g){for(f=0;f<b.e.length;f++)a.e.push(b.e[f]+g);a.g=b.g}else for(f=0;f<b.e.length;f++)a.f.push(b.e[f]+g);for(f=0;f<b.f.length;f++)a.f.push(b.f[f]+g);b.b=null;b.d=null}}}var U={};function fg(){}t(fg,Sc);fg.prototype.f=function(a,b){var c=a[b].M(this);return c?[c]:null};function dg(a,b,c){this.b=a;this.d=b;this.e=c}t(dg,fg);m=dg.prototype;m.Kc=function(a){return this.b&1?a:null};m.Lc=function(a){return this.b&2048?a:null};
m.Jb=function(a){return this.b&2?a:null};m.eb=function(a){var b=this.d[a.name.toLowerCase()];return b?b:this.b&4?a:null};m.ub=function(a){return 0!=a.C||this.b&512?0>a.C&&!(this.b&256)?null:this.e[a.b]?a:null:"%"==a.b&&this.b&1024?a:null};m.tb=function(a){return 0==a.C?this.b&512?a:null:0>=a.C&&!(this.b&256)?null:this.b&16?a:null};m.sb=function(a){return 0==a.C?this.b&512?a:null:0>=a.C&&!(this.b&256)?null:this.b&48?a:(a=this.d[""+a.C])?a:null};m.hc=function(a){return this.b&64?a:null};
m.vb=function(a){return this.b&128?a:null};m.Na=function(){return null};m.bb=function(){return null};m.cb=function(){return null};m.rb=function(){return null};var bg=new dg(0,U,U);
function gg(a){this.b=new Xf(null);var b=this.e=new Xf(null),c=a.b.length;a.b.push(this.b);a.b.push(b);$f(a,a.match,c);$f(a,a.e,c+1);$f(a,a.f,c+1);for(b=0;b<a.d.length;b++){var d=a.d[b];d.e?a.b[d.d].e=a.b[d.b]:a.b[d.d].f=a.b[d.b]}for(b=0;b<c;b++)if(null==a.b[b].f||null==a.b[b].e)throw Error("Invalid validator state");this.d=a.b[0]}t(gg,fg);
function hg(a,b,c,d){for(var e=c?[]:b,f=a.d,g=d,h=null,k=null;f!==a.b&&f!==a.e;)if(g>=b.length)f=f.f;else{var l=b[g],n=l;if(0!=f.b)n=!0,-1==f.b?(h?h.push(k):h=[k],k=[]):-2==f.b?0<h.length?k=h.pop():k=null:0<f.b&&0==f.b%2?k[Math.floor((f.b-1)/2)]="taken":n=null==k[Math.floor((f.b-1)/2)],f=n?f.e:f.f;else{if(0==g&&!c&&f.d instanceof ig&&a instanceof jg){if(n=(new Uc(b)).M(f.d)){g=b.length;f=f.e;continue}}else n=l.M(f.d);if(n){if(n!==l&&b===e)for(e=[],l=0;l<g;l++)e[l]=b[l];b!==e&&(e[g-d]=n);g++;f=f.e}else f=
f.f}}return f===a.b&&(c?0<e.length:g==b.length)?e:null}m=gg.prototype;m.Ia=function(a){for(var b=null,c=this.d;c!==this.b&&c!==this.e;)a?0!=c.b?c=c.e:(b=a.M(c.d))?(a=null,c=c.e):c=c.f:c=c.f;return c===this.b?b:null};m.Kc=function(a){return this.Ia(a)};m.Lc=function(a){return this.Ia(a)};m.Jb=function(a){return this.Ia(a)};m.eb=function(a){return this.Ia(a)};m.ub=function(a){return this.Ia(a)};m.tb=function(a){return this.Ia(a)};m.sb=function(a){return this.Ia(a)};m.hc=function(a){return this.Ia(a)};
m.vb=function(a){return this.Ia(a)};m.Na=function(){return null};m.bb=function(){return null};m.cb=function(a){return this.Ia(a)};m.rb=function(){return null};function jg(a){gg.call(this,a)}t(jg,gg);jg.prototype.Na=function(a){var b=hg(this,a.values,!1,0);return b===a.values?a:b?new Uc(b):null};jg.prototype.f=function(a,b){return hg(this,a,!0,b)};function ig(a){gg.call(this,a)}t(ig,gg);ig.prototype.Na=function(a){return this.Ia(a)};
ig.prototype.bb=function(a){var b=hg(this,a.values,!1,0);return b===a.values?a:b?new Vc(b):null};function kg(a,b){gg.call(this,b);this.name=a}t(kg,gg);kg.prototype.Ia=function(){return null};kg.prototype.cb=function(a){if(a.name.toLowerCase()!=this.name)return null;var b=hg(this,a.values,!1,0);return b===a.values?a:b?new Wc(a.name,b):null};function lg(){}lg.prototype.b=function(a,b){return b};lg.prototype.e=function(){};
function mg(a,b,c){this.name=b;this.d=a.e[this.name];c&&this.d instanceof ig&&(this.d=this.d.d.d)}t(mg,lg);mg.prototype.b=function(a,b,c){if(c.values[this.name])return b;if(a=this.d.f(a,b)){var d=a.length;this.e(1<d?new Uc(a):a[0],c);return b+d}return b};mg.prototype.e=function(a,b){b.values[this.name]=a};function ng(a,b){mg.call(this,a,b[0],!1);this.f=b}t(ng,mg);ng.prototype.e=function(a,b){for(var c=0;c<this.f.length;c++)b.values[this.f[c]]=a};function og(a,b){this.d=a;this.Xc=b}t(og,lg);
og.prototype.b=function(a,b,c){var d=b;if(this.Xc)if(a[b]==$c){if(++b==a.length)return d}else return d;var e=this.d[0].b(a,b,c);if(e==b)return d;b=e;for(d=1;d<this.d.length&&b<a.length;d++){e=this.d[d].b(a,b,c);if(e==b)break;b=e}return b};function pg(){this.d=this.Ga=null;this.b=!1;this.values={};this.e=null}m=pg.prototype;m.pd=function(a){return new mg(this.e,a,!1)};m.clone=function(){var a=new this.constructor;a.Ga=this.Ga;a.d=this.d;a.e=this.e;return a};m.Pc=function(a,b){this.Ga=a;this.d=b};
m.jb=function(){this.b=!0;return 0};function qg(a,b){a.jb([b]);return null}m.Kc=function(a){return qg(this,a)};m.Jb=function(a){return qg(this,a)};m.eb=function(a){return qg(this,a)};m.ub=function(a){return qg(this,a)};m.tb=function(a){return qg(this,a)};m.sb=function(a){return qg(this,a)};m.hc=function(a){return qg(this,a)};m.vb=function(a){return qg(this,a)};m.Na=function(a){this.jb(a.values);return null};m.bb=function(){this.b=!0;return null};m.cb=function(a){return qg(this,a)};
m.rb=function(){this.b=!0;return null};function rg(){pg.call(this)}t(rg,pg);rg.prototype.jb=function(a){for(var b=0,c=0;b<a.length;){var d=this.Ga[c].b(a,b,this);if(d>b)b=d,c=0;else if(++c==this.Ga.length){this.b=!0;break}}return b};function sg(){pg.call(this)}t(sg,pg);sg.prototype.jb=function(a){if(a.length>this.Ga.length||0==a.length)return this.b=!0,0;for(var b=0;b<this.Ga.length;b++){for(var c=b;c>=a.length;)c=1==c?0:c-2;if(this.Ga[b].b(a,c,this)!=c+1)return this.b=!0,0}return a.length};
function tg(){pg.call(this)}t(tg,pg);tg.prototype.jb=function(a){for(var b=a.length,c=0;c<a.length;c++)if(a[c]===$c){b=c;break}if(b>this.Ga.length||0==a.length)return this.b=!0,0;for(c=0;c<this.Ga.length;c++){for(var d=c;d>=b;)d=1==d?0:d-2;var e;if(b+1<a.length)for(e=b+c+1;e>=a.length;)e-=e==b+2?1:2;else e=d;if(2!=this.Ga[c].b([a[d],a[e]],0,this))return this.b=!0,0}return a.length};function ug(){pg.call(this)}t(ug,rg);ug.prototype.pd=function(a){return new mg(this.e,a,!0)};
ug.prototype.bb=function(a){for(var b={},c=0;c<a.values.length;c++){this.values={};a.values[c].M(this);for(var d=b,e=this.values,f=0;f<this.d.length;f++){var g=this.d[f],h=e[g]||this.e.h[g],k=d[g];k||(k=[],d[g]=k);k.push(h)}this.values["background-color"]&&c!=a.values.length-1&&(this.b=!0);if(this.b)return null}this.values={};for(var l in b)this.values[l]="background-color"==l?b[l].pop():new Vc(b[l]);return null};function vg(){pg.call(this)}t(vg,rg);
vg.prototype.Pc=function(a,b){rg.prototype.Pc.call(this,a,b);this.d.push("font-family","line-height","font-size")};
vg.prototype.jb=function(a){var b=rg.prototype.jb.call(this,a);if(b+2>a.length)return this.b=!0,b;this.b=!1;var c=this.e.e;if(!a[b].M(c["font-size"]))return this.b=!0,b;this.values["font-size"]=a[b++];if(a[b]===$c){b++;if(b+2>a.length||!a[b].M(c["line-height"]))return this.b=!0,b;this.values["line-height"]=a[b++]}var d=b==a.length-1?a[b]:new Uc(a.slice(b,a.length));if(!d.M(c["font-family"]))return this.b=!0,b;this.values["font-family"]=d;return a.length};
vg.prototype.bb=function(a){a.values[0].M(this);if(this.b)return null;for(var b=[this.values["font-family"]],c=1;c<a.values.length;c++)b.push(a.values[c]);a=new Vc(b);a.M(this.e.e["font-family"])?this.values["font-family"]=a:this.b=!0;return null};vg.prototype.eb=function(a){if(a=this.e.d[a.name])for(var b in a)this.values[b]=a[b];else this.b=!0;return null};var wg={SIMPLE:rg,INSETS:sg,INSETS_SLASH:tg,COMMA:ug,FONT:vg};
function xg(){this.e={};this.k={};this.h={};this.b={};this.d={};this.f={};this.j=[];this.g=[]}function yg(a,b){var c;if(3==b.type)c=new K(b.C,b.text);else if(7==b.type)c=bf(b.text);else if(1==b.type)c=H(b.text);else throw Error("unexpected replacement");if(cg(a)){var d=a.b[0].d.d,e;for(e in d)d[e]=c;return a}throw Error("unexpected replacement");}
function zg(a,b,c){for(var d=new Zf,e=0;e<b;e++)eg(d,a.clone(),1);if(c==Number.POSITIVE_INFINITY)eg(d,a,3);else for(e=b;e<c;e++)eg(d,a.clone(),2);return d}function Ag(a){var b=new Zf,c=b.b.length;b.b.push(new Xf(a));a=new Yf(c,!0);var d=new Yf(c,!1);$f(b,b.match,c);b.g?(b.e.push(b.d.length),b.g=!1):b.f.push(b.d.length);b.d.push(d);b.match.push(b.d.length);b.d.push(a);return b}
function Bg(a,b){var c;switch(a){case "COMMA":c=new ig(b);break;case "SPACE":c=new jg(b);break;default:c=new kg(a.toLowerCase(),b)}return Ag(c)}
function Cg(a){a.b.HASHCOLOR=Ag(new dg(64,U,U));a.b.POS_INT=Ag(new dg(32,U,U));a.b.POS_NUM=Ag(new dg(16,U,U));a.b.POS_PERCENTAGE=Ag(new dg(8,U,{"%":G}));a.b.NEGATIVE=Ag(new dg(256,U,U));a.b.ZERO=Ag(new dg(512,U,U));a.b.ZERO_PERCENTAGE=Ag(new dg(1024,U,U));a.b.POS_LENGTH=Ag(new dg(8,U,{em:G,ex:G,ch:G,rem:G,vh:G,vw:G,vmin:G,vmax:G,cm:G,mm:G,"in":G,px:G,pt:G,pc:G}));a.b.POS_ANGLE=Ag(new dg(8,U,{deg:G,grad:G,rad:G,turn:G}));a.b.POS_TIME=Ag(new dg(8,U,{s:G,ms:G}));a.b.FREQUENCY=Ag(new dg(8,U,{Hz:G,kHz:G}));
a.b.RESOLUTION=Ag(new dg(8,U,{dpi:G,dpcm:G,dppx:G}));a.b.URI=Ag(new dg(128,U,U));a.b.IDENT=Ag(new dg(4,U,U));a.b.STRING=Ag(new dg(2,U,U));var b={"font-family":H("sans-serif")};a.d.caption=b;a.d.icon=b;a.d.menu=b;a.d["message-box"]=b;a.d["small-caption"]=b;a.d["status-bar"]=b}function Dg(a){return!!a.match(/^[A-Z_0-9]+$/)}
function Eg(a,b,c){var d=w(b);if(0==d.type)return null;var e={"":!0};if(14==d.type){do{A(b);d=w(b);if(1!=d.type)throw Error("Prefix name expected");e[d.text]=!0;A(b);d=w(b)}while(16==d.type);if(15!=d.type)throw Error("']' expected");A(b);d=w(b)}if(1!=d.type)throw Error("Property name expected");if(2==c?"SHORTHANDS"==d.text:"DEFAULTS"==d.text)return A(b),null;d=d.text;A(b);if(2!=c){if(39!=w(b).type)throw Error("'=' expected");Dg(d)||(a.k[d]=e)}else if(18!=w(b).type)throw Error("':' expected");return d}
function Fg(a,b){for(;;){var c=Eg(a,b,1);if(!c)break;for(var d=[],e=[],f="",g,h=!0,k=function(){if(0==d.length)throw Error("No values");var a;if(1==d.length)a=d[0];else{var b=f,c=d;a=new Zf;if("||"==b){for(b=0;b<c.length;b++){var e=new Zf,g=e;if(g.b.length)throw Error("invalid call");var h=new Xf(bg);h.b=2*b+1;g.b.push(h);var h=new Yf(0,!0),k=new Yf(0,!1);g.e.push(g.d.length);g.d.push(k);g.match.push(g.d.length);g.d.push(h);eg(e,c[b],1);ag(e,e.match,!1,b);eg(a,e,0==b?1:4)}c=new Zf;if(c.b.length)throw Error("invalid call");
ag(c,c.match,!0,-1);eg(c,a,3);a=[c.match,c.e,c.f];for(b=0;b<a.length;b++)ag(c,a[b],!1,-1);a=c}else{switch(b){case " ":e=1;break;case "|":case "||":e=4;break;default:throw Error("unexpected op");}for(b=0;b<c.length;b++)eg(a,c[b],0==b?1:e)}}return a},l=function(a){if(h)throw Error("'"+a+"': unexpected");if(f&&f!=a)throw Error("mixed operators: '"+a+"' and '"+f+"'");f=a;h=!0},n=null;!n;)switch(A(b),g=w(b),g.type){case 1:h||l(" ");if(Dg(g.text)){var p=a.b[g.text];if(!p)throw Error("'"+g.text+"' unexpected");
d.push(p.clone())}else p={},p[g.text]=H(g.text),d.push(Ag(new dg(0,p,U)));h=!1;break;case 5:p={};p[""+g.C]=new dd(g.C);d.push(Ag(new dg(0,p,U)));h=!1;break;case 34:l("|");break;case 25:l("||");break;case 14:h||l(" ");e.push({$c:d,Wc:f,oc:"["});f="";d=[];h=!0;break;case 6:h||l(" ");e.push({$c:d,Wc:f,oc:"(",nb:g.text});f="";d=[];h=!0;break;case 15:g=k();p=e.pop();if("["!=p.oc)throw Error("']' unexpected");d=p.$c;d.push(g);f=p.Wc;h=!1;break;case 11:g=k();p=e.pop();if("("!=p.oc)throw Error("')' unexpected");
d=p.$c;d.push(Bg(p.nb,g));f=p.Wc;h=!1;break;case 18:if(h)throw Error("':' unexpected");A(b);d.push(yg(d.pop(),w(b)));break;case 22:if(h)throw Error("'?' unexpected");d.push(zg(d.pop(),0,1));break;case 36:if(h)throw Error("'*' unexpected");d.push(zg(d.pop(),0,Number.POSITIVE_INFINITY));break;case 23:if(h)throw Error("'+' unexpected");d.push(zg(d.pop(),1,Number.POSITIVE_INFINITY));break;case 12:A(b);g=w(b);if(5!=g.type)throw Error("<int> expected");var r=p=g.C;A(b);g=w(b);if(16==g.type){A(b);g=w(b);
if(5!=g.type)throw Error("<int> expected");r=g.C;A(b);g=w(b)}if(13!=g.type)throw Error("'}' expected");d.push(zg(d.pop(),p,r));break;case 17:n=k();if(0<e.length)throw Error("unclosed '"+e.pop().oc+"'");break;default:throw Error("unexpected token");}A(b);Dg(c)?a.b[c]=n:a.e[c]=1!=n.b.length||0!=n.b[0].b?new jg(n):n.b[0].d}}
function Gg(a,b){for(var c={},d=0;d<b.length;d++)for(var e=b[d],f=a.f[e],e=f?f.d:[e],f=0;f<e.length;f++){var g=e[f],h=a.h[g];h?c[g]=h:v("Unknown property in makePropSet: "+g)}return c}
function Hg(a,b,c,d,e){var f="",g=b;b=b.toLowerCase();var h=b.match(/^-([a-z]+)-([-a-z0-9]+)$/);h&&(f=h[1],b=h[2]);if((h=a.k[b])&&h[f])if(f=a.e[b])(a=c===sd||c.Sc()?c:c.M(f))?e.$a(b,a,d):e.yb(g,c);else if(b=a.f[b].clone(),c===sd)for(c=0;c<b.d.length;c++)e.$a(b.d[c],sd,d);else{c.M(b);if(b.b)d=!1;else{for(a=0;a<b.d.length;a++)f=b.d[a],e.$a(f,b.values[f]||b.e.h[f],d);d=!0}d||e.yb(g,c)}else e.gc(g,c)}
var Ig=new $e(function(){var a=M("loadValidatorSet.load"),b=ea("validation.txt",da),c=Ue(b),d=new xg;Cg(d);c.then(function(c){try{if(c.responseText){var f=new Nb(c.responseText);for(Fg(d,f);;){var g=Eg(d,f,2);if(!g)break;for(c=[];;){A(f);var h=w(f);if(17==h.type){A(f);break}switch(h.type){case 1:c.push(H(h.text));break;case 4:c.push(new cd(h.C));break;case 5:c.push(new dd(h.C));break;case 3:c.push(new K(h.C,h.text));break;default:throw Error("unexpected token");}}d.h[g]=1<c.length?new Uc(c):c[0]}for(;;){var k=
Eg(d,f,3);if(!k)break;var l=z(f,1),n;1==l.type&&wg[l.text]?(n=new wg[l.text],A(f)):n=new rg;n.e=d;g=!1;h=[];c=!1;for(var p=[],r=[];!g;)switch(A(f),l=w(f),l.type){case 1:if(d.e[l.text])h.push(n.pd(l.text)),r.push(l.text);else if(d.f[l.text]instanceof sg){var q=d.f[l.text];h.push(new ng(q.e,q.d));r.push.apply(r,q.d)}else throw Error("'"+l.text+"' is neither a simple property nor an inset shorthand");break;case 19:if(0<h.length||c)throw Error("unexpected slash");c=!0;break;case 14:p.push({Xc:c,Ga:h});
h=[];c=!1;break;case 15:var y=new og(h,c),x=p.pop(),h=x.Ga;c=x.Xc;h.push(y);break;case 17:g=!0;A(f);break;default:throw Error("unexpected token");}n.Pc(h,r);d.f[k]=n}d.g=Gg(d,["background"]);d.j=Gg(d,"margin border padding columns column-gap column-rule column-fill".split(" "))}else v("Error: missing "+b)}catch(I){v("Error: "+I)}Q(a,d)});return P(a)},"validatorFetcher");for(var Jg={azimuth:!0,"border-collapse":!0,"border-spacing":!0,"caption-side":!0,color:!0,cursor:!0,direction:!0,elevation:!0,"empty-cells":!0,"font-kerning":!0,"font-size":!0,"font-family":!0,"font-style":!0,"font-variant":!0,"font-weight":!0,"letter-spacing":!0,"line-break":!0,"line-height":!0,"list-style-image":!0,"list-style-position":!0,"list-style-type":!0,orphans:!0,"overflow-wrap":!0,"pitch-range":!0,quotes:!0,richness:!0,"ruby-align":!0,"ruby-position":!0,"speak-header":!0,"speak-numeral":!0,
"speak-punctuation":!0,"speech-rate":!0,stress:!0,"tab-size":!0,"text-align":!0,"text-align-last":!0,"text-decoration-skip":!0,"text-emphasis-color":!0,"text-emphasis-position":!0,"text-emphasis-style":!0,"text-combine-upright":!0,"text-indent":!0,"text-justify":!0,"text-size-adjust":!0,"text-transform":!0,"text-underline-position":!0,visibility:!0,"voice-family":!0,volume:!0,"white-space":!0,widows:!0,"word-break":!0,"word-spacing":!0,"word-wrap":!0,"writing-mode":!0},Kg={"http://www.idpf.org/2007/ops":!0,
"http://www.w3.org/1999/xhtml":!0,"http://www.w3.org/2000/svg":!0},Lg="margin-% padding-% border-%-width border-%-style border-%-color %".split(" "),Mg=["left","right","top","bottom"],Ng={width:!0,height:!0},Og=0;Og<Lg.length;Og++)for(var Pg=0;Pg<Mg.length;Pg++){var Qg=Lg[Og].replace("%",Mg[Pg]);Ng[Qg]=!0}function Rg(a){for(var b={},c=0;c<Lg.length;c++)for(var d in a){var e=Lg[c].replace("%",d),f=Lg[c].replace("%",a[d]);b[e]=f;b[f]=e}return b}
var Sg=Rg({before:"right",after:"left",start:"top",end:"bottom"}),Tg=Rg({before:"top",after:"bottom",start:"left",end:"right"});function V(a,b){this.value=a;this.Ba=b}m=V.prototype;m.ed=function(){return this};m.tc=function(a){a=this.value.M(a);return a===this.value?this:new V(a,this.Ba)};m.fd=function(a){return 0==a?this:new V(this.value,this.Ba+a)};m.evaluate=function(a,b){return Kf(a,this.value,b)};m.cd=function(){return!0};function Ug(a,b,c){V.call(this,a,b);this.G=c}t(Ug,V);
Ug.prototype.ed=function(){return new V(this.value,this.Ba)};Ug.prototype.tc=function(a){a=this.value.M(a);return a===this.value?this:new Ug(a,this.Ba,this.G)};Ug.prototype.fd=function(a){return 0==a?this:new Ug(this.value,this.Ba+a,this.G)};Ug.prototype.cd=function(a){return!!this.G.evaluate(a)};function Vg(a,b,c){return(null==b||c.Ba>b.Ba)&&c.cd(a)?c.ed():b}var Wg={"region-id":!0};function Xg(a){return"_"!=a.charAt(0)&&!Wg[a]}function Yg(a,b,c){c?a[b]=c:delete a[b]}
function Zg(a,b){var c=a[b];c||(c={},a[b]=c);return c}function $g(a,b){var c=a[b];c||(c=[],a[b]=c);return c}function ah(a,b,c,d,e,f){if(e){var g=Zg(b,"_pseudos");b=g[e];b||(b={},g[e]=b)}f&&(e=Zg(b,"_regions"),b=e[f],b||(b={},e[f]=b));for(var h in c)"_"!=h.charAt(0)&&(Wg[h]?(f=c[h],e=$g(b,h),Array.prototype.push.apply(e,f)):Yg(b,h,Vg(a,b[h],c[h].fd(d))))}function bh(a,b){this.e=a;this.d=b;this.b=""}t(bh,Tc);
function ch(a){a=a.e["font-size"].value;var b;a:switch(a.b.toLowerCase()){case "px":case "in":case "pt":case "pc":case "cm":case "mm":case "q":b=!0;break a;default:b=!1}if(!b)throw Error("Unexpected state");return a.C*dc[a.b]}bh.prototype.ub=function(a){if("em"==a.b||"ex"==a.b)return new K(gc(this.d,a.b)/gc(this.d,"em")*a.C*ch(this),"px");if("%"==a.b){if("font-size"===this.b)return new K(a.C/100*ch(this),"px");var b=this.b.match(/height|^(top|bottom)$/)?"vh":"vw";return new K(a.C,b)}return a};
bh.prototype.rb=function(a){return"font-size"==this.b?Kf(this.d,a,this.b).M(this):a};function dh(){}dh.prototype.apply=function(){};dh.prototype.g=function(a){return new eh([this,a])};dh.prototype.clone=function(){return this};function fh(a){this.b=a}t(fh,dh);fh.prototype.apply=function(a){a.b[a.b.length-1].push(this.b.b())};function eh(a){this.b=a}t(eh,dh);eh.prototype.apply=function(a){for(var b=0;b<this.b.length;b++)this.b[b].apply(a)};eh.prototype.g=function(a){this.b.push(a);return this};
eh.prototype.clone=function(){return new eh([].concat(this.b))};function gh(a,b,c,d){this.style=a;this.b=b;this.d=c;this.e=d}t(gh,dh);gh.prototype.apply=function(a){ah(a.d,a.w,this.style,this.b,this.d,this.e)};function W(){this.b=null}t(W,dh);W.prototype.apply=function(a){this.b.apply(a)};W.prototype.d=function(){return 0};W.prototype.e=function(){return!1};function hh(a){this.b=null;this.f=a}t(hh,W);hh.prototype.apply=function(a){0<=a.u.indexOf(this.f)&&this.b.apply(a)};hh.prototype.d=function(){return 10};
hh.prototype.e=function(a){this.b&&ih(a.ta,this.f,this.b);return!0};function jh(a){this.b=null;this.id=a}t(jh,W);jh.prototype.apply=function(a){a.P!=this.id&&a.ba!=this.id||this.b.apply(a)};jh.prototype.d=function(){return 11};jh.prototype.e=function(a){this.b&&ih(a.e,this.id,this.b);return!0};function kh(a){this.b=null;this.localName=a}t(kh,W);kh.prototype.apply=function(a){a.f==this.localName&&this.b.apply(a)};kh.prototype.d=function(){return 8};
kh.prototype.e=function(a){this.b&&ih(a.Ib,this.localName,this.b);return!0};function lh(a,b){this.b=null;this.f=a;this.localName=b}t(lh,W);lh.prototype.apply=function(a){a.f==this.localName&&a.k==this.f&&this.b.apply(a)};lh.prototype.d=function(){return 8};lh.prototype.e=function(a){if(this.b){var b=a.b[this.f];b||(b="ns"+a.g++ +":",a.b[this.f]=b);ih(a.f,b+this.localName,this.b)}return!0};function mh(a){this.b=null;this.f=a}t(mh,W);
mh.prototype.apply=function(a){var b=a.e;if(b&&"a"==a.f){var c=b.getAttribute("href");c&&c.match(/^#/)&&(b=b.ownerDocument.getElementById(c.substring(1)))&&(b=b.getAttributeNS("http://www.idpf.org/2007/ops","type"))&&b.match(this.f)&&this.b.apply(a)}};function nh(a){this.b=null;this.f=a}t(nh,W);nh.prototype.apply=function(a){a.k==this.f&&this.b.apply(a)};function oh(a,b){this.b=null;this.f=a;this.name=b}t(oh,W);oh.prototype.apply=function(a){a.e&&a.e.hasAttributeNS(this.f,this.name)&&this.b.apply(a)};
function ph(a,b,c){this.b=null;this.f=a;this.name=b;this.value=c}t(ph,W);ph.prototype.apply=function(a){a.e&&a.e.getAttributeNS(this.f,this.name)==this.value&&this.b.apply(a)};ph.prototype.d=function(){return"type"==this.name&&"http://www.idpf.org/2007/ops"==this.f?9:0};ph.prototype.e=function(a){return"type"==this.name&&"http://www.idpf.org/2007/ops"==this.f?(this.b&&ih(a.d,this.value,this.b),!0):!1};function sh(a,b){this.b=null;this.f=a;this.name=b}t(sh,W);
sh.prototype.apply=function(a){if(a.e){var b=a.e.getAttributeNS(this.f,this.name);b&&Kg[b]&&this.b.apply(a)}};sh.prototype.d=function(){return 0};sh.prototype.e=function(){return!1};function th(a,b,c){this.b=null;this.f=a;this.name=b;this.h=c}t(th,W);th.prototype.apply=function(a){if(a.e){var b=a.e.getAttributeNS(this.f,this.name);b&&b.match(this.h)&&this.b.apply(a)}};function uh(a){this.b=null;this.f=a}t(uh,W);uh.prototype.apply=function(a){a.lang.match(this.f)&&this.b.apply(a)};
function vh(){this.b=null}t(vh,W);vh.prototype.apply=function(a){a.la&&this.b.apply(a)};vh.prototype.d=function(){return 6};function wh(){this.b=null}t(wh,W);wh.prototype.apply=function(a){a.va&&this.b.apply(a)};wh.prototype.d=function(){return 12};function xh(a){this.b=null;this.G=a}t(xh,W);xh.prototype.apply=function(a){a.h[this.G]&&this.b.apply(a)};xh.prototype.d=function(){return 5};function yh(a){this.G=a}yh.prototype.b=function(){return this};
yh.prototype.push=function(a,b){0==b&&zh(a,this.G);return!1};yh.prototype.pop=function(a,b){return 0==b?(a.h[this.G]--,!0):!1};function Ah(a){this.G=a}Ah.prototype.b=function(){return this};Ah.prototype.push=function(a,b){0==b?zh(a,this.G):1==b&&a.h[this.G]--;return!1};Ah.prototype.pop=function(a,b){if(0==b)return a.h[this.G]--,!0;1==b&&zh(a,this.G);return!1};function Bh(a){this.G=a;this.d=!1}Bh.prototype.b=function(){return new Bh(this.G)};
Bh.prototype.push=function(a){return this.d?(a.h[this.G]--,!0):!1};Bh.prototype.pop=function(a,b){if(this.d)return a.h[this.G]--,!0;0==b&&(this.d=!0,zh(a,this.G));return!1};function Ch(a){this.G=a;this.d=!1}Ch.prototype.b=function(){return new Ch(this.G)};Ch.prototype.push=function(a,b){this.d&&(-1==b?zh(a,this.G):0==b&&a.h[this.G]--);return!1};Ch.prototype.pop=function(a,b){if(this.d){if(-1==b)return a.h[this.G]--,!0;0==b&&zh(a,this.G)}else 0==b&&(this.d=!0,zh(a,this.G));return!1};
function Dh(a,b){this.e=a;this.d=b}Dh.prototype.b=function(){return this};Dh.prototype.push=function(){return!1};Dh.prototype.pop=function(a,b){return 0==b?(Eh(a,this.e,this.d),!0):!1};function Fh(a){this.lang=a}Fh.prototype.b=function(){return this};Fh.prototype.push=function(){return!1};Fh.prototype.pop=function(a,b){return 0==b?(a.lang=this.lang,!0):!1};function Gh(a){this.d=a}Gh.prototype.b=function(){return this};Gh.prototype.push=function(){return!1};
Gh.prototype.pop=function(a,b){return 0==b?(a.B=this.d,!0):!1};function Hh(a,b){this.b=a;this.d=b}t(Hh,Tc);Hh.prototype.eb=function(a){var b=this.b,c=b.B,d=Math.floor(c.length/2)-1;switch(a.name){case "open-quote":a=c[2*Math.min(d,b.l)];b.l++;break;case "close-quote":return 0<b.l&&b.l--,c[2*Math.min(d,b.l)+1];case "no-open-quote":return b.l++,new ad("");case "no-close-quote":return 0<b.l&&b.l--,new ad("")}return a};
var Ih={roman:[4999,1E3,"M",900,"CM",500,"D",400,"CD",100,"C",90,"XC",50,"L",40,"XL",10,"X",9,"IX",5,"V",4,"IV",1,"I"],armenian:[9999,9E3,"\u0584",8E3,"\u0583",7E3,"\u0582",6E3,"\u0581",5E3,"\u0580",4E3,"\u057f",3E3,"\u057e",2E3,"\u057d",1E3,"\u057c",900,"\u057b",800,"\u057a",700,"\u0579",600,"\u0578",500,"\u0577",400,"\u0576",300,"\u0575",200,"\u0574",100,"\u0573",90,"\u0572",80,"\u0571",70,"\u0570",60,"\u056f",50,"\u056e",40,"\u056d",30,"\u056c",20,"\u056b",10,"\u056a",9,"\u0569",8,"\u0568",7,"\u0567",
6,"\u0566",5,"\u0565",4,"\u0564",3,"\u0563",2,"\u0562",1,"\u0561"],georgian:[19999,1E4,"\u10f5",9E3,"\u10f0",8E3,"\u10ef",7E3,"\u10f4",6E3,"\u10ee",5E3,"\u10ed",4E3,"\u10ec",3E3,"\u10eb",2E3,"\u10ea",1E3,"\u10e9",900,"\u10e8",800,"\u10e7",700,"\u10e6",600,"\u10e5",500,"\u10e4",400,"\u10f3",300,"\u10e2",200,"\u10e1",100,"\u10e0",90,"\u10df",80,"\u10de",70,"\u10dd",60,"\u10f2",50,"\u10dc",40,"\u10db",30,"\u10da",20,"\u10d9",10,"\u10d8",9,"\u10d7",8,"\u10f1",7,"\u10d6",6,"\u10d5",5,"\u10d4",4,"\u10d3",
3,"\u10d2",2,"\u10d1",1,"\u10d0"],hebrew:[999,400,"\u05ea",300,"\u05e9",200,"\u05e8",100,"\u05e7",90,"\u05e6",80,"\u05e4",70,"\u05e2",60,"\u05e1",50,"\u05e0",40,"\u05de",30,"\u05dc",20,"\u05db",19,"\u05d9\u05d8",18,"\u05d9\u05d7",17,"\u05d9\u05d6",16,"\u05d8\u05d6",15,"\u05d8\u05d5",10,"\u05d9",9,"\u05d8",8,"\u05d7",7,"\u05d6",6,"\u05d5",5,"\u05d4",4,"\u05d3",3,"\u05d2",2,"\u05d1",1,"\u05d0"]},Jh={latin:"a-z",alpha:"a-z",greek:"\u03b1-\u03c1\u03c3-\u03c9",russian:"\u0430-\u0438\u043a-\u0449\u044d-\u044f"},
Kh={square:"\u25a0",disc:"\u2022",circle:"\u25e6",none:""},Lh={Qd:!1,wb:"\u96f6\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d",Vb:"\u5341\u767e\u5343",yd:"\u8ca0"};
function Mh(a){if(9999<a||-9999>a)return""+a;if(0==a)return Lh.wb.charAt(0);var b=new Aa;0>a&&(b.append(Lh.yd),a=-a);if(10>a)b.append(Lh.wb.charAt(a));else if(Lh.Rd&&19>=a)b.append(Lh.Vb.charAt(0)),0!=a&&b.append(Lh.Vb.charAt(a-10));else{var c=Math.floor(a/1E3);c&&(b.append(Lh.wb.charAt(c)),b.append(Lh.Vb.charAt(2)));if(c=Math.floor(a/100)%10)b.append(Lh.wb.charAt(c)),b.append(Lh.Vb.charAt(1));if(c=Math.floor(a/10)%10)b.append(Lh.wb.charAt(c)),b.append(Lh.Vb.charAt(0));(a%=10)&&b.append(Lh.wb.charAt(a))}return b.toString()}
function Nh(a,b){var c=!1,d=!1,e;null!=(e=b.match(/^upper-(.*)/))?(c=!0,b=e[1]):null!=(e=b.match(/^lower-(.*)/))&&(d=!0,b=e[1]);e="";if(Ih[b])a:{e=Ih[b];var f=a;if(f>e[0]||0>=f||f!=Math.round(f))e="";else{for(var g="",h=1;h<e.length;h+=2){var k=e[h],l=Math.floor(f/k);if(20<l){e="";break a}for(f-=l*k;0<l;)g+=e[h+1],l--}e=g}}else if(Jh[b])if(e=a,0>=e||e!=Math.round(e))e="";else{g=Jh[b];f=[];for(h=0;h<g.length;)if("-"==g.substr(h+1,1))for(l=g.charCodeAt(h),k=g.charCodeAt(h+2),h+=3;l<=k;l++)f.push(String.fromCharCode(l));
else f.push(g.substr(h++,1));g="";do e--,h=e%f.length,g=f[h]+g,e=(e-h)/f.length;while(0<e);e=g}else null!=Kh[b]?e=Kh[b]:"decimal-leading-zero"==b?(e=a+"",1==e.length&&(e="0"+e)):"cjk-ideographic"==b||"trad-chinese-informal"==b?e=Mh(a):e=a+"";return c?e.toUpperCase():d?e.toLowerCase():e}
function Oh(a,b){var c=b[0].toString(),d=1<b.length?b[1].stringValue():"decimal",e=a.b.g[c];if(e&&e.length)return new ad(Nh(e&&e.length&&e[e.length-1]||0,d));c=new L(Ph(a.b.Oa,c,function(a){return Nh(a||0,d)}));return new Uc([c])}
function Qh(a,b){var c=b[0].toString(),d=b[1].stringValue(),e=2<b.length?b[2].stringValue():"decimal",f=a.b.g[c],g=new Aa;if(f&&f.length)for(var h=0;h<f.length;h++)0<h&&g.append(d),g.append(Nh(f[h],e));c=new L(Rh(a.b.Oa,c,function(a){var b=[];if(a.length)for(var c=0;c<a.length;c++)b.push(Nh(a[c],e));a=g.toString();a.length&&b.push(a);return b.length?b.join(d):Nh(0,e)}));return new Uc([c])}
Hh.prototype.cb=function(a){switch(a.name){case "attr":if(1==a.values.length)return new ad(this.d&&this.d.getAttribute(a.values[0].stringValue())||"");break;case "counter":if(2>=a.values.length)return Oh(this,a.values);break;case "counters":if(3>=a.values.length)return Qh(this,a.values)}v("E_CSS_CONTENT_PROP: "+a.toString());return new ad("")};var Sh=1/1048576;function Th(a,b){for(var c in a)b[c]=a[c].clone()}
function Uh(){this.g=0;this.b={};this.Ib={};this.f={};this.d={};this.ta={};this.e={};this.Ab={};this.K=0}Uh.prototype.clone=function(){var a=new Uh;a.g=this.g;for(var b in this.b)a.b[b]=this.b[b];Th(this.Ib,a.Ib);Th(this.f,a.f);Th(this.d,a.d);Th(this.ta,a.ta);Th(this.e,a.e);Th(this.Ab,a.Ab);a.K=this.K;return a};function ih(a,b,c){var d=a[b];d&&(c=d.g(c));a[b]=c}
function Vh(a,b,c){this.j=a;this.d=b;this.Oa=c;this.b=[[],[]];this.h={};this.u=this.w=this.e=null;this.Y=this.ba=this.P=this.k=this.f="";this.H=this.F=null;this.va=this.la=!0;this.g={};this.A=[{}];this.B=[new ad("\u201c"),new ad("\u201d"),new ad("\u2018"),new ad("\u2019")];this.l=0;this.lang="";this.ra=[]}function zh(a,b){a.h[b]=(a.h[b]||0)+1}function Wh(a,b,c){(b=b[c])&&b.apply(a)}var Xh=[];function Yh(a,b,c,d){a.e=null;a.w=d;a.k="";a.f="";a.P="";a.ba="";a.u=b;a.Y="";a.F=Xh;a.H=c;Zh(a)}
function $h(a,b,c){a.g[b]?a.g[b].push(c):a.g[b]=[c];c=a.A[a.A.length-1];c||(c={},a.A[a.A.length-1]=c);c[b]=!0}
function ai(a,b){var c=td,d=b.display;d&&(c=d.evaluate(a.d));var e=null,d=null,f=b["counter-reset"];f&&(f=f.evaluate(a.d))&&(e=Rf(f,!0));(f=b["counter-increment"])&&(f=f.evaluate(a.d))&&(d=Rf(f,!1));"ol"!=a.f&&"ul"!=a.f||"http://www.w3.org/1999/xhtml"!=a.k||(e||(e={}),e["ua-list-item"]=0);c===wd&&(d||(d={}),d["ua-list-item"]=1);if(e)for(var g in e)$h(a,g,e[g]);if(d)for(var h in d)a.g[h]||$h(a,h,0),g=a.g[h],g[g.length-1]+=d[h];c===wd&&(c=a.g["ua-list-item"],b["ua-list-item-count"]=new V(new cd(c[c.length-
1]),0));a.A.push(null)}function bi(a){var b=a.A.pop();if(b)for(var c in b)(b=a.g[c])&&(1==b.length?delete a.g[c]:b.pop())}function Eh(a,b,c){ai(a,b);b.content&&(b.content=b.content.tc(new Hh(a,c)));bi(a)}var ci="before transclusion-before footnote-call footnote-marker inner first-letter first-line  transclusion-after after".split(" ");
function di(a,b,c){a.ra.push(b);a.H=null;a.e=b;a.w=c;a.k=b.namespaceURI;a.f=b.localName;var d=a.j.b[a.k];a.Y=d?d+a.f:"";a.P=b.getAttribute("id");a.ba=b.getAttributeNS("http://www.w3.org/XML/1998/namespace","id");(d=b.getAttribute("class"))?a.u=d.split(/\s+/):a.u=Xh;(d=b.getAttributeNS("http://www.idpf.org/2007/ops","type"))?a.F=d.split(/\s+/):a.F=Xh;"style"==a.f&&"http://www.gribuser.ru/xml/fictionbook/2.0"==a.k&&(a.u=[b.getAttribute("name")||""]);(d=b.getAttributeNS("http://www.w3.org/XML/1998/namespace",
"lang"))||"http://www.w3.org/1999/xhtml"!=a.k||(d=b.getAttribute("lang"));d&&(a.b[a.b.length-1].push(new Fh(a.lang)),a.lang=d.toLowerCase());Zh(a);d=c.quotes;c=null;d&&(d=d.evaluate(a.d))&&(c=new Gh(a.B),d===xd?a.B=[new ad(""),new ad("")]:d instanceof Uc&&(a.B=d.values));ai(a,a.w);if(d=a.w._pseudos)for(var e=!0,f=0;f<ci.length;f++){var g=ci[f];g||(e=!1);(g=d[g])&&(e?Eh(a,g,b):a.b[a.b.length-2].push(new Dh(g,b)))}c&&a.b[a.b.length-2].push(c)}
function Zh(a){var b;for(b=0;b<a.u.length;b++)Wh(a,a.j.ta,a.u[b]);for(b=0;b<a.F.length;b++)Wh(a,a.j.d,a.F[b]);Wh(a,a.j.e,a.P);Wh(a,a.j.Ib,a.f);""!=a.f&&Wh(a,a.j.Ib,"*");Wh(a,a.j.f,a.Y);null!==a.H&&(Wh(a,a.j.Ab,a.H),Wh(a,a.j.Ab,"*"));a.e=null;a.b.push([]);for(var c=1;-1<=c;--c){var d=a.b[a.b.length-c-2];for(b=0;b<d.length;)d[b].push(a,c)?d.splice(b,1):b++}a.la=!0;a.va=!1}
Vh.prototype.pop=function(){for(var a=1;-1<=a;--a)for(var b=this.b[this.b.length-a-2],c=0;c<b.length;)b[c].pop(this,a)?b.splice(c,1):c++;this.b.pop();this.la=!1};var ei=null;function fi(a,b,c,d,e,f,g){hf.call(this,a,b,g);this.b=null;this.d=0;this.k=null;this.w=0;this.g=null;this.l=!1;this.G=c;this.h=d?d.h:ei?ei.clone():new Uh;this.B=e;this.u=f;this.j=0}t(fi,jf);m=fi.prototype;m.gd=function(a){ih(this.h.Ib,"*",a)};
function gi(a,b){var c=a.b;if(0<c.length){c.sort(function(a,b){return b.d()-a.d()});for(var d=null,e=c.length-1;0<=e;e--)d=c[e],d.b=b,b=d;if(d.e(a.h))return}a.gd(b)}m.Ua=function(a,b){if(b||a)this.d+=1,b&&a?this.b.push(new lh(a,b)):b?this.b.push(new kh(b)):this.b.push(new nh(a))};m.rc=function(a){this.g?(v("::"+this.g+" followed by ."+a),this.b.push(new xh(""))):(this.d+=256,this.b.push(new hh(a)))};
m.Bb=function(a,b){if(this.g)v("::"+this.g+" followed by :"+a),this.b.push(new xh(""));else{switch(a.toLowerCase()){case "first-child":this.b.push(new vh);break;case "root":this.b.push(new wh);break;case "link":this.b.push(new kh("a"));this.b.push(new oh("","href"));break;case "-adapt-href-epub-type":case "href-epub-type":if(b&&1==b.length&&"string"==typeof b[0]){var c=new RegExp("(^|s)"+ga(b[0])+"($|s)");this.b.push(new mh(c))}else this.b.push(new xh(""));break;case "-adapt-footnote-content":case "footnote-content":this.l=
!0;break;case "visited":case "active":case "hover":case "focus":this.b.push(new xh(""));break;case "lang":b&&1==b.length&&"string"==typeof b[0]?this.b.push(new uh(new RegExp("^"+ga(b[0].toLowerCase())+"($|-)"))):this.b.push(new xh(""));break;case "before":case "after":case "first-line":case "first-letter":this.Cb(a,b);return;default:this.b.push(new xh(""))}this.d+=256}};
m.Cb=function(a,b){switch(a){case "before":case "after":case "first-line":case "first-letter":case "footnote-call":case "footnote-marker":case "inner":this.g?(v("Double pseudoelement ::"+this.g+"::"+a),this.b.push(new xh(""))):this.g=a;break;case "first-n-lines":if(b&&1==b.length&&"number"==typeof b[0]){var c=Math.round(b[0]);if(0<c&&c==b[0]){this.g?(v("Double pseudoelement ::"+this.g+"::"+a),this.b.push(new xh(""))):this.g="first-"+c+"-lines";break}}default:v("Unrecognized pseudoelement: ::"+a),
this.b.push(new xh(""))}this.d+=1};m.xc=function(a){this.d+=65536;this.b.push(new jh(a))};m.Qb=function(a,b,c,d){this.d+=256;d=d||"";switch(c){case 0:this.b.push(new oh(a,b));break;case 39:this.b.push(new ph(a,b,d));break;case 45:this.b.push(new th(a,b,new RegExp("(^|s)"+ga(d)+"($|s)")));break;case 44:this.b.push(new th(a,b,new RegExp("^"+ga(d)+"($|-)")));break;case 50:"supported"==d?this.b.push(new sh(a,b)):v("Unsupported :: attr selector op: "+d);break;default:v("Unsupported attr selector: "+c)}};
m.Wa=function(){var a="d"+this.w++;gi(this,new fh(new yh(a)));this.b=[new xh(a)]};m.qc=function(){var a="c"+this.w++;gi(this,new fh(new Ah(a)));this.b=[new xh(a)]};m.nc=function(){var a="a"+this.w++;gi(this,new fh(new Bh(a)));this.b=[new xh(a)]};m.uc=function(){var a="f"+this.w++;gi(this,new fh(new Ch(a)));this.b=[new xh(a)]};m.Cc=function(){hi(this);this.g=null;this.l=!1;this.d=0;this.b=[]};
m.ab=function(){var a;0!=this.j?(lf(this,"E_CSS_UNEXPECTED_SELECTOR"),a=!0):a=!1;a||(this.j=1,this.k={},this.g=null,this.d=0,this.l=!1,this.b=[])};m.N=function(a,b){jf.prototype.N.call(this,a,b);1==this.j&&(this.j=0)};m.qb=function(a){jf.prototype.qb.call(this,a);this.j=0};m.ha=function(){hi(this);jf.prototype.ha.call(this);1==this.j&&(this.j=0)};m.Pa=function(){jf.prototype.Pa.call(this)};function hi(a){if(a.b){var b=a.d,c;c=a.h;c=c.K+=Sh;gi(a,a.ld(b+c));a.b=null;a.g=null;a.l=!1;a.d=0}}
m.ld=function(a){var b=this.B;this.l&&(b=b?"xxx-bogus-xxx":"footnote");return new gh(this.k,a,this.g,b)};m.Ea=function(a,b,c){Hg(this.u,a,b,c,this)};m.yb=function(a,b){kf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};m.gc=function(a,b){kf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};m.$a=function(a,b,c){"display"!=a||b!==Ad&&b!==zd||(this.$a("flow-options",new Uc([od,Ed]),c),this.$a("flow-into",b,c),b=md);c=c?df(this):ef(this);Yg(this.k,a,this.G?new Ug(b,c,this.G):new V(b,c))};
function ii(a,b){hf.call(this,a,b,!1)}t(ii,jf);ii.prototype.Ea=function(a,b){if(this.e.values[a])this.N("E_CSS_NAME_REDEFINED "+a,this.xb());else{var c=a.match(/height|^(top|bottom)$/)?"vh":"vw",c=new Hc(this.e,100,c),c=b.da(this.e,c);this.e.values[a]=c}};function ji(a,b,c,d,e){hf.call(this,a,b,!1);this.b=d;this.G=c;this.d=e}t(ji,jf);ji.prototype.Ea=function(a,b,c){c?v("E_IMPORTANT_NOT_ALLOWED"):Hg(this.d,a,b,c,this)};ji.prototype.yb=function(a,b){v("E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};
ji.prototype.gc=function(a,b){v("E_INVALID_PROPERTY "+a+": "+b.toString())};ji.prototype.$a=function(a,b,c){c=c?df(this):ef(this);c+=this.K;this.K+=Sh;Yg(this.b,a,this.G?new Ug(b,c,this.G):new V(b,c))};function ki(a,b){Ff.call(this,a);this.b={};this.d=b;this.K=0}t(ki,Ff);ki.prototype.Ea=function(a,b,c){Hg(this.d,a,b,c,this)};ki.prototype.yb=function(a,b){v("E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};ki.prototype.gc=function(a,b){v("E_INVALID_PROPERTY "+a+": "+b.toString())};
ki.prototype.$a=function(a,b,c){c=(c?67108864:50331648)+this.K;this.K+=Sh;Yg(this.b,a,new V(b,c))};var li=new $e(function(){var a=M("uaStylesheetBase");Ye(Ig).then(function(b){var c=ea("user-agent-base.css",da);b=new fi(null,null,null,null,null,b,!0);b.qb("UA");ei=b.h;Hf(c,b,null).ka(a)});return P(a)},"uaStylesheetBaseFetcher");function mi(a,b,c){return(a=a["writing-mode"])&&(b=a.evaluate(b,"writing-mode"))&&b!==sd?b===Kd:c}
function ni(a,b,c,d){var e={},f;for(f in a)Xg(f)&&(e[f]=a[f]);a=a._regions;if((c||d)&&a)for(d&&(d=["footnote"],c=c?c.concat(d):d),d=0;d<c.length;d++){f=a[c[d]];for(var g in f)Xg(g)&&(e[g]=Vg(b,e[g],f[g]))}return e}function oi(a,b,c,d){c=c?Sg:Tg;for(var e in a)if(a.hasOwnProperty(e)){var f=a[e];if(f){var g=c[e];if(g){var h=a[g];if(h&&h.Ba>f.Ba)continue;g=Ng[g]?g:e}else g=e;b[g]=d(e,f)}}};var pi={"font-style":yd,"font-variant":yd,"font-weight":yd},qi="OTTO"+(new Date).valueOf(),ri=1;function si(a){a=this.ob=a;var b=new Aa,c;for(c in pi)b.append(" "),b.append(a[c].toString());this.d=b.toString();if(c=this.ob.src){a=new Sf;try{c.M(a)}catch(d){v("toFontSrcURL: "+d)}c=a.url}else c=null;this.src=c;this.e=[];this.f=[];this.b=(c=this.ob["font-family"])?c.stringValue():null}
function ti(a,b,c){var d=new Aa;d.append("@font-face {\n  font-family: ");d.append(a.b);d.append(";\n  ");for(var e in pi)d.append(e),d.append(": "),a.ob[e].sa(d,!0),d.append(";\n  ");c?(d.append('src: url("'),b=(window.URL||window.webkitURL).createObjectURL(c),d.append(b),a.e.push(b),a.f.push(c)):(d.append('src: url("'),d.append(Da(b)));d.append('");\n}\n');return d.toString()}function ui(a){this.d=a;this.b={}}function vi(a,b){this.d=a;this.b=b;this.e={};this.f=0}
function wi(a,b,c){b=b.b;var d=c.b[b];if(d)return d;d="Fnt_"+ ++a.f;return c.b[b]=d}
function xi(a,b,c,d){var e=M("initFont"),f=b.src,g={},h;for(h in pi)g[h]=b.ob[h];d=wi(a,b,d);g["font-family"]=H(d);var k=new si(g),l=a.b.ownerDocument.createElement("span");l.textContent="M";var n=(new Date).valueOf()+1E3;b=a.d.ownerDocument.createElement("style");h=qi+ri++;b.textContent=ti(k,"",Ve([h]));a.d.appendChild(b);a.b.appendChild(l);l.style.visibility="hidden";l.style.fontFamily=d;for(var p in pi)u(l,p,g[p].toString());var g=l.getBoundingClientRect(),r=g.right-g.left,q=g.bottom-g.top;b.textContent=
ti(k,f,c);v("Starting to load font: "+f);var y=!1;Qe(function(){var a=l.getBoundingClientRect(),b=a.bottom-a.top;if(r!=a.right-a.left||q!=b)return y=!0,O(!1);(new Date).valueOf()>n?a=O(!1):(a=M("Frame.sleep"),Ke(a).Sa(!0,10),a=P(a));return a}).then(function(){y?v("Loaded font: "+f):v("Failed to load font: "+f);a.b.removeChild(l);Q(e,k)});return P(e)}
function yi(a,b,c){var d=b.src,e=a.e[d];e?Uf(e,function(a){if(a.d==b.d){var e=b.b,h=c.b[e];a=a.b;if(h){if(h!=a)throw Error("E_FONT_FAMILY_INCONSISTENT "+b.b);}else c.b[e]=a;v("Found already-loaded font: "+d)}else v("E_FONT_FACE_INCOMPATIBLE "+b.src)}):(e=new $e(function(){var e=M("loadFont"),g=c.d?c.d(d):null;g?Ue(d,!0).then(function(d){d.Xb?g(d.Xb).then(function(d){xi(a,b,d,c).ka(e)}):Q(e,null)}):xi(a,b,null,c).ka(e);return P(e)},"loadFont "+d),a.e[d]=e,e.start());return e};function zi(a,b,c){this.j=a;this.url=b;this.b=c;this.lang=null;this.f=-1;this.root=c.documentElement;a=null;if("http://www.w3.org/1999/xhtml"==this.root.namespaceURI){for(b=this.root.firstChild;b;b=b.nextSibling)if(1==b.nodeType&&(c=b,"http://www.w3.org/1999/xhtml"==c.namespaceURI))switch(c.localName){case "head":a=c}this.lang=this.root.getAttribute("lang")}else if("http://www.gribuser.ru/xml/fictionbook/2.0"==this.root.namespaceURI){a=this.root;for(b=this.root.firstChild;b;b=b.nextSibling);b=Ai(Ai(Ai(Ai(new Bi([this.b]),
"FictionBook"),"description"),"title-info"),"lang").textContent();0<b.length&&(this.lang=b[0])}else if("http://example.com/sse"==this.root.namespaceURI)for(c=this.root.firstElementChild;c;c=c.nextElementSibling)"meta"===c.localName&&(a=c);this.h=a;this.e=this.root;this.g=1;this.e.setAttribute("data-adapt-eloff","0")}
function Ci(a,b){var c=b.getAttribute("data-adapt-eloff");if(c)return parseInt(c,10);for(var c=a.g,d=a.e;d!=b;){var e=d.firstChild;if(!e)for(;!(e=d.nextSibling);)if(d=d.parentNode,null==d)throw Error("Internal error");d=e;1==e.nodeType?(e.setAttribute("data-adapt-eloff",c.toString()),++c):c+=e.textContent.length}a.g=c;a.e=b;return c-1}
function Di(a,b,c,d){var e=0,f=null;if(1==b.nodeType){if(!d)return Ci(a,b)}else{e=c;f=b.previousSibling;if(!f)return b=b.parentNode,e+=1,Ci(a,b)+e;b=f}for(;;){for(;b.lastChild;)b=b.lastChild;if(1==b.nodeType)break;e+=b.textContent.length;f=b.previousSibling;if(!f){b=b.parentNode;break}b=f}e+=1;return Ci(a,b)+e}function Ei(a){0>a.f&&(a.f=Di(a,a.root,0,!0));return a.f}
function Fi(a,b){for(var c,d=a.root;;){c=Ci(a,d);if(c>=b)return d;var e=d.children;if(!e)break;var f=Ia(e.length,function(c){return Ci(a,e[c])>b});if(0==f)break;if(f<e.length&&Ci(a,e[f])<=b)throw Error("Consistency check failed!");d=e[f-1]}c=c+1;for(var f=d,g=f.firstChild||f.nextSibling,h=null;;){if(g){if(1==g.nodeType)break;h=f=g;c+=g.textContent.length;if(c>b)break}else if(f=f.parentNode,!f)break;g=f.nextSibling}return h||d}
function Gi(a,b){var c=b.getAttribute("id");c&&!a.d[c]&&(a.d[c]=b);(c=b.getAttributeNS("http://www.w3.org/XML/1998/namespace","id"))&&!a.d[c]&&(a.d[c]=b);for(c=b.firstElementChild;c;c=c.nextElementSibling)Gi(a,c)}function Hi(a,b){var c=b.match(/([^#]*)\#(.+)$/);if(!c||c[1]&&c[1]!=a.url)return null;var c=c[2],d=a.b.getElementById(c);d||(a.d||(a.d={},Gi(a,a.b.documentElement)),d=a.d[c]);return d}
function Ii(a,b,c){c=c||new DOMParser;var d;try{d=c.parseFromString(a,b)}catch(e){}if(d){a=d.documentElement;if("parsererror"===a.localName)return null;for(a=a.firstChild;a;a=a.nextSibling)if("parsererror"===a.localName)return null}else return null;return d}function Ji(a,b){var c=a.responseXML;if(!c){var d=new DOMParser,e=a.responseText||"<not-found/>",c=Ii(e,"text/xml",d);c||(c=Ii(e,"text/html",d))||d.parseFromString("<error/>","text/xml")}c=new zi(b,a.url,c);return O(c)}
function Ki(a){this.nb=a}function Li(){var a=Mi;return new Ki(function(b){return a.nb(b)&&1==b.nodeType&&"http://www.idpf.org/2008/embedding"==b.getAttribute("Algorithm")})}function Ni(){var a=Li(),b=Mi;return new Ki(function(c){if(!b.nb(c))return!1;c=new Bi([c]);c=Ai(c,"EncryptionMethod");a&&(c=Oi(c,a));return 0<c.b.length})}var Mi=new Ki(function(){return!0});function Bi(a){this.b=a}function Pi(a){return a.b}
function Oi(a,b){for(var c=[],d=0;d<a.b.length;d++){var e=a.b[d];b.nb(e)&&c.push(e)}return new Bi(c)}function Qi(a,b){function c(a){d.push(a)}for(var d=[],e=0;e<a.b.length;e++)b(a.b[e],c);return new Bi(d)}function Ri(a,b){for(var c=[],d=0;d<a.b.length;d++)c.push(b(a.b[d]));return c}function Si(a,b){for(var c=[],d=0;d<a.b.length;d++){var e=b(a.b[d]);null!=e&&c.push(e)}return c}function Ai(a,b){return Qi(a,function(a,d){for(var e=a.firstChild;e;e=e.nextSibling)e.localName==b&&d(e)})}
function Ti(a){return Qi(a,function(a,c){for(var d=a.firstChild;d;d=d.nextSibling)1==d.nodeType&&c(d)})}function Ui(a,b){return Si(a,function(a){return 1==a.nodeType?a.getAttribute(b):null})}Bi.prototype.textContent=function(){return Ri(this,function(a){return a.textContent})};var Vi={Ld:"ltr",Nd:"rtl"};ba("vivliostyle.constants.PageProgression",Vi);Vi.LTR="ltr";Vi.RTL="rtl";var Wi={Kd:"left",Md:"right"};ba("vivliostyle.constants.PageSide",Wi);Wi.LEFT="left";Wi.RIGHT="right";var Xi={transform:!0,"transform-origin":!0,position:!0};function Yi(a,b,c){this.target=a;this.name=b;this.value=c}var Zi={show:function(a){a.style.visibility="visible"},hide:function(a){a.style.visibility="hidden"},play:function(a){a.currentTime=0;a.play()},pause:function(a){a.pause()},resume:function(a){a.play()},mute:function(a){a.muted=!0},unmute:function(a){a.muted=!1}};function $i(a,b){var c=Zi[b];return c?function(){for(var b=0;b<a.length;b++)try{c(a[b])}catch(e){}}:null}
function aj(a){this.d={};this.J=a;this.g=[];var b=this;this.u=function(a){var d=a.currentTarget,e=d.getAttribute("href")||d.getAttributeNS("http://www.w3.org/1999/xlink","href");e&&(a.preventDefault(),Qa(b,{type:"hyperlink",target:null,currentTarget:null,Od:d,href:e}))};this.h={};this.b={width:0,height:0};this.k=this.j=!1;this.D=0;this.position=null;this.offset=-1;this.f=null;this.e=[];this.l={top:{},bottom:{},left:{},right:{}}}t(aj,Pa);
function bj(a){a.A=!0;a.J.setAttribute("data-vivliostyle-auto-page-width",!0)}function cj(a){a.w=!0;a.J.setAttribute("data-vivliostyle-auto-page-height",!0)}function dj(a,b,c){var d=a.h[c];d?d.push(b):a.h[c]=[b]}function ej(a,b){u(a.J,"transform","scale("+b+")")}function fj(a,b){if(1==a.nodeType)return!1;var c=a.textContent;switch(b){case 0:return!!c.match(/^\s*$/);case 1:return!!c.match(/^[ \t\f]*$/);case 2:return 0==c.length}throw Error("Unexpected whitespace: "+b);}
function gj(a,b,c,d,e,f,g,h){this.f=a;this.g=b;this.b=c;this.Ba=d;this.j=e;this.d=f;this.Dd=g;this.h=h;this.e=-1}function hj(a,b){return a.d?!b.d||a.Ba>b.Ba?!0:a.h:!1}function ij(a,b){return a.top-b.top}function jj(a,b){return b.right-a.right}function kj(a,b,c,d,e,f,g){this.Z=a;this.Fc=d;this.Yc=null;this.root=b;this.X=c;this.type=f;e&&(e.Yc=this);this.b=g}function lj(a,b){this.Bd=a;this.count=b}
function mj(a,b,c){this.T=a;this.parent=b;this.$=c;this.aa=0;this.I=!1;this.Fa=0;this.ea=b?b.ea:null;this.ia=this.qa=null;this.B=!1;this.d=!0;this.overflow=!1;this.g=b?b.g:0;this.u=this.h=null;this.w=b?b.w:0;this.j=b?b.j:!1;this.b=this.A=this.l=null;this.k=b?b.k:{};this.f=b?b.f:!1;this.e=b?b.e:null}function nj(a){a.d=!0;a.g=a.parent?a.parent.g:0;a.b=null;a.aa=0;a.I=!1;a.h=null;a.u=null;a.l=null;a.A=null;a.qa=null;a.j=a.parent?a.parent.j:!1;a.f=a.parent?a.parent.f:!1;a.qa=null}
function oj(a){var b=new mj(a.T,a.parent,a.$);b.aa=a.aa;b.I=a.I;b.qa=a.qa;b.Fa=a.Fa;b.ea=a.ea;b.ia=a.ia;b.d=a.d;b.g=a.g;b.h=a.h;b.u=a.u;b.j=a.j;b.w=a.w;b.l=a.l;b.A=a.A;b.b=a.b;b.e=a.e;b.f=a.f;b.overflow=a.overflow;return b}mj.prototype.modify=function(){return this.B?oj(this):this};function pj(a){var b=a;do{if(b.B)break;b.B=!0;b=b.parent}while(b);return a}mj.prototype.clone=function(){for(var a=oj(this),b=a,c;null!=(c=b.parent);)c=oj(c),b=b.parent=c;return a};
function qj(a){return{xa:a.T,Fa:a.Fa,ea:a.ea,qa:a.qa,ia:a.ia?qj(a.ia):null}}function rj(a){this.La=a;this.b=this.d=null}rj.prototype.clone=function(){var a=new rj(this.La);if(this.d){a.d=[];for(var b=0;b<this.d.length;++b)a.d[b]=this.d[b]}if(this.b)for(a.b=[],b=0;b<this.b.length;++b)a.b[b]=this.b[b];return a};function sj(a,b){this.d=a;this.b=b}sj.prototype.clone=function(){return new sj(this.d.clone(),this.b)};function tj(){this.b=[]}
tj.prototype.clone=function(){for(var a=new tj,b=this.b,c=a.b,d=0;d<b.length;d++)c[d]=b[d].clone();return a};function uj(){this.d=0;this.b={};this.e=0}uj.prototype.clone=function(){var a=new uj;a.d=this.d;a.f=this.f;a.e=this.e;a.g=this.g;for(var b in this.b)a.b[b]=this.b[b].clone();return a};
function vj(a){this.d=a;this.F=this.B=this.height=this.width=this.w=this.j=this.H=this.h=this.va=this.ba=this.Oa=this.Y=this.marginBottom=this.marginTop=this.marginRight=this.marginLeft=this.top=this.left=0;this.Lb=this.A=null;this.ra=this.Mb=this.fb=this.Nb=this.e=0;this.b=!1}function wj(a){return a.marginTop+a.ba+a.j}function xj(a){return a.marginBottom+a.va+a.w}function yj(a){return a.marginLeft+a.Y+a.h}function zj(a){return a.marginRight+a.Oa+a.H}
function Aj(a,b){a.d=b.d;a.left=b.left;a.top=b.top;a.marginLeft=b.marginLeft;a.marginRight=b.marginRight;a.marginTop=b.marginTop;a.marginBottom=b.marginBottom;a.Y=b.Y;a.Oa=b.Oa;a.ba=b.ba;a.va=b.va;a.h=b.h;a.H=b.H;a.j=b.j;a.w=b.w;a.width=b.width;a.height=b.height;a.B=b.B;a.F=b.F;a.Lb=b.Lb;a.A=b.A;a.e=b.e;a.Nb=b.Nb;a.fb=b.fb;a.b=b.b}function Bj(a,b,c){a.top=b;a.height=c;u(a.d,"top",b+"px");u(a.d,"height",c+"px")}function Cj(a,b,c){a.left=b;a.width=c;u(a.d,"left",b+"px");u(a.d,"width",c+"px")}
function Dj(a,b){this.b=a;this.d=b}t(Dj,Sc);Dj.prototype.Jb=function(a){this.b.appendChild(this.b.ownerDocument.createTextNode(a.d));return null};Dj.prototype.vb=function(a){var b=this.b.ownerDocument.createElementNS("http://www.w3.org/1999/xhtml","img");b.setAttribute("src",a.url);this.b.appendChild(b);return null};Dj.prototype.Na=function(a){this.Va(a.values);return null};
Dj.prototype.rb=function(a){a=a.da().evaluate(this.d);"string"===typeof a&&this.b.appendChild(this.b.ownerDocument.createTextNode(a));return null};function Ej(a){return null!=a&&a!==yd&&a!==xd&&a!==sd};function Fj(a,b,c){this.e=a;this.d=b;this.b=c}function Gj(){this.map=[]}function Hj(a){return 0==a.map.length?0:a.map[a.map.length-1].b}function Ij(a,b){if(0==a.map.length)a.map.push(new Fj(b,b,b));else{var c=a.map[a.map.length-1],d=c.b+b-c.d;c.d==c.e?(c.d=b,c.e=b,c.b=d):a.map.push(new Fj(b,b,d))}}function Jj(a,b){0==a.map.length?a.map.push(new Fj(b,0,0)):a.map[a.map.length-1].d=b}function Kj(a,b){var c=Ia(a.map.length,function(c){return b<=a.map[c].d}),c=a.map[c];return c.b-Math.max(0,c.e-b)}
function Lj(a,b){var c=Ia(a.map.length,function(c){return b<=a.map[c].b}),c=a.map[c];return c.e-(c.b-b)}
function Mj(a,b,c,d,e,f,g){this.X=a;this.root=a.root;this.ba=c;this.f=d;this.h=f;this.d=this.root;this.u={};this.w={};this.B=[];this.l=this.k=null;this.A=new Vh(b,d,g);this.e=new Gj;this.La=!0;this.F=[];this.Y=e;this.P=this.H=!1;this.b=a=Ci(a,this.root);Ij(this.e,a);b=Nj(this,this.root);di(this.A,this.root,b);Oj(this,b,!1);this.j=!0;switch(this.root.namespaceURI){case "http://www.w3.org/1999/xhtml":case "http://www.gribuser.ru/xml/fictionbook/2.0":this.j=!1}this.F.push(!0);this.w={};this.w["e"+a]=
b;this.b++;Pj(this,-1)}function Qj(a,b,c,d){return(b=b[d])&&b.evaluate(a.f)!==c[d]}function Rj(a,b,c){for(var d in c){var e=b[d];e?(a.u[d]=e,delete b[d]):(e=c[d])&&(a.u[d]=new V(e,33554432))}}var Sj=["column-count","column-width"];
function Oj(a,b,c){c||["writing-mode","direction"].forEach(function(a){b[a]&&(this.u[a]=b[a])},a);if(!a.H){c=Qj(a,b,a.h.g,"background-color")?b["background-color"].evaluate(a.f):null;var d=Qj(a,b,a.h.g,"background-image")?b["background-image"].evaluate(a.f):null;if(c&&c!==sd||d&&d!==sd)Rj(a,b,a.h.g),a.H=!0}if(!a.P)for(c=0;c<Sj.length;c++)if(Qj(a,b,a.h.j,Sj[c])){Rj(a,b,a.h.j);a.P=!0;break}}
function Nj(a,b){if(b.style instanceof CSSStyleDeclaration){var c=b.getAttribute("style");if(c){var d=a.X.url,e=new ki(a.ba,a.h),c=new Nb(c);try{Ef(new wf(nf,c,e,d),Number.POSITIVE_INFINITY,!1,!0)}catch(f){v("Style attribute parse error: "+f)}return e.b}}return{}}
function Pj(a,b){if(!(b>=a.b)){var c=a.f,d=Ci(a.X,a.root);if(b<d){var e=a.g(a.root,!1),f=e["flow-into"],f=f?f.evaluate(c,"flow-into").toString():"body";Tj(a,f,e,a.root,d)}d=Fi(a.X,b);e=Di(a.X,d,0,!1);if(!(e>=a.b))for(;;){if(1!=d.nodeType)e+=d.textContent.length;else{var g=d;if(e!=Ci(a.X,g))throw Error("Inconsistent offset");var h=a.g(g,!1);if(f=h["flow-into"])f=f.evaluate(c,"flow-into").toString(),Tj(a,f,h,g,e);e++}if(e>=a.b)break;f=d.firstChild;if(null==f)for(;!(f=d.nextSibling);)if(d=d.parentNode,
d===a.root)return;d=f}}}function Tj(a,b,c,d,e){var f=0,g=Number.POSITIVE_INFINITY,h=!1,k=!1,l=!1,n=c["flow-options"];if(n){var p;a:{if(h=n.evaluate(a.f,"flow-options")){k=new Lf;try{h.M(k);p=k.b;break a}catch(r){v("toSet: "+r)}}p={}}h=!!p.exclusive;k=!!p["static"];l=!!p.last}(p=c["flow-linger"])&&(g=Nf(p.evaluate(a.f,"flow-linger"),Number.POSITIVE_INFINITY));(c=c["flow-priority"])&&(f=Nf(c.evaluate(a.f,"flow-priority"),0));d=new gj(b,d,e,f,g,h,k,l);a.B.push(d);a.l==b&&(a.l=null);a.k&&Uj(a.k,d)}
function Vj(a,b,c){var d=-1;if(b<=a.b&&(d=Kj(a.e,b),d+=c,d<Hj(a.e)))return Lj(a.e,d);if(null==a.d)return Number.POSITIVE_INFINITY;for(var e=a.f;;){var f=a.d.firstChild;if(null==f)for(;;){if(1==a.d.nodeType){var f=a.A,g=a.d;if(f.ra.pop()!==g)throw Error("Invalid call to popElement");f.pop();bi(f);a.La=a.F.pop()}if(f=a.d.nextSibling)break;a.d=a.d.parentNode;if(a.d===a.root)return a.d=null,b<a.b&&(0>d&&(d=Kj(a.e,b),d+=c),d<=Hj(a.e))?Lj(a.e,d):Number.POSITIVE_INFINITY}a.d=f;if(1!=a.d.nodeType)a.b+=a.d.textContent.length,
a.La?Ij(a.e,a.b):Jj(a.e,a.b);else{g=a.d;f=Nj(a,g);a.F.push(a.La);di(a.A,g,f);a.j||"body"!=g.localName||g.parentNode!=a.root||(Oj(a,f,!0),a.j=!0);var h=f["flow-into"];h&&(h=h.evaluate(e,"flow-into").toString(),Tj(a,h,f,g,a.b),a.La=!!a.Y[h]);a.La&&(g=f.display)&&g.evaluate(e,"display")===xd&&(a.La=!1);if(Ci(a.X,a.d)!=a.b)throw Error("Inconsistent offset");a.w["e"+a.b]=f;a.b++;a.La?Ij(a.e,a.b):Jj(a.e,a.b);if(b<a.b&&(0>d&&(d=Kj(a.e,b),d+=c),d<=Hj(a.e)))return Lj(a.e,d)}}}
Mj.prototype.g=function(a,b){var c=Ci(this.X,a),d="e"+c;b&&(c=Di(this.X,a,0,!0));this.b<=c&&Vj(this,c,0);return this.w[d]};function Wj(a,b){return a?b?"avoid"==a||"avoid"==b?"avoid":a:a:b}var Xj={img:!0,svg:!0,audio:!0,video:!0};
function Yj(a,b,c){var d=a.b;if(!d)return NaN;if(1==d.nodeType){if(a.I){var e=d.getBoundingClientRect();if(e.right>=e.left&&e.bottom>=e.top)return c?e.left:e.bottom}return NaN}var e=NaN,f=d.ownerDocument.createRange(),g=d.textContent.length;if(!g)return NaN;a.I&&(b+=g);b>=g&&(b=g-1);f.setStart(d,b);f.setEnd(d,b+1);a=Zj(f);if(b=c){b=document.body;if(null==Ta){var h=b.ownerDocument,f=h.createElement("div");f.style.position="absolute";f.style.top="0px";f.style.left="0px";f.style.width="100px";f.style.height=
"100px";f.style.overflow="hidden";f.style.lineHeight="16px";f.style.fontSize="16px";u(f,"writing-mode","vertical-rl");b.appendChild(f);g=h.createTextNode("a a a a a a a a a a a a a a a a");f.appendChild(g);h=h.createRange();h.setStart(g,0);h.setEnd(g,1);Ta=50>h.getBoundingClientRect().left;b.removeChild(f)}b=Ta}if(b){b=d.ownerDocument.createRange();b.setStart(d,0);b.setEnd(d,d.textContent.length);d=Zj(b);b=[];for(f=0;f<a.length;f++){g=a[f];for(h=0;h<d.length;h++){var k=d[h];if(g.top>=k.top&&g.bottom<=
k.bottom&&1>Math.abs(g.right-k.right)){b.push({top:g.top,left:k.left,bottom:k.bottom,right:k.right});break}}h==d.length&&(v("Could not fix character box"),b.push(g))}a=b}for(b=d=0;b<a.length;b++)f=a[b],g=c?f.bottom-f.top:f.right-f.left,f.right>f.left&&f.bottom>f.top&&(isNaN(e)||g>d)&&(e=c?f.left:f.bottom,d=g);return e}function ak(a,b){this.e=a;this.f=b}ak.prototype.d=function(a,b){return b<this.f?null:bk(a,this,0<b)};ak.prototype.b=function(){return this.f};
function ck(a,b,c,d){this.position=a;this.f=b;this.g=c;this.e=d}ck.prototype.d=function(a,b){var c;b<this.b()?c=null:(a.e=this.e,c=this.position);return c};ck.prototype.b=function(){return("avoid"==this.f?1:0)+(this.g?3:0)+(this.position.parent?this.position.parent.g:0)};function dk(a,b,c){this.$=a;this.d=b;this.b=c}
function ek(a){for(var b=1;b<a.length;b++){var c=a[b-1],d=a[b];c===d?v("validateCheckPoints: duplicate entry"):c.$>=d.$?v("validateCheckPoints: incorrect boxOffset"):c.T==d.T&&(d.I?c.I&&v("validateCheckPoints: duplicate after points"):c.I?v("validateCheckPoints: inconsistent after point"):d.$-c.$!=d.aa-c.aa&&v("validateCheckPoints: boxOffset inconsistent with offsetInNode"))}}
function fk(a,b,c){vj.call(this,a);this.Mc=a.lastChild;this.k=b;this.ic=c;this.qd=a.ownerDocument;this.jc=!1;this.la=this.gb=this.Ja=this.Oc=0;this.kc=this.ib=this.l=this.f=null;this.Nc=!1;this.P=this.g=this.u=null;this.bd=!0;this.mc=this.lc=0}t(fk,vj);fk.prototype.clone=function(){var a=new fk(this.d,this.k,this.ic);Aj(a,this);a.Mc=this.Mc;a.jc=this.jc;a.l=this.l?this.l.clone():null;a.ib=this.ib.concat();return a};
function gk(a,b){var c=b.getBoundingClientRect(),d=(a.b?a.gb:a.Oc)-a.f.V,e=(a.b?a.Oc:a.Ja)-a.f.R;return{left:c.left-d,top:c.top-e,right:c.right-d,bottom:c.bottom-e}}function hk(a,b){return a.b?b<a.la:b>a.la}function ik(a,b,c){var d=new mj(b.xa,c,0);d.Fa=b.Fa;d.ea=b.ea;d.qa=b.qa;d.ia=b.ia?ik(a,b.ia,pj(c)):null;return d}
function jk(a,b){var c=M("openAllViews"),d=b.ja;kk(a.k,a.d,a.jc);var e=d.length-1,f=null;Qe(function(){for(;0<=e;){f=ik(a,d[e],f);if(0==e&&(f.aa=b.aa,f.I=b.I,f.I))break;var c=lk(a.k,f,0==e&&0==f.aa);e--;if(c.ua())return c}return O(!1)}).then(function(){Q(c,f)});return P(c)}var mk=/^[^A-Za-z0-9_\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]*([A-Za-z0-9_\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527][^A-Za-z0-9_\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]*)?/;
function nk(a,b){if(b.e&&b.d&&!b.I&&0==b.e.count&&1!=b.b.nodeType){var c=b.b.textContent.match(mk);return ok(a.k,b,c[0].length)}return O(b)}function pk(a,b,c){var d=M("buildViewToNextBlockEdge");Re(function(d){b.b&&c.push(pj(b));nk(a,b).then(function(f){f!==b&&(b=f,c.push(pj(b)));qk(a.k,b).then(function(c){(b=c)?b.h&&!a.b?rk(a,b).then(function(a){b=a;!b||b.overflow?R(d):Te(d)}):b.d?Te(d):R(d):R(d)})})}).then(function(){Q(d,b)});return P(d)}
function sk(a,b){if(!b.b)return O(b);var c=b.T,d=M("buildDeepElementView");Re(function(d){nk(a,b).then(function(f){if(f!==b){for(var g=f;g&&g.T!=c;)g=g.parent;if(null==g){b=f;R(d);return}}qk(a.k,f).then(function(a){(b=a)&&b.T!=c?Te(d):R(d)})})}).then(function(){Q(d,b)});return P(d)}function tk(a,b,c,d,e){var f=a.qd.createElement("div");a.b?(u(f,"height",d+"px"),u(f,"width",e+"px")):(u(f,"width",d+"px"),u(f,"height",e+"px"));u(f,"float",c);u(f,"clear",c);a.d.insertBefore(f,b);return f}
function uk(a){for(var b=a.d.firstChild;b;){var c=b.nextSibling;if(1==b.nodeType){var d=b.style.cssFloat;if("left"==d||"right"==d)a.d.removeChild(b);else break}b=c}}function vk(a){for(var b=a.d.firstChild,c=a.kc,d=a.b?a.f.R:a.f.V,e=a.b?a.f.O:a.f.U,f=0;f<c.length;f++){var g=c[f],h=g.O-g.R;g.left=tk(a,b,"left",g.V-d,h);g.right=tk(a,b,"right",e-g.U,h)}}
function wk(a,b,c,d,e){var f;if(b&&b.I&&!b.d&&(f=Yj(b,0,a.b),!isNaN(f)))return f;b=c[d];for(e-=b.$;;){f=Yj(b,e,a.b);if(!isNaN(f))return f;if(0<e)e--;else{d--;if(0>d)return a.Ja;b=c[d];1!=b.b.nodeType&&(e=b.b.textContent.length)}}}function xk(a){return"number"==typeof a?a:(a=a.match(/^(-?[0-9]*(\.[0-9]*)?)px$/))?parseFloat(a[0]):0}
function yk(a,b){var c=a.ic.b.getComputedStyle(b,null),d=new Wd;c&&(d.left=xk(c.marginLeft),d.top=xk(c.marginTop),d.right=xk(c.marginRight),d.bottom=xk(c.marginBottom));return d}
function zk(a,b,c){if(a=a.ic.b.getComputedStyle(b,null))c.marginLeft=xk(a.marginLeft),c.Y=xk(a.borderLeftWidth),c.h=xk(a.paddingLeft),c.marginTop=xk(a.marginTop),c.ba=xk(a.borderTopWidth),c.j=xk(a.paddingTop),c.marginRight=xk(a.marginRight),c.Oa=xk(a.borderRightWidth),c.H=xk(a.paddingRight),c.marginBottom=xk(a.marginBottom),c.va=xk(a.borderBottomWidth),c.w=xk(a.paddingBottom)}function Ak(a,b,c){b=new dk(b,c,c);a.g?a.g.push(b):a.g=[b]}
function Bk(a,b,c,d){if(a.g&&a.g[a.g.length-1].b)return Ak(a,b,c),O(!0);d+=40*(a.b?-1:1);var e=a.l,f=!e;if(f){var g=a.d.ownerDocument.createElement("div");u(g,"position","absolute");var h=a.k.clone(),e=new fk(g,h,a.ic);a.l=e;e.b=Ck(a.k,a.b,g);e.jc=!0;a.b?(e.left=0,u(e.d,"width","2em")):(e.top=a.gb,u(e.d,"height","2em"))}a.d.appendChild(e.d);zk(a,e.d,e);g=(a.b?-1:1)*(d-a.Ja);a.b?e.height=a.f.O-a.f.R-wj(e)-xj(e):e.width=a.f.U-a.f.V-yj(e)-zj(e);d=(a.b?-1:1)*(a.gb-d)-(a.b?yj(e)-zj(e):wj(e)+xj(e));if(f&&
18>d)return a.d.removeChild(e.d),a.l=null,Ak(a,b,c),O(!0);if(!a.b&&e.top<g)return a.d.removeChild(e.d),Ak(a,b,c),O(!0);var k=M("layoutFootnoteInner");a.b?Cj(e,0,d):Bj(e,g,d);e.B=a.B+a.left+yj(a);e.F=a.F+a.top+wj(a);e.A=a.A;var l=new rj(c);f?(Dk(e),f=O(!0)):0==e.A.length?(Ek(e),f=O(!0)):f=Fk(e);f.then(function(){Ik(e,l).then(function(d){a.b?(a.la=a.gb+(e.e+yj(e)+zj(e)),Cj(e,0,e.e)):(a.la=a.gb-(e.e+wj(e)+xj(e)),Bj(e,a.la-a.Ja,e.e));var f;!a.b&&0<e.A.length?f=Fk(e):f=O(d);f.then(function(d){d=new dk(b,
c,d?d.La:null);a.g?a.g.push(d):a.g=[d];Q(k,!0)})})});return P(k)}
function Jk(a,b){var c=M("layoutFootnote"),d=b.b;d.setAttribute("style","");u(d,"display","inline-block");d.textContent="M";var e=d.getBoundingClientRect(),f=a.b?e.left:e.bottom;d.textContent="";Kk(a.k,b,"footnote-call",d);d.textContent||d.parentNode.removeChild(d);d={ja:[{xa:b.T,Fa:0,ea:b.ea,qa:null,ia:null}],aa:0,I:!1};e=b.$;b=b.modify();b.I=!0;Bk(a,e,d,f).then(function(){a.l&&a.l.d.parentNode&&a.d.removeChild(a.l.d);hk(a,f)&&0!=a.u.length&&(b.overflow=!0);Q(c,b)});return P(c)}
function Lk(a,b){var c=M("layoutFloat"),d=b.b,e=b.h;u(d,"float","none");u(d,"position","absolute");u(d,"left","auto");u(d,"right","auto");u(d,"top","auto");sk(a,b).then(function(f){for(var g=gk(a,d),h=yk(a,d),g=new Ud(g.left-h.left,g.top-h.top,g.right+h.right,g.bottom+h.bottom),h=a.b?a.f.R:a.f.V,k=a.b?a.f.O:a.f.U,l=b.parent;l&&l.d;)l=l.parent;if(l){var n=l.b.ownerDocument.createElement("div");n.style.left="0px";n.style.top="0px";a.b?(n.style.bottom="0px",n.style.width="1px"):(n.style.right="0px",
n.style.height="1px");l.b.appendChild(n);var p=gk(a,n),h=Math.max(a.b?p.top:p.left,h),k=Math.min(a.b?p.bottom:p.right,k);l.b.removeChild(n);l=a.b?g.O-g.R:g.U-g.V;"left"==e?k=Math.max(k,h+l):h=Math.min(h,k-l)}k=new Ud(h,(a.b?-1:1)*a.f.R,k,(a.b?-1:1)*a.f.O);h=g;a.b&&(h=le(g));a:for(var l=a.kc,n=h,p=n.R,r=n.U-n.V,q=n.O-n.R,y=pe(l,p);;){var x=p+q;if(x>k.O)break a;for(var I=k.V,J=k.U,C=y;C<l.length&&l[C].R<x;C++){var N=l[C];N.V>I&&(I=N.V);N.U<J&&(J=N.U)}if(I+r<=J||y>=l.length){"left"==e?(n.V=I,n.U=I+r):
(n.V=J-r,n.U=J);n.O+=p-n.R;n.R=p;break a}p=l[y].O;y++}a.b&&(g=new Ud(-h.O,h.V,-h.R,h.U));u(d,"left",g.V-a.f.V+a.h+"px");u(d,"top",g.R-a.f.R+a.j+"px");g=a.b?g.V:g.O;if(hk(a,g)&&0!=a.u.length)b=b.modify(),b.overflow=!0,Q(c,b);else{uk(a);k=a.b?le(a.f):a.f;l=a.kc;n=null;for(n=[new Yd(h.R,h.O,h.V,h.U)];0<n.length&&n[0].O<=k.R;)n.shift();if(0!=n.length){n[0].R<k.R&&(n[0].R=k.R);h=0==l.length?k.R:l[l.length-1].O;h<k.O&&l.push(new Yd(h,k.O,k.V,k.U));p=pe(l,n[0].R);for(r=0;r<n.length;r++){q=n[r];if(p==l.length)break;
l[p].R<q.R&&(h=l[p],p++,l.splice(p,0,new Yd(q.R,h.O,h.V,h.U)),h.O=q.R);for(;p<l.length&&(h=l[p++],h.O>q.O&&(l.splice(p,0,new Yd(q.O,h.O,h.V,h.U)),h.O=q.O),q.V!=q.U&&("left"==e?h.V=q.U:h.U=q.V),h.O!=q.O););}oe(k,l)}vk(a);"left"==e?a.lc=g:a.mc=g;Mk(a,g);Q(c,f)}});return P(c)}
function Nk(a,b){for(var c=a.b,d="";c&&b&&!d&&(1!=c.nodeType||(d=c.style.textAlign,b));c=c.parentNode);if(!b||"justify"==d){var c=a.b,e=c.ownerDocument,d=e.createElement("span");d.style.visibility="hidden";d.textContent=" ########################";d.setAttribute("data-adapt-spec","1");var f=b&&(a.I||1!=c.nodeType)?c.nextSibling:c;if(c=c.parentNode)c.insertBefore(d,f),b||(e=e.createElement("div"),c.insertBefore(e,f),d.style.lineHeight="80px",e.style.marginTop="-80px",e.style.height="0px",e.setAttribute("data-adapt-spec",
"1"))}}function Ok(a,b,c,d){var e=M("processLineStyling");ek(d);var f=d.concat([]);d.splice(0,d.length);var g=0,h=b.e;0==h.count&&(h=h.Bd);Re(function(d){if(h){var e=Pk(a,f),n=h.count-g;if(e.length<=n)R(d);else{var p=Qk(a,f,e[n-1]);Rk(a,p,!1,!1).then(function(){g+=n;ok(a.k,p,0).then(function(e){b=e;Nk(b,!1);h=b.e;f=[];pk(a,b,f).then(function(a){c=a;Te(d)})})})}}else R(d)}).then(function(){Array.prototype.push.apply(d,f);ek(d);Q(e,c)});return P(e)}
function Sk(a,b){for(var c=0,d=0,e=b.length-1;0<=e;e--){var f=b[e];if(!f.I||!f.b||1!=f.b.nodeType)break;f=yk(a,f.b);f=a.b?-f.left:f.bottom;0<f?c=Math.max(c,f):d=Math.min(d,f)}return c-d}
function Tk(a,b){var c=M("layoutBreakableBlock"),d=[];pk(a,b,d).then(function(e){var f=d.length-1;if(0>f)Q(c,e);else{var f=wk(a,e,d,f,d[f].$),g=hk(a,f);null==e&&(f+=Sk(a,d));Mk(a,f);var h;b.e?h=Ok(a,b,e,d):h=O(e);h.then(function(b){0<d.length&&(a.u.push(new ak(d,d[0].g)),g&&(2!=d.length&&0<a.u.length||d[0].T!=d[1].T||!Xj[d[0].T.localName])&&b&&(b=b.modify(),b.overflow=!0));Q(c,b)})}});return P(c)}
function Qk(a,b,c){ek(b);for(var d=0,e=b[0].$,f=d,g=b.length-1,h=b[g].$,k;e<h;){k=e+Math.ceil((h-e)/2);for(var f=d,l=g;f<l;){var n=f+Math.ceil((l-f)/2);b[n].$>k?l=n-1:f=n}l=wk(a,null,b,f,k);if(a.b?l<c:l>c){for(h=k-1;b[f].$==k;)f--;g=f}else Mk(a,l),e=k,d=f}a=b[f];b=a.b;1!=b.nodeType&&(a.I?a.aa=b.length:(e-=a.$,c=b.data,173==c.charCodeAt(e)?(b.replaceData(e,c.length-e,"-"),e++):(d=c.charAt(e),e++,f=c.charAt(e),b.replaceData(e,c.length-e,Fa(d)&&Fa(f)?"-":"")),0<e&&(a=a.modify(),a.aa+=e,a.l=null)));return a}
function Pk(a,b){for(var c=[],d=b[0].b,e=b[b.length-1].b,f=[],g=d.ownerDocument.createRange(),h=!1,k=null,l=!1,n=!0;n;){var p=!0;do{var r=null;d==e&&(n=!1);1!=d.nodeType?(l||(g.setStartBefore(d),l=!0),k=d):h?h=!1:d.getAttribute("data-adapt-spec")?p=!l:r=d.firstChild;r||(r=d.nextSibling,r||(h=!0,r=d.parentNode));d=r}while(p&&n);if(l){g.setEndAfter(k);l=Zj(g);for(p=0;p<l.length;p++)f.push(l[p]);l=!1}}f.sort(a.b?jj:ij);k=d=h=g=e=0;for(n=a.b?-1:1;;){if(k<f.length&&(l=f[k],p=1,0<d&&(p=Math.max(a.b?l.right-
l.left:l.bottom-l.top,1),p=n*(a.b?l.right:l.top)<n*e?n*((a.b?l.left:l.bottom)-e)/p:n*(a.b?l.left:l.bottom)>n*g?n*(g-(a.b?l.right:l.top))/p:1),0==d||.6<=p||.2<=p&&(a.b?l.top:l.left)>=h-1)){h=a.b?l.bottom:l.right;a.b?(e=0==d?l.right:Math.max(e,l.right),g=0==d?l.left:Math.min(g,l.left)):(e=0==d?l.top:Math.min(e,l.top),g=0==d?l.bottom:Math.max(g,l.bottom));d++;k++;continue}0<d&&(c.push(g),d=0);if(k>=f.length)break}c.sort(Ja);a.b&&c.reverse();return c}
function Uk(a,b){if(!a.g)return O(!0);for(var c=!1,d=a.g.length-1;0<=d;--d){var e=a.g[d];if(e.$<=b)break;a.g.pop();e.b!==e.d&&(c=!0)}if(!c)return O(!0);var f=M("clearFootnotes"),g=a.e+a.Ja,h=a.g;a.l=null;a.g=null;var k=0;Qe(function(){for(;k<h.length;){var b=h[k++],b=Bk(a,b.$,b.d,g);if(b.ua())return b}return O(!1)}).then(function(){Q(f,!0)});return P(f)}
function bk(a,b,c){var d=b.e,e;if(c)e=c=1;else{for(e=d[0];e.parent&&e.d;)e=e.parent;c=Math.max((e.k.widows||1)-0,1);e=Math.max((e.k.orphans||1)-0,1)}var f=Pk(a,d),g=a.la,d=Ia(f.length,function(b){return a.b?f[b]<g:f[b]>g}),d=Math.min(f.length-c,d);if(d<e)return null;g=f[d-1];if(b=Qk(a,b.e,g))a.e=(a.b?-1:1)*(g-a.Ja);return b}
function Rk(a,b,c,d){var e=b;c=c||null!=b.b&&1==b.b.nodeType&&!b.I;do{var f=e.b.parentNode;if(!f)break;var g=f,h=e.b;if(g)for(var k=void 0;(k=g.lastChild)!=h;)g.removeChild(k);c&&(f.removeChild(e.b),c=!1);e=e.parent}while(e);d&&Nk(b,!0);return Uk(a,b.$)}
function Vk(a,b,c){var d=M("findAcceptableBreak"),e=null,f=0,g=0;do for(var f=g,g=Number.MAX_VALUE,h=a.u.length-1;0<=h&&!e;--h){var e=a.u[h].d(a,f),k=a.u[h].b();k>f&&(g=Math.min(g,k))}while(g>f&&!e);var l=!1;if(!e){v("Could not find any page breaks?!!");if(a.bd)return Wk(a,b).then(function(b){b?(b=b.modify(),b.overflow=!1,Rk(a,b,l,!0).then(function(){Q(d,b)})):Q(d,b)}),P(d);e=c;l=!0}Rk(a,e,l,!0).then(function(){Q(d,e)});return P(d)}
function Xk(a){a=a.toString();return""==a||"auto"==a||!!a.match(/^0+(.0*)?[^0-9]/)}function Yk(a,b,c,d,e){if(!b)return!1;var f=Yj(b,0,a.b),g=hk(a,f);c&&(f+=Sk(a,c));Mk(a,f);if(d||!g)b=new ck(pj(b),e,g,a.e),a.u.push(b);return g}
function Zk(a,b){if(b.b.parentNode){var c=yk(a,b.b),d=b.b.ownerDocument.createElement("div");a.b?(d.style.bottom="0px",d.style.width="1px",d.style.marginRight=c.right+"px"):(d.style.right="0px",d.style.height="1px",d.style.marginTop=c.top+"px");b.b.parentNode.insertBefore(d,b.b);var e=d.getBoundingClientRect(),e=a.b?e.right:e.top,f=a.b?-1:1,g;switch(b.u){case "left":g=a.lc;break;case "right":g=a.mc;break;default:g=f*Math.max(a.mc*f,a.lc*f)}e*f>=g*f?b.b.parentNode.removeChild(d):(e=Math.max(1,(g-e)*
f),a.b?d.style.width=e+"px":d.style.height=e+"px",e=d.getBoundingClientRect(),e=a.b?e.left:e.bottom,a.b?(g=e+c.right-g,0<g==0<=c.right&&(g+=c.right),d.style.marginLeft=g+"px"):(g-=e+c.top,0<g==0<=c.top&&(g+=c.top),d.style.marginBottom=g+"px"))}}
function $k(a,b,c){var d=M("skipEdges"),e=c?"avoid":null,f=null,g=[];Re(function(c){for(;b;){do if(b.b){if(b.d&&1!=b.b.nodeType){if(fj(b.b,b.w))break;if(!b.I){Yk(a,f,null,!0,e)?(b=(f||b).modify(),b.overflow=!0):(b=b.modify(),b.l=e);R(c);return}}if(!b.I&&(b.u&&Zk(a,b),b.h)){Yk(a,f,null,!0,e)&&(b=(f||b).modify(),b.overflow=!0);R(c);return}if(1==b.b.nodeType){var d=b.b.style;if(b.I){if(f=pj(b),g.push(f),e=Wj(b.A,e),d&&(!Xk(d.paddingBottom)||!Xk(d.borderBottomWidth))){if(Yk(a,f,null,!0,e)){b=(f||b).modify();
b.overflow=!0;R(c);return}g=[f];f=e=null}}else{if((e=Wj(b.l,e))&&"avoid"!=e&&"auto"!=e){R(c);a.P=e;return}if(Xj[b.b.localName]){Yk(a,f,null,!0,e)&&(b=(f||b).modify(),b.overflow=!0);R(c);return}if(d&&(!Xk(d.paddingTop)||!Xk(d.borderTopWidth))){if(Yk(a,f,null,!0,e)){b=(f||b).modify();b.overflow=!0;R(c);return}f=e=null;g=[]}}}}while(0);d=qk(a.k,b);if(d.ua()){d.then(function(a){b=a;Te(c)});return}b=d.Pb()}0!=a.u.length&&Yk(a,f,g,!1,e)&&f&&(b=f.modify(),b.overflow=!0);R(c)}).then(function(){Q(d,b)});return P(d)}
function Wk(a,b){var c=b,d=M("skipEdges"),e=null;Re(function(d){for(;b;){do if(b.b){if(b.d&&1!=b.b.nodeType){if(fj(b.b,b.w))break;if(!b.I){R(d);return}}if(!b.I&&b.h){R(d);return}if(1==b.b.nodeType){var g=b.b.style;if(b.I)e=Wj(b.A,e);else{if((e=Wj(b.l,e))&&"avoid"!=e&&"auto"!=e){R(d);a.P=e;return}if(Xj[b.b.localName]){R(d);return}if(g&&(!Xk(g.paddingTop)||!Xk(g.borderTopWidth))){R(d);return}}}}while(0);g=qk(a.k,b);if(g.ua()){g.then(function(a){b=a;Te(d)});return}b=g.Pb()}c=null;R(d)}).then(function(){Q(d,
c)});return P(d)}function rk(a,b){return"footnote"==b.h?Jk(a,b):Lk(a,b)}function al(a,b,c){var d=M("layoutNext");$k(a,b,c).then(function(c){b=c;if(!b||a.P||b.overflow)Q(d,b);else if(b.h)rk(a,b).ka(d);else{a:{if(!b.I)switch(b.T.namespaceURI){case "http://www.w3.org/2000/svg":c=!1;break a}c=!0}c?Tk(a,b).ka(d):sk(a,b).ka(d)}});return P(d)}
function Ek(a){var b=a.d.ownerDocument.createElement("div");b.style.position="absolute";b.style.top=a.j+"px";b.style.right=a.H+"px";b.style.bottom=a.w+"px";b.style.left=a.h+"px";a.d.appendChild(b);var c=b.getBoundingClientRect();a.d.removeChild(b);var b=a.B+a.left+yj(a),d=a.F+a.top+wj(a);a.f=new Ud(b,d,b+a.width,d+a.height);a.Oc=c?a.b?c.top:c.left:0;a.Ja=c?a.b?c.right:c.top:0;a.gb=c?a.b?c.left:c.bottom:0;a.lc=a.Ja;a.mc=a.Ja;a.la=a.gb;c=a.f;b=a.B+a.left+yj(a);d=a.F+a.top+wj(a);b=a.Lb?be(a.Lb,b,d):
de(b,d,b+a.width,d+a.height);a.kc=ne(c,[b],a.A,a.fb,a.b);vk(a);a.g=null}function Dk(a){a.ib=[];u(a.d,"width",a.width+"px");u(a.d,"height",a.height+"px");Ek(a);a.e=0;a.Nc=!1;a.P=null}function Mk(a,b){a.e=Math.max((a.b?-1:1)*(b-a.Ja),a.e)}function bl(a,b){var c=b.b;if(!c)return O(!0);var d=M("layoutOverflownFootnotes"),e=0;Qe(function(){for(;e<c.length;){var b=c[e++],b=Bk(a,0,b,a.Ja);if(b.ua())return b}return O(!1)}).then(function(){Q(d,!0)});return P(d)}
function Ik(a,b){a.ib.push(b);if(a.Nc)return O(b);var c=M("layout");bl(a,b).then(function(){jk(a,b.La).then(function(b){var e=b,f=!0;a.u=[];Re(function(c){for(;b;){var h=!0;al(a,b,f).then(function(k){f=!1;b=k;a.P?R(c):b&&b.overflow?Vk(a,b,e).then(function(a){b=a;R(c)}):h?h=!1:Te(c)});if(h){h=!1;return}}R(c)}).then(function(){var e=a.l;e&&(a.d.appendChild(e.d),a.b?a.e=this.Ja-this.gb:a.e=e.top+wj(e)+e.e+xj(e));if(b){a.Nc=!0;var f=e=b,k=[];do f.e&&f.parent&&f.parent.e!==f.e||k.push(qj(f)),f=f.parent;
while(f);e=new rj({ja:k,aa:e.aa,I:e.I});if(a.g){f=[];for(k=0;k<a.g.length;k++){var l=a.g[k].b;l&&f.push(l)}e.b=f.length?f:null}Q(c,e)}else Q(c,null)})})});return P(c)}function Fk(a){for(var b=a.ib;a.d.lastChild!=a.Mc;)a.d.removeChild(a.d.lastChild);uk(a);Dk(a);var c=M("redoLayout"),d=0,e=null;Re(function(c){if(d<b.length){var g=b[d++];Ik(a,g).then(function(a){a?(e=a,R(c)):Te(c)})}else R(c)}).then(function(){Q(c,e)});return P(c)};var cl=1;function dl(a,b,c,d,e){this.b={};this.children=[];this.e=null;this.h=0;this.d=a;this.name=b;this.Za=c;this.ta=d;this.parent=e;this.g="p"+cl++;e&&(this.h=e.children.length,e.children.push(this))}dl.prototype.f=function(){throw Error("E_UNEXPECTED_CALL");};dl.prototype.clone=function(){throw Error("E_UNEXPECTED_CALL");};function el(a,b){var c=a.b,d=b.b,e;for(e in c)Object.prototype.hasOwnProperty.call(c,e)&&(d[e]=c[e])}
function fl(a,b){for(var c=0;c<a.children.length;c++)a.children[c].clone({parent:b})}function gl(a){dl.call(this,a,null,null,[],null);this.b.width=new V(Od,0);this.b.height=new V(Pd,0)}t(gl,dl);
function hl(a,b){this.e=b;var c=this;Yb.call(this,a,function(a,b){var f=a.match(/^([^.]+)\.([^.]+)$/);if(f){var g=c.e.k[f[1]];if(g&&(g=this.ba[g])){if(b){var f=f[2],h=g.ba[f];if(h)g=h;else{switch(f){case "columns":var h=g.d.d,k=new Nc(h,0),l=il(g,"column-count"),n=il(g,"column-width"),p=il(g,"column-gap"),h=F(h,Pc(h,new Kc(h,"min",[k,l]),E(h,n,p)),p)}h&&(g.ba[f]=h);g=h}}else g=il(g,f[2]);return g}}return null})}t(hl,Yb);
function jl(a,b,c,d,e,f,g){a=a instanceof hl?a:new hl(a,this);dl.call(this,a,b,c,d,e);this.e=this;this.G=f;this.j=g;this.b.width=new V(Od,0);this.b.height=new V(Pd,0);this.b["wrap-flow"]=new V(kd,0);this.b.position=new V(Bd,0);this.b.overflow=new V(rd,0);this.k={}}t(jl,dl);jl.prototype.f=function(a){return new kl(a,this)};jl.prototype.clone=function(a){a=new jl(this.d,this.name,a.Za||this.Za,this.ta,this.parent,this.G,this.j);el(this,a);fl(this,a);return a};
function ll(a,b,c,d,e){dl.call(this,a,b,c,d,e);this.e=e.e;b&&(this.e.k[b]=this.g);this.b["wrap-flow"]=new V(kd,0)}t(ll,dl);ll.prototype.f=function(a){return new ml(a,this)};ll.prototype.clone=function(a){a=new ll(a.parent.d,this.name,this.Za,this.ta,a.parent);el(this,a);fl(this,a);return a};function nl(a,b,c,d,e){dl.call(this,a,b,c,d,e);this.e=e.e;b&&(this.e.k[b]=this.g)}t(nl,dl);nl.prototype.f=function(a){return new ol(a,this)};
nl.prototype.clone=function(a){a=new nl(a.parent.d,this.name,this.Za,this.ta,a.parent);el(this,a);fl(this,a);return a};function X(a,b,c){return b&&b!==kd?b.da(a,c):null}function pl(a,b,c){return b&&b!==kd?b.da(a,c):a.b}function ql(a,b,c){return b?b===kd?null:b.da(a,c):a.b}function rl(a,b,c,d){return b&&c!==xd?b.da(a,d):a.b}function sl(a,b,c){return b?b===Md?a.g:b===pd?a.f:b.da(a,a.b):c}
function tl(a,b){this.e=a;this.d=b;this.B={};this.style={};this.k=this.l=null;this.children=[];this.F=this.H=this.f=this.g=!1;this.w=this.A=0;this.u=null;this.la={};this.ba={};this.va=this.b=!1;a&&a.children.push(this)}function ul(a,b,c){b=il(a,b);c=il(a,c);if(!b||!c)throw Error("E_INTERNAL");return E(a.d.d,b,c)}
function il(a,b){var c=a.la[b];if(c)return c;var d=a.style[b];d&&(c=d.da(a.d.d,a.d.d.b));switch(b){case "margin-left-edge":c=il(a,"left");break;case "margin-top-edge":c=il(a,"top");break;case "margin-right-edge":c=ul(a,"border-right-edge","margin-right");break;case "margin-bottom-edge":c=ul(a,"border-bottom-edge","margin-bottom");break;case "border-left-edge":c=ul(a,"margin-left-edge","margin-left");break;case "border-top-edge":c=ul(a,"margin-top-edge","margin-top");break;case "border-right-edge":c=
ul(a,"padding-right-edge","border-right-width");break;case "border-bottom-edge":c=ul(a,"padding-bottom-edge","border-bottom-width");break;case "padding-left-edge":c=ul(a,"border-left-edge","border-left-width");break;case "padding-top-edge":c=ul(a,"border-top-edge","border-top-width");break;case "padding-right-edge":c=ul(a,"right-edge","padding-right");break;case "padding-bottom-edge":c=ul(a,"bottom-edge","padding-bottom");break;case "left-edge":c=ul(a,"padding-left-edge","padding-left");break;case "top-edge":c=
ul(a,"padding-top-edge","padding-top");break;case "right-edge":c=ul(a,"left-edge","width");break;case "bottom-edge":c=ul(a,"top-edge","height")}if(!c){if("extent"==b)d=a.b?"width":"height";else if("measure"==b)d=a.b?"height":"width";else{var e=a.b?Sg:Tg,d=b,f;for(f in e)d=d.replace(f,e[f])}d!=b&&(c=il(a,d))}c&&(a.la[b]=c);return c}
function vl(a){var b=a.d.d,c=a.style,d=sl(b,c.enabled,b.g),e=X(b,c.page,b.b);if(e)var f=new Ic(b,"page-number"),d=Oc(b,d,new Ac(b,e,f));(e=X(b,c["min-page-width"],b.b))&&(d=Oc(b,d,new zc(b,new Ic(b,"page-width"),e)));(e=X(b,c["min-page-height"],b.b))&&(d=Oc(b,d,new zc(b,new Ic(b,"page-height"),e)));d=a.P(d);c.enabled=new L(d)}tl.prototype.P=function(a){return a};
tl.prototype.yc=function(){var a=this.d.d,b=this.style,c=this.e?this.e.style.width.da(a,null):null,d=X(a,b.left,c),e=X(a,b["margin-left"],c),f=rl(a,b["border-left-width"],b["border-left-style"],c),g=pl(a,b["padding-left"],c),h=X(a,b.width,c),k=X(a,b["max-width"],c),l=pl(a,b["padding-right"],c),n=rl(a,b["border-right-width"],b["border-right-style"],c),p=X(a,b["margin-right"],c),r=X(a,b.right,c),q=E(a,f,g),y=E(a,f,l);d&&r&&h?(q=F(a,c,E(a,h,E(a,E(a,d,q),y))),e?p?r=F(a,q,p):p=F(a,q,E(a,r,e)):(q=F(a,q,
r),p?e=F(a,q,p):p=e=Pc(a,q,new Zb(a,.5)))):(e||(e=a.b),p||(p=a.b),d||r||h||(d=a.b),d||h?d||r?h||r||(h=this.l,this.g=!0):d=a.b:(h=this.l,this.g=!0),q=F(a,c,E(a,E(a,e,q),E(a,p,y))),this.g&&(k||(k=F(a,q,d?d:r)),this.b||!X(a,b["column-width"],null)&&!X(a,b["column-count"],null)||(h=k,this.g=!1)),d?h?r||(r=F(a,q,E(a,d,h))):h=F(a,q,E(a,d,r)):d=F(a,q,E(a,r,h)));a=pl(a,b["snap-width"]||(this.e?this.e.style["snap-width"]:null),c);b.left=new L(d);b["margin-left"]=new L(e);b["border-left-width"]=new L(f);b["padding-left"]=
new L(g);b.width=new L(h);b["max-width"]=new L(k?k:h);b["padding-right"]=new L(l);b["border-right-width"]=new L(n);b["margin-right"]=new L(p);b.right=new L(r);b["snap-width"]=new L(a)};
tl.prototype.zc=function(){var a=this.d.d,b=this.style,c=this.e?this.e.style.width.da(a,null):null,d=this.e?this.e.style.height.da(a,null):null,e=X(a,b.top,d),f=X(a,b["margin-top"],c),g=rl(a,b["border-top-width"],b["border-top-style"],c),h=pl(a,b["padding-top"],c),k=X(a,b.height,d),l=X(a,b["max-height"],d),n=pl(a,b["padding-bottom"],c),p=rl(a,b["border-bottom-width"],b["border-bottom-style"],c),r=X(a,b["margin-bottom"],c),q=X(a,b.bottom,d),y=E(a,g,h),x=E(a,p,n);e&&q&&k?(d=F(a,d,E(a,k,E(a,E(a,e,y),
x))),f?r?q=F(a,d,f):r=F(a,d,E(a,q,f)):(d=F(a,d,q),r?f=F(a,d,r):r=f=Pc(a,d,new Zb(a,.5)))):(f||(f=a.b),r||(r=a.b),e||q||k||(e=a.b),e||k?e||q?k||q||(k=this.k,this.f=!0):e=a.b:(k=this.k,this.f=!0),d=F(a,d,E(a,E(a,f,y),E(a,r,x))),this.f&&(l||(l=F(a,d,e?e:q)),this.b&&(X(a,b["column-width"],null)||X(a,b["column-count"],null))&&(k=l,this.f=!1)),e?k?q||(q=F(a,d,E(a,e,k))):k=F(a,d,E(a,q,e)):e=F(a,d,E(a,q,k)));a=pl(a,b["snap-height"]||(this.e?this.e.style["snap-height"]:null),c);b.top=new L(e);b["margin-top"]=
new L(f);b["border-top-width"]=new L(g);b["padding-top"]=new L(h);b.height=new L(k);b["max-height"]=new L(l?l:k);b["padding-bottom"]=new L(n);b["border-bottom-width"]=new L(p);b["margin-bottom"]=new L(r);b.bottom=new L(q);b["snap-height"]=new L(a)};
function wl(a){var b=a.d.d,c=a.style;a=X(b,c[a.b?"height":"width"],null);var d=X(b,c["column-width"],a),e=X(b,c["column-count"],null),f;(f=(f=c["column-gap"])&&f!==yd?f.da(b,null):null)||(f=new Hc(b,1,"em"));d&&!e&&(e=new Kc(b,"floor",[Qc(b,E(b,a,f),E(b,d,f))]),e=new Kc(b,"max",[b.d,e]));e||(e=b.d);d=F(b,Qc(b,E(b,a,f),e),f);c["column-width"]=new L(d);c["column-count"]=new L(e);c["column-gap"]=new L(f)}function xl(a,b,c,d){a=a.style[b].da(a.d.d,null);return kc(a,c,d,{})}
function yl(a,b){b.ba[a.d.g]=a;var c=a.d.d,d=a.style,e=a.e?zl(a.e,b):null,e=ni(a.B,b,e,!1);a.b=mi(e,b,a.e?a.e.b:!1);oi(e,d,a.b,function(a,b){return b.value});a.l=new ac(c,function(){return a.A},"autoWidth");a.k=new ac(c,function(){return a.w},"autoHeight");a.yc();a.zc();wl(a);vl(a)}function Al(a,b,c){(a=a.style[c])&&(a=Kf(b,a,c));return a}function Y(a,b,c){(a=a.style[c])&&(a=Kf(b,a,c));return hd(a,b)}
function zl(a,b){var c;a:{if(c=a.B["region-id"]){for(var d=[],e=0;e<c.length;e++){var f=c[e].evaluate(b,"");f&&f!==G&&d.push(f)}if(d.length){c=d;break a}}c=null}if(c){d=[];for(e=0;e<c.length;e++)d[e]=c[e].toString();return d}return null}function Bl(a,b,c,d){(a=Al(a,b,d))&&u(c.d,d,a.toString())}
function Cl(a,b,c){var d=Y(a,b,"left"),e=Y(a,b,"margin-left"),f=Y(a,b,"padding-left"),g=Y(a,b,"border-left-width");a=Y(a,b,"width");Cj(c,d,a);u(c.d,"margin-left",e+"px");u(c.d,"padding-left",f+"px");u(c.d,"border-left-width",g+"px");c.marginLeft=e;c.Y=g;c.h=f}
function Dl(a,b,c){var d=Y(a,b,"right"),e=Y(a,b,"snap-height"),f=Y(a,b,"margin-right"),g=Y(a,b,"padding-right");b=Y(a,b,"border-right-width");u(c.d,"margin-right",f+"px");u(c.d,"padding-right",g+"px");u(c.d,"border-right-width",b+"px");c.marginRight=f;c.Oa=b;a.b&&0<e&&(a=d+zj(c),a=a-Math.floor(a/e)*e,0<a&&(c.Mb=e-a,g+=c.Mb));c.H=g;c.Nb=e}
function El(a,b,c){var d=Y(a,b,"snap-height"),e=Y(a,b,"top"),f=Y(a,b,"margin-top"),g=Y(a,b,"padding-top");b=Y(a,b,"border-top-width");c.top=e;c.marginTop=f;c.ba=b;c.fb=d;!a.b&&0<d&&(a=e+wj(c),a=a-Math.floor(a/d)*d,0<a&&(c.ra=d-a,g+=c.ra));c.j=g;u(c.d,"top",e+"px");u(c.d,"margin-top",f+"px");u(c.d,"padding-top",g+"px");u(c.d,"border-top-width",b+"px")}
function Fl(a,b,c){var d=Y(a,b,"margin-bottom"),e=Y(a,b,"padding-bottom"),f=Y(a,b,"border-bottom-width");a=Y(a,b,"height")-c.ra;u(c.d,"height",a+"px");u(c.d,"margin-bottom",d+"px");u(c.d,"padding-bottom",e+"px");u(c.d,"border-bottom-width",f+"px");c.height=a-c.ra;c.marginBottom=d;c.va=f;c.w=e}function Gl(a,b,c){a.b?(El(a,b,c),Fl(a,b,c)):(Dl(a,b,c),Cl(a,b,c))}
function Hl(a,b,c){u(c.d,"border-top-width","0px");var d=Y(a,b,"max-height");a.H?Bj(c,0,d):(El(a,b,c),d-=c.ra,c.height=d,u(c.d,"height",d+"px"))}function Il(a,b,c){u(c.d,"border-left-width","0px");var d=Y(a,b,"max-width");a.F?Cj(c,0,d):(Dl(a,b,c),d-=c.Mb,c.width=d,a=Y(a,b,"right"),u(c.d,"right",a+"px"),u(c.d,"width",d+"px"))}
var Jl="border-left-style border-right-style border-top-style border-bottom-style border-left-color border-right-color border-top-color border-bottom-color outline-style outline-color outline-width overflow visibility".split(" "),Kl="border-top-left-radius border-top-right-radius border-bottom-right-radius border-bottom-left-radius border-image-source border-image-slice border-image-width border-image-outset border-image-repeat background-attachment background-color background-image background-repeat background-position background-clip background-origin background-size opacity z-index".split(" "),
Ll="color font-family font-size font-style font-weight font-variant line-height letter-spacing text-align text-decoration text-indent text-transform white-space word-spacing".split(" "),Ml=["transform","transform-origin"];
tl.prototype.Wb=function(a,b){this.e&&this.b==this.e.b||u(b.d,"writing-mode",this.b?"vertical-rl":"horizontal-tb");(this.b?this.g:this.f)?this.b?Il(this,a,b):Hl(this,a,b):(this.b?Dl(this,a,b):El(this,a,b),this.b?Cl(this,a,b):Fl(this,a,b));(this.b?this.f:this.g)?this.b?Hl(this,a,b):Il(this,a,b):Gl(this,a,b);for(var c=0;c<Jl.length;c++)Bl(this,a,b,Jl[c])};function Nl(a,b,c){for(var d=0;d<Ll.length;d++)Bl(a,b,c,Ll[d])}
tl.prototype.Sb=function(a,b,c,d,e){this.b?this.A=b.e+b.Mb:this.w=b.e+b.ra;var f=(this.b||!d)&&this.f,g=(!this.b||!d)&&this.g,h=null;if(g||f)g&&u(b.d,"width","auto"),f&&u(b.d,"height","auto"),h=(d?d.d:b.d).getBoundingClientRect(),g&&(this.A=Math.ceil(h.right-h.left-b.h-b.Y-b.H-b.Oa),this.b&&(this.A+=b.Mb)),f&&(this.w=h.bottom-h.top-b.j-b.ba-b.w-b.va,this.b||(this.w+=b.ra));(this.b?this.f:this.g)&&Gl(this,a,b);if(this.b?this.g:this.f){if(this.b?this.F:this.H)this.b?Dl(this,a,b):El(this,a,b);this.b?
Cl(this,a,b):Fl(this,a,b)}if(1<e&&(f=Y(this,a,"column-rule-width"),g=Al(this,a,"column-rule-style"),h=Al(this,a,"column-rule-color"),0<f&&g&&g!=xd&&h!=Id)){var k=Y(this,a,"column-gap"),l=this.b?b.height:b.width,n=this.b?"border-top":"border-left";for(d=1;d<e;d++){var p=(l+k)*d/e-k/2+b.h-f/2,r=b.height+b.j+b.w,q=b.d.ownerDocument.createElement("div");u(q,"position","absolute");u(q,this.b?"left":"top","0px");u(q,this.b?"top":"left",p+"px");u(q,this.b?"height":"width","0px");u(q,this.b?"width":"height",
r+"px");u(q,n,f+"px "+g.toString()+(h?" "+h.toString():""));b.d.insertBefore(q,b.d.firstChild)}}for(d=0;d<Kl.length;d++)Bl(this,a,b,Kl[d]);for(d=0;d<Ml.length;d++)e=b,f=Ml[d],g=c.g,(h=Al(this,a,f))&&g.push(new Yi(e.d,f,h))};
tl.prototype.h=function(a,b){var c=this.B,d=this.d.b,e;for(e in d)Xg(e)&&Yg(c,e,d[e]);if("background-host"==this.d.Za)for(e in b)if(e.match(/^background-/)||"writing-mode"==e)c[e]=b[e];if("layout-host"==this.d.Za)for(e in b)e.match(/^background-/)||"writing-mode"==e||(c[e]=b[e]);Yh(a,this.d.ta,null,c);yl(this,a.d);for(c=0;c<this.d.children.length;c++)this.d.children[c].f(this).h(a,b);a.pop()};
function Ol(a,b){a.g&&(a.F=xl(a,"right",a.l,b)||xl(a,"margin-right",a.l,b)||xl(a,"border-right-width",a.l,b)||xl(a,"padding-right",a.l,b));a.f&&(a.H=xl(a,"top",a.k,b)||xl(a,"margin-top",a.k,b)||xl(a,"border-top-width",a.k,b)||xl(a,"padding-top",a.k,b));for(var c=0;c<a.children.length;c++)Ol(a.children[c],b)}function Pl(a){tl.call(this,null,a)}t(Pl,tl);Pl.prototype.h=function(a,b){tl.prototype.h.call(this,a,b);this.children.sort(function(a,b){return b.d.j-a.d.j||a.d.h-b.d.h})};
function kl(a,b){tl.call(this,a,b);this.u=this}t(kl,tl);kl.prototype.P=function(a){var b=this.d.e;b.G&&(a=Oc(b.d,a,b.G));return a};kl.prototype.Y=function(){};function ml(a,b){tl.call(this,a,b);this.u=a.u}t(ml,tl);function ol(a,b){tl.call(this,a,b);this.u=a.u}t(ol,tl);function Ql(a,b,c,d){var e=null;c instanceof bd&&(e=[c]);c instanceof Vc&&(e=c.values);if(e)for(a=a.d.d,c=0;c<e.length;c++)if(e[c]instanceof bd){var f=Wb(e[c].name,"enabled"),f=new Ic(a,f);d&&(f=new qc(a,f));b=Oc(a,b,f)}return b}
ol.prototype.P=function(a){var b=this.d.d,c=this.style,d=sl(b,c.required,b.f)!==b.f;if(d||this.f){var e;e=(e=c["flow-from"])?e.da(b,b.b):new Zb(b,"body");e=new Kc(b,"has-content",[e]);a=Oc(b,a,e)}a=Ql(this,a,c["required-partitions"],!1);a=Ql(this,a,c["conflicting-partitions"],!0);d&&(c=(c=this.u.style.enabled)?c.da(b,null):b.g,c=Oc(b,c,a),this.u.style.enabled=new L(c));return a};ol.prototype.Wb=function(a,b,c){u(b.d,"overflow","hidden");tl.prototype.Wb.call(this,a,b,c)};
function Rl(a,b,c,d){hf.call(this,a,b,!1);this.target=c;this.b=d}t(Rl,jf);Rl.prototype.Ea=function(a,b,c){Hg(this.b,a,b,c,this)};Rl.prototype.gc=function(a,b){kf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};Rl.prototype.yb=function(a,b){kf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};Rl.prototype.$a=function(a,b,c){this.target.b[a]=new V(b,c?50331648:67108864)};function Sl(a,b,c,d){Rl.call(this,a,b,c,d)}t(Sl,Rl);
function Tl(a,b,c,d){Rl.call(this,a,b,c,d);c.b.width=new V(Nd,0);c.b.height=new V(Nd,0)}t(Tl,Rl);Tl.prototype.Hb=function(a,b,c){a=new nl(this.e,a,b,c,this.target);gf(this.Z,new Sl(this.e,this.Z,a,this.b))};Tl.prototype.Gb=function(a,b,c){a=new ll(this.e,a,b,c,this.target);a=new Tl(this.e,this.Z,a,this.b);gf(this.Z,a)};function Ul(a,b,c,d){Rl.call(this,a,b,c,d)}t(Ul,Rl);Ul.prototype.Hb=function(a,b,c){a=new nl(this.e,a,b,c,this.target);gf(this.Z,new Sl(this.e,this.Z,a,this.b))};
Ul.prototype.Gb=function(a,b,c){a=new ll(this.e,a,b,c,this.target);a=new Tl(this.e,this.Z,a,this.b);gf(this.Z,a)};var Vl={"text-indent":"0px","margin-top":"0px","padding-top":"0px","border-top-width":"0px","border-top-style":"none","border-top-color":"transparent"},Wl={"text-indent":"0px","margin-right":"0px","padding-right":"0px","border-right-width":"0px","border-right-style":"none","border-right-color":"transparent"},Xl={};
function Yl(a){a.addEventListener("load",function(){a.contentWindow.navigator.epubReadingSystem={name:"adapt",version:"0.1",layoutStyle:"paginated",hasFeature:function(a){switch(a){case "mouse-events":return!0}return!1}}},!1)}var Zl=(new DOMParser).parseFromString('<root xmlns="http://www.pyroxy.com/ns/shadow"/>',"text/xml"),$l="footnote-marker first-5-lines first-4-lines first-3-lines first-2-lines first-line first-letter before  after".split(" ");
function am(a,b,c,d){this.style=b;this.f=a;this.b=c;this.d=d;this.e={}}
am.prototype.g=function(a){var b=a.getAttribute("class")||"";this.b&&b&&b.match(/after$/)&&(this.style=this.b.g(this.f,!0),this.b=null);var c=this.style._pseudos[b]||{};if(!this.e[b]){this.e[b]=!0;var d=c.content;d&&(d=d.evaluate(this.d),Ej(d)&&d.M(new Dj(a,this.d)))}if(b.match(/^first-/)&&!c["x-first-pseudo"]){a=1;var e;"first-letter"==b?a=0:null!=(e=b.match(/^first-([0-9]+)-lines$/))&&(a=e[1]-0);c["x-first-pseudo"]=new V(new dd(a),0)}return c};
function bm(a,b,c,d,e,f,g,h,k,l,n,p){this.w=a;this.f=b;this.viewport=c;this.l=c.b;this.j=d;this.B=e;this.X=f;this.A=g;this.k=h;this.F=k;this.d=l;this.g=n;this.u=p;this.H=this.b=null;this.h=!1;this.T=null;this.aa=0;this.e=null}bm.prototype.clone=function(){return new bm(this.w,this.f,this.viewport,this.j,this.B,this.X,this.A,this.k,this.F,this.d,this.g,this.u)};
function cm(a,b,c,d,e,f){var g=M("createRefShadow");a.X.j.load(b).then(function(h){if(h){var k=Hi(h,b);if(k){var l=a.F,n=l.B[h.url];n||(n=l.style.h.b[h.url],n=new Mj(h,n.d,n.g,new ec(0,l.k(),l.j(),l.fontSize),l.e,n.j,l.w),l.B[h.url]=n);f=new kj(d,k,h,e,f,c,n)}}Q(g,f)});return P(g)}
function dm(a,b,c,d,e,f,g,h){var k=M("createShadows"),l=e.template,n;l instanceof fd?n=cm(a,l.url,2,b,h,null):n=O(null);n.then(function(l){var n=null;if("http://www.pyroxy.com/ns/shadow"==b.namespaceURI&&"include"==b.localName){var q=b.getAttribute("href"),y=null;q?y=h?h.X:a.X:h&&(q="http://www.w3.org/1999/xhtml"==h.Z.namespaceURI?h.Z.getAttribute("href"):h.Z.getAttributeNS("http://www.w3.org/1999/xlink","href"),y=h.Fc?h.Fc.X:a.X);q&&(q=ea(q,y.url),n=cm(a,q,3,b,h,l))}null==n&&(n=O(l));n.then(function(l){var n;
if(n=d._pseudos){for(var p=Zl.createElementNS("http://www.pyroxy.com/ns/shadow","root"),q=p,r=0;r<$l.length;r++){var y=$l[r],Wa;if(y){if(!n[y])continue;if(!("footnote-marker"!=y||c&&a.h))continue;if(y.match(/^first-/)&&(Wa=e.display,!Wa||Wa===td))continue;Wa=Zl.createElementNS("http://www.w3.org/1999/xhtml","span");Wa.setAttribute("class",y)}else Wa=Zl.createElementNS("http://www.pyroxy.com/ns/shadow","content");q.appendChild(Wa);y.match(/^first-/)&&(q=Wa)}l=new kj(b,p,null,h,l,2,new am(b,d,f,g))}Q(k,
l)})});return P(k)}function kk(a,b,c){a.H=b;a.h=c}function em(a,b,c,d){var e=a.f;c=ni(c,e,a.B,a.h);b=mi(c,e,b);oi(c,d,b,function(b,c){var d=c.evaluate(e,b);if("font-family"==b){var k=a.A;if(d instanceof Vc){for(var d=d.values,l=[],n=0;n<d.length;n++){var p=d[n],r=k.b[p.stringValue()];r&&l.push(H(r));l.push(p)}d=new Vc(l)}else d=(k=k.b[d.stringValue()])?new Vc([H(k),d]):d}return d});return b}
function fm(a,b){for(var c=a.b.T,d=[],e=a.b.ea;c&&1==c.nodeType;){var f=e&&e.root==c;if(!f||2==e.type){var g=(e?e.b:a.j).g(c,!1);d.push(g)}f?(c=e.Z,e=e.Fc):c=c.parentNode}c={"font-size":new V(new K(gc(a.f,"em"),"px"),0)};e=new bh(c,a.f);for(f=d.length-1;0<=f;--f){var g=d[f],h=[],k;for(k in g)Jg[k]&&h.push(k);h.sort(Td);for(var l=0;l<h.length;l++){var n=h[l];e.b=n;c[n]=g[n].tc(e)}}for(var p in b)Jg[p]||(c[p]=b[p]);return c}
var gm={a:"a",sub:"sub",sup:"sup",table:"table",tr:"tr",td:"td",th:"th",code:"code",body:"div",p:"p",v:"p",date:"p",emphasis:"em",strong:"strong",style:"span",strikethrough:"del"};function hm(a,b){b=ea(b,a.X.url);return a.u[b]||b}
function im(a,b){var c=!0,d=M("createElementView"),e=a.T,f=a.b.ea?a.b.ea.b:a.j,g=f.g(e,!1),h={};a.b.parent||(g=fm(a,g));a.b.f=em(a,a.b.f,g,h);var k=h["flow-into"];if(k&&k.toString()!=a.w)return Q(d,!1),P(d);var l=h.display;if(l===xd)return Q(d,!1),P(d);dm(a,e,null==a.b.parent,g,h,f,a.f,a.b.ea).then(function(f){a.b.qa=f;var g=a.b.parent&&a.b.parent.j;f=h["float"];var k=h.clear;if(h.position===id||h.position===Bd)a.b.j=!0,f=null;g&&(k=null,f!==qd&&(f=null));g=f===vd||f===Cd||f===qd;f&&(delete h["float"],
f===qd&&(a.h?(g=!1,h.display=md):h.display=td),a.b.j=!0);k&&(k===sd&&a.b.parent&&a.b.parent.u&&(k=H(a.b.parent.u)),k===vd||k===Cd||k===nd)&&(delete h.clear,h.display&&h.display!=td&&(a.b.u=k.toString()));h.overflow===rd&&(a.b.j=!0);var q=l===wd&&h["ua-list-item-count"];g||l===Gd||h["break-inside"]===ld||h["page-break-inside"]===ld?a.b.g++:l===Hd&&(a.b.g+=10);a.b.d=!g&&!l||l===td;a.b.h=g?f.toString():null;if(!a.b.d){if(f=h["break-after"]||h["page-break-after"])a.b.A=f.toString();if(f=h["break-before"]||
h["page-break-before"])a.b.l=f.toString()}if(f=h["x-first-pseudo"])a.b.e=new lj(a.b.parent?a.b.parent.e:null,f.C);if(f=h["white-space"])switch(f.toString()){case "normal":case "nowrap":a.b.w=0;break;case "pre-line":a.b.w=1;break;case "pre":case "pre-wrap":a.b.w=2}var y=!1,x=null,I=[],J=e.namespaceURI,C=e.localName;if("http://www.w3.org/1999/xhtml"==J)"html"==C||"body"==C||"script"==C||"link"==C||"meta"==C?C="div":"vide_"==C?C="video":"audi_"==C?C="audio":"object"==C&&(y=!!a.g);else if("http://www.idpf.org/2007/ops"==
J)C="span",J="http://www.w3.org/1999/xhtml";else if("http://www.gribuser.ru/xml/fictionbook/2.0"==J){J="http://www.w3.org/1999/xhtml";if("image"==C){if(C="div",(f=e.getAttributeNS("http://www.w3.org/1999/xlink","href"))&&"#"==f.charAt(0)&&(f=Hi(a.X,f)))x=a.createElement(J,"img"),f="data:"+(f.getAttribute("content-type")||"image/jpeg")+";base64,"+f.textContent.replace(/[ \t\n\t]/g,""),I.push(Wf(x,f))}else C=gm[C];C||(C=a.b.d?"span":"div")}else if("http://www.daisy.org/z3986/2005/ncx/"==J)if(J="http://www.w3.org/1999/xhtml",
"ncx"==C||"navPoint"==C)C="div";else if("navLabel"==C){if(C="span",k=e.parentNode){f=null;for(k=k.firstChild;k;k=k.nextSibling)if(1==k.nodeType&&(g=k,"http://www.daisy.org/z3986/2005/ncx/"==g.namespaceURI&&"content"==g.localName)){f=g.getAttribute("src");break}f&&(C="a",e=e.ownerDocument.createElementNS(J,"a"),e.setAttribute("href",f))}}else C="span";else"http://www.pyroxy.com/ns/shadow"==J?(J="http://www.w3.org/1999/xhtml",C=a.b.d?"span":"div"):y=!!a.g;q?b?C="li":(C="div",l=md,h.display=l):"body"==
C||"li"==C?C="div":"q"==C?C="span":"a"==C&&(f=h["hyperlink-processing"])&&"normal"!=f.toString()&&(C="span");h.behavior&&"none"!=h.behavior.toString()&&a.g&&(y=!0);var N;y?N=a.g(e,a.b.parent?a.b.parent.b:null,h):N=O(null);N.then(function(f){f?y&&(c="true"==f.getAttribute("data-adapt-process-children")):f=a.createElement(J,C);"a"==C&&f.addEventListener("click",a.d.u,!1);x&&(Kk(a,a.b,"inner",x),f.appendChild(x));"iframe"==f.localName&&"http://www.w3.org/1999/xhtml"==f.namespaceURI&&Yl(f);if("http://www.gribuser.ru/xml/fictionbook/2.0"!=
e.namespaceURI||"td"==C){for(var g=e.attributes,k=g.length,l=null,n=0;n<k;n++){var p=g[n],r=p.namespaceURI,N=p.localName,p=p.nodeValue;if(r)if("http://www.w3.org/2000/xmlns/"==r)continue;else"http://www.w3.org/1999/xlink"==r&&"href"==N&&(p=hm(a,p));else{if(N.match(/^on/))continue;if("style"==N)continue;if("id"==N){dj(a.d,f,p);continue}if("src"==N||"href"==N||"poster"==N)p=hm(a,p)}if(r){var Gk=Xl[r];Gk&&(N=Gk+":"+N)}"src"!=N||r||"img"!=C||"http://www.w3.org/1999/xhtml"!=J?"href"==N&&"image"==C&&"http://www.w3.org/2000/svg"==
J&&"http://www.w3.org/1999/xlink"==r?a.d.e.push(Wf(f,p)):r?f.setAttributeNS(r,N,p):f.setAttribute(N,p):l=p}l&&(g=Wf(f,l),h.width&&h.height?a.d.e.push(g):I.push(g))}delete h.content;(g=h["list-style-image"])&&g instanceof fd&&(g=g.url,I.push(Wf(new Image,g)));jm(a,f,h);g=h.widows;k=h.orphans;if(g||k){if(a.b.parent){a.b.k={};for(var Rd in a.b.parent.k)a.b.k[Rd]=a.b.parent.k[Rd]}g instanceof dd&&(a.b.k.widows=g.C);k instanceof dd&&(a.b.k.orphans=k.C)}if(!b&&!a.b.d){Rd=a.b.f?Wl:Vl;for(var Hk in Rd)u(f,
Hk,Rd[Hk])}q&&f.setAttribute("value",h["ua-list-item-count"].stringValue());a.e=f;I.length?Vf(I).then(function(){Q(d,c)}):Pe().then(function(){Q(d,c)})})});return P(d)}function km(a,b){var c=M("createNodeView"),d,e=!0;1==a.T.nodeType?d=im(a,b):(8==a.T.nodeType?a.e=null:a.e=document.createTextNode(a.T.textContent.substr(a.aa||0)),d=O(!0));d.then(function(b){e=b;(a.b.b=a.e)&&(b=a.b.parent?a.b.parent.b:a.H)&&b.appendChild(a.e);Q(c,e)});return P(c)}
function lk(a,b,c){(a.b=b)?(a.T=b.T,a.aa=b.aa):(a.T=null,a.aa=-1);a.e=null;return a.b?km(a,c):O(!0)}function lm(a){if(null==a.ea||"content"!=a.T.localName||"http://www.pyroxy.com/ns/shadow"!=a.T.namespaceURI)return a;var b=a.$,c=a.ea,d=a.parent,e,f;c.Yc?(f=c.Yc,e=c.root,c=c.type,2==c&&(e=e.firstChild)):(f=c.Fc,e=c.Z.firstChild,c=2);var g=a.T.nextSibling;g?(a.T=g,nj(a)):a.ia?a=a.ia:e?a=null:(a=a.parent.modify(),a.I=!0);if(e)return b=new mj(e,d,b),b.ea=f,b.Fa=c,b.ia=a,b;a.$=b;return a}
function mm(a){var b=a.$+1;if(a.I){if(!a.parent)return null;if(3!=a.Fa){var c=a.T.nextSibling;if(c)return a=a.modify(),a.$=b,a.T=c,nj(a),lm(a)}if(a.ia)return a=a.ia.modify(),a.$=b,a;a=a.parent.modify()}else{if(a.qa&&(c=a.qa.root,2==a.qa.type&&(c=c.firstChild),c))return b=new mj(c,a,b),b.ea=a.qa,b.Fa=a.qa.type,lm(b);if(c=a.T.firstChild)return lm(new mj(c,a,b));1!=a.T.nodeType&&(b+=a.T.textContent.length-1-a.aa);a=a.modify()}a.$=b;a.I=!0;return a}
function qk(a,b){b=mm(b);if(!b||b.I)return O(b);var c=M("nextInTree");lk(a,b,!0).then(function(a){b.b&&a||(b=b.modify(),b.I=!0,b.b||(b.d=!0));Q(c,b)});return P(c)}function nm(a,b){if(b instanceof Vc)for(var c=b.values,d=0;d<c.length;d++)nm(a,c[d]);else b instanceof fd&&(c=b.url,a.d.e.push(Wf(new Image,c)))}function jm(a,b,c){var d=c["background-image"];d&&nm(a,d);for(var e in c)d=c[e],!Xi[e]||"position"==e&&d!==Bd?u(b,e,d.toString()):a.d.g.push(new Yi(b,e,d))}
function Kk(a,b,c,d){if(!b.I){var e=(b.ea?b.ea.b:a.j).g(a.T,!1);if(e=e._pseudos)e=e[c],c={},b.f=em(a,b.f,e,c),b=c.content,Ej(b)&&(b.M(new Dj(d,a.f)),delete c.content),jm(a,d,c)}}
function ok(a,b,c){var d=M("peelOff"),e=b.e,f=b.aa,g=b.I;if(0<c)b.b.textContent=b.b.textContent.substr(0,c),f+=c;else if(!g&&b.b&&0==f){var h=b.b.parentNode;h&&h.removeChild(b.b)}for(var k=b.$+c,l=[];b.e===e;)l.push(b),b=b.parent;var n=l.pop(),p=n.ia;Qe(function(){for(;0<l.length;){n=l.pop();b=new mj(n.T,b,k);0==l.length&&(b.aa=f,b.I=g);b.Fa=n.Fa;b.ea=n.ea;b.qa=n.qa;b.ia=n.ia?n.ia:p;p=null;var c=lk(a,b,!1);if(c.ua())return c}return O(!1)}).then(function(){Q(d,b)});return P(d)}
bm.prototype.createElement=function(a,b){return"http://www.w3.org/1999/xhtml"==a?this.l.createElement(b):this.l.createElementNS(a,b)};function Ck(a,b,c){var d={},e=a.k._pseudos;b=em(a,b,a.k,d);if(e&&e.before){var f={},g=a.createElement("http://www.w3.org/1999/xhtml","span");c.appendChild(g);em(a,b,e.before,f);delete f.content;jm(a,g,f)}delete d.content;jm(a,c,d);return b}function om(a){this.b=a}function Zj(a){return a.getClientRects()}
function pm(a,b,c,d,e){this.d=a;this.fontSize=b;this.b=a.document;this.root=c||this.b.body;b=this.root.firstElementChild;b||(b=this.b.createElement("div"),this.root.appendChild(b));this.e=b;b=(new om(a)).b.getComputedStyle(this.root,null);this.width=d||parseFloat(b.width)||a.innerWidth;this.height=e||parseFloat(b.height)||a.innerHeight}function qm(a,b,c){a=a.e;u(a,"width",b+"px");u(a,"height",c+"px")};function rm(a,b,c){function d(c){return a.b.getComputedStyle(b,null).getPropertyValue(c)}function e(){u(b,"display","block");u(b,"position","static");return d(J)}function f(){u(b,"display","inline-block");u(y,J,"99999999px");var a=d(J);u(y,J,"");return a}function g(){u(b,"display","inline-block");u(y,J,"0");var a=d(J);u(y,J,"");return a}function h(){var a=e(),b=g(),c=parseFloat(a);if(c<=parseFloat(b))return b;b=f();return c<=parseFloat(b)?a:b}function k(){throw Error("Getting fill-available block size is not implemented");
}var l=b.style.display,n=b.style.position,p=b.style.width,r=b.style.height,q=b.parentNode,y=b.ownerDocument.createElement("div");u(y,"position",n);q.insertBefore(y,b);y.appendChild(b);u(b,"width","auto");u(b,"height","auto");var x=d(ya["writing-mode"])||d("writing-mode"),I="vertical-rl"===x||"tb-rl"===x||"vertical-lr"===x||"tb-lr"===x,J=I?"height":"width",C=I?"width":"height",N={};c.forEach(function(a){var c;switch(a){case "fill-available inline size":c=e();break;case "max-content inline size":c=
f();break;case "min-content inline size":c=g();break;case "fit-content inline size":c=h();break;case "fill-available block size":c=k();break;case "max-content block size":case "min-content block size":case "fit-content block size":c=d(C);break;case "fill-available width":c=I?k():e();break;case "fill-available height":c=I?e():k();break;case "max-content width":c=I?d(C):f();break;case "max-content height":c=I?f():d(C);break;case "min-content width":c=I?d(C):g();break;case "min-content height":c=I?g():
d(C);break;case "fit-content width":c=I?d(C):h();break;case "fit-content height":c=I?h():d(C)}N[a]=parseFloat(c);u(b,"position",n);u(b,"display",l)});u(b,"width",p);u(b,"height",r);q.insertBefore(b,y);q.removeChild(y);return N};function sm(a){var b=a["writing-mode"],b=b&&b.value;a=(a=a.direction)&&a.value;return b===Jd||b!==Kd&&a!==Fd?"ltr":"rtl"}
var tm={a5:{width:new K(148,"mm"),height:new K(210,"mm")},a4:{width:new K(210,"mm"),height:new K(297,"mm")},a3:{width:new K(297,"mm"),height:new K(420,"mm")},b5:{width:new K(176,"mm"),height:new K(250,"mm")},b4:{width:new K(250,"mm"),height:new K(353,"mm")},letter:{width:new K(8.5,"in"),height:new K(11,"in")},legal:{width:new K(8.5,"in"),height:new K(14,"in")},ledger:{width:new K(11,"in"),height:new K(17,"in")}},um={width:Od,height:Pd};
function vm(a){if((a=a.size)&&a.value!==kd){var b=a.value;b.kd()?(a=b.values[0],b=b.values[1]):(a=b,b=null);return a.Uc()?{width:a,height:b||a}:(a=tm[a.name.toLowerCase()])?b&&b===ud?{width:a.height,height:a.width}:{width:a.width,height:a.height}:um}return um}
var wm=function(){var a={width:!0,height:!0,"block-size":!0,"inline-size":!0,margin:!0,padding:!0,border:!0,outline:!0,"outline-width":!0,"outline-style":!0,"outline-color":!0};"left right top bottom before after start end block-start block-end inline-start inline-end".split(" ").forEach(function(b){a["margin-"+b]=!0;a["padding-"+b]=!0;a["border-"+b+"-width"]=!0;a["border-"+b+"-style"]=!0;a["border-"+b+"-color"]=!0});return a}(),xm={"top-left-corner":{K:1,pa:!0,ma:!1,na:!0,oa:!0,ca:null},"top-left":{K:2,
pa:!0,ma:!1,na:!1,oa:!1,ca:"start"},"top-center":{K:3,pa:!0,ma:!1,na:!1,oa:!1,ca:"center"},"top-right":{K:4,pa:!0,ma:!1,na:!1,oa:!1,ca:"end"},"top-right-corner":{K:5,pa:!0,ma:!1,na:!1,oa:!0,ca:null},"right-top":{K:6,pa:!1,ma:!1,na:!1,oa:!0,ca:"start"},"right-middle":{K:7,pa:!1,ma:!1,na:!1,oa:!0,ca:"center"},"right-bottom":{K:8,pa:!1,ma:!1,na:!1,oa:!0,ca:"end"},"bottom-right-corner":{K:9,pa:!1,ma:!0,na:!1,oa:!0,ca:null},"bottom-right":{K:10,pa:!1,ma:!0,na:!1,oa:!1,ca:"end"},"bottom-center":{K:11,pa:!1,
ma:!0,na:!1,oa:!1,ca:"center"},"bottom-left":{K:12,pa:!1,ma:!0,na:!1,oa:!1,ca:"start"},"bottom-left-corner":{K:13,pa:!1,ma:!0,na:!0,oa:!1,ca:null},"left-bottom":{K:14,pa:!1,ma:!1,na:!0,oa:!1,ca:"end"},"left-middle":{K:15,pa:!1,ma:!1,na:!0,oa:!1,ca:"center"},"left-top":{K:16,pa:!1,ma:!1,na:!0,oa:!1,ca:"start"}},ym=Object.keys(xm).sort(function(a,b){return xm[a].K-xm[b].K});
function zm(a,b,c){jl.call(this,a,null,"vivliostyle-page-rule-master",[],b,null,0);a=vm(c);new Am(this.d,this,c,a);this.u={};Bm(this,c);this.b.position=new V(Bd,0);this.b.width=new V(a.width,0);this.b.height=new V(a.height,0);for(var d in c)wm[d]||"background-clip"===d||(this.b[d]=c[d])}t(zm,jl);function Bm(a,b){var c=b._marginBoxes;c&&ym.forEach(function(d){c[d]&&(a.u[d]=new Cm(a.d,a,d,b))})}zm.prototype.f=function(a){return new Dm(a,this)};
function Am(a,b,c,d){nl.call(this,a,null,null,[],b);this.w=d;this.b["z-index"]=new V(new dd(0),0);this.b["flow-from"]=new V(H("body"),0);this.b.position=new V(id,0);this.b.overflow=new V(Ld,0);for(var e in wm)wm.hasOwnProperty(e)&&(this.b[e]=c[e])}t(Am,nl);Am.prototype.f=function(a){return new Em(a,this)};
function Cm(a,b,c,d){nl.call(this,a,null,null,[],b);this.l=c;a=d._marginBoxes[this.l];for(var e in d)if(b=d[e],c=a[e],Jg[e]||c&&c.value===sd)this.b[e]=b;for(e in a)Object.prototype.hasOwnProperty.call(a,e)&&(b=a[e])&&b.value!==sd&&(this.b[e]=b)}t(Cm,nl);Cm.prototype.f=function(a){return new Fm(a,this)};function Dm(a,b){kl.call(this,a,b);this.j=null;this.ra={}}t(Dm,kl);
Dm.prototype.h=function(a,b){var c=this.B,d;for(d in b)if(Object.prototype.hasOwnProperty.call(b,d))switch(d){case "writing-mode":case "direction":c[d]=b[d]}kl.prototype.h.call(this,a,b)};Dm.prototype.yc=function(){var a=this.style;a.left=Qd;a["margin-left"]=Qd;a["border-left-width"]=Qd;a["padding-left"]=Qd;a["padding-right"]=Qd;a["border-right-width"]=Qd;a["margin-right"]=Qd;a.right=Qd};
Dm.prototype.zc=function(){var a=this.style;a.top=Qd;a["margin-top"]=Qd;a["border-top-width"]=Qd;a["padding-top"]=Qd;a["padding-bottom"]=Qd;a["border-bottom-width"]=Qd;a["margin-bottom"]=Qd;a.bottom=Qd};Dm.prototype.Y=function(a,b,c){b=b.l;var d={start:this.j.marginLeft,end:this.j.marginRight,W:this.j.lb},e={start:this.j.marginTop,end:this.j.marginBottom,W:this.j.kb};Gm(this,b.top,!0,d,a,c);Gm(this,b.bottom,!0,d,a,c);Gm(this,b.left,!1,e,a,c);Gm(this,b.right,!1,e,a,c)};
function Hm(a,b,c,d,e){this.J=a;this.l=e;this.g=c;this.k=!X(d,b[c?"width":"height"],new Hc(d,0,"px"));this.h=null}Hm.prototype.b=function(){return this.k};function Im(a){a.h||(a.h=rm(a.l,a.J.d,a.g?["max-content width","min-content width"]:["max-content height","min-content height"]));return a.h}Hm.prototype.e=function(){var a=Im(this);return this.g?yj(this.J)+a["max-content width"]+zj(this.J):wj(this.J)+a["max-content height"]+xj(this.J)};
Hm.prototype.f=function(){var a=Im(this);return this.g?yj(this.J)+a["min-content width"]+zj(this.J):wj(this.J)+a["min-content height"]+xj(this.J)};Hm.prototype.d=function(){return this.g?yj(this.J)+this.J.width+zj(this.J):wj(this.J)+this.J.height+xj(this.J)};function Jm(a){this.g=a}Jm.prototype.b=function(){return this.g.some(function(a){return a.b()})};Jm.prototype.e=function(){var a=this.g.map(function(a){return a.e()});return Math.max.apply(null,a)*a.length};
Jm.prototype.f=function(){var a=this.g.map(function(a){return a.f()});return Math.max.apply(null,a)*a.length};Jm.prototype.d=function(){var a=this.g.map(function(a){return a.d()});return Math.max.apply(null,a)*a.length};function Km(a,b,c,d,e,f){Hm.call(this,a,b,c,d,e);this.j=f}t(Km,Hm);Km.prototype.b=function(){return!1};Km.prototype.e=function(){return this.d()};Km.prototype.f=function(){return this.d()};Km.prototype.d=function(){return this.g?yj(this.J)+this.j+zj(this.J):wj(this.J)+this.j+xj(this.J)};
function Gm(a,b,c,d,e,f){var g=a.d.d,h={},k={},l={},n;for(n in b){var p=xm[n];if(p){var r=b[n],q=a.ra[n],y=new Hm(r,q.style,c,g,f);h[p.ca]=r;k[p.ca]=q;l[p.ca]=y}}a=d.start.evaluate(e);d.end.evaluate(e);b=d.W.evaluate(e);var x=Lm(l,b),I=!1,J={};Object.keys(h).forEach(function(a){var b=X(g,k[a].style[c?"max-width":"max-height"],d.W);b&&(b=b.evaluate(e),x[a]>b&&(b=l[a]=new Km(h[a],k[a].style,c,g,f,b),J[a]=b.d(),I=!0))});I&&(x=Lm(l,b),I=!1,["start","center","end"].forEach(function(a){x[a]=J[a]||x[a]}));
var C={};Object.keys(h).forEach(function(a){var b=X(g,k[a].style[c?"min-width":"min-height"],d.W);b&&(b=b.evaluate(e),x[a]<b&&(b=l[a]=new Km(h[a],k[a].style,c,g,f,b),C[a]=b.d(),I=!0))});I&&(x=Lm(l,b),["start","center","end"].forEach(function(a){x[a]=C[a]||x[a]}));var N=a+b,qh=a+(a+b);["start","center","end"].forEach(function(a){var b=x[a];if(b){var d=h[a],e=0;switch(a){case "start":e=c?d.left:d.top;break;case "center":e=(qh-b)/2;break;case "end":e=N-b}c?Cj(d,e,b-yj(d)-zj(d)):Bj(d,e,b-wj(d)-xj(d))}})}
function Lm(a,b){var c=a.start,d=a.center,e=a.end,f={};if(d){var g=[c,e].filter(function(a){return a}),g=Mm(d,g.length?new Jm(g):null,b);g.Ha&&(f.center=g.Ha);d=g.Ha||d.d();d=(b-d)/2;c&&c.b()&&(f.start=d);e&&e.b()&&(f.end=d)}else c=Mm(c,e,b),c.Ha&&(f.start=c.Ha),c.Kb&&(f.end=c.Kb);return f}
function Mm(a,b,c){var d={Ha:null,Kb:null};if(a&&b)if(a.b()&&b.b()){var e=a.e(),f=b.e();0<e&&0<f?(f=e+f,f<c?d.Ha=c*e/f:(a=a.f(),b=b.f(),b=a+b,b<c?d.Ha=a+(c-b)*(e-a)/(f-b):0<b&&(d.Ha=c*a/b)),0<d.Ha&&(d.Kb=c-d.Ha)):0<e?d.Ha=c:0<f&&(d.Kb=c)}else a.b()?d.Ha=Math.max(c-b.d(),0):b.b()&&(d.Kb=Math.max(c-a.d(),0));else a?a.b()&&(d.Ha=c):b&&b.b()&&(d.Kb=c);return d}function Em(a,b){ol.call(this,a,b);this.marginLeft=this.marginBottom=this.marginRight=this.marginTop=this.kb=this.lb=null}t(Em,ol);
Em.prototype.h=function(a,b){var c=this.B,d;for(d in b)Object.prototype.hasOwnProperty.call(b,d)&&(d.match(/^column.*$/)||d.match(/^background-/))&&(c[d]=b[d]);ol.prototype.h.call(this,a,b);d=this.e;c={lb:this.lb,kb:this.kb,marginTop:this.marginTop,marginRight:this.marginRight,marginBottom:this.marginBottom,marginLeft:this.marginLeft};d.j=c;d=d.style;d.width=new L(c.lb);d.height=new L(c.kb);d["padding-left"]=new L(c.marginLeft);d["padding-right"]=new L(c.marginRight);d["padding-top"]=new L(c.marginTop);
d["padding-bottom"]=new L(c.marginBottom)};Em.prototype.yc=function(){var a=Nm(this,{start:"left",end:"right",W:"width"});this.lb=a.dd;this.marginLeft=a.nd;this.marginRight=a.md};Em.prototype.zc=function(){var a=Nm(this,{start:"top",end:"bottom",W:"height"});this.kb=a.dd;this.marginTop=a.nd;this.marginBottom=a.md};
function Nm(a,b){var c=a.style,d=a.d.d,e=b.start,f=b.end,g=b.W,h=a.d.w[g].da(d,null),k=X(d,c[g],h),l=X(d,c["margin-"+e],h),n=X(d,c["margin-"+f],h),p=pl(d,c["padding-"+e],h),r=pl(d,c["padding-"+f],h),q=rl(d,c["border-"+e+"-width"],c["border-"+e+"-style"],h),y=rl(d,c["border-"+f+"-width"],c["border-"+f+"-style"],h),x=F(d,h,E(d,E(d,q,p),E(d,y,r)));k?(x=F(d,x,k),l||n?l?n=F(d,x,l):l=F(d,x,n):n=l=Pc(d,x,new Zb(d,.5))):(l||(l=d.b),n||(n=d.b),k=F(d,x,E(d,l,n)));c[e]=new L(l);c[f]=new L(n);c["margin-"+e]=
Qd;c["margin-"+f]=Qd;c["padding-"+e]=new L(p);c["padding-"+f]=new L(r);c["border-"+e+"-width"]=new L(q);c["border-"+f+"-width"]=new L(y);c[g]=new L(k);c["max-"+g]=new L(k);return{dd:F(d,h,E(d,l,n)),nd:l,md:n}}function Fm(a,b){ol.call(this,a,b);var c=b.l;this.j=xm[c];a.ra[c]=this;this.va=!0}t(Fm,ol);m=Fm.prototype;
m.Wb=function(a,b,c){var d=b.d;u(d,"display","flex");var e=Al(this,a,"vertical-align"),f=null;e===H("middle")?f="center":e===H("top")?f="flex-start":e===H("bottom")&&(f="flex-end");f&&(u(d,"flex-flow",this.b?"row":"column"),u(d,"justify-content",f));ol.prototype.Wb.call(this,a,b,c)};
m.ca=function(a,b){var c=this.style,d=this.d.d,e=a.start,f=a.end,g="left"===e,h=g?b.lb:b.kb,k=X(d,c[a.W],h),g=g?b.marginLeft:b.marginTop;if("start"===this.j.ca)c[e]=new L(g);else if(k){var l=pl(d,c["margin-"+e],h),n=pl(d,c["margin-"+f],h),p=pl(d,c["padding-"+e],h),r=pl(d,c["padding-"+f],h),q=rl(d,c["border-"+e+"-width"],c["border-"+e+"-style"],h),f=rl(d,c["border-"+f+"-width"],c["border-"+f+"-style"],h),k=E(d,k,E(d,E(d,p,r),E(d,E(d,q,f),E(d,l,n))));switch(this.j.ca){case "center":c[e]=new L(E(d,g,
Qc(d,F(d,h,k),new Zb(d,2))));break;case "end":c[e]=new L(F(d,E(d,g,h),k))}}};
function Om(a,b,c){function d(a){if(x)return x;x={W:y?y.evaluate(a):null,za:k?k.evaluate(a):null,Aa:l?l.evaluate(a):null};var b=h.evaluate(a),c=0;[r,n,p,q].forEach(function(b){b&&(c+=b.evaluate(a))});(null===x.za||null===x.Aa)&&c+x.W+x.za+x.Aa>b&&(null===x.za&&(x.za=0),null===x.Aa&&(x.Sd=0));null!==x.W&&null!==x.za&&null!==x.Aa&&(x.Aa=null);null===x.W&&null!==x.za&&null!==x.Aa?x.W=b-c-x.za-x.Aa:null!==x.W&&null===x.za&&null!==x.Aa?x.za=b-c-x.W-x.Aa:null!==x.W&&null!==x.za&&null===x.Aa?x.Aa=b-c-x.W-
x.za:null===x.W?(x.za=x.Aa=0,x.W=b-c):x.za=x.Aa=(b-c-x.W)/2;return x}var e=a.style;a=a.d.d;var f=b.Ac,g=b.Ec;b=b.W;var h=c["margin"+g.charAt(0).toUpperCase()+g.substring(1)],k=ql(a,e["margin-"+f],h),l=ql(a,e["margin-"+g],h),n=pl(a,e["padding-"+f],h),p=pl(a,e["padding-"+g],h),r=rl(a,e["border-"+f+"-width"],e["border-"+f+"-style"],h),q=rl(a,e["border-"+g+"-width"],e["border-"+g+"-style"],h),y=X(a,e[b],h),x=null;e[b]=new L(new ac(a,function(){var a=d(this).W;return null===a?0:a},b));e["margin-"+f]=new L(new ac(a,
function(){var a=d(this).za;return null===a?0:a},"margin-"+f));e["margin-"+g]=new L(new ac(a,function(){var a=d(this).Aa;return null===a?0:a},"margin-"+g));"left"===f?e.left=new L(E(a,c.marginLeft,c.lb)):"top"===f&&(e.top=new L(E(a,c.marginTop,c.kb)))}m.yc=function(){var a=this.e.j;this.j.na?Om(this,{Ac:"right",Ec:"left",W:"width"},a):this.j.oa?Om(this,{Ac:"left",Ec:"right",W:"width"},a):this.ca({start:"left",end:"right",W:"width"},a)};
m.zc=function(){var a=this.e.j;this.j.pa?Om(this,{Ac:"bottom",Ec:"top",W:"height"},a):this.j.ma?Om(this,{Ac:"top",Ec:"bottom",W:"height"},a):this.ca({start:"top",end:"bottom",W:"height"},a)};m.Sb=function(a,b,c,d,e,f){ol.prototype.Sb.call(this,a,b,c,d,e,f);a=c.l;c=this.d.l;d=this.j;d.na||d.oa?d.pa||d.ma||(d.na?a.left[c]=b:d.oa&&(a.right[c]=b)):d.pa?a.top[c]=b:d.ma&&(a.bottom[c]=b)};
function Pm(a,b,c,d,e){this.b=a;this.h=b;this.f=c;this.d=d;this.e=e;this.g={};a=this.h;b=new Ic(a,"page-number");b=new Ac(a,new Gc(a,b,new Zb(a,2)),a.b);c=new qc(a,b);a.values["recto-page"]=c;a.values["verso-page"]=b;"ltr"===sm(this.e)?(a.values["left-page"]=b,b=new qc(a,b),a.values["right-page"]=b):(c=new qc(a,b),a.values["left-page"]=c,a.values["right-page"]=b)}function Qm(a){var b={};Yh(a.b,[],"",b);a.b.pop();return b}
function Rm(a,b){var c=[],d;for(d in b)if(Object.prototype.hasOwnProperty.call(b,d)){var e=b[d],f;f=e instanceof V?e.value+"":Rm(a,e);c.push(d+f+(e.Ba||""))}return c.sort().join("^")}function Sm(a){this.b=null;this.f=a}t(Sm,W);Sm.prototype.apply=function(a){a.H===this.f&&this.b.apply(a)};Sm.prototype.d=function(){return 3};Sm.prototype.e=function(a){this.b&&ih(a.Ab,this.f,this.b);return!0};function Tm(a){this.b=null;this.f=a}t(Tm,W);
Tm.prototype.apply=function(a){1===(new Ic(this.f,"page-number")).evaluate(a.d)&&this.b.apply(a)};Tm.prototype.d=function(){return 2};function Um(a){this.b=null;this.f=a}t(Um,W);Um.prototype.apply=function(a){(new Ic(this.f,"left-page")).evaluate(a.d)&&this.b.apply(a)};Um.prototype.d=function(){return 1};function Vm(a){this.b=null;this.f=a}t(Vm,W);Vm.prototype.apply=function(a){(new Ic(this.f,"right-page")).evaluate(a.d)&&this.b.apply(a)};Vm.prototype.d=function(){return 1};
function Wm(a){this.b=null;this.f=a}t(Wm,W);Wm.prototype.apply=function(a){(new Ic(this.f,"recto-page")).evaluate(a.d)&&this.b.apply(a)};Wm.prototype.d=function(){return 1};function Xm(a){this.b=null;this.f=a}t(Xm,W);Xm.prototype.apply=function(a){(new Ic(this.f,"verso-page")).evaluate(a.d)&&this.b.apply(a)};Xm.prototype.d=function(){return 1};function Ym(a,b){gh.call(this,a,b,null,null)}t(Ym,gh);
Ym.prototype.apply=function(a){var b=a.d,c=a.w,d=this.style,e=this.b;ah(b,c,d,e,null,null);if(d=d._marginBoxes){var c=Zg(c,"_marginBoxes"),f;for(f in d)if(d.hasOwnProperty(f)){var g=c[f];g||(g={},c[f]=g);ah(b,g,d[f],e,null,null);g.content&&(g.content=g.content.tc(new Hh(a,null)))}}};function Zm(a,b,c,d){fi.call(this,a,b,null,c,null,d,!1);this.f=""}t(Zm,fi);m=Zm.prototype;m.pb=function(){this.f+="@page ";this.ab()};m.Ua=function(a,b){this.f+=b;b&&(this.b.push(new Sm(b)),this.d+=65536)};
m.Bb=function(a,b){b&&lf(this,"E_INVALID_PAGE_SELECTOR :"+a+"("+b.join("")+")");this.f+=":"+a;switch(a.toLowerCase()){case "first":this.b.push(new Tm(this.e));this.d+=256;break;case "left":this.b.push(new Um(this.e));this.d+=1;break;case "right":this.b.push(new Vm(this.e));this.d+=1;break;case "recto":this.b.push(new Wm(this.e));this.d+=1;break;case "verso":this.b.push(new Xm(this.e));this.d+=1;break;default:lf(this,"E_INVALID_PAGE_SELECTOR :"+a)}};m.ha=function(){this.f+="{";fi.prototype.ha.call(this)};
m.Pa=function(){this.f+="}";document.getElementById("vivliostyle-page-rules").textContent+=this.f;fi.prototype.Pa.call(this)};m.Ea=function(a,b,c){"size"===a&&(this.f+="size: "+b.toString()+(c?"!important":"")+";");fi.prototype.Ea.call(this,a,b,c)};m.gd=function(a){ih(this.h.Ab,"*",a)};m.ld=function(a){return new Ym(this.k,a)};m.Jc=function(a){var b=Zg(this.k,"_marginBoxes"),c=b[a];c||(c={},b[a]=c);gf(this.Z,new $m(this.e,this.Z,this.u,c))};
function $m(a,b,c,d){hf.call(this,a,b,!1);this.d=c;this.b=d}t($m,jf);$m.prototype.Ea=function(a,b,c){Hg(this.d,a,b,c,this)};$m.prototype.yb=function(a,b){kf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};$m.prototype.gc=function(a,b){kf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};$m.prototype.$a=function(a,b,c){Yg(this.b,a,new V(b,c?df(this):ef(this)))};function an(a){this.d=a;this.b={};this.b.page=[0]}
function Ph(a,b,c){return new ac(a.d,function(){var d=a.b[b];return c(d&&d.length?d[d.length-1]:null)},"page-counter-"+b)}function Rh(a,b,c){return new ac(a.d,function(){return c(a.b[b]||[])},"page-counters-"+b)}
function bn(a,b,c){var d,e=b["counter-reset"];e&&(e=e.evaluate(c))&&(d=Rf(e,!0));if(d)for(var f in d){var e=a,g=f,h=d[f];e.b[g]?e.b[g].push(h):e.b[g]=[h]}var k;(b=b["counter-increment"])&&(c=b.evaluate(c))&&(k=Rf(c,!1));k?"page"in k||(k.page=1):k={page:1};for(var l in k)a.b[l]||(c=a,b=l,c.b[b]?c.b[b].push(0):c.b[b]=[0]),c=a.b[l],c[c.length-1]+=k[l]};function cn(a,b,c,d,e,f,g,h,k){this.h=a;this.g=b;this.b=c;this.d=d;this.w=e;this.f=f;this.l=a.F;this.u=g;this.e=h;this.k=k;this.j=a.f;cc(this.b,function(a){return(a=this.b.b[a])?0<a.b.length&&a.b[0].b.b<=this.g:!1});bc(this.b,new ac(this.b,function(){return this.b.d},"page-number"))}
function dn(a,b,c,d){if(a.k.length){var e=new ec(0,b,c,d);a=a.k;for(var f={},g=0;g<a.length;g++)ah(e,f,a[g],0,null,null);g=f.width;a=f.height;var f=f["text-zoom"],h=1;if(g&&a||f){var k=dc.em;(f?f.evaluate(e,"text-zoom"):null)===Dd&&(h=k/d,d=k,b*=h,c*=h);if(g&&a&&(g=hd(g.evaluate(e,"width"),e),e=hd(a.evaluate(e,"height"),e),0<g&&0<e))return{width:g,height:e,fontSize:d}}}return{width:b,height:c,fontSize:d}}
function en(a,b,c,d,e,f,g,h){ec.call(this,0,d.width,d.height,d.fontSize);this.style=a;this.X=b;this.lang=b.lang||c;this.viewport=d;this.e={body:!0};this.f=e;this.b=this.B=this.d=this.h=null;this.g=0;this.va=f;this.Y=new ui(this.style.l);this.ba={};this.H=null;this.w=new an(a.b);this.F={};this.P=null;this.la=g;this.ra=h;for(var k in a.e)(b=a.e[k]["flow-consume"])&&(b.evaluate(this,"flow-consume")==jd?this.e[k]=!0:delete this.e[k])}t(en,ec);
function fn(a){var b=M("StyleInstance.init");a.d=new Mj(a.X,a.style.d,a.style.g,a,a.e,a.style.j,a.w);var c=a.d;c.k=a;for(var d=0;d<c.B.length;d++)Uj(c.k,c.B[d]);a.B={};c=a.B[a.X.url]=a.d;for(d=0;!c.j&&(d+=5E3,Vj(c,d,0)!=Number.POSITIVE_INFINITY););c=c.u;a.P=sm(c);a.h=new Pl(a.style.w);d=new Vh(a.style.d,a,a.w);a.h.h(d,c);Ol(a.h,a);a.H=new Pm(d,a.style.b,a.h,a,c);c=[];for(d=0;d<a.style.f.length;d++){var e=a.style.f[d];if(!e.G||e.G.evaluate(a)){var f=e.ob,g=a,e={},h=void 0;for(h in f)e[h]=f[h].evaluate(g,
h);f=e;g=void 0;for(g in pi)f[g]||(f[g]=pi[g]);e=new si(e);c.push(e)}}d=a.va;a=a.Y;e=[];for(f=0;f<c.length;f++)g=c[f],g.src&&g.b?e.push(yi(d,g,a)):v("E_FONT_FACE_INVALID");Vf(e).ka(b);return P(b)}function Uj(a,b){var c=a.b;if(c){var d=c.b[b.f];d||(d=new tj,c.b[b.f]=d);d.b.push(new sj(new rj({ja:[{xa:b.g,Fa:0,ea:null,qa:null,ia:null}],aa:0,I:!1}),b))}}
function gn(a,b){if(!b)return 0;var c=Number.POSITIVE_INFINITY,d;for(d in a.e){var e=b.b[d];if((!e||0==e.b.length)&&a.b){var f=a.d;f.l=d;for(e=0;null!=f.l&&(e+=5E3,Vj(f,e,0)!=Number.POSITIVE_INFINITY););e=a.b.b[d];b!=a.b&&e&&(e=e.clone(),b.b[d]=e)}if(e){for(var f=a,g=Number.POSITIVE_INFINITY,h=0;h<e.b.length;h++){for(var k=e.b[h].d.La,l=k.ja[0].xa,n=k.aa,p=k.I,r=0;l.ownerDocument!=f.X.b;)r++,l=k.ja[r].xa,p=!1,n=0;k=Di(f.X,l,n,p);k<g&&(g=k)}f=g;f<c&&(c=f)}}return c}
function hn(a,b){var c=gn(a,a.b);if(c==Number.POSITIVE_INFINITY)return null;for(var d=a.h.children,e,f=0;f<d.length;f++)if(e=d[f],"vivliostyle-page-rule-master"!==e.d.Za){var g=1,h=Al(e,a,"utilization");h&&h.Tc()&&(g=h.C);h=gc(a,"em");a.g=Vj(a.d,c,Math.ceil(g*a.k()*a.j()/(h*h)));var g=a,h=g.b.d,k=void 0;for(k in g.b.b)for(var l=g.b.b[k],n=l.b.length-1;0<=n;n--){var p=l.b[n];0>p.b.e&&p.b.b<g.g&&(p.b.e=h)}fc(a,a.style.b);g=Al(e,a,"enabled");if(!g||g===Md){d=a;v("Location - page "+d.b.d);v("  currnt: "+
c);v("  lookup: "+d.g);c=void 0;for(c in d.b.b)for(f=d.b.b[c],g=0;g<f.b.length;g++)v("  Chunk "+c+": "+f.b[g].b.b);c=a.H;f=b;g=e.d;if(0===Object.keys(f).length)g.d.e=g;else{e=g;d=Rm(c,f);e=e.g+"^"+d;d=c.g[e];if(!d){if("background-host"===g.Za)d=c,f=(new zm(d.h,d.f.d,f)).f(d.f),f.h(d.b,d.e),Ol(f,d.d),d=f;else{d=c;h=f;f=g.clone({Za:"vivliostyle-page-rule-master"});if(g=h.size)h=vm(h),g=g.Ba,f.b.width=Vg(d.d,f.b.width,new V(h.width,g)),f.b.height=Vg(d.d,f.b.height,new V(h.height,g));f=f.f(d.f);f.h(d.b,
d.e);Ol(f,d.d);d=f}c.g[e]=d}e=d.d;e.d.e=e;e=d}return e}}throw Error("No enabled page masters");}
function jn(a,b,c){var d=a.b.b[c];if(!d)return O(!0);a.e[c]&&0<b.A.length&&(b.bd=!1);Dk(b);var e=M("layoutColumn"),f=[];Re(function(c){for(;0<d.b.length;){var e=0,k=d.b[e];if(k.b.b>a.g)break;for(var l=1;l<d.b.length;l++){var n=d.b[l];if(n.b.b>a.g)break;hj(n.b,k.b)&&(k=n,e=l)}var p=k.b,r=!0;Ik(b,k.d).then(function(a){k.b.Dd&&(null==a||p.d)&&f.push(k);p.d?(d.b.splice(e,1),R(c)):a?(k.d=a,R(c)):(d.b.splice(e,1),r?r=!1:Te(c))});if(r){r=!1;return}}R(c)}).then(function(){0<f.length&&(d.b=f.concat(d.b));
Q(e,!0)});return P(e)}
function kn(a,b,c,d,e,f,g){var h=Al(c,a,"enabled");if(h&&h!==Md)return O(!0);var k=M("layoutContainer"),l=Al(c,a,"wrap-flow")===kd,n=c.b?c.g&&c.F:c.f&&c.H,h=Al(c,a,"flow-from"),p=a.viewport.b.createElement("div"),r=Al(c,a,"position");u(p,"position",r?r.name:"absolute");d.insertBefore(p,d.firstChild);var q=new vj(p);q.b=c.b;c.Wb(a,q,b);q.B=e;q.F=f;e+=q.left+q.marginLeft+q.Y;f+=q.top+q.marginTop+q.ba;if(h&&h.hd())if(a.F[h.toString()])c.Sb(a,q,b,null,1,a.f),h=O(!0);else{var y=M("layoutContainer.inner"),x=
h.toString(),I=Y(c,a,"column-count"),J=Y(c,a,"column-gap"),C=1<I?Y(c,a,"column-width"):q.width,h=zl(c,a),N=0,r=Al(c,a,"shape-inside"),qh=Pf(r,0,0,q.width,q.height,a),Wa=new bm(x,a,a.viewport,a.d,h,a.X,a.Y,a.style.u,a,b,a.la,a.ra),rh=0,Z=null;Re(function(b){for(;rh<I;){var c=rh++;if(1<I){var d=a.viewport.b.createElement("div");u(d,"position","absolute");p.appendChild(d);Z=new fk(d,Wa,a.f);Z.b=q.b;Z.fb=q.fb;Z.Nb=q.Nb;q.b?(u(d,"margin-left",q.h+"px"),u(d,"margin-right",q.H+"px"),c=c*(C+J)+q.j,Cj(Z,0,
q.width),Bj(Z,c,C)):(u(d,"margin-top",q.j+"px"),u(d,"margin-bottom",q.w+"px"),c=c*(C+J)+q.h,Bj(Z,0,q.height),Cj(Z,c,C));Z.B=e+q.h;Z.F=f+q.j}else Z=new fk(p,Wa,a.f),Aj(Z,q),q=Z;Z.A=n?[]:g;Z.Lb=qh;if(0<=Z.width){var h=M("inner");jn(a,Z,x).then(function(){Z.P&&"column"!=Z.P&&(rh=I,"region"!=Z.P&&(a.F[x]=!0));Q(h,!0)});c=P(h)}else c=O(!0);if(c.ua()){c.then(function(){N=Math.max(N,Z.e);Te(b)});return}N=Math.max(N,Z.e)}R(b)}).then(function(){q.e=N;c.Sb(a,q,b,Z,I,a.f);Q(y,!0)});h=P(y)}else h=Al(c,a,"content"),
r=!1,h&&Ej(h)?(h.M(new Dj(p,a)),Nl(c,a,q)):c.va&&(d.removeChild(p),r=!0),r||c.Sb(a,q,b,null,1,a.f),h=O(!0);h.then(function(){if(!c.f||0<Math.floor(q.e)){if(!l){var h=q.B+q.left,n=q.F+q.top,r=yj(q)+q.width+zj(q),x=wj(q)+q.height+xj(q),y=Al(c,a,"shape-outside"),h=Pf(y,h,n,r,x,a);Sa(a.viewport.root)&&g.push(be(h,0,-1.25*gc(a,"em")));g.push(h)}}else if(0==c.children.length){d.removeChild(p);Q(k,!0);return}var C=c.children.length-1;Qe(function(){for(;0<=C;){var d=c.children[C--],d=kn(a,b,d,p,e,f,g);if(d.ua())return d}return O(!1)}).then(function(){Q(k,
!0)})});return P(k)}
function ln(a,b,c){a.F={};c?(a.b=c.clone(),Pj(a.d,c.e)):(a.b=new uj,Pj(a.d,-1));a.lang&&b.J.setAttribute("lang",a.lang);c=a.b;c.d++;fc(a,a.style.b);var d=Qm(a.H);mn(a,d);var e=hn(a,d);if(!e)return O(null);e.d.b.width.value===Od&&bj(b);e.d.b.height.value===Pd&&cj(b);bn(a.w,d,a);var f=M("layoutNextPage");kn(a,b,e,b.J,0,0,[]).then(function(){e.Y(a,b,a.f);var d=new Ic(e.d.d,"left-page");b.f=d.evaluate(a)?"left":"right";var d=a.b.d,h;for(h in a.b.b)for(var k=a.b.b[h],l=k.b.length-1;0<=l;l--){var n=k.b[l];
0<=n.b.e&&n.b.e+n.b.j-1<=d&&k.b.splice(l,1)}a.b=null;c.e=a.d.b;h=a.style.h.B[a.X.url];d=b.J.firstElementChild.getBoundingClientRect();b.b.width=d.width;b.b.height=d.height;k=b.g;for(d=0;d<k.length;d++)l=k[d],u(l.target,l.name,l.value.toString());for(d=0;d<h.length;d++)if(k=h[d],n=b.h[k.Db],l=b.h[k.Ad],n&&l&&(n=$i(n,k.action)))for(var p=0;p<l.length;p++)l[p].addEventListener(k.event,n,!1);var r;a:{for(r in a.e)if((h=c.b[r])&&0<h.b.length){r=!1;break a}r=!0}r&&(c=null);Q(f,c)});return P(f)}
function mn(a,b){var c=vm(b),d=c.width;d===Od?a.u=null:a.u=d.C*gc(a,d.b);c=c.height;c===Pd?a.l=null:a.l=c.C*gc(a,c.b)}function nn(a,b,c,d){fi.call(this,a.g,a,b,c,d,a.f,!c);this.f=a;this.A=!1}t(nn,fi);m=nn.prototype;m.cc=function(){};m.bc=function(a,b,c){a=new jl(this.f.j,a,b,c,this.f.u,this.G,ef(this.Z));gf(this.f,new Ul(a.d,this.f,a,this.u))};m.hb=function(a){a=a.e;null!=this.G&&(a=Oc(this.e,this.G,a));gf(this.f,new nn(this.f,a,this,this.B))};m.Zb=function(){gf(this.f,new ii(this.e,this.Z))};
m.ac=function(){var a={};this.f.k.push({ob:a,G:this.G});gf(this.f,new ji(this.e,this.Z,null,a,this.f.f))};m.$b=function(a){var b=this.f.h[a];b||(b={},this.f.h[a]=b);gf(this.f,new ji(this.e,this.Z,null,b,this.f.f))};m.ec=function(){var a={};this.f.w.push(a);gf(this.f,new ji(this.e,this.Z,this.G,a,this.f.f))};m.Fb=function(a){var b=this.f.l;if(a){var c=Zg(b,"_pseudos"),b=c[a];b||(b={},c[a]=b)}gf(this.f,new ji(this.e,this.Z,null,b,this.f.f))};m.dc=function(){this.A=!0;this.ab()};
m.pb=function(){var a=new Zm(this.f.j,this.f,this,this.u);gf(this.f,a);a.pb()};m.ha=function(){fi.prototype.ha.call(this);if(this.A){this.A=!1;var a="R"+this.f.B++,b=H(a),c;this.G?c=new Ug(b,0,this.G):c=new V(b,0);$g(this.k,"region-id").push(c);this.Pa();a=new nn(this.f,this.G,this,a);gf(this.f,a);a.ha()}};
function on(a){var b=a.getAttribute("content");if(!b)return"";a={};for(var c;null!=(c=b.match(/^,?\s*([-A-Za-z_.][-A-Za-z_0-9.]*)\s*=\s*([-+A-Za-z_0-9.]*)\s*/));)b=b.substr(c[0].length),a[c[1]]=c[2];b=a.width-0;a=a.height-0;return b&&a?"@-epubx-viewport{width:"+b+"px;height:"+a+"px;}":""}function pn(a){ff.call(this);this.f=a;this.g=new Yb(null);this.j=new Yb(this.g);this.u=new gl(this.g);this.A=new nn(this,null,null,null);this.B=0;this.k=[];this.l={};this.h={};this.w=[];this.b=this.A}t(pn,ff);
pn.prototype.N=function(a){v("CSS parser: "+a)};function qn(a,b){return rn(b,a)}function sn(a){Xe.call(this,qn,!1);this.F=a;this.A={};this.h={};this.b={};this.B={};this.f=null;this.j=[]}t(sn,Xe);function tn(a){var b=ea("user-agent.xml",da),c=M("OPSDocStore.init");Ye(Ig).then(function(d){a.f=d;Ye(li).then(function(){a.load(b).then(function(){Q(c,!0)})})});return P(c)}function un(a,b){a.j.push({url:b.url,text:b.text,Qa:"User",ta:null,media:null})}
function rn(a,b){var c=M("OPSDocStore.load"),d=b.url;Ji(b,a).then(function(b){for(var f=[],g=b.b.getElementsByTagNameNS("http://www.idpf.org/2007/ops","trigger"),h=0;h<g.length;h++){var k=g[h],l=k.getAttributeNS("http://www.w3.org/2001/xml-events","observer"),n=k.getAttributeNS("http://www.w3.org/2001/xml-events","event"),p=k.getAttribute("action"),k=k.getAttribute("ref");l&&n&&p&&k&&f.push({Ad:l,event:n,action:p,Db:k})}a.B[d]=f;var r=[],f=ea("user-agent-page.css",da);r.push({url:f,text:null,Qa:"UA",
ta:null,media:null});for(h=0;h<a.j.length;h++)r.push(a.j[h]);if(f=b.h)for(f=f.firstChild;f;f=f.nextSibling)if(1==f.nodeType)if(g=f,h=g.namespaceURI,l=g.localName,"http://www.w3.org/1999/xhtml"==h)if("style"==l)r.push({url:d,text:g.textContent,Qa:"Author",ta:null,media:null});else if("link"==l){if(n=g.getAttribute("rel"),h=g.getAttribute("class"),l=g.getAttribute("media"),"stylesheet"==n||"alternate stylesheet"==n&&h)g=g.getAttribute("href"),g=ea(g,d),r.push({url:g,text:null,ta:h,media:l,Qa:"Author"})}else"meta"==
l&&"viewport"==g.getAttribute("name")&&r.push({url:d,text:on(g),Qa:"Author",G:null,media:null});else"http://www.gribuser.ru/xml/fictionbook/2.0"==h?"stylesheet"==l&&"text/css"==g.getAttribute("type")&&r.push({url:d,text:g.textContent,Qa:"Author",ta:null,media:null}):"http://example.com/sse"==h&&"property"===l&&(h=g.getElementsByTagName("name")[0])&&"stylesheet"===h.textContent&&(g=g.getElementsByTagName("value")[0])&&(g=ea(g.textContent,d),r.push({url:g,text:null,ta:null,media:null,Qa:"Author"}));
for(var q="",h=0;h<r.length;h++)q+=r[h].url,q+="^",r[h].text&&(q+=r[h].text),q+="^";var y=a.A[q];y?(a.b[d]=y,Q(c,b)):(f=a.h[q],f||(f=new $e(function(){var b=M("fetchStylesheet"),c=0,d=new pn(a.f);Qe(function(){if(c<r.length){var a=r[c++];d.qb(a.Qa);var b;if(a.text){b=a.url;var e=a.ta,a=new Nb(a.text);b=Gf(a,d,b,e)}else b=Hf(a.url,d,a.ta);return b}return O(!1)}).then(function(){y=new cn(a,d.g,d.j,d.A.h,d.u,d.k,d.l,d.h,d.w);a.A[q]=y;delete a.h[q];Q(b,y)});return P(b)},"FetchStylesheet "+d),a.h[q]=f,
f.start()),Ye(f).then(function(f){a.b[d]=f;Q(c,b)}))});return P(c)};function vn(a,b,c,d,e,f,g,h){this.d=a;this.url=b;this.lang=c;this.e=d;this.g=e;this.Q=Qb(f);this.h=g;this.f=h;this.Ra=this.b=null}function wn(a,b,c){if(0!=c--)for(b=b.firstChild;b;b=b.nextSibling)if(1==b.nodeType){var d=b;"auto"!=za(d,"height")&&(u(d,"height","auto"),wn(a,d,c));"absolute"==za(d,"position")&&(u(d,"position","relative"),wn(a,d,c))}}
function xn(a){var b=a.target,c="\u25b8"==b.textContent;b.textContent=c?"\u25be":"\u25b8";for(b=b.parentNode.firstChild;b;)if(1!=b.nodeType)b=b.nextSibling;else{var d=b;"toc-container"==d.getAttribute("data-adapt-class")?b=d.firstChild:("toc-node"==d.getAttribute("data-adapt-class")&&(d.style.height=c?"auto":"0px"),b=b.nextSibling)}a.stopPropagation()}
vn.prototype.Bc=function(a){var b=this.h.Bc(a);return function(a,d,e){var f=e.behavior;if(!f||"toc-node"!=f.toString()&&"toc-container"!=f.toString())return b(a,d,e);a=d.getAttribute("data-adapt-class");"toc-node"==a&&(e=d.firstChild,"\u25b8"!=e.textContent&&(e.textContent="\u25b8",u(e,"cursor","pointer"),e.addEventListener("click",xn,!1)));var g=d.ownerDocument.createElement("div");g.setAttribute("data-adapt-process-children","true");"toc-node"==f.toString()?(e=d.ownerDocument.createElement("div"),
e.textContent="\u25b9",u(e,"margin-left","-1em"),u(e,"display","inline-block"),u(e,"width","1em"),u(e,"text-align","left"),u(e,"cursor","default"),u(e,"font-family","Menlo,sans-serif"),g.appendChild(e),u(g,"overflow","hidden"),g.setAttribute("data-adapt-class","toc-node"),"toc-node"!=a&&"toc-container"!=a||u(g,"height","0px")):"toc-node"==a&&g.setAttribute("data-adapt-class","toc-container");return O(g)}};
vn.prototype.Yb=function(a,b,c,d,e){if(this.b)return O(this.b);var f=this,g=M("showTOC"),h=new aj(a);this.b=h;this.d.load(this.url).then(function(d){var l=f.d.b[d.url],n=dn(l,c,1E5,e);b=new pm(b.d,n.fontSize,b.root,n.width,n.height);var p=new en(l,d,f.lang,b,f.e,f.g,f.Bc(d),f.f);f.Ra=p;p.Q=f.Q;fn(p).then(function(){ln(p,h,null).then(function(){wn(f,a,2);Q(g,h)})})});return P(g)};
vn.prototype.Ub=function(){if(this.b){var a=this.b;this.Ra=this.b=null;u(a.J,"visibility","none");var b=a.J.parentNode;b&&b.removeChild(a.J)}};vn.prototype.Vc=function(){return!!this.b};function yn(){sn.call(this,zn(this));this.d=new Xe(Ji,!1);this.u=new Xe(af,!1);this.w={};this.Y={};this.k={};this.l={}}t(yn,sn);function zn(a){return function(b){return a.k[b]}}
function An(a,b,c){var d=M("loadEPUBDoc");c&&a.u.Rb(b+"?r=list");a.d.Rb(b+"META-INF/encryption.xml");a.d.load(b+"META-INF/container.xml").then(function(e){e=Ui(Ai(Ai(Ai(new Bi([e.b]),"container"),"rootfiles"),"rootfile"),"full-path");for(var f=0;f<e.length;f++){var g=e[f];if(g){Bn(a,b,g,c).ka(d);return}}Q(d,null)});return P(d)}
function Bn(a,b,c,d){var e=b+c,f=a.w[e];if(f)return O(f);var g=M("loadOPF");a.d.load(e).then(function(c){a.d.load(b+"META-INF/encryption.xml").then(function(k){(d?a.u.load(b+"?r=list"):O(null)).then(function(d){f=new Cn(a,b);Dn(f,c,k,d,b+"?r=manifest").then(function(){a.w[e]=f;a.Y[b]=f;Q(g,f)})})})});return P(g)}yn.prototype.load=function(a){a=ca(a);var b=this.l[a];return b?b.ua()?b:O(b.Pb()):yn.Ed.load.call(this,a)};
function En(){this.id=null;this.src="";this.g=this.d=null;this.D=-1;this.h=0;this.j=null;this.b=this.e=0;this.f=La}function Fn(a){return a.id}function Gn(a){var b=se(a);return function(a){var d=M("deobfuscator"),e,f;a.slice?(e=a.slice(0,1040),f=a.slice(1040,a.size)):(e=a.webkitSlice(0,1040),f=a.webkitSlice(1040,a.size-1040));We(e).then(function(a){a=new DataView(a);for(var c=0;c<a.byteLength;c++){var e=a.getUint8(c),e=e^b[c%20];a.setUint8(c,e)}Q(d,Ve([a,f]))});return P(d)}}
var Hn={dcterms:"http://purl.org/dc/terms/",marc:"http://id.loc.gov/vocabulary/",media:"http://www.idpf.org/epub/vocab/overlays/#",onix:"http://www.editeur.org/ONIX/book/codelists/current.html#",xsd:"http://www.w3.org/2001/XMLSchema#"},In=Hn.dcterms+"language",Jn=Hn.dcterms+"title";
function Kn(a,b){var c={};return function(d,e){var f,g,h=d.r||c,k=e.r||c;if(a==Jn&&(f="main"==h["http://idpf.org/epub/vocab/package/#title-type"],g="main"==k["http://idpf.org/epub/vocab/package/#title-type"],f!=g))return f?-1:1;f=parseInt(h["http://idpf.org/epub/vocab/package/#display-seq"],10);isNaN(f)&&(f=Number.MAX_VALUE);g=parseInt(k["http://idpf.org/epub/vocab/package/#display-seq"],10);isNaN(g)&&(g=Number.MAX_VALUE);return f!=g?f-g:a!=In&&b&&(f=(h[In]||h["http://idpf.org/epub/vocab/package/#alternate-script"])==
b,g=(k[In]||k["http://idpf.org/epub/vocab/package/#alternate-script"])==b,f!=g)?f?-1:1:d.o-e.o}}
function Ln(a,b){function c(a){for(var b in a){var d=a[b];d.sort(Kn(b,l));for(var e=0;e<d.length;e++){var f=d[e].r;f&&c(f)}}}function d(a){return Oa(a,function(a){return Na(a,function(a){var b={v:a.value,o:a.K};a.Td&&(b.s=a.scheme);if(a.id||a.lang){var c=k[a.id];if(c||a.lang)a.lang&&(a={name:In,value:a.lang,lang:null,id:null,Hc:a.id,scheme:null,K:a.K},c?c.push(a):c=[a]),c=Ma(c,function(a){return a.name}),b.r=d(c)}return b})})}function e(a){if(a&&(a=a.match(/^\s*(([^:]*):)?(\S+)\s*$/))){var b=a[1]?
f[a[1]]:"http://idpf.org/epub/vocab/package/#";if(b)return b+a[3]}return null}var f;if(b){f={};for(var g in Hn)f[g]=Hn[g];for(;null!=(g=b.match(/(^\s*[A-Z_a-z\u007F-\uFFFF][-.A-Z_a-z0-9\u007F-\uFFFF]*):\s*(\S+)/));)b=b.substr(g[0].length),f[g[1]]=g[2]}else f=Hn;var h=1;g=Si(Ti(a),function(a){if("meta"==a.localName){var b=e(a.getAttribute("property"));if(b)return{name:b,value:a.textContent,id:a.getAttribute("id"),K:h++,Hc:a.getAttribute("refines"),lang:null,scheme:e(a.getAttribute("scheme"))}}else if("http://purl.org/dc/elements/1.1/"==
a.namespaceURI)return{name:Hn.dcterms+a.localName,K:h++,lang:a.getAttribute("xml:lang"),value:a.textContent,id:a.getAttribute("id"),Hc:null,scheme:null};return null});var k=Ma(g,function(a){return a.Hc});g=d(Ma(g,function(a){return a.Hc?null:a.name}));var l=null;g[In]&&(l=g[In][0].v);c(g);return g}function Mn(){var a=window.MathJax;return a?a.Hub:null}var Nn={"appliaction/xhtml+xml":!0,"image/jpeg":!0,"image/png":!0,"image/svg+xml":!0,"image/gif":!0,"audio/mp3":!0};
function Cn(a,b){this.e=a;this.g=this.d=this.b=this.h=this.f=null;this.k=b;this.j=null;this.F={};this.lang=null;this.u=0;this.l={};this.H=this.B=this.P=null;this.w={};this.A=null;Mn()&&(Kg["http://www.w3.org/1998/Math/MathML"]=!0)}function On(a,b){return a.k?b.substr(0,a.k.length)==a.k?decodeURI(b.substr(a.k.length)):null:b}
function Dn(a,b,c,d,e){a.f=b;var f=Ai(new Bi([b.b]),"package"),g=Ui(f,"unique-identifier")[0];g&&(g=Hi(b,b.url+"#"+g))&&(a.j=g.textContent.replace(/[ \n\r\t]/g,""));var h={};a.h=Na(Pi(Ai(Ai(f,"manifest"),"item")),function(c){var d=new En,e=b.url;d.id=c.getAttribute("id");d.src=ea(c.getAttribute("href"),e);d.d=c.getAttribute("media-type");if(e=c.getAttribute("properties")){for(var e=e.split(/\s+/),f={},g=0;g<e.length;g++)f[e[g]]=!0;d.f=f}(c=c.getAttribute("fallback"))&&!Nn[d.d]&&(h[d.src]=c);!a.B&&
d.f.nav&&(a.B=d);!a.H&&d.f["cover-image"]&&(a.H=d);return d});a.d=Ka(a.h,Fn);a.g=Ka(a.h,function(b){return On(a,b.src)});for(var k in h)for(g=k;;){g=a.d[h[g]];if(!g)break;if(Nn[g.d]){a.w[k]=g.src;break}g=g.src}a.b=Na(Pi(Ai(Ai(f,"spine"),"itemref")),function(b,c){var d=b.getAttribute("idref");if(d=a.d[d])d.g=b,d.D=c;return d});if(k=Ui(Ai(f,"spine"),"toc")[0])a.P=a.d[k];if(k=Ui(Ai(f,"spine"),"page-progression-direction")[0]){a:switch(k){case "ltr":k="ltr";break a;case "rtl":k="rtl";break a;default:throw Error("unknown PageProgression: "+
k);}a.A=k}var g=Ui(Ai(Ai(Oi(Ai(Ai(new Bi([c.b]),"encryption"),"EncryptedData"),Ni()),"CipherData"),"CipherReference"),"URI"),l=Pi(Ai(Ai(f,"bindings"),"mediaType"));for(c=0;c<l.length;c++){var n=l[c].getAttribute("handler");(k=l[c].getAttribute("media-type"))&&n&&a.d[n]&&(a.F[k]=a.d[n].src)}a.l=Ln(Ai(f,"metadata"),Ui(f,"prefix")[0]);a.l[In]&&(a.lang=a.l[In][0].v);if(!d){if(0<g.length&&a.j)for(d=Gn(a.j),c=0;c<g.length;c++)a.e.k[a.k+g[c]]=d;return O(!0)}f=new Aa;l={};if(0<g.length&&a.j)for(k="1040:"+
te(a.j),c=0;c<g.length;c++)l[g[c]]=k;for(c=0;c<d.length;c++){var p=d[c];if(n=p.n){var r=decodeURI(n),g=a.g[r];k=null;g&&(g.j=0!=p.m,g.h=p.c,g.d&&(k=g.d.replace(/\s+/g,"")));g=l[r];if(k||g)f.append(n),f.append(" "),f.append(k||"application/octet-stream"),g&&(f.append(" "),f.append(g)),f.append("\n")}}Pn(a);return Ue(e,!1,"POST",f.toString(),"text/plain")}function Pn(a){for(var b=0,c=0;c<a.b.length;c++){var d=a.b[c],e=Math.ceil(d.h/1024);d.e=b;d.b=e;b+=e}a.u=b}
function Qn(a,b,c){var d=new En;d.D=0;d.id="item1";d.src=b;a.d={item1:d};a.g={};a.g[b]=d;a.h=[d];a.b=a.h;c?(a=a.e,d=M("EPUBDocStore.load"),b=ca(b),(a.l[b]=rn(a,{status:200,url:b,responseText:null,responseXML:c,Xb:null})).ka(d),c=P(d)):c=O(null);return c}function Rn(a,b,c){var d=a.b[b],e=M("getCFI");a.e.load(d.src).then(function(a){var b=Fi(a,c),h=null;b&&(a=Di(a,b,0,!1),h=new cb,gb(h,b,c-a),d.g&&gb(h,d.g,0),h=h.toString());Q(e,h)});return P(e)}
function Sn(a,b){return ze("resolveFragment",function(c){if(b){var d=new cb;db(d,b);var e;if(a.f){var f=eb(d,a.f.b);if(1!=f.xa.nodeType||f.I||!f.Db){Q(c,null);return}var g=f.xa,h=g.getAttribute("idref");if("itemref"!=g.localName||!h||!a.d[h]){Q(c,null);return}e=a.d[h];d=f.Db}else e=a.b[0];a.e.load(e.src).then(function(a){var b=eb(d,a.b);a=Di(a,b.xa,b.offset,b.I);Q(c,{D:e.D,ga:a,L:-1})})}else Q(c,null)},function(a){v("Error resolving fragment "+b);Q(a,null)})}
function Tn(a,b){return ze("resolveEPage",function(c){if(0>=b)Q(c,{D:0,ga:0,L:-1});else{var d=Ia(a.b.length,function(c){c=a.b[c];return c.e+c.b>b}),e=a.b[d];a.e.load(e.src).then(function(a){b-=e.e;b>e.b&&(b=e.b);var g=0;0<b&&(a=Ei(a),g=Math.round(a*b/e.b),g==a&&g--);Q(c,{D:d,ga:g,L:-1})})}},function(a){v("Error resolving epage: "+b);Q(a,null)})}
function Un(a,b){var c=a.b[b.D];if(0>=b.ga)return O(c.e);var d=M("getEPage");a.e.load(c.src).then(function(a){a=Ei(a);var f=Math.min(a,b.ga);Q(d,c.e+f*c.b/a)});return P(d)}function Vn(a,b,c,d){this.b=a;this.viewport=b;this.f=c;this.Eb=[];this.ga=this.L=this.D=0;this.Q=Qb(d);this.e=new om(b.d)}function Wn(a){var b=a.Eb[a.D];return b?b.Ya[a.L]:null}m=Vn.prototype;m.Xa=function(){if(this.b.A)return this.b.A;var a=this.Eb[this.D];return a?a.Ra.P:null};
function Xn(a){var b=M("renderPage");Yn(a).then(function(c){if(c){var d=-1;if(0>a.L){var d=a.ga,e=Ia(c.Da.length,function(a){return gn(c.Ra,c.Da[a])>d});a.L=e==c.Da.length?Number.POSITIVE_INFINITY:e-1}var f=c.Ya[a.L];f?(a.ga=f.offset,Q(b,f)):Re(function(b){if(a.L<c.Da.length)R(b);else if(c.complete)a.L=c.Da.length-1,R(b);else{var e=c.Da[c.Da.length-1],k=Zn(a,c,e);ln(c.Ra,k,e).then(function(l){k.J.style.display="none";k.J.style.visibility="visible";k.J.setAttribute("data-vivliostyle-page-side",k.f);
(e=l)?(c.Ya[e.d-1]=k,c.Da.push(e),0<=d&&gn(c.Ra,e)>d?(f=k,a.L=c.Da.length-2,R(b)):(k.j=0==c.item.D&&0==e.d-1,Te(b))):(c.Ya.push(k),f=k,a.L=c.Da.length-1,0>d&&(a.ga=k.offset),c.complete=!0,k.j=0==c.item.D&&0==a.L,k.k=c.item.D==a.b.b.length-1,R(b))})}}).then(function(){if(f=f||c.Ya[a.L])Q(b,f);else{var e=c.Da[a.L];0>d&&(a.ga=gn(c.Ra,e));var h=Zn(a,c,e);ln(c.Ra,h,e).then(function(d){h.J.style.display="none";h.J.style.visibility="visible";h.J.setAttribute("data-vivliostyle-page-side",h.f);(e=d)?(c.Ya[e.d-
1]=h,c.Da[a.L+1]=e):(c.Ya.push(h),c.complete=!0,h.k=c.item.D==a.b.b.length-1);h.j=0==c.item.D&&0==a.L;Q(b,h)})}})}else Q(b,null)});return P(b)}m.Ic=function(){var a=this,b=M("renderAllPages"),c=a.D,d=a.L,e=a.b.b.length;a.D=0;Re(function(b){a.L=Number.POSITIVE_INFINITY;Xn(a).then(function(){++a.D>=e?R(b):Te(b)})}).then(function(){a.D=c;a.L=d;Xn(a).ka(b)});return P(b)};m.sd=function(){this.L=this.D=0;return Xn(this)};m.ud=function(){this.D=this.b.b.length-1;this.L=Number.POSITIVE_INFINITY;return Xn(this)};
m.nextPage=function(){var a=this,b=M("nextPage");Yn(a).then(function(c){if(c){if(c.complete&&a.L==c.Da.length-1){if(a.D>=a.b.b.length-1){Q(b,null);return}a.D++;a.L=0}else a.L++;Xn(a).ka(b)}else Q(b,null)});return P(b)};m.Gc=function(){if(0==this.L){if(0==this.D)return O(null);this.D--;this.L=Number.POSITIVE_INFINITY}else this.L--;return Xn(this)};function $n(a,b){var c="left"===b.f,d="ltr"===a.Xa();return!c&&d||c&&!d}
function ao(a){var b=M("getCurrentSpread"),c=Wn(a);if(!c)return O({left:null,right:null});var d=a.D,e=a.L,f="left"===c.f;($n(a,c)?a.Gc():a.nextPage()).then(function(g){a.D=d;a.L=e;Xn(a).then(function(){f?Q(b,{left:c,right:g}):Q(b,{left:g,right:c})})});return P(b)}m.zd=function(){var a=Wn(this);if(!a)return O(null);var a=$n(this,a),b=this.nextPage();if(a)return b;var c=this;return b.fc(function(){return c.nextPage()})};
m.Cd=function(){var a=Wn(this);if(!a)return O(null);var a=$n(this,a),b=this.Gc();if(a){var c=this;return b.fc(function(){return c.Gc()})}return b};function bo(a,b){var c=M("navigateToEPage");Tn(a.b,b).then(function(b){b&&(a.D=b.D,a.L=b.L,a.ga=b.ga);Xn(a).ka(c)});return P(c)}function co(a,b){var c=M("navigateToCFI");Sn(a.b,b).then(function(b){b&&(a.D=b.D,a.L=b.L,a.ga=b.ga);Xn(a).ka(c)});return P(c)}
function eo(a,b){v("Navigate to "+b);var c=On(a.b,ca(b));if(null==c&&(a.b.f&&b.match(/^#epubcfi\(/)&&(c=On(a.b,a.b.f.url)),null==c))return O(null);var d=a.b.g[c];if(!d)return a.b.f&&c==On(a.b,a.b.f.url)&&(c=b.indexOf("#"),0<=c)?co(a,b.substr(c+1)):O(null);d.D!=a.D&&(a.D=d.D,a.L=0);var e=M("navigateTo");Yn(a).then(function(c){var d=Hi(c.X,b);d&&(a.ga=Ci(c.X,d),a.L=-1);Xn(a).ka(e)});return P(e)}
function Zn(a,b,c){var d=b.Ra.viewport,e=d.b.createElement("div");d.e.appendChild(e);e.style.position="relative";e.style.visibility="hidden";e.style.left="0px";e.style.top="0px";var f=new aj(e);f.D=b.item.D;f.position=c;f.offset=gn(b.Ra,c);d!==a.viewport&&(a=Tb(a.viewport.width,a.viewport.height,d.width,d.height),a=If(null,new Nb(a)),f.g.push(new Yi(e,"transform",a)));return f}
function fo(a,b){var c=Mn();if(c){var d=b.ownerDocument,e=d.createElement("span");b.appendChild(e);d=d.importNode(a,!0);e.appendChild(d);d=c.queue;d.Push(["Typeset",c,e]);var c=M("navigateToEPage"),f=Ke(c);d.Push(function(){f.Sa(e)});return P(c)}return O(null)}
m.Bc=function(a){var b=this;return function(c,d){var e;if("object"==c.localName&&"http://www.w3.org/1999/xhtml"==c.namespaceURI){var f=c.getAttribute("data");e=null;if(f){var f=ea(f,a.url),g=c.getAttribute("media-type");if(!g){var h=On(b.b,f);h&&(h=b.b.g[h])&&(g=h.d)}if(g&&(h=b.b.F[g])){e=b.viewport.b.createElement("iframe");e.style.border="none";var f=Ea(f),k=Ea(g),g=new Aa;g.append(h);g.append("?src=");g.append(f);g.append("&type=");g.append(k);for(h=c.firstChild;h;h=h.nextSibling)1==h.nodeType&&
(k=h,"param"==k.localName&&"http://www.w3.org/1999/xhtml"==k.namespaceURI&&(f=k.getAttribute("name"),k=k.getAttribute("value"),f&&k&&(g.append("&"),g.append(encodeURIComponent(f)),g.append("="),g.append(encodeURIComponent(k)))));e.setAttribute("src",g.toString());(g=c.getAttribute("width"))&&e.setAttribute("width",g);(g=c.getAttribute("height"))&&e.setAttribute("height",g)}}e||(e=b.viewport.b.createElement("span"),e.setAttribute("data-adapt-process-children","true"));e=O(e)}else if("http://www.w3.org/1998/Math/MathML"==
c.namespaceURI)e=fo(c,d);else if("http://example.com/sse"==c.namespaceURI){e=d?d.ownerDocument:b.viewport.b;g=c.localName;switch(g){case "t":case "tab":case "ec":case "nt":case "fraction":case "comment":case "mark":g="span";break;case "ruby":case "rp":case "rt":break;default:g="div"}e=e.createElement(g);e.setAttribute("data-adapt-process-children","true");e=O(e)}else e=O(null);return e}};
function Yn(a){if(a.D>=a.b.b.length)return O(null);var b=a.Eb[a.D];if(b)return O(b);var c=a.b.b[a.D],d=a.b.e,e=M("getPageViewItem");d.load(c.src).then(function(f){0==c.b&&1==a.b.b.length&&(c.b=Math.ceil(Ei(f)/2700),a.b.u=c.b);var g=d.b[f.url],h=a.Bc(f),k=a.viewport,l=dn(g,k.width,k.height,k.fontSize);if(l.width!=k.width||l.height!=k.height||l.fontSize!=k.fontSize)k=new pm(k.d,l.fontSize,k.root,l.width,l.height);var n=new en(g,f,a.b.lang,k,a.e,a.f,h,a.b.w);n.Q=a.Q;fn(n).then(function(){b={item:c,X:f,
Ra:n,Da:[null],Ya:[],complete:!1};a.Eb[a.D]=b;Q(e,b)})});return P(e)}function go(a){return{D:a.D,L:a.L,ga:a.ga}}function ho(a,b){b?(a.D=b.D,a.L=-1,a.ga=b.ga):(a.D=0,a.L=0,a.ga=0);return Xn(a)}
m.Yb=function(){var a=this.b,b=a.B||a.P;if(!b)return O(null);var c=M("showTOC");this.d||(this.d=new vn(a.e,b.src,a.lang,this.e,this.f,this.Q,this,a.w));var a=this.viewport,b=Math.min(350,Math.round(.67*a.width)-16),d=a.height-6,e=a.b.createElement("div");a.root.appendChild(e);e.style.position="absolute";e.style.visibility="hidden";e.style.left="3px";e.style.top="3px";e.style.width=b+10+"px";e.style.maxHeight=d+"px";e.style.overflow="scroll";e.style.overflowX="hidden";e.style.background="#EEE";e.style.border=
"1px outset #999";e.style.borderRadius="2px";e.style.boxShadow=" 5px 5px rgba(128,128,128,0.3)";this.d.Yb(e,a,b,d,this.viewport.fontSize).then(function(a){e.style.visibility="visible";Q(c,a)});return P(c)};m.Ub=function(){this.d&&this.d.Ub()};m.Vc=function(){return this.d&&this.d.Vc()};function io(a,b,c,d){var e=this;this.j=a;this.ad=b;b.setAttribute("data-vivliostyle-viewer-viewport",!0);this.ib=c;this.fb=d;this.la=new vi(a.document.head,b);this.A="";this.g=null;this.H=this.d=!1;this.f=this.k=this.e=this.u=null;this.fontSize=16;this.h=1;this.Y=!1;this.Ic=!0;this.Q=Pb();this.F=function(){};this.l=function(){};this.P=function(){e.d=!0;e.F()};this.w=function(){};this.ba={loadEPUB:this.ra,loadXML:this.va,configure:this.B,moveTo:this.Oa,toc:this.Yb}}
function jo(a,b){b.i=a.ib;a.fb(b)}io.prototype.ra=function(a){var b=a.url,c=a.fragment,d=!!a.zipmeta,e=a.userStyleSheet;this.viewport=null;var f=M("loadEPUB"),g=this;g.B(a).then(function(){var a=new yn;if(e)for(var k=0;k<e.length;k++)un(a,e[k]);tn(a).then(function(){var e=ea(b,g.j.location.href);g.A=e;An(a,e,d).then(function(a){g.g=a;Sn(g.g,c).then(function(a){g.f=a;ko(g).then(function(){jo(g,{t:"loaded",metadata:g.g.l});Q(f,!0)})})})})});return P(f)};
io.prototype.va=function(a){var b=a.url,c=a.document,d=a.fragment,e=a.userStyleSheet;this.viewport=null;var f=M("loadXML"),g=this;g.B(a).then(function(){var a=new yn;if(e)for(var k=0;k<e.length;k++)un(a,e[k]);tn(a).then(function(){var e=ea(b,g.j.location.href);g.A=e;g.g=new Cn(a,"");Qn(g.g,e,c).then(function(){Sn(g.g,d).then(function(a){g.f=a;ko(g).then(function(){jo(g,{t:"loaded"});Q(f,!0)})})})})});return P(f)};
function lo(a,b){var c=parseFloat(b),d=/[a-z]+$/,e;if("string"===typeof b&&(e=b.match(d))){d=e[0];if("em"===d||"rem"===d)return c*a.fontSize;if("ex"===d||"rex"===d)return c*dc.ex*a.fontSize/dc.em;if(d=dc[d])return c*d}return c}
io.prototype.B=function(a){"boolean"==typeof a.autoresize&&(a.autoresize?(this.u=null,this.j.addEventListener("resize",this.P,!1),this.d=!0):this.j.removeEventListener("resize",this.P,!1));if("number"==typeof a.fontSize){var b=a.fontSize;5<=b&&72>=b&&this.fontSize!=b&&(this.fontSize=b,this.d=!0)}"object"==typeof a.viewport&&a.viewport&&(b=a.viewport,b={marginLeft:lo(this,b["margin-left"])||0,marginRight:lo(this,b["margin-right"])||0,marginTop:lo(this,b["margin-top"])||0,marginBottom:lo(this,b["margin-bottom"])||
0,width:lo(this,b.width)||0,height:lo(this,b.height)||0},200<=b.width||200<=b.height)&&(this.j.removeEventListener("resize",this.P,!1),this.u=b,this.d=!0);"boolean"==typeof a.hyphenate&&(this.Q.wc=a.hyphenate,this.d=!0);"boolean"==typeof a.horizontal&&(this.Q.vc=a.horizontal,this.d=!0);"boolean"==typeof a.nightMode&&(this.Q.Dc=a.nightMode,this.d=!0);"number"==typeof a.lineHeight&&(this.Q.lineHeight=a.lineHeight,this.d=!0);"number"==typeof a.columnWidth&&(this.Q.sc=a.columnWidth,this.d=!0);"string"==
typeof a.fontFamily&&(this.Q.fontFamily=a.fontFamily,this.d=!0);"boolean"==typeof a.load&&(this.Y=a.load);"boolean"==typeof a.renderAllPages&&(this.Ic=a.renderAllPages);"string"==typeof a.userAgentRootURL&&(da=a.userAgentRootURL);"boolean"==typeof a.spreadView&&a.spreadView!==this.Q.Ta&&(this.viewport=null,this.Q.Ta=a.spreadView,this.d=!0);"number"==typeof a.pageBorder&&a.pageBorder!==this.Q.zb&&(this.viewport=null,this.Q.zb=a.pageBorder,this.d=!0);"number"==typeof a.zoom&&a.zoom!==this.h&&(this.h=
a.zoom,this.H=!0);return O(!0)};function mo(a){var b=[];a.e&&(b.push(a.e),a.e=null);a.k&&(b.push(a.k.left),b.push(a.k.right),a.k=null);b.forEach(function(a){a&&(u(a.J,"display","none"),a.removeEventListener("hyperlink",this.w,!1))},a)}function no(a,b){b.addEventListener("hyperlink",a.w,!1);u(b.J,"visibility","visible");u(b.J,"display","block")}function oo(a,b){mo(a);a.e=b;no(a,b)}
function po(a){var b=M("reportPosition");a.f||(a.f=go(a.b));Rn(a.g,a.f.D,a.f.ga).then(function(c){var d=a.e;(a.Y&&0<d.e.length?Vf(d.e):O(!0)).then(function(){qo(a,d,c).ka(b)})});return P(b)}function ro(a){var b=a.ad;if(a.u){var c=a.u;b.style.marginLeft=c.marginLeft+"px";b.style.marginRight=c.marginRight+"px";b.style.marginTop=c.marginTop+"px";b.style.marginBottom=c.marginBottom+"px";return new pm(a.j,a.fontSize,b,c.width,c.height)}return new pm(a.j,a.fontSize,b)}
function so(a){if(a.u||!a.viewport||a.viewport.fontSize!=a.fontSize)return!1;var b=ro(a);if(!(b=b.width==a.viewport.width&&b.height==a.viewport.height)&&(b=a.b)){a:{a=a.b.Eb;for(b=0;b<a.length;b++){var c=a[b];if(c)for(var c=c.Ya,d=0;d<c.length;d++){var e=c[d];if(e.A&&e.w){a=!0;break a}}}a=!1}b=!a}return b}
function to(a){if(a.b){a.b.Ub();for(var b=a.b.Eb,c=0;c<b.length;c++){var d=b[c];if(d)for(var d=d.Ya,e;e=d.shift();)e=e.J,e.parentNode.removeChild(e)}}a.viewport=ro(a);b=a.viewport.e;u(b,"width","");u(b,"height","");a.b=new Vn(a.g,a.viewport,a.la,a.Q)}
function uo(a,b){a.H=!1;if(a.Q.Ta)return ao(a.b).fc(function(c){mo(a);a.k=c;c.left&&(no(a,c.left),c.right||c.left.J.setAttribute("data-vivliostyle-unpaired-page",!0));c.right&&(no(a,c.right),c.left||c.right.J.setAttribute("data-vivliostyle-unpaired-page",!0));var d=vo(a,c);qm(a.viewport,d.width*a.h,d.height*a.h);c.left&&ej(c.left,a.h);c.right&&ej(c.right,a.h);a.e=b;return O(null)});oo(a,b);wo(a,b);a.e=b;return O(null)}function wo(a,b){qm(a.viewport,b.b.width*a.h,b.b.height*a.h);ej(b,a.h)}
function vo(a,b){var c=0,d=0;b.left&&(c+=b.left.b.width,d=b.left.b.height);b.right&&(c+=b.right.b.width,d=Math.max(d,b.right.b.height));b.left&&b.right&&(c+=2*a.Q.zb);return{width:c,height:d}}var xo={Jd:"fit inside viewport"};
function ko(a){a.d=!1;if(so(a))return O(!0);jo(a,{t:"resizestart"});var b=M("resize");a.b&&!a.f&&(a.f=go(a.b));to(a);ho(a.b,a.f).then(function(c){uo(a,c).then(function(){po(a).then(function(c){(a.Ic?a.b.Ic():O(null)).then(function(){jo(a,{t:"resizeend"});Q(b,c)})})})});return P(b)}function qo(a,b,c){var d=M("sendLocationNotification"),e={t:"nav",first:b.j,last:b.k};Un(a.g,a.f).then(function(b){e.epage=b;e.epageCount=a.g.u;c&&(e.cfi=c);jo(a,e);Q(d,!0)});return P(d)}
io.prototype.Xa=function(){return this.b?this.b.Xa():null};
io.prototype.Oa=function(a){var b=this;if("string"==typeof a.where)switch(a.where){case "next":a=this.Q.Ta?this.b.zd:this.b.nextPage;break;case "previous":a=this.Q.Ta?this.b.Cd:this.b.Gc;break;case "last":a=this.b.ud;break;case "first":a=this.b.sd;break;default:return O(!0)}else if("number"==typeof a.epage){var c=a.epage;a=function(){return bo(b.b,c)}}else if("string"==typeof a.url){var d=a.url;a=function(){return eo(b.b,d)}}else return O(!0);var e=M("nextPage");a.call(b.b).then(function(a){a?(b.f=
null,uo(b,a).then(function(){po(b).ka(e)})):Q(e,!0)});return P(e)};io.prototype.Yb=function(a){var b=!!a.autohide;a=a.v;var c=this.b.Vc();if(c){if("show"==a)return O(!0)}else if("hide"==a)return O(!0);if(c)return this.b.Ub(),O(!0);var d=this,e=M("showTOC");this.b.Yb(b).then(function(a){if(a){if(b){var c=function(){d.b.Ub()};a.addEventListener("hyperlink",c,!1);a.J.addEventListener("click",c,!1)}a.addEventListener("hyperlink",d.w,!1)}Q(e,!0)});return P(e)};
function yo(a,b){var c=b.a||"";return ze("runCommand",function(d){var e=a.ba[c];e?e.call(a,b).then(function(){jo(a,{t:"done",a:c});Q(d,!0)}):(jo(a,{t:"error",content:"No such action",a:c}),Q(d,!0))},function(b,e){jo(a,{t:"error",content:e.toString(),a:c});Q(b,!0)})}function zo(a){return"string"==typeof a?JSON.parse(a):a}
function Ao(a,b){var c=zo(b),d=null;Be(function(){var b=M("commandLoop"),f=ue.d;a.w=function(b){var c={t:"hyperlink",href:b.href,internal:b.href.substr(0,a.A.length)==a.A};Ce(f,function(){jo(a,c);return O(!0)})};Re(function(b){if(a.d)ko(a).then(function(){Te(b)});else if(a.H)a.e&&uo(a,a.e).then(function(){Te(b)});else if(c){var e=c;c=null;yo(a,e).then(function(){Te(b)})}else e=M("waitForCommand"),d=Ke(e,self),P(e).then(function(){Te(b)})}).ka(b);return P(b)});a.F=function(){var a=d;a&&(d=null,a.Sa())};
a.l=function(b){if(c)return!1;c=zo(b);a.F();return!0};a.j.adapt_command=a.l};Object.Tb||(Object.Tb=function(a,b){Object.keys(b).forEach(function(c){a[c]=b[c]});return a});function Bo(a){var b={};Object.keys(a).forEach(function(c){var d=a[c];switch(c){case "autoResize":b.autoresize=d;break;case "pageBorderWidth":b.pageBorder=d;break;default:b[c]=d}});return b}function Co(a,b){this.f=a;this.b=new io(a.window||window,a.viewportElement,"main",this.rd.bind(this));this.e={autoResize:!0,fontSize:16,pageBorderWidth:1,renderAllPages:!0,spreadView:!1,zoom:1};b&&this.od(b);this.d=new Pa}m=Co.prototype;
m.od=function(a){var b=Object.Tb({a:"configure"},Bo(a));this.b.l(b);Object.Tb(this.e,a)};m.rd=function(a){var b={type:a.t};Object.keys(a).forEach(function(c){"t"!==c&&(b[c]=a[c])});Qa(this.d,b)};m.Fd=function(a,b){this.d.addEventListener(a,b,!1)};m.Id=function(a,b){this.d.removeEventListener(a,b,!1)};m.vd=function(a,b,c){a||Qa(this.d,{type:"error",content:"No URL specified"});Do(this,a,null,b,c)};m.Gd=function(a,b,c){a||Qa(this.d,{type:"error",content:"No URL specified"});Do(this,null,a,b,c)};
function Do(a,b,c,d,e){d=d||{};var f,g=d.userStyleSheet;g&&(f=g.map(function(a){return{url:a.url||null,text:a.text||null}}));e&&Object.Tb(a.e,e);b=Object.Tb({a:b?"loadXML":"loadEPUB",userAgentRootURL:a.f.userAgentRootURL,url:b||c,document:d.documentObject,fragment:d.fragment,userStyleSheet:f},Bo(a.e));Ao(a.b,b)}m.Xa=function(){return this.b.Xa()};
m.xd=function(a){a:switch(a){case "left":a="ltr"===this.Xa()?"previous":"next";break a;case "right":a="ltr"===this.Xa()?"next":"previous";break a}this.b.l({a:"moveTo",where:a})};m.wd=function(a){this.b.l({a:"moveTo",url:a})};m.Hd=function(a){var b;a:{b=this.b;if(!b.e)throw Error("no page exists.");switch(a){case "fit inside viewport":a=b.Q.Ta?vo(b,b.k):b.e.b;b=Math.min(b.viewport.width/a.width,b.viewport.height/a.height);break a;default:throw Error("unknown zoom type: "+a);}}return b};
ba("vivliostyle.viewer.Viewer",Co);Co.prototype.setOptions=Co.prototype.od;Co.prototype.addListener=Co.prototype.Fd;Co.prototype.removeListener=Co.prototype.Id;Co.prototype.loadDocument=Co.prototype.vd;Co.prototype.loadEPUB=Co.prototype.Gd;Co.prototype.getCurrentPageProgression=Co.prototype.Xa;Co.prototype.navigateToPage=Co.prototype.xd;Co.prototype.navigateToInternalUrl=Co.prototype.wd;Co.prototype.queryZoomFactor=Co.prototype.Hd;ba("vivliostyle.viewer.ZoomType",xo);xo.FIT_INSIDE_VIEWPORT="fit inside viewport";var Eo=16,Fo="ltr";function Go(a){window.adapt_command(a)}function Ho(){Go({a:"moveTo",where:"ltr"===Fo?"previous":"next"})}function Io(){Go({a:"moveTo",where:"ltr"===Fo?"next":"previous"})}
function Jo(a){var b=a.key,c=a.keyIdentifier,d=a.location;if("End"===b||"End"===c)Go({a:"moveTo",where:"last"}),a.preventDefault();else if("Home"===b||"Home"===c)Go({a:"moveTo",where:"first"}),a.preventDefault();else if("ArrowUp"===b||"Up"===b||"Up"===c)Go({a:"moveTo",where:"previous"}),a.preventDefault();else if("ArrowDown"===b||"Down"===b||"Down"===c)Go({a:"moveTo",where:"next"}),a.preventDefault();else if("ArrowRight"===b||"Right"===b||"Right"===c)Io(),a.preventDefault();else if("ArrowLeft"===
b||"Left"===b||"Left"===c)Ho(),a.preventDefault();else if("0"===b||"U+0030"===c)Go({a:"configure",fontSize:Math.round(Eo)}),a.preventDefault();else if("t"===b||"U+0054"===c)Go({a:"toc",v:"toggle",autohide:!0}),a.preventDefault();else if("+"===b||"Add"===b||"U+002B"===c||"U+00BB"===c||"U+004B"===c&&d===KeyboardEvent.b)Eo*=1.2,Go({a:"configure",fontSize:Math.round(Eo)}),a.preventDefault();else if("-"===b||"Subtract"===b||"U+002D"===c||"U+00BD"===c||"U+004D"===c&&d===KeyboardEvent.b)Eo/=1.2,Go({a:"configure",
fontSize:Math.round(Eo)}),a.preventDefault()}
function Ko(a){switch(a.t){case "loaded":a=a.viewer;var b=Fo=a.Xa();a.ad.setAttribute("data-vivliostyle-page-progression",b);a.ad.setAttribute("data-vivliostyle-spread-view",a.Q.Ta);window.addEventListener("keydown",Jo,!1);document.body.setAttribute("data-vivliostyle-viewer-status","complete");a=document.getElementById("vivliostyle-page-navigation-left");a.addEventListener("click",Ho,!1);b=document.getElementById("vivliostyle-page-navigation-right");b.addEventListener("click",Io,!1);[a,b].forEach(function(a){a.setAttribute("data-vivliostyle-ui-state",
"attention");window.setTimeout(function(){a.removeAttribute("data-vivliostyle-ui-state")},1E3)});break;case "error":v("Error: "+a.content);break;case "nav":(a=a.cfi)&&location.replace(ha(location.href,Ea(a||"")));break;case "hyperlink":a.internal&&Go({a:"moveTo",url:a.href})}}
ba("vivliostyle.viewerapp.main",function(a){var b=a&&a.fragment||fa("f"),c=a&&a.epubURL||fa("b"),d=a&&a.xmlURL||fa("x"),e=a&&a.defaultPageWidth||fa("w"),f=a&&a.defaultPageHeight||fa("h"),g=a&&a.defaultPageSize||fa("size"),h=a&&a.orientation||fa("orientation"),k=fa("spread"),k=a&&a.spreadView||!!k&&"false"!=k,l=a&&a.viewportElement||document.body;a={a:c?"loadEPUB":"loadXML",url:c||d,autoresize:!0,fragment:b,renderAllPages:!0,userAgentRootURL:a&&a.uaRoot||null,document:a&&a.document||null,userStyleSheet:a&&
a.userStyleSheet||null,spreadView:k,pageBorder:1};var n;if(e&&f)n=e+" "+f;else{switch(g){case "A5":e="148mm";f="210mm";break;case "A4":e="210mm";f="297mm";break;case "A3":e="297mm";f="420mm";break;case "B5":e="176mm";f="250mm";break;case "B4":e="250mm";f="353mm";break;case "letter":e="8.5in";f="11in";break;case "legal":e="8.5in";f="14in";break;case "ledger":e="11in",f="17in"}e&&f&&(n=g,"landscape"===h&&(n=n?n+" landscape":null,g=e,e=f,f=g))}e&&f&&(a.viewport={width:e,height:f},g=document.createElement("style"),
g.textContent="@page { size: "+n+"; margin: 0; }",document.head.appendChild(g));Ao(new io(window,l,"main",Ko),a)});
    return enclosingObject.vivliostyle;
}.bind(window));

},{}],3:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var supportTouchEvents = ("ontouchstart" in window);

_knockout2["default"].bindingHandlers.menuButton = {
    init: function init(element, valueAccessor) {
        if (_knockout2["default"].unwrap(valueAccessor())) {
            if (supportTouchEvents) {
                element.addEventListener("touchstart", function () {
                    _knockout2["default"].utils.toggleDomNodeCssClass(element, "hover active", true);
                });
                element.addEventListener("touchend", function () {
                    _knockout2["default"].utils.toggleDomNodeCssClass(element, "hover active", false);
                });
            } else {
                element.addEventListener("mouseover", function () {
                    _knockout2["default"].utils.toggleDomNodeCssClass(element, "hover", true);
                });
                element.addEventListener("mousedown", function () {
                    _knockout2["default"].utils.toggleDomNodeCssClass(element, "active", true);
                });
                element.addEventListener("mouseup", function () {
                    _knockout2["default"].utils.toggleDomNodeCssClass(element, "active", false);
                });
                element.addEventListener("mouseout", function () {
                    _knockout2["default"].utils.toggleDomNodeCssClass(element, "hover", false);
                });
            }
        }
    }
};

},{"knockout":1}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
function Logger() {
    this.console = window.console;
}

Logger.prototype.log = function () {
    if (this.console) {
        if (typeof this.console.log === "function") {
            this.console.log.apply(this.console, arguments);
        }
    }
};

Logger.prototype.error = function () {
    if (this.console) {
        if (typeof this.console.error === "function") {
            this.console.error.apply(this.console, arguments);
        } else {
            this.log.apply(this, arguments);
        }
    }
};

exports["default"] = new Logger();
module.exports = exports["default"];

},{}],5:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _vivliostyle = require("vivliostyle");

var _vivliostyle2 = _interopRequireDefault(_vivliostyle);

var _modelsVivliostyle = require("./models/vivliostyle");

var _modelsVivliostyle2 = _interopRequireDefault(_modelsVivliostyle);

var _vivliostyleViewer = require("./vivliostyle-viewer");

var _vivliostyleViewer2 = _interopRequireDefault(_vivliostyleViewer);

_modelsVivliostyle2["default"].setInstance(_vivliostyle2["default"]);
_vivliostyleViewer2["default"].start();

},{"./models/vivliostyle":9,"./vivliostyle-viewer":18,"vivliostyle":2}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var _storesUrlParameters = require("../stores/url-parameters");

var _storesUrlParameters2 = _interopRequireDefault(_storesUrlParameters);

var _pageSize = require("./page-size");

var _pageSize2 = _interopRequireDefault(_pageSize);

function getDocumentOptionsFromURL() {
    return {
        epubUrl: _storesUrlParameters2["default"].getParameter("b"),
        url: _storesUrlParameters2["default"].getParameter("x"),
        fragment: _storesUrlParameters2["default"].getParameter("f")
    };
}

function DocumentOptions() {
    var urlOptions = getDocumentOptionsFromURL();
    this.epubUrl = _knockout2["default"].observable(urlOptions.epubUrl || "");
    this.url = _knockout2["default"].observable(urlOptions.url || "");
    this.fragment = _knockout2["default"].observable(urlOptions.fragment || "");
    this.pageSize = new _pageSize2["default"]();

    // write fragment back to URL when updated
    this.fragment.subscribe(function (fragment) {
        var encoded = fragment.replace(/[\s+&?=#\u007F-\uFFFF]+/g, encodeURIComponent);
        _storesUrlParameters2["default"].setParameter("f", encoded);
    });
}

DocumentOptions.prototype.toObject = function () {
    // Do not include url
    // (url is a required argument to Viewer.loadDocument, separated from other options)
    return {
        fragment: this.fragment(),
        userStyleSheet: [{
            text: "@page {" + this.pageSize.toCSSDeclarationString() + "}"
        }]
    };
};

exports["default"] = DocumentOptions;
module.exports = exports["default"];

},{"../stores/url-parameters":10,"./page-size":7,"knockout":1}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var Mode = {
    AUTO: "auto",
    PRESET: "preset",
    CUSTOM: "custom"
};

var PresetSize = [{ name: "A5", description: "A5" }, { name: "A4", description: "A4" }, { name: "A3", description: "A3" }, { name: "B5", description: "B5 (ISO)" }, { name: "B4", description: "B4 (ISO)" }, { name: "letter", description: "letter" }, { name: "legal", description: "legal" }, { name: "ledger", description: "ledger" }];

function PageSize(pageSize) {
    this.mode = _knockout2["default"].observable(Mode.AUTO);
    this.presetSize = _knockout2["default"].observable(PresetSize[0]);
    this.isLandscape = _knockout2["default"].observable(false);
    this.customWidth = _knockout2["default"].observable("210mm");
    this.customHeight = _knockout2["default"].observable("297mm");
    this.isImportant = _knockout2["default"].observable(false);
    if (pageSize) {
        this.copyFrom(pageSize);
    }
}

PageSize.Mode = Mode;
PageSize.PresetSize = PageSize.prototype.PresetSize = PresetSize;

PageSize.prototype.copyFrom = function (other) {
    this.mode(other.mode());
    this.presetSize(other.presetSize());
    this.isLandscape(other.isLandscape());
    this.customWidth(other.customWidth());
    this.customHeight(other.customHeight());
    this.isImportant(other.isImportant());
};

PageSize.prototype.equivalentTo = function (other) {
    if (this.isImportant() !== other.isImportant()) {
        return false;
    }
    var mode = this.mode();
    if (other.mode() === mode) {
        switch (mode) {
            case Mode.AUTO:
                return true;
            case Mode.PRESET:
                return this.presetSize() === other.presetSize() && this.isLandscape() === other.isLandscape();
            case Mode.CUSTOM:
                return this.customWidth() === other.customWidth() && this.customHeight() === other.customHeight();
            default:
                throw new Error("Unknown mode " + mode);
        }
    } else {
        return false;
    }
};

PageSize.prototype.toCSSDeclarationString = function () {
    var declaration = "size: ";
    switch (this.mode()) {
        case Mode.AUTO:
            declaration += "auto";
            break;
        case Mode.PRESET:
            declaration += this.presetSize().name;
            if (this.isLandscape()) {
                declaration += " landscape";
            }
            break;
        case Mode.CUSTOM:
            declaration += this.customWidth() + " " + this.customHeight();
            break;
        default:
            throw new Error("Unknown mode " + this.mode());
    }

    if (this.isImportant()) {
        declaration += " !important";
    }

    return declaration + ";";
};

exports["default"] = PageSize;
module.exports = exports["default"];

},{"knockout":1}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var _storesUrlParameters = require("../stores/url-parameters");

var _storesUrlParameters2 = _interopRequireDefault(_storesUrlParameters);

function getViewerOptionsFromURL() {
    return {
        spreadView: _storesUrlParameters2["default"].getParameter("spread") === "true"
    };
}

function getDefaultValues() {
    return {
        fontSize: 16,
        spreadView: false,
        zoom: 1
    };
}

function ViewerOptions(options) {
    this.fontSize = _knockout2["default"].observable();
    this.spreadView = _knockout2["default"].observable();
    this.zoom = _knockout2["default"].observable();
    if (options) {
        this.copyFrom(options);
    } else {
        var defaultValues = getDefaultValues();
        var urlOptions = getViewerOptionsFromURL();
        this.fontSize(defaultValues.fontSize);
        this.spreadView(urlOptions.spreadView || defaultValues.spreadView);
        this.zoom(defaultValues.zoom);
    }
}

ViewerOptions.prototype.copyFrom = function (other) {
    this.fontSize(other.fontSize());
    this.spreadView(other.spreadView());
    this.zoom(other.zoom());
};

ViewerOptions.prototype.toObject = function () {
    return {
        fontSize: this.fontSize(),
        spreadView: this.spreadView(),
        zoom: this.zoom()
    };
};

ViewerOptions.getDefaultValues = getDefaultValues;

exports["default"] = ViewerOptions;
module.exports = exports["default"];

},{"../stores/url-parameters":10,"knockout":1}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
function Vivliostyle() {
    this.viewer = null;
    this.constants = null;
}

Vivliostyle.prototype.setInstance = function (vivliostyle) {
    this.viewer = vivliostyle.viewer;
    this.constants = vivliostyle.constants;
};

exports["default"] = new Vivliostyle();
module.exports = exports["default"];

},{}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _utilsStringUtil = require("../utils/string-util");

var _utilsStringUtil2 = _interopRequireDefault(_utilsStringUtil);

function getRegExpForParameter(name) {
    return new RegExp("[#&]" + _utilsStringUtil2["default"].escapeUnicodeString(name) + "=([^&]*)");
}

function URLParameterStore() {
    this.history = window ? window.history : {};
    this.location = window ? window.location : { url: "" };
}

URLParameterStore.prototype.getParameter = function (name) {
    var url = this.location.href;
    var regexp = getRegExpForParameter(name);
    var r = url.match(regexp);
    if (r) {
        return r[1];
    } else {
        return null;
    }
};

URLParameterStore.prototype.setParameter = function (name, value) {
    var url = this.location.href;
    var updated;
    var regexp = getRegExpForParameter(name);
    var r = url.match(regexp);
    if (r) {
        var l = r[1].length;
        var start = r.index + r[0].length - l;
        updated = url.substring(0, start) + value + url.substring(start + l);
    } else {
        updated = url + (url.match(/#/) ? "&" : "#") + name + "=" + value;
    }
    if (this.history.replaceState) {
        this.history.replaceState(null, "", updated);
    } else {
        this.location.href = updated;
    }
};

exports["default"] = new URLParameterStore();
module.exports = exports["default"];

},{"../utils/string-util":13}],11:[function(require,module,exports){
// cf. http://www.w3.org/TR/DOM-Level-3-Events-key/
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var Keys = {
    Unidentified: "Unidentified",
    ArrowDown: "ArrowDown",
    ArrowLeft: "ArrowLeft",
    ArrowRight: "ArrowRight",
    ArrowUp: "ArrowUp",
    Home: "Home",
    End: "End",
    PageDown: "PageDown",
    PageUp: "PageUp",
    Escape: "Escape"
};

// CAUTION: This function covers only part of common keys on a keyboard. Keys not covered by the implementation are identified as KeyboardEvent.key, KeyboardEvent.keyIdentifier, or "Unidentified".
function identifyKeyFromEvent(event) {
    var key = event.key;
    var keyIdentifier = event.keyIdentifier;
    var location = event.location;
    if (key === Keys.ArrowDown || key === "Down" || keyIdentifier === "Down") {
        return Keys.ArrowDown;
    } else if (key === Keys.ArrowLeft || key === "Left" || keyIdentifier === "Left") {
        return Keys.ArrowLeft;
    } else if (key === Keys.ArrowRight || key === "Right" || keyIdentifier === "Right") {
        return Keys.ArrowRight;
    } else if (key === Keys.ArrowUp || key === "Up" || keyIdentifier === "Up") {
        return Keys.ArrowUp;
    } else if (key === Keys.Escape || key === "Esc" || keyIdentifier === "U+001B") {
        return Keys.Escape;
    } else if (key === "0" || keyIdentifier === "U+0030") {
        return "0";
    } else if (key === "+" || key === "Add" || keyIdentifier === "U+002B" || keyIdentifier === "U+00BB" || keyIdentifier === "U+004B" && location === KeyboardEvent.DOM_KEY_LOCATION_NUMPAD /* workaround for Chrome for Windows */) {
            return "+";
        } else if (key === "-" || key === "Subtract" || keyIdentifier === "U+002D" || keyIdentifier === "U+00BD" || keyIdentifier === "U+004D" && location === KeyboardEvent.DOM_KEY_LOCATION_NUMPAD /* workaround for Chrome for Windows */) {
            return "-";
        } else {
        return key || keyIdentifier || Keys.Unidentified;
    }
}

exports["default"] = {
    Keys: Keys,
    identifyKeyFromEvent: identifyKeyFromEvent
};
module.exports = exports["default"];

},{}],12:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var util = {
    readonlyObservable: function readonlyObservable(value) {
        var obs = _knockout2["default"].observable(value);
        return {
            getter: _knockout2["default"].pureComputed(function () {
                return obs();
            }),
            value: obs
        };
    }
};

exports["default"] = util;
module.exports = exports["default"];

},{"knockout":1}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports['default'] = {
    escapeUnicodeChar: function escapeUnicodeChar(ch) {
        return '\\u' + (0x10000 | ch.charCodeAt(0)).toString(16).substring(1);
    },
    escapeUnicodeString: function escapeUnicodeString(str) {
        return str.replace(/[^-a-zA-Z0-9_]/g, this.escapeUnicodeChar);
    }
};
module.exports = exports['default'];

},{}],14:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var _modelsVivliostyle = require("../models/vivliostyle");

var _modelsVivliostyle2 = _interopRequireDefault(_modelsVivliostyle);

var _modelsViewerOptions = require("../models/viewer-options");

var _modelsViewerOptions2 = _interopRequireDefault(_modelsViewerOptions);

var _utilsKeyUtil = require("../utils/key-util");

function Navigation(viewerOptions, viewer, settingsPanel) {
    this.viewerOptions_ = viewerOptions;
    this.viewer_ = viewer;
    this.settingsPanel_ = settingsPanel;

    this.isDisabled = _knockout2["default"].pureComputed(function () {
        return this.settingsPanel_.opened() || !this.viewer_.state.navigatable();
    }, this);
    this.isNavigateToPreviousDisabled = this.isDisabled;
    this.isNavigateToNextDisabled = this.isDisabled;
    this.isNavigateToLeftDisabled = this.isDisabled;
    this.isNavigateToRightDisabled = this.isDisabled;
    this.isNavigateToFirstDisabled = this.isDisabled;
    this.isNavigateToLastDisabled = this.isDisabled;
    this.isZoomOutDisabled = this.isDisabled;
    this.isZoomInDisabled = this.isDisabled;
    this.isZoomDefaultDisabled = this.isDisabled;
    this.isIncreaseFontSizeDisabled = this.isDisabled;
    this.isDecreaseFontSizeDisabled = this.isDisabled;
    this.isDefaultFontSizeDisabled = this.isDisabled;

    ["navigateToPrevious", "navigateToNext", "navigateToLeft", "navigateToRight", "navigateToFirst", "navigateToLast", "zoomIn", "zoomOut", "zoomDefault", "increaseFontSize", "decreaseFontSize", "defaultFontSize", "handleKey"].forEach(function (methodName) {
        this[methodName] = this[methodName].bind(this);
    }, this);
}

Navigation.prototype.navigateToPrevious = function () {
    if (!this.isNavigateToPreviousDisabled()) {
        this.viewer_.navigateToPrevious();
        return true;
    } else {
        return false;
    }
};

Navigation.prototype.navigateToNext = function () {
    if (!this.isNavigateToNextDisabled()) {
        this.viewer_.navigateToNext();
        return true;
    } else {
        return false;
    }
};

Navigation.prototype.navigateToLeft = function () {
    if (!this.isNavigateToLeftDisabled()) {
        this.viewer_.navigateToLeft();
        return true;
    } else {
        return false;
    }
};

Navigation.prototype.navigateToRight = function () {
    if (!this.isNavigateToRightDisabled()) {
        this.viewer_.navigateToRight();
        return true;
    } else {
        return false;
    }
};

Navigation.prototype.navigateToFirst = function () {
    if (!this.isNavigateToFirstDisabled()) {
        this.viewer_.navigateToFirst();
        return true;
    } else {
        return false;
    }
};

Navigation.prototype.navigateToLast = function () {
    if (!this.isNavigateToLastDisabled()) {
        this.viewer_.navigateToLast();
        return true;
    } else {
        return false;
    }
};

Navigation.prototype.zoomIn = function () {
    if (!this.isZoomInDisabled()) {
        var zoom = this.viewerOptions_.zoom();
        this.viewerOptions_.zoom(zoom * 1.25);
        return true;
    } else {
        return false;
    }
};

Navigation.prototype.zoomOut = function () {
    if (!this.isZoomOutDisabled()) {
        var zoom = this.viewerOptions_.zoom();
        this.viewerOptions_.zoom(zoom * 0.8);
        return true;
    } else {
        return false;
    }
};

Navigation.prototype.zoomDefault = function (force) {
    if (force === true || !this.isZoomDefaultDisabled()) {
        var zoom = this.viewer_.queryZoomFactor(_modelsVivliostyle2["default"].viewer.ZoomType.FIT_INSIDE_VIEWPORT);
        this.viewerOptions_.zoom(zoom);
        return true;
    } else {
        return false;
    }
};

Navigation.prototype.increaseFontSize = function () {
    if (!this.isIncreaseFontSizeDisabled()) {
        var fontSize = this.viewerOptions_.fontSize();
        this.viewerOptions_.fontSize(fontSize * 1.25);
        return true;
    } else {
        return false;
    }
};

Navigation.prototype.decreaseFontSize = function () {
    if (!this.isDecreaseFontSizeDisabled()) {
        var fontSize = this.viewerOptions_.fontSize();
        this.viewerOptions_.fontSize(fontSize * 0.8);
        return true;
    } else {
        return false;
    }
};

Navigation.prototype.defaultFontSize = function () {
    if (!this.isDefaultFontSizeDisabled()) {
        var fontSize = _modelsViewerOptions2["default"].getDefaultValues().fontSize;
        this.viewerOptions_.fontSize(fontSize);
        return true;
    } else {
        return false;
    }
};

Navigation.prototype.handleKey = function (key) {
    switch (key) {
        case _utilsKeyUtil.Keys.ArrowDown:
        case _utilsKeyUtil.Keys.PageDown:
            return !this.navigateToNext();
        case _utilsKeyUtil.Keys.ArrowLeft:
            return !this.navigateToLeft();
        case _utilsKeyUtil.Keys.ArrowRight:
            return !this.navigateToRight();
        case _utilsKeyUtil.Keys.ArrowUp:
        case _utilsKeyUtil.Keys.PageUp:
            return !this.navigateToPrevious();
        case _utilsKeyUtil.Keys.Home:
            return !this.navigateToFirst();
        case _utilsKeyUtil.Keys.End:
            return !this.navigateToLast();
        case "+":
            return !this.increaseFontSize();
        case "-":
            return !this.decreaseFontSize();
        case "0":
            return !this.defaultFontSize();
        default:
            return true;
    }
};

exports["default"] = Navigation;
module.exports = exports["default"];

},{"../models/viewer-options":8,"../models/vivliostyle":9,"../utils/key-util":11,"knockout":1}],15:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var _modelsViewerOptions = require("../models/viewer-options");

var _modelsViewerOptions2 = _interopRequireDefault(_modelsViewerOptions);

var _modelsPageSize = require("../models/page-size");

var _modelsPageSize2 = _interopRequireDefault(_modelsPageSize);

var _utilsKeyUtil = require("../utils/key-util");

function SettingsPanel(viewerOptions, documentOptions, viewer) {
    this.viewerOptions_ = viewerOptions;
    this.documentOptions_ = documentOptions;
    this.viewer_ = viewer;

    this.opened = _knockout2["default"].observable(false);
    this.state = {
        viewerOptions: new _modelsViewerOptions2["default"](viewerOptions),
        pageSize: new _modelsPageSize2["default"](documentOptions.pageSize)
    };

    ["close", "toggle", "apply", "reset"].forEach(function (methodName) {
        this[methodName] = this[methodName].bind(this);
    }, this);
}

SettingsPanel.prototype.close = function () {
    this.opened(false);
};

SettingsPanel.prototype.toggle = function () {
    this.opened(!this.opened());
};

SettingsPanel.prototype.apply = function () {
    if (this.state.pageSize.equivalentTo(this.documentOptions_.pageSize)) {
        this.viewerOptions_.copyFrom(this.state.viewerOptions);
    } else {
        this.documentOptions_.pageSize.copyFrom(this.state.pageSize);
        this.viewer_.loadDocument(this.documentOptions_, this.state.viewerOptions);
    }
};

SettingsPanel.prototype.reset = function () {
    this.state.viewerOptions.copyFrom(this.viewerOptions_);
    this.state.pageSize.copyFrom(this.documentOptions_.pageSize);
};

SettingsPanel.prototype.handleKey = function (key) {
    switch (key) {
        case _utilsKeyUtil.Keys.Escape:
            this.close();
            return true;
        default:
            return true;
    }
};

exports["default"] = SettingsPanel;
module.exports = exports["default"];

},{"../models/page-size":7,"../models/viewer-options":8,"../utils/key-util":11,"knockout":1}],16:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var _modelsVivliostyle = require("../models/vivliostyle");

var _modelsVivliostyle2 = _interopRequireDefault(_modelsVivliostyle);

var _modelsDocumentOptions = require("../models/document-options");

var _modelsDocumentOptions2 = _interopRequireDefault(_modelsDocumentOptions);

var _modelsViewerOptions = require("../models/viewer-options");

var _modelsViewerOptions2 = _interopRequireDefault(_modelsViewerOptions);

var _viewer = require("./viewer");

var _viewer2 = _interopRequireDefault(_viewer);

var _navigation = require("./navigation");

var _navigation2 = _interopRequireDefault(_navigation);

var _settingsPanel = require("./settings-panel");

var _settingsPanel2 = _interopRequireDefault(_settingsPanel);

var _utilsKeyUtil = require("../utils/key-util");

var _utilsKeyUtil2 = _interopRequireDefault(_utilsKeyUtil);

function ViewerApp() {
    this.documentOptions = new _modelsDocumentOptions2["default"]();
    this.viewerOptions = new _modelsViewerOptions2["default"]();
    this.viewerSettings = {
        userAgentRootURL: "resources/",
        viewportElement: document.getElementById("vivliostyle-viewer-viewport")
    };
    this.viewer = new _viewer2["default"](this.viewerSettings, this.viewerOptions);
    this.settingsPanel = new _settingsPanel2["default"](this.viewerOptions, this.documentOptions, this.viewer);
    this.navigation = new _navigation2["default"](this.viewerOptions, this.viewer, this.settingsPanel);

    this.handleKey = (function (data, event) {
        var key = _utilsKeyUtil2["default"].identifyKeyFromEvent(event);
        var ret = this.settingsPanel.handleKey(key);
        if (ret) {
            ret = this.navigation.handleKey(key);
        }
        return ret;
    }).bind(this);

    this.setDefaultView();

    this.viewer.loadDocument(this.documentOptions);
}

ViewerApp.prototype.setDefaultView = function () {
    var status = this.viewer.state.status();
    this.viewer.state.status.subscribe(function (newStatus) {
        var finished = false;
        var oldStatus = status;
        status = newStatus;
        if (oldStatus === "loading" && newStatus === "complete") {
            // After document loaded, zoom to the default size
            finished = this.navigation.zoomDefault(true);
        } else if (newStatus === "loading") {
            finished = false;
        }
    }, this);
};

exports["default"] = ViewerApp;
module.exports = exports["default"];

},{"../models/document-options":6,"../models/viewer-options":8,"../models/vivliostyle":9,"../utils/key-util":11,"./navigation":14,"./settings-panel":15,"./viewer":17,"knockout":1}],17:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var _utilsObservableUtil = require("../utils/observable-util");

var _utilsObservableUtil2 = _interopRequireDefault(_utilsObservableUtil);

var _loggingLogger = require("../logging/logger");

var _loggingLogger2 = _interopRequireDefault(_loggingLogger);

var _modelsVivliostyle = require("../models/vivliostyle");

var _modelsVivliostyle2 = _interopRequireDefault(_modelsVivliostyle);

function Viewer(viewerSettings, viewerOptions) {
    this.viewerOptions_ = viewerOptions;
    this.documentOptions_ = null;
    this.viewer_ = new _modelsVivliostyle2["default"].viewer.Viewer(viewerSettings, viewerOptions.toObject());
    var state_ = this.state_ = {
        status: _utilsObservableUtil2["default"].readonlyObservable("loading"),
        pageProgression: _utilsObservableUtil2["default"].readonlyObservable(_modelsVivliostyle2["default"].constants.LTR)
    };
    this.state = {
        status: state_.status.getter,
        navigatable: _knockout2["default"].pureComputed(function () {
            return state_.status.value() === "complete";
        }),
        pageProgression: state_.pageProgression.getter
    };

    this.setupViewerEventHandler();
    this.setupViewerOptionSubscriptions();
}

Viewer.prototype.setupViewerEventHandler = function () {
    this.viewer_.addListener("error", function (payload) {
        _loggingLogger2["default"].error(payload.content);
    });
    this.viewer_.addListener("resizestart", (function () {
        var status = this.state.status();
        if (status === "complete") {
            this.state_.status.value("resizing");
        }
    }).bind(this));
    this.viewer_.addListener("resizeend", (function () {
        this.state_.status.value("complete");
    }).bind(this));
    this.viewer_.addListener("loaded", (function () {
        this.state_.pageProgression.value(this.viewer_.getCurrentPageProgression());
        this.state_.status.value("complete");
    }).bind(this));
    this.viewer_.addListener("nav", (function (payload) {
        var cfi = payload.cfi;
        if (cfi) {
            this.documentOptions_.fragment(cfi);
        }
    }).bind(this));
};

Viewer.prototype.setupViewerOptionSubscriptions = function () {
    _knockout2["default"].computed(function () {
        var viewerOptions = this.viewerOptions_.toObject();
        if (this.state.status.peek() === "complete") {
            this.viewer_.setOptions(viewerOptions);
        }
    }, this).extend({ rateLimit: 0 });
};

Viewer.prototype.loadDocument = function (documentOptions, viewerOptions) {
    this.state_.status.value("loading");
    if (viewerOptions) {
        this.viewerOptions_.copyFrom(viewerOptions);
    }
    this.documentOptions_ = documentOptions;
    if (documentOptions.url()) {
        this.viewer_.loadDocument(documentOptions.url(), documentOptions.toObject(), this.viewerOptions_.toObject());
    } else if (documentOptions.epubUrl()) {
        this.viewer_.loadEPUB(documentOptions.epubUrl(), documentOptions.toObject(), this.viewerOptions_.toObject());
    }
};

Viewer.prototype.navigateToPrevious = function () {
    this.viewer_.navigateToPage("previous");
};

Viewer.prototype.navigateToNext = function () {
    this.viewer_.navigateToPage("next");
};

Viewer.prototype.navigateToLeft = function () {
    this.viewer_.navigateToPage("left");
};

Viewer.prototype.navigateToRight = function () {
    this.viewer_.navigateToPage("right");
};

Viewer.prototype.navigateToFirst = function () {
    this.viewer_.navigateToPage("first");
};

Viewer.prototype.navigateToLast = function () {
    this.viewer_.navigateToPage("last");
};

Viewer.prototype.queryZoomFactor = function (type) {
    return this.viewer_.queryZoomFactor(type);
};

exports["default"] = Viewer;
module.exports = exports["default"];

},{"../logging/logger":4,"../models/vivliostyle":9,"../utils/observable-util":12,"knockout":1}],18:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var _bindingsMenuButtonJs = require("./bindings/menuButton.js");

var _bindingsMenuButtonJs2 = _interopRequireDefault(_bindingsMenuButtonJs);

var _viewmodelsViewerApp = require("./viewmodels/viewer-app");

var _viewmodelsViewerApp2 = _interopRequireDefault(_viewmodelsViewerApp);

exports["default"] = {
    start: function start() {
        function startViewer() {
            _knockout2["default"].applyBindings(new _viewmodelsViewerApp2["default"]());
        }

        if (window["__loaded"]) startViewer();else window.onload = startViewer;
    }
};
module.exports = exports["default"];

},{"./bindings/menuButton.js":3,"./viewmodels/viewer-app":16,"knockout":1}]},{},[5]);
