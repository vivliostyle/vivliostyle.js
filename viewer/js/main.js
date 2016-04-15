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
 * Vivliostyle core 2016.4.1-pre.20160415053057
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
    var n,ba=this;function ca(a,b){var c=a.split("."),d=("undefined"!==typeof enclosingObject&&enclosingObject?enclosingObject:window)||ba;c[0]in d||!d.execScript||d.execScript("var "+c[0]);for(var e;c.length&&(e=c.shift());)c.length||void 0===b?d[e]?d=d[e]:d=d[e]={}:d[e]=b}
function t(a,b){function c(){}c.prototype=b.prototype;a.Ed=b.prototype;a.prototype=new c;a.prototype.constructor=a;a.me=function(a,c,f){for(var g=Array(arguments.length-2),h=2;h<arguments.length;h++)g[h-2]=arguments[h];return b.prototype[c].apply(a,g)}};function da(a,b,c,d){d=d[b];if(!d)throw Error("unknown writing-mode: "+b);b=d[c||"ltr"];if(!b)throw Error("unknown direction: "+c);for(c=0;c<b.length;c++)if(d=b[c],d=a.replace(d.f,d.b),d!==a)return d;return a}function ea(a){var b=fa,c={};Object.keys(b).forEach(function(d){var e=c[d]={},f=b[d];Object.keys(f).forEach(function(b){e[b]=f[b].map(function(b){return{f:new RegExp("(-?)"+(a?b.I:b.J)+"(-?)"),b:"$1"+(a?b.J:b.I)+"$2"}})})});return c}
var fa={"horizontal-tb":{ltr:[{I:"inline-start",J:"left"},{I:"inline-end",J:"right"},{I:"block-start",J:"top"},{I:"block-end",J:"bottom"},{I:"inline-size",J:"width"},{I:"block-size",J:"height"}],rtl:[{I:"inline-start",J:"right"},{I:"inline-end",J:"left"},{I:"block-start",J:"top"},{I:"block-end",J:"bottom"},{I:"inline-size",J:"width"},{I:"block-size",J:"height"}]},"vertical-rl":{ltr:[{I:"inline-start",J:"top"},{I:"inline-end",J:"bottom"},{I:"block-start",J:"right"},{I:"block-end",J:"left"},{I:"inline-size",
J:"height"},{I:"block-size",J:"width"}],rtl:[{I:"inline-start",J:"bottom"},{I:"inline-end",J:"top"},{I:"block-start",J:"right"},{I:"block-end",J:"left"},{I:"inline-size",J:"height"},{I:"block-size",J:"width"}]},"vertical-lr":{ltr:[{I:"inline-start",J:"top"},{I:"inline-end",J:"bottom"},{I:"block-start",J:"left"},{I:"block-end",J:"right"},{I:"inline-size",J:"height"},{I:"block-size",J:"width"}],rtl:[{I:"inline-start",J:"bottom"},{I:"inline-end",J:"top"},{I:"block-start",J:"left"},{I:"block-end",J:"right"},
{I:"inline-size",J:"height"},{I:"block-size",J:"width"}]}},ga=ea(!0),ha=ea(!1),ia={"horizontal-tb":[{I:"line-left",J:"left"},{I:"line-right",J:"right"},{I:"over",J:"top"},{I:"under",J:"bottom"}],"vertical-rl":[{I:"line-left",J:"top"},{I:"line-right",J:"bottom"},{I:"over",J:"right"},{I:"under",J:"left"}],"vertical-lr":[{I:"line-left",J:"top"},{I:"line-right",J:"bottom"},{I:"over",J:"right"},{I:"under",J:"left"}]};var ja=!1,ka={ee:"ltr",fe:"rtl"};ca("vivliostyle.constants.PageProgression",ka);ka.LTR="ltr";ka.RTL="rtl";var la={Fd:"left",Gd:"right"};ca("vivliostyle.constants.PageSide",la);la.LEFT="left";la.RIGHT="right";function ma(a){var b=a.error,c=b&&(b.frameTrace||b.stack);a=[].concat(a.messages);b&&(0<a.length&&(a=a.concat(["\n"])),a=a.concat([b.toString()]),c&&(a=a.concat(["\n"]).concat(c)));return a}function na(a){a=Array.b(a);var b=null;a[0]instanceof Error&&(b=a.shift());return{error:b,messages:a}}function oa(a){function b(a){return function(b){return a.apply(c,b)}}var c=a||console;this.f=b(c.debug||c.log);this.h=b(c.info||c.log);this.j=b(c.warn||c.log);this.g=b(c.error||c.log);this.d={}}
function qa(a,b,c){(a=a.d[b])&&a.forEach(function(a){a(c)})}function sa(a,b){var c=u,d=c.d[a];d||(d=c.d[a]=[]);d.push(b)}oa.prototype.debug=function(a){var b=na(arguments);this.f(ma(b));qa(this,1,b)};oa.prototype.e=function(a){var b=na(arguments);this.h(ma(b));qa(this,2,b)};oa.prototype.b=function(a){var b=na(arguments);this.j(ma(b));qa(this,3,b)};oa.prototype.error=function(a){var b=na(arguments);this.g(ma(b));qa(this,4,b)};var u=new oa;function ta(a){var b=a.match(/^([^#]*)/);return b?b[1]:a}var ua=window.location.href;
function va(a,b){if(!b||a.match(/^\w{2,}:/))return a.toLowerCase().match("^javascript:")?"#":a;b.match(/^\w{2,}:\/\/[^\/]+$/)&&(b+="/");var c;if(a.match(/^\/\//))return(c=b.match(/^(\w{2,}:)\/\//))?c[1]+a:a;if(a.match(/^\//))return(c=b.match(/^(\w{2,}:\/\/[^\/]+)\//))?c[1]+a:a;a.match(/^\.(\/|$)/)&&(a=a.substr(1));c=b;var d=c.match(/^([^#?]*)/);b=d?d[1]:c;if(a.match(/^\#/))return b+a;c=b.lastIndexOf("/");if(0>c)return a;for(d=b.substr(0,c+1)+a;;){c=d.indexOf("/../");if(0>=c)break;var e=d.lastIndexOf("/",
c-1);if(0>=e)break;d=d.substr(0,e)+d.substr(c+3)}return d.replace(/\/(\.\/)+/g,"/")}function wa(a){a=new RegExp("#(.*&)?"+xa(a)+"=([^#&]*)");return(a=window.location.href.match(a))?a[2]:null}function ya(a,b){var c=new RegExp("#(.*&)?"+xa("f")+"=([^#&]*)"),d=a.match(c);return d?(c=d[2].length,d=d.index+d[0].length-c,a.substr(0,d)+b+a.substr(d+c)):a.match(/#/)?a+"&f="+b:a+"#f="+b}function za(a){return null==a?a:a.toString()}function Aa(){this.b=[null]}
Aa.prototype.length=function(){return this.b.length-1};function Ba(a,b){a&&(b="-"+b,a=a.replace(/-/g,""),"moz"===a&&(a="Moz"));return a+b.replace(/-[a-z]/g,function(a){return a.substr(1).toUpperCase()})}var Ca=" -webkit- -moz- -ms- -o- -epub-".split(" "),Da={};
function Ea(a,b){if("writing-mode"===b){var c=document.createElement("span");if("-ms-"===a)return c.style.setProperty(a+b,"tb-rl"),"tb-rl"===c.style["writing-mode"];c.style.setProperty(a+b,"vertical-rl");return"vertical-rl"===c.style[a+b]}return"string"===typeof document.documentElement.style[Ba(a,b)]}
function Ga(a){var b=Da[a];if(b||null===b)return b;switch(a){case "writing-mode":if(Ea("-ms-","writing-mode"))return Da[a]="-ms-writing-mode";break;case "filter":if(Ea("-webkit-","filter"))return Da[a]="-webkit-filter"}for(b=0;b<Ca.length;b++){var c=Ca[b];if(Ea(c,a))return b=c+a,Da[a]=b}u.b("Property not supported by the browser: ",a);return Da[a]=null}
function w(a,b,c){try{var d=Ga(b);if(d){if("-ms-writing-mode"===d)switch(c){case "horizontal-tb":c="lr-tb";break;case "vertical-rl":c="tb-rl";break;case "vertical-lr":c="tb-lr"}a&&a.style&&a.style.setProperty(d,c)}}catch(e){u.b(e)}}function Ha(a,b,c){try{return a.style.getPropertyValue(Da[b]||b)}catch(d){}return c||""}function Ia(){this.b=[]}Ia.prototype.append=function(a){this.b.push(a);return this};Ia.prototype.toString=function(){var a=this.b.join("");this.b=[a];return a};
function Ja(a){return"\\"+a.charCodeAt(0).toString(16)+" "}function Ka(a){return a.replace(/[^-_a-zA-Z0-9\u0080-\uFFFF]/g,Ja)}function La(a){return a.replace(/[\u0000-\u001F"]/g,Ja)}function Ma(a){return a.replace(/[\s+&?=#\u007F-\uFFFF]+/g,encodeURIComponent)}function Na(a){return!!a.match(/^[a-zA-Z\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]$/)}function Oa(a){return"\\u"+(65536|a.charCodeAt(0)).toString(16).substr(1)}
function xa(a){return a.replace(/[^-a-zA-Z0-9_]/g,Oa)}function Pa(a){if(!a)throw"Assert failed";}function Qa(a,b){for(var c=0,d=a;;){Pa(c<=d);Pa(0==c||!b(c-1));Pa(d==a||b(d));if(c==d)return c;var e=c+d>>1;b(e)?d=e:c=e+1}}function Ra(a,b){return a-b}function Sa(a,b){for(var c={},d=0;d<a.length;d++){var e=a[d],f=b(e);f&&!c[f]&&(c[f]=e)}return c}var Ta={};function Ua(a,b){for(var c={},d=0;d<a.length;d++){var e=a[d],f=b(e);f&&(c[f]?c[f].push(e):c[f]=[e])}return c}
function Va(a,b){for(var c=Array(a.length),d=0;d<a.length;d++)c[d]=b(a[d],d);return c}function Wa(a,b){var c={},d;for(d in a)c[d]=b(a[d],d);return c}function Xa(){this.e={}}function Ya(a,b){var c=a.e[b.type];if(c){b.target=a;b.currentTarget=a;for(var d=0;d<c.length;d++)c[d](b)}}Xa.prototype.addEventListener=function(a,b,c){c||((c=this.e[a])?c.push(b):this.e[a]=[b])};Xa.prototype.removeEventListener=function(a,b,c){!c&&(a=this.e[a])&&(b=a.indexOf(b),0<=b&&a.splice(b,0))};var Za=null;
function $a(a){if(null==Za){var b=a.ownerDocument,c=b.createElement("div");c.style.position="absolute";c.style.top="0px";c.style.left="0px";c.style.width="100px";c.style.height="100px";c.style.overflow="hidden";c.style.lineHeight="16px";c.style.fontSize="16px";a.appendChild(c);var d=b.createElement("div");d.style.width="0px";d.style.height="14px";d.style.cssFloat="left";c.appendChild(d);d=b.createElement("div");d.style.width="50px";d.style.height="50px";d.style.cssFloat="left";d.style.clear="left";
c.appendChild(d);d=b.createTextNode("a a a a a a a a a a a a a a a a");c.appendChild(d);b=b.createRange();b.setStart(d,0);b.setEnd(d,1);Za=40>b.getBoundingClientRect().left;a.removeChild(c)}return Za}var ab=null;function bb(a){return 1==a.nodeType&&(a=a.getAttribute("id"))&&a.match(/^[-a-zA-Z_0-9.\u007F-\uFFFF]+$/)?a:null}function cb(a){return"^"+a}function db(a){return a.substr(1)}function eb(a){return a?a.replace(/\^[\[\]\(\),=;^]/g,db):a}
function fb(a){for(var b={};a;){var c=a.match(/^;([^;=]+)=(([^;]|\^;)*)/);if(!c)break;var d=c[1],e;a:{e=c[2];var f=[];do{var g=e.match(/^(\^,|[^,])*/),h=eb(g[0]);e=e.substr(g[0].length+1);if(!e&&!f.length){e=h;break a}f.push(h)}while(e);e=f}b[d]=e;a=a.substr(c[0].length)}return b}function gb(){}gb.prototype.e=function(a){a.append("!")};gb.prototype.f=function(){return!1};function hb(a,b,c){this.b=a;this.id=b;this.Va=c}
hb.prototype.e=function(a){a.append("/");a.append(this.b.toString());if(this.id||this.Va)a.append("["),this.id&&a.append(this.id),this.Va&&(a.append(";s="),a.append(this.Va)),a.append("]")};
hb.prototype.f=function(a){if(1!=a.ha.nodeType)throw Error("E_CFI_NOT_ELEMENT");var b=a.ha,c=b.children,d=c.length,e=Math.floor(this.b/2)-1;0>e||0==d?(c=b.firstChild,a.ha=c||b):(c=c[Math.min(e,d-1)],this.b&1&&((b=c.nextSibling)&&1!=b.nodeType?c=b:a.L=!0),a.ha=c);if(this.id&&(a.L||this.id!=bb(a.ha)))throw Error("E_CFI_ID_MISMATCH");a.Va=this.Va;return!0};function ib(a,b,c,d){this.offset=a;this.d=b;this.b=c;this.Va=d}
ib.prototype.f=function(a){if(0<this.offset&&!a.L){for(var b=this.offset,c=a.ha;;){var d=c.nodeType;if(1==d)break;var e=c.nextSibling;if(3<=d&&5>=d){d=c.textContent.length;if(b<=d)break;if(!e){b=d;break}b-=d}if(!e){b=0;break}c=e}a.ha=c;a.offset=b}a.Va=this.Va;return!0};
ib.prototype.e=function(a){a.append(":");a.append(this.offset.toString());if(this.d||this.b||this.Va){a.append("[");if(this.d||this.b)this.d&&a.append(this.d.replace(/[\[\]\(\),=;^]/g,cb)),a.append(","),this.b&&a.append(this.b.replace(/[\[\]\(\),=;^]/g,cb));this.Va&&(a.append(";s="),a.append(this.Va));a.append("]")}};function jb(){this.ka=null}
function kb(a,b){var c=b.match(/^#?epubcfi\((.*)\)$/);if(!c)throw Error("E_CFI_NOT_CFI");for(var d=c[1],e=0,f=[];;)switch(d.charAt(e)){case "/":e++;c=d.substr(e).match(/^(0|[1-9][0-9]*)(\[([-a-zA-Z_0-9.\u007F-\uFFFF]+)(;([^\]]|\^\])*)?\])?/);if(!c)throw Error("E_CFI_NUMBER_EXPECTED");var e=e+c[0].length,g=parseInt(c[1],10),h=c[3],c=fb(c[4]);f.push(new hb(g,h,za(c.s)));break;case ":":e++;c=d.substr(e).match(/^(0|[1-9][0-9]*)(\[((([^\];,]|\^[\];,])*)(,(([^\];,]|\^[\];,])*))?)(;([^]]|\^\])*)?\])?/);
if(!c)throw Error("E_CFI_NUMBER_EXPECTED");e+=c[0].length;g=parseInt(c[1],10);(h=c[4])&&(h=eb(h));var l=c[7];l&&(l=eb(l));c=fb(c[10]);f.push(new ib(g,h,l,za(c.s)));break;case "!":e++;f.push(new gb);break;case "~":case "@":case "":a.ka=f;return;default:throw Error("E_CFI_PARSE_ERROR");}}function lb(a,b){for(var c={ha:b.documentElement,offset:0,L:!1,Va:null,Xb:null},d=0;d<a.ka.length;d++)if(!a.ka[d].f(c)){++d<a.ka.length&&(c.Xb=new jb,c.Xb.ka=a.ka.slice(d));break}return c}
jb.prototype.trim=function(a,b){return a.replace(/\s+/g," ").match(b?/^[ -\uD7FF\uE000-\uFFFF]{0,8}/:/[ -\uD7FF\uE000-\uFFFF]{0,8}$/)[0].replace(/^\s/,"").replace(/\s$/,"")};
function mb(a,b,c){for(var d=!1,e=null,f=[],g=b.parentNode,h="",l="";b;){switch(b.nodeType){case 3:case 4:case 5:var k=b.textContent,m=k.length;d?(c+=m,h||(h=k)):(c>m&&(c=m),d=!0,h=k.substr(0,c),l=k.substr(c));b=b.previousSibling;continue;case 8:b=b.previousSibling;continue}break}if(0<c||h||l)h=a.trim(h,!1),l=a.trim(l,!0),f.push(new ib(c,h,l,e)),e=null;for(;g&&g&&9!=g.nodeType;){c=d?null:bb(b);for(d=d?1:0;b;)1==b.nodeType&&(d+=2),b=b.previousSibling;f.push(new hb(d,c,e));e=null;b=g;g=g.parentNode;
d=!1}f.reverse();a.ka?(f.push(new gb),a.ka=f.concat(a.ka)):a.ka=f}jb.prototype.toString=function(){if(!this.ka)return"";var a=new Ia;a.append("epubcfi(");for(var b=0;b<this.ka.length;b++)this.ka[b].e(a);a.append(")");return a.toString()};function nb(a){a=a.substr(1);if(a.match(/^[^0-9a-fA-F\n\r]$/))return a;a=parseInt(a,16);return isNaN(a)?"":65535>=a?String.fromCharCode(a):1114111>=a?String.fromCharCode(55296|a>>10&1023,56320|a&1023):"\ufffd"}function ob(a){return a.replace(/\\([0-9a-fA-F]{0,6}(\r\n|[ \n\r\t\f])?|[^0-9a-fA-F\n\r])/g,nb)}function pb(){this.type=0;this.b=!1;this.B=0;this.text="";this.position=0}
function qb(a,b){var c=Array(128),d;for(d=0;128>d;d++)c[d]=a;c[NaN]=35==a?35:72;for(d=0;d<b.length;d+=2)c[b[d]]=b[d+1];return c}var rb=[72,72,72,72,72,72,72,72,72,1,1,72,1,1,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,1,4,34,6,7,8,9,33,10,11,12,13,14,15,16,17,2,2,2,2,2,2,2,2,2,2,18,19,20,21,22,23,24,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,25,29,26,30,3,72,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,27,31,28,32,72];rb[NaN]=80;
var sb=[43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,52,43,43,43,43,39,43,43,39,39,39,39,39,39,39,39,39,39,43,43,43,43,43,43,43,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,43,44,43,43,39,43,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,43,43,43,43,43];sb[NaN]=43;
var tb=[72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,78,59,72,59,59,59,59,59,59,59,59,59,59,72,72,72,72,72,72,72,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,72,61,72,72,78,72,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,72,72,72,72,72];sb[NaN]=43;
var ub=[35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,57,59,35,58,58,58,58,58,58,58,58,58,58,35,35,35,35,35,35,35,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,35,61,35,35,60,35,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,35,35,35,35,35];ub[NaN]=35;
var vb=[45,45,45,45,45,45,45,45,45,73,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,73,45,45,45,45,45,45,45,53,45,45,45,45,45,45,45,39,39,39,39,39,39,39,39,39,39,45,45,45,45,45,45,45,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,45,44,45,45,39,45,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,45,45,45,45,45];vb[NaN]=45;
var wb=[37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,41,37,37,37,37,37,37,37,37,42,37,39,39,39,39,39,39,39,39,39,39,37,37,37,37,37,37,37,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,37,37,37,37,40,37,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,37,37,37,37,37];wb[NaN]=37;
var xb=[38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,41,38,38,38,38,38,38,38,38,38,38,39,39,39,39,39,39,39,39,39,39,38,38,38,38,38,38,38,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,38,38,38,38,40,38,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,38,38,38,38,38];xb[NaN]=38;
var yb=qb(35,[61,36]),zb=qb(35,[58,77]),Ab=qb(35,[61,36,124,50]),Bb=qb(35,[38,51]),Cb=qb(35,[42,54]),Db=qb(39,[42,55]),Eb=qb(54,[42,55,47,56]),Fb=qb(62,[62,56]),Gb=qb(35,[61,36,33,70]),Hb=qb(62,[45,71]),Ib=qb(63,[45,56]),Jb=qb(76,[9,72,10,72,13,72,32,72]),Kb=qb(39,[39,46,10,72,13,72,92,48]),Lb=qb(39,[34,46,10,72,13,72,92,49]),Mb=qb(39,[39,47,10,74,13,74,92,48]),Nb=qb(39,[34,47,10,74,13,74,92,49]),Ob=qb(64,[9,39,32,39,34,66,39,65,41,72,10,39,13,39]),Pb=qb(39,[41,67,9,79,10,79,13,79,32,79,92,75,40,
72,91,72,93,72,123,72,125,72,NaN,67]),Qb=qb(39,[39,68,10,74,13,74,92,75,NaN,67]),Rb=qb(39,[34,68,10,74,13,74,92,75,NaN,67]),Sb=qb(72,[9,39,10,39,13,39,32,39,41,69]);function Tb(a,b){this.h=b;this.e=15;this.j=a;this.g=Array(this.e+1);this.b=-1;for(var c=this.position=this.d=this.f=0;c<=this.e;c++)this.g[c]=new pb}function x(a){a.f==a.d&&Ub(a);return a.g[a.d]}function z(a,b){(a.f-a.d&a.e)<=b&&Ub(a);return a.g[a.d+b&a.e]}function A(a){a.d=a.d+1&a.e}
function Vb(a){if(0>a.b)throw Error("F_CSSTOK_BAD_CALL reset");a.d=a.b;a.b=-1}Tb.prototype.error=function(a,b,c){this.h&&this.h.error(c,b)};
function Ub(a){var b=a.f,c=0<=a.b?a.b:a.d,d=a.e;b>=c?c+=d:c--;if(c==b){if(0>a.b)throw Error("F_CSSTOK_INTERNAL");for(var b=2*(a.e+1)-1,c=Array(b+1),d=a.b,e=0;d!=a.f;)c[e]=a.g[d],d==a.d&&(a.d=e),d=d+1&a.e,e++;a.b=0;a.f=e;a.e=b;for(a.g=c;e<=b;)c[e++]=new pb;b=a.f;c=d=a.e}for(var e=rb,f=a.j,g=a.position,h=a.g,l=0,k=0,m="",p=0,q=!1,v=h[b],r=-9;;){var y=f.charCodeAt(g);switch(e[y]||e[65]){case 72:l=51;m=isNaN(y)?"E_CSS_UNEXPECTED_EOF":"E_CSS_UNEXPECTED_CHAR";g++;break;case 1:g++;q=!0;continue;case 2:k=
g++;e=wb;continue;case 3:l=1;k=g++;e=sb;continue;case 4:k=g++;l=31;e=yb;continue;case 33:l=2;k=++g;e=Kb;continue;case 34:l=2;k=++g;e=Lb;continue;case 6:k=++g;l=7;e=sb;continue;case 7:k=g++;l=32;e=yb;continue;case 8:k=g++;l=21;break;case 9:k=g++;l=32;e=Bb;continue;case 10:k=g++;l=10;break;case 11:k=g++;l=11;break;case 12:k=g++;l=36;e=yb;continue;case 13:k=g++;l=23;break;case 14:k=g++;l=16;break;case 15:l=24;k=g++;e=ub;continue;case 16:k=g++;e=tb;continue;case 78:k=g++;l=9;e=sb;continue;case 17:k=g++;
l=19;e=Cb;continue;case 18:k=g++;l=18;e=zb;continue;case 77:g++;l=50;break;case 19:k=g++;l=17;break;case 20:k=g++;l=38;e=Gb;continue;case 21:k=g++;l=39;e=yb;continue;case 22:k=g++;l=37;e=yb;continue;case 23:k=g++;l=22;break;case 24:k=++g;l=20;e=sb;continue;case 25:k=g++;l=14;break;case 26:k=g++;l=15;break;case 27:k=g++;l=12;break;case 28:k=g++;l=13;break;case 29:r=k=g++;l=1;e=Jb;continue;case 30:k=g++;l=33;e=yb;continue;case 31:k=g++;l=34;e=Ab;continue;case 32:k=g++;l=35;e=yb;continue;case 35:break;
case 36:g++;l=l+41-31;break;case 37:l=5;p=parseInt(f.substring(k,g),10);break;case 38:l=4;p=parseFloat(f.substring(k,g));break;case 39:g++;continue;case 40:l=3;p=parseFloat(f.substring(k,g));k=g++;e=sb;continue;case 41:l=3;p=parseFloat(f.substring(k,g));m="%";k=g++;break;case 42:g++;e=xb;continue;case 43:m=f.substring(k,g);break;case 44:r=g++;e=Jb;continue;case 45:m=ob(f.substring(k,g));break;case 46:m=f.substring(k,g);g++;break;case 47:m=ob(f.substring(k,g));g++;break;case 48:r=g;g+=2;e=Mb;continue;
case 49:r=g;g+=2;e=Nb;continue;case 50:g++;l=25;break;case 51:g++;l=26;break;case 52:m=f.substring(k,g);if(1==l){g++;if("url"==m.toLowerCase()){e=Ob;continue}l=6}break;case 53:m=ob(f.substring(k,g));if(1==l){g++;if("url"==m.toLowerCase()){e=Ob;continue}l=6}break;case 54:e=Db;g++;continue;case 55:e=Eb;g++;continue;case 56:e=rb;g++;continue;case 57:e=Fb;g++;continue;case 58:l=5;e=wb;g++;continue;case 59:l=4;e=xb;g++;continue;case 60:l=1;e=sb;g++;continue;case 61:l=1;e=Jb;r=g++;continue;case 62:g--;
break;case 63:g-=2;break;case 64:k=g++;e=Pb;continue;case 65:k=++g;e=Qb;continue;case 66:k=++g;e=Rb;continue;case 67:l=8;m=ob(f.substring(k,g));g++;break;case 69:g++;break;case 70:e=Hb;g++;continue;case 71:e=Ib;g++;continue;case 79:if(8>g-r&&f.substring(r+1,g+1).match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])|[ \t]$/)){g++;continue}case 68:l=8;m=ob(f.substring(k,g));g++;e=Sb;continue;case 74:g++;if(9>g-r&&f.substring(r+1,g).match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])$/))continue;l=51;m="E_CSS_UNEXPECTED_NEWLINE";
break;case 73:if(9>g-r&&f.substring(r+1,g+1).match(/^[0-9a-fA-F]{0,6}[ \t]$/)){g++;continue}m=ob(f.substring(k,g));break;case 75:r=g++;continue;case 76:g++;e=vb;continue;default:if(e!==rb){l=51;m="E_CSS_UNEXPECTED_STATE";break}k=g;l=0}v.type=l;v.b=q;v.B=p;v.text=m;v.position=k;b++;if(b>=c)break;e=rb;q=!1;v=h[b&d]}a.position=g;a.f=b&d};function Wb(){return{fontFamily:"serif",lineHeight:1.25,margin:8,Lc:!0,Gc:25,Kc:!1,Sc:!1,Wa:!1,Gb:1,fd:{print:!0}}}function Xb(a){return{fontFamily:a.fontFamily,lineHeight:a.lineHeight,margin:a.margin,Lc:a.Lc,Gc:a.Gc,Kc:a.Kc,Sc:a.Sc,Wa:a.Wa,Gb:a.Gb,fd:Object.Qb({},a.fd)}}var Yb=Wb(),Zb={};function $b(a,b,c,d){a=Math.min((a-0)/c,(b-0)/d);return"matrix("+a+",0,0,"+a+",0,0)"}function ac(a){return'"'+La(a+"")+'"'}function bc(a){return Ka(a+"")}function dc(a,b){return a?Ka(a)+"."+Ka(b):Ka(b)}var ec=0;
function fc(a,b){this.parent=a;this.j="S"+ec++;this.children=[];this.b=new gc(this,0);this.d=new gc(this,1);this.g=new gc(this,!0);this.f=new gc(this,!1);a&&a.children.push(this);this.values={};this.l={};this.k={};this.h=b;if(!a){var c=this.k;c.floor=Math.floor;c.ceil=Math.ceil;c.round=Math.round;c.sqrt=Math.sqrt;c.min=Math.min;c.max=Math.max;c.letterbox=$b;c["css-string"]=ac;c["css-name"]=bc;c["typeof"]=function(a){return typeof a};hc(this,"page-width",function(){return this.lb()});hc(this,"page-height",
function(){return this.kb()});hc(this,"pref-font-family",function(){return this.S.fontFamily});hc(this,"pref-night-mode",function(){return this.S.Sc});hc(this,"pref-hyphenate",function(){return this.S.Lc});hc(this,"pref-margin",function(){return this.S.margin});hc(this,"pref-line-height",function(){return this.S.lineHeight});hc(this,"pref-column-width",function(){return this.S.Gc*this.fontSize});hc(this,"pref-horizontal",function(){return this.S.Kc});hc(this,"pref-spread-view",function(){return this.S.Wa})}}
function hc(a,b,c){a.values[b]=new ic(a,c,b)}function jc(a,b){a.values["page-number"]=b}function kc(a,b){a.k["has-content"]=b}var lc={px:1,"in":96,pt:4/3,pc:16,cm:96/2.54,mm:96/25.4,q:96/2.54/40,em:16,rem:16,ex:8,rex:8};function mc(a){switch(a){case "q":case "rem":case "rex":return!0;default:return!1}}
function nc(a,b,c,d){this.sa=b;this.Qa=c;this.D=null;this.lb=function(){return this.D?this.D:this.S.Wa?Math.floor(b/2)-this.S.Gb:b};this.A=null;this.kb=function(){return this.A?this.A:c};this.h=d;this.$=null;this.fontSize=function(){return this.$?this.$:d};this.S=Yb;this.u={}}function oc(a,b){a.u[b.j]={};for(var c=0;c<b.children.length;c++)oc(a,b.children[c])}
function pc(a,b,c){return"vw"==b?a.lb()/100:"vh"==b?a.kb()/100:"em"==b||"rem"==b?c?a.h:a.fontSize():"ex"==b||"rex"==b?lc.ex*(c?a.h:a.fontSize())/lc.em:lc[b]}function qc(a,b,c){do{var d=b.values[c];if(d||b.h&&(d=b.h.call(a,c,!1)))return d;b=b.parent}while(b);throw Error("Name '"+c+"' is undefined");}
function rc(a,b,c,d,e){do{var f=b.l[c];if(f||b.h&&(f=b.h.call(a,c,!0)))return f;if(f=b.k[c]){if(e)return b.b;c=Array(d.length);for(e=0;e<d.length;e++)c[e]=d[e].evaluate(a);return new gc(b,f.apply(a,c))}b=b.parent}while(b);throw Error("Function '"+c+"' is undefined");}
function sc(a,b,c){var d="",e=b.match(/^(min|max)-(.*)$/);e&&(d=e[1],b=e[2]);var f=e=null;switch(b){case "width":case "height":case "device-width":case "device-height":case "color":c&&(e=c.evaluate(a))}switch(b){case "width":f=a.lb();break;case "height":f=a.kb();break;case "device-width":f=window.screen.availWidth;break;case "device-height":f=window.screen.availHeight;break;case "color":f=window.screen.pixelDepth}if(null!=f&&null!=e)switch(d){case "min":return f>=e;case "max":return f<=e;default:return f==
e}else if(null!=f&&null==c)return 0!==f;return!1}function B(a){this.b=a;this.f="_"+ec++}n=B.prototype;n.toString=function(){var a=new Ia;this.la(a,0);return a.toString()};n.la=function(){throw Error("F_ABSTRACT");};n.Ma=function(){throw Error("F_ABSTRACT");};n.Ca=function(){return this};n.vb=function(a){return a===this};function tc(a,b,c,d){var e=d[a.f];if(null!=e)return e===Zb?!1:e;d[a.f]=Zb;b=a.vb(b,c,d);return d[a.f]=b}
n.evaluate=function(a){var b;b=(b=a.u[this.b.j])?b[this.f]:void 0;if("undefined"!=typeof b)return b;b=this.Ma(a);var c=this.f,d=this.b,e=a.u[d.j];e||(e={},a.u[d.j]=e);return e[c]=b};n.jd=function(){return!1};function uc(a,b){B.call(this,a);this.d=b}t(uc,B);n=uc.prototype;n.ed=function(){throw Error("F_ABSTRACT");};n.gd=function(){throw Error("F_ABSTRACT");};n.Ma=function(a){a=this.d.evaluate(a);return this.gd(a)};n.vb=function(a,b,c){return a===this||tc(this.d,a,b,c)};
n.la=function(a,b){10<b&&a.append("(");a.append(this.ed());this.d.la(a,10);10<b&&a.append(")")};n.Ca=function(a,b){var c=this.d.Ca(a,b);return c===this.d?this:new this.constructor(this.b,c)};function C(a,b,c){B.call(this,a);this.d=b;this.e=c}t(C,B);n=C.prototype;n.fc=function(){throw Error("F_ABSTRACT");};n.Ba=function(){throw Error("F_ABSTRACT");};n.Sa=function(){throw Error("F_ABSTRACT");};n.Ma=function(a){var b=this.d.evaluate(a);a=this.e.evaluate(a);return this.Sa(b,a)};
n.vb=function(a,b,c){return a===this||tc(this.d,a,b,c)||tc(this.e,a,b,c)};n.la=function(a,b){var c=this.fc();c<=b&&a.append("(");this.d.la(a,c);a.append(this.Ba());this.e.la(a,c);c<=b&&a.append(")")};n.Ca=function(a,b){var c=this.d.Ca(a,b),d=this.e.Ca(a,b);return c===this.d&&d===this.e?this:new this.constructor(this.b,c,d)};function vc(a,b,c){C.call(this,a,b,c)}t(vc,C);vc.prototype.fc=function(){return 1};function wc(a,b,c){C.call(this,a,b,c)}t(wc,C);wc.prototype.fc=function(){return 2};
function xc(a,b,c){C.call(this,a,b,c)}t(xc,C);xc.prototype.fc=function(){return 3};function yc(a,b,c){C.call(this,a,b,c)}t(yc,C);yc.prototype.fc=function(){return 4};function zc(a,b){uc.call(this,a,b)}t(zc,uc);zc.prototype.ed=function(){return"!"};zc.prototype.gd=function(a){return!a};function Ac(a,b){uc.call(this,a,b)}t(Ac,uc);Ac.prototype.ed=function(){return"-"};Ac.prototype.gd=function(a){return-a};function Bc(a,b,c){C.call(this,a,b,c)}t(Bc,vc);Bc.prototype.Ba=function(){return"&&"};
Bc.prototype.Ma=function(a){return this.d.evaluate(a)&&this.e.evaluate(a)};function Cc(a,b,c){C.call(this,a,b,c)}t(Cc,Bc);Cc.prototype.Ba=function(){return" and "};function Dc(a,b,c){C.call(this,a,b,c)}t(Dc,vc);Dc.prototype.Ba=function(){return"||"};Dc.prototype.Ma=function(a){return this.d.evaluate(a)||this.e.evaluate(a)};function Ec(a,b,c){C.call(this,a,b,c)}t(Ec,Dc);Ec.prototype.Ba=function(){return", "};function Fc(a,b,c){C.call(this,a,b,c)}t(Fc,wc);Fc.prototype.Ba=function(){return"<"};
Fc.prototype.Sa=function(a,b){return a<b};function Gc(a,b,c){C.call(this,a,b,c)}t(Gc,wc);Gc.prototype.Ba=function(){return"<="};Gc.prototype.Sa=function(a,b){return a<=b};function Hc(a,b,c){C.call(this,a,b,c)}t(Hc,wc);Hc.prototype.Ba=function(){return">"};Hc.prototype.Sa=function(a,b){return a>b};function Ic(a,b,c){C.call(this,a,b,c)}t(Ic,wc);Ic.prototype.Ba=function(){return">="};Ic.prototype.Sa=function(a,b){return a>=b};function Jc(a,b,c){C.call(this,a,b,c)}t(Jc,wc);Jc.prototype.Ba=function(){return"=="};
Jc.prototype.Sa=function(a,b){return a==b};function Kc(a,b,c){C.call(this,a,b,c)}t(Kc,wc);Kc.prototype.Ba=function(){return"!="};Kc.prototype.Sa=function(a,b){return a!=b};function Lc(a,b,c){C.call(this,a,b,c)}t(Lc,xc);Lc.prototype.Ba=function(){return"+"};Lc.prototype.Sa=function(a,b){return a+b};function Mc(a,b,c){C.call(this,a,b,c)}t(Mc,xc);Mc.prototype.Ba=function(){return" - "};Mc.prototype.Sa=function(a,b){return a-b};function Nc(a,b,c){C.call(this,a,b,c)}t(Nc,yc);Nc.prototype.Ba=function(){return"*"};
Nc.prototype.Sa=function(a,b){return a*b};function Oc(a,b,c){C.call(this,a,b,c)}t(Oc,yc);Oc.prototype.Ba=function(){return"/"};Oc.prototype.Sa=function(a,b){return a/b};function Pc(a,b,c){C.call(this,a,b,c)}t(Pc,yc);Pc.prototype.Ba=function(){return"%"};Pc.prototype.Sa=function(a,b){return a%b};function Qc(a,b,c){B.call(this,a);this.B=b;this.fa=c.toLowerCase()}t(Qc,B);Qc.prototype.la=function(a){a.append(this.B.toString());a.append(Ka(this.fa))};
Qc.prototype.Ma=function(a){return this.B*pc(a,this.fa,!1)};function Rc(a,b){B.call(this,a);this.d=b}t(Rc,B);Rc.prototype.la=function(a){a.append(this.d)};Rc.prototype.Ma=function(a){return qc(a,this.b,this.d).evaluate(a)};Rc.prototype.vb=function(a,b,c){return a===this||tc(qc(b,this.b,this.d),a,b,c)};function Sc(a,b,c){B.call(this,a);this.d=b;this.name=c}t(Sc,B);Sc.prototype.la=function(a){this.d&&a.append("not ");a.append(Ka(this.name))};
Sc.prototype.Ma=function(a){var b=this.name;a="all"===b||!!a.S.fd[b];return this.d?!a:a};Sc.prototype.vb=function(a,b,c){return a===this||tc(this.value,a,b,c)};Sc.prototype.jd=function(){return!0};function ic(a,b,c){B.call(this,a);this.Eb=b;this.d=c}t(ic,B);ic.prototype.la=function(a){a.append(this.d)};ic.prototype.Ma=function(a){return this.Eb.call(a)};function Tc(a,b,c){B.call(this,a);this.e=b;this.d=c}t(Tc,B);
Tc.prototype.la=function(a){a.append(this.e);var b=this.d;a.append("(");for(var c=0;c<b.length;c++)c&&a.append(","),b[c].la(a,0);a.append(")")};Tc.prototype.Ma=function(a){return rc(a,this.b,this.e,this.d,!1).Ca(a,this.d).evaluate(a)};Tc.prototype.vb=function(a,b,c){if(a===this)return!0;for(var d=0;d<this.d.length;d++)if(tc(this.d[d],a,b,c))return!0;return tc(rc(b,this.b,this.e,this.d,!0),a,b,c)};
Tc.prototype.Ca=function(a,b){for(var c,d=c=this.d,e=0;e<c.length;e++){var f=c[e].Ca(a,b);if(c!==d)d[e]=f;else if(f!==c[e]){for(var d=Array(c.length),g=0;g<e;g++)d[g]=c[g];d[e]=f}}c=d;return c===this.d?this:new Tc(this.b,this.e,c)};function Uc(a,b,c,d){B.call(this,a);this.d=b;this.g=c;this.e=d}t(Uc,B);Uc.prototype.la=function(a,b){0<b&&a.append("(");this.d.la(a,0);a.append("?");this.g.la(a,0);a.append(":");this.e.la(a,0);0<b&&a.append(")")};
Uc.prototype.Ma=function(a){return this.d.evaluate(a)?this.g.evaluate(a):this.e.evaluate(a)};Uc.prototype.vb=function(a,b,c){return a===this||tc(this.d,a,b,c)||tc(this.g,a,b,c)||tc(this.e,a,b,c)};Uc.prototype.Ca=function(a,b){var c=this.d.Ca(a,b),d=this.g.Ca(a,b),e=this.e.Ca(a,b);return c===this.d&&d===this.g&&e===this.e?this:new Uc(this.b,c,d,e)};function gc(a,b){B.call(this,a);this.d=b}t(gc,B);
gc.prototype.la=function(a){switch(typeof this.d){case "number":case "boolean":a.append(this.d.toString());break;case "string":a.append('"');a.append(La(this.d));a.append('"');break;default:throw Error("F_UNEXPECTED_STATE");}};gc.prototype.Ma=function(){return this.d};function Vc(a,b,c){B.call(this,a);this.name=b;this.value=c}t(Vc,B);Vc.prototype.la=function(a){a.append("(");a.append(La(this.name.name));a.append(":");this.value.la(a,0);a.append(")")};
Vc.prototype.Ma=function(a){return sc(a,this.name.name,this.value)};Vc.prototype.vb=function(a,b,c){return a===this||tc(this.value,a,b,c)};Vc.prototype.Ca=function(a,b){var c=this.value.Ca(a,b);return c===this.value?this:new Vc(this.b,this.name,c)};function Wc(a,b){B.call(this,a);this.d=b}t(Wc,B);Wc.prototype.la=function(a){a.append("$");a.append(this.d.toString())};Wc.prototype.Ca=function(a,b){var c=b[this.d];if(!c)throw Error("Parameter missing: "+this.d);return c};
function Xc(a,b,c){return b===a.f||b===a.b||c==a.f||c==a.b?a.f:b===a.g||b===a.d?c:c===a.g||c===a.d?b:new Bc(a,b,c)}function D(a,b,c){return b===a.b?c:c===a.b?b:new Lc(a,b,c)}function E(a,b,c){return b===a.b?new Ac(a,c):c===a.b?b:new Mc(a,b,c)}function Yc(a,b,c){return b===a.b||c===a.b?a.b:b===a.d?c:c===a.d?b:new Nc(a,b,c)}function Zc(a,b,c){return b===a.b?a.b:c===a.d?b:new Oc(a,b,c)};var $c={};function ad(){}n=ad.prototype;n.qb=function(a){for(var b=0;b<a.length;b++)a[b].T(this)};n.$c=function(){throw Error("E_CSS_EMPTY_NOT_ALLOWED");};n.ad=function(){throw Error("E_CSS_SLASH_NOT_ALLOWED");};n.cc=function(){throw Error("E_CSS_STR_NOT_ALLOWED");};n.pb=function(){throw Error("E_CSS_IDENT_NOT_ALLOWED");};n.Nb=function(){throw Error("E_CSS_NUMERIC_NOT_ALLOWED");};n.Mb=function(){throw Error("E_CSS_NUM_NOT_ALLOWED");};n.Lb=function(a){return this.Mb(a)};
n.zc=function(){throw Error("E_CSS_COLOR_NOT_ALLOWED");};n.dc=function(){throw Error("E_CSS_URL_NOT_ALLOWED");};n.ab=function(){throw Error("E_CSS_LIST_NOT_ALLOWED");};n.ob=function(){throw Error("E_CSS_COMMA_NOT_ALLOWED");};n.yb=function(){throw Error("E_CSS_FUNC_NOT_ALLOWED");};n.Kb=function(){throw Error("E_CSS_EXPR_NOT_ALLOWED");};function bd(){}t(bd,ad);n=bd.prototype;
n.qb=function(a){for(var b=null,c=0;c<a.length;c++){var d=a[c],e=d.T(this);if(b)b[c]=e;else if(d!==e){b=Array(a.length);for(d=0;d<c;d++)b[d]=a[d];b[c]=e}}return b||a};n.cc=function(a){return a};n.pb=function(a){return a};n.ad=function(a){return a};n.Nb=function(a){return a};n.Mb=function(a){return a};n.Lb=function(a){return a};n.zc=function(a){return a};n.dc=function(a){return a};n.ab=function(a){var b=this.qb(a.values);return b===a.values?a:new cd(b)};
n.ob=function(a){var b=this.qb(a.values);return b===a.values?a:new dd(b)};n.yb=function(a){var b=this.qb(a.values);return b===a.values?a:new ed(a.name,b)};n.Kb=function(a){return a};function fd(){}n=fd.prototype;n.toString=function(){var a=new Ia;this.ya(a,!0);return a.toString()};n.stringValue=function(){var a=new Ia;this.ya(a,!1);return a.toString()};n.ia=function(){throw Error("F_ABSTRACT");};n.ya=function(a){a.append("[error]")};n.hd=function(){return!1};n.Tb=function(){return!1};n.kd=function(){return!1};
n.zd=function(){return!1};n.Qc=function(){return!1};function gd(){if(G)throw Error("E_INVALID_CALL");}t(gd,fd);gd.prototype.ia=function(a){return new gc(a,"")};gd.prototype.ya=function(){};gd.prototype.T=function(a){return a.$c(this)};var G=new gd;function hd(){if(id)throw Error("E_INVALID_CALL");}t(hd,fd);hd.prototype.ia=function(a){return new gc(a,"/")};hd.prototype.ya=function(a){a.append("/")};hd.prototype.T=function(a){return a.ad(this)};var id=new hd;function jd(a){this.b=a}t(jd,fd);
jd.prototype.ia=function(a){return new gc(a,this.b)};jd.prototype.ya=function(a,b){b?(a.append('"'),a.append(La(this.b)),a.append('"')):a.append(this.b)};jd.prototype.T=function(a){return a.cc(this)};function kd(a){this.name=a;if($c[a])throw Error("E_INVALID_CALL");$c[a]=this}t(kd,fd);kd.prototype.ia=function(a){return new gc(a,this.name)};kd.prototype.ya=function(a,b){b?a.append(Ka(this.name)):a.append(this.name)};kd.prototype.T=function(a){return a.pb(this)};kd.prototype.zd=function(){return!0};
function H(a){var b=$c[a];b||(b=new kd(a));return b}function I(a,b){this.B=a;this.fa=b.toLowerCase()}t(I,fd);I.prototype.ia=function(a,b){return 0==this.B?a.b:b&&"%"==this.fa?100==this.B?b:new Nc(a,b,new gc(a,this.B/100)):new Qc(a,this.B,this.fa)};I.prototype.ya=function(a){a.append(this.B.toString());a.append(this.fa)};I.prototype.T=function(a){return a.Nb(this)};I.prototype.Tb=function(){return!0};function ld(a){this.B=a}t(ld,fd);
ld.prototype.ia=function(a){return 0==this.B?a.b:1==this.B?a.d:new gc(a,this.B)};ld.prototype.ya=function(a){a.append(this.B.toString())};ld.prototype.T=function(a){return a.Mb(this)};ld.prototype.kd=function(){return!0};function md(a){this.B=a}t(md,ld);md.prototype.T=function(a){return a.Lb(this)};function nd(a){this.b=a}t(nd,fd);nd.prototype.ya=function(a){a.append("#");var b=this.b.toString(16);a.append("000000".substr(b.length));a.append(b)};nd.prototype.T=function(a){return a.zc(this)};
function od(a){this.url=a}t(od,fd);od.prototype.ya=function(a){a.append('url("');a.append(La(this.url));a.append('")')};od.prototype.T=function(a){return a.dc(this)};function pd(a,b,c,d){var e=b.length;b[0].ya(a,d);for(var f=1;f<e;f++)a.append(c),b[f].ya(a,d)}function cd(a){this.values=a}t(cd,fd);cd.prototype.ya=function(a,b){pd(a,this.values," ",b)};cd.prototype.T=function(a){return a.ab(this)};cd.prototype.Qc=function(){return!0};function dd(a){this.values=a}t(dd,fd);
dd.prototype.ya=function(a,b){pd(a,this.values,",",b)};dd.prototype.T=function(a){return a.ob(this)};function ed(a,b){this.name=a;this.values=b}t(ed,fd);ed.prototype.ya=function(a,b){a.append(Ka(this.name));a.append("(");pd(a,this.values,",",b);a.append(")")};ed.prototype.T=function(a){return a.yb(this)};function K(a){this.d=a}t(K,fd);K.prototype.ia=function(){return this.d};K.prototype.ya=function(a){a.append("-epubx-expr(");this.d.la(a,0);a.append(")")};K.prototype.T=function(a){return a.Kb(this)};
K.prototype.hd=function(){return!0};function qd(a,b){if(a){if(a.Tb())return pc(b,a.fa,!1)*a.B;if(a.kd())return a.B}return 0}var rd=H("absolute"),sd=H("all"),td=H("always"),ud=H("auto");H("avoid");
var vd=H("block"),wd=H("block-end"),xd=H("block-start"),yd=H("both"),zd=H("bottom"),Ad=H("crop"),Bd=H("cross"),Cd=H("exclusive"),Dd=H("false"),Ed=H("flex"),Fd=H("footnote"),Gd=H("hidden"),Hd=H("horizontal-tb"),Id=H("inherit"),Jd=H("inline"),Kd=H("inline-end"),Ld=H("inline-start"),Md=H("landscape"),Nd=H("left"),Od=H("list-item"),Pd=H("ltr"),Qd=H("none"),Rd=H("normal"),Sd=H("oeb-page-foot"),Td=H("oeb-page-head"),Ud=H("page"),Vd=H("relative"),Wd=H("right"),Xd=H("scale"),Yd=H("static"),Zd=H("rtl");H("table");
var $d=H("table-row"),ae=H("top"),be=H("transparent"),ce=H("vertical-lr"),de=H("vertical-rl"),ee=H("visible"),fe=H("true"),ge=new I(100,"%"),he=new I(100,"vw"),ie=new I(100,"vh"),je=new I(0,"px"),ke={"font-size":1,color:2};function le(a,b){return(ke[a]||Number.MAX_VALUE)-(ke[b]||Number.MAX_VALUE)};function me(a,b,c,d){this.X=a;this.V=b;this.U=c;this.Q=d}function ne(a,b){this.x=a;this.y=b}function oe(){this.bottom=this.right=this.top=this.left=0}function pe(a,b,c,d){this.b=a;this.d=b;this.f=c;this.e=d}function qe(a,b,c,d){this.V=a;this.Q=b;this.X=c;this.U=d;this.right=this.left=null}function re(a,b){return a.b.y-b.b.y||a.b.x-b.b.x}function se(a){this.b=a}function te(a,b,c){a=a.b;for(var d=a.length,e=a[d-1],f=0;f<d;f++){var g=a[f];b.push(e.y<g.y?new pe(e,g,1,c):new pe(g,e,-1,c));e=g}}
function ue(a,b,c){for(var d=[],e=0;e<a.b.length;e++){var f=a.b[e];d.push(new ne(f.x+b,f.y+c))}return new se(d)}function ve(a,b,c,d){for(var e=[],f=0;20>f;f++){var g=2*f*Math.PI/20;e.push(new ne(a+c*Math.sin(g),b+d*Math.cos(g)))}return new se(e)}function we(a,b,c,d){return new se([new ne(a,b),new ne(c,b),new ne(c,d),new ne(a,d)])}function xe(a,b,c,d){this.x=a;this.e=b;this.b=c;this.d=d}
function ye(a,b){var c=a.b.x+(a.d.x-a.b.x)*(b-a.b.y)/(a.d.y-a.b.y);if(isNaN(c))throw Error("Bad intersection");return c}function ze(a,b,c,d){var e,f;b.d.y<c&&u.b("Error: inconsistent segment (1)");b.b.y<=c?(c=ye(b,c),e=b.f):(c=b.b.x,e=0);b.d.y>=d?(d=ye(b,d),f=b.f):(d=b.d.x,f=0);c<d?(a.push(new xe(c,e,b.e,-1)),a.push(new xe(d,f,b.e,1))):(a.push(new xe(d,f,b.e,-1)),a.push(new xe(c,e,b.e,1)))}
function Ae(a,b,c){c=b+c;for(var d=Array(c),e=Array(c),f=0;f<=c;f++)d[f]=0,e[f]=0;for(var g=[],h=!1,l=a.length,k=0;k<l;k++){var m=a[k];d[m.b]+=m.e;e[m.b]+=m.d;for(var p=!1,f=0;f<b;f++)if(d[f]&&!e[f]){p=!0;break}if(p)for(f=b;f<=c;f++)if(d[f]||e[f]){p=!1;break}h!=p&&(g.push(m.x),h=p)}return g}function Be(a,b){return b?Math.ceil(a/b)*b:a}function Ce(a,b){return b?Math.floor(a/b)*b:a}function De(a){return new ne(a.y,-a.x)}function Ee(a){return new me(a.V,-a.U,a.Q,-a.X)}
function Fe(a){return new se(Va(a.b,De))}
function Ge(a,b,c,d,e){e&&(a=Ee(a),b=Va(b,Fe),c=Va(c,Fe));e=b.length;var f=c?c.length:0,g=[],h=[],l,k,m;for(l=0;l<e;l++)te(b[l],h,l);for(l=0;l<f;l++)te(c[l],h,l+e);b=h.length;h.sort(re);for(c=0;h[c].e>=e;)c++;c=h[c].b.y;c>a.V&&g.push(new qe(a.V,c,a.U,a.U));l=0;for(var p=[];l<b&&(m=h[l]).b.y<c;)m.d.y>c&&p.push(m),l++;for(;l<b||0<p.length;){var q=a.Q,v=Be(Math.ceil(c+8),d);for(k=0;k<p.length&&q>v;k++)m=p[k],m.b.x==m.d.x?m.d.y<q&&(q=Math.max(Ce(m.d.y,d),v)):m.b.x!=m.d.x&&(q=v);q>a.Q&&(q=a.Q);for(;l<
b&&(m=h[l]).b.y<q;)if(m.d.y<c)l++;else if(m.b.y<v){if(m.b.y!=m.d.y||m.b.y!=c)p.push(m),q=v;l++}else{k=Ce(m.b.y,d);k<q&&(q=k);break}v=[];for(k=0;k<p.length;k++)ze(v,p[k],c,q);v.sort(function(a,b){return a.x-b.x||a.d-b.d});v=Ae(v,e,f);if(0==v.length)g.push(new qe(c,q,a.U,a.U));else{var r=0,y=a.X;for(k=0;k<v.length;k+=2){var J=Math.max(a.X,v[k]),W=Math.min(a.U,v[k+1])-J;W>r&&(r=W,y=J)}0==r?g.push(new qe(c,q,a.U,a.U)):g.push(new qe(c,q,Math.max(y,a.X),Math.min(y+r,a.U)))}if(q==a.Q)break;c=q;for(k=p.length-
1;0<=k;k--)p[k].d.y<=q&&p.splice(k,1)}He(a,g);return g}function He(a,b){for(var c=b.length-1,d=new qe(a.Q,a.Q,a.X,a.U);0<=c;){var e=d,d=b[c];d.X==e.X&&d.U==e.U&&(e.V=d.V,b.splice(c,1),d=e);c--}}function Ie(a,b){for(var c=0,d=a.length;c<d;){var e=Math.floor((c+d)/2);b>=a[e].Q?c=e+1:d=e}return c}
function Je(a,b,c,d){for(var e=c.V,f=c.U-c.X,g=c.Q-c.V,h=Ie(b,e);;){var l=e+g;if(l>a.Q)break;for(var k=a.X,m=a.U,p=h;p<b.length&&b[p].V<l;p++){var q=b[p];q.X>k&&(k=q.X);q.U<m&&(m=q.U)}if(k+f<=m||h>=b.length){"left"==d?(c.X=k,c.U=k+f):(c.X=m-f,c.U=m);c.Q+=e-c.V;c.V=e;break}e=b[h].Q;h++}}
function Ke(a,b,c,d){for(var e=null,e=[new qe(c.V,c.Q,c.X,c.U)];0<e.length&&e[0].Q<=a.V;)e.shift();if(0!=e.length){e[0].V<a.V&&(e[0].V=a.V);c=0==b.length?a.V:b[b.length-1].Q;c<a.Q&&b.push(new qe(c,a.Q,a.X,a.U));for(var f=Ie(b,e[0].V),g=0;g<e.length;g++){var h=e[g];if(f==b.length)break;b[f].V<h.V&&(c=b[f],f++,b.splice(f,0,new qe(h.V,c.Q,c.X,c.U)),c.Q=h.V);for(;f<b.length&&(c=b[f++],c.Q>h.Q&&(b.splice(f,0,new qe(h.Q,c.Q,c.X,c.U)),c.Q=h.Q),h.X!=h.U&&("left"==d?c.X=h.U:c.U=h.X),c.Q!=h.Q););}He(a,b)}}
;function Le(a){return String.fromCharCode(a>>>24&255,a>>>16&255,a>>>8&255,a&255)}
function Me(a){var b=new Ia;b.append(a);var c=55-a.length&63;for(b.append("\u0080");0<c;)c--,b.append("\x00");b.append("\x00\x00\x00\x00");b.append(Le(8*a.length));a=b.toString();for(var b=[1732584193,4023233417,2562383102,271733878,3285377520],c=[],d,e=0;e<a.length;e+=64){for(d=0;16>d;d++){var f=a.substr(e+4*d,4);c[d]=(f.charCodeAt(0)&255)<<24|(f.charCodeAt(1)&255)<<16|(f.charCodeAt(2)&255)<<8|f.charCodeAt(3)&255}for(;80>d;d++)f=c[d-3]^c[d-8]^c[d-14]^c[d-16],c[d]=f<<1|f>>>31;var f=b[0],g=b[1],h=
b[2],l=b[3],k=b[4],m;for(d=0;80>d;d++)m=20>d?(g&h|~g&l)+1518500249:40>d?(g^h^l)+1859775393:60>d?(g&h|g&l|h&l)+2400959708:(g^h^l)+3395469782,m+=(f<<5|f>>>27)+k+c[d],k=l,l=h,h=g<<30|g>>>2,g=f,f=m;b[0]=b[0]+f|0;b[1]=b[1]+g|0;b[2]=b[2]+h|0;b[3]=b[3]+l|0;b[4]=b[4]+k|0}return b}function Ne(a){a=Me(a);for(var b=[],c=0;c<a.length;c++){var d=a[c];b.push(d>>>24&255,d>>>16&255,d>>>8&255,d&255)}return b}
function Oe(a){a=Me(a);for(var b=new Ia,c=0;c<a.length;c++)b.append(Le(a[c]));a=b.toString();b=new Ia;for(c=0;c<a.length;c++)b.append((a.charCodeAt(c)|256).toString(16).substr(1));return b.toString()};var Pe=null,Qe=null;function L(a){if(!Pe)throw Error("E_TASK_NO_CONTEXT");Pe.name||(Pe.name=a);var b=Pe;a=new Re(b,b.top,a);b.top=a;a.b=Se;return a}function M(a){return new Te(a)}function Ue(a,b,c){a=L(a);a.g=c;try{b(a)}catch(d){Ve(a.d,d,a)}return N(a)}function We(a){var b=Xe,c;Pe?c=Pe.d:(c=Qe)||(c=new Ye(new Ze));b(c,a,void 0)}var Se=1;function Ze(){}Ze.prototype.currentTime=function(){return(new Date).valueOf()};function $e(a,b){return setTimeout(a,b)}
function Ye(a){this.e=a;this.f=1;this.slice=25;this.h=0;this.d=new Aa;this.b=this.j=null;this.g=!1;this.P=0;Qe||(Qe=this)}
function af(a){if(!a.g){var b=a.d.b[1].b,c=a.e.currentTime();if(null!=a.b){if(c+a.f>a.j)return;clearTimeout(a.b)}b-=c;b<=a.f&&(b=a.f);a.j=c+b;a.b=$e(function(){a.b=null;null!=a.b&&(clearTimeout(a.b),a.b=null);a.g=!0;try{var b=a.e.currentTime();for(a.h=b+a.slice;a.d.length();){var c=a.d.b[1];if(c.b>b)break;var f=a.d,g=f.b.pop(),h=f.b.length;if(1<h){for(var l=1;;){var k=2*l;if(k>=h)break;if(0<bf(f.b[k],g))k+1<h&&0<bf(f.b[k+1],f.b[k])&&k++;else if(k+1<h&&0<bf(f.b[k+1],g))k++;else break;f.b[l]=f.b[k];
l=k}f.b[l]=g}var l=c,m=l.d;l.d=null;m&&m.e==l&&(m.e=null,k=Pe,Pe=m,O(m.top,l.e),Pe=k);b=a.e.currentTime();if(b>=a.h)break}}catch(p){u.error(p)}a.g=!1;a.d.length()&&af(a)},b)}}Ye.prototype.Ua=function(a,b){var c=this.e.currentTime();a.P=this.P++;a.b=c+(b||0);a:{for(var c=this.d,d=c.b.length;1<d;){var e=Math.floor(d/2),f=c.b[e];if(0<bf(f,a)){c.b[d]=a;break a}c.b[d]=f;d=e}c.b[1]=a}af(this)};
function Xe(a,b,c){var d=new cf(a,c||"");d.top=new Re(d,null,"bootstrap");d.top.b=Se;d.top.then(function(){function a(){d.h=!1;for(var b=0;b<d.g.length;b++){var c=d.g[b];try{c()}catch(e){u.error(e)}}}try{b().then(function(b){d.f=b;a()})}catch(c){Ve(d,c),a()}});c=Pe;Pe=d;a.Ua(df(d.top,"bootstrap"));Pe=c;return d}function ef(a){this.d=a;this.P=this.b=0;this.e=null}function bf(a,b){return b.b-a.b||b.P-a.P}ef.prototype.Ua=function(a,b){this.e=a;this.d.d.Ua(this,b)};
function cf(a,b){this.d=a;this.name=b;this.g=[];this.b=null;this.h=!0;this.e=this.top=this.j=this.f=null}function ff(a,b){a.g.push(b)}cf.prototype.join=function(){var a=L("Task.join");if(this.h){var b=df(a,this),c=this;ff(this,function(){b.Ua(c.f)})}else O(a,this.f);return N(a)};
function Ve(a,b,c){var d=b.frameTrace;if(!d){for(var d=b.stack?b.stack+"\n\t---- async ---\n":"",e=a.top;e;e=e.parent)d+="\t",d+=e.name,d+="\n";b.frameTrace=d}if(c){for(d=a.top;d&&d!=c;)d=d.parent;d==c&&(a.top=d)}for(a.b=b;a.top&&!a.top.g;)a.top=a.top.parent;a.top?(b=a.b,a.b=null,a.top.g(a.top,b)):a.b&&u.error(a.b,"Unhandled exception in task",a.name)}function Te(a){this.value=a}n=Te.prototype;n.then=function(a){a(this.value)};n.xc=function(a){return a(this.value)};n.Zc=function(a){return new Te(a)};
n.ra=function(a){O(a,this.value)};n.Aa=function(){return!1};n.gc=function(){return this.value};function gf(a){this.b=a}n=gf.prototype;n.then=function(a){this.b.then(a)};n.xc=function(a){if(this.Aa()){var b=new Re(this.b.d,this.b.parent,"AsyncResult.thenAsync");b.b=Se;this.b.parent=b;this.b.then(function(c){a(c).then(function(a){O(b,a)})});return N(b)}return a(this.b.e)};n.Zc=function(a){return this.Aa()?this.xc(function(){return new Te(a)}):new Te(a)};
n.ra=function(a){this.Aa()?this.then(function(b){O(a,b)}):O(a,this.b.e)};n.Aa=function(){return this.b.b==Se};n.gc=function(){if(this.Aa())throw Error("Result is pending");return this.b.e};function Re(a,b,c){this.d=a;this.parent=b;this.name=c;this.e=null;this.b=0;this.g=this.f=null}function hf(a){if(!Pe)throw Error("F_TASK_NO_CONTEXT");if(a!==Pe.top)throw Error("F_TASK_NOT_TOP_FRAME");}function N(a){return new gf(a)}
function O(a,b){hf(a);Pe.b||(a.e=b);a.b=2;var c=a.parent;Pe.top=c;if(a.f){try{a.f(b)}catch(d){Ve(a.d,d,c)}a.b=3}}Re.prototype.then=function(a){switch(this.b){case Se:if(this.f)throw Error("F_TASK_FRAME_ALREADY_HAS_CALLBACK");this.f=a;break;case 2:var b=this.d,c=this.parent;try{a(this.e),this.b=3}catch(d){this.b=3,Ve(b,d,c)}break;case 3:throw Error("F_TASK_DEAD_FRAME");default:throw Error("F_TASK_UNEXPECTED_FRAME_STATE "+this.b);}};
function jf(){var a=L("Frame.timeSlice"),b=a.d.d;b.e.currentTime()>=b.h?(u.debug("-- time slice --"),df(a).Ua(!0)):O(a,!0);return N(a)}function kf(a){function b(d){try{for(;d;){var e=a();if(e.Aa()){e.then(b);return}e.then(function(a){d=a})}O(c,!0)}catch(f){Ve(c.d,f,c)}}var c=L("Frame.loop");b(!0);return N(c)}function lf(a){var b=Pe;if(!b)throw Error("E_TASK_NO_CONTEXT");return kf(function(){var c;do c=new mf(b,b.top),b.top=c,c.b=Se,a(c),c=N(c);while(!c.Aa()&&c.gc());return c})}
function df(a,b){hf(a);if(a.d.e)throw Error("E_TASK_ALREADY_SUSPENDED");var c=new ef(a.d);a.d.e=c;Pe=null;a.d.j=b||null;return c}function mf(a,b){Re.call(this,a,b,"loop")}t(mf,Re);function nf(a){O(a,!0)}function P(a){O(a,!1)};function of(a,b,c,d,e){var f=L("ajax"),g=new XMLHttpRequest,h=df(f,g),l={status:0,url:a,contentType:null,responseText:null,responseXML:null,nc:null};g.open(c||"GET",a,!0);b&&(g.responseType=b);g.onreadystatechange=function(){if(4===g.readyState){l.status=g.status;if(200==l.status||0==l.status)if(b&&"document"!==b||!g.responseXML){var c=g.response;b&&"text"!==b||"string"!=typeof c?c?"string"==typeof c?l.nc=pf([c]):l.nc=c:u.b("Unexpected empty success response for",a):l.responseText=c;if(c=g.getResponseHeader("Content-Type"))l.contentType=
c.replace(/(.*);.*$/,"$1")}else l.responseXML=g.responseXML,l.contentType=g.responseXML.contentType;h.Ua(l)}};try{d?(g.setRequestHeader("Content-Type",e||"text/plain; charset=UTF-8"),g.send(d)):g.send(null)}catch(k){u.b(k,"Error fetching "+a),h.Ua(l)}return N(f)}function pf(a){var b=window.WebKitBlobBuilder||window.MSBlobBuilder;if(b){for(var b=new b,c=0;c<a.length;c++)b.append(a[c]);return b.getBlob("application/octet-stream")}return new Blob(a,{type:"application/octet-stream"})}
function qf(a){var b=L("readBlob"),c=new FileReader,d=df(b,c);c.addEventListener("load",function(){d.Ua(c.result)},!1);c.readAsArrayBuffer(a);return N(b)}function rf(a,b){this.H=a;this.type=b;this.g={};this.e={}}rf.prototype.load=function(a,b,c){a=ta(a);var d=this.g[a];return"undefined"!=typeof d?M(d):sf(this.jc(a,b,c))};
function tf(a,b,c,d){var e=L("fetch");of(b,a.type).then(function(f){if(c&&400<=f.status)throw Error(d||"Failed to fetch required resource: "+b);a.H(f,a).then(function(c){delete a.e[b];a.g[b]=c;O(e,c)})});return N(e)}rf.prototype.jc=function(a,b,c){a=ta(a);if(this.g[a])return null;var d=this.e[a];if(!d){var e=this,d=new uf(function(){return tf(e,a,b,c)},"Fetch "+a);e.e[a]=d;d.start()}return d};function vf(a){a=a.responseText;return M(a?JSON.parse(a):null)};function wf(a){var b=parseInt(a,16);if(isNaN(b))throw Error("E_CSS_COLOR");if(6==a.length)return new nd(b);if(3==a.length)return new nd(b&15|(b&15)<<4|(b&240)<<4|(b&240)<<8|(b&3840)<<8|(b&3840)<<12);throw Error("E_CSS_COLOR");}function xf(a){this.d=a;this.Xa="Author"}n=xf.prototype;n.Rb=function(){return null};n.W=function(){return this.d};n.error=function(){};n.Jb=function(a){this.Xa=a};n.fb=function(){};n.Fc=function(){};n.Vb=function(){};n.Wb=function(){};n.Mc=function(){};n.hc=function(){};
n.hb=function(){};n.Ec=function(){};n.Dc=function(){};n.Jc=function(){};n.Fb=function(){};n.$a=function(){};n.sc=function(){};n.Yb=function(){};n.wc=function(){};n.qc=function(){};n.vc=function(){};n.Ib=function(){};n.Yc=function(){};n.xb=function(){};n.rc=function(){};n.uc=function(){};n.tc=function(){};n.ac=function(){};n.$b=function(){};n.ma=function(){};n.Ya=function(){};n.ib=function(){};n.Zb=function(){};n.ic=function(){};
function yf(a){switch(a.Xa){case "UA":return 0;case "User":return 100663296;default:return 83886080}}function zf(a){switch(a.Xa){case "UA":return 0;case "User":return 16777216;default:return 33554432}}function Af(){xf.call(this,null);this.e=[];this.b=null}t(Af,xf);function Bf(a,b){a.e.push(a.b);a.b=b}n=Af.prototype;n.Rb=function(){return null};n.W=function(){return this.b.W()};n.error=function(a,b){this.b.error(a,b)};
n.Jb=function(a){xf.prototype.Jb.call(this,a);0<this.e.length&&(this.b=this.e[0],this.e=[]);this.b.Jb(a)};n.fb=function(a,b){this.b.fb(a,b)};n.Fc=function(a){this.b.Fc(a)};n.Vb=function(a,b){this.b.Vb(a,b)};n.Wb=function(a,b){this.b.Wb(a,b)};n.Mc=function(a){this.b.Mc(a)};n.hc=function(a,b,c,d){this.b.hc(a,b,c,d)};n.hb=function(){this.b.hb()};n.Ec=function(){this.b.Ec()};n.Dc=function(){this.b.Dc()};n.Jc=function(){this.b.Jc()};n.Fb=function(){this.b.Fb()};n.$a=function(){this.b.$a()};n.sc=function(){this.b.sc()};
n.Yb=function(a){this.b.Yb(a)};n.wc=function(){this.b.wc()};n.qc=function(){this.b.qc()};n.vc=function(){this.b.vc()};n.Ib=function(){this.b.Ib()};n.Yc=function(a){this.b.Yc(a)};n.xb=function(a){this.b.xb(a)};n.rc=function(a){this.b.rc(a)};n.uc=function(){this.b.uc()};n.tc=function(a,b,c){this.b.tc(a,b,c)};n.ac=function(a,b,c){this.b.ac(a,b,c)};n.$b=function(a,b,c){this.b.$b(a,b,c)};n.ma=function(){this.b.ma()};n.Ya=function(a,b,c){this.b.Ya(a,b,c)};n.ib=function(){this.b.ib()};n.Zb=function(a){this.b.Zb(a)};
n.ic=function(){this.b.ic()};function Cf(a,b,c){xf.call(this,a);this.F=c;this.D=0;this.Y=b}t(Cf,xf);Cf.prototype.Rb=function(){return this.Y.Rb()};Cf.prototype.error=function(a){u.b(a)};Cf.prototype.ma=function(){this.D++};Cf.prototype.ib=function(){if(0==--this.D&&!this.F){var a=this.Y;a.b=a.e.pop()}};function Df(a,b,c){Cf.call(this,a,b,c)}t(Df,Cf);function Ef(a,b){a.error(b,a.Rb())}function Ff(a,b){Ef(a,b);Bf(a.Y,new Cf(a.d,a.Y,!1))}n=Df.prototype;n.$a=function(){Ff(this,"E_CSS_UNEXPECTED_SELECTOR")};
n.sc=function(){Ff(this,"E_CSS_UNEXPECTED_FONT_FACE")};n.Yb=function(){Ff(this,"E_CSS_UNEXPECTED_FOOTNOTE")};n.wc=function(){Ff(this,"E_CSS_UNEXPECTED_VIEWPORT")};n.qc=function(){Ff(this,"E_CSS_UNEXPECTED_DEFINE")};n.vc=function(){Ff(this,"E_CSS_UNEXPECTED_REGION")};n.Ib=function(){Ff(this,"E_CSS_UNEXPECTED_PAGE")};n.xb=function(){Ff(this,"E_CSS_UNEXPECTED_WHEN")};n.rc=function(){Ff(this,"E_CSS_UNEXPECTED_FLOW")};n.uc=function(){Ff(this,"E_CSS_UNEXPECTED_PAGE_TEMPLATE")};n.tc=function(){Ff(this,"E_CSS_UNEXPECTED_PAGE_MASTER")};
n.ac=function(){Ff(this,"E_CSS_UNEXPECTED_PARTITION")};n.$b=function(){Ff(this,"E_CSS_UNEXPECTED_PARTITION_GROUP")};n.Zb=function(){Ff(this,"E_CSS_UNEXPECTED_SELECTOR_FUNC")};n.ic=function(){Ff(this,"E_CSS_UNEXPECTED_END_SELECTOR_FUNC")};n.Ya=function(){this.error("E_CSS_UNEXPECTED_PROPERTY",this.Rb())};var Gf=[],Hf=[],Q=[],If=[],Jf=[],Kf=[],Lf=[],Mf=[],R=[],Nf=[],Of=[],Pf=[],Qf=[];Gf[1]=28;Gf[36]=29;Gf[7]=29;Gf[9]=29;Gf[14]=29;Gf[18]=29;Gf[20]=30;Gf[13]=27;Gf[0]=200;Hf[1]=46;Hf[0]=200;Kf[1]=2;
Kf[36]=4;Kf[7]=6;Kf[9]=8;Kf[14]=10;Kf[18]=14;Q[37]=11;Q[23]=12;Q[35]=56;Q[1]=1;Q[36]=3;Q[7]=5;Q[9]=7;Q[14]=9;Q[12]=13;Q[18]=55;Q[50]=42;Q[16]=41;If[1]=1;If[36]=3;If[7]=5;If[9]=7;If[14]=9;If[11]=200;If[18]=55;Jf[1]=2;Jf[36]=4;Jf[7]=6;Jf[9]=8;Jf[18]=14;Jf[50]=42;Jf[14]=10;Jf[12]=13;Lf[1]=15;Lf[7]=16;Lf[4]=17;Lf[5]=18;Lf[3]=19;Lf[2]=20;Lf[8]=21;Lf[16]=22;Lf[19]=23;Lf[6]=24;Lf[11]=25;Lf[17]=26;Lf[13]=48;Lf[31]=47;Lf[23]=54;Lf[0]=44;Mf[1]=31;Mf[4]=32;Mf[5]=32;Mf[3]=33;Mf[2]=34;Mf[10]=40;Mf[6]=38;
Mf[31]=36;Mf[24]=36;Mf[32]=35;R[1]=45;R[16]=37;R[37]=37;R[38]=37;R[47]=37;R[48]=37;R[39]=37;R[49]=37;R[26]=37;R[25]=37;R[23]=37;R[24]=37;R[19]=37;R[21]=37;R[36]=37;R[18]=37;R[22]=37;R[11]=39;R[12]=43;R[17]=49;Nf[0]=200;Nf[12]=50;Nf[13]=51;Nf[14]=50;Nf[15]=51;Nf[10]=50;Nf[11]=51;Nf[17]=53;Of[0]=200;Of[12]=50;Of[13]=52;Of[14]=50;Of[15]=51;Of[10]=50;Of[11]=51;Of[17]=53;Pf[0]=200;Pf[12]=50;Pf[13]=51;Pf[14]=50;Pf[15]=51;Pf[10]=50;Pf[11]=51;Qf[11]=0;Qf[16]=0;Qf[22]=1;Qf[18]=1;Qf[26]=2;Qf[25]=2;Qf[38]=3;
Qf[37]=3;Qf[48]=3;Qf[47]=3;Qf[39]=3;Qf[49]=3;Qf[41]=3;Qf[23]=4;Qf[24]=4;Qf[36]=5;Qf[19]=5;Qf[21]=5;Qf[0]=6;Qf[52]=2;function Rf(a,b,c,d){this.b=a;this.d=b;this.j=c;this.ea=d;this.u=[];this.H={};this.e=this.D=null;this.l=!1;this.g=2;this.w=null;this.A=!1;this.k=this.F=null;this.h=[];this.f=[];this.N=this.$=!1}function Sf(a,b){for(var c=[],d=a.u;;){c.push(d[b++]);if(b==d.length)break;if(","!=d[b++])throw Error("Unexpected state");}return c}
function Tf(a,b,c){var d=a.u,e=d.length,f;do f=d[--e];while("undefined"!=typeof f&&"string"!=typeof f);var g=d.length-(e+1);1<g&&d.splice(e+1,g,new cd(d.slice(e+1,d.length)));if(","==b)return null;e++;do f=d[--e];while("undefined"!=typeof f&&("string"!=typeof f||","==f));g=d.length-(e+1);if("("==f){if(")"!=b)return a.j.error("E_CSS_MISMATCHED_C_PAR",c),a.b=Of,null;a=new ed(d[e-1],Sf(a,e+1));d.splice(e-1,g+2,a);return null}return";"!=b||0<=e?(a.j.error("E_CSS_UNEXPECTED_VAL_END",c),a.b=Of,null):1<
g?new dd(Sf(a,e+1)):d[0]}function Uf(a,b,c){a.b=a.e?Of:Nf;a.j.error(b,c)}
function Vf(a,b,c){for(var d=a.u,e=a.j,f=d.pop(),g;;){var h=d.pop();if(11==b){for(g=[f];16==h;)g.unshift(d.pop()),h=d.pop();if("string"==typeof h){if("{"==h){for(;2<=g.length;)a=g.shift(),c=g.shift(),a=new Ec(e.W(),a,c),g.unshift(a);d.push(new K(g[0]));return!0}if("("==h){b=d.pop();f=d.pop();f=new Tc(e.W(),dc(f,b),g);b=0;continue}}if(10==h){f.jd()&&(f=new Vc(e.W(),f,null));b=0;continue}}else if("string"==typeof h){d.push(h);break}if(0>h)if(-31==h)f=new zc(e.W(),f);else if(-24==h)f=new Ac(e.W(),f);
else return Uf(a,"F_UNEXPECTED_STATE",c),!1;else{if(Qf[b]>Qf[h]){d.push(h);break}g=d.pop();switch(h){case 26:f=new Bc(e.W(),g,f);break;case 52:f=new Cc(e.W(),g,f);break;case 25:f=new Dc(e.W(),g,f);break;case 38:f=new Fc(e.W(),g,f);break;case 37:f=new Hc(e.W(),g,f);break;case 48:f=new Gc(e.W(),g,f);break;case 47:f=new Ic(e.W(),g,f);break;case 39:case 49:f=new Jc(e.W(),g,f);break;case 41:f=new Kc(e.W(),g,f);break;case 23:f=new Lc(e.W(),g,f);break;case 24:f=new Mc(e.W(),g,f);break;case 36:f=new Nc(e.W(),
g,f);break;case 19:f=new Oc(e.W(),g,f);break;case 21:f=new Pc(e.W(),g,f);break;case 18:if(1<d.length)switch(d[d.length-1]){case 22:d.pop();f=new Uc(e.W(),d.pop(),g,f);break;case 10:if(g.jd())f=new Vc(e.W(),g,f);else return Uf(a,"E_CSS_MEDIA_TEST",c),!1}else return Uf(a,"E_CSS_EXPR_COND",c),!1;break;case 22:if(18!=b)return Uf(a,"E_CSS_EXPR_COND",c),!1;case 10:return d.push(g),d.push(h),d.push(f),!1;default:return Uf(a,"F_UNEXPECTED_STATE",c),!1}}}d.push(f);return!1}
function Wf(a){for(var b=[];;){var c=x(a.d);switch(c.type){case 1:b.push(c.text);break;case 23:b.push("+");break;case 4:case 5:b.push(c.B);break;default:return b}A(a.d)}}
function Xf(a){var b=!1,c=x(a.d);if(23===c.type)b=!0,A(a.d),c=x(a.d);else if(1===c.type&&("even"===c.text||"odd"===c.text))return A(a.d),[2,"odd"===c.text?1:0];switch(c.type){case 3:if(b&&0>c.B)break;case 1:if(b&&"-"===c.text.charAt(0))break;if("n"===c.text||"-n"===c.text){if(b&&c.b)break;b="-n"===c.text?-1:1;3===c.type&&(b=c.B);var d=0;A(a.d);var c=x(a.d),e=24===c.type,f=23===c.type||e;f&&(A(a.d),c=x(a.d));if(5===c.type){d=c.B;if(1/d===1/-0){if(d=0,f)break}else if(0>d){if(f)break}else if(0<=d&&!f)break;
A(a.d)}else if(f)break;return[b,e&&0<d?-d:d]}if("n-"===c.text||"-n-"===c.text){if(b&&c.b)break;b="-n-"===c.text?-1:1;3===c.type&&(b=c.B);A(a.d);c=x(a.d);if(5===c.type&&!(0>c.B||1/c.B===1/-0))return A(a.d),[b,c.B]}else{if(d=c.text.match(/^n(-[0-9]+)$/)){if(b&&c.b)break;A(a.d);return[3===c.type?c.B:1,parseInt(d[1],10)]}if(d=c.text.match(/^-n(-[0-9]+)$/))return A(a.d),[-1,parseInt(d[1],10)]}break;case 5:if(b&&(c.b||0>c.B))break;A(a.d);return[0,c.B]}return null}
function Yf(a,b,c){a=a.j.W();if(!a)return null;c=c||a.g;if(b){b=b.split(/\s+/);for(var d=0;d<b.length;d++)switch(b[d]){case "vertical":c=Xc(a,c,new zc(a,new Rc(a,"pref-horizontal")));break;case "horizontal":c=Xc(a,c,new Rc(a,"pref-horizontal"));break;case "day":c=Xc(a,c,new zc(a,new Rc(a,"pref-night-mode")));break;case "night":c=Xc(a,c,new Rc(a,"pref-night-mode"));break;default:c=a.f}}return c===a.g?null:new K(c)}
function Zf(a){switch(a.f[a.f.length-1]){case "[selector]":case "font-face":case "-epubx-flow":case "-epubx-viewport":case "-epubx-define":case "-adapt-footnote-area":return!0}return!1}
function $f(a,b,c,d,e,f){var g=a.j,h=a.d,l=a.u,k,m,p,q;e&&(a.g=2,a.u.push("{"));a:for(;0<b;--b)switch(k=x(h),a.b[k.type]){case 28:if(18!=z(h,1).type){Zf(a)?(g.error("E_CSS_COLON_EXPECTED",z(h,1)),a.b=Of):(a.b=Kf,g.$a());continue}m=z(h,2);if(!(m.b||1!=m.type&&6!=m.type)){if(0<=h.b)throw Error("F_CSSTOK_BAD_CALL mark");h.b=h.d}a.e=k.text;a.l=!1;A(h);A(h);a.b=Lf;l.splice(0,l.length);continue;case 46:if(18!=z(h,1).type){a.b=Of;g.error("E_CSS_COLON_EXPECTED",z(h,1));continue}a.e=k.text;a.l=!1;A(h);A(h);
a.b=Lf;l.splice(0,l.length);continue;case 29:a.b=Kf;g.$a();continue;case 1:if(!k.b){a.b=Pf;g.error("E_CSS_SPACE_EXPECTED",k);continue}g.hb();case 2:if(34==z(h,1).type)if(A(h),A(h),p=a.H[k.text],null!=p)switch(k=x(h),k.type){case 1:g.fb(p,k.text);a.b=f?If:Q;A(h);break;case 36:g.fb(p,null);a.b=f?If:Q;A(h);break;default:a.b=Nf,g.error("E_CSS_NAMESPACE",k)}else a.b=Nf,g.error("E_CSS_UNDECLARED_PREFIX",k);else g.fb(a.D,k.text),a.b=f?If:Q,A(h);continue;case 3:if(!k.b){a.b=Pf;g.error("E_CSS_SPACE_EXPECTED",
k);continue}g.hb();case 4:if(34==z(h,1).type)switch(A(h),A(h),k=x(h),k.type){case 1:g.fb(null,k.text);a.b=f?If:Q;A(h);break;case 36:g.fb(null,null);a.b=f?If:Q;A(h);break;default:a.b=Nf,g.error("E_CSS_NAMESPACE",k)}else g.fb(a.D,null),a.b=f?If:Q,A(h);continue;case 5:k.b&&g.hb();case 6:g.Mc(k.text);a.b=f?If:Q;A(h);continue;case 7:k.b&&g.hb();case 8:g.Fc(k.text);a.b=f?If:Q;A(h);continue;case 55:k.b&&g.hb();case 14:A(h);k=x(h);b:switch(k.type){case 1:g.Vb(k.text,null);A(h);a.b=f?If:Q;continue;case 6:m=
k.text;A(h);switch(m){case "not":a.b=Kf;g.Zb("not");$f(a,Number.POSITIVE_INFINITY,!1,!1,!1,!0)?a.b=Q:a.b=Pf;break a;case "lang":case "href-epub-type":if(k=x(h),1===k.type){p=[k.text];A(h);break}else break b;case "nth-child":case "nth-of-type":case "nth-last-child":case "nth-last-of-type":if(p=Xf(a))break;else break b;default:p=Wf(a)}k=x(h);if(11==k.type){g.Vb(m,p);A(h);a.b=f?If:Q;continue}}g.error("E_CSS_PSEUDOCLASS_SYNTAX",k);a.b=Nf;continue;case 42:A(h);k=x(h);switch(k.type){case 1:g.Wb(k.text,
null);a.b=f?If:Q;A(h);continue;case 6:if(m=k.text,A(h),p=Wf(a),k=x(h),11==k.type){g.Wb(m,p);a.b=f?If:Q;A(h);continue}}g.error("E_CSS_PSEUDOELEM_SYNTAX",k);a.b=Nf;continue;case 9:k.b&&g.hb();case 10:A(h);k=x(h);if(1==k.type)m=k.text,A(h);else if(36==k.type)m=null,A(h);else if(34==k.type)m="";else{a.b=Pf;g.error("E_CSS_ATTR",k);A(h);continue}k=x(h);if(34==k.type){p=m?a.H[m]:m;if(null==p){a.b=Pf;g.error("E_CSS_UNDECLARED_PREFIX",k);A(h);continue}A(h);k=x(h);if(1!=k.type){a.b=Pf;g.error("E_CSS_ATTR_NAME_EXPECTED",
k);continue}m=k.text;A(h);k=x(h)}else p="";switch(k.type){case 39:case 45:case 44:case 43:case 42:case 46:case 50:q=k.type;A(h);k=x(h);break;case 15:g.hc(p,m,0,null);a.b=f?If:Q;A(h);continue;default:a.b=Pf;g.error("E_CSS_ATTR_OP_EXPECTED",k);continue}switch(k.type){case 1:case 2:g.hc(p,m,q,k.text);A(h);k=x(h);break;default:a.b=Pf;g.error("E_CSS_ATTR_VAL_EXPECTED",k);continue}if(15!=k.type){a.b=Pf;g.error("E_CSS_ATTR",k);continue}a.b=f?If:Q;A(h);continue;case 11:g.Ec();a.b=Jf;A(h);continue;case 12:g.Dc();
a.b=Jf;A(h);continue;case 56:g.Jc();a.b=Jf;A(h);continue;case 13:a.$?(a.f.push("-epubx-region"),a.$=!1):a.N?(a.f.push("page"),a.N=!1):a.f.push("[selector]");g.ma();a.b=Gf;A(h);continue;case 41:g.Fb();a.b=Kf;A(h);continue;case 15:l.push(H(k.text));A(h);continue;case 16:try{l.push(wf(k.text))}catch(v){g.error("E_CSS_COLOR",k),a.b=Nf}A(h);continue;case 17:l.push(new ld(k.B));A(h);continue;case 18:l.push(new md(k.B));A(h);continue;case 19:l.push(new I(k.B,k.text));A(h);continue;case 20:l.push(new jd(k.text));
A(h);continue;case 21:l.push(new od(va(k.text,a.ea)));A(h);continue;case 22:Tf(a,",",k);l.push(",");A(h);continue;case 23:l.push(id);A(h);continue;case 24:m=k.text.toLowerCase();"-epubx-expr"==m?(a.b=Mf,a.g=0,l.push("{")):(l.push(m),l.push("("));A(h);continue;case 25:Tf(a,")",k);A(h);continue;case 47:A(h);k=x(h);m=z(h,1);if(1==k.type&&"important"==k.text.toLowerCase()&&(17==m.type||0==m.type||13==m.type)){A(h);a.l=!0;continue}Uf(a,"E_CSS_SYNTAX",k);continue;case 54:m=z(h,1);switch(m.type){case 4:case 3:case 5:if(!m.b){A(h);
continue}}a.b===Lf&&0<=h.b?(Vb(h),a.b=Kf,g.$a()):Uf(a,"E_CSS_UNEXPECTED_PLUS",k);continue;case 26:A(h);case 48:h.b=-1;(m=Tf(a,";",k))&&a.e&&g.Ya(a.e,m,a.l);a.b=d?Hf:Gf;continue;case 44:A(h);h.b=-1;m=Tf(a,";",k);if(c)return a.w=m,!0;a.e&&m&&g.Ya(a.e,m,a.l);if(d)return!0;Uf(a,"E_CSS_SYNTAX",k);continue;case 31:m=z(h,1);9==m.type?(10!=z(h,2).type||z(h,2).b?(l.push(new Rc(g.W(),dc(k.text,m.text))),a.b=R):(l.push(k.text,m.text,"("),A(h)),A(h)):(2==a.g||3==a.g?"not"==k.text.toLowerCase()?(A(h),l.push(new Sc(g.W(),
!0,m.text))):("only"==k.text.toLowerCase()&&(A(h),k=m),l.push(new Sc(g.W(),!1,k.text))):l.push(new Rc(g.W(),k.text)),a.b=R);A(h);continue;case 38:l.push(null,k.text,"(");A(h);continue;case 32:l.push(new gc(g.W(),k.B));A(h);a.b=R;continue;case 33:m=k.text;"%"==m&&(m=a.e&&a.e.match(/height|^(top|bottom)$/)?"vh":"vw");l.push(new Qc(g.W(),k.B,m));A(h);a.b=R;continue;case 34:l.push(new gc(g.W(),k.text));A(h);a.b=R;continue;case 35:A(h);k=x(h);5!=k.type||k.b?Uf(a,"E_CSS_SYNTAX",k):(l.push(new Wc(g.W(),
k.B)),A(h),a.b=R);continue;case 36:l.push(-k.type);A(h);continue;case 37:a.b=Mf;Vf(a,k.type,k);l.push(k.type);A(h);continue;case 45:"and"==k.text.toLowerCase()?(a.b=Mf,Vf(a,52,k),l.push(52),A(h)):Uf(a,"E_CSS_SYNTAX",k);continue;case 39:Vf(a,k.type,k)&&(a.e?a.b=Lf:Uf(a,"E_CSS_UNBALANCED_PAR",k));A(h);continue;case 43:Vf(a,11,k)&&(a.e||3==a.g?Uf(a,"E_CSS_UNEXPECTED_BRC",k):(1==a.g?g.xb(l.pop()):(k=l.pop(),g.xb(k)),a.f.push("media"),g.ma(),a.b=Gf));A(h);continue;case 49:if(Vf(a,11,k))if(a.e||3!=a.g)Uf(a,
"E_CSS_UNEXPECTED_SEMICOL",k);else return a.k=l.pop(),a.A=!0,a.b=Gf,A(h),!1;A(h);continue;case 40:l.push(k.type);A(h);continue;case 27:a.b=Gf;A(h);g.ib();a.f.length&&a.f.pop();continue;case 30:m=k.text.toLowerCase();switch(m){case "import":A(h);k=x(h);if(2==k.type||8==k.type){a.F=k.text;A(h);k=x(h);if(17==k.type||0==k.type)return a.A=!0,A(h),!1;a.e=null;a.g=3;a.b=Mf;l.push("{");continue}g.error("E_CSS_IMPORT_SYNTAX",k);a.b=Nf;continue;case "namespace":A(h);k=x(h);switch(k.type){case 1:m=k.text;A(h);
k=x(h);if((2==k.type||8==k.type)&&17==z(h,1).type){a.H[m]=k.text;A(h);A(h);continue}break;case 2:case 8:if(17==z(h,1).type){a.D=k.text;A(h);A(h);continue}}g.error("E_CSS_NAMESPACE_SYNTAX",k);a.b=Nf;continue;case "charset":A(h);k=x(h);if(2==k.type&&17==z(h,1).type){m=k.text.toLowerCase();"utf-8"!=m&&"utf-16"!=m&&g.error("E_CSS_UNEXPECTED_CHARSET "+m,k);A(h);A(h);continue}g.error("E_CSS_CHARSET_SYNTAX",k);a.b=Nf;continue;case "font-face":case "-epubx-page-template":case "-epubx-define":case "-epubx-viewport":if(12==
z(h,1).type){A(h);A(h);switch(m){case "font-face":g.sc();break;case "-epubx-page-template":g.uc();break;case "-epubx-define":g.qc();break;case "-epubx-viewport":g.wc()}a.f.push(m);g.ma();continue}break;case "-adapt-footnote-area":A(h);k=x(h);switch(k.type){case 12:A(h);g.Yb(null);a.f.push(m);g.ma();continue;case 50:if(A(h),k=x(h),1==k.type&&12==z(h,1).type){m=k.text;A(h);A(h);g.Yb(m);a.f.push("-adapt-footnote-area");g.ma();continue}}break;case "-epubx-region":A(h);g.vc();a.$=!0;a.b=Kf;continue;case "page":A(h);
g.Ib();a.N=!0;a.b=Jf;continue;case "top-left-corner":case "top-left":case "top-center":case "top-right":case "top-right-corner":case "right-top":case "right-middle":case "right-bottom":case "bottom-right-corner":case "bottom-right":case "bottom-center":case "bottom-left":case "bottom-left-corner":case "left-bottom":case "left-middle":case "left-top":A(h);k=x(h);if(12==k.type){A(h);g.Yc(m);a.f.push(m);g.ma();continue}break;case "-epubx-when":A(h);a.e=null;a.g=1;a.b=Mf;l.push("{");continue;case "media":A(h);
a.e=null;a.g=2;a.b=Mf;l.push("{");continue;case "-epubx-flow":if(1==z(h,1).type&&12==z(h,2).type){g.rc(z(h,1).text);A(h);A(h);A(h);a.f.push(m);g.ma();continue}break;case "-epubx-page-master":case "-epubx-partition":case "-epubx-partition-group":A(h);k=x(h);q=p=null;var r=[];1==k.type&&(p=k.text,A(h),k=x(h));18==k.type&&1==z(h,1).type&&(q=z(h,1).text,A(h),A(h),k=x(h));for(;6==k.type&&"class"==k.text.toLowerCase()&&1==z(h,1).type&&11==z(h,2).type;)r.push(z(h,1).text),A(h),A(h),A(h),k=x(h);if(12==k.type){A(h);
switch(m){case "-epubx-page-master":g.tc(p,q,r);break;case "-epubx-partition":g.ac(p,q,r);break;case "-epubx-partition-group":g.$b(p,q,r)}a.f.push(m);g.ma();continue}break;case "":g.error("E_CSS_UNEXPECTED_AT"+m,k);a.b=Pf;continue;default:g.error("E_CSS_AT_UNKNOWN "+m,k);a.b=Nf;continue}g.error("E_CSS_AT_SYNTAX "+m,k);a.b=Nf;continue;case 50:if(c||d)return!0;a.h.push(k.type+1);A(h);continue;case 52:if(c||d)return!0;if(0==a.h.length){a.b=Gf;continue}case 51:0<a.h.length&&a.h[a.h.length-1]==k.type&&
a.h.pop();0==a.h.length&&13==k.type&&(a.b=Gf);A(h);continue;case 53:if(c||d)return!0;0==a.h.length&&(a.b=Gf);A(h);continue;case 200:return f&&(A(h),g.ic()),!0;default:if(c||d)return!0;if(e)return Vf(a,11,k)?(a.w=l.pop(),!0):!1;if(f)return 51==k.type?g.error(k.text,k):g.error("E_CSS_SYNTAX",k),!1;if(a.b===Lf&&0<=h.b){Vb(h);a.b=Kf;g.$a();continue}if(a.b!==Nf&&a.b!==Pf&&a.b!==Of){51==k.type?g.error(k.text,k):g.error("E_CSS_SYNTAX",k);a.b=Zf(a)?Of:Pf;continue}A(h)}return!1}
function ag(a){xf.call(this,null);this.d=a}t(ag,xf);ag.prototype.error=function(a){throw Error(a);};ag.prototype.W=function(){return this.d};
function bg(a,b,c,d,e){var f=L("parseStylesheet"),g=new Rf(Gf,a,b,c),h=null;e&&(h=cg(new Tb(e,b),b,c));if(h=Yf(g,d,h&&h.ia()))b.xb(h),b.ma();kf(function(){for(;!$f(g,100,!1,!1,!1,!1);){if(g.A){var a=va(g.F,c);g.k&&(b.xb(g.k),b.ma());var d=L("parseStylesheet.import");dg(a,b,null,null).then(function(){g.k&&b.ib();g.A=!1;g.F=null;g.k=null;O(d,!0)});return N(d)}a=jf();if(a.Aa)return a}return M(!1)}).then(function(){h&&b.ib();O(f,!0)});return N(f)}
function eg(a,b,c,d,e){return Ue("parseStylesheetFromText",function(f){var g=new Tb(a,b);bg(g,b,c,d,e).ra(f)},function(b,c){u.b(c,"Failed to parse stylesheet text: "+a);O(b,!1)})}function dg(a,b,c,d){return Ue("parseStylesheetFromURL",function(e){of(a).then(function(f){f.responseText?eg(f.responseText,b,a,c,d).then(function(b){b||u.b("Failed to parse stylesheet from "+a);O(e,!0)}):O(e,!0)})},function(b,c){u.b(c,"Exception while fetching and parsing:",a);O(b,!0)})}
function fg(a,b){var c=new Rf(Lf,b,new ag(a),"");$f(c,Number.POSITIVE_INFINITY,!0,!1,!1,!1);return c.w}function cg(a,b,c){a=new Rf(Mf,a,b,c);$f(a,Number.POSITIVE_INFINITY,!1,!1,!0,!1);return a.w}var gg={"z-index":!0,"column-count":!0,"flow-linger":!0,opacity:!0,page:!0,"flow-priority":!0,utilization:!0};
function hg(a,b,c){if(b.hd())a:{b=b.d;a=b.evaluate(a);switch(typeof a){case "number":c=gg[c]?a==Math.round(a)?new md(a):new ld(a):new I(a,"px");break a;case "string":c=a?fg(b.b,new Tb(a,null)):G;break a;case "boolean":c=a?fe:Dd;break a;case "undefined":c=G;break a}throw Error("E_UNEXPECTED");}else c=b;return c};function ig(){this.b={}}t(ig,ad);ig.prototype.pb=function(a){this.b[a.name]=!0;return a};ig.prototype.ab=function(a){this.qb(a.values);return a};function jg(a){this.value=a}t(jg,ad);jg.prototype.Lb=function(a){this.value=a.B;return a};function kg(a,b){if(a){var c=new jg(b);try{return a.T(c),c.value}catch(d){u.b(d,"toInt: ")}}return b}function lg(){this.d=!1;this.b=[];this.name=null}t(lg,ad);lg.prototype.Nb=function(a){this.d&&this.b.push(a);return null};
lg.prototype.Mb=function(a){this.d&&0==a.B&&this.b.push(new I(0,"px"));return null};lg.prototype.ab=function(a){this.qb(a.values);return null};lg.prototype.yb=function(a){this.d||(this.d=!0,this.qb(a.values),this.d=!1,this.name=a.name.toLowerCase());return null};
function mg(a,b,c,d,e,f){if(a){var g=new lg;try{a.T(g);var h;a:{if(0<g.b.length){a=[];for(var l=0;l<g.b.length;l++){var k=g.b[l];if("%"==k.fa){var m=0==l%2?d:e;3==l&&"circle"==g.name&&(m=Math.sqrt((d*d+e*e)/2));a.push(k.B*m/100)}else a.push(k.B*pc(f,k.fa,!1))}switch(g.name){case "polygon":if(0==a.length%2){f=[];for(g=0;g<a.length;g+=2)f.push({x:b+a[g],y:c+a[g+1]});h=new se(f);break a}break;case "rectangle":if(4==a.length){h=we(b+a[0],c+a[1],b+a[0]+a[2],c+a[1]+a[3]);break a}break;case "ellipse":if(4==
a.length){h=ve(b+a[0],c+a[1],a[2],a[3]);break a}break;case "circle":if(3==a.length){h=ve(b+a[0],c+a[1],a[2],a[2]);break a}}}h=null}return h}catch(p){u.b(p,"toShape:")}}return we(b,c,b+d,c+e)}function ng(a){this.d=a;this.b={};this.name=null}t(ng,ad);ng.prototype.pb=function(a){this.name=a.toString();this.b[this.name]=this.d?0:(this.b[this.name]||0)+1;return a};ng.prototype.Lb=function(a){this.name&&(this.b[this.name]+=a.B-(this.d?0:1));return a};ng.prototype.ab=function(a){this.qb(a.values);return a};
function og(a,b){var c=new ng(b);try{a.T(c)}catch(d){u.b(d,"toCounters:")}return c.b};function uf(a,b){this.jc=a;this.name=b;this.d=!1;this.b=this.f=null;this.e=[]}uf.prototype.start=function(){if(!this.b){var a=this;this.b=Xe(Pe.d,function(){var b=L("Fetcher.run");a.jc().then(function(c){var d=a.e;a.d=!0;a.f=c;a.b=null;a.e=[];if(d)for(var e=0;e<d.length;e++)try{d[e](c)}catch(f){u.error(f,"Error:")}O(b,c)});return N(b)},this.name)}};function pg(a,b){a.d?b(a.f):a.e.push(b)}function sf(a){if(a.d)return M(a.f);a.start();return a.b.join()}
function qg(a){if(0==a.length)return M(!0);if(1==a.length)return sf(a[0]).Zc(!0);var b=L("waitForFetches"),c=0;kf(function(){for(;c<a.length;){var b=a[c++];if(!b.d)return sf(b).Zc(!0)}return M(!1)}).then(function(){O(b,!0)});return N(b)}
function rg(a,b){var c=null,d=null;"img"==a.localName&&(c=a.getAttribute("width"),d=a.getAttribute("height"));var e=new uf(function(){function e(b){"img"==a.localName&&(c||a.removeAttribute("width"),d||a.removeAttribute("height"));h.Ua(b?b.type:"timeout")}var g=L("loadImage"),h=df(g,a);a.addEventListener("load",e,!1);a.addEventListener("error",e,!1);a.addEventListener("abort",e,!1);"http://www.w3.org/2000/svg"==a.namespaceURI?(a.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",b),setTimeout(e,
300)):a.src=b;return N(g)},"loadElement "+b);e.start();return e};function sg(a){this.e=this.f=null;this.d=0;this.b=a}function tg(a,b){this.b=-1;this.d=a;this.e=b}function ug(){this.b=[];this.d=[];this.match=[];this.e=[];this.error=[];this.f=!0}function vg(a,b,c){for(var d=0;d<b.length;d++)a.d[b[d]].b=c;b.splice(0,b.length)}
ug.prototype.clone=function(){for(var a=new ug,b=0;b<this.b.length;b++){var c=this.b[b],d=new sg(c.b);d.d=c.d;a.b.push(d)}for(b=0;b<this.d.length;b++)c=this.d[b],d=new tg(c.d,c.e),d.b=c.b,a.d.push(d);a.match.push.apply(a.match,this.match);a.e.push.apply(a.e,this.e);a.error.push.apply(a.error,this.error);return a};
function wg(a,b,c,d){var e=a.b.length,f=new sg(xg);f.d=0<=d?c?2*d+1:2*d+2:c?-1:-2;a.b.push(f);vg(a,b,e);c=new tg(e,!0);e=new tg(e,!1);b.push(a.d.length);a.d.push(e);b.push(a.d.length);a.d.push(c)}function yg(a){return 1==a.b.length&&0==a.b[0].d&&a.b[0].b instanceof zg}
function Ag(a,b,c){if(0!=b.b.length){var d=a.b.length;if(4==c&&1==d&&yg(b)&&yg(a)){c=a.b[0].b;b=b.b[0].b;var d={},e={},f;for(f in c.d)d[f]=c.d[f];for(f in b.d)d[f]=b.d[f];for(var g in c.e)e[g]=c.e[g];for(g in b.e)e[g]=b.e[g];a.b[0].b=new zg(c.b|b.b,d,e)}else{for(f=0;f<b.b.length;f++)a.b.push(b.b[f]);4==c?(a.f=!0,vg(a,a.e,d)):vg(a,a.match,d);g=a.d.length;for(f=0;f<b.d.length;f++)e=b.d[f],e.d+=d,0<=e.b&&(e.b+=d),a.d.push(e);for(f=0;f<b.match.length;f++)a.match.push(b.match[f]+g);3==c&&vg(a,a.match,
d);if(2==c||3==c)for(f=0;f<b.e.length;f++)a.match.push(b.e[f]+g);else if(a.f){for(f=0;f<b.e.length;f++)a.e.push(b.e[f]+g);a.f=b.f}else for(f=0;f<b.e.length;f++)a.error.push(b.e[f]+g);for(f=0;f<b.error.length;f++)a.error.push(b.error[f]+g);b.b=null;b.d=null}}}var S={};function Bg(){}t(Bg,ad);Bg.prototype.f=function(a,b){var c=a[b].T(this);return c?[c]:null};function zg(a,b,c){this.b=a;this.d=b;this.e=c}t(zg,Bg);n=zg.prototype;n.$c=function(a){return this.b&1?a:null};
n.ad=function(a){return this.b&2048?a:null};n.cc=function(a){return this.b&2?a:null};n.pb=function(a){var b=this.d[a.name.toLowerCase()];return b?b:this.b&4?a:null};n.Nb=function(a){return 0!=a.B||this.b&512?0>a.B&&!(this.b&256)?null:this.e[a.fa]?a:null:"%"==a.fa&&this.b&1024?a:null};n.Mb=function(a){return 0==a.B?this.b&512?a:null:0>=a.B&&!(this.b&256)?null:this.b&16?a:null};n.Lb=function(a){return 0==a.B?this.b&512?a:null:0>=a.B&&!(this.b&256)?null:this.b&48?a:(a=this.d[""+a.B])?a:null};
n.zc=function(a){return this.b&64?a:null};n.dc=function(a){return this.b&128?a:null};n.ab=function(){return null};n.ob=function(){return null};n.yb=function(){return null};n.Kb=function(){return null};var xg=new zg(0,S,S);
function Cg(a){this.b=new sg(null);var b=this.e=new sg(null),c=a.b.length;a.b.push(this.b);a.b.push(b);vg(a,a.match,c);vg(a,a.e,c+1);vg(a,a.error,c+1);for(b=0;b<a.d.length;b++){var d=a.d[b];d.e?a.b[d.d].f=a.b[d.b]:a.b[d.d].e=a.b[d.b]}for(b=0;b<c;b++)if(null==a.b[b].e||null==a.b[b].f)throw Error("Invalid validator state");this.d=a.b[0]}t(Cg,Bg);
function Dg(a,b,c,d){for(var e=c?[]:b,f=a.d,g=d,h=null,l=null;f!==a.b&&f!==a.e;)if(g>=b.length)f=f.e;else{var k=b[g],m=k;if(0!=f.d)m=!0,-1==f.d?(h?h.push(l):h=[l],l=[]):-2==f.d?0<h.length?l=h.pop():l=null:0<f.d&&0==f.d%2?l[Math.floor((f.d-1)/2)]="taken":m=null==l[Math.floor((f.d-1)/2)],f=m?f.f:f.e;else{if(0==g&&!c&&f.b instanceof Eg&&a instanceof Eg){if(m=(new cd(b)).T(f.b)){g=b.length;f=f.f;continue}}else if(0==g&&!c&&f.b instanceof Fg&&a instanceof Eg){if(m=(new dd(b)).T(f.b)){g=b.length;f=f.f;
continue}}else m=k.T(f.b);if(m){if(m!==k&&b===e)for(e=[],k=0;k<g;k++)e[k]=b[k];b!==e&&(e[g-d]=m);g++;f=f.f}else f=f.e}}return f===a.b&&(c?0<e.length:g==b.length)?e:null}n=Cg.prototype;n.Ra=function(a){for(var b=null,c=this.d;c!==this.b&&c!==this.e;)a?0!=c.d?c=c.f:(b=a.T(c.b))?(a=null,c=c.f):c=c.e:c=c.e;return c===this.b?b:null};n.$c=function(a){return this.Ra(a)};n.ad=function(a){return this.Ra(a)};n.cc=function(a){return this.Ra(a)};n.pb=function(a){return this.Ra(a)};n.Nb=function(a){return this.Ra(a)};
n.Mb=function(a){return this.Ra(a)};n.Lb=function(a){return this.Ra(a)};n.zc=function(a){return this.Ra(a)};n.dc=function(a){return this.Ra(a)};n.ab=function(){return null};n.ob=function(){return null};n.yb=function(a){return this.Ra(a)};n.Kb=function(){return null};function Eg(a){Cg.call(this,a)}t(Eg,Cg);Eg.prototype.ab=function(a){var b=Dg(this,a.values,!1,0);return b===a.values?a:b?new cd(b):null};
Eg.prototype.ob=function(a){for(var b=this.d,c=!1;b;){if(b.b instanceof Fg){c=!0;break}b=b.e}return c?(b=Dg(this,a.values,!1,0),b===a.values?a:b?new dd(b):null):null};Eg.prototype.f=function(a,b){return Dg(this,a,!0,b)};function Fg(a){Cg.call(this,a)}t(Fg,Cg);Fg.prototype.ab=function(a){return this.Ra(a)};Fg.prototype.ob=function(a){var b=Dg(this,a.values,!1,0);return b===a.values?a:b?new dd(b):null};Fg.prototype.f=function(a,b){for(var c=this.d,d;c!==this.e;){if(d=c.b.f(a,b))return d;c=c.e}return null};
function Gg(a,b){Cg.call(this,b);this.name=a}t(Gg,Cg);Gg.prototype.Ra=function(){return null};Gg.prototype.yb=function(a){if(a.name.toLowerCase()!=this.name)return null;var b=Dg(this,a.values,!1,0);return b===a.values?a:b?new ed(a.name,b):null};function Hg(){}Hg.prototype.b=function(a,b){return b};Hg.prototype.e=function(){};function Ig(a,b){this.name=b;this.f=a.e[this.name]}t(Ig,Hg);
Ig.prototype.b=function(a,b,c){if(c.values[this.name])return b;if(a=this.f.f(a,b)){var d=a.length;this.e(1<d?new cd(a):a[0],c);return b+d}return b};Ig.prototype.e=function(a,b){b.values[this.name]=a};function Jg(a,b){Ig.call(this,a,b[0]);this.d=b}t(Jg,Ig);Jg.prototype.e=function(a,b){for(var c=0;c<this.d.length;c++)b.values[this.d[c]]=a};function Kg(a,b){this.d=a;this.od=b}t(Kg,Hg);
Kg.prototype.b=function(a,b,c){var d=b;if(this.od)if(a[b]==id){if(++b==a.length)return d}else return d;var e=this.d[0].b(a,b,c);if(e==b)return d;b=e;for(d=1;d<this.d.length&&b<a.length;d++){e=this.d[d].b(a,b,c);if(e==b)break;b=e}return b};function Lg(){this.b=this.Oa=null;this.error=!1;this.values={};this.d=null}n=Lg.prototype;n.clone=function(){var a=new this.constructor;a.Oa=this.Oa;a.b=this.b;a.d=this.d;return a};n.dd=function(a,b){this.Oa=a;this.b=b};n.Ab=function(){this.error=!0;return 0};
function Mg(a,b){a.Ab([b]);return null}n.$c=function(a){return Mg(this,a)};n.cc=function(a){return Mg(this,a)};n.pb=function(a){return Mg(this,a)};n.Nb=function(a){return Mg(this,a)};n.Mb=function(a){return Mg(this,a)};n.Lb=function(a){return Mg(this,a)};n.zc=function(a){return Mg(this,a)};n.dc=function(a){return Mg(this,a)};n.ab=function(a){this.Ab(a.values);return null};n.ob=function(){this.error=!0;return null};n.yb=function(a){return Mg(this,a)};n.Kb=function(){this.error=!0;return null};
function Ng(){Lg.call(this)}t(Ng,Lg);Ng.prototype.Ab=function(a){for(var b=0,c=0;b<a.length;){var d=this.Oa[c].b(a,b,this);if(d>b)b=d,c=0;else if(++c==this.Oa.length){this.error=!0;break}}return b};function Og(){Lg.call(this)}t(Og,Lg);Og.prototype.Ab=function(a){if(a.length>this.Oa.length||0==a.length)return this.error=!0,0;for(var b=0;b<this.Oa.length;b++){for(var c=b;c>=a.length;)c=1==c?0:c-2;if(this.Oa[b].b(a,c,this)!=c+1)return this.error=!0,0}return a.length};function Pg(){Lg.call(this)}
t(Pg,Lg);Pg.prototype.Ab=function(a){for(var b=a.length,c=0;c<a.length;c++)if(a[c]===id){b=c;break}if(b>this.Oa.length||0==a.length)return this.error=!0,0;for(c=0;c<this.Oa.length;c++){for(var d=c;d>=b;)d=1==d?0:d-2;var e;if(b+1<a.length)for(e=b+c+1;e>=a.length;)e-=e==b+2?1:2;else e=d;if(2!=this.Oa[c].b([a[d],a[e]],0,this))return this.error=!0,0}return a.length};function Qg(){Lg.call(this)}t(Qg,Ng);
Qg.prototype.ob=function(a){for(var b={},c=0;c<a.values.length;c++){this.values={};if(a.values[c]instanceof dd)this.error=!0;else{a.values[c].T(this);for(var d=b,e=this.values,f=0;f<this.b.length;f++){var g=this.b[f],h=e[g]||this.d.h[g],l=d[g];l||(l=[],d[g]=l);l.push(h)}this.values["background-color"]&&c!=a.values.length-1&&(this.error=!0)}if(this.error)return null}this.values={};for(var k in b)this.values[k]="background-color"==k?b[k].pop():new dd(b[k]);return null};function Rg(){Lg.call(this)}
t(Rg,Ng);Rg.prototype.dd=function(a,b){Ng.prototype.dd.call(this,a,b);this.b.push("font-family","line-height","font-size")};
Rg.prototype.Ab=function(a){var b=Ng.prototype.Ab.call(this,a);if(b+2>a.length)return this.error=!0,b;this.error=!1;var c=this.d.e;if(!a[b].T(c["font-size"]))return this.error=!0,b;this.values["font-size"]=a[b++];if(a[b]===id){b++;if(b+2>a.length||!a[b].T(c["line-height"]))return this.error=!0,b;this.values["line-height"]=a[b++]}var d=b==a.length-1?a[b]:new cd(a.slice(b,a.length));if(!d.T(c["font-family"]))return this.error=!0,b;this.values["font-family"]=d;return a.length};
Rg.prototype.ob=function(a){a.values[0].T(this);if(this.error)return null;for(var b=[this.values["font-family"]],c=1;c<a.values.length;c++)b.push(a.values[c]);a=new dd(b);a.T(this.d.e["font-family"])?this.values["font-family"]=a:this.error=!0;return null};Rg.prototype.pb=function(a){if(a=this.d.d[a.name])for(var b in a)this.values[b]=a[b];else this.error=!0;return null};var Sg={SIMPLE:Ng,INSETS:Og,INSETS_SLASH:Pg,COMMA:Qg,FONT:Rg};
function Tg(){this.e={};this.k={};this.h={};this.b={};this.d={};this.f={};this.j=[];this.g=[]}function Ug(a,b){var c;if(3==b.type)c=new I(b.B,b.text);else if(7==b.type)c=wf(b.text);else if(1==b.type)c=H(b.text);else throw Error("unexpected replacement");if(yg(a)){var d=a.b[0].b.d,e;for(e in d)d[e]=c;return a}throw Error("unexpected replacement");}
function Vg(a,b,c){for(var d=new ug,e=0;e<b;e++)Ag(d,a.clone(),1);if(c==Number.POSITIVE_INFINITY)Ag(d,a,3);else for(e=b;e<c;e++)Ag(d,a.clone(),2);return d}function Wg(a){var b=new ug,c=b.b.length;b.b.push(new sg(a));a=new tg(c,!0);var d=new tg(c,!1);vg(b,b.match,c);b.f?(b.e.push(b.d.length),b.f=!1):b.error.push(b.d.length);b.d.push(d);b.match.push(b.d.length);b.d.push(a);return b}
function Xg(a,b){var c;switch(a){case "COMMA":c=new Fg(b);break;case "SPACE":c=new Eg(b);break;default:c=new Gg(a.toLowerCase(),b)}return Wg(c)}
function Yg(a){a.b.HASHCOLOR=Wg(new zg(64,S,S));a.b.POS_INT=Wg(new zg(32,S,S));a.b.POS_NUM=Wg(new zg(16,S,S));a.b.POS_PERCENTAGE=Wg(new zg(8,S,{"%":G}));a.b.NEGATIVE=Wg(new zg(256,S,S));a.b.ZERO=Wg(new zg(512,S,S));a.b.ZERO_PERCENTAGE=Wg(new zg(1024,S,S));a.b.POS_LENGTH=Wg(new zg(8,S,{em:G,ex:G,ch:G,rem:G,vh:G,vw:G,vmin:G,vmax:G,cm:G,mm:G,"in":G,px:G,pt:G,pc:G,q:G}));a.b.POS_ANGLE=Wg(new zg(8,S,{deg:G,grad:G,rad:G,turn:G}));a.b.POS_TIME=Wg(new zg(8,S,{s:G,ms:G}));a.b.FREQUENCY=Wg(new zg(8,S,{Hz:G,
kHz:G}));a.b.RESOLUTION=Wg(new zg(8,S,{dpi:G,dpcm:G,dppx:G}));a.b.URI=Wg(new zg(128,S,S));a.b.IDENT=Wg(new zg(4,S,S));a.b.STRING=Wg(new zg(2,S,S));var b={"font-family":H("sans-serif")};a.d.caption=b;a.d.icon=b;a.d.menu=b;a.d["message-box"]=b;a.d["small-caption"]=b;a.d["status-bar"]=b}function Zg(a){return!!a.match(/^[A-Z_0-9]+$/)}
function $g(a,b,c){var d=x(b);if(0==d.type)return null;var e={"":!0};if(14==d.type){do{A(b);d=x(b);if(1!=d.type)throw Error("Prefix name expected");e[d.text]=!0;A(b);d=x(b)}while(16==d.type);if(15!=d.type)throw Error("']' expected");A(b);d=x(b)}if(1!=d.type)throw Error("Property name expected");if(2==c?"SHORTHANDS"==d.text:"DEFAULTS"==d.text)return A(b),null;d=d.text;A(b);if(2!=c){if(39!=x(b).type)throw Error("'=' expected");Zg(d)||(a.k[d]=e)}else if(18!=x(b).type)throw Error("':' expected");return d}
function ah(a,b){for(;;){var c=$g(a,b,1);if(!c)break;for(var d=[],e=[],f="",g,h=!0,l=function(){if(0==d.length)throw Error("No values");var a;if(1==d.length)a=d[0];else{var b=f,c=d;a=new ug;if("||"==b){for(b=0;b<c.length;b++){var e=new ug,g=e;if(g.b.length)throw Error("invalid call");var h=new sg(xg);h.d=2*b+1;g.b.push(h);var h=new tg(0,!0),k=new tg(0,!1);g.e.push(g.d.length);g.d.push(k);g.match.push(g.d.length);g.d.push(h);Ag(e,c[b],1);wg(e,e.match,!1,b);Ag(a,e,0==b?1:4)}c=new ug;if(c.b.length)throw Error("invalid call");
wg(c,c.match,!0,-1);Ag(c,a,3);a=[c.match,c.e,c.error];for(b=0;b<a.length;b++)wg(c,a[b],!1,-1);a=c}else{switch(b){case " ":e=1;break;case "|":case "||":e=4;break;default:throw Error("unexpected op");}for(b=0;b<c.length;b++)Ag(a,c[b],0==b?1:e)}}return a},k=function(a){if(h)throw Error("'"+a+"': unexpected");if(f&&f!=a)throw Error("mixed operators: '"+a+"' and '"+f+"'");f=a;h=!0},m=null;!m;)switch(A(b),g=x(b),g.type){case 1:h||k(" ");if(Zg(g.text)){var p=a.b[g.text];if(!p)throw Error("'"+g.text+"' unexpected");
d.push(p.clone())}else p={},p[g.text]=H(g.text),d.push(Wg(new zg(0,p,S)));h=!1;break;case 5:p={};p[""+g.B]=new md(g.B);d.push(Wg(new zg(0,p,S)));h=!1;break;case 34:k("|");break;case 25:k("||");break;case 14:h||k(" ");e.push({qd:d,md:f,Ob:"["});f="";d=[];h=!0;break;case 6:h||k(" ");e.push({qd:d,md:f,Ob:"(",Eb:g.text});f="";d=[];h=!0;break;case 15:g=l();p=e.pop();if("["!=p.Ob)throw Error("']' unexpected");d=p.qd;d.push(g);f=p.md;h=!1;break;case 11:g=l();p=e.pop();if("("!=p.Ob)throw Error("')' unexpected");
d=p.qd;d.push(Xg(p.Eb,g));f=p.md;h=!1;break;case 18:if(h)throw Error("':' unexpected");A(b);d.push(Ug(d.pop(),x(b)));break;case 22:if(h)throw Error("'?' unexpected");d.push(Vg(d.pop(),0,1));break;case 36:if(h)throw Error("'*' unexpected");d.push(Vg(d.pop(),0,Number.POSITIVE_INFINITY));break;case 23:if(h)throw Error("'+' unexpected");d.push(Vg(d.pop(),1,Number.POSITIVE_INFINITY));break;case 12:A(b);g=x(b);if(5!=g.type)throw Error("<int> expected");var q=p=g.B;A(b);g=x(b);if(16==g.type){A(b);g=x(b);
if(5!=g.type)throw Error("<int> expected");q=g.B;A(b);g=x(b)}if(13!=g.type)throw Error("'}' expected");d.push(Vg(d.pop(),p,q));break;case 17:m=l();if(0<e.length)throw Error("unclosed '"+e.pop().Ob+"'");break;default:throw Error("unexpected token");}A(b);Zg(c)?a.b[c]=m:a.e[c]=1!=m.b.length||0!=m.b[0].d?new Eg(m):m.b[0].b}}
function bh(a,b){for(var c={},d=0;d<b.length;d++)for(var e=b[d],f=a.f[e],e=f?f.b:[e],f=0;f<e.length;f++){var g=e[f],h=a.h[g];h?c[g]=h:u.b("Unknown property in makePropSet:",g)}return c}
function ch(a,b,c,d,e){var f="",g=b;b=b.toLowerCase();var h=b.match(/^-([a-z]+)-([-a-z0-9]+)$/);h&&(f=h[1],b=h[2]);if((h=a.k[b])&&h[f])if(f=a.e[b])(a=c===Id||c.hd()?c:c.T(f))?e.Za(b,a,d):e.Sb(g,c);else if(b=a.f[b].clone(),c===Id)for(c=0;c<b.b.length;c++)e.Za(b.b[c],Id,d);else{c.T(b);if(b.error)d=!1;else{for(a=0;a<b.b.length;a++)f=b.b[a],e.Za(f,b.values[f]||b.d.h[f],d);d=!0}d||e.Sb(g,c)}else e.yc(g,c)}
var dh=new uf(function(){var a=L("loadValidatorSet.load"),b=va("validation.txt",ua),c=of(b),d=new Tg;Yg(d);c.then(function(c){try{if(c.responseText){var f=new Tb(c.responseText,null);for(ah(d,f);;){var g=$g(d,f,2);if(!g)break;for(c=[];;){A(f);var h=x(f);if(17==h.type){A(f);break}switch(h.type){case 1:c.push(H(h.text));break;case 4:c.push(new ld(h.B));break;case 5:c.push(new md(h.B));break;case 3:c.push(new I(h.B,h.text));break;default:throw Error("unexpected token");}}d.h[g]=1<c.length?new cd(c):
c[0]}for(;;){var l=$g(d,f,3);if(!l)break;var k=z(f,1),m;1==k.type&&Sg[k.text]?(m=new Sg[k.text],A(f)):m=new Ng;m.d=d;g=!1;h=[];c=!1;for(var p=[],q=[];!g;)switch(A(f),k=x(f),k.type){case 1:if(d.e[k.text])h.push(new Ig(m.d,k.text)),q.push(k.text);else if(d.f[k.text]instanceof Og){var v=d.f[k.text];h.push(new Jg(v.d,v.b));q.push.apply(q,v.b)}else throw Error("'"+k.text+"' is neither a simple property nor an inset shorthand");break;case 19:if(0<h.length||c)throw Error("unexpected slash");c=!0;break;case 14:p.push({od:c,
Oa:h});h=[];c=!1;break;case 15:var r=new Kg(h,c),y=p.pop(),h=y.Oa;c=y.od;h.push(r);break;case 17:g=!0;A(f);break;default:throw Error("unexpected token");}m.dd(h,q);d.f[l]=m}d.g=bh(d,["background"]);d.j=bh(d,"margin border padding columns column-gap column-rule column-fill".split(" "))}else u.error("Error: missing",b)}catch(J){u.error(J,"Error:")}O(a,d)});return N(a)},"validatorFetcher");var eh={"font-style":Rd,"font-variant":Rd,"font-weight":Rd},fh="OTTO"+(new Date).valueOf(),gh=1;function hh(a,b){var c={},d;for(d in a)c[d]=a[d].evaluate(b,d);for(var e in eh)c[e]||(c[e]=eh[e]);return c}function ih(a){a=this.wb=a;var b=new Ia,c;for(c in eh)b.append(" "),b.append(a[c].toString());this.d=b.toString();this.src=this.wb.src?this.wb.src.toString():null;this.e=[];this.f=[];this.b=(c=this.wb["font-family"])?c.stringValue():null}
function jh(a,b,c){var d=new Ia;d.append("@font-face {\n  font-family: ");d.append(a.b);d.append(";\n  ");for(var e in eh)d.append(e),d.append(": "),a.wb[e].ya(d,!0),d.append(";\n  ");c?(d.append('src: url("'),b=(window.URL||window.webkitURL).createObjectURL(c),d.append(b),a.e.push(b),a.f.push(c),d.append('")')):(d.append("src: "),d.append(b));d.append(";\n}\n");return d.toString()}function kh(a){this.d=a;this.b={}}
function lh(a,b){if(b instanceof dd){for(var c=b.values,d=[],e=0;e<c.length;e++){var f=c[e],g=a.b[f.stringValue()];g&&d.push(H(g));d.push(f)}return new dd(d)}return(c=a.b[b.stringValue()])?new dd([H(c),b]):b}function mh(a,b){this.d=a;this.b=b;this.e={};this.f=0}function nh(a,b,c){b=b.b;var d=c.b[b];if(d)return d;d="Fnt_"+ ++a.f;return c.b[b]=d}
function oh(a,b,c,d){var e=L("initFont"),f=b.src,g={},h;for(h in eh)g[h]=b.wb[h];d=nh(a,b,d);g["font-family"]=H(d);var l=new ih(g),k=a.b.ownerDocument.createElement("span");k.textContent="M";var m=(new Date).valueOf()+1E3;b=a.d.ownerDocument.createElement("style");h=fh+gh++;b.textContent=jh(l,"",pf([h]));a.d.appendChild(b);a.b.appendChild(k);k.style.visibility="hidden";k.style.fontFamily=d;for(var p in eh)w(k,p,g[p].toString());var g=k.getBoundingClientRect(),q=g.right-g.left,v=g.bottom-g.top;b.textContent=
jh(l,f,c);u.e("Starting to load font:",f);var r=!1;kf(function(){var a=k.getBoundingClientRect(),b=a.bottom-a.top;if(q!=a.right-a.left||v!=b)return r=!0,M(!1);(new Date).valueOf()>m?a=M(!1):(a=L("Frame.sleep"),df(a).Ua(!0,10),a=N(a));return a}).then(function(){r?u.e("Loaded font:",f):u.b("Failed to load font:",f);a.b.removeChild(k);O(e,l)});return N(e)}
function ph(a,b,c){var d=b.src,e=a.e[d];e?pg(e,function(a){if(a.d==b.d){var e=b.b,h=c.b[e];a=a.b;if(h){if(h!=a)throw Error("E_FONT_FAMILY_INCONSISTENT "+b.b);}else c.b[e]=a;u.b("Found already-loaded font:",d)}else u.b("E_FONT_FACE_INCOMPATIBLE",b.src)}):(e=new uf(function(){var e=L("loadFont"),g=c.d?c.d(d):null;g?of(d,"blob").then(function(d){d.nc?g(d.nc).then(function(d){oh(a,b,d,c).ra(e)}):O(e,null)}):oh(a,b,null,c).ra(e);return N(e)},"loadFont "+d),a.e[d]=e,e.start());return e}
function qh(a,b,c){for(var d=[],e=0;e<b.length;e++){var f=b[e];f.src&&f.b?d.push(ph(a,f,c)):u.b("E_FONT_FACE_INVALID")}return qg(d)};function rh(a,b,c){this.j=a;this.url=b;this.b=c;this.lang=null;this.f=-1;this.root=c.documentElement;a=null;if("http://www.w3.org/1999/xhtml"==this.root.namespaceURI){for(b=this.root.firstChild;b;b=b.nextSibling)if(1==b.nodeType&&(c=b,"http://www.w3.org/1999/xhtml"==c.namespaceURI))switch(c.localName){case "head":a=c}this.lang=this.root.getAttribute("lang")}else if("http://www.gribuser.ru/xml/fictionbook/2.0"==this.root.namespaceURI){a=this.root;for(b=this.root.firstChild;b;b=b.nextSibling);b=sh(sh(sh(sh(new th([this.b]),
"FictionBook"),"description"),"title-info"),"lang").textContent();0<b.length&&(this.lang=b[0])}else if("http://example.com/sse"==this.root.namespaceURI)for(c=this.root.firstElementChild;c;c=c.nextElementSibling)"meta"===c.localName&&(a=c);this.h=a;this.e=this.root;this.g=1;this.e.setAttribute("data-adapt-eloff","0")}
function uh(a,b){var c=b.getAttribute("data-adapt-eloff");if(c)return parseInt(c,10);for(var c=a.g,d=a.e;d!=b;){var e=d.firstChild;if(!e)for(;!(e=d.nextSibling);)if(d=d.parentNode,null==d)throw Error("Internal error");d=e;1==e.nodeType?(e.setAttribute("data-adapt-eloff",c.toString()),++c):c+=e.textContent.length}a.g=c;a.e=b;return c-1}
function vh(a,b,c,d){var e=0,f=null;if(1==b.nodeType){if(!d)return uh(a,b)}else{e=c;f=b.previousSibling;if(!f)return b=b.parentNode,e+=1,uh(a,b)+e;b=f}for(;;){for(;b.lastChild;)b=b.lastChild;if(1==b.nodeType)break;e+=b.textContent.length;f=b.previousSibling;if(!f){b=b.parentNode;break}b=f}e+=1;return uh(a,b)+e}function wh(a){0>a.f&&(a.f=vh(a,a.root,0,!0));return a.f}
function xh(a,b){for(var c,d=a.root;;){c=uh(a,d);if(c>=b)return d;var e=d.children;if(!e)break;var f=Qa(e.length,function(c){return uh(a,e[c])>b});if(0==f)break;if(f<e.length&&uh(a,e[f])<=b)throw Error("Consistency check failed!");d=e[f-1]}c=c+1;for(var f=d,g=f.firstChild||f.nextSibling,h=null;;){if(g){if(1==g.nodeType)break;h=f=g;c+=g.textContent.length;if(c>b)break}else if(f=f.parentNode,!f)break;g=f.nextSibling}return h||d}
function yh(a,b){var c=b.getAttribute("id");c&&!a.d[c]&&(a.d[c]=b);(c=b.getAttributeNS("http://www.w3.org/XML/1998/namespace","id"))&&!a.d[c]&&(a.d[c]=b);for(c=b.firstElementChild;c;c=c.nextElementSibling)yh(a,c)}function zh(a,b){var c=b.match(/([^#]*)\#(.+)$/);if(!c||c[1]&&c[1]!=a.url)return null;var c=c[2],d=a.b.getElementById(c);!d&&a.b.getElementsByName&&(d=a.b.getElementsByName(c)[0]);d||(a.d||(a.d={},yh(a,a.b.documentElement)),d=a.d[c]);return d}
var Ah={ge:"text/html",he:"text/xml",Zd:"application/xml",Yd:"application/xhtml_xml",de:"image/svg+xml"};function Ch(a,b,c){c=c||new DOMParser;var d;try{d=c.parseFromString(a,b)}catch(e){}if(d){a=d.documentElement;if("parsererror"===a.localName)return null;for(a=a.firstChild;a;a=a.nextSibling)if("parsererror"===a.localName)return null}else return null;return d}
function Dh(a){var b=a.contentType;if(b){for(var c=Object.keys(Ah),d=0;d<c.length;d++)if(Ah[c[d]]===b)return b;if(b.match(/\+xml$/))return"application/xml"}if(a=a.url.match(/\.([^./]+)$/))switch(a[1]){case "html":case "htm":return"text/html";case "xhtml":case "xht":return"application/xhtml_xml";case "svg":case "svgz":return"image/svg+xml";case "opf":case "xml":return"application/xml"}return null}
function Eh(a,b){var c=a.responseXML;if(!c){var d=new DOMParser,e=a.responseText;if(e){var f=Dh(a);(c=Ch(e,f||"application/xml",d))&&!f&&(f=c.documentElement,"html"!==f.localName.toLowerCase()||f.namespaceURI?"svg"===f.localName.toLowerCase()&&"image/svg+xml"!==c.contentType&&(c=Ch(e,"image/svg+xml",d)):c=Ch(e,"text/html",d));c||(c=Ch(e,"text/html",d))}}c=c?new rh(b,a.url,c):null;return M(c)}function Fh(a){this.Eb=a}
function Gh(){var a=Hh;return new Fh(function(b){return a.Eb(b)&&1==b.nodeType&&"http://www.idpf.org/2008/embedding"==b.getAttribute("Algorithm")})}function Ih(){var a=Gh(),b=Hh;return new Fh(function(c){if(!b.Eb(c))return!1;c=new th([c]);c=sh(c,"EncryptionMethod");a&&(c=Jh(c,a));return 0<c.b.length})}var Hh=new Fh(function(){return!0});function th(a){this.b=a}function Kh(a){return a.b}function Jh(a,b){for(var c=[],d=0;d<a.b.length;d++){var e=a.b[d];b.Eb(e)&&c.push(e)}return new th(c)}
function Lh(a,b){function c(a){d.push(a)}for(var d=[],e=0;e<a.b.length;e++)b(a.b[e],c);return new th(d)}th.prototype.forEach=function(a){for(var b=[],c=0;c<this.b.length;c++)b.push(a(this.b[c]));return b};function Mh(a,b){for(var c=[],d=0;d<a.b.length;d++){var e=b(a.b[d]);null!=e&&c.push(e)}return c}function sh(a,b){return Lh(a,function(a,d){for(var e=a.firstChild;e;e=e.nextSibling)e.localName==b&&d(e)})}
function Nh(a){return Lh(a,function(a,c){for(var d=a.firstChild;d;d=d.nextSibling)1==d.nodeType&&c(d)})}function Oh(a,b){return Mh(a,function(a){return 1==a.nodeType?a.getAttribute(b):null})}th.prototype.textContent=function(){return this.forEach(function(a){return a.textContent})};var Ph={transform:!0,"transform-origin":!0},Qh={top:!0,bottom:!0,left:!0,right:!0};function Rh(a,b,c){this.target=a;this.name=b;this.value=c}var Sh={show:function(a){a.style.visibility="visible"},hide:function(a){a.style.visibility="hidden"},play:function(a){a.currentTime=0;a.play()},pause:function(a){a.pause()},resume:function(a){a.play()},mute:function(a){a.muted=!0},unmute:function(a){a.muted=!1}};
function Th(a,b){var c=Sh[b];return c?function(){for(var b=0;b<a.length;b++)try{c(a[b])}catch(e){}}:null}
function Uh(a,b){this.e={};this.M=a;this.b=b;this.w=null;this.h=[];var c=this;this.D=function(a){var b=a.currentTarget,f=b.getAttribute("href")||b.getAttributeNS("http://www.w3.org/1999/xlink","href");f&&(a.preventDefault(),Ya(c,{type:"hyperlink",target:null,currentTarget:null,le:b,href:f}))};this.j={};this.d={width:0,height:0};this.l=this.k=!1;this.G=0;this.position=null;this.offset=-1;this.g=null;this.f=[];this.u={top:{},bottom:{},left:{},right:{}}}t(Uh,Xa);
function Vh(a){a.H=!0;a.M.setAttribute("data-vivliostyle-auto-page-width",!0)}function Wh(a){a.F=!0;a.M.setAttribute("data-vivliostyle-auto-page-height",!0)}function Xh(a,b,c){var d=a.j[c];d?d.push(b):a.j[c]=[b]}Uh.prototype.zoom=function(a){w(this.M,"transform","scale("+a+")")};Uh.prototype.A=function(){return this.w||this.M};
function Yh(a,b){if(1==a.nodeType)return!1;var c=a.textContent;switch(b){case 0:return!!c.match(/^\s*$/);case 1:return!!c.match(/^[ \t\f]*$/);case 2:return 0==c.length}throw Error("Unexpected whitespace: "+b);}function Zh(a,b,c,d,e,f,g,h){this.f=a;this.g=b;this.b=c;this.Ea=d;this.j=e;this.d=f;this.Td=g;this.h=h;this.e=-1}function $h(a,b){return a.d?!b.d||a.Ea>b.Ea?!0:a.h:!1}function ai(a,b){return a.top-b.top}function bi(a,b){return b.right-a.right}
function ci(a,b,c,d,e,f,g){this.Y=a;this.Uc=d;this.pd=null;this.root=b;this.ba=c;this.type=f;e&&(e.pd=this);this.b=g}function di(a,b){this.Rd=a;this.count=b}function ei(a,b,c){this.Z=a;this.parent=b;this.ga=c;this.ca=0;this.L=!1;this.Na=0;this.da=b?b.da:null;this.qa=this.xa=null;this.H=!1;this.b=!0;this.e=!1;this.h=b?b.h:0;this.u=this.j=this.N=null;this.A=!1;this.w=b?b.w:0;this.k=b?b.k:!1;this.C=this.D=this.g=null;this.l=b?b.l:{};this.f=b?b.f:!1;this.F=b?b.F:"ltr";this.d=b?b.d:null}
function fi(a){a.b=!0;a.h=a.parent?a.parent.h:0;a.C=null;a.ca=0;a.L=!1;a.j=null;a.u=null;a.A=!1;a.g=null;a.D=null;a.xa=null;a.k=a.parent?a.parent.k:!1;a.f=a.parent?a.parent.f:!1;a.xa=null}function gi(a){var b=new ei(a.Z,a.parent,a.ga);b.ca=a.ca;b.L=a.L;b.xa=a.xa;b.Na=a.Na;b.da=a.da;b.qa=a.qa;b.b=a.b;b.h=a.h;b.j=a.j;b.u=a.u;b.k=a.k;b.A=a.A;b.w=a.w;b.g=a.g;b.D=a.D;b.C=a.C;b.d=a.d;b.f=a.f;b.e=a.e;return b}ei.prototype.modify=function(){return this.H?gi(this):this};
function hi(a){var b=a;do{if(b.H)break;b.H=!0;b=b.parent}while(b);return a}ei.prototype.clone=function(){for(var a=gi(this),b=a,c;null!=(c=b.parent);)c=gi(c),b=b.parent=c;return a};function ii(a){return{ha:a.Z,Na:a.Na,da:a.da,xa:a.xa,qa:a.qa?ii(a.qa):null}}function ji(a){var b=a,c=[];do b.d&&b.parent&&b.parent.d!==b.d||c.push(ii(b)),b=b.parent;while(b);return{ka:c,ca:a.ca,L:a.L}}function ki(a){this.Ta=a;this.b=this.d=null}
ki.prototype.clone=function(){var a=new ki(this.Ta);if(this.d){a.d=[];for(var b=0;b<this.d.length;++b)a.d[b]=this.d[b]}if(this.b)for(a.b=[],b=0;b<this.b.length;++b)a.b[b]=this.b[b];return a};function li(a,b){this.d=a;this.b=b}li.prototype.clone=function(){return new li(this.d.clone(),this.b)};function mi(){this.b=[]}mi.prototype.clone=function(){for(var a=new mi,b=this.b,c=a.b,d=0;d<b.length;d++)c[d]=b[d].clone();return a};function ni(){this.d=0;this.b={};this.e=0}
ni.prototype.clone=function(){var a=new ni;a.d=this.d;a.f=this.f;a.e=this.e;a.g=this.g;for(var b in this.b)a.b[b]=this.b[b].clone();return a};function oi(a){this.d=a;this.F=this.D=this.height=this.width=this.w=this.k=this.H=this.j=this.sa=this.ea=this.Fa=this.$=this.marginBottom=this.marginTop=this.marginRight=this.marginLeft=this.top=this.left=0;this.rb=this.N=null;this.pa=this.sb=this.Ka=this.tb=this.e=0;this.b=!1}function pi(a){return a.marginTop+a.ea+a.k}
function qi(a){return a.marginBottom+a.sa+a.w}function ri(a){return a.marginLeft+a.$+a.j}function si(a){return a.marginRight+a.Fa+a.H}function ti(a,b){a.d=b.d;a.left=b.left;a.top=b.top;a.marginLeft=b.marginLeft;a.marginRight=b.marginRight;a.marginTop=b.marginTop;a.marginBottom=b.marginBottom;a.$=b.$;a.Fa=b.Fa;a.ea=b.ea;a.sa=b.sa;a.j=b.j;a.H=b.H;a.k=b.k;a.w=b.w;a.width=b.width;a.height=b.height;a.D=b.D;a.F=b.F;a.rb=b.rb;a.N=b.N;a.e=b.e;a.tb=b.tb;a.Ka=b.Ka;a.b=b.b}
function ui(a,b,c){a.top=b;a.height=c;w(a.d,"top",b+"px");w(a.d,"height",c+"px")}function vi(a,b,c){a.left=b;a.width=c;w(a.d,"left",b+"px");w(a.d,"width",c+"px")}function wi(a,b){this.b=a;this.d=b}t(wi,ad);wi.prototype.cc=function(a){this.b.appendChild(this.b.ownerDocument.createTextNode(a.b));return null};wi.prototype.dc=function(a){var b=this.b.ownerDocument.createElementNS("http://www.w3.org/1999/xhtml","img");b.setAttribute("src",a.url);this.b.appendChild(b);return null};
wi.prototype.ab=function(a){this.qb(a.values);return null};wi.prototype.Kb=function(a){a=a.ia().evaluate(this.d);"string"===typeof a&&this.b.appendChild(this.b.ownerDocument.createTextNode(a));return null};function xi(a){return null!=a&&a!==Rd&&a!==Qd&&a!==Id};function yi(a,b,c){b=b?"vertical-rl":"horizontal-tb";if("top"===a||"bottom"===a)a=da(a,b,c||null,ha);"block-start"===a&&(a="inline-start");"block-end"===a&&(a="inline-end");if("inline-start"===a||"inline-end"===a){c=da(a,b,c||null,ga);a:{var d=ia[b];if(!d)throw Error("unknown writing-mode: "+b);for(b=0;b<d.length;b++)if(d[b].J===c){b=d[b].I;break a}b=c}"line-left"===b?a="left":"line-right"===b&&(a="right")}"left"!==a&&"right"!==a&&(u.b("Invalid float value: "+a+". Fallback to left."),a="left");return a}
function zi(a,b){this.d=hi(a);this.b=b}function Ai(a,b,c){this.e=a;this.g=b;this.f=c;this.d=[];this.b=[]}
function Bi(a,b,c){b.parentNode&&b.parentNode.removeChild(b);w(b,"float","none");w(b,"position","absolute");var d=a.g.toString(),e=a.f.toString(),f=da(c,d,e||null,ga),g=da(c,d,e||null,ha);w(b,f,"0");switch(g){case "inline-start":case "inline-end":d=da("block-start",d,e||null,ga);w(b,d,"0");break;case "block-start":case "block-end":c=da("inline-start",d,e||null,ga);w(b,c,"0");d=da("max-inline-size",d,e||null,ga);Ha(b,d)||w(b,d,"100%");break;default:throw Error("unknown float direction: "+c);}a.e().appendChild(b)}
function Ci(a,b,c){b=ji(b);for(var d=0;d<a.d.length;d++){var e=a.d[d];if(Di(c,b,ji(e.d)))return e}return null}function Ei(a,b,c){var d=L("tryToAddFloat");b=new zi(b,c);a.d.push(b);a.b.push(b);O(d,b);return N(d)}function Fi(a){return a.b.map(function(a){a=a.b;return new se([new ne(a.X,a.V),new ne(a.U,a.V),new ne(a.U,a.Q),new ne(a.X,a.Q)])})};var Gi={SIMPLE_PROPERTY:"SIMPLE_PROPERTY"},Hi={};function Ii(a,b){if(Gi[a]){var c=Hi[a];c||(c=Hi[a]=[]);c.push(b)}else u.b(Error("Skipping unknown plugin hook '"+a+"'."))}ca("vivliostyle.plugin.registerHook",Ii);ca("vivliostyle.plugin.removeHook",function(a,b){if(Gi[a]){var c=Hi[a];if(c){var d=c.indexOf(b);0<=d&&c.splice(d,1)}}else u.b(Error("Ignoring unknown plugin hook '"+a+"'."))});for(var Ji={azimuth:!0,"border-collapse":!0,"border-spacing":!0,"caption-side":!0,color:!0,cursor:!0,direction:!0,elevation:!0,"empty-cells":!0,"font-kerning":!0,"font-size":!0,"font-family":!0,"font-feature-settings":!0,"font-style":!0,"font-variant":!0,"font-weight":!0,"letter-spacing":!0,"line-break":!0,"line-height":!0,"list-style-image":!0,"list-style-position":!0,"list-style-type":!0,orphans:!0,"overflow-wrap":!0,"pitch-range":!0,quotes:!0,richness:!0,"ruby-align":!0,"ruby-position":!0,"speak-header":!0,
"speak-numeral":!0,"speak-punctuation":!0,"speech-rate":!0,stress:!0,"tab-size":!0,"text-align":!0,"text-align-last":!0,"text-decoration-skip":!0,"text-emphasis-color":!0,"text-emphasis-position":!0,"text-emphasis-style":!0,"text-combine-upright":!0,"text-indent":!0,"text-justify":!0,"text-size-adjust":!0,"text-transform":!0,"text-underline-position":!0,visibility:!0,"voice-family":!0,volume:!0,"white-space":!0,widows:!0,"word-break":!0,"word-spacing":!0,"word-wrap":!0,"writing-mode":!0},Ki={"http://www.idpf.org/2007/ops":!0,
"http://www.w3.org/1999/xhtml":!0,"http://www.w3.org/2000/svg":!0},Li="margin-% padding-% border-%-width border-%-style border-%-color %".split(" "),Mi=["left","right","top","bottom"],Ni={width:!0,height:!0},Oi=0;Oi<Li.length;Oi++)for(var Pi=0;Pi<Mi.length;Pi++){var Qi=Li[Oi].replace("%",Mi[Pi]);Ni[Qi]=!0}function Ri(a){for(var b={},c=0;c<Li.length;c++)for(var d in a){var e=Li[c].replace("%",d),f=Li[c].replace("%",a[d]);b[e]=f;b[f]=e}return b}
var Si=Ri({before:"right",after:"left",start:"top",end:"bottom"}),Ti=Ri({before:"top",after:"bottom",start:"left",end:"right"});function T(a,b){this.value=a;this.Ea=b}n=T.prototype;n.wd=function(){return this};n.Ic=function(a){a=this.value.T(a);return a===this.value?this:new T(a,this.Ea)};n.xd=function(a){return 0==a?this:new T(this.value,this.Ea+a)};n.evaluate=function(a,b){return hg(a,this.value,b)};n.ud=function(){return!0};function Ui(a,b,c){T.call(this,a,b);this.K=c}t(Ui,T);
Ui.prototype.wd=function(){return new T(this.value,this.Ea)};Ui.prototype.Ic=function(a){a=this.value.T(a);return a===this.value?this:new Ui(a,this.Ea,this.K)};Ui.prototype.xd=function(a){return 0==a?this:new Ui(this.value,this.Ea+a,this.K)};Ui.prototype.ud=function(a){return!!this.K.evaluate(a)};function Vi(a,b,c){return(null==b||c.Ea>b.Ea)&&c.ud(a)?c.wd():b}var Wi={"region-id":!0};function Xi(a){return"_"!=a.charAt(0)&&!Wi[a]}function Yi(a,b,c){c?a[b]=c:delete a[b]}
function Zi(a,b){var c=a[b];c||(c={},a[b]=c);return c}function $i(a,b){var c=a[b];c||(c=[],a[b]=c);return c}function aj(a,b,c,d,e,f){if(e){var g=Zi(b,"_pseudos");b=g[e];b||(b={},g[e]=b)}f&&(e=Zi(b,"_regions"),b=e[f],b||(b={},e[f]=b));for(var h in c)"_"!=h.charAt(0)&&(Wi[h]?(f=c[h],e=$i(b,h),Array.prototype.push.apply(e,f)):Yi(b,h,Vi(a,b[h],c[h].xd(d))))}
function bj(a,b){if(0<a.length){a.sort(function(a,b){return b.d()-a.d()});for(var c=null,d=a.length-1;0<=d;d--)c=a[d],c.b=b,b=c;return c}return b}function cj(a,b){this.e=a;this.d=b;this.b=""}t(cj,bd);function dj(a){a=a.e["font-size"].value;var b;a:switch(a.fa.toLowerCase()){case "px":case "in":case "pt":case "pc":case "cm":case "mm":case "q":b=!0;break a;default:b=!1}if(!b)throw Error("Unexpected state");return a.B*lc[a.fa]}
cj.prototype.Nb=function(a){if("em"==a.fa||"ex"==a.fa){var b=pc(this.d,a.fa,!1)/pc(this.d,"em",!1);return new I(a.B*b*dj(this),"px")}if("%"==a.fa){if("font-size"===this.b)return new I(a.B/100*dj(this),"px");b=this.b.match(/height|^(top|bottom)$/)?"vh":"vw";return new I(a.B,b)}return a};cj.prototype.Kb=function(a){return"font-size"==this.b?hg(this.d,a,this.b).T(this):a};function ej(){}ej.prototype.apply=function(){};ej.prototype.h=function(a){return new fj([this,a])};ej.prototype.clone=function(){return this};
function gj(a){this.b=a}t(gj,ej);gj.prototype.apply=function(a){a.f[a.f.length-1].push(this.b.b())};function fj(a){this.b=a}t(fj,ej);fj.prototype.apply=function(a){for(var b=0;b<this.b.length;b++)this.b[b].apply(a)};fj.prototype.h=function(a){this.b.push(a);return this};fj.prototype.clone=function(){return new fj([].concat(this.b))};function hj(a,b,c,d){this.style=a;this.O=b;this.b=c;this.f=d}t(hj,ej);hj.prototype.apply=function(a){aj(a.g,a.w,this.style,this.O,this.b,this.f)};
function U(){this.b=null}t(U,ej);U.prototype.apply=function(a){this.b.apply(a)};U.prototype.d=function(){return 0};U.prototype.e=function(){return!1};function ij(a){this.b=null;this.f=a}t(ij,U);ij.prototype.apply=function(a){0<=a.u.indexOf(this.f)&&this.b.apply(a)};ij.prototype.d=function(){return 10};ij.prototype.e=function(a){this.b&&jj(a.za,this.f,this.b);return!0};function kj(a){this.b=null;this.id=a}t(kj,U);kj.prototype.apply=function(a){a.$!=this.id&&a.sa!=this.id||this.b.apply(a)};
kj.prototype.d=function(){return 11};kj.prototype.e=function(a){this.b&&jj(a.e,this.id,this.b);return!0};function lj(a){this.b=null;this.localName=a}t(lj,U);lj.prototype.apply=function(a){a.d==this.localName&&this.b.apply(a)};lj.prototype.d=function(){return 8};lj.prototype.e=function(a){this.b&&jj(a.bc,this.localName,this.b);return!0};function mj(a,b){this.b=null;this.f=a;this.localName=b}t(mj,U);mj.prototype.apply=function(a){a.d==this.localName&&a.e==this.f&&this.b.apply(a)};mj.prototype.d=function(){return 8};
mj.prototype.e=function(a){if(this.b){var b=a.b[this.f];b||(b="ns"+a.g++ +":",a.b[this.f]=b);jj(a.f,b+this.localName,this.b)}return!0};function nj(a){this.b=null;this.f=a}t(nj,U);nj.prototype.apply=function(a){var b=a.b;if(b&&"a"==a.d){var c=b.getAttribute("href");c&&c.match(/^#/)&&(b=b.ownerDocument.getElementById(c.substring(1)))&&(b=b.getAttributeNS("http://www.idpf.org/2007/ops","type"))&&b.match(this.f)&&this.b.apply(a)}};function oj(a){this.b=null;this.f=a}t(oj,U);
oj.prototype.apply=function(a){a.e==this.f&&this.b.apply(a)};function pj(a,b){this.b=null;this.f=a;this.name=b}t(pj,U);pj.prototype.apply=function(a){a.b&&a.b.hasAttributeNS(this.f,this.name)&&this.b.apply(a)};function qj(a,b,c){this.b=null;this.f=a;this.name=b;this.value=c}t(qj,U);qj.prototype.apply=function(a){a.b&&a.b.getAttributeNS(this.f,this.name)==this.value&&this.b.apply(a)};qj.prototype.d=function(){return"type"==this.name&&"http://www.idpf.org/2007/ops"==this.f?9:0};
qj.prototype.e=function(a){return"type"==this.name&&"http://www.idpf.org/2007/ops"==this.f?(this.b&&jj(a.d,this.value,this.b),!0):!1};function rj(a,b){this.b=null;this.f=a;this.name=b}t(rj,U);rj.prototype.apply=function(a){if(a.b){var b=a.b.getAttributeNS(this.f,this.name);b&&Ki[b]&&this.b.apply(a)}};rj.prototype.d=function(){return 0};rj.prototype.e=function(){return!1};function sj(a,b,c){this.b=null;this.g=a;this.name=b;this.f=c}t(sj,U);
sj.prototype.apply=function(a){if(a.b){var b=a.b.getAttributeNS(this.g,this.name);b&&b.match(this.f)&&this.b.apply(a)}};function tj(a){this.b=null;this.f=a}t(tj,U);tj.prototype.apply=function(a){a.lang.match(this.f)&&this.b.apply(a)};function uj(){this.b=null}t(uj,U);uj.prototype.apply=function(a){a.Fa&&this.b.apply(a)};uj.prototype.d=function(){return 6};function vj(){this.b=null}t(vj,U);vj.prototype.apply=function(a){a.sb&&this.b.apply(a)};vj.prototype.d=function(){return 12};
function wj(a,b){this.b=null;this.f=a;this.Ob=b}t(wj,U);function xj(a,b){var c=a.f;b-=a.Ob;return 0===c?0===b:0===b%c&&0<=b/c}function yj(a,b){wj.call(this,a,b)}t(yj,wj);yj.prototype.apply=function(a){xj(this,a.pa)&&this.b.apply(a)};yj.prototype.d=function(){return 5};function zj(a,b){wj.call(this,a,b)}t(zj,wj);zj.prototype.apply=function(a){xj(this,a.La[a.e][a.d])&&this.b.apply(a)};zj.prototype.d=function(){return 5};function Aj(a,b){wj.call(this,a,b)}t(Aj,wj);
Aj.prototype.apply=function(a){var b=a.H;null===b&&(b=a.H=a.b.parentNode.childElementCount-a.pa+1);xj(this,b)&&this.b.apply(a)};Aj.prototype.d=function(){return 4};function Bj(a,b){wj.call(this,a,b)}t(Bj,wj);Bj.prototype.apply=function(a){var b=a.Ka;if(!b[a.e]){var c=a.b;do{var d=c.namespaceURI,e=c.localName,f=b[d];f||(f=b[d]={});f[e]=(f[e]||0)+1}while(c=c.nextElementSibling)}xj(this,b[a.e][a.d])&&this.b.apply(a)};Bj.prototype.d=function(){return 4};function Cj(){this.b=null}t(Cj,U);
Cj.prototype.apply=function(a){for(var b=a.b.firstChild;b;){switch(b.nodeType){case Node.ELEMENT_NODE:return;case Node.TEXT_NODE:if(0<b.length)return}b=b.nextSibling}this.b.apply(a)};Cj.prototype.d=function(){return 4};function Dj(){this.b=null}t(Dj,U);Dj.prototype.apply=function(a){!1===a.b.disabled&&this.b.apply(a)};Dj.prototype.d=function(){return 5};function Ej(){this.b=null}t(Ej,U);Ej.prototype.apply=function(a){!0===a.b.disabled&&this.b.apply(a)};Ej.prototype.d=function(){return 5};
function Fj(){this.b=null}t(Fj,U);Fj.prototype.apply=function(a){var b=a.b;!0!==b.selected&&!0!==b.checked||this.b.apply(a)};Fj.prototype.d=function(){return 5};function V(a){this.b=null;this.K=a}t(V,U);V.prototype.apply=function(a){a.j[this.K]&&this.b.apply(a)};V.prototype.d=function(){return 5};function Gj(){this.b=!1}t(Gj,ej);Gj.prototype.apply=function(){this.b=!0};Gj.prototype.clone=function(){var a=new Gj;a.b=this.b;return a};function Hj(a){this.b=null;this.f=new Gj;this.g=bj(a,this.f)}
t(Hj,U);Hj.prototype.apply=function(a){this.g.apply(a);this.f.b||this.b.apply(a);this.f.b=!1};Hj.prototype.d=function(){return this.g.d()};function Ij(a){this.K=a}Ij.prototype.b=function(){return this};Ij.prototype.push=function(a,b){0==b&&Jj(a,this.K);return!1};Ij.prototype.pop=function(a,b){return 0==b?(a.j[this.K]--,!0):!1};function Kj(a){this.K=a}Kj.prototype.b=function(){return this};Kj.prototype.push=function(a,b){0==b?Jj(a,this.K):1==b&&a.j[this.K]--;return!1};
Kj.prototype.pop=function(a,b){if(0==b)return a.j[this.K]--,!0;1==b&&Jj(a,this.K);return!1};function Lj(a){this.K=a;this.d=!1}Lj.prototype.b=function(){return new Lj(this.K)};Lj.prototype.push=function(a){return this.d?(a.j[this.K]--,!0):!1};Lj.prototype.pop=function(a,b){if(this.d)return a.j[this.K]--,!0;0==b&&(this.d=!0,Jj(a,this.K));return!1};function Mj(a){this.K=a;this.d=!1}Mj.prototype.b=function(){return new Mj(this.K)};
Mj.prototype.push=function(a,b){this.d&&(-1==b?Jj(a,this.K):0==b&&a.j[this.K]--);return!1};Mj.prototype.pop=function(a,b){if(this.d){if(-1==b)return a.j[this.K]--,!0;0==b&&Jj(a,this.K)}else 0==b&&(this.d=!0,Jj(a,this.K));return!1};function Nj(a,b){this.e=a;this.d=b}Nj.prototype.b=function(){return this};Nj.prototype.push=function(){return!1};Nj.prototype.pop=function(a,b){return 0==b?(Oj(a,this.e,this.d),!0):!1};function Pj(a){this.lang=a}Pj.prototype.b=function(){return this};Pj.prototype.push=function(){return!1};
Pj.prototype.pop=function(a,b){return 0==b?(a.lang=this.lang,!0):!1};function Qj(a){this.d=a}Qj.prototype.b=function(){return this};Qj.prototype.push=function(){return!1};Qj.prototype.pop=function(a,b){return 0==b?(a.D=this.d,!0):!1};function Rj(a,b){this.b=a;this.d=b}t(Rj,bd);
Rj.prototype.pb=function(a){var b=this.b,c=b.D,d=Math.floor(c.length/2)-1;switch(a.name){case "open-quote":a=c[2*Math.min(d,b.l)];b.l++;break;case "close-quote":return 0<b.l&&b.l--,c[2*Math.min(d,b.l)+1];case "no-open-quote":return b.l++,new jd("");case "no-close-quote":return 0<b.l&&b.l--,new jd("")}return a};
var Sj={roman:[4999,1E3,"M",900,"CM",500,"D",400,"CD",100,"C",90,"XC",50,"L",40,"XL",10,"X",9,"IX",5,"V",4,"IV",1,"I"],armenian:[9999,9E3,"\u0584",8E3,"\u0583",7E3,"\u0582",6E3,"\u0581",5E3,"\u0580",4E3,"\u057f",3E3,"\u057e",2E3,"\u057d",1E3,"\u057c",900,"\u057b",800,"\u057a",700,"\u0579",600,"\u0578",500,"\u0577",400,"\u0576",300,"\u0575",200,"\u0574",100,"\u0573",90,"\u0572",80,"\u0571",70,"\u0570",60,"\u056f",50,"\u056e",40,"\u056d",30,"\u056c",20,"\u056b",10,"\u056a",9,"\u0569",8,"\u0568",7,"\u0567",
6,"\u0566",5,"\u0565",4,"\u0564",3,"\u0563",2,"\u0562",1,"\u0561"],georgian:[19999,1E4,"\u10f5",9E3,"\u10f0",8E3,"\u10ef",7E3,"\u10f4",6E3,"\u10ee",5E3,"\u10ed",4E3,"\u10ec",3E3,"\u10eb",2E3,"\u10ea",1E3,"\u10e9",900,"\u10e8",800,"\u10e7",700,"\u10e6",600,"\u10e5",500,"\u10e4",400,"\u10f3",300,"\u10e2",200,"\u10e1",100,"\u10e0",90,"\u10df",80,"\u10de",70,"\u10dd",60,"\u10f2",50,"\u10dc",40,"\u10db",30,"\u10da",20,"\u10d9",10,"\u10d8",9,"\u10d7",8,"\u10f1",7,"\u10d6",6,"\u10d5",5,"\u10d4",4,"\u10d3",
3,"\u10d2",2,"\u10d1",1,"\u10d0"],hebrew:[999,400,"\u05ea",300,"\u05e9",200,"\u05e8",100,"\u05e7",90,"\u05e6",80,"\u05e4",70,"\u05e2",60,"\u05e1",50,"\u05e0",40,"\u05de",30,"\u05dc",20,"\u05db",19,"\u05d9\u05d8",18,"\u05d9\u05d7",17,"\u05d9\u05d6",16,"\u05d8\u05d6",15,"\u05d8\u05d5",10,"\u05d9",9,"\u05d8",8,"\u05d7",7,"\u05d6",6,"\u05d5",5,"\u05d4",4,"\u05d3",3,"\u05d2",2,"\u05d1",1,"\u05d0"]},Tj={latin:"a-z",alpha:"a-z",greek:"\u03b1-\u03c1\u03c3-\u03c9",russian:"\u0430-\u0438\u043a-\u0449\u044d-\u044f"},
Uj={square:"\u25a0",disc:"\u2022",circle:"\u25e6",none:""},Vj={ne:!1,Pb:"\u96f6\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d",mc:"\u5341\u767e\u5343",Od:"\u8ca0"};
function Wj(a){if(9999<a||-9999>a)return""+a;if(0==a)return Vj.Pb.charAt(0);var b=new Ia;0>a&&(b.append(Vj.Od),a=-a);if(10>a)b.append(Vj.Pb.charAt(a));else if(Vj.oe&&19>=a)b.append(Vj.mc.charAt(0)),0!=a&&b.append(Vj.mc.charAt(a-10));else{var c=Math.floor(a/1E3);c&&(b.append(Vj.Pb.charAt(c)),b.append(Vj.mc.charAt(2)));if(c=Math.floor(a/100)%10)b.append(Vj.Pb.charAt(c)),b.append(Vj.mc.charAt(1));if(c=Math.floor(a/10)%10)b.append(Vj.Pb.charAt(c)),b.append(Vj.mc.charAt(0));(a%=10)&&b.append(Vj.Pb.charAt(a))}return b.toString()}
function Xj(a,b){var c=!1,d=!1,e;null!=(e=b.match(/^upper-(.*)/))?(c=!0,b=e[1]):null!=(e=b.match(/^lower-(.*)/))&&(d=!0,b=e[1]);e="";if(Sj[b])a:{e=Sj[b];var f=a;if(f>e[0]||0>=f||f!=Math.round(f))e="";else{for(var g="",h=1;h<e.length;h+=2){var l=e[h],k=Math.floor(f/l);if(20<k){e="";break a}for(f-=k*l;0<k;)g+=e[h+1],k--}e=g}}else if(Tj[b])if(e=a,0>=e||e!=Math.round(e))e="";else{g=Tj[b];f=[];for(h=0;h<g.length;)if("-"==g.substr(h+1,1))for(k=g.charCodeAt(h),l=g.charCodeAt(h+2),h+=3;k<=l;k++)f.push(String.fromCharCode(k));
else f.push(g.substr(h++,1));g="";do e--,h=e%f.length,g=f[h]+g,e=(e-h)/f.length;while(0<e);e=g}else null!=Uj[b]?e=Uj[b]:"decimal-leading-zero"==b?(e=a+"",1==e.length&&(e="0"+e)):"cjk-ideographic"==b||"trad-chinese-informal"==b?e=Wj(a):e=a+"";return c?e.toUpperCase():d?e.toLowerCase():e}
function Yj(a,b){var c=b[0].toString(),d=1<b.length?b[1].stringValue():"decimal",e=a.b.h[c];if(e&&e.length)return new jd(Xj(e&&e.length&&e[e.length-1]||0,d));c=new K(Zj(a.b.tb,c,function(a){return Xj(a||0,d)}));return new cd([c])}
function ak(a,b){var c=b[0].toString(),d=b[1].stringValue(),e=2<b.length?b[2].stringValue():"decimal",f=a.b.h[c],g=new Ia;if(f&&f.length)for(var h=0;h<f.length;h++)0<h&&g.append(d),g.append(Xj(f[h],e));c=new K(bk(a.b.tb,c,function(a){var b=[];if(a.length)for(var c=0;c<a.length;c++)b.push(Xj(a[c],e));a=g.toString();a.length&&b.push(a);return b.length?b.join(d):Xj(0,e)}));return new cd([c])}
Rj.prototype.yb=function(a){switch(a.name){case "attr":if(1==a.values.length)return new jd(this.d&&this.d.getAttribute(a.values[0].stringValue())||"");break;case "counter":if(2>=a.values.length)return Yj(this,a.values);break;case "counters":if(3>=a.values.length)return ak(this,a.values)}u.b("E_CSS_CONTENT_PROP:",a.toString());return new jd("")};var ck=1/1048576;function dk(a,b){for(var c in a)b[c]=a[c].clone()}
function ek(){this.g=0;this.b={};this.bc={};this.f={};this.d={};this.za={};this.e={};this.Ub={};this.P=0}ek.prototype.clone=function(){var a=new ek;a.g=this.g;for(var b in this.b)a.b[b]=this.b[b];dk(this.bc,a.bc);dk(this.f,a.f);dk(this.d,a.d);dk(this.za,a.za);dk(this.e,a.e);dk(this.Ub,a.Ub);a.P=this.P;return a};function jj(a,b,c){var d=a[b];d&&(c=d.h(c));a[b]=c}
function fk(a,b,c){this.k=a;this.g=b;this.tb=c;this.f=[[],[]];this.j={};this.u=this.w=this.b=null;this.oa=this.sa=this.$=this.e=this.d="";this.N=this.F=null;this.sb=this.Fa=!0;this.h={};this.A=[{}];this.D=[new jd("\u201c"),new jd("\u201d"),new jd("\u2018"),new jd("\u2019")];this.l=0;this.lang="";this.zb=[0];this.pa=0;this.ea=[{}];this.La=this.ea[0];this.H=null;this.bb=[this.H];this.rb=[{}];this.Ka=this.ea[0];this.Qa=[]}function Jj(a,b){a.j[b]=(a.j[b]||0)+1}
function gk(a,b,c){(b=b[c])&&b.apply(a)}var hk=[];function ik(a,b,c,d){a.b=null;a.w=d;a.e="";a.d="";a.$="";a.sa="";a.u=b;a.oa="";a.F=hk;a.N=c;jk(a)}function kk(a,b,c){a.h[b]?a.h[b].push(c):a.h[b]=[c];c=a.A[a.A.length-1];c||(c={},a.A[a.A.length-1]=c);c[b]=!0}
function lk(a,b){var c=Jd,d=b.display;d&&(c=d.evaluate(a.g));var e=null,d=null,f=b["counter-reset"];f&&(f=f.evaluate(a.g))&&(e=og(f,!0));(f=b["counter-increment"])&&(f=f.evaluate(a.g))&&(d=og(f,!1));"ol"!=a.d&&"ul"!=a.d||"http://www.w3.org/1999/xhtml"!=a.e||(e||(e={}),e["ua-list-item"]=0);c===Od&&(d||(d={}),d["ua-list-item"]=1);if(e)for(var g in e)kk(a,g,e[g]);if(d)for(var h in d)a.h[h]||kk(a,h,0),g=a.h[h],g[g.length-1]+=d[h];c===Od&&(c=a.h["ua-list-item"],b["ua-list-item-count"]=new T(new ld(c[c.length-
1]),0));a.A.push(null)}function mk(a){var b=a.A.pop();if(b)for(var c in b)(b=a.h[c])&&(1==b.length?delete a.h[c]:b.pop())}function Oj(a,b,c){lk(a,b);b.content&&(b.content=b.content.Ic(new Rj(a,c)));mk(a)}var nk="before transclusion-before footnote-call footnote-marker inner first-letter first-line  transclusion-after after".split(" ");
function ok(a,b,c){a.Qa.push(b);a.N=null;a.b=b;a.w=c;a.e=b.namespaceURI;a.d=b.localName;var d=a.k.b[a.e];a.oa=d?d+a.d:"";a.$=b.getAttribute("id");a.sa=b.getAttributeNS("http://www.w3.org/XML/1998/namespace","id");(d=b.getAttribute("class"))?a.u=d.split(/\s+/):a.u=hk;(d=b.getAttributeNS("http://www.idpf.org/2007/ops","type"))?a.F=d.split(/\s+/):a.F=hk;"style"==a.d&&"http://www.gribuser.ru/xml/fictionbook/2.0"==a.e&&(a.u=[b.getAttribute("name")||""]);(d=b.getAttributeNS("http://www.w3.org/XML/1998/namespace",
"lang"))||"http://www.w3.org/1999/xhtml"!=a.e||(d=b.getAttribute("lang"));d&&(a.f[a.f.length-1].push(new Pj(a.lang)),a.lang=d.toLowerCase());d=a.zb;a.pa=++d[d.length-1];d.push(0);var d=a.ea,e=a.La=d[d.length-1],f=e[a.e];f||(f=e[a.e]={});f[a.d]=(f[a.d]||0)+1;d.push({});d=a.bb;null!==d[d.length-1]?a.H=--d[d.length-1]:a.H=null;d.push(null);d=a.rb;(e=a.Ka=d[d.length-1])&&e[a.e]&&e[a.e][a.d]--;d.push({});jk(a);d=c.quotes;c=null;d&&(d=d.evaluate(a.g))&&(c=new Qj(a.D),d===Qd?a.D=[new jd(""),new jd("")]:
d instanceof cd&&(a.D=d.values));lk(a,a.w);if(d=a.w._pseudos)for(e=!0,f=0;f<nk.length;f++){var g=nk[f];g||(e=!1);(g=d[g])&&(e?Oj(a,g,b):a.f[a.f.length-2].push(new Nj(g,b)))}c&&a.f[a.f.length-2].push(c)}
function jk(a){var b;for(b=0;b<a.u.length;b++)gk(a,a.k.za,a.u[b]);for(b=0;b<a.F.length;b++)gk(a,a.k.d,a.F[b]);gk(a,a.k.e,a.$);gk(a,a.k.bc,a.d);""!=a.d&&gk(a,a.k.bc,"*");gk(a,a.k.f,a.oa);null!==a.N&&(gk(a,a.k.Ub,a.N),gk(a,a.k.Ub,"*"));a.b=null;a.f.push([]);for(var c=1;-1<=c;--c){var d=a.f[a.f.length-c-2];for(b=0;b<d.length;)d[b].push(a,c)?d.splice(b,1):b++}a.Fa=!0;a.sb=!1}
fk.prototype.pop=function(){for(var a=1;-1<=a;--a)for(var b=this.f[this.f.length-a-2],c=0;c<b.length;)b[c].pop(this,a)?b.splice(c,1):c++;this.f.pop();this.Fa=!1};var pk=null;function qk(a,b,c,d,e,f,g){Cf.call(this,a,b,g);this.b=null;this.O=0;this.f=this.h=null;this.l=!1;this.K=c;this.g=d?d.g:pk?pk.clone():new ek;this.w=e;this.k=f;this.j=0}t(qk,Df);qk.prototype.yd=function(a){jj(this.g.bc,"*",a)};function rk(a,b){var c=bj(a.b,b);c!==b&&c.e(a.g)||a.yd(c)}
qk.prototype.fb=function(a,b){if(b||a)this.O+=1,b&&a?this.b.push(new mj(a,b.toLowerCase())):b?this.b.push(new lj(b.toLowerCase())):this.b.push(new oj(a))};qk.prototype.Fc=function(a){this.f?(u.b("::"+this.f,"followed by ."+a),this.b.push(new V(""))):(this.O+=256,this.b.push(new ij(a)))};var sk={"nth-child":yj,"nth-of-type":zj,"nth-last-child":Aj,"nth-last-of-type":Bj};
qk.prototype.Vb=function(a,b){if(this.f)u.b("::"+this.f,"followed by :"+a),this.b.push(new V(""));else{switch(a.toLowerCase()){case "enabled":this.b.push(new Dj);break;case "disabled":this.b.push(new Ej);break;case "checked":this.b.push(new Fj);break;case "root":this.b.push(new vj);break;case "link":this.b.push(new lj("a"));this.b.push(new pj("","href"));break;case "-adapt-href-epub-type":case "href-epub-type":if(b&&1==b.length&&"string"==typeof b[0]){var c=new RegExp("(^|s)"+xa(b[0])+"($|s)");this.b.push(new nj(c))}else this.b.push(new V(""));
break;case "-adapt-footnote-content":case "footnote-content":this.l=!0;break;case "visited":case "active":case "hover":case "focus":this.b.push(new V(""));break;case "lang":b&&1==b.length&&"string"==typeof b[0]?this.b.push(new tj(new RegExp("^"+xa(b[0].toLowerCase())+"($|-)"))):this.b.push(new V(""));break;case "nth-child":case "nth-last-child":case "nth-of-type":case "nth-last-of-type":c=sk[a.toLowerCase()];b&&2==b.length?this.b.push(new c(b[0],b[1])):this.b.push(new V(""));break;case "first-child":this.b.push(new uj);
break;case "last-child":this.b.push(new Aj(0,1));break;case "first-of-type":this.b.push(new zj(0,1));break;case "last-of-type":this.b.push(new Bj(0,1));break;case "only-child":this.b.push(new uj);this.b.push(new Aj(0,1));break;case "only-of-type":this.b.push(new zj(0,1));this.b.push(new Bj(0,1));break;case "empty":this.b.push(new Cj);break;case "before":case "after":case "first-line":case "first-letter":this.Wb(a,b);return;default:u.b("unknown pseudo-class selector: "+a),this.b.push(new V(""))}this.O+=
256}};
qk.prototype.Wb=function(a,b){switch(a){case "before":case "after":case "first-line":case "first-letter":case "footnote-call":case "footnote-marker":case "inner":this.f?(u.b("Double pseudoelement ::"+this.f+"::"+a),this.b.push(new V(""))):this.f=a;break;case "first-n-lines":if(b&&1==b.length&&"number"==typeof b[0]){var c=Math.round(b[0]);if(0<c&&c==b[0]){this.f?(u.b("Double pseudoelement ::"+this.f+"::"+a),this.b.push(new V(""))):this.f="first-"+c+"-lines";break}}default:u.b("Unrecognized pseudoelement: ::"+a),
this.b.push(new V(""))}this.O+=1};qk.prototype.Mc=function(a){this.O+=65536;this.b.push(new kj(a))};
qk.prototype.hc=function(a,b,c,d){this.O+=256;b=b.toLowerCase();d=d||"";var e;switch(c){case 0:e=new pj(a,b);break;case 39:e=new qj(a,b,d);break;case 45:!d||d.match(/\s/)?e=new V(""):e=new sj(a,b,new RegExp("(^|\\s)"+xa(d)+"($|\\s)"));break;case 44:e=new sj(a,b,new RegExp("^"+xa(d)+"($|-)"));break;case 43:d?e=new sj(a,b,new RegExp("^"+xa(d))):e=new V("");break;case 42:d?e=new sj(a,b,new RegExp(xa(d)+"$")):e=new V("");break;case 46:d?e=new sj(a,b,new RegExp(xa(d))):e=new V("");break;case 50:"supported"==
d?e=new rj(a,b):(u.b("Unsupported :: attr selector op:",d),e=new V(""));break;default:u.b("Unsupported attr selector:",c),e=new V("")}this.b.push(e)};var tk=0;n=qk.prototype;n.hb=function(){var a="d"+tk++;rk(this,new gj(new Ij(a)));this.b=[new V(a)]};n.Ec=function(){var a="c"+tk++;rk(this,new gj(new Kj(a)));this.b=[new V(a)]};n.Dc=function(){var a="a"+tk++;rk(this,new gj(new Lj(a)));this.b=[new V(a)]};n.Jc=function(){var a="f"+tk++;rk(this,new gj(new Mj(a)));this.b=[new V(a)]};
n.Fb=function(){uk(this);this.f=null;this.l=!1;this.O=0;this.b=[]};n.$a=function(){var a;0!=this.j?(Ff(this,"E_CSS_UNEXPECTED_SELECTOR"),a=!0):a=!1;a||(this.j=1,this.h={},this.f=null,this.O=0,this.l=!1,this.b=[])};n.error=function(a,b){Df.prototype.error.call(this,a,b);1==this.j&&(this.j=0)};n.Jb=function(a){Df.prototype.Jb.call(this,a);this.j=0};n.ma=function(){uk(this);Df.prototype.ma.call(this);1==this.j&&(this.j=0)};n.ib=function(){Df.prototype.ib.call(this)};
function uk(a){if(a.b){var b=a.O,c;c=a.g;c=c.P+=ck;rk(a,a.Ad(b+c));a.b=null;a.f=null;a.l=!1;a.O=0}}n.Ad=function(a){var b=this.w;this.l&&(b=b?"xxx-bogus-xxx":"footnote");return new hj(this.h,a,this.f,b)};n.Ya=function(a,b,c){ch(this.k,a,b,c,this)};n.Sb=function(a,b){Ef(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};n.yc=function(a,b){Ef(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};
n.Za=function(a,b,c){"display"!=a||b!==Td&&b!==Sd||(this.Za("flow-options",new cd([Cd,Yd]),c),this.Za("flow-into",b,c),b=vd);(Hi.SIMPLE_PROPERTY||[]).forEach(function(d){d=d({name:a,value:b,important:c});a=d.name;b=d.value;c=d.important});var d=c?yf(this):zf(this);Yi(this.h,a,this.K?new Ui(b,d,this.K):new T(b,d))};n.Zb=function(a){switch(a){case "not":a=new vk(this),a.$a(),Bf(this.Y,a)}};function vk(a){qk.call(this,a.d,a.Y,a.K,a,a.w,a.k,!1);this.parent=a;this.e=a.b}t(vk,qk);n=vk.prototype;
n.Zb=function(a){"not"==a&&Ff(this,"E_CSS_UNEXPECTED_NOT")};n.ma=function(){Ff(this,"E_CSS_UNEXPECTED_RULE_BODY")};n.Fb=function(){Ff(this,"E_CSS_UNEXPECTED_NEXT_SELECTOR")};n.ic=function(){this.b&&0<this.b.length&&this.e.push(new Hj(this.b));this.parent.O+=this.O;var a=this.Y;a.b=a.e.pop()};n.error=function(a,b){qk.prototype.error.call(this,a,b);var c=this.Y;c.b=c.e.pop()};function wk(a,b){Cf.call(this,a,b,!1)}t(wk,Df);
wk.prototype.Ya=function(a,b){if(this.d.values[a])this.error("E_CSS_NAME_REDEFINED "+a,this.Rb());else{var c=a.match(/height|^(top|bottom)$/)?"vh":"vw",c=new Qc(this.d,100,c),c=b.ia(this.d,c);this.d.values[a]=c}};function xk(a,b,c,d,e){Cf.call(this,a,b,!1);this.b=d;this.K=c;this.e=e}t(xk,Df);xk.prototype.Ya=function(a,b,c){c?u.b("E_IMPORTANT_NOT_ALLOWED"):ch(this.e,a,b,c,this)};xk.prototype.Sb=function(a,b){u.b("E_INVALID_PROPERTY_VALUE",a+":",b.toString())};
xk.prototype.yc=function(a,b){u.b("E_INVALID_PROPERTY",a+":",b.toString())};xk.prototype.Za=function(a,b,c){c=c?yf(this):zf(this);c+=this.P;this.P+=ck;Yi(this.b,a,this.K?new Ui(b,c,this.K):new T(b,c))};function yk(a,b){ag.call(this,a);this.b={};this.e=b;this.P=0}t(yk,ag);yk.prototype.Ya=function(a,b,c){ch(this.e,a,b,c,this)};yk.prototype.Sb=function(a,b){u.b("E_INVALID_PROPERTY_VALUE",a+":",b.toString())};yk.prototype.yc=function(a,b){u.b("E_INVALID_PROPERTY",a+":",b.toString())};
yk.prototype.Za=function(a,b,c){c=(c?67108864:50331648)+this.P;this.P+=ck;Yi(this.b,a,new T(b,c))};function zk(a,b,c){return(a=a["writing-mode"])&&(b=a.evaluate(b,"writing-mode"))&&b!==Id?b===de:c}function Ak(a,b,c,d){var e={},f;for(f in a)Xi(f)&&(e[f]=a[f]);a=a._regions;if((c||d)&&a)for(d&&(d=["footnote"],c=c?c.concat(d):d),d=0;d<c.length;d++){f=a[c[d]];for(var g in f)Xi(g)&&(e[g]=Vi(b,e[g],f[g]))}return e}
function Bk(a,b,c,d){c=c?Si:Ti;for(var e in a)if(a.hasOwnProperty(e)){var f=a[e];if(f){var g=c[e];if(g){var h=a[g];if(h&&h.Ea>f.Ea)continue;g=Ni[g]?g:e}else g=e;b[g]=d(e,f)}}};function Ck(a,b,c){this.e=a;this.d=b;this.b=c}function Dk(){this.map=[]}function Ek(a){return 0==a.map.length?0:a.map[a.map.length-1].b}function Fk(a,b){if(0==a.map.length)a.map.push(new Ck(b,b,b));else{var c=a.map[a.map.length-1],d=c.b+b-c.d;c.d==c.e?(c.d=b,c.e=b,c.b=d):a.map.push(new Ck(b,b,d))}}function Gk(a,b){0==a.map.length?a.map.push(new Ck(b,0,0)):a.map[a.map.length-1].d=b}function Hk(a,b){var c=Qa(a.map.length,function(c){return b<=a.map[c].d}),c=a.map[c];return c.b-Math.max(0,c.e-b)}
function Ik(a,b){var c=Qa(a.map.length,function(c){return b<=a.map[c].b}),c=a.map[c];return c.e-(c.b-b)}
function Jk(a,b,c,d,e,f,g){this.ba=a;this.root=a.root;this.ea=c;this.f=d;this.h=f;this.d=this.root;this.u={};this.w={};this.D=[];this.l=this.k=null;this.A=new fk(b,d,g);this.e=new Dk;this.Ta=!0;this.F=[];this.$=e;this.N=this.H=!1;this.b=a=uh(a,this.root);Fk(this.e,a);b=Kk(this,this.root);ok(this.A,this.root,b);Lk(this,b,!1);this.j=!0;switch(this.root.namespaceURI){case "http://www.w3.org/1999/xhtml":case "http://www.gribuser.ru/xml/fictionbook/2.0":this.j=!1}this.F.push(!0);this.w={};this.w["e"+a]=
b;this.b++;Mk(this,-1)}function Nk(a,b,c,d){return(b=b[d])&&b.evaluate(a.f)!==c[d]}function Ok(a,b,c){for(var d in c){var e=b[d];e?(a.u[d]=e,delete b[d]):(e=c[d])&&(a.u[d]=new T(e,33554432))}}var Pk=["column-count","column-width"];
function Lk(a,b,c){c||["writing-mode","direction"].forEach(function(a){b[a]&&(this.u[a]=b[a])},a);if(!a.H){var d=Nk(a,b,a.h.g,"background-color")?b["background-color"].evaluate(a.f):null,e=Nk(a,b,a.h.g,"background-image")?b["background-image"].evaluate(a.f):null;if(d&&d!==Id||e&&e!==Id)Ok(a,b,a.h.g),a.H=!0}if(!a.N)for(d=0;d<Pk.length;d++)if(Nk(a,b,a.h.j,Pk[d])){Ok(a,b,a.h.j);a.N=!0;break}if(!c&&(c=b["font-size"])){d=c.evaluate(a.f);c=d.B;switch(d.fa){case "em":case "rem":c*=a.f.h;break;case "ex":case "rex":c*=
a.f.h*lc.ex/lc.em;break;case "%":c*=a.f.h/100;break;default:(d=lc[d.fa])&&(c*=d)}a.f.$=c}}function Qk(a){for(var b=0;!a.j&&(b+=5E3,Rk(a,b,0)!=Number.POSITIVE_INFINITY););return a.u}function Kk(a,b){if(b.style instanceof CSSStyleDeclaration){var c=b.getAttribute("style");if(c){var d=a.ba.url,e=new yk(a.ea,a.h),c=new Tb(c,e);try{$f(new Rf(Hf,c,e,d),Number.POSITIVE_INFINITY,!1,!0,!1,!1)}catch(f){u.b(f,"Style attribute parse error:")}return e.b}}return{}}
function Mk(a,b){if(!(b>=a.b)){var c=a.f,d=uh(a.ba,a.root);if(b<d){var e=a.g(a.root,!1),f=e["flow-into"],f=f?f.evaluate(c,"flow-into").toString():"body";Sk(a,f,e,a.root,d)}d=xh(a.ba,b);e=vh(a.ba,d,0,!1);if(!(e>=a.b))for(;;){if(1!=d.nodeType)e+=d.textContent.length;else{var g=d;if(e!=uh(a.ba,g))throw Error("Inconsistent offset");var h=a.g(g,!1);if(f=h["flow-into"])f=f.evaluate(c,"flow-into").toString(),Sk(a,f,h,g,e);e++}if(e>=a.b)break;f=d.firstChild;if(null==f)for(;!(f=d.nextSibling);)if(d=d.parentNode,
d===a.root)return;d=f}}}function Tk(a,b){a.k=b;for(var c=0;c<a.D.length;c++)Wk(a.k,a.D[c])}
function Sk(a,b,c,d,e){var f=0,g=Number.POSITIVE_INFINITY,h=!1,l=!1,k=!1,m=c["flow-options"];if(m){var p;a:{if(h=m.evaluate(a.f,"flow-options")){l=new ig;try{h.T(l);p=l.b;break a}catch(q){u.b(q,"toSet:")}}p={}}h=!!p.exclusive;l=!!p["static"];k=!!p.last}(p=c["flow-linger"])&&(g=kg(p.evaluate(a.f,"flow-linger"),Number.POSITIVE_INFINITY));(c=c["flow-priority"])&&(f=kg(c.evaluate(a.f,"flow-priority"),0));d=new Zh(b,d,e,f,g,h,l,k);a.D.push(d);a.l==b&&(a.l=null);a.k&&Wk(a.k,d)}
function Rk(a,b,c){var d=-1;if(b<=a.b&&(d=Hk(a.e,b),d+=c,d<Ek(a.e)))return Ik(a.e,d);if(null==a.d)return Number.POSITIVE_INFINITY;for(var e=a.f;;){var f=a.d.firstChild;if(null==f)for(;;){if(1==a.d.nodeType){var f=a.A,g=a.d;if(f.Qa.pop()!==g)throw Error("Invalid call to popElement");f.zb.pop();f.ea.pop();f.bb.pop();f.rb.pop();f.pop();mk(f);a.Ta=a.F.pop()}if(f=a.d.nextSibling)break;a.d=a.d.parentNode;if(a.d===a.root)return a.d=null,b<a.b&&(0>d&&(d=Hk(a.e,b),d+=c),d<=Ek(a.e))?Ik(a.e,d):Number.POSITIVE_INFINITY}a.d=
f;if(1!=a.d.nodeType)a.b+=a.d.textContent.length,a.Ta?Fk(a.e,a.b):Gk(a.e,a.b);else{g=a.d;f=Kk(a,g);a.F.push(a.Ta);ok(a.A,g,f);a.j||"body"!=g.localName||g.parentNode!=a.root||(Lk(a,f,!0),a.j=!0);var h=f["flow-into"];h&&(h=h.evaluate(e,"flow-into").toString(),Sk(a,h,f,g,a.b),a.Ta=!!a.$[h]);a.Ta&&(g=f.display)&&g.evaluate(e,"display")===Qd&&(a.Ta=!1);if(uh(a.ba,a.d)!=a.b)throw Error("Inconsistent offset");a.w["e"+a.b]=f;a.b++;a.Ta?Fk(a.e,a.b):Gk(a.e,a.b);if(b<a.b&&(0>d&&(d=Hk(a.e,b),d+=c),d<=Ek(a.e)))return Ik(a.e,
d)}}}Jk.prototype.g=function(a,b){var c=uh(this.ba,a),d="e"+c;b&&(c=vh(this.ba,a,0,!0));this.b<=c&&Rk(this,c,0);return this.w[d]};var Xk=1;function Yk(a,b,c,d,e){this.b={};this.children=[];this.e=null;this.h=0;this.d=a;this.name=b;this.nb=c;this.za=d;this.parent=e;this.g="p"+Xk++;e&&(this.h=e.children.length,e.children.push(this))}Yk.prototype.f=function(){throw Error("E_UNEXPECTED_CALL");};Yk.prototype.clone=function(){throw Error("E_UNEXPECTED_CALL");};function Zk(a,b){var c=a.b,d=b.b,e;for(e in c)Object.prototype.hasOwnProperty.call(c,e)&&(d[e]=c[e])}
function $k(a,b){for(var c=0;c<a.children.length;c++)a.children[c].clone({parent:b})}function al(a){Yk.call(this,a,null,null,[],null);this.b.width=new T(he,0);this.b.height=new T(ie,0)}t(al,Yk);
function bl(a,b){this.e=b;var c=this;fc.call(this,a,function(a,b){var f=a.match(/^([^.]+)\.([^.]+)$/);if(f){var g=c.e.j[f[1]];if(g&&(g=this.oa[g])){if(b){var f=f[2],h=g.ea[f];if(h)g=h;else{switch(f){case "columns":var h=g.d.d,l=new Wc(h,0),k=cl(g,"column-count"),m=cl(g,"column-width"),p=cl(g,"column-gap"),h=E(h,Yc(h,new Tc(h,"min",[l,k]),D(h,m,p)),p)}h&&(g.ea[f]=h);g=h}}else g=cl(g,f[2]);return g}}return null})}t(bl,fc);
function dl(a,b,c,d,e,f,g){a=a instanceof bl?a:new bl(a,this);Yk.call(this,a,b,c,d,e);this.e=this;this.K=f;this.O=g;this.b.width=new T(he,0);this.b.height=new T(ie,0);this.b["wrap-flow"]=new T(ud,0);this.b.position=new T(Vd,0);this.b.overflow=new T(ee,0);this.j={}}t(dl,Yk);dl.prototype.f=function(a){return new el(a,this)};dl.prototype.clone=function(a){a=new dl(this.d,this.name,a.nb||this.nb,this.za,this.parent,this.K,this.O);Zk(this,a);$k(this,a);return a};
function fl(a,b,c,d,e){Yk.call(this,a,b,c,d,e);this.e=e.e;b&&(this.e.j[b]=this.g);this.b["wrap-flow"]=new T(ud,0)}t(fl,Yk);fl.prototype.f=function(a){return new gl(a,this)};fl.prototype.clone=function(a){a=new fl(a.parent.d,this.name,this.nb,this.za,a.parent);Zk(this,a);$k(this,a);return a};function hl(a,b,c,d,e){Yk.call(this,a,b,c,d,e);this.e=e.e;b&&(this.e.j[b]=this.g)}t(hl,Yk);hl.prototype.f=function(a){return new il(a,this)};
hl.prototype.clone=function(a){a=new hl(a.parent.d,this.name,this.nb,this.za,a.parent);Zk(this,a);$k(this,a);return a};function Y(a,b,c){return b&&b!==ud?b.ia(a,c):null}function jl(a,b,c){return b&&b!==ud?b.ia(a,c):a.b}function kl(a,b,c){return b?b===ud?null:b.ia(a,c):a.b}function ll(a,b,c,d){return b&&c!==Qd?b.ia(a,d):a.b}function ml(a,b,c){return b?b===fe?a.g:b===Dd?a.f:b.ia(a,a.b):c}
function nl(a,b){this.e=a;this.d=b;this.D={};this.style={};this.k=this.l=null;this.children=[];this.F=this.H=this.f=this.g=!1;this.w=this.A=0;this.u=null;this.oa={};this.ea={};this.sa=this.b=!1;a&&a.children.push(this)}function ol(a){a.A=0;a.w=0}function pl(a,b,c){b=cl(a,b);c=cl(a,c);if(!b||!c)throw Error("E_INTERNAL");return D(a.d.d,b,c)}
function cl(a,b){var c=a.oa[b];if(c)return c;var d=a.style[b];d&&(c=d.ia(a.d.d,a.d.d.b));switch(b){case "margin-left-edge":c=cl(a,"left");break;case "margin-top-edge":c=cl(a,"top");break;case "margin-right-edge":c=pl(a,"border-right-edge","margin-right");break;case "margin-bottom-edge":c=pl(a,"border-bottom-edge","margin-bottom");break;case "border-left-edge":c=pl(a,"margin-left-edge","margin-left");break;case "border-top-edge":c=pl(a,"margin-top-edge","margin-top");break;case "border-right-edge":c=
pl(a,"padding-right-edge","border-right-width");break;case "border-bottom-edge":c=pl(a,"padding-bottom-edge","border-bottom-width");break;case "padding-left-edge":c=pl(a,"border-left-edge","border-left-width");break;case "padding-top-edge":c=pl(a,"border-top-edge","border-top-width");break;case "padding-right-edge":c=pl(a,"right-edge","padding-right");break;case "padding-bottom-edge":c=pl(a,"bottom-edge","padding-bottom");break;case "left-edge":c=pl(a,"padding-left-edge","padding-left");break;case "top-edge":c=
pl(a,"padding-top-edge","padding-top");break;case "right-edge":c=pl(a,"left-edge","width");break;case "bottom-edge":c=pl(a,"top-edge","height")}if(!c){if("extent"==b)d=a.b?"width":"height";else if("measure"==b)d=a.b?"height":"width";else{var e=a.b?Si:Ti,d=b,f;for(f in e)d=d.replace(f,e[f])}d!=b&&(c=cl(a,d))}c&&(a.oa[b]=c);return c}
function ql(a){var b=a.d.d,c=a.style,d=ml(b,c.enabled,b.g),e=Y(b,c.page,b.b);if(e)var f=new Rc(b,"page-number"),d=Xc(b,d,new Jc(b,e,f));(e=Y(b,c["min-page-width"],b.b))&&(d=Xc(b,d,new Ic(b,new Rc(b,"page-width"),e)));(e=Y(b,c["min-page-height"],b.b))&&(d=Xc(b,d,new Ic(b,new Rc(b,"page-height"),e)));d=a.N(d);c.enabled=new K(d)}nl.prototype.N=function(a){return a};
nl.prototype.Nc=function(){var a=this.d.d,b=this.style,c=this.e?this.e.style.width.ia(a,null):null,d=Y(a,b.left,c),e=Y(a,b["margin-left"],c),f=ll(a,b["border-left-width"],b["border-left-style"],c),g=jl(a,b["padding-left"],c),h=Y(a,b.width,c),l=Y(a,b["max-width"],c),k=jl(a,b["padding-right"],c),m=ll(a,b["border-right-width"],b["border-right-style"],c),p=Y(a,b["margin-right"],c),q=Y(a,b.right,c),v=D(a,f,g),r=D(a,f,k);d&&q&&h?(v=E(a,c,D(a,h,D(a,D(a,d,v),r))),e?p?q=E(a,v,p):p=E(a,v,D(a,q,e)):(v=E(a,v,
q),p?e=E(a,v,p):p=e=Yc(a,v,new gc(a,.5)))):(e||(e=a.b),p||(p=a.b),d||q||h||(d=a.b),d||h?d||q?h||q||(h=this.l,this.g=!0):d=a.b:(h=this.l,this.g=!0),v=E(a,c,D(a,D(a,e,v),D(a,p,r))),this.g&&(l||(l=E(a,v,d?d:q)),this.b||!Y(a,b["column-width"],null)&&!Y(a,b["column-count"],null)||(h=l,this.g=!1)),d?h?q||(q=E(a,v,D(a,d,h))):h=E(a,v,D(a,d,q)):d=E(a,v,D(a,q,h)));a=jl(a,b["snap-width"]||(this.e?this.e.style["snap-width"]:null),c);b.left=new K(d);b["margin-left"]=new K(e);b["border-left-width"]=new K(f);b["padding-left"]=
new K(g);b.width=new K(h);b["max-width"]=new K(l?l:h);b["padding-right"]=new K(k);b["border-right-width"]=new K(m);b["margin-right"]=new K(p);b.right=new K(q);b["snap-width"]=new K(a)};
nl.prototype.Oc=function(){var a=this.d.d,b=this.style,c=this.e?this.e.style.width.ia(a,null):null,d=this.e?this.e.style.height.ia(a,null):null,e=Y(a,b.top,d),f=Y(a,b["margin-top"],c),g=ll(a,b["border-top-width"],b["border-top-style"],c),h=jl(a,b["padding-top"],c),l=Y(a,b.height,d),k=Y(a,b["max-height"],d),m=jl(a,b["padding-bottom"],c),p=ll(a,b["border-bottom-width"],b["border-bottom-style"],c),q=Y(a,b["margin-bottom"],c),v=Y(a,b.bottom,d),r=D(a,g,h),y=D(a,p,m);e&&v&&l?(d=E(a,d,D(a,l,D(a,D(a,e,r),
y))),f?q?v=E(a,d,f):q=E(a,d,D(a,v,f)):(d=E(a,d,v),q?f=E(a,d,q):q=f=Yc(a,d,new gc(a,.5)))):(f||(f=a.b),q||(q=a.b),e||v||l||(e=a.b),e||l?e||v?l||v||(l=this.k,this.f=!0):e=a.b:(l=this.k,this.f=!0),d=E(a,d,D(a,D(a,f,r),D(a,q,y))),this.f&&(k||(k=E(a,d,e?e:v)),this.b&&(Y(a,b["column-width"],null)||Y(a,b["column-count"],null))&&(l=k,this.f=!1)),e?l?v||(v=E(a,d,D(a,e,l))):l=E(a,d,D(a,v,e)):e=E(a,d,D(a,v,l)));a=jl(a,b["snap-height"]||(this.e?this.e.style["snap-height"]:null),c);b.top=new K(e);b["margin-top"]=
new K(f);b["border-top-width"]=new K(g);b["padding-top"]=new K(h);b.height=new K(l);b["max-height"]=new K(k?k:l);b["padding-bottom"]=new K(m);b["border-bottom-width"]=new K(p);b["margin-bottom"]=new K(q);b.bottom=new K(v);b["snap-height"]=new K(a)};
function rl(a){var b=a.d.d,c=a.style;a=Y(b,c[a.b?"height":"width"],null);var d=Y(b,c["column-width"],a),e=Y(b,c["column-count"],null),f;(f=(f=c["column-gap"])&&f!==Rd?f.ia(b,null):null)||(f=new Qc(b,1,"em"));d&&!e&&(e=new Tc(b,"floor",[Zc(b,D(b,a,f),D(b,d,f))]),e=new Tc(b,"max",[b.d,e]));e||(e=b.d);d=E(b,Zc(b,D(b,a,f),e),f);c["column-width"]=new K(d);c["column-count"]=new K(e);c["column-gap"]=new K(f)}function sl(a,b,c,d){a=a.style[b].ia(a.d.d,null);return tc(a,c,d,{})}
function tl(a,b){b.oa[a.d.g]=a;var c=a.d.d,d=a.style,e=a.e?ul(a.e,b):null,e=Ak(a.D,b,e,!1);a.b=zk(e,b,a.e?a.e.b:!1);Bk(e,d,a.b,function(a,b){return b.value});a.l=new ic(c,function(){return a.A},"autoWidth");a.k=new ic(c,function(){return a.w},"autoHeight");a.Nc();a.Oc();rl(a);ql(a)}function vl(a,b,c){(a=a.style[c])&&(a=hg(b,a,c));return a}function Z(a,b,c){(a=a.style[c])&&(a=hg(b,a,c));return qd(a,b)}
function ul(a,b){var c;a:{if(c=a.D["region-id"]){for(var d=[],e=0;e<c.length;e++){var f=c[e].evaluate(b,"");f&&f!==G&&d.push(f)}if(d.length){c=d;break a}}c=null}if(c){d=[];for(e=0;e<c.length;e++)d[e]=c[e].toString();return d}return null}function wl(a,b,c,d,e){if(a=vl(a,b,d))a.Tb()&&mc(a.fa)&&(a=new I(qd(a,b),"px")),"font-family"===d&&(a=lh(e,a)),w(c.d,d,a.toString())}
function xl(a,b,c){var d=Z(a,b,"left"),e=Z(a,b,"margin-left"),f=Z(a,b,"padding-left"),g=Z(a,b,"border-left-width");a=Z(a,b,"width");vi(c,d,a);w(c.d,"margin-left",e+"px");w(c.d,"padding-left",f+"px");w(c.d,"border-left-width",g+"px");c.marginLeft=e;c.$=g;c.j=f}
function yl(a,b,c){var d=Z(a,b,"right"),e=Z(a,b,"snap-height"),f=Z(a,b,"margin-right"),g=Z(a,b,"padding-right");b=Z(a,b,"border-right-width");w(c.d,"margin-right",f+"px");w(c.d,"padding-right",g+"px");w(c.d,"border-right-width",b+"px");c.marginRight=f;c.Fa=b;a.b&&0<e&&(a=d+si(c),a=a-Math.floor(a/e)*e,0<a&&(c.sb=e-a,g+=c.sb));c.H=g;c.tb=e}
function zl(a,b,c){var d=Z(a,b,"snap-height"),e=Z(a,b,"top"),f=Z(a,b,"margin-top"),g=Z(a,b,"padding-top");b=Z(a,b,"border-top-width");c.top=e;c.marginTop=f;c.ea=b;c.Ka=d;!a.b&&0<d&&(a=e+pi(c),a=a-Math.floor(a/d)*d,0<a&&(c.pa=d-a,g+=c.pa));c.k=g;w(c.d,"top",e+"px");w(c.d,"margin-top",f+"px");w(c.d,"padding-top",g+"px");w(c.d,"border-top-width",b+"px")}
function Al(a,b,c){var d=Z(a,b,"margin-bottom"),e=Z(a,b,"padding-bottom"),f=Z(a,b,"border-bottom-width");a=Z(a,b,"height")-c.pa;w(c.d,"height",a+"px");w(c.d,"margin-bottom",d+"px");w(c.d,"padding-bottom",e+"px");w(c.d,"border-bottom-width",f+"px");c.height=a-c.pa;c.marginBottom=d;c.sa=f;c.w=e}function Bl(a,b,c){a.b?(zl(a,b,c),Al(a,b,c)):(yl(a,b,c),xl(a,b,c))}
function Cl(a,b,c){w(c.d,"border-top-width","0px");var d=Z(a,b,"max-height");a.H?ui(c,0,d):(zl(a,b,c),d-=c.pa,c.height=d,w(c.d,"height",d+"px"))}function Dl(a,b,c){w(c.d,"border-left-width","0px");var d=Z(a,b,"max-width");a.F?vi(c,0,d):(yl(a,b,c),d-=c.sb,c.width=d,a=Z(a,b,"right"),w(c.d,"right",a+"px"),w(c.d,"width",d+"px"))}
var El="border-left-style border-right-style border-top-style border-bottom-style border-left-color border-right-color border-top-color border-bottom-color outline-style outline-color outline-width overflow visibility".split(" "),Fl="border-top-left-radius border-top-right-radius border-bottom-right-radius border-bottom-left-radius border-image-source border-image-slice border-image-width border-image-outset border-image-repeat background-attachment background-color background-image background-repeat background-position background-clip background-origin background-size opacity z-index".split(" "),
Gl="color font-family font-size font-style font-weight font-variant line-height letter-spacing text-align text-decoration text-indent text-transform white-space word-spacing".split(" "),Hl=["transform","transform-origin"];
nl.prototype.mb=function(a,b,c,d){this.e&&this.b==this.e.b||w(b.d,"writing-mode",this.b?"vertical-rl":"horizontal-tb");(this.b?this.g:this.f)?this.b?Dl(this,a,b):Cl(this,a,b):(this.b?yl(this,a,b):zl(this,a,b),this.b?xl(this,a,b):Al(this,a,b));(this.b?this.f:this.g)?this.b?Cl(this,a,b):Dl(this,a,b):Bl(this,a,b);for(c=0;c<El.length;c++)wl(this,a,b,El[c],d)};function Il(a,b,c,d){for(var e=0;e<Gl.length;e++)wl(a,b,c,Gl[e],d)}
nl.prototype.kc=function(a,b,c,d,e,f,g){this.b?this.A=b.e+b.sb:this.w=b.e+b.pa;f=(this.b||!d)&&this.f;var h=(!this.b||!d)&&this.g,l=null;if(h||f)h&&w(b.d,"width","auto"),f&&w(b.d,"height","auto"),l=(d?d.d:b.d).getBoundingClientRect(),h&&(this.A=Math.ceil(l.right-l.left-b.j-b.$-b.H-b.Fa),this.b&&(this.A+=b.sb)),f&&(this.w=l.bottom-l.top-b.k-b.ea-b.w-b.sa,this.b||(this.w+=b.pa));(this.b?this.f:this.g)&&Bl(this,a,b);if(this.b?this.g:this.f){if(this.b?this.F:this.H)this.b?yl(this,a,b):zl(this,a,b);this.b?
xl(this,a,b):Al(this,a,b)}if(1<e&&(f=Z(this,a,"column-rule-width"),h=vl(this,a,"column-rule-style"),l=vl(this,a,"column-rule-color"),0<f&&h&&h!=Qd&&l!=be)){var k=Z(this,a,"column-gap"),m=this.b?b.height:b.width,p=this.b?"border-top":"border-left";for(d=1;d<e;d++){var q=(m+k)*d/e-k/2+b.j-f/2,v=b.height+b.k+b.w,r=b.d.ownerDocument.createElement("div");w(r,"position","absolute");w(r,this.b?"left":"top","0px");w(r,this.b?"top":"left",q+"px");w(r,this.b?"height":"width","0px");w(r,this.b?"width":"height",
v+"px");w(r,p,f+"px "+h.toString()+(l?" "+l.toString():""));b.d.insertBefore(r,b.d.firstChild)}}for(d=0;d<Fl.length;d++)wl(this,a,b,Fl[d],g);for(d=0;d<Hl.length;d++)e=b,g=Hl[d],f=c.h,(h=vl(this,a,g))&&f.push(new Rh(e.d,g,h))};
nl.prototype.h=function(a,b){var c=this.D,d=this.d.b,e;for(e in d)Xi(e)&&Yi(c,e,d[e]);if("background-host"==this.d.nb)for(e in b)if(e.match(/^background-/)||"writing-mode"==e)c[e]=b[e];if("layout-host"==this.d.nb)for(e in b)e.match(/^background-/)||"writing-mode"==e||(c[e]=b[e]);ik(a,this.d.za,null,c);c.content&&(c.content=c.content.Ic(new Rj(a,null)));tl(this,a.g);for(c=0;c<this.d.children.length;c++)this.d.children[c].f(this).h(a,b);a.pop()};
function Jl(a,b){a.g&&(a.F=sl(a,"right",a.l,b)||sl(a,"margin-right",a.l,b)||sl(a,"border-right-width",a.l,b)||sl(a,"padding-right",a.l,b));a.f&&(a.H=sl(a,"top",a.k,b)||sl(a,"margin-top",a.k,b)||sl(a,"border-top-width",a.k,b)||sl(a,"padding-top",a.k,b));for(var c=0;c<a.children.length;c++)Jl(a.children[c],b)}function Kl(a){nl.call(this,null,a)}t(Kl,nl);Kl.prototype.h=function(a,b){nl.prototype.h.call(this,a,b);this.children.sort(function(a,b){return b.d.O-a.d.O||a.d.h-b.d.h})};
function el(a,b){nl.call(this,a,b);this.u=this}t(el,nl);el.prototype.N=function(a){var b=this.d.e;b.K&&(a=Xc(b.d,a,b.K));return a};el.prototype.$=function(){};function gl(a,b){nl.call(this,a,b);this.u=a.u}t(gl,nl);function il(a,b){nl.call(this,a,b);this.u=a.u}t(il,nl);function Ll(a,b,c,d){var e=null;c instanceof kd&&(e=[c]);c instanceof dd&&(e=c.values);if(e)for(a=a.d.d,c=0;c<e.length;c++)if(e[c]instanceof kd){var f=dc(e[c].name,"enabled"),f=new Rc(a,f);d&&(f=new zc(a,f));b=Xc(a,b,f)}return b}
il.prototype.N=function(a){var b=this.d.d,c=this.style,d=ml(b,c.required,b.f)!==b.f;if(d||this.f){var e;e=(e=c["flow-from"])?e.ia(b,b.b):new gc(b,"body");e=new Tc(b,"has-content",[e]);a=Xc(b,a,e)}a=Ll(this,a,c["required-partitions"],!1);a=Ll(this,a,c["conflicting-partitions"],!0);d&&(c=(c=this.u.style.enabled)?c.ia(b,null):b.g,c=Xc(b,c,a),this.u.style.enabled=new K(c));return a};il.prototype.mb=function(a,b,c,d){w(b.d,"overflow","hidden");nl.prototype.mb.call(this,a,b,c,d)};
function Ml(a,b,c,d){Cf.call(this,a,b,!1);this.target=c;this.b=d}t(Ml,Df);Ml.prototype.Ya=function(a,b,c){ch(this.b,a,b,c,this)};Ml.prototype.yc=function(a,b){Ef(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};Ml.prototype.Sb=function(a,b){Ef(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};Ml.prototype.Za=function(a,b,c){this.target.b[a]=new T(b,c?50331648:67108864)};function Nl(a,b,c,d){Ml.call(this,a,b,c,d)}t(Nl,Ml);
function Ol(a,b,c,d){Ml.call(this,a,b,c,d);c.b.width=new T(ge,0);c.b.height=new T(ge,0)}t(Ol,Ml);Ol.prototype.ac=function(a,b,c){a=new hl(this.d,a,b,c,this.target);Bf(this.Y,new Nl(this.d,this.Y,a,this.b))};Ol.prototype.$b=function(a,b,c){a=new fl(this.d,a,b,c,this.target);a=new Ol(this.d,this.Y,a,this.b);Bf(this.Y,a)};function Pl(a,b,c,d){Ml.call(this,a,b,c,d)}t(Pl,Ml);Pl.prototype.ac=function(a,b,c){a=new hl(this.d,a,b,c,this.target);Bf(this.Y,new Nl(this.d,this.Y,a,this.b))};
Pl.prototype.$b=function(a,b,c){a=new fl(this.d,a,b,c,this.target);a=new Ol(this.d,this.Y,a,this.b);Bf(this.Y,a)};var Ql={"text-indent":"0px","margin-top":"0px","padding-top":"0px","border-top-width":"0px","border-top-style":"none","border-top-color":"transparent"},Rl={"text-indent":"0px","margin-right":"0px","padding-right":"0px","border-right-width":"0px","border-right-style":"none","border-right-color":"transparent"},Sl={"margin-top":"0px"},Tl={"margin-right":"0px"},Ul={};
function Vl(a){a.addEventListener("load",function(){a.contentWindow.navigator.epubReadingSystem={name:"adapt",version:"0.1",layoutStyle:"paginated",hasFeature:function(a){switch(a){case "mouse-events":return!0}return!1}}},!1)}var Wl=(new DOMParser).parseFromString('<root xmlns="http://www.pyroxy.com/ns/shadow"/>',"text/xml"),Xl="footnote-marker first-5-lines first-4-lines first-3-lines first-2-lines first-line first-letter before  after".split(" ");
function Yl(a){return a.getAttribute("data-adapt-pseudo")||""}function Zl(a,b,c,d){this.style=b;this.f=a;this.b=c;this.d=d;this.e={}}
Zl.prototype.g=function(a){var b=Yl(a);this.b&&b&&b.match(/after$/)&&(this.style=this.b.g(this.f,!0),this.b=null);var c=this.style._pseudos[b]||{};if(!this.e[b]){this.e[b]=!0;var d=c.content;d&&(d=d.evaluate(this.d),xi(d)&&d.T(new wi(a,this.d)))}if(b.match(/^first-/)&&!c["x-first-pseudo"]){a=1;var e;"first-letter"==b?a=0:null!=(e=b.match(/^first-([0-9]+)-lines$/))&&(a=e[1]-0);c["x-first-pseudo"]=new T(new md(a),0)}return c};
function $l(a,b,c,d,e,f,g,h,l,k,m,p,q){this.w=a;this.d=b;this.viewport=c;this.l=c.b;this.j=d;this.D=e;this.ba=f;this.A=g;this.k=h;this.F=l;this.e=k;this.g=m;this.u=p;this.f=q;this.H=this.b=null;this.h=!1;this.Z=null;this.ca=0;this.C=null}$l.prototype.clone=function(){return new $l(this.w,this.d,this.viewport,this.j,this.D,this.ba,this.A,this.k,this.F,this.e,this.g,this.u,this.f)};
function am(a,b,c,d,e,f){var g=L("createRefShadow");a.ba.j.load(b).then(function(h){if(h){var l=zh(h,b);if(l){var k=a.F,m=k.w[h.url];if(!m){var m=k.style.h.b[h.url],p=new nc(0,k.lb(),k.kb(),k.h),m=new Jk(h,m.d,m.g,p,k.e,m.j,k.k);k.w[h.url]=m}f=new ci(d,l,h,e,f,c,m)}}O(g,f)});return N(g)}
function bm(a,b,c,d,e,f,g,h){var l=L("createShadows"),k=e.template,m;k instanceof od?m=am(a,k.url,2,b,h,null):m=M(null);m.then(function(k){var m=null;if("http://www.pyroxy.com/ns/shadow"==b.namespaceURI&&"include"==b.localName){var v=b.getAttribute("href"),r=null;v?r=h?h.ba:a.ba:h&&(v="http://www.w3.org/1999/xhtml"==h.Y.namespaceURI?h.Y.getAttribute("href"):h.Y.getAttributeNS("http://www.w3.org/1999/xlink","href"),r=h.Uc?h.Uc.ba:a.ba);v&&(v=va(v,r.url),m=am(a,v,3,b,h,k))}null==m&&(m=M(k));m.then(function(k){var m;
if(m=d._pseudos){for(var p=[],q=Wl.createElementNS("http://www.pyroxy.com/ns/shadow","root"),v=q,r=0;r<Xl.length;r++){var ra=Xl[r],Fa;if(ra){if(!m[ra])continue;if(!("footnote-marker"!=ra||c&&a.h))continue;if(ra.match(/^first-/)&&(Fa=e.display,!Fa||Fa===Jd))continue;if("before"===ra||"after"===ra)if(Fa=m[ra].content,!Fa||Fa===Rd||Fa===Qd)continue;p.push(ra);Fa=Wl.createElementNS("http://www.w3.org/1999/xhtml","span");Fa.setAttribute("data-adapt-pseudo",ra)}else Fa=Wl.createElementNS("http://www.pyroxy.com/ns/shadow",
"content");v.appendChild(Fa);ra.match(/^first-/)&&(v=Fa)}k=p.length?new ci(b,q,null,h,k,2,new Zl(b,d,f,g)):k}O(l,k)})});return N(l)}function cm(a,b,c){a.H=b;a.h=c}function dm(a,b,c,d){var e=a.d;c=Ak(c,e,a.D,a.h);b=zk(c,e,b);Bk(c,d,b,function(b,c){var d=c.evaluate(e,b);"font-family"==b&&(d=lh(a.A,d));return d});return b}
function em(a,b){for(var c=a.b.Z,d=[],e=a.b.da,f=-1;c&&1==c.nodeType;){var g=e&&e.root==c;if(!g||2==e.type){var h=(e?e.b:a.j).g(c,!1);d.push(h)}g?(c=e.Y,e=e.Uc):(c=c.parentNode,f++)}c=pc(a.d,"em",0===f);c={"font-size":new T(new I(c,"px"),0)};e=new cj(c,a.d);for(f=d.length-1;0<=f;--f){var g=d[f],h=[],l;for(l in g)Ji[l]&&h.push(l);h.sort(le);for(var k=0;k<h.length;k++){var m=h[k];e.b=m;c[m]=g[m].Ic(e)}}for(var p in b)Ji[p]||(c[p]=b[p]);return c}
var fm={a:"a",sub:"sub",sup:"sup",table:"table",tr:"tr",td:"td",th:"th",code:"code",body:"div",p:"p",v:"p",date:"p",emphasis:"em",strong:"strong",style:"span",strikethrough:"del"};function gm(a,b){b=va(b,a.ba.url);return a.u[b]||b}
function hm(a,b,c){var d=!0,e=L("createElementView"),f=a.Z,g=a.b.da?a.b.da.b:a.j,h=g.g(f,!1),l={};a.b.parent||(h=em(a,h));a.b.f=dm(a,a.b.f,h,l);l.direction&&(a.b.F=l.direction.toString());var k=l["flow-into"];if(k&&k.toString()!=a.w)return O(e,!1),N(e);var m=l.display;if(m===Qd)return O(e,!1),N(e);a.b.A=m===Ed;bm(a,f,null==a.b.parent,h,l,g,a.d,a.b.da).then(function(g){a.b.xa=g;var h=a.b.parent&&a.b.parent.k;g=l["float-reference"];var k=l["float"],r=l.clear;if(l.position===rd||l.position===Vd)a.b.k=
!0,k=null;h&&(r=null,k!==Fd&&(k=null));h=k===Nd||k===Wd||k===ae||k===zd||k===Ld||k===Kd||k===xd||k===wd||k===Fd;k&&(delete l["float"],k===Fd&&(a.h?(h=!1,l.display=vd):l.display=Jd),a.b.k=!0);r&&(r===Id&&a.b.parent&&a.b.parent.u&&(r=H(a.b.parent.u)),r===Nd||r===Wd||r===yd)&&(delete l.clear,l.display&&l.display!=Jd&&(a.b.u=r.toString()));l.overflow===Gd&&(a.b.k=!0);var y=m===Od&&l["ua-list-item-count"];h||l["break-inside"]&&l["break-inside"]!==ud?a.b.h++:m===$d&&(a.b.h+=10);a.b.b=!h&&!m||m===Jd;a.b.j=
h?k.toString():null;a.b.N=g?g.toString():null;if(!a.b.b){if(g=l["break-after"])a.b.D=g.toString();if(g=l["break-before"])a.b.g=g.toString()}if(g=l["x-first-pseudo"])a.b.d=new di(a.b.parent?a.b.parent.d:null,g.B);if(g=l["white-space"])switch(g.toString()){case "normal":case "nowrap":a.b.w=0;break;case "pre-line":a.b.w=1;break;case "pre":case "pre-wrap":a.b.w=2}var J=!1,W=null,pa=[],X=f.namespaceURI,F=f.localName;if("http://www.w3.org/1999/xhtml"==X)"html"==F||"body"==F||"script"==F||"link"==F||"meta"==
F?F="div":"vide_"==F?F="video":"audi_"==F?F="audio":"object"==F&&(J=!!a.g);else if("http://www.idpf.org/2007/ops"==X)F="span",X="http://www.w3.org/1999/xhtml";else if("http://www.gribuser.ru/xml/fictionbook/2.0"==X){X="http://www.w3.org/1999/xhtml";if("image"==F){if(F="div",(g=f.getAttributeNS("http://www.w3.org/1999/xlink","href"))&&"#"==g.charAt(0)&&(g=zh(a.ba,g)))W=a.createElement(X,"img"),g="data:"+(g.getAttribute("content-type")||"image/jpeg")+";base64,"+g.textContent.replace(/[ \t\n\t]/g,""),
pa.push(rg(W,g))}else F=fm[F];F||(F=a.b.b?"span":"div")}else if("http://www.daisy.org/z3986/2005/ncx/"==X)if(X="http://www.w3.org/1999/xhtml","ncx"==F||"navPoint"==F)F="div";else if("navLabel"==F){if(F="span",k=f.parentNode){g=null;for(k=k.firstChild;k;k=k.nextSibling)if(1==k.nodeType&&(r=k,"http://www.daisy.org/z3986/2005/ncx/"==r.namespaceURI&&"content"==r.localName)){g=r.getAttribute("src");break}g&&(F="a",f=f.ownerDocument.createElementNS(X,"a"),f.setAttribute("href",g))}}else F="span";else"http://www.pyroxy.com/ns/shadow"==
X?(X="http://www.w3.org/1999/xhtml",F=a.b.b?"span":"div"):J=!!a.g;y?b?F="li":(F="div",m=vd,l.display=m):"body"==F||"li"==F?F="div":"q"==F?F="span":"a"==F&&(g=l["hyperlink-processing"])&&"normal"!=g.toString()&&(F="span");l.behavior&&"none"!=l.behavior.toString()&&a.g&&(J=!0);f.dataset&&"true"==f.dataset.mathTypeset&&(J=!0);var ra;J?ra=a.g(f,a.b.parent?a.b.parent.C:null,l):ra=M(null);ra.then(function(g){g?J&&(d="true"==g.getAttribute("data-adapt-process-children")):g=a.createElement(X,F);"a"==F&&g.addEventListener("click",
a.e.D,!1);W&&(im(a,a.b,"inner",W),g.appendChild(W));"iframe"==g.localName&&"http://www.w3.org/1999/xhtml"==g.namespaceURI&&Vl(g);if("http://www.gribuser.ru/xml/fictionbook/2.0"!=f.namespaceURI||"td"==F){for(var h=f.attributes,k=h.length,m=null,p=0;p<k;p++){var q=h[p],r=q.namespaceURI,v=q.localName,q=q.nodeValue;if(r)if("http://www.w3.org/2000/xmlns/"==r)continue;else"http://www.w3.org/1999/xlink"==r&&"href"==v&&(q=gm(a,q));else{if(v.match(/^on/))continue;if("style"==v)continue;if("id"==v){Xh(a.e,
g,q);continue}"src"==v||"href"==v||"poster"==v?q=gm(a,q):"srcset"==v&&(q=q.split(",").map(function(b){return gm(a,b.trim())}).join(","))}if(r){var ra=Ul[r];ra&&(v=ra+":"+v)}"src"!=v||r||"img"!=F||"http://www.w3.org/1999/xhtml"!=X?"href"==v&&"image"==F&&"http://www.w3.org/2000/svg"==X&&"http://www.w3.org/1999/xlink"==r?a.e.f.push(rg(g,q)):r?g.setAttributeNS(r,v,q):g.setAttribute(v,q):m=q}m&&(h=rg(g,m),k=l.width,m=l.height,k&&k!==ud&&m&&m!==ud?a.e.f.push(h):pa.push(h))}delete l.content;(h=l["list-style-image"])&&
h instanceof od&&(h=h.url,pa.push(rg(new Image,h)));jm(a,g,l);h=l.widows;k=l.orphans;if(h||k){if(a.b.parent){a.b.l={};for(var cc in a.b.parent.l)a.b.l[cc]=a.b.parent.l[cc]}h instanceof md&&(a.b.l.widows=h.B);k instanceof md&&(a.b.l.orphans=k.B)}if(!a.b.b&&(cc=null,b?c&&(cc=a.b.f?Tl:Sl):cc=a.b.f?Rl:Ql,cc))for(var Vk in cc)w(g,Vk,cc[Vk]);y&&g.setAttribute("value",l["ua-list-item-count"].stringValue());a.C=g;pa.length?qg(pa).then(function(){O(e,d)}):jf().then(function(){O(e,d)})})});return N(e)}
function km(a,b,c){var d=L("createNodeView"),e=!0;1==a.Z.nodeType?b=hm(a,b,c):(8==a.Z.nodeType?a.C=null:a.C=document.createTextNode(a.Z.textContent.substr(a.ca||0)),b=M(!0));b.then(function(b){e=b;(a.b.C=a.C)&&(b=a.b.parent?a.b.parent.C:a.H)&&b.appendChild(a.C);O(d,e)});return N(d)}function lm(a,b,c,d){(a.b=b)?(a.Z=b.Z,a.ca=b.ca):(a.Z=null,a.ca=-1);a.C=null;return a.b?km(a,c,!!d):M(!0)}
function mm(a){if(null==a.da||"content"!=a.Z.localName||"http://www.pyroxy.com/ns/shadow"!=a.Z.namespaceURI)return a;var b=a.ga,c=a.da,d=a.parent,e,f;c.pd?(f=c.pd,e=c.root,c=c.type,2==c&&(e=e.firstChild)):(f=c.Uc,e=c.Y.firstChild,c=2);var g=a.Z.nextSibling;g?(a.Z=g,fi(a)):a.qa?a=a.qa:e?a=null:(a=a.parent.modify(),a.L=!0);if(e)return b=new ei(e,d,b),b.da=f,b.Na=c,b.qa=a,b;a.ga=b;return a}
function nm(a){var b=a.ga+1;if(a.L){if(!a.parent)return null;if(3!=a.Na){var c=a.Z.nextSibling;if(c)return a=a.modify(),a.ga=b,a.Z=c,fi(a),mm(a)}if(a.qa)return a=a.qa.modify(),a.ga=b,a;a=a.parent.modify()}else{if(a.xa&&(c=a.xa.root,2==a.xa.type&&(c=c.firstChild),c))return b=new ei(c,a,b),b.da=a.xa,b.Na=a.xa.type,mm(b);if(c=a.Z.firstChild)return mm(new ei(c,a,b));1!=a.Z.nodeType&&(b+=a.Z.textContent.length-1-a.ca);a=a.modify()}a.ga=b;a.L=!0;return a}
function om(a,b,c){b=nm(b);if(!b||b.L)return M(b);var d=L("nextInTree");lm(a,b,!0,c).then(function(a){b.C&&a||(b=b.modify(),b.L=!0,b.C||(b.b=!0));O(d,b)});return N(d)}function pm(a,b){if(b instanceof dd)for(var c=b.values,d=0;d<c.length;d++)pm(a,c[d]);else b instanceof od&&(c=b.url,a.e.f.push(rg(new Image,c)))}var qm={"box-decoration-break":!0,"flow-into":!0,"flow-linger":!0,"flow-priority":!0,"flow-options":!0,page:!0,"float-reference":!0};
function jm(a,b,c){var d=c["background-image"];d&&pm(a,d);var d=c.position===Vd,e;for(e in c)if(!qm[e]){var f=c[e];Ph[e]||d&&Qh[e]?a.e.h.push(new Rh(b,e,f)):(f.Tb()&&mc(f.fa)&&(f=new I(qd(f,a.d),"px")),w(b,e,f.toString()))}}function im(a,b,c,d){if(!b.L){var e=(b.da?b.da.b:a.j).g(a.Z,!1);if(e=e._pseudos)if(e=e[c])c={},b.f=dm(a,b.f,e,c),b=c.content,xi(b)&&(b.T(new wi(d,a.d)),delete c.content),jm(a,d,c)}}
function rm(a,b,c){var d=L("peelOff"),e=b.d,f=b.ca,g=b.L;if(0<c)b.C.textContent=b.C.textContent.substr(0,c),f+=c;else if(!g&&b.C&&0==f){var h=b.C.parentNode;h&&h.removeChild(b.C)}for(var l=b.ga+c,k=[];b.d===e;)k.push(b),b=b.parent;var m=k.pop(),p=m.qa;kf(function(){for(;0<k.length;){m=k.pop();b=new ei(m.Z,b,l);0==k.length&&(b.ca=f,b.L=g);b.Na=m.Na;b.da=m.da;b.xa=m.xa;b.qa=m.qa?m.qa:p;p=null;var c=lm(a,b,!1);if(c.Aa())return c}return M(!1)}).then(function(){O(d,b)});return N(d)}
$l.prototype.createElement=function(a,b){return"http://www.w3.org/1999/xhtml"==a?this.l.createElement(b):this.l.createElementNS(a,b)};function sm(a,b,c){var d={},e=a.k._pseudos;b=dm(a,b,a.k,d);if(e&&e.before){var f={},g=a.createElement("http://www.w3.org/1999/xhtml","span");g.setAttribute("data-adapt-pseudo","before");c.appendChild(g);dm(a,b,e.before,f);delete f.content;jm(a,g,f)}delete d.content;jm(a,c,d);return b}
function Di(a,b,c){return b.ca===c.ca&&b.L==c.L&&b.ka.length===c.ka.length&&b.ka.every(function(a,b){var f;f=c.ka[b];if(a.da)if(f.da){var g=1===a.ha.nodeType?a.ha:a.ha.parentElement,h=1===f.ha.nodeType?f.ha:f.ha.parentElement;f=a.da.Y===f.da.Y&&Yl(g)===Yl(h)}else f=!1;else f=a.ha===f.ha;return f}.bind(a))}function tm(a){this.b=a}function um(a){return a.getClientRects()}
function vm(a,b,c,d,e){this.f=a;this.fontSize=b;this.b=a.document;this.root=c||this.b.body;b=this.root.firstElementChild;b||(b=this.b.createElement("div"),b.setAttribute("data-vivliostyle-outer-zoom-box",!0),this.root.appendChild(b));c=b.firstElementChild;c||(c=this.b.createElement("div"),c.setAttribute("data-vivliostyle-spread-container",!0),b.appendChild(c));this.e=b;this.d=c;b=(new tm(a)).b.getComputedStyle(this.root,null);this.width=d||parseFloat(b.width)||a.innerWidth;this.height=e||parseFloat(b.height)||
a.innerHeight}vm.prototype.zoom=function(a,b,c){w(this.e,"width",a*c+"px");w(this.e,"height",b*c+"px");w(this.d,"width",a+"px");w(this.d,"height",b+"px");w(this.d,"transform","scale("+c+")")};Ii("SIMPLE_PROPERTY",function(a){var b=a.name,c=a.value;switch(b){case "page-break-before":case "page-break-after":case "page-break-inside":return{name:b.replace(/^page-/,""),value:c===td?Ud:c,important:a.important};default:return a}});var wm={page:!0,left:!0,right:!0,recto:!0,verso:!0,column:!0,region:!0},xm={avoid:!0,"avoid-page":!0,"avoid-column":!0,"avoid-region":!0};
function ym(a,b){if(a)if(b){var c=!!wm[a],d=!!wm[b];if(c&&d)switch(b){case "column":return a;case "region":return"column"===a?b:a;default:return b}else return d?b:c?a:xm[b]?b:xm[a]?a:b}else return a;else return b};var zm={img:!0,svg:!0,audio:!0,video:!0};
function Am(a,b,c){var d=a.C;if(!d)return NaN;if(1==d.nodeType){if(a.L){var e=d.getBoundingClientRect();if(e.right>=e.left&&e.bottom>=e.top)return c?e.left:e.bottom}return NaN}var e=NaN,f=d.ownerDocument.createRange(),g=d.textContent.length;if(!g)return NaN;a.L&&(b+=g);b>=g&&(b=g-1);f.setStart(d,b);f.setEnd(d,b+1);a=um(f);if(b=c){b=document.body;if(null==ab){var h=b.ownerDocument,f=h.createElement("div");f.style.position="absolute";f.style.top="0px";f.style.left="0px";f.style.width="100px";f.style.height=
"100px";f.style.overflow="hidden";f.style.lineHeight="16px";f.style.fontSize="16px";w(f,"writing-mode","vertical-rl");b.appendChild(f);g=h.createTextNode("a a a a a a a a a a a a a a a a");f.appendChild(g);h=h.createRange();h.setStart(g,0);h.setEnd(g,1);ab=50>h.getBoundingClientRect().left;b.removeChild(f)}b=ab}if(b){b=d.ownerDocument.createRange();b.setStart(d,0);b.setEnd(d,d.textContent.length);d=um(b);b=[];for(f=0;f<a.length;f++){g=a[f];for(h=0;h<d.length;h++){var l=d[h];if(g.top>=l.top&&g.bottom<=
l.bottom&&1>Math.abs(g.right-l.right)){b.push({top:g.top,left:l.left,bottom:l.bottom,right:l.right});break}}h==d.length&&(u.b("Could not fix character box"),b.push(g))}a=b}for(b=d=0;b<a.length;b++)f=a[b],g=c?f.bottom-f.top:f.right-f.left,f.right>f.left&&f.bottom>f.top&&(isNaN(e)||g>d)&&(e=c?f.left:f.bottom,d=g);return e}function Bm(a,b){this.e=a;this.f=b}Bm.prototype.d=function(a,b){return b<this.f?null:Cm(a,this,0<b)};Bm.prototype.b=function(){return this.f};
function Dm(a,b,c,d){this.position=a;this.f=b;this.g=c;this.e=d}Dm.prototype.d=function(a,b){var c;b<this.b()?c=null:(a.e=this.e,c=this.position);return c};Dm.prototype.b=function(){return(xm[this.f]?1:0)+(this.g?3:0)+(this.position.parent?this.position.parent.h:0)};function Em(a,b,c){this.ga=a;this.d=b;this.b=c}
function Fm(a){for(var b=1;b<a.length;b++){var c=a[b-1],d=a[b];c===d?u.b("validateCheckPoints: duplicate entry"):c.ga>=d.ga?u.b("validateCheckPoints: incorrect boxOffset"):c.Z==d.Z&&(d.L?c.L&&u.b("validateCheckPoints: duplicate after points"):c.L?u.b("validateCheckPoints: inconsistent after point"):d.ga-c.ga!=d.ca-c.ca&&u.b("validateCheckPoints: boxOffset inconsistent with offsetInNode"))}}
function Gm(a,b,c){oi.call(this,a);this.bd=a.lastChild;this.g=b;this.zb=c;this.Hd=a.ownerDocument;this.Ac=!1;this.oa=this.cb=this.Ga=this.rd=this.La=0;this.Qa=this.bb=this.l=this.h=null;this.cd=!1;this.u=this.f=this.A=null;this.sd=!0;this.Cc=this.Bc=0}t(Gm,oi);Gm.prototype.clone=function(){var a=new Gm(this.d,this.g,this.zb);ti(a,this);a.bd=this.bd;a.Ac=this.Ac;a.l=this.l?this.l.clone():null;a.bb=this.bb.concat();return a};
function Hm(a,b){var c=(a.b?a.cb:a.La)-a.h.X,d=(a.b?a.La:a.Ga)-a.h.V;return new me(b.X-c,b.V-d,b.U-c,b.Q-d)}function Im(a,b){return a.b?b<a.oa:b>a.oa}function Jm(a,b,c){var d=new ei(b.ha,c,0);d.Na=b.Na;d.da=b.da;d.xa=b.xa;d.qa=b.qa?Jm(a,b.qa,hi(c)):null;return d}
function Km(a,b){var c=L("openAllViews"),d=b.ka;cm(a.g,a.d,a.Ac);var e=d.length-1,f=null;kf(function(){for(;0<=e;){f=Jm(a,d[e],f);if(0==e&&(f.ca=b.ca,f.L=b.L,f.L))break;var c=lm(a.g,f,0==e&&0==f.ca);e--;if(c.Aa())return c}return M(!1)}).then(function(){O(c,f)});return N(c)}var Lm=/^[^A-Za-z0-9_\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]*([A-Za-z0-9_\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527][^A-Za-z0-9_\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]*)?/;
function Mm(a,b){if(b.d&&b.b&&!b.L&&0==b.d.count&&1!=b.C.nodeType){var c=b.C.textContent.match(Lm);return rm(a.g,b,c[0].length)}return M(b)}function Nm(a,b,c){var d=L("buildViewToNextBlockEdge");lf(function(d){b.C&&c.push(hi(b));Mm(a,b).then(function(f){f!==b&&(b=f,c.push(hi(b)));om(a.g,b).then(function(c){(b=c)?b.j&&!a.b?Om(a,b).then(function(c){b=c;!b||b.e||0<a.g.f.b.length?P(d):nf(d)}):b.b?nf(d):P(d):P(d)})})}).then(function(){O(d,b)});return N(d)}
function Pm(a,b){if(!b.C)return M(b);var c=b.Z,d=L("buildDeepElementView");lf(function(d){Mm(a,b).then(function(f){if(f!==b){for(var g=f;g&&g.Z!=c;)g=g.parent;if(null==g){b=f;P(d);return}}om(a.g,f).then(function(a){(b=a)&&b.Z!=c?nf(d):P(d)})})}).then(function(){O(d,b)});return N(d)}function Qm(a,b,c,d,e){var f=a.Hd.createElement("div");a.b?(w(f,"height",d+"px"),w(f,"width",e+"px")):(w(f,"width",d+"px"),w(f,"height",e+"px"));w(f,"float",c);w(f,"clear",c);a.d.insertBefore(f,b);return f}
function Rm(a){for(var b=a.d.firstChild;b;){var c=b.nextSibling;if(1==b.nodeType){var d=b.style.cssFloat;if("left"==d||"right"==d)a.d.removeChild(b);else break}b=c}}function Sm(a){for(var b=a.d.firstChild,c=a.Qa,d=a.b?a.h.V:a.h.X,e=a.b?a.h.Q:a.h.U,f=0;f<c.length;f++){var g=c[f],h=g.Q-g.V;g.left=Qm(a,b,"left",g.X-d,h);g.right=Qm(a,b,"right",e-g.U,h)}}
function Tm(a,b,c,d,e){var f;if(b&&b.L&&!b.b&&(f=Am(b,0,a.b),!isNaN(f)))return f;b=c[d];for(e-=b.ga;;){f=Am(b,e,a.b);if(!isNaN(f))return f;if(0<e)e--;else{d--;if(0>d)return a.Ga;b=c[d];1!=b.C.nodeType&&(e=b.C.textContent.length)}}}function Um(a){return"number"==typeof a?a:(a=a.match(/^(-?[0-9]*(\.[0-9]*)?)px$/))?parseFloat(a[0]):0}
function Vm(a,b){var c=a.zb.b.getComputedStyle(b,null),d=new oe;c&&(d.left=Um(c.marginLeft),d.top=Um(c.marginTop),d.right=Um(c.marginRight),d.bottom=Um(c.marginBottom));return d}
function Wm(a,b,c){if(a=a.zb.b.getComputedStyle(b,null))c.marginLeft=Um(a.marginLeft),c.$=Um(a.borderLeftWidth),c.j=Um(a.paddingLeft),c.marginTop=Um(a.marginTop),c.ea=Um(a.borderTopWidth),c.k=Um(a.paddingTop),c.marginRight=Um(a.marginRight),c.Fa=Um(a.borderRightWidth),c.H=Um(a.paddingRight),c.marginBottom=Um(a.marginBottom),c.sa=Um(a.borderBottomWidth),c.w=Um(a.paddingBottom)}function Xm(a,b,c){b=new Em(b,c,c);a.f?a.f.push(b):a.f=[b]}
function Ym(a,b,c,d){if(a.f&&a.f[a.f.length-1].b)return Xm(a,b,c),M(!0);d+=40*(a.b?-1:1);var e=a.l,f=!e;if(f){var g=a.d.ownerDocument.createElement("div");w(g,"position","absolute");var h=a.g.clone(),e=new Gm(g,h,a.zb);a.l=e;e.b=sm(a.g,a.b,g);e.Ac=!0;a.b?(e.left=0,w(e.d,"width","2em")):(e.top=a.cb,w(e.d,"height","2em"))}a.d.appendChild(e.d);Wm(a,e.d,e);g=(a.b?-1:1)*(d-a.Ga);a.b?e.height=a.h.Q-a.h.V-pi(e)-qi(e):e.width=a.h.U-a.h.X-ri(e)-si(e);d=(a.b?-1:1)*(a.cb-d)-(a.b?ri(e)-si(e):pi(e)+qi(e));if(f&&
18>d)return a.d.removeChild(e.d),a.l=null,Xm(a,b,c),M(!0);if(!a.b&&e.top<g)return a.d.removeChild(e.d),Xm(a,b,c),M(!0);var l=L("layoutFootnoteInner");a.b?vi(e,0,d):ui(e,g,d);e.D=a.D+a.left+ri(a);e.F=a.F+a.top+pi(a);e.N=a.N;var k=new ki(c);f?(Zm(e),f=M(!0)):0==e.N.length?($m(e),f=M(!0)):f=an(e);f.then(function(){bn(e,k).then(function(d){a.b?(a.oa=a.cb+(e.e+ri(e)+si(e)),vi(e,0,e.e)):(a.oa=a.cb-(e.e+pi(e)+qi(e)),ui(e,a.oa-a.Ga,e.e));var f;!a.b&&0<e.N.length?f=an(e):f=M(d);f.then(function(d){d=new Em(b,
c,d?d.Ta:null);a.f?a.f.push(d):a.f=[d];O(l,!0)})})});return N(l)}
function cn(a,b){var c=L("layoutFootnote"),d=b.C;d.setAttribute("style","");w(d,"display","inline-block");d.textContent="M";var e=d.getBoundingClientRect(),f=a.b?e.left:e.bottom;d.textContent="";im(a.g,b,"footnote-call",d);d.textContent||d.parentNode.removeChild(d);d={ka:[{ha:b.Z,Na:0,da:b.da,xa:null,qa:null}],ca:0,L:!1};e=b.ga;b=b.modify();b.L=!0;Ym(a,e,d,f).then(function(){a.l&&a.l.d.parentNode&&a.d.removeChild(a.l.d);Im(a,f)&&0!=a.A.length&&(b.e=!0);O(c,b)});return N(c)}
function dn(a,b){var c=L("layoutFloat"),d=b.C,e=b.j,f=b.N,g=b.parent?b.parent.F:"ltr",h=a.g.f,l=b.C.parentNode;"page"===f?Bi(h,d,e):(w(d,"float","none"),w(d,"position","absolute"),w(d,"left","auto"),w(d,"right","auto"),w(d,"top","auto"));Pm(a,b).then(function(k){var m=d.getBoundingClientRect(),p=Vm(a,d),m=new me(m.left-p.left,m.top-p.top,m.right+p.right,m.bottom+p.bottom);if("page"===f)Ci(h,b,a.g)?(m=l.ownerDocument.createElement("span"),w(m,"width","0"),w(m,"height","0"),l.appendChild(m),k.C=m,O(c,
k)):Ei(h,b,Hm(a,m)).then(function(){O(c,null)});else{e=yi(e,a.b,g);for(var p=a.La,q=a.rd,v=b.parent;v&&v.b;)v=v.parent;if(v){var r=v.C.ownerDocument.createElement("div");r.style.left="0px";r.style.top="0px";a.b?(r.style.bottom="0px",r.style.width="1px"):(r.style.right="0px",r.style.height="1px");v.C.appendChild(r);var y=r.getBoundingClientRect(),p=Math.max(a.b?y.top:y.left,p),q=Math.min(a.b?y.bottom:y.right,q);v.C.removeChild(r);v=a.b?m.Q-m.V:m.U-m.X;"left"==e?q=Math.max(q,p+v):p=Math.min(p,q-v)}p=
new me(p,(a.b?-1:1)*a.Ga,q,(a.b?-1:1)*a.cb);q=m;a.b&&(q=Ee(m));Je(p,a.Qa,q,e);a.b&&(m=new me(-q.Q,q.X,-q.V,q.U));w(d,"left",m.X-(a.b?a.cb:a.La)+a.j+"px");w(d,"top",m.V-(a.b?a.La:a.Ga)+a.k+"px");m=a.b?m.X:m.Q;Im(a,m)&&0!=a.A.length?(b=b.modify(),b.e=!0,O(c,b)):(Rm(a),p=a.b?Ee(a.h):a.h,a.b?q=Ee(Hm(a,new me(-q.Q,q.X,-q.V,q.U))):q=Hm(a,q),Ke(p,a.Qa,q,e),Sm(a),"left"==e?a.Bc=m:a.Cc=m,en(a,m),O(c,k))}});return N(c)}
function fn(a,b){for(var c=a.C,d="";c&&b&&!d&&(1!=c.nodeType||(d=c.style.textAlign,b));c=c.parentNode);if(!b||"justify"==d){var c=a.C,e=c.ownerDocument,d=e.createElement("span");d.style.visibility="hidden";d.textContent=" ########################";d.setAttribute("data-adapt-spec","1");var f=b&&(a.L||1!=c.nodeType)?c.nextSibling:c;if(c=c.parentNode)c.insertBefore(d,f),b||(e=e.createElement("div"),c.insertBefore(e,f),d.style.lineHeight="80px",e.style.marginTop="-80px",e.style.height="0px",e.setAttribute("data-adapt-spec",
"1"))}}function gn(a,b,c,d){var e=L("processLineStyling");Fm(d);var f=d.concat([]);d.splice(0,d.length);var g=0,h=b.d;0==h.count&&(h=h.Rd);lf(function(d){if(h){var e=hn(a,f),m=h.count-g;if(e.length<=m)P(d);else{var p=jn(a,f,e[m-1]);kn(a,p,!1,!1).then(function(){g+=m;rm(a.g,p,0).then(function(e){b=e;fn(b,!1);h=b.d;f=[];Nm(a,b,f).then(function(b){c=b;0<a.g.f.b.length?P(d):nf(d)})})})}}else P(d)}).then(function(){Array.prototype.push.apply(d,f);Fm(d);O(e,c)});return N(e)}
function ln(a,b){for(var c=0,d=0,e=b.length-1;0<=e;e--){var f=b[e];if(!f.L||!f.C||1!=f.C.nodeType)break;f=Vm(a,f.C);f=a.b?-f.left:f.bottom;0<f?c=Math.max(c,f):d=Math.min(d,f)}return c-d}
function mn(a,b){var c=L("layoutBreakableBlock"),d=[];Nm(a,b,d).then(function(e){if(0<a.g.f.b.length)O(c,e);else{var f=d.length-1;if(0>f)O(c,e);else{var f=Tm(a,e,d,f,d[f].ga),g=Im(a,f);null==e&&(f+=ln(a,d));en(a,f);var h;b.d?h=gn(a,b,e,d):h=M(e);h.then(function(b){0<d.length&&(a.A.push(new Bm(d,d[0].h)),g&&(2!=d.length&&0<a.A.length||d[0].Z!=d[1].Z||!zm[d[0].Z.localName])&&b&&(b=b.modify(),b.e=!0));O(c,b)})}}});return N(c)}
function jn(a,b,c){Fm(b);for(var d=0,e=b[0].ga,f=d,g=b.length-1,h=b[g].ga,l;e<h;){l=e+Math.ceil((h-e)/2);for(var f=d,k=g;f<k;){var m=f+Math.ceil((k-f)/2);b[m].ga>l?k=m-1:f=m}k=Tm(a,null,b,f,l);if(a.b?k<c:k>c){for(h=l-1;b[f].ga==l;)f--;g=f}else en(a,k),e=l,d=f}a=b[f];b=a.C;1!=b.nodeType&&(a.L?a.ca=b.length:(e-=a.ga,c=b.data,173==c.charCodeAt(e)?(b.replaceData(e,c.length-e,"-"),e++):(d=c.charAt(e),e++,f=c.charAt(e),b.replaceData(e,c.length-e,Na(d)&&Na(f)?"-":"")),0<e&&(a=a.modify(),a.ca+=e,a.g=null)));
return a}
function hn(a,b){for(var c=[],d=b[0].C,e=b[b.length-1].C,f=[],g=d.ownerDocument.createRange(),h=!1,l=null,k=!1,m=!0;m;){var p=!0;do{var q=null;d==e&&(m=!1);1!=d.nodeType?(k||(g.setStartBefore(d),k=!0),l=d):h?h=!1:d.getAttribute("data-adapt-spec")?p=!k:q=d.firstChild;q||(q=d.nextSibling,q||(h=!0,q=d.parentNode));d=q}while(p&&m);if(k){g.setEndAfter(l);k=um(g);for(p=0;p<k.length;p++)f.push(k[p]);k=!1}}f.sort(a.b?bi:ai);l=d=h=g=e=0;for(m=a.b?-1:1;;){if(l<f.length&&(k=f[l],p=1,0<d&&(p=Math.max(a.b?k.right-
k.left:k.bottom-k.top,1),p=m*(a.b?k.right:k.top)<m*e?m*((a.b?k.left:k.bottom)-e)/p:m*(a.b?k.left:k.bottom)>m*g?m*(g-(a.b?k.right:k.top))/p:1),0==d||.6<=p||.2<=p&&(a.b?k.top:k.left)>=h-1)){h=a.b?k.bottom:k.right;a.b?(e=0==d?k.right:Math.max(e,k.right),g=0==d?k.left:Math.min(g,k.left)):(e=0==d?k.top:Math.min(e,k.top),g=0==d?k.bottom:Math.max(g,k.bottom));d++;l++;continue}0<d&&(c.push(g),d=0);if(l>=f.length)break}c.sort(Ra);a.b&&c.reverse();return c}
function nn(a,b){if(!a.f)return M(!0);for(var c=!1,d=a.f.length-1;0<=d;--d){var e=a.f[d];if(e.ga<=b)break;a.f.pop();e.b!==e.d&&(c=!0)}if(!c)return M(!0);var f=L("clearFootnotes"),g=a.e+a.Ga,h=a.f;a.l=null;a.f=null;var l=0;kf(function(){for(;l<h.length;){var b=h[l++],b=Ym(a,b.ga,b.d,g);if(b.Aa())return b}return M(!1)}).then(function(){O(f,!0)});return N(f)}
function Cm(a,b,c){var d=b.e,e;if(c)e=c=1;else{for(e=d[0];e.parent&&e.b;)e=e.parent;c=Math.max((e.l.widows||2)-0,1);e=Math.max((e.l.orphans||2)-0,1)}var f=hn(a,d),g=a.oa,d=Qa(f.length,function(b){return a.b?f[b]<g:f[b]>g}),d=Math.min(f.length-c,d);if(d<e)return null;g=f[d-1];if(b=jn(a,b.e,g))a.e=(a.b?-1:1)*(g-a.Ga);return b}
function kn(a,b,c,d){var e=b;c=c||null!=b.C&&1==b.C.nodeType&&!b.L;do{var f=e.C.parentNode;if(!f)break;var g=f,h=e.C;if(g)for(var l=void 0;(l=g.lastChild)!=h;)g.removeChild(l);c&&(f.removeChild(e.C),c=!1);e=e.parent}while(e);d&&fn(b,!0);return nn(a,b.ga)}
function on(a,b,c){var d=L("findAcceptableBreak"),e=null,f=0,g=0;do for(var f=g,g=Number.MAX_VALUE,h=a.A.length-1;0<=h&&!e;--h){var e=a.A[h].d(a,f),l=a.A[h].b();l>f&&(g=Math.min(g,l))}while(g>f&&!e);var k=!1;if(!e){u.b("Could not find any page breaks?!!");if(a.sd)return pn(a,b).then(function(b){b?(b=b.modify(),b.e=!1,kn(a,b,k,!0).then(function(){O(d,b)})):O(d,b)}),N(d);e=c;k=!0}kn(a,e,k,!0).then(function(){O(d,e)});return N(d)}
function qn(a){a=a.toString();return""==a||"auto"==a||!!a.match(/^0+(.0*)?[^0-9]/)}function rn(a,b,c,d,e){if(!b)return!1;var f=Am(b,0,a.b),g=Im(a,f);c&&(f+=ln(a,c));en(a,f);if(d||!g)b=new Dm(hi(b),e,g,a.e),a.A.push(b);return g}
function sn(a,b){if(b.C.parentNode){var c=Vm(a,b.C),d=b.C.ownerDocument.createElement("div");a.b?(d.style.bottom="0px",d.style.width="1px",d.style.marginRight=c.right+"px"):(d.style.right="0px",d.style.height="1px",d.style.marginTop=c.top+"px");b.C.parentNode.insertBefore(d,b.C);var e=d.getBoundingClientRect(),e=a.b?e.right:e.top,f=a.b?-1:1,g;switch(b.u){case "left":g=a.Bc;break;case "right":g=a.Cc;break;default:g=f*Math.max(a.Cc*f,a.Bc*f)}e*f>=g*f?b.C.parentNode.removeChild(d):(e=Math.max(1,(g-e)*
f),a.b?d.style.width=e+"px":d.style.height=e+"px",e=d.getBoundingClientRect(),e=a.b?e.left:e.bottom,a.b?(g=e+c.right-g,0<g==0<=c.right&&(g+=c.right),d.style.marginLeft=g+"px"):(g-=e+c.top,0<g==0<=c.top&&(g+=c.top),d.style.marginBottom=g+"px"))}}
function tn(a,b,c){function d(){b=k[0]||b;b.C.parentNode.removeChild(b.C);e.u=h}var e=a,f=L("skipEdges"),g=c&&b&&b.L,h=null,l=null,k=[],m=[],p=!1;lf(function(a){for(;b;){do if(b.C){if(b.b&&1!=b.C.nodeType){if(Yh(b.C,b.w))break;if(!b.L){!c&&wm[h]?d():rn(e,l,null,!0,h)?(b=(l||b).modify(),b.e=!0):(b=b.modify(),b.g=h);P(a);return}}if(!b.L&&(b.u&&sn(e,b),b.j||b.A)){k.push(hi(b));h=ym(h,b.g);!c&&wm[h]?d():rn(e,l,null,!0,h)&&(b=(l||b).modify(),b.e=!0);P(a);return}if(1==b.C.nodeType){var f=b.C.style;if(b.L){if(p){if(!c&&
wm[h]){d();P(a);return}k=[];g=c=!1;h=null}p=!1;l=hi(b);m.push(l);h=ym(h,b.D);if(f&&(!qn(f.paddingBottom)||!qn(f.borderBottomWidth))){if(rn(e,l,null,!0,h)){b=(l||b).modify();b.e=!0;P(a);return}m=[l];l=null}}else{k.push(hi(b));h=ym(h,b.g);if(zm[b.C.localName]){!c&&wm[h]?d():rn(e,l,null,!0,h)&&(b=(l||b).modify(),b.e=!0);P(a);return}!f||qn(f.paddingTop)&&qn(f.borderTopWidth)||(g=!1,m=[]);p=!0}}}while(0);f=om(e.g,b,g);if(f.Aa()){f.then(function(c){b=c;nf(a)});return}b=f.gc()}rn(e,l,m,!1,h)&&l&&(b=l.modify(),
b.e=!0);P(a)}).then(function(){O(f,b)});return N(f)}
function pn(a,b){var c=b,d=L("skipEdges"),e=null,f=!1;lf(function(d){for(;b;){do if(b.C){if(b.b&&1!=b.C.nodeType){if(Yh(b.C,b.w))break;if(!b.L){wm[e]&&(a.u=e);P(d);return}}if(!b.L&&(b.j||b.A)){e=ym(e,b.g);wm[e]&&(a.u=e);P(d);return}if(1==b.C.nodeType){var h=b.C.style;if(b.L){if(f){if(wm[e]){a.u=e;P(d);return}e=null}f=!1;e=ym(e,b.D)}else{e=ym(e,b.g);if(zm[b.C.localName]){wm[e]&&(a.u=e);P(d);return}if(h&&(!qn(h.paddingTop)||!qn(h.borderTopWidth))){P(d);return}}f=!0}}while(0);h=om(a.g,b);if(h.Aa()){h.then(function(a){b=
a;nf(d)});return}b=h.gc()}c=null;P(d)}).then(function(){O(d,c)});return N(d)}function Om(a,b){return"footnote"==b.j?cn(a,b):dn(a,b)}function un(a,b,c){var d=L("layoutNext");tn(a,b,c).then(function(c){b=c;if(!b||a.u||b.e)O(d,b);else if(b.j)Om(a,b).ra(d);else{a:if(b.L)c=!0;else{switch(b.Z.namespaceURI){case "http://www.w3.org/2000/svg":c=!1;break a}c=!b.A}c?mn(a,b).ra(d):Pm(a,b).ra(d)}});return N(d)}
function $m(a){var b=a.d.ownerDocument.createElement("div");b.style.position="absolute";b.style.top=a.k+"px";b.style.right=a.H+"px";b.style.bottom=a.w+"px";b.style.left=a.j+"px";a.d.appendChild(b);var c=b.getBoundingClientRect();a.d.removeChild(b);var b=a.D+a.left+ri(a),d=a.F+a.top+pi(a);a.h=new me(b,d,b+a.width,d+a.height);a.La=c?a.b?c.top:c.left:0;a.rd=c?a.b?c.bottom:c.right:0;a.Ga=c?a.b?c.right:c.top:0;a.cb=c?a.b?c.left:c.bottom:0;a.Bc=a.Ga;a.Cc=a.Ga;a.oa=a.cb;c=a.h;b=a.D+a.left+ri(a);d=a.F+a.top+
pi(a);b=a.rb?ue(a.rb,b,d):we(b,d,b+a.width,d+a.height);a.Qa=Ge(c,[b],a.N,a.Ka,a.b);Sm(a);a.f=null}function Zm(a){a.bb=[];w(a.d,"width",a.width+"px");w(a.d,"height",a.height+"px");$m(a);a.e=0;a.cd=!1;a.u=null}function en(a,b){a.e=Math.max((a.b?-1:1)*(b-a.Ga),a.e)}function vn(a,b){var c=b.b;if(!c)return M(!0);var d=L("layoutOverflownFootnotes"),e=0;kf(function(){for(;e<c.length;){var b=c[e++],b=Ym(a,0,b,a.Ga);if(b.Aa())return b}return M(!1)}).then(function(){O(d,!0)});return N(d)}
function bn(a,b){a.bb.push(b);if(a.cd)return M(b);var c=L("layout");vn(a,b).then(function(){Km(a,b.Ta).then(function(b){var e=b,f=!0;a.A=[];lf(function(c){for(;b;){var h=!0;un(a,b,f).then(function(l){f=!1;b=l;0<a.g.f.b.length?P(c):a.u?P(c):b&&b.e?on(a,b,e).then(function(a){b=a;P(c)}):h?h=!1:nf(c)});if(h){h=!1;return}}P(c)}).then(function(){var e=a.l;e&&(a.d.appendChild(e.d),a.b?a.e=this.Ga-this.cb:a.e=e.top+pi(e)+e.e+qi(e));if(b)if(0<a.g.f.b.length)O(c,null);else{a.cd=!0;e=new ki(ji(b));if(a.f){for(var f=
[],l=0;l<a.f.length;l++){var k=a.f[l].b;k&&f.push(k)}e.b=f.length?f:null}O(c,e)}else O(c,null)})})});return N(c)}function an(a){for(var b=a.bb,c=a.d.lastChild;c!=a.bd;){var d=c.previousSibling;a.d===c.parentNode&&Yl(c)||a.d.removeChild(c);c=d}Rm(a);Zm(a);var e=L("redoLayout"),f=0,g=null;lf(function(c){if(f<b.length){var d=b[f++];bn(a,d).then(function(a){a?(g=a,P(c)):nf(c)})}else P(c)}).then(function(){O(e,g)});return N(e)};function wn(a,b){this.e(a,"end",b)}function xn(a,b){this.e(a,"start",b)}function yn(a,b,c){c||(c=this.g.now());var d=this.f[a];d||(d=this.f[a]=[]);var e;for(a=d.length-1;0<=a&&(!(e=d[a])||e[b]);a--)e=null;e||(e={},d.push(e));e[b]=c}function zn(){}function An(a){this.g=a;this.f={};this.registerEndTiming=this.d=this.registerStartTiming=this.b=this.e=zn}
An.prototype.h=function(){var a=this.f,b="";Object.keys(a).forEach(function(c){for(var d=a[c],e=d.length,f=0;f<e;f++){var g=d[f];b+=c;1<e&&(b+="("+f+")");b+=" => start: "+g.start+", end: "+g.end+", duration: "+(g.end-g.start)+"\n"}});u.e(b)};An.prototype.j=function(){this.registerEndTiming=this.d=this.registerStartTiming=this.b=this.e=zn};An.prototype.k=function(){this.e=yn;this.registerStartTiming=this.b=xn;this.registerEndTiming=this.d=wn};
var Bn={now:Date.now},Cn,Dn=Cn=new An(window&&window.performance||Bn);yn.call(Dn,"load_vivliostyle","start",void 0);ca("vivliostyle.profile.profiler",Dn);An.prototype.printTimings=An.prototype.h;An.prototype.disable=An.prototype.j;An.prototype.enable=An.prototype.k;function En(a,b,c){function d(c){return a.b.getComputedStyle(b,null).getPropertyValue(c)}function e(){w(b,"display","block");w(b,"position","static");return d(W)}function f(){w(b,"display","inline-block");w(r,W,"99999999px");var a=d(W);w(r,W,"");return a}function g(){w(b,"display","inline-block");w(r,W,"0");var a=d(W);w(r,W,"");return a}function h(){var a=e(),b=g(),c=parseFloat(a);if(c<=parseFloat(b))return b;b=f();return c<=parseFloat(b)?a:b}function l(){throw Error("Getting fill-available block size is not implemented");
}var k=b.style.display,m=b.style.position,p=b.style.width,q=b.style.height,v=b.parentNode,r=b.ownerDocument.createElement("div");w(r,"position",m);v.insertBefore(r,b);r.appendChild(b);w(b,"width","auto");w(b,"height","auto");var y=Ga("writing-mode"),y=(y?d(y):null)||d("writing-mode"),J="vertical-rl"===y||"tb-rl"===y||"vertical-lr"===y||"tb-lr"===y,W=J?"height":"width",pa=J?"width":"height",X={};c.forEach(function(a){var c;switch(a){case "fill-available inline size":c=e();break;case "max-content inline size":c=
f();break;case "min-content inline size":c=g();break;case "fit-content inline size":c=h();break;case "fill-available block size":c=l();break;case "max-content block size":case "min-content block size":case "fit-content block size":c=d(pa);break;case "fill-available width":c=J?l():e();break;case "fill-available height":c=J?e():l();break;case "max-content width":c=J?d(pa):f();break;case "max-content height":c=J?f():d(pa);break;case "min-content width":c=J?d(pa):g();break;case "min-content height":c=
J?g():d(pa);break;case "fit-content width":c=J?d(pa):h();break;case "fit-content height":c=J?h():d(pa)}X[a]=parseFloat(c);w(b,"position",m);w(b,"display",k)});w(b,"width",p);w(b,"height",q);v.insertBefore(b,r);v.removeChild(r);return X};function Fn(a){var b=a["writing-mode"],b=b&&b.value;a=(a=a.direction)&&a.value;return b===ce||b!==de&&a!==Zd?"ltr":"rtl"}
var Gn={a5:{width:new I(148,"mm"),height:new I(210,"mm")},a4:{width:new I(210,"mm"),height:new I(297,"mm")},a3:{width:new I(297,"mm"),height:new I(420,"mm")},b5:{width:new I(176,"mm"),height:new I(250,"mm")},b4:{width:new I(250,"mm"),height:new I(353,"mm")},"jis-b5":{width:new I(182,"mm"),height:new I(257,"mm")},"jis-b4":{width:new I(257,"mm"),height:new I(364,"mm")},letter:{width:new I(8.5,"in"),height:new I(11,"in")},legal:{width:new I(8.5,"in"),height:new I(14,"in")},ledger:{width:new I(11,"in"),
height:new I(17,"in")}},Hn=new I(.24,"pt"),In=new I(3,"mm"),Jn=new I(10,"mm"),Kn=new I(13,"mm");
function Ln(a){var b={width:he,height:ie,Bb:je,ub:je},c=a.size;if(c&&c.value!==ud){var d=c.value;d.Qc()?(c=d.values[0],d=d.values[1]):(c=d,d=null);if(c.Tb())b.width=c,b.height=d||c;else if(c=Gn[c.name.toLowerCase()])d&&d===Md?(b.width=c.height,b.height=c.width):(b.width=c.width,b.height=c.height)}(c=a.marks)&&c.value!==Qd&&(b.ub=Kn);a=a.bleed;a&&a.value!==ud?a.value&&a.value.Tb()&&(b.Bb=a.value):c&&(a=!1,c.value.Qc()?a=c.value.values.some(function(a){return a===Ad}):a=c.value===Ad,a&&(b.Bb=new I(6,
"pt")));return b}function Mn(a,b){var c={},d=a.Bb.B*pc(b,a.Bb.fa,!1),e=a.ub.B*pc(b,a.ub.fa,!1),f=d+e,g=a.width;c.lb=g===he?(b.S.Wa?Math.floor(b.sa/2)-b.S.Gb:b.sa)-2*f:g.B*pc(b,g.fa,!1);g=a.height;c.kb=g===ie?b.Qa-2*f:g.B*pc(b,g.fa,!1);c.Bb=d;c.ub=e;c.Hc=f;return c}function Nn(a,b,c){a=a.createElementNS("http://www.w3.org/2000/svg","svg");a.setAttribute("width",b);a.setAttribute("height",c);a.style.position="absolute";return a}
function On(a,b,c){a=a.createElementNS("http://www.w3.org/2000/svg",c||"polyline");a.setAttribute("stroke","black");a.setAttribute("stroke-width",b);a.setAttribute("fill","none");return a}var Pn={je:"top left",ke:"top right",ae:"bottom left",be:"bottom right"};
function Qn(a,b,c,d,e,f){var g=d;g<=e+2*lc.mm&&(g=e+d/2);var h=Math.max(d,g),l=e+h+c/2,k=Nn(a,l,l),g=[[0,e+d],[d,e+d],[d,e+d-g]];d=g.map(function(a){return[a[1],a[0]]});if("top right"===b||"bottom right"===b)g=g.map(function(a){return[e+h-a[0],a[1]]}),d=d.map(function(a){return[e+h-a[0],a[1]]});if("bottom left"===b||"bottom right"===b)g=g.map(function(a){return[a[0],e+h-a[1]]}),d=d.map(function(a){return[a[0],e+h-a[1]]});l=On(a,c);l.setAttribute("points",g.map(function(a){return a.join(",")}).join(" "));
k.appendChild(l);a=On(a,c);a.setAttribute("points",d.map(function(a){return a.join(",")}).join(" "));k.appendChild(a);b.split(" ").forEach(function(a){k.style[a]=f+"px"});return k}var Rn={ie:"top",$d:"bottom",Fd:"left",Gd:"right"};
function Sn(a,b,c,d,e){var f=2*d,g;"top"===b||"bottom"===b?(g=f,f=d):g=d;var h=Nn(a,g,f),l=On(a,c);l.setAttribute("points","0,"+f/2+" "+g+","+f/2);h.appendChild(l);l=On(a,c);l.setAttribute("points",g/2+",0 "+g/2+","+f);h.appendChild(l);a=On(a,c,"circle");a.setAttribute("cx",g/2);a.setAttribute("cy",f/2);a.setAttribute("r",d/4);h.appendChild(a);var k;switch(b){case "top":k="bottom";break;case "bottom":k="top";break;case "left":k="right";break;case "right":k="left"}Object.keys(Rn).forEach(function(a){a=
Rn[a];a===b?h.style[a]=e+"px":a!==k&&(h.style[a]="0",h.style["margin-"+a]="auto")});return h}function Tn(a,b,c,d){var e=!1,f=!1;if(a=a.marks)a=a.value,a.Qc()?a.values.forEach(function(a){a===Ad?e=!0:a===Bd&&(f=!0)}):a===Ad?e=!0:a===Bd&&(f=!0);if(e||f){var g=c.M,h=g.ownerDocument,l=b.Bb,k=qd(Hn,d),m=qd(In,d),p=qd(Jn,d);e&&Object.keys(Pn).forEach(function(a){a=Qn(h,Pn[a],k,p,l,m);g.appendChild(a)});f&&Object.keys(Rn).forEach(function(a){a=Sn(h,Rn[a],k,p,m);g.appendChild(a)})}}
var Un=function(){var a={width:!0,height:!0,"block-size":!0,"inline-size":!0,margin:!0,padding:!0,border:!0,outline:!0,"outline-width":!0,"outline-style":!0,"outline-color":!0};"left right top bottom before after start end block-start block-end inline-start inline-end".split(" ").forEach(function(b){a["margin-"+b]=!0;a["padding-"+b]=!0;a["border-"+b+"-width"]=!0;a["border-"+b+"-style"]=!0;a["border-"+b+"-color"]=!0});return a}(),Vn={"top-left-corner":{P:1,wa:!0,ta:!1,ua:!0,va:!0,ja:null},"top-left":{P:2,
wa:!0,ta:!1,ua:!1,va:!1,ja:"start"},"top-center":{P:3,wa:!0,ta:!1,ua:!1,va:!1,ja:"center"},"top-right":{P:4,wa:!0,ta:!1,ua:!1,va:!1,ja:"end"},"top-right-corner":{P:5,wa:!0,ta:!1,ua:!1,va:!0,ja:null},"right-top":{P:6,wa:!1,ta:!1,ua:!1,va:!0,ja:"start"},"right-middle":{P:7,wa:!1,ta:!1,ua:!1,va:!0,ja:"center"},"right-bottom":{P:8,wa:!1,ta:!1,ua:!1,va:!0,ja:"end"},"bottom-right-corner":{P:9,wa:!1,ta:!0,ua:!1,va:!0,ja:null},"bottom-right":{P:10,wa:!1,ta:!0,ua:!1,va:!1,ja:"end"},"bottom-center":{P:11,wa:!1,
ta:!0,ua:!1,va:!1,ja:"center"},"bottom-left":{P:12,wa:!1,ta:!0,ua:!1,va:!1,ja:"start"},"bottom-left-corner":{P:13,wa:!1,ta:!0,ua:!0,va:!1,ja:null},"left-bottom":{P:14,wa:!1,ta:!1,ua:!0,va:!1,ja:"end"},"left-middle":{P:15,wa:!1,ta:!1,ua:!0,va:!1,ja:"center"},"left-top":{P:16,wa:!1,ta:!1,ua:!0,va:!1,ja:"start"}},Wn=Object.keys(Vn).sort(function(a,b){return Vn[a].P-Vn[b].P});
function Xn(a,b,c){dl.call(this,a,null,"vivliostyle-page-rule-master",[],b,null,0);a=Ln(c);new Yn(this.d,this,c,a);this.l={};Zn(this,c);this.b.position=new T(Vd,0);this.b.width=new T(a.width,0);this.b.height=new T(a.height,0);for(var d in c)Un[d]||"background-clip"===d||(this.b[d]=c[d])}t(Xn,dl);function Zn(a,b){var c=b._marginBoxes;c&&Wn.forEach(function(d){c[d]&&(a.l[d]=new $n(a.d,a,d,b))})}Xn.prototype.f=function(a){return new ao(a,this)};
function Yn(a,b,c,d){hl.call(this,a,null,null,[],b);this.u=d;this.b["z-index"]=new T(new md(0),0);this.b["flow-from"]=new T(H("body"),0);this.b.position=new T(rd,0);this.b.overflow=new T(ee,0);for(var e in Un)Un.hasOwnProperty(e)&&(this.b[e]=c[e])}t(Yn,hl);Yn.prototype.f=function(a){return new bo(a,this)};
function $n(a,b,c,d){hl.call(this,a,null,null,[],b);this.k=c;a=d._marginBoxes[this.k];for(var e in d)if(b=d[e],c=a[e],Ji[e]||c&&c.value===Id)this.b[e]=b;for(e in a)Object.prototype.hasOwnProperty.call(a,e)&&(b=a[e])&&b.value!==Id&&(this.b[e]=b)}t($n,hl);$n.prototype.f=function(a){return new co(a,this)};function ao(a,b){el.call(this,a,b);this.j=null;this.pa={}}t(ao,el);
ao.prototype.h=function(a,b){var c=this.D,d;for(d in b)if(Object.prototype.hasOwnProperty.call(b,d))switch(d){case "writing-mode":case "direction":c[d]=b[d]}el.prototype.h.call(this,a,b)};ao.prototype.Nc=function(){var a=this.style;a.left=je;a["margin-left"]=je;a["border-left-width"]=je;a["padding-left"]=je;a["padding-right"]=je;a["border-right-width"]=je;a["margin-right"]=je;a.right=je};
ao.prototype.Oc=function(){var a=this.style;a.top=je;a["margin-top"]=je;a["border-top-width"]=je;a["padding-top"]=je;a["padding-bottom"]=je;a["border-bottom-width"]=je;a["margin-bottom"]=je;a.bottom=je};ao.prototype.$=function(a,b,c){b=b.u;var d={start:this.j.marginLeft,end:this.j.marginRight,aa:this.j.Db},e={start:this.j.marginTop,end:this.j.marginBottom,aa:this.j.Cb};eo(this,b.top,!0,d,a,c);eo(this,b.bottom,!0,d,a,c);eo(this,b.left,!1,e,a,c);eo(this,b.right,!1,e,a,c)};
function fo(a,b,c,d,e){this.M=a;this.l=e;this.g=c;this.k=!Y(d,b[c?"width":"height"],new Qc(d,0,"px"));this.h=null}fo.prototype.b=function(){return this.k};function go(a){a.h||(a.h=En(a.l,a.M.d,a.g?["max-content width","min-content width"]:["max-content height","min-content height"]));return a.h}fo.prototype.e=function(){var a=go(this);return this.g?ri(this.M)+a["max-content width"]+si(this.M):pi(this.M)+a["max-content height"]+qi(this.M)};
fo.prototype.f=function(){var a=go(this);return this.g?ri(this.M)+a["min-content width"]+si(this.M):pi(this.M)+a["min-content height"]+qi(this.M)};fo.prototype.d=function(){return this.g?ri(this.M)+this.M.width+si(this.M):pi(this.M)+this.M.height+qi(this.M)};function ho(a){this.g=a}ho.prototype.b=function(){return this.g.some(function(a){return a.b()})};ho.prototype.e=function(){var a=this.g.map(function(a){return a.e()});return Math.max.apply(null,a)*a.length};
ho.prototype.f=function(){var a=this.g.map(function(a){return a.f()});return Math.max.apply(null,a)*a.length};ho.prototype.d=function(){var a=this.g.map(function(a){return a.d()});return Math.max.apply(null,a)*a.length};function io(a,b,c,d,e,f){fo.call(this,a,b,c,d,e);this.j=f}t(io,fo);io.prototype.b=function(){return!1};io.prototype.e=function(){return this.d()};io.prototype.f=function(){return this.d()};io.prototype.d=function(){return this.g?ri(this.M)+this.j+si(this.M):pi(this.M)+this.j+qi(this.M)};
function eo(a,b,c,d,e,f){var g=a.d.d,h={},l={},k={},m;for(m in b){var p=Vn[m];if(p){var q=b[m],v=a.pa[m],r=new fo(q,v.style,c,g,f);h[p.ja]=q;l[p.ja]=v;k[p.ja]=r}}a=d.start.evaluate(e);d.end.evaluate(e);b=d.aa.evaluate(e);var y=jo(k,b),J=!1,W={};Object.keys(h).forEach(function(a){var b=Y(g,l[a].style[c?"max-width":"max-height"],d.aa);b&&(b=b.evaluate(e),y[a]>b&&(b=k[a]=new io(h[a],l[a].style,c,g,f,b),W[a]=b.d(),J=!0))});J&&(y=jo(k,b),J=!1,["start","center","end"].forEach(function(a){y[a]=W[a]||y[a]}));
var pa={};Object.keys(h).forEach(function(a){var b=Y(g,l[a].style[c?"min-width":"min-height"],d.aa);b&&(b=b.evaluate(e),y[a]<b&&(b=k[a]=new io(h[a],l[a].style,c,g,f,b),pa[a]=b.d(),J=!0))});J&&(y=jo(k,b),["start","center","end"].forEach(function(a){y[a]=pa[a]||y[a]}));var X=a+b,F=a+(a+b);["start","center","end"].forEach(function(a){var b=y[a];if(b){var d=h[a],e=0;switch(a){case "start":e=c?d.left:d.top;break;case "center":e=(F-b)/2;break;case "end":e=X-b}c?vi(d,e,b-ri(d)-si(d)):ui(d,e,b-pi(d)-qi(d))}})}
function jo(a,b){var c=a.start,d=a.center,e=a.end,f={};if(d){var g=[c,e].filter(function(a){return a}),g=ko(d,g.length?new ho(g):null,b);g.Pa&&(f.center=g.Pa);d=g.Pa||d.d();d=(b-d)/2;c&&c.b()&&(f.start=d);e&&e.b()&&(f.end=d)}else c=ko(c,e,b),c.Pa&&(f.start=c.Pa),c.ec&&(f.end=c.ec);return f}
function ko(a,b,c){var d={Pa:null,ec:null};if(a&&b)if(a.b()&&b.b()){var e=a.e(),f=b.e();0<e&&0<f?(f=e+f,f<c?d.Pa=c*e/f:(a=a.f(),b=b.f(),b=a+b,b<c?d.Pa=a+(c-b)*(e-a)/(f-b):0<b&&(d.Pa=c*a/b)),0<d.Pa&&(d.ec=c-d.Pa)):0<e?d.Pa=c:0<f&&(d.ec=c)}else a.b()?d.Pa=Math.max(c-b.d(),0):b.b()&&(d.ec=Math.max(c-a.d(),0));else a?a.b()&&(d.Pa=c):b&&b.b()&&(d.ec=c);return d}ao.prototype.mb=function(a,b,c,d){ao.Ed.mb.call(this,a,b,c,d);b.d.setAttribute("data-vivliostyle-page-box",!0)};
function bo(a,b){il.call(this,a,b);this.marginLeft=this.marginBottom=this.marginRight=this.marginTop=this.Cb=this.Db=null}t(bo,il);
bo.prototype.h=function(a,b){var c=this.D,d;for(d in b)Object.prototype.hasOwnProperty.call(b,d)&&(d.match(/^column.*$/)||d.match(/^background-/))&&(c[d]=b[d]);il.prototype.h.call(this,a,b);d=this.e;c={Db:this.Db,Cb:this.Cb,marginTop:this.marginTop,marginRight:this.marginRight,marginBottom:this.marginBottom,marginLeft:this.marginLeft};d.j=c;d=d.style;d.width=new K(c.Db);d.height=new K(c.Cb);d["padding-left"]=new K(c.marginLeft);d["padding-right"]=new K(c.marginRight);d["padding-top"]=new K(c.marginTop);
d["padding-bottom"]=new K(c.marginBottom)};bo.prototype.Nc=function(){var a=lo(this,{start:"left",end:"right",aa:"width"});this.Db=a.vd;this.marginLeft=a.Cd;this.marginRight=a.Bd};bo.prototype.Oc=function(){var a=lo(this,{start:"top",end:"bottom",aa:"height"});this.Cb=a.vd;this.marginTop=a.Cd;this.marginBottom=a.Bd};
function lo(a,b){var c=a.style,d=a.d.d,e=b.start,f=b.end,g=b.aa,h=a.d.u[g].ia(d,null),l=Y(d,c[g],h),k=Y(d,c["margin-"+e],h),m=Y(d,c["margin-"+f],h),p=jl(d,c["padding-"+e],h),q=jl(d,c["padding-"+f],h),v=ll(d,c["border-"+e+"-width"],c["border-"+e+"-style"],h),r=ll(d,c["border-"+f+"-width"],c["border-"+f+"-style"],h),y=E(d,h,D(d,D(d,v,p),D(d,r,q)));l?(y=E(d,y,l),k||m?k?m=E(d,y,k):k=E(d,y,m):m=k=Yc(d,y,new gc(d,.5))):(k||(k=d.b),m||(m=d.b),l=E(d,y,D(d,k,m)));c[e]=new K(k);c[f]=new K(m);c["margin-"+e]=
je;c["margin-"+f]=je;c["padding-"+e]=new K(p);c["padding-"+f]=new K(q);c["border-"+e+"-width"]=new K(v);c["border-"+f+"-width"]=new K(r);c[g]=new K(l);c["max-"+g]=new K(l);return{vd:E(d,h,D(d,k,m)),Cd:k,Bd:m}}bo.prototype.mb=function(a,b,c,d){il.prototype.mb.call(this,a,b,c,d);c.w=b.d};function co(a,b){il.call(this,a,b);var c=b.k;this.j=Vn[c];a.pa[c]=this;this.sa=!0}t(co,il);n=co.prototype;
n.mb=function(a,b,c,d){var e=b.d;w(e,"display","flex");var f=vl(this,a,"vertical-align"),g=null;f===H("middle")?g="center":f===H("top")?g="flex-start":f===H("bottom")&&(g="flex-end");g&&(w(e,"flex-flow",this.b?"row":"column"),w(e,"justify-content",g));il.prototype.mb.call(this,a,b,c,d)};
n.ja=function(a,b){var c=this.style,d=this.d.d,e=a.start,f=a.end,g="left"===e,h=g?b.Db:b.Cb,l=Y(d,c[a.aa],h),g=g?b.marginLeft:b.marginTop;if("start"===this.j.ja)c[e]=new K(g);else if(l){var k=jl(d,c["margin-"+e],h),m=jl(d,c["margin-"+f],h),p=jl(d,c["padding-"+e],h),q=jl(d,c["padding-"+f],h),v=ll(d,c["border-"+e+"-width"],c["border-"+e+"-style"],h),f=ll(d,c["border-"+f+"-width"],c["border-"+f+"-style"],h),l=D(d,l,D(d,D(d,p,q),D(d,D(d,v,f),D(d,k,m))));switch(this.j.ja){case "center":c[e]=new K(D(d,
g,Zc(d,E(d,h,l),new gc(d,2))));break;case "end":c[e]=new K(E(d,D(d,g,h),l))}}};
function mo(a,b,c){function d(a){if(y)return y;y={aa:r?r.evaluate(a):null,Ia:l?l.evaluate(a):null,Ja:k?k.evaluate(a):null};var b=h.evaluate(a),c=0;[q,m,p,v].forEach(function(b){b&&(c+=b.evaluate(a))});(null===y.Ia||null===y.Ja)&&c+y.aa+y.Ia+y.Ja>b&&(null===y.Ia&&(y.Ia=0),null===y.Ja&&(y.pe=0));null!==y.aa&&null!==y.Ia&&null!==y.Ja&&(y.Ja=null);null===y.aa&&null!==y.Ia&&null!==y.Ja?y.aa=b-c-y.Ia-y.Ja:null!==y.aa&&null===y.Ia&&null!==y.Ja?y.Ia=b-c-y.aa-y.Ja:null!==y.aa&&null!==y.Ia&&null===y.Ja?y.Ja=
b-c-y.aa-y.Ia:null===y.aa?(y.Ia=y.Ja=0,y.aa=b-c):y.Ia=y.Ja=(b-c-y.aa)/2;return y}var e=a.style;a=a.d.d;var f=b.Pc,g=b.Tc;b=b.aa;var h=c["margin"+g.charAt(0).toUpperCase()+g.substring(1)],l=kl(a,e["margin-"+f],h),k=kl(a,e["margin-"+g],h),m=jl(a,e["padding-"+f],h),p=jl(a,e["padding-"+g],h),q=ll(a,e["border-"+f+"-width"],e["border-"+f+"-style"],h),v=ll(a,e["border-"+g+"-width"],e["border-"+g+"-style"],h),r=Y(a,e[b],h),y=null;e[b]=new K(new ic(a,function(){var a=d(this).aa;return null===a?0:a},b));e["margin-"+
f]=new K(new ic(a,function(){var a=d(this).Ia;return null===a?0:a},"margin-"+f));e["margin-"+g]=new K(new ic(a,function(){var a=d(this).Ja;return null===a?0:a},"margin-"+g));"left"===f?e.left=new K(D(a,c.marginLeft,c.Db)):"top"===f&&(e.top=new K(D(a,c.marginTop,c.Cb)))}n.Nc=function(){var a=this.e.j;this.j.ua?mo(this,{Pc:"right",Tc:"left",aa:"width"},a):this.j.va?mo(this,{Pc:"left",Tc:"right",aa:"width"},a):this.ja({start:"left",end:"right",aa:"width"},a)};
n.Oc=function(){var a=this.e.j;this.j.wa?mo(this,{Pc:"bottom",Tc:"top",aa:"height"},a):this.j.ta?mo(this,{Pc:"top",Tc:"bottom",aa:"height"},a):this.ja({start:"top",end:"bottom",aa:"height"},a)};n.kc=function(a,b,c,d,e,f,g){il.prototype.kc.call(this,a,b,c,d,e,f,g);a=c.u;c=this.d.k;d=this.j;d.ua||d.va?d.wa||d.ta||(d.ua?a.left[c]=b:d.va&&(a.right[c]=b)):d.wa?a.top[c]=b:d.ta&&(a.bottom[c]=b)};
function no(a,b,c,d,e){this.b=a;this.h=b;this.f=c;this.d=d;this.e=e;this.g={};a=this.h;b=new Rc(a,"page-number");b=new Jc(a,new Pc(a,b,new gc(a,2)),a.b);c=new zc(a,b);a.values["recto-page"]=c;a.values["verso-page"]=b;"ltr"===Fn(this.e)?(a.values["left-page"]=b,b=new zc(a,b),a.values["right-page"]=b):(c=new zc(a,b),a.values["left-page"]=c,a.values["right-page"]=b)}function oo(a){var b={};ik(a.b,[],"",b);a.b.pop();return b}
function po(a,b){var c=[],d;for(d in b)if(Object.prototype.hasOwnProperty.call(b,d)){var e=b[d],f;f=e instanceof T?e.value+"":po(a,e);c.push(d+f+(e.Ea||""))}return c.sort().join("^")}function qo(a){this.b=null;this.f=a}t(qo,U);qo.prototype.apply=function(a){a.N===this.f&&this.b.apply(a)};qo.prototype.d=function(){return 3};qo.prototype.e=function(a){this.b&&jj(a.Ub,this.f,this.b);return!0};function ro(a){this.b=null;this.f=a}t(ro,U);
ro.prototype.apply=function(a){1===(new Rc(this.f,"page-number")).evaluate(a.g)&&this.b.apply(a)};ro.prototype.d=function(){return 2};function so(a){this.b=null;this.f=a}t(so,U);so.prototype.apply=function(a){(new Rc(this.f,"left-page")).evaluate(a.g)&&this.b.apply(a)};so.prototype.d=function(){return 1};function to(a){this.b=null;this.f=a}t(to,U);to.prototype.apply=function(a){(new Rc(this.f,"right-page")).evaluate(a.g)&&this.b.apply(a)};to.prototype.d=function(){return 1};
function uo(a){this.b=null;this.f=a}t(uo,U);uo.prototype.apply=function(a){(new Rc(this.f,"recto-page")).evaluate(a.g)&&this.b.apply(a)};uo.prototype.d=function(){return 1};function vo(a){this.b=null;this.f=a}t(vo,U);vo.prototype.apply=function(a){(new Rc(this.f,"verso-page")).evaluate(a.g)&&this.b.apply(a)};vo.prototype.d=function(){return 1};function wo(a,b){hj.call(this,a,b,null,null)}t(wo,hj);
wo.prototype.apply=function(a){var b=a.g,c=a.w,d=this.style;a=this.O;aj(b,c,d,a,null,null);if(d=d._marginBoxes){var c=Zi(c,"_marginBoxes"),e;for(e in d)if(d.hasOwnProperty(e)){var f=c[e];f||(f={},c[e]=f);aj(b,f,d[e],a,null,null)}}};function xo(a,b,c,d,e){qk.call(this,a,b,null,c,null,d,!1);this.H=e;this.A=[];this.e="";this.u=[]}t(xo,qk);n=xo.prototype;n.Ib=function(){this.$a()};n.fb=function(a,b){if(this.e=b)this.b.push(new qo(b)),this.O+=65536};
n.Vb=function(a,b){b&&Ff(this,"E_INVALID_PAGE_SELECTOR :"+a+"("+b.join("")+")");this.u.push(":"+a);switch(a.toLowerCase()){case "first":this.b.push(new ro(this.d));this.O+=256;break;case "left":this.b.push(new so(this.d));this.O+=1;break;case "right":this.b.push(new to(this.d));this.O+=1;break;case "recto":this.b.push(new uo(this.d));this.O+=1;break;case "verso":this.b.push(new vo(this.d));this.O+=1;break;default:Ff(this,"E_INVALID_PAGE_SELECTOR :"+a)}};
function yo(a){var b;a.e||a.u.length?b=[a.e].concat(a.u.sort()):b=null;a.A.push({nd:b,O:a.O});a.e="";a.u=[]}n.Fb=function(){yo(this);qk.prototype.Fb.call(this)};n.ma=function(){yo(this);qk.prototype.ma.call(this)};
n.Za=function(a,b,c){if("bleed"!==a&&"marks"!==a||this.A.some(function(a){return null===a.nd})){qk.prototype.Za.call(this,a,b,c);var d=this.h[a],e=this.H;if("bleed"===a||"marks"===a)e[""]||(e[""]={}),Object.keys(e).forEach(function(b){Yi(e[b],a,d)});else if("size"===a){var f=e[""];this.A.forEach(function(b){var c=new T(d.value,d.Ea+b.O);b=b.nd?b.nd.join(""):"";var l=e[b];l?(c=(b=l[a])?Vi(null,c,b):c,Yi(l,a,c)):(l=e[b]={},Yi(l,a,c),f&&["bleed","marks"].forEach(function(a){f[a]&&Yi(l,a,f[a])},this))},
this)}}};n.yd=function(a){jj(this.g.Ub,"*",a)};n.Ad=function(a){return new wo(this.h,a)};n.Yc=function(a){var b=Zi(this.h,"_marginBoxes"),c=b[a];c||(c={},b[a]=c);Bf(this.Y,new zo(this.d,this.Y,this.k,c))};function zo(a,b,c,d){Cf.call(this,a,b,!1);this.e=c;this.b=d}t(zo,Df);zo.prototype.Ya=function(a,b,c){ch(this.e,a,b,c,this)};zo.prototype.Sb=function(a,b){Ef(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};zo.prototype.yc=function(a,b){Ef(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};
zo.prototype.Za=function(a,b,c){Yi(this.b,a,new T(b,c?yf(this):zf(this)))};function Ao(a){this.d=a;this.b={};this.b.page=[0]}function Bo(a,b){Object.keys(b.b).forEach(function(a){this.b[a]=Array.b(b.b[a])},a)}function Zj(a,b,c){return new ic(a.d,function(){var d=a.b[b];return c(d&&d.length?d[d.length-1]:null)},"page-counter-"+b)}function bk(a,b,c){return new ic(a.d,function(){return c(a.b[b]||[])},"page-counters-"+b)}
function Co(a,b,c){var d,e=b["counter-reset"];e&&(e=e.evaluate(c))&&(d=og(e,!0));if(d)for(var f in d){var e=a,g=f,h=d[f];e.b[g]?e.b[g].push(h):e.b[g]=[h]}var l;(b=b["counter-increment"])&&(c=b.evaluate(c))&&(l=og(c,!1));l?"page"in l||(l.page=1):l={page:1};for(var k in l)a.b[k]||(c=a,b=k,c.b[b]?c.b[b].push(0):c.b[b]=[0]),c=a.b[k],c[c.length-1]+=l[k]};var Do=new uf(function(){var a=L("uaStylesheetBase");sf(dh).then(function(b){var c=va("user-agent-base.css",ua);b=new qk(null,null,null,null,null,b,!0);b.Jb("UA");pk=b.g;dg(c,b,null,null).ra(a)});return N(a)},"uaStylesheetBaseFetcher");
function Eo(a,b,c,d,e,f,g,h,l,k){this.h=a;this.g=b;this.b=c;this.d=d;this.A=e;this.f=f;this.l=a.F;this.u=g;this.e=h;this.k=l;this.w=k;this.j=a.f;kc(this.b,function(a){return(a=this.b.b[a])?0<a.b.length&&a.b[0].b.b<=this.j:!1});jc(this.b,new ic(this.b,function(){return this.pa+this.b.d},"page-number"))}
function Fo(a,b,c,d){if(a.k.length){var e=new nc(0,b,c,d);a=a.k;for(var f={},g=0;g<a.length;g++)aj(e,f,a[g],0,null,null);g=f.width;a=f.height;var f=f["text-zoom"],h=1;if(g&&a||f){var l=lc.em;(f?f.evaluate(e,"text-zoom"):null)===Xd&&(h=l/d,d=l,b*=h,c*=h);if(g&&a&&(g=qd(g.evaluate(e,"width"),e),e=qd(a.evaluate(e,"height"),e),0<g&&0<e))return{width:g,height:e,fontSize:d}}}return{width:b,height:c,fontSize:d}}
function Go(a,b,c,d,e,f,g,h,l){nc.call(this,0,d.width,d.height,d.fontSize);this.style=a;this.ba=b;this.lang=b.lang||c;this.viewport=d;this.e={body:!0};this.g=e;this.b=this.w=this.d=this.l=null;this.j=0;this.La=f;this.f=new kh(this.style.l);this.oa={};this.H=null;this.k=new Ao(a.b);this.F={};this.ea=null;this.Fa=g;this.Ka=h;this.pa=l;for(var k in a.e)(b=a.e[k]["flow-consume"])&&(b.evaluate(this,"flow-consume")==sd?this.e[k]=!0:delete this.e[k]);this.N={}}t(Go,nc);
function Ho(a){var b=L("StyleInstance.init");a.d=new Jk(a.ba,a.style.d,a.style.g,a,a.e,a.style.j,a.k);Tk(a.d,a);a.w={};a.w[a.ba.url]=a.d;var c=Qk(a.d);a.ea=Fn(c);a.l=new Kl(a.style.A);var d=new fk(a.style.d,a,a.k);a.l.h(d,c);Jl(a.l,a);a.H=new no(d,a.style.b,a.l,a,c);c=[];for(d=0;d<a.style.f.length;d++){var e=a.style.f[d];if(!e.K||e.K.evaluate(a))e=hh(e.wb,a),e=new ih(e),c.push(e)}qh(a.La,c,a.f).ra(b);var f=a.style.w;Object.keys(f).forEach(function(a){var b=Mn(Ln(f[a]),this);this.N[a]={width:b.lb+
2*b.Hc,height:b.kb+2*b.Hc}},a);return N(b)}function Wk(a,b){var c=a.b;if(c){var d=c.b[b.f];d||(d=new mi,c.b[b.f]=d);d.b.push(new li(new ki({ka:[{ha:b.g,Na:0,da:null,xa:null,qa:null}],ca:0,L:!1}),b))}}
function Io(a,b){if(!b)return 0;var c=Number.POSITIVE_INFINITY,d;for(d in a.e){var e=b.b[d];if((!e||0==e.b.length)&&a.b){var f=a.d;f.l=d;for(e=0;null!=f.l&&(e+=5E3,Rk(f,e,0)!=Number.POSITIVE_INFINITY););e=a.b.b[d];b!=a.b&&e&&(e=e.clone(),b.b[d]=e)}if(e){for(var f=a,g=Number.POSITIVE_INFINITY,h=0;h<e.b.length;h++){for(var l=e.b[h].d.Ta,k=l.ka[0].ha,m=l.ca,p=l.L,q=0;k.ownerDocument!=f.ba.b;)q++,k=l.ka[q].ha,p=!1,m=0;l=vh(f.ba,k,m,p);l<g&&(g=l)}f=g;f<c&&(c=f)}}return c}
function Jo(a,b){var c=Io(a,a.b);if(c==Number.POSITIVE_INFINITY)return null;for(var d=a.l.children,e,f=0;f<d.length;f++)if(e=d[f],"vivliostyle-page-rule-master"!==e.d.nb){var g=1,h=vl(e,a,"utilization");h&&h.kd()&&(g=h.B);var h=pc(a,"em",!1),l=a.lb()*a.kb();a.j=Rk(a.d,c,Math.ceil(g*l/(h*h)));g=a;h=g.b.d;l=void 0;for(l in g.b.b)for(var k=g.b.b[l],m=k.b.length-1;0<=m;m--){var p=k.b[m];0>p.b.e&&p.b.b<g.j&&(p.b.e=h)}oc(a,a.style.b);g=vl(e,a,"enabled");if(!g||g===fe){d=a;u.debug("Location - page",d.b.d);
u.debug("  current:",c);u.debug("  lookup:",d.j);c=void 0;for(c in d.b.b)for(f=d.b.b[c],g=0;g<f.b.length;g++)u.debug("  Chunk",c+":",f.b[g].b.b);c=a.H;f=b;g=e.d;if(0===Object.keys(f).length)g.d.e=g;else{e=g;d=po(c,f);e=e.g+"^"+d;d=c.g[e];if(!d){if("background-host"===g.nb)d=c,f=(new Xn(d.h,d.f.d,f)).f(d.f),f.h(d.b,d.e),Jl(f,d.d),d=f;else{d=c;h=f;f=g.clone({nb:"vivliostyle-page-rule-master"});if(g=h.size)h=Ln(h),g=g.Ea,f.b.width=Vi(d.d,f.b.width,new T(h.width,g)),f.b.height=Vi(d.d,f.b.height,new T(h.height,
g));f=f.f(d.f);f.h(d.b,d.e);Jl(f,d.d);d=f}c.g[e]=d}e=d.d;e.d.e=e;e=d}return e}}throw Error("No enabled page masters");}
function Ko(a,b,c){var d=a.b.b[c];if(!d)return M(!0);Zm(b);a.e[c]&&0<b.Qa.length&&(b.sd=!1);var e=L("layoutColumn"),f=[],g=[];lf(function(c){for(;0<d.b.length-g.length;){for(var e=0;0<=g.indexOf(e);)e++;var k=d.b[e];if(k.b.b>a.j)break;for(var m=1;m<d.b.length;m++)if(!(0<=g.indexOf(m))){var p=d.b[m];if(p.b.b>a.j)break;$h(p.b,k.b)&&(k=p,e=m)}var q=k.b,v=!0;bn(b,k.d).then(function(a){k.b.Td&&(null===a||q.d)&&f.push(e);q.d?(g.push(e),P(c)):a?(k.d=a,P(c)):(g.push(e),v?v=!1:nf(c))});if(v){v=!1;return}}P(c)}).then(function(){d.b=
d.b.filter(function(a,b){return 0<=f.indexOf(b)||0>g.indexOf(b)});O(e,!0)});return N(e)}
function Lo(a,b,c,d,e,f,g,h){ol(c);var l=vl(c,a,"enabled");if(l&&l!==fe)return M(!0);var k=L("layoutContainer"),m=vl(c,a,"wrap-flow")===ud,p=c.b?c.g&&c.F:c.f&&c.H,l=vl(c,a,"flow-from"),q=a.viewport.b.createElement("div"),v=vl(c,a,"position");w(q,"position",v?v.name:"absolute");d.insertBefore(q,d.firstChild);var r=new oi(q);r.b=c.b;c.mb(a,r,b,a.f);r.D=e;r.F=f;e+=r.left+r.marginLeft+r.$;f+=r.top+r.marginTop+r.ea;if(l&&l.zd())if(a.F[l.toString()])c.kc(a,r,b,null,1,a.g,a.f),l=M(!0);else{var y=L("layoutContainer.inner"),
J=l.toString(),W=Z(c,a,"column-count"),pa=Z(c,a,"column-gap"),X=1<W?Z(c,a,"column-width"):r.width,l=ul(c,a),F=0,v=vl(c,a,"shape-inside"),ra=mg(v,0,0,r.width,r.height,a),Fa=new $l(J,a,a.viewport,a.d,l,a.ba,a.f,a.style.u,a,b,a.Fa,a.Ka,h),Bh=0,aa=null;lf(function(b){for(;Bh<W;){var c=Bh++;if(1<W){var d=a.viewport.b.createElement("div");w(d,"position","absolute");q.appendChild(d);aa=new Gm(d,Fa,a.g);aa.b=r.b;aa.Ka=r.Ka;aa.tb=r.tb;r.b?(w(d,"margin-left",r.j+"px"),w(d,"margin-right",r.H+"px"),c=c*(X+pa)+
r.k,vi(aa,0,r.width),ui(aa,c,X)):(w(d,"margin-top",r.k+"px"),w(d,"margin-bottom",r.w+"px"),c=c*(X+pa)+r.j,ui(aa,0,r.height),vi(aa,c,X));aa.D=e+r.j;aa.F=f+r.k}else aa=new Gm(q,Fa,a.g),ti(aa,r),r=aa;aa.N=p?[]:g;aa.rb=ra;if(0<=aa.width){var k=L("inner");Ko(a,aa,J).then(function(){aa.u&&"column"!=aa.u&&(Bh=W,"region"!=aa.u&&(a.F[J]=!0));O(k,!0)});c=N(k)}else c=M(!0);if(c.Aa()){c.then(function(){0<h.b.length?P(b):(F=Math.max(F,aa.e),nf(b))});return}0<h.b.length||(F=Math.max(F,aa.e))}P(b)}).then(function(){r.e=
F;c.kc(a,r,b,aa,W,a.g,a.f);O(y,!0)});l=N(y)}else{l=vl(c,a,"content");v=!1;if(l&&xi(l)){var Uk=a.viewport.b.createElement("span");l.T(new wi(Uk,a));q.appendChild(Uk);Il(c,a,r,a.f)}else c.sa&&(d.removeChild(q),v=!0);v||c.kc(a,r,b,null,1,a.g,a.f);l=M(!0)}l.then(function(){if(!c.f||0<Math.floor(r.e)){if(!m){var l=r.D+r.left,p=r.F+r.top,v=ri(r)+r.width+si(r),y=pi(r)+r.height+qi(r),F=vl(c,a,"shape-outside"),l=mg(F,l,p,v,y,a);$a(a.viewport.root)&&g.push(ue(l,0,-1.25*pc(a,"em",!1)));g.push(l)}}else if(0==
c.children.length){d.removeChild(q);O(k,!0);return}var J=c.children.length-1;kf(function(){for(;0<=J;){var d=c.children[J--],d=Lo(a,b,d,q,e,f,g,h);if(d.Aa())return d}return M(!1)}).then(function(){O(k,!0)})});return N(k)}
function Mo(a,b,c){a.F={};c?(a.b=c.clone(),Mk(a.d,c.e)):(a.b=new ni,Mk(a.d,-1));a.lang&&b.b.setAttribute("lang",a.lang);c=a.b;c.d++;oc(a,a.style.b);var d=oo(a.H),e=Jo(a,d);if(!e)return M(null);e.d.b.width.value===he&&Vh(b);e.d.b.height.value===ie&&Wh(b);Co(a.k,d,a);var f=Mn(Ln(d),a);No(a,f,b);Tn(d,f,b,a);var d=vl(e,a,"writing-mode")||Hd,f=vl(e,a,"direction")||Pd,g=new Ai(b.A.bind(b),d,f),h=c.clone(),l=[],k=L("layoutNextPage");lf(function(d){Lo(a,b,e,b.b,0,0,l.concat(),g).then(function(){if(0<g.b.length){l=
l.concat(Fi(g));g.b.splice(0,g.b.length);c=a.b=h.clone();for(var e;e=b.b.lastChild;)b.b.removeChild(e);nf(d)}else P(d)})}).then(function(){e.$(a,b,a.g);var d=new Rc(e.d.d,"left-page");b.g=d.evaluate(a)?"left":"right";var d=a.b.d,f;for(f in a.b.b)for(var g=a.b.b[f],h=g.b.length-1;0<=h;h--){var l=g.b[h];0<=l.b.e&&l.b.e+l.b.j-1<=d&&g.b.splice(h,1)}a.b=null;c.e=a.d.b;f=a.style.h.D[a.ba.url];d=b.M.getBoundingClientRect();b.d.width=d.width;b.d.height=d.height;g=b.h;for(d=0;d<g.length;d++)h=g[d],w(h.target,
h.name,h.value.toString());for(d=0;d<f.length;d++)if(g=f[d],l=b.j[g.Xb],h=b.j[g.Qd],l&&h&&(l=Th(l,g.action)))for(var y=0;y<h.length;y++)h[y].addEventListener(g.event,l,!1);var J;a:{for(J in a.e)if((f=c.b[J])&&0<f.b.length){J=!1;break a}J=!0}J&&(c=null);O(k,c)});return N(k)}
function No(a,b,c){a.D=b.lb;a.A=b.kb;c.M.style.width=b.lb+2*b.Hc+"px";c.M.style.height=b.kb+2*b.Hc+"px";c.b.style.left=b.ub+"px";c.b.style.right=b.ub+"px";c.b.style.top=b.ub+"px";c.b.style.bottom=b.ub+"px";c.b.style.padding=b.Bb+"px"}function Oo(a,b,c,d){qk.call(this,a.g,a,b,c,d,a.f,!c);this.e=a;this.u=!1}t(Oo,qk);n=Oo.prototype;n.uc=function(){};n.tc=function(a,b,c){a=new dl(this.e.j,a,b,c,this.e.w,this.K,zf(this.Y));Bf(this.e,new Pl(a.d,this.e,a,this.k))};
n.xb=function(a){a=a.d;null!=this.K&&(a=Xc(this.d,this.K,a));Bf(this.e,new Oo(this.e,a,this,this.w))};n.qc=function(){Bf(this.e,new wk(this.d,this.Y))};n.sc=function(){var a={};this.e.k.push({wb:a,K:this.K});Bf(this.e,new xk(this.d,this.Y,null,a,this.e.f))};n.rc=function(a){var b=this.e.h[a];b||(b={},this.e.h[a]=b);Bf(this.e,new xk(this.d,this.Y,null,b,this.e.f))};n.wc=function(){var a={};this.e.A.push(a);Bf(this.e,new xk(this.d,this.Y,this.K,a,this.e.f))};
n.Yb=function(a){var b=this.e.l;if(a){var c=Zi(b,"_pseudos"),b=c[a];b||(b={},c[a]=b)}Bf(this.e,new xk(this.d,this.Y,null,b,this.e.f))};n.vc=function(){this.u=!0;this.$a()};n.Ib=function(){var a=new xo(this.e.j,this.e,this,this.k,this.e.u);Bf(this.e,a);a.Ib()};n.ma=function(){qk.prototype.ma.call(this);if(this.u){this.u=!1;var a="R"+this.e.F++,b=H(a),c;this.K?c=new Ui(b,0,this.K):c=new T(b,0);$i(this.h,"region-id").push(c);this.ib();a=new Oo(this.e,this.K,this,a);Bf(this.e,a);a.ma()}};
function Po(a){var b=a.getAttribute("content");if(!b)return"";a={};for(var c;null!=(c=b.match(/^,?\s*([-A-Za-z_.][-A-Za-z_0-9.]*)\s*=\s*([-+A-Za-z_0-9.]*)\s*/));)b=b.substr(c[0].length),a[c[1]]=c[2];b=a.width-0;a=a.height-0;return b&&a?"@-epubx-viewport{width:"+b+"px;height:"+a+"px;}":""}function Qo(a){Af.call(this);this.f=a;this.g=new fc(null);this.j=new fc(this.g);this.w=new al(this.g);this.D=new Oo(this,null,null,null);this.F=0;this.k=[];this.l={};this.h={};this.A=[];this.u={};this.b=this.D}
t(Qo,Af);Qo.prototype.error=function(a){u.b("CSS parser:",a)};function Ro(a,b){return So(b,a)}function To(a){rf.call(this,Ro,"document");this.F=a;this.A={};this.h={};this.b={};this.D={};this.f=null;this.j=[]}t(To,rf);function Uo(a){var b=va("user-agent.xml",ua),c=L("OPSDocStore.init");sf(dh).then(function(d){a.f=d;sf(Do).then(function(){a.load(b).then(function(){O(c,!0)})})});return N(c)}function Vo(a,b){a.j.push({url:b.url,text:b.text,Xa:"User",za:null,media:null})}
function So(a,b){var c=L("OPSDocStore.load"),d=b.url;Eh(b,a).then(function(b){if(b){for(var f=[],g=b.b.getElementsByTagNameNS("http://www.idpf.org/2007/ops","trigger"),h=0;h<g.length;h++){var l=g[h],k=l.getAttributeNS("http://www.w3.org/2001/xml-events","observer"),m=l.getAttributeNS("http://www.w3.org/2001/xml-events","event"),p=l.getAttribute("action"),l=l.getAttribute("ref");k&&m&&p&&l&&f.push({Qd:k,event:m,action:p,Xb:l})}a.D[d]=f;var q=[],f=va("user-agent-page.css",ua);q.push({url:f,text:null,
Xa:"UA",za:null,media:null});for(h=0;h<a.j.length;h++)q.push(a.j[h]);if(f=b.h)for(f=f.firstChild;f;f=f.nextSibling)if(1==f.nodeType)if(g=f,h=g.namespaceURI,k=g.localName,"http://www.w3.org/1999/xhtml"==h)if("style"==k)q.push({url:d,text:g.textContent,Xa:"Author",za:null,media:null});else if("link"==k){if(m=g.getAttribute("rel"),h=g.getAttribute("class"),k=g.getAttribute("media"),"stylesheet"==m||"alternate stylesheet"==m&&h)g=g.getAttribute("href"),g=va(g,d),q.push({url:g,text:null,za:h,media:k,Xa:"Author"})}else"meta"==
k&&"viewport"==g.getAttribute("name")&&q.push({url:d,text:Po(g),Xa:"Author",K:null,media:null});else"http://www.gribuser.ru/xml/fictionbook/2.0"==h?"stylesheet"==k&&"text/css"==g.getAttribute("type")&&q.push({url:d,text:g.textContent,Xa:"Author",za:null,media:null}):"http://example.com/sse"==h&&"property"===k&&(h=g.getElementsByTagName("name")[0])&&"stylesheet"===h.textContent&&(g=g.getElementsByTagName("value")[0])&&(g=va(g.textContent,d),q.push({url:g,text:null,za:null,media:null,Xa:"Author"}));
for(var v="",h=0;h<q.length;h++)v+=q[h].url,v+="^",q[h].text&&(v+=q[h].text),v+="^";var r=a.A[v];r?(a.b[d]=r,O(c,b)):(f=a.h[v],f||(f=new uf(function(){var b=L("fetchStylesheet"),c=0,d=new Qo(a.f);kf(function(){if(c<q.length){var a=q[c++];d.Jb(a.Xa);return null!==a.text?eg(a.text,d,a.url,a.za,a.media).Zc(!0):dg(a.url,d,a.za,a.media)}return M(!1)}).then(function(){r=new Eo(a,d.g,d.j,d.D.g,d.w,d.k,d.l,d.h,d.A,d.u);a.A[v]=r;delete a.h[v];O(b,r)});return N(b)},"FetchStylesheet "+d),a.h[v]=f,f.start()),
sf(f).then(function(f){a.b[d]=f;O(c,b)}))}else O(c,null)});return N(c)};function Wo(a,b,c,d,e,f,g,h){this.d=a;this.url=b;this.lang=c;this.e=d;this.g=e;this.S=Xb(f);this.h=g;this.f=h;this.Da=this.b=null}function Xo(a,b,c){if(0!=c--)for(b=b.firstChild;b;b=b.nextSibling)if(1==b.nodeType){var d=b;"auto"!=Ha(d,"height","auto")&&(w(d,"height","auto"),Xo(a,d,c));"absolute"==Ha(d,"position","static")&&(w(d,"position","relative"),Xo(a,d,c))}}
function Yo(a){var b=a.target,c="\u25b8"==b.textContent;b.textContent=c?"\u25be":"\u25b8";for(b=b.parentNode.firstChild;b;)if(1!=b.nodeType)b=b.nextSibling;else{var d=b;"toc-container"==d.getAttribute("data-adapt-class")?b=d.firstChild:("toc-node"==d.getAttribute("data-adapt-class")&&(d.style.height=c?"auto":"0px"),b=b.nextSibling)}a.stopPropagation()}
Wo.prototype.Rc=function(a){var b=this.h.Rc(a);return function(a,d,e){var f=e.behavior;if(!f||"toc-node"!=f.toString()&&"toc-container"!=f.toString())return b(a,d,e);a=d.getAttribute("data-adapt-class");"toc-node"==a&&(e=d.firstChild,"\u25b8"!=e.textContent&&(e.textContent="\u25b8",w(e,"cursor","pointer"),e.addEventListener("click",Yo,!1)));var g=d.ownerDocument.createElement("div");g.setAttribute("data-adapt-process-children","true");"toc-node"==f.toString()?(e=d.ownerDocument.createElement("div"),
e.textContent="\u25b9",w(e,"margin-left","-1em"),w(e,"display","inline-block"),w(e,"width","1em"),w(e,"text-align","left"),w(e,"cursor","default"),w(e,"font-family","Menlo,sans-serif"),g.appendChild(e),w(g,"overflow","hidden"),g.setAttribute("data-adapt-class","toc-node"),"toc-node"!=a&&"toc-container"!=a||w(g,"height","0px")):"toc-node"==a&&g.setAttribute("data-adapt-class","toc-container");return M(g)}};
Wo.prototype.oc=function(a,b,c,d,e){if(this.b)return M(this.b);var f=this,g=L("showTOC"),h=new Uh(a,a);this.b=h;this.d.load(this.url).then(function(d){var k=f.d.b[d.url],m=Fo(k,c,1E5,e);b=new vm(b.f,m.fontSize,b.root,m.width,m.height);var p=new Go(k,d,f.lang,b,f.e,f.g,f.Rc(d),f.f,0);f.Da=p;p.S=f.S;Ho(p).then(function(){Mo(p,h,null).then(function(){Xo(f,a,2);O(g,h)})})});return N(g)};
Wo.prototype.lc=function(){if(this.b){var a=this.b;this.Da=this.b=null;w(a.M,"visibility","none");var b=a.M.parentNode;b&&b.removeChild(a.M)}};Wo.prototype.ld=function(){return!!this.b};function Zo(){To.call(this,$o(this));this.d=new rf(Eh,"document");this.u=new rf(vf,"text");this.w={};this.N={};this.k={};this.l={}}t(Zo,To);function $o(a){return function(b){return a.k[b]}}
function ap(a,b,c){var d=L("loadEPUBDoc");"/"!==b.substring(b.length-1)&&(b+="/");c&&a.u.jc(b+"?r=list");a.d.jc(b+"META-INF/encryption.xml");var e=b+"META-INF/container.xml";a.d.load(e,!0,"Failed to fetch EPUB container.xml from "+e).then(function(f){if(f){f=Oh(sh(sh(sh(new th([f.b]),"container"),"rootfiles"),"rootfile"),"full-path");for(var g=0;g<f.length;g++){var h=f[g];if(h){bp(a,b,h,c).ra(d);return}}O(d,null)}else u.error("Received an empty response for EPUB container.xml "+e+". This may be caused by the server not allowing cross origin requests.")});
return N(d)}function bp(a,b,c,d){var e=b+c,f=a.w[e];if(f)return M(f);var g=L("loadOPF");a.d.load(e,void 0,void 0).then(function(c){c?a.d.load(b+"META-INF/encryption.xml",void 0,void 0).then(function(l){(d?a.u.load(b+"?r=list"):M(null)).then(function(d){f=new cp(a,b);dp(f,c,l,d,b+"?r=manifest").then(function(){a.w[e]=f;a.N[b]=f;O(g,f)})})}):u.error("Received an empty response for EPUB OPF "+e+". This may be caused by the server not allowing cross origin requests.")});return N(g)}
function ep(a,b,c){var d=L("EPUBDocStore.load");b=ta(b);(a.l[b]=So(a,{status:200,url:b,contentType:c.contentType,responseText:null,responseXML:c,nc:null})).ra(d);return N(d)}
Zo.prototype.load=function(a){var b=ta(a);if(a=this.l[b])return a.Aa()?a:M(a.gc());var c=L("EPUBDocStore.load");a=Zo.Ed.load.call(this,b,!0,"Failed to fetch a source document from "+b);a.then(function(a){a?O(c,a):u.error("Received an empty response for "+b+". This may be caused by the server not allowing cross origin requests.")});return N(c)};function fp(){this.id=null;this.src="";this.f=this.d=null;this.G=-1;this.h=0;this.j=null;this.b=this.e=0;this.g=Ta}function gp(a){return a.id}
function hp(a){var b=Ne(a);return function(a){var d=L("deobfuscator"),e,f;a.slice?(e=a.slice(0,1040),f=a.slice(1040,a.size)):(e=a.webkitSlice(0,1040),f=a.webkitSlice(1040,a.size-1040));qf(e).then(function(a){a=new DataView(a);for(var c=0;c<a.byteLength;c++){var e=a.getUint8(c),e=e^b[c%20];a.setUint8(c,e)}O(d,pf([a,f]))});return N(d)}}
var ip={dcterms:"http://purl.org/dc/terms/",marc:"http://id.loc.gov/vocabulary/",media:"http://www.idpf.org/epub/vocab/overlays/#",onix:"http://www.editeur.org/ONIX/book/codelists/current.html#",xsd:"http://www.w3.org/2001/XMLSchema#"},jp=ip.dcterms+"language",kp=ip.dcterms+"title";
function lp(a,b){var c={};return function(d,e){var f,g,h=d.r||c,l=e.r||c;if(a==kp&&(f="main"==h["http://idpf.org/epub/vocab/package/#title-type"],g="main"==l["http://idpf.org/epub/vocab/package/#title-type"],f!=g))return f?-1:1;f=parseInt(h["http://idpf.org/epub/vocab/package/#display-seq"],10);isNaN(f)&&(f=Number.MAX_VALUE);g=parseInt(l["http://idpf.org/epub/vocab/package/#display-seq"],10);isNaN(g)&&(g=Number.MAX_VALUE);return f!=g?f-g:a!=jp&&b&&(f=(h[jp]||h["http://idpf.org/epub/vocab/package/#alternate-script"])==
b,g=(l[jp]||l["http://idpf.org/epub/vocab/package/#alternate-script"])==b,f!=g)?f?-1:1:d.o-e.o}}
function mp(a,b){function c(a){for(var b in a){var d=a[b];d.sort(lp(b,k));for(var e=0;e<d.length;e++){var f=d[e].r;f&&c(f)}}}function d(a){return Wa(a,function(a){return Va(a,function(a){var b={v:a.value,o:a.P};a.qe&&(b.s=a.scheme);if(a.id||a.lang){var c=l[a.id];if(c||a.lang)a.lang&&(a={name:jp,value:a.lang,lang:null,id:null,Wc:a.id,scheme:null,P:a.P},c?c.push(a):c=[a]),c=Ua(c,function(a){return a.name}),b.r=d(c)}return b})})}function e(a){if(a&&(a=a.match(/^\s*(([^:]*):)?(\S+)\s*$/))){var b=a[1]?
f[a[1]]:"http://idpf.org/epub/vocab/package/#";if(b)return b+a[3]}return null}var f;if(b){f={};for(var g in ip)f[g]=ip[g];for(;null!=(g=b.match(/(^\s*[A-Z_a-z\u007F-\uFFFF][-.A-Z_a-z0-9\u007F-\uFFFF]*):\s*(\S+)/));)b=b.substr(g[0].length),f[g[1]]=g[2]}else f=ip;var h=1;g=Mh(Nh(a),function(a){if("meta"==a.localName){var b=e(a.getAttribute("property"));if(b)return{name:b,value:a.textContent,id:a.getAttribute("id"),P:h++,Wc:a.getAttribute("refines"),lang:null,scheme:e(a.getAttribute("scheme"))}}else if("http://purl.org/dc/elements/1.1/"==
a.namespaceURI)return{name:ip.dcterms+a.localName,P:h++,lang:a.getAttribute("xml:lang"),value:a.textContent,id:a.getAttribute("id"),Wc:null,scheme:null};return null});var l=Ua(g,function(a){return a.Wc});g=d(Ua(g,function(a){return a.Wc?null:a.name}));var k=null;g[jp]&&(k=g[jp][0].v);c(g);return g}function np(){var a=window.MathJax;return a?a.Hub:null}var op={"appliaction/xhtml+xml":!0,"image/jpeg":!0,"image/png":!0,"image/svg+xml":!0,"image/gif":!0,"audio/mp3":!0};
function cp(a,b){this.e=a;this.h=this.d=this.b=this.g=this.f=null;this.k=b;this.j=null;this.F={};this.lang=null;this.u=0;this.l={};this.H=this.D=this.N=null;this.w={};this.A=null;np()&&(Ki["http://www.w3.org/1998/Math/MathML"]=!0)}function pp(a,b){return a.k?b.substr(0,a.k.length)==a.k?decodeURI(b.substr(a.k.length)):null:b}
function dp(a,b,c,d,e){a.f=b;var f=sh(new th([b.b]),"package"),g=Oh(f,"unique-identifier")[0];g&&(g=zh(b,b.url+"#"+g))&&(a.j=g.textContent.replace(/[ \n\r\t]/g,""));var h={};a.g=Va(Kh(sh(sh(f,"manifest"),"item")),function(c){var d=new fp,e=b.url;d.id=c.getAttribute("id");d.src=va(c.getAttribute("href"),e);d.d=c.getAttribute("media-type");if(e=c.getAttribute("properties")){for(var e=e.split(/\s+/),f={},g=0;g<e.length;g++)f[e[g]]=!0;d.g=f}(c=c.getAttribute("fallback"))&&!op[d.d]&&(h[d.src]=c);!a.D&&
d.g.nav&&(a.D=d);!a.H&&d.g["cover-image"]&&(a.H=d);return d});a.d=Sa(a.g,gp);a.h=Sa(a.g,function(b){return pp(a,b.src)});for(var l in h)for(g=l;;){g=a.d[h[g]];if(!g)break;if(op[g.d]){a.w[l]=g.src;break}g=g.src}a.b=Va(Kh(sh(sh(f,"spine"),"itemref")),function(b,c){var d=b.getAttribute("idref");if(d=a.d[d])d.f=b,d.G=c;return d});if(l=Oh(sh(f,"spine"),"toc")[0])a.N=a.d[l];if(l=Oh(sh(f,"spine"),"page-progression-direction")[0]){a:switch(l){case "ltr":l="ltr";break a;case "rtl":l="rtl";break a;default:throw Error("unknown PageProgression: "+
l);}a.A=l}var g=c?Oh(sh(sh(Jh(sh(sh(new th([c.b]),"encryption"),"EncryptedData"),Ih()),"CipherData"),"CipherReference"),"URI"):[],k=Kh(sh(sh(f,"bindings"),"mediaType"));for(c=0;c<k.length;c++){var m=k[c].getAttribute("handler");(l=k[c].getAttribute("media-type"))&&m&&a.d[m]&&(a.F[l]=a.d[m].src)}a.l=mp(sh(f,"metadata"),Oh(f,"prefix")[0]);a.l[jp]&&(a.lang=a.l[jp][0].v);if(!d){if(0<g.length&&a.j)for(d=hp(a.j),c=0;c<g.length;c++)a.e.k[a.k+g[c]]=d;return M(!0)}f=new Ia;k={};if(0<g.length&&a.j)for(l="1040:"+
Oe(a.j),c=0;c<g.length;c++)k[g[c]]=l;for(c=0;c<d.length;c++){var p=d[c];if(m=p.n){var q=decodeURI(m),g=a.h[q];l=null;g&&(g.j=0!=p.m,g.h=p.c,g.d&&(l=g.d.replace(/\s+/g,"")));g=k[q];if(l||g)f.append(m),f.append(" "),f.append(l||"application/octet-stream"),g&&(f.append(" "),f.append(g)),f.append("\n")}}qp(a);return of(e,"","POST",f.toString(),"text/plain")}function qp(a){for(var b=0,c=0;c<a.b.length;c++){var d=a.b[c],e=Math.ceil(d.h/1024);d.e=b;d.b=e;b+=e}a.u=b}
function rp(a,b,c){a.d={};a.h={};a.g=[];a.b=a.g;var d=a.f=new rh(null,"",(new DOMParser).parseFromString("<spine></spine>","text/xml"));b.forEach(function(a,b){var c=new fp;c.G=b;c.id="item"+(b+1);c.src=a;var h=d.b.createElement("itemref");h.setAttribute("idref",c.id);d.root.appendChild(h);c.f=h;this.d[c.id]=c;this.h[a]=c;this.g.push(c)},a);return c?ep(a.e,b[0],c):M(null)}
function sp(a,b,c){var d=a.b[b],e=L("getCFI");a.e.load(d.src).then(function(a){var b=xh(a,c),h=null;b&&(a=vh(a,b,0,!1),h=new jb,mb(h,b,c-a),d.f&&mb(h,d.f,0),h=h.toString());O(e,h)});return N(e)}
function tp(a,b){return Ue("resolveFragment",function(c){if(b){var d=new jb;kb(d,b);var e;if(a.f){var f=lb(d,a.f.b);if(1!=f.ha.nodeType||f.L||!f.Xb){O(c,null);return}var g=f.ha,h=g.getAttribute("idref");if("itemref"!=g.localName||!h||!a.d[h]){O(c,null);return}e=a.d[h];d=f.Xb}else e=a.b[0];a.e.load(e.src).then(function(a){var b=lb(d,a.b);a=vh(a,b.ha,b.offset,b.L);O(c,{G:e.G,na:a,R:-1})})}else O(c,null)},function(a,d){u.b(d,"Cannot resolve fragment:",b);O(a,null)})}
function up(a,b){return Ue("resolveEPage",function(c){if(0>=b)O(c,{G:0,na:0,R:-1});else{var d=Qa(a.b.length,function(c){c=a.b[c];return c.e+c.b>b}),e=a.b[d];a.e.load(e.src).then(function(a){b-=e.e;b>e.b&&(b=e.b);var g=0;0<b&&(a=wh(a),g=Math.round(a*b/e.b),g==a&&g--);O(c,{G:d,na:g,R:-1})})}},function(a,d){u.b(d,"Cannot resolve epage:",b);O(a,null)})}
function vp(a,b){var c=a.b[b.G];if(0>=b.na)return M(c.e);var d=L("getEPage");a.e.load(c.src).then(function(a){a=wh(a);var f=Math.min(a,b.na);O(d,c.e+f*c.b/a)});return N(d)}function wp(a,b,c,d,e){this.b=a;this.viewport=b;this.f=c;this.g=e;this.Hb=[];this.na=this.R=this.G=0;this.S=Xb(d);this.e=new tm(b.f)}function xp(a){var b=a.Hb[a.G];return b?b.eb[a.R]:null}n=wp.prototype;n.jb=function(){if(this.b.A)return this.b.A;var a=this.Hb[this.G];return a?a.Da.ea:null};
function yp(a){var b=L("renderPage");zp(a).then(function(c){if(c){var d=-1;if(0>a.R){var d=a.na,e=Qa(c.Ha.length,function(a){return Io(c.Da,c.Ha[a])>d});a.R=e==c.Ha.length?Number.POSITIVE_INFINITY:e-1}var f=c.eb[a.R];f?(a.na=f.offset,O(b,f)):lf(function(b){if(a.R<c.Ha.length)P(b);else if(c.complete)a.R=c.Ha.length-1,P(b);else{var e=c.Ha[c.Ha.length-1],l=Ap(a,c,e);Mo(c.Da,l,e).then(function(k){l.M.style.display="none";l.M.style.visibility="visible";l.M.setAttribute("data-vivliostyle-page-side",l.g);
k=(e=k)?e.d-1:c.Ha.length-1;a.g(c.Da.N,c.item.G,k);e?(c.eb[k]=l,c.Ha.push(e),0<=d&&Io(c.Da,e)>d?(f=l,a.R=c.Ha.length-2,P(b)):(l.k=0==c.item.G&&0==k,nf(b))):(c.eb.push(l),f=l,a.R=k,0>d&&(a.na=l.offset),c.complete=!0,l.k=0==c.item.G&&0==k,l.l=c.item.G==a.b.b.length-1,P(b))})}}).then(function(){f=f||c.eb[a.R];var e=c.Ha[a.R];0>d&&(a.na=Io(c.Da,e));if(f)O(b,f);else{var h=Ap(a,c,e);Mo(c.Da,h,e).then(function(d){h.M.style.display="none";h.M.style.visibility="visible";h.M.setAttribute("data-vivliostyle-page-side",
h.g);d=(e=d)?e.d-1:c.Ha.length-1;a.g(c.Da.N,c.item.G,d);e?(c.eb[d]=h,c.Ha[a.R+1]=e):(c.eb.push(h),c.complete=!0,h.l=c.item.G==a.b.b.length-1);h.k=0==c.item.G&&0==d;O(b,h)})}})}else O(b,null)});return N(b)}n.Xc=function(){return Bp(this,this.b.b.length-1,Number.POSITIVE_INFINITY)};function Bp(a,b,c){var d=L("renderAllPages"),e=a.G,f=a.R;a.G=0;lf(function(d){a.R=a.G==b?c:Number.POSITIVE_INFINITY;yp(a).then(function(){++a.G>b?P(d):nf(d)})}).then(function(){a.G=e;a.R=f;yp(a).ra(d)});return N(d)}
n.Jd=function(){this.R=this.G=0;return yp(this)};n.Kd=function(){this.G=this.b.b.length-1;this.R=Number.POSITIVE_INFINITY;return yp(this)};n.nextPage=function(){var a=this,b=L("nextPage");zp(a).then(function(c){if(c){if(c.complete&&a.R==c.Ha.length-1){if(a.G>=a.b.b.length-1){O(b,null);return}a.G++;a.R=0}else a.R++;yp(a).ra(b)}else O(b,null)});return N(b)};n.Vc=function(){if(0==this.R){if(0==this.G)return M(null);this.G--;this.R=Number.POSITIVE_INFINITY}else this.R--;return yp(this)};
function Cp(a,b){var c="left"===b.g,d="ltr"===a.jb();return!c&&d||c&&!d}function Dp(a){var b=L("getCurrentSpread"),c=xp(a);if(!c)return M({left:null,right:null});var d=a.G,e=a.R,f="left"===c.g;(Cp(a,c)?a.Vc():a.nextPage()).then(function(g){a.G=d;a.R=e;yp(a).then(function(){f?O(b,{left:c,right:g}):O(b,{left:g,right:c})})});return N(b)}n.Pd=function(){var a=xp(this);if(!a)return M(null);var a=Cp(this,a),b=this.nextPage();if(a)return b;var c=this;return b.xc(function(){return c.nextPage()})};
n.Sd=function(){var a=xp(this);if(!a)return M(null);var a=Cp(this,a),b=this.Vc();if(a){var c=this;return b.xc(function(){return c.Vc()})}return b};function Ep(a,b){var c=L("navigateToEPage");up(a.b,b).then(function(b){b&&(a.G=b.G,a.R=b.R,a.na=b.na);yp(a).ra(c)});return N(c)}function Fp(a,b){var c=L("navigateToCFI");tp(a.b,b).then(function(b){b&&(a.G=b.G,a.R=b.R,a.na=b.na);yp(a).ra(c)});return N(c)}
function Gp(a,b){u.debug("Navigate to",b);var c=pp(a.b,ta(b));if(null==c&&(a.b.f&&b.match(/^#epubcfi\(/)&&(c=pp(a.b,a.b.f.url)),null==c))return M(null);var d=a.b.h[c];if(!d)return a.b.f&&c==pp(a.b,a.b.f.url)&&(c=b.indexOf("#"),0<=c)?Fp(a,b.substr(c+1)):M(null);d.G!=a.G&&(a.G=d.G,a.R=0);var e=L("navigateTo");zp(a).then(function(c){var d=zh(c.ba,b);d&&(a.na=uh(c.ba,d),a.R=-1);yp(a).ra(e)});return N(e)}
function Ap(a,b,c){var d=b.Da.viewport,e=d.b.createElement("div");e.setAttribute("data-vivliostyle-page-container",!0);ja||(e.style.visibility="hidden");d.d.appendChild(e);var f=d.b.createElement("div");f.setAttribute("data-vivliostyle-bleed-box",!0);e.appendChild(f);f=new Uh(e,f);f.G=b.item.G;f.position=c;f.offset=Io(b.Da,c);d!==a.viewport&&(a=$b(a.viewport.width,a.viewport.height,d.width,d.height),a=fg(null,new Tb(a,null)),f.h.push(new Rh(e,"transform",a)));return f}
function Hp(a,b){var c=np();if(c){var d=b.ownerDocument,e=d.createElement("span");b.appendChild(e);d=d.importNode(a,!0);e.appendChild(d);d=c.queue;d.Push(["Typeset",c,e]);var c=L("navigateToEPage"),f=df(c);d.Push(function(){f.Ua(e)});return N(c)}return M(null)}
n.Rc=function(a){var b=this;return function(c,d){var e;if("object"==c.localName&&"http://www.w3.org/1999/xhtml"==c.namespaceURI){var f=c.getAttribute("data");e=null;if(f){var f=va(f,a.url),g=c.getAttribute("media-type");if(!g){var h=pp(b.b,f);h&&(h=b.b.h[h])&&(g=h.d)}if(g&&(h=b.b.F[g])){e=b.viewport.b.createElement("iframe");e.style.border="none";var f=Ma(f),l=Ma(g),g=new Ia;g.append(h);g.append("?src=");g.append(f);g.append("&type=");g.append(l);for(h=c.firstChild;h;h=h.nextSibling)1==h.nodeType&&
(l=h,"param"==l.localName&&"http://www.w3.org/1999/xhtml"==l.namespaceURI&&(f=l.getAttribute("name"),l=l.getAttribute("value"),f&&l&&(g.append("&"),g.append(encodeURIComponent(f)),g.append("="),g.append(encodeURIComponent(l)))));e.setAttribute("src",g.toString());(g=c.getAttribute("width"))&&e.setAttribute("width",g);(g=c.getAttribute("height"))&&e.setAttribute("height",g)}}e||(e=b.viewport.b.createElement("span"),e.setAttribute("data-adapt-process-children","true"));e=M(e)}else if("http://www.w3.org/1998/Math/MathML"==
c.namespaceURI)e=Hp(c,d);else if("http://example.com/sse"==c.namespaceURI){e=d?d.ownerDocument:b.viewport.b;g=c.localName;switch(g){case "t":case "tab":case "ec":case "nt":case "fraction":case "comment":case "mark":g="span";break;case "ruby":case "rp":case "rt":break;default:g="div"}e=e.createElement(g);e.setAttribute("data-adapt-process-children","true");e=M(e)}else e=c.dataset&&"true"==c.dataset.mathTypeset?Hp(c,d):M(null);return e}};
function zp(a){if(a.G>=a.b.b.length)return M(null);var b=a.Hb[a.G];if(b)return M(b);var c=a.b.b[a.G],d=a.b.e,e=L("getPageViewItem");d.load(c.src).then(function(f){0==c.b&&1==a.b.b.length&&(c.b=Math.ceil(wh(f)/2700),a.b.u=c.b);var g=d.b[f.url],h=a.Rc(f),l=a.viewport,k=Fo(g,l.width,l.height,l.fontSize);if(k.width!=l.width||k.height!=l.height||k.fontSize!=l.fontSize)l=new vm(l.f,k.fontSize,l.root,k.width,k.height);var k=a.Hb[a.G-1],m=new Go(g,f,a.b.lang,l,a.e,a.f,h,a.b.w,k?k.Da.pa+k.eb.length:0);k&&
Bo(m.k,k.Da.k);m.S=a.S;Ho(m).then(function(){b={item:c,ba:f,Da:m,Ha:[null],eb:[],complete:!1};a.Hb[a.G]=b;O(e,b)})});return N(e)}function Ip(a){return{G:a.G,R:a.R,na:a.na}}function Jp(a,b){b?(a.G=b.G,a.R=-1,a.na=b.na):(a.G=0,a.R=0,a.na=0);return Bp(a,a.G,a.R)}
n.oc=function(){var a=this.b,b=a.D||a.N;if(!b)return M(null);var c=L("showTOC");this.d||(this.d=new Wo(a.e,b.src,a.lang,this.e,this.f,this.S,this,a.w));var a=this.viewport,b=Math.min(350,Math.round(.67*a.width)-16),d=a.height-6,e=a.b.createElement("div");a.root.appendChild(e);e.style.position="absolute";e.style.visibility="hidden";e.style.left="3px";e.style.top="3px";e.style.width=b+10+"px";e.style.maxHeight=d+"px";e.style.overflow="scroll";e.style.overflowX="hidden";e.style.background="#EEE";e.style.border=
"1px outset #999";e.style.borderRadius="2px";e.style.boxShadow=" 5px 5px rgba(128,128,128,0.3)";this.d.oc(e,a,b,d,this.viewport.fontSize).then(function(a){e.style.visibility="visible";O(c,a)});return N(c)};n.lc=function(){this.d&&this.d.lc()};n.ld=function(){return this.d&&this.d.ld()};function Kp(a,b,c,d){var e=this;this.h=a;this.gb=b;b.setAttribute("data-vivliostyle-viewer-viewport",!0);b.setAttribute("data-vivliostyle-viewer-status","loading");this.Qa=c;this.La=d;a=a.document;this.pa=new mh(a.head,b);this.H=[];this.g=null;this.F=this.d=!1;this.f=this.j=this.e=this.l=null;this.fontSize=16;this.zoom=1;this.ea=!1;this.Xc=!0;this.S=Wb();this.D=function(){};this.k=function(){};this.$=function(){e.d=!0;e.D()};this.u=function(){};this.w=a.getElementById("vivliostyle-page-rules");this.N=
!1;this.oa={loadEPUB:this.sa,loadXML:this.Fa,configure:this.A,moveTo:this.Ka,toc:this.oc};Lp(this)}function Lp(a){sa(1,function(a){Mp(this,{t:"debug",content:a})}.bind(a));sa(2,function(a){Mp(this,{t:"info",content:a})}.bind(a));sa(3,function(a){Mp(this,{t:"warn",content:a})}.bind(a));sa(4,function(a){Mp(this,{t:"error",content:a})}.bind(a))}function Mp(a,b){b.i=a.Qa;a.La(b)}
Kp.prototype.sa=function(a){Cn.b("loadEPUB");Cn.b("loadFirstPage");this.gb.setAttribute("data-vivliostyle-viewer-status","loading");var b=a.url,c=a.fragment,d=!!a.zipmeta,e=a.userStyleSheet;this.viewport=null;var f=L("loadEPUB"),g=this;g.A(a).then(function(){var a=new Zo;if(e)for(var l=0;l<e.length;l++)Vo(a,e[l]);Uo(a).then(function(){var e=va(b,g.h.location.href);g.H=[e];ap(a,e,d).then(function(a){g.g=a;tp(g.g,c).then(function(a){g.f=a;Np(g).then(function(){g.gb.setAttribute("data-vivliostyle-viewer-status",
"complete");Cn.d("loadEPUB");Mp(g,{t:"loaded",metadata:g.g.l});O(f,!0)})})})})});return N(f)};
Kp.prototype.Fa=function(a){Cn.b("loadXML");Cn.b("loadFirstPage");this.gb.setAttribute("data-vivliostyle-viewer-status","loading");var b;"string"===typeof a.url?b=[a.url]:b=a.url;var c=a.document,d=a.fragment,e=a.userStyleSheet;this.viewport=null;var f=L("loadXML"),g=this;g.A(a).then(function(){var a=new Zo;if(e)for(var l=0;l<e.length;l++)Vo(a,e[l]);Uo(a).then(function(){var e=b.map(function(a){return va(a,g.h.location.href)});g.H=e;g.g=new cp(a,"");rp(g.g,e,c).then(function(){tp(g.g,d).then(function(a){g.f=
a;Np(g).then(function(){g.gb.setAttribute("data-vivliostyle-viewer-status","complete");Cn.d("loadXML");Mp(g,{t:"loaded"});O(f,!0)})})})})});return N(f)};function Op(a,b){var c=parseFloat(b),d=/[a-z]+$/,e;if("string"===typeof b&&(e=b.match(d))){d=e[0];if("em"===d||"rem"===d)return c*a.fontSize;if("ex"===d||"rex"===d)return c*lc.ex*a.fontSize/lc.em;if(d=lc[d])return c*d}return c}
Kp.prototype.A=function(a){"boolean"==typeof a.autoresize&&(a.autoresize?(this.l=null,this.h.addEventListener("resize",this.$,!1),this.d=!0):this.h.removeEventListener("resize",this.$,!1));if("number"==typeof a.fontSize){var b=a.fontSize;5<=b&&72>=b&&this.fontSize!=b&&(this.fontSize=b,this.d=!0)}"object"==typeof a.viewport&&a.viewport&&(b=a.viewport,b={marginLeft:Op(this,b["margin-left"])||0,marginRight:Op(this,b["margin-right"])||0,marginTop:Op(this,b["margin-top"])||0,marginBottom:Op(this,b["margin-bottom"])||
0,width:Op(this,b.width)||0,height:Op(this,b.height)||0},200<=b.width||200<=b.height)&&(this.h.removeEventListener("resize",this.$,!1),this.l=b,this.d=!0);"boolean"==typeof a.hyphenate&&(this.S.Lc=a.hyphenate,this.d=!0);"boolean"==typeof a.horizontal&&(this.S.Kc=a.horizontal,this.d=!0);"boolean"==typeof a.nightMode&&(this.S.Sc=a.nightMode,this.d=!0);"number"==typeof a.lineHeight&&(this.S.lineHeight=a.lineHeight,this.d=!0);"number"==typeof a.columnWidth&&(this.S.Gc=a.columnWidth,this.d=!0);"string"==
typeof a.fontFamily&&(this.S.fontFamily=a.fontFamily,this.d=!0);"boolean"==typeof a.load&&(this.ea=a.load);"boolean"==typeof a.renderAllPages&&(this.Xc=a.renderAllPages);"string"==typeof a.userAgentRootURL&&(ua=a.userAgentRootURL);"boolean"==typeof a.spreadView&&a.spreadView!==this.S.Wa&&(this.viewport=null,this.S.Wa=a.spreadView,this.d=!0);"number"==typeof a.pageBorder&&a.pageBorder!==this.S.Gb&&(this.viewport=null,this.S.Gb=a.pageBorder,this.d=!0);"number"==typeof a.zoom&&a.zoom!==this.zoom&&(this.zoom=
a.zoom,this.F=!0);return M(!0)};function Pp(a){var b=[];a.e&&(b.push(a.e),a.e=null);a.j&&(b.push(a.j.left),b.push(a.j.right),a.j=null);b.forEach(function(a){a&&(w(a.M,"display","none"),a.removeEventListener("hyperlink",this.u,!1))},a)}function Qp(a,b){b.addEventListener("hyperlink",a.u,!1);w(b.M,"visibility","visible");w(b.M,"display","block")}function Rp(a,b){Pp(a);a.e=b;Qp(a,b)}
function Sp(a){var b=L("reportPosition");a.f||(a.f=Ip(a.b));sp(a.g,a.f.G,a.f.na).then(function(c){var d=a.e;(a.ea&&0<d.f.length?qg(d.f):M(!0)).then(function(){Tp(a,d,c).ra(b)})});return N(b)}function Up(a){var b=a.gb;if(a.l){var c=a.l;b.style.marginLeft=c.marginLeft+"px";b.style.marginRight=c.marginRight+"px";b.style.marginTop=c.marginTop+"px";b.style.marginBottom=c.marginBottom+"px";return new vm(a.h,a.fontSize,b,c.width,c.height)}return new vm(a.h,a.fontSize,b)}
function Vp(a){if(a.l||!a.viewport||a.viewport.fontSize!=a.fontSize)return!1;var b=Up(a);if(!(b=b.width==a.viewport.width&&b.height==a.viewport.height)&&(b=a.b)){a:{a=a.b.Hb;for(b=0;b<a.length;b++){var c=a[b];if(c)for(var c=c.eb,d=0;d<c.length;d++){var e=c[d];if(e.H&&e.F){a=!0;break a}}}a=!1}b=!a}return b}
Kp.prototype.bb=function(a,b,c){if(!this.N&&this.w&&0===b&&0===c){var d="";Object.keys(a).forEach(function(b){d+="@page "+b+"{size:";b=a[b];d+=b.width+"px "+b.height+"px;}"});this.w.textContent=d;this.N=!0}};
function Wp(a){if(a.b){a.b.lc();for(var b=a.b.Hb,c=0;c<b.length;c++){var d=b[c];if(d)for(var d=d.eb,e;e=d.shift();)e=e.M,e.parentNode.removeChild(e)}}a.w&&(a.w.textContent="",a.N=!1);a.viewport=Up(a);b=a.viewport;w(b.e,"width","");w(b.e,"height","");w(b.d,"width","");w(b.d,"height","");w(b.d,"transform","");a.b=new wp(a.g,a.viewport,a.pa,a.S,a.bb.bind(a))}
function Xp(a,b){a.F=!1;if(a.S.Wa)return Dp(a.b).xc(function(c){Pp(a);a.j=c;c.left&&(Qp(a,c.left),c.right||c.left.M.setAttribute("data-vivliostyle-unpaired-page",!0));c.right&&(Qp(a,c.right),c.left||c.right.M.setAttribute("data-vivliostyle-unpaired-page",!0));c=Yp(a,c);a.viewport.zoom(c.width,c.height,a.zoom);a.e=b;return M(null)});Rp(a,b);a.viewport.zoom(b.d.width,b.d.height,a.zoom);a.e=b;return M(null)}
function Yp(a,b){var c=0,d=0;b.left&&(c+=b.left.d.width,d=b.left.d.height);b.right&&(c+=b.right.d.width,d=Math.max(d,b.right.d.height));b.left&&b.right&&(c+=2*a.S.Gb);return{width:c,height:d}}var Zp={ce:"fit inside viewport"};
function Np(a){a.d=!1;if(Vp(a))return M(!0);"complete"===a.gb.getAttribute("data-vivliostyle-viewer-status")&&a.gb.setAttribute("data-vivliostyle-viewer-status","resizing");Mp(a,{t:"resizestart"});var b=L("resize");a.b&&!a.f&&(a.f=Ip(a.b));Wp(a);Jp(a.b,a.f).then(function(c){Xp(a,c).then(function(){Sp(a).then(function(c){Cn.d("loadFirstPage");(a.Xc?a.b.Xc():M(null)).then(function(){a.gb.setAttribute("data-vivliostyle-viewer-status","complete");Mp(a,{t:"resizeend"});O(b,c)})})})});return N(b)}
function Tp(a,b,c){var d=L("sendLocationNotification"),e={t:"nav",first:b.k,last:b.l};vp(a.g,a.f).then(function(b){e.epage=b;e.epageCount=a.g.u;c&&(e.cfi=c);Mp(a,e);O(d,!0)});return N(d)}Kp.prototype.jb=function(){return this.b?this.b.jb():null};
Kp.prototype.Ka=function(a){var b=this;if("string"==typeof a.where)switch(a.where){case "next":a=this.S.Wa?this.b.Pd:this.b.nextPage;break;case "previous":a=this.S.Wa?this.b.Sd:this.b.Vc;break;case "last":a=this.b.Kd;break;case "first":a=this.b.Jd;break;default:return M(!0)}else if("number"==typeof a.epage){var c=a.epage;a=function(){return Ep(b.b,c)}}else if("string"==typeof a.url){var d=a.url;a=function(){return Gp(b.b,d)}}else return M(!0);var e=L("nextPage");a.call(b.b).then(function(a){a?(b.f=
null,Xp(b,a).then(function(){Sp(b).ra(e)})):O(e,!0)});return N(e)};Kp.prototype.oc=function(a){var b=!!a.autohide;a=a.v;var c=this.b.ld();if(c){if("show"==a)return M(!0)}else if("hide"==a)return M(!0);if(c)return this.b.lc(),M(!0);var d=this,e=L("showTOC");this.b.oc(b).then(function(a){if(a){if(b){var c=function(){d.b.lc()};a.addEventListener("hyperlink",c,!1);a.M.addEventListener("click",c,!1)}a.addEventListener("hyperlink",d.u,!1)}O(e,!0)});return N(e)};
function $p(a,b){var c=b.a||"";return Ue("runCommand",function(d){var e=a.oa[c];e?e.call(a,b).then(function(){Mp(a,{t:"done",a:c});O(d,!0)}):(u.error("No such action:",c),O(d,!0))},function(a,b){u.error(b,"Error during action:",c);O(a,!0)})}function aq(a){return"string"==typeof a?JSON.parse(a):a}
function bq(a,b){var c=aq(b),d=null;We(function(){var b=L("commandLoop"),f=Pe.d;a.u=function(b){var c=a.H.some(function(a){return b.href.substr(0,a.length)==a}),d={t:"hyperlink",href:b.href,internal:c};Xe(f,function(){Mp(a,d);return M(!0)})};lf(function(b){if(a.d)Np(a).then(function(){nf(b)});else if(a.F)a.e&&Xp(a,a.e).then(function(){nf(b)});else if(c){var e=c;c=null;$p(a,e).then(function(){nf(b)})}else e=L("waitForCommand"),d=df(e,self),N(e).then(function(){nf(b)})}).ra(b);return N(b)});a.D=function(){var a=
d;a&&(d=null,a.Ua())};a.k=function(b){if(c)return!1;c=aq(b);a.D();return!0};a.h.adapt_command=a.k};Array.b||(Array.b=function(a,b,c){b&&c&&(b=b.bind(c));c=[];for(var d=a.length,e=0;e<d;e++)c[e]=b?b(a[e]):a[e];return c});Object.Qb||(Object.Qb=function(a,b){Object.keys(b).forEach(function(c){a[c]=b[c]});return a});function cq(a){var b={};Object.keys(a).forEach(function(c){var d=a[c];switch(c){case "autoResize":b.autoresize=d;break;case "pageBorderWidth":b.pageBorder=d;break;default:b[c]=d}});return b}function dq(a,b){ja=a.debug;this.f=a;this.b=new Kp(a.window||window,a.viewportElement,"main",this.Id.bind(this));this.e={autoResize:!0,fontSize:16,pageBorderWidth:1,renderAllPages:!0,spreadView:!1,zoom:1};b&&this.Dd(b);this.d=new Xa}n=dq.prototype;
n.Dd=function(a){var b=Object.Qb({a:"configure"},cq(a));this.b.k(b);Object.Qb(this.e,a)};n.Id=function(a){var b={type:a.t};Object.keys(a).forEach(function(c){"t"!==c&&(b[c]=a[c])});Ya(this.d,b)};n.Ud=function(a,b){this.d.addEventListener(a,b,!1)};n.Xd=function(a,b){this.d.removeEventListener(a,b,!1)};n.Ld=function(a,b,c){a||Ya(this.d,{type:"error",content:"No URL specified"});eq(this,a,null,b,c)};n.Vd=function(a,b,c){a||Ya(this.d,{type:"error",content:"No URL specified"});eq(this,null,a,b,c)};
function eq(a,b,c,d,e){d=d||{};var f,g=d.userStyleSheet;g&&(f=g.map(function(a){return{url:a.url||null,text:a.text||null}}));e&&Object.Qb(a.e,e);b=Object.Qb({a:b?"loadXML":"loadEPUB",userAgentRootURL:a.f.userAgentRootURL,url:b||c,document:d.documentObject,fragment:d.fragment,userStyleSheet:f},cq(a.e));bq(a.b,b)}n.jb=function(){return this.b.jb()};
n.Nd=function(a){a:switch(a){case "left":a="ltr"===this.jb()?"previous":"next";break a;case "right":a="ltr"===this.jb()?"next":"previous";break a}this.b.k({a:"moveTo",where:a})};n.Md=function(a){this.b.k({a:"moveTo",url:a})};n.Wd=function(a){var b;a:{b=this.b;if(!b.e)throw Error("no page exists.");switch(a){case "fit inside viewport":a=b.S.Wa?Yp(b,b.j):b.e.d;b=Math.min(b.viewport.width/a.width,b.viewport.height/a.height);break a;default:throw Error("unknown zoom type: "+a);}}return b};
ca("vivliostyle.viewer.Viewer",dq);dq.prototype.setOptions=dq.prototype.Dd;dq.prototype.addListener=dq.prototype.Ud;dq.prototype.removeListener=dq.prototype.Xd;dq.prototype.loadDocument=dq.prototype.Ld;dq.prototype.loadEPUB=dq.prototype.Vd;dq.prototype.getCurrentPageProgression=dq.prototype.jb;dq.prototype.navigateToPage=dq.prototype.Nd;dq.prototype.navigateToInternalUrl=dq.prototype.Md;dq.prototype.queryZoomFactor=dq.prototype.Wd;ca("vivliostyle.viewer.ZoomType",Zp);Zp.FIT_INSIDE_VIEWPORT="fit inside viewport";
yn.call(Cn,"load_vivliostyle","end",void 0);var fq=16,gq="ltr";function hq(a){window.adapt_command(a)}function iq(){hq({a:"moveTo",where:"ltr"===gq?"previous":"next"})}function jq(){hq({a:"moveTo",where:"ltr"===gq?"next":"previous"})}
function kq(a){var b=a.key,c=a.keyIdentifier,d=a.location;if("End"===b||"End"===c)hq({a:"moveTo",where:"last"}),a.preventDefault();else if("Home"===b||"Home"===c)hq({a:"moveTo",where:"first"}),a.preventDefault();else if("ArrowUp"===b||"Up"===b||"Up"===c)hq({a:"moveTo",where:"previous"}),a.preventDefault();else if("ArrowDown"===b||"Down"===b||"Down"===c)hq({a:"moveTo",where:"next"}),a.preventDefault();else if("ArrowRight"===b||"Right"===b||"Right"===c)jq(),a.preventDefault();else if("ArrowLeft"===
b||"Left"===b||"Left"===c)iq(),a.preventDefault();else if("0"===b||"U+0030"===c)hq({a:"configure",fontSize:Math.round(fq)}),a.preventDefault();else if("t"===b||"U+0054"===c)hq({a:"toc",v:"toggle",autohide:!0}),a.preventDefault();else if("+"===b||"Add"===b||"U+002B"===c||"U+00BB"===c||"U+004B"===c&&d===KeyboardEvent.b)fq*=1.2,hq({a:"configure",fontSize:Math.round(fq)}),a.preventDefault();else if("-"===b||"Subtract"===b||"U+002D"===c||"U+00BD"===c||"U+004D"===c&&d===KeyboardEvent.b)fq/=1.2,hq({a:"configure",
fontSize:Math.round(fq)}),a.preventDefault()}
function lq(a){switch(a.t){case "loaded":a=a.viewer;var b=gq=a.jb();a.gb.setAttribute("data-vivliostyle-page-progression",b);a.gb.setAttribute("data-vivliostyle-spread-view",a.S.Wa);window.addEventListener("keydown",kq,!1);document.body.setAttribute("data-vivliostyle-viewer-status","complete");a=document.getElementById("vivliostyle-page-navigation-left");a.addEventListener("click",iq,!1);b=document.getElementById("vivliostyle-page-navigation-right");b.addEventListener("click",jq,!1);[a,b].forEach(function(a){a.setAttribute("data-vivliostyle-ui-state",
"attention");window.setTimeout(function(){a.removeAttribute("data-vivliostyle-ui-state")},1E3)});break;case "nav":(a=a.cfi)&&location.replace(ya(location.href,Ma(a||"")));break;case "hyperlink":a.internal&&hq({a:"moveTo",url:a.href})}}
ca("vivliostyle.viewerapp.main",function(a){var b=a&&a.fragment||wa("f"),c=a&&a.epubURL||wa("b"),d=a&&a.xmlURL||wa("x"),e=a&&a.defaultPageWidth||wa("w"),f=a&&a.defaultPageHeight||wa("h"),g=a&&a.defaultPageSize||wa("size"),h=a&&a.orientation||wa("orientation"),l=wa("spread"),l=a&&a.spreadView||!!l&&"false"!=l,k=a&&a.viewportElement||document.body;a={a:c?"loadEPUB":"loadXML",url:c||d,autoresize:!0,fragment:b,renderAllPages:!0,userAgentRootURL:a&&a.uaRoot||null,document:a&&a.document||null,userStyleSheet:a&&
a.userStyleSheet||null,spreadView:l,pageBorder:1};var m;if(e&&f)m=e+" "+f;else{switch(g){case "A5":e="148mm";f="210mm";break;case "A4":e="210mm";f="297mm";break;case "A3":e="297mm";f="420mm";break;case "B5":e="176mm";f="250mm";break;case "B4":e="250mm";f="353mm";break;case "letter":e="8.5in";f="11in";break;case "legal":e="8.5in";f="14in";break;case "ledger":e="11in",f="17in"}e&&f&&(m=g,"landscape"===h&&(m=m?m+" landscape":null,g=e,e=f,f=g))}e&&f&&(a.viewport={width:e,height:f},g=document.createElement("style"),
g.textContent="@page { size: "+m+"; margin: 0; }",document.head.appendChild(g));bq(new Kp(window,k,"main",lq),a)});
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
