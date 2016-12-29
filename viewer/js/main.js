(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*!
 * Knockout JavaScript library v3.4.1
 * (c) The Knockout.js team - http://knockoutjs.com/
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
ko.version = "3.4.1";

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
        underlyingNotifySubscribersFunction,
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
            if (underlyingNotifySubscribersFunction) {
                target['notifySubscribers'] = underlyingNotifySubscribersFunction;
                underlyingNotifySubscribersFunction = undefined;
            }
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
        underlyingNotifySubscribersFunction = target['notifySubscribers'];
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
            disposeWhen = state.disposeWhen,
            changed = false;

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
            changed = this.evaluateImmediate_CallReadWithDependencyDetection(notifyChange);
        } finally {
            state.isBeingEvaluated = false;
        }

        if (!state.dependenciesCount) {
            computedObservable.dispose();
        }

        return changed;
    },
    evaluateImmediate_CallReadWithDependencyDetection: function (notifyChange) {
        // This function is really just part of the evaluateImmediate logic. You would never call it from anywhere else.
        // Factoring it out into a separate function means it can be independent of the try/catch block in evaluateImmediate,
        // which contributes to saving about 40% off the CPU overhead of computed evaluation (on V8 at least).

        var computedObservable = this,
            state = computedObservable[computedState],
            changed = false;

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
            if (DEBUG) computedObservable._latestValue = newValue;

            if (state.isSleeping) {
                computedObservable.updateVersion();
            } else if (notifyChange) {
                computedObservable["notifySubscribers"](state.latestValue);
            }

            changed = true;
        }

        if (isInitial) {
            computedObservable["notifySubscribers"](state.latestValue, "awake");
        }

        return changed;
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
                if (computedObservable.evaluateImmediate()) {
                    computedObservable.updateVersion();
                }
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
    ko.bindingContext = function(dataItemOrAccessor, parentContext, dataItemAlias, extendCallback, options) {

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
                self._subscribable = subscribable;
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
            subscribable;

        if (options && options['exportDependencies']) {
            // The "exportDependencies" option means that the calling code will track any dependencies and re-create
            // the binding context when they change.
            updateContext();
        } else {
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
    }

    // Extend the binding context hierarchy with a new view model object. If the parent context is watching
    // any observables, the new child context will automatically get a dependency on the parent context.
    // But this does not mean that the $data value of the child context will also get updated. If the child
    // view model also depends on the parent view model, you must provide a function that returns the correct
    // view model on each update.
    ko.bindingContext.prototype['createChildContext'] = function (dataItemOrAccessor, dataItemAlias, extendCallback, options) {
        return new ko.bindingContext(dataItemOrAccessor, this, dataItemAlias, function(self, parentContext) {
            // Extend the context hierarchy by setting the appropriate pointers
            self['$parentContext'] = parentContext;
            self['$parent'] = parentContext['$data'];
            self['$parents'] = (parentContext['$parents'] || []).slice(0);
            self['$parents'].unshift(self['$parent']);
            if (extendCallback)
                extendCallback(self);
        }, options);
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

    ko.bindingContext.prototype.createStaticChildContext = function (dataItemOrAccessor, dataItemAlias) {
        return this['createChildContext'](dataItemOrAccessor, dataItemAlias, null, { "exportDependencies": true });
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
                var rawValue = valueAccessor(),
                    dataValue = ko.utils.unwrapObservable(rawValue),
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
                        ko.applyBindingsToDescendants(makeContextCallback ? makeContextCallback(bindingContext, rawValue) : bindingContext, element);
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
        return bindingContext.createStaticChildContext(dataValue);
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
                        : new ko.bindingContext(dataOrBindingContext, null, null, null, { "exportDependencies": true });

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
                    bindingContext.createStaticChildContext(options['data'], options['as']) :  // Given an explitit 'data' value, we create a child binding context for it
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
 * Vivliostyle core 2016.10.1-pre.20161229112428
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
    var n,aa=this;function ba(a,b){var c="undefined"!==typeof enclosingObject&&enclosingObject?enclosingObject:window,d=a.split("."),c=c||aa;d[0]in c||!c.execScript||c.execScript("var "+d[0]);for(var e;d.length&&(e=d.shift());)d.length||void 0===b?c[e]?c=c[e]:c=c[e]={}:c[e]=b}
function u(a,b){function c(){}c.prototype=b.prototype;a.Je=b.prototype;a.prototype=new c;a.prototype.constructor=a;a.Cf=function(a,c,f){for(var d=Array(arguments.length-2),e=2;e<arguments.length;e++)d[e-2]=arguments[e];return b.prototype[c].apply(a,d)}};function ca(a){var b=a.error,c=b&&(b.frameTrace||b.stack);a=[].concat(a.messages);b&&(0<a.length&&(a=a.concat(["\n"])),a=a.concat([b.toString()]),c&&(a=a.concat(["\n"]).concat(c)));return a}function da(a){a=Array.from(a);var b=null;a[0]instanceof Error&&(b=a.shift());return{error:b,messages:a}}function ea(a){function b(a){return function(b){return a.apply(c,b)}}var c=a||console;this.h=b(c.debug||c.log);this.l=b(c.info||c.log);this.u=b(c.warn||c.log);this.j=b(c.error||c.log);this.f={}}
function fa(a,b,c){(a=a.f[b])&&a.forEach(function(a){a(c)})}function ga(a,b){var c=v,d=c.f[a];d||(d=c.f[a]=[]);d.push(b)}ea.prototype.debug=function(a){var b=da(arguments);this.h(ca(b));fa(this,1,b)};ea.prototype.g=function(a){var b=da(arguments);this.l(ca(b));fa(this,2,b)};ea.prototype.b=function(a){var b=da(arguments);this.u(ca(b));fa(this,3,b)};ea.prototype.error=function(a){var b=da(arguments);this.j(ca(b));fa(this,4,b)};var v=new ea;function ha(a){var b=a.match(/^([^#]*)/);return b?b[1]:a}var ia=window.location.href,ja=window.location.href;
function ka(a,b){if(!b||a.match(/^\w{2,}:/))return a.toLowerCase().match("^javascript:")?"#":a;b.match(/^\w{2,}:\/\/[^\/]+$/)&&(b+="/");var c;if(a.match(/^\/\//))return(c=b.match(/^(\w{2,}:)\/\//))?c[1]+a:a;if(a.match(/^\//))return(c=b.match(/^(\w{2,}:\/\/[^\/]+)\//))?c[1]+a:a;a.match(/^\.(\/|$)/)&&(a=a.substr(1));c=b;var d=c.match(/^([^#?]*)/);b=d?d[1]:c;if(a.match(/^\#/))return b+a;c=b.lastIndexOf("/");if(0>c)return a;for(d=b.substr(0,c+1)+a;;){c=d.indexOf("/../");if(0>=c)break;var e=d.lastIndexOf("/",
c-1);if(0>=e)break;d=d.substr(0,e)+d.substr(c+3)}return d.replace(/\/(\.\/)+/g,"/")}function la(a){a=new RegExp("#(.*&)?"+ma(a)+"=([^#&]*)");return(a=window.location.href.match(a))?a[2]:null}function na(a,b){var c=new RegExp("#(.*&)?"+ma("f")+"=([^#&]*)"),d=a.match(c);return d?(c=d[2].length,d=d.index+d[0].length-c,a.substr(0,d)+b+a.substr(d+c)):a.match(/#/)?a+"&f="+b:a+"#f="+b}function oa(a){return null==a?a:a.toString()}function pa(){this.b=[null]}
pa.prototype.length=function(){return this.b.length-1};function qa(a,b){a&&(b="-"+b,a=a.replace(/-/g,""),"moz"===a&&(a="Moz"));return a+b.replace(/-[a-z]/g,function(a){return a.substr(1).toUpperCase()})}var ra=" -webkit- -moz- -ms- -o- -epub-".split(" "),sa={};
function ta(a,b){if("writing-mode"===b){var c=document.createElement("span");if("-ms-"===a)return c.style.setProperty(a+b,"tb-rl"),"tb-rl"===c.style["writing-mode"];c.style.setProperty(a+b,"vertical-rl");return"vertical-rl"===c.style[a+b]}return"string"===typeof document.documentElement.style[qa(a,b)]}
function ua(a){var b=sa[a];if(b||null===b)return b;switch(a){case "writing-mode":if(ta("-ms-","writing-mode"))return sa[a]=["-ms-writing-mode"],["-ms-writing-mode"];break;case "filter":if(ta("-webkit-","filter"))return sa[a]=["-webkit-filter"],["-webkit-filter"];break;case "clip-path":if(ta("-webkit-","clip-path"))return sa[a]=["-webkit-clip-path","clip-path"]}for(b=0;b<ra.length;b++){var c=ra[b];if(ta(c,a))return b=c+a,sa[a]=[b],[b]}v.b("Property not supported by the browser: ",a);return sa[a]=null}
function w(a,b,c){try{var d=ua(b);d&&d.forEach(function(b){if("-ms-writing-mode"===b)switch(c){case "horizontal-tb":c="lr-tb";break;case "vertical-rl":c="tb-rl";break;case "vertical-lr":c="tb-lr"}a&&a.style&&a.style.setProperty(b,c)})}catch(e){v.b(e)}}function wa(a,b,c){try{var d=sa[b];return a.style.getPropertyValue(d?d[0]:b)}catch(e){}return c||""}
function xa(a){var b=a.getAttributeNS("http://www.w3.org/XML/1998/namespace","lang");b||"http://www.w3.org/1999/xhtml"!=a.namespaceURI||(b=a.getAttribute("lang"));return b}function ya(){this.b=[]}ya.prototype.append=function(a){this.b.push(a);return this};ya.prototype.toString=function(){var a=this.b.join("");this.b=[a];return a};function za(a){return"\\"+a.charCodeAt(0).toString(16)+" "}function Aa(a){return a.replace(/[^-_a-zA-Z0-9\u0080-\uFFFF]/g,za)}
function Ba(a){return a.replace(/[\u0000-\u001F"]/g,za)}function Ca(a){return a.replace(/[\s+&?=#\u007F-\uFFFF]+/g,encodeURIComponent)}function Da(a){return!!a.match(/^[a-zA-Z\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]$/)}function ma(a,b){return a.replace(/[^-a-zA-Z0-9_]/g,function(a){return("string"===typeof b?b:"\\u")+(65536|a.charCodeAt(0)).toString(16).substr(1)})}
function Ea(a){var b=":",b="string"===typeof b?b:"\\u",c=new RegExp(ma(b)+"[0-9a-fA-F]{4}","g");return a.replace(c,function(a){var c=b,c="string"===typeof c?c:"\\u";return a.indexOf(c)?a:String.fromCharCode(parseInt(a.substring(c.length),16))})}function Fa(a){if(!a)throw"Assert failed";}function Ga(a,b){for(var c=0,d=a;;){Fa(c<=d);Fa(!c||!b(c-1));Fa(d==a||b(d));if(c==d)return c;var e=c+d>>1;b(e)?d=e:c=e+1}}function Ha(a,b){return a-b}
function Ia(a,b){for(var c={},d=0;d<a.length;d++){var e=a[d],f=b(e);f&&!c[f]&&(c[f]=e)}return c}var Ja={};function Ka(a,b){for(var c={},d=0;d<a.length;d++){var e=a[d],f=b(e);f&&(c[f]?c[f].push(e):c[f]=[e])}return c}function La(a,b){for(var c=Array(a.length),d=0;d<a.length;d++)c[d]=b(a[d],d);return c}function Ma(a,b){var c={},d;for(d in a)c[d]=b(a[d],d);return c}function Na(){this.h={}}function Oa(a,b){var c=a.h[b.type];if(c){b.target=a;b.currentTarget=a;for(var d=0;d<c.length;d++)c[d](b)}}
Na.prototype.addEventListener=function(a,b,c){c||((c=this.h[a])?c.push(b):this.h[a]=[b])};Na.prototype.removeEventListener=function(a,b,c){!c&&(a=this.h[a])&&(b=a.indexOf(b),0<=b&&a.splice(b,1))};var Pa=null,Qa=null;function Ra(a){return 1==a.nodeType&&(a=a.getAttribute("id"))&&a.match(/^[-a-zA-Z_0-9.\u007F-\uFFFF]+$/)?a:null}function Sa(a){return"^"+a}function Ta(a){return a.substr(1)}function Ua(a){return a?a.replace(/\^[\[\]\(\),=;^]/g,Ta):a}
function Va(a){for(var b={};a;){var c=a.match(/^;([^;=]+)=(([^;]|\^;)*)/);if(!c)break;var d=c[1],e;a:{e=c[2];var f=[];do{var g=e.match(/^(\^,|[^,])*/),h=Ua(g[0]);e=e.substr(g[0].length+1);if(!e&&!f.length){e=h;break a}f.push(h)}while(e);e=f}b[d]=e;a=a.substr(c[0].length)}return b}function Wa(){}Wa.prototype.g=function(a){a.append("!")};Wa.prototype.h=function(){return!1};function Xa(a,b,c){this.index=a;this.id=b;this.jb=c}
Xa.prototype.g=function(a){a.append("/");a.append(this.index.toString());if(this.id||this.jb)a.append("["),this.id&&a.append(this.id),this.jb&&(a.append(";s="),a.append(this.jb)),a.append("]")};
Xa.prototype.h=function(a){if(1!=a.node.nodeType)throw Error("E_CFI_NOT_ELEMENT");var b=a.node,c=b.children,d=c.length,e=Math.floor(this.index/2)-1;0>e||!d?(c=b.firstChild,a.node=c||b):(c=c[Math.min(e,d-1)],this.index&1&&((b=c.nextSibling)&&1!=b.nodeType?c=b:a.K=!0),a.node=c);if(this.id&&(a.K||this.id!=Ra(a.node)))throw Error("E_CFI_ID_MISMATCH");a.jb=this.jb;return!0};function Za(a,b,c,d){this.offset=a;this.f=b;this.b=c;this.jb=d}
Za.prototype.h=function(a){if(0<this.offset&&!a.K){for(var b=this.offset,c=a.node;;){var d=c.nodeType;if(1==d)break;var e=c.nextSibling;if(3<=d&&5>=d){d=c.textContent.length;if(b<=d)break;if(!e){b=d;break}b-=d}if(!e){b=0;break}c=e}a.node=c;a.offset=b}a.jb=this.jb;return!0};
Za.prototype.g=function(a){a.append(":");a.append(this.offset.toString());if(this.f||this.b||this.jb){a.append("[");if(this.f||this.b)this.f&&a.append(this.f.replace(/[\[\]\(\),=;^]/g,Sa)),a.append(","),this.b&&a.append(this.b.replace(/[\[\]\(\),=;^]/g,Sa));this.jb&&(a.append(";s="),a.append(this.jb));a.append("]")}};function $a(){this.ka=null}
function ab(a,b){var c=b.match(/^#?epubcfi\((.*)\)$/);if(!c)throw Error("E_CFI_NOT_CFI");for(var d=c[1],e=0,f=[];;)switch(d.charAt(e)){case "/":e++;c=d.substr(e).match(/^(0|[1-9][0-9]*)(\[([-a-zA-Z_0-9.\u007F-\uFFFF]+)(;([^\]]|\^\])*)?\])?/);if(!c)throw Error("E_CFI_NUMBER_EXPECTED");var e=e+c[0].length,g=parseInt(c[1],10),h=c[3],c=Va(c[4]);f.push(new Xa(g,h,oa(c.s)));break;case ":":e++;c=d.substr(e).match(/^(0|[1-9][0-9]*)(\[((([^\];,]|\^[\];,])*)(,(([^\];,]|\^[\];,])*))?)(;([^]]|\^\])*)?\])?/);
if(!c)throw Error("E_CFI_NUMBER_EXPECTED");e+=c[0].length;g=parseInt(c[1],10);(h=c[4])&&(h=Ua(h));var l=c[7];l&&(l=Ua(l));c=Va(c[10]);f.push(new Za(g,h,l,oa(c.s)));break;case "!":e++;f.push(new Wa);break;case "~":case "@":case "":a.ka=f;return;default:throw Error("E_CFI_PARSE_ERROR");}}function bb(a,b){for(var c={node:b.documentElement,offset:0,K:!1,jb:null,zc:null},d=0;d<a.ka.length;d++)if(!a.ka[d].h(c)){++d<a.ka.length&&(c.zc=new $a,c.zc.ka=a.ka.slice(d));break}return c}
$a.prototype.trim=function(a,b){return a.replace(/\s+/g," ").match(b?/^[ -\uD7FF\uE000-\uFFFF]{0,8}/:/[ -\uD7FF\uE000-\uFFFF]{0,8}$/)[0].replace(/^\s/,"").replace(/\s$/,"")};
function cb(a,b,c){for(var d=!1,e=null,f=[],g=b.parentNode,h="",l="";b;){switch(b.nodeType){case 3:case 4:case 5:var k=b.textContent,m=k.length;d?(c+=m,h||(h=k)):(c>m&&(c=m),d=!0,h=k.substr(0,c),l=k.substr(c));b=b.previousSibling;continue;case 8:b=b.previousSibling;continue}break}if(0<c||h||l)h=a.trim(h,!1),l=a.trim(l,!0),f.push(new Za(c,h,l,e)),e=null;for(;g&&g&&9!=g.nodeType;){c=d?null:Ra(b);for(d=d?1:0;b;)1==b.nodeType&&(d+=2),b=b.previousSibling;f.push(new Xa(d,c,e));e=null;b=g;g=g.parentNode;
d=!1}f.reverse();a.ka?(f.push(new Wa),a.ka=f.concat(a.ka)):a.ka=f}$a.prototype.toString=function(){if(!this.ka)return"";var a=new ya;a.append("epubcfi(");for(var b=0;b<this.ka.length;b++)this.ka[b].g(a);a.append(")");return a.toString()};function db(){return{fontFamily:"serif",lineHeight:1.25,margin:8,vd:!0,qd:25,ud:!1,Bd:!1,kb:!1,dc:1,Vd:{print:!0}}}function eb(a){return{fontFamily:a.fontFamily,lineHeight:a.lineHeight,margin:a.margin,vd:a.vd,qd:a.qd,ud:a.ud,Bd:a.Bd,kb:a.kb,dc:a.dc,Vd:Object.assign({},a.Vd)}}var fb=db(),gb={};function hb(a,b,c,d){a=Math.min((a-0)/c,(b-0)/d);return"matrix("+a+",0,0,"+a+",0,0)"}function ib(a){return'"'+Ba(a+"")+'"'}function jb(a){return Aa(a+"")}function kb(a,b){return a?Aa(a)+"."+Aa(b):Aa(b)}
var lb=0;
function mb(a,b){this.parent=a;this.u="S"+lb++;this.A=[];this.b=new nb(this,0);this.f=new nb(this,1);this.j=new nb(this,!0);this.h=new nb(this,!1);a&&a.A.push(this);this.values={};this.F={};this.C={};this.l=b;if(!a){var c=this.C;c.floor=Math.floor;c.ceil=Math.ceil;c.round=Math.round;c.sqrt=Math.sqrt;c.min=Math.min;c.max=Math.max;c.letterbox=hb;c["css-string"]=ib;c["css-name"]=jb;c["typeof"]=function(a){return typeof a};ob(this,"page-width",function(){return this.Eb()});ob(this,"page-height",function(){return this.Db()});
ob(this,"pref-font-family",function(){return this.$.fontFamily});ob(this,"pref-night-mode",function(){return this.$.Bd});ob(this,"pref-hyphenate",function(){return this.$.vd});ob(this,"pref-margin",function(){return this.$.margin});ob(this,"pref-line-height",function(){return this.$.lineHeight});ob(this,"pref-column-width",function(){return this.$.qd*this.fontSize});ob(this,"pref-horizontal",function(){return this.$.ud});ob(this,"pref-spread-view",function(){return this.$.kb})}}
function ob(a,b,c){a.values[b]=new qb(a,c,b)}function rb(a,b){a.values["page-number"]=b}function sb(a,b){a.C["has-content"]=b}var tb={px:1,"in":96,pt:4/3,pc:16,cm:96/2.54,mm:96/25.4,q:96/2.54/40,em:16,rem:16,ex:8,rex:8,dppx:1,dpi:1/96,dpcm:2.54/96};function ub(a){switch(a){case "q":case "rem":case "rex":return!0;default:return!1}}
function vb(a,b,c,d){this.Ja=b;this.tb=c;this.M=null;this.Eb=function(){return this.M?this.M:this.$.kb?Math.floor(b/2)-this.$.dc:b};this.J=null;this.Db=function(){return this.J?this.J:c};this.u=d;this.W=null;this.fontSize=function(){return this.W?this.W:d};this.$=fb;this.G={}}function wb(a,b){a.G[b.u]={};for(var c=0;c<b.A.length;c++)wb(a,b.A[c])}
function xb(a,b,c){return"vw"==b?a.Eb()/100:"vh"==b?a.Db()/100:"em"==b||"rem"==b?c?a.u:a.fontSize():"ex"==b||"rex"==b?tb.ex*(c?a.u:a.fontSize())/tb.em:tb[b]}function yb(a,b,c){do{var d=b.values[c];if(d||b.l&&(d=b.l.call(a,c,!1)))return d;b=b.parent}while(b);throw Error("Name '"+c+"' is undefined");}
function zb(a,b,c,d,e){do{var f=b.F[c];if(f||b.l&&(f=b.l.call(a,c,!0)))return f;if(f=b.C[c]){if(e)return b.b;c=Array(d.length);for(e=0;e<d.length;e++)c[e]=d[e].evaluate(a);return new nb(b,f.apply(a,c))}b=b.parent}while(b);throw Error("Function '"+c+"' is undefined");}
function Ab(a,b,c){var d="",e=b.match(/^(min|max)-(.*)$/);e&&(d=e[1],b=e[2]);var f=e=null;switch(b){case "width":case "height":case "device-width":case "device-height":case "color":c&&(e=c.evaluate(a))}switch(b){case "width":f=a.Eb();break;case "height":f=a.Db();break;case "device-width":f=window.screen.availWidth;break;case "device-height":f=window.screen.availHeight;break;case "color":f=window.screen.pixelDepth}if(null!=f&&null!=e)switch(d){case "min":return f>=e;case "max":return f<=e;default:return f==
e}else if(null!=f&&!c)return!!f;return!1}function Bb(a){this.b=a;this.h="_"+lb++}n=Bb.prototype;n.toString=function(){var a=new ya;this.ta(a,0);return a.toString()};n.ta=function(){throw Error("F_ABSTRACT");};n.ab=function(){throw Error("F_ABSTRACT");};n.Qa=function(){return this};n.Qb=function(a){return a===this};function Cb(a,b,c,d){var e=d[a.h];if(null!=e)return e===gb?!1:e;d[a.h]=gb;b=a.Qb(b,c,d);return d[a.h]=b}
n.evaluate=function(a){var b;b=(b=a.G[this.b.u])?b[this.h]:void 0;if("undefined"!=typeof b)return b;b=this.ab(a);var c=this.h,d=this.b,e=a.G[d.u];e||(e={},a.G[d.u]=e);return e[c]=b};n.ae=function(){return!1};function Db(a,b){Bb.call(this,a);this.f=b}u(Db,Bb);n=Db.prototype;n.Qd=function(){throw Error("F_ABSTRACT");};n.Wd=function(){throw Error("F_ABSTRACT");};n.ab=function(a){a=this.f.evaluate(a);return this.Wd(a)};n.Qb=function(a,b,c){return a===this||Cb(this.f,a,b,c)};
n.ta=function(a,b){10<b&&a.append("(");a.append(this.Qd());this.f.ta(a,10);10<b&&a.append(")")};n.Qa=function(a,b){var c=this.f.Qa(a,b);return c===this.f?this:new this.constructor(this.b,c)};function Fb(a,b,c){Bb.call(this,a);this.f=b;this.g=c}u(Fb,Bb);n=Fb.prototype;n.Jc=function(){throw Error("F_ABSTRACT");};n.Ma=function(){throw Error("F_ABSTRACT");};n.hb=function(){throw Error("F_ABSTRACT");};n.ab=function(a){var b=this.f.evaluate(a);a=this.g.evaluate(a);return this.hb(b,a)};
n.Qb=function(a,b,c){return a===this||Cb(this.f,a,b,c)||Cb(this.g,a,b,c)};n.ta=function(a,b){var c=this.Jc();c<=b&&a.append("(");this.f.ta(a,c);a.append(this.Ma());this.g.ta(a,c);c<=b&&a.append(")")};n.Qa=function(a,b){var c=this.f.Qa(a,b),d=this.g.Qa(a,b);return c===this.f&&d===this.g?this:new this.constructor(this.b,c,d)};function Gb(a,b,c){Fb.call(this,a,b,c)}u(Gb,Fb);Gb.prototype.Jc=function(){return 1};function Hb(a,b,c){Fb.call(this,a,b,c)}u(Hb,Fb);Hb.prototype.Jc=function(){return 2};
function Ib(a,b,c){Fb.call(this,a,b,c)}u(Ib,Fb);Ib.prototype.Jc=function(){return 3};function Jb(a,b,c){Fb.call(this,a,b,c)}u(Jb,Fb);Jb.prototype.Jc=function(){return 4};function Kb(a,b){Db.call(this,a,b)}u(Kb,Db);Kb.prototype.Qd=function(){return"!"};Kb.prototype.Wd=function(a){return!a};function Lb(a,b){Db.call(this,a,b)}u(Lb,Db);Lb.prototype.Qd=function(){return"-"};Lb.prototype.Wd=function(a){return-a};function Mb(a,b,c){Fb.call(this,a,b,c)}u(Mb,Gb);Mb.prototype.Ma=function(){return"&&"};
Mb.prototype.ab=function(a){return this.f.evaluate(a)&&this.g.evaluate(a)};function Nb(a,b,c){Fb.call(this,a,b,c)}u(Nb,Mb);Nb.prototype.Ma=function(){return" and "};function Ob(a,b,c){Fb.call(this,a,b,c)}u(Ob,Gb);Ob.prototype.Ma=function(){return"||"};Ob.prototype.ab=function(a){return this.f.evaluate(a)||this.g.evaluate(a)};function Pb(a,b,c){Fb.call(this,a,b,c)}u(Pb,Ob);Pb.prototype.Ma=function(){return", "};function Qb(a,b,c){Fb.call(this,a,b,c)}u(Qb,Hb);Qb.prototype.Ma=function(){return"<"};
Qb.prototype.hb=function(a,b){return a<b};function Rb(a,b,c){Fb.call(this,a,b,c)}u(Rb,Hb);Rb.prototype.Ma=function(){return"<="};Rb.prototype.hb=function(a,b){return a<=b};function Sb(a,b,c){Fb.call(this,a,b,c)}u(Sb,Hb);Sb.prototype.Ma=function(){return">"};Sb.prototype.hb=function(a,b){return a>b};function Tb(a,b,c){Fb.call(this,a,b,c)}u(Tb,Hb);Tb.prototype.Ma=function(){return">="};Tb.prototype.hb=function(a,b){return a>=b};function Ub(a,b,c){Fb.call(this,a,b,c)}u(Ub,Hb);Ub.prototype.Ma=function(){return"=="};
Ub.prototype.hb=function(a,b){return a==b};function Vb(a,b,c){Fb.call(this,a,b,c)}u(Vb,Hb);Vb.prototype.Ma=function(){return"!="};Vb.prototype.hb=function(a,b){return a!=b};function Wb(a,b,c){Fb.call(this,a,b,c)}u(Wb,Ib);Wb.prototype.Ma=function(){return"+"};Wb.prototype.hb=function(a,b){return a+b};function Xb(a,b,c){Fb.call(this,a,b,c)}u(Xb,Ib);Xb.prototype.Ma=function(){return" - "};Xb.prototype.hb=function(a,b){return a-b};function Yb(a,b,c){Fb.call(this,a,b,c)}u(Yb,Jb);Yb.prototype.Ma=function(){return"*"};
Yb.prototype.hb=function(a,b){return a*b};function Zb(a,b,c){Fb.call(this,a,b,c)}u(Zb,Jb);Zb.prototype.Ma=function(){return"/"};Zb.prototype.hb=function(a,b){return a/b};function $b(a,b,c){Fb.call(this,a,b,c)}u($b,Jb);$b.prototype.Ma=function(){return"%"};$b.prototype.hb=function(a,b){return a%b};function ac(a,b,c){Bb.call(this,a);this.I=b;this.fa=c.toLowerCase()}u(ac,Bb);ac.prototype.ta=function(a){a.append(this.I.toString());a.append(Aa(this.fa))};
ac.prototype.ab=function(a){return this.I*xb(a,this.fa,!1)};function bc(a,b){Bb.call(this,a);this.f=b}u(bc,Bb);bc.prototype.ta=function(a){a.append(this.f)};bc.prototype.ab=function(a){return yb(a,this.b,this.f).evaluate(a)};bc.prototype.Qb=function(a,b,c){return a===this||Cb(yb(b,this.b,this.f),a,b,c)};function cc(a,b,c){Bb.call(this,a);this.f=b;this.name=c}u(cc,Bb);cc.prototype.ta=function(a){this.f&&a.append("not ");a.append(Aa(this.name))};
cc.prototype.ab=function(a){var b=this.name;a="all"===b||!!a.$.Vd[b];return this.f?!a:a};cc.prototype.Qb=function(a,b,c){return a===this||Cb(this.value,a,b,c)};cc.prototype.ae=function(){return!0};function qb(a,b,c){Bb.call(this,a);this.bc=b;this.gc=c}u(qb,Bb);qb.prototype.ta=function(a){a.append(this.gc)};qb.prototype.ab=function(a){return this.bc.call(a)};function dc(a,b,c){Bb.call(this,a);this.g=b;this.f=c}u(dc,Bb);
dc.prototype.ta=function(a){a.append(this.g);var b=this.f;a.append("(");for(var c=0;c<b.length;c++)c&&a.append(","),b[c].ta(a,0);a.append(")")};dc.prototype.ab=function(a){return zb(a,this.b,this.g,this.f,!1).Qa(a,this.f).evaluate(a)};dc.prototype.Qb=function(a,b,c){if(a===this)return!0;for(var d=0;d<this.f.length;d++)if(Cb(this.f[d],a,b,c))return!0;return Cb(zb(b,this.b,this.g,this.f,!0),a,b,c)};
dc.prototype.Qa=function(a,b){for(var c,d=c=this.f,e=0;e<c.length;e++){var f=c[e].Qa(a,b);if(c!==d)d[e]=f;else if(f!==c[e]){for(var d=Array(c.length),g=0;g<e;g++)d[g]=c[g];d[e]=f}}c=d;return c===this.f?this:new dc(this.b,this.g,c)};function ec(a,b,c,d){Bb.call(this,a);this.f=b;this.j=c;this.g=d}u(ec,Bb);ec.prototype.ta=function(a,b){0<b&&a.append("(");this.f.ta(a,0);a.append("?");this.j.ta(a,0);a.append(":");this.g.ta(a,0);0<b&&a.append(")")};
ec.prototype.ab=function(a){return this.f.evaluate(a)?this.j.evaluate(a):this.g.evaluate(a)};ec.prototype.Qb=function(a,b,c){return a===this||Cb(this.f,a,b,c)||Cb(this.j,a,b,c)||Cb(this.g,a,b,c)};ec.prototype.Qa=function(a,b){var c=this.f.Qa(a,b),d=this.j.Qa(a,b),e=this.g.Qa(a,b);return c===this.f&&d===this.j&&e===this.g?this:new ec(this.b,c,d,e)};function nb(a,b){Bb.call(this,a);this.f=b}u(nb,Bb);
nb.prototype.ta=function(a){switch(typeof this.f){case "number":case "boolean":a.append(this.f.toString());break;case "string":a.append('"');a.append(Ba(this.f));a.append('"');break;default:throw Error("F_UNEXPECTED_STATE");}};nb.prototype.ab=function(){return this.f};function fc(a,b,c){Bb.call(this,a);this.name=b;this.value=c}u(fc,Bb);fc.prototype.ta=function(a){a.append("(");a.append(Ba(this.name.name));a.append(":");this.value.ta(a,0);a.append(")")};
fc.prototype.ab=function(a){return Ab(a,this.name.name,this.value)};fc.prototype.Qb=function(a,b,c){return a===this||Cb(this.value,a,b,c)};fc.prototype.Qa=function(a,b){var c=this.value.Qa(a,b);return c===this.value?this:new fc(this.b,this.name,c)};function gc(a,b){Bb.call(this,a);this.index=b}u(gc,Bb);gc.prototype.ta=function(a){a.append("$");a.append(this.index.toString())};gc.prototype.Qa=function(a,b){var c=b[this.index];if(!c)throw Error("Parameter missing: "+this.index);return c};
function hc(a,b,c){return b===a.h||b===a.b||c==a.h||c==a.b?a.h:b===a.j||b===a.f?c:c===a.j||c===a.f?b:new Mb(a,b,c)}function y(a,b,c){return b===a.b?c:c===a.b?b:new Wb(a,b,c)}function z(a,b,c){return b===a.b?new Lb(a,c):c===a.b?b:new Xb(a,b,c)}function ic(a,b,c){return b===a.b||c===a.b?a.b:b===a.f?c:c===a.f?b:new Yb(a,b,c)}function jc(a,b,c){return b===a.b?a.b:c===a.f?b:new Zb(a,b,c)};var kc={};function mc(){}n=mc.prototype;n.Jb=function(a){for(var b=0;b<a.length;b++)a[b].aa(this)};n.Nd=function(){throw Error("E_CSS_EMPTY_NOT_ALLOWED");};n.Od=function(){throw Error("E_CSS_SLASH_NOT_ALLOWED");};n.Hc=function(){throw Error("E_CSS_STR_NOT_ALLOWED");};n.Ib=function(){throw Error("E_CSS_IDENT_NOT_ALLOWED");};n.kc=function(){throw Error("E_CSS_NUMERIC_NOT_ALLOWED");};n.jc=function(){throw Error("E_CSS_NUM_NOT_ALLOWED");};n.ic=function(a){return this.jc(a)};
n.gd=function(){throw Error("E_CSS_COLOR_NOT_ALLOWED");};n.lc=function(){throw Error("E_CSS_URL_NOT_ALLOWED");};n.sb=function(){throw Error("E_CSS_LIST_NOT_ALLOWED");};n.Hb=function(){throw Error("E_CSS_COMMA_NOT_ALLOWED");};n.vb=function(){throw Error("E_CSS_FUNC_NOT_ALLOWED");};n.hc=function(){throw Error("E_CSS_EXPR_NOT_ALLOWED");};function nc(){}u(nc,mc);n=nc.prototype;
n.Jb=function(a){for(var b=null,c=0;c<a.length;c++){var d=a[c],e=d.aa(this);if(b)b[c]=e;else if(d!==e){b=Array(a.length);for(d=0;d<c;d++)b[d]=a[d];b[c]=e}}return b||a};n.Hc=function(a){return a};n.Ib=function(a){return a};n.Od=function(a){return a};n.kc=function(a){return a};n.jc=function(a){return a};n.ic=function(a){return a};n.gd=function(a){return a};n.lc=function(a){return a};n.sb=function(a){var b=this.Jb(a.values);return b===a.values?a:new oc(b)};
n.Hb=function(a){var b=this.Jb(a.values);return b===a.values?a:new pc(b)};n.vb=function(a){var b=this.Jb(a.values);return b===a.values?a:new qc(a.name,b)};n.hc=function(a){return a};function rc(){}n=rc.prototype;n.toString=function(){var a=new ya;this.Ka(a,!0);return a.toString()};n.stringValue=function(){var a=new ya;this.Ka(a,!1);return a.toString()};n.oa=function(){throw Error("F_ABSTRACT");};n.Ka=function(a){a.append("[error]")};n.$d=function(){return!1};n.Rb=function(){return!1};n.be=function(){return!1};
n.ye=function(){return!1};n.Rc=function(){return!1};function sc(){if(B)throw Error("E_INVALID_CALL");}u(sc,rc);sc.prototype.oa=function(a){return new nb(a,"")};sc.prototype.Ka=function(){};sc.prototype.aa=function(a){return a.Nd(this)};var B=new sc;function tc(){if(uc)throw Error("E_INVALID_CALL");}u(tc,rc);tc.prototype.oa=function(a){return new nb(a,"/")};tc.prototype.Ka=function(a){a.append("/")};tc.prototype.aa=function(a){return a.Od(this)};var uc=new tc;function vc(a){this.gc=a}u(vc,rc);
vc.prototype.oa=function(a){return new nb(a,this.gc)};vc.prototype.Ka=function(a,b){b?(a.append('"'),a.append(Ba(this.gc)),a.append('"')):a.append(this.gc)};vc.prototype.aa=function(a){return a.Hc(this)};function wc(a){this.name=a;if(kc[a])throw Error("E_INVALID_CALL");kc[a]=this}u(wc,rc);wc.prototype.oa=function(a){return new nb(a,this.name)};wc.prototype.Ka=function(a,b){b?a.append(Aa(this.name)):a.append(this.name)};wc.prototype.aa=function(a){return a.Ib(this)};wc.prototype.ye=function(){return!0};
function C(a){var b=kc[a];b||(b=new wc(a));return b}function D(a,b){this.I=a;this.fa=b.toLowerCase()}u(D,rc);D.prototype.oa=function(a,b){return this.I?b&&"%"==this.fa?100==this.I?b:new Yb(a,b,new nb(a,this.I/100)):new ac(a,this.I,this.fa):a.b};D.prototype.Ka=function(a){a.append(this.I.toString());a.append(this.fa)};D.prototype.aa=function(a){return a.kc(this)};D.prototype.Rb=function(){return!0};function xc(a){this.I=a}u(xc,rc);
xc.prototype.oa=function(a){return this.I?1==this.I?a.f:new nb(a,this.I):a.b};xc.prototype.Ka=function(a){a.append(this.I.toString())};xc.prototype.aa=function(a){return a.jc(this)};xc.prototype.be=function(){return!0};function yc(a){this.I=a}u(yc,xc);yc.prototype.aa=function(a){return a.ic(this)};function zc(a){this.f=a}u(zc,rc);zc.prototype.Ka=function(a){a.append("#");var b=this.f.toString(16);a.append("000000".substr(b.length));a.append(b)};zc.prototype.aa=function(a){return a.gd(this)};
function Ac(a){this.url=a}u(Ac,rc);Ac.prototype.Ka=function(a){a.append('url("');a.append(Ba(this.url));a.append('")')};Ac.prototype.aa=function(a){return a.lc(this)};function Bc(a,b,c,d){var e=b.length;b[0].Ka(a,d);for(var f=1;f<e;f++)a.append(c),b[f].Ka(a,d)}function oc(a){this.values=a}u(oc,rc);oc.prototype.Ka=function(a,b){Bc(a,this.values," ",b)};oc.prototype.aa=function(a){return a.sb(this)};oc.prototype.Rc=function(){return!0};function pc(a){this.values=a}u(pc,rc);
pc.prototype.Ka=function(a,b){Bc(a,this.values,",",b)};pc.prototype.aa=function(a){return a.Hb(this)};function qc(a,b){this.name=a;this.values=b}u(qc,rc);qc.prototype.Ka=function(a,b){a.append(Aa(this.name));a.append("(");Bc(a,this.values,",",b);a.append(")")};qc.prototype.aa=function(a){return a.vb(this)};function E(a){this.b=a}u(E,rc);E.prototype.oa=function(){return this.b};E.prototype.Ka=function(a){a.append("-epubx-expr(");this.b.ta(a,0);a.append(")")};E.prototype.aa=function(a){return a.hc(this)};
E.prototype.$d=function(){return!0};function Cc(a,b){if(a){if(a.Rb())return xb(b,a.fa,!1)*a.I;if(a.be())return a.I}return 0}var Dc=C("absolute"),Ec=C("all"),Fc=C("always"),Gc=C("auto");C("avoid");var Hc=C("block"),Ic=C("block-end"),Jc=C("block-start"),Kc=C("both"),Lc=C("bottom"),Mc=C("border-box"),Nc=C("break-all"),Oc=C("break-word"),Pc=C("crop"),Qc=C("cross");C("column");var Rc=C("exclusive"),Sc=C("false"),Tc=C("fixed"),Uc=C("flex"),Vc=C("footnote");C("hidden");
var Wc=C("horizontal-tb"),Xc=C("inherit"),Yc=C("inline"),Zc=C("inline-block"),$c=C("inline-end"),ad=C("inline-start"),bd=C("landscape"),cd=C("left"),dd=C("list-item"),ed=C("ltr");C("manual");var F=C("none"),fd=C("normal"),gd=C("oeb-page-foot"),hd=C("oeb-page-head"),id=C("page"),jd=C("relative"),kd=C("right"),ld=C("scale");C("spread");var md=C("static"),nd=C("rtl"),od=C("table"),pd=C("table-caption"),qd=C("table-cell");C("table-row");
var rd=C("top"),sd=C("transparent"),td=C("vertical-lr"),ud=C("vertical-rl"),vd=C("visible"),wd=C("true"),xd=new D(100,"%"),yd=new D(100,"vw"),zd=new D(100,"vh"),Ad=new D(0,"px"),Bd={"font-size":1,color:2};function Cd(a,b){return(Bd[a]||Number.MAX_VALUE)-(Bd[b]||Number.MAX_VALUE)};var Dd={SIMPLE_PROPERTY:"SIMPLE_PROPERTY",PREPROCESS_TEXT_CONTENT:"PREPROCESS_TEXT_CONTENT",PREPROCESS_ELEMENT_STYLE:"PREPROCESS_ELEMENT_STYLE",POLYFILLED_INHERITED_PROPS:"POLYFILLED_INHERITED_PROPS",CONFIGURATION:"CONFIGURATION",RESOLVE_TEXT_NODE_BREAKER:"RESOLVE_TEXT_NODE_BREAKER",RESOLVE_FORMATTING_CONTEXT:"RESOLVE_FORMATTING_CONTEXT",RESOLVE_LAYOUT_PROCESSOR:"RESOLVE_LAYOUT_PROCESSOR"},Ed={};
function Fd(a,b){if(Dd[a]){var c=Ed[a];c||(c=Ed[a]=[]);c.push(b)}else v.b(Error("Skipping unknown plugin hook '"+a+"'."))}ba("vivliostyle.plugin.registerHook",Fd);ba("vivliostyle.plugin.removeHook",function(a,b){if(Dd[a]){var c=Ed[a];if(c){var d=c.indexOf(b);0<=d&&c.splice(d,1)}}else v.b(Error("Ignoring unknown plugin hook '"+a+"'."))});var Gd=null,Hd=null;function I(a){if(!Gd)throw Error("E_TASK_NO_CONTEXT");Gd.name||(Gd.name=a);var b=Gd;a=new Id(b,b.top,a);b.top=a;a.b=Jd;return a}function J(a){return new Kd(a)}function Ld(a,b,c){a=I(a);a.j=c;try{b(a)}catch(d){Md(a.f,d,a)}return K(a)}function Nd(a){var b=Od,c;Gd?c=Gd.f:(c=Hd)||(c=new Pd(new Qd));b(c,a,void 0)}var Jd=1;function Qd(){}Qd.prototype.currentTime=function(){return(new Date).valueOf()};function Rd(a,b){return setTimeout(a,b)}
function Pd(a){this.g=a;this.h=1;this.slice=25;this.l=0;this.f=new pa;this.b=this.u=null;this.j=!1;this.order=0;Hd||(Hd=this)}
function Sd(a){if(!a.j){var b=a.f.b[1].b,c=a.g.currentTime();if(null!=a.b){if(c+a.h>a.u)return;clearTimeout(a.b)}b-=c;b<=a.h&&(b=a.h);a.u=c+b;a.b=Rd(function(){a.b=null;null!=a.b&&(clearTimeout(a.b),a.b=null);a.j=!0;try{var b=a.g.currentTime();for(a.l=b+a.slice;a.f.length();){var c=a.f.b[1];if(c.b>b)break;var f=a.f,g=f.b.pop(),h=f.b.length;if(1<h){for(var l=1;;){var k=2*l;if(k>=h)break;if(0<Td(f.b[k],g))k+1<h&&0<Td(f.b[k+1],f.b[k])&&k++;else if(k+1<h&&0<Td(f.b[k+1],g))k++;else break;f.b[l]=f.b[k];
l=k}f.b[l]=g}if(!c.h){var l=c,m=l.f;l.f=null;m&&m.b==l&&(m.b=null,k=Gd,Gd=m,M(m.top,l.g),Gd=k)}b=a.g.currentTime();if(b>=a.l)break}}catch(p){v.error(p)}a.j=!1;a.f.length()&&Sd(a)},b)}}Pd.prototype.Za=function(a,b){var c=this.g.currentTime();a.order=this.order++;a.b=c+(b||0);a:{for(var c=this.f,d=c.b.length;1<d;){var e=Math.floor(d/2),f=c.b[e];if(0<Td(f,a)){c.b[d]=a;break a}c.b[d]=f;d=e}c.b[1]=a}Sd(this)};
function Od(a,b,c){var d=new Ud(a,c||"");d.top=new Id(d,null,"bootstrap");d.top.b=Jd;d.top.then(function(){function a(){d.l=!1;for(var a=0;a<d.j.length;a++){var b=d.j[a];try{b()}catch(h){v.error(h)}}}try{b().then(function(b){d.h=b;a()})}catch(f){Md(d,f),a()}});c=Gd;Gd=d;a.Za(Vd(d.top,"bootstrap"));Gd=c;return d}function Wd(a){this.f=a;this.order=this.b=0;this.g=null;this.h=!1}function Td(a,b){return b.b-a.b||b.order-a.order}Wd.prototype.Za=function(a,b){this.g=a;this.f.f.Za(this,b)};
function Ud(a,b){this.f=a;this.name=b;this.j=[];this.g=null;this.l=!0;this.b=this.top=this.u=this.h=null}function Xd(a,b){a.j.push(b)}Ud.prototype.join=function(){var a=I("Task.join");if(this.l){var b=Vd(a,this),c=this;Xd(this,function(){b.Za(c.h)})}else M(a,this.h);return K(a)};
function Md(a,b,c){var d=b.frameTrace;if(!d){for(var d=b.stack?b.stack+"\n\t---- async ---\n":"",e=a.top;e;e=e.parent)d+="\t",d+=e.name,d+="\n";b.frameTrace=d}if(c){for(d=a.top;d&&d!=c;)d=d.parent;d==c&&(a.top=d)}for(a.g=b;a.top&&!a.top.j;)a.top=a.top.parent;a.top?(b=a.g,a.g=null,a.top.j(a.top,b)):a.g&&v.error(a.g,"Unhandled exception in task",a.name)}function Kd(a){this.value=a}n=Kd.prototype;n.then=function(a){a(this.value)};n.xa=function(a){return a(this.value)};n.Ld=function(a){return new Kd(a)};
n.Da=function(a){M(a,this.value)};n.ua=function(){return!1};n.get=function(){return this.value};function Yd(a){this.b=a}n=Yd.prototype;n.then=function(a){this.b.then(a)};n.xa=function(a){if(this.ua()){var b=new Id(this.b.f,this.b.parent,"AsyncResult.thenAsync");b.b=Jd;this.b.parent=b;this.b.then(function(c){a(c).then(function(a){M(b,a)})});return K(b)}return a(this.b.g)};n.Ld=function(a){return this.ua()?this.xa(function(){return new Kd(a)}):new Kd(a)};
n.Da=function(a){this.ua()?this.then(function(b){M(a,b)}):M(a,this.b.g)};n.ua=function(){return this.b.b==Jd};n.get=function(){if(this.ua())throw Error("Result is pending");return this.b.g};function Id(a,b,c){this.f=a;this.parent=b;this.name=c;this.g=null;this.b=0;this.j=this.h=null}function Zd(a){if(!Gd)throw Error("F_TASK_NO_CONTEXT");if(a!==Gd.top)throw Error("F_TASK_NOT_TOP_FRAME");}function K(a){return new Yd(a)}
function M(a,b){Zd(a);Gd.g||(a.g=b);a.b=2;var c=a.parent;Gd.top=c;if(a.h){try{a.h(b)}catch(d){Md(a.f,d,c)}a.b=3}}Id.prototype.then=function(a){switch(this.b){case Jd:if(this.h)throw Error("F_TASK_FRAME_ALREADY_HAS_CALLBACK");this.h=a;break;case 2:var b=this.f,c=this.parent;try{a(this.g),this.b=3}catch(d){this.b=3,Md(b,d,c)}break;case 3:throw Error("F_TASK_DEAD_FRAME");default:throw Error("F_TASK_UNEXPECTED_FRAME_STATE "+this.b);}};
function $d(){var a=I("Frame.timeSlice"),b=a.f.f;b.g.currentTime()>=b.l?(v.debug("-- time slice --"),Vd(a).Za(!0)):M(a,!0);return K(a)}function ae(a){var b=I("Frame.sleep");Vd(b).Za(!0,a);return K(b)}function be(a){function b(d){try{for(;d;){var e=a();if(e.ua()){e.then(b);return}e.then(function(a){d=a})}M(c,!0)}catch(f){Md(c.f,f,c)}}var c=I("Frame.loop");b(!0);return K(c)}
function ce(a){var b=Gd;if(!b)throw Error("E_TASK_NO_CONTEXT");return be(function(){var c;do c=new de(b,b.top),b.top=c,c.b=Jd,a(c),c=K(c);while(!c.ua()&&c.get());return c})}function Vd(a,b){Zd(a);if(a.f.b)throw Error("E_TASK_ALREADY_SUSPENDED");var c=new Wd(a.f);a.f.b=c;Gd=null;a.f.u=b||null;return c}function de(a,b){Id.call(this,a,b,"loop")}u(de,Id);function ee(a){M(a,!0)}function N(a){M(a,!1)};function fe(a,b){this.fetch=a;this.name=b;this.f=!1;this.b=this.h=null;this.g=[]}fe.prototype.start=function(){if(!this.b){var a=this;this.b=Od(Gd.f,function(){var b=I("Fetcher.run");a.fetch().then(function(c){var d=a.g;a.f=!0;a.h=c;a.b=null;a.g=[];if(d)for(var e=0;e<d.length;e++)try{d[e](c)}catch(f){v.error(f,"Error:")}M(b,c)});return K(b)},this.name)}};function ge(a,b){a.f?b(a.h):a.g.push(b)}fe.prototype.get=function(){if(this.f)return J(this.h);this.start();return this.b.join()};
function he(a){if(!a.length)return J(!0);if(1==a.length)return a[0].get().Ld(!0);var b=I("waitForFetches"),c=0;be(function(){for(;c<a.length;){var b=a[c++];if(!b.f)return b.get().Ld(!0)}return J(!1)}).then(function(){M(b,!0)});return K(b)}
function ie(a,b){var c=null,d=null;"img"==a.localName&&(c=a.getAttribute("width"),d=a.getAttribute("height"));var e=new fe(function(){function e(b){l||(l=!0,"img"==a.localName&&(c||a.removeAttribute("width"),d||a.removeAttribute("height")),h.Za(b?b.type:"timeout"))}var g=I("loadImage"),h=Vd(g,a),l=!1;a.addEventListener("load",e,!1);a.addEventListener("error",e,!1);a.addEventListener("abort",e,!1);"http://www.w3.org/2000/svg"==a.namespaceURI?(a.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",
b),setTimeout(e,300)):a.src=b;return K(g)},"loadElement "+b);e.start();return e};function je(a){a=a.substr(1);if(a.match(/^[^0-9a-fA-F\n\r]$/))return a;a=parseInt(a,16);return isNaN(a)?"":65535>=a?String.fromCharCode(a):1114111>=a?String.fromCharCode(55296|a>>10&1023,56320|a&1023):"\ufffd"}function ke(a){return a.replace(/\\([0-9a-fA-F]{0,6}(\r\n|[ \n\r\t\f])?|[^0-9a-fA-F\n\r])/g,je)}function le(){this.type=0;this.b=!1;this.I=0;this.text="";this.position=0}
function me(a,b){var c=Array(128),d;for(d=0;128>d;d++)c[d]=a;c[NaN]=35==a?35:72;for(d=0;d<b.length;d+=2)c[b[d]]=b[d+1];return c}var ne=[72,72,72,72,72,72,72,72,72,1,1,72,1,1,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,1,4,34,6,7,8,9,33,10,11,12,13,14,15,16,17,2,2,2,2,2,2,2,2,2,2,18,19,20,21,22,23,24,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,25,29,26,30,3,72,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,27,31,28,32,72];ne[NaN]=80;
var oe=[43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,52,43,43,43,43,39,43,43,39,39,39,39,39,39,39,39,39,39,43,43,43,43,43,43,43,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,43,44,43,43,39,43,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,43,43,43,43,43];oe[NaN]=43;
var pe=[72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,78,59,72,59,59,59,59,59,59,59,59,59,59,72,72,72,72,72,72,72,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,72,61,72,72,78,72,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,72,72,72,72,72];oe[NaN]=43;
var qe=[35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,57,59,35,58,58,58,58,58,58,58,58,58,58,35,35,35,35,35,35,35,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,35,61,35,35,60,35,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,35,35,35,35,35];qe[NaN]=35;
var re=[45,45,45,45,45,45,45,45,45,73,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,73,45,45,45,45,45,45,45,53,45,45,45,45,45,45,45,39,39,39,39,39,39,39,39,39,39,45,45,45,45,45,45,45,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,45,44,45,45,39,45,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,45,45,45,45,45];re[NaN]=45;
var se=[37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,41,37,37,37,37,37,37,37,37,42,37,39,39,39,39,39,39,39,39,39,39,37,37,37,37,37,37,37,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,37,37,37,37,40,37,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,37,37,37,37,37];se[NaN]=37;
var te=[38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,41,38,38,38,38,38,38,38,38,38,38,39,39,39,39,39,39,39,39,39,39,38,38,38,38,38,38,38,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,38,38,38,38,40,38,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,38,38,38,38,38];te[NaN]=38;
var ue=me(35,[61,36]),ve=me(35,[58,77]),we=me(35,[61,36,124,50]),xe=me(35,[38,51]),ye=me(35,[42,54]),ze=me(39,[42,55]),Ae=me(54,[42,55,47,56]),Be=me(62,[62,56]),Ce=me(35,[61,36,33,70]),De=me(62,[45,71]),Ee=me(63,[45,56]),Fe=me(76,[9,72,10,72,13,72,32,72]),Ge=me(39,[39,46,10,72,13,72,92,48]),He=me(39,[34,46,10,72,13,72,92,49]),Ie=me(39,[39,47,10,74,13,74,92,48]),Je=me(39,[34,47,10,74,13,74,92,49]),Ke=me(64,[9,39,32,39,34,66,39,65,41,72,10,39,13,39]),Le=me(39,[41,67,9,79,10,79,13,79,32,79,92,75,40,
72,91,72,93,72,123,72,125,72,NaN,67]),Me=me(39,[39,68,10,74,13,74,92,75,NaN,67]),Ne=me(39,[34,68,10,74,13,74,92,75,NaN,67]),Oe=me(72,[9,39,10,39,13,39,32,39,41,69]);function Pe(a,b){this.l=b;this.g=15;this.u=a;this.j=Array(this.g+1);this.b=-1;for(var c=this.position=this.f=this.h=0;c<=this.g;c++)this.j[c]=new le}function O(a){a.h==a.f&&Qe(a);return a.j[a.f]}function Q(a,b){(a.h-a.f&a.g)<=b&&Qe(a);return a.j[a.f+b&a.g]}function R(a){a.f=a.f+1&a.g}
function Re(a){if(0>a.b)throw Error("F_CSSTOK_BAD_CALL reset");a.f=a.b;a.b=-1}Pe.prototype.error=function(a,b,c){this.l&&this.l.error(c,b)};
function Qe(a){var b=a.h,c=0<=a.b?a.b:a.f,d=a.g;b>=c?c+=d:c--;if(c==b){if(0>a.b)throw Error("F_CSSTOK_INTERNAL");for(var b=2*(a.g+1)-1,c=Array(b+1),d=a.b,e=0;d!=a.h;)c[e]=a.j[d],d==a.f&&(a.f=e),d=d+1&a.g,e++;a.b=0;a.h=e;a.g=b;for(a.j=c;e<=b;)c[e++]=new le;b=a.h;c=d=a.g}for(var e=ne,f=a.u,g=a.position,h=a.j,l=0,k=0,m="",p=0,q=!1,x=h[b],r=-9;;){var t=f.charCodeAt(g);switch(e[t]||e[65]){case 72:l=51;m=isNaN(t)?"E_CSS_UNEXPECTED_EOF":"E_CSS_UNEXPECTED_CHAR";g++;break;case 1:g++;q=!0;continue;case 2:k=
g++;e=se;continue;case 3:l=1;k=g++;e=oe;continue;case 4:k=g++;l=31;e=ue;continue;case 33:l=2;k=++g;e=Ge;continue;case 34:l=2;k=++g;e=He;continue;case 6:k=++g;l=7;e=oe;continue;case 7:k=g++;l=32;e=ue;continue;case 8:k=g++;l=21;break;case 9:k=g++;l=32;e=xe;continue;case 10:k=g++;l=10;break;case 11:k=g++;l=11;break;case 12:k=g++;l=36;e=ue;continue;case 13:k=g++;l=23;break;case 14:k=g++;l=16;break;case 15:l=24;k=g++;e=qe;continue;case 16:k=g++;e=pe;continue;case 78:k=g++;l=9;e=oe;continue;case 17:k=g++;
l=19;e=ye;continue;case 18:k=g++;l=18;e=ve;continue;case 77:g++;l=50;break;case 19:k=g++;l=17;break;case 20:k=g++;l=38;e=Ce;continue;case 21:k=g++;l=39;e=ue;continue;case 22:k=g++;l=37;e=ue;continue;case 23:k=g++;l=22;break;case 24:k=++g;l=20;e=oe;continue;case 25:k=g++;l=14;break;case 26:k=g++;l=15;break;case 27:k=g++;l=12;break;case 28:k=g++;l=13;break;case 29:r=k=g++;l=1;e=Fe;continue;case 30:k=g++;l=33;e=ue;continue;case 31:k=g++;l=34;e=we;continue;case 32:k=g++;l=35;e=ue;continue;case 35:break;
case 36:g++;l=l+41-31;break;case 37:l=5;p=parseInt(f.substring(k,g),10);break;case 38:l=4;p=parseFloat(f.substring(k,g));break;case 39:g++;continue;case 40:l=3;p=parseFloat(f.substring(k,g));k=g++;e=oe;continue;case 41:l=3;p=parseFloat(f.substring(k,g));m="%";k=g++;break;case 42:g++;e=te;continue;case 43:m=f.substring(k,g);break;case 44:r=g++;e=Fe;continue;case 45:m=ke(f.substring(k,g));break;case 46:m=f.substring(k,g);g++;break;case 47:m=ke(f.substring(k,g));g++;break;case 48:r=g;g+=2;e=Ie;continue;
case 49:r=g;g+=2;e=Je;continue;case 50:g++;l=25;break;case 51:g++;l=26;break;case 52:m=f.substring(k,g);if(1==l){g++;if("url"==m.toLowerCase()){e=Ke;continue}l=6}break;case 53:m=ke(f.substring(k,g));if(1==l){g++;if("url"==m.toLowerCase()){e=Ke;continue}l=6}break;case 54:e=ze;g++;continue;case 55:e=Ae;g++;continue;case 56:e=ne;g++;continue;case 57:e=Be;g++;continue;case 58:l=5;e=se;g++;continue;case 59:l=4;e=te;g++;continue;case 60:l=1;e=oe;g++;continue;case 61:l=1;e=Fe;r=g++;continue;case 62:g--;
break;case 63:g-=2;break;case 64:k=g++;e=Le;continue;case 65:k=++g;e=Me;continue;case 66:k=++g;e=Ne;continue;case 67:l=8;m=ke(f.substring(k,g));g++;break;case 69:g++;break;case 70:e=De;g++;continue;case 71:e=Ee;g++;continue;case 79:if(8>g-r&&f.substring(r+1,g+1).match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])|[ \t]$/)){g++;continue}case 68:l=8;m=ke(f.substring(k,g));g++;e=Oe;continue;case 74:g++;if(9>g-r&&f.substring(r+1,g).match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])$/))continue;l=51;m="E_CSS_UNEXPECTED_NEWLINE";
break;case 73:if(9>g-r&&f.substring(r+1,g+1).match(/^[0-9a-fA-F]{0,6}[ \t]$/)){g++;continue}m=ke(f.substring(k,g));break;case 75:r=g++;continue;case 76:g++;e=re;continue;default:e!==ne?(l=51,m="E_CSS_UNEXPECTED_STATE"):(k=g,l=0)}x.type=l;x.b=q;x.I=p;x.text=m;x.position=k;b++;if(b>=c)break;e=ne;q=!1;x=h[b&d]}a.position=g;a.h=b&d};function Se(a,b,c,d,e){var f=I("ajax"),g=new XMLHttpRequest,h=Vd(f,g),l={status:0,url:a,contentType:null,responseText:null,responseXML:null,Wc:null};g.open(c||"GET",a,!0);b&&(g.responseType=b);g.onreadystatechange=function(){if(4===g.readyState){l.status=g.status;if(200==l.status||!l.status)if(b&&"document"!==b||!g.responseXML){var c=g.response;b&&"text"!==b||"string"!=typeof c?c?"string"==typeof c?l.Wc=Te([c]):l.Wc=c:v.b("Unexpected empty success response for",a):l.responseText=c;if(c=g.getResponseHeader("Content-Type"))l.contentType=
c.replace(/(.*);.*$/,"$1")}else l.responseXML=g.responseXML,l.contentType=g.responseXML.contentType;h.Za(l)}};try{d?(g.setRequestHeader("Content-Type",e||"text/plain; charset=UTF-8"),g.send(d)):g.send(null)}catch(k){v.b(k,"Error fetching "+a),h.Za(l)}return K(f)}function Te(a){var b=window.WebKitBlobBuilder||window.MSBlobBuilder;if(b){for(var b=new b,c=0;c<a.length;c++)b.append(a[c]);return b.getBlob("application/octet-stream")}return new Blob(a,{type:"application/octet-stream"})}
function Ue(a){var b=I("readBlob"),c=new FileReader,d=Vd(b,c);c.addEventListener("load",function(){d.Za(c.result)},!1);c.readAsArrayBuffer(a);return K(b)}function Ve(a,b){this.W=a;this.type=b;this.h={};this.j={}}Ve.prototype.load=function(a,b,c){a=ha(a);var d=this.h[a];return"undefined"!=typeof d?J(d):this.fetch(a,b,c).get()};
function We(a,b,c,d){var e=I("fetch");Se(b,a.type).then(function(f){if(c&&400<=f.status)throw Error(d||"Failed to fetch required resource: "+b);a.W(f,a).then(function(c){delete a.j[b];a.h[b]=c;M(e,c)})});return K(e)}Ve.prototype.fetch=function(a,b,c){a=ha(a);if(this.h[a])return null;var d=this.j[a];if(!d){var e=this,d=new fe(function(){return We(e,a,b,c)},"Fetch "+a);e.j[a]=d;d.start()}return d};Ve.prototype.get=function(a){return this.h[ha(a)]};
function Xe(a){a=a.responseText;return J(a?JSON.parse(a):null)};function Ye(a){var b=parseInt(a,16);if(isNaN(b))throw Error("E_CSS_COLOR");if(6==a.length)return new zc(b);if(3==a.length)return new zc(b&15|(b&15)<<4|(b&240)<<4|(b&240)<<8|(b&3840)<<8|(b&3840)<<12);throw Error("E_CSS_COLOR");}function Ze(a){this.f=a;this.Wa="Author"}n=Ze.prototype;n.tc=function(){return null};n.ga=function(){return this.f};n.error=function(){};n.fc=function(a){this.Wa=a};n.ub=function(){};n.pd=function(){};n.xc=function(){};n.yc=function(){};n.wd=function(){};n.Lc=function(){};
n.yb=function(){};n.od=function(){};n.kd=function(){};n.sd=function(){};n.cc=function(){};n.rb=function(){};n.$c=function(){};n.Bc=function(){};n.dd=function(){};n.Yc=function(){};n.cd=function(){};n.ec=function(){};n.Kd=function(){};n.Vb=function(){};n.Zc=function(){};n.bd=function(){};n.ad=function(){};n.Ec=function(){};n.Dc=function(){};n.wa=function(){};n.pb=function(){};n.zb=function(){};n.Cc=function(){};n.Nc=function(){};
function $e(a){switch(a.Wa){case "UA":return 0;case "User":return 100663296;default:return 83886080}}function af(a){switch(a.Wa){case "UA":return 0;case "User":return 16777216;default:return 33554432}}function bf(){Ze.call(this,null);this.g=[];this.b=null}u(bf,Ze);function cf(a,b){a.g.push(a.b);a.b=b}n=bf.prototype;n.tc=function(){return null};n.ga=function(){return this.b.ga()};n.error=function(a,b){this.b.error(a,b)};
n.fc=function(a){Ze.prototype.fc.call(this,a);0<this.g.length&&(this.b=this.g[0],this.g=[]);this.b.fc(a)};n.ub=function(a,b){this.b.ub(a,b)};n.pd=function(a){this.b.pd(a)};n.xc=function(a,b){this.b.xc(a,b)};n.yc=function(a,b){this.b.yc(a,b)};n.wd=function(a){this.b.wd(a)};n.Lc=function(a,b,c,d){this.b.Lc(a,b,c,d)};n.yb=function(){this.b.yb()};n.od=function(){this.b.od()};n.kd=function(){this.b.kd()};n.sd=function(){this.b.sd()};n.cc=function(){this.b.cc()};n.rb=function(){this.b.rb()};n.$c=function(){this.b.$c()};
n.Bc=function(a){this.b.Bc(a)};n.dd=function(){this.b.dd()};n.Yc=function(){this.b.Yc()};n.cd=function(){this.b.cd()};n.ec=function(){this.b.ec()};n.Kd=function(a){this.b.Kd(a)};n.Vb=function(a){this.b.Vb(a)};n.Zc=function(a){this.b.Zc(a)};n.bd=function(){this.b.bd()};n.ad=function(a,b,c){this.b.ad(a,b,c)};n.Ec=function(a,b,c){this.b.Ec(a,b,c)};n.Dc=function(a,b,c){this.b.Dc(a,b,c)};n.wa=function(){this.b.wa()};n.pb=function(a,b,c){this.b.pb(a,b,c)};n.zb=function(){this.b.zb()};n.Cc=function(a){this.b.Cc(a)};
n.Nc=function(){this.b.Nc()};function df(a,b,c){Ze.call(this,a);this.J=c;this.H=0;if(this.ia=b)this.Wa=b.Wa}u(df,Ze);df.prototype.tc=function(){return this.ia.tc()};df.prototype.error=function(a){v.b(a)};df.prototype.wa=function(){this.H++};df.prototype.zb=function(){if(!--this.H&&!this.J){var a=this.ia;a.b=a.g.pop()}};function ef(a,b,c){df.call(this,a,b,c)}u(ef,df);function ff(a,b){a.error(b,a.tc())}function gf(a,b){ff(a,b);cf(a.ia,new df(a.f,a.ia,!1))}n=ef.prototype;n.rb=function(){gf(this,"E_CSS_UNEXPECTED_SELECTOR")};
n.$c=function(){gf(this,"E_CSS_UNEXPECTED_FONT_FACE")};n.Bc=function(){gf(this,"E_CSS_UNEXPECTED_FOOTNOTE")};n.dd=function(){gf(this,"E_CSS_UNEXPECTED_VIEWPORT")};n.Yc=function(){gf(this,"E_CSS_UNEXPECTED_DEFINE")};n.cd=function(){gf(this,"E_CSS_UNEXPECTED_REGION")};n.ec=function(){gf(this,"E_CSS_UNEXPECTED_PAGE")};n.Vb=function(){gf(this,"E_CSS_UNEXPECTED_WHEN")};n.Zc=function(){gf(this,"E_CSS_UNEXPECTED_FLOW")};n.bd=function(){gf(this,"E_CSS_UNEXPECTED_PAGE_TEMPLATE")};n.ad=function(){gf(this,"E_CSS_UNEXPECTED_PAGE_MASTER")};
n.Ec=function(){gf(this,"E_CSS_UNEXPECTED_PARTITION")};n.Dc=function(){gf(this,"E_CSS_UNEXPECTED_PARTITION_GROUP")};n.Cc=function(){gf(this,"E_CSS_UNEXPECTED_SELECTOR_FUNC")};n.Nc=function(){gf(this,"E_CSS_UNEXPECTED_END_SELECTOR_FUNC")};n.pb=function(){this.error("E_CSS_UNEXPECTED_PROPERTY",this.tc())};var hf=[],jf=[],S=[],kf=[],lf=[],mf=[],nf=[],of=[],pf=[],qf=[],rf=[],sf=[],tf=[];hf[1]=28;hf[36]=29;hf[7]=29;hf[9]=29;hf[14]=29;hf[18]=29;hf[20]=30;hf[13]=27;hf[0]=200;jf[1]=46;jf[0]=200;mf[1]=2;
mf[36]=4;mf[7]=6;mf[9]=8;mf[14]=10;mf[18]=14;S[37]=11;S[23]=12;S[35]=56;S[1]=1;S[36]=3;S[7]=5;S[9]=7;S[14]=9;S[12]=13;S[18]=55;S[50]=42;S[16]=41;kf[1]=1;kf[36]=3;kf[7]=5;kf[9]=7;kf[14]=9;kf[11]=200;kf[18]=55;lf[1]=2;lf[36]=4;lf[7]=6;lf[9]=8;lf[18]=14;lf[50]=42;lf[14]=10;lf[12]=13;nf[1]=15;nf[7]=16;nf[4]=17;nf[5]=18;nf[3]=19;nf[2]=20;nf[8]=21;nf[16]=22;nf[19]=23;nf[6]=24;nf[11]=25;nf[17]=26;nf[13]=48;nf[31]=47;nf[23]=54;nf[0]=44;of[1]=31;of[4]=32;of[5]=32;of[3]=33;of[2]=34;of[10]=40;of[6]=38;
of[31]=36;of[24]=36;of[32]=35;pf[1]=45;pf[16]=37;pf[37]=37;pf[38]=37;pf[47]=37;pf[48]=37;pf[39]=37;pf[49]=37;pf[26]=37;pf[25]=37;pf[23]=37;pf[24]=37;pf[19]=37;pf[21]=37;pf[36]=37;pf[18]=37;pf[22]=37;pf[11]=39;pf[12]=43;pf[17]=49;qf[0]=200;qf[12]=50;qf[13]=51;qf[14]=50;qf[15]=51;qf[10]=50;qf[11]=51;qf[17]=53;rf[0]=200;rf[12]=50;rf[13]=52;rf[14]=50;rf[15]=51;rf[10]=50;rf[11]=51;rf[17]=53;sf[0]=200;sf[12]=50;sf[13]=51;sf[14]=50;sf[15]=51;sf[10]=50;sf[11]=51;tf[11]=0;tf[16]=0;tf[22]=1;tf[18]=1;
tf[26]=2;tf[25]=2;tf[38]=3;tf[37]=3;tf[48]=3;tf[47]=3;tf[39]=3;tf[49]=3;tf[41]=3;tf[23]=4;tf[24]=4;tf[36]=5;tf[19]=5;tf[21]=5;tf[0]=6;tf[52]=2;function uf(a,b,c,d){this.b=a;this.f=b;this.u=c;this.ha=d;this.F=[];this.R={};this.g=this.J=null;this.C=!1;this.j=2;this.G=null;this.H=!1;this.A=this.M=null;this.l=[];this.h=[];this.V=this.W=!1}function vf(a,b){for(var c=[],d=a.F;;){c.push(d[b++]);if(b==d.length)break;if(","!=d[b++])throw Error("Unexpected state");}return c}
function wf(a,b,c){var d=a.F,e=d.length,f;do f=d[--e];while("undefined"!=typeof f&&"string"!=typeof f);var g=d.length-(e+1);1<g&&d.splice(e+1,g,new oc(d.slice(e+1,d.length)));if(","==b)return null;e++;do f=d[--e];while("undefined"!=typeof f&&("string"!=typeof f||","==f));g=d.length-(e+1);if("("==f){if(")"!=b)return a.u.error("E_CSS_MISMATCHED_C_PAR",c),a.b=rf,null;a=new qc(d[e-1],vf(a,e+1));d.splice(e-1,g+2,a);return null}return";"!=b||0<=e?(a.u.error("E_CSS_UNEXPECTED_VAL_END",c),a.b=rf,null):1<
g?new pc(vf(a,e+1)):d[0]}function xf(a,b,c){a.b=a.g?rf:qf;a.u.error(b,c)}
function yf(a,b,c){for(var d=a.F,e=a.u,f=d.pop(),g;;){var h=d.pop();if(11==b){for(g=[f];16==h;)g.unshift(d.pop()),h=d.pop();if("string"==typeof h){if("{"==h){for(;2<=g.length;)a=g.shift(),c=g.shift(),a=new Pb(e.ga(),a,c),g.unshift(a);d.push(new E(g[0]));return!0}if("("==h){b=d.pop();f=d.pop();f=new dc(e.ga(),kb(f,b),g);b=0;continue}}if(10==h){f.ae()&&(f=new fc(e.ga(),f,null));b=0;continue}}else if("string"==typeof h){d.push(h);break}if(0>h)if(-31==h)f=new Kb(e.ga(),f);else if(-24==h)f=new Lb(e.ga(),
f);else return xf(a,"F_UNEXPECTED_STATE",c),!1;else{if(tf[b]>tf[h]){d.push(h);break}g=d.pop();switch(h){case 26:f=new Mb(e.ga(),g,f);break;case 52:f=new Nb(e.ga(),g,f);break;case 25:f=new Ob(e.ga(),g,f);break;case 38:f=new Qb(e.ga(),g,f);break;case 37:f=new Sb(e.ga(),g,f);break;case 48:f=new Rb(e.ga(),g,f);break;case 47:f=new Tb(e.ga(),g,f);break;case 39:case 49:f=new Ub(e.ga(),g,f);break;case 41:f=new Vb(e.ga(),g,f);break;case 23:f=new Wb(e.ga(),g,f);break;case 24:f=new Xb(e.ga(),g,f);break;case 36:f=
new Yb(e.ga(),g,f);break;case 19:f=new Zb(e.ga(),g,f);break;case 21:f=new $b(e.ga(),g,f);break;case 18:if(1<d.length)switch(d[d.length-1]){case 22:d.pop();f=new ec(e.ga(),d.pop(),g,f);break;case 10:if(g.ae())f=new fc(e.ga(),g,f);else return xf(a,"E_CSS_MEDIA_TEST",c),!1}else return xf(a,"E_CSS_EXPR_COND",c),!1;break;case 22:if(18!=b)return xf(a,"E_CSS_EXPR_COND",c),!1;case 10:return d.push(g),d.push(h),d.push(f),!1;default:return xf(a,"F_UNEXPECTED_STATE",c),!1}}}d.push(f);return!1}
function zf(a){for(var b=[];;){var c=O(a.f);switch(c.type){case 1:b.push(c.text);break;case 23:b.push("+");break;case 4:case 5:b.push(c.I);break;default:return b}R(a.f)}}
function Af(a){var b=!1,c=O(a.f);if(23===c.type)b=!0,R(a.f),c=O(a.f);else if(1===c.type&&("even"===c.text||"odd"===c.text))return R(a.f),[2,"odd"===c.text?1:0];switch(c.type){case 3:if(b&&0>c.I)break;case 1:if(b&&"-"===c.text.charAt(0))break;if("n"===c.text||"-n"===c.text){if(b&&c.b)break;b="-n"===c.text?-1:1;3===c.type&&(b=c.I);var d=0;R(a.f);var c=O(a.f),e=24===c.type,f=23===c.type||e;f&&(R(a.f),c=O(a.f));if(5===c.type){d=c.I;if(1/d===1/-0){if(d=0,f)break}else if(0>d){if(f)break}else if(0<=d&&!f)break;
R(a.f)}else if(f)break;return[b,e&&0<d?-d:d]}if("n-"===c.text||"-n-"===c.text){if(!b||!c.b)if(b="-n-"===c.text?-1:1,3===c.type&&(b=c.I),R(a.f),c=O(a.f),5===c.type&&!(0>c.I||1/c.I===1/-0))return R(a.f),[b,c.I]}else{if(d=c.text.match(/^n(-[0-9]+)$/)){if(b&&c.b)break;R(a.f);return[3===c.type?c.I:1,parseInt(d[1],10)]}if(d=c.text.match(/^-n(-[0-9]+)$/))return R(a.f),[-1,parseInt(d[1],10)]}break;case 5:if(!b||!(c.b||0>c.I))return R(a.f),[0,c.I]}return null}
function Bf(a,b,c){a=a.u.ga();if(!a)return null;c=c||a.j;if(b){b=b.split(/\s+/);for(var d=0;d<b.length;d++)switch(b[d]){case "vertical":c=hc(a,c,new Kb(a,new bc(a,"pref-horizontal")));break;case "horizontal":c=hc(a,c,new bc(a,"pref-horizontal"));break;case "day":c=hc(a,c,new Kb(a,new bc(a,"pref-night-mode")));break;case "night":c=hc(a,c,new bc(a,"pref-night-mode"));break;default:c=a.h}}return c===a.j?null:new E(c)}
function Cf(a){switch(a.h[a.h.length-1]){case "[selector]":case "font-face":case "-epubx-flow":case "-epubx-viewport":case "-epubx-define":case "-adapt-footnote-area":return!0}return!1}
function Df(a,b,c,d,e,f){var g=a.u,h=a.f,l=a.F,k,m,p,q;e&&(a.j=2,a.F.push("{"));a:for(;0<b;--b)switch(k=O(h),a.b[k.type]){case 28:if(18!=Q(h,1).type){Cf(a)?(g.error("E_CSS_COLON_EXPECTED",Q(h,1)),a.b=rf):(a.b=mf,g.rb());continue}m=Q(h,2);if(!(m.b||1!=m.type&&6!=m.type)){if(0<=h.b)throw Error("F_CSSTOK_BAD_CALL mark");h.b=h.f}a.g=k.text;a.C=!1;R(h);R(h);a.b=nf;l.splice(0,l.length);continue;case 46:if(18!=Q(h,1).type){a.b=rf;g.error("E_CSS_COLON_EXPECTED",Q(h,1));continue}a.g=k.text;a.C=!1;R(h);R(h);
a.b=nf;l.splice(0,l.length);continue;case 29:a.b=mf;g.rb();continue;case 1:if(!k.b){a.b=sf;g.error("E_CSS_SPACE_EXPECTED",k);continue}g.yb();case 2:if(34==Q(h,1).type)if(R(h),R(h),p=a.R[k.text],null!=p)switch(k=O(h),k.type){case 1:g.ub(p,k.text);a.b=f?kf:S;R(h);break;case 36:g.ub(p,null);a.b=f?kf:S;R(h);break;default:a.b=qf,g.error("E_CSS_NAMESPACE",k)}else a.b=qf,g.error("E_CSS_UNDECLARED_PREFIX",k);else g.ub(a.J,k.text),a.b=f?kf:S,R(h);continue;case 3:if(!k.b){a.b=sf;g.error("E_CSS_SPACE_EXPECTED",
k);continue}g.yb();case 4:if(34==Q(h,1).type)switch(R(h),R(h),k=O(h),k.type){case 1:g.ub(null,k.text);a.b=f?kf:S;R(h);break;case 36:g.ub(null,null);a.b=f?kf:S;R(h);break;default:a.b=qf,g.error("E_CSS_NAMESPACE",k)}else g.ub(a.J,null),a.b=f?kf:S,R(h);continue;case 5:k.b&&g.yb();case 6:g.wd(k.text);a.b=f?kf:S;R(h);continue;case 7:k.b&&g.yb();case 8:g.pd(k.text);a.b=f?kf:S;R(h);continue;case 55:k.b&&g.yb();case 14:R(h);k=O(h);b:switch(k.type){case 1:g.xc(k.text,null);R(h);a.b=f?kf:S;continue;case 6:m=
k.text;R(h);switch(m){case "not":a.b=mf;g.Cc("not");Df(a,Number.POSITIVE_INFINITY,!1,!1,!1,!0)?a.b=S:a.b=sf;break a;case "lang":case "href-epub-type":if(k=O(h),1===k.type){p=[k.text];R(h);break}else break b;case "nth-child":case "nth-of-type":case "nth-last-child":case "nth-last-of-type":if(p=Af(a))break;else break b;default:p=zf(a)}k=O(h);if(11==k.type){g.xc(m,p);R(h);a.b=f?kf:S;continue}}g.error("E_CSS_PSEUDOCLASS_SYNTAX",k);a.b=qf;continue;case 42:R(h);k=O(h);switch(k.type){case 1:g.yc(k.text,
null);a.b=f?kf:S;R(h);continue;case 6:if(m=k.text,R(h),p=zf(a),k=O(h),11==k.type){g.yc(m,p);a.b=f?kf:S;R(h);continue}}g.error("E_CSS_PSEUDOELEM_SYNTAX",k);a.b=qf;continue;case 9:k.b&&g.yb();case 10:R(h);k=O(h);if(1==k.type)m=k.text,R(h);else if(36==k.type)m=null,R(h);else if(34==k.type)m="";else{a.b=sf;g.error("E_CSS_ATTR",k);R(h);continue}k=O(h);if(34==k.type){p=m?a.R[m]:m;if(null==p){a.b=sf;g.error("E_CSS_UNDECLARED_PREFIX",k);R(h);continue}R(h);k=O(h);if(1!=k.type){a.b=sf;g.error("E_CSS_ATTR_NAME_EXPECTED",
k);continue}m=k.text;R(h);k=O(h)}else p="";switch(k.type){case 39:case 45:case 44:case 43:case 42:case 46:case 50:q=k.type;R(h);k=O(h);break;case 15:g.Lc(p,m,0,null);a.b=f?kf:S;R(h);continue;default:a.b=sf;g.error("E_CSS_ATTR_OP_EXPECTED",k);continue}switch(k.type){case 1:case 2:g.Lc(p,m,q,k.text);R(h);k=O(h);break;default:a.b=sf;g.error("E_CSS_ATTR_VAL_EXPECTED",k);continue}if(15!=k.type){a.b=sf;g.error("E_CSS_ATTR",k);continue}a.b=f?kf:S;R(h);continue;case 11:g.od();a.b=lf;R(h);continue;case 12:g.kd();
a.b=lf;R(h);continue;case 56:g.sd();a.b=lf;R(h);continue;case 13:a.W?(a.h.push("-epubx-region"),a.W=!1):a.V?(a.h.push("page"),a.V=!1):a.h.push("[selector]");g.wa();a.b=hf;R(h);continue;case 41:g.cc();a.b=mf;R(h);continue;case 15:l.push(C(k.text));R(h);continue;case 16:try{l.push(Ye(k.text))}catch(r){g.error("E_CSS_COLOR",k),a.b=qf}R(h);continue;case 17:l.push(new xc(k.I));R(h);continue;case 18:l.push(new yc(k.I));R(h);continue;case 19:l.push(new D(k.I,k.text));R(h);continue;case 20:l.push(new vc(k.text));
R(h);continue;case 21:l.push(new Ac(ka(k.text,a.ha)));R(h);continue;case 22:wf(a,",",k);l.push(",");R(h);continue;case 23:l.push(uc);R(h);continue;case 24:m=k.text.toLowerCase();"-epubx-expr"==m?(a.b=of,a.j=0,l.push("{")):(l.push(m),l.push("("));R(h);continue;case 25:wf(a,")",k);R(h);continue;case 47:R(h);k=O(h);m=Q(h,1);if(1==k.type&&"important"==k.text.toLowerCase()&&(17==m.type||0==m.type||13==m.type)){R(h);a.C=!0;continue}xf(a,"E_CSS_SYNTAX",k);continue;case 54:m=Q(h,1);switch(m.type){case 4:case 3:case 5:if(!m.b){R(h);
continue}}a.b===nf&&0<=h.b?(Re(h),a.b=mf,g.rb()):xf(a,"E_CSS_UNEXPECTED_PLUS",k);continue;case 26:R(h);case 48:h.b=-1;(m=wf(a,";",k))&&a.g&&g.pb(a.g,m,a.C);a.b=d?jf:hf;continue;case 44:R(h);h.b=-1;m=wf(a,";",k);if(c)return a.G=m,!0;a.g&&m&&g.pb(a.g,m,a.C);if(d)return!0;xf(a,"E_CSS_SYNTAX",k);continue;case 31:m=Q(h,1);9==m.type?(10!=Q(h,2).type||Q(h,2).b?(l.push(new bc(g.ga(),kb(k.text,m.text))),a.b=pf):(l.push(k.text,m.text,"("),R(h)),R(h)):(2==a.j||3==a.j?"not"==k.text.toLowerCase()?(R(h),l.push(new cc(g.ga(),
!0,m.text))):("only"==k.text.toLowerCase()&&(R(h),k=m),l.push(new cc(g.ga(),!1,k.text))):l.push(new bc(g.ga(),k.text)),a.b=pf);R(h);continue;case 38:l.push(null,k.text,"(");R(h);continue;case 32:l.push(new nb(g.ga(),k.I));R(h);a.b=pf;continue;case 33:m=k.text;"%"==m&&(m=a.g&&a.g.match(/height|^(top|bottom)$/)?"vh":"vw");l.push(new ac(g.ga(),k.I,m));R(h);a.b=pf;continue;case 34:l.push(new nb(g.ga(),k.text));R(h);a.b=pf;continue;case 35:R(h);k=O(h);5!=k.type||k.b?xf(a,"E_CSS_SYNTAX",k):(l.push(new gc(g.ga(),
k.I)),R(h),a.b=pf);continue;case 36:l.push(-k.type);R(h);continue;case 37:a.b=of;yf(a,k.type,k);l.push(k.type);R(h);continue;case 45:"and"==k.text.toLowerCase()?(a.b=of,yf(a,52,k),l.push(52),R(h)):xf(a,"E_CSS_SYNTAX",k);continue;case 39:yf(a,k.type,k)&&(a.g?a.b=nf:xf(a,"E_CSS_UNBALANCED_PAR",k));R(h);continue;case 43:yf(a,11,k)&&(a.g||3==a.j?xf(a,"E_CSS_UNEXPECTED_BRC",k):(1==a.j?g.Vb(l.pop()):(k=l.pop(),g.Vb(k)),a.h.push("media"),g.wa(),a.b=hf));R(h);continue;case 49:if(yf(a,11,k))if(a.g||3!=a.j)xf(a,
"E_CSS_UNEXPECTED_SEMICOL",k);else return a.A=l.pop(),a.H=!0,a.b=hf,R(h),!1;R(h);continue;case 40:l.push(k.type);R(h);continue;case 27:a.b=hf;R(h);g.zb();a.h.length&&a.h.pop();continue;case 30:m=k.text.toLowerCase();switch(m){case "import":R(h);k=O(h);if(2==k.type||8==k.type){a.M=k.text;R(h);k=O(h);if(17==k.type||0==k.type)return a.H=!0,R(h),!1;a.g=null;a.j=3;a.b=of;l.push("{");continue}g.error("E_CSS_IMPORT_SYNTAX",k);a.b=qf;continue;case "namespace":R(h);k=O(h);switch(k.type){case 1:m=k.text;R(h);
k=O(h);if((2==k.type||8==k.type)&&17==Q(h,1).type){a.R[m]=k.text;R(h);R(h);continue}break;case 2:case 8:if(17==Q(h,1).type){a.J=k.text;R(h);R(h);continue}}g.error("E_CSS_NAMESPACE_SYNTAX",k);a.b=qf;continue;case "charset":R(h);k=O(h);if(2==k.type&&17==Q(h,1).type){m=k.text.toLowerCase();"utf-8"!=m&&"utf-16"!=m&&g.error("E_CSS_UNEXPECTED_CHARSET "+m,k);R(h);R(h);continue}g.error("E_CSS_CHARSET_SYNTAX",k);a.b=qf;continue;case "font-face":case "-epubx-page-template":case "-epubx-define":case "-epubx-viewport":if(12==
Q(h,1).type){R(h);R(h);switch(m){case "font-face":g.$c();break;case "-epubx-page-template":g.bd();break;case "-epubx-define":g.Yc();break;case "-epubx-viewport":g.dd()}a.h.push(m);g.wa();continue}break;case "-adapt-footnote-area":R(h);k=O(h);switch(k.type){case 12:R(h);g.Bc(null);a.h.push(m);g.wa();continue;case 50:if(R(h),k=O(h),1==k.type&&12==Q(h,1).type){m=k.text;R(h);R(h);g.Bc(m);a.h.push("-adapt-footnote-area");g.wa();continue}}break;case "-epubx-region":R(h);g.cd();a.W=!0;a.b=mf;continue;case "page":R(h);
g.ec();a.V=!0;a.b=lf;continue;case "top-left-corner":case "top-left":case "top-center":case "top-right":case "top-right-corner":case "right-top":case "right-middle":case "right-bottom":case "bottom-right-corner":case "bottom-right":case "bottom-center":case "bottom-left":case "bottom-left-corner":case "left-bottom":case "left-middle":case "left-top":R(h);k=O(h);if(12==k.type){R(h);g.Kd(m);a.h.push(m);g.wa();continue}break;case "-epubx-when":R(h);a.g=null;a.j=1;a.b=of;l.push("{");continue;case "media":R(h);
a.g=null;a.j=2;a.b=of;l.push("{");continue;case "-epubx-flow":if(1==Q(h,1).type&&12==Q(h,2).type){g.Zc(Q(h,1).text);R(h);R(h);R(h);a.h.push(m);g.wa();continue}break;case "-epubx-page-master":case "-epubx-partition":case "-epubx-partition-group":R(h);k=O(h);q=p=null;var x=[];1==k.type&&(p=k.text,R(h),k=O(h));18==k.type&&1==Q(h,1).type&&(q=Q(h,1).text,R(h),R(h),k=O(h));for(;6==k.type&&"class"==k.text.toLowerCase()&&1==Q(h,1).type&&11==Q(h,2).type;)x.push(Q(h,1).text),R(h),R(h),R(h),k=O(h);if(12==k.type){R(h);
switch(m){case "-epubx-page-master":g.ad(p,q,x);break;case "-epubx-partition":g.Ec(p,q,x);break;case "-epubx-partition-group":g.Dc(p,q,x)}a.h.push(m);g.wa();continue}break;case "":g.error("E_CSS_UNEXPECTED_AT"+m,k);a.b=sf;continue;default:g.error("E_CSS_AT_UNKNOWN "+m,k);a.b=qf;continue}g.error("E_CSS_AT_SYNTAX "+m,k);a.b=qf;continue;case 50:if(c||d)return!0;a.l.push(k.type+1);R(h);continue;case 52:if(c||d)return!0;if(!a.l.length){a.b=hf;continue}case 51:0<a.l.length&&a.l[a.l.length-1]==k.type&&a.l.pop();
a.l.length||13!=k.type||(a.b=hf);R(h);continue;case 53:if(c||d)return!0;a.l.length||(a.b=hf);R(h);continue;case 200:return f&&(R(h),g.Nc()),!0;default:if(c||d)return!0;if(e)return yf(a,11,k)?(a.G=l.pop(),!0):!1;if(f)return 51==k.type?g.error(k.text,k):g.error("E_CSS_SYNTAX",k),!1;a.b===nf&&0<=h.b?(Re(h),a.b=mf,g.rb()):a.b!==qf&&a.b!==sf&&a.b!==rf?(51==k.type?g.error(k.text,k):g.error("E_CSS_SYNTAX",k),a.b=Cf(a)?rf:sf):R(h)}return!1}function Ef(a){Ze.call(this,null);this.f=a}u(Ef,Ze);
Ef.prototype.error=function(a){throw Error(a);};Ef.prototype.ga=function(){return this.f};
function Ff(a,b,c,d,e){var f=I("parseStylesheet"),g=new uf(hf,a,b,c),h=null;e&&(h=Gf(new Pe(e,b),b,c));if(h=Bf(g,d,h&&h.oa()))b.Vb(h),b.wa();be(function(){for(;!Df(g,100,!1,!1,!1,!1);){if(g.H){var a=ka(g.M,c);g.A&&(b.Vb(g.A),b.wa());var d=I("parseStylesheet.import");Hf(a,b,null,null).then(function(){g.A&&b.zb();g.H=!1;g.M=null;g.A=null;M(d,!0)});return K(d)}a=$d();if(a.ua)return a}return J(!1)}).then(function(){h&&b.zb();M(f,!0)});return K(f)}
function If(a,b,c,d,e){return Ld("parseStylesheetFromText",function(f){var g=new Pe(a,b);Ff(g,b,c,d,e).Da(f)},function(b,c){v.b(c,"Failed to parse stylesheet text: "+a);M(b,!1)})}function Hf(a,b,c,d){return Ld("parseStylesheetFromURL",function(e){Se(a).then(function(f){f.responseText?If(f.responseText,b,a,c,d).then(function(b){b||v.b("Failed to parse stylesheet from "+a);M(e,!0)}):M(e,!0)})},function(b,c){v.b(c,"Exception while fetching and parsing:",a);M(b,!0)})}
function Jf(a,b){var c=new uf(nf,b,new Ef(a),"");Df(c,Number.POSITIVE_INFINITY,!0,!1,!1,!1);return c.G}function Gf(a,b,c){a=new uf(of,a,b,c);Df(a,Number.POSITIVE_INFINITY,!1,!1,!0,!1);return a.G}var Kf={"z-index":!0,"column-count":!0,"flow-linger":!0,opacity:!0,page:!0,"flow-priority":!0,utilization:!0};
function Lf(a,b,c){if(b.$d())a:{b=b.b;a=b.evaluate(a);switch(typeof a){case "number":c=Kf[c]?a==Math.round(a)?new yc(a):new xc(a):new D(a,"px");break a;case "string":c=a?Jf(b.b,new Pe(a,null)):B;break a;case "boolean":c=a?wd:Sc;break a;case "undefined":c=B;break a}throw Error("E_UNEXPECTED");}else c=b;return c};function Mf(a,b,c,d){this.ja=a;this.ca=b;this.ba=c;this.Z=d}function Nf(a,b){this.f=a;this.b=b}function Of(){this.bottom=this.right=this.top=this.left=0}function Pf(a,b,c,d){this.b=a;this.f=b;this.h=c;this.g=d}function Qf(a,b,c,d){this.ca=a;this.Z=b;this.ja=c;this.ba=d;this.right=this.left=null}function Rf(a,b){return a.b.b-b.b.b||a.b.f-b.b.f}function Sf(a){this.b=a}function Tf(a,b,c){a=a.b;for(var d=a.length,e=a[d-1],f=0;f<d;f++){var g=a[f];b.push(e.b<g.b?new Pf(e,g,1,c):new Pf(g,e,-1,c));e=g}}
function Uf(a,b,c,d){for(var e=[],f=0;20>f;f++){var g=2*f*Math.PI/20;e.push(new Nf(a+c*Math.sin(g),b+d*Math.cos(g)))}return new Sf(e)}function Vf(a,b,c,d){return new Sf([new Nf(a,b),new Nf(c,b),new Nf(c,d),new Nf(a,d)])}function Wf(a,b,c,d){this.f=a;this.h=b;this.b=c;this.g=d}function Xf(a,b){var c=a.b.f+(a.f.f-a.b.f)*(b-a.b.b)/(a.f.b-a.b.b);if(isNaN(c))throw Error("Bad intersection");return c}
function Yf(a,b,c,d){var e,f;b.f.b<c&&v.b("Error: inconsistent segment (1)");b.b.b<=c?(c=Xf(b,c),e=b.h):(c=b.b.f,e=0);b.f.b>=d?(d=Xf(b,d),f=b.h):(d=b.f.f,f=0);c<d?(a.push(new Wf(c,e,b.g,-1)),a.push(new Wf(d,f,b.g,1))):(a.push(new Wf(d,f,b.g,-1)),a.push(new Wf(c,e,b.g,1)))}
function Zf(a,b,c){c=b+c;for(var d=Array(c),e=Array(c),f=0;f<=c;f++)d[f]=0,e[f]=0;for(var g=[],h=!1,l=a.length,k=0;k<l;k++){var m=a[k];d[m.b]+=m.h;e[m.b]+=m.g;for(var p=!1,f=0;f<b;f++)if(d[f]&&!e[f]){p=!0;break}if(p)for(f=b;f<=c;f++)if(d[f]||e[f]){p=!1;break}h!=p&&(g.push(m.f),h=p)}return g}function $f(a,b){return b?Math.ceil(a/b)*b:a}function ag(a,b){return b?Math.floor(a/b)*b:a}function bg(a){return new Nf(a.b,-a.f)}function cg(a){return new Mf(a.ca,-a.ba,a.Z,-a.ja)}
function dg(a){return new Sf(La(a.b,bg))}
function eg(a,b,c,d,e){e&&(a=cg(a),b=La(b,dg),c=La(c,dg));e=b.length;var f=c?c.length:0,g=[],h=[],l,k,m;for(l=0;l<e;l++)Tf(b[l],h,l);for(l=0;l<f;l++)Tf(c[l],h,l+e);b=h.length;h.sort(Rf);for(c=0;h[c].g>=e;)c++;c=h[c].b.b;c>a.ca&&g.push(new Qf(a.ca,c,a.ba,a.ba));l=0;for(var p=[];l<b&&(m=h[l]).b.b<c;)m.f.b>c&&p.push(m),l++;for(;l<b||0<p.length;){var q=a.Z,x=$f(Math.ceil(c+8),d);for(k=0;k<p.length&&q>x;k++)m=p[k],m.b.f==m.f.f?m.f.b<q&&(q=Math.max(ag(m.f.b,d),x)):m.b.f!=m.f.f&&(q=x);q>a.Z&&(q=a.Z);for(;l<
b&&(m=h[l]).b.b<q;)if(m.f.b<c)l++;else if(m.b.b<x){if(m.b.b!=m.f.b||m.b.b!=c)p.push(m),q=x;l++}else{k=ag(m.b.b,d);k<q&&(q=k);break}x=[];for(k=0;k<p.length;k++)Yf(x,p[k],c,q);x.sort(function(a,b){return a.f-b.f||a.g-b.g});x=Zf(x,e,f);if(x.length){var r=0,t=a.ja;for(k=0;k<x.length;k+=2){var A=Math.max(a.ja,x[k]),H=Math.min(a.ba,x[k+1])-A;H>r&&(r=H,t=A)}r?g.push(new Qf(c,q,Math.max(t,a.ja),Math.min(t+r,a.ba))):g.push(new Qf(c,q,a.ba,a.ba))}else g.push(new Qf(c,q,a.ba,a.ba));if(q==a.Z)break;c=q;for(k=
p.length-1;0<=k;k--)p[k].f.b<=q&&p.splice(k,1)}fg(a,g);return g}function fg(a,b){for(var c=b.length-1,d=new Qf(a.Z,a.Z,a.ja,a.ba);0<=c;){var e=d,d=b[c];d.ja==e.ja&&d.ba==e.ba&&(e.ca=d.ca,b.splice(c,1),d=e);c--}}function gg(a,b){for(var c=0,d=a.length;c<d;){var e=Math.floor((c+d)/2);b>=a[e].Z?c=e+1:d=e}return c}
function hg(a,b,c,d){for(var e=c.ca,f=c.ba-c.ja,g=c.Z-c.ca,h=gg(b,e);;){var l=e+g;if(l>a.Z)break;for(var k=a.ja,m=a.ba,p=h;p<b.length&&b[p].ca<l;p++){var q=b[p];q.ja>k&&(k=q.ja);q.ba<m&&(m=q.ba)}if(k+f<=m||h>=b.length){"left"==d?(c.ja=k,c.ba=k+f):(c.ja=m-f,c.ba=m);c.Z+=e-c.ca;c.ca=e;break}e=b[h].Z;h++}}
function ig(a,b,c,d){for(c=[new Qf(c.ca,c.Z,c.ja,c.ba)];0<c.length&&c[0].Z<=a.ca;)c.shift();if(c.length){c[0].ca<a.ca&&(c[0].ca=a.ca);var e;e=b.length?b[b.length-1].Z:a.ca;e<a.Z&&b.push(new Qf(e,a.Z,a.ja,a.ba));for(var f=gg(b,c[0].ca),g=0;g<c.length;g++){var h=c[g];if(f==b.length)break;b[f].ca<h.ca&&(e=b[f],f++,b.splice(f,0,new Qf(h.ca,e.Z,e.ja,e.ba)),e.Z=h.ca);for(;f<b.length&&(e=b[f++],e.Z>h.Z&&(b.splice(f,0,new Qf(h.Z,e.Z,e.ja,e.ba)),e.Z=h.Z),h.ja!=h.ba&&("left"==d?e.ja=Math.min(h.ba,a.ba):e.ba=
Math.max(h.ja,a.ja)),e.Z!=h.Z););}fg(a,b)}};function jg(){this.b={}}u(jg,mc);jg.prototype.Ib=function(a){this.b[a.name]=!0;return a};jg.prototype.sb=function(a){this.Jb(a.values);return a};function kg(a){this.value=a}u(kg,mc);kg.prototype.ic=function(a){this.value=a.I;return a};function lg(a,b){if(a){var c=new kg(b);try{return a.aa(c),c.value}catch(d){v.b(d,"toInt: ")}}return b}function mg(){this.f=!1;this.b=[];this.name=null}u(mg,mc);mg.prototype.kc=function(a){this.f&&this.b.push(a);return null};
mg.prototype.jc=function(a){this.f&&!a.I&&this.b.push(new D(0,"px"));return null};mg.prototype.sb=function(a){this.Jb(a.values);return null};mg.prototype.vb=function(a){this.f||(this.f=!0,this.Jb(a.values),this.f=!1,this.name=a.name.toLowerCase());return null};
function ng(a,b,c,d,e,f){if(a){var g=new mg;try{a.aa(g);var h;a:{if(0<g.b.length){a=[];for(var l=0;l<g.b.length;l++){var k=g.b[l];if("%"==k.fa){var m=l%2?e:d;3==l&&"circle"==g.name&&(m=Math.sqrt((d*d+e*e)/2));a.push(k.I*m/100)}else a.push(k.I*xb(f,k.fa,!1))}switch(g.name){case "polygon":if(!(a.length%2)){f=[];for(g=0;g<a.length;g+=2)f.push(new Nf(b+a[g],c+a[g+1]));h=new Sf(f);break a}break;case "rectangle":if(4==a.length){h=Vf(b+a[0],c+a[1],b+a[0]+a[2],c+a[1]+a[3]);break a}break;case "ellipse":if(4==
a.length){h=Uf(b+a[0],c+a[1],a[2],a[3]);break a}break;case "circle":if(3==a.length){h=Uf(b+a[0],c+a[1],a[2],a[2]);break a}}}h=null}return h}catch(p){v.b(p,"toShape:")}}return Vf(b,c,b+d,c+e)}function og(a){this.f=a;this.b={};this.name=null}u(og,mc);og.prototype.Ib=function(a){this.name=a.toString();this.b[this.name]=this.f?0:(this.b[this.name]||0)+1;return a};og.prototype.ic=function(a){this.name&&(this.b[this.name]+=a.I-(this.f?0:1));return a};og.prototype.sb=function(a){this.Jb(a.values);return a};
function pg(a,b){var c=new og(b);try{a.aa(c)}catch(d){v.b(d,"toCounters:")}return c.b}function qg(a,b){this.b=a;this.f=b}u(qg,nc);qg.prototype.lc=function(a){return new Ac(this.f.Gc(a.url,this.b))};function rg(a){this.g=this.h=null;this.f=0;this.b=a}function sg(a,b){this.b=-1;this.f=a;this.g=b}function tg(){this.b=[];this.f=[];this.match=[];this.g=[];this.error=[];this.h=!0}tg.prototype.connect=function(a,b){for(var c=0;c<a.length;c++)this.f[a[c]].b=b;a.splice(0,a.length)};
tg.prototype.clone=function(){for(var a=new tg,b=0;b<this.b.length;b++){var c=this.b[b],d=new rg(c.b);d.f=c.f;a.b.push(d)}for(b=0;b<this.f.length;b++)c=this.f[b],d=new sg(c.f,c.g),d.b=c.b,a.f.push(d);a.match.push.apply(a.match,this.match);a.g.push.apply(a.g,this.g);a.error.push.apply(a.error,this.error);return a};
function ug(a,b,c,d){var e=a.b.length,f=new rg(vg);f.f=0<=d?c?2*d+1:2*d+2:c?-1:-2;a.b.push(f);a.connect(b,e);c=new sg(e,!0);e=new sg(e,!1);b.push(a.f.length);a.f.push(e);b.push(a.f.length);a.f.push(c)}function wg(a){return 1==a.b.length&&!a.b[0].f&&a.b[0].b instanceof xg}
function yg(a,b,c){if(b.b.length){var d=a.b.length;if(4==c&&1==d&&wg(b)&&wg(a)){c=a.b[0].b;b=b.b[0].b;var d={},e={},f;for(f in c.f)d[f]=c.f[f];for(f in b.f)d[f]=b.f[f];for(var g in c.g)e[g]=c.g[g];for(g in b.g)e[g]=b.g[g];a.b[0].b=new xg(c.b|b.b,d,e)}else{for(f=0;f<b.b.length;f++)a.b.push(b.b[f]);4==c?(a.h=!0,a.connect(a.g,d)):a.connect(a.match,d);g=a.f.length;for(f=0;f<b.f.length;f++)e=b.f[f],e.f+=d,0<=e.b&&(e.b+=d),a.f.push(e);for(f=0;f<b.match.length;f++)a.match.push(b.match[f]+g);3==c&&a.connect(a.match,
d);if(2==c||3==c)for(f=0;f<b.g.length;f++)a.match.push(b.g[f]+g);else if(a.h){for(f=0;f<b.g.length;f++)a.g.push(b.g[f]+g);a.h=b.h}else for(f=0;f<b.g.length;f++)a.error.push(b.g[f]+g);for(f=0;f<b.error.length;f++)a.error.push(b.error[f]+g);b.b=null;b.f=null}}}var T={};function zg(){}u(zg,mc);zg.prototype.h=function(a,b){var c=a[b].aa(this);return c?[c]:null};function xg(a,b,c){this.b=a;this.f=b;this.g=c}u(xg,zg);n=xg.prototype;n.Nd=function(a){return this.b&1?a:null};
n.Od=function(a){return this.b&2048?a:null};n.Hc=function(a){return this.b&2?a:null};n.Ib=function(a){var b=this.f[a.name.toLowerCase()];return b?b:this.b&4?a:null};n.kc=function(a){return a.I||this.b&512?0>a.I&&!(this.b&256)?null:this.g[a.fa]?a:null:"%"==a.fa&&this.b&1024?a:null};n.jc=function(a){return a.I?0>=a.I&&!(this.b&256)?null:this.b&16?a:null:this.b&512?a:null};n.ic=function(a){return a.I?0>=a.I&&!(this.b&256)?null:this.b&48?a:(a=this.f[""+a.I])?a:null:this.b&512?a:null};
n.gd=function(a){return this.b&64?a:null};n.lc=function(a){return this.b&128?a:null};n.sb=function(){return null};n.Hb=function(){return null};n.vb=function(){return null};n.hc=function(){return null};var vg=new xg(0,T,T);
function Ag(a){this.b=new rg(null);var b=this.g=new rg(null),c=a.b.length;a.b.push(this.b);a.b.push(b);a.connect(a.match,c);a.connect(a.g,c+1);a.connect(a.error,c+1);for(b=0;b<a.f.length;b++){var d=a.f[b];d.g?a.b[d.f].h=a.b[d.b]:a.b[d.f].g=a.b[d.b]}for(b=0;b<c;b++)if(!a.b[b].g||!a.b[b].h)throw Error("Invalid validator state");this.f=a.b[0]}u(Ag,zg);
function Bg(a,b,c,d){for(var e=c?[]:b,f=a.f,g=d,h=null,l=null;f!==a.b&&f!==a.g;)if(g>=b.length)f=f.g;else{var k=b[g],m;if(f.f)m=!0,-1==f.f?(h?h.push(l):h=[l],l=[]):-2==f.f?0<h.length?l=h.pop():l=null:0<f.f&&!(f.f%2)?l[Math.floor((f.f-1)/2)]="taken":m=null==l[Math.floor((f.f-1)/2)],f=m?f.h:f.g;else{if(!g&&!c&&f.b instanceof Cg&&a instanceof Cg){if(m=(new oc(b)).aa(f.b)){g=b.length;f=f.h;continue}}else if(!g&&!c&&f.b instanceof Dg&&a instanceof Cg){if(m=(new pc(b)).aa(f.b)){g=b.length;f=f.h;continue}}else m=
k.aa(f.b);if(m){if(m!==k&&b===e)for(e=[],k=0;k<g;k++)e[k]=b[k];b!==e&&(e[g-d]=m);g++;f=f.h}else f=f.g}}return f===a.b&&(c?0<e.length:g==b.length)?e:null}n=Ag.prototype;n.gb=function(a){for(var b=null,c=this.f;c!==this.b&&c!==this.g;)a?c.f?c=c.h:(b=a.aa(c.b))?(a=null,c=c.h):c=c.g:c=c.g;return c===this.b?b:null};n.Nd=function(a){return this.gb(a)};n.Od=function(a){return this.gb(a)};n.Hc=function(a){return this.gb(a)};n.Ib=function(a){return this.gb(a)};n.kc=function(a){return this.gb(a)};n.jc=function(a){return this.gb(a)};
n.ic=function(a){return this.gb(a)};n.gd=function(a){return this.gb(a)};n.lc=function(a){return this.gb(a)};n.sb=function(){return null};n.Hb=function(){return null};n.vb=function(a){return this.gb(a)};n.hc=function(){return null};function Cg(a){Ag.call(this,a)}u(Cg,Ag);Cg.prototype.sb=function(a){var b=Bg(this,a.values,!1,0);return b===a.values?a:b?new oc(b):null};
Cg.prototype.Hb=function(a){for(var b=this.f,c=!1;b;){if(b.b instanceof Dg){c=!0;break}b=b.g}return c?(b=Bg(this,a.values,!1,0),b===a.values?a:b?new pc(b):null):null};Cg.prototype.h=function(a,b){return Bg(this,a,!0,b)};function Dg(a){Ag.call(this,a)}u(Dg,Ag);Dg.prototype.sb=function(a){return this.gb(a)};Dg.prototype.Hb=function(a){var b=Bg(this,a.values,!1,0);return b===a.values?a:b?new pc(b):null};Dg.prototype.h=function(a,b){for(var c=this.f,d;c!==this.g;){if(d=c.b.h(a,b))return d;c=c.g}return null};
function Eg(a,b){Ag.call(this,b);this.name=a}u(Eg,Ag);Eg.prototype.gb=function(){return null};Eg.prototype.vb=function(a){if(a.name.toLowerCase()!=this.name)return null;var b=Bg(this,a.values,!1,0);return b===a.values?a:b?new qc(a.name,b):null};function Fg(){}Fg.prototype.b=function(a,b){return b};Fg.prototype.g=function(){};function Gg(a,b){this.name=b;this.h=a.g[this.name]}u(Gg,Fg);
Gg.prototype.b=function(a,b,c){if(c.values[this.name])return b;if(a=this.h.h(a,b)){var d=a.length;this.g(1<d?new oc(a):a[0],c);return b+d}return b};Gg.prototype.g=function(a,b){b.values[this.name]=a};function Hg(a,b){Gg.call(this,a,b[0]);this.f=b}u(Hg,Gg);Hg.prototype.g=function(a,b){for(var c=0;c<this.f.length;c++)b.values[this.f[c]]=a};function Ig(a,b){this.f=a;this.fe=b}u(Ig,Fg);
Ig.prototype.b=function(a,b,c){var d=b;if(this.fe)if(a[b]==uc){if(++b==a.length)return d}else return d;var e=this.f[0].b(a,b,c);if(e==b)return d;b=e;for(d=1;d<this.f.length&&b<a.length;d++){e=this.f[d].b(a,b,c);if(e==b)break;b=e}return b};function Jg(){this.b=this.eb=null;this.error=!1;this.values={};this.f=null}n=Jg.prototype;n.clone=function(){var a=new this.constructor;a.eb=this.eb;a.b=this.b;a.f=this.f;return a};n.Pd=function(a,b){this.eb=a;this.b=b};n.Yb=function(){this.error=!0;return 0};
function Kg(a,b){a.Yb([b]);return null}n.Nd=function(a){return Kg(this,a)};n.Hc=function(a){return Kg(this,a)};n.Ib=function(a){return Kg(this,a)};n.kc=function(a){return Kg(this,a)};n.jc=function(a){return Kg(this,a)};n.ic=function(a){return Kg(this,a)};n.gd=function(a){return Kg(this,a)};n.lc=function(a){return Kg(this,a)};n.sb=function(a){this.Yb(a.values);return null};n.Hb=function(){this.error=!0;return null};n.vb=function(a){return Kg(this,a)};n.hc=function(){this.error=!0;return null};
function Lg(){Jg.call(this)}u(Lg,Jg);Lg.prototype.Yb=function(a){for(var b=0,c=0;b<a.length;){var d=this.eb[c].b(a,b,this);if(d>b)b=d,c=0;else if(++c==this.eb.length){this.error=!0;break}}return b};function Mg(){Jg.call(this)}u(Mg,Jg);Mg.prototype.Yb=function(a){if(a.length>this.eb.length||!a.length)return this.error=!0,0;for(var b=0;b<this.eb.length;b++){for(var c=b;c>=a.length;)c=1==c?0:c-2;if(this.eb[b].b(a,c,this)!=c+1)return this.error=!0,0}return a.length};function Ng(){Jg.call(this)}u(Ng,Jg);
Ng.prototype.Yb=function(a){for(var b=a.length,c=0;c<a.length;c++)if(a[c]===uc){b=c;break}if(b>this.eb.length||!a.length)return this.error=!0,0;for(c=0;c<this.eb.length;c++){for(var d=c;d>=b;)d=1==d?0:d-2;var e;if(b+1<a.length)for(e=b+c+1;e>=a.length;)e-=e==b+2?1:2;else e=d;if(2!=this.eb[c].b([a[d],a[e]],0,this))return this.error=!0,0}return a.length};function Og(){Jg.call(this)}u(Og,Lg);
Og.prototype.Hb=function(a){for(var b={},c=0;c<a.values.length;c++){this.values={};if(a.values[c]instanceof pc)this.error=!0;else{a.values[c].aa(this);for(var d=b,e=this.values,f=0;f<this.b.length;f++){var g=this.b[f],h=e[g]||this.f.l[g],l=d[g];l||(l=[],d[g]=l);l.push(h)}this.values["background-color"]&&c!=a.values.length-1&&(this.error=!0)}if(this.error)return null}this.values={};for(var k in b)this.values[k]="background-color"==k?b[k].pop():new pc(b[k]);return null};
function Pg(){Jg.call(this)}u(Pg,Lg);Pg.prototype.Pd=function(a,b){Lg.prototype.Pd.call(this,a,b);this.b.push("font-family","line-height","font-size")};
Pg.prototype.Yb=function(a){var b=Lg.prototype.Yb.call(this,a);if(b+2>a.length)return this.error=!0,b;this.error=!1;var c=this.f.g;if(!a[b].aa(c["font-size"]))return this.error=!0,b;this.values["font-size"]=a[b++];if(a[b]===uc){b++;if(b+2>a.length||!a[b].aa(c["line-height"]))return this.error=!0,b;this.values["line-height"]=a[b++]}var d=b==a.length-1?a[b]:new oc(a.slice(b,a.length));if(!d.aa(c["font-family"]))return this.error=!0,b;this.values["font-family"]=d;return a.length};
Pg.prototype.Hb=function(a){a.values[0].aa(this);if(this.error)return null;for(var b=[this.values["font-family"]],c=1;c<a.values.length;c++)b.push(a.values[c]);a=new pc(b);a.aa(this.f.g["font-family"])?this.values["font-family"]=a:this.error=!0;return null};Pg.prototype.Ib=function(a){if(a=this.f.f[a.name])for(var b in a)this.values[b]=a[b];else this.error=!0;return null};var Qg={SIMPLE:Lg,INSETS:Mg,INSETS_SLASH:Ng,COMMA:Og,FONT:Pg};
function Rg(){this.g={};this.A={};this.l={};this.b={};this.f={};this.h={};this.u=[];this.j=[]}function Sg(a,b){var c;if(3==b.type)c=new D(b.I,b.text);else if(7==b.type)c=Ye(b.text);else if(1==b.type)c=C(b.text);else throw Error("unexpected replacement");if(wg(a)){var d=a.b[0].b.f,e;for(e in d)d[e]=c;return a}throw Error("unexpected replacement");}
function Tg(a,b,c){for(var d=new tg,e=0;e<b;e++)yg(d,a.clone(),1);if(c==Number.POSITIVE_INFINITY)yg(d,a,3);else for(e=b;e<c;e++)yg(d,a.clone(),2);return d}function Ug(a){var b=new tg,c=b.b.length;b.b.push(new rg(a));a=new sg(c,!0);var d=new sg(c,!1);b.connect(b.match,c);b.h?(b.g.push(b.f.length),b.h=!1):b.error.push(b.f.length);b.f.push(d);b.match.push(b.f.length);b.f.push(a);return b}
function Vg(a,b){var c;switch(a){case "COMMA":c=new Dg(b);break;case "SPACE":c=new Cg(b);break;default:c=new Eg(a.toLowerCase(),b)}return Ug(c)}
function Wg(a){a.b.HASHCOLOR=Ug(new xg(64,T,T));a.b.POS_INT=Ug(new xg(32,T,T));a.b.POS_NUM=Ug(new xg(16,T,T));a.b.POS_PERCENTAGE=Ug(new xg(8,T,{"%":B}));a.b.NEGATIVE=Ug(new xg(256,T,T));a.b.ZERO=Ug(new xg(512,T,T));a.b.ZERO_PERCENTAGE=Ug(new xg(1024,T,T));a.b.POS_LENGTH=Ug(new xg(8,T,{em:B,ex:B,ch:B,rem:B,vh:B,vw:B,vmin:B,vmax:B,cm:B,mm:B,"in":B,px:B,pt:B,pc:B,q:B}));a.b.POS_ANGLE=Ug(new xg(8,T,{deg:B,grad:B,rad:B,turn:B}));a.b.POS_TIME=Ug(new xg(8,T,{s:B,ms:B}));a.b.FREQUENCY=Ug(new xg(8,T,{Hz:B,
kHz:B}));a.b.RESOLUTION=Ug(new xg(8,T,{dpi:B,dpcm:B,dppx:B}));a.b.URI=Ug(new xg(128,T,T));a.b.IDENT=Ug(new xg(4,T,T));a.b.STRING=Ug(new xg(2,T,T));a.b.SLASH=Ug(new xg(2048,T,T));var b={"font-family":C("sans-serif")};a.f.caption=b;a.f.icon=b;a.f.menu=b;a.f["message-box"]=b;a.f["small-caption"]=b;a.f["status-bar"]=b}function Xg(a){return!!a.match(/^[A-Z_0-9]+$/)}
function Yg(a,b,c){var d=O(b);if(0==d.type)return null;var e={"":!0};if(14==d.type){do{R(b);d=O(b);if(1!=d.type)throw Error("Prefix name expected");e[d.text]=!0;R(b);d=O(b)}while(16==d.type);if(15!=d.type)throw Error("']' expected");R(b);d=O(b)}if(1!=d.type)throw Error("Property name expected");if(2==c?"SHORTHANDS"==d.text:"DEFAULTS"==d.text)return R(b),null;d=d.text;R(b);if(2!=c){if(39!=O(b).type)throw Error("'=' expected");Xg(d)||(a.A[d]=e)}else if(18!=O(b).type)throw Error("':' expected");return d}
function Zg(a,b){for(;;){var c=Yg(a,b,1);if(!c)break;for(var d=[],e=[],f="",g,h=!0,l=function(){if(!d.length)throw Error("No values");var a;if(1==d.length)a=d[0];else{var b=f,c=d;a=new tg;if("||"==b){for(b=0;b<c.length;b++){var e=new tg,g=e;if(g.b.length)throw Error("invalid call");var h=new rg(vg);h.f=2*b+1;g.b.push(h);var h=new sg(0,!0),l=new sg(0,!1);g.g.push(g.f.length);g.f.push(l);g.match.push(g.f.length);g.f.push(h);yg(e,c[b],1);ug(e,e.match,!1,b);yg(a,e,b?4:1)}c=new tg;if(c.b.length)throw Error("invalid call");
ug(c,c.match,!0,-1);yg(c,a,3);a=[c.match,c.g,c.error];for(b=0;b<a.length;b++)ug(c,a[b],!1,-1);a=c}else{switch(b){case " ":e=1;break;case "|":case "||":e=4;break;default:throw Error("unexpected op");}for(b=0;b<c.length;b++)yg(a,c[b],b?e:1)}}return a},k=function(a){if(h)throw Error("'"+a+"': unexpected");if(f&&f!=a)throw Error("mixed operators: '"+a+"' and '"+f+"'");f=a;h=!0},m=null;!m;)switch(R(b),g=O(b),g.type){case 1:h||k(" ");if(Xg(g.text)){var p=a.b[g.text];if(!p)throw Error("'"+g.text+"' unexpected");
d.push(p.clone())}else p={},p[g.text.toLowerCase()]=C(g.text),d.push(Ug(new xg(0,p,T)));h=!1;break;case 5:p={};p[""+g.I]=new yc(g.I);d.push(Ug(new xg(0,p,T)));h=!1;break;case 34:k("|");break;case 25:k("||");break;case 14:h||k(" ");e.push({je:d,de:f,nc:"["});f="";d=[];h=!0;break;case 6:h||k(" ");e.push({je:d,de:f,nc:"(",bc:g.text});f="";d=[];h=!0;break;case 15:g=l();p=e.pop();if("["!=p.nc)throw Error("']' unexpected");d=p.je;d.push(g);f=p.de;h=!1;break;case 11:g=l();p=e.pop();if("("!=p.nc)throw Error("')' unexpected");
d=p.je;d.push(Vg(p.bc,g));f=p.de;h=!1;break;case 18:if(h)throw Error("':' unexpected");R(b);d.push(Sg(d.pop(),O(b)));break;case 22:if(h)throw Error("'?' unexpected");d.push(Tg(d.pop(),0,1));break;case 36:if(h)throw Error("'*' unexpected");d.push(Tg(d.pop(),0,Number.POSITIVE_INFINITY));break;case 23:if(h)throw Error("'+' unexpected");d.push(Tg(d.pop(),1,Number.POSITIVE_INFINITY));break;case 12:R(b);g=O(b);if(5!=g.type)throw Error("<int> expected");var q=p=g.I;R(b);g=O(b);if(16==g.type){R(b);g=O(b);
if(5!=g.type)throw Error("<int> expected");q=g.I;R(b);g=O(b)}if(13!=g.type)throw Error("'}' expected");d.push(Tg(d.pop(),p,q));break;case 17:m=l();if(0<e.length)throw Error("unclosed '"+e.pop().nc+"'");break;default:throw Error("unexpected token");}R(b);Xg(c)?a.b[c]=m:a.g[c]=1!=m.b.length||m.b[0].f?new Cg(m):m.b[0].b}}
function $g(a,b){for(var c={},d=0;d<b.length;d++)for(var e=b[d],f=a.h[e],e=f?f.b:[e],f=0;f<e.length;f++){var g=e[f],h=a.l[g];h?c[g]=h:v.b("Unknown property in makePropSet:",g)}return c}
function ah(a,b,c,d,e){var f="",g=b;b=b.toLowerCase();var h=b.match(/^-([a-z]+)-([-a-z0-9]+)$/);h&&(f=h[1],b=h[2]);if((h=a.A[b])&&h[f])if(f=a.g[b])(a=c===Xc||c.$d()?c:c.aa(f))?e.qb(b,a,d):e.uc(g,c);else if(b=a.h[b].clone(),c===Xc)for(c=0;c<b.b.length;c++)e.qb(b.b[c],Xc,d);else{c.aa(b);if(b.error)d=!1;else{for(a=0;a<b.b.length;a++)f=b.b[a],e.qb(f,b.values[f]||b.f.l[f],d);d=!0}d||e.uc(g,c)}else e.ed(g,c)}
var bh=new fe(function(){var a=I("loadValidatorSet.load"),b=ka("validation.txt",ja),c=Se(b),d=new Rg;Wg(d);c.then(function(c){try{if(c.responseText){var e=new Pe(c.responseText,null);for(Zg(d,e);;){var g=Yg(d,e,2);if(!g)break;for(c=[];;){R(e);var h=O(e);if(17==h.type){R(e);break}switch(h.type){case 1:c.push(C(h.text));break;case 4:c.push(new xc(h.I));break;case 5:c.push(new yc(h.I));break;case 3:c.push(new D(h.I,h.text));break;default:throw Error("unexpected token");}}d.l[g]=1<c.length?new oc(c):
c[0]}for(;;){var l=Yg(d,e,3);if(!l)break;var k=Q(e,1),m;1==k.type&&Qg[k.text]?(m=new Qg[k.text],R(e)):m=new Lg;m.f=d;g=!1;h=[];c=!1;for(var p=[],q=[];!g;)switch(R(e),k=O(e),k.type){case 1:if(d.g[k.text])h.push(new Gg(m.f,k.text)),q.push(k.text);else if(d.h[k.text]instanceof Mg){var x=d.h[k.text];h.push(new Hg(x.f,x.b));q.push.apply(q,x.b)}else throw Error("'"+k.text+"' is neither a simple property nor an inset shorthand");break;case 19:if(0<h.length||c)throw Error("unexpected slash");c=!0;break;case 14:p.push({fe:c,
eb:h});h=[];c=!1;break;case 15:var r=new Ig(h,c),t=p.pop(),h=t.eb;c=t.fe;h.push(r);break;case 17:g=!0;R(e);break;default:throw Error("unexpected token");}m.Pd(h,q);d.h[l]=m}d.j=$g(d,["background"]);d.u=$g(d,"margin border padding columns column-gap column-rule column-fill".split(" "))}else v.error("Error: missing",b)}catch(A){v.error(A,"Error:")}M(a,d)});return K(a)},"validatorFetcher");var ch={azimuth:!0,"border-collapse":!0,"border-spacing":!0,"caption-side":!0,"clip-rule":!0,color:!0,"color-interpolation":!0,"color-rendering":!0,cursor:!0,direction:!0,elevation:!0,"empty-cells":!0,fill:!0,"fill-opacity":!0,"fill-rule":!0,"font-kerning":!0,"font-size":!0,"font-size-adjust":!0,"font-family":!0,"font-feature-settings":!0,"font-style":!0,"font-stretch":!0,"font-variant":!0,"font-weight":!0,"glyph-orientation-vertical":!0,hyphens:!0,"hyphenate-character":!0,"hyphenate-limit-chars":!0,
"hyphenate-limit-last":!0,"image-rendering":!0,"image-resolution":!0,"letter-spacing":!0,"line-break":!0,"line-height":!0,"list-style-image":!0,"list-style-position":!0,"list-style-type":!0,marker:!0,"marker-end":!0,"marker-mid":!0,"marker-start":!0,orphans:!0,"overflow-wrap":!0,"paint-order":!0,"pointer-events":!0,"pitch-range":!0,quotes:!0,richness:!0,"ruby-align":!0,"ruby-position":!0,"speak-header":!0,"speak-numeral":!0,"speak-punctuation":!0,"speech-rate":!0,"shape-rendering":!0,stress:!0,stroke:!0,
"stroke-dasharray":!0,"stroke-dashoffset":!0,"stroke-linecap":!0,"stroke-linejoin":!0,"stroke-miterlimit":!0,"stroke-opacity":!0,"stroke-width":!0,"tab-size":!0,"text-align":!0,"text-align-last":!0,"text-anchor":!0,"text-decoration-skip":!0,"text-emphasis-color":!0,"text-emphasis-position":!0,"text-emphasis-style":!0,"text-combine-upright":!0,"text-indent":!0,"text-justify":!0,"text-rendering":!0,"text-size-adjust":!0,"text-transform":!0,"text-underline-position":!0,visibility:!0,"voice-family":!0,
volume:!0,"white-space":!0,widows:!0,"word-break":!0,"word-spacing":!0,"word-wrap":!0,"writing-mode":!0},dh=["box-decoration-break","image-resolution","orphans","widows"];function eh(){return(Ed.POLYFILLED_INHERITED_PROPS||[]).reduce(function(a,b){return a.concat(b())},[].concat(dh))}
for(var fh={"http://www.idpf.org/2007/ops":!0,"http://www.w3.org/1999/xhtml":!0,"http://www.w3.org/2000/svg":!0},gh="margin-% padding-% border-%-width border-%-style border-%-color %".split(" "),hh=["left","right","top","bottom"],ih={width:!0,height:!0},jh=0;jh<gh.length;jh++)for(var kh=0;kh<hh.length;kh++){var lh=gh[jh].replace("%",hh[kh]);ih[lh]=!0}function mh(a){for(var b={},c=0;c<gh.length;c++)for(var d in a){var e=gh[c].replace("%",d),f=gh[c].replace("%",a[d]);b[e]=f;b[f]=e}return b}
var nh=mh({before:"right",after:"left",start:"top",end:"bottom"}),oh=mh({before:"top",after:"bottom",start:"left",end:"right"});function U(a,b){this.value=a;this.Ra=b}n=U.prototype;n.re=function(){return this};n.Oc=function(a){a=this.value.aa(a);return a===this.value?this:new U(a,this.Ra)};n.ue=function(a){return a?new U(this.value,this.Ra+a):this};n.evaluate=function(a,b){return Lf(a,this.value,b)};n.ke=function(){return!0};function ph(a,b,c){U.call(this,a,b);this.T=c}u(ph,U);
ph.prototype.re=function(){return new U(this.value,this.Ra)};ph.prototype.Oc=function(a){a=this.value.aa(a);return a===this.value?this:new ph(a,this.Ra,this.T)};ph.prototype.ue=function(a){return a?new ph(this.value,this.Ra+a,this.T):this};ph.prototype.ke=function(a){return!!this.T.evaluate(a)};function qh(a,b,c){return(!b||c.Ra>b.Ra)&&c.ke(a)?c.re():b}var rh={"region-id":!0};function sh(a){return"_"!=a.charAt(0)&&!rh[a]}function th(a,b,c){c?a[b]=c:delete a[b]}
function uh(a,b){var c=a[b];c||(c={},a[b]=c);return c}function vh(a,b){var c=a[b];c||(c=[],a[b]=c);return c}function wh(a,b,c,d,e,f){if(e){var g=uh(b,"_pseudos");b=g[e];b||(b={},g[e]=b)}f&&(e=uh(b,"_regions"),b=e[f],b||(b={},e[f]=b));for(var h in c)"_"!=h.charAt(0)&&(rh[h]?(f=c[h],e=vh(b,h),Array.prototype.push.apply(e,f)):th(b,h,qh(a,b[h],c[h].ue(d))))}
function xh(a,b){if(0<a.length){a.sort(function(a,b){return b.f()-a.f()});for(var c=null,d=a.length-1;0<=d;d--)c=a[d],c.b=b,b=c;return c}return b}function yh(a,b){this.g=a;this.b=b;this.f=""}u(yh,nc);function zh(a){a=a.g["font-size"].value;var b;a:switch(a.fa.toLowerCase()){case "px":case "in":case "pt":case "pc":case "cm":case "mm":case "q":b=!0;break a;default:b=!1}if(!b)throw Error("Unexpected state");return a.I*tb[a.fa]}
yh.prototype.kc=function(a){if("em"==a.fa||"ex"==a.fa){var b=xb(this.b,a.fa,!1)/xb(this.b,"em",!1);return new D(a.I*b*zh(this),"px")}if("rem"==a.fa||"rex"==a.fa)return b=xb(this.b,a.fa,!1)/xb(this.b,"rem",!1),new D(a.I*b*this.b.fontSize(),"px");if("%"==a.fa){if("font-size"===this.f)return new D(a.I/100*zh(this),"px");if("line-height"===this.f)return a;b=this.f.match(/height|^(top|bottom)$/)?"vh":"vw";return new D(a.I,b)}return a};
yh.prototype.hc=function(a){return"font-size"==this.f?Lf(this.b,a,this.f).aa(this):a};function Ah(){}Ah.prototype.apply=function(){};Ah.prototype.l=function(a){return new Bh([this,a])};Ah.prototype.clone=function(){return this};function Ch(a){this.b=a}u(Ch,Ah);Ch.prototype.apply=function(a){a.h[a.h.length-1].push(this.b.b())};function Bh(a){this.b=a}u(Bh,Ah);Bh.prototype.apply=function(a){for(var b=0;b<this.b.length;b++)this.b[b].apply(a)};Bh.prototype.l=function(a){this.b.push(a);return this};
Bh.prototype.clone=function(){return new Bh([].concat(this.b))};function Dh(a,b,c,d){this.style=a;this.X=b;this.b=c;this.h=d}u(Dh,Ah);Dh.prototype.apply=function(a){wh(a.l,a.F,this.style,this.X,this.b,this.h)};function V(){this.b=null}u(V,Ah);V.prototype.apply=function(a){this.b.apply(a)};V.prototype.f=function(){return 0};V.prototype.g=function(){return!1};function Eh(a){this.b=null;this.h=a}u(Eh,V);Eh.prototype.apply=function(a){0<=a.G.indexOf(this.h)&&this.b.apply(a)};Eh.prototype.f=function(){return 10};
Eh.prototype.g=function(a){this.b&&Fh(a.Aa,this.h,this.b);return!0};function Gh(a){this.b=null;this.id=a}u(Gh,V);Gh.prototype.apply=function(a){a.V!=this.id&&a.ha!=this.id||this.b.apply(a)};Gh.prototype.f=function(){return 11};Gh.prototype.g=function(a){this.b&&Fh(a.g,this.id,this.b);return!0};function Hh(a){this.b=null;this.localName=a}u(Hh,V);Hh.prototype.apply=function(a){a.f==this.localName&&this.b.apply(a)};Hh.prototype.f=function(){return 8};
Hh.prototype.g=function(a){this.b&&Fh(a.Fc,this.localName,this.b);return!0};function Ih(a,b){this.b=null;this.h=a;this.localName=b}u(Ih,V);Ih.prototype.apply=function(a){a.f==this.localName&&a.j==this.h&&this.b.apply(a)};Ih.prototype.f=function(){return 8};Ih.prototype.g=function(a){if(this.b){var b=a.b[this.h];b||(b="ns"+a.j++ +":",a.b[this.h]=b);Fh(a.h,b+this.localName,this.b)}return!0};function Jh(a){this.b=null;this.h=a}u(Jh,V);
Jh.prototype.apply=function(a){var b=a.b;if(b&&"a"==a.f){var c=b.getAttribute("href");c&&c.match(/^#/)&&(b=b.ownerDocument.getElementById(c.substring(1)))&&(b=b.getAttributeNS("http://www.idpf.org/2007/ops","type"))&&b.match(this.h)&&this.b.apply(a)}};function Kh(a){this.b=null;this.h=a}u(Kh,V);Kh.prototype.apply=function(a){a.j==this.h&&this.b.apply(a)};function Lh(a,b){this.b=null;this.h=a;this.name=b}u(Lh,V);Lh.prototype.apply=function(a){a.b&&a.b.hasAttributeNS(this.h,this.name)&&this.b.apply(a)};
function Mh(a,b,c){this.b=null;this.h=a;this.name=b;this.value=c}u(Mh,V);Mh.prototype.apply=function(a){a.b&&a.b.getAttributeNS(this.h,this.name)==this.value&&this.b.apply(a)};Mh.prototype.f=function(){return"type"==this.name&&"http://www.idpf.org/2007/ops"==this.h?9:0};Mh.prototype.g=function(a){return"type"==this.name&&"http://www.idpf.org/2007/ops"==this.h?(this.b&&Fh(a.f,this.value,this.b),!0):!1};function Nh(a,b){this.b=null;this.h=a;this.name=b}u(Nh,V);
Nh.prototype.apply=function(a){if(a.b){var b=a.b.getAttributeNS(this.h,this.name);b&&fh[b]&&this.b.apply(a)}};Nh.prototype.f=function(){return 0};Nh.prototype.g=function(){return!1};function Oh(a,b,c){this.b=null;this.j=a;this.name=b;this.h=c}u(Oh,V);Oh.prototype.apply=function(a){if(a.b){var b=a.b.getAttributeNS(this.j,this.name);b&&b.match(this.h)&&this.b.apply(a)}};function Ph(a){this.b=null;this.h=a}u(Ph,V);Ph.prototype.apply=function(a){a.lang.match(this.h)&&this.b.apply(a)};
function Qh(){this.b=null}u(Qh,V);Qh.prototype.apply=function(a){a.Ta&&this.b.apply(a)};Qh.prototype.f=function(){return 6};function Rh(){this.b=null}u(Rh,V);Rh.prototype.apply=function(a){a.ra&&this.b.apply(a)};Rh.prototype.f=function(){return 12};function Sh(a,b){this.b=null;this.h=a;this.nc=b}u(Sh,V);function Th(a,b){var c=a.h;b-=a.nc;return c?!(b%c)&&0<=b/c:!b}function Uh(a,b){Sh.call(this,a,b)}u(Uh,Sh);Uh.prototype.apply=function(a){Th(this,a.Ja)&&this.b.apply(a)};Uh.prototype.f=function(){return 5};
function Vh(a,b){Sh.call(this,a,b)}u(Vh,Sh);Vh.prototype.apply=function(a){Th(this,a.nb[a.j][a.f])&&this.b.apply(a)};Vh.prototype.f=function(){return 5};function Wh(a,b){Sh.call(this,a,b)}u(Wh,Sh);Wh.prototype.apply=function(a){var b=a.R;null===b&&(b=a.R=a.b.parentNode.childElementCount-a.Ja+1);Th(this,b)&&this.b.apply(a)};Wh.prototype.f=function(){return 4};function Xh(a,b){Sh.call(this,a,b)}u(Xh,Sh);
Xh.prototype.apply=function(a){var b=a.mb;if(!b[a.j]){var c=a.b;do{var d=c.namespaceURI,e=c.localName,f=b[d];f||(f=b[d]={});f[e]=(f[e]||0)+1}while(c=c.nextElementSibling)}Th(this,b[a.j][a.f])&&this.b.apply(a)};Xh.prototype.f=function(){return 4};function Yh(){this.b=null}u(Yh,V);Yh.prototype.apply=function(a){for(var b=a.b.firstChild;b;){switch(b.nodeType){case Node.ELEMENT_NODE:return;case Node.TEXT_NODE:if(0<b.length)return}b=b.nextSibling}this.b.apply(a)};Yh.prototype.f=function(){return 4};
function Zh(){this.b=null}u(Zh,V);Zh.prototype.apply=function(a){!1===a.b.disabled&&this.b.apply(a)};Zh.prototype.f=function(){return 5};function $h(){this.b=null}u($h,V);$h.prototype.apply=function(a){!0===a.b.disabled&&this.b.apply(a)};$h.prototype.f=function(){return 5};function ai(){this.b=null}u(ai,V);ai.prototype.apply=function(a){var b=a.b;!0!==b.selected&&!0!==b.checked||this.b.apply(a)};ai.prototype.f=function(){return 5};function bi(a){this.b=null;this.T=a}u(bi,V);
bi.prototype.apply=function(a){a.u[this.T]&&this.b.apply(a)};bi.prototype.f=function(){return 5};function ci(){this.b=!1}u(ci,Ah);ci.prototype.apply=function(){this.b=!0};ci.prototype.clone=function(){var a=new ci;a.b=this.b;return a};function di(a){this.b=null;this.h=new ci;this.j=xh(a,this.h)}u(di,V);di.prototype.apply=function(a){this.j.apply(a);this.h.b||this.b.apply(a);this.h.b=!1};di.prototype.f=function(){return this.j.f()};function ei(a){this.T=a}ei.prototype.b=function(){return this};
ei.prototype.push=function(a,b){b||fi(a,this.T);return!1};ei.prototype.pop=function(a,b){return b?!1:(a.u[this.T]--,!0)};function gi(a){this.T=a}gi.prototype.b=function(){return this};gi.prototype.push=function(a,b){b?1==b&&a.u[this.T]--:fi(a,this.T);return!1};gi.prototype.pop=function(a,b){if(b)1==b&&fi(a,this.T);else return a.u[this.T]--,!0;return!1};function hi(a){this.T=a;this.f=!1}hi.prototype.b=function(){return new hi(this.T)};
hi.prototype.push=function(a){return this.f?(a.u[this.T]--,!0):!1};hi.prototype.pop=function(a,b){if(this.f)return a.u[this.T]--,!0;b||(this.f=!0,fi(a,this.T));return!1};function ii(a){this.T=a;this.f=!1}ii.prototype.b=function(){return new ii(this.T)};ii.prototype.push=function(a,b){this.f&&(-1==b?fi(a,this.T):b||a.u[this.T]--);return!1};ii.prototype.pop=function(a,b){if(this.f){if(-1==b)return a.u[this.T]--,!0;b||fi(a,this.T)}else b||(this.f=!0,fi(a,this.T));return!1};
function ji(a,b){this.f=a;this.element=b}ji.prototype.b=function(){return this};ji.prototype.push=function(){return!1};ji.prototype.pop=function(a,b){return b?!1:(ki(a,this.f,this.element),!0)};function li(a){this.lang=a}li.prototype.b=function(){return this};li.prototype.push=function(){return!1};li.prototype.pop=function(a,b){return b?!1:(a.lang=this.lang,!0)};function mi(a){this.f=a}mi.prototype.b=function(){return this};mi.prototype.push=function(){return!1};
mi.prototype.pop=function(a,b){return b?!1:(a.J=this.f,!0)};function ni(a){this.element=a}u(ni,nc);function oi(a,b){switch(b){case "url":return a?new Ac(a):new Ac("about:invalid");default:return a?new vc(a):new vc("")}}
ni.prototype.vb=function(a){if("attr"!==a.name)return nc.prototype.vb.call(this,a);var b="string",c;a.values[0]instanceof oc?(2<=a.values[0].values.length&&(b=a.values[0].values[1].stringValue()),c=a.values[0].values[0].stringValue()):c=a.values[0].stringValue();a=1<a.values.length?oi(a.values[1].stringValue(),b):oi(null,b);return this.element&&this.element.hasAttribute(c)?oi(this.element.getAttribute(c),b):a};function pi(a,b,c){this.f=a;this.element=b;this.b=c}u(pi,nc);
pi.prototype.Ib=function(a){var b=this.f,c=b.J,d=Math.floor(c.length/2)-1;switch(a.name){case "open-quote":a=c[2*Math.min(d,b.C)];b.C++;break;case "close-quote":return 0<b.C&&b.C--,c[2*Math.min(d,b.C)+1];case "no-open-quote":return b.C++,new vc("");case "no-close-quote":return 0<b.C&&b.C--,new vc("")}return a};
var qi={roman:[4999,1E3,"M",900,"CM",500,"D",400,"CD",100,"C",90,"XC",50,"L",40,"XL",10,"X",9,"IX",5,"V",4,"IV",1,"I"],armenian:[9999,9E3,"\u0584",8E3,"\u0583",7E3,"\u0582",6E3,"\u0581",5E3,"\u0580",4E3,"\u057f",3E3,"\u057e",2E3,"\u057d",1E3,"\u057c",900,"\u057b",800,"\u057a",700,"\u0579",600,"\u0578",500,"\u0577",400,"\u0576",300,"\u0575",200,"\u0574",100,"\u0573",90,"\u0572",80,"\u0571",70,"\u0570",60,"\u056f",50,"\u056e",40,"\u056d",30,"\u056c",20,"\u056b",10,"\u056a",9,"\u0569",8,"\u0568",7,"\u0567",
6,"\u0566",5,"\u0565",4,"\u0564",3,"\u0563",2,"\u0562",1,"\u0561"],georgian:[19999,1E4,"\u10f5",9E3,"\u10f0",8E3,"\u10ef",7E3,"\u10f4",6E3,"\u10ee",5E3,"\u10ed",4E3,"\u10ec",3E3,"\u10eb",2E3,"\u10ea",1E3,"\u10e9",900,"\u10e8",800,"\u10e7",700,"\u10e6",600,"\u10e5",500,"\u10e4",400,"\u10f3",300,"\u10e2",200,"\u10e1",100,"\u10e0",90,"\u10df",80,"\u10de",70,"\u10dd",60,"\u10f2",50,"\u10dc",40,"\u10db",30,"\u10da",20,"\u10d9",10,"\u10d8",9,"\u10d7",8,"\u10f1",7,"\u10d6",6,"\u10d5",5,"\u10d4",4,"\u10d3",
3,"\u10d2",2,"\u10d1",1,"\u10d0"],hebrew:[999,400,"\u05ea",300,"\u05e9",200,"\u05e8",100,"\u05e7",90,"\u05e6",80,"\u05e4",70,"\u05e2",60,"\u05e1",50,"\u05e0",40,"\u05de",30,"\u05dc",20,"\u05db",19,"\u05d9\u05d8",18,"\u05d9\u05d7",17,"\u05d9\u05d6",16,"\u05d8\u05d6",15,"\u05d8\u05d5",10,"\u05d9",9,"\u05d8",8,"\u05d7",7,"\u05d6",6,"\u05d5",5,"\u05d4",4,"\u05d3",3,"\u05d2",2,"\u05d1",1,"\u05d0"]},ri={latin:"a-z",alpha:"a-z",greek:"\u03b1-\u03c1\u03c3-\u03c9",russian:"\u0430-\u0438\u043a-\u0449\u044d-\u044f"},
si={square:"\u25a0",disc:"\u2022",circle:"\u25e6",none:""},ti={Df:!1,rc:"\u96f6\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d",Tc:"\u5341\u767e\u5343",Ve:"\u8ca0"};
function ui(a){if(9999<a||-9999>a)return""+a;if(!a)return ti.rc.charAt(0);var b=new ya;0>a&&(b.append(ti.Ve),a=-a);if(10>a)b.append(ti.rc.charAt(a));else if(ti.Ef&&19>=a)b.append(ti.Tc.charAt(0)),a&&b.append(ti.Tc.charAt(a-10));else{var c=Math.floor(a/1E3);c&&(b.append(ti.rc.charAt(c)),b.append(ti.Tc.charAt(2)));if(c=Math.floor(a/100)%10)b.append(ti.rc.charAt(c)),b.append(ti.Tc.charAt(1));if(c=Math.floor(a/10)%10)b.append(ti.rc.charAt(c)),b.append(ti.Tc.charAt(0));(a%=10)&&b.append(ti.rc.charAt(a))}return b.toString()}
function vi(a,b){var c=!1,d=!1,e;if(e=b.match(/^upper-(.*)/))c=!0,b=e[1];else if(e=b.match(/^lower-(.*)/))d=!0,b=e[1];e="";if(qi[b])a:{e=qi[b];var f=a;if(f>e[0]||0>=f||f!=Math.round(f))e="";else{for(var g="",h=1;h<e.length;h+=2){var l=e[h],k=Math.floor(f/l);if(20<k){e="";break a}for(f-=k*l;0<k;)g+=e[h+1],k--}e=g}}else if(ri[b])if(e=a,0>=e||e!=Math.round(e))e="";else{g=ri[b];f=[];for(h=0;h<g.length;)if("-"==g.substr(h+1,1))for(k=g.charCodeAt(h),l=g.charCodeAt(h+2),h+=3;k<=l;k++)f.push(String.fromCharCode(k));
else f.push(g.substr(h++,1));g="";do e--,h=e%f.length,g=f[h]+g,e=(e-h)/f.length;while(0<e);e=g}else null!=si[b]?e=si[b]:"decimal-leading-zero"==b?(e=a+"",1==e.length&&(e="0"+e)):"cjk-ideographic"==b||"trad-chinese-informal"==b?e=ui(a):e=a+"";return c?e.toUpperCase():d?e.toLowerCase():e}
function wi(a,b){var c=b[0].toString(),d=1<b.length?b[1].stringValue():"decimal",e=a.f.g[c];if(e&&e.length)return new vc(vi(e&&e.length&&e[e.length-1]||0,d));c=new E(xi(a.b,c,function(a){return vi(a||0,d)}));return new oc([c])}
function yi(a,b){var c=b[0].toString(),d=b[1].stringValue(),e=2<b.length?b[2].stringValue():"decimal",f=a.f.g[c],g=new ya;if(f&&f.length)for(var h=0;h<f.length;h++)0<h&&g.append(d),g.append(vi(f[h],e));c=new E(zi(a.b,c,function(a){var b=[];if(a.length)for(var c=0;c<a.length;c++)b.push(vi(a[c],e));a=g.toString();a.length&&b.push(a);return b.length?b.join(d):vi(0,e)}));return new oc([c])}
function Ai(a,b){var c=b[0],c=c instanceof Ac?c.url:c.stringValue(),d=b[1].toString(),e=2<b.length?b[2].stringValue():"decimal",c=new E(Bi(a.b,c,d,function(a){return vi(a||0,e)}));return new oc([c])}function Ci(a,b){var c=b[0],c=c instanceof Ac?c.url:c.stringValue(),d=b[1].toString(),e=b[2].stringValue(),f=3<b.length?b[3].stringValue():"decimal",c=new E(Di(a.b,c,d,function(a){a=a.map(function(a){return vi(a,f)});return a.length?a.join(e):vi(0,f)}));return new oc([c])}
pi.prototype.vb=function(a){switch(a.name){case "counter":if(2>=a.values.length)return wi(this,a.values);break;case "counters":if(3>=a.values.length)return yi(this,a.values);break;case "target-counter":if(3>=a.values.length)return Ai(this,a.values);break;case "target-counters":if(4>=a.values.length)return Ci(this,a.values)}v.b("E_CSS_CONTENT_PROP:",a.toString());return new vc("")};var Ei=1/1048576;function Fi(a,b){for(var c in a)b[c]=a[c].clone()}
function Gi(){this.j=0;this.b={};this.Fc={};this.h={};this.f={};this.Aa={};this.g={};this.wc={};this.order=0}Gi.prototype.clone=function(){var a=new Gi;a.j=this.j;for(var b in this.b)a.b[b]=this.b[b];Fi(this.Fc,a.Fc);Fi(this.h,a.h);Fi(this.f,a.f);Fi(this.Aa,a.Aa);Fi(this.g,a.g);Fi(this.wc,a.wc);a.order=this.order;return a};function Fh(a,b,c){var d=a[b];d&&(c=d.l(c));a[b]=c}
function Hi(a,b,c,d){this.A=a;this.l=b;this.Xb=c;this.lb=d;this.h=[[],[]];this.u={};this.G=this.F=this.b=null;this.sa=this.ha=this.V=this.j=this.f="";this.W=this.M=null;this.ra=this.Ta=!0;this.g={};this.H=[{}];this.J=[new vc("\u201c"),new vc("\u201d"),new vc("\u2018"),new vc("\u2019")];this.C=0;this.lang="";this.Nb=[0];this.Ja=0;this.pa=[{}];this.nb=this.pa[0];this.R=null;this.Lb=[this.R];this.Mb=[{}];this.mb=this.pa[0];this.tb=[]}function fi(a,b){a.u[b]=(a.u[b]||0)+1}
function Ii(a,b,c){(b=b[c])&&b.apply(a)}var Ji=[];function Ki(a,b,c,d){a.b=null;a.F=d;a.j="";a.f="";a.V="";a.ha="";a.G=b;a.sa="";a.M=Ji;a.W=c;Li(a)}function Mi(a,b,c){a.g[b]?a.g[b].push(c):a.g[b]=[c];c=a.H[a.H.length-1];c||(c={},a.H[a.H.length-1]=c);c[b]=!0}
function Ni(a,b){var c=Yc,d=b.display;d&&(c=d.evaluate(a.l));var e=null,f=d=null,g=b["counter-reset"];g&&(g=g.evaluate(a.l))&&(e=pg(g,!0));(g=b["counter-set"])&&(g=g.evaluate(a.l))&&(f=pg(g,!1));(g=b["counter-increment"])&&(g=g.evaluate(a.l))&&(d=pg(g,!1));"ol"!=a.f&&"ul"!=a.f||"http://www.w3.org/1999/xhtml"!=a.j||(e||(e={}),e["ua-list-item"]=0);c===dd&&(d||(d={}),d["ua-list-item"]=1);if(e)for(var h in e)Mi(a,h,e[h]);if(f)for(var l in f)a.g[l]?(h=a.g[l],h[h.length-1]=f[l]):Mi(a,l,f[l]);if(d)for(var k in d)a.g[k]||
Mi(a,k,0),h=a.g[k],h[h.length-1]+=d[k];c===dd&&(c=a.g["ua-list-item"],b["ua-list-item-count"]=new U(new xc(c[c.length-1]),0));a.H.push(null)}function Oi(a){var b=a.H.pop();if(b)for(var c in b)(b=a.g[c])&&(1==b.length?delete a.g[c]:b.pop())}function ki(a,b,c){Ni(a,b);b.content&&(b.content=b.content.Oc(new pi(a,c,a.lb)));Oi(a)}var Pi="before transclusion-before footnote-call footnote-marker inner first-letter first-line  transclusion-after after".split(" ");
function Qi(a,b,c){a.tb.push(b);a.W=null;a.b=b;a.F=c;a.j=b.namespaceURI;a.f=b.localName;var d=a.A.b[a.j];a.sa=d?d+a.f:"";a.V=b.getAttribute("id");a.ha=b.getAttributeNS("http://www.w3.org/XML/1998/namespace","id");(d=b.getAttribute("class"))?a.G=d.split(/\s+/):a.G=Ji;(d=b.getAttributeNS("http://www.idpf.org/2007/ops","type"))?a.M=d.split(/\s+/):a.M=Ji;"style"==a.f&&"http://www.gribuser.ru/xml/fictionbook/2.0"==a.j&&(a.G=[b.getAttribute("name")||""]);if(d=xa(b))a.h[a.h.length-1].push(new li(a.lang)),
a.lang=d.toLowerCase();var d=a.ra,e=a.Nb;a.Ja=++e[e.length-1];e.push(0);var e=a.pa,f=a.nb=e[e.length-1],g=f[a.j];g||(g=f[a.j]={});g[a.f]=(g[a.f]||0)+1;e.push({});e=a.Lb;null!==e[e.length-1]?a.R=--e[e.length-1]:a.R=null;e.push(null);e=a.Mb;(f=a.mb=e[e.length-1])&&f[a.j]&&f[a.j][a.f]--;e.push({});Li(a);Ri(a,b);e=c.quotes;c=null;e&&(e=e.evaluate(a.l))&&(c=new mi(a.J),e===F?a.J=[new vc(""),new vc("")]:e instanceof oc&&(a.J=e.values));Ni(a,a.F);e=a.V||a.ha||b.getAttribute("name")||"";if(d||e){var h={};
Object.keys(a.g).forEach(function(a){h[a]=Array.from(this.g[a])},a);Si(a.Xb,e,h)}if(d=a.F._pseudos)for(e=!0,f=0;f<Pi.length;f++)(g=Pi[f])||(e=!1),(g=d[g])&&(e?ki(a,g,b):a.h[a.h.length-2].push(new ji(g,b)));c&&a.h[a.h.length-2].push(c)}function Ti(a,b){for(var c in b)sh(c)&&(b[c]=b[c].Oc(a))}function Ri(a,b){var c=new ni(b),d=a.F,e=d._pseudos,f;for(f in e)Ti(c,e[f]);Ti(c,d)}
function Li(a){var b;for(b=0;b<a.G.length;b++)Ii(a,a.A.Aa,a.G[b]);for(b=0;b<a.M.length;b++)Ii(a,a.A.f,a.M[b]);Ii(a,a.A.g,a.V);Ii(a,a.A.Fc,a.f);""!=a.f&&Ii(a,a.A.Fc,"*");Ii(a,a.A.h,a.sa);null!==a.W&&(Ii(a,a.A.wc,a.W),Ii(a,a.A.wc,"*"));a.b=null;a.h.push([]);for(var c=1;-1<=c;--c){var d=a.h[a.h.length-c-2];for(b=0;b<d.length;)d[b].push(a,c)?d.splice(b,1):b++}a.Ta=!0;a.ra=!1}
Hi.prototype.pop=function(){for(var a=1;-1<=a;--a)for(var b=this.h[this.h.length-a-2],c=0;c<b.length;)b[c].pop(this,a)?b.splice(c,1):c++;this.h.pop();this.Ta=!1};var Ui=null;function Vi(a,b,c,d,e,f,g){df.call(this,a,b,g);this.b=null;this.X=0;this.h=this.Va=null;this.A=!1;this.T=c;this.j=d?d.j:Ui?Ui.clone():new Gi;this.F=e;this.u=f;this.l=0}u(Vi,ef);Vi.prototype.we=function(a){Fh(this.j.Fc,"*",a)};function Wi(a,b){var c=xh(a.b,b);c!==b&&c.g(a.j)||a.we(c)}
Vi.prototype.ub=function(a,b){if(b||a)this.X+=1,b&&a?this.b.push(new Ih(a,b.toLowerCase())):b?this.b.push(new Hh(b.toLowerCase())):this.b.push(new Kh(a))};Vi.prototype.pd=function(a){this.h?(v.b("::"+this.h,"followed by ."+a),this.b.push(new bi(""))):(this.X+=256,this.b.push(new Eh(a)))};var Yi={"nth-child":Uh,"nth-of-type":Vh,"nth-last-child":Wh,"nth-last-of-type":Xh};
Vi.prototype.xc=function(a,b){if(this.h)v.b("::"+this.h,"followed by :"+a),this.b.push(new bi(""));else{switch(a.toLowerCase()){case "enabled":this.b.push(new Zh);break;case "disabled":this.b.push(new $h);break;case "checked":this.b.push(new ai);break;case "root":this.b.push(new Rh);break;case "link":this.b.push(new Hh("a"));this.b.push(new Lh("","href"));break;case "-adapt-href-epub-type":case "href-epub-type":if(b&&1==b.length&&"string"==typeof b[0]){var c=new RegExp("(^|s)"+ma(b[0])+"($|s)");this.b.push(new Jh(c))}else this.b.push(new bi(""));
break;case "-adapt-footnote-content":case "footnote-content":this.A=!0;break;case "visited":case "active":case "hover":case "focus":this.b.push(new bi(""));break;case "lang":b&&1==b.length&&"string"==typeof b[0]?this.b.push(new Ph(new RegExp("^"+ma(b[0].toLowerCase())+"($|-)"))):this.b.push(new bi(""));break;case "nth-child":case "nth-last-child":case "nth-of-type":case "nth-last-of-type":c=Yi[a.toLowerCase()];b&&2==b.length?this.b.push(new c(b[0],b[1])):this.b.push(new bi(""));break;case "first-child":this.b.push(new Qh);
break;case "last-child":this.b.push(new Wh(0,1));break;case "first-of-type":this.b.push(new Vh(0,1));break;case "last-of-type":this.b.push(new Xh(0,1));break;case "only-child":this.b.push(new Qh);this.b.push(new Wh(0,1));break;case "only-of-type":this.b.push(new Vh(0,1));this.b.push(new Xh(0,1));break;case "empty":this.b.push(new Yh);break;case "before":case "after":case "first-line":case "first-letter":this.yc(a,b);return;default:v.b("unknown pseudo-class selector: "+a),this.b.push(new bi(""))}this.X+=
256}};
Vi.prototype.yc=function(a,b){switch(a){case "before":case "after":case "first-line":case "first-letter":case "footnote-call":case "footnote-marker":case "inner":this.h?(v.b("Double pseudoelement ::"+this.h+"::"+a),this.b.push(new bi(""))):this.h=a;break;case "first-n-lines":if(b&&1==b.length&&"number"==typeof b[0]){var c=Math.round(b[0]);if(0<c&&c==b[0]){this.h?(v.b("Double pseudoelement ::"+this.h+"::"+a),this.b.push(new bi(""))):this.h="first-"+c+"-lines";break}}default:v.b("Unrecognized pseudoelement: ::"+a),
this.b.push(new bi(""))}this.X+=1};Vi.prototype.wd=function(a){this.X+=65536;this.b.push(new Gh(a))};
Vi.prototype.Lc=function(a,b,c,d){this.X+=256;b=b.toLowerCase();d=d||"";var e;switch(c){case 0:e=new Lh(a,b);break;case 39:e=new Mh(a,b,d);break;case 45:!d||d.match(/\s/)?e=new bi(""):e=new Oh(a,b,new RegExp("(^|\\s)"+ma(d)+"($|\\s)"));break;case 44:e=new Oh(a,b,new RegExp("^"+ma(d)+"($|-)"));break;case 43:d?e=new Oh(a,b,new RegExp("^"+ma(d))):e=new bi("");break;case 42:d?e=new Oh(a,b,new RegExp(ma(d)+"$")):e=new bi("");break;case 46:d?e=new Oh(a,b,new RegExp(ma(d))):e=new bi("");break;case 50:"supported"==
d?e=new Nh(a,b):(v.b("Unsupported :: attr selector op:",d),e=new bi(""));break;default:v.b("Unsupported attr selector:",c),e=new bi("")}this.b.push(e)};var Zi=0;n=Vi.prototype;n.yb=function(){var a="d"+Zi++;Wi(this,new Ch(new ei(a)));this.b=[new bi(a)]};n.od=function(){var a="c"+Zi++;Wi(this,new Ch(new gi(a)));this.b=[new bi(a)]};n.kd=function(){var a="a"+Zi++;Wi(this,new Ch(new hi(a)));this.b=[new bi(a)]};n.sd=function(){var a="f"+Zi++;Wi(this,new Ch(new ii(a)));this.b=[new bi(a)]};
n.cc=function(){$i(this);this.h=null;this.A=!1;this.X=0;this.b=[]};n.rb=function(){var a;0!=this.l?(gf(this,"E_CSS_UNEXPECTED_SELECTOR"),a=!0):a=!1;a||(this.l=1,this.Va={},this.h=null,this.X=0,this.A=!1,this.b=[])};n.error=function(a,b){ef.prototype.error.call(this,a,b);1==this.l&&(this.l=0)};n.fc=function(a){ef.prototype.fc.call(this,a);this.l=0};n.wa=function(){$i(this);ef.prototype.wa.call(this);1==this.l&&(this.l=0)};n.zb=function(){ef.prototype.zb.call(this)};
function $i(a){if(a.b){var b=a.X,c;c=a.j;c=c.order+=Ei;Wi(a,a.Be(b+c));a.b=null;a.h=null;a.A=!1;a.X=0}}n.Be=function(a){var b=this.F;this.A&&(b=b?"xxx-bogus-xxx":"footnote");return new Dh(this.Va,a,this.h,b)};n.pb=function(a,b,c){ah(this.u,a,b,c,this)};n.uc=function(a,b){ff(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};n.ed=function(a,b){ff(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};
n.qb=function(a,b,c){"display"!=a||b!==hd&&b!==gd||(this.qb("flow-options",new oc([Rc,md]),c),this.qb("flow-into",b,c),b=Hc);(Ed.SIMPLE_PROPERTY||[]).forEach(function(d){d=d({name:a,value:b,important:c});a=d.name;b=d.value;c=d.important});var d=c?$e(this):af(this);th(this.Va,a,this.T?new ph(b,d,this.T):new U(b,d))};n.Cc=function(a){switch(a){case "not":a=new aj(this),a.rb(),cf(this.ia,a)}};function aj(a){Vi.call(this,a.f,a.ia,a.T,a,a.F,a.u,!1);this.parent=a;this.g=a.b}u(aj,Vi);n=aj.prototype;
n.Cc=function(a){"not"==a&&gf(this,"E_CSS_UNEXPECTED_NOT")};n.wa=function(){gf(this,"E_CSS_UNEXPECTED_RULE_BODY")};n.cc=function(){gf(this,"E_CSS_UNEXPECTED_NEXT_SELECTOR")};n.Nc=function(){this.b&&0<this.b.length&&this.g.push(new di(this.b));this.parent.X+=this.X;var a=this.ia;a.b=a.g.pop()};n.error=function(a,b){Vi.prototype.error.call(this,a,b);var c=this.ia;c.b=c.g.pop()};function bj(a,b){df.call(this,a,b,!1)}u(bj,ef);
bj.prototype.pb=function(a,b){if(this.f.values[a])this.error("E_CSS_NAME_REDEFINED "+a,this.tc());else{var c=a.match(/height|^(top|bottom)$/)?"vh":"vw",c=new ac(this.f,100,c),c=b.oa(this.f,c);this.f.values[a]=c}};function cj(a,b,c,d,e){df.call(this,a,b,!1);this.Va=d;this.T=c;this.b=e}u(cj,ef);cj.prototype.pb=function(a,b,c){c?v.b("E_IMPORTANT_NOT_ALLOWED"):ah(this.b,a,b,c,this)};cj.prototype.uc=function(a,b){v.b("E_INVALID_PROPERTY_VALUE",a+":",b.toString())};
cj.prototype.ed=function(a,b){v.b("E_INVALID_PROPERTY",a+":",b.toString())};cj.prototype.qb=function(a,b,c){c=c?$e(this):af(this);c+=this.order;this.order+=Ei;th(this.Va,a,this.T?new ph(b,c,this.T):new U(b,c))};function dj(a,b){Ef.call(this,a);this.Va={};this.b=b;this.order=0}u(dj,Ef);dj.prototype.pb=function(a,b,c){ah(this.b,a,b,c,this)};dj.prototype.uc=function(a,b){v.b("E_INVALID_PROPERTY_VALUE",a+":",b.toString())};dj.prototype.ed=function(a,b){v.b("E_INVALID_PROPERTY",a+":",b.toString())};
dj.prototype.qb=function(a,b,c){c=(c?67108864:50331648)+this.order;this.order+=Ei;th(this.Va,a,new U(b,c))};function ej(a,b,c){return(a=a["writing-mode"])&&(b=a.evaluate(b,"writing-mode"))&&b!==Xc?b===ud:c}function fj(a,b,c,d){var e={},f;for(f in a)sh(f)&&(e[f]=a[f]);a=a._regions;if((c||d)&&a)for(d&&(d=["footnote"],c=c?c.concat(d):d),d=0;d<c.length;d++){f=a[c[d]];for(var g in f)sh(g)&&(e[g]=qh(b,e[g],f[g]))}return e}
function gj(a,b,c,d){c=c?nh:oh;for(var e in a)if(a.hasOwnProperty(e)){var f=a[e];if(f){var g=c[e];if(g){var h=a[g];if(h&&h.Ra>f.Ra)continue;g=ih[g]?g:e}else g=e;b[g]=d(e,f)}}};var hj=!1,ij={sf:"ltr",tf:"rtl"};ba("vivliostyle.constants.PageProgression",ij);ij.LTR="ltr";ij.RTL="rtl";var jj={Ke:"left",Le:"right"};ba("vivliostyle.constants.PageSide",jj);jj.LEFT="left";jj.RIGHT="right";var kj={LOADING:"loading",rf:"interactive",nf:"complete"};ba("vivliostyle.constants.ReadyState",kj);kj.LOADING="loading";kj.INTERACTIVE="interactive";kj.COMPLETE="complete";function lj(a,b,c){this.u=a;this.url=b;this.b=c;this.lang=null;this.h=-1;this.root=c.documentElement;b=a=null;if("http://www.w3.org/1999/xhtml"==this.root.namespaceURI){for(var d=this.root.firstChild;d;d=d.nextSibling)if(1==d.nodeType&&(c=d,"http://www.w3.org/1999/xhtml"==c.namespaceURI))switch(c.localName){case "head":b=c;break;case "body":a=c}this.lang=this.root.getAttribute("lang")}else if("http://www.gribuser.ru/xml/fictionbook/2.0"==this.root.namespaceURI){b=this.root;for(d=this.root.firstChild;d;d=
d.nextSibling)1==d.nodeType&&(c=d,"http://www.gribuser.ru/xml/fictionbook/2.0"==c.namespaceURI&&"body"==c.localName&&(a=c));c=mj(mj(mj(mj(new nj([this.b]),"FictionBook"),"description"),"title-info"),"lang").textContent();0<c.length&&(this.lang=c[0])}else if("http://example.com/sse"==this.root.namespaceURI)for(c=this.root.firstElementChild;c;c=c.nextElementSibling)d=c.localName,"meta"===d?b=c:"body"===d&&(a=c);this.body=a;this.l=b;this.g=this.root;this.j=1;this.g.setAttribute("data-adapt-eloff","0")}
function oj(a,b){var c=b.getAttribute("data-adapt-eloff");if(c)return parseInt(c,10);for(var c=a.j,d=a.g;d!=b;){var e=d.firstChild;if(!e)for(;!(e=d.nextSibling);)if(d=d.parentNode,!d)throw Error("Internal error");d=e;1==e.nodeType?(e.setAttribute("data-adapt-eloff",c.toString()),++c):c+=e.textContent.length}a.j=c;a.g=b;return c-1}
function pj(a,b,c,d){var e=0;if(1==b.nodeType){if(!d)return oj(a,b)}else{e=c;c=b.previousSibling;if(!c)return b=b.parentNode,e+=1,oj(a,b)+e;b=c}for(;;){for(;b.lastChild;)b=b.lastChild;if(1==b.nodeType)break;e+=b.textContent.length;c=b.previousSibling;if(!c){b=b.parentNode;break}b=c}e+=1;return oj(a,b)+e}function qj(a){0>a.h&&(a.h=pj(a,a.root,0,!0));return a.h}
function rj(a,b){for(var c,d=a.root;;){c=oj(a,d);if(c>=b)return d;var e=d.children;if(!e)break;var f=Ga(e.length,function(c){return oj(a,e[c])>b});if(!f)break;if(f<e.length&&oj(a,e[f])<=b)throw Error("Consistency check failed!");d=e[f-1]}c+=1;for(var f=d,g=f.firstChild||f.nextSibling,h=null;;){if(g){if(1==g.nodeType)break;h=f=g;c+=g.textContent.length;if(c>b)break}else if(f=f.parentNode,!f)break;g=f.nextSibling}return h||d}
function sj(a,b){var c=b.getAttribute("id");c&&!a.f[c]&&(a.f[c]=b);(c=b.getAttributeNS("http://www.w3.org/XML/1998/namespace","id"))&&!a.f[c]&&(a.f[c]=b);for(c=b.firstElementChild;c;c=c.nextElementSibling)sj(a,c)}function tj(a,b){var c=b.match(/([^#]*)\#(.+)$/);if(!c||c[1]&&c[1]!=a.url)return null;var c=c[2],d=a.b.getElementById(c);!d&&a.b.getElementsByName&&(d=a.b.getElementsByName(c)[0]);d||(a.f||(a.f={},sj(a,a.b.documentElement)),d=a.f[c]);return d}
var uj={wf:"text/html",xf:"text/xml",hf:"application/xml",gf:"application/xhtml_xml",qf:"image/svg+xml"};function vj(a,b,c){c=c||new DOMParser;var d;try{d=c.parseFromString(a,b)}catch(e){}if(d){a=d.documentElement;if("parsererror"===a.localName)return null;for(a=a.firstChild;a;a=a.nextSibling)if("parsererror"===a.localName)return null}else return null;return d}
function wj(a){var b=a.contentType;if(b){for(var c=Object.keys(uj),d=0;d<c.length;d++)if(uj[c[d]]===b)return b;if(b.match(/\+xml$/))return"application/xml"}if(a=a.url.match(/\.([^./]+)$/))switch(a[1]){case "html":case "htm":return"text/html";case "xhtml":case "xht":return"application/xhtml_xml";case "svg":case "svgz":return"image/svg+xml";case "opf":case "xml":return"application/xml"}return null}
function xj(a,b){var c=a.responseXML;if(!c){var d=new DOMParser,e=a.responseText;if(e){var f=wj(a);(c=vj(e,f||"application/xml",d))&&!f&&(f=c.documentElement,"html"!==f.localName.toLowerCase()||f.namespaceURI?"svg"===f.localName.toLowerCase()&&"image/svg+xml"!==c.contentType&&(c=vj(e,"image/svg+xml",d)):c=vj(e,"text/html",d));c||(c=vj(e,"text/html",d))}}c=c?new lj(b,a.url,c):null;return J(c)}function yj(a){this.bc=a}
function zj(){var a=Aj;return new yj(function(b){return a.bc(b)&&1==b.nodeType&&"http://www.idpf.org/2008/embedding"==b.getAttribute("Algorithm")})}function Bj(){var a=zj(),b=Aj;return new yj(function(c){if(!b.bc(c))return!1;c=new nj([c]);c=mj(c,"EncryptionMethod");a&&(c=Cj(c,a));return 0<c.b.length})}var Aj=new yj(function(){return!0});function nj(a){this.b=a}function Cj(a,b){for(var c=[],d=0;d<a.b.length;d++){var e=a.b[d];b.bc(e)&&c.push(e)}return new nj(c)}
function Dj(a,b){function c(a){d.push(a)}for(var d=[],e=0;e<a.b.length;e++)b(a.b[e],c);return new nj(d)}nj.prototype.forEach=function(a){for(var b=[],c=0;c<this.b.length;c++)b.push(a(this.b[c]));return b};function Ej(a,b){for(var c=[],d=0;d<a.b.length;d++){var e=b(a.b[d]);null!=e&&c.push(e)}return c}function mj(a,b){return Dj(a,function(a,d){for(var c=a.firstChild;c;c=c.nextSibling)c.localName==b&&d(c)})}
function Fj(a){return Dj(a,function(a,c){for(var b=a.firstChild;b;b=b.nextSibling)1==b.nodeType&&c(b)})}function Gj(a,b){return Ej(a,function(a){return 1==a.nodeType?a.getAttribute(b):null})}nj.prototype.textContent=function(){return this.forEach(function(a){return a.textContent})};var Hj={transform:!0,"transform-origin":!0},Ij={top:!0,bottom:!0,left:!0,right:!0};function Jj(a,b,c){this.target=a;this.name=b;this.value=c}var Kj={show:function(a){a.style.visibility="visible"},hide:function(a){a.style.visibility="hidden"},play:function(a){a.currentTime=0;a.play()},pause:function(a){a.pause()},resume:function(a){a.play()},mute:function(a){a.muted=!0},unmute:function(a){a.muted=!1}};
function Lj(a,b){var c=Kj[b];return c?function(){for(var b=0;b<a.length;b++)try{c(a[b])}catch(e){}}:null}
function Mj(a,b){this.h={};this.S=a;this.g=b;this.J=null;this.u=[];var c=this;this.R=function(a){var b=a.currentTarget,d=b.getAttribute("href")||b.getAttributeNS("http://www.w3.org/1999/xlink","href");d&&Oa(c,{type:"hyperlink",target:null,currentTarget:null,Bf:b,href:d,preventDefault:function(){a.preventDefault()}})};this.b={};this.f={width:0,height:0};this.A=this.G=!1;this.C=this.F=!0;this.N=0;this.position=null;this.offset=-1;this.l=null;this.j=[];this.H={top:{},bottom:{},left:{},right:{}}}
u(Mj,Na);function Nj(a,b){(a.F=b)?a.S.setAttribute("data-vivliostyle-auto-page-width",!0):a.S.removeAttribute("data-vivliostyle-auto-page-width")}function Oj(a,b){(a.C=b)?a.S.setAttribute("data-vivliostyle-auto-page-height",!0):a.S.removeAttribute("data-vivliostyle-auto-page-height")}function Pj(a,b,c){var d=a.b[c];d?d.push(b):a.b[c]=[b]}
function Qj(a,b,c){Object.keys(a.b).forEach(function(a){for(var b=this.b[a],c=0;c<b.length;)this.S.contains(b[c])?c++:b.splice(c,1);b.length||delete this.b[a]},a);for(var d=a.u,e=0;e<d.length;e++){var f=d[e];w(f.target,f.name,f.value.toString())}e=Rj(c,a.S);a.f.width=e.width;a.f.height=e.height;for(e=0;e<b.length;e++)if(c=b[e],f=a.b[c.zc],d=a.b[c.Xe],f&&d&&(f=Lj(f,c.action)))for(var g=0;g<d.length;g++)d[g].addEventListener(c.event,f,!1)}
Mj.prototype.zoom=function(a){w(this.S,"transform","scale("+a+")")};Mj.prototype.M=function(){return this.J||this.S};function Sj(a){switch(a){case "normal":case "nowrap":return 0;case "pre-line":return 1;case "pre":case "pre-wrap":return 2;default:return null}}function Tj(a,b){if(1==a.nodeType)return!1;var c=a.textContent;switch(b){case 0:return!!c.match(/^\s*$/);case 1:return!!c.match(/^[ \t\f]*$/);case 2:return!c.length}throw Error("Unexpected whitespace: "+b);}
function Uj(a){this.f=a;this.b=[];this.L=null}function Vj(a,b,c,d,e,f,g,h,l){this.b=a;this.element=b;this.f=c;this.Ra=d;this.l=e;this.h=f;this.$e=g;this.j=h;this.cb=-1;this.g=l}function Wj(a,b){return a.h?!b.h||a.Ra>b.Ra?!0:a.j:!1}function Xj(a,b){return a.top-b.top}function Yj(a,b){return b.right-a.right}
function Zj(a,b){if(a===b)return!0;if(!a||!b||a.ea!==b.ea||a.K!==b.K||a.ka.length!==b.ka.length)return!1;for(var c=0;c<a.ka.length;c++){var d=a[c],e=b[c];if(!(d===e||d&&e&&d.node===e.node&&d.Sa===e.Sa&&d.ma===e.ma&&d.ya===e.ya&&d.va===e.va))return!1}return!0}function ak(a){return{ka:[{node:a.U,Sa:bk,ma:a.ma,ya:null,va:null}],ea:0,K:!1,Ia:a.Ia}}function ck(a,b){var c=new dk(a.node,b,0);c.Sa=a.Sa;c.ma=a.ma;c.ya=a.ya;c.va=a.va?ck(a.va,ek(b)):null;c.L=a.L;return c}var bk=0;
function fk(a,b,c,d,e,f,g){this.ia=a;this.Gd=d;this.ie=null;this.root=b;this.da=c;this.type=f;e&&(e.ie=this);this.b=g}function gk(a,b){this.Ye=a;this.count=b}
function dk(a,b,c){this.U=a;this.parent=b;this.na=c;this.ea=0;this.K=!1;this.Sa=bk;this.ma=b?b.ma:null;this.va=this.ya=null;this.W=!1;this.Ba=!0;this.b=!1;this.l=b?b.l:0;this.A=this.h=this.ha=this.display=null;this.H="baseline";this.M="top";this.md=this.R=0;this.G=!1;this.Kb=b?b.Kb:0;this.j=b?b.j:null;this.u=b?b.u:!1;this.J=this.sc=!1;this.C=this.D=this.F=this.g=null;this.ob=b?b.ob:{};this.w=b?b.w:!1;this.V=b?b.V:"ltr";this.f=b?b.f:null;this.Ia=this.lang=null;this.L=b?b.L:null}
function hk(a){a.Ba=!0;a.l=a.parent?a.parent.l:0;a.D=null;a.C=null;a.ea=0;a.K=!1;a.display=null;a.h=null;a.A=null;a.H="baseline";a.G=!1;a.Kb=a.parent?a.parent.Kb:0;a.j=a.parent?a.parent.j:null;a.u=a.parent?a.parent.u:!1;a.g=null;a.F=null;a.ya=null;a.sc=!1;a.J=!1;a.w=a.parent?a.parent.w:!1;a.ya=null;a.Ia=null;a.L=a.parent?a.parent.L:null}
function ik(a){var b=new dk(a.U,a.parent,a.na);b.ea=a.ea;b.K=a.K;b.ya=a.ya;b.Sa=a.Sa;b.ma=a.ma;b.va=a.va;b.Ba=a.Ba;b.l=a.l;b.display=a.display;b.h=a.h;b.A=a.A;b.H=a.H;b.M=a.M;b.R=a.R;b.md=a.md;b.sc=a.sc;b.J=a.J;b.G=a.G;b.Kb=a.Kb;b.j=a.j;b.u=a.u;b.g=a.g;b.F=a.F;b.D=a.D;b.C=a.C;b.f=a.f;b.w=a.w;b.b=a.b;b.Ia=a.Ia;b.L=a.L;return b}dk.prototype.modify=function(){return this.W?ik(this):this};function ek(a){var b=a;do{if(b.W)break;b.W=!0;b=b.parent}while(b);return a}
dk.prototype.clone=function(){for(var a=ik(this),b=a,c;c=b.parent;)c=ik(c),b=b.parent=c;return a};function jk(a){return{node:a.U,Sa:a.Sa,ma:a.ma,ya:a.ya,va:a.va?jk(a.va):null,L:a.L}}function kk(a){var b=a,c=[];do b.f&&b.parent&&b.parent.f!==b.f||c.push(jk(b)),b=b.parent;while(b);b=a.Ia?lk(a.Ia,a.ea,-1):a.ea;return{ka:c,ea:b,K:a.K,Ia:a.Ia}}function mk(a){for(a=a.parent;a;){if(a.sc)return!0;a=a.parent}return!1}function nk(a){for(a=a.parent;a;){if(a.J)return a;a=a.parent}return null}
function ok(a,b){for(var c=a;c;)c.Ba||b(c),c=c.parent}function pk(a){this.Pa=a;this.b=this.f=null}pk.prototype.clone=function(){var a=new pk(this.Pa);if(this.f){a.f=[];for(var b=0;b<this.f.length;++b)a.f[b]=this.f[b]}if(this.b)for(a.b=[],b=0;b<this.b.length;++b)a.b[b]=this.b[b];return a};
function qk(a,b){if(!b)return!1;if(a===b)return!0;if(!Zj(a.Pa,b.Pa))return!1;if(a.f){if(!b.f||a.f.length!==b.f.length)return!1;for(var c=0;c<a.f.length;c++)if(!Zj(a.f[c],b.f[c]))return!1}else if(b.f)return!1;if(a.b){if(!b.b||a.b.length!==b.b.length)return!1;for(c=0;c<a.b.length;c++)if(!Zj(a.b[c],b.b[c]))return!1}else if(b.b)return!1;return!0}function rk(a,b){this.f=a;this.b=b}rk.prototype.clone=function(){return new rk(this.f.clone(),this.b)};function sk(){this.b=[];this.f="any"}
sk.prototype.clone=function(){for(var a=new sk,b=this.b,c=a.b,d=0;d<b.length;d++)c[d]=b[d].clone();a.f=this.f;return a};function tk(a,b){if(a===b)return!0;if(!b||a.b.length!==b.b.length)return!1;for(var c=0;c<a.b.length;c++){var d=a.b[c],e=b.b[c];if(!e||d!==e&&!qk(d.f,e.f))return!1}return!0}function uk(){this.page=0;this.f={};this.b={};this.g=0}uk.prototype.clone=function(){var a=new uk;a.page=this.page;a.h=this.h;a.g=this.g;a.j=this.j;a.f=this.f;for(var b in this.b)a.b[b]=this.b[b].clone();return a};
function vk(a,b){if(a===b)return!0;if(!b||a.page!==b.page||a.g!==b.g)return!1;var c=Object.keys(a.b),d=Object.keys(b.b);if(c.length!==d.length)return!1;for(d=0;d<c.length;d++){var e=c[d];if(!tk(a.b[e],b.b[e]))return!1}return!0}
function wk(a){this.element=a;this.R=this.M=this.height=this.width=this.H=this.A=this.J=this.u=this.Ja=this.pa=this.Ta=this.ha=this.marginBottom=this.marginTop=this.marginRight=this.marginLeft=this.top=this.left=0;this.Mb=this.V=null;this.sa=this.Nb=this.nb=this.Xb=this.g=0;this.w=!1}function xk(a){return a.marginTop+a.pa+a.A}function yk(a){return a.marginBottom+a.Ja+a.H}function zk(a){return a.marginLeft+a.ha+a.u}function Ak(a){return a.marginRight+a.Ta+a.J}
function Bk(a,b){a.element=b.element;a.left=b.left;a.top=b.top;a.marginLeft=b.marginLeft;a.marginRight=b.marginRight;a.marginTop=b.marginTop;a.marginBottom=b.marginBottom;a.ha=b.ha;a.Ta=b.Ta;a.pa=b.pa;a.Ja=b.Ja;a.u=b.u;a.J=b.J;a.A=b.A;a.H=b.H;a.width=b.width;a.height=b.height;a.M=b.M;a.R=b.R;a.Mb=b.Mb;a.V=b.V;a.g=b.g;a.Xb=b.Xb;a.nb=b.nb;a.w=b.w}function Ck(a,b,c){a.top=b;a.height=c;w(a.element,"top",b+"px");w(a.element,"height",c+"px")}
function Dk(a,b,c){a.left=b;a.width=c;w(a.element,"left",b+"px");w(a.element,"width",c+"px")}function Ek(a,b,c){this.b=a;this.f=b;this.g=c}u(Ek,mc);Ek.prototype.Hc=function(a){this.b.appendChild(this.b.ownerDocument.createTextNode(a.gc));return null};Ek.prototype.lc=function(a){if(this.g.url)this.b.setAttribute("src",a.url);else{var b=this.b.ownerDocument.createElementNS("http://www.w3.org/1999/xhtml","img");b.setAttribute("src",a.url);this.b.appendChild(b)}return null};
Ek.prototype.sb=function(a){this.Jb(a.values);return null};Ek.prototype.hc=function(a){a=a.oa().evaluate(this.f);"string"===typeof a&&this.b.appendChild(this.b.ownerDocument.createTextNode(a));return null};function Fk(a){return!!a&&a!==fd&&a!==F&&a!==Xc};function Gk(a,b,c){this.g=a;this.f=b;this.b=c}function Hk(){this.map=[]}function Ik(a){return a.map.length?a.map[a.map.length-1].b:0}function Jk(a,b){if(a.map.length){var c=a.map[a.map.length-1],d=c.b+b-c.f;c.f==c.g?(c.f=b,c.g=b,c.b=d):a.map.push(new Gk(b,b,d))}else a.map.push(new Gk(b,b,b))}function Kk(a,b){a.map.length?a.map[a.map.length-1].f=b:a.map.push(new Gk(b,0,0))}function Lk(a,b){var c=Ga(a.map.length,function(c){return b<=a.map[c].f}),c=a.map[c];return c.b-Math.max(0,c.g-b)}
function Mk(a,b){var c=Ga(a.map.length,function(c){return b<=a.map[c].b}),c=a.map[c];return c.g-(c.b-b)}function Nk(a,b,c,d,e,f,g,h){this.C=a;this.style=b;this.offset=c;this.F=d;this.j=e;this.b=e.b;this.Na=f;this.Ua=g;this.G=h;this.l=this.u=null;this.A={};this.g=this.f=this.h=null;Ok(this)&&(b=b._pseudos)&&b.before&&(a=new Nk(a,b.before,c,!1,e,Pk(this),g,!0),c=Qk(a,"content"),Fk(c)&&(this.h=a,this.g=a.g));this.g=Rk(Sk(this,"before"),this.g);this.Ua&&Tk[this.g]&&(e.g=Rk(e.g,this.g))}
function Qk(a,b,c){if(!(b in a.A)){var d=a.style[b];a.A[b]=d?d.evaluate(a.C,b):c||null}return a.A[b]}function Uk(a){return Qk(a,"display",Yc)}function Pk(a){if(null===a.u){var b=Uk(a),c=Qk(a,"position"),d=Qk(a,"float");a.u=Vk(b,c,d,a.F).display===Hc}return a.u}function Ok(a){null===a.l&&(a.l=a.G&&Uk(a)!==F);return a.l}function Sk(a,b){var c=null;if(Pk(a)){var d=Qk(a,"break-"+b);d&&(c=d.toString())}return c}function Wk(a){this.g=a;this.b=[];this.Ua=this.Na=!0;this.f=[]}
function Xk(a){return a.b[a.b.length-1]}function Yk(a){return a.b.every(function(a){return Uk(a)!==F})}Wk.prototype.push=function(a,b,c,d){var e=Xk(this);d&&e&&d.b!==e.b&&this.f.push({Na:this.Na,Ua:this.Ua});e=d||e.j;d=this.Ua||!!d;var f=Yk(this);a=new Nk(this.g,a,b,c,e,d||this.Na,d,f);this.b.push(a);this.Na=Ok(a)?!a.h&&Pk(a):this.Na;this.Ua=Ok(a)?!a.h&&d:this.Ua;return a};
Wk.prototype.pop=function(a){var b=this.b.pop(),c=this.Na,d=this.Ua;if(Ok(b)){var e=b.style._pseudos;e&&e.after&&(a=new Nk(b.C,e.after,a,!1,b.j,c,d,!0),c=Qk(a,"content"),Fk(c)&&(b.f=a))}this.Ua&&b.f&&(a=Sk(b.f,"before"),b.j.g=Rk(b.j.g,a));if(a=Xk(this))a.b===b.b?Ok(b)&&(this.Na=this.Ua=!1):(a=this.f.pop(),this.Na=a.Na,this.Ua=a.Ua);return b};
function Zk(a,b){if(!b.Na)return b.offset;var c=a.b.length-1,d=a.b[c];d===b&&(c--,d=a.b[c]);for(;0<=c;){if(d.b!==b.b)return b.offset;if(!d.Na||d.F)return d.offset;b=d;d=a.b[--c]}throw Error("No block start offset found!");}
function $k(a,b,c,d,e,f,g,h){this.da=a;this.root=a.root;this.Ja=c;this.h=d;this.u=f;this.f=this.root;this.M={};this.R={};this.C={};this.G=[];this.A=this.J=this.H=null;this.V=new Hi(b,d,g,h);this.g=new Hk;this.Pa=!0;this.ha=[];this.sa=e;this.ra=this.pa=!1;this.b=a=oj(a,this.root);this.W={};this.j=new Wk(d);Jk(this.g,a);d=al(this,this.root);Qi(this.V,this.root,d);bl(this,d,!1);this.F=!0;switch(this.root.namespaceURI){case "http://www.w3.org/1999/xhtml":case "http://www.gribuser.ru/xml/fictionbook/2.0":this.F=
!1}this.ha.push(!0);this.R={};this.R["e"+a]=d;this.b++;cl(this,-1)}function dl(a,b,c,d){return(b=b[d])&&b.evaluate(a.h)!==c[d]}function el(a,b,c){for(var d in c){var e=b[d];e?(a.M[d]=e,delete b[d]):(e=c[d])&&(a.M[d]=new U(e,33554432))}}var fl=["column-count","column-width"];
function bl(a,b,c){c||["writing-mode","direction"].forEach(function(a){b[a]&&(this.M[a]=b[a])},a);if(!a.pa){var d=dl(a,b,a.u.j,"background-color")?b["background-color"].evaluate(a.h):null,e=dl(a,b,a.u.j,"background-image")?b["background-image"].evaluate(a.h):null;if(d&&d!==Xc||e&&e!==Xc)el(a,b,a.u.j),a.pa=!0}if(!a.ra)for(d=0;d<fl.length;d++)if(dl(a,b,a.u.u,fl[d])){el(a,b,a.u.u);a.ra=!0;break}if(!c&&(c=b["font-size"])){d=c.evaluate(a.h);c=d.I;switch(d.fa){case "em":case "rem":c*=a.h.u;break;case "ex":case "rex":c*=
a.h.u*tb.ex/tb.em;break;case "%":c*=a.h.u/100;break;default:(d=tb[d.fa])&&(c*=d)}a.h.W=c}}function gl(a){for(var b=0;!a.F&&(b+=5E3,hl(a,b,0)!=Number.POSITIVE_INFINITY););return a.M}function al(a,b){if(b.style instanceof CSSStyleDeclaration){var c=b.getAttribute("style");if(c){var d=a.da.url,e=new dj(a.Ja,a.u),c=new Pe(c,e);try{Df(new uf(jf,c,e,d),Number.POSITIVE_INFINITY,!1,!0,!1,!1)}catch(f){v.b(f,"Style attribute parse error:")}return e.Va}}return{}}
function cl(a,b){if(!(b>=a.b)){var c=a.h,d=oj(a.da,a.root);if(b<d){var e=a.l(a.root,!1),f=e["flow-into"],f=f?f.evaluate(c,"flow-into").toString():"body",f=il(a,f,e,a.root,d);!a.j.b.length&&a.j.push(e,d,!0,f)}d=rj(a.da,b);e=pj(a.da,d,0,!1);if(!(e>=a.b))for(;;){if(1!=d.nodeType)e+=d.textContent.length;else{var g=d;if(e!=oj(a.da,g))throw Error("Inconsistent offset");var h=a.l(g,!1);if(f=h["flow-into"])f=f.evaluate(c,"flow-into").toString(),il(a,f,h,g,e);e++}if(e>=a.b)break;f=d.firstChild;if(!f)for(;!(f=
d.nextSibling);)if(d=d.parentNode,d===a.root)return;d=f}}}function jl(a,b){a.H=b;for(var c=0;c<a.G.length;c++)kl(a.H,a.G[c],a.C[a.G[c].b])}
function il(a,b,c,d,e){var f=0,g=Number.POSITIVE_INFINITY,h=!1,l=!1,k=!1,m=c["flow-options"];if(m){var p;a:{if(h=m.evaluate(a.h,"flow-options")){l=new jg;try{h.aa(l);p=l.b;break a}catch(q){v.b(q,"toSet:")}}p={}}h=!!p.exclusive;l=!!p["static"];k=!!p.last}(p=c["flow-linger"])&&(g=lg(p.evaluate(a.h,"flow-linger"),Number.POSITIVE_INFINITY));(c=c["flow-priority"])&&(f=lg(c.evaluate(a.h,"flow-priority"),0));c=a.W[e]||null;p=a.C[b];p||(p=Xk(a.j),p=a.C[b]=new Uj(p?p.j.b:null));d=new Vj(b,d,e,f,g,h,l,k,c);
a.G.push(d);a.J==b&&(a.J=null);a.H&&kl(a.H,d,p);return d}function ll(a,b,c,d){Tk[b]&&(d=a.C[d].b,(!d.length||d[d.length-1]<c)&&d.push(c));a.W[c]=Rk(a.W[c],b)}
function hl(a,b,c){var d=-1;if(b<=a.b&&(d=Lk(a.g,b),d+=c,d<Ik(a.g)))return Mk(a.g,d);if(!a.f)return Number.POSITIVE_INFINITY;for(var e=a.h;;){var f=a.f.firstChild;if(!f)for(;;){if(1==a.f.nodeType){var f=a.V,g=a.f;if(f.tb.pop()!==g)throw Error("Invalid call to popElement");f.Nb.pop();f.pa.pop();f.Lb.pop();f.Mb.pop();f.pop();Oi(f);a.Pa=a.ha.pop();g=a.j.pop(a.b);f=null;g.f&&(f=Sk(g.f,"before"),ll(a,f,g.f.Na?Zk(a.j,g):g.f.offset,g.b),f=Sk(g.f,"after"));f=Rk(f,Sk(g,"after"));ll(a,f,a.b,g.b)}if(f=a.f.nextSibling)break;
a.f=a.f.parentNode;if(a.f===a.root)return a.f=null,b<a.b&&(0>d&&(d=Lk(a.g,b),d+=c),d<=Ik(a.g))?Mk(a.g,d):Number.POSITIVE_INFINITY}a.f=f;if(1!=a.f.nodeType){a.b+=a.f.textContent.length;var f=a.j,g=a.f,h=Xk(f);(f.Na||f.Ua)&&Ok(h)&&(h=Qk(h,"white-space",fd).toString(),Tj(g,Sj(h))||(f.Na=!1,f.Ua=!1));a.Pa?Jk(a.g,a.b):Kk(a.g,a.b)}else{g=a.f;f=al(a,g);a.ha.push(a.Pa);Qi(a.V,g,f);(h=g.getAttribute("id")||g.getAttributeNS("http://www.w3.org/XML/1998/namespace","id"))&&h===a.A&&(a.A=null);a.F||"body"!=g.localName||
g.parentNode!=a.root||(bl(a,f,!0),a.F=!0);if(h=f["flow-into"]){var h=h.evaluate(e,"flow-into").toString(),l=il(a,h,f,g,a.b);a.Pa=!!a.sa[h];g=a.j.push(f,a.b,g===a.root,l)}else g=a.j.push(f,a.b,g===a.root);h=Zk(a.j,g);ll(a,g.g,h,g.b);g.h&&(l=Sk(g.h,"after"),ll(a,l,g.h.Na?h:g.offset,g.b));a.Pa&&Uk(g)===F&&(a.Pa=!1);if(oj(a.da,a.f)!=a.b)throw Error("Inconsistent offset");a.R["e"+a.b]=f;a.b++;a.Pa?Jk(a.g,a.b):Kk(a.g,a.b);if(b<a.b&&(0>d&&(d=Lk(a.g,b),d+=c),d<=Ik(a.g)))return Mk(a.g,d)}}}
$k.prototype.l=function(a,b){var c=oj(this.da,a),d="e"+c;b&&(c=pj(this.da,a,0,!0));this.b<=c&&hl(this,c,0);return this.R[d]};var ml={"font-style":fd,"font-variant":fd,"font-weight":fd},nl="OTTO"+(new Date).valueOf(),ol=1;function pl(a,b){var c={},d;for(d in a)c[d]=a[d].evaluate(b,d);for(var e in ml)c[e]||(c[e]=ml[e]);return c}function ql(a){a=this.Sb=a;var b=new ya,c;for(c in ml)b.append(" "),b.append(a[c].toString());this.f=b.toString();this.src=this.Sb.src?this.Sb.src.toString():null;this.g=[];this.h=[];this.b=(c=this.Sb["font-family"])?c.stringValue():null}
function rl(a,b,c){var d=new ya;d.append("@font-face {\n  font-family: ");d.append(a.b);d.append(";\n  ");for(var e in ml)d.append(e),d.append(": "),a.Sb[e].Ka(d,!0),d.append(";\n  ");c?(d.append('src: url("'),b=(window.URL||window.webkitURL).createObjectURL(c),d.append(b),a.g.push(b),a.h.push(c),d.append('")')):(d.append("src: "),d.append(b));d.append(";\n}\n");return d.toString()}function sl(a){this.f=a;this.b={}}
function tl(a,b){if(b instanceof pc){for(var c=b.values,d=[],e=0;e<c.length;e++){var f=c[e],g=a.b[f.stringValue()];g&&d.push(C(g));d.push(f)}return new pc(d)}return(c=a.b[b.stringValue()])?new pc([C(c),b]):b}function ul(a,b){this.b=a;this.body=b;this.f={};this.g=0}function vl(a,b,c){b=b.b;var d=c.b[b];if(d)return d;d="Fnt_"+ ++a.g;return c.b[b]=d}
function wl(a,b,c,d){var e=I("initFont"),f=b.src,g={},h;for(h in ml)g[h]=b.Sb[h];d=vl(a,b,d);g["font-family"]=C(d);var l=new ql(g),k=a.body.ownerDocument.createElement("span");k.textContent="M";var m=(new Date).valueOf()+1E3;b=a.b.ownerDocument.createElement("style");h=nl+ol++;b.textContent=rl(l,"",Te([h]));a.b.appendChild(b);a.body.appendChild(k);k.style.visibility="hidden";k.style.fontFamily=d;for(var p in ml)w(k,p,g[p].toString());var g=k.getBoundingClientRect(),q=g.right-g.left,x=g.bottom-g.top;
b.textContent=rl(l,f,c);v.g("Starting to load font:",f);var r=!1;be(function(){var a=k.getBoundingClientRect(),b=a.bottom-a.top;return q!=a.right-a.left||x!=b?(r=!0,J(!1)):(new Date).valueOf()>m?J(!1):ae(10)}).then(function(){r?v.g("Loaded font:",f):v.b("Failed to load font:",f);a.body.removeChild(k);M(e,l)});return K(e)}
function xl(a,b,c){var d=b.src,e=a.f[d];e?ge(e,function(a){if(a.f==b.f){var e=b.b,f=c.b[e];a=a.b;if(f){if(f!=a)throw Error("E_FONT_FAMILY_INCONSISTENT "+b.b);}else c.b[e]=a;v.b("Found already-loaded font:",d)}else v.b("E_FONT_FACE_INCOMPATIBLE",b.src)}):(e=new fe(function(){var e=I("loadFont"),g=c.f?c.f(d):null;g?Se(d,"blob").then(function(d){d.Wc?g(d.Wc).then(function(d){wl(a,b,d,c).Da(e)}):M(e,null)}):wl(a,b,null,c).Da(e);return K(e)},"loadFont "+d),a.f[d]=e,e.start());return e}
function yl(a,b,c){for(var d=[],e=0;e<b.length;e++){var f=b[e];f.src&&f.b?d.push(xl(a,f,c)):v.b("E_FONT_FACE_INVALID")}return he(d)};Fd("SIMPLE_PROPERTY",function(a){var b=a.name,c=a.value;switch(b){case "page-break-before":case "page-break-after":case "page-break-inside":return{name:b.replace(/^page-/,""),value:c===Fc?id:c,important:a.important};default:return a}});var Tk={page:!0,left:!0,right:!0,recto:!0,verso:!0,column:!0,region:!0},zl={avoid:!0,"avoid-page":!0,"avoid-column":!0,"avoid-region":!0};
function Rk(a,b){if(a)if(b){var c=!!Tk[a],d=!!Tk[b];if(c&&d)switch(b){case "column":return a;case "region":return"column"===a?b:a;default:return b}else return d?b:c?a:zl[b]?b:zl[a]?a:b}else return a;else return b}function Al(a){switch(a){case "left":case "right":case "recto":case "verso":return a;default:return"any"}};var Bl={img:!0,svg:!0,audio:!0,video:!0};
function Cl(a,b,c,d){var e=a.D;if(!e)return NaN;if(1==e.nodeType){if(a.K){var f=Rj(b,e);if(f.right>=f.left&&f.bottom>=f.top)return d?f.left:f.bottom}return NaN}var f=NaN,g=e.ownerDocument.createRange(),h=e.textContent.length;if(!h)return NaN;a.K&&(c+=h);c>=h&&(c=h-1);g.setStart(e,c);g.setEnd(e,c+1);a=Dl(b,g);if(c=d){c=document.body;if(null==Pa){var l=c.ownerDocument,g=l.createElement("div");g.style.position="absolute";g.style.top="0px";g.style.left="0px";g.style.width="100px";g.style.height="100px";
g.style.overflow="hidden";g.style.lineHeight="16px";g.style.fontSize="16px";w(g,"writing-mode","vertical-rl");c.appendChild(g);h=l.createTextNode("a a a a a a a a a a a a a a a a");g.appendChild(h);l=l.createRange();l.setStart(h,0);l.setEnd(h,1);h=l.getBoundingClientRect();Pa=10>h.right-h.left;c.removeChild(g)}c=Pa}if(c){c=e.ownerDocument.createRange();c.setStart(e,0);c.setEnd(e,e.textContent.length);b=Dl(b,c);e=[];for(c=0;c<a.length;c++){g=a[c];for(h=0;h<b.length;h++)if(l=b[h],g.top>=l.top&&g.bottom<=
l.bottom&&1>Math.abs(g.left-l.left)){e.push({top:g.top,left:l.left,bottom:g.bottom,right:l.right});break}h==b.length&&(v.b("Could not fix character box"),e.push(g))}a=e}for(e=b=0;e<a.length;e++)c=a[e],g=d?c.bottom-c.top:c.right-c.left,c.right>c.left&&c.bottom>c.top&&(isNaN(f)||g>b)&&(f=d?c.left:c.bottom,b=g);return f}function El(a){for(var b=Ed.RESOLVE_LAYOUT_PROCESSOR||[],c=0;c<b.length;c++){var d=b[c](a);if(d)return d}throw Error("No processor found for a formatting context: "+a.le());}
function Fl(){}function Gl(a){if(!a)return null;for(a=a.L;a;){var b=a.Zb();if(b)return b;a=a.me()}return null}function Hl(a,b){this.h=a;this.u=b;this.j=!1;this.l=null}u(Hl,Fl);Hl.prototype.f=function(a,b){if(b<this.b())return null;this.j||(this.l=Il(a,this,0<b),this.j=!0);return this.l};Hl.prototype.b=function(){return this.u};Hl.prototype.g=function(){return Gl(this.h[0])};function Jl(a,b,c,d){this.position=a;this.C=b;this.u=c;this.A=d;this.h=!1;this.l=0}u(Jl,Fl);
Jl.prototype.f=function(a,b){this.h||(this.l=Cl(this.position,a.f,0,a.w),this.h=!0);var c=this.l,d=this.g();d&&(c+=(a.w?-1:1)*Kl(d));this.u=this.position.b=Ll(a,c);b<this.b()?c=null:(a.g=this.A,c=this.position);return c};Jl.prototype.b=function(){if(!this.h)throw Error("EdgeBreakPosition.prototype.updateEdge not called");return(zl[this.C]?1:0)+(this.u?3:0)+(this.position.parent?this.position.parent.l:0)};Jl.prototype.g=function(){return Gl(this.position)};
function Ml(a,b,c){this.na=a;this.f=b;this.b=c}function Nl(a){for(var b=1;b<a.length;b++){var c=a[b-1],d=a[b];c===d?v.b("validateCheckPoints: duplicate entry"):c.na>=d.na?v.b("validateCheckPoints: incorrect boxOffset"):c.U==d.U&&(d.K?c.K&&v.b("validateCheckPoints: duplicate after points"):c.K?v.b("validateCheckPoints: inconsistent after point"):d.na-c.na!=d.ea-c.ea&&v.b("validateCheckPoints: boxOffset inconsistent with offsetInNode"))}}function Ol(a){this.parent=a}Ol.prototype.le=function(){return"Block formatting context (adapt.layout.BlockFormattingContext)"};
Ol.prototype.xe=function(a,b){return b};Ol.prototype.me=function(){return this.parent};Ol.prototype.Zb=function(){return null};function Pl(a,b,c,d){wk.call(this,a);this.Td=a.lastChild;this.b=b;this.f=c;this.mb=d;this.Qe=a.ownerDocument;this.Ud=null;this.hd=!1;this.G=this.$a=this.za=this.ra=this.W=0;this.tb=this.Lb=this.C=this.lb=null;this.Yd=!1;this.l=this.h=this.F=null;this.se=!0;this.jd=this.nd=this.ld=0;this.j=!0}u(Pl,wk);
Pl.prototype.clone=function(){var a=new Pl(this.element,this.b,this.f,this.mb);Bk(a,this);a.Td=this.Td;a.hd=this.hd;a.C=this.C?this.C.clone():null;a.Lb=this.Lb.concat();return a};function Ll(a,b){return a.w?b<a.G:b>a.G}
Pl.prototype.Xd=function(a){var b=this,c=I("openAllViews"),d=a.ka;Ql(b.b,b.element,b.hd);var e=d.length-1,f=null;be(function(){for(;0<=e;){f=ck(d[e],f);e!==d.length-1||f.L||(f.L=b.Ud);if(!e){var c=f,h;h=a;h=h.Ia?lk(h.Ia,h.ea,1):h.ea;c.ea=h;f.K=a.K;f.Ia=a.Ia;if(f.K)break}c=Rl(b.b,f,!e&&!f.ea);e--;if(c.ua())return c}return J(!1)}).then(function(){M(c,f)});return K(c)};var Sl=/^[^A-Za-z0-9_\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]*([A-Za-z0-9_\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527][^A-Za-z0-9_\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]*)?/;
function Tl(a,b){if(b.f&&b.Ba&&!b.K&&!b.f.count&&1!=b.D.nodeType){var c=b.D.textContent.match(Sl);return Ul(a.b,b,c[0].length)}return J(b)}
function Vl(a,b,c){var d=I("buildViewToNextBlockEdge");ce(function(d){b.D&&c.push(ek(b));Tl(a,b).then(function(e){e!==b&&(b=e,c.push(ek(b)));Wl(a.b,b).then(function(c){if(b=c){if(!Xl(a.mb,b)&&(b=b.modify(),b.b=!0,a.j)){N(d);return}b.h&&!a.w?Yl(a,b).then(function(c){b=c;!b||a.j&&b&&b.b||0<a.b.f.b.length?N(d):ee(d)}):b.Ba?ee(d):N(d)}else N(d)})})}).then(function(){M(d,b)});return K(d)}
function Zl(a,b){if(!b.D)return J(b);var c=b.U,d=I("buildDeepElementView");ce(function(d){Tl(a,b).then(function(e){if(e!==b){for(var f=e;f&&f.U!=c;)f=f.parent;if(!f){b=e;N(d);return}}Wl(a.b,e).then(function(e){(b=e)&&b.U!=c?Xl(a.mb,b)?ee(d):(b=b.modify(),b.b=!0,a.j?N(d):ee(d)):N(d)})})}).then(function(){M(d,b)});return K(d)}
function $l(a,b,c,d,e){var f=a.Qe.createElement("div");a.w?(w(f,"height",d+"px"),w(f,"width",e+"px")):(w(f,"width",d+"px"),w(f,"height",e+"px"));w(f,"float",c);w(f,"clear",c);a.element.insertBefore(f,b);return f}function am(a){for(var b=a.element.firstChild;b;){var c=b.nextSibling;if(1==b.nodeType){var d=b.style.cssFloat;if("left"==d||"right"==d)a.element.removeChild(b);else break}b=c}}
function bm(a){for(var b=a.element.firstChild,c=a.tb,d=a.w?a.w?a.W:a.za:a.w?a.$a:a.W,e=a.w?a.w?a.ra:a.$a:a.w?a.za:a.ra,f=0;f<c.length;f++){var g=c[f],h=g.Z-g.ca;g.left=$l(a,b,"left",g.ja-d,h);g.right=$l(a,b,"right",e-g.ba,h)}}function cm(a,b,c,d,e){var f;if(b&&b.K&&!b.Ba&&(f=Cl(b,a.f,0,a.w),!isNaN(f)))return f;b=c[d];for(e-=b.na;;){f=Cl(b,a.f,e,a.w);if(!isNaN(f))return f;if(0<e)e--;else{d--;if(0>d)return a.za;b=c[d];1!=b.D.nodeType&&(e=b.D.textContent.length)}}}
function X(a){return"number"==typeof a?a:(a=a.match(/^(-?[0-9]*(\.[0-9]*)?)px$/))?parseFloat(a[0]):0}function dm(a,b){var c=em(a.f,b),d=new Of;c&&(d.left=X(c.marginLeft),d.top=X(c.marginTop),d.right=X(c.marginRight),d.bottom=X(c.marginBottom));return d}function fm(a,b){var c=em(a.f,b),d=new Of;c&&(d.left=X(c.borderLeftWidth)+X(c.paddingLeft),d.top=X(c.borderTopWidth)+X(c.paddingTop),d.right=X(c.borderRightWidth)+X(c.paddingRight),d.bottom=X(c.borderBottomWidth)+X(c.paddingBottom));return d}
function gm(a,b){var c=em(a.f,b),d=new Of;if(c){if("border-box"==c.boxSizing)return dm(a,b);d.left=X(c.marginLeft)+X(c.borderLeftWidth)+X(c.paddingLeft);d.top=X(c.marginTop)+X(c.borderTopWidth)+X(c.paddingTop);d.right=X(c.marginRight)+X(c.borderRightWidth)+X(c.paddingRight);d.bottom=X(c.marginBottom)+X(c.borderBottomWidth)+X(c.paddingBottom)}return d}
function hm(a,b,c){if(a=em(a.f,b))c.marginLeft=X(a.marginLeft),c.ha=X(a.borderLeftWidth),c.u=X(a.paddingLeft),c.marginTop=X(a.marginTop),c.pa=X(a.borderTopWidth),c.A=X(a.paddingTop),c.marginRight=X(a.marginRight),c.Ta=X(a.borderRightWidth),c.J=X(a.paddingRight),c.marginBottom=X(a.marginBottom),c.Ja=X(a.borderBottomWidth),c.H=X(a.paddingBottom)}function im(a,b,c){b=new Ml(b,c,c);a.h?a.h.push(b):a.h=[b]}
function jm(a,b,c,d){if(a.h&&a.h[a.h.length-1].b)return im(a,b,c),J(!0);d+=40*(a.w?-1:1);var e=a.C,f=!e;if(f){var g=a.element.ownerDocument.createElement("div");w(g,"position","absolute");var h=a.b.clone(),e=new Pl(g,h,a.f,a.mb);a.C=e;e.w=km(a.b,a.w,g);e.hd=!0;a.w?(e.left=0,w(e.element,"width","2em")):(e.top=a.$a,w(e.element,"height","2em"))}a.element.appendChild(e.element);hm(a,e.element,e);g=(a.w?-1:1)*(d-a.za);a.w?e.height=a.lb.Z-a.lb.ca-xk(e)-yk(e):e.width=a.lb.ba-a.lb.ja-zk(e)-Ak(e);d=(a.w?-1:
1)*(a.$a-d)-(a.w?zk(e)-Ak(e):xk(e)+yk(e));if(f&&18>d)return a.element.removeChild(e.element),a.C=null,im(a,b,c),J(!0);if(!a.w&&e.top<g)return a.element.removeChild(e.element),im(a,b,c),J(!0);var l=I("layoutFootnoteInner");a.w?Dk(e,0,d):Ck(e,g,d);e.M=a.M+a.left+zk(a);e.R=a.R+a.top+xk(a);e.V=a.V;var k=new pk(c);f?(lm(e),d=J(!0)):e.V.length?d=mm(e):(nm(e),d=J(!0));d.then(function(){om(e,k).then(function(d){if(f&&d)a.element.removeChild(e.element),im(a,b,c),a.C=null,M(l,!0);else{a.w?(a.G=a.$a+(e.g+zk(e)+
Ak(e)),Dk(e,0,e.g)):(a.G=a.$a-(e.g+xk(e)+yk(e)),Ck(e,a.G-a.za,e.g));var g;!a.w&&0<e.V.length?g=mm(e):g=J(d);g.then(function(d){d=new Ml(b,c,d?d.Pa:null);a.h?a.h.push(d):a.h=[d];M(l,!0)})}})});return K(l)}
function pm(a,b){var c=I("layoutFootnote"),d=b.D;d.setAttribute("style","");w(d,"display","inline-block");d.textContent="M";var e=Rj(a.f,d),f=a.w?e.left:e.bottom;d.textContent="";qm(a.b,b,"footnote-call",d);d.textContent||d.parentNode.removeChild(d);d=ak(b);e=b.na;b=b.modify();b.K=!0;jm(a,e,d,f).then(function(){a.C&&a.C.element.parentNode&&a.element.removeChild(a.C.element);Ll(a,f)&&a.F.length&&(b.b=!0);M(c,b)});return K(c)}
function rm(a,b){var c=I("layoutFloat"),d=b.D,e=b.h,f=b.ha,g=b.parent?b.parent.V:"ltr",h=a.b.f,l=b.D.parentNode;"page"===f?sm(h,d,e):(w(d,"float","none"),w(d,"display","inline-block"),w(d,"vertical-align","top"));Zl(a,b).then(function(k){var m=Rj(a.f,d),p=dm(a,d),m=new Mf(m.left-p.left,m.top-p.top,m.right+p.right,m.bottom+p.bottom);if("page"===f)tm(h,b,a.b)?(m=l.ownerDocument.createElement("span"),w(m,"width","0"),w(m,"height","0"),l.appendChild(m),k.D=m,M(c,k)):um(h,b,m).then(function(){M(c,null)});
else{e=vm(e,a.w,g);for(var q=a.W,x=a.ra,p=b.parent;p&&p.Ba;)p=p.parent;if(p){var r=p.D.ownerDocument.createElement("div");r.style.left="0px";r.style.top="0px";a.w?(r.style.bottom="0px",r.style.width="1px"):(r.style.right="0px",r.style.height="1px");p.D.appendChild(r);var t=Rj(a.f,r),q=Math.max(a.w?t.top:t.left,q),x=Math.min(a.w?t.bottom:t.right,x);p.D.removeChild(r);r=a.w?m.Z-m.ca:m.ba-m.ja;"left"==e?x=Math.max(x,q+r):q=Math.min(q,x-r);p.D.appendChild(b.D)}r=new Mf(q,(a.w?-1:1)*a.za,x,(a.w?-1:1)*
a.$a);q=m;a.w&&(q=cg(m));x=a.w?-1:1;q.ca<a.jd*x&&(t=q.Z-q.ca,q.ca=a.jd*x,q.Z=q.ca+t);hg(r,a.tb,q,e);a.w&&(m=new Mf(-q.Z,q.ja,-q.ca,q.ba));r=gm(a,d);w(d,"width",m.ba-m.ja-r.left-r.right+"px");w(d,"height",m.Z-m.ca-r.top-r.bottom+"px");w(d,"position","absolute");w(d,"display",b.display);x=null;p&&(p.J?x=p:x=nk(p));x?(r=x.D.ownerDocument.createElement("div"),r.style.position="absolute",x.w?r.style.right="0":r.style.left="0",r.style.top="0",x.D.appendChild(r),p=Rj(a.f,r),x.D.removeChild(r)):p={left:a.w?
a.$a:a.W,right:a.w?a.za:a.ra,top:a.w?a.W:a.za};(x?x.w:a.w)?w(d,"right",p.right-m.ba+a.J+"px"):w(d,"left",m.ja-p.left+a.u+"px");w(d,"top",m.ca-p.top+a.A+"px");b.C&&(b.C.parentNode.removeChild(b.C),b.C=null);p=a.w?m.ja:m.Z;m=a.w?m.ba:m.ca;Ll(a,p)&&a.F.length?(b=b.modify(),b.b=!0,M(c,b)):(am(a),r=new Mf(a.w?a.$a:a.W,a.w?a.W:a.za,a.w?a.za:a.ra,a.w?a.ra:a.$a),a.w&&(r=cg(r)),ig(r,a.tb,q,e),bm(a),"left"==e?a.ld=p:a.nd=p,a.jd=m,wm(a,p),M(c,k))}});return K(c)}
function xm(a,b){if(!a.K||a.Ba){for(var c=a.D,d="";c&&b&&!d&&(1!=c.nodeType||(d=c.style.textAlign,b));c=c.parentNode);if(!b||"justify"==d){var c=a.D,e=c.ownerDocument,d=e.createElement("span");d.style.visibility="hidden";var f=document.body;if(null===Qa){var g=f.ownerDocument,h=g.createElement("div");h.style.position="absolute";h.style.top="0px";h.style.left="0px";h.style.width="30px";h.style.height="100px";h.style.lineHeight="16px";h.style.fontSize="16px";h.style.textAlign="justify";f.appendChild(h);
var l=g.createTextNode("a | ");h.appendChild(l);var k=g.createElement("span");k.style.display="inline-block";k.style.width="30px";h.appendChild(k);g=g.createRange();g.setStart(l,0);g.setEnd(l,3);Qa=27>g.getBoundingClientRect().right;f.removeChild(h)}Qa?a.w?d.style.marginTop="100%":d.style.marginLeft="100%":(d.style.display="inline-block",a.w?d.style.height="100%":d.style.width="100%");d.textContent=" #";d.setAttribute("data-adapt-spec","1");f=b&&(a.K||1!=c.nodeType)?c.nextSibling:c;if(c=c.parentNode)c.insertBefore(d,
f),b||(e=e.createElement("div"),c.insertBefore(e,f),d.style.lineHeight="80px",e.style.marginTop="-80px",e.style.height="0px",e.setAttribute("data-adapt-spec","1"))}}}
function ym(a,b,c,d){var e=I("processLineStyling");Nl(d);var f=d.concat([]);d.splice(0,d.length);var g=0,h=b.f;0==h.count&&(h=h.Ye);ce(function(d){if(h){var e=zm(a,f),l=h.count-g;if(e.length<=l)N(d);else{var p=Am(a,f,e[l-1]);p?Bm(a,p,!1,!1).then(function(){g+=l;Ul(a.b,p,0).then(function(e){b=e;xm(b,!1);h=b.f;f=[];Vl(a,b,f).then(function(b){c=b;0<a.b.f.b.length?N(d):ee(d)})})}):N(d)}}else N(d)}).then(function(){Array.prototype.push.apply(d,f);Nl(d);M(e,c)});return K(e)}
function Cm(a,b){for(var c=0,d=0,e=b.length-1;0<=e;e--){var f=b[e];if(!f.K||!f.D||1!=f.D.nodeType)break;f=dm(a,f.D);f=a.w?-f.left:f.bottom;0<f?c=Math.max(c,f):d=Math.min(d,f)}return c-d}
function Dm(a,b){var c=I("layoutBreakableBlock"),d=[];Vl(a,b,d).then(function(e){if(0<a.b.f.b.length)M(c,e);else{var f=d.length-1;if(0>f)M(c,e);else{var f=cm(a,e,d,f,d[f].na),g=Ll(a,f);e||(f+=Cm(a,d));wm(a,f);var h;b.f?h=ym(a,b,e,d):h=J(e);h.then(function(b){0<d.length&&(a.F.push(new Hl(d,d[0].l)),g&&(2!=d.length&&0<a.F.length||d[0].U!=d[1].U||!Bl[d[0].U.localName])&&b&&(b=b.modify(),b.b=!0));M(c,b)})}}});return K(c)}
function Am(a,b,c){Nl(b);for(var d=0,e=b[0].na,f=d,g=b.length-1,h=b[g].na,l;e<h;){l=e+Math.ceil((h-e)/2);for(var f=d,k=g;f<k;){var m=f+Math.ceil((k-f)/2);b[m].na>l?k=m-1:f=m}k=cm(a,null,b,f,l);if(a.w?k<c:k>c){for(h=l-1;b[f].na==l;)f--;g=f}else wm(a,k),e=l,d=f}a=b[f];b=a.D;1!=b.nodeType?(Em(a),a.K?a.ea=b.length:(c=e-a.na,e=b.data,173==e.charCodeAt(c)?(b.replaceData(c,e.length-c,a.u?"":a.j||a.parent&&a.parent.j||"-"),e=c+1):(d=e.charAt(c),c++,f=e.charAt(c),b.replaceData(c,e.length-c,!a.u&&Da(d)&&Da(f)?
a.j||a.parent&&a.parent.j||"-":""),e=c),c=e,0<c&&(e=c,a=a.modify(),a.ea+=e,a.g=null)),e=a):e=a;return e}function Em(a){(Ed.RESOLVE_TEXT_NODE_BREAKER||[]).reduce(function(b,c){return c(a)||b},Fm)}var Fm=new function(){};
function zm(a,b){for(var c=[],d=b[0].D,e=b[b.length-1].D,f=[],g=d.ownerDocument.createRange(),h=!1,l=null,k=!1,m=!0;m;){var p=!0;do{var q=null;d==e&&(m=!1);1!=d.nodeType?(k||(g.setStartBefore(d),k=!0),l=d):h?h=!1:d.getAttribute("data-adapt-spec")?p=!k:q=d.firstChild;q||(q=d.nextSibling,q||(h=!0,q=d.parentNode));d=q}while(p&&m);if(k){g.setEndAfter(l);k=Dl(a.f,g);for(p=0;p<k.length;p++)f.push(k[p]);k=!1}}f.sort(a.w?Yj:Xj);l=d=h=g=e=0;for(m=a.w?-1:1;;){if(l<f.length&&(k=f[l],p=1,0<d&&(p=Math.max(a.w?
k.right-k.left:k.bottom-k.top,1),p=m*(a.w?k.right:k.top)<m*e?m*((a.w?k.left:k.bottom)-e)/p:m*(a.w?k.left:k.bottom)>m*g?m*(g-(a.w?k.right:k.top))/p:1),!d||.6<=p||.2<=p&&(a.w?k.top:k.left)>=h-1)){h=a.w?k.bottom:k.right;a.w?(e=d?Math.max(e,k.right):k.right,g=d?Math.min(g,k.left):k.left):(e=d?Math.min(e,k.top):k.top,g=d?Math.max(g,k.bottom):k.bottom);d++;l++;continue}0<d&&(c.push(g),d=0);if(l>=f.length)break}c.sort(Ha);a.w&&c.reverse();return c}
function Gm(a,b){if(!a.h)return J(!0);for(var c=!1,d=a.h.length-1;0<=d;--d){var e=a.h[d];if(e.na<=b)break;a.h.pop();e.b!==e.f&&(c=!0)}if(!c)return J(!0);var f=I("clearFootnotes"),g=a.g+a.za,h=a.h;a.C=null;a.h=null;var l=0;be(function(){for(;l<h.length;){var b=h[l++],b=jm(a,b.na,b.f,g);if(b.ua())return b}return J(!1)}).then(function(){M(f,!0)});return K(f)}
function Hm(a,b){var c=0;ok(b,function(a){if("clone"===a.ob["box-decoration-break"]){var b=fm(this,a.D);c+=a.w?-b.left:b.bottom;"table"===a.display&&(c+=a.md)}}.bind(a));return c}
function Il(a,b,c){for(var d=b.h,e=d[0];e.parent&&e.Ba;)e=e.parent;var f;c?f=c=1:(c=Math.max((e.ob.widows||2)-0,1),f=Math.max((e.ob.orphans||2)-0,1));var e=Hm(a,e),g=zm(a,d),h=a.G-e;(d=b.g())&&(h-=(a.w?-1:1)*Kl(d));d=Ga(g.length,function(b){return a.w?g[b]<h:g[b]>h});d=Math.min(g.length-c,d);if(d<f)return null;h=g[d-1];if(b=Am(a,b.h,h))a.g=(a.w?-1:1)*(h-a.za);return b}function Bm(a,b,c,d){var e=El(b.L).b(a,b,c,d);e||(e=Im.b(a,b,c,d));return e}
Pl.prototype.Ab=function(){var a=null,b=null,c,d=0;do{c=d;for(var d=Number.MAX_VALUE,e=this.F.length-1;0<=e&&!b;--e){var a=this.F[e],b=a.f(this,c),f=a.b();f>c&&(d=Math.min(d,f))}}while(d>c&&!b);return{Mc:b?a:null,B:b}};
function Km(a,b,c){var d=I("findAcceptableBreak"),e=a.Ab().B,f=!1;if(!e){v.b("Could not find any page breaks?!!");if(a.se)return Lm(a,b).then(function(b){b?(b=b.modify(),b.b=!1,Bm(a,b,f,!0).then(function(){M(d,b)})):M(d,b)}),K(d);e=c;f=!0}Bm(a,e,f,!0).then(function(){M(d,e)});return K(d)}function Mm(a){a=a.toString();return""==a||"auto"==a||!!a.match(/^0+(.0*)?[^0-9]/)}
function Nm(a,b,c,d){var e;if(!(e=!b))a:{for(e=b.D;e;){if(e.parentNode===e.ownerDocument){e=!1;break a}e=e.parentNode}e=!0}if(e)return!1;e=Cl(b,a.f,0,a.w);var f=b.K?b.parent&&b.parent.L:b.L;f&&(f=f.Zb())&&(e+=(a.w?-1:1)*Kl(f));f=Ll(a,e);c&&(e+=Cm(a,c));wm(a,e);c=ek(b);b=El(b.L).g(c,d,f,a.g);a.F.push(b);return f}
function Om(a,b){if(b.D.parentNode){var c=dm(a,b.D),d=b.D.ownerDocument.createElement("div");a.w?(d.style.bottom="0px",d.style.width="1px",d.style.marginRight=c.right+"px"):(d.style.right="0px",d.style.height="1px",d.style.marginTop=c.top+"px");b.D.parentNode.insertBefore(d,b.D);var e=Rj(a.f,d),e=a.w?e.right:e.top,f=a.w?-1:1,g;switch(b.A){case "left":g=a.ld;break;case "right":g=a.nd;break;default:g=f*Math.max(a.nd*f,a.ld*f)}e*f>=g*f?b.D.parentNode.removeChild(d):(e=Math.max(1,(g-e)*f),a.w?d.style.width=
e+"px":d.style.height=e+"px",e=Rj(a.f,d),e=a.w?e.left:e.bottom,a.w?(g=e+c.right-g,0<g==0<=c.right&&(g+=c.right),d.style.marginLeft=g+"px"):(g-=e+c.top,0<g==0<=c.top&&(g+=c.top),d.style.marginBottom=g+"px"),b.C=d)}}
function Pm(a,b,c){function d(){b=m[0]||b;b.D.parentNode.removeChild(b.D);f.l=l}var e=b.K?b.parent&&b.parent.L:b.L;if(e&&!(e instanceof Ol))return J(b);var f=a,g=I("skipEdges"),h=c&&b&&b.K,l=null,k=null,m=[],p=[],q=!1;ce(function(a){for(;b;){do if(b.D){if(b.Ba&&1!=b.D.nodeType){if(Tj(b.D,b.Kb))break;if(!b.K){!c&&Tk[l]?d():Nm(f,k,null,l)?(b=(f.j?k||b:b).modify(),b.b=!0):(b=b.modify(),b.g=l);N(a);return}}if(!b.K&&(b.A&&Om(f,b),!(b.L instanceof Ol)||b.h||b.G)){m.push(ek(b));l=Rk(l,b.g);if(!c&&Tk[l])d();
else if(Nm(f,k,null,l)||!Xl(f.mb,b))b=(f.j?k||b:b).modify(),b.b=!0;N(a);return}if(1==b.D.nodeType){var e=b.D.style;if(b.K){if(q){if(!c&&Tk[l]){d();N(a);return}m=[];h=c=!1;l=null}q=!1;k=ek(b);p.push(k);l=Rk(l,b.F);if(e&&(!Mm(e.paddingBottom)||!Mm(e.borderBottomWidth))){if(Nm(f,k,null,l)&&(b=(f.j?k||b:b).modify(),b.b=!0,f.j)){N(a);return}p=[k];k=null}}else{m.push(ek(b));l=Rk(l,b.g);if(!Xl(f.mb,b)&&(Nm(f,k,null,l),b=b.modify(),b.b=!0,f.j)){N(a);return}if(Bl[b.D.localName]){!c&&Tk[l]?d():Nm(f,k,null,
l)&&(b=(f.j?k||b:b).modify(),b.b=!0);N(a);return}!e||Mm(e.paddingTop)&&Mm(e.borderTopWidth)||(h=!1,p=[]);q=!0}}}while(0);e=Wl(f.b,b,h);if(e.ua()){e.then(function(c){b=c;ee(a)});return}b=e.get()}Nm(f,k,p,l)?k&&f.j&&(b=k.modify(),b.b=!0):Tk[l]&&(f.l=l);N(a)}).then(function(){M(g,b)});return K(g)}
function Lm(a,b){var c=ek(b),d=I("skipEdges"),e=null,f=!1;ce(function(d){for(;b;){do if(b.D){if(b.Ba&&1!=b.D.nodeType){if(Tj(b.D,b.Kb))break;if(!b.K){Tk[e]&&(a.l=e);N(d);return}}if(!b.K&&(b.h||b.G)){e=Rk(e,b.g);Tk[e]&&(a.l=e);N(d);return}if(1==b.D.nodeType){var g=b.D.style;if(b.K){if(f){if(Tk[e]){a.l=e;N(d);return}e=null}f=!1;e=Rk(e,b.F)}else{e=Rk(e,b.g);if(Bl[b.D.localName]){Tk[e]&&(a.l=e);N(d);return}if(g&&(!Mm(g.paddingTop)||!Mm(g.borderTopWidth))){N(d);return}}f=!0}}while(0);g=Wl(a.b,b);if(g.ua()){g.then(function(a){b=
a;ee(d)});return}b=g.get()}c=null;N(d)}).then(function(){M(d,c)});return K(d)}function Yl(a,b){return"footnote"==b.h?pm(a,b):rm(a,b)}function Qm(a,b,c){var d=I("layoutNext");Pm(a,b,c).then(function(c){b=c;!b||a.l||a.j&&b&&b.b?M(d,b):El(b.L).f(b,a).Da(d)});return K(d)}function Rm(a,b){do{var c=a.D.parentNode;if(!c)break;var d=c,e=a.D;if(d)for(var f;(f=d.lastChild)!=e;)d.removeChild(f);b&&(c.removeChild(a.D),b=!1);a=a.parent}while(a)}
function nm(a){var b=a.element.ownerDocument.createElement("div");b.style.position="absolute";b.style.top=a.A+"px";b.style.right=a.J+"px";b.style.bottom=a.H+"px";b.style.left=a.u+"px";a.element.appendChild(b);var c=Rj(a.f,b);a.element.removeChild(b);var b=a.M+a.left+zk(a),d=a.R+a.top+xk(a);a.lb=new Mf(b,d,b+a.width,d+a.height);a.W=c?a.w?c.top:c.left:0;a.ra=c?a.w?c.bottom:c.right:0;a.za=c?a.w?c.right:c.top:0;a.$a=c?a.w?c.left:c.bottom:0;a.ld=a.za;a.nd=a.za;a.jd=a.za;a.G=a.$a;c=a.lb;b=a.M+a.left+zk(a);
d=a.R+a.top+xk(a);if(a.Mb){for(var e=a.Mb,f=[],g=0;g<e.b.length;g++){var h=e.b[g];f.push(new Nf(h.f+b,h.b+d))}b=new Sf(f)}else b=Vf(b,d,b+a.width,d+a.height);a.tb=eg(c,[b],a.V,a.nb,a.w);bm(a);a.h=null}function lm(a){a.Lb=[];w(a.element,"width",a.width+"px");w(a.element,"height",a.height+"px");nm(a);a.g=0;a.Yd=!1;a.l=null}function wm(a,b){a.g=Math.max((a.w?-1:1)*(b-a.za),a.g)}
function Sm(a,b){var c=b.b;if(!c)return J(!0);var d=I("layoutOverflownFootnotes"),e=0;be(function(){for(;e<c.length;){var b=c[e++],b=jm(a,0,b,a.za);if(b.ua())return b}return J(!1)}).then(function(){M(d,!0)});return K(d)}
function om(a,b,c){a.Lb.push(b);if(a.j&&a.Yd)return J(b);var d=I("layout");Sm(a,b).then(function(){a.Xd(b.Pa).then(function(b){var e=b;a.F=[];ce(function(d){for(;b;){var f=!0;Qm(a,b,c).then(function(g){c=!1;b=g;0<a.b.f.b.length?N(d):a.l?N(d):b&&a.j&&b&&b.b?Km(a,b,e).then(function(a){b=a;N(d)}):f?f=!1:ee(d)});if(f){f=!1;return}}N(d)}).then(function(){var c=a.C;c&&(a.element.appendChild(c.element),a.w?a.g=this.za-this.$a:a.g=c.top+xk(c)+c.g+yk(c));if(b)if(0<a.b.f.b.length)M(d,null);else{a.Yd=!0;c=new pk(kk(b));
if(a.h){for(var e=[],f=0;f<a.h.length;f++){var k=a.h[f].b;k&&e.push(k)}c.b=e.length?e:null}M(d,c)}else M(d,null)})})});return K(d)}function mm(a){for(var b=a.Lb,c=a.element.lastChild;c!=a.Td;){var d=c.previousSibling;a.element===c.parentNode&&Tm(c)||a.element.removeChild(c);c=d}am(a);lm(a);var e=I("redoLayout"),f=0,g=null,h=!0;ce(function(c){if(f<b.length){var d=b[f++];om(a,d,h).then(function(a){h=!1;a?(g=a,N(c)):ee(c)})}else N(c)}).then(function(){M(e,g)});return K(e)}function Um(){}
Um.prototype.f=function(a,b){var c;if(a.h)c=Yl(b,a);else{a:if(a.K)c=!0;else{switch(a.U.namespaceURI){case "http://www.w3.org/2000/svg":c=!1;break a}c=!a.G}c=c?Dm(b,a):Zl(b,a)}return c};Um.prototype.g=function(a,b,c,d){return new Jl(ek(a),b,c,d)};Um.prototype.b=function(a,b,c,d){c=c||!!b.D&&1==b.D.nodeType&&!b.K;Rm(b,c);d&&(xm(b,!0),Vm(c?b:b.parent));return Gm(a,b.na)};var Im=new Um;
Fd("RESOLVE_FORMATTING_CONTEXT",function(a,b,c,d,e,f){b=a.parent;return!b&&a.L?null:b&&a.L!==b.L?null:a.sc||!a.L&&Vk(c,d,e,f).display===Hc?new Ol(b?b.L:null):null});Fd("RESOLVE_LAYOUT_PROCESSOR",function(a){return a instanceof Ol?Im:null});function Wm(a,b){this.b=a;this.Y=b}function Xm(a,b,c,d){this.b=a;this.g=b;this.j=c;this.f=d;this.h=null}function Ym(a,b){this.b=a;this.f=b}function Zm(a){var b={};Object.keys(a).forEach(function(c){b[c]=Array.from(a[c])});return b}function $m(a,b){this.Wb=a;this.Ac=b;this.Ed=null;this.Y=this.N=-1}function Si(a,b,c){b=a.b.J.Md(b,a.f);a.b.l[b]=c}function an(a){return(a=a.match(/^[^#]*#(.*)$/))?a[1]:null}function bn(a,b){var c=a.b.J.Gc(ka(b,a.g),a.g);"#"===c.charAt(0)&&(c=c.substring(1));return c}
function xi(a,b,c){return new qb(a.f,function(){var d=a.b.b[b];return c(d&&d.length?d[d.length-1]:null)},"page-counter-"+b)}function zi(a,b,c){return new qb(a.f,function(){return c(a.b.b[b]||[])},"page-counters-"+b)}function cn(a,b,c,d){var e=a.b.l[c];if(!e&&d&&b){d=a.h;if(b){d.A=b;for(b=0;d.A&&(b+=5E3,hl(d,b,0)!==Number.POSITIVE_INFINITY););d.A=null}e=a.b.l[c]}return e||null}
function Bi(a,b,c,d){var e=an(b),f=bn(a,b),g=cn(a,e,f,!1);return g&&g[c]?(b=g[c],new nb(a.j,d(b[b.length-1]||null))):new qb(a.f,function(){if(g=cn(a,e,f,!0)){if(g[c]){var b=g[c];return d(b[b.length-1]||null)}if(b=a.b.j.b[f]?a.b.b:a.b.A[f]||null)return dn(a.b,f),b[c]?(b=b[c],d(b[b.length-1]||null)):d(0);en(a.b,f,!1);return"??"}en(a.b,f,!1);return"??"},"target-counter-"+c+"-of-"+b)}
function Di(a,b,c,d){var e=an(b),f=bn(a,b);return new qb(a.f,function(){var b=a.b.j.b[f]?a.b.b:a.b.A[f]||null;if(b){dn(a.b,f);var b=b[c]||[],h=cn(a,e,f,!0)[c]||[];return d(b.concat(h))}en(a.b,f,!1);return"??"},"target-counters-"+c+"-of-"+b)}function fn(a){this.J=a;this.l={};this.A={};this.b={};this.b.page=[0];this.G={};this.F=[];this.C={};this.j=null;this.u=[];this.g=[];this.H=[];this.f={};this.h={}}function gn(a,b){var c=a.b.page;c&&c.length?c[c.length-1]=b:a.b.page=[b]}
function hn(a,b,c){a.G=Zm(a.b);var d,e=b["counter-reset"];e&&(e=e.evaluate(c))&&(d=pg(e,!0));if(d)for(var f in d){var e=a,g=f,h=d[f];e.b[g]?e.b[g].push(h):e.b[g]=[h]}var l;(b=b["counter-increment"])&&(c=b.evaluate(c))&&(l=pg(c,!1));l?"page"in l||(l.page=1):l={page:1};for(var k in l)a.b[k]||(c=a,b=k,c.b[b]?c.b[b].push(0):c.b[b]=[0]),c=a.b[k],c[c.length-1]+=l[k]}function jn(a,b){a.F.push(a.b);a.b=Zm(b)}
function dn(a,b){var c=a.f[b],d=a.h[b];d||(d=a.h[b]=[]);for(var e=!1,f=0;f<a.g.length;){var g=a.g[f];g.Wb===b?(g.Ac=!0,a.g.splice(f,1),c&&(e=c.indexOf(g),0<=e&&c.splice(e,1)),d.push(g),e=!0):f++}e||en(a,b,!0)}function en(a,b,c){a.u.some(function(a){return a.Wb===b})||a.u.push(new $m(b,c))}
function kn(a,b,c){var d=Object.keys(a.j.b);if(0<d.length){var e=Zm(a.b);d.forEach(function(a){this.A[a]=e;var d=this.C[a];if(d&&d.Y<c&&(d=this.h[a])){var f=this.f[a];f||(f=this.f[a]=[]);for(var g;g=d.shift();)g.Ac=!1,f.push(g)}this.C[a]={N:b,Y:c}},a)}for(var d=a.G,f;f=a.u.shift();){f.Ed=d;f.N=b;f.Y=c;var g;f.Ac?(g=a.h[f.Wb])||(g=a.h[f.Wb]=[]):(g=a.f[f.Wb])||(g=a.f[f.Wb]=[]);g.every(function(a){return!(f===a||a&&f.Wb===a.Wb&&f.Ac===a.Ac&&f.N===a.N&&f.Y===a.Y)})&&g.push(f)}a.j=null}
function ln(a,b){var c=[];Object.keys(b.b).forEach(function(a){(a=this.f[a])&&(c=c.concat(a))},a);c.sort(function(a,b){return a.N-b.N||a.Y-b.Y});var d=[],e=null;c.forEach(function(a){e&&e.N===a.N&&e.Y===a.Y?e.Vc.push(a):(e={N:a.N,Y:a.Y,Ed:a.Ed,Vc:[a]},d.push(e))});return d}function mn(a,b){a.H.push(a.g);a.g=b}function Xl(a,b){if(!b||b.K)return!0;var c=b.D;if(!c||1!==c.nodeType)return!0;c=c.getAttribute("id")||c.getAttribute("name");return c&&(a.b.h[c]||a.b.f[c])?(c=a.b.C[c])?a.Y>=c.Y:!0:!0};var nn=1;function on(a,b,c,d,e){this.b={};this.j=[];this.g=null;this.index=0;this.f=a;this.name=b;this.Gb=c;this.Aa=d;this.parent=e;this.l="p"+nn++;e&&(this.index=e.j.length,e.j.push(this))}on.prototype.h=function(){throw Error("E_UNEXPECTED_CALL");};on.prototype.clone=function(){throw Error("E_UNEXPECTED_CALL");};function pn(a,b){var c=a.b,d=b.b,e;for(e in c)Object.prototype.hasOwnProperty.call(c,e)&&(d[e]=c[e])}function qn(a,b){for(var c=0;c<a.j.length;c++)a.j[c].clone({parent:b})}
function rn(a){on.call(this,a,null,null,[],null);this.b.width=new U(yd,0);this.b.height=new U(zd,0)}u(rn,on);
function sn(a,b){this.g=b;var c=this;mb.call(this,a,function(a,b){var d=a.match(/^([^.]+)\.([^.]+)$/);if(d){var e=c.g.u[d[1]];if(e&&(e=this.pa[e])){if(b){var d=d[2],h=e.ha[d];if(h)e=h;else{switch(d){case "columns":var h=e.b.f,l=new gc(h,0),k=tn(e,"column-count"),m=tn(e,"column-width"),p=tn(e,"column-gap"),h=z(h,ic(h,new dc(h,"min",[l,k]),y(h,m,p)),p)}h&&(e.ha[d]=h);e=h}}else e=tn(e,d[2]);return e}}return null})}u(sn,mb);
function un(a,b,c,d,e,f,g){a=a instanceof sn?a:new sn(a,this);on.call(this,a,b,c,d,e);this.g=this;this.T=f;this.X=g;this.b.width=new U(yd,0);this.b.height=new U(zd,0);this.b["wrap-flow"]=new U(Gc,0);this.b.position=new U(jd,0);this.b.overflow=new U(vd,0);this.u={}}u(un,on);un.prototype.h=function(a){return new vn(a,this)};un.prototype.clone=function(a){a=new un(this.f,this.name,a.Gb||this.Gb,this.Aa,this.parent,this.T,this.X);pn(this,a);qn(this,a);return a};
function wn(a,b,c,d,e){on.call(this,a,b,c,d,e);this.g=e.g;b&&(this.g.u[b]=this.l);this.b["wrap-flow"]=new U(Gc,0)}u(wn,on);wn.prototype.h=function(a){return new xn(a,this)};wn.prototype.clone=function(a){a=new wn(a.parent.f,this.name,this.Gb,this.Aa,a.parent);pn(this,a);qn(this,a);return a};function yn(a,b,c,d,e){on.call(this,a,b,c,d,e);this.g=e.g;b&&(this.g.u[b]=this.l)}u(yn,on);yn.prototype.h=function(a){return new zn(a,this)};
yn.prototype.clone=function(a){a=new yn(a.parent.f,this.name,this.Gb,this.Aa,a.parent);pn(this,a);qn(this,a);return a};function Y(a,b,c){return b&&b!==Gc?b.oa(a,c):null}function An(a,b,c){return b&&b!==Gc?b.oa(a,c):a.b}function Bn(a,b,c){return b?b===Gc?null:b.oa(a,c):a.b}function Cn(a,b,c,d){return b&&c!==F?b.oa(a,d):a.b}function Dn(a,b,c){return b?b===wd?a.j:b===Sc?a.h:b.oa(a,a.b):c}
function En(a,b){this.f=a;this.b=b;this.J={};this.style={};this.A=this.C=null;this.u=[];this.M=this.R=this.g=this.h=!1;this.G=this.H=0;this.F=null;this.pa={};this.ha={};this.sa=this.w=!1;a&&a.u.push(this)}function Fn(a){a.H=0;a.G=0}function Gn(a,b,c){b=tn(a,b);c=tn(a,c);if(!b||!c)throw Error("E_INTERNAL");return y(a.b.f,b,c)}
function tn(a,b){var c=a.pa[b];if(c)return c;var d=a.style[b];d&&(c=d.oa(a.b.f,a.b.f.b));switch(b){case "margin-left-edge":c=tn(a,"left");break;case "margin-top-edge":c=tn(a,"top");break;case "margin-right-edge":c=Gn(a,"border-right-edge","margin-right");break;case "margin-bottom-edge":c=Gn(a,"border-bottom-edge","margin-bottom");break;case "border-left-edge":c=Gn(a,"margin-left-edge","margin-left");break;case "border-top-edge":c=Gn(a,"margin-top-edge","margin-top");break;case "border-right-edge":c=
Gn(a,"padding-right-edge","border-right-width");break;case "border-bottom-edge":c=Gn(a,"padding-bottom-edge","border-bottom-width");break;case "padding-left-edge":c=Gn(a,"border-left-edge","border-left-width");break;case "padding-top-edge":c=Gn(a,"border-top-edge","border-top-width");break;case "padding-right-edge":c=Gn(a,"right-edge","padding-right");break;case "padding-bottom-edge":c=Gn(a,"bottom-edge","padding-bottom");break;case "left-edge":c=Gn(a,"padding-left-edge","padding-left");break;case "top-edge":c=
Gn(a,"padding-top-edge","padding-top");break;case "right-edge":c=Gn(a,"left-edge","width");break;case "bottom-edge":c=Gn(a,"top-edge","height")}if(!c){if("extent"==b)d=a.w?"width":"height";else if("measure"==b)d=a.w?"height":"width";else{var e=a.w?nh:oh,d=b,f;for(f in e)d=d.replace(f,e[f])}d!=b&&(c=tn(a,d))}c&&(a.pa[b]=c);return c}
function Hn(a){var b=a.b.f,c=a.style,d=Dn(b,c.enabled,b.j),e=Y(b,c.page,b.b);if(e)var f=new bc(b,"page-number"),d=hc(b,d,new Ub(b,e,f));(e=Y(b,c["min-page-width"],b.b))&&(d=hc(b,d,new Tb(b,new bc(b,"page-width"),e)));(e=Y(b,c["min-page-height"],b.b))&&(d=hc(b,d,new Tb(b,new bc(b,"page-height"),e)));d=a.V(d);c.enabled=new E(d)}En.prototype.V=function(a){return a};
En.prototype.xd=function(){var a=this.b.f,b=this.style,c=this.f?this.f.style.width.oa(a,null):null,d=Y(a,b.left,c),e=Y(a,b["margin-left"],c),f=Cn(a,b["border-left-width"],b["border-left-style"],c),g=An(a,b["padding-left"],c),h=Y(a,b.width,c),l=Y(a,b["max-width"],c),k=An(a,b["padding-right"],c),m=Cn(a,b["border-right-width"],b["border-right-style"],c),p=Y(a,b["margin-right"],c),q=Y(a,b.right,c),x=y(a,f,g),r=y(a,f,k);d&&q&&h?(x=z(a,c,y(a,h,y(a,y(a,d,x),r))),e?p?q=z(a,x,p):p=z(a,x,y(a,q,e)):(x=z(a,x,
q),p?e=z(a,x,p):p=e=ic(a,x,new nb(a,.5)))):(e||(e=a.b),p||(p=a.b),d||q||h||(d=a.b),d||h?d||q?h||q||(h=this.C,this.h=!0):d=a.b:(h=this.C,this.h=!0),x=z(a,c,y(a,y(a,e,x),y(a,p,r))),this.h&&(l||(l=z(a,x,d?d:q)),this.w||!Y(a,b["column-width"],null)&&!Y(a,b["column-count"],null)||(h=l,this.h=!1)),d?h?q||(q=z(a,x,y(a,d,h))):h=z(a,x,y(a,d,q)):d=z(a,x,y(a,q,h)));a=An(a,b["snap-width"]||(this.f?this.f.style["snap-width"]:null),c);b.left=new E(d);b["margin-left"]=new E(e);b["border-left-width"]=new E(f);b["padding-left"]=
new E(g);b.width=new E(h);b["max-width"]=new E(l?l:h);b["padding-right"]=new E(k);b["border-right-width"]=new E(m);b["margin-right"]=new E(p);b.right=new E(q);b["snap-width"]=new E(a)};
En.prototype.yd=function(){var a=this.b.f,b=this.style,c=this.f?this.f.style.width.oa(a,null):null,d=this.f?this.f.style.height.oa(a,null):null,e=Y(a,b.top,d),f=Y(a,b["margin-top"],c),g=Cn(a,b["border-top-width"],b["border-top-style"],c),h=An(a,b["padding-top"],c),l=Y(a,b.height,d),k=Y(a,b["max-height"],d),m=An(a,b["padding-bottom"],c),p=Cn(a,b["border-bottom-width"],b["border-bottom-style"],c),q=Y(a,b["margin-bottom"],c),x=Y(a,b.bottom,d),r=y(a,g,h),t=y(a,p,m);e&&x&&l?(d=z(a,d,y(a,l,y(a,y(a,e,r),
t))),f?q?x=z(a,d,f):q=z(a,d,y(a,x,f)):(d=z(a,d,x),q?f=z(a,d,q):q=f=ic(a,d,new nb(a,.5)))):(f||(f=a.b),q||(q=a.b),e||x||l||(e=a.b),e||l?e||x?l||x||(l=this.A,this.g=!0):e=a.b:(l=this.A,this.g=!0),d=z(a,d,y(a,y(a,f,r),y(a,q,t))),this.g&&(k||(k=z(a,d,e?e:x)),this.w&&(Y(a,b["column-width"],null)||Y(a,b["column-count"],null))&&(l=k,this.g=!1)),e?l?x||(x=z(a,d,y(a,e,l))):l=z(a,d,y(a,x,e)):e=z(a,d,y(a,x,l)));a=An(a,b["snap-height"]||(this.f?this.f.style["snap-height"]:null),c);b.top=new E(e);b["margin-top"]=
new E(f);b["border-top-width"]=new E(g);b["padding-top"]=new E(h);b.height=new E(l);b["max-height"]=new E(k?k:l);b["padding-bottom"]=new E(m);b["border-bottom-width"]=new E(p);b["margin-bottom"]=new E(q);b.bottom=new E(x);b["snap-height"]=new E(a)};
function In(a){var b=a.b.f,c=a.style;a=Y(b,c[a.w?"height":"width"],null);var d=Y(b,c["column-width"],a),e=Y(b,c["column-count"],null),f;(f=(f=c["column-gap"])&&f!==fd?f.oa(b,null):null)||(f=new ac(b,1,"em"));d&&!e&&(e=new dc(b,"floor",[jc(b,y(b,a,f),y(b,d,f))]),e=new dc(b,"max",[b.f,e]));e||(e=b.f);d=z(b,jc(b,y(b,a,f),e),f);c["column-width"]=new E(d);c["column-count"]=new E(e);c["column-gap"]=new E(f)}function Jn(a,b,c,d){a=a.style[b].oa(a.b.f,null);return Cb(a,c,d,{})}
function Kn(a,b){b.pa[a.b.l]=a;var c=a.b.f,d=a.style,e=a.f?Ln(a.f,b):null,e=fj(a.J,b,e,!1);a.w=ej(e,b,a.f?a.f.w:!1);gj(e,d,a.w,function(a,b){return b.value});a.C=new qb(c,function(){return a.H},"autoWidth");a.A=new qb(c,function(){return a.G},"autoHeight");a.xd();a.yd();In(a);Hn(a)}function Mn(a,b,c){(a=a.style[c])&&(a=Lf(b,a,c));return a}function Z(a,b,c){(a=a.style[c])&&(a=Lf(b,a,c));return Cc(a,b)}
function Ln(a,b){var c;a:{if(c=a.J["region-id"]){for(var d=[],e=0;e<c.length;e++){var f=c[e].evaluate(b,"");f&&f!==B&&d.push(f)}if(d.length){c=d;break a}}c=null}if(c){d=[];for(e=0;e<c.length;e++)d[e]=c[e].toString();return d}return null}function Nn(a,b,c,d,e){if(a=Mn(a,b,d))a.Rb()&&ub(a.fa)&&(a=new D(Cc(a,b),"px")),"font-family"===d&&(a=tl(e,a)),w(c,d,a.toString())}
function On(a,b,c){var d=Z(a,b,"left"),e=Z(a,b,"margin-left"),f=Z(a,b,"padding-left"),g=Z(a,b,"border-left-width");a=Z(a,b,"width");Dk(c,d,a);w(c.element,"margin-left",e+"px");w(c.element,"padding-left",f+"px");w(c.element,"border-left-width",g+"px");c.marginLeft=e;c.ha=g;c.u=f}
function Pn(a,b,c){var d=Z(a,b,"right"),e=Z(a,b,"snap-height"),f=Z(a,b,"margin-right"),g=Z(a,b,"padding-right");b=Z(a,b,"border-right-width");w(c.element,"margin-right",f+"px");w(c.element,"padding-right",g+"px");w(c.element,"border-right-width",b+"px");c.marginRight=f;c.Ta=b;a.w&&0<e&&(a=d+Ak(c),a-=Math.floor(a/e)*e,0<a&&(c.Nb=e-a,g+=c.Nb));c.J=g;c.Xb=e}
function Qn(a,b,c){var d=Z(a,b,"snap-height"),e=Z(a,b,"top"),f=Z(a,b,"margin-top"),g=Z(a,b,"padding-top");b=Z(a,b,"border-top-width");c.top=e;c.marginTop=f;c.pa=b;c.nb=d;!a.w&&0<d&&(a=e+xk(c),a-=Math.floor(a/d)*d,0<a&&(c.sa=d-a,g+=c.sa));c.A=g;w(c.element,"top",e+"px");w(c.element,"margin-top",f+"px");w(c.element,"padding-top",g+"px");w(c.element,"border-top-width",b+"px")}
function Rn(a,b,c){var d=Z(a,b,"margin-bottom"),e=Z(a,b,"padding-bottom"),f=Z(a,b,"border-bottom-width");a=Z(a,b,"height")-c.sa;w(c.element,"height",a+"px");w(c.element,"margin-bottom",d+"px");w(c.element,"padding-bottom",e+"px");w(c.element,"border-bottom-width",f+"px");c.height=a-c.sa;c.marginBottom=d;c.Ja=f;c.H=e}function Sn(a,b,c){a.w?(Qn(a,b,c),Rn(a,b,c)):(Pn(a,b,c),On(a,b,c))}
function Tn(a,b,c){w(c.element,"border-top-width","0px");var d=Z(a,b,"max-height");a.R?Ck(c,0,d):(Qn(a,b,c),d-=c.sa,c.height=d,w(c.element,"height",d+"px"))}function Un(a,b,c){w(c.element,"border-left-width","0px");var d=Z(a,b,"max-width");a.M?Dk(c,0,d):(Pn(a,b,c),d-=c.Nb,c.width=d,a=Z(a,b,"right"),w(c.element,"right",a+"px"),w(c.element,"width",d+"px"))}
var Vn="border-left-style border-right-style border-top-style border-bottom-style border-left-color border-right-color border-top-color border-bottom-color outline-style outline-color outline-width overflow visibility".split(" "),Wn="border-top-left-radius border-top-right-radius border-bottom-right-radius border-bottom-left-radius border-image-source border-image-slice border-image-width border-image-outset border-image-repeat background-attachment background-color background-image background-repeat background-position background-clip background-origin background-size opacity z-index".split(" "),
Xn="color font-family font-size font-style font-weight font-variant line-height letter-spacing text-align text-decoration text-indent text-transform white-space word-spacing".split(" "),Yn=["width","height"],Zn=["transform","transform-origin"];
En.prototype.Fb=function(a,b,c,d){this.f&&this.w==this.f.w||w(b.element,"writing-mode",this.w?"vertical-rl":"horizontal-tb");(this.w?this.h:this.g)?this.w?Un(this,a,b):Tn(this,a,b):(this.w?Pn(this,a,b):Qn(this,a,b),this.w?On(this,a,b):Rn(this,a,b));(this.w?this.g:this.h)?this.w?Tn(this,a,b):Un(this,a,b):Sn(this,a,b);for(c=0;c<Vn.length;c++)Nn(this,a,b.element,Vn[c],d)};function $n(a,b,c,d){for(var e=0;e<Xn.length;e++)Nn(a,b,c.element,Xn[e],d)}
function ao(a,b,c,d){for(var e=0;e<Yn.length;e++)Nn(a,b,c,Yn[e],d)}
En.prototype.Pc=function(a,b,c,d,e,f,g){this.w?this.H=b.g+b.Nb:this.G=b.g+b.sa;var h=(this.w||!d)&&this.g,l=(!this.w||!d)&&this.h;if(l||h)l&&w(b.element,"width","auto"),h&&w(b.element,"height","auto"),d=Rj(f,d?d.element:b.element),l&&(this.H=Math.ceil(d.right-d.left-b.u-b.ha-b.J-b.Ta),this.w&&(this.H+=b.Nb)),h&&(this.G=d.bottom-d.top-b.A-b.pa-b.H-b.Ja,this.w||(this.G+=b.sa));(this.w?this.g:this.h)&&Sn(this,a,b);if(this.w?this.h:this.g){if(this.w?this.M:this.R)this.w?Pn(this,a,b):Qn(this,a,b);this.w?
On(this,a,b):Rn(this,a,b)}if(1<e&&(l=Z(this,a,"column-rule-width"),d=Mn(this,a,"column-rule-style"),f=Mn(this,a,"column-rule-color"),0<l&&d&&d!=F&&f!=sd))for(var k=Z(this,a,"column-gap"),m=this.w?b.height:b.width,p=this.w?"border-top":"border-left",h=1;h<e;h++){var q=(m+k)*h/e-k/2+b.u-l/2,x=b.height+b.A+b.H,r=b.element.ownerDocument.createElement("div");w(r,"position","absolute");w(r,this.w?"left":"top","0px");w(r,this.w?"top":"left",q+"px");w(r,this.w?"height":"width","0px");w(r,this.w?"width":"height",
x+"px");w(r,p,l+"px "+d.toString()+(f?" "+f.toString():""));b.element.insertBefore(r,b.element.firstChild)}for(h=0;h<Wn.length;h++)Nn(this,a,b.element,Wn[h],g);for(h=0;h<Zn.length;h++)e=b,g=Zn[h],l=c.u,(d=Mn(this,a,g))&&l.push(new Jj(e.element,g,d))};
En.prototype.j=function(a,b){var c=this.J,d=this.b.b,e;for(e in d)sh(e)&&th(c,e,d[e]);if("background-host"==this.b.Gb)for(e in b)if(e.match(/^background-/)||"writing-mode"==e)c[e]=b[e];if("layout-host"==this.b.Gb)for(e in b)e.match(/^background-/)||"writing-mode"==e||(c[e]=b[e]);Ki(a,this.b.Aa,null,c);c.content&&(c.content=c.content.Oc(new pi(a,null,a.lb)));Kn(this,a.l);for(c=0;c<this.b.j.length;c++)this.b.j[c].h(this).j(a,b);a.pop()};
function bo(a,b){a.h&&(a.M=Jn(a,"right",a.C,b)||Jn(a,"margin-right",a.C,b)||Jn(a,"border-right-width",a.C,b)||Jn(a,"padding-right",a.C,b));a.g&&(a.R=Jn(a,"top",a.A,b)||Jn(a,"margin-top",a.A,b)||Jn(a,"border-top-width",a.A,b)||Jn(a,"padding-top",a.A,b));for(var c=0;c<a.u.length;c++)bo(a.u[c],b)}function co(a){En.call(this,null,a)}u(co,En);co.prototype.j=function(a,b){En.prototype.j.call(this,a,b);this.u.sort(function(a,b){return b.b.X-a.b.X||a.b.index-b.b.index})};
function vn(a,b){En.call(this,a,b);this.F=this}u(vn,En);vn.prototype.V=function(a){var b=this.b.g;b.T&&(a=hc(b.f,a,b.T));return a};vn.prototype.W=function(){};function xn(a,b){En.call(this,a,b);this.F=a.F}u(xn,En);function zn(a,b){En.call(this,a,b);this.F=a.F}u(zn,En);function eo(a,b,c,d){var e=null;c instanceof wc&&(e=[c]);c instanceof pc&&(e=c.values);if(e)for(a=a.b.f,c=0;c<e.length;c++)if(e[c]instanceof wc){var f=kb(e[c].name,"enabled"),f=new bc(a,f);d&&(f=new Kb(a,f));b=hc(a,b,f)}return b}
zn.prototype.V=function(a){var b=this.b.f,c=this.style,d=Dn(b,c.required,b.h)!==b.h;if(d||this.g){var e;e=(e=c["flow-from"])?e.oa(b,b.b):new nb(b,"body");e=new dc(b,"has-content",[e]);a=hc(b,a,e)}a=eo(this,a,c["required-partitions"],!1);a=eo(this,a,c["conflicting-partitions"],!0);d&&(c=(c=this.F.style.enabled)?c.oa(b,null):b.j,c=hc(b,c,a),this.F.style.enabled=new E(c));return a};zn.prototype.Fb=function(a,b,c,d,e){w(b.element,"overflow","hidden");En.prototype.Fb.call(this,a,b,c,d,e)};
function fo(a,b,c,d){df.call(this,a,b,!1);this.target=c;this.b=d}u(fo,ef);fo.prototype.pb=function(a,b,c){ah(this.b,a,b,c,this)};fo.prototype.ed=function(a,b){ff(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};fo.prototype.uc=function(a,b){ff(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};fo.prototype.qb=function(a,b,c){this.target.b[a]=new U(b,c?50331648:67108864)};function go(a,b,c,d){fo.call(this,a,b,c,d)}u(go,fo);
function ho(a,b,c,d){fo.call(this,a,b,c,d);c.b.width=new U(xd,0);c.b.height=new U(xd,0)}u(ho,fo);ho.prototype.Ec=function(a,b,c){a=new yn(this.f,a,b,c,this.target);cf(this.ia,new go(this.f,this.ia,a,this.b))};ho.prototype.Dc=function(a,b,c){a=new wn(this.f,a,b,c,this.target);a=new ho(this.f,this.ia,a,this.b);cf(this.ia,a)};function io(a,b,c,d){fo.call(this,a,b,c,d)}u(io,fo);io.prototype.Ec=function(a,b,c){a=new yn(this.f,a,b,c,this.target);cf(this.ia,new go(this.f,this.ia,a,this.b))};
io.prototype.Dc=function(a,b,c){a=new wn(this.f,a,b,c,this.target);a=new ho(this.f,this.ia,a,this.b);cf(this.ia,a)};function jo(a,b,c,d){d=d[b];if(!d)throw Error("unknown writing-mode: "+b);b=d[c||"ltr"];if(!b)throw Error("unknown direction: "+c);for(c=0;c<b.length;c++)if(d=b[c],d=a.replace(d.h,d.b),d!==a)return d;return a}function ko(a){var b=lo,c={};Object.keys(b).forEach(function(d){var e=c[d]={},f=b[d];Object.keys(f).forEach(function(b){e[b]=f[b].map(function(b){return{h:new RegExp("(-?)"+(a?b.O:b.P)+"(-?)"),b:"$1"+(a?b.P:b.O)+"$2"}})})});return c}
var lo={"horizontal-tb":{ltr:[{O:"inline-start",P:"left"},{O:"inline-end",P:"right"},{O:"block-start",P:"top"},{O:"block-end",P:"bottom"},{O:"inline-size",P:"width"},{O:"block-size",P:"height"}],rtl:[{O:"inline-start",P:"right"},{O:"inline-end",P:"left"},{O:"block-start",P:"top"},{O:"block-end",P:"bottom"},{O:"inline-size",P:"width"},{O:"block-size",P:"height"}]},"vertical-rl":{ltr:[{O:"inline-start",P:"top"},{O:"inline-end",P:"bottom"},{O:"block-start",P:"right"},{O:"block-end",P:"left"},{O:"inline-size",
P:"height"},{O:"block-size",P:"width"}],rtl:[{O:"inline-start",P:"bottom"},{O:"inline-end",P:"top"},{O:"block-start",P:"right"},{O:"block-end",P:"left"},{O:"inline-size",P:"height"},{O:"block-size",P:"width"}]},"vertical-lr":{ltr:[{O:"inline-start",P:"top"},{O:"inline-end",P:"bottom"},{O:"block-start",P:"left"},{O:"block-end",P:"right"},{O:"inline-size",P:"height"},{O:"block-size",P:"width"}],rtl:[{O:"inline-start",P:"bottom"},{O:"inline-end",P:"top"},{O:"block-start",P:"left"},{O:"block-end",P:"right"},
{O:"inline-size",P:"height"},{O:"block-size",P:"width"}]}},mo=ko(!0),no=ko(!1),oo={"horizontal-tb":[{O:"line-left",P:"left"},{O:"line-right",P:"right"},{O:"over",P:"top"},{O:"under",P:"bottom"}],"vertical-rl":[{O:"line-left",P:"top"},{O:"line-right",P:"bottom"},{O:"over",P:"right"},{O:"under",P:"left"}],"vertical-lr":[{O:"line-left",P:"top"},{O:"line-right",P:"bottom"},{O:"over",P:"right"},{O:"under",P:"left"}]};function vm(a,b,c){b=b?"vertical-rl":"horizontal-tb";if("top"===a||"bottom"===a)a=jo(a,b,c||null,no);"block-start"===a&&(a="inline-start");"block-end"===a&&(a="inline-end");if("inline-start"===a||"inline-end"===a){c=jo(a,b,c||null,mo);a:{var d=oo[b];if(!d)throw Error("unknown writing-mode: "+b);for(b=0;b<d.length;b++)if(d[b].P===c){b=d[b].O;break a}b=c}"line-left"===b?a="left":"line-right"===b&&(a="right")}"left"!==a&&"right"!==a&&(v.b("Invalid float value: "+a+". Fallback to left."),a="left");return a}
function po(a,b){this.B=ek(a);this.b=b}function qo(a,b,c){this.g=a;this.j=b;this.h=c;this.f=[];this.b=[]}
function sm(a,b,c){b.parentNode&&b.parentNode.removeChild(b);w(b,"float","none");w(b,"position","absolute");var d=a.j.toString(),e=a.h.toString(),f=jo(c,d,e||null,mo),g=jo(c,d,e||null,no);w(b,f,"0");switch(g){case "inline-start":case "inline-end":d=jo("block-start",d,e||null,mo);w(b,d,"0");break;case "block-start":case "block-end":c=jo("inline-start",d,e||null,mo);w(b,c,"0");d=jo("max-inline-size",d,e||null,mo);wa(b,d)||w(b,d,"100%");break;default:throw Error("unknown float direction: "+c);}a.g().appendChild(b)}
function tm(a,b,c){b=kk(b);for(var d=0;d<a.f.length;d++){var e=a.f[d];if(ro(c,b,kk(e.B)))return e}return null}function um(a,b,c){var d=I("tryToAddFloat");b=new po(b,c);a.f.push(b);a.b.push(b);M(d,b);return K(d)}function so(a){return a.b.map(function(a){a=a.b;return new Sf([new Nf(a.ja,a.ca),new Nf(a.ba,a.ca),new Nf(a.ba,a.Z),new Nf(a.ja,a.Z)])})};function to(a){a=a.toString();switch(a){case "inline-flex":a="flex";break;case "inline-grid":a="grid";break;case "inline-table":a="table";break;case "inline":case "table-row-group":case "table-column":case "table-column-group":case "table-header-group":case "table-footer-group":case "table-row":case "table-cell":case "table-caption":case "inline-block":a="block"}return C(a)}function Vk(a,b,c,d){if(a!==F)if(b===Dc||b===Tc)c=F,a=to(a);else if(c&&c!==F||d)a=to(a);return{display:a,position:b,f:c}}
function uo(a,b,c,d,e,f,g){e=e||f||Wc;return!!g||!!c&&c!==F||b===Dc||b===Tc||a===Zc||a===qd||a===pd||a==Uc||(a===Hc||a===dd)&&!!d&&d!==vd||!!f&&e!==f};function vo(a,b,c){return a.replace(/[uU][rR][lL]\(\s*\"((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\"\r\n])+)\"/gm,function(a,e){return'url("'+c.Gc(e,b)+'"'}).replace(/[uU][rR][lL]\(\s*\'((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\'\r\n])+)\'/gm,function(a,e){return"url('"+c.Gc(e,b)+"'"}).replace(/[uU][rR][lL]\(\s*((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\"\'\r\n\)\s])+)/gm,function(a,e){return"url("+c.Gc(e,b)})};var wo={"text-indent":"0px","margin-top":"0px","padding-top":"0px","border-top-width":"0px","border-top-style":"none","border-top-color":"transparent","border-top-left-radius":"0px","border-top-right-radius":"0px"},xo={"text-indent":"0px","margin-right":"0px","padding-right":"0px","border-right-width":"0px","border-right-style":"none","border-right-color":"transparent","border-top-right-radius":"0px","border-bottom-right-radius":"0px"},yo={"margin-top":"0px"},zo={"margin-right":"0px"},Ao={};
function Bo(a){a.addEventListener("load",function(){a.contentWindow.navigator.epubReadingSystem={name:"adapt",version:"0.1",layoutStyle:"paginated",hasFeature:function(a){switch(a){case "mouse-events":return!0}return!1}}},!1)}var Co=(new DOMParser).parseFromString('<root xmlns="http://www.pyroxy.com/ns/shadow"/>',"text/xml"),Do="footnote-marker first-5-lines first-4-lines first-3-lines first-2-lines first-line first-letter before  after".split(" ");
function Tm(a){return a.getAttribute("data-adapt-pseudo")||""}function Eo(a,b,c,d){this.style=b;this.element=a;this.b=c;this.f=d;this.g={}}
Eo.prototype.l=function(a){var b=Tm(a);this.b&&b&&b.match(/after$/)&&(this.style=this.b.l(this.element,!0),this.b=null);var c=this.style._pseudos[b]||{};if(!this.g[b]){this.g[b]=!0;var d=c.content;d&&(d=d.evaluate(this.f),Fk(d)&&d.aa(new Ek(a,this.f,d)))}if(b.match(/^first-/)&&!c["x-first-pseudo"]){a=1;if("first-letter"==b)a=0;else if(b=b.match(/^first-([0-9]+)-lines$/))a=b[1]-0;c["x-first-pseudo"]=new U(new yc(a),0)}return c};
function Fo(a,b,c,d,e,f,g,h,l,k,m,p,q,x){this.F=a;this.b=b;this.viewport=c;this.A=c.b;this.l=d;this.H=e;this.da=f;this.G=g;this.u=h;this.J=l;this.page=k;this.g=m;this.C=p;this.f=q;this.h=x;this.M=this.B=null;this.j=!1;this.U=null;this.ea=0;this.D=null}Fo.prototype.clone=function(){return new Fo(this.F,this.b,this.viewport,this.l,this.H,this.da,this.G,this.u,this.J,this.page,this.g,this.C,this.f,this.h)};
function Go(a,b,c,d,e,f){var g=I("createRefShadow");a.da.u.load(b).then(function(h){if(h){var l=tj(h,b);if(l){var k=a.J,m=k.H[h.url];if(!m){var m=k.style.l.f[h.url],p=new vb(0,k.Eb(),k.Db(),k.u),m=new $k(h,m.g,m.f,p,k.l,m.u,new Ym(k.j,h.url),new Xm(k.j,h.url,m.f,m.b));k.H[h.url]=m}f=new fk(d,l,h,e,f,c,m)}}M(g,f)});return K(g)}
function Ho(a,b,c,d,e,f,g,h){var l=I("createShadows"),k=e.template,m;k instanceof Ac?m=Go(a,k.url,2,b,h,null):m=J(null);m.then(function(k){var m=null;if("http://www.pyroxy.com/ns/shadow"==b.namespaceURI&&"include"==b.localName){var p=b.getAttribute("href"),r=null;p?r=h?h.da:a.da:h&&(p="http://www.w3.org/1999/xhtml"==h.ia.namespaceURI?h.ia.getAttribute("href"):h.ia.getAttributeNS("http://www.w3.org/1999/xlink","href"),r=h.Gd?h.Gd.da:a.da);p&&(p=ka(p,r.url),m=Go(a,p,3,b,h,k))}m||(m=J(k));var t=null;
m.then(function(c){e.display===qd?t=Go(a,ka("user-agent.xml#table-cell",ja),2,b,h,c):t=J(c)});t.then(function(k){var m;if(m=d._pseudos){for(var p=[],q=Co.createElementNS("http://www.pyroxy.com/ns/shadow","root"),r=q,x=0;x<Do.length;x++){var t=Do[x],A;if(t){if(!m[t])continue;if(!("footnote-marker"!=t||c&&a.j))continue;if(t.match(/^first-/)&&(A=e.display,!A||A===Yc))continue;if("before"===t||"after"===t)if(A=m[t].content,!A||A===fd||A===F)continue;p.push(t);A=Co.createElementNS("http://www.w3.org/1999/xhtml",
"span");A.setAttribute("data-adapt-pseudo",t)}else A=Co.createElementNS("http://www.pyroxy.com/ns/shadow","content");r.appendChild(A);t.match(/^first-/)&&(r=A)}k=p.length?new fk(b,q,null,h,k,2,new Eo(b,d,f,g)):k}M(l,k)})});return K(l)}function Ql(a,b,c){a.M=b;a.j=c}
function Io(a,b,c,d){var e=a.b;c=fj(c,e,a.H,a.j);b=ej(c,e,b);gj(c,d,b,function(b,c){var d=c.evaluate(e,b);"font-family"==b&&(d=tl(a.G,d));return d});var f=Vk(d.display||Yc,d.position,d["float"],a.U===a.da.root);["display","position","float"].forEach(function(a){f[a]&&(d[a]=f[a])});return b}
function Jo(a,b){for(var c=a.B.U,d=[],e=null,f=a.B.ma,g=-1;c&&1==c.nodeType;){var h=f&&f.root==c;if(!h||2==f.type){var l=(f?f.b:a.l).l(c,!1);d.push(l);e=e||xa(c)}h?(c=f.ia,f=f.Gd):(c=c.parentNode,g++)}c=xb(a.b,"em",!g);c={"font-size":new U(new D(c,"px"),0)};f=new yh(c,a.b);for(g=d.length-1;0<=g;--g){var h=d[g],l=[],k;for(k in h)ch[k]&&l.push(k);l.sort(Cd);for(var m=0;m<l.length;m++){var p=l[m];f.f=p;var q=h[p];q.value!==Xc&&(c[p]=q.Oc(f))}}for(var x in b)ch[x]||(c[x]=b[x]);return{lang:e,Va:c}}
var Ko={a:"a",sub:"sub",sup:"sup",table:"table",tr:"tr",td:"td",th:"th",code:"code",body:"div",p:"p",v:"p",date:"p",emphasis:"em",strong:"strong",style:"span",strikethrough:"del"};function Lo(a,b){b=ka(b,a.da.url);return a.C[b]||b}function Mo(a){a.B.lang=xa(a.B.U)||a.B.parent&&a.B.parent.lang||a.B.lang}
function No(a,b){var c=eh().filter(function(a){return b[a]});if(c.length){var d=a.B.ob;if(a.B.parent){var d=a.B.ob={},e;for(e in a.B.parent.ob)d[e]=a.B.parent.ob[e]}c.forEach(function(a){var c=b[a];if(c){if(c instanceof yc)d[a]=c.I;else if(c instanceof wc)d[a]=c.name;else if(c instanceof D)switch(c.fa){case "dpi":case "dpcm":case "dppx":d[a]=c.I*tb[c.fa]}else d[a]=c;delete b[a]}})}}
function Oo(a,b,c,d,e,f){for(var g=Ed.RESOLVE_FORMATTING_CONTEXT||[],h=0;h<g.length;h++){var l=g[h](a,b,c,d,e,f);if(l){a.L=l;break}}}
function Po(a,b,c){var d=!0,e=I("createElementView"),f=a.U,g=a.B.ma?a.B.ma.b:a.l,h=g.l(f,!1),l={};if(!a.B.parent){var k=Jo(a,h),h=k.Va;a.B.lang=k.lang}a.B.w=Io(a,a.B.w,h,l);No(a,l);Mo(a);l.direction&&(a.B.V=l.direction.toString());if((k=l["flow-into"])&&k.toString()!=a.F)return M(e,!1),K(e);var m=l.display;if(m===F)return M(e,!1),K(e);var p=!a.B.parent;a.B.G=m===Uc;Ho(a,f,p,h,l,g,a.b,a.B.ma).then(function(g){a.B.ya=g;g=l.position;var k=l["float-reference"],q=l["float"],t=l.clear,A=a.B.w?ud:Wc,H=a.B.parent?
a.B.parent.w?ud:Wc:A,G="true"===f.getAttribute("data-vivliostyle-flow-root");a.B.sc=uo(m,g,q,l.overflow,A,H,G);a.B.J=g===jd||g===Dc||g===Tc;mk(a.B)&&(t=null,q!==Vc&&(q=null));A=q===cd||q===kd||q===rd||q===Lc||q===ad||q===$c||q===Jc||q===Ic||q===Vc;q&&(delete l["float"],q===Vc&&(a.j?(A=!1,l.display=Hc):l.display=Yc));t&&(t===Xc&&a.B.parent&&a.B.parent.A&&(t=C(a.B.parent.A)),t===cd||t===kd||t===Kc)&&(delete l.clear,l.display&&l.display!=Yc&&(a.B.A=t.toString()));var W=m===dd&&l["ua-list-item-count"];
(A||l["break-inside"]&&l["break-inside"]!==Gc)&&a.B.l++;if(!(t=!A&&!m))a:switch(m.toString()){case "inline":case "inline-block":case "inline-list-item":case "inline-flex":case "inline-grid":case "ruby":case "inline-table":t=!0;break a;default:t=!1}if(!t)a:switch(m.toString()){case "ruby-base":case "ruby-text":case "ruby-base-container":case "ruby-text-container":t=!0;break a;default:t=!1}a.B.Ba=t;a.B.display=m?m.toString():"inline";a.B.h=A?q.toString():null;a.B.ha=k?k.toString():null;if(!a.B.Ba){if(k=
l["break-after"])a.B.F=k.toString();if(k=l["break-before"])a.B.g=k.toString()}a.B.H=l["vertical-align"]&&l["vertical-align"].toString()||"baseline";a.B.M=l["caption-side"]&&l["caption-side"].toString()||"top";k=l["border-collapse"];if(!k||k===C("separate"))if(t=l["border-spacing"])t.Rc()?(k=t.values[0],t=t.values[1]):k=t,k.Rb()&&(a.B.R=Cc(k,a.b)),t.Rb()&&(a.B.md=Cc(t,a.b));if(k=l["x-first-pseudo"])a.B.f=new gk(a.B.parent?a.B.parent.f:null,k.I);if(k=l["white-space"])k=Sj(k.toString()),null!==k&&(a.B.Kb=
k);(k=l["hyphenate-character"])&&k!==Gc&&(a.B.j=k.gc);k=l["overflow-wrap"]||["word-wrap"];a.B.u=l["word-break"]===Nc||k===Oc;Oo(a.B,b,m,g,q,p);a.B.parent&&a.B.parent.L&&(b=a.B.parent.L.xe(a.B,b));var Ya=!1,pb=null,lc=[],va=f.namespaceURI,L=f.localName;if("http://www.w3.org/1999/xhtml"==va)"html"==L||"body"==L||"script"==L||"link"==L||"meta"==L?L="div":"vide_"==L?L="video":"audi_"==L?L="audio":"object"==L&&(Ya=!!a.g),f.getAttribute("data-adapt-pseudo")&&h.content&&h.content.value&&h.content.value.url&&
(L="img");else if("http://www.idpf.org/2007/ops"==va)L="span",va="http://www.w3.org/1999/xhtml";else if("http://www.gribuser.ru/xml/fictionbook/2.0"==va){va="http://www.w3.org/1999/xhtml";if("image"==L){if(L="div",(g=f.getAttributeNS("http://www.w3.org/1999/xlink","href"))&&"#"==g.charAt(0)&&(g=tj(a.da,g)))pb=Qo(a,va,"img"),g="data:"+(g.getAttribute("content-type")||"image/jpeg")+";base64,"+g.textContent.replace(/[ \t\n\t]/g,""),lc.push(ie(pb,g))}else L=Ko[L];L||(L=a.B.Ba?"span":"div")}else if("http://www.daisy.org/z3986/2005/ncx/"==
va)if(va="http://www.w3.org/1999/xhtml","ncx"==L||"navPoint"==L)L="div";else if("navLabel"==L){if(L="span",q=f.parentNode){g=null;for(q=q.firstChild;q;q=q.nextSibling)if(1==q.nodeType&&(k=q,"http://www.daisy.org/z3986/2005/ncx/"==k.namespaceURI&&"content"==k.localName)){g=k.getAttribute("src");break}g&&(L="a",f=f.ownerDocument.createElementNS(va,"a"),f.setAttribute("href",g))}}else L="span";else"http://www.pyroxy.com/ns/shadow"==va?(va="http://www.w3.org/1999/xhtml",L=a.B.Ba?"span":"div"):Ya=!!a.g;
W?b?L="li":(L="div",m=Hc,l.display=m):"body"==L||"li"==L?L="div":"q"==L?L="span":"a"==L&&(g=l["hyperlink-processing"])&&"normal"!=g.toString()&&(L="span");l.behavior&&"none"!=l.behavior.toString()&&a.g&&(Ya=!0);f.dataset&&"true"==f.dataset.mathTypeset&&(Ya=!0);var Eb;Ya?Eb=a.g(f,a.B.parent?a.B.parent.D:null,l):Eb=J(null);Eb.then(function(g){g?Ya&&(d="true"==g.getAttribute("data-adapt-process-children")):g=Qo(a,va,L);"a"==L&&g.addEventListener("click",a.page.R,!1);pb&&(qm(a,a.B,"inner",pb),g.appendChild(pb));
"iframe"==g.localName&&"http://www.w3.org/1999/xhtml"==g.namespaceURI&&Bo(g);var h=a.B.ob["image-resolution"],k=[],m=l.width,p=l.height,q=f.getAttribute("width"),r=f.getAttribute("height"),m=m===Gc||!m&&!q,p=p===Gc||!p&&!r;if("http://www.gribuser.ru/xml/fictionbook/2.0"!=f.namespaceURI||"td"==L){for(var q=f.attributes,t=q.length,r=null,x=0;x<t;x++){var A=q[x],H=A.namespaceURI,G=A.localName,A=A.nodeValue;if(H)if("http://www.w3.org/2000/xmlns/"==H)continue;else"http://www.w3.org/1999/xlink"==H&&"href"==
G&&(A=Lo(a,A));else{if(G.match(/^on/))continue;if("style"==G)continue;if(("id"==G||"name"==G)&&b){A=a.h.Md(A,a.da.url);g.setAttribute(G,A);Pj(a.page,g,A);continue}"src"==G||"href"==G||"poster"==G?(A=Lo(a,A),"href"===G&&(A=a.h.Gc(A,a.da.url))):"srcset"==G&&(A=A.split(",").map(function(b){return Lo(a,b.trim())}).join(","));if("poster"===G&&"video"===L&&"http://www.w3.org/1999/xhtml"===va&&m&&p){var P=new Image,Eb=ie(P,A);lc.push(Eb);k.push({te:P,element:g,qe:Eb})}}"http://www.w3.org/2000/svg"==va&&
/^[A-Z\-]+$/.test(G)&&(G=G.toLowerCase());-1!=Ro.indexOf(G.toLowerCase())&&(A=vo(A,a.da.url,a.h));H&&(P=Ao[H])&&(G=P+":"+G);"src"!=G||H||"img"!=L&&"input"!=L||"http://www.w3.org/1999/xhtml"!=va?"href"==G&&"image"==L&&"http://www.w3.org/2000/svg"==va&&"http://www.w3.org/1999/xlink"==H?a.page.j.push(ie(g,A)):H?g.setAttributeNS(H,G,A):g.setAttribute(G,A):r=A}r&&(P="input"===L?new Image:g,q=ie(P,r),P!==g&&(g.src=r),m||p?(m&&p&&h&&1!==h&&k.push({te:P,element:g,qe:q}),lc.push(q)):a.page.j.push(q))}delete l.content;
(m=l["list-style-image"])&&m instanceof Ac&&(m=m.url,lc.push(ie(new Image,m)));So(a,l);To(a,g,l);if(!a.B.Ba&&(m=null,b?c&&(m=a.B.w?zo:yo):m="clone"!==a.B.ob["box-decoration-break"]?a.B.w?xo:wo:a.B.w?zo:yo,m))for(var Jm in m)w(g,Jm,m[Jm]);W&&g.setAttribute("value",l["ua-list-item-count"].stringValue());a.D=g;lc.length?he(lc).then(function(){0<h&&Uo(a,k,h,l,a.B.w);M(e,d)}):$d().then(function(){M(e,d)})})});return K(e)}var Ro="color-profile clip-path cursor filter marker marker-start marker-end marker-mid fill stroke mask".split(" ");
function Uo(a,b,c,d,e){b.forEach(function(b){if("load"===b.qe.get().get()){var f=b.te,h=f.width/c,f=f.height/c;b=b.element;if(0<h&&0<f)if(d["box-sizing"]===Mc&&(d["border-left-style"]!==F&&(h+=Cc(d["border-left-width"],a.b)),d["border-right-style"]!==F&&(h+=Cc(d["border-right-width"],a.b)),d["border-top-style"]!==F&&(f+=Cc(d["border-top-width"],a.b)),d["border-bottom-style"]!==F&&(f+=Cc(d["border-bottom-width"],a.b))),1<c){var l=d["max-width"]||F,k=d["max-height"]||F;l===F&&k===F?w(b,"max-width",
h+"px"):l!==F&&k===F?w(b,"width",h+"px"):l===F&&k!==F?w(b,"height",f+"px"):"%"!==l.fa?w(b,"max-width",Math.min(h,Cc(l,a.b))+"px"):"%"!==k.fa?w(b,"max-height",Math.min(f,Cc(k,a.b))+"px"):e?w(b,"height",f+"px"):w(b,"width",h+"px")}else 1>c&&(l=d["min-width"]||Ad,k=d["min-height"]||Ad,l.I||k.I?l.I&&!k.I?w(b,"width",h+"px"):!l.I&&k.I?w(b,"height",f+"px"):"%"!==l.fa?w(b,"min-width",Math.max(h,Cc(l,a.b))+"px"):"%"!==k.fa?w(b,"min-height",Math.max(f,Cc(k,a.b))+"px"):e?w(b,"height",f+"px"):w(b,"width",h+
"px"):w(b,"min-width",h+"px"))}})}function So(a,b){(Ed.PREPROCESS_ELEMENT_STYLE||[]).forEach(function(c){c(a.B,b)})}function Vo(a){var b=I("createTextNodeView");Wo(a).then(function(){var c=a.ea||0,c=Xo(a.B.Ia).substr(c);a.D=document.createTextNode(c);M(b,!0)});return K(b)}
function Wo(a){if(a.B.Ia)return J(!0);var b,c=b=a.U.textContent,d=I("preprocessTextContent"),e=Ed.PREPROCESS_TEXT_CONTENT||[],f=0;be(function(){return f>=e.length?J(!1):e[f++](a.B,c).xa(function(a){c=a;return J(!0)})}).then(function(){a.B.Ia=Yo(b,c,0);M(d,!0)});return K(d)}
function Zo(a,b,c){var d=I("createNodeView"),e=!0;1==a.U.nodeType?b=Po(a,b,c):8==a.U.nodeType?(a.D=null,b=J(!0)):b=Vo(a);b.then(function(b){e=b;(a.B.D=a.D)&&(b=a.B.parent?a.B.parent.D:a.M)&&b.appendChild(a.D);M(d,e)});return K(d)}function Rl(a,b,c,d){(a.B=b)?(a.U=b.U,a.ea=b.ea):(a.U=null,a.ea=-1);a.D=null;return a.B?Zo(a,c,!!d):J(!0)}
function $o(a){if(null==a.ma||"content"!=a.U.localName||"http://www.pyroxy.com/ns/shadow"!=a.U.namespaceURI)return a;var b=a.na,c=a.ma,d=a.parent,e,f;c.ie?(f=c.ie,e=c.root,c=c.type,2==c&&(e=e.firstChild)):(f=c.Gd,e=c.ia.firstChild,c=2);var g=a.U.nextSibling;g?(a.U=g,hk(a)):a.va?a=a.va:e?a=null:(a=a.parent.modify(),a.K=!0);if(e)return b=new dk(e,d,b),b.ma=f,b.Sa=c,b.va=a,b;a.na=b;return a}
function ap(a){var b=a.na+1;if(a.K){if(!a.parent)return null;if(3!=a.Sa){var c=a.U.nextSibling;if(c)return a=a.modify(),a.na=b,a.U=c,hk(a),$o(a)}if(a.va)return a=a.va.modify(),a.na=b,a;a=a.parent.modify()}else{if(a.ya&&(c=a.ya.root,2==a.ya.type&&(c=c.firstChild),c))return b=new dk(c,a,b),b.ma=a.ya,b.Sa=a.ya.type,$o(b);if(c=a.U.firstChild)return $o(new dk(c,a,b));1!=a.U.nodeType&&(c=Xo(a.Ia),b+=c.length-1-a.ea);a=a.modify()}a.na=b;a.K=!0;return a}
function Wl(a,b,c){b=ap(b);if(!b||b.K)return J(b);var d=I("nextInTree");Rl(a,b,!0,c).then(function(a){b.D&&a||(b=b.modify(),b.K=!0,b.D||(b.Ba=!0));M(d,b)});return K(d)}function bp(a,b){if(b instanceof pc)for(var c=b.values,d=0;d<c.length;d++)bp(a,c[d]);else b instanceof Ac&&(c=b.url,a.page.j.push(ie(new Image,c)))}var cp={"box-decoration-break":!0,"flow-into":!0,"flow-linger":!0,"flow-priority":!0,"flow-options":!0,page:!0,"float-reference":!0};
function To(a,b,c){var d=c["background-image"];d&&bp(a,d);var d=c.position===jd,e;for(e in c)if(!cp[e]){var f=c[e],f=f.aa(new qg(a.da.url,a.h));f.Rb()&&ub(f.fa)&&(f=new D(Cc(f,a.b),"px"));Hj[e]||d&&Ij[e]?a.page.u.push(new Jj(b,e,f)):w(b,e,f.toString())}}function qm(a,b,c,d){if(!b.K){var e=(b.ma?b.ma.b:a.l).l(a.U,!1);if(e=e._pseudos)if(e=e[c])c={},b.w=Io(a,b.w,e,c),b=c.content,Fk(b)&&(b.aa(new Ek(d,a.b,b)),delete c.content),To(a,d,c)}}
function Ul(a,b,c){var d=I("peelOff"),e=b.f,f=b.ea,g=b.K;if(0<c)b.D.textContent=b.D.textContent.substr(0,c),f+=c;else if(!g&&b.D&&!f){var h=b.D.parentNode;h&&h.removeChild(b.D)}for(var l=b.na+c,k=[];b.f===e;)k.push(b),b=b.parent;var m=k.pop(),p=m.va;be(function(){for(;0<k.length;){m=k.pop();b=new dk(m.U,b,l);k.length||(b.ea=f,b.K=g);b.Sa=m.Sa;b.ma=m.ma;b.ya=m.ya;b.va=m.va?m.va:p;p=null;var c=Rl(a,b,!1);if(c.ua())return c}return J(!1)}).then(function(){M(d,b)});return K(d)}
function Qo(a,b,c){return"http://www.w3.org/1999/xhtml"==b?a.A.createElement(c):a.A.createElementNS(b,c)}function km(a,b,c){var d={},e=a.u._pseudos;b=Io(a,b,a.u,d);if(e&&e.before){var f={},g=Qo(a,"http://www.w3.org/1999/xhtml","span");g.setAttribute("data-adapt-pseudo","before");c.appendChild(g);Io(a,b,e.before,f);delete f.content;To(a,g,f)}delete d.content;To(a,c,d);return b}
function Vm(a){a&&ok(a,function(a){var b=a.ob["box-decoration-break"];b&&"slice"!==b||(b=a.D,a.w?(w(b,"padding-left","0"),w(b,"border-left","none"),w(b,"border-top-left-radius","0"),w(b,"border-bottom-left-radius","0")):(w(b,"padding-bottom","0"),w(b,"border-bottom","none"),w(b,"border-bottom-left-radius","0"),w(b,"border-bottom-right-radius","0")))})}
function ro(a,b,c){return b.ea===c.ea&&b.K==c.K&&b.ka.length===c.ka.length&&b.ka.every(function(a,b){var d;d=c.ka[b];if(a.ma)if(d.ma){var e=1===a.node.nodeType?a.node:a.node.parentElement,h=1===d.node.nodeType?d.node:d.node.parentElement;d=a.ma.ia===d.ma.ia&&Tm(e)===Tm(h)}else d=!1;else d=a.node===d.node;return d}.bind(a))}function dp(a){this.b=a.h;this.window=a.window}
function ep(a,b){var c=b.left,d=b.top;return{left:a.left-c,top:a.top-d,right:a.right-c,bottom:a.bottom-d,width:a.width,height:a.height}}function Dl(a,b){var c=b.getClientRects(),d=a.b.getBoundingClientRect();return Array.from(c).map(function(a){return ep(a,d)},a)}function Rj(a,b){var c=b.getBoundingClientRect(),d=a.b.getBoundingClientRect();return ep(c,d)}function em(a,b){return a.window.getComputedStyle(b,null)}
function fp(a,b,c,d,e){this.window=a;this.fontSize=b;this.b=a.document;this.root=c||this.b.body;b=this.root.firstElementChild;b||(b=this.b.createElement("div"),b.setAttribute("data-vivliostyle-outer-zoom-box",!0),this.root.appendChild(b));c=b.firstElementChild;c||(c=this.b.createElement("div"),c.setAttribute("data-vivliostyle-spread-container",!0),b.appendChild(c));var f=b.nextElementSibling;f||(f=this.b.createElement("div"),f.setAttribute("data-vivliostyle-layout-box",!0),this.root.appendChild(f));
this.g=b;this.f=c;this.h=f;b=em(new dp(this),this.root);this.width=d||parseFloat(b.width)||a.innerWidth;this.height=e||parseFloat(b.height)||a.innerHeight}fp.prototype.zoom=function(a,b,c){w(this.g,"width",a*c+"px");w(this.g,"height",b*c+"px");w(this.f,"width",a+"px");w(this.f,"height",b+"px");w(this.f,"transform","scale("+c+")")};function gp(a,b,c){function d(c){return em(a,b).getPropertyValue(c)}function e(){w(b,"display","block");w(b,"position","static");return d(H)}function f(){w(b,"display","inline-block");w(r,H,"99999999px");var a=d(H);w(r,H,"");return a}function g(){w(b,"display","inline-block");w(r,H,"0");var a=d(H);w(r,H,"");return a}function h(){var a=e(),b=g(),c=parseFloat(a);if(c<=parseFloat(b))return b;b=f();return c<=parseFloat(b)?a:b}function l(){throw Error("Getting fill-available block size is not implemented");
}var k=b.style.display,m=b.style.position,p=b.style.width,q=b.style.height,x=b.parentNode,r=b.ownerDocument.createElement("div");w(r,"position",m);x.insertBefore(r,b);r.appendChild(b);w(b,"width","auto");w(b,"height","auto");var t=ua("writing-mode"),t=(t?d(t[0]):null)||d("writing-mode"),A="vertical-rl"===t||"tb-rl"===t||"vertical-lr"===t||"tb-lr"===t,H=A?"height":"width",G=A?"width":"height",W={};c.forEach(function(a){var c;switch(a){case "fill-available inline size":c=e();break;case "max-content inline size":c=
f();break;case "min-content inline size":c=g();break;case "fit-content inline size":c=h();break;case "fill-available block size":c=l();break;case "max-content block size":case "min-content block size":case "fit-content block size":c=d(G);break;case "fill-available width":c=A?l():e();break;case "fill-available height":c=A?e():l();break;case "max-content width":c=A?d(G):f();break;case "max-content height":c=A?f():d(G);break;case "min-content width":c=A?d(G):g();break;case "min-content height":c=A?g():
d(G);break;case "fit-content width":c=A?d(G):h();break;case "fit-content height":c=A?h():d(G)}W[a]=parseFloat(c);w(b,"position",m);w(b,"display",k)});w(b,"width",p);w(b,"height",q);x.insertBefore(b,r);x.removeChild(r);return W};function hp(a){var b=a["writing-mode"],b=b&&b.value;a=(a=a.direction)&&a.value;return b===td||b!==ud&&a!==nd?"ltr":"rtl"}
var ip={a5:{width:new D(148,"mm"),height:new D(210,"mm")},a4:{width:new D(210,"mm"),height:new D(297,"mm")},a3:{width:new D(297,"mm"),height:new D(420,"mm")},b5:{width:new D(176,"mm"),height:new D(250,"mm")},b4:{width:new D(250,"mm"),height:new D(353,"mm")},"jis-b5":{width:new D(182,"mm"),height:new D(257,"mm")},"jis-b4":{width:new D(257,"mm"),height:new D(364,"mm")},letter:{width:new D(8.5,"in"),height:new D(11,"in")},legal:{width:new D(8.5,"in"),height:new D(14,"in")},ledger:{width:new D(11,"in"),
height:new D(17,"in")}},jp=new D(.24,"pt"),kp=new D(3,"mm"),lp=new D(10,"mm"),mp=new D(13,"mm");
function np(a){var b={width:yd,height:zd,Pb:Ad,wb:Ad},c=a.size;if(c&&c.value!==Gc){var d=c.value;d.Rc()?(c=d.values[0],d=d.values[1]):(c=d,d=null);if(c.Rb())b.width=c,b.height=d||c;else if(c=ip[c.name.toLowerCase()])d&&d===bd?(b.width=c.height,b.height=c.width):(b.width=c.width,b.height=c.height)}(c=a.marks)&&c.value!==F&&(b.wb=mp);a=a.bleed;a&&a.value!==Gc?a.value&&a.value.Rb()&&(b.Pb=a.value):c&&(a=!1,c.value.Rc()?a=c.value.values.some(function(a){return a===Pc}):a=c.value===Pc,a&&(b.Pb=new D(6,
"pt")));return b}function op(a,b){var c={},d=a.Pb.I*xb(b,a.Pb.fa,!1),e=a.wb.I*xb(b,a.wb.fa,!1),f=d+e,g=a.width;c.Eb=g===yd?(b.$.kb?Math.floor(b.Ja/2)-b.$.dc:b.Ja)-2*f:g.I*xb(b,g.fa,!1);g=a.height;c.Db=g===zd?b.tb-2*f:g.I*xb(b,g.fa,!1);c.Pb=d;c.wb=e;c.rd=f;return c}function pp(a,b,c){a=a.createElementNS("http://www.w3.org/2000/svg","svg");a.setAttribute("width",b);a.setAttribute("height",c);a.style.position="absolute";return a}
function qp(a,b,c){a=a.createElementNS("http://www.w3.org/2000/svg",c||"polyline");a.setAttribute("stroke","black");a.setAttribute("stroke-width",b);a.setAttribute("fill","none");return a}var rp={zf:"top left",Af:"top right",lf:"bottom left",mf:"bottom right"};
function sp(a,b,c,d,e,f){var g=d;g<=e+2*tb.mm&&(g=e+d/2);var h=Math.max(d,g),l=e+h+c/2,k=pp(a,l,l),g=[[0,e+d],[d,e+d],[d,e+d-g]];d=g.map(function(a){return[a[1],a[0]]});if("top right"===b||"bottom right"===b)g=g.map(function(a){return[e+h-a[0],a[1]]}),d=d.map(function(a){return[e+h-a[0],a[1]]});if("bottom left"===b||"bottom right"===b)g=g.map(function(a){return[a[0],e+h-a[1]]}),d=d.map(function(a){return[a[0],e+h-a[1]]});l=qp(a,c);l.setAttribute("points",g.map(function(a){return a.join(",")}).join(" "));
k.appendChild(l);a=qp(a,c);a.setAttribute("points",d.map(function(a){return a.join(",")}).join(" "));k.appendChild(a);b.split(" ").forEach(function(a){k.style[a]=f+"px"});return k}var tp={yf:"top",kf:"bottom",Ke:"left",Le:"right"};
function up(a,b,c,d,e){var f=2*d,g;"top"===b||"bottom"===b?(g=f,f=d):g=d;var h=pp(a,g,f),l=qp(a,c);l.setAttribute("points","0,"+f/2+" "+g+","+f/2);h.appendChild(l);l=qp(a,c);l.setAttribute("points",g/2+",0 "+g/2+","+f);h.appendChild(l);a=qp(a,c,"circle");a.setAttribute("cx",g/2);a.setAttribute("cy",f/2);a.setAttribute("r",d/4);h.appendChild(a);var k;switch(b){case "top":k="bottom";break;case "bottom":k="top";break;case "left":k="right";break;case "right":k="left"}Object.keys(tp).forEach(function(a){a=
tp[a];a===b?h.style[a]=e+"px":a!==k&&(h.style[a]="0",h.style["margin-"+a]="auto")});return h}function vp(a,b,c,d){var e=!1,f=!1;if(a=a.marks)a=a.value,a.Rc()?a.values.forEach(function(a){a===Pc?e=!0:a===Qc&&(f=!0)}):a===Pc?e=!0:a===Qc&&(f=!0);if(e||f){var g=c.S,h=g.ownerDocument,l=b.Pb,k=Cc(jp,d),m=Cc(kp,d),p=Cc(lp,d);e&&Object.keys(rp).forEach(function(a){a=sp(h,rp[a],k,p,l,m);g.appendChild(a)});f&&Object.keys(tp).forEach(function(a){a=up(h,tp[a],k,p,m);g.appendChild(a)})}}
var wp=function(){var a={width:!0,height:!0,"block-size":!0,"inline-size":!0,margin:!0,padding:!0,border:!0,outline:!0,"outline-width":!0,"outline-style":!0,"outline-color":!0};"left right top bottom before after start end block-start block-end inline-start inline-end".split(" ").forEach(function(b){a["margin-"+b]=!0;a["padding-"+b]=!0;a["border-"+b+"-width"]=!0;a["border-"+b+"-style"]=!0;a["border-"+b+"-color"]=!0});return a}(),xp={"top-left-corner":{order:1,Ha:!0,Ea:!1,Fa:!0,Ga:!0,qa:null},"top-left":{order:2,
Ha:!0,Ea:!1,Fa:!1,Ga:!1,qa:"start"},"top-center":{order:3,Ha:!0,Ea:!1,Fa:!1,Ga:!1,qa:"center"},"top-right":{order:4,Ha:!0,Ea:!1,Fa:!1,Ga:!1,qa:"end"},"top-right-corner":{order:5,Ha:!0,Ea:!1,Fa:!1,Ga:!0,qa:null},"right-top":{order:6,Ha:!1,Ea:!1,Fa:!1,Ga:!0,qa:"start"},"right-middle":{order:7,Ha:!1,Ea:!1,Fa:!1,Ga:!0,qa:"center"},"right-bottom":{order:8,Ha:!1,Ea:!1,Fa:!1,Ga:!0,qa:"end"},"bottom-right-corner":{order:9,Ha:!1,Ea:!0,Fa:!1,Ga:!0,qa:null},"bottom-right":{order:10,Ha:!1,Ea:!0,Fa:!1,Ga:!1,qa:"end"},
"bottom-center":{order:11,Ha:!1,Ea:!0,Fa:!1,Ga:!1,qa:"center"},"bottom-left":{order:12,Ha:!1,Ea:!0,Fa:!1,Ga:!1,qa:"start"},"bottom-left-corner":{order:13,Ha:!1,Ea:!0,Fa:!0,Ga:!1,qa:null},"left-bottom":{order:14,Ha:!1,Ea:!1,Fa:!0,Ga:!1,qa:"end"},"left-middle":{order:15,Ha:!1,Ea:!1,Fa:!0,Ga:!1,qa:"center"},"left-top":{order:16,Ha:!1,Ea:!1,Fa:!0,Ga:!1,qa:"start"}},yp=Object.keys(xp).sort(function(a,b){return xp[a].order-xp[b].order});
function zp(a,b,c){un.call(this,a,null,"vivliostyle-page-rule-master",[],b,null,0);a=np(c);new Ap(this.f,this,c,a);this.C={};Bp(this,c);this.b.position=new U(jd,0);this.b.width=new U(a.width,0);this.b.height=new U(a.height,0);for(var d in c)wp[d]||"background-clip"===d||(this.b[d]=c[d])}u(zp,un);function Bp(a,b){var c=b._marginBoxes;c&&yp.forEach(function(d){c[d]&&(a.C[d]=new Cp(a.f,a,d,b))})}zp.prototype.h=function(a){return new Dp(a,this)};
function Ap(a,b,c,d){yn.call(this,a,null,null,[],b);this.F=d;this.b["z-index"]=new U(new yc(0),0);this.b["flow-from"]=new U(C("body"),0);this.b.position=new U(Dc,0);this.b.overflow=new U(vd,0);for(var e in wp)wp.hasOwnProperty(e)&&(this.b[e]=c[e])}u(Ap,yn);Ap.prototype.h=function(a){return new Ep(a,this)};
function Cp(a,b,c,d){yn.call(this,a,null,null,[],b);this.A=c;a=d._marginBoxes[this.A];for(var e in d)if(b=d[e],c=a[e],ch[e]||c&&c.value===Xc)this.b[e]=b;for(e in a)Object.prototype.hasOwnProperty.call(a,e)&&(b=a[e])&&b.value!==Xc&&(this.b[e]=b)}u(Cp,yn);Cp.prototype.h=function(a){return new Fp(a,this)};function Dp(a,b){vn.call(this,a,b);this.l=null;this.ra={}}u(Dp,vn);
Dp.prototype.j=function(a,b){var c=this.J,d;for(d in b)if(Object.prototype.hasOwnProperty.call(b,d))switch(d){case "writing-mode":case "direction":c[d]=b[d]}vn.prototype.j.call(this,a,b)};Dp.prototype.xd=function(){var a=this.style;a.left=Ad;a["margin-left"]=Ad;a["border-left-width"]=Ad;a["padding-left"]=Ad;a["padding-right"]=Ad;a["border-right-width"]=Ad;a["margin-right"]=Ad;a.right=Ad};
Dp.prototype.yd=function(){var a=this.style;a.top=Ad;a["margin-top"]=Ad;a["border-top-width"]=Ad;a["padding-top"]=Ad;a["padding-bottom"]=Ad;a["border-bottom-width"]=Ad;a["margin-bottom"]=Ad;a.bottom=Ad};Dp.prototype.W=function(a,b,c){b=b.H;var d={start:this.l.marginLeft,end:this.l.marginRight,la:this.l.ac},e={start:this.l.marginTop,end:this.l.marginBottom,la:this.l.$b};Gp(this,b.top,!0,d,a,c);Gp(this,b.bottom,!0,d,a,c);Gp(this,b.left,!1,e,a,c);Gp(this,b.right,!1,e,a,c)};
function Hp(a,b,c,d,e){this.S=a;this.C=e;this.j=c;this.A=!Y(d,b[c?"width":"height"],new ac(d,0,"px"));this.l=null}Hp.prototype.b=function(){return this.A};function Ip(a){a.l||(a.l=gp(a.C,a.S.element,a.j?["max-content width","min-content width"]:["max-content height","min-content height"]));return a.l}Hp.prototype.g=function(){var a=Ip(this);return this.j?zk(this.S)+a["max-content width"]+Ak(this.S):xk(this.S)+a["max-content height"]+yk(this.S)};
Hp.prototype.h=function(){var a=Ip(this);return this.j?zk(this.S)+a["min-content width"]+Ak(this.S):xk(this.S)+a["min-content height"]+yk(this.S)};Hp.prototype.f=function(){return this.j?zk(this.S)+this.S.width+Ak(this.S):xk(this.S)+this.S.height+yk(this.S)};function Jp(a){this.j=a}Jp.prototype.b=function(){return this.j.some(function(a){return a.b()})};Jp.prototype.g=function(){var a=this.j.map(function(a){return a.g()});return Math.max.apply(null,a)*a.length};
Jp.prototype.h=function(){var a=this.j.map(function(a){return a.h()});return Math.max.apply(null,a)*a.length};Jp.prototype.f=function(){var a=this.j.map(function(a){return a.f()});return Math.max.apply(null,a)*a.length};function Kp(a,b,c,d,e,f){Hp.call(this,a,b,c,d,e);this.u=f}u(Kp,Hp);Kp.prototype.b=function(){return!1};Kp.prototype.g=function(){return this.f()};Kp.prototype.h=function(){return this.f()};Kp.prototype.f=function(){return this.j?zk(this.S)+this.u+Ak(this.S):xk(this.S)+this.u+yk(this.S)};
function Gp(a,b,c,d,e,f){var g=a.b.f,h={},l={},k={},m;for(m in b){var p=xp[m];if(p){var q=b[m],x=a.ra[m],r=new Hp(q,x.style,c,g,f);h[p.qa]=q;l[p.qa]=x;k[p.qa]=r}}a=d.start.evaluate(e);d.end.evaluate(e);b=d.la.evaluate(e);var t=Lp(k,b),A=!1,H={};Object.keys(h).forEach(function(a){var b=Y(g,l[a].style[c?"max-width":"max-height"],d.la);b&&(b=b.evaluate(e),t[a]>b&&(b=k[a]=new Kp(h[a],l[a].style,c,g,f,b),H[a]=b.f(),A=!0))});A&&(t=Lp(k,b),A=!1,["start","center","end"].forEach(function(a){t[a]=H[a]||t[a]}));
var G={};Object.keys(h).forEach(function(a){var b=Y(g,l[a].style[c?"min-width":"min-height"],d.la);b&&(b=b.evaluate(e),t[a]<b&&(b=k[a]=new Kp(h[a],l[a].style,c,g,f,b),G[a]=b.f(),A=!0))});A&&(t=Lp(k,b),["start","center","end"].forEach(function(a){t[a]=G[a]||t[a]}));var W=a+b,Ya=a+(a+b);["start","center","end"].forEach(function(a){var b=t[a];if(b){var d=h[a],e=0;switch(a){case "start":e=c?d.left:d.top;break;case "center":e=(Ya-b)/2;break;case "end":e=W-b}c?Dk(d,e,b-zk(d)-Ak(d)):Ck(d,e,b-xk(d)-yk(d))}})}
function Lp(a,b){var c=a.start,d=a.center,e=a.end,f={};if(d){var g=[c,e].filter(function(a){return a}),g=Mp(d,g.length?new Jp(g):null,b);g.fb&&(f.center=g.fb);d=g.fb||d.f();d=(b-d)/2;c&&c.b()&&(f.start=d);e&&e.b()&&(f.end=d)}else c=Mp(c,e,b),c.fb&&(f.start=c.fb),c.Ic&&(f.end=c.Ic);return f}
function Mp(a,b,c){var d={fb:null,Ic:null};if(a&&b)if(a.b()&&b.b()){var e=a.g(),f=b.g();0<e&&0<f?(f=e+f,f<c?d.fb=c*e/f:(a=a.h(),b=b.h(),b=a+b,b<c?d.fb=a+(c-b)*(e-a)/(f-b):0<b&&(d.fb=c*a/b)),0<d.fb&&(d.Ic=c-d.fb)):0<e?d.fb=c:0<f&&(d.Ic=c)}else a.b()?d.fb=Math.max(c-b.f(),0):b.b()&&(d.Ic=Math.max(c-a.f(),0));else a?a.b()&&(d.fb=c):b&&b.b()&&(d.Ic=c);return d}Dp.prototype.Fb=function(a,b,c,d,e){Dp.Je.Fb.call(this,a,b,c,d,e);b.element.setAttribute("data-vivliostyle-page-box",!0)};
function Ep(a,b){zn.call(this,a,b);this.marginLeft=this.marginBottom=this.marginRight=this.marginTop=this.$b=this.ac=null}u(Ep,zn);
Ep.prototype.j=function(a,b){var c=this.J,d;for(d in b)Object.prototype.hasOwnProperty.call(b,d)&&(d.match(/^column.*$/)||d.match(/^background-/))&&(c[d]=b[d]);zn.prototype.j.call(this,a,b);d=this.f;c={ac:this.ac,$b:this.$b,marginTop:this.marginTop,marginRight:this.marginRight,marginBottom:this.marginBottom,marginLeft:this.marginLeft};d.l=c;d=d.style;d.width=new E(c.ac);d.height=new E(c.$b);d["padding-left"]=new E(c.marginLeft);d["padding-right"]=new E(c.marginRight);d["padding-top"]=new E(c.marginTop);
d["padding-bottom"]=new E(c.marginBottom)};Ep.prototype.xd=function(){var a=Np(this,{start:"left",end:"right",la:"width"});this.ac=a.ne;this.marginLeft=a.De;this.marginRight=a.Ce};Ep.prototype.yd=function(){var a=Np(this,{start:"top",end:"bottom",la:"height"});this.$b=a.ne;this.marginTop=a.De;this.marginBottom=a.Ce};
function Np(a,b){var c=a.style,d=a.b.f,e=b.start,f=b.end,g=b.la,h=a.b.F[g].oa(d,null),l=Y(d,c[g],h),k=Y(d,c["margin-"+e],h),m=Y(d,c["margin-"+f],h),p=An(d,c["padding-"+e],h),q=An(d,c["padding-"+f],h),x=Cn(d,c["border-"+e+"-width"],c["border-"+e+"-style"],h),r=Cn(d,c["border-"+f+"-width"],c["border-"+f+"-style"],h),t=z(d,h,y(d,y(d,x,p),y(d,r,q)));l?(t=z(d,t,l),k||m?k?m=z(d,t,k):k=z(d,t,m):m=k=ic(d,t,new nb(d,.5))):(k||(k=d.b),m||(m=d.b),l=z(d,t,y(d,k,m)));c[e]=new E(k);c[f]=new E(m);c["margin-"+e]=
Ad;c["margin-"+f]=Ad;c["padding-"+e]=new E(p);c["padding-"+f]=new E(q);c["border-"+e+"-width"]=new E(x);c["border-"+f+"-width"]=new E(r);c[g]=new E(l);c["max-"+g]=new E(l);return{ne:z(d,h,y(d,k,m)),De:k,Ce:m}}Ep.prototype.Fb=function(a,b,c,d,e){zn.prototype.Fb.call(this,a,b,c,d,e);c.J=b.element};function Fp(a,b){zn.call(this,a,b);var c=b.A;this.l=xp[c];a.ra[c]=this;this.sa=!0}u(Fp,zn);n=Fp.prototype;
n.Fb=function(a,b,c,d,e){var f=b.element;w(f,"display","flex");var g=Mn(this,a,"vertical-align"),h=null;g===C("middle")?h="center":g===C("top")?h="flex-start":g===C("bottom")&&(h="flex-end");h&&(w(f,"flex-flow",this.w?"row":"column"),w(f,"justify-content",h));zn.prototype.Fb.call(this,a,b,c,d,e)};
n.qa=function(a,b){var c=this.style,d=this.b.f,e=a.start,f=a.end,g="left"===e,h=g?b.ac:b.$b,l=Y(d,c[a.la],h),g=g?b.marginLeft:b.marginTop;if("start"===this.l.qa)c[e]=new E(g);else if(l){var k=An(d,c["margin-"+e],h),m=An(d,c["margin-"+f],h),p=An(d,c["padding-"+e],h),q=An(d,c["padding-"+f],h),x=Cn(d,c["border-"+e+"-width"],c["border-"+e+"-style"],h),f=Cn(d,c["border-"+f+"-width"],c["border-"+f+"-style"],h),l=y(d,l,y(d,y(d,p,q),y(d,y(d,x,f),y(d,k,m))));switch(this.l.qa){case "center":c[e]=new E(y(d,
g,jc(d,z(d,h,l),new nb(d,2))));break;case "end":c[e]=new E(z(d,y(d,g,h),l))}}};
function Op(a,b,c){function d(a){if(t)return t;t={la:r?r.evaluate(a):null,Xa:l?l.evaluate(a):null,Ya:k?k.evaluate(a):null};var b=h.evaluate(a),c=0;[q,m,p,x].forEach(function(b){b&&(c+=b.evaluate(a))});(null===t.Xa||null===t.Ya)&&c+t.la+t.Xa+t.Ya>b&&(null===t.Xa&&(t.Xa=0),null===t.Ya&&(t.Ff=0));null!==t.la&&null!==t.Xa&&null!==t.Ya&&(t.Ya=null);null===t.la&&null!==t.Xa&&null!==t.Ya?t.la=b-c-t.Xa-t.Ya:null!==t.la&&null===t.Xa&&null!==t.Ya?t.Xa=b-c-t.la-t.Ya:null!==t.la&&null!==t.Xa&&null===t.Ya?t.Ya=
b-c-t.la-t.Xa:null===t.la?(t.Xa=t.Ya=0,t.la=b-c):t.Xa=t.Ya=(b-c-t.la)/2;return t}var e=a.style;a=a.b.f;var f=b.zd,g=b.Dd;b=b.la;var h=c["margin"+g.charAt(0).toUpperCase()+g.substring(1)],l=Bn(a,e["margin-"+f],h),k=Bn(a,e["margin-"+g],h),m=An(a,e["padding-"+f],h),p=An(a,e["padding-"+g],h),q=Cn(a,e["border-"+f+"-width"],e["border-"+f+"-style"],h),x=Cn(a,e["border-"+g+"-width"],e["border-"+g+"-style"],h),r=Y(a,e[b],h),t=null;e[b]=new E(new qb(a,function(){var a=d(this).la;return null===a?0:a},b));e["margin-"+
f]=new E(new qb(a,function(){var a=d(this).Xa;return null===a?0:a},"margin-"+f));e["margin-"+g]=new E(new qb(a,function(){var a=d(this).Ya;return null===a?0:a},"margin-"+g));"left"===f?e.left=new E(y(a,c.marginLeft,c.ac)):"top"===f&&(e.top=new E(y(a,c.marginTop,c.$b)))}n.xd=function(){var a=this.f.l;this.l.Fa?Op(this,{zd:"right",Dd:"left",la:"width"},a):this.l.Ga?Op(this,{zd:"left",Dd:"right",la:"width"},a):this.qa({start:"left",end:"right",la:"width"},a)};
n.yd=function(){var a=this.f.l;this.l.Ha?Op(this,{zd:"bottom",Dd:"top",la:"height"},a):this.l.Ea?Op(this,{zd:"top",Dd:"bottom",la:"height"},a):this.qa({start:"top",end:"bottom",la:"height"},a)};n.Pc=function(a,b,c,d,e,f,g){zn.prototype.Pc.call(this,a,b,c,d,e,f,g);a=c.H;c=this.b.A;d=this.l;d.Fa||d.Ga?d.Ha||d.Ea||(d.Fa?a.left[c]=b:d.Ga&&(a.right[c]=b)):d.Ha?a.top[c]=b:d.Ea&&(a.bottom[c]=b)};
function Pp(a,b,c,d,e){this.b=a;this.l=b;this.h=c;this.f=d;this.g=e;this.j={};a=this.l;b=new bc(a,"page-number");b=new Ub(a,new $b(a,b,new nb(a,2)),a.b);c=new Kb(a,b);a.values["recto-page"]=c;a.values["verso-page"]=b;"ltr"===hp(this.g)?(a.values["left-page"]=b,b=new Kb(a,b),a.values["right-page"]=b):(c=new Kb(a,b),a.values["left-page"]=c,a.values["right-page"]=b)}function Qp(a){var b={};Ki(a.b,[],"",b);a.b.pop();return b}
function Rp(a,b){var c=[],d;for(d in b)if(Object.prototype.hasOwnProperty.call(b,d)){var e=b[d],f;f=e instanceof U?e.value+"":Rp(a,e);c.push(d+f+(e.Ra||""))}return c.sort().join("^")}function Sp(a,b,c){c=c.clone({Gb:"vivliostyle-page-rule-master"});var d=c.b,e=b.size;if(e){var f=np(b),e=e.Ra;d.width=qh(a.f,d.width,new U(f.width,e));d.height=qh(a.f,d.height,new U(f.height,e))}["counter-reset","counter-increment"].forEach(function(a){d[a]&&(b[a]=d[a])});c=c.h(a.h);c.j(a.b,a.g);bo(c,a.f);return c}
function Tp(a){this.b=null;this.h=a}u(Tp,V);Tp.prototype.apply=function(a){a.W===this.h&&this.b.apply(a)};Tp.prototype.f=function(){return 3};Tp.prototype.g=function(a){this.b&&Fh(a.wc,this.h,this.b);return!0};function Up(a){this.b=null;this.h=a}u(Up,V);Up.prototype.apply=function(a){1===(new bc(this.h,"page-number")).evaluate(a.l)&&this.b.apply(a)};Up.prototype.f=function(){return 2};function Vp(a){this.b=null;this.h=a}u(Vp,V);
Vp.prototype.apply=function(a){(new bc(this.h,"left-page")).evaluate(a.l)&&this.b.apply(a)};Vp.prototype.f=function(){return 1};function Wp(a){this.b=null;this.h=a}u(Wp,V);Wp.prototype.apply=function(a){(new bc(this.h,"right-page")).evaluate(a.l)&&this.b.apply(a)};Wp.prototype.f=function(){return 1};function Xp(a){this.b=null;this.h=a}u(Xp,V);Xp.prototype.apply=function(a){(new bc(this.h,"recto-page")).evaluate(a.l)&&this.b.apply(a)};Xp.prototype.f=function(){return 1};
function Yp(a){this.b=null;this.h=a}u(Yp,V);Yp.prototype.apply=function(a){(new bc(this.h,"verso-page")).evaluate(a.l)&&this.b.apply(a)};Yp.prototype.f=function(){return 1};function Zp(a,b){Dh.call(this,a,b,null,null)}u(Zp,Dh);Zp.prototype.apply=function(a){var b=a.l,c=a.F,d=this.style;a=this.X;wh(b,c,d,a,null,null);if(d=d._marginBoxes){var c=uh(c,"_marginBoxes"),e;for(e in d)if(d.hasOwnProperty(e)){var f=c[e];f||(f={},c[e]=f);wh(b,f,d[e],a,null,null)}}};
function $p(a,b,c,d,e){Vi.call(this,a,b,null,c,null,d,!1);this.M=e;this.G=[];this.g="";this.C=[]}u($p,Vi);n=$p.prototype;n.ec=function(){this.rb()};n.ub=function(a,b){if(this.g=b)this.b.push(new Tp(b)),this.X+=65536};
n.xc=function(a,b){b&&gf(this,"E_INVALID_PAGE_SELECTOR :"+a+"("+b.join("")+")");this.C.push(":"+a);switch(a.toLowerCase()){case "first":this.b.push(new Up(this.f));this.X+=256;break;case "left":this.b.push(new Vp(this.f));this.X+=1;break;case "right":this.b.push(new Wp(this.f));this.X+=1;break;case "recto":this.b.push(new Xp(this.f));this.X+=1;break;case "verso":this.b.push(new Yp(this.f));this.X+=1;break;default:gf(this,"E_INVALID_PAGE_SELECTOR :"+a)}};
function aq(a){var b;a.g||a.C.length?b=[a.g].concat(a.C.sort()):b=null;a.G.push({ee:b,X:a.X});a.g="";a.C=[]}n.cc=function(){aq(this);Vi.prototype.cc.call(this)};n.wa=function(){aq(this);Vi.prototype.wa.call(this)};
n.qb=function(a,b,c){if("bleed"!==a&&"marks"!==a||this.G.some(function(a){return!a.ee})){Vi.prototype.qb.call(this,a,b,c);var d=this.Va[a],e=this.M;if("bleed"===a||"marks"===a)e[""]||(e[""]={}),Object.keys(e).forEach(function(b){th(e[b],a,d)});else if("size"===a){var f=e[""];this.G.forEach(function(b){var c=new U(d.value,d.Ra+b.X);b=b.ee?b.ee.join(""):"";var g=e[b];g?(c=(b=g[a])?qh(null,c,b):c,th(g,a,c)):(g=e[b]={},th(g,a,c),f&&["bleed","marks"].forEach(function(a){f[a]&&th(g,a,f[a])},this))},this)}}};
n.we=function(a){Fh(this.j.wc,"*",a)};n.Be=function(a){return new Zp(this.Va,a)};n.Kd=function(a){var b=uh(this.Va,"_marginBoxes"),c=b[a];c||(c={},b[a]=c);cf(this.ia,new bq(this.f,this.ia,this.u,c))};function bq(a,b,c,d){df.call(this,a,b,!1);this.g=c;this.b=d}u(bq,ef);bq.prototype.pb=function(a,b,c){ah(this.g,a,b,c,this)};bq.prototype.uc=function(a,b){ff(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};bq.prototype.ed=function(a,b){ff(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};
bq.prototype.qb=function(a,b,c){th(this.b,a,new U(b,c?$e(this):af(this)))};var cq=new fe(function(){var a=I("uaStylesheetBase");bh.get().then(function(b){var c=ka("user-agent-base.css",ja);b=new Vi(null,null,null,null,null,b,!0);b.fc("UA");Ui=b.j;Hf(c,b,null,null).Da(a)});return K(a)},"uaStylesheetBaseFetcher");
function dq(a,b,c,d,e,f,g,h,l,k){this.l=a;this.f=b;this.b=c;this.g=d;this.H=e;this.j=f;this.C=a.M;this.F=g;this.h=h;this.A=l;this.G=k;this.u=a.l;sb(this.b,function(a){var b=this.b,c;c=(c=b.b[a])?(c=c.b[0])?c.b:null:null;var d;d=b.b[a];if(d=eq(this,d?d.f:"any"))d=(a=b.b[a])?0<a.b.length&&a.b[0].b.f<=this.C:!1;return d&&!!c&&!fq(this,c)});rb(this.b,new qb(this.b,function(){return this.ra+this.b.page},"page-number"))}
function gq(a,b,c,d){if(a.A.length){var e=new vb(0,b,c,d);a=a.A;for(var f={},g=0;g<a.length;g++)wh(e,f,a[g],0,null,null);g=f.width;a=f.height;var h=f["text-zoom"];if(g&&a||h)if(f=tb.em,(h?h.evaluate(e,"text-zoom"):null)===ld&&(h=f/d,d=f,b*=h,c*=h),g&&a&&(g=Cc(g.evaluate(e,"width"),e),e=Cc(a.evaluate(e,"height"),e),0<g&&0<e))return{width:g,height:e,fontSize:d}}return{width:b,height:c,fontSize:d}}
function hq(a,b,c,d,e,f,g,h,l,k,m){vb.call(this,0,d.width,d.height,d.fontSize);this.style=a;this.da=b;this.lang=b.lang||c;this.viewport=d;this.l={body:!0};this.g=e;this.A=this.b=this.H=this.f=this.F=null;this.C=0;this.nb=f;this.h=new sl(this.style.C);this.pa={};this.V=null;this.j=m;this.R={};this.ha=null;this.Ta=g;this.mb=h;this.ra=l;this.lb=k;for(var p in a.h)(b=a.h[p]["flow-consume"])&&(b.evaluate(this,"flow-consume")==Ec?this.l[p]=!0:delete this.l[p]);this.sa={}}u(hq,vb);
function iq(a){var b=I("StyleInstance.init"),c=new Ym(a.j,a.da.url),d=new Xm(a.j,a.da.url,a.style.f,a.style.b);a.f=new $k(a.da,a.style.g,a.style.f,a,a.l,a.style.u,c,d);d.h=a.f;jl(a.f,a);a.H={};a.H[a.da.url]=a.f;var e=gl(a.f);a.ha=hp(e);a.F=new co(a.style.H);c=new Hi(a.style.g,a,c,d);a.F.j(c,e);bo(a.F,a);a.V=new Pp(c,a.style.b,a.F,a,e);e=[];for(c=0;c<a.style.j.length;c++)if(d=a.style.j[c],!d.T||d.T.evaluate(a))d=pl(d.Sb,a),d=new ql(d),e.push(d);yl(a.nb,e,a.h).Da(b);var f=a.style.G;Object.keys(f).forEach(function(a){var b=
op(np(f[a]),this);this.sa[a]={width:b.Eb+2*b.rd,height:b.Db+2*b.rd}},a);return K(b)}function kl(a,b,c){if(a=a.b)a.f[b.b]||(a.f[b.b]=c),c=a.b[b.b],c||(c=new sk,a.b[b.b]=c),c.b.push(new rk(new pk({ka:[{node:b.element,Sa:bk,ma:null,ya:null,va:null}],ea:0,K:!1,Ia:null}),b))}function jq(a,b){for(var c=Number.POSITIVE_INFINITY,d=0;d<b.b.length;d++){for(var e=b.b[d].f.Pa,f=e.ka[0].node,g=e.ea,h=e.K,l=0;f.ownerDocument!=a.da.b;)l++,f=e.ka[l].node,h=!1,g=0;e=pj(a.da,f,g,h);e<c&&(c=e)}return c}
function kq(a,b,c){if(!b)return 0;var d=Number.POSITIVE_INFINITY,e;for(e in a.l){var f=b.b[e];if(!(c||f&&f.b.length)&&a.b){f=a.f;f.J=e;for(var g=0;null!=f.J&&(g+=5E3,hl(f,g,0)!=Number.POSITIVE_INFINITY););f=a.b.b[e];b!=a.b&&f&&(f=f.clone(),b.b[e]=f)}f&&(f=jq(a,f),f<d&&(d=f))}return d}function eq(a,b){switch(b){case "left":case "right":case "recto":case "verso":return(new bc(a.style.b,b+"-page")).evaluate(a);default:return!0}}
function lq(a,b){var c=a.b,d=kq(a,c);if(d==Number.POSITIVE_INFINITY)return null;for(var e=a.F.u,f,g=0;g<e.length;g++)if(f=e[g],"vivliostyle-page-rule-master"!==f.b.Gb){var h=1,l=Mn(f,a,"utilization");l&&l.be()&&(h=l.I);var l=xb(a,"em",!1),k=a.Eb()*a.Db();a.C=hl(a.f,d,Math.ceil(h*k/(l*l)));h=a;l=c;k=void 0;for(k in l.b){var m=l.b[k];if(m&&0<m.b.length){var p=m.b[0].b;if(jq(h,m)===p.f){a:switch(p=m.f,p){case "left":case "right":case "recto":case "verso":break a;default:p=null}m.f=Al(Rk(p,m.b[0].b.g))}}}a.A=
c.clone();h=a;l=h.b.page;k=void 0;for(k in h.b.b)for(m=h.b.b[k],p=m.b.length-1;0<=p;p--){var q=m.b[p];0>q.b.cb&&q.b.f<h.C&&(q.b.cb=l)}wb(a,a.style.b);h=Mn(f,a,"enabled");if(!h||h===wd){c=a;v.debug("Location - page",c.b.page);v.debug("  current:",d);v.debug("  lookup:",c.C);d=void 0;for(d in c.b.b)for(e=c.b.b[d],g=0;g<e.b.length;g++)v.debug("  Chunk",d+":",e.b[g].b.f);d=a.V;e=f;f=b;c=e.b;Object.keys(f).length?(e=c,g=Rp(d,f),e=e.l+"^"+g,g=d.j[e],g||("background-host"===c.Gb?(c=d,f=(new zp(c.l,c.h.b,
f)).h(c.h),f.j(c.b,c.g),bo(f,c.f),g=f):g=Sp(d,f,c),d.j[e]=g),f=g.b,f.f.g=f,f=g):(c.f.g=c,f=e);return f}}throw Error("No enabled page masters");}function fq(a,b){var c=a.A.f,d=c[b.b].f;if(d){var e=b.f,f=c[d].b;if(!f.length||e<f[0])return!1;var c=Ga(f.length,function(a){return f[a]>e})-1,c=f[c],d=a.A.b[d],g=jq(a,d);return c<g?!1:g<c?!0:!eq(a,d.f)}return!1}function mq(a,b,c){a=a.b.f[c];a.L||(a.L=new Ol(null));b.Ud=a.L}
function nq(a,b,c){var d=a.b.b[c];if(!d||!eq(a,d.f))return J(!0);d.f="any";mq(a,b,c);lm(b);a.l[c]&&0<b.tb.length&&(b.se=!1);var e=I("layoutColumn"),f=[],g=[],h=!0;ce(function(c){for(;0<d.b.length-g.length;){for(var e=0;0<=g.indexOf(e);)e++;var l=d.b[e];if(l.b.f>a.C||fq(a,l.b))break;for(var p=e+1;p<d.b.length;p++)if(!(0<=g.indexOf(p))){var q=d.b[p];if(q.b.f>a.C||fq(a,q.b))break;Wj(q.b,l.b)&&(l=q,e=p)}var x=l.b,r=!0;om(b,l.f,h).then(function(a){h=!1;!l.b.$e||a&&!x.h||f.push(e);x.h?(g.push(e),N(c)):
(a?l.f=a:g.push(e),b.l&&(d.f=Al(b.l)),a||b.l?N(c):r?r=!1:ee(c))});if(r){r=!1;return}}N(c)}).then(function(){d.b=d.b.filter(function(a,b){return 0<=f.indexOf(b)||0>g.indexOf(b)});M(e,!0)});return K(e)}
function oq(a,b,c,d,e,f,g,h){Fn(c);var l=Mn(c,a,"enabled");if(l&&l!==wd)return J(!0);var k=I("layoutContainer"),m=Mn(c,a,"wrap-flow")===Gc,p=c.w?c.h&&c.M:c.g&&c.R,l=Mn(c,a,"flow-from"),q=a.viewport.b.createElement("div"),x=Mn(c,a,"position");w(q,"position",x?x.name:"absolute");d.insertBefore(q,d.firstChild);var r=new wk(q);r.w=c.w;c.Fb(a,r,b,a.h,a.g);r.M=e;r.R=f;e+=r.left+r.marginLeft+r.ha;f+=r.top+r.marginTop+r.pa;var t=!1;if(l&&l.ye())if(a.R[l.toString()])c.Pc(a,r,b,null,1,a.g,a.h),l=J(!0);else{var A=
I("layoutContainer.inner"),H=l.toString(),G=Z(c,a,"column-count"),W=Z(c,a,"column-gap"),Ya=1<G?Z(c,a,"column-width"):r.width,l=Ln(c,a),pb=0,x=Mn(c,a,"shape-inside"),lc=ng(x,0,0,r.width,r.height,a),va=new Fo(H,a,a.viewport,a.f,l,a.da,a.h,a.style.F,a,b,a.Ta,a.mb,h,a.lb),L=new Wm(a.j,a.b.page-1),Eb=0,P=null;ce(function(b){for(;Eb<G;){var c=Eb++;if(1<G){var d=a.viewport.b.createElement("div");w(d,"position","absolute");q.appendChild(d);P=new Pl(d,va,a.g,L);P.w=r.w;P.nb=r.nb;P.Xb=r.Xb;r.w?(w(d,"margin-left",
r.u+"px"),w(d,"margin-right",r.J+"px"),c=c*(Ya+W)+r.A,Dk(P,0,r.width),Ck(P,c,Ya)):(w(d,"margin-top",r.A+"px"),w(d,"margin-bottom",r.H+"px"),c=c*(Ya+W)+r.u,Ck(P,0,r.height),Dk(P,c,Ya));P.M=e+r.u;P.R=f+r.A}else P=new Pl(q,va,a.g,L),Bk(P,r),r=P;P.V=p?[]:g;P.Mb=lc;if(0<=P.width){var k=I("inner");nq(a,P,H).then(function(){P.l&&"column"!=P.l&&(Eb=G,"region"!=P.l&&(a.R[H]=!0));M(k,!0)});c=K(k)}else c=J(!0);if(c.ua()){c.then(function(){0<h.b.length?N(b):(pb=Math.max(pb,P.g),ee(b))});return}0<h.b.length||
(pb=Math.max(pb,P.g))}N(b)}).then(function(){r.g=pb;c.Pc(a,r,b,P,G,a.g,a.h);M(A,!0)});l=K(A)}else{if((l=Mn(c,a,"content"))&&Fk(l)){x="span";l.url&&(x="img");var Xi=a.viewport.b.createElement(x);l.aa(new Ek(Xi,a,l));q.appendChild(Xi);"img"==x&&ao(c,a,Xi,a.h);$n(c,a,r,a.h)}else c.sa&&(d.removeChild(q),t=!0);t||c.Pc(a,r,b,null,1,a.g,a.h);l=J(!0)}l.then(function(){if(!c.g||0<Math.floor(r.g)){if(!t&&!m){var l=r.M+r.left,p=r.R+r.top,x=zk(r)+r.width+Ak(r),A=xk(r)+r.height+yk(r),H=Mn(c,a,"shape-outside"),
l=ng(H,l,p,x,A,a);g.push(l)}}else if(!c.u.length){d.removeChild(q);M(k,!0);return}var G=c.u.length-1;be(function(){for(;0<=G;){var d=c.u[G--],d=oq(a,b,d,q,e,f,g,h);if(d.ua())return d}return J(!1)}).then(function(){M(k,!0)})});return K(k)}
function pq(a,b,c){a.R={};c?(a.b=c.clone(),cl(a.f,c.g)):(a.b=new uk,cl(a.f,-1));a.lang&&b.g.setAttribute("lang",a.lang);c=a.b;c.page++;wb(a,a.style.b);a.A=c.clone();var d=Qp(a.V),e=lq(a,d);if(!e)return J(null);Nj(b,e.b.b.width.value===yd);Oj(b,e.b.b.height.value===zd);a.j.j=b;hn(a.j,d,a);var f=op(np(d),a);qq(a,f,b);vp(d,f,b,a);var g=f.wb+f.Pb,d=Mn(e,a,"writing-mode")||Wc,f=Mn(e,a,"direction")||ed,h=new qo(b.M.bind(b),d,f),l=[],k=I("layoutNextPage");ce(function(d){oq(a,b,e,b.g,g,g,l.concat(),h).then(function(){if(0<
h.b.length){l=l.concat(so(h));h.b.splice(0,h.b.length);c=a.b=a.A.clone();for(var e;e=b.g.lastChild;)b.g.removeChild(e);ee(d)}else N(d)})}).then(function(){e.W(a,b,a.g);var d=new bc(e.b.f,"left-page");b.l=d.evaluate(a)?"left":"right";var d=a.b.page,f;for(f in a.b.b)for(var g=a.b.b[f],h=g.b.length-1;0<=h;h--){var l=g.b[h];0<=l.b.cb&&l.b.cb+l.b.l-1<=d&&g.b.splice(h,1)}a.b=a.A=null;c.g=a.f.b;Qj(b,a.style.l.J[a.da.url],a.g);var t;a:{for(t in a.l)if((f=c.b[t])&&0<f.b.length){t=!1;break a}t=!0}t&&(c=null);
M(k,c)});return K(k)}function qq(a,b,c){a.M=b.Eb;a.J=b.Db;c.S.style.width=b.Eb+2*b.rd+"px";c.S.style.height=b.Db+2*b.rd+"px";c.g.style.left=b.wb+"px";c.g.style.right=b.wb+"px";c.g.style.top=b.wb+"px";c.g.style.bottom=b.wb+"px";c.g.style.padding=b.Pb+"px"}function rq(a,b,c,d){Vi.call(this,a.j,a,b,c,d,a.h,!c);this.g=a;this.C=!1}u(rq,Vi);n=rq.prototype;n.bd=function(){};n.ad=function(a,b,c){a=new un(this.g.u,a,b,c,this.g.G,this.T,af(this.ia));cf(this.g,new io(a.f,this.g,a,this.u))};
n.Vb=function(a){a=a.b;this.T&&(a=hc(this.f,this.T,a));cf(this.g,new rq(this.g,a,this,this.F))};n.Yc=function(){cf(this.g,new bj(this.f,this.ia))};n.$c=function(){var a={};this.g.A.push({Sb:a,T:this.T});cf(this.g,new cj(this.f,this.ia,null,a,this.g.h))};n.Zc=function(a){var b=this.g.l[a];b||(b={},this.g.l[a]=b);cf(this.g,new cj(this.f,this.ia,null,b,this.g.h))};n.dd=function(){var a={};this.g.H.push(a);cf(this.g,new cj(this.f,this.ia,this.T,a,this.g.h))};
n.Bc=function(a){var b=this.g.C;if(a){var c=uh(b,"_pseudos"),b=c[a];b||(b={},c[a]=b)}cf(this.g,new cj(this.f,this.ia,null,b,this.g.h))};n.cd=function(){this.C=!0;this.rb()};n.ec=function(){var a=new $p(this.g.u,this.g,this,this.u,this.g.F);cf(this.g,a);a.ec()};n.wa=function(){Vi.prototype.wa.call(this);if(this.C){this.C=!1;var a="R"+this.g.M++,b=C(a),c;this.T?c=new ph(b,0,this.T):c=new U(b,0);vh(this.Va,"region-id").push(c);this.zb();a=new rq(this.g,this.T,this,a);cf(this.g,a);a.wa()}};
function sq(a){var b=a.getAttribute("content");if(!b)return"";a={};for(var c;c=b.match(/^,?\s*([-A-Za-z_.][-A-Za-z_0-9.]*)\s*=\s*([-+A-Za-z_0-9.]*)\s*/);)b=b.substr(c[0].length),a[c[1]]=c[2];b=a.width-0;a=a.height-0;return b&&a?"@-epubx-viewport{width:"+b+"px;height:"+a+"px;}":""}function tq(a){bf.call(this);this.h=a;this.j=new mb(null);this.u=new mb(this.j);this.G=new rn(this.j);this.J=new rq(this,null,null,null);this.M=0;this.A=[];this.C={};this.l={};this.H=[];this.F={};this.b=this.J}u(tq,bf);
tq.prototype.error=function(a){v.b("CSS parser:",a)};function uq(a,b){return vq(b,a)}function wq(a){Ve.call(this,uq,"document");this.M=a;this.H={};this.u={};this.f={};this.J={};this.l=null;this.b=[]}u(wq,Ve);function xq(a,b,c){yq(a,b,c);var d=ka("user-agent.xml",ja),e=I("OPSDocStore.init");bh.get().then(function(b){a.l=b;cq.get().then(function(){a.load(d).then(function(){M(e,!0)})})});return K(e)}function yq(a,b,c){a.b.splice(0);b&&b.forEach(a.R,a);c&&c.forEach(a.V,a)}
wq.prototype.R=function(a){this.b.push({url:a.url,text:a.text,Wa:"Author",Aa:null,media:null})};wq.prototype.V=function(a){this.b.push({url:a.url,text:a.text,Wa:"User",Aa:null,media:null})};
function vq(a,b){var c=I("OPSDocStore.load"),d=b.url;xj(b,a).then(function(b){if(b){for(var e=[],g=b.b.getElementsByTagNameNS("http://www.idpf.org/2007/ops","trigger"),h=0;h<g.length;h++){var l=g[h],k=l.getAttributeNS("http://www.w3.org/2001/xml-events","observer"),m=l.getAttributeNS("http://www.w3.org/2001/xml-events","event"),p=l.getAttribute("action"),l=l.getAttribute("ref");k&&m&&p&&l&&e.push({Xe:k,event:m,action:p,zc:l})}a.J[d]=e;var q=[];q.push({url:ka("user-agent-page.css",ja),text:null,Wa:"UA",
Aa:null,media:null});if(e=b.l)for(e=e.firstChild;e;e=e.nextSibling)if(1==e.nodeType)if(g=e,h=g.namespaceURI,k=g.localName,"http://www.w3.org/1999/xhtml"==h)if("style"==k)q.push({url:d,text:g.textContent,Wa:"Author",Aa:null,media:null});else if("link"==k){if(m=g.getAttribute("rel"),h=g.getAttribute("class"),k=g.getAttribute("media"),"stylesheet"==m||"alternate stylesheet"==m&&h)g=g.getAttribute("href"),g=ka(g,d),q.push({url:g,text:null,Aa:h,media:k,Wa:"Author"})}else"meta"==k&&"viewport"==g.getAttribute("name")&&
q.push({url:d,text:sq(g),Wa:"Author",Aa:null,media:null});else"http://www.gribuser.ru/xml/fictionbook/2.0"==h?"stylesheet"==k&&"text/css"==g.getAttribute("type")&&q.push({url:d,text:g.textContent,Wa:"Author",Aa:null,media:null}):"http://example.com/sse"==h&&"property"===k&&(h=g.getElementsByTagName("name")[0])&&"stylesheet"===h.textContent&&(g=g.getElementsByTagName("value")[0])&&(g=ka(g.textContent,d),q.push({url:g,text:null,Aa:null,media:null,Wa:"Author"}));for(h=0;h<a.b.length;h++)q.push(a.b[h]);
for(var x="",h=0;h<q.length;h++)x+=q[h].url,x+="^",q[h].text&&(x+=q[h].text),x+="^";var r=a.H[x];r?(a.f[d]=r,M(c,b)):(e=a.u[x],e||(e=new fe(function(){var b=I("fetchStylesheet"),c=0,d=new tq(a.l);be(function(){if(c<q.length){var a=q[c++];d.fc(a.Wa);return null!==a.text?If(a.text,d,a.url,a.Aa,a.media).Ld(!0):Hf(a.url,d,a.Aa,a.media)}return J(!1)}).then(function(){r=new dq(a,d.j,d.u,d.J.j,d.G,d.A,d.C,d.l,d.H,d.F);a.H[x]=r;delete a.u[x];M(b,r)});return K(b)},"FetchStylesheet "+d),a.u[x]=e,e.start()),
e.get().then(function(e){a.f[d]=e;M(c,b)}))}else M(c,null)});return K(c)};function zq(a){return String.fromCharCode(a>>>24&255,a>>>16&255,a>>>8&255,a&255)}
function Aq(a){var b=new ya;b.append(a);var c=55-a.length&63;for(b.append("\u0080");0<c;)c--,b.append("\x00");b.append("\x00\x00\x00\x00");b.append(zq(8*a.length));a=b.toString();for(var b=[1732584193,4023233417,2562383102,271733878,3285377520],c=[],d,e=0;e<a.length;e+=64){for(d=0;16>d;d++){var f=a.substr(e+4*d,4);c[d]=(f.charCodeAt(0)&255)<<24|(f.charCodeAt(1)&255)<<16|(f.charCodeAt(2)&255)<<8|f.charCodeAt(3)&255}for(;80>d;d++)f=c[d-3]^c[d-8]^c[d-14]^c[d-16],c[d]=f<<1|f>>>31;var f=b[0],g=b[1],h=
b[2],l=b[3],k=b[4],m;for(d=0;80>d;d++)m=20>d?(g&h|~g&l)+1518500249:40>d?(g^h^l)+1859775393:60>d?(g&h|g&l|h&l)+2400959708:(g^h^l)+3395469782,m+=(f<<5|f>>>27)+k+c[d],k=l,l=h,h=g<<30|g>>>2,g=f,f=m;b[0]=b[0]+f|0;b[1]=b[1]+g|0;b[2]=b[2]+h|0;b[3]=b[3]+l|0;b[4]=b[4]+k|0}return b}function Bq(a){a=Aq(a);for(var b=[],c=0;c<a.length;c++){var d=a[c];b.push(d>>>24&255,d>>>16&255,d>>>8&255,d&255)}return b}
function Cq(a){a=Aq(a);for(var b=new ya,c=0;c<a.length;c++)b.append(zq(a[c]));a=b.toString();b=new ya;for(c=0;c<a.length;c++)b.append((a.charCodeAt(c)|256).toString(16).substr(1));return b.toString()};function Dq(a,b,c,d,e,f,g,h,l,k){this.b=a;this.url=b;this.lang=c;this.f=d;this.l=e;this.$=eb(f);this.u=g;this.j=h;this.h=l;this.g=k;this.bb=this.page=null}function Eq(a,b,c){if(c--)for(b=b.firstChild;b;b=b.nextSibling)if(1==b.nodeType){var d=b;"auto"!=wa(d,"height","auto")&&(w(d,"height","auto"),Eq(a,d,c));"absolute"==wa(d,"position","static")&&(w(d,"position","relative"),Eq(a,d,c))}}
function Fq(a){var b=a.target,c="\u25b8"==b.textContent;b.textContent=c?"\u25be":"\u25b8";for(b=b.parentNode.firstChild;b;)if(1!=b.nodeType)b=b.nextSibling;else{var d=b;"toc-container"==d.getAttribute("data-adapt-class")?b=d.firstChild:("toc-node"==d.getAttribute("data-adapt-class")&&(d.style.height=c?"auto":"0px"),b=b.nextSibling)}a.stopPropagation()}
Dq.prototype.Ad=function(a){var b=this.u.Ad(a);return function(a,d,e){var c=e.behavior;if(!c||"toc-node"!=c.toString()&&"toc-container"!=c.toString())return b(a,d,e);a=d.getAttribute("data-adapt-class");"toc-node"==a&&(e=d.firstChild,"\u25b8"!=e.textContent&&(e.textContent="\u25b8",w(e,"cursor","pointer"),e.addEventListener("click",Fq,!1)));var g=d.ownerDocument.createElement("div");g.setAttribute("data-adapt-process-children","true");"toc-node"==c.toString()?(e=d.ownerDocument.createElement("div"),
e.textContent="\u25b9",w(e,"margin-left","-1em"),w(e,"display","inline-block"),w(e,"width","1em"),w(e,"text-align","left"),w(e,"cursor","default"),w(e,"font-family","Menlo,sans-serif"),g.appendChild(e),w(g,"overflow","hidden"),g.setAttribute("data-adapt-class","toc-node"),"toc-node"!=a&&"toc-container"!=a||w(g,"height","0px")):"toc-node"==a&&g.setAttribute("data-adapt-class","toc-container");return J(g)}};
Dq.prototype.Xc=function(a,b,c,d,e){if(this.page)return J(this.page);var f=this,g=I("showTOC"),h=new Mj(a,a);this.page=h;this.b.load(this.url).then(function(d){var k=f.b.f[d.url],l=gq(k,c,1E5,e);b=new fp(b.window,l.fontSize,b.root,l.width,l.height);var p=new hq(k,d,f.lang,b,f.f,f.l,f.Ad(d),f.j,0,f.h,f.g);f.bb=p;p.$=f.$;iq(p).then(function(){pq(p,h,null).then(function(){Eq(f,a,2);M(g,h)})})});return K(g)};
Dq.prototype.Qc=function(){if(this.page){var a=this.page;this.bb=this.page=null;w(a.S,"visibility","none");var b=a.S.parentNode;b&&b.removeChild(a.S)}};Dq.prototype.ce=function(){return!!this.page};function Gq(){wq.call(this,Hq(this));this.g=new Ve(xj,"document");this.F=new Ve(Xe,"text");this.G={};this.ha={};this.A={};this.C={}}u(Gq,wq);function Hq(a){return function(b){return a.A[b]}}
function Iq(a,b,c){var d=I("loadEPUBDoc");"/"!==b.substring(b.length-1)&&(b+="/");c&&a.F.fetch(b+"?r=list");a.g.fetch(b+"META-INF/encryption.xml");var e=b+"META-INF/container.xml";a.g.load(e,!0,"Failed to fetch EPUB container.xml from "+e).then(function(f){if(f){f=Gj(mj(mj(mj(new nj([f.b]),"container"),"rootfiles"),"rootfile"),"full-path");for(var g=0;g<f.length;g++){var h=f[g];if(h){Jq(a,b,h,c).Da(d);return}}M(d,null)}else v.error("Received an empty response for EPUB container.xml "+e+". This may be caused by the server not allowing cross origin requests.")});
return K(d)}function Jq(a,b,c,d){var e=b+c,f=a.G[e];if(f)return J(f);var g=I("loadOPF");a.g.load(e,void 0,void 0).then(function(c){c?a.g.load(b+"META-INF/encryption.xml",void 0,void 0).then(function(h){(d?a.F.load(b+"?r=list"):J(null)).then(function(d){f=new Kq(a,b);Lq(f,c,h,d,b+"?r=manifest").then(function(){a.G[e]=f;a.ha[b]=f;M(g,f)})})}):v.error("Received an empty response for EPUB OPF "+e+". This may be caused by the server not allowing cross origin requests.")});return K(g)}
function Mq(a,b,c){var d=I("EPUBDocStore.load");b=ha(b);(a.C[b]=vq(a,{status:200,url:b,contentType:c.contentType,responseText:null,responseXML:c,Wc:null})).Da(d);return K(d)}
Gq.prototype.load=function(a){var b=ha(a);if(a=this.C[b])return a.ua()?a:J(a.get());var c=I("EPUBDocStore.load");a=Gq.Je.load.call(this,b,!0,"Failed to fetch a source document from "+b);a.then(function(a){a?M(c,a):v.error("Received an empty response for "+b+". This may be caused by the server not allowing cross origin requests.")});return K(c)};function Nq(){this.id=null;this.src="";this.h=this.f=null;this.N=-1;this.l=0;this.u=null;this.b=this.g=0;this.Tb=this.cb=null;this.j=Ja}
function Oq(a){return a.id}function Pq(a){var b=Bq(a);return function(a){var c=I("deobfuscator"),e,f;a.slice?(e=a.slice(0,1040),f=a.slice(1040,a.size)):(e=a.webkitSlice(0,1040),f=a.webkitSlice(1040,a.size-1040));Ue(e).then(function(a){a=new DataView(a);for(var d=0;d<a.byteLength;d++){var e=a.getUint8(d),e=e^b[d%20];a.setUint8(d,e)}M(c,Te([a,f]))});return K(c)}}
var Qq={dcterms:"http://purl.org/dc/terms/",marc:"http://id.loc.gov/vocabulary/",media:"http://www.idpf.org/epub/vocab/overlays/#",onix:"http://www.editeur.org/ONIX/book/codelists/current.html#",xsd:"http://www.w3.org/2001/XMLSchema#"},Rq=Qq.dcterms+"language",Sq=Qq.dcterms+"title";
function Tq(a,b){var c={};return function(d,e){var f,g,h=d.r||c,l=e.r||c;if(a==Sq&&(f="main"==h["http://idpf.org/epub/vocab/package/#title-type"],g="main"==l["http://idpf.org/epub/vocab/package/#title-type"],f!=g))return f?-1:1;f=parseInt(h["http://idpf.org/epub/vocab/package/#display-seq"],10);isNaN(f)&&(f=Number.MAX_VALUE);g=parseInt(l["http://idpf.org/epub/vocab/package/#display-seq"],10);isNaN(g)&&(g=Number.MAX_VALUE);return f!=g?f-g:a!=Rq&&b&&(f=(h[Rq]||h["http://idpf.org/epub/vocab/package/#alternate-script"])==
b,g=(l[Rq]||l["http://idpf.org/epub/vocab/package/#alternate-script"])==b,f!=g)?f?-1:1:d.o-e.o}}
function Uq(a,b){function c(a){for(var b in a){var d=a[b];d.sort(Tq(b,k));for(var e=0;e<d.length;e++){var f=d[e].r;f&&c(f)}}}function d(a){return Ma(a,function(a){return La(a,function(a){var b={v:a.value,o:a.order};a.Gf&&(b.s=a.scheme);if(a.id||a.lang){var c=l[a.id];if(c||a.lang)a.lang&&(a={name:Rq,value:a.lang,lang:null,id:null,Id:a.id,scheme:null,order:a.order},c?c.push(a):c=[a]),c=Ka(c,function(a){return a.name}),b.r=d(c)}return b})})}function e(a){if(a&&(a=a.match(/^\s*(([^:]*):)?(\S+)\s*$/))){var b=
a[1]?f[a[1]]:"http://idpf.org/epub/vocab/package/#";if(b)return b+a[3]}return null}var f;if(b){f={};for(var g in Qq)f[g]=Qq[g];for(;g=b.match(/(^\s*[A-Z_a-z\u007F-\uFFFF][-.A-Z_a-z0-9\u007F-\uFFFF]*):\s*(\S+)/);)b=b.substr(g[0].length),f[g[1]]=g[2]}else f=Qq;var h=1;g=Ej(Fj(a),function(a){if("meta"==a.localName){var b=e(a.getAttribute("property"));if(b)return{name:b,value:a.textContent,id:a.getAttribute("id"),order:h++,Id:a.getAttribute("refines"),lang:null,scheme:e(a.getAttribute("scheme"))}}else if("http://purl.org/dc/elements/1.1/"==
a.namespaceURI)return{name:Qq.dcterms+a.localName,order:h++,lang:a.getAttribute("xml:lang"),value:a.textContent,id:a.getAttribute("id"),Id:null,scheme:null};return null});var l=Ka(g,function(a){return a.Id});g=d(Ka(g,function(a){return a.Id?null:a.name}));var k=null;g[Rq]&&(k=g[Rq][0].v);c(g);return g}function Vq(){var a=window.MathJax;return a?a.Hub:null}var Wq={"appliaction/xhtml+xml":!0,"image/jpeg":!0,"image/png":!0,"image/svg+xml":!0,"image/gif":!0,"audio/mp3":!0};
function Kq(a,b){this.h=a;this.l=this.f=this.b=this.j=this.g=null;this.C=b;this.A=null;this.R={};this.lang=null;this.F=0;this.J={};this.V=this.M=this.W=null;this.G={};this.H=null;this.u=Xq(this);Vq()&&(fh["http://www.w3.org/1998/Math/MathML"]=!0)}
function Xq(a){function b(){}b.prototype.Md=function(a,b){return"viv-id-"+ma(b+(a?"#"+a:""),":")};b.prototype.Gc=function(b,d){var c=b.match(/^([^#]*)#?(.*)$/);if(c){var f=c[1]||d,c=c[2];if(f&&a.j.some(function(a){return a.src===f}))return"#"+this.Md(c,f)}return b};b.prototype.af=function(a){"#"===a.charAt(0)&&(a=a.substring(1));a.indexOf("viv-id-")||(a=a.substring(7));return(a=Ea(a).match(/^([^#]*)#?(.*)$/))?[a[1],a[2]]:[]};return new b}
function Yq(a,b){return a.C?b.substr(0,a.C.length)==a.C?decodeURI(b.substr(a.C.length)):null:b}
function Lq(a,b,c,d,e){a.g=b;var f=mj(new nj([b.b]),"package"),g=Gj(f,"unique-identifier")[0];g&&(g=tj(b,b.url+"#"+g))&&(a.A=g.textContent.replace(/[ \n\r\t]/g,""));var h={};a.j=La(mj(mj(f,"manifest"),"item").b,function(c){var d=new Nq,e=b.url;d.id=c.getAttribute("id");d.src=ka(c.getAttribute("href"),e);d.f=c.getAttribute("media-type");if(e=c.getAttribute("properties")){for(var e=e.split(/\s+/),f={},g=0;g<e.length;g++)f[e[g]]=!0;d.j=f}(c=c.getAttribute("fallback"))&&!Wq[d.f]&&(h[d.src]=c);!a.M&&d.j.nav&&
(a.M=d);!a.V&&d.j["cover-image"]&&(a.V=d);return d});a.f=Ia(a.j,Oq);a.l=Ia(a.j,function(b){return Yq(a,b.src)});for(var l in h)for(g=l;;){g=a.f[h[g]];if(!g)break;if(Wq[g.f]){a.G[l]=g.src;break}g=g.src}a.b=La(mj(mj(f,"spine"),"itemref").b,function(b,c){var d=b.getAttribute("idref");if(d=a.f[d])d.h=b,d.N=c;return d});if(l=Gj(mj(f,"spine"),"toc")[0])a.W=a.f[l];if(l=Gj(mj(f,"spine"),"page-progression-direction")[0]){a:switch(l){case "ltr":l="ltr";break a;case "rtl":l="rtl";break a;default:throw Error("unknown PageProgression: "+
l);}a.H=l}var g=c?Gj(mj(mj(Cj(mj(mj(new nj([c.b]),"encryption"),"EncryptedData"),Bj()),"CipherData"),"CipherReference"),"URI"):[],k=mj(mj(f,"bindings"),"mediaType").b;for(c=0;c<k.length;c++){var m=k[c].getAttribute("handler");(l=k[c].getAttribute("media-type"))&&m&&a.f[m]&&(a.R[l]=a.f[m].src)}a.J=Uq(mj(f,"metadata"),Gj(f,"prefix")[0]);a.J[Rq]&&(a.lang=a.J[Rq][0].v);if(!d){if(0<g.length&&a.A)for(d=Pq(a.A),c=0;c<g.length;c++)a.h.A[a.C+g[c]]=d;return J(!0)}f=new ya;k={};if(0<g.length&&a.A)for(l="1040:"+
Cq(a.A),c=0;c<g.length;c++)k[g[c]]=l;for(c=0;c<d.length;c++){var p=d[c];if(m=p.n){var q=decodeURI(m),g=a.l[q];l=null;g&&(g.u=0!=p.m,g.l=p.c,g.f&&(l=g.f.replace(/\s+/g,"")));g=k[q];if(l||g)f.append(m),f.append(" "),f.append(l||"application/octet-stream"),g&&(f.append(" "),f.append(g)),f.append("\n")}}Zq(a);return Se(e,"","POST",f.toString(),"text/plain")}function Zq(a){for(var b=0,c=0;c<a.b.length;c++){var d=a.b[c],e=Math.ceil(d.l/1024);d.g=b;d.b=e;b+=e}a.F=b}
function $q(a,b,c){a.f={};a.l={};a.j=[];a.b=a.j;var d=a.g=new lj(null,"",(new DOMParser).parseFromString("<spine></spine>","text/xml"));b.forEach(function(a){var b=new Nq;b.N=a.index;b.id="item"+(a.index+1);b.src=a.url;b.cb=a.cb;b.Tb=a.Tb;var c=d.b.createElement("itemref");c.setAttribute("idref",b.id);d.root.appendChild(c);b.h=c;this.f[b.id]=b;this.l[a.url]=b;this.j.push(b)},a);return c?Mq(a.h,b[0].url,c):J(null)}
function ar(a,b,c){var d=a.b[b],e=I("getCFI");a.h.load(d.src).then(function(a){var b=rj(a,c),f=null;b&&(a=pj(a,b,0,!1),f=new $a,cb(f,b,c-a),d.h&&cb(f,d.h,0),f=f.toString());M(e,f)});return K(e)}
function br(a,b){return Ld("resolveFragment",function(c){if(b){var d=new $a;ab(d,b);var e;if(a.g){var f=bb(d,a.g.b);if(1!=f.node.nodeType||f.K||!f.zc){M(c,null);return}var g=f.node,h=g.getAttribute("idref");if("itemref"!=g.localName||!h||!a.f[h]){M(c,null);return}e=a.f[h];d=f.zc}else e=a.b[0];a.h.load(e.src).then(function(a){var b=bb(d,a.b);a=pj(a,b.node,b.offset,b.K);M(c,{N:e.N,Ca:a,Y:-1})})}else M(c,null)},function(a,d){v.b(d,"Cannot resolve fragment:",b);M(a,null)})}
function cr(a,b){return Ld("resolveEPage",function(c){if(0>=b)M(c,{N:0,Ca:0,Y:-1});else{var d=Ga(a.b.length,function(c){c=a.b[c];return c.g+c.b>b}),e=a.b[d];a.h.load(e.src).then(function(a){b-=e.g;b>e.b&&(b=e.b);var f=0;0<b&&(a=qj(a),f=Math.round(a*b/e.b),f==a&&f--);M(c,{N:d,Ca:f,Y:-1})})}},function(a,d){v.b(d,"Cannot resolve epage:",b);M(a,null)})}
function dr(a,b){var c=a.b[b.N];if(0>=b.Ca)return J(c.g);var d=I("getEPage");a.h.load(c.src).then(function(a){a=qj(a);M(d,c.g+Math.min(a,b.Ca)*c.b/a)});return K(d)}function er(a,b){return{page:a,position:{N:a.N,Y:b,Ca:a.offset}}}function fr(a,b,c,d,e){this.b=a;this.viewport=b;this.j=c;this.u=e;this.Ub=[];this.l=[];this.$=eb(d);this.h=new dp(b);this.f=new fn(a.u)}function gr(a,b){var c=a.Ub[b.N];return c?c.ib[b.Y]:null}n=fr.prototype;
n.Bb=function(a){return this.b.H?this.b.H:(a=this.Ub[a?a.N:0])?a.bb.ha:null};function hr(a,b,c,d){c.S.style.display="none";c.S.style.visibility="visible";c.S.style.position="";c.S.style.top="";c.S.style.left="";c.S.setAttribute("data-vivliostyle-page-side",c.l);var e=b.ib[d];c.G=!b.item.N&&!d;b.ib[d]=c;e?(b.bb.viewport.f.replaceChild(c.S,e.S),Oa(e,{type:"replaced",target:null,currentTarget:null,Ee:c})):b.bb.viewport.f.appendChild(c.S);a.u(b.bb.sa,b.item.N,d)}
function ir(a,b,c){var d=I("renderSinglePage"),e=jr(a,b,c);pq(b.bb,e,c).then(function(f){var g=(c=f)?c.page-1:b.Oa.length-1;hr(a,b,e,g);kn(a.f,e.N,g);f=null;if(c){var h=b.Oa[c.page];b.Oa[c.page]=c;h&&b.ib[c.page]&&(vk(c,h)||(f=ir(a,b,c)))}f||(f=J(!0));f.then(function(){var b=ln(a.f,e),f=0;ce(function(c){f++;if(f>b.length)N(c);else{var d=b[f-1];d.Vc=d.Vc.filter(function(a){return!a.Ac});d.Vc.length?kr(a,d.N).then(function(b){b?(jn(a.f,d.Ed),mn(a.f,d.Vc),ir(a,b,b.Oa[d.Y]).then(function(b){var d=a.f;
d.b=d.F.pop();d=a.f;d.g=d.H.pop();d=b.vc.position;d.N===e.N&&d.Y===g&&(e=b.vc.page);ee(c)})):ee(c)}):ee(c)}}).then(function(){M(d,{vc:er(e,g),Fe:c})})})});return K(d)}function lr(a,b){var c=a.Y,d=-1;0>c&&(d=a.Ca,c=Ga(b.Oa.length,function(a){return kq(b.bb,b.Oa[a],!0)>d}),c=c===b.Oa.length?b.complete?b.Oa.length-1:Number.POSITIVE_INFINITY:c-1);return{N:a.N,Y:c,Ca:d}}
function mr(a,b,c){var d=I("findPage");kr(a,b.N).then(function(e){if(e){var f=null,g;ce(function(d){var h=lr(b,e);g=h.Y;(f=e.ib[g])?N(d):e.complete?(g=e.Oa.length-1,f=e.ib[g],N(d)):c?nr(a,h).then(function(a){a&&(f=a.page);N(d)}):ae(100).then(function(){ee(d)})}).then(function(){M(d,er(f,g))})}else M(d,null)});return K(d)}
function nr(a,b){var c=I("renderPage");kr(a,b.N).then(function(d){if(d){var e=lr(b,d),f=e.Y,g=e.Ca,h=d.ib[f];h?M(c,er(h,f)):ce(function(b){if(f<d.Oa.length)N(b);else if(d.complete)f=d.Oa.length-1,N(b);else{var c=d.Oa[d.Oa.length-1];ir(a,d,c).then(function(e){var k=e.vc.page;(c=e.Fe)?0<=g&&kq(d.bb,c)>g?(h=k,f=d.Oa.length-2,N(b)):ee(b):(h=k,f=e.vc.position.Y,d.complete=!0,k.A=d.item.N===a.b.b.length-1,N(b))})}}).then(function(){h=h||d.ib[f];var b=d.Oa[f];h?M(c,er(h,f)):ir(a,d,b).then(function(b){b.Fe||
(d.complete=!0,b.vc.page.A=d.item.N===a.b.b.length-1);M(c,b.vc)})})}else M(c,null)});return K(c)}n.Jd=function(){return or(this,{N:this.b.b.length-1,Y:Number.POSITIVE_INFINITY,Ca:-1})};function or(a,b){var c=I("renderAllPages");b||(b={N:0,Y:0,Ca:0});var d=b.N,e=b.Y,f=0,g;ce(function(c){nr(a,{N:f,Y:f===d?e:Number.POSITIVE_INFINITY,Ca:f===d?b.Ca:-1}).then(function(a){g=a;++f>d?N(c):ee(c)})}).then(function(){M(c,g)});return K(c)}n.Pe=function(){return mr(this,{N:0,Y:0,Ca:-1})};
n.Re=function(){return mr(this,{N:this.b.b.length-1,Y:Number.POSITIVE_INFINITY,Ca:-1})};n.nextPage=function(a,b){var c=this,d=a.N,e=a.Y,f=I("nextPage");kr(c,d).then(function(a){if(a){if(a.complete&&e==a.Oa.length-1){if(d>=c.b.b.length-1){M(f,null);return}d++;e=0}else e++;mr(c,{N:d,Y:e,Ca:-1},b).Da(f)}else M(f,null)});return K(f)};n.Hd=function(a){var b=a.N;if(a=a.Y)a--;else{if(!b)return J(null);b--;a=Number.POSITIVE_INFINITY}return mr(this,{N:b,Y:a,Ca:-1})};
function pr(a,b,c){b="left"===b.l;a="ltr"===a.Bb(c);return!b&&a||b&&!a}function qr(a,b,c){var d=I("getCurrentSpread"),e=gr(a,b);if(!e)return J({left:null,right:null});var f="left"===e.l;(pr(a,e,b)?a.Hd(b):a.nextPage(b,c)).then(function(a){a=a&&a.page;f?M(d,{left:e,right:a}):M(d,{left:a,right:e})});return K(d)}n.We=function(a,b){var c=gr(this,a);if(!c)return J(null);var c=pr(this,c,a),d=this.nextPage(a,!!b);if(c)return d;var e=this;return d.xa(function(a){return a?e.nextPage(a.position,!!b):J(null)})};
n.Ze=function(a){var b=gr(this,a);if(!b)return J(null);b=pr(this,b,a);a=this.Hd(a);if(b){var c=this;return a.xa(function(a){return a?c.Hd(a.position):J(null)})}return a};function rr(a,b){var c=I("navigateToEPage");cr(a.b,b).then(function(b){b?mr(a,b).Da(c):M(c,null)});return K(c)}function sr(a,b){var c=I("navigateToCFI");br(a.b,b).then(function(b){b?mr(a,b).Da(c):M(c,null)});return K(c)}
function tr(a,b,c){v.debug("Navigate to",b);var d=Yq(a.b,ha(b));if(!d){if(a.b.g&&b.match(/^#epubcfi\(/))d=Yq(a.b,a.b.g.url);else if("#"===b.charAt(0)){var e=a.b.u.af(b);a.b.g?d=Yq(a.b,e[0]):d=e[0];b=d+(e[1]?"#"+e[1]:"")}if(null==d)return J(null)}var f=a.b.l[d];if(!f)return a.b.g&&d==Yq(a.b,a.b.g.url)&&(d=b.indexOf("#"),0<=d)?sr(a,b.substr(d+1)):J(null);var g=I("navigateTo");kr(a,f.N).then(function(d){var e=tj(d.da,b);e?mr(a,{N:f.N,Y:-1,Ca:oj(d.da,e)}).Da(g):c.N!==f.N?mr(a,{N:f.N,Y:0,Ca:-1}).Da(g):
M(g,null)});return K(g)}
function jr(a,b,c){var d=b.bb.viewport,e=d.b.createElement("div");e.setAttribute("data-vivliostyle-page-container",!0);e.style.position="absolute";e.style.top="0";e.style.left="0";hj||(e.style.visibility="hidden");d.h.appendChild(e);var f=d.b.createElement("div");f.setAttribute("data-vivliostyle-bleed-box",!0);e.appendChild(f);var g=new Mj(e,f);g.N=b.item.N;g.position=c;g.offset=kq(b.bb,c);g.offset||(b=a.b.u.Md("",b.item.src),f.setAttribute("id",b),Pj(g,f,b));d!==a.viewport&&(a=Jf(null,new Pe(hb(a.viewport.width,
a.viewport.height,d.width,d.height),null)),g.u.push(new Jj(e,"transform",a)));return g}function ur(a,b){var c=Vq();if(c){var d=b.ownerDocument,e=d.createElement("span");b.appendChild(e);d=d.importNode(a,!0);e.appendChild(d);d=c.queue;d.Push(["Typeset",c,e]);var c=I("makeMathJaxView"),f=Vd(c);d.Push(function(){f.Za(e)});return K(c)}return J(null)}
n.Ad=function(a){var b=this;return function(c,d){var e;if("object"==c.localName&&"http://www.w3.org/1999/xhtml"==c.namespaceURI){var f=c.getAttribute("data");e=null;if(f){var f=ka(f,a.url),g=c.getAttribute("media-type");if(!g){var h=Yq(b.b,f);h&&(h=b.b.l[h])&&(g=h.f)}if(g&&(h=b.b.R[g])){e=b.viewport.b.createElement("iframe");e.style.border="none";var f=Ca(f),l=Ca(g),g=new ya;g.append(h);g.append("?src=");g.append(f);g.append("&type=");g.append(l);for(h=c.firstChild;h;h=h.nextSibling)1==h.nodeType&&
(l=h,"param"==l.localName&&"http://www.w3.org/1999/xhtml"==l.namespaceURI&&(f=l.getAttribute("name"),l=l.getAttribute("value"),f&&l&&(g.append("&"),g.append(encodeURIComponent(f)),g.append("="),g.append(encodeURIComponent(l)))));e.setAttribute("src",g.toString());(g=c.getAttribute("width"))&&e.setAttribute("width",g);(g=c.getAttribute("height"))&&e.setAttribute("height",g)}}e||(e=b.viewport.b.createElement("span"),e.setAttribute("data-adapt-process-children","true"));e=J(e)}else if("http://www.w3.org/1998/Math/MathML"==
c.namespaceURI)e=ur(c,d);else if("http://example.com/sse"==c.namespaceURI){e=d?d.ownerDocument:b.viewport.b;g=c.localName;switch(g){case "t":case "tab":case "ec":case "nt":case "fraction":case "comment":case "mark":g="span";break;case "ruby":case "rp":case "rt":break;default:g="div"}e=e.createElement(g);e.setAttribute("data-adapt-process-children","true");e=J(e)}else e=c.dataset&&"true"==c.dataset.mathTypeset?ur(c,d):J(null);return e}};
function kr(a,b){if(b>=a.b.b.length)return J(null);var c=a.Ub[b];if(c)return J(c);var d=I("getPageViewItem"),e=a.l[b];if(e){var f=Vd(d);e.push(f);return K(d)}var e=a.l[b]=[],g=a.b.b[b],h=a.b.h;h.load(g.src).then(function(f){g.b||1!=a.b.b.length||(g.b=Math.ceil(qj(f)/2700),a.b.F=g.b);var k=h.f[f.url],l=a.Ad(f),p=a.viewport,q=gq(k,p.width,p.height,p.fontSize);if(q.width!=p.width||q.height!=p.height||q.fontSize!=p.fontSize)p=new fp(p.window,q.fontSize,p.root,q.width,q.height);q=a.Ub[b-1];null!==g.cb?
q=g.cb-1:(q=q?q.bb.ra+q.ib.length:0,null!==g.Tb&&(q+=g.Tb));gn(a.f,q);var x=new hq(k,f,a.b.lang,p,a.h,a.j,l,a.b.G,q,a.b.u,a.f);x.$=a.$;iq(x).then(function(){c={item:g,da:f,bb:x,Oa:[null],ib:[],complete:!1};a.Ub[b]=c;M(d,c);e.forEach(function(a){a.Za(c)})})});return K(d)}function vr(a){return a.Ub.some(function(a){return a&&0<a.ib.length})}
n.Xc=function(){var a=this.b,b=a.M||a.W;if(!b)return J(null);var c=I("showTOC");this.g||(this.g=new Dq(a.h,b.src,a.lang,this.h,this.j,this.$,this,a.G,a.u,this.f));var a=this.viewport,b=Math.min(350,Math.round(.67*a.width)-16),d=a.height-6,e=a.b.createElement("div");a.root.appendChild(e);e.style.position="absolute";e.style.visibility="hidden";e.style.left="3px";e.style.top="3px";e.style.width=b+10+"px";e.style.maxHeight=d+"px";e.style.overflow="scroll";e.style.overflowX="hidden";e.style.background=
"#EEE";e.style.border="1px outset #999";e.style.borderRadius="2px";e.style.boxShadow=" 5px 5px rgba(128,128,128,0.3)";this.g.Xc(e,a,b,d,this.viewport.fontSize).then(function(a){e.style.visibility="visible";M(c,a)});return K(c)};n.Qc=function(){this.g&&this.g.Qc()};n.ce=function(){return this.g&&this.g.ce()};var wr={uf:"singlePage",vf:"spread",jf:"autoSpread"};
function xr(a,b,c,d){var e=this;this.window=a;this.fd=b;b.setAttribute("data-vivliostyle-viewer-viewport",!0);hj&&b.setAttribute("data-vivliostyle-debug",!0);b.setAttribute("data-vivliostyle-viewer-status","loading");this.Ta=c;this.Ja=d;a=a.document;this.ra=new ul(a.head,b);this.A="loading";this.M=[];this.h=null;this.Cb=this.La=!1;this.f=this.j=this.g=this.C=null;this.fontSize=16;this.zoom=1;this.F=!1;this.V="singlePage";this.ha=!1;this.Jd=!0;this.$=db();this.J=function(){};this.u=function(){};this.W=
function(){e.La=!0;e.J()};this.Fd=this.Fd.bind(this);this.G=function(){};this.H=a.getElementById("vivliostyle-page-rules");this.R=!1;this.l=null;this.pa={loadEPUB:this.Me,loadXML:this.Ne,configure:this.Sd,moveTo:this.sa,toc:this.Xc};yr(this)}function yr(a){ga(1,function(a){zr(this,{t:"debug",content:a})}.bind(a));ga(2,function(a){zr(this,{t:"info",content:a})}.bind(a));ga(3,function(a){zr(this,{t:"warn",content:a})}.bind(a));ga(4,function(a){zr(this,{t:"error",content:a})}.bind(a))}
function zr(a,b){b.i=a.Ta;a.Ja(b)}function Ar(a,b){a.A!==b&&(a.A=b,a.fd.setAttribute("data-vivliostyle-viewer-status",b),zr(a,{t:"readystatechange"}))}n=xr.prototype;
n.Me=function(a){Br.f("beforeRender");Ar(this,"loading");var b=a.url,c=a.fragment,d=!!a.zipmeta,e=a.authorStyleSheet,f=a.userStyleSheet;this.viewport=null;var g=I("loadEPUB"),h=this;h.Sd(a).then(function(){var a=new Gq;xq(a,e,f).then(function(){var e=ka(b,h.window.location.href);h.M=[e];Iq(a,e,d).then(function(a){h.h=a;Cr(h,c).then(function(){M(g,!0)})})})});return K(g)};
n.Ne=function(a){Br.f("beforeRender");Ar(this,"loading");var b=a.url,c=a.document,d=a.fragment,e=a.authorStyleSheet,f=a.userStyleSheet;this.viewport=null;var g=I("loadXML"),h=this;h.Sd(a).then(function(){var a=new Gq;xq(a,e,f).then(function(){var e=b.map(function(a,b){return{url:ka(a.url,h.window.location.href),index:b,cb:a.cb,Tb:a.Tb}});h.M=e.map(function(a){return a.url});h.h=new Kq(a,"");$q(h.h,e,c).then(function(){Cr(h,d).then(function(){M(g,!0)})})})});return K(g)};
function Cr(a,b){Dr(a);var c;b?c=br(a.h,b).xa(function(b){a.f=b;return J(!0)}):c=J(!0);return c.xa(function(){Br.b("beforeRender");return Er(a)})}function Fr(a,b){var c=parseFloat(b),d=/[a-z]+$/,e;if("string"===typeof b&&(e=b.match(d))){d=e[0];if("em"===d||"rem"===d)return c*a.fontSize;if("ex"===d||"rex"===d)return c*tb.ex*a.fontSize/tb.em;if(d=tb[d])return c*d}return c}
n.Sd=function(a){"boolean"==typeof a.autoresize&&(a.autoresize?(this.C=null,this.window.addEventListener("resize",this.W,!1),this.La=!0):this.window.removeEventListener("resize",this.W,!1));if("number"==typeof a.fontSize){var b=a.fontSize;5<=b&&72>=b&&this.fontSize!=b&&(this.fontSize=b,this.La=!0)}"object"==typeof a.viewport&&a.viewport&&(b=a.viewport,b={marginLeft:Fr(this,b["margin-left"])||0,marginRight:Fr(this,b["margin-right"])||0,marginTop:Fr(this,b["margin-top"])||0,marginBottom:Fr(this,b["margin-bottom"])||
0,width:Fr(this,b.width)||0,height:Fr(this,b.height)||0},200<=b.width||200<=b.height)&&(this.window.removeEventListener("resize",this.W,!1),this.C=b,this.La=!0);"boolean"==typeof a.hyphenate&&(this.$.vd=a.hyphenate,this.La=!0);"boolean"==typeof a.horizontal&&(this.$.ud=a.horizontal,this.La=!0);"boolean"==typeof a.nightMode&&(this.$.Bd=a.nightMode,this.La=!0);"number"==typeof a.lineHeight&&(this.$.lineHeight=a.lineHeight,this.La=!0);"number"==typeof a.columnWidth&&(this.$.qd=a.columnWidth,this.La=
!0);"string"==typeof a.fontFamily&&(this.$.fontFamily=a.fontFamily,this.La=!0);"boolean"==typeof a.load&&(this.ha=a.load);"boolean"==typeof a.renderAllPages&&(this.Jd=a.renderAllPages);"string"==typeof a.userAgentRootURL&&(ia=a.userAgentRootURL.replace(/resources\/?$/,""),ja=a.userAgentRootURL);"string"==typeof a.rootURL&&(ia=a.rootURL,ja=ia+"resources/");"string"==typeof a.pageViewMode&&a.pageViewMode!==this.V&&(this.V=a.pageViewMode,this.La=!0);"number"==typeof a.pageBorder&&a.pageBorder!==this.$.dc&&
(this.viewport=null,this.$.dc=a.pageBorder,this.La=!0);"number"==typeof a.zoom&&a.zoom!==this.zoom&&(this.zoom=a.zoom,this.Cb=!0);"boolean"==typeof a.fitToScreen&&a.fitToScreen!==this.F&&(this.F=a.fitToScreen,this.Cb=!0);Gr(this,a);return J(!0)};function Gr(a,b){(Ed.CONFIGURATION||[]).forEach(function(a){a=a(b);this.La=a.La||this.La;this.Cb=a.Cb||this.Cb}.bind(a))}n.Fd=function(a){var b=this.g,c=this.j,d=a.target;c?c.left!==d&&c.right!==d||Hr(this,a.Ee):b===a.target&&Hr(this,a.Ee)};
function Ir(a,b){var c=[];a.g&&c.push(a.g);a.j&&(c.push(a.j.left),c.push(a.j.right));c.forEach(function(a){a&&b(a)})}function Jr(a){Ir(a,function(a){a.removeEventListener("hyperlink",this.G,!1);a.removeEventListener("replaced",this.Fd,!1)}.bind(a))}function Kr(a){Jr(a);Ir(a,function(a){w(a.S,"display","none")});a.g=null;a.j=null}function Lr(a,b){b.addEventListener("hyperlink",a.G,!1);b.addEventListener("replaced",a.Fd,!1);w(b.S,"visibility","visible");w(b.S,"display","block")}
function Mr(a,b){Kr(a);a.g=b;Lr(a,b)}function Nr(a){var b=I("reportPosition");ar(a.h,a.f.N,a.f.Ca).then(function(c){var d=a.g;(a.ha&&0<d.j.length?he(d.j):J(!0)).then(function(){Or(a,d,c).Da(b)})});return K(b)}function Pr(a){var b=a.fd;if(a.C){var c=a.C;b.style.marginLeft=c.marginLeft+"px";b.style.marginRight=c.marginRight+"px";b.style.marginTop=c.marginTop+"px";b.style.marginBottom=c.marginBottom+"px";return new fp(a.window,a.fontSize,b,c.width,c.height)}return new fp(a.window,a.fontSize,b)}
function Qr(a){var b=Pr(a),c;a:switch(a.V){case "singlePage":c=!1;break a;case "spread":c=!0;break a;default:c=1.45<=b.width/b.height&&800<b.width}var d=a.$.kb!==c;a.$.kb=c;a.fd.setAttribute("data-vivliostyle-spread-view",c);if(a.C||!a.viewport||a.viewport.fontSize!=a.fontSize)return!1;if(!d&&b.width==a.viewport.width&&b.height==a.viewport.height)return!0;if(d=a.b&&vr(a.b)){a:{d=a.b.Ub;for(c=0;c<d.length;c++){var e=d[c];if(e)for(var e=e.ib,f=0;f<e.length;f++){var g=e[f];if(g.F&&g.C){d=!0;break a}}}d=
!1}d=!d}return d?(a.viewport.width=b.width,a.viewport.height=b.height,a.Cb=!0):!1}n.bf=function(a,b,c){if(!this.R&&this.H&&!b&&!c){var d="";Object.keys(a).forEach(function(b){d+="@page "+b+"{size:";b=a[b];d+=b.width+"px "+b.height+"px;}"});this.H.textContent=d;this.R=!0}};
function Rr(a){if(a.b){a.b.Qc();for(var b=a.b,c=b.Ub,d=0;d<c.length;d++){var e=c[d];e&&e.ib.splice(0)}for(b=b.viewport.root;b.lastChild;)b.removeChild(b.lastChild)}a.H&&(a.H.textContent="",a.R=!1);a.viewport=Pr(a);b=a.viewport;w(b.g,"width","");w(b.g,"height","");w(b.f,"width","");w(b.f,"height","");w(b.f,"transform","");a.b=new fr(a.h,a.viewport,a.ra,a.$,a.bf.bind(a))}
function Hr(a,b,c){a.Cb=!1;Jr(a);if(a.$.kb)return qr(a.b,a.f,c).xa(function(c){Kr(a);a.j=c;c.left&&(Lr(a,c.left),c.right||c.left.S.setAttribute("data-vivliostyle-unpaired-page",!0));c.right&&(Lr(a,c.right),c.left||c.right.S.setAttribute("data-vivliostyle-unpaired-page",!0));c=Sr(a,c);a.viewport.zoom(c.width,c.height,a.F?Tr(a,c):a.zoom);a.g=b;return J(null)});Mr(a,b);a.viewport.zoom(b.f.width,b.f.height,a.F?Tr(a,b.f):a.zoom);a.g=b;return J(null)}
function Sr(a,b){var c=0,d=0;b.left&&(c+=b.left.f.width,d=b.left.f.height);b.right&&(c+=b.right.f.width,d=Math.max(d,b.right.f.height));b.left&&b.right&&(c+=2*a.$.dc);return{width:c,height:d}}var Ur={pf:"fit inside viewport"};function Tr(a,b){return Math.min(a.viewport.width/b.width,a.viewport.height/b.height)}function Vr(){this.name="RenderingCanceledError";this.message="Page rendering has been canceled";this.stack=Error().stack}u(Vr,Error);
function Dr(a){if(a.l){var b=a.l;Md(b,new Vr);if(b!==Gd&&b.b){b.b.h=!0;var c=new Wd(b);b.u="interrupt";b.b=c;b.f.Za(c)}}a.l=null}
function Er(a){a.La=!1;a.Cb=!1;if(Qr(a))return J(!0);Ar(a,"loading");Dr(a);var b=Od(Gd.f,function(){return Ld("resize",function(c){a.l=b;Br.f("render (resize)");Rr(a);a.f&&(a.f.Y=-1);or(a.b,a.f).then(function(d){a.f=d.position;Hr(a,d.page,!0).then(function(){Nr(a).then(function(d){Ar(a,"interactive");(a.Jd?a.b.Jd():J(null)).then(function(){a.l===b&&(a.l=null);Br.b("render (resize)");Ar(a,"complete");zr(a,{t:"loaded"});M(c,d)})})})})},function(a,b){if(b instanceof Vr)Br.b("render (resize)"),v.debug(b.message);
else throw b;})});return J(!0)}function Or(a,b,c){var d=I("sendLocationNotification"),e={t:"nav",first:b.G,last:b.A};dr(a.h,a.f).then(function(b){e.epage=b;e.epageCount=a.h.F;c&&(e.cfi=c);zr(a,e);M(d,!0)});return K(d)}xr.prototype.Bb=function(){return this.b?this.b.Bb(this.f):null};
xr.prototype.sa=function(a){var b=this;"complete"!==this.A&&Ar(this,"loading");if("string"==typeof a.where){switch(a.where){case "next":a=this.$.kb?this.b.We:this.b.nextPage;break;case "previous":a=this.$.kb?this.b.Ze:this.b.Hd;break;case "last":a=this.b.Re;break;case "first":a=this.b.Pe;break;default:return J(!0)}if(a){var c=a;a=function(){return c.call(b.b,b.f)}}}else if("number"==typeof a.epage){var d=a.epage;a=function(){return rr(b.b,d)}}else if("string"==typeof a.url){var e=a.url;a=function(){return tr(b.b,
e,b.f)}}else return J(!0);var f=I("moveTo");a.call(b.b).then(function(a){var c;if(a){b.f=a.position;var d=I("moveTo.showCurrent");c=K(d);Hr(b,a.page).then(function(){Nr(b).Da(d)})}else c=J(!0);c.then(function(a){"loading"===b.A&&Ar(b,"interactive");M(f,a)})});return K(f)};
xr.prototype.Xc=function(a){var b=!!a.autohide;a=a.v;var c=this.b.ce();if(c){if("show"==a)return J(!0)}else if("hide"==a)return J(!0);if(c)return this.b.Qc(),J(!0);var d=this,e=I("showTOC");this.b.Xc(b).then(function(a){if(a){if(b){var c=function(){d.b.Qc()};a.addEventListener("hyperlink",c,!1);a.S.addEventListener("click",c,!1)}a.addEventListener("hyperlink",d.G,!1)}M(e,!0)});return K(e)};
function Wr(a,b){var c=b.a||"";return Ld("runCommand",function(d){var e=a.pa[c];e?e.call(a,b).then(function(){zr(a,{t:"done",a:c});M(d,!0)}):(v.error("No such action:",c),M(d,!0))},function(a,b){v.error(b,"Error during action:",c);M(a,!0)})}function Xr(a){return"string"==typeof a?JSON.parse(a):a}
function Yr(a,b){var c=Xr(b),d=null;Nd(function(){var b=I("commandLoop"),f=Gd.f;a.G=function(b){var c="#"===b.href.charAt(0)||a.M.some(function(a){return b.href.substr(0,a.length)==a});if(c){b.preventDefault();var d={t:"hyperlink",href:b.href,internal:c};Od(f,function(){zr(a,d);return J(!0)})}};ce(function(b){if(a.La)Er(a).then(function(){ee(b)});else if(a.Cb)a.g&&Hr(a,a.g).then(function(){ee(b)});else if(c){var e=c;c=null;Wr(a,e).then(function(){ee(b)})}else e=I("waitForCommand"),d=Vd(e,self),K(e).then(function(){ee(b)})}).Da(b);
return K(b)});a.J=function(){var a=d;a&&(d=null,a.Za())};a.u=function(b){if(c)return!1;c=Xr(b);a.J();return!0};a.window.adapt_command=a.u};function Yo(a,b,c){if(a==b)return a?[[0,a]]:[];if(0>c||a.length<c)c=null;var d=Zr(a,b),e=a.substring(0,d);a=a.substring(d);b=b.substring(d);var d=$r(a,b),f=a.substring(a.length-d);a=a.substring(0,a.length-d);b=b.substring(0,b.length-d);a=as(a,b);e&&a.unshift([0,e]);f&&a.push([0,f]);bs(a);null!=c&&(a=cs(a,c));return a}
function as(a,b){var c;if(!a)return[[1,b]];if(!b)return[[-1,a]];c=a.length>b.length?a:b;var d=a.length>b.length?b:a,e=c.indexOf(d);if(-1!=e)return c=[[1,c.substring(0,e)],[0,d],[1,c.substring(e+d.length)]],a.length>b.length&&(c[0][0]=c[2][0]=-1),c;if(1==d.length)return[[-1,a],[1,b]];var f=ds(a,b);if(f)return d=f[1],e=f[3],c=f[4],f=Yo(f[0],f[2]),d=Yo(d,e),f.concat([[0,c]],d);a:{c=a.length;for(var d=b.length,e=Math.ceil((c+d)/2),f=2*e,g=Array(f),h=Array(f),l=0;l<f;l++)g[l]=-1,h[l]=-1;g[e+1]=0;h[e+1]=
0;for(var l=c-d,k=!!(l%2),m=0,p=0,q=0,x=0,r=0;r<e;r++){for(var t=-r+m;t<=r-p;t+=2){var A=e+t,H;H=t==-r||t!=r&&g[A-1]<g[A+1]?g[A+1]:g[A-1]+1;for(var G=H-t;H<c&&G<d&&a.charAt(H)==b.charAt(G);)H++,G++;g[A]=H;if(H>c)p+=2;else if(G>d)m+=2;else if(k&&(A=e+l-t,0<=A&&A<f&&-1!=h[A])){var W=c-h[A];if(H>=W){c=es(a,b,H,G);break a}}}for(t=-r+q;t<=r-x;t+=2){A=e+t;W=t==-r||t!=r&&h[A-1]<h[A+1]?h[A+1]:h[A-1]+1;for(H=W-t;W<c&&H<d&&a.charAt(c-W-1)==b.charAt(d-H-1);)W++,H++;h[A]=W;if(W>c)x+=2;else if(H>d)q+=2;else if(!k&&
(A=e+l-t,0<=A&&A<f&&-1!=g[A]&&(H=g[A],G=e+H-A,W=c-W,H>=W))){c=es(a,b,H,G);break a}}}c=[[-1,a],[1,b]]}return c}function es(a,b,c,d){var e=a.substring(c),f=b.substring(d);a=Yo(a.substring(0,c),b.substring(0,d));e=Yo(e,f);return a.concat(e)}function Zr(a,b){if(!a||!b||a.charAt(0)!=b.charAt(0))return 0;for(var c=0,d=Math.min(a.length,b.length),e=d,f=0;c<e;)a.substring(f,e)==b.substring(f,e)?f=c=e:d=e,e=Math.floor((d-c)/2+c);return e}
function $r(a,b){if(!a||!b||a.charAt(a.length-1)!=b.charAt(b.length-1))return 0;for(var c=0,d=Math.min(a.length,b.length),e=d,f=0;c<e;)a.substring(a.length-e,a.length-f)==b.substring(b.length-e,b.length-f)?f=c=e:d=e,e=Math.floor((d-c)/2+c);return e}
function ds(a,b){function c(a,b,c){for(var d=a.substring(c,c+Math.floor(a.length/4)),e=-1,f="",g,h,k,l;-1!=(e=b.indexOf(d,e+1));){var m=Zr(a.substring(c),b.substring(e)),W=$r(a.substring(0,c),b.substring(0,e));f.length<W+m&&(f=b.substring(e-W,e)+b.substring(e,e+m),g=a.substring(0,c-W),h=a.substring(c+m),k=b.substring(0,e-W),l=b.substring(e+m))}return 2*f.length>=a.length?[g,h,k,l,f]:null}var d=a.length>b.length?a:b,e=a.length>b.length?b:a;if(4>d.length||2*e.length<d.length)return null;var f=c(d,e,
Math.ceil(d.length/4)),d=c(d,e,Math.ceil(d.length/2)),g;if(f||d)d?g=f?f[4].length>d[4].length?f:d:d:g=f;else return null;var h;a.length>b.length?(f=g[0],d=g[1],e=g[2],h=g[3]):(e=g[0],h=g[1],f=g[2],d=g[3]);return[f,d,e,h,g[4]]}
function bs(a){a.push([0,""]);for(var b=0,c=0,d=0,e="",f="",g;b<a.length;)switch(a[b][0]){case 1:d++;f+=a[b][1];b++;break;case -1:c++;e+=a[b][1];b++;break;case 0:if(1<c+d){if(c&&d){if(g=Zr(f,e))0<b-c-d&&0==a[b-c-d-1][0]?a[b-c-d-1][1]+=f.substring(0,g):(a.splice(0,0,[0,f.substring(0,g)]),b++),f=f.substring(g),e=e.substring(g);if(g=$r(f,e))a[b][1]=f.substring(f.length-g)+a[b][1],f=f.substring(0,f.length-g),e=e.substring(0,e.length-g)}c?d?a.splice(b-c-d,c+d,[-1,e],[1,f]):a.splice(b-c,c+d,[-1,e]):a.splice(b-
d,c+d,[1,f]);b=b-c-d+(c?1:0)+(d?1:0)+1}else b&&0==a[b-1][0]?(a[b-1][1]+=a[b][1],a.splice(b,1)):b++;c=d=0;f=e=""}""===a[a.length-1][1]&&a.pop();c=!1;for(b=1;b<a.length-1;)0==a[b-1][0]&&0==a[b+1][0]&&(a[b][1].substring(a[b][1].length-a[b-1][1].length)==a[b-1][1]?(a[b][1]=a[b-1][1]+a[b][1].substring(0,a[b][1].length-a[b-1][1].length),a[b+1][1]=a[b-1][1]+a[b+1][1],a.splice(b-1,1),c=!0):a[b][1].substring(0,a[b+1][1].length)==a[b+1][1]&&(a[b-1][1]+=a[b+1][1],a[b][1]=a[b][1].substring(a[b+1][1].length)+
a[b+1][1],a.splice(b+1,1),c=!0)),b++;c&&bs(a)}Yo.f=1;Yo.b=-1;Yo.g=0;
function cs(a,b){var c;a:{var d=a;if(0===b)c=[0,d];else{var e=0;for(c=0;c<d.length;c++){var f=d[c];if(-1===f[0]||0===f[0]){var g=e+f[1].length;if(b===g){c=[c+1,d];break a}if(b<g){d=d.slice();g=b-e;e=[f[0],f[1].slice(0,g)];f=[f[0],f[1].slice(g)];d.splice(c,1,e,f);c=[c+1,d];break a}e=g}}throw Error("cursor_pos is out of bounds!");}}d=c[1];c=c[0];e=d[c];f=d[c+1];return null==e||0!==e[0]?a:null!=f&&e[1]+f[1]===f[1]+e[1]?(d.splice(c,2,f,e),fs(d,c,2)):null!=f&&0===f[1].indexOf(e[1])?(d.splice(c,2,[f[0],
e[1]],[0,e[1]]),e=f[1].slice(e[1].length),0<e.length&&d.splice(c+2,0,[f[0],e]),fs(d,c,3)):a}function fs(a,b,c){for(c=b+c-1;0<=c&&c>=b-1;c--)if(c+1<a.length){var d=a[c],e=a[c+1];d[0]===e[1]&&a.splice(c,2,[d[0],d[1]+e[1]])}return a};function Xo(a){return a.reduce(function(a,c){return c[0]===Yo.b?a:a+c[1]},"")}function lk(a,b,c){var d=0,e=0;a.some(function(a){for(var f=0;f<a[1].length;f++){switch(a[0]*c){case Yo.f:d++;break;case Yo.b:d--;e++;break;case Yo.g:e++}if(e>b)return!0}return!1});return Math.max(Math.min(b,e-1)+d,0)};function gs(){}gs.prototype.ve=function(a){return{B:a,Kc:!1,xb:!1}};gs.prototype.He=function(){};gs.prototype.he=function(){};gs.prototype.mc=function(){};function hs(a,b){this.b=a;this.f=b}
function is(a,b){var c=a.b,d=c.ve(b),e=I("LayoutIterator");ce(function(a){for(var b;d.B;){b=d.B.D?1!==d.B.D.nodeType?Tj(d.B.D,d.B.Kb)?void 0:d.B.K?void 0:c.He(d):d.B.Ba?void 0:d.B.K?c.mc(d):c.he(d):void 0;b=(b&&b.ua()?b:J(!0)).xa(function(){return d.xb?J(null):Wl(this.f,d.B,d.Kc)}.bind(this));if(b.ua()){b.then(function(b){d.xb?N(a):(d.B=b,ee(a))});return}if(d.xb){N(a);return}d.B=b.get()}N(a)}.bind(a)).then(function(){M(e,d.B)});return K(e)}function js(a){this.Sc=a}u(js,gs);n=js.prototype;n.Ie=function(){};
n.pe=function(){};n.ve=function(a){return{B:a,Kc:!!this.Sc&&a.K,xb:!1,Sc:this.Sc,oc:null,Cd:!1,Ae:[],ze:null}};n.He=function(a){a.Cd=!1};n.he=function(a){a.Ae.push(ek(a.B));a.oc=Rk(a.oc,a.B.g);a.Cd=!0;return this.Ie(a)};n.mc=function(a){var b;a.Cd?(b=(b=void 0,J(!0)),b=b.xa(function(){a.xb||(a.Ae=[],a.Sc=!1,a.Kc=!1,a.oc=null);return J(!0)})):b=(b=this.pe(a))&&b.ua()?b:J(!0);return b.xa(function(){a.xb||(a.Cd=!1,a.ze=ek(a.B),a.oc=Rk(a.oc,a.B.F));return J(!0)})};
function ks(a,b,c){this.ge=[];this.b=Object.create(a);this.b.element=b;this.b.b=a.b.clone();this.b.j=!1;this.b.Ud=c.L;a=Hm(this.b,c);this.b.G-=a;var d=this;this.b.Xd=function(a){return Pl.prototype.Xd.call(this,a).xa(function(a){var b=ek(a);d.ge.push(b);return J(a)})}}ks.prototype.Ab=function(a){var b=this.b.Ab();if(a){a=b.Mc?b.Mc.b():Number.MAX_VALUE;var c=this.ge[0],c=new Jl(ek(c),null,c.b,0),d=c.f(this.b,a);if(d&&c.b()<a)return{Mc:c,B:d}}return b};
function ls(a){this.w=a;this.b=this.f=null;this.A=[];this.u=[];this.C=this.F=0;this.g=this.h=!1;this.l=this.j=!0}function ms(a,b,c){b=Rj(c,b);return a.w?b.width:b.height}function ns(a){a.h=a.g=!1;a.A=[];a.u=[];a.j=!0;a.l=!0}function Kl(a){return(a.g?0:a.C)-(a.h?a.F:0)}function os(a){a.A.forEach(function(a){a.parentNode.removeChild(a)});a.A=[]}function ps(a){a.u.forEach(function(a){a.parentNode.removeChild(a)});a.u=[]};function qs(a,b){this.g(a,"end",b)}function rs(a,b){this.g(a,"start",b)}function ss(a,b,c){c||(c=this.j.now());var d=this.h[a];d||(d=this.h[a]=[]);var e;for(a=d.length-1;0<=a&&(!(e=d[a])||e[b]);a--)e=null;e||(e={},d.push(e));e[b]=c}function ts(){}function us(a){this.j=a;this.h={};this.registerEndTiming=this.b=this.registerStartTiming=this.f=this.g=ts}
us.prototype.l=function(){var a=this.h,b="";Object.keys(a).forEach(function(c){for(var d=a[c],e=d.length,f=0;f<e;f++){var g=d[f];b+=c;1<e&&(b+="("+f+")");b+=" => start: "+g.start+", end: "+g.end+", duration: "+(g.end-g.start)+"\n"}});v.g(b)};us.prototype.u=function(){this.registerEndTiming=this.b=this.registerStartTiming=this.f=this.g=ts};us.prototype.A=function(){this.g=ss;this.registerStartTiming=this.f=rs;this.registerEndTiming=this.b=qs};
var vs={now:Date.now},Br,ws=Br=new us(window&&window.performance||vs);ss.call(ws,"load_vivliostyle","start",void 0);ba("vivliostyle.profile.profiler",ws);us.prototype.printTimings=us.prototype.l;us.prototype.disable=us.prototype.u;us.prototype.enable=us.prototype.A;function xs(a,b){this.rowIndex=a;this.U=b;this.b=[]}function ys(a){return Math.min.apply(null,a.b.map(function(a){return a.height}))}function zs(a,b,c){this.rowIndex=a;this.h=b;this.g=c;this.b=c.colSpan||1;this.rowSpan=c.rowSpan||1;this.height=0;this.f=null}function As(a,b,c){this.rowIndex=a;this.b=b;this.qc=c}function Bs(a,b,c){this.g=a;this.b=c;this.Uc=new ks(a,b,c);this.f=!1}Bs.prototype.Ab=function(){return this.Uc.Ab(!0)};function Cs(a,b){this.D=a;this.b=b}
function Ds(a,b,c,d){Jl.call(this,a,b,c,d);this.L=a.L;this.rowIndex=this.j=null}u(Ds,Jl);Ds.prototype.f=function(a,b){var c=Jl.prototype.f.call(this,a,b);return b<this.b()?null:Es(this).every(function(a){return!!a.B})?c:null};Ds.prototype.b=function(){var a=Jl.prototype.b.call(this);Es(this).forEach(function(b){a+=b.Mc.b()});return a};function Es(a){a.j||(a.j=Fs(a).map(function(a){return a.Ab()}));return a.j}
function Fs(a){return Gs(a.L,null!=a.rowIndex?a.rowIndex:a.rowIndex=Hs(a.L,a.position.U)).map(a.L.Zd,a.L)}function Is(a,b,c){this.rowIndex=a;this.j=b;this.L=c;this.h=null}u(Is,Fl);Is.prototype.f=function(a,b){if(b<this.b())return null;var c=Js(this),d=Ks(this);return d.every(function(a){return!!a.B})&&d.some(function(a,b){var d=a.B,e=c[b].Uc.ge[0];return!(e.D===d.D&&e.K===d.K&&e.ea===d.ea)})?this.j:null};
Is.prototype.b=function(){var a=this.L,b=0;Ls(a,a.f[this.rowIndex])||(b+=10);Ks(this).forEach(function(a){b+=a.Mc.b()});return b};function Ks(a){a.h||(a.h=Js(a).map(function(a){return a.Ab()}));return a.h}Is.prototype.g=function(){return Gl(this.j)};function Js(a){return Ms(a.L,a.rowIndex).map(a.L.Zd,a.L)}function Ns(a,b){this.parent=a;this.j=b;this.w=this.G=!1;this.u=-1;this.J=0;this.C=[];this.F=this.l=null;this.M=0;this.f=[];this.H=[];this.h=[];this.A=null;this.b=[];this.g=null}n=Ns.prototype;
n.le=function(){return"Table formatting context (vivliostyle.table.TableFormattingContext)"};n.xe=function(a,b){if(!b)return b;switch(a.display){case "table-row":return!this.b.length;case "table-cell":return!this.b.some(function(b){return b.Rd.ka[0].node===a.U});default:return b}};n.me=function(){return this.parent};function Os(a,b){do if(b.U===a.j)return b.D;while(b=b.parent);return null}function Ps(a,b){var c=a.H[b];c||(c=a.H[b]=[]);return c}
function Hs(a,b){return a.f.findIndex(function(a){return b===a.U})}function Qs(a,b,c,d){var e=a.h[b];e||(e=a.h[b]=[]);e[c]=d}function Ms(a,b){return Ps(a,b).reduce(function(a,b){return b.qc!==a[a.length-1]?a.concat(b.qc):a},[])}function Gs(a,b){return Ms(a,b).filter(function(a){return a.rowIndex+a.rowSpan-1>b})}n.Zd=function(a){return this.h[a.rowIndex][a.h]};function Ls(a,b){return ys(b)>a.J/2}
function Rs(a){0>a.u&&(a.u=Math.max.apply(null,a.f.map(function(a){return a.b.reduce(function(a,b){return a+b.b},0)})));return a.u}function Ss(a,b){a.f.forEach(function(a){a.b.forEach(function(a){var c=Rj(b,a.g);a.g=null;a.height=this.w?c.width:c.height},this)},a)}n.Zb=function(){return this.g};function Ts(a,b){this.L=a;this.h=b;this.rowIndex=-1;this.f=0;this.g=!1}u(Ts,gs);
Ts.prototype.he=function(a){var b=this.L;a=a.B;switch(a.display){case "table":b.M=a.R;break;case "table-caption":b.C.push(new Cs(a.D,a.M));break;case "table-header-group":this.b=!0;b=b.g;b.f||(b.f=a.D);break;case "table-footer-group":this.b=!0;b=b.g;b.b||(b.b=a.D);break;case "table-row":this.b||(this.g=!0,this.rowIndex++,this.f=0,b.f[this.rowIndex]=new xs(this.rowIndex,a.U))}return J(!0)};
Ts.prototype.mc=function(a){var b=this.L,c=a.B,d=c.display,e=this.h.f;if(c.U===b.j)c=em(e,Os(b,c)),b.J=parseFloat(c[b.w?"height":"width"]),a.xb=!0;else switch(d){case "table-header-group":case "table-footer-group":this.b=!1;break;case "table-row":this.b||(b.A=c.D,this.g=!1);break;case "table-cell":if(!this.b){this.g||(this.rowIndex++,this.f=0,this.g=!0);a=this.rowIndex;c=new zs(this.rowIndex,this.f,c.D);d=b.f[a];d||(b.f[a]=new xs(a,null),d=b.f[a]);d.b.push(c);for(var d=a+c.rowSpan,e=Ps(b,a),f=0;e[f];)f++;
for(;a<d;a++)for(var e=Ps(b,a),g=f;g<f+c.b;g++){var h=e[g]=new As(a,g,c);c.f||(c.f=h)}this.f++}}};function Us(a,b){this.Sc=!0;this.L=a;this.f=b;this.l=!1;this.b=-1;this.g=0;this.u=b.j;b.j=!1}u(Us,js);var Vs={"table-caption":!0,"table-column-group":!0,"table-column":!0,"table-header-group":!0,"table-footer-group":!0};function Ws(a,b){for(var c=a.L.F,d=0,e=0;e<b.b;e++)d+=c[b.f.b+e];return d+=a.L.M*(b.b-1)}
function Xs(a,b,c,d){var e=b.rowIndex,f=b.h,g=c.D,h=c.H;1<b.b&&(w(g,"box-sizing","border-box"),w(g,a.L.w?"height":"width",Ws(a,b)+"px"));b=g.ownerDocument.createElement("div");g.appendChild(b);c=new Bs(a.f,b,c);Qs(a.L,e,f,c);1===d.Pa.ka.length&&d.Pa.K&&(c.f=!0);return om(c.Uc.b,d,!0).xa(function(){"baseline"!==h&&"top"!==h&&w(g,"vertical-align","top");return J(!0)})}function Ys(a,b){var c=a.L.b[0];return c?c.qc.f.b===b:!1}
function Zs(a){var b=a.L.b;if(!b.length)return[];var c=[],d=0;do{var e=b[d],f=e.qc.rowIndex;if(f<a.b){var g=c[f];g||(g=c[f]=[]);g.push(e);b.splice(d,1)}else d++}while(d<b.length);return c}
function $s(a,b){var c=a.L,d=Zs(a),e=d.reduce(function(a){return a+1},0);if(0===e)return J(!0);var f=a.f.b,g=b.B;g.D.parentNode.removeChild(g.D);var h=I("layoutRowSpanningCellsFromPreviousFragment"),l=J(!0),k=0,m=[];d.forEach(function(a){l=l.xa(function(){var b=ck(a[0].Rd.ka[1],g.parent);return Rl(f,b,!1).xa(function(){function d(a){for(;h<a;){if(!(0<=m.indexOf(h))){var c=b.D.ownerDocument.createElement("td");w(c,"padding","0");b.D.appendChild(c)}h++}}var g=J(!0),h=0;a.forEach(function(a){g=g.xa(function(){var c=
a.qc;d(c.f.b);var g=a.Rd,l=ck(g.ka[0],b);l.ea=g.ea;l.K=g.K;return Rl(f,l,!1).xa(function(){for(var b=a.oe,d=0;d<c.b;d++)m.push(h+d);h+=c.b;return Xs(this,c,l,b).xa(function(){l.D.rowSpan=c.rowIndex+c.rowSpan-this.b+e-k;return J(!0)}.bind(this))}.bind(this))}.bind(this))},this);return g.xa(function(){d(Rs(c));k++;return J(!0)})}.bind(this))}.bind(this))},a);l.then(function(){Rl(f,g,!0,b.Kc).then(function(){M(h,!0)})});return K(h)}
function at(a,b){if(a.j||a.h)return J(!0);var c=b.B,d=a.L;0>a.b?a.b=Hs(d,c.U):a.b++;a.g=0;a.l=!0;return $s(a,b).xa(function(){Nm(this.f,b.ze,null,b.oc)&&!Gs(d,this.b-1).length&&(this.f.j=this.u,c.b=!0,b.xb=!0);return J(!0)}.bind(a))}
function bt(a,b){if(a.j||a.h)return J(!0);var c=b.B;a.l||(0>a.b?a.b=0:a.b++,a.g=0,a.l=!0);var d=a.L.f[a.b].b[a.g],e=ek(c).modify();e.K=!0;b.B=e;var f=I("startTableCell");Ys(a,d.f.b)?(e=a.L.b.shift(),e=J(e.oe)):e=Wl(a.f.b,c,b.Kc).xa(function(a){a.D&&c.D.removeChild(a.D);return J(new pk(ak(a)))});e.then(function(a){Xs(this,d,c,a).then(function(){this.mc(b);this.g++;M(f,!0)}.bind(this))}.bind(a));return K(f)}
Us.prototype.Ie=function(a){var b=a.B.display;return"table-header-group"===b?(this.j=!0,J(!0)):"table-footer-group"===b?(this.h=!0,J(!0)):"table-row"===b?at(this,a):"table-cell"===b?bt(this,a):J(!0)};Us.prototype.pe=function(a){a=a.B;"table-row"===a.display&&(this.l=!1,this.j||this.h||(a=ek(a).modify(),a.K=!1,this.f.F.push(new Is(this.b,a,this.L))));return J(!0)};
Us.prototype.mc=function(a){var b=a.B,c=b.display;"table-header-group"===c?this.j=!1:"table-footer-group"===c&&(this.h=!1);if(c&&Vs[c])b.D.parentNode.removeChild(b.D);else if(b.U===this.L.j)this.f.j=this.u,a.xb=!0;else return js.prototype.mc.call(this,a);return J(!0)};function ct(){}
function dt(a,b,c,d){for(var e=a.ownerDocument,f=e.createElement("tr"),g=[],h=0;h<b;h++){var l=e.createElement("td");f.appendChild(l);g.push(l)}a.parentNode.insertBefore(f,a.nextSibling);b=g.map(function(a){a=Rj(d,a);return c?a.height:a.width});a.parentNode.removeChild(f);return b}function et(a){var b=[];for(a=a.firstElementChild;a;)"colgroup"===a.localName&&b.push(a),a=a.nextElementSibling;return b}
function ft(a){var b=[];a.forEach(function(a){var c=a.span;a.removeAttribute("span");for(var e=a.firstElementChild;e;){if("col"===e.localName){var f=e.span;e.removeAttribute("span");for(c-=f;1<f--;){var g=e.cloneNode(!0);a.insertBefore(g,e);b.push(g)}b.push(e)}e=e.nextElementSibling}for(;0<c--;)e=a.ownerDocument.createElement("col"),a.appendChild(e),b.push(e)});return b}
function gt(a,b,c,d){if(a.length<c){var e=d.ownerDocument.createElement("colgroup");b.push(e);for(b=a.length;b<c;b++){var f=d.ownerDocument.createElement("col");e.appendChild(f);a.push(f)}}}function ht(a,b,c){var d=a.w,e=a.A;if(e){a.A=null;var f=e.ownerDocument.createDocumentFragment(),g=Rs(a);if(0<g){var h=a.F=dt(e,g,d,c.f);c=et(b);e=ft(c);gt(e,c,g,b);e.forEach(function(a,b){w(a,d?"height":"width",h[b]+"px")});c.forEach(function(a){f.appendChild(a.cloneNode(!0))})}a.l=f}}
function it(a,b,c){var d=b.L;d.w=b.w;d.g=new ls(d.w);var e=I("TableLayoutProcessor.doInitialLayout");is(new hs(new Ts(b.L,c),c.b),b).then(function(a){var b=a.D,f=Rj(c.f,b);Ll(c,c.w?f.left:f.bottom)?(ht(d,b,c),Ss(d,c.f),a=d.g,b=c.f,a.f&&(a.F=ms(a,a.f,b)),a.b&&(a.C=ms(a,a.b,b)),M(e,null)):M(e,a)}.bind(a));return K(e)}function jt(a,b,c){var d=a.C;d.forEach(function(a,f){a&&(b.insertBefore(a.D,c),"top"===a.b&&(d[f]=null))})}
function kt(a,b){if(a.l&&b){var c=et(b);c&&c.forEach(function(a){b.removeChild(a)})}}ct.prototype.f=function(a,b){var c=a.L,d=I("TableLayoutProcessor.layout"),e=lt(a,c),f=ek(a),g=[].concat(c.b),h=[].concat(b.F);e.g(this,a,b).then(function(l){var k=e.f(l,c,b);e.b(l,c,k);if(k)M(d,l);else{for(l=f.D||f.parent.D;k=l.lastChild;)l.removeChild(k);for(;k=l.nextSibling;)k.parentNode.removeChild(k);kt(c,Os(c,f));b.F=h;c.h=[];c.b=g;this.f(a,b).Da(d)}}.bind(this));return K(d)};
ct.prototype.g=function(a,b,c,d){return new Ds(a,b,c,d)};
ct.prototype.b=function(a,b){var c=b.L,d=c.g;d.j||b.U===c.j&&b.K||ps(d);if("table-row"===b.display){var e=Hs(c,b.U);c.b=[];var f;f=b.K?Gs(c,e):Ms(c,e);if(f.length){var g=I("TableLayoutProcessor.finishBreak"),h=0;ce(function(a){if(h===f.length)N(a);else{var b=f[h++],d=c.Zd(b),g=d.Ab().B,l=d.b,x=kk(l),r=new pk(kk(g));c.b.push({Rd:x,oe:r,qc:b});var t=l.D;Vm(d.b);e<b.rowIndex+b.rowSpan-1&&(t.rowSpan=e-b.rowIndex+1);d.f?ee(a):Bm(d.Uc.b,g,!1,!0).then(function(){var b=l.H;"baseline"!==b&&"top"!==b&&w(t,
"vertical-align",b);if(b=c.Zb()){var e=c.w,f=d.g,g=d.Uc.b.element,h=d.b.D,k=Rj(f.f,h),h=fm(f,h);e?w(g,"max-width",k.right-f.G-Kl(b)-h.right+"px"):w(g,"max-height",f.G-Kl(b)-k.top-h.top+"px");w(g,"overflow","hidden")}ee(a)})}}).then(function(){d&&ns(d);c.h=[];Rm(b,!1);Vm(b);M(g,!0)});return K(g)}}d&&ns(d);c.h=[];return null};function lt(a,b){if(b.G){var c=b.Zb();a.U===b.j&&!a.K&&c&&(c.h=!1,c.l=!1);return new mt}return new nt}function nt(){}nt.prototype.g=function(a,b,c){return it(a,b,c)};
nt.prototype.f=function(a){return!!a};nt.prototype.b=function(a,b){b.G=!0};function mt(){}mt.prototype.g=function(a,b,c){a=b.L;var d=a.g,e=Os(a,b),f=e.firstChild;jt(a,e,f);a.l&&e.insertBefore(a.l.cloneNode(!0),f);if(d.f&&!d.h){var g=d.f.cloneNode(!0);d.A.push(g);e.insertBefore(g,f)}d.b&&!d.g&&(g=d.b.cloneNode(!0),d.u.push(g),e.insertBefore(g,f));a=new Us(a,c);c=new hs(a,c.b);a=I("TableFormattingContext.doLayout");is(c,b).Da(a);return K(a)};
mt.prototype.f=function(a,b,c){var d=b.Zb();if(!d)return!0;c=c.Ab();return a.U===b.j&&a.K&&d.g?(d.g=!1,d.j=!1):!d.g&&d.j&&d.b||!d.h&&d.l&&d.f?!!c.B&&!c.B.b:!0};mt.prototype.b=function(a,b,c){(a=b.Zb())&&!c&&(os(a),ps(a),!a.g&&a.j&&a.b?a.g=!0:!a.h&&a.l&&a.f&&(a.h=!0))};var ot=new ct;Fd("RESOLVE_FORMATTING_CONTEXT",function(a,b,c){return b?c===od?(b=a.parent,new Ns(b?b.L:null,a.U)):null:null});Fd("RESOLVE_LAYOUT_PROCESSOR",function(a){return a instanceof Ns?ot:null});Array.from||(Array.from=function(a,b,c){b&&c&&(b=b.bind(c));c=[];for(var d=a.length,e=0;e<d;e++)c[e]=b?b(a[e],e):a[e];return c});
Array.prototype.findIndex||Object.defineProperty(Array.prototype,"findIndex",{value:function(a,b){if(null==this)throw new TypeError("Array.prototype.findIndex called on null or undefined");if("function"!==typeof a)throw new TypeError("predicate must be a function");for(var c=Object(this),d=c.length>>>0,e,f=0;f<d;f++)if(e=c[f],a.call(b,e,f,c))return f;return-1},enumerable:!1,configurable:!1,writable:!1});
Object.assign||(Object.assign=function(a,b){if(!b)return a;Object.keys(b).forEach(function(c){a[c]=b[c]});return a});function pt(a){function b(a){return"number"===typeof a?a:null}function c(a){return"string"===typeof a?{url:a,cb:null,Tb:null}:{url:a.url,cb:b(a.startPage),Tb:b(a.skipPagesBefore)}}return Array.isArray(a)?a.map(c):a?[c(a)]:null}function qt(a){var b={};Object.keys(a).forEach(function(c){var d=a[c];switch(c){case "autoResize":b.autoresize=d;break;case "pageBorderWidth":b.pageBorder=d;break;default:b[c]=d}});return b}
function rt(a,b){hj=a.debug;this.g=!1;this.h=a;this.Ob=new xr(a.window||window,a.viewportElement,"main",this.Oe.bind(this));this.f={autoResize:!0,fontSize:16,pageBorderWidth:1,renderAllPages:!0,pageViewMode:"autoSpread",zoom:1,fitToScreen:!1};b&&this.Ge(b);this.b=new Na;Object.defineProperty(this,"readyState",{get:function(){return this.Ob.A}})}n=rt.prototype;n.Ge=function(a){var b=Object.assign({a:"configure"},qt(a));this.Ob.u(b);Object.assign(this.f,a)};
n.Oe=function(a){var b={type:a.t};Object.keys(a).forEach(function(c){"t"!==c&&(b[c]=a[c])});Oa(this.b,b)};n.cf=function(a,b){this.b.addEventListener(a,b,!1)};n.ff=function(a,b){this.b.removeEventListener(a,b,!1)};n.Se=function(a,b,c){a||Oa(this.b,{type:"error",content:"No URL specified"});st(this,a,null,b,c)};n.df=function(a,b,c){a||Oa(this.b,{type:"error",content:"No URL specified"});st(this,null,a,b,c)};
function st(a,b,c,d,e){function f(a){if(a)return a.map(function(a){return{url:a.url||null,text:a.text||null}})}d=d||{};var g=f(d.authorStyleSheet),h=f(d.userStyleSheet);e&&Object.assign(a.f,e);b=Object.assign({a:b?"loadXML":"loadEPUB",userAgentRootURL:a.h.userAgentRootURL,url:pt(b)||c,document:d.documentObject,fragment:d.fragment,authorStyleSheet:g,userStyleSheet:h},qt(a.f));a.g?a.Ob.u(b):(a.g=!0,Yr(a.Ob,b))}n.Bb=function(){return this.Ob.Bb()};
n.Ue=function(a){a:switch(a){case "left":a="ltr"===this.Bb()?"previous":"next";break a;case "right":a="ltr"===this.Bb()?"next":"previous"}this.Ob.u({a:"moveTo",where:a})};n.Te=function(a){this.Ob.u({a:"moveTo",url:a})};n.ef=function(a){a:{var b=this.Ob;if(!b.g)throw Error("no page exists.");switch(a){case "fit inside viewport":a=Tr(b,b.$.kb?Sr(b,b.j):b.g.f);break a;default:throw Error("unknown zoom type: "+a);}}return a};ba("vivliostyle.viewer.Viewer",rt);rt.prototype.setOptions=rt.prototype.Ge;
rt.prototype.addListener=rt.prototype.cf;rt.prototype.removeListener=rt.prototype.ff;rt.prototype.loadDocument=rt.prototype.Se;rt.prototype.loadEPUB=rt.prototype.df;rt.prototype.getCurrentPageProgression=rt.prototype.Bb;rt.prototype.navigateToPage=rt.prototype.Ue;rt.prototype.navigateToInternalUrl=rt.prototype.Te;rt.prototype.queryZoomFactor=rt.prototype.ef;ba("vivliostyle.viewer.ZoomType",Ur);Ur.FIT_INSIDE_VIEWPORT="fit inside viewport";ba("vivliostyle.viewer.PageViewMode",wr);wr.SINGLE_PAGE="singlePage";
wr.SPREAD="spread";wr.AUTO_SPREAD="autoSpread";ss.call(Br,"load_vivliostyle","end",void 0);var tt=16,ut="ltr";function vt(a){window.adapt_command(a)}function wt(){vt({a:"moveTo",where:"ltr"===ut?"previous":"next"})}function xt(){vt({a:"moveTo",where:"ltr"===ut?"next":"previous"})}
function yt(a){var b=a.key,c=a.keyIdentifier,d=a.location;if("End"===b||"End"===c)vt({a:"moveTo",where:"last"}),a.preventDefault();else if("Home"===b||"Home"===c)vt({a:"moveTo",where:"first"}),a.preventDefault();else if("ArrowUp"===b||"Up"===b||"Up"===c)vt({a:"moveTo",where:"previous"}),a.preventDefault();else if("ArrowDown"===b||"Down"===b||"Down"===c)vt({a:"moveTo",where:"next"}),a.preventDefault();else if("ArrowRight"===b||"Right"===b||"Right"===c)xt(),a.preventDefault();else if("ArrowLeft"===
b||"Left"===b||"Left"===c)wt(),a.preventDefault();else if("0"===b||"U+0030"===c)vt({a:"configure",fontSize:Math.round(tt)}),a.preventDefault();else if("t"===b||"U+0054"===c)vt({a:"toc",v:"toggle",autohide:!0}),a.preventDefault();else if("+"===b||"Add"===b||"U+002B"===c||"U+00BB"===c||"U+004B"===c&&d===KeyboardEvent.b)tt*=1.2,vt({a:"configure",fontSize:Math.round(tt)}),a.preventDefault();else if("-"===b||"Subtract"===b||"U+002D"===c||"U+00BD"===c||"U+004D"===c&&d===KeyboardEvent.b)tt/=1.2,vt({a:"configure",
fontSize:Math.round(tt)}),a.preventDefault()}
function zt(a){switch(a.t){case "loaded":a=a.viewer;var b=ut=a.Bb();a.fd.setAttribute("data-vivliostyle-page-progression",b);a.fd.setAttribute("data-vivliostyle-spread-view",a.$.kb);window.addEventListener("keydown",yt,!1);document.body.setAttribute("data-vivliostyle-viewer-status","complete");a=document.getElementById("vivliostyle-page-navigation-left");a.addEventListener("click",wt,!1);b=document.getElementById("vivliostyle-page-navigation-right");b.addEventListener("click",xt,!1);[a,b].forEach(function(a){a.setAttribute("data-vivliostyle-ui-state",
"attention");window.setTimeout(function(){a.removeAttribute("data-vivliostyle-ui-state")},1E3)});break;case "nav":(a=a.cfi)&&location.replace(na(location.href,Ca(a||"")));break;case "hyperlink":a.internal&&vt({a:"moveTo",url:a.href})}}
ba("vivliostyle.viewerapp.main",function(a){var b=a&&a.fragment||la("f"),c=a&&a.epubURL||la("b"),d=a&&a.xmlURL||la("x"),e=a&&a.defaultPageWidth||la("w"),f=a&&a.defaultPageHeight||la("h"),g=a&&a.defaultPageSize||la("size"),h=a&&a.orientation||la("orientation"),l=la("spread"),l=a&&a.spreadView||!!l&&"false"!=l,k=a&&a.viewportElement||document.body;a={a:c?"loadEPUB":"loadXML",url:c||d,autoresize:!0,fragment:b,renderAllPages:!0,userAgentRootURL:a&&a.uaRoot||null,document:a&&a.document||null,userStyleSheet:a&&
a.userStyleSheet||null,spreadView:l,pageBorder:1};var m;if(e&&f)m=e+" "+f;else{switch(g){case "A5":e="148mm";f="210mm";break;case "A4":e="210mm";f="297mm";break;case "A3":e="297mm";f="420mm";break;case "B5":e="176mm";f="250mm";break;case "B4":e="250mm";f="353mm";break;case "letter":e="8.5in";f="11in";break;case "legal":e="8.5in";f="14in";break;case "ledger":e="11in",f="17in"}e&&f&&(m=g,"landscape"===h&&(m=m?m+" landscape":null,g=e,e=f,f=g))}e&&f&&(a.viewport={width:e,height:f},g=document.createElement("style"),
g.textContent="@page { size: "+m+"; margin: 0; }",document.head.appendChild(g));Yr(new xr(window,k,"main",zt),a)});
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

},{"./models/vivliostyle":11,"./vivliostyle-viewer":22,"vivliostyle":2}],6:[function(require,module,exports){
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
    var style = _storesUrlParameters2["default"].getParameter("style");
    var userStyle = _storesUrlParameters2["default"].getParameter("userStyle");
    return {
        epubUrl: epubUrl[0] || null,
        url: url.length ? url : null,
        fragment: fragment[0] || null,
        authorStyleSheet: style.length ? style : [],
        userStyleSheet: userStyle.length ? userStyle : []
    };
}

function DocumentOptions() {
    var urlOptions = getDocumentOptionsFromURL();
    this.epubUrl = _knockout2["default"].observable(urlOptions.epubUrl || "");
    this.url = _knockout2["default"].observable(urlOptions.url || null);
    this.fragment = _knockout2["default"].observable(urlOptions.fragment || "");
    this.authorStyleSheet = _knockout2["default"].observable(urlOptions.authorStyleSheet);
    this.userStyleSheet = _knockout2["default"].observable(urlOptions.userStyleSheet);
    this.pageSize = new _pageSize2["default"]();

    // write fragment back to URL when updated
    this.fragment.subscribe(function (fragment) {
        var encoded = fragment.replace(/[\s+&?=#\u007F-\uFFFF]+/g, encodeURIComponent);
        _storesUrlParameters2["default"].setParameter("f", encoded);
    });
}

DocumentOptions.prototype.toObject = function () {
    function convertStyleSheetArray(arr) {
        return arr.map(function (url) {
            return { url: url };
        });
    }
    var uss = convertStyleSheetArray(this.userStyleSheet());
    // Do not include url
    // (url is a required argument to Viewer.loadDocument, separated from other options)
    return {
        fragment: this.fragment(),
        authorStyleSheet: convertStyleSheetArray(this.authorStyleSheet()),
        userStyleSheet: [{
            text: "@page {" + this.pageSize.toCSSDeclarationString() + "}"
        }].concat(uss)
    };
};

exports["default"] = DocumentOptions;
module.exports = exports["default"];

},{"../stores/url-parameters":13,"./page-size":8,"knockout":1}],7:[function(require,module,exports){
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
 * Copyright 2016 Vivliostyle Inc.
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

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _modelsVivliostyle = require("../models/vivliostyle");

var _modelsVivliostyle2 = _interopRequireDefault(_modelsVivliostyle);

var PageViewModeInstance = (function () {
    function PageViewModeInstance() {
        _classCallCheck(this, PageViewModeInstance);
    }

    _createClass(PageViewModeInstance, [{
        key: "toSpreadViewString",
        value: function toSpreadViewString() {
            switch (this) {
                case PageViewMode.SPREAD:
                    return "true";
                case PageViewMode.SINGLE_PAGE:
                    return "false";
                case PageViewMode.AUTO_SPREAD:
                    return "auto";
                default:
                    throw new Error("Invalid PageViewMode");
            }
        }
    }, {
        key: "toString",
        value: function toString() {
            switch (this) {
                case PageViewMode.SPREAD:
                    return _modelsVivliostyle2["default"].viewer.PageViewMode.SPREAD;
                case PageViewMode.SINGLE_PAGE:
                    return _modelsVivliostyle2["default"].viewer.PageViewMode.SINGLE_PAGE;
                case PageViewMode.AUTO_SPREAD:
                    return _modelsVivliostyle2["default"].viewer.PageViewMode.AUTO_SPREAD;
                default:
                    throw new Error("Invalid PageViewMode");
            }
        }
    }]);

    return PageViewModeInstance;
})();

var PageViewMode = {
    AUTO_SPREAD: new PageViewModeInstance(),
    SINGLE_PAGE: new PageViewModeInstance(),
    SPREAD: new PageViewModeInstance(),
    defaultMode: function defaultMode() {
        return this.AUTO_SPREAD;
    },
    fromSpreadViewString: function fromSpreadViewString(str) {
        switch (str) {
            case "true":
                return this.SPREAD;
            case "false":
                return this.SINGLE_PAGE;
            case "auto":
            default:
                return this.AUTO_SPREAD;
        }
    },
    of: function of(name) {
        switch (name) {
            case _modelsVivliostyle2["default"].viewer.PageViewMode.SPREAD:
                return this.SPREAD;
            case _modelsVivliostyle2["default"].viewer.PageViewMode.SINGLE_PAGE:
                return this.SINGLE_PAGE;
            case _modelsVivliostyle2["default"].viewer.PageViewMode.AUTO_SPREAD:
                return this.AUTO_SPREAD;
            default:
                throw new Error("Invalid PageViewMode name: " + name);
        }
    }
};

exports["default"] = PageViewMode;
module.exports = exports["default"];

},{"../models/vivliostyle":11}],10:[function(require,module,exports){
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

var _pageViewMode = require("./page-view-mode");

var _pageViewMode2 = _interopRequireDefault(_pageViewMode);

var _zoomOptions = require("./zoom-options");

var _zoomOptions2 = _interopRequireDefault(_zoomOptions);

function getViewerOptionsFromURL() {
    return {
        profile: _storesUrlParameters2["default"].getParameter("profile")[0] === "true",
        pageViewMode: _pageViewMode2["default"].fromSpreadViewString(_storesUrlParameters2["default"].getParameter("spread")[0])
    };
}

function getDefaultValues() {
    return {
        fontSize: 16,
        profile: false,
        pageViewMode: _pageViewMode2["default"].defaultMode(),
        zoom: _zoomOptions2["default"].createDefaultOptions()
    };
}

function ViewerOptions(options) {
    this.fontSize = _knockout2["default"].observable();
    this.profile = _knockout2["default"].observable();
    this.pageViewMode = _knockout2["default"].observable();
    this.zoom = _knockout2["default"].observable();
    if (options) {
        this.copyFrom(options);
    } else {
        var defaultValues = getDefaultValues();
        var urlOptions = getViewerOptionsFromURL();
        this.fontSize(defaultValues.fontSize);
        this.profile(urlOptions.profile || defaultValues.profile);
        this.pageViewMode(urlOptions.pageViewMode || defaultValues.pageViewMode);
        this.zoom(defaultValues.zoom);

        // write spread parameter back to URL when updated
        this.pageViewMode.subscribe(function (pageViewMode) {
            _storesUrlParameters2["default"].setParameter("spread", pageViewMode.toSpreadViewString());
        });
    }
}

ViewerOptions.prototype.copyFrom = function (other) {
    this.fontSize(other.fontSize());
    this.profile(other.profile());
    this.pageViewMode(other.pageViewMode());
    this.zoom(other.zoom());
};

ViewerOptions.prototype.toObject = function () {
    return {
        fontSize: this.fontSize(),
        pageViewMode: this.pageViewMode().toString(),
        zoom: this.zoom().zoom,
        fitToScreen: this.zoom().fitToScreen
    };
};

ViewerOptions.getDefaultValues = getDefaultValues;

exports["default"] = ViewerOptions;
module.exports = exports["default"];

},{"../stores/url-parameters":13,"./page-view-mode":9,"./zoom-options":12,"knockout":1}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
/*
 * Copyright 2016 Vivliostyle Inc.
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

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _modelsVivliostyle = require("../models/vivliostyle");

var _modelsVivliostyle2 = _interopRequireDefault(_modelsVivliostyle);

var ZoomOptions = (function () {
    function ZoomOptions(zoom) {
        _classCallCheck(this, ZoomOptions);

        this.zoom = zoom;
    }

    _createClass(ZoomOptions, [{
        key: "zoomIn",
        value: function zoomIn(viewer) {
            return new FixedZoomFactor(this.getCurrentZoomFactor(viewer) * 1.25);
        }
    }, {
        key: "zoomOut",
        value: function zoomOut(viewer) {
            return new FixedZoomFactor(this.getCurrentZoomFactor(viewer) * 0.8);
        }
    }, {
        key: "zoomToActualSize",
        value: function zoomToActualSize() {
            return new FixedZoomFactor(1);
        }
    }], [{
        key: "createDefaultOptions",
        value: function createDefaultOptions() {
            return new FitToScreen();
        }
    }, {
        key: "createFromZoomFactor",
        value: function createFromZoomFactor(zoom) {
            return new FixedZoomFactor(zoom);
        }
    }]);

    return ZoomOptions;
})();

var FitToScreen = (function (_ZoomOptions) {
    _inherits(FitToScreen, _ZoomOptions);

    function FitToScreen() {
        _classCallCheck(this, FitToScreen);

        _get(Object.getPrototypeOf(FitToScreen.prototype), "constructor", this).call(this, 1);
    }

    _createClass(FitToScreen, [{
        key: "toggleFitToScreen",
        value: function toggleFitToScreen() {
            return new FixedZoomFactor(1);
        }
    }, {
        key: "getCurrentZoomFactor",
        value: function getCurrentZoomFactor(viewer) {
            return viewer.queryZoomFactor(_modelsVivliostyle2["default"].viewer.ZoomType.FIT_INSIDE_VIEWPORT);
        }
    }, {
        key: "fitToScreen",
        get: function get() {
            return true;
        }
    }]);

    return FitToScreen;
})(ZoomOptions);

var FixedZoomFactor = (function (_ZoomOptions2) {
    _inherits(FixedZoomFactor, _ZoomOptions2);

    function FixedZoomFactor() {
        _classCallCheck(this, FixedZoomFactor);

        _get(Object.getPrototypeOf(FixedZoomFactor.prototype), "constructor", this).apply(this, arguments);
    }

    _createClass(FixedZoomFactor, [{
        key: "toggleFitToScreen",
        value: function toggleFitToScreen() {
            return new FitToScreen();
        }
    }, {
        key: "getCurrentZoomFactor",
        value: function getCurrentZoomFactor(viewer) {
            return this.zoom;
        }
    }, {
        key: "fitToScreen",
        get: function get() {
            return false;
        }
    }]);

    return FixedZoomFactor;
})(ZoomOptions);

exports["default"] = ZoomOptions;
module.exports = exports["default"];

},{"../models/vivliostyle":11}],13:[function(require,module,exports){
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

},{"../utils/string-util":16}],14:[function(require,module,exports){
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

},{}],17:[function(require,module,exports){
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

},{"knockout":1}],18:[function(require,module,exports){
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

var _utilsKeyUtil = require("../utils/key-util");

function Navigation(viewerOptions, viewer, settingsPanel, navigationOptions) {
    this.viewerOptions_ = viewerOptions;
    this.viewer_ = viewer;
    this.settingsPanel_ = settingsPanel;

    this.isDisabled = _knockout2["default"].pureComputed(function () {
        return this.settingsPanel_.opened() || !this.viewer_.state.navigatable();
    }, this);

    var navigationDisabled = _knockout2["default"].pureComputed(function () {
        return navigationOptions.disablePageNavigation || this.isDisabled();
    }, this);

    this.isNavigateToPreviousDisabled = navigationDisabled;
    this.isNavigateToNextDisabled = navigationDisabled;
    this.isNavigateToLeftDisabled = navigationDisabled;
    this.isNavigateToRightDisabled = navigationDisabled;
    this.isNavigateToFirstDisabled = navigationDisabled;
    this.isNavigateToLastDisabled = navigationDisabled;
    this.hidePageNavigation = !!navigationOptions.disablePageNavigation;

    var zoomDisabled = _knockout2["default"].pureComputed(function () {
        return navigationOptions.disableZoom || this.isDisabled();
    }, this);

    this.isZoomOutDisabled = zoomDisabled;
    this.isZoomInDisabled = zoomDisabled;
    this.isZoomToActualSizeDisabled = zoomDisabled;
    this.isToggleFitToScreenDisabled = zoomDisabled;
    this.hideZoom = !!navigationOptions.disableZoom;

    this.fitToScreen = _knockout2["default"].pureComputed(function () {
        return viewerOptions.zoom().fitToScreen;
    }, this);

    var fontSizeChangeDisabled = _knockout2["default"].pureComputed(function () {
        return navigationOptions.disableFontSizeChange || this.isDisabled();
    }, this);

    this.isIncreaseFontSizeDisabled = fontSizeChangeDisabled;
    this.isDecreaseFontSizeDisabled = fontSizeChangeDisabled;
    this.isDefaultFontSizeDisabled = fontSizeChangeDisabled;
    this.hideFontSizeChange = !!navigationOptions.disableFontSizeChange;

    ["navigateToPrevious", "navigateToNext", "navigateToLeft", "navigateToRight", "navigateToFirst", "navigateToLast", "zoomIn", "zoomOut", "zoomToActualSize", "toggleFitToScreen", "increaseFontSize", "decreaseFontSize", "defaultFontSize", "handleKey"].forEach(function (methodName) {
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
        this.viewerOptions_.zoom(zoom.zoomIn(this.viewer_));
        return true;
    } else {
        return false;
    }
};

Navigation.prototype.zoomOut = function () {
    if (!this.isZoomOutDisabled()) {
        var zoom = this.viewerOptions_.zoom();
        this.viewerOptions_.zoom(zoom.zoomOut(this.viewer_));
        return true;
    } else {
        return false;
    }
};

Navigation.prototype.zoomToActualSize = function () {
    if (!this.isZoomToActualSizeDisabled()) {
        var zoom = this.viewerOptions_.zoom();
        this.viewerOptions_.zoom(zoom.zoomToActualSize());
        return true;
    } else {
        return false;
    }
};

Navigation.prototype.toggleFitToScreen = function () {
    if (!this.isToggleFitToScreenDisabled()) {
        var zoom = this.viewerOptions_.zoom();
        this.viewerOptions_.zoom(zoom.toggleFitToScreen());
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

},{"../models/viewer-options":10,"../utils/key-util":14,"knockout":1}],19:[function(require,module,exports){
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

var _modelsPageViewMode = require("../models/page-view-mode");

var _modelsPageViewMode2 = _interopRequireDefault(_modelsPageViewMode);

var _utilsKeyUtil = require("../utils/key-util");

function SettingsPanel(viewerOptions, documentOptions, viewer, messageDialog, settingsPanelOptions) {
    var _this = this;

    this.viewerOptions_ = viewerOptions;
    this.documentOptions_ = documentOptions;
    this.viewer_ = viewer;

    this.isPageSizeChangeDisabled = !!settingsPanelOptions.disablePageSizeChange;
    this.isOverrideDocumentStyleSheetDisabled = this.isPageSizeChangeDisabled;
    this.isPageViewModeChangeDisabled = !!settingsPanelOptions.disablePageViewModeChange;

    this.opened = _knockout2["default"].observable(false);
    this.state = {
        viewerOptions: new _modelsViewerOptions2["default"](viewerOptions),
        pageSize: new _modelsPageSize2["default"](documentOptions.pageSize),
        pageViewMode: _knockout2["default"].pureComputed({
            read: function read() {
                return _this.state.viewerOptions.pageViewMode().toString();
            },
            write: function write(value) {
                _this.state.viewerOptions.pageViewMode(_modelsPageViewMode2["default"].of(value));
            }
        })
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
    return true;
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

},{"../models/page-size":8,"../models/page-view-mode":9,"../models/viewer-options":10,"../utils/key-util":14,"knockout":1}],20:[function(require,module,exports){
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

var _modelsZoomOptions = require("../models/zoom-options");

var _modelsZoomOptions2 = _interopRequireDefault(_modelsZoomOptions);

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
    this.isDebug = _storesUrlParameters2["default"].getParameter("debug")[0] === "true";
    this.viewerSettings = {
        userAgentRootURL: "resources/",
        viewportElement: document.getElementById("vivliostyle-viewer-viewport"),
        debug: this.isDebug
    };
    this.viewer = new _viewer2["default"](this.viewerSettings, this.viewerOptions);
    this.messageDialog = new _messageDialog2["default"](_modelsMessageQueue2["default"]);

    var settingsPanelOptions = {
        disablePageSizeChange: false,
        disablePageViewModeChange: false
    };

    this.settingsPanel = new _settingsPanel2["default"](this.viewerOptions, this.documentOptions, this.viewer, this.messageDialog, settingsPanelOptions);

    var navigationOptions = {
        disablePageNavigation: false,
        disableZoom: false,
        disableFontSizeChange: false
    };

    this.navigation = new _navigation2["default"](this.viewerOptions, this.viewer, this.settingsPanel, navigationOptions);

    this.handleKey = (function (data, event) {
        var key = _utilsKeyUtil2["default"].identifyKeyFromEvent(event);
        var ret = this.settingsPanel.handleKey(key);
        if (ret) {
            ret = this.navigation.handleKey(key);
        }
        return ret;
    }).bind(this);

    this.viewer.loadDocument(this.documentOptions);
}

exports["default"] = ViewerApp;
module.exports = exports["default"];

},{"../models/document-options":6,"../models/message-queue":7,"../models/viewer-options":10,"../models/vivliostyle":11,"../models/zoom-options":12,"../stores/url-parameters":13,"../utils/key-util":14,"./message-dialog":17,"./navigation":18,"./settings-panel":19,"./viewer":21,"knockout":1}],21:[function(require,module,exports){
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
        status: _utilsObservableUtil2["default"].readonlyObservable(_modelsVivliostyle2["default"].constants.ReadyState.LOADING),
        pageProgression: _utilsObservableUtil2["default"].readonlyObservable(_modelsVivliostyle2["default"].constants.LTR)
    };
    this.state = {
        status: state_.status.getter.extend({
            rateLimit: { timeout: 100, method: "notifyWhenChangesStop" }
        }),
        navigatable: _knockout2["default"].pureComputed(function () {
            return state_.status.value() !== _modelsVivliostyle2["default"].constants.ReadyState.LOADING;
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
    this.viewer_.addListener("readystatechange", (function () {
        var readyState = this.viewer_.readyState;
        if (readyState === _modelsVivliostyle2["default"].constants.ReadyState.INTERACTIVE || _modelsVivliostyle2["default"].constants.ReadyState.COMPLETE) {
            this.state_.pageProgression.value(this.viewer_.getCurrentPageProgression());
        }
        this.state_.status.value(readyState);
    }).bind(this));
    this.viewer_.addListener("loaded", (function () {
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
        this.viewer_.setOptions(viewerOptions);
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

},{"../logging/logger":4,"../models/vivliostyle":11,"../utils/observable-util":15,"knockout":1}],22:[function(require,module,exports){
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

},{"./bindings/menuButton.js":3,"./viewmodels/viewer-app":20,"knockout":1}]},{},[5]);
