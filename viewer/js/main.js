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
 *
 * Vivliostyle core 2016.2.0-pre.20160324095258
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
    var n,aa=this;function ba(a,b){var c=a.split("."),d=("undefined"!==typeof enclosingObject&&enclosingObject?enclosingObject:window)||aa;c[0]in d||!d.execScript||d.execScript("var "+c[0]);for(var e;c.length&&(e=c.shift());)c.length||void 0===b?d[e]?d=d[e]:d=d[e]={}:d[e]=b}
function u(a,b){function c(){}c.prototype=b.prototype;a.Cd=b.prototype;a.prototype=new c;a.prototype.constructor=a;a.le=function(a,c,f){for(var g=Array(arguments.length-2),k=2;k<arguments.length;k++)g[k-2]=arguments[k];return b.prototype[c].apply(a,g)}};function ca(a,b,c,d){d=d[b];if(!d)throw Error("unknown writing-mode: "+b);b=d[c||"ltr"];if(!b)throw Error("unknown direction: "+c);for(c=0;c<b.length;c++)if(d=b[c],d=a.replace(d.f,d.b),d!==a)return d;return a}function da(a){var b=ea,c={};Object.keys(b).forEach(function(d){var e=c[d]={},f=b[d];Object.keys(f).forEach(function(b){e[b]=f[b].map(function(b){return{f:new RegExp("(-?)"+(a?b.J:b.K)+"(-?)"),b:"$1"+(a?b.K:b.J)+"$2"}})})});return c}
var ea={"horizontal-tb":{ltr:[{J:"inline-start",K:"left"},{J:"inline-end",K:"right"},{J:"block-start",K:"top"},{J:"block-end",K:"bottom"},{J:"inline-size",K:"width"},{J:"block-size",K:"height"}],rtl:[{J:"inline-start",K:"right"},{J:"inline-end",K:"left"},{J:"block-start",K:"top"},{J:"block-end",K:"bottom"},{J:"inline-size",K:"width"},{J:"block-size",K:"height"}]},"vertical-rl":{ltr:[{J:"inline-start",K:"top"},{J:"inline-end",K:"bottom"},{J:"block-start",K:"right"},{J:"block-end",K:"left"},{J:"inline-size",
K:"height"},{J:"block-size",K:"width"}],rtl:[{J:"inline-start",K:"bottom"},{J:"inline-end",K:"top"},{J:"block-start",K:"right"},{J:"block-end",K:"left"},{J:"inline-size",K:"height"},{J:"block-size",K:"width"}]},"vertical-lr":{ltr:[{J:"inline-start",K:"top"},{J:"inline-end",K:"bottom"},{J:"block-start",K:"left"},{J:"block-end",K:"right"},{J:"inline-size",K:"height"},{J:"block-size",K:"width"}],rtl:[{J:"inline-start",K:"bottom"},{J:"inline-end",K:"top"},{J:"block-start",K:"left"},{J:"block-end",K:"right"},
{J:"inline-size",K:"height"},{J:"block-size",K:"width"}]}},fa=da(!0),ga=da(!1),ha={"horizontal-tb":[{J:"line-left",K:"left"},{J:"line-right",K:"right"},{J:"over",K:"top"},{J:"under",K:"bottom"}],"vertical-rl":[{J:"line-left",K:"top"},{J:"line-right",K:"bottom"},{J:"over",K:"right"},{J:"under",K:"left"}],"vertical-lr":[{J:"line-left",K:"top"},{J:"line-right",K:"bottom"},{J:"over",K:"right"},{J:"under",K:"left"}]};var ia=!1,ja={de:"ltr",ee:"rtl"};ba("vivliostyle.constants.PageProgression",ja);ja.LTR="ltr";ja.RTL="rtl";var ka={Ed:"left",Fd:"right"};ba("vivliostyle.constants.PageSide",ka);ka.LEFT="left";ka.RIGHT="right";function ma(a){var b=a.error,c=b&&(b.frameTrace||b.stack);a=[].concat(a.messages);b&&(0<a.length&&(a=a.concat(["\n"])),a=a.concat([b.toString()]),c&&(a=a.concat(["\n"]).concat(c)));return a}function na(a){a=Array.b(a);var b=null;a[0]instanceof Error&&(b=a.shift());return{error:b,messages:a}}function oa(a){function b(a){return function(b){return a.apply(c,b)}}var c=a||console;this.f=b(c.debug||c.log);this.h=b(c.info||c.log);this.j=b(c.warn||c.log);this.g=b(c.error||c.log);this.d={}}
function pa(a,b,c){(a=a.d[b])&&a.forEach(function(a){a(c)})}function qa(a,b){var c=v,d=c.d[a];d||(d=c.d[a]=[]);d.push(b)}oa.prototype.debug=function(a){var b=na(arguments);this.f(ma(b));pa(this,1,b)};oa.prototype.e=function(a){var b=na(arguments);this.h(ma(b));pa(this,2,b)};oa.prototype.b=function(a){var b=na(arguments);this.j(ma(b));pa(this,3,b)};oa.prototype.error=function(a){var b=na(arguments);this.g(ma(b));pa(this,4,b)};var v=new oa;function ra(a){var b=a.match(/^([^#]*)/);return b?b[1]:a}var ta=window.location.href;
function ua(a,b){if(!b||a.match(/^\w{2,}:/))return a.toLowerCase().match("^javascript:")?"#":a;b.match(/^\w{2,}:\/\/[^\/]+$/)&&(b+="/");var c;if(a.match(/^\/\//))return(c=b.match(/^(\w{2,}:)\/\//))?c[1]+a:a;if(a.match(/^\//))return(c=b.match(/^(\w{2,}:\/\/[^\/]+)\//))?c[1]+a:a;a.match(/^\.(\/|$)/)&&(a=a.substr(1));c=b;var d=c.match(/^([^#?]*)/);b=d?d[1]:c;if(a.match(/^\#/))return b+a;c=b.lastIndexOf("/");if(0>c)return a;for(d=b.substr(0,c+1)+a;;){c=d.indexOf("/../");if(0>=c)break;var e=d.lastIndexOf("/",
c-1);if(0>=e)break;d=d.substr(0,e)+d.substr(c+3)}return d.replace(/\/(\.\/)+/g,"/")}function va(a){a=new RegExp("#(.*&)?"+wa(a)+"=([^#&]*)");return(a=window.location.href.match(a))?a[2]:null}function xa(a,b){var c=new RegExp("#(.*&)?"+wa("f")+"=([^#&]*)"),d=a.match(c);return d?(c=d[2].length,d=d.index+d[0].length-c,a.substr(0,d)+b+a.substr(d+c)):a.match(/#/)?a+"&f="+b:a+"#f="+b}function ya(a){return null==a?a:a.toString()}function za(){this.b=[null]}
za.prototype.length=function(){return this.b.length-1};function Aa(){return Ba.replace(/-[a-z]/g,function(a){return a.substr(1).toUpperCase()})}var Ca="-webkit- -moz- -ms- -o- -epub- ".split(" "),Da;
a:{var Ea="transform transform-origin hyphens writing-mode text-orientation box-decoration-break column-count column-width column-rule-color column-rule-style column-rule-width font-kerning text-size-adjust line-break tab-size text-align-last text-justify word-break word-wrap text-decoration-color text-decoration-line text-decoration-skip text-decoration-style text-emphasis-color text-emphasis-position text-emphasis-style text-underline-position backface-visibility text-overflow text-combine text-combine-horizontal text-combine-upright text-orientation touch-action".split(" "),Fa=
{},Ga=document.createElement("span"),Ha=Ga.style,Ia=null;try{if(Ga.style.setProperty("-ms-transform-origin","0% 0%"),"0% 0%"==Ga.style.getPropertyValue("-ms-transform-origin")){for(var Ja=0;Ja<Ea.length;Ja++)Fa[Ea[Ja]]="-ms-"+Ea[Ja];Da=Fa;break a}}catch(Ka){}for(Ja=0;Ja<Ea.length;Ja++){var La=Ea[Ja],Ba=null,Ma=null;Ia&&(Ba=Ia+La,Ma=Aa());if(!Ma||null==Ha[Ma])for(var Na=0;Na<Ca.length&&(Ia=Ca[Na],Ba=Ia+La,Ma=Aa(),null==Ha[Ma]);Na++);null!=Ha[Ma]&&(Fa[La]=Ba)}Da=Fa}var Oa=Da;
function w(a,b,c){try{b=Oa[b]||b,"-ms-writing-mode"==b&&"vertical-rl"==c&&(c="tb-rl"),a&&a.style&&a.style.setProperty(b,c)}catch(d){v.b(d)}}function Pa(a,b,c){try{return a.style.getPropertyValue(Oa[b]||b)}catch(d){}return c||""}function Qa(){this.b=[]}Qa.prototype.append=function(a){this.b.push(a);return this};Qa.prototype.toString=function(){var a=this.b.join("");this.b=[a];return a};function Ra(a){return"\\"+a.charCodeAt(0).toString(16)+" "}
function Sa(a){return a.replace(/[^-_a-zA-Z0-9\u0080-\uFFFF]/g,Ra)}function Ta(a){return a.replace(/[\u0000-\u001F"]/g,Ra)}function Ua(a){return a.replace(/[\s+&?=#\u007F-\uFFFF]+/g,encodeURIComponent)}function Va(a){return!!a.match(/^[a-zA-Z\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]$/)}function Wa(a){return"\\u"+(65536|a.charCodeAt(0)).toString(16).substr(1)}function wa(a){return a.replace(/[^-a-zA-Z0-9_]/g,Wa)}
function Xa(a){if(!a)throw"Assert failed";}function Ya(a,b){for(var c=0,d=a;;){Xa(c<=d);Xa(0==c||!b(c-1));Xa(d==a||b(d));if(c==d)return c;var e=c+d>>1;b(e)?d=e:c=e+1}}function Za(a,b){return a-b}function $a(a,b){for(var c={},d=0;d<a.length;d++){var e=a[d],f=b(e);f&&!c[f]&&(c[f]=e)}return c}var ab={};function bb(a,b){for(var c={},d=0;d<a.length;d++){var e=a[d],f=b(e);f&&(c[f]?c[f].push(e):c[f]=[e])}return c}function cb(a,b){for(var c=Array(a.length),d=0;d<a.length;d++)c[d]=b(a[d],d);return c}
function db(a,b){var c={},d;for(d in a)c[d]=b(a[d],d);return c}function eb(){this.e={}}function fb(a,b){var c=a.e[b.type];if(c){b.target=a;b.currentTarget=a;for(var d=0;d<c.length;d++)c[d](b)}}eb.prototype.addEventListener=function(a,b,c){c||((c=this.e[a])?c.push(b):this.e[a]=[b])};eb.prototype.removeEventListener=function(a,b,c){!c&&(a=this.e[a])&&(b=a.indexOf(b),0<=b&&a.splice(b,0))};var gb=null;
function hb(a){if(null==gb){var b=a.ownerDocument,c=b.createElement("div");c.style.position="absolute";c.style.top="0px";c.style.left="0px";c.style.width="100px";c.style.height="100px";c.style.overflow="hidden";c.style.lineHeight="16px";c.style.fontSize="16px";a.appendChild(c);var d=b.createElement("div");d.style.width="0px";d.style.height="14px";d.style.cssFloat="left";c.appendChild(d);d=b.createElement("div");d.style.width="50px";d.style.height="50px";d.style.cssFloat="left";d.style.clear="left";
c.appendChild(d);d=b.createTextNode("a a a a a a a a a a a a a a a a");c.appendChild(d);b=b.createRange();b.setStart(d,0);b.setEnd(d,1);gb=40>b.getBoundingClientRect().left;a.removeChild(c)}return gb}var ib=null;function jb(a){return 1==a.nodeType&&(a=a.getAttribute("id"))&&a.match(/^[-a-zA-Z_0-9.\u007F-\uFFFF]+$/)?a:null}function kb(a){return"^"+a}function lb(a){return a.substr(1)}function mb(a){return a?a.replace(/\^[\[\]\(\),=;^]/g,lb):a}
function nb(a){for(var b={};a;){var c=a.match(/^;([^;=]+)=(([^;]|\^;)*)/);if(!c)break;var d=c[1],e;a:{e=c[2];var f=[];do{var g=e.match(/^(\^,|[^,])*/),k=mb(g[0]);e=e.substr(g[0].length+1);if(!e&&!f.length){e=k;break a}f.push(k)}while(e);e=f}b[d]=e;a=a.substr(c[0].length)}return b}function ob(){}ob.prototype.e=function(a){a.append("!")};ob.prototype.f=function(){return!1};function pb(a,b,c){this.b=a;this.id=b;this.Ua=c}
pb.prototype.e=function(a){a.append("/");a.append(this.b.toString());if(this.id||this.Ua)a.append("["),this.id&&a.append(this.id),this.Ua&&(a.append(";s="),a.append(this.Ua)),a.append("]")};
pb.prototype.f=function(a){if(1!=a.ha.nodeType)throw Error("E_CFI_NOT_ELEMENT");var b=a.ha,c=b.children,d=c.length,e=Math.floor(this.b/2)-1;0>e||0==d?(c=b.firstChild,a.ha=c||b):(c=c[Math.min(e,d-1)],this.b&1&&((b=c.nextSibling)&&1!=b.nodeType?c=b:a.L=!0),a.ha=c);if(this.id&&(a.L||this.id!=jb(a.ha)))throw Error("E_CFI_ID_MISMATCH");a.Ua=this.Ua;return!0};function qb(a,b,c,d){this.offset=a;this.d=b;this.b=c;this.Ua=d}
qb.prototype.f=function(a){if(0<this.offset&&!a.L){for(var b=this.offset,c=a.ha;;){var d=c.nodeType;if(1==d)break;var e=c.nextSibling;if(3<=d&&5>=d){d=c.textContent.length;if(b<=d)break;if(!e){b=d;break}b-=d}if(!e){b=0;break}c=e}a.ha=c;a.offset=b}a.Ua=this.Ua;return!0};
qb.prototype.e=function(a){a.append(":");a.append(this.offset.toString());if(this.d||this.b||this.Ua){a.append("[");if(this.d||this.b)this.d&&a.append(this.d.replace(/[\[\]\(\),=;^]/g,kb)),a.append(","),this.b&&a.append(this.b.replace(/[\[\]\(\),=;^]/g,kb));this.Ua&&(a.append(";s="),a.append(this.Ua));a.append("]")}};function rb(){this.ka=null}
function sb(a,b){var c=b.match(/^#?epubcfi\((.*)\)$/);if(!c)throw Error("E_CFI_NOT_CFI");for(var d=c[1],e=0,f=[];;)switch(d.charAt(e)){case "/":e++;c=d.substr(e).match(/^(0|[1-9][0-9]*)(\[([-a-zA-Z_0-9.\u007F-\uFFFF]+)(;([^\]]|\^\])*)?\])?/);if(!c)throw Error("E_CFI_NUMBER_EXPECTED");var e=e+c[0].length,g=parseInt(c[1],10),k=c[3],c=nb(c[4]);f.push(new pb(g,k,ya(c.s)));break;case ":":e++;c=d.substr(e).match(/^(0|[1-9][0-9]*)(\[((([^\];,]|\^[\];,])*)(,(([^\];,]|\^[\];,])*))?)(;([^]]|\^\])*)?\])?/);
if(!c)throw Error("E_CFI_NUMBER_EXPECTED");e+=c[0].length;g=parseInt(c[1],10);(k=c[4])&&(k=mb(k));var h=c[7];h&&(h=mb(h));c=nb(c[10]);f.push(new qb(g,k,h,ya(c.s)));break;case "!":e++;f.push(new ob);break;case "~":case "@":case "":a.ka=f;return;default:throw Error("E_CFI_PARSE_ERROR");}}function tb(a,b){for(var c={ha:b.documentElement,offset:0,L:!1,Ua:null,Sb:null},d=0;d<a.ka.length;d++)if(!a.ka[d].f(c)){++d<a.ka.length&&(c.Sb=new rb,c.Sb.ka=a.ka.slice(d));break}return c}
rb.prototype.trim=function(a,b){return a.replace(/\s+/g," ").match(b?/^[ -\uD7FF\uE000-\uFFFF]{0,8}/:/[ -\uD7FF\uE000-\uFFFF]{0,8}$/)[0].replace(/^\s/,"").replace(/\s$/,"")};
function ub(a,b,c){for(var d=!1,e=null,f=[],g=b.parentNode,k="",h="";b;){switch(b.nodeType){case 3:case 4:case 5:var l=b.textContent,m=l.length;d?(c+=m,k||(k=l)):(c>m&&(c=m),d=!0,k=l.substr(0,c),h=l.substr(c));b=b.previousSibling;continue;case 8:b=b.previousSibling;continue}break}if(0<c||k||h)k=a.trim(k,!1),h=a.trim(h,!0),f.push(new qb(c,k,h,e)),e=null;for(;g&&g&&9!=g.nodeType;){c=d?null:jb(b);for(d=d?1:0;b;)1==b.nodeType&&(d+=2),b=b.previousSibling;f.push(new pb(d,c,e));e=null;b=g;g=g.parentNode;
d=!1}f.reverse();a.ka?(f.push(new ob),a.ka=f.concat(a.ka)):a.ka=f}rb.prototype.toString=function(){if(!this.ka)return"";var a=new Qa;a.append("epubcfi(");for(var b=0;b<this.ka.length;b++)this.ka[b].e(a);a.append(")");return a.toString()};function vb(a){a=a.substr(1);if(a.match(/^[^0-9a-fA-F\n\r]$/))return a;a=parseInt(a,16);return isNaN(a)?"":65535>=a?String.fromCharCode(a):1114111>=a?String.fromCharCode(55296|a>>10&1023,56320|a&1023):"\ufffd"}function wb(a){return a.replace(/\\([0-9a-fA-F]{0,6}(\r\n|[ \n\r\t\f])?|[^0-9a-fA-F\n\r])/g,vb)}function xb(){this.type=0;this.b=!1;this.D=0;this.text="";this.position=0}
function yb(a,b){var c=Array(128),d;for(d=0;128>d;d++)c[d]=a;c[NaN]=35==a?35:72;for(d=0;d<b.length;d+=2)c[b[d]]=b[d+1];return c}var zb=[72,72,72,72,72,72,72,72,72,1,1,72,1,1,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,1,4,34,6,7,8,9,33,10,11,12,13,14,15,16,17,2,2,2,2,2,2,2,2,2,2,18,19,20,21,22,23,24,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,25,29,26,30,3,72,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,27,31,28,32,72];zb[NaN]=80;
var Ab=[43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,52,43,43,43,43,39,43,43,39,39,39,39,39,39,39,39,39,39,43,43,43,43,43,43,43,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,43,44,43,43,39,43,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,43,43,43,43,43];Ab[NaN]=43;
var Bb=[72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,78,59,72,59,59,59,59,59,59,59,59,59,59,72,72,72,72,72,72,72,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,72,61,72,72,78,72,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,72,72,72,72,72];Ab[NaN]=43;
var Cb=[35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,57,59,35,58,58,58,58,58,58,58,58,58,58,35,35,35,35,35,35,35,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,35,61,35,35,60,35,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,35,35,35,35,35];Cb[NaN]=35;
var Db=[45,45,45,45,45,45,45,45,45,73,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,73,45,45,45,45,45,45,45,53,45,45,45,45,45,45,45,39,39,39,39,39,39,39,39,39,39,45,45,45,45,45,45,45,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,45,44,45,45,39,45,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,45,45,45,45,45];Db[NaN]=45;
var Eb=[37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,41,37,37,37,37,37,37,37,37,42,37,39,39,39,39,39,39,39,39,39,39,37,37,37,37,37,37,37,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,37,37,37,37,40,37,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,37,37,37,37,37];Eb[NaN]=37;
var Fb=[38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,41,38,38,38,38,38,38,38,38,38,38,39,39,39,39,39,39,39,39,39,39,38,38,38,38,38,38,38,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,38,38,38,38,40,38,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,38,38,38,38,38];Fb[NaN]=38;
var Gb=yb(35,[61,36]),Hb=yb(35,[58,77]),Ib=yb(35,[61,36,124,50]),Jb=yb(35,[38,51]),Kb=yb(35,[42,54]),Lb=yb(39,[42,55]),Mb=yb(54,[42,55,47,56]),Nb=yb(62,[62,56]),Ob=yb(35,[61,36,33,70]),Pb=yb(62,[45,71]),Qb=yb(63,[45,56]),Rb=yb(76,[9,72,10,72,13,72,32,72]),Sb=yb(39,[39,46,10,72,13,72,92,48]),Tb=yb(39,[34,46,10,72,13,72,92,49]),Ub=yb(39,[39,47,10,74,13,74,92,48]),Vb=yb(39,[34,47,10,74,13,74,92,49]),Wb=yb(64,[9,39,32,39,34,66,39,65,41,72,10,39,13,39]),Xb=yb(39,[41,67,9,79,10,79,13,79,32,79,92,75,40,
72,91,72,93,72,123,72,125,72,NaN,67]),Zb=yb(39,[39,68,10,74,13,74,92,75,NaN,67]),$b=yb(39,[34,68,10,74,13,74,92,75,NaN,67]),ac=yb(72,[9,39,10,39,13,39,32,39,41,69]);function bc(a,b){this.h=b;this.e=15;this.j=a;this.g=Array(this.e+1);this.b=-1;for(var c=this.position=this.d=this.f=0;c<=this.e;c++)this.g[c]=new xb}function x(a){a.f==a.d&&cc(a);return a.g[a.d]}function z(a,b){(a.f-a.d&a.e)<=b&&cc(a);return a.g[a.d+b&a.e]}function A(a){a.d=a.d+1&a.e}
bc.prototype.error=function(a,b,c){this.h&&this.h.error(c,b)};
function cc(a){var b=a.f,c=0<=a.b?a.b:a.d,d=a.e;b>=c?c+=d:c--;if(c==b){if(0>a.b)throw Error("F_CSSTOK_INTERNAL");for(var b=2*(a.e+1)-1,c=Array(b+1),d=a.b,e=0;d!=a.f;)c[e]=a.g[d],d==a.d&&(a.d=e),d=d+1&a.e,e++;a.b=0;a.f=e;a.e=b;for(a.g=c;e<=b;)c[e++]=new xb;b=a.f;c=d=a.e}for(var e=zb,f=a.j,g=a.position,k=a.g,h=0,l=0,m="",p=0,q=!1,t=k[b],r=-9;;){var y=f.charCodeAt(g);switch(e[y]||e[65]){case 72:h=51;m=isNaN(y)?"E_CSS_UNEXPECTED_EOF":"E_CSS_UNEXPECTED_CHAR";g++;break;case 1:g++;q=!0;continue;case 2:l=
g++;e=Eb;continue;case 3:h=1;l=g++;e=Ab;continue;case 4:l=g++;h=31;e=Gb;continue;case 33:h=2;l=++g;e=Sb;continue;case 34:h=2;l=++g;e=Tb;continue;case 6:l=++g;h=7;e=Ab;continue;case 7:l=g++;h=32;e=Gb;continue;case 8:l=g++;h=21;break;case 9:l=g++;h=32;e=Jb;continue;case 10:l=g++;h=10;break;case 11:l=g++;h=11;break;case 12:l=g++;h=36;e=Gb;continue;case 13:l=g++;h=23;break;case 14:l=g++;h=16;break;case 15:h=24;l=g++;e=Cb;continue;case 16:l=g++;e=Bb;continue;case 78:l=g++;h=9;e=Ab;continue;case 17:l=g++;
h=19;e=Kb;continue;case 18:l=g++;h=18;e=Hb;continue;case 77:g++;h=50;break;case 19:l=g++;h=17;break;case 20:l=g++;h=38;e=Ob;continue;case 21:l=g++;h=39;e=Gb;continue;case 22:l=g++;h=37;e=Gb;continue;case 23:l=g++;h=22;break;case 24:l=++g;h=20;e=Ab;continue;case 25:l=g++;h=14;break;case 26:l=g++;h=15;break;case 27:l=g++;h=12;break;case 28:l=g++;h=13;break;case 29:r=l=g++;h=1;e=Rb;continue;case 30:l=g++;h=33;e=Gb;continue;case 31:l=g++;h=34;e=Ib;continue;case 32:l=g++;h=35;e=Gb;continue;case 35:break;
case 36:g++;h=h+41-31;break;case 37:h=5;p=parseInt(f.substring(l,g),10);break;case 38:h=4;p=parseFloat(f.substring(l,g));break;case 39:g++;continue;case 40:h=3;p=parseFloat(f.substring(l,g));l=g++;e=Ab;continue;case 41:h=3;p=parseFloat(f.substring(l,g));m="%";l=g++;break;case 42:g++;e=Fb;continue;case 43:m=f.substring(l,g);break;case 44:r=g++;e=Rb;continue;case 45:m=wb(f.substring(l,g));break;case 46:m=f.substring(l,g);g++;break;case 47:m=wb(f.substring(l,g));g++;break;case 48:r=g;g+=2;e=Ub;continue;
case 49:r=g;g+=2;e=Vb;continue;case 50:g++;h=25;break;case 51:g++;h=26;break;case 52:m=f.substring(l,g);if(1==h){g++;if("url"==m.toLowerCase()){e=Wb;continue}h=6}break;case 53:m=wb(f.substring(l,g));if(1==h){g++;if("url"==m.toLowerCase()){e=Wb;continue}h=6}break;case 54:e=Lb;g++;continue;case 55:e=Mb;g++;continue;case 56:e=zb;g++;continue;case 57:e=Nb;g++;continue;case 58:h=5;e=Eb;g++;continue;case 59:h=4;e=Fb;g++;continue;case 60:h=1;e=Ab;g++;continue;case 61:h=1;e=Rb;r=g++;continue;case 62:g--;
break;case 63:g-=2;break;case 64:l=g++;e=Xb;continue;case 65:l=++g;e=Zb;continue;case 66:l=++g;e=$b;continue;case 67:h=8;m=wb(f.substring(l,g));g++;break;case 69:g++;break;case 70:e=Pb;g++;continue;case 71:e=Qb;g++;continue;case 79:if(8>g-r&&f.substring(r+1,g+1).match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])|[ \t]$/)){g++;continue}case 68:h=8;m=wb(f.substring(l,g));g++;e=ac;continue;case 74:g++;if(9>g-r&&f.substring(r+1,g).match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])$/))continue;h=51;m="E_CSS_UNEXPECTED_NEWLINE";
break;case 73:if(9>g-r&&f.substring(r+1,g+1).match(/^[0-9a-fA-F]{0,6}[ \t]$/)){g++;continue}m=wb(f.substring(l,g));break;case 75:r=g++;continue;case 76:g++;e=Db;continue;default:if(e!==zb){h=51;m="E_CSS_UNEXPECTED_STATE";break}l=g;h=0}t.type=h;t.b=q;t.D=p;t.text=m;t.position=l;b++;if(b>=c)break;e=zb;q=!1;t=k[b&d]}a.position=g;a.f=b&d};function dc(){return{fontFamily:"serif",lineHeight:1.25,margin:8,Jc:!0,Ec:25,Ic:!1,Qc:!1,Va:!1,Bb:1,dd:{print:!0}}}function ec(a){return{fontFamily:a.fontFamily,lineHeight:a.lineHeight,margin:a.margin,Jc:a.Jc,Ec:a.Ec,Ic:a.Ic,Qc:a.Qc,Va:a.Va,Bb:a.Bb,dd:Object.Kb({},a.dd)}}var fc=dc(),gc={};function hc(a,b,c,d){a=Math.min((a-0)/c,(b-0)/d);return"matrix("+a+",0,0,"+a+",0,0)"}function ic(a){return'"'+Ta(a+"")+'"'}function jc(a){return Sa(a+"")}function kc(a,b){return a?Sa(a)+"."+Sa(b):Sa(b)}var lc=0;
function mc(a,b){this.parent=a;this.j="S"+lc++;this.children=[];this.b=new nc(this,0);this.d=new nc(this,1);this.g=new nc(this,!0);this.f=new nc(this,!1);a&&a.children.push(this);this.values={};this.l={};this.k={};this.h=b;if(!a){var c=this.k;c.floor=Math.floor;c.ceil=Math.ceil;c.round=Math.round;c.sqrt=Math.sqrt;c.min=Math.min;c.max=Math.max;c.letterbox=hc;c["css-string"]=ic;c["css-name"]=jc;c["typeof"]=function(a){return typeof a};oc(this,"page-width",function(){return this.jb()});oc(this,"page-height",
function(){return this.ib()});oc(this,"pref-font-family",function(){return this.R.fontFamily});oc(this,"pref-night-mode",function(){return this.R.Qc});oc(this,"pref-hyphenate",function(){return this.R.Jc});oc(this,"pref-margin",function(){return this.R.margin});oc(this,"pref-line-height",function(){return this.R.lineHeight});oc(this,"pref-column-width",function(){return this.R.Ec*this.fontSize});oc(this,"pref-horizontal",function(){return this.R.Ic});oc(this,"pref-spread-view",function(){return this.R.Va})}}
function oc(a,b,c){a.values[b]=new pc(a,c,b)}function qc(a,b){a.values["page-number"]=b}function rc(a,b){a.k["has-content"]=b}var sc={px:1,"in":96,pt:4/3,pc:16,cm:96/2.54,mm:96/25.4,q:96/2.54/40,em:16,rem:16,ex:8,rex:8};function tc(a){switch(a){case "q":case "rem":case "rex":return!0;default:return!1}}
function uc(a,b,c,d){this.xa=b;this.eb=c;this.C=null;this.jb=function(){return this.C?this.C:this.R.Va?Math.floor(b/2)-this.R.Bb:b};this.B=null;this.ib=function(){return this.B?this.B:c};this.h=d;this.Z=null;this.fontSize=function(){return this.Z?this.Z:d};this.R=fc;this.u={}}function vc(a,b){a.u[b.j]={};for(var c=0;c<b.children.length;c++)vc(a,b.children[c])}
function wc(a,b,c){return"vw"==b?a.jb()/100:"vh"==b?a.ib()/100:"em"==b||"rem"==b?c?a.h:a.fontSize():"ex"==b||"rex"==b?sc.ex*(c?a.h:a.fontSize())/sc.em:sc[b]}function xc(a,b,c){do{var d=b.values[c];if(d||b.h&&(d=b.h.call(a,c,!1)))return d;b=b.parent}while(b);throw Error("Name '"+c+"' is undefined");}
function yc(a,b,c,d,e){do{var f=b.l[c];if(f||b.h&&(f=b.h.call(a,c,!0)))return f;if(f=b.k[c]){if(e)return b.b;c=Array(d.length);for(e=0;e<d.length;e++)c[e]=d[e].evaluate(a);return new nc(b,f.apply(a,c))}b=b.parent}while(b);throw Error("Function '"+c+"' is undefined");}
function zc(a,b,c){var d="",e=b.match(/^(min|max)-(.*)$/);e&&(d=e[1],b=e[2]);var f=e=null;switch(b){case "width":case "height":case "device-width":case "device-height":case "color":c&&(e=c.evaluate(a))}switch(b){case "width":f=a.jb();break;case "height":f=a.ib();break;case "device-width":f=window.screen.availWidth;break;case "device-height":f=window.screen.availHeight;break;case "color":f=window.screen.pixelDepth}if(null!=f&&null!=e)switch(d){case "min":return f>=e;case "max":return f<=e;default:return f==
e}else if(null!=f&&null==c)return 0!==f;return!1}function B(a){this.b=a;this.f="_"+lc++}n=B.prototype;n.toString=function(){var a=new Qa;this.la(a,0);return a.toString()};n.la=function(){throw Error("F_ABSTRACT");};n.Ma=function(){throw Error("F_ABSTRACT");};n.Ca=function(){return this};n.rb=function(a){return a===this};function Ac(a,b,c,d){var e=d[a.f];if(null!=e)return e===gc?!1:e;d[a.f]=gc;b=a.rb(b,c,d);return d[a.f]=b}
n.evaluate=function(a){var b;b=(b=a.u[this.b.j])?b[this.f]:void 0;if("undefined"!=typeof b)return b;b=this.Ma(a);var c=this.f,d=this.b,e=a.u[d.j];e||(e={},a.u[d.j]=e);return e[c]=b};n.gd=function(){return!1};function Bc(a,b){B.call(this,a);this.d=b}u(Bc,B);n=Bc.prototype;n.cd=function(){throw Error("F_ABSTRACT");};n.ed=function(){throw Error("F_ABSTRACT");};n.Ma=function(a){a=this.d.evaluate(a);return this.ed(a)};n.rb=function(a,b,c){return a===this||Ac(this.d,a,b,c)};
n.la=function(a,b){10<b&&a.append("(");a.append(this.cd());this.d.la(a,10);10<b&&a.append(")")};n.Ca=function(a,b){var c=this.d.Ca(a,b);return c===this.d?this:new this.constructor(this.b,c)};function C(a,b,c){B.call(this,a);this.d=b;this.e=c}u(C,B);n=C.prototype;n.cc=function(){throw Error("F_ABSTRACT");};n.Ba=function(){throw Error("F_ABSTRACT");};n.Ra=function(){throw Error("F_ABSTRACT");};n.Ma=function(a){var b=this.d.evaluate(a);a=this.e.evaluate(a);return this.Ra(b,a)};
n.rb=function(a,b,c){return a===this||Ac(this.d,a,b,c)||Ac(this.e,a,b,c)};n.la=function(a,b){var c=this.cc();c<=b&&a.append("(");this.d.la(a,c);a.append(this.Ba());this.e.la(a,c);c<=b&&a.append(")")};n.Ca=function(a,b){var c=this.d.Ca(a,b),d=this.e.Ca(a,b);return c===this.d&&d===this.e?this:new this.constructor(this.b,c,d)};function Cc(a,b,c){C.call(this,a,b,c)}u(Cc,C);Cc.prototype.cc=function(){return 1};function Dc(a,b,c){C.call(this,a,b,c)}u(Dc,C);Dc.prototype.cc=function(){return 2};
function Ec(a,b,c){C.call(this,a,b,c)}u(Ec,C);Ec.prototype.cc=function(){return 3};function Fc(a,b,c){C.call(this,a,b,c)}u(Fc,C);Fc.prototype.cc=function(){return 4};function Gc(a,b){Bc.call(this,a,b)}u(Gc,Bc);Gc.prototype.cd=function(){return"!"};Gc.prototype.ed=function(a){return!a};function Hc(a,b){Bc.call(this,a,b)}u(Hc,Bc);Hc.prototype.cd=function(){return"-"};Hc.prototype.ed=function(a){return-a};function Ic(a,b,c){C.call(this,a,b,c)}u(Ic,Cc);Ic.prototype.Ba=function(){return"&&"};
Ic.prototype.Ma=function(a){return this.d.evaluate(a)&&this.e.evaluate(a)};function Jc(a,b,c){C.call(this,a,b,c)}u(Jc,Ic);Jc.prototype.Ba=function(){return" and "};function Kc(a,b,c){C.call(this,a,b,c)}u(Kc,Cc);Kc.prototype.Ba=function(){return"||"};Kc.prototype.Ma=function(a){return this.d.evaluate(a)||this.e.evaluate(a)};function Lc(a,b,c){C.call(this,a,b,c)}u(Lc,Kc);Lc.prototype.Ba=function(){return", "};function Mc(a,b,c){C.call(this,a,b,c)}u(Mc,Dc);Mc.prototype.Ba=function(){return"<"};
Mc.prototype.Ra=function(a,b){return a<b};function Nc(a,b,c){C.call(this,a,b,c)}u(Nc,Dc);Nc.prototype.Ba=function(){return"<="};Nc.prototype.Ra=function(a,b){return a<=b};function Oc(a,b,c){C.call(this,a,b,c)}u(Oc,Dc);Oc.prototype.Ba=function(){return">"};Oc.prototype.Ra=function(a,b){return a>b};function Pc(a,b,c){C.call(this,a,b,c)}u(Pc,Dc);Pc.prototype.Ba=function(){return">="};Pc.prototype.Ra=function(a,b){return a>=b};function Qc(a,b,c){C.call(this,a,b,c)}u(Qc,Dc);Qc.prototype.Ba=function(){return"=="};
Qc.prototype.Ra=function(a,b){return a==b};function Rc(a,b,c){C.call(this,a,b,c)}u(Rc,Dc);Rc.prototype.Ba=function(){return"!="};Rc.prototype.Ra=function(a,b){return a!=b};function Sc(a,b,c){C.call(this,a,b,c)}u(Sc,Ec);Sc.prototype.Ba=function(){return"+"};Sc.prototype.Ra=function(a,b){return a+b};function Tc(a,b,c){C.call(this,a,b,c)}u(Tc,Ec);Tc.prototype.Ba=function(){return" - "};Tc.prototype.Ra=function(a,b){return a-b};function Uc(a,b,c){C.call(this,a,b,c)}u(Uc,Fc);Uc.prototype.Ba=function(){return"*"};
Uc.prototype.Ra=function(a,b){return a*b};function Vc(a,b,c){C.call(this,a,b,c)}u(Vc,Fc);Vc.prototype.Ba=function(){return"/"};Vc.prototype.Ra=function(a,b){return a/b};function Wc(a,b,c){C.call(this,a,b,c)}u(Wc,Fc);Wc.prototype.Ba=function(){return"%"};Wc.prototype.Ra=function(a,b){return a%b};function Xc(a,b,c){B.call(this,a);this.D=b;this.ea=c.toLowerCase()}u(Xc,B);Xc.prototype.la=function(a){a.append(this.D.toString());a.append(Sa(this.ea))};
Xc.prototype.Ma=function(a){return this.D*wc(a,this.ea,!1)};function Yc(a,b){B.call(this,a);this.d=b}u(Yc,B);Yc.prototype.la=function(a){a.append(this.d)};Yc.prototype.Ma=function(a){return xc(a,this.b,this.d).evaluate(a)};Yc.prototype.rb=function(a,b,c){return a===this||Ac(xc(b,this.b,this.d),a,b,c)};function Zc(a,b,c){B.call(this,a);this.d=b;this.name=c}u(Zc,B);Zc.prototype.la=function(a){this.d&&a.append("not ");a.append(Sa(this.name))};
Zc.prototype.Ma=function(a){var b=this.name;a="all"===b||!!a.R.dd[b];return this.d?!a:a};Zc.prototype.rb=function(a,b,c){return a===this||Ac(this.value,a,b,c)};Zc.prototype.gd=function(){return!0};function pc(a,b,c){B.call(this,a);this.Ab=b;this.d=c}u(pc,B);pc.prototype.la=function(a){a.append(this.d)};pc.prototype.Ma=function(a){return this.Ab.call(a)};function $c(a,b,c){B.call(this,a);this.e=b;this.d=c}u($c,B);
$c.prototype.la=function(a){a.append(this.e);var b=this.d;a.append("(");for(var c=0;c<b.length;c++)c&&a.append(","),b[c].la(a,0);a.append(")")};$c.prototype.Ma=function(a){return yc(a,this.b,this.e,this.d,!1).Ca(a,this.d).evaluate(a)};$c.prototype.rb=function(a,b,c){if(a===this)return!0;for(var d=0;d<this.d.length;d++)if(Ac(this.d[d],a,b,c))return!0;return Ac(yc(b,this.b,this.e,this.d,!0),a,b,c)};
$c.prototype.Ca=function(a,b){for(var c,d=c=this.d,e=0;e<c.length;e++){var f=c[e].Ca(a,b);if(c!==d)d[e]=f;else if(f!==c[e]){for(var d=Array(c.length),g=0;g<e;g++)d[g]=c[g];d[e]=f}}c=d;return c===this.d?this:new $c(this.b,this.e,c)};function ad(a,b,c,d){B.call(this,a);this.d=b;this.g=c;this.e=d}u(ad,B);ad.prototype.la=function(a,b){0<b&&a.append("(");this.d.la(a,0);a.append("?");this.g.la(a,0);a.append(":");this.e.la(a,0);0<b&&a.append(")")};
ad.prototype.Ma=function(a){return this.d.evaluate(a)?this.g.evaluate(a):this.e.evaluate(a)};ad.prototype.rb=function(a,b,c){return a===this||Ac(this.d,a,b,c)||Ac(this.g,a,b,c)||Ac(this.e,a,b,c)};ad.prototype.Ca=function(a,b){var c=this.d.Ca(a,b),d=this.g.Ca(a,b),e=this.e.Ca(a,b);return c===this.d&&d===this.g&&e===this.e?this:new ad(this.b,c,d,e)};function nc(a,b){B.call(this,a);this.d=b}u(nc,B);
nc.prototype.la=function(a){switch(typeof this.d){case "number":case "boolean":a.append(this.d.toString());break;case "string":a.append('"');a.append(Ta(this.d));a.append('"');break;default:throw Error("F_UNEXPECTED_STATE");}};nc.prototype.Ma=function(){return this.d};function bd(a,b,c){B.call(this,a);this.name=b;this.value=c}u(bd,B);bd.prototype.la=function(a){a.append("(");a.append(Ta(this.name.name));a.append(":");this.value.la(a,0);a.append(")")};
bd.prototype.Ma=function(a){return zc(a,this.name.name,this.value)};bd.prototype.rb=function(a,b,c){return a===this||Ac(this.value,a,b,c)};bd.prototype.Ca=function(a,b){var c=this.value.Ca(a,b);return c===this.value?this:new bd(this.b,this.name,c)};function cd(a,b){B.call(this,a);this.d=b}u(cd,B);cd.prototype.la=function(a){a.append("$");a.append(this.d.toString())};cd.prototype.Ca=function(a,b){var c=b[this.d];if(!c)throw Error("Parameter missing: "+this.d);return c};
function dd(a,b,c){return b===a.f||b===a.b||c==a.f||c==a.b?a.f:b===a.g||b===a.d?c:c===a.g||c===a.d?b:new Ic(a,b,c)}function D(a,b,c){return b===a.b?c:c===a.b?b:new Sc(a,b,c)}function E(a,b,c){return b===a.b?new Hc(a,c):c===a.b?b:new Tc(a,b,c)}function ed(a,b,c){return b===a.b||c===a.b?a.b:b===a.d?c:c===a.d?b:new Uc(a,b,c)}function fd(a,b,c){return b===a.b?a.b:c===a.d?b:new Vc(a,b,c)};var gd={};function hd(){}n=hd.prototype;n.pb=function(a){for(var b=0;b<a.length;b++)a[b].T(this)};n.Yc=function(){throw Error("E_CSS_EMPTY_NOT_ALLOWED");};n.Zc=function(){throw Error("E_CSS_SLASH_NOT_ALLOWED");};n.Xb=function(){throw Error("E_CSS_STR_NOT_ALLOWED");};n.ob=function(){throw Error("E_CSS_IDENT_NOT_ALLOWED");};n.Ib=function(){throw Error("E_CSS_NUMERIC_NOT_ALLOWED");};n.Hb=function(){throw Error("E_CSS_NUM_NOT_ALLOWED");};n.Gb=function(a){return this.Hb(a)};
n.vc=function(){throw Error("E_CSS_COLOR_NOT_ALLOWED");};n.Yb=function(){throw Error("E_CSS_URL_NOT_ALLOWED");};n.Za=function(){throw Error("E_CSS_LIST_NOT_ALLOWED");};n.nb=function(){throw Error("E_CSS_COMMA_NOT_ALLOWED");};n.ub=function(){throw Error("E_CSS_FUNC_NOT_ALLOWED");};n.Fb=function(){throw Error("E_CSS_EXPR_NOT_ALLOWED");};function id(){}u(id,hd);n=id.prototype;
n.pb=function(a){for(var b=null,c=0;c<a.length;c++){var d=a[c],e=d.T(this);if(b)b[c]=e;else if(d!==e){b=Array(a.length);for(d=0;d<c;d++)b[d]=a[d];b[c]=e}}return b||a};n.Xb=function(a){return a};n.ob=function(a){return a};n.Zc=function(a){return a};n.Ib=function(a){return a};n.Hb=function(a){return a};n.Gb=function(a){return a};n.vc=function(a){return a};n.Yb=function(a){return a};n.Za=function(a){var b=this.pb(a.values);return b===a.values?a:new jd(b)};
n.nb=function(a){var b=this.pb(a.values);return b===a.values?a:new kd(b)};n.ub=function(a){var b=this.pb(a.values);return b===a.values?a:new ld(a.name,b)};n.Fb=function(a){return a};function md(){}n=md.prototype;n.toString=function(){var a=new Qa;this.ya(a,!0);return a.toString()};n.stringValue=function(){var a=new Qa;this.ya(a,!1);return a.toString()};n.ia=function(){throw Error("F_ABSTRACT");};n.ya=function(a){a.append("[error]")};n.fd=function(){return!1};n.Nb=function(){return!1};n.hd=function(){return!1};
n.xd=function(){return!1};n.Oc=function(){return!1};function nd(){if(G)throw Error("E_INVALID_CALL");}u(nd,md);nd.prototype.ia=function(a){return new nc(a,"")};nd.prototype.ya=function(){};nd.prototype.T=function(a){return a.Yc(this)};var G=new nd;function od(){if(pd)throw Error("E_INVALID_CALL");}u(od,md);od.prototype.ia=function(a){return new nc(a,"/")};od.prototype.ya=function(a){a.append("/")};od.prototype.T=function(a){return a.Zc(this)};var pd=new od;function qd(a){this.b=a}u(qd,md);
qd.prototype.ia=function(a){return new nc(a,this.b)};qd.prototype.ya=function(a,b){b?(a.append('"'),a.append(Ta(this.b)),a.append('"')):a.append(this.b)};qd.prototype.T=function(a){return a.Xb(this)};function rd(a){this.name=a;if(gd[a])throw Error("E_INVALID_CALL");gd[a]=this}u(rd,md);rd.prototype.ia=function(a){return new nc(a,this.name)};rd.prototype.ya=function(a,b){b?a.append(Sa(this.name)):a.append(this.name)};rd.prototype.T=function(a){return a.ob(this)};rd.prototype.xd=function(){return!0};
function H(a){var b=gd[a];b||(b=new rd(a));return b}function I(a,b){this.D=a;this.ea=b.toLowerCase()}u(I,md);I.prototype.ia=function(a,b){return 0==this.D?a.b:b&&"%"==this.ea?100==this.D?b:new Uc(a,b,new nc(a,this.D/100)):new Xc(a,this.D,this.ea)};I.prototype.ya=function(a){a.append(this.D.toString());a.append(this.ea)};I.prototype.T=function(a){return a.Ib(this)};I.prototype.Nb=function(){return!0};function sd(a){this.D=a}u(sd,md);
sd.prototype.ia=function(a){return 0==this.D?a.b:1==this.D?a.d:new nc(a,this.D)};sd.prototype.ya=function(a){a.append(this.D.toString())};sd.prototype.T=function(a){return a.Hb(this)};sd.prototype.hd=function(){return!0};function td(a){this.D=a}u(td,sd);td.prototype.T=function(a){return a.Gb(this)};function ud(a){this.b=a}u(ud,md);ud.prototype.ya=function(a){a.append("#");var b=this.b.toString(16);a.append("000000".substr(b.length));a.append(b)};ud.prototype.T=function(a){return a.vc(this)};
function vd(a){this.url=a}u(vd,md);vd.prototype.ya=function(a){a.append('url("');a.append(Ta(this.url));a.append('")')};vd.prototype.T=function(a){return a.Yb(this)};function wd(a,b,c,d){var e=b.length;b[0].ya(a,d);for(var f=1;f<e;f++)a.append(c),b[f].ya(a,d)}function jd(a){this.values=a}u(jd,md);jd.prototype.ya=function(a,b){wd(a,this.values," ",b)};jd.prototype.T=function(a){return a.Za(this)};jd.prototype.Oc=function(){return!0};function kd(a){this.values=a}u(kd,md);
kd.prototype.ya=function(a,b){wd(a,this.values,",",b)};kd.prototype.T=function(a){return a.nb(this)};function ld(a,b){this.name=a;this.values=b}u(ld,md);ld.prototype.ya=function(a,b){a.append(Sa(this.name));a.append("(");wd(a,this.values,",",b);a.append(")")};ld.prototype.T=function(a){return a.ub(this)};function K(a){this.d=a}u(K,md);K.prototype.ia=function(){return this.d};K.prototype.ya=function(a){a.append("-epubx-expr(");this.d.la(a,0);a.append(")")};K.prototype.T=function(a){return a.Fb(this)};
K.prototype.fd=function(){return!0};function xd(a,b){if(a){if(a.Nb())return wc(b,a.ea,!1)*a.D;if(a.hd())return a.D}return 0}var yd=H("absolute"),zd=H("all"),Ad=H("always"),Bd=H("auto");H("avoid");
var Cd=H("block"),Dd=H("block-end"),Ed=H("block-start"),Fd=H("both"),Gd=H("bottom"),Hd=H("crop"),Id=H("cross"),Jd=H("exclusive"),Kd=H("false"),Ld=H("flex"),Md=H("footnote"),Nd=H("hidden"),Od=H("horizontal-tb"),Pd=H("inherit"),Qd=H("inline"),Rd=H("inline-end"),Sd=H("inline-start"),Td=H("landscape"),Ud=H("left"),Vd=H("list-item"),Wd=H("ltr"),Xd=H("none"),Yd=H("normal"),Zd=H("oeb-page-foot"),$d=H("oeb-page-head"),ae=H("page"),be=H("relative"),ce=H("right"),de=H("scale"),ee=H("static"),fe=H("rtl");H("table");
var ge=H("table-row"),he=H("top"),ie=H("transparent"),je=H("vertical-lr"),ke=H("vertical-rl"),le=H("visible"),me=H("true"),ne=new I(100,"%"),oe=new I(100,"vw"),pe=new I(100,"vh"),qe=new I(0,"px"),re={"font-size":1,color:2};function se(a,b){return(re[a]||Number.MAX_VALUE)-(re[b]||Number.MAX_VALUE)};function te(a,b,c,d){this.X=a;this.V=b;this.U=c;this.P=d}function ue(a,b){this.x=a;this.y=b}function ve(){this.bottom=this.right=this.top=this.left=0}function we(a,b,c,d){this.b=a;this.d=b;this.f=c;this.e=d}function xe(a,b,c,d){this.V=a;this.P=b;this.X=c;this.U=d;this.right=this.left=null}function ye(a,b){return a.b.y-b.b.y||a.b.x-b.b.x}function ze(a){this.b=a}function Ae(a,b,c){a=a.b;for(var d=a.length,e=a[d-1],f=0;f<d;f++){var g=a[f];b.push(e.y<g.y?new we(e,g,1,c):new we(g,e,-1,c));e=g}}
function Be(a,b,c){for(var d=[],e=0;e<a.b.length;e++){var f=a.b[e];d.push(new ue(f.x+b,f.y+c))}return new ze(d)}function Ce(a,b,c,d){for(var e=[],f=0;20>f;f++){var g=2*f*Math.PI/20;e.push(new ue(a+c*Math.sin(g),b+d*Math.cos(g)))}return new ze(e)}function De(a,b,c,d){return new ze([new ue(a,b),new ue(c,b),new ue(c,d),new ue(a,d)])}function Ee(a,b,c,d){this.x=a;this.e=b;this.b=c;this.d=d}
function Fe(a,b){var c=a.b.x+(a.d.x-a.b.x)*(b-a.b.y)/(a.d.y-a.b.y);if(isNaN(c))throw Error("Bad intersection");return c}function Ge(a,b,c,d){var e,f;b.d.y<c&&v.b("Error: inconsistent segment (1)");b.b.y<=c?(c=Fe(b,c),e=b.f):(c=b.b.x,e=0);b.d.y>=d?(d=Fe(b,d),f=b.f):(d=b.d.x,f=0);c<d?(a.push(new Ee(c,e,b.e,-1)),a.push(new Ee(d,f,b.e,1))):(a.push(new Ee(d,f,b.e,-1)),a.push(new Ee(c,e,b.e,1)))}
function He(a,b,c){c=b+c;for(var d=Array(c),e=Array(c),f=0;f<=c;f++)d[f]=0,e[f]=0;for(var g=[],k=!1,h=a.length,l=0;l<h;l++){var m=a[l];d[m.b]+=m.e;e[m.b]+=m.d;for(var p=!1,f=0;f<b;f++)if(d[f]&&!e[f]){p=!0;break}if(p)for(f=b;f<=c;f++)if(d[f]||e[f]){p=!1;break}k!=p&&(g.push(m.x),k=p)}return g}function Ie(a,b){return b?Math.ceil(a/b)*b:a}function Je(a,b){return b?Math.floor(a/b)*b:a}function Ke(a){return new ue(a.y,-a.x)}function Le(a){return new te(a.V,-a.U,a.P,-a.X)}
function Me(a){return new ze(cb(a.b,Ke))}
function Ne(a,b,c,d,e){e&&(a=Le(a),b=cb(b,Me),c=cb(c,Me));e=b.length;var f=c?c.length:0,g=[],k=[],h,l,m;for(h=0;h<e;h++)Ae(b[h],k,h);for(h=0;h<f;h++)Ae(c[h],k,h+e);b=k.length;k.sort(ye);for(c=0;k[c].e>=e;)c++;c=k[c].b.y;c>a.V&&g.push(new xe(a.V,c,a.U,a.U));h=0;for(var p=[];h<b&&(m=k[h]).b.y<c;)m.d.y>c&&p.push(m),h++;for(;h<b||0<p.length;){var q=a.P,t=Ie(Math.ceil(c+8),d);for(l=0;l<p.length&&q>t;l++)m=p[l],m.b.x==m.d.x?m.d.y<q&&(q=Math.max(Je(m.d.y,d),t)):m.b.x!=m.d.x&&(q=t);q>a.P&&(q=a.P);for(;h<
b&&(m=k[h]).b.y<q;)if(m.d.y<c)h++;else if(m.b.y<t){if(m.b.y!=m.d.y||m.b.y!=c)p.push(m),q=t;h++}else{l=Je(m.b.y,d);l<q&&(q=l);break}t=[];for(l=0;l<p.length;l++)Ge(t,p[l],c,q);t.sort(function(a,b){return a.x-b.x||a.d-b.d});t=He(t,e,f);if(0==t.length)g.push(new xe(c,q,a.U,a.U));else{var r=0,y=a.X;for(l=0;l<t.length;l+=2){var J=Math.max(a.X,t[l]),W=Math.min(a.U,t[l+1])-J;W>r&&(r=W,y=J)}0==r?g.push(new xe(c,q,a.U,a.U)):g.push(new xe(c,q,Math.max(y,a.X),Math.min(y+r,a.U)))}if(q==a.P)break;c=q;for(l=p.length-
1;0<=l;l--)p[l].d.y<=q&&p.splice(l,1)}Oe(a,g);return g}function Oe(a,b){for(var c=b.length-1,d=new xe(a.P,a.P,a.X,a.U);0<=c;){var e=d,d=b[c];d.X==e.X&&d.U==e.U&&(e.V=d.V,b.splice(c,1),d=e);c--}}function Pe(a,b){for(var c=0,d=a.length;c<d;){var e=Math.floor((c+d)/2);b>=a[e].P?c=e+1:d=e}return c}
function Qe(a,b,c,d){for(var e=c.V,f=c.U-c.X,g=c.P-c.V,k=Pe(b,e);;){var h=e+g;if(h>a.P)break;for(var l=a.X,m=a.U,p=k;p<b.length&&b[p].V<h;p++){var q=b[p];q.X>l&&(l=q.X);q.U<m&&(m=q.U)}if(l+f<=m||k>=b.length){"left"==d?(c.X=l,c.U=l+f):(c.X=m-f,c.U=m);c.P+=e-c.V;c.V=e;break}e=b[k].P;k++}}
function Re(a,b,c,d){for(var e=null,e=[new xe(c.V,c.P,c.X,c.U)];0<e.length&&e[0].P<=a.V;)e.shift();if(0!=e.length){e[0].V<a.V&&(e[0].V=a.V);c=0==b.length?a.V:b[b.length-1].P;c<a.P&&b.push(new xe(c,a.P,a.X,a.U));for(var f=Pe(b,e[0].V),g=0;g<e.length;g++){var k=e[g];if(f==b.length)break;b[f].V<k.V&&(c=b[f],f++,b.splice(f,0,new xe(k.V,c.P,c.X,c.U)),c.P=k.V);for(;f<b.length&&(c=b[f++],c.P>k.P&&(b.splice(f,0,new xe(k.P,c.P,c.X,c.U)),c.P=k.P),k.X!=k.U&&("left"==d?c.X=k.U:c.U=k.X),c.P!=k.P););}Oe(a,b)}}
;function Se(a){return String.fromCharCode(a>>>24&255,a>>>16&255,a>>>8&255,a&255)}
function Te(a){var b=new Qa;b.append(a);var c=55-a.length&63;for(b.append("\u0080");0<c;)c--,b.append("\x00");b.append("\x00\x00\x00\x00");b.append(Se(8*a.length));a=b.toString();for(var b=[1732584193,4023233417,2562383102,271733878,3285377520],c=[],d,e=0;e<a.length;e+=64){for(d=0;16>d;d++){var f=a.substr(e+4*d,4);c[d]=(f.charCodeAt(0)&255)<<24|(f.charCodeAt(1)&255)<<16|(f.charCodeAt(2)&255)<<8|f.charCodeAt(3)&255}for(;80>d;d++)f=c[d-3]^c[d-8]^c[d-14]^c[d-16],c[d]=f<<1|f>>>31;var f=b[0],g=b[1],k=
b[2],h=b[3],l=b[4],m;for(d=0;80>d;d++)m=20>d?(g&k|~g&h)+1518500249:40>d?(g^k^h)+1859775393:60>d?(g&k|g&h|k&h)+2400959708:(g^k^h)+3395469782,m+=(f<<5|f>>>27)+l+c[d],l=h,h=k,k=g<<30|g>>>2,g=f,f=m;b[0]=b[0]+f|0;b[1]=b[1]+g|0;b[2]=b[2]+k|0;b[3]=b[3]+h|0;b[4]=b[4]+l|0}return b}function Ue(a){a=Te(a);for(var b=[],c=0;c<a.length;c++){var d=a[c];b.push(d>>>24&255,d>>>16&255,d>>>8&255,d&255)}return b}
function Ve(a){a=Te(a);for(var b=new Qa,c=0;c<a.length;c++)b.append(Se(a[c]));a=b.toString();b=new Qa;for(c=0;c<a.length;c++)b.append((a.charCodeAt(c)|256).toString(16).substr(1));return b.toString()};var We=null,Xe=null;function L(a){if(!We)throw Error("E_TASK_NO_CONTEXT");We.name||(We.name=a);var b=We;a=new Ye(b,b.top,a);b.top=a;a.b=Ze;return a}function M(a){return new $e(a)}function af(a,b,c){a=L(a);a.g=c;try{b(a)}catch(d){bf(a.d,d,a)}return N(a)}function cf(a){var b=df,c;We?c=We.d:(c=Xe)||(c=new ef(new ff));b(c,a,void 0)}var Ze=1;function ff(){}ff.prototype.currentTime=function(){return(new Date).valueOf()};function gf(a,b){return setTimeout(a,b)}
function ef(a){this.e=a;this.f=1;this.slice=25;this.h=0;this.d=new za;this.b=this.j=null;this.g=!1;this.O=0;Xe||(Xe=this)}
function hf(a){if(!a.g){var b=a.d.b[1].b,c=a.e.currentTime();if(null!=a.b){if(c+a.f>a.j)return;clearTimeout(a.b)}b-=c;b<=a.f&&(b=a.f);a.j=c+b;a.b=gf(function(){a.b=null;null!=a.b&&(clearTimeout(a.b),a.b=null);a.g=!0;try{var b=a.e.currentTime();for(a.h=b+a.slice;a.d.length();){var c=a.d.b[1];if(c.b>b)break;var f=a.d,g=f.b.pop(),k=f.b.length;if(1<k){for(var h=1;;){var l=2*h;if(l>=k)break;if(0<jf(f.b[l],g))l+1<k&&0<jf(f.b[l+1],f.b[l])&&l++;else if(l+1<k&&0<jf(f.b[l+1],g))l++;else break;f.b[h]=f.b[l];
h=l}f.b[h]=g}var h=c,m=h.d;h.d=null;m&&m.e==h&&(m.e=null,l=We,We=m,O(m.top,h.e),We=l);b=a.e.currentTime();if(b>=a.h)break}}catch(p){v.error(p)}a.g=!1;a.d.length()&&hf(a)},b)}}ef.prototype.Ta=function(a,b){var c=this.e.currentTime();a.O=this.O++;a.b=c+(b||0);a:{for(var c=this.d,d=c.b.length;1<d;){var e=Math.floor(d/2),f=c.b[e];if(0<jf(f,a)){c.b[d]=a;break a}c.b[d]=f;d=e}c.b[1]=a}hf(this)};
function df(a,b,c){var d=new kf(a,c||"");d.top=new Ye(d,null,"bootstrap");d.top.b=Ze;d.top.then(function(){function a(){d.h=!1;for(var b=0;b<d.g.length;b++){var c=d.g[b];try{c()}catch(e){v.error(e)}}}try{b().then(function(b){d.f=b;a()})}catch(c){bf(d,c),a()}});c=We;We=d;a.Ta(lf(d.top,"bootstrap"));We=c;return d}function mf(a){this.d=a;this.O=this.b=0;this.e=null}function jf(a,b){return b.b-a.b||b.O-a.O}mf.prototype.Ta=function(a,b){this.e=a;this.d.d.Ta(this,b)};
function kf(a,b){this.d=a;this.name=b;this.g=[];this.b=null;this.h=!0;this.e=this.top=this.j=this.f=null}function nf(a,b){a.g.push(b)}kf.prototype.join=function(){var a=L("Task.join");if(this.h){var b=lf(a,this),c=this;nf(this,function(){b.Ta(c.f)})}else O(a,this.f);return N(a)};
function bf(a,b,c){var d=b.frameTrace;if(!d){for(var d=b.stack?b.stack+"\n\t---- async ---\n":"",e=a.top;e;e=e.parent)d+="\t",d+=e.name,d+="\n";b.frameTrace=d}if(c){for(d=a.top;d&&d!=c;)d=d.parent;d==c&&(a.top=d)}for(a.b=b;a.top&&!a.top.g;)a.top=a.top.parent;a.top?(b=a.b,a.b=null,a.top.g(a.top,b)):a.b&&v.error(a.b,"Unhandled exception in task",a.name)}function $e(a){this.value=a}n=$e.prototype;n.then=function(a){a(this.value)};n.tc=function(a){return a(this.value)};n.Xc=function(a){return new $e(a)};
n.ra=function(a){O(a,this.value)};n.Aa=function(){return!1};n.dc=function(){return this.value};function of(a){this.b=a}n=of.prototype;n.then=function(a){this.b.then(a)};n.tc=function(a){if(this.Aa()){var b=new Ye(this.b.d,this.b.parent,"AsyncResult.thenAsync");b.b=Ze;this.b.parent=b;this.b.then(function(c){a(c).then(function(a){O(b,a)})});return N(b)}return a(this.b.e)};n.Xc=function(a){return this.Aa()?this.tc(function(){return new $e(a)}):new $e(a)};
n.ra=function(a){this.Aa()?this.then(function(b){O(a,b)}):O(a,this.b.e)};n.Aa=function(){return this.b.b==Ze};n.dc=function(){if(this.Aa())throw Error("Result is pending");return this.b.e};function Ye(a,b,c){this.d=a;this.parent=b;this.name=c;this.e=null;this.b=0;this.g=this.f=null}function pf(a){if(!We)throw Error("F_TASK_NO_CONTEXT");if(a!==We.top)throw Error("F_TASK_NOT_TOP_FRAME");}function N(a){return new of(a)}
function O(a,b){pf(a);We.b||(a.e=b);a.b=2;var c=a.parent;We.top=c;if(a.f){try{a.f(b)}catch(d){bf(a.d,d,c)}a.b=3}}Ye.prototype.then=function(a){switch(this.b){case Ze:if(this.f)throw Error("F_TASK_FRAME_ALREADY_HAS_CALLBACK");this.f=a;break;case 2:var b=this.d,c=this.parent;try{a(this.e),this.b=3}catch(d){this.b=3,bf(b,d,c)}break;case 3:throw Error("F_TASK_DEAD_FRAME");default:throw Error("F_TASK_UNEXPECTED_FRAME_STATE "+this.b);}};
function qf(){var a=L("Frame.timeSlice"),b=a.d.d;b.e.currentTime()>=b.h?(v.debug("-- time slice --"),lf(a).Ta(!0)):O(a,!0);return N(a)}function rf(a){function b(d){try{for(;d;){var e=a();if(e.Aa()){e.then(b);return}e.then(function(a){d=a})}O(c,!0)}catch(f){bf(c.d,f,c)}}var c=L("Frame.loop");b(!0);return N(c)}function sf(a){var b=We;if(!b)throw Error("E_TASK_NO_CONTEXT");return rf(function(){var c;do c=new tf(b,b.top),b.top=c,c.b=Ze,a(c),c=N(c);while(!c.Aa()&&c.dc());return c})}
function lf(a,b){pf(a);if(a.d.e)throw Error("E_TASK_ALREADY_SUSPENDED");var c=new mf(a.d);a.d.e=c;We=null;a.d.j=b||null;return c}function tf(a,b){Ye.call(this,a,b,"loop")}u(tf,Ye);function uf(a){O(a,!0)}function P(a){O(a,!1)};function vf(a,b,c,d,e){var f=L("ajax"),g=new XMLHttpRequest,k=lf(f,g),h={status:0,url:a,contentType:null,responseText:null,responseXML:null,jc:null};g.open(c||"GET",a,!0);b&&(g.responseType=b);g.onreadystatechange=function(){if(4===g.readyState){h.status=g.status;if(200==h.status||0==h.status)if(b&&"document"!==b||!g.responseXML){var c=g.response;b&&"text"!==b||"string"!=typeof c?c?"string"==typeof c?h.jc=wf([c]):h.jc=c:v.b("Unexpected empty success response for",a):h.responseText=c;if(c=g.getResponseHeader("Content-Type"))h.contentType=
c.replace(/(.*);.*$/,"$1")}else h.responseXML=g.responseXML,h.contentType=g.responseXML.contentType;k.Ta(h)}};try{d?(g.setRequestHeader("Content-Type",e||"text/plain; charset=UTF-8"),g.send(d)):g.send(null)}catch(l){v.b(l,"Error fetching "+a),k.Ta(h)}return N(f)}function wf(a){var b=window.WebKitBlobBuilder||window.MSBlobBuilder;if(b){for(var b=new b,c=0;c<a.length;c++)b.append(a[c]);return b.getBlob("application/octet-stream")}return new Blob(a,{type:"application/octet-stream"})}
function xf(a){var b=L("readBlob"),c=new FileReader,d=lf(b,c);c.addEventListener("load",function(){d.Ta(c.result)},!1);c.readAsArrayBuffer(a);return N(b)}function yf(a,b){this.H=a;this.type=b;this.g={};this.e={}}yf.prototype.load=function(a,b,c){a=ra(a);var d=this.g[a];return"undefined"!=typeof d?M(d):zf(this.fc(a,b,c))};
function Af(a,b,c,d){var e=L("fetch");vf(b,a.type).then(function(f){if(c&&400<=f.status)throw Error(d||"Failed to fetch required resource: "+b);a.H(f,a).then(function(c){delete a.e[b];a.g[b]=c;O(e,c)})});return N(e)}yf.prototype.fc=function(a,b,c){a=ra(a);if(this.g[a])return null;var d=this.e[a];if(!d){var e=this,d=new Bf(function(){return Af(e,a,b,c)},"Fetch "+a);e.e[a]=d;d.start()}return d};function Cf(a){a=a.responseText;return M(a?JSON.parse(a):null)};function Df(a){var b=parseInt(a,16);if(isNaN(b))throw Error("E_CSS_COLOR");if(6==a.length)return new ud(b);if(3==a.length)return new ud(b&15|(b&15)<<4|(b&240)<<4|(b&240)<<8|(b&3840)<<8|(b&3840)<<12);throw Error("E_CSS_COLOR");}function Ef(a){this.d=a;this.Wa="Author"}n=Ef.prototype;n.Lb=function(){return null};n.W=function(){return this.d};n.error=function(){};n.Eb=function(a){this.Wa=a};n.bb=function(){};n.Dc=function(){};n.Qb=function(){};n.Rb=function(){};n.Kc=function(){};n.ec=function(){};
n.fb=function(){};n.Cc=function(){};n.Ac=function(){};n.Hc=function(){};n.Ob=function(){};n.mb=function(){};n.nc=function(){};n.Tb=function(){};n.sc=function(){};n.lc=function(){};n.rc=function(){};n.Db=function(){};n.Wc=function(){};n.tb=function(){};n.mc=function(){};n.qc=function(){};n.oc=function(){};n.Vb=function(){};n.Ub=function(){};n.na=function(){};n.Xa=function(){};n.gb=function(){};function Ff(a){switch(a.Wa){case "UA":return 0;case "User":return 100663296;default:return 83886080}}
function Gf(a){switch(a.Wa){case "UA":return 0;case "User":return 16777216;default:return 33554432}}function Hf(){Ef.call(this,null);this.e=[];this.b=null}u(Hf,Ef);function If(a,b){a.e.push(a.b);a.b=b}n=Hf.prototype;n.Lb=function(){return null};n.W=function(){return this.b.W()};n.error=function(a,b){this.b.error(a,b)};n.Eb=function(a){Ef.prototype.Eb.call(this,a);0<this.e.length&&(this.b=this.e[0],this.e=[]);this.b.Eb(a)};n.bb=function(a,b){this.b.bb(a,b)};n.Dc=function(a){this.b.Dc(a)};
n.Qb=function(a,b){this.b.Qb(a,b)};n.Rb=function(a,b){this.b.Rb(a,b)};n.Kc=function(a){this.b.Kc(a)};n.ec=function(a,b,c,d){this.b.ec(a,b,c,d)};n.fb=function(){this.b.fb()};n.Cc=function(){this.b.Cc()};n.Ac=function(){this.b.Ac()};n.Hc=function(){this.b.Hc()};n.Ob=function(){this.b.Ob()};n.mb=function(){this.b.mb()};n.nc=function(){this.b.nc()};n.Tb=function(a){this.b.Tb(a)};n.sc=function(){this.b.sc()};n.lc=function(){this.b.lc()};n.rc=function(){this.b.rc()};n.Db=function(){this.b.Db()};n.Wc=function(a){this.b.Wc(a)};
n.tb=function(a){this.b.tb(a)};n.mc=function(a){this.b.mc(a)};n.qc=function(){this.b.qc()};n.oc=function(a,b,c){this.b.oc(a,b,c)};n.Vb=function(a,b,c){this.b.Vb(a,b,c)};n.Ub=function(a,b,c){this.b.Ub(a,b,c)};n.na=function(){this.b.na()};n.Xa=function(a,b,c){this.b.Xa(a,b,c)};n.gb=function(){this.b.gb()};function Jf(a,b,c){Ef.call(this,a);this.F=c;this.C=0;this.aa=b}u(Jf,Ef);Jf.prototype.Lb=function(){return this.aa.Lb()};Jf.prototype.error=function(a){v.b(a)};Jf.prototype.na=function(){this.C++};
Jf.prototype.gb=function(){if(0==--this.C&&!this.F){var a=this.aa;a.b=a.e.pop()}};function Kf(a,b,c){Jf.call(this,a,b,c)}u(Kf,Jf);function Lf(a,b){a.error(b,a.Lb())}function Mf(a,b){Lf(a,b);If(a.aa,new Jf(a.d,a.aa,!1))}n=Kf.prototype;n.mb=function(){Mf(this,"E_CSS_UNEXPECTED_SELECTOR")};n.nc=function(){Mf(this,"E_CSS_UNEXPECTED_FONT_FACE")};n.Tb=function(){Mf(this,"E_CSS_UNEXPECTED_FOOTNOTE")};n.sc=function(){Mf(this,"E_CSS_UNEXPECTED_VIEWPORT")};n.lc=function(){Mf(this,"E_CSS_UNEXPECTED_DEFINE")};
n.rc=function(){Mf(this,"E_CSS_UNEXPECTED_REGION")};n.Db=function(){Mf(this,"E_CSS_UNEXPECTED_PAGE")};n.tb=function(){Mf(this,"E_CSS_UNEXPECTED_WHEN")};n.mc=function(){Mf(this,"E_CSS_UNEXPECTED_FLOW")};n.qc=function(){Mf(this,"E_CSS_UNEXPECTED_PAGE_TEMPLATE")};n.oc=function(){Mf(this,"E_CSS_UNEXPECTED_PAGE_MASTER")};n.Vb=function(){Mf(this,"E_CSS_UNEXPECTED_PARTITION")};n.Ub=function(){Mf(this,"E_CSS_UNEXPECTED_PARTITION_GROUP")};n.Xa=function(){this.error("E_CSS_UNEXPECTED_PROPERTY",this.Lb())};
var Nf=[],Of=[],Q=[],Pf=[],Qf=[],Rf=[],Sf=[],R=[],Tf=[],Uf=[],Vf=[],Wf=[];Nf[1]=28;Nf[36]=29;Nf[7]=29;Nf[9]=29;Nf[14]=29;Nf[18]=29;Nf[20]=30;Nf[13]=27;Nf[0]=200;Of[1]=46;Of[0]=200;Qf[1]=2;Qf[36]=4;Qf[7]=6;Qf[9]=8;Qf[14]=10;Qf[18]=14;Q[37]=11;Q[23]=12;Q[35]=56;Q[1]=1;Q[36]=3;Q[7]=5;Q[9]=7;Q[14]=9;Q[12]=13;Q[18]=55;Q[50]=42;Q[16]=41;Pf[1]=2;Pf[36]=4;Pf[7]=6;Pf[9]=8;Pf[18]=14;Pf[50]=42;Pf[14]=10;Pf[12]=13;Rf[1]=15;Rf[7]=16;Rf[4]=17;Rf[5]=18;Rf[3]=19;Rf[2]=20;Rf[8]=21;Rf[16]=22;Rf[19]=23;Rf[6]=24;
Rf[11]=25;Rf[17]=26;Rf[13]=48;Rf[31]=47;Rf[23]=54;Rf[0]=44;Sf[1]=31;Sf[4]=32;Sf[5]=32;Sf[3]=33;Sf[2]=34;Sf[10]=40;Sf[6]=38;Sf[31]=36;Sf[24]=36;Sf[32]=35;R[1]=45;R[16]=37;R[37]=37;R[38]=37;R[47]=37;R[48]=37;R[39]=37;R[49]=37;R[26]=37;R[25]=37;R[23]=37;R[24]=37;R[19]=37;R[21]=37;R[36]=37;R[18]=37;R[22]=37;R[11]=39;R[12]=43;R[17]=49;Tf[0]=200;Tf[12]=50;Tf[13]=51;Tf[14]=50;Tf[15]=51;Tf[10]=50;Tf[11]=51;Tf[17]=53;Uf[0]=200;Uf[12]=50;Uf[13]=52;Uf[14]=50;Uf[15]=51;Uf[10]=50;Uf[11]=51;Uf[17]=53;Vf[0]=200;
Vf[12]=50;Vf[13]=51;Vf[14]=50;Vf[15]=51;Vf[10]=50;Vf[11]=51;Wf[11]=0;Wf[16]=0;Wf[22]=1;Wf[18]=1;Wf[26]=2;Wf[25]=2;Wf[38]=3;Wf[37]=3;Wf[48]=3;Wf[47]=3;Wf[39]=3;Wf[49]=3;Wf[41]=3;Wf[23]=4;Wf[24]=4;Wf[36]=5;Wf[19]=5;Wf[21]=5;Wf[0]=6;Wf[52]=2;function Xf(a,b,c,d){this.b=a;this.B=b;this.h=c;this.fa=d;this.l=[];this.H={};this.d=this.C=null;this.k=!1;this.f=2;this.u=null;this.w=!1;this.j=this.F=null;this.g=[];this.e=[];this.N=this.Z=!1}
function Yf(a,b){for(var c=[],d=a.l;;){c.push(d[b++]);if(b==d.length)break;if(","!=d[b++])throw Error("Unexpected state");}return c}
function Zf(a,b,c){var d=a.l,e=d.length,f;do f=d[--e];while("undefined"!=typeof f&&"string"!=typeof f);var g=d.length-(e+1);1<g&&d.splice(e+1,g,new jd(d.slice(e+1,d.length)));if(","==b)return null;e++;do f=d[--e];while("undefined"!=typeof f&&("string"!=typeof f||","==f));g=d.length-(e+1);if("("==f){if(")"!=b)return a.h.error("E_CSS_MISMATCHED_C_PAR",c),a.b=Uf,null;a=new ld(d[e-1],Yf(a,e+1));d.splice(e-1,g+2,a);return null}return";"!=b||0<=e?(a.h.error("E_CSS_UNEXPECTED_VAL_END",c),a.b=Uf,null):1<
g?new kd(Yf(a,e+1)):d[0]}function $f(a,b,c){a.b=a.d?Uf:Tf;a.h.error(b,c)}
function ag(a,b,c){for(var d=a.l,e=a.h,f=d.pop(),g;;){var k=d.pop();if(11==b){for(g=[f];16==k;)g.unshift(d.pop()),k=d.pop();if("string"==typeof k){if("{"==k){for(;2<=g.length;)a=g.shift(),c=g.shift(),a=new Lc(e.W(),a,c),g.unshift(a);d.push(new K(g[0]));return!0}if("("==k){b=d.pop();f=d.pop();f=new $c(e.W(),kc(f,b),g);b=0;continue}}if(10==k){f.gd()&&(f=new bd(e.W(),f,null));b=0;continue}}else if("string"==typeof k){d.push(k);break}if(0>k)if(-31==k)f=new Gc(e.W(),f);else if(-24==k)f=new Hc(e.W(),f);
else return $f(a,"F_UNEXPECTED_STATE",c),!1;else{if(Wf[b]>Wf[k]){d.push(k);break}g=d.pop();switch(k){case 26:f=new Ic(e.W(),g,f);break;case 52:f=new Jc(e.W(),g,f);break;case 25:f=new Kc(e.W(),g,f);break;case 38:f=new Mc(e.W(),g,f);break;case 37:f=new Oc(e.W(),g,f);break;case 48:f=new Nc(e.W(),g,f);break;case 47:f=new Pc(e.W(),g,f);break;case 39:case 49:f=new Qc(e.W(),g,f);break;case 41:f=new Rc(e.W(),g,f);break;case 23:f=new Sc(e.W(),g,f);break;case 24:f=new Tc(e.W(),g,f);break;case 36:f=new Uc(e.W(),
g,f);break;case 19:f=new Vc(e.W(),g,f);break;case 21:f=new Wc(e.W(),g,f);break;case 18:if(1<d.length)switch(d[d.length-1]){case 22:d.pop();f=new ad(e.W(),d.pop(),g,f);break;case 10:if(g.gd())f=new bd(e.W(),g,f);else return $f(a,"E_CSS_MEDIA_TEST",c),!1}else return $f(a,"E_CSS_EXPR_COND",c),!1;break;case 22:if(18!=b)return $f(a,"E_CSS_EXPR_COND",c),!1;case 10:return d.push(g),d.push(k),d.push(f),!1;default:return $f(a,"F_UNEXPECTED_STATE",c),!1}}}d.push(f);return!1}
function bg(a){for(var b=[];;){var c=x(a.B);switch(c.type){case 1:b.push(c.text);break;case 23:b.push("+");break;case 4:case 5:b.push(c.D);break;default:return b}A(a.B)}}
function cg(a,b,c){a=a.h.W();if(!a)return null;c=c||a.g;if(b){b=b.split(/\s+/);for(var d=0;d<b.length;d++)switch(b[d]){case "vertical":c=dd(a,c,new Gc(a,new Yc(a,"pref-horizontal")));break;case "horizontal":c=dd(a,c,new Yc(a,"pref-horizontal"));break;case "day":c=dd(a,c,new Gc(a,new Yc(a,"pref-night-mode")));break;case "night":c=dd(a,c,new Yc(a,"pref-night-mode"));break;default:c=a.f}}return c===a.g?null:new K(c)}
function dg(a){switch(a.e[a.e.length-1]){case "[selector]":case "font-face":case "-epubx-flow":case "-epubx-viewport":case "-epubx-define":case "-adapt-footnote-area":return!0}return!1}
function eg(a,b,c,d,e){var f=a.h,g=a.B,k=a.l,h,l,m,p;e&&(a.f=2,a.l.push("{"));for(;0<b;--b)switch(h=x(g),a.b[h.type]){case 28:if(18!=z(g,1).type){dg(a)?(f.error("E_CSS_COLON_EXPECTED",z(g,1)),a.b=Uf):(a.b=Qf,f.mb());continue}l=z(g,2);if(!(l.b||1!=l.type&&6!=l.type)){if(0<=g.b)throw Error("F_CSSTOK_BAD_CALL mark");g.b=g.d}a.d=h.text;a.k=!1;A(g);A(g);a.b=Rf;k.splice(0,k.length);continue;case 46:if(18!=z(g,1).type){a.b=Uf;f.error("E_CSS_COLON_EXPECTED",z(g,1));continue}a.d=h.text;a.k=!1;A(g);A(g);a.b=
Rf;k.splice(0,k.length);continue;case 29:a.b=Qf;f.mb();continue;case 1:if(!h.b){a.b=Vf;f.error("E_CSS_SPACE_EXPECTED",h);continue}f.fb();case 2:if(34==z(g,1).type)if(A(g),A(g),m=a.H[h.text],null!=m)switch(h=x(g),h.type){case 1:f.bb(m,h.text);a.b=Q;A(g);break;case 36:f.bb(m,null);a.b=Q;A(g);break;default:a.b=Tf,f.error("E_CSS_NAMESPACE",h)}else a.b=Tf,f.error("E_CSS_UNDECLARED_PREFIX",h);else f.bb(a.C,h.text),a.b=Q,A(g);continue;case 3:if(!h.b){a.b=Vf;f.error("E_CSS_SPACE_EXPECTED",h);continue}f.fb();
case 4:if(34==z(g,1).type)switch(A(g),A(g),h=x(g),h.type){case 1:f.bb(null,h.text);a.b=Q;A(g);break;case 36:f.bb(null,null);a.b=Q;A(g);break;default:a.b=Tf,f.error("E_CSS_NAMESPACE",h)}else f.bb(a.C,null),a.b=Q,A(g);continue;case 5:h.b&&f.fb();case 6:f.Kc(h.text);a.b=Q;A(g);continue;case 7:h.b&&f.fb();case 8:f.Dc(h.text);a.b=Q;A(g);continue;case 55:h.b&&f.fb();case 14:A(g);h=x(g);switch(h.type){case 1:f.Qb(h.text,null);A(g);a.b=Q;continue;case 6:if(l=h.text,A(g),m=bg(a),h=x(g),11==h.type){f.Qb(l,
m);A(g);a.b=Q;continue}}f.error("E_CSS_PSEUDOCLASS_SYNTAX",h);a.b=Tf;continue;case 42:A(g);h=x(g);switch(h.type){case 1:f.Rb(h.text,null);a.b=Q;A(g);continue;case 6:if(l=h.text,A(g),m=bg(a),h=x(g),11==h.type){f.Rb(l,m);a.b=Q;A(g);continue}}f.error("E_CSS_PSEUDOELEM_SYNTAX",h);a.b=Tf;continue;case 9:h.b&&f.fb();case 10:A(g);h=x(g);if(1==h.type)l=h.text,A(g);else if(36==h.type)l=null,A(g);else if(34==h.type)l="";else{a.b=Vf;f.error("E_CSS_ATTR",h);A(g);continue}h=x(g);if(34==h.type){m=l?a.H[l]:l;if(null==
m){a.b=Vf;f.error("E_CSS_UNDECLARED_PREFIX",h);A(g);continue}A(g);h=x(g);if(1!=h.type){a.b=Vf;f.error("E_CSS_ATTR_NAME_EXPECTED",h);continue}l=h.text;A(g);h=x(g)}else m="";switch(h.type){case 39:case 45:case 44:case 46:case 50:p=h.type;A(g);h=x(g);break;case 15:f.ec(m,l,0,null);a.b=Q;A(g);continue;default:a.b=Vf;f.error("E_CSS_ATTR_OP_EXPECTED",h);continue}switch(h.type){case 1:case 2:f.ec(m,l,p,h.text);A(g);h=x(g);break;default:a.b=Vf;f.error("E_CSS_ATTR_VAL_EXPECTED",h);continue}if(15!=h.type){a.b=
Vf;f.error("E_CSS_ATTR",h);continue}a.b=Q;A(g);continue;case 11:f.Cc();a.b=Pf;A(g);continue;case 12:f.Ac();a.b=Pf;A(g);continue;case 56:f.Hc();a.b=Pf;A(g);continue;case 13:a.Z?(a.e.push("-epubx-region"),a.Z=!1):a.N?(a.e.push("page"),a.N=!1):a.e.push("[selector]");f.na();a.b=Nf;A(g);continue;case 41:f.Ob();a.b=Qf;A(g);continue;case 15:k.push(H(h.text));A(g);continue;case 16:try{k.push(Df(h.text))}catch(q){f.error("E_CSS_COLOR",h),a.b=Tf}A(g);continue;case 17:k.push(new sd(h.D));A(g);continue;case 18:k.push(new td(h.D));
A(g);continue;case 19:k.push(new I(h.D,h.text));A(g);continue;case 20:k.push(new qd(h.text));A(g);continue;case 21:k.push(new vd(ua(h.text,a.fa)));A(g);continue;case 22:Zf(a,",",h);k.push(",");A(g);continue;case 23:k.push(pd);A(g);continue;case 24:l=h.text.toLowerCase();"-epubx-expr"==l?(a.b=Sf,a.f=0,k.push("{")):(k.push(l),k.push("("));A(g);continue;case 25:Zf(a,")",h);A(g);continue;case 47:A(g);h=x(g);l=z(g,1);if(1==h.type&&"important"==h.text.toLowerCase()&&(17==l.type||0==l.type||13==l.type)){A(g);
a.k=!0;continue}$f(a,"E_CSS_SYNTAX",h);continue;case 54:l=z(g,1);switch(l.type){case 4:case 3:case 5:if(!l.b){A(g);continue}}$f(a,"E_CSS_UNEXPECTED_PLUS",h);continue;case 26:A(g);case 48:g.b=-1;(l=Zf(a,";",h))&&a.d&&f.Xa(a.d,l,a.k);a.b=d?Of:Nf;continue;case 44:A(g);g.b=-1;l=Zf(a,";",h);if(c)return a.u=l,!0;a.d&&l&&f.Xa(a.d,l,a.k);if(d)return!0;$f(a,"E_CSS_SYNTAX",h);continue;case 31:l=z(g,1);9==l.type?(10!=z(g,2).type||z(g,2).b?(k.push(new Yc(f.W(),kc(h.text,l.text))),a.b=R):(k.push(h.text,l.text,
"("),A(g)),A(g)):(2==a.f||3==a.f?"not"==h.text.toLowerCase()?(A(g),k.push(new Zc(f.W(),!0,l.text))):("only"==h.text.toLowerCase()&&(A(g),h=l),k.push(new Zc(f.W(),!1,h.text))):k.push(new Yc(f.W(),h.text)),a.b=R);A(g);continue;case 38:k.push(null,h.text,"(");A(g);continue;case 32:k.push(new nc(f.W(),h.D));A(g);a.b=R;continue;case 33:l=h.text;"%"==l&&(l=a.d&&a.d.match(/height|^(top|bottom)$/)?"vh":"vw");k.push(new Xc(f.W(),h.D,l));A(g);a.b=R;continue;case 34:k.push(new nc(f.W(),h.text));A(g);a.b=R;continue;
case 35:A(g);h=x(g);5!=h.type||h.b?$f(a,"E_CSS_SYNTAX",h):(k.push(new cd(f.W(),h.D)),A(g),a.b=R);continue;case 36:k.push(-h.type);A(g);continue;case 37:a.b=Sf;ag(a,h.type,h);k.push(h.type);A(g);continue;case 45:"and"==h.text.toLowerCase()?(a.b=Sf,ag(a,52,h),k.push(52),A(g)):$f(a,"E_CSS_SYNTAX",h);continue;case 39:ag(a,h.type,h)&&(a.d?a.b=Rf:$f(a,"E_CSS_UNBALANCED_PAR",h));A(g);continue;case 43:ag(a,11,h)&&(a.d||3==a.f?$f(a,"E_CSS_UNEXPECTED_BRC",h):(1==a.f?f.tb(k.pop()):(h=k.pop(),f.tb(h)),a.e.push("media"),
f.na(),a.b=Nf));A(g);continue;case 49:if(ag(a,11,h))if(a.d||3!=a.f)$f(a,"E_CSS_UNEXPECTED_SEMICOL",h);else return a.j=k.pop(),a.w=!0,a.b=Nf,A(g),!1;A(g);continue;case 40:k.push(h.type);A(g);continue;case 27:a.b=Nf;A(g);f.gb();a.e.length&&a.e.pop();continue;case 30:l=h.text.toLowerCase();switch(l){case "import":A(g);h=x(g);if(2==h.type||8==h.type){a.F=h.text;A(g);h=x(g);if(17==h.type||0==h.type)return a.w=!0,A(g),!1;a.d=null;a.f=3;a.b=Sf;k.push("{");continue}f.error("E_CSS_IMPORT_SYNTAX",h);a.b=Tf;
continue;case "namespace":A(g);h=x(g);switch(h.type){case 1:l=h.text;A(g);h=x(g);if((2==h.type||8==h.type)&&17==z(g,1).type){a.H[l]=h.text;A(g);A(g);continue}break;case 2:case 8:if(17==z(g,1).type){a.C=h.text;A(g);A(g);continue}}f.error("E_CSS_NAMESPACE_SYNTAX",h);a.b=Tf;continue;case "charset":A(g);h=x(g);if(2==h.type&&17==z(g,1).type){l=h.text.toLowerCase();"utf-8"!=l&&"utf-16"!=l&&f.error("E_CSS_UNEXPECTED_CHARSET "+l,h);A(g);A(g);continue}f.error("E_CSS_CHARSET_SYNTAX",h);a.b=Tf;continue;case "font-face":case "-epubx-page-template":case "-epubx-define":case "-epubx-viewport":if(12==
z(g,1).type){A(g);A(g);switch(l){case "font-face":f.nc();break;case "-epubx-page-template":f.qc();break;case "-epubx-define":f.lc();break;case "-epubx-viewport":f.sc()}a.e.push(l);f.na();continue}break;case "-adapt-footnote-area":A(g);h=x(g);switch(h.type){case 12:A(g);f.Tb(null);a.e.push(l);f.na();continue;case 50:if(A(g),h=x(g),1==h.type&&12==z(g,1).type){l=h.text;A(g);A(g);f.Tb(l);a.e.push("-adapt-footnote-area");f.na();continue}}break;case "-epubx-region":A(g);f.rc();a.Z=!0;a.b=Qf;continue;case "page":A(g);
f.Db();a.N=!0;a.b=Pf;continue;case "top-left-corner":case "top-left":case "top-center":case "top-right":case "top-right-corner":case "right-top":case "right-middle":case "right-bottom":case "bottom-right-corner":case "bottom-right":case "bottom-center":case "bottom-left":case "bottom-left-corner":case "left-bottom":case "left-middle":case "left-top":A(g);h=x(g);if(12==h.type){A(g);f.Wc(l);a.e.push(l);f.na();continue}break;case "-epubx-when":A(g);a.d=null;a.f=1;a.b=Sf;k.push("{");continue;case "media":A(g);
a.d=null;a.f=2;a.b=Sf;k.push("{");continue;case "-epubx-flow":if(1==z(g,1).type&&12==z(g,2).type){f.mc(z(g,1).text);A(g);A(g);A(g);a.e.push(l);f.na();continue}break;case "-epubx-page-master":case "-epubx-partition":case "-epubx-partition-group":A(g);h=x(g);p=m=null;var t=[];1==h.type&&(m=h.text,A(g),h=x(g));18==h.type&&1==z(g,1).type&&(p=z(g,1).text,A(g),A(g),h=x(g));for(;6==h.type&&"class"==h.text.toLowerCase()&&1==z(g,1).type&&11==z(g,2).type;)t.push(z(g,1).text),A(g),A(g),A(g),h=x(g);if(12==h.type){A(g);
switch(l){case "-epubx-page-master":f.oc(m,p,t);break;case "-epubx-partition":f.Vb(m,p,t);break;case "-epubx-partition-group":f.Ub(m,p,t)}a.e.push(l);f.na();continue}break;case "":f.error("E_CSS_UNEXPECTED_AT"+l,h);a.b=Vf;continue;default:f.error("E_CSS_AT_UNKNOWN "+l,h);a.b=Tf;continue}f.error("E_CSS_AT_SYNTAX "+l,h);a.b=Tf;continue;case 50:if(c||d)return!0;a.g.push(h.type+1);A(g);continue;case 52:if(c||d)return!0;if(0==a.g.length){a.b=Nf;continue}case 51:0<a.g.length&&a.g[a.g.length-1]==h.type&&
a.g.pop();0==a.g.length&&13==h.type&&(a.b=Nf);A(g);continue;case 53:if(c||d)return!0;0==a.g.length&&(a.b=Nf);A(g);continue;case 200:return!0;default:if(c||d)return!0;if(e)return ag(a,11,h)?(a.u=k.pop(),!0):!1;if(a.b===Rf&&0<=g.b){h=g;if(0>h.b)throw Error("F_CSSTOK_BAD_CALL reset");h.d=h.b;h.b=-1;a.b=Qf;f.mb();continue}if(a.b!==Tf&&a.b!==Vf&&a.b!==Uf){51==h.type?f.error(h.text,h):f.error("E_CSS_SYNTAX",h);a.b=dg(a)?Uf:Vf;continue}A(g)}return!1}function fg(a){Ef.call(this,null);this.d=a}u(fg,Ef);
fg.prototype.error=function(a){throw Error(a);};fg.prototype.W=function(){return this.d};
function gg(a,b,c,d,e){var f=L("parseStylesheet"),g=new Xf(Nf,a,b,c),k=null;e&&(k=hg(new bc(e,b),b,c));if(k=cg(g,d,k&&k.ia()))b.tb(k),b.na();rf(function(){for(;!eg(g,100,!1,!1,!1);){if(g.w){var a=ua(g.F,c);g.j&&(b.tb(g.j),b.na());var d=L("parseStylesheet.import");ig(a,b,null,null).then(function(){g.j&&b.gb();g.w=!1;g.F=null;g.j=null;O(d,!0)});return N(d)}a=qf();if(a.Aa)return a}return M(!1)}).then(function(){k&&b.gb();O(f,!0)});return N(f)}
function jg(a,b,c,d,e){return af("parseStylesheetFromText",function(f){var g=new bc(a,b);gg(g,b,c,d,e).ra(f)},function(b,c){v.b(c,"Failed to parse stylesheet text: "+a);O(b,!1)})}function ig(a,b,c,d){return af("parseStylesheetFromURL",function(e){vf(a).then(function(f){f.responseText?jg(f.responseText,b,a,c,d).then(function(b){b||v.b("Failed to parse stylesheet from "+a);O(e,!0)}):O(e,!0)})},function(b,c){v.b(c,"Exception while fetching and parsing:",a);O(b,!0)})}
function kg(a,b){var c=new Xf(Rf,b,new fg(a),"");eg(c,Number.POSITIVE_INFINITY,!0,!1,!1);return c.u}function hg(a,b,c){a=new Xf(Sf,a,b,c);eg(a,Number.POSITIVE_INFINITY,!1,!1,!0);return a.u}var lg={"z-index":!0,"column-count":!0,"flow-linger":!0,opacity:!0,page:!0,"flow-priority":!0,utilization:!0};
function mg(a,b,c){if(b.fd())a:{b=b.d;a=b.evaluate(a);switch(typeof a){case "number":c=lg[c]?a==Math.round(a)?new td(a):new sd(a):new I(a,"px");break a;case "string":c=a?kg(b.b,new bc(a,null)):G;break a;case "boolean":c=a?me:Kd;break a;case "undefined":c=G;break a}throw Error("E_UNEXPECTED");}else c=b;return c};function ng(){this.b={}}u(ng,hd);ng.prototype.ob=function(a){this.b[a.name]=!0;return a};ng.prototype.Za=function(a){this.pb(a.values);return a};function og(a){this.value=a}u(og,hd);og.prototype.Gb=function(a){this.value=a.D;return a};function pg(a,b){if(a){var c=new og(b);try{return a.T(c),c.value}catch(d){v.b(d,"toInt: ")}}return b}function qg(){this.d=!1;this.b=[];this.name=null}u(qg,hd);qg.prototype.Ib=function(a){this.d&&this.b.push(a);return null};
qg.prototype.Hb=function(a){this.d&&0==a.D&&this.b.push(new I(0,"px"));return null};qg.prototype.Za=function(a){this.pb(a.values);return null};qg.prototype.ub=function(a){this.d||(this.d=!0,this.pb(a.values),this.d=!1,this.name=a.name.toLowerCase());return null};
function rg(a,b,c,d,e,f){if(a){var g=new qg;try{a.T(g);var k;a:{if(0<g.b.length){a=[];for(var h=0;h<g.b.length;h++){var l=g.b[h];if("%"==l.ea){var m=0==h%2?d:e;3==h&&"circle"==g.name&&(m=Math.sqrt((d*d+e*e)/2));a.push(l.D*m/100)}else a.push(l.D*wc(f,l.ea,!1))}switch(g.name){case "polygon":if(0==a.length%2){f=[];for(g=0;g<a.length;g+=2)f.push({x:b+a[g],y:c+a[g+1]});k=new ze(f);break a}break;case "rectangle":if(4==a.length){k=De(b+a[0],c+a[1],b+a[0]+a[2],c+a[1]+a[3]);break a}break;case "ellipse":if(4==
a.length){k=Ce(b+a[0],c+a[1],a[2],a[3]);break a}break;case "circle":if(3==a.length){k=Ce(b+a[0],c+a[1],a[2],a[2]);break a}}}k=null}return k}catch(p){v.b(p,"toShape:")}}return De(b,c,b+d,c+e)}function sg(a){this.d=a;this.b={};this.name=null}u(sg,hd);sg.prototype.ob=function(a){this.name=a.toString();this.b[this.name]=this.d?0:(this.b[this.name]||0)+1;return a};sg.prototype.Gb=function(a){this.name&&(this.b[this.name]+=a.D-(this.d?0:1));return a};sg.prototype.Za=function(a){this.pb(a.values);return a};
function tg(a,b){var c=new sg(b);try{a.T(c)}catch(d){v.b(d,"toCounters:")}return c.b};function Bf(a,b){this.fc=a;this.name=b;this.d=!1;this.b=this.f=null;this.e=[]}Bf.prototype.start=function(){if(!this.b){var a=this;this.b=df(We.d,function(){var b=L("Fetcher.run");a.fc().then(function(c){var d=a.e;a.d=!0;a.f=c;a.b=null;a.e=[];if(d)for(var e=0;e<d.length;e++)try{d[e](c)}catch(f){v.error(f,"Error:")}O(b,c)});return N(b)},this.name)}};function ug(a,b){a.d?b(a.f):a.e.push(b)}function zf(a){if(a.d)return M(a.f);a.start();return a.b.join()}
function vg(a){if(0==a.length)return M(!0);if(1==a.length)return zf(a[0]).Xc(!0);var b=L("waitForFetches"),c=0;rf(function(){for(;c<a.length;){var b=a[c++];if(!b.d)return zf(b).Xc(!0)}return M(!1)}).then(function(){O(b,!0)});return N(b)}
function wg(a,b){var c=null,d=null;"img"==a.localName&&(c=a.getAttribute("width"),d=a.getAttribute("height"));var e=new Bf(function(){function e(b){"img"==a.localName&&(c||a.removeAttribute("width"),d||a.removeAttribute("height"));k.Ta(b?b.type:"timeout")}var g=L("loadImage"),k=lf(g,a);a.addEventListener("load",e,!1);a.addEventListener("error",e,!1);a.addEventListener("abort",e,!1);"http://www.w3.org/2000/svg"==a.namespaceURI?(a.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",b),setTimeout(e,
300)):a.src=b;return N(g)},"loadElement "+b);e.start();return e};function xg(a){this.f=this.e=null;this.d=0;this.b=a}function yg(a,b){this.b=-1;this.d=a;this.e=b}function zg(){this.b=[];this.d=[];this.match=[];this.e=[];this.error=[];this.f=!0}function Ag(a,b,c){for(var d=0;d<b.length;d++)a.d[b[d]].b=c;b.splice(0,b.length)}
zg.prototype.clone=function(){for(var a=new zg,b=0;b<this.b.length;b++){var c=this.b[b],d=new xg(c.b);d.d=c.d;a.b.push(d)}for(b=0;b<this.d.length;b++)c=this.d[b],d=new yg(c.d,c.e),d.b=c.b,a.d.push(d);a.match.push.apply(a.match,this.match);a.e.push.apply(a.e,this.e);a.error.push.apply(a.error,this.error);return a};
function Bg(a,b,c,d){var e=a.b.length,f=new xg(Cg);f.d=0<=d?c?2*d+1:2*d+2:c?-1:-2;a.b.push(f);Ag(a,b,e);c=new yg(e,!0);e=new yg(e,!1);b.push(a.d.length);a.d.push(e);b.push(a.d.length);a.d.push(c)}function Dg(a){return 1==a.b.length&&0==a.b[0].d&&a.b[0].b instanceof Eg}
function Fg(a,b,c){if(0!=b.b.length){var d=a.b.length;if(4==c&&1==d&&Dg(b)&&Dg(a)){c=a.b[0].b;b=b.b[0].b;var d={},e={},f;for(f in c.d)d[f]=c.d[f];for(f in b.d)d[f]=b.d[f];for(var g in c.e)e[g]=c.e[g];for(g in b.e)e[g]=b.e[g];a.b[0].b=new Eg(c.b|b.b,d,e)}else{for(f=0;f<b.b.length;f++)a.b.push(b.b[f]);4==c?(a.f=!0,Ag(a,a.e,d)):Ag(a,a.match,d);g=a.d.length;for(f=0;f<b.d.length;f++)e=b.d[f],e.d+=d,0<=e.b&&(e.b+=d),a.d.push(e);for(f=0;f<b.match.length;f++)a.match.push(b.match[f]+g);3==c&&Ag(a,a.match,
d);if(2==c||3==c)for(f=0;f<b.e.length;f++)a.match.push(b.e[f]+g);else if(a.f){for(f=0;f<b.e.length;f++)a.e.push(b.e[f]+g);a.f=b.f}else for(f=0;f<b.e.length;f++)a.error.push(b.e[f]+g);for(f=0;f<b.error.length;f++)a.error.push(b.error[f]+g);b.b=null;b.d=null}}}var S={};function Gg(){}u(Gg,hd);Gg.prototype.f=function(a,b){var c=a[b].T(this);return c?[c]:null};function Eg(a,b,c){this.b=a;this.d=b;this.e=c}u(Eg,Gg);n=Eg.prototype;n.Yc=function(a){return this.b&1?a:null};
n.Zc=function(a){return this.b&2048?a:null};n.Xb=function(a){return this.b&2?a:null};n.ob=function(a){var b=this.d[a.name.toLowerCase()];return b?b:this.b&4?a:null};n.Ib=function(a){return 0!=a.D||this.b&512?0>a.D&&!(this.b&256)?null:this.e[a.ea]?a:null:"%"==a.ea&&this.b&1024?a:null};n.Hb=function(a){return 0==a.D?this.b&512?a:null:0>=a.D&&!(this.b&256)?null:this.b&16?a:null};n.Gb=function(a){return 0==a.D?this.b&512?a:null:0>=a.D&&!(this.b&256)?null:this.b&48?a:(a=this.d[""+a.D])?a:null};
n.vc=function(a){return this.b&64?a:null};n.Yb=function(a){return this.b&128?a:null};n.Za=function(){return null};n.nb=function(){return null};n.ub=function(){return null};n.Fb=function(){return null};var Cg=new Eg(0,S,S);
function Hg(a){this.b=new xg(null);var b=this.e=new xg(null),c=a.b.length;a.b.push(this.b);a.b.push(b);Ag(a,a.match,c);Ag(a,a.e,c+1);Ag(a,a.error,c+1);for(b=0;b<a.d.length;b++){var d=a.d[b];d.e?a.b[d.d].e=a.b[d.b]:a.b[d.d].f=a.b[d.b]}for(b=0;b<c;b++)if(null==a.b[b].f||null==a.b[b].e)throw Error("Invalid validator state");this.d=a.b[0]}u(Hg,Gg);
function Ig(a,b,c,d){for(var e=c?[]:b,f=a.d,g=d,k=null,h=null;f!==a.b&&f!==a.e;)if(g>=b.length)f=f.f;else{var l=b[g],m=l;if(0!=f.d)m=!0,-1==f.d?(k?k.push(h):k=[h],h=[]):-2==f.d?0<k.length?h=k.pop():h=null:0<f.d&&0==f.d%2?h[Math.floor((f.d-1)/2)]="taken":m=null==h[Math.floor((f.d-1)/2)],f=m?f.e:f.f;else{if(0==g&&!c&&f.b instanceof Jg&&a instanceof Jg){if(m=(new jd(b)).T(f.b)){g=b.length;f=f.e;continue}}else if(0==g&&!c&&f.b instanceof Kg&&a instanceof Jg){if(m=(new kd(b)).T(f.b)){g=b.length;f=f.e;
continue}}else m=l.T(f.b);if(m){if(m!==l&&b===e)for(e=[],l=0;l<g;l++)e[l]=b[l];b!==e&&(e[g-d]=m);g++;f=f.e}else f=f.f}}return f===a.b&&(c?0<e.length:g==b.length)?e:null}n=Hg.prototype;n.Qa=function(a){for(var b=null,c=this.d;c!==this.b&&c!==this.e;)a?0!=c.d?c=c.e:(b=a.T(c.b))?(a=null,c=c.e):c=c.f:c=c.f;return c===this.b?b:null};n.Yc=function(a){return this.Qa(a)};n.Zc=function(a){return this.Qa(a)};n.Xb=function(a){return this.Qa(a)};n.ob=function(a){return this.Qa(a)};n.Ib=function(a){return this.Qa(a)};
n.Hb=function(a){return this.Qa(a)};n.Gb=function(a){return this.Qa(a)};n.vc=function(a){return this.Qa(a)};n.Yb=function(a){return this.Qa(a)};n.Za=function(){return null};n.nb=function(){return null};n.ub=function(a){return this.Qa(a)};n.Fb=function(){return null};function Jg(a){Hg.call(this,a)}u(Jg,Hg);Jg.prototype.Za=function(a){var b=Ig(this,a.values,!1,0);return b===a.values?a:b?new jd(b):null};
Jg.prototype.nb=function(a){for(var b=this.d,c=!1;b;){if(b.b instanceof Kg){c=!0;break}b=b.f}return c?(b=Ig(this,a.values,!1,0),b===a.values?a:b?new kd(b):null):null};Jg.prototype.f=function(a,b){return Ig(this,a,!0,b)};function Kg(a){Hg.call(this,a)}u(Kg,Hg);Kg.prototype.Za=function(a){return this.Qa(a)};Kg.prototype.nb=function(a){var b=Ig(this,a.values,!1,0);return b===a.values?a:b?new kd(b):null};function Lg(a,b){Hg.call(this,b);this.name=a}u(Lg,Hg);Lg.prototype.Qa=function(){return null};
Lg.prototype.ub=function(a){if(a.name.toLowerCase()!=this.name)return null;var b=Ig(this,a.values,!1,0);return b===a.values?a:b?new ld(a.name,b):null};function Mg(){}Mg.prototype.b=function(a,b){return b};Mg.prototype.e=function(){};function Ng(a,b,c){this.name=b;this.d=a.e[this.name];c&&this.d instanceof Kg&&(this.d=this.d.d.b)}u(Ng,Mg);Ng.prototype.b=function(a,b,c){if(c.values[this.name])return b;if(a=this.d.f(a,b)){var d=a.length;this.e(1<d?new jd(a):a[0],c);return b+d}return b};
Ng.prototype.e=function(a,b){b.values[this.name]=a};function Og(a,b){Ng.call(this,a,b[0],!1);this.f=b}u(Og,Ng);Og.prototype.e=function(a,b){for(var c=0;c<this.f.length;c++)b.values[this.f[c]]=a};function Pg(a,b){this.d=a;this.md=b}u(Pg,Mg);Pg.prototype.b=function(a,b,c){var d=b;if(this.md)if(a[b]==pd){if(++b==a.length)return d}else return d;var e=this.d[0].b(a,b,c);if(e==b)return d;b=e;for(d=1;d<this.d.length&&b<a.length;d++){e=this.d[d].b(a,b,c);if(e==b)break;b=e}return b};
function Qg(){this.b=this.Oa=null;this.error=!1;this.values={};this.d=null}n=Qg.prototype;n.Dd=function(a){return new Ng(this.d,a,!1)};n.clone=function(){var a=new this.constructor;a.Oa=this.Oa;a.b=this.b;a.d=this.d;return a};n.bd=function(a,b){this.Oa=a;this.b=b};n.wb=function(){this.error=!0;return 0};function Rg(a,b){a.wb([b]);return null}n.Yc=function(a){return Rg(this,a)};n.Xb=function(a){return Rg(this,a)};n.ob=function(a){return Rg(this,a)};n.Ib=function(a){return Rg(this,a)};
n.Hb=function(a){return Rg(this,a)};n.Gb=function(a){return Rg(this,a)};n.vc=function(a){return Rg(this,a)};n.Yb=function(a){return Rg(this,a)};n.Za=function(a){this.wb(a.values);return null};n.nb=function(){this.error=!0;return null};n.ub=function(a){return Rg(this,a)};n.Fb=function(){this.error=!0;return null};function Sg(){Qg.call(this)}u(Sg,Qg);Sg.prototype.wb=function(a){for(var b=0,c=0;b<a.length;){var d=this.Oa[c].b(a,b,this);if(d>b)b=d,c=0;else if(++c==this.Oa.length){this.error=!0;break}}return b};
function Tg(){Qg.call(this)}u(Tg,Qg);Tg.prototype.wb=function(a){if(a.length>this.Oa.length||0==a.length)return this.error=!0,0;for(var b=0;b<this.Oa.length;b++){for(var c=b;c>=a.length;)c=1==c?0:c-2;if(this.Oa[b].b(a,c,this)!=c+1)return this.error=!0,0}return a.length};function Ug(){Qg.call(this)}u(Ug,Qg);
Ug.prototype.wb=function(a){for(var b=a.length,c=0;c<a.length;c++)if(a[c]===pd){b=c;break}if(b>this.Oa.length||0==a.length)return this.error=!0,0;for(c=0;c<this.Oa.length;c++){for(var d=c;d>=b;)d=1==d?0:d-2;var e;if(b+1<a.length)for(e=b+c+1;e>=a.length;)e-=e==b+2?1:2;else e=d;if(2!=this.Oa[c].b([a[d],a[e]],0,this))return this.error=!0,0}return a.length};function Vg(){Qg.call(this)}u(Vg,Sg);Vg.prototype.Dd=function(a){return new Ng(this.d,a,!0)};
Vg.prototype.nb=function(a){for(var b={},c=0;c<a.values.length;c++){this.values={};a.values[c].T(this);for(var d=b,e=this.values,f=0;f<this.b.length;f++){var g=this.b[f],k=e[g]||this.d.h[g],h=d[g];h||(h=[],d[g]=h);h.push(k)}this.values["background-color"]&&c!=a.values.length-1&&(this.error=!0);if(this.error)return null}this.values={};for(var l in b)this.values[l]="background-color"==l?b[l].pop():new kd(b[l]);return null};function Wg(){Qg.call(this)}u(Wg,Sg);
Wg.prototype.bd=function(a,b){Sg.prototype.bd.call(this,a,b);this.b.push("font-family","line-height","font-size")};
Wg.prototype.wb=function(a){var b=Sg.prototype.wb.call(this,a);if(b+2>a.length)return this.error=!0,b;this.error=!1;var c=this.d.e;if(!a[b].T(c["font-size"]))return this.error=!0,b;this.values["font-size"]=a[b++];if(a[b]===pd){b++;if(b+2>a.length||!a[b].T(c["line-height"]))return this.error=!0,b;this.values["line-height"]=a[b++]}var d=b==a.length-1?a[b]:new jd(a.slice(b,a.length));if(!d.T(c["font-family"]))return this.error=!0,b;this.values["font-family"]=d;return a.length};
Wg.prototype.nb=function(a){a.values[0].T(this);if(this.error)return null;for(var b=[this.values["font-family"]],c=1;c<a.values.length;c++)b.push(a.values[c]);a=new kd(b);a.T(this.d.e["font-family"])?this.values["font-family"]=a:this.error=!0;return null};Wg.prototype.ob=function(a){if(a=this.d.d[a.name])for(var b in a)this.values[b]=a[b];else this.error=!0;return null};var Xg={SIMPLE:Sg,INSETS:Tg,INSETS_SLASH:Ug,COMMA:Vg,FONT:Wg};
function Yg(){this.e={};this.k={};this.h={};this.b={};this.d={};this.f={};this.j=[];this.g=[]}function Zg(a,b){var c;if(3==b.type)c=new I(b.D,b.text);else if(7==b.type)c=Df(b.text);else if(1==b.type)c=H(b.text);else throw Error("unexpected replacement");if(Dg(a)){var d=a.b[0].b.d,e;for(e in d)d[e]=c;return a}throw Error("unexpected replacement");}
function $g(a,b,c){for(var d=new zg,e=0;e<b;e++)Fg(d,a.clone(),1);if(c==Number.POSITIVE_INFINITY)Fg(d,a,3);else for(e=b;e<c;e++)Fg(d,a.clone(),2);return d}function ah(a){var b=new zg,c=b.b.length;b.b.push(new xg(a));a=new yg(c,!0);var d=new yg(c,!1);Ag(b,b.match,c);b.f?(b.e.push(b.d.length),b.f=!1):b.error.push(b.d.length);b.d.push(d);b.match.push(b.d.length);b.d.push(a);return b}
function bh(a,b){var c;switch(a){case "COMMA":c=new Kg(b);break;case "SPACE":c=new Jg(b);break;default:c=new Lg(a.toLowerCase(),b)}return ah(c)}
function ch(a){a.b.HASHCOLOR=ah(new Eg(64,S,S));a.b.POS_INT=ah(new Eg(32,S,S));a.b.POS_NUM=ah(new Eg(16,S,S));a.b.POS_PERCENTAGE=ah(new Eg(8,S,{"%":G}));a.b.NEGATIVE=ah(new Eg(256,S,S));a.b.ZERO=ah(new Eg(512,S,S));a.b.ZERO_PERCENTAGE=ah(new Eg(1024,S,S));a.b.POS_LENGTH=ah(new Eg(8,S,{em:G,ex:G,ch:G,rem:G,vh:G,vw:G,vmin:G,vmax:G,cm:G,mm:G,"in":G,px:G,pt:G,pc:G,q:G}));a.b.POS_ANGLE=ah(new Eg(8,S,{deg:G,grad:G,rad:G,turn:G}));a.b.POS_TIME=ah(new Eg(8,S,{s:G,ms:G}));a.b.FREQUENCY=ah(new Eg(8,S,{Hz:G,
kHz:G}));a.b.RESOLUTION=ah(new Eg(8,S,{dpi:G,dpcm:G,dppx:G}));a.b.URI=ah(new Eg(128,S,S));a.b.IDENT=ah(new Eg(4,S,S));a.b.STRING=ah(new Eg(2,S,S));var b={"font-family":H("sans-serif")};a.d.caption=b;a.d.icon=b;a.d.menu=b;a.d["message-box"]=b;a.d["small-caption"]=b;a.d["status-bar"]=b}function dh(a){return!!a.match(/^[A-Z_0-9]+$/)}
function eh(a,b,c){var d=x(b);if(0==d.type)return null;var e={"":!0};if(14==d.type){do{A(b);d=x(b);if(1!=d.type)throw Error("Prefix name expected");e[d.text]=!0;A(b);d=x(b)}while(16==d.type);if(15!=d.type)throw Error("']' expected");A(b);d=x(b)}if(1!=d.type)throw Error("Property name expected");if(2==c?"SHORTHANDS"==d.text:"DEFAULTS"==d.text)return A(b),null;d=d.text;A(b);if(2!=c){if(39!=x(b).type)throw Error("'=' expected");dh(d)||(a.k[d]=e)}else if(18!=x(b).type)throw Error("':' expected");return d}
function fh(a,b){for(;;){var c=eh(a,b,1);if(!c)break;for(var d=[],e=[],f="",g,k=!0,h=function(){if(0==d.length)throw Error("No values");var a;if(1==d.length)a=d[0];else{var b=f,c=d;a=new zg;if("||"==b){for(b=0;b<c.length;b++){var e=new zg,g=e;if(g.b.length)throw Error("invalid call");var h=new xg(Cg);h.d=2*b+1;g.b.push(h);var h=new yg(0,!0),k=new yg(0,!1);g.e.push(g.d.length);g.d.push(k);g.match.push(g.d.length);g.d.push(h);Fg(e,c[b],1);Bg(e,e.match,!1,b);Fg(a,e,0==b?1:4)}c=new zg;if(c.b.length)throw Error("invalid call");
Bg(c,c.match,!0,-1);Fg(c,a,3);a=[c.match,c.e,c.error];for(b=0;b<a.length;b++)Bg(c,a[b],!1,-1);a=c}else{switch(b){case " ":e=1;break;case "|":case "||":e=4;break;default:throw Error("unexpected op");}for(b=0;b<c.length;b++)Fg(a,c[b],0==b?1:e)}}return a},l=function(a){if(k)throw Error("'"+a+"': unexpected");if(f&&f!=a)throw Error("mixed operators: '"+a+"' and '"+f+"'");f=a;k=!0},m=null;!m;)switch(A(b),g=x(b),g.type){case 1:k||l(" ");if(dh(g.text)){var p=a.b[g.text];if(!p)throw Error("'"+g.text+"' unexpected");
d.push(p.clone())}else p={},p[g.text]=H(g.text),d.push(ah(new Eg(0,p,S)));k=!1;break;case 5:p={};p[""+g.D]=new td(g.D);d.push(ah(new Eg(0,p,S)));k=!1;break;case 34:l("|");break;case 25:l("||");break;case 14:k||l(" ");e.push({od:d,kd:f,Bc:"["});f="";d=[];k=!0;break;case 6:k||l(" ");e.push({od:d,kd:f,Bc:"(",Ab:g.text});f="";d=[];k=!0;break;case 15:g=h();p=e.pop();if("["!=p.Bc)throw Error("']' unexpected");d=p.od;d.push(g);f=p.kd;k=!1;break;case 11:g=h();p=e.pop();if("("!=p.Bc)throw Error("')' unexpected");
d=p.od;d.push(bh(p.Ab,g));f=p.kd;k=!1;break;case 18:if(k)throw Error("':' unexpected");A(b);d.push(Zg(d.pop(),x(b)));break;case 22:if(k)throw Error("'?' unexpected");d.push($g(d.pop(),0,1));break;case 36:if(k)throw Error("'*' unexpected");d.push($g(d.pop(),0,Number.POSITIVE_INFINITY));break;case 23:if(k)throw Error("'+' unexpected");d.push($g(d.pop(),1,Number.POSITIVE_INFINITY));break;case 12:A(b);g=x(b);if(5!=g.type)throw Error("<int> expected");var q=p=g.D;A(b);g=x(b);if(16==g.type){A(b);g=x(b);
if(5!=g.type)throw Error("<int> expected");q=g.D;A(b);g=x(b)}if(13!=g.type)throw Error("'}' expected");d.push($g(d.pop(),p,q));break;case 17:m=h();if(0<e.length)throw Error("unclosed '"+e.pop().Bc+"'");break;default:throw Error("unexpected token");}A(b);dh(c)?a.b[c]=m:a.e[c]=1!=m.b.length||0!=m.b[0].d?new Jg(m):m.b[0].b}}
function gh(a,b){for(var c={},d=0;d<b.length;d++)for(var e=b[d],f=a.f[e],e=f?f.b:[e],f=0;f<e.length;f++){var g=e[f],k=a.h[g];k?c[g]=k:v.b("Unknown property in makePropSet:",g)}return c}
function hh(a,b,c,d,e){var f="",g=b;b=b.toLowerCase();var k=b.match(/^-([a-z]+)-([-a-z0-9]+)$/);k&&(f=k[1],b=k[2]);if((k=a.k[b])&&k[f])if(f=a.e[b])(a=c===Pd||c.fd()?c:c.T(f))?e.Ya(b,a,d):e.Mb(g,c);else if(b=a.f[b].clone(),c===Pd)for(c=0;c<b.b.length;c++)e.Ya(b.b[c],Pd,d);else{c.T(b);if(b.error)d=!1;else{for(a=0;a<b.b.length;a++)f=b.b[a],e.Ya(f,b.values[f]||b.d.h[f],d);d=!0}d||e.Mb(g,c)}else e.uc(g,c)}
var ih=new Bf(function(){var a=L("loadValidatorSet.load"),b=ua("validation.txt",ta),c=vf(b),d=new Yg;ch(d);c.then(function(c){try{if(c.responseText){var f=new bc(c.responseText,null);for(fh(d,f);;){var g=eh(d,f,2);if(!g)break;for(c=[];;){A(f);var k=x(f);if(17==k.type){A(f);break}switch(k.type){case 1:c.push(H(k.text));break;case 4:c.push(new sd(k.D));break;case 5:c.push(new td(k.D));break;case 3:c.push(new I(k.D,k.text));break;default:throw Error("unexpected token");}}d.h[g]=1<c.length?new jd(c):
c[0]}for(;;){var h=eh(d,f,3);if(!h)break;var l=z(f,1),m;1==l.type&&Xg[l.text]?(m=new Xg[l.text],A(f)):m=new Sg;m.d=d;g=!1;k=[];c=!1;for(var p=[],q=[];!g;)switch(A(f),l=x(f),l.type){case 1:if(d.e[l.text])k.push(m.Dd(l.text)),q.push(l.text);else if(d.f[l.text]instanceof Tg){var t=d.f[l.text];k.push(new Og(t.d,t.b));q.push.apply(q,t.b)}else throw Error("'"+l.text+"' is neither a simple property nor an inset shorthand");break;case 19:if(0<k.length||c)throw Error("unexpected slash");c=!0;break;case 14:p.push({md:c,
Oa:k});k=[];c=!1;break;case 15:var r=new Pg(k,c),y=p.pop(),k=y.Oa;c=y.md;k.push(r);break;case 17:g=!0;A(f);break;default:throw Error("unexpected token");}m.bd(k,q);d.f[h]=m}d.g=gh(d,["background"]);d.j=gh(d,"margin border padding columns column-gap column-rule column-fill".split(" "))}else v.error("Error: missing",b)}catch(J){v.error(J,"Error:")}O(a,d)});return N(a)},"validatorFetcher");var jh={"font-style":Yd,"font-variant":Yd,"font-weight":Yd},kh="OTTO"+(new Date).valueOf(),lh=1;function mh(a,b){var c={},d;for(d in a)c[d]=a[d].evaluate(b,d);for(var e in jh)c[e]||(c[e]=jh[e]);return c}function nh(a){a=this.sb=a;var b=new Qa,c;for(c in jh)b.append(" "),b.append(a[c].toString());this.d=b.toString();this.src=this.sb.src?this.sb.src.toString():null;this.e=[];this.f=[];this.b=(c=this.sb["font-family"])?c.stringValue():null}
function oh(a,b,c){var d=new Qa;d.append("@font-face {\n  font-family: ");d.append(a.b);d.append(";\n  ");for(var e in jh)d.append(e),d.append(": "),a.sb[e].ya(d,!0),d.append(";\n  ");c?(d.append('src: url("'),b=(window.URL||window.webkitURL).createObjectURL(c),d.append(b),a.e.push(b),a.f.push(c),d.append('")')):(d.append("src: "),d.append(b));d.append(";\n}\n");return d.toString()}function ph(a){this.d=a;this.b={}}
function qh(a,b){if(b instanceof kd){for(var c=b.values,d=[],e=0;e<c.length;e++){var f=c[e],g=a.b[f.stringValue()];g&&d.push(H(g));d.push(f)}return new kd(d)}return(c=a.b[b.stringValue()])?new kd([H(c),b]):b}function rh(a,b){this.d=a;this.b=b;this.e={};this.f=0}function sh(a,b,c){b=b.b;var d=c.b[b];if(d)return d;d="Fnt_"+ ++a.f;return c.b[b]=d}
function th(a,b,c,d){var e=L("initFont"),f=b.src,g={},k;for(k in jh)g[k]=b.sb[k];d=sh(a,b,d);g["font-family"]=H(d);var h=new nh(g),l=a.b.ownerDocument.createElement("span");l.textContent="M";var m=(new Date).valueOf()+1E3;b=a.d.ownerDocument.createElement("style");k=kh+lh++;b.textContent=oh(h,"",wf([k]));a.d.appendChild(b);a.b.appendChild(l);l.style.visibility="hidden";l.style.fontFamily=d;for(var p in jh)w(l,p,g[p].toString());var g=l.getBoundingClientRect(),q=g.right-g.left,t=g.bottom-g.top;b.textContent=
oh(h,f,c);v.e("Starting to load font:",f);var r=!1;rf(function(){var a=l.getBoundingClientRect(),b=a.bottom-a.top;if(q!=a.right-a.left||t!=b)return r=!0,M(!1);(new Date).valueOf()>m?a=M(!1):(a=L("Frame.sleep"),lf(a).Ta(!0,10),a=N(a));return a}).then(function(){r?v.e("Loaded font:",f):v.b("Failed to load font:",f);a.b.removeChild(l);O(e,h)});return N(e)}
function uh(a,b,c){var d=b.src,e=a.e[d];e?ug(e,function(a){if(a.d==b.d){var e=b.b,k=c.b[e];a=a.b;if(k){if(k!=a)throw Error("E_FONT_FAMILY_INCONSISTENT "+b.b);}else c.b[e]=a;v.b("Found already-loaded font:",d)}else v.b("E_FONT_FACE_INCOMPATIBLE",b.src)}):(e=new Bf(function(){var e=L("loadFont"),g=c.d?c.d(d):null;g?vf(d,"blob").then(function(d){d.jc?g(d.jc).then(function(d){th(a,b,d,c).ra(e)}):O(e,null)}):th(a,b,null,c).ra(e);return N(e)},"loadFont "+d),a.e[d]=e,e.start());return e}
function vh(a,b,c){for(var d=[],e=0;e<b.length;e++){var f=b[e];f.src&&f.b?d.push(uh(a,f,c)):v.b("E_FONT_FACE_INVALID")}return vg(d)};function wh(a,b,c){this.j=a;this.url=b;this.b=c;this.lang=null;this.f=-1;this.root=c.documentElement;a=null;if("http://www.w3.org/1999/xhtml"==this.root.namespaceURI){for(b=this.root.firstChild;b;b=b.nextSibling)if(1==b.nodeType&&(c=b,"http://www.w3.org/1999/xhtml"==c.namespaceURI))switch(c.localName){case "head":a=c}this.lang=this.root.getAttribute("lang")}else if("http://www.gribuser.ru/xml/fictionbook/2.0"==this.root.namespaceURI){a=this.root;for(b=this.root.firstChild;b;b=b.nextSibling);b=xh(xh(xh(xh(new zh([this.b]),
"FictionBook"),"description"),"title-info"),"lang").textContent();0<b.length&&(this.lang=b[0])}else if("http://example.com/sse"==this.root.namespaceURI)for(c=this.root.firstElementChild;c;c=c.nextElementSibling)"meta"===c.localName&&(a=c);this.h=a;this.e=this.root;this.g=1;this.e.setAttribute("data-adapt-eloff","0")}
function Ah(a,b){var c=b.getAttribute("data-adapt-eloff");if(c)return parseInt(c,10);for(var c=a.g,d=a.e;d!=b;){var e=d.firstChild;if(!e)for(;!(e=d.nextSibling);)if(d=d.parentNode,null==d)throw Error("Internal error");d=e;1==e.nodeType?(e.setAttribute("data-adapt-eloff",c.toString()),++c):c+=e.textContent.length}a.g=c;a.e=b;return c-1}
function Bh(a,b,c,d){var e=0,f=null;if(1==b.nodeType){if(!d)return Ah(a,b)}else{e=c;f=b.previousSibling;if(!f)return b=b.parentNode,e+=1,Ah(a,b)+e;b=f}for(;;){for(;b.lastChild;)b=b.lastChild;if(1==b.nodeType)break;e+=b.textContent.length;f=b.previousSibling;if(!f){b=b.parentNode;break}b=f}e+=1;return Ah(a,b)+e}function Ch(a){0>a.f&&(a.f=Bh(a,a.root,0,!0));return a.f}
function Dh(a,b){for(var c,d=a.root;;){c=Ah(a,d);if(c>=b)return d;var e=d.children;if(!e)break;var f=Ya(e.length,function(c){return Ah(a,e[c])>b});if(0==f)break;if(f<e.length&&Ah(a,e[f])<=b)throw Error("Consistency check failed!");d=e[f-1]}c=c+1;for(var f=d,g=f.firstChild||f.nextSibling,k=null;;){if(g){if(1==g.nodeType)break;k=f=g;c+=g.textContent.length;if(c>b)break}else if(f=f.parentNode,!f)break;g=f.nextSibling}return k||d}
function Eh(a,b){var c=b.getAttribute("id");c&&!a.d[c]&&(a.d[c]=b);(c=b.getAttributeNS("http://www.w3.org/XML/1998/namespace","id"))&&!a.d[c]&&(a.d[c]=b);for(c=b.firstElementChild;c;c=c.nextElementSibling)Eh(a,c)}function Fh(a,b){var c=b.match(/([^#]*)\#(.+)$/);if(!c||c[1]&&c[1]!=a.url)return null;var c=c[2],d=a.b.getElementById(c);!d&&a.b.getElementsByName&&(d=a.b.getElementsByName(c)[0]);d||(a.d||(a.d={},Eh(a,a.b.documentElement)),d=a.d[c]);return d}
var Gh={fe:"text/html",ge:"text/xml",Yd:"application/xml",Xd:"application/xhtml_xml",ce:"image/svg+xml"};function Hh(a,b,c){c=c||new DOMParser;var d;try{d=c.parseFromString(a,b)}catch(e){}if(d){a=d.documentElement;if("parsererror"===a.localName)return null;for(a=a.firstChild;a;a=a.nextSibling)if("parsererror"===a.localName)return null}else return null;return d}
function Ih(a){var b=a.contentType;if(b){for(var c=Object.keys(Gh),d=0;d<c.length;d++)if(Gh[c[d]]===b)return b;if(b.match(/\+xml$/))return"application/xml"}if(a=a.url.match(/\.([^./]+)$/))switch(a[1]){case "html":case "htm":return"text/html";case "xhtml":case "xht":return"application/xhtml_xml";case "svg":case "svgz":return"image/svg+xml";case "opf":case "xml":return"application/xml"}return null}
function Jh(a,b){var c=a.responseXML;if(!c){var d=new DOMParser,e=a.responseText;if(e){var f=Ih(a);(c=Hh(e,f||"application/xml",d))&&!f&&(f=c.documentElement,"html"!==f.localName.toLowerCase()||f.namespaceURI?"svg"===f.localName.toLowerCase()&&"image/svg+xml"!==c.contentType&&(c=Hh(e,"image/svg+xml",d)):c=Hh(e,"text/html",d));c||(c=Hh(e,"text/html",d))}}c=c?new wh(b,a.url,c):null;return M(c)}function Kh(a){this.Ab=a}
function Lh(){var a=Mh;return new Kh(function(b){return a.Ab(b)&&1==b.nodeType&&"http://www.idpf.org/2008/embedding"==b.getAttribute("Algorithm")})}function Nh(){var a=Lh(),b=Mh;return new Kh(function(c){if(!b.Ab(c))return!1;c=new zh([c]);c=xh(c,"EncryptionMethod");a&&(c=Oh(c,a));return 0<c.b.length})}var Mh=new Kh(function(){return!0});function zh(a){this.b=a}function Ph(a){return a.b}function Oh(a,b){for(var c=[],d=0;d<a.b.length;d++){var e=a.b[d];b.Ab(e)&&c.push(e)}return new zh(c)}
function Qh(a,b){function c(a){d.push(a)}for(var d=[],e=0;e<a.b.length;e++)b(a.b[e],c);return new zh(d)}zh.prototype.forEach=function(a){for(var b=[],c=0;c<this.b.length;c++)b.push(a(this.b[c]));return b};function Rh(a,b){for(var c=[],d=0;d<a.b.length;d++){var e=b(a.b[d]);null!=e&&c.push(e)}return c}function xh(a,b){return Qh(a,function(a,d){for(var e=a.firstChild;e;e=e.nextSibling)e.localName==b&&d(e)})}
function Sh(a){return Qh(a,function(a,c){for(var d=a.firstChild;d;d=d.nextSibling)1==d.nodeType&&c(d)})}function Th(a,b){return Rh(a,function(a){return 1==a.nodeType?a.getAttribute(b):null})}zh.prototype.textContent=function(){return this.forEach(function(a){return a.textContent})};var Uh={transform:!0,"transform-origin":!0},Vh={top:!0,bottom:!0,left:!0,right:!0};function Wh(a,b,c){this.target=a;this.name=b;this.value=c}var Xh={show:function(a){a.style.visibility="visible"},hide:function(a){a.style.visibility="hidden"},play:function(a){a.currentTime=0;a.play()},pause:function(a){a.pause()},resume:function(a){a.play()},mute:function(a){a.muted=!0},unmute:function(a){a.muted=!1}};
function Yh(a,b){var c=Xh[b];return c?function(){for(var b=0;b<a.length;b++)try{c(a[b])}catch(e){}}:null}
function Zh(a,b){this.e={};this.M=a;this.b=b;this.w=null;this.h=[];var c=this;this.C=function(a){var b=a.currentTarget,f=b.getAttribute("href")||b.getAttributeNS("http://www.w3.org/1999/xlink","href");f&&(a.preventDefault(),fb(c,{type:"hyperlink",target:null,currentTarget:null,ke:b,href:f}))};this.j={};this.d={width:0,height:0};this.l=this.k=!1;this.G=0;this.position=null;this.offset=-1;this.g=null;this.f=[];this.u={top:{},bottom:{},left:{},right:{}}}u(Zh,eb);
function $h(a){a.H=!0;a.M.setAttribute("data-vivliostyle-auto-page-width",!0)}function ai(a){a.F=!0;a.M.setAttribute("data-vivliostyle-auto-page-height",!0)}function bi(a,b,c){var d=a.j[c];d?d.push(b):a.j[c]=[b]}Zh.prototype.zoom=function(a){w(this.M,"transform","scale("+a+")")};Zh.prototype.B=function(){return this.w||this.M};
function ci(a,b){if(1==a.nodeType)return!1;var c=a.textContent;switch(b){case 0:return!!c.match(/^\s*$/);case 1:return!!c.match(/^[ \t\f]*$/);case 2:return 0==c.length}throw Error("Unexpected whitespace: "+b);}function di(a,b,c,d,e,f,g,k){this.f=a;this.g=b;this.b=c;this.Ea=d;this.j=e;this.d=f;this.Sd=g;this.h=k;this.e=-1}function ei(a,b){return a.d?!b.d||a.Ea>b.Ea?!0:a.h:!1}function fi(a,b){return a.top-b.top}function gi(a,b){return b.right-a.right}
function hi(a,b,c,d,e,f,g){this.aa=a;this.Sc=d;this.nd=null;this.root=b;this.ba=c;this.type=f;e&&(e.nd=this);this.b=g}function ii(a,b){this.Qd=a;this.count=b}function ji(a,b,c){this.Y=a;this.parent=b;this.ga=c;this.ca=0;this.L=!1;this.Na=0;this.da=b?b.da:null;this.qa=this.wa=null;this.H=!1;this.b=!0;this.e=!1;this.h=b?b.h:0;this.u=this.j=this.N=null;this.B=!1;this.w=b?b.w:0;this.k=b?b.k:!1;this.A=this.C=this.g=null;this.l=b?b.l:{};this.f=b?b.f:!1;this.F=b?b.F:"ltr";this.d=b?b.d:null}
function ki(a){a.b=!0;a.h=a.parent?a.parent.h:0;a.A=null;a.ca=0;a.L=!1;a.j=null;a.u=null;a.B=!1;a.g=null;a.C=null;a.wa=null;a.k=a.parent?a.parent.k:!1;a.f=a.parent?a.parent.f:!1;a.wa=null}function li(a){var b=new ji(a.Y,a.parent,a.ga);b.ca=a.ca;b.L=a.L;b.wa=a.wa;b.Na=a.Na;b.da=a.da;b.qa=a.qa;b.b=a.b;b.h=a.h;b.j=a.j;b.u=a.u;b.k=a.k;b.B=a.B;b.w=a.w;b.g=a.g;b.C=a.C;b.A=a.A;b.d=a.d;b.f=a.f;b.e=a.e;return b}ji.prototype.modify=function(){return this.H?li(this):this};
function mi(a){var b=a;do{if(b.H)break;b.H=!0;b=b.parent}while(b);return a}ji.prototype.clone=function(){for(var a=li(this),b=a,c;null!=(c=b.parent);)c=li(c),b=b.parent=c;return a};function ni(a){return{ha:a.Y,Na:a.Na,da:a.da,wa:a.wa,qa:a.qa?ni(a.qa):null}}function oi(a){var b=a,c=[];do b.d&&b.parent&&b.parent.d!==b.d||c.push(ni(b)),b=b.parent;while(b);return{ka:c,ca:a.ca,L:a.L}}function pi(a){this.Sa=a;this.b=this.d=null}
pi.prototype.clone=function(){var a=new pi(this.Sa);if(this.d){a.d=[];for(var b=0;b<this.d.length;++b)a.d[b]=this.d[b]}if(this.b)for(a.b=[],b=0;b<this.b.length;++b)a.b[b]=this.b[b];return a};function qi(a,b){this.d=a;this.b=b}qi.prototype.clone=function(){return new qi(this.d.clone(),this.b)};function ri(){this.b=[]}ri.prototype.clone=function(){for(var a=new ri,b=this.b,c=a.b,d=0;d<b.length;d++)c[d]=b[d].clone();return a};function si(){this.d=0;this.b={};this.e=0}
si.prototype.clone=function(){var a=new si;a.d=this.d;a.f=this.f;a.e=this.e;a.g=this.g;for(var b in this.b)a.b[b]=this.b[b].clone();return a};function ti(a){this.d=a;this.F=this.C=this.height=this.width=this.w=this.k=this.H=this.j=this.xa=this.fa=this.Ja=this.Z=this.marginBottom=this.marginTop=this.marginRight=this.marginLeft=this.top=this.left=0;this.$b=this.N=null;this.pa=this.ac=this.Ka=this.bc=this.e=0;this.b=!1}function ui(a){return a.marginTop+a.fa+a.k}
function vi(a){return a.marginBottom+a.xa+a.w}function wi(a){return a.marginLeft+a.Z+a.j}function xi(a){return a.marginRight+a.Ja+a.H}function yi(a,b){a.d=b.d;a.left=b.left;a.top=b.top;a.marginLeft=b.marginLeft;a.marginRight=b.marginRight;a.marginTop=b.marginTop;a.marginBottom=b.marginBottom;a.Z=b.Z;a.Ja=b.Ja;a.fa=b.fa;a.xa=b.xa;a.j=b.j;a.H=b.H;a.k=b.k;a.w=b.w;a.width=b.width;a.height=b.height;a.C=b.C;a.F=b.F;a.$b=b.$b;a.N=b.N;a.e=b.e;a.bc=b.bc;a.Ka=b.Ka;a.b=b.b}
function zi(a,b,c){a.top=b;a.height=c;w(a.d,"top",b+"px");w(a.d,"height",c+"px")}function Ai(a,b,c){a.left=b;a.width=c;w(a.d,"left",b+"px");w(a.d,"width",c+"px")}function Bi(a,b){this.b=a;this.d=b}u(Bi,hd);Bi.prototype.Xb=function(a){this.b.appendChild(this.b.ownerDocument.createTextNode(a.b));return null};Bi.prototype.Yb=function(a){var b=this.b.ownerDocument.createElementNS("http://www.w3.org/1999/xhtml","img");b.setAttribute("src",a.url);this.b.appendChild(b);return null};
Bi.prototype.Za=function(a){this.pb(a.values);return null};Bi.prototype.Fb=function(a){a=a.ia().evaluate(this.d);"string"===typeof a&&this.b.appendChild(this.b.ownerDocument.createTextNode(a));return null};function Ci(a){return null!=a&&a!==Yd&&a!==Xd&&a!==Pd};function Di(a,b,c){b=b?"vertical-rl":"horizontal-tb";if("top"===a||"bottom"===a)a=ca(a,b,c||null,ga);"block-start"===a&&(a="inline-start");"block-end"===a&&(a="inline-end");if("inline-start"===a||"inline-end"===a){c=ca(a,b,c||null,fa);a:{var d=ha[b];if(!d)throw Error("unknown writing-mode: "+b);for(b=0;b<d.length;b++)if(d[b].K===c){b=d[b].J;break a}b=c}"line-left"===b?a="left":"line-right"===b&&(a="right")}"left"!==a&&"right"!==a&&(v.b("Invalid float value: "+a+". Fallback to left."),a="left");return a}
function Ei(a,b){this.d=mi(a);this.b=b}function Fi(a,b,c){this.e=a;this.g=b;this.f=c;this.d=[];this.b=[]}
function Gi(a,b,c){b.parentNode&&b.parentNode.removeChild(b);w(b,"float","none");w(b,"position","absolute");var d=a.g.toString(),e=a.f.toString(),f=ca(c,d,e||null,fa),g=ca(c,d,e||null,ga);w(b,f,"0");switch(g){case "inline-start":case "inline-end":d=ca("block-start",d,e||null,fa);w(b,d,"0");break;case "block-start":case "block-end":c=ca("inline-start",d,e||null,fa);w(b,c,"0");d=ca("max-inline-size",d,e||null,fa);Pa(b,d)||w(b,d,"100%");break;default:throw Error("unknown float direction: "+c);}a.e().appendChild(b)}
function Hi(a,b,c){b=oi(b);for(var d=0;d<a.d.length;d++){var e=a.d[d];if(Ii(c,b,oi(e.d)))return e}return null}function Ji(a,b,c){var d=L("tryToAddFloat");b=new Ei(b,c);a.d.push(b);a.b.push(b);O(d,b);return N(d)}function Ki(a){return a.b.map(function(a){a=a.b;return new ze([new ue(a.X,a.V),new ue(a.U,a.V),new ue(a.U,a.P),new ue(a.X,a.P)])})};var Li={SIMPLE_PROPERTY:"SIMPLE_PROPERTY"},Mi={};function Ni(a,b){if(Li[a]){var c=Mi[a];c||(c=Mi[a]=[]);c.push(b)}else v.b(Error("Skipping unknown plugin hook '"+a+"'."))}ba("vivliostyle.plugin.registerHook",Ni);ba("vivliostyle.plugin.removeHook",function(a,b){if(Li[a]){var c=Mi[a];if(c){var d=c.indexOf(b);0<=d&&c.splice(d,1)}}else v.b(Error("Ignoring unknown plugin hook '"+a+"'."))});for(var Oi={azimuth:!0,"border-collapse":!0,"border-spacing":!0,"caption-side":!0,color:!0,cursor:!0,direction:!0,elevation:!0,"empty-cells":!0,"font-kerning":!0,"font-size":!0,"font-family":!0,"font-feature-settings":!0,"font-style":!0,"font-variant":!0,"font-weight":!0,"letter-spacing":!0,"line-break":!0,"line-height":!0,"list-style-image":!0,"list-style-position":!0,"list-style-type":!0,orphans:!0,"overflow-wrap":!0,"pitch-range":!0,quotes:!0,richness:!0,"ruby-align":!0,"ruby-position":!0,"speak-header":!0,
"speak-numeral":!0,"speak-punctuation":!0,"speech-rate":!0,stress:!0,"tab-size":!0,"text-align":!0,"text-align-last":!0,"text-decoration-skip":!0,"text-emphasis-color":!0,"text-emphasis-position":!0,"text-emphasis-style":!0,"text-combine-upright":!0,"text-indent":!0,"text-justify":!0,"text-size-adjust":!0,"text-transform":!0,"text-underline-position":!0,visibility:!0,"voice-family":!0,volume:!0,"white-space":!0,widows:!0,"word-break":!0,"word-spacing":!0,"word-wrap":!0,"writing-mode":!0},Pi={"http://www.idpf.org/2007/ops":!0,
"http://www.w3.org/1999/xhtml":!0,"http://www.w3.org/2000/svg":!0},Qi="margin-% padding-% border-%-width border-%-style border-%-color %".split(" "),Ri=["left","right","top","bottom"],Si={width:!0,height:!0},Ti=0;Ti<Qi.length;Ti++)for(var Ui=0;Ui<Ri.length;Ui++){var Vi=Qi[Ti].replace("%",Ri[Ui]);Si[Vi]=!0}function Wi(a){for(var b={},c=0;c<Qi.length;c++)for(var d in a){var e=Qi[c].replace("%",d),f=Qi[c].replace("%",a[d]);b[e]=f;b[f]=e}return b}
var Xi=Wi({before:"right",after:"left",start:"top",end:"bottom"}),Yi=Wi({before:"top",after:"bottom",start:"left",end:"right"});function T(a,b){this.value=a;this.Ea=b}n=T.prototype;n.ud=function(){return this};n.Gc=function(a){a=this.value.T(a);return a===this.value?this:new T(a,this.Ea)};n.vd=function(a){return 0==a?this:new T(this.value,this.Ea+a)};n.evaluate=function(a,b){return mg(a,this.value,b)};n.rd=function(){return!0};function Zi(a,b,c){T.call(this,a,b);this.I=c}u(Zi,T);
Zi.prototype.ud=function(){return new T(this.value,this.Ea)};Zi.prototype.Gc=function(a){a=this.value.T(a);return a===this.value?this:new Zi(a,this.Ea,this.I)};Zi.prototype.vd=function(a){return 0==a?this:new Zi(this.value,this.Ea+a,this.I)};Zi.prototype.rd=function(a){return!!this.I.evaluate(a)};function $i(a,b,c){return(null==b||c.Ea>b.Ea)&&c.rd(a)?c.ud():b}var aj={"region-id":!0};function bj(a){return"_"!=a.charAt(0)&&!aj[a]}function cj(a,b,c){c?a[b]=c:delete a[b]}
function dj(a,b){var c=a[b];c||(c={},a[b]=c);return c}function ej(a,b){var c=a[b];c||(c=[],a[b]=c);return c}function fj(a,b,c,d,e,f){if(e){var g=dj(b,"_pseudos");b=g[e];b||(b={},g[e]=b)}f&&(e=dj(b,"_regions"),b=e[f],b||(b={},e[f]=b));for(var k in c)"_"!=k.charAt(0)&&(aj[k]?(f=c[k],e=ej(b,k),Array.prototype.push.apply(e,f)):cj(b,k,$i(a,b[k],c[k].vd(d))))}function gj(a,b){this.e=a;this.d=b;this.b=""}u(gj,id);
function hj(a){a=a.e["font-size"].value;var b;a:switch(a.ea.toLowerCase()){case "px":case "in":case "pt":case "pc":case "cm":case "mm":case "q":b=!0;break a;default:b=!1}if(!b)throw Error("Unexpected state");return a.D*sc[a.ea]}
gj.prototype.Ib=function(a){if("em"==a.ea||"ex"==a.ea){var b=wc(this.d,a.ea,!1)/wc(this.d,"em",!1);return new I(a.D*b*hj(this),"px")}if("%"==a.ea){if("font-size"===this.b)return new I(a.D/100*hj(this),"px");b=this.b.match(/height|^(top|bottom)$/)?"vh":"vw";return new I(a.D,b)}return a};gj.prototype.Fb=function(a){return"font-size"==this.b?mg(this.d,a,this.b).T(this):a};function ij(){}ij.prototype.apply=function(){};ij.prototype.g=function(a){return new jj([this,a])};ij.prototype.clone=function(){return this};
function kj(a){this.b=a}u(kj,ij);kj.prototype.apply=function(a){a.b[a.b.length-1].push(this.b.b())};function jj(a){this.b=a}u(jj,ij);jj.prototype.apply=function(a){for(var b=0;b<this.b.length;b++)this.b[b].apply(a)};jj.prototype.g=function(a){this.b.push(a);return this};jj.prototype.clone=function(){return new jj([].concat(this.b))};function lj(a,b,c,d){this.style=a;this.S=b;this.b=c;this.d=d}u(lj,ij);lj.prototype.apply=function(a){fj(a.d,a.w,this.style,this.S,this.b,this.d)};
function U(){this.b=null}u(U,ij);U.prototype.apply=function(a){this.b.apply(a)};U.prototype.d=function(){return 0};U.prototype.e=function(){return!1};function mj(a){this.b=null;this.f=a}u(mj,U);mj.prototype.apply=function(a){0<=a.u.indexOf(this.f)&&this.b.apply(a)};mj.prototype.d=function(){return 10};mj.prototype.e=function(a){this.b&&nj(a.za,this.f,this.b);return!0};function oj(a){this.b=null;this.id=a}u(oj,U);oj.prototype.apply=function(a){a.N!=this.id&&a.oa!=this.id||this.b.apply(a)};
oj.prototype.d=function(){return 11};oj.prototype.e=function(a){this.b&&nj(a.e,this.id,this.b);return!0};function pj(a){this.b=null;this.localName=a}u(pj,U);pj.prototype.apply=function(a){a.f==this.localName&&this.b.apply(a)};pj.prototype.d=function(){return 8};pj.prototype.e=function(a){this.b&&nj(a.Wb,this.localName,this.b);return!0};function qj(a,b){this.b=null;this.f=a;this.localName=b}u(qj,U);qj.prototype.apply=function(a){a.f==this.localName&&a.k==this.f&&this.b.apply(a)};qj.prototype.d=function(){return 8};
qj.prototype.e=function(a){if(this.b){var b=a.b[this.f];b||(b="ns"+a.g++ +":",a.b[this.f]=b);nj(a.f,b+this.localName,this.b)}return!0};function rj(a){this.b=null;this.f=a}u(rj,U);rj.prototype.apply=function(a){var b=a.e;if(b&&"a"==a.f){var c=b.getAttribute("href");c&&c.match(/^#/)&&(b=b.ownerDocument.getElementById(c.substring(1)))&&(b=b.getAttributeNS("http://www.idpf.org/2007/ops","type"))&&b.match(this.f)&&this.b.apply(a)}};function sj(a){this.b=null;this.f=a}u(sj,U);
sj.prototype.apply=function(a){a.k==this.f&&this.b.apply(a)};function tj(a,b){this.b=null;this.f=a;this.name=b}u(tj,U);tj.prototype.apply=function(a){a.e&&a.e.hasAttributeNS(this.f,this.name)&&this.b.apply(a)};function uj(a,b,c){this.b=null;this.f=a;this.name=b;this.value=c}u(uj,U);uj.prototype.apply=function(a){a.e&&a.e.getAttributeNS(this.f,this.name)==this.value&&this.b.apply(a)};uj.prototype.d=function(){return"type"==this.name&&"http://www.idpf.org/2007/ops"==this.f?9:0};
uj.prototype.e=function(a){return"type"==this.name&&"http://www.idpf.org/2007/ops"==this.f?(this.b&&nj(a.d,this.value,this.b),!0):!1};function vj(a,b){this.b=null;this.f=a;this.name=b}u(vj,U);vj.prototype.apply=function(a){if(a.e){var b=a.e.getAttributeNS(this.f,this.name);b&&Pi[b]&&this.b.apply(a)}};vj.prototype.d=function(){return 0};vj.prototype.e=function(){return!1};function wj(a,b,c){this.b=null;this.h=a;this.name=b;this.f=c}u(wj,U);
wj.prototype.apply=function(a){if(a.e){var b=a.e.getAttributeNS(this.h,this.name);b&&b.match(this.f)&&this.b.apply(a)}};function xj(a){this.b=null;this.f=a}u(xj,U);xj.prototype.apply=function(a){a.lang.match(this.f)&&this.b.apply(a)};function yj(){this.b=null}u(yj,U);yj.prototype.apply=function(a){a.pa&&this.b.apply(a)};yj.prototype.d=function(){return 6};function zj(){this.b=null}u(zj,U);zj.prototype.apply=function(a){a.Ja&&this.b.apply(a)};zj.prototype.d=function(){return 12};
function Aj(a){this.b=null;this.f=a}u(Aj,U);Aj.prototype.apply=function(a){a.fa===this.f&&this.b.apply(a)};Aj.prototype.d=function(){return 5};function Bj(a){this.b=null;this.I=a}u(Bj,U);Bj.prototype.apply=function(a){var b=a.fa;"even"===this.I?0===b%2&&this.b.apply(a):"odd"===this.I&&1===b%2&&this.b.apply(a)};Bj.prototype.d=function(){return 5};function Cj(a){this.b=null;this.I=a}u(Cj,U);Cj.prototype.apply=function(a){a.h[this.I]&&this.b.apply(a)};Cj.prototype.d=function(){return 5};
function Dj(a){this.I=a}Dj.prototype.b=function(){return this};Dj.prototype.push=function(a,b){0==b&&Ej(a,this.I);return!1};Dj.prototype.pop=function(a,b){return 0==b?(a.h[this.I]--,!0):!1};function Fj(a){this.I=a}Fj.prototype.b=function(){return this};Fj.prototype.push=function(a,b){0==b?Ej(a,this.I):1==b&&a.h[this.I]--;return!1};Fj.prototype.pop=function(a,b){if(0==b)return a.h[this.I]--,!0;1==b&&Ej(a,this.I);return!1};function Gj(a){this.I=a;this.d=!1}Gj.prototype.b=function(){return new Gj(this.I)};
Gj.prototype.push=function(a){return this.d?(a.h[this.I]--,!0):!1};Gj.prototype.pop=function(a,b){if(this.d)return a.h[this.I]--,!0;0==b&&(this.d=!0,Ej(a,this.I));return!1};function Hj(a){this.I=a;this.d=!1}Hj.prototype.b=function(){return new Hj(this.I)};Hj.prototype.push=function(a,b){this.d&&(-1==b?Ej(a,this.I):0==b&&a.h[this.I]--);return!1};Hj.prototype.pop=function(a,b){if(this.d){if(-1==b)return a.h[this.I]--,!0;0==b&&Ej(a,this.I)}else 0==b&&(this.d=!0,Ej(a,this.I));return!1};
function Ij(a,b){this.e=a;this.d=b}Ij.prototype.b=function(){return this};Ij.prototype.push=function(){return!1};Ij.prototype.pop=function(a,b){return 0==b?(Jj(a,this.e,this.d),!0):!1};function Kj(a){this.lang=a}Kj.prototype.b=function(){return this};Kj.prototype.push=function(){return!1};Kj.prototype.pop=function(a,b){return 0==b?(a.lang=this.lang,!0):!1};function Lj(a){this.d=a}Lj.prototype.b=function(){return this};Lj.prototype.push=function(){return!1};
Lj.prototype.pop=function(a,b){return 0==b?(a.C=this.d,!0):!1};function Mj(a,b){this.b=a;this.d=b}u(Mj,id);Mj.prototype.ob=function(a){var b=this.b,c=b.C,d=Math.floor(c.length/2)-1;switch(a.name){case "open-quote":a=c[2*Math.min(d,b.l)];b.l++;break;case "close-quote":return 0<b.l&&b.l--,c[2*Math.min(d,b.l)+1];case "no-open-quote":return b.l++,new qd("");case "no-close-quote":return 0<b.l&&b.l--,new qd("")}return a};
var Nj={roman:[4999,1E3,"M",900,"CM",500,"D",400,"CD",100,"C",90,"XC",50,"L",40,"XL",10,"X",9,"IX",5,"V",4,"IV",1,"I"],armenian:[9999,9E3,"\u0584",8E3,"\u0583",7E3,"\u0582",6E3,"\u0581",5E3,"\u0580",4E3,"\u057f",3E3,"\u057e",2E3,"\u057d",1E3,"\u057c",900,"\u057b",800,"\u057a",700,"\u0579",600,"\u0578",500,"\u0577",400,"\u0576",300,"\u0575",200,"\u0574",100,"\u0573",90,"\u0572",80,"\u0571",70,"\u0570",60,"\u056f",50,"\u056e",40,"\u056d",30,"\u056c",20,"\u056b",10,"\u056a",9,"\u0569",8,"\u0568",7,"\u0567",
6,"\u0566",5,"\u0565",4,"\u0564",3,"\u0563",2,"\u0562",1,"\u0561"],georgian:[19999,1E4,"\u10f5",9E3,"\u10f0",8E3,"\u10ef",7E3,"\u10f4",6E3,"\u10ee",5E3,"\u10ed",4E3,"\u10ec",3E3,"\u10eb",2E3,"\u10ea",1E3,"\u10e9",900,"\u10e8",800,"\u10e7",700,"\u10e6",600,"\u10e5",500,"\u10e4",400,"\u10f3",300,"\u10e2",200,"\u10e1",100,"\u10e0",90,"\u10df",80,"\u10de",70,"\u10dd",60,"\u10f2",50,"\u10dc",40,"\u10db",30,"\u10da",20,"\u10d9",10,"\u10d8",9,"\u10d7",8,"\u10f1",7,"\u10d6",6,"\u10d5",5,"\u10d4",4,"\u10d3",
3,"\u10d2",2,"\u10d1",1,"\u10d0"],hebrew:[999,400,"\u05ea",300,"\u05e9",200,"\u05e8",100,"\u05e7",90,"\u05e6",80,"\u05e4",70,"\u05e2",60,"\u05e1",50,"\u05e0",40,"\u05de",30,"\u05dc",20,"\u05db",19,"\u05d9\u05d8",18,"\u05d9\u05d7",17,"\u05d9\u05d6",16,"\u05d8\u05d6",15,"\u05d8\u05d5",10,"\u05d9",9,"\u05d8",8,"\u05d7",7,"\u05d6",6,"\u05d5",5,"\u05d4",4,"\u05d3",3,"\u05d2",2,"\u05d1",1,"\u05d0"]},Oj={latin:"a-z",alpha:"a-z",greek:"\u03b1-\u03c1\u03c3-\u03c9",russian:"\u0430-\u0438\u043a-\u0449\u044d-\u044f"},
Pj={square:"\u25a0",disc:"\u2022",circle:"\u25e6",none:""},Qj={me:!1,Jb:"\u96f6\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d",ic:"\u5341\u767e\u5343",Nd:"\u8ca0"};
function Rj(a){if(9999<a||-9999>a)return""+a;if(0==a)return Qj.Jb.charAt(0);var b=new Qa;0>a&&(b.append(Qj.Nd),a=-a);if(10>a)b.append(Qj.Jb.charAt(a));else if(Qj.ne&&19>=a)b.append(Qj.ic.charAt(0)),0!=a&&b.append(Qj.ic.charAt(a-10));else{var c=Math.floor(a/1E3);c&&(b.append(Qj.Jb.charAt(c)),b.append(Qj.ic.charAt(2)));if(c=Math.floor(a/100)%10)b.append(Qj.Jb.charAt(c)),b.append(Qj.ic.charAt(1));if(c=Math.floor(a/10)%10)b.append(Qj.Jb.charAt(c)),b.append(Qj.ic.charAt(0));(a%=10)&&b.append(Qj.Jb.charAt(a))}return b.toString()}
function Sj(a,b){var c=!1,d=!1,e;null!=(e=b.match(/^upper-(.*)/))?(c=!0,b=e[1]):null!=(e=b.match(/^lower-(.*)/))&&(d=!0,b=e[1]);e="";if(Nj[b])a:{e=Nj[b];var f=a;if(f>e[0]||0>=f||f!=Math.round(f))e="";else{for(var g="",k=1;k<e.length;k+=2){var h=e[k],l=Math.floor(f/h);if(20<l){e="";break a}for(f-=l*h;0<l;)g+=e[k+1],l--}e=g}}else if(Oj[b])if(e=a,0>=e||e!=Math.round(e))e="";else{g=Oj[b];f=[];for(k=0;k<g.length;)if("-"==g.substr(k+1,1))for(l=g.charCodeAt(k),h=g.charCodeAt(k+2),k+=3;l<=h;l++)f.push(String.fromCharCode(l));
else f.push(g.substr(k++,1));g="";do e--,k=e%f.length,g=f[k]+g,e=(e-k)/f.length;while(0<e);e=g}else null!=Pj[b]?e=Pj[b]:"decimal-leading-zero"==b?(e=a+"",1==e.length&&(e="0"+e)):"cjk-ideographic"==b||"trad-chinese-informal"==b?e=Rj(a):e=a+"";return c?e.toUpperCase():d?e.toLowerCase():e}
function Tj(a,b){var c=b[0].toString(),d=1<b.length?b[1].stringValue():"decimal",e=a.b.g[c];if(e&&e.length)return new qd(Sj(e&&e.length&&e[e.length-1]||0,d));c=new K(Uj(a.b.Ka,c,function(a){return Sj(a||0,d)}));return new jd([c])}
function Vj(a,b){var c=b[0].toString(),d=b[1].stringValue(),e=2<b.length?b[2].stringValue():"decimal",f=a.b.g[c],g=new Qa;if(f&&f.length)for(var k=0;k<f.length;k++)0<k&&g.append(d),g.append(Sj(f[k],e));c=new K(Wj(a.b.Ka,c,function(a){var b=[];if(a.length)for(var c=0;c<a.length;c++)b.push(Sj(a[c],e));a=g.toString();a.length&&b.push(a);return b.length?b.join(d):Sj(0,e)}));return new jd([c])}
Mj.prototype.ub=function(a){switch(a.name){case "attr":if(1==a.values.length)return new qd(this.d&&this.d.getAttribute(a.values[0].stringValue())||"");break;case "counter":if(2>=a.values.length)return Tj(this,a.values);break;case "counters":if(3>=a.values.length)return Vj(this,a.values)}v.b("E_CSS_CONTENT_PROP:",a.toString());return new qd("")};var Xj=1/1048576;function Yj(a,b){for(var c in a)b[c]=a[c].clone()}
function Zj(){this.g=0;this.b={};this.Wb={};this.f={};this.d={};this.za={};this.e={};this.Pb={};this.O=0}Zj.prototype.clone=function(){var a=new Zj;a.g=this.g;for(var b in this.b)a.b[b]=this.b[b];Yj(this.Wb,a.Wb);Yj(this.f,a.f);Yj(this.d,a.d);Yj(this.za,a.za);Yj(this.e,a.e);Yj(this.Pb,a.Pb);a.O=this.O;return a};function nj(a,b,c){var d=a[b];d&&(c=d.g(c));a[b]=c}
function ak(a,b,c){this.j=a;this.d=b;this.Ka=c;this.b=[[],[]];this.h={};this.u=this.w=this.e=null;this.Z=this.oa=this.N=this.k=this.f="";this.H=this.F=null;this.Ja=this.pa=!0;this.g={};this.B=[{}];this.C=[new qd("\u201c"),new qd("\u201d"),new qd("\u2018"),new qd("\u2019")];this.l=0;this.lang="";this.La=[0];this.fa=0;this.xa=[]}function Ej(a,b){a.h[b]=(a.h[b]||0)+1}function bk(a,b,c){(b=b[c])&&b.apply(a)}var ck=[];
function dk(a,b,c,d){a.e=null;a.w=d;a.k="";a.f="";a.N="";a.oa="";a.u=b;a.Z="";a.F=ck;a.H=c;ek(a)}function fk(a,b,c){a.g[b]?a.g[b].push(c):a.g[b]=[c];c=a.B[a.B.length-1];c||(c={},a.B[a.B.length-1]=c);c[b]=!0}
function gk(a,b){var c=Qd,d=b.display;d&&(c=d.evaluate(a.d));var e=null,d=null,f=b["counter-reset"];f&&(f=f.evaluate(a.d))&&(e=tg(f,!0));(f=b["counter-increment"])&&(f=f.evaluate(a.d))&&(d=tg(f,!1));"ol"!=a.f&&"ul"!=a.f||"http://www.w3.org/1999/xhtml"!=a.k||(e||(e={}),e["ua-list-item"]=0);c===Vd&&(d||(d={}),d["ua-list-item"]=1);if(e)for(var g in e)fk(a,g,e[g]);if(d)for(var k in d)a.g[k]||fk(a,k,0),g=a.g[k],g[g.length-1]+=d[k];c===Vd&&(c=a.g["ua-list-item"],b["ua-list-item-count"]=new T(new sd(c[c.length-
1]),0));a.B.push(null)}function hk(a){var b=a.B.pop();if(b)for(var c in b)(b=a.g[c])&&(1==b.length?delete a.g[c]:b.pop())}function Jj(a,b,c){gk(a,b);b.content&&(b.content=b.content.Gc(new Mj(a,c)));hk(a)}var ik="before transclusion-before footnote-call footnote-marker inner first-letter first-line  transclusion-after after".split(" ");
function jk(a,b,c){a.xa.push(b);a.H=null;a.e=b;a.w=c;a.k=b.namespaceURI;a.f=b.localName;var d=a.j.b[a.k];a.Z=d?d+a.f:"";a.N=b.getAttribute("id");a.oa=b.getAttributeNS("http://www.w3.org/XML/1998/namespace","id");(d=b.getAttribute("class"))?a.u=d.split(/\s+/):a.u=ck;(d=b.getAttributeNS("http://www.idpf.org/2007/ops","type"))?a.F=d.split(/\s+/):a.F=ck;"style"==a.f&&"http://www.gribuser.ru/xml/fictionbook/2.0"==a.k&&(a.u=[b.getAttribute("name")||""]);(d=b.getAttributeNS("http://www.w3.org/XML/1998/namespace",
"lang"))||"http://www.w3.org/1999/xhtml"!=a.k||(d=b.getAttribute("lang"));d&&(a.b[a.b.length-1].push(new Kj(a.lang)),a.lang=d.toLowerCase());d=a.La;a.fa=++d[d.length-1];d.push([0]);ek(a);d=c.quotes;c=null;d&&(d=d.evaluate(a.d))&&(c=new Lj(a.C),d===Xd?a.C=[new qd(""),new qd("")]:d instanceof jd&&(a.C=d.values));gk(a,a.w);if(d=a.w._pseudos)for(var e=!0,f=0;f<ik.length;f++){var g=ik[f];g||(e=!1);(g=d[g])&&(e?Jj(a,g,b):a.b[a.b.length-2].push(new Ij(g,b)))}c&&a.b[a.b.length-2].push(c)}
function ek(a){var b;for(b=0;b<a.u.length;b++)bk(a,a.j.za,a.u[b]);for(b=0;b<a.F.length;b++)bk(a,a.j.d,a.F[b]);bk(a,a.j.e,a.N);bk(a,a.j.Wb,a.f);""!=a.f&&bk(a,a.j.Wb,"*");bk(a,a.j.f,a.Z);null!==a.H&&(bk(a,a.j.Pb,a.H),bk(a,a.j.Pb,"*"));a.e=null;a.b.push([]);for(var c=1;-1<=c;--c){var d=a.b[a.b.length-c-2];for(b=0;b<d.length;)d[b].push(a,c)?d.splice(b,1):b++}a.pa=!0;a.Ja=!1}
ak.prototype.pop=function(){for(var a=1;-1<=a;--a)for(var b=this.b[this.b.length-a-2],c=0;c<b.length;)b[c].pop(this,a)?b.splice(c,1):c++;this.b.pop();this.pa=!1};var kk=null;function lk(a,b,c,d,e,f,g){Jf.call(this,a,b,g);this.b=null;this.S=0;this.f=this.h=null;this.k=!1;this.I=c;this.g=d?d.g:kk?kk.clone():new Zj;this.B=e;this.l=f;this.j=0}u(lk,Kf);n=lk.prototype;n.wd=function(a){nj(this.g.Wb,"*",a)};
function mk(a,b){var c=a.b;if(0<c.length){c.sort(function(a,b){return b.d()-a.d()});for(var d=null,e=c.length-1;0<=e;e--)d=c[e],d.b=b,b=d;if(d.e(a.g))return}a.wd(b)}n.bb=function(a,b){if(b||a)this.S+=1,b&&a?this.b.push(new qj(a,b.toLowerCase())):b?this.b.push(new pj(b.toLowerCase())):this.b.push(new sj(a))};n.Dc=function(a){this.f?(v.b("::"+this.f,"followed by ."+a),this.b.push(new Cj(""))):(this.S+=256,this.b.push(new mj(a)))};
n.Qb=function(a,b){if(this.f)v.b("::"+this.f,"followed by :"+a),this.b.push(new Cj(""));else{switch(a.toLowerCase()){case "first-child":this.b.push(new yj);break;case "root":this.b.push(new zj);break;case "link":this.b.push(new pj("a"));this.b.push(new tj("","href"));break;case "-adapt-href-epub-type":case "href-epub-type":if(b&&1==b.length&&"string"==typeof b[0]){var c=new RegExp("(^|s)"+wa(b[0])+"($|s)");this.b.push(new rj(c))}else this.b.push(new Cj(""));break;case "-adapt-footnote-content":case "footnote-content":this.k=
!0;break;case "visited":case "active":case "hover":case "focus":this.b.push(new Cj(""));break;case "lang":b&&1==b.length&&"string"==typeof b[0]?this.b.push(new xj(new RegExp("^"+wa(b[0].toLowerCase())+"($|-)"))):this.b.push(new Cj(""));break;case "nth-child":b&&1==b.length?"number"==typeof b[0]?this.b.push(new Aj(b[0])):"even"!==b[0]&&"odd"!==b[0]||this.b.push(new Bj(b[0])):this.b.push(new Cj(""));break;case "before":case "after":case "first-line":case "first-letter":this.Rb(a,b);return;default:v.b("unknown pseudo-class selector: "+
a),this.b.push(new Cj(""))}this.S+=256}};
n.Rb=function(a,b){switch(a){case "before":case "after":case "first-line":case "first-letter":case "footnote-call":case "footnote-marker":case "inner":this.f?(v.b("Double pseudoelement ::"+this.f+"::"+a),this.b.push(new Cj(""))):this.f=a;break;case "first-n-lines":if(b&&1==b.length&&"number"==typeof b[0]){var c=Math.round(b[0]);if(0<c&&c==b[0]){this.f?(v.b("Double pseudoelement ::"+this.f+"::"+a),this.b.push(new Cj(""))):this.f="first-"+c+"-lines";break}}default:v.b("Unrecognized pseudoelement: ::"+a),
this.b.push(new Cj(""))}this.S+=1};n.Kc=function(a){this.S+=65536;this.b.push(new oj(a))};
n.ec=function(a,b,c,d){this.S+=256;b=b.toLowerCase();d=d||"";switch(c){case 0:this.b.push(new tj(a,b));break;case 39:this.b.push(new uj(a,b,d));break;case 45:this.b.push(new wj(a,b,new RegExp("(^|\\s)"+wa(d)+"($|\\s)")));break;case 44:this.b.push(new wj(a,b,new RegExp("^"+wa(d)+"($|-)")));break;case 50:"supported"==d?this.b.push(new vj(a,b)):v.b("Unsupported :: attr selector op:",d);break;default:v.b("Unsupported attr selector:",c)}};var nk=0;n=lk.prototype;
n.fb=function(){var a="d"+nk++;mk(this,new kj(new Dj(a)));this.b=[new Cj(a)]};n.Cc=function(){var a="c"+nk++;mk(this,new kj(new Fj(a)));this.b=[new Cj(a)]};n.Ac=function(){var a="a"+nk++;mk(this,new kj(new Gj(a)));this.b=[new Cj(a)]};n.Hc=function(){var a="f"+nk++;mk(this,new kj(new Hj(a)));this.b=[new Cj(a)]};n.Ob=function(){ok(this);this.f=null;this.k=!1;this.S=0;this.b=[]};
n.mb=function(){var a;0!=this.j?(Mf(this,"E_CSS_UNEXPECTED_SELECTOR"),a=!0):a=!1;a||(this.j=1,this.h={},this.f=null,this.S=0,this.k=!1,this.b=[])};n.error=function(a,b){Kf.prototype.error.call(this,a,b);1==this.j&&(this.j=0)};n.Eb=function(a){Kf.prototype.Eb.call(this,a);this.j=0};n.na=function(){ok(this);Kf.prototype.na.call(this);1==this.j&&(this.j=0)};n.gb=function(){Kf.prototype.gb.call(this)};function ok(a){if(a.b){var b=a.S,c;c=a.g;c=c.O+=Xj;mk(a,a.yd(b+c));a.b=null;a.f=null;a.k=!1;a.S=0}}
n.yd=function(a){var b=this.B;this.k&&(b=b?"xxx-bogus-xxx":"footnote");return new lj(this.h,a,this.f,b)};n.Xa=function(a,b,c){hh(this.l,a,b,c,this)};n.Mb=function(a,b){Lf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};n.uc=function(a,b){Lf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};
n.Ya=function(a,b,c){"display"!=a||b!==$d&&b!==Zd||(this.Ya("flow-options",new jd([Jd,ee]),c),this.Ya("flow-into",b,c),b=Cd);(Mi.SIMPLE_PROPERTY||[]).forEach(function(d){d=d({name:a,value:b,important:c});a=d.name;b=d.value;c=d.important});var d=c?Ff(this):Gf(this);cj(this.h,a,this.I?new Zi(b,d,this.I):new T(b,d))};function pk(a,b){Jf.call(this,a,b,!1)}u(pk,Kf);
pk.prototype.Xa=function(a,b){if(this.d.values[a])this.error("E_CSS_NAME_REDEFINED "+a,this.Lb());else{var c=a.match(/height|^(top|bottom)$/)?"vh":"vw",c=new Xc(this.d,100,c),c=b.ia(this.d,c);this.d.values[a]=c}};function qk(a,b,c,d,e){Jf.call(this,a,b,!1);this.b=d;this.I=c;this.e=e}u(qk,Kf);qk.prototype.Xa=function(a,b,c){c?v.b("E_IMPORTANT_NOT_ALLOWED"):hh(this.e,a,b,c,this)};qk.prototype.Mb=function(a,b){v.b("E_INVALID_PROPERTY_VALUE",a+":",b.toString())};
qk.prototype.uc=function(a,b){v.b("E_INVALID_PROPERTY",a+":",b.toString())};qk.prototype.Ya=function(a,b,c){c=c?Ff(this):Gf(this);c+=this.O;this.O+=Xj;cj(this.b,a,this.I?new Zi(b,c,this.I):new T(b,c))};function rk(a,b){fg.call(this,a);this.b={};this.e=b;this.O=0}u(rk,fg);rk.prototype.Xa=function(a,b,c){hh(this.e,a,b,c,this)};rk.prototype.Mb=function(a,b){v.b("E_INVALID_PROPERTY_VALUE",a+":",b.toString())};rk.prototype.uc=function(a,b){v.b("E_INVALID_PROPERTY",a+":",b.toString())};
rk.prototype.Ya=function(a,b,c){c=(c?67108864:50331648)+this.O;this.O+=Xj;cj(this.b,a,new T(b,c))};var sk=new Bf(function(){var a=L("uaStylesheetBase");zf(ih).then(function(b){var c=ua("user-agent-base.css",ta);b=new lk(null,null,null,null,null,b,!0);b.Eb("UA");kk=b.g;ig(c,b,null,null).ra(a)});return N(a)},"uaStylesheetBaseFetcher");function tk(a,b,c){return(a=a["writing-mode"])&&(b=a.evaluate(b,"writing-mode"))&&b!==Pd?b===ke:c}
function uk(a,b,c,d){var e={},f;for(f in a)bj(f)&&(e[f]=a[f]);a=a._regions;if((c||d)&&a)for(d&&(d=["footnote"],c=c?c.concat(d):d),d=0;d<c.length;d++){f=a[c[d]];for(var g in f)bj(g)&&(e[g]=$i(b,e[g],f[g]))}return e}function vk(a,b,c,d){c=c?Xi:Yi;for(var e in a)if(a.hasOwnProperty(e)){var f=a[e];if(f){var g=c[e];if(g){var k=a[g];if(k&&k.Ea>f.Ea)continue;g=Si[g]?g:e}else g=e;b[g]=d(e,f)}}};function wk(a,b,c){this.e=a;this.d=b;this.b=c}function xk(){this.map=[]}function yk(a){return 0==a.map.length?0:a.map[a.map.length-1].b}function zk(a,b){if(0==a.map.length)a.map.push(new wk(b,b,b));else{var c=a.map[a.map.length-1],d=c.b+b-c.d;c.d==c.e?(c.d=b,c.e=b,c.b=d):a.map.push(new wk(b,b,d))}}function Ak(a,b){0==a.map.length?a.map.push(new wk(b,0,0)):a.map[a.map.length-1].d=b}function Bk(a,b){var c=Ya(a.map.length,function(c){return b<=a.map[c].d}),c=a.map[c];return c.b-Math.max(0,c.e-b)}
function Ck(a,b){var c=Ya(a.map.length,function(c){return b<=a.map[c].b}),c=a.map[c];return c.e-(c.b-b)}
function Dk(a,b,c,d,e,f,g){this.ba=a;this.root=a.root;this.fa=c;this.f=d;this.h=f;this.d=this.root;this.u={};this.w={};this.C=[];this.l=this.k=null;this.B=new ak(b,d,g);this.e=new xk;this.Sa=!0;this.F=[];this.Z=e;this.N=this.H=!1;this.b=a=Ah(a,this.root);zk(this.e,a);b=Ek(this,this.root);jk(this.B,this.root,b);Fk(this,b,!1);this.j=!0;switch(this.root.namespaceURI){case "http://www.w3.org/1999/xhtml":case "http://www.gribuser.ru/xml/fictionbook/2.0":this.j=!1}this.F.push(!0);this.w={};this.w["e"+a]=
b;this.b++;Gk(this,-1)}function Hk(a,b,c,d){return(b=b[d])&&b.evaluate(a.f)!==c[d]}function Ik(a,b,c){for(var d in c){var e=b[d];e?(a.u[d]=e,delete b[d]):(e=c[d])&&(a.u[d]=new T(e,33554432))}}var Jk=["column-count","column-width"];
function Fk(a,b,c){c||["writing-mode","direction"].forEach(function(a){b[a]&&(this.u[a]=b[a])},a);if(!a.H){c=Hk(a,b,a.h.g,"background-color")?b["background-color"].evaluate(a.f):null;var d=Hk(a,b,a.h.g,"background-image")?b["background-image"].evaluate(a.f):null;if(c&&c!==Pd||d&&d!==Pd)Ik(a,b,a.h.g),a.H=!0}if(!a.N)for(c=0;c<Jk.length;c++)if(Hk(a,b,a.h.j,Jk[c])){Ik(a,b,a.h.j);a.N=!0;break}if(c=b["font-size"]){d=c.evaluate(a.f);c=d.D;switch(d.ea){case "em":case "rem":c*=a.f.h;break;case "ex":case "rex":c*=
a.f.h*sc.ex/sc.em;break;case "%":c*=a.f.h/100;break;default:(d=sc[d.ea])&&(c*=d)}a.f.Z=c}}function Kk(a){for(var b=0;!a.j&&(b+=5E3,Lk(a,b,0)!=Number.POSITIVE_INFINITY););return a.u}function Ek(a,b){if(b.style instanceof CSSStyleDeclaration){var c=b.getAttribute("style");if(c){var d=a.ba.url,e=new rk(a.fa,a.h),c=new bc(c,e);try{eg(new Xf(Of,c,e,d),Number.POSITIVE_INFINITY,!1,!0,!1)}catch(f){v.b(f,"Style attribute parse error:")}return e.b}}return{}}
function Gk(a,b){if(!(b>=a.b)){var c=a.f,d=Ah(a.ba,a.root);if(b<d){var e=a.g(a.root,!1),f=e["flow-into"],f=f?f.evaluate(c,"flow-into").toString():"body";Mk(a,f,e,a.root,d)}d=Dh(a.ba,b);e=Bh(a.ba,d,0,!1);if(!(e>=a.b))for(;;){if(1!=d.nodeType)e+=d.textContent.length;else{var g=d;if(e!=Ah(a.ba,g))throw Error("Inconsistent offset");var k=a.g(g,!1);if(f=k["flow-into"])f=f.evaluate(c,"flow-into").toString(),Mk(a,f,k,g,e);e++}if(e>=a.b)break;f=d.firstChild;if(null==f)for(;!(f=d.nextSibling);)if(d=d.parentNode,
d===a.root)return;d=f}}}function Nk(a,b){a.k=b;for(var c=0;c<a.C.length;c++)Pk(a.k,a.C[c])}
function Mk(a,b,c,d,e){var f=0,g=Number.POSITIVE_INFINITY,k=!1,h=!1,l=!1,m=c["flow-options"];if(m){var p;a:{if(k=m.evaluate(a.f,"flow-options")){h=new ng;try{k.T(h);p=h.b;break a}catch(q){v.b(q,"toSet:")}}p={}}k=!!p.exclusive;h=!!p["static"];l=!!p.last}(p=c["flow-linger"])&&(g=pg(p.evaluate(a.f,"flow-linger"),Number.POSITIVE_INFINITY));(c=c["flow-priority"])&&(f=pg(c.evaluate(a.f,"flow-priority"),0));d=new di(b,d,e,f,g,k,h,l);a.C.push(d);a.l==b&&(a.l=null);a.k&&Pk(a.k,d)}
function Lk(a,b,c){var d=-1;if(b<=a.b&&(d=Bk(a.e,b),d+=c,d<yk(a.e)))return Ck(a.e,d);if(null==a.d)return Number.POSITIVE_INFINITY;for(var e=a.f;;){var f=a.d.firstChild;if(null==f)for(;;){if(1==a.d.nodeType){var f=a.B,g=a.d;if(f.xa.pop()!==g)throw Error("Invalid call to popElement");f.La.pop();f.pop();hk(f);a.Sa=a.F.pop()}if(f=a.d.nextSibling)break;a.d=a.d.parentNode;if(a.d===a.root)return a.d=null,b<a.b&&(0>d&&(d=Bk(a.e,b),d+=c),d<=yk(a.e))?Ck(a.e,d):Number.POSITIVE_INFINITY}a.d=f;if(1!=a.d.nodeType)a.b+=
a.d.textContent.length,a.Sa?zk(a.e,a.b):Ak(a.e,a.b);else{g=a.d;f=Ek(a,g);a.F.push(a.Sa);jk(a.B,g,f);a.j||"body"!=g.localName||g.parentNode!=a.root||(Fk(a,f,!0),a.j=!0);var k=f["flow-into"];k&&(k=k.evaluate(e,"flow-into").toString(),Mk(a,k,f,g,a.b),a.Sa=!!a.Z[k]);a.Sa&&(g=f.display)&&g.evaluate(e,"display")===Xd&&(a.Sa=!1);if(Ah(a.ba,a.d)!=a.b)throw Error("Inconsistent offset");a.w["e"+a.b]=f;a.b++;a.Sa?zk(a.e,a.b):Ak(a.e,a.b);if(b<a.b&&(0>d&&(d=Bk(a.e,b),d+=c),d<=yk(a.e)))return Ck(a.e,d)}}}
Dk.prototype.g=function(a,b){var c=Ah(this.ba,a),d="e"+c;b&&(c=Bh(this.ba,a,0,!0));this.b<=c&&Lk(this,c,0);return this.w[d]};var Sk=1;function Tk(a,b,c,d,e){this.b={};this.children=[];this.e=null;this.h=0;this.d=a;this.name=b;this.lb=c;this.za=d;this.parent=e;this.g="p"+Sk++;e&&(this.h=e.children.length,e.children.push(this))}Tk.prototype.f=function(){throw Error("E_UNEXPECTED_CALL");};Tk.prototype.clone=function(){throw Error("E_UNEXPECTED_CALL");};function Uk(a,b){var c=a.b,d=b.b,e;for(e in c)Object.prototype.hasOwnProperty.call(c,e)&&(d[e]=c[e])}
function Vk(a,b){for(var c=0;c<a.children.length;c++)a.children[c].clone({parent:b})}function Wk(a){Tk.call(this,a,null,null,[],null);this.b.width=new T(oe,0);this.b.height=new T(pe,0)}u(Wk,Tk);
function Xk(a,b){this.e=b;var c=this;mc.call(this,a,function(a,b){var f=a.match(/^([^.]+)\.([^.]+)$/);if(f){var g=c.e.j[f[1]];if(g&&(g=this.oa[g])){if(b){var f=f[2],k=g.fa[f];if(k)g=k;else{switch(f){case "columns":var k=g.d.d,h=new cd(k,0),l=Yk(g,"column-count"),m=Yk(g,"column-width"),p=Yk(g,"column-gap"),k=E(k,ed(k,new $c(k,"min",[h,l]),D(k,m,p)),p)}k&&(g.fa[f]=k);g=k}}else g=Yk(g,f[2]);return g}}return null})}u(Xk,mc);
function Zk(a,b,c,d,e,f,g){a=a instanceof Xk?a:new Xk(a,this);Tk.call(this,a,b,c,d,e);this.e=this;this.I=f;this.S=g;this.b.width=new T(oe,0);this.b.height=new T(pe,0);this.b["wrap-flow"]=new T(Bd,0);this.b.position=new T(be,0);this.b.overflow=new T(le,0);this.j={}}u(Zk,Tk);Zk.prototype.f=function(a){return new $k(a,this)};Zk.prototype.clone=function(a){a=new Zk(this.d,this.name,a.lb||this.lb,this.za,this.parent,this.I,this.S);Uk(this,a);Vk(this,a);return a};
function al(a,b,c,d,e){Tk.call(this,a,b,c,d,e);this.e=e.e;b&&(this.e.j[b]=this.g);this.b["wrap-flow"]=new T(Bd,0)}u(al,Tk);al.prototype.f=function(a){return new bl(a,this)};al.prototype.clone=function(a){a=new al(a.parent.d,this.name,this.lb,this.za,a.parent);Uk(this,a);Vk(this,a);return a};function cl(a,b,c,d,e){Tk.call(this,a,b,c,d,e);this.e=e.e;b&&(this.e.j[b]=this.g)}u(cl,Tk);cl.prototype.f=function(a){return new dl(a,this)};
cl.prototype.clone=function(a){a=new cl(a.parent.d,this.name,this.lb,this.za,a.parent);Uk(this,a);Vk(this,a);return a};function V(a,b,c){return b&&b!==Bd?b.ia(a,c):null}function el(a,b,c){return b&&b!==Bd?b.ia(a,c):a.b}function fl(a,b,c){return b?b===Bd?null:b.ia(a,c):a.b}function gl(a,b,c,d){return b&&c!==Xd?b.ia(a,d):a.b}function hl(a,b,c){return b?b===me?a.g:b===Kd?a.f:b.ia(a,a.b):c}
function il(a,b){this.e=a;this.d=b;this.C={};this.style={};this.k=this.l=null;this.children=[];this.F=this.H=this.f=this.g=!1;this.w=this.B=0;this.u=null;this.oa={};this.fa={};this.xa=this.b=!1;a&&a.children.push(this)}function jl(a,b,c){b=Yk(a,b);c=Yk(a,c);if(!b||!c)throw Error("E_INTERNAL");return D(a.d.d,b,c)}
function Yk(a,b){var c=a.oa[b];if(c)return c;var d=a.style[b];d&&(c=d.ia(a.d.d,a.d.d.b));switch(b){case "margin-left-edge":c=Yk(a,"left");break;case "margin-top-edge":c=Yk(a,"top");break;case "margin-right-edge":c=jl(a,"border-right-edge","margin-right");break;case "margin-bottom-edge":c=jl(a,"border-bottom-edge","margin-bottom");break;case "border-left-edge":c=jl(a,"margin-left-edge","margin-left");break;case "border-top-edge":c=jl(a,"margin-top-edge","margin-top");break;case "border-right-edge":c=
jl(a,"padding-right-edge","border-right-width");break;case "border-bottom-edge":c=jl(a,"padding-bottom-edge","border-bottom-width");break;case "padding-left-edge":c=jl(a,"border-left-edge","border-left-width");break;case "padding-top-edge":c=jl(a,"border-top-edge","border-top-width");break;case "padding-right-edge":c=jl(a,"right-edge","padding-right");break;case "padding-bottom-edge":c=jl(a,"bottom-edge","padding-bottom");break;case "left-edge":c=jl(a,"padding-left-edge","padding-left");break;case "top-edge":c=
jl(a,"padding-top-edge","padding-top");break;case "right-edge":c=jl(a,"left-edge","width");break;case "bottom-edge":c=jl(a,"top-edge","height")}if(!c){if("extent"==b)d=a.b?"width":"height";else if("measure"==b)d=a.b?"height":"width";else{var e=a.b?Xi:Yi,d=b,f;for(f in e)d=d.replace(f,e[f])}d!=b&&(c=Yk(a,d))}c&&(a.oa[b]=c);return c}
function kl(a){var b=a.d.d,c=a.style,d=hl(b,c.enabled,b.g),e=V(b,c.page,b.b);if(e)var f=new Yc(b,"page-number"),d=dd(b,d,new Qc(b,e,f));(e=V(b,c["min-page-width"],b.b))&&(d=dd(b,d,new Pc(b,new Yc(b,"page-width"),e)));(e=V(b,c["min-page-height"],b.b))&&(d=dd(b,d,new Pc(b,new Yc(b,"page-height"),e)));d=a.N(d);c.enabled=new K(d)}il.prototype.N=function(a){return a};
il.prototype.Lc=function(){var a=this.d.d,b=this.style,c=this.e?this.e.style.width.ia(a,null):null,d=V(a,b.left,c),e=V(a,b["margin-left"],c),f=gl(a,b["border-left-width"],b["border-left-style"],c),g=el(a,b["padding-left"],c),k=V(a,b.width,c),h=V(a,b["max-width"],c),l=el(a,b["padding-right"],c),m=gl(a,b["border-right-width"],b["border-right-style"],c),p=V(a,b["margin-right"],c),q=V(a,b.right,c),t=D(a,f,g),r=D(a,f,l);d&&q&&k?(t=E(a,c,D(a,k,D(a,D(a,d,t),r))),e?p?q=E(a,t,p):p=E(a,t,D(a,q,e)):(t=E(a,t,
q),p?e=E(a,t,p):p=e=ed(a,t,new nc(a,.5)))):(e||(e=a.b),p||(p=a.b),d||q||k||(d=a.b),d||k?d||q?k||q||(k=this.l,this.g=!0):d=a.b:(k=this.l,this.g=!0),t=E(a,c,D(a,D(a,e,t),D(a,p,r))),this.g&&(h||(h=E(a,t,d?d:q)),this.b||!V(a,b["column-width"],null)&&!V(a,b["column-count"],null)||(k=h,this.g=!1)),d?k?q||(q=E(a,t,D(a,d,k))):k=E(a,t,D(a,d,q)):d=E(a,t,D(a,q,k)));a=el(a,b["snap-width"]||(this.e?this.e.style["snap-width"]:null),c);b.left=new K(d);b["margin-left"]=new K(e);b["border-left-width"]=new K(f);b["padding-left"]=
new K(g);b.width=new K(k);b["max-width"]=new K(h?h:k);b["padding-right"]=new K(l);b["border-right-width"]=new K(m);b["margin-right"]=new K(p);b.right=new K(q);b["snap-width"]=new K(a)};
il.prototype.Mc=function(){var a=this.d.d,b=this.style,c=this.e?this.e.style.width.ia(a,null):null,d=this.e?this.e.style.height.ia(a,null):null,e=V(a,b.top,d),f=V(a,b["margin-top"],c),g=gl(a,b["border-top-width"],b["border-top-style"],c),k=el(a,b["padding-top"],c),h=V(a,b.height,d),l=V(a,b["max-height"],d),m=el(a,b["padding-bottom"],c),p=gl(a,b["border-bottom-width"],b["border-bottom-style"],c),q=V(a,b["margin-bottom"],c),t=V(a,b.bottom,d),r=D(a,g,k),y=D(a,p,m);e&&t&&h?(d=E(a,d,D(a,h,D(a,D(a,e,r),
y))),f?q?t=E(a,d,f):q=E(a,d,D(a,t,f)):(d=E(a,d,t),q?f=E(a,d,q):q=f=ed(a,d,new nc(a,.5)))):(f||(f=a.b),q||(q=a.b),e||t||h||(e=a.b),e||h?e||t?h||t||(h=this.k,this.f=!0):e=a.b:(h=this.k,this.f=!0),d=E(a,d,D(a,D(a,f,r),D(a,q,y))),this.f&&(l||(l=E(a,d,e?e:t)),this.b&&(V(a,b["column-width"],null)||V(a,b["column-count"],null))&&(h=l,this.f=!1)),e?h?t||(t=E(a,d,D(a,e,h))):h=E(a,d,D(a,t,e)):e=E(a,d,D(a,t,h)));a=el(a,b["snap-height"]||(this.e?this.e.style["snap-height"]:null),c);b.top=new K(e);b["margin-top"]=
new K(f);b["border-top-width"]=new K(g);b["padding-top"]=new K(k);b.height=new K(h);b["max-height"]=new K(l?l:h);b["padding-bottom"]=new K(m);b["border-bottom-width"]=new K(p);b["margin-bottom"]=new K(q);b.bottom=new K(t);b["snap-height"]=new K(a)};
function ll(a){var b=a.d.d,c=a.style;a=V(b,c[a.b?"height":"width"],null);var d=V(b,c["column-width"],a),e=V(b,c["column-count"],null),f;(f=(f=c["column-gap"])&&f!==Yd?f.ia(b,null):null)||(f=new Xc(b,1,"em"));d&&!e&&(e=new $c(b,"floor",[fd(b,D(b,a,f),D(b,d,f))]),e=new $c(b,"max",[b.d,e]));e||(e=b.d);d=E(b,fd(b,D(b,a,f),e),f);c["column-width"]=new K(d);c["column-count"]=new K(e);c["column-gap"]=new K(f)}function ml(a,b,c,d){a=a.style[b].ia(a.d.d,null);return Ac(a,c,d,{})}
function nl(a,b){b.oa[a.d.g]=a;var c=a.d.d,d=a.style,e=a.e?ol(a.e,b):null,e=uk(a.C,b,e,!1);a.b=tk(e,b,a.e?a.e.b:!1);vk(e,d,a.b,function(a,b){return b.value});a.l=new pc(c,function(){return a.B},"autoWidth");a.k=new pc(c,function(){return a.w},"autoHeight");a.Lc();a.Mc();ll(a);kl(a)}function pl(a,b,c){(a=a.style[c])&&(a=mg(b,a,c));return a}function Y(a,b,c){(a=a.style[c])&&(a=mg(b,a,c));return xd(a,b)}
function ol(a,b){var c;a:{if(c=a.C["region-id"]){for(var d=[],e=0;e<c.length;e++){var f=c[e].evaluate(b,"");f&&f!==G&&d.push(f)}if(d.length){c=d;break a}}c=null}if(c){d=[];for(e=0;e<c.length;e++)d[e]=c[e].toString();return d}return null}function ql(a,b,c,d,e){if(a=pl(a,b,d))a.Nb()&&tc(a.ea)&&(a=new I(xd(a,b),"px")),"font-family"===d&&(a=qh(e,a)),w(c.d,d,a.toString())}
function rl(a,b,c){var d=Y(a,b,"left"),e=Y(a,b,"margin-left"),f=Y(a,b,"padding-left"),g=Y(a,b,"border-left-width");a=Y(a,b,"width");Ai(c,d,a);w(c.d,"margin-left",e+"px");w(c.d,"padding-left",f+"px");w(c.d,"border-left-width",g+"px");c.marginLeft=e;c.Z=g;c.j=f}
function sl(a,b,c){var d=Y(a,b,"right"),e=Y(a,b,"snap-height"),f=Y(a,b,"margin-right"),g=Y(a,b,"padding-right");b=Y(a,b,"border-right-width");w(c.d,"margin-right",f+"px");w(c.d,"padding-right",g+"px");w(c.d,"border-right-width",b+"px");c.marginRight=f;c.Ja=b;a.b&&0<e&&(a=d+xi(c),a=a-Math.floor(a/e)*e,0<a&&(c.ac=e-a,g+=c.ac));c.H=g;c.bc=e}
function tl(a,b,c){var d=Y(a,b,"snap-height"),e=Y(a,b,"top"),f=Y(a,b,"margin-top"),g=Y(a,b,"padding-top");b=Y(a,b,"border-top-width");c.top=e;c.marginTop=f;c.fa=b;c.Ka=d;!a.b&&0<d&&(a=e+ui(c),a=a-Math.floor(a/d)*d,0<a&&(c.pa=d-a,g+=c.pa));c.k=g;w(c.d,"top",e+"px");w(c.d,"margin-top",f+"px");w(c.d,"padding-top",g+"px");w(c.d,"border-top-width",b+"px")}
function ul(a,b,c){var d=Y(a,b,"margin-bottom"),e=Y(a,b,"padding-bottom"),f=Y(a,b,"border-bottom-width");a=Y(a,b,"height")-c.pa;w(c.d,"height",a+"px");w(c.d,"margin-bottom",d+"px");w(c.d,"padding-bottom",e+"px");w(c.d,"border-bottom-width",f+"px");c.height=a-c.pa;c.marginBottom=d;c.xa=f;c.w=e}function vl(a,b,c){a.b?(tl(a,b,c),ul(a,b,c)):(sl(a,b,c),rl(a,b,c))}
function wl(a,b,c){w(c.d,"border-top-width","0px");var d=Y(a,b,"max-height");a.H?zi(c,0,d):(tl(a,b,c),d-=c.pa,c.height=d,w(c.d,"height",d+"px"))}function xl(a,b,c){w(c.d,"border-left-width","0px");var d=Y(a,b,"max-width");a.F?Ai(c,0,d):(sl(a,b,c),d-=c.ac,c.width=d,a=Y(a,b,"right"),w(c.d,"right",a+"px"),w(c.d,"width",d+"px"))}
var yl="border-left-style border-right-style border-top-style border-bottom-style border-left-color border-right-color border-top-color border-bottom-color outline-style outline-color outline-width overflow visibility".split(" "),zl="border-top-left-radius border-top-right-radius border-bottom-right-radius border-bottom-left-radius border-image-source border-image-slice border-image-width border-image-outset border-image-repeat background-attachment background-color background-image background-repeat background-position background-clip background-origin background-size opacity z-index".split(" "),
Al="color font-family font-size font-style font-weight font-variant line-height letter-spacing text-align text-decoration text-indent text-transform white-space word-spacing".split(" "),Bl=["transform","transform-origin"];
il.prototype.kb=function(a,b,c,d){this.e&&this.b==this.e.b||w(b.d,"writing-mode",this.b?"vertical-rl":"horizontal-tb");(this.b?this.g:this.f)?this.b?xl(this,a,b):wl(this,a,b):(this.b?sl(this,a,b):tl(this,a,b),this.b?rl(this,a,b):ul(this,a,b));(this.b?this.f:this.g)?this.b?wl(this,a,b):xl(this,a,b):vl(this,a,b);for(c=0;c<yl.length;c++)ql(this,a,b,yl[c],d)};function Cl(a,b,c,d){for(var e=0;e<Al.length;e++)ql(a,b,c,Al[e],d)}
il.prototype.gc=function(a,b,c,d,e,f,g){this.b?this.B=b.e+b.ac:this.w=b.e+b.pa;f=(this.b||!d)&&this.f;var k=(!this.b||!d)&&this.g,h=null;if(k||f)k&&w(b.d,"width","auto"),f&&w(b.d,"height","auto"),h=(d?d.d:b.d).getBoundingClientRect(),k&&(this.B=Math.ceil(h.right-h.left-b.j-b.Z-b.H-b.Ja),this.b&&(this.B+=b.ac)),f&&(this.w=h.bottom-h.top-b.k-b.fa-b.w-b.xa,this.b||(this.w+=b.pa));(this.b?this.f:this.g)&&vl(this,a,b);if(this.b?this.g:this.f){if(this.b?this.F:this.H)this.b?sl(this,a,b):tl(this,a,b);this.b?
rl(this,a,b):ul(this,a,b)}if(1<e&&(f=Y(this,a,"column-rule-width"),k=pl(this,a,"column-rule-style"),h=pl(this,a,"column-rule-color"),0<f&&k&&k!=Xd&&h!=ie)){var l=Y(this,a,"column-gap"),m=this.b?b.height:b.width,p=this.b?"border-top":"border-left";for(d=1;d<e;d++){var q=(m+l)*d/e-l/2+b.j-f/2,t=b.height+b.k+b.w,r=b.d.ownerDocument.createElement("div");w(r,"position","absolute");w(r,this.b?"left":"top","0px");w(r,this.b?"top":"left",q+"px");w(r,this.b?"height":"width","0px");w(r,this.b?"width":"height",
t+"px");w(r,p,f+"px "+k.toString()+(h?" "+h.toString():""));b.d.insertBefore(r,b.d.firstChild)}}for(d=0;d<zl.length;d++)ql(this,a,b,zl[d],g);for(d=0;d<Bl.length;d++)e=b,g=Bl[d],f=c.h,(k=pl(this,a,g))&&f.push(new Wh(e.d,g,k))};
il.prototype.h=function(a,b){var c=this.C,d=this.d.b,e;for(e in d)bj(e)&&cj(c,e,d[e]);if("background-host"==this.d.lb)for(e in b)if(e.match(/^background-/)||"writing-mode"==e)c[e]=b[e];if("layout-host"==this.d.lb)for(e in b)e.match(/^background-/)||"writing-mode"==e||(c[e]=b[e]);dk(a,this.d.za,null,c);c.content&&(c.content=c.content.Gc(new Mj(a,null)));nl(this,a.d);for(c=0;c<this.d.children.length;c++)this.d.children[c].f(this).h(a,b);a.pop()};
function Dl(a,b){a.g&&(a.F=ml(a,"right",a.l,b)||ml(a,"margin-right",a.l,b)||ml(a,"border-right-width",a.l,b)||ml(a,"padding-right",a.l,b));a.f&&(a.H=ml(a,"top",a.k,b)||ml(a,"margin-top",a.k,b)||ml(a,"border-top-width",a.k,b)||ml(a,"padding-top",a.k,b));for(var c=0;c<a.children.length;c++)Dl(a.children[c],b)}function El(a){il.call(this,null,a)}u(El,il);El.prototype.h=function(a,b){il.prototype.h.call(this,a,b);this.children.sort(function(a,b){return b.d.S-a.d.S||a.d.h-b.d.h})};
function $k(a,b){il.call(this,a,b);this.u=this}u($k,il);$k.prototype.N=function(a){var b=this.d.e;b.I&&(a=dd(b.d,a,b.I));return a};$k.prototype.Z=function(){};function bl(a,b){il.call(this,a,b);this.u=a.u}u(bl,il);function dl(a,b){il.call(this,a,b);this.u=a.u}u(dl,il);function Fl(a,b,c,d){var e=null;c instanceof rd&&(e=[c]);c instanceof kd&&(e=c.values);if(e)for(a=a.d.d,c=0;c<e.length;c++)if(e[c]instanceof rd){var f=kc(e[c].name,"enabled"),f=new Yc(a,f);d&&(f=new Gc(a,f));b=dd(a,b,f)}return b}
dl.prototype.N=function(a){var b=this.d.d,c=this.style,d=hl(b,c.required,b.f)!==b.f;if(d||this.f){var e;e=(e=c["flow-from"])?e.ia(b,b.b):new nc(b,"body");e=new $c(b,"has-content",[e]);a=dd(b,a,e)}a=Fl(this,a,c["required-partitions"],!1);a=Fl(this,a,c["conflicting-partitions"],!0);d&&(c=(c=this.u.style.enabled)?c.ia(b,null):b.g,c=dd(b,c,a),this.u.style.enabled=new K(c));return a};dl.prototype.kb=function(a,b,c,d){w(b.d,"overflow","hidden");il.prototype.kb.call(this,a,b,c,d)};
function Gl(a,b,c,d){Jf.call(this,a,b,!1);this.target=c;this.b=d}u(Gl,Kf);Gl.prototype.Xa=function(a,b,c){hh(this.b,a,b,c,this)};Gl.prototype.uc=function(a,b){Lf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};Gl.prototype.Mb=function(a,b){Lf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};Gl.prototype.Ya=function(a,b,c){this.target.b[a]=new T(b,c?50331648:67108864)};function Hl(a,b,c,d){Gl.call(this,a,b,c,d)}u(Hl,Gl);
function Il(a,b,c,d){Gl.call(this,a,b,c,d);c.b.width=new T(ne,0);c.b.height=new T(ne,0)}u(Il,Gl);Il.prototype.Vb=function(a,b,c){a=new cl(this.d,a,b,c,this.target);If(this.aa,new Hl(this.d,this.aa,a,this.b))};Il.prototype.Ub=function(a,b,c){a=new al(this.d,a,b,c,this.target);a=new Il(this.d,this.aa,a,this.b);If(this.aa,a)};function Jl(a,b,c,d){Gl.call(this,a,b,c,d)}u(Jl,Gl);Jl.prototype.Vb=function(a,b,c){a=new cl(this.d,a,b,c,this.target);If(this.aa,new Hl(this.d,this.aa,a,this.b))};
Jl.prototype.Ub=function(a,b,c){a=new al(this.d,a,b,c,this.target);a=new Il(this.d,this.aa,a,this.b);If(this.aa,a)};var Kl={"text-indent":"0px","margin-top":"0px","padding-top":"0px","border-top-width":"0px","border-top-style":"none","border-top-color":"transparent"},Ll={"text-indent":"0px","margin-right":"0px","padding-right":"0px","border-right-width":"0px","border-right-style":"none","border-right-color":"transparent"},Ml={"margin-top":"0px"},Nl={"margin-right":"0px"},Ol={};
function Pl(a){a.addEventListener("load",function(){a.contentWindow.navigator.epubReadingSystem={name:"adapt",version:"0.1",layoutStyle:"paginated",hasFeature:function(a){switch(a){case "mouse-events":return!0}return!1}}},!1)}var Ql=(new DOMParser).parseFromString('<root xmlns="http://www.pyroxy.com/ns/shadow"/>',"text/xml"),Rl="footnote-marker first-5-lines first-4-lines first-3-lines first-2-lines first-line first-letter before  after".split(" ");
function Sl(a){return a.getAttribute("data-adapt-pseudo")||""}function Tl(a,b,c,d){this.style=b;this.f=a;this.b=c;this.d=d;this.e={}}
Tl.prototype.g=function(a){var b=Sl(a);this.b&&b&&b.match(/after$/)&&(this.style=this.b.g(this.f,!0),this.b=null);var c=this.style._pseudos[b]||{};if(!this.e[b]){this.e[b]=!0;var d=c.content;d&&(d=d.evaluate(this.d),Ci(d)&&d.T(new Bi(a,this.d)))}if(b.match(/^first-/)&&!c["x-first-pseudo"]){a=1;var e;"first-letter"==b?a=0:null!=(e=b.match(/^first-([0-9]+)-lines$/))&&(a=e[1]-0);c["x-first-pseudo"]=new T(new td(a),0)}return c};
function Ul(a,b,c,d,e,f,g,k,h,l,m,p,q){this.w=a;this.d=b;this.viewport=c;this.l=c.b;this.j=d;this.C=e;this.ba=f;this.B=g;this.k=k;this.F=h;this.e=l;this.g=m;this.u=p;this.f=q;this.H=this.b=null;this.h=!1;this.Y=null;this.ca=0;this.A=null}Ul.prototype.clone=function(){return new Ul(this.w,this.d,this.viewport,this.j,this.C,this.ba,this.B,this.k,this.F,this.e,this.g,this.u,this.f)};
function Vl(a,b,c,d,e,f){var g=L("createRefShadow");a.ba.j.load(b).then(function(k){if(k){var h=Fh(k,b);if(h){var l=a.F,m=l.w[k.url];if(!m){var m=l.style.h.b[k.url],p=new uc(0,l.jb(),l.ib(),l.h),m=new Dk(k,m.d,m.g,p,l.e,m.j,l.k);l.w[k.url]=m}f=new hi(d,h,k,e,f,c,m)}}O(g,f)});return N(g)}
function Wl(a,b,c,d,e,f,g,k){var h=L("createShadows"),l=e.template,m;l instanceof vd?m=Vl(a,l.url,2,b,k,null):m=M(null);m.then(function(l){var m=null;if("http://www.pyroxy.com/ns/shadow"==b.namespaceURI&&"include"==b.localName){var t=b.getAttribute("href"),r=null;t?r=k?k.ba:a.ba:k&&(t="http://www.w3.org/1999/xhtml"==k.aa.namespaceURI?k.aa.getAttribute("href"):k.aa.getAttributeNS("http://www.w3.org/1999/xlink","href"),r=k.Sc?k.Sc.ba:a.ba);t&&(t=ua(t,r.url),m=Vl(a,t,3,b,k,l))}null==m&&(m=M(l));m.then(function(l){var m;
if(m=d._pseudos){for(var p=Ql.createElementNS("http://www.pyroxy.com/ns/shadow","root"),q=p,t=0;t<Rl.length;t++){var r=Rl[t],sa;if(r){if(!m[r])continue;if(!("footnote-marker"!=r||c&&a.h))continue;if(r.match(/^first-/)&&(sa=e.display,!sa||sa===Qd))continue;sa=Ql.createElementNS("http://www.w3.org/1999/xhtml","span");sa.setAttribute("data-adapt-pseudo",r)}else sa=Ql.createElementNS("http://www.pyroxy.com/ns/shadow","content");q.appendChild(sa);r.match(/^first-/)&&(q=sa)}l=new hi(b,p,null,k,l,2,new Tl(b,
d,f,g))}O(h,l)})});return N(h)}function Xl(a,b,c){a.H=b;a.h=c}function Yl(a,b,c,d){var e=a.d;c=uk(c,e,a.C,a.h);b=tk(c,e,b);vk(c,d,b,function(b,c){var d=c.evaluate(e,b);"font-family"==b&&(d=qh(a.B,d));return d});return b}
function Zl(a,b){for(var c=a.b.Y,d=[],e=a.b.da,f=-1;c&&1==c.nodeType;){var g=e&&e.root==c;if(!g||2==e.type){var k=(e?e.b:a.j).g(c,!1);d.push(k)}g?(c=e.aa,e=e.Sc):(c=c.parentNode,f++)}c=wc(a.d,"em",0===f);c={"font-size":new T(new I(c,"px"),0)};e=new gj(c,a.d);for(f=d.length-1;0<=f;--f){var g=d[f],k=[],h;for(h in g)Oi[h]&&k.push(h);k.sort(se);for(var l=0;l<k.length;l++){var m=k[l];e.b=m;c[m]=g[m].Gc(e)}}for(var p in b)Oi[p]||(c[p]=b[p]);return c}
var $l={a:"a",sub:"sub",sup:"sup",table:"table",tr:"tr",td:"td",th:"th",code:"code",body:"div",p:"p",v:"p",date:"p",emphasis:"em",strong:"strong",style:"span",strikethrough:"del"};function am(a,b){b=ua(b,a.ba.url);return a.u[b]||b}
function bm(a,b,c){var d=!0,e=L("createElementView"),f=a.Y,g=a.b.da?a.b.da.b:a.j,k=g.g(f,!1),h={};a.b.parent||(k=Zl(a,k));a.b.f=Yl(a,a.b.f,k,h);h.direction&&(a.b.F=h.direction.toString());var l=h["flow-into"];if(l&&l.toString()!=a.w)return O(e,!1),N(e);var m=h.display;if(m===Xd)return O(e,!1),N(e);a.b.B=m===Ld;Wl(a,f,null==a.b.parent,k,h,g,a.d,a.b.da).then(function(g){a.b.wa=g;var k=a.b.parent&&a.b.parent.k;g=h["float-reference"];var l=h["float"],r=h.clear;if(h.position===yd||h.position===be)a.b.k=
!0,l=null;k&&(r=null,l!==Md&&(l=null));k=l===Ud||l===ce||l===he||l===Gd||l===Sd||l===Rd||l===Ed||l===Dd||l===Md;l&&(delete h["float"],l===Md&&(a.h?(k=!1,h.display=Cd):h.display=Qd),a.b.k=!0);r&&(r===Pd&&a.b.parent&&a.b.parent.u&&(r=H(a.b.parent.u)),r===Ud||r===ce||r===Fd)&&(delete h.clear,h.display&&h.display!=Qd&&(a.b.u=r.toString()));h.overflow===Nd&&(a.b.k=!0);var y=m===Vd&&h["ua-list-item-count"];k||h["break-inside"]&&h["break-inside"]!==Bd?a.b.h++:m===ge&&(a.b.h+=10);a.b.b=!k&&!m||m===Qd;a.b.j=
k?l.toString():null;a.b.N=g?g.toString():null;if(!a.b.b){if(g=h["break-after"])a.b.C=g.toString();if(g=h["break-before"])a.b.g=g.toString()}if(g=h["x-first-pseudo"])a.b.d=new ii(a.b.parent?a.b.parent.d:null,g.D);if(g=h["white-space"])switch(g.toString()){case "normal":case "nowrap":a.b.w=0;break;case "pre-line":a.b.w=1;break;case "pre":case "pre-wrap":a.b.w=2}var J=!1,W=null,la=[],X=f.namespaceURI,F=f.localName;if("http://www.w3.org/1999/xhtml"==X)"html"==F||"body"==F||"script"==F||"link"==F||"meta"==
F?F="div":"vide_"==F?F="video":"audi_"==F?F="audio":"object"==F&&(J=!!a.g);else if("http://www.idpf.org/2007/ops"==X)F="span",X="http://www.w3.org/1999/xhtml";else if("http://www.gribuser.ru/xml/fictionbook/2.0"==X){X="http://www.w3.org/1999/xhtml";if("image"==F){if(F="div",(g=f.getAttributeNS("http://www.w3.org/1999/xlink","href"))&&"#"==g.charAt(0)&&(g=Fh(a.ba,g)))W=a.createElement(X,"img"),g="data:"+(g.getAttribute("content-type")||"image/jpeg")+";base64,"+g.textContent.replace(/[ \t\n\t]/g,""),
la.push(wg(W,g))}else F=$l[F];F||(F=a.b.b?"span":"div")}else if("http://www.daisy.org/z3986/2005/ncx/"==X)if(X="http://www.w3.org/1999/xhtml","ncx"==F||"navPoint"==F)F="div";else if("navLabel"==F){if(F="span",l=f.parentNode){g=null;for(l=l.firstChild;l;l=l.nextSibling)if(1==l.nodeType&&(r=l,"http://www.daisy.org/z3986/2005/ncx/"==r.namespaceURI&&"content"==r.localName)){g=r.getAttribute("src");break}g&&(F="a",f=f.ownerDocument.createElementNS(X,"a"),f.setAttribute("href",g))}}else F="span";else"http://www.pyroxy.com/ns/shadow"==
X?(X="http://www.w3.org/1999/xhtml",F=a.b.b?"span":"div"):J=!!a.g;y?b?F="li":(F="div",m=Cd,h.display=m):"body"==F||"li"==F?F="div":"q"==F?F="span":"a"==F&&(g=h["hyperlink-processing"])&&"normal"!=g.toString()&&(F="span");h.behavior&&"none"!=h.behavior.toString()&&a.g&&(J=!0);var sa;J?sa=a.g(f,a.b.parent?a.b.parent.A:null,h):sa=M(null);sa.then(function(g){g?J&&(d="true"==g.getAttribute("data-adapt-process-children")):g=a.createElement(X,F);"a"==F&&g.addEventListener("click",a.e.C,!1);W&&(cm(a,a.b,
"inner",W),g.appendChild(W));"iframe"==g.localName&&"http://www.w3.org/1999/xhtml"==g.namespaceURI&&Pl(g);if("http://www.gribuser.ru/xml/fictionbook/2.0"!=f.namespaceURI||"td"==F){for(var k=f.attributes,l=k.length,m=null,p=0;p<l;p++){var q=k[p],r=q.namespaceURI,t=q.localName,q=q.nodeValue;if(r)if("http://www.w3.org/2000/xmlns/"==r)continue;else"http://www.w3.org/1999/xlink"==r&&"href"==t&&(q=am(a,q));else{if(t.match(/^on/))continue;if("style"==t)continue;if("id"==t){bi(a.e,g,q);continue}"src"==t||
"href"==t||"poster"==t?q=am(a,q):"srcset"==t&&(q=q.split(",").map(function(b){return am(a,b.trim())}).join(","))}if(r){var sa=Ol[r];sa&&(t=sa+":"+t)}"src"!=t||r||"img"!=F||"http://www.w3.org/1999/xhtml"!=X?"href"==t&&"image"==F&&"http://www.w3.org/2000/svg"==X&&"http://www.w3.org/1999/xlink"==r?a.e.f.push(wg(g,q)):r?g.setAttributeNS(r,t,q):g.setAttribute(t,q):m=q}m&&(k=wg(g,m),l=h.width,m=h.height,l&&l!==Bd&&m&&m!==Bd?a.e.f.push(k):la.push(k))}delete h.content;(k=h["list-style-image"])&&k instanceof
vd&&(k=k.url,la.push(wg(new Image,k)));dm(a,g,h);k=h.widows;l=h.orphans;if(k||l){if(a.b.parent){a.b.l={};for(var Yb in a.b.parent.l)a.b.l[Yb]=a.b.parent.l[Yb]}k instanceof td&&(a.b.l.widows=k.D);l instanceof td&&(a.b.l.orphans=l.D)}if(!a.b.b&&(Yb=null,b?c&&(Yb=a.b.f?Nl:Ml):Yb=a.b.f?Ll:Kl,Yb))for(var Rk in Yb)w(g,Rk,Yb[Rk]);y&&g.setAttribute("value",h["ua-list-item-count"].stringValue());a.A=g;la.length?vg(la).then(function(){O(e,d)}):qf().then(function(){O(e,d)})})});return N(e)}
function em(a,b,c){var d=L("createNodeView"),e=!0;1==a.Y.nodeType?b=bm(a,b,c):(8==a.Y.nodeType?a.A=null:a.A=document.createTextNode(a.Y.textContent.substr(a.ca||0)),b=M(!0));b.then(function(b){e=b;(a.b.A=a.A)&&(b=a.b.parent?a.b.parent.A:a.H)&&b.appendChild(a.A);O(d,e)});return N(d)}function fm(a,b,c,d){(a.b=b)?(a.Y=b.Y,a.ca=b.ca):(a.Y=null,a.ca=-1);a.A=null;return a.b?em(a,c,!!d):M(!0)}
function gm(a){if(null==a.da||"content"!=a.Y.localName||"http://www.pyroxy.com/ns/shadow"!=a.Y.namespaceURI)return a;var b=a.ga,c=a.da,d=a.parent,e,f;c.nd?(f=c.nd,e=c.root,c=c.type,2==c&&(e=e.firstChild)):(f=c.Sc,e=c.aa.firstChild,c=2);var g=a.Y.nextSibling;g?(a.Y=g,ki(a)):a.qa?a=a.qa:e?a=null:(a=a.parent.modify(),a.L=!0);if(e)return b=new ji(e,d,b),b.da=f,b.Na=c,b.qa=a,b;a.ga=b;return a}
function hm(a){var b=a.ga+1;if(a.L){if(!a.parent)return null;if(3!=a.Na){var c=a.Y.nextSibling;if(c)return a=a.modify(),a.ga=b,a.Y=c,ki(a),gm(a)}if(a.qa)return a=a.qa.modify(),a.ga=b,a;a=a.parent.modify()}else{if(a.wa&&(c=a.wa.root,2==a.wa.type&&(c=c.firstChild),c))return b=new ji(c,a,b),b.da=a.wa,b.Na=a.wa.type,gm(b);if(c=a.Y.firstChild)return gm(new ji(c,a,b));1!=a.Y.nodeType&&(b+=a.Y.textContent.length-1-a.ca);a=a.modify()}a.ga=b;a.L=!0;return a}
function im(a,b,c){b=hm(b);if(!b||b.L)return M(b);var d=L("nextInTree");fm(a,b,!0,c).then(function(a){b.A&&a||(b=b.modify(),b.L=!0,b.A||(b.b=!0));O(d,b)});return N(d)}function jm(a,b){if(b instanceof kd)for(var c=b.values,d=0;d<c.length;d++)jm(a,c[d]);else b instanceof vd&&(c=b.url,a.e.f.push(wg(new Image,c)))}
function dm(a,b,c){var d=c["background-image"];d&&jm(a,d);var d=c.position===be,e;for(e in c){var f=c[e];Uh[e]||d&&Vh[e]?a.e.h.push(new Wh(b,e,f)):(f.Nb()&&tc(f.ea)&&(f=new I(xd(f,a.d),"px")),w(b,e,f.toString()))}}function cm(a,b,c,d){if(!b.L){var e=(b.da?b.da.b:a.j).g(a.Y,!1);if(e=e._pseudos)if(e=e[c])c={},b.f=Yl(a,b.f,e,c),b=c.content,Ci(b)&&(b.T(new Bi(d,a.d)),delete c.content),dm(a,d,c)}}
function km(a,b,c){var d=L("peelOff"),e=b.d,f=b.ca,g=b.L;if(0<c)b.A.textContent=b.A.textContent.substr(0,c),f+=c;else if(!g&&b.A&&0==f){var k=b.A.parentNode;k&&k.removeChild(b.A)}for(var h=b.ga+c,l=[];b.d===e;)l.push(b),b=b.parent;var m=l.pop(),p=m.qa;rf(function(){for(;0<l.length;){m=l.pop();b=new ji(m.Y,b,h);0==l.length&&(b.ca=f,b.L=g);b.Na=m.Na;b.da=m.da;b.wa=m.wa;b.qa=m.qa?m.qa:p;p=null;var c=fm(a,b,!1);if(c.Aa())return c}return M(!1)}).then(function(){O(d,b)});return N(d)}
Ul.prototype.createElement=function(a,b){return"http://www.w3.org/1999/xhtml"==a?this.l.createElement(b):this.l.createElementNS(a,b)};function lm(a,b,c){var d={},e=a.k._pseudos;b=Yl(a,b,a.k,d);if(e&&e.before){var f={},g=a.createElement("http://www.w3.org/1999/xhtml","span");g.setAttribute("data-adapt-pseudo","before");c.appendChild(g);Yl(a,b,e.before,f);delete f.content;dm(a,g,f)}delete d.content;dm(a,c,d);return b}
function Ii(a,b,c){return b.ca===c.ca&&b.L==c.L&&b.ka.length===c.ka.length&&b.ka.every(function(a,b){var f;f=c.ka[b];if(a.da)if(f.da){var g=1===a.ha.nodeType?a.ha:a.ha.parentElement,k=1===f.ha.nodeType?f.ha:f.ha.parentElement;f=a.da.aa===f.da.aa&&Sl(g)===Sl(k)}else f=!1;else f=a.ha===f.ha;return f}.bind(a))}function mm(a){this.b=a}function nm(a){return a.getClientRects()}
function om(a,b,c,d,e){this.f=a;this.fontSize=b;this.b=a.document;this.root=c||this.b.body;b=this.root.firstElementChild;b||(b=this.b.createElement("div"),b.setAttribute("data-vivliostyle-outer-zoom-box",!0),this.root.appendChild(b));c=b.firstElementChild;c||(c=this.b.createElement("div"),c.setAttribute("data-vivliostyle-spread-container",!0),b.appendChild(c));this.e=b;this.d=c;b=(new mm(a)).b.getComputedStyle(this.root,null);this.width=d||parseFloat(b.width)||a.innerWidth;this.height=e||parseFloat(b.height)||
a.innerHeight}om.prototype.zoom=function(a,b,c){w(this.e,"width",a*c+"px");w(this.e,"height",b*c+"px");w(this.d,"width",a+"px");w(this.d,"height",b+"px");w(this.d,"transform","scale("+c+")")};Ni("SIMPLE_PROPERTY",function(a){var b=a.name,c=a.value;switch(b){case "page-break-before":case "page-break-after":case "page-break-inside":return{name:b.replace(/^page-/,""),value:c===Ad?ae:c,important:a.important};default:return a}});var pm={page:!0,left:!0,right:!0,recto:!0,verso:!0,column:!0,region:!0},qm={avoid:!0,"avoid-page":!0,"avoid-column":!0,"avoid-region":!0};
function rm(a,b){if(a)if(b){var c=!!pm[a],d=!!pm[b];if(c&&d)switch(b){case "column":return a;case "region":return"column"===a?b:a;default:return b}else return d?b:c?a:qm[b]?b:qm[a]?a:b}else return a;else return b};var sm={img:!0,svg:!0,audio:!0,video:!0};
function tm(a,b,c){var d=a.A;if(!d)return NaN;if(1==d.nodeType){if(a.L){var e=d.getBoundingClientRect();if(e.right>=e.left&&e.bottom>=e.top)return c?e.left:e.bottom}return NaN}var e=NaN,f=d.ownerDocument.createRange(),g=d.textContent.length;if(!g)return NaN;a.L&&(b+=g);b>=g&&(b=g-1);f.setStart(d,b);f.setEnd(d,b+1);a=nm(f);if(b=c){b=document.body;if(null==ib){var k=b.ownerDocument,f=k.createElement("div");f.style.position="absolute";f.style.top="0px";f.style.left="0px";f.style.width="100px";f.style.height=
"100px";f.style.overflow="hidden";f.style.lineHeight="16px";f.style.fontSize="16px";w(f,"writing-mode","vertical-rl");b.appendChild(f);g=k.createTextNode("a a a a a a a a a a a a a a a a");f.appendChild(g);k=k.createRange();k.setStart(g,0);k.setEnd(g,1);ib=50>k.getBoundingClientRect().left;b.removeChild(f)}b=ib}if(b){b=d.ownerDocument.createRange();b.setStart(d,0);b.setEnd(d,d.textContent.length);d=nm(b);b=[];for(f=0;f<a.length;f++){g=a[f];for(k=0;k<d.length;k++){var h=d[k];if(g.top>=h.top&&g.bottom<=
h.bottom&&1>Math.abs(g.right-h.right)){b.push({top:g.top,left:h.left,bottom:h.bottom,right:h.right});break}}k==d.length&&(v.b("Could not fix character box"),b.push(g))}a=b}for(b=d=0;b<a.length;b++)f=a[b],g=c?f.bottom-f.top:f.right-f.left,f.right>f.left&&f.bottom>f.top&&(isNaN(e)||g>d)&&(e=c?f.left:f.bottom,d=g);return e}function um(a,b){this.e=a;this.f=b}um.prototype.d=function(a,b){return b<this.f?null:vm(a,this,0<b)};um.prototype.b=function(){return this.f};
function wm(a,b,c,d){this.position=a;this.f=b;this.g=c;this.e=d}wm.prototype.d=function(a,b){var c;b<this.b()?c=null:(a.e=this.e,c=this.position);return c};wm.prototype.b=function(){return(qm[this.f]?1:0)+(this.g?3:0)+(this.position.parent?this.position.parent.h:0)};function xm(a,b,c){this.ga=a;this.d=b;this.b=c}
function ym(a){for(var b=1;b<a.length;b++){var c=a[b-1],d=a[b];c===d?v.b("validateCheckPoints: duplicate entry"):c.ga>=d.ga?v.b("validateCheckPoints: incorrect boxOffset"):c.Y==d.Y&&(d.L?c.L&&v.b("validateCheckPoints: duplicate after points"):c.L?v.b("validateCheckPoints: inconsistent after point"):d.ga-c.ga!=d.ca-c.ca&&v.b("validateCheckPoints: boxOffset inconsistent with offsetInNode"))}}
function zm(a,b,c){ti.call(this,a);this.$c=a.lastChild;this.g=b;this.wc=c;this.Gd=a.ownerDocument;this.xc=!1;this.oa=this.$a=this.Fa=this.pd=this.La=0;this.eb=this.vb=this.l=this.h=null;this.ad=!1;this.u=this.f=this.B=null;this.qd=!0;this.zc=this.yc=0}u(zm,ti);zm.prototype.clone=function(){var a=new zm(this.d,this.g,this.wc);yi(a,this);a.$c=this.$c;a.xc=this.xc;a.l=this.l?this.l.clone():null;a.vb=this.vb.concat();return a};
function Am(a,b){var c=(a.b?a.$a:a.La)-a.h.X,d=(a.b?a.La:a.Fa)-a.h.V;return new te(b.X-c,b.V-d,b.U-c,b.P-d)}function Bm(a,b){return a.b?b<a.oa:b>a.oa}function Cm(a,b,c){var d=new ji(b.ha,c,0);d.Na=b.Na;d.da=b.da;d.wa=b.wa;d.qa=b.qa?Cm(a,b.qa,mi(c)):null;return d}
function Dm(a,b){var c=L("openAllViews"),d=b.ka;Xl(a.g,a.d,a.xc);var e=d.length-1,f=null;rf(function(){for(;0<=e;){f=Cm(a,d[e],f);if(0==e&&(f.ca=b.ca,f.L=b.L,f.L))break;var c=fm(a.g,f,0==e&&0==f.ca);e--;if(c.Aa())return c}return M(!1)}).then(function(){O(c,f)});return N(c)}var Em=/^[^A-Za-z0-9_\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]*([A-Za-z0-9_\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527][^A-Za-z0-9_\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]*)?/;
function Fm(a,b){if(b.d&&b.b&&!b.L&&0==b.d.count&&1!=b.A.nodeType){var c=b.A.textContent.match(Em);return km(a.g,b,c[0].length)}return M(b)}function Gm(a,b,c){var d=L("buildViewToNextBlockEdge");sf(function(d){b.A&&c.push(mi(b));Fm(a,b).then(function(f){f!==b&&(b=f,c.push(mi(b)));im(a.g,b).then(function(c){(b=c)?b.j&&!a.b?Hm(a,b).then(function(c){b=c;!b||b.e||0<a.g.f.b.length?P(d):uf(d)}):b.b?uf(d):P(d):P(d)})})}).then(function(){O(d,b)});return N(d)}
function Im(a,b){if(!b.A)return M(b);var c=b.Y,d=L("buildDeepElementView");sf(function(d){Fm(a,b).then(function(f){if(f!==b){for(var g=f;g&&g.Y!=c;)g=g.parent;if(null==g){b=f;P(d);return}}im(a.g,f).then(function(a){(b=a)&&b.Y!=c?uf(d):P(d)})})}).then(function(){O(d,b)});return N(d)}function Jm(a,b,c,d,e){var f=a.Gd.createElement("div");a.b?(w(f,"height",d+"px"),w(f,"width",e+"px")):(w(f,"width",d+"px"),w(f,"height",e+"px"));w(f,"float",c);w(f,"clear",c);a.d.insertBefore(f,b);return f}
function Km(a){for(var b=a.d.firstChild;b;){var c=b.nextSibling;if(1==b.nodeType){var d=b.style.cssFloat;if("left"==d||"right"==d)a.d.removeChild(b);else break}b=c}}function Lm(a){for(var b=a.d.firstChild,c=a.eb,d=a.b?a.h.V:a.h.X,e=a.b?a.h.P:a.h.U,f=0;f<c.length;f++){var g=c[f],k=g.P-g.V;g.left=Jm(a,b,"left",g.X-d,k);g.right=Jm(a,b,"right",e-g.U,k)}}
function Mm(a,b,c,d,e){var f;if(b&&b.L&&!b.b&&(f=tm(b,0,a.b),!isNaN(f)))return f;b=c[d];for(e-=b.ga;;){f=tm(b,e,a.b);if(!isNaN(f))return f;if(0<e)e--;else{d--;if(0>d)return a.Fa;b=c[d];1!=b.A.nodeType&&(e=b.A.textContent.length)}}}function Nm(a){return"number"==typeof a?a:(a=a.match(/^(-?[0-9]*(\.[0-9]*)?)px$/))?parseFloat(a[0]):0}
function Om(a,b){var c=a.wc.b.getComputedStyle(b,null),d=new ve;c&&(d.left=Nm(c.marginLeft),d.top=Nm(c.marginTop),d.right=Nm(c.marginRight),d.bottom=Nm(c.marginBottom));return d}
function Pm(a,b,c){if(a=a.wc.b.getComputedStyle(b,null))c.marginLeft=Nm(a.marginLeft),c.Z=Nm(a.borderLeftWidth),c.j=Nm(a.paddingLeft),c.marginTop=Nm(a.marginTop),c.fa=Nm(a.borderTopWidth),c.k=Nm(a.paddingTop),c.marginRight=Nm(a.marginRight),c.Ja=Nm(a.borderRightWidth),c.H=Nm(a.paddingRight),c.marginBottom=Nm(a.marginBottom),c.xa=Nm(a.borderBottomWidth),c.w=Nm(a.paddingBottom)}function Qm(a,b,c){b=new xm(b,c,c);a.f?a.f.push(b):a.f=[b]}
function Rm(a,b,c,d){if(a.f&&a.f[a.f.length-1].b)return Qm(a,b,c),M(!0);d+=40*(a.b?-1:1);var e=a.l,f=!e;if(f){var g=a.d.ownerDocument.createElement("div");w(g,"position","absolute");var k=a.g.clone(),e=new zm(g,k,a.wc);a.l=e;e.b=lm(a.g,a.b,g);e.xc=!0;a.b?(e.left=0,w(e.d,"width","2em")):(e.top=a.$a,w(e.d,"height","2em"))}a.d.appendChild(e.d);Pm(a,e.d,e);g=(a.b?-1:1)*(d-a.Fa);a.b?e.height=a.h.P-a.h.V-ui(e)-vi(e):e.width=a.h.U-a.h.X-wi(e)-xi(e);d=(a.b?-1:1)*(a.$a-d)-(a.b?wi(e)-xi(e):ui(e)+vi(e));if(f&&
18>d)return a.d.removeChild(e.d),a.l=null,Qm(a,b,c),M(!0);if(!a.b&&e.top<g)return a.d.removeChild(e.d),Qm(a,b,c),M(!0);var h=L("layoutFootnoteInner");a.b?Ai(e,0,d):zi(e,g,d);e.C=a.C+a.left+wi(a);e.F=a.F+a.top+ui(a);e.N=a.N;var l=new pi(c);f?(Sm(e),f=M(!0)):0==e.N.length?(Tm(e),f=M(!0)):f=Um(e);f.then(function(){Vm(e,l).then(function(d){a.b?(a.oa=a.$a+(e.e+wi(e)+xi(e)),Ai(e,0,e.e)):(a.oa=a.$a-(e.e+ui(e)+vi(e)),zi(e,a.oa-a.Fa,e.e));var f;!a.b&&0<e.N.length?f=Um(e):f=M(d);f.then(function(d){d=new xm(b,
c,d?d.Sa:null);a.f?a.f.push(d):a.f=[d];O(h,!0)})})});return N(h)}
function Wm(a,b){var c=L("layoutFootnote"),d=b.A;d.setAttribute("style","");w(d,"display","inline-block");d.textContent="M";var e=d.getBoundingClientRect(),f=a.b?e.left:e.bottom;d.textContent="";cm(a.g,b,"footnote-call",d);d.textContent||d.parentNode.removeChild(d);d={ka:[{ha:b.Y,Na:0,da:b.da,wa:null,qa:null}],ca:0,L:!1};e=b.ga;b=b.modify();b.L=!0;Rm(a,e,d,f).then(function(){a.l&&a.l.d.parentNode&&a.d.removeChild(a.l.d);Bm(a,f)&&0!=a.B.length&&(b.e=!0);O(c,b)});return N(c)}
function Xm(a,b){var c=L("layoutFloat"),d=b.A,e=b.j,f=b.N,g=b.parent?b.parent.F:"ltr",k=a.g.f,h=b.A.parentNode;"page"===f?Gi(k,d,e):(w(d,"float","none"),w(d,"position","absolute"),w(d,"left","auto"),w(d,"right","auto"),w(d,"top","auto"));Im(a,b).then(function(l){var m=d.getBoundingClientRect(),p=Om(a,d),m=new te(m.left-p.left,m.top-p.top,m.right+p.right,m.bottom+p.bottom);if("page"===f)Hi(k,b,a.g)?(m=h.ownerDocument.createElement("span"),w(m,"width","0"),w(m,"height","0"),h.appendChild(m),l.A=m,O(c,
l)):Ji(k,b,Am(a,m)).then(function(){O(c,null)});else{e=Di(e,a.b,g);for(var p=a.La,q=a.pd,t=b.parent;t&&t.b;)t=t.parent;if(t){var r=t.A.ownerDocument.createElement("div");r.style.left="0px";r.style.top="0px";a.b?(r.style.bottom="0px",r.style.width="1px"):(r.style.right="0px",r.style.height="1px");t.A.appendChild(r);var y=r.getBoundingClientRect(),p=Math.max(a.b?y.top:y.left,p),q=Math.min(a.b?y.bottom:y.right,q);t.A.removeChild(r);t=a.b?m.P-m.V:m.U-m.X;"left"==e?q=Math.max(q,p+t):p=Math.min(p,q-t)}p=
new te(p,(a.b?-1:1)*a.Fa,q,(a.b?-1:1)*a.$a);q=m;a.b&&(q=Le(m));Qe(p,a.eb,q,e);a.b&&(m=new te(-q.P,q.X,-q.V,q.U));w(d,"left",m.X-(a.b?a.$a:a.La)+a.j+"px");w(d,"top",m.V-(a.b?a.La:a.Fa)+a.k+"px");m=a.b?m.X:m.P;Bm(a,m)&&0!=a.B.length?(b=b.modify(),b.e=!0,O(c,b)):(Km(a),p=a.b?Le(a.h):a.h,a.b?q=Le(Am(a,new te(-q.P,q.X,-q.V,q.U))):q=Am(a,q),Re(p,a.eb,q,e),Lm(a),"left"==e?a.yc=m:a.zc=m,Ym(a,m),O(c,l))}});return N(c)}
function Zm(a,b){for(var c=a.A,d="";c&&b&&!d&&(1!=c.nodeType||(d=c.style.textAlign,b));c=c.parentNode);if(!b||"justify"==d){var c=a.A,e=c.ownerDocument,d=e.createElement("span");d.style.visibility="hidden";d.textContent=" ########################";d.setAttribute("data-adapt-spec","1");var f=b&&(a.L||1!=c.nodeType)?c.nextSibling:c;if(c=c.parentNode)c.insertBefore(d,f),b||(e=e.createElement("div"),c.insertBefore(e,f),d.style.lineHeight="80px",e.style.marginTop="-80px",e.style.height="0px",e.setAttribute("data-adapt-spec",
"1"))}}function $m(a,b,c,d){var e=L("processLineStyling");ym(d);var f=d.concat([]);d.splice(0,d.length);var g=0,k=b.d;0==k.count&&(k=k.Qd);sf(function(d){if(k){var e=an(a,f),m=k.count-g;if(e.length<=m)P(d);else{var p=bn(a,f,e[m-1]);cn(a,p,!1,!1).then(function(){g+=m;km(a.g,p,0).then(function(e){b=e;Zm(b,!1);k=b.d;f=[];Gm(a,b,f).then(function(b){c=b;0<a.g.f.b.length?P(d):uf(d)})})})}}else P(d)}).then(function(){Array.prototype.push.apply(d,f);ym(d);O(e,c)});return N(e)}
function dn(a,b){for(var c=0,d=0,e=b.length-1;0<=e;e--){var f=b[e];if(!f.L||!f.A||1!=f.A.nodeType)break;f=Om(a,f.A);f=a.b?-f.left:f.bottom;0<f?c=Math.max(c,f):d=Math.min(d,f)}return c-d}
function en(a,b){var c=L("layoutBreakableBlock"),d=[];Gm(a,b,d).then(function(e){if(0<a.g.f.b.length)O(c,e);else{var f=d.length-1;if(0>f)O(c,e);else{var f=Mm(a,e,d,f,d[f].ga),g=Bm(a,f);null==e&&(f+=dn(a,d));Ym(a,f);var k;b.d?k=$m(a,b,e,d):k=M(e);k.then(function(b){0<d.length&&(a.B.push(new um(d,d[0].h)),g&&(2!=d.length&&0<a.B.length||d[0].Y!=d[1].Y||!sm[d[0].Y.localName])&&b&&(b=b.modify(),b.e=!0));O(c,b)})}}});return N(c)}
function bn(a,b,c){ym(b);for(var d=0,e=b[0].ga,f=d,g=b.length-1,k=b[g].ga,h;e<k;){h=e+Math.ceil((k-e)/2);for(var f=d,l=g;f<l;){var m=f+Math.ceil((l-f)/2);b[m].ga>h?l=m-1:f=m}l=Mm(a,null,b,f,h);if(a.b?l<c:l>c){for(k=h-1;b[f].ga==h;)f--;g=f}else Ym(a,l),e=h,d=f}a=b[f];b=a.A;1!=b.nodeType&&(a.L?a.ca=b.length:(e-=a.ga,c=b.data,173==c.charCodeAt(e)?(b.replaceData(e,c.length-e,"-"),e++):(d=c.charAt(e),e++,f=c.charAt(e),b.replaceData(e,c.length-e,Va(d)&&Va(f)?"-":"")),0<e&&(a=a.modify(),a.ca+=e,a.g=null)));
return a}
function an(a,b){for(var c=[],d=b[0].A,e=b[b.length-1].A,f=[],g=d.ownerDocument.createRange(),k=!1,h=null,l=!1,m=!0;m;){var p=!0;do{var q=null;d==e&&(m=!1);1!=d.nodeType?(l||(g.setStartBefore(d),l=!0),h=d):k?k=!1:d.getAttribute("data-adapt-spec")?p=!l:q=d.firstChild;q||(q=d.nextSibling,q||(k=!0,q=d.parentNode));d=q}while(p&&m);if(l){g.setEndAfter(h);l=nm(g);for(p=0;p<l.length;p++)f.push(l[p]);l=!1}}f.sort(a.b?gi:fi);h=d=k=g=e=0;for(m=a.b?-1:1;;){if(h<f.length&&(l=f[h],p=1,0<d&&(p=Math.max(a.b?l.right-
l.left:l.bottom-l.top,1),p=m*(a.b?l.right:l.top)<m*e?m*((a.b?l.left:l.bottom)-e)/p:m*(a.b?l.left:l.bottom)>m*g?m*(g-(a.b?l.right:l.top))/p:1),0==d||.6<=p||.2<=p&&(a.b?l.top:l.left)>=k-1)){k=a.b?l.bottom:l.right;a.b?(e=0==d?l.right:Math.max(e,l.right),g=0==d?l.left:Math.min(g,l.left)):(e=0==d?l.top:Math.min(e,l.top),g=0==d?l.bottom:Math.max(g,l.bottom));d++;h++;continue}0<d&&(c.push(g),d=0);if(h>=f.length)break}c.sort(Za);a.b&&c.reverse();return c}
function fn(a,b){if(!a.f)return M(!0);for(var c=!1,d=a.f.length-1;0<=d;--d){var e=a.f[d];if(e.ga<=b)break;a.f.pop();e.b!==e.d&&(c=!0)}if(!c)return M(!0);var f=L("clearFootnotes"),g=a.e+a.Fa,k=a.f;a.l=null;a.f=null;var h=0;rf(function(){for(;h<k.length;){var b=k[h++],b=Rm(a,b.ga,b.d,g);if(b.Aa())return b}return M(!1)}).then(function(){O(f,!0)});return N(f)}
function vm(a,b,c){var d=b.e,e;if(c)e=c=1;else{for(e=d[0];e.parent&&e.b;)e=e.parent;c=Math.max((e.l.widows||2)-0,1);e=Math.max((e.l.orphans||2)-0,1)}var f=an(a,d),g=a.oa,d=Ya(f.length,function(b){return a.b?f[b]<g:f[b]>g}),d=Math.min(f.length-c,d);if(d<e)return null;g=f[d-1];if(b=bn(a,b.e,g))a.e=(a.b?-1:1)*(g-a.Fa);return b}
function cn(a,b,c,d){var e=b;c=c||null!=b.A&&1==b.A.nodeType&&!b.L;do{var f=e.A.parentNode;if(!f)break;var g=f,k=e.A;if(g)for(var h=void 0;(h=g.lastChild)!=k;)g.removeChild(h);c&&(f.removeChild(e.A),c=!1);e=e.parent}while(e);d&&Zm(b,!0);return fn(a,b.ga)}
function gn(a,b,c){var d=L("findAcceptableBreak"),e=null,f=0,g=0;do for(var f=g,g=Number.MAX_VALUE,k=a.B.length-1;0<=k&&!e;--k){var e=a.B[k].d(a,f),h=a.B[k].b();h>f&&(g=Math.min(g,h))}while(g>f&&!e);var l=!1;if(!e){v.b("Could not find any page breaks?!!");if(a.qd)return hn(a,b).then(function(b){b?(b=b.modify(),b.e=!1,cn(a,b,l,!0).then(function(){O(d,b)})):O(d,b)}),N(d);e=c;l=!0}cn(a,e,l,!0).then(function(){O(d,e)});return N(d)}
function jn(a){a=a.toString();return""==a||"auto"==a||!!a.match(/^0+(.0*)?[^0-9]/)}function kn(a,b,c,d,e){if(!b)return!1;var f=tm(b,0,a.b),g=Bm(a,f);c&&(f+=dn(a,c));Ym(a,f);if(d||!g)b=new wm(mi(b),e,g,a.e),a.B.push(b);return g}
function ln(a,b){if(b.A.parentNode){var c=Om(a,b.A),d=b.A.ownerDocument.createElement("div");a.b?(d.style.bottom="0px",d.style.width="1px",d.style.marginRight=c.right+"px"):(d.style.right="0px",d.style.height="1px",d.style.marginTop=c.top+"px");b.A.parentNode.insertBefore(d,b.A);var e=d.getBoundingClientRect(),e=a.b?e.right:e.top,f=a.b?-1:1,g;switch(b.u){case "left":g=a.yc;break;case "right":g=a.zc;break;default:g=f*Math.max(a.zc*f,a.yc*f)}e*f>=g*f?b.A.parentNode.removeChild(d):(e=Math.max(1,(g-e)*
f),a.b?d.style.width=e+"px":d.style.height=e+"px",e=d.getBoundingClientRect(),e=a.b?e.left:e.bottom,a.b?(g=e+c.right-g,0<g==0<=c.right&&(g+=c.right),d.style.marginLeft=g+"px"):(g-=e+c.top,0<g==0<=c.top&&(g+=c.top),d.style.marginBottom=g+"px"))}}
function mn(a,b,c){function d(){b=l[0]||b;b.A.parentNode.removeChild(b.A);e.u=k}var e=a,f=L("skipEdges"),g=c&&b&&b.L,k=null,h=null,l=[],m=[],p=!1;sf(function(a){for(;b;){do if(b.A){if(b.b&&1!=b.A.nodeType){if(ci(b.A,b.w))break;if(!b.L){!c&&pm[k]?d():kn(e,h,null,!0,k)?(b=(h||b).modify(),b.e=!0):(b=b.modify(),b.g=k);P(a);return}}if(!b.L&&(b.u&&ln(e,b),b.j||b.B)){l.push(mi(b));k=rm(k,b.g);!c&&pm[k]?d():kn(e,h,null,!0,k)&&(b=(h||b).modify(),b.e=!0);P(a);return}if(1==b.A.nodeType){var f=b.A.style;if(b.L){if(p){if(!c&&
pm[k]){d();P(a);return}l=[];g=c=!1;k=null}p=!1;h=mi(b);m.push(h);k=rm(k,b.C);if(f&&(!jn(f.paddingBottom)||!jn(f.borderBottomWidth))){if(kn(e,h,null,!0,k)){b=(h||b).modify();b.e=!0;P(a);return}m=[h];h=null}}else{l.push(mi(b));k=rm(k,b.g);if(sm[b.A.localName]){!c&&pm[k]?d():kn(e,h,null,!0,k)&&(b=(h||b).modify(),b.e=!0);P(a);return}!f||jn(f.paddingTop)&&jn(f.borderTopWidth)||(g=!1,m=[]);p=!0}}}while(0);f=im(e.g,b,g);if(f.Aa()){f.then(function(c){b=c;uf(a)});return}b=f.dc()}kn(e,h,m,!1,k)&&h&&(b=h.modify(),
b.e=!0);P(a)}).then(function(){O(f,b)});return N(f)}
function hn(a,b){var c=b,d=L("skipEdges"),e=null,f=!1;sf(function(d){for(;b;){do if(b.A){if(b.b&&1!=b.A.nodeType){if(ci(b.A,b.w))break;if(!b.L){pm[e]&&(a.u=e);P(d);return}}if(!b.L&&(b.j||b.B)){e=rm(e,b.g);pm[e]&&(a.u=e);P(d);return}if(1==b.A.nodeType){var k=b.A.style;if(b.L){if(f){if(pm[e]){a.u=e;P(d);return}e=null}f=!1;e=rm(e,b.C)}else{e=rm(e,b.g);if(sm[b.A.localName]){pm[e]&&(a.u=e);P(d);return}if(k&&(!jn(k.paddingTop)||!jn(k.borderTopWidth))){P(d);return}}f=!0}}while(0);k=im(a.g,b);if(k.Aa()){k.then(function(a){b=
a;uf(d)});return}b=k.dc()}c=null;P(d)}).then(function(){O(d,c)});return N(d)}function Hm(a,b){return"footnote"==b.j?Wm(a,b):Xm(a,b)}function nn(a,b,c){var d=L("layoutNext");mn(a,b,c).then(function(c){b=c;if(!b||a.u||b.e)O(d,b);else if(b.j)Hm(a,b).ra(d);else{a:if(b.L)c=!0;else{switch(b.Y.namespaceURI){case "http://www.w3.org/2000/svg":c=!1;break a}c=!b.B}c?en(a,b).ra(d):Im(a,b).ra(d)}});return N(d)}
function Tm(a){var b=a.d.ownerDocument.createElement("div");b.style.position="absolute";b.style.top=a.k+"px";b.style.right=a.H+"px";b.style.bottom=a.w+"px";b.style.left=a.j+"px";a.d.appendChild(b);var c=b.getBoundingClientRect();a.d.removeChild(b);var b=a.C+a.left+wi(a),d=a.F+a.top+ui(a);a.h=new te(b,d,b+a.width,d+a.height);a.La=c?a.b?c.top:c.left:0;a.pd=c?a.b?c.bottom:c.right:0;a.Fa=c?a.b?c.right:c.top:0;a.$a=c?a.b?c.left:c.bottom:0;a.yc=a.Fa;a.zc=a.Fa;a.oa=a.$a;c=a.h;b=a.C+a.left+wi(a);d=a.F+a.top+
ui(a);b=a.$b?Be(a.$b,b,d):De(b,d,b+a.width,d+a.height);a.eb=Ne(c,[b],a.N,a.Ka,a.b);Lm(a);a.f=null}function Sm(a){a.vb=[];w(a.d,"width",a.width+"px");w(a.d,"height",a.height+"px");Tm(a);a.e=0;a.ad=!1;a.u=null}function Ym(a,b){a.e=Math.max((a.b?-1:1)*(b-a.Fa),a.e)}function on(a,b){var c=b.b;if(!c)return M(!0);var d=L("layoutOverflownFootnotes"),e=0;rf(function(){for(;e<c.length;){var b=c[e++],b=Rm(a,0,b,a.Fa);if(b.Aa())return b}return M(!1)}).then(function(){O(d,!0)});return N(d)}
function Vm(a,b){a.vb.push(b);if(a.ad)return M(b);var c=L("layout");on(a,b).then(function(){Dm(a,b.Sa).then(function(b){var e=b,f=!0;a.B=[];sf(function(c){for(;b;){var k=!0;nn(a,b,f).then(function(h){f=!1;b=h;0<a.g.f.b.length?P(c):a.u?P(c):b&&b.e?gn(a,b,e).then(function(a){b=a;P(c)}):k?k=!1:uf(c)});if(k){k=!1;return}}P(c)}).then(function(){var e=a.l;e&&(a.d.appendChild(e.d),a.b?a.e=this.Fa-this.$a:a.e=e.top+ui(e)+e.e+vi(e));if(b)if(0<a.g.f.b.length)O(c,null);else{a.ad=!0;e=new pi(oi(b));if(a.f){for(var f=
[],h=0;h<a.f.length;h++){var l=a.f[h].b;l&&f.push(l)}e.b=f.length?f:null}O(c,e)}else O(c,null)})})});return N(c)}function Um(a){for(var b=a.vb,c=a.d.lastChild;c!=a.$c;){var d=c.previousSibling;a.d===c.parentNode&&Sl(c)||a.d.removeChild(c);c=d}Km(a);Sm(a);var e=L("redoLayout"),f=0,g=null;sf(function(c){if(f<b.length){var d=b[f++];Vm(a,d).then(function(a){a?(g=a,P(c)):uf(c)})}else P(c)}).then(function(){O(e,g)});return N(e)};function pn(a,b){this.e(a,"end",b)}function qn(a,b){this.e(a,"start",b)}function rn(a,b,c){c||(c=this.g.now());var d=this.f[a];d||(d=this.f[a]=[]);var e;for(a=d.length-1;0<=a&&(!(e=d[a])||e[b]);a--)e=null;e||(e={},d.push(e));e[b]=c}function sn(){}function tn(a){this.g=a;this.f={};this.registerEndTiming=this.d=this.registerStartTiming=this.b=this.e=sn}
tn.prototype.h=function(){var a=this.f,b="";Object.keys(a).forEach(function(c){for(var d=a[c],e=d.length,f=0;f<e;f++){var g=d[f];b+=c;1<e&&(b+="("+f+")");b+=" => start: "+g.start+", end: "+g.end+", duration: "+(g.end-g.start)+"\n"}});v.e(b)};tn.prototype.j=function(){this.registerEndTiming=this.d=this.registerStartTiming=this.b=this.e=sn};tn.prototype.k=function(){this.e=rn;this.registerStartTiming=this.b=qn;this.registerEndTiming=this.d=pn};
var un={now:Date.now},vn,wn=vn=new tn(window&&window.performance||un);rn.call(wn,"load_vivliostyle","start",void 0);ba("vivliostyle.profile.profiler",wn);tn.prototype.printTimings=tn.prototype.h;tn.prototype.disable=tn.prototype.j;tn.prototype.enable=tn.prototype.k;function xn(a,b,c){function d(c){return a.b.getComputedStyle(b,null).getPropertyValue(c)}function e(){w(b,"display","block");w(b,"position","static");return d(W)}function f(){w(b,"display","inline-block");w(r,W,"99999999px");var a=d(W);w(r,W,"");return a}function g(){w(b,"display","inline-block");w(r,W,"0");var a=d(W);w(r,W,"");return a}function k(){var a=e(),b=g(),c=parseFloat(a);if(c<=parseFloat(b))return b;b=f();return c<=parseFloat(b)?a:b}function h(){throw Error("Getting fill-available block size is not implemented");
}var l=b.style.display,m=b.style.position,p=b.style.width,q=b.style.height,t=b.parentNode,r=b.ownerDocument.createElement("div");w(r,"position",m);t.insertBefore(r,b);r.appendChild(b);w(b,"width","auto");w(b,"height","auto");var y=d(Oa["writing-mode"])||d("writing-mode"),J="vertical-rl"===y||"tb-rl"===y||"vertical-lr"===y||"tb-lr"===y,W=J?"height":"width",la=J?"width":"height",X={};c.forEach(function(a){var c;switch(a){case "fill-available inline size":c=e();break;case "max-content inline size":c=
f();break;case "min-content inline size":c=g();break;case "fit-content inline size":c=k();break;case "fill-available block size":c=h();break;case "max-content block size":case "min-content block size":case "fit-content block size":c=d(la);break;case "fill-available width":c=J?h():e();break;case "fill-available height":c=J?e():h();break;case "max-content width":c=J?d(la):f();break;case "max-content height":c=J?f():d(la);break;case "min-content width":c=J?d(la):g();break;case "min-content height":c=
J?g():d(la);break;case "fit-content width":c=J?d(la):k();break;case "fit-content height":c=J?k():d(la)}X[a]=parseFloat(c);w(b,"position",m);w(b,"display",l)});w(b,"width",p);w(b,"height",q);t.insertBefore(b,r);t.removeChild(r);return X};function yn(a){var b=a["writing-mode"],b=b&&b.value;a=(a=a.direction)&&a.value;return b===je||b!==ke&&a!==fe?"ltr":"rtl"}
var zn={a5:{width:new I(148,"mm"),height:new I(210,"mm")},a4:{width:new I(210,"mm"),height:new I(297,"mm")},a3:{width:new I(297,"mm"),height:new I(420,"mm")},b5:{width:new I(176,"mm"),height:new I(250,"mm")},b4:{width:new I(250,"mm"),height:new I(353,"mm")},"jis-b5":{width:new I(182,"mm"),height:new I(257,"mm")},"jis-b4":{width:new I(257,"mm"),height:new I(364,"mm")},letter:{width:new I(8.5,"in"),height:new I(11,"in")},legal:{width:new I(8.5,"in"),height:new I(14,"in")},ledger:{width:new I(11,"in"),
height:new I(17,"in")}},An=new I(.24,"pt"),Bn=new I(3,"mm"),Cn=new I(10,"mm"),Dn=new I(13,"mm");
function En(a){var b={width:oe,height:pe,xb:qe,qb:qe},c=a.size;if(c&&c.value!==Bd){var d=c.value;d.Oc()?(c=d.values[0],d=d.values[1]):(c=d,d=null);if(c.Nb())b.width=c,b.height=d||c;else if(c=zn[c.name.toLowerCase()])d&&d===Td?(b.width=c.height,b.height=c.width):(b.width=c.width,b.height=c.height)}(c=a.marks)&&c.value!==Xd&&(b.qb=Dn);a=a.bleed;a&&a.value!==Bd?a.value&&a.value.Nb()&&(b.xb=a.value):c&&(a=!1,c.value.Oc()?a=c.value.values.some(function(a){return a===Hd}):a=c.value===Hd,a&&(b.xb=new I(6,
"pt")));return b}function Fn(a,b){var c={},d=a.xb.D*wc(b,a.xb.ea,!1),e=a.qb.D*wc(b,a.qb.ea,!1),f=d+e,g=a.width;c.jb=g===oe?(b.R.Va?Math.floor(b.xa/2)-b.R.Bb:b.xa)-2*f:g.D*wc(b,g.ea,!1);g=a.height;c.ib=g===pe?b.eb-2*f:g.D*wc(b,g.ea,!1);c.xb=d;c.qb=e;c.Fc=f;return c}function Gn(a,b,c){a=a.createElementNS("http://www.w3.org/2000/svg","svg");a.setAttribute("width",b);a.setAttribute("height",c);a.style.position="absolute";return a}
function Hn(a,b,c){a=a.createElementNS("http://www.w3.org/2000/svg",c||"polyline");a.setAttribute("stroke","black");a.setAttribute("stroke-width",b);a.setAttribute("fill","none");return a}var In={ie:"top left",je:"top right",$d:"bottom left",ae:"bottom right"};
function Jn(a,b,c,d,e,f){var g=d;g<=e+2*sc.mm&&(g=e+d/2);var k=Math.max(d,g),h=e+k+c/2,l=Gn(a,h,h),g=[[0,e+d],[d,e+d],[d,e+d-g]];d=g.map(function(a){return[a[1],a[0]]});if("top right"===b||"bottom right"===b)g=g.map(function(a){return[e+k-a[0],a[1]]}),d=d.map(function(a){return[e+k-a[0],a[1]]});if("bottom left"===b||"bottom right"===b)g=g.map(function(a){return[a[0],e+k-a[1]]}),d=d.map(function(a){return[a[0],e+k-a[1]]});h=Hn(a,c);h.setAttribute("points",g.map(function(a){return a.join(",")}).join(" "));
l.appendChild(h);a=Hn(a,c);a.setAttribute("points",d.map(function(a){return a.join(",")}).join(" "));l.appendChild(a);b.split(" ").forEach(function(a){l.style[a]=f+"px"});return l}var Kn={he:"top",Zd:"bottom",Ed:"left",Fd:"right"};
function Ln(a,b,c,d,e){var f=2*d,g;"top"===b||"bottom"===b?(g=f,f=d):g=d;var k=Gn(a,g,f),h=Hn(a,c);h.setAttribute("points","0,"+f/2+" "+g+","+f/2);k.appendChild(h);h=Hn(a,c);h.setAttribute("points",g/2+",0 "+g/2+","+f);k.appendChild(h);a=Hn(a,c,"circle");a.setAttribute("cx",g/2);a.setAttribute("cy",f/2);a.setAttribute("r",d/4);k.appendChild(a);var l;switch(b){case "top":l="bottom";break;case "bottom":l="top";break;case "left":l="right";break;case "right":l="left"}Object.keys(Kn).forEach(function(a){a=
Kn[a];a===b?k.style[a]=e+"px":a!==l&&(k.style[a]="0",k.style["margin-"+a]="auto")});return k}function Mn(a,b,c,d){var e=!1,f=!1;if(a=a.marks)a=a.value,a.Oc()?a.values.forEach(function(a){a===Hd?e=!0:a===Id&&(f=!0)}):a===Hd?e=!0:a===Id&&(f=!0);if(e||f){var g=c.M,k=g.ownerDocument,h=b.xb,l=xd(An,d),m=xd(Bn,d),p=xd(Cn,d);e&&Object.keys(In).forEach(function(a){a=Jn(k,In[a],l,p,h,m);g.appendChild(a)});f&&Object.keys(Kn).forEach(function(a){a=Ln(k,Kn[a],l,p,m);g.appendChild(a)})}}
var Nn=function(){var a={width:!0,height:!0,"block-size":!0,"inline-size":!0,margin:!0,padding:!0,border:!0,outline:!0,"outline-width":!0,"outline-style":!0,"outline-color":!0};"left right top bottom before after start end block-start block-end inline-start inline-end".split(" ").forEach(function(b){a["margin-"+b]=!0;a["padding-"+b]=!0;a["border-"+b+"-width"]=!0;a["border-"+b+"-style"]=!0;a["border-"+b+"-color"]=!0});return a}(),On={"top-left-corner":{O:1,va:!0,sa:!1,ta:!0,ua:!0,ja:null},"top-left":{O:2,
va:!0,sa:!1,ta:!1,ua:!1,ja:"start"},"top-center":{O:3,va:!0,sa:!1,ta:!1,ua:!1,ja:"center"},"top-right":{O:4,va:!0,sa:!1,ta:!1,ua:!1,ja:"end"},"top-right-corner":{O:5,va:!0,sa:!1,ta:!1,ua:!0,ja:null},"right-top":{O:6,va:!1,sa:!1,ta:!1,ua:!0,ja:"start"},"right-middle":{O:7,va:!1,sa:!1,ta:!1,ua:!0,ja:"center"},"right-bottom":{O:8,va:!1,sa:!1,ta:!1,ua:!0,ja:"end"},"bottom-right-corner":{O:9,va:!1,sa:!0,ta:!1,ua:!0,ja:null},"bottom-right":{O:10,va:!1,sa:!0,ta:!1,ua:!1,ja:"end"},"bottom-center":{O:11,va:!1,
sa:!0,ta:!1,ua:!1,ja:"center"},"bottom-left":{O:12,va:!1,sa:!0,ta:!1,ua:!1,ja:"start"},"bottom-left-corner":{O:13,va:!1,sa:!0,ta:!0,ua:!1,ja:null},"left-bottom":{O:14,va:!1,sa:!1,ta:!0,ua:!1,ja:"end"},"left-middle":{O:15,va:!1,sa:!1,ta:!0,ua:!1,ja:"center"},"left-top":{O:16,va:!1,sa:!1,ta:!0,ua:!1,ja:"start"}},Pn=Object.keys(On).sort(function(a,b){return On[a].O-On[b].O});
function Qn(a,b,c){Zk.call(this,a,null,"vivliostyle-page-rule-master",[],b,null,0);a=En(c);new Rn(this.d,this,c,a);this.l={};Sn(this,c);this.b.position=new T(be,0);this.b.width=new T(a.width,0);this.b.height=new T(a.height,0);for(var d in c)Nn[d]||"background-clip"===d||(this.b[d]=c[d])}u(Qn,Zk);function Sn(a,b){var c=b._marginBoxes;c&&Pn.forEach(function(d){c[d]&&(a.l[d]=new Tn(a.d,a,d,b))})}Qn.prototype.f=function(a){return new Un(a,this)};
function Rn(a,b,c,d){cl.call(this,a,null,null,[],b);this.u=d;this.b["z-index"]=new T(new td(0),0);this.b["flow-from"]=new T(H("body"),0);this.b.position=new T(yd,0);this.b.overflow=new T(le,0);for(var e in Nn)Nn.hasOwnProperty(e)&&(this.b[e]=c[e])}u(Rn,cl);Rn.prototype.f=function(a){return new Vn(a,this)};
function Tn(a,b,c,d){cl.call(this,a,null,null,[],b);this.k=c;a=d._marginBoxes[this.k];for(var e in d)if(b=d[e],c=a[e],Oi[e]||c&&c.value===Pd)this.b[e]=b;for(e in a)Object.prototype.hasOwnProperty.call(a,e)&&(b=a[e])&&b.value!==Pd&&(this.b[e]=b)}u(Tn,cl);Tn.prototype.f=function(a){return new Wn(a,this)};function Un(a,b){$k.call(this,a,b);this.j=null;this.pa={}}u(Un,$k);
Un.prototype.h=function(a,b){var c=this.C,d;for(d in b)if(Object.prototype.hasOwnProperty.call(b,d))switch(d){case "writing-mode":case "direction":c[d]=b[d]}$k.prototype.h.call(this,a,b)};Un.prototype.Lc=function(){var a=this.style;a.left=qe;a["margin-left"]=qe;a["border-left-width"]=qe;a["padding-left"]=qe;a["padding-right"]=qe;a["border-right-width"]=qe;a["margin-right"]=qe;a.right=qe};
Un.prototype.Mc=function(){var a=this.style;a.top=qe;a["margin-top"]=qe;a["border-top-width"]=qe;a["padding-top"]=qe;a["padding-bottom"]=qe;a["border-bottom-width"]=qe;a["margin-bottom"]=qe;a.bottom=qe};Un.prototype.Z=function(a,b,c){b=b.u;var d={start:this.j.marginLeft,end:this.j.marginRight,$:this.j.zb},e={start:this.j.marginTop,end:this.j.marginBottom,$:this.j.yb};Xn(this,b.top,!0,d,a,c);Xn(this,b.bottom,!0,d,a,c);Xn(this,b.left,!1,e,a,c);Xn(this,b.right,!1,e,a,c)};
function Yn(a,b,c,d,e){this.M=a;this.l=e;this.g=c;this.k=!V(d,b[c?"width":"height"],new Xc(d,0,"px"));this.h=null}Yn.prototype.b=function(){return this.k};function Zn(a){a.h||(a.h=xn(a.l,a.M.d,a.g?["max-content width","min-content width"]:["max-content height","min-content height"]));return a.h}Yn.prototype.e=function(){var a=Zn(this);return this.g?wi(this.M)+a["max-content width"]+xi(this.M):ui(this.M)+a["max-content height"]+vi(this.M)};
Yn.prototype.f=function(){var a=Zn(this);return this.g?wi(this.M)+a["min-content width"]+xi(this.M):ui(this.M)+a["min-content height"]+vi(this.M)};Yn.prototype.d=function(){return this.g?wi(this.M)+this.M.width+xi(this.M):ui(this.M)+this.M.height+vi(this.M)};function $n(a){this.g=a}$n.prototype.b=function(){return this.g.some(function(a){return a.b()})};$n.prototype.e=function(){var a=this.g.map(function(a){return a.e()});return Math.max.apply(null,a)*a.length};
$n.prototype.f=function(){var a=this.g.map(function(a){return a.f()});return Math.max.apply(null,a)*a.length};$n.prototype.d=function(){var a=this.g.map(function(a){return a.d()});return Math.max.apply(null,a)*a.length};function ao(a,b,c,d,e,f){Yn.call(this,a,b,c,d,e);this.j=f}u(ao,Yn);ao.prototype.b=function(){return!1};ao.prototype.e=function(){return this.d()};ao.prototype.f=function(){return this.d()};ao.prototype.d=function(){return this.g?wi(this.M)+this.j+xi(this.M):ui(this.M)+this.j+vi(this.M)};
function Xn(a,b,c,d,e,f){var g=a.d.d,k={},h={},l={},m;for(m in b){var p=On[m];if(p){var q=b[m],t=a.pa[m],r=new Yn(q,t.style,c,g,f);k[p.ja]=q;h[p.ja]=t;l[p.ja]=r}}a=d.start.evaluate(e);d.end.evaluate(e);b=d.$.evaluate(e);var y=bo(l,b),J=!1,W={};Object.keys(k).forEach(function(a){var b=V(g,h[a].style[c?"max-width":"max-height"],d.$);b&&(b=b.evaluate(e),y[a]>b&&(b=l[a]=new ao(k[a],h[a].style,c,g,f,b),W[a]=b.d(),J=!0))});J&&(y=bo(l,b),J=!1,["start","center","end"].forEach(function(a){y[a]=W[a]||y[a]}));
var la={};Object.keys(k).forEach(function(a){var b=V(g,h[a].style[c?"min-width":"min-height"],d.$);b&&(b=b.evaluate(e),y[a]<b&&(b=l[a]=new ao(k[a],h[a].style,c,g,f,b),la[a]=b.d(),J=!0))});J&&(y=bo(l,b),["start","center","end"].forEach(function(a){y[a]=la[a]||y[a]}));var X=a+b,F=a+(a+b);["start","center","end"].forEach(function(a){var b=y[a];if(b){var d=k[a],e=0;switch(a){case "start":e=c?d.left:d.top;break;case "center":e=(F-b)/2;break;case "end":e=X-b}c?Ai(d,e,b-wi(d)-xi(d)):zi(d,e,b-ui(d)-vi(d))}})}
function bo(a,b){var c=a.start,d=a.center,e=a.end,f={};if(d){var g=[c,e].filter(function(a){return a}),g=co(d,g.length?new $n(g):null,b);g.Pa&&(f.center=g.Pa);d=g.Pa||d.d();d=(b-d)/2;c&&c.b()&&(f.start=d);e&&e.b()&&(f.end=d)}else c=co(c,e,b),c.Pa&&(f.start=c.Pa),c.Zb&&(f.end=c.Zb);return f}
function co(a,b,c){var d={Pa:null,Zb:null};if(a&&b)if(a.b()&&b.b()){var e=a.e(),f=b.e();0<e&&0<f?(f=e+f,f<c?d.Pa=c*e/f:(a=a.f(),b=b.f(),b=a+b,b<c?d.Pa=a+(c-b)*(e-a)/(f-b):0<b&&(d.Pa=c*a/b)),0<d.Pa&&(d.Zb=c-d.Pa)):0<e?d.Pa=c:0<f&&(d.Zb=c)}else a.b()?d.Pa=Math.max(c-b.d(),0):b.b()&&(d.Zb=Math.max(c-a.d(),0));else a?a.b()&&(d.Pa=c):b&&b.b()&&(d.Zb=c);return d}Un.prototype.kb=function(a,b,c,d){Un.Cd.kb.call(this,a,b,c,d);b.d.setAttribute("data-vivliostyle-page-box",!0)};
function Vn(a,b){dl.call(this,a,b);this.marginLeft=this.marginBottom=this.marginRight=this.marginTop=this.yb=this.zb=null}u(Vn,dl);
Vn.prototype.h=function(a,b){var c=this.C,d;for(d in b)Object.prototype.hasOwnProperty.call(b,d)&&(d.match(/^column.*$/)||d.match(/^background-/))&&(c[d]=b[d]);dl.prototype.h.call(this,a,b);d=this.e;c={zb:this.zb,yb:this.yb,marginTop:this.marginTop,marginRight:this.marginRight,marginBottom:this.marginBottom,marginLeft:this.marginLeft};d.j=c;d=d.style;d.width=new K(c.zb);d.height=new K(c.yb);d["padding-left"]=new K(c.marginLeft);d["padding-right"]=new K(c.marginRight);d["padding-top"]=new K(c.marginTop);
d["padding-bottom"]=new K(c.marginBottom)};Vn.prototype.Lc=function(){var a=eo(this,{start:"left",end:"right",$:"width"});this.zb=a.sd;this.marginLeft=a.Ad;this.marginRight=a.zd};Vn.prototype.Mc=function(){var a=eo(this,{start:"top",end:"bottom",$:"height"});this.yb=a.sd;this.marginTop=a.Ad;this.marginBottom=a.zd};
function eo(a,b){var c=a.style,d=a.d.d,e=b.start,f=b.end,g=b.$,k=a.d.u[g].ia(d,null),h=V(d,c[g],k),l=V(d,c["margin-"+e],k),m=V(d,c["margin-"+f],k),p=el(d,c["padding-"+e],k),q=el(d,c["padding-"+f],k),t=gl(d,c["border-"+e+"-width"],c["border-"+e+"-style"],k),r=gl(d,c["border-"+f+"-width"],c["border-"+f+"-style"],k),y=E(d,k,D(d,D(d,t,p),D(d,r,q)));h?(y=E(d,y,h),l||m?l?m=E(d,y,l):l=E(d,y,m):m=l=ed(d,y,new nc(d,.5))):(l||(l=d.b),m||(m=d.b),h=E(d,y,D(d,l,m)));c[e]=new K(l);c[f]=new K(m);c["margin-"+e]=
qe;c["margin-"+f]=qe;c["padding-"+e]=new K(p);c["padding-"+f]=new K(q);c["border-"+e+"-width"]=new K(t);c["border-"+f+"-width"]=new K(r);c[g]=new K(h);c["max-"+g]=new K(h);return{sd:E(d,k,D(d,l,m)),Ad:l,zd:m}}Vn.prototype.kb=function(a,b,c,d){dl.prototype.kb.call(this,a,b,c,d);c.w=b.d};function Wn(a,b){dl.call(this,a,b);var c=b.k;this.j=On[c];a.pa[c]=this;this.xa=!0}u(Wn,dl);n=Wn.prototype;
n.kb=function(a,b,c,d){var e=b.d;w(e,"display","flex");var f=pl(this,a,"vertical-align"),g=null;f===H("middle")?g="center":f===H("top")?g="flex-start":f===H("bottom")&&(g="flex-end");g&&(w(e,"flex-flow",this.b?"row":"column"),w(e,"justify-content",g));dl.prototype.kb.call(this,a,b,c,d)};
n.ja=function(a,b){var c=this.style,d=this.d.d,e=a.start,f=a.end,g="left"===e,k=g?b.zb:b.yb,h=V(d,c[a.$],k),g=g?b.marginLeft:b.marginTop;if("start"===this.j.ja)c[e]=new K(g);else if(h){var l=el(d,c["margin-"+e],k),m=el(d,c["margin-"+f],k),p=el(d,c["padding-"+e],k),q=el(d,c["padding-"+f],k),t=gl(d,c["border-"+e+"-width"],c["border-"+e+"-style"],k),f=gl(d,c["border-"+f+"-width"],c["border-"+f+"-style"],k),h=D(d,h,D(d,D(d,p,q),D(d,D(d,t,f),D(d,l,m))));switch(this.j.ja){case "center":c[e]=new K(D(d,g,
fd(d,E(d,k,h),new nc(d,2))));break;case "end":c[e]=new K(E(d,D(d,g,k),h))}}};
function fo(a,b,c){function d(a){if(y)return y;y={$:r?r.evaluate(a):null,Ha:h?h.evaluate(a):null,Ia:l?l.evaluate(a):null};var b=k.evaluate(a),c=0;[q,m,p,t].forEach(function(b){b&&(c+=b.evaluate(a))});(null===y.Ha||null===y.Ia)&&c+y.$+y.Ha+y.Ia>b&&(null===y.Ha&&(y.Ha=0),null===y.Ia&&(y.oe=0));null!==y.$&&null!==y.Ha&&null!==y.Ia&&(y.Ia=null);null===y.$&&null!==y.Ha&&null!==y.Ia?y.$=b-c-y.Ha-y.Ia:null!==y.$&&null===y.Ha&&null!==y.Ia?y.Ha=b-c-y.$-y.Ia:null!==y.$&&null!==y.Ha&&null===y.Ia?y.Ia=b-c-y.$-
y.Ha:null===y.$?(y.Ha=y.Ia=0,y.$=b-c):y.Ha=y.Ia=(b-c-y.$)/2;return y}var e=a.style;a=a.d.d;var f=b.Nc,g=b.Rc;b=b.$;var k=c["margin"+g.charAt(0).toUpperCase()+g.substring(1)],h=fl(a,e["margin-"+f],k),l=fl(a,e["margin-"+g],k),m=el(a,e["padding-"+f],k),p=el(a,e["padding-"+g],k),q=gl(a,e["border-"+f+"-width"],e["border-"+f+"-style"],k),t=gl(a,e["border-"+g+"-width"],e["border-"+g+"-style"],k),r=V(a,e[b],k),y=null;e[b]=new K(new pc(a,function(){var a=d(this).$;return null===a?0:a},b));e["margin-"+f]=new K(new pc(a,
function(){var a=d(this).Ha;return null===a?0:a},"margin-"+f));e["margin-"+g]=new K(new pc(a,function(){var a=d(this).Ia;return null===a?0:a},"margin-"+g));"left"===f?e.left=new K(D(a,c.marginLeft,c.zb)):"top"===f&&(e.top=new K(D(a,c.marginTop,c.yb)))}n.Lc=function(){var a=this.e.j;this.j.ta?fo(this,{Nc:"right",Rc:"left",$:"width"},a):this.j.ua?fo(this,{Nc:"left",Rc:"right",$:"width"},a):this.ja({start:"left",end:"right",$:"width"},a)};
n.Mc=function(){var a=this.e.j;this.j.va?fo(this,{Nc:"bottom",Rc:"top",$:"height"},a):this.j.sa?fo(this,{Nc:"top",Rc:"bottom",$:"height"},a):this.ja({start:"top",end:"bottom",$:"height"},a)};n.gc=function(a,b,c,d,e,f,g){dl.prototype.gc.call(this,a,b,c,d,e,f,g);a=c.u;c=this.d.k;d=this.j;d.ta||d.ua?d.va||d.sa||(d.ta?a.left[c]=b:d.ua&&(a.right[c]=b)):d.va?a.top[c]=b:d.sa&&(a.bottom[c]=b)};
function go(a,b,c,d,e){this.b=a;this.h=b;this.f=c;this.d=d;this.e=e;this.g={};a=this.h;b=new Yc(a,"page-number");b=new Qc(a,new Wc(a,b,new nc(a,2)),a.b);c=new Gc(a,b);a.values["recto-page"]=c;a.values["verso-page"]=b;"ltr"===yn(this.e)?(a.values["left-page"]=b,b=new Gc(a,b),a.values["right-page"]=b):(c=new Gc(a,b),a.values["left-page"]=c,a.values["right-page"]=b)}function ho(a){var b={};dk(a.b,[],"",b);a.b.pop();return b}
function io(a,b){var c=[],d;for(d in b)if(Object.prototype.hasOwnProperty.call(b,d)){var e=b[d],f;f=e instanceof T?e.value+"":io(a,e);c.push(d+f+(e.Ea||""))}return c.sort().join("^")}function jo(a){this.b=null;this.f=a}u(jo,U);jo.prototype.apply=function(a){a.H===this.f&&this.b.apply(a)};jo.prototype.d=function(){return 3};jo.prototype.e=function(a){this.b&&nj(a.Pb,this.f,this.b);return!0};function ko(a){this.b=null;this.f=a}u(ko,U);
ko.prototype.apply=function(a){1===(new Yc(this.f,"page-number")).evaluate(a.d)&&this.b.apply(a)};ko.prototype.d=function(){return 2};function lo(a){this.b=null;this.f=a}u(lo,U);lo.prototype.apply=function(a){(new Yc(this.f,"left-page")).evaluate(a.d)&&this.b.apply(a)};lo.prototype.d=function(){return 1};function mo(a){this.b=null;this.f=a}u(mo,U);mo.prototype.apply=function(a){(new Yc(this.f,"right-page")).evaluate(a.d)&&this.b.apply(a)};mo.prototype.d=function(){return 1};
function no(a){this.b=null;this.f=a}u(no,U);no.prototype.apply=function(a){(new Yc(this.f,"recto-page")).evaluate(a.d)&&this.b.apply(a)};no.prototype.d=function(){return 1};function oo(a){this.b=null;this.f=a}u(oo,U);oo.prototype.apply=function(a){(new Yc(this.f,"verso-page")).evaluate(a.d)&&this.b.apply(a)};oo.prototype.d=function(){return 1};function po(a,b){lj.call(this,a,b,null,null)}u(po,lj);
po.prototype.apply=function(a){var b=a.d,c=a.w,d=this.style;a=this.S;fj(b,c,d,a,null,null);if(d=d._marginBoxes){var c=dj(c,"_marginBoxes"),e;for(e in d)if(d.hasOwnProperty(e)){var f=c[e];f||(f={},c[e]=f);fj(b,f,d[e],a,null,null)}}};function qo(a,b,c,d,e){lk.call(this,a,b,null,c,null,d,!1);this.H=e;this.w=[];this.e="";this.u=[]}u(qo,lk);n=qo.prototype;n.Db=function(){this.mb()};n.bb=function(a,b){if(this.e=b)this.b.push(new jo(b)),this.S+=65536};
n.Qb=function(a,b){b&&Mf(this,"E_INVALID_PAGE_SELECTOR :"+a+"("+b.join("")+")");this.u.push(":"+a);switch(a.toLowerCase()){case "first":this.b.push(new ko(this.d));this.S+=256;break;case "left":this.b.push(new lo(this.d));this.S+=1;break;case "right":this.b.push(new mo(this.d));this.S+=1;break;case "recto":this.b.push(new no(this.d));this.S+=1;break;case "verso":this.b.push(new oo(this.d));this.S+=1;break;default:Mf(this,"E_INVALID_PAGE_SELECTOR :"+a)}};
function ro(a){var b;a.e||a.u.length?b=[a.e].concat(a.u.sort()):b=null;a.w.push({ld:b,S:a.S});a.e="";a.u=[]}n.Ob=function(){ro(this);lk.prototype.Ob.call(this)};n.na=function(){ro(this);lk.prototype.na.call(this)};
n.Ya=function(a,b,c){if("bleed"!==a&&"marks"!==a||this.w.some(function(a){return null===a.ld})){lk.prototype.Ya.call(this,a,b,c);var d=this.h[a],e=this.H;if("bleed"===a||"marks"===a)e[""]||(e[""]={}),Object.keys(e).forEach(function(b){cj(e[b],a,d)});else if("size"===a){var f=e[""];this.w.forEach(function(b){var c=new T(d.value,d.Ea+b.S);b=b.ld?b.ld.join(""):"";var h=e[b];h?(c=(b=h[a])?$i(null,c,b):c,cj(h,a,c)):(h=e[b]={},cj(h,a,c),f&&["bleed","marks"].forEach(function(a){f[a]&&cj(h,a,f[a])},this))},
this)}}};n.wd=function(a){nj(this.g.Pb,"*",a)};n.yd=function(a){return new po(this.h,a)};n.Wc=function(a){var b=dj(this.h,"_marginBoxes"),c=b[a];c||(c={},b[a]=c);If(this.aa,new so(this.d,this.aa,this.l,c))};function so(a,b,c,d){Jf.call(this,a,b,!1);this.e=c;this.b=d}u(so,Kf);so.prototype.Xa=function(a,b,c){hh(this.e,a,b,c,this)};so.prototype.Mb=function(a,b){Lf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};so.prototype.uc=function(a,b){Lf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};
so.prototype.Ya=function(a,b,c){cj(this.b,a,new T(b,c?Ff(this):Gf(this)))};function to(a){this.d=a;this.b={};this.b.page=[0]}function uo(a,b){Object.keys(b.b).forEach(function(a){this.b[a]=Array.b(b.b[a])},a)}function Uj(a,b,c){return new pc(a.d,function(){var d=a.b[b];return c(d&&d.length?d[d.length-1]:null)},"page-counter-"+b)}function Wj(a,b,c){return new pc(a.d,function(){return c(a.b[b]||[])},"page-counters-"+b)}
function vo(a,b,c){var d,e=b["counter-reset"];e&&(e=e.evaluate(c))&&(d=tg(e,!0));if(d)for(var f in d){var e=a,g=f,k=d[f];e.b[g]?e.b[g].push(k):e.b[g]=[k]}var h;(b=b["counter-increment"])&&(c=b.evaluate(c))&&(h=tg(c,!1));h?"page"in h||(h.page=1):h={page:1};for(var l in h)a.b[l]||(c=a,b=l,c.b[b]?c.b[b].push(0):c.b[b]=[0]),c=a.b[l],c[c.length-1]+=h[l]};function wo(a,b,c,d,e,f,g,k,h,l){this.h=a;this.g=b;this.b=c;this.d=d;this.B=e;this.f=f;this.l=a.F;this.u=g;this.e=k;this.k=h;this.w=l;this.j=a.f;rc(this.b,function(a){return(a=this.b.b[a])?0<a.b.length&&a.b[0].b.b<=this.j:!1});qc(this.b,new pc(this.b,function(){return this.pa+this.b.d},"page-number"))}
function xo(a,b,c,d){if(a.k.length){var e=new uc(0,b,c,d);a=a.k;for(var f={},g=0;g<a.length;g++)fj(e,f,a[g],0,null,null);g=f.width;a=f.height;var f=f["text-zoom"],k=1;if(g&&a||f){var h=sc.em;(f?f.evaluate(e,"text-zoom"):null)===de&&(k=h/d,d=h,b*=k,c*=k);if(g&&a&&(g=xd(g.evaluate(e,"width"),e),e=xd(a.evaluate(e,"height"),e),0<g&&0<e))return{width:g,height:e,fontSize:d}}}return{width:b,height:c,fontSize:d}}
function yo(a,b,c,d,e,f,g,k,h){uc.call(this,0,d.width,d.height,d.fontSize);this.style=a;this.ba=b;this.lang=b.lang||c;this.viewport=d;this.e={body:!0};this.g=e;this.b=this.w=this.d=this.l=null;this.j=0;this.La=f;this.f=new ph(this.style.l);this.oa={};this.H=null;this.k=new to(a.b);this.F={};this.fa=null;this.Ja=g;this.Ka=k;this.pa=h;for(var l in a.e)(b=a.e[l]["flow-consume"])&&(b.evaluate(this,"flow-consume")==zd?this.e[l]=!0:delete this.e[l]);this.N={}}u(yo,uc);
function zo(a){var b=L("StyleInstance.init");a.d=new Dk(a.ba,a.style.d,a.style.g,a,a.e,a.style.j,a.k);Nk(a.d,a);a.w={};a.w[a.ba.url]=a.d;var c=Kk(a.d);a.fa=yn(c);a.l=new El(a.style.B);var d=new ak(a.style.d,a,a.k);a.l.h(d,c);Dl(a.l,a);a.H=new go(d,a.style.b,a.l,a,c);c=[];for(d=0;d<a.style.f.length;d++){var e=a.style.f[d];if(!e.I||e.I.evaluate(a))e=mh(e.sb,a),e=new nh(e),c.push(e)}vh(a.La,c,a.f).ra(b);var f=a.style.w;Object.keys(f).forEach(function(a){var b=Fn(En(f[a]),this);this.N[a]={width:b.jb+
2*b.Fc,height:b.ib+2*b.Fc}},a);return N(b)}function Pk(a,b){var c=a.b;if(c){var d=c.b[b.f];d||(d=new ri,c.b[b.f]=d);d.b.push(new qi(new pi({ka:[{ha:b.g,Na:0,da:null,wa:null,qa:null}],ca:0,L:!1}),b))}}
function Ao(a,b){if(!b)return 0;var c=Number.POSITIVE_INFINITY,d;for(d in a.e){var e=b.b[d];if((!e||0==e.b.length)&&a.b){var f=a.d;f.l=d;for(e=0;null!=f.l&&(e+=5E3,Lk(f,e,0)!=Number.POSITIVE_INFINITY););e=a.b.b[d];b!=a.b&&e&&(e=e.clone(),b.b[d]=e)}if(e){for(var f=a,g=Number.POSITIVE_INFINITY,k=0;k<e.b.length;k++){for(var h=e.b[k].d.Sa,l=h.ka[0].ha,m=h.ca,p=h.L,q=0;l.ownerDocument!=f.ba.b;)q++,l=h.ka[q].ha,p=!1,m=0;h=Bh(f.ba,l,m,p);h<g&&(g=h)}f=g;f<c&&(c=f)}}return c}
function Bo(a,b){var c=Ao(a,a.b);if(c==Number.POSITIVE_INFINITY)return null;for(var d=a.l.children,e,f=0;f<d.length;f++)if(e=d[f],"vivliostyle-page-rule-master"!==e.d.lb){var g=1,k=pl(e,a,"utilization");k&&k.hd()&&(g=k.D);var k=wc(a,"em",!1),h=a.jb()*a.ib();a.j=Lk(a.d,c,Math.ceil(g*h/(k*k)));g=a;k=g.b.d;h=void 0;for(h in g.b.b)for(var l=g.b.b[h],m=l.b.length-1;0<=m;m--){var p=l.b[m];0>p.b.e&&p.b.b<g.j&&(p.b.e=k)}vc(a,a.style.b);g=pl(e,a,"enabled");if(!g||g===me){d=a;v.debug("Location - page",d.b.d);
v.debug("  current:",c);v.debug("  lookup:",d.j);c=void 0;for(c in d.b.b)for(f=d.b.b[c],g=0;g<f.b.length;g++)v.debug("  Chunk",c+":",f.b[g].b.b);c=a.H;f=b;g=e.d;if(0===Object.keys(f).length)g.d.e=g;else{e=g;d=io(c,f);e=e.g+"^"+d;d=c.g[e];if(!d){if("background-host"===g.lb)d=c,f=(new Qn(d.h,d.f.d,f)).f(d.f),f.h(d.b,d.e),Dl(f,d.d),d=f;else{d=c;k=f;f=g.clone({lb:"vivliostyle-page-rule-master"});if(g=k.size)k=En(k),g=g.Ea,f.b.width=$i(d.d,f.b.width,new T(k.width,g)),f.b.height=$i(d.d,f.b.height,new T(k.height,
g));f=f.f(d.f);f.h(d.b,d.e);Dl(f,d.d);d=f}c.g[e]=d}e=d.d;e.d.e=e;e=d}return e}}throw Error("No enabled page masters");}
function Co(a,b,c){var d=a.b.b[c];if(!d)return M(!0);Sm(b);a.e[c]&&0<b.eb.length&&(b.qd=!1);var e=L("layoutColumn"),f=[],g=[];sf(function(c){for(;0<d.b.length-g.length;){for(var e=0;0<=g.indexOf(e);)e++;var l=d.b[e];if(l.b.b>a.j)break;for(var m=1;m<d.b.length;m++)if(!(0<=g.indexOf(m))){var p=d.b[m];if(p.b.b>a.j)break;ei(p.b,l.b)&&(l=p,e=m)}var q=l.b,t=!0;Vm(b,l.d).then(function(a){l.b.Sd&&(null===a||q.d)&&f.push(e);q.d?(g.push(e),P(c)):a?(l.d=a,P(c)):(g.push(e),t?t=!1:uf(c))});if(t){t=!1;return}}P(c)}).then(function(){d.b=
d.b.filter(function(a,b){return 0<=f.indexOf(b)||0>g.indexOf(b)});O(e,!0)});return N(e)}
function Do(a,b,c,d,e,f,g,k){var h=pl(c,a,"enabled");if(h&&h!==me)return M(!0);var l=L("layoutContainer"),m=pl(c,a,"wrap-flow")===Bd,p=c.b?c.g&&c.F:c.f&&c.H,h=pl(c,a,"flow-from"),q=a.viewport.b.createElement("div"),t=pl(c,a,"position");w(q,"position",t?t.name:"absolute");d.insertBefore(q,d.firstChild);var r=new ti(q);r.b=c.b;c.kb(a,r,b,a.f);r.C=e;r.F=f;e+=r.left+r.marginLeft+r.Z;f+=r.top+r.marginTop+r.fa;if(h&&h.xd())if(a.F[h.toString()])c.gc(a,r,b,null,1,a.g,a.f),h=M(!0);else{var y=L("layoutContainer.inner"),
J=h.toString(),W=Y(c,a,"column-count"),la=Y(c,a,"column-gap"),X=1<W?Y(c,a,"column-width"):r.width,h=ol(c,a),F=0,t=pl(c,a,"shape-inside"),sa=rg(t,0,0,r.width,r.height,a),Ok=new Ul(J,a,a.viewport,a.d,h,a.ba,a.f,a.style.u,a,b,a.Ja,a.Ka,k),yh=0,Z=null;sf(function(b){for(;yh<W;){var c=yh++;if(1<W){var d=a.viewport.b.createElement("div");w(d,"position","absolute");q.appendChild(d);Z=new zm(d,Ok,a.g);Z.b=r.b;Z.Ka=r.Ka;Z.bc=r.bc;r.b?(w(d,"margin-left",r.j+"px"),w(d,"margin-right",r.H+"px"),c=c*(X+la)+r.k,
Ai(Z,0,r.width),zi(Z,c,X)):(w(d,"margin-top",r.k+"px"),w(d,"margin-bottom",r.w+"px"),c=c*(X+la)+r.j,zi(Z,0,r.height),Ai(Z,c,X));Z.C=e+r.j;Z.F=f+r.k}else Z=new zm(q,Ok,a.g),yi(Z,r),r=Z;Z.N=p?[]:g;Z.$b=sa;if(0<=Z.width){var h=L("inner");Co(a,Z,J).then(function(){Z.u&&"column"!=Z.u&&(yh=W,"region"!=Z.u&&(a.F[J]=!0));O(h,!0)});c=N(h)}else c=M(!0);if(c.Aa()){c.then(function(){0<k.b.length?P(b):(F=Math.max(F,Z.e),uf(b))});return}0<k.b.length||(F=Math.max(F,Z.e))}P(b)}).then(function(){r.e=F;c.gc(a,r,b,
Z,W,a.g,a.f);O(y,!0)});h=N(y)}else{h=pl(c,a,"content");t=!1;if(h&&Ci(h)){var Qk=a.viewport.b.createElement("span");h.T(new Bi(Qk,a));q.appendChild(Qk);Cl(c,a,r,a.f)}else c.xa&&(d.removeChild(q),t=!0);t||c.gc(a,r,b,null,1,a.g,a.f);h=M(!0)}h.then(function(){if(!c.f||0<Math.floor(r.e)){if(!m){var h=r.C+r.left,p=r.F+r.top,t=wi(r)+r.width+xi(r),y=ui(r)+r.height+vi(r),F=pl(c,a,"shape-outside"),h=rg(F,h,p,t,y,a);hb(a.viewport.root)&&g.push(Be(h,0,-1.25*wc(a,"em",!1)));g.push(h)}}else if(0==c.children.length){d.removeChild(q);
O(l,!0);return}var J=c.children.length-1;rf(function(){for(;0<=J;){var d=c.children[J--],d=Do(a,b,d,q,e,f,g,k);if(d.Aa())return d}return M(!1)}).then(function(){O(l,!0)})});return N(l)}
function Eo(a,b,c){a.F={};c?(a.b=c.clone(),Gk(a.d,c.e)):(a.b=new si,Gk(a.d,-1));a.lang&&b.b.setAttribute("lang",a.lang);c=a.b;c.d++;vc(a,a.style.b);var d=ho(a.H),e=Bo(a,d);if(!e)return M(null);e.d.b.width.value===oe&&$h(b);e.d.b.height.value===pe&&ai(b);vo(a.k,d,a);var f=Fn(En(d),a);Fo(a,f,b);Mn(d,f,b,a);var d=pl(e,a,"writing-mode")||Od,f=pl(e,a,"direction")||Wd,g=new Fi(b.B.bind(b),d,f),k=c.clone(),h=[],l=L("layoutNextPage");sf(function(d){Do(a,b,e,b.b,0,0,h.concat(),g).then(function(){if(0<g.b.length){h=
h.concat(Ki(g));g.b.splice(0,g.b.length);c=a.b=k.clone();for(var e;e=b.b.lastChild;)b.b.removeChild(e);uf(d)}else P(d)})}).then(function(){e.Z(a,b,a.g);var d=new Yc(e.d.d,"left-page");b.g=d.evaluate(a)?"left":"right";var d=a.b.d,f;for(f in a.b.b)for(var g=a.b.b[f],h=g.b.length-1;0<=h;h--){var k=g.b[h];0<=k.b.e&&k.b.e+k.b.j-1<=d&&g.b.splice(h,1)}a.b=null;c.e=a.d.b;f=a.style.h.C[a.ba.url];d=b.M.getBoundingClientRect();b.d.width=d.width;b.d.height=d.height;g=b.h;for(d=0;d<g.length;d++)h=g[d],w(h.target,
h.name,h.value.toString());for(d=0;d<f.length;d++)if(g=f[d],k=b.j[g.Sb],h=b.j[g.Pd],k&&h&&(k=Yh(k,g.action)))for(var y=0;y<h.length;y++)h[y].addEventListener(g.event,k,!1);var J;a:{for(J in a.e)if((f=c.b[J])&&0<f.b.length){J=!1;break a}J=!0}J&&(c=null);O(l,c)});return N(l)}
function Fo(a,b,c){a.C=b.jb;a.B=b.ib;c.M.style.width=b.jb+2*b.Fc+"px";c.M.style.height=b.ib+2*b.Fc+"px";c.b.style.left=b.qb+"px";c.b.style.right=b.qb+"px";c.b.style.top=b.qb+"px";c.b.style.bottom=b.qb+"px";c.b.style.padding=b.xb+"px"}function Go(a,b,c,d){lk.call(this,a.g,a,b,c,d,a.f,!c);this.e=a;this.u=!1}u(Go,lk);n=Go.prototype;n.qc=function(){};n.oc=function(a,b,c){a=new Zk(this.e.j,a,b,c,this.e.w,this.I,Gf(this.aa));If(this.e,new Jl(a.d,this.e,a,this.l))};
n.tb=function(a){a=a.d;null!=this.I&&(a=dd(this.d,this.I,a));If(this.e,new Go(this.e,a,this,this.B))};n.lc=function(){If(this.e,new pk(this.d,this.aa))};n.nc=function(){var a={};this.e.k.push({sb:a,I:this.I});If(this.e,new qk(this.d,this.aa,null,a,this.e.f))};n.mc=function(a){var b=this.e.h[a];b||(b={},this.e.h[a]=b);If(this.e,new qk(this.d,this.aa,null,b,this.e.f))};n.sc=function(){var a={};this.e.B.push(a);If(this.e,new qk(this.d,this.aa,this.I,a,this.e.f))};
n.Tb=function(a){var b=this.e.l;if(a){var c=dj(b,"_pseudos"),b=c[a];b||(b={},c[a]=b)}If(this.e,new qk(this.d,this.aa,null,b,this.e.f))};n.rc=function(){this.u=!0;this.mb()};n.Db=function(){var a=new qo(this.e.j,this.e,this,this.l,this.e.u);If(this.e,a);a.Db()};n.na=function(){lk.prototype.na.call(this);if(this.u){this.u=!1;var a="R"+this.e.F++,b=H(a),c;this.I?c=new Zi(b,0,this.I):c=new T(b,0);ej(this.h,"region-id").push(c);this.gb();a=new Go(this.e,this.I,this,a);If(this.e,a);a.na()}};
function Ho(a){var b=a.getAttribute("content");if(!b)return"";a={};for(var c;null!=(c=b.match(/^,?\s*([-A-Za-z_.][-A-Za-z_0-9.]*)\s*=\s*([-+A-Za-z_0-9.]*)\s*/));)b=b.substr(c[0].length),a[c[1]]=c[2];b=a.width-0;a=a.height-0;return b&&a?"@-epubx-viewport{width:"+b+"px;height:"+a+"px;}":""}function Io(a){Hf.call(this);this.f=a;this.g=new mc(null);this.j=new mc(this.g);this.w=new Wk(this.g);this.C=new Go(this,null,null,null);this.F=0;this.k=[];this.l={};this.h={};this.B=[];this.u={};this.b=this.C}
u(Io,Hf);Io.prototype.error=function(a){v.b("CSS parser:",a)};function Jo(a,b){return Ko(b,a)}function Lo(a){yf.call(this,Jo,"document");this.F=a;this.B={};this.h={};this.b={};this.C={};this.f=null;this.j=[]}u(Lo,yf);function Mo(a){var b=ua("user-agent.xml",ta),c=L("OPSDocStore.init");zf(ih).then(function(d){a.f=d;zf(sk).then(function(){a.load(b).then(function(){O(c,!0)})})});return N(c)}function No(a,b){a.j.push({url:b.url,text:b.text,Wa:"User",za:null,media:null})}
function Ko(a,b){var c=L("OPSDocStore.load"),d=b.url;Jh(b,a).then(function(b){if(b){for(var f=[],g=b.b.getElementsByTagNameNS("http://www.idpf.org/2007/ops","trigger"),k=0;k<g.length;k++){var h=g[k],l=h.getAttributeNS("http://www.w3.org/2001/xml-events","observer"),m=h.getAttributeNS("http://www.w3.org/2001/xml-events","event"),p=h.getAttribute("action"),h=h.getAttribute("ref");l&&m&&p&&h&&f.push({Pd:l,event:m,action:p,Sb:h})}a.C[d]=f;var q=[],f=ua("user-agent-page.css",ta);q.push({url:f,text:null,
Wa:"UA",za:null,media:null});for(k=0;k<a.j.length;k++)q.push(a.j[k]);if(f=b.h)for(f=f.firstChild;f;f=f.nextSibling)if(1==f.nodeType)if(g=f,k=g.namespaceURI,l=g.localName,"http://www.w3.org/1999/xhtml"==k)if("style"==l)q.push({url:d,text:g.textContent,Wa:"Author",za:null,media:null});else if("link"==l){if(m=g.getAttribute("rel"),k=g.getAttribute("class"),l=g.getAttribute("media"),"stylesheet"==m||"alternate stylesheet"==m&&k)g=g.getAttribute("href"),g=ua(g,d),q.push({url:g,text:null,za:k,media:l,Wa:"Author"})}else"meta"==
l&&"viewport"==g.getAttribute("name")&&q.push({url:d,text:Ho(g),Wa:"Author",I:null,media:null});else"http://www.gribuser.ru/xml/fictionbook/2.0"==k?"stylesheet"==l&&"text/css"==g.getAttribute("type")&&q.push({url:d,text:g.textContent,Wa:"Author",za:null,media:null}):"http://example.com/sse"==k&&"property"===l&&(k=g.getElementsByTagName("name")[0])&&"stylesheet"===k.textContent&&(g=g.getElementsByTagName("value")[0])&&(g=ua(g.textContent,d),q.push({url:g,text:null,za:null,media:null,Wa:"Author"}));
for(var t="",k=0;k<q.length;k++)t+=q[k].url,t+="^",q[k].text&&(t+=q[k].text),t+="^";var r=a.B[t];r?(a.b[d]=r,O(c,b)):(f=a.h[t],f||(f=new Bf(function(){var b=L("fetchStylesheet"),c=0,d=new Io(a.f);rf(function(){if(c<q.length){var a=q[c++];d.Eb(a.Wa);return null!==a.text?jg(a.text,d,a.url,a.za,a.media).Xc(!0):ig(a.url,d,a.za,a.media)}return M(!1)}).then(function(){r=new wo(a,d.g,d.j,d.C.g,d.w,d.k,d.l,d.h,d.B,d.u);a.B[t]=r;delete a.h[t];O(b,r)});return N(b)},"FetchStylesheet "+d),a.h[t]=f,f.start()),
zf(f).then(function(f){a.b[d]=f;O(c,b)}))}else O(c,null)});return N(c)};function Oo(a,b,c,d,e,f,g,k){this.d=a;this.url=b;this.lang=c;this.e=d;this.g=e;this.R=ec(f);this.h=g;this.f=k;this.Da=this.b=null}function Po(a,b,c){if(0!=c--)for(b=b.firstChild;b;b=b.nextSibling)if(1==b.nodeType){var d=b;"auto"!=Pa(d,"height","auto")&&(w(d,"height","auto"),Po(a,d,c));"absolute"==Pa(d,"position","static")&&(w(d,"position","relative"),Po(a,d,c))}}
function Qo(a){var b=a.target,c="\u25b8"==b.textContent;b.textContent=c?"\u25be":"\u25b8";for(b=b.parentNode.firstChild;b;)if(1!=b.nodeType)b=b.nextSibling;else{var d=b;"toc-container"==d.getAttribute("data-adapt-class")?b=d.firstChild:("toc-node"==d.getAttribute("data-adapt-class")&&(d.style.height=c?"auto":"0px"),b=b.nextSibling)}a.stopPropagation()}
Oo.prototype.Pc=function(a){var b=this.h.Pc(a);return function(a,d,e){var f=e.behavior;if(!f||"toc-node"!=f.toString()&&"toc-container"!=f.toString())return b(a,d,e);a=d.getAttribute("data-adapt-class");"toc-node"==a&&(e=d.firstChild,"\u25b8"!=e.textContent&&(e.textContent="\u25b8",w(e,"cursor","pointer"),e.addEventListener("click",Qo,!1)));var g=d.ownerDocument.createElement("div");g.setAttribute("data-adapt-process-children","true");"toc-node"==f.toString()?(e=d.ownerDocument.createElement("div"),
e.textContent="\u25b9",w(e,"margin-left","-1em"),w(e,"display","inline-block"),w(e,"width","1em"),w(e,"text-align","left"),w(e,"cursor","default"),w(e,"font-family","Menlo,sans-serif"),g.appendChild(e),w(g,"overflow","hidden"),g.setAttribute("data-adapt-class","toc-node"),"toc-node"!=a&&"toc-container"!=a||w(g,"height","0px")):"toc-node"==a&&g.setAttribute("data-adapt-class","toc-container");return M(g)}};
Oo.prototype.kc=function(a,b,c,d,e){if(this.b)return M(this.b);var f=this,g=L("showTOC"),k=new Zh(a,a);this.b=k;this.d.load(this.url).then(function(d){var l=f.d.b[d.url],m=xo(l,c,1E5,e);b=new om(b.f,m.fontSize,b.root,m.width,m.height);var p=new yo(l,d,f.lang,b,f.e,f.g,f.Pc(d),f.f,0);f.Da=p;p.R=f.R;zo(p).then(function(){Eo(p,k,null).then(function(){Po(f,a,2);O(g,k)})})});return N(g)};
Oo.prototype.hc=function(){if(this.b){var a=this.b;this.Da=this.b=null;w(a.M,"visibility","none");var b=a.M.parentNode;b&&b.removeChild(a.M)}};Oo.prototype.jd=function(){return!!this.b};function Ro(){Lo.call(this,So(this));this.d=new yf(Jh,"document");this.u=new yf(Cf,"text");this.w={};this.N={};this.k={};this.l={}}u(Ro,Lo);function So(a){return function(b){return a.k[b]}}
function To(a,b,c){var d=L("loadEPUBDoc");"/"!==b.substring(b.length-1)&&(b+="/");c&&a.u.fc(b+"?r=list");a.d.fc(b+"META-INF/encryption.xml");var e=b+"META-INF/container.xml";a.d.load(e,!0,"Failed to fetch EPUB container.xml from "+e).then(function(f){if(f){f=Th(xh(xh(xh(new zh([f.b]),"container"),"rootfiles"),"rootfile"),"full-path");for(var g=0;g<f.length;g++){var k=f[g];if(k){Uo(a,b,k,c).ra(d);return}}O(d,null)}else v.error("Received an empty response for EPUB container.xml "+e+". This may be caused by the server not allowing cross origin requests.")});
return N(d)}function Uo(a,b,c,d){var e=b+c,f=a.w[e];if(f)return M(f);var g=L("loadOPF");a.d.load(e,void 0,void 0).then(function(c){c?a.d.load(b+"META-INF/encryption.xml",void 0,void 0).then(function(h){(d?a.u.load(b+"?r=list"):M(null)).then(function(d){f=new Vo(a,b);Wo(f,c,h,d,b+"?r=manifest").then(function(){a.w[e]=f;a.N[b]=f;O(g,f)})})}):v.error("Received an empty response for EPUB OPF "+e+". This may be caused by the server not allowing cross origin requests.")});return N(g)}
function Xo(a,b,c){var d=L("EPUBDocStore.load");b=ra(b);(a.l[b]=Ko(a,{status:200,url:b,contentType:c.contentType,responseText:null,responseXML:c,jc:null})).ra(d);return N(d)}
Ro.prototype.load=function(a){var b=ra(a);if(a=this.l[b])return a.Aa()?a:M(a.dc());var c=L("EPUBDocStore.load");a=Ro.Cd.load.call(this,b,!0,"Failed to fetch a source document from "+b);a.then(function(a){a?O(c,a):v.error("Received an empty response for "+b+". This may be caused by the server not allowing cross origin requests.")});return N(c)};function Yo(){this.id=null;this.src="";this.f=this.d=null;this.G=-1;this.h=0;this.j=null;this.b=this.e=0;this.g=ab}function Zo(a){return a.id}
function $o(a){var b=Ue(a);return function(a){var d=L("deobfuscator"),e,f;a.slice?(e=a.slice(0,1040),f=a.slice(1040,a.size)):(e=a.webkitSlice(0,1040),f=a.webkitSlice(1040,a.size-1040));xf(e).then(function(a){a=new DataView(a);for(var c=0;c<a.byteLength;c++){var e=a.getUint8(c),e=e^b[c%20];a.setUint8(c,e)}O(d,wf([a,f]))});return N(d)}}
var ap={dcterms:"http://purl.org/dc/terms/",marc:"http://id.loc.gov/vocabulary/",media:"http://www.idpf.org/epub/vocab/overlays/#",onix:"http://www.editeur.org/ONIX/book/codelists/current.html#",xsd:"http://www.w3.org/2001/XMLSchema#"},bp=ap.dcterms+"language",cp=ap.dcterms+"title";
function dp(a,b){var c={};return function(d,e){var f,g,k=d.r||c,h=e.r||c;if(a==cp&&(f="main"==k["http://idpf.org/epub/vocab/package/#title-type"],g="main"==h["http://idpf.org/epub/vocab/package/#title-type"],f!=g))return f?-1:1;f=parseInt(k["http://idpf.org/epub/vocab/package/#display-seq"],10);isNaN(f)&&(f=Number.MAX_VALUE);g=parseInt(h["http://idpf.org/epub/vocab/package/#display-seq"],10);isNaN(g)&&(g=Number.MAX_VALUE);return f!=g?f-g:a!=bp&&b&&(f=(k[bp]||k["http://idpf.org/epub/vocab/package/#alternate-script"])==
b,g=(h[bp]||h["http://idpf.org/epub/vocab/package/#alternate-script"])==b,f!=g)?f?-1:1:d.o-e.o}}
function ep(a,b){function c(a){for(var b in a){var d=a[b];d.sort(dp(b,l));for(var e=0;e<d.length;e++){var f=d[e].r;f&&c(f)}}}function d(a){return db(a,function(a){return cb(a,function(a){var b={v:a.value,o:a.O};a.pe&&(b.s=a.scheme);if(a.id||a.lang){var c=h[a.id];if(c||a.lang)a.lang&&(a={name:bp,value:a.lang,lang:null,id:null,Uc:a.id,scheme:null,O:a.O},c?c.push(a):c=[a]),c=bb(c,function(a){return a.name}),b.r=d(c)}return b})})}function e(a){if(a&&(a=a.match(/^\s*(([^:]*):)?(\S+)\s*$/))){var b=a[1]?
f[a[1]]:"http://idpf.org/epub/vocab/package/#";if(b)return b+a[3]}return null}var f;if(b){f={};for(var g in ap)f[g]=ap[g];for(;null!=(g=b.match(/(^\s*[A-Z_a-z\u007F-\uFFFF][-.A-Z_a-z0-9\u007F-\uFFFF]*):\s*(\S+)/));)b=b.substr(g[0].length),f[g[1]]=g[2]}else f=ap;var k=1;g=Rh(Sh(a),function(a){if("meta"==a.localName){var b=e(a.getAttribute("property"));if(b)return{name:b,value:a.textContent,id:a.getAttribute("id"),O:k++,Uc:a.getAttribute("refines"),lang:null,scheme:e(a.getAttribute("scheme"))}}else if("http://purl.org/dc/elements/1.1/"==
a.namespaceURI)return{name:ap.dcterms+a.localName,O:k++,lang:a.getAttribute("xml:lang"),value:a.textContent,id:a.getAttribute("id"),Uc:null,scheme:null};return null});var h=bb(g,function(a){return a.Uc});g=d(bb(g,function(a){return a.Uc?null:a.name}));var l=null;g[bp]&&(l=g[bp][0].v);c(g);return g}function fp(){var a=window.MathJax;return a?a.Hub:null}var gp={"appliaction/xhtml+xml":!0,"image/jpeg":!0,"image/png":!0,"image/svg+xml":!0,"image/gif":!0,"audio/mp3":!0};
function Vo(a,b){this.e=a;this.h=this.d=this.b=this.g=this.f=null;this.k=b;this.j=null;this.F={};this.lang=null;this.u=0;this.l={};this.H=this.C=this.N=null;this.w={};this.B=null;fp()&&(Pi["http://www.w3.org/1998/Math/MathML"]=!0)}function hp(a,b){return a.k?b.substr(0,a.k.length)==a.k?decodeURI(b.substr(a.k.length)):null:b}
function Wo(a,b,c,d,e){a.f=b;var f=xh(new zh([b.b]),"package"),g=Th(f,"unique-identifier")[0];g&&(g=Fh(b,b.url+"#"+g))&&(a.j=g.textContent.replace(/[ \n\r\t]/g,""));var k={};a.g=cb(Ph(xh(xh(f,"manifest"),"item")),function(c){var d=new Yo,e=b.url;d.id=c.getAttribute("id");d.src=ua(c.getAttribute("href"),e);d.d=c.getAttribute("media-type");if(e=c.getAttribute("properties")){for(var e=e.split(/\s+/),f={},g=0;g<e.length;g++)f[e[g]]=!0;d.g=f}(c=c.getAttribute("fallback"))&&!gp[d.d]&&(k[d.src]=c);!a.C&&
d.g.nav&&(a.C=d);!a.H&&d.g["cover-image"]&&(a.H=d);return d});a.d=$a(a.g,Zo);a.h=$a(a.g,function(b){return hp(a,b.src)});for(var h in k)for(g=h;;){g=a.d[k[g]];if(!g)break;if(gp[g.d]){a.w[h]=g.src;break}g=g.src}a.b=cb(Ph(xh(xh(f,"spine"),"itemref")),function(b,c){var d=b.getAttribute("idref");if(d=a.d[d])d.f=b,d.G=c;return d});if(h=Th(xh(f,"spine"),"toc")[0])a.N=a.d[h];if(h=Th(xh(f,"spine"),"page-progression-direction")[0]){a:switch(h){case "ltr":h="ltr";break a;case "rtl":h="rtl";break a;default:throw Error("unknown PageProgression: "+
h);}a.B=h}var g=c?Th(xh(xh(Oh(xh(xh(new zh([c.b]),"encryption"),"EncryptedData"),Nh()),"CipherData"),"CipherReference"),"URI"):[],l=Ph(xh(xh(f,"bindings"),"mediaType"));for(c=0;c<l.length;c++){var m=l[c].getAttribute("handler");(h=l[c].getAttribute("media-type"))&&m&&a.d[m]&&(a.F[h]=a.d[m].src)}a.l=ep(xh(f,"metadata"),Th(f,"prefix")[0]);a.l[bp]&&(a.lang=a.l[bp][0].v);if(!d){if(0<g.length&&a.j)for(d=$o(a.j),c=0;c<g.length;c++)a.e.k[a.k+g[c]]=d;return M(!0)}f=new Qa;l={};if(0<g.length&&a.j)for(h="1040:"+
Ve(a.j),c=0;c<g.length;c++)l[g[c]]=h;for(c=0;c<d.length;c++){var p=d[c];if(m=p.n){var q=decodeURI(m),g=a.h[q];h=null;g&&(g.j=0!=p.m,g.h=p.c,g.d&&(h=g.d.replace(/\s+/g,"")));g=l[q];if(h||g)f.append(m),f.append(" "),f.append(h||"application/octet-stream"),g&&(f.append(" "),f.append(g)),f.append("\n")}}ip(a);return vf(e,"","POST",f.toString(),"text/plain")}function ip(a){for(var b=0,c=0;c<a.b.length;c++){var d=a.b[c],e=Math.ceil(d.h/1024);d.e=b;d.b=e;b+=e}a.u=b}
function jp(a,b,c){a.d={};a.h={};a.g=[];a.b=a.g;var d=a.f=new wh(null,"",(new DOMParser).parseFromString("<spine></spine>","text/xml"));b.forEach(function(a,b){var c=new Yo;c.G=b;c.id="item"+(b+1);c.src=a;var k=d.b.createElement("itemref");k.setAttribute("idref",c.id);d.root.appendChild(k);c.f=k;this.d[c.id]=c;this.h[a]=c;this.g.push(c)},a);return c?Xo(a.e,b[0],c):M(null)}
function kp(a,b,c){var d=a.b[b],e=L("getCFI");a.e.load(d.src).then(function(a){var b=Dh(a,c),k=null;b&&(a=Bh(a,b,0,!1),k=new rb,ub(k,b,c-a),d.f&&ub(k,d.f,0),k=k.toString());O(e,k)});return N(e)}
function lp(a,b){return af("resolveFragment",function(c){if(b){var d=new rb;sb(d,b);var e;if(a.f){var f=tb(d,a.f.b);if(1!=f.ha.nodeType||f.L||!f.Sb){O(c,null);return}var g=f.ha,k=g.getAttribute("idref");if("itemref"!=g.localName||!k||!a.d[k]){O(c,null);return}e=a.d[k];d=f.Sb}else e=a.b[0];a.e.load(e.src).then(function(a){var b=tb(d,a.b);a=Bh(a,b.ha,b.offset,b.L);O(c,{G:e.G,ma:a,Q:-1})})}else O(c,null)},function(a,d){v.b(d,"Cannot resolve fragment:",b);O(a,null)})}
function mp(a,b){return af("resolveEPage",function(c){if(0>=b)O(c,{G:0,ma:0,Q:-1});else{var d=Ya(a.b.length,function(c){c=a.b[c];return c.e+c.b>b}),e=a.b[d];a.e.load(e.src).then(function(a){b-=e.e;b>e.b&&(b=e.b);var g=0;0<b&&(a=Ch(a),g=Math.round(a*b/e.b),g==a&&g--);O(c,{G:d,ma:g,Q:-1})})}},function(a,d){v.b(d,"Cannot resolve epage:",b);O(a,null)})}
function np(a,b){var c=a.b[b.G];if(0>=b.ma)return M(c.e);var d=L("getEPage");a.e.load(c.src).then(function(a){a=Ch(a);var f=Math.min(a,b.ma);O(d,c.e+f*c.b/a)});return N(d)}function op(a,b,c,d,e){this.b=a;this.viewport=b;this.f=c;this.g=e;this.Cb=[];this.ma=this.Q=this.G=0;this.R=ec(d);this.e=new mm(b.f)}function pp(a){var b=a.Cb[a.G];return b?b.ab[a.Q]:null}n=op.prototype;n.hb=function(){if(this.b.B)return this.b.B;var a=this.Cb[this.G];return a?a.Da.fa:null};
function qp(a){var b=L("renderPage");rp(a).then(function(c){if(c){var d=-1;if(0>a.Q){var d=a.ma,e=Ya(c.Ga.length,function(a){return Ao(c.Da,c.Ga[a])>d});a.Q=e==c.Ga.length?Number.POSITIVE_INFINITY:e-1}var f=c.ab[a.Q];f?(a.ma=f.offset,O(b,f)):sf(function(b){if(a.Q<c.Ga.length)P(b);else if(c.complete)a.Q=c.Ga.length-1,P(b);else{var e=c.Ga[c.Ga.length-1],h=sp(a,c,e);Eo(c.Da,h,e).then(function(l){h.M.style.display="none";h.M.style.visibility="visible";h.M.setAttribute("data-vivliostyle-page-side",h.g);
l=(e=l)?e.d-1:c.Ga.length-1;a.g(c.Da.N,c.item.G,l);e?(c.ab[l]=h,c.Ga.push(e),0<=d&&Ao(c.Da,e)>d?(f=h,a.Q=c.Ga.length-2,P(b)):(h.k=0==c.item.G&&0==l,uf(b))):(c.ab.push(h),f=h,a.Q=l,0>d&&(a.ma=h.offset),c.complete=!0,h.k=0==c.item.G&&0==l,h.l=c.item.G==a.b.b.length-1,P(b))})}}).then(function(){f=f||c.ab[a.Q];var e=c.Ga[a.Q];0>d&&(a.ma=Ao(c.Da,e));if(f)O(b,f);else{var k=sp(a,c,e);Eo(c.Da,k,e).then(function(d){k.M.style.display="none";k.M.style.visibility="visible";k.M.setAttribute("data-vivliostyle-page-side",
k.g);d=(e=d)?e.d-1:c.Ga.length-1;a.g(c.Da.N,c.item.G,d);e?(c.ab[d]=k,c.Ga[a.Q+1]=e):(c.ab.push(k),c.complete=!0,k.l=c.item.G==a.b.b.length-1);k.k=0==c.item.G&&0==d;O(b,k)})}})}else O(b,null)});return N(b)}n.Vc=function(){return tp(this,this.b.b.length-1,Number.POSITIVE_INFINITY)};function tp(a,b,c){var d=L("renderAllPages"),e=a.G,f=a.Q;a.G=0;sf(function(d){a.Q=a.G==b?c:Number.POSITIVE_INFINITY;qp(a).then(function(){++a.G>b?P(d):uf(d)})}).then(function(){a.G=e;a.Q=f;qp(a).ra(d)});return N(d)}
n.Id=function(){this.Q=this.G=0;return qp(this)};n.Jd=function(){this.G=this.b.b.length-1;this.Q=Number.POSITIVE_INFINITY;return qp(this)};n.nextPage=function(){var a=this,b=L("nextPage");rp(a).then(function(c){if(c){if(c.complete&&a.Q==c.Ga.length-1){if(a.G>=a.b.b.length-1){O(b,null);return}a.G++;a.Q=0}else a.Q++;qp(a).ra(b)}else O(b,null)});return N(b)};n.Tc=function(){if(0==this.Q){if(0==this.G)return M(null);this.G--;this.Q=Number.POSITIVE_INFINITY}else this.Q--;return qp(this)};
function up(a,b){var c="left"===b.g,d="ltr"===a.hb();return!c&&d||c&&!d}function vp(a){var b=L("getCurrentSpread"),c=pp(a);if(!c)return M({left:null,right:null});var d=a.G,e=a.Q,f="left"===c.g;(up(a,c)?a.Tc():a.nextPage()).then(function(g){a.G=d;a.Q=e;qp(a).then(function(){f?O(b,{left:c,right:g}):O(b,{left:g,right:c})})});return N(b)}n.Od=function(){var a=pp(this);if(!a)return M(null);var a=up(this,a),b=this.nextPage();if(a)return b;var c=this;return b.tc(function(){return c.nextPage()})};
n.Rd=function(){var a=pp(this);if(!a)return M(null);var a=up(this,a),b=this.Tc();if(a){var c=this;return b.tc(function(){return c.Tc()})}return b};function wp(a,b){var c=L("navigateToEPage");mp(a.b,b).then(function(b){b&&(a.G=b.G,a.Q=b.Q,a.ma=b.ma);qp(a).ra(c)});return N(c)}function xp(a,b){var c=L("navigateToCFI");lp(a.b,b).then(function(b){b&&(a.G=b.G,a.Q=b.Q,a.ma=b.ma);qp(a).ra(c)});return N(c)}
function yp(a,b){v.debug("Navigate to",b);var c=hp(a.b,ra(b));if(null==c&&(a.b.f&&b.match(/^#epubcfi\(/)&&(c=hp(a.b,a.b.f.url)),null==c))return M(null);var d=a.b.h[c];if(!d)return a.b.f&&c==hp(a.b,a.b.f.url)&&(c=b.indexOf("#"),0<=c)?xp(a,b.substr(c+1)):M(null);d.G!=a.G&&(a.G=d.G,a.Q=0);var e=L("navigateTo");rp(a).then(function(c){var d=Fh(c.ba,b);d&&(a.ma=Ah(c.ba,d),a.Q=-1);qp(a).ra(e)});return N(e)}
function sp(a,b,c){var d=b.Da.viewport,e=d.b.createElement("div");e.setAttribute("data-vivliostyle-page-container",!0);ia||(e.style.visibility="hidden");d.d.appendChild(e);var f=d.b.createElement("div");f.setAttribute("data-vivliostyle-bleed-box",!0);e.appendChild(f);f=new Zh(e,f);f.G=b.item.G;f.position=c;f.offset=Ao(b.Da,c);d!==a.viewport&&(a=hc(a.viewport.width,a.viewport.height,d.width,d.height),a=kg(null,new bc(a,null)),f.h.push(new Wh(e,"transform",a)));return f}
function zp(a,b){var c=fp();if(c){var d=b.ownerDocument,e=d.createElement("span");b.appendChild(e);d=d.importNode(a,!0);e.appendChild(d);d=c.queue;d.Push(["Typeset",c,e]);var c=L("navigateToEPage"),f=lf(c);d.Push(function(){f.Ta(e)});return N(c)}return M(null)}
n.Pc=function(a){var b=this;return function(c,d){var e;if("object"==c.localName&&"http://www.w3.org/1999/xhtml"==c.namespaceURI){var f=c.getAttribute("data");e=null;if(f){var f=ua(f,a.url),g=c.getAttribute("media-type");if(!g){var k=hp(b.b,f);k&&(k=b.b.h[k])&&(g=k.d)}if(g&&(k=b.b.F[g])){e=b.viewport.b.createElement("iframe");e.style.border="none";var f=Ua(f),h=Ua(g),g=new Qa;g.append(k);g.append("?src=");g.append(f);g.append("&type=");g.append(h);for(k=c.firstChild;k;k=k.nextSibling)1==k.nodeType&&
(h=k,"param"==h.localName&&"http://www.w3.org/1999/xhtml"==h.namespaceURI&&(f=h.getAttribute("name"),h=h.getAttribute("value"),f&&h&&(g.append("&"),g.append(encodeURIComponent(f)),g.append("="),g.append(encodeURIComponent(h)))));e.setAttribute("src",g.toString());(g=c.getAttribute("width"))&&e.setAttribute("width",g);(g=c.getAttribute("height"))&&e.setAttribute("height",g)}}e||(e=b.viewport.b.createElement("span"),e.setAttribute("data-adapt-process-children","true"));e=M(e)}else if("http://www.w3.org/1998/Math/MathML"==
c.namespaceURI)e=zp(c,d);else if("http://example.com/sse"==c.namespaceURI){e=d?d.ownerDocument:b.viewport.b;g=c.localName;switch(g){case "t":case "tab":case "ec":case "nt":case "fraction":case "comment":case "mark":g="span";break;case "ruby":case "rp":case "rt":break;default:g="div"}e=e.createElement(g);e.setAttribute("data-adapt-process-children","true");e=M(e)}else e=M(null);return e}};
function rp(a){if(a.G>=a.b.b.length)return M(null);var b=a.Cb[a.G];if(b)return M(b);var c=a.b.b[a.G],d=a.b.e,e=L("getPageViewItem");d.load(c.src).then(function(f){0==c.b&&1==a.b.b.length&&(c.b=Math.ceil(Ch(f)/2700),a.b.u=c.b);var g=d.b[f.url],k=a.Pc(f),h=a.viewport,l=xo(g,h.width,h.height,h.fontSize);if(l.width!=h.width||l.height!=h.height||l.fontSize!=h.fontSize)h=new om(h.f,l.fontSize,h.root,l.width,l.height);var l=a.Cb[a.G-1],m=new yo(g,f,a.b.lang,h,a.e,a.f,k,a.b.w,l?l.Da.pa+l.ab.length:0);l&&
uo(m.k,l.Da.k);m.R=a.R;zo(m).then(function(){b={item:c,ba:f,Da:m,Ga:[null],ab:[],complete:!1};a.Cb[a.G]=b;O(e,b)})});return N(e)}function Ap(a){return{G:a.G,Q:a.Q,ma:a.ma}}function Bp(a,b){b?(a.G=b.G,a.Q=-1,a.ma=b.ma):(a.G=0,a.Q=0,a.ma=0);return tp(a,a.G,a.Q)}
n.kc=function(){var a=this.b,b=a.C||a.N;if(!b)return M(null);var c=L("showTOC");this.d||(this.d=new Oo(a.e,b.src,a.lang,this.e,this.f,this.R,this,a.w));var a=this.viewport,b=Math.min(350,Math.round(.67*a.width)-16),d=a.height-6,e=a.b.createElement("div");a.root.appendChild(e);e.style.position="absolute";e.style.visibility="hidden";e.style.left="3px";e.style.top="3px";e.style.width=b+10+"px";e.style.maxHeight=d+"px";e.style.overflow="scroll";e.style.overflowX="hidden";e.style.background="#EEE";e.style.border=
"1px outset #999";e.style.borderRadius="2px";e.style.boxShadow=" 5px 5px rgba(128,128,128,0.3)";this.d.kc(e,a,b,d,this.viewport.fontSize).then(function(a){e.style.visibility="visible";O(c,a)});return N(c)};n.hc=function(){this.d&&this.d.hc()};n.jd=function(){return this.d&&this.d.jd()};function Cp(a,b,c,d){var e=this;this.h=a;this.cb=b;b.setAttribute("data-vivliostyle-viewer-viewport",!0);b.setAttribute("data-vivliostyle-viewer-status","loading");this.eb=c;this.La=d;a=a.document;this.pa=new rh(a.head,b);this.H=[];this.g=null;this.F=this.d=!1;this.f=this.j=this.e=this.l=null;this.fontSize=16;this.zoom=1;this.fa=!1;this.Vc=!0;this.R=dc();this.C=function(){};this.k=function(){};this.Z=function(){e.d=!0;e.C()};this.u=function(){};this.w=a.getElementById("vivliostyle-page-rules");this.N=
!1;this.oa={loadEPUB:this.xa,loadXML:this.Ja,configure:this.B,moveTo:this.Ka,toc:this.kc};Dp(this)}function Dp(a){qa(1,function(a){Ep(this,{t:"debug",content:a})}.bind(a));qa(2,function(a){Ep(this,{t:"info",content:a})}.bind(a));qa(3,function(a){Ep(this,{t:"warn",content:a})}.bind(a));qa(4,function(a){Ep(this,{t:"error",content:a})}.bind(a))}function Ep(a,b){b.i=a.eb;a.La(b)}
Cp.prototype.xa=function(a){vn.b("loadEPUB");vn.b("loadFirstPage");this.cb.setAttribute("data-vivliostyle-viewer-status","loading");var b=a.url,c=a.fragment,d=!!a.zipmeta,e=a.userStyleSheet;this.viewport=null;var f=L("loadEPUB"),g=this;g.B(a).then(function(){var a=new Ro;if(e)for(var h=0;h<e.length;h++)No(a,e[h]);Mo(a).then(function(){var e=ua(b,g.h.location.href);g.H=[e];To(a,e,d).then(function(a){g.g=a;lp(g.g,c).then(function(a){g.f=a;Fp(g).then(function(){g.cb.setAttribute("data-vivliostyle-viewer-status",
"complete");vn.d("loadEPUB");Ep(g,{t:"loaded",metadata:g.g.l});O(f,!0)})})})})});return N(f)};
Cp.prototype.Ja=function(a){vn.b("loadXML");vn.b("loadFirstPage");this.cb.setAttribute("data-vivliostyle-viewer-status","loading");var b;"string"===typeof a.url?b=[a.url]:b=a.url;var c=a.document,d=a.fragment,e=a.userStyleSheet;this.viewport=null;var f=L("loadXML"),g=this;g.B(a).then(function(){var a=new Ro;if(e)for(var h=0;h<e.length;h++)No(a,e[h]);Mo(a).then(function(){var e=b.map(function(a){return ua(a,g.h.location.href)});g.H=e;g.g=new Vo(a,"");jp(g.g,e,c).then(function(){lp(g.g,d).then(function(a){g.f=
a;Fp(g).then(function(){g.cb.setAttribute("data-vivliostyle-viewer-status","complete");vn.d("loadXML");Ep(g,{t:"loaded"});O(f,!0)})})})})});return N(f)};function Gp(a,b){var c=parseFloat(b),d=/[a-z]+$/,e;if("string"===typeof b&&(e=b.match(d))){d=e[0];if("em"===d||"rem"===d)return c*a.fontSize;if("ex"===d||"rex"===d)return c*sc.ex*a.fontSize/sc.em;if(d=sc[d])return c*d}return c}
Cp.prototype.B=function(a){"boolean"==typeof a.autoresize&&(a.autoresize?(this.l=null,this.h.addEventListener("resize",this.Z,!1),this.d=!0):this.h.removeEventListener("resize",this.Z,!1));if("number"==typeof a.fontSize){var b=a.fontSize;5<=b&&72>=b&&this.fontSize!=b&&(this.fontSize=b,this.d=!0)}"object"==typeof a.viewport&&a.viewport&&(b=a.viewport,b={marginLeft:Gp(this,b["margin-left"])||0,marginRight:Gp(this,b["margin-right"])||0,marginTop:Gp(this,b["margin-top"])||0,marginBottom:Gp(this,b["margin-bottom"])||
0,width:Gp(this,b.width)||0,height:Gp(this,b.height)||0},200<=b.width||200<=b.height)&&(this.h.removeEventListener("resize",this.Z,!1),this.l=b,this.d=!0);"boolean"==typeof a.hyphenate&&(this.R.Jc=a.hyphenate,this.d=!0);"boolean"==typeof a.horizontal&&(this.R.Ic=a.horizontal,this.d=!0);"boolean"==typeof a.nightMode&&(this.R.Qc=a.nightMode,this.d=!0);"number"==typeof a.lineHeight&&(this.R.lineHeight=a.lineHeight,this.d=!0);"number"==typeof a.columnWidth&&(this.R.Ec=a.columnWidth,this.d=!0);"string"==
typeof a.fontFamily&&(this.R.fontFamily=a.fontFamily,this.d=!0);"boolean"==typeof a.load&&(this.fa=a.load);"boolean"==typeof a.renderAllPages&&(this.Vc=a.renderAllPages);"string"==typeof a.userAgentRootURL&&(ta=a.userAgentRootURL);"boolean"==typeof a.spreadView&&a.spreadView!==this.R.Va&&(this.viewport=null,this.R.Va=a.spreadView,this.d=!0);"number"==typeof a.pageBorder&&a.pageBorder!==this.R.Bb&&(this.viewport=null,this.R.Bb=a.pageBorder,this.d=!0);"number"==typeof a.zoom&&a.zoom!==this.zoom&&(this.zoom=
a.zoom,this.F=!0);return M(!0)};function Hp(a){var b=[];a.e&&(b.push(a.e),a.e=null);a.j&&(b.push(a.j.left),b.push(a.j.right),a.j=null);b.forEach(function(a){a&&(w(a.M,"display","none"),a.removeEventListener("hyperlink",this.u,!1))},a)}function Ip(a,b){b.addEventListener("hyperlink",a.u,!1);w(b.M,"visibility","visible");w(b.M,"display","block")}function Jp(a,b){Hp(a);a.e=b;Ip(a,b)}
function Kp(a){var b=L("reportPosition");a.f||(a.f=Ap(a.b));kp(a.g,a.f.G,a.f.ma).then(function(c){var d=a.e;(a.fa&&0<d.f.length?vg(d.f):M(!0)).then(function(){Lp(a,d,c).ra(b)})});return N(b)}function Mp(a){var b=a.cb;if(a.l){var c=a.l;b.style.marginLeft=c.marginLeft+"px";b.style.marginRight=c.marginRight+"px";b.style.marginTop=c.marginTop+"px";b.style.marginBottom=c.marginBottom+"px";return new om(a.h,a.fontSize,b,c.width,c.height)}return new om(a.h,a.fontSize,b)}
function Np(a){if(a.l||!a.viewport||a.viewport.fontSize!=a.fontSize)return!1;var b=Mp(a);if(!(b=b.width==a.viewport.width&&b.height==a.viewport.height)&&(b=a.b)){a:{a=a.b.Cb;for(b=0;b<a.length;b++){var c=a[b];if(c)for(var c=c.ab,d=0;d<c.length;d++){var e=c[d];if(e.H&&e.F){a=!0;break a}}}a=!1}b=!a}return b}
Cp.prototype.vb=function(a,b,c){if(!this.N&&this.w&&0===b&&0===c){var d="";Object.keys(a).forEach(function(b){d+="@page "+b+"{size:";b=a[b];d+=b.width+"px "+b.height+"px;}"});this.w.textContent=d;this.N=!0}};
function Op(a){if(a.b){a.b.hc();for(var b=a.b.Cb,c=0;c<b.length;c++){var d=b[c];if(d)for(var d=d.ab,e;e=d.shift();)e=e.M,e.parentNode.removeChild(e)}}a.w&&(a.w.textContent="",a.N=!1);a.viewport=Mp(a);b=a.viewport;w(b.e,"width","");w(b.e,"height","");w(b.d,"width","");w(b.d,"height","");w(b.d,"transform","");a.b=new op(a.g,a.viewport,a.pa,a.R,a.vb.bind(a))}
function Pp(a,b){a.F=!1;if(a.R.Va)return vp(a.b).tc(function(c){Hp(a);a.j=c;c.left&&(Ip(a,c.left),c.right||c.left.M.setAttribute("data-vivliostyle-unpaired-page",!0));c.right&&(Ip(a,c.right),c.left||c.right.M.setAttribute("data-vivliostyle-unpaired-page",!0));c=Qp(a,c);a.viewport.zoom(c.width,c.height,a.zoom);a.e=b;return M(null)});Jp(a,b);a.viewport.zoom(b.d.width,b.d.height,a.zoom);a.e=b;return M(null)}
function Qp(a,b){var c=0,d=0;b.left&&(c+=b.left.d.width,d=b.left.d.height);b.right&&(c+=b.right.d.width,d=Math.max(d,b.right.d.height));b.left&&b.right&&(c+=2*a.R.Bb);return{width:c,height:d}}var Rp={be:"fit inside viewport"};
function Fp(a){a.d=!1;if(Np(a))return M(!0);"complete"===a.cb.getAttribute("data-vivliostyle-viewer-status")&&a.cb.setAttribute("data-vivliostyle-viewer-status","resizing");Ep(a,{t:"resizestart"});var b=L("resize");a.b&&!a.f&&(a.f=Ap(a.b));Op(a);Bp(a.b,a.f).then(function(c){Pp(a,c).then(function(){Kp(a).then(function(c){vn.d("loadFirstPage");(a.Vc?a.b.Vc():M(null)).then(function(){a.cb.setAttribute("data-vivliostyle-viewer-status","complete");Ep(a,{t:"resizeend"});O(b,c)})})})});return N(b)}
function Lp(a,b,c){var d=L("sendLocationNotification"),e={t:"nav",first:b.k,last:b.l};np(a.g,a.f).then(function(b){e.epage=b;e.epageCount=a.g.u;c&&(e.cfi=c);Ep(a,e);O(d,!0)});return N(d)}Cp.prototype.hb=function(){return this.b?this.b.hb():null};
Cp.prototype.Ka=function(a){var b=this;if("string"==typeof a.where)switch(a.where){case "next":a=this.R.Va?this.b.Od:this.b.nextPage;break;case "previous":a=this.R.Va?this.b.Rd:this.b.Tc;break;case "last":a=this.b.Jd;break;case "first":a=this.b.Id;break;default:return M(!0)}else if("number"==typeof a.epage){var c=a.epage;a=function(){return wp(b.b,c)}}else if("string"==typeof a.url){var d=a.url;a=function(){return yp(b.b,d)}}else return M(!0);var e=L("nextPage");a.call(b.b).then(function(a){a?(b.f=
null,Pp(b,a).then(function(){Kp(b).ra(e)})):O(e,!0)});return N(e)};Cp.prototype.kc=function(a){var b=!!a.autohide;a=a.v;var c=this.b.jd();if(c){if("show"==a)return M(!0)}else if("hide"==a)return M(!0);if(c)return this.b.hc(),M(!0);var d=this,e=L("showTOC");this.b.kc(b).then(function(a){if(a){if(b){var c=function(){d.b.hc()};a.addEventListener("hyperlink",c,!1);a.M.addEventListener("click",c,!1)}a.addEventListener("hyperlink",d.u,!1)}O(e,!0)});return N(e)};
function Sp(a,b){var c=b.a||"";return af("runCommand",function(d){var e=a.oa[c];e?e.call(a,b).then(function(){Ep(a,{t:"done",a:c});O(d,!0)}):(v.error("No such action:",c),O(d,!0))},function(a,b){v.error(b,"Error during action:",c);O(a,!0)})}function Tp(a){return"string"==typeof a?JSON.parse(a):a}
function Up(a,b){var c=Tp(b),d=null;cf(function(){var b=L("commandLoop"),f=We.d;a.u=function(b){var c=a.H.some(function(a){return b.href.substr(0,a.length)==a}),d={t:"hyperlink",href:b.href,internal:c};df(f,function(){Ep(a,d);return M(!0)})};sf(function(b){if(a.d)Fp(a).then(function(){uf(b)});else if(a.F)a.e&&Pp(a,a.e).then(function(){uf(b)});else if(c){var e=c;c=null;Sp(a,e).then(function(){uf(b)})}else e=L("waitForCommand"),d=lf(e,self),N(e).then(function(){uf(b)})}).ra(b);return N(b)});a.C=function(){var a=
d;a&&(d=null,a.Ta())};a.k=function(b){if(c)return!1;c=Tp(b);a.C();return!0};a.h.adapt_command=a.k};Array.b||(Array.b=function(a,b,c){b&&c&&(b=b.bind(c));c=[];for(var d=a.length,e=0;e<d;e++)c[e]=b?b(a[e]):a[e];return c});Object.Kb||(Object.Kb=function(a,b){Object.keys(b).forEach(function(c){a[c]=b[c]});return a});function Vp(a){var b={};Object.keys(a).forEach(function(c){var d=a[c];switch(c){case "autoResize":b.autoresize=d;break;case "pageBorderWidth":b.pageBorder=d;break;default:b[c]=d}});return b}function Wp(a,b){ia=a.debug;this.f=a;this.b=new Cp(a.window||window,a.viewportElement,"main",this.Hd.bind(this));this.e={autoResize:!0,fontSize:16,pageBorderWidth:1,renderAllPages:!0,spreadView:!1,zoom:1};b&&this.Bd(b);this.d=new eb}n=Wp.prototype;
n.Bd=function(a){var b=Object.Kb({a:"configure"},Vp(a));this.b.k(b);Object.Kb(this.e,a)};n.Hd=function(a){var b={type:a.t};Object.keys(a).forEach(function(c){"t"!==c&&(b[c]=a[c])});fb(this.d,b)};n.Td=function(a,b){this.d.addEventListener(a,b,!1)};n.Wd=function(a,b){this.d.removeEventListener(a,b,!1)};n.Kd=function(a,b,c){a||fb(this.d,{type:"error",content:"No URL specified"});Xp(this,a,null,b,c)};n.Ud=function(a,b,c){a||fb(this.d,{type:"error",content:"No URL specified"});Xp(this,null,a,b,c)};
function Xp(a,b,c,d,e){d=d||{};var f,g=d.userStyleSheet;g&&(f=g.map(function(a){return{url:a.url||null,text:a.text||null}}));e&&Object.Kb(a.e,e);b=Object.Kb({a:b?"loadXML":"loadEPUB",userAgentRootURL:a.f.userAgentRootURL,url:b||c,document:d.documentObject,fragment:d.fragment,userStyleSheet:f},Vp(a.e));Up(a.b,b)}n.hb=function(){return this.b.hb()};
n.Md=function(a){a:switch(a){case "left":a="ltr"===this.hb()?"previous":"next";break a;case "right":a="ltr"===this.hb()?"next":"previous";break a}this.b.k({a:"moveTo",where:a})};n.Ld=function(a){this.b.k({a:"moveTo",url:a})};n.Vd=function(a){var b;a:{b=this.b;if(!b.e)throw Error("no page exists.");switch(a){case "fit inside viewport":a=b.R.Va?Qp(b,b.j):b.e.d;b=Math.min(b.viewport.width/a.width,b.viewport.height/a.height);break a;default:throw Error("unknown zoom type: "+a);}}return b};
ba("vivliostyle.viewer.Viewer",Wp);Wp.prototype.setOptions=Wp.prototype.Bd;Wp.prototype.addListener=Wp.prototype.Td;Wp.prototype.removeListener=Wp.prototype.Wd;Wp.prototype.loadDocument=Wp.prototype.Kd;Wp.prototype.loadEPUB=Wp.prototype.Ud;Wp.prototype.getCurrentPageProgression=Wp.prototype.hb;Wp.prototype.navigateToPage=Wp.prototype.Md;Wp.prototype.navigateToInternalUrl=Wp.prototype.Ld;Wp.prototype.queryZoomFactor=Wp.prototype.Vd;ba("vivliostyle.viewer.ZoomType",Rp);Rp.FIT_INSIDE_VIEWPORT="fit inside viewport";
rn.call(vn,"load_vivliostyle","end",void 0);var Yp=16,Zp="ltr";function $p(a){window.adapt_command(a)}function aq(){$p({a:"moveTo",where:"ltr"===Zp?"previous":"next"})}function bq(){$p({a:"moveTo",where:"ltr"===Zp?"next":"previous"})}
function cq(a){var b=a.key,c=a.keyIdentifier,d=a.location;if("End"===b||"End"===c)$p({a:"moveTo",where:"last"}),a.preventDefault();else if("Home"===b||"Home"===c)$p({a:"moveTo",where:"first"}),a.preventDefault();else if("ArrowUp"===b||"Up"===b||"Up"===c)$p({a:"moveTo",where:"previous"}),a.preventDefault();else if("ArrowDown"===b||"Down"===b||"Down"===c)$p({a:"moveTo",where:"next"}),a.preventDefault();else if("ArrowRight"===b||"Right"===b||"Right"===c)bq(),a.preventDefault();else if("ArrowLeft"===
b||"Left"===b||"Left"===c)aq(),a.preventDefault();else if("0"===b||"U+0030"===c)$p({a:"configure",fontSize:Math.round(Yp)}),a.preventDefault();else if("t"===b||"U+0054"===c)$p({a:"toc",v:"toggle",autohide:!0}),a.preventDefault();else if("+"===b||"Add"===b||"U+002B"===c||"U+00BB"===c||"U+004B"===c&&d===KeyboardEvent.b)Yp*=1.2,$p({a:"configure",fontSize:Math.round(Yp)}),a.preventDefault();else if("-"===b||"Subtract"===b||"U+002D"===c||"U+00BD"===c||"U+004D"===c&&d===KeyboardEvent.b)Yp/=1.2,$p({a:"configure",
fontSize:Math.round(Yp)}),a.preventDefault()}
function dq(a){switch(a.t){case "loaded":a=a.viewer;var b=Zp=a.hb();a.cb.setAttribute("data-vivliostyle-page-progression",b);a.cb.setAttribute("data-vivliostyle-spread-view",a.R.Va);window.addEventListener("keydown",cq,!1);document.body.setAttribute("data-vivliostyle-viewer-status","complete");a=document.getElementById("vivliostyle-page-navigation-left");a.addEventListener("click",aq,!1);b=document.getElementById("vivliostyle-page-navigation-right");b.addEventListener("click",bq,!1);[a,b].forEach(function(a){a.setAttribute("data-vivliostyle-ui-state",
"attention");window.setTimeout(function(){a.removeAttribute("data-vivliostyle-ui-state")},1E3)});break;case "nav":(a=a.cfi)&&location.replace(xa(location.href,Ua(a||"")));break;case "hyperlink":a.internal&&$p({a:"moveTo",url:a.href})}}
ba("vivliostyle.viewerapp.main",function(a){var b=a&&a.fragment||va("f"),c=a&&a.epubURL||va("b"),d=a&&a.xmlURL||va("x"),e=a&&a.defaultPageWidth||va("w"),f=a&&a.defaultPageHeight||va("h"),g=a&&a.defaultPageSize||va("size"),k=a&&a.orientation||va("orientation"),h=va("spread"),h=a&&a.spreadView||!!h&&"false"!=h,l=a&&a.viewportElement||document.body;a={a:c?"loadEPUB":"loadXML",url:c||d,autoresize:!0,fragment:b,renderAllPages:!0,userAgentRootURL:a&&a.uaRoot||null,document:a&&a.document||null,userStyleSheet:a&&
a.userStyleSheet||null,spreadView:h,pageBorder:1};var m;if(e&&f)m=e+" "+f;else{switch(g){case "A5":e="148mm";f="210mm";break;case "A4":e="210mm";f="297mm";break;case "A3":e="297mm";f="420mm";break;case "B5":e="176mm";f="250mm";break;case "B4":e="250mm";f="353mm";break;case "letter":e="8.5in";f="11in";break;case "legal":e="8.5in";f="14in";break;case "ledger":e="11in",f="17in"}e&&f&&(m=g,"landscape"===k&&(m=m?m+" landscape":null,g=e,e=f,f=g))}e&&f&&(a.viewport={width:e,height:f},g=document.createElement("style"),
g.textContent="@page { size: "+m+"; margin: 0; }",document.head.appendChild(g));Up(new Cp(window,l,"main",dq),a)});
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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _modelsMessageQueue = require("../models/message-queue");

var _modelsMessageQueue2 = _interopRequireDefault(_modelsMessageQueue);

var LogLevel = {
    DEBUG: "debug",
    INFO: "info",
    WARN: "warn",
    ERROR: "error"
};

function Logger() {
    this.logLevel = LogLevel.ERROR;
}

Logger.LogLevel = LogLevel;

Logger.prototype.setLogLevel = function (logLevel) {
    this.logLevel = logLevel;
};

Logger.prototype.debug = function (content) {
    if (this.logLevel === LogLevel.DEBUG) {
        _modelsMessageQueue2["default"].push({
            type: "debug",
            content: content
        });
    }
};

Logger.prototype.info = function (content) {
    if (this.logLevel === LogLevel.DEBUG || this.logLevel === LogLevel.INFO) {
        _modelsMessageQueue2["default"].push({
            type: "info",
            content: content
        });
    }
};

Logger.prototype.warn = function (content) {
    if (this.logLevel === LogLevel.DEBUG || this.logLevel === LogLevel.INFO || this.logLevel === LogLevel.WARN) {
        _modelsMessageQueue2["default"].push({
            type: "warn",
            content: content
        });
    }
};

Logger.prototype.error = function (content) {
    if (this.logLevel === LogLevel.DEBUG || this.logLevel === LogLevel.INFO || this.logLevel === LogLevel.WARN || this.logLevel === LogLevel.ERROR) {
        _modelsMessageQueue2["default"].push({
            type: "error",
            content: content
        });
    }
};

var instance = new Logger();

Logger.getLogger = function () {
    return instance;
};

exports["default"] = Logger;
module.exports = exports["default"];

},{"../models/message-queue":7}],5:[function(require,module,exports){
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

},{"./models/vivliostyle":10,"./vivliostyle-viewer":20,"vivliostyle":2}],6:[function(require,module,exports){
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
    var epubUrl = _storesUrlParameters2["default"].getParameter("b");
    var url = _storesUrlParameters2["default"].getParameter("x");
    var fragment = _storesUrlParameters2["default"].getParameter("f");
    return {
        epubUrl: epubUrl[0] || null,
        url: url.length ? url : null,
        fragment: fragment[0] || null
    };
}

function DocumentOptions() {
    var urlOptions = getDocumentOptionsFromURL();
    this.epubUrl = _knockout2["default"].observable(urlOptions.epubUrl || "");
    this.url = _knockout2["default"].observable(urlOptions.url || null);
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

},{"../stores/url-parameters":11,"./page-size":8,"knockout":1}],7:[function(require,module,exports){
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

function MessageQueue() {
  return _knockout2["default"].observableArray();
}

exports["default"] = new MessageQueue();
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

},{"knockout":1}],9:[function(require,module,exports){
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
        profile: _storesUrlParameters2["default"].getParameter("profile")[0] === "true",
        spreadView: _storesUrlParameters2["default"].getParameter("spread")[0] === "true"
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

},{"../stores/url-parameters":11,"knockout":1}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
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
    return new RegExp("[#&]" + _utilsStringUtil2["default"].escapeUnicodeString(name) + "=([^&]*)", "g");
}

function URLParameterStore() {
    this.history = window ? window.history : {};
    this.location = window ? window.location : { url: "" };
}

URLParameterStore.prototype.getParameter = function (name) {
    var url = this.location.href;
    var regexp = getRegExpForParameter(name);
    var results = [];
    var r;
    while (r = regexp.exec(url)) {
        results.push(r[1]);
    }
    return results;
};

URLParameterStore.prototype.setParameter = function (name, value) {
    var url = this.location.href;
    var updated;
    var regexp = getRegExpForParameter(name);
    var r = regexp.exec(url);
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

},{"../utils/string-util":14}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
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

},{"knockout":1}],14:[function(require,module,exports){
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

},{}],15:[function(require,module,exports){
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

function MessageDialog(queue) {
    this.list = queue;
    this.visible = _knockout2["default"].pureComputed(function () {
        return queue().length > 0;
    });
}

MessageDialog.prototype.getDisplayMessage = function (errorInfo) {
    var e = errorInfo.error;
    var msg = e && (e.toString() || e.frameTrace || e.stack);
    if (msg) {
        msg = msg.split("\n", 1)[0];
    }
    if (!msg) {
        msg = errorInfo.messages.join("\n");
    }
    return msg;
};

exports["default"] = MessageDialog;
module.exports = exports["default"];

},{"knockout":1}],16:[function(require,module,exports){
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

},{"../models/viewer-options":9,"../models/vivliostyle":10,"../utils/key-util":12,"knockout":1}],17:[function(require,module,exports){
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

function SettingsPanel(viewerOptions, documentOptions, viewer, messageDialog) {
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

    messageDialog.visible.subscribe(function (visible) {
        if (visible) this.close();
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

},{"../models/page-size":8,"../models/viewer-options":9,"../utils/key-util":12,"knockout":1}],18:[function(require,module,exports){
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

var _modelsMessageQueue = require("../models/message-queue");

var _modelsMessageQueue2 = _interopRequireDefault(_modelsMessageQueue);

var _viewer = require("./viewer");

var _viewer2 = _interopRequireDefault(_viewer);

var _navigation = require("./navigation");

var _navigation2 = _interopRequireDefault(_navigation);

var _settingsPanel = require("./settings-panel");

var _settingsPanel2 = _interopRequireDefault(_settingsPanel);

var _messageDialog = require("./message-dialog");

var _messageDialog2 = _interopRequireDefault(_messageDialog);

var _utilsKeyUtil = require("../utils/key-util");

var _utilsKeyUtil2 = _interopRequireDefault(_utilsKeyUtil);

var _storesUrlParameters = require("../stores/url-parameters");

var _storesUrlParameters2 = _interopRequireDefault(_storesUrlParameters);

function ViewerApp() {
    this.documentOptions = new _modelsDocumentOptions2["default"]();
    this.viewerOptions = new _modelsViewerOptions2["default"]();
    if (this.viewerOptions.profile()) {
        _modelsVivliostyle2["default"].profile.profiler.enable();
    }
    this.viewerSettings = {
        userAgentRootURL: "resources/",
        viewportElement: document.getElementById("vivliostyle-viewer-viewport"),
        debug: _storesUrlParameters2["default"].getParameter("debug")[0] === "true"
    };
    this.viewer = new _viewer2["default"](this.viewerSettings, this.viewerOptions);
    this.messageDialog = new _messageDialog2["default"](_modelsMessageQueue2["default"]);
    this.settingsPanel = new _settingsPanel2["default"](this.viewerOptions, this.documentOptions, this.viewer, this.messageDialog);
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

},{"../models/document-options":6,"../models/message-queue":7,"../models/viewer-options":9,"../models/vivliostyle":10,"../stores/url-parameters":11,"../utils/key-util":12,"./message-dialog":15,"./navigation":16,"./settings-panel":17,"./viewer":19,"knockout":1}],19:[function(require,module,exports){
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
    var logger = _loggingLogger2["default"].getLogger();
    this.viewer_.addListener("debug", function (payload) {
        logger.debug(payload.content);
    });
    this.viewer_.addListener("info", function (payload) {
        logger.info(payload.content);
    });
    this.viewer_.addListener("warn", function (payload) {
        logger.warn(payload.content);
    });
    this.viewer_.addListener("error", function (payload) {
        logger.error(payload.content);
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

},{"../logging/logger":4,"../models/vivliostyle":10,"../utils/observable-util":13,"knockout":1}],20:[function(require,module,exports){
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

},{"./bindings/menuButton.js":3,"./viewmodels/viewer-app":18,"knockout":1}]},{},[5]);
