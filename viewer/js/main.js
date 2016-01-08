(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*!
 * Knockout JavaScript library v3.4.0
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
    } else if (typeof exports === 'object' && typeof module === 'object') {
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
ko.version = "3.4.0";

ko.exportSymbol('version', ko.version);
// For any options that may affect various areas of Knockout and aren't directly associated with data binding.
ko.options = {
    'deferUpdates': false,
    'useOnlyNativeEvents': false
};

//ko.exportSymbol('options', ko.options);   // 'options' isn't minified
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
    var canUseSymbols = !DEBUG && typeof Symbol === 'function';

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
            //       See https://github.com/knockout/knockout/pull/440
            //   [B] Any trailing nodes that have been remove should be ignored
            //       This prevents the code here from adding unrelated nodes to the array while processing rule [C]
            //       See https://github.com/knockout/knockout/pull/1903
            //   [C] We want to output a continuous series of nodes. So, ignore any nodes that have already been removed,
            //       and include any nodes that have been inserted among the previous collection

            if (continuousNodeArray.length) {
                // The parent node can be a virtual element; so get the real parent node
                parentNode = (parentNode.nodeType === 8 && parentNode.parentNode) || parentNode;

                // Rule [A]
                while (continuousNodeArray.length && continuousNodeArray[0].parentNode !== parentNode)
                    continuousNodeArray.splice(0, 1);

                // Rule [B]
                while (continuousNodeArray.length > 1 && continuousNodeArray[continuousNodeArray.length - 1].parentNode !== parentNode)
                    continuousNodeArray.length--;

                // Rule [C]
                if (continuousNodeArray.length > 1) {
                    var current = continuousNodeArray[0], last = continuousNodeArray[continuousNodeArray.length - 1];
                    // Replace with the actual new continuous node set
                    continuousNodeArray.length = 0;
                    while (current !== last) {
                        continuousNodeArray.push(current);
                        current = current.nextSibling;
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

        catchFunctionErrors: function (delegate) {
            return ko['onError'] ? function () {
                try {
                    return delegate.apply(this, arguments);
                } catch (e) {
                    ko['onError'] && ko['onError'](e);
                    throw e;
                }
            } : delegate;
        },

        setTimeout: function (handler, timeout) {
            return setTimeout(ko.utils.catchFunctionErrors(handler), timeout);
        },

        deferError: function (error) {
            setTimeout(function () {
                ko['onError'] && ko['onError'](error);
                throw error;
            }, 0);
        },

        registerEventHandler: function (element, eventType, handler) {
            var wrappedHandler = ko.utils.catchFunctionErrors(handler);

            var mustUseAttachEvent = ieVersion && eventsThatMustBeRegisteredUsingAttachEvent[eventType];
            if (!ko.options['useOnlyNativeEvents'] && !mustUseAttachEvent && jQueryInstance) {
                jQueryInstance(element)['bind'](eventType, wrappedHandler);
            } else if (!mustUseAttachEvent && typeof element.addEventListener == "function")
                element.addEventListener(eventType, wrappedHandler, false);
            else if (typeof element.attachEvent != "undefined") {
                var attachEventHandler = function (event) { wrappedHandler.call(element, event); },
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

            if (!ko.options['useOnlyNativeEvents'] && jQueryInstance && !useClickWorkaround) {
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

        createSymbolOrString: function(identifier) {
            return canUseSymbols ? Symbol(identifier) : identifier;
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
    var none = [0, "", ""],
        table = [1, "<table>", "</table>"],
        tbody = [2, "<table><tbody>", "</tbody></table>"],
        tr = [3, "<table><tbody><tr>", "</tr></tbody></table>"],
        select = [1, "<select multiple='multiple'>", "</select>"],
        lookup = {
            'thead': table,
            'tbody': table,
            'tfoot': table,
            'tr': tbody,
            'td': tr,
            'th': tr,
            'option': select,
            'optgroup': select
        },

        // This is needed for old IE if you're *not* using either jQuery or innerShiv. Doesn't affect other cases.
        mayRequireCreateElementHack = ko.utils.ieVersion <= 8;

    function getWrap(tags) {
        var m = tags.match(/^<([a-z]+)[ >]/);
        return (m && lookup[m[1]]) || none;
    }

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
        var tags = ko.utils.stringTrim(html).toLowerCase(), div = documentContext.createElement("div"),
            wrap = getWrap(tags),
            depth = wrap[0];

        // Go to html and back, then peel off extra wrappers
        // Note that we always prefix with some dummy text, because otherwise, IE<9 will strip out leading comment nodes in descendants. Total madness.
        var markup = "ignored<div>" + wrap[1] + html + wrap[2] + "</div>";
        if (typeof windowContext['innerShiv'] == "function") {
            // Note that innerShiv is deprecated in favour of html5shiv. We should consider adding
            // support for html5shiv (except if no explicit support is needed, e.g., if html5shiv
            // somehow shims the native APIs so it just works anyway)
            div.appendChild(windowContext['innerShiv'](markup));
        } else {
            if (mayRequireCreateElementHack) {
                // The document.createElement('my-element') trick to enable custom elements in IE6-8
                // only works if we assign innerHTML on an element associated with that document.
                documentContext.appendChild(div);
            }

            div.innerHTML = markup;

            if (mayRequireCreateElementHack) {
                div.parentNode.removeChild(div);
            }
        }

        // Move to the right depth
        while (depth--)
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
        return jQueryInstance ?
            jQueryHtmlParse(html, documentContext) :   // As below, benefit from jQuery's optimisations where possible
            simpleHtmlParse(html, documentContext);  // ... otherwise, this simple logic will do in most common cases.
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
ko.tasks = (function () {
    var scheduler,
        taskQueue = [],
        taskQueueLength = 0,
        nextHandle = 1,
        nextIndexToProcess = 0;

    if (window['MutationObserver']) {
        // Chrome 27+, Firefox 14+, IE 11+, Opera 15+, Safari 6.1+
        // From https://github.com/petkaantonov/bluebird * Copyright (c) 2014 Petka Antonov * License: MIT
        scheduler = (function (callback) {
            var div = document.createElement("div");
            new MutationObserver(callback).observe(div, {attributes: true});
            return function () { div.classList.toggle("foo"); };
        })(scheduledProcess);
    } else if (document && "onreadystatechange" in document.createElement("script")) {
        // IE 6-10
        // From https://github.com/YuzuJS/setImmediate * Copyright (c) 2012 Barnesandnoble.com, llc, Donavon West, and Domenic Denicola * License: MIT
        scheduler = function (callback) {
            var script = document.createElement("script");
            script.onreadystatechange = function () {
                script.onreadystatechange = null;
                document.documentElement.removeChild(script);
                script = null;
                callback();
            };
            document.documentElement.appendChild(script);
        };
    } else {
        scheduler = function (callback) {
            setTimeout(callback, 0);
        };
    }

    function processTasks() {
        if (taskQueueLength) {
            // Each mark represents the end of a logical group of tasks and the number of these groups is
            // limited to prevent unchecked recursion.
            var mark = taskQueueLength, countMarks = 0;

            // nextIndexToProcess keeps track of where we are in the queue; processTasks can be called recursively without issue
            for (var task; nextIndexToProcess < taskQueueLength; ) {
                if (task = taskQueue[nextIndexToProcess++]) {
                    if (nextIndexToProcess > mark) {
                        if (++countMarks >= 5000) {
                            nextIndexToProcess = taskQueueLength;   // skip all tasks remaining in the queue since any of them could be causing the recursion
                            ko.utils.deferError(Error("'Too much recursion' after processing " + countMarks + " task groups."));
                            break;
                        }
                        mark = taskQueueLength;
                    }
                    try {
                        task();
                    } catch (ex) {
                        ko.utils.deferError(ex);
                    }
                }
            }
        }
    }

    function scheduledProcess() {
        processTasks();

        // Reset the queue
        nextIndexToProcess = taskQueueLength = taskQueue.length = 0;
    }

    function scheduleTaskProcessing() {
        ko.tasks['scheduler'](scheduledProcess);
    }

    var tasks = {
        'scheduler': scheduler,     // Allow overriding the scheduler

        schedule: function (func) {
            if (!taskQueueLength) {
                scheduleTaskProcessing();
            }

            taskQueue[taskQueueLength++] = func;
            return nextHandle++;
        },

        cancel: function (handle) {
            var index = handle - (nextHandle - taskQueueLength);
            if (index >= nextIndexToProcess && index < taskQueueLength) {
                taskQueue[index] = null;
            }
        },

        // For testing only: reset the queue and return the previous queue length
        'resetForTesting': function () {
            var length = taskQueueLength - nextIndexToProcess;
            nextIndexToProcess = taskQueueLength = taskQueue.length = 0;
            return length;
        },

        runEarly: processTasks
    };

    return tasks;
})();

ko.exportSymbol('tasks', ko.tasks);
ko.exportSymbol('tasks.schedule', ko.tasks.schedule);
//ko.exportSymbol('tasks.cancel', ko.tasks.cancel);  "cancel" isn't minified
ko.exportSymbol('tasks.runEarly', ko.tasks.runEarly);
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
                writeTimeoutInstance = ko.utils.setTimeout(function() {
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

        // rateLimit supersedes deferred updates
        target._deferUpdates = false;

        limitFunction = method == 'notifyWhenChangesStop' ?  debounce : throttle;
        target.limit(function(callback) {
            return limitFunction(callback, timeout);
        });
    },

    'deferred': function(target, options) {
        if (options !== true) {
            throw new Error('The \'deferred\' extender only accepts the value \'true\', because it is not supported to turn deferral off once enabled.')
        }

        if (!target._deferUpdates) {
            target._deferUpdates = true;
            target.limit(function (callback) {
                var handle;
                return function () {
                    ko.tasks.cancel(handle);
                    handle = ko.tasks.schedule(callback);
                    target['notifySubscribers'](undefined, 'dirty');
                };
            });
        }
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
            timeoutInstance = ko.utils.setTimeout(function () {
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
        timeoutInstance = ko.utils.setTimeout(callback, timeout);
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
    ko.utils.setPrototypeOfOrExtend(this, ko_subscribable_fn);
    ko_subscribable_fn.init(this);
}

var defaultEvent = "change";

// Moved out of "limit" to avoid the extra closure
function limitNotifySubscribers(value, event) {
    if (!event || event === defaultEvent) {
        this._limitChange(value);
    } else if (event === 'beforeChange') {
        this._limitBeforeChange(value);
    } else {
        this._origNotifySubscribers(value, event);
    }
}

var ko_subscribable_fn = {
    init: function(instance) {
        instance._subscriptions = {};
        instance._versionNumber = 1;
    },

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
            ignoreBeforeChange, previousValue, pendingValue, beforeChange = 'beforeChange';

        if (!self._origNotifySubscribers) {
            self._origNotifySubscribers = self["notifySubscribers"];
            self["notifySubscribers"] = limitNotifySubscribers;
        }

        var finish = limitFunction(function() {
            self._notificationIsPending = false;

            // If an observable provided a reference to itself, access it to get the latest value.
            // This allows computed observables to delay calculating their value until needed.
            if (selfIsObservable && pendingValue === self) {
                pendingValue = self();
            }
            ignoreBeforeChange = false;
            if (self.isDifferent(previousValue, pendingValue)) {
                self._origNotifySubscribers(previousValue = pendingValue);
            }
        });

        self._limitChange = function(value) {
            self._notificationIsPending = ignoreBeforeChange = true;
            pendingValue = value;
            finish();
        };
        self._limitBeforeChange = function(value) {
            if (!ignoreBeforeChange) {
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
                if (eventName !== 'dirty')
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
                currentFrame.callback.call(currentFrame.callbackTarget, subscribable, subscribable._id || (subscribable._id = getId()));
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

ko.exportSymbol('ignoreDependencies', ko.ignoreDependencies = ko.dependencyDetection.ignore);
var observableLatestValue = ko.utils.createSymbolOrString('_latestValue');

ko.observable = function (initialValue) {
    function observable() {
        if (arguments.length > 0) {
            // Write

            // Ignore writes if the value hasn't changed
            if (observable.isDifferent(observable[observableLatestValue], arguments[0])) {
                observable.valueWillMutate();
                observable[observableLatestValue] = arguments[0];
                observable.valueHasMutated();
            }
            return this; // Permits chained assignments
        }
        else {
            // Read
            ko.dependencyDetection.registerDependency(observable); // The caller only needs to be notified of changes if they did a "read" operation
            return observable[observableLatestValue];
        }
    }

    observable[observableLatestValue] = initialValue;

    // Inherit from 'subscribable'
    if (!ko.utils.canSetPrototype) {
        // 'subscribable' won't be on the prototype chain unless we put it there directly
        ko.utils.extend(observable, ko.subscribable['fn']);
    }
    ko.subscribable['fn'].init(observable);

    // Inherit from 'observable'
    ko.utils.setPrototypeOfOrExtend(observable, observableFn);

    if (ko.options['deferUpdates']) {
        ko.extenders['deferred'](observable, true);
    }

    return observable;
}

// Define prototype for observables
var observableFn = {
    'equalityComparer': valuesArePrimitiveAndEqual,
    peek: function() { return this[observableLatestValue]; },
    valueHasMutated: function () { this['notifySubscribers'](this[observableLatestValue]); },
    valueWillMutate: function () { this['notifySubscribers'](this[observableLatestValue], 'beforeChange'); }
};

// Note that for browsers that don't support proto assignment, the
// inheritance chain is created manually in the ko.observable constructor
if (ko.utils.canSetPrototype) {
    ko.utils.setPrototypeOf(observableFn, ko.subscribable['fn']);
}

var protoProperty = ko.observable.protoProperty = '__ko_proto__';
observableFn[protoProperty] = ko.observable;

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
    if ((typeof instance == 'function') && instance[protoProperty] === ko.observable)
        return true;
    // Writeable dependent observable
    if ((typeof instance == 'function') && (instance[protoProperty] === ko.dependentObservable) && (instance.hasWriteFunction))
        return true;
    // Anything else
    return false;
}

ko.exportSymbol('observable', ko.observable);
ko.exportSymbol('isObservable', ko.isObservable);
ko.exportSymbol('isWriteableObservable', ko.isWriteableObservable);
ko.exportSymbol('isWritableObservable', ko.isWriteableObservable);
ko.exportSymbol('observable.fn', observableFn);
ko.exportProperty(observableFn, 'peek', observableFn.peek);
ko.exportProperty(observableFn, 'valueHasMutated', observableFn.valueHasMutated);
ko.exportProperty(observableFn, 'valueWillMutate', observableFn.valueWillMutate);
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

// Note that for browsers that don't support proto assignment, the
// inheritance chain is created manually in the ko.observableArray constructor
if (ko.utils.canSetPrototype) {
    ko.utils.setPrototypeOf(ko.observableArray['fn'], ko.observable['fn']);
}

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
        // The native sort and reverse methods return a reference to the array, but it makes more sense to return the observable array instead.
        return methodCallResult === underlyingArray ? this : methodCallResult;
    };
});

// Populate ko.observableArray.fn with read-only functions from native arrays
ko.utils.arrayForEach(["slice"], function (methodName) {
    ko.observableArray['fn'][methodName] = function () {
        var underlyingArray = this();
        return underlyingArray[methodName].apply(underlyingArray, arguments);
    };
});

ko.exportSymbol('observableArray', ko.observableArray);
var arrayChangeEventName = 'arrayChange';
ko.extenders['trackArrayChanges'] = function(target, options) {
    // Use the provided options--each call to trackArrayChanges overwrites the previously set options
    target.compareArrayOptions = {};
    if (options && typeof options == "object") {
        ko.utils.extend(target.compareArrayOptions, options);
    }
    target.compareArrayOptions['sparse'] = true;

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
            cachedDiff = ko.utils.compareArrays(previousContents, currentContents, target.compareArrayOptions);
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
var computedState = ko.utils.createSymbolOrString('_state');

ko.computed = ko.dependentObservable = function (evaluatorFunctionOrOptions, evaluatorFunctionTarget, options) {
    if (typeof evaluatorFunctionOrOptions === "object") {
        // Single-parameter syntax - everything is on this "options" param
        options = evaluatorFunctionOrOptions;
    } else {
        // Multi-parameter syntax - construct the options according to the params passed
        options = options || {};
        if (evaluatorFunctionOrOptions) {
            options["read"] = evaluatorFunctionOrOptions;
        }
    }
    if (typeof options["read"] != "function")
        throw Error("Pass a function that returns the value of the ko.computed");

    var writeFunction = options["write"];
    var state = {
        latestValue: undefined,
        isStale: true,
        isBeingEvaluated: false,
        suppressDisposalUntilDisposeWhenReturnsFalse: false,
        isDisposed: false,
        pure: false,
        isSleeping: false,
        readFunction: options["read"],
        evaluatorFunctionTarget: evaluatorFunctionTarget || options["owner"],
        disposeWhenNodeIsRemoved: options["disposeWhenNodeIsRemoved"] || options.disposeWhenNodeIsRemoved || null,
        disposeWhen: options["disposeWhen"] || options.disposeWhen,
        domNodeDisposalCallback: null,
        dependencyTracking: {},
        dependenciesCount: 0,
        evaluationTimeoutInstance: null
    };

    function computedObservable() {
        if (arguments.length > 0) {
            if (typeof writeFunction === "function") {
                // Writing a value
                writeFunction.apply(state.evaluatorFunctionTarget, arguments);
            } else {
                throw new Error("Cannot write a value to a ko.computed unless you specify a 'write' option. If you wish to read the current value, don't pass any parameters.");
            }
            return this; // Permits chained assignments
        } else {
            // Reading the value
            ko.dependencyDetection.registerDependency(computedObservable);
            if (state.isStale || (state.isSleeping && computedObservable.haveDependenciesChanged())) {
                computedObservable.evaluateImmediate();
            }
            return state.latestValue;
        }
    }

    computedObservable[computedState] = state;
    computedObservable.hasWriteFunction = typeof writeFunction === "function";

    // Inherit from 'subscribable'
    if (!ko.utils.canSetPrototype) {
        // 'subscribable' won't be on the prototype chain unless we put it there directly
        ko.utils.extend(computedObservable, ko.subscribable['fn']);
    }
    ko.subscribable['fn'].init(computedObservable);

    // Inherit from 'computed'
    ko.utils.setPrototypeOfOrExtend(computedObservable, computedFn);

    if (options['pure']) {
        state.pure = true;
        state.isSleeping = true;     // Starts off sleeping; will awake on the first subscription
        ko.utils.extend(computedObservable, pureComputedOverrides);
    } else if (options['deferEvaluation']) {
        ko.utils.extend(computedObservable, deferEvaluationOverrides);
    }

    if (ko.options['deferUpdates']) {
        ko.extenders['deferred'](computedObservable, true);
    }

    if (DEBUG) {
        // #1731 - Aid debugging by exposing the computed's options
        computedObservable["_options"] = options;
    }

    if (state.disposeWhenNodeIsRemoved) {
        // Since this computed is associated with a DOM node, and we don't want to dispose the computed
        // until the DOM node is *removed* from the document (as opposed to never having been in the document),
        // we'll prevent disposal until "disposeWhen" first returns false.
        state.suppressDisposalUntilDisposeWhenReturnsFalse = true;

        // disposeWhenNodeIsRemoved: true can be used to opt into the "only dispose after first false result"
        // behaviour even if there's no specific node to watch. In that case, clear the option so we don't try
        // to watch for a non-node's disposal. This technique is intended for KO's internal use only and shouldn't
        // be documented or used by application code, as it's likely to change in a future version of KO.
        if (!state.disposeWhenNodeIsRemoved.nodeType) {
            state.disposeWhenNodeIsRemoved = null;
        }
    }

    // Evaluate, unless sleeping or deferEvaluation is true
    if (!state.isSleeping && !options['deferEvaluation']) {
        computedObservable.evaluateImmediate();
    }

    // Attach a DOM node disposal callback so that the computed will be proactively disposed as soon as the node is
    // removed using ko.removeNode. But skip if isActive is false (there will never be any dependencies to dispose).
    if (state.disposeWhenNodeIsRemoved && computedObservable.isActive()) {
        ko.utils.domNodeDisposal.addDisposeCallback(state.disposeWhenNodeIsRemoved, state.domNodeDisposalCallback = function () {
            computedObservable.dispose();
        });
    }

    return computedObservable;
};

// Utility function that disposes a given dependencyTracking entry
function computedDisposeDependencyCallback(id, entryToDispose) {
    if (entryToDispose !== null && entryToDispose.dispose) {
        entryToDispose.dispose();
    }
}

// This function gets called each time a dependency is detected while evaluating a computed.
// It's factored out as a shared function to avoid creating unnecessary function instances during evaluation.
function computedBeginDependencyDetectionCallback(subscribable, id) {
    var computedObservable = this.computedObservable,
        state = computedObservable[computedState];
    if (!state.isDisposed) {
        if (this.disposalCount && this.disposalCandidates[id]) {
            // Don't want to dispose this subscription, as it's still being used
            computedObservable.addDependencyTracking(id, subscribable, this.disposalCandidates[id]);
            this.disposalCandidates[id] = null; // No need to actually delete the property - disposalCandidates is a transient object anyway
            --this.disposalCount;
        } else if (!state.dependencyTracking[id]) {
            // Brand new subscription - add it
            computedObservable.addDependencyTracking(id, subscribable, state.isSleeping ? { _target: subscribable } : computedObservable.subscribeToDependency(subscribable));
        }
    }
}

var computedFn = {
    "equalityComparer": valuesArePrimitiveAndEqual,
    getDependenciesCount: function () {
        return this[computedState].dependenciesCount;
    },
    addDependencyTracking: function (id, target, trackingObj) {
        if (this[computedState].pure && target === this) {
            throw Error("A 'pure' computed must not be called recursively");
        }

        this[computedState].dependencyTracking[id] = trackingObj;
        trackingObj._order = this[computedState].dependenciesCount++;
        trackingObj._version = target.getVersion();
    },
    haveDependenciesChanged: function () {
        var id, dependency, dependencyTracking = this[computedState].dependencyTracking;
        for (id in dependencyTracking) {
            if (dependencyTracking.hasOwnProperty(id)) {
                dependency = dependencyTracking[id];
                if (dependency._target.hasChanged(dependency._version)) {
                    return true;
                }
            }
        }
    },
    markDirty: function () {
        // Process "dirty" events if we can handle delayed notifications
        if (this._evalDelayed && !this[computedState].isBeingEvaluated) {
            this._evalDelayed();
        }
    },
    isActive: function () {
        return this[computedState].isStale || this[computedState].dependenciesCount > 0;
    },
    respondToChange: function () {
        // Ignore "change" events if we've already scheduled a delayed notification
        if (!this._notificationIsPending) {
            this.evaluatePossiblyAsync();
        }
    },
    subscribeToDependency: function (target) {
        if (target._deferUpdates && !this[computedState].disposeWhenNodeIsRemoved) {
            var dirtySub = target.subscribe(this.markDirty, this, 'dirty'),
                changeSub = target.subscribe(this.respondToChange, this);
            return {
                _target: target,
                dispose: function () {
                    dirtySub.dispose();
                    changeSub.dispose();
                }
            };
        } else {
            return target.subscribe(this.evaluatePossiblyAsync, this);
        }
    },
    evaluatePossiblyAsync: function () {
        var computedObservable = this,
            throttleEvaluationTimeout = computedObservable['throttleEvaluation'];
        if (throttleEvaluationTimeout && throttleEvaluationTimeout >= 0) {
            clearTimeout(this[computedState].evaluationTimeoutInstance);
            this[computedState].evaluationTimeoutInstance = ko.utils.setTimeout(function () {
                computedObservable.evaluateImmediate(true /*notifyChange*/);
            }, throttleEvaluationTimeout);
        } else if (computedObservable._evalDelayed) {
            computedObservable._evalDelayed();
        } else {
            computedObservable.evaluateImmediate(true /*notifyChange*/);
        }
    },
    evaluateImmediate: function (notifyChange) {
        var computedObservable = this,
            state = computedObservable[computedState],
            disposeWhen = state.disposeWhen;

        if (state.isBeingEvaluated) {
            // If the evaluation of a ko.computed causes side effects, it's possible that it will trigger its own re-evaluation.
            // This is not desirable (it's hard for a developer to realise a chain of dependencies might cause this, and they almost
            // certainly didn't intend infinite re-evaluations). So, for predictability, we simply prevent ko.computeds from causing
            // their own re-evaluation. Further discussion at https://github.com/SteveSanderson/knockout/pull/387
            return;
        }

        // Do not evaluate (and possibly capture new dependencies) if disposed
        if (state.isDisposed) {
            return;
        }

        if (state.disposeWhenNodeIsRemoved && !ko.utils.domNodeIsAttachedToDocument(state.disposeWhenNodeIsRemoved) || disposeWhen && disposeWhen()) {
            // See comment above about suppressDisposalUntilDisposeWhenReturnsFalse
            if (!state.suppressDisposalUntilDisposeWhenReturnsFalse) {
                computedObservable.dispose();
                return;
            }
        } else {
            // It just did return false, so we can stop suppressing now
            state.suppressDisposalUntilDisposeWhenReturnsFalse = false;
        }

        state.isBeingEvaluated = true;
        try {
            this.evaluateImmediate_CallReadWithDependencyDetection(notifyChange);
        } finally {
            state.isBeingEvaluated = false;
        }

        if (!state.dependenciesCount) {
            computedObservable.dispose();
        }
    },
    evaluateImmediate_CallReadWithDependencyDetection: function (notifyChange) {
        // This function is really just part of the evaluateImmediate logic. You would never call it from anywhere else.
        // Factoring it out into a separate function means it can be independent of the try/catch block in evaluateImmediate,
        // which contributes to saving about 40% off the CPU overhead of computed evaluation (on V8 at least).

        var computedObservable = this,
            state = computedObservable[computedState];

        // Initially, we assume that none of the subscriptions are still being used (i.e., all are candidates for disposal).
        // Then, during evaluation, we cross off any that are in fact still being used.
        var isInitial = state.pure ? undefined : !state.dependenciesCount,   // If we're evaluating when there are no previous dependencies, it must be the first time
            dependencyDetectionContext = {
                computedObservable: computedObservable,
                disposalCandidates: state.dependencyTracking,
                disposalCount: state.dependenciesCount
            };

        ko.dependencyDetection.begin({
            callbackTarget: dependencyDetectionContext,
            callback: computedBeginDependencyDetectionCallback,
            computed: computedObservable,
            isInitial: isInitial
        });

        state.dependencyTracking = {};
        state.dependenciesCount = 0;

        var newValue = this.evaluateImmediate_CallReadThenEndDependencyDetection(state, dependencyDetectionContext);

        if (computedObservable.isDifferent(state.latestValue, newValue)) {
            if (!state.isSleeping) {
                computedObservable["notifySubscribers"](state.latestValue, "beforeChange");
            }

            state.latestValue = newValue;

            if (state.isSleeping) {
                computedObservable.updateVersion();
            } else if (notifyChange) {
                computedObservable["notifySubscribers"](state.latestValue);
            }
        }

        if (isInitial) {
            computedObservable["notifySubscribers"](state.latestValue, "awake");
        }
    },
    evaluateImmediate_CallReadThenEndDependencyDetection: function (state, dependencyDetectionContext) {
        // This function is really part of the evaluateImmediate_CallReadWithDependencyDetection logic.
        // You'd never call it from anywhere else. Factoring it out means that evaluateImmediate_CallReadWithDependencyDetection
        // can be independent of try/finally blocks, which contributes to saving about 40% off the CPU
        // overhead of computed evaluation (on V8 at least).

        try {
            var readFunction = state.readFunction;
            return state.evaluatorFunctionTarget ? readFunction.call(state.evaluatorFunctionTarget) : readFunction();
        } finally {
            ko.dependencyDetection.end();

            // For each subscription no longer being used, remove it from the active subscriptions list and dispose it
            if (dependencyDetectionContext.disposalCount && !state.isSleeping) {
                ko.utils.objectForEach(dependencyDetectionContext.disposalCandidates, computedDisposeDependencyCallback);
            }

            state.isStale = false;
        }
    },
    peek: function () {
        // Peek won't re-evaluate, except while the computed is sleeping or to get the initial value when "deferEvaluation" is set.
        var state = this[computedState];
        if ((state.isStale && !state.dependenciesCount) || (state.isSleeping && this.haveDependenciesChanged())) {
            this.evaluateImmediate();
        }
        return state.latestValue;
    },
    limit: function (limitFunction) {
        // Override the limit function with one that delays evaluation as well
        ko.subscribable['fn'].limit.call(this, limitFunction);
        this._evalDelayed = function () {
            this._limitBeforeChange(this[computedState].latestValue);

            this[computedState].isStale = true; // Mark as dirty

            // Pass the observable to the "limit" code, which will access it when
            // it's time to do the notification.
            this._limitChange(this);
        }
    },
    dispose: function () {
        var state = this[computedState];
        if (!state.isSleeping && state.dependencyTracking) {
            ko.utils.objectForEach(state.dependencyTracking, function (id, dependency) {
                if (dependency.dispose)
                    dependency.dispose();
            });
        }
        if (state.disposeWhenNodeIsRemoved && state.domNodeDisposalCallback) {
            ko.utils.domNodeDisposal.removeDisposeCallback(state.disposeWhenNodeIsRemoved, state.domNodeDisposalCallback);
        }
        state.dependencyTracking = null;
        state.dependenciesCount = 0;
        state.isDisposed = true;
        state.isStale = false;
        state.isSleeping = false;
        state.disposeWhenNodeIsRemoved = null;
    }
};

var pureComputedOverrides = {
    beforeSubscriptionAdd: function (event) {
        // If asleep, wake up the computed by subscribing to any dependencies.
        var computedObservable = this,
            state = computedObservable[computedState];
        if (!state.isDisposed && state.isSleeping && event == 'change') {
            state.isSleeping = false;
            if (state.isStale || computedObservable.haveDependenciesChanged()) {
                state.dependencyTracking = null;
                state.dependenciesCount = 0;
                state.isStale = true;
                computedObservable.evaluateImmediate();
            } else {
                // First put the dependencies in order
                var dependeciesOrder = [];
                ko.utils.objectForEach(state.dependencyTracking, function (id, dependency) {
                    dependeciesOrder[dependency._order] = id;
                });
                // Next, subscribe to each one
                ko.utils.arrayForEach(dependeciesOrder, function (id, order) {
                    var dependency = state.dependencyTracking[id],
                        subscription = computedObservable.subscribeToDependency(dependency._target);
                    subscription._order = order;
                    subscription._version = dependency._version;
                    state.dependencyTracking[id] = subscription;
                });
            }
            if (!state.isDisposed) {     // test since evaluating could trigger disposal
                computedObservable["notifySubscribers"](state.latestValue, "awake");
            }
        }
    },
    afterSubscriptionRemove: function (event) {
        var state = this[computedState];
        if (!state.isDisposed && event == 'change' && !this.hasSubscriptionsForEvent('change')) {
            ko.utils.objectForEach(state.dependencyTracking, function (id, dependency) {
                if (dependency.dispose) {
                    state.dependencyTracking[id] = {
                        _target: dependency._target,
                        _order: dependency._order,
                        _version: dependency._version
                    };
                    dependency.dispose();
                }
            });
            state.isSleeping = true;
            this["notifySubscribers"](undefined, "asleep");
        }
    },
    getVersion: function () {
        // Because a pure computed is not automatically updated while it is sleeping, we can't
        // simply return the version number. Instead, we check if any of the dependencies have
        // changed and conditionally re-evaluate the computed observable.
        var state = this[computedState];
        if (state.isSleeping && (state.isStale || this.haveDependenciesChanged())) {
            this.evaluateImmediate();
        }
        return ko.subscribable['fn'].getVersion.call(this);
    }
};

var deferEvaluationOverrides = {
    beforeSubscriptionAdd: function (event) {
        // This will force a computed with deferEvaluation to evaluate when the first subscription is registered.
        if (event == 'change' || event == 'beforeChange') {
            this.peek();
        }
    }
};

// Note that for browsers that don't support proto assignment, the
// inheritance chain is created manually in the ko.computed constructor
if (ko.utils.canSetPrototype) {
    ko.utils.setPrototypeOf(computedFn, ko.subscribable['fn']);
}

// Set the proto chain values for ko.hasPrototype
var protoProp = ko.observable.protoProperty; // == "__ko_proto__"
ko.computed[protoProp] = ko.observable;
computedFn[protoProp] = ko.computed;

ko.isComputed = function (instance) {
    return ko.hasPrototype(instance, ko.computed);
};

ko.isPureComputed = function (instance) {
    return ko.hasPrototype(instance, ko.computed)
        && instance[computedState] && instance[computedState].pure;
};

ko.exportSymbol('computed', ko.computed);
ko.exportSymbol('dependentObservable', ko.computed);    // export ko.dependentObservable for backwards compatibility (1.x)
ko.exportSymbol('isComputed', ko.isComputed);
ko.exportSymbol('isPureComputed', ko.isPureComputed);
ko.exportSymbol('computed.fn', computedFn);
ko.exportProperty(computedFn, 'peek', computedFn.peek);
ko.exportProperty(computedFn, 'dispose', computedFn.dispose);
ko.exportProperty(computedFn, 'isActive', computedFn.isActive);
ko.exportProperty(computedFn, 'getDependenciesCount', computedFn.getDependenciesCount);

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
        var canHaveProperties = (typeof rootObject == "object") && (rootObject !== null) && (rootObject !== undefined) && (!(rootObject instanceof RegExp)) && (!(rootObject instanceof Date)) && (!(rootObject instanceof String)) && (!(rootObject instanceof Number)) && (!(rootObject instanceof Boolean));
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

    // The following element types will not be recursed into during binding.
    var bindingDoesNotRecurseIntoElementTypes = {
        // Don't want bindings that operate on text nodes to mutate <script> and <textarea> contents,
        // because it's unexpected and a potential XSS issue.
        // Also bindings should not operate on <template> elements since this breaks in Internet Explorer
        // and because such elements' contents are always intended to be bound in a different context
        // from where they appear in the document.
        'script': true,
        'textarea': true,
        'template': true
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
            // we call the function to retrieve the view model. If the function accesses any observables or returns
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
    // any observables, the new child context will automatically get a dependency on the parent context.
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
                    // Register a dependency on the binding context to support observable view models.
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
                    ko.tasks.schedule(function() { callback(cachedDefinition.definition); });
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
                // adding an extra task schedule if it's unnecessary (i.e., the completion is already
                // async).
                //
                // You can bypass the 'always asynchronous' feature by putting the synchronous:true
                // flag on your component configuration when you register it.
                if (completedAsync || isSynchronousComponent) {
                    // Note that notifySubscribers ignores any dependencies read within the callback.
                    // See comment in loaderRegistryBehaviors.js for reasoning
                    subscribable['notifySubscribers'](definition);
                } else {
                    ko.tasks.schedule(function() {
                        subscribable['notifySubscribers'](definition);
                    });
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
    };

    ko.components.isRegistered = function(componentName) {
        return defaultConfigRegistry.hasOwnProperty(componentName);
    };

    ko.components.unregister = function(componentName) {
        delete defaultConfigRegistry[componentName];
        ko.components.clearCachedDefinition(componentName);
    };

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
        if (ko.components.isRegistered(tagNameLower)) {
            // Try to determine that this node can be considered a *custom* element; see https://github.com/knockout/knockout/issues/1603
            if (tagNameLower.indexOf('-') != -1 || ('' + node) == "[object HTMLUnknownElement]" || (ko.utils.ieVersion <= 8 && node.tagName === tagNameLower)) {
                return tagNameLower;
            }
        }
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
                    currentViewModel = null;
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
            if (valueIsArray) {
                var writableValue = rawValueIsNonArrayObservable ? modelValue.peek() : modelValue;
                if (oldElemValue !== elemValue) {
                    // When we're responding to the checkedValue changing, and the element is
                    // currently checked, replace the old elem value with the new elem value
                    // in the model array.
                    if (isChecked) {
                        ko.utils.addOrRemoveItem(writableValue, elemValue, true);
                        ko.utils.addOrRemoveItem(writableValue, oldElemValue, false);
                    }

                    oldElemValue = elemValue;
                } else {
                    // When we're responding to the user having checked/unchecked a checkbox,
                    // add/remove the element value to the model array.
                    ko.utils.addOrRemoveItem(writableValue, elemValue, isChecked);
                }
                if (rawValueIsNonArrayObservable && ko.isWriteableObservable(modelValue)) {
                    modelValue(writableValue);
                }
            } else {
                ko.expressionRewriting.writeValueToProperty(modelValue, allBindings, 'checked', elemValue, true);
            }
        };

        function updateView() {
            // This updates the view value from the model value.
            // It runs in response to changes in the bound (checked) value.
            var modelValue = ko.utils.unwrapObservable(valueAccessor());

            if (valueIsArray) {
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

        var rawValue = valueAccessor(),
            valueIsArray = isCheckbox && (ko.utils.unwrapObservable(rawValue) instanceof Array),
            rawValueIsNonArrayObservable = !(valueIsArray && rawValue.push && rawValue.splice),
            oldElemValue = valueIsArray ? checkedValue() : undefined,
            useCheckedValue = isRadio || valueIsArray;

        // IE 6 won't allow radio buttons to be selected unless they have a name
        if (isRadio && !element.name)
            ko.bindingHandlers['uniqueName']['init'](element, function() { return true });

        // Set up two computeds to update the binding:

        // The first responds to changes in the checkedValue value and to element clicks
        ko.computed(updateModel, null, { disposeWhenNodeIsRemoved: element });
        ko.utils.registerEventHandler(element, "click", updateModel);

        // The second responds to changes in the model value (the one associated with the checked binding)
        ko.computed(updateView, null, { disposeWhenNodeIsRemoved: element });

        rawValue = undefined;
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
            value = ko.utils.stringTrim(String(value || '')); // Make sure we don't try to store or set a non-string value
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
        var value = !!ko.utils.unwrapObservable(valueAccessor());

        if (!element[hasfocusUpdatingProperty] && element[hasfocusLastValue] !== value) {
            value ? element.focus() : element.blur();

            // In IE, the blur method doesn't always cause the element to lose focus (for example, if the window is not in focus).
            // Setting focus to the body element does seem to be reliable in IE, but should only be used if we know that the current
            // element was focused already.
            if (!value && element[hasfocusLastValue]) {
                element.ownerDocument.body.focus();
            }

            // For IE, which doesn't reliably fire "focus" or "blur" events synchronously
            ko.dependencyDetection.ignore(ko.utils.triggerEvent, null, [element, value ? "focusin" : "focusout"]);
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

        var newValue = ko.utils.unwrapObservable(valueAccessor()),
            previousScrollTop = element.scrollTop;

        if (newValue && typeof newValue.length == "number") {
            ko.utils.arrayForEach(element.getElementsByTagName("option"), function(node) {
                var isSelected = ko.utils.arrayIndexOf(newValue, ko.selectExtensions.readValue(node)) >= 0;
                if (node.selected != isSelected) {      // This check prevents flashing of the select element in IE
                    ko.utils.setOptionNodeSelectionState(node, isSelected);
                }
            });
        }

        element.scrollTop = previousScrollTop;
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
                timeoutHandle = ko.utils.setTimeout(handler, 4);
            }
        };

        // IE9 will mess up the DOM if you handle events synchronously which results in DOM changes (such as other bindings);
        // so we'll make sure all updates are asynchronous
        var ieUpdateModel = ko.utils.ieVersion == 9 ? deferUpdateModel : updateModel;

        var updateView = function () {
            var modelValue = ko.utils.unwrapObservable(valueAccessor());

            if (modelValue === null || modelValue === undefined) {
                modelValue = '';
            }

            if (elementValueBeforeEvent !== undefined && modelValue === elementValueBeforeEvent) {
                ko.utils.setTimeout(updateView, 4);
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
                        ieUpdateModel(event);
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
                    registerForSelectionChangeEvent(element, ieUpdateModel);  // 'selectionchange' covers cut, paste, drop, delete, etc.
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
                    ko.utils.setTimeout(valueUpdateHandler, 0);
                };
                eventName = eventName.substring("after".length);
            }
            ko.utils.registerEventHandler(element, eventName, handler);
        });

        var updateFromModel = function () {
            var newValue = ko.utils.unwrapObservable(valueAccessor());
            var elementValue = ko.selectExtensions.readValue(element);

            if (elementValueBeforeEvent !== null && newValue === elementValueBeforeEvent) {
                ko.utils.setTimeout(updateFromModel, 0);
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
                        ko.utils.setTimeout(applyValueAction, 0);
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

    // template types
    var templateScript = 1,
        templateTextArea = 2,
        templateTemplate = 3,
        templateElement = 4;

    ko.templateSources.domElement = function(element) {
        this.domElement = element;

        if (element) {
            var tagNameLower = ko.utils.tagNameLower(element);
            this.templateType =
                tagNameLower === "script" ? templateScript :
                tagNameLower === "textarea" ? templateTextArea :
                    // For browsers with proper <template> element support, where the .content property gives a document fragment
                tagNameLower == "template" && element.content && element.content.nodeType === 11 ? templateTemplate :
                templateElement;
        }
    }

    ko.templateSources.domElement.prototype['text'] = function(/* valueToWrite */) {
        var elemContentsProperty = this.templateType === templateScript ? "text"
                                 : this.templateType === templateTextArea ? "value"
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

    var templatesDomDataKey = ko.utils.domData.nextKey();
    function getTemplateDomData(element) {
        return ko.utils.domData.get(element, templatesDomDataKey) || {};
    }
    function setTemplateDomData(element, data) {
        ko.utils.domData.set(element, templatesDomDataKey, data);
    }

    ko.templateSources.domElement.prototype['nodes'] = function(/* valueToWrite */) {
        var element = this.domElement;
        if (arguments.length == 0) {
            var templateData = getTemplateDomData(element),
                containerData = templateData.containerData;
            return containerData || (
                this.templateType === templateTemplate ? element.content :
                this.templateType === templateElement ? element :
                undefined);
        } else {
            var valueToWrite = arguments[0];
            setTemplateDomData(element, {containerData: valueToWrite});
        }
    };

    // ---- ko.templateSources.anonymousTemplate -----
    // Anonymous templates are normally saved/retrieved as DOM nodes through "nodes".
    // For compatibility, you can also read "text"; it will be serialized from the nodes on demand.
    // Writing to "text" is still supported, but then the template data will not be available as DOM nodes.

    ko.templateSources.anonymousTemplate = function(element) {
        this.domElement = element;
    }
    ko.templateSources.anonymousTemplate.prototype = new ko.templateSources.domElement();
    ko.templateSources.anonymousTemplate.prototype.constructor = ko.templateSources.anonymousTemplate;
    ko.templateSources.anonymousTemplate.prototype['text'] = function(/* valueToWrite */) {
        if (arguments.length == 0) {
            var templateData = getTemplateDomData(this.domElement);
            if (templateData.textData === undefined && templateData.containerData)
                templateData.textData = templateData.containerData.innerHTML;
            return templateData.textData;
        } else {
            var valueToWrite = arguments[0];
            setTemplateDomData(this.domElement, {textData: valueToWrite});
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

        if (oldArray.length < newArray.length)
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
        ko.utils.findMovesInArrayComparison(notInBig, notInSml, !options['dontLimitMoves'] && smlIndexMax * 10);

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

    var lastMappingResultDomDataKey = ko.utils.domData.nextKey(),
        deletedItemDummyValue = ko.utils.domData.nextKey();

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
                        if (mapData.dependentObservable) {
                            mapData.dependentObservable.dispose();
                            mapData.dependentObservable = undefined;
                        }

                        // Queue these nodes for later removal
                        if (ko.utils.fixUpContinuousNodeArray(mapData.mappedNodes, domNode).length) {
                            if (options['beforeRemove']) {
                                newMappingResult.push(mapData);
                                itemsToProcess.push(mapData);
                                if (mapData.arrayEntry === deletedItemDummyValue) {
                                    mapData = null;
                                } else {
                                    itemsForBeforeRemoveCallbacks[i] = mapData;
                                }
                            }
                            if (mapData) {
                                nodesToDelete.push.apply(nodesToDelete, mapData.mappedNodes);
                            }
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

        // Store a copy of the array items we just considered so we can difference it next time
        ko.utils.domData.set(domNode, lastMappingResultDomDataKey, newMappingResult);

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

        // Replace the stored values of deleted items with a dummy value. This provides two benefits: it marks this item
        // as already "removed" so we won't call beforeRemove for it again, and it ensures that the item won't match up
        // with an actual item in the array and appear as "retained" or "moved".
        for (i = 0; i < itemsForBeforeRemoveCallbacks.length; ++i) {
            if (itemsForBeforeRemoveCallbacks[i]) {
                itemsForBeforeRemoveCallbacks[i].arrayEntry = deletedItemDummyValue;
            }
        }

        // Finally call afterMove and afterAdd callbacks
        callCallback(options['afterMove'], itemsForMoveCallbacks);
        callCallback(options['afterAdd'], itemsForAfterAddCallbacks);
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
    var m,ba=this;function ca(a,b){var c=a.split("."),d=("undefined"!==typeof enclosingObject&&enclosingObject?enclosingObject:window)||ba;c[0]in d||!d.execScript||d.execScript("var "+c[0]);for(var e;c.length&&(e=c.shift());)c.length||void 0===b?d[e]?d=d[e]:d=d[e]={}:d[e]=b}
function t(a,b){function c(){}c.prototype=b.prototype;a.sd=b.prototype;a.prototype=new c;a.prototype.constructor=a;a.Xd=function(a,c,f){for(var g=Array(arguments.length-2),k=2;k<arguments.length;k++)g[k-2]=arguments[k];return b.prototype[c].apply(a,g)}};function da(a,b,c,d){d=d[b];if(!d)throw Error("unknown writing-mode: "+b);b=d[c||"ltr"];if(!b)throw Error("unknown direction: "+c);for(c=0;c<b.length;c++)if(d=b[c],d=a.replace(d.f,d.b),d!==a)return d;return a}function ea(a){var b=fa,c={};Object.keys(b).forEach(function(d){var e=c[d]={},f=b[d];Object.keys(f).forEach(function(b){e[b]=f[b].map(function(b){return{f:new RegExp("(-?)"+(a?b.G:b.H)+"(-?)"),b:"$1"+(a?b.H:b.G)+"$2"}})})});return c}
var fa={"horizontal-tb":{ltr:[{G:"inline-start",H:"left"},{G:"inline-end",H:"right"},{G:"block-start",H:"top"},{G:"block-end",H:"bottom"},{G:"inline-size",H:"width"},{G:"block-size",H:"height"}],rtl:[{G:"inline-start",H:"right"},{G:"inline-end",H:"left"},{G:"block-start",H:"top"},{G:"block-end",H:"bottom"},{G:"inline-size",H:"width"},{G:"block-size",H:"height"}]},"vertical-rl":{ltr:[{G:"inline-start",H:"top"},{G:"inline-end",H:"bottom"},{G:"block-start",H:"right"},{G:"block-end",H:"left"},{G:"inline-size",
H:"height"},{G:"block-size",H:"width"}],rtl:[{G:"inline-start",H:"bottom"},{G:"inline-end",H:"top"},{G:"block-start",H:"right"},{G:"block-end",H:"left"},{G:"inline-size",H:"height"},{G:"block-size",H:"width"}]},"vertical-lr":{ltr:[{G:"inline-start",H:"top"},{G:"inline-end",H:"bottom"},{G:"block-start",H:"left"},{G:"block-end",H:"right"},{G:"inline-size",H:"height"},{G:"block-size",H:"width"}],rtl:[{G:"inline-start",H:"bottom"},{G:"inline-end",H:"top"},{G:"block-start",H:"left"},{G:"block-end",H:"right"},
{G:"inline-size",H:"height"},{G:"block-size",H:"width"}]}},ga=ea(!0),ha=ea(!1),ia={"horizontal-tb":[{G:"line-left",H:"left"},{G:"line-right",H:"right"},{G:"over",H:"top"},{G:"under",H:"bottom"}],"vertical-rl":[{G:"line-left",H:"top"},{G:"line-right",H:"bottom"},{G:"over",H:"right"},{G:"under",H:"left"}],"vertical-lr":[{G:"line-left",H:"top"},{G:"line-right",H:"bottom"},{G:"over",H:"right"},{G:"under",H:"left"}]};var ja={Rd:"ltr",Td:"rtl"};ca("vivliostyle.constants.PageProgression",ja);ja.LTR="ltr";ja.RTL="rtl";var ka={Qd:"left",Sd:"right"};ca("vivliostyle.constants.PageSide",ka);ka.LEFT="left";ka.RIGHT="right";function la(a){var b=a.error,c=b&&(b.frameTrace||b.stack);a=[].concat(a.messages);b&&(0<a.length&&(a=a.concat(["\n"])),a=a.concat([b.toString()]),c&&(a=a.concat(["\n"]).concat(c)));return a}function ma(a){a=Array.b(a);var b=null;a[0]instanceof Error&&(b=a.shift());return{error:b,messages:a}}function na(a){function b(a){return function(b){return a.apply(c,b)}}var c=a||console;this.g=b(c.debug||c.log);this.j=b(c.info||c.log);this.k=b(c.warn||c.log);this.h=b(c.error||c.log);this.e={}}
function oa(a,b,c){(a=a.e[b])&&a.forEach(function(a){a(c)})}function pa(a,b){var c=u,d=c.e[a];d||(d=c.e[a]=[]);d.push(b)}na.prototype.d=function(a){var b=ma(arguments);this.g(la(b));oa(this,1,b)};na.prototype.f=function(a){var b=ma(arguments);this.j(la(b));oa(this,2,b)};na.prototype.b=function(a){var b=ma(arguments);this.k(la(b));oa(this,3,b)};na.prototype.error=function(a){var b=ma(arguments);this.h(la(b));oa(this,4,b)};var u=new na;function qa(a){var b=a.match(/^([^#]*)/);return b?b[1]:a}var ra=window.location.href;
function sa(a,b){if(!b||a.match(/^\w{2,}:/))return a.toLowerCase().match("^javascript:")?"#":a;b.match(/^\w{2,}:\/\/[^\/]+$/)&&(b+="/");var c;if(a.match(/^\/\//))return(c=b.match(/^(\w{2,}:)\/\//))?c[1]+a:a;if(a.match(/^\//))return(c=b.match(/^(\w{2,}:\/\/[^\/]+)\//))?c[1]+a:a;a.match(/^\.(\/|$)/)&&(a=a.substr(1));c=b;var d=c.match(/^([^#?]*)/);b=d?d[1]:c;if(a.match(/^\#/))return b+a;c=b.lastIndexOf("/");if(0>c)return a;for(d=b.substr(0,c+1)+a;;){c=d.indexOf("/../");if(0>=c)break;var e=d.lastIndexOf("/",
c-1);if(0>=e)break;d=d.substr(0,e)+d.substr(c+3)}return d.replace(/\/(\.\/)+/g,"/")}function ta(a){a=new RegExp("#(.*&)?"+ua(a)+"=([^#&]*)");return(a=window.location.href.match(a))?a[2]:null}function va(a,b){var c=new RegExp("#(.*&)?"+ua("f")+"=([^#&]*)"),d=a.match(c);return d?(c=d[2].length,d=d.index+d[0].length-c,a.substr(0,d)+b+a.substr(d+c)):a.match(/#/)?a+"&f="+b:a+"#f="+b}function wa(a){return null==a?a:a.toString()}function xa(){this.b=[null]}
xa.prototype.length=function(){return this.b.length-1};function ya(){return za.replace(/-[a-z]/g,function(a){return a.substr(1).toUpperCase()})}var Aa="-webkit- -moz- -ms- -o- -epub- ".split(" "),Ba;
a:{var Ca="transform transform-origin hyphens writing-mode text-orientation box-decoration-break column-count column-width column-rule-color column-rule-style column-rule-width font-kerning text-size-adjust line-break tab-size text-align-last text-justify word-break word-wrap text-decoration-color text-decoration-line text-decoration-skip text-decoration-style text-emphasis-color text-emphasis-position text-emphasis-style text-underline-position backface-visibility text-overflow text-combine text-combine-horizontal text-combine-upright text-orientation touch-action".split(" "),Da=
{},Fa=document.createElement("span"),Ga=Fa.style,Ha=null;try{if(Fa.style.setProperty("-ms-transform-origin","0% 0%"),"0% 0%"==Fa.style.getPropertyValue("-ms-transform-origin")){for(var Ia=0;Ia<Ca.length;Ia++)Da[Ca[Ia]]="-ms-"+Ca[Ia];Ba=Da;break a}}catch(Ja){}for(Ia=0;Ia<Ca.length;Ia++){var Ka=Ca[Ia],za=null,La=null;Ha&&(za=Ha+Ka,La=ya());if(!La||null==Ga[La])for(var Ma=0;Ma<Aa.length&&(Ha=Aa[Ma],za=Ha+Ka,La=ya(),null==Ga[La]);Ma++);null!=Ga[La]&&(Da[Ka]=za)}Ba=Da}var Na=Ba;
function w(a,b,c){try{b=Na[b]||b,"-ms-writing-mode"==b&&"vertical-rl"==c&&(c="tb-rl"),a&&a.style&&a.style.setProperty(b,c)}catch(d){u.b(d)}}function Oa(a,b,c){try{return a.style.getPropertyValue(Na[b]||b)}catch(d){}return c||""}function Pa(){this.b=[]}Pa.prototype.append=function(a){this.b.push(a);return this};Pa.prototype.toString=function(){var a=this.b.join("");this.b=[a];return a};function Qa(a){return"\\"+a.charCodeAt(0).toString(16)+" "}
function Ra(a){return a.replace(/[^-_a-zA-Z0-9\u0080-\uFFFF]/g,Qa)}function Sa(a){return a.replace(/[\u0000-\u001F"]/g,Qa)}function Ta(a){return a.replace(/[\s+&?=#\u007F-\uFFFF]+/g,encodeURIComponent)}function Ua(a){return!!a.match(/^[a-zA-Z\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]$/)}function Va(a){return"\\u"+(65536|a.charCodeAt(0)).toString(16).substr(1)}function ua(a){return a.replace(/[^-a-zA-Z0-9_]/g,Va)}
function Wa(a){if(!a)throw"Assert failed";}function Xa(a,b){for(var c=0,d=a;;){Wa(c<=d);Wa(0==c||!b(c-1));Wa(d==a||b(d));if(c==d)return c;var e=c+d>>1;b(e)?d=e:c=e+1}}function Ya(a,b){return a-b}function Za(a,b){for(var c={},d=0;d<a.length;d++){var e=a[d],f=b(e);f&&!c[f]&&(c[f]=e)}return c}var $a={};function ab(a,b){for(var c={},d=0;d<a.length;d++){var e=a[d],f=b(e);f&&(c[f]?c[f].push(e):c[f]=[e])}return c}function bb(a,b){for(var c=Array(a.length),d=0;d<a.length;d++)c[d]=b(a[d],d);return c}
function cb(a,b){var c={},d;for(d in a)c[d]=b(a[d],d);return c}function db(){this.d={}}function eb(a,b){var c=a.d[b.type];if(c){b.target=a;b.currentTarget=a;for(var d=0;d<c.length;d++)c[d](b)}}db.prototype.addEventListener=function(a,b,c){c||((c=this.d[a])?c.push(b):this.d[a]=[b])};db.prototype.removeEventListener=function(a,b,c){!c&&(a=this.d[a])&&(b=a.indexOf(b),0<=b&&a.splice(b,0))};var fb=null;
function gb(a){if(null==fb){var b=a.ownerDocument,c=b.createElement("div");c.style.position="absolute";c.style.top="0px";c.style.left="0px";c.style.width="100px";c.style.height="100px";c.style.overflow="hidden";c.style.lineHeight="16px";c.style.fontSize="16px";a.appendChild(c);var d=b.createElement("div");d.style.width="0px";d.style.height="14px";d.style.cssFloat="left";c.appendChild(d);d=b.createElement("div");d.style.width="50px";d.style.height="50px";d.style.cssFloat="left";d.style.clear="left";
c.appendChild(d);d=b.createTextNode("a a a a a a a a a a a a a a a a");c.appendChild(d);b=b.createRange();b.setStart(d,0);b.setEnd(d,1);fb=40>b.getBoundingClientRect().left;a.removeChild(c)}return fb}var hb=null;function ib(a){return 1==a.nodeType&&(a=a.getAttribute("id"))&&a.match(/^[-a-zA-Z_0-9.\u007F-\uFFFF]+$/)?a:null}function jb(a){return"^"+a}function kb(a){return a.substr(1)}function lb(a){return a?a.replace(/\^[\[\]\(\),=;^]/g,kb):a}
function mb(a){for(var b={};a;){var c=a.match(/^;([^;=]+)=(([^;]|\^;)*)/);if(!c)break;var d=c[1],e;a:{e=c[2];var f=[];do{var g=e.match(/^(\^,|[^,])*/),k=lb(g[0]);e=e.substr(g[0].length+1);if(!e&&!f.length){e=k;break a}f.push(k)}while(e);e=f}b[d]=e;a=a.substr(c[0].length)}return b}function nb(){}nb.prototype.e=function(a){a.append("!")};nb.prototype.f=function(){return!1};function pb(a,b,c){this.b=a;this.id=b;this.Ra=c}
pb.prototype.e=function(a){a.append("/");a.append(this.b.toString());if(this.id||this.Ra)a.append("["),this.id&&a.append(this.id),this.Ra&&(a.append(";s="),a.append(this.Ra)),a.append("]")};
pb.prototype.f=function(a){if(1!=a.da.nodeType)throw Error("E_CFI_NOT_ELEMENT");var b=a.da,c=b.children,d=c.length,e=Math.floor(this.b/2)-1;0>e||0==d?(c=b.firstChild,a.da=c||b):(c=c[Math.min(e,d-1)],this.b&1&&((b=c.nextSibling)&&1!=b.nodeType?c=b:a.K=!0),a.da=c);if(this.id&&(a.K||this.id!=ib(a.da)))throw Error("E_CFI_ID_MISMATCH");a.Ra=this.Ra;return!0};function qb(a,b,c,d){this.offset=a;this.d=b;this.b=c;this.Ra=d}
qb.prototype.f=function(a){if(0<this.offset&&!a.K){for(var b=this.offset,c=a.da;;){var d=c.nodeType;if(1==d)break;var e=c.nextSibling;if(3<=d&&5>=d){d=c.textContent.length;if(b<=d)break;if(!e){b=d;break}b-=d}if(!e){b=0;break}c=e}a.da=c;a.offset=b}a.Ra=this.Ra;return!0};
qb.prototype.e=function(a){a.append(":");a.append(this.offset.toString());if(this.d||this.b||this.Ra){a.append("[");if(this.d||this.b)this.d&&a.append(this.d.replace(/[\[\]\(\),=;^]/g,jb)),a.append(","),this.b&&a.append(this.b.replace(/[\[\]\(\),=;^]/g,jb));this.Ra&&(a.append(";s="),a.append(this.Ra));a.append("]")}};function rb(){this.ha=null}
function sb(a,b){var c=b.match(/^#?epubcfi\((.*)\)$/);if(!c)throw Error("E_CFI_NOT_CFI");for(var d=c[1],e=0,f=[];;)switch(d.charAt(e)){case "/":e++;c=d.substr(e).match(/^(0|[1-9][0-9]*)(\[([-a-zA-Z_0-9.\u007F-\uFFFF]+)(;([^\]]|\^\])*)?\])?/);if(!c)throw Error("E_CFI_NUMBER_EXPECTED");var e=e+c[0].length,g=parseInt(c[1],10),k=c[3],c=mb(c[4]);f.push(new pb(g,k,wa(c.s)));break;case ":":e++;c=d.substr(e).match(/^(0|[1-9][0-9]*)(\[((([^\];,]|\^[\];,])*)(,(([^\];,]|\^[\];,])*))?)(;([^]]|\^\])*)?\])?/);
if(!c)throw Error("E_CFI_NUMBER_EXPECTED");e+=c[0].length;g=parseInt(c[1],10);(k=c[4])&&(k=lb(k));var h=c[7];h&&(h=lb(h));c=mb(c[10]);f.push(new qb(g,k,h,wa(c.s)));break;case "!":e++;f.push(new nb);break;case "~":case "@":case "":a.ha=f;return;default:throw Error("E_CFI_PARSE_ERROR");}}function tb(a,b){for(var c={da:b.documentElement,offset:0,K:!1,Ra:null,Ib:null},d=0;d<a.ha.length;d++)if(!a.ha[d].f(c)){++d<a.ha.length&&(c.Ib=new rb,c.Ib.ha=a.ha.slice(d));break}return c}
rb.prototype.trim=function(a,b){return a.replace(/\s+/g," ").match(b?/^[ -\uD7FF\uE000-\uFFFF]{0,8}/:/[ -\uD7FF\uE000-\uFFFF]{0,8}$/)[0].replace(/^\s/,"").replace(/\s$/,"")};
function ub(a,b,c){for(var d=!1,e=null,f=[],g=b.parentNode,k="",h="";b;){switch(b.nodeType){case 3:case 4:case 5:var l=b.textContent,n=l.length;d?(c+=n,k||(k=l)):(c>n&&(c=n),d=!0,k=l.substr(0,c),h=l.substr(c));b=b.previousSibling;continue;case 8:b=b.previousSibling;continue}break}if(0<c||k||h)k=a.trim(k,!1),h=a.trim(h,!0),f.push(new qb(c,k,h,e)),e=null;for(;g&&g&&9!=g.nodeType;){c=d?null:ib(b);for(d=d?1:0;b;)1==b.nodeType&&(d+=2),b=b.previousSibling;f.push(new pb(d,c,e));e=null;b=g;g=g.parentNode;
d=!1}f.reverse();a.ha?(f.push(new nb),a.ha=f.concat(a.ha)):a.ha=f}rb.prototype.toString=function(){if(!this.ha)return"";var a=new Pa;a.append("epubcfi(");for(var b=0;b<this.ha.length;b++)this.ha[b].e(a);a.append(")");return a.toString()};function vb(a){a=a.substr(1);if(a.match(/^[^0-9a-fA-F\n\r]$/))return a;a=parseInt(a,16);return isNaN(a)?"":65535>=a?String.fromCharCode(a):1114111>=a?String.fromCharCode(55296|a>>10&1023,56320|a&1023):"\ufffd"}function wb(a){return a.replace(/\\([0-9a-fA-F]{0,6}(\r\n|[ \n\r\t\f])?|[^0-9a-fA-F\n\r])/g,vb)}function xb(){this.type=0;this.b=!1;this.C=0;this.text="";this.position=0}
function yb(a,b){var c=Array(128),d;for(d=0;128>d;d++)c[d]=a;c[NaN]=35==a?35:72;for(d=0;d<b.length;d+=2)c[b[d]]=b[d+1];return c}var zb=[72,72,72,72,72,72,72,72,72,1,1,72,1,1,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,1,4,34,6,7,8,9,33,10,11,12,13,14,15,16,17,2,2,2,2,2,2,2,2,2,2,18,19,20,21,22,23,24,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,25,29,26,30,3,72,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,27,31,28,32,72];zb[NaN]=80;
var Ab=[43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,52,43,43,43,43,39,43,43,39,39,39,39,39,39,39,39,39,39,43,43,43,43,43,43,43,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,43,44,43,43,39,43,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,43,43,43,43,43];Ab[NaN]=43;
var Bb=[72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,78,59,72,59,59,59,59,59,59,59,59,59,59,72,72,72,72,72,72,72,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,72,61,72,72,78,72,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,72,72,72,72,72];Ab[NaN]=43;
var Cb=[35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,57,59,35,58,58,58,58,58,58,58,58,58,58,35,35,35,35,35,35,35,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,35,61,35,35,60,35,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,35,35,35,35,35];Cb[NaN]=35;
var Db=[45,45,45,45,45,45,45,45,45,73,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,73,45,45,45,45,45,45,45,53,45,45,45,45,45,45,45,39,39,39,39,39,39,39,39,39,39,45,45,45,45,45,45,45,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,45,44,45,45,39,45,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,45,45,45,45,45];Db[NaN]=45;
var Eb=[37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,41,37,37,37,37,37,37,37,37,42,37,39,39,39,39,39,39,39,39,39,39,37,37,37,37,37,37,37,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,37,37,37,37,40,37,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,37,37,37,37,37];Eb[NaN]=37;
var Fb=[38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,41,38,38,38,38,38,38,38,38,38,38,39,39,39,39,39,39,39,39,39,39,38,38,38,38,38,38,38,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,38,38,38,38,40,38,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,38,38,38,38,38];Fb[NaN]=38;
var Gb=yb(35,[61,36]),Hb=yb(35,[58,77]),Ib=yb(35,[61,36,124,50]),Jb=yb(35,[38,51]),Kb=yb(35,[42,54]),Lb=yb(39,[42,55]),Mb=yb(54,[42,55,47,56]),Nb=yb(62,[62,56]),Ob=yb(35,[61,36,33,70]),Pb=yb(62,[45,71]),Qb=yb(63,[45,56]),Rb=yb(76,[9,72,10,72,13,72,32,72]),Sb=yb(39,[39,46,10,72,13,72,92,48]),Tb=yb(39,[34,46,10,72,13,72,92,49]),Ub=yb(39,[39,47,10,74,13,74,92,48]),Vb=yb(39,[34,47,10,74,13,74,92,49]),Wb=yb(64,[9,39,32,39,34,66,39,65,41,72,10,39,13,39]),Xb=yb(39,[41,67,9,79,10,79,13,79,32,79,92,75,40,
72,91,72,93,72,123,72,125,72,NaN,67]),Yb=yb(39,[39,68,10,74,13,74,92,75,NaN,67]),Zb=yb(39,[34,68,10,74,13,74,92,75,NaN,67]),$b=yb(72,[9,39,10,39,13,39,32,39,41,69]);function ac(a,b){this.h=b;this.e=15;this.j=a;this.g=Array(this.e+1);this.b=-1;for(var c=this.position=this.d=this.f=0;c<=this.e;c++)this.g[c]=new xb}function x(a){a.f==a.d&&bc(a);return a.g[a.d]}function z(a,b){(a.f-a.d&a.e)<=b&&bc(a);return a.g[a.d+b&a.e]}function A(a){a.d=a.d+1&a.e}
ac.prototype.error=function(a,b,c){this.h&&this.h.error(c,b)};
function bc(a){var b=a.f,c=0<=a.b?a.b:a.d,d=a.e;b>=c?c+=d:c--;if(c==b){if(0>a.b)throw Error("F_CSSTOK_INTERNAL");for(var b=2*(a.e+1)-1,c=Array(b+1),d=a.b,e=0;d!=a.f;)c[e]=a.g[d],d==a.d&&(a.d=e),d=d+1&a.e,e++;a.b=0;a.f=e;a.e=b;for(a.g=c;e<=b;)c[e++]=new xb;b=a.f;c=d=a.e}for(var e=zb,f=a.j,g=a.position,k=a.g,h=0,l=0,n="",p=0,r=!1,q=k[b],v=-9;;){var y=f.charCodeAt(g);switch(e[y]||e[65]){case 72:h=51;n=isNaN(y)?"E_CSS_UNEXPECTED_EOF":"E_CSS_UNEXPECTED_CHAR";g++;break;case 1:g++;r=!0;continue;case 2:l=
g++;e=Eb;continue;case 3:h=1;l=g++;e=Ab;continue;case 4:l=g++;h=31;e=Gb;continue;case 33:h=2;l=++g;e=Sb;continue;case 34:h=2;l=++g;e=Tb;continue;case 6:l=++g;h=7;e=Ab;continue;case 7:l=g++;h=32;e=Gb;continue;case 8:l=g++;h=21;break;case 9:l=g++;h=32;e=Jb;continue;case 10:l=g++;h=10;break;case 11:l=g++;h=11;break;case 12:l=g++;h=36;e=Gb;continue;case 13:l=g++;h=23;break;case 14:l=g++;h=16;break;case 15:h=24;l=g++;e=Cb;continue;case 16:l=g++;e=Bb;continue;case 78:l=g++;h=9;e=Ab;continue;case 17:l=g++;
h=19;e=Kb;continue;case 18:l=g++;h=18;e=Hb;continue;case 77:g++;h=50;break;case 19:l=g++;h=17;break;case 20:l=g++;h=38;e=Ob;continue;case 21:l=g++;h=39;e=Gb;continue;case 22:l=g++;h=37;e=Gb;continue;case 23:l=g++;h=22;break;case 24:l=++g;h=20;e=Ab;continue;case 25:l=g++;h=14;break;case 26:l=g++;h=15;break;case 27:l=g++;h=12;break;case 28:l=g++;h=13;break;case 29:v=l=g++;h=1;e=Rb;continue;case 30:l=g++;h=33;e=Gb;continue;case 31:l=g++;h=34;e=Ib;continue;case 32:l=g++;h=35;e=Gb;continue;case 35:break;
case 36:g++;h=h+41-31;break;case 37:h=5;p=parseInt(f.substring(l,g),10);break;case 38:h=4;p=parseFloat(f.substring(l,g));break;case 39:g++;continue;case 40:h=3;p=parseFloat(f.substring(l,g));l=g++;e=Ab;continue;case 41:h=3;p=parseFloat(f.substring(l,g));n="%";l=g++;break;case 42:g++;e=Fb;continue;case 43:n=f.substring(l,g);break;case 44:v=g++;e=Rb;continue;case 45:n=wb(f.substring(l,g));break;case 46:n=f.substring(l,g);g++;break;case 47:n=wb(f.substring(l,g));g++;break;case 48:v=g;g+=2;e=Ub;continue;
case 49:v=g;g+=2;e=Vb;continue;case 50:g++;h=25;break;case 51:g++;h=26;break;case 52:n=f.substring(l,g);if(1==h){g++;if("url"==n.toLowerCase()){e=Wb;continue}h=6}break;case 53:n=wb(f.substring(l,g));if(1==h){g++;if("url"==n.toLowerCase()){e=Wb;continue}h=6}break;case 54:e=Lb;g++;continue;case 55:e=Mb;g++;continue;case 56:e=zb;g++;continue;case 57:e=Nb;g++;continue;case 58:h=5;e=Eb;g++;continue;case 59:h=4;e=Fb;g++;continue;case 60:h=1;e=Ab;g++;continue;case 61:h=1;e=Rb;v=g++;continue;case 62:g--;
break;case 63:g-=2;break;case 64:l=g++;e=Xb;continue;case 65:l=++g;e=Yb;continue;case 66:l=++g;e=Zb;continue;case 67:h=8;n=wb(f.substring(l,g));g++;break;case 69:g++;break;case 70:e=Pb;g++;continue;case 71:e=Qb;g++;continue;case 79:if(8>g-v&&f.substring(v+1,g+1).match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])|[ \t]$/)){g++;continue}case 68:h=8;n=wb(f.substring(l,g));g++;e=$b;continue;case 74:g++;if(9>g-v&&f.substring(v+1,g).match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])$/))continue;h=51;n="E_CSS_UNEXPECTED_NEWLINE";
break;case 73:if(9>g-v&&f.substring(v+1,g+1).match(/^[0-9a-fA-F]{0,6}[ \t]$/)){g++;continue}n=wb(f.substring(l,g));break;case 75:v=g++;continue;case 76:g++;e=Db;continue;default:if(e!==zb){h=51;n="E_CSS_UNEXPECTED_STATE";break}l=g;h=0}q.type=h;q.b=r;q.C=p;q.text=n;q.position=l;b++;if(b>=c)break;e=zb;r=!1;q=k[b&d]}a.position=g;a.f=b&d};function cc(){return{fontFamily:"serif",lineHeight:1.25,margin:8,zc:!0,vc:25,yc:!1,Hc:!1,Va:!1,Eb:1,Vc:{print:!0}}}function dc(a){return{fontFamily:a.fontFamily,lineHeight:a.lineHeight,margin:a.margin,zc:a.zc,vc:a.vc,yc:a.yc,Hc:a.Hc,Va:a.Va,Eb:a.Eb,Vc:Object.Bb({},a.Vc)}}var ec=cc(),fc={};function gc(a,b,c,d){var e=Math.min((a-0)/c,(b-0)/d);return"matrix("+e+",0,0,"+e+","+(a-c)/2+","+(b-d)/2+")"}function hc(a){return'"'+Sa(a+"")+'"'}function ic(a){return Ra(a+"")}
function jc(a,b){return a?Ra(a)+"."+Ra(b):Ra(b)}var kc=0;
function lc(a,b){this.parent=a;this.j="S"+kc++;this.children=[];this.b=new B(this,0);this.d=new B(this,1);this.g=new B(this,!0);this.f=new B(this,!1);a&&a.children.push(this);this.values={};this.l={};this.k={};this.h=b;if(!a){var c=this.k;c.floor=Math.floor;c.ceil=Math.ceil;c.round=Math.round;c.sqrt=Math.sqrt;c.min=Math.min;c.max=Math.max;c.letterbox=gc;c["css-string"]=hc;c["css-name"]=ic;c["typeof"]=function(a){return typeof a};mc(this,"page-width",function(){return this.u()});mc(this,"page-height",
function(){return this.l()});mc(this,"pref-font-family",function(){return this.Q.fontFamily});mc(this,"pref-night-mode",function(){return this.Q.Hc});mc(this,"pref-hyphenate",function(){return this.Q.zc});mc(this,"pref-margin",function(){return this.Q.margin});mc(this,"pref-line-height",function(){return this.Q.lineHeight});mc(this,"pref-column-width",function(){return this.Q.vc*this.fontSize});mc(this,"pref-horizontal",function(){return this.Q.yc});mc(this,"pref-spread-view",function(){return this.Q.Va})}}
function mc(a,b,c){a.values[b]=new nc(a,c,b)}function oc(a,b){a.values["page-number"]=b}function pc(a,b){a.k["has-content"]=b}var qc={px:1,"in":96,pt:4/3,pc:16,cm:96/2.54,mm:96/25.4,q:96/2.54/40,em:16,rem:16,ex:8,rex:8};function rc(a,b,c,d){this.A=null;this.u=function(){return this.A?this.A:this.Q.Va?Math.floor(b/2)-this.Q.Eb:b};this.w=null;this.l=function(){return this.w?this.w:c};this.g=d;this.$=null;this.fontSize=function(){return this.$?this.$:d};this.Q=ec;this.B={}}
function sc(a,b){a.B[b.j]={};for(var c=0;c<b.children.length;c++)sc(a,b.children[c])}function tc(a,b,c){return"vw"==b?a.u()/100:"vh"==b?a.l()/100:"em"==b||"rem"==b?c?a.g:a.fontSize():"ex"==b||"rex"==b?qc.ex*(c?a.g:a.fontSize())/qc.em:qc[b]}function uc(a,b,c){do{var d=b.values[c];if(d||b.h&&(d=b.h.call(a,c,!1)))return d;b=b.parent}while(b);throw Error("Name '"+c+"' is undefined");}
function vc(a,b,c,d,e){do{var f=b.l[c];if(f||b.h&&(f=b.h.call(a,c,!0)))return f;if(f=b.k[c]){if(e)return b.b;c=Array(d.length);for(e=0;e<d.length;e++)c[e]=d[e].evaluate(a);return new B(b,f.apply(a,c))}b=b.parent}while(b);throw Error("Function '"+c+"' is undefined");}
function wc(a,b,c){var d="",e=b.match(/^(min|max)-(.*)$/);e&&(d=e[1],b=e[2]);var f=e=null;switch(b){case "width":case "height":case "device-width":case "device-height":case "color":c&&(e=c.evaluate(a))}switch(b){case "width":f=a.u();break;case "height":f=a.l();break;case "device-width":f=window.screen.availWidth;break;case "device-height":f=window.screen.availHeight;break;case "color":f=window.screen.pixelDepth}if(null!=f&&null!=e)switch(d){case "min":return f>=e;case "max":return f<=e;default:return f==
e}else if(null!=f&&null==c)return 0!==f;return!1}function C(a){this.b=a;this.f="_"+kc++}m=C.prototype;m.toString=function(){var a=new Pa;this.ja(a,0);return a.toString()};m.ja=function(){throw Error("F_ABSTRACT");};m.Ga=function(){throw Error("F_ABSTRACT");};m.Aa=function(){return this};m.kb=function(a){return a===this};function xc(a,b,c,d){var e=d[a.f];if(null!=e)return e===fc?!1:e;d[a.f]=fc;b=a.kb(b,c,d);return d[a.f]=b}
m.evaluate=function(a){var b;b=(b=a.B[this.b.j])?b[this.f]:void 0;if("undefined"!=typeof b)return b;b=this.Ga(a);var c=this.f,d=this.b,e=a.B[d.j];e||(e={},a.B[d.j]=e);return e[c]=b};m.Yc=function(){return!1};function yc(a,b){C.call(this,a);this.d=b}t(yc,C);m=yc.prototype;m.Uc=function(){throw Error("F_ABSTRACT");};m.Wc=function(){throw Error("F_ABSTRACT");};m.Ga=function(a){a=this.d.evaluate(a);return this.Wc(a)};m.kb=function(a,b,c){return a===this||xc(this.d,a,b,c)};
m.ja=function(a,b){10<b&&a.append("(");a.append(this.Uc());this.d.ja(a,10);10<b&&a.append(")")};m.Aa=function(a,b){var c=this.d.Aa(a,b);return c===this.d?this:new this.constructor(this.b,c)};function D(a,b,c){C.call(this,a);this.d=b;this.e=c}t(D,C);m=D.prototype;m.Ub=function(){throw Error("F_ABSTRACT");};m.za=function(){throw Error("F_ABSTRACT");};m.Pa=function(){throw Error("F_ABSTRACT");};m.Ga=function(a){var b=this.d.evaluate(a);a=this.e.evaluate(a);return this.Pa(b,a)};
m.kb=function(a,b,c){return a===this||xc(this.d,a,b,c)||xc(this.e,a,b,c)};m.ja=function(a,b){var c=this.Ub();c<=b&&a.append("(");this.d.ja(a,c);a.append(this.za());this.e.ja(a,c);c<=b&&a.append(")")};m.Aa=function(a,b){var c=this.d.Aa(a,b),d=this.e.Aa(a,b);return c===this.d&&d===this.e?this:new this.constructor(this.b,c,d)};function zc(a,b,c){D.call(this,a,b,c)}t(zc,D);zc.prototype.Ub=function(){return 1};function Ac(a,b,c){D.call(this,a,b,c)}t(Ac,D);Ac.prototype.Ub=function(){return 2};
function Bc(a,b,c){D.call(this,a,b,c)}t(Bc,D);Bc.prototype.Ub=function(){return 3};function Cc(a,b,c){D.call(this,a,b,c)}t(Cc,D);Cc.prototype.Ub=function(){return 4};function Dc(a,b){yc.call(this,a,b)}t(Dc,yc);Dc.prototype.Uc=function(){return"!"};Dc.prototype.Wc=function(a){return!a};function Ec(a,b){yc.call(this,a,b)}t(Ec,yc);Ec.prototype.Uc=function(){return"-"};Ec.prototype.Wc=function(a){return-a};function Fc(a,b,c){D.call(this,a,b,c)}t(Fc,zc);Fc.prototype.za=function(){return"&&"};
Fc.prototype.Ga=function(a){return this.d.evaluate(a)&&this.e.evaluate(a)};function Gc(a,b,c){D.call(this,a,b,c)}t(Gc,Fc);Gc.prototype.za=function(){return" and "};function Hc(a,b,c){D.call(this,a,b,c)}t(Hc,zc);Hc.prototype.za=function(){return"||"};Hc.prototype.Ga=function(a){return this.d.evaluate(a)||this.e.evaluate(a)};function Ic(a,b,c){D.call(this,a,b,c)}t(Ic,Hc);Ic.prototype.za=function(){return", "};function Jc(a,b,c){D.call(this,a,b,c)}t(Jc,Ac);Jc.prototype.za=function(){return"<"};
Jc.prototype.Pa=function(a,b){return a<b};function Kc(a,b,c){D.call(this,a,b,c)}t(Kc,Ac);Kc.prototype.za=function(){return"<="};Kc.prototype.Pa=function(a,b){return a<=b};function Lc(a,b,c){D.call(this,a,b,c)}t(Lc,Ac);Lc.prototype.za=function(){return">"};Lc.prototype.Pa=function(a,b){return a>b};function Mc(a,b,c){D.call(this,a,b,c)}t(Mc,Ac);Mc.prototype.za=function(){return">="};Mc.prototype.Pa=function(a,b){return a>=b};function Nc(a,b,c){D.call(this,a,b,c)}t(Nc,Ac);Nc.prototype.za=function(){return"=="};
Nc.prototype.Pa=function(a,b){return a==b};function Oc(a,b,c){D.call(this,a,b,c)}t(Oc,Ac);Oc.prototype.za=function(){return"!="};Oc.prototype.Pa=function(a,b){return a!=b};function Pc(a,b,c){D.call(this,a,b,c)}t(Pc,Bc);Pc.prototype.za=function(){return"+"};Pc.prototype.Pa=function(a,b){return a+b};function Qc(a,b,c){D.call(this,a,b,c)}t(Qc,Bc);Qc.prototype.za=function(){return" - "};Qc.prototype.Pa=function(a,b){return a-b};function Rc(a,b,c){D.call(this,a,b,c)}t(Rc,Cc);Rc.prototype.za=function(){return"*"};
Rc.prototype.Pa=function(a,b){return a*b};function Sc(a,b,c){D.call(this,a,b,c)}t(Sc,Cc);Sc.prototype.za=function(){return"/"};Sc.prototype.Pa=function(a,b){return a/b};function Tc(a,b,c){D.call(this,a,b,c)}t(Tc,Cc);Tc.prototype.za=function(){return"%"};Tc.prototype.Pa=function(a,b){return a%b};function Uc(a,b,c){C.call(this,a);this.C=b;this.ia=c.toLowerCase()}t(Uc,C);Uc.prototype.ja=function(a){a.append(this.C.toString());a.append(Ra(this.ia))};
Uc.prototype.Ga=function(a){return this.C*tc(a,this.ia,!1)};function Vc(a,b){C.call(this,a);this.d=b}t(Vc,C);Vc.prototype.ja=function(a){a.append(this.d)};Vc.prototype.Ga=function(a){return uc(a,this.b,this.d).evaluate(a)};Vc.prototype.kb=function(a,b,c){return a===this||xc(uc(b,this.b,this.d),a,b,c)};function Wc(a,b,c){C.call(this,a);this.d=b;this.name=c}t(Wc,C);Wc.prototype.ja=function(a){this.d&&a.append("not ");a.append(Ra(this.name))};
Wc.prototype.Ga=function(a){var b=this.name;a="all"===b||!!a.Q.Vc[b];return this.d?!a:a};Wc.prototype.kb=function(a,b,c){return a===this||xc(this.value,a,b,c)};Wc.prototype.Yc=function(){return!0};function nc(a,b,c){C.call(this,a);this.sb=b;this.d=c}t(nc,C);nc.prototype.ja=function(a){a.append(this.d)};nc.prototype.Ga=function(a){return this.sb.call(a)};function Xc(a,b,c){C.call(this,a);this.e=b;this.d=c}t(Xc,C);
Xc.prototype.ja=function(a){a.append(this.e);var b=this.d;a.append("(");for(var c=0;c<b.length;c++)c&&a.append(","),b[c].ja(a,0);a.append(")")};Xc.prototype.Ga=function(a){return vc(a,this.b,this.e,this.d,!1).Aa(a,this.d).evaluate(a)};Xc.prototype.kb=function(a,b,c){if(a===this)return!0;for(var d=0;d<this.d.length;d++)if(xc(this.d[d],a,b,c))return!0;return xc(vc(b,this.b,this.e,this.d,!0),a,b,c)};
Xc.prototype.Aa=function(a,b){for(var c,d=c=this.d,e=0;e<c.length;e++){var f=c[e].Aa(a,b);if(c!==d)d[e]=f;else if(f!==c[e]){for(var d=Array(c.length),g=0;g<e;g++)d[g]=c[g];d[e]=f}}c=d;return c===this.d?this:new Xc(this.b,this.e,c)};function Yc(a,b,c,d){C.call(this,a);this.d=b;this.g=c;this.e=d}t(Yc,C);Yc.prototype.ja=function(a,b){0<b&&a.append("(");this.d.ja(a,0);a.append("?");this.g.ja(a,0);a.append(":");this.e.ja(a,0);0<b&&a.append(")")};
Yc.prototype.Ga=function(a){return this.d.evaluate(a)?this.g.evaluate(a):this.e.evaluate(a)};Yc.prototype.kb=function(a,b,c){return a===this||xc(this.d,a,b,c)||xc(this.g,a,b,c)||xc(this.e,a,b,c)};Yc.prototype.Aa=function(a,b){var c=this.d.Aa(a,b),d=this.g.Aa(a,b),e=this.e.Aa(a,b);return c===this.d&&d===this.g&&e===this.e?this:new Yc(this.b,c,d,e)};function B(a,b){C.call(this,a);this.d=b}t(B,C);
B.prototype.ja=function(a){switch(typeof this.d){case "number":case "boolean":a.append(this.d.toString());break;case "string":a.append('"');a.append(Sa(this.d));a.append('"');break;default:throw Error("F_UNEXPECTED_STATE");}};B.prototype.Ga=function(){return this.d};function Zc(a,b,c){C.call(this,a);this.name=b;this.value=c}t(Zc,C);Zc.prototype.ja=function(a){a.append("(");a.append(Sa(this.name.name));a.append(":");this.value.ja(a,0);a.append(")")};
Zc.prototype.Ga=function(a){return wc(a,this.name.name,this.value)};Zc.prototype.kb=function(a,b,c){return a===this||xc(this.value,a,b,c)};Zc.prototype.Aa=function(a,b){var c=this.value.Aa(a,b);return c===this.value?this:new Zc(this.b,this.name,c)};function $c(a,b){C.call(this,a);this.d=b}t($c,C);$c.prototype.ja=function(a){a.append("$");a.append(this.d.toString())};$c.prototype.Aa=function(a,b){var c=b[this.d];if(!c)throw Error("Parameter missing: "+this.d);return c};
function ad(a,b,c){return b===a.f||b===a.b||c==a.f||c==a.b?a.f:b===a.g||b===a.d?c:c===a.g||c===a.d?b:new Fc(a,b,c)}function E(a,b,c){return b===a.b?c:c===a.b?b:new Pc(a,b,c)}function G(a,b,c){return b===a.b?new Ec(a,c):c===a.b?b:new Qc(a,b,c)}function bd(a,b,c){return b===a.b||c===a.b?a.b:b===a.d?c:c===a.d?b:new Rc(a,b,c)}function cd(a,b,c){return b===a.b?a.b:c===a.d?b:new Sc(a,b,c)};var dd={};function ed(){}m=ed.prototype;m.ib=function(a){for(var b=0;b<a.length;b++)a[b].R(this)};m.Oc=function(){throw Error("E_CSS_EMPTY_NOT_ALLOWED");};m.Pc=function(){throw Error("E_CSS_SLASH_NOT_ALLOWED");};m.Nb=function(){throw Error("E_CSS_STR_NOT_ALLOWED");};m.hb=function(){throw Error("E_CSS_IDENT_NOT_ALLOWED");};m.zb=function(){throw Error("E_CSS_NUMERIC_NOT_ALLOWED");};m.yb=function(){throw Error("E_CSS_NUM_NOT_ALLOWED");};m.xb=function(a){return this.yb(a)};
m.lc=function(){throw Error("E_CSS_COLOR_NOT_ALLOWED");};m.Ob=function(){throw Error("E_CSS_URL_NOT_ALLOWED");};m.Wa=function(){throw Error("E_CSS_LIST_NOT_ALLOWED");};m.nb=function(){throw Error("E_CSS_COMMA_NOT_ALLOWED");};m.ob=function(){throw Error("E_CSS_FUNC_NOT_ALLOWED");};m.wb=function(){throw Error("E_CSS_EXPR_NOT_ALLOWED");};function fd(){}t(fd,ed);m=fd.prototype;
m.ib=function(a){for(var b=null,c=0;c<a.length;c++){var d=a[c],e=d.R(this);if(b)b[c]=e;else if(d!==e){b=Array(a.length);for(d=0;d<c;d++)b[d]=a[d];b[c]=e}}return b||a};m.Nb=function(a){return a};m.hb=function(a){return a};m.Pc=function(a){return a};m.zb=function(a){return a};m.yb=function(a){return a};m.xb=function(a){return a};m.lc=function(a){return a};m.Ob=function(a){return a};m.Wa=function(a){var b=this.ib(a.values);return b===a.values?a:new gd(b)};
m.nb=function(a){var b=this.ib(a.values);return b===a.values?a:new hd(b)};m.ob=function(a){var b=this.ib(a.values);return b===a.values?a:new id(a.name,b)};m.wb=function(a){return a};function jd(){}m=jd.prototype;m.toString=function(){var a=new Pa;this.wa(a,!0);return a.toString()};m.stringValue=function(){var a=new Pa;this.wa(a,!1);return a.toString()};m.ea=function(){throw Error("F_ABSTRACT");};m.wa=function(a){a.append("[error]")};m.Xc=function(){return!1};m.Ec=function(){return!1};m.Zc=function(){return!1};
m.nd=function(){return!1};m.$c=function(){return!1};function kd(){if(H)throw Error("E_INVALID_CALL");}t(kd,jd);kd.prototype.ea=function(a){return new B(a,"")};kd.prototype.wa=function(){};kd.prototype.R=function(a){return a.Oc(this)};var H=new kd;function ld(){if(md)throw Error("E_INVALID_CALL");}t(ld,jd);ld.prototype.ea=function(a){return new B(a,"/")};ld.prototype.wa=function(a){a.append("/")};ld.prototype.R=function(a){return a.Pc(this)};var md=new ld;function nd(a){this.b=a}t(nd,jd);
nd.prototype.ea=function(a){return new B(a,this.b)};nd.prototype.wa=function(a,b){b?(a.append('"'),a.append(Sa(this.b)),a.append('"')):a.append(this.b)};nd.prototype.R=function(a){return a.Nb(this)};function od(a){this.name=a;if(dd[a])throw Error("E_INVALID_CALL");dd[a]=this}t(od,jd);od.prototype.ea=function(a){return new B(a,this.name)};od.prototype.wa=function(a,b){b?a.append(Ra(this.name)):a.append(this.name)};od.prototype.R=function(a){return a.hb(this)};od.prototype.nd=function(){return!0};
function J(a){var b=dd[a];b||(b=new od(a));return b}function K(a,b){this.C=a;this.ia=b.toLowerCase()}t(K,jd);K.prototype.ea=function(a,b){return 0==this.C?a.b:b&&"%"==this.ia?100==this.C?b:new Rc(a,b,new B(a,this.C/100)):new Uc(a,this.C,this.ia)};K.prototype.wa=function(a){a.append(this.C.toString());a.append(this.ia)};K.prototype.R=function(a){return a.zb(this)};K.prototype.Ec=function(){return!0};function pd(a){this.C=a}t(pd,jd);
pd.prototype.ea=function(a){return 0==this.C?a.b:1==this.C?a.d:new B(a,this.C)};pd.prototype.wa=function(a){a.append(this.C.toString())};pd.prototype.R=function(a){return a.yb(this)};pd.prototype.Zc=function(){return!0};function qd(a){this.C=a}t(qd,pd);qd.prototype.R=function(a){return a.xb(this)};function rd(a){this.b=a}t(rd,jd);rd.prototype.wa=function(a){a.append("#");var b=this.b.toString(16);a.append("000000".substr(b.length));a.append(b)};rd.prototype.R=function(a){return a.lc(this)};
function sd(a){this.url=a}t(sd,jd);sd.prototype.wa=function(a){a.append('url("');a.append(Sa(this.url));a.append('")')};sd.prototype.R=function(a){return a.Ob(this)};function td(a,b,c,d){var e=b.length;b[0].wa(a,d);for(var f=1;f<e;f++)a.append(c),b[f].wa(a,d)}function gd(a){this.values=a}t(gd,jd);gd.prototype.wa=function(a,b){td(a,this.values," ",b)};gd.prototype.R=function(a){return a.Wa(this)};gd.prototype.$c=function(){return!0};function hd(a){this.values=a}t(hd,jd);
hd.prototype.wa=function(a,b){td(a,this.values,",",b)};hd.prototype.R=function(a){return a.nb(this)};function id(a,b){this.name=a;this.values=b}t(id,jd);id.prototype.wa=function(a,b){a.append(Ra(this.name));a.append("(");td(a,this.values,",",b);a.append(")")};id.prototype.R=function(a){return a.ob(this)};function L(a){this.d=a}t(L,jd);L.prototype.ea=function(){return this.d};L.prototype.wa=function(a){a.append("-epubx-expr(");this.d.ja(a,0);a.append(")")};L.prototype.R=function(a){return a.wb(this)};
L.prototype.Xc=function(){return!0};function ud(a,b){if(a){if(a.Ec())return tc(b,a.ia,!1)*a.C;if(a.Zc())return a.C}return 0}var vd=J("absolute"),wd=J("all"),xd=J("always"),yd=J("auto");J("avoid");
var zd=J("block"),Ad=J("block-end"),Bd=J("block-start"),Cd=J("both"),Dd=J("bottom"),Ed=J("exclusive"),Fd=J("false"),Gd=J("footnote"),Hd=J("hidden"),Id=J("horizontal-tb"),Jd=J("inherit"),Kd=J("inline"),Ld=J("inline-end"),Md=J("inline-start"),Nd=J("landscape"),Od=J("left"),Pd=J("list-item"),Qd=J("ltr"),Rd=J("none"),Sd=J("normal"),Td=J("oeb-page-foot"),Ud=J("oeb-page-head"),Vd=J("page"),Wd=J("relative"),Xd=J("right"),Yd=J("scale"),$d=J("static"),ae=J("rtl");J("table");
var be=J("table-row"),ce=J("top"),de=J("transparent"),ee=J("vertical-lr"),fe=J("vertical-rl"),ge=J("visible"),he=J("true"),ie=new K(100,"%"),je=new K(100,"vw"),ke=new K(100,"vh"),le=new K(0,"px"),me={"font-size":1,color:2};function ne(a,b){return(me[a]||Number.MAX_VALUE)-(me[b]||Number.MAX_VALUE)};function oe(a,b,c,d){this.V=a;this.S=b;this.T=c;this.P=d}function pe(a,b){this.x=a;this.y=b}function qe(){this.bottom=this.right=this.top=this.left=0}function re(a,b,c,d){this.b=a;this.d=b;this.f=c;this.e=d}function se(a,b,c,d){this.S=a;this.P=b;this.V=c;this.T=d;this.right=this.left=null}function te(a,b){return a.b.y-b.b.y||a.b.x-b.b.x}function ue(a){this.b=a}function ve(a,b,c){a=a.b;for(var d=a.length,e=a[d-1],f=0;f<d;f++){var g=a[f];b.push(e.y<g.y?new re(e,g,1,c):new re(g,e,-1,c));e=g}}
function we(a,b,c){for(var d=[],e=0;e<a.b.length;e++){var f=a.b[e];d.push(new pe(f.x+b,f.y+c))}return new ue(d)}function xe(a,b,c,d){for(var e=[],f=0;20>f;f++){var g=2*f*Math.PI/20;e.push(new pe(a+c*Math.sin(g),b+d*Math.cos(g)))}return new ue(e)}function ye(a,b,c,d){return new ue([new pe(a,b),new pe(c,b),new pe(c,d),new pe(a,d)])}function ze(a,b,c,d){this.x=a;this.e=b;this.b=c;this.d=d}
function Ae(a,b){var c=a.b.x+(a.d.x-a.b.x)*(b-a.b.y)/(a.d.y-a.b.y);if(isNaN(c))throw Error("Bad intersection");return c}function Be(a,b,c,d){var e,f;b.d.y<c&&u.b("Error: inconsistent segment (1)");b.b.y<=c?(c=Ae(b,c),e=b.f):(c=b.b.x,e=0);b.d.y>=d?(d=Ae(b,d),f=b.f):(d=b.d.x,f=0);c<d?(a.push(new ze(c,e,b.e,-1)),a.push(new ze(d,f,b.e,1))):(a.push(new ze(d,f,b.e,-1)),a.push(new ze(c,e,b.e,1)))}
function Ce(a,b,c){c=b+c;for(var d=Array(c),e=Array(c),f=0;f<=c;f++)d[f]=0,e[f]=0;for(var g=[],k=!1,h=a.length,l=0;l<h;l++){var n=a[l];d[n.b]+=n.e;e[n.b]+=n.d;for(var p=!1,f=0;f<b;f++)if(d[f]&&!e[f]){p=!0;break}if(p)for(f=b;f<=c;f++)if(d[f]||e[f]){p=!1;break}k!=p&&(g.push(n.x),k=p)}return g}function De(a,b){return b?Math.ceil(a/b)*b:a}function Ee(a,b){return b?Math.floor(a/b)*b:a}function Fe(a){return new pe(a.y,-a.x)}function Ge(a){return new oe(a.S,-a.T,a.P,-a.V)}
function He(a){return new ue(bb(a.b,Fe))}
function Ie(a,b,c,d,e){e&&(a=Ge(a),b=bb(b,He),c=bb(c,He));e=b.length;var f=c?c.length:0,g=[],k=[],h,l,n;for(h=0;h<e;h++)ve(b[h],k,h);for(h=0;h<f;h++)ve(c[h],k,h+e);b=k.length;k.sort(te);for(c=0;k[c].e>=e;)c++;c=k[c].b.y;c>a.S&&g.push(new se(a.S,c,a.T,a.T));h=0;for(var p=[];h<b&&(n=k[h]).b.y<c;)n.d.y>c&&p.push(n),h++;for(;h<b||0<p.length;){var r=a.P,q=De(Math.ceil(c+8),d);for(l=0;l<p.length&&r>q;l++)n=p[l],n.b.x==n.d.x?n.d.y<r&&(r=Math.max(Ee(n.d.y,d),q)):n.b.x!=n.d.x&&(r=q);r>a.P&&(r=a.P);for(;h<
b&&(n=k[h]).b.y<r;)if(n.d.y<c)h++;else if(n.b.y<q){if(n.b.y!=n.d.y||n.b.y!=c)p.push(n),r=q;h++}else{l=Ee(n.b.y,d);l<r&&(r=l);break}q=[];for(l=0;l<p.length;l++)Be(q,p[l],c,r);q.sort(function(a,b){return a.x-b.x||a.d-b.d});q=Ce(q,e,f);if(0==q.length)g.push(new se(c,r,a.T,a.T));else{var v=0,y=a.V;for(l=0;l<q.length;l+=2){var I=Math.max(a.V,q[l]),W=Math.min(a.T,q[l+1])-I;W>v&&(v=W,y=I)}0==v?g.push(new se(c,r,a.T,a.T)):g.push(new se(c,r,Math.max(y,a.V),Math.min(y+v,a.T)))}if(r==a.P)break;c=r;for(l=p.length-
1;0<=l;l--)p[l].d.y<=r&&p.splice(l,1)}Je(a,g);return g}function Je(a,b){for(var c=b.length-1,d=new se(a.P,a.P,a.V,a.T);0<=c;){var e=d,d=b[c];d.V==e.V&&d.T==e.T&&(e.S=d.S,b.splice(c,1),d=e);c--}}function Ke(a,b){for(var c=0,d=a.length;c<d;){var e=Math.floor((c+d)/2);b>=a[e].P?c=e+1:d=e}return c}
function Le(a,b,c,d){for(var e=c.S,f=c.T-c.V,g=c.P-c.S,k=Ke(b,e);;){var h=e+g;if(h>a.P)break;for(var l=a.V,n=a.T,p=k;p<b.length&&b[p].S<h;p++){var r=b[p];r.V>l&&(l=r.V);r.T<n&&(n=r.T)}if(l+f<=n||k>=b.length){"left"==d?(c.V=l,c.T=l+f):(c.V=n-f,c.T=n);c.P+=e-c.S;c.S=e;break}e=b[k].P;k++}}
function Me(a,b,c,d){for(var e=null,e=[new se(c.S,c.P,c.V,c.T)];0<e.length&&e[0].P<=a.S;)e.shift();if(0!=e.length){e[0].S<a.S&&(e[0].S=a.S);c=0==b.length?a.S:b[b.length-1].P;c<a.P&&b.push(new se(c,a.P,a.V,a.T));for(var f=Ke(b,e[0].S),g=0;g<e.length;g++){var k=e[g];if(f==b.length)break;b[f].S<k.S&&(c=b[f],f++,b.splice(f,0,new se(k.S,c.P,c.V,c.T)),c.P=k.S);for(;f<b.length&&(c=b[f++],c.P>k.P&&(b.splice(f,0,new se(k.P,c.P,c.V,c.T)),c.P=k.P),k.V!=k.T&&("left"==d?c.V=k.T:c.T=k.V),c.P!=k.P););}Je(a,b)}}
;function Ne(a){return String.fromCharCode(a>>>24&255,a>>>16&255,a>>>8&255,a&255)}
function Oe(a){var b=new Pa;b.append(a);var c=55-a.length&63;for(b.append("\u0080");0<c;)c--,b.append("\x00");b.append("\x00\x00\x00\x00");b.append(Ne(8*a.length));a=b.toString();for(var b=[1732584193,4023233417,2562383102,271733878,3285377520],c=[],d,e=0;e<a.length;e+=64){for(d=0;16>d;d++){var f=a.substr(e+4*d,4);c[d]=(f.charCodeAt(0)&255)<<24|(f.charCodeAt(1)&255)<<16|(f.charCodeAt(2)&255)<<8|f.charCodeAt(3)&255}for(;80>d;d++)f=c[d-3]^c[d-8]^c[d-14]^c[d-16],c[d]=f<<1|f>>>31;var f=b[0],g=b[1],k=
b[2],h=b[3],l=b[4],n;for(d=0;80>d;d++)n=20>d?(g&k|~g&h)+1518500249:40>d?(g^k^h)+1859775393:60>d?(g&k|g&h|k&h)+2400959708:(g^k^h)+3395469782,n+=(f<<5|f>>>27)+l+c[d],l=h,h=k,k=g<<30|g>>>2,g=f,f=n;b[0]=b[0]+f|0;b[1]=b[1]+g|0;b[2]=b[2]+k|0;b[3]=b[3]+h|0;b[4]=b[4]+l|0}return b}function Pe(a){a=Oe(a);for(var b=[],c=0;c<a.length;c++){var d=a[c];b.push(d>>>24&255,d>>>16&255,d>>>8&255,d&255)}return b}
function Qe(a){a=Oe(a);for(var b=new Pa,c=0;c<a.length;c++)b.append(Ne(a[c]));a=b.toString();b=new Pa;for(c=0;c<a.length;c++)b.append((a.charCodeAt(c)|256).toString(16).substr(1));return b.toString()};var Re=null,Se=null;function M(a){if(!Re)throw Error("E_TASK_NO_CONTEXT");Re.name||(Re.name=a);var b=Re;a=new Te(b,b.top,a);b.top=a;a.b=Ue;return a}function N(a){return new Ve(a)}function We(a,b,c){a=M(a);a.g=c;try{b(a)}catch(d){Xe(a.d,d,a)}return O(a)}function Ye(a){var b=Ze,c;Re?c=Re.d:(c=Se)||(c=new $e(new af));b(c,a,void 0)}var Ue=1;function af(){}af.prototype.currentTime=function(){return(new Date).valueOf()};function bf(a,b){return setTimeout(a,b)}
function $e(a){this.e=a;this.f=1;this.slice=25;this.h=0;this.d=new xa;this.b=this.j=null;this.g=!1;this.N=0;Se||(Se=this)}
function cf(a){if(!a.g){var b=a.d.b[1].b,c=a.e.currentTime();if(null!=a.b){if(c+a.f>a.j)return;clearTimeout(a.b)}b-=c;b<=a.f&&(b=a.f);a.j=c+b;a.b=bf(function(){a.b=null;null!=a.b&&(clearTimeout(a.b),a.b=null);a.g=!0;try{var b=a.e.currentTime();for(a.h=b+a.slice;a.d.length();){var c=a.d.b[1];if(c.b>b)break;var f=a.d,g=f.b.pop(),k=f.b.length;if(1<k){for(var h=1;;){var l=2*h;if(l>=k)break;if(0<df(f.b[l],g))l+1<k&&0<df(f.b[l+1],f.b[l])&&l++;else if(l+1<k&&0<df(f.b[l+1],g))l++;else break;f.b[h]=f.b[l];
h=l}f.b[h]=g}var h=c,n=h.d;h.d=null;n&&n.e==h&&(n.e=null,l=Re,Re=n,Q(n.top,h.e),Re=l);b=a.e.currentTime();if(b>=a.h)break}}catch(p){u.error(p)}a.g=!1;a.d.length()&&cf(a)},b)}}$e.prototype.Ua=function(a,b){var c=this.e.currentTime();a.N=this.N++;a.b=c+(b||0);a:{for(var c=this.d,d=c.b.length;1<d;){var e=Math.floor(d/2),f=c.b[e];if(0<df(f,a)){c.b[d]=a;break a}c.b[d]=f;d=e}c.b[1]=a}cf(this)};
function Ze(a,b,c){var d=new ef(a,c||"");d.top=new Te(d,null,"bootstrap");d.top.b=Ue;d.top.then(function(){function a(){d.h=!1;for(var b=0;b<d.g.length;b++){var c=d.g[b];try{c()}catch(e){u.error(e)}}}try{b().then(function(b){d.f=b;a()})}catch(c){Xe(d,c),a()}});c=Re;Re=d;a.Ua(ff(d.top,"bootstrap"));Re=c;return d}function gf(a){this.d=a;this.N=this.b=0;this.e=null}function df(a,b){return b.b-a.b||b.N-a.N}gf.prototype.Ua=function(a,b){this.e=a;this.d.d.Ua(this,b)};
function ef(a,b){this.d=a;this.name=b;this.g=[];this.b=null;this.h=!0;this.e=this.top=this.j=this.f=null}function hf(a,b){a.g.push(b)}ef.prototype.join=function(){var a=M("Task.join");if(this.h){var b=ff(a,this),c=this;hf(this,function(){b.Ua(c.f)})}else Q(a,this.f);return O(a)};
function Xe(a,b,c){var d=b.frameTrace;if(!d){for(var d=b.stack?b.stack+"\n\t---- async ---\n":"",e=a.top;e;e=e.parent)d+="\t",d+=e.name,d+="\n";b.frameTrace=d}if(c){for(d=a.top;d&&d!=c;)d=d.parent;d==c&&(a.top=d)}for(a.b=b;a.top&&!a.top.g;)a.top=a.top.parent;a.top?(b=a.b,a.b=null,a.top.g(a.top,b)):a.b&&u.error(a.b,"Unhandled exception in task",a.name)}function Ve(a){this.value=a}m=Ve.prototype;m.then=function(a){a(this.value)};m.jc=function(a){return a(this.value)};m.ed=function(a){return new Ve(a)};
m.oa=function(a){Q(a,this.value)};m.ya=function(){return!1};m.Vb=function(){return this.value};function jf(a){this.b=a}m=jf.prototype;m.then=function(a){this.b.then(a)};m.jc=function(a){if(this.ya()){var b=new Te(this.b.d,this.b.parent,"AsyncResult.thenAsync");b.b=Ue;this.b.parent=b;this.b.then(function(c){a(c).then(function(a){Q(b,a)})});return O(b)}return a(this.b.e)};m.ed=function(a){return this.ya()?this.jc(function(){return new Ve(a)}):new Ve(a)};
m.oa=function(a){this.ya()?this.then(function(b){Q(a,b)}):Q(a,this.b.e)};m.ya=function(){return this.b.b==Ue};m.Vb=function(){if(this.ya())throw Error("Result is pending");return this.b.e};function Te(a,b,c){this.d=a;this.parent=b;this.name=c;this.e=null;this.b=0;this.g=this.f=null}function kf(a){if(!Re)throw Error("F_TASK_NO_CONTEXT");if(a!==Re.top)throw Error("F_TASK_NOT_TOP_FRAME");}function O(a){return new jf(a)}
function Q(a,b){kf(a);Re.b||(a.e=b);a.b=2;var c=a.parent;Re.top=c;if(a.f){try{a.f(b)}catch(d){Xe(a.d,d,c)}a.b=3}}Te.prototype.then=function(a){switch(this.b){case Ue:if(this.f)throw Error("F_TASK_FRAME_ALREADY_HAS_CALLBACK");this.f=a;break;case 2:var b=this.d,c=this.parent;try{a(this.e),this.b=3}catch(d){this.b=3,Xe(b,d,c)}break;case 3:throw Error("F_TASK_DEAD_FRAME");default:throw Error("F_TASK_UNEXPECTED_FRAME_STATE "+this.b);}};
function lf(){var a=M("Frame.timeSlice"),b=a.d.d;b.e.currentTime()>=b.h?(u.d("-- time slice --"),ff(a).Ua(!0)):Q(a,!0);return O(a)}function mf(a){function b(d){try{for(;d;){var e=a();if(e.ya()){e.then(b);return}e.then(function(a){d=a})}Q(c,!0)}catch(f){Xe(c.d,f,c)}}var c=M("Frame.loop");b(!0);return O(c)}function nf(a){var b=Re;if(!b)throw Error("E_TASK_NO_CONTEXT");return mf(function(){var c;do c=new of(b,b.top),b.top=c,c.b=Ue,a(c),c=O(c);while(!c.ya()&&c.Vb());return c})}
function ff(a,b){kf(a);if(a.d.e)throw Error("E_TASK_ALREADY_SUSPENDED");var c=new gf(a.d);a.d.e=c;Re=null;a.d.j=b||null;return c}function of(a,b){Te.call(this,a,b,"loop")}t(of,Te);function pf(a){Q(a,!0)}function R(a){Q(a,!1)};function qf(a,b,c,d,e){var f=M("ajax"),g=new XMLHttpRequest,k=ff(f,g),h={status:0,url:a,contentType:null,responseText:null,responseXML:null,ac:null};g.open(c||"GET",a,!0);b&&(g.responseType=b);g.onreadystatechange=function(){if(4===g.readyState){h.status=g.status;if(200==h.status||0==h.status)if(b&&"document"!==b||!g.responseXML){var c=g.response;b&&"text"!==b||"string"!=typeof c?c?"string"==typeof c?h.ac=rf([c]):h.ac=c:u.b("Unexpected empty success response for",a):h.responseText=c;if(c=g.getResponseHeader("Content-Type"))h.contentType=
c.replace(/(.*);.*$/,"$1")}else h.responseXML=g.responseXML,h.contentType=g.responseXML.contentType;k.Ua(h)}};d?(g.setRequestHeader("Content-Type",e||"text/plain; charset=UTF-8"),g.send(d)):g.send(null);return O(f)}function rf(a){var b=window.WebKitBlobBuilder||window.MSBlobBuilder;if(b){for(var b=new b,c=0;c<a.length;c++)b.append(a[c]);return b.getBlob("application/octet-stream")}return new Blob(a,{type:"application/octet-stream"})}
function sf(a){var b=M("readBlob"),c=new FileReader,d=ff(b,c);c.addEventListener("load",function(){d.Ua(c.result)},!1);c.readAsArrayBuffer(a);return O(b)}function tf(a,b){this.I=a;this.type=b;this.g={};this.e={}}tf.prototype.load=function(a,b,c){a=qa(a);var d=this.g[a];return"undefined"!=typeof d?N(d):uf(this.Xb(a,b,c))};
function vf(a,b,c,d){var e=M("fetch");qf(b,a.type).then(function(f){if(c&&400<=f.status)throw Error(d||"Failed to fetch required resource: "+b);a.I(f,a).then(function(c){delete a.e[b];a.g[b]=c;Q(e,c)})});return O(e)}tf.prototype.Xb=function(a,b,c){a=qa(a);if(this.g[a])return null;var d=this.e[a];if(!d){var e=this,d=new wf(function(){return vf(e,a,b,c)},"Fetch "+a);e.e[a]=d;d.start()}return d};function xf(a){a=a.responseText;return N(a?JSON.parse(a):null)};function yf(a){var b=parseInt(a,16);if(isNaN(b))throw Error("E_CSS_COLOR");if(6==a.length)return new rd(b);if(3==a.length)return new rd(b&15|(b&15)<<4|(b&240)<<4|(b&240)<<8|(b&3840)<<8|(b&3840)<<12);throw Error("E_CSS_COLOR");}function zf(a){this.e=a;this.Ta="Author"}m=zf.prototype;m.Cb=function(){return null};m.U=function(){return this.e};m.error=function(){};m.vb=function(a){this.Ta=a};m.Za=function(){};m.uc=function(){};m.Gb=function(){};m.Hb=function(){};m.Ac=function(){};m.Wb=function(){};
m.ab=function(){};m.tc=function(){};m.rc=function(){};m.xc=function(){};m.Gc=function(){};m.gb=function(){};m.ec=function(){};m.Jb=function(){};m.ic=function(){};m.cc=function(){};m.hc=function(){};m.ub=function(){};m.Nc=function(){};m.mb=function(){};m.dc=function(){};m.gc=function(){};m.fc=function(){};m.Lb=function(){};m.Kb=function(){};m.la=function(){};m.Ja=function(){};m.Sa=function(){};function Af(a){switch(a.Ta){case "UA":return 0;case "User":return 100663296;default:return 83886080}}
function Bf(a){switch(a.Ta){case "UA":return 0;case "User":return 16777216;default:return 33554432}}function Cf(){zf.call(this,null);this.d=[];this.b=null}t(Cf,zf);function Df(a,b){a.d.push(a.b);a.b=b}m=Cf.prototype;m.Cb=function(){return null};m.U=function(){return this.b.U()};m.error=function(a,b){this.b.error(a,b)};m.vb=function(a){zf.prototype.vb.call(this,a);0<this.d.length&&(this.b=this.d[0],this.d=[]);this.b.vb(a)};m.Za=function(a,b){this.b.Za(a,b)};m.uc=function(a){this.b.uc(a)};
m.Gb=function(a,b){this.b.Gb(a,b)};m.Hb=function(a,b){this.b.Hb(a,b)};m.Ac=function(a){this.b.Ac(a)};m.Wb=function(a,b,c,d){this.b.Wb(a,b,c,d)};m.ab=function(){this.b.ab()};m.tc=function(){this.b.tc()};m.rc=function(){this.b.rc()};m.xc=function(){this.b.xc()};m.Gc=function(){this.b.Gc()};m.gb=function(){this.b.gb()};m.ec=function(){this.b.ec()};m.Jb=function(a){this.b.Jb(a)};m.ic=function(){this.b.ic()};m.cc=function(){this.b.cc()};m.hc=function(){this.b.hc()};m.ub=function(){this.b.ub()};m.Nc=function(a){this.b.Nc(a)};
m.mb=function(a){this.b.mb(a)};m.dc=function(a){this.b.dc(a)};m.gc=function(){this.b.gc()};m.fc=function(a,b,c){this.b.fc(a,b,c)};m.Lb=function(a,b,c){this.b.Lb(a,b,c)};m.Kb=function(a,b,c){this.b.Kb(a,b,c)};m.la=function(){this.b.la()};m.Ja=function(a,b,c){this.b.Ja(a,b,c)};m.Sa=function(){this.b.Sa()};function Ef(a,b,c){zf.call(this,a);this.I=c;this.D=0;this.Y=b}t(Ef,zf);Ef.prototype.Cb=function(){return this.Y.Cb()};Ef.prototype.error=function(a){u.b(a)};Ef.prototype.la=function(){this.D++};
Ef.prototype.Sa=function(){if(0==--this.D&&!this.I){var a=this.Y;a.b=a.d.pop()}};function Ff(a,b,c){Ef.call(this,a,b,c)}t(Ff,Ef);function Gf(a,b){a.error(b,a.Cb())}function Hf(a,b){Gf(a,b);Df(a.Y,new Ef(a.e,a.Y,!1))}m=Ff.prototype;m.gb=function(){Hf(this,"E_CSS_UNEXPECTED_SELECTOR")};m.ec=function(){Hf(this,"E_CSS_UNEXPECTED_FONT_FACE")};m.Jb=function(){Hf(this,"E_CSS_UNEXPECTED_FOOTNOTE")};m.ic=function(){Hf(this,"E_CSS_UNEXPECTED_VIEWPORT")};m.cc=function(){Hf(this,"E_CSS_UNEXPECTED_DEFINE")};
m.hc=function(){Hf(this,"E_CSS_UNEXPECTED_REGION")};m.ub=function(){Hf(this,"E_CSS_UNEXPECTED_PAGE")};m.mb=function(){Hf(this,"E_CSS_UNEXPECTED_WHEN")};m.dc=function(){Hf(this,"E_CSS_UNEXPECTED_FLOW")};m.gc=function(){Hf(this,"E_CSS_UNEXPECTED_PAGE_TEMPLATE")};m.fc=function(){Hf(this,"E_CSS_UNEXPECTED_PAGE_MASTER")};m.Lb=function(){Hf(this,"E_CSS_UNEXPECTED_PARTITION")};m.Kb=function(){Hf(this,"E_CSS_UNEXPECTED_PARTITION_GROUP")};m.Ja=function(){this.error("E_CSS_UNEXPECTED_PROPERTY",this.Cb())};
var If=[],Jf=[],S=[],Kf=[],Lf=[],Mf=[],Nf=[],T=[],Of=[],Pf=[],Qf=[],Rf=[];If[1]=28;If[36]=29;If[7]=29;If[9]=29;If[14]=29;If[18]=29;If[20]=30;If[13]=27;If[0]=200;Jf[1]=46;Jf[0]=200;Lf[1]=2;Lf[36]=4;Lf[7]=6;Lf[9]=8;Lf[14]=10;Lf[18]=14;S[37]=11;S[23]=12;S[35]=56;S[1]=1;S[36]=3;S[7]=5;S[9]=7;S[14]=9;S[12]=13;S[18]=55;S[50]=42;S[16]=41;Kf[1]=2;Kf[36]=4;Kf[7]=6;Kf[9]=8;Kf[18]=14;Kf[50]=42;Kf[14]=10;Kf[12]=13;Mf[1]=15;Mf[7]=16;Mf[4]=17;Mf[5]=18;Mf[3]=19;Mf[2]=20;Mf[8]=21;Mf[16]=22;Mf[19]=23;Mf[6]=24;
Mf[11]=25;Mf[17]=26;Mf[13]=48;Mf[31]=47;Mf[23]=54;Mf[0]=44;Nf[1]=31;Nf[4]=32;Nf[5]=32;Nf[3]=33;Nf[2]=34;Nf[10]=40;Nf[6]=38;Nf[31]=36;Nf[24]=36;Nf[32]=35;T[1]=45;T[16]=37;T[37]=37;T[38]=37;T[47]=37;T[48]=37;T[39]=37;T[49]=37;T[26]=37;T[25]=37;T[23]=37;T[24]=37;T[19]=37;T[21]=37;T[36]=37;T[18]=37;T[22]=37;T[11]=39;T[12]=43;T[17]=49;Of[0]=200;Of[12]=50;Of[13]=51;Of[14]=50;Of[15]=51;Of[10]=50;Of[11]=51;Of[17]=53;Pf[0]=200;Pf[12]=50;Pf[13]=52;Pf[14]=50;Pf[15]=51;Pf[10]=50;Pf[11]=51;Pf[17]=53;Qf[0]=200;
Qf[12]=50;Qf[13]=51;Qf[14]=50;Qf[15]=51;Qf[10]=50;Qf[11]=51;Rf[11]=0;Rf[16]=0;Rf[22]=1;Rf[18]=1;Rf[26]=2;Rf[25]=2;Rf[38]=3;Rf[37]=3;Rf[48]=3;Rf[47]=3;Rf[39]=3;Rf[49]=3;Rf[41]=3;Rf[23]=4;Rf[24]=4;Rf[36]=5;Rf[19]=5;Rf[21]=5;Rf[0]=6;Rf[52]=2;function Sf(a,b,c,d){this.b=a;this.A=b;this.h=c;this.fa=d;this.l=[];this.I={};this.d=this.B=null;this.k=!1;this.f=2;this.u=null;this.w=!1;this.j=this.D=null;this.g=[];this.e=[];this.M=this.$=!1}
function Tf(a,b){for(var c=[],d=a.l;;){c.push(d[b++]);if(b==d.length)break;if(","!=d[b++])throw Error("Unexpected state");}return c}
function Uf(a,b,c){var d=a.l,e=d.length,f;do f=d[--e];while("undefined"!=typeof f&&"string"!=typeof f);var g=d.length-(e+1);1<g&&d.splice(e+1,g,new gd(d.slice(e+1,d.length)));if(","==b)return null;e++;do f=d[--e];while("undefined"!=typeof f&&("string"!=typeof f||","==f));g=d.length-(e+1);if("("==f){if(")"!=b)return a.h.error("E_CSS_MISMATCHED_C_PAR",c),a.b=Pf,null;a=new id(d[e-1],Tf(a,e+1));d.splice(e-1,g+2,a);return null}return";"!=b||0<=e?(a.h.error("E_CSS_UNEXPECTED_VAL_END",c),a.b=Pf,null):1<
g?new hd(Tf(a,e+1)):d[0]}function Vf(a,b,c){a.b=a.d?Pf:Of;a.h.error(b,c)}
function Wf(a,b,c){for(var d=a.l,e=a.h,f=d.pop(),g;;){var k=d.pop();if(11==b){for(g=[f];16==k;)g.unshift(d.pop()),k=d.pop();if("string"==typeof k){if("{"==k){for(;2<=g.length;)a=g.shift(),c=g.shift(),a=new Ic(e.U(),a,c),g.unshift(a);d.push(new L(g[0]));return!0}if("("==k){b=d.pop();f=d.pop();f=new Xc(e.U(),jc(f,b),g);b=0;continue}}if(10==k){f.Yc()&&(f=new Zc(e.U(),f,null));b=0;continue}}else if("string"==typeof k){d.push(k);break}if(0>k)if(-31==k)f=new Dc(e.U(),f);else if(-24==k)f=new Ec(e.U(),f);
else return Vf(a,"F_UNEXPECTED_STATE",c),!1;else{if(Rf[b]>Rf[k]){d.push(k);break}g=d.pop();switch(k){case 26:f=new Fc(e.U(),g,f);break;case 52:f=new Gc(e.U(),g,f);break;case 25:f=new Hc(e.U(),g,f);break;case 38:f=new Jc(e.U(),g,f);break;case 37:f=new Lc(e.U(),g,f);break;case 48:f=new Kc(e.U(),g,f);break;case 47:f=new Mc(e.U(),g,f);break;case 39:case 49:f=new Nc(e.U(),g,f);break;case 41:f=new Oc(e.U(),g,f);break;case 23:f=new Pc(e.U(),g,f);break;case 24:f=new Qc(e.U(),g,f);break;case 36:f=new Rc(e.U(),
g,f);break;case 19:f=new Sc(e.U(),g,f);break;case 21:f=new Tc(e.U(),g,f);break;case 18:if(1<d.length)switch(d[d.length-1]){case 22:d.pop();f=new Yc(e.U(),d.pop(),g,f);break;case 10:if(g.Yc())f=new Zc(e.U(),g,f);else return Vf(a,"E_CSS_MEDIA_TEST",c),!1}else return Vf(a,"E_CSS_EXPR_COND",c),!1;break;case 22:if(18!=b)return Vf(a,"E_CSS_EXPR_COND",c),!1;case 10:return d.push(g),d.push(k),d.push(f),!1;default:return Vf(a,"F_UNEXPECTED_STATE",c),!1}}}d.push(f);return!1}
function Xf(a){for(var b=[];;){var c=x(a.A);switch(c.type){case 1:b.push(c.text);break;case 23:b.push("+");break;case 4:case 5:b.push(c.C);break;default:return b}A(a.A)}}
function Yf(a,b,c){a=a.h.U();if(!a)return null;c=c||a.g;if(b){b=b.split(/\s+/);for(var d=0;d<b.length;d++)switch(b[d]){case "vertical":c=ad(a,c,new Dc(a,new Vc(a,"pref-horizontal")));break;case "horizontal":c=ad(a,c,new Vc(a,"pref-horizontal"));break;case "day":c=ad(a,c,new Dc(a,new Vc(a,"pref-night-mode")));break;case "night":c=ad(a,c,new Vc(a,"pref-night-mode"));break;default:c=a.f}}return c===a.g?null:new L(c)}
function Zf(a){switch(a.e[a.e.length-1]){case "[selector]":case "font-face":case "-epubx-flow":case "-epubx-viewport":case "-epubx-define":case "-adapt-footnote-area":return!0}return!1}
function $f(a,b,c,d,e){var f=a.h,g=a.A,k=a.l,h,l,n,p;e&&(a.f=2,a.l.push("{"));for(;0<b;--b)switch(h=x(g),a.b[h.type]){case 28:if(18!=z(g,1).type){Zf(a)?(f.error("E_CSS_COLON_EXPECTED",z(g,1)),a.b=Pf):(a.b=Lf,f.gb());continue}l=z(g,2);if(!(l.b||1!=l.type&&6!=l.type)){if(0<=g.b)throw Error("F_CSSTOK_BAD_CALL mark");g.b=g.d}a.d=h.text;a.k=!1;A(g);A(g);a.b=Mf;k.splice(0,k.length);continue;case 46:if(18!=z(g,1).type){a.b=Pf;f.error("E_CSS_COLON_EXPECTED",z(g,1));continue}a.d=h.text;a.k=!1;A(g);A(g);a.b=
Mf;k.splice(0,k.length);continue;case 29:a.b=Lf;f.gb();continue;case 1:if(!h.b){a.b=Qf;f.error("E_CSS_SPACE_EXPECTED",h);continue}f.ab();case 2:if(34==z(g,1).type)if(A(g),A(g),n=a.I[h.text],null!=n)switch(h=x(g),h.type){case 1:f.Za(n,h.text);a.b=S;A(g);break;case 36:f.Za(n,null);a.b=S;A(g);break;default:a.b=Of,f.error("E_CSS_NAMESPACE",h)}else a.b=Of,f.error("E_CSS_UNDECLARED_PREFIX",h);else f.Za(a.B,h.text),a.b=S,A(g);continue;case 3:if(!h.b){a.b=Qf;f.error("E_CSS_SPACE_EXPECTED",h);continue}f.ab();
case 4:if(34==z(g,1).type)switch(A(g),A(g),h=x(g),h.type){case 1:f.Za(null,h.text);a.b=S;A(g);break;case 36:f.Za(null,null);a.b=S;A(g);break;default:a.b=Of,f.error("E_CSS_NAMESPACE",h)}else f.Za(a.B,null),a.b=S,A(g);continue;case 5:h.b&&f.ab();case 6:f.Ac(h.text);a.b=S;A(g);continue;case 7:h.b&&f.ab();case 8:f.uc(h.text);a.b=S;A(g);continue;case 55:h.b&&f.ab();case 14:A(g);h=x(g);switch(h.type){case 1:f.Gb(h.text,null);A(g);a.b=S;continue;case 6:if(l=h.text,A(g),n=Xf(a),h=x(g),11==h.type){f.Gb(l,
n);A(g);a.b=S;continue}}f.error("E_CSS_PSEUDOCLASS_SYNTAX",h);a.b=Of;continue;case 42:A(g);h=x(g);switch(h.type){case 1:f.Hb(h.text,null);a.b=S;A(g);continue;case 6:if(l=h.text,A(g),n=Xf(a),h=x(g),11==h.type){f.Hb(l,n);a.b=S;A(g);continue}}f.error("E_CSS_PSEUDOELEM_SYNTAX",h);a.b=Of;continue;case 9:h.b&&f.ab();case 10:A(g);h=x(g);if(1==h.type)l=h.text,A(g);else if(36==h.type)l=null,A(g);else if(34==h.type)l="";else{a.b=Qf;f.error("E_CSS_ATTR",h);A(g);continue}h=x(g);if(34==h.type){n=l?a.I[l]:l;if(null==
n){a.b=Qf;f.error("E_CSS_UNDECLARED_PREFIX",h);A(g);continue}A(g);h=x(g);if(1!=h.type){a.b=Qf;f.error("E_CSS_ATTR_NAME_EXPECTED",h);continue}l=h.text;A(g);h=x(g)}else n="";switch(h.type){case 39:case 45:case 44:case 46:case 50:p=h.type;A(g);h=x(g);break;case 15:f.Wb(n,l,0,null);a.b=S;A(g);continue;default:a.b=Qf;f.error("E_CSS_ATTR_OP_EXPECTED",h);continue}switch(h.type){case 1:case 2:f.Wb(n,l,p,h.text);A(g);h=x(g);break;default:a.b=Qf;f.error("E_CSS_ATTR_VAL_EXPECTED",h);continue}if(15!=h.type){a.b=
Qf;f.error("E_CSS_ATTR",h);continue}a.b=S;A(g);continue;case 11:f.tc();a.b=Kf;A(g);continue;case 12:f.rc();a.b=Kf;A(g);continue;case 56:f.xc();a.b=Kf;A(g);continue;case 13:a.$?(a.e.push("-epubx-region"),a.$=!1):a.M?(a.e.push("page"),a.M=!1):a.e.push("[selector]");f.la();a.b=If;A(g);continue;case 41:f.Gc();a.b=Lf;A(g);continue;case 15:k.push(J(h.text));A(g);continue;case 16:try{k.push(yf(h.text))}catch(r){f.error("E_CSS_COLOR",h),a.b=Of}A(g);continue;case 17:k.push(new pd(h.C));A(g);continue;case 18:k.push(new qd(h.C));
A(g);continue;case 19:k.push(new K(h.C,h.text));A(g);continue;case 20:k.push(new nd(h.text));A(g);continue;case 21:k.push(new sd(sa(h.text,a.fa)));A(g);continue;case 22:Uf(a,",",h);k.push(",");A(g);continue;case 23:k.push(md);A(g);continue;case 24:l=h.text.toLowerCase();"-epubx-expr"==l?(a.b=Nf,a.f=0,k.push("{")):(k.push(l),k.push("("));A(g);continue;case 25:Uf(a,")",h);A(g);continue;case 47:A(g);h=x(g);l=z(g,1);if(1==h.type&&"important"==h.text.toLowerCase()&&(17==l.type||0==l.type||13==l.type)){A(g);
a.k=!0;continue}Vf(a,"E_CSS_SYNTAX",h);continue;case 54:l=z(g,1);switch(l.type){case 4:case 3:case 5:if(!l.b){A(g);continue}}Vf(a,"E_CSS_UNEXPECTED_PLUS",h);continue;case 26:A(g);case 48:g.b=-1;(l=Uf(a,";",h))&&a.d&&f.Ja(a.d,l,a.k);a.b=d?Jf:If;continue;case 44:A(g);g.b=-1;l=Uf(a,";",h);if(c)return a.u=l,!0;a.d&&l&&f.Ja(a.d,l,a.k);if(d)return!0;Vf(a,"E_CSS_SYNTAX",h);continue;case 31:l=z(g,1);9==l.type?(10!=z(g,2).type||z(g,2).b?(k.push(new Vc(f.U(),jc(h.text,l.text))),a.b=T):(k.push(h.text,l.text,
"("),A(g)),A(g)):(2==a.f||3==a.f?"not"==h.text.toLowerCase()?(A(g),k.push(new Wc(f.U(),!0,l.text))):("only"==h.text.toLowerCase()&&(A(g),h=l),k.push(new Wc(f.U(),!1,h.text))):k.push(new Vc(f.U(),h.text)),a.b=T);A(g);continue;case 38:k.push(null,h.text,"(");A(g);continue;case 32:k.push(new B(f.U(),h.C));A(g);a.b=T;continue;case 33:l=h.text;"%"==l&&(l=a.d&&a.d.match(/height|^(top|bottom)$/)?"vh":"vw");k.push(new Uc(f.U(),h.C,l));A(g);a.b=T;continue;case 34:k.push(new B(f.U(),h.text));A(g);a.b=T;continue;
case 35:A(g);h=x(g);5!=h.type||h.b?Vf(a,"E_CSS_SYNTAX",h):(k.push(new $c(f.U(),h.C)),A(g),a.b=T);continue;case 36:k.push(-h.type);A(g);continue;case 37:a.b=Nf;Wf(a,h.type,h);k.push(h.type);A(g);continue;case 45:"and"==h.text.toLowerCase()?(a.b=Nf,Wf(a,52,h),k.push(52),A(g)):Vf(a,"E_CSS_SYNTAX",h);continue;case 39:Wf(a,h.type,h)&&(a.d?a.b=Mf:Vf(a,"E_CSS_UNBALANCED_PAR",h));A(g);continue;case 43:Wf(a,11,h)&&(a.d||3==a.f?Vf(a,"E_CSS_UNEXPECTED_BRC",h):(1==a.f?f.mb(k.pop()):(h=k.pop(),f.mb(h)),a.e.push("media"),
f.la(),a.b=If));A(g);continue;case 49:if(Wf(a,11,h))if(a.d||3!=a.f)Vf(a,"E_CSS_UNEXPECTED_SEMICOL",h);else return a.j=k.pop(),a.w=!0,a.b=If,A(g),!1;A(g);continue;case 40:k.push(h.type);A(g);continue;case 27:a.b=If;A(g);f.Sa();a.e.length&&a.e.pop();continue;case 30:l=h.text.toLowerCase();switch(l){case "import":A(g);h=x(g);if(2==h.type||8==h.type){a.D=h.text;A(g);h=x(g);if(17==h.type||0==h.type)return a.w=!0,A(g),!1;a.d=null;a.f=3;a.b=Nf;k.push("{");continue}f.error("E_CSS_IMPORT_SYNTAX",h);a.b=Of;
continue;case "namespace":A(g);h=x(g);switch(h.type){case 1:l=h.text;A(g);h=x(g);if((2==h.type||8==h.type)&&17==z(g,1).type){a.I[l]=h.text;A(g);A(g);continue}break;case 2:case 8:if(17==z(g,1).type){a.B=h.text;A(g);A(g);continue}}f.error("E_CSS_NAMESPACE_SYNTAX",h);a.b=Of;continue;case "charset":A(g);h=x(g);if(2==h.type&&17==z(g,1).type){l=h.text.toLowerCase();"utf-8"!=l&&"utf-16"!=l&&f.error("E_CSS_UNEXPECTED_CHARSET "+l,h);A(g);A(g);continue}f.error("E_CSS_CHARSET_SYNTAX",h);a.b=Of;continue;case "font-face":case "-epubx-page-template":case "-epubx-define":case "-epubx-viewport":if(12==
z(g,1).type){A(g);A(g);switch(l){case "font-face":f.ec();break;case "-epubx-page-template":f.gc();break;case "-epubx-define":f.cc();break;case "-epubx-viewport":f.ic()}a.e.push(l);f.la();continue}break;case "-adapt-footnote-area":A(g);h=x(g);switch(h.type){case 12:A(g);f.Jb(null);a.e.push(l);f.la();continue;case 50:if(A(g),h=x(g),1==h.type&&12==z(g,1).type){l=h.text;A(g);A(g);f.Jb(l);a.e.push("-adapt-footnote-area");f.la();continue}}break;case "-epubx-region":A(g);f.hc();a.$=!0;a.b=Lf;continue;case "page":A(g);
f.ub();a.M=!0;a.b=Kf;continue;case "top-left-corner":case "top-left":case "top-center":case "top-right":case "top-right-corner":case "right-top":case "right-middle":case "right-bottom":case "bottom-right-corner":case "bottom-right":case "bottom-center":case "bottom-left":case "bottom-left-corner":case "left-bottom":case "left-middle":case "left-top":A(g);h=x(g);if(12==h.type){A(g);f.Nc(l);a.e.push(l);f.la();continue}break;case "-epubx-when":A(g);a.d=null;a.f=1;a.b=Nf;k.push("{");continue;case "media":A(g);
a.d=null;a.f=2;a.b=Nf;k.push("{");continue;case "-epubx-flow":if(1==z(g,1).type&&12==z(g,2).type){f.dc(z(g,1).text);A(g);A(g);A(g);a.e.push(l);f.la();continue}break;case "-epubx-page-master":case "-epubx-partition":case "-epubx-partition-group":A(g);h=x(g);p=n=null;var q=[];1==h.type&&(n=h.text,A(g),h=x(g));18==h.type&&1==z(g,1).type&&(p=z(g,1).text,A(g),A(g),h=x(g));for(;6==h.type&&"class"==h.text.toLowerCase()&&1==z(g,1).type&&11==z(g,2).type;)q.push(z(g,1).text),A(g),A(g),A(g),h=x(g);if(12==h.type){A(g);
switch(l){case "-epubx-page-master":f.fc(n,p,q);break;case "-epubx-partition":f.Lb(n,p,q);break;case "-epubx-partition-group":f.Kb(n,p,q)}a.e.push(l);f.la();continue}break;case "":f.error("E_CSS_UNEXPECTED_AT"+l,h);a.b=Qf;continue;default:f.error("E_CSS_AT_UNKNOWN "+l,h);a.b=Of;continue}f.error("E_CSS_AT_SYNTAX "+l,h);a.b=Of;continue;case 50:if(c||d)return!0;a.g.push(h.type+1);A(g);continue;case 52:if(c||d)return!0;if(0==a.g.length){a.b=If;continue}case 51:0<a.g.length&&a.g[a.g.length-1]==h.type&&
a.g.pop();0==a.g.length&&13==h.type&&(a.b=If);A(g);continue;case 53:if(c||d)return!0;0==a.g.length&&(a.b=If);A(g);continue;case 200:return!0;default:if(c||d)return!0;if(e)return Wf(a,11,h)?(a.u=k.pop(),!0):!1;if(a.b===Mf&&0<=g.b){h=g;if(0>h.b)throw Error("F_CSSTOK_BAD_CALL reset");h.d=h.b;h.b=-1;a.b=Lf;f.gb();continue}if(a.b!==Of&&a.b!==Qf&&a.b!==Pf){51==h.type?f.error(h.text,h):f.error("E_CSS_SYNTAX",h);a.b=Zf(a)?Pf:Qf;continue}A(g)}return!1}function ag(a){zf.call(this,null);this.e=a}t(ag,zf);
ag.prototype.error=function(a){throw Error(a);};ag.prototype.U=function(){return this.e};
function bg(a,b,c,d,e){var f=M("parseStylesheet"),g=new Sf(If,a,b,c),k=null;e&&(k=cg(new ac(e,b),b,c));if(k=Yf(g,d,k&&k.ea()))b.mb(k),b.la();mf(function(){for(;!$f(g,100,!1,!1,!1);){if(g.w){var a=sa(g.D,c);g.j&&(b.mb(g.j),b.la());var d=M("parseStylesheet.import");dg(a,b,null,null).then(function(){g.j&&b.Sa();g.w=!1;g.D=null;g.j=null;Q(d,!0)});return O(d)}a=lf();if(a.ya)return a}return N(!1)}).then(function(){k&&b.Sa();Q(f,!0)});return O(f)}
function dg(a,b,c,d){return We("parseStylesheetFromURL",function(e){qf(a).then(function(f){f.responseText?(f=new ac(f.responseText,b),bg(f,b,a,c,d).oa(e)):Q(e,!0)})},function(b,c){u.error(c,"Exception while parsing:",a);Q(b,!0)})}function eg(a,b){var c=new Sf(Mf,b,new ag(a),"");$f(c,Number.POSITIVE_INFINITY,!0,!1,!1);return c.u}function cg(a,b,c){a=new Sf(Nf,a,b,c);$f(a,Number.POSITIVE_INFINITY,!1,!1,!0);return a.u}
var fg={"z-index":!0,"column-count":!0,"flow-linger":!0,opacity:!0,page:!0,"flow-priority":!0,utilization:!0};function gg(a,b,c){if(b.Xc())a:{b=b.d;a=b.evaluate(a);switch(typeof a){case "number":c=fg[c]?a==Math.round(a)?new qd(a):new pd(a):new K(a,"px");break a;case "string":c=a?eg(b.b,new ac(a,null)):H;break a;case "boolean":c=a?he:Fd;break a;case "undefined":c=H;break a}throw Error("E_UNEXPECTED");}else c=b;return c};function hg(){this.b={}}t(hg,ed);hg.prototype.hb=function(a){this.b[a.name]=!0;return a};hg.prototype.Wa=function(a){this.ib(a.values);return a};function ig(a){this.value=a}t(ig,ed);ig.prototype.xb=function(a){this.value=a.C;return a};function jg(a,b){if(a){var c=new ig(b);try{return a.R(c),c.value}catch(d){u.b(d,"toInt: ")}}return b}function kg(){this.d=!1;this.b=[];this.name=null}t(kg,ed);kg.prototype.zb=function(a){this.d&&this.b.push(a);return null};
kg.prototype.yb=function(a){this.d&&0==a.C&&this.b.push(new K(0,"px"));return null};kg.prototype.Wa=function(a){this.ib(a.values);return null};kg.prototype.ob=function(a){this.d||(this.d=!0,this.ib(a.values),this.d=!1,this.name=a.name.toLowerCase());return null};
function lg(a,b,c,d,e,f){if(a){var g=new kg;try{a.R(g);var k;a:{if(0<g.b.length){a=[];for(var h=0;h<g.b.length;h++){var l=g.b[h];if("%"==l.ia){var n=0==h%2?d:e;3==h&&"circle"==g.name&&(n=Math.sqrt((d*d+e*e)/2));a.push(l.C*n/100)}else a.push(l.C*tc(f,l.ia,!1))}switch(g.name){case "polygon":if(0==a.length%2){f=[];for(g=0;g<a.length;g+=2)f.push({x:b+a[g],y:c+a[g+1]});k=new ue(f);break a}break;case "rectangle":if(4==a.length){k=ye(b+a[0],c+a[1],b+a[0]+a[2],c+a[1]+a[3]);break a}break;case "ellipse":if(4==
a.length){k=xe(b+a[0],c+a[1],a[2],a[3]);break a}break;case "circle":if(3==a.length){k=xe(b+a[0],c+a[1],a[2],a[2]);break a}}}k=null}return k}catch(p){u.b(p,"toShape:")}}return ye(b,c,b+d,c+e)}function mg(a){this.d=a;this.b={};this.name=null}t(mg,ed);mg.prototype.hb=function(a){this.name=a.toString();this.b[this.name]=this.d?0:(this.b[this.name]||0)+1;return a};mg.prototype.xb=function(a){this.name&&(this.b[this.name]+=a.C-(this.d?0:1));return a};mg.prototype.Wa=function(a){this.ib(a.values);return a};
function ng(a,b){var c=new mg(b);try{a.R(c)}catch(d){u.b(d,"toCounters:")}return c.b};function wf(a,b){this.Xb=a;this.name=b;this.d=!1;this.b=this.f=null;this.e=[]}wf.prototype.start=function(){if(!this.b){var a=this;this.b=Ze(Re.d,function(){var b=M("Fetcher.run");a.Xb().then(function(c){var d=a.e;a.d=!0;a.f=c;a.b=null;a.e=[];if(d)for(var e=0;e<d.length;e++)try{d[e](c)}catch(f){u.error(f,"Error:")}Q(b,c)});return O(b)},this.name)}};function og(a,b){a.d?b(a.f):a.e.push(b)}function uf(a){if(a.d)return N(a.f);a.start();return a.b.join()}
function pg(a){if(0==a.length)return N(!0);if(1==a.length)return uf(a[0]).ed(!0);var b=M("waitForFetches"),c=0;mf(function(){for(;c<a.length;){var b=a[c++];if(!b.d)return uf(b).ed(!0)}return N(!1)}).then(function(){Q(b,!0)});return O(b)}
function qg(a,b){var c=null,d=null;"img"==a.localName&&(c=a.getAttribute("width"),d=a.getAttribute("height"));var e=new wf(function(){function e(b){"img"==a.localName&&(c||a.removeAttribute("width"),d||a.removeAttribute("height"));k.Ua(b?b.type:"timeout")}var g=M("loadImage"),k=ff(g,a);a.addEventListener("load",e,!1);a.addEventListener("error",e,!1);a.addEventListener("abort",e,!1);"http://www.w3.org/2000/svg"==a.namespaceURI?(a.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",b),setTimeout(e,
300)):a.src=b;return O(g)},"loadElement "+b);e.start();return e};function rg(a){this.f=this.e=null;this.b=0;this.d=a}function sg(a,b){this.b=-1;this.d=a;this.e=b}function tg(){this.b=[];this.d=[];this.match=[];this.e=[];this.error=[];this.f=!0}function ug(a,b,c){for(var d=0;d<b.length;d++)a.d[b[d]].b=c;b.splice(0,b.length)}
tg.prototype.clone=function(){for(var a=new tg,b=0;b<this.b.length;b++){var c=this.b[b],d=new rg(c.d);d.b=c.b;a.b.push(d)}for(b=0;b<this.d.length;b++)c=this.d[b],d=new sg(c.d,c.e),d.b=c.b,a.d.push(d);a.match.push.apply(a.match,this.match);a.e.push.apply(a.e,this.e);a.error.push.apply(a.error,this.error);return a};
function vg(a,b,c,d){var e=a.b.length,f=new rg(wg);f.b=0<=d?c?2*d+1:2*d+2:c?-1:-2;a.b.push(f);ug(a,b,e);c=new sg(e,!0);e=new sg(e,!1);b.push(a.d.length);a.d.push(e);b.push(a.d.length);a.d.push(c)}function xg(a){return 1==a.b.length&&0==a.b[0].b&&a.b[0].d instanceof yg}
function zg(a,b,c){if(0!=b.b.length){var d=a.b.length;if(4==c&&1==d&&xg(b)&&xg(a)){c=a.b[0].d;b=b.b[0].d;var d={},e={},f;for(f in c.d)d[f]=c.d[f];for(f in b.d)d[f]=b.d[f];for(var g in c.e)e[g]=c.e[g];for(g in b.e)e[g]=b.e[g];a.b[0].d=new yg(c.b|b.b,d,e)}else{for(f=0;f<b.b.length;f++)a.b.push(b.b[f]);4==c?(a.f=!0,ug(a,a.e,d)):ug(a,a.match,d);g=a.d.length;for(f=0;f<b.d.length;f++)e=b.d[f],e.d+=d,0<=e.b&&(e.b+=d),a.d.push(e);for(f=0;f<b.match.length;f++)a.match.push(b.match[f]+g);3==c&&ug(a,a.match,
d);if(2==c||3==c)for(f=0;f<b.e.length;f++)a.match.push(b.e[f]+g);else if(a.f){for(f=0;f<b.e.length;f++)a.e.push(b.e[f]+g);a.f=b.f}else for(f=0;f<b.e.length;f++)a.error.push(b.e[f]+g);for(f=0;f<b.error.length;f++)a.error.push(b.error[f]+g);b.b=null;b.d=null}}}var U={};function Ag(){}t(Ag,ed);Ag.prototype.f=function(a,b){var c=a[b].R(this);return c?[c]:null};function yg(a,b,c){this.b=a;this.d=b;this.e=c}t(yg,Ag);m=yg.prototype;m.Oc=function(a){return this.b&1?a:null};
m.Pc=function(a){return this.b&2048?a:null};m.Nb=function(a){return this.b&2?a:null};m.hb=function(a){var b=this.d[a.name.toLowerCase()];return b?b:this.b&4?a:null};m.zb=function(a){return 0!=a.C||this.b&512?0>a.C&&!(this.b&256)?null:this.e[a.ia]?a:null:"%"==a.ia&&this.b&1024?a:null};m.yb=function(a){return 0==a.C?this.b&512?a:null:0>=a.C&&!(this.b&256)?null:this.b&16?a:null};m.xb=function(a){return 0==a.C?this.b&512?a:null:0>=a.C&&!(this.b&256)?null:this.b&48?a:(a=this.d[""+a.C])?a:null};
m.lc=function(a){return this.b&64?a:null};m.Ob=function(a){return this.b&128?a:null};m.Wa=function(){return null};m.nb=function(){return null};m.ob=function(){return null};m.wb=function(){return null};var wg=new yg(0,U,U);
function Bg(a){this.b=new rg(null);var b=this.e=new rg(null),c=a.b.length;a.b.push(this.b);a.b.push(b);ug(a,a.match,c);ug(a,a.e,c+1);ug(a,a.error,c+1);for(b=0;b<a.d.length;b++){var d=a.d[b];d.e?a.b[d.d].e=a.b[d.b]:a.b[d.d].f=a.b[d.b]}for(b=0;b<c;b++)if(null==a.b[b].f||null==a.b[b].e)throw Error("Invalid validator state");this.d=a.b[0]}t(Bg,Ag);
function Cg(a,b,c,d){for(var e=c?[]:b,f=a.d,g=d,k=null,h=null;f!==a.b&&f!==a.e;)if(g>=b.length)f=f.f;else{var l=b[g],n=l;if(0!=f.b)n=!0,-1==f.b?(k?k.push(h):k=[h],h=[]):-2==f.b?0<k.length?h=k.pop():h=null:0<f.b&&0==f.b%2?h[Math.floor((f.b-1)/2)]="taken":n=null==h[Math.floor((f.b-1)/2)],f=n?f.e:f.f;else{if(0==g&&!c&&f.d instanceof Dg&&a instanceof Eg){if(n=(new gd(b)).R(f.d)){g=b.length;f=f.e;continue}}else n=l.R(f.d);if(n){if(n!==l&&b===e)for(e=[],l=0;l<g;l++)e[l]=b[l];b!==e&&(e[g-d]=n);g++;f=f.e}else f=
f.f}}return f===a.b&&(c?0<e.length:g==b.length)?e:null}m=Bg.prototype;m.Na=function(a){for(var b=null,c=this.d;c!==this.b&&c!==this.e;)a?0!=c.b?c=c.e:(b=a.R(c.d))?(a=null,c=c.e):c=c.f:c=c.f;return c===this.b?b:null};m.Oc=function(a){return this.Na(a)};m.Pc=function(a){return this.Na(a)};m.Nb=function(a){return this.Na(a)};m.hb=function(a){return this.Na(a)};m.zb=function(a){return this.Na(a)};m.yb=function(a){return this.Na(a)};m.xb=function(a){return this.Na(a)};m.lc=function(a){return this.Na(a)};
m.Ob=function(a){return this.Na(a)};m.Wa=function(){return null};m.nb=function(){return null};m.ob=function(a){return this.Na(a)};m.wb=function(){return null};function Eg(a){Bg.call(this,a)}t(Eg,Bg);Eg.prototype.Wa=function(a){var b=Cg(this,a.values,!1,0);return b===a.values?a:b?new gd(b):null};Eg.prototype.f=function(a,b){return Cg(this,a,!0,b)};function Dg(a){Bg.call(this,a)}t(Dg,Bg);Dg.prototype.Wa=function(a){return this.Na(a)};
Dg.prototype.nb=function(a){var b=Cg(this,a.values,!1,0);return b===a.values?a:b?new hd(b):null};function Fg(a,b){Bg.call(this,b);this.name=a}t(Fg,Bg);Fg.prototype.Na=function(){return null};Fg.prototype.ob=function(a){if(a.name.toLowerCase()!=this.name)return null;var b=Cg(this,a.values,!1,0);return b===a.values?a:b?new id(a.name,b):null};function Gg(){}Gg.prototype.b=function(a,b){return b};Gg.prototype.e=function(){};
function Hg(a,b,c){this.name=b;this.d=a.e[this.name];c&&this.d instanceof Dg&&(this.d=this.d.d.d)}t(Hg,Gg);Hg.prototype.b=function(a,b,c){if(c.values[this.name])return b;if(a=this.d.f(a,b)){var d=a.length;this.e(1<d?new gd(a):a[0],c);return b+d}return b};Hg.prototype.e=function(a,b){b.values[this.name]=a};function Ig(a,b){Hg.call(this,a,b[0],!1);this.f=b}t(Ig,Hg);Ig.prototype.e=function(a,b){for(var c=0;c<this.f.length;c++)b.values[this.f[c]]=a};function Jg(a,b){this.d=a;this.cd=b}t(Jg,Gg);
Jg.prototype.b=function(a,b,c){var d=b;if(this.cd)if(a[b]==md){if(++b==a.length)return d}else return d;var e=this.d[0].b(a,b,c);if(e==b)return d;b=e;for(d=1;d<this.d.length&&b<a.length;d++){e=this.d[d].b(a,b,c);if(e==b)break;b=e}return b};function Kg(){this.b=this.La=null;this.error=!1;this.values={};this.d=null}m=Kg.prototype;m.ud=function(a){return new Hg(this.d,a,!1)};m.clone=function(){var a=new this.constructor;a.La=this.La;a.b=this.b;a.d=this.d;return a};
m.Tc=function(a,b){this.La=a;this.b=b};m.pb=function(){this.error=!0;return 0};function Lg(a,b){a.pb([b]);return null}m.Oc=function(a){return Lg(this,a)};m.Nb=function(a){return Lg(this,a)};m.hb=function(a){return Lg(this,a)};m.zb=function(a){return Lg(this,a)};m.yb=function(a){return Lg(this,a)};m.xb=function(a){return Lg(this,a)};m.lc=function(a){return Lg(this,a)};m.Ob=function(a){return Lg(this,a)};m.Wa=function(a){this.pb(a.values);return null};m.nb=function(){this.error=!0;return null};
m.ob=function(a){return Lg(this,a)};m.wb=function(){this.error=!0;return null};function Mg(){Kg.call(this)}t(Mg,Kg);Mg.prototype.pb=function(a){for(var b=0,c=0;b<a.length;){var d=this.La[c].b(a,b,this);if(d>b)b=d,c=0;else if(++c==this.La.length){this.error=!0;break}}return b};function Ng(){Kg.call(this)}t(Ng,Kg);
Ng.prototype.pb=function(a){if(a.length>this.La.length||0==a.length)return this.error=!0,0;for(var b=0;b<this.La.length;b++){for(var c=b;c>=a.length;)c=1==c?0:c-2;if(this.La[b].b(a,c,this)!=c+1)return this.error=!0,0}return a.length};function Og(){Kg.call(this)}t(Og,Kg);
Og.prototype.pb=function(a){for(var b=a.length,c=0;c<a.length;c++)if(a[c]===md){b=c;break}if(b>this.La.length||0==a.length)return this.error=!0,0;for(c=0;c<this.La.length;c++){for(var d=c;d>=b;)d=1==d?0:d-2;var e;if(b+1<a.length)for(e=b+c+1;e>=a.length;)e-=e==b+2?1:2;else e=d;if(2!=this.La[c].b([a[d],a[e]],0,this))return this.error=!0,0}return a.length};function Pg(){Kg.call(this)}t(Pg,Mg);Pg.prototype.ud=function(a){return new Hg(this.d,a,!0)};
Pg.prototype.nb=function(a){for(var b={},c=0;c<a.values.length;c++){this.values={};a.values[c].R(this);for(var d=b,e=this.values,f=0;f<this.b.length;f++){var g=this.b[f],k=e[g]||this.d.h[g],h=d[g];h||(h=[],d[g]=h);h.push(k)}this.values["background-color"]&&c!=a.values.length-1&&(this.error=!0);if(this.error)return null}this.values={};for(var l in b)this.values[l]="background-color"==l?b[l].pop():new hd(b[l]);return null};function Qg(){Kg.call(this)}t(Qg,Mg);
Qg.prototype.Tc=function(a,b){Mg.prototype.Tc.call(this,a,b);this.b.push("font-family","line-height","font-size")};
Qg.prototype.pb=function(a){var b=Mg.prototype.pb.call(this,a);if(b+2>a.length)return this.error=!0,b;this.error=!1;var c=this.d.e;if(!a[b].R(c["font-size"]))return this.error=!0,b;this.values["font-size"]=a[b++];if(a[b]===md){b++;if(b+2>a.length||!a[b].R(c["line-height"]))return this.error=!0,b;this.values["line-height"]=a[b++]}var d=b==a.length-1?a[b]:new gd(a.slice(b,a.length));if(!d.R(c["font-family"]))return this.error=!0,b;this.values["font-family"]=d;return a.length};
Qg.prototype.nb=function(a){a.values[0].R(this);if(this.error)return null;for(var b=[this.values["font-family"]],c=1;c<a.values.length;c++)b.push(a.values[c]);a=new hd(b);a.R(this.d.e["font-family"])?this.values["font-family"]=a:this.error=!0;return null};Qg.prototype.hb=function(a){if(a=this.d.d[a.name])for(var b in a)this.values[b]=a[b];else this.error=!0;return null};var Rg={SIMPLE:Mg,INSETS:Ng,INSETS_SLASH:Og,COMMA:Pg,FONT:Qg};
function Sg(){this.e={};this.k={};this.h={};this.b={};this.d={};this.f={};this.j=[];this.g=[]}function Tg(a,b){var c;if(3==b.type)c=new K(b.C,b.text);else if(7==b.type)c=yf(b.text);else if(1==b.type)c=J(b.text);else throw Error("unexpected replacement");if(xg(a)){var d=a.b[0].d.d,e;for(e in d)d[e]=c;return a}throw Error("unexpected replacement");}
function Ug(a,b,c){for(var d=new tg,e=0;e<b;e++)zg(d,a.clone(),1);if(c==Number.POSITIVE_INFINITY)zg(d,a,3);else for(e=b;e<c;e++)zg(d,a.clone(),2);return d}function Vg(a){var b=new tg,c=b.b.length;b.b.push(new rg(a));a=new sg(c,!0);var d=new sg(c,!1);ug(b,b.match,c);b.f?(b.e.push(b.d.length),b.f=!1):b.error.push(b.d.length);b.d.push(d);b.match.push(b.d.length);b.d.push(a);return b}
function Wg(a,b){var c;switch(a){case "COMMA":c=new Dg(b);break;case "SPACE":c=new Eg(b);break;default:c=new Fg(a.toLowerCase(),b)}return Vg(c)}
function Xg(a){a.b.HASHCOLOR=Vg(new yg(64,U,U));a.b.POS_INT=Vg(new yg(32,U,U));a.b.POS_NUM=Vg(new yg(16,U,U));a.b.POS_PERCENTAGE=Vg(new yg(8,U,{"%":H}));a.b.NEGATIVE=Vg(new yg(256,U,U));a.b.ZERO=Vg(new yg(512,U,U));a.b.ZERO_PERCENTAGE=Vg(new yg(1024,U,U));a.b.POS_LENGTH=Vg(new yg(8,U,{em:H,ex:H,ch:H,rem:H,vh:H,vw:H,vmin:H,vmax:H,cm:H,mm:H,"in":H,px:H,pt:H,pc:H}));a.b.POS_ANGLE=Vg(new yg(8,U,{deg:H,grad:H,rad:H,turn:H}));a.b.POS_TIME=Vg(new yg(8,U,{s:H,ms:H}));a.b.FREQUENCY=Vg(new yg(8,U,{Hz:H,kHz:H}));
a.b.RESOLUTION=Vg(new yg(8,U,{dpi:H,dpcm:H,dppx:H}));a.b.URI=Vg(new yg(128,U,U));a.b.IDENT=Vg(new yg(4,U,U));a.b.STRING=Vg(new yg(2,U,U));var b={"font-family":J("sans-serif")};a.d.caption=b;a.d.icon=b;a.d.menu=b;a.d["message-box"]=b;a.d["small-caption"]=b;a.d["status-bar"]=b}function Yg(a){return!!a.match(/^[A-Z_0-9]+$/)}
function Zg(a,b,c){var d=x(b);if(0==d.type)return null;var e={"":!0};if(14==d.type){do{A(b);d=x(b);if(1!=d.type)throw Error("Prefix name expected");e[d.text]=!0;A(b);d=x(b)}while(16==d.type);if(15!=d.type)throw Error("']' expected");A(b);d=x(b)}if(1!=d.type)throw Error("Property name expected");if(2==c?"SHORTHANDS"==d.text:"DEFAULTS"==d.text)return A(b),null;d=d.text;A(b);if(2!=c){if(39!=x(b).type)throw Error("'=' expected");Yg(d)||(a.k[d]=e)}else if(18!=x(b).type)throw Error("':' expected");return d}
function $g(a,b){for(;;){var c=Zg(a,b,1);if(!c)break;for(var d=[],e=[],f="",g,k=!0,h=function(){if(0==d.length)throw Error("No values");var a;if(1==d.length)a=d[0];else{var b=f,c=d;a=new tg;if("||"==b){for(b=0;b<c.length;b++){var e=new tg,g=e;if(g.b.length)throw Error("invalid call");var k=new rg(wg);k.b=2*b+1;g.b.push(k);var k=new sg(0,!0),h=new sg(0,!1);g.e.push(g.d.length);g.d.push(h);g.match.push(g.d.length);g.d.push(k);zg(e,c[b],1);vg(e,e.match,!1,b);zg(a,e,0==b?1:4)}c=new tg;if(c.b.length)throw Error("invalid call");
vg(c,c.match,!0,-1);zg(c,a,3);a=[c.match,c.e,c.error];for(b=0;b<a.length;b++)vg(c,a[b],!1,-1);a=c}else{switch(b){case " ":e=1;break;case "|":case "||":e=4;break;default:throw Error("unexpected op");}for(b=0;b<c.length;b++)zg(a,c[b],0==b?1:e)}}return a},l=function(a){if(k)throw Error("'"+a+"': unexpected");if(f&&f!=a)throw Error("mixed operators: '"+a+"' and '"+f+"'");f=a;k=!0},n=null;!n;)switch(A(b),g=x(b),g.type){case 1:k||l(" ");if(Yg(g.text)){var p=a.b[g.text];if(!p)throw Error("'"+g.text+"' unexpected");
d.push(p.clone())}else p={},p[g.text]=J(g.text),d.push(Vg(new yg(0,p,U)));k=!1;break;case 5:p={};p[""+g.C]=new qd(g.C);d.push(Vg(new yg(0,p,U)));k=!1;break;case 34:l("|");break;case 25:l("||");break;case 14:k||l(" ");e.push({fd:d,bd:f,sc:"["});f="";d=[];k=!0;break;case 6:k||l(" ");e.push({fd:d,bd:f,sc:"(",sb:g.text});f="";d=[];k=!0;break;case 15:g=h();p=e.pop();if("["!=p.sc)throw Error("']' unexpected");d=p.fd;d.push(g);f=p.bd;k=!1;break;case 11:g=h();p=e.pop();if("("!=p.sc)throw Error("')' unexpected");
d=p.fd;d.push(Wg(p.sb,g));f=p.bd;k=!1;break;case 18:if(k)throw Error("':' unexpected");A(b);d.push(Tg(d.pop(),x(b)));break;case 22:if(k)throw Error("'?' unexpected");d.push(Ug(d.pop(),0,1));break;case 36:if(k)throw Error("'*' unexpected");d.push(Ug(d.pop(),0,Number.POSITIVE_INFINITY));break;case 23:if(k)throw Error("'+' unexpected");d.push(Ug(d.pop(),1,Number.POSITIVE_INFINITY));break;case 12:A(b);g=x(b);if(5!=g.type)throw Error("<int> expected");var r=p=g.C;A(b);g=x(b);if(16==g.type){A(b);g=x(b);
if(5!=g.type)throw Error("<int> expected");r=g.C;A(b);g=x(b)}if(13!=g.type)throw Error("'}' expected");d.push(Ug(d.pop(),p,r));break;case 17:n=h();if(0<e.length)throw Error("unclosed '"+e.pop().sc+"'");break;default:throw Error("unexpected token");}A(b);Yg(c)?a.b[c]=n:a.e[c]=1!=n.b.length||0!=n.b[0].b?new Eg(n):n.b[0].d}}
function ah(a,b){for(var c={},d=0;d<b.length;d++)for(var e=b[d],f=a.f[e],e=f?f.b:[e],f=0;f<e.length;f++){var g=e[f],k=a.h[g];k?c[g]=k:u.b("Unknown property in makePropSet:",g)}return c}
function bh(a,b,c,d,e){var f="",g=b;b=b.toLowerCase();var k=b.match(/^-([a-z]+)-([-a-z0-9]+)$/);k&&(f=k[1],b=k[2]);if((k=a.k[b])&&k[f])if(f=a.e[b])(a=c===Jd||c.Xc()?c:c.R(f))?e.fb(b,a,d):e.Db(g,c);else if(b=a.f[b].clone(),c===Jd)for(c=0;c<b.b.length;c++)e.fb(b.b[c],Jd,d);else{c.R(b);if(b.error)d=!1;else{for(a=0;a<b.b.length;a++)f=b.b[a],e.fb(f,b.values[f]||b.d.h[f],d);d=!0}d||e.Db(g,c)}else e.kc(g,c)}
var ch=new wf(function(){var a=M("loadValidatorSet.load"),b=sa("validation.txt",ra),c=qf(b),d=new Sg;Xg(d);c.then(function(c){try{if(c.responseText){var f=new ac(c.responseText,null);for($g(d,f);;){var g=Zg(d,f,2);if(!g)break;for(c=[];;){A(f);var k=x(f);if(17==k.type){A(f);break}switch(k.type){case 1:c.push(J(k.text));break;case 4:c.push(new pd(k.C));break;case 5:c.push(new qd(k.C));break;case 3:c.push(new K(k.C,k.text));break;default:throw Error("unexpected token");}}d.h[g]=1<c.length?new gd(c):
c[0]}for(;;){var h=Zg(d,f,3);if(!h)break;var l=z(f,1),n;1==l.type&&Rg[l.text]?(n=new Rg[l.text],A(f)):n=new Mg;n.d=d;g=!1;k=[];c=!1;for(var p=[],r=[];!g;)switch(A(f),l=x(f),l.type){case 1:if(d.e[l.text])k.push(n.ud(l.text)),r.push(l.text);else if(d.f[l.text]instanceof Ng){var q=d.f[l.text];k.push(new Ig(q.d,q.b));r.push.apply(r,q.b)}else throw Error("'"+l.text+"' is neither a simple property nor an inset shorthand");break;case 19:if(0<k.length||c)throw Error("unexpected slash");c=!0;break;case 14:p.push({cd:c,
La:k});k=[];c=!1;break;case 15:var v=new Jg(k,c),y=p.pop(),k=y.La;c=y.cd;k.push(v);break;case 17:g=!0;A(f);break;default:throw Error("unexpected token");}n.Tc(k,r);d.f[h]=n}d.g=ah(d,["background"]);d.j=ah(d,"margin border padding columns column-gap column-rule column-fill".split(" "))}else u.error("Error: missing",b)}catch(I){u.error(I,"Error:")}Q(a,d)});return O(a)},"validatorFetcher");var dh={"font-style":Sd,"font-variant":Sd,"font-weight":Sd},eh="OTTO"+(new Date).valueOf(),fh=1;function gh(a){a=this.lb=a;var b=new Pa,c;for(c in dh)b.append(" "),b.append(a[c].toString());this.d=b.toString();this.src=this.lb.src?this.lb.src.toString():null;this.e=[];this.f=[];this.b=(c=this.lb["font-family"])?c.stringValue():null}
function hh(a,b,c){var d=new Pa;d.append("@font-face {\n  font-family: ");d.append(a.b);d.append(";\n  ");for(var e in dh)d.append(e),d.append(": "),a.lb[e].wa(d,!0),d.append(";\n  ");c?(d.append('src: url("'),b=(window.URL||window.webkitURL).createObjectURL(c),d.append(b),a.e.push(b),a.f.push(c),d.append('")')):(d.append("src: "),d.append(b));d.append(";\n}\n");return d.toString()}function ih(a){this.d=a;this.b={}}function jh(a,b){this.d=a;this.b=b;this.e={};this.f=0}
function kh(a,b,c){b=b.b;var d=c.b[b];if(d)return d;d="Fnt_"+ ++a.f;return c.b[b]=d}
function lh(a,b,c,d){var e=M("initFont"),f=b.src,g={},k;for(k in dh)g[k]=b.lb[k];d=kh(a,b,d);g["font-family"]=J(d);var h=new gh(g),l=a.b.ownerDocument.createElement("span");l.textContent="M";var n=(new Date).valueOf()+1E3;b=a.d.ownerDocument.createElement("style");k=eh+fh++;b.textContent=hh(h,"",rf([k]));a.d.appendChild(b);a.b.appendChild(l);l.style.visibility="hidden";l.style.fontFamily=d;for(var p in dh)w(l,p,g[p].toString());var g=l.getBoundingClientRect(),r=g.right-g.left,q=g.bottom-g.top;b.textContent=
hh(h,f,c);u.f("Starting to load font:",f);var v=!1;mf(function(){var a=l.getBoundingClientRect(),b=a.bottom-a.top;if(r!=a.right-a.left||q!=b)return v=!0,N(!1);(new Date).valueOf()>n?a=N(!1):(a=M("Frame.sleep"),ff(a).Ua(!0,10),a=O(a));return a}).then(function(){v?u.f("Loaded font:",f):u.b("Failed to load font:",f);a.b.removeChild(l);Q(e,h)});return O(e)}
function mh(a,b,c){var d=b.src,e=a.e[d];e?og(e,function(a){if(a.d==b.d){var e=b.b,k=c.b[e];a=a.b;if(k){if(k!=a)throw Error("E_FONT_FAMILY_INCONSISTENT "+b.b);}else c.b[e]=a;u.b("Found already-loaded font:",d)}else u.b("E_FONT_FACE_INCOMPATIBLE",b.src)}):(e=new wf(function(){var e=M("loadFont"),g=c.d?c.d(d):null;g?qf(d,"blob").then(function(d){d.ac?g(d.ac).then(function(d){lh(a,b,d,c).oa(e)}):Q(e,null)}):lh(a,b,null,c).oa(e);return O(e)},"loadFont "+d),a.e[d]=e,e.start());return e};function nh(a,b,c){this.j=a;this.url=b;this.b=c;this.lang=null;this.f=-1;this.root=c.documentElement;a=null;if("http://www.w3.org/1999/xhtml"==this.root.namespaceURI){for(b=this.root.firstChild;b;b=b.nextSibling)if(1==b.nodeType&&(c=b,"http://www.w3.org/1999/xhtml"==c.namespaceURI))switch(c.localName){case "head":a=c}this.lang=this.root.getAttribute("lang")}else if("http://www.gribuser.ru/xml/fictionbook/2.0"==this.root.namespaceURI){a=this.root;for(b=this.root.firstChild;b;b=b.nextSibling);b=oh(oh(oh(oh(new ph([this.b]),
"FictionBook"),"description"),"title-info"),"lang").textContent();0<b.length&&(this.lang=b[0])}else if("http://example.com/sse"==this.root.namespaceURI)for(c=this.root.firstElementChild;c;c=c.nextElementSibling)"meta"===c.localName&&(a=c);this.h=a;this.e=this.root;this.g=1;this.e.setAttribute("data-adapt-eloff","0")}
function qh(a,b){var c=b.getAttribute("data-adapt-eloff");if(c)return parseInt(c,10);for(var c=a.g,d=a.e;d!=b;){var e=d.firstChild;if(!e)for(;!(e=d.nextSibling);)if(d=d.parentNode,null==d)throw Error("Internal error");d=e;1==e.nodeType?(e.setAttribute("data-adapt-eloff",c.toString()),++c):c+=e.textContent.length}a.g=c;a.e=b;return c-1}
function rh(a,b,c,d){var e=0,f=null;if(1==b.nodeType){if(!d)return qh(a,b)}else{e=c;f=b.previousSibling;if(!f)return b=b.parentNode,e+=1,qh(a,b)+e;b=f}for(;;){for(;b.lastChild;)b=b.lastChild;if(1==b.nodeType)break;e+=b.textContent.length;f=b.previousSibling;if(!f){b=b.parentNode;break}b=f}e+=1;return qh(a,b)+e}function th(a){0>a.f&&(a.f=rh(a,a.root,0,!0));return a.f}
function uh(a,b){for(var c,d=a.root;;){c=qh(a,d);if(c>=b)return d;var e=d.children;if(!e)break;var f=Xa(e.length,function(c){return qh(a,e[c])>b});if(0==f)break;if(f<e.length&&qh(a,e[f])<=b)throw Error("Consistency check failed!");d=e[f-1]}c=c+1;for(var f=d,g=f.firstChild||f.nextSibling,k=null;;){if(g){if(1==g.nodeType)break;k=f=g;c+=g.textContent.length;if(c>b)break}else if(f=f.parentNode,!f)break;g=f.nextSibling}return k||d}
function vh(a,b){var c=b.getAttribute("id");c&&!a.d[c]&&(a.d[c]=b);(c=b.getAttributeNS("http://www.w3.org/XML/1998/namespace","id"))&&!a.d[c]&&(a.d[c]=b);for(c=b.firstElementChild;c;c=c.nextElementSibling)vh(a,c)}function wh(a,b){var c=b.match(/([^#]*)\#(.+)$/);if(!c||c[1]&&c[1]!=a.url)return null;var c=c[2],d=a.b.getElementById(c)||a.b.getElementsByName(c)[0];d||(a.d||(a.d={},vh(a,a.b.documentElement)),d=a.d[c]);return d}
var xh={Ud:"text/html",Vd:"text/xml",Nd:"application/xml",Md:"application/xhtml_xml",Pd:"image/svg+xml"};function yh(a,b,c){c=c||new DOMParser;var d;try{d=c.parseFromString(a,b)}catch(e){}if(d){a=d.documentElement;if("parsererror"===a.localName)return null;for(a=a.firstChild;a;a=a.nextSibling)if("parsererror"===a.localName)return null}else return null;return d}
function zh(a){var b=a.contentType;if(b){for(var c=Object.keys(xh),d=0;d<c.length;d++)if(xh[c[d]]===b)return b;if(b.match(/\+xml$/))return"application/xml"}if(a=a.url.match(/\.([^./]+)$/))switch(a[1]){case "html":case "htm":return"text/html";case "xhtml":case "xht":return"application/xhtml_xml";case "svg":case "svgz":return"image/svg+xml";case "opf":case "xml":return"application/xml"}return null}
function Ah(a,b){var c=a.responseXML;if(!c){var d=new DOMParser,e=a.responseText;if(e){var f=zh(a);(c=yh(e,f||"application/xml",d))&&!f&&(f=c.documentElement,"html"!==f.localName.toLowerCase()||f.namespaceURI?"svg"===f.localName.toLowerCase()&&"image/svg+xml"!==c.contentType&&(c=yh(e,"image/svg+xml",d)):c=yh(e,"text/html",d));c||(c=yh(e,"text/html",d))}}c=c?new nh(b,a.url,c):null;return N(c)}function Bh(a){this.sb=a}
function Ch(){var a=Dh;return new Bh(function(b){return a.sb(b)&&1==b.nodeType&&"http://www.idpf.org/2008/embedding"==b.getAttribute("Algorithm")})}function Eh(){var a=Ch(),b=Dh;return new Bh(function(c){if(!b.sb(c))return!1;c=new ph([c]);c=oh(c,"EncryptionMethod");a&&(c=Fh(c,a));return 0<c.b.length})}var Dh=new Bh(function(){return!0});function ph(a){this.b=a}function Gh(a){return a.b}function Fh(a,b){for(var c=[],d=0;d<a.b.length;d++){var e=a.b[d];b.sb(e)&&c.push(e)}return new ph(c)}
function Hh(a,b){function c(a){d.push(a)}for(var d=[],e=0;e<a.b.length;e++)b(a.b[e],c);return new ph(d)}function Ih(a,b){for(var c=[],d=0;d<a.b.length;d++)c.push(b(a.b[d]));return c}function Jh(a,b){for(var c=[],d=0;d<a.b.length;d++){var e=b(a.b[d]);null!=e&&c.push(e)}return c}function oh(a,b){return Hh(a,function(a,d){for(var e=a.firstChild;e;e=e.nextSibling)e.localName==b&&d(e)})}function Kh(a){return Hh(a,function(a,c){for(var d=a.firstChild;d;d=d.nextSibling)1==d.nodeType&&c(d)})}
function Lh(a,b){return Jh(a,function(a){return 1==a.nodeType?a.getAttribute(b):null})}ph.prototype.textContent=function(){return Ih(this,function(a){return a.textContent})};var Mh={transform:!0,"transform-origin":!0,position:!0};function Nh(a,b,c){this.target=a;this.name=b;this.value=c}var Oh={show:function(a){a.style.visibility="visible"},hide:function(a){a.style.visibility="hidden"},play:function(a){a.currentTime=0;a.play()},pause:function(a){a.pause()},resume:function(a){a.play()},mute:function(a){a.muted=!0},unmute:function(a){a.muted=!1}};function Ph(a,b){var c=Oh[b];return c?function(){for(var b=0;b<a.length;b++)try{c(a[b])}catch(e){}}:null}
function Qh(a){this.d={};this.L=a;this.u=null;this.g=[];var b=this;this.A=function(a){var d=a.currentTarget,e=d.getAttribute("href")||d.getAttributeNS("http://www.w3.org/1999/xlink","href");e&&(a.preventDefault(),eb(b,{type:"hyperlink",target:null,currentTarget:null,Wd:d,href:e}))};this.h={};this.b={width:0,height:0};this.k=this.j=!1;this.F=0;this.position=null;this.offset=-1;this.f=null;this.e=[];this.l={top:{},bottom:{},left:{},right:{}}}t(Qh,db);
function Rh(a){a.D=!0;a.L.setAttribute("data-vivliostyle-auto-page-width",!0)}function Sh(a){a.B=!0;a.L.setAttribute("data-vivliostyle-auto-page-height",!0)}function Th(a,b,c){var d=a.h[c];d?d.push(b):a.h[c]=[b]}Qh.prototype.zoom=function(a){w(this.L,"transform","scale("+a+")")};Qh.prototype.w=function(){return this.u||this.L};
function Uh(a,b){if(1==a.nodeType)return!1;var c=a.textContent;switch(b){case 0:return!!c.match(/^\s*$/);case 1:return!!c.match(/^[ \t\f]*$/);case 2:return 0==c.length}throw Error("Unexpected whitespace: "+b);}function Vh(a,b,c,d,e,f,g,k){this.f=a;this.g=b;this.b=c;this.Da=d;this.j=e;this.d=f;this.Hd=g;this.h=k;this.e=-1}function Wh(a,b){return a.d?!b.d||a.Da>b.Da?!0:a.h:!1}function Xh(a,b){return a.top-b.top}function Yh(a,b){return b.right-a.right}
function Zh(a,b,c,d,e,f,g){this.Y=a;this.Jc=d;this.dd=null;this.root=b;this.Z=c;this.type=f;e&&(e.dd=this);this.b=g}function $h(a,b){this.Fd=a;this.count=b}function ai(a,b,c){this.W=a;this.parent=b;this.ca=c;this.aa=0;this.K=!1;this.Ka=0;this.ba=b?b.ba:null;this.na=this.ua=null;this.I=!1;this.d=!0;this.e=!1;this.h=b?b.h:0;this.w=this.j=this.M=null;this.A=b?b.A:0;this.k=b?b.k:!1;this.b=this.B=this.u=null;this.l=b?b.l:{};this.g=b?b.g:!1;this.D=b?b.D:"ltr";this.f=b?b.f:null}
function bi(a){a.d=!0;a.h=a.parent?a.parent.h:0;a.b=null;a.aa=0;a.K=!1;a.j=null;a.w=null;a.u=null;a.B=null;a.ua=null;a.k=a.parent?a.parent.k:!1;a.g=a.parent?a.parent.g:!1;a.ua=null}function ci(a){var b=new ai(a.W,a.parent,a.ca);b.aa=a.aa;b.K=a.K;b.ua=a.ua;b.Ka=a.Ka;b.ba=a.ba;b.na=a.na;b.d=a.d;b.h=a.h;b.j=a.j;b.w=a.w;b.k=a.k;b.A=a.A;b.u=a.u;b.B=a.B;b.b=a.b;b.f=a.f;b.g=a.g;b.e=a.e;return b}ai.prototype.modify=function(){return this.I?ci(this):this};
function di(a){var b=a;do{if(b.I)break;b.I=!0;b=b.parent}while(b);return a}ai.prototype.clone=function(){for(var a=ci(this),b=a,c;null!=(c=b.parent);)c=ci(c),b=b.parent=c;return a};function ei(a){return{da:a.W,Ka:a.Ka,ba:a.ba,ua:a.ua,na:a.na?ei(a.na):null}}function fi(a){var b=a,c=[];do b.f&&b.parent&&b.parent.f!==b.f||c.push(ei(b)),b=b.parent;while(b);return{ha:c,aa:a.aa,K:a.K}}function gi(a){this.Qa=a;this.b=this.d=null}
gi.prototype.clone=function(){var a=new gi(this.Qa);if(this.d){a.d=[];for(var b=0;b<this.d.length;++b)a.d[b]=this.d[b]}if(this.b)for(a.b=[],b=0;b<this.b.length;++b)a.b[b]=this.b[b];return a};function hi(a,b){this.d=a;this.b=b}hi.prototype.clone=function(){return new hi(this.d.clone(),this.b)};function ii(){this.b=[]}ii.prototype.clone=function(){for(var a=new ii,b=this.b,c=a.b,d=0;d<b.length;d++)c[d]=b[d].clone();return a};function ji(){this.d=0;this.b={};this.e=0}
ji.prototype.clone=function(){var a=new ji;a.d=this.d;a.f=this.f;a.e=this.e;a.g=this.g;for(var b in this.b)a.b[b]=this.b[b].clone();return a};function ki(a){this.b=a;this.B=this.A=this.height=this.width=this.w=this.k=this.D=this.j=this.va=this.fa=this.Ea=this.$=this.marginBottom=this.marginTop=this.marginRight=this.marginLeft=this.top=this.left=0;this.Rb=this.I=null;this.pa=this.Sb=this.Fa=this.Tb=this.e=0;this.d=!1}function li(a){return a.marginTop+a.fa+a.k}
function mi(a){return a.marginBottom+a.va+a.w}function ni(a){return a.marginLeft+a.$+a.j}function oi(a){return a.marginRight+a.Ea+a.D}function pi(a,b){a.b=b.b;a.left=b.left;a.top=b.top;a.marginLeft=b.marginLeft;a.marginRight=b.marginRight;a.marginTop=b.marginTop;a.marginBottom=b.marginBottom;a.$=b.$;a.Ea=b.Ea;a.fa=b.fa;a.va=b.va;a.j=b.j;a.D=b.D;a.k=b.k;a.w=b.w;a.width=b.width;a.height=b.height;a.A=b.A;a.B=b.B;a.Rb=b.Rb;a.I=b.I;a.e=b.e;a.Tb=b.Tb;a.Fa=b.Fa;a.d=b.d}
function qi(a,b,c){a.top=b;a.height=c;w(a.b,"top",b+"px");w(a.b,"height",c+"px")}function ri(a,b,c){a.left=b;a.width=c;w(a.b,"left",b+"px");w(a.b,"width",c+"px")}function si(a,b){this.b=a;this.d=b}t(si,ed);si.prototype.Nb=function(a){this.b.appendChild(this.b.ownerDocument.createTextNode(a.b));return null};si.prototype.Ob=function(a){var b=this.b.ownerDocument.createElementNS("http://www.w3.org/1999/xhtml","img");b.setAttribute("src",a.url);this.b.appendChild(b);return null};
si.prototype.Wa=function(a){this.ib(a.values);return null};si.prototype.wb=function(a){a=a.ea().evaluate(this.d);"string"===typeof a&&this.b.appendChild(this.b.ownerDocument.createTextNode(a));return null};function ti(a){return null!=a&&a!==Sd&&a!==Rd&&a!==Jd};function ui(a,b,c){b=b?"vertical-rl":"horizontal-tb";if("top"===a||"bottom"===a)a=da(a,b,c||null,ha);"block-start"===a&&(a="inline-start");"block-end"===a&&(a="inline-end");if("inline-start"===a||"inline-end"===a){c=da(a,b,c||null,ga);a:{var d=ia[b];if(!d)throw Error("unknown writing-mode: "+b);for(b=0;b<d.length;b++)if(d[b].H===c){b=d[b].G;break a}b=c}"line-left"===b?a="left":"line-right"===b&&(a="right")}"left"!==a&&"right"!==a&&(u.b("Invalid float value: "+a+". Fallback to left."),a="left");return a}
function vi(a,b){this.d=di(a);this.b=b}function wi(a,b,c){this.e=a;this.g=b;this.f=c;this.d=[];this.b=[]}
function xi(a,b,c){b.parentNode&&b.parentNode.removeChild(b);w(b,"float","none");w(b,"position","absolute");var d=a.g.toString(),e=a.f.toString(),f=da(c,d,e||null,ga),g=da(c,d,e||null,ha);w(b,f,"0");switch(g){case "inline-start":case "inline-end":d=da("block-start",d,e||null,ga);w(b,d,"0");break;case "block-start":case "block-end":c=da("inline-start",d,e||null,ga);w(b,c,"0");d=da("max-inline-size",d,e||null,ga);Oa(b,d)||w(b,d,"100%");break;default:throw Error("unknown float direction: "+c);}a.e().appendChild(b)}
function yi(a,b,c){b=fi(b);for(var d=0;d<a.d.length;d++){var e=a.d[d];if(zi(c,b,fi(e.d)))return e}return null}function Ai(a,b,c){var d=M("tryToAddFloat");b=new vi(b,c);a.d.push(b);a.b.push(b);Q(d,b);return O(d)}function Bi(a){return a.b.map(function(a){a=a.b;return new ue([new pe(a.V,a.S),new pe(a.T,a.S),new pe(a.T,a.P),new pe(a.V,a.P)])})};var Ci={SIMPLE_PROPERTY:"SIMPLE_PROPERTY"},Di={};function Ei(a,b){if(Ci[a]){var c=Di[a];c||(c=Di[a]=[]);c.push(b)}else u.b(Error("Skipping unknown plugin hook '"+a+"'."))}ca("vivliostyle.plugin.registerHook",Ei);ca("vivliostyle.plugin.removeHook",function(a,b){if(Ci[a]){var c=Di[a];if(c){var d=c.indexOf(b);0<=d&&c.splice(d,1)}}else u.b(Error("Ignoring unknown plugin hook '"+a+"'."))});for(var Fi={azimuth:!0,"border-collapse":!0,"border-spacing":!0,"caption-side":!0,color:!0,cursor:!0,direction:!0,elevation:!0,"empty-cells":!0,"font-kerning":!0,"font-size":!0,"font-family":!0,"font-style":!0,"font-variant":!0,"font-weight":!0,"letter-spacing":!0,"line-break":!0,"line-height":!0,"list-style-image":!0,"list-style-position":!0,"list-style-type":!0,orphans:!0,"overflow-wrap":!0,"pitch-range":!0,quotes:!0,richness:!0,"ruby-align":!0,"ruby-position":!0,"speak-header":!0,"speak-numeral":!0,
"speak-punctuation":!0,"speech-rate":!0,stress:!0,"tab-size":!0,"text-align":!0,"text-align-last":!0,"text-decoration-skip":!0,"text-emphasis-color":!0,"text-emphasis-position":!0,"text-emphasis-style":!0,"text-combine-upright":!0,"text-indent":!0,"text-justify":!0,"text-size-adjust":!0,"text-transform":!0,"text-underline-position":!0,visibility:!0,"voice-family":!0,volume:!0,"white-space":!0,widows:!0,"word-break":!0,"word-spacing":!0,"word-wrap":!0,"writing-mode":!0},Gi={"http://www.idpf.org/2007/ops":!0,
"http://www.w3.org/1999/xhtml":!0,"http://www.w3.org/2000/svg":!0},Hi="margin-% padding-% border-%-width border-%-style border-%-color %".split(" "),Ii=["left","right","top","bottom"],Ji={width:!0,height:!0},Ki=0;Ki<Hi.length;Ki++)for(var Li=0;Li<Ii.length;Li++){var Mi=Hi[Ki].replace("%",Ii[Li]);Ji[Mi]=!0}function Ni(a){for(var b={},c=0;c<Hi.length;c++)for(var d in a){var e=Hi[c].replace("%",d),f=Hi[c].replace("%",a[d]);b[e]=f;b[f]=e}return b}
var Oi=Ni({before:"right",after:"left",start:"top",end:"bottom"}),Pi=Ni({before:"top",after:"bottom",start:"left",end:"right"});function V(a,b){this.value=a;this.Da=b}m=V.prototype;m.kd=function(){return this};m.wc=function(a){a=this.value.R(a);return a===this.value?this:new V(a,this.Da)};m.ld=function(a){return 0==a?this:new V(this.value,this.Da+a)};m.evaluate=function(a,b){return gg(a,this.value,b)};m.hd=function(){return!0};function Qi(a,b,c){V.call(this,a,b);this.J=c}t(Qi,V);
Qi.prototype.kd=function(){return new V(this.value,this.Da)};Qi.prototype.wc=function(a){a=this.value.R(a);return a===this.value?this:new Qi(a,this.Da,this.J)};Qi.prototype.ld=function(a){return 0==a?this:new Qi(this.value,this.Da+a,this.J)};Qi.prototype.hd=function(a){return!!this.J.evaluate(a)};function Ri(a,b,c){return(null==b||c.Da>b.Da)&&c.hd(a)?c.kd():b}var Si={"region-id":!0};function Ti(a){return"_"!=a.charAt(0)&&!Si[a]}function Ui(a,b,c){c?a[b]=c:delete a[b]}
function Vi(a,b){var c=a[b];c||(c={},a[b]=c);return c}function Wi(a,b){var c=a[b];c||(c=[],a[b]=c);return c}function Xi(a,b,c,d,e,f){if(e){var g=Vi(b,"_pseudos");b=g[e];b||(b={},g[e]=b)}f&&(e=Vi(b,"_regions"),b=e[f],b||(b={},e[f]=b));for(var k in c)"_"!=k.charAt(0)&&(Si[k]?(f=c[k],e=Wi(b,k),Array.prototype.push.apply(e,f)):Ui(b,k,Ri(a,b[k],c[k].ld(d))))}function Yi(a,b){this.e=a;this.d=b;this.b=""}t(Yi,fd);
function Zi(a){a=a.e["font-size"].value;var b;a:switch(a.ia.toLowerCase()){case "px":case "in":case "pt":case "pc":case "cm":case "mm":case "q":b=!0;break a;default:b=!1}if(!b)throw Error("Unexpected state");return a.C*qc[a.ia]}
Yi.prototype.zb=function(a){if("em"==a.ia||"ex"==a.ia){var b=tc(this.d,a.ia,!1)/tc(this.d,"em",!1);return new K(a.C*b*Zi(this),"px")}if("%"==a.ia){if("font-size"===this.b)return new K(a.C/100*Zi(this),"px");b=this.b.match(/height|^(top|bottom)$/)?"vh":"vw";return new K(a.C,b)}return a};Yi.prototype.wb=function(a){return"font-size"==this.b?gg(this.d,a,this.b).R(this):a};function $i(){}$i.prototype.apply=function(){};$i.prototype.g=function(a){return new aj([this,a])};$i.prototype.clone=function(){return this};
function bj(a){this.b=a}t(bj,$i);bj.prototype.apply=function(a){a.b[a.b.length-1].push(this.b.b())};function aj(a){this.b=a}t(aj,$i);aj.prototype.apply=function(a){for(var b=0;b<this.b.length;b++)this.b[b].apply(a)};aj.prototype.g=function(a){this.b.push(a);return this};aj.prototype.clone=function(){return new aj([].concat(this.b))};function cj(a,b,c,d){this.style=a;this.b=b;this.d=c;this.e=d}t(cj,$i);cj.prototype.apply=function(a){Xi(a.d,a.w,this.style,this.b,this.d,this.e)};
function X(){this.b=null}t(X,$i);X.prototype.apply=function(a){this.b.apply(a)};X.prototype.d=function(){return 0};X.prototype.e=function(){return!1};function dj(a){this.b=null;this.f=a}t(dj,X);dj.prototype.apply=function(a){0<=a.u.indexOf(this.f)&&this.b.apply(a)};dj.prototype.d=function(){return 10};dj.prototype.e=function(a){this.b&&ej(a.xa,this.f,this.b);return!0};function fj(a){this.b=null;this.id=a}t(fj,X);fj.prototype.apply=function(a){a.M!=this.id&&a.fa!=this.id||this.b.apply(a)};
fj.prototype.d=function(){return 11};fj.prototype.e=function(a){this.b&&ej(a.e,this.id,this.b);return!0};function gj(a){this.b=null;this.localName=a}t(gj,X);gj.prototype.apply=function(a){a.f==this.localName&&this.b.apply(a)};gj.prototype.d=function(){return 8};gj.prototype.e=function(a){this.b&&ej(a.Mb,this.localName,this.b);return!0};function hj(a,b){this.b=null;this.f=a;this.localName=b}t(hj,X);hj.prototype.apply=function(a){a.f==this.localName&&a.k==this.f&&this.b.apply(a)};hj.prototype.d=function(){return 8};
hj.prototype.e=function(a){if(this.b){var b=a.b[this.f];b||(b="ns"+a.g++ +":",a.b[this.f]=b);ej(a.f,b+this.localName,this.b)}return!0};function ij(a){this.b=null;this.f=a}t(ij,X);ij.prototype.apply=function(a){var b=a.e;if(b&&"a"==a.f){var c=b.getAttribute("href");c&&c.match(/^#/)&&(b=b.ownerDocument.getElementById(c.substring(1)))&&(b=b.getAttributeNS("http://www.idpf.org/2007/ops","type"))&&b.match(this.f)&&this.b.apply(a)}};function jj(a){this.b=null;this.f=a}t(jj,X);
jj.prototype.apply=function(a){a.k==this.f&&this.b.apply(a)};function kj(a,b){this.b=null;this.f=a;this.name=b}t(kj,X);kj.prototype.apply=function(a){a.e&&a.e.hasAttributeNS(this.f,this.name)&&this.b.apply(a)};function lj(a,b,c){this.b=null;this.f=a;this.name=b;this.value=c}t(lj,X);lj.prototype.apply=function(a){a.e&&a.e.getAttributeNS(this.f,this.name)==this.value&&this.b.apply(a)};lj.prototype.d=function(){return"type"==this.name&&"http://www.idpf.org/2007/ops"==this.f?9:0};
lj.prototype.e=function(a){return"type"==this.name&&"http://www.idpf.org/2007/ops"==this.f?(this.b&&ej(a.d,this.value,this.b),!0):!1};function mj(a,b){this.b=null;this.f=a;this.name=b}t(mj,X);mj.prototype.apply=function(a){if(a.e){var b=a.e.getAttributeNS(this.f,this.name);b&&Gi[b]&&this.b.apply(a)}};mj.prototype.d=function(){return 0};mj.prototype.e=function(){return!1};function nj(a,b,c){this.b=null;this.h=a;this.name=b;this.f=c}t(nj,X);
nj.prototype.apply=function(a){if(a.e){var b=a.e.getAttributeNS(this.h,this.name);b&&b.match(this.f)&&this.b.apply(a)}};function oj(a){this.b=null;this.f=a}t(oj,X);oj.prototype.apply=function(a){a.lang.match(this.f)&&this.b.apply(a)};function pj(){this.b=null}t(pj,X);pj.prototype.apply=function(a){a.ma&&this.b.apply(a)};pj.prototype.d=function(){return 6};function qj(){this.b=null}t(qj,X);qj.prototype.apply=function(a){a.Ea&&this.b.apply(a)};qj.prototype.d=function(){return 12};
function rj(a){this.b=null;this.f=a}t(rj,X);rj.prototype.apply=function(a){a.pa===this.f&&this.b.apply(a)};rj.prototype.d=function(){return 5};function sj(a){this.b=null;this.J=a}t(sj,X);sj.prototype.apply=function(a){a.h[this.J]&&this.b.apply(a)};sj.prototype.d=function(){return 5};function tj(a){this.J=a}tj.prototype.b=function(){return this};tj.prototype.push=function(a,b){0==b&&uj(a,this.J);return!1};tj.prototype.pop=function(a,b){return 0==b?(a.h[this.J]--,!0):!1};function vj(a){this.J=a}
vj.prototype.b=function(){return this};vj.prototype.push=function(a,b){0==b?uj(a,this.J):1==b&&a.h[this.J]--;return!1};vj.prototype.pop=function(a,b){if(0==b)return a.h[this.J]--,!0;1==b&&uj(a,this.J);return!1};function wj(a){this.J=a;this.d=!1}wj.prototype.b=function(){return new wj(this.J)};wj.prototype.push=function(a){return this.d?(a.h[this.J]--,!0):!1};wj.prototype.pop=function(a,b){if(this.d)return a.h[this.J]--,!0;0==b&&(this.d=!0,uj(a,this.J));return!1};
function xj(a){this.J=a;this.d=!1}xj.prototype.b=function(){return new xj(this.J)};xj.prototype.push=function(a,b){this.d&&(-1==b?uj(a,this.J):0==b&&a.h[this.J]--);return!1};xj.prototype.pop=function(a,b){if(this.d){if(-1==b)return a.h[this.J]--,!0;0==b&&uj(a,this.J)}else 0==b&&(this.d=!0,uj(a,this.J));return!1};function yj(a,b){this.e=a;this.d=b}yj.prototype.b=function(){return this};yj.prototype.push=function(){return!1};yj.prototype.pop=function(a,b){return 0==b?(zj(a,this.e,this.d),!0):!1};
function Aj(a){this.lang=a}Aj.prototype.b=function(){return this};Aj.prototype.push=function(){return!1};Aj.prototype.pop=function(a,b){return 0==b?(a.lang=this.lang,!0):!1};function Bj(a){this.d=a}Bj.prototype.b=function(){return this};Bj.prototype.push=function(){return!1};Bj.prototype.pop=function(a,b){return 0==b?(a.B=this.d,!0):!1};function Cj(a,b){this.b=a;this.d=b}t(Cj,fd);
Cj.prototype.hb=function(a){var b=this.b,c=b.B,d=Math.floor(c.length/2)-1;switch(a.name){case "open-quote":a=c[2*Math.min(d,b.l)];b.l++;break;case "close-quote":return 0<b.l&&b.l--,c[2*Math.min(d,b.l)+1];case "no-open-quote":return b.l++,new nd("");case "no-close-quote":return 0<b.l&&b.l--,new nd("")}return a};
var Dj={roman:[4999,1E3,"M",900,"CM",500,"D",400,"CD",100,"C",90,"XC",50,"L",40,"XL",10,"X",9,"IX",5,"V",4,"IV",1,"I"],armenian:[9999,9E3,"\u0584",8E3,"\u0583",7E3,"\u0582",6E3,"\u0581",5E3,"\u0580",4E3,"\u057f",3E3,"\u057e",2E3,"\u057d",1E3,"\u057c",900,"\u057b",800,"\u057a",700,"\u0579",600,"\u0578",500,"\u0577",400,"\u0576",300,"\u0575",200,"\u0574",100,"\u0573",90,"\u0572",80,"\u0571",70,"\u0570",60,"\u056f",50,"\u056e",40,"\u056d",30,"\u056c",20,"\u056b",10,"\u056a",9,"\u0569",8,"\u0568",7,"\u0567",
6,"\u0566",5,"\u0565",4,"\u0564",3,"\u0563",2,"\u0562",1,"\u0561"],georgian:[19999,1E4,"\u10f5",9E3,"\u10f0",8E3,"\u10ef",7E3,"\u10f4",6E3,"\u10ee",5E3,"\u10ed",4E3,"\u10ec",3E3,"\u10eb",2E3,"\u10ea",1E3,"\u10e9",900,"\u10e8",800,"\u10e7",700,"\u10e6",600,"\u10e5",500,"\u10e4",400,"\u10f3",300,"\u10e2",200,"\u10e1",100,"\u10e0",90,"\u10df",80,"\u10de",70,"\u10dd",60,"\u10f2",50,"\u10dc",40,"\u10db",30,"\u10da",20,"\u10d9",10,"\u10d8",9,"\u10d7",8,"\u10f1",7,"\u10d6",6,"\u10d5",5,"\u10d4",4,"\u10d3",
3,"\u10d2",2,"\u10d1",1,"\u10d0"],hebrew:[999,400,"\u05ea",300,"\u05e9",200,"\u05e8",100,"\u05e7",90,"\u05e6",80,"\u05e4",70,"\u05e2",60,"\u05e1",50,"\u05e0",40,"\u05de",30,"\u05dc",20,"\u05db",19,"\u05d9\u05d8",18,"\u05d9\u05d7",17,"\u05d9\u05d6",16,"\u05d8\u05d6",15,"\u05d8\u05d5",10,"\u05d9",9,"\u05d8",8,"\u05d7",7,"\u05d6",6,"\u05d5",5,"\u05d4",4,"\u05d3",3,"\u05d2",2,"\u05d1",1,"\u05d0"]},Ej={latin:"a-z",alpha:"a-z",greek:"\u03b1-\u03c1\u03c3-\u03c9",russian:"\u0430-\u0438\u043a-\u0449\u044d-\u044f"},
Fj={square:"\u25a0",disc:"\u2022",circle:"\u25e6",none:""},Gj={Yd:!1,Ab:"\u96f6\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d",$b:"\u5341\u767e\u5343",Cd:"\u8ca0"};
function Hj(a){if(9999<a||-9999>a)return""+a;if(0==a)return Gj.Ab.charAt(0);var b=new Pa;0>a&&(b.append(Gj.Cd),a=-a);if(10>a)b.append(Gj.Ab.charAt(a));else if(Gj.Zd&&19>=a)b.append(Gj.$b.charAt(0)),0!=a&&b.append(Gj.$b.charAt(a-10));else{var c=Math.floor(a/1E3);c&&(b.append(Gj.Ab.charAt(c)),b.append(Gj.$b.charAt(2)));if(c=Math.floor(a/100)%10)b.append(Gj.Ab.charAt(c)),b.append(Gj.$b.charAt(1));if(c=Math.floor(a/10)%10)b.append(Gj.Ab.charAt(c)),b.append(Gj.$b.charAt(0));(a%=10)&&b.append(Gj.Ab.charAt(a))}return b.toString()}
function Ij(a,b){var c=!1,d=!1,e;null!=(e=b.match(/^upper-(.*)/))?(c=!0,b=e[1]):null!=(e=b.match(/^lower-(.*)/))&&(d=!0,b=e[1]);e="";if(Dj[b])a:{e=Dj[b];var f=a;if(f>e[0]||0>=f||f!=Math.round(f))e="";else{for(var g="",k=1;k<e.length;k+=2){var h=e[k],l=Math.floor(f/h);if(20<l){e="";break a}for(f-=l*h;0<l;)g+=e[k+1],l--}e=g}}else if(Ej[b])if(e=a,0>=e||e!=Math.round(e))e="";else{g=Ej[b];f=[];for(k=0;k<g.length;)if("-"==g.substr(k+1,1))for(l=g.charCodeAt(k),h=g.charCodeAt(k+2),k+=3;l<=h;l++)f.push(String.fromCharCode(l));
else f.push(g.substr(k++,1));g="";do e--,k=e%f.length,g=f[k]+g,e=(e-k)/f.length;while(0<e);e=g}else null!=Fj[b]?e=Fj[b]:"decimal-leading-zero"==b?(e=a+"",1==e.length&&(e="0"+e)):"cjk-ideographic"==b||"trad-chinese-informal"==b?e=Hj(a):e=a+"";return c?e.toUpperCase():d?e.toLowerCase():e}
function Jj(a,b){var c=b[0].toString(),d=1<b.length?b[1].stringValue():"decimal",e=a.b.g[c];if(e&&e.length)return new nd(Ij(e&&e.length&&e[e.length-1]||0,d));c=new L(Kj(a.b.Fa,c,function(a){return Ij(a||0,d)}));return new gd([c])}
function Lj(a,b){var c=b[0].toString(),d=b[1].stringValue(),e=2<b.length?b[2].stringValue():"decimal",f=a.b.g[c],g=new Pa;if(f&&f.length)for(var k=0;k<f.length;k++)0<k&&g.append(d),g.append(Ij(f[k],e));c=new L(Mj(a.b.Fa,c,function(a){var b=[];if(a.length)for(var c=0;c<a.length;c++)b.push(Ij(a[c],e));a=g.toString();a.length&&b.push(a);return b.length?b.join(d):Ij(0,e)}));return new gd([c])}
Cj.prototype.ob=function(a){switch(a.name){case "attr":if(1==a.values.length)return new nd(this.d&&this.d.getAttribute(a.values[0].stringValue())||"");break;case "counter":if(2>=a.values.length)return Jj(this,a.values);break;case "counters":if(3>=a.values.length)return Lj(this,a.values)}u.b("E_CSS_CONTENT_PROP:",a.toString());return new nd("")};var Nj=1/1048576;function Oj(a,b){for(var c in a)b[c]=a[c].clone()}
function Pj(){this.g=0;this.b={};this.Mb={};this.f={};this.d={};this.xa={};this.e={};this.Fb={};this.N=0}Pj.prototype.clone=function(){var a=new Pj;a.g=this.g;for(var b in this.b)a.b[b]=this.b[b];Oj(this.Mb,a.Mb);Oj(this.f,a.f);Oj(this.d,a.d);Oj(this.xa,a.xa);Oj(this.e,a.e);Oj(this.Fb,a.Fb);a.N=this.N;return a};function ej(a,b,c){var d=a[b];d&&(c=d.g(c));a[b]=c}
function Qj(a,b,c){this.j=a;this.d=b;this.Fa=c;this.b=[[],[]];this.h={};this.u=this.w=this.e=null;this.$=this.fa=this.M=this.k=this.f="";this.I=this.D=null;this.Ea=this.ma=!0;this.g={};this.A=[{}];this.B=[new nd("\u201c"),new nd("\u201d"),new nd("\u2018"),new nd("\u2019")];this.l=0;this.lang="";this.Xa=[0];this.pa=0;this.va=[]}function uj(a,b){a.h[b]=(a.h[b]||0)+1}function Rj(a,b,c){(b=b[c])&&b.apply(a)}var Sj=[];
function Tj(a,b,c,d){a.e=null;a.w=d;a.k="";a.f="";a.M="";a.fa="";a.u=b;a.$="";a.D=Sj;a.I=c;Uj(a)}function Vj(a,b,c){a.g[b]?a.g[b].push(c):a.g[b]=[c];c=a.A[a.A.length-1];c||(c={},a.A[a.A.length-1]=c);c[b]=!0}
function Wj(a,b){var c=Kd,d=b.display;d&&(c=d.evaluate(a.d));var e=null,d=null,f=b["counter-reset"];f&&(f=f.evaluate(a.d))&&(e=ng(f,!0));(f=b["counter-increment"])&&(f=f.evaluate(a.d))&&(d=ng(f,!1));"ol"!=a.f&&"ul"!=a.f||"http://www.w3.org/1999/xhtml"!=a.k||(e||(e={}),e["ua-list-item"]=0);c===Pd&&(d||(d={}),d["ua-list-item"]=1);if(e)for(var g in e)Vj(a,g,e[g]);if(d)for(var k in d)a.g[k]||Vj(a,k,0),g=a.g[k],g[g.length-1]+=d[k];c===Pd&&(c=a.g["ua-list-item"],b["ua-list-item-count"]=new V(new pd(c[c.length-
1]),0));a.A.push(null)}function Xj(a){var b=a.A.pop();if(b)for(var c in b)(b=a.g[c])&&(1==b.length?delete a.g[c]:b.pop())}function zj(a,b,c){Wj(a,b);b.content&&(b.content=b.content.wc(new Cj(a,c)));Xj(a)}var Yj="before transclusion-before footnote-call footnote-marker inner first-letter first-line  transclusion-after after".split(" ");
function Zj(a,b,c){a.va.push(b);a.I=null;a.e=b;a.w=c;a.k=b.namespaceURI;a.f=b.localName;var d=a.j.b[a.k];a.$=d?d+a.f:"";a.M=b.getAttribute("id");a.fa=b.getAttributeNS("http://www.w3.org/XML/1998/namespace","id");(d=b.getAttribute("class"))?a.u=d.split(/\s+/):a.u=Sj;(d=b.getAttributeNS("http://www.idpf.org/2007/ops","type"))?a.D=d.split(/\s+/):a.D=Sj;"style"==a.f&&"http://www.gribuser.ru/xml/fictionbook/2.0"==a.k&&(a.u=[b.getAttribute("name")||""]);(d=b.getAttributeNS("http://www.w3.org/XML/1998/namespace",
"lang"))||"http://www.w3.org/1999/xhtml"!=a.k||(d=b.getAttribute("lang"));d&&(a.b[a.b.length-1].push(new Aj(a.lang)),a.lang=d.toLowerCase());d=a.Xa;a.pa=++d[d.length-1];d.push([0]);Uj(a);d=c.quotes;c=null;d&&(d=d.evaluate(a.d))&&(c=new Bj(a.B),d===Rd?a.B=[new nd(""),new nd("")]:d instanceof gd&&(a.B=d.values));Wj(a,a.w);if(d=a.w._pseudos)for(var e=!0,f=0;f<Yj.length;f++){var g=Yj[f];g||(e=!1);(g=d[g])&&(e?zj(a,g,b):a.b[a.b.length-2].push(new yj(g,b)))}c&&a.b[a.b.length-2].push(c)}
function Uj(a){var b;for(b=0;b<a.u.length;b++)Rj(a,a.j.xa,a.u[b]);for(b=0;b<a.D.length;b++)Rj(a,a.j.d,a.D[b]);Rj(a,a.j.e,a.M);Rj(a,a.j.Mb,a.f);""!=a.f&&Rj(a,a.j.Mb,"*");Rj(a,a.j.f,a.$);null!==a.I&&(Rj(a,a.j.Fb,a.I),Rj(a,a.j.Fb,"*"));a.e=null;a.b.push([]);for(var c=1;-1<=c;--c){var d=a.b[a.b.length-c-2];for(b=0;b<d.length;)d[b].push(a,c)?d.splice(b,1):b++}a.ma=!0;a.Ea=!1}
Qj.prototype.pop=function(){for(var a=1;-1<=a;--a)for(var b=this.b[this.b.length-a-2],c=0;c<b.length;)b[c].pop(this,a)?b.splice(c,1):c++;this.b.pop();this.ma=!1};var ak=null;function bk(a,b,c,d,e,f,g){Ef.call(this,a,b,g);this.b=null;this.d=0;this.k=null;this.w=0;this.g=null;this.l=!1;this.J=c;this.h=d?d.h:ak?ak.clone():new Pj;this.B=e;this.u=f;this.j=0}t(bk,Ff);m=bk.prototype;m.md=function(a){ej(this.h.Mb,"*",a)};
function ck(a,b){var c=a.b;if(0<c.length){c.sort(function(a,b){return b.d()-a.d()});for(var d=null,e=c.length-1;0<=e;e--)d=c[e],d.b=b,b=d;if(d.e(a.h))return}a.md(b)}m.Za=function(a,b){if(b||a)this.d+=1,b&&a?this.b.push(new hj(a,b)):b?this.b.push(new gj(b)):this.b.push(new jj(a))};m.uc=function(a){this.g?(u.b("::"+this.g,"followed by ."+a),this.b.push(new sj(""))):(this.d+=256,this.b.push(new dj(a)))};
m.Gb=function(a,b){if(this.g)u.b("::"+this.g,"followed by :"+a),this.b.push(new sj(""));else{switch(a.toLowerCase()){case "first-child":this.b.push(new pj);break;case "root":this.b.push(new qj);break;case "link":this.b.push(new gj("a"));this.b.push(new kj("","href"));break;case "-adapt-href-epub-type":case "href-epub-type":if(b&&1==b.length&&"string"==typeof b[0]){var c=new RegExp("(^|s)"+ua(b[0])+"($|s)");this.b.push(new ij(c))}else this.b.push(new sj(""));break;case "-adapt-footnote-content":case "footnote-content":this.l=
!0;break;case "visited":case "active":case "hover":case "focus":this.b.push(new sj(""));break;case "lang":b&&1==b.length&&"string"==typeof b[0]?this.b.push(new oj(new RegExp("^"+ua(b[0].toLowerCase())+"($|-)"))):this.b.push(new sj(""));break;case "nth-child":b&&1==b.length&&"number"==typeof b[0]?this.b.push(new rj(b[0])):this.b.push(new sj(""));break;case "before":case "after":case "first-line":case "first-letter":this.Hb(a,b);return;default:this.b.push(new sj(""))}this.d+=256}};
m.Hb=function(a,b){switch(a){case "before":case "after":case "first-line":case "first-letter":case "footnote-call":case "footnote-marker":case "inner":this.g?(u.b("Double pseudoelement ::"+this.g+"::"+a),this.b.push(new sj(""))):this.g=a;break;case "first-n-lines":if(b&&1==b.length&&"number"==typeof b[0]){var c=Math.round(b[0]);if(0<c&&c==b[0]){this.g?(u.b("Double pseudoelement ::"+this.g+"::"+a),this.b.push(new sj(""))):this.g="first-"+c+"-lines";break}}default:u.b("Unrecognized pseudoelement: ::"+
a),this.b.push(new sj(""))}this.d+=1};m.Ac=function(a){this.d+=65536;this.b.push(new fj(a))};
m.Wb=function(a,b,c,d){this.d+=256;d=d||"";switch(c){case 0:this.b.push(new kj(a,b));break;case 39:this.b.push(new lj(a,b,d));break;case 45:this.b.push(new nj(a,b,new RegExp("(^|s)"+ua(d)+"($|s)")));break;case 44:this.b.push(new nj(a,b,new RegExp("^"+ua(d)+"($|-)")));break;case 50:"supported"==d?this.b.push(new mj(a,b)):u.b("Unsupported :: attr selector op:",d);break;default:u.b("Unsupported attr selector:",c)}};m.ab=function(){var a="d"+this.w++;ck(this,new bj(new tj(a)));this.b=[new sj(a)]};
m.tc=function(){var a="c"+this.w++;ck(this,new bj(new vj(a)));this.b=[new sj(a)]};m.rc=function(){var a="a"+this.w++;ck(this,new bj(new wj(a)));this.b=[new sj(a)]};m.xc=function(){var a="f"+this.w++;ck(this,new bj(new xj(a)));this.b=[new sj(a)]};m.Gc=function(){dk(this);this.g=null;this.l=!1;this.d=0;this.b=[]};m.gb=function(){var a;0!=this.j?(Hf(this,"E_CSS_UNEXPECTED_SELECTOR"),a=!0):a=!1;a||(this.j=1,this.k={},this.g=null,this.d=0,this.l=!1,this.b=[])};
m.error=function(a,b){Ff.prototype.error.call(this,a,b);1==this.j&&(this.j=0)};m.vb=function(a){Ff.prototype.vb.call(this,a);this.j=0};m.la=function(){dk(this);Ff.prototype.la.call(this);1==this.j&&(this.j=0)};m.Sa=function(){Ff.prototype.Sa.call(this)};function dk(a){if(a.b){var b=a.d,c;c=a.h;c=c.N+=Nj;ck(a,a.od(b+c));a.b=null;a.g=null;a.l=!1;a.d=0}}m.od=function(a){var b=this.B;this.l&&(b=b?"xxx-bogus-xxx":"footnote");return new cj(this.k,a,this.g,b)};m.Ja=function(a,b,c){bh(this.u,a,b,c,this)};
m.Db=function(a,b){Gf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};m.kc=function(a,b){Gf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};m.fb=function(a,b,c){"display"!=a||b!==Ud&&b!==Td||(this.fb("flow-options",new gd([Ed,$d]),c),this.fb("flow-into",b,c),b=zd);(Di.SIMPLE_PROPERTY||[]).forEach(function(d){d=d({name:a,value:b,important:c});a=d.name;b=d.value;c=d.important});var d=c?Af(this):Bf(this);Ui(this.k,a,this.J?new Qi(b,d,this.J):new V(b,d))};
function ek(a,b){Ef.call(this,a,b,!1)}t(ek,Ff);ek.prototype.Ja=function(a,b){if(this.e.values[a])this.error("E_CSS_NAME_REDEFINED "+a,this.Cb());else{var c=a.match(/height|^(top|bottom)$/)?"vh":"vw",c=new Uc(this.e,100,c),c=b.ea(this.e,c);this.e.values[a]=c}};function fk(a,b,c,d,e){Ef.call(this,a,b,!1);this.b=d;this.J=c;this.d=e}t(fk,Ff);fk.prototype.Ja=function(a,b,c){c?u.b("E_IMPORTANT_NOT_ALLOWED"):bh(this.d,a,b,c,this)};fk.prototype.Db=function(a,b){u.b("E_INVALID_PROPERTY_VALUE",a+":",b.toString())};
fk.prototype.kc=function(a,b){u.b("E_INVALID_PROPERTY",a+":",b.toString())};fk.prototype.fb=function(a,b,c){c=c?Af(this):Bf(this);c+=this.N;this.N+=Nj;Ui(this.b,a,this.J?new Qi(b,c,this.J):new V(b,c))};function gk(a,b){ag.call(this,a);this.b={};this.d=b;this.N=0}t(gk,ag);gk.prototype.Ja=function(a,b,c){bh(this.d,a,b,c,this)};gk.prototype.Db=function(a,b){u.b("E_INVALID_PROPERTY_VALUE",a+":",b.toString())};gk.prototype.kc=function(a,b){u.b("E_INVALID_PROPERTY",a+":",b.toString())};
gk.prototype.fb=function(a,b,c){c=(c?67108864:50331648)+this.N;this.N+=Nj;Ui(this.b,a,new V(b,c))};var hk=new wf(function(){var a=M("uaStylesheetBase");uf(ch).then(function(b){var c=sa("user-agent-base.css",ra);b=new bk(null,null,null,null,null,b,!0);b.vb("UA");ak=b.h;dg(c,b,null,null).oa(a)});return O(a)},"uaStylesheetBaseFetcher");function ik(a,b,c){return(a=a["writing-mode"])&&(b=a.evaluate(b,"writing-mode"))&&b!==Jd?b===fe:c}
function jk(a,b,c,d){var e={},f;for(f in a)Ti(f)&&(e[f]=a[f]);a=a._regions;if((c||d)&&a)for(d&&(d=["footnote"],c=c?c.concat(d):d),d=0;d<c.length;d++){f=a[c[d]];for(var g in f)Ti(g)&&(e[g]=Ri(b,e[g],f[g]))}return e}function kk(a,b,c,d){c=c?Oi:Pi;for(var e in a)if(a.hasOwnProperty(e)){var f=a[e];if(f){var g=c[e];if(g){var k=a[g];if(k&&k.Da>f.Da)continue;g=Ji[g]?g:e}else g=e;b[g]=d(e,f)}}};function lk(a,b,c){this.e=a;this.d=b;this.b=c}function mk(){this.map=[]}function nk(a){return 0==a.map.length?0:a.map[a.map.length-1].b}function ok(a,b){if(0==a.map.length)a.map.push(new lk(b,b,b));else{var c=a.map[a.map.length-1],d=c.b+b-c.d;c.d==c.e?(c.d=b,c.e=b,c.b=d):a.map.push(new lk(b,b,d))}}function pk(a,b){0==a.map.length?a.map.push(new lk(b,0,0)):a.map[a.map.length-1].d=b}function qk(a,b){var c=Xa(a.map.length,function(c){return b<=a.map[c].d}),c=a.map[c];return c.b-Math.max(0,c.e-b)}
function rk(a,b){var c=Xa(a.map.length,function(c){return b<=a.map[c].b}),c=a.map[c];return c.e-(c.b-b)}
function sk(a,b,c,d,e,f,g){this.Z=a;this.root=a.root;this.fa=c;this.f=d;this.h=f;this.d=this.root;this.u={};this.w={};this.B=[];this.l=this.k=null;this.A=new Qj(b,d,g);this.e=new mk;this.Qa=!0;this.D=[];this.$=e;this.M=this.I=!1;this.b=a=qh(a,this.root);ok(this.e,a);b=tk(this,this.root);Zj(this.A,this.root,b);uk(this,b,!1);this.j=!0;switch(this.root.namespaceURI){case "http://www.w3.org/1999/xhtml":case "http://www.gribuser.ru/xml/fictionbook/2.0":this.j=!1}this.D.push(!0);this.w={};this.w["e"+a]=
b;this.b++;vk(this,-1)}function wk(a,b,c,d){return(b=b[d])&&b.evaluate(a.f)!==c[d]}function xk(a,b,c){for(var d in c){var e=b[d];e?(a.u[d]=e,delete b[d]):(e=c[d])&&(a.u[d]=new V(e,33554432))}}var yk=["column-count","column-width"];
function uk(a,b,c){c||["writing-mode","direction"].forEach(function(a){b[a]&&(this.u[a]=b[a])},a);if(!a.I){c=wk(a,b,a.h.g,"background-color")?b["background-color"].evaluate(a.f):null;var d=wk(a,b,a.h.g,"background-image")?b["background-image"].evaluate(a.f):null;if(c&&c!==Jd||d&&d!==Jd)xk(a,b,a.h.g),a.I=!0}if(!a.M)for(c=0;c<yk.length;c++)if(wk(a,b,a.h.j,yk[c])){xk(a,b,a.h.j);a.M=!0;break}if(c=b["font-size"]){d=c.evaluate(a.f);c=d.C;switch(d.ia){case "em":case "rem":c*=a.f.g;break;case "ex":case "rex":c*=
a.f.g*qc.ex/qc.em;break;case "%":c*=a.f.g/100;break;default:(d=qc[d.ia])&&(c*=d)}a.f.$=c}}function tk(a,b){if(b.style instanceof CSSStyleDeclaration){var c=b.getAttribute("style");if(c){var d=a.Z.url,e=new gk(a.fa,a.h),c=new ac(c,e);try{$f(new Sf(Jf,c,e,d),Number.POSITIVE_INFINITY,!1,!0,!1)}catch(f){u.b(f,"Style attribute parse error:")}return e.b}}return{}}
function vk(a,b){if(!(b>=a.b)){var c=a.f,d=qh(a.Z,a.root);if(b<d){var e=a.g(a.root,!1),f=e["flow-into"],f=f?f.evaluate(c,"flow-into").toString():"body";zk(a,f,e,a.root,d)}d=uh(a.Z,b);e=rh(a.Z,d,0,!1);if(!(e>=a.b))for(;;){if(1!=d.nodeType)e+=d.textContent.length;else{var g=d;if(e!=qh(a.Z,g))throw Error("Inconsistent offset");var k=a.g(g,!1);if(f=k["flow-into"])f=f.evaluate(c,"flow-into").toString(),zk(a,f,k,g,e);e++}if(e>=a.b)break;f=d.firstChild;if(null==f)for(;!(f=d.nextSibling);)if(d=d.parentNode,
d===a.root)return;d=f}}}function zk(a,b,c,d,e){var f=0,g=Number.POSITIVE_INFINITY,k=!1,h=!1,l=!1,n=c["flow-options"];if(n){var p;a:{if(k=n.evaluate(a.f,"flow-options")){h=new hg;try{k.R(h);p=h.b;break a}catch(r){u.b(r,"toSet:")}}p={}}k=!!p.exclusive;h=!!p["static"];l=!!p.last}(p=c["flow-linger"])&&(g=jg(p.evaluate(a.f,"flow-linger"),Number.POSITIVE_INFINITY));(c=c["flow-priority"])&&(f=jg(c.evaluate(a.f,"flow-priority"),0));d=new Vh(b,d,e,f,g,k,h,l);a.B.push(d);a.l==b&&(a.l=null);a.k&&Ak(a.k,d)}
function Bk(a,b,c){var d=-1;if(b<=a.b&&(d=qk(a.e,b),d+=c,d<nk(a.e)))return rk(a.e,d);if(null==a.d)return Number.POSITIVE_INFINITY;for(var e=a.f;;){var f=a.d.firstChild;if(null==f)for(;;){if(1==a.d.nodeType){var f=a.A,g=a.d;if(f.va.pop()!==g)throw Error("Invalid call to popElement");f.Xa.pop();f.pop();Xj(f);a.Qa=a.D.pop()}if(f=a.d.nextSibling)break;a.d=a.d.parentNode;if(a.d===a.root)return a.d=null,b<a.b&&(0>d&&(d=qk(a.e,b),d+=c),d<=nk(a.e))?rk(a.e,d):Number.POSITIVE_INFINITY}a.d=f;if(1!=a.d.nodeType)a.b+=
a.d.textContent.length,a.Qa?ok(a.e,a.b):pk(a.e,a.b);else{g=a.d;f=tk(a,g);a.D.push(a.Qa);Zj(a.A,g,f);a.j||"body"!=g.localName||g.parentNode!=a.root||(uk(a,f,!0),a.j=!0);var k=f["flow-into"];k&&(k=k.evaluate(e,"flow-into").toString(),zk(a,k,f,g,a.b),a.Qa=!!a.$[k]);a.Qa&&(g=f.display)&&g.evaluate(e,"display")===Rd&&(a.Qa=!1);if(qh(a.Z,a.d)!=a.b)throw Error("Inconsistent offset");a.w["e"+a.b]=f;a.b++;a.Qa?ok(a.e,a.b):pk(a.e,a.b);if(b<a.b&&(0>d&&(d=qk(a.e,b),d+=c),d<=nk(a.e)))return rk(a.e,d)}}}
sk.prototype.g=function(a,b){var c=qh(this.Z,a),d="e"+c;b&&(c=rh(this.Z,a,0,!0));this.b<=c&&Bk(this,c,0);return this.w[d]};var Ck=1;function Dk(a,b,c,d,e){this.b={};this.children=[];this.e=null;this.h=0;this.d=a;this.name=b;this.eb=c;this.xa=d;this.parent=e;this.g="p"+Ck++;e&&(this.h=e.children.length,e.children.push(this))}Dk.prototype.f=function(){throw Error("E_UNEXPECTED_CALL");};Dk.prototype.clone=function(){throw Error("E_UNEXPECTED_CALL");};function Ek(a,b){var c=a.b,d=b.b,e;for(e in c)Object.prototype.hasOwnProperty.call(c,e)&&(d[e]=c[e])}
function Ik(a,b){for(var c=0;c<a.children.length;c++)a.children[c].clone({parent:b})}function Jk(a){Dk.call(this,a,null,null,[],null);this.b.width=new V(je,0);this.b.height=new V(ke,0)}t(Jk,Dk);
function Kk(a,b){this.e=b;var c=this;lc.call(this,a,function(a,b){var f=a.match(/^([^.]+)\.([^.]+)$/);if(f){var g=c.e.k[f[1]];if(g&&(g=this.pa[g])){if(b){var f=f[2],k=g.fa[f];if(k)g=k;else{switch(f){case "columns":var k=g.d.d,h=new $c(k,0),l=Lk(g,"column-count"),n=Lk(g,"column-width"),p=Lk(g,"column-gap"),k=G(k,bd(k,new Xc(k,"min",[h,l]),E(k,n,p)),p)}k&&(g.fa[f]=k);g=k}}else g=Lk(g,f[2]);return g}}return null})}t(Kk,lc);
function Mk(a,b,c,d,e,f,g){a=a instanceof Kk?a:new Kk(a,this);Dk.call(this,a,b,c,d,e);this.e=this;this.J=f;this.j=g;this.b.width=new V(je,0);this.b.height=new V(ke,0);this.b["wrap-flow"]=new V(yd,0);this.b.position=new V(Wd,0);this.b.overflow=new V(Hd,0);this.k={}}t(Mk,Dk);Mk.prototype.f=function(a){return new Nk(a,this)};Mk.prototype.clone=function(a){a=new Mk(this.d,this.name,a.eb||this.eb,this.xa,this.parent,this.J,this.j);Ek(this,a);Ik(this,a);return a};
function Ok(a,b,c,d,e){Dk.call(this,a,b,c,d,e);this.e=e.e;b&&(this.e.k[b]=this.g);this.b["wrap-flow"]=new V(yd,0)}t(Ok,Dk);Ok.prototype.f=function(a){return new Pk(a,this)};Ok.prototype.clone=function(a){a=new Ok(a.parent.d,this.name,this.eb,this.xa,a.parent);Ek(this,a);Ik(this,a);return a};function Qk(a,b,c,d,e){Dk.call(this,a,b,c,d,e);this.e=e.e;b&&(this.e.k[b]=this.g)}t(Qk,Dk);Qk.prototype.f=function(a){return new Rk(a,this)};
Qk.prototype.clone=function(a){a=new Qk(a.parent.d,this.name,this.eb,this.xa,a.parent);Ek(this,a);Ik(this,a);return a};function Y(a,b,c){return b&&b!==yd?b.ea(a,c):null}function Sk(a,b,c){return b&&b!==yd?b.ea(a,c):a.b}function Tk(a,b,c){return b?b===yd?null:b.ea(a,c):a.b}function Uk(a,b,c,d){return b&&c!==Rd?b.ea(a,d):a.b}function Vk(a,b,c){return b?b===he?a.g:b===Fd?a.f:b.ea(a,a.b):c}
function Wk(a,b){this.e=a;this.d=b;this.B={};this.style={};this.k=this.l=null;this.children=[];this.D=this.I=this.f=this.g=!1;this.w=this.A=0;this.u=null;this.ma={};this.fa={};this.va=this.b=!1;a&&a.children.push(this)}function Xk(a,b,c){b=Lk(a,b);c=Lk(a,c);if(!b||!c)throw Error("E_INTERNAL");return E(a.d.d,b,c)}
function Lk(a,b){var c=a.ma[b];if(c)return c;var d=a.style[b];d&&(c=d.ea(a.d.d,a.d.d.b));switch(b){case "margin-left-edge":c=Lk(a,"left");break;case "margin-top-edge":c=Lk(a,"top");break;case "margin-right-edge":c=Xk(a,"border-right-edge","margin-right");break;case "margin-bottom-edge":c=Xk(a,"border-bottom-edge","margin-bottom");break;case "border-left-edge":c=Xk(a,"margin-left-edge","margin-left");break;case "border-top-edge":c=Xk(a,"margin-top-edge","margin-top");break;case "border-right-edge":c=
Xk(a,"padding-right-edge","border-right-width");break;case "border-bottom-edge":c=Xk(a,"padding-bottom-edge","border-bottom-width");break;case "padding-left-edge":c=Xk(a,"border-left-edge","border-left-width");break;case "padding-top-edge":c=Xk(a,"border-top-edge","border-top-width");break;case "padding-right-edge":c=Xk(a,"right-edge","padding-right");break;case "padding-bottom-edge":c=Xk(a,"bottom-edge","padding-bottom");break;case "left-edge":c=Xk(a,"padding-left-edge","padding-left");break;case "top-edge":c=
Xk(a,"padding-top-edge","padding-top");break;case "right-edge":c=Xk(a,"left-edge","width");break;case "bottom-edge":c=Xk(a,"top-edge","height")}if(!c){if("extent"==b)d=a.b?"width":"height";else if("measure"==b)d=a.b?"height":"width";else{var e=a.b?Oi:Pi,d=b,f;for(f in e)d=d.replace(f,e[f])}d!=b&&(c=Lk(a,d))}c&&(a.ma[b]=c);return c}
function Yk(a){var b=a.d.d,c=a.style,d=Vk(b,c.enabled,b.g),e=Y(b,c.page,b.b);if(e)var f=new Vc(b,"page-number"),d=ad(b,d,new Nc(b,e,f));(e=Y(b,c["min-page-width"],b.b))&&(d=ad(b,d,new Mc(b,new Vc(b,"page-width"),e)));(e=Y(b,c["min-page-height"],b.b))&&(d=ad(b,d,new Mc(b,new Vc(b,"page-height"),e)));d=a.M(d);c.enabled=new L(d)}Wk.prototype.M=function(a){return a};
Wk.prototype.Bc=function(){var a=this.d.d,b=this.style,c=this.e?this.e.style.width.ea(a,null):null,d=Y(a,b.left,c),e=Y(a,b["margin-left"],c),f=Uk(a,b["border-left-width"],b["border-left-style"],c),g=Sk(a,b["padding-left"],c),k=Y(a,b.width,c),h=Y(a,b["max-width"],c),l=Sk(a,b["padding-right"],c),n=Uk(a,b["border-right-width"],b["border-right-style"],c),p=Y(a,b["margin-right"],c),r=Y(a,b.right,c),q=E(a,f,g),v=E(a,f,l);d&&r&&k?(q=G(a,c,E(a,k,E(a,E(a,d,q),v))),e?p?r=G(a,q,p):p=G(a,q,E(a,r,e)):(q=G(a,q,
r),p?e=G(a,q,p):p=e=bd(a,q,new B(a,.5)))):(e||(e=a.b),p||(p=a.b),d||r||k||(d=a.b),d||k?d||r?k||r||(k=this.l,this.g=!0):d=a.b:(k=this.l,this.g=!0),q=G(a,c,E(a,E(a,e,q),E(a,p,v))),this.g&&(h||(h=G(a,q,d?d:r)),this.b||!Y(a,b["column-width"],null)&&!Y(a,b["column-count"],null)||(k=h,this.g=!1)),d?k?r||(r=G(a,q,E(a,d,k))):k=G(a,q,E(a,d,r)):d=G(a,q,E(a,r,k)));a=Sk(a,b["snap-width"]||(this.e?this.e.style["snap-width"]:null),c);b.left=new L(d);b["margin-left"]=new L(e);b["border-left-width"]=new L(f);b["padding-left"]=
new L(g);b.width=new L(k);b["max-width"]=new L(h?h:k);b["padding-right"]=new L(l);b["border-right-width"]=new L(n);b["margin-right"]=new L(p);b.right=new L(r);b["snap-width"]=new L(a)};
Wk.prototype.Cc=function(){var a=this.d.d,b=this.style,c=this.e?this.e.style.width.ea(a,null):null,d=this.e?this.e.style.height.ea(a,null):null,e=Y(a,b.top,d),f=Y(a,b["margin-top"],c),g=Uk(a,b["border-top-width"],b["border-top-style"],c),k=Sk(a,b["padding-top"],c),h=Y(a,b.height,d),l=Y(a,b["max-height"],d),n=Sk(a,b["padding-bottom"],c),p=Uk(a,b["border-bottom-width"],b["border-bottom-style"],c),r=Y(a,b["margin-bottom"],c),q=Y(a,b.bottom,d),v=E(a,g,k),y=E(a,p,n);e&&q&&h?(d=G(a,d,E(a,h,E(a,E(a,e,v),
y))),f?r?q=G(a,d,f):r=G(a,d,E(a,q,f)):(d=G(a,d,q),r?f=G(a,d,r):r=f=bd(a,d,new B(a,.5)))):(f||(f=a.b),r||(r=a.b),e||q||h||(e=a.b),e||h?e||q?h||q||(h=this.k,this.f=!0):e=a.b:(h=this.k,this.f=!0),d=G(a,d,E(a,E(a,f,v),E(a,r,y))),this.f&&(l||(l=G(a,d,e?e:q)),this.b&&(Y(a,b["column-width"],null)||Y(a,b["column-count"],null))&&(h=l,this.f=!1)),e?h?q||(q=G(a,d,E(a,e,h))):h=G(a,d,E(a,q,e)):e=G(a,d,E(a,q,h)));a=Sk(a,b["snap-height"]||(this.e?this.e.style["snap-height"]:null),c);b.top=new L(e);b["margin-top"]=
new L(f);b["border-top-width"]=new L(g);b["padding-top"]=new L(k);b.height=new L(h);b["max-height"]=new L(l?l:h);b["padding-bottom"]=new L(n);b["border-bottom-width"]=new L(p);b["margin-bottom"]=new L(r);b.bottom=new L(q);b["snap-height"]=new L(a)};
function Zk(a){var b=a.d.d,c=a.style;a=Y(b,c[a.b?"height":"width"],null);var d=Y(b,c["column-width"],a),e=Y(b,c["column-count"],null),f;(f=(f=c["column-gap"])&&f!==Sd?f.ea(b,null):null)||(f=new Uc(b,1,"em"));d&&!e&&(e=new Xc(b,"floor",[cd(b,E(b,a,f),E(b,d,f))]),e=new Xc(b,"max",[b.d,e]));e||(e=b.d);d=G(b,cd(b,E(b,a,f),e),f);c["column-width"]=new L(d);c["column-count"]=new L(e);c["column-gap"]=new L(f)}function $k(a,b,c,d){a=a.style[b].ea(a.d.d,null);return xc(a,c,d,{})}
function al(a,b){b.pa[a.d.g]=a;var c=a.d.d,d=a.style,e=a.e?bl(a.e,b):null,e=jk(a.B,b,e,!1);a.b=ik(e,b,a.e?a.e.b:!1);kk(e,d,a.b,function(a,b){return b.value});a.l=new nc(c,function(){return a.A},"autoWidth");a.k=new nc(c,function(){return a.w},"autoHeight");a.Bc();a.Cc();Zk(a);Yk(a)}function cl(a,b,c){(a=a.style[c])&&(a=gg(b,a,c));return a}function Z(a,b,c){(a=a.style[c])&&(a=gg(b,a,c));return ud(a,b)}
function bl(a,b){var c;a:{if(c=a.B["region-id"]){for(var d=[],e=0;e<c.length;e++){var f=c[e].evaluate(b,"");f&&f!==H&&d.push(f)}if(d.length){c=d;break a}}c=null}if(c){d=[];for(e=0;e<c.length;e++)d[e]=c[e].toString();return d}return null}function dl(a,b,c,d){(a=cl(a,b,d))&&w(c.b,d,a.toString())}
function el(a,b,c){var d=Z(a,b,"left"),e=Z(a,b,"margin-left"),f=Z(a,b,"padding-left"),g=Z(a,b,"border-left-width");a=Z(a,b,"width");ri(c,d,a);w(c.b,"margin-left",e+"px");w(c.b,"padding-left",f+"px");w(c.b,"border-left-width",g+"px");c.marginLeft=e;c.$=g;c.j=f}
function fl(a,b,c){var d=Z(a,b,"right"),e=Z(a,b,"snap-height"),f=Z(a,b,"margin-right"),g=Z(a,b,"padding-right");b=Z(a,b,"border-right-width");w(c.b,"margin-right",f+"px");w(c.b,"padding-right",g+"px");w(c.b,"border-right-width",b+"px");c.marginRight=f;c.Ea=b;a.b&&0<e&&(a=d+oi(c),a=a-Math.floor(a/e)*e,0<a&&(c.Sb=e-a,g+=c.Sb));c.D=g;c.Tb=e}
function gl(a,b,c){var d=Z(a,b,"snap-height"),e=Z(a,b,"top"),f=Z(a,b,"margin-top"),g=Z(a,b,"padding-top");b=Z(a,b,"border-top-width");c.top=e;c.marginTop=f;c.fa=b;c.Fa=d;!a.b&&0<d&&(a=e+li(c),a=a-Math.floor(a/d)*d,0<a&&(c.pa=d-a,g+=c.pa));c.k=g;w(c.b,"top",e+"px");w(c.b,"margin-top",f+"px");w(c.b,"padding-top",g+"px");w(c.b,"border-top-width",b+"px")}
function hl(a,b,c){var d=Z(a,b,"margin-bottom"),e=Z(a,b,"padding-bottom"),f=Z(a,b,"border-bottom-width");a=Z(a,b,"height")-c.pa;w(c.b,"height",a+"px");w(c.b,"margin-bottom",d+"px");w(c.b,"padding-bottom",e+"px");w(c.b,"border-bottom-width",f+"px");c.height=a-c.pa;c.marginBottom=d;c.va=f;c.w=e}function il(a,b,c){a.b?(gl(a,b,c),hl(a,b,c)):(fl(a,b,c),el(a,b,c))}
function jl(a,b,c){w(c.b,"border-top-width","0px");var d=Z(a,b,"max-height");a.I?qi(c,0,d):(gl(a,b,c),d-=c.pa,c.height=d,w(c.b,"height",d+"px"))}function kl(a,b,c){w(c.b,"border-left-width","0px");var d=Z(a,b,"max-width");a.D?ri(c,0,d):(fl(a,b,c),d-=c.Sb,c.width=d,a=Z(a,b,"right"),w(c.b,"right",a+"px"),w(c.b,"width",d+"px"))}
var ll="border-left-style border-right-style border-top-style border-bottom-style border-left-color border-right-color border-top-color border-bottom-color outline-style outline-color outline-width overflow visibility".split(" "),ml="border-top-left-radius border-top-right-radius border-bottom-right-radius border-bottom-left-radius border-image-source border-image-slice border-image-width border-image-outset border-image-repeat background-attachment background-color background-image background-repeat background-position background-clip background-origin background-size opacity z-index".split(" "),
nl="color font-family font-size font-style font-weight font-variant line-height letter-spacing text-align text-decoration text-indent text-transform white-space word-spacing".split(" "),ol=["transform","transform-origin"];
Wk.prototype.cb=function(a,b){this.e&&this.b==this.e.b||w(b.b,"writing-mode",this.b?"vertical-rl":"horizontal-tb");(this.b?this.g:this.f)?this.b?kl(this,a,b):jl(this,a,b):(this.b?fl(this,a,b):gl(this,a,b),this.b?el(this,a,b):hl(this,a,b));(this.b?this.f:this.g)?this.b?jl(this,a,b):kl(this,a,b):il(this,a,b);for(var c=0;c<ll.length;c++)dl(this,a,b,ll[c])};function pl(a,b,c){for(var d=0;d<nl.length;d++)dl(a,b,c,nl[d])}
Wk.prototype.Yb=function(a,b,c,d,e){this.b?this.A=b.e+b.Sb:this.w=b.e+b.pa;var f=(this.b||!d)&&this.f,g=(!this.b||!d)&&this.g,k=null;if(g||f)g&&w(b.b,"width","auto"),f&&w(b.b,"height","auto"),k=(d?d.b:b.b).getBoundingClientRect(),g&&(this.A=Math.ceil(k.right-k.left-b.j-b.$-b.D-b.Ea),this.b&&(this.A+=b.Sb)),f&&(this.w=k.bottom-k.top-b.k-b.fa-b.w-b.va,this.b||(this.w+=b.pa));(this.b?this.f:this.g)&&il(this,a,b);if(this.b?this.g:this.f){if(this.b?this.D:this.I)this.b?fl(this,a,b):gl(this,a,b);this.b?
el(this,a,b):hl(this,a,b)}if(1<e&&(f=Z(this,a,"column-rule-width"),g=cl(this,a,"column-rule-style"),k=cl(this,a,"column-rule-color"),0<f&&g&&g!=Rd&&k!=de)){var h=Z(this,a,"column-gap"),l=this.b?b.height:b.width,n=this.b?"border-top":"border-left";for(d=1;d<e;d++){var p=(l+h)*d/e-h/2+b.j-f/2,r=b.height+b.k+b.w,q=b.b.ownerDocument.createElement("div");w(q,"position","absolute");w(q,this.b?"left":"top","0px");w(q,this.b?"top":"left",p+"px");w(q,this.b?"height":"width","0px");w(q,this.b?"width":"height",
r+"px");w(q,n,f+"px "+g.toString()+(k?" "+k.toString():""));b.b.insertBefore(q,b.b.firstChild)}}for(d=0;d<ml.length;d++)dl(this,a,b,ml[d]);for(d=0;d<ol.length;d++)e=b,f=ol[d],g=c.g,(k=cl(this,a,f))&&g.push(new Nh(e.b,f,k))};
Wk.prototype.h=function(a,b){var c=this.B,d=this.d.b,e;for(e in d)Ti(e)&&Ui(c,e,d[e]);if("background-host"==this.d.eb)for(e in b)if(e.match(/^background-/)||"writing-mode"==e)c[e]=b[e];if("layout-host"==this.d.eb)for(e in b)e.match(/^background-/)||"writing-mode"==e||(c[e]=b[e]);Tj(a,this.d.xa,null,c);c.content&&(c.content=c.content.wc(new Cj(a,null)));al(this,a.d);for(c=0;c<this.d.children.length;c++)this.d.children[c].f(this).h(a,b);a.pop()};
function ql(a,b){a.g&&(a.D=$k(a,"right",a.l,b)||$k(a,"margin-right",a.l,b)||$k(a,"border-right-width",a.l,b)||$k(a,"padding-right",a.l,b));a.f&&(a.I=$k(a,"top",a.k,b)||$k(a,"margin-top",a.k,b)||$k(a,"border-top-width",a.k,b)||$k(a,"padding-top",a.k,b));for(var c=0;c<a.children.length;c++)ql(a.children[c],b)}function rl(a){Wk.call(this,null,a)}t(rl,Wk);rl.prototype.h=function(a,b){Wk.prototype.h.call(this,a,b);this.children.sort(function(a,b){return b.d.j-a.d.j||a.d.h-b.d.h})};
function Nk(a,b){Wk.call(this,a,b);this.u=this}t(Nk,Wk);Nk.prototype.M=function(a){var b=this.d.e;b.J&&(a=ad(b.d,a,b.J));return a};Nk.prototype.$=function(){};function Pk(a,b){Wk.call(this,a,b);this.u=a.u}t(Pk,Wk);function Rk(a,b){Wk.call(this,a,b);this.u=a.u}t(Rk,Wk);function sl(a,b,c,d){var e=null;c instanceof od&&(e=[c]);c instanceof hd&&(e=c.values);if(e)for(a=a.d.d,c=0;c<e.length;c++)if(e[c]instanceof od){var f=jc(e[c].name,"enabled"),f=new Vc(a,f);d&&(f=new Dc(a,f));b=ad(a,b,f)}return b}
Rk.prototype.M=function(a){var b=this.d.d,c=this.style,d=Vk(b,c.required,b.f)!==b.f;if(d||this.f){var e;e=(e=c["flow-from"])?e.ea(b,b.b):new B(b,"body");e=new Xc(b,"has-content",[e]);a=ad(b,a,e)}a=sl(this,a,c["required-partitions"],!1);a=sl(this,a,c["conflicting-partitions"],!0);d&&(c=(c=this.u.style.enabled)?c.ea(b,null):b.g,c=ad(b,c,a),this.u.style.enabled=new L(c));return a};Rk.prototype.cb=function(a,b,c){w(b.b,"overflow","hidden");Wk.prototype.cb.call(this,a,b,c)};
function tl(a,b,c,d){Ef.call(this,a,b,!1);this.target=c;this.b=d}t(tl,Ff);tl.prototype.Ja=function(a,b,c){bh(this.b,a,b,c,this)};tl.prototype.kc=function(a,b){Gf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};tl.prototype.Db=function(a,b){Gf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};tl.prototype.fb=function(a,b,c){this.target.b[a]=new V(b,c?50331648:67108864)};function ul(a,b,c,d){tl.call(this,a,b,c,d)}t(ul,tl);
function vl(a,b,c,d){tl.call(this,a,b,c,d);c.b.width=new V(ie,0);c.b.height=new V(ie,0)}t(vl,tl);vl.prototype.Lb=function(a,b,c){a=new Qk(this.e,a,b,c,this.target);Df(this.Y,new ul(this.e,this.Y,a,this.b))};vl.prototype.Kb=function(a,b,c){a=new Ok(this.e,a,b,c,this.target);a=new vl(this.e,this.Y,a,this.b);Df(this.Y,a)};function wl(a,b,c,d){tl.call(this,a,b,c,d)}t(wl,tl);wl.prototype.Lb=function(a,b,c){a=new Qk(this.e,a,b,c,this.target);Df(this.Y,new ul(this.e,this.Y,a,this.b))};
wl.prototype.Kb=function(a,b,c){a=new Ok(this.e,a,b,c,this.target);a=new vl(this.e,this.Y,a,this.b);Df(this.Y,a)};var xl={"text-indent":"0px","margin-top":"0px","padding-top":"0px","border-top-width":"0px","border-top-style":"none","border-top-color":"transparent"},yl={"text-indent":"0px","margin-right":"0px","padding-right":"0px","border-right-width":"0px","border-right-style":"none","border-right-color":"transparent"},zl={};
function Al(a){a.addEventListener("load",function(){a.contentWindow.navigator.epubReadingSystem={name:"adapt",version:"0.1",layoutStyle:"paginated",hasFeature:function(a){switch(a){case "mouse-events":return!0}return!1}}},!1)}var Bl=(new DOMParser).parseFromString('<root xmlns="http://www.pyroxy.com/ns/shadow"/>',"text/xml"),Cl="footnote-marker first-5-lines first-4-lines first-3-lines first-2-lines first-line first-letter before  after".split(" ");
function Dl(a){return a.getAttribute("data-adapt-pseudo")||""}function El(a,b,c,d){this.style=b;this.f=a;this.b=c;this.d=d;this.e={}}
El.prototype.g=function(a){var b=Dl(a);this.b&&b&&b.match(/after$/)&&(this.style=this.b.g(this.f,!0),this.b=null);var c=this.style._pseudos[b]||{};if(!this.e[b]){this.e[b]=!0;var d=c.content;d&&(d=d.evaluate(this.d),ti(d)&&d.R(new si(a,this.d)))}if(b.match(/^first-/)&&!c["x-first-pseudo"]){a=1;var e;"first-letter"==b?a=0:null!=(e=b.match(/^first-([0-9]+)-lines$/))&&(a=e[1]-0);c["x-first-pseudo"]=new V(new qd(a),0)}return c};
function Fl(a,b,c,d,e,f,g,k,h,l,n,p,r){this.A=a;this.d=b;this.viewport=c;this.u=c.b;this.k=d;this.D=e;this.Z=f;this.B=g;this.l=k;this.I=h;this.e=l;this.h=n;this.w=p;this.g=r;this.M=this.b=null;this.j=!1;this.W=null;this.aa=0;this.f=null}Fl.prototype.clone=function(){return new Fl(this.A,this.d,this.viewport,this.k,this.D,this.Z,this.B,this.l,this.I,this.e,this.h,this.w,this.g)};
function Gl(a,b,c,d,e,f){var g=M("createRefShadow");a.Z.j.load(b).then(function(k){if(k){var h=wh(k,b);if(h){var l=a.I,n=l.D[k.url];n||(n=l.style.h.b[k.url],n=new sk(k,n.d,n.g,new rc(0,l.u(),l.l(),l.g),l.e,n.j,l.j),l.D[k.url]=n);f=new Zh(d,h,k,e,f,c,n)}}Q(g,f)});return O(g)}
function Hl(a,b,c,d,e,f,g,k){var h=M("createShadows"),l=e.template,n;l instanceof sd?n=Gl(a,l.url,2,b,k,null):n=N(null);n.then(function(l){var n=null;if("http://www.pyroxy.com/ns/shadow"==b.namespaceURI&&"include"==b.localName){var q=b.getAttribute("href"),v=null;q?v=k?k.Z:a.Z:k&&(q="http://www.w3.org/1999/xhtml"==k.Y.namespaceURI?k.Y.getAttribute("href"):k.Y.getAttributeNS("http://www.w3.org/1999/xlink","href"),v=k.Jc?k.Jc.Z:a.Z);q&&(q=sa(q,v.url),n=Gl(a,q,3,b,k,l))}null==n&&(n=N(l));n.then(function(l){var n;
if(n=d._pseudos){for(var p=Bl.createElementNS("http://www.pyroxy.com/ns/shadow","root"),r=p,q=0;q<Cl.length;q++){var v=Cl[q],ob;if(v){if(!n[v])continue;if(!("footnote-marker"!=v||c&&a.j))continue;if(v.match(/^first-/)&&(ob=e.display,!ob||ob===Kd))continue;ob=Bl.createElementNS("http://www.w3.org/1999/xhtml","span");ob.setAttribute("data-adapt-pseudo",v)}else ob=Bl.createElementNS("http://www.pyroxy.com/ns/shadow","content");r.appendChild(ob);v.match(/^first-/)&&(r=ob)}l=new Zh(b,p,null,k,l,2,new El(b,
d,f,g))}Q(h,l)})});return O(h)}function Il(a,b,c){a.M=b;a.j=c}function Jl(a,b,c,d){var e=a.d;c=jk(c,e,a.D,a.j);b=ik(c,e,b);kk(c,d,b,function(b,c){var d=c.evaluate(e,b);if("font-family"==b){var h=a.B;if(d instanceof hd){for(var d=d.values,l=[],n=0;n<d.length;n++){var p=d[n],r=h.b[p.stringValue()];r&&l.push(J(r));l.push(p)}d=new hd(l)}else d=(h=h.b[d.stringValue()])?new hd([J(h),d]):d}return d});return b}
function Kl(a,b){for(var c=a.b.W,d=[],e=a.b.ba,f=-1;c&&1==c.nodeType;){var g=e&&e.root==c;if(!g||2==e.type){var k=(e?e.b:a.k).g(c,!1);d.push(k)}g?(c=e.Y,e=e.Jc):(c=c.parentNode,f++)}c=tc(a.d,"em",0===f);c={"font-size":new V(new K(c,"px"),0)};e=new Yi(c,a.d);for(f=d.length-1;0<=f;--f){var g=d[f],k=[],h;for(h in g)Fi[h]&&k.push(h);k.sort(ne);for(var l=0;l<k.length;l++){var n=k[l];e.b=n;c[n]=g[n].wc(e)}}for(var p in b)Fi[p]||(c[p]=b[p]);return c}
var Ll={a:"a",sub:"sub",sup:"sup",table:"table",tr:"tr",td:"td",th:"th",code:"code",body:"div",p:"p",v:"p",date:"p",emphasis:"em",strong:"strong",style:"span",strikethrough:"del"};function Ml(a,b){b=sa(b,a.Z.url);return a.w[b]||b}
function Nl(a,b){var c=!0,d=M("createElementView"),e=a.W,f=a.b.ba?a.b.ba.b:a.k,g=f.g(e,!1),k={};a.b.parent||(g=Kl(a,g));a.b.g=Jl(a,a.b.g,g,k);k.direction&&(a.b.D=k.direction.toString());var h=k["flow-into"];if(h&&h.toString()!=a.A)return Q(d,!1),O(d);var l=k.display;if(l===Rd)return Q(d,!1),O(d);Hl(a,e,null==a.b.parent,g,k,f,a.d,a.b.ba).then(function(f){a.b.ua=f;var g=a.b.parent&&a.b.parent.k;f=k["float-reference"];var h=k["float"],q=k.clear;if(k.position===vd||k.position===Wd)a.b.k=!0,h=null;g&&
(q=null,h!==Gd&&(h=null));g=h===Od||h===Xd||h===ce||h===Dd||h===Md||h===Ld||h===Bd||h===Ad||h===Gd;h&&(delete k["float"],h===Gd&&(a.j?(g=!1,k.display=zd):k.display=Kd),a.b.k=!0);q&&(q===Jd&&a.b.parent&&a.b.parent.w&&(q=J(a.b.parent.w)),q===Od||q===Xd||q===Cd)&&(delete k.clear,k.display&&k.display!=Kd&&(a.b.w=q.toString()));k.overflow===Hd&&(a.b.k=!0);var v=l===Pd&&k["ua-list-item-count"];g||k["break-inside"]&&k["break-inside"]!==yd?a.b.h++:l===be&&(a.b.h+=10);a.b.d=!g&&!l||l===Kd;a.b.j=g?h.toString():
null;a.b.M=f?f.toString():null;if(!a.b.d){if(f=k["break-after"])a.b.B=f.toString();if(f=k["break-before"])a.b.u=f.toString()}if(f=k["x-first-pseudo"])a.b.f=new $h(a.b.parent?a.b.parent.f:null,f.C);if(f=k["white-space"])switch(f.toString()){case "normal":case "nowrap":a.b.A=0;break;case "pre-line":a.b.A=1;break;case "pre":case "pre-wrap":a.b.A=2}var y=!1,I=null,W=[],P=e.namespaceURI,F=e.localName;if("http://www.w3.org/1999/xhtml"==P)"html"==F||"body"==F||"script"==F||"link"==F||"meta"==F?F="div":"vide_"==
F?F="video":"audi_"==F?F="audio":"object"==F&&(y=!!a.h);else if("http://www.idpf.org/2007/ops"==P)F="span",P="http://www.w3.org/1999/xhtml";else if("http://www.gribuser.ru/xml/fictionbook/2.0"==P){P="http://www.w3.org/1999/xhtml";if("image"==F){if(F="div",(f=e.getAttributeNS("http://www.w3.org/1999/xlink","href"))&&"#"==f.charAt(0)&&(f=wh(a.Z,f)))I=a.createElement(P,"img"),f="data:"+(f.getAttribute("content-type")||"image/jpeg")+";base64,"+f.textContent.replace(/[ \t\n\t]/g,""),W.push(qg(I,f))}else F=
Ll[F];F||(F=a.b.d?"span":"div")}else if("http://www.daisy.org/z3986/2005/ncx/"==P)if(P="http://www.w3.org/1999/xhtml","ncx"==F||"navPoint"==F)F="div";else if("navLabel"==F){if(F="span",h=e.parentNode){f=null;for(h=h.firstChild;h;h=h.nextSibling)if(1==h.nodeType&&(q=h,"http://www.daisy.org/z3986/2005/ncx/"==q.namespaceURI&&"content"==q.localName)){f=q.getAttribute("src");break}f&&(F="a",e=e.ownerDocument.createElementNS(P,"a"),e.setAttribute("href",f))}}else F="span";else"http://www.pyroxy.com/ns/shadow"==
P?(P="http://www.w3.org/1999/xhtml",F=a.b.d?"span":"div"):y=!!a.h;v?b?F="li":(F="div",l=zd,k.display=l):"body"==F||"li"==F?F="div":"q"==F?F="span":"a"==F&&(f=k["hyperlink-processing"])&&"normal"!=f.toString()&&(F="span");k.behavior&&"none"!=k.behavior.toString()&&a.h&&(y=!0);var Ea;y?Ea=a.h(e,a.b.parent?a.b.parent.b:null,k):Ea=N(null);Ea.then(function(f){f?y&&(c="true"==f.getAttribute("data-adapt-process-children")):f=a.createElement(P,F);"a"==F&&f.addEventListener("click",a.e.A,!1);I&&(Ol(a,a.b,
"inner",I),f.appendChild(I));"iframe"==f.localName&&"http://www.w3.org/1999/xhtml"==f.namespaceURI&&Al(f);if("http://www.gribuser.ru/xml/fictionbook/2.0"!=e.namespaceURI||"td"==F){for(var g=e.attributes,h=g.length,l=null,n=0;n<h;n++){var p=g[n],r=p.namespaceURI,q=p.localName,p=p.nodeValue;if(r)if("http://www.w3.org/2000/xmlns/"==r)continue;else"http://www.w3.org/1999/xlink"==r&&"href"==q&&(p=Ml(a,p));else{if(q.match(/^on/))continue;if("style"==q)continue;if("id"==q){Th(a.e,f,p);continue}"src"==q||
"href"==q||"poster"==q?p=Ml(a,p):"srcset"==q&&(p=p.split(",").map(function(b){return Ml(a,b.trim())}).join(","))}if(r){var Ea=zl[r];Ea&&(q=Ea+":"+q)}"src"!=q||r||"img"!=F||"http://www.w3.org/1999/xhtml"!=P?"href"==q&&"image"==F&&"http://www.w3.org/2000/svg"==P&&"http://www.w3.org/1999/xlink"==r?a.e.e.push(qg(f,p)):r?f.setAttributeNS(r,q,p):f.setAttribute(q,p):l=p}l&&(g=qg(f,l),h=k.width,l=k.height,h&&h!==yd&&l&&l!==yd?a.e.e.push(g):W.push(g))}delete k.content;(g=k["list-style-image"])&&g instanceof
sd&&(g=g.url,W.push(qg(new Image,g)));Pl(a,f,k);g=k.widows;h=k.orphans;if(g||h){if(a.b.parent){a.b.l={};for(var Zd in a.b.parent.l)a.b.l[Zd]=a.b.parent.l[Zd]}g instanceof qd&&(a.b.l.widows=g.C);h instanceof qd&&(a.b.l.orphans=h.C)}if(!b&&!a.b.d){Zd=a.b.g?yl:xl;for(var Hk in Zd)w(f,Hk,Zd[Hk])}v&&f.setAttribute("value",k["ua-list-item-count"].stringValue());a.f=f;W.length?pg(W).then(function(){Q(d,c)}):lf().then(function(){Q(d,c)})})});return O(d)}
function Ql(a,b){var c=M("createNodeView"),d,e=!0;1==a.W.nodeType?d=Nl(a,b):(8==a.W.nodeType?a.f=null:a.f=document.createTextNode(a.W.textContent.substr(a.aa||0)),d=N(!0));d.then(function(b){e=b;(a.b.b=a.f)&&(b=a.b.parent?a.b.parent.b:a.M)&&b.appendChild(a.f);Q(c,e)});return O(c)}function Rl(a,b,c){(a.b=b)?(a.W=b.W,a.aa=b.aa):(a.W=null,a.aa=-1);a.f=null;return a.b?Ql(a,c):N(!0)}
function Sl(a){if(null==a.ba||"content"!=a.W.localName||"http://www.pyroxy.com/ns/shadow"!=a.W.namespaceURI)return a;var b=a.ca,c=a.ba,d=a.parent,e,f;c.dd?(f=c.dd,e=c.root,c=c.type,2==c&&(e=e.firstChild)):(f=c.Jc,e=c.Y.firstChild,c=2);var g=a.W.nextSibling;g?(a.W=g,bi(a)):a.na?a=a.na:e?a=null:(a=a.parent.modify(),a.K=!0);if(e)return b=new ai(e,d,b),b.ba=f,b.Ka=c,b.na=a,b;a.ca=b;return a}
function Tl(a){var b=a.ca+1;if(a.K){if(!a.parent)return null;if(3!=a.Ka){var c=a.W.nextSibling;if(c)return a=a.modify(),a.ca=b,a.W=c,bi(a),Sl(a)}if(a.na)return a=a.na.modify(),a.ca=b,a;a=a.parent.modify()}else{if(a.ua&&(c=a.ua.root,2==a.ua.type&&(c=c.firstChild),c))return b=new ai(c,a,b),b.ba=a.ua,b.Ka=a.ua.type,Sl(b);if(c=a.W.firstChild)return Sl(new ai(c,a,b));1!=a.W.nodeType&&(b+=a.W.textContent.length-1-a.aa);a=a.modify()}a.ca=b;a.K=!0;return a}
function Ul(a,b){b=Tl(b);if(!b||b.K)return N(b);var c=M("nextInTree");Rl(a,b,!0).then(function(a){b.b&&a||(b=b.modify(),b.K=!0,b.b||(b.d=!0));Q(c,b)});return O(c)}function Vl(a,b){if(b instanceof hd)for(var c=b.values,d=0;d<c.length;d++)Vl(a,c[d]);else b instanceof sd&&(c=b.url,a.e.e.push(qg(new Image,c)))}
function Pl(a,b,c){var d=c["background-image"];d&&Vl(a,d);for(var e in c)d=c[e],!Mh[e]||"position"==e&&d!==Wd?(d.Ec()&&"rem"===d.ia&&(d=new K(ud(d,a.d),"px")),w(b,e,d.toString())):a.e.g.push(new Nh(b,e,d))}function Ol(a,b,c,d){if(!b.K){var e=(b.ba?b.ba.b:a.k).g(a.W,!1);if(e=e._pseudos)if(e=e[c])c={},b.g=Jl(a,b.g,e,c),b=c.content,ti(b)&&(b.R(new si(d,a.d)),delete c.content),Pl(a,d,c)}}
function Wl(a,b,c){var d=M("peelOff"),e=b.f,f=b.aa,g=b.K;if(0<c)b.b.textContent=b.b.textContent.substr(0,c),f+=c;else if(!g&&b.b&&0==f){var k=b.b.parentNode;k&&k.removeChild(b.b)}for(var h=b.ca+c,l=[];b.f===e;)l.push(b),b=b.parent;var n=l.pop(),p=n.na;mf(function(){for(;0<l.length;){n=l.pop();b=new ai(n.W,b,h);0==l.length&&(b.aa=f,b.K=g);b.Ka=n.Ka;b.ba=n.ba;b.ua=n.ua;b.na=n.na?n.na:p;p=null;var c=Rl(a,b,!1);if(c.ya())return c}return N(!1)}).then(function(){Q(d,b)});return O(d)}
Fl.prototype.createElement=function(a,b){return"http://www.w3.org/1999/xhtml"==a?this.u.createElement(b):this.u.createElementNS(a,b)};function Xl(a,b,c){var d={},e=a.l._pseudos;b=Jl(a,b,a.l,d);if(e&&e.before){var f={},g=a.createElement("http://www.w3.org/1999/xhtml","span");g.setAttribute("data-adapt-pseudo","before");c.appendChild(g);Jl(a,b,e.before,f);delete f.content;Pl(a,g,f)}delete d.content;Pl(a,c,d);return b}
function zi(a,b,c){return b.aa===c.aa&&b.K==c.K&&b.ha.length===c.ha.length&&b.ha.every(function(a,b){var f;f=c.ha[b];if(a.ba)if(f.ba){var g=1===a.da.nodeType?a.da:a.da.parentElement,k=1===f.da.nodeType?f.da:f.da.parentElement;f=a.ba.Y===f.ba.Y&&Dl(g)===Dl(k)}else f=!1;else f=a.da===f.da;return f}.bind(a))}function Yl(a){this.b=a}function Zl(a){return a.getClientRects()}
function $l(a,b,c,d,e){this.f=a;this.fontSize=b;this.b=a.document;this.root=c||this.b.body;b=this.root.firstElementChild;b||(b=this.b.createElement("div"),this.root.appendChild(b));c=b.firstElementChild;c||(c=this.b.createElement("div"),b.appendChild(c));this.e=b;this.d=c;b=(new Yl(a)).b.getComputedStyle(this.root,null);this.width=d||parseFloat(b.width)||a.innerWidth;this.height=e||parseFloat(b.height)||a.innerHeight}
$l.prototype.zoom=function(a,b,c){w(this.e,"width",a*c+"px");w(this.e,"height",b*c+"px");w(this.d,"width",a+"px");w(this.d,"height",b+"px");w(this.d,"transform","scale("+c+")")};Ei("SIMPLE_PROPERTY",function(a){var b=a.name,c=a.value;switch(b){case "page-break-before":case "page-break-after":case "page-break-inside":return{name:b.replace(/^page-/,""),value:c===xd?Vd:c,important:a.important};default:return a}});var am={page:!0,left:!0,right:!0,recto:!0,verso:!0,column:!0,region:!0},bm={avoid:!0,"avoid-page":!0,"avoid-column":!0,"avoid-region":!0};function cm(a,b){return a?b?am[b]?b:am[a]?a:bm[b]?b:bm[a]?a:b:a:b};var dm={img:!0,svg:!0,audio:!0,video:!0};
function em(a,b,c){var d=a.b;if(!d)return NaN;if(1==d.nodeType){if(a.K){var e=d.getBoundingClientRect();if(e.right>=e.left&&e.bottom>=e.top)return c?e.left:e.bottom}return NaN}var e=NaN,f=d.ownerDocument.createRange(),g=d.textContent.length;if(!g)return NaN;a.K&&(b+=g);b>=g&&(b=g-1);f.setStart(d,b);f.setEnd(d,b+1);a=Zl(f);if(b=c){b=document.body;if(null==hb){var k=b.ownerDocument,f=k.createElement("div");f.style.position="absolute";f.style.top="0px";f.style.left="0px";f.style.width="100px";f.style.height=
"100px";f.style.overflow="hidden";f.style.lineHeight="16px";f.style.fontSize="16px";w(f,"writing-mode","vertical-rl");b.appendChild(f);g=k.createTextNode("a a a a a a a a a a a a a a a a");f.appendChild(g);k=k.createRange();k.setStart(g,0);k.setEnd(g,1);hb=50>k.getBoundingClientRect().left;b.removeChild(f)}b=hb}if(b){b=d.ownerDocument.createRange();b.setStart(d,0);b.setEnd(d,d.textContent.length);d=Zl(b);b=[];for(f=0;f<a.length;f++){g=a[f];for(k=0;k<d.length;k++){var h=d[k];if(g.top>=h.top&&g.bottom<=
h.bottom&&1>Math.abs(g.right-h.right)){b.push({top:g.top,left:h.left,bottom:h.bottom,right:h.right});break}}k==d.length&&(u.b("Could not fix character box"),b.push(g))}a=b}for(b=d=0;b<a.length;b++)f=a[b],g=c?f.bottom-f.top:f.right-f.left,f.right>f.left&&f.bottom>f.top&&(isNaN(e)||g>d)&&(e=c?f.left:f.bottom,d=g);return e}function fm(a,b){this.e=a;this.f=b}fm.prototype.d=function(a,b){return b<this.f?null:gm(a,this,0<b)};fm.prototype.b=function(){return this.f};
function hm(a,b,c,d){this.position=a;this.f=b;this.g=c;this.e=d}hm.prototype.d=function(a,b){var c;b<this.b()?c=null:(a.e=this.e,c=this.position);return c};hm.prototype.b=function(){return(bm[this.f]?1:0)+(this.g?3:0)+(this.position.parent?this.position.parent.h:0)};function im(a,b,c){this.ca=a;this.d=b;this.b=c}
function jm(a){for(var b=1;b<a.length;b++){var c=a[b-1],d=a[b];c===d?u.b("validateCheckPoints: duplicate entry"):c.ca>=d.ca?u.b("validateCheckPoints: incorrect boxOffset"):c.W==d.W&&(d.K?c.K&&u.b("validateCheckPoints: duplicate after points"):c.K?u.b("validateCheckPoints: inconsistent after point"):d.ca-c.ca!=d.aa-c.aa&&u.b("validateCheckPoints: boxOffset inconsistent with offsetInNode"))}}
function km(a,b,c){ki.call(this,a);this.Qc=a.lastChild;this.h=b;this.mc=c;this.vd=a.ownerDocument;this.nc=!1;this.ma=this.jb=this.Oa=this.Sc=0;this.Xa=this.Qb=this.l=this.f=null;this.Rc=!1;this.M=this.g=this.u=null;this.gd=!0;this.qc=this.oc=0}t(km,ki);km.prototype.clone=function(){var a=new km(this.b,this.h,this.mc);pi(a,this);a.Qc=this.Qc;a.nc=this.nc;a.l=this.l?this.l.clone():null;a.Qb=this.Qb.concat();return a};
function lm(a,b){var c=b.getBoundingClientRect(),d=(a.d?a.jb:a.Sc)-a.f.V,e=(a.d?a.Sc:a.Oa)-a.f.S;return{left:c.left-d,top:c.top-e,right:c.right-d,bottom:c.bottom-e}}function mm(a,b){return a.d?b<a.ma:b>a.ma}function nm(a,b,c){var d=new ai(b.da,c,0);d.Ka=b.Ka;d.ba=b.ba;d.ua=b.ua;d.na=b.na?nm(a,b.na,di(c)):null;return d}
function om(a,b){var c=M("openAllViews"),d=b.ha;Il(a.h,a.b,a.nc);var e=d.length-1,f=null;mf(function(){for(;0<=e;){f=nm(a,d[e],f);if(0==e&&(f.aa=b.aa,f.K=b.K,f.K))break;var c=Rl(a.h,f,0==e&&0==f.aa);e--;if(c.ya())return c}return N(!1)}).then(function(){Q(c,f)});return O(c)}var pm=/^[^A-Za-z0-9_\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]*([A-Za-z0-9_\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527][^A-Za-z0-9_\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]*)?/;
function qm(a,b){if(b.f&&b.d&&!b.K&&0==b.f.count&&1!=b.b.nodeType){var c=b.b.textContent.match(pm);return Wl(a.h,b,c[0].length)}return N(b)}function rm(a,b,c){var d=M("buildViewToNextBlockEdge");nf(function(d){b.b&&c.push(di(b));qm(a,b).then(function(f){f!==b&&(b=f,c.push(di(b)));Ul(a.h,b).then(function(c){(b=c)?b.j&&!a.d?sm(a,b).then(function(c){b=c;!b||b.e||0<a.h.g.b.length?R(d):pf(d)}):b.d?pf(d):R(d):R(d)})})}).then(function(){Q(d,b)});return O(d)}
function tm(a,b){if(!b.b)return N(b);var c=b.W,d=M("buildDeepElementView");nf(function(d){qm(a,b).then(function(f){if(f!==b){for(var g=f;g&&g.W!=c;)g=g.parent;if(null==g){b=f;R(d);return}}Ul(a.h,f).then(function(a){(b=a)&&b.W!=c?pf(d):R(d)})})}).then(function(){Q(d,b)});return O(d)}function um(a,b,c,d,e){var f=a.vd.createElement("div");a.d?(w(f,"height",d+"px"),w(f,"width",e+"px")):(w(f,"width",d+"px"),w(f,"height",e+"px"));w(f,"float",c);w(f,"clear",c);a.b.insertBefore(f,b);return f}
function vm(a){for(var b=a.b.firstChild;b;){var c=b.nextSibling;if(1==b.nodeType){var d=b.style.cssFloat;if("left"==d||"right"==d)a.b.removeChild(b);else break}b=c}}function wm(a){for(var b=a.b.firstChild,c=a.Xa,d=a.d?a.f.S:a.f.V,e=a.d?a.f.P:a.f.T,f=0;f<c.length;f++){var g=c[f],k=g.P-g.S;g.left=um(a,b,"left",g.V-d,k);g.right=um(a,b,"right",e-g.T,k)}}
function xm(a,b,c,d,e){var f;if(b&&b.K&&!b.d&&(f=em(b,0,a.d),!isNaN(f)))return f;b=c[d];for(e-=b.ca;;){f=em(b,e,a.d);if(!isNaN(f))return f;if(0<e)e--;else{d--;if(0>d)return a.Oa;b=c[d];1!=b.b.nodeType&&(e=b.b.textContent.length)}}}function ym(a){return"number"==typeof a?a:(a=a.match(/^(-?[0-9]*(\.[0-9]*)?)px$/))?parseFloat(a[0]):0}
function zm(a,b){var c=a.mc.b.getComputedStyle(b,null),d=new qe;c&&(d.left=ym(c.marginLeft),d.top=ym(c.marginTop),d.right=ym(c.marginRight),d.bottom=ym(c.marginBottom));return d}
function Am(a,b,c){if(a=a.mc.b.getComputedStyle(b,null))c.marginLeft=ym(a.marginLeft),c.$=ym(a.borderLeftWidth),c.j=ym(a.paddingLeft),c.marginTop=ym(a.marginTop),c.fa=ym(a.borderTopWidth),c.k=ym(a.paddingTop),c.marginRight=ym(a.marginRight),c.Ea=ym(a.borderRightWidth),c.D=ym(a.paddingRight),c.marginBottom=ym(a.marginBottom),c.va=ym(a.borderBottomWidth),c.w=ym(a.paddingBottom)}function Bm(a,b,c){b=new im(b,c,c);a.g?a.g.push(b):a.g=[b]}
function Cm(a,b,c,d){if(a.g&&a.g[a.g.length-1].b)return Bm(a,b,c),N(!0);d+=40*(a.d?-1:1);var e=a.l,f=!e;if(f){var g=a.b.ownerDocument.createElement("div");w(g,"position","absolute");var k=a.h.clone(),e=new km(g,k,a.mc);a.l=e;e.d=Xl(a.h,a.d,g);e.nc=!0;a.d?(e.left=0,w(e.b,"width","2em")):(e.top=a.jb,w(e.b,"height","2em"))}a.b.appendChild(e.b);Am(a,e.b,e);g=(a.d?-1:1)*(d-a.Oa);a.d?e.height=a.f.P-a.f.S-li(e)-mi(e):e.width=a.f.T-a.f.V-ni(e)-oi(e);d=(a.d?-1:1)*(a.jb-d)-(a.d?ni(e)-oi(e):li(e)+mi(e));if(f&&
18>d)return a.b.removeChild(e.b),a.l=null,Bm(a,b,c),N(!0);if(!a.d&&e.top<g)return a.b.removeChild(e.b),Bm(a,b,c),N(!0);var h=M("layoutFootnoteInner");a.d?ri(e,0,d):qi(e,g,d);e.A=a.A+a.left+ni(a);e.B=a.B+a.top+li(a);e.I=a.I;var l=new gi(c);f?(Dm(e),f=N(!0)):0==e.I.length?(Em(e),f=N(!0)):f=Fm(e);f.then(function(){Gm(e,l).then(function(d){a.d?(a.ma=a.jb+(e.e+ni(e)+oi(e)),ri(e,0,e.e)):(a.ma=a.jb-(e.e+li(e)+mi(e)),qi(e,a.ma-a.Oa,e.e));var f;!a.d&&0<e.I.length?f=Fm(e):f=N(d);f.then(function(d){d=new im(b,
c,d?d.Qa:null);a.g?a.g.push(d):a.g=[d];Q(h,!0)})})});return O(h)}
function Hm(a,b){var c=M("layoutFootnote"),d=b.b;d.setAttribute("style","");w(d,"display","inline-block");d.textContent="M";var e=d.getBoundingClientRect(),f=a.d?e.left:e.bottom;d.textContent="";Ol(a.h,b,"footnote-call",d);d.textContent||d.parentNode.removeChild(d);d={ha:[{da:b.W,Ka:0,ba:b.ba,ua:null,na:null}],aa:0,K:!1};e=b.ca;b=b.modify();b.K=!0;Cm(a,e,d,f).then(function(){a.l&&a.l.b.parentNode&&a.b.removeChild(a.l.b);mm(a,f)&&0!=a.u.length&&(b.e=!0);Q(c,b)});return O(c)}
function Im(a,b){var c=M("layoutFloat"),d=b.b,e=b.j,f=b.M,g=b.parent?b.parent.D:"ltr",k=a.h.g,h=b.b.parentNode;"page"===f?xi(k,d,e):(w(d,"float","none"),w(d,"position","absolute"),w(d,"left","auto"),w(d,"right","auto"),w(d,"top","auto"));tm(a,b).then(function(l){var n=lm(a,d),p=zm(a,d),n=new oe(n.left-p.left,n.top-p.top,n.right+p.right,n.bottom+p.bottom);if("page"===f)yi(k,b,a.h)?(n=h.ownerDocument.createElement("span"),w(n,"width","0"),w(n,"height","0"),h.appendChild(n),l.b=n,Q(c,l)):Ai(k,b,n).then(function(){Q(c,
null)});else{e=ui(e,a.d,g);for(var p=a.d?a.f.S:a.f.V,r=a.d?a.f.P:a.f.T,q=b.parent;q&&q.d;)q=q.parent;if(q){var v=q.b.ownerDocument.createElement("div");v.style.left="0px";v.style.top="0px";a.d?(v.style.bottom="0px",v.style.width="1px"):(v.style.right="0px",v.style.height="1px");q.b.appendChild(v);var y=lm(a,v),p=Math.max(a.d?y.top:y.left,p),r=Math.min(a.d?y.bottom:y.right,r);q.b.removeChild(v);q=a.d?n.P-n.S:n.T-n.V;"left"==e?r=Math.max(r,p+q):p=Math.min(p,r-q)}p=new oe(p,(a.d?-1:1)*a.f.S,r,(a.d?-1:
1)*a.f.P);r=n;a.d&&(r=Ge(n));Le(p,a.Xa,r,e);a.d&&(n=new oe(-r.P,r.V,-r.S,r.T));w(d,"left",n.V-a.f.V+a.j+"px");w(d,"top",n.S-a.f.S+a.k+"px");n=a.d?n.V:n.P;mm(a,n)&&0!=a.u.length?(b=b.modify(),b.e=!0,Q(c,b)):(vm(a),p=a.d?Ge(a.f):a.f,Me(p,a.Xa,r,e),wm(a),"left"==e?a.oc=n:a.qc=n,Jm(a,n),Q(c,l))}});return O(c)}
function Km(a,b){for(var c=a.b,d="";c&&b&&!d&&(1!=c.nodeType||(d=c.style.textAlign,b));c=c.parentNode);if(!b||"justify"==d){var c=a.b,e=c.ownerDocument,d=e.createElement("span");d.style.visibility="hidden";d.textContent=" ########################";d.setAttribute("data-adapt-spec","1");var f=b&&(a.K||1!=c.nodeType)?c.nextSibling:c;if(c=c.parentNode)c.insertBefore(d,f),b||(e=e.createElement("div"),c.insertBefore(e,f),d.style.lineHeight="80px",e.style.marginTop="-80px",e.style.height="0px",e.setAttribute("data-adapt-spec",
"1"))}}function Lm(a,b,c,d){var e=M("processLineStyling");jm(d);var f=d.concat([]);d.splice(0,d.length);var g=0,k=b.f;0==k.count&&(k=k.Fd);nf(function(d){if(k){var e=Mm(a,f),n=k.count-g;if(e.length<=n)R(d);else{var p=Nm(a,f,e[n-1]);Om(a,p,!1,!1).then(function(){g+=n;Wl(a.h,p,0).then(function(e){b=e;Km(b,!1);k=b.f;f=[];rm(a,b,f).then(function(b){c=b;0<a.h.g.b.length?R(d):pf(d)})})})}}else R(d)}).then(function(){Array.prototype.push.apply(d,f);jm(d);Q(e,c)});return O(e)}
function Pm(a,b){for(var c=0,d=0,e=b.length-1;0<=e;e--){var f=b[e];if(!f.K||!f.b||1!=f.b.nodeType)break;f=zm(a,f.b);f=a.d?-f.left:f.bottom;0<f?c=Math.max(c,f):d=Math.min(d,f)}return c-d}
function Qm(a,b){var c=M("layoutBreakableBlock"),d=[];rm(a,b,d).then(function(e){if(0<a.h.g.b.length)Q(c,e);else{var f=d.length-1;if(0>f)Q(c,e);else{var f=xm(a,e,d,f,d[f].ca),g=mm(a,f);null==e&&(f+=Pm(a,d));Jm(a,f);var k;b.f?k=Lm(a,b,e,d):k=N(e);k.then(function(b){0<d.length&&(a.u.push(new fm(d,d[0].h)),g&&(2!=d.length&&0<a.u.length||d[0].W!=d[1].W||!dm[d[0].W.localName])&&b&&(b=b.modify(),b.e=!0));Q(c,b)})}}});return O(c)}
function Nm(a,b,c){jm(b);for(var d=0,e=b[0].ca,f=d,g=b.length-1,k=b[g].ca,h;e<k;){h=e+Math.ceil((k-e)/2);for(var f=d,l=g;f<l;){var n=f+Math.ceil((l-f)/2);b[n].ca>h?l=n-1:f=n}l=xm(a,null,b,f,h);if(a.d?l<c:l>c){for(k=h-1;b[f].ca==h;)f--;g=f}else Jm(a,l),e=h,d=f}a=b[f];b=a.b;1!=b.nodeType&&(a.K?a.aa=b.length:(e-=a.ca,c=b.data,173==c.charCodeAt(e)?(b.replaceData(e,c.length-e,"-"),e++):(d=c.charAt(e),e++,f=c.charAt(e),b.replaceData(e,c.length-e,Ua(d)&&Ua(f)?"-":"")),0<e&&(a=a.modify(),a.aa+=e,a.u=null)));
return a}
function Mm(a,b){for(var c=[],d=b[0].b,e=b[b.length-1].b,f=[],g=d.ownerDocument.createRange(),k=!1,h=null,l=!1,n=!0;n;){var p=!0;do{var r=null;d==e&&(n=!1);1!=d.nodeType?(l||(g.setStartBefore(d),l=!0),h=d):k?k=!1:d.getAttribute("data-adapt-spec")?p=!l:r=d.firstChild;r||(r=d.nextSibling,r||(k=!0,r=d.parentNode));d=r}while(p&&n);if(l){g.setEndAfter(h);l=Zl(g);for(p=0;p<l.length;p++)f.push(l[p]);l=!1}}f.sort(a.d?Yh:Xh);h=d=k=g=e=0;for(n=a.d?-1:1;;){if(h<f.length&&(l=f[h],p=1,0<d&&(p=Math.max(a.d?l.right-
l.left:l.bottom-l.top,1),p=n*(a.d?l.right:l.top)<n*e?n*((a.d?l.left:l.bottom)-e)/p:n*(a.d?l.left:l.bottom)>n*g?n*(g-(a.d?l.right:l.top))/p:1),0==d||.6<=p||.2<=p&&(a.d?l.top:l.left)>=k-1)){k=a.d?l.bottom:l.right;a.d?(e=0==d?l.right:Math.max(e,l.right),g=0==d?l.left:Math.min(g,l.left)):(e=0==d?l.top:Math.min(e,l.top),g=0==d?l.bottom:Math.max(g,l.bottom));d++;h++;continue}0<d&&(c.push(g),d=0);if(h>=f.length)break}c.sort(Ya);a.d&&c.reverse();return c}
function Rm(a,b){if(!a.g)return N(!0);for(var c=!1,d=a.g.length-1;0<=d;--d){var e=a.g[d];if(e.ca<=b)break;a.g.pop();e.b!==e.d&&(c=!0)}if(!c)return N(!0);var f=M("clearFootnotes"),g=a.e+a.Oa,k=a.g;a.l=null;a.g=null;var h=0;mf(function(){for(;h<k.length;){var b=k[h++],b=Cm(a,b.ca,b.d,g);if(b.ya())return b}return N(!1)}).then(function(){Q(f,!0)});return O(f)}
function gm(a,b,c){var d=b.e,e;if(c)e=c=1;else{for(e=d[0];e.parent&&e.d;)e=e.parent;c=Math.max((e.l.widows||2)-0,1);e=Math.max((e.l.orphans||2)-0,1)}var f=Mm(a,d),g=a.ma,d=Xa(f.length,function(b){return a.d?f[b]<g:f[b]>g}),d=Math.min(f.length-c,d);if(d<e)return null;g=f[d-1];if(b=Nm(a,b.e,g))a.e=(a.d?-1:1)*(g-a.Oa);return b}
function Om(a,b,c,d){var e=b;c=c||null!=b.b&&1==b.b.nodeType&&!b.K;do{var f=e.b.parentNode;if(!f)break;var g=f,k=e.b;if(g)for(var h=void 0;(h=g.lastChild)!=k;)g.removeChild(h);c&&(f.removeChild(e.b),c=!1);e=e.parent}while(e);d&&Km(b,!0);return Rm(a,b.ca)}
function Sm(a,b,c){var d=M("findAcceptableBreak"),e=null,f=0,g=0;do for(var f=g,g=Number.MAX_VALUE,k=a.u.length-1;0<=k&&!e;--k){var e=a.u[k].d(a,f),h=a.u[k].b();h>f&&(g=Math.min(g,h))}while(g>f&&!e);var l=!1;if(!e){u.b("Could not find any page breaks?!!");if(a.gd)return Tm(a,b).then(function(b){b?(b=b.modify(),b.e=!1,Om(a,b,l,!0).then(function(){Q(d,b)})):Q(d,b)}),O(d);e=c;l=!0}Om(a,e,l,!0).then(function(){Q(d,e)});return O(d)}
function Um(a){a=a.toString();return""==a||"auto"==a||!!a.match(/^0+(.0*)?[^0-9]/)}function Vm(a,b,c,d,e){if(!b)return!1;var f=em(b,0,a.d),g=mm(a,f);c&&(f+=Pm(a,c));Jm(a,f);if(d||!g)b=new hm(di(b),e,g,a.e),a.u.push(b);return g}
function Wm(a,b){if(b.b.parentNode){var c=zm(a,b.b),d=b.b.ownerDocument.createElement("div");a.d?(d.style.bottom="0px",d.style.width="1px",d.style.marginRight=c.right+"px"):(d.style.right="0px",d.style.height="1px",d.style.marginTop=c.top+"px");b.b.parentNode.insertBefore(d,b.b);var e=d.getBoundingClientRect(),e=a.d?e.right:e.top,f=a.d?-1:1,g;switch(b.w){case "left":g=a.oc;break;case "right":g=a.qc;break;default:g=f*Math.max(a.qc*f,a.oc*f)}e*f>=g*f?b.b.parentNode.removeChild(d):(e=Math.max(1,(g-e)*
f),a.d?d.style.width=e+"px":d.style.height=e+"px",e=d.getBoundingClientRect(),e=a.d?e.left:e.bottom,a.d?(g=e+c.right-g,0<g==0<=c.right&&(g+=c.right),d.style.marginLeft=g+"px"):(g-=e+c.top,0<g==0<=c.top&&(g+=c.top),d.style.marginBottom=g+"px"))}}
function Xm(a,b,c){var d=M("skipEdges"),e=null,f=null,g=[];nf(function(d){for(;b;){do if(b.b){if(b.d&&1!=b.b.nodeType){if(Uh(b.b,b.A))break;if(!b.K){Vm(a,f,null,!0,e)?(b=(f||b).modify(),b.e=!0):(b=b.modify(),b.u=e);R(d);return}}if(!b.K&&(b.w&&Wm(a,b),b.j)){Vm(a,f,null,!0,e)&&(b=(f||b).modify(),b.e=!0);R(d);return}if(1==b.b.nodeType){var h=b.b.style;if(b.K){if(f=di(b),g.push(f),e=cm(e,b.B),h&&(!Um(h.paddingBottom)||!Um(h.borderBottomWidth))){if(Vm(a,f,null,!0,e)){b=(f||b).modify();b.e=!0;R(d);return}g=
[f];f=e=null}}else{e=cm(e,b.u);if(!c&&am[e]){R(d);a.M=e;return}if(dm[b.b.localName]){Vm(a,f,null,!0,e)&&(b=(f||b).modify(),b.e=!0);R(d);return}if(h&&(!Um(h.paddingTop)||!Um(h.borderTopWidth))){if(Vm(a,f,null,!0,e)){b=(f||b).modify();b.e=!0;R(d);return}f=e=null;g=[]}}}}while(0);h=Ul(a.h,b);if(h.ya()){h.then(function(a){b=a;pf(d)});return}b=h.Vb()}0!=a.u.length&&Vm(a,f,g,!1,e)&&f&&(b=f.modify(),b.e=!0);R(d)}).then(function(){Q(d,b)});return O(d)}
function Tm(a,b){var c=b,d=M("skipEdges"),e=null;nf(function(d){for(;b;){do if(b.b){if(b.d&&1!=b.b.nodeType){if(Uh(b.b,b.A))break;if(!b.K){R(d);return}}if(!b.K&&b.j){R(d);return}if(1==b.b.nodeType){var g=b.b.style;if(b.K)e=cm(e,b.B);else{e=cm(e,b.u);if(am[e]){R(d);a.M=e;return}if(dm[b.b.localName]){R(d);return}if(g&&(!Um(g.paddingTop)||!Um(g.borderTopWidth))){R(d);return}}}}while(0);g=Ul(a.h,b);if(g.ya()){g.then(function(a){b=a;pf(d)});return}b=g.Vb()}c=null;R(d)}).then(function(){Q(d,c)});return O(d)}
function sm(a,b){return"footnote"==b.j?Hm(a,b):Im(a,b)}function Ym(a,b,c){var d=M("layoutNext");Xm(a,b,c).then(function(c){b=c;if(!b||a.M||b.e)Q(d,b);else if(b.j)sm(a,b).oa(d);else{a:{if(!b.K)switch(b.W.namespaceURI){case "http://www.w3.org/2000/svg":c=!1;break a}c=!0}c?Qm(a,b).oa(d):tm(a,b).oa(d)}});return O(d)}
function Em(a){var b=a.b.ownerDocument.createElement("div");b.style.position="absolute";b.style.top=a.k+"px";b.style.right=a.D+"px";b.style.bottom=a.w+"px";b.style.left=a.j+"px";a.b.appendChild(b);var c=b.getBoundingClientRect();a.b.removeChild(b);var b=a.A+a.left+ni(a),d=a.B+a.top+li(a);a.f=new oe(b,d,b+a.width,d+a.height);a.Sc=c?a.d?c.top:c.left:0;a.Oa=c?a.d?c.right:c.top:0;a.jb=c?a.d?c.left:c.bottom:0;a.oc=a.Oa;a.qc=a.Oa;a.ma=a.jb;c=a.f;b=a.A+a.left+ni(a);d=a.B+a.top+li(a);b=a.Rb?we(a.Rb,b,d):
ye(b,d,b+a.width,d+a.height);a.Xa=Ie(c,[b],a.I,a.Fa,a.d);wm(a);a.g=null}function Dm(a){a.Qb=[];w(a.b,"width",a.width+"px");w(a.b,"height",a.height+"px");Em(a);a.e=0;a.Rc=!1;a.M=null}function Jm(a,b){a.e=Math.max((a.d?-1:1)*(b-a.Oa),a.e)}function Zm(a,b){var c=b.b;if(!c)return N(!0);var d=M("layoutOverflownFootnotes"),e=0;mf(function(){for(;e<c.length;){var b=c[e++],b=Cm(a,0,b,a.Oa);if(b.ya())return b}return N(!1)}).then(function(){Q(d,!0)});return O(d)}
function Gm(a,b){a.Qb.push(b);if(a.Rc)return N(b);var c=M("layout");Zm(a,b).then(function(){om(a,b.Qa).then(function(b){var e=b,f=!0;a.u=[];nf(function(c){for(;b;){var k=!0;Ym(a,b,f).then(function(h){f=!1;b=h;0<a.h.g.b.length?R(c):a.M?R(c):b&&b.e?Sm(a,b,e).then(function(a){b=a;R(c)}):k?k=!1:pf(c)});if(k){k=!1;return}}R(c)}).then(function(){var e=a.l;e&&(a.b.appendChild(e.b),a.d?a.e=this.Oa-this.jb:a.e=e.top+li(e)+e.e+mi(e));if(b)if(0<a.h.g.b.length)Q(c,null);else{a.Rc=!0;e=new gi(fi(b));if(a.g){for(var f=
[],h=0;h<a.g.length;h++){var l=a.g[h].b;l&&f.push(l)}e.b=f.length?f:null}Q(c,e)}else Q(c,null)})})});return O(c)}function Fm(a){for(var b=a.Qb,c=a.b.lastChild;c!=a.Qc;){var d=c.previousSibling;a.b.isSameNode(c.parentNode)&&Dl(c)||a.b.removeChild(c);c=d}vm(a);Dm(a);var e=M("redoLayout"),f=0,g=null;nf(function(c){if(f<b.length){var d=b[f++];Gm(a,d).then(function(a){a?(g=a,R(c)):pf(c)})}else R(c)}).then(function(){Q(e,g)});return O(e)};function $m(a,b){this.e(a,"end",b)}function an(a,b){this.e(a,"start",b)}function bn(a,b,c){c||(c=this.g.now());var d=this.f[a];d||(d=this.f[a]=[]);var e;for(a=d.length-1;0<=a&&(!(e=d[a])||e[b]);a--)e=null;e||(e={},d.push(e));e[b]=c}function cn(){}function dn(a){this.g=a;this.f={};this.registerEndTiming=this.d=this.registerStartTiming=this.b=this.e=cn}
dn.prototype.h=function(){var a=this.f,b="";Object.keys(a).forEach(function(c){for(var d=a[c],e=d.length,f=0;f<e;f++){var g=d[f];b+=c;1<e&&(b+="("+f+")");b+=" => start: "+g.start+", end: "+g.end+", duration: "+(g.end-g.start)+"\n"}});u.f(b)};dn.prototype.j=function(){this.registerEndTiming=this.d=this.registerStartTiming=this.b=this.e=cn};dn.prototype.k=function(){this.e=bn;this.registerStartTiming=this.b=an;this.registerEndTiming=this.d=$m};
var en={now:Date.now},fn,gn=fn=new dn(window&&window.performance||en);bn.call(gn,"load_vivliostyle","start",void 0);ca("vivliostyle.profile.profiler",gn);dn.prototype.printTimings=dn.prototype.h;dn.prototype.disable=dn.prototype.j;dn.prototype.enable=dn.prototype.k;function hn(a,b,c){function d(c){return a.b.getComputedStyle(b,null).getPropertyValue(c)}function e(){w(b,"display","block");w(b,"position","static");return d(W)}function f(){w(b,"display","inline-block");w(v,W,"99999999px");var a=d(W);w(v,W,"");return a}function g(){w(b,"display","inline-block");w(v,W,"0");var a=d(W);w(v,W,"");return a}function k(){var a=e(),b=g(),c=parseFloat(a);if(c<=parseFloat(b))return b;b=f();return c<=parseFloat(b)?a:b}function h(){throw Error("Getting fill-available block size is not implemented");
}var l=b.style.display,n=b.style.position,p=b.style.width,r=b.style.height,q=b.parentNode,v=b.ownerDocument.createElement("div");w(v,"position",n);q.insertBefore(v,b);v.appendChild(b);w(b,"width","auto");w(b,"height","auto");var y=d(Na["writing-mode"])||d("writing-mode"),I="vertical-rl"===y||"tb-rl"===y||"vertical-lr"===y||"tb-lr"===y,W=I?"height":"width",P=I?"width":"height",F={};c.forEach(function(a){var c;switch(a){case "fill-available inline size":c=e();break;case "max-content inline size":c=
f();break;case "min-content inline size":c=g();break;case "fit-content inline size":c=k();break;case "fill-available block size":c=h();break;case "max-content block size":case "min-content block size":case "fit-content block size":c=d(P);break;case "fill-available width":c=I?h():e();break;case "fill-available height":c=I?e():h();break;case "max-content width":c=I?d(P):f();break;case "max-content height":c=I?f():d(P);break;case "min-content width":c=I?d(P):g();break;case "min-content height":c=I?g():
d(P);break;case "fit-content width":c=I?d(P):k();break;case "fit-content height":c=I?k():d(P)}F[a]=parseFloat(c);w(b,"position",n);w(b,"display",l)});w(b,"width",p);w(b,"height",r);q.insertBefore(b,v);q.removeChild(v);return F};function jn(a){var b=a["writing-mode"],b=b&&b.value;a=(a=a.direction)&&a.value;return b===ee||b!==fe&&a!==ae?"ltr":"rtl"}
var kn={a5:{width:new K(148,"mm"),height:new K(210,"mm")},a4:{width:new K(210,"mm"),height:new K(297,"mm")},a3:{width:new K(297,"mm"),height:new K(420,"mm")},b5:{width:new K(176,"mm"),height:new K(250,"mm")},b4:{width:new K(250,"mm"),height:new K(353,"mm")},"jis-b5":{width:new K(182,"mm"),height:new K(257,"mm")},"jis-b4":{width:new K(257,"mm"),height:new K(364,"mm")},letter:{width:new K(8.5,"in"),height:new K(11,"in")},legal:{width:new K(8.5,"in"),height:new K(14,"in")},ledger:{width:new K(11,"in"),
height:new K(17,"in")}},ln={width:je,height:ke};function mn(a){if((a=a.size)&&a.value!==yd){var b=a.value;b.$c()?(a=b.values[0],b=b.values[1]):(a=b,b=null);return a.Ec()?{width:a,height:b||a}:(a=kn[a.name.toLowerCase()])?b&&b===Nd?{width:a.height,height:a.width}:{width:a.width,height:a.height}:ln}return ln}
var nn=function(){var a={width:!0,height:!0,"block-size":!0,"inline-size":!0,margin:!0,padding:!0,border:!0,outline:!0,"outline-width":!0,"outline-style":!0,"outline-color":!0};"left right top bottom before after start end block-start block-end inline-start inline-end".split(" ").forEach(function(b){a["margin-"+b]=!0;a["padding-"+b]=!0;a["border-"+b+"-width"]=!0;a["border-"+b+"-style"]=!0;a["border-"+b+"-color"]=!0});return a}(),on={"top-left-corner":{N:1,ta:!0,qa:!1,ra:!0,sa:!0,ga:null},"top-left":{N:2,
ta:!0,qa:!1,ra:!1,sa:!1,ga:"start"},"top-center":{N:3,ta:!0,qa:!1,ra:!1,sa:!1,ga:"center"},"top-right":{N:4,ta:!0,qa:!1,ra:!1,sa:!1,ga:"end"},"top-right-corner":{N:5,ta:!0,qa:!1,ra:!1,sa:!0,ga:null},"right-top":{N:6,ta:!1,qa:!1,ra:!1,sa:!0,ga:"start"},"right-middle":{N:7,ta:!1,qa:!1,ra:!1,sa:!0,ga:"center"},"right-bottom":{N:8,ta:!1,qa:!1,ra:!1,sa:!0,ga:"end"},"bottom-right-corner":{N:9,ta:!1,qa:!0,ra:!1,sa:!0,ga:null},"bottom-right":{N:10,ta:!1,qa:!0,ra:!1,sa:!1,ga:"end"},"bottom-center":{N:11,ta:!1,
qa:!0,ra:!1,sa:!1,ga:"center"},"bottom-left":{N:12,ta:!1,qa:!0,ra:!1,sa:!1,ga:"start"},"bottom-left-corner":{N:13,ta:!1,qa:!0,ra:!0,sa:!1,ga:null},"left-bottom":{N:14,ta:!1,qa:!1,ra:!0,sa:!1,ga:"end"},"left-middle":{N:15,ta:!1,qa:!1,ra:!0,sa:!1,ga:"center"},"left-top":{N:16,ta:!1,qa:!1,ra:!0,sa:!1,ga:"start"}},pn=Object.keys(on).sort(function(a,b){return on[a].N-on[b].N});
function qn(a,b,c){Mk.call(this,a,null,"vivliostyle-page-rule-master",[],b,null,0);a=mn(c);new rn(this.d,this,c,a);this.u={};sn(this,c);this.b.position=new V(Wd,0);this.b.width=new V(a.width,0);this.b.height=new V(a.height,0);for(var d in c)nn[d]||"background-clip"===d||(this.b[d]=c[d])}t(qn,Mk);function sn(a,b){var c=b._marginBoxes;c&&pn.forEach(function(d){c[d]&&(a.u[d]=new tn(a.d,a,d,b))})}qn.prototype.f=function(a){return new un(a,this)};
function rn(a,b,c,d){Qk.call(this,a,null,null,[],b);this.w=d;this.b["z-index"]=new V(new qd(0),0);this.b["flow-from"]=new V(J("body"),0);this.b.position=new V(vd,0);this.b.overflow=new V(ge,0);for(var e in nn)nn.hasOwnProperty(e)&&(this.b[e]=c[e])}t(rn,Qk);rn.prototype.f=function(a){return new vn(a,this)};
function tn(a,b,c,d){Qk.call(this,a,null,null,[],b);this.l=c;a=d._marginBoxes[this.l];for(var e in d)if(b=d[e],c=a[e],Fi[e]||c&&c.value===Jd)this.b[e]=b;for(e in a)Object.prototype.hasOwnProperty.call(a,e)&&(b=a[e])&&b.value!==Jd&&(this.b[e]=b)}t(tn,Qk);tn.prototype.f=function(a){return new wn(a,this)};function un(a,b){Nk.call(this,a,b);this.j=null;this.pa={}}t(un,Nk);
un.prototype.h=function(a,b){var c=this.B,d;for(d in b)if(Object.prototype.hasOwnProperty.call(b,d))switch(d){case "writing-mode":case "direction":c[d]=b[d]}Nk.prototype.h.call(this,a,b)};un.prototype.Bc=function(){var a=this.style;a.left=le;a["margin-left"]=le;a["border-left-width"]=le;a["padding-left"]=le;a["padding-right"]=le;a["border-right-width"]=le;a["margin-right"]=le;a.right=le};
un.prototype.Cc=function(){var a=this.style;a.top=le;a["margin-top"]=le;a["border-top-width"]=le;a["padding-top"]=le;a["padding-bottom"]=le;a["border-bottom-width"]=le;a["margin-bottom"]=le;a.bottom=le};un.prototype.$=function(a,b,c){b=b.l;var d={start:this.j.marginLeft,end:this.j.marginRight,X:this.j.rb},e={start:this.j.marginTop,end:this.j.marginBottom,X:this.j.qb};xn(this,b.top,!0,d,a,c);xn(this,b.bottom,!0,d,a,c);xn(this,b.left,!1,e,a,c);xn(this,b.right,!1,e,a,c)};
function yn(a,b,c,d,e){this.L=a;this.l=e;this.g=c;this.k=!Y(d,b[c?"width":"height"],new Uc(d,0,"px"));this.h=null}yn.prototype.b=function(){return this.k};function zn(a){a.h||(a.h=hn(a.l,a.L.b,a.g?["max-content width","min-content width"]:["max-content height","min-content height"]));return a.h}yn.prototype.e=function(){var a=zn(this);return this.g?ni(this.L)+a["max-content width"]+oi(this.L):li(this.L)+a["max-content height"]+mi(this.L)};
yn.prototype.f=function(){var a=zn(this);return this.g?ni(this.L)+a["min-content width"]+oi(this.L):li(this.L)+a["min-content height"]+mi(this.L)};yn.prototype.d=function(){return this.g?ni(this.L)+this.L.width+oi(this.L):li(this.L)+this.L.height+mi(this.L)};function An(a){this.g=a}An.prototype.b=function(){return this.g.some(function(a){return a.b()})};An.prototype.e=function(){var a=this.g.map(function(a){return a.e()});return Math.max.apply(null,a)*a.length};
An.prototype.f=function(){var a=this.g.map(function(a){return a.f()});return Math.max.apply(null,a)*a.length};An.prototype.d=function(){var a=this.g.map(function(a){return a.d()});return Math.max.apply(null,a)*a.length};function Bn(a,b,c,d,e,f){yn.call(this,a,b,c,d,e);this.j=f}t(Bn,yn);Bn.prototype.b=function(){return!1};Bn.prototype.e=function(){return this.d()};Bn.prototype.f=function(){return this.d()};Bn.prototype.d=function(){return this.g?ni(this.L)+this.j+oi(this.L):li(this.L)+this.j+mi(this.L)};
function xn(a,b,c,d,e,f){var g=a.d.d,k={},h={},l={},n;for(n in b){var p=on[n];if(p){var r=b[n],q=a.pa[n],v=new yn(r,q.style,c,g,f);k[p.ga]=r;h[p.ga]=q;l[p.ga]=v}}a=d.start.evaluate(e);d.end.evaluate(e);b=d.X.evaluate(e);var y=Cn(l,b),I=!1,W={};Object.keys(k).forEach(function(a){var b=Y(g,h[a].style[c?"max-width":"max-height"],d.X);b&&(b=b.evaluate(e),y[a]>b&&(b=l[a]=new Bn(k[a],h[a].style,c,g,f,b),W[a]=b.d(),I=!0))});I&&(y=Cn(l,b),I=!1,["start","center","end"].forEach(function(a){y[a]=W[a]||y[a]}));
var P={};Object.keys(k).forEach(function(a){var b=Y(g,h[a].style[c?"min-width":"min-height"],d.X);b&&(b=b.evaluate(e),y[a]<b&&(b=l[a]=new Bn(k[a],h[a].style,c,g,f,b),P[a]=b.d(),I=!0))});I&&(y=Cn(l,b),["start","center","end"].forEach(function(a){y[a]=P[a]||y[a]}));var F=a+b,Ea=a+(a+b);["start","center","end"].forEach(function(a){var b=y[a];if(b){var d=k[a],e=0;switch(a){case "start":e=c?d.left:d.top;break;case "center":e=(Ea-b)/2;break;case "end":e=F-b}c?ri(d,e,b-ni(d)-oi(d)):qi(d,e,b-li(d)-mi(d))}})}
function Cn(a,b){var c=a.start,d=a.center,e=a.end,f={};if(d){var g=[c,e].filter(function(a){return a}),g=Dn(d,g.length?new An(g):null,b);g.Ma&&(f.center=g.Ma);d=g.Ma||d.d();d=(b-d)/2;c&&c.b()&&(f.start=d);e&&e.b()&&(f.end=d)}else c=Dn(c,e,b),c.Ma&&(f.start=c.Ma),c.Pb&&(f.end=c.Pb);return f}
function Dn(a,b,c){var d={Ma:null,Pb:null};if(a&&b)if(a.b()&&b.b()){var e=a.e(),f=b.e();0<e&&0<f?(f=e+f,f<c?d.Ma=c*e/f:(a=a.f(),b=b.f(),b=a+b,b<c?d.Ma=a+(c-b)*(e-a)/(f-b):0<b&&(d.Ma=c*a/b)),0<d.Ma&&(d.Pb=c-d.Ma)):0<e?d.Ma=c:0<f&&(d.Pb=c)}else a.b()?d.Ma=Math.max(c-b.d(),0):b.b()&&(d.Pb=Math.max(c-a.d(),0));else a?a.b()&&(d.Ma=c):b&&b.b()&&(d.Pb=c);return d}un.prototype.cb=function(a,b,c){un.sd.cb.call(this,a,b,c);b.b.setAttribute("data-vivliostyle-page-box",!0)};
function vn(a,b){Rk.call(this,a,b);this.marginLeft=this.marginBottom=this.marginRight=this.marginTop=this.qb=this.rb=null}t(vn,Rk);
vn.prototype.h=function(a,b){var c=this.B,d;for(d in b)Object.prototype.hasOwnProperty.call(b,d)&&(d.match(/^column.*$/)||d.match(/^background-/))&&(c[d]=b[d]);Rk.prototype.h.call(this,a,b);d=this.e;c={rb:this.rb,qb:this.qb,marginTop:this.marginTop,marginRight:this.marginRight,marginBottom:this.marginBottom,marginLeft:this.marginLeft};d.j=c;d=d.style;d.width=new L(c.rb);d.height=new L(c.qb);d["padding-left"]=new L(c.marginLeft);d["padding-right"]=new L(c.marginRight);d["padding-top"]=new L(c.marginTop);
d["padding-bottom"]=new L(c.marginBottom)};vn.prototype.Bc=function(){var a=En(this,{start:"left",end:"right",X:"width"});this.rb=a.jd;this.marginLeft=a.qd;this.marginRight=a.pd};vn.prototype.Cc=function(){var a=En(this,{start:"top",end:"bottom",X:"height"});this.qb=a.jd;this.marginTop=a.qd;this.marginBottom=a.pd};
function En(a,b){var c=a.style,d=a.d.d,e=b.start,f=b.end,g=b.X,k=a.d.w[g].ea(d,null),h=Y(d,c[g],k),l=Y(d,c["margin-"+e],k),n=Y(d,c["margin-"+f],k),p=Sk(d,c["padding-"+e],k),r=Sk(d,c["padding-"+f],k),q=Uk(d,c["border-"+e+"-width"],c["border-"+e+"-style"],k),v=Uk(d,c["border-"+f+"-width"],c["border-"+f+"-style"],k),y=G(d,k,E(d,E(d,q,p),E(d,v,r)));h?(y=G(d,y,h),l||n?l?n=G(d,y,l):l=G(d,y,n):n=l=bd(d,y,new B(d,.5))):(l||(l=d.b),n||(n=d.b),h=G(d,y,E(d,l,n)));c[e]=new L(l);c[f]=new L(n);c["margin-"+e]=le;
c["margin-"+f]=le;c["padding-"+e]=new L(p);c["padding-"+f]=new L(r);c["border-"+e+"-width"]=new L(q);c["border-"+f+"-width"]=new L(v);c[g]=new L(h);c["max-"+g]=new L(h);return{jd:G(d,k,E(d,l,n)),qd:l,pd:n}}vn.prototype.cb=function(a,b,c){Rk.prototype.cb.call(this,a,b,c);c.u=b.b};function wn(a,b){Rk.call(this,a,b);var c=b.l;this.j=on[c];a.pa[c]=this;this.va=!0}t(wn,Rk);m=wn.prototype;
m.cb=function(a,b,c){var d=b.b;w(d,"display","flex");var e=cl(this,a,"vertical-align"),f=null;e===J("middle")?f="center":e===J("top")?f="flex-start":e===J("bottom")&&(f="flex-end");f&&(w(d,"flex-flow",this.b?"row":"column"),w(d,"justify-content",f));Rk.prototype.cb.call(this,a,b,c)};
m.ga=function(a,b){var c=this.style,d=this.d.d,e=a.start,f=a.end,g="left"===e,k=g?b.rb:b.qb,h=Y(d,c[a.X],k),g=g?b.marginLeft:b.marginTop;if("start"===this.j.ga)c[e]=new L(g);else if(h){var l=Sk(d,c["margin-"+e],k),n=Sk(d,c["margin-"+f],k),p=Sk(d,c["padding-"+e],k),r=Sk(d,c["padding-"+f],k),q=Uk(d,c["border-"+e+"-width"],c["border-"+e+"-style"],k),f=Uk(d,c["border-"+f+"-width"],c["border-"+f+"-style"],k),h=E(d,h,E(d,E(d,p,r),E(d,E(d,q,f),E(d,l,n))));switch(this.j.ga){case "center":c[e]=new L(E(d,g,
cd(d,G(d,k,h),new B(d,2))));break;case "end":c[e]=new L(G(d,E(d,g,k),h))}}};
function Fn(a,b,c){function d(a){if(y)return y;y={X:v?v.evaluate(a):null,Ba:h?h.evaluate(a):null,Ca:l?l.evaluate(a):null};var b=k.evaluate(a),c=0;[r,n,p,q].forEach(function(b){b&&(c+=b.evaluate(a))});(null===y.Ba||null===y.Ca)&&c+y.X+y.Ba+y.Ca>b&&(null===y.Ba&&(y.Ba=0),null===y.Ca&&(y.$d=0));null!==y.X&&null!==y.Ba&&null!==y.Ca&&(y.Ca=null);null===y.X&&null!==y.Ba&&null!==y.Ca?y.X=b-c-y.Ba-y.Ca:null!==y.X&&null===y.Ba&&null!==y.Ca?y.Ba=b-c-y.X-y.Ca:null!==y.X&&null!==y.Ba&&null===y.Ca?y.Ca=b-c-y.X-
y.Ba:null===y.X?(y.Ba=y.Ca=0,y.X=b-c):y.Ba=y.Ca=(b-c-y.X)/2;return y}var e=a.style;a=a.d.d;var f=b.Dc,g=b.Ic;b=b.X;var k=G(a,c["margin"+g.charAt(0).toUpperCase()+g.substring(1)],new B(a,2)),h=Tk(a,e["margin-"+f],k),l=Tk(a,e["margin-"+g],k),n=Sk(a,e["padding-"+f],k),p=Sk(a,e["padding-"+g],k),r=Uk(a,e["border-"+f+"-width"],e["border-"+f+"-style"],k),q=Uk(a,e["border-"+g+"-width"],e["border-"+g+"-style"],k),v=Y(a,e[b],k),y=null;e[b]=new L(new nc(a,function(){var a=d(this).X;return null===a?0:a},b));
e["margin-"+f]=new L(new nc(a,function(){var a=d(this).Ba;return null===a?0:a},"margin-"+f));e["margin-"+g]=new L(new nc(a,function(){var a=d(this).Ca;return null===a?0:a},"margin-"+g));"left"===f?e.left=new L(E(a,c.marginLeft,c.rb)):"top"===f&&(e.top=new L(E(a,c.marginTop,c.qb)))}m.Bc=function(){var a=this.e.j;this.j.ra?Fn(this,{Dc:"right",Ic:"left",X:"width"},a):this.j.sa?Fn(this,{Dc:"left",Ic:"right",X:"width"},a):this.ga({start:"left",end:"right",X:"width"},a)};
m.Cc=function(){var a=this.e.j;this.j.ta?Fn(this,{Dc:"bottom",Ic:"top",X:"height"},a):this.j.qa?Fn(this,{Dc:"top",Ic:"bottom",X:"height"},a):this.ga({start:"top",end:"bottom",X:"height"},a)};m.Yb=function(a,b,c,d,e,f){Rk.prototype.Yb.call(this,a,b,c,d,e,f);a=c.l;c=this.d.l;d=this.j;d.ra||d.sa?d.ta||d.qa||(d.ra?a.left[c]=b:d.sa&&(a.right[c]=b)):d.ta?a.top[c]=b:d.qa&&(a.bottom[c]=b)};
function Gn(a,b,c,d,e){this.b=a;this.h=b;this.f=c;this.d=d;this.e=e;this.g={};a=this.h;b=new Vc(a,"page-number");b=new Nc(a,new Tc(a,b,new B(a,2)),a.b);c=new Dc(a,b);a.values["recto-page"]=c;a.values["verso-page"]=b;"ltr"===jn(this.e)?(a.values["left-page"]=b,b=new Dc(a,b),a.values["right-page"]=b):(c=new Dc(a,b),a.values["left-page"]=c,a.values["right-page"]=b)}function Hn(a){var b={};Tj(a.b,[],"",b);a.b.pop();return b}
function In(a,b){var c=[],d;for(d in b)if(Object.prototype.hasOwnProperty.call(b,d)){var e=b[d],f;f=e instanceof V?e.value+"":In(a,e);c.push(d+f+(e.Da||""))}return c.sort().join("^")}function Jn(a){this.b=null;this.f=a}t(Jn,X);Jn.prototype.apply=function(a){a.I===this.f&&this.b.apply(a)};Jn.prototype.d=function(){return 3};Jn.prototype.e=function(a){this.b&&ej(a.Fb,this.f,this.b);return!0};function Kn(a){this.b=null;this.f=a}t(Kn,X);
Kn.prototype.apply=function(a){1===(new Vc(this.f,"page-number")).evaluate(a.d)&&this.b.apply(a)};Kn.prototype.d=function(){return 2};function Ln(a){this.b=null;this.f=a}t(Ln,X);Ln.prototype.apply=function(a){(new Vc(this.f,"left-page")).evaluate(a.d)&&this.b.apply(a)};Ln.prototype.d=function(){return 1};function Mn(a){this.b=null;this.f=a}t(Mn,X);Mn.prototype.apply=function(a){(new Vc(this.f,"right-page")).evaluate(a.d)&&this.b.apply(a)};Mn.prototype.d=function(){return 1};
function Nn(a){this.b=null;this.f=a}t(Nn,X);Nn.prototype.apply=function(a){(new Vc(this.f,"recto-page")).evaluate(a.d)&&this.b.apply(a)};Nn.prototype.d=function(){return 1};function On(a){this.b=null;this.f=a}t(On,X);On.prototype.apply=function(a){(new Vc(this.f,"verso-page")).evaluate(a.d)&&this.b.apply(a)};On.prototype.d=function(){return 1};function Pn(a,b){cj.call(this,a,b,null,null)}t(Pn,cj);
Pn.prototype.apply=function(a){var b=a.d,c=a.w,d=this.style;a=this.b;Xi(b,c,d,a,null,null);if(d=d._marginBoxes){var c=Vi(c,"_marginBoxes"),e;for(e in d)if(d.hasOwnProperty(e)){var f=c[e];f||(f={},c[e]=f);Xi(b,f,d[e],a,null,null)}}};function Qn(a,b,c,d){bk.call(this,a,b,null,c,null,d,!1);this.f=""}t(Qn,bk);m=Qn.prototype;m.ub=function(){this.f+="@page ";this.gb()};m.Za=function(a,b){this.f+=b;b&&(this.b.push(new Jn(b)),this.d+=65536)};
m.Gb=function(a,b){b&&Hf(this,"E_INVALID_PAGE_SELECTOR :"+a+"("+b.join("")+")");this.f+=":"+a;switch(a.toLowerCase()){case "first":this.b.push(new Kn(this.e));this.d+=256;break;case "left":this.b.push(new Ln(this.e));this.d+=1;break;case "right":this.b.push(new Mn(this.e));this.d+=1;break;case "recto":this.b.push(new Nn(this.e));this.d+=1;break;case "verso":this.b.push(new On(this.e));this.d+=1;break;default:Hf(this,"E_INVALID_PAGE_SELECTOR :"+a)}};m.la=function(){this.f+="{";bk.prototype.la.call(this)};
m.Sa=function(){this.f+="}";document.getElementById("vivliostyle-page-rules").textContent+=this.f;bk.prototype.Sa.call(this)};
m.Ja=function(a,b,c){if("size"===a){var d=b.$c()&&b.values[1]===Nd,e=(d?b.values[0]:b).toString().toLowerCase(),f=kn[e];f&&("a5"===e||"a4"===e||"a3"===e||"b5"===e||"b4"===e||"letter"===e||"legal"===e||"ledger"===e?d&&(e+=" landscape"):(e=f.width.stringValue(),f=f.height.stringValue(),e=d?f+" "+e:e+" "+f));this.f+="size: "+e+(c?" !important":"")+";"}bk.prototype.Ja.call(this,a,b,c)};m.md=function(a){ej(this.h.Fb,"*",a)};m.od=function(a){return new Pn(this.k,a)};
m.Nc=function(a){var b=Vi(this.k,"_marginBoxes"),c=b[a];c||(c={},b[a]=c);Df(this.Y,new Rn(this.e,this.Y,this.u,c))};function Rn(a,b,c,d){Ef.call(this,a,b,!1);this.d=c;this.b=d}t(Rn,Ff);Rn.prototype.Ja=function(a,b,c){bh(this.d,a,b,c,this)};Rn.prototype.Db=function(a,b){Gf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};Rn.prototype.kc=function(a,b){Gf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};Rn.prototype.fb=function(a,b,c){Ui(this.b,a,new V(b,c?Af(this):Bf(this)))};
function Sn(a){this.d=a;this.b={};this.b.page=[0]}function Tn(a,b){Object.keys(b.b).forEach(function(a){this.b[a]=Array.b(b.b[a])},a)}function Kj(a,b,c){return new nc(a.d,function(){var d=a.b[b];return c(d&&d.length?d[d.length-1]:null)},"page-counter-"+b)}function Mj(a,b,c){return new nc(a.d,function(){return c(a.b[b]||[])},"page-counters-"+b)}
function Un(a,b,c){var d,e=b["counter-reset"];e&&(e=e.evaluate(c))&&(d=ng(e,!0));if(d)for(var f in d){var e=a,g=f,k=d[f];e.b[g]?e.b[g].push(k):e.b[g]=[k]}var h;(b=b["counter-increment"])&&(c=b.evaluate(c))&&(h=ng(c,!1));h?"page"in h||(h.page=1):h={page:1};for(var l in h)a.b[l]||(c=a,b=l,c.b[b]?c.b[b].push(0):c.b[b]=[0]),c=a.b[l],c[c.length-1]+=h[l]};function Vn(a,b,c,d,e,f,g,k,h){this.h=a;this.g=b;this.b=c;this.d=d;this.w=e;this.f=f;this.l=a.D;this.u=g;this.e=k;this.k=h;this.j=a.f;pc(this.b,function(a){return(a=this.b.b[a])?0<a.b.length&&a.b[0].b.b<=this.h:!1});oc(this.b,new nc(this.b,function(){return this.va+this.b.d},"page-number"))}
function Wn(a,b,c,d){if(a.k.length){var e=new rc(0,b,c,d);a=a.k;for(var f={},g=0;g<a.length;g++)Xi(e,f,a[g],0,null,null);g=f.width;a=f.height;var f=f["text-zoom"],k=1;if(g&&a||f){var h=qc.em;(f?f.evaluate(e,"text-zoom"):null)===Yd&&(k=h/d,d=h,b*=k,c*=k);if(g&&a&&(g=ud(g.evaluate(e,"width"),e),e=ud(a.evaluate(e,"height"),e),0<g&&0<e))return{width:g,height:e,fontSize:d}}}return{width:b,height:c,fontSize:d}}
function Xn(a,b,c,d,e,f,g,k,h){rc.call(this,0,d.width,d.height,d.fontSize);this.style=a;this.Z=b;this.lang=b.lang||c;this.viewport=d;this.e={body:!0};this.f=e;this.b=this.D=this.d=this.k=null;this.h=0;this.Xa=f;this.ma=new ih(this.style.l);this.pa={};this.M=null;this.j=new Sn(a.b);this.I={};this.fa=null;this.Ea=g;this.Fa=k;this.va=h;for(var l in a.e)(b=a.e[l]["flow-consume"])&&(b.evaluate(this,"flow-consume")==wd?this.e[l]=!0:delete this.e[l])}t(Xn,rc);
function Yn(a){var b=M("StyleInstance.init");a.d=new sk(a.Z,a.style.d,a.style.g,a,a.e,a.style.j,a.j);var c=a.d;c.k=a;for(var d=0;d<c.B.length;d++)Ak(c.k,c.B[d]);a.D={};c=a.D[a.Z.url]=a.d;for(d=0;!c.j&&(d+=5E3,Bk(c,d,0)!=Number.POSITIVE_INFINITY););c=c.u;a.fa=jn(c);a.k=new rl(a.style.w);d=new Qj(a.style.d,a,a.j);a.k.h(d,c);ql(a.k,a);a.M=new Gn(d,a.style.b,a.k,a,c);c=[];for(d=0;d<a.style.f.length;d++){var e=a.style.f[d];if(!e.J||e.J.evaluate(a)){var f=e.lb,g=a,e={},k=void 0;for(k in f)e[k]=f[k].evaluate(g,
k);f=e;g=void 0;for(g in dh)f[g]||(f[g]=dh[g]);e=new gh(e);c.push(e)}}d=a.Xa;a=a.ma;e=[];for(f=0;f<c.length;f++)g=c[f],g.src&&g.b?e.push(mh(d,g,a)):u.b("E_FONT_FACE_INVALID");pg(e).oa(b);return O(b)}function Ak(a,b){var c=a.b;if(c){var d=c.b[b.f];d||(d=new ii,c.b[b.f]=d);d.b.push(new hi(new gi({ha:[{da:b.g,Ka:0,ba:null,ua:null,na:null}],aa:0,K:!1}),b))}}
function Zn(a,b){if(!b)return 0;var c=Number.POSITIVE_INFINITY,d;for(d in a.e){var e=b.b[d];if((!e||0==e.b.length)&&a.b){var f=a.d;f.l=d;for(e=0;null!=f.l&&(e+=5E3,Bk(f,e,0)!=Number.POSITIVE_INFINITY););e=a.b.b[d];b!=a.b&&e&&(e=e.clone(),b.b[d]=e)}if(e){for(var f=a,g=Number.POSITIVE_INFINITY,k=0;k<e.b.length;k++){for(var h=e.b[k].d.Qa,l=h.ha[0].da,n=h.aa,p=h.K,r=0;l.ownerDocument!=f.Z.b;)r++,l=h.ha[r].da,p=!1,n=0;h=rh(f.Z,l,n,p);h<g&&(g=h)}f=g;f<c&&(c=f)}}return c}
function $n(a,b){var c=Zn(a,a.b);if(c==Number.POSITIVE_INFINITY)return null;for(var d=a.k.children,e,f=0;f<d.length;f++)if(e=d[f],"vivliostyle-page-rule-master"!==e.d.eb){var g=1,k=cl(e,a,"utilization");k&&k.Zc()&&(g=k.C);k=tc(a,"em",!1);a.h=Bk(a.d,c,Math.ceil(g*a.u()*a.l()/(k*k)));var g=a,k=g.b.d,h=void 0;for(h in g.b.b)for(var l=g.b.b[h],n=l.b.length-1;0<=n;n--){var p=l.b[n];0>p.b.e&&p.b.b<g.h&&(p.b.e=k)}sc(a,a.style.b);g=cl(e,a,"enabled");if(!g||g===he){d=a;u.d("Location - page",d.b.d);u.d("  current:",
c);u.d("  lookup:",d.h);c=void 0;for(c in d.b.b)for(f=d.b.b[c],g=0;g<f.b.length;g++)u.d("  Chunk",c+":",f.b[g].b.b);c=a.M;f=b;g=e.d;if(0===Object.keys(f).length)g.d.e=g;else{e=g;d=In(c,f);e=e.g+"^"+d;d=c.g[e];if(!d){if("background-host"===g.eb)d=c,f=(new qn(d.h,d.f.d,f)).f(d.f),f.h(d.b,d.e),ql(f,d.d),d=f;else{d=c;k=f;f=g.clone({eb:"vivliostyle-page-rule-master"});if(g=k.size)k=mn(k),g=g.Da,f.b.width=Ri(d.d,f.b.width,new V(k.width,g)),f.b.height=Ri(d.d,f.b.height,new V(k.height,g));f=f.f(d.f);f.h(d.b,
d.e);ql(f,d.d);d=f}c.g[e]=d}e=d.d;e.d.e=e;e=d}return e}}throw Error("No enabled page masters");}
function ao(a,b,c){var d=a.b.b[c];if(!d)return N(!0);Dm(b);a.e[c]&&0<b.Xa.length&&(b.gd=!1);var e=M("layoutColumn"),f=[];nf(function(c){for(;0<d.b.length;){var e=0,h=d.b[e];if(h.b.b>a.h)break;for(var l=1;l<d.b.length;l++){var n=d.b[l];if(n.b.b>a.h)break;Wh(n.b,h.b)&&(h=n,e=l)}var p=h.b,r=!0;Gm(b,h.d).then(function(a){h.b.Hd&&(null===a||p.d)&&f.push(h);p.d?(d.b.splice(e,1),R(c)):a?(h.d=a,R(c)):(d.b.splice(e,1),r?r=!1:pf(c))});if(r){r=!1;return}}R(c)}).then(function(){0<f.length&&(d.b=f.concat(d.b));
Q(e,!0)});return O(e)}
function bo(a,b,c,d,e,f,g,k){var h=cl(c,a,"enabled");if(h&&h!==he)return N(!0);var l=M("layoutContainer"),n=cl(c,a,"wrap-flow")===yd,p=c.b?c.g&&c.D:c.f&&c.I,h=cl(c,a,"flow-from"),r=a.viewport.b.createElement("div"),q=cl(c,a,"position");w(r,"position",q?q.name:"absolute");d.insertBefore(r,d.firstChild);var v=new ki(r);v.d=c.b;c.cb(a,v,b);v.A=e;v.B=f;e+=v.left+v.marginLeft+v.$;f+=v.top+v.marginTop+v.fa;if(h&&h.nd())if(a.I[h.toString()])c.Yb(a,v,b,null,1,a.f),h=N(!0);else{var y=M("layoutContainer.inner"),
I=h.toString(),W=Z(c,a,"column-count"),P=Z(c,a,"column-gap"),F=1<W?Z(c,a,"column-width"):v.width,h=bl(c,a),Ea=0,q=cl(c,a,"shape-inside"),ob=lg(q,0,0,v.width,v.height,a),Fk=new Fl(I,a,a.viewport,a.d,h,a.Z,a.ma,a.style.u,a,b,a.Ea,a.Fa,k),sh=0,aa=null;nf(function(b){for(;sh<W;){var c=sh++;if(1<W){var d=a.viewport.b.createElement("div");w(d,"position","absolute");r.appendChild(d);aa=new km(d,Fk,a.f);aa.d=v.d;aa.Fa=v.Fa;aa.Tb=v.Tb;v.d?(w(d,"margin-left",v.j+"px"),w(d,"margin-right",v.D+"px"),c=c*(F+P)+
v.k,ri(aa,0,v.width),qi(aa,c,F)):(w(d,"margin-top",v.k+"px"),w(d,"margin-bottom",v.w+"px"),c=c*(F+P)+v.j,qi(aa,0,v.height),ri(aa,c,F));aa.A=e+v.j;aa.B=f+v.k}else aa=new km(r,Fk,a.f),pi(aa,v),v=aa;aa.I=p?[]:g;aa.Rb=ob;if(0<=aa.width){var h=M("inner");ao(a,aa,I).then(function(){aa.M&&"column"!=aa.M&&(sh=W,"region"!=aa.M&&(a.I[I]=!0));Q(h,!0)});c=O(h)}else c=N(!0);if(c.ya()){c.then(function(){0<k.b.length?R(b):(Ea=Math.max(Ea,aa.e),pf(b))});return}0<k.b.length||(Ea=Math.max(Ea,aa.e))}R(b)}).then(function(){v.e=
Ea;c.Yb(a,v,b,aa,W,a.f);Q(y,!0)});h=O(y)}else{h=cl(c,a,"content");q=!1;if(h&&ti(h)){var Gk=a.viewport.b.createElement("span");h.R(new si(Gk,a));r.appendChild(Gk);pl(c,a,v)}else c.va&&(d.removeChild(r),q=!0);q||c.Yb(a,v,b,null,1,a.f);h=N(!0)}h.then(function(){if(!c.f||0<Math.floor(v.e)){if(!n){var h=v.A+v.left,p=v.B+v.top,q=ni(v)+v.width+oi(v),y=li(v)+v.height+mi(v),F=cl(c,a,"shape-outside"),h=lg(F,h,p,q,y,a);gb(a.viewport.root)&&g.push(we(h,0,-1.25*tc(a,"em",!1)));g.push(h)}}else if(0==c.children.length){d.removeChild(r);
Q(l,!0);return}var I=c.children.length-1;mf(function(){for(;0<=I;){var d=c.children[I--],d=bo(a,b,d,r,e,f,g,k);if(d.ya())return d}return N(!1)}).then(function(){Q(l,!0)})});return O(l)}
function co(a,b,c){a.I={};c?(a.b=c.clone(),vk(a.d,c.e)):(a.b=new ji,vk(a.d,-1));a.lang&&b.L.setAttribute("lang",a.lang);c=a.b;c.d++;sc(a,a.style.b);var d=Hn(a.M);eo(a,d);var e=$n(a,d);if(!e)return N(null);e.d.b.width.value===je&&Rh(b);e.d.b.height.value===ke&&Sh(b);Un(a.j,d,a);var d=cl(e,a,"writing-mode")||Id,f=cl(e,a,"direction")||Qd,g=new wi(b.w.bind(b),d,f),k=c.clone(),h=[],l=M("layoutNextPage");nf(function(d){bo(a,b,e,b.L,0,0,h.concat(),g).then(function(){if(0<g.b.length){h=h.concat(Bi(g));g.b.splice(0,
g.b.length);c=a.b=k.clone();for(var e;e=b.L.lastChild;)b.L.removeChild(e);pf(d)}else R(d)})}).then(function(){e.$(a,b,a.f);var d=new Vc(e.d.d,"left-page");b.f=d.evaluate(a)?"left":"right";var d=a.b.d,f;for(f in a.b.b)for(var g=a.b.b[f],h=g.b.length-1;0<=h;h--){var k=g.b[h];0<=k.b.e&&k.b.e+k.b.j-1<=d&&g.b.splice(h,1)}a.b=null;c.e=a.d.b;f=a.style.h.B[a.Z.url];d=b.L.firstElementChild.getBoundingClientRect();b.b.width=d.width;b.b.height=d.height;g=b.g;for(d=0;d<g.length;d++)h=g[d],w(h.target,h.name,h.value.toString());
for(d=0;d<f.length;d++)if(g=f[d],k=b.h[g.Ib],h=b.h[g.Ed],k&&h&&(k=Ph(k,g.action)))for(var y=0;y<h.length;y++)h[y].addEventListener(g.event,k,!1);var I;a:{for(I in a.e)if((f=c.b[I])&&0<f.b.length){I=!1;break a}I=!0}I&&(c=null);Q(l,c)});return O(l)}function eo(a,b){var c=mn(b),d=c.width;d===je?a.A=null:a.A=d.C*tc(a,d.ia,!1);c=c.height;c===ke?a.w=null:a.w=c.C*tc(a,c.ia,!1)}function fo(a,b,c,d){bk.call(this,a.g,a,b,c,d,a.f,!c);this.f=a;this.A=!1}t(fo,bk);m=fo.prototype;m.gc=function(){};
m.fc=function(a,b,c){a=new Mk(this.f.j,a,b,c,this.f.u,this.J,Bf(this.Y));Df(this.f,new wl(a.d,this.f,a,this.u))};m.mb=function(a){a=a.d;null!=this.J&&(a=ad(this.e,this.J,a));Df(this.f,new fo(this.f,a,this,this.B))};m.cc=function(){Df(this.f,new ek(this.e,this.Y))};m.ec=function(){var a={};this.f.k.push({lb:a,J:this.J});Df(this.f,new fk(this.e,this.Y,null,a,this.f.f))};m.dc=function(a){var b=this.f.h[a];b||(b={},this.f.h[a]=b);Df(this.f,new fk(this.e,this.Y,null,b,this.f.f))};
m.ic=function(){var a={};this.f.w.push(a);Df(this.f,new fk(this.e,this.Y,this.J,a,this.f.f))};m.Jb=function(a){var b=this.f.l;if(a){var c=Vi(b,"_pseudos"),b=c[a];b||(b={},c[a]=b)}Df(this.f,new fk(this.e,this.Y,null,b,this.f.f))};m.hc=function(){this.A=!0;this.gb()};m.ub=function(){var a=new Qn(this.f.j,this.f,this,this.u);Df(this.f,a);a.ub()};
m.la=function(){bk.prototype.la.call(this);if(this.A){this.A=!1;var a="R"+this.f.B++,b=J(a),c;this.J?c=new Qi(b,0,this.J):c=new V(b,0);Wi(this.k,"region-id").push(c);this.Sa();a=new fo(this.f,this.J,this,a);Df(this.f,a);a.la()}};
function go(a){var b=a.getAttribute("content");if(!b)return"";a={};for(var c;null!=(c=b.match(/^,?\s*([-A-Za-z_.][-A-Za-z_0-9.]*)\s*=\s*([-+A-Za-z_0-9.]*)\s*/));)b=b.substr(c[0].length),a[c[1]]=c[2];b=a.width-0;a=a.height-0;return b&&a?"@-epubx-viewport{width:"+b+"px;height:"+a+"px;}":""}function ho(a){Cf.call(this);this.f=a;this.g=new lc(null);this.j=new lc(this.g);this.u=new Jk(this.g);this.A=new fo(this,null,null,null);this.B=0;this.k=[];this.l={};this.h={};this.w=[];this.b=this.A}t(ho,Cf);
ho.prototype.error=function(a){u.b("CSS parser:",a)};function io(a,b){return jo(b,a)}function ko(a){tf.call(this,io,"document");this.D=a;this.A={};this.h={};this.b={};this.B={};this.f=null;this.j=[]}t(ko,tf);function lo(a){var b=sa("user-agent.xml",ra),c=M("OPSDocStore.init");uf(ch).then(function(d){a.f=d;uf(hk).then(function(){a.load(b).then(function(){Q(c,!0)})})});return O(c)}function mo(a,b){a.j.push({url:b.url,text:b.text,Ta:"User",xa:null,media:null})}
function jo(a,b){var c=M("OPSDocStore.load"),d=b.url;Ah(b,a).then(function(b){if(b){for(var f=[],g=b.b.getElementsByTagNameNS("http://www.idpf.org/2007/ops","trigger"),k=0;k<g.length;k++){var h=g[k],l=h.getAttributeNS("http://www.w3.org/2001/xml-events","observer"),n=h.getAttributeNS("http://www.w3.org/2001/xml-events","event"),p=h.getAttribute("action"),h=h.getAttribute("ref");l&&n&&p&&h&&f.push({Ed:l,event:n,action:p,Ib:h})}a.B[d]=f;var r=[],f=sa("user-agent-page.css",ra);r.push({url:f,text:null,
Ta:"UA",xa:null,media:null});for(k=0;k<a.j.length;k++)r.push(a.j[k]);if(f=b.h)for(f=f.firstChild;f;f=f.nextSibling)if(1==f.nodeType)if(g=f,k=g.namespaceURI,l=g.localName,"http://www.w3.org/1999/xhtml"==k)if("style"==l)r.push({url:d,text:g.textContent,Ta:"Author",xa:null,media:null});else if("link"==l){if(n=g.getAttribute("rel"),k=g.getAttribute("class"),l=g.getAttribute("media"),"stylesheet"==n||"alternate stylesheet"==n&&k)g=g.getAttribute("href"),g=sa(g,d),r.push({url:g,text:null,xa:k,media:l,Ta:"Author"})}else"meta"==
l&&"viewport"==g.getAttribute("name")&&r.push({url:d,text:go(g),Ta:"Author",J:null,media:null});else"http://www.gribuser.ru/xml/fictionbook/2.0"==k?"stylesheet"==l&&"text/css"==g.getAttribute("type")&&r.push({url:d,text:g.textContent,Ta:"Author",xa:null,media:null}):"http://example.com/sse"==k&&"property"===l&&(k=g.getElementsByTagName("name")[0])&&"stylesheet"===k.textContent&&(g=g.getElementsByTagName("value")[0])&&(g=sa(g.textContent,d),r.push({url:g,text:null,xa:null,media:null,Ta:"Author"}));
for(var q="",k=0;k<r.length;k++)q+=r[k].url,q+="^",r[k].text&&(q+=r[k].text),q+="^";var v=a.A[q];v?(a.b[d]=v,Q(c,b)):(f=a.h[q],f||(f=new wf(function(){var b=M("fetchStylesheet"),c=0,d=new ho(a.f);mf(function(){if(c<r.length){var a=r[c++];d.vb(a.Ta);var b;if(null!==a.text){b=a.url;var e=a.xa,f=a.media,a=new ac(a.text,d);b=bg(a,d,b,e,f)}else b=dg(a.url,d,a.xa,a.media);return b}return N(!1)}).then(function(){v=new Vn(a,d.g,d.j,d.A.h,d.u,d.k,d.l,d.h,d.w);a.A[q]=v;delete a.h[q];Q(b,v)});return O(b)},"FetchStylesheet "+
d),a.h[q]=f,f.start()),uf(f).then(function(f){a.b[d]=f;Q(c,b)}))}else Q(c,null)});return O(c)};function no(a,b,c,d,e,f,g,k){this.d=a;this.url=b;this.lang=c;this.e=d;this.g=e;this.Q=dc(f);this.h=g;this.f=k;this.Ha=this.b=null}function oo(a,b,c){if(0!=c--)for(b=b.firstChild;b;b=b.nextSibling)if(1==b.nodeType){var d=b;"auto"!=Oa(d,"height","auto")&&(w(d,"height","auto"),oo(a,d,c));"absolute"==Oa(d,"position","static")&&(w(d,"position","relative"),oo(a,d,c))}}
function po(a){var b=a.target,c="\u25b8"==b.textContent;b.textContent=c?"\u25be":"\u25b8";for(b=b.parentNode.firstChild;b;)if(1!=b.nodeType)b=b.nextSibling;else{var d=b;"toc-container"==d.getAttribute("data-adapt-class")?b=d.firstChild:("toc-node"==d.getAttribute("data-adapt-class")&&(d.style.height=c?"auto":"0px"),b=b.nextSibling)}a.stopPropagation()}
no.prototype.Fc=function(a){var b=this.h.Fc(a);return function(a,d,e){var f=e.behavior;if(!f||"toc-node"!=f.toString()&&"toc-container"!=f.toString())return b(a,d,e);a=d.getAttribute("data-adapt-class");"toc-node"==a&&(e=d.firstChild,"\u25b8"!=e.textContent&&(e.textContent="\u25b8",w(e,"cursor","pointer"),e.addEventListener("click",po,!1)));var g=d.ownerDocument.createElement("div");g.setAttribute("data-adapt-process-children","true");"toc-node"==f.toString()?(e=d.ownerDocument.createElement("div"),
e.textContent="\u25b9",w(e,"margin-left","-1em"),w(e,"display","inline-block"),w(e,"width","1em"),w(e,"text-align","left"),w(e,"cursor","default"),w(e,"font-family","Menlo,sans-serif"),g.appendChild(e),w(g,"overflow","hidden"),g.setAttribute("data-adapt-class","toc-node"),"toc-node"!=a&&"toc-container"!=a||w(g,"height","0px")):"toc-node"==a&&g.setAttribute("data-adapt-class","toc-container");return N(g)}};
no.prototype.bc=function(a,b,c,d,e){if(this.b)return N(this.b);var f=this,g=M("showTOC"),k=new Qh(a);this.b=k;this.d.load(this.url).then(function(d){var l=f.d.b[d.url],n=Wn(l,c,1E5,e);b=new $l(b.f,n.fontSize,b.root,n.width,n.height);var p=new Xn(l,d,f.lang,b,f.e,f.g,f.Fc(d),f.f,0);f.Ha=p;p.Q=f.Q;Yn(p).then(function(){co(p,k,null).then(function(){oo(f,a,2);Q(g,k)})})});return O(g)};
no.prototype.Zb=function(){if(this.b){var a=this.b;this.Ha=this.b=null;w(a.L,"visibility","none");var b=a.L.parentNode;b&&b.removeChild(a.L)}};no.prototype.ad=function(){return!!this.b};function qo(){ko.call(this,ro(this));this.d=new tf(Ah,"document");this.u=new tf(xf,"text");this.w={};this.M={};this.k={};this.l={}}t(qo,ko);function ro(a){return function(b){return a.k[b]}}
function so(a,b,c){var d=M("loadEPUBDoc");"/"!==b.substring(b.length-1)&&(b+="/");c&&a.u.Xb(b+"?r=list");a.d.Xb(b+"META-INF/encryption.xml");var e=b+"META-INF/container.xml";a.d.load(e,!0,"Failed to fetch EPUB container.xml from "+e).then(function(f){if(f){f=Lh(oh(oh(oh(new ph([f.b]),"container"),"rootfiles"),"rootfile"),"full-path");for(var g=0;g<f.length;g++){var k=f[g];if(k){to(a,b,k,c).oa(d);return}}Q(d,null)}else u.error("Received an empty response for EPUB container.xml "+e+". This may be caused by the server not allowing cross origin requests.")});
return O(d)}function to(a,b,c,d){var e=b+c,f=a.w[e];if(f)return N(f);var g=M("loadOPF");a.d.load(e,void 0,void 0).then(function(c){c?a.d.load(b+"META-INF/encryption.xml",void 0,void 0).then(function(h){(d?a.u.load(b+"?r=list"):N(null)).then(function(d){f=new uo(a,b);vo(f,c,h,d,b+"?r=manifest").then(function(){a.w[e]=f;a.M[b]=f;Q(g,f)})})}):u.error("Received an empty response for EPUB OPF "+e+". This may be caused by the server not allowing cross origin requests.")});return O(g)}
qo.prototype.load=function(a){var b=qa(a);if(a=this.l[b])return a.ya()?a:N(a.Vb());var c=M("EPUBDocStore.load");a=qo.sd.load.call(this,b,!0,"Failed to fetch a source document from "+b);a.then(function(a){a?Q(c,a):u.error("Received an empty response for "+b+". This may be caused by the server not allowing cross origin requests.")});return O(c)};function wo(){this.id=null;this.src="";this.g=this.d=null;this.F=-1;this.h=0;this.j=null;this.b=this.e=0;this.f=$a}function xo(a){return a.id}
function yo(a){var b=Pe(a);return function(a){var d=M("deobfuscator"),e,f;a.slice?(e=a.slice(0,1040),f=a.slice(1040,a.size)):(e=a.webkitSlice(0,1040),f=a.webkitSlice(1040,a.size-1040));sf(e).then(function(a){a=new DataView(a);for(var c=0;c<a.byteLength;c++){var e=a.getUint8(c),e=e^b[c%20];a.setUint8(c,e)}Q(d,rf([a,f]))});return O(d)}}
var zo={dcterms:"http://purl.org/dc/terms/",marc:"http://id.loc.gov/vocabulary/",media:"http://www.idpf.org/epub/vocab/overlays/#",onix:"http://www.editeur.org/ONIX/book/codelists/current.html#",xsd:"http://www.w3.org/2001/XMLSchema#"},Ao=zo.dcterms+"language",Bo=zo.dcterms+"title";
function Co(a,b){var c={};return function(d,e){var f,g,k=d.r||c,h=e.r||c;if(a==Bo&&(f="main"==k["http://idpf.org/epub/vocab/package/#title-type"],g="main"==h["http://idpf.org/epub/vocab/package/#title-type"],f!=g))return f?-1:1;f=parseInt(k["http://idpf.org/epub/vocab/package/#display-seq"],10);isNaN(f)&&(f=Number.MAX_VALUE);g=parseInt(h["http://idpf.org/epub/vocab/package/#display-seq"],10);isNaN(g)&&(g=Number.MAX_VALUE);return f!=g?f-g:a!=Ao&&b&&(f=(k[Ao]||k["http://idpf.org/epub/vocab/package/#alternate-script"])==
b,g=(h[Ao]||h["http://idpf.org/epub/vocab/package/#alternate-script"])==b,f!=g)?f?-1:1:d.o-e.o}}
function Do(a,b){function c(a){for(var b in a){var d=a[b];d.sort(Co(b,l));for(var e=0;e<d.length;e++){var f=d[e].r;f&&c(f)}}}function d(a){return cb(a,function(a){return bb(a,function(a){var b={v:a.value,o:a.N};a.ae&&(b.s=a.scheme);if(a.id||a.lang){var c=h[a.id];if(c||a.lang)a.lang&&(a={name:Ao,value:a.lang,lang:null,id:null,Lc:a.id,scheme:null,N:a.N},c?c.push(a):c=[a]),c=ab(c,function(a){return a.name}),b.r=d(c)}return b})})}function e(a){if(a&&(a=a.match(/^\s*(([^:]*):)?(\S+)\s*$/))){var b=a[1]?
f[a[1]]:"http://idpf.org/epub/vocab/package/#";if(b)return b+a[3]}return null}var f;if(b){f={};for(var g in zo)f[g]=zo[g];for(;null!=(g=b.match(/(^\s*[A-Z_a-z\u007F-\uFFFF][-.A-Z_a-z0-9\u007F-\uFFFF]*):\s*(\S+)/));)b=b.substr(g[0].length),f[g[1]]=g[2]}else f=zo;var k=1;g=Jh(Kh(a),function(a){if("meta"==a.localName){var b=e(a.getAttribute("property"));if(b)return{name:b,value:a.textContent,id:a.getAttribute("id"),N:k++,Lc:a.getAttribute("refines"),lang:null,scheme:e(a.getAttribute("scheme"))}}else if("http://purl.org/dc/elements/1.1/"==
a.namespaceURI)return{name:zo.dcterms+a.localName,N:k++,lang:a.getAttribute("xml:lang"),value:a.textContent,id:a.getAttribute("id"),Lc:null,scheme:null};return null});var h=ab(g,function(a){return a.Lc});g=d(ab(g,function(a){return a.Lc?null:a.name}));var l=null;g[Ao]&&(l=g[Ao][0].v);c(g);return g}function Eo(){var a=window.MathJax;return a?a.Hub:null}var Fo={"appliaction/xhtml+xml":!0,"image/jpeg":!0,"image/png":!0,"image/svg+xml":!0,"image/gif":!0,"audio/mp3":!0};
function uo(a,b){this.e=a;this.g=this.d=this.b=this.h=this.f=null;this.k=b;this.j=null;this.D={};this.lang=null;this.u=0;this.l={};this.I=this.B=this.M=null;this.w={};this.A=null;Eo()&&(Gi["http://www.w3.org/1998/Math/MathML"]=!0)}function Go(a,b){return a.k?b.substr(0,a.k.length)==a.k?decodeURI(b.substr(a.k.length)):null:b}
function vo(a,b,c,d,e){a.f=b;var f=oh(new ph([b.b]),"package"),g=Lh(f,"unique-identifier")[0];g&&(g=wh(b,b.url+"#"+g))&&(a.j=g.textContent.replace(/[ \n\r\t]/g,""));var k={};a.h=bb(Gh(oh(oh(f,"manifest"),"item")),function(c){var d=new wo,e=b.url;d.id=c.getAttribute("id");d.src=sa(c.getAttribute("href"),e);d.d=c.getAttribute("media-type");if(e=c.getAttribute("properties")){for(var e=e.split(/\s+/),f={},g=0;g<e.length;g++)f[e[g]]=!0;d.f=f}(c=c.getAttribute("fallback"))&&!Fo[d.d]&&(k[d.src]=c);!a.B&&
d.f.nav&&(a.B=d);!a.I&&d.f["cover-image"]&&(a.I=d);return d});a.d=Za(a.h,xo);a.g=Za(a.h,function(b){return Go(a,b.src)});for(var h in k)for(g=h;;){g=a.d[k[g]];if(!g)break;if(Fo[g.d]){a.w[h]=g.src;break}g=g.src}a.b=bb(Gh(oh(oh(f,"spine"),"itemref")),function(b,c){var d=b.getAttribute("idref");if(d=a.d[d])d.g=b,d.F=c;return d});if(h=Lh(oh(f,"spine"),"toc")[0])a.M=a.d[h];if(h=Lh(oh(f,"spine"),"page-progression-direction")[0]){a:switch(h){case "ltr":h="ltr";break a;case "rtl":h="rtl";break a;default:throw Error("unknown PageProgression: "+
h);}a.A=h}var g=c?Lh(oh(oh(Fh(oh(oh(new ph([c.b]),"encryption"),"EncryptedData"),Eh()),"CipherData"),"CipherReference"),"URI"):[],l=Gh(oh(oh(f,"bindings"),"mediaType"));for(c=0;c<l.length;c++){var n=l[c].getAttribute("handler");(h=l[c].getAttribute("media-type"))&&n&&a.d[n]&&(a.D[h]=a.d[n].src)}a.l=Do(oh(f,"metadata"),Lh(f,"prefix")[0]);a.l[Ao]&&(a.lang=a.l[Ao][0].v);if(!d){if(0<g.length&&a.j)for(d=yo(a.j),c=0;c<g.length;c++)a.e.k[a.k+g[c]]=d;return N(!0)}f=new Pa;l={};if(0<g.length&&a.j)for(h="1040:"+
Qe(a.j),c=0;c<g.length;c++)l[g[c]]=h;for(c=0;c<d.length;c++){var p=d[c];if(n=p.n){var r=decodeURI(n),g=a.g[r];h=null;g&&(g.j=0!=p.m,g.h=p.c,g.d&&(h=g.d.replace(/\s+/g,"")));g=l[r];if(h||g)f.append(n),f.append(" "),f.append(h||"application/octet-stream"),g&&(f.append(" "),f.append(g)),f.append("\n")}}Ho(a);return qf(e,"","POST",f.toString(),"text/plain")}function Ho(a){for(var b=0,c=0;c<a.b.length;c++){var d=a.b[c],e=Math.ceil(d.h/1024);d.e=b;d.b=e;b+=e}a.u=b}
function Io(a,b,c){var d=new wo;d.F=0;d.id="item1";d.src=b;a.d={item1:d};a.g={};a.g[b]=d;a.h=[d];a.b=a.h;c?(a=a.e,d=M("EPUBDocStore.load"),b=qa(b),(a.l[b]=jo(a,{status:200,url:b,contentType:c.contentType,responseText:null,responseXML:c,ac:null})).oa(d),c=O(d)):c=N(null);return c}function Jo(a,b,c){var d=a.b[b],e=M("getCFI");a.e.load(d.src).then(function(a){var b=uh(a,c),k=null;b&&(a=rh(a,b,0,!1),k=new rb,ub(k,b,c-a),d.g&&ub(k,d.g,0),k=k.toString());Q(e,k)});return O(e)}
function Ko(a,b){return We("resolveFragment",function(c){if(b){var d=new rb;sb(d,b);var e;if(a.f){var f=tb(d,a.f.b);if(1!=f.da.nodeType||f.K||!f.Ib){Q(c,null);return}var g=f.da,k=g.getAttribute("idref");if("itemref"!=g.localName||!k||!a.d[k]){Q(c,null);return}e=a.d[k];d=f.Ib}else e=a.b[0];a.e.load(e.src).then(function(a){var b=tb(d,a.b);a=rh(a,b.da,b.offset,b.K);Q(c,{F:e.F,ka:a,O:-1})})}else Q(c,null)},function(a,d){u.b(d,"Cannot resolve fragment:",b);Q(a,null)})}
function Lo(a,b){return We("resolveEPage",function(c){if(0>=b)Q(c,{F:0,ka:0,O:-1});else{var d=Xa(a.b.length,function(c){c=a.b[c];return c.e+c.b>b}),e=a.b[d];a.e.load(e.src).then(function(a){b-=e.e;b>e.b&&(b=e.b);var g=0;0<b&&(a=th(a),g=Math.round(a*b/e.b),g==a&&g--);Q(c,{F:d,ka:g,O:-1})})}},function(a,d){u.b(d,"Cannot resolve epage:",b);Q(a,null)})}
function Mo(a,b){var c=a.b[b.F];if(0>=b.ka)return N(c.e);var d=M("getEPage");a.e.load(c.src).then(function(a){a=th(a);var f=Math.min(a,b.ka);Q(d,c.e+f*c.b/a)});return O(d)}function No(a,b,c,d){this.b=a;this.viewport=b;this.f=c;this.tb=[];this.ka=this.O=this.F=0;this.Q=dc(d);this.e=new Yl(b.f)}function Oo(a){var b=a.tb[a.F];return b?b.Ya[a.O]:null}m=No.prototype;m.bb=function(){if(this.b.A)return this.b.A;var a=this.tb[this.F];return a?a.Ha.fa:null};
function Po(a){var b=M("renderPage");Qo(a).then(function(c){if(c){var d=-1;if(0>a.O){var d=a.ka,e=Xa(c.Ia.length,function(a){return Zn(c.Ha,c.Ia[a])>d});a.O=e==c.Ia.length?Number.POSITIVE_INFINITY:e-1}var f=c.Ya[a.O];f?(a.ka=f.offset,Q(b,f)):nf(function(b){if(a.O<c.Ia.length)R(b);else if(c.complete)a.O=c.Ia.length-1,R(b);else{var e=c.Ia[c.Ia.length-1],h=Ro(a,c,e);co(c.Ha,h,e).then(function(l){h.L.style.display="none";h.L.style.visibility="visible";h.L.setAttribute("data-vivliostyle-page-side",h.f);
(e=l)?(c.Ya[e.d-1]=h,c.Ia.push(e),0<=d&&Zn(c.Ha,e)>d?(f=h,a.O=c.Ia.length-2,R(b)):(h.j=0==c.item.F&&0==e.d-1,pf(b))):(c.Ya.push(h),f=h,a.O=c.Ia.length-1,0>d&&(a.ka=h.offset),c.complete=!0,h.j=0==c.item.F&&0==a.O,h.k=c.item.F==a.b.b.length-1,R(b))})}}).then(function(){if(f=f||c.Ya[a.O])Q(b,f);else{var e=c.Ia[a.O];0>d&&(a.ka=Zn(c.Ha,e));var k=Ro(a,c,e);co(c.Ha,k,e).then(function(d){k.L.style.display="none";k.L.style.visibility="visible";k.L.setAttribute("data-vivliostyle-page-side",k.f);(e=d)?(c.Ya[e.d-
1]=k,c.Ia[a.O+1]=e):(c.Ya.push(k),c.complete=!0,k.k=c.item.F==a.b.b.length-1);k.j=0==c.item.F&&0==a.O;Q(b,k)})}})}else Q(b,null)});return O(b)}m.Mc=function(){return So(this,this.b.b.length-1,Number.POSITIVE_INFINITY)};function So(a,b,c){var d=M("renderAllPages"),e=a.F,f=a.O;a.F=0;nf(function(d){a.O=a.F==b?c:Number.POSITIVE_INFINITY;Po(a).then(function(){++a.F>b?R(d):pf(d)})}).then(function(){a.F=e;a.O=f;Po(a).oa(d)});return O(d)}m.xd=function(){this.O=this.F=0;return Po(this)};
m.yd=function(){this.F=this.b.b.length-1;this.O=Number.POSITIVE_INFINITY;return Po(this)};m.nextPage=function(){var a=this,b=M("nextPage");Qo(a).then(function(c){if(c){if(c.complete&&a.O==c.Ia.length-1){if(a.F>=a.b.b.length-1){Q(b,null);return}a.F++;a.O=0}else a.O++;Po(a).oa(b)}else Q(b,null)});return O(b)};m.Kc=function(){if(0==this.O){if(0==this.F)return N(null);this.F--;this.O=Number.POSITIVE_INFINITY}else this.O--;return Po(this)};
function To(a,b){var c="left"===b.f,d="ltr"===a.bb();return!c&&d||c&&!d}function Uo(a){var b=M("getCurrentSpread"),c=Oo(a);if(!c)return N({left:null,right:null});var d=a.F,e=a.O,f="left"===c.f;(To(a,c)?a.Kc():a.nextPage()).then(function(g){a.F=d;a.O=e;Po(a).then(function(){f?Q(b,{left:c,right:g}):Q(b,{left:g,right:c})})});return O(b)}m.Dd=function(){var a=Oo(this);if(!a)return N(null);var a=To(this,a),b=this.nextPage();if(a)return b;var c=this;return b.jc(function(){return c.nextPage()})};
m.Gd=function(){var a=Oo(this);if(!a)return N(null);var a=To(this,a),b=this.Kc();if(a){var c=this;return b.jc(function(){return c.Kc()})}return b};function Vo(a,b){var c=M("navigateToEPage");Lo(a.b,b).then(function(b){b&&(a.F=b.F,a.O=b.O,a.ka=b.ka);Po(a).oa(c)});return O(c)}function Wo(a,b){var c=M("navigateToCFI");Ko(a.b,b).then(function(b){b&&(a.F=b.F,a.O=b.O,a.ka=b.ka);Po(a).oa(c)});return O(c)}
function Xo(a,b){u.d("Navigate to",b);var c=Go(a.b,qa(b));if(null==c&&(a.b.f&&b.match(/^#epubcfi\(/)&&(c=Go(a.b,a.b.f.url)),null==c))return N(null);var d=a.b.g[c];if(!d)return a.b.f&&c==Go(a.b,a.b.f.url)&&(c=b.indexOf("#"),0<=c)?Wo(a,b.substr(c+1)):N(null);d.F!=a.F&&(a.F=d.F,a.O=0);var e=M("navigateTo");Qo(a).then(function(c){var d=wh(c.Z,b);d&&(a.ka=qh(c.Z,d),a.O=-1);Po(a).oa(e)});return O(e)}
function Ro(a,b,c){var d=b.Ha.viewport,e=d.b.createElement("div");d.d.appendChild(e);e.style.position="relative";e.style.visibility="hidden";e.style.left="0px";e.style.top="0px";var f=new Qh(e);f.F=b.item.F;f.position=c;f.offset=Zn(b.Ha,c);d!==a.viewport&&(a=gc(a.viewport.width,a.viewport.height,d.width,d.height),a=eg(null,new ac(a,null)),f.g.push(new Nh(e,"transform",a)));return f}
function Yo(a,b){var c=Eo();if(c){var d=b.ownerDocument,e=d.createElement("span");b.appendChild(e);d=d.importNode(a,!0);e.appendChild(d);d=c.queue;d.Push(["Typeset",c,e]);var c=M("navigateToEPage"),f=ff(c);d.Push(function(){f.Ua(e)});return O(c)}return N(null)}
m.Fc=function(a){var b=this;return function(c,d){var e;if("object"==c.localName&&"http://www.w3.org/1999/xhtml"==c.namespaceURI){var f=c.getAttribute("data");e=null;if(f){var f=sa(f,a.url),g=c.getAttribute("media-type");if(!g){var k=Go(b.b,f);k&&(k=b.b.g[k])&&(g=k.d)}if(g&&(k=b.b.D[g])){e=b.viewport.b.createElement("iframe");e.style.border="none";var f=Ta(f),h=Ta(g),g=new Pa;g.append(k);g.append("?src=");g.append(f);g.append("&type=");g.append(h);for(k=c.firstChild;k;k=k.nextSibling)1==k.nodeType&&
(h=k,"param"==h.localName&&"http://www.w3.org/1999/xhtml"==h.namespaceURI&&(f=h.getAttribute("name"),h=h.getAttribute("value"),f&&h&&(g.append("&"),g.append(encodeURIComponent(f)),g.append("="),g.append(encodeURIComponent(h)))));e.setAttribute("src",g.toString());(g=c.getAttribute("width"))&&e.setAttribute("width",g);(g=c.getAttribute("height"))&&e.setAttribute("height",g)}}e||(e=b.viewport.b.createElement("span"),e.setAttribute("data-adapt-process-children","true"));e=N(e)}else if("http://www.w3.org/1998/Math/MathML"==
c.namespaceURI)e=Yo(c,d);else if("http://example.com/sse"==c.namespaceURI){e=d?d.ownerDocument:b.viewport.b;g=c.localName;switch(g){case "t":case "tab":case "ec":case "nt":case "fraction":case "comment":case "mark":g="span";break;case "ruby":case "rp":case "rt":break;default:g="div"}e=e.createElement(g);e.setAttribute("data-adapt-process-children","true");e=N(e)}else e=N(null);return e}};
function Qo(a){if(a.F>=a.b.b.length)return N(null);var b=a.tb[a.F];if(b)return N(b);var c=a.b.b[a.F],d=a.b.e,e=M("getPageViewItem");d.load(c.src).then(function(f){0==c.b&&1==a.b.b.length&&(c.b=Math.ceil(th(f)/2700),a.b.u=c.b);var g=d.b[f.url],k=a.Fc(f),h=a.viewport,l=Wn(g,h.width,h.height,h.fontSize);if(l.width!=h.width||l.height!=h.height||l.fontSize!=h.fontSize)h=new $l(h.f,l.fontSize,h.root,l.width,l.height);var l=a.tb[a.F-1],n=new Xn(g,f,a.b.lang,h,a.e,a.f,k,a.b.w,l?l.Ha.va+l.Ya.length:0);l&&
Tn(n.j,l.Ha.j);n.Q=a.Q;Yn(n).then(function(){b={item:c,Z:f,Ha:n,Ia:[null],Ya:[],complete:!1};a.tb[a.F]=b;Q(e,b)})});return O(e)}function Zo(a){return{F:a.F,O:a.O,ka:a.ka}}function $o(a,b){b?(a.F=b.F,a.O=-1,a.ka=b.ka):(a.F=0,a.O=0,a.ka=0);return So(a,a.F,a.O)}
m.bc=function(){var a=this.b,b=a.B||a.M;if(!b)return N(null);var c=M("showTOC");this.d||(this.d=new no(a.e,b.src,a.lang,this.e,this.f,this.Q,this,a.w));var a=this.viewport,b=Math.min(350,Math.round(.67*a.width)-16),d=a.height-6,e=a.b.createElement("div");a.root.appendChild(e);e.style.position="absolute";e.style.visibility="hidden";e.style.left="3px";e.style.top="3px";e.style.width=b+10+"px";e.style.maxHeight=d+"px";e.style.overflow="scroll";e.style.overflowX="hidden";e.style.background="#EEE";e.style.border=
"1px outset #999";e.style.borderRadius="2px";e.style.boxShadow=" 5px 5px rgba(128,128,128,0.3)";this.d.bc(e,a,b,d,this.viewport.fontSize).then(function(a){e.style.visibility="visible";Q(c,a)});return O(c)};m.Zb=function(){this.d&&this.d.Zb()};m.ad=function(){return this.d&&this.d.ad()};function ap(a,b,c,d){var e=this;this.h=a;this.$a=b;b.setAttribute("data-vivliostyle-viewer-viewport",!0);b.setAttribute("data-vivliostyle-viewer-status","loading");this.Fa=c;this.Ea=d;this.fa=new jh(a.document.head,b);this.w="";this.g=null;this.D=this.d=!1;this.f=this.j=this.e=this.l=null;this.fontSize=16;this.zoom=1;this.M=!1;this.Mc=!0;this.Q=cc();this.B=function(){};this.k=function(){};this.I=function(){e.d=!0;e.B()};this.u=function(){};this.$={loadEPUB:this.ma,loadXML:this.pa,configure:this.A,
moveTo:this.va,toc:this.bc};bp(this)}function bp(a){pa(1,function(a){cp(this,{t:"debug",content:a})}.bind(a));pa(2,function(a){cp(this,{t:"info",content:a})}.bind(a));pa(3,function(a){cp(this,{t:"warn",content:a})}.bind(a));pa(4,function(a){cp(this,{t:"error",content:a})}.bind(a))}function cp(a,b){b.i=a.Fa;a.Ea(b)}
ap.prototype.ma=function(a){fn.b("loadEPUB");fn.b("loadFirstPage");this.$a.setAttribute("data-vivliostyle-viewer-status","loading");var b=a.url,c=a.fragment,d=!!a.zipmeta,e=a.userStyleSheet;this.viewport=null;var f=M("loadEPUB"),g=this;g.A(a).then(function(){var a=new qo;if(e)for(var h=0;h<e.length;h++)mo(a,e[h]);lo(a).then(function(){var e=sa(b,g.h.location.href);g.w=e;so(a,e,d).then(function(a){g.g=a;Ko(g.g,c).then(function(a){g.f=a;dp(g).then(function(){g.$a.setAttribute("data-vivliostyle-viewer-status",
"complete");fn.d("loadEPUB");cp(g,{t:"loaded",metadata:g.g.l});Q(f,!0)})})})})});return O(f)};
ap.prototype.pa=function(a){fn.b("loadXML");fn.b("loadFirstPage");this.$a.setAttribute("data-vivliostyle-viewer-status","loading");var b=a.url,c=a.document,d=a.fragment,e=a.userStyleSheet;this.viewport=null;var f=M("loadXML"),g=this;g.A(a).then(function(){var a=new qo;if(e)for(var h=0;h<e.length;h++)mo(a,e[h]);lo(a).then(function(){var e=sa(b,g.h.location.href);g.w=e;g.g=new uo(a,"");Io(g.g,e,c).then(function(){Ko(g.g,d).then(function(a){g.f=a;dp(g).then(function(){g.$a.setAttribute("data-vivliostyle-viewer-status",
"complete");fn.d("loadXML");cp(g,{t:"loaded"});Q(f,!0)})})})})});return O(f)};function ep(a,b){var c=parseFloat(b),d=/[a-z]+$/,e;if("string"===typeof b&&(e=b.match(d))){d=e[0];if("em"===d||"rem"===d)return c*a.fontSize;if("ex"===d||"rex"===d)return c*qc.ex*a.fontSize/qc.em;if(d=qc[d])return c*d}return c}
ap.prototype.A=function(a){"boolean"==typeof a.autoresize&&(a.autoresize?(this.l=null,this.h.addEventListener("resize",this.I,!1),this.d=!0):this.h.removeEventListener("resize",this.I,!1));if("number"==typeof a.fontSize){var b=a.fontSize;5<=b&&72>=b&&this.fontSize!=b&&(this.fontSize=b,this.d=!0)}"object"==typeof a.viewport&&a.viewport&&(b=a.viewport,b={marginLeft:ep(this,b["margin-left"])||0,marginRight:ep(this,b["margin-right"])||0,marginTop:ep(this,b["margin-top"])||0,marginBottom:ep(this,b["margin-bottom"])||
0,width:ep(this,b.width)||0,height:ep(this,b.height)||0},200<=b.width||200<=b.height)&&(this.h.removeEventListener("resize",this.I,!1),this.l=b,this.d=!0);"boolean"==typeof a.hyphenate&&(this.Q.zc=a.hyphenate,this.d=!0);"boolean"==typeof a.horizontal&&(this.Q.yc=a.horizontal,this.d=!0);"boolean"==typeof a.nightMode&&(this.Q.Hc=a.nightMode,this.d=!0);"number"==typeof a.lineHeight&&(this.Q.lineHeight=a.lineHeight,this.d=!0);"number"==typeof a.columnWidth&&(this.Q.vc=a.columnWidth,this.d=!0);"string"==
typeof a.fontFamily&&(this.Q.fontFamily=a.fontFamily,this.d=!0);"boolean"==typeof a.load&&(this.M=a.load);"boolean"==typeof a.renderAllPages&&(this.Mc=a.renderAllPages);"string"==typeof a.userAgentRootURL&&(ra=a.userAgentRootURL);"boolean"==typeof a.spreadView&&a.spreadView!==this.Q.Va&&(this.viewport=null,this.Q.Va=a.spreadView,this.d=!0);"number"==typeof a.pageBorder&&a.pageBorder!==this.Q.Eb&&(this.viewport=null,this.Q.Eb=a.pageBorder,this.d=!0);"number"==typeof a.zoom&&a.zoom!==this.zoom&&(this.zoom=
a.zoom,this.D=!0);return N(!0)};function fp(a){var b=[];a.e&&(b.push(a.e),a.e=null);a.j&&(b.push(a.j.left),b.push(a.j.right),a.j=null);b.forEach(function(a){a&&(w(a.L,"display","none"),a.removeEventListener("hyperlink",this.u,!1))},a)}function gp(a,b){b.addEventListener("hyperlink",a.u,!1);w(b.L,"visibility","visible");w(b.L,"display","block")}function hp(a,b){fp(a);a.e=b;gp(a,b)}
function ip(a){var b=M("reportPosition");a.f||(a.f=Zo(a.b));Jo(a.g,a.f.F,a.f.ka).then(function(c){var d=a.e;(a.M&&0<d.e.length?pg(d.e):N(!0)).then(function(){jp(a,d,c).oa(b)})});return O(b)}function kp(a){var b=a.$a;if(a.l){var c=a.l;b.style.marginLeft=c.marginLeft+"px";b.style.marginRight=c.marginRight+"px";b.style.marginTop=c.marginTop+"px";b.style.marginBottom=c.marginBottom+"px";return new $l(a.h,a.fontSize,b,c.width,c.height)}return new $l(a.h,a.fontSize,b)}
function lp(a){if(a.l||!a.viewport||a.viewport.fontSize!=a.fontSize)return!1;var b=kp(a);if(!(b=b.width==a.viewport.width&&b.height==a.viewport.height)&&(b=a.b)){a:{a=a.b.tb;for(b=0;b<a.length;b++){var c=a[b];if(c)for(var c=c.Ya,d=0;d<c.length;d++){var e=c[d];if(e.D&&e.B){a=!0;break a}}}a=!1}b=!a}return b}
function mp(a){if(a.b){a.b.Zb();for(var b=a.b.tb,c=0;c<b.length;c++){var d=b[c];if(d)for(var d=d.Ya,e;e=d.shift();)e=e.L,e.parentNode.removeChild(e)}}a.viewport=kp(a);b=a.viewport;w(b.e,"width","");w(b.e,"height","");w(b.d,"width","");w(b.d,"height","");w(b.d,"transform","");a.b=new No(a.g,a.viewport,a.fa,a.Q)}
function np(a,b){a.D=!1;if(a.Q.Va)return Uo(a.b).jc(function(c){fp(a);a.j=c;c.left&&(gp(a,c.left),c.right||c.left.L.setAttribute("data-vivliostyle-unpaired-page",!0));c.right&&(gp(a,c.right),c.left||c.right.L.setAttribute("data-vivliostyle-unpaired-page",!0));c=op(a,c);a.viewport.zoom(c.width,c.height,a.zoom);a.e=b;return N(null)});hp(a,b);a.viewport.zoom(b.b.width,b.b.height,a.zoom);a.e=b;return N(null)}
function op(a,b){var c=0,d=0;b.left&&(c+=b.left.b.width,d=b.left.b.height);b.right&&(c+=b.right.b.width,d=Math.max(d,b.right.b.height));b.left&&b.right&&(c+=2*a.Q.Eb);return{width:c,height:d}}var pp={Od:"fit inside viewport"};
function dp(a){a.d=!1;if(lp(a))return N(!0);"complete"===a.$a.getAttribute("data-vivliostyle-viewer-status")&&a.$a.setAttribute("data-vivliostyle-viewer-status","resizing");cp(a,{t:"resizestart"});var b=M("resize");a.b&&!a.f&&(a.f=Zo(a.b));mp(a);$o(a.b,a.f).then(function(c){np(a,c).then(function(){ip(a).then(function(c){fn.d("loadFirstPage");(a.Mc?a.b.Mc():N(null)).then(function(){a.$a.setAttribute("data-vivliostyle-viewer-status","complete");cp(a,{t:"resizeend"});Q(b,c)})})})});return O(b)}
function jp(a,b,c){var d=M("sendLocationNotification"),e={t:"nav",first:b.j,last:b.k};Mo(a.g,a.f).then(function(b){e.epage=b;e.epageCount=a.g.u;c&&(e.cfi=c);cp(a,e);Q(d,!0)});return O(d)}ap.prototype.bb=function(){return this.b?this.b.bb():null};
ap.prototype.va=function(a){var b=this;if("string"==typeof a.where)switch(a.where){case "next":a=this.Q.Va?this.b.Dd:this.b.nextPage;break;case "previous":a=this.Q.Va?this.b.Gd:this.b.Kc;break;case "last":a=this.b.yd;break;case "first":a=this.b.xd;break;default:return N(!0)}else if("number"==typeof a.epage){var c=a.epage;a=function(){return Vo(b.b,c)}}else if("string"==typeof a.url){var d=a.url;a=function(){return Xo(b.b,d)}}else return N(!0);var e=M("nextPage");a.call(b.b).then(function(a){a?(b.f=
null,np(b,a).then(function(){ip(b).oa(e)})):Q(e,!0)});return O(e)};ap.prototype.bc=function(a){var b=!!a.autohide;a=a.v;var c=this.b.ad();if(c){if("show"==a)return N(!0)}else if("hide"==a)return N(!0);if(c)return this.b.Zb(),N(!0);var d=this,e=M("showTOC");this.b.bc(b).then(function(a){if(a){if(b){var c=function(){d.b.Zb()};a.addEventListener("hyperlink",c,!1);a.L.addEventListener("click",c,!1)}a.addEventListener("hyperlink",d.u,!1)}Q(e,!0)});return O(e)};
function qp(a,b){var c=b.a||"";return We("runCommand",function(d){var e=a.$[c];e?e.call(a,b).then(function(){cp(a,{t:"done",a:c});Q(d,!0)}):(u.error("No such action:",c),Q(d,!0))},function(a,b){u.error(b,"Error during action:",c);Q(a,!0)})}function rp(a){return"string"==typeof a?JSON.parse(a):a}
function sp(a,b){var c=rp(b),d=null;Ye(function(){var b=M("commandLoop"),f=Re.d;a.u=function(b){var c={t:"hyperlink",href:b.href,internal:b.href.substr(0,a.w.length)==a.w};Ze(f,function(){cp(a,c);return N(!0)})};nf(function(b){if(a.d)dp(a).then(function(){pf(b)});else if(a.D)a.e&&np(a,a.e).then(function(){pf(b)});else if(c){var e=c;c=null;qp(a,e).then(function(){pf(b)})}else e=M("waitForCommand"),d=ff(e,self),O(e).then(function(){pf(b)})}).oa(b);return O(b)});a.B=function(){var a=d;a&&(d=null,a.Ua())};
a.k=function(b){if(c)return!1;c=rp(b);a.B();return!0};a.h.adapt_command=a.k};Array.b||(Array.b=function(a,b,c){b&&c&&(b=b.bind(c));c=[];for(var d=a.length,e=0;e<d;e++)c[e]=b?b(a[e]):a[e];return c});Object.Bb||(Object.Bb=function(a,b){Object.keys(b).forEach(function(c){a[c]=b[c]});return a});function tp(a){var b={};Object.keys(a).forEach(function(c){var d=a[c];switch(c){case "autoResize":b.autoresize=d;break;case "pageBorderWidth":b.pageBorder=d;break;default:b[c]=d}});return b}function up(a,b){this.f=a;this.b=new ap(a.window||window,a.viewportElement,"main",this.wd.bind(this));this.e={autoResize:!0,fontSize:16,pageBorderWidth:1,renderAllPages:!0,spreadView:!1,zoom:1};b&&this.rd(b);this.d=new db}m=up.prototype;
m.rd=function(a){var b=Object.Bb({a:"configure"},tp(a));this.b.k(b);Object.Bb(this.e,a)};m.wd=function(a){var b={type:a.t};Object.keys(a).forEach(function(c){"t"!==c&&(b[c]=a[c])});eb(this.d,b)};m.Id=function(a,b){this.d.addEventListener(a,b,!1)};m.Ld=function(a,b){this.d.removeEventListener(a,b,!1)};m.zd=function(a,b,c){a||eb(this.d,{type:"error",content:"No URL specified"});vp(this,a,null,b,c)};m.Jd=function(a,b,c){a||eb(this.d,{type:"error",content:"No URL specified"});vp(this,null,a,b,c)};
function vp(a,b,c,d,e){d=d||{};var f,g=d.userStyleSheet;g&&(f=g.map(function(a){return{url:a.url||null,text:a.text||null}}));e&&Object.Bb(a.e,e);b=Object.Bb({a:b?"loadXML":"loadEPUB",userAgentRootURL:a.f.userAgentRootURL,url:b||c,document:d.documentObject,fragment:d.fragment,userStyleSheet:f},tp(a.e));sp(a.b,b)}m.bb=function(){return this.b.bb()};
m.Bd=function(a){a:switch(a){case "left":a="ltr"===this.bb()?"previous":"next";break a;case "right":a="ltr"===this.bb()?"next":"previous";break a}this.b.k({a:"moveTo",where:a})};m.Ad=function(a){this.b.k({a:"moveTo",url:a})};m.Kd=function(a){var b;a:{b=this.b;if(!b.e)throw Error("no page exists.");switch(a){case "fit inside viewport":a=b.Q.Va?op(b,b.j):b.e.b;b=Math.min(b.viewport.width/a.width,b.viewport.height/a.height);break a;default:throw Error("unknown zoom type: "+a);}}return b};
ca("vivliostyle.viewer.Viewer",up);up.prototype.setOptions=up.prototype.rd;up.prototype.addListener=up.prototype.Id;up.prototype.removeListener=up.prototype.Ld;up.prototype.loadDocument=up.prototype.zd;up.prototype.loadEPUB=up.prototype.Jd;up.prototype.getCurrentPageProgression=up.prototype.bb;up.prototype.navigateToPage=up.prototype.Bd;up.prototype.navigateToInternalUrl=up.prototype.Ad;up.prototype.queryZoomFactor=up.prototype.Kd;ca("vivliostyle.viewer.ZoomType",pp);pp.FIT_INSIDE_VIEWPORT="fit inside viewport";
bn.call(fn,"load_vivliostyle","end",void 0);var wp=16,xp="ltr";function yp(a){window.adapt_command(a)}function zp(){yp({a:"moveTo",where:"ltr"===xp?"previous":"next"})}function Ap(){yp({a:"moveTo",where:"ltr"===xp?"next":"previous"})}
function Bp(a){var b=a.key,c=a.keyIdentifier,d=a.location;if("End"===b||"End"===c)yp({a:"moveTo",where:"last"}),a.preventDefault();else if("Home"===b||"Home"===c)yp({a:"moveTo",where:"first"}),a.preventDefault();else if("ArrowUp"===b||"Up"===b||"Up"===c)yp({a:"moveTo",where:"previous"}),a.preventDefault();else if("ArrowDown"===b||"Down"===b||"Down"===c)yp({a:"moveTo",where:"next"}),a.preventDefault();else if("ArrowRight"===b||"Right"===b||"Right"===c)Ap(),a.preventDefault();else if("ArrowLeft"===
b||"Left"===b||"Left"===c)zp(),a.preventDefault();else if("0"===b||"U+0030"===c)yp({a:"configure",fontSize:Math.round(wp)}),a.preventDefault();else if("t"===b||"U+0054"===c)yp({a:"toc",v:"toggle",autohide:!0}),a.preventDefault();else if("+"===b||"Add"===b||"U+002B"===c||"U+00BB"===c||"U+004B"===c&&d===KeyboardEvent.b)wp*=1.2,yp({a:"configure",fontSize:Math.round(wp)}),a.preventDefault();else if("-"===b||"Subtract"===b||"U+002D"===c||"U+00BD"===c||"U+004D"===c&&d===KeyboardEvent.b)wp/=1.2,yp({a:"configure",
fontSize:Math.round(wp)}),a.preventDefault()}
function Cp(a){switch(a.t){case "loaded":a=a.viewer;var b=xp=a.bb();a.$a.setAttribute("data-vivliostyle-page-progression",b);a.$a.setAttribute("data-vivliostyle-spread-view",a.Q.Va);window.addEventListener("keydown",Bp,!1);document.body.setAttribute("data-vivliostyle-viewer-status","complete");a=document.getElementById("vivliostyle-page-navigation-left");a.addEventListener("click",zp,!1);b=document.getElementById("vivliostyle-page-navigation-right");b.addEventListener("click",Ap,!1);[a,b].forEach(function(a){a.setAttribute("data-vivliostyle-ui-state",
"attention");window.setTimeout(function(){a.removeAttribute("data-vivliostyle-ui-state")},1E3)});break;case "nav":(a=a.cfi)&&location.replace(va(location.href,Ta(a||"")));break;case "hyperlink":a.internal&&yp({a:"moveTo",url:a.href})}}
ca("vivliostyle.viewerapp.main",function(a){var b=a&&a.fragment||ta("f"),c=a&&a.epubURL||ta("b"),d=a&&a.xmlURL||ta("x"),e=a&&a.defaultPageWidth||ta("w"),f=a&&a.defaultPageHeight||ta("h"),g=a&&a.defaultPageSize||ta("size"),k=a&&a.orientation||ta("orientation"),h=ta("spread"),h=a&&a.spreadView||!!h&&"false"!=h,l=a&&a.viewportElement||document.body;a={a:c?"loadEPUB":"loadXML",url:c||d,autoresize:!0,fragment:b,renderAllPages:!0,userAgentRootURL:a&&a.uaRoot||null,document:a&&a.document||null,userStyleSheet:a&&
a.userStyleSheet||null,spreadView:h,pageBorder:1};var n;if(e&&f)n=e+" "+f;else{switch(g){case "A5":e="148mm";f="210mm";break;case "A4":e="210mm";f="297mm";break;case "A3":e="297mm";f="420mm";break;case "B5":e="176mm";f="250mm";break;case "B4":e="250mm";f="353mm";break;case "letter":e="8.5in";f="11in";break;case "legal":e="8.5in";f="14in";break;case "ledger":e="11in",f="17in"}e&&f&&(n=g,"landscape"===k&&(n=n?n+" landscape":null,g=e,e=f,f=g))}e&&f&&(a.viewport={width:e,height:f},g=document.createElement("style"),
g.textContent="@page { size: "+n+"; margin: 0; }",document.head.appendChild(g));sp(new ap(window,l,"main",Cp),a)});
    return enclosingObject.vivliostyle;
}.bind(window));

},{}],3:[function(require,module,exports){
/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

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
/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

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
/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

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
/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

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
/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

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

var PresetSize = [{ name: "A5", description: "A5" }, { name: "A4", description: "A4" }, { name: "A3", description: "A3" }, { name: "B5", description: "B5 (ISO)" }, { name: "B4", description: "B4 (ISO)" }, { name: "JIS-B5", description: "B5 (JIS)" }, { name: "JIS-B4", description: "B4 (JIS)" }, { name: "letter", description: "letter" }, { name: "legal", description: "legal" }, { name: "ledger", description: "ledger" }];

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
/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

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
        profile: _storesUrlParameters2["default"].getParameter("profile") === "true",
        spreadView: _storesUrlParameters2["default"].getParameter("spread") === "true"
    };
}

function getDefaultValues() {
    return {
        fontSize: 16,
        profile: false,
        spreadView: false,
        zoom: 1
    };
}

function ViewerOptions(options) {
    this.fontSize = _knockout2["default"].observable();
    this.profile = _knockout2["default"].observable();
    this.spreadView = _knockout2["default"].observable();
    this.zoom = _knockout2["default"].observable();
    if (options) {
        this.copyFrom(options);
    } else {
        var defaultValues = getDefaultValues();
        var urlOptions = getViewerOptionsFromURL();
        this.fontSize(defaultValues.fontSize);
        this.profile(urlOptions.profile || defaultValues.profile);
        this.spreadView(urlOptions.spreadView || defaultValues.spreadView);
        this.zoom(defaultValues.zoom);
    }
}

ViewerOptions.prototype.copyFrom = function (other) {
    this.fontSize(other.fontSize());
    this.profile(other.profile());
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
/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
function Vivliostyle() {
    this.viewer = null;
    this.constants = null;
    this.profile = null;
}

Vivliostyle.prototype.setInstance = function (vivliostyle) {
    this.viewer = vivliostyle.viewer;
    this.constants = vivliostyle.constants;
    this.profile = vivliostyle.profile;
};

exports["default"] = new Vivliostyle();
module.exports = exports["default"];

},{}],10:[function(require,module,exports){
/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

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
/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

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
/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

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
/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

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
/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

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
/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

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
/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

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
    if (this.viewerOptions.profile()) {
        _modelsVivliostyle2["default"].profile.profiler.enable();
    }
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
/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

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
        if (this.viewerOptions_.profile()) {
            _modelsVivliostyle2["default"].profile.profiler.printTimings();
        }
    }).bind(this));
    this.viewer_.addListener("nav", (function (payload) {
        var cfi = payload.cfi;
        if (cfi) {
            this.documentOptions_.fragment(cfi);
        }
    }).bind(this));
    this.viewer_.addListener("hyperlink", (function (payload) {
        if (payload.internal) {
            this.viewer_.navigateToInternalUrl(payload.href);
        } else {
            window.location.href = payload.href;
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
/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

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
