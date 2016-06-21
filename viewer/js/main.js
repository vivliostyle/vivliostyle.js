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
 * Vivliostyle core 2016.4.1-pre.20160621041501
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
function u(a,b){function c(){}c.prototype=b.prototype;a.Pd=b.prototype;a.prototype=new c;a.prototype.constructor=a;a.Ce=function(a,c,f){for(var g=Array(arguments.length-2),h=2;h<arguments.length;h++)g[h-2]=arguments[h];return b.prototype[c].apply(a,g)}};function da(a,b,c,d){d=d[b];if(!d)throw Error("unknown writing-mode: "+b);b=d[c||"ltr"];if(!b)throw Error("unknown direction: "+c);for(c=0;c<b.length;c++)if(d=b[c],d=a.replace(d.f,d.b),d!==a)return d;return a}function ea(a){var b=fa,c={};Object.keys(b).forEach(function(d){var e=c[d]={},f=b[d];Object.keys(f).forEach(function(b){e[b]=f[b].map(function(b){return{f:new RegExp("(-?)"+(a?b.K:b.L)+"(-?)"),b:"$1"+(a?b.L:b.K)+"$2"}})})});return c}
var fa={"horizontal-tb":{ltr:[{K:"inline-start",L:"left"},{K:"inline-end",L:"right"},{K:"block-start",L:"top"},{K:"block-end",L:"bottom"},{K:"inline-size",L:"width"},{K:"block-size",L:"height"}],rtl:[{K:"inline-start",L:"right"},{K:"inline-end",L:"left"},{K:"block-start",L:"top"},{K:"block-end",L:"bottom"},{K:"inline-size",L:"width"},{K:"block-size",L:"height"}]},"vertical-rl":{ltr:[{K:"inline-start",L:"top"},{K:"inline-end",L:"bottom"},{K:"block-start",L:"right"},{K:"block-end",L:"left"},{K:"inline-size",
L:"height"},{K:"block-size",L:"width"}],rtl:[{K:"inline-start",L:"bottom"},{K:"inline-end",L:"top"},{K:"block-start",L:"right"},{K:"block-end",L:"left"},{K:"inline-size",L:"height"},{K:"block-size",L:"width"}]},"vertical-lr":{ltr:[{K:"inline-start",L:"top"},{K:"inline-end",L:"bottom"},{K:"block-start",L:"left"},{K:"block-end",L:"right"},{K:"inline-size",L:"height"},{K:"block-size",L:"width"}],rtl:[{K:"inline-start",L:"bottom"},{K:"inline-end",L:"top"},{K:"block-start",L:"left"},{K:"block-end",L:"right"},
{K:"inline-size",L:"height"},{K:"block-size",L:"width"}]}},ga=ea(!0),ha=ea(!1),ja={"horizontal-tb":[{K:"line-left",L:"left"},{K:"line-right",L:"right"},{K:"over",L:"top"},{K:"under",L:"bottom"}],"vertical-rl":[{K:"line-left",L:"top"},{K:"line-right",L:"bottom"},{K:"over",L:"right"},{K:"under",L:"left"}],"vertical-lr":[{K:"line-left",L:"top"},{K:"line-right",L:"bottom"},{K:"over",L:"right"},{K:"under",L:"left"}]};var ka=!1,la={ue:"ltr",ve:"rtl"};ba("vivliostyle.constants.PageProgression",la);la.LTR="ltr";la.RTL="rtl";var ma={Qd:"left",Rd:"right"};ba("vivliostyle.constants.PageSide",ma);ma.LEFT="left";ma.RIGHT="right";function na(a){var b=a.error,c=b&&(b.frameTrace||b.stack);a=[].concat(a.messages);b&&(0<a.length&&(a=a.concat(["\n"])),a=a.concat([b.toString()]),c&&(a=a.concat(["\n"]).concat(c)));return a}function oa(a){a=Array.b(a);var b=null;a[0]instanceof Error&&(b=a.shift());return{error:b,messages:a}}function pa(a){function b(a){return function(b){return a.apply(c,b)}}var c=a||console;this.f=b(c.debug||c.log);this.h=b(c.info||c.log);this.j=b(c.warn||c.log);this.g=b(c.error||c.log);this.d={}}
function qa(a,b,c){(a=a.d[b])&&a.forEach(function(a){a(c)})}function ra(a,b){var c=v,d=c.d[a];d||(d=c.d[a]=[]);d.push(b)}pa.prototype.debug=function(a){var b=oa(arguments);this.f(na(b));qa(this,1,b)};pa.prototype.e=function(a){var b=oa(arguments);this.h(na(b));qa(this,2,b)};pa.prototype.b=function(a){var b=oa(arguments);this.j(na(b));qa(this,3,b)};pa.prototype.error=function(a){var b=oa(arguments);this.g(na(b));qa(this,4,b)};var v=new pa;function ta(a){var b=a.match(/^([^#]*)/);return b?b[1]:a}var ua=window.location.href;
function va(a,b){if(!b||a.match(/^\w{2,}:/))return a.toLowerCase().match("^javascript:")?"#":a;b.match(/^\w{2,}:\/\/[^\/]+$/)&&(b+="/");var c;if(a.match(/^\/\//))return(c=b.match(/^(\w{2,}:)\/\//))?c[1]+a:a;if(a.match(/^\//))return(c=b.match(/^(\w{2,}:\/\/[^\/]+)\//))?c[1]+a:a;a.match(/^\.(\/|$)/)&&(a=a.substr(1));c=b;var d=c.match(/^([^#?]*)/);b=d?d[1]:c;if(a.match(/^\#/))return b+a;c=b.lastIndexOf("/");if(0>c)return a;for(d=b.substr(0,c+1)+a;;){c=d.indexOf("/../");if(0>=c)break;var e=d.lastIndexOf("/",
c-1);if(0>=e)break;d=d.substr(0,e)+d.substr(c+3)}return d.replace(/\/(\.\/)+/g,"/")}function wa(a){a=new RegExp("#(.*&)?"+xa(a)+"=([^#&]*)");return(a=window.location.href.match(a))?a[2]:null}function ya(a,b){var c=new RegExp("#(.*&)?"+xa("f")+"=([^#&]*)"),d=a.match(c);return d?(c=d[2].length,d=d.index+d[0].length-c,a.substr(0,d)+b+a.substr(d+c)):a.match(/#/)?a+"&f="+b:a+"#f="+b}function za(a){return null==a?a:a.toString()}function Aa(){this.b=[null]}
Aa.prototype.length=function(){return this.b.length-1};function Ba(a,b){a&&(b="-"+b,a=a.replace(/-/g,""),"moz"===a&&(a="Moz"));return a+b.replace(/-[a-z]/g,function(a){return a.substr(1).toUpperCase()})}var Ca=" -webkit- -moz- -ms- -o- -epub-".split(" "),Da={};
function Ea(a,b){if("writing-mode"===b){var c=document.createElement("span");if("-ms-"===a)return c.style.setProperty(a+b,"tb-rl"),"tb-rl"===c.style["writing-mode"];c.style.setProperty(a+b,"vertical-rl");return"vertical-rl"===c.style[a+b]}return"string"===typeof document.documentElement.style[Ba(a,b)]}
function Ga(a){var b=Da[a];if(b||null===b)return b;switch(a){case "writing-mode":if(Ea("-ms-","writing-mode"))return Da[a]="-ms-writing-mode";break;case "filter":if(Ea("-webkit-","filter"))return Da[a]="-webkit-filter"}for(b=0;b<Ca.length;b++){var c=Ca[b];if(Ea(c,a))return b=c+a,Da[a]=b}v.b("Property not supported by the browser: ",a);return Da[a]=null}
function w(a,b,c){try{var d=Ga(b);if(d){if("-ms-writing-mode"===d)switch(c){case "horizontal-tb":c="lr-tb";break;case "vertical-rl":c="tb-rl";break;case "vertical-lr":c="tb-lr"}a&&a.style&&a.style.setProperty(d,c)}}catch(e){v.b(e)}}function Ha(a,b,c){try{return a.style.getPropertyValue(Da[b]||b)}catch(d){}return c||""}function Ia(){this.b=[]}Ia.prototype.append=function(a){this.b.push(a);return this};Ia.prototype.toString=function(){var a=this.b.join("");this.b=[a];return a};
function Ja(a){return"\\"+a.charCodeAt(0).toString(16)+" "}function Ka(a){return a.replace(/[^-_a-zA-Z0-9\u0080-\uFFFF]/g,Ja)}function La(a){return a.replace(/[\u0000-\u001F"]/g,Ja)}function Ma(a){return a.replace(/[\s+&?=#\u007F-\uFFFF]+/g,encodeURIComponent)}function Na(a){return!!a.match(/^[a-zA-Z\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]$/)}function Oa(a){return"\\u"+(65536|a.charCodeAt(0)).toString(16).substr(1)}
function xa(a){return a.replace(/[^-a-zA-Z0-9_]/g,Oa)}function Pa(a){if(!a)throw"Assert failed";}function Qa(a,b){for(var c=0,d=a;;){Pa(c<=d);Pa(0==c||!b(c-1));Pa(d==a||b(d));if(c==d)return c;var e=c+d>>1;b(e)?d=e:c=e+1}}function Ra(a,b){return a-b}function Sa(a,b){for(var c={},d=0;d<a.length;d++){var e=a[d],f=b(e);f&&!c[f]&&(c[f]=e)}return c}var Ta={};function Ua(a,b){for(var c={},d=0;d<a.length;d++){var e=a[d],f=b(e);f&&(c[f]?c[f].push(e):c[f]=[e])}return c}
function Va(a,b){for(var c=Array(a.length),d=0;d<a.length;d++)c[d]=b(a[d],d);return c}function Wa(a,b){var c={},d;for(d in a)c[d]=b(a[d],d);return c}function Xa(){this.f={}}function Ya(a,b){var c=a.f[b.type];if(c){b.target=a;b.currentTarget=a;for(var d=0;d<c.length;d++)c[d](b)}}Xa.prototype.addEventListener=function(a,b,c){c||((c=this.f[a])?c.push(b):this.f[a]=[b])};Xa.prototype.removeEventListener=function(a,b,c){!c&&(a=this.f[a])&&(b=a.indexOf(b),0<=b&&a.splice(b,1))};var Za=null;
function $a(a){if(null==Za){var b=a.ownerDocument,c=b.createElement("div");c.style.position="absolute";c.style.top="0px";c.style.left="0px";c.style.width="100px";c.style.height="100px";c.style.overflow="hidden";c.style.lineHeight="16px";c.style.fontSize="16px";a.appendChild(c);var d=b.createElement("div");d.style.width="0px";d.style.height="14px";d.style.cssFloat="left";c.appendChild(d);d=b.createElement("div");d.style.width="50px";d.style.height="50px";d.style.cssFloat="left";d.style.clear="left";
c.appendChild(d);d=b.createTextNode("a a a a a a a a a a a a a a a a");c.appendChild(d);b=b.createRange();b.setStart(d,0);b.setEnd(d,1);Za=40>b.getBoundingClientRect().left;a.removeChild(c)}return Za}var ab=null;function bb(a){return 1==a.nodeType&&(a=a.getAttribute("id"))&&a.match(/^[-a-zA-Z_0-9.\u007F-\uFFFF]+$/)?a:null}function cb(a){return"^"+a}function db(a){return a.substr(1)}function eb(a){return a?a.replace(/\^[\[\]\(\),=;^]/g,db):a}
function fb(a){for(var b={};a;){var c=a.match(/^;([^;=]+)=(([^;]|\^;)*)/);if(!c)break;var d=c[1],e;a:{e=c[2];var f=[];do{var g=e.match(/^(\^,|[^,])*/),h=eb(g[0]);e=e.substr(g[0].length+1);if(!e&&!f.length){e=h;break a}f.push(h)}while(e);e=f}b[d]=e;a=a.substr(c[0].length)}return b}function gb(){}gb.prototype.e=function(a){a.append("!")};gb.prototype.f=function(){return!1};function hb(a,b,c){this.b=a;this.id=b;this.Wa=c}
hb.prototype.e=function(a){a.append("/");a.append(this.b.toString());if(this.id||this.Wa)a.append("["),this.id&&a.append(this.id),this.Wa&&(a.append(";s="),a.append(this.Wa)),a.append("]")};
hb.prototype.f=function(a){if(1!=a.fa.nodeType)throw Error("E_CFI_NOT_ELEMENT");var b=a.fa,c=b.children,d=c.length,e=Math.floor(this.b/2)-1;0>e||0==d?(c=b.firstChild,a.fa=c||b):(c=c[Math.min(e,d-1)],this.b&1&&((b=c.nextSibling)&&1!=b.nodeType?c=b:a.J=!0),a.fa=c);if(this.id&&(a.J||this.id!=bb(a.fa)))throw Error("E_CFI_ID_MISMATCH");a.Wa=this.Wa;return!0};function ib(a,b,c,d){this.offset=a;this.d=b;this.b=c;this.Wa=d}
ib.prototype.f=function(a){if(0<this.offset&&!a.J){for(var b=this.offset,c=a.fa;;){var d=c.nodeType;if(1==d)break;var e=c.nextSibling;if(3<=d&&5>=d){d=c.textContent.length;if(b<=d)break;if(!e){b=d;break}b-=d}if(!e){b=0;break}c=e}a.fa=c;a.offset=b}a.Wa=this.Wa;return!0};
ib.prototype.e=function(a){a.append(":");a.append(this.offset.toString());if(this.d||this.b||this.Wa){a.append("[");if(this.d||this.b)this.d&&a.append(this.d.replace(/[\[\]\(\),=;^]/g,cb)),a.append(","),this.b&&a.append(this.b.replace(/[\[\]\(\),=;^]/g,cb));this.Wa&&(a.append(";s="),a.append(this.Wa));a.append("]")}};function jb(){this.ga=null}
function kb(a,b){var c=b.match(/^#?epubcfi\((.*)\)$/);if(!c)throw Error("E_CFI_NOT_CFI");for(var d=c[1],e=0,f=[];;)switch(d.charAt(e)){case "/":e++;c=d.substr(e).match(/^(0|[1-9][0-9]*)(\[([-a-zA-Z_0-9.\u007F-\uFFFF]+)(;([^\]]|\^\])*)?\])?/);if(!c)throw Error("E_CFI_NUMBER_EXPECTED");var e=e+c[0].length,g=parseInt(c[1],10),h=c[3],c=fb(c[4]);f.push(new hb(g,h,za(c.s)));break;case ":":e++;c=d.substr(e).match(/^(0|[1-9][0-9]*)(\[((([^\];,]|\^[\];,])*)(,(([^\];,]|\^[\];,])*))?)(;([^]]|\^\])*)?\])?/);
if(!c)throw Error("E_CFI_NUMBER_EXPECTED");e+=c[0].length;g=parseInt(c[1],10);(h=c[4])&&(h=eb(h));var l=c[7];l&&(l=eb(l));c=fb(c[10]);f.push(new ib(g,h,l,za(c.s)));break;case "!":e++;f.push(new gb);break;case "~":case "@":case "":a.ga=f;return;default:throw Error("E_CFI_PARSE_ERROR");}}function lb(a,b){for(var c={fa:b.documentElement,offset:0,J:!1,Wa:null,ac:null},d=0;d<a.ga.length;d++)if(!a.ga[d].f(c)){++d<a.ga.length&&(c.ac=new jb,c.ac.ga=a.ga.slice(d));break}return c}
jb.prototype.trim=function(a,b){return a.replace(/\s+/g," ").match(b?/^[ -\uD7FF\uE000-\uFFFF]{0,8}/:/[ -\uD7FF\uE000-\uFFFF]{0,8}$/)[0].replace(/^\s/,"").replace(/\s$/,"")};
function mb(a,b,c){for(var d=!1,e=null,f=[],g=b.parentNode,h="",l="";b;){switch(b.nodeType){case 3:case 4:case 5:var k=b.textContent,m=k.length;d?(c+=m,h||(h=k)):(c>m&&(c=m),d=!0,h=k.substr(0,c),l=k.substr(c));b=b.previousSibling;continue;case 8:b=b.previousSibling;continue}break}if(0<c||h||l)h=a.trim(h,!1),l=a.trim(l,!0),f.push(new ib(c,h,l,e)),e=null;for(;g&&g&&9!=g.nodeType;){c=d?null:bb(b);for(d=d?1:0;b;)1==b.nodeType&&(d+=2),b=b.previousSibling;f.push(new hb(d,c,e));e=null;b=g;g=g.parentNode;
d=!1}f.reverse();a.ga?(f.push(new gb),a.ga=f.concat(a.ga)):a.ga=f}jb.prototype.toString=function(){if(!this.ga)return"";var a=new Ia;a.append("epubcfi(");for(var b=0;b<this.ga.length;b++)this.ga[b].e(a);a.append(")");return a.toString()};function nb(a){a=a.substr(1);if(a.match(/^[^0-9a-fA-F\n\r]$/))return a;a=parseInt(a,16);return isNaN(a)?"":65535>=a?String.fromCharCode(a):1114111>=a?String.fromCharCode(55296|a>>10&1023,56320|a&1023):"\ufffd"}function ob(a){return a.replace(/\\([0-9a-fA-F]{0,6}(\r\n|[ \n\r\t\f])?|[^0-9a-fA-F\n\r])/g,nb)}function pb(){this.type=0;this.b=!1;this.C=0;this.text="";this.position=0}
function qb(a,b){var c=Array(128),d;for(d=0;128>d;d++)c[d]=a;c[NaN]=35==a?35:72;for(d=0;d<b.length;d+=2)c[b[d]]=b[d+1];return c}var rb=[72,72,72,72,72,72,72,72,72,1,1,72,1,1,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,1,4,34,6,7,8,9,33,10,11,12,13,14,15,16,17,2,2,2,2,2,2,2,2,2,2,18,19,20,21,22,23,24,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,25,29,26,30,3,72,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,27,31,28,32,72];rb[NaN]=80;
var sb=[43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,52,43,43,43,43,39,43,43,39,39,39,39,39,39,39,39,39,39,43,43,43,43,43,43,43,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,43,44,43,43,39,43,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,43,43,43,43,43];sb[NaN]=43;
var tb=[72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,78,59,72,59,59,59,59,59,59,59,59,59,59,72,72,72,72,72,72,72,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,72,61,72,72,78,72,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,72,72,72,72,72];sb[NaN]=43;
var ub=[35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,57,59,35,58,58,58,58,58,58,58,58,58,58,35,35,35,35,35,35,35,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,35,61,35,35,60,35,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,35,35,35,35,35];ub[NaN]=35;
var vb=[45,45,45,45,45,45,45,45,45,73,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,73,45,45,45,45,45,45,45,53,45,45,45,45,45,45,45,39,39,39,39,39,39,39,39,39,39,45,45,45,45,45,45,45,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,45,44,45,45,39,45,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,45,45,45,45,45];vb[NaN]=45;
var wb=[37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,41,37,37,37,37,37,37,37,37,42,37,39,39,39,39,39,39,39,39,39,39,37,37,37,37,37,37,37,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,37,37,37,37,40,37,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,37,37,37,37,37];wb[NaN]=37;
var xb=[38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,41,38,38,38,38,38,38,38,38,38,38,39,39,39,39,39,39,39,39,39,39,38,38,38,38,38,38,38,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,38,38,38,38,40,38,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,38,38,38,38,38];xb[NaN]=38;
var yb=qb(35,[61,36]),zb=qb(35,[58,77]),Ab=qb(35,[61,36,124,50]),Bb=qb(35,[38,51]),Cb=qb(35,[42,54]),Db=qb(39,[42,55]),Eb=qb(54,[42,55,47,56]),Fb=qb(62,[62,56]),Gb=qb(35,[61,36,33,70]),Hb=qb(62,[45,71]),Ib=qb(63,[45,56]),Jb=qb(76,[9,72,10,72,13,72,32,72]),Kb=qb(39,[39,46,10,72,13,72,92,48]),Lb=qb(39,[34,46,10,72,13,72,92,49]),Mb=qb(39,[39,47,10,74,13,74,92,48]),Nb=qb(39,[34,47,10,74,13,74,92,49]),Ob=qb(64,[9,39,32,39,34,66,39,65,41,72,10,39,13,39]),Pb=qb(39,[41,67,9,79,10,79,13,79,32,79,92,75,40,
72,91,72,93,72,123,72,125,72,NaN,67]),Qb=qb(39,[39,68,10,74,13,74,92,75,NaN,67]),Rb=qb(39,[34,68,10,74,13,74,92,75,NaN,67]),Sb=qb(72,[9,39,10,39,13,39,32,39,41,69]);function Tb(a,b){this.h=b;this.e=15;this.j=a;this.g=Array(this.e+1);this.b=-1;for(var c=this.position=this.d=this.f=0;c<=this.e;c++)this.g[c]=new pb}function y(a){a.f==a.d&&Ub(a);return a.g[a.d]}function z(a,b){(a.f-a.d&a.e)<=b&&Ub(a);return a.g[a.d+b&a.e]}function A(a){a.d=a.d+1&a.e}
function Vb(a){if(0>a.b)throw Error("F_CSSTOK_BAD_CALL reset");a.d=a.b;a.b=-1}Tb.prototype.error=function(a,b,c){this.h&&this.h.error(c,b)};
function Ub(a){var b=a.f,c=0<=a.b?a.b:a.d,d=a.e;b>=c?c+=d:c--;if(c==b){if(0>a.b)throw Error("F_CSSTOK_INTERNAL");for(var b=2*(a.e+1)-1,c=Array(b+1),d=a.b,e=0;d!=a.f;)c[e]=a.g[d],d==a.d&&(a.d=e),d=d+1&a.e,e++;a.b=0;a.f=e;a.e=b;for(a.g=c;e<=b;)c[e++]=new pb;b=a.f;c=d=a.e}for(var e=rb,f=a.j,g=a.position,h=a.g,l=0,k=0,m="",p=0,r=!1,t=h[b],q=-9;;){var x=f.charCodeAt(g);switch(e[x]||e[65]){case 72:l=51;m=isNaN(x)?"E_CSS_UNEXPECTED_EOF":"E_CSS_UNEXPECTED_CHAR";g++;break;case 1:g++;r=!0;continue;case 2:k=
g++;e=wb;continue;case 3:l=1;k=g++;e=sb;continue;case 4:k=g++;l=31;e=yb;continue;case 33:l=2;k=++g;e=Kb;continue;case 34:l=2;k=++g;e=Lb;continue;case 6:k=++g;l=7;e=sb;continue;case 7:k=g++;l=32;e=yb;continue;case 8:k=g++;l=21;break;case 9:k=g++;l=32;e=Bb;continue;case 10:k=g++;l=10;break;case 11:k=g++;l=11;break;case 12:k=g++;l=36;e=yb;continue;case 13:k=g++;l=23;break;case 14:k=g++;l=16;break;case 15:l=24;k=g++;e=ub;continue;case 16:k=g++;e=tb;continue;case 78:k=g++;l=9;e=sb;continue;case 17:k=g++;
l=19;e=Cb;continue;case 18:k=g++;l=18;e=zb;continue;case 77:g++;l=50;break;case 19:k=g++;l=17;break;case 20:k=g++;l=38;e=Gb;continue;case 21:k=g++;l=39;e=yb;continue;case 22:k=g++;l=37;e=yb;continue;case 23:k=g++;l=22;break;case 24:k=++g;l=20;e=sb;continue;case 25:k=g++;l=14;break;case 26:k=g++;l=15;break;case 27:k=g++;l=12;break;case 28:k=g++;l=13;break;case 29:q=k=g++;l=1;e=Jb;continue;case 30:k=g++;l=33;e=yb;continue;case 31:k=g++;l=34;e=Ab;continue;case 32:k=g++;l=35;e=yb;continue;case 35:break;
case 36:g++;l=l+41-31;break;case 37:l=5;p=parseInt(f.substring(k,g),10);break;case 38:l=4;p=parseFloat(f.substring(k,g));break;case 39:g++;continue;case 40:l=3;p=parseFloat(f.substring(k,g));k=g++;e=sb;continue;case 41:l=3;p=parseFloat(f.substring(k,g));m="%";k=g++;break;case 42:g++;e=xb;continue;case 43:m=f.substring(k,g);break;case 44:q=g++;e=Jb;continue;case 45:m=ob(f.substring(k,g));break;case 46:m=f.substring(k,g);g++;break;case 47:m=ob(f.substring(k,g));g++;break;case 48:q=g;g+=2;e=Mb;continue;
case 49:q=g;g+=2;e=Nb;continue;case 50:g++;l=25;break;case 51:g++;l=26;break;case 52:m=f.substring(k,g);if(1==l){g++;if("url"==m.toLowerCase()){e=Ob;continue}l=6}break;case 53:m=ob(f.substring(k,g));if(1==l){g++;if("url"==m.toLowerCase()){e=Ob;continue}l=6}break;case 54:e=Db;g++;continue;case 55:e=Eb;g++;continue;case 56:e=rb;g++;continue;case 57:e=Fb;g++;continue;case 58:l=5;e=wb;g++;continue;case 59:l=4;e=xb;g++;continue;case 60:l=1;e=sb;g++;continue;case 61:l=1;e=Jb;q=g++;continue;case 62:g--;
break;case 63:g-=2;break;case 64:k=g++;e=Pb;continue;case 65:k=++g;e=Qb;continue;case 66:k=++g;e=Rb;continue;case 67:l=8;m=ob(f.substring(k,g));g++;break;case 69:g++;break;case 70:e=Hb;g++;continue;case 71:e=Ib;g++;continue;case 79:if(8>g-q&&f.substring(q+1,g+1).match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])|[ \t]$/)){g++;continue}case 68:l=8;m=ob(f.substring(k,g));g++;e=Sb;continue;case 74:g++;if(9>g-q&&f.substring(q+1,g).match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])$/))continue;l=51;m="E_CSS_UNEXPECTED_NEWLINE";
break;case 73:if(9>g-q&&f.substring(q+1,g+1).match(/^[0-9a-fA-F]{0,6}[ \t]$/)){g++;continue}m=ob(f.substring(k,g));break;case 75:q=g++;continue;case 76:g++;e=vb;continue;default:if(e!==rb){l=51;m="E_CSS_UNEXPECTED_STATE";break}k=g;l=0}t.type=l;t.b=r;t.C=p;t.text=m;t.position=k;b++;if(b>=c)break;e=rb;r=!1;t=h[b&d]}a.position=g;a.f=b&d};function Wb(){return{fontFamily:"serif",lineHeight:1.25,margin:8,Tc:!0,Pc:25,Sc:!1,$c:!1,Xa:!1,Kb:1,sd:{print:!0}}}function Xb(a){return{fontFamily:a.fontFamily,lineHeight:a.lineHeight,margin:a.margin,Tc:a.Tc,Pc:a.Pc,Sc:a.Sc,$c:a.$c,Xa:a.Xa,Kb:a.Kb,sd:Object.Ub({},a.sd)}}var Yb=Wb(),Zb={};function $b(a,b,c,d){a=Math.min((a-0)/c,(b-0)/d);return"matrix("+a+",0,0,"+a+",0,0)"}function ac(a){return'"'+La(a+"")+'"'}function bc(a){return Ka(a+"")}function cc(a,b){return a?Ka(a)+"."+Ka(b):Ka(b)}var dc=0;
function ec(a,b){this.parent=a;this.j="S"+dc++;this.children=[];this.b=new B(this,0);this.d=new B(this,1);this.g=new B(this,!0);this.f=new B(this,!1);a&&a.children.push(this);this.values={};this.l={};this.k={};this.h=b;if(!a){var c=this.k;c.floor=Math.floor;c.ceil=Math.ceil;c.round=Math.round;c.sqrt=Math.sqrt;c.min=Math.min;c.max=Math.max;c.letterbox=$b;c["css-string"]=ac;c["css-name"]=bc;c["typeof"]=function(a){return typeof a};fc(this,"page-width",function(){return this.pb()});fc(this,"page-height",
function(){return this.ob()});fc(this,"pref-font-family",function(){return this.T.fontFamily});fc(this,"pref-night-mode",function(){return this.T.$c});fc(this,"pref-hyphenate",function(){return this.T.Tc});fc(this,"pref-margin",function(){return this.T.margin});fc(this,"pref-line-height",function(){return this.T.lineHeight});fc(this,"pref-column-width",function(){return this.T.Pc*this.fontSize});fc(this,"pref-horizontal",function(){return this.T.Sc});fc(this,"pref-spread-view",function(){return this.T.Xa})}}
function fc(a,b,c){a.values[b]=new gc(a,c,b)}function hc(a,b){a.values["page-number"]=b}function ic(a,b){a.k["has-content"]=b}var jc={px:1,"in":96,pt:4/3,pc:16,cm:96/2.54,mm:96/25.4,q:96/2.54/40,em:16,rem:16,ex:8,rex:8};function kc(a){switch(a){case "q":case "rem":case "rex":return!0;default:return!1}}
function lc(a,b,c,d){this.za=b;this.gb=c;this.H=null;this.pb=function(){return this.H?this.H:this.T.Xa?Math.floor(b/2)-this.T.Kb:b};this.D=null;this.ob=function(){return this.D?this.D:c};this.j=d;this.S=null;this.fontSize=function(){return this.S?this.S:d};this.T=Yb;this.w={}}function mc(a,b){a.w[b.j]={};for(var c=0;c<b.children.length;c++)mc(a,b.children[c])}
function nc(a,b,c){return"vw"==b?a.pb()/100:"vh"==b?a.ob()/100:"em"==b||"rem"==b?c?a.j:a.fontSize():"ex"==b||"rex"==b?jc.ex*(c?a.j:a.fontSize())/jc.em:jc[b]}function oc(a,b,c){do{var d=b.values[c];if(d||b.h&&(d=b.h.call(a,c,!1)))return d;b=b.parent}while(b);throw Error("Name '"+c+"' is undefined");}
function pc(a,b,c,d,e){do{var f=b.l[c];if(f||b.h&&(f=b.h.call(a,c,!0)))return f;if(f=b.k[c]){if(e)return b.b;c=Array(d.length);for(e=0;e<d.length;e++)c[e]=d[e].evaluate(a);return new B(b,f.apply(a,c))}b=b.parent}while(b);throw Error("Function '"+c+"' is undefined");}
function qc(a,b,c){var d="",e=b.match(/^(min|max)-(.*)$/);e&&(d=e[1],b=e[2]);var f=e=null;switch(b){case "width":case "height":case "device-width":case "device-height":case "color":c&&(e=c.evaluate(a))}switch(b){case "width":f=a.pb();break;case "height":f=a.ob();break;case "device-width":f=window.screen.availWidth;break;case "device-height":f=window.screen.availHeight;break;case "color":f=window.screen.pixelDepth}if(null!=f&&null!=e)switch(d){case "min":return f>=e;case "max":return f<=e;default:return f==
e}else if(null!=f&&null==c)return 0!==f;return!1}function rc(a){this.b=a;this.f="_"+dc++}n=rc.prototype;n.toString=function(){var a=new Ia;this.pa(a,0);return a.toString()};n.pa=function(){throw Error("F_ABSTRACT");};n.Pa=function(){throw Error("F_ABSTRACT");};n.Fa=function(){return this};n.Ab=function(a){return a===this};function sc(a,b,c,d){var e=d[a.f];if(null!=e)return e===Zb?!1:e;d[a.f]=Zb;b=a.Ab(b,c,d);return d[a.f]=b}
n.evaluate=function(a){var b;b=(b=a.w[this.b.j])?b[this.f]:void 0;if("undefined"!=typeof b)return b;b=this.Pa(a);var c=this.f,d=this.b,e=a.w[d.j];e||(e={},a.w[d.j]=e);return e[c]=b};n.wd=function(){return!1};function tc(a,b){rc.call(this,a);this.d=b}u(tc,rc);n=tc.prototype;n.pd=function(){throw Error("F_ABSTRACT");};n.ud=function(){throw Error("F_ABSTRACT");};n.Pa=function(a){a=this.d.evaluate(a);return this.ud(a)};n.Ab=function(a,b,c){return a===this||sc(this.d,a,b,c)};
n.pa=function(a,b){10<b&&a.append("(");a.append(this.pd());this.d.pa(a,10);10<b&&a.append(")")};n.Fa=function(a,b){var c=this.d.Fa(a,b);return c===this.d?this:new this.constructor(this.b,c)};function C(a,b,c){rc.call(this,a);this.d=b;this.e=c}u(C,rc);n=C.prototype;n.lc=function(){throw Error("F_ABSTRACT");};n.Da=function(){throw Error("F_ABSTRACT");};n.Ua=function(){throw Error("F_ABSTRACT");};n.Pa=function(a){var b=this.d.evaluate(a);a=this.e.evaluate(a);return this.Ua(b,a)};
n.Ab=function(a,b,c){return a===this||sc(this.d,a,b,c)||sc(this.e,a,b,c)};n.pa=function(a,b){var c=this.lc();c<=b&&a.append("(");this.d.pa(a,c);a.append(this.Da());this.e.pa(a,c);c<=b&&a.append(")")};n.Fa=function(a,b){var c=this.d.Fa(a,b),d=this.e.Fa(a,b);return c===this.d&&d===this.e?this:new this.constructor(this.b,c,d)};function uc(a,b,c){C.call(this,a,b,c)}u(uc,C);uc.prototype.lc=function(){return 1};function vc(a,b,c){C.call(this,a,b,c)}u(vc,C);vc.prototype.lc=function(){return 2};
function wc(a,b,c){C.call(this,a,b,c)}u(wc,C);wc.prototype.lc=function(){return 3};function xc(a,b,c){C.call(this,a,b,c)}u(xc,C);xc.prototype.lc=function(){return 4};function yc(a,b){tc.call(this,a,b)}u(yc,tc);yc.prototype.pd=function(){return"!"};yc.prototype.ud=function(a){return!a};function zc(a,b){tc.call(this,a,b)}u(zc,tc);zc.prototype.pd=function(){return"-"};zc.prototype.ud=function(a){return-a};function Ac(a,b,c){C.call(this,a,b,c)}u(Ac,uc);Ac.prototype.Da=function(){return"&&"};
Ac.prototype.Pa=function(a){return this.d.evaluate(a)&&this.e.evaluate(a)};function Bc(a,b,c){C.call(this,a,b,c)}u(Bc,Ac);Bc.prototype.Da=function(){return" and "};function Cc(a,b,c){C.call(this,a,b,c)}u(Cc,uc);Cc.prototype.Da=function(){return"||"};Cc.prototype.Pa=function(a){return this.d.evaluate(a)||this.e.evaluate(a)};function Dc(a,b,c){C.call(this,a,b,c)}u(Dc,Cc);Dc.prototype.Da=function(){return", "};function Ec(a,b,c){C.call(this,a,b,c)}u(Ec,vc);Ec.prototype.Da=function(){return"<"};
Ec.prototype.Ua=function(a,b){return a<b};function Fc(a,b,c){C.call(this,a,b,c)}u(Fc,vc);Fc.prototype.Da=function(){return"<="};Fc.prototype.Ua=function(a,b){return a<=b};function Gc(a,b,c){C.call(this,a,b,c)}u(Gc,vc);Gc.prototype.Da=function(){return">"};Gc.prototype.Ua=function(a,b){return a>b};function Hc(a,b,c){C.call(this,a,b,c)}u(Hc,vc);Hc.prototype.Da=function(){return">="};Hc.prototype.Ua=function(a,b){return a>=b};function Ic(a,b,c){C.call(this,a,b,c)}u(Ic,vc);Ic.prototype.Da=function(){return"=="};
Ic.prototype.Ua=function(a,b){return a==b};function Jc(a,b,c){C.call(this,a,b,c)}u(Jc,vc);Jc.prototype.Da=function(){return"!="};Jc.prototype.Ua=function(a,b){return a!=b};function Kc(a,b,c){C.call(this,a,b,c)}u(Kc,wc);Kc.prototype.Da=function(){return"+"};Kc.prototype.Ua=function(a,b){return a+b};function Lc(a,b,c){C.call(this,a,b,c)}u(Lc,wc);Lc.prototype.Da=function(){return" - "};Lc.prototype.Ua=function(a,b){return a-b};function Mc(a,b,c){C.call(this,a,b,c)}u(Mc,xc);Mc.prototype.Da=function(){return"*"};
Mc.prototype.Ua=function(a,b){return a*b};function Nc(a,b,c){C.call(this,a,b,c)}u(Nc,xc);Nc.prototype.Da=function(){return"/"};Nc.prototype.Ua=function(a,b){return a/b};function Oc(a,b,c){C.call(this,a,b,c)}u(Oc,xc);Oc.prototype.Da=function(){return"%"};Oc.prototype.Ua=function(a,b){return a%b};function Pc(a,b,c){rc.call(this,a);this.C=b;this.ha=c.toLowerCase()}u(Pc,rc);Pc.prototype.pa=function(a){a.append(this.C.toString());a.append(Ka(this.ha))};
Pc.prototype.Pa=function(a){return this.C*nc(a,this.ha,!1)};function Qc(a,b){rc.call(this,a);this.d=b}u(Qc,rc);Qc.prototype.pa=function(a){a.append(this.d)};Qc.prototype.Pa=function(a){return oc(a,this.b,this.d).evaluate(a)};Qc.prototype.Ab=function(a,b,c){return a===this||sc(oc(b,this.b,this.d),a,b,c)};function Rc(a,b,c){rc.call(this,a);this.d=b;this.name=c}u(Rc,rc);Rc.prototype.pa=function(a){this.d&&a.append("not ");a.append(Ka(this.name))};
Rc.prototype.Pa=function(a){var b=this.name;a="all"===b||!!a.T.sd[b];return this.d?!a:a};Rc.prototype.Ab=function(a,b,c){return a===this||sc(this.value,a,b,c)};Rc.prototype.wd=function(){return!0};function gc(a,b,c){rc.call(this,a);this.Ib=b;this.d=c}u(gc,rc);gc.prototype.pa=function(a){a.append(this.d)};gc.prototype.Pa=function(a){return this.Ib.call(a)};function Sc(a,b,c){rc.call(this,a);this.e=b;this.d=c}u(Sc,rc);
Sc.prototype.pa=function(a){a.append(this.e);var b=this.d;a.append("(");for(var c=0;c<b.length;c++)c&&a.append(","),b[c].pa(a,0);a.append(")")};Sc.prototype.Pa=function(a){return pc(a,this.b,this.e,this.d,!1).Fa(a,this.d).evaluate(a)};Sc.prototype.Ab=function(a,b,c){if(a===this)return!0;for(var d=0;d<this.d.length;d++)if(sc(this.d[d],a,b,c))return!0;return sc(pc(b,this.b,this.e,this.d,!0),a,b,c)};
Sc.prototype.Fa=function(a,b){for(var c,d=c=this.d,e=0;e<c.length;e++){var f=c[e].Fa(a,b);if(c!==d)d[e]=f;else if(f!==c[e]){for(var d=Array(c.length),g=0;g<e;g++)d[g]=c[g];d[e]=f}}c=d;return c===this.d?this:new Sc(this.b,this.e,c)};function Tc(a,b,c,d){rc.call(this,a);this.d=b;this.g=c;this.e=d}u(Tc,rc);Tc.prototype.pa=function(a,b){0<b&&a.append("(");this.d.pa(a,0);a.append("?");this.g.pa(a,0);a.append(":");this.e.pa(a,0);0<b&&a.append(")")};
Tc.prototype.Pa=function(a){return this.d.evaluate(a)?this.g.evaluate(a):this.e.evaluate(a)};Tc.prototype.Ab=function(a,b,c){return a===this||sc(this.d,a,b,c)||sc(this.g,a,b,c)||sc(this.e,a,b,c)};Tc.prototype.Fa=function(a,b){var c=this.d.Fa(a,b),d=this.g.Fa(a,b),e=this.e.Fa(a,b);return c===this.d&&d===this.g&&e===this.e?this:new Tc(this.b,c,d,e)};function B(a,b){rc.call(this,a);this.d=b}u(B,rc);
B.prototype.pa=function(a){switch(typeof this.d){case "number":case "boolean":a.append(this.d.toString());break;case "string":a.append('"');a.append(La(this.d));a.append('"');break;default:throw Error("F_UNEXPECTED_STATE");}};B.prototype.Pa=function(){return this.d};function Uc(a,b,c){rc.call(this,a);this.name=b;this.value=c}u(Uc,rc);Uc.prototype.pa=function(a){a.append("(");a.append(La(this.name.name));a.append(":");this.value.pa(a,0);a.append(")")};
Uc.prototype.Pa=function(a){return qc(a,this.name.name,this.value)};Uc.prototype.Ab=function(a,b,c){return a===this||sc(this.value,a,b,c)};Uc.prototype.Fa=function(a,b){var c=this.value.Fa(a,b);return c===this.value?this:new Uc(this.b,this.name,c)};function Vc(a,b){rc.call(this,a);this.d=b}u(Vc,rc);Vc.prototype.pa=function(a){a.append("$");a.append(this.d.toString())};Vc.prototype.Fa=function(a,b){var c=b[this.d];if(!c)throw Error("Parameter missing: "+this.d);return c};
function Wc(a,b,c){return b===a.f||b===a.b||c==a.f||c==a.b?a.f:b===a.g||b===a.d?c:c===a.g||c===a.d?b:new Ac(a,b,c)}function D(a,b,c){return b===a.b?c:c===a.b?b:new Kc(a,b,c)}function E(a,b,c){return b===a.b?new zc(a,c):c===a.b?b:new Lc(a,b,c)}function Xc(a,b,c){return b===a.b||c===a.b?a.b:b===a.d?c:c===a.d?b:new Mc(a,b,c)}function Yc(a,b,c){return b===a.b?a.b:c===a.d?b:new Nc(a,b,c)};var Zc={};function $c(){}n=$c.prototype;n.vb=function(a){for(var b=0;b<a.length;b++)a[b].U(this)};n.ld=function(){throw Error("E_CSS_EMPTY_NOT_ALLOWED");};n.md=function(){throw Error("E_CSS_SLASH_NOT_ALLOWED");};n.hc=function(){throw Error("E_CSS_STR_NOT_ALLOWED");};n.ub=function(){throw Error("E_CSS_IDENT_NOT_ALLOWED");};n.Rb=function(){throw Error("E_CSS_NUMERIC_NOT_ALLOWED");};n.Qb=function(){throw Error("E_CSS_NUM_NOT_ALLOWED");};n.Pb=function(a){return this.Qb(a)};
n.Hc=function(){throw Error("E_CSS_COLOR_NOT_ALLOWED");};n.ic=function(){throw Error("E_CSS_URL_NOT_ALLOWED");};n.fb=function(){throw Error("E_CSS_LIST_NOT_ALLOWED");};n.tb=function(){throw Error("E_CSS_COMMA_NOT_ALLOWED");};n.jb=function(){throw Error("E_CSS_FUNC_NOT_ALLOWED");};n.Ob=function(){throw Error("E_CSS_EXPR_NOT_ALLOWED");};function ad(){}u(ad,$c);n=ad.prototype;
n.vb=function(a){for(var b=null,c=0;c<a.length;c++){var d=a[c],e=d.U(this);if(b)b[c]=e;else if(d!==e){b=Array(a.length);for(d=0;d<c;d++)b[d]=a[d];b[c]=e}}return b||a};n.hc=function(a){return a};n.ub=function(a){return a};n.md=function(a){return a};n.Rb=function(a){return a};n.Qb=function(a){return a};n.Pb=function(a){return a};n.Hc=function(a){return a};n.ic=function(a){return a};n.fb=function(a){var b=this.vb(a.values);return b===a.values?a:new bd(b)};
n.tb=function(a){var b=this.vb(a.values);return b===a.values?a:new cd(b)};n.jb=function(a){var b=this.vb(a.values);return b===a.values?a:new dd(a.name,b)};n.Ob=function(a){return a};function ed(){}n=ed.prototype;n.toString=function(){var a=new Ia;this.Aa(a,!0);return a.toString()};n.stringValue=function(){var a=new Ia;this.Aa(a,!1);return a.toString()};n.ja=function(){throw Error("F_ABSTRACT");};n.Aa=function(a){a.append("[error]")};n.vd=function(){return!1};n.Xb=function(){return!1};n.xd=function(){return!1};
n.Kd=function(){return!1};n.Yc=function(){return!1};function fd(){if(G)throw Error("E_INVALID_CALL");}u(fd,ed);fd.prototype.ja=function(a){return new B(a,"")};fd.prototype.Aa=function(){};fd.prototype.U=function(a){return a.ld(this)};var G=new fd;function gd(){if(hd)throw Error("E_INVALID_CALL");}u(gd,ed);gd.prototype.ja=function(a){return new B(a,"/")};gd.prototype.Aa=function(a){a.append("/")};gd.prototype.U=function(a){return a.md(this)};var hd=new gd;function id(a){this.b=a}u(id,ed);
id.prototype.ja=function(a){return new B(a,this.b)};id.prototype.Aa=function(a,b){b?(a.append('"'),a.append(La(this.b)),a.append('"')):a.append(this.b)};id.prototype.U=function(a){return a.hc(this)};function jd(a){this.name=a;if(Zc[a])throw Error("E_INVALID_CALL");Zc[a]=this}u(jd,ed);jd.prototype.ja=function(a){return new B(a,this.name)};jd.prototype.Aa=function(a,b){b?a.append(Ka(this.name)):a.append(this.name)};jd.prototype.U=function(a){return a.ub(this)};jd.prototype.Kd=function(){return!0};
function H(a){var b=Zc[a];b||(b=new jd(a));return b}function I(a,b){this.C=a;this.ha=b.toLowerCase()}u(I,ed);I.prototype.ja=function(a,b){return 0==this.C?a.b:b&&"%"==this.ha?100==this.C?b:new Mc(a,b,new B(a,this.C/100)):new Pc(a,this.C,this.ha)};I.prototype.Aa=function(a){a.append(this.C.toString());a.append(this.ha)};I.prototype.U=function(a){return a.Rb(this)};I.prototype.Xb=function(){return!0};function kd(a){this.C=a}u(kd,ed);
kd.prototype.ja=function(a){return 0==this.C?a.b:1==this.C?a.d:new B(a,this.C)};kd.prototype.Aa=function(a){a.append(this.C.toString())};kd.prototype.U=function(a){return a.Qb(this)};kd.prototype.xd=function(){return!0};function ld(a){this.C=a}u(ld,kd);ld.prototype.U=function(a){return a.Pb(this)};function md(a){this.b=a}u(md,ed);md.prototype.Aa=function(a){a.append("#");var b=this.b.toString(16);a.append("000000".substr(b.length));a.append(b)};md.prototype.U=function(a){return a.Hc(this)};
function nd(a){this.url=a}u(nd,ed);nd.prototype.Aa=function(a){a.append('url("');a.append(La(this.url));a.append('")')};nd.prototype.U=function(a){return a.ic(this)};function od(a,b,c,d){var e=b.length;b[0].Aa(a,d);for(var f=1;f<e;f++)a.append(c),b[f].Aa(a,d)}function bd(a){this.values=a}u(bd,ed);bd.prototype.Aa=function(a,b){od(a,this.values," ",b)};bd.prototype.U=function(a){return a.fb(this)};bd.prototype.Yc=function(){return!0};function cd(a){this.values=a}u(cd,ed);
cd.prototype.Aa=function(a,b){od(a,this.values,",",b)};cd.prototype.U=function(a){return a.tb(this)};function dd(a,b){this.name=a;this.values=b}u(dd,ed);dd.prototype.Aa=function(a,b){a.append(Ka(this.name));a.append("(");od(a,this.values,",",b);a.append(")")};dd.prototype.U=function(a){return a.jb(this)};function J(a){this.d=a}u(J,ed);J.prototype.ja=function(){return this.d};J.prototype.Aa=function(a){a.append("-epubx-expr(");this.d.pa(a,0);a.append(")")};J.prototype.U=function(a){return a.Ob(this)};
J.prototype.vd=function(){return!0};function pd(a,b){if(a){if(a.Xb())return nc(b,a.ha,!1)*a.C;if(a.xd())return a.C}return 0}var qd=H("absolute"),rd=H("all"),sd=H("always"),td=H("auto");H("avoid");var ud=H("block"),vd=H("block-end"),wd=H("block-start"),xd=H("both"),yd=H("bottom"),zd=H("crop"),Ad=H("cross"),Bd=H("exclusive"),Cd=H("false"),Dd=H("fixed"),Ed=H("flex"),Fd=H("footnote");H("hidden");
var Gd=H("horizontal-tb"),Hd=H("inherit"),Id=H("inline"),Jd=H("inline-block"),Kd=H("inline-end"),Ld=H("inline-start"),Md=H("landscape"),Nd=H("left"),Od=H("list-item"),Pd=H("ltr"),Qd=H("none"),Rd=H("normal"),Sd=H("oeb-page-foot"),Td=H("oeb-page-head"),Ud=H("page"),Vd=H("relative"),Wd=H("right"),Xd=H("scale"),Yd=H("static"),Zd=H("rtl");H("table");
var $d=H("table-caption"),ae=H("table-cell"),be=H("table-row"),ce=H("top"),de=H("transparent"),ee=H("vertical-lr"),fe=H("vertical-rl"),ge=H("visible"),he=H("true"),ie=new I(100,"%"),je=new I(100,"vw"),ke=new I(100,"vh"),le=new I(0,"px"),me={"font-size":1,color:2};function ne(a,b){return(me[a]||Number.MAX_VALUE)-(me[b]||Number.MAX_VALUE)};function oe(a,b,c,d){this.aa=a;this.W=b;this.V=c;this.R=d}function pe(a,b){this.x=a;this.y=b}function qe(){this.bottom=this.right=this.top=this.left=0}function re(a,b,c,d){this.b=a;this.d=b;this.f=c;this.e=d}function se(a,b,c,d){this.W=a;this.R=b;this.aa=c;this.V=d;this.right=this.left=null}function te(a,b){return a.b.y-b.b.y||a.b.x-b.b.x}function ue(a){this.b=a}function ve(a,b,c){a=a.b;for(var d=a.length,e=a[d-1],f=0;f<d;f++){var g=a[f];b.push(e.y<g.y?new re(e,g,1,c):new re(g,e,-1,c));e=g}}
function we(a,b,c){for(var d=[],e=0;e<a.b.length;e++){var f=a.b[e];d.push(new pe(f.x+b,f.y+c))}return new ue(d)}function xe(a,b,c,d){for(var e=[],f=0;20>f;f++){var g=2*f*Math.PI/20;e.push(new pe(a+c*Math.sin(g),b+d*Math.cos(g)))}return new ue(e)}function ye(a,b,c,d){return new ue([new pe(a,b),new pe(c,b),new pe(c,d),new pe(a,d)])}function ze(a,b,c,d){this.x=a;this.e=b;this.b=c;this.d=d}
function Ae(a,b){var c=a.b.x+(a.d.x-a.b.x)*(b-a.b.y)/(a.d.y-a.b.y);if(isNaN(c))throw Error("Bad intersection");return c}function Be(a,b,c,d){var e,f;b.d.y<c&&v.b("Error: inconsistent segment (1)");b.b.y<=c?(c=Ae(b,c),e=b.f):(c=b.b.x,e=0);b.d.y>=d?(d=Ae(b,d),f=b.f):(d=b.d.x,f=0);c<d?(a.push(new ze(c,e,b.e,-1)),a.push(new ze(d,f,b.e,1))):(a.push(new ze(d,f,b.e,-1)),a.push(new ze(c,e,b.e,1)))}
function Ce(a,b,c){c=b+c;for(var d=Array(c),e=Array(c),f=0;f<=c;f++)d[f]=0,e[f]=0;for(var g=[],h=!1,l=a.length,k=0;k<l;k++){var m=a[k];d[m.b]+=m.e;e[m.b]+=m.d;for(var p=!1,f=0;f<b;f++)if(d[f]&&!e[f]){p=!0;break}if(p)for(f=b;f<=c;f++)if(d[f]||e[f]){p=!1;break}h!=p&&(g.push(m.x),h=p)}return g}function De(a,b){return b?Math.ceil(a/b)*b:a}function Ee(a,b){return b?Math.floor(a/b)*b:a}function Fe(a){return new pe(a.y,-a.x)}function Ge(a){return new oe(a.W,-a.V,a.R,-a.aa)}
function He(a){return new ue(Va(a.b,Fe))}
function Ie(a,b,c,d,e){e&&(a=Ge(a),b=Va(b,He),c=Va(c,He));e=b.length;var f=c?c.length:0,g=[],h=[],l,k,m;for(l=0;l<e;l++)ve(b[l],h,l);for(l=0;l<f;l++)ve(c[l],h,l+e);b=h.length;h.sort(te);for(c=0;h[c].e>=e;)c++;c=h[c].b.y;c>a.W&&g.push(new se(a.W,c,a.V,a.V));l=0;for(var p=[];l<b&&(m=h[l]).b.y<c;)m.d.y>c&&p.push(m),l++;for(;l<b||0<p.length;){var r=a.R,t=De(Math.ceil(c+8),d);for(k=0;k<p.length&&r>t;k++)m=p[k],m.b.x==m.d.x?m.d.y<r&&(r=Math.max(Ee(m.d.y,d),t)):m.b.x!=m.d.x&&(r=t);r>a.R&&(r=a.R);for(;l<
b&&(m=h[l]).b.y<r;)if(m.d.y<c)l++;else if(m.b.y<t){if(m.b.y!=m.d.y||m.b.y!=c)p.push(m),r=t;l++}else{k=Ee(m.b.y,d);k<r&&(r=k);break}t=[];for(k=0;k<p.length;k++)Be(t,p[k],c,r);t.sort(function(a,b){return a.x-b.x||a.d-b.d});t=Ce(t,e,f);if(0==t.length)g.push(new se(c,r,a.V,a.V));else{var q=0,x=a.aa;for(k=0;k<t.length;k+=2){var R=Math.max(a.aa,t[k]),Q=Math.min(a.V,t[k+1])-R;Q>q&&(q=Q,x=R)}0==q?g.push(new se(c,r,a.V,a.V)):g.push(new se(c,r,Math.max(x,a.aa),Math.min(x+q,a.V)))}if(r==a.R)break;c=r;for(k=
p.length-1;0<=k;k--)p[k].d.y<=r&&p.splice(k,1)}Je(a,g);return g}function Je(a,b){for(var c=b.length-1,d=new se(a.R,a.R,a.aa,a.V);0<=c;){var e=d,d=b[c];d.aa==e.aa&&d.V==e.V&&(e.W=d.W,b.splice(c,1),d=e);c--}}function Ke(a,b){for(var c=0,d=a.length;c<d;){var e=Math.floor((c+d)/2);b>=a[e].R?c=e+1:d=e}return c}
function Le(a,b,c,d){for(var e=c.W,f=c.V-c.aa,g=c.R-c.W,h=Ke(b,e);;){var l=e+g;if(l>a.R)break;for(var k=a.aa,m=a.V,p=h;p<b.length&&b[p].W<l;p++){var r=b[p];r.aa>k&&(k=r.aa);r.V<m&&(m=r.V)}if(k+f<=m||h>=b.length){"left"==d?(c.aa=k,c.V=k+f):(c.aa=m-f,c.V=m);c.R+=e-c.W;c.W=e;break}e=b[h].R;h++}}
function Me(a,b,c,d){for(var e=null,e=[new se(c.W,c.R,c.aa,c.V)];0<e.length&&e[0].R<=a.W;)e.shift();if(0!=e.length){e[0].W<a.W&&(e[0].W=a.W);c=0==b.length?a.W:b[b.length-1].R;c<a.R&&b.push(new se(c,a.R,a.aa,a.V));for(var f=Ke(b,e[0].W),g=0;g<e.length;g++){var h=e[g];if(f==b.length)break;b[f].W<h.W&&(c=b[f],f++,b.splice(f,0,new se(h.W,c.R,c.aa,c.V)),c.R=h.W);for(;f<b.length&&(c=b[f++],c.R>h.R&&(b.splice(f,0,new se(h.R,c.R,c.aa,c.V)),c.R=h.R),h.aa!=h.V&&("left"==d?c.aa=Math.min(h.V,a.V):c.V=Math.max(h.aa,
a.aa)),c.R!=h.R););}Je(a,b)}};function Ne(a){return String.fromCharCode(a>>>24&255,a>>>16&255,a>>>8&255,a&255)}
function Oe(a){var b=new Ia;b.append(a);var c=55-a.length&63;for(b.append("\u0080");0<c;)c--,b.append("\x00");b.append("\x00\x00\x00\x00");b.append(Ne(8*a.length));a=b.toString();for(var b=[1732584193,4023233417,2562383102,271733878,3285377520],c=[],d,e=0;e<a.length;e+=64){for(d=0;16>d;d++){var f=a.substr(e+4*d,4);c[d]=(f.charCodeAt(0)&255)<<24|(f.charCodeAt(1)&255)<<16|(f.charCodeAt(2)&255)<<8|f.charCodeAt(3)&255}for(;80>d;d++)f=c[d-3]^c[d-8]^c[d-14]^c[d-16],c[d]=f<<1|f>>>31;var f=b[0],g=b[1],h=
b[2],l=b[3],k=b[4],m;for(d=0;80>d;d++)m=20>d?(g&h|~g&l)+1518500249:40>d?(g^h^l)+1859775393:60>d?(g&h|g&l|h&l)+2400959708:(g^h^l)+3395469782,m+=(f<<5|f>>>27)+k+c[d],k=l,l=h,h=g<<30|g>>>2,g=f,f=m;b[0]=b[0]+f|0;b[1]=b[1]+g|0;b[2]=b[2]+h|0;b[3]=b[3]+l|0;b[4]=b[4]+k|0}return b}function Pe(a){a=Oe(a);for(var b=[],c=0;c<a.length;c++){var d=a[c];b.push(d>>>24&255,d>>>16&255,d>>>8&255,d&255)}return b}
function Qe(a){a=Oe(a);for(var b=new Ia,c=0;c<a.length;c++)b.append(Ne(a[c]));a=b.toString();b=new Ia;for(c=0;c<a.length;c++)b.append((a.charCodeAt(c)|256).toString(16).substr(1));return b.toString()};var Re=null,Se=null;function K(a){if(!Re)throw Error("E_TASK_NO_CONTEXT");Re.name||(Re.name=a);var b=Re;a=new Te(b,b.top,a);b.top=a;a.b=Ue;return a}function L(a){return new Ve(a)}function We(a,b,c){a=K(a);a.g=c;try{b(a)}catch(d){Xe(a.d,d,a)}return M(a)}function Ye(a){var b=Ze,c;Re?c=Re.d:(c=Se)||(c=new $e(new af));b(c,a,void 0)}var Ue=1;function af(){}af.prototype.currentTime=function(){return(new Date).valueOf()};function bf(a,b){return setTimeout(a,b)}
function $e(a){this.e=a;this.f=1;this.slice=25;this.h=0;this.d=new Aa;this.b=this.j=null;this.g=!1;this.Q=0;Se||(Se=this)}
function cf(a){if(!a.g){var b=a.d.b[1].b,c=a.e.currentTime();if(null!=a.b){if(c+a.f>a.j)return;clearTimeout(a.b)}b-=c;b<=a.f&&(b=a.f);a.j=c+b;a.b=bf(function(){a.b=null;null!=a.b&&(clearTimeout(a.b),a.b=null);a.g=!0;try{var b=a.e.currentTime();for(a.h=b+a.slice;a.d.length();){var c=a.d.b[1];if(c.b>b)break;var f=a.d,g=f.b.pop(),h=f.b.length;if(1<h){for(var l=1;;){var k=2*l;if(k>=h)break;if(0<df(f.b[k],g))k+1<h&&0<df(f.b[k+1],f.b[k])&&k++;else if(k+1<h&&0<df(f.b[k+1],g))k++;else break;f.b[l]=f.b[k];
l=k}f.b[l]=g}var l=c,m=l.d;l.d=null;m&&m.e==l&&(m.e=null,k=Re,Re=m,N(m.top,l.e),Re=k);b=a.e.currentTime();if(b>=a.h)break}}catch(p){v.error(p)}a.g=!1;a.d.length()&&cf(a)},b)}}$e.prototype.Va=function(a,b){var c=this.e.currentTime();a.Q=this.Q++;a.b=c+(b||0);a:{for(var c=this.d,d=c.b.length;1<d;){var e=Math.floor(d/2),f=c.b[e];if(0<df(f,a)){c.b[d]=a;break a}c.b[d]=f;d=e}c.b[1]=a}cf(this)};
function Ze(a,b,c){var d=new ef(a,c||"");d.top=new Te(d,null,"bootstrap");d.top.b=Ue;d.top.then(function(){function a(){d.h=!1;for(var b=0;b<d.g.length;b++){var c=d.g[b];try{c()}catch(e){v.error(e)}}}try{b().then(function(b){d.f=b;a()})}catch(c){Xe(d,c),a()}});c=Re;Re=d;a.Va(ff(d.top,"bootstrap"));Re=c;return d}function gf(a){this.d=a;this.Q=this.b=0;this.e=null}function df(a,b){return b.b-a.b||b.Q-a.Q}gf.prototype.Va=function(a,b){this.e=a;this.d.d.Va(this,b)};
function ef(a,b){this.d=a;this.name=b;this.g=[];this.b=null;this.h=!0;this.e=this.top=this.j=this.f=null}function hf(a,b){a.g.push(b)}ef.prototype.join=function(){var a=K("Task.join");if(this.h){var b=ff(a,this),c=this;hf(this,function(){b.Va(c.f)})}else N(a,this.f);return M(a)};
function Xe(a,b,c){var d=b.frameTrace;if(!d){for(var d=b.stack?b.stack+"\n\t---- async ---\n":"",e=a.top;e;e=e.parent)d+="\t",d+=e.name,d+="\n";b.frameTrace=d}if(c){for(d=a.top;d&&d!=c;)d=d.parent;d==c&&(a.top=d)}for(a.b=b;a.top&&!a.top.g;)a.top=a.top.parent;a.top?(b=a.b,a.b=null,a.top.g(a.top,b)):a.b&&v.error(a.b,"Unhandled exception in task",a.name)}function Ve(a){this.value=a}n=Ve.prototype;n.then=function(a){a(this.value)};n.Fc=function(a){return a(this.value)};n.jd=function(a){return new Ve(a)};
n.ua=function(a){N(a,this.value)};n.Ca=function(){return!1};n.mc=function(){return this.value};function jf(a){this.b=a}n=jf.prototype;n.then=function(a){this.b.then(a)};n.Fc=function(a){if(this.Ca()){var b=new Te(this.b.d,this.b.parent,"AsyncResult.thenAsync");b.b=Ue;this.b.parent=b;this.b.then(function(c){a(c).then(function(a){N(b,a)})});return M(b)}return a(this.b.e)};n.jd=function(a){return this.Ca()?this.Fc(function(){return new Ve(a)}):new Ve(a)};
n.ua=function(a){this.Ca()?this.then(function(b){N(a,b)}):N(a,this.b.e)};n.Ca=function(){return this.b.b==Ue};n.mc=function(){if(this.Ca())throw Error("Result is pending");return this.b.e};function Te(a,b,c){this.d=a;this.parent=b;this.name=c;this.e=null;this.b=0;this.g=this.f=null}function kf(a){if(!Re)throw Error("F_TASK_NO_CONTEXT");if(a!==Re.top)throw Error("F_TASK_NOT_TOP_FRAME");}function M(a){return new jf(a)}
function N(a,b){kf(a);Re.b||(a.e=b);a.b=2;var c=a.parent;Re.top=c;if(a.f){try{a.f(b)}catch(d){Xe(a.d,d,c)}a.b=3}}Te.prototype.then=function(a){switch(this.b){case Ue:if(this.f)throw Error("F_TASK_FRAME_ALREADY_HAS_CALLBACK");this.f=a;break;case 2:var b=this.d,c=this.parent;try{a(this.e),this.b=3}catch(d){this.b=3,Xe(b,d,c)}break;case 3:throw Error("F_TASK_DEAD_FRAME");default:throw Error("F_TASK_UNEXPECTED_FRAME_STATE "+this.b);}};
function lf(){var a=K("Frame.timeSlice"),b=a.d.d;b.e.currentTime()>=b.h?(v.debug("-- time slice --"),ff(a).Va(!0)):N(a,!0);return M(a)}function mf(a){function b(d){try{for(;d;){var e=a();if(e.Ca()){e.then(b);return}e.then(function(a){d=a})}N(c,!0)}catch(f){Xe(c.d,f,c)}}var c=K("Frame.loop");b(!0);return M(c)}function nf(a){var b=Re;if(!b)throw Error("E_TASK_NO_CONTEXT");return mf(function(){var c;do c=new of(b,b.top),b.top=c,c.b=Ue,a(c),c=M(c);while(!c.Ca()&&c.mc());return c})}
function ff(a,b){kf(a);if(a.d.e)throw Error("E_TASK_ALREADY_SUSPENDED");var c=new gf(a.d);a.d.e=c;Re=null;a.d.j=b||null;return c}function of(a,b){Te.call(this,a,b,"loop")}u(of,Te);function pf(a){N(a,!0)}function O(a){N(a,!1)};function qf(a,b,c,d,e){var f=K("ajax"),g=new XMLHttpRequest,h=ff(f,g),l={status:0,url:a,contentType:null,responseText:null,responseXML:null,wc:null};g.open(c||"GET",a,!0);b&&(g.responseType=b);g.onreadystatechange=function(){if(4===g.readyState){l.status=g.status;if(200==l.status||0==l.status)if(b&&"document"!==b||!g.responseXML){var c=g.response;b&&"text"!==b||"string"!=typeof c?c?"string"==typeof c?l.wc=rf([c]):l.wc=c:v.b("Unexpected empty success response for",a):l.responseText=c;if(c=g.getResponseHeader("Content-Type"))l.contentType=
c.replace(/(.*);.*$/,"$1")}else l.responseXML=g.responseXML,l.contentType=g.responseXML.contentType;h.Va(l)}};try{d?(g.setRequestHeader("Content-Type",e||"text/plain; charset=UTF-8"),g.send(d)):g.send(null)}catch(k){v.b(k,"Error fetching "+a),h.Va(l)}return M(f)}function rf(a){var b=window.WebKitBlobBuilder||window.MSBlobBuilder;if(b){for(var b=new b,c=0;c<a.length;c++)b.append(a[c]);return b.getBlob("application/octet-stream")}return new Blob(a,{type:"application/octet-stream"})}
function sf(a){var b=K("readBlob"),c=new FileReader,d=ff(b,c);c.addEventListener("load",function(){d.Va(c.result)},!1);c.readAsArrayBuffer(a);return M(b)}function tf(a,b){this.I=a;this.type=b;this.g={};this.e={}}tf.prototype.load=function(a,b,c){a=ta(a);var d=this.g[a];return"undefined"!=typeof d?L(d):uf(this.qc(a,b,c))};
function vf(a,b,c,d){var e=K("fetch");qf(b,a.type).then(function(f){if(c&&400<=f.status)throw Error(d||"Failed to fetch required resource: "+b);a.I(f,a).then(function(c){delete a.e[b];a.g[b]=c;N(e,c)})});return M(e)}tf.prototype.qc=function(a,b,c){a=ta(a);if(this.g[a])return null;var d=this.e[a];if(!d){var e=this,d=new wf(function(){return vf(e,a,b,c)},"Fetch "+a);e.e[a]=d;d.start()}return d};function xf(a){a=a.responseText;return L(a?JSON.parse(a):null)};function yf(a){var b=parseInt(a,16);if(isNaN(b))throw Error("E_CSS_COLOR");if(6==a.length)return new md(b);if(3==a.length)return new md(b&15|(b&15)<<4|(b&240)<<4|(b&240)<<8|(b&3840)<<8|(b&3840)<<12);throw Error("E_CSS_COLOR");}function zf(a){this.d=a;this.ab="Author"}n=zf.prototype;n.Vb=function(){return null};n.X=function(){return this.d};n.error=function(){};n.Nb=function(a){this.ab=a};n.hb=function(){};n.Oc=function(){};n.Zb=function(){};n.$b=function(){};n.Uc=function(){};n.nc=function(){};
n.lb=function(){};n.Nc=function(){};n.Mc=function(){};n.Rc=function(){};n.Jb=function(){};n.eb=function(){};n.Ac=function(){};n.cc=function(){};n.Ec=function(){};n.yc=function(){};n.Dc=function(){};n.Mb=function(){};n.hd=function(){};n.Cb=function(){};n.zc=function(){};n.Cc=function(){};n.Bc=function(){};n.fc=function(){};n.ec=function(){};n.ra=function(){};n.bb=function(){};n.mb=function(){};n.dc=function(){};n.oc=function(){};
function Af(a){switch(a.ab){case "UA":return 0;case "User":return 100663296;default:return 83886080}}function Bf(a){switch(a.ab){case "UA":return 0;case "User":return 16777216;default:return 33554432}}function Cf(){zf.call(this,null);this.e=[];this.b=null}u(Cf,zf);function Df(a,b){a.e.push(a.b);a.b=b}n=Cf.prototype;n.Vb=function(){return null};n.X=function(){return this.b.X()};n.error=function(a,b){this.b.error(a,b)};
n.Nb=function(a){zf.prototype.Nb.call(this,a);0<this.e.length&&(this.b=this.e[0],this.e=[]);this.b.Nb(a)};n.hb=function(a,b){this.b.hb(a,b)};n.Oc=function(a){this.b.Oc(a)};n.Zb=function(a,b){this.b.Zb(a,b)};n.$b=function(a,b){this.b.$b(a,b)};n.Uc=function(a){this.b.Uc(a)};n.nc=function(a,b,c,d){this.b.nc(a,b,c,d)};n.lb=function(){this.b.lb()};n.Nc=function(){this.b.Nc()};n.Mc=function(){this.b.Mc()};n.Rc=function(){this.b.Rc()};n.Jb=function(){this.b.Jb()};n.eb=function(){this.b.eb()};n.Ac=function(){this.b.Ac()};
n.cc=function(a){this.b.cc(a)};n.Ec=function(){this.b.Ec()};n.yc=function(){this.b.yc()};n.Dc=function(){this.b.Dc()};n.Mb=function(){this.b.Mb()};n.hd=function(a){this.b.hd(a)};n.Cb=function(a){this.b.Cb(a)};n.zc=function(a){this.b.zc(a)};n.Cc=function(){this.b.Cc()};n.Bc=function(a,b,c){this.b.Bc(a,b,c)};n.fc=function(a,b,c){this.b.fc(a,b,c)};n.ec=function(a,b,c){this.b.ec(a,b,c)};n.ra=function(){this.b.ra()};n.bb=function(a,b,c){this.b.bb(a,b,c)};n.mb=function(){this.b.mb()};n.dc=function(a){this.b.dc(a)};
n.oc=function(){this.b.oc()};function Ef(a,b,c){zf.call(this,a);this.H=c;this.D=0;this.$=b}u(Ef,zf);Ef.prototype.Vb=function(){return this.$.Vb()};Ef.prototype.error=function(a){v.b(a)};Ef.prototype.ra=function(){this.D++};Ef.prototype.mb=function(){if(0==--this.D&&!this.H){var a=this.$;a.b=a.e.pop()}};function Ff(a,b,c){Ef.call(this,a,b,c)}u(Ff,Ef);function Gf(a,b){a.error(b,a.Vb())}function Hf(a,b){Gf(a,b);Df(a.$,new Ef(a.d,a.$,!1))}n=Ff.prototype;n.eb=function(){Hf(this,"E_CSS_UNEXPECTED_SELECTOR")};
n.Ac=function(){Hf(this,"E_CSS_UNEXPECTED_FONT_FACE")};n.cc=function(){Hf(this,"E_CSS_UNEXPECTED_FOOTNOTE")};n.Ec=function(){Hf(this,"E_CSS_UNEXPECTED_VIEWPORT")};n.yc=function(){Hf(this,"E_CSS_UNEXPECTED_DEFINE")};n.Dc=function(){Hf(this,"E_CSS_UNEXPECTED_REGION")};n.Mb=function(){Hf(this,"E_CSS_UNEXPECTED_PAGE")};n.Cb=function(){Hf(this,"E_CSS_UNEXPECTED_WHEN")};n.zc=function(){Hf(this,"E_CSS_UNEXPECTED_FLOW")};n.Cc=function(){Hf(this,"E_CSS_UNEXPECTED_PAGE_TEMPLATE")};n.Bc=function(){Hf(this,"E_CSS_UNEXPECTED_PAGE_MASTER")};
n.fc=function(){Hf(this,"E_CSS_UNEXPECTED_PARTITION")};n.ec=function(){Hf(this,"E_CSS_UNEXPECTED_PARTITION_GROUP")};n.dc=function(){Hf(this,"E_CSS_UNEXPECTED_SELECTOR_FUNC")};n.oc=function(){Hf(this,"E_CSS_UNEXPECTED_END_SELECTOR_FUNC")};n.bb=function(){this.error("E_CSS_UNEXPECTED_PROPERTY",this.Vb())};var If=[],Jf=[],P=[],Kf=[],Lf=[],Mf=[],Nf=[],Of=[],S=[],Pf=[],Qf=[],Rf=[],Sf=[];If[1]=28;If[36]=29;If[7]=29;If[9]=29;If[14]=29;If[18]=29;If[20]=30;If[13]=27;If[0]=200;Jf[1]=46;Jf[0]=200;Mf[1]=2;
Mf[36]=4;Mf[7]=6;Mf[9]=8;Mf[14]=10;Mf[18]=14;P[37]=11;P[23]=12;P[35]=56;P[1]=1;P[36]=3;P[7]=5;P[9]=7;P[14]=9;P[12]=13;P[18]=55;P[50]=42;P[16]=41;Kf[1]=1;Kf[36]=3;Kf[7]=5;Kf[9]=7;Kf[14]=9;Kf[11]=200;Kf[18]=55;Lf[1]=2;Lf[36]=4;Lf[7]=6;Lf[9]=8;Lf[18]=14;Lf[50]=42;Lf[14]=10;Lf[12]=13;Nf[1]=15;Nf[7]=16;Nf[4]=17;Nf[5]=18;Nf[3]=19;Nf[2]=20;Nf[8]=21;Nf[16]=22;Nf[19]=23;Nf[6]=24;Nf[11]=25;Nf[17]=26;Nf[13]=48;Nf[31]=47;Nf[23]=54;Nf[0]=44;Of[1]=31;Of[4]=32;Of[5]=32;Of[3]=33;Of[2]=34;Of[10]=40;Of[6]=38;
Of[31]=36;Of[24]=36;Of[32]=35;S[1]=45;S[16]=37;S[37]=37;S[38]=37;S[47]=37;S[48]=37;S[39]=37;S[49]=37;S[26]=37;S[25]=37;S[23]=37;S[24]=37;S[19]=37;S[21]=37;S[36]=37;S[18]=37;S[22]=37;S[11]=39;S[12]=43;S[17]=49;Pf[0]=200;Pf[12]=50;Pf[13]=51;Pf[14]=50;Pf[15]=51;Pf[10]=50;Pf[11]=51;Pf[17]=53;Qf[0]=200;Qf[12]=50;Qf[13]=52;Qf[14]=50;Qf[15]=51;Qf[10]=50;Qf[11]=51;Qf[17]=53;Rf[0]=200;Rf[12]=50;Rf[13]=51;Rf[14]=50;Rf[15]=51;Rf[10]=50;Rf[11]=51;Sf[11]=0;Sf[16]=0;Sf[22]=1;Sf[18]=1;Sf[26]=2;Sf[25]=2;Sf[38]=3;
Sf[37]=3;Sf[48]=3;Sf[47]=3;Sf[39]=3;Sf[49]=3;Sf[41]=3;Sf[23]=4;Sf[24]=4;Sf[36]=5;Sf[19]=5;Sf[21]=5;Sf[0]=6;Sf[52]=2;function Tf(a,b,c,d){this.b=a;this.d=b;this.j=c;this.ba=d;this.u=[];this.I={};this.e=this.D=null;this.l=!1;this.g=2;this.w=null;this.B=!1;this.k=this.H=null;this.h=[];this.f=[];this.O=this.S=!1}function Uf(a,b){for(var c=[],d=a.u;;){c.push(d[b++]);if(b==d.length)break;if(","!=d[b++])throw Error("Unexpected state");}return c}
function Vf(a,b,c){var d=a.u,e=d.length,f;do f=d[--e];while("undefined"!=typeof f&&"string"!=typeof f);var g=d.length-(e+1);1<g&&d.splice(e+1,g,new bd(d.slice(e+1,d.length)));if(","==b)return null;e++;do f=d[--e];while("undefined"!=typeof f&&("string"!=typeof f||","==f));g=d.length-(e+1);if("("==f){if(")"!=b)return a.j.error("E_CSS_MISMATCHED_C_PAR",c),a.b=Qf,null;a=new dd(d[e-1],Uf(a,e+1));d.splice(e-1,g+2,a);return null}return";"!=b||0<=e?(a.j.error("E_CSS_UNEXPECTED_VAL_END",c),a.b=Qf,null):1<
g?new cd(Uf(a,e+1)):d[0]}function Wf(a,b,c){a.b=a.e?Qf:Pf;a.j.error(b,c)}
function Xf(a,b,c){for(var d=a.u,e=a.j,f=d.pop(),g;;){var h=d.pop();if(11==b){for(g=[f];16==h;)g.unshift(d.pop()),h=d.pop();if("string"==typeof h){if("{"==h){for(;2<=g.length;)a=g.shift(),c=g.shift(),a=new Dc(e.X(),a,c),g.unshift(a);d.push(new J(g[0]));return!0}if("("==h){b=d.pop();f=d.pop();f=new Sc(e.X(),cc(f,b),g);b=0;continue}}if(10==h){f.wd()&&(f=new Uc(e.X(),f,null));b=0;continue}}else if("string"==typeof h){d.push(h);break}if(0>h)if(-31==h)f=new yc(e.X(),f);else if(-24==h)f=new zc(e.X(),f);
else return Wf(a,"F_UNEXPECTED_STATE",c),!1;else{if(Sf[b]>Sf[h]){d.push(h);break}g=d.pop();switch(h){case 26:f=new Ac(e.X(),g,f);break;case 52:f=new Bc(e.X(),g,f);break;case 25:f=new Cc(e.X(),g,f);break;case 38:f=new Ec(e.X(),g,f);break;case 37:f=new Gc(e.X(),g,f);break;case 48:f=new Fc(e.X(),g,f);break;case 47:f=new Hc(e.X(),g,f);break;case 39:case 49:f=new Ic(e.X(),g,f);break;case 41:f=new Jc(e.X(),g,f);break;case 23:f=new Kc(e.X(),g,f);break;case 24:f=new Lc(e.X(),g,f);break;case 36:f=new Mc(e.X(),
g,f);break;case 19:f=new Nc(e.X(),g,f);break;case 21:f=new Oc(e.X(),g,f);break;case 18:if(1<d.length)switch(d[d.length-1]){case 22:d.pop();f=new Tc(e.X(),d.pop(),g,f);break;case 10:if(g.wd())f=new Uc(e.X(),g,f);else return Wf(a,"E_CSS_MEDIA_TEST",c),!1}else return Wf(a,"E_CSS_EXPR_COND",c),!1;break;case 22:if(18!=b)return Wf(a,"E_CSS_EXPR_COND",c),!1;case 10:return d.push(g),d.push(h),d.push(f),!1;default:return Wf(a,"F_UNEXPECTED_STATE",c),!1}}}d.push(f);return!1}
function Yf(a){for(var b=[];;){var c=y(a.d);switch(c.type){case 1:b.push(c.text);break;case 23:b.push("+");break;case 4:case 5:b.push(c.C);break;default:return b}A(a.d)}}
function Zf(a){var b=!1,c=y(a.d);if(23===c.type)b=!0,A(a.d),c=y(a.d);else if(1===c.type&&("even"===c.text||"odd"===c.text))return A(a.d),[2,"odd"===c.text?1:0];switch(c.type){case 3:if(b&&0>c.C)break;case 1:if(b&&"-"===c.text.charAt(0))break;if("n"===c.text||"-n"===c.text){if(b&&c.b)break;b="-n"===c.text?-1:1;3===c.type&&(b=c.C);var d=0;A(a.d);var c=y(a.d),e=24===c.type,f=23===c.type||e;f&&(A(a.d),c=y(a.d));if(5===c.type){d=c.C;if(1/d===1/-0){if(d=0,f)break}else if(0>d){if(f)break}else if(0<=d&&!f)break;
A(a.d)}else if(f)break;return[b,e&&0<d?-d:d]}if("n-"===c.text||"-n-"===c.text){if(b&&c.b)break;b="-n-"===c.text?-1:1;3===c.type&&(b=c.C);A(a.d);c=y(a.d);if(5===c.type&&!(0>c.C||1/c.C===1/-0))return A(a.d),[b,c.C]}else{if(d=c.text.match(/^n(-[0-9]+)$/)){if(b&&c.b)break;A(a.d);return[3===c.type?c.C:1,parseInt(d[1],10)]}if(d=c.text.match(/^-n(-[0-9]+)$/))return A(a.d),[-1,parseInt(d[1],10)]}break;case 5:if(b&&(c.b||0>c.C))break;A(a.d);return[0,c.C]}return null}
function $f(a,b,c){a=a.j.X();if(!a)return null;c=c||a.g;if(b){b=b.split(/\s+/);for(var d=0;d<b.length;d++)switch(b[d]){case "vertical":c=Wc(a,c,new yc(a,new Qc(a,"pref-horizontal")));break;case "horizontal":c=Wc(a,c,new Qc(a,"pref-horizontal"));break;case "day":c=Wc(a,c,new yc(a,new Qc(a,"pref-night-mode")));break;case "night":c=Wc(a,c,new Qc(a,"pref-night-mode"));break;default:c=a.f}}return c===a.g?null:new J(c)}
function ag(a){switch(a.f[a.f.length-1]){case "[selector]":case "font-face":case "-epubx-flow":case "-epubx-viewport":case "-epubx-define":case "-adapt-footnote-area":return!0}return!1}
function bg(a,b,c,d,e,f){var g=a.j,h=a.d,l=a.u,k,m,p,r;e&&(a.g=2,a.u.push("{"));a:for(;0<b;--b)switch(k=y(h),a.b[k.type]){case 28:if(18!=z(h,1).type){ag(a)?(g.error("E_CSS_COLON_EXPECTED",z(h,1)),a.b=Qf):(a.b=Mf,g.eb());continue}m=z(h,2);if(!(m.b||1!=m.type&&6!=m.type)){if(0<=h.b)throw Error("F_CSSTOK_BAD_CALL mark");h.b=h.d}a.e=k.text;a.l=!1;A(h);A(h);a.b=Nf;l.splice(0,l.length);continue;case 46:if(18!=z(h,1).type){a.b=Qf;g.error("E_CSS_COLON_EXPECTED",z(h,1));continue}a.e=k.text;a.l=!1;A(h);A(h);
a.b=Nf;l.splice(0,l.length);continue;case 29:a.b=Mf;g.eb();continue;case 1:if(!k.b){a.b=Rf;g.error("E_CSS_SPACE_EXPECTED",k);continue}g.lb();case 2:if(34==z(h,1).type)if(A(h),A(h),p=a.I[k.text],null!=p)switch(k=y(h),k.type){case 1:g.hb(p,k.text);a.b=f?Kf:P;A(h);break;case 36:g.hb(p,null);a.b=f?Kf:P;A(h);break;default:a.b=Pf,g.error("E_CSS_NAMESPACE",k)}else a.b=Pf,g.error("E_CSS_UNDECLARED_PREFIX",k);else g.hb(a.D,k.text),a.b=f?Kf:P,A(h);continue;case 3:if(!k.b){a.b=Rf;g.error("E_CSS_SPACE_EXPECTED",
k);continue}g.lb();case 4:if(34==z(h,1).type)switch(A(h),A(h),k=y(h),k.type){case 1:g.hb(null,k.text);a.b=f?Kf:P;A(h);break;case 36:g.hb(null,null);a.b=f?Kf:P;A(h);break;default:a.b=Pf,g.error("E_CSS_NAMESPACE",k)}else g.hb(a.D,null),a.b=f?Kf:P,A(h);continue;case 5:k.b&&g.lb();case 6:g.Uc(k.text);a.b=f?Kf:P;A(h);continue;case 7:k.b&&g.lb();case 8:g.Oc(k.text);a.b=f?Kf:P;A(h);continue;case 55:k.b&&g.lb();case 14:A(h);k=y(h);b:switch(k.type){case 1:g.Zb(k.text,null);A(h);a.b=f?Kf:P;continue;case 6:m=
k.text;A(h);switch(m){case "not":a.b=Mf;g.dc("not");bg(a,Number.POSITIVE_INFINITY,!1,!1,!1,!0)?a.b=P:a.b=Rf;break a;case "lang":case "href-epub-type":if(k=y(h),1===k.type){p=[k.text];A(h);break}else break b;case "nth-child":case "nth-of-type":case "nth-last-child":case "nth-last-of-type":if(p=Zf(a))break;else break b;default:p=Yf(a)}k=y(h);if(11==k.type){g.Zb(m,p);A(h);a.b=f?Kf:P;continue}}g.error("E_CSS_PSEUDOCLASS_SYNTAX",k);a.b=Pf;continue;case 42:A(h);k=y(h);switch(k.type){case 1:g.$b(k.text,
null);a.b=f?Kf:P;A(h);continue;case 6:if(m=k.text,A(h),p=Yf(a),k=y(h),11==k.type){g.$b(m,p);a.b=f?Kf:P;A(h);continue}}g.error("E_CSS_PSEUDOELEM_SYNTAX",k);a.b=Pf;continue;case 9:k.b&&g.lb();case 10:A(h);k=y(h);if(1==k.type)m=k.text,A(h);else if(36==k.type)m=null,A(h);else if(34==k.type)m="";else{a.b=Rf;g.error("E_CSS_ATTR",k);A(h);continue}k=y(h);if(34==k.type){p=m?a.I[m]:m;if(null==p){a.b=Rf;g.error("E_CSS_UNDECLARED_PREFIX",k);A(h);continue}A(h);k=y(h);if(1!=k.type){a.b=Rf;g.error("E_CSS_ATTR_NAME_EXPECTED",
k);continue}m=k.text;A(h);k=y(h)}else p="";switch(k.type){case 39:case 45:case 44:case 43:case 42:case 46:case 50:r=k.type;A(h);k=y(h);break;case 15:g.nc(p,m,0,null);a.b=f?Kf:P;A(h);continue;default:a.b=Rf;g.error("E_CSS_ATTR_OP_EXPECTED",k);continue}switch(k.type){case 1:case 2:g.nc(p,m,r,k.text);A(h);k=y(h);break;default:a.b=Rf;g.error("E_CSS_ATTR_VAL_EXPECTED",k);continue}if(15!=k.type){a.b=Rf;g.error("E_CSS_ATTR",k);continue}a.b=f?Kf:P;A(h);continue;case 11:g.Nc();a.b=Lf;A(h);continue;case 12:g.Mc();
a.b=Lf;A(h);continue;case 56:g.Rc();a.b=Lf;A(h);continue;case 13:a.S?(a.f.push("-epubx-region"),a.S=!1):a.O?(a.f.push("page"),a.O=!1):a.f.push("[selector]");g.ra();a.b=If;A(h);continue;case 41:g.Jb();a.b=Mf;A(h);continue;case 15:l.push(H(k.text));A(h);continue;case 16:try{l.push(yf(k.text))}catch(t){g.error("E_CSS_COLOR",k),a.b=Pf}A(h);continue;case 17:l.push(new kd(k.C));A(h);continue;case 18:l.push(new ld(k.C));A(h);continue;case 19:l.push(new I(k.C,k.text));A(h);continue;case 20:l.push(new id(k.text));
A(h);continue;case 21:l.push(new nd(va(k.text,a.ba)));A(h);continue;case 22:Vf(a,",",k);l.push(",");A(h);continue;case 23:l.push(hd);A(h);continue;case 24:m=k.text.toLowerCase();"-epubx-expr"==m?(a.b=Of,a.g=0,l.push("{")):(l.push(m),l.push("("));A(h);continue;case 25:Vf(a,")",k);A(h);continue;case 47:A(h);k=y(h);m=z(h,1);if(1==k.type&&"important"==k.text.toLowerCase()&&(17==m.type||0==m.type||13==m.type)){A(h);a.l=!0;continue}Wf(a,"E_CSS_SYNTAX",k);continue;case 54:m=z(h,1);switch(m.type){case 4:case 3:case 5:if(!m.b){A(h);
continue}}a.b===Nf&&0<=h.b?(Vb(h),a.b=Mf,g.eb()):Wf(a,"E_CSS_UNEXPECTED_PLUS",k);continue;case 26:A(h);case 48:h.b=-1;(m=Vf(a,";",k))&&a.e&&g.bb(a.e,m,a.l);a.b=d?Jf:If;continue;case 44:A(h);h.b=-1;m=Vf(a,";",k);if(c)return a.w=m,!0;a.e&&m&&g.bb(a.e,m,a.l);if(d)return!0;Wf(a,"E_CSS_SYNTAX",k);continue;case 31:m=z(h,1);9==m.type?(10!=z(h,2).type||z(h,2).b?(l.push(new Qc(g.X(),cc(k.text,m.text))),a.b=S):(l.push(k.text,m.text,"("),A(h)),A(h)):(2==a.g||3==a.g?"not"==k.text.toLowerCase()?(A(h),l.push(new Rc(g.X(),
!0,m.text))):("only"==k.text.toLowerCase()&&(A(h),k=m),l.push(new Rc(g.X(),!1,k.text))):l.push(new Qc(g.X(),k.text)),a.b=S);A(h);continue;case 38:l.push(null,k.text,"(");A(h);continue;case 32:l.push(new B(g.X(),k.C));A(h);a.b=S;continue;case 33:m=k.text;"%"==m&&(m=a.e&&a.e.match(/height|^(top|bottom)$/)?"vh":"vw");l.push(new Pc(g.X(),k.C,m));A(h);a.b=S;continue;case 34:l.push(new B(g.X(),k.text));A(h);a.b=S;continue;case 35:A(h);k=y(h);5!=k.type||k.b?Wf(a,"E_CSS_SYNTAX",k):(l.push(new Vc(g.X(),k.C)),
A(h),a.b=S);continue;case 36:l.push(-k.type);A(h);continue;case 37:a.b=Of;Xf(a,k.type,k);l.push(k.type);A(h);continue;case 45:"and"==k.text.toLowerCase()?(a.b=Of,Xf(a,52,k),l.push(52),A(h)):Wf(a,"E_CSS_SYNTAX",k);continue;case 39:Xf(a,k.type,k)&&(a.e?a.b=Nf:Wf(a,"E_CSS_UNBALANCED_PAR",k));A(h);continue;case 43:Xf(a,11,k)&&(a.e||3==a.g?Wf(a,"E_CSS_UNEXPECTED_BRC",k):(1==a.g?g.Cb(l.pop()):(k=l.pop(),g.Cb(k)),a.f.push("media"),g.ra(),a.b=If));A(h);continue;case 49:if(Xf(a,11,k))if(a.e||3!=a.g)Wf(a,"E_CSS_UNEXPECTED_SEMICOL",
k);else return a.k=l.pop(),a.B=!0,a.b=If,A(h),!1;A(h);continue;case 40:l.push(k.type);A(h);continue;case 27:a.b=If;A(h);g.mb();a.f.length&&a.f.pop();continue;case 30:m=k.text.toLowerCase();switch(m){case "import":A(h);k=y(h);if(2==k.type||8==k.type){a.H=k.text;A(h);k=y(h);if(17==k.type||0==k.type)return a.B=!0,A(h),!1;a.e=null;a.g=3;a.b=Of;l.push("{");continue}g.error("E_CSS_IMPORT_SYNTAX",k);a.b=Pf;continue;case "namespace":A(h);k=y(h);switch(k.type){case 1:m=k.text;A(h);k=y(h);if((2==k.type||8==
k.type)&&17==z(h,1).type){a.I[m]=k.text;A(h);A(h);continue}break;case 2:case 8:if(17==z(h,1).type){a.D=k.text;A(h);A(h);continue}}g.error("E_CSS_NAMESPACE_SYNTAX",k);a.b=Pf;continue;case "charset":A(h);k=y(h);if(2==k.type&&17==z(h,1).type){m=k.text.toLowerCase();"utf-8"!=m&&"utf-16"!=m&&g.error("E_CSS_UNEXPECTED_CHARSET "+m,k);A(h);A(h);continue}g.error("E_CSS_CHARSET_SYNTAX",k);a.b=Pf;continue;case "font-face":case "-epubx-page-template":case "-epubx-define":case "-epubx-viewport":if(12==z(h,1).type){A(h);
A(h);switch(m){case "font-face":g.Ac();break;case "-epubx-page-template":g.Cc();break;case "-epubx-define":g.yc();break;case "-epubx-viewport":g.Ec()}a.f.push(m);g.ra();continue}break;case "-adapt-footnote-area":A(h);k=y(h);switch(k.type){case 12:A(h);g.cc(null);a.f.push(m);g.ra();continue;case 50:if(A(h),k=y(h),1==k.type&&12==z(h,1).type){m=k.text;A(h);A(h);g.cc(m);a.f.push("-adapt-footnote-area");g.ra();continue}}break;case "-epubx-region":A(h);g.Dc();a.S=!0;a.b=Mf;continue;case "page":A(h);g.Mb();
a.O=!0;a.b=Lf;continue;case "top-left-corner":case "top-left":case "top-center":case "top-right":case "top-right-corner":case "right-top":case "right-middle":case "right-bottom":case "bottom-right-corner":case "bottom-right":case "bottom-center":case "bottom-left":case "bottom-left-corner":case "left-bottom":case "left-middle":case "left-top":A(h);k=y(h);if(12==k.type){A(h);g.hd(m);a.f.push(m);g.ra();continue}break;case "-epubx-when":A(h);a.e=null;a.g=1;a.b=Of;l.push("{");continue;case "media":A(h);
a.e=null;a.g=2;a.b=Of;l.push("{");continue;case "-epubx-flow":if(1==z(h,1).type&&12==z(h,2).type){g.zc(z(h,1).text);A(h);A(h);A(h);a.f.push(m);g.ra();continue}break;case "-epubx-page-master":case "-epubx-partition":case "-epubx-partition-group":A(h);k=y(h);r=p=null;var q=[];1==k.type&&(p=k.text,A(h),k=y(h));18==k.type&&1==z(h,1).type&&(r=z(h,1).text,A(h),A(h),k=y(h));for(;6==k.type&&"class"==k.text.toLowerCase()&&1==z(h,1).type&&11==z(h,2).type;)q.push(z(h,1).text),A(h),A(h),A(h),k=y(h);if(12==k.type){A(h);
switch(m){case "-epubx-page-master":g.Bc(p,r,q);break;case "-epubx-partition":g.fc(p,r,q);break;case "-epubx-partition-group":g.ec(p,r,q)}a.f.push(m);g.ra();continue}break;case "":g.error("E_CSS_UNEXPECTED_AT"+m,k);a.b=Rf;continue;default:g.error("E_CSS_AT_UNKNOWN "+m,k);a.b=Pf;continue}g.error("E_CSS_AT_SYNTAX "+m,k);a.b=Pf;continue;case 50:if(c||d)return!0;a.h.push(k.type+1);A(h);continue;case 52:if(c||d)return!0;if(0==a.h.length){a.b=If;continue}case 51:0<a.h.length&&a.h[a.h.length-1]==k.type&&
a.h.pop();0==a.h.length&&13==k.type&&(a.b=If);A(h);continue;case 53:if(c||d)return!0;0==a.h.length&&(a.b=If);A(h);continue;case 200:return f&&(A(h),g.oc()),!0;default:if(c||d)return!0;if(e)return Xf(a,11,k)?(a.w=l.pop(),!0):!1;if(f)return 51==k.type?g.error(k.text,k):g.error("E_CSS_SYNTAX",k),!1;if(a.b===Nf&&0<=h.b){Vb(h);a.b=Mf;g.eb();continue}if(a.b!==Pf&&a.b!==Rf&&a.b!==Qf){51==k.type?g.error(k.text,k):g.error("E_CSS_SYNTAX",k);a.b=ag(a)?Qf:Rf;continue}A(h)}return!1}
function cg(a){zf.call(this,null);this.d=a}u(cg,zf);cg.prototype.error=function(a){throw Error(a);};cg.prototype.X=function(){return this.d};
function dg(a,b,c,d,e){var f=K("parseStylesheet"),g=new Tf(If,a,b,c),h=null;e&&(h=eg(new Tb(e,b),b,c));if(h=$f(g,d,h&&h.ja()))b.Cb(h),b.ra();mf(function(){for(;!bg(g,100,!1,!1,!1,!1);){if(g.B){var a=va(g.H,c);g.k&&(b.Cb(g.k),b.ra());var d=K("parseStylesheet.import");fg(a,b,null,null).then(function(){g.k&&b.mb();g.B=!1;g.H=null;g.k=null;N(d,!0)});return M(d)}a=lf();if(a.Ca)return a}return L(!1)}).then(function(){h&&b.mb();N(f,!0)});return M(f)}
function gg(a,b,c,d,e){return We("parseStylesheetFromText",function(f){var g=new Tb(a,b);dg(g,b,c,d,e).ua(f)},function(b,c){v.b(c,"Failed to parse stylesheet text: "+a);N(b,!1)})}function fg(a,b,c,d){return We("parseStylesheetFromURL",function(e){qf(a).then(function(f){f.responseText?gg(f.responseText,b,a,c,d).then(function(b){b||v.b("Failed to parse stylesheet from "+a);N(e,!0)}):N(e,!0)})},function(b,c){v.b(c,"Exception while fetching and parsing:",a);N(b,!0)})}
function hg(a,b){var c=new Tf(Nf,b,new cg(a),"");bg(c,Number.POSITIVE_INFINITY,!0,!1,!1,!1);return c.w}function eg(a,b,c){a=new Tf(Of,a,b,c);bg(a,Number.POSITIVE_INFINITY,!1,!1,!0,!1);return a.w}var ig={"z-index":!0,"column-count":!0,"flow-linger":!0,opacity:!0,page:!0,"flow-priority":!0,utilization:!0};
function jg(a,b,c){if(b.vd())a:{b=b.d;a=b.evaluate(a);switch(typeof a){case "number":c=ig[c]?a==Math.round(a)?new ld(a):new kd(a):new I(a,"px");break a;case "string":c=a?hg(b.b,new Tb(a,null)):G;break a;case "boolean":c=a?he:Cd;break a;case "undefined":c=G;break a}throw Error("E_UNEXPECTED");}else c=b;return c};function kg(){this.b={}}u(kg,$c);kg.prototype.ub=function(a){this.b[a.name]=!0;return a};kg.prototype.fb=function(a){this.vb(a.values);return a};function lg(a){this.value=a}u(lg,$c);lg.prototype.Pb=function(a){this.value=a.C;return a};function mg(a,b){if(a){var c=new lg(b);try{return a.U(c),c.value}catch(d){v.b(d,"toInt: ")}}return b}function ng(){this.d=!1;this.b=[];this.name=null}u(ng,$c);ng.prototype.Rb=function(a){this.d&&this.b.push(a);return null};
ng.prototype.Qb=function(a){this.d&&0==a.C&&this.b.push(new I(0,"px"));return null};ng.prototype.fb=function(a){this.vb(a.values);return null};ng.prototype.jb=function(a){this.d||(this.d=!0,this.vb(a.values),this.d=!1,this.name=a.name.toLowerCase());return null};
function og(a,b,c,d,e,f){if(a){var g=new ng;try{a.U(g);var h;a:{if(0<g.b.length){a=[];for(var l=0;l<g.b.length;l++){var k=g.b[l];if("%"==k.ha){var m=0==l%2?d:e;3==l&&"circle"==g.name&&(m=Math.sqrt((d*d+e*e)/2));a.push(k.C*m/100)}else a.push(k.C*nc(f,k.ha,!1))}switch(g.name){case "polygon":if(0==a.length%2){f=[];for(g=0;g<a.length;g+=2)f.push({x:b+a[g],y:c+a[g+1]});h=new ue(f);break a}break;case "rectangle":if(4==a.length){h=ye(b+a[0],c+a[1],b+a[0]+a[2],c+a[1]+a[3]);break a}break;case "ellipse":if(4==
a.length){h=xe(b+a[0],c+a[1],a[2],a[3]);break a}break;case "circle":if(3==a.length){h=xe(b+a[0],c+a[1],a[2],a[2]);break a}}}h=null}return h}catch(p){v.b(p,"toShape:")}}return ye(b,c,b+d,c+e)}function pg(a){this.d=a;this.b={};this.name=null}u(pg,$c);pg.prototype.ub=function(a){this.name=a.toString();this.b[this.name]=this.d?0:(this.b[this.name]||0)+1;return a};pg.prototype.Pb=function(a){this.name&&(this.b[this.name]+=a.C-(this.d?0:1));return a};pg.prototype.fb=function(a){this.vb(a.values);return a};
function qg(a,b){var c=new pg(b);try{a.U(c)}catch(d){v.b(d,"toCounters:")}return c.b};function wf(a,b){this.qc=a;this.name=b;this.d=!1;this.b=this.f=null;this.e=[]}wf.prototype.start=function(){if(!this.b){var a=this;this.b=Ze(Re.d,function(){var b=K("Fetcher.run");a.qc().then(function(c){var d=a.e;a.d=!0;a.f=c;a.b=null;a.e=[];if(d)for(var e=0;e<d.length;e++)try{d[e](c)}catch(f){v.error(f,"Error:")}N(b,c)});return M(b)},this.name)}};function rg(a,b){a.d?b(a.f):a.e.push(b)}function uf(a){if(a.d)return L(a.f);a.start();return a.b.join()}
function sg(a){if(0==a.length)return L(!0);if(1==a.length)return uf(a[0]).jd(!0);var b=K("waitForFetches"),c=0;mf(function(){for(;c<a.length;){var b=a[c++];if(!b.d)return uf(b).jd(!0)}return L(!1)}).then(function(){N(b,!0)});return M(b)}
function tg(a,b){var c=null,d=null;"img"==a.localName&&(c=a.getAttribute("width"),d=a.getAttribute("height"));var e=new wf(function(){function e(b){"img"==a.localName&&(c||a.removeAttribute("width"),d||a.removeAttribute("height"));h.Va(b?b.type:"timeout")}var g=K("loadImage"),h=ff(g,a);a.addEventListener("load",e,!1);a.addEventListener("error",e,!1);a.addEventListener("abort",e,!1);"http://www.w3.org/2000/svg"==a.namespaceURI?(a.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",b),setTimeout(e,
300)):a.src=b;return M(g)},"loadElement "+b);e.start();return e};function ug(a){this.e=this.f=null;this.d=0;this.b=a}function vg(a,b){this.b=-1;this.d=a;this.e=b}function wg(){this.b=[];this.d=[];this.match=[];this.e=[];this.error=[];this.f=!0}function xg(a,b,c){for(var d=0;d<b.length;d++)a.d[b[d]].b=c;b.splice(0,b.length)}
wg.prototype.clone=function(){for(var a=new wg,b=0;b<this.b.length;b++){var c=this.b[b],d=new ug(c.b);d.d=c.d;a.b.push(d)}for(b=0;b<this.d.length;b++)c=this.d[b],d=new vg(c.d,c.e),d.b=c.b,a.d.push(d);a.match.push.apply(a.match,this.match);a.e.push.apply(a.e,this.e);a.error.push.apply(a.error,this.error);return a};
function yg(a,b,c,d){var e=a.b.length,f=new ug(zg);f.d=0<=d?c?2*d+1:2*d+2:c?-1:-2;a.b.push(f);xg(a,b,e);c=new vg(e,!0);e=new vg(e,!1);b.push(a.d.length);a.d.push(e);b.push(a.d.length);a.d.push(c)}function Ag(a){return 1==a.b.length&&0==a.b[0].d&&a.b[0].b instanceof Bg}
function Cg(a,b,c){if(0!=b.b.length){var d=a.b.length;if(4==c&&1==d&&Ag(b)&&Ag(a)){c=a.b[0].b;b=b.b[0].b;var d={},e={},f;for(f in c.d)d[f]=c.d[f];for(f in b.d)d[f]=b.d[f];for(var g in c.e)e[g]=c.e[g];for(g in b.e)e[g]=b.e[g];a.b[0].b=new Bg(c.b|b.b,d,e)}else{for(f=0;f<b.b.length;f++)a.b.push(b.b[f]);4==c?(a.f=!0,xg(a,a.e,d)):xg(a,a.match,d);g=a.d.length;for(f=0;f<b.d.length;f++)e=b.d[f],e.d+=d,0<=e.b&&(e.b+=d),a.d.push(e);for(f=0;f<b.match.length;f++)a.match.push(b.match[f]+g);3==c&&xg(a,a.match,
d);if(2==c||3==c)for(f=0;f<b.e.length;f++)a.match.push(b.e[f]+g);else if(a.f){for(f=0;f<b.e.length;f++)a.e.push(b.e[f]+g);a.f=b.f}else for(f=0;f<b.e.length;f++)a.error.push(b.e[f]+g);for(f=0;f<b.error.length;f++)a.error.push(b.error[f]+g);b.b=null;b.d=null}}}var U={};function Dg(){}u(Dg,$c);Dg.prototype.f=function(a,b){var c=a[b].U(this);return c?[c]:null};function Bg(a,b,c){this.b=a;this.d=b;this.e=c}u(Bg,Dg);n=Bg.prototype;n.ld=function(a){return this.b&1?a:null};
n.md=function(a){return this.b&2048?a:null};n.hc=function(a){return this.b&2?a:null};n.ub=function(a){var b=this.d[a.name.toLowerCase()];return b?b:this.b&4?a:null};n.Rb=function(a){return 0!=a.C||this.b&512?0>a.C&&!(this.b&256)?null:this.e[a.ha]?a:null:"%"==a.ha&&this.b&1024?a:null};n.Qb=function(a){return 0==a.C?this.b&512?a:null:0>=a.C&&!(this.b&256)?null:this.b&16?a:null};n.Pb=function(a){return 0==a.C?this.b&512?a:null:0>=a.C&&!(this.b&256)?null:this.b&48?a:(a=this.d[""+a.C])?a:null};
n.Hc=function(a){return this.b&64?a:null};n.ic=function(a){return this.b&128?a:null};n.fb=function(){return null};n.tb=function(){return null};n.jb=function(){return null};n.Ob=function(){return null};var zg=new Bg(0,U,U);
function Eg(a){this.b=new ug(null);var b=this.e=new ug(null),c=a.b.length;a.b.push(this.b);a.b.push(b);xg(a,a.match,c);xg(a,a.e,c+1);xg(a,a.error,c+1);for(b=0;b<a.d.length;b++){var d=a.d[b];d.e?a.b[d.d].f=a.b[d.b]:a.b[d.d].e=a.b[d.b]}for(b=0;b<c;b++)if(null==a.b[b].e||null==a.b[b].f)throw Error("Invalid validator state");this.d=a.b[0]}u(Eg,Dg);
function Fg(a,b,c,d){for(var e=c?[]:b,f=a.d,g=d,h=null,l=null;f!==a.b&&f!==a.e;)if(g>=b.length)f=f.e;else{var k=b[g],m=k;if(0!=f.d)m=!0,-1==f.d?(h?h.push(l):h=[l],l=[]):-2==f.d?0<h.length?l=h.pop():l=null:0<f.d&&0==f.d%2?l[Math.floor((f.d-1)/2)]="taken":m=null==l[Math.floor((f.d-1)/2)],f=m?f.f:f.e;else{if(0==g&&!c&&f.b instanceof Gg&&a instanceof Gg){if(m=(new bd(b)).U(f.b)){g=b.length;f=f.f;continue}}else if(0==g&&!c&&f.b instanceof Hg&&a instanceof Gg){if(m=(new cd(b)).U(f.b)){g=b.length;f=f.f;
continue}}else m=k.U(f.b);if(m){if(m!==k&&b===e)for(e=[],k=0;k<g;k++)e[k]=b[k];b!==e&&(e[g-d]=m);g++;f=f.f}else f=f.e}}return f===a.b&&(c?0<e.length:g==b.length)?e:null}n=Eg.prototype;n.Ta=function(a){for(var b=null,c=this.d;c!==this.b&&c!==this.e;)a?0!=c.d?c=c.f:(b=a.U(c.b))?(a=null,c=c.f):c=c.e:c=c.e;return c===this.b?b:null};n.ld=function(a){return this.Ta(a)};n.md=function(a){return this.Ta(a)};n.hc=function(a){return this.Ta(a)};n.ub=function(a){return this.Ta(a)};n.Rb=function(a){return this.Ta(a)};
n.Qb=function(a){return this.Ta(a)};n.Pb=function(a){return this.Ta(a)};n.Hc=function(a){return this.Ta(a)};n.ic=function(a){return this.Ta(a)};n.fb=function(){return null};n.tb=function(){return null};n.jb=function(a){return this.Ta(a)};n.Ob=function(){return null};function Gg(a){Eg.call(this,a)}u(Gg,Eg);Gg.prototype.fb=function(a){var b=Fg(this,a.values,!1,0);return b===a.values?a:b?new bd(b):null};
Gg.prototype.tb=function(a){for(var b=this.d,c=!1;b;){if(b.b instanceof Hg){c=!0;break}b=b.e}return c?(b=Fg(this,a.values,!1,0),b===a.values?a:b?new cd(b):null):null};Gg.prototype.f=function(a,b){return Fg(this,a,!0,b)};function Hg(a){Eg.call(this,a)}u(Hg,Eg);Hg.prototype.fb=function(a){return this.Ta(a)};Hg.prototype.tb=function(a){var b=Fg(this,a.values,!1,0);return b===a.values?a:b?new cd(b):null};Hg.prototype.f=function(a,b){for(var c=this.d,d;c!==this.e;){if(d=c.b.f(a,b))return d;c=c.e}return null};
function Ig(a,b){Eg.call(this,b);this.name=a}u(Ig,Eg);Ig.prototype.Ta=function(){return null};Ig.prototype.jb=function(a){if(a.name.toLowerCase()!=this.name)return null;var b=Fg(this,a.values,!1,0);return b===a.values?a:b?new dd(a.name,b):null};function Jg(){}Jg.prototype.b=function(a,b){return b};Jg.prototype.e=function(){};function Kg(a,b){this.name=b;this.f=a.e[this.name]}u(Kg,Jg);
Kg.prototype.b=function(a,b,c){if(c.values[this.name])return b;if(a=this.f.f(a,b)){var d=a.length;this.e(1<d?new bd(a):a[0],c);return b+d}return b};Kg.prototype.e=function(a,b){b.values[this.name]=a};function Lg(a,b){Kg.call(this,a,b[0]);this.d=b}u(Lg,Kg);Lg.prototype.e=function(a,b){for(var c=0;c<this.d.length;c++)b.values[this.d[c]]=a};function Mg(a,b){this.d=a;this.Bd=b}u(Mg,Jg);
Mg.prototype.b=function(a,b,c){var d=b;if(this.Bd)if(a[b]==hd){if(++b==a.length)return d}else return d;var e=this.d[0].b(a,b,c);if(e==b)return d;b=e;for(d=1;d<this.d.length&&b<a.length;d++){e=this.d[d].b(a,b,c);if(e==b)break;b=e}return b};function Ng(){this.b=this.Qa=null;this.error=!1;this.values={};this.d=null}n=Ng.prototype;n.clone=function(){var a=new this.constructor;a.Qa=this.Qa;a.b=this.b;a.d=this.d;return a};n.od=function(a,b){this.Qa=a;this.b=b};n.Fb=function(){this.error=!0;return 0};
function Og(a,b){a.Fb([b]);return null}n.ld=function(a){return Og(this,a)};n.hc=function(a){return Og(this,a)};n.ub=function(a){return Og(this,a)};n.Rb=function(a){return Og(this,a)};n.Qb=function(a){return Og(this,a)};n.Pb=function(a){return Og(this,a)};n.Hc=function(a){return Og(this,a)};n.ic=function(a){return Og(this,a)};n.fb=function(a){this.Fb(a.values);return null};n.tb=function(){this.error=!0;return null};n.jb=function(a){return Og(this,a)};n.Ob=function(){this.error=!0;return null};
function Pg(){Ng.call(this)}u(Pg,Ng);Pg.prototype.Fb=function(a){for(var b=0,c=0;b<a.length;){var d=this.Qa[c].b(a,b,this);if(d>b)b=d,c=0;else if(++c==this.Qa.length){this.error=!0;break}}return b};function Qg(){Ng.call(this)}u(Qg,Ng);Qg.prototype.Fb=function(a){if(a.length>this.Qa.length||0==a.length)return this.error=!0,0;for(var b=0;b<this.Qa.length;b++){for(var c=b;c>=a.length;)c=1==c?0:c-2;if(this.Qa[b].b(a,c,this)!=c+1)return this.error=!0,0}return a.length};function Rg(){Ng.call(this)}
u(Rg,Ng);Rg.prototype.Fb=function(a){for(var b=a.length,c=0;c<a.length;c++)if(a[c]===hd){b=c;break}if(b>this.Qa.length||0==a.length)return this.error=!0,0;for(c=0;c<this.Qa.length;c++){for(var d=c;d>=b;)d=1==d?0:d-2;var e;if(b+1<a.length)for(e=b+c+1;e>=a.length;)e-=e==b+2?1:2;else e=d;if(2!=this.Qa[c].b([a[d],a[e]],0,this))return this.error=!0,0}return a.length};function Sg(){Ng.call(this)}u(Sg,Pg);
Sg.prototype.tb=function(a){for(var b={},c=0;c<a.values.length;c++){this.values={};if(a.values[c]instanceof cd)this.error=!0;else{a.values[c].U(this);for(var d=b,e=this.values,f=0;f<this.b.length;f++){var g=this.b[f],h=e[g]||this.d.h[g],l=d[g];l||(l=[],d[g]=l);l.push(h)}this.values["background-color"]&&c!=a.values.length-1&&(this.error=!0)}if(this.error)return null}this.values={};for(var k in b)this.values[k]="background-color"==k?b[k].pop():new cd(b[k]);return null};function Tg(){Ng.call(this)}
u(Tg,Pg);Tg.prototype.od=function(a,b){Pg.prototype.od.call(this,a,b);this.b.push("font-family","line-height","font-size")};
Tg.prototype.Fb=function(a){var b=Pg.prototype.Fb.call(this,a);if(b+2>a.length)return this.error=!0,b;this.error=!1;var c=this.d.e;if(!a[b].U(c["font-size"]))return this.error=!0,b;this.values["font-size"]=a[b++];if(a[b]===hd){b++;if(b+2>a.length||!a[b].U(c["line-height"]))return this.error=!0,b;this.values["line-height"]=a[b++]}var d=b==a.length-1?a[b]:new bd(a.slice(b,a.length));if(!d.U(c["font-family"]))return this.error=!0,b;this.values["font-family"]=d;return a.length};
Tg.prototype.tb=function(a){a.values[0].U(this);if(this.error)return null;for(var b=[this.values["font-family"]],c=1;c<a.values.length;c++)b.push(a.values[c]);a=new cd(b);a.U(this.d.e["font-family"])?this.values["font-family"]=a:this.error=!0;return null};Tg.prototype.ub=function(a){if(a=this.d.d[a.name])for(var b in a)this.values[b]=a[b];else this.error=!0;return null};var Ug={SIMPLE:Pg,INSETS:Qg,INSETS_SLASH:Rg,COMMA:Sg,FONT:Tg};
function Vg(){this.e={};this.k={};this.h={};this.b={};this.d={};this.f={};this.j=[];this.g=[]}function Wg(a,b){var c;if(3==b.type)c=new I(b.C,b.text);else if(7==b.type)c=yf(b.text);else if(1==b.type)c=H(b.text);else throw Error("unexpected replacement");if(Ag(a)){var d=a.b[0].b.d,e;for(e in d)d[e]=c;return a}throw Error("unexpected replacement");}
function Xg(a,b,c){for(var d=new wg,e=0;e<b;e++)Cg(d,a.clone(),1);if(c==Number.POSITIVE_INFINITY)Cg(d,a,3);else for(e=b;e<c;e++)Cg(d,a.clone(),2);return d}function Yg(a){var b=new wg,c=b.b.length;b.b.push(new ug(a));a=new vg(c,!0);var d=new vg(c,!1);xg(b,b.match,c);b.f?(b.e.push(b.d.length),b.f=!1):b.error.push(b.d.length);b.d.push(d);b.match.push(b.d.length);b.d.push(a);return b}
function Zg(a,b){var c;switch(a){case "COMMA":c=new Hg(b);break;case "SPACE":c=new Gg(b);break;default:c=new Ig(a.toLowerCase(),b)}return Yg(c)}
function $g(a){a.b.HASHCOLOR=Yg(new Bg(64,U,U));a.b.POS_INT=Yg(new Bg(32,U,U));a.b.POS_NUM=Yg(new Bg(16,U,U));a.b.POS_PERCENTAGE=Yg(new Bg(8,U,{"%":G}));a.b.NEGATIVE=Yg(new Bg(256,U,U));a.b.ZERO=Yg(new Bg(512,U,U));a.b.ZERO_PERCENTAGE=Yg(new Bg(1024,U,U));a.b.POS_LENGTH=Yg(new Bg(8,U,{em:G,ex:G,ch:G,rem:G,vh:G,vw:G,vmin:G,vmax:G,cm:G,mm:G,"in":G,px:G,pt:G,pc:G,q:G}));a.b.POS_ANGLE=Yg(new Bg(8,U,{deg:G,grad:G,rad:G,turn:G}));a.b.POS_TIME=Yg(new Bg(8,U,{s:G,ms:G}));a.b.FREQUENCY=Yg(new Bg(8,U,{Hz:G,
kHz:G}));a.b.RESOLUTION=Yg(new Bg(8,U,{dpi:G,dpcm:G,dppx:G}));a.b.URI=Yg(new Bg(128,U,U));a.b.IDENT=Yg(new Bg(4,U,U));a.b.STRING=Yg(new Bg(2,U,U));var b={"font-family":H("sans-serif")};a.d.caption=b;a.d.icon=b;a.d.menu=b;a.d["message-box"]=b;a.d["small-caption"]=b;a.d["status-bar"]=b}function ah(a){return!!a.match(/^[A-Z_0-9]+$/)}
function bh(a,b,c){var d=y(b);if(0==d.type)return null;var e={"":!0};if(14==d.type){do{A(b);d=y(b);if(1!=d.type)throw Error("Prefix name expected");e[d.text]=!0;A(b);d=y(b)}while(16==d.type);if(15!=d.type)throw Error("']' expected");A(b);d=y(b)}if(1!=d.type)throw Error("Property name expected");if(2==c?"SHORTHANDS"==d.text:"DEFAULTS"==d.text)return A(b),null;d=d.text;A(b);if(2!=c){if(39!=y(b).type)throw Error("'=' expected");ah(d)||(a.k[d]=e)}else if(18!=y(b).type)throw Error("':' expected");return d}
function ch(a,b){for(;;){var c=bh(a,b,1);if(!c)break;for(var d=[],e=[],f="",g,h=!0,l=function(){if(0==d.length)throw Error("No values");var a;if(1==d.length)a=d[0];else{var b=f,c=d;a=new wg;if("||"==b){for(b=0;b<c.length;b++){var e=new wg,g=e;if(g.b.length)throw Error("invalid call");var h=new ug(zg);h.d=2*b+1;g.b.push(h);var h=new vg(0,!0),k=new vg(0,!1);g.e.push(g.d.length);g.d.push(k);g.match.push(g.d.length);g.d.push(h);Cg(e,c[b],1);yg(e,e.match,!1,b);Cg(a,e,0==b?1:4)}c=new wg;if(c.b.length)throw Error("invalid call");
yg(c,c.match,!0,-1);Cg(c,a,3);a=[c.match,c.e,c.error];for(b=0;b<a.length;b++)yg(c,a[b],!1,-1);a=c}else{switch(b){case " ":e=1;break;case "|":case "||":e=4;break;default:throw Error("unexpected op");}for(b=0;b<c.length;b++)Cg(a,c[b],0==b?1:e)}}return a},k=function(a){if(h)throw Error("'"+a+"': unexpected");if(f&&f!=a)throw Error("mixed operators: '"+a+"' and '"+f+"'");f=a;h=!0},m=null;!m;)switch(A(b),g=y(b),g.type){case 1:h||k(" ");if(ah(g.text)){var p=a.b[g.text];if(!p)throw Error("'"+g.text+"' unexpected");
d.push(p.clone())}else p={},p[g.text]=H(g.text),d.push(Yg(new Bg(0,p,U)));h=!1;break;case 5:p={};p[""+g.C]=new ld(g.C);d.push(Yg(new Bg(0,p,U)));h=!1;break;case 34:k("|");break;case 25:k("||");break;case 14:h||k(" ");e.push({Dd:d,zd:f,Sb:"["});f="";d=[];h=!0;break;case 6:h||k(" ");e.push({Dd:d,zd:f,Sb:"(",Ib:g.text});f="";d=[];h=!0;break;case 15:g=l();p=e.pop();if("["!=p.Sb)throw Error("']' unexpected");d=p.Dd;d.push(g);f=p.zd;h=!1;break;case 11:g=l();p=e.pop();if("("!=p.Sb)throw Error("')' unexpected");
d=p.Dd;d.push(Zg(p.Ib,g));f=p.zd;h=!1;break;case 18:if(h)throw Error("':' unexpected");A(b);d.push(Wg(d.pop(),y(b)));break;case 22:if(h)throw Error("'?' unexpected");d.push(Xg(d.pop(),0,1));break;case 36:if(h)throw Error("'*' unexpected");d.push(Xg(d.pop(),0,Number.POSITIVE_INFINITY));break;case 23:if(h)throw Error("'+' unexpected");d.push(Xg(d.pop(),1,Number.POSITIVE_INFINITY));break;case 12:A(b);g=y(b);if(5!=g.type)throw Error("<int> expected");var r=p=g.C;A(b);g=y(b);if(16==g.type){A(b);g=y(b);
if(5!=g.type)throw Error("<int> expected");r=g.C;A(b);g=y(b)}if(13!=g.type)throw Error("'}' expected");d.push(Xg(d.pop(),p,r));break;case 17:m=l();if(0<e.length)throw Error("unclosed '"+e.pop().Sb+"'");break;default:throw Error("unexpected token");}A(b);ah(c)?a.b[c]=m:a.e[c]=1!=m.b.length||0!=m.b[0].d?new Gg(m):m.b[0].b}}
function dh(a,b){for(var c={},d=0;d<b.length;d++)for(var e=b[d],f=a.f[e],e=f?f.b:[e],f=0;f<e.length;f++){var g=e[f],h=a.h[g];h?c[g]=h:v.b("Unknown property in makePropSet:",g)}return c}
function eh(a,b,c,d,e){var f="",g=b;b=b.toLowerCase();var h=b.match(/^-([a-z]+)-([-a-z0-9]+)$/);h&&(f=h[1],b=h[2]);if((h=a.k[b])&&h[f])if(f=a.e[b])(a=c===Hd||c.vd()?c:c.U(f))?e.cb(b,a,d):e.Wb(g,c);else if(b=a.f[b].clone(),c===Hd)for(c=0;c<b.b.length;c++)e.cb(b.b[c],Hd,d);else{c.U(b);if(b.error)d=!1;else{for(a=0;a<b.b.length;a++)f=b.b[a],e.cb(f,b.values[f]||b.d.h[f],d);d=!0}d||e.Wb(g,c)}else e.Gc(g,c)}
var fh=new wf(function(){var a=K("loadValidatorSet.load"),b=va("validation.txt",ua),c=qf(b),d=new Vg;$g(d);c.then(function(c){try{if(c.responseText){var f=new Tb(c.responseText,null);for(ch(d,f);;){var g=bh(d,f,2);if(!g)break;for(c=[];;){A(f);var h=y(f);if(17==h.type){A(f);break}switch(h.type){case 1:c.push(H(h.text));break;case 4:c.push(new kd(h.C));break;case 5:c.push(new ld(h.C));break;case 3:c.push(new I(h.C,h.text));break;default:throw Error("unexpected token");}}d.h[g]=1<c.length?new bd(c):
c[0]}for(;;){var l=bh(d,f,3);if(!l)break;var k=z(f,1),m;1==k.type&&Ug[k.text]?(m=new Ug[k.text],A(f)):m=new Pg;m.d=d;g=!1;h=[];c=!1;for(var p=[],r=[];!g;)switch(A(f),k=y(f),k.type){case 1:if(d.e[k.text])h.push(new Kg(m.d,k.text)),r.push(k.text);else if(d.f[k.text]instanceof Qg){var t=d.f[k.text];h.push(new Lg(t.d,t.b));r.push.apply(r,t.b)}else throw Error("'"+k.text+"' is neither a simple property nor an inset shorthand");break;case 19:if(0<h.length||c)throw Error("unexpected slash");c=!0;break;case 14:p.push({Bd:c,
Qa:h});h=[];c=!1;break;case 15:var q=new Mg(h,c),x=p.pop(),h=x.Qa;c=x.Bd;h.push(q);break;case 17:g=!0;A(f);break;default:throw Error("unexpected token");}m.od(h,r);d.f[l]=m}d.g=dh(d,["background"]);d.j=dh(d,"margin border padding columns column-gap column-rule column-fill".split(" "))}else v.error("Error: missing",b)}catch(R){v.error(R,"Error:")}N(a,d)});return M(a)},"validatorFetcher");var gh={"font-style":Rd,"font-variant":Rd,"font-weight":Rd},hh="OTTO"+(new Date).valueOf(),ih=1;function jh(a,b){var c={},d;for(d in a)c[d]=a[d].evaluate(b,d);for(var e in gh)c[e]||(c[e]=gh[e]);return c}function kh(a){a=this.Bb=a;var b=new Ia,c;for(c in gh)b.append(" "),b.append(a[c].toString());this.d=b.toString();this.src=this.Bb.src?this.Bb.src.toString():null;this.e=[];this.f=[];this.b=(c=this.Bb["font-family"])?c.stringValue():null}
function lh(a,b,c){var d=new Ia;d.append("@font-face {\n  font-family: ");d.append(a.b);d.append(";\n  ");for(var e in gh)d.append(e),d.append(": "),a.Bb[e].Aa(d,!0),d.append(";\n  ");c?(d.append('src: url("'),b=(window.URL||window.webkitURL).createObjectURL(c),d.append(b),a.e.push(b),a.f.push(c),d.append('")')):(d.append("src: "),d.append(b));d.append(";\n}\n");return d.toString()}function mh(a){this.d=a;this.b={}}
function nh(a,b){if(b instanceof cd){for(var c=b.values,d=[],e=0;e<c.length;e++){var f=c[e],g=a.b[f.stringValue()];g&&d.push(H(g));d.push(f)}return new cd(d)}return(c=a.b[b.stringValue()])?new cd([H(c),b]):b}function oh(a,b){this.d=a;this.b=b;this.e={};this.f=0}function ph(a,b,c){b=b.b;var d=c.b[b];if(d)return d;d="Fnt_"+ ++a.f;return c.b[b]=d}
function qh(a,b,c,d){var e=K("initFont"),f=b.src,g={},h;for(h in gh)g[h]=b.Bb[h];d=ph(a,b,d);g["font-family"]=H(d);var l=new kh(g),k=a.b.ownerDocument.createElement("span");k.textContent="M";var m=(new Date).valueOf()+1E3;b=a.d.ownerDocument.createElement("style");h=hh+ih++;b.textContent=lh(l,"",rf([h]));a.d.appendChild(b);a.b.appendChild(k);k.style.visibility="hidden";k.style.fontFamily=d;for(var p in gh)w(k,p,g[p].toString());var g=k.getBoundingClientRect(),r=g.right-g.left,t=g.bottom-g.top;b.textContent=
lh(l,f,c);v.e("Starting to load font:",f);var q=!1;mf(function(){var a=k.getBoundingClientRect(),b=a.bottom-a.top;if(r!=a.right-a.left||t!=b)return q=!0,L(!1);(new Date).valueOf()>m?a=L(!1):(a=K("Frame.sleep"),ff(a).Va(!0,10),a=M(a));return a}).then(function(){q?v.e("Loaded font:",f):v.b("Failed to load font:",f);a.b.removeChild(k);N(e,l)});return M(e)}
function rh(a,b,c){var d=b.src,e=a.e[d];e?rg(e,function(a){if(a.d==b.d){var e=b.b,h=c.b[e];a=a.b;if(h){if(h!=a)throw Error("E_FONT_FAMILY_INCONSISTENT "+b.b);}else c.b[e]=a;v.b("Found already-loaded font:",d)}else v.b("E_FONT_FACE_INCOMPATIBLE",b.src)}):(e=new wf(function(){var e=K("loadFont"),g=c.d?c.d(d):null;g?qf(d,"blob").then(function(d){d.wc?g(d.wc).then(function(d){qh(a,b,d,c).ua(e)}):N(e,null)}):qh(a,b,null,c).ua(e);return M(e)},"loadFont "+d),a.e[d]=e,e.start());return e}
function sh(a,b,c){for(var d=[],e=0;e<b.length;e++){var f=b[e];f.src&&f.b?d.push(rh(a,f,c)):v.b("E_FONT_FACE_INVALID")}return sg(d)};function th(a,b,c){this.j=a;this.url=b;this.b=c;this.lang=null;this.f=-1;this.root=c.documentElement;a=null;if("http://www.w3.org/1999/xhtml"==this.root.namespaceURI){for(b=this.root.firstChild;b;b=b.nextSibling)if(1==b.nodeType&&(c=b,"http://www.w3.org/1999/xhtml"==c.namespaceURI))switch(c.localName){case "head":a=c}this.lang=this.root.getAttribute("lang")}else if("http://www.gribuser.ru/xml/fictionbook/2.0"==this.root.namespaceURI){a=this.root;for(b=this.root.firstChild;b;b=b.nextSibling);b=uh(uh(uh(uh(new vh([this.b]),
"FictionBook"),"description"),"title-info"),"lang").textContent();0<b.length&&(this.lang=b[0])}else if("http://example.com/sse"==this.root.namespaceURI)for(c=this.root.firstElementChild;c;c=c.nextElementSibling)"meta"===c.localName&&(a=c);this.h=a;this.e=this.root;this.g=1;this.e.setAttribute("data-adapt-eloff","0")}
function wh(a,b){var c=b.getAttribute("data-adapt-eloff");if(c)return parseInt(c,10);for(var c=a.g,d=a.e;d!=b;){var e=d.firstChild;if(!e)for(;!(e=d.nextSibling);)if(d=d.parentNode,null==d)throw Error("Internal error");d=e;1==e.nodeType?(e.setAttribute("data-adapt-eloff",c.toString()),++c):c+=e.textContent.length}a.g=c;a.e=b;return c-1}
function xh(a,b,c,d){var e=0,f=null;if(1==b.nodeType){if(!d)return wh(a,b)}else{e=c;f=b.previousSibling;if(!f)return b=b.parentNode,e+=1,wh(a,b)+e;b=f}for(;;){for(;b.lastChild;)b=b.lastChild;if(1==b.nodeType)break;e+=b.textContent.length;f=b.previousSibling;if(!f){b=b.parentNode;break}b=f}e+=1;return wh(a,b)+e}function yh(a){0>a.f&&(a.f=xh(a,a.root,0,!0));return a.f}
function zh(a,b){for(var c,d=a.root;;){c=wh(a,d);if(c>=b)return d;var e=d.children;if(!e)break;var f=Qa(e.length,function(c){return wh(a,e[c])>b});if(0==f)break;if(f<e.length&&wh(a,e[f])<=b)throw Error("Consistency check failed!");d=e[f-1]}c=c+1;for(var f=d,g=f.firstChild||f.nextSibling,h=null;;){if(g){if(1==g.nodeType)break;h=f=g;c+=g.textContent.length;if(c>b)break}else if(f=f.parentNode,!f)break;g=f.nextSibling}return h||d}
function Ah(a,b){var c=b.getAttribute("id");c&&!a.d[c]&&(a.d[c]=b);(c=b.getAttributeNS("http://www.w3.org/XML/1998/namespace","id"))&&!a.d[c]&&(a.d[c]=b);for(c=b.firstElementChild;c;c=c.nextElementSibling)Ah(a,c)}function Bh(a,b){var c=b.match(/([^#]*)\#(.+)$/);if(!c||c[1]&&c[1]!=a.url)return null;var c=c[2],d=a.b.getElementById(c);!d&&a.b.getElementsByName&&(d=a.b.getElementsByName(c)[0]);d||(a.d||(a.d={},Ah(a,a.b.documentElement)),d=a.d[c]);return d}
var Ch={we:"text/html",xe:"text/xml",oe:"application/xml",ne:"application/xhtml_xml",te:"image/svg+xml"};function Dh(a,b,c){c=c||new DOMParser;var d;try{d=c.parseFromString(a,b)}catch(e){}if(d){a=d.documentElement;if("parsererror"===a.localName)return null;for(a=a.firstChild;a;a=a.nextSibling)if("parsererror"===a.localName)return null}else return null;return d}
function Eh(a){var b=a.contentType;if(b){for(var c=Object.keys(Ch),d=0;d<c.length;d++)if(Ch[c[d]]===b)return b;if(b.match(/\+xml$/))return"application/xml"}if(a=a.url.match(/\.([^./]+)$/))switch(a[1]){case "html":case "htm":return"text/html";case "xhtml":case "xht":return"application/xhtml_xml";case "svg":case "svgz":return"image/svg+xml";case "opf":case "xml":return"application/xml"}return null}
function Fh(a,b){var c=a.responseXML;if(!c){var d=new DOMParser,e=a.responseText;if(e){var f=Eh(a);(c=Dh(e,f||"application/xml",d))&&!f&&(f=c.documentElement,"html"!==f.localName.toLowerCase()||f.namespaceURI?"svg"===f.localName.toLowerCase()&&"image/svg+xml"!==c.contentType&&(c=Dh(e,"image/svg+xml",d)):c=Dh(e,"text/html",d));c||(c=Dh(e,"text/html",d))}}c=c?new th(b,a.url,c):null;return L(c)}function Gh(a){this.Ib=a}
function Hh(){var a=Ih;return new Gh(function(b){return a.Ib(b)&&1==b.nodeType&&"http://www.idpf.org/2008/embedding"==b.getAttribute("Algorithm")})}function Jh(){var a=Hh(),b=Ih;return new Gh(function(c){if(!b.Ib(c))return!1;c=new vh([c]);c=uh(c,"EncryptionMethod");a&&(c=Kh(c,a));return 0<c.b.length})}var Ih=new Gh(function(){return!0});function vh(a){this.b=a}function Lh(a){return a.b}function Kh(a,b){for(var c=[],d=0;d<a.b.length;d++){var e=a.b[d];b.Ib(e)&&c.push(e)}return new vh(c)}
function Mh(a,b){function c(a){d.push(a)}for(var d=[],e=0;e<a.b.length;e++)b(a.b[e],c);return new vh(d)}vh.prototype.forEach=function(a){for(var b=[],c=0;c<this.b.length;c++)b.push(a(this.b[c]));return b};function Nh(a,b){for(var c=[],d=0;d<a.b.length;d++){var e=b(a.b[d]);null!=e&&c.push(e)}return c}function uh(a,b){return Mh(a,function(a,d){for(var e=a.firstChild;e;e=e.nextSibling)e.localName==b&&d(e)})}
function Oh(a){return Mh(a,function(a,c){for(var d=a.firstChild;d;d=d.nextSibling)1==d.nodeType&&c(d)})}function Ph(a,b){return Nh(a,function(a){return 1==a.nodeType?a.getAttribute(b):null})}vh.prototype.textContent=function(){return this.forEach(function(a){return a.textContent})};var Qh={transform:!0,"transform-origin":!0},Rh={top:!0,bottom:!0,left:!0,right:!0};function Sh(a,b,c){this.target=a;this.name=b;this.value=c}var Th={show:function(a){a.style.visibility="visible"},hide:function(a){a.style.visibility="hidden"},play:function(a){a.currentTime=0;a.play()},pause:function(a){a.pause()},resume:function(a){a.play()},mute:function(a){a.muted=!0},unmute:function(a){a.muted=!1}};
function Uh(a,b){var c=Th[b];return c?function(){for(var b=0;b<a.length;b++)try{c(a[b])}catch(e){}}:null}
function Vh(a,b){this.f={};this.N=a;this.d=b;this.w=null;this.h=[];var c=this;this.D=function(a){var b=a.currentTarget,f=b.getAttribute("href")||b.getAttributeNS("http://www.w3.org/1999/xlink","href");f&&(a.preventDefault(),Ya(c,{type:"hyperlink",target:null,currentTarget:null,Be:b,href:f}))};this.b={};this.e={width:0,height:0};this.k=this.l=!1;this.F=0;this.position=null;this.offset=-1;this.j=null;this.g=[];this.u={top:{},bottom:{},left:{},right:{}}}u(Vh,Xa);
function Wh(a){a.I=!0;a.N.setAttribute("data-vivliostyle-auto-page-width",!0)}function Xh(a){a.H=!0;a.N.setAttribute("data-vivliostyle-auto-page-height",!0)}function Yh(a,b,c){var d=a.b[c];d?d.push(b):a.b[c]=[b]}
function Zh(a,b){Object.keys(a.b).forEach(function(a){for(var b=this.b[a],c=0;c<b.length;)this.N.contains(b[c])?c++:b.splice(c,1);0===b.length&&delete this.b[a]},a);var c=a.N.getBoundingClientRect();a.e.width=c.width;a.e.height=c.height;for(var d=a.h,c=0;c<d.length;c++){var e=d[c];w(e.target,e.name,e.value.toString())}for(c=0;c<b.length;c++){var d=b[c],f=a.b[d.ac],e=a.b[d.de];if(f&&e&&(f=Uh(f,d.action)))for(var g=0;g<e.length;g++)e[g].addEventListener(d.event,f,!1)}}
Vh.prototype.zoom=function(a){w(this.N,"transform","scale("+a+")")};Vh.prototype.B=function(){return this.w||this.N};function $h(a){switch(a){case "normal":case "nowrap":return 0;case "pre-line":return 1;case "pre":case "pre-wrap":return 2;default:return null}}function bi(a,b){if(1==a.nodeType)return!1;var c=a.textContent;switch(b){case 0:return!!c.match(/^\s*$/);case 1:return!!c.match(/^[ \t\f]*$/);case 2:return 0==c.length}throw Error("Unexpected whitespace: "+b);}
function ci(a){this.d=a;this.b=[]}function di(a,b,c,d,e,f,g,h,l){this.b=a;this.h=b;this.d=c;this.Ga=d;this.k=e;this.f=f;this.ge=g;this.j=h;this.g=-1;this.e=l}function ei(a,b){return a.f?!b.f||a.Ga>b.Ga?!0:a.j:!1}function fi(a,b){return a.top-b.top}function gi(a,b){return b.right-a.right}
function hi(a,b){if(a===b)return!0;if(!a||!b||a.da!==b.da||a.J!==b.J||a.ga.length!==b.ga.length)return!1;for(var c=0;c<a.ga.length;c++){var d=a[c],e=b[c];if(!(d===e||d&&e&&d.fa===e.fa&&d.Ha===e.Ha&&d.ea===e.ea&&d.sa===e.sa&&d.qa===e.qa))return!1}return!0}function ii(a,b,c,d,e,f,g){this.$=a;this.dd=d;this.Cd=null;this.root=b;this.Z=c;this.type=f;e&&(e.Cd=this);this.b=g}function ji(a,b){this.ee=a;this.count=b}
function ki(a,b,c){this.Y=a;this.parent=b;this.ia=c;this.da=0;this.J=!1;this.Ha=0;this.ea=b?b.ea:null;this.qa=this.sa=null;this.S=!1;this.e=!0;this.d=!1;this.j=b?b.j:0;this.l=this.k=this.ba=this.display=null;this.B=!1;this.w=b?b.w:0;this.H=this.I=!1;this.u=this.A=this.D=this.h=null;this.g=b?b.g:{};this.b=b?b.b:!1;this.O=b?b.O:"ltr";this.f=b?b.f:null}
function li(a){a.e=!0;a.j=a.parent?a.parent.j:0;a.A=null;a.u=null;a.da=0;a.J=!1;a.display=null;a.k=null;a.l=null;a.B=!1;a.w=a.parent?a.parent.w:0;a.h=null;a.D=null;a.sa=null;a.I=!1;a.H=!1;a.b=a.parent?a.parent.b:!1;a.sa=null}function mi(a){var b=new ki(a.Y,a.parent,a.ia);b.da=a.da;b.J=a.J;b.sa=a.sa;b.Ha=a.Ha;b.ea=a.ea;b.qa=a.qa;b.e=a.e;b.j=a.j;b.display=a.display;b.k=a.k;b.l=a.l;b.I=a.I;b.H=a.H;b.B=a.B;b.w=a.w;b.h=a.h;b.D=a.D;b.A=a.A;b.u=a.u;b.f=a.f;b.b=a.b;b.d=a.d;return b}
ki.prototype.modify=function(){return this.S?mi(this):this};function ni(a){var b=a;do{if(b.S)break;b.S=!0;b=b.parent}while(b);return a}ki.prototype.clone=function(){for(var a=mi(this),b=a,c;null!=(c=b.parent);)c=mi(c),b=b.parent=c;return a};function oi(a){return{fa:a.Y,Ha:a.Ha,ea:a.ea,sa:a.sa,qa:a.qa?oi(a.qa):null}}function pi(a){var b=a,c=[];do b.f&&b.parent&&b.parent.f!==b.f||c.push(oi(b)),b=b.parent;while(b);return{ga:c,da:a.da,J:a.J}}
function qi(a){for(a=a.parent;a;){if(a.I)return!0;a=a.parent}return!1}function ri(a){for(a=a.parent;a;){if(a.H)return a;a=a.parent}return null}function si(a,b){for(var c=a;c;){c.e||b(c);if(c.I)break;c=c.parent}}function ti(a){this.Na=a;this.b=this.d=null}ti.prototype.clone=function(){var a=new ti(this.Na);if(this.d){a.d=[];for(var b=0;b<this.d.length;++b)a.d[b]=this.d[b]}if(this.b)for(a.b=[],b=0;b<this.b.length;++b)a.b[b]=this.b[b];return a};
function ui(a,b){if(!b)return!1;if(a===b)return!0;if(!hi(a.Na,b.Na))return!1;if(a.d){if(!b.d||a.d.length!==b.d.length)return!1;for(var c=0;c<a.d.length;c++)if(!hi(a.d[c],b.d[c]))return!1}else if(b.d)return!1;if(a.b){if(!b.b||a.b.length!==b.b.length)return!1;for(c=0;c<a.b.length;c++)if(!hi(a.b[c],b.b[c]))return!1}else if(b.b)return!1;return!0}function vi(a,b){this.d=a;this.b=b}vi.prototype.clone=function(){return new vi(this.d.clone(),this.b)};function wi(){this.b=[];this.d="any"}
wi.prototype.clone=function(){for(var a=new wi,b=this.b,c=a.b,d=0;d<b.length;d++)c[d]=b[d].clone();a.d=this.d;return a};function xi(a,b){if(a===b)return!0;if(!b||a.b.length!==b.b.length)return!1;for(var c=0;c<a.b.length;c++){var d=a.b[c],e=b.b[c];if(!e||d!==e&&!ui(d.d,e.d))return!1}return!0}function yi(){this.page=0;this.e={};this.b={};this.d=0}yi.prototype.clone=function(){var a=new yi;a.page=this.page;a.f=this.f;a.d=this.d;a.g=this.g;a.e=this.e;for(var b in this.b)a.b[b]=this.b[b].clone();return a};
function zi(a,b){if(a===b)return!0;if(!b||a.page!==b.page||a.d!==b.d)return!1;var c=Object.keys(a.b),d=Object.keys(b.b);if(c.length!==d.length)return!1;for(d=0;d<c.length;d++){var e=c[d];if(!xi(a.b[e],b.b[e]))return!1}return!0}
function Ai(a){this.d=a;this.H=this.D=this.height=this.width=this.u=this.k=this.w=this.j=this.Sa=this.ba=this.Ya=this.S=this.marginBottom=this.marginTop=this.marginRight=this.marginLeft=this.top=this.left=0;this.xb=this.I=null;this.oa=this.Eb=this.$a=this.kc=this.e=0;this.b=!1}function Bi(a){return a.marginTop+a.ba+a.k}function Ci(a){return a.marginBottom+a.Sa+a.u}function Di(a){return a.marginLeft+a.S+a.j}function Ei(a){return a.marginRight+a.Ya+a.w}
function Fi(a,b){a.d=b.d;a.left=b.left;a.top=b.top;a.marginLeft=b.marginLeft;a.marginRight=b.marginRight;a.marginTop=b.marginTop;a.marginBottom=b.marginBottom;a.S=b.S;a.Ya=b.Ya;a.ba=b.ba;a.Sa=b.Sa;a.j=b.j;a.w=b.w;a.k=b.k;a.u=b.u;a.width=b.width;a.height=b.height;a.D=b.D;a.H=b.H;a.xb=b.xb;a.I=b.I;a.e=b.e;a.kc=b.kc;a.$a=b.$a;a.b=b.b}function Gi(a,b,c){a.top=b;a.height=c;w(a.d,"top",b+"px");w(a.d,"height",c+"px")}function Hi(a,b,c){a.left=b;a.width=c;w(a.d,"left",b+"px");w(a.d,"width",c+"px")}
function Ii(a,b){this.b=a;this.d=b}u(Ii,$c);Ii.prototype.hc=function(a){this.b.appendChild(this.b.ownerDocument.createTextNode(a.b));return null};Ii.prototype.ic=function(a){var b=this.b.ownerDocument.createElementNS("http://www.w3.org/1999/xhtml","img");b.setAttribute("src",a.url);this.b.appendChild(b);return null};Ii.prototype.fb=function(a){this.vb(a.values);return null};
Ii.prototype.Ob=function(a){a=a.ja().evaluate(this.d);"string"===typeof a&&this.b.appendChild(this.b.ownerDocument.createTextNode(a));return null};function Ji(a){return null!=a&&a!==Rd&&a!==Qd&&a!==Hd};function Ki(a){a=a.toString();switch(a){case "inline-flex":a="flex";break;case "inline-grid":a="grid";break;case "inline-table":a="table";break;case "inline":case "table-row-group":case "table-column":case "table-column-group":case "table-header-group":case "table-footer-group":case "table-row":case "table-cell":case "table-caption":case "inline-block":a="block";break}return H(a)}
function Li(a,b,c,d){if(a!==Qd)if(b===qd||b===Dd)c=Qd,a=Ki(a);else if(c&&c!==Qd||d)a=Ki(a);return{display:a,position:b,b:c}}function Mi(a,b,c,d,e,f){e=e||f||Gd;return!!c&&c!==Qd||b===qd||b===Dd||a===Jd||a===ae||a===$d||a==Ed||(a===ud||a===Od)&&!!d&&d!==ge||!!f&&e!==f};function Ni(a,b,c){b=b?"vertical-rl":"horizontal-tb";if("top"===a||"bottom"===a)a=da(a,b,c||null,ha);"block-start"===a&&(a="inline-start");"block-end"===a&&(a="inline-end");if("inline-start"===a||"inline-end"===a){c=da(a,b,c||null,ga);a:{var d=ja[b];if(!d)throw Error("unknown writing-mode: "+b);for(b=0;b<d.length;b++)if(d[b].L===c){b=d[b].K;break a}b=c}"line-left"===b?a="left":"line-right"===b&&(a="right")}"left"!==a&&"right"!==a&&(v.b("Invalid float value: "+a+". Fallback to left."),a="left");return a}
function Oi(a,b){this.d=ni(a);this.b=b}function Pi(a,b,c){this.e=a;this.g=b;this.f=c;this.d=[];this.b=[]}
function Qi(a,b,c){b.parentNode&&b.parentNode.removeChild(b);w(b,"float","none");w(b,"position","absolute");var d=a.g.toString(),e=a.f.toString(),f=da(c,d,e||null,ga),g=da(c,d,e||null,ha);w(b,f,"0");switch(g){case "inline-start":case "inline-end":d=da("block-start",d,e||null,ga);w(b,d,"0");break;case "block-start":case "block-end":c=da("inline-start",d,e||null,ga);w(b,c,"0");d=da("max-inline-size",d,e||null,ga);Ha(b,d)||w(b,d,"100%");break;default:throw Error("unknown float direction: "+c);}a.e().appendChild(b)}
function Ri(a,b,c){b=pi(b);for(var d=0;d<a.d.length;d++){var e=a.d[d];if(Si(c,b,pi(e.d)))return e}return null}function Ti(a,b,c){var d=K("tryToAddFloat");b=new Oi(b,c);a.d.push(b);a.b.push(b);N(d,b);return M(d)}function Ui(a){return a.b.map(function(a){a=a.b;return new ue([new pe(a.aa,a.W),new pe(a.V,a.W),new pe(a.V,a.R),new pe(a.aa,a.R)])})};var Vi={SIMPLE_PROPERTY:"SIMPLE_PROPERTY"},Wi={};function Xi(a,b){if(Vi[a]){var c=Wi[a];c||(c=Wi[a]=[]);c.push(b)}else v.b(Error("Skipping unknown plugin hook '"+a+"'."))}ba("vivliostyle.plugin.registerHook",Xi);ba("vivliostyle.plugin.removeHook",function(a,b){if(Vi[a]){var c=Wi[a];if(c){var d=c.indexOf(b);0<=d&&c.splice(d,1)}}else v.b(Error("Ignoring unknown plugin hook '"+a+"'."))});for(var Yi={azimuth:!0,"border-collapse":!0,"border-spacing":!0,"caption-side":!0,color:!0,cursor:!0,direction:!0,elevation:!0,"empty-cells":!0,"font-kerning":!0,"font-size":!0,"font-size-adjust":!0,"font-family":!0,"font-feature-settings":!0,"font-style":!0,"font-variant":!0,"font-weight":!0,"letter-spacing":!0,"line-break":!0,"line-height":!0,"list-style-image":!0,"list-style-position":!0,"list-style-type":!0,orphans:!0,"overflow-wrap":!0,"pitch-range":!0,quotes:!0,richness:!0,"ruby-align":!0,"ruby-position":!0,
"speak-header":!0,"speak-numeral":!0,"speak-punctuation":!0,"speech-rate":!0,stress:!0,"tab-size":!0,"text-align":!0,"text-align-last":!0,"text-decoration-skip":!0,"text-emphasis-color":!0,"text-emphasis-position":!0,"text-emphasis-style":!0,"text-combine-upright":!0,"text-indent":!0,"text-justify":!0,"text-size-adjust":!0,"text-transform":!0,"text-underline-position":!0,visibility:!0,"voice-family":!0,volume:!0,"white-space":!0,widows:!0,"word-break":!0,"word-spacing":!0,"word-wrap":!0,"writing-mode":!0},
Zi={"http://www.idpf.org/2007/ops":!0,"http://www.w3.org/1999/xhtml":!0,"http://www.w3.org/2000/svg":!0},$i="margin-% padding-% border-%-width border-%-style border-%-color %".split(" "),aj=["left","right","top","bottom"],bj={width:!0,height:!0},cj=0;cj<$i.length;cj++)for(var dj=0;dj<aj.length;dj++){var ej=$i[cj].replace("%",aj[dj]);bj[ej]=!0}function fj(a){for(var b={},c=0;c<$i.length;c++)for(var d in a){var e=$i[c].replace("%",d),f=$i[c].replace("%",a[d]);b[e]=f;b[f]=e}return b}
var gj=fj({before:"right",after:"left",start:"top",end:"bottom"}),hj=fj({before:"top",after:"bottom",start:"left",end:"right"});function V(a,b){this.value=a;this.Ga=b}n=V.prototype;n.Hd=function(){return this};n.rc=function(a){a=this.value.U(a);return a===this.value?this:new V(a,this.Ga)};n.Id=function(a){return 0==a?this:new V(this.value,this.Ga+a)};n.evaluate=function(a,b){return jg(a,this.value,b)};n.Ed=function(){return!0};function ij(a,b,c){V.call(this,a,b);this.M=c}u(ij,V);
ij.prototype.Hd=function(){return new V(this.value,this.Ga)};ij.prototype.rc=function(a){a=this.value.U(a);return a===this.value?this:new ij(a,this.Ga,this.M)};ij.prototype.Id=function(a){return 0==a?this:new ij(this.value,this.Ga+a,this.M)};ij.prototype.Ed=function(a){return!!this.M.evaluate(a)};function jj(a,b,c){return(null==b||c.Ga>b.Ga)&&c.Ed(a)?c.Hd():b}var kj={"region-id":!0};function lj(a){return"_"!=a.charAt(0)&&!kj[a]}function mj(a,b,c){c?a[b]=c:delete a[b]}
function nj(a,b){var c=a[b];c||(c={},a[b]=c);return c}function oj(a,b){var c=a[b];c||(c=[],a[b]=c);return c}function pj(a,b,c,d,e,f){if(e){var g=nj(b,"_pseudos");b=g[e];b||(b={},g[e]=b)}f&&(e=nj(b,"_regions"),b=e[f],b||(b={},e[f]=b));for(var h in c)"_"!=h.charAt(0)&&(kj[h]?(f=c[h],e=oj(b,h),Array.prototype.push.apply(e,f)):mj(b,h,jj(a,b[h],c[h].Id(d))))}
function qj(a,b){if(0<a.length){a.sort(function(a,b){return b.d()-a.d()});for(var c=null,d=a.length-1;0<=d;d--)c=a[d],c.b=b,b=c;return c}return b}function rj(a,b){this.e=a;this.d=b;this.b=""}u(rj,ad);function sj(a){a=a.e["font-size"].value;var b;a:switch(a.ha.toLowerCase()){case "px":case "in":case "pt":case "pc":case "cm":case "mm":case "q":b=!0;break a;default:b=!1}if(!b)throw Error("Unexpected state");return a.C*jc[a.ha]}
rj.prototype.Rb=function(a){if("em"==a.ha||"ex"==a.ha){var b=nc(this.d,a.ha,!1)/nc(this.d,"em",!1);return new I(a.C*b*sj(this),"px")}if("%"==a.ha){if("font-size"===this.b)return new I(a.C/100*sj(this),"px");b=this.b.match(/height|^(top|bottom)$/)?"vh":"vw";return new I(a.C,b)}return a};rj.prototype.Ob=function(a){return"font-size"==this.b?jg(this.d,a,this.b).U(this):a};function tj(){}tj.prototype.apply=function(){};tj.prototype.h=function(a){return new uj([this,a])};tj.prototype.clone=function(){return this};
function vj(a){this.b=a}u(vj,tj);vj.prototype.apply=function(a){a.g[a.g.length-1].push(this.b.b())};function uj(a){this.b=a}u(uj,tj);uj.prototype.apply=function(a){for(var b=0;b<this.b.length;b++)this.b[b].apply(a)};uj.prototype.h=function(a){this.b.push(a);return this};uj.prototype.clone=function(){return new uj([].concat(this.b))};function wj(a,b,c,d){this.style=a;this.P=b;this.b=c;this.f=d}u(wj,tj);wj.prototype.apply=function(a){pj(a.h,a.u,this.style,this.P,this.b,this.f)};
function W(){this.b=null}u(W,tj);W.prototype.apply=function(a){this.b.apply(a)};W.prototype.d=function(){return 0};W.prototype.e=function(){return!1};function xj(a){this.b=null;this.f=a}u(xj,W);xj.prototype.apply=function(a){0<=a.w.indexOf(this.f)&&this.b.apply(a)};xj.prototype.d=function(){return 10};xj.prototype.e=function(a){this.b&&yj(a.Ba,this.f,this.b);return!0};function zj(a){this.b=null;this.id=a}u(zj,W);zj.prototype.apply=function(a){a.O!=this.id&&a.ba!=this.id||this.b.apply(a)};
zj.prototype.d=function(){return 11};zj.prototype.e=function(a){this.b&&yj(a.e,this.id,this.b);return!0};function Aj(a){this.b=null;this.localName=a}u(Aj,W);Aj.prototype.apply=function(a){a.d==this.localName&&this.b.apply(a)};Aj.prototype.d=function(){return 8};Aj.prototype.e=function(a){this.b&&yj(a.gc,this.localName,this.b);return!0};function Bj(a,b){this.b=null;this.f=a;this.localName=b}u(Bj,W);Bj.prototype.apply=function(a){a.d==this.localName&&a.e==this.f&&this.b.apply(a)};Bj.prototype.d=function(){return 8};
Bj.prototype.e=function(a){if(this.b){var b=a.b[this.f];b||(b="ns"+a.g++ +":",a.b[this.f]=b);yj(a.f,b+this.localName,this.b)}return!0};function Cj(a){this.b=null;this.f=a}u(Cj,W);Cj.prototype.apply=function(a){var b=a.b;if(b&&"a"==a.d){var c=b.getAttribute("href");c&&c.match(/^#/)&&(b=b.ownerDocument.getElementById(c.substring(1)))&&(b=b.getAttributeNS("http://www.idpf.org/2007/ops","type"))&&b.match(this.f)&&this.b.apply(a)}};function Dj(a){this.b=null;this.f=a}u(Dj,W);
Dj.prototype.apply=function(a){a.e==this.f&&this.b.apply(a)};function Ej(a,b){this.b=null;this.f=a;this.name=b}u(Ej,W);Ej.prototype.apply=function(a){a.b&&a.b.hasAttributeNS(this.f,this.name)&&this.b.apply(a)};function Fj(a,b,c){this.b=null;this.f=a;this.name=b;this.value=c}u(Fj,W);Fj.prototype.apply=function(a){a.b&&a.b.getAttributeNS(this.f,this.name)==this.value&&this.b.apply(a)};Fj.prototype.d=function(){return"type"==this.name&&"http://www.idpf.org/2007/ops"==this.f?9:0};
Fj.prototype.e=function(a){return"type"==this.name&&"http://www.idpf.org/2007/ops"==this.f?(this.b&&yj(a.d,this.value,this.b),!0):!1};function Gj(a,b){this.b=null;this.f=a;this.name=b}u(Gj,W);Gj.prototype.apply=function(a){if(a.b){var b=a.b.getAttributeNS(this.f,this.name);b&&Zi[b]&&this.b.apply(a)}};Gj.prototype.d=function(){return 0};Gj.prototype.e=function(){return!1};function Hj(a,b,c){this.b=null;this.g=a;this.name=b;this.f=c}u(Hj,W);
Hj.prototype.apply=function(a){if(a.b){var b=a.b.getAttributeNS(this.g,this.name);b&&b.match(this.f)&&this.b.apply(a)}};function Ij(a){this.b=null;this.f=a}u(Ij,W);Ij.prototype.apply=function(a){a.lang.match(this.f)&&this.b.apply(a)};function Jj(){this.b=null}u(Jj,W);Jj.prototype.apply=function(a){a.Sa&&this.b.apply(a)};Jj.prototype.d=function(){return 6};function Kj(){this.b=null}u(Kj,W);Kj.prototype.apply=function(a){a.ma&&this.b.apply(a)};Kj.prototype.d=function(){return 12};
function Lj(a,b){this.b=null;this.f=a;this.Sb=b}u(Lj,W);function Mj(a,b){var c=a.f;b-=a.Sb;return 0===c?0===b:0===b%c&&0<=b/c}function Nj(a,b){Lj.call(this,a,b)}u(Nj,Lj);Nj.prototype.apply=function(a){Mj(this,a.za)&&this.b.apply(a)};Nj.prototype.d=function(){return 5};function Oj(a,b){Lj.call(this,a,b)}u(Oj,Lj);Oj.prototype.apply=function(a){Mj(this,a.$a[a.e][a.d])&&this.b.apply(a)};Oj.prototype.d=function(){return 5};function Pj(a,b){Lj.call(this,a,b)}u(Pj,Lj);
Pj.prototype.apply=function(a){var b=a.I;null===b&&(b=a.I=a.b.parentNode.childElementCount-a.za+1);Mj(this,b)&&this.b.apply(a)};Pj.prototype.d=function(){return 4};function Qj(a,b){Lj.call(this,a,b)}u(Qj,Lj);Qj.prototype.apply=function(a){var b=a.Za;if(!b[a.e]){var c=a.b;do{var d=c.namespaceURI,e=c.localName,f=b[d];f||(f=b[d]={});f[e]=(f[e]||0)+1}while(c=c.nextElementSibling)}Mj(this,b[a.e][a.d])&&this.b.apply(a)};Qj.prototype.d=function(){return 4};function Rj(){this.b=null}u(Rj,W);
Rj.prototype.apply=function(a){for(var b=a.b.firstChild;b;){switch(b.nodeType){case Node.ELEMENT_NODE:return;case Node.TEXT_NODE:if(0<b.length)return}b=b.nextSibling}this.b.apply(a)};Rj.prototype.d=function(){return 4};function Sj(){this.b=null}u(Sj,W);Sj.prototype.apply=function(a){!1===a.b.disabled&&this.b.apply(a)};Sj.prototype.d=function(){return 5};function Tj(){this.b=null}u(Tj,W);Tj.prototype.apply=function(a){!0===a.b.disabled&&this.b.apply(a)};Tj.prototype.d=function(){return 5};
function Uj(){this.b=null}u(Uj,W);Uj.prototype.apply=function(a){var b=a.b;!0!==b.selected&&!0!==b.checked||this.b.apply(a)};Uj.prototype.d=function(){return 5};function Vj(a){this.b=null;this.M=a}u(Vj,W);Vj.prototype.apply=function(a){a.j[this.M]&&this.b.apply(a)};Vj.prototype.d=function(){return 5};function Wj(){this.b=!1}u(Wj,tj);Wj.prototype.apply=function(){this.b=!0};Wj.prototype.clone=function(){var a=new Wj;a.b=this.b;return a};
function Xj(a){this.b=null;this.f=new Wj;this.g=qj(a,this.f)}u(Xj,W);Xj.prototype.apply=function(a){this.g.apply(a);this.f.b||this.b.apply(a);this.f.b=!1};Xj.prototype.d=function(){return this.g.d()};function Yj(a){this.M=a}Yj.prototype.b=function(){return this};Yj.prototype.push=function(a,b){0==b&&Zj(a,this.M);return!1};Yj.prototype.pop=function(a,b){return 0==b?(a.j[this.M]--,!0):!1};function ak(a){this.M=a}ak.prototype.b=function(){return this};
ak.prototype.push=function(a,b){0==b?Zj(a,this.M):1==b&&a.j[this.M]--;return!1};ak.prototype.pop=function(a,b){if(0==b)return a.j[this.M]--,!0;1==b&&Zj(a,this.M);return!1};function bk(a){this.M=a;this.d=!1}bk.prototype.b=function(){return new bk(this.M)};bk.prototype.push=function(a){return this.d?(a.j[this.M]--,!0):!1};bk.prototype.pop=function(a,b){if(this.d)return a.j[this.M]--,!0;0==b&&(this.d=!0,Zj(a,this.M));return!1};function ck(a){this.M=a;this.d=!1}ck.prototype.b=function(){return new ck(this.M)};
ck.prototype.push=function(a,b){this.d&&(-1==b?Zj(a,this.M):0==b&&a.j[this.M]--);return!1};ck.prototype.pop=function(a,b){if(this.d){if(-1==b)return a.j[this.M]--,!0;0==b&&Zj(a,this.M)}else 0==b&&(this.d=!0,Zj(a,this.M));return!1};function dk(a){this.d=a}dk.prototype.b=function(){return this};dk.prototype.push=function(){return!1};dk.prototype.pop=function(a,b){return 0==b?(ek(a,this.d),!0):!1};function fk(a){this.lang=a}fk.prototype.b=function(){return this};fk.prototype.push=function(){return!1};
fk.prototype.pop=function(a,b){return 0==b?(a.lang=this.lang,!0):!1};function gk(a){this.d=a}gk.prototype.b=function(){return this};gk.prototype.push=function(){return!1};gk.prototype.pop=function(a,b){return 0==b?(a.D=this.d,!0):!1};function hk(a){this.b=a}u(hk,ad);function ik(a,b){switch(b){case "url":return a?new nd(a):new nd("about:invalid");default:return a?new id(a):new id("")}}
hk.prototype.jb=function(a){if("attr"!==a.name)return ad.prototype.jb.call(this,a);var b="string",c=null,d=null;a.values[0]instanceof bd?(2<=a.values[0].values.length&&(b=a.values[0].values[1].stringValue()),c=a.values[0].values[0].stringValue()):c=a.values[0].stringValue();d=1<a.values.length?ik(a.values[1].stringValue(),b):ik(null,b);return this.b&&this.b.hasAttribute(c)?ik(this.b.getAttribute(c),b):d};function jk(a,b,c){this.d=a;this.b=c}u(jk,ad);
jk.prototype.ub=function(a){var b=this.d,c=b.D,d=Math.floor(c.length/2)-1;switch(a.name){case "open-quote":a=c[2*Math.min(d,b.l)];b.l++;break;case "close-quote":return 0<b.l&&b.l--,c[2*Math.min(d,b.l)+1];case "no-open-quote":return b.l++,new id("");case "no-close-quote":return 0<b.l&&b.l--,new id("")}return a};
var kk={roman:[4999,1E3,"M",900,"CM",500,"D",400,"CD",100,"C",90,"XC",50,"L",40,"XL",10,"X",9,"IX",5,"V",4,"IV",1,"I"],armenian:[9999,9E3,"\u0584",8E3,"\u0583",7E3,"\u0582",6E3,"\u0581",5E3,"\u0580",4E3,"\u057f",3E3,"\u057e",2E3,"\u057d",1E3,"\u057c",900,"\u057b",800,"\u057a",700,"\u0579",600,"\u0578",500,"\u0577",400,"\u0576",300,"\u0575",200,"\u0574",100,"\u0573",90,"\u0572",80,"\u0571",70,"\u0570",60,"\u056f",50,"\u056e",40,"\u056d",30,"\u056c",20,"\u056b",10,"\u056a",9,"\u0569",8,"\u0568",7,"\u0567",
6,"\u0566",5,"\u0565",4,"\u0564",3,"\u0563",2,"\u0562",1,"\u0561"],georgian:[19999,1E4,"\u10f5",9E3,"\u10f0",8E3,"\u10ef",7E3,"\u10f4",6E3,"\u10ee",5E3,"\u10ed",4E3,"\u10ec",3E3,"\u10eb",2E3,"\u10ea",1E3,"\u10e9",900,"\u10e8",800,"\u10e7",700,"\u10e6",600,"\u10e5",500,"\u10e4",400,"\u10f3",300,"\u10e2",200,"\u10e1",100,"\u10e0",90,"\u10df",80,"\u10de",70,"\u10dd",60,"\u10f2",50,"\u10dc",40,"\u10db",30,"\u10da",20,"\u10d9",10,"\u10d8",9,"\u10d7",8,"\u10f1",7,"\u10d6",6,"\u10d5",5,"\u10d4",4,"\u10d3",
3,"\u10d2",2,"\u10d1",1,"\u10d0"],hebrew:[999,400,"\u05ea",300,"\u05e9",200,"\u05e8",100,"\u05e7",90,"\u05e6",80,"\u05e4",70,"\u05e2",60,"\u05e1",50,"\u05e0",40,"\u05de",30,"\u05dc",20,"\u05db",19,"\u05d9\u05d8",18,"\u05d9\u05d7",17,"\u05d9\u05d6",16,"\u05d8\u05d6",15,"\u05d8\u05d5",10,"\u05d9",9,"\u05d8",8,"\u05d7",7,"\u05d6",6,"\u05d5",5,"\u05d4",4,"\u05d3",3,"\u05d2",2,"\u05d1",1,"\u05d0"]},lk={latin:"a-z",alpha:"a-z",greek:"\u03b1-\u03c1\u03c3-\u03c9",russian:"\u0430-\u0438\u043a-\u0449\u044d-\u044f"},
mk={square:"\u25a0",disc:"\u2022",circle:"\u25e6",none:""},nk={De:!1,Tb:"\u96f6\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d",uc:"\u5341\u767e\u5343",ae:"\u8ca0"};
function ok(a){if(9999<a||-9999>a)return""+a;if(0==a)return nk.Tb.charAt(0);var b=new Ia;0>a&&(b.append(nk.ae),a=-a);if(10>a)b.append(nk.Tb.charAt(a));else if(nk.Ee&&19>=a)b.append(nk.uc.charAt(0)),0!=a&&b.append(nk.uc.charAt(a-10));else{var c=Math.floor(a/1E3);c&&(b.append(nk.Tb.charAt(c)),b.append(nk.uc.charAt(2)));if(c=Math.floor(a/100)%10)b.append(nk.Tb.charAt(c)),b.append(nk.uc.charAt(1));if(c=Math.floor(a/10)%10)b.append(nk.Tb.charAt(c)),b.append(nk.uc.charAt(0));(a%=10)&&b.append(nk.Tb.charAt(a))}return b.toString()}
function pk(a,b){var c=!1,d=!1,e;null!=(e=b.match(/^upper-(.*)/))?(c=!0,b=e[1]):null!=(e=b.match(/^lower-(.*)/))&&(d=!0,b=e[1]);e="";if(kk[b])a:{e=kk[b];var f=a;if(f>e[0]||0>=f||f!=Math.round(f))e="";else{for(var g="",h=1;h<e.length;h+=2){var l=e[h],k=Math.floor(f/l);if(20<k){e="";break a}for(f-=k*l;0<k;)g+=e[h+1],k--}e=g}}else if(lk[b])if(e=a,0>=e||e!=Math.round(e))e="";else{g=lk[b];f=[];for(h=0;h<g.length;)if("-"==g.substr(h+1,1))for(k=g.charCodeAt(h),l=g.charCodeAt(h+2),h+=3;k<=l;k++)f.push(String.fromCharCode(k));
else f.push(g.substr(h++,1));g="";do e--,h=e%f.length,g=f[h]+g,e=(e-h)/f.length;while(0<e);e=g}else null!=mk[b]?e=mk[b]:"decimal-leading-zero"==b?(e=a+"",1==e.length&&(e="0"+e)):"cjk-ideographic"==b||"trad-chinese-informal"==b?e=ok(a):e=a+"";return c?e.toUpperCase():d?e.toLowerCase():e}
function qk(a,b){var c=b[0].toString(),d=1<b.length?b[1].stringValue():"decimal",e=a.d.f[c];if(e&&e.length)return new id(pk(e&&e.length&&e[e.length-1]||0,d));c=new J(rk(a.b,c,function(a){return pk(a||0,d)}));return new bd([c])}
function sk(a,b){var c=b[0].toString(),d=b[1].stringValue(),e=2<b.length?b[2].stringValue():"decimal",f=a.d.f[c],g=new Ia;if(f&&f.length)for(var h=0;h<f.length;h++)0<h&&g.append(d),g.append(pk(f[h],e));c=new J(tk(a.b,c,function(a){var b=[];if(a.length)for(var c=0;c<a.length;c++)b.push(pk(a[c],e));a=g.toString();a.length&&b.push(a);return b.length?b.join(d):pk(0,e)}));return new bd([c])}
function uk(a,b){var c=b[0],c=c instanceof nd?c.url:c.stringValue(),d=b[1].toString(),e=2<b.length?b[2].stringValue():"decimal",c=new J(vk(a.b,c,d,function(a){return pk(a||0,e)}));return new bd([c])}function wk(a,b){var c=b[0],c=c instanceof nd?c.url:c.stringValue(),d=b[1].toString(),e=b[2].stringValue(),f=3<b.length?b[3].stringValue():"decimal",c=new J(xk(a.b,c,d,function(a){a=a.map(function(a){return pk(a,f)});return a.length?a.join(e):pk(0,f)}));return new bd([c])}
jk.prototype.jb=function(a){switch(a.name){case "counter":if(2>=a.values.length)return qk(this,a.values);break;case "counters":if(3>=a.values.length)return sk(this,a.values);break;case "target-counter":if(3>=a.values.length)return uk(this,a.values);break;case "target-counters":if(4>=a.values.length)return wk(this,a.values)}v.b("E_CSS_CONTENT_PROP:",a.toString());return new id("")};var yk=1/1048576;function zk(a,b){for(var c in a)b[c]=a[c].clone()}
function Ak(){this.g=0;this.b={};this.gc={};this.f={};this.d={};this.Ba={};this.e={};this.Yb={};this.Q=0}Ak.prototype.clone=function(){var a=new Ak;a.g=this.g;for(var b in this.b)a.b[b]=this.b[b];zk(this.gc,a.gc);zk(this.f,a.f);zk(this.d,a.d);zk(this.Ba,a.Ba);zk(this.e,a.e);zk(this.Yb,a.Yb);a.Q=this.Q;return a};function yj(a,b,c){var d=a[b];d&&(c=d.h(c));a[b]=c}
function Bk(a,b,c,d){this.k=a;this.h=b;this.Eb=c;this.Ya=d;this.g=[[],[]];this.j={};this.w=this.u=this.b=null;this.oa=this.ba=this.O=this.e=this.d="";this.S=this.H=null;this.ma=this.Sa=!0;this.f={};this.B=[{}];this.D=[new id("\u201c"),new id("\u201d"),new id("\u2018"),new id("\u2019")];this.l=0;this.lang="";this.yb=[0];this.za=0;this.ka=[{}];this.$a=this.ka[0];this.I=null;this.wb=[this.I];this.xb=[{}];this.Za=this.ka[0];this.gb=[]}function Zj(a,b){a.j[b]=(a.j[b]||0)+1}
function Ck(a,b,c){(b=b[c])&&b.apply(a)}var Dk=[];function Ek(a,b,c,d){a.b=null;a.u=d;a.e="";a.d="";a.O="";a.ba="";a.w=b;a.oa="";a.H=Dk;a.S=c;Fk(a)}function Gk(a,b,c){a.f[b]?a.f[b].push(c):a.f[b]=[c];c=a.B[a.B.length-1];c||(c={},a.B[a.B.length-1]=c);c[b]=!0}
function Hk(a,b){var c=Id,d=b.display;d&&(c=d.evaluate(a.h));var e=null,f=d=null,g=b["counter-reset"];g&&(g=g.evaluate(a.h))&&(e=qg(g,!0));(g=b["counter-set"])&&(g=g.evaluate(a.h))&&(f=qg(g,!1));(g=b["counter-increment"])&&(g=g.evaluate(a.h))&&(d=qg(g,!1));"ol"!=a.d&&"ul"!=a.d||"http://www.w3.org/1999/xhtml"!=a.e||(e||(e={}),e["ua-list-item"]=0);c===Od&&(d||(d={}),d["ua-list-item"]=1);if(e)for(var h in e)Gk(a,h,e[h]);if(f)for(var l in f)a.f[l]?(h=a.f[l],h[h.length-1]=f[l]):Gk(a,l,f[l]);if(d)for(var k in d)a.f[k]||
Gk(a,k,0),h=a.f[k],h[h.length-1]+=d[k];c===Od&&(c=a.f["ua-list-item"],b["ua-list-item-count"]=new V(new kd(c[c.length-1]),0));a.B.push(null)}function Ik(a){var b=a.B.pop();if(b)for(var c in b)(b=a.f[c])&&(1==b.length?delete a.f[c]:b.pop())}function ek(a,b){Hk(a,b);b.content&&(b.content=b.content.rc(new jk(a,0,a.Ya)));Ik(a)}var Jk="before transclusion-before footnote-call footnote-marker inner first-letter first-line  transclusion-after after".split(" ");
function Kk(a,b,c){a.gb.push(b);a.S=null;a.b=b;a.u=c;a.e=b.namespaceURI;a.d=b.localName;var d=a.k.b[a.e];a.oa=d?d+a.d:"";a.O=b.getAttribute("id");a.ba=b.getAttributeNS("http://www.w3.org/XML/1998/namespace","id");(d=b.getAttribute("class"))?a.w=d.split(/\s+/):a.w=Dk;(d=b.getAttributeNS("http://www.idpf.org/2007/ops","type"))?a.H=d.split(/\s+/):a.H=Dk;"style"==a.d&&"http://www.gribuser.ru/xml/fictionbook/2.0"==a.e&&(a.w=[b.getAttribute("name")||""]);(d=b.getAttributeNS("http://www.w3.org/XML/1998/namespace",
"lang"))||"http://www.w3.org/1999/xhtml"!=a.e||(d=b.getAttribute("lang"));d&&(a.g[a.g.length-1].push(new fk(a.lang)),a.lang=d.toLowerCase());var d=a.ma,e=a.yb;a.za=++e[e.length-1];e.push(0);var e=a.ka,f=a.$a=e[e.length-1],g=f[a.e];g||(g=f[a.e]={});g[a.d]=(g[a.d]||0)+1;e.push({});e=a.wb;null!==e[e.length-1]?a.I=--e[e.length-1]:a.I=null;e.push(null);e=a.xb;(f=a.Za=e[e.length-1])&&f[a.e]&&f[a.e][a.d]--;e.push({});Fk(a);Lk(a,b);c=c.quotes;b=null;c&&(c=c.evaluate(a.h))&&(b=new gk(a.D),c===Qd?a.D=[new id(""),
new id("")]:c instanceof bd&&(a.D=c.values));Hk(a,a.u);c=a.O||a.ba||"";if(d||c){var h={};Object.keys(a.f).forEach(function(a){h[a]=Array.b(this.f[a])},a);Mk(a.Eb,c,h)}if(c=a.u._pseudos)for(d=!0,e=0;e<Jk.length;e++)(f=Jk[e])||(d=!1),(f=c[f])&&(d?ek(a,f):a.g[a.g.length-2].push(new dk(f)));b&&a.g[a.g.length-2].push(b)}function Nk(a,b){for(var c in b)lj(c)&&(b[c]=b[c].rc(a))}function Lk(a,b){var c=new hk(b),d=a.u,e=d._pseudos,f;for(f in e)Nk(c,e[f]);Nk(c,d)}
function Fk(a){var b;for(b=0;b<a.w.length;b++)Ck(a,a.k.Ba,a.w[b]);for(b=0;b<a.H.length;b++)Ck(a,a.k.d,a.H[b]);Ck(a,a.k.e,a.O);Ck(a,a.k.gc,a.d);""!=a.d&&Ck(a,a.k.gc,"*");Ck(a,a.k.f,a.oa);null!==a.S&&(Ck(a,a.k.Yb,a.S),Ck(a,a.k.Yb,"*"));a.b=null;a.g.push([]);for(var c=1;-1<=c;--c){var d=a.g[a.g.length-c-2];for(b=0;b<d.length;)d[b].push(a,c)?d.splice(b,1):b++}a.Sa=!0;a.ma=!1}
Bk.prototype.pop=function(){for(var a=1;-1<=a;--a)for(var b=this.g[this.g.length-a-2],c=0;c<b.length;)b[c].pop(this,a)?b.splice(c,1):c++;this.g.pop();this.Sa=!1};var Ok=null;function Pk(a,b,c,d,e,f,g){Ef.call(this,a,b,g);this.b=null;this.P=0;this.f=this.h=null;this.l=!1;this.M=c;this.g=d?d.g:Ok?Ok.clone():new Ak;this.w=e;this.k=f;this.j=0}u(Pk,Ff);Pk.prototype.Jd=function(a){yj(this.g.gc,"*",a)};function Qk(a,b){var c=qj(a.b,b);c!==b&&c.e(a.g)||a.Jd(c)}
Pk.prototype.hb=function(a,b){if(b||a)this.P+=1,b&&a?this.b.push(new Bj(a,b.toLowerCase())):b?this.b.push(new Aj(b.toLowerCase())):this.b.push(new Dj(a))};Pk.prototype.Oc=function(a){this.f?(v.b("::"+this.f,"followed by ."+a),this.b.push(new Vj(""))):(this.P+=256,this.b.push(new xj(a)))};var Rk={"nth-child":Nj,"nth-of-type":Oj,"nth-last-child":Pj,"nth-last-of-type":Qj};
Pk.prototype.Zb=function(a,b){if(this.f)v.b("::"+this.f,"followed by :"+a),this.b.push(new Vj(""));else{switch(a.toLowerCase()){case "enabled":this.b.push(new Sj);break;case "disabled":this.b.push(new Tj);break;case "checked":this.b.push(new Uj);break;case "root":this.b.push(new Kj);break;case "link":this.b.push(new Aj("a"));this.b.push(new Ej("","href"));break;case "-adapt-href-epub-type":case "href-epub-type":if(b&&1==b.length&&"string"==typeof b[0]){var c=new RegExp("(^|s)"+xa(b[0])+"($|s)");this.b.push(new Cj(c))}else this.b.push(new Vj(""));
break;case "-adapt-footnote-content":case "footnote-content":this.l=!0;break;case "visited":case "active":case "hover":case "focus":this.b.push(new Vj(""));break;case "lang":b&&1==b.length&&"string"==typeof b[0]?this.b.push(new Ij(new RegExp("^"+xa(b[0].toLowerCase())+"($|-)"))):this.b.push(new Vj(""));break;case "nth-child":case "nth-last-child":case "nth-of-type":case "nth-last-of-type":c=Rk[a.toLowerCase()];b&&2==b.length?this.b.push(new c(b[0],b[1])):this.b.push(new Vj(""));break;case "first-child":this.b.push(new Jj);
break;case "last-child":this.b.push(new Pj(0,1));break;case "first-of-type":this.b.push(new Oj(0,1));break;case "last-of-type":this.b.push(new Qj(0,1));break;case "only-child":this.b.push(new Jj);this.b.push(new Pj(0,1));break;case "only-of-type":this.b.push(new Oj(0,1));this.b.push(new Qj(0,1));break;case "empty":this.b.push(new Rj);break;case "before":case "after":case "first-line":case "first-letter":this.$b(a,b);return;default:v.b("unknown pseudo-class selector: "+a),this.b.push(new Vj(""))}this.P+=
256}};
Pk.prototype.$b=function(a,b){switch(a){case "before":case "after":case "first-line":case "first-letter":case "footnote-call":case "footnote-marker":case "inner":this.f?(v.b("Double pseudoelement ::"+this.f+"::"+a),this.b.push(new Vj(""))):this.f=a;break;case "first-n-lines":if(b&&1==b.length&&"number"==typeof b[0]){var c=Math.round(b[0]);if(0<c&&c==b[0]){this.f?(v.b("Double pseudoelement ::"+this.f+"::"+a),this.b.push(new Vj(""))):this.f="first-"+c+"-lines";break}}default:v.b("Unrecognized pseudoelement: ::"+a),
this.b.push(new Vj(""))}this.P+=1};Pk.prototype.Uc=function(a){this.P+=65536;this.b.push(new zj(a))};
Pk.prototype.nc=function(a,b,c,d){this.P+=256;b=b.toLowerCase();d=d||"";var e;switch(c){case 0:e=new Ej(a,b);break;case 39:e=new Fj(a,b,d);break;case 45:!d||d.match(/\s/)?e=new Vj(""):e=new Hj(a,b,new RegExp("(^|\\s)"+xa(d)+"($|\\s)"));break;case 44:e=new Hj(a,b,new RegExp("^"+xa(d)+"($|-)"));break;case 43:d?e=new Hj(a,b,new RegExp("^"+xa(d))):e=new Vj("");break;case 42:d?e=new Hj(a,b,new RegExp(xa(d)+"$")):e=new Vj("");break;case 46:d?e=new Hj(a,b,new RegExp(xa(d))):e=new Vj("");break;case 50:"supported"==
d?e=new Gj(a,b):(v.b("Unsupported :: attr selector op:",d),e=new Vj(""));break;default:v.b("Unsupported attr selector:",c),e=new Vj("")}this.b.push(e)};var Sk=0;n=Pk.prototype;n.lb=function(){var a="d"+Sk++;Qk(this,new vj(new Yj(a)));this.b=[new Vj(a)]};n.Nc=function(){var a="c"+Sk++;Qk(this,new vj(new ak(a)));this.b=[new Vj(a)]};n.Mc=function(){var a="a"+Sk++;Qk(this,new vj(new bk(a)));this.b=[new Vj(a)]};n.Rc=function(){var a="f"+Sk++;Qk(this,new vj(new ck(a)));this.b=[new Vj(a)]};
n.Jb=function(){Tk(this);this.f=null;this.l=!1;this.P=0;this.b=[]};n.eb=function(){var a;0!=this.j?(Hf(this,"E_CSS_UNEXPECTED_SELECTOR"),a=!0):a=!1;a||(this.j=1,this.h={},this.f=null,this.P=0,this.l=!1,this.b=[])};n.error=function(a,b){Ff.prototype.error.call(this,a,b);1==this.j&&(this.j=0)};n.Nb=function(a){Ff.prototype.Nb.call(this,a);this.j=0};n.ra=function(){Tk(this);Ff.prototype.ra.call(this);1==this.j&&(this.j=0)};n.mb=function(){Ff.prototype.mb.call(this)};
function Tk(a){if(a.b){var b=a.P,c;c=a.g;c=c.Q+=yk;Qk(a,a.Ld(b+c));a.b=null;a.f=null;a.l=!1;a.P=0}}n.Ld=function(a){var b=this.w;this.l&&(b=b?"xxx-bogus-xxx":"footnote");return new wj(this.h,a,this.f,b)};n.bb=function(a,b,c){eh(this.k,a,b,c,this)};n.Wb=function(a,b){Gf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};n.Gc=function(a,b){Gf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};
n.cb=function(a,b,c){"display"!=a||b!==Td&&b!==Sd||(this.cb("flow-options",new bd([Bd,Yd]),c),this.cb("flow-into",b,c),b=ud);(Wi.SIMPLE_PROPERTY||[]).forEach(function(d){d=d({name:a,value:b,important:c});a=d.name;b=d.value;c=d.important});var d=c?Af(this):Bf(this);mj(this.h,a,this.M?new ij(b,d,this.M):new V(b,d))};n.dc=function(a){switch(a){case "not":a=new Uk(this),a.eb(),Df(this.$,a)}};function Uk(a){Pk.call(this,a.d,a.$,a.M,a,a.w,a.k,!1);this.parent=a;this.e=a.b}u(Uk,Pk);n=Uk.prototype;
n.dc=function(a){"not"==a&&Hf(this,"E_CSS_UNEXPECTED_NOT")};n.ra=function(){Hf(this,"E_CSS_UNEXPECTED_RULE_BODY")};n.Jb=function(){Hf(this,"E_CSS_UNEXPECTED_NEXT_SELECTOR")};n.oc=function(){this.b&&0<this.b.length&&this.e.push(new Xj(this.b));this.parent.P+=this.P;var a=this.$;a.b=a.e.pop()};n.error=function(a,b){Pk.prototype.error.call(this,a,b);var c=this.$;c.b=c.e.pop()};function Vk(a,b){Ef.call(this,a,b,!1)}u(Vk,Ff);
Vk.prototype.bb=function(a,b){if(this.d.values[a])this.error("E_CSS_NAME_REDEFINED "+a,this.Vb());else{var c=a.match(/height|^(top|bottom)$/)?"vh":"vw",c=new Pc(this.d,100,c),c=b.ja(this.d,c);this.d.values[a]=c}};function Wk(a,b,c,d,e){Ef.call(this,a,b,!1);this.b=d;this.M=c;this.e=e}u(Wk,Ff);Wk.prototype.bb=function(a,b,c){c?v.b("E_IMPORTANT_NOT_ALLOWED"):eh(this.e,a,b,c,this)};Wk.prototype.Wb=function(a,b){v.b("E_INVALID_PROPERTY_VALUE",a+":",b.toString())};
Wk.prototype.Gc=function(a,b){v.b("E_INVALID_PROPERTY",a+":",b.toString())};Wk.prototype.cb=function(a,b,c){c=c?Af(this):Bf(this);c+=this.Q;this.Q+=yk;mj(this.b,a,this.M?new ij(b,c,this.M):new V(b,c))};function Xk(a,b){cg.call(this,a);this.b={};this.e=b;this.Q=0}u(Xk,cg);Xk.prototype.bb=function(a,b,c){eh(this.e,a,b,c,this)};Xk.prototype.Wb=function(a,b){v.b("E_INVALID_PROPERTY_VALUE",a+":",b.toString())};Xk.prototype.Gc=function(a,b){v.b("E_INVALID_PROPERTY",a+":",b.toString())};
Xk.prototype.cb=function(a,b,c){c=(c?67108864:50331648)+this.Q;this.Q+=yk;mj(this.b,a,new V(b,c))};function Yk(a,b,c){return(a=a["writing-mode"])&&(b=a.evaluate(b,"writing-mode"))&&b!==Hd?b===fe:c}function Zk(a,b,c,d){var e={},f;for(f in a)lj(f)&&(e[f]=a[f]);a=a._regions;if((c||d)&&a)for(d&&(d=["footnote"],c=c?c.concat(d):d),d=0;d<c.length;d++){f=a[c[d]];for(var g in f)lj(g)&&(e[g]=jj(b,e[g],f[g]))}return e}
function $k(a,b,c,d){c=c?gj:hj;for(var e in a)if(a.hasOwnProperty(e)){var f=a[e];if(f){var g=c[e];if(g){var h=a[g];if(h&&h.Ga>f.Ga)continue;g=bj[g]?g:e}else g=e;b[g]=d(e,f)}}};function al(a,b,c){this.e=a;this.d=b;this.b=c}function bl(){this.map=[]}function cl(a){return 0==a.map.length?0:a.map[a.map.length-1].b}function dl(a,b){if(0==a.map.length)a.map.push(new al(b,b,b));else{var c=a.map[a.map.length-1],d=c.b+b-c.d;c.d==c.e?(c.d=b,c.e=b,c.b=d):a.map.push(new al(b,b,d))}}function el(a,b){0==a.map.length?a.map.push(new al(b,0,0)):a.map[a.map.length-1].d=b}function fl(a,b){var c=Qa(a.map.length,function(c){return b<=a.map[c].d}),c=a.map[c];return c.b-Math.max(0,c.e-b)}
function gl(a,b){var c=Qa(a.map.length,function(c){return b<=a.map[c].b}),c=a.map[c];return c.e-(c.b-b)}function hl(a,b,c,d,e,f,g,h){this.l=a;this.style=b;this.offset=c;this.u=d;this.g=e;this.b=e.b;this.Ea=f;this.Ia=g;this.w=h;this.h=this.j=null;this.k={};this.e=this.d=this.f=null;il(this)&&(b=b._pseudos)&&b.before&&(a=new hl(a,b.before,c,!1,e,jl(this),g,!0),c=kl(a,"content"),Ji(c)&&(this.f=a,this.e=a.e));this.e=ll(ml(this,"before"),this.e);this.Ia&&nl[this.e]&&(e.e=ll(e.e,this.e))}
function kl(a,b,c){if(!(b in a.k)){var d=a.style[b];a.k[b]=d?d.evaluate(a.l,b):c||null}return a.k[b]}function ol(a){return kl(a,"display",Id)}function jl(a){if(null===a.j){var b=ol(a),c=kl(a,"position"),d=kl(a,"float");a.j=Li(b,c,d,a.u).display===ud}return a.j}function il(a){null===a.h&&(a.h=a.w&&ol(a)!==Qd);return a.h}function ml(a,b){var c=null;if(jl(a)){var d=kl(a,"break-"+b);d&&(c=d.toString())}return c}function pl(a){this.e=a;this.b=[];this.Ia=this.Ea=!0;this.d=[]}
function ql(a){return a.b[a.b.length-1]}function rl(a){return a.b.every(function(a){return ol(a)!==Qd})}pl.prototype.push=function(a,b,c,d){var e=ql(this);d&&e&&d.b!==e.b&&this.d.push({Ea:this.Ea,Ia:this.Ia});e=d||e.g;d=this.Ia||!!d;var f=rl(this);a=new hl(this.e,a,b,c,e,d||this.Ea,d,f);this.b.push(a);this.Ea=il(a)?!a.f&&jl(a):this.Ea;this.Ia=il(a)?!a.f&&d:this.Ia;return a};
pl.prototype.pop=function(a){var b=this.b.pop(),c=this.Ea,d=this.Ia;if(il(b)){var e=b.style._pseudos;e&&e.after&&(a=new hl(b.l,e.after,a,!1,b.g,c,d,!0),c=kl(a,"content"),Ji(c)&&(b.d=a))}this.Ia&&b.d&&(a=ml(b.d,"before"),b.g.e=ll(b.g.e,a));if(a=ql(this))a.b===b.b?il(b)&&(this.Ea=this.Ia=!1):(a=this.d.pop(),this.Ea=a.Ea,this.Ia=a.Ia);return b};
function sl(a,b){if(!b.Ea)return b.offset;var c=a.b.length-1,d=a.b[c];d===b&&(c--,d=a.b[c]);for(;0<=c;){if(d.b!==b.b)return b.offset;if(!d.Ea||d.u)return d.offset;b=d;d=a.b[--c]}throw Error("No block start offset found!");}
function tl(a,b,c,d,e,f,g,h){this.Z=a;this.root=a.root;this.za=c;this.f=d;this.j=f;this.d=this.root;this.H={};this.I={};this.l={};this.w=[];this.k=this.D=this.B=null;this.O=new Bk(b,d,g,h);this.e=new bl;this.Na=!0;this.ba=[];this.oa=e;this.ma=this.ka=!1;this.b=a=wh(a,this.root);this.S={};this.g=new pl(d);dl(this.e,a);d=ul(this,this.root);Kk(this.O,this.root,d);vl(this,d,!1);this.u=!0;switch(this.root.namespaceURI){case "http://www.w3.org/1999/xhtml":case "http://www.gribuser.ru/xml/fictionbook/2.0":this.u=
!1}this.ba.push(!0);this.I={};this.I["e"+a]=d;this.b++;wl(this,-1)}function xl(a,b,c,d){return(b=b[d])&&b.evaluate(a.f)!==c[d]}function yl(a,b,c){for(var d in c){var e=b[d];e?(a.H[d]=e,delete b[d]):(e=c[d])&&(a.H[d]=new V(e,33554432))}}var Al=["column-count","column-width"];
function vl(a,b,c){c||["writing-mode","direction"].forEach(function(a){b[a]&&(this.H[a]=b[a])},a);if(!a.ka){var d=xl(a,b,a.j.g,"background-color")?b["background-color"].evaluate(a.f):null,e=xl(a,b,a.j.g,"background-image")?b["background-image"].evaluate(a.f):null;if(d&&d!==Hd||e&&e!==Hd)yl(a,b,a.j.g),a.ka=!0}if(!a.ma)for(d=0;d<Al.length;d++)if(xl(a,b,a.j.j,Al[d])){yl(a,b,a.j.j);a.ma=!0;break}if(!c&&(c=b["font-size"])){d=c.evaluate(a.f);c=d.C;switch(d.ha){case "em":case "rem":c*=a.f.j;break;case "ex":case "rex":c*=
a.f.j*jc.ex/jc.em;break;case "%":c*=a.f.j/100;break;default:(d=jc[d.ha])&&(c*=d)}a.f.S=c}}function Dl(a){for(var b=0;!a.u&&(b+=5E3,El(a,b,0)!=Number.POSITIVE_INFINITY););return a.H}function ul(a,b){if(b.style instanceof CSSStyleDeclaration){var c=b.getAttribute("style");if(c){var d=a.Z.url,e=new Xk(a.za,a.j),c=new Tb(c,e);try{bg(new Tf(Jf,c,e,d),Number.POSITIVE_INFINITY,!1,!0,!1,!1)}catch(f){v.b(f,"Style attribute parse error:")}return e.b}}return{}}
function wl(a,b){if(!(b>=a.b)){var c=a.f,d=wh(a.Z,a.root);if(b<d){var e=a.h(a.root,!1),f=e["flow-into"],f=f?f.evaluate(c,"flow-into").toString():"body",f=Fl(a,f,e,a.root,d);0===a.g.b.length&&a.g.push(e,d,!0,f)}d=zh(a.Z,b);e=xh(a.Z,d,0,!1);if(!(e>=a.b))for(;;){if(1!=d.nodeType)e+=d.textContent.length;else{var g=d;if(e!=wh(a.Z,g))throw Error("Inconsistent offset");var h=a.h(g,!1);if(f=h["flow-into"])f=f.evaluate(c,"flow-into").toString(),Fl(a,f,h,g,e);e++}if(e>=a.b)break;f=d.firstChild;if(null==f)for(;!(f=
d.nextSibling);)if(d=d.parentNode,d===a.root)return;d=f}}}function Gl(a,b){a.B=b;for(var c=0;c<a.w.length;c++)Hl(a.B,a.w[c],a.l[a.w[c].b])}
function Fl(a,b,c,d,e){var f=0,g=Number.POSITIVE_INFINITY,h=!1,l=!1,k=!1,m=c["flow-options"];if(m){var p;a:{if(h=m.evaluate(a.f,"flow-options")){l=new kg;try{h.U(l);p=l.b;break a}catch(r){v.b(r,"toSet:")}}p={}}h=!!p.exclusive;l=!!p["static"];k=!!p.last}(p=c["flow-linger"])&&(g=mg(p.evaluate(a.f,"flow-linger"),Number.POSITIVE_INFINITY));(c=c["flow-priority"])&&(f=mg(c.evaluate(a.f,"flow-priority"),0));c=a.S[e]||null;p=a.l[b];p||(p=ql(a.g),p=a.l[b]=new ci(p?p.g.b:null));d=new di(b,d,e,f,g,h,l,k,c);
a.w.push(d);a.D==b&&(a.D=null);a.B&&Hl(a.B,d,p);return d}function Il(a,b,c,d){nl[b]&&(d=a.l[d].b,(0===d.length||d[d.length-1]<c)&&d.push(c));a.S[c]=ll(a.S[c],b)}
function El(a,b,c){var d=-1;if(b<=a.b&&(d=fl(a.e,b),d+=c,d<cl(a.e)))return gl(a.e,d);if(null==a.d)return Number.POSITIVE_INFINITY;for(var e=a.f;;){var f=a.d.firstChild;if(null==f)for(;;){if(1==a.d.nodeType){var f=a.O,g=a.d;if(f.gb.pop()!==g)throw Error("Invalid call to popElement");f.yb.pop();f.ka.pop();f.wb.pop();f.xb.pop();f.pop();Ik(f);a.Na=a.ba.pop();g=a.g.pop(a.b);f=null;g.d&&(f=ml(g.d,"before"),Il(a,f,g.d.Ea?sl(a.g,g):g.d.offset,g.b),f=ml(g.d,"after"));f=ll(f,ml(g,"after"));Il(a,f,a.b,g.b)}if(f=
a.d.nextSibling)break;a.d=a.d.parentNode;if(a.d===a.root)return a.d=null,b<a.b&&(0>d&&(d=fl(a.e,b),d+=c),d<=cl(a.e))?gl(a.e,d):Number.POSITIVE_INFINITY}a.d=f;if(1!=a.d.nodeType){a.b+=a.d.textContent.length;var f=a.g,g=a.d,h=ql(f);(f.Ea||f.Ia)&&il(h)&&(h=kl(h,"white-space",Rd).toString(),bi(g,$h(h))||(f.Ea=!1,f.Ia=!1));a.Na?dl(a.e,a.b):el(a.e,a.b)}else{g=a.d;f=ul(a,g);a.ba.push(a.Na);Kk(a.O,g,f);(h=g.getAttribute("id")||g.getAttributeNS("http://www.w3.org/XML/1998/namespace","id"))&&h===a.k&&(a.k=
null);a.u||"body"!=g.localName||g.parentNode!=a.root||(vl(a,f,!0),a.u=!0);if(h=f["flow-into"]){var h=h.evaluate(e,"flow-into").toString(),l=Fl(a,h,f,g,a.b);a.Na=!!a.oa[h];g=a.g.push(f,a.b,g===a.root,l)}else g=a.g.push(f,a.b,g===a.root);h=sl(a.g,g);Il(a,g.e,h,g.b);g.f&&(l=ml(g.f,"after"),Il(a,l,g.f.Ea?h:g.offset,g.b));a.Na&&ol(g)===Qd&&(a.Na=!1);if(wh(a.Z,a.d)!=a.b)throw Error("Inconsistent offset");a.I["e"+a.b]=f;a.b++;a.Na?dl(a.e,a.b):el(a.e,a.b);if(b<a.b&&(0>d&&(d=fl(a.e,b),d+=c),d<=cl(a.e)))return gl(a.e,
d)}}}tl.prototype.h=function(a,b){var c=wh(this.Z,a),d="e"+c;b&&(c=xh(this.Z,a,0,!0));this.b<=c&&El(this,c,0);return this.I[d]};var Jl=1;function Kl(a,b,c,d,e){this.b={};this.children=[];this.e=null;this.h=0;this.d=a;this.name=b;this.sb=c;this.Ba=d;this.parent=e;this.g="p"+Jl++;e&&(this.h=e.children.length,e.children.push(this))}Kl.prototype.f=function(){throw Error("E_UNEXPECTED_CALL");};Kl.prototype.clone=function(){throw Error("E_UNEXPECTED_CALL");};function Ll(a,b){var c=a.b,d=b.b,e;for(e in c)Object.prototype.hasOwnProperty.call(c,e)&&(d[e]=c[e])}
function Ml(a,b){for(var c=0;c<a.children.length;c++)a.children[c].clone({parent:b})}function Nl(a){Kl.call(this,a,null,null,[],null);this.b.width=new V(je,0);this.b.height=new V(ke,0)}u(Nl,Kl);
function Ol(a,b){this.e=b;var c=this;ec.call(this,a,function(a,b){var f=a.match(/^([^.]+)\.([^.]+)$/);if(f){var g=c.e.j[f[1]];if(g&&(g=this.ka[g])){if(b){var f=f[2],h=g.ba[f];if(h)g=h;else{switch(f){case "columns":var h=g.d.d,l=new Vc(h,0),k=Pl(g,"column-count"),m=Pl(g,"column-width"),p=Pl(g,"column-gap"),h=E(h,Xc(h,new Sc(h,"min",[l,k]),D(h,m,p)),p)}h&&(g.ba[f]=h);g=h}}else g=Pl(g,f[2]);return g}}return null})}u(Ol,ec);
function Ql(a,b,c,d,e,f,g){a=a instanceof Ol?a:new Ol(a,this);Kl.call(this,a,b,c,d,e);this.e=this;this.M=f;this.P=g;this.b.width=new V(je,0);this.b.height=new V(ke,0);this.b["wrap-flow"]=new V(td,0);this.b.position=new V(Vd,0);this.b.overflow=new V(ge,0);this.j={}}u(Ql,Kl);Ql.prototype.f=function(a){return new Rl(a,this)};Ql.prototype.clone=function(a){a=new Ql(this.d,this.name,a.sb||this.sb,this.Ba,this.parent,this.M,this.P);Ll(this,a);Ml(this,a);return a};
function Sl(a,b,c,d,e){Kl.call(this,a,b,c,d,e);this.e=e.e;b&&(this.e.j[b]=this.g);this.b["wrap-flow"]=new V(td,0)}u(Sl,Kl);Sl.prototype.f=function(a){return new Tl(a,this)};Sl.prototype.clone=function(a){a=new Sl(a.parent.d,this.name,this.sb,this.Ba,a.parent);Ll(this,a);Ml(this,a);return a};function Ul(a,b,c,d,e){Kl.call(this,a,b,c,d,e);this.e=e.e;b&&(this.e.j[b]=this.g)}u(Ul,Kl);Ul.prototype.f=function(a){return new Vl(a,this)};
Ul.prototype.clone=function(a){a=new Ul(a.parent.d,this.name,this.sb,this.Ba,a.parent);Ll(this,a);Ml(this,a);return a};function X(a,b,c){return b&&b!==td?b.ja(a,c):null}function Wl(a,b,c){return b&&b!==td?b.ja(a,c):a.b}function Xl(a,b,c){return b?b===td?null:b.ja(a,c):a.b}function Yl(a,b,c,d){return b&&c!==Qd?b.ja(a,d):a.b}function Zl(a,b,c){return b?b===he?a.g:b===Cd?a.f:b.ja(a,a.b):c}
function $l(a,b){this.e=a;this.d=b;this.D={};this.style={};this.k=this.l=null;this.children=[];this.H=this.I=this.f=this.g=!1;this.w=this.B=0;this.u=null;this.ka={};this.ba={};this.oa=this.b=!1;a&&a.children.push(this)}function am(a){a.B=0;a.w=0}function bm(a,b,c){b=Pl(a,b);c=Pl(a,c);if(!b||!c)throw Error("E_INTERNAL");return D(a.d.d,b,c)}
function Pl(a,b){var c=a.ka[b];if(c)return c;var d=a.style[b];d&&(c=d.ja(a.d.d,a.d.d.b));switch(b){case "margin-left-edge":c=Pl(a,"left");break;case "margin-top-edge":c=Pl(a,"top");break;case "margin-right-edge":c=bm(a,"border-right-edge","margin-right");break;case "margin-bottom-edge":c=bm(a,"border-bottom-edge","margin-bottom");break;case "border-left-edge":c=bm(a,"margin-left-edge","margin-left");break;case "border-top-edge":c=bm(a,"margin-top-edge","margin-top");break;case "border-right-edge":c=
bm(a,"padding-right-edge","border-right-width");break;case "border-bottom-edge":c=bm(a,"padding-bottom-edge","border-bottom-width");break;case "padding-left-edge":c=bm(a,"border-left-edge","border-left-width");break;case "padding-top-edge":c=bm(a,"border-top-edge","border-top-width");break;case "padding-right-edge":c=bm(a,"right-edge","padding-right");break;case "padding-bottom-edge":c=bm(a,"bottom-edge","padding-bottom");break;case "left-edge":c=bm(a,"padding-left-edge","padding-left");break;case "top-edge":c=
bm(a,"padding-top-edge","padding-top");break;case "right-edge":c=bm(a,"left-edge","width");break;case "bottom-edge":c=bm(a,"top-edge","height")}if(!c){if("extent"==b)d=a.b?"width":"height";else if("measure"==b)d=a.b?"height":"width";else{var e=a.b?gj:hj,d=b,f;for(f in e)d=d.replace(f,e[f])}d!=b&&(c=Pl(a,d))}c&&(a.ka[b]=c);return c}
function cm(a){var b=a.d.d,c=a.style,d=Zl(b,c.enabled,b.g),e=X(b,c.page,b.b);if(e)var f=new Qc(b,"page-number"),d=Wc(b,d,new Ic(b,e,f));(e=X(b,c["min-page-width"],b.b))&&(d=Wc(b,d,new Hc(b,new Qc(b,"page-width"),e)));(e=X(b,c["min-page-height"],b.b))&&(d=Wc(b,d,new Hc(b,new Qc(b,"page-height"),e)));d=a.O(d);c.enabled=new J(d)}$l.prototype.O=function(a){return a};
$l.prototype.Vc=function(){var a=this.d.d,b=this.style,c=this.e?this.e.style.width.ja(a,null):null,d=X(a,b.left,c),e=X(a,b["margin-left"],c),f=Yl(a,b["border-left-width"],b["border-left-style"],c),g=Wl(a,b["padding-left"],c),h=X(a,b.width,c),l=X(a,b["max-width"],c),k=Wl(a,b["padding-right"],c),m=Yl(a,b["border-right-width"],b["border-right-style"],c),p=X(a,b["margin-right"],c),r=X(a,b.right,c),t=D(a,f,g),q=D(a,f,k);d&&r&&h?(t=E(a,c,D(a,h,D(a,D(a,d,t),q))),e?p?r=E(a,t,p):p=E(a,t,D(a,r,e)):(t=E(a,t,
r),p?e=E(a,t,p):p=e=Xc(a,t,new B(a,.5)))):(e||(e=a.b),p||(p=a.b),d||r||h||(d=a.b),d||h?d||r?h||r||(h=this.l,this.g=!0):d=a.b:(h=this.l,this.g=!0),t=E(a,c,D(a,D(a,e,t),D(a,p,q))),this.g&&(l||(l=E(a,t,d?d:r)),this.b||!X(a,b["column-width"],null)&&!X(a,b["column-count"],null)||(h=l,this.g=!1)),d?h?r||(r=E(a,t,D(a,d,h))):h=E(a,t,D(a,d,r)):d=E(a,t,D(a,r,h)));a=Wl(a,b["snap-width"]||(this.e?this.e.style["snap-width"]:null),c);b.left=new J(d);b["margin-left"]=new J(e);b["border-left-width"]=new J(f);b["padding-left"]=
new J(g);b.width=new J(h);b["max-width"]=new J(l?l:h);b["padding-right"]=new J(k);b["border-right-width"]=new J(m);b["margin-right"]=new J(p);b.right=new J(r);b["snap-width"]=new J(a)};
$l.prototype.Wc=function(){var a=this.d.d,b=this.style,c=this.e?this.e.style.width.ja(a,null):null,d=this.e?this.e.style.height.ja(a,null):null,e=X(a,b.top,d),f=X(a,b["margin-top"],c),g=Yl(a,b["border-top-width"],b["border-top-style"],c),h=Wl(a,b["padding-top"],c),l=X(a,b.height,d),k=X(a,b["max-height"],d),m=Wl(a,b["padding-bottom"],c),p=Yl(a,b["border-bottom-width"],b["border-bottom-style"],c),r=X(a,b["margin-bottom"],c),t=X(a,b.bottom,d),q=D(a,g,h),x=D(a,p,m);e&&t&&l?(d=E(a,d,D(a,l,D(a,D(a,e,q),
x))),f?r?t=E(a,d,f):r=E(a,d,D(a,t,f)):(d=E(a,d,t),r?f=E(a,d,r):r=f=Xc(a,d,new B(a,.5)))):(f||(f=a.b),r||(r=a.b),e||t||l||(e=a.b),e||l?e||t?l||t||(l=this.k,this.f=!0):e=a.b:(l=this.k,this.f=!0),d=E(a,d,D(a,D(a,f,q),D(a,r,x))),this.f&&(k||(k=E(a,d,e?e:t)),this.b&&(X(a,b["column-width"],null)||X(a,b["column-count"],null))&&(l=k,this.f=!1)),e?l?t||(t=E(a,d,D(a,e,l))):l=E(a,d,D(a,t,e)):e=E(a,d,D(a,t,l)));a=Wl(a,b["snap-height"]||(this.e?this.e.style["snap-height"]:null),c);b.top=new J(e);b["margin-top"]=
new J(f);b["border-top-width"]=new J(g);b["padding-top"]=new J(h);b.height=new J(l);b["max-height"]=new J(k?k:l);b["padding-bottom"]=new J(m);b["border-bottom-width"]=new J(p);b["margin-bottom"]=new J(r);b.bottom=new J(t);b["snap-height"]=new J(a)};
function dm(a){var b=a.d.d,c=a.style;a=X(b,c[a.b?"height":"width"],null);var d=X(b,c["column-width"],a),e=X(b,c["column-count"],null),f;(f=(f=c["column-gap"])&&f!==Rd?f.ja(b,null):null)||(f=new Pc(b,1,"em"));d&&!e&&(e=new Sc(b,"floor",[Yc(b,D(b,a,f),D(b,d,f))]),e=new Sc(b,"max",[b.d,e]));e||(e=b.d);d=E(b,Yc(b,D(b,a,f),e),f);c["column-width"]=new J(d);c["column-count"]=new J(e);c["column-gap"]=new J(f)}function em(a,b,c,d){a=a.style[b].ja(a.d.d,null);return sc(a,c,d,{})}
function fm(a,b){b.ka[a.d.g]=a;var c=a.d.d,d=a.style,e=a.e?gm(a.e,b):null,e=Zk(a.D,b,e,!1);a.b=Yk(e,b,a.e?a.e.b:!1);$k(e,d,a.b,function(a,b){return b.value});a.l=new gc(c,function(){return a.B},"autoWidth");a.k=new gc(c,function(){return a.w},"autoHeight");a.Vc();a.Wc();dm(a);cm(a)}function hm(a,b,c){(a=a.style[c])&&(a=jg(b,a,c));return a}function Y(a,b,c){(a=a.style[c])&&(a=jg(b,a,c));return pd(a,b)}
function gm(a,b){var c;a:{if(c=a.D["region-id"]){for(var d=[],e=0;e<c.length;e++){var f=c[e].evaluate(b,"");f&&f!==G&&d.push(f)}if(d.length){c=d;break a}}c=null}if(c){d=[];for(e=0;e<c.length;e++)d[e]=c[e].toString();return d}return null}function im(a,b,c,d,e){if(a=hm(a,b,d))a.Xb()&&kc(a.ha)&&(a=new I(pd(a,b),"px")),"font-family"===d&&(a=nh(e,a)),w(c.d,d,a.toString())}
function jm(a,b,c){var d=Y(a,b,"left"),e=Y(a,b,"margin-left"),f=Y(a,b,"padding-left"),g=Y(a,b,"border-left-width");a=Y(a,b,"width");Hi(c,d,a);w(c.d,"margin-left",e+"px");w(c.d,"padding-left",f+"px");w(c.d,"border-left-width",g+"px");c.marginLeft=e;c.S=g;c.j=f}
function km(a,b,c){var d=Y(a,b,"right"),e=Y(a,b,"snap-height"),f=Y(a,b,"margin-right"),g=Y(a,b,"padding-right");b=Y(a,b,"border-right-width");w(c.d,"margin-right",f+"px");w(c.d,"padding-right",g+"px");w(c.d,"border-right-width",b+"px");c.marginRight=f;c.Ya=b;a.b&&0<e&&(a=d+Ei(c),a=a-Math.floor(a/e)*e,0<a&&(c.Eb=e-a,g+=c.Eb));c.w=g;c.kc=e}
function lm(a,b,c){var d=Y(a,b,"snap-height"),e=Y(a,b,"top"),f=Y(a,b,"margin-top"),g=Y(a,b,"padding-top");b=Y(a,b,"border-top-width");c.top=e;c.marginTop=f;c.ba=b;c.$a=d;!a.b&&0<d&&(a=e+Bi(c),a=a-Math.floor(a/d)*d,0<a&&(c.oa=d-a,g+=c.oa));c.k=g;w(c.d,"top",e+"px");w(c.d,"margin-top",f+"px");w(c.d,"padding-top",g+"px");w(c.d,"border-top-width",b+"px")}
function mm(a,b,c){var d=Y(a,b,"margin-bottom"),e=Y(a,b,"padding-bottom"),f=Y(a,b,"border-bottom-width");a=Y(a,b,"height")-c.oa;w(c.d,"height",a+"px");w(c.d,"margin-bottom",d+"px");w(c.d,"padding-bottom",e+"px");w(c.d,"border-bottom-width",f+"px");c.height=a-c.oa;c.marginBottom=d;c.Sa=f;c.u=e}function nm(a,b,c){a.b?(lm(a,b,c),mm(a,b,c)):(km(a,b,c),jm(a,b,c))}
function om(a,b,c){w(c.d,"border-top-width","0px");var d=Y(a,b,"max-height");a.I?Gi(c,0,d):(lm(a,b,c),d-=c.oa,c.height=d,w(c.d,"height",d+"px"))}function pm(a,b,c){w(c.d,"border-left-width","0px");var d=Y(a,b,"max-width");a.H?Hi(c,0,d):(km(a,b,c),d-=c.Eb,c.width=d,a=Y(a,b,"right"),w(c.d,"right",a+"px"),w(c.d,"width",d+"px"))}
var qm="border-left-style border-right-style border-top-style border-bottom-style border-left-color border-right-color border-top-color border-bottom-color outline-style outline-color outline-width overflow visibility".split(" "),rm="border-top-left-radius border-top-right-radius border-bottom-right-radius border-bottom-left-radius border-image-source border-image-slice border-image-width border-image-outset border-image-repeat background-attachment background-color background-image background-repeat background-position background-clip background-origin background-size opacity z-index".split(" "),
sm="color font-family font-size font-style font-weight font-variant line-height letter-spacing text-align text-decoration text-indent text-transform white-space word-spacing".split(" "),tm=["transform","transform-origin"];
$l.prototype.rb=function(a,b,c,d){this.e&&this.b==this.e.b||w(b.d,"writing-mode",this.b?"vertical-rl":"horizontal-tb");(this.b?this.g:this.f)?this.b?pm(this,a,b):om(this,a,b):(this.b?km(this,a,b):lm(this,a,b),this.b?jm(this,a,b):mm(this,a,b));(this.b?this.f:this.g)?this.b?om(this,a,b):pm(this,a,b):nm(this,a,b);for(c=0;c<qm.length;c++)im(this,a,b,qm[c],d)};function um(a,b,c,d){for(var e=0;e<sm.length;e++)im(a,b,c,sm[e],d)}
$l.prototype.sc=function(a,b,c,d,e,f,g){this.b?this.B=b.e+b.Eb:this.w=b.e+b.oa;f=(this.b||!d)&&this.f;var h=(!this.b||!d)&&this.g,l=null;if(h||f)h&&w(b.d,"width","auto"),f&&w(b.d,"height","auto"),l=(d?d.d:b.d).getBoundingClientRect(),h&&(this.B=Math.ceil(l.right-l.left-b.j-b.S-b.w-b.Ya),this.b&&(this.B+=b.Eb)),f&&(this.w=l.bottom-l.top-b.k-b.ba-b.u-b.Sa,this.b||(this.w+=b.oa));(this.b?this.f:this.g)&&nm(this,a,b);if(this.b?this.g:this.f){if(this.b?this.H:this.I)this.b?km(this,a,b):lm(this,a,b);this.b?
jm(this,a,b):mm(this,a,b)}if(1<e&&(f=Y(this,a,"column-rule-width"),h=hm(this,a,"column-rule-style"),l=hm(this,a,"column-rule-color"),0<f&&h&&h!=Qd&&l!=de)){var k=Y(this,a,"column-gap"),m=this.b?b.height:b.width,p=this.b?"border-top":"border-left";for(d=1;d<e;d++){var r=(m+k)*d/e-k/2+b.j-f/2,t=b.height+b.k+b.u,q=b.d.ownerDocument.createElement("div");w(q,"position","absolute");w(q,this.b?"left":"top","0px");w(q,this.b?"top":"left",r+"px");w(q,this.b?"height":"width","0px");w(q,this.b?"width":"height",
t+"px");w(q,p,f+"px "+h.toString()+(l?" "+l.toString():""));b.d.insertBefore(q,b.d.firstChild)}}for(d=0;d<rm.length;d++)im(this,a,b,rm[d],g);for(d=0;d<tm.length;d++)e=b,g=tm[d],f=c.h,(h=hm(this,a,g))&&f.push(new Sh(e.d,g,h))};
$l.prototype.h=function(a,b){var c=this.D,d=this.d.b,e;for(e in d)lj(e)&&mj(c,e,d[e]);if("background-host"==this.d.sb)for(e in b)if(e.match(/^background-/)||"writing-mode"==e)c[e]=b[e];if("layout-host"==this.d.sb)for(e in b)e.match(/^background-/)||"writing-mode"==e||(c[e]=b[e]);Ek(a,this.d.Ba,null,c);c.content&&(c.content=c.content.rc(new jk(a,0,a.Ya)));fm(this,a.h);for(c=0;c<this.d.children.length;c++)this.d.children[c].f(this).h(a,b);a.pop()};
function vm(a,b){a.g&&(a.H=em(a,"right",a.l,b)||em(a,"margin-right",a.l,b)||em(a,"border-right-width",a.l,b)||em(a,"padding-right",a.l,b));a.f&&(a.I=em(a,"top",a.k,b)||em(a,"margin-top",a.k,b)||em(a,"border-top-width",a.k,b)||em(a,"padding-top",a.k,b));for(var c=0;c<a.children.length;c++)vm(a.children[c],b)}function wm(a){$l.call(this,null,a)}u(wm,$l);wm.prototype.h=function(a,b){$l.prototype.h.call(this,a,b);this.children.sort(function(a,b){return b.d.P-a.d.P||a.d.h-b.d.h})};
function Rl(a,b){$l.call(this,a,b);this.u=this}u(Rl,$l);Rl.prototype.O=function(a){var b=this.d.e;b.M&&(a=Wc(b.d,a,b.M));return a};Rl.prototype.S=function(){};function Tl(a,b){$l.call(this,a,b);this.u=a.u}u(Tl,$l);function Vl(a,b){$l.call(this,a,b);this.u=a.u}u(Vl,$l);function xm(a,b,c,d){var e=null;c instanceof jd&&(e=[c]);c instanceof cd&&(e=c.values);if(e)for(a=a.d.d,c=0;c<e.length;c++)if(e[c]instanceof jd){var f=cc(e[c].name,"enabled"),f=new Qc(a,f);d&&(f=new yc(a,f));b=Wc(a,b,f)}return b}
Vl.prototype.O=function(a){var b=this.d.d,c=this.style,d=Zl(b,c.required,b.f)!==b.f;if(d||this.f){var e;e=(e=c["flow-from"])?e.ja(b,b.b):new B(b,"body");e=new Sc(b,"has-content",[e]);a=Wc(b,a,e)}a=xm(this,a,c["required-partitions"],!1);a=xm(this,a,c["conflicting-partitions"],!0);d&&(c=(c=this.u.style.enabled)?c.ja(b,null):b.g,c=Wc(b,c,a),this.u.style.enabled=new J(c));return a};Vl.prototype.rb=function(a,b,c,d,e){w(b.d,"overflow","hidden");$l.prototype.rb.call(this,a,b,c,d,e)};
function ym(a,b,c,d){Ef.call(this,a,b,!1);this.target=c;this.b=d}u(ym,Ff);ym.prototype.bb=function(a,b,c){eh(this.b,a,b,c,this)};ym.prototype.Gc=function(a,b){Gf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};ym.prototype.Wb=function(a,b){Gf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};ym.prototype.cb=function(a,b,c){this.target.b[a]=new V(b,c?50331648:67108864)};function zm(a,b,c,d){ym.call(this,a,b,c,d)}u(zm,ym);
function Am(a,b,c,d){ym.call(this,a,b,c,d);c.b.width=new V(ie,0);c.b.height=new V(ie,0)}u(Am,ym);Am.prototype.fc=function(a,b,c){a=new Ul(this.d,a,b,c,this.target);Df(this.$,new zm(this.d,this.$,a,this.b))};Am.prototype.ec=function(a,b,c){a=new Sl(this.d,a,b,c,this.target);a=new Am(this.d,this.$,a,this.b);Df(this.$,a)};function Bm(a,b,c,d){ym.call(this,a,b,c,d)}u(Bm,ym);Bm.prototype.fc=function(a,b,c){a=new Ul(this.d,a,b,c,this.target);Df(this.$,new zm(this.d,this.$,a,this.b))};
Bm.prototype.ec=function(a,b,c){a=new Sl(this.d,a,b,c,this.target);a=new Am(this.d,this.$,a,this.b);Df(this.$,a)};var Cm={"text-indent":"0px","margin-top":"0px","padding-top":"0px","border-top-width":"0px","border-top-style":"none","border-top-color":"transparent","border-top-left-radius":"0px","border-top-right-radius":"0px"},Dm={"text-indent":"0px","margin-right":"0px","padding-right":"0px","border-right-width":"0px","border-right-style":"none","border-right-color":"transparent","border-top-right-radius":"0px","border-bottom-right-radius":"0px"},Em={"margin-top":"0px"},Fm={"margin-right":"0px"},Gm={};
function Hm(a){a.addEventListener("load",function(){a.contentWindow.navigator.epubReadingSystem={name:"adapt",version:"0.1",layoutStyle:"paginated",hasFeature:function(a){switch(a){case "mouse-events":return!0}return!1}}},!1)}var Im=(new DOMParser).parseFromString('<root xmlns="http://www.pyroxy.com/ns/shadow"/>',"text/xml"),Jm="footnote-marker first-5-lines first-4-lines first-3-lines first-2-lines first-line first-letter before  after".split(" ");
function Km(a){return a.getAttribute("data-adapt-pseudo")||""}function Lm(a,b,c,d){this.style=b;this.f=a;this.b=c;this.d=d;this.e={}}
Lm.prototype.h=function(a){var b=Km(a);this.b&&b&&b.match(/after$/)&&(this.style=this.b.h(this.f,!0),this.b=null);var c=this.style._pseudos[b]||{};if(!this.e[b]){this.e[b]=!0;var d=c.content;d&&(d=d.evaluate(this.d),Ji(d)&&d.U(new Ii(a,this.d)))}if(b.match(/^first-/)&&!c["x-first-pseudo"]){a=1;var e;"first-letter"==b?a=0:null!=(e=b.match(/^first-([0-9]+)-lines$/))&&(a=e[1]-0);c["x-first-pseudo"]=new V(new ld(a),0)}return c};
function Mm(a,b,c,d,e,f,g,h,l,k,m,p,r,t){this.w=a;this.d=b;this.viewport=c;this.l=c.b;this.h=d;this.D=e;this.Z=f;this.B=g;this.k=h;this.H=l;this.page=k;this.f=m;this.u=p;this.e=r;this.j=t;this.I=this.b=null;this.g=!1;this.Y=null;this.da=0;this.A=null}Mm.prototype.clone=function(){return new Mm(this.w,this.d,this.viewport,this.h,this.D,this.Z,this.B,this.k,this.H,this.page,this.f,this.u,this.e,this.j)};
function Nm(a,b,c,d,e,f){var g=K("createRefShadow");a.Z.j.load(b).then(function(h){if(h){var l=Bh(h,b);if(l){var k=a.H,m=k.B[h.url];if(!m){var m=k.style.h.b[h.url],p=new lc(0,k.pb(),k.ob(),k.j),m=new tl(h,m.e,m.d,p,k.g,m.j,new Om(k.f,h.url),new Pm(k.f,h.url,m.d,m.b));k.B[h.url]=m}f=new ii(d,l,h,e,f,c,m)}}N(g,f)});return M(g)}
function Qm(a,b,c,d,e,f,g,h){var l=K("createShadows"),k=e.template,m;k instanceof nd?m=Nm(a,k.url,2,b,h,null):m=L(null);m.then(function(k){var m=null;if("http://www.pyroxy.com/ns/shadow"==b.namespaceURI&&"include"==b.localName){var t=b.getAttribute("href"),q=null;t?q=h?h.Z:a.Z:h&&(t="http://www.w3.org/1999/xhtml"==h.$.namespaceURI?h.$.getAttribute("href"):h.$.getAttributeNS("http://www.w3.org/1999/xlink","href"),q=h.dd?h.dd.Z:a.Z);t&&(t=va(t,q.url),m=Nm(a,t,3,b,h,k))}null==m&&(m=L(k));m.then(function(k){var m;
if(m=d._pseudos){for(var p=[],r=Im.createElementNS("http://www.pyroxy.com/ns/shadow","root"),q=r,t=0;t<Jm.length;t++){var F=Jm[t],T;if(F){if(!m[F])continue;if(!("footnote-marker"!=F||c&&a.g))continue;if(F.match(/^first-/)&&(T=e.display,!T||T===Id))continue;if("before"===F||"after"===F)if(T=m[F].content,!T||T===Rd||T===Qd)continue;p.push(F);T=Im.createElementNS("http://www.w3.org/1999/xhtml","span");T.setAttribute("data-adapt-pseudo",F)}else T=Im.createElementNS("http://www.pyroxy.com/ns/shadow","content");
q.appendChild(T);F.match(/^first-/)&&(q=T)}k=p.length?new ii(b,r,null,h,k,2,new Lm(b,d,f,g)):k}N(l,k)})});return M(l)}function Rm(a,b,c){a.I=b;a.g=c}function Sm(a,b,c,d){var e=a.d;c=Zk(c,e,a.D,a.g);b=Yk(c,e,b);$k(c,d,b,function(b,c){var d=c.evaluate(e,b);"font-family"==b&&(d=nh(a.B,d));return d});var f=Li(d.display||Id,d.position,d["float"],a.Y===a.Z.root);["display","position","float"].forEach(function(a){f[a]&&(d[a]=f[a])});return b}
function Tm(a,b){for(var c=a.b.Y,d=[],e=a.b.ea,f=-1;c&&1==c.nodeType;){var g=e&&e.root==c;if(!g||2==e.type){var h=(e?e.b:a.h).h(c,!1);d.push(h)}g?(c=e.$,e=e.dd):(c=c.parentNode,f++)}c=nc(a.d,"em",0===f);c={"font-size":new V(new I(c,"px"),0)};e=new rj(c,a.d);for(f=d.length-1;0<=f;--f){var g=d[f],h=[],l;for(l in g)Yi[l]&&h.push(l);h.sort(ne);for(var k=0;k<h.length;k++){var m=h[k];e.b=m;c[m]=g[m].rc(e)}}for(var p in b)Yi[p]||(c[p]=b[p]);return c}
var Um={a:"a",sub:"sub",sup:"sup",table:"table",tr:"tr",td:"td",th:"th",code:"code",body:"div",p:"p",v:"p",date:"p",emphasis:"em",strong:"strong",style:"span",strikethrough:"del"};function Vm(a,b){b=va(b,a.Z.url);return a.u[b]||b}
function Wm(a,b,c){var d=!0,e=K("createElementView"),f=a.Y,g=a.b.ea?a.b.ea.b:a.h,h=g.h(f,!1),l={};a.b.parent||(h=Tm(a,h));a.b.b=Sm(a,a.b.b,h,l);l.direction&&(a.b.O=l.direction.toString());var k=l["flow-into"];if(k&&k.toString()!=a.w)return N(e,!1),M(e);var m=l.display;if(m===Qd)return N(e,!1),M(e);k=null==a.b.parent;a.b.B=m===Ed;Qm(a,f,k,h,l,g,a.d,a.b.ea).then(function(g){a.b.sa=g;var h=l.position;g=l["float-reference"];var k=l["float"],q=l.clear,x=a.b.b?fe:Gd;a.b.I=Mi(m,h,k,l.overflow,x,a.b.parent?
a.b.parent.b?fe:Gd:x);a.b.H=h===Vd||h===qd||h===Dd;qi(a.b)&&(q=null,k!==Fd&&(k=null));h=k===Nd||k===Wd||k===ce||k===yd||k===Ld||k===Kd||k===wd||k===vd||k===Fd;k&&(delete l["float"],k===Fd&&(a.g?(h=!1,l.display=ud):l.display=Id));q&&(q===Hd&&a.b.parent&&a.b.parent.l&&(q=H(a.b.parent.l)),q===Nd||q===Wd||q===xd)&&(delete l.clear,l.display&&l.display!=Id&&(a.b.l=q.toString()));var R=m===Od&&l["ua-list-item-count"];h||l["break-inside"]&&l["break-inside"]!==td?a.b.j++:m===be&&(a.b.j+=10);a.b.e=!h&&!m||
m===Id;a.b.display=m?m.toString():"inline";a.b.k=h?k.toString():null;a.b.ba=g?g.toString():null;if(!a.b.e){if(g=l["break-after"])a.b.D=g.toString();if(g=l["break-before"])a.b.h=g.toString()}if(g=l["x-first-pseudo"])a.b.f=new ji(a.b.parent?a.b.parent.f:null,g.C);if(g=l["white-space"])g=$h(g.toString()),null!==g&&(a.b.w=g);var Q=!1,sa=null,Fa=[],ia=f.namespaceURI,F=f.localName;if("http://www.w3.org/1999/xhtml"==ia)"html"==F||"body"==F||"script"==F||"link"==F||"meta"==F?F="div":"vide_"==F?F="video":
"audi_"==F?F="audio":"object"==F&&(Q=!!a.f);else if("http://www.idpf.org/2007/ops"==ia)F="span",ia="http://www.w3.org/1999/xhtml";else if("http://www.gribuser.ru/xml/fictionbook/2.0"==ia){ia="http://www.w3.org/1999/xhtml";if("image"==F){if(F="div",(g=f.getAttributeNS("http://www.w3.org/1999/xlink","href"))&&"#"==g.charAt(0)&&(g=Bh(a.Z,g)))sa=a.createElement(ia,"img"),g="data:"+(g.getAttribute("content-type")||"image/jpeg")+";base64,"+g.textContent.replace(/[ \t\n\t]/g,""),Fa.push(tg(sa,g))}else F=
Um[F];F||(F=a.b.e?"span":"div")}else if("http://www.daisy.org/z3986/2005/ncx/"==ia)if(ia="http://www.w3.org/1999/xhtml","ncx"==F||"navPoint"==F)F="div";else if("navLabel"==F){if(F="span",k=f.parentNode){g=null;for(k=k.firstChild;k;k=k.nextSibling)if(1==k.nodeType&&(q=k,"http://www.daisy.org/z3986/2005/ncx/"==q.namespaceURI&&"content"==q.localName)){g=q.getAttribute("src");break}g&&(F="a",f=f.ownerDocument.createElementNS(ia,"a"),f.setAttribute("href",g))}}else F="span";else"http://www.pyroxy.com/ns/shadow"==
ia?(ia="http://www.w3.org/1999/xhtml",F=a.b.e?"span":"div"):Q=!!a.f;R?b?F="li":(F="div",m=ud,l.display=m):"body"==F||"li"==F?F="div":"q"==F?F="span":"a"==F&&(g=l["hyperlink-processing"])&&"normal"!=g.toString()&&(F="span");l.behavior&&"none"!=l.behavior.toString()&&a.f&&(Q=!0);f.dataset&&"true"==f.dataset.mathTypeset&&(Q=!0);var T;Q?T=a.f(f,a.b.parent?a.b.parent.A:null,l):T=L(null);T.then(function(g){g?Q&&(d="true"==g.getAttribute("data-adapt-process-children")):g=a.createElement(ia,F);"a"==F&&g.addEventListener("click",
a.page.D,!1);sa&&(Xm(a,a.b,"inner",sa),g.appendChild(sa));"iframe"==g.localName&&"http://www.w3.org/1999/xhtml"==g.namespaceURI&&Hm(g);if("http://www.gribuser.ru/xml/fictionbook/2.0"!=f.namespaceURI||"td"==F){for(var h=f.attributes,k=h.length,m=null,p=0;p<k;p++){var r=h[p],q=r.namespaceURI,t=r.localName,r=r.nodeValue;if(q)if("http://www.w3.org/2000/xmlns/"==q)continue;else"http://www.w3.org/1999/xlink"==q&&"href"==t&&(r=Vm(a,r));else{if(t.match(/^on/))continue;if("style"==t)continue;if(("id"==t||
"name"==t)&&b){r=a.j.kd(r,a.Z.url);g.setAttribute(t,r);Yh(a.page,g,r);continue}"src"==t||"href"==t||"poster"==t?r=a.j.b(Vm(a,r),a.Z.url):"srcset"==t&&(r=r.split(",").map(function(b){return Vm(a,b.trim())}).join(","))}if(q){var x=Gm[q];x&&(t=x+":"+t)}"src"!=t||q||"img"!=F||"http://www.w3.org/1999/xhtml"!=ia?"href"==t&&"image"==F&&"http://www.w3.org/2000/svg"==ia&&"http://www.w3.org/1999/xlink"==q?a.page.g.push(tg(g,r)):q?g.setAttributeNS(q,t,r):g.setAttribute(t,r):m=r}m&&(h=tg(g,m),k=l.width,m=l.height,
k&&k!==td&&m&&m!==td?a.page.g.push(h):Fa.push(h))}delete l.content;(h=l["list-style-image"])&&h instanceof nd&&(h=h.url,Fa.push(tg(new Image,h)));Ym(a,g,l);k=l.widows;m=l.orphans;h=l["box-decoration-break"];if(k||m||h){if(a.b.parent){a.b.g={};for(var T in a.b.parent.g)a.b.g[T]=a.b.parent.g[T]}k instanceof ld&&(a.b.g.widows=k.C);m instanceof ld&&(a.b.g.orphans=m.C);h instanceof jd&&(a.b.g["box-decoration-break"]=h.name)}if(!a.b.e&&(T=null,b?c&&(T=a.b.b?Fm:Em):T=h!==H("clone")?a.b.b?Dm:Cm:a.b.b?Fm:
Em,T))for(var Cl in T)w(g,Cl,T[Cl]);R&&g.setAttribute("value",l["ua-list-item-count"].stringValue());a.A=g;Fa.length?sg(Fa).then(function(){N(e,d)}):lf().then(function(){N(e,d)})})});return M(e)}function Zm(a,b,c){var d=K("createNodeView"),e=!0;1==a.Y.nodeType?b=Wm(a,b,c):(8==a.Y.nodeType?a.A=null:a.A=document.createTextNode(a.Y.textContent.substr(a.da||0)),b=L(!0));b.then(function(b){e=b;(a.b.A=a.A)&&(b=a.b.parent?a.b.parent.A:a.I)&&b.appendChild(a.A);N(d,e)});return M(d)}
function $m(a,b,c,d){(a.b=b)?(a.Y=b.Y,a.da=b.da):(a.Y=null,a.da=-1);a.A=null;return a.b?Zm(a,c,!!d):L(!0)}function an(a){if(null==a.ea||"content"!=a.Y.localName||"http://www.pyroxy.com/ns/shadow"!=a.Y.namespaceURI)return a;var b=a.ia,c=a.ea,d=a.parent,e,f;c.Cd?(f=c.Cd,e=c.root,c=c.type,2==c&&(e=e.firstChild)):(f=c.dd,e=c.$.firstChild,c=2);var g=a.Y.nextSibling;g?(a.Y=g,li(a)):a.qa?a=a.qa:e?a=null:(a=a.parent.modify(),a.J=!0);if(e)return b=new ki(e,d,b),b.ea=f,b.Ha=c,b.qa=a,b;a.ia=b;return a}
function bn(a){var b=a.ia+1;if(a.J){if(!a.parent)return null;if(3!=a.Ha){var c=a.Y.nextSibling;if(c)return a=a.modify(),a.ia=b,a.Y=c,li(a),an(a)}if(a.qa)return a=a.qa.modify(),a.ia=b,a;a=a.parent.modify()}else{if(a.sa&&(c=a.sa.root,2==a.sa.type&&(c=c.firstChild),c))return b=new ki(c,a,b),b.ea=a.sa,b.Ha=a.sa.type,an(b);if(c=a.Y.firstChild)return an(new ki(c,a,b));1!=a.Y.nodeType&&(b+=a.Y.textContent.length-1-a.da);a=a.modify()}a.ia=b;a.J=!0;return a}
function cn(a,b,c){b=bn(b);if(!b||b.J)return L(b);var d=K("nextInTree");$m(a,b,!0,c).then(function(a){b.A&&a||(b=b.modify(),b.J=!0,b.A||(b.e=!0));N(d,b)});return M(d)}function dn(a,b){if(b instanceof cd)for(var c=b.values,d=0;d<c.length;d++)dn(a,c[d]);else b instanceof nd&&(c=b.url,a.page.g.push(tg(new Image,c)))}var en={"box-decoration-break":!0,"flow-into":!0,"flow-linger":!0,"flow-priority":!0,"flow-options":!0,page:!0,"float-reference":!0};
function Ym(a,b,c){var d=c["background-image"];d&&dn(a,d);var d=c.position===Vd,e;for(e in c)if(!en[e]){var f=c[e];Qh[e]||d&&Rh[e]?a.page.h.push(new Sh(b,e,f)):(f.Xb()&&kc(f.ha)&&(f=new I(pd(f,a.d),"px")),w(b,e,f.toString()))}}function Xm(a,b,c,d){if(!b.J){var e=(b.ea?b.ea.b:a.h).h(a.Y,!1);if(e=e._pseudos)if(e=e[c])c={},b.b=Sm(a,b.b,e,c),b=c.content,Ji(b)&&(b.U(new Ii(d,a.d)),delete c.content),Ym(a,d,c)}}
function fn(a,b,c){var d=K("peelOff"),e=b.f,f=b.da,g=b.J;if(0<c)b.A.textContent=b.A.textContent.substr(0,c),f+=c;else if(!g&&b.A&&0==f){var h=b.A.parentNode;h&&h.removeChild(b.A)}for(var l=b.ia+c,k=[];b.f===e;)k.push(b),b=b.parent;var m=k.pop(),p=m.qa;mf(function(){for(;0<k.length;){m=k.pop();b=new ki(m.Y,b,l);0==k.length&&(b.da=f,b.J=g);b.Ha=m.Ha;b.ea=m.ea;b.sa=m.sa;b.qa=m.qa?m.qa:p;p=null;var c=$m(a,b,!1);if(c.Ca())return c}return L(!1)}).then(function(){N(d,b)});return M(d)}
Mm.prototype.createElement=function(a,b){return"http://www.w3.org/1999/xhtml"==a?this.l.createElement(b):this.l.createElementNS(a,b)};function gn(a,b,c){var d={},e=a.k._pseudos;b=Sm(a,b,a.k,d);if(e&&e.before){var f={},g=a.createElement("http://www.w3.org/1999/xhtml","span");g.setAttribute("data-adapt-pseudo","before");c.appendChild(g);Sm(a,b,e.before,f);delete f.content;Ym(a,g,f)}delete d.content;Ym(a,c,d);return b}
function hn(a){si(a,function(a){var c=a.g["box-decoration-break"];c&&"slice"!==c||(c=a.A,a.b?(w(c,"padding-left","0"),w(c,"border-left","none"),w(c,"border-top-left-radius","0"),w(c,"border-bottom-left-radius","0")):(w(c,"padding-bottom","0"),w(c,"border-bottom","none"),w(c,"border-bottom-left-radius","0"),w(c,"border-bottom-right-radius","0")))})}
function Si(a,b,c){return b.da===c.da&&b.J==c.J&&b.ga.length===c.ga.length&&b.ga.every(function(a,b){var f;f=c.ga[b];if(a.ea)if(f.ea){var g=1===a.fa.nodeType?a.fa:a.fa.parentElement,h=1===f.fa.nodeType?f.fa:f.fa.parentElement;f=a.ea.$===f.ea.$&&Km(g)===Km(h)}else f=!1;else f=a.fa===f.fa;return f}.bind(a))}function jn(a){this.b=a}function kn(a){return a.getClientRects()}function ln(a,b){return a.b.getComputedStyle(b,null)}
function mn(a,b,c,d,e){this.f=a;this.fontSize=b;this.b=a.document;this.root=c||this.b.body;b=this.root.firstElementChild;b||(b=this.b.createElement("div"),b.setAttribute("data-vivliostyle-outer-zoom-box",!0),this.root.appendChild(b));c=b.firstElementChild;c||(c=this.b.createElement("div"),c.setAttribute("data-vivliostyle-spread-container",!0),b.appendChild(c));this.e=b;this.d=c;b=ln(new jn(a),this.root);this.width=d||parseFloat(b.width)||a.innerWidth;this.height=e||parseFloat(b.height)||a.innerHeight}
mn.prototype.zoom=function(a,b,c){w(this.e,"width",a*c+"px");w(this.e,"height",b*c+"px");w(this.d,"width",a+"px");w(this.d,"height",b+"px");w(this.d,"transform","scale("+c+")")};Xi("SIMPLE_PROPERTY",function(a){var b=a.name,c=a.value;switch(b){case "page-break-before":case "page-break-after":case "page-break-inside":return{name:b.replace(/^page-/,""),value:c===sd?Ud:c,important:a.important};default:return a}});var nl={page:!0,left:!0,right:!0,recto:!0,verso:!0,column:!0,region:!0},nn={avoid:!0,"avoid-page":!0,"avoid-column":!0,"avoid-region":!0};
function ll(a,b){if(a)if(b){var c=!!nl[a],d=!!nl[b];if(c&&d)switch(b){case "column":return a;case "region":return"column"===a?b:a;default:return b}else return d?b:c?a:nn[b]?b:nn[a]?a:b}else return a;else return b}function on(a){switch(a){case "left":case "right":case "recto":case "verso":return a;default:return"any"}};var pn={img:!0,svg:!0,audio:!0,video:!0};
function qn(a,b,c){var d=a.A;if(!d)return NaN;if(1==d.nodeType){if(a.J){var e=d.getBoundingClientRect();if(e.right>=e.left&&e.bottom>=e.top)return c?e.left:e.bottom}return NaN}var e=NaN,f=d.ownerDocument.createRange(),g=d.textContent.length;if(!g)return NaN;a.J&&(b+=g);b>=g&&(b=g-1);f.setStart(d,b);f.setEnd(d,b+1);a=kn(f);if(b=c){b=document.body;if(null==ab){var h=b.ownerDocument,f=h.createElement("div");f.style.position="absolute";f.style.top="0px";f.style.left="0px";f.style.width="100px";f.style.height=
"100px";f.style.overflow="hidden";f.style.lineHeight="16px";f.style.fontSize="16px";w(f,"writing-mode","vertical-rl");b.appendChild(f);g=h.createTextNode("a a a a a a a a a a a a a a a a");f.appendChild(g);h=h.createRange();h.setStart(g,0);h.setEnd(g,1);ab=50>h.getBoundingClientRect().left;b.removeChild(f)}b=ab}if(b){b=d.ownerDocument.createRange();b.setStart(d,0);b.setEnd(d,d.textContent.length);d=kn(b);b=[];for(f=0;f<a.length;f++){g=a[f];for(h=0;h<d.length;h++){var l=d[h];if(g.top>=l.top&&g.bottom<=
l.bottom&&1>Math.abs(g.right-l.right)){b.push({top:g.top,left:l.left,bottom:l.bottom,right:l.right});break}}h==d.length&&(v.b("Could not fix character box"),b.push(g))}a=b}for(b=d=0;b<a.length;b++)f=a[b],g=c?f.bottom-f.top:f.right-f.left,f.right>f.left&&f.bottom>f.top&&(isNaN(e)||g>d)&&(e=c?f.left:f.bottom,d=g);return e}function rn(a,b){this.e=a;this.f=b}rn.prototype.d=function(a,b){return b<this.f?null:sn(a,this,0<b)};rn.prototype.b=function(){return this.f};
function tn(a,b,c,d){this.position=a;this.f=b;this.g=c;this.e=d}tn.prototype.d=function(a,b){var c;b<this.b()?c=null:(a.e=this.e,c=this.position);return c};tn.prototype.b=function(){return(nn[this.f]?1:0)+(this.g?3:0)+(this.position.parent?this.position.parent.j:0)};function un(a,b,c){this.ia=a;this.d=b;this.b=c}
function vn(a){for(var b=1;b<a.length;b++){var c=a[b-1],d=a[b];c===d?v.b("validateCheckPoints: duplicate entry"):c.ia>=d.ia?v.b("validateCheckPoints: incorrect boxOffset"):c.Y==d.Y&&(d.J?c.J&&v.b("validateCheckPoints: duplicate after points"):c.J?v.b("validateCheckPoints: inconsistent after point"):d.ia-c.ia!=d.da-c.da&&v.b("validateCheckPoints: boxOffset inconsistent with offsetInNode"))}}
function wn(a,b,c,d){Ai.call(this,a);this.nd=a.lastChild;this.g=b;this.za=c;this.yb=d;this.Ud=a.ownerDocument;this.Jc=!1;this.ma=this.Oa=this.ta=this.ka=this.O=0;this.gb=this.wb=this.l=this.Za=null;this.qd=!1;this.h=this.f=this.B=null;this.Gd=!0;this.Kc=this.Ic=this.Lc=0}u(wn,Ai);wn.prototype.clone=function(){var a=new wn(this.d,this.g,this.za,this.yb);Fi(a,this);a.nd=this.nd;a.Jc=this.Jc;a.l=this.l?this.l.clone():null;a.wb=this.wb.concat();return a};function xn(a,b){return a.b?b<a.ma:b>a.ma}
function yn(a,b,c){var d=new ki(b.fa,c,0);d.Ha=b.Ha;d.ea=b.ea;d.sa=b.sa;d.qa=b.qa?yn(a,b.qa,ni(c)):null;return d}function zn(a,b){var c=K("openAllViews"),d=b.ga;Rm(a.g,a.d,a.Jc);var e=d.length-1,f=null;mf(function(){for(;0<=e;){f=yn(a,d[e],f);if(0==e&&(f.da=b.da,f.J=b.J,f.J))break;var c=$m(a.g,f,0==e&&0==f.da);e--;if(c.Ca())return c}return L(!1)}).then(function(){N(c,f)});return M(c)}var An=/^[^A-Za-z0-9_\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]*([A-Za-z0-9_\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527][^A-Za-z0-9_\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]*)?/;
function Bn(a,b){if(b.f&&b.e&&!b.J&&0==b.f.count&&1!=b.A.nodeType){var c=b.A.textContent.match(An);return fn(a.g,b,c[0].length)}return L(b)}function Cn(a,b,c){var d=K("buildViewToNextBlockEdge");nf(function(d){b.A&&c.push(ni(b));Bn(a,b).then(function(f){f!==b&&(b=f,c.push(ni(b)));cn(a.g,b).then(function(c){(b=c)?Dn(a.yb,b)?b.k&&!a.b?En(a,b).then(function(c){b=c;!b||b.d||0<a.g.e.b.length?O(d):pf(d)}):b.e?pf(d):O(d):(b=b.modify(),b.d=!0,O(d)):O(d)})})}).then(function(){N(d,b)});return M(d)}
function Fn(a,b){if(!b.A)return L(b);var c=b.Y,d=K("buildDeepElementView");nf(function(d){Bn(a,b).then(function(f){if(f!==b){for(var g=f;g&&g.Y!=c;)g=g.parent;if(null==g){b=f;O(d);return}}cn(a.g,f).then(function(f){(b=f)&&b.Y!=c?Dn(a.yb,b)?pf(d):(b=b.modify(),b.d=!0,O(d)):O(d)})})}).then(function(){N(d,b)});return M(d)}
function Gn(a,b,c,d,e){var f=a.Ud.createElement("div");a.b?(w(f,"height",d+"px"),w(f,"width",e+"px")):(w(f,"width",d+"px"),w(f,"height",e+"px"));w(f,"float",c);w(f,"clear",c);a.d.insertBefore(f,b);return f}function Hn(a){for(var b=a.d.firstChild;b;){var c=b.nextSibling;if(1==b.nodeType){var d=b.style.cssFloat;if("left"==d||"right"==d)a.d.removeChild(b);else break}b=c}}
function In(a){for(var b=a.d.firstChild,c=a.gb,d=a.b?a.b?a.O:a.ta:a.b?a.Oa:a.O,e=a.b?a.b?a.ka:a.Oa:a.b?a.ta:a.ka,f=0;f<c.length;f++){var g=c[f],h=g.R-g.W;g.left=Gn(a,b,"left",g.aa-d,h);g.right=Gn(a,b,"right",e-g.V,h)}}function Jn(a,b,c,d,e){var f;if(b&&b.J&&!b.e&&(f=qn(b,0,a.b),!isNaN(f)))return f;b=c[d];for(e-=b.ia;;){f=qn(b,e,a.b);if(!isNaN(f))return f;if(0<e)e--;else{d--;if(0>d)return a.ta;b=c[d];1!=b.A.nodeType&&(e=b.A.textContent.length)}}}
function Z(a){return"number"==typeof a?a:(a=a.match(/^(-?[0-9]*(\.[0-9]*)?)px$/))?parseFloat(a[0]):0}function Kn(a,b){var c=ln(a.za,b),d=new qe;c&&(d.left=Z(c.marginLeft),d.top=Z(c.marginTop),d.right=Z(c.marginRight),d.bottom=Z(c.marginBottom));return d}
function Ln(a,b){var c=ln(a.za,b),d=new qe;if(c){if("border-box"==c.boxSizing)return Kn(a,b);d.left=Z(c.marginLeft)+Z(c.borderLeftWidth)+Z(c.paddingLeft);d.top=Z(c.marginTop)+Z(c.borderTopWidth)+Z(c.paddingTop);d.right=Z(c.marginRight)+Z(c.borderRightWidth)+Z(c.paddingRight);d.bottom=Z(c.marginBottom)+Z(c.borderBottomWidth)+Z(c.paddingBottom)}return d}
function Mn(a,b,c){if(a=ln(a.za,b))c.marginLeft=Z(a.marginLeft),c.S=Z(a.borderLeftWidth),c.j=Z(a.paddingLeft),c.marginTop=Z(a.marginTop),c.ba=Z(a.borderTopWidth),c.k=Z(a.paddingTop),c.marginRight=Z(a.marginRight),c.Ya=Z(a.borderRightWidth),c.w=Z(a.paddingRight),c.marginBottom=Z(a.marginBottom),c.Sa=Z(a.borderBottomWidth),c.u=Z(a.paddingBottom)}function Nn(a,b,c){b=new un(b,c,c);a.f?a.f.push(b):a.f=[b]}
function On(a,b,c,d){if(a.f&&a.f[a.f.length-1].b)return Nn(a,b,c),L(!0);d+=40*(a.b?-1:1);var e=a.l,f=!e;if(f){var g=a.d.ownerDocument.createElement("div");w(g,"position","absolute");var h=a.g.clone(),e=new wn(g,h,a.za,a.yb);a.l=e;e.b=gn(a.g,a.b,g);e.Jc=!0;a.b?(e.left=0,w(e.d,"width","2em")):(e.top=a.Oa,w(e.d,"height","2em"))}a.d.appendChild(e.d);Mn(a,e.d,e);g=(a.b?-1:1)*(d-a.ta);a.b?e.height=a.Za.R-a.Za.W-Bi(e)-Ci(e):e.width=a.Za.V-a.Za.aa-Di(e)-Ei(e);d=(a.b?-1:1)*(a.Oa-d)-(a.b?Di(e)-Ei(e):Bi(e)+
Ci(e));if(f&&18>d)return a.d.removeChild(e.d),a.l=null,Nn(a,b,c),L(!0);if(!a.b&&e.top<g)return a.d.removeChild(e.d),Nn(a,b,c),L(!0);var l=K("layoutFootnoteInner");a.b?Hi(e,0,d):Gi(e,g,d);e.D=a.D+a.left+Di(a);e.H=a.H+a.top+Bi(a);e.I=a.I;var k=new ti(c);f?(Pn(e),d=L(!0)):0==e.I.length?(Qn(e),d=L(!0)):d=Rn(e);d.then(function(){Sn(e,k).then(function(d){if(f&&d)a.d.removeChild(e.d),Nn(a,b,c),a.l=null,N(l,!0);else{a.b?(a.ma=a.Oa+(e.e+Di(e)+Ei(e)),Hi(e,0,e.e)):(a.ma=a.Oa-(e.e+Bi(e)+Ci(e)),Gi(e,a.ma-a.ta,
e.e));var g;!a.b&&0<e.I.length?g=Rn(e):g=L(d);g.then(function(d){d=new un(b,c,d?d.Na:null);a.f?a.f.push(d):a.f=[d];N(l,!0)})}})});return M(l)}
function Tn(a,b){var c=K("layoutFootnote"),d=b.A;d.setAttribute("style","");w(d,"display","inline-block");d.textContent="M";var e=d.getBoundingClientRect(),f=a.b?e.left:e.bottom;d.textContent="";Xm(a.g,b,"footnote-call",d);d.textContent||d.parentNode.removeChild(d);d={ga:[{fa:b.Y,Ha:0,ea:b.ea,sa:null,qa:null}],da:0,J:!1};e=b.ia;b=b.modify();b.J=!0;On(a,e,d,f).then(function(){a.l&&a.l.d.parentNode&&a.d.removeChild(a.l.d);xn(a,f)&&0!=a.B.length&&(b.d=!0);N(c,b)});return M(c)}
function Un(a,b){var c=K("layoutFloat"),d=b.A,e=b.k,f=b.ba,g=b.parent?b.parent.O:"ltr",h=a.g.e,l=b.A.parentNode;"page"===f?Qi(h,d,e):(w(d,"float","none"),w(d,"display","inline-block"),w(d,"vertical-align","top"));Fn(a,b).then(function(k){var m=d.getBoundingClientRect(),p=Kn(a,d),m=new oe(m.left-p.left,m.top-p.top,m.right+p.right,m.bottom+p.bottom);if("page"===f)Ri(h,b,a.g)?(m=l.ownerDocument.createElement("span"),w(m,"width","0"),w(m,"height","0"),l.appendChild(m),k.A=m,N(c,k)):Ti(h,b,m).then(function(){N(c,
null)});else{e=Ni(e,a.b,g);for(var r=a.O,t=a.ka,p=b.parent;p&&p.e;)p=p.parent;if(p){var q=p.A.ownerDocument.createElement("div");q.style.left="0px";q.style.top="0px";a.b?(q.style.bottom="0px",q.style.width="1px"):(q.style.right="0px",q.style.height="1px");p.A.appendChild(q);var x=q.getBoundingClientRect(),r=Math.max(a.b?x.top:x.left,r),t=Math.min(a.b?x.bottom:x.right,t);p.A.removeChild(q);q=a.b?m.R-m.W:m.V-m.aa;"left"==e?t=Math.max(t,r+q):r=Math.min(r,t-q);p.A.appendChild(b.A)}q=new oe(r,(a.b?-1:
1)*a.ta,t,(a.b?-1:1)*a.Oa);r=m;a.b&&(r=Ge(m));t=a.b?-1:1;r.W<a.Kc*t&&(x=r.R-r.W,r.W=a.Kc*t,r.R=r.W+x);Le(q,a.gb,r,e);a.b&&(m=new oe(-r.R,r.aa,-r.W,r.V));q=Ln(a,d);w(d,"width",m.V-m.aa-q.left-q.right+"px");w(d,"height",m.R-m.W-q.top-q.bottom+"px");w(d,"position","absolute");w(d,"display",b.display);t=null;p&&(p.H?t=p:t=ri(p));t?(q=t.A.ownerDocument.createElement("div"),q.style.position="absolute",t.b?q.style.right="0":q.style.left="0",q.style.top="0",t.A.appendChild(q),p=q.getBoundingClientRect(),
t.A.removeChild(q)):p={left:a.b?a.Oa:a.O,right:a.b?a.ta:a.ka,top:a.b?a.O:a.ta};(t?t.b:a.b)?w(d,"right",p.right-m.V+a.w+"px"):w(d,"left",m.aa-p.left+a.j+"px");w(d,"top",m.W-p.top+a.k+"px");b.u&&(b.u.parentNode.removeChild(b.u),b.u=null);p=a.b?m.aa:m.R;m=a.b?m.V:m.W;xn(a,p)&&0!=a.B.length?(b=b.modify(),b.d=!0,N(c,b)):(Hn(a),q=new oe(a.b?a.Oa:a.O,a.b?a.O:a.ta,a.b?a.ta:a.ka,a.b?a.ka:a.Oa),a.b&&(q=Ge(q)),Me(q,a.gb,r,e),In(a),"left"==e?a.Lc=p:a.Ic=p,a.Kc=m,Vn(a,p),N(c,k))}});return M(c)}
function Wn(a,b){for(var c=a.A,d="";c&&b&&!d&&(1!=c.nodeType||(d=c.style.textAlign,b));c=c.parentNode);if(!b||"justify"==d){var c=a.A,e=c.ownerDocument,d=e.createElement("span");d.style.visibility="hidden";d.textContent=" ########################";d.setAttribute("data-adapt-spec","1");var f=b&&(a.J||1!=c.nodeType)?c.nextSibling:c;if(c=c.parentNode)c.insertBefore(d,f),b||(e=e.createElement("div"),c.insertBefore(e,f),d.style.lineHeight="80px",e.style.marginTop="-80px",e.style.height="0px",e.setAttribute("data-adapt-spec",
"1"))}}function Xn(a,b,c,d){var e=K("processLineStyling");vn(d);var f=d.concat([]);d.splice(0,d.length);var g=0,h=b.f;0==h.count&&(h=h.ee);nf(function(d){if(h){var e=Yn(a,f),m=h.count-g;if(e.length<=m)O(d);else{var p=Zn(a,f,e[m-1]);$n(a,p,!1,!1).then(function(){g+=m;fn(a.g,p,0).then(function(e){b=e;Wn(b,!1);h=b.f;f=[];Cn(a,b,f).then(function(b){c=b;0<a.g.e.b.length?O(d):pf(d)})})})}}else O(d)}).then(function(){Array.prototype.push.apply(d,f);vn(d);N(e,c)});return M(e)}
function ao(a,b){for(var c=0,d=0,e=b.length-1;0<=e;e--){var f=b[e];if(!f.J||!f.A||1!=f.A.nodeType)break;f=Kn(a,f.A);f=a.b?-f.left:f.bottom;0<f?c=Math.max(c,f):d=Math.min(d,f)}return c-d}
function bo(a,b){var c=K("layoutBreakableBlock"),d=[];Cn(a,b,d).then(function(e){if(0<a.g.e.b.length)N(c,e);else{var f=d.length-1;if(0>f)N(c,e);else{var f=Jn(a,e,d,f,d[f].ia),g=xn(a,f);null==e&&(f+=ao(a,d));Vn(a,f);var h;b.f?h=Xn(a,b,e,d):h=L(e);h.then(function(b){0<d.length&&(a.B.push(new rn(d,d[0].j)),g&&(2!=d.length&&0<a.B.length||d[0].Y!=d[1].Y||!pn[d[0].Y.localName])&&b&&(b=b.modify(),b.d=!0));N(c,b)})}}});return M(c)}
function Zn(a,b,c){vn(b);for(var d=0,e=b[0].ia,f=d,g=b.length-1,h=b[g].ia,l;e<h;){l=e+Math.ceil((h-e)/2);for(var f=d,k=g;f<k;){var m=f+Math.ceil((k-f)/2);b[m].ia>l?k=m-1:f=m}k=Jn(a,null,b,f,l);if(a.b?k<c:k>c){for(h=l-1;b[f].ia==l;)f--;g=f}else Vn(a,k),e=l,d=f}a=b[f];b=a.A;1!=b.nodeType&&(a.J?a.da=b.length:(e-=a.ia,c=b.data,173==c.charCodeAt(e)?(b.replaceData(e,c.length-e,"-"),e++):(d=c.charAt(e),e++,f=c.charAt(e),b.replaceData(e,c.length-e,Na(d)&&Na(f)?"-":"")),0<e&&(a=a.modify(),a.da+=e,a.h=null)));
return a}
function Yn(a,b){for(var c=[],d=b[0].A,e=b[b.length-1].A,f=[],g=d.ownerDocument.createRange(),h=!1,l=null,k=!1,m=!0;m;){var p=!0;do{var r=null;d==e&&(m=!1);1!=d.nodeType?(k||(g.setStartBefore(d),k=!0),l=d):h?h=!1:d.getAttribute("data-adapt-spec")?p=!k:r=d.firstChild;r||(r=d.nextSibling,r||(h=!0,r=d.parentNode));d=r}while(p&&m);if(k){g.setEndAfter(l);k=kn(g);for(p=0;p<k.length;p++)f.push(k[p]);k=!1}}f.sort(a.b?gi:fi);l=d=h=g=e=0;for(m=a.b?-1:1;;){if(l<f.length&&(k=f[l],p=1,0<d&&(p=Math.max(a.b?k.right-
k.left:k.bottom-k.top,1),p=m*(a.b?k.right:k.top)<m*e?m*((a.b?k.left:k.bottom)-e)/p:m*(a.b?k.left:k.bottom)>m*g?m*(g-(a.b?k.right:k.top))/p:1),0==d||.6<=p||.2<=p&&(a.b?k.top:k.left)>=h-1)){h=a.b?k.bottom:k.right;a.b?(e=0==d?k.right:Math.max(e,k.right),g=0==d?k.left:Math.min(g,k.left)):(e=0==d?k.top:Math.min(e,k.top),g=0==d?k.bottom:Math.max(g,k.bottom));d++;l++;continue}0<d&&(c.push(g),d=0);if(l>=f.length)break}c.sort(Ra);a.b&&c.reverse();return c}
function co(a,b){if(!a.f)return L(!0);for(var c=!1,d=a.f.length-1;0<=d;--d){var e=a.f[d];if(e.ia<=b)break;a.f.pop();e.b!==e.d&&(c=!0)}if(!c)return L(!0);var f=K("clearFootnotes"),g=a.e+a.ta,h=a.f;a.l=null;a.f=null;var l=0;mf(function(){for(;l<h.length;){var b=h[l++],b=On(a,b.ia,b.d,g);if(b.Ca())return b}return L(!1)}).then(function(){N(f,!0)});return M(f)}
function sn(a,b,c){for(var d=b.e,e=d[0];e.parent&&e.e;)e=e.parent;var f;c?f=c=1:(c=Math.max((e.g.widows||2)-0,1),f=Math.max((e.g.orphans||2)-0,1));var g=0;si(e,function(b){if("clone"===b.g["box-decoration-break"]){var c=ln(a.za,b.A),d=new qe;c&&(d.left=Z(c.borderLeftWidth)+Z(c.paddingLeft),d.top=Z(c.borderTopWidth)+Z(c.paddingTop),d.right=Z(c.borderRightWidth)+Z(c.paddingRight),d.bottom=Z(c.borderBottomWidth)+Z(c.paddingBottom));g+=b.b?-d.left:d.bottom}});var h=Yn(a,d),l=a.ma-g,d=Qa(h.length,function(b){return a.b?
h[b]<l:h[b]>l}),d=Math.min(h.length-c,d);if(d<f)return null;l=h[d-1];if(b=Zn(a,b.e,l))a.e=(a.b?-1:1)*(l-a.ta);return b}function $n(a,b,c,d){c=c||null!=b.A&&1==b.A.nodeType&&!b.J;var e=b,f=c;do{var g=e.A.parentNode;if(!g)break;var h=g,l=e.A;if(h)for(var k=void 0;(k=h.lastChild)!=l;)h.removeChild(k);f&&(g.removeChild(e.A),f=!1);e=e.parent}while(e);d&&(Wn(b,!0),hn(c?b:b.parent));return co(a,b.ia)}
function eo(a,b,c){var d=K("findAcceptableBreak"),e=null,f=0,g=0;do for(var f=g,g=Number.MAX_VALUE,h=a.B.length-1;0<=h&&!e;--h){var e=a.B[h].d(a,f),l=a.B[h].b();l>f&&(g=Math.min(g,l))}while(g>f&&!e);var k=!1;if(!e){v.b("Could not find any page breaks?!!");if(a.Gd)return fo(a,b).then(function(b){b?(b=b.modify(),b.d=!1,$n(a,b,k,!0).then(function(){N(d,b)})):N(d,b)}),M(d);e=c;k=!0}$n(a,e,k,!0).then(function(){N(d,e)});return M(d)}
function go(a){a=a.toString();return""==a||"auto"==a||!!a.match(/^0+(.0*)?[^0-9]/)}function ho(a,b,c,d,e){if(!b)return!1;var f=qn(b,0,a.b),g=xn(a,f);c&&(f+=ao(a,c));Vn(a,f);if(d||!g)b=new tn(ni(b),e,g,a.e),a.B.push(b);return g}
function io(a,b){if(b.A.parentNode){var c=Kn(a,b.A),d=b.A.ownerDocument.createElement("div");a.b?(d.style.bottom="0px",d.style.width="1px",d.style.marginRight=c.right+"px"):(d.style.right="0px",d.style.height="1px",d.style.marginTop=c.top+"px");b.A.parentNode.insertBefore(d,b.A);var e=d.getBoundingClientRect(),e=a.b?e.right:e.top,f=a.b?-1:1,g;switch(b.l){case "left":g=a.Lc;break;case "right":g=a.Ic;break;default:g=f*Math.max(a.Ic*f,a.Lc*f)}e*f>=g*f?b.A.parentNode.removeChild(d):(e=Math.max(1,(g-e)*
f),a.b?d.style.width=e+"px":d.style.height=e+"px",e=d.getBoundingClientRect(),e=a.b?e.left:e.bottom,a.b?(g=e+c.right-g,0<g==0<=c.right&&(g+=c.right),d.style.marginLeft=g+"px"):(g-=e+c.top,0<g==0<=c.top&&(g+=c.top),d.style.marginBottom=g+"px"),b.u=d)}}
function jo(a,b,c){function d(){b=k[0]||b;b.A.parentNode.removeChild(b.A);e.h=h}var e=a,f=K("skipEdges"),g=c&&b&&b.J,h=null,l=null,k=[],m=[],p=!1;nf(function(a){for(;b;){do if(b.A){if(!Dn(e.yb,b)){b=b.modify();b.d=!0;O(a);return}if(b.e&&1!=b.A.nodeType){if(bi(b.A,b.w))break;if(!b.J){!c&&nl[h]?d():ho(e,l,null,!0,h)?(b=(l||b).modify(),b.d=!0):(b=b.modify(),b.h=h);O(a);return}}if(!b.J&&(b.l&&io(e,b),b.k||b.B)){k.push(ni(b));h=ll(h,b.h);!c&&nl[h]?d():ho(e,l,null,!0,h)&&(b=(l||b).modify(),b.d=!0);O(a);
return}if(1==b.A.nodeType){var f=b.A.style;if(b.J){if(p){if(!c&&nl[h]){d();O(a);return}k=[];g=c=!1;h=null}p=!1;l=ni(b);m.push(l);h=ll(h,b.D);if(f&&(!go(f.paddingBottom)||!go(f.borderBottomWidth))){if(ho(e,l,null,!0,h)){b=(l||b).modify();b.d=!0;O(a);return}m=[l];l=null}}else{k.push(ni(b));h=ll(h,b.h);if(pn[b.A.localName]){!c&&nl[h]?d():ho(e,l,null,!0,h)&&(b=(l||b).modify(),b.d=!0);O(a);return}!f||go(f.paddingTop)&&go(f.borderTopWidth)||(g=!1,m=[]);p=!0}}}while(0);f=cn(e.g,b,g);if(f.Ca()){f.then(function(c){b=
c;pf(a)});return}b=f.mc()}ho(e,l,m,!1,h)?l&&(b=l.modify(),b.d=!0):nl[h]&&(e.h=h);O(a)}).then(function(){N(f,b)});return M(f)}
function fo(a,b){var c=ni(b),d=K("skipEdges"),e=null,f=!1;nf(function(d){for(;b;){do if(b.A){if(b.e&&1!=b.A.nodeType){if(bi(b.A,b.w))break;if(!b.J){nl[e]&&(a.h=e);O(d);return}}if(!b.J&&(b.k||b.B)){e=ll(e,b.h);nl[e]&&(a.h=e);O(d);return}if(1==b.A.nodeType){var h=b.A.style;if(b.J){if(f){if(nl[e]){a.h=e;O(d);return}e=null}f=!1;e=ll(e,b.D)}else{e=ll(e,b.h);if(pn[b.A.localName]){nl[e]&&(a.h=e);O(d);return}if(h&&(!go(h.paddingTop)||!go(h.borderTopWidth))){O(d);return}}f=!0}}while(0);h=cn(a.g,b);if(h.Ca()){h.then(function(a){b=
a;pf(d)});return}b=h.mc()}c=null;O(d)}).then(function(){N(d,c)});return M(d)}function En(a,b){return"footnote"==b.k?Tn(a,b):Un(a,b)}function ko(a,b,c){var d=K("layoutNext");jo(a,b,c).then(function(c){b=c;if(!b||a.h||b.d)N(d,b);else if(b.k)En(a,b).ua(d);else{a:if(b.J)c=!0;else{switch(b.Y.namespaceURI){case "http://www.w3.org/2000/svg":c=!1;break a}c=!b.B}c?bo(a,b).ua(d):Fn(a,b).ua(d)}});return M(d)}
function Qn(a){var b=a.d.ownerDocument.createElement("div");b.style.position="absolute";b.style.top=a.k+"px";b.style.right=a.w+"px";b.style.bottom=a.u+"px";b.style.left=a.j+"px";a.d.appendChild(b);var c=b.getBoundingClientRect();a.d.removeChild(b);var b=a.D+a.left+Di(a),d=a.H+a.top+Bi(a);a.Za=new oe(b,d,b+a.width,d+a.height);a.O=c?a.b?c.top:c.left:0;a.ka=c?a.b?c.bottom:c.right:0;a.ta=c?a.b?c.right:c.top:0;a.Oa=c?a.b?c.left:c.bottom:0;a.Lc=a.ta;a.Ic=a.ta;a.Kc=a.ta;a.ma=a.Oa;c=a.Za;b=a.D+a.left+Di(a);
d=a.H+a.top+Bi(a);b=a.xb?we(a.xb,b,d):ye(b,d,b+a.width,d+a.height);a.gb=Ie(c,[b],a.I,a.$a,a.b);In(a);a.f=null}function Pn(a){a.wb=[];w(a.d,"width",a.width+"px");w(a.d,"height",a.height+"px");Qn(a);a.e=0;a.qd=!1;a.h=null}function Vn(a,b){a.e=Math.max((a.b?-1:1)*(b-a.ta),a.e)}function lo(a,b){var c=b.b;if(!c)return L(!0);var d=K("layoutOverflownFootnotes"),e=0;mf(function(){for(;e<c.length;){var b=c[e++],b=On(a,0,b,a.ta);if(b.Ca())return b}return L(!1)}).then(function(){N(d,!0)});return M(d)}
function Sn(a,b,c){a.wb.push(b);if(a.qd)return L(b);var d=K("layout");lo(a,b).then(function(){zn(a,b.Na).then(function(b){var f=b;a.B=[];nf(function(d){for(;b;){var h=!0;ko(a,b,c).then(function(l){c=!1;b=l;0<a.g.e.b.length?O(d):a.h?O(d):b&&b.d?eo(a,b,f).then(function(a){b=a;O(d)}):h?h=!1:pf(d)});if(h){h=!1;return}}O(d)}).then(function(){var c=a.l;c&&(a.d.appendChild(c.d),a.b?a.e=this.ta-this.Oa:a.e=c.top+Bi(c)+c.e+Ci(c));if(b)if(0<a.g.e.b.length)N(d,null);else{a.qd=!0;c=new ti(pi(b));if(a.f){for(var f=
[],l=0;l<a.f.length;l++){var k=a.f[l].b;k&&f.push(k)}c.b=f.length?f:null}N(d,c)}else N(d,null)})})});return M(d)}function Rn(a){for(var b=a.wb,c=a.d.lastChild;c!=a.nd;){var d=c.previousSibling;a.d===c.parentNode&&Km(c)||a.d.removeChild(c);c=d}Hn(a);Pn(a);var e=K("redoLayout"),f=0,g=null,h=!0;nf(function(c){if(f<b.length){var d=b[f++];Sn(a,d,h).then(function(a){h=!1;a?(g=a,O(c)):pf(c)})}else O(c)}).then(function(){N(e,g)});return M(e)};function mo(a,b){this.b=a;this.G=b}function Pm(a,b,c,d){this.b=a;this.e=b;this.g=c;this.d=d;this.f=null}function Om(a,b){this.b=a;this.d=b}function no(a){var b={};Object.keys(a).forEach(function(c){b[c]=Array.b(a[c])});return b}function oo(a,b){this.Db=a;this.bc=b;this.bd=null;this.G=this.F=-1}function Mk(a,b,c){b=a.b.D.kd(b,a.d);a.b.h[b]=c}function po(a){return(a=a.match(/^[^#]*#(.*)$/))?a[1]:null}function qo(a,b){var c=a.b.D.b(va(b,a.e),a.e);"#"===c.charAt(0)&&(c=c.substring(1));return c}
function rk(a,b,c){return new gc(a.d,function(){var d=a.b.b[b];return c(d&&d.length?d[d.length-1]:null)},"page-counter-"+b)}function tk(a,b,c){return new gc(a.d,function(){return c(a.b.b[b]||[])},"page-counters-"+b)}function ro(a,b,c,d){var e=a.b.h[c];if(!e&&d&&b){d=a.f;if(b){d.k=b;for(b=0;d.k&&(b+=5E3,El(d,b,0)!==Number.POSITIVE_INFINITY););d.k=null}e=a.b.h[c]}return e||null}
function vk(a,b,c,d){var e=po(b),f=qo(a,b),g=ro(a,e,f,!1);return g&&g[c]?(b=g[c],new B(a.g,d(b[b.length-1]||null))):new gc(a.d,function(){if(g=ro(a,e,f,!0)){if(g[c]){var b=g[c];return d(b[b.length-1]||null)}if(b=a.b.g.b[f]?a.b.b:a.b.k[f]||null)return so(a.b,f),b[c]?(b=b[c],d(b[b.length-1]||null)):d(0);to(a.b,f,!1);return"??"}to(a.b,f,!1);return"??"},"target-counter-"+c+"-of-"+b)}
function xk(a,b,c,d){var e=po(b),f=qo(a,b);return new gc(a.d,function(){var b=a.b.g.b[f]?a.b.b:a.b.k[f]||null;if(b){so(a.b,f);var b=b[c]||[],h=ro(a,e,f,!0)[c]||[];return d(b.concat(h))}to(a.b,f,!1);return"??"},"target-counters-"+c+"-of-"+b)}function uo(a){this.D=a;this.h={};this.k={};this.b={};this.b.page=[0];this.w={};this.u=[];this.l={};this.g=null;this.j=[];this.d=[];this.B=[];this.e={};this.f={}}
function vo(a,b,c){a.w=no(a.b);var d,e=b["counter-reset"];e&&(e=e.evaluate(c))&&(d=qg(e,!0));if(d)for(var f in d){var e=a,g=f,h=d[f];e.b[g]?e.b[g].push(h):e.b[g]=[h]}var l;(b=b["counter-increment"])&&(c=b.evaluate(c))&&(l=qg(c,!1));l?"page"in l||(l.page=1):l={page:1};for(var k in l)a.b[k]||(c=a,b=k,c.b[b]?c.b[b].push(0):c.b[b]=[0]),c=a.b[k],c[c.length-1]+=l[k]}function wo(a,b){a.u.push(a.b);a.b=no(b)}
function so(a,b){var c=a.e[b],d=a.f[b];d||(d=a.f[b]=[]);for(var e=!1,f=0;f<a.d.length;){var g=a.d[f];g.Db===b?(g.bc=!0,a.d.splice(f,1),c&&(e=c.indexOf(g),0<=e&&c.splice(e,1)),d.push(g),e=!0):f++}e||to(a,b,!0)}function to(a,b,c){a.j.some(function(a){return a.Db===b})||a.j.push(new oo(b,c))}
function xo(a,b,c){var d=Object.keys(a.g.b);if(0<d.length){var e=no(a.b);d.forEach(function(a){this.k[a]=e;var d=this.l[a];if(d&&d.G<c&&(d=this.f[a])){var f=this.e[a];f||(f=this.e[a]=[]);for(var g;g=d.shift();)g.bc=!1,f.push(g)}this.l[a]={F:b,G:c}},a)}for(var d=a.w,f;f=a.j.shift();){f.bd=d;f.F=b;f.G=c;var g;f.bc?(g=a.f[f.Db])||(g=a.f[f.Db]=[]):(g=a.e[f.Db])||(g=a.e[f.Db]=[]);g.every(function(a){return!(f===a||a&&f.Db===a.Db&&f.bc===a.bc&&f.F===a.F&&f.G===a.G)})&&g.push(f)}a.g=null}
function yo(a,b){var c=[];Object.keys(b.b).forEach(function(a){(a=this.e[a])&&(c=c.concat(a))},a);c.sort(function(a,b){return a.F-b.F||a.G-b.G});var d=[],e=null;c.forEach(function(a){e&&e.F===a.F&&e.G===a.G?e.vc.push(a):(e={F:a.F,G:a.G,bd:a.bd,vc:[a]},d.push(e))});return d}function zo(a,b){a.B.push(a.d);a.d=b}function Dn(a,b){if(!b||b.J)return!0;var c=b.A;if(!c||1!==c.nodeType)return!0;c=c.getAttribute("id")||c.getAttribute("name");return c?(c=a.b.l[c])?a.G>=c.G:!0:!0};function Ao(a,b){this.e(a,"end",b)}function Bo(a,b){this.e(a,"start",b)}function Co(a,b,c){c||(c=this.g.now());var d=this.f[a];d||(d=this.f[a]=[]);var e;for(a=d.length-1;0<=a&&(!(e=d[a])||e[b]);a--)e=null;e||(e={},d.push(e));e[b]=c}function Do(){}function Eo(a){this.g=a;this.f={};this.registerEndTiming=this.d=this.registerStartTiming=this.b=this.e=Do}
Eo.prototype.h=function(){var a=this.f,b="";Object.keys(a).forEach(function(c){for(var d=a[c],e=d.length,f=0;f<e;f++){var g=d[f];b+=c;1<e&&(b+="("+f+")");b+=" => start: "+g.start+", end: "+g.end+", duration: "+(g.end-g.start)+"\n"}});v.e(b)};Eo.prototype.j=function(){this.registerEndTiming=this.d=this.registerStartTiming=this.b=this.e=Do};Eo.prototype.k=function(){this.e=Co;this.registerStartTiming=this.b=Bo;this.registerEndTiming=this.d=Ao};
var Fo={now:Date.now},Go,Ho=Go=new Eo(window&&window.performance||Fo);Co.call(Ho,"load_vivliostyle","start",void 0);ba("vivliostyle.profile.profiler",Ho);Eo.prototype.printTimings=Eo.prototype.h;Eo.prototype.disable=Eo.prototype.j;Eo.prototype.enable=Eo.prototype.k;function Io(a,b,c){function d(c){return ln(a,b).getPropertyValue(c)}function e(){w(b,"display","block");w(b,"position","static");return d(Q)}function f(){w(b,"display","inline-block");w(q,Q,"99999999px");var a=d(Q);w(q,Q,"");return a}function g(){w(b,"display","inline-block");w(q,Q,"0");var a=d(Q);w(q,Q,"");return a}function h(){var a=e(),b=g(),c=parseFloat(a);if(c<=parseFloat(b))return b;b=f();return c<=parseFloat(b)?a:b}function l(){throw Error("Getting fill-available block size is not implemented");
}var k=b.style.display,m=b.style.position,p=b.style.width,r=b.style.height,t=b.parentNode,q=b.ownerDocument.createElement("div");w(q,"position",m);t.insertBefore(q,b);q.appendChild(b);w(b,"width","auto");w(b,"height","auto");var x=Ga("writing-mode"),x=(x?d(x):null)||d("writing-mode"),R="vertical-rl"===x||"tb-rl"===x||"vertical-lr"===x||"tb-lr"===x,Q=R?"height":"width",sa=R?"width":"height",Fa={};c.forEach(function(a){var c;switch(a){case "fill-available inline size":c=e();break;case "max-content inline size":c=
f();break;case "min-content inline size":c=g();break;case "fit-content inline size":c=h();break;case "fill-available block size":c=l();break;case "max-content block size":case "min-content block size":case "fit-content block size":c=d(sa);break;case "fill-available width":c=R?l():e();break;case "fill-available height":c=R?e():l();break;case "max-content width":c=R?d(sa):f();break;case "max-content height":c=R?f():d(sa);break;case "min-content width":c=R?d(sa):g();break;case "min-content height":c=
R?g():d(sa);break;case "fit-content width":c=R?d(sa):h();break;case "fit-content height":c=R?h():d(sa)}Fa[a]=parseFloat(c);w(b,"position",m);w(b,"display",k)});w(b,"width",p);w(b,"height",r);t.insertBefore(b,q);t.removeChild(q);return Fa};function Jo(a){var b=a["writing-mode"],b=b&&b.value;a=(a=a.direction)&&a.value;return b===ee||b!==fe&&a!==Zd?"ltr":"rtl"}
var Ko={a5:{width:new I(148,"mm"),height:new I(210,"mm")},a4:{width:new I(210,"mm"),height:new I(297,"mm")},a3:{width:new I(297,"mm"),height:new I(420,"mm")},b5:{width:new I(176,"mm"),height:new I(250,"mm")},b4:{width:new I(250,"mm"),height:new I(353,"mm")},"jis-b5":{width:new I(182,"mm"),height:new I(257,"mm")},"jis-b4":{width:new I(257,"mm"),height:new I(364,"mm")},letter:{width:new I(8.5,"in"),height:new I(11,"in")},legal:{width:new I(8.5,"in"),height:new I(14,"in")},ledger:{width:new I(11,"in"),
height:new I(17,"in")}},Lo=new I(.24,"pt"),Mo=new I(3,"mm"),No=new I(10,"mm"),Oo=new I(13,"mm");
function Po(a){var b={width:je,height:ke,zb:le,kb:le},c=a.size;if(c&&c.value!==td){var d=c.value;d.Yc()?(c=d.values[0],d=d.values[1]):(c=d,d=null);if(c.Xb())b.width=c,b.height=d||c;else if(c=Ko[c.name.toLowerCase()])d&&d===Md?(b.width=c.height,b.height=c.width):(b.width=c.width,b.height=c.height)}(c=a.marks)&&c.value!==Qd&&(b.kb=Oo);a=a.bleed;a&&a.value!==td?a.value&&a.value.Xb()&&(b.zb=a.value):c&&(a=!1,c.value.Yc()?a=c.value.values.some(function(a){return a===zd}):a=c.value===zd,a&&(b.zb=new I(6,
"pt")));return b}function Qo(a,b){var c={},d=a.zb.C*nc(b,a.zb.ha,!1),e=a.kb.C*nc(b,a.kb.ha,!1),f=d+e,g=a.width;c.pb=g===je?(b.T.Xa?Math.floor(b.za/2)-b.T.Kb:b.za)-2*f:g.C*nc(b,g.ha,!1);g=a.height;c.ob=g===ke?b.gb-2*f:g.C*nc(b,g.ha,!1);c.zb=d;c.kb=e;c.Qc=f;return c}function Ro(a,b,c){a=a.createElementNS("http://www.w3.org/2000/svg","svg");a.setAttribute("width",b);a.setAttribute("height",c);a.style.position="absolute";return a}
function So(a,b,c){a=a.createElementNS("http://www.w3.org/2000/svg",c||"polyline");a.setAttribute("stroke","black");a.setAttribute("stroke-width",b);a.setAttribute("fill","none");return a}var To={ze:"top left",Ae:"top right",qe:"bottom left",re:"bottom right"};
function Uo(a,b,c,d,e,f){var g=d;g<=e+2*jc.mm&&(g=e+d/2);var h=Math.max(d,g),l=e+h+c/2,k=Ro(a,l,l),g=[[0,e+d],[d,e+d],[d,e+d-g]];d=g.map(function(a){return[a[1],a[0]]});if("top right"===b||"bottom right"===b)g=g.map(function(a){return[e+h-a[0],a[1]]}),d=d.map(function(a){return[e+h-a[0],a[1]]});if("bottom left"===b||"bottom right"===b)g=g.map(function(a){return[a[0],e+h-a[1]]}),d=d.map(function(a){return[a[0],e+h-a[1]]});l=So(a,c);l.setAttribute("points",g.map(function(a){return a.join(",")}).join(" "));
k.appendChild(l);a=So(a,c);a.setAttribute("points",d.map(function(a){return a.join(",")}).join(" "));k.appendChild(a);b.split(" ").forEach(function(a){k.style[a]=f+"px"});return k}var Vo={ye:"top",pe:"bottom",Qd:"left",Rd:"right"};
function Wo(a,b,c,d,e){var f=2*d,g;"top"===b||"bottom"===b?(g=f,f=d):g=d;var h=Ro(a,g,f),l=So(a,c);l.setAttribute("points","0,"+f/2+" "+g+","+f/2);h.appendChild(l);l=So(a,c);l.setAttribute("points",g/2+",0 "+g/2+","+f);h.appendChild(l);a=So(a,c,"circle");a.setAttribute("cx",g/2);a.setAttribute("cy",f/2);a.setAttribute("r",d/4);h.appendChild(a);var k;switch(b){case "top":k="bottom";break;case "bottom":k="top";break;case "left":k="right";break;case "right":k="left"}Object.keys(Vo).forEach(function(a){a=
Vo[a];a===b?h.style[a]=e+"px":a!==k&&(h.style[a]="0",h.style["margin-"+a]="auto")});return h}function Xo(a,b,c,d){var e=!1,f=!1;if(a=a.marks)a=a.value,a.Yc()?a.values.forEach(function(a){a===zd?e=!0:a===Ad&&(f=!0)}):a===zd?e=!0:a===Ad&&(f=!0);if(e||f){var g=c.N,h=g.ownerDocument,l=b.zb,k=pd(Lo,d),m=pd(Mo,d),p=pd(No,d);e&&Object.keys(To).forEach(function(a){a=Uo(h,To[a],k,p,l,m);g.appendChild(a)});f&&Object.keys(Vo).forEach(function(a){a=Wo(h,Vo[a],k,p,m);g.appendChild(a)})}}
var Yo=function(){var a={width:!0,height:!0,"block-size":!0,"inline-size":!0,margin:!0,padding:!0,border:!0,outline:!0,"outline-width":!0,"outline-style":!0,"outline-color":!0};"left right top bottom before after start end block-start block-end inline-start inline-end".split(" ").forEach(function(b){a["margin-"+b]=!0;a["padding-"+b]=!0;a["border-"+b+"-width"]=!0;a["border-"+b+"-style"]=!0;a["border-"+b+"-color"]=!0});return a}(),Zo={"top-left-corner":{Q:1,ya:!0,va:!1,wa:!0,xa:!0,la:null},"top-left":{Q:2,
ya:!0,va:!1,wa:!1,xa:!1,la:"start"},"top-center":{Q:3,ya:!0,va:!1,wa:!1,xa:!1,la:"center"},"top-right":{Q:4,ya:!0,va:!1,wa:!1,xa:!1,la:"end"},"top-right-corner":{Q:5,ya:!0,va:!1,wa:!1,xa:!0,la:null},"right-top":{Q:6,ya:!1,va:!1,wa:!1,xa:!0,la:"start"},"right-middle":{Q:7,ya:!1,va:!1,wa:!1,xa:!0,la:"center"},"right-bottom":{Q:8,ya:!1,va:!1,wa:!1,xa:!0,la:"end"},"bottom-right-corner":{Q:9,ya:!1,va:!0,wa:!1,xa:!0,la:null},"bottom-right":{Q:10,ya:!1,va:!0,wa:!1,xa:!1,la:"end"},"bottom-center":{Q:11,ya:!1,
va:!0,wa:!1,xa:!1,la:"center"},"bottom-left":{Q:12,ya:!1,va:!0,wa:!1,xa:!1,la:"start"},"bottom-left-corner":{Q:13,ya:!1,va:!0,wa:!0,xa:!1,la:null},"left-bottom":{Q:14,ya:!1,va:!1,wa:!0,xa:!1,la:"end"},"left-middle":{Q:15,ya:!1,va:!1,wa:!0,xa:!1,la:"center"},"left-top":{Q:16,ya:!1,va:!1,wa:!0,xa:!1,la:"start"}},$o=Object.keys(Zo).sort(function(a,b){return Zo[a].Q-Zo[b].Q});
function ap(a,b,c){Ql.call(this,a,null,"vivliostyle-page-rule-master",[],b,null,0);a=Po(c);new bp(this.d,this,c,a);this.l={};cp(this,c);this.b.position=new V(Vd,0);this.b.width=new V(a.width,0);this.b.height=new V(a.height,0);for(var d in c)Yo[d]||"background-clip"===d||(this.b[d]=c[d])}u(ap,Ql);function cp(a,b){var c=b._marginBoxes;c&&$o.forEach(function(d){c[d]&&(a.l[d]=new dp(a.d,a,d,b))})}ap.prototype.f=function(a){return new ep(a,this)};
function bp(a,b,c,d){Ul.call(this,a,null,null,[],b);this.u=d;this.b["z-index"]=new V(new ld(0),0);this.b["flow-from"]=new V(H("body"),0);this.b.position=new V(qd,0);this.b.overflow=new V(ge,0);for(var e in Yo)Yo.hasOwnProperty(e)&&(this.b[e]=c[e])}u(bp,Ul);bp.prototype.f=function(a){return new fp(a,this)};
function dp(a,b,c,d){Ul.call(this,a,null,null,[],b);this.k=c;a=d._marginBoxes[this.k];for(var e in d)if(b=d[e],c=a[e],Yi[e]||c&&c.value===Hd)this.b[e]=b;for(e in a)Object.prototype.hasOwnProperty.call(a,e)&&(b=a[e])&&b.value!==Hd&&(this.b[e]=b)}u(dp,Ul);dp.prototype.f=function(a){return new gp(a,this)};function ep(a,b){Rl.call(this,a,b);this.j=null;this.ma={}}u(ep,Rl);
ep.prototype.h=function(a,b){var c=this.D,d;for(d in b)if(Object.prototype.hasOwnProperty.call(b,d))switch(d){case "writing-mode":case "direction":c[d]=b[d]}Rl.prototype.h.call(this,a,b)};ep.prototype.Vc=function(){var a=this.style;a.left=le;a["margin-left"]=le;a["border-left-width"]=le;a["padding-left"]=le;a["padding-right"]=le;a["border-right-width"]=le;a["margin-right"]=le;a.right=le};
ep.prototype.Wc=function(){var a=this.style;a.top=le;a["margin-top"]=le;a["border-top-width"]=le;a["padding-top"]=le;a["padding-bottom"]=le;a["border-bottom-width"]=le;a["margin-bottom"]=le;a.bottom=le};ep.prototype.S=function(a,b,c){b=b.u;var d={start:this.j.marginLeft,end:this.j.marginRight,ca:this.j.Hb},e={start:this.j.marginTop,end:this.j.marginBottom,ca:this.j.Gb};hp(this,b.top,!0,d,a,c);hp(this,b.bottom,!0,d,a,c);hp(this,b.left,!1,e,a,c);hp(this,b.right,!1,e,a,c)};
function ip(a,b,c,d,e){this.N=a;this.l=e;this.g=c;this.k=!X(d,b[c?"width":"height"],new Pc(d,0,"px"));this.h=null}ip.prototype.b=function(){return this.k};function jp(a){a.h||(a.h=Io(a.l,a.N.d,a.g?["max-content width","min-content width"]:["max-content height","min-content height"]));return a.h}ip.prototype.e=function(){var a=jp(this);return this.g?Di(this.N)+a["max-content width"]+Ei(this.N):Bi(this.N)+a["max-content height"]+Ci(this.N)};
ip.prototype.f=function(){var a=jp(this);return this.g?Di(this.N)+a["min-content width"]+Ei(this.N):Bi(this.N)+a["min-content height"]+Ci(this.N)};ip.prototype.d=function(){return this.g?Di(this.N)+this.N.width+Ei(this.N):Bi(this.N)+this.N.height+Ci(this.N)};function kp(a){this.g=a}kp.prototype.b=function(){return this.g.some(function(a){return a.b()})};kp.prototype.e=function(){var a=this.g.map(function(a){return a.e()});return Math.max.apply(null,a)*a.length};
kp.prototype.f=function(){var a=this.g.map(function(a){return a.f()});return Math.max.apply(null,a)*a.length};kp.prototype.d=function(){var a=this.g.map(function(a){return a.d()});return Math.max.apply(null,a)*a.length};function lp(a,b,c,d,e,f){ip.call(this,a,b,c,d,e);this.j=f}u(lp,ip);lp.prototype.b=function(){return!1};lp.prototype.e=function(){return this.d()};lp.prototype.f=function(){return this.d()};lp.prototype.d=function(){return this.g?Di(this.N)+this.j+Ei(this.N):Bi(this.N)+this.j+Ci(this.N)};
function hp(a,b,c,d,e,f){var g=a.d.d,h={},l={},k={},m;for(m in b){var p=Zo[m];if(p){var r=b[m],t=a.ma[m],q=new ip(r,t.style,c,g,f);h[p.la]=r;l[p.la]=t;k[p.la]=q}}a=d.start.evaluate(e);d.end.evaluate(e);b=d.ca.evaluate(e);var x=mp(k,b),R=!1,Q={};Object.keys(h).forEach(function(a){var b=X(g,l[a].style[c?"max-width":"max-height"],d.ca);b&&(b=b.evaluate(e),x[a]>b&&(b=k[a]=new lp(h[a],l[a].style,c,g,f,b),Q[a]=b.d(),R=!0))});R&&(x=mp(k,b),R=!1,["start","center","end"].forEach(function(a){x[a]=Q[a]||x[a]}));
var sa={};Object.keys(h).forEach(function(a){var b=X(g,l[a].style[c?"min-width":"min-height"],d.ca);b&&(b=b.evaluate(e),x[a]<b&&(b=k[a]=new lp(h[a],l[a].style,c,g,f,b),sa[a]=b.d(),R=!0))});R&&(x=mp(k,b),["start","center","end"].forEach(function(a){x[a]=sa[a]||x[a]}));var Fa=a+b,ia=a+(a+b);["start","center","end"].forEach(function(a){var b=x[a];if(b){var d=h[a],e=0;switch(a){case "start":e=c?d.left:d.top;break;case "center":e=(ia-b)/2;break;case "end":e=Fa-b}c?Hi(d,e,b-Di(d)-Ei(d)):Gi(d,e,b-Bi(d)-
Ci(d))}})}function mp(a,b){var c=a.start,d=a.center,e=a.end,f={};if(d){var g=[c,e].filter(function(a){return a}),g=np(d,g.length?new kp(g):null,b);g.Ra&&(f.center=g.Ra);d=g.Ra||d.d();d=(b-d)/2;c&&c.b()&&(f.start=d);e&&e.b()&&(f.end=d)}else c=np(c,e,b),c.Ra&&(f.start=c.Ra),c.jc&&(f.end=c.jc);return f}
function np(a,b,c){var d={Ra:null,jc:null};if(a&&b)if(a.b()&&b.b()){var e=a.e(),f=b.e();0<e&&0<f?(f=e+f,f<c?d.Ra=c*e/f:(a=a.f(),b=b.f(),b=a+b,b<c?d.Ra=a+(c-b)*(e-a)/(f-b):0<b&&(d.Ra=c*a/b)),0<d.Ra&&(d.jc=c-d.Ra)):0<e?d.Ra=c:0<f&&(d.jc=c)}else a.b()?d.Ra=Math.max(c-b.d(),0):b.b()&&(d.jc=Math.max(c-a.d(),0));else a?a.b()&&(d.Ra=c):b&&b.b()&&(d.jc=c);return d}ep.prototype.rb=function(a,b,c,d,e){ep.Pd.rb.call(this,a,b,c,d,e);b.d.setAttribute("data-vivliostyle-page-box",!0)};
function fp(a,b){Vl.call(this,a,b);this.marginLeft=this.marginBottom=this.marginRight=this.marginTop=this.Gb=this.Hb=null}u(fp,Vl);
fp.prototype.h=function(a,b){var c=this.D,d;for(d in b)Object.prototype.hasOwnProperty.call(b,d)&&(d.match(/^column.*$/)||d.match(/^background-/))&&(c[d]=b[d]);Vl.prototype.h.call(this,a,b);d=this.e;c={Hb:this.Hb,Gb:this.Gb,marginTop:this.marginTop,marginRight:this.marginRight,marginBottom:this.marginBottom,marginLeft:this.marginLeft};d.j=c;d=d.style;d.width=new J(c.Hb);d.height=new J(c.Gb);d["padding-left"]=new J(c.marginLeft);d["padding-right"]=new J(c.marginRight);d["padding-top"]=new J(c.marginTop);
d["padding-bottom"]=new J(c.marginBottom)};fp.prototype.Vc=function(){var a=op(this,{start:"left",end:"right",ca:"width"});this.Hb=a.Fd;this.marginLeft=a.Nd;this.marginRight=a.Md};fp.prototype.Wc=function(){var a=op(this,{start:"top",end:"bottom",ca:"height"});this.Gb=a.Fd;this.marginTop=a.Nd;this.marginBottom=a.Md};
function op(a,b){var c=a.style,d=a.d.d,e=b.start,f=b.end,g=b.ca,h=a.d.u[g].ja(d,null),l=X(d,c[g],h),k=X(d,c["margin-"+e],h),m=X(d,c["margin-"+f],h),p=Wl(d,c["padding-"+e],h),r=Wl(d,c["padding-"+f],h),t=Yl(d,c["border-"+e+"-width"],c["border-"+e+"-style"],h),q=Yl(d,c["border-"+f+"-width"],c["border-"+f+"-style"],h),x=E(d,h,D(d,D(d,t,p),D(d,q,r)));l?(x=E(d,x,l),k||m?k?m=E(d,x,k):k=E(d,x,m):m=k=Xc(d,x,new B(d,.5))):(k||(k=d.b),m||(m=d.b),l=E(d,x,D(d,k,m)));c[e]=new J(k);c[f]=new J(m);c["margin-"+e]=
le;c["margin-"+f]=le;c["padding-"+e]=new J(p);c["padding-"+f]=new J(r);c["border-"+e+"-width"]=new J(t);c["border-"+f+"-width"]=new J(q);c[g]=new J(l);c["max-"+g]=new J(l);return{Fd:E(d,h,D(d,k,m)),Nd:k,Md:m}}fp.prototype.rb=function(a,b,c,d,e){Vl.prototype.rb.call(this,a,b,c,d,e);c.w=b.d};function gp(a,b){Vl.call(this,a,b);var c=b.k;this.j=Zo[c];a.ma[c]=this;this.oa=!0}u(gp,Vl);n=gp.prototype;
n.rb=function(a,b,c,d,e){var f=b.d;w(f,"display","flex");var g=hm(this,a,"vertical-align"),h=null;g===H("middle")?h="center":g===H("top")?h="flex-start":g===H("bottom")&&(h="flex-end");h&&(w(f,"flex-flow",this.b?"row":"column"),w(f,"justify-content",h));Vl.prototype.rb.call(this,a,b,c,d,e)};
n.la=function(a,b){var c=this.style,d=this.d.d,e=a.start,f=a.end,g="left"===e,h=g?b.Hb:b.Gb,l=X(d,c[a.ca],h),g=g?b.marginLeft:b.marginTop;if("start"===this.j.la)c[e]=new J(g);else if(l){var k=Wl(d,c["margin-"+e],h),m=Wl(d,c["margin-"+f],h),p=Wl(d,c["padding-"+e],h),r=Wl(d,c["padding-"+f],h),t=Yl(d,c["border-"+e+"-width"],c["border-"+e+"-style"],h),f=Yl(d,c["border-"+f+"-width"],c["border-"+f+"-style"],h),l=D(d,l,D(d,D(d,p,r),D(d,D(d,t,f),D(d,k,m))));switch(this.j.la){case "center":c[e]=new J(D(d,
g,Yc(d,E(d,h,l),new B(d,2))));break;case "end":c[e]=new J(E(d,D(d,g,h),l))}}};
function pp(a,b,c){function d(a){if(x)return x;x={ca:q?q.evaluate(a):null,La:l?l.evaluate(a):null,Ma:k?k.evaluate(a):null};var b=h.evaluate(a),c=0;[r,m,p,t].forEach(function(b){b&&(c+=b.evaluate(a))});(null===x.La||null===x.Ma)&&c+x.ca+x.La+x.Ma>b&&(null===x.La&&(x.La=0),null===x.Ma&&(x.Fe=0));null!==x.ca&&null!==x.La&&null!==x.Ma&&(x.Ma=null);null===x.ca&&null!==x.La&&null!==x.Ma?x.ca=b-c-x.La-x.Ma:null!==x.ca&&null===x.La&&null!==x.Ma?x.La=b-c-x.ca-x.Ma:null!==x.ca&&null!==x.La&&null===x.Ma?x.Ma=
b-c-x.ca-x.La:null===x.ca?(x.La=x.Ma=0,x.ca=b-c):x.La=x.Ma=(b-c-x.ca)/2;return x}var e=a.style;a=a.d.d;var f=b.Xc,g=b.ad;b=b.ca;var h=c["margin"+g.charAt(0).toUpperCase()+g.substring(1)],l=Xl(a,e["margin-"+f],h),k=Xl(a,e["margin-"+g],h),m=Wl(a,e["padding-"+f],h),p=Wl(a,e["padding-"+g],h),r=Yl(a,e["border-"+f+"-width"],e["border-"+f+"-style"],h),t=Yl(a,e["border-"+g+"-width"],e["border-"+g+"-style"],h),q=X(a,e[b],h),x=null;e[b]=new J(new gc(a,function(){var a=d(this).ca;return null===a?0:a},b));e["margin-"+
f]=new J(new gc(a,function(){var a=d(this).La;return null===a?0:a},"margin-"+f));e["margin-"+g]=new J(new gc(a,function(){var a=d(this).Ma;return null===a?0:a},"margin-"+g));"left"===f?e.left=new J(D(a,c.marginLeft,c.Hb)):"top"===f&&(e.top=new J(D(a,c.marginTop,c.Gb)))}n.Vc=function(){var a=this.e.j;this.j.wa?pp(this,{Xc:"right",ad:"left",ca:"width"},a):this.j.xa?pp(this,{Xc:"left",ad:"right",ca:"width"},a):this.la({start:"left",end:"right",ca:"width"},a)};
n.Wc=function(){var a=this.e.j;this.j.ya?pp(this,{Xc:"bottom",ad:"top",ca:"height"},a):this.j.va?pp(this,{Xc:"top",ad:"bottom",ca:"height"},a):this.la({start:"top",end:"bottom",ca:"height"},a)};n.sc=function(a,b,c,d,e,f,g){Vl.prototype.sc.call(this,a,b,c,d,e,f,g);a=c.u;c=this.d.k;d=this.j;d.wa||d.xa?d.ya||d.va||(d.wa?a.left[c]=b:d.xa&&(a.right[c]=b)):d.ya?a.top[c]=b:d.va&&(a.bottom[c]=b)};
function qp(a,b,c,d,e){this.b=a;this.h=b;this.f=c;this.d=d;this.e=e;this.g={};a=this.h;b=new Qc(a,"page-number");b=new Ic(a,new Oc(a,b,new B(a,2)),a.b);c=new yc(a,b);a.values["recto-page"]=c;a.values["verso-page"]=b;"ltr"===Jo(this.e)?(a.values["left-page"]=b,b=new yc(a,b),a.values["right-page"]=b):(c=new yc(a,b),a.values["left-page"]=c,a.values["right-page"]=b)}function rp(a){var b={};Ek(a.b,[],"",b);a.b.pop();return b}
function sp(a,b){var c=[],d;for(d in b)if(Object.prototype.hasOwnProperty.call(b,d)){var e=b[d],f;f=e instanceof V?e.value+"":sp(a,e);c.push(d+f+(e.Ga||""))}return c.sort().join("^")}function tp(a,b,c){c=c.clone({sb:"vivliostyle-page-rule-master"});var d=c.b,e=b.size;if(e){var f=Po(b),e=e.Ga;d.width=jj(a.d,d.width,new V(f.width,e));d.height=jj(a.d,d.height,new V(f.height,e))}["counter-reset","counter-increment"].forEach(function(a){d[a]&&(b[a]=d[a])});c=c.f(a.f);c.h(a.b,a.e);vm(c,a.d);return c}
function up(a){this.b=null;this.f=a}u(up,W);up.prototype.apply=function(a){a.S===this.f&&this.b.apply(a)};up.prototype.d=function(){return 3};up.prototype.e=function(a){this.b&&yj(a.Yb,this.f,this.b);return!0};function vp(a){this.b=null;this.f=a}u(vp,W);vp.prototype.apply=function(a){1===(new Qc(this.f,"page-number")).evaluate(a.h)&&this.b.apply(a)};vp.prototype.d=function(){return 2};function wp(a){this.b=null;this.f=a}u(wp,W);
wp.prototype.apply=function(a){(new Qc(this.f,"left-page")).evaluate(a.h)&&this.b.apply(a)};wp.prototype.d=function(){return 1};function xp(a){this.b=null;this.f=a}u(xp,W);xp.prototype.apply=function(a){(new Qc(this.f,"right-page")).evaluate(a.h)&&this.b.apply(a)};xp.prototype.d=function(){return 1};function yp(a){this.b=null;this.f=a}u(yp,W);yp.prototype.apply=function(a){(new Qc(this.f,"recto-page")).evaluate(a.h)&&this.b.apply(a)};yp.prototype.d=function(){return 1};
function zp(a){this.b=null;this.f=a}u(zp,W);zp.prototype.apply=function(a){(new Qc(this.f,"verso-page")).evaluate(a.h)&&this.b.apply(a)};zp.prototype.d=function(){return 1};function Ap(a,b){wj.call(this,a,b,null,null)}u(Ap,wj);Ap.prototype.apply=function(a){var b=a.h,c=a.u,d=this.style;a=this.P;pj(b,c,d,a,null,null);if(d=d._marginBoxes){var c=nj(c,"_marginBoxes"),e;for(e in d)if(d.hasOwnProperty(e)){var f=c[e];f||(f={},c[e]=f);pj(b,f,d[e],a,null,null)}}};
function Bp(a,b,c,d,e){Pk.call(this,a,b,null,c,null,d,!1);this.I=e;this.B=[];this.e="";this.u=[]}u(Bp,Pk);n=Bp.prototype;n.Mb=function(){this.eb()};n.hb=function(a,b){if(this.e=b)this.b.push(new up(b)),this.P+=65536};
n.Zb=function(a,b){b&&Hf(this,"E_INVALID_PAGE_SELECTOR :"+a+"("+b.join("")+")");this.u.push(":"+a);switch(a.toLowerCase()){case "first":this.b.push(new vp(this.d));this.P+=256;break;case "left":this.b.push(new wp(this.d));this.P+=1;break;case "right":this.b.push(new xp(this.d));this.P+=1;break;case "recto":this.b.push(new yp(this.d));this.P+=1;break;case "verso":this.b.push(new zp(this.d));this.P+=1;break;default:Hf(this,"E_INVALID_PAGE_SELECTOR :"+a)}};
function Cp(a){var b;a.e||a.u.length?b=[a.e].concat(a.u.sort()):b=null;a.B.push({Ad:b,P:a.P});a.e="";a.u=[]}n.Jb=function(){Cp(this);Pk.prototype.Jb.call(this)};n.ra=function(){Cp(this);Pk.prototype.ra.call(this)};
n.cb=function(a,b,c){if("bleed"!==a&&"marks"!==a||this.B.some(function(a){return null===a.Ad})){Pk.prototype.cb.call(this,a,b,c);var d=this.h[a],e=this.I;if("bleed"===a||"marks"===a)e[""]||(e[""]={}),Object.keys(e).forEach(function(b){mj(e[b],a,d)});else if("size"===a){var f=e[""];this.B.forEach(function(b){var c=new V(d.value,d.Ga+b.P);b=b.Ad?b.Ad.join(""):"";var l=e[b];l?(c=(b=l[a])?jj(null,c,b):c,mj(l,a,c)):(l=e[b]={},mj(l,a,c),f&&["bleed","marks"].forEach(function(a){f[a]&&mj(l,a,f[a])},this))},
this)}}};n.Jd=function(a){yj(this.g.Yb,"*",a)};n.Ld=function(a){return new Ap(this.h,a)};n.hd=function(a){var b=nj(this.h,"_marginBoxes"),c=b[a];c||(c={},b[a]=c);Df(this.$,new Dp(this.d,this.$,this.k,c))};function Dp(a,b,c,d){Ef.call(this,a,b,!1);this.e=c;this.b=d}u(Dp,Ff);Dp.prototype.bb=function(a,b,c){eh(this.e,a,b,c,this)};Dp.prototype.Wb=function(a,b){Gf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};Dp.prototype.Gc=function(a,b){Gf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};
Dp.prototype.cb=function(a,b,c){mj(this.b,a,new V(b,c?Af(this):Bf(this)))};var Ep=new wf(function(){var a=K("uaStylesheetBase");uf(fh).then(function(b){var c=va("user-agent-base.css",ua);b=new Pk(null,null,null,null,null,b,!0);b.Nb("UA");Ok=b.g;fg(c,b,null,null).ua(a)});return M(a)},"uaStylesheetBaseFetcher");
function Fp(a,b,c,d,e,f,g,h,l,k){this.h=a;this.d=b;this.b=c;this.e=d;this.B=e;this.g=f;this.l=a.H;this.u=g;this.f=h;this.k=l;this.w=k;this.j=a.f;ic(this.b,function(a){var b=this.b,c;c=(c=b.b[a])?(c=c.b[0])?c.b:null:null;var d;d=b.b[a];if(d=Gp(this,d?d.d:"any"))d=(a=b.b[a])?0<a.b.length&&a.b[0].b.d<=this.l:!1;return d&&!!c&&!Hp(this,c)});hc(this.b,new gc(this.b,function(){return this.ma+this.b.page},"page-number"))}
function Ip(a,b,c,d){if(a.k.length){var e=new lc(0,b,c,d);a=a.k;for(var f={},g=0;g<a.length;g++)pj(e,f,a[g],0,null,null);g=f.width;a=f.height;var f=f["text-zoom"],h=1;if(g&&a||f){var l=jc.em;(f?f.evaluate(e,"text-zoom"):null)===Xd&&(h=l/d,d=l,b*=h,c*=h);if(g&&a&&(g=pd(g.evaluate(e,"width"),e),e=pd(a.evaluate(e,"height"),e),0<g&&0<e))return{width:g,height:e,fontSize:d}}}return{width:b,height:c,fontSize:d}}
function Jp(a,b,c,d,e,f,g,h,l,k,m){lc.call(this,0,d.width,d.height,d.fontSize);this.style=a;this.Z=b;this.lang=b.lang||c;this.viewport=d;this.g={body:!0};this.e=e;this.k=this.b=this.B=this.d=this.u=null;this.l=0;this.$a=f;this.h=new mh(this.style.l);this.ka={};this.O=null;this.f=m;this.I={};this.ba=null;this.Sa=g;this.Za=h;this.ma=l;this.Ya=k;for(var p in a.f)(b=a.f[p]["flow-consume"])&&(b.evaluate(this,"flow-consume")==rd?this.g[p]=!0:delete this.g[p]);this.oa={}}u(Jp,lc);
function Kp(a){var b=K("StyleInstance.init"),c=new Om(a.f,a.Z.url),d=new Pm(a.f,a.Z.url,a.style.d,a.style.b);a.d=new tl(a.Z,a.style.e,a.style.d,a,a.g,a.style.j,c,d);d.f=a.d;Gl(a.d,a);a.B={};a.B[a.Z.url]=a.d;var e=Dl(a.d);a.ba=Jo(e);a.u=new wm(a.style.B);c=new Bk(a.style.e,a,c,d);a.u.h(c,e);vm(a.u,a);a.O=new qp(c,a.style.b,a.u,a,e);e=[];for(c=0;c<a.style.g.length;c++)if(d=a.style.g[c],!d.M||d.M.evaluate(a))d=jh(d.Bb,a),d=new kh(d),e.push(d);sh(a.$a,e,a.h).ua(b);var f=a.style.w;Object.keys(f).forEach(function(a){var b=
Qo(Po(f[a]),this);this.oa[a]={width:b.pb+2*b.Qc,height:b.ob+2*b.Qc}},a);return M(b)}function Hl(a,b,c){if(a=a.b)a.e[b.b]||(a.e[b.b]=c),c=a.b[b.b],c||(c=new wi,a.b[b.b]=c),c.b.push(new vi(new ti({ga:[{fa:b.h,Ha:0,ea:null,sa:null,qa:null}],da:0,J:!1}),b))}function Lp(a,b){for(var c=Number.POSITIVE_INFINITY,d=0;d<b.b.length;d++){for(var e=b.b[d].d.Na,f=e.ga[0].fa,g=e.da,h=e.J,l=0;f.ownerDocument!=a.Z.b;)l++,f=e.ga[l].fa,h=!1,g=0;e=xh(a.Z,f,g,h);e<c&&(c=e)}return c}
function Mp(a,b){if(!b)return 0;var c=Number.POSITIVE_INFINITY,d;for(d in a.g){var e=b.b[d];if((!e||0==e.b.length)&&a.b){e=a.d;e.D=d;for(var f=0;null!=e.D&&(f+=5E3,El(e,f,0)!=Number.POSITIVE_INFINITY););e=a.b.b[d];b!=a.b&&e&&(e=e.clone(),b.b[d]=e)}e&&(e=Lp(a,e),e<c&&(c=e))}return c}function Gp(a,b){switch(b){case "left":case "right":case "recto":case "verso":return(new Qc(a.style.b,b+"-page")).evaluate(a);default:return!0}}
function Np(a,b){var c=a.b,d=Mp(a,c);if(d==Number.POSITIVE_INFINITY)return null;for(var e=a.u.children,f,g=0;g<e.length;g++)if(f=e[g],"vivliostyle-page-rule-master"!==f.d.sb){var h=1,l=hm(f,a,"utilization");l&&l.xd()&&(h=l.C);var l=nc(a,"em",!1),k=a.pb()*a.ob();a.l=El(a.d,d,Math.ceil(h*k/(l*l)));h=a;l=c;k=void 0;for(k in l.b){var m=l.b[k];if(m&&0<m.b.length){var p=m.b[0].b;if(Lp(h,m)===p.d){a:switch(p=m.d,p){case "left":case "right":case "recto":case "verso":break a;default:p=null}m.d=on(ll(p,m.b[0].b.e))}}}a.k=
c.clone();h=a;l=h.b.page;k=void 0;for(k in h.b.b)for(m=h.b.b[k],p=m.b.length-1;0<=p;p--){var r=m.b[p];0>r.b.g&&r.b.d<h.l&&(r.b.g=l)}mc(a,a.style.b);h=hm(f,a,"enabled");if(!h||h===he){c=a;v.debug("Location - page",c.b.page);v.debug("  current:",d);v.debug("  lookup:",c.l);d=void 0;for(d in c.b.b)for(e=c.b.b[d],g=0;g<e.b.length;g++)v.debug("  Chunk",d+":",e.b[g].b.d);d=a.O;e=f;f=b;c=e.d;0===Object.keys(f).length?(c.d.e=c,f=e):(e=c,g=sp(d,f),e=e.g+"^"+g,g=d.g[e],g||("background-host"===c.sb?(c=d,f=(new ap(c.h,
c.f.d,f)).f(c.f),f.h(c.b,c.e),vm(f,c.d),g=f):g=tp(d,f,c),d.g[e]=g),f=g.d,f.d.e=f,f=g);return f}}throw Error("No enabled page masters");}function Hp(a,b){var c=a.k.e,d=c[b.b].d;if(d){var e=b.d,f=c[d].b;if(!f.length||e<f[0])return!1;var c=Qa(f.length,function(a){return f[a]>e})-1,c=f[c],d=a.k.b[d],g=Lp(a,d);return c<g?!1:g<c?!0:!Gp(a,d.d)}return!1}
function Op(a,b,c){var d=a.b.b[c];if(!d||!Gp(a,d.d))return L(!0);d.d="any";Pn(b);a.g[c]&&0<b.gb.length&&(b.Gd=!1);var e=K("layoutColumn"),f=[],g=[],h=!0;nf(function(c){for(;0<d.b.length-g.length;){for(var e=0;0<=g.indexOf(e);)e++;var m=d.b[e];if(m.b.d>a.l||Hp(a,m.b))break;for(var p=e+1;p<d.b.length;p++)if(!(0<=g.indexOf(p))){var r=d.b[p];if(r.b.d>a.l||Hp(a,r.b))break;ei(r.b,m.b)&&(m=r,e=p)}var t=m.b,q=!0;Sn(b,m.d,h).then(function(a){h=!1;m.b.ge&&(null===a||t.f)&&f.push(e);t.f?(g.push(e),O(c)):(a?
m.d=a:g.push(e),b.h&&(d.d=on(b.h)),a||b.h?O(c):q?q=!1:pf(c))});if(q){q=!1;return}}O(c)}).then(function(){d.b=d.b.filter(function(a,b){return 0<=f.indexOf(b)||0>g.indexOf(b)});N(e,!0)});return M(e)}
function Pp(a,b,c,d,e,f,g,h){am(c);var l=hm(c,a,"enabled");if(l&&l!==he)return L(!0);var k=K("layoutContainer"),m=hm(c,a,"wrap-flow")===td,p=c.b?c.g&&c.H:c.f&&c.I,l=hm(c,a,"flow-from"),r=a.viewport.b.createElement("div"),t=hm(c,a,"position");w(r,"position",t?t.name:"absolute");d.insertBefore(r,d.firstChild);var q=new Ai(r);q.b=c.b;c.rb(a,q,b,a.h,a.e);q.D=e;q.H=f;e+=q.left+q.marginLeft+q.S;f+=q.top+q.marginTop+q.ba;if(l&&l.Kd())if(a.I[l.toString()])c.sc(a,q,b,null,1,a.e,a.h),l=L(!0);else{var x=K("layoutContainer.inner"),
R=l.toString(),Q=Y(c,a,"column-count"),sa=Y(c,a,"column-gap"),Fa=1<Q?Y(c,a,"column-width"):q.width,l=gm(c,a),ia=0,t=hm(c,a,"shape-inside"),F=og(t,0,0,q.width,q.height,a),T=new Mm(R,a,a.viewport,a.d,l,a.Z,a.h,a.style.u,a,b,a.Sa,a.Za,h,a.Ya),zl=new mo(a.f,a.b.page-1),ai=0,ca=null;nf(function(b){for(;ai<Q;){var c=ai++;if(1<Q){var d=a.viewport.b.createElement("div");w(d,"position","absolute");r.appendChild(d);ca=new wn(d,T,a.e,zl);ca.b=q.b;ca.$a=q.$a;ca.kc=q.kc;q.b?(w(d,"margin-left",q.j+"px"),w(d,"margin-right",
q.w+"px"),c=c*(Fa+sa)+q.k,Hi(ca,0,q.width),Gi(ca,c,Fa)):(w(d,"margin-top",q.k+"px"),w(d,"margin-bottom",q.u+"px"),c=c*(Fa+sa)+q.j,Gi(ca,0,q.height),Hi(ca,c,Fa));ca.D=e+q.j;ca.H=f+q.k}else ca=new wn(r,T,a.e,zl),Fi(ca,q),q=ca;ca.I=p?[]:g;ca.xb=F;if(0<=ca.width){var k=K("inner");Op(a,ca,R).then(function(){ca.h&&"column"!=ca.h&&(ai=Q,"region"!=ca.h&&(a.I[R]=!0));N(k,!0)});c=M(k)}else c=L(!0);if(c.Ca()){c.then(function(){0<h.b.length?O(b):(ia=Math.max(ia,ca.e),pf(b))});return}0<h.b.length||(ia=Math.max(ia,
ca.e))}O(b)}).then(function(){q.e=ia;c.sc(a,q,b,ca,Q,a.e,a.h);N(x,!0)});l=M(x)}else{l=hm(c,a,"content");t=!1;if(l&&Ji(l)){var Bl=a.viewport.b.createElement("span");l.U(new Ii(Bl,a));r.appendChild(Bl);um(c,a,q,a.h)}else c.oa&&(d.removeChild(r),t=!0);t||c.sc(a,q,b,null,1,a.e,a.h);l=L(!0)}l.then(function(){if(!c.f||0<Math.floor(q.e)){if(!m){var l=q.D+q.left,p=q.H+q.top,t=Di(q)+q.width+Ei(q),x=Bi(q)+q.height+Ci(q),F=hm(c,a,"shape-outside"),l=og(F,l,p,t,x,a);$a(a.viewport.root)&&g.push(we(l,0,-1.25*nc(a,
"em",!1)));g.push(l)}}else if(0==c.children.length){d.removeChild(r);N(k,!0);return}var Q=c.children.length-1;mf(function(){for(;0<=Q;){var d=c.children[Q--],d=Pp(a,b,d,r,e,f,g,h);if(d.Ca())return d}return L(!1)}).then(function(){N(k,!0)})});return M(k)}
function Qp(a,b,c){a.I={};c?(a.b=c.clone(),wl(a.d,c.d)):(a.b=new yi,wl(a.d,-1));a.lang&&b.d.setAttribute("lang",a.lang);c=a.b;c.page++;mc(a,a.style.b);a.k=c.clone();var d=rp(a.O),e=Np(a,d);if(!e)return L(null);e.d.b.width.value===je&&Wh(b);e.d.b.height.value===ke&&Xh(b);a.f.g=b;vo(a.f,d,a);var f=Qo(Po(d),a);Rp(a,f,b);Xo(d,f,b,a);var g=f.kb+f.zb,d=hm(e,a,"writing-mode")||Gd,f=hm(e,a,"direction")||Pd,h=new Pi(b.B.bind(b),d,f),l=[],k=K("layoutNextPage");nf(function(d){Pp(a,b,e,b.d,g,g,l.concat(),h).then(function(){if(0<
h.b.length){l=l.concat(Ui(h));h.b.splice(0,h.b.length);c=a.b=a.k.clone();for(var e;e=b.d.lastChild;)b.d.removeChild(e);pf(d)}else O(d)})}).then(function(){e.S(a,b,a.e);var d=new Qc(e.d.d,"left-page");b.j=d.evaluate(a)?"left":"right";var d=a.b.page,f;for(f in a.b.b)for(var g=a.b.b[f],h=g.b.length-1;0<=h;h--){var l=g.b[h];0<=l.b.g&&l.b.g+l.b.k-1<=d&&g.b.splice(h,1)}a.b=a.k=null;c.d=a.d.b;Zh(b,a.style.h.D[a.Z.url]);var x;a:{for(x in a.g)if((f=c.b[x])&&0<f.b.length){x=!1;break a}x=!0}x&&(c=null);N(k,
c)});return M(k)}function Rp(a,b,c){a.H=b.pb;a.D=b.ob;c.N.style.width=b.pb+2*b.Qc+"px";c.N.style.height=b.ob+2*b.Qc+"px";c.d.style.left=b.kb+"px";c.d.style.right=b.kb+"px";c.d.style.top=b.kb+"px";c.d.style.bottom=b.kb+"px";c.d.style.padding=b.zb+"px"}function Sp(a,b,c,d){Pk.call(this,a.g,a,b,c,d,a.f,!c);this.e=a;this.u=!1}u(Sp,Pk);n=Sp.prototype;n.Cc=function(){};n.Bc=function(a,b,c){a=new Ql(this.e.j,a,b,c,this.e.w,this.M,Bf(this.$));Df(this.e,new Bm(a.d,this.e,a,this.k))};
n.Cb=function(a){a=a.d;null!=this.M&&(a=Wc(this.d,this.M,a));Df(this.e,new Sp(this.e,a,this,this.w))};n.yc=function(){Df(this.e,new Vk(this.d,this.$))};n.Ac=function(){var a={};this.e.k.push({Bb:a,M:this.M});Df(this.e,new Wk(this.d,this.$,null,a,this.e.f))};n.zc=function(a){var b=this.e.h[a];b||(b={},this.e.h[a]=b);Df(this.e,new Wk(this.d,this.$,null,b,this.e.f))};n.Ec=function(){var a={};this.e.B.push(a);Df(this.e,new Wk(this.d,this.$,this.M,a,this.e.f))};
n.cc=function(a){var b=this.e.l;if(a){var c=nj(b,"_pseudos"),b=c[a];b||(b={},c[a]=b)}Df(this.e,new Wk(this.d,this.$,null,b,this.e.f))};n.Dc=function(){this.u=!0;this.eb()};n.Mb=function(){var a=new Bp(this.e.j,this.e,this,this.k,this.e.u);Df(this.e,a);a.Mb()};n.ra=function(){Pk.prototype.ra.call(this);if(this.u){this.u=!1;var a="R"+this.e.H++,b=H(a),c;this.M?c=new ij(b,0,this.M):c=new V(b,0);oj(this.h,"region-id").push(c);this.mb();a=new Sp(this.e,this.M,this,a);Df(this.e,a);a.ra()}};
function Tp(a){var b=a.getAttribute("content");if(!b)return"";a={};for(var c;null!=(c=b.match(/^,?\s*([-A-Za-z_.][-A-Za-z_0-9.]*)\s*=\s*([-+A-Za-z_0-9.]*)\s*/));)b=b.substr(c[0].length),a[c[1]]=c[2];b=a.width-0;a=a.height-0;return b&&a?"@-epubx-viewport{width:"+b+"px;height:"+a+"px;}":""}function Up(a){Cf.call(this);this.f=a;this.g=new ec(null);this.j=new ec(this.g);this.w=new Nl(this.g);this.D=new Sp(this,null,null,null);this.H=0;this.k=[];this.l={};this.h={};this.B=[];this.u={};this.b=this.D}
u(Up,Cf);Up.prototype.error=function(a){v.b("CSS parser:",a)};function Vp(a,b){return Wp(b,a)}function Xp(a){tf.call(this,Vp,"document");this.H=a;this.B={};this.h={};this.b={};this.D={};this.f=null;this.j=[]}u(Xp,tf);function Yp(a){var b=va("user-agent.xml",ua),c=K("OPSDocStore.init");uf(fh).then(function(d){a.f=d;uf(Ep).then(function(){a.load(b).then(function(){N(c,!0)})})});return M(c)}function Zp(a,b){a.j.push({url:b.url,text:b.text,ab:"User",Ba:null,media:null})}
function Wp(a,b){var c=K("OPSDocStore.load"),d=b.url;Fh(b,a).then(function(b){if(b){for(var f=[],g=b.b.getElementsByTagNameNS("http://www.idpf.org/2007/ops","trigger"),h=0;h<g.length;h++){var l=g[h],k=l.getAttributeNS("http://www.w3.org/2001/xml-events","observer"),m=l.getAttributeNS("http://www.w3.org/2001/xml-events","event"),p=l.getAttribute("action"),l=l.getAttribute("ref");k&&m&&p&&l&&f.push({de:k,event:m,action:p,ac:l})}a.D[d]=f;var r=[],f=va("user-agent-page.css",ua);r.push({url:f,text:null,
ab:"UA",Ba:null,media:null});for(h=0;h<a.j.length;h++)r.push(a.j[h]);if(f=b.h)for(f=f.firstChild;f;f=f.nextSibling)if(1==f.nodeType)if(g=f,h=g.namespaceURI,k=g.localName,"http://www.w3.org/1999/xhtml"==h)if("style"==k)r.push({url:d,text:g.textContent,ab:"Author",Ba:null,media:null});else if("link"==k){if(m=g.getAttribute("rel"),h=g.getAttribute("class"),k=g.getAttribute("media"),"stylesheet"==m||"alternate stylesheet"==m&&h)g=g.getAttribute("href"),g=va(g,d),r.push({url:g,text:null,Ba:h,media:k,ab:"Author"})}else"meta"==
k&&"viewport"==g.getAttribute("name")&&r.push({url:d,text:Tp(g),ab:"Author",M:null,media:null});else"http://www.gribuser.ru/xml/fictionbook/2.0"==h?"stylesheet"==k&&"text/css"==g.getAttribute("type")&&r.push({url:d,text:g.textContent,ab:"Author",Ba:null,media:null}):"http://example.com/sse"==h&&"property"===k&&(h=g.getElementsByTagName("name")[0])&&"stylesheet"===h.textContent&&(g=g.getElementsByTagName("value")[0])&&(g=va(g.textContent,d),r.push({url:g,text:null,Ba:null,media:null,ab:"Author"}));
for(var t="",h=0;h<r.length;h++)t+=r[h].url,t+="^",r[h].text&&(t+=r[h].text),t+="^";var q=a.B[t];q?(a.b[d]=q,N(c,b)):(f=a.h[t],f||(f=new wf(function(){var b=K("fetchStylesheet"),c=0,d=new Up(a.f);mf(function(){if(c<r.length){var a=r[c++];d.Nb(a.ab);return null!==a.text?gg(a.text,d,a.url,a.Ba,a.media).jd(!0):fg(a.url,d,a.Ba,a.media)}return L(!1)}).then(function(){q=new Fp(a,d.g,d.j,d.D.g,d.w,d.k,d.l,d.h,d.B,d.u);a.B[t]=q;delete a.h[t];N(b,q)});return M(b)},"FetchStylesheet "+d),a.h[t]=f,f.start()),
uf(f).then(function(f){a.b[d]=f;N(c,b)}))}else N(c,null)});return M(c)};function $p(a,b,c,d,e,f,g,h,l,k){this.b=a;this.url=b;this.lang=c;this.d=d;this.h=e;this.T=Xb(f);this.j=g;this.g=h;this.f=l;this.e=k;this.Ja=this.page=null}function aq(a,b,c){if(0!=c--)for(b=b.firstChild;b;b=b.nextSibling)if(1==b.nodeType){var d=b;"auto"!=Ha(d,"height","auto")&&(w(d,"height","auto"),aq(a,d,c));"absolute"==Ha(d,"position","static")&&(w(d,"position","relative"),aq(a,d,c))}}
function bq(a){var b=a.target,c="\u25b8"==b.textContent;b.textContent=c?"\u25be":"\u25b8";for(b=b.parentNode.firstChild;b;)if(1!=b.nodeType)b=b.nextSibling;else{var d=b;"toc-container"==d.getAttribute("data-adapt-class")?b=d.firstChild:("toc-node"==d.getAttribute("data-adapt-class")&&(d.style.height=c?"auto":"0px"),b=b.nextSibling)}a.stopPropagation()}
$p.prototype.Zc=function(a){var b=this.j.Zc(a);return function(a,d,e){var f=e.behavior;if(!f||"toc-node"!=f.toString()&&"toc-container"!=f.toString())return b(a,d,e);a=d.getAttribute("data-adapt-class");"toc-node"==a&&(e=d.firstChild,"\u25b8"!=e.textContent&&(e.textContent="\u25b8",w(e,"cursor","pointer"),e.addEventListener("click",bq,!1)));var g=d.ownerDocument.createElement("div");g.setAttribute("data-adapt-process-children","true");"toc-node"==f.toString()?(e=d.ownerDocument.createElement("div"),
e.textContent="\u25b9",w(e,"margin-left","-1em"),w(e,"display","inline-block"),w(e,"width","1em"),w(e,"text-align","left"),w(e,"cursor","default"),w(e,"font-family","Menlo,sans-serif"),g.appendChild(e),w(g,"overflow","hidden"),g.setAttribute("data-adapt-class","toc-node"),"toc-node"!=a&&"toc-container"!=a||w(g,"height","0px")):"toc-node"==a&&g.setAttribute("data-adapt-class","toc-container");return L(g)}};
$p.prototype.xc=function(a,b,c,d,e){if(this.page)return L(this.page);var f=this,g=K("showTOC"),h=new Vh(a,a);this.page=h;this.b.load(this.url).then(function(d){var k=f.b.b[d.url],m=Ip(k,c,1E5,e);b=new mn(b.f,m.fontSize,b.root,m.width,m.height);var p=new Jp(k,d,f.lang,b,f.d,f.h,f.Zc(d),f.g,0,f.f,f.e);f.Ja=p;p.T=f.T;Kp(p).then(function(){Qp(p,h,null).then(function(){aq(f,a,2);N(g,h)})})});return M(g)};
$p.prototype.tc=function(){if(this.page){var a=this.page;this.Ja=this.page=null;w(a.N,"visibility","none");var b=a.N.parentNode;b&&b.removeChild(a.N)}};$p.prototype.yd=function(){return!!this.page};function cq(){Xp.call(this,dq(this));this.d=new tf(Fh,"document");this.u=new tf(xf,"text");this.w={};this.O={};this.k={};this.l={}}u(cq,Xp);function dq(a){return function(b){return a.k[b]}}
function eq(a,b,c){var d=K("loadEPUBDoc");"/"!==b.substring(b.length-1)&&(b+="/");c&&a.u.qc(b+"?r=list");a.d.qc(b+"META-INF/encryption.xml");var e=b+"META-INF/container.xml";a.d.load(e,!0,"Failed to fetch EPUB container.xml from "+e).then(function(f){if(f){f=Ph(uh(uh(uh(new vh([f.b]),"container"),"rootfiles"),"rootfile"),"full-path");for(var g=0;g<f.length;g++){var h=f[g];if(h){fq(a,b,h,c).ua(d);return}}N(d,null)}else v.error("Received an empty response for EPUB container.xml "+e+". This may be caused by the server not allowing cross origin requests.")});
return M(d)}function fq(a,b,c,d){var e=b+c,f=a.w[e];if(f)return L(f);var g=K("loadOPF");a.d.load(e,void 0,void 0).then(function(c){c?a.d.load(b+"META-INF/encryption.xml",void 0,void 0).then(function(l){(d?a.u.load(b+"?r=list"):L(null)).then(function(d){f=new gq(a,b);hq(f,c,l,d,b+"?r=manifest").then(function(){a.w[e]=f;a.O[b]=f;N(g,f)})})}):v.error("Received an empty response for EPUB OPF "+e+". This may be caused by the server not allowing cross origin requests.")});return M(g)}
function iq(a,b,c){var d=K("EPUBDocStore.load");b=ta(b);(a.l[b]=Wp(a,{status:200,url:b,contentType:c.contentType,responseText:null,responseXML:c,wc:null})).ua(d);return M(d)}
cq.prototype.load=function(a){var b=ta(a);if(a=this.l[b])return a.Ca()?a:L(a.mc());var c=K("EPUBDocStore.load");a=cq.Pd.load.call(this,b,!0,"Failed to fetch a source document from "+b);a.then(function(a){a?N(c,a):v.error("Received an empty response for "+b+". This may be caused by the server not allowing cross origin requests.")});return M(c)};function jq(){this.id=null;this.src="";this.f=this.d=null;this.F=-1;this.h=0;this.j=null;this.b=this.e=0;this.g=Ta}function kq(a){return a.id}
function lq(a){var b=Pe(a);return function(a){var d=K("deobfuscator"),e,f;a.slice?(e=a.slice(0,1040),f=a.slice(1040,a.size)):(e=a.webkitSlice(0,1040),f=a.webkitSlice(1040,a.size-1040));sf(e).then(function(a){a=new DataView(a);for(var c=0;c<a.byteLength;c++){var e=a.getUint8(c),e=e^b[c%20];a.setUint8(c,e)}N(d,rf([a,f]))});return M(d)}}
var mq={dcterms:"http://purl.org/dc/terms/",marc:"http://id.loc.gov/vocabulary/",media:"http://www.idpf.org/epub/vocab/overlays/#",onix:"http://www.editeur.org/ONIX/book/codelists/current.html#",xsd:"http://www.w3.org/2001/XMLSchema#"},nq=mq.dcterms+"language",oq=mq.dcterms+"title";
function pq(a,b){var c={};return function(d,e){var f,g,h=d.r||c,l=e.r||c;if(a==oq&&(f="main"==h["http://idpf.org/epub/vocab/package/#title-type"],g="main"==l["http://idpf.org/epub/vocab/package/#title-type"],f!=g))return f?-1:1;f=parseInt(h["http://idpf.org/epub/vocab/package/#display-seq"],10);isNaN(f)&&(f=Number.MAX_VALUE);g=parseInt(l["http://idpf.org/epub/vocab/package/#display-seq"],10);isNaN(g)&&(g=Number.MAX_VALUE);return f!=g?f-g:a!=nq&&b&&(f=(h[nq]||h["http://idpf.org/epub/vocab/package/#alternate-script"])==
b,g=(l[nq]||l["http://idpf.org/epub/vocab/package/#alternate-script"])==b,f!=g)?f?-1:1:d.o-e.o}}
function qq(a,b){function c(a){for(var b in a){var d=a[b];d.sort(pq(b,k));for(var e=0;e<d.length;e++){var f=d[e].r;f&&c(f)}}}function d(a){return Wa(a,function(a){return Va(a,function(a){var b={v:a.value,o:a.Q};a.Ge&&(b.s=a.scheme);if(a.id||a.lang){var c=l[a.id];if(c||a.lang)a.lang&&(a={name:nq,value:a.lang,lang:null,id:null,fd:a.id,scheme:null,Q:a.Q},c?c.push(a):c=[a]),c=Ua(c,function(a){return a.name}),b.r=d(c)}return b})})}function e(a){if(a&&(a=a.match(/^\s*(([^:]*):)?(\S+)\s*$/))){var b=a[1]?
f[a[1]]:"http://idpf.org/epub/vocab/package/#";if(b)return b+a[3]}return null}var f;if(b){f={};for(var g in mq)f[g]=mq[g];for(;null!=(g=b.match(/(^\s*[A-Z_a-z\u007F-\uFFFF][-.A-Z_a-z0-9\u007F-\uFFFF]*):\s*(\S+)/));)b=b.substr(g[0].length),f[g[1]]=g[2]}else f=mq;var h=1;g=Nh(Oh(a),function(a){if("meta"==a.localName){var b=e(a.getAttribute("property"));if(b)return{name:b,value:a.textContent,id:a.getAttribute("id"),Q:h++,fd:a.getAttribute("refines"),lang:null,scheme:e(a.getAttribute("scheme"))}}else if("http://purl.org/dc/elements/1.1/"==
a.namespaceURI)return{name:mq.dcterms+a.localName,Q:h++,lang:a.getAttribute("xml:lang"),value:a.textContent,id:a.getAttribute("id"),fd:null,scheme:null};return null});var l=Ua(g,function(a){return a.fd});g=d(Ua(g,function(a){return a.fd?null:a.name}));var k=null;g[nq]&&(k=g[nq][0].v);c(g);return g}function rq(){var a=window.MathJax;return a?a.Hub:null}var sq={"appliaction/xhtml+xml":!0,"image/jpeg":!0,"image/png":!0,"image/svg+xml":!0,"image/gif":!0,"audio/mp3":!0};
function gq(a,b){this.f=a;this.h=this.d=this.b=this.g=this.e=null;this.l=b;this.k=null;this.I={};this.lang=null;this.w=0;this.u={};this.O=this.H=this.S=null;this.B={};this.D=null;this.j=tq(this);rq()&&(Zi["http://www.w3.org/1998/Math/MathML"]=!0)}
function tq(a){function b(){}b.prototype.kd=function(a,b){return encodeURIComponent(b+(a?"#"+a:""))};b.prototype.b=function(b,d){var e=b.match(/^([^#]*)#?(.*)$/);if(e){var f=e[1]||d,e=e[2];if(f&&a.g.some(function(a){return a.src===f}))return"#"+this.kd(e,f)}return b};b.prototype.he=function(a){"#"===a.charAt(0)&&(a=a.substring(1));return(a=decodeURIComponent(a).match(/^([^#]*)#?(.*)$/))?[a[1],a[2]]:[]};return new b}
function uq(a,b){return a.l?b.substr(0,a.l.length)==a.l?decodeURI(b.substr(a.l.length)):null:b}
function hq(a,b,c,d,e){a.e=b;var f=uh(new vh([b.b]),"package"),g=Ph(f,"unique-identifier")[0];g&&(g=Bh(b,b.url+"#"+g))&&(a.k=g.textContent.replace(/[ \n\r\t]/g,""));var h={};a.g=Va(Lh(uh(uh(f,"manifest"),"item")),function(c){var d=new jq,e=b.url;d.id=c.getAttribute("id");d.src=va(c.getAttribute("href"),e);d.d=c.getAttribute("media-type");if(e=c.getAttribute("properties")){for(var e=e.split(/\s+/),f={},g=0;g<e.length;g++)f[e[g]]=!0;d.g=f}(c=c.getAttribute("fallback"))&&!sq[d.d]&&(h[d.src]=c);!a.H&&
d.g.nav&&(a.H=d);!a.O&&d.g["cover-image"]&&(a.O=d);return d});a.d=Sa(a.g,kq);a.h=Sa(a.g,function(b){return uq(a,b.src)});for(var l in h)for(g=l;;){g=a.d[h[g]];if(!g)break;if(sq[g.d]){a.B[l]=g.src;break}g=g.src}a.b=Va(Lh(uh(uh(f,"spine"),"itemref")),function(b,c){var d=b.getAttribute("idref");if(d=a.d[d])d.f=b,d.F=c;return d});if(l=Ph(uh(f,"spine"),"toc")[0])a.S=a.d[l];if(l=Ph(uh(f,"spine"),"page-progression-direction")[0]){a:switch(l){case "ltr":l="ltr";break a;case "rtl":l="rtl";break a;default:throw Error("unknown PageProgression: "+
l);}a.D=l}var g=c?Ph(uh(uh(Kh(uh(uh(new vh([c.b]),"encryption"),"EncryptedData"),Jh()),"CipherData"),"CipherReference"),"URI"):[],k=Lh(uh(uh(f,"bindings"),"mediaType"));for(c=0;c<k.length;c++){var m=k[c].getAttribute("handler");(l=k[c].getAttribute("media-type"))&&m&&a.d[m]&&(a.I[l]=a.d[m].src)}a.u=qq(uh(f,"metadata"),Ph(f,"prefix")[0]);a.u[nq]&&(a.lang=a.u[nq][0].v);if(!d){if(0<g.length&&a.k)for(d=lq(a.k),c=0;c<g.length;c++)a.f.k[a.l+g[c]]=d;return L(!0)}f=new Ia;k={};if(0<g.length&&a.k)for(l="1040:"+
Qe(a.k),c=0;c<g.length;c++)k[g[c]]=l;for(c=0;c<d.length;c++){var p=d[c];if(m=p.n){var r=decodeURI(m),g=a.h[r];l=null;g&&(g.j=0!=p.m,g.h=p.c,g.d&&(l=g.d.replace(/\s+/g,"")));g=k[r];if(l||g)f.append(m),f.append(" "),f.append(l||"application/octet-stream"),g&&(f.append(" "),f.append(g)),f.append("\n")}}vq(a);return qf(e,"","POST",f.toString(),"text/plain")}function vq(a){for(var b=0,c=0;c<a.b.length;c++){var d=a.b[c],e=Math.ceil(d.h/1024);d.e=b;d.b=e;b+=e}a.w=b}
function wq(a,b,c){a.d={};a.h={};a.g=[];a.b=a.g;var d=a.e=new th(null,"",(new DOMParser).parseFromString("<spine></spine>","text/xml"));b.forEach(function(a,b){var c=new jq;c.F=b;c.id="item"+(b+1);c.src=a;var h=d.b.createElement("itemref");h.setAttribute("idref",c.id);d.root.appendChild(h);c.f=h;this.d[c.id]=c;this.h[a]=c;this.g.push(c)},a);return c?iq(a.f,b[0],c):L(null)}
function xq(a,b,c){var d=a.b[b],e=K("getCFI");a.f.load(d.src).then(function(a){var b=zh(a,c),h=null;b&&(a=xh(a,b,0,!1),h=new jb,mb(h,b,c-a),d.f&&mb(h,d.f,0),h=h.toString());N(e,h)});return M(e)}
function yq(a,b){return We("resolveFragment",function(c){if(b){var d=new jb;kb(d,b);var e;if(a.e){var f=lb(d,a.e.b);if(1!=f.fa.nodeType||f.J||!f.ac){N(c,null);return}var g=f.fa,h=g.getAttribute("idref");if("itemref"!=g.localName||!h||!a.d[h]){N(c,null);return}e=a.d[h];d=f.ac}else e=a.b[0];a.f.load(e.src).then(function(a){var b=lb(d,a.b);a=xh(a,b.fa,b.offset,b.J);N(c,{F:e.F,na:a,G:-1})})}else N(c,null)},function(a,d){v.b(d,"Cannot resolve fragment:",b);N(a,null)})}
function zq(a,b){return We("resolveEPage",function(c){if(0>=b)N(c,{F:0,na:0,G:-1});else{var d=Qa(a.b.length,function(c){c=a.b[c];return c.e+c.b>b}),e=a.b[d];a.f.load(e.src).then(function(a){b-=e.e;b>e.b&&(b=e.b);var g=0;0<b&&(a=yh(a),g=Math.round(a*b/e.b),g==a&&g--);N(c,{F:d,na:g,G:-1})})}},function(a,d){v.b(d,"Cannot resolve epage:",b);N(a,null)})}
function Aq(a,b){var c=a.b[b.F];if(0>=b.na)return L(c.e);var d=K("getEPage");a.f.load(c.src).then(function(a){a=yh(a);var f=Math.min(a,b.na);N(d,c.e+f*c.b/a)});return M(d)}function Bq(a,b,c,d,e){this.b=a;this.viewport=b;this.g=c;this.h=e;this.Lb=[];this.na=this.G=this.F=0;this.T=Xb(d);this.f=new jn(b.f);this.d=new uo(a.j)}function Cq(a){var b=a.Lb[a.F];return b?b.qb[a.G]:null}n=Bq.prototype;n.nb=function(){if(this.b.D)return this.b.D;var a=this.Lb[this.F];return a?a.Ja.ba:null};
function Dq(a,b,c,d){c.N.style.display="none";c.N.style.visibility="visible";c.N.style.position="";c.N.style.top="";c.N.style.left="";c.N.setAttribute("data-vivliostyle-page-side",c.j);var e=b.qb[d];e?(b.Ja.viewport.d.replaceChild(c.N,e.N),Ya(e,{type:"replaced",target:null,currentTarget:null,be:c})):b.Ja.viewport.d.appendChild(c.N);a.h(b.Ja.oa,b.item.F,d);c.l=0==b.item.F&&0==d;b.qb[d]=c}
function Eq(a,b,c){var d=K("renderSinglePage"),e=Fq(a,b,c);Qp(b.Ja,e,c).then(function(f){var g=(c=f)?c.page-1:b.Ka.length-1;Dq(a,b,e,g);xo(a.d,a.F,g);var h=a.F,l=a.G,k=a.na;f=null;if(c){var m=b.Ka[c.page];b.Ka[c.page]=c;m&&b.qb[c.page]&&!zi(c,m)&&(a.G=c.page,f=Eq(a,b,c))}f||(f=L(!0));f.then(function(){var b=yo(a.d,e),f=0;nf(function(c){f++;if(f>b.length)O(c);else{var d=b[f-1];d.vc=d.vc.filter(function(a){return!a.bc});0===d.vc.length?pf(c):(a.F=d.F,a.G=d.G,Gq(a).then(function(b){b?(wo(a.d,d.bd),zo(a.d,
d.vc),Eq(a,b,b.Ka[a.G]).then(function(){var b=a.d;b.b=b.u.pop();b=a.d;b.d=b.B.pop();pf(c)})):pf(c)}))}}).then(function(){a.F=h;a.G=l;a.na=k;N(d,{page:e,position:c,G:g})})})});return M(d)}
function Hq(a){var b=K("renderPage");Gq(a).then(function(c){if(c){var d=-1;if(0>a.G){var d=a.na,e=Qa(c.Ka.length,function(a){return Mp(c.Ja,c.Ka[a])>d});a.G=e==c.Ka.length?Number.POSITIVE_INFINITY:e-1}var f=c.qb[a.G];f?(a.na=f.offset,N(b,f)):nf(function(b){if(a.G<c.Ka.length)O(b);else if(c.complete)a.G=c.Ka.length-1,O(b);else{var e=c.Ka[c.Ka.length-1];Eq(a,c,e).then(function(l){var k=l.page;e=l.position;l=l.G;e?0<=d&&Mp(c.Ja,e)>d?(f=k,a.G=c.Ka.length-2,O(b)):pf(b):(f=k,a.G=l,0>d&&(a.na=k.offset),
c.complete=!0,k.k=c.item.F==a.b.b.length-1,O(b))})}}).then(function(){f=f||c.qb[a.G];var e=c.Ka[a.G];0>d&&(a.na=Mp(c.Ja,e));f?N(b,f):Eq(a,c,e).then(function(d){var f=d.page;e=d.position;e||(c.complete=!0,f.k=c.item.F==a.b.b.length-1);N(b,f)})})}else N(b,null)});return M(b)}n.gd=function(){return Iq(this,this.b.b.length-1,Number.POSITIVE_INFINITY)};
function Iq(a,b,c){var d=K("renderAllPages"),e=a.F,f=a.G;a.F=0;nf(function(d){a.G=a.F==b?c:Number.POSITIVE_INFINITY;Hq(a).then(function(){++a.F>b?O(d):pf(d)})}).then(function(){a.F=e;a.G=f;Hq(a).ua(d)});return M(d)}n.Wd=function(){this.G=this.F=0;return Hq(this)};n.Xd=function(){this.F=this.b.b.length-1;this.G=Number.POSITIVE_INFINITY;return Hq(this)};
n.nextPage=function(){var a=this,b=K("nextPage");Gq(a).then(function(c){if(c){if(c.complete&&a.G==c.Ka.length-1){if(a.F>=a.b.b.length-1){N(b,null);return}a.F++;a.G=0}else a.G++;Hq(a).ua(b)}else N(b,null)});return M(b)};n.ed=function(){if(0==this.G){if(0==this.F)return L(null);this.F--;this.G=Number.POSITIVE_INFINITY}else this.G--;return Hq(this)};function Jq(a,b){var c="left"===b.j,d="ltr"===a.nb();return!c&&d||c&&!d}
function Kq(a){var b=K("getCurrentSpread"),c=Cq(a);if(!c)return L({left:null,right:null});var d=a.F,e=a.G,f="left"===c.j;(Jq(a,c)?a.ed():a.nextPage()).then(function(g){a.F=d;a.G=e;Hq(a).then(function(){f?N(b,{left:c,right:g}):N(b,{left:g,right:c})})});return M(b)}n.ce=function(){var a=Cq(this);if(!a)return L(null);var a=Jq(this,a),b=this.nextPage();if(a)return b;var c=this;return b.Fc(function(){return c.nextPage()})};
n.fe=function(){var a=Cq(this);if(!a)return L(null);var a=Jq(this,a),b=this.ed();if(a){var c=this;return b.Fc(function(){return c.ed()})}return b};function Lq(a,b){var c=K("navigateToEPage");zq(a.b,b).then(function(b){b&&(a.F=b.F,a.G=b.G,a.na=b.na);Hq(a).ua(c)});return M(c)}function Mq(a,b){var c=K("navigateToCFI");yq(a.b,b).then(function(b){b&&(a.F=b.F,a.G=b.G,a.na=b.na);Hq(a).ua(c)});return M(c)}
function Nq(a,b){v.debug("Navigate to",b);var c=uq(a.b,ta(b));if(!c){if(a.b.e&&b.match(/^#epubcfi\(/))c=uq(a.b,a.b.e.url);else if("#"===b.charAt(0)){var d=a.b.j.he(b);a.b.e?c=uq(a.b,d[0]):c=d[0];b=c+(d[1]?"#"+d[1]:"")}if(null==c)return L(null)}d=a.b.h[c];if(!d)return a.b.e&&c==uq(a.b,a.b.e.url)&&(c=b.indexOf("#"),0<=c)?Mq(a,b.substr(c+1)):L(null);d.F!=a.F&&(a.F=d.F,a.G=0);var e=K("navigateTo");Gq(a).then(function(c){var d=Bh(c.Z,b);d&&(a.na=wh(c.Z,d),a.G=-1);Hq(a).ua(e)});return M(e)}
function Fq(a,b,c){var d=b.Ja.viewport,e=d.b.createElement("div");e.setAttribute("data-vivliostyle-page-container",!0);e.style.position="absolute";e.style.top="0";e.style.left="0";ka||(e.style.visibility="hidden");d.root.appendChild(e);var f=d.b.createElement("div");f.setAttribute("data-vivliostyle-bleed-box",!0);e.appendChild(f);var g=new Vh(e,f);g.F=b.item.F;g.position=c;g.offset=Mp(b.Ja,c);0===g.offset&&(b=a.b.j.kd("",b.item.src),f.setAttribute("id",b),Yh(g,f,b));d!==a.viewport&&(a=$b(a.viewport.width,
a.viewport.height,d.width,d.height),a=hg(null,new Tb(a,null)),g.h.push(new Sh(e,"transform",a)));return g}function Oq(a,b){var c=rq();if(c){var d=b.ownerDocument,e=d.createElement("span");b.appendChild(e);d=d.importNode(a,!0);e.appendChild(d);d=c.queue;d.Push(["Typeset",c,e]);var c=K("navigateToEPage"),f=ff(c);d.Push(function(){f.Va(e)});return M(c)}return L(null)}
n.Zc=function(a){var b=this;return function(c,d){var e;if("object"==c.localName&&"http://www.w3.org/1999/xhtml"==c.namespaceURI){var f=c.getAttribute("data");e=null;if(f){var f=va(f,a.url),g=c.getAttribute("media-type");if(!g){var h=uq(b.b,f);h&&(h=b.b.h[h])&&(g=h.d)}if(g&&(h=b.b.I[g])){e=b.viewport.b.createElement("iframe");e.style.border="none";var f=Ma(f),l=Ma(g),g=new Ia;g.append(h);g.append("?src=");g.append(f);g.append("&type=");g.append(l);for(h=c.firstChild;h;h=h.nextSibling)1==h.nodeType&&
(l=h,"param"==l.localName&&"http://www.w3.org/1999/xhtml"==l.namespaceURI&&(f=l.getAttribute("name"),l=l.getAttribute("value"),f&&l&&(g.append("&"),g.append(encodeURIComponent(f)),g.append("="),g.append(encodeURIComponent(l)))));e.setAttribute("src",g.toString());(g=c.getAttribute("width"))&&e.setAttribute("width",g);(g=c.getAttribute("height"))&&e.setAttribute("height",g)}}e||(e=b.viewport.b.createElement("span"),e.setAttribute("data-adapt-process-children","true"));e=L(e)}else if("http://www.w3.org/1998/Math/MathML"==
c.namespaceURI)e=Oq(c,d);else if("http://example.com/sse"==c.namespaceURI){e=d?d.ownerDocument:b.viewport.b;g=c.localName;switch(g){case "t":case "tab":case "ec":case "nt":case "fraction":case "comment":case "mark":g="span";break;case "ruby":case "rp":case "rt":break;default:g="div"}e=e.createElement(g);e.setAttribute("data-adapt-process-children","true");e=L(e)}else e=c.dataset&&"true"==c.dataset.mathTypeset?Oq(c,d):L(null);return e}};
function Gq(a){if(a.F>=a.b.b.length)return L(null);var b=a.Lb[a.F];if(b)return L(b);var c=a.b.b[a.F],d=a.b.f,e=K("getPageViewItem");d.load(c.src).then(function(f){0==c.b&&1==a.b.b.length&&(c.b=Math.ceil(yh(f)/2700),a.b.w=c.b);var g=d.b[f.url],h=a.Zc(f),l=a.viewport,k=Ip(g,l.width,l.height,l.fontSize);if(k.width!=l.width||k.height!=l.height||k.fontSize!=l.fontSize)l=new mn(l.f,k.fontSize,l.root,k.width,k.height);var k=a.Lb[a.F-1],m=new Jp(g,f,a.b.lang,l,a.f,a.g,h,a.b.B,k?k.Ja.ma+k.qb.length:0,a.b.j,
a.d);m.T=a.T;Kp(m).then(function(){b={item:c,Z:f,Ja:m,Ka:[null],qb:[],complete:!1};a.Lb[a.F]=b;N(e,b)})});return M(e)}function Pq(a){return{F:a.F,G:a.G,na:a.na}}function Qq(a,b){b?(a.F=b.F,a.G=-1,a.na=b.na):(a.F=0,a.G=0,a.na=0);return Iq(a,a.F,a.G)}
n.xc=function(){var a=this.b,b=a.H||a.S;if(!b)return L(null);var c=K("showTOC");this.e||(this.e=new $p(a.f,b.src,a.lang,this.f,this.g,this.T,this,a.B,a.j,this.d));var a=this.viewport,b=Math.min(350,Math.round(.67*a.width)-16),d=a.height-6,e=a.b.createElement("div");a.root.appendChild(e);e.style.position="absolute";e.style.visibility="hidden";e.style.left="3px";e.style.top="3px";e.style.width=b+10+"px";e.style.maxHeight=d+"px";e.style.overflow="scroll";e.style.overflowX="hidden";e.style.background=
"#EEE";e.style.border="1px outset #999";e.style.borderRadius="2px";e.style.boxShadow=" 5px 5px rgba(128,128,128,0.3)";this.e.xc(e,a,b,d,this.viewport.fontSize).then(function(a){e.style.visibility="visible";N(c,a)});return M(c)};n.tc=function(){this.e&&this.e.tc()};n.yd=function(){return this.e&&this.e.yd()};function Rq(a,b,c,d){var e=this;this.h=a;this.ib=b;b.setAttribute("data-vivliostyle-viewer-viewport",!0);b.setAttribute("data-vivliostyle-viewer-status","loading");this.za=c;this.oa=d;a=a.document;this.ka=new oh(a.head,b);this.H=[];this.g=null;this.D=this.d=!1;this.f=this.j=this.e=this.l=null;this.fontSize=16;this.zoom=1;this.S=!1;this.gd=!0;this.T=Wb();this.B=function(){};this.k=function(){};this.O=function(){e.d=!0;e.B()};this.cd=this.cd.bind(this);this.u=function(){};this.w=a.getElementById("vivliostyle-page-rules");
this.I=!1;this.ba={loadEPUB:this.Sd,loadXML:this.Td,configure:this.rd,moveTo:this.ma,toc:this.xc};Sq(this)}function Sq(a){ra(1,function(a){Tq(this,{t:"debug",content:a})}.bind(a));ra(2,function(a){Tq(this,{t:"info",content:a})}.bind(a));ra(3,function(a){Tq(this,{t:"warn",content:a})}.bind(a));ra(4,function(a){Tq(this,{t:"error",content:a})}.bind(a))}function Tq(a,b){b.i=a.za;a.oa(b)}n=Rq.prototype;
n.Sd=function(a){Go.b("loadEPUB");Go.b("loadFirstPage");this.ib.setAttribute("data-vivliostyle-viewer-status","loading");var b=a.url,c=a.fragment,d=!!a.zipmeta,e=a.userStyleSheet;this.viewport=null;var f=K("loadEPUB"),g=this;g.rd(a).then(function(){var a=new cq;if(e)for(var l=0;l<e.length;l++)Zp(a,e[l]);Yp(a).then(function(){var e=va(b,g.h.location.href);g.H=[e];eq(a,e,d).then(function(a){g.g=a;yq(g.g,c).then(function(a){g.f=a;Uq(g).then(function(){g.ib.setAttribute("data-vivliostyle-viewer-status",
"complete");Go.d("loadEPUB");Tq(g,{t:"loaded",metadata:g.g.u});N(f,!0)})})})})});return M(f)};
n.Td=function(a){Go.b("loadXML");Go.b("loadFirstPage");this.ib.setAttribute("data-vivliostyle-viewer-status","loading");var b;"string"===typeof a.url?b=[a.url]:b=a.url;var c=a.document,d=a.fragment,e=a.userStyleSheet;this.viewport=null;var f=K("loadXML"),g=this;g.rd(a).then(function(){var a=new cq;if(e)for(var l=0;l<e.length;l++)Zp(a,e[l]);Yp(a).then(function(){var e=b.map(function(a){return va(a,g.h.location.href)});g.H=e;g.g=new gq(a,"");wq(g.g,e,c).then(function(){yq(g.g,d).then(function(a){g.f=
a;Uq(g).then(function(){g.ib.setAttribute("data-vivliostyle-viewer-status","complete");Go.d("loadXML");Tq(g,{t:"loaded"});N(f,!0)})})})})});return M(f)};function Vq(a,b){var c=parseFloat(b),d=/[a-z]+$/,e;if("string"===typeof b&&(e=b.match(d))){d=e[0];if("em"===d||"rem"===d)return c*a.fontSize;if("ex"===d||"rex"===d)return c*jc.ex*a.fontSize/jc.em;if(d=jc[d])return c*d}return c}
n.rd=function(a){"boolean"==typeof a.autoresize&&(a.autoresize?(this.l=null,this.h.addEventListener("resize",this.O,!1),this.d=!0):this.h.removeEventListener("resize",this.O,!1));if("number"==typeof a.fontSize){var b=a.fontSize;5<=b&&72>=b&&this.fontSize!=b&&(this.fontSize=b,this.d=!0)}"object"==typeof a.viewport&&a.viewport&&(b=a.viewport,b={marginLeft:Vq(this,b["margin-left"])||0,marginRight:Vq(this,b["margin-right"])||0,marginTop:Vq(this,b["margin-top"])||0,marginBottom:Vq(this,b["margin-bottom"])||
0,width:Vq(this,b.width)||0,height:Vq(this,b.height)||0},200<=b.width||200<=b.height)&&(this.h.removeEventListener("resize",this.O,!1),this.l=b,this.d=!0);"boolean"==typeof a.hyphenate&&(this.T.Tc=a.hyphenate,this.d=!0);"boolean"==typeof a.horizontal&&(this.T.Sc=a.horizontal,this.d=!0);"boolean"==typeof a.nightMode&&(this.T.$c=a.nightMode,this.d=!0);"number"==typeof a.lineHeight&&(this.T.lineHeight=a.lineHeight,this.d=!0);"number"==typeof a.columnWidth&&(this.T.Pc=a.columnWidth,this.d=!0);"string"==
typeof a.fontFamily&&(this.T.fontFamily=a.fontFamily,this.d=!0);"boolean"==typeof a.load&&(this.S=a.load);"boolean"==typeof a.renderAllPages&&(this.gd=a.renderAllPages);"string"==typeof a.userAgentRootURL&&(ua=a.userAgentRootURL);"boolean"==typeof a.spreadView&&a.spreadView!==this.T.Xa&&(this.viewport=null,this.T.Xa=a.spreadView,this.d=!0);"number"==typeof a.pageBorder&&a.pageBorder!==this.T.Kb&&(this.viewport=null,this.T.Kb=a.pageBorder,this.d=!0);"number"==typeof a.zoom&&a.zoom!==this.zoom&&(this.zoom=
a.zoom,this.D=!0);return L(!0)};n.cd=function(a){var b=this.e;b===a.target&&(b=a.be);Wq(this,b)};function Xq(a){var b=[];a.e&&(b.push(a.e),a.e=null);a.j&&(b.push(a.j.left),b.push(a.j.right),a.j=null);b.forEach(function(a){a&&(w(a.N,"display","none"),a.removeEventListener("hyperlink",this.u,!1),a.removeEventListener("replaced",this.cd,!1))},a)}function Yq(a,b){b.addEventListener("hyperlink",a.u,!1);b.addEventListener("replaced",a.cd,!1);w(b.N,"visibility","visible");w(b.N,"display","block")}
function Zq(a,b){Xq(a);a.e=b;Yq(a,b)}function $q(a){var b=K("reportPosition");a.f||(a.f=Pq(a.b));xq(a.g,a.f.F,a.f.na).then(function(c){var d=a.e;(a.S&&0<d.g.length?sg(d.g):L(!0)).then(function(){ar(a,d,c).ua(b)})});return M(b)}
function br(a){var b=a.ib;if(a.l){var c=a.l;b.style.marginLeft=c.marginLeft+"px";b.style.marginRight=c.marginRight+"px";b.style.marginTop=c.marginTop+"px";b.style.marginBottom=c.marginBottom+"px";return new mn(a.h,a.fontSize,b,c.width,c.height)}return new mn(a.h,a.fontSize,b)}
function cr(a){if(a.l||!a.viewport||a.viewport.fontSize!=a.fontSize)return!1;var b=br(a);if(!(b=b.width==a.viewport.width&&b.height==a.viewport.height)&&(b=a.b)){a:{a=a.b.Lb;for(b=0;b<a.length;b++){var c=a[b];if(c)for(var c=c.qb,d=0;d<c.length;d++){var e=c[d];if(e.I&&e.H){a=!0;break a}}}a=!1}b=!a}return b}n.ie=function(a,b,c){if(!this.I&&this.w&&0===b&&0===c){var d="";Object.keys(a).forEach(function(b){d+="@page "+b+"{size:";b=a[b];d+=b.width+"px "+b.height+"px;}"});this.w.textContent=d;this.I=!0}};
function dr(a){if(a.b){a.b.tc();for(var b=a.b.Lb,c=0;c<b.length;c++){var d=b[c];if(d)for(var d=d.qb,e;e=d.shift();)e=e.N,e.parentNode.removeChild(e)}}a.w&&(a.w.textContent="",a.I=!1);a.viewport=br(a);b=a.viewport;w(b.e,"width","");w(b.e,"height","");w(b.d,"width","");w(b.d,"height","");w(b.d,"transform","");a.b=new Bq(a.g,a.viewport,a.ka,a.T,a.ie.bind(a))}
function Wq(a,b){a.D=!1;if(a.T.Xa)return Kq(a.b).Fc(function(c){Xq(a);a.j=c;c.left&&(Yq(a,c.left),c.right||c.left.N.setAttribute("data-vivliostyle-unpaired-page",!0));c.right&&(Yq(a,c.right),c.left||c.right.N.setAttribute("data-vivliostyle-unpaired-page",!0));c=er(a,c);a.viewport.zoom(c.width,c.height,a.zoom);a.e=b;return L(null)});Zq(a,b);a.viewport.zoom(b.e.width,b.e.height,a.zoom);a.e=b;return L(null)}
function er(a,b){var c=0,d=0;b.left&&(c+=b.left.e.width,d=b.left.e.height);b.right&&(c+=b.right.e.width,d=Math.max(d,b.right.e.height));b.left&&b.right&&(c+=2*a.T.Kb);return{width:c,height:d}}var fr={se:"fit inside viewport"};
function Uq(a){a.d=!1;if(cr(a))return L(!0);"complete"===a.ib.getAttribute("data-vivliostyle-viewer-status")&&a.ib.setAttribute("data-vivliostyle-viewer-status","resizing");Tq(a,{t:"resizestart"});var b=K("resize");a.b&&!a.f&&(a.f=Pq(a.b));dr(a);Qq(a.b,a.f).then(function(c){Wq(a,c).then(function(){$q(a).then(function(c){Go.d("loadFirstPage");(a.gd?a.b.gd():L(null)).then(function(){a.ib.setAttribute("data-vivliostyle-viewer-status","complete");Tq(a,{t:"resizeend"});N(b,c)})})})});return M(b)}
function ar(a,b,c){var d=K("sendLocationNotification"),e={t:"nav",first:b.l,last:b.k};Aq(a.g,a.f).then(function(b){e.epage=b;e.epageCount=a.g.w;c&&(e.cfi=c);Tq(a,e);N(d,!0)});return M(d)}Rq.prototype.nb=function(){return this.b?this.b.nb():null};
Rq.prototype.ma=function(a){var b=this;if("string"==typeof a.where)switch(a.where){case "next":a=this.T.Xa?this.b.ce:this.b.nextPage;break;case "previous":a=this.T.Xa?this.b.fe:this.b.ed;break;case "last":a=this.b.Xd;break;case "first":a=this.b.Wd;break;default:return L(!0)}else if("number"==typeof a.epage){var c=a.epage;a=function(){return Lq(b.b,c)}}else if("string"==typeof a.url){var d=a.url;a=function(){return Nq(b.b,d)}}else return L(!0);var e=K("nextPage");a.call(b.b).then(function(a){a?(b.f=
null,Wq(b,a).then(function(){$q(b).ua(e)})):N(e,!0)});return M(e)};Rq.prototype.xc=function(a){var b=!!a.autohide;a=a.v;var c=this.b.yd();if(c){if("show"==a)return L(!0)}else if("hide"==a)return L(!0);if(c)return this.b.tc(),L(!0);var d=this,e=K("showTOC");this.b.xc(b).then(function(a){if(a){if(b){var c=function(){d.b.tc()};a.addEventListener("hyperlink",c,!1);a.N.addEventListener("click",c,!1)}a.addEventListener("hyperlink",d.u,!1)}N(e,!0)});return M(e)};
function gr(a,b){var c=b.a||"";return We("runCommand",function(d){var e=a.ba[c];e?e.call(a,b).then(function(){Tq(a,{t:"done",a:c});N(d,!0)}):(v.error("No such action:",c),N(d,!0))},function(a,b){v.error(b,"Error during action:",c);N(a,!0)})}function hr(a){return"string"==typeof a?JSON.parse(a):a}
function ir(a,b){var c=hr(b),d=null;Ye(function(){var b=K("commandLoop"),f=Re.d;a.u=function(b){var c="#"===b.href.charAt(0)||a.H.some(function(a){return b.href.substr(0,a.length)==a}),d={t:"hyperlink",href:b.href,internal:c};Ze(f,function(){Tq(a,d);return L(!0)})};nf(function(b){if(a.d)Uq(a).then(function(){pf(b)});else if(a.D)a.e&&Wq(a,a.e).then(function(){pf(b)});else if(c){var e=c;c=null;gr(a,e).then(function(){pf(b)})}else e=K("waitForCommand"),d=ff(e,self),M(e).then(function(){pf(b)})}).ua(b);
return M(b)});a.B=function(){var a=d;a&&(d=null,a.Va())};a.k=function(b){if(c)return!1;c=hr(b);a.B();return!0};a.h.adapt_command=a.k};Array.b||(Array.b=function(a,b,c){b&&c&&(b=b.bind(c));c=[];for(var d=a.length,e=0;e<d;e++)c[e]=b?b(a[e]):a[e];return c});Object.Ub||(Object.Ub=function(a,b){Object.keys(b).forEach(function(c){a[c]=b[c]});return a});function jr(a){var b={};Object.keys(a).forEach(function(c){var d=a[c];switch(c){case "autoResize":b.autoresize=d;break;case "pageBorderWidth":b.pageBorder=d;break;default:b[c]=d}});return b}function kr(a,b){ka=a.debug;this.f=a;this.b=new Rq(a.window||window,a.viewportElement,"main",this.Vd.bind(this));this.e={autoResize:!0,fontSize:16,pageBorderWidth:1,renderAllPages:!0,spreadView:!1,zoom:1};b&&this.Od(b);this.d=new Xa}n=kr.prototype;
n.Od=function(a){var b=Object.Ub({a:"configure"},jr(a));this.b.k(b);Object.Ub(this.e,a)};n.Vd=function(a){var b={type:a.t};Object.keys(a).forEach(function(c){"t"!==c&&(b[c]=a[c])});Ya(this.d,b)};n.je=function(a,b){this.d.addEventListener(a,b,!1)};n.me=function(a,b){this.d.removeEventListener(a,b,!1)};n.Yd=function(a,b,c){a||Ya(this.d,{type:"error",content:"No URL specified"});lr(this,a,null,b,c)};n.ke=function(a,b,c){a||Ya(this.d,{type:"error",content:"No URL specified"});lr(this,null,a,b,c)};
function lr(a,b,c,d,e){d=d||{};var f,g=d.userStyleSheet;g&&(f=g.map(function(a){return{url:a.url||null,text:a.text||null}}));e&&Object.Ub(a.e,e);b=Object.Ub({a:b?"loadXML":"loadEPUB",userAgentRootURL:a.f.userAgentRootURL,url:b||c,document:d.documentObject,fragment:d.fragment,userStyleSheet:f},jr(a.e));ir(a.b,b)}n.nb=function(){return this.b.nb()};
n.$d=function(a){a:switch(a){case "left":a="ltr"===this.nb()?"previous":"next";break a;case "right":a="ltr"===this.nb()?"next":"previous";break a}this.b.k({a:"moveTo",where:a})};n.Zd=function(a){this.b.k({a:"moveTo",url:a})};n.le=function(a){var b;a:{b=this.b;if(!b.e)throw Error("no page exists.");switch(a){case "fit inside viewport":a=b.T.Xa?er(b,b.j):b.e.e;b=Math.min(b.viewport.width/a.width,b.viewport.height/a.height);break a;default:throw Error("unknown zoom type: "+a);}}return b};
ba("vivliostyle.viewer.Viewer",kr);kr.prototype.setOptions=kr.prototype.Od;kr.prototype.addListener=kr.prototype.je;kr.prototype.removeListener=kr.prototype.me;kr.prototype.loadDocument=kr.prototype.Yd;kr.prototype.loadEPUB=kr.prototype.ke;kr.prototype.getCurrentPageProgression=kr.prototype.nb;kr.prototype.navigateToPage=kr.prototype.$d;kr.prototype.navigateToInternalUrl=kr.prototype.Zd;kr.prototype.queryZoomFactor=kr.prototype.le;ba("vivliostyle.viewer.ZoomType",fr);fr.FIT_INSIDE_VIEWPORT="fit inside viewport";
Co.call(Go,"load_vivliostyle","end",void 0);var mr=16,nr="ltr";function or(a){window.adapt_command(a)}function pr(){or({a:"moveTo",where:"ltr"===nr?"previous":"next"})}function qr(){or({a:"moveTo",where:"ltr"===nr?"next":"previous"})}
function rr(a){var b=a.key,c=a.keyIdentifier,d=a.location;if("End"===b||"End"===c)or({a:"moveTo",where:"last"}),a.preventDefault();else if("Home"===b||"Home"===c)or({a:"moveTo",where:"first"}),a.preventDefault();else if("ArrowUp"===b||"Up"===b||"Up"===c)or({a:"moveTo",where:"previous"}),a.preventDefault();else if("ArrowDown"===b||"Down"===b||"Down"===c)or({a:"moveTo",where:"next"}),a.preventDefault();else if("ArrowRight"===b||"Right"===b||"Right"===c)qr(),a.preventDefault();else if("ArrowLeft"===
b||"Left"===b||"Left"===c)pr(),a.preventDefault();else if("0"===b||"U+0030"===c)or({a:"configure",fontSize:Math.round(mr)}),a.preventDefault();else if("t"===b||"U+0054"===c)or({a:"toc",v:"toggle",autohide:!0}),a.preventDefault();else if("+"===b||"Add"===b||"U+002B"===c||"U+00BB"===c||"U+004B"===c&&d===KeyboardEvent.b)mr*=1.2,or({a:"configure",fontSize:Math.round(mr)}),a.preventDefault();else if("-"===b||"Subtract"===b||"U+002D"===c||"U+00BD"===c||"U+004D"===c&&d===KeyboardEvent.b)mr/=1.2,or({a:"configure",
fontSize:Math.round(mr)}),a.preventDefault()}
function sr(a){switch(a.t){case "loaded":a=a.viewer;var b=nr=a.nb();a.ib.setAttribute("data-vivliostyle-page-progression",b);a.ib.setAttribute("data-vivliostyle-spread-view",a.T.Xa);window.addEventListener("keydown",rr,!1);document.body.setAttribute("data-vivliostyle-viewer-status","complete");a=document.getElementById("vivliostyle-page-navigation-left");a.addEventListener("click",pr,!1);b=document.getElementById("vivliostyle-page-navigation-right");b.addEventListener("click",qr,!1);[a,b].forEach(function(a){a.setAttribute("data-vivliostyle-ui-state",
"attention");window.setTimeout(function(){a.removeAttribute("data-vivliostyle-ui-state")},1E3)});break;case "nav":(a=a.cfi)&&location.replace(ya(location.href,Ma(a||"")));break;case "hyperlink":a.internal&&or({a:"moveTo",url:a.href})}}
ba("vivliostyle.viewerapp.main",function(a){var b=a&&a.fragment||wa("f"),c=a&&a.epubURL||wa("b"),d=a&&a.xmlURL||wa("x"),e=a&&a.defaultPageWidth||wa("w"),f=a&&a.defaultPageHeight||wa("h"),g=a&&a.defaultPageSize||wa("size"),h=a&&a.orientation||wa("orientation"),l=wa("spread"),l=a&&a.spreadView||!!l&&"false"!=l,k=a&&a.viewportElement||document.body;a={a:c?"loadEPUB":"loadXML",url:c||d,autoresize:!0,fragment:b,renderAllPages:!0,userAgentRootURL:a&&a.uaRoot||null,document:a&&a.document||null,userStyleSheet:a&&
a.userStyleSheet||null,spreadView:l,pageBorder:1};var m;if(e&&f)m=e+" "+f;else{switch(g){case "A5":e="148mm";f="210mm";break;case "A4":e="210mm";f="297mm";break;case "A3":e="297mm";f="420mm";break;case "B5":e="176mm";f="250mm";break;case "B4":e="250mm";f="353mm";break;case "letter":e="8.5in";f="11in";break;case "legal":e="8.5in";f="14in";break;case "ledger":e="11in",f="17in"}e&&f&&(m=g,"landscape"===h&&(m=m?m+" landscape":null,g=e,e=f,f=g))}e&&f&&(a.viewport={width:e,height:f},g=document.createElement("style"),
g.textContent="@page { size: "+m+"; margin: 0; }",document.head.appendChild(g));ir(new Rq(window,k,"main",sr),a)});
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
