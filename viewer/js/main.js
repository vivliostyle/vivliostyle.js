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
 * Vivliostyle core 2016.10.1-pre.20161206065329
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
function t(a,b){function c(){}c.prototype=b.prototype;a.te=b.prototype;a.prototype=new c;a.prototype.constructor=a;a.lf=function(a,c,f){for(var d=Array(arguments.length-2),e=2;e<arguments.length;e++)d[e-2]=arguments[e];return b.prototype[c].apply(a,d)}};function ca(a){var b=a.error,c=b&&(b.frameTrace||b.stack);a=[].concat(a.messages);b&&(0<a.length&&(a=a.concat(["\n"])),a=a.concat([b.toString()]),c&&(a=a.concat(["\n"]).concat(c)));return a}function da(a){a=Array.from(a);var b=null;a[0]instanceof Error&&(b=a.shift());return{error:b,messages:a}}function fa(a){function b(a){return function(b){return a.apply(c,b)}}var c=a||console;this.h=b(c.debug||c.log);this.l=b(c.info||c.log);this.u=b(c.warn||c.log);this.j=b(c.error||c.log);this.f={}}
function ga(a,b,c){(a=a.f[b])&&a.forEach(function(a){a(c)})}function ha(a,b){var c=u,d=c.f[a];d||(d=c.f[a]=[]);d.push(b)}fa.prototype.debug=function(a){var b=da(arguments);this.h(ca(b));ga(this,1,b)};fa.prototype.g=function(a){var b=da(arguments);this.l(ca(b));ga(this,2,b)};fa.prototype.b=function(a){var b=da(arguments);this.u(ca(b));ga(this,3,b)};fa.prototype.error=function(a){var b=da(arguments);this.j(ca(b));ga(this,4,b)};var u=new fa;function ia(a){var b=a.match(/^([^#]*)/);return b?b[1]:a}var ja=window.location.href;
function ka(a,b){if(!b||a.match(/^\w{2,}:/))return a.toLowerCase().match("^javascript:")?"#":a;b.match(/^\w{2,}:\/\/[^\/]+$/)&&(b+="/");var c;if(a.match(/^\/\//))return(c=b.match(/^(\w{2,}:)\/\//))?c[1]+a:a;if(a.match(/^\//))return(c=b.match(/^(\w{2,}:\/\/[^\/]+)\//))?c[1]+a:a;a.match(/^\.(\/|$)/)&&(a=a.substr(1));c=b;var d=c.match(/^([^#?]*)/);b=d?d[1]:c;if(a.match(/^\#/))return b+a;c=b.lastIndexOf("/");if(0>c)return a;for(d=b.substr(0,c+1)+a;;){c=d.indexOf("/../");if(0>=c)break;var e=d.lastIndexOf("/",
c-1);if(0>=e)break;d=d.substr(0,e)+d.substr(c+3)}return d.replace(/\/(\.\/)+/g,"/")}function ma(a){a=new RegExp("#(.*&)?"+na(a)+"=([^#&]*)");return(a=window.location.href.match(a))?a[2]:null}function oa(a,b){var c=new RegExp("#(.*&)?"+na("f")+"=([^#&]*)"),d=a.match(c);return d?(c=d[2].length,d=d.index+d[0].length-c,a.substr(0,d)+b+a.substr(d+c)):a.match(/#/)?a+"&f="+b:a+"#f="+b}function pa(a){return null==a?a:a.toString()}function qa(){this.b=[null]}
qa.prototype.length=function(){return this.b.length-1};function ra(a,b){a&&(b="-"+b,a=a.replace(/-/g,""),"moz"===a&&(a="Moz"));return a+b.replace(/-[a-z]/g,function(a){return a.substr(1).toUpperCase()})}var sa=" -webkit- -moz- -ms- -o- -epub-".split(" "),ua={};
function va(a,b){if("writing-mode"===b){var c=document.createElement("span");if("-ms-"===a)return c.style.setProperty(a+b,"tb-rl"),"tb-rl"===c.style["writing-mode"];c.style.setProperty(a+b,"vertical-rl");return"vertical-rl"===c.style[a+b]}return"string"===typeof document.documentElement.style[ra(a,b)]}
function wa(a){var b=ua[a];if(b||null===b)return b;switch(a){case "writing-mode":if(va("-ms-","writing-mode"))return ua[a]=["-ms-writing-mode"],["-ms-writing-mode"];break;case "filter":if(va("-webkit-","filter"))return ua[a]=["-webkit-filter"],["-webkit-filter"];break;case "clip-path":if(va("-webkit-","clip-path"))return ua[a]=["-webkit-clip-path","clip-path"]}for(b=0;b<sa.length;b++){var c=sa[b];if(va(c,a))return b=c+a,ua[a]=[b],[b]}u.b("Property not supported by the browser: ",a);return ua[a]=null}
function v(a,b,c){try{var d=wa(b);d&&d.forEach(function(b){if("-ms-writing-mode"===b)switch(c){case "horizontal-tb":c="lr-tb";break;case "vertical-rl":c="tb-rl";break;case "vertical-lr":c="tb-lr"}a&&a.style&&a.style.setProperty(b,c)})}catch(e){u.b(e)}}function ya(a,b,c){try{var d=ua[b];return a.style.getPropertyValue(d?d[0]:b)}catch(e){}return c||""}function za(){this.b=[]}za.prototype.append=function(a){this.b.push(a);return this};
za.prototype.toString=function(){var a=this.b.join("");this.b=[a];return a};function Aa(a){return"\\"+a.charCodeAt(0).toString(16)+" "}function Ba(a){return a.replace(/[^-_a-zA-Z0-9\u0080-\uFFFF]/g,Aa)}function Ca(a){return a.replace(/[\u0000-\u001F"]/g,Aa)}function Da(a){return a.replace(/[\s+&?=#\u007F-\uFFFF]+/g,encodeURIComponent)}function Ea(a){return!!a.match(/^[a-zA-Z\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]$/)}
function na(a,b){return a.replace(/[^-a-zA-Z0-9_]/g,function(a){return("string"===typeof b?b:"\\u")+(65536|a.charCodeAt(0)).toString(16).substr(1)})}function Fa(a){var b=":",b="string"===typeof b?b:"\\u",c=new RegExp(na(b)+"[0-9a-fA-F]{4}","g");return a.replace(c,function(a){var c=b,c="string"===typeof c?c:"\\u";return a.indexOf(c)?a:String.fromCharCode(parseInt(a.substring(c.length),16))})}function Ga(a){if(!a)throw"Assert failed";}
function Ha(a,b){for(var c=0,d=a;;){Ga(c<=d);Ga(!c||!b(c-1));Ga(d==a||b(d));if(c==d)return c;var e=c+d>>1;b(e)?d=e:c=e+1}}function Ia(a,b){return a-b}function Ja(a,b){for(var c={},d=0;d<a.length;d++){var e=a[d],f=b(e);f&&!c[f]&&(c[f]=e)}return c}var La={};function Na(a,b){for(var c={},d=0;d<a.length;d++){var e=a[d],f=b(e);f&&(c[f]?c[f].push(e):c[f]=[e])}return c}function Oa(a,b){for(var c=Array(a.length),d=0;d<a.length;d++)c[d]=b(a[d],d);return c}
function Pa(a,b){var c={},d;for(d in a)c[d]=b(a[d],d);return c}function Qa(){this.h={}}function Ra(a,b){var c=a.h[b.type];if(c){b.target=a;b.currentTarget=a;for(var d=0;d<c.length;d++)c[d](b)}}Qa.prototype.addEventListener=function(a,b,c){c||((c=this.h[a])?c.push(b):this.h[a]=[b])};Qa.prototype.removeEventListener=function(a,b,c){!c&&(a=this.h[a])&&(b=a.indexOf(b),0<=b&&a.splice(b,1))};var Sa=null,Ta=null;function Ua(a){return 1==a.nodeType&&(a=a.getAttribute("id"))&&a.match(/^[-a-zA-Z_0-9.\u007F-\uFFFF]+$/)?a:null}function Va(a){return"^"+a}function Wa(a){return a.substr(1)}function Xa(a){return a?a.replace(/\^[\[\]\(\),=;^]/g,Wa):a}
function Ya(a){for(var b={};a;){var c=a.match(/^;([^;=]+)=(([^;]|\^;)*)/);if(!c)break;var d=c[1],e;a:{e=c[2];var f=[];do{var g=e.match(/^(\^,|[^,])*/),h=Xa(g[0]);e=e.substr(g[0].length+1);if(!e&&!f.length){e=h;break a}f.push(h)}while(e);e=f}b[d]=e;a=a.substr(c[0].length)}return b}function Za(){}Za.prototype.g=function(a){a.append("!")};Za.prototype.h=function(){return!1};function $a(a,b,c){this.index=a;this.id=b;this.hb=c}
$a.prototype.g=function(a){a.append("/");a.append(this.index.toString());if(this.id||this.hb)a.append("["),this.id&&a.append(this.id),this.hb&&(a.append(";s="),a.append(this.hb)),a.append("]")};
$a.prototype.h=function(a){if(1!=a.node.nodeType)throw Error("E_CFI_NOT_ELEMENT");var b=a.node,c=b.children,d=c.length,e=Math.floor(this.index/2)-1;0>e||!d?(c=b.firstChild,a.node=c||b):(c=c[Math.min(e,d-1)],this.index&1&&((b=c.nextSibling)&&1!=b.nodeType?c=b:a.K=!0),a.node=c);if(this.id&&(a.K||this.id!=Ua(a.node)))throw Error("E_CFI_ID_MISMATCH");a.hb=this.hb;return!0};function ab(a,b,c,d){this.offset=a;this.f=b;this.b=c;this.hb=d}
ab.prototype.h=function(a){if(0<this.offset&&!a.K){for(var b=this.offset,c=a.node;;){var d=c.nodeType;if(1==d)break;var e=c.nextSibling;if(3<=d&&5>=d){d=c.textContent.length;if(b<=d)break;if(!e){b=d;break}b-=d}if(!e){b=0;break}c=e}a.node=c;a.offset=b}a.hb=this.hb;return!0};
ab.prototype.g=function(a){a.append(":");a.append(this.offset.toString());if(this.f||this.b||this.hb){a.append("[");if(this.f||this.b)this.f&&a.append(this.f.replace(/[\[\]\(\),=;^]/g,Va)),a.append(","),this.b&&a.append(this.b.replace(/[\[\]\(\),=;^]/g,Va));this.hb&&(a.append(";s="),a.append(this.hb));a.append("]")}};function bb(){this.ja=null}
function cb(a,b){var c=b.match(/^#?epubcfi\((.*)\)$/);if(!c)throw Error("E_CFI_NOT_CFI");for(var d=c[1],e=0,f=[];;)switch(d.charAt(e)){case "/":e++;c=d.substr(e).match(/^(0|[1-9][0-9]*)(\[([-a-zA-Z_0-9.\u007F-\uFFFF]+)(;([^\]]|\^\])*)?\])?/);if(!c)throw Error("E_CFI_NUMBER_EXPECTED");var e=e+c[0].length,g=parseInt(c[1],10),h=c[3],c=Ya(c[4]);f.push(new $a(g,h,pa(c.s)));break;case ":":e++;c=d.substr(e).match(/^(0|[1-9][0-9]*)(\[((([^\];,]|\^[\];,])*)(,(([^\];,]|\^[\];,])*))?)(;([^]]|\^\])*)?\])?/);
if(!c)throw Error("E_CFI_NUMBER_EXPECTED");e+=c[0].length;g=parseInt(c[1],10);(h=c[4])&&(h=Xa(h));var l=c[7];l&&(l=Xa(l));c=Ya(c[10]);f.push(new ab(g,h,l,pa(c.s)));break;case "!":e++;f.push(new Za);break;case "~":case "@":case "":a.ja=f;return;default:throw Error("E_CFI_PARSE_ERROR");}}function db(a,b){for(var c={node:b.documentElement,offset:0,K:!1,hb:null,qc:null},d=0;d<a.ja.length;d++)if(!a.ja[d].h(c)){++d<a.ja.length&&(c.qc=new bb,c.qc.ja=a.ja.slice(d));break}return c}
bb.prototype.trim=function(a,b){return a.replace(/\s+/g," ").match(b?/^[ -\uD7FF\uE000-\uFFFF]{0,8}/:/[ -\uD7FF\uE000-\uFFFF]{0,8}$/)[0].replace(/^\s/,"").replace(/\s$/,"")};
function eb(a,b,c){for(var d=!1,e=null,f=[],g=b.parentNode,h="",l="";b;){switch(b.nodeType){case 3:case 4:case 5:var k=b.textContent,m=k.length;d?(c+=m,h||(h=k)):(c>m&&(c=m),d=!0,h=k.substr(0,c),l=k.substr(c));b=b.previousSibling;continue;case 8:b=b.previousSibling;continue}break}if(0<c||h||l)h=a.trim(h,!1),l=a.trim(l,!0),f.push(new ab(c,h,l,e)),e=null;for(;g&&g&&9!=g.nodeType;){c=d?null:Ua(b);for(d=d?1:0;b;)1==b.nodeType&&(d+=2),b=b.previousSibling;f.push(new $a(d,c,e));e=null;b=g;g=g.parentNode;
d=!1}f.reverse();a.ja?(f.push(new Za),a.ja=f.concat(a.ja)):a.ja=f}bb.prototype.toString=function(){if(!this.ja)return"";var a=new za;a.append("epubcfi(");for(var b=0;b<this.ja.length;b++)this.ja[b].g(a);a.append(")");return a.toString()};function fb(){return{fontFamily:"serif",lineHeight:1.25,margin:8,kd:!0,ed:25,jd:!1,qd:!1,ib:!1,Xb:1,Kd:{print:!0}}}function gb(a){return{fontFamily:a.fontFamily,lineHeight:a.lineHeight,margin:a.margin,kd:a.kd,ed:a.ed,jd:a.jd,qd:a.qd,ib:a.ib,Xb:a.Xb,Kd:Object.assign({},a.Kd)}}var jb=fb(),kb={};function lb(a,b,c,d){a=Math.min((a-0)/c,(b-0)/d);return"matrix("+a+",0,0,"+a+",0,0)"}function mb(a){return'"'+Ca(a+"")+'"'}function nb(a){return Ba(a+"")}function ob(a,b){return a?Ba(a)+"."+Ba(b):Ba(b)}
var pb=0;
function qb(a,b){this.parent=a;this.u="S"+pb++;this.w=[];this.b=new rb(this,0);this.f=new rb(this,1);this.j=new rb(this,!0);this.h=new rb(this,!1);a&&a.w.push(this);this.values={};this.B={};this.A={};this.l=b;if(!a){var c=this.A;c.floor=Math.floor;c.ceil=Math.ceil;c.round=Math.round;c.sqrt=Math.sqrt;c.min=Math.min;c.max=Math.max;c.letterbox=lb;c["css-string"]=mb;c["css-name"]=nb;c["typeof"]=function(a){return typeof a};sb(this,"page-width",function(){return this.xb()});sb(this,"page-height",function(){return this.wb()});
sb(this,"pref-font-family",function(){return this.Z.fontFamily});sb(this,"pref-night-mode",function(){return this.Z.qd});sb(this,"pref-hyphenate",function(){return this.Z.kd});sb(this,"pref-margin",function(){return this.Z.margin});sb(this,"pref-line-height",function(){return this.Z.lineHeight});sb(this,"pref-column-width",function(){return this.Z.ed*this.fontSize});sb(this,"pref-horizontal",function(){return this.Z.jd});sb(this,"pref-spread-view",function(){return this.Z.ib})}}
function sb(a,b,c){a.values[b]=new tb(a,c,b)}function ub(a,b){a.values["page-number"]=b}function vb(a,b){a.A["has-content"]=b}var wb={px:1,"in":96,pt:4/3,pc:16,cm:96/2.54,mm:96/25.4,q:96/2.54/40,em:16,rem:16,ex:8,rex:8,dppx:1,dpi:1/96,dpcm:2.54/96};function xb(a){switch(a){case "q":case "rem":case "rex":return!0;default:return!1}}
function yb(a,b,c,d){this.ta=b;this.kb=c;this.J=null;this.xb=function(){return this.J?this.J:this.Z.ib?Math.floor(b/2)-this.Z.Xb:b};this.I=null;this.wb=function(){return this.I?this.I:c};this.u=d;this.V=null;this.fontSize=function(){return this.V?this.V:d};this.Z=jb;this.F={}}function zb(a,b){a.F[b.u]={};for(var c=0;c<b.w.length;c++)zb(a,b.w[c])}
function Ab(a,b,c){return"vw"==b?a.xb()/100:"vh"==b?a.wb()/100:"em"==b||"rem"==b?c?a.u:a.fontSize():"ex"==b||"rex"==b?wb.ex*(c?a.u:a.fontSize())/wb.em:wb[b]}function Bb(a,b,c){do{var d=b.values[c];if(d||b.l&&(d=b.l.call(a,c,!1)))return d;b=b.parent}while(b);throw Error("Name '"+c+"' is undefined");}
function Cb(a,b,c,d,e){do{var f=b.B[c];if(f||b.l&&(f=b.l.call(a,c,!0)))return f;if(f=b.A[c]){if(e)return b.b;c=Array(d.length);for(e=0;e<d.length;e++)c[e]=d[e].evaluate(a);return new rb(b,f.apply(a,c))}b=b.parent}while(b);throw Error("Function '"+c+"' is undefined");}
function Db(a,b,c){var d="",e=b.match(/^(min|max)-(.*)$/);e&&(d=e[1],b=e[2]);var f=e=null;switch(b){case "width":case "height":case "device-width":case "device-height":case "color":c&&(e=c.evaluate(a))}switch(b){case "width":f=a.xb();break;case "height":f=a.wb();break;case "device-width":f=window.screen.availWidth;break;case "device-height":f=window.screen.availHeight;break;case "color":f=window.screen.pixelDepth}if(null!=f&&null!=e)switch(d){case "min":return f>=e;case "max":return f<=e;default:return f==
e}else if(null!=f&&!c)return!!f;return!1}function Eb(a){this.b=a;this.h="_"+pb++}n=Eb.prototype;n.toString=function(){var a=new za;this.ua(a,0);return a.toString()};n.ua=function(){throw Error("F_ABSTRACT");};n.Za=function(){throw Error("F_ABSTRACT");};n.Na=function(){return this};n.Jb=function(a){return a===this};function Fb(a,b,c,d){var e=d[a.h];if(null!=e)return e===kb?!1:e;d[a.h]=kb;b=a.Jb(b,c,d);return d[a.h]=b}
n.evaluate=function(a){var b;b=(b=a.F[this.b.u])?b[this.h]:void 0;if("undefined"!=typeof b)return b;b=this.Za(a);var c=this.h,d=this.b,e=a.F[d.u];e||(e={},a.F[d.u]=e);return e[c]=b};n.Pd=function(){return!1};function Gb(a,b){Eb.call(this,a);this.f=b}t(Gb,Eb);n=Gb.prototype;n.Gd=function(){throw Error("F_ABSTRACT");};n.Ld=function(){throw Error("F_ABSTRACT");};n.Za=function(a){a=this.f.evaluate(a);return this.Ld(a)};n.Jb=function(a,b,c){return a===this||Fb(this.f,a,b,c)};
n.ua=function(a,b){10<b&&a.append("(");a.append(this.Gd());this.f.ua(a,10);10<b&&a.append(")")};n.Na=function(a,b){var c=this.f.Na(a,b);return c===this.f?this:new this.constructor(this.b,c)};function y(a,b,c){Eb.call(this,a);this.f=b;this.g=c}t(y,Eb);n=y.prototype;n.Bc=function(){throw Error("F_ABSTRACT");};n.Ja=function(){throw Error("F_ABSTRACT");};n.fb=function(){throw Error("F_ABSTRACT");};n.Za=function(a){var b=this.f.evaluate(a);a=this.g.evaluate(a);return this.fb(b,a)};
n.Jb=function(a,b,c){return a===this||Fb(this.f,a,b,c)||Fb(this.g,a,b,c)};n.ua=function(a,b){var c=this.Bc();c<=b&&a.append("(");this.f.ua(a,c);a.append(this.Ja());this.g.ua(a,c);c<=b&&a.append(")")};n.Na=function(a,b){var c=this.f.Na(a,b),d=this.g.Na(a,b);return c===this.f&&d===this.g?this:new this.constructor(this.b,c,d)};function Hb(a,b,c){y.call(this,a,b,c)}t(Hb,y);Hb.prototype.Bc=function(){return 1};function Ib(a,b,c){y.call(this,a,b,c)}t(Ib,y);Ib.prototype.Bc=function(){return 2};
function Jb(a,b,c){y.call(this,a,b,c)}t(Jb,y);Jb.prototype.Bc=function(){return 3};function Kb(a,b,c){y.call(this,a,b,c)}t(Kb,y);Kb.prototype.Bc=function(){return 4};function Lb(a,b){Gb.call(this,a,b)}t(Lb,Gb);Lb.prototype.Gd=function(){return"!"};Lb.prototype.Ld=function(a){return!a};function Mb(a,b){Gb.call(this,a,b)}t(Mb,Gb);Mb.prototype.Gd=function(){return"-"};Mb.prototype.Ld=function(a){return-a};function Nb(a,b,c){y.call(this,a,b,c)}t(Nb,Hb);Nb.prototype.Ja=function(){return"&&"};
Nb.prototype.Za=function(a){return this.f.evaluate(a)&&this.g.evaluate(a)};function Ob(a,b,c){y.call(this,a,b,c)}t(Ob,Nb);Ob.prototype.Ja=function(){return" and "};function Pb(a,b,c){y.call(this,a,b,c)}t(Pb,Hb);Pb.prototype.Ja=function(){return"||"};Pb.prototype.Za=function(a){return this.f.evaluate(a)||this.g.evaluate(a)};function Qb(a,b,c){y.call(this,a,b,c)}t(Qb,Pb);Qb.prototype.Ja=function(){return", "};function Rb(a,b,c){y.call(this,a,b,c)}t(Rb,Ib);Rb.prototype.Ja=function(){return"<"};
Rb.prototype.fb=function(a,b){return a<b};function Sb(a,b,c){y.call(this,a,b,c)}t(Sb,Ib);Sb.prototype.Ja=function(){return"<="};Sb.prototype.fb=function(a,b){return a<=b};function Tb(a,b,c){y.call(this,a,b,c)}t(Tb,Ib);Tb.prototype.Ja=function(){return">"};Tb.prototype.fb=function(a,b){return a>b};function Ub(a,b,c){y.call(this,a,b,c)}t(Ub,Ib);Ub.prototype.Ja=function(){return">="};Ub.prototype.fb=function(a,b){return a>=b};function Vb(a,b,c){y.call(this,a,b,c)}t(Vb,Ib);Vb.prototype.Ja=function(){return"=="};
Vb.prototype.fb=function(a,b){return a==b};function Wb(a,b,c){y.call(this,a,b,c)}t(Wb,Ib);Wb.prototype.Ja=function(){return"!="};Wb.prototype.fb=function(a,b){return a!=b};function Xb(a,b,c){y.call(this,a,b,c)}t(Xb,Jb);Xb.prototype.Ja=function(){return"+"};Xb.prototype.fb=function(a,b){return a+b};function Yb(a,b,c){y.call(this,a,b,c)}t(Yb,Jb);Yb.prototype.Ja=function(){return" - "};Yb.prototype.fb=function(a,b){return a-b};function Zb(a,b,c){y.call(this,a,b,c)}t(Zb,Kb);Zb.prototype.Ja=function(){return"*"};
Zb.prototype.fb=function(a,b){return a*b};function $b(a,b,c){y.call(this,a,b,c)}t($b,Kb);$b.prototype.Ja=function(){return"/"};$b.prototype.fb=function(a,b){return a/b};function ac(a,b,c){y.call(this,a,b,c)}t(ac,Kb);ac.prototype.Ja=function(){return"%"};ac.prototype.fb=function(a,b){return a%b};function bc(a,b,c){Eb.call(this,a);this.H=b;this.ea=c.toLowerCase()}t(bc,Eb);bc.prototype.ua=function(a){a.append(this.H.toString());a.append(Ba(this.ea))};
bc.prototype.Za=function(a){return this.H*Ab(a,this.ea,!1)};function cc(a,b){Eb.call(this,a);this.f=b}t(cc,Eb);cc.prototype.ua=function(a){a.append(this.f)};cc.prototype.Za=function(a){return Bb(a,this.b,this.f).evaluate(a)};cc.prototype.Jb=function(a,b,c){return a===this||Fb(Bb(b,this.b,this.f),a,b,c)};function dc(a,b,c){Eb.call(this,a);this.f=b;this.name=c}t(dc,Eb);dc.prototype.ua=function(a){this.f&&a.append("not ");a.append(Ba(this.name))};
dc.prototype.Za=function(a){var b=this.name;a="all"===b||!!a.Z.Kd[b];return this.f?!a:a};dc.prototype.Jb=function(a,b,c){return a===this||Fb(this.value,a,b,c)};dc.prototype.Pd=function(){return!0};function tb(a,b,c){Eb.call(this,a);this.Ub=b;this.f=c}t(tb,Eb);tb.prototype.ua=function(a){a.append(this.f)};tb.prototype.Za=function(a){return this.Ub.call(a)};function ec(a,b,c){Eb.call(this,a);this.g=b;this.f=c}t(ec,Eb);
ec.prototype.ua=function(a){a.append(this.g);var b=this.f;a.append("(");for(var c=0;c<b.length;c++)c&&a.append(","),b[c].ua(a,0);a.append(")")};ec.prototype.Za=function(a){return Cb(a,this.b,this.g,this.f,!1).Na(a,this.f).evaluate(a)};ec.prototype.Jb=function(a,b,c){if(a===this)return!0;for(var d=0;d<this.f.length;d++)if(Fb(this.f[d],a,b,c))return!0;return Fb(Cb(b,this.b,this.g,this.f,!0),a,b,c)};
ec.prototype.Na=function(a,b){for(var c,d=c=this.f,e=0;e<c.length;e++){var f=c[e].Na(a,b);if(c!==d)d[e]=f;else if(f!==c[e]){for(var d=Array(c.length),g=0;g<e;g++)d[g]=c[g];d[e]=f}}c=d;return c===this.f?this:new ec(this.b,this.g,c)};function fc(a,b,c,d){Eb.call(this,a);this.f=b;this.j=c;this.g=d}t(fc,Eb);fc.prototype.ua=function(a,b){0<b&&a.append("(");this.f.ua(a,0);a.append("?");this.j.ua(a,0);a.append(":");this.g.ua(a,0);0<b&&a.append(")")};
fc.prototype.Za=function(a){return this.f.evaluate(a)?this.j.evaluate(a):this.g.evaluate(a)};fc.prototype.Jb=function(a,b,c){return a===this||Fb(this.f,a,b,c)||Fb(this.j,a,b,c)||Fb(this.g,a,b,c)};fc.prototype.Na=function(a,b){var c=this.f.Na(a,b),d=this.j.Na(a,b),e=this.g.Na(a,b);return c===this.f&&d===this.j&&e===this.g?this:new fc(this.b,c,d,e)};function rb(a,b){Eb.call(this,a);this.f=b}t(rb,Eb);
rb.prototype.ua=function(a){switch(typeof this.f){case "number":case "boolean":a.append(this.f.toString());break;case "string":a.append('"');a.append(Ca(this.f));a.append('"');break;default:throw Error("F_UNEXPECTED_STATE");}};rb.prototype.Za=function(){return this.f};function gc(a,b,c){Eb.call(this,a);this.name=b;this.value=c}t(gc,Eb);gc.prototype.ua=function(a){a.append("(");a.append(Ca(this.name.name));a.append(":");this.value.ua(a,0);a.append(")")};
gc.prototype.Za=function(a){return Db(a,this.name.name,this.value)};gc.prototype.Jb=function(a,b,c){return a===this||Fb(this.value,a,b,c)};gc.prototype.Na=function(a,b){var c=this.value.Na(a,b);return c===this.value?this:new gc(this.b,this.name,c)};function hc(a,b){Eb.call(this,a);this.index=b}t(hc,Eb);hc.prototype.ua=function(a){a.append("$");a.append(this.index.toString())};hc.prototype.Na=function(a,b){var c=b[this.index];if(!c)throw Error("Parameter missing: "+this.index);return c};
function ic(a,b,c){return b===a.h||b===a.b||c==a.h||c==a.b?a.h:b===a.j||b===a.f?c:c===a.j||c===a.f?b:new Nb(a,b,c)}function z(a,b,c){return b===a.b?c:c===a.b?b:new Xb(a,b,c)}function A(a,b,c){return b===a.b?new Mb(a,c):c===a.b?b:new Yb(a,b,c)}function jc(a,b,c){return b===a.b||c===a.b?a.b:b===a.f?c:c===a.f?b:new Zb(a,b,c)}function kc(a,b,c){return b===a.b?a.b:c===a.f?b:new $b(a,b,c)};var lc={};function mc(){}n=mc.prototype;n.Cb=function(a){for(var b=0;b<a.length;b++)a[b].$(this)};n.Dd=function(){throw Error("E_CSS_EMPTY_NOT_ALLOWED");};n.Ed=function(){throw Error("E_CSS_SLASH_NOT_ALLOWED");};n.yc=function(){throw Error("E_CSS_STR_NOT_ALLOWED");};n.Bb=function(){throw Error("E_CSS_IDENT_NOT_ALLOWED");};n.cc=function(){throw Error("E_CSS_NUMERIC_NOT_ALLOWED");};n.bc=function(){throw Error("E_CSS_NUM_NOT_ALLOWED");};n.ac=function(a){return this.bc(a)};
n.Yc=function(){throw Error("E_CSS_COLOR_NOT_ALLOWED");};n.dc=function(){throw Error("E_CSS_URL_NOT_ALLOWED");};n.ob=function(){throw Error("E_CSS_LIST_NOT_ALLOWED");};n.Ab=function(){throw Error("E_CSS_COMMA_NOT_ALLOWED");};n.qb=function(){throw Error("E_CSS_FUNC_NOT_ALLOWED");};n.$b=function(){throw Error("E_CSS_EXPR_NOT_ALLOWED");};function nc(){}t(nc,mc);n=nc.prototype;
n.Cb=function(a){for(var b=null,c=0;c<a.length;c++){var d=a[c],e=d.$(this);if(b)b[c]=e;else if(d!==e){b=Array(a.length);for(d=0;d<c;d++)b[d]=a[d];b[c]=e}}return b||a};n.yc=function(a){return a};n.Bb=function(a){return a};n.Ed=function(a){return a};n.cc=function(a){return a};n.bc=function(a){return a};n.ac=function(a){return a};n.Yc=function(a){return a};n.dc=function(a){return a};n.ob=function(a){var b=this.Cb(a.values);return b===a.values?a:new oc(b)};
n.Ab=function(a){var b=this.Cb(a.values);return b===a.values?a:new pc(b)};n.qb=function(a){var b=this.Cb(a.values);return b===a.values?a:new qc(a.name,b)};n.$b=function(a){return a};function rc(){}n=rc.prototype;n.toString=function(){var a=new za;this.Ia(a,!0);return a.toString()};n.stringValue=function(){var a=new za;this.Ia(a,!1);return a.toString()};n.oa=function(){throw Error("F_ABSTRACT");};n.Ia=function(a){a.append("[error]")};n.Od=function(){return!1};n.Vb=function(){return!1};n.Qd=function(){return!1};
n.ie=function(){return!1};n.Jc=function(){return!1};function sc(){if(B)throw Error("E_INVALID_CALL");}t(sc,rc);sc.prototype.oa=function(a){return new rb(a,"")};sc.prototype.Ia=function(){};sc.prototype.$=function(a){return a.Dd(this)};var B=new sc;function tc(){if(uc)throw Error("E_INVALID_CALL");}t(tc,rc);tc.prototype.oa=function(a){return new rb(a,"/")};tc.prototype.Ia=function(a){a.append("/")};tc.prototype.$=function(a){return a.Ed(this)};var uc=new tc;function vc(a){this.b=a}t(vc,rc);
vc.prototype.oa=function(a){return new rb(a,this.b)};vc.prototype.Ia=function(a,b){b?(a.append('"'),a.append(Ca(this.b)),a.append('"')):a.append(this.b)};vc.prototype.$=function(a){return a.yc(this)};function wc(a){this.name=a;if(lc[a])throw Error("E_INVALID_CALL");lc[a]=this}t(wc,rc);wc.prototype.oa=function(a){return new rb(a,this.name)};wc.prototype.Ia=function(a,b){b?a.append(Ba(this.name)):a.append(this.name)};wc.prototype.$=function(a){return a.Bb(this)};wc.prototype.ie=function(){return!0};
function C(a){var b=lc[a];b||(b=new wc(a));return b}function D(a,b){this.H=a;this.ea=b.toLowerCase()}t(D,rc);D.prototype.oa=function(a,b){return this.H?b&&"%"==this.ea?100==this.H?b:new Zb(a,b,new rb(a,this.H/100)):new bc(a,this.H,this.ea):a.b};D.prototype.Ia=function(a){a.append(this.H.toString());a.append(this.ea)};D.prototype.$=function(a){return a.cc(this)};D.prototype.Vb=function(){return!0};function xc(a){this.H=a}t(xc,rc);
xc.prototype.oa=function(a){return this.H?1==this.H?a.f:new rb(a,this.H):a.b};xc.prototype.Ia=function(a){a.append(this.H.toString())};xc.prototype.$=function(a){return a.bc(this)};xc.prototype.Qd=function(){return!0};function yc(a){this.H=a}t(yc,xc);yc.prototype.$=function(a){return a.ac(this)};function zc(a){this.b=a}t(zc,rc);zc.prototype.Ia=function(a){a.append("#");var b=this.b.toString(16);a.append("000000".substr(b.length));a.append(b)};zc.prototype.$=function(a){return a.Yc(this)};
function Ac(a){this.url=a}t(Ac,rc);Ac.prototype.Ia=function(a){a.append('url("');a.append(Ca(this.url));a.append('")')};Ac.prototype.$=function(a){return a.dc(this)};function Bc(a,b,c,d){var e=b.length;b[0].Ia(a,d);for(var f=1;f<e;f++)a.append(c),b[f].Ia(a,d)}function oc(a){this.values=a}t(oc,rc);oc.prototype.Ia=function(a,b){Bc(a,this.values," ",b)};oc.prototype.$=function(a){return a.ob(this)};oc.prototype.Jc=function(){return!0};function pc(a){this.values=a}t(pc,rc);
pc.prototype.Ia=function(a,b){Bc(a,this.values,",",b)};pc.prototype.$=function(a){return a.Ab(this)};function qc(a,b){this.name=a;this.values=b}t(qc,rc);qc.prototype.Ia=function(a,b){a.append(Ba(this.name));a.append("(");Bc(a,this.values,",",b);a.append(")")};qc.prototype.$=function(a){return a.qb(this)};function F(a){this.f=a}t(F,rc);F.prototype.oa=function(){return this.f};F.prototype.Ia=function(a){a.append("-epubx-expr(");this.f.ua(a,0);a.append(")")};F.prototype.$=function(a){return a.$b(this)};
F.prototype.Od=function(){return!0};function Cc(a,b){if(a){if(a.Vb())return Ab(b,a.ea,!1)*a.H;if(a.Qd())return a.H}return 0}var Dc=C("absolute"),Ec=C("all"),Fc=C("always"),Gc=C("auto");C("avoid");var Hc=C("block"),Ic=C("block-end"),Jc=C("block-start"),Kc=C("both"),Lc=C("bottom"),Mc=C("border-box"),Nc=C("crop"),Oc=C("cross"),Pc=C("exclusive"),Qc=C("false"),Rc=C("fixed"),Sc=C("flex"),Tc=C("footnote");C("hidden");
var Uc=C("horizontal-tb"),Vc=C("inherit"),Wc=C("inline"),Xc=C("inline-block"),Yc=C("inline-end"),Zc=C("inline-start"),$c=C("landscape"),ad=C("left"),bd=C("list-item"),cd=C("ltr"),H=C("none"),dd=C("normal"),ed=C("oeb-page-foot"),fd=C("oeb-page-head"),gd=C("page"),hd=C("relative"),id=C("right"),jd=C("scale"),kd=C("static"),ld=C("rtl");C("table");var md=C("table-caption"),nd=C("table-cell");C("table-row");
var od=C("top"),pd=C("transparent"),qd=C("vertical-lr"),rd=C("vertical-rl"),sd=C("visible"),td=C("true"),ud=new D(100,"%"),vd=new D(100,"vw"),wd=new D(100,"vh"),xd=new D(0,"px"),yd={"font-size":1,color:2};function zd(a,b){return(yd[a]||Number.MAX_VALUE)-(yd[b]||Number.MAX_VALUE)};var Ad={SIMPLE_PROPERTY:"SIMPLE_PROPERTY",RESOLVE_FORMATTING_CONTEXT:"RESOLVE_FORMATTING_CONTEXT",RESOLVE_LAYOUT_PROCESSOR:"RESOLVE_LAYOUT_PROCESSOR"},Bd={};function Cd(a,b){if(Ad[a]){var c=Bd[a];c||(c=Bd[a]=[]);c.push(b)}else u.b(Error("Skipping unknown plugin hook '"+a+"'."))}ba("vivliostyle.plugin.registerHook",Cd);ba("vivliostyle.plugin.removeHook",function(a,b){if(Ad[a]){var c=Bd[a];if(c){var d=c.indexOf(b);0<=d&&c.splice(d,1)}}else u.b(Error("Ignoring unknown plugin hook '"+a+"'."))});var Dd=null,Fd=null;function I(a){if(!Dd)throw Error("E_TASK_NO_CONTEXT");Dd.name||(Dd.name=a);var b=Dd;a=new Gd(b,b.top,a);b.top=a;a.b=Hd;return a}function J(a){return new Id(a)}function Jd(a,b,c){a=I(a);a.j=c;try{b(a)}catch(d){Kd(a.f,d,a)}return K(a)}function Ld(a){var b=Md,c;Dd?c=Dd.f:(c=Fd)||(c=new Nd(new Od));b(c,a,void 0)}var Hd=1;function Od(){}Od.prototype.currentTime=function(){return(new Date).valueOf()};function Pd(a,b){return setTimeout(a,b)}
function Nd(a){this.g=a;this.h=1;this.slice=25;this.l=0;this.f=new qa;this.b=this.u=null;this.j=!1;this.order=0;Fd||(Fd=this)}
function Qd(a){if(!a.j){var b=a.f.b[1].b,c=a.g.currentTime();if(null!=a.b){if(c+a.h>a.u)return;clearTimeout(a.b)}b-=c;b<=a.h&&(b=a.h);a.u=c+b;a.b=Pd(function(){a.b=null;null!=a.b&&(clearTimeout(a.b),a.b=null);a.j=!0;try{var b=a.g.currentTime();for(a.l=b+a.slice;a.f.length();){var c=a.f.b[1];if(c.b>b)break;var f=a.f,g=f.b.pop(),h=f.b.length;if(1<h){for(var l=1;;){var k=2*l;if(k>=h)break;if(0<Rd(f.b[k],g))k+1<h&&0<Rd(f.b[k+1],f.b[k])&&k++;else if(k+1<h&&0<Rd(f.b[k+1],g))k++;else break;f.b[l]=f.b[k];
l=k}f.b[l]=g}if(!c.h){var l=c,m=l.f;l.f=null;m&&m.b==l&&(m.b=null,k=Dd,Dd=m,L(m.top,l.g),Dd=k)}b=a.g.currentTime();if(b>=a.l)break}}catch(p){u.error(p)}a.j=!1;a.f.length()&&Qd(a)},b)}}Nd.prototype.Va=function(a,b){var c=this.g.currentTime();a.order=this.order++;a.b=c+(b||0);a:{for(var c=this.f,d=c.b.length;1<d;){var e=Math.floor(d/2),f=c.b[e];if(0<Rd(f,a)){c.b[d]=a;break a}c.b[d]=f;d=e}c.b[1]=a}Qd(this)};
function Md(a,b,c){var d=new Sd(a,c||"");d.top=new Gd(d,null,"bootstrap");d.top.b=Hd;d.top.then(function(){function a(){d.l=!1;for(var a=0;a<d.j.length;a++){var b=d.j[a];try{b()}catch(h){u.error(h)}}}try{b().then(function(b){d.h=b;a()})}catch(f){Kd(d,f),a()}});c=Dd;Dd=d;a.Va(Td(d.top,"bootstrap"));Dd=c;return d}function Ud(a){this.f=a;this.order=this.b=0;this.g=null;this.h=!1}function Rd(a,b){return b.b-a.b||b.order-a.order}Ud.prototype.Va=function(a,b){this.g=a;this.f.f.Va(this,b)};
function Sd(a,b){this.f=a;this.name=b;this.j=[];this.g=null;this.l=!0;this.b=this.top=this.u=this.h=null}function Vd(a,b){a.j.push(b)}Sd.prototype.join=function(){var a=I("Task.join");if(this.l){var b=Td(a,this),c=this;Vd(this,function(){b.Va(c.h)})}else L(a,this.h);return K(a)};
function Kd(a,b,c){var d=b.frameTrace;if(!d){for(var d=b.stack?b.stack+"\n\t---- async ---\n":"",e=a.top;e;e=e.parent)d+="\t",d+=e.name,d+="\n";b.frameTrace=d}if(c){for(d=a.top;d&&d!=c;)d=d.parent;d==c&&(a.top=d)}for(a.g=b;a.top&&!a.top.j;)a.top=a.top.parent;a.top?(b=a.g,a.g=null,a.top.j(a.top,b)):a.g&&u.error(a.g,"Unhandled exception in task",a.name)}function Id(a){this.value=a}n=Id.prototype;n.then=function(a){a(this.value)};n.za=function(a){return a(this.value)};n.Bd=function(a){return new Id(a)};
n.ra=function(a){L(a,this.value)};n.va=function(){return!1};n.get=function(){return this.value};function Wd(a){this.b=a}n=Wd.prototype;n.then=function(a){this.b.then(a)};n.za=function(a){if(this.va()){var b=new Gd(this.b.f,this.b.parent,"AsyncResult.thenAsync");b.b=Hd;this.b.parent=b;this.b.then(function(c){a(c).then(function(a){L(b,a)})});return K(b)}return a(this.b.g)};n.Bd=function(a){return this.va()?this.za(function(){return new Id(a)}):new Id(a)};
n.ra=function(a){this.va()?this.then(function(b){L(a,b)}):L(a,this.b.g)};n.va=function(){return this.b.b==Hd};n.get=function(){if(this.va())throw Error("Result is pending");return this.b.g};function Gd(a,b,c){this.f=a;this.parent=b;this.name=c;this.g=null;this.b=0;this.j=this.h=null}function Xd(a){if(!Dd)throw Error("F_TASK_NO_CONTEXT");if(a!==Dd.top)throw Error("F_TASK_NOT_TOP_FRAME");}function K(a){return new Wd(a)}
function L(a,b){Xd(a);Dd.g||(a.g=b);a.b=2;var c=a.parent;Dd.top=c;if(a.h){try{a.h(b)}catch(d){Kd(a.f,d,c)}a.b=3}}Gd.prototype.then=function(a){switch(this.b){case Hd:if(this.h)throw Error("F_TASK_FRAME_ALREADY_HAS_CALLBACK");this.h=a;break;case 2:var b=this.f,c=this.parent;try{a(this.g),this.b=3}catch(d){this.b=3,Kd(b,d,c)}break;case 3:throw Error("F_TASK_DEAD_FRAME");default:throw Error("F_TASK_UNEXPECTED_FRAME_STATE "+this.b);}};
function Yd(){var a=I("Frame.timeSlice"),b=a.f.f;b.g.currentTime()>=b.l?(u.debug("-- time slice --"),Td(a).Va(!0)):L(a,!0);return K(a)}function Zd(a){var b=I("Frame.sleep");Td(b).Va(!0,a);return K(b)}function $d(a){function b(d){try{for(;d;){var e=a();if(e.va()){e.then(b);return}e.then(function(a){d=a})}L(c,!0)}catch(f){Kd(c.f,f,c)}}var c=I("Frame.loop");b(!0);return K(c)}
function ae(a){var b=Dd;if(!b)throw Error("E_TASK_NO_CONTEXT");return $d(function(){var c;do c=new be(b,b.top),b.top=c,c.b=Hd,a(c),c=K(c);while(!c.va()&&c.get());return c})}function Td(a,b){Xd(a);if(a.f.b)throw Error("E_TASK_ALREADY_SUSPENDED");var c=new Ud(a.f);a.f.b=c;Dd=null;a.f.u=b||null;return c}function be(a,b){Gd.call(this,a,b,"loop")}t(be,Gd);function M(a){L(a,!0)}function O(a){L(a,!1)};function ce(a,b){this.fetch=a;this.name=b;this.f=!1;this.b=this.h=null;this.g=[]}ce.prototype.start=function(){if(!this.b){var a=this;this.b=Md(Dd.f,function(){var b=I("Fetcher.run");a.fetch().then(function(c){var d=a.g;a.f=!0;a.h=c;a.b=null;a.g=[];if(d)for(var e=0;e<d.length;e++)try{d[e](c)}catch(f){u.error(f,"Error:")}L(b,c)});return K(b)},this.name)}};function de(a,b){a.f?b(a.h):a.g.push(b)}ce.prototype.get=function(){if(this.f)return J(this.h);this.start();return this.b.join()};
function ee(a){if(!a.length)return J(!0);if(1==a.length)return a[0].get().Bd(!0);var b=I("waitForFetches"),c=0;$d(function(){for(;c<a.length;){var b=a[c++];if(!b.f)return b.get().Bd(!0)}return J(!1)}).then(function(){L(b,!0)});return K(b)}
function fe(a,b){var c=null,d=null;"img"==a.localName&&(c=a.getAttribute("width"),d=a.getAttribute("height"));var e=new ce(function(){function e(b){l||(l=!0,"img"==a.localName&&(c||a.removeAttribute("width"),d||a.removeAttribute("height")),h.Va(b?b.type:"timeout"))}var g=I("loadImage"),h=Td(g,a),l=!1;a.addEventListener("load",e,!1);a.addEventListener("error",e,!1);a.addEventListener("abort",e,!1);"http://www.w3.org/2000/svg"==a.namespaceURI?(a.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",
b),setTimeout(e,300)):a.src=b;return K(g)},"loadElement "+b);e.start();return e};function ge(a){a=a.substr(1);if(a.match(/^[^0-9a-fA-F\n\r]$/))return a;a=parseInt(a,16);return isNaN(a)?"":65535>=a?String.fromCharCode(a):1114111>=a?String.fromCharCode(55296|a>>10&1023,56320|a&1023):"\ufffd"}function he(a){return a.replace(/\\([0-9a-fA-F]{0,6}(\r\n|[ \n\r\t\f])?|[^0-9a-fA-F\n\r])/g,ge)}function ie(){this.type=0;this.b=!1;this.H=0;this.text="";this.position=0}
function je(a,b){var c=Array(128),d;for(d=0;128>d;d++)c[d]=a;c[NaN]=35==a?35:72;for(d=0;d<b.length;d+=2)c[b[d]]=b[d+1];return c}var ke=[72,72,72,72,72,72,72,72,72,1,1,72,1,1,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,1,4,34,6,7,8,9,33,10,11,12,13,14,15,16,17,2,2,2,2,2,2,2,2,2,2,18,19,20,21,22,23,24,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,25,29,26,30,3,72,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,27,31,28,32,72];ke[NaN]=80;
var le=[43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,52,43,43,43,43,39,43,43,39,39,39,39,39,39,39,39,39,39,43,43,43,43,43,43,43,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,43,44,43,43,39,43,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,43,43,43,43,43];le[NaN]=43;
var me=[72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,78,59,72,59,59,59,59,59,59,59,59,59,59,72,72,72,72,72,72,72,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,72,61,72,72,78,72,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,72,72,72,72,72];le[NaN]=43;
var ne=[35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,57,59,35,58,58,58,58,58,58,58,58,58,58,35,35,35,35,35,35,35,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,35,61,35,35,60,35,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,35,35,35,35,35];ne[NaN]=35;
var oe=[45,45,45,45,45,45,45,45,45,73,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,73,45,45,45,45,45,45,45,53,45,45,45,45,45,45,45,39,39,39,39,39,39,39,39,39,39,45,45,45,45,45,45,45,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,45,44,45,45,39,45,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,45,45,45,45,45];oe[NaN]=45;
var pe=[37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,41,37,37,37,37,37,37,37,37,42,37,39,39,39,39,39,39,39,39,39,39,37,37,37,37,37,37,37,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,37,37,37,37,40,37,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,37,37,37,37,37];pe[NaN]=37;
var qe=[38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,41,38,38,38,38,38,38,38,38,38,38,39,39,39,39,39,39,39,39,39,39,38,38,38,38,38,38,38,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,38,38,38,38,40,38,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,38,38,38,38,38];qe[NaN]=38;
var re=je(35,[61,36]),se=je(35,[58,77]),te=je(35,[61,36,124,50]),ue=je(35,[38,51]),ve=je(35,[42,54]),we=je(39,[42,55]),xe=je(54,[42,55,47,56]),ye=je(62,[62,56]),ze=je(35,[61,36,33,70]),Ae=je(62,[45,71]),Be=je(63,[45,56]),Ce=je(76,[9,72,10,72,13,72,32,72]),De=je(39,[39,46,10,72,13,72,92,48]),Ee=je(39,[34,46,10,72,13,72,92,49]),Fe=je(39,[39,47,10,74,13,74,92,48]),Ge=je(39,[34,47,10,74,13,74,92,49]),He=je(64,[9,39,32,39,34,66,39,65,41,72,10,39,13,39]),Ie=je(39,[41,67,9,79,10,79,13,79,32,79,92,75,40,
72,91,72,93,72,123,72,125,72,NaN,67]),Je=je(39,[39,68,10,74,13,74,92,75,NaN,67]),Ke=je(39,[34,68,10,74,13,74,92,75,NaN,67]),Le=je(72,[9,39,10,39,13,39,32,39,41,69]);function Me(a,b){this.l=b;this.g=15;this.u=a;this.j=Array(this.g+1);this.b=-1;for(var c=this.position=this.f=this.h=0;c<=this.g;c++)this.j[c]=new ie}function P(a){a.h==a.f&&Ne(a);return a.j[a.f]}function Q(a,b){(a.h-a.f&a.g)<=b&&Ne(a);return a.j[a.f+b&a.g]}function R(a){a.f=a.f+1&a.g}
function Oe(a){if(0>a.b)throw Error("F_CSSTOK_BAD_CALL reset");a.f=a.b;a.b=-1}Me.prototype.error=function(a,b,c){this.l&&this.l.error(c,b)};
function Ne(a){var b=a.h,c=0<=a.b?a.b:a.f,d=a.g;b>=c?c+=d:c--;if(c==b){if(0>a.b)throw Error("F_CSSTOK_INTERNAL");for(var b=2*(a.g+1)-1,c=Array(b+1),d=a.b,e=0;d!=a.h;)c[e]=a.j[d],d==a.f&&(a.f=e),d=d+1&a.g,e++;a.b=0;a.h=e;a.g=b;for(a.j=c;e<=b;)c[e++]=new ie;b=a.h;c=d=a.g}for(var e=ke,f=a.u,g=a.position,h=a.j,l=0,k=0,m="",p=0,q=!1,w=h[b],r=-9;;){var x=f.charCodeAt(g);switch(e[x]||e[65]){case 72:l=51;m=isNaN(x)?"E_CSS_UNEXPECTED_EOF":"E_CSS_UNEXPECTED_CHAR";g++;break;case 1:g++;q=!0;continue;case 2:k=
g++;e=pe;continue;case 3:l=1;k=g++;e=le;continue;case 4:k=g++;l=31;e=re;continue;case 33:l=2;k=++g;e=De;continue;case 34:l=2;k=++g;e=Ee;continue;case 6:k=++g;l=7;e=le;continue;case 7:k=g++;l=32;e=re;continue;case 8:k=g++;l=21;break;case 9:k=g++;l=32;e=ue;continue;case 10:k=g++;l=10;break;case 11:k=g++;l=11;break;case 12:k=g++;l=36;e=re;continue;case 13:k=g++;l=23;break;case 14:k=g++;l=16;break;case 15:l=24;k=g++;e=ne;continue;case 16:k=g++;e=me;continue;case 78:k=g++;l=9;e=le;continue;case 17:k=g++;
l=19;e=ve;continue;case 18:k=g++;l=18;e=se;continue;case 77:g++;l=50;break;case 19:k=g++;l=17;break;case 20:k=g++;l=38;e=ze;continue;case 21:k=g++;l=39;e=re;continue;case 22:k=g++;l=37;e=re;continue;case 23:k=g++;l=22;break;case 24:k=++g;l=20;e=le;continue;case 25:k=g++;l=14;break;case 26:k=g++;l=15;break;case 27:k=g++;l=12;break;case 28:k=g++;l=13;break;case 29:r=k=g++;l=1;e=Ce;continue;case 30:k=g++;l=33;e=re;continue;case 31:k=g++;l=34;e=te;continue;case 32:k=g++;l=35;e=re;continue;case 35:break;
case 36:g++;l=l+41-31;break;case 37:l=5;p=parseInt(f.substring(k,g),10);break;case 38:l=4;p=parseFloat(f.substring(k,g));break;case 39:g++;continue;case 40:l=3;p=parseFloat(f.substring(k,g));k=g++;e=le;continue;case 41:l=3;p=parseFloat(f.substring(k,g));m="%";k=g++;break;case 42:g++;e=qe;continue;case 43:m=f.substring(k,g);break;case 44:r=g++;e=Ce;continue;case 45:m=he(f.substring(k,g));break;case 46:m=f.substring(k,g);g++;break;case 47:m=he(f.substring(k,g));g++;break;case 48:r=g;g+=2;e=Fe;continue;
case 49:r=g;g+=2;e=Ge;continue;case 50:g++;l=25;break;case 51:g++;l=26;break;case 52:m=f.substring(k,g);if(1==l){g++;if("url"==m.toLowerCase()){e=He;continue}l=6}break;case 53:m=he(f.substring(k,g));if(1==l){g++;if("url"==m.toLowerCase()){e=He;continue}l=6}break;case 54:e=we;g++;continue;case 55:e=xe;g++;continue;case 56:e=ke;g++;continue;case 57:e=ye;g++;continue;case 58:l=5;e=pe;g++;continue;case 59:l=4;e=qe;g++;continue;case 60:l=1;e=le;g++;continue;case 61:l=1;e=Ce;r=g++;continue;case 62:g--;
break;case 63:g-=2;break;case 64:k=g++;e=Ie;continue;case 65:k=++g;e=Je;continue;case 66:k=++g;e=Ke;continue;case 67:l=8;m=he(f.substring(k,g));g++;break;case 69:g++;break;case 70:e=Ae;g++;continue;case 71:e=Be;g++;continue;case 79:if(8>g-r&&f.substring(r+1,g+1).match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])|[ \t]$/)){g++;continue}case 68:l=8;m=he(f.substring(k,g));g++;e=Le;continue;case 74:g++;if(9>g-r&&f.substring(r+1,g).match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])$/))continue;l=51;m="E_CSS_UNEXPECTED_NEWLINE";
break;case 73:if(9>g-r&&f.substring(r+1,g+1).match(/^[0-9a-fA-F]{0,6}[ \t]$/)){g++;continue}m=he(f.substring(k,g));break;case 75:r=g++;continue;case 76:g++;e=oe;continue;default:e!==ke?(l=51,m="E_CSS_UNEXPECTED_STATE"):(k=g,l=0)}w.type=l;w.b=q;w.H=p;w.text=m;w.position=k;b++;if(b>=c)break;e=ke;q=!1;w=h[b&d]}a.position=g;a.h=b&d};function Pe(a,b,c,d,e){var f=I("ajax"),g=new XMLHttpRequest,h=Td(f,g),l={status:0,url:a,contentType:null,responseText:null,responseXML:null,Nc:null};g.open(c||"GET",a,!0);b&&(g.responseType=b);g.onreadystatechange=function(){if(4===g.readyState){l.status=g.status;if(200==l.status||!l.status)if(b&&"document"!==b||!g.responseXML){var c=g.response;b&&"text"!==b||"string"!=typeof c?c?"string"==typeof c?l.Nc=Qe([c]):l.Nc=c:u.b("Unexpected empty success response for",a):l.responseText=c;if(c=g.getResponseHeader("Content-Type"))l.contentType=
c.replace(/(.*);.*$/,"$1")}else l.responseXML=g.responseXML,l.contentType=g.responseXML.contentType;h.Va(l)}};try{d?(g.setRequestHeader("Content-Type",e||"text/plain; charset=UTF-8"),g.send(d)):g.send(null)}catch(k){u.b(k,"Error fetching "+a),h.Va(l)}return K(f)}function Qe(a){var b=window.WebKitBlobBuilder||window.MSBlobBuilder;if(b){for(var b=new b,c=0;c<a.length;c++)b.append(a[c]);return b.getBlob("application/octet-stream")}return new Blob(a,{type:"application/octet-stream"})}
function Re(a){var b=I("readBlob"),c=new FileReader,d=Td(b,c);c.addEventListener("load",function(){d.Va(c.result)},!1);c.readAsArrayBuffer(a);return K(b)}function Se(a,b){this.V=a;this.type=b;this.h={};this.j={}}Se.prototype.load=function(a,b,c){a=ia(a);var d=this.h[a];return"undefined"!=typeof d?J(d):this.fetch(a,b,c).get()};
function Te(a,b,c,d){var e=I("fetch");Pe(b,a.type).then(function(f){if(c&&400<=f.status)throw Error(d||"Failed to fetch required resource: "+b);a.V(f,a).then(function(c){delete a.j[b];a.h[b]=c;L(e,c)})});return K(e)}Se.prototype.fetch=function(a,b,c){a=ia(a);if(this.h[a])return null;var d=this.j[a];if(!d){var e=this,d=new ce(function(){return Te(e,a,b,c)},"Fetch "+a);e.j[a]=d;d.start()}return d};Se.prototype.get=function(a){return this.h[ia(a)]};
function Ue(a){a=a.responseText;return J(a?JSON.parse(a):null)};function Ve(a){var b=parseInt(a,16);if(isNaN(b))throw Error("E_CSS_COLOR");if(6==a.length)return new zc(b);if(3==a.length)return new zc(b&15|(b&15)<<4|(b&240)<<4|(b&240)<<8|(b&3840)<<8|(b&3840)<<12);throw Error("E_CSS_COLOR");}function We(a){this.f=a;this.Sa="Author"}n=We.prototype;n.jc=function(){return null};n.fa=function(){return this.f};n.error=function(){};n.Zb=function(a){this.Sa=a};n.pb=function(){};n.dd=function(){};n.nc=function(){};n.oc=function(){};n.ld=function(){};n.Dc=function(){};
n.tb=function(){};n.cd=function(){};n.$c=function(){};n.hd=function(){};n.Wb=function(){};n.nb=function(){};n.Rc=function(){};n.sc=function(){};n.Vc=function(){};n.Pc=function(){};n.Uc=function(){};n.Yb=function(){};n.Ad=function(){};n.Ob=function(){};n.Qc=function(){};n.Tc=function(){};n.Sc=function(){};n.vc=function(){};n.uc=function(){};n.xa=function(){};n.lb=function(){};n.ub=function(){};n.tc=function(){};n.Fc=function(){};
function Xe(a){switch(a.Sa){case "UA":return 0;case "User":return 100663296;default:return 83886080}}function Ye(a){switch(a.Sa){case "UA":return 0;case "User":return 16777216;default:return 33554432}}function Ze(){We.call(this,null);this.g=[];this.b=null}t(Ze,We);function $e(a,b){a.g.push(a.b);a.b=b}n=Ze.prototype;n.jc=function(){return null};n.fa=function(){return this.b.fa()};n.error=function(a,b){this.b.error(a,b)};
n.Zb=function(a){We.prototype.Zb.call(this,a);0<this.g.length&&(this.b=this.g[0],this.g=[]);this.b.Zb(a)};n.pb=function(a,b){this.b.pb(a,b)};n.dd=function(a){this.b.dd(a)};n.nc=function(a,b){this.b.nc(a,b)};n.oc=function(a,b){this.b.oc(a,b)};n.ld=function(a){this.b.ld(a)};n.Dc=function(a,b,c,d){this.b.Dc(a,b,c,d)};n.tb=function(){this.b.tb()};n.cd=function(){this.b.cd()};n.$c=function(){this.b.$c()};n.hd=function(){this.b.hd()};n.Wb=function(){this.b.Wb()};n.nb=function(){this.b.nb()};n.Rc=function(){this.b.Rc()};
n.sc=function(a){this.b.sc(a)};n.Vc=function(){this.b.Vc()};n.Pc=function(){this.b.Pc()};n.Uc=function(){this.b.Uc()};n.Yb=function(){this.b.Yb()};n.Ad=function(a){this.b.Ad(a)};n.Ob=function(a){this.b.Ob(a)};n.Qc=function(a){this.b.Qc(a)};n.Tc=function(){this.b.Tc()};n.Sc=function(a,b,c){this.b.Sc(a,b,c)};n.vc=function(a,b,c){this.b.vc(a,b,c)};n.uc=function(a,b,c){this.b.uc(a,b,c)};n.xa=function(){this.b.xa()};n.lb=function(a,b,c){this.b.lb(a,b,c)};n.ub=function(){this.b.ub()};n.tc=function(a){this.b.tc(a)};
n.Fc=function(){this.b.Fc()};function af(a,b,c){We.call(this,a);this.J=c;this.I=0;if(this.ga=b)this.Sa=b.Sa}t(af,We);af.prototype.jc=function(){return this.ga.jc()};af.prototype.error=function(a){u.b(a)};af.prototype.xa=function(){this.I++};af.prototype.ub=function(){if(!--this.I&&!this.J){var a=this.ga;a.b=a.g.pop()}};function bf(a,b,c){af.call(this,a,b,c)}t(bf,af);function cf(a,b){a.error(b,a.jc())}function df(a,b){cf(a,b);$e(a.ga,new af(a.f,a.ga,!1))}n=bf.prototype;n.nb=function(){df(this,"E_CSS_UNEXPECTED_SELECTOR")};
n.Rc=function(){df(this,"E_CSS_UNEXPECTED_FONT_FACE")};n.sc=function(){df(this,"E_CSS_UNEXPECTED_FOOTNOTE")};n.Vc=function(){df(this,"E_CSS_UNEXPECTED_VIEWPORT")};n.Pc=function(){df(this,"E_CSS_UNEXPECTED_DEFINE")};n.Uc=function(){df(this,"E_CSS_UNEXPECTED_REGION")};n.Yb=function(){df(this,"E_CSS_UNEXPECTED_PAGE")};n.Ob=function(){df(this,"E_CSS_UNEXPECTED_WHEN")};n.Qc=function(){df(this,"E_CSS_UNEXPECTED_FLOW")};n.Tc=function(){df(this,"E_CSS_UNEXPECTED_PAGE_TEMPLATE")};n.Sc=function(){df(this,"E_CSS_UNEXPECTED_PAGE_MASTER")};
n.vc=function(){df(this,"E_CSS_UNEXPECTED_PARTITION")};n.uc=function(){df(this,"E_CSS_UNEXPECTED_PARTITION_GROUP")};n.tc=function(){df(this,"E_CSS_UNEXPECTED_SELECTOR_FUNC")};n.Fc=function(){df(this,"E_CSS_UNEXPECTED_END_SELECTOR_FUNC")};n.lb=function(){this.error("E_CSS_UNEXPECTED_PROPERTY",this.jc())};var ef=[],ff=[],S=[],gf=[],hf=[],jf=[],kf=[],lf=[],T=[],mf=[],nf=[],of=[],pf=[];ef[1]=28;ef[36]=29;ef[7]=29;ef[9]=29;ef[14]=29;ef[18]=29;ef[20]=30;ef[13]=27;ef[0]=200;ff[1]=46;ff[0]=200;jf[1]=2;
jf[36]=4;jf[7]=6;jf[9]=8;jf[14]=10;jf[18]=14;S[37]=11;S[23]=12;S[35]=56;S[1]=1;S[36]=3;S[7]=5;S[9]=7;S[14]=9;S[12]=13;S[18]=55;S[50]=42;S[16]=41;gf[1]=1;gf[36]=3;gf[7]=5;gf[9]=7;gf[14]=9;gf[11]=200;gf[18]=55;hf[1]=2;hf[36]=4;hf[7]=6;hf[9]=8;hf[18]=14;hf[50]=42;hf[14]=10;hf[12]=13;kf[1]=15;kf[7]=16;kf[4]=17;kf[5]=18;kf[3]=19;kf[2]=20;kf[8]=21;kf[16]=22;kf[19]=23;kf[6]=24;kf[11]=25;kf[17]=26;kf[13]=48;kf[31]=47;kf[23]=54;kf[0]=44;lf[1]=31;lf[4]=32;lf[5]=32;lf[3]=33;lf[2]=34;lf[10]=40;lf[6]=38;
lf[31]=36;lf[24]=36;lf[32]=35;T[1]=45;T[16]=37;T[37]=37;T[38]=37;T[47]=37;T[48]=37;T[39]=37;T[49]=37;T[26]=37;T[25]=37;T[23]=37;T[24]=37;T[19]=37;T[21]=37;T[36]=37;T[18]=37;T[22]=37;T[11]=39;T[12]=43;T[17]=49;mf[0]=200;mf[12]=50;mf[13]=51;mf[14]=50;mf[15]=51;mf[10]=50;mf[11]=51;mf[17]=53;nf[0]=200;nf[12]=50;nf[13]=52;nf[14]=50;nf[15]=51;nf[10]=50;nf[11]=51;nf[17]=53;of[0]=200;of[12]=50;of[13]=51;of[14]=50;of[15]=51;of[10]=50;of[11]=51;pf[11]=0;pf[16]=0;pf[22]=1;pf[18]=1;pf[26]=2;pf[25]=2;pf[38]=3;
pf[37]=3;pf[48]=3;pf[47]=3;pf[39]=3;pf[49]=3;pf[41]=3;pf[23]=4;pf[24]=4;pf[36]=5;pf[19]=5;pf[21]=5;pf[0]=6;pf[52]=2;function qf(a,b,c,d){this.b=a;this.f=b;this.u=c;this.da=d;this.B=[];this.M={};this.g=this.I=null;this.A=!1;this.j=2;this.F=null;this.G=!1;this.w=this.J=null;this.l=[];this.h=[];this.T=this.V=!1}function rf(a,b){for(var c=[],d=a.B;;){c.push(d[b++]);if(b==d.length)break;if(","!=d[b++])throw Error("Unexpected state");}return c}
function sf(a,b,c){var d=a.B,e=d.length,f;do f=d[--e];while("undefined"!=typeof f&&"string"!=typeof f);var g=d.length-(e+1);1<g&&d.splice(e+1,g,new oc(d.slice(e+1,d.length)));if(","==b)return null;e++;do f=d[--e];while("undefined"!=typeof f&&("string"!=typeof f||","==f));g=d.length-(e+1);if("("==f){if(")"!=b)return a.u.error("E_CSS_MISMATCHED_C_PAR",c),a.b=nf,null;a=new qc(d[e-1],rf(a,e+1));d.splice(e-1,g+2,a);return null}return";"!=b||0<=e?(a.u.error("E_CSS_UNEXPECTED_VAL_END",c),a.b=nf,null):1<
g?new pc(rf(a,e+1)):d[0]}function tf(a,b,c){a.b=a.g?nf:mf;a.u.error(b,c)}
function uf(a,b,c){for(var d=a.B,e=a.u,f=d.pop(),g;;){var h=d.pop();if(11==b){for(g=[f];16==h;)g.unshift(d.pop()),h=d.pop();if("string"==typeof h){if("{"==h){for(;2<=g.length;)a=g.shift(),c=g.shift(),a=new Qb(e.fa(),a,c),g.unshift(a);d.push(new F(g[0]));return!0}if("("==h){b=d.pop();f=d.pop();f=new ec(e.fa(),ob(f,b),g);b=0;continue}}if(10==h){f.Pd()&&(f=new gc(e.fa(),f,null));b=0;continue}}else if("string"==typeof h){d.push(h);break}if(0>h)if(-31==h)f=new Lb(e.fa(),f);else if(-24==h)f=new Mb(e.fa(),
f);else return tf(a,"F_UNEXPECTED_STATE",c),!1;else{if(pf[b]>pf[h]){d.push(h);break}g=d.pop();switch(h){case 26:f=new Nb(e.fa(),g,f);break;case 52:f=new Ob(e.fa(),g,f);break;case 25:f=new Pb(e.fa(),g,f);break;case 38:f=new Rb(e.fa(),g,f);break;case 37:f=new Tb(e.fa(),g,f);break;case 48:f=new Sb(e.fa(),g,f);break;case 47:f=new Ub(e.fa(),g,f);break;case 39:case 49:f=new Vb(e.fa(),g,f);break;case 41:f=new Wb(e.fa(),g,f);break;case 23:f=new Xb(e.fa(),g,f);break;case 24:f=new Yb(e.fa(),g,f);break;case 36:f=
new Zb(e.fa(),g,f);break;case 19:f=new $b(e.fa(),g,f);break;case 21:f=new ac(e.fa(),g,f);break;case 18:if(1<d.length)switch(d[d.length-1]){case 22:d.pop();f=new fc(e.fa(),d.pop(),g,f);break;case 10:if(g.Pd())f=new gc(e.fa(),g,f);else return tf(a,"E_CSS_MEDIA_TEST",c),!1}else return tf(a,"E_CSS_EXPR_COND",c),!1;break;case 22:if(18!=b)return tf(a,"E_CSS_EXPR_COND",c),!1;case 10:return d.push(g),d.push(h),d.push(f),!1;default:return tf(a,"F_UNEXPECTED_STATE",c),!1}}}d.push(f);return!1}
function vf(a){for(var b=[];;){var c=P(a.f);switch(c.type){case 1:b.push(c.text);break;case 23:b.push("+");break;case 4:case 5:b.push(c.H);break;default:return b}R(a.f)}}
function wf(a){var b=!1,c=P(a.f);if(23===c.type)b=!0,R(a.f),c=P(a.f);else if(1===c.type&&("even"===c.text||"odd"===c.text))return R(a.f),[2,"odd"===c.text?1:0];switch(c.type){case 3:if(b&&0>c.H)break;case 1:if(b&&"-"===c.text.charAt(0))break;if("n"===c.text||"-n"===c.text){if(b&&c.b)break;b="-n"===c.text?-1:1;3===c.type&&(b=c.H);var d=0;R(a.f);var c=P(a.f),e=24===c.type,f=23===c.type||e;f&&(R(a.f),c=P(a.f));if(5===c.type){d=c.H;if(1/d===1/-0){if(d=0,f)break}else if(0>d){if(f)break}else if(0<=d&&!f)break;
R(a.f)}else if(f)break;return[b,e&&0<d?-d:d]}if("n-"===c.text||"-n-"===c.text){if(!b||!c.b)if(b="-n-"===c.text?-1:1,3===c.type&&(b=c.H),R(a.f),c=P(a.f),5===c.type&&!(0>c.H||1/c.H===1/-0))return R(a.f),[b,c.H]}else{if(d=c.text.match(/^n(-[0-9]+)$/)){if(b&&c.b)break;R(a.f);return[3===c.type?c.H:1,parseInt(d[1],10)]}if(d=c.text.match(/^-n(-[0-9]+)$/))return R(a.f),[-1,parseInt(d[1],10)]}break;case 5:if(!b||!(c.b||0>c.H))return R(a.f),[0,c.H]}return null}
function xf(a,b,c){a=a.u.fa();if(!a)return null;c=c||a.j;if(b){b=b.split(/\s+/);for(var d=0;d<b.length;d++)switch(b[d]){case "vertical":c=ic(a,c,new Lb(a,new cc(a,"pref-horizontal")));break;case "horizontal":c=ic(a,c,new cc(a,"pref-horizontal"));break;case "day":c=ic(a,c,new Lb(a,new cc(a,"pref-night-mode")));break;case "night":c=ic(a,c,new cc(a,"pref-night-mode"));break;default:c=a.h}}return c===a.j?null:new F(c)}
function yf(a){switch(a.h[a.h.length-1]){case "[selector]":case "font-face":case "-epubx-flow":case "-epubx-viewport":case "-epubx-define":case "-adapt-footnote-area":return!0}return!1}
function zf(a,b,c,d,e,f){var g=a.u,h=a.f,l=a.B,k,m,p,q;e&&(a.j=2,a.B.push("{"));a:for(;0<b;--b)switch(k=P(h),a.b[k.type]){case 28:if(18!=Q(h,1).type){yf(a)?(g.error("E_CSS_COLON_EXPECTED",Q(h,1)),a.b=nf):(a.b=jf,g.nb());continue}m=Q(h,2);if(!(m.b||1!=m.type&&6!=m.type)){if(0<=h.b)throw Error("F_CSSTOK_BAD_CALL mark");h.b=h.f}a.g=k.text;a.A=!1;R(h);R(h);a.b=kf;l.splice(0,l.length);continue;case 46:if(18!=Q(h,1).type){a.b=nf;g.error("E_CSS_COLON_EXPECTED",Q(h,1));continue}a.g=k.text;a.A=!1;R(h);R(h);
a.b=kf;l.splice(0,l.length);continue;case 29:a.b=jf;g.nb();continue;case 1:if(!k.b){a.b=of;g.error("E_CSS_SPACE_EXPECTED",k);continue}g.tb();case 2:if(34==Q(h,1).type)if(R(h),R(h),p=a.M[k.text],null!=p)switch(k=P(h),k.type){case 1:g.pb(p,k.text);a.b=f?gf:S;R(h);break;case 36:g.pb(p,null);a.b=f?gf:S;R(h);break;default:a.b=mf,g.error("E_CSS_NAMESPACE",k)}else a.b=mf,g.error("E_CSS_UNDECLARED_PREFIX",k);else g.pb(a.I,k.text),a.b=f?gf:S,R(h);continue;case 3:if(!k.b){a.b=of;g.error("E_CSS_SPACE_EXPECTED",
k);continue}g.tb();case 4:if(34==Q(h,1).type)switch(R(h),R(h),k=P(h),k.type){case 1:g.pb(null,k.text);a.b=f?gf:S;R(h);break;case 36:g.pb(null,null);a.b=f?gf:S;R(h);break;default:a.b=mf,g.error("E_CSS_NAMESPACE",k)}else g.pb(a.I,null),a.b=f?gf:S,R(h);continue;case 5:k.b&&g.tb();case 6:g.ld(k.text);a.b=f?gf:S;R(h);continue;case 7:k.b&&g.tb();case 8:g.dd(k.text);a.b=f?gf:S;R(h);continue;case 55:k.b&&g.tb();case 14:R(h);k=P(h);b:switch(k.type){case 1:g.nc(k.text,null);R(h);a.b=f?gf:S;continue;case 6:m=
k.text;R(h);switch(m){case "not":a.b=jf;g.tc("not");zf(a,Number.POSITIVE_INFINITY,!1,!1,!1,!0)?a.b=S:a.b=of;break a;case "lang":case "href-epub-type":if(k=P(h),1===k.type){p=[k.text];R(h);break}else break b;case "nth-child":case "nth-of-type":case "nth-last-child":case "nth-last-of-type":if(p=wf(a))break;else break b;default:p=vf(a)}k=P(h);if(11==k.type){g.nc(m,p);R(h);a.b=f?gf:S;continue}}g.error("E_CSS_PSEUDOCLASS_SYNTAX",k);a.b=mf;continue;case 42:R(h);k=P(h);switch(k.type){case 1:g.oc(k.text,
null);a.b=f?gf:S;R(h);continue;case 6:if(m=k.text,R(h),p=vf(a),k=P(h),11==k.type){g.oc(m,p);a.b=f?gf:S;R(h);continue}}g.error("E_CSS_PSEUDOELEM_SYNTAX",k);a.b=mf;continue;case 9:k.b&&g.tb();case 10:R(h);k=P(h);if(1==k.type)m=k.text,R(h);else if(36==k.type)m=null,R(h);else if(34==k.type)m="";else{a.b=of;g.error("E_CSS_ATTR",k);R(h);continue}k=P(h);if(34==k.type){p=m?a.M[m]:m;if(null==p){a.b=of;g.error("E_CSS_UNDECLARED_PREFIX",k);R(h);continue}R(h);k=P(h);if(1!=k.type){a.b=of;g.error("E_CSS_ATTR_NAME_EXPECTED",
k);continue}m=k.text;R(h);k=P(h)}else p="";switch(k.type){case 39:case 45:case 44:case 43:case 42:case 46:case 50:q=k.type;R(h);k=P(h);break;case 15:g.Dc(p,m,0,null);a.b=f?gf:S;R(h);continue;default:a.b=of;g.error("E_CSS_ATTR_OP_EXPECTED",k);continue}switch(k.type){case 1:case 2:g.Dc(p,m,q,k.text);R(h);k=P(h);break;default:a.b=of;g.error("E_CSS_ATTR_VAL_EXPECTED",k);continue}if(15!=k.type){a.b=of;g.error("E_CSS_ATTR",k);continue}a.b=f?gf:S;R(h);continue;case 11:g.cd();a.b=hf;R(h);continue;case 12:g.$c();
a.b=hf;R(h);continue;case 56:g.hd();a.b=hf;R(h);continue;case 13:a.V?(a.h.push("-epubx-region"),a.V=!1):a.T?(a.h.push("page"),a.T=!1):a.h.push("[selector]");g.xa();a.b=ef;R(h);continue;case 41:g.Wb();a.b=jf;R(h);continue;case 15:l.push(C(k.text));R(h);continue;case 16:try{l.push(Ve(k.text))}catch(r){g.error("E_CSS_COLOR",k),a.b=mf}R(h);continue;case 17:l.push(new xc(k.H));R(h);continue;case 18:l.push(new yc(k.H));R(h);continue;case 19:l.push(new D(k.H,k.text));R(h);continue;case 20:l.push(new vc(k.text));
R(h);continue;case 21:l.push(new Ac(ka(k.text,a.da)));R(h);continue;case 22:sf(a,",",k);l.push(",");R(h);continue;case 23:l.push(uc);R(h);continue;case 24:m=k.text.toLowerCase();"-epubx-expr"==m?(a.b=lf,a.j=0,l.push("{")):(l.push(m),l.push("("));R(h);continue;case 25:sf(a,")",k);R(h);continue;case 47:R(h);k=P(h);m=Q(h,1);if(1==k.type&&"important"==k.text.toLowerCase()&&(17==m.type||0==m.type||13==m.type)){R(h);a.A=!0;continue}tf(a,"E_CSS_SYNTAX",k);continue;case 54:m=Q(h,1);switch(m.type){case 4:case 3:case 5:if(!m.b){R(h);
continue}}a.b===kf&&0<=h.b?(Oe(h),a.b=jf,g.nb()):tf(a,"E_CSS_UNEXPECTED_PLUS",k);continue;case 26:R(h);case 48:h.b=-1;(m=sf(a,";",k))&&a.g&&g.lb(a.g,m,a.A);a.b=d?ff:ef;continue;case 44:R(h);h.b=-1;m=sf(a,";",k);if(c)return a.F=m,!0;a.g&&m&&g.lb(a.g,m,a.A);if(d)return!0;tf(a,"E_CSS_SYNTAX",k);continue;case 31:m=Q(h,1);9==m.type?(10!=Q(h,2).type||Q(h,2).b?(l.push(new cc(g.fa(),ob(k.text,m.text))),a.b=T):(l.push(k.text,m.text,"("),R(h)),R(h)):(2==a.j||3==a.j?"not"==k.text.toLowerCase()?(R(h),l.push(new dc(g.fa(),
!0,m.text))):("only"==k.text.toLowerCase()&&(R(h),k=m),l.push(new dc(g.fa(),!1,k.text))):l.push(new cc(g.fa(),k.text)),a.b=T);R(h);continue;case 38:l.push(null,k.text,"(");R(h);continue;case 32:l.push(new rb(g.fa(),k.H));R(h);a.b=T;continue;case 33:m=k.text;"%"==m&&(m=a.g&&a.g.match(/height|^(top|bottom)$/)?"vh":"vw");l.push(new bc(g.fa(),k.H,m));R(h);a.b=T;continue;case 34:l.push(new rb(g.fa(),k.text));R(h);a.b=T;continue;case 35:R(h);k=P(h);5!=k.type||k.b?tf(a,"E_CSS_SYNTAX",k):(l.push(new hc(g.fa(),
k.H)),R(h),a.b=T);continue;case 36:l.push(-k.type);R(h);continue;case 37:a.b=lf;uf(a,k.type,k);l.push(k.type);R(h);continue;case 45:"and"==k.text.toLowerCase()?(a.b=lf,uf(a,52,k),l.push(52),R(h)):tf(a,"E_CSS_SYNTAX",k);continue;case 39:uf(a,k.type,k)&&(a.g?a.b=kf:tf(a,"E_CSS_UNBALANCED_PAR",k));R(h);continue;case 43:uf(a,11,k)&&(a.g||3==a.j?tf(a,"E_CSS_UNEXPECTED_BRC",k):(1==a.j?g.Ob(l.pop()):(k=l.pop(),g.Ob(k)),a.h.push("media"),g.xa(),a.b=ef));R(h);continue;case 49:if(uf(a,11,k))if(a.g||3!=a.j)tf(a,
"E_CSS_UNEXPECTED_SEMICOL",k);else return a.w=l.pop(),a.G=!0,a.b=ef,R(h),!1;R(h);continue;case 40:l.push(k.type);R(h);continue;case 27:a.b=ef;R(h);g.ub();a.h.length&&a.h.pop();continue;case 30:m=k.text.toLowerCase();switch(m){case "import":R(h);k=P(h);if(2==k.type||8==k.type){a.J=k.text;R(h);k=P(h);if(17==k.type||0==k.type)return a.G=!0,R(h),!1;a.g=null;a.j=3;a.b=lf;l.push("{");continue}g.error("E_CSS_IMPORT_SYNTAX",k);a.b=mf;continue;case "namespace":R(h);k=P(h);switch(k.type){case 1:m=k.text;R(h);
k=P(h);if((2==k.type||8==k.type)&&17==Q(h,1).type){a.M[m]=k.text;R(h);R(h);continue}break;case 2:case 8:if(17==Q(h,1).type){a.I=k.text;R(h);R(h);continue}}g.error("E_CSS_NAMESPACE_SYNTAX",k);a.b=mf;continue;case "charset":R(h);k=P(h);if(2==k.type&&17==Q(h,1).type){m=k.text.toLowerCase();"utf-8"!=m&&"utf-16"!=m&&g.error("E_CSS_UNEXPECTED_CHARSET "+m,k);R(h);R(h);continue}g.error("E_CSS_CHARSET_SYNTAX",k);a.b=mf;continue;case "font-face":case "-epubx-page-template":case "-epubx-define":case "-epubx-viewport":if(12==
Q(h,1).type){R(h);R(h);switch(m){case "font-face":g.Rc();break;case "-epubx-page-template":g.Tc();break;case "-epubx-define":g.Pc();break;case "-epubx-viewport":g.Vc()}a.h.push(m);g.xa();continue}break;case "-adapt-footnote-area":R(h);k=P(h);switch(k.type){case 12:R(h);g.sc(null);a.h.push(m);g.xa();continue;case 50:if(R(h),k=P(h),1==k.type&&12==Q(h,1).type){m=k.text;R(h);R(h);g.sc(m);a.h.push("-adapt-footnote-area");g.xa();continue}}break;case "-epubx-region":R(h);g.Uc();a.V=!0;a.b=jf;continue;case "page":R(h);
g.Yb();a.T=!0;a.b=hf;continue;case "top-left-corner":case "top-left":case "top-center":case "top-right":case "top-right-corner":case "right-top":case "right-middle":case "right-bottom":case "bottom-right-corner":case "bottom-right":case "bottom-center":case "bottom-left":case "bottom-left-corner":case "left-bottom":case "left-middle":case "left-top":R(h);k=P(h);if(12==k.type){R(h);g.Ad(m);a.h.push(m);g.xa();continue}break;case "-epubx-when":R(h);a.g=null;a.j=1;a.b=lf;l.push("{");continue;case "media":R(h);
a.g=null;a.j=2;a.b=lf;l.push("{");continue;case "-epubx-flow":if(1==Q(h,1).type&&12==Q(h,2).type){g.Qc(Q(h,1).text);R(h);R(h);R(h);a.h.push(m);g.xa();continue}break;case "-epubx-page-master":case "-epubx-partition":case "-epubx-partition-group":R(h);k=P(h);q=p=null;var w=[];1==k.type&&(p=k.text,R(h),k=P(h));18==k.type&&1==Q(h,1).type&&(q=Q(h,1).text,R(h),R(h),k=P(h));for(;6==k.type&&"class"==k.text.toLowerCase()&&1==Q(h,1).type&&11==Q(h,2).type;)w.push(Q(h,1).text),R(h),R(h),R(h),k=P(h);if(12==k.type){R(h);
switch(m){case "-epubx-page-master":g.Sc(p,q,w);break;case "-epubx-partition":g.vc(p,q,w);break;case "-epubx-partition-group":g.uc(p,q,w)}a.h.push(m);g.xa();continue}break;case "":g.error("E_CSS_UNEXPECTED_AT"+m,k);a.b=of;continue;default:g.error("E_CSS_AT_UNKNOWN "+m,k);a.b=mf;continue}g.error("E_CSS_AT_SYNTAX "+m,k);a.b=mf;continue;case 50:if(c||d)return!0;a.l.push(k.type+1);R(h);continue;case 52:if(c||d)return!0;if(!a.l.length){a.b=ef;continue}case 51:0<a.l.length&&a.l[a.l.length-1]==k.type&&a.l.pop();
a.l.length||13!=k.type||(a.b=ef);R(h);continue;case 53:if(c||d)return!0;a.l.length||(a.b=ef);R(h);continue;case 200:return f&&(R(h),g.Fc()),!0;default:if(c||d)return!0;if(e)return uf(a,11,k)?(a.F=l.pop(),!0):!1;if(f)return 51==k.type?g.error(k.text,k):g.error("E_CSS_SYNTAX",k),!1;a.b===kf&&0<=h.b?(Oe(h),a.b=jf,g.nb()):a.b!==mf&&a.b!==of&&a.b!==nf?(51==k.type?g.error(k.text,k):g.error("E_CSS_SYNTAX",k),a.b=yf(a)?nf:of):R(h)}return!1}function Af(a){We.call(this,null);this.f=a}t(Af,We);
Af.prototype.error=function(a){throw Error(a);};Af.prototype.fa=function(){return this.f};
function Bf(a,b,c,d,e){var f=I("parseStylesheet"),g=new qf(ef,a,b,c),h=null;e&&(h=Cf(new Me(e,b),b,c));if(h=xf(g,d,h&&h.oa()))b.Ob(h),b.xa();$d(function(){for(;!zf(g,100,!1,!1,!1,!1);){if(g.G){var a=ka(g.J,c);g.w&&(b.Ob(g.w),b.xa());var d=I("parseStylesheet.import");Df(a,b,null,null).then(function(){g.w&&b.ub();g.G=!1;g.J=null;g.w=null;L(d,!0)});return K(d)}a=Yd();if(a.va)return a}return J(!1)}).then(function(){h&&b.ub();L(f,!0)});return K(f)}
function Ef(a,b,c,d,e){return Jd("parseStylesheetFromText",function(f){var g=new Me(a,b);Bf(g,b,c,d,e).ra(f)},function(b,c){u.b(c,"Failed to parse stylesheet text: "+a);L(b,!1)})}function Df(a,b,c,d){return Jd("parseStylesheetFromURL",function(e){Pe(a).then(function(f){f.responseText?Ef(f.responseText,b,a,c,d).then(function(b){b||u.b("Failed to parse stylesheet from "+a);L(e,!0)}):L(e,!0)})},function(b,c){u.b(c,"Exception while fetching and parsing:",a);L(b,!0)})}
function Ff(a,b){var c=new qf(kf,b,new Af(a),"");zf(c,Number.POSITIVE_INFINITY,!0,!1,!1,!1);return c.F}function Cf(a,b,c){a=new qf(lf,a,b,c);zf(a,Number.POSITIVE_INFINITY,!1,!1,!0,!1);return a.F}var Gf={"z-index":!0,"column-count":!0,"flow-linger":!0,opacity:!0,page:!0,"flow-priority":!0,utilization:!0};
function Hf(a,b,c){if(b.Od())a:{b=b.f;a=b.evaluate(a);switch(typeof a){case "number":c=Gf[c]?a==Math.round(a)?new yc(a):new xc(a):new D(a,"px");break a;case "string":c=a?Ff(b.b,new Me(a,null)):B;break a;case "boolean":c=a?td:Qc;break a;case "undefined":c=B;break a}throw Error("E_UNEXPECTED");}else c=b;return c};function If(a,b,c,d){this.ha=a;this.ba=b;this.aa=c;this.Y=d}function Jf(a,b){this.f=a;this.b=b}function Kf(){this.bottom=this.right=this.top=this.left=0}function Lf(a,b,c,d){this.b=a;this.f=b;this.h=c;this.g=d}function Mf(a,b,c,d){this.ba=a;this.Y=b;this.ha=c;this.aa=d;this.right=this.left=null}function Nf(a,b){return a.b.b-b.b.b||a.b.f-b.b.f}function Of(a){this.b=a}function Pf(a,b,c){a=a.b;for(var d=a.length,e=a[d-1],f=0;f<d;f++){var g=a[f];b.push(e.b<g.b?new Lf(e,g,1,c):new Lf(g,e,-1,c));e=g}}
function Qf(a,b,c,d){for(var e=[],f=0;20>f;f++){var g=2*f*Math.PI/20;e.push(new Jf(a+c*Math.sin(g),b+d*Math.cos(g)))}return new Of(e)}function Rf(a,b,c,d){return new Of([new Jf(a,b),new Jf(c,b),new Jf(c,d),new Jf(a,d)])}function Sf(a,b,c,d){this.f=a;this.h=b;this.b=c;this.g=d}function Tf(a,b){var c=a.b.f+(a.f.f-a.b.f)*(b-a.b.b)/(a.f.b-a.b.b);if(isNaN(c))throw Error("Bad intersection");return c}
function Uf(a,b,c,d){var e,f;b.f.b<c&&u.b("Error: inconsistent segment (1)");b.b.b<=c?(c=Tf(b,c),e=b.h):(c=b.b.f,e=0);b.f.b>=d?(d=Tf(b,d),f=b.h):(d=b.f.f,f=0);c<d?(a.push(new Sf(c,e,b.g,-1)),a.push(new Sf(d,f,b.g,1))):(a.push(new Sf(d,f,b.g,-1)),a.push(new Sf(c,e,b.g,1)))}
function Vf(a,b,c){c=b+c;for(var d=Array(c),e=Array(c),f=0;f<=c;f++)d[f]=0,e[f]=0;for(var g=[],h=!1,l=a.length,k=0;k<l;k++){var m=a[k];d[m.b]+=m.h;e[m.b]+=m.g;for(var p=!1,f=0;f<b;f++)if(d[f]&&!e[f]){p=!0;break}if(p)for(f=b;f<=c;f++)if(d[f]||e[f]){p=!1;break}h!=p&&(g.push(m.f),h=p)}return g}function Wf(a,b){return b?Math.ceil(a/b)*b:a}function Xf(a,b){return b?Math.floor(a/b)*b:a}function Yf(a){return new Jf(a.b,-a.f)}function Zf(a){return new If(a.ba,-a.aa,a.Y,-a.ha)}
function $f(a){return new Of(Oa(a.b,Yf))}
function ag(a,b,c,d,e){e&&(a=Zf(a),b=Oa(b,$f),c=Oa(c,$f));e=b.length;var f=c?c.length:0,g=[],h=[],l,k,m;for(l=0;l<e;l++)Pf(b[l],h,l);for(l=0;l<f;l++)Pf(c[l],h,l+e);b=h.length;h.sort(Nf);for(c=0;h[c].g>=e;)c++;c=h[c].b.b;c>a.ba&&g.push(new Mf(a.ba,c,a.aa,a.aa));l=0;for(var p=[];l<b&&(m=h[l]).b.b<c;)m.f.b>c&&p.push(m),l++;for(;l<b||0<p.length;){var q=a.Y,w=Wf(Math.ceil(c+8),d);for(k=0;k<p.length&&q>w;k++)m=p[k],m.b.f==m.f.f?m.f.b<q&&(q=Math.max(Xf(m.f.b,d),w)):m.b.f!=m.f.f&&(q=w);q>a.Y&&(q=a.Y);for(;l<
b&&(m=h[l]).b.b<q;)if(m.f.b<c)l++;else if(m.b.b<w){if(m.b.b!=m.f.b||m.b.b!=c)p.push(m),q=w;l++}else{k=Xf(m.b.b,d);k<q&&(q=k);break}w=[];for(k=0;k<p.length;k++)Uf(w,p[k],c,q);w.sort(function(a,b){return a.f-b.f||a.g-b.g});w=Vf(w,e,f);if(w.length){var r=0,x=a.ha;for(k=0;k<w.length;k+=2){var G=Math.max(a.ha,w[k]),N=Math.min(a.aa,w[k+1])-G;N>r&&(r=N,x=G)}r?g.push(new Mf(c,q,Math.max(x,a.ha),Math.min(x+r,a.aa))):g.push(new Mf(c,q,a.aa,a.aa))}else g.push(new Mf(c,q,a.aa,a.aa));if(q==a.Y)break;c=q;for(k=
p.length-1;0<=k;k--)p[k].f.b<=q&&p.splice(k,1)}bg(a,g);return g}function bg(a,b){for(var c=b.length-1,d=new Mf(a.Y,a.Y,a.ha,a.aa);0<=c;){var e=d,d=b[c];d.ha==e.ha&&d.aa==e.aa&&(e.ba=d.ba,b.splice(c,1),d=e);c--}}function cg(a,b){for(var c=0,d=a.length;c<d;){var e=Math.floor((c+d)/2);b>=a[e].Y?c=e+1:d=e}return c}
function dg(a,b,c,d){for(var e=c.ba,f=c.aa-c.ha,g=c.Y-c.ba,h=cg(b,e);;){var l=e+g;if(l>a.Y)break;for(var k=a.ha,m=a.aa,p=h;p<b.length&&b[p].ba<l;p++){var q=b[p];q.ha>k&&(k=q.ha);q.aa<m&&(m=q.aa)}if(k+f<=m||h>=b.length){"left"==d?(c.ha=k,c.aa=k+f):(c.ha=m-f,c.aa=m);c.Y+=e-c.ba;c.ba=e;break}e=b[h].Y;h++}}
function eg(a,b,c,d){for(c=[new Mf(c.ba,c.Y,c.ha,c.aa)];0<c.length&&c[0].Y<=a.ba;)c.shift();if(c.length){c[0].ba<a.ba&&(c[0].ba=a.ba);var e;e=b.length?b[b.length-1].Y:a.ba;e<a.Y&&b.push(new Mf(e,a.Y,a.ha,a.aa));for(var f=cg(b,c[0].ba),g=0;g<c.length;g++){var h=c[g];if(f==b.length)break;b[f].ba<h.ba&&(e=b[f],f++,b.splice(f,0,new Mf(h.ba,e.Y,e.ha,e.aa)),e.Y=h.ba);for(;f<b.length&&(e=b[f++],e.Y>h.Y&&(b.splice(f,0,new Mf(h.Y,e.Y,e.ha,e.aa)),e.Y=h.Y),h.ha!=h.aa&&("left"==d?e.ha=Math.min(h.aa,a.aa):e.aa=
Math.max(h.ha,a.ha)),e.Y!=h.Y););}bg(a,b)}};function fg(){this.b={}}t(fg,mc);fg.prototype.Bb=function(a){this.b[a.name]=!0;return a};fg.prototype.ob=function(a){this.Cb(a.values);return a};function gg(a){this.value=a}t(gg,mc);gg.prototype.ac=function(a){this.value=a.H;return a};function hg(a,b){if(a){var c=new gg(b);try{return a.$(c),c.value}catch(d){u.b(d,"toInt: ")}}return b}function ig(){this.f=!1;this.b=[];this.name=null}t(ig,mc);ig.prototype.cc=function(a){this.f&&this.b.push(a);return null};
ig.prototype.bc=function(a){this.f&&!a.H&&this.b.push(new D(0,"px"));return null};ig.prototype.ob=function(a){this.Cb(a.values);return null};ig.prototype.qb=function(a){this.f||(this.f=!0,this.Cb(a.values),this.f=!1,this.name=a.name.toLowerCase());return null};
function jg(a,b,c,d,e,f){if(a){var g=new ig;try{a.$(g);var h;a:{if(0<g.b.length){a=[];for(var l=0;l<g.b.length;l++){var k=g.b[l];if("%"==k.ea){var m=l%2?e:d;3==l&&"circle"==g.name&&(m=Math.sqrt((d*d+e*e)/2));a.push(k.H*m/100)}else a.push(k.H*Ab(f,k.ea,!1))}switch(g.name){case "polygon":if(!(a.length%2)){f=[];for(g=0;g<a.length;g+=2)f.push(new Jf(b+a[g],c+a[g+1]));h=new Of(f);break a}break;case "rectangle":if(4==a.length){h=Rf(b+a[0],c+a[1],b+a[0]+a[2],c+a[1]+a[3]);break a}break;case "ellipse":if(4==
a.length){h=Qf(b+a[0],c+a[1],a[2],a[3]);break a}break;case "circle":if(3==a.length){h=Qf(b+a[0],c+a[1],a[2],a[2]);break a}}}h=null}return h}catch(p){u.b(p,"toShape:")}}return Rf(b,c,b+d,c+e)}function kg(a){this.f=a;this.b={};this.name=null}t(kg,mc);kg.prototype.Bb=function(a){this.name=a.toString();this.b[this.name]=this.f?0:(this.b[this.name]||0)+1;return a};kg.prototype.ac=function(a){this.name&&(this.b[this.name]+=a.H-(this.f?0:1));return a};kg.prototype.ob=function(a){this.Cb(a.values);return a};
function lg(a,b){var c=new kg(b);try{a.$(c)}catch(d){u.b(d,"toCounters:")}return c.b}function mg(a,b){this.b=a;this.f=b}t(mg,nc);mg.prototype.dc=function(a){return new Ac(this.f.xc(a.url,this.b))};function ng(a){this.g=this.h=null;this.f=0;this.b=a}function og(a,b){this.b=-1;this.f=a;this.g=b}function pg(){this.b=[];this.f=[];this.match=[];this.g=[];this.error=[];this.h=!0}pg.prototype.connect=function(a,b){for(var c=0;c<a.length;c++)this.f[a[c]].b=b;a.splice(0,a.length)};
pg.prototype.clone=function(){for(var a=new pg,b=0;b<this.b.length;b++){var c=this.b[b],d=new ng(c.b);d.f=c.f;a.b.push(d)}for(b=0;b<this.f.length;b++)c=this.f[b],d=new og(c.f,c.g),d.b=c.b,a.f.push(d);a.match.push.apply(a.match,this.match);a.g.push.apply(a.g,this.g);a.error.push.apply(a.error,this.error);return a};
function qg(a,b,c,d){var e=a.b.length,f=new ng(rg);f.f=0<=d?c?2*d+1:2*d+2:c?-1:-2;a.b.push(f);a.connect(b,e);c=new og(e,!0);e=new og(e,!1);b.push(a.f.length);a.f.push(e);b.push(a.f.length);a.f.push(c)}function sg(a){return 1==a.b.length&&!a.b[0].f&&a.b[0].b instanceof tg}
function ug(a,b,c){if(b.b.length){var d=a.b.length;if(4==c&&1==d&&sg(b)&&sg(a)){c=a.b[0].b;b=b.b[0].b;var d={},e={},f;for(f in c.f)d[f]=c.f[f];for(f in b.f)d[f]=b.f[f];for(var g in c.g)e[g]=c.g[g];for(g in b.g)e[g]=b.g[g];a.b[0].b=new tg(c.b|b.b,d,e)}else{for(f=0;f<b.b.length;f++)a.b.push(b.b[f]);4==c?(a.h=!0,a.connect(a.g,d)):a.connect(a.match,d);g=a.f.length;for(f=0;f<b.f.length;f++)e=b.f[f],e.f+=d,0<=e.b&&(e.b+=d),a.f.push(e);for(f=0;f<b.match.length;f++)a.match.push(b.match[f]+g);3==c&&a.connect(a.match,
d);if(2==c||3==c)for(f=0;f<b.g.length;f++)a.match.push(b.g[f]+g);else if(a.h){for(f=0;f<b.g.length;f++)a.g.push(b.g[f]+g);a.h=b.h}else for(f=0;f<b.g.length;f++)a.error.push(b.g[f]+g);for(f=0;f<b.error.length;f++)a.error.push(b.error[f]+g);b.b=null;b.f=null}}}var U={};function vg(){}t(vg,mc);vg.prototype.h=function(a,b){var c=a[b].$(this);return c?[c]:null};function tg(a,b,c){this.b=a;this.f=b;this.g=c}t(tg,vg);n=tg.prototype;n.Dd=function(a){return this.b&1?a:null};
n.Ed=function(a){return this.b&2048?a:null};n.yc=function(a){return this.b&2?a:null};n.Bb=function(a){var b=this.f[a.name.toLowerCase()];return b?b:this.b&4?a:null};n.cc=function(a){return a.H||this.b&512?0>a.H&&!(this.b&256)?null:this.g[a.ea]?a:null:"%"==a.ea&&this.b&1024?a:null};n.bc=function(a){return a.H?0>=a.H&&!(this.b&256)?null:this.b&16?a:null:this.b&512?a:null};n.ac=function(a){return a.H?0>=a.H&&!(this.b&256)?null:this.b&48?a:(a=this.f[""+a.H])?a:null:this.b&512?a:null};
n.Yc=function(a){return this.b&64?a:null};n.dc=function(a){return this.b&128?a:null};n.ob=function(){return null};n.Ab=function(){return null};n.qb=function(){return null};n.$b=function(){return null};var rg=new tg(0,U,U);
function wg(a){this.b=new ng(null);var b=this.g=new ng(null),c=a.b.length;a.b.push(this.b);a.b.push(b);a.connect(a.match,c);a.connect(a.g,c+1);a.connect(a.error,c+1);for(b=0;b<a.f.length;b++){var d=a.f[b];d.g?a.b[d.f].h=a.b[d.b]:a.b[d.f].g=a.b[d.b]}for(b=0;b<c;b++)if(!a.b[b].g||!a.b[b].h)throw Error("Invalid validator state");this.f=a.b[0]}t(wg,vg);
function xg(a,b,c,d){for(var e=c?[]:b,f=a.f,g=d,h=null,l=null;f!==a.b&&f!==a.g;)if(g>=b.length)f=f.g;else{var k=b[g],m;if(f.f)m=!0,-1==f.f?(h?h.push(l):h=[l],l=[]):-2==f.f?0<h.length?l=h.pop():l=null:0<f.f&&!(f.f%2)?l[Math.floor((f.f-1)/2)]="taken":m=null==l[Math.floor((f.f-1)/2)],f=m?f.h:f.g;else{if(!g&&!c&&f.b instanceof yg&&a instanceof yg){if(m=(new oc(b)).$(f.b)){g=b.length;f=f.h;continue}}else if(!g&&!c&&f.b instanceof zg&&a instanceof yg){if(m=(new pc(b)).$(f.b)){g=b.length;f=f.h;continue}}else m=
k.$(f.b);if(m){if(m!==k&&b===e)for(e=[],k=0;k<g;k++)e[k]=b[k];b!==e&&(e[g-d]=m);g++;f=f.h}else f=f.g}}return f===a.b&&(c?0<e.length:g==b.length)?e:null}n=wg.prototype;n.eb=function(a){for(var b=null,c=this.f;c!==this.b&&c!==this.g;)a?c.f?c=c.h:(b=a.$(c.b))?(a=null,c=c.h):c=c.g:c=c.g;return c===this.b?b:null};n.Dd=function(a){return this.eb(a)};n.Ed=function(a){return this.eb(a)};n.yc=function(a){return this.eb(a)};n.Bb=function(a){return this.eb(a)};n.cc=function(a){return this.eb(a)};n.bc=function(a){return this.eb(a)};
n.ac=function(a){return this.eb(a)};n.Yc=function(a){return this.eb(a)};n.dc=function(a){return this.eb(a)};n.ob=function(){return null};n.Ab=function(){return null};n.qb=function(a){return this.eb(a)};n.$b=function(){return null};function yg(a){wg.call(this,a)}t(yg,wg);yg.prototype.ob=function(a){var b=xg(this,a.values,!1,0);return b===a.values?a:b?new oc(b):null};
yg.prototype.Ab=function(a){for(var b=this.f,c=!1;b;){if(b.b instanceof zg){c=!0;break}b=b.g}return c?(b=xg(this,a.values,!1,0),b===a.values?a:b?new pc(b):null):null};yg.prototype.h=function(a,b){return xg(this,a,!0,b)};function zg(a){wg.call(this,a)}t(zg,wg);zg.prototype.ob=function(a){return this.eb(a)};zg.prototype.Ab=function(a){var b=xg(this,a.values,!1,0);return b===a.values?a:b?new pc(b):null};zg.prototype.h=function(a,b){for(var c=this.f,d;c!==this.g;){if(d=c.b.h(a,b))return d;c=c.g}return null};
function Ag(a,b){wg.call(this,b);this.name=a}t(Ag,wg);Ag.prototype.eb=function(){return null};Ag.prototype.qb=function(a){if(a.name.toLowerCase()!=this.name)return null;var b=xg(this,a.values,!1,0);return b===a.values?a:b?new qc(a.name,b):null};function Bg(){}Bg.prototype.b=function(a,b){return b};Bg.prototype.g=function(){};function Cg(a,b){this.name=b;this.h=a.g[this.name]}t(Cg,Bg);
Cg.prototype.b=function(a,b,c){if(c.values[this.name])return b;if(a=this.h.h(a,b)){var d=a.length;this.g(1<d?new oc(a):a[0],c);return b+d}return b};Cg.prototype.g=function(a,b){b.values[this.name]=a};function Dg(a,b){Cg.call(this,a,b[0]);this.f=b}t(Dg,Cg);Dg.prototype.g=function(a,b){for(var c=0;c<this.f.length;c++)b.values[this.f[c]]=a};function Eg(a,b){this.f=a;this.Ud=b}t(Eg,Bg);
Eg.prototype.b=function(a,b,c){var d=b;if(this.Ud)if(a[b]==uc){if(++b==a.length)return d}else return d;var e=this.f[0].b(a,b,c);if(e==b)return d;b=e;for(d=1;d<this.f.length&&b<a.length;d++){e=this.f[d].b(a,b,c);if(e==b)break;b=e}return b};function Fg(){this.b=this.bb=null;this.error=!1;this.values={};this.f=null}n=Fg.prototype;n.clone=function(){var a=new this.constructor;a.bb=this.bb;a.b=this.b;a.f=this.f;return a};n.Fd=function(a,b){this.bb=a;this.b=b};n.Rb=function(){this.error=!0;return 0};
function Gg(a,b){a.Rb([b]);return null}n.Dd=function(a){return Gg(this,a)};n.yc=function(a){return Gg(this,a)};n.Bb=function(a){return Gg(this,a)};n.cc=function(a){return Gg(this,a)};n.bc=function(a){return Gg(this,a)};n.ac=function(a){return Gg(this,a)};n.Yc=function(a){return Gg(this,a)};n.dc=function(a){return Gg(this,a)};n.ob=function(a){this.Rb(a.values);return null};n.Ab=function(){this.error=!0;return null};n.qb=function(a){return Gg(this,a)};n.$b=function(){this.error=!0;return null};
function Hg(){Fg.call(this)}t(Hg,Fg);Hg.prototype.Rb=function(a){for(var b=0,c=0;b<a.length;){var d=this.bb[c].b(a,b,this);if(d>b)b=d,c=0;else if(++c==this.bb.length){this.error=!0;break}}return b};function Ig(){Fg.call(this)}t(Ig,Fg);Ig.prototype.Rb=function(a){if(a.length>this.bb.length||!a.length)return this.error=!0,0;for(var b=0;b<this.bb.length;b++){for(var c=b;c>=a.length;)c=1==c?0:c-2;if(this.bb[b].b(a,c,this)!=c+1)return this.error=!0,0}return a.length};function Jg(){Fg.call(this)}t(Jg,Fg);
Jg.prototype.Rb=function(a){for(var b=a.length,c=0;c<a.length;c++)if(a[c]===uc){b=c;break}if(b>this.bb.length||!a.length)return this.error=!0,0;for(c=0;c<this.bb.length;c++){for(var d=c;d>=b;)d=1==d?0:d-2;var e;if(b+1<a.length)for(e=b+c+1;e>=a.length;)e-=e==b+2?1:2;else e=d;if(2!=this.bb[c].b([a[d],a[e]],0,this))return this.error=!0,0}return a.length};function Kg(){Fg.call(this)}t(Kg,Hg);
Kg.prototype.Ab=function(a){for(var b={},c=0;c<a.values.length;c++){this.values={};if(a.values[c]instanceof pc)this.error=!0;else{a.values[c].$(this);for(var d=b,e=this.values,f=0;f<this.b.length;f++){var g=this.b[f],h=e[g]||this.f.l[g],l=d[g];l||(l=[],d[g]=l);l.push(h)}this.values["background-color"]&&c!=a.values.length-1&&(this.error=!0)}if(this.error)return null}this.values={};for(var k in b)this.values[k]="background-color"==k?b[k].pop():new pc(b[k]);return null};function Lg(){Fg.call(this)}
t(Lg,Hg);Lg.prototype.Fd=function(a,b){Hg.prototype.Fd.call(this,a,b);this.b.push("font-family","line-height","font-size")};
Lg.prototype.Rb=function(a){var b=Hg.prototype.Rb.call(this,a);if(b+2>a.length)return this.error=!0,b;this.error=!1;var c=this.f.g;if(!a[b].$(c["font-size"]))return this.error=!0,b;this.values["font-size"]=a[b++];if(a[b]===uc){b++;if(b+2>a.length||!a[b].$(c["line-height"]))return this.error=!0,b;this.values["line-height"]=a[b++]}var d=b==a.length-1?a[b]:new oc(a.slice(b,a.length));if(!d.$(c["font-family"]))return this.error=!0,b;this.values["font-family"]=d;return a.length};
Lg.prototype.Ab=function(a){a.values[0].$(this);if(this.error)return null;for(var b=[this.values["font-family"]],c=1;c<a.values.length;c++)b.push(a.values[c]);a=new pc(b);a.$(this.f.g["font-family"])?this.values["font-family"]=a:this.error=!0;return null};Lg.prototype.Bb=function(a){if(a=this.f.f[a.name])for(var b in a)this.values[b]=a[b];else this.error=!0;return null};var Mg={SIMPLE:Hg,INSETS:Ig,INSETS_SLASH:Jg,COMMA:Kg,FONT:Lg};
function Ng(){this.g={};this.w={};this.l={};this.b={};this.f={};this.h={};this.u=[];this.j=[]}function Og(a,b){var c;if(3==b.type)c=new D(b.H,b.text);else if(7==b.type)c=Ve(b.text);else if(1==b.type)c=C(b.text);else throw Error("unexpected replacement");if(sg(a)){var d=a.b[0].b.f,e;for(e in d)d[e]=c;return a}throw Error("unexpected replacement");}
function Pg(a,b,c){for(var d=new pg,e=0;e<b;e++)ug(d,a.clone(),1);if(c==Number.POSITIVE_INFINITY)ug(d,a,3);else for(e=b;e<c;e++)ug(d,a.clone(),2);return d}function Qg(a){var b=new pg,c=b.b.length;b.b.push(new ng(a));a=new og(c,!0);var d=new og(c,!1);b.connect(b.match,c);b.h?(b.g.push(b.f.length),b.h=!1):b.error.push(b.f.length);b.f.push(d);b.match.push(b.f.length);b.f.push(a);return b}
function Rg(a,b){var c;switch(a){case "COMMA":c=new zg(b);break;case "SPACE":c=new yg(b);break;default:c=new Ag(a.toLowerCase(),b)}return Qg(c)}
function Sg(a){a.b.HASHCOLOR=Qg(new tg(64,U,U));a.b.POS_INT=Qg(new tg(32,U,U));a.b.POS_NUM=Qg(new tg(16,U,U));a.b.POS_PERCENTAGE=Qg(new tg(8,U,{"%":B}));a.b.NEGATIVE=Qg(new tg(256,U,U));a.b.ZERO=Qg(new tg(512,U,U));a.b.ZERO_PERCENTAGE=Qg(new tg(1024,U,U));a.b.POS_LENGTH=Qg(new tg(8,U,{em:B,ex:B,ch:B,rem:B,vh:B,vw:B,vmin:B,vmax:B,cm:B,mm:B,"in":B,px:B,pt:B,pc:B,q:B}));a.b.POS_ANGLE=Qg(new tg(8,U,{deg:B,grad:B,rad:B,turn:B}));a.b.POS_TIME=Qg(new tg(8,U,{s:B,ms:B}));a.b.FREQUENCY=Qg(new tg(8,U,{Hz:B,
kHz:B}));a.b.RESOLUTION=Qg(new tg(8,U,{dpi:B,dpcm:B,dppx:B}));a.b.URI=Qg(new tg(128,U,U));a.b.IDENT=Qg(new tg(4,U,U));a.b.STRING=Qg(new tg(2,U,U));a.b.SLASH=Qg(new tg(2048,U,U));var b={"font-family":C("sans-serif")};a.f.caption=b;a.f.icon=b;a.f.menu=b;a.f["message-box"]=b;a.f["small-caption"]=b;a.f["status-bar"]=b}function Tg(a){return!!a.match(/^[A-Z_0-9]+$/)}
function Ug(a,b,c){var d=P(b);if(0==d.type)return null;var e={"":!0};if(14==d.type){do{R(b);d=P(b);if(1!=d.type)throw Error("Prefix name expected");e[d.text]=!0;R(b);d=P(b)}while(16==d.type);if(15!=d.type)throw Error("']' expected");R(b);d=P(b)}if(1!=d.type)throw Error("Property name expected");if(2==c?"SHORTHANDS"==d.text:"DEFAULTS"==d.text)return R(b),null;d=d.text;R(b);if(2!=c){if(39!=P(b).type)throw Error("'=' expected");Tg(d)||(a.w[d]=e)}else if(18!=P(b).type)throw Error("':' expected");return d}
function Vg(a,b){for(;;){var c=Ug(a,b,1);if(!c)break;for(var d=[],e=[],f="",g,h=!0,l=function(){if(!d.length)throw Error("No values");var a;if(1==d.length)a=d[0];else{var b=f,c=d;a=new pg;if("||"==b){for(b=0;b<c.length;b++){var e=new pg,g=e;if(g.b.length)throw Error("invalid call");var h=new ng(rg);h.f=2*b+1;g.b.push(h);var h=new og(0,!0),k=new og(0,!1);g.g.push(g.f.length);g.f.push(k);g.match.push(g.f.length);g.f.push(h);ug(e,c[b],1);qg(e,e.match,!1,b);ug(a,e,b?4:1)}c=new pg;if(c.b.length)throw Error("invalid call");
qg(c,c.match,!0,-1);ug(c,a,3);a=[c.match,c.g,c.error];for(b=0;b<a.length;b++)qg(c,a[b],!1,-1);a=c}else{switch(b){case " ":e=1;break;case "|":case "||":e=4;break;default:throw Error("unexpected op");}for(b=0;b<c.length;b++)ug(a,c[b],b?e:1)}}return a},k=function(a){if(h)throw Error("'"+a+"': unexpected");if(f&&f!=a)throw Error("mixed operators: '"+a+"' and '"+f+"'");f=a;h=!0},m=null;!m;)switch(R(b),g=P(b),g.type){case 1:h||k(" ");if(Tg(g.text)){var p=a.b[g.text];if(!p)throw Error("'"+g.text+"' unexpected");
d.push(p.clone())}else p={},p[g.text.toLowerCase()]=C(g.text),d.push(Qg(new tg(0,p,U)));h=!1;break;case 5:p={};p[""+g.H]=new yc(g.H);d.push(Qg(new tg(0,p,U)));h=!1;break;case 34:k("|");break;case 25:k("||");break;case 14:h||k(" ");e.push({Xd:d,Sd:f,fc:"["});f="";d=[];h=!0;break;case 6:h||k(" ");e.push({Xd:d,Sd:f,fc:"(",Ub:g.text});f="";d=[];h=!0;break;case 15:g=l();p=e.pop();if("["!=p.fc)throw Error("']' unexpected");d=p.Xd;d.push(g);f=p.Sd;h=!1;break;case 11:g=l();p=e.pop();if("("!=p.fc)throw Error("')' unexpected");
d=p.Xd;d.push(Rg(p.Ub,g));f=p.Sd;h=!1;break;case 18:if(h)throw Error("':' unexpected");R(b);d.push(Og(d.pop(),P(b)));break;case 22:if(h)throw Error("'?' unexpected");d.push(Pg(d.pop(),0,1));break;case 36:if(h)throw Error("'*' unexpected");d.push(Pg(d.pop(),0,Number.POSITIVE_INFINITY));break;case 23:if(h)throw Error("'+' unexpected");d.push(Pg(d.pop(),1,Number.POSITIVE_INFINITY));break;case 12:R(b);g=P(b);if(5!=g.type)throw Error("<int> expected");var q=p=g.H;R(b);g=P(b);if(16==g.type){R(b);g=P(b);
if(5!=g.type)throw Error("<int> expected");q=g.H;R(b);g=P(b)}if(13!=g.type)throw Error("'}' expected");d.push(Pg(d.pop(),p,q));break;case 17:m=l();if(0<e.length)throw Error("unclosed '"+e.pop().fc+"'");break;default:throw Error("unexpected token");}R(b);Tg(c)?a.b[c]=m:a.g[c]=1!=m.b.length||m.b[0].f?new yg(m):m.b[0].b}}
function Wg(a,b){for(var c={},d=0;d<b.length;d++)for(var e=b[d],f=a.h[e],e=f?f.b:[e],f=0;f<e.length;f++){var g=e[f],h=a.l[g];h?c[g]=h:u.b("Unknown property in makePropSet:",g)}return c}
function Xg(a,b,c,d,e){var f="",g=b;b=b.toLowerCase();var h=b.match(/^-([a-z]+)-([-a-z0-9]+)$/);h&&(f=h[1],b=h[2]);if((h=a.w[b])&&h[f])if(f=a.g[b])(a=c===Vc||c.Od()?c:c.$(f))?e.mb(b,a,d):e.kc(g,c);else if(b=a.h[b].clone(),c===Vc)for(c=0;c<b.b.length;c++)e.mb(b.b[c],Vc,d);else{c.$(b);if(b.error)d=!1;else{for(a=0;a<b.b.length;a++)f=b.b[a],e.mb(f,b.values[f]||b.f.l[f],d);d=!0}d||e.kc(g,c)}else e.Wc(g,c)}
var Yg=new ce(function(){var a=I("loadValidatorSet.load"),b=ka("validation.txt",ja),c=Pe(b),d=new Ng;Sg(d);c.then(function(c){try{if(c.responseText){var e=new Me(c.responseText,null);for(Vg(d,e);;){var g=Ug(d,e,2);if(!g)break;for(c=[];;){R(e);var h=P(e);if(17==h.type){R(e);break}switch(h.type){case 1:c.push(C(h.text));break;case 4:c.push(new xc(h.H));break;case 5:c.push(new yc(h.H));break;case 3:c.push(new D(h.H,h.text));break;default:throw Error("unexpected token");}}d.l[g]=1<c.length?new oc(c):
c[0]}for(;;){var l=Ug(d,e,3);if(!l)break;var k=Q(e,1),m;1==k.type&&Mg[k.text]?(m=new Mg[k.text],R(e)):m=new Hg;m.f=d;g=!1;h=[];c=!1;for(var p=[],q=[];!g;)switch(R(e),k=P(e),k.type){case 1:if(d.g[k.text])h.push(new Cg(m.f,k.text)),q.push(k.text);else if(d.h[k.text]instanceof Ig){var w=d.h[k.text];h.push(new Dg(w.f,w.b));q.push.apply(q,w.b)}else throw Error("'"+k.text+"' is neither a simple property nor an inset shorthand");break;case 19:if(0<h.length||c)throw Error("unexpected slash");c=!0;break;case 14:p.push({Ud:c,
bb:h});h=[];c=!1;break;case 15:var r=new Eg(h,c),x=p.pop(),h=x.bb;c=x.Ud;h.push(r);break;case 17:g=!0;R(e);break;default:throw Error("unexpected token");}m.Fd(h,q);d.h[l]=m}d.j=Wg(d,["background"]);d.u=Wg(d,"margin border padding columns column-gap column-rule column-fill".split(" "))}else u.error("Error: missing",b)}catch(G){u.error(G,"Error:")}L(a,d)});return K(a)},"validatorFetcher");for(var Zg={azimuth:!0,"border-collapse":!0,"border-spacing":!0,"caption-side":!0,"clip-rule":!0,color:!0,"color-interpolation":!0,"color-rendering":!0,cursor:!0,direction:!0,elevation:!0,"empty-cells":!0,fill:!0,"fill-opacity":!0,"fill-rule":!0,"font-kerning":!0,"font-size":!0,"font-size-adjust":!0,"font-family":!0,"font-feature-settings":!0,"font-style":!0,"font-stretch":!0,"font-variant":!0,"font-weight":!0,"glyph-orientation-vertical":!0,"image-rendering":!0,"image-resolution":!0,"letter-spacing":!0,
"line-break":!0,"line-height":!0,"list-style-image":!0,"list-style-position":!0,"list-style-type":!0,marker:!0,"marker-end":!0,"marker-mid":!0,"marker-start":!0,orphans:!0,"overflow-wrap":!0,"paint-order":!0,"pointer-events":!0,"pitch-range":!0,quotes:!0,richness:!0,"ruby-align":!0,"ruby-position":!0,"speak-header":!0,"speak-numeral":!0,"speak-punctuation":!0,"speech-rate":!0,"shape-rendering":!0,stress:!0,stroke:!0,"stroke-dasharray":!0,"stroke-dashoffset":!0,"stroke-linecap":!0,"stroke-linejoin":!0,
"stroke-miterlimit":!0,"stroke-opacity":!0,"stroke-width":!0,"tab-size":!0,"text-align":!0,"text-align-last":!0,"text-anchor":!0,"text-decoration-skip":!0,"text-emphasis-color":!0,"text-emphasis-position":!0,"text-emphasis-style":!0,"text-combine-upright":!0,"text-indent":!0,"text-justify":!0,"text-rendering":!0,"text-size-adjust":!0,"text-transform":!0,"text-underline-position":!0,visibility:!0,"voice-family":!0,volume:!0,"white-space":!0,widows:!0,"word-break":!0,"word-spacing":!0,"word-wrap":!0,
"writing-mode":!0},$g=["box-decoration-break","image-resolution","orphans","widows"],ah={"http://www.idpf.org/2007/ops":!0,"http://www.w3.org/1999/xhtml":!0,"http://www.w3.org/2000/svg":!0},bh="margin-% padding-% border-%-width border-%-style border-%-color %".split(" "),ch=["left","right","top","bottom"],dh={width:!0,height:!0},eh=0;eh<bh.length;eh++)for(var fh=0;fh<ch.length;fh++){var gh=bh[eh].replace("%",ch[fh]);dh[gh]=!0}
function hh(a){for(var b={},c=0;c<bh.length;c++)for(var d in a){var e=bh[c].replace("%",d),f=bh[c].replace("%",a[d]);b[e]=f;b[f]=e}return b}var ih=hh({before:"right",after:"left",start:"top",end:"bottom"}),jh=hh({before:"top",after:"bottom",start:"left",end:"right"});function V(a,b){this.value=a;this.Oa=b}n=V.prototype;n.ce=function(){return this};n.Gc=function(a){a=this.value.$(a);return a===this.value?this:new V(a,this.Oa)};n.fe=function(a){return a?new V(this.value,this.Oa+a):this};
n.evaluate=function(a,b){return Hf(a,this.value,b)};n.Yd=function(){return!0};function kh(a,b,c){V.call(this,a,b);this.S=c}t(kh,V);kh.prototype.ce=function(){return new V(this.value,this.Oa)};kh.prototype.Gc=function(a){a=this.value.$(a);return a===this.value?this:new kh(a,this.Oa,this.S)};kh.prototype.fe=function(a){return a?new kh(this.value,this.Oa+a,this.S):this};kh.prototype.Yd=function(a){return!!this.S.evaluate(a)};function lh(a,b,c){return(!b||c.Oa>b.Oa)&&c.Yd(a)?c.ce():b}var mh={"region-id":!0};
function nh(a){return"_"!=a.charAt(0)&&!mh[a]}function oh(a,b,c){c?a[b]=c:delete a[b]}function ph(a,b){var c=a[b];c||(c={},a[b]=c);return c}function qh(a,b){var c=a[b];c||(c=[],a[b]=c);return c}function rh(a,b,c,d,e,f){if(e){var g=ph(b,"_pseudos");b=g[e];b||(b={},g[e]=b)}f&&(e=ph(b,"_regions"),b=e[f],b||(b={},e[f]=b));for(var h in c)"_"!=h.charAt(0)&&(mh[h]?(f=c[h],e=qh(b,h),Array.prototype.push.apply(e,f)):oh(b,h,lh(a,b[h],c[h].fe(d))))}
function sh(a,b){if(0<a.length){a.sort(function(a,b){return b.f()-a.f()});for(var c=null,d=a.length-1;0<=d;d--)c=a[d],c.b=b,b=c;return c}return b}function th(a,b){this.g=a;this.b=b;this.f=""}t(th,nc);function uh(a){a=a.g["font-size"].value;var b;a:switch(a.ea.toLowerCase()){case "px":case "in":case "pt":case "pc":case "cm":case "mm":case "q":b=!0;break a;default:b=!1}if(!b)throw Error("Unexpected state");return a.H*wb[a.ea]}
th.prototype.cc=function(a){if("em"==a.ea||"ex"==a.ea){var b=Ab(this.b,a.ea,!1)/Ab(this.b,"em",!1);return new D(a.H*b*uh(this),"px")}if("rem"==a.ea||"rex"==a.ea)return b=Ab(this.b,a.ea,!1)/Ab(this.b,"rem",!1),new D(a.H*b*this.b.fontSize(),"px");if("%"==a.ea){if("font-size"===this.f)return new D(a.H/100*uh(this),"px");if("line-height"===this.f)return a;b=this.f.match(/height|^(top|bottom)$/)?"vh":"vw";return new D(a.H,b)}return a};
th.prototype.$b=function(a){return"font-size"==this.f?Hf(this.b,a,this.f).$(this):a};function vh(){}vh.prototype.apply=function(){};vh.prototype.l=function(a){return new wh([this,a])};vh.prototype.clone=function(){return this};function xh(a){this.b=a}t(xh,vh);xh.prototype.apply=function(a){a.j[a.j.length-1].push(this.b.b())};function wh(a){this.b=a}t(wh,vh);wh.prototype.apply=function(a){for(var b=0;b<this.b.length;b++)this.b[b].apply(a)};wh.prototype.l=function(a){this.b.push(a);return this};
wh.prototype.clone=function(){return new wh([].concat(this.b))};function yh(a,b,c,d){this.style=a;this.W=b;this.b=c;this.h=d}t(yh,vh);yh.prototype.apply=function(a){rh(a.l,a.B,this.style,this.W,this.b,this.h)};function W(){this.b=null}t(W,vh);W.prototype.apply=function(a){this.b.apply(a)};W.prototype.f=function(){return 0};W.prototype.g=function(){return!1};function zh(a){this.b=null;this.h=a}t(zh,W);zh.prototype.apply=function(a){0<=a.F.indexOf(this.h)&&this.b.apply(a)};zh.prototype.f=function(){return 10};
zh.prototype.g=function(a){this.b&&Ah(a.Ba,this.h,this.b);return!0};function Bh(a){this.b=null;this.id=a}t(Bh,W);Bh.prototype.apply=function(a){a.T!=this.id&&a.da!=this.id||this.b.apply(a)};Bh.prototype.f=function(){return 11};Bh.prototype.g=function(a){this.b&&Ah(a.g,this.id,this.b);return!0};function Ch(a){this.b=null;this.localName=a}t(Ch,W);Ch.prototype.apply=function(a){a.f==this.localName&&this.b.apply(a)};Ch.prototype.f=function(){return 8};
Ch.prototype.g=function(a){this.b&&Ah(a.wc,this.localName,this.b);return!0};function Dh(a,b){this.b=null;this.h=a;this.localName=b}t(Dh,W);Dh.prototype.apply=function(a){a.f==this.localName&&a.g==this.h&&this.b.apply(a)};Dh.prototype.f=function(){return 8};Dh.prototype.g=function(a){if(this.b){var b=a.b[this.h];b||(b="ns"+a.j++ +":",a.b[this.h]=b);Ah(a.h,b+this.localName,this.b)}return!0};function Eh(a){this.b=null;this.h=a}t(Eh,W);
Eh.prototype.apply=function(a){var b=a.b;if(b&&"a"==a.f){var c=b.getAttribute("href");c&&c.match(/^#/)&&(b=b.ownerDocument.getElementById(c.substring(1)))&&(b=b.getAttributeNS("http://www.idpf.org/2007/ops","type"))&&b.match(this.h)&&this.b.apply(a)}};function Fh(a){this.b=null;this.h=a}t(Fh,W);Fh.prototype.apply=function(a){a.g==this.h&&this.b.apply(a)};function Gh(a,b){this.b=null;this.h=a;this.name=b}t(Gh,W);Gh.prototype.apply=function(a){a.b&&a.b.hasAttributeNS(this.h,this.name)&&this.b.apply(a)};
function Hh(a,b,c){this.b=null;this.h=a;this.name=b;this.value=c}t(Hh,W);Hh.prototype.apply=function(a){a.b&&a.b.getAttributeNS(this.h,this.name)==this.value&&this.b.apply(a)};Hh.prototype.f=function(){return"type"==this.name&&"http://www.idpf.org/2007/ops"==this.h?9:0};Hh.prototype.g=function(a){return"type"==this.name&&"http://www.idpf.org/2007/ops"==this.h?(this.b&&Ah(a.f,this.value,this.b),!0):!1};function Ih(a,b){this.b=null;this.h=a;this.name=b}t(Ih,W);
Ih.prototype.apply=function(a){if(a.b){var b=a.b.getAttributeNS(this.h,this.name);b&&ah[b]&&this.b.apply(a)}};Ih.prototype.f=function(){return 0};Ih.prototype.g=function(){return!1};function Jh(a,b,c){this.b=null;this.j=a;this.name=b;this.h=c}t(Jh,W);Jh.prototype.apply=function(a){if(a.b){var b=a.b.getAttributeNS(this.j,this.name);b&&b.match(this.h)&&this.b.apply(a)}};function Kh(a){this.b=null;this.h=a}t(Kh,W);Kh.prototype.apply=function(a){a.lang.match(this.h)&&this.b.apply(a)};
function Lh(){this.b=null}t(Lh,W);Lh.prototype.apply=function(a){a.Qa&&this.b.apply(a)};Lh.prototype.f=function(){return 6};function Mh(){this.b=null}t(Mh,W);Mh.prototype.apply=function(a){a.pa&&this.b.apply(a)};Mh.prototype.f=function(){return 12};function Nh(a,b){this.b=null;this.h=a;this.fc=b}t(Nh,W);function Oh(a,b){var c=a.h;b-=a.fc;return c?!(b%c)&&0<=b/c:!b}function Ph(a,b){Nh.call(this,a,b)}t(Ph,Nh);Ph.prototype.apply=function(a){Oh(this,a.ta)&&this.b.apply(a)};Ph.prototype.f=function(){return 5};
function Qh(a,b){Nh.call(this,a,b)}t(Qh,Nh);Qh.prototype.apply=function(a){Oh(this,a.jb[a.g][a.f])&&this.b.apply(a)};Qh.prototype.f=function(){return 5};function Rh(a,b){Nh.call(this,a,b)}t(Rh,Nh);Rh.prototype.apply=function(a){var b=a.M;null===b&&(b=a.M=a.b.parentNode.childElementCount-a.ta+1);Oh(this,b)&&this.b.apply(a)};Rh.prototype.f=function(){return 4};function Sh(a,b){Nh.call(this,a,b)}t(Sh,Nh);
Sh.prototype.apply=function(a){var b=a.Xa;if(!b[a.g]){var c=a.b;do{var d=c.namespaceURI,e=c.localName,f=b[d];f||(f=b[d]={});f[e]=(f[e]||0)+1}while(c=c.nextElementSibling)}Oh(this,b[a.g][a.f])&&this.b.apply(a)};Sh.prototype.f=function(){return 4};function Th(){this.b=null}t(Th,W);Th.prototype.apply=function(a){for(var b=a.b.firstChild;b;){switch(b.nodeType){case Node.ELEMENT_NODE:return;case Node.TEXT_NODE:if(0<b.length)return}b=b.nextSibling}this.b.apply(a)};Th.prototype.f=function(){return 4};
function Uh(){this.b=null}t(Uh,W);Uh.prototype.apply=function(a){!1===a.b.disabled&&this.b.apply(a)};Uh.prototype.f=function(){return 5};function Vh(){this.b=null}t(Vh,W);Vh.prototype.apply=function(a){!0===a.b.disabled&&this.b.apply(a)};Vh.prototype.f=function(){return 5};function Wh(){this.b=null}t(Wh,W);Wh.prototype.apply=function(a){var b=a.b;!0!==b.selected&&!0!==b.checked||this.b.apply(a)};Wh.prototype.f=function(){return 5};function Xh(a){this.b=null;this.S=a}t(Xh,W);
Xh.prototype.apply=function(a){a.u[this.S]&&this.b.apply(a)};Xh.prototype.f=function(){return 5};function Yh(){this.b=!1}t(Yh,vh);Yh.prototype.apply=function(){this.b=!0};Yh.prototype.clone=function(){var a=new Yh;a.b=this.b;return a};function Zh(a){this.b=null;this.h=new Yh;this.j=sh(a,this.h)}t(Zh,W);Zh.prototype.apply=function(a){this.j.apply(a);this.h.b||this.b.apply(a);this.h.b=!1};Zh.prototype.f=function(){return this.j.f()};function $h(a){this.S=a}$h.prototype.b=function(){return this};
$h.prototype.push=function(a,b){b||ai(a,this.S);return!1};$h.prototype.pop=function(a,b){return b?!1:(a.u[this.S]--,!0)};function bi(a){this.S=a}bi.prototype.b=function(){return this};bi.prototype.push=function(a,b){b?1==b&&a.u[this.S]--:ai(a,this.S);return!1};bi.prototype.pop=function(a,b){if(b)1==b&&ai(a,this.S);else return a.u[this.S]--,!0;return!1};function ci(a){this.S=a;this.f=!1}ci.prototype.b=function(){return new ci(this.S)};
ci.prototype.push=function(a){return this.f?(a.u[this.S]--,!0):!1};ci.prototype.pop=function(a,b){if(this.f)return a.u[this.S]--,!0;b||(this.f=!0,ai(a,this.S));return!1};function di(a){this.S=a;this.f=!1}di.prototype.b=function(){return new di(this.S)};di.prototype.push=function(a,b){this.f&&(-1==b?ai(a,this.S):b||a.u[this.S]--);return!1};di.prototype.pop=function(a,b){if(this.f){if(-1==b)return a.u[this.S]--,!0;b||ai(a,this.S)}else b||(this.f=!0,ai(a,this.S));return!1};
function ei(a,b){this.f=a;this.element=b}ei.prototype.b=function(){return this};ei.prototype.push=function(){return!1};ei.prototype.pop=function(a,b){return b?!1:(fi(a,this.f,this.element),!0)};function gi(a){this.lang=a}gi.prototype.b=function(){return this};gi.prototype.push=function(){return!1};gi.prototype.pop=function(a,b){return b?!1:(a.lang=this.lang,!0)};function hi(a){this.f=a}hi.prototype.b=function(){return this};hi.prototype.push=function(){return!1};
hi.prototype.pop=function(a,b){return b?!1:(a.I=this.f,!0)};function ii(a){this.element=a}t(ii,nc);function ji(a,b){switch(b){case "url":return a?new Ac(a):new Ac("about:invalid");default:return a?new vc(a):new vc("")}}
ii.prototype.qb=function(a){if("attr"!==a.name)return nc.prototype.qb.call(this,a);var b="string",c;a.values[0]instanceof oc?(2<=a.values[0].values.length&&(b=a.values[0].values[1].stringValue()),c=a.values[0].values[0].stringValue()):c=a.values[0].stringValue();a=1<a.values.length?ji(a.values[1].stringValue(),b):ji(null,b);return this.element&&this.element.hasAttribute(c)?ji(this.element.getAttribute(c),b):a};function ki(a,b,c){this.f=a;this.element=b;this.b=c}t(ki,nc);
ki.prototype.Bb=function(a){var b=this.f,c=b.I,d=Math.floor(c.length/2)-1;switch(a.name){case "open-quote":a=c[2*Math.min(d,b.A)];b.A++;break;case "close-quote":return 0<b.A&&b.A--,c[2*Math.min(d,b.A)+1];case "no-open-quote":return b.A++,new vc("");case "no-close-quote":return 0<b.A&&b.A--,new vc("")}return a};
var li={roman:[4999,1E3,"M",900,"CM",500,"D",400,"CD",100,"C",90,"XC",50,"L",40,"XL",10,"X",9,"IX",5,"V",4,"IV",1,"I"],armenian:[9999,9E3,"\u0584",8E3,"\u0583",7E3,"\u0582",6E3,"\u0581",5E3,"\u0580",4E3,"\u057f",3E3,"\u057e",2E3,"\u057d",1E3,"\u057c",900,"\u057b",800,"\u057a",700,"\u0579",600,"\u0578",500,"\u0577",400,"\u0576",300,"\u0575",200,"\u0574",100,"\u0573",90,"\u0572",80,"\u0571",70,"\u0570",60,"\u056f",50,"\u056e",40,"\u056d",30,"\u056c",20,"\u056b",10,"\u056a",9,"\u0569",8,"\u0568",7,"\u0567",
6,"\u0566",5,"\u0565",4,"\u0564",3,"\u0563",2,"\u0562",1,"\u0561"],georgian:[19999,1E4,"\u10f5",9E3,"\u10f0",8E3,"\u10ef",7E3,"\u10f4",6E3,"\u10ee",5E3,"\u10ed",4E3,"\u10ec",3E3,"\u10eb",2E3,"\u10ea",1E3,"\u10e9",900,"\u10e8",800,"\u10e7",700,"\u10e6",600,"\u10e5",500,"\u10e4",400,"\u10f3",300,"\u10e2",200,"\u10e1",100,"\u10e0",90,"\u10df",80,"\u10de",70,"\u10dd",60,"\u10f2",50,"\u10dc",40,"\u10db",30,"\u10da",20,"\u10d9",10,"\u10d8",9,"\u10d7",8,"\u10f1",7,"\u10d6",6,"\u10d5",5,"\u10d4",4,"\u10d3",
3,"\u10d2",2,"\u10d1",1,"\u10d0"],hebrew:[999,400,"\u05ea",300,"\u05e9",200,"\u05e8",100,"\u05e7",90,"\u05e6",80,"\u05e4",70,"\u05e2",60,"\u05e1",50,"\u05e0",40,"\u05de",30,"\u05dc",20,"\u05db",19,"\u05d9\u05d8",18,"\u05d9\u05d7",17,"\u05d9\u05d6",16,"\u05d8\u05d6",15,"\u05d8\u05d5",10,"\u05d9",9,"\u05d8",8,"\u05d7",7,"\u05d6",6,"\u05d5",5,"\u05d4",4,"\u05d3",3,"\u05d2",2,"\u05d1",1,"\u05d0"]},mi={latin:"a-z",alpha:"a-z",greek:"\u03b1-\u03c1\u03c3-\u03c9",russian:"\u0430-\u0438\u043a-\u0449\u044d-\u044f"},
ni={square:"\u25a0",disc:"\u2022",circle:"\u25e6",none:""},oi={mf:!1,ic:"\u96f6\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d",Lc:"\u5341\u767e\u5343",Fe:"\u8ca0"};
function pi(a){if(9999<a||-9999>a)return""+a;if(!a)return oi.ic.charAt(0);var b=new za;0>a&&(b.append(oi.Fe),a=-a);if(10>a)b.append(oi.ic.charAt(a));else if(oi.nf&&19>=a)b.append(oi.Lc.charAt(0)),a&&b.append(oi.Lc.charAt(a-10));else{var c=Math.floor(a/1E3);c&&(b.append(oi.ic.charAt(c)),b.append(oi.Lc.charAt(2)));if(c=Math.floor(a/100)%10)b.append(oi.ic.charAt(c)),b.append(oi.Lc.charAt(1));if(c=Math.floor(a/10)%10)b.append(oi.ic.charAt(c)),b.append(oi.Lc.charAt(0));(a%=10)&&b.append(oi.ic.charAt(a))}return b.toString()}
function qi(a,b){var c=!1,d=!1,e;if(e=b.match(/^upper-(.*)/))c=!0,b=e[1];else if(e=b.match(/^lower-(.*)/))d=!0,b=e[1];e="";if(li[b])a:{e=li[b];var f=a;if(f>e[0]||0>=f||f!=Math.round(f))e="";else{for(var g="",h=1;h<e.length;h+=2){var l=e[h],k=Math.floor(f/l);if(20<k){e="";break a}for(f-=k*l;0<k;)g+=e[h+1],k--}e=g}}else if(mi[b])if(e=a,0>=e||e!=Math.round(e))e="";else{g=mi[b];f=[];for(h=0;h<g.length;)if("-"==g.substr(h+1,1))for(k=g.charCodeAt(h),l=g.charCodeAt(h+2),h+=3;k<=l;k++)f.push(String.fromCharCode(k));
else f.push(g.substr(h++,1));g="";do e--,h=e%f.length,g=f[h]+g,e=(e-h)/f.length;while(0<e);e=g}else null!=ni[b]?e=ni[b]:"decimal-leading-zero"==b?(e=a+"",1==e.length&&(e="0"+e)):"cjk-ideographic"==b||"trad-chinese-informal"==b?e=pi(a):e=a+"";return c?e.toUpperCase():d?e.toLowerCase():e}
function ri(a,b){var c=b[0].toString(),d=1<b.length?b[1].stringValue():"decimal",e=a.f.h[c];if(e&&e.length)return new vc(qi(e&&e.length&&e[e.length-1]||0,d));c=new F(si(a.b,c,function(a){return qi(a||0,d)}));return new oc([c])}
function ti(a,b){var c=b[0].toString(),d=b[1].stringValue(),e=2<b.length?b[2].stringValue():"decimal",f=a.f.h[c],g=new za;if(f&&f.length)for(var h=0;h<f.length;h++)0<h&&g.append(d),g.append(qi(f[h],e));c=new F(ui(a.b,c,function(a){var b=[];if(a.length)for(var c=0;c<a.length;c++)b.push(qi(a[c],e));a=g.toString();a.length&&b.push(a);return b.length?b.join(d):qi(0,e)}));return new oc([c])}
function vi(a,b){var c=b[0],c=c instanceof Ac?c.url:c.stringValue(),d=b[1].toString(),e=2<b.length?b[2].stringValue():"decimal",c=new F(wi(a.b,c,d,function(a){return qi(a||0,e)}));return new oc([c])}function xi(a,b){var c=b[0],c=c instanceof Ac?c.url:c.stringValue(),d=b[1].toString(),e=b[2].stringValue(),f=3<b.length?b[3].stringValue():"decimal",c=new F(yi(a.b,c,d,function(a){a=a.map(function(a){return qi(a,f)});return a.length?a.join(e):qi(0,f)}));return new oc([c])}
ki.prototype.qb=function(a){switch(a.name){case "counter":if(2>=a.values.length)return ri(this,a.values);break;case "counters":if(3>=a.values.length)return ti(this,a.values);break;case "target-counter":if(3>=a.values.length)return vi(this,a.values);break;case "target-counters":if(4>=a.values.length)return xi(this,a.values)}u.b("E_CSS_CONTENT_PROP:",a.toString());return new vc("")};var zi=1/1048576;function Ai(a,b){for(var c in a)b[c]=a[c].clone()}
function Bi(){this.j=0;this.b={};this.wc={};this.h={};this.f={};this.Ba={};this.g={};this.mc={};this.order=0}Bi.prototype.clone=function(){var a=new Bi;a.j=this.j;for(var b in this.b)a.b[b]=this.b[b];Ai(this.wc,a.wc);Ai(this.h,a.h);Ai(this.f,a.f);Ai(this.Ba,a.Ba);Ai(this.g,a.g);Ai(this.mc,a.mc);a.order=this.order;return a};function Ah(a,b,c){var d=a[b];d&&(c=d.l(c));a[b]=c}
function Ci(a,b,c,d){this.w=a;this.l=b;this.Qb=c;this.Wa=d;this.j=[[],[]];this.u={};this.F=this.B=this.b=null;this.sa=this.da=this.T=this.g=this.f="";this.V=this.J=null;this.pa=this.Qa=!0;this.h={};this.G=[{}];this.I=[new vc("\u201c"),new vc("\u201d"),new vc("\u2018"),new vc("\u2019")];this.A=0;this.lang="";this.Gb=[0];this.ta=0;this.ka=[{}];this.jb=this.ka[0];this.M=null;this.Eb=[this.M];this.Fb=[{}];this.Xa=this.ka[0];this.kb=[]}function ai(a,b){a.u[b]=(a.u[b]||0)+1}
function Di(a,b,c){(b=b[c])&&b.apply(a)}var Ei=[];function Fi(a,b,c,d){a.b=null;a.B=d;a.g="";a.f="";a.T="";a.da="";a.F=b;a.sa="";a.J=Ei;a.V=c;Gi(a)}function Hi(a,b,c){a.h[b]?a.h[b].push(c):a.h[b]=[c];c=a.G[a.G.length-1];c||(c={},a.G[a.G.length-1]=c);c[b]=!0}
function Ii(a,b){var c=Wc,d=b.display;d&&(c=d.evaluate(a.l));var e=null,f=d=null,g=b["counter-reset"];g&&(g=g.evaluate(a.l))&&(e=lg(g,!0));(g=b["counter-set"])&&(g=g.evaluate(a.l))&&(f=lg(g,!1));(g=b["counter-increment"])&&(g=g.evaluate(a.l))&&(d=lg(g,!1));"ol"!=a.f&&"ul"!=a.f||"http://www.w3.org/1999/xhtml"!=a.g||(e||(e={}),e["ua-list-item"]=0);c===bd&&(d||(d={}),d["ua-list-item"]=1);if(e)for(var h in e)Hi(a,h,e[h]);if(f)for(var l in f)a.h[l]?(h=a.h[l],h[h.length-1]=f[l]):Hi(a,l,f[l]);if(d)for(var k in d)a.h[k]||
Hi(a,k,0),h=a.h[k],h[h.length-1]+=d[k];c===bd&&(c=a.h["ua-list-item"],b["ua-list-item-count"]=new V(new xc(c[c.length-1]),0));a.G.push(null)}function Ji(a){var b=a.G.pop();if(b)for(var c in b)(b=a.h[c])&&(1==b.length?delete a.h[c]:b.pop())}function fi(a,b,c){Ii(a,b);b.content&&(b.content=b.content.Gc(new ki(a,c,a.Wa)));Ji(a)}var Ki="before transclusion-before footnote-call footnote-marker inner first-letter first-line  transclusion-after after".split(" ");
function Li(a,b,c){a.kb.push(b);a.V=null;a.b=b;a.B=c;a.g=b.namespaceURI;a.f=b.localName;var d=a.w.b[a.g];a.sa=d?d+a.f:"";a.T=b.getAttribute("id");a.da=b.getAttributeNS("http://www.w3.org/XML/1998/namespace","id");(d=b.getAttribute("class"))?a.F=d.split(/\s+/):a.F=Ei;(d=b.getAttributeNS("http://www.idpf.org/2007/ops","type"))?a.J=d.split(/\s+/):a.J=Ei;"style"==a.f&&"http://www.gribuser.ru/xml/fictionbook/2.0"==a.g&&(a.F=[b.getAttribute("name")||""]);(d=b.getAttributeNS("http://www.w3.org/XML/1998/namespace",
"lang"))||"http://www.w3.org/1999/xhtml"!=a.g||(d=b.getAttribute("lang"));d&&(a.j[a.j.length-1].push(new gi(a.lang)),a.lang=d.toLowerCase());var d=a.pa,e=a.Gb;a.ta=++e[e.length-1];e.push(0);var e=a.ka,f=a.jb=e[e.length-1],g=f[a.g];g||(g=f[a.g]={});g[a.f]=(g[a.f]||0)+1;e.push({});e=a.Eb;null!==e[e.length-1]?a.M=--e[e.length-1]:a.M=null;e.push(null);e=a.Fb;(f=a.Xa=e[e.length-1])&&f[a.g]&&f[a.g][a.f]--;e.push({});Gi(a);Mi(a,b);e=c.quotes;c=null;e&&(e=e.evaluate(a.l))&&(c=new hi(a.I),e===H?a.I=[new vc(""),
new vc("")]:e instanceof oc&&(a.I=e.values));Ii(a,a.B);e=a.T||a.da||b.getAttribute("name")||"";if(d||e){var h={};Object.keys(a.h).forEach(function(a){h[a]=Array.from(this.h[a])},a);Ni(a.Qb,e,h)}if(d=a.B._pseudos)for(e=!0,f=0;f<Ki.length;f++)(g=Ki[f])||(e=!1),(g=d[g])&&(e?fi(a,g,b):a.j[a.j.length-2].push(new ei(g,b)));c&&a.j[a.j.length-2].push(c)}function Oi(a,b){for(var c in b)nh(c)&&(b[c]=b[c].Gc(a))}function Mi(a,b){var c=new ii(b),d=a.B,e=d._pseudos,f;for(f in e)Oi(c,e[f]);Oi(c,d)}
function Gi(a){var b;for(b=0;b<a.F.length;b++)Di(a,a.w.Ba,a.F[b]);for(b=0;b<a.J.length;b++)Di(a,a.w.f,a.J[b]);Di(a,a.w.g,a.T);Di(a,a.w.wc,a.f);""!=a.f&&Di(a,a.w.wc,"*");Di(a,a.w.h,a.sa);null!==a.V&&(Di(a,a.w.mc,a.V),Di(a,a.w.mc,"*"));a.b=null;a.j.push([]);for(var c=1;-1<=c;--c){var d=a.j[a.j.length-c-2];for(b=0;b<d.length;)d[b].push(a,c)?d.splice(b,1):b++}a.Qa=!0;a.pa=!1}
Ci.prototype.pop=function(){for(var a=1;-1<=a;--a)for(var b=this.j[this.j.length-a-2],c=0;c<b.length;)b[c].pop(this,a)?b.splice(c,1):c++;this.j.pop();this.Qa=!1};var Pi=null;function Qi(a,b,c,d,e,f,g){af.call(this,a,b,g);this.b=null;this.W=0;this.h=this.l=null;this.A=!1;this.S=c;this.j=d?d.j:Pi?Pi.clone():new Bi;this.F=e;this.w=f;this.u=0}t(Qi,bf);Qi.prototype.he=function(a){Ah(this.j.wc,"*",a)};function Ri(a,b){var c=sh(a.b,b);c!==b&&c.g(a.j)||a.he(c)}
Qi.prototype.pb=function(a,b){if(b||a)this.W+=1,b&&a?this.b.push(new Dh(a,b.toLowerCase())):b?this.b.push(new Ch(b.toLowerCase())):this.b.push(new Fh(a))};Qi.prototype.dd=function(a){this.h?(u.b("::"+this.h,"followed by ."+a),this.b.push(new Xh(""))):(this.W+=256,this.b.push(new zh(a)))};var Si={"nth-child":Ph,"nth-of-type":Qh,"nth-last-child":Rh,"nth-last-of-type":Sh};
Qi.prototype.nc=function(a,b){if(this.h)u.b("::"+this.h,"followed by :"+a),this.b.push(new Xh(""));else{switch(a.toLowerCase()){case "enabled":this.b.push(new Uh);break;case "disabled":this.b.push(new Vh);break;case "checked":this.b.push(new Wh);break;case "root":this.b.push(new Mh);break;case "link":this.b.push(new Ch("a"));this.b.push(new Gh("","href"));break;case "-adapt-href-epub-type":case "href-epub-type":if(b&&1==b.length&&"string"==typeof b[0]){var c=new RegExp("(^|s)"+na(b[0])+"($|s)");this.b.push(new Eh(c))}else this.b.push(new Xh(""));
break;case "-adapt-footnote-content":case "footnote-content":this.A=!0;break;case "visited":case "active":case "hover":case "focus":this.b.push(new Xh(""));break;case "lang":b&&1==b.length&&"string"==typeof b[0]?this.b.push(new Kh(new RegExp("^"+na(b[0].toLowerCase())+"($|-)"))):this.b.push(new Xh(""));break;case "nth-child":case "nth-last-child":case "nth-of-type":case "nth-last-of-type":c=Si[a.toLowerCase()];b&&2==b.length?this.b.push(new c(b[0],b[1])):this.b.push(new Xh(""));break;case "first-child":this.b.push(new Lh);
break;case "last-child":this.b.push(new Rh(0,1));break;case "first-of-type":this.b.push(new Qh(0,1));break;case "last-of-type":this.b.push(new Sh(0,1));break;case "only-child":this.b.push(new Lh);this.b.push(new Rh(0,1));break;case "only-of-type":this.b.push(new Qh(0,1));this.b.push(new Sh(0,1));break;case "empty":this.b.push(new Th);break;case "before":case "after":case "first-line":case "first-letter":this.oc(a,b);return;default:u.b("unknown pseudo-class selector: "+a),this.b.push(new Xh(""))}this.W+=
256}};
Qi.prototype.oc=function(a,b){switch(a){case "before":case "after":case "first-line":case "first-letter":case "footnote-call":case "footnote-marker":case "inner":this.h?(u.b("Double pseudoelement ::"+this.h+"::"+a),this.b.push(new Xh(""))):this.h=a;break;case "first-n-lines":if(b&&1==b.length&&"number"==typeof b[0]){var c=Math.round(b[0]);if(0<c&&c==b[0]){this.h?(u.b("Double pseudoelement ::"+this.h+"::"+a),this.b.push(new Xh(""))):this.h="first-"+c+"-lines";break}}default:u.b("Unrecognized pseudoelement: ::"+a),
this.b.push(new Xh(""))}this.W+=1};Qi.prototype.ld=function(a){this.W+=65536;this.b.push(new Bh(a))};
Qi.prototype.Dc=function(a,b,c,d){this.W+=256;b=b.toLowerCase();d=d||"";var e;switch(c){case 0:e=new Gh(a,b);break;case 39:e=new Hh(a,b,d);break;case 45:!d||d.match(/\s/)?e=new Xh(""):e=new Jh(a,b,new RegExp("(^|\\s)"+na(d)+"($|\\s)"));break;case 44:e=new Jh(a,b,new RegExp("^"+na(d)+"($|-)"));break;case 43:d?e=new Jh(a,b,new RegExp("^"+na(d))):e=new Xh("");break;case 42:d?e=new Jh(a,b,new RegExp(na(d)+"$")):e=new Xh("");break;case 46:d?e=new Jh(a,b,new RegExp(na(d))):e=new Xh("");break;case 50:"supported"==
d?e=new Ih(a,b):(u.b("Unsupported :: attr selector op:",d),e=new Xh(""));break;default:u.b("Unsupported attr selector:",c),e=new Xh("")}this.b.push(e)};var Ti=0;n=Qi.prototype;n.tb=function(){var a="d"+Ti++;Ri(this,new xh(new $h(a)));this.b=[new Xh(a)]};n.cd=function(){var a="c"+Ti++;Ri(this,new xh(new bi(a)));this.b=[new Xh(a)]};n.$c=function(){var a="a"+Ti++;Ri(this,new xh(new ci(a)));this.b=[new Xh(a)]};n.hd=function(){var a="f"+Ti++;Ri(this,new xh(new di(a)));this.b=[new Xh(a)]};
n.Wb=function(){Ui(this);this.h=null;this.A=!1;this.W=0;this.b=[]};n.nb=function(){var a;0!=this.u?(df(this,"E_CSS_UNEXPECTED_SELECTOR"),a=!0):a=!1;a||(this.u=1,this.l={},this.h=null,this.W=0,this.A=!1,this.b=[])};n.error=function(a,b){bf.prototype.error.call(this,a,b);1==this.u&&(this.u=0)};n.Zb=function(a){bf.prototype.Zb.call(this,a);this.u=0};n.xa=function(){Ui(this);bf.prototype.xa.call(this);1==this.u&&(this.u=0)};n.ub=function(){bf.prototype.ub.call(this)};
function Ui(a){if(a.b){var b=a.W,c;c=a.j;c=c.order+=zi;Ri(a,a.le(b+c));a.b=null;a.h=null;a.A=!1;a.W=0}}n.le=function(a){var b=this.F;this.A&&(b=b?"xxx-bogus-xxx":"footnote");return new yh(this.l,a,this.h,b)};n.lb=function(a,b,c){Xg(this.w,a,b,c,this)};n.kc=function(a,b){cf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};n.Wc=function(a,b){cf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};
n.mb=function(a,b,c){"display"!=a||b!==fd&&b!==ed||(this.mb("flow-options",new oc([Pc,kd]),c),this.mb("flow-into",b,c),b=Hc);(Bd.SIMPLE_PROPERTY||[]).forEach(function(d){d=d({name:a,value:b,important:c});a=d.name;b=d.value;c=d.important});var d=c?Xe(this):Ye(this);oh(this.l,a,this.S?new kh(b,d,this.S):new V(b,d))};n.tc=function(a){switch(a){case "not":a=new Vi(this),a.nb(),$e(this.ga,a)}};function Vi(a){Qi.call(this,a.f,a.ga,a.S,a,a.F,a.w,!1);this.parent=a;this.g=a.b}t(Vi,Qi);n=Vi.prototype;
n.tc=function(a){"not"==a&&df(this,"E_CSS_UNEXPECTED_NOT")};n.xa=function(){df(this,"E_CSS_UNEXPECTED_RULE_BODY")};n.Wb=function(){df(this,"E_CSS_UNEXPECTED_NEXT_SELECTOR")};n.Fc=function(){this.b&&0<this.b.length&&this.g.push(new Zh(this.b));this.parent.W+=this.W;var a=this.ga;a.b=a.g.pop()};n.error=function(a,b){Qi.prototype.error.call(this,a,b);var c=this.ga;c.b=c.g.pop()};function Wi(a,b){af.call(this,a,b,!1)}t(Wi,bf);
Wi.prototype.lb=function(a,b){if(this.f.values[a])this.error("E_CSS_NAME_REDEFINED "+a,this.jc());else{var c=a.match(/height|^(top|bottom)$/)?"vh":"vw",c=new bc(this.f,100,c),c=b.oa(this.f,c);this.f.values[a]=c}};function Xi(a,b,c,d,e){af.call(this,a,b,!1);this.b=d;this.S=c;this.g=e}t(Xi,bf);Xi.prototype.lb=function(a,b,c){c?u.b("E_IMPORTANT_NOT_ALLOWED"):Xg(this.g,a,b,c,this)};Xi.prototype.kc=function(a,b){u.b("E_INVALID_PROPERTY_VALUE",a+":",b.toString())};
Xi.prototype.Wc=function(a,b){u.b("E_INVALID_PROPERTY",a+":",b.toString())};Xi.prototype.mb=function(a,b,c){c=c?Xe(this):Ye(this);c+=this.order;this.order+=zi;oh(this.b,a,this.S?new kh(b,c,this.S):new V(b,c))};function Yi(a,b){Af.call(this,a);this.b={};this.g=b;this.order=0}t(Yi,Af);Yi.prototype.lb=function(a,b,c){Xg(this.g,a,b,c,this)};Yi.prototype.kc=function(a,b){u.b("E_INVALID_PROPERTY_VALUE",a+":",b.toString())};Yi.prototype.Wc=function(a,b){u.b("E_INVALID_PROPERTY",a+":",b.toString())};
Yi.prototype.mb=function(a,b,c){c=(c?67108864:50331648)+this.order;this.order+=zi;oh(this.b,a,new V(b,c))};function Zi(a,b,c){return(a=a["writing-mode"])&&(b=a.evaluate(b,"writing-mode"))&&b!==Vc?b===rd:c}function $i(a,b,c,d){var e={},f;for(f in a)nh(f)&&(e[f]=a[f]);a=a._regions;if((c||d)&&a)for(d&&(d=["footnote"],c=c?c.concat(d):d),d=0;d<c.length;d++){f=a[c[d]];for(var g in f)nh(g)&&(e[g]=lh(b,e[g],f[g]))}return e}
function aj(a,b,c,d){c=c?ih:jh;for(var e in a)if(a.hasOwnProperty(e)){var f=a[e];if(f){var g=c[e];if(g){var h=a[g];if(h&&h.Oa>f.Oa)continue;g=dh[g]?g:e}else g=e;b[g]=d(e,f)}}};var bj=!1,cj={af:"ltr",bf:"rtl"};ba("vivliostyle.constants.PageProgression",cj);cj.LTR="ltr";cj.RTL="rtl";var dj={ue:"left",ve:"right"};ba("vivliostyle.constants.PageSide",dj);dj.LEFT="left";dj.RIGHT="right";var ej={LOADING:"loading",$e:"interactive",Xe:"complete"};ba("vivliostyle.constants.ReadyState",ej);ej.LOADING="loading";ej.INTERACTIVE="interactive";ej.COMPLETE="complete";function fj(a,b,c){this.u=a;this.url=b;this.b=c;this.lang=null;this.h=-1;this.root=c.documentElement;b=a=null;if("http://www.w3.org/1999/xhtml"==this.root.namespaceURI){for(var d=this.root.firstChild;d;d=d.nextSibling)if(1==d.nodeType&&(c=d,"http://www.w3.org/1999/xhtml"==c.namespaceURI))switch(c.localName){case "head":b=c;break;case "body":a=c}this.lang=this.root.getAttribute("lang")}else if("http://www.gribuser.ru/xml/fictionbook/2.0"==this.root.namespaceURI){b=this.root;for(d=this.root.firstChild;d;d=
d.nextSibling)1==d.nodeType&&(c=d,"http://www.gribuser.ru/xml/fictionbook/2.0"==c.namespaceURI&&"body"==c.localName&&(a=c));c=gj(gj(gj(gj(new hj([this.b]),"FictionBook"),"description"),"title-info"),"lang").textContent();0<c.length&&(this.lang=c[0])}else if("http://example.com/sse"==this.root.namespaceURI)for(c=this.root.firstElementChild;c;c=c.nextElementSibling)d=c.localName,"meta"===d?b=c:"body"===d&&(a=c);this.body=a;this.l=b;this.g=this.root;this.j=1;this.g.setAttribute("data-adapt-eloff","0")}
function ij(a,b){var c=b.getAttribute("data-adapt-eloff");if(c)return parseInt(c,10);for(var c=a.j,d=a.g;d!=b;){var e=d.firstChild;if(!e)for(;!(e=d.nextSibling);)if(d=d.parentNode,!d)throw Error("Internal error");d=e;1==e.nodeType?(e.setAttribute("data-adapt-eloff",c.toString()),++c):c+=e.textContent.length}a.j=c;a.g=b;return c-1}
function jj(a,b,c,d){var e=0;if(1==b.nodeType){if(!d)return ij(a,b)}else{e=c;c=b.previousSibling;if(!c)return b=b.parentNode,e+=1,ij(a,b)+e;b=c}for(;;){for(;b.lastChild;)b=b.lastChild;if(1==b.nodeType)break;e+=b.textContent.length;c=b.previousSibling;if(!c){b=b.parentNode;break}b=c}e+=1;return ij(a,b)+e}function kj(a){0>a.h&&(a.h=jj(a,a.root,0,!0));return a.h}
function lj(a,b){for(var c,d=a.root;;){c=ij(a,d);if(c>=b)return d;var e=d.children;if(!e)break;var f=Ha(e.length,function(c){return ij(a,e[c])>b});if(!f)break;if(f<e.length&&ij(a,e[f])<=b)throw Error("Consistency check failed!");d=e[f-1]}c+=1;for(var f=d,g=f.firstChild||f.nextSibling,h=null;;){if(g){if(1==g.nodeType)break;h=f=g;c+=g.textContent.length;if(c>b)break}else if(f=f.parentNode,!f)break;g=f.nextSibling}return h||d}
function mj(a,b){var c=b.getAttribute("id");c&&!a.f[c]&&(a.f[c]=b);(c=b.getAttributeNS("http://www.w3.org/XML/1998/namespace","id"))&&!a.f[c]&&(a.f[c]=b);for(c=b.firstElementChild;c;c=c.nextElementSibling)mj(a,c)}function nj(a,b){var c=b.match(/([^#]*)\#(.+)$/);if(!c||c[1]&&c[1]!=a.url)return null;var c=c[2],d=a.b.getElementById(c);!d&&a.b.getElementsByName&&(d=a.b.getElementsByName(c)[0]);d||(a.f||(a.f={},mj(a,a.b.documentElement)),d=a.f[c]);return d}
var oj={ef:"text/html",ff:"text/xml",Se:"application/xml",Re:"application/xhtml_xml",Ze:"image/svg+xml"};function pj(a,b,c){c=c||new DOMParser;var d;try{d=c.parseFromString(a,b)}catch(e){}if(d){a=d.documentElement;if("parsererror"===a.localName)return null;for(a=a.firstChild;a;a=a.nextSibling)if("parsererror"===a.localName)return null}else return null;return d}
function qj(a){var b=a.contentType;if(b){for(var c=Object.keys(oj),d=0;d<c.length;d++)if(oj[c[d]]===b)return b;if(b.match(/\+xml$/))return"application/xml"}if(a=a.url.match(/\.([^./]+)$/))switch(a[1]){case "html":case "htm":return"text/html";case "xhtml":case "xht":return"application/xhtml_xml";case "svg":case "svgz":return"image/svg+xml";case "opf":case "xml":return"application/xml"}return null}
function rj(a,b){var c=a.responseXML;if(!c){var d=new DOMParser,e=a.responseText;if(e){var f=qj(a);(c=pj(e,f||"application/xml",d))&&!f&&(f=c.documentElement,"html"!==f.localName.toLowerCase()||f.namespaceURI?"svg"===f.localName.toLowerCase()&&"image/svg+xml"!==c.contentType&&(c=pj(e,"image/svg+xml",d)):c=pj(e,"text/html",d));c||(c=pj(e,"text/html",d))}}c=c?new fj(b,a.url,c):null;return J(c)}function sj(a){this.Ub=a}
function tj(){var a=uj;return new sj(function(b){return a.Ub(b)&&1==b.nodeType&&"http://www.idpf.org/2008/embedding"==b.getAttribute("Algorithm")})}function vj(){var a=tj(),b=uj;return new sj(function(c){if(!b.Ub(c))return!1;c=new hj([c]);c=gj(c,"EncryptionMethod");a&&(c=wj(c,a));return 0<c.b.length})}var uj=new sj(function(){return!0});function hj(a){this.b=a}function wj(a,b){for(var c=[],d=0;d<a.b.length;d++){var e=a.b[d];b.Ub(e)&&c.push(e)}return new hj(c)}
function xj(a,b){function c(a){d.push(a)}for(var d=[],e=0;e<a.b.length;e++)b(a.b[e],c);return new hj(d)}hj.prototype.forEach=function(a){for(var b=[],c=0;c<this.b.length;c++)b.push(a(this.b[c]));return b};function yj(a,b){for(var c=[],d=0;d<a.b.length;d++){var e=b(a.b[d]);null!=e&&c.push(e)}return c}function gj(a,b){return xj(a,function(a,d){for(var c=a.firstChild;c;c=c.nextSibling)c.localName==b&&d(c)})}
function zj(a){return xj(a,function(a,c){for(var b=a.firstChild;b;b=b.nextSibling)1==b.nodeType&&c(b)})}function Aj(a,b){return yj(a,function(a){return 1==a.nodeType?a.getAttribute(b):null})}hj.prototype.textContent=function(){return this.forEach(function(a){return a.textContent})};var Bj={transform:!0,"transform-origin":!0},Cj={top:!0,bottom:!0,left:!0,right:!0};function Dj(a,b,c){this.target=a;this.name=b;this.value=c}var Ej={show:function(a){a.style.visibility="visible"},hide:function(a){a.style.visibility="hidden"},play:function(a){a.currentTime=0;a.play()},pause:function(a){a.pause()},resume:function(a){a.play()},mute:function(a){a.muted=!0},unmute:function(a){a.muted=!1}};
function Fj(a,b){var c=Ej[b];return c?function(){for(var b=0;b<a.length;b++)try{c(a[b])}catch(e){}}:null}
function Gj(a,b){this.h={};this.P=a;this.g=b;this.I=null;this.u=[];var c=this;this.M=function(a){var b=a.currentTarget,d=b.getAttribute("href")||b.getAttributeNS("http://www.w3.org/1999/xlink","href");d&&Ra(c,{type:"hyperlink",target:null,currentTarget:null,kf:b,href:d,preventDefault:function(){a.preventDefault()}})};this.b={};this.f={width:0,height:0};this.w=this.F=!1;this.A=this.B=!0;this.L=0;this.position=null;this.offset=-1;this.l=null;this.j=[];this.G={top:{},bottom:{},left:{},right:{}}}
t(Gj,Qa);function Hj(a,b){(a.B=b)?a.P.setAttribute("data-vivliostyle-auto-page-width",!0):a.P.removeAttribute("data-vivliostyle-auto-page-width")}function Ij(a,b){(a.A=b)?a.P.setAttribute("data-vivliostyle-auto-page-height",!0):a.P.removeAttribute("data-vivliostyle-auto-page-height")}function Jj(a,b,c){var d=a.b[c];d?d.push(b):a.b[c]=[b]}
function Kj(a,b,c){Object.keys(a.b).forEach(function(a){for(var b=this.b[a],c=0;c<b.length;)this.P.contains(b[c])?c++:b.splice(c,1);b.length||delete this.b[a]},a);for(var d=a.u,e=0;e<d.length;e++){var f=d[e];v(f.target,f.name,f.value.toString())}e=Lj(c,a.P);a.f.width=e.width;a.f.height=e.height;for(e=0;e<b.length;e++)if(c=b[e],f=a.b[c.qc],d=a.b[c.He],f&&d&&(f=Fj(f,c.action)))for(var g=0;g<d.length;g++)d[g].addEventListener(c.event,f,!1)}
Gj.prototype.zoom=function(a){v(this.P,"transform","scale("+a+")")};Gj.prototype.J=function(){return this.I||this.P};function Mj(a){switch(a){case "normal":case "nowrap":return 0;case "pre-line":return 1;case "pre":case "pre-wrap":return 2;default:return null}}function Nj(a,b){if(1==a.nodeType)return!1;var c=a.textContent;switch(b){case 0:return!!c.match(/^\s*$/);case 1:return!!c.match(/^[ \t\f]*$/);case 2:return!c.length}throw Error("Unexpected whitespace: "+b);}
function Oj(a){this.f=a;this.b=[]}function Pj(a,b,c,d,e,f,g,h,l){this.b=a;this.element=b;this.f=c;this.Oa=d;this.l=e;this.h=f;this.Ke=g;this.j=h;this.ab=-1;this.g=l}function Qj(a,b){return a.h?!b.h||a.Oa>b.Oa?!0:a.j:!1}function Rj(a,b){return a.top-b.top}function Sj(a,b){return b.right-a.right}
function Tj(a,b){if(a===b)return!0;if(!a||!b||a.ia!==b.ia||a.K!==b.K||a.ja.length!==b.ja.length)return!1;for(var c=0;c<a.ja.length;c++){var d=a[c],e=b[c];if(!(d===e||d&&e&&d.node===e.node&&d.Pa===e.Pa&&d.ma===e.ma&&d.ya===e.ya&&d.wa===e.wa))return!1}return!0}function Uj(a){return{ja:[{node:a.U,Pa:Vj,ma:a.ma,ya:null,wa:null}],ia:0,K:!1}}function Wj(a,b){var c=new Xj(a.node,b,0);c.Pa=a.Pa;c.ma=a.ma;c.ya=a.ya;c.wa=a.wa?Wj(a.wa,Yj(b)):null;c.R=a.R;return c}var Vj=0;
function Zj(a,b,c,d,e,f,g){this.ga=a;this.wd=d;this.Wd=null;this.root=b;this.ca=c;this.type=f;e&&(e.Wd=this);this.b=g}function ak(a,b){this.Ie=a;this.count=b}
function Xj(a,b,c){this.U=a;this.parent=b;this.na=c;this.ia=0;this.K=!1;this.Pa=Vj;this.ma=b?b.ma:null;this.wa=this.ya=null;this.da=!1;this.Ca=!0;this.f=!1;this.u=b?b.u:0;this.w=this.l=this.ka=this.display=null;this.G="baseline";this.M="top";this.T=0;this.F=!1;this.Db=b?b.Db:0;this.I=this.J=!1;this.A=this.D=this.B=this.h=null;this.j=b?b.j:{};this.b=b?b.b:!1;this.V=b?b.V:"ltr";this.g=b?b.g:null;this.R=b?b.R:null}
function bk(a){a.Ca=!0;a.u=a.parent?a.parent.u:0;a.D=null;a.A=null;a.ia=0;a.K=!1;a.display=null;a.l=null;a.w=null;a.G="baseline";a.F=!1;a.Db=a.parent?a.parent.Db:0;a.h=null;a.B=null;a.ya=null;a.J=!1;a.I=!1;a.b=a.parent?a.parent.b:!1;a.ya=null;a.R=a.parent?a.parent.R:null}
function ck(a){var b=new Xj(a.U,a.parent,a.na);b.ia=a.ia;b.K=a.K;b.ya=a.ya;b.Pa=a.Pa;b.ma=a.ma;b.wa=a.wa;b.Ca=a.Ca;b.u=a.u;b.display=a.display;b.l=a.l;b.w=a.w;b.G=a.G;b.M=a.M;b.T=a.T;b.J=a.J;b.I=a.I;b.F=a.F;b.Db=a.Db;b.h=a.h;b.B=a.B;b.D=a.D;b.A=a.A;b.g=a.g;b.b=a.b;b.f=a.f;b.R=a.R;return b}Xj.prototype.modify=function(){return this.da?ck(this):this};function Yj(a){var b=a;do{if(b.da)break;b.da=!0;b=b.parent}while(b);return a}
Xj.prototype.clone=function(){for(var a=ck(this),b=a,c;c=b.parent;)c=ck(c),b=b.parent=c;return a};function dk(a){return{node:a.U,Pa:a.Pa,ma:a.ma,ya:a.ya,wa:a.wa?dk(a.wa):null,R:a.R}}function ek(a){var b=a,c=[];do b.g&&b.parent&&b.parent.g!==b.g||c.push(dk(b)),b=b.parent;while(b);return{ja:c,ia:a.ia,K:a.K}}function fk(a){for(a=a.parent;a;){if(a.J)return!0;a=a.parent}return!1}function gk(a){for(a=a.parent;a;){if(a.I)return a;a=a.parent}return null}
function hk(a,b){for(var c=a;c;){c.Ca||b(c);if(c.J)break;c=c.parent}}function ik(a){this.Ma=a;this.b=this.f=null}ik.prototype.clone=function(){var a=new ik(this.Ma);if(this.f){a.f=[];for(var b=0;b<this.f.length;++b)a.f[b]=this.f[b]}if(this.b)for(a.b=[],b=0;b<this.b.length;++b)a.b[b]=this.b[b];return a};
function jk(a,b){if(!b)return!1;if(a===b)return!0;if(!Tj(a.Ma,b.Ma))return!1;if(a.f){if(!b.f||a.f.length!==b.f.length)return!1;for(var c=0;c<a.f.length;c++)if(!Tj(a.f[c],b.f[c]))return!1}else if(b.f)return!1;if(a.b){if(!b.b||a.b.length!==b.b.length)return!1;for(c=0;c<a.b.length;c++)if(!Tj(a.b[c],b.b[c]))return!1}else if(b.b)return!1;return!0}function kk(a,b){this.f=a;this.b=b}kk.prototype.clone=function(){return new kk(this.f.clone(),this.b)};function lk(){this.b=[];this.f="any"}
lk.prototype.clone=function(){for(var a=new lk,b=this.b,c=a.b,d=0;d<b.length;d++)c[d]=b[d].clone();a.f=this.f;return a};function mk(a,b){if(a===b)return!0;if(!b||a.b.length!==b.b.length)return!1;for(var c=0;c<a.b.length;c++){var d=a.b[c],e=b.b[c];if(!e||d!==e&&!jk(d.f,e.f))return!1}return!0}function nk(){this.page=0;this.g={};this.b={};this.f=0}nk.prototype.clone=function(){var a=new nk;a.page=this.page;a.h=this.h;a.f=this.f;a.j=this.j;a.g=this.g;for(var b in this.b)a.b[b]=this.b[b].clone();return a};
function ok(a,b){if(a===b)return!0;if(!b||a.page!==b.page||a.f!==b.f)return!1;var c=Object.keys(a.b),d=Object.keys(b.b);if(c.length!==d.length)return!1;for(d=0;d<c.length;d++){var e=c[d];if(!mk(a.b[e],b.b[e]))return!1}return!0}
function pk(a){this.element=a;this.M=this.J=this.height=this.width=this.F=this.A=this.G=this.w=this.Qa=this.ka=this.Wa=this.da=this.marginBottom=this.marginTop=this.marginRight=this.marginLeft=this.top=this.left=0;this.Gb=this.T=null;this.ta=this.Qb=this.kb=this.Ac=this.g=0;this.b=!1}function qk(a){return a.marginTop+a.ka+a.A}function rk(a){return a.marginBottom+a.Qa+a.F}function sk(a){return a.marginLeft+a.da+a.w}function tk(a){return a.marginRight+a.Wa+a.G}
function uk(a,b){a.element=b.element;a.left=b.left;a.top=b.top;a.marginLeft=b.marginLeft;a.marginRight=b.marginRight;a.marginTop=b.marginTop;a.marginBottom=b.marginBottom;a.da=b.da;a.Wa=b.Wa;a.ka=b.ka;a.Qa=b.Qa;a.w=b.w;a.G=b.G;a.A=b.A;a.F=b.F;a.width=b.width;a.height=b.height;a.J=b.J;a.M=b.M;a.Gb=b.Gb;a.T=b.T;a.g=b.g;a.Ac=b.Ac;a.kb=b.kb;a.b=b.b}function vk(a,b,c){a.top=b;a.height=c;v(a.element,"top",b+"px");v(a.element,"height",c+"px")}
function wk(a,b,c){a.left=b;a.width=c;v(a.element,"left",b+"px");v(a.element,"width",c+"px")}function xk(a,b){this.b=a;this.f=b}t(xk,mc);xk.prototype.yc=function(a){this.b.appendChild(this.b.ownerDocument.createTextNode(a.b));return null};xk.prototype.dc=function(a){var b=this.b.ownerDocument.createElementNS("http://www.w3.org/1999/xhtml","img");b.setAttribute("src",a.url);this.b.appendChild(b);return null};xk.prototype.ob=function(a){this.Cb(a.values);return null};
xk.prototype.$b=function(a){a=a.oa().evaluate(this.f);"string"===typeof a&&this.b.appendChild(this.b.ownerDocument.createTextNode(a));return null};function yk(a){return!!a&&a!==dd&&a!==H&&a!==Vc};function zk(a,b,c){this.g=a;this.f=b;this.b=c}function Ak(){this.map=[]}function Bk(a){return a.map.length?a.map[a.map.length-1].b:0}function Ck(a,b){if(a.map.length){var c=a.map[a.map.length-1],d=c.b+b-c.f;c.f==c.g?(c.f=b,c.g=b,c.b=d):a.map.push(new zk(b,b,d))}else a.map.push(new zk(b,b,b))}function Dk(a,b){a.map.length?a.map[a.map.length-1].f=b:a.map.push(new zk(b,0,0))}function Ek(a,b){var c=Ha(a.map.length,function(c){return b<=a.map[c].f}),c=a.map[c];return c.b-Math.max(0,c.g-b)}
function Fk(a,b){var c=Ha(a.map.length,function(c){return b<=a.map[c].b}),c=a.map[c];return c.g-(c.b-b)}function Gk(a,b,c,d,e,f,g,h){this.A=a;this.style=b;this.offset=c;this.B=d;this.j=e;this.b=e.b;this.Ka=f;this.Ra=g;this.F=h;this.l=this.u=null;this.w={};this.g=this.f=this.h=null;Hk(this)&&(b=b._pseudos)&&b.before&&(a=new Gk(a,b.before,c,!1,e,Ik(this),g,!0),c=Jk(a,"content"),yk(c)&&(this.h=a,this.g=a.g));this.g=Kk(Lk(this,"before"),this.g);this.Ra&&Mk[this.g]&&(e.g=Kk(e.g,this.g))}
function Jk(a,b,c){if(!(b in a.w)){var d=a.style[b];a.w[b]=d?d.evaluate(a.A,b):c||null}return a.w[b]}function Nk(a){return Jk(a,"display",Wc)}function Ik(a){if(null===a.u){var b=Nk(a),c=Jk(a,"position"),d=Jk(a,"float");a.u=Ok(b,c,d,a.B).display===Hc}return a.u}function Hk(a){null===a.l&&(a.l=a.F&&Nk(a)!==H);return a.l}function Lk(a,b){var c=null;if(Ik(a)){var d=Jk(a,"break-"+b);d&&(c=d.toString())}return c}function Pk(a){this.g=a;this.b=[];this.Ra=this.Ka=!0;this.f=[]}
function Qk(a){return a.b[a.b.length-1]}function Rk(a){return a.b.every(function(a){return Nk(a)!==H})}Pk.prototype.push=function(a,b,c,d){var e=Qk(this);d&&e&&d.b!==e.b&&this.f.push({Ka:this.Ka,Ra:this.Ra});e=d||e.j;d=this.Ra||!!d;var f=Rk(this);a=new Gk(this.g,a,b,c,e,d||this.Ka,d,f);this.b.push(a);this.Ka=Hk(a)?!a.h&&Ik(a):this.Ka;this.Ra=Hk(a)?!a.h&&d:this.Ra;return a};
Pk.prototype.pop=function(a){var b=this.b.pop(),c=this.Ka,d=this.Ra;if(Hk(b)){var e=b.style._pseudos;e&&e.after&&(a=new Gk(b.A,e.after,a,!1,b.j,c,d,!0),c=Jk(a,"content"),yk(c)&&(b.f=a))}this.Ra&&b.f&&(a=Lk(b.f,"before"),b.j.g=Kk(b.j.g,a));if(a=Qk(this))a.b===b.b?Hk(b)&&(this.Ka=this.Ra=!1):(a=this.f.pop(),this.Ka=a.Ka,this.Ra=a.Ra);return b};
function Sk(a,b){if(!b.Ka)return b.offset;var c=a.b.length-1,d=a.b[c];d===b&&(c--,d=a.b[c]);for(;0<=c;){if(d.b!==b.b)return b.offset;if(!d.Ka||d.B)return d.offset;b=d;d=a.b[--c]}throw Error("No block start offset found!");}
function Tk(a,b,c,d,e,f,g,h){this.ca=a;this.root=a.root;this.ta=c;this.h=d;this.u=f;this.f=this.root;this.J={};this.M={};this.A={};this.F=[];this.w=this.I=this.G=null;this.T=new Ci(b,d,g,h);this.g=new Ak;this.Ma=!0;this.da=[];this.sa=e;this.pa=this.ka=!1;this.b=a=ij(a,this.root);this.V={};this.j=new Pk(d);Ck(this.g,a);d=Uk(this,this.root);Li(this.T,this.root,d);Vk(this,d,!1);this.B=!0;switch(this.root.namespaceURI){case "http://www.w3.org/1999/xhtml":case "http://www.gribuser.ru/xml/fictionbook/2.0":this.B=
!1}this.da.push(!0);this.M={};this.M["e"+a]=d;this.b++;Wk(this,-1)}function Xk(a,b,c,d){return(b=b[d])&&b.evaluate(a.h)!==c[d]}function Yk(a,b,c){for(var d in c){var e=b[d];e?(a.J[d]=e,delete b[d]):(e=c[d])&&(a.J[d]=new V(e,33554432))}}var Zk=["column-count","column-width"];
function Vk(a,b,c){c||["writing-mode","direction"].forEach(function(a){b[a]&&(this.J[a]=b[a])},a);if(!a.ka){var d=Xk(a,b,a.u.j,"background-color")?b["background-color"].evaluate(a.h):null,e=Xk(a,b,a.u.j,"background-image")?b["background-image"].evaluate(a.h):null;if(d&&d!==Vc||e&&e!==Vc)Yk(a,b,a.u.j),a.ka=!0}if(!a.pa)for(d=0;d<Zk.length;d++)if(Xk(a,b,a.u.u,Zk[d])){Yk(a,b,a.u.u);a.pa=!0;break}if(!c&&(c=b["font-size"])){d=c.evaluate(a.h);c=d.H;switch(d.ea){case "em":case "rem":c*=a.h.u;break;case "ex":case "rex":c*=
a.h.u*wb.ex/wb.em;break;case "%":c*=a.h.u/100;break;default:(d=wb[d.ea])&&(c*=d)}a.h.V=c}}function $k(a){for(var b=0;!a.B&&(b+=5E3,al(a,b,0)!=Number.POSITIVE_INFINITY););return a.J}function Uk(a,b){if(b.style instanceof CSSStyleDeclaration){var c=b.getAttribute("style");if(c){var d=a.ca.url,e=new Yi(a.ta,a.u),c=new Me(c,e);try{zf(new qf(ff,c,e,d),Number.POSITIVE_INFINITY,!1,!0,!1,!1)}catch(f){u.b(f,"Style attribute parse error:")}return e.b}}return{}}
function Wk(a,b){if(!(b>=a.b)){var c=a.h,d=ij(a.ca,a.root);if(b<d){var e=a.l(a.root,!1),f=e["flow-into"],f=f?f.evaluate(c,"flow-into").toString():"body",f=bl(a,f,e,a.root,d);!a.j.b.length&&a.j.push(e,d,!0,f)}d=lj(a.ca,b);e=jj(a.ca,d,0,!1);if(!(e>=a.b))for(;;){if(1!=d.nodeType)e+=d.textContent.length;else{var g=d;if(e!=ij(a.ca,g))throw Error("Inconsistent offset");var h=a.l(g,!1);if(f=h["flow-into"])f=f.evaluate(c,"flow-into").toString(),bl(a,f,h,g,e);e++}if(e>=a.b)break;f=d.firstChild;if(!f)for(;!(f=
d.nextSibling);)if(d=d.parentNode,d===a.root)return;d=f}}}function cl(a,b){a.G=b;for(var c=0;c<a.F.length;c++)dl(a.G,a.F[c],a.A[a.F[c].b])}
function bl(a,b,c,d,e){var f=0,g=Number.POSITIVE_INFINITY,h=!1,l=!1,k=!1,m=c["flow-options"];if(m){var p;a:{if(h=m.evaluate(a.h,"flow-options")){l=new fg;try{h.$(l);p=l.b;break a}catch(q){u.b(q,"toSet:")}}p={}}h=!!p.exclusive;l=!!p["static"];k=!!p.last}(p=c["flow-linger"])&&(g=hg(p.evaluate(a.h,"flow-linger"),Number.POSITIVE_INFINITY));(c=c["flow-priority"])&&(f=hg(c.evaluate(a.h,"flow-priority"),0));c=a.V[e]||null;p=a.A[b];p||(p=Qk(a.j),p=a.A[b]=new Oj(p?p.j.b:null));d=new Pj(b,d,e,f,g,h,l,k,c);
a.F.push(d);a.I==b&&(a.I=null);a.G&&dl(a.G,d,p);return d}function el(a,b,c,d){Mk[b]&&(d=a.A[d].b,(!d.length||d[d.length-1]<c)&&d.push(c));a.V[c]=Kk(a.V[c],b)}
function al(a,b,c){var d=-1;if(b<=a.b&&(d=Ek(a.g,b),d+=c,d<Bk(a.g)))return Fk(a.g,d);if(!a.f)return Number.POSITIVE_INFINITY;for(var e=a.h;;){var f=a.f.firstChild;if(!f)for(;;){if(1==a.f.nodeType){var f=a.T,g=a.f;if(f.kb.pop()!==g)throw Error("Invalid call to popElement");f.Gb.pop();f.ka.pop();f.Eb.pop();f.Fb.pop();f.pop();Ji(f);a.Ma=a.da.pop();g=a.j.pop(a.b);f=null;g.f&&(f=Lk(g.f,"before"),el(a,f,g.f.Ka?Sk(a.j,g):g.f.offset,g.b),f=Lk(g.f,"after"));f=Kk(f,Lk(g,"after"));el(a,f,a.b,g.b)}if(f=a.f.nextSibling)break;
a.f=a.f.parentNode;if(a.f===a.root)return a.f=null,b<a.b&&(0>d&&(d=Ek(a.g,b),d+=c),d<=Bk(a.g))?Fk(a.g,d):Number.POSITIVE_INFINITY}a.f=f;if(1!=a.f.nodeType){a.b+=a.f.textContent.length;var f=a.j,g=a.f,h=Qk(f);(f.Ka||f.Ra)&&Hk(h)&&(h=Jk(h,"white-space",dd).toString(),Nj(g,Mj(h))||(f.Ka=!1,f.Ra=!1));a.Ma?Ck(a.g,a.b):Dk(a.g,a.b)}else{g=a.f;f=Uk(a,g);a.da.push(a.Ma);Li(a.T,g,f);(h=g.getAttribute("id")||g.getAttributeNS("http://www.w3.org/XML/1998/namespace","id"))&&h===a.w&&(a.w=null);a.B||"body"!=g.localName||
g.parentNode!=a.root||(Vk(a,f,!0),a.B=!0);if(h=f["flow-into"]){var h=h.evaluate(e,"flow-into").toString(),l=bl(a,h,f,g,a.b);a.Ma=!!a.sa[h];g=a.j.push(f,a.b,g===a.root,l)}else g=a.j.push(f,a.b,g===a.root);h=Sk(a.j,g);el(a,g.g,h,g.b);g.h&&(l=Lk(g.h,"after"),el(a,l,g.h.Ka?h:g.offset,g.b));a.Ma&&Nk(g)===H&&(a.Ma=!1);if(ij(a.ca,a.f)!=a.b)throw Error("Inconsistent offset");a.M["e"+a.b]=f;a.b++;a.Ma?Ck(a.g,a.b):Dk(a.g,a.b);if(b<a.b&&(0>d&&(d=Ek(a.g,b),d+=c),d<=Bk(a.g)))return Fk(a.g,d)}}}
Tk.prototype.l=function(a,b){var c=ij(this.ca,a),d="e"+c;b&&(c=jj(this.ca,a,0,!0));this.b<=c&&al(this,c,0);return this.M[d]};var fl={"font-style":dd,"font-variant":dd,"font-weight":dd},gl="OTTO"+(new Date).valueOf(),hl=1;function il(a,b){var c={},d;for(d in a)c[d]=a[d].evaluate(b,d);for(var e in fl)c[e]||(c[e]=fl[e]);return c}function jl(a){a=this.Lb=a;var b=new za,c;for(c in fl)b.append(" "),b.append(a[c].toString());this.f=b.toString();this.src=this.Lb.src?this.Lb.src.toString():null;this.g=[];this.h=[];this.b=(c=this.Lb["font-family"])?c.stringValue():null}
function kl(a,b,c){var d=new za;d.append("@font-face {\n  font-family: ");d.append(a.b);d.append(";\n  ");for(var e in fl)d.append(e),d.append(": "),a.Lb[e].Ia(d,!0),d.append(";\n  ");c?(d.append('src: url("'),b=(window.URL||window.webkitURL).createObjectURL(c),d.append(b),a.g.push(b),a.h.push(c),d.append('")')):(d.append("src: "),d.append(b));d.append(";\n}\n");return d.toString()}function ll(a){this.f=a;this.b={}}
function ml(a,b){if(b instanceof pc){for(var c=b.values,d=[],e=0;e<c.length;e++){var f=c[e],g=a.b[f.stringValue()];g&&d.push(C(g));d.push(f)}return new pc(d)}return(c=a.b[b.stringValue()])?new pc([C(c),b]):b}function nl(a,b){this.b=a;this.body=b;this.f={};this.g=0}function ol(a,b,c){b=b.b;var d=c.b[b];if(d)return d;d="Fnt_"+ ++a.g;return c.b[b]=d}
function pl(a,b,c,d){var e=I("initFont"),f=b.src,g={},h;for(h in fl)g[h]=b.Lb[h];d=ol(a,b,d);g["font-family"]=C(d);var l=new jl(g),k=a.body.ownerDocument.createElement("span");k.textContent="M";var m=(new Date).valueOf()+1E3;b=a.b.ownerDocument.createElement("style");h=gl+hl++;b.textContent=kl(l,"",Qe([h]));a.b.appendChild(b);a.body.appendChild(k);k.style.visibility="hidden";k.style.fontFamily=d;for(var p in fl)v(k,p,g[p].toString());var g=k.getBoundingClientRect(),q=g.right-g.left,w=g.bottom-g.top;
b.textContent=kl(l,f,c);u.g("Starting to load font:",f);var r=!1;$d(function(){var a=k.getBoundingClientRect(),b=a.bottom-a.top;return q!=a.right-a.left||w!=b?(r=!0,J(!1)):(new Date).valueOf()>m?J(!1):Zd(10)}).then(function(){r?u.g("Loaded font:",f):u.b("Failed to load font:",f);a.body.removeChild(k);L(e,l)});return K(e)}
function ql(a,b,c){var d=b.src,e=a.f[d];e?de(e,function(a){if(a.f==b.f){var e=b.b,f=c.b[e];a=a.b;if(f){if(f!=a)throw Error("E_FONT_FAMILY_INCONSISTENT "+b.b);}else c.b[e]=a;u.b("Found already-loaded font:",d)}else u.b("E_FONT_FACE_INCOMPATIBLE",b.src)}):(e=new ce(function(){var e=I("loadFont"),g=c.f?c.f(d):null;g?Pe(d,"blob").then(function(d){d.Nc?g(d.Nc).then(function(d){pl(a,b,d,c).ra(e)}):L(e,null)}):pl(a,b,null,c).ra(e);return K(e)},"loadFont "+d),a.f[d]=e,e.start());return e}
function rl(a,b,c){for(var d=[],e=0;e<b.length;e++){var f=b[e];f.src&&f.b?d.push(ql(a,f,c)):u.b("E_FONT_FACE_INVALID")}return ee(d)};Cd("SIMPLE_PROPERTY",function(a){var b=a.name,c=a.value;switch(b){case "page-break-before":case "page-break-after":case "page-break-inside":return{name:b.replace(/^page-/,""),value:c===Fc?gd:c,important:a.important};default:return a}});var Mk={page:!0,left:!0,right:!0,recto:!0,verso:!0,column:!0,region:!0},sl={avoid:!0,"avoid-page":!0,"avoid-column":!0,"avoid-region":!0};
function Kk(a,b){if(a)if(b){var c=!!Mk[a],d=!!Mk[b];if(c&&d)switch(b){case "column":return a;case "region":return"column"===a?b:a;default:return b}else return d?b:c?a:sl[b]?b:sl[a]?a:b}else return a;else return b}function tl(a){switch(a){case "left":case "right":case "recto":case "verso":return a;default:return"any"}};var ul={img:!0,svg:!0,audio:!0,video:!0};
function vl(a,b,c,d){var e=a.D;if(!e)return NaN;if(1==e.nodeType){if(a.K){var f=Lj(b,e);if(f.right>=f.left&&f.bottom>=f.top)return d?f.left:f.bottom}return NaN}var f=NaN,g=e.ownerDocument.createRange(),h=e.textContent.length;if(!h)return NaN;a.K&&(c+=h);c>=h&&(c=h-1);g.setStart(e,c);g.setEnd(e,c+1);a=wl(b,g);if(c=d){c=document.body;if(null==Sa){var l=c.ownerDocument,g=l.createElement("div");g.style.position="absolute";g.style.top="0px";g.style.left="0px";g.style.width="100px";g.style.height="100px";
g.style.overflow="hidden";g.style.lineHeight="16px";g.style.fontSize="16px";v(g,"writing-mode","vertical-rl");c.appendChild(g);h=l.createTextNode("a a a a a a a a a a a a a a a a");g.appendChild(h);l=l.createRange();l.setStart(h,0);l.setEnd(h,1);h=l.getBoundingClientRect();Sa=10>h.right-h.left;c.removeChild(g)}c=Sa}if(c){c=e.ownerDocument.createRange();c.setStart(e,0);c.setEnd(e,e.textContent.length);b=wl(b,c);e=[];for(c=0;c<a.length;c++){g=a[c];for(h=0;h<b.length;h++)if(l=b[h],g.top>=l.top&&g.bottom<=
l.bottom&&1>Math.abs(g.left-l.left)){e.push({top:g.top,left:l.left,bottom:g.bottom,right:l.right});break}h==b.length&&(u.b("Could not fix character box"),e.push(g))}a=e}for(e=b=0;e<a.length;e++)c=a[e],g=d?c.bottom-c.top:c.right-c.left,c.right>c.left&&c.bottom>c.top&&(isNaN(f)||g>b)&&(f=d?c.left:c.bottom,b=g);return f}
function xl(a){for(var b=Bd.RESOLVE_LAYOUT_PROCESSOR||[],c=0;c<b.length;c++){var d=b[c](a);if(d)return d}throw Error("No processor found for a formatting context: Table formatting context (vivliostyle.table.TableFormattingContext)");}function yl(a,b){this.j=a;this.l=b;this.g=!1;this.h=null}yl.prototype.f=function(a,b){if(b<this.l)return null;this.g||(this.h=zl(a,this,0<b),this.g=!0);return this.h};yl.prototype.b=function(){return this.l};
function Al(a,b,c,d){this.position=a;this.u=b;this.j=c;this.l=d;this.g=!1}Al.prototype.f=function(a,b){if(!this.g){var c=vl(this.position,a.h,0,a.b);this.j=this.position.f=Bl(a,c);this.g=!0}b<this.b()?c=null:(a.g=this.l,c=this.position);return c};Al.prototype.b=function(){if(!this.g)throw Error("EdgeBreakPosition.prototype.updateEdge not called");return(sl[this.u]?1:0)+(this.j?3:0)+(this.position.parent?this.position.parent.u:0)};function Cl(a,b,c){this.na=a;this.f=b;this.b=c}
function Dl(a){for(var b=1;b<a.length;b++){var c=a[b-1],d=a[b];c===d?u.b("validateCheckPoints: duplicate entry"):c.na>=d.na?u.b("validateCheckPoints: incorrect boxOffset"):c.U==d.U&&(d.K?c.K&&u.b("validateCheckPoints: duplicate after points"):c.K?u.b("validateCheckPoints: inconsistent after point"):d.na-c.na!=d.ia-c.ia&&u.b("validateCheckPoints: boxOffset inconsistent with offsetInNode"))}}
function El(a,b,c,d){pk.call(this,a);this.Jd=a.lastChild;this.f=b;this.h=c;this.jb=d;this.Ae=a.ownerDocument;this.Zc=!1;this.sa=this.Ya=this.Aa=this.pa=this.V=0;this.Eb=this.Fb=this.B=this.Xa=null;this.Nd=!1;this.l=this.j=this.I=null;this.de=!0;this.ad=this.gd=this.bd=0;this.u=!0}t(El,pk);El.prototype.clone=function(){var a=new El(this.element,this.f,this.h,this.jb);uk(a,this);a.Jd=this.Jd;a.Zc=this.Zc;a.B=this.B?this.B.clone():null;a.Fb=this.Fb.concat();return a};
function Bl(a,b){return a.b?b<a.sa:b>a.sa}El.prototype.Md=function(a){var b=this,c=I("openAllViews"),d=a.ja;Fl(b.f,b.element,b.Zc);var e=d.length-1,f=null;$d(function(){for(;0<=e;){f=Wj(d[e],f);if(!e&&(f.ia=a.ia,f.K=a.K,f.K))break;var c=Gl(b.f,f,!e&&!f.ia);e--;if(c.va())return c}return J(!1)}).then(function(){L(c,f)});return K(c)};var Hl=/^[^A-Za-z0-9_\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]*([A-Za-z0-9_\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527][^A-Za-z0-9_\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]*)?/;
function Il(a,b){if(b.g&&b.Ca&&!b.K&&!b.g.count&&1!=b.D.nodeType){var c=b.D.textContent.match(Hl);return Jl(a.f,b,c[0].length)}return J(b)}
function Kl(a,b,c){var d=I("buildViewToNextBlockEdge");ae(function(d){b.D&&c.push(Yj(b));Il(a,b).then(function(e){e!==b&&(b=e,c.push(Yj(b)));Ll(a.f,b).then(function(c){if(b=c){if(!Ml(a.jb,b)&&(b=b.modify(),b.f=!0,a.u)){O(d);return}b.l&&!a.b?Nl(a,b).then(function(c){b=c;!b||a.u&&b&&b.f||0<a.f.f.b.length?O(d):M(d)}):b.Ca?M(d):O(d)}else O(d)})})}).then(function(){L(d,b)});return K(d)}
function Ol(a,b){if(!b.D)return J(b);var c=b.U,d=I("buildDeepElementView");ae(function(d){Il(a,b).then(function(e){if(e!==b){for(var f=e;f&&f.U!=c;)f=f.parent;if(!f){b=e;O(d);return}}Ll(a.f,e).then(function(e){(b=e)&&b.U!=c?Ml(a.jb,b)?M(d):(b=b.modify(),b.f=!0,a.u?O(d):M(d)):O(d)})})}).then(function(){L(d,b)});return K(d)}
function Pl(a,b,c,d,e){var f=a.Ae.createElement("div");a.b?(v(f,"height",d+"px"),v(f,"width",e+"px")):(v(f,"width",d+"px"),v(f,"height",e+"px"));v(f,"float",c);v(f,"clear",c);a.element.insertBefore(f,b);return f}function Ql(a){for(var b=a.element.firstChild;b;){var c=b.nextSibling;if(1==b.nodeType){var d=b.style.cssFloat;if("left"==d||"right"==d)a.element.removeChild(b);else break}b=c}}
function Rl(a){for(var b=a.element.firstChild,c=a.Eb,d=a.b?a.b?a.V:a.Aa:a.b?a.Ya:a.V,e=a.b?a.b?a.pa:a.Ya:a.b?a.Aa:a.pa,f=0;f<c.length;f++){var g=c[f],h=g.Y-g.ba;g.left=Pl(a,b,"left",g.ha-d,h);g.right=Pl(a,b,"right",e-g.aa,h)}}function Sl(a,b,c,d,e){var f;if(b&&b.K&&!b.Ca&&(f=vl(b,a.h,0,a.b),!isNaN(f)))return f;b=c[d];for(e-=b.na;;){f=vl(b,a.h,e,a.b);if(!isNaN(f))return f;if(0<e)e--;else{d--;if(0>d)return a.Aa;b=c[d];1!=b.D.nodeType&&(e=b.D.textContent.length)}}}
function X(a){return"number"==typeof a?a:(a=a.match(/^(-?[0-9]*(\.[0-9]*)?)px$/))?parseFloat(a[0]):0}function Tl(a,b){var c=Ul(a.h,b),d=new Kf;c&&(d.left=X(c.marginLeft),d.top=X(c.marginTop),d.right=X(c.marginRight),d.bottom=X(c.marginBottom));return d}
function Vl(a,b){var c=Ul(a.h,b),d=new Kf;if(c){if("border-box"==c.boxSizing)return Tl(a,b);d.left=X(c.marginLeft)+X(c.borderLeftWidth)+X(c.paddingLeft);d.top=X(c.marginTop)+X(c.borderTopWidth)+X(c.paddingTop);d.right=X(c.marginRight)+X(c.borderRightWidth)+X(c.paddingRight);d.bottom=X(c.marginBottom)+X(c.borderBottomWidth)+X(c.paddingBottom)}return d}
function Wl(a,b,c){if(a=Ul(a.h,b))c.marginLeft=X(a.marginLeft),c.da=X(a.borderLeftWidth),c.w=X(a.paddingLeft),c.marginTop=X(a.marginTop),c.ka=X(a.borderTopWidth),c.A=X(a.paddingTop),c.marginRight=X(a.marginRight),c.Wa=X(a.borderRightWidth),c.G=X(a.paddingRight),c.marginBottom=X(a.marginBottom),c.Qa=X(a.borderBottomWidth),c.F=X(a.paddingBottom)}function Xl(a,b,c){b=new Cl(b,c,c);a.j?a.j.push(b):a.j=[b]}
function Yl(a,b,c,d){if(a.j&&a.j[a.j.length-1].b)return Xl(a,b,c),J(!0);d+=40*(a.b?-1:1);var e=a.B,f=!e;if(f){var g=a.element.ownerDocument.createElement("div");v(g,"position","absolute");var h=a.f.clone(),e=new El(g,h,a.h,a.jb);a.B=e;e.b=Zl(a.f,a.b,g);e.Zc=!0;a.b?(e.left=0,v(e.element,"width","2em")):(e.top=a.Ya,v(e.element,"height","2em"))}a.element.appendChild(e.element);Wl(a,e.element,e);g=(a.b?-1:1)*(d-a.Aa);a.b?e.height=a.Xa.Y-a.Xa.ba-qk(e)-rk(e):e.width=a.Xa.aa-a.Xa.ha-sk(e)-tk(e);d=(a.b?-1:
1)*(a.Ya-d)-(a.b?sk(e)-tk(e):qk(e)+rk(e));if(f&&18>d)return a.element.removeChild(e.element),a.B=null,Xl(a,b,c),J(!0);if(!a.b&&e.top<g)return a.element.removeChild(e.element),Xl(a,b,c),J(!0);var l=I("layoutFootnoteInner");a.b?wk(e,0,d):vk(e,g,d);e.J=a.J+a.left+sk(a);e.M=a.M+a.top+qk(a);e.T=a.T;var k=new ik(c);f?($l(e),d=J(!0)):e.T.length?d=am(e):(bm(e),d=J(!0));d.then(function(){cm(e,k).then(function(d){if(f&&d)a.element.removeChild(e.element),Xl(a,b,c),a.B=null,L(l,!0);else{a.b?(a.sa=a.Ya+(e.g+sk(e)+
tk(e)),wk(e,0,e.g)):(a.sa=a.Ya-(e.g+qk(e)+rk(e)),vk(e,a.sa-a.Aa,e.g));var g;!a.b&&0<e.T.length?g=am(e):g=J(d);g.then(function(d){d=new Cl(b,c,d?d.Ma:null);a.j?a.j.push(d):a.j=[d];L(l,!0)})}})});return K(l)}
function dm(a,b){var c=I("layoutFootnote"),d=b.D;d.setAttribute("style","");v(d,"display","inline-block");d.textContent="M";var e=Lj(a.h,d),f=a.b?e.left:e.bottom;d.textContent="";em(a.f,b,"footnote-call",d);d.textContent||d.parentNode.removeChild(d);d=Uj(b);e=b.na;b=b.modify();b.K=!0;Yl(a,e,d,f).then(function(){a.B&&a.B.element.parentNode&&a.element.removeChild(a.B.element);Bl(a,f)&&a.I.length&&(b.f=!0);L(c,b)});return K(c)}
function fm(a,b){var c=I("layoutFloat"),d=b.D,e=b.l,f=b.ka,g=b.parent?b.parent.V:"ltr",h=a.f.f,l=b.D.parentNode;"page"===f?gm(h,d,e):(v(d,"float","none"),v(d,"display","inline-block"),v(d,"vertical-align","top"));Ol(a,b).then(function(k){var m=Lj(a.h,d),p=Tl(a,d),m=new If(m.left-p.left,m.top-p.top,m.right+p.right,m.bottom+p.bottom);if("page"===f)hm(h,b,a.f)?(m=l.ownerDocument.createElement("span"),v(m,"width","0"),v(m,"height","0"),l.appendChild(m),k.D=m,L(c,k)):im(h,b,m).then(function(){L(c,null)});
else{e=jm(e,a.b,g);for(var q=a.V,w=a.pa,p=b.parent;p&&p.Ca;)p=p.parent;if(p){var r=p.D.ownerDocument.createElement("div");r.style.left="0px";r.style.top="0px";a.b?(r.style.bottom="0px",r.style.width="1px"):(r.style.right="0px",r.style.height="1px");p.D.appendChild(r);var x=Lj(a.h,r),q=Math.max(a.b?x.top:x.left,q),w=Math.min(a.b?x.bottom:x.right,w);p.D.removeChild(r);r=a.b?m.Y-m.ba:m.aa-m.ha;"left"==e?w=Math.max(w,q+r):q=Math.min(q,w-r);p.D.appendChild(b.D)}r=new If(q,(a.b?-1:1)*a.Aa,w,(a.b?-1:1)*
a.Ya);q=m;a.b&&(q=Zf(m));w=a.b?-1:1;q.ba<a.ad*w&&(x=q.Y-q.ba,q.ba=a.ad*w,q.Y=q.ba+x);dg(r,a.Eb,q,e);a.b&&(m=new If(-q.Y,q.ha,-q.ba,q.aa));r=Vl(a,d);v(d,"width",m.aa-m.ha-r.left-r.right+"px");v(d,"height",m.Y-m.ba-r.top-r.bottom+"px");v(d,"position","absolute");v(d,"display",b.display);w=null;p&&(p.I?w=p:w=gk(p));w?(r=w.D.ownerDocument.createElement("div"),r.style.position="absolute",w.b?r.style.right="0":r.style.left="0",r.style.top="0",w.D.appendChild(r),p=Lj(a.h,r),w.D.removeChild(r)):p={left:a.b?
a.Ya:a.V,right:a.b?a.Aa:a.pa,top:a.b?a.V:a.Aa};(w?w.b:a.b)?v(d,"right",p.right-m.aa+a.G+"px"):v(d,"left",m.ha-p.left+a.w+"px");v(d,"top",m.ba-p.top+a.A+"px");b.A&&(b.A.parentNode.removeChild(b.A),b.A=null);p=a.b?m.ha:m.Y;m=a.b?m.aa:m.ba;Bl(a,p)&&a.I.length?(b=b.modify(),b.f=!0,L(c,b)):(Ql(a),r=new If(a.b?a.Ya:a.V,a.b?a.V:a.Aa,a.b?a.Aa:a.pa,a.b?a.pa:a.Ya),a.b&&(r=Zf(r)),eg(r,a.Eb,q,e),Rl(a),"left"==e?a.bd=p:a.gd=p,a.ad=m,km(a,p),L(c,k))}});return K(c)}
function lm(a,b){if(!a.K||a.Ca){for(var c=a.D,d="";c&&b&&!d&&(1!=c.nodeType||(d=c.style.textAlign,b));c=c.parentNode);if(!b||"justify"==d){var c=a.D,e=c.ownerDocument,d=e.createElement("span");d.style.visibility="hidden";var f=document.body;if(null===Ta){var g=f.ownerDocument,h=g.createElement("div");h.style.position="absolute";h.style.top="0px";h.style.left="0px";h.style.width="30px";h.style.height="100px";h.style.lineHeight="16px";h.style.fontSize="16px";h.style.textAlign="justify";f.appendChild(h);
var l=g.createTextNode("a | ");h.appendChild(l);var k=g.createElement("span");k.style.display="inline-block";k.style.width="30px";h.appendChild(k);g=g.createRange();g.setStart(l,0);g.setEnd(l,3);Ta=27>g.getBoundingClientRect().right;f.removeChild(h)}Ta?a.b?d.style.marginTop="100%":d.style.marginLeft="100%":(d.style.display="inline-block",a.b?d.style.height="100%":d.style.width="100%");d.textContent=" #";d.setAttribute("data-adapt-spec","1");f=b&&(a.K||1!=c.nodeType)?c.nextSibling:c;if(c=c.parentNode)c.insertBefore(d,
f),b||(e=e.createElement("div"),c.insertBefore(e,f),d.style.lineHeight="80px",e.style.marginTop="-80px",e.style.height="0px",e.setAttribute("data-adapt-spec","1"))}}}
function mm(a,b,c,d){var e=I("processLineStyling");Dl(d);var f=d.concat([]);d.splice(0,d.length);var g=0,h=b.g;0==h.count&&(h=h.Ie);ae(function(d){if(h){var e=nm(a,f),l=h.count-g;if(e.length<=l)O(d);else{var p=om(a,f,e[l-1]);pm(a,p,!1,!1).then(function(){g+=l;Jl(a.f,p,0).then(function(e){b=e;lm(b,!1);h=b.g;f=[];Kl(a,b,f).then(function(b){c=b;0<a.f.f.b.length?O(d):M(d)})})})}}else O(d)}).then(function(){Array.prototype.push.apply(d,f);Dl(d);L(e,c)});return K(e)}
function rm(a,b){for(var c=0,d=0,e=b.length-1;0<=e;e--){var f=b[e];if(!f.K||!f.D||1!=f.D.nodeType)break;f=Tl(a,f.D);f=a.b?-f.left:f.bottom;0<f?c=Math.max(c,f):d=Math.min(d,f)}return c-d}
function sm(a,b){var c=I("layoutBreakableBlock"),d=[];Kl(a,b,d).then(function(e){if(0<a.f.f.b.length)L(c,e);else{var f=d.length-1;if(0>f)L(c,e);else{var f=Sl(a,e,d,f,d[f].na),g=Bl(a,f);e||(f+=rm(a,d));km(a,f);var h;b.g?h=mm(a,b,e,d):h=J(e);h.then(function(b){0<d.length&&(a.I.push(new yl(d,d[0].u)),g&&(2!=d.length&&0<a.I.length||d[0].U!=d[1].U||!ul[d[0].U.localName])&&b&&(b=b.modify(),b.f=!0));L(c,b)})}}});return K(c)}
function om(a,b,c){Dl(b);for(var d=0,e=b[0].na,f=d,g=b.length-1,h=b[g].na,l;e<h;){l=e+Math.ceil((h-e)/2);for(var f=d,k=g;f<k;){var m=f+Math.ceil((k-f)/2);b[m].na>l?k=m-1:f=m}k=Sl(a,null,b,f,l);if(a.b?k<c:k>c){for(h=l-1;b[f].na==l;)f--;g=f}else km(a,k),e=l,d=f}a=b[f];b=a.D;1!=b.nodeType&&(a.K?a.ia=b.length:(e-=a.na,c=b.data,173==c.charCodeAt(e)?(b.replaceData(e,c.length-e,"-"),e++):(d=c.charAt(e),e++,f=c.charAt(e),b.replaceData(e,c.length-e,Ea(d)&&Ea(f)?"-":"")),0<e&&(a=a.modify(),a.ia+=e,a.h=null)));
return a}
function nm(a,b){for(var c=[],d=b[0].D,e=b[b.length-1].D,f=[],g=d.ownerDocument.createRange(),h=!1,l=null,k=!1,m=!0;m;){var p=!0;do{var q=null;d==e&&(m=!1);1!=d.nodeType?(k||(g.setStartBefore(d),k=!0),l=d):h?h=!1:d.getAttribute("data-adapt-spec")?p=!k:q=d.firstChild;q||(q=d.nextSibling,q||(h=!0,q=d.parentNode));d=q}while(p&&m);if(k){g.setEndAfter(l);k=wl(a.h,g);for(p=0;p<k.length;p++)f.push(k[p]);k=!1}}f.sort(a.b?Sj:Rj);l=d=h=g=e=0;for(m=a.b?-1:1;;){if(l<f.length&&(k=f[l],p=1,0<d&&(p=Math.max(a.b?k.right-
k.left:k.bottom-k.top,1),p=m*(a.b?k.right:k.top)<m*e?m*((a.b?k.left:k.bottom)-e)/p:m*(a.b?k.left:k.bottom)>m*g?m*(g-(a.b?k.right:k.top))/p:1),!d||.6<=p||.2<=p&&(a.b?k.top:k.left)>=h-1)){h=a.b?k.bottom:k.right;a.b?(e=d?Math.max(e,k.right):k.right,g=d?Math.min(g,k.left):k.left):(e=d?Math.min(e,k.top):k.top,g=d?Math.max(g,k.bottom):k.bottom);d++;l++;continue}0<d&&(c.push(g),d=0);if(l>=f.length)break}c.sort(Ia);a.b&&c.reverse();return c}
function tm(a,b){if(!a.j)return J(!0);for(var c=!1,d=a.j.length-1;0<=d;--d){var e=a.j[d];if(e.na<=b)break;a.j.pop();e.b!==e.f&&(c=!0)}if(!c)return J(!0);var f=I("clearFootnotes"),g=a.g+a.Aa,h=a.j;a.B=null;a.j=null;var l=0;$d(function(){for(;l<h.length;){var b=h[l++],b=Yl(a,b.na,b.f,g);if(b.va())return b}return J(!1)}).then(function(){L(f,!0)});return K(f)}
function zl(a,b,c){for(var d=b.j,e=d[0];e.parent&&e.Ca;)e=e.parent;var f;c?f=c=1:(c=Math.max((e.j.widows||2)-0,1),f=Math.max((e.j.orphans||2)-0,1));var g=0;hk(e,function(b){if("clone"===b.j["box-decoration-break"]){var c=Ul(a.h,b.D),d=new Kf;c&&(d.left=X(c.borderLeftWidth)+X(c.paddingLeft),d.top=X(c.borderTopWidth)+X(c.paddingTop),d.right=X(c.borderRightWidth)+X(c.paddingRight),d.bottom=X(c.borderBottomWidth)+X(c.paddingBottom));g+=b.b?-d.left:d.bottom}});var h=nm(a,d),l=a.sa-g,d=Ha(h.length,function(b){return a.b?
h[b]<l:h[b]>l}),d=Math.min(h.length-c,d);if(d<f)return null;l=h[d-1];if(b=om(a,b.j,l))a.g=(a.b?-1:1)*(l-a.Aa);return b}function pm(a,b,c,d){if(b.R){var e=um(xl(b.R),b);if(e)return e}c=c||!!b.D&&1==b.D.nodeType&&!b.K;vm(b,c);d&&(lm(b,!0),wm(c?b:b.parent));return tm(a,b.na)}El.prototype.Kb=function(){var a=null,b=null,c,d=0;do{c=d;for(var d=Number.MAX_VALUE,e=this.I.length-1;0<=e&&!b;--e){var a=this.I[e],b=a.f(this,c),f=a.b();f>c&&(d=Math.min(d,f))}}while(d>c&&!b);return{Ec:b?a:null,C:b}};
function xm(a,b,c){var d=I("findAcceptableBreak"),e=a.Kb().C,f=!1;if(!e){u.b("Could not find any page breaks?!!");if(a.de)return ym(a,b).then(function(b){b?(b=b.modify(),b.f=!1,pm(a,b,f,!0).then(function(){L(d,b)})):L(d,b)}),K(d);e=c;f=!0}pm(a,e,f,!0).then(function(){L(d,e)});return K(d)}function zm(a){a=a.toString();return""==a||"auto"==a||!!a.match(/^0+(.0*)?[^0-9]/)}
function Am(a,b,c,d){if(!b)return!1;var e=vl(b,a.h,0,a.b),f=Bl(a,e);c&&(e+=rm(a,c));km(a,e);c=Yj(b);var g;b.R&&(xl(b.R),g=new Bm(c,d,f,a.g));g||(g=new Al(c,d,f,a.g));a.I.push(g);return f}
function Cm(a,b){if(b.D.parentNode){var c=Tl(a,b.D),d=b.D.ownerDocument.createElement("div");a.b?(d.style.bottom="0px",d.style.width="1px",d.style.marginRight=c.right+"px"):(d.style.right="0px",d.style.height="1px",d.style.marginTop=c.top+"px");b.D.parentNode.insertBefore(d,b.D);var e=Lj(a.h,d),e=a.b?e.right:e.top,f=a.b?-1:1,g;switch(b.w){case "left":g=a.bd;break;case "right":g=a.gd;break;default:g=f*Math.max(a.gd*f,a.bd*f)}e*f>=g*f?b.D.parentNode.removeChild(d):(e=Math.max(1,(g-e)*f),a.b?d.style.width=
e+"px":d.style.height=e+"px",e=Lj(a.h,d),e=a.b?e.left:e.bottom,a.b?(g=e+c.right-g,0<g==0<=c.right&&(g+=c.right),d.style.marginLeft=g+"px"):(g-=e+c.top,0<g==0<=c.top&&(g+=c.top),d.style.marginBottom=g+"px"),b.A=d)}}
function Dm(a,b,c){function d(){b=k[0]||b;b.D.parentNode.removeChild(b.D);e.l=h}if(b.R)return J(b);var e=a,f=I("skipEdges"),g=c&&b&&b.K,h=null,l=null,k=[],m=[],p=!1;ae(function(a){for(;b;){do if(b.D){if(b.Ca&&1!=b.D.nodeType){if(Nj(b.D,b.Db))break;if(!b.K){!c&&Mk[h]?d():Am(e,l,null,h)?(b=(l||b).modify(),b.f=!0):(b=b.modify(),b.h=h);O(a);return}}if(!b.K&&(b.w&&Cm(e,b),b.R||b.l||b.F)){k.push(Yj(b));h=Kk(h,b.h);if(!c&&Mk[h])d();else if(Am(e,l,null,h)||!Ml(e.jb,b))b=(l||b).modify(),b.f=!0;O(a);return}if(1==
b.D.nodeType){var f=b.D.style;if(b.K){if(p){if(!c&&Mk[h]){d();O(a);return}k=[];g=c=!1;h=null}p=!1;l=Yj(b);m.push(l);h=Kk(h,b.B);if(f&&(!zm(f.paddingBottom)||!zm(f.borderBottomWidth))){if(Am(e,l,null,h)&&(b=(l||b).modify(),b.f=!0,e.u)){O(a);return}m=[l];l=null}}else{k.push(Yj(b));h=Kk(h,b.h);if(!Ml(e.jb,b)&&(Am(e,l,null,h),b=b.modify(),b.f=!0,e.u)){O(a);return}if(ul[b.D.localName]){!c&&Mk[h]?d():Am(e,l,null,h)&&(b=(l||b).modify(),b.f=!0);O(a);return}!f||zm(f.paddingTop)&&zm(f.borderTopWidth)||(g=!1,
m=[]);p=!0}}}while(0);f=Ll(e.f,b,g);if(f.va()){f.then(function(c){b=c;M(a)});return}b=f.get()}Am(e,l,m,h)?l&&(b=l.modify(),b.f=!0):Mk[h]&&(e.l=h);O(a)}).then(function(){L(f,b)});return K(f)}
function ym(a,b){var c=Yj(b),d=I("skipEdges"),e=null,f=!1;ae(function(d){for(;b;){do if(b.D){if(b.Ca&&1!=b.D.nodeType){if(Nj(b.D,b.Db))break;if(!b.K){Mk[e]&&(a.l=e);O(d);return}}if(!b.K&&(b.l||b.F)){e=Kk(e,b.h);Mk[e]&&(a.l=e);O(d);return}if(1==b.D.nodeType){var g=b.D.style;if(b.K){if(f){if(Mk[e]){a.l=e;O(d);return}e=null}f=!1;e=Kk(e,b.B)}else{e=Kk(e,b.h);if(ul[b.D.localName]){Mk[e]&&(a.l=e);O(d);return}if(g&&(!zm(g.paddingTop)||!zm(g.borderTopWidth))){O(d);return}}f=!0}}while(0);g=Ll(a.f,b);if(g.va()){g.then(function(a){b=
a;M(d)});return}b=g.get()}c=null;O(d)}).then(function(){L(d,c)});return K(d)}function Nl(a,b){return"footnote"==b.l?dm(a,b):fm(a,b)}function Em(a,b,c){var d=I("layoutNext");Dm(a,b,c).then(function(c){b=c;if(!b||a.l||a.u&&b&&b.f)L(d,b);else if(b.l)Nl(a,b).ra(d);else if(b.R)Fm(xl(b.R),b,a).ra(d);else{a:if(b.K)c=!0;else{switch(b.U.namespaceURI){case "http://www.w3.org/2000/svg":c=!1;break a}c=!b.F}c?sm(a,b).ra(d):Ol(a,b).ra(d)}});return K(d)}
function vm(a,b){do{var c=a.D.parentNode;if(!c)break;var d=c,e=a.D;if(d)for(var f;(f=d.lastChild)!=e;)d.removeChild(f);b&&(c.removeChild(a.D),b=!1);a=a.parent}while(a)}
function bm(a){var b=a.element.ownerDocument.createElement("div");b.style.position="absolute";b.style.top=a.A+"px";b.style.right=a.G+"px";b.style.bottom=a.F+"px";b.style.left=a.w+"px";a.element.appendChild(b);var c=Lj(a.h,b);a.element.removeChild(b);var b=a.J+a.left+sk(a),d=a.M+a.top+qk(a);a.Xa=new If(b,d,b+a.width,d+a.height);a.V=c?a.b?c.top:c.left:0;a.pa=c?a.b?c.bottom:c.right:0;a.Aa=c?a.b?c.right:c.top:0;a.Ya=c?a.b?c.left:c.bottom:0;a.bd=a.Aa;a.gd=a.Aa;a.ad=a.Aa;a.sa=a.Ya;c=a.Xa;b=a.J+a.left+sk(a);
d=a.M+a.top+qk(a);if(a.Gb){for(var e=a.Gb,f=[],g=0;g<e.b.length;g++){var h=e.b[g];f.push(new Jf(h.f+b,h.b+d))}b=new Of(f)}else b=Rf(b,d,b+a.width,d+a.height);a.Eb=ag(c,[b],a.T,a.kb,a.b);Rl(a);a.j=null}function $l(a){a.Fb=[];v(a.element,"width",a.width+"px");v(a.element,"height",a.height+"px");bm(a);a.g=0;a.Nd=!1;a.l=null}function km(a,b){a.g=Math.max((a.b?-1:1)*(b-a.Aa),a.g)}
function Gm(a,b){var c=b.b;if(!c)return J(!0);var d=I("layoutOverflownFootnotes"),e=0;$d(function(){for(;e<c.length;){var b=c[e++],b=Yl(a,0,b,a.Aa);if(b.va())return b}return J(!1)}).then(function(){L(d,!0)});return K(d)}
function cm(a,b,c){a.Fb.push(b);if(a.u&&a.Nd)return J(b);var d=I("layout");Gm(a,b).then(function(){a.Md(b.Ma).then(function(b){var e=b;a.I=[];ae(function(d){for(;b;){var f=!0;Em(a,b,c).then(function(g){c=!1;b=g;0<a.f.f.b.length?O(d):a.l?O(d):b&&a.u&&b&&b.f?xm(a,b,e).then(function(a){b=a;O(d)}):f?f=!1:M(d)});if(f){f=!1;return}}O(d)}).then(function(){var c=a.B;c&&(a.element.appendChild(c.element),a.b?a.g=this.Aa-this.Ya:a.g=c.top+qk(c)+c.g+rk(c));if(b)if(0<a.f.f.b.length)L(d,null);else{a.Nd=!0;c=new ik(ek(b));
if(a.j){for(var e=[],f=0;f<a.j.length;f++){var k=a.j[f].b;k&&e.push(k)}c.b=e.length?e:null}L(d,c)}else L(d,null)})})});return K(d)}function am(a){for(var b=a.Fb,c=a.element.lastChild;c!=a.Jd;){var d=c.previousSibling;a.element===c.parentNode&&Hm(c)||a.element.removeChild(c);c=d}Ql(a);$l(a);var e=I("redoLayout"),f=0,g=null,h=!0;ae(function(c){if(f<b.length){var d=b[f++];cm(a,d,h).then(function(a){h=!1;a?(g=a,O(c)):M(c)})}else O(c)}).then(function(){L(e,g)});return K(e)};function Im(a,b){this.b=a;this.X=b}function Jm(a,b,c,d){this.b=a;this.g=b;this.j=c;this.f=d;this.h=null}function Km(a,b){this.b=a;this.f=b}function Lm(a){var b={};Object.keys(a).forEach(function(c){b[c]=Array.from(a[c])});return b}function Mm(a,b){this.Pb=a;this.rc=b;this.ud=null;this.X=this.L=-1}function Ni(a,b,c){b=a.b.I.Cd(b,a.f);a.b.l[b]=c}function Nm(a){return(a=a.match(/^[^#]*#(.*)$/))?a[1]:null}function Om(a,b){var c=a.b.I.xc(ka(b,a.g),a.g);"#"===c.charAt(0)&&(c=c.substring(1));return c}
function si(a,b,c){return new tb(a.f,function(){var d=a.b.b[b];return c(d&&d.length?d[d.length-1]:null)},"page-counter-"+b)}function ui(a,b,c){return new tb(a.f,function(){return c(a.b.b[b]||[])},"page-counters-"+b)}function Pm(a,b,c,d){var e=a.b.l[c];if(!e&&d&&b){d=a.h;if(b){d.w=b;for(b=0;d.w&&(b+=5E3,al(d,b,0)!==Number.POSITIVE_INFINITY););d.w=null}e=a.b.l[c]}return e||null}
function wi(a,b,c,d){var e=Nm(b),f=Om(a,b),g=Pm(a,e,f,!1);return g&&g[c]?(b=g[c],new rb(a.j,d(b[b.length-1]||null))):new tb(a.f,function(){if(g=Pm(a,e,f,!0)){if(g[c]){var b=g[c];return d(b[b.length-1]||null)}if(b=a.b.j.b[f]?a.b.b:a.b.w[f]||null)return Qm(a.b,f),b[c]?(b=b[c],d(b[b.length-1]||null)):d(0);Rm(a.b,f,!1);return"??"}Rm(a.b,f,!1);return"??"},"target-counter-"+c+"-of-"+b)}
function yi(a,b,c,d){var e=Nm(b),f=Om(a,b);return new tb(a.f,function(){var b=a.b.j.b[f]?a.b.b:a.b.w[f]||null;if(b){Qm(a.b,f);var b=b[c]||[],h=Pm(a,e,f,!0)[c]||[];return d(b.concat(h))}Rm(a.b,f,!1);return"??"},"target-counters-"+c+"-of-"+b)}function Sm(a){this.I=a;this.l={};this.w={};this.b={};this.b.page=[0];this.F={};this.B=[];this.A={};this.j=null;this.u=[];this.g=[];this.G=[];this.f={};this.h={}}function Tm(a,b){var c=a.b.page;c&&c.length?c[c.length-1]=b:a.b.page=[b]}
function Um(a,b,c){a.F=Lm(a.b);var d,e=b["counter-reset"];e&&(e=e.evaluate(c))&&(d=lg(e,!0));if(d)for(var f in d){var e=a,g=f,h=d[f];e.b[g]?e.b[g].push(h):e.b[g]=[h]}var l;(b=b["counter-increment"])&&(c=b.evaluate(c))&&(l=lg(c,!1));l?"page"in l||(l.page=1):l={page:1};for(var k in l)a.b[k]||(c=a,b=k,c.b[b]?c.b[b].push(0):c.b[b]=[0]),c=a.b[k],c[c.length-1]+=l[k]}function Vm(a,b){a.B.push(a.b);a.b=Lm(b)}
function Qm(a,b){var c=a.f[b],d=a.h[b];d||(d=a.h[b]=[]);for(var e=!1,f=0;f<a.g.length;){var g=a.g[f];g.Pb===b?(g.rc=!0,a.g.splice(f,1),c&&(e=c.indexOf(g),0<=e&&c.splice(e,1)),d.push(g),e=!0):f++}e||Rm(a,b,!0)}function Rm(a,b,c){a.u.some(function(a){return a.Pb===b})||a.u.push(new Mm(b,c))}
function Wm(a,b,c){var d=Object.keys(a.j.b);if(0<d.length){var e=Lm(a.b);d.forEach(function(a){this.w[a]=e;var d=this.A[a];if(d&&d.X<c&&(d=this.h[a])){var f=this.f[a];f||(f=this.f[a]=[]);for(var g;g=d.shift();)g.rc=!1,f.push(g)}this.A[a]={L:b,X:c}},a)}for(var d=a.F,f;f=a.u.shift();){f.ud=d;f.L=b;f.X=c;var g;f.rc?(g=a.h[f.Pb])||(g=a.h[f.Pb]=[]):(g=a.f[f.Pb])||(g=a.f[f.Pb]=[]);g.every(function(a){return!(f===a||a&&f.Pb===a.Pb&&f.rc===a.rc&&f.L===a.L&&f.X===a.X)})&&g.push(f)}a.j=null}
function Xm(a,b){var c=[];Object.keys(b.b).forEach(function(a){(a=this.f[a])&&(c=c.concat(a))},a);c.sort(function(a,b){return a.L-b.L||a.X-b.X});var d=[],e=null;c.forEach(function(a){e&&e.L===a.L&&e.X===a.X?e.Mc.push(a):(e={L:a.L,X:a.X,ud:a.ud,Mc:[a]},d.push(e))});return d}function Ym(a,b){a.G.push(a.g);a.g=b}function Ml(a,b){if(!b||b.K)return!0;var c=b.D;if(!c||1!==c.nodeType)return!0;c=c.getAttribute("id")||c.getAttribute("name");return c&&(a.b.h[c]||a.b.f[c])?(c=a.b.A[c])?a.X>=c.X:!0:!0};var Zm=1;function $m(a,b,c,d,e){this.b={};this.j=[];this.g=null;this.index=0;this.f=a;this.name=b;this.zb=c;this.Ba=d;this.parent=e;this.l="p"+Zm++;e&&(this.index=e.j.length,e.j.push(this))}$m.prototype.h=function(){throw Error("E_UNEXPECTED_CALL");};$m.prototype.clone=function(){throw Error("E_UNEXPECTED_CALL");};function an(a,b){var c=a.b,d=b.b,e;for(e in c)Object.prototype.hasOwnProperty.call(c,e)&&(d[e]=c[e])}function bn(a,b){for(var c=0;c<a.j.length;c++)a.j[c].clone({parent:b})}
function cn(a){$m.call(this,a,null,null,[],null);this.b.width=new V(vd,0);this.b.height=new V(wd,0)}t(cn,$m);
function dn(a,b){this.g=b;var c=this;qb.call(this,a,function(a,b){var d=a.match(/^([^.]+)\.([^.]+)$/);if(d){var e=c.g.u[d[1]];if(e&&(e=this.ka[e])){if(b){var d=d[2],h=e.ka[d];if(h)e=h;else{switch(d){case "columns":var h=e.f.f,l=new hc(h,0),k=en(e,"column-count"),m=en(e,"column-width"),p=en(e,"column-gap"),h=A(h,jc(h,new ec(h,"min",[l,k]),z(h,m,p)),p)}h&&(e.ka[d]=h);e=h}}else e=en(e,d[2]);return e}}return null})}t(dn,qb);
function fn(a,b,c,d,e,f,g){a=a instanceof dn?a:new dn(a,this);$m.call(this,a,b,c,d,e);this.g=this;this.S=f;this.W=g;this.b.width=new V(vd,0);this.b.height=new V(wd,0);this.b["wrap-flow"]=new V(Gc,0);this.b.position=new V(hd,0);this.b.overflow=new V(sd,0);this.u={}}t(fn,$m);fn.prototype.h=function(a){return new gn(a,this)};fn.prototype.clone=function(a){a=new fn(this.f,this.name,a.zb||this.zb,this.Ba,this.parent,this.S,this.W);an(this,a);bn(this,a);return a};
function hn(a,b,c,d,e){$m.call(this,a,b,c,d,e);this.g=e.g;b&&(this.g.u[b]=this.l);this.b["wrap-flow"]=new V(Gc,0)}t(hn,$m);hn.prototype.h=function(a){return new jn(a,this)};hn.prototype.clone=function(a){a=new hn(a.parent.f,this.name,this.zb,this.Ba,a.parent);an(this,a);bn(this,a);return a};function kn(a,b,c,d,e){$m.call(this,a,b,c,d,e);this.g=e.g;b&&(this.g.u[b]=this.l)}t(kn,$m);kn.prototype.h=function(a){return new ln(a,this)};
kn.prototype.clone=function(a){a=new kn(a.parent.f,this.name,this.zb,this.Ba,a.parent);an(this,a);bn(this,a);return a};function Y(a,b,c){return b&&b!==Gc?b.oa(a,c):null}function mn(a,b,c){return b&&b!==Gc?b.oa(a,c):a.b}function nn(a,b,c){return b?b===Gc?null:b.oa(a,c):a.b}function on(a,b,c,d){return b&&c!==H?b.oa(a,d):a.b}function pn(a,b,c){return b?b===td?a.j:b===Qc?a.h:b.oa(a,a.b):c}
function qn(a,b){this.g=a;this.f=b;this.J={};this.style={};this.A=this.B=null;this.w=[];this.M=this.T=this.h=this.j=!1;this.G=this.I=0;this.F=null;this.pa={};this.ka={};this.ta=this.b=!1;a&&a.w.push(this)}function rn(a){a.I=0;a.G=0}function sn(a,b,c){b=en(a,b);c=en(a,c);if(!b||!c)throw Error("E_INTERNAL");return z(a.f.f,b,c)}
function en(a,b){var c=a.pa[b];if(c)return c;var d=a.style[b];d&&(c=d.oa(a.f.f,a.f.f.b));switch(b){case "margin-left-edge":c=en(a,"left");break;case "margin-top-edge":c=en(a,"top");break;case "margin-right-edge":c=sn(a,"border-right-edge","margin-right");break;case "margin-bottom-edge":c=sn(a,"border-bottom-edge","margin-bottom");break;case "border-left-edge":c=sn(a,"margin-left-edge","margin-left");break;case "border-top-edge":c=sn(a,"margin-top-edge","margin-top");break;case "border-right-edge":c=
sn(a,"padding-right-edge","border-right-width");break;case "border-bottom-edge":c=sn(a,"padding-bottom-edge","border-bottom-width");break;case "padding-left-edge":c=sn(a,"border-left-edge","border-left-width");break;case "padding-top-edge":c=sn(a,"border-top-edge","border-top-width");break;case "padding-right-edge":c=sn(a,"right-edge","padding-right");break;case "padding-bottom-edge":c=sn(a,"bottom-edge","padding-bottom");break;case "left-edge":c=sn(a,"padding-left-edge","padding-left");break;case "top-edge":c=
sn(a,"padding-top-edge","padding-top");break;case "right-edge":c=sn(a,"left-edge","width");break;case "bottom-edge":c=sn(a,"top-edge","height")}if(!c){if("extent"==b)d=a.b?"width":"height";else if("measure"==b)d=a.b?"height":"width";else{var e=a.b?ih:jh,d=b,f;for(f in e)d=d.replace(f,e[f])}d!=b&&(c=en(a,d))}c&&(a.pa[b]=c);return c}
function tn(a){var b=a.f.f,c=a.style,d=pn(b,c.enabled,b.j),e=Y(b,c.page,b.b);if(e)var f=new cc(b,"page-number"),d=ic(b,d,new Vb(b,e,f));(e=Y(b,c["min-page-width"],b.b))&&(d=ic(b,d,new Ub(b,new cc(b,"page-width"),e)));(e=Y(b,c["min-page-height"],b.b))&&(d=ic(b,d,new Ub(b,new cc(b,"page-height"),e)));d=a.V(d);c.enabled=new F(d)}qn.prototype.V=function(a){return a};
qn.prototype.md=function(){var a=this.f.f,b=this.style,c=this.g?this.g.style.width.oa(a,null):null,d=Y(a,b.left,c),e=Y(a,b["margin-left"],c),f=on(a,b["border-left-width"],b["border-left-style"],c),g=mn(a,b["padding-left"],c),h=Y(a,b.width,c),l=Y(a,b["max-width"],c),k=mn(a,b["padding-right"],c),m=on(a,b["border-right-width"],b["border-right-style"],c),p=Y(a,b["margin-right"],c),q=Y(a,b.right,c),w=z(a,f,g),r=z(a,f,k);d&&q&&h?(w=A(a,c,z(a,h,z(a,z(a,d,w),r))),e?p?q=A(a,w,p):p=A(a,w,z(a,q,e)):(w=A(a,w,
q),p?e=A(a,w,p):p=e=jc(a,w,new rb(a,.5)))):(e||(e=a.b),p||(p=a.b),d||q||h||(d=a.b),d||h?d||q?h||q||(h=this.B,this.j=!0):d=a.b:(h=this.B,this.j=!0),w=A(a,c,z(a,z(a,e,w),z(a,p,r))),this.j&&(l||(l=A(a,w,d?d:q)),this.b||!Y(a,b["column-width"],null)&&!Y(a,b["column-count"],null)||(h=l,this.j=!1)),d?h?q||(q=A(a,w,z(a,d,h))):h=A(a,w,z(a,d,q)):d=A(a,w,z(a,q,h)));a=mn(a,b["snap-width"]||(this.g?this.g.style["snap-width"]:null),c);b.left=new F(d);b["margin-left"]=new F(e);b["border-left-width"]=new F(f);b["padding-left"]=
new F(g);b.width=new F(h);b["max-width"]=new F(l?l:h);b["padding-right"]=new F(k);b["border-right-width"]=new F(m);b["margin-right"]=new F(p);b.right=new F(q);b["snap-width"]=new F(a)};
qn.prototype.nd=function(){var a=this.f.f,b=this.style,c=this.g?this.g.style.width.oa(a,null):null,d=this.g?this.g.style.height.oa(a,null):null,e=Y(a,b.top,d),f=Y(a,b["margin-top"],c),g=on(a,b["border-top-width"],b["border-top-style"],c),h=mn(a,b["padding-top"],c),l=Y(a,b.height,d),k=Y(a,b["max-height"],d),m=mn(a,b["padding-bottom"],c),p=on(a,b["border-bottom-width"],b["border-bottom-style"],c),q=Y(a,b["margin-bottom"],c),w=Y(a,b.bottom,d),r=z(a,g,h),x=z(a,p,m);e&&w&&l?(d=A(a,d,z(a,l,z(a,z(a,e,r),
x))),f?q?w=A(a,d,f):q=A(a,d,z(a,w,f)):(d=A(a,d,w),q?f=A(a,d,q):q=f=jc(a,d,new rb(a,.5)))):(f||(f=a.b),q||(q=a.b),e||w||l||(e=a.b),e||l?e||w?l||w||(l=this.A,this.h=!0):e=a.b:(l=this.A,this.h=!0),d=A(a,d,z(a,z(a,f,r),z(a,q,x))),this.h&&(k||(k=A(a,d,e?e:w)),this.b&&(Y(a,b["column-width"],null)||Y(a,b["column-count"],null))&&(l=k,this.h=!1)),e?l?w||(w=A(a,d,z(a,e,l))):l=A(a,d,z(a,w,e)):e=A(a,d,z(a,w,l)));a=mn(a,b["snap-height"]||(this.g?this.g.style["snap-height"]:null),c);b.top=new F(e);b["margin-top"]=
new F(f);b["border-top-width"]=new F(g);b["padding-top"]=new F(h);b.height=new F(l);b["max-height"]=new F(k?k:l);b["padding-bottom"]=new F(m);b["border-bottom-width"]=new F(p);b["margin-bottom"]=new F(q);b.bottom=new F(w);b["snap-height"]=new F(a)};
function un(a){var b=a.f.f,c=a.style;a=Y(b,c[a.b?"height":"width"],null);var d=Y(b,c["column-width"],a),e=Y(b,c["column-count"],null),f;(f=(f=c["column-gap"])&&f!==dd?f.oa(b,null):null)||(f=new bc(b,1,"em"));d&&!e&&(e=new ec(b,"floor",[kc(b,z(b,a,f),z(b,d,f))]),e=new ec(b,"max",[b.f,e]));e||(e=b.f);d=A(b,kc(b,z(b,a,f),e),f);c["column-width"]=new F(d);c["column-count"]=new F(e);c["column-gap"]=new F(f)}function vn(a,b,c,d){a=a.style[b].oa(a.f.f,null);return Fb(a,c,d,{})}
function wn(a,b){b.ka[a.f.l]=a;var c=a.f.f,d=a.style,e=a.g?xn(a.g,b):null,e=$i(a.J,b,e,!1);a.b=Zi(e,b,a.g?a.g.b:!1);aj(e,d,a.b,function(a,b){return b.value});a.B=new tb(c,function(){return a.I},"autoWidth");a.A=new tb(c,function(){return a.G},"autoHeight");a.md();a.nd();un(a);tn(a)}function yn(a,b,c){(a=a.style[c])&&(a=Hf(b,a,c));return a}function Z(a,b,c){(a=a.style[c])&&(a=Hf(b,a,c));return Cc(a,b)}
function xn(a,b){var c;a:{if(c=a.J["region-id"]){for(var d=[],e=0;e<c.length;e++){var f=c[e].evaluate(b,"");f&&f!==B&&d.push(f)}if(d.length){c=d;break a}}c=null}if(c){d=[];for(e=0;e<c.length;e++)d[e]=c[e].toString();return d}return null}function zn(a,b,c,d,e){if(a=yn(a,b,d))a.Vb()&&xb(a.ea)&&(a=new D(Cc(a,b),"px")),"font-family"===d&&(a=ml(e,a)),v(c.element,d,a.toString())}
function An(a,b,c){var d=Z(a,b,"left"),e=Z(a,b,"margin-left"),f=Z(a,b,"padding-left"),g=Z(a,b,"border-left-width");a=Z(a,b,"width");wk(c,d,a);v(c.element,"margin-left",e+"px");v(c.element,"padding-left",f+"px");v(c.element,"border-left-width",g+"px");c.marginLeft=e;c.da=g;c.w=f}
function Bn(a,b,c){var d=Z(a,b,"right"),e=Z(a,b,"snap-height"),f=Z(a,b,"margin-right"),g=Z(a,b,"padding-right");b=Z(a,b,"border-right-width");v(c.element,"margin-right",f+"px");v(c.element,"padding-right",g+"px");v(c.element,"border-right-width",b+"px");c.marginRight=f;c.Wa=b;a.b&&0<e&&(a=d+tk(c),a-=Math.floor(a/e)*e,0<a&&(c.Qb=e-a,g+=c.Qb));c.G=g;c.Ac=e}
function Cn(a,b,c){var d=Z(a,b,"snap-height"),e=Z(a,b,"top"),f=Z(a,b,"margin-top"),g=Z(a,b,"padding-top");b=Z(a,b,"border-top-width");c.top=e;c.marginTop=f;c.ka=b;c.kb=d;!a.b&&0<d&&(a=e+qk(c),a-=Math.floor(a/d)*d,0<a&&(c.ta=d-a,g+=c.ta));c.A=g;v(c.element,"top",e+"px");v(c.element,"margin-top",f+"px");v(c.element,"padding-top",g+"px");v(c.element,"border-top-width",b+"px")}
function Dn(a,b,c){var d=Z(a,b,"margin-bottom"),e=Z(a,b,"padding-bottom"),f=Z(a,b,"border-bottom-width");a=Z(a,b,"height")-c.ta;v(c.element,"height",a+"px");v(c.element,"margin-bottom",d+"px");v(c.element,"padding-bottom",e+"px");v(c.element,"border-bottom-width",f+"px");c.height=a-c.ta;c.marginBottom=d;c.Qa=f;c.F=e}function En(a,b,c){a.b?(Cn(a,b,c),Dn(a,b,c)):(Bn(a,b,c),An(a,b,c))}
function Fn(a,b,c){v(c.element,"border-top-width","0px");var d=Z(a,b,"max-height");a.T?vk(c,0,d):(Cn(a,b,c),d-=c.ta,c.height=d,v(c.element,"height",d+"px"))}function Gn(a,b,c){v(c.element,"border-left-width","0px");var d=Z(a,b,"max-width");a.M?wk(c,0,d):(Bn(a,b,c),d-=c.Qb,c.width=d,a=Z(a,b,"right"),v(c.element,"right",a+"px"),v(c.element,"width",d+"px"))}
var Hn="border-left-style border-right-style border-top-style border-bottom-style border-left-color border-right-color border-top-color border-bottom-color outline-style outline-color outline-width overflow visibility".split(" "),In="border-top-left-radius border-top-right-radius border-bottom-right-radius border-bottom-left-radius border-image-source border-image-slice border-image-width border-image-outset border-image-repeat background-attachment background-color background-image background-repeat background-position background-clip background-origin background-size opacity z-index".split(" "),
Jn="color font-family font-size font-style font-weight font-variant line-height letter-spacing text-align text-decoration text-indent text-transform white-space word-spacing".split(" "),Kn=["transform","transform-origin"];
qn.prototype.yb=function(a,b,c,d){this.g&&this.b==this.g.b||v(b.element,"writing-mode",this.b?"vertical-rl":"horizontal-tb");(this.b?this.j:this.h)?this.b?Gn(this,a,b):Fn(this,a,b):(this.b?Bn(this,a,b):Cn(this,a,b),this.b?An(this,a,b):Dn(this,a,b));(this.b?this.h:this.j)?this.b?Fn(this,a,b):Gn(this,a,b):En(this,a,b);for(c=0;c<Hn.length;c++)zn(this,a,b,Hn[c],d)};function Ln(a,b,c,d){for(var e=0;e<Jn.length;e++)zn(a,b,c,Jn[e],d)}
qn.prototype.Hc=function(a,b,c,d,e,f,g){this.b?this.I=b.g+b.Qb:this.G=b.g+b.ta;var h=(this.b||!d)&&this.h,l=(!this.b||!d)&&this.j;if(l||h)l&&v(b.element,"width","auto"),h&&v(b.element,"height","auto"),d=Lj(f,d?d.element:b.element),l&&(this.I=Math.ceil(d.right-d.left-b.w-b.da-b.G-b.Wa),this.b&&(this.I+=b.Qb)),h&&(this.G=d.bottom-d.top-b.A-b.ka-b.F-b.Qa,this.b||(this.G+=b.ta));(this.b?this.h:this.j)&&En(this,a,b);if(this.b?this.j:this.h){if(this.b?this.M:this.T)this.b?Bn(this,a,b):Cn(this,a,b);this.b?
An(this,a,b):Dn(this,a,b)}if(1<e&&(l=Z(this,a,"column-rule-width"),d=yn(this,a,"column-rule-style"),f=yn(this,a,"column-rule-color"),0<l&&d&&d!=H&&f!=pd))for(var k=Z(this,a,"column-gap"),m=this.b?b.height:b.width,p=this.b?"border-top":"border-left",h=1;h<e;h++){var q=(m+k)*h/e-k/2+b.w-l/2,w=b.height+b.A+b.F,r=b.element.ownerDocument.createElement("div");v(r,"position","absolute");v(r,this.b?"left":"top","0px");v(r,this.b?"top":"left",q+"px");v(r,this.b?"height":"width","0px");v(r,this.b?"width":"height",
w+"px");v(r,p,l+"px "+d.toString()+(f?" "+f.toString():""));b.element.insertBefore(r,b.element.firstChild)}for(h=0;h<In.length;h++)zn(this,a,b,In[h],g);for(h=0;h<Kn.length;h++)e=b,g=Kn[h],l=c.u,(d=yn(this,a,g))&&l.push(new Dj(e.element,g,d))};
qn.prototype.l=function(a,b){var c=this.J,d=this.f.b,e;for(e in d)nh(e)&&oh(c,e,d[e]);if("background-host"==this.f.zb)for(e in b)if(e.match(/^background-/)||"writing-mode"==e)c[e]=b[e];if("layout-host"==this.f.zb)for(e in b)e.match(/^background-/)||"writing-mode"==e||(c[e]=b[e]);Fi(a,this.f.Ba,null,c);c.content&&(c.content=c.content.Gc(new ki(a,null,a.Wa)));wn(this,a.l);for(c=0;c<this.f.j.length;c++)this.f.j[c].h(this).l(a,b);a.pop()};
function Mn(a,b){a.j&&(a.M=vn(a,"right",a.B,b)||vn(a,"margin-right",a.B,b)||vn(a,"border-right-width",a.B,b)||vn(a,"padding-right",a.B,b));a.h&&(a.T=vn(a,"top",a.A,b)||vn(a,"margin-top",a.A,b)||vn(a,"border-top-width",a.A,b)||vn(a,"padding-top",a.A,b));for(var c=0;c<a.w.length;c++)Mn(a.w[c],b)}function Nn(a){qn.call(this,null,a)}t(Nn,qn);Nn.prototype.l=function(a,b){qn.prototype.l.call(this,a,b);this.w.sort(function(a,b){return b.f.W-a.f.W||a.f.index-b.f.index})};
function gn(a,b){qn.call(this,a,b);this.F=this}t(gn,qn);gn.prototype.V=function(a){var b=this.f.g;b.S&&(a=ic(b.f,a,b.S));return a};gn.prototype.da=function(){};function jn(a,b){qn.call(this,a,b);this.F=a.F}t(jn,qn);function ln(a,b){qn.call(this,a,b);this.F=a.F}t(ln,qn);function On(a,b,c,d){var e=null;c instanceof wc&&(e=[c]);c instanceof pc&&(e=c.values);if(e)for(a=a.f.f,c=0;c<e.length;c++)if(e[c]instanceof wc){var f=ob(e[c].name,"enabled"),f=new cc(a,f);d&&(f=new Lb(a,f));b=ic(a,b,f)}return b}
ln.prototype.V=function(a){var b=this.f.f,c=this.style,d=pn(b,c.required,b.h)!==b.h;if(d||this.h){var e;e=(e=c["flow-from"])?e.oa(b,b.b):new rb(b,"body");e=new ec(b,"has-content",[e]);a=ic(b,a,e)}a=On(this,a,c["required-partitions"],!1);a=On(this,a,c["conflicting-partitions"],!0);d&&(c=(c=this.F.style.enabled)?c.oa(b,null):b.j,c=ic(b,c,a),this.F.style.enabled=new F(c));return a};ln.prototype.yb=function(a,b,c,d,e){v(b.element,"overflow","hidden");qn.prototype.yb.call(this,a,b,c,d,e)};
function Pn(a,b,c,d){af.call(this,a,b,!1);this.target=c;this.b=d}t(Pn,bf);Pn.prototype.lb=function(a,b,c){Xg(this.b,a,b,c,this)};Pn.prototype.Wc=function(a,b){cf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};Pn.prototype.kc=function(a,b){cf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};Pn.prototype.mb=function(a,b,c){this.target.b[a]=new V(b,c?50331648:67108864)};function Qn(a,b,c,d){Pn.call(this,a,b,c,d)}t(Qn,Pn);
function Rn(a,b,c,d){Pn.call(this,a,b,c,d);c.b.width=new V(ud,0);c.b.height=new V(ud,0)}t(Rn,Pn);Rn.prototype.vc=function(a,b,c){a=new kn(this.f,a,b,c,this.target);$e(this.ga,new Qn(this.f,this.ga,a,this.b))};Rn.prototype.uc=function(a,b,c){a=new hn(this.f,a,b,c,this.target);a=new Rn(this.f,this.ga,a,this.b);$e(this.ga,a)};function Sn(a,b,c,d){Pn.call(this,a,b,c,d)}t(Sn,Pn);Sn.prototype.vc=function(a,b,c){a=new kn(this.f,a,b,c,this.target);$e(this.ga,new Qn(this.f,this.ga,a,this.b))};
Sn.prototype.uc=function(a,b,c){a=new hn(this.f,a,b,c,this.target);a=new Rn(this.f,this.ga,a,this.b);$e(this.ga,a)};function Tn(a,b,c,d){d=d[b];if(!d)throw Error("unknown writing-mode: "+b);b=d[c||"ltr"];if(!b)throw Error("unknown direction: "+c);for(c=0;c<b.length;c++)if(d=b[c],d=a.replace(d.h,d.b),d!==a)return d;return a}function Un(a){var b=Vn,c={};Object.keys(b).forEach(function(d){var e=c[d]={},f=b[d];Object.keys(f).forEach(function(b){e[b]=f[b].map(function(b){return{h:new RegExp("(-?)"+(a?b.N:b.O)+"(-?)"),b:"$1"+(a?b.O:b.N)+"$2"}})})});return c}
var Vn={"horizontal-tb":{ltr:[{N:"inline-start",O:"left"},{N:"inline-end",O:"right"},{N:"block-start",O:"top"},{N:"block-end",O:"bottom"},{N:"inline-size",O:"width"},{N:"block-size",O:"height"}],rtl:[{N:"inline-start",O:"right"},{N:"inline-end",O:"left"},{N:"block-start",O:"top"},{N:"block-end",O:"bottom"},{N:"inline-size",O:"width"},{N:"block-size",O:"height"}]},"vertical-rl":{ltr:[{N:"inline-start",O:"top"},{N:"inline-end",O:"bottom"},{N:"block-start",O:"right"},{N:"block-end",O:"left"},{N:"inline-size",
O:"height"},{N:"block-size",O:"width"}],rtl:[{N:"inline-start",O:"bottom"},{N:"inline-end",O:"top"},{N:"block-start",O:"right"},{N:"block-end",O:"left"},{N:"inline-size",O:"height"},{N:"block-size",O:"width"}]},"vertical-lr":{ltr:[{N:"inline-start",O:"top"},{N:"inline-end",O:"bottom"},{N:"block-start",O:"left"},{N:"block-end",O:"right"},{N:"inline-size",O:"height"},{N:"block-size",O:"width"}],rtl:[{N:"inline-start",O:"bottom"},{N:"inline-end",O:"top"},{N:"block-start",O:"left"},{N:"block-end",O:"right"},
{N:"inline-size",O:"height"},{N:"block-size",O:"width"}]}},Wn=Un(!0),Xn=Un(!1),Yn={"horizontal-tb":[{N:"line-left",O:"left"},{N:"line-right",O:"right"},{N:"over",O:"top"},{N:"under",O:"bottom"}],"vertical-rl":[{N:"line-left",O:"top"},{N:"line-right",O:"bottom"},{N:"over",O:"right"},{N:"under",O:"left"}],"vertical-lr":[{N:"line-left",O:"top"},{N:"line-right",O:"bottom"},{N:"over",O:"right"},{N:"under",O:"left"}]};function jm(a,b,c){b=b?"vertical-rl":"horizontal-tb";if("top"===a||"bottom"===a)a=Tn(a,b,c||null,Xn);"block-start"===a&&(a="inline-start");"block-end"===a&&(a="inline-end");if("inline-start"===a||"inline-end"===a){c=Tn(a,b,c||null,Wn);a:{var d=Yn[b];if(!d)throw Error("unknown writing-mode: "+b);for(b=0;b<d.length;b++)if(d[b].O===c){b=d[b].N;break a}b=c}"line-left"===b?a="left":"line-right"===b&&(a="right")}"left"!==a&&"right"!==a&&(u.b("Invalid float value: "+a+". Fallback to left."),a="left");return a}
function Zn(a,b){this.C=Yj(a);this.b=b}function $n(a,b,c){this.g=a;this.j=b;this.h=c;this.f=[];this.b=[]}
function gm(a,b,c){b.parentNode&&b.parentNode.removeChild(b);v(b,"float","none");v(b,"position","absolute");var d=a.j.toString(),e=a.h.toString(),f=Tn(c,d,e||null,Wn),g=Tn(c,d,e||null,Xn);v(b,f,"0");switch(g){case "inline-start":case "inline-end":d=Tn("block-start",d,e||null,Wn);v(b,d,"0");break;case "block-start":case "block-end":c=Tn("inline-start",d,e||null,Wn);v(b,c,"0");d=Tn("max-inline-size",d,e||null,Wn);ya(b,d)||v(b,d,"100%");break;default:throw Error("unknown float direction: "+c);}a.g().appendChild(b)}
function hm(a,b,c){b=ek(b);for(var d=0;d<a.f.length;d++){var e=a.f[d];if(ao(c,b,ek(e.C)))return e}return null}function im(a,b,c){var d=I("tryToAddFloat");b=new Zn(b,c);a.f.push(b);a.b.push(b);L(d,b);return K(d)}function bo(a){return a.b.map(function(a){a=a.b;return new Of([new Jf(a.ha,a.ba),new Jf(a.aa,a.ba),new Jf(a.aa,a.Y),new Jf(a.ha,a.Y)])})};function co(a){a=a.toString();switch(a){case "inline-flex":a="flex";break;case "inline-grid":a="grid";break;case "inline-table":a="table";break;case "inline":case "table-row-group":case "table-column":case "table-column-group":case "table-header-group":case "table-footer-group":case "table-row":case "table-cell":case "table-caption":case "inline-block":a="block"}return C(a)}function Ok(a,b,c,d){if(a!==H)if(b===Dc||b===Rc)c=H,a=co(a);else if(c&&c!==H||d)a=co(a);return{display:a,position:b,b:c}}
function eo(a,b,c,d,e,f,g){e=e||f||Uc;return!!g||!!c&&c!==H||b===Dc||b===Rc||a===Xc||a===nd||a===md||a==Sc||(a===Hc||a===bd)&&!!d&&d!==sd||!!f&&e!==f};function fo(a,b,c){return a.replace(/[uU][rR][lL]\(\s*\"((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\"\r\n])+)\"/gm,function(a,e){return'url("'+c.xc(e,b)+'"'}).replace(/[uU][rR][lL]\(\s*\'((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\'\r\n])+)\'/gm,function(a,e){return"url('"+c.xc(e,b)+"'"}).replace(/[uU][rR][lL]\(\s*((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\"\'\r\n\)\s])+)/gm,function(a,e){return"url("+c.xc(e,b)})};var go={"text-indent":"0px","margin-top":"0px","padding-top":"0px","border-top-width":"0px","border-top-style":"none","border-top-color":"transparent","border-top-left-radius":"0px","border-top-right-radius":"0px"},ho={"text-indent":"0px","margin-right":"0px","padding-right":"0px","border-right-width":"0px","border-right-style":"none","border-right-color":"transparent","border-top-right-radius":"0px","border-bottom-right-radius":"0px"},io={"margin-top":"0px"},jo={"margin-right":"0px"},ko={};
function lo(a){a.addEventListener("load",function(){a.contentWindow.navigator.epubReadingSystem={name:"adapt",version:"0.1",layoutStyle:"paginated",hasFeature:function(a){switch(a){case "mouse-events":return!0}return!1}}},!1)}var mo=(new DOMParser).parseFromString('<root xmlns="http://www.pyroxy.com/ns/shadow"/>',"text/xml"),no="footnote-marker first-5-lines first-4-lines first-3-lines first-2-lines first-line first-letter before  after".split(" ");
function Hm(a){return a.getAttribute("data-adapt-pseudo")||""}function oo(a,b,c,d){this.style=b;this.element=a;this.b=c;this.f=d;this.g={}}
oo.prototype.l=function(a){var b=Hm(a);this.b&&b&&b.match(/after$/)&&(this.style=this.b.l(this.element,!0),this.b=null);var c=this.style._pseudos[b]||{};if(!this.g[b]){this.g[b]=!0;var d=c.content;d&&(d=d.evaluate(this.f),yk(d)&&d.$(new xk(a,this.f)))}if(b.match(/^first-/)&&!c["x-first-pseudo"]){a=1;if("first-letter"==b)a=0;else if(b=b.match(/^first-([0-9]+)-lines$/))a=b[1]-0;c["x-first-pseudo"]=new V(new yc(a),0)}return c};
function po(a,b,c,d,e,f,g,h,l,k,m,p,q,w){this.B=a;this.b=b;this.viewport=c;this.w=c.b;this.l=d;this.G=e;this.ca=f;this.F=g;this.u=h;this.I=l;this.page=k;this.g=m;this.A=p;this.f=q;this.h=w;this.J=this.C=null;this.j=!1;this.U=null;this.ia=0;this.D=null}po.prototype.clone=function(){return new po(this.B,this.b,this.viewport,this.l,this.G,this.ca,this.F,this.u,this.I,this.page,this.g,this.A,this.f,this.h)};
function qo(a,b,c,d,e,f){var g=I("createRefShadow");a.ca.u.load(b).then(function(h){if(h){var l=nj(h,b);if(l){var k=a.I,m=k.G[h.url];if(!m){var m=k.style.l.f[h.url],p=new yb(0,k.xb(),k.wb(),k.u),m=new Tk(h,m.g,m.f,p,k.j,m.u,new Km(k.h,h.url),new Jm(k.h,h.url,m.f,m.b));k.G[h.url]=m}f=new Zj(d,l,h,e,f,c,m)}}L(g,f)});return K(g)}
function ro(a,b,c,d,e,f,g,h){var l=I("createShadows"),k=e.template,m;k instanceof Ac?m=qo(a,k.url,2,b,h,null):m=J(null);m.then(function(k){var m=null;if("http://www.pyroxy.com/ns/shadow"==b.namespaceURI&&"include"==b.localName){var p=b.getAttribute("href"),r=null;p?r=h?h.ca:a.ca:h&&(p="http://www.w3.org/1999/xhtml"==h.ga.namespaceURI?h.ga.getAttribute("href"):h.ga.getAttributeNS("http://www.w3.org/1999/xlink","href"),r=h.wd?h.wd.ca:a.ca);p&&(p=ka(p,r.url),m=qo(a,p,3,b,h,k))}m||(m=J(k));var x=null;
m.then(function(c){e.display===nd?x=qo(a,ka("user-agent.xml#table-cell",ja),2,b,h,c):x=J(c)});x.then(function(k){var m;if(m=d._pseudos){for(var p=[],q=mo.createElementNS("http://www.pyroxy.com/ns/shadow","root"),r=q,w=0;w<no.length;w++){var x=no[w],E;if(x){if(!m[x])continue;if(!("footnote-marker"!=x||c&&a.j))continue;if(x.match(/^first-/)&&(E=e.display,!E||E===Wc))continue;if("before"===x||"after"===x)if(E=m[x].content,!E||E===dd||E===H)continue;p.push(x);E=mo.createElementNS("http://www.w3.org/1999/xhtml",
"span");E.setAttribute("data-adapt-pseudo",x)}else E=mo.createElementNS("http://www.pyroxy.com/ns/shadow","content");r.appendChild(E);x.match(/^first-/)&&(r=E)}k=p.length?new Zj(b,q,null,h,k,2,new oo(b,d,f,g)):k}L(l,k)})});return K(l)}function Fl(a,b,c){a.J=b;a.j=c}
function so(a,b,c,d){var e=a.b;c=$i(c,e,a.G,a.j);b=Zi(c,e,b);aj(c,d,b,function(b,c){var d=c.evaluate(e,b);"font-family"==b&&(d=ml(a.F,d));return d});var f=Ok(d.display||Wc,d.position,d["float"],a.U===a.ca.root);["display","position","float"].forEach(function(a){f[a]&&(d[a]=f[a])});return b}
function to(a,b){for(var c=a.C.U,d=[],e=a.C.ma,f=-1;c&&1==c.nodeType;){var g=e&&e.root==c;if(!g||2==e.type){var h=(e?e.b:a.l).l(c,!1);d.push(h)}g?(c=e.ga,e=e.wd):(c=c.parentNode,f++)}c=Ab(a.b,"em",!f);c={"font-size":new V(new D(c,"px"),0)};e=new th(c,a.b);for(f=d.length-1;0<=f;--f){var g=d[f],h=[],l;for(l in g)Zg[l]&&h.push(l);h.sort(zd);for(var k=0;k<h.length;k++){var m=h[k];e.f=m;var p=g[m];p.value!==Vc&&(c[m]=p.Gc(e))}}for(var q in b)Zg[q]||(c[q]=b[q]);return c}
var uo={a:"a",sub:"sub",sup:"sup",table:"table",tr:"tr",td:"td",th:"th",code:"code",body:"div",p:"p",v:"p",date:"p",emphasis:"em",strong:"strong",style:"span",strikethrough:"del"};function vo(a,b){b=ka(b,a.ca.url);return a.A[b]||b}
function wo(a,b){var c=$g.filter(function(a){return b[a]});if(c.length){var d=a.C.j;if(a.C.parent){var d=a.C.j={},e;for(e in a.C.parent.j)d[e]=a.C.parent.j[e]}c.forEach(function(a){var c=b[a];if(c){if(c instanceof yc)d[a]=c.H;else if(c instanceof wc)d[a]=c.name;else if(c instanceof D)switch(c.ea){case "dpi":case "dpcm":case "dppx":d[a]=c.H*wb[c.ea]}delete b[a]}})}}function xo(a,b){for(var c=Bd.RESOLVE_FORMATTING_CONTEXT||[],d=0;d<c.length;d++){var e=c[d](a,b);if(e){a.R=e;break}}}
function yo(a,b,c){var d=!0,e=I("createElementView"),f=a.U,g=a.C.ma?a.C.ma.b:a.l,h=g.l(f,!1),l={};a.C.parent||(h=to(a,h));a.C.b=so(a,a.C.b,h,l);wo(a,l);l.direction&&(a.C.V=l.direction.toString());var k=l["flow-into"];if(k&&k.toString()!=a.B)return L(e,!1),K(e);var m=l.display;if(m===H)return L(e,!1),K(e);k=!a.C.parent;a.C.F=m===Sc;ro(a,f,k,h,l,g,a.b,a.C.ma).then(function(g){a.C.ya=g;var h=l.position;g=l["float-reference"];var k=l["float"],p=l.clear,x=a.C.b?rd:Uc,G=a.C.parent?a.C.parent.b?rd:Uc:x,
N="true"===f.getAttribute("data-vivliostyle-flow-root");a.C.J=eo(m,h,k,l.overflow,x,G,N);a.C.I=h===hd||h===Dc||h===Rc;fk(a.C)&&(p=null,k!==Tc&&(k=null));h=k===ad||k===id||k===od||k===Lc||k===Zc||k===Yc||k===Jc||k===Ic||k===Tc;k&&(delete l["float"],k===Tc&&(a.j?(h=!1,l.display=Hc):l.display=Wc));p&&(p===Vc&&a.C.parent&&a.C.parent.w&&(p=C(a.C.parent.w)),p===ad||p===id||p===Kc)&&(delete l.clear,l.display&&l.display!=Wc&&(a.C.w=p.toString()));var ta=m===bd&&l["ua-list-item-count"];(h||l["break-inside"]&&
l["break-inside"]!==Gc)&&a.C.u++;if(!(p=!h&&!m))a:switch(m.toString()){case "inline":case "inline-block":case "inline-list-item":case "inline-flex":case "inline-grid":case "ruby":case "inline-table":p=!0;break a;default:p=!1}if(!p)a:switch(m.toString()){case "ruby-base":case "ruby-text":case "ruby-base-container":case "ruby-text-container":p=!0;break a;default:p=!1}a.C.Ca=p;a.C.display=m?m.toString():"inline";a.C.l=h?k.toString():null;a.C.ka=g?g.toString():null;if(!a.C.Ca){if(g=l["break-after"])a.C.B=
g.toString();if(g=l["break-before"])a.C.h=g.toString()}a.C.G=l["vertical-align"]&&l["vertical-align"].toString()||"baseline";a.C.M=l["caption-side"]&&l["caption-side"].toString()||"top";g=l["border-collapse"];if(!g||g===C("separate"))if(g=l["border-spacing"])g.Jc()&&(g=g.values[0]),g.Vb()&&(a.C.T=Cc(g,a.b));if(g=l["x-first-pseudo"])a.C.g=new ak(a.C.parent?a.C.parent.g:null,g.H);if(g=l["white-space"])g=Mj(g.toString()),null!==g&&(a.C.Db=g);xo(a.C,b);a.C.R&&(b=zo(a.C.R,a.C,b));var Ma=!1,hb=null,ib=
[],xa=f.namespaceURI,E=f.localName;if("http://www.w3.org/1999/xhtml"==xa)"html"==E||"body"==E||"script"==E||"link"==E||"meta"==E?E="div":"vide_"==E?E="video":"audi_"==E?E="audio":"object"==E&&(Ma=!!a.g);else if("http://www.idpf.org/2007/ops"==xa)E="span",xa="http://www.w3.org/1999/xhtml";else if("http://www.gribuser.ru/xml/fictionbook/2.0"==xa){xa="http://www.w3.org/1999/xhtml";if("image"==E){if(E="div",(g=f.getAttributeNS("http://www.w3.org/1999/xlink","href"))&&"#"==g.charAt(0)&&(g=nj(a.ca,g)))hb=
Ao(a,xa,"img"),g="data:"+(g.getAttribute("content-type")||"image/jpeg")+";base64,"+g.textContent.replace(/[ \t\n\t]/g,""),ib.push(fe(hb,g))}else E=uo[E];E||(E=a.C.Ca?"span":"div")}else if("http://www.daisy.org/z3986/2005/ncx/"==xa)if(xa="http://www.w3.org/1999/xhtml","ncx"==E||"navPoint"==E)E="div";else if("navLabel"==E){if(E="span",k=f.parentNode){g=null;for(k=k.firstChild;k;k=k.nextSibling)if(1==k.nodeType&&(p=k,"http://www.daisy.org/z3986/2005/ncx/"==p.namespaceURI&&"content"==p.localName)){g=
p.getAttribute("src");break}g&&(E="a",f=f.ownerDocument.createElementNS(xa,"a"),f.setAttribute("href",g))}}else E="span";else"http://www.pyroxy.com/ns/shadow"==xa?(xa="http://www.w3.org/1999/xhtml",E=a.C.Ca?"span":"div"):Ma=!!a.g;ta?b?E="li":(E="div",m=Hc,l.display=m):"body"==E||"li"==E?E="div":"q"==E?E="span":"a"==E&&(g=l["hyperlink-processing"])&&"normal"!=g.toString()&&(E="span");l.behavior&&"none"!=l.behavior.toString()&&a.g&&(Ma=!0);f.dataset&&"true"==f.dataset.mathTypeset&&(Ma=!0);var Ka;Ma?
Ka=a.g(f,a.C.parent?a.C.parent.D:null,l):Ka=J(null);Ka.then(function(g){g?Ma&&(d="true"==g.getAttribute("data-adapt-process-children")):g=Ao(a,xa,E);"a"==E&&g.addEventListener("click",a.page.M,!1);hb&&(em(a,a.C,"inner",hb),g.appendChild(hb));"iframe"==g.localName&&"http://www.w3.org/1999/xhtml"==g.namespaceURI&&lo(g);var h=a.C.j["image-resolution"],k=[],m=l.width,p=l.height,q=f.getAttribute("width"),r=f.getAttribute("height"),m=m===Gc||!m&&!q,p=p===Gc||!p&&!r;if("http://www.gribuser.ru/xml/fictionbook/2.0"!=
f.namespaceURI||"td"==E){for(var q=f.attributes,w=q.length,r=null,x=0;x<w;x++){var G=q[x],N=G.namespaceURI,la=G.localName,G=G.nodeValue;if(N)if("http://www.w3.org/2000/xmlns/"==N)continue;else"http://www.w3.org/1999/xlink"==N&&"href"==la&&(G=vo(a,G));else{if(la.match(/^on/))continue;if("style"==la)continue;if(("id"==la||"name"==la)&&b){G=a.h.Cd(G,a.ca.url);g.setAttribute(la,G);Jj(a.page,g,G);continue}"src"==la||"href"==la||"poster"==la?(G=vo(a,G),"href"===la&&(G=a.h.xc(G,a.ca.url))):"srcset"==la&&
(G=G.split(",").map(function(b){return vo(a,b.trim())}).join(","));if("poster"===la&&"video"===E&&"http://www.w3.org/1999/xhtml"===xa&&m&&p){var Ka=new Image,Ed=fe(Ka,G);ib.push(Ed);k.push({ee:Ka,element:g,be:Ed})}}"http://www.w3.org/2000/svg"==xa&&/^[A-Z\-]+$/.test(la)&&(la=la.toLowerCase());-1!=Bo.indexOf(la.toLowerCase())&&(G=fo(G,a.ca.url,a.h));N&&(Ka=ko[N])&&(la=Ka+":"+la);"src"!=la||N||"img"!=E&&"input"!=E||"http://www.w3.org/1999/xhtml"!=xa?"href"==la&&"image"==E&&"http://www.w3.org/2000/svg"==
xa&&"http://www.w3.org/1999/xlink"==N?a.page.j.push(fe(g,G)):N?g.setAttributeNS(N,la,G):g.setAttribute(la,G):r=G}r&&(Ka="input"===E?new Image:g,q=fe(Ka,r),Ka!==g&&(g.src=r),m||p?(m&&p&&h&&1!==h&&k.push({ee:Ka,element:g,be:q}),ib.push(q)):a.page.j.push(q))}delete l.content;(m=l["list-style-image"])&&m instanceof Ac&&(m=m.url,ib.push(fe(new Image,m)));Co(a,g,l);if(!a.C.Ca&&(m=null,b?c&&(m=a.C.b?jo:io):m="clone"!==a.C.j["box-decoration-break"]?a.C.b?ho:go:a.C.b?jo:io,m))for(var qm in m)v(g,qm,m[qm]);
ta&&g.setAttribute("value",l["ua-list-item-count"].stringValue());a.D=g;ib.length?ee(ib).then(function(){0<h&&Do(a,k,h,l,a.C.b);L(e,d)}):Yd().then(function(){L(e,d)})})});return K(e)}var Bo="color-profile clip-path cursor filter marker marker-start marker-end marker-mid fill stroke mask".split(" ");
function Do(a,b,c,d,e){b.forEach(function(b){if("load"===b.be.get().get()){var f=b.ee,h=f.width/c,f=f.height/c;b=b.element;if(0<h&&0<f)if(d["box-sizing"]===Mc&&(d["border-left-style"]!==H&&(h+=Cc(d["border-left-width"],a.b)),d["border-right-style"]!==H&&(h+=Cc(d["border-right-width"],a.b)),d["border-top-style"]!==H&&(f+=Cc(d["border-top-width"],a.b)),d["border-bottom-style"]!==H&&(f+=Cc(d["border-bottom-width"],a.b))),1<c){var l=d["max-width"]||H,k=d["max-height"]||H;l===H&&k===H?v(b,"max-width",
h+"px"):l!==H&&k===H?v(b,"width",h+"px"):l===H&&k!==H?v(b,"height",f+"px"):"%"!==l.ea?v(b,"max-width",Math.min(h,Cc(l,a.b))+"px"):"%"!==k.ea?v(b,"max-height",Math.min(f,Cc(k,a.b))+"px"):e?v(b,"height",f+"px"):v(b,"width",h+"px")}else 1>c&&(l=d["min-width"]||xd,k=d["min-height"]||xd,l.H||k.H?l.H&&!k.H?v(b,"width",h+"px"):!l.H&&k.H?v(b,"height",f+"px"):"%"!==l.ea?v(b,"min-width",Math.max(h,Cc(l,a.b))+"px"):"%"!==k.ea?v(b,"min-height",Math.max(f,Cc(k,a.b))+"px"):e?v(b,"height",f+"px"):v(b,"width",h+
"px"):v(b,"min-width",h+"px"))}})}function Eo(a,b,c){var d=I("createNodeView"),e=!0;1==a.U.nodeType?b=yo(a,b,c):(8==a.U.nodeType?a.D=null:a.D=document.createTextNode(a.U.textContent.substr(a.ia||0)),b=J(!0));b.then(function(b){e=b;(a.C.D=a.D)&&(b=a.C.parent?a.C.parent.D:a.J)&&b.appendChild(a.D);L(d,e)});return K(d)}function Gl(a,b,c,d){(a.C=b)?(a.U=b.U,a.ia=b.ia):(a.U=null,a.ia=-1);a.D=null;return a.C?Eo(a,c,!!d):J(!0)}
function Fo(a){if(null==a.ma||"content"!=a.U.localName||"http://www.pyroxy.com/ns/shadow"!=a.U.namespaceURI)return a;var b=a.na,c=a.ma,d=a.parent,e,f;c.Wd?(f=c.Wd,e=c.root,c=c.type,2==c&&(e=e.firstChild)):(f=c.wd,e=c.ga.firstChild,c=2);var g=a.U.nextSibling;g?(a.U=g,bk(a)):a.wa?a=a.wa:e?a=null:(a=a.parent.modify(),a.K=!0);if(e)return b=new Xj(e,d,b),b.ma=f,b.Pa=c,b.wa=a,b;a.na=b;return a}
function Go(a){var b=a.na+1;if(a.K){if(!a.parent)return null;if(3!=a.Pa){var c=a.U.nextSibling;if(c)return a=a.modify(),a.na=b,a.U=c,bk(a),Fo(a)}if(a.wa)return a=a.wa.modify(),a.na=b,a;a=a.parent.modify()}else{if(a.ya&&(c=a.ya.root,2==a.ya.type&&(c=c.firstChild),c))return b=new Xj(c,a,b),b.ma=a.ya,b.Pa=a.ya.type,Fo(b);if(c=a.U.firstChild)return Fo(new Xj(c,a,b));1!=a.U.nodeType&&(b+=a.U.textContent.length-1-a.ia);a=a.modify()}a.na=b;a.K=!0;return a}
function Ll(a,b,c){b=Go(b);if(!b||b.K)return J(b);var d=I("nextInTree");Gl(a,b,!0,c).then(function(a){b.D&&a||(b=b.modify(),b.K=!0,b.D||(b.Ca=!0));L(d,b)});return K(d)}function Ho(a,b){if(b instanceof pc)for(var c=b.values,d=0;d<c.length;d++)Ho(a,c[d]);else b instanceof Ac&&(c=b.url,a.page.j.push(fe(new Image,c)))}var Io={"box-decoration-break":!0,"flow-into":!0,"flow-linger":!0,"flow-priority":!0,"flow-options":!0,page:!0,"float-reference":!0};
function Co(a,b,c){var d=c["background-image"];d&&Ho(a,d);var d=c.position===hd,e;for(e in c)if(!Io[e]){var f=c[e],f=f.$(new mg(a.ca.url,a.h));f.Vb()&&xb(f.ea)&&(f=new D(Cc(f,a.b),"px"));Bj[e]||d&&Cj[e]?a.page.u.push(new Dj(b,e,f)):v(b,e,f.toString())}}function em(a,b,c,d){if(!b.K){var e=(b.ma?b.ma.b:a.l).l(a.U,!1);if(e=e._pseudos)if(e=e[c])c={},b.b=so(a,b.b,e,c),b=c.content,yk(b)&&(b.$(new xk(d,a.b)),delete c.content),Co(a,d,c)}}
function Jl(a,b,c){var d=I("peelOff"),e=b.g,f=b.ia,g=b.K;if(0<c)b.D.textContent=b.D.textContent.substr(0,c),f+=c;else if(!g&&b.D&&!f){var h=b.D.parentNode;h&&h.removeChild(b.D)}for(var l=b.na+c,k=[];b.g===e;)k.push(b),b=b.parent;var m=k.pop(),p=m.wa;$d(function(){for(;0<k.length;){m=k.pop();b=new Xj(m.U,b,l);k.length||(b.ia=f,b.K=g);b.Pa=m.Pa;b.ma=m.ma;b.ya=m.ya;b.wa=m.wa?m.wa:p;p=null;var c=Gl(a,b,!1);if(c.va())return c}return J(!1)}).then(function(){L(d,b)});return K(d)}
function Ao(a,b,c){return"http://www.w3.org/1999/xhtml"==b?a.w.createElement(c):a.w.createElementNS(b,c)}function Zl(a,b,c){var d={},e=a.u._pseudos;b=so(a,b,a.u,d);if(e&&e.before){var f={},g=Ao(a,"http://www.w3.org/1999/xhtml","span");g.setAttribute("data-adapt-pseudo","before");c.appendChild(g);so(a,b,e.before,f);delete f.content;Co(a,g,f)}delete d.content;Co(a,c,d);return b}
function wm(a){a&&hk(a,function(a){var b=a.j["box-decoration-break"];b&&"slice"!==b||(b=a.D,a.b?(v(b,"padding-left","0"),v(b,"border-left","none"),v(b,"border-top-left-radius","0"),v(b,"border-bottom-left-radius","0")):(v(b,"padding-bottom","0"),v(b,"border-bottom","none"),v(b,"border-bottom-left-radius","0"),v(b,"border-bottom-right-radius","0")))})}
function ao(a,b,c){return b.ia===c.ia&&b.K==c.K&&b.ja.length===c.ja.length&&b.ja.every(function(a,b){var d;d=c.ja[b];if(a.ma)if(d.ma){var e=1===a.node.nodeType?a.node:a.node.parentElement,h=1===d.node.nodeType?d.node:d.node.parentElement;d=a.ma.ga===d.ma.ga&&Hm(e)===Hm(h)}else d=!1;else d=a.node===d.node;return d}.bind(a))}function Jo(a){this.b=a.h;this.window=a.window}
function Ko(a,b){var c=b.left,d=b.top;return{left:a.left-c,top:a.top-d,right:a.right-c,bottom:a.bottom-d,width:a.width,height:a.height}}function wl(a,b){var c=b.getClientRects(),d=a.b.getBoundingClientRect();return Array.from(c).map(function(a){return Ko(a,d)},a)}function Lj(a,b){var c=b.getBoundingClientRect(),d=a.b.getBoundingClientRect();return Ko(c,d)}function Ul(a,b){return a.window.getComputedStyle(b,null)}
function Lo(a,b,c,d,e){this.window=a;this.fontSize=b;this.b=a.document;this.root=c||this.b.body;b=this.root.firstElementChild;b||(b=this.b.createElement("div"),b.setAttribute("data-vivliostyle-outer-zoom-box",!0),this.root.appendChild(b));c=b.firstElementChild;c||(c=this.b.createElement("div"),c.setAttribute("data-vivliostyle-spread-container",!0),b.appendChild(c));var f=b.nextElementSibling;f||(f=this.b.createElement("div"),f.setAttribute("data-vivliostyle-layout-box",!0),this.root.appendChild(f));
this.g=b;this.f=c;this.h=f;b=Ul(new Jo(this),this.root);this.width=d||parseFloat(b.width)||a.innerWidth;this.height=e||parseFloat(b.height)||a.innerHeight}Lo.prototype.zoom=function(a,b,c){v(this.g,"width",a*c+"px");v(this.g,"height",b*c+"px");v(this.f,"width",a+"px");v(this.f,"height",b+"px");v(this.f,"transform","scale("+c+")")};function Mo(a,b,c){function d(c){return Ul(a,b).getPropertyValue(c)}function e(){v(b,"display","block");v(b,"position","static");return d(N)}function f(){v(b,"display","inline-block");v(r,N,"99999999px");var a=d(N);v(r,N,"");return a}function g(){v(b,"display","inline-block");v(r,N,"0");var a=d(N);v(r,N,"");return a}function h(){var a=e(),b=g(),c=parseFloat(a);if(c<=parseFloat(b))return b;b=f();return c<=parseFloat(b)?a:b}function l(){throw Error("Getting fill-available block size is not implemented");
}var k=b.style.display,m=b.style.position,p=b.style.width,q=b.style.height,w=b.parentNode,r=b.ownerDocument.createElement("div");v(r,"position",m);w.insertBefore(r,b);r.appendChild(b);v(b,"width","auto");v(b,"height","auto");var x=wa("writing-mode"),x=(x?d(x[0]):null)||d("writing-mode"),G="vertical-rl"===x||"tb-rl"===x||"vertical-lr"===x||"tb-lr"===x,N=G?"height":"width",ta=G?"width":"height",Ma={};c.forEach(function(a){var c;switch(a){case "fill-available inline size":c=e();break;case "max-content inline size":c=
f();break;case "min-content inline size":c=g();break;case "fit-content inline size":c=h();break;case "fill-available block size":c=l();break;case "max-content block size":case "min-content block size":case "fit-content block size":c=d(ta);break;case "fill-available width":c=G?l():e();break;case "fill-available height":c=G?e():l();break;case "max-content width":c=G?d(ta):f();break;case "max-content height":c=G?f():d(ta);break;case "min-content width":c=G?d(ta):g();break;case "min-content height":c=
G?g():d(ta);break;case "fit-content width":c=G?d(ta):h();break;case "fit-content height":c=G?h():d(ta)}Ma[a]=parseFloat(c);v(b,"position",m);v(b,"display",k)});v(b,"width",p);v(b,"height",q);w.insertBefore(b,r);w.removeChild(r);return Ma};function No(a){var b=a["writing-mode"],b=b&&b.value;a=(a=a.direction)&&a.value;return b===qd||b!==rd&&a!==ld?"ltr":"rtl"}
var Oo={a5:{width:new D(148,"mm"),height:new D(210,"mm")},a4:{width:new D(210,"mm"),height:new D(297,"mm")},a3:{width:new D(297,"mm"),height:new D(420,"mm")},b5:{width:new D(176,"mm"),height:new D(250,"mm")},b4:{width:new D(250,"mm"),height:new D(353,"mm")},"jis-b5":{width:new D(182,"mm"),height:new D(257,"mm")},"jis-b4":{width:new D(257,"mm"),height:new D(364,"mm")},letter:{width:new D(8.5,"in"),height:new D(11,"in")},legal:{width:new D(8.5,"in"),height:new D(14,"in")},ledger:{width:new D(11,"in"),
height:new D(17,"in")}},Po=new D(.24,"pt"),Qo=new D(3,"mm"),Ro=new D(10,"mm"),So=new D(13,"mm");
function To(a){var b={width:vd,height:wd,Ib:xd,rb:xd},c=a.size;if(c&&c.value!==Gc){var d=c.value;d.Jc()?(c=d.values[0],d=d.values[1]):(c=d,d=null);if(c.Vb())b.width=c,b.height=d||c;else if(c=Oo[c.name.toLowerCase()])d&&d===$c?(b.width=c.height,b.height=c.width):(b.width=c.width,b.height=c.height)}(c=a.marks)&&c.value!==H&&(b.rb=So);a=a.bleed;a&&a.value!==Gc?a.value&&a.value.Vb()&&(b.Ib=a.value):c&&(a=!1,c.value.Jc()?a=c.value.values.some(function(a){return a===Nc}):a=c.value===Nc,a&&(b.Ib=new D(6,
"pt")));return b}function Uo(a,b){var c={},d=a.Ib.H*Ab(b,a.Ib.ea,!1),e=a.rb.H*Ab(b,a.rb.ea,!1),f=d+e,g=a.width;c.xb=g===vd?(b.Z.ib?Math.floor(b.ta/2)-b.Z.Xb:b.ta)-2*f:g.H*Ab(b,g.ea,!1);g=a.height;c.wb=g===wd?b.kb-2*f:g.H*Ab(b,g.ea,!1);c.Ib=d;c.rb=e;c.fd=f;return c}function Vo(a,b,c){a=a.createElementNS("http://www.w3.org/2000/svg","svg");a.setAttribute("width",b);a.setAttribute("height",c);a.style.position="absolute";return a}
function Wo(a,b,c){a=a.createElementNS("http://www.w3.org/2000/svg",c||"polyline");a.setAttribute("stroke","black");a.setAttribute("stroke-width",b);a.setAttribute("fill","none");return a}var Xo={hf:"top left",jf:"top right",Ve:"bottom left",We:"bottom right"};
function Yo(a,b,c,d,e,f){var g=d;g<=e+2*wb.mm&&(g=e+d/2);var h=Math.max(d,g),l=e+h+c/2,k=Vo(a,l,l),g=[[0,e+d],[d,e+d],[d,e+d-g]];d=g.map(function(a){return[a[1],a[0]]});if("top right"===b||"bottom right"===b)g=g.map(function(a){return[e+h-a[0],a[1]]}),d=d.map(function(a){return[e+h-a[0],a[1]]});if("bottom left"===b||"bottom right"===b)g=g.map(function(a){return[a[0],e+h-a[1]]}),d=d.map(function(a){return[a[0],e+h-a[1]]});l=Wo(a,c);l.setAttribute("points",g.map(function(a){return a.join(",")}).join(" "));
k.appendChild(l);a=Wo(a,c);a.setAttribute("points",d.map(function(a){return a.join(",")}).join(" "));k.appendChild(a);b.split(" ").forEach(function(a){k.style[a]=f+"px"});return k}var Zo={gf:"top",Ue:"bottom",ue:"left",ve:"right"};
function $o(a,b,c,d,e){var f=2*d,g;"top"===b||"bottom"===b?(g=f,f=d):g=d;var h=Vo(a,g,f),l=Wo(a,c);l.setAttribute("points","0,"+f/2+" "+g+","+f/2);h.appendChild(l);l=Wo(a,c);l.setAttribute("points",g/2+",0 "+g/2+","+f);h.appendChild(l);a=Wo(a,c,"circle");a.setAttribute("cx",g/2);a.setAttribute("cy",f/2);a.setAttribute("r",d/4);h.appendChild(a);var k;switch(b){case "top":k="bottom";break;case "bottom":k="top";break;case "left":k="right";break;case "right":k="left"}Object.keys(Zo).forEach(function(a){a=
Zo[a];a===b?h.style[a]=e+"px":a!==k&&(h.style[a]="0",h.style["margin-"+a]="auto")});return h}function ap(a,b,c,d){var e=!1,f=!1;if(a=a.marks)a=a.value,a.Jc()?a.values.forEach(function(a){a===Nc?e=!0:a===Oc&&(f=!0)}):a===Nc?e=!0:a===Oc&&(f=!0);if(e||f){var g=c.P,h=g.ownerDocument,l=b.Ib,k=Cc(Po,d),m=Cc(Qo,d),p=Cc(Ro,d);e&&Object.keys(Xo).forEach(function(a){a=Yo(h,Xo[a],k,p,l,m);g.appendChild(a)});f&&Object.keys(Zo).forEach(function(a){a=$o(h,Zo[a],k,p,m);g.appendChild(a)})}}
var bp=function(){var a={width:!0,height:!0,"block-size":!0,"inline-size":!0,margin:!0,padding:!0,border:!0,outline:!0,"outline-width":!0,"outline-style":!0,"outline-color":!0};"left right top bottom before after start end block-start block-end inline-start inline-end".split(" ").forEach(function(b){a["margin-"+b]=!0;a["padding-"+b]=!0;a["border-"+b+"-width"]=!0;a["border-"+b+"-style"]=!0;a["border-"+b+"-color"]=!0});return a}(),cp={"top-left-corner":{order:1,Ha:!0,Ea:!1,Fa:!0,Ga:!0,qa:null},"top-left":{order:2,
Ha:!0,Ea:!1,Fa:!1,Ga:!1,qa:"start"},"top-center":{order:3,Ha:!0,Ea:!1,Fa:!1,Ga:!1,qa:"center"},"top-right":{order:4,Ha:!0,Ea:!1,Fa:!1,Ga:!1,qa:"end"},"top-right-corner":{order:5,Ha:!0,Ea:!1,Fa:!1,Ga:!0,qa:null},"right-top":{order:6,Ha:!1,Ea:!1,Fa:!1,Ga:!0,qa:"start"},"right-middle":{order:7,Ha:!1,Ea:!1,Fa:!1,Ga:!0,qa:"center"},"right-bottom":{order:8,Ha:!1,Ea:!1,Fa:!1,Ga:!0,qa:"end"},"bottom-right-corner":{order:9,Ha:!1,Ea:!0,Fa:!1,Ga:!0,qa:null},"bottom-right":{order:10,Ha:!1,Ea:!0,Fa:!1,Ga:!1,qa:"end"},
"bottom-center":{order:11,Ha:!1,Ea:!0,Fa:!1,Ga:!1,qa:"center"},"bottom-left":{order:12,Ha:!1,Ea:!0,Fa:!1,Ga:!1,qa:"start"},"bottom-left-corner":{order:13,Ha:!1,Ea:!0,Fa:!0,Ga:!1,qa:null},"left-bottom":{order:14,Ha:!1,Ea:!1,Fa:!0,Ga:!1,qa:"end"},"left-middle":{order:15,Ha:!1,Ea:!1,Fa:!0,Ga:!1,qa:"center"},"left-top":{order:16,Ha:!1,Ea:!1,Fa:!0,Ga:!1,qa:"start"}},dp=Object.keys(cp).sort(function(a,b){return cp[a].order-cp[b].order});
function ep(a,b,c){fn.call(this,a,null,"vivliostyle-page-rule-master",[],b,null,0);a=To(c);new fp(this.f,this,c,a);this.A={};gp(this,c);this.b.position=new V(hd,0);this.b.width=new V(a.width,0);this.b.height=new V(a.height,0);for(var d in c)bp[d]||"background-clip"===d||(this.b[d]=c[d])}t(ep,fn);function gp(a,b){var c=b._marginBoxes;c&&dp.forEach(function(d){c[d]&&(a.A[d]=new hp(a.f,a,d,b))})}ep.prototype.h=function(a){return new ip(a,this)};
function fp(a,b,c,d){kn.call(this,a,null,null,[],b);this.B=d;this.b["z-index"]=new V(new yc(0),0);this.b["flow-from"]=new V(C("body"),0);this.b.position=new V(Dc,0);this.b.overflow=new V(sd,0);for(var e in bp)bp.hasOwnProperty(e)&&(this.b[e]=c[e])}t(fp,kn);fp.prototype.h=function(a){return new jp(a,this)};
function hp(a,b,c,d){kn.call(this,a,null,null,[],b);this.w=c;a=d._marginBoxes[this.w];for(var e in d)if(b=d[e],c=a[e],Zg[e]||c&&c.value===Vc)this.b[e]=b;for(e in a)Object.prototype.hasOwnProperty.call(a,e)&&(b=a[e])&&b.value!==Vc&&(this.b[e]=b)}t(hp,kn);hp.prototype.h=function(a){return new kp(a,this)};function ip(a,b){gn.call(this,a,b);this.u=null;this.sa={}}t(ip,gn);
ip.prototype.l=function(a,b){var c=this.J,d;for(d in b)if(Object.prototype.hasOwnProperty.call(b,d))switch(d){case "writing-mode":case "direction":c[d]=b[d]}gn.prototype.l.call(this,a,b)};ip.prototype.md=function(){var a=this.style;a.left=xd;a["margin-left"]=xd;a["border-left-width"]=xd;a["padding-left"]=xd;a["padding-right"]=xd;a["border-right-width"]=xd;a["margin-right"]=xd;a.right=xd};
ip.prototype.nd=function(){var a=this.style;a.top=xd;a["margin-top"]=xd;a["border-top-width"]=xd;a["padding-top"]=xd;a["padding-bottom"]=xd;a["border-bottom-width"]=xd;a["margin-bottom"]=xd;a.bottom=xd};ip.prototype.da=function(a,b,c){b=b.G;var d={start:this.u.marginLeft,end:this.u.marginRight,la:this.u.Tb},e={start:this.u.marginTop,end:this.u.marginBottom,la:this.u.Sb};lp(this,b.top,!0,d,a,c);lp(this,b.bottom,!0,d,a,c);lp(this,b.left,!1,e,a,c);lp(this,b.right,!1,e,a,c)};
function mp(a,b,c,d,e){this.P=a;this.A=e;this.j=c;this.w=!Y(d,b[c?"width":"height"],new bc(d,0,"px"));this.l=null}mp.prototype.b=function(){return this.w};function np(a){a.l||(a.l=Mo(a.A,a.P.element,a.j?["max-content width","min-content width"]:["max-content height","min-content height"]));return a.l}mp.prototype.g=function(){var a=np(this);return this.j?sk(this.P)+a["max-content width"]+tk(this.P):qk(this.P)+a["max-content height"]+rk(this.P)};
mp.prototype.h=function(){var a=np(this);return this.j?sk(this.P)+a["min-content width"]+tk(this.P):qk(this.P)+a["min-content height"]+rk(this.P)};mp.prototype.f=function(){return this.j?sk(this.P)+this.P.width+tk(this.P):qk(this.P)+this.P.height+rk(this.P)};function op(a){this.j=a}op.prototype.b=function(){return this.j.some(function(a){return a.b()})};op.prototype.g=function(){var a=this.j.map(function(a){return a.g()});return Math.max.apply(null,a)*a.length};
op.prototype.h=function(){var a=this.j.map(function(a){return a.h()});return Math.max.apply(null,a)*a.length};op.prototype.f=function(){var a=this.j.map(function(a){return a.f()});return Math.max.apply(null,a)*a.length};function pp(a,b,c,d,e,f){mp.call(this,a,b,c,d,e);this.u=f}t(pp,mp);pp.prototype.b=function(){return!1};pp.prototype.g=function(){return this.f()};pp.prototype.h=function(){return this.f()};pp.prototype.f=function(){return this.j?sk(this.P)+this.u+tk(this.P):qk(this.P)+this.u+rk(this.P)};
function lp(a,b,c,d,e,f){var g=a.f.f,h={},l={},k={},m;for(m in b){var p=cp[m];if(p){var q=b[m],w=a.sa[m],r=new mp(q,w.style,c,g,f);h[p.qa]=q;l[p.qa]=w;k[p.qa]=r}}a=d.start.evaluate(e);d.end.evaluate(e);b=d.la.evaluate(e);var x=qp(k,b),G=!1,N={};Object.keys(h).forEach(function(a){var b=Y(g,l[a].style[c?"max-width":"max-height"],d.la);b&&(b=b.evaluate(e),x[a]>b&&(b=k[a]=new pp(h[a],l[a].style,c,g,f,b),N[a]=b.f(),G=!0))});G&&(x=qp(k,b),G=!1,["start","center","end"].forEach(function(a){x[a]=N[a]||x[a]}));
var ta={};Object.keys(h).forEach(function(a){var b=Y(g,l[a].style[c?"min-width":"min-height"],d.la);b&&(b=b.evaluate(e),x[a]<b&&(b=k[a]=new pp(h[a],l[a].style,c,g,f,b),ta[a]=b.f(),G=!0))});G&&(x=qp(k,b),["start","center","end"].forEach(function(a){x[a]=ta[a]||x[a]}));var Ma=a+b,hb=a+(a+b);["start","center","end"].forEach(function(a){var b=x[a];if(b){var d=h[a],e=0;switch(a){case "start":e=c?d.left:d.top;break;case "center":e=(hb-b)/2;break;case "end":e=Ma-b}c?wk(d,e,b-sk(d)-tk(d)):vk(d,e,b-qk(d)-
rk(d))}})}function qp(a,b){var c=a.start,d=a.center,e=a.end,f={};if(d){var g=[c,e].filter(function(a){return a}),g=rp(d,g.length?new op(g):null,b);g.cb&&(f.center=g.cb);d=g.cb||d.f();d=(b-d)/2;c&&c.b()&&(f.start=d);e&&e.b()&&(f.end=d)}else c=rp(c,e,b),c.cb&&(f.start=c.cb),c.zc&&(f.end=c.zc);return f}
function rp(a,b,c){var d={cb:null,zc:null};if(a&&b)if(a.b()&&b.b()){var e=a.g(),f=b.g();0<e&&0<f?(f=e+f,f<c?d.cb=c*e/f:(a=a.h(),b=b.h(),b=a+b,b<c?d.cb=a+(c-b)*(e-a)/(f-b):0<b&&(d.cb=c*a/b)),0<d.cb&&(d.zc=c-d.cb)):0<e?d.cb=c:0<f&&(d.zc=c)}else a.b()?d.cb=Math.max(c-b.f(),0):b.b()&&(d.zc=Math.max(c-a.f(),0));else a?a.b()&&(d.cb=c):b&&b.b()&&(d.zc=c);return d}ip.prototype.yb=function(a,b,c,d,e){ip.te.yb.call(this,a,b,c,d,e);b.element.setAttribute("data-vivliostyle-page-box",!0)};
function jp(a,b){ln.call(this,a,b);this.marginLeft=this.marginBottom=this.marginRight=this.marginTop=this.Sb=this.Tb=null}t(jp,ln);
jp.prototype.l=function(a,b){var c=this.J,d;for(d in b)Object.prototype.hasOwnProperty.call(b,d)&&(d.match(/^column.*$/)||d.match(/^background-/))&&(c[d]=b[d]);ln.prototype.l.call(this,a,b);d=this.g;c={Tb:this.Tb,Sb:this.Sb,marginTop:this.marginTop,marginRight:this.marginRight,marginBottom:this.marginBottom,marginLeft:this.marginLeft};d.u=c;d=d.style;d.width=new F(c.Tb);d.height=new F(c.Sb);d["padding-left"]=new F(c.marginLeft);d["padding-right"]=new F(c.marginRight);d["padding-top"]=new F(c.marginTop);
d["padding-bottom"]=new F(c.marginBottom)};jp.prototype.md=function(){var a=sp(this,{start:"left",end:"right",la:"width"});this.Tb=a.Zd;this.marginLeft=a.ne;this.marginRight=a.me};jp.prototype.nd=function(){var a=sp(this,{start:"top",end:"bottom",la:"height"});this.Sb=a.Zd;this.marginTop=a.ne;this.marginBottom=a.me};
function sp(a,b){var c=a.style,d=a.f.f,e=b.start,f=b.end,g=b.la,h=a.f.B[g].oa(d,null),l=Y(d,c[g],h),k=Y(d,c["margin-"+e],h),m=Y(d,c["margin-"+f],h),p=mn(d,c["padding-"+e],h),q=mn(d,c["padding-"+f],h),w=on(d,c["border-"+e+"-width"],c["border-"+e+"-style"],h),r=on(d,c["border-"+f+"-width"],c["border-"+f+"-style"],h),x=A(d,h,z(d,z(d,w,p),z(d,r,q)));l?(x=A(d,x,l),k||m?k?m=A(d,x,k):k=A(d,x,m):m=k=jc(d,x,new rb(d,.5))):(k||(k=d.b),m||(m=d.b),l=A(d,x,z(d,k,m)));c[e]=new F(k);c[f]=new F(m);c["margin-"+e]=
xd;c["margin-"+f]=xd;c["padding-"+e]=new F(p);c["padding-"+f]=new F(q);c["border-"+e+"-width"]=new F(w);c["border-"+f+"-width"]=new F(r);c[g]=new F(l);c["max-"+g]=new F(l);return{Zd:A(d,h,z(d,k,m)),ne:k,me:m}}jp.prototype.yb=function(a,b,c,d,e){ln.prototype.yb.call(this,a,b,c,d,e);c.I=b.element};function kp(a,b){ln.call(this,a,b);var c=b.w;this.u=cp[c];a.sa[c]=this;this.ta=!0}t(kp,ln);n=kp.prototype;
n.yb=function(a,b,c,d,e){var f=b.element;v(f,"display","flex");var g=yn(this,a,"vertical-align"),h=null;g===C("middle")?h="center":g===C("top")?h="flex-start":g===C("bottom")&&(h="flex-end");h&&(v(f,"flex-flow",this.b?"row":"column"),v(f,"justify-content",h));ln.prototype.yb.call(this,a,b,c,d,e)};
n.qa=function(a,b){var c=this.style,d=this.f.f,e=a.start,f=a.end,g="left"===e,h=g?b.Tb:b.Sb,l=Y(d,c[a.la],h),g=g?b.marginLeft:b.marginTop;if("start"===this.u.qa)c[e]=new F(g);else if(l){var k=mn(d,c["margin-"+e],h),m=mn(d,c["margin-"+f],h),p=mn(d,c["padding-"+e],h),q=mn(d,c["padding-"+f],h),w=on(d,c["border-"+e+"-width"],c["border-"+e+"-style"],h),f=on(d,c["border-"+f+"-width"],c["border-"+f+"-style"],h),l=z(d,l,z(d,z(d,p,q),z(d,z(d,w,f),z(d,k,m))));switch(this.u.qa){case "center":c[e]=new F(z(d,
g,kc(d,A(d,h,l),new rb(d,2))));break;case "end":c[e]=new F(A(d,z(d,g,h),l))}}};
function tp(a,b,c){function d(a){if(x)return x;x={la:r?r.evaluate(a):null,Ta:l?l.evaluate(a):null,Ua:k?k.evaluate(a):null};var b=h.evaluate(a),c=0;[q,m,p,w].forEach(function(b){b&&(c+=b.evaluate(a))});(null===x.Ta||null===x.Ua)&&c+x.la+x.Ta+x.Ua>b&&(null===x.Ta&&(x.Ta=0),null===x.Ua&&(x.pf=0));null!==x.la&&null!==x.Ta&&null!==x.Ua&&(x.Ua=null);null===x.la&&null!==x.Ta&&null!==x.Ua?x.la=b-c-x.Ta-x.Ua:null!==x.la&&null===x.Ta&&null!==x.Ua?x.Ta=b-c-x.la-x.Ua:null!==x.la&&null!==x.Ta&&null===x.Ua?x.Ua=
b-c-x.la-x.Ta:null===x.la?(x.Ta=x.Ua=0,x.la=b-c):x.Ta=x.Ua=(b-c-x.la)/2;return x}var e=a.style;a=a.f.f;var f=b.od,g=b.sd;b=b.la;var h=c["margin"+g.charAt(0).toUpperCase()+g.substring(1)],l=nn(a,e["margin-"+f],h),k=nn(a,e["margin-"+g],h),m=mn(a,e["padding-"+f],h),p=mn(a,e["padding-"+g],h),q=on(a,e["border-"+f+"-width"],e["border-"+f+"-style"],h),w=on(a,e["border-"+g+"-width"],e["border-"+g+"-style"],h),r=Y(a,e[b],h),x=null;e[b]=new F(new tb(a,function(){var a=d(this).la;return null===a?0:a},b));e["margin-"+
f]=new F(new tb(a,function(){var a=d(this).Ta;return null===a?0:a},"margin-"+f));e["margin-"+g]=new F(new tb(a,function(){var a=d(this).Ua;return null===a?0:a},"margin-"+g));"left"===f?e.left=new F(z(a,c.marginLeft,c.Tb)):"top"===f&&(e.top=new F(z(a,c.marginTop,c.Sb)))}n.md=function(){var a=this.g.u;this.u.Fa?tp(this,{od:"right",sd:"left",la:"width"},a):this.u.Ga?tp(this,{od:"left",sd:"right",la:"width"},a):this.qa({start:"left",end:"right",la:"width"},a)};
n.nd=function(){var a=this.g.u;this.u.Ha?tp(this,{od:"bottom",sd:"top",la:"height"},a):this.u.Ea?tp(this,{od:"top",sd:"bottom",la:"height"},a):this.qa({start:"top",end:"bottom",la:"height"},a)};n.Hc=function(a,b,c,d,e,f,g){ln.prototype.Hc.call(this,a,b,c,d,e,f,g);a=c.G;c=this.f.w;d=this.u;d.Fa||d.Ga?d.Ha||d.Ea||(d.Fa?a.left[c]=b:d.Ga&&(a.right[c]=b)):d.Ha?a.top[c]=b:d.Ea&&(a.bottom[c]=b)};
function up(a,b,c,d,e){this.b=a;this.l=b;this.h=c;this.f=d;this.g=e;this.j={};a=this.l;b=new cc(a,"page-number");b=new Vb(a,new ac(a,b,new rb(a,2)),a.b);c=new Lb(a,b);a.values["recto-page"]=c;a.values["verso-page"]=b;"ltr"===No(this.g)?(a.values["left-page"]=b,b=new Lb(a,b),a.values["right-page"]=b):(c=new Lb(a,b),a.values["left-page"]=c,a.values["right-page"]=b)}function vp(a){var b={};Fi(a.b,[],"",b);a.b.pop();return b}
function wp(a,b){var c=[],d;for(d in b)if(Object.prototype.hasOwnProperty.call(b,d)){var e=b[d],f;f=e instanceof V?e.value+"":wp(a,e);c.push(d+f+(e.Oa||""))}return c.sort().join("^")}function xp(a,b,c){c=c.clone({zb:"vivliostyle-page-rule-master"});var d=c.b,e=b.size;if(e){var f=To(b),e=e.Oa;d.width=lh(a.f,d.width,new V(f.width,e));d.height=lh(a.f,d.height,new V(f.height,e))}["counter-reset","counter-increment"].forEach(function(a){d[a]&&(b[a]=d[a])});c=c.h(a.h);c.l(a.b,a.g);Mn(c,a.f);return c}
function yp(a){this.b=null;this.h=a}t(yp,W);yp.prototype.apply=function(a){a.V===this.h&&this.b.apply(a)};yp.prototype.f=function(){return 3};yp.prototype.g=function(a){this.b&&Ah(a.mc,this.h,this.b);return!0};function zp(a){this.b=null;this.h=a}t(zp,W);zp.prototype.apply=function(a){1===(new cc(this.h,"page-number")).evaluate(a.l)&&this.b.apply(a)};zp.prototype.f=function(){return 2};function Ap(a){this.b=null;this.h=a}t(Ap,W);
Ap.prototype.apply=function(a){(new cc(this.h,"left-page")).evaluate(a.l)&&this.b.apply(a)};Ap.prototype.f=function(){return 1};function Bp(a){this.b=null;this.h=a}t(Bp,W);Bp.prototype.apply=function(a){(new cc(this.h,"right-page")).evaluate(a.l)&&this.b.apply(a)};Bp.prototype.f=function(){return 1};function Cp(a){this.b=null;this.h=a}t(Cp,W);Cp.prototype.apply=function(a){(new cc(this.h,"recto-page")).evaluate(a.l)&&this.b.apply(a)};Cp.prototype.f=function(){return 1};
function Dp(a){this.b=null;this.h=a}t(Dp,W);Dp.prototype.apply=function(a){(new cc(this.h,"verso-page")).evaluate(a.l)&&this.b.apply(a)};Dp.prototype.f=function(){return 1};function Ep(a,b){yh.call(this,a,b,null,null)}t(Ep,yh);Ep.prototype.apply=function(a){var b=a.l,c=a.B,d=this.style;a=this.W;rh(b,c,d,a,null,null);if(d=d._marginBoxes){var c=ph(c,"_marginBoxes"),e;for(e in d)if(d.hasOwnProperty(e)){var f=c[e];f||(f={},c[e]=f);rh(b,f,d[e],a,null,null)}}};
function Fp(a,b,c,d,e){Qi.call(this,a,b,null,c,null,d,!1);this.M=e;this.G=[];this.g="";this.B=[]}t(Fp,Qi);n=Fp.prototype;n.Yb=function(){this.nb()};n.pb=function(a,b){if(this.g=b)this.b.push(new yp(b)),this.W+=65536};
n.nc=function(a,b){b&&df(this,"E_INVALID_PAGE_SELECTOR :"+a+"("+b.join("")+")");this.B.push(":"+a);switch(a.toLowerCase()){case "first":this.b.push(new zp(this.f));this.W+=256;break;case "left":this.b.push(new Ap(this.f));this.W+=1;break;case "right":this.b.push(new Bp(this.f));this.W+=1;break;case "recto":this.b.push(new Cp(this.f));this.W+=1;break;case "verso":this.b.push(new Dp(this.f));this.W+=1;break;default:df(this,"E_INVALID_PAGE_SELECTOR :"+a)}};
function Gp(a){var b;a.g||a.B.length?b=[a.g].concat(a.B.sort()):b=null;a.G.push({Td:b,W:a.W});a.g="";a.B=[]}n.Wb=function(){Gp(this);Qi.prototype.Wb.call(this)};n.xa=function(){Gp(this);Qi.prototype.xa.call(this)};
n.mb=function(a,b,c){if("bleed"!==a&&"marks"!==a||this.G.some(function(a){return!a.Td})){Qi.prototype.mb.call(this,a,b,c);var d=this.l[a],e=this.M;if("bleed"===a||"marks"===a)e[""]||(e[""]={}),Object.keys(e).forEach(function(b){oh(e[b],a,d)});else if("size"===a){var f=e[""];this.G.forEach(function(b){var c=new V(d.value,d.Oa+b.W);b=b.Td?b.Td.join(""):"";var g=e[b];g?(c=(b=g[a])?lh(null,c,b):c,oh(g,a,c)):(g=e[b]={},oh(g,a,c),f&&["bleed","marks"].forEach(function(a){f[a]&&oh(g,a,f[a])},this))},this)}}};
n.he=function(a){Ah(this.j.mc,"*",a)};n.le=function(a){return new Ep(this.l,a)};n.Ad=function(a){var b=ph(this.l,"_marginBoxes"),c=b[a];c||(c={},b[a]=c);$e(this.ga,new Hp(this.f,this.ga,this.w,c))};function Hp(a,b,c,d){af.call(this,a,b,!1);this.g=c;this.b=d}t(Hp,bf);Hp.prototype.lb=function(a,b,c){Xg(this.g,a,b,c,this)};Hp.prototype.kc=function(a,b){cf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};Hp.prototype.Wc=function(a,b){cf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};
Hp.prototype.mb=function(a,b,c){oh(this.b,a,new V(b,c?Xe(this):Ye(this)))};var Ip=new ce(function(){var a=I("uaStylesheetBase");Yg.get().then(function(b){var c=ka("user-agent-base.css",ja);b=new Qi(null,null,null,null,null,b,!0);b.Zb("UA");Pi=b.j;Df(c,b,null,null).ra(a)});return K(a)},"uaStylesheetBaseFetcher");
function Jp(a,b,c,d,e,f,g,h,l,k){this.l=a;this.f=b;this.b=c;this.g=d;this.G=e;this.j=f;this.A=a.J;this.B=g;this.h=h;this.w=l;this.F=k;this.u=a.l;vb(this.b,function(a){var b=this.b,c;c=(c=b.b[a])?(c=c.b[0])?c.b:null:null;var d;d=b.b[a];if(d=Kp(this,d?d.f:"any"))d=(a=b.b[a])?0<a.b.length&&a.b[0].b.f<=this.A:!1;return d&&!!c&&!Lp(this,c)});ub(this.b,new tb(this.b,function(){return this.pa+this.b.page},"page-number"))}
function Mp(a,b,c,d){if(a.w.length){var e=new yb(0,b,c,d);a=a.w;for(var f={},g=0;g<a.length;g++)rh(e,f,a[g],0,null,null);g=f.width;a=f.height;var h=f["text-zoom"];if(g&&a||h)if(f=wb.em,(h?h.evaluate(e,"text-zoom"):null)===jd&&(h=f/d,d=f,b*=h,c*=h),g&&a&&(g=Cc(g.evaluate(e,"width"),e),e=Cc(a.evaluate(e,"height"),e),0<g&&0<e))return{width:g,height:e,fontSize:d}}return{width:b,height:c,fontSize:d}}
function Np(a,b,c,d,e,f,g,h,l,k,m){yb.call(this,0,d.width,d.height,d.fontSize);this.style=a;this.ca=b;this.lang=b.lang||c;this.viewport=d;this.j={body:!0};this.g=e;this.w=this.b=this.G=this.f=this.B=null;this.A=0;this.jb=f;this.l=new ll(this.style.A);this.ka={};this.T=null;this.h=m;this.M={};this.da=null;this.Qa=g;this.Xa=h;this.pa=l;this.Wa=k;for(var p in a.h)(b=a.h[p]["flow-consume"])&&(b.evaluate(this,"flow-consume")==Ec?this.j[p]=!0:delete this.j[p]);this.sa={}}t(Np,yb);
function Op(a){var b=I("StyleInstance.init"),c=new Km(a.h,a.ca.url),d=new Jm(a.h,a.ca.url,a.style.f,a.style.b);a.f=new Tk(a.ca,a.style.g,a.style.f,a,a.j,a.style.u,c,d);d.h=a.f;cl(a.f,a);a.G={};a.G[a.ca.url]=a.f;var e=$k(a.f);a.da=No(e);a.B=new Nn(a.style.G);c=new Ci(a.style.g,a,c,d);a.B.l(c,e);Mn(a.B,a);a.T=new up(c,a.style.b,a.B,a,e);e=[];for(c=0;c<a.style.j.length;c++)if(d=a.style.j[c],!d.S||d.S.evaluate(a))d=il(d.Lb,a),d=new jl(d),e.push(d);rl(a.jb,e,a.l).ra(b);var f=a.style.F;Object.keys(f).forEach(function(a){var b=
Uo(To(f[a]),this);this.sa[a]={width:b.xb+2*b.fd,height:b.wb+2*b.fd}},a);return K(b)}function dl(a,b,c){if(a=a.b)a.g[b.b]||(a.g[b.b]=c),c=a.b[b.b],c||(c=new lk,a.b[b.b]=c),c.b.push(new kk(new ik({ja:[{node:b.element,Pa:Vj,ma:null,ya:null,wa:null}],ia:0,K:!1}),b))}function Pp(a,b){for(var c=Number.POSITIVE_INFINITY,d=0;d<b.b.length;d++){for(var e=b.b[d].f.Ma,f=e.ja[0].node,g=e.ia,h=e.K,l=0;f.ownerDocument!=a.ca.b;)l++,f=e.ja[l].node,h=!1,g=0;e=jj(a.ca,f,g,h);e<c&&(c=e)}return c}
function Qp(a,b,c){if(!b)return 0;var d=Number.POSITIVE_INFINITY,e;for(e in a.j){var f=b.b[e];if(!(c||f&&f.b.length)&&a.b){f=a.f;f.I=e;for(var g=0;null!=f.I&&(g+=5E3,al(f,g,0)!=Number.POSITIVE_INFINITY););f=a.b.b[e];b!=a.b&&f&&(f=f.clone(),b.b[e]=f)}f&&(f=Pp(a,f),f<d&&(d=f))}return d}function Kp(a,b){switch(b){case "left":case "right":case "recto":case "verso":return(new cc(a.style.b,b+"-page")).evaluate(a);default:return!0}}
function Rp(a,b){var c=a.b,d=Qp(a,c);if(d==Number.POSITIVE_INFINITY)return null;for(var e=a.B.w,f,g=0;g<e.length;g++)if(f=e[g],"vivliostyle-page-rule-master"!==f.f.zb){var h=1,l=yn(f,a,"utilization");l&&l.Qd()&&(h=l.H);var l=Ab(a,"em",!1),k=a.xb()*a.wb();a.A=al(a.f,d,Math.ceil(h*k/(l*l)));h=a;l=c;k=void 0;for(k in l.b){var m=l.b[k];if(m&&0<m.b.length){var p=m.b[0].b;if(Pp(h,m)===p.f){a:switch(p=m.f,p){case "left":case "right":case "recto":case "verso":break a;default:p=null}m.f=tl(Kk(p,m.b[0].b.g))}}}a.w=
c.clone();h=a;l=h.b.page;k=void 0;for(k in h.b.b)for(m=h.b.b[k],p=m.b.length-1;0<=p;p--){var q=m.b[p];0>q.b.ab&&q.b.f<h.A&&(q.b.ab=l)}zb(a,a.style.b);h=yn(f,a,"enabled");if(!h||h===td){c=a;u.debug("Location - page",c.b.page);u.debug("  current:",d);u.debug("  lookup:",c.A);d=void 0;for(d in c.b.b)for(e=c.b.b[d],g=0;g<e.b.length;g++)u.debug("  Chunk",d+":",e.b[g].b.f);d=a.T;e=f;f=b;c=e.f;Object.keys(f).length?(e=c,g=wp(d,f),e=e.l+"^"+g,g=d.j[e],g||("background-host"===c.zb?(c=d,f=(new ep(c.l,c.h.f,
f)).h(c.h),f.l(c.b,c.g),Mn(f,c.f),g=f):g=xp(d,f,c),d.j[e]=g),f=g.f,f.f.g=f,f=g):(c.f.g=c,f=e);return f}}throw Error("No enabled page masters");}function Lp(a,b){var c=a.w.g,d=c[b.b].f;if(d){var e=b.f,f=c[d].b;if(!f.length||e<f[0])return!1;var c=Ha(f.length,function(a){return f[a]>e})-1,c=f[c],d=a.w.b[d],g=Pp(a,d);return c<g?!1:g<c?!0:!Kp(a,d.f)}return!1}
function Sp(a,b,c){var d=a.b.b[c];if(!d||!Kp(a,d.f))return J(!0);d.f="any";$l(b);a.j[c]&&0<b.Eb.length&&(b.de=!1);var e=I("layoutColumn"),f=[],g=[],h=!0;ae(function(c){for(;0<d.b.length-g.length;){for(var e=0;0<=g.indexOf(e);)e++;var l=d.b[e];if(l.b.f>a.A||Lp(a,l.b))break;for(var p=e+1;p<d.b.length;p++)if(!(0<=g.indexOf(p))){var q=d.b[p];if(q.b.f>a.A||Lp(a,q.b))break;Qj(q.b,l.b)&&(l=q,e=p)}var w=l.b,r=!0;cm(b,l.f,h).then(function(a){h=!1;!l.b.Ke||a&&!w.h||f.push(e);w.h?(g.push(e),O(c)):(a?l.f=a:g.push(e),
b.l&&(d.f=tl(b.l)),a||b.l?O(c):r?r=!1:M(c))});if(r){r=!1;return}}O(c)}).then(function(){d.b=d.b.filter(function(a,b){return 0<=f.indexOf(b)||0>g.indexOf(b)});L(e,!0)});return K(e)}
function Tp(a,b,c,d,e,f,g,h){rn(c);var l=yn(c,a,"enabled");if(l&&l!==td)return J(!0);var k=I("layoutContainer"),m=yn(c,a,"wrap-flow")===Gc,p=c.b?c.j&&c.M:c.h&&c.T,l=yn(c,a,"flow-from"),q=a.viewport.b.createElement("div"),w=yn(c,a,"position");v(q,"position",w?w.name:"absolute");d.insertBefore(q,d.firstChild);var r=new pk(q);r.b=c.b;c.yb(a,r,b,a.l,a.g);r.J=e;r.M=f;e+=r.left+r.marginLeft+r.da;f+=r.top+r.marginTop+r.ka;var x=!1;if(l&&l.ie())if(a.M[l.toString()])c.Hc(a,r,b,null,1,a.g,a.l),l=J(!0);else{var G=
I("layoutContainer.inner"),N=l.toString(),ta=Z(c,a,"column-count"),Ma=Z(c,a,"column-gap"),hb=1<ta?Z(c,a,"column-width"):r.width,l=xn(c,a),ib=0,w=yn(c,a,"shape-inside"),xa=jg(w,0,0,r.width,r.height,a),E=new po(N,a,a.viewport,a.f,l,a.ca,a.l,a.style.B,a,b,a.Qa,a.Xa,h,a.Wa),Ka=new Im(a.h,a.b.page-1),Ed=0,ea=null;ae(function(b){for(;Ed<ta;){var c=Ed++;if(1<ta){var d=a.viewport.b.createElement("div");v(d,"position","absolute");q.appendChild(d);ea=new El(d,E,a.g,Ka);ea.b=r.b;ea.kb=r.kb;ea.Ac=r.Ac;r.b?(v(d,
"margin-left",r.w+"px"),v(d,"margin-right",r.G+"px"),c=c*(hb+Ma)+r.A,wk(ea,0,r.width),vk(ea,c,hb)):(v(d,"margin-top",r.A+"px"),v(d,"margin-bottom",r.F+"px"),c=c*(hb+Ma)+r.w,vk(ea,0,r.height),wk(ea,c,hb));ea.J=e+r.w;ea.M=f+r.A}else ea=new El(q,E,a.g,Ka),uk(ea,r),r=ea;ea.T=p?[]:g;ea.Gb=xa;if(0<=ea.width){var k=I("inner");Sp(a,ea,N).then(function(){ea.l&&"column"!=ea.l&&(Ed=ta,"region"!=ea.l&&(a.M[N]=!0));L(k,!0)});c=K(k)}else c=J(!0);if(c.va()){c.then(function(){0<h.b.length?O(b):(ib=Math.max(ib,ea.g),
M(b))});return}0<h.b.length||(ib=Math.max(ib,ea.g))}O(b)}).then(function(){r.g=ib;c.Hc(a,r,b,ea,ta,a.g,a.l);L(G,!0)});l=K(G)}else(l=yn(c,a,"content"))&&yk(l)?(w=a.viewport.b.createElement("span"),l.$(new xk(w,a)),q.appendChild(w),Ln(c,a,r,a.l)):c.ta&&(d.removeChild(q),x=!0),x||c.Hc(a,r,b,null,1,a.g,a.l),l=J(!0);l.then(function(){if(!c.h||0<Math.floor(r.g)){if(!x&&!m){var l=r.J+r.left,p=r.M+r.top,w=sk(r)+r.width+tk(r),G=qk(r)+r.height+rk(r),E=yn(c,a,"shape-outside"),l=jg(E,l,p,w,G,a);g.push(l)}}else if(!c.w.length){d.removeChild(q);
L(k,!0);return}var N=c.w.length-1;$d(function(){for(;0<=N;){var d=c.w[N--],d=Tp(a,b,d,q,e,f,g,h);if(d.va())return d}return J(!1)}).then(function(){L(k,!0)})});return K(k)}
function Up(a,b,c){a.M={};c?(a.b=c.clone(),Wk(a.f,c.f)):(a.b=new nk,Wk(a.f,-1));a.lang&&b.g.setAttribute("lang",a.lang);c=a.b;c.page++;zb(a,a.style.b);a.w=c.clone();var d=vp(a.T),e=Rp(a,d);if(!e)return J(null);Hj(b,e.f.b.width.value===vd);Ij(b,e.f.b.height.value===wd);a.h.j=b;Um(a.h,d,a);var f=Uo(To(d),a);Vp(a,f,b);ap(d,f,b,a);var g=f.rb+f.Ib,d=yn(e,a,"writing-mode")||Uc,f=yn(e,a,"direction")||cd,h=new $n(b.J.bind(b),d,f),l=[],k=I("layoutNextPage");ae(function(d){Tp(a,b,e,b.g,g,g,l.concat(),h).then(function(){if(0<
h.b.length){l=l.concat(bo(h));h.b.splice(0,h.b.length);c=a.b=a.w.clone();for(var e;e=b.g.lastChild;)b.g.removeChild(e);M(d)}else O(d)})}).then(function(){e.da(a,b,a.g);var d=new cc(e.f.f,"left-page");b.l=d.evaluate(a)?"left":"right";var d=a.b.page,f;for(f in a.b.b)for(var g=a.b.b[f],h=g.b.length-1;0<=h;h--){var l=g.b[h];0<=l.b.ab&&l.b.ab+l.b.l-1<=d&&g.b.splice(h,1)}a.b=a.w=null;c.f=a.f.b;Kj(b,a.style.l.I[a.ca.url],a.g);var x;a:{for(x in a.j)if((f=c.b[x])&&0<f.b.length){x=!1;break a}x=!0}x&&(c=null);
L(k,c)});return K(k)}function Vp(a,b,c){a.J=b.xb;a.I=b.wb;c.P.style.width=b.xb+2*b.fd+"px";c.P.style.height=b.wb+2*b.fd+"px";c.g.style.left=b.rb+"px";c.g.style.right=b.rb+"px";c.g.style.top=b.rb+"px";c.g.style.bottom=b.rb+"px";c.g.style.padding=b.Ib+"px"}function Wp(a,b,c,d){Qi.call(this,a.j,a,b,c,d,a.h,!c);this.g=a;this.B=!1}t(Wp,Qi);n=Wp.prototype;n.Tc=function(){};n.Sc=function(a,b,c){a=new fn(this.g.u,a,b,c,this.g.F,this.S,Ye(this.ga));$e(this.g,new Sn(a.f,this.g,a,this.w))};
n.Ob=function(a){a=a.f;this.S&&(a=ic(this.f,this.S,a));$e(this.g,new Wp(this.g,a,this,this.F))};n.Pc=function(){$e(this.g,new Wi(this.f,this.ga))};n.Rc=function(){var a={};this.g.w.push({Lb:a,S:this.S});$e(this.g,new Xi(this.f,this.ga,null,a,this.g.h))};n.Qc=function(a){var b=this.g.l[a];b||(b={},this.g.l[a]=b);$e(this.g,new Xi(this.f,this.ga,null,b,this.g.h))};n.Vc=function(){var a={};this.g.G.push(a);$e(this.g,new Xi(this.f,this.ga,this.S,a,this.g.h))};
n.sc=function(a){var b=this.g.A;if(a){var c=ph(b,"_pseudos"),b=c[a];b||(b={},c[a]=b)}$e(this.g,new Xi(this.f,this.ga,null,b,this.g.h))};n.Uc=function(){this.B=!0;this.nb()};n.Yb=function(){var a=new Fp(this.g.u,this.g,this,this.w,this.g.B);$e(this.g,a);a.Yb()};n.xa=function(){Qi.prototype.xa.call(this);if(this.B){this.B=!1;var a="R"+this.g.J++,b=C(a),c;this.S?c=new kh(b,0,this.S):c=new V(b,0);qh(this.l,"region-id").push(c);this.ub();a=new Wp(this.g,this.S,this,a);$e(this.g,a);a.xa()}};
function Xp(a){var b=a.getAttribute("content");if(!b)return"";a={};for(var c;c=b.match(/^,?\s*([-A-Za-z_.][-A-Za-z_0-9.]*)\s*=\s*([-+A-Za-z_0-9.]*)\s*/);)b=b.substr(c[0].length),a[c[1]]=c[2];b=a.width-0;a=a.height-0;return b&&a?"@-epubx-viewport{width:"+b+"px;height:"+a+"px;}":""}function Yp(a){Ze.call(this);this.h=a;this.j=new qb(null);this.u=new qb(this.j);this.F=new cn(this.j);this.I=new Wp(this,null,null,null);this.J=0;this.w=[];this.A={};this.l={};this.G=[];this.B={};this.b=this.I}t(Yp,Ze);
Yp.prototype.error=function(a){u.b("CSS parser:",a)};function Zp(a,b){return $p(b,a)}function aq(a){Se.call(this,Zp,"document");this.J=a;this.G={};this.u={};this.f={};this.I={};this.l=null;this.b=[]}t(aq,Se);function bq(a,b,c){cq(a,b,c);var d=ka("user-agent.xml",ja),e=I("OPSDocStore.init");Yg.get().then(function(b){a.l=b;Ip.get().then(function(){a.load(d).then(function(){L(e,!0)})})});return K(e)}function cq(a,b,c){a.b.splice(0);b&&b.forEach(a.M,a);c&&c.forEach(a.T,a)}
aq.prototype.M=function(a){this.b.push({url:a.url,text:a.text,Sa:"Author",Ba:null,media:null})};aq.prototype.T=function(a){this.b.push({url:a.url,text:a.text,Sa:"User",Ba:null,media:null})};
function $p(a,b){var c=I("OPSDocStore.load"),d=b.url;rj(b,a).then(function(b){if(b){for(var e=[],g=b.b.getElementsByTagNameNS("http://www.idpf.org/2007/ops","trigger"),h=0;h<g.length;h++){var l=g[h],k=l.getAttributeNS("http://www.w3.org/2001/xml-events","observer"),m=l.getAttributeNS("http://www.w3.org/2001/xml-events","event"),p=l.getAttribute("action"),l=l.getAttribute("ref");k&&m&&p&&l&&e.push({He:k,event:m,action:p,qc:l})}a.I[d]=e;var q=[];q.push({url:ka("user-agent-page.css",ja),text:null,Sa:"UA",
Ba:null,media:null});if(e=b.l)for(e=e.firstChild;e;e=e.nextSibling)if(1==e.nodeType)if(g=e,h=g.namespaceURI,k=g.localName,"http://www.w3.org/1999/xhtml"==h)if("style"==k)q.push({url:d,text:g.textContent,Sa:"Author",Ba:null,media:null});else if("link"==k){if(m=g.getAttribute("rel"),h=g.getAttribute("class"),k=g.getAttribute("media"),"stylesheet"==m||"alternate stylesheet"==m&&h)g=g.getAttribute("href"),g=ka(g,d),q.push({url:g,text:null,Ba:h,media:k,Sa:"Author"})}else"meta"==k&&"viewport"==g.getAttribute("name")&&
q.push({url:d,text:Xp(g),Sa:"Author",Ba:null,media:null});else"http://www.gribuser.ru/xml/fictionbook/2.0"==h?"stylesheet"==k&&"text/css"==g.getAttribute("type")&&q.push({url:d,text:g.textContent,Sa:"Author",Ba:null,media:null}):"http://example.com/sse"==h&&"property"===k&&(h=g.getElementsByTagName("name")[0])&&"stylesheet"===h.textContent&&(g=g.getElementsByTagName("value")[0])&&(g=ka(g.textContent,d),q.push({url:g,text:null,Ba:null,media:null,Sa:"Author"}));for(h=0;h<a.b.length;h++)q.push(a.b[h]);
for(var w="",h=0;h<q.length;h++)w+=q[h].url,w+="^",q[h].text&&(w+=q[h].text),w+="^";var r=a.G[w];r?(a.f[d]=r,L(c,b)):(e=a.u[w],e||(e=new ce(function(){var b=I("fetchStylesheet"),c=0,d=new Yp(a.l);$d(function(){if(c<q.length){var a=q[c++];d.Zb(a.Sa);return null!==a.text?Ef(a.text,d,a.url,a.Ba,a.media).Bd(!0):Df(a.url,d,a.Ba,a.media)}return J(!1)}).then(function(){r=new Jp(a,d.j,d.u,d.I.j,d.F,d.w,d.A,d.l,d.G,d.B);a.G[w]=r;delete a.u[w];L(b,r)});return K(b)},"FetchStylesheet "+d),a.u[w]=e,e.start()),
e.get().then(function(e){a.f[d]=e;L(c,b)}))}else L(c,null)});return K(c)};function dq(a){return String.fromCharCode(a>>>24&255,a>>>16&255,a>>>8&255,a&255)}
function eq(a){var b=new za;b.append(a);var c=55-a.length&63;for(b.append("\u0080");0<c;)c--,b.append("\x00");b.append("\x00\x00\x00\x00");b.append(dq(8*a.length));a=b.toString();for(var b=[1732584193,4023233417,2562383102,271733878,3285377520],c=[],d,e=0;e<a.length;e+=64){for(d=0;16>d;d++){var f=a.substr(e+4*d,4);c[d]=(f.charCodeAt(0)&255)<<24|(f.charCodeAt(1)&255)<<16|(f.charCodeAt(2)&255)<<8|f.charCodeAt(3)&255}for(;80>d;d++)f=c[d-3]^c[d-8]^c[d-14]^c[d-16],c[d]=f<<1|f>>>31;var f=b[0],g=b[1],h=
b[2],l=b[3],k=b[4],m;for(d=0;80>d;d++)m=20>d?(g&h|~g&l)+1518500249:40>d?(g^h^l)+1859775393:60>d?(g&h|g&l|h&l)+2400959708:(g^h^l)+3395469782,m+=(f<<5|f>>>27)+k+c[d],k=l,l=h,h=g<<30|g>>>2,g=f,f=m;b[0]=b[0]+f|0;b[1]=b[1]+g|0;b[2]=b[2]+h|0;b[3]=b[3]+l|0;b[4]=b[4]+k|0}return b}function fq(a){a=eq(a);for(var b=[],c=0;c<a.length;c++){var d=a[c];b.push(d>>>24&255,d>>>16&255,d>>>8&255,d&255)}return b}
function gq(a){a=eq(a);for(var b=new za,c=0;c<a.length;c++)b.append(dq(a[c]));a=b.toString();b=new za;for(c=0;c<a.length;c++)b.append((a.charCodeAt(c)|256).toString(16).substr(1));return b.toString()};function hq(a,b,c,d,e,f,g,h,l,k){this.b=a;this.url=b;this.lang=c;this.f=d;this.l=e;this.Z=gb(f);this.u=g;this.j=h;this.h=l;this.g=k;this.$a=this.page=null}function iq(a,b,c){if(c--)for(b=b.firstChild;b;b=b.nextSibling)if(1==b.nodeType){var d=b;"auto"!=ya(d,"height","auto")&&(v(d,"height","auto"),iq(a,d,c));"absolute"==ya(d,"position","static")&&(v(d,"position","relative"),iq(a,d,c))}}
function jq(a){var b=a.target,c="\u25b8"==b.textContent;b.textContent=c?"\u25be":"\u25b8";for(b=b.parentNode.firstChild;b;)if(1!=b.nodeType)b=b.nextSibling;else{var d=b;"toc-container"==d.getAttribute("data-adapt-class")?b=d.firstChild:("toc-node"==d.getAttribute("data-adapt-class")&&(d.style.height=c?"auto":"0px"),b=b.nextSibling)}a.stopPropagation()}
hq.prototype.pd=function(a){var b=this.u.pd(a);return function(a,d,e){var c=e.behavior;if(!c||"toc-node"!=c.toString()&&"toc-container"!=c.toString())return b(a,d,e);a=d.getAttribute("data-adapt-class");"toc-node"==a&&(e=d.firstChild,"\u25b8"!=e.textContent&&(e.textContent="\u25b8",v(e,"cursor","pointer"),e.addEventListener("click",jq,!1)));var g=d.ownerDocument.createElement("div");g.setAttribute("data-adapt-process-children","true");"toc-node"==c.toString()?(e=d.ownerDocument.createElement("div"),
e.textContent="\u25b9",v(e,"margin-left","-1em"),v(e,"display","inline-block"),v(e,"width","1em"),v(e,"text-align","left"),v(e,"cursor","default"),v(e,"font-family","Menlo,sans-serif"),g.appendChild(e),v(g,"overflow","hidden"),g.setAttribute("data-adapt-class","toc-node"),"toc-node"!=a&&"toc-container"!=a||v(g,"height","0px")):"toc-node"==a&&g.setAttribute("data-adapt-class","toc-container");return J(g)}};
hq.prototype.Oc=function(a,b,c,d,e){if(this.page)return J(this.page);var f=this,g=I("showTOC"),h=new Gj(a,a);this.page=h;this.b.load(this.url).then(function(d){var k=f.b.f[d.url],l=Mp(k,c,1E5,e);b=new Lo(b.window,l.fontSize,b.root,l.width,l.height);var p=new Np(k,d,f.lang,b,f.f,f.l,f.pd(d),f.j,0,f.h,f.g);f.$a=p;p.Z=f.Z;Op(p).then(function(){Up(p,h,null).then(function(){iq(f,a,2);L(g,h)})})});return K(g)};
hq.prototype.Ic=function(){if(this.page){var a=this.page;this.$a=this.page=null;v(a.P,"visibility","none");var b=a.P.parentNode;b&&b.removeChild(a.P)}};hq.prototype.Rd=function(){return!!this.page};function kq(){aq.call(this,lq(this));this.g=new Se(rj,"document");this.B=new Se(Ue,"text");this.F={};this.da={};this.w={};this.A={}}t(kq,aq);function lq(a){return function(b){return a.w[b]}}
function mq(a,b,c){var d=I("loadEPUBDoc");"/"!==b.substring(b.length-1)&&(b+="/");c&&a.B.fetch(b+"?r=list");a.g.fetch(b+"META-INF/encryption.xml");var e=b+"META-INF/container.xml";a.g.load(e,!0,"Failed to fetch EPUB container.xml from "+e).then(function(f){if(f){f=Aj(gj(gj(gj(new hj([f.b]),"container"),"rootfiles"),"rootfile"),"full-path");for(var g=0;g<f.length;g++){var h=f[g];if(h){nq(a,b,h,c).ra(d);return}}L(d,null)}else u.error("Received an empty response for EPUB container.xml "+e+". This may be caused by the server not allowing cross origin requests.")});
return K(d)}function nq(a,b,c,d){var e=b+c,f=a.F[e];if(f)return J(f);var g=I("loadOPF");a.g.load(e,void 0,void 0).then(function(c){c?a.g.load(b+"META-INF/encryption.xml",void 0,void 0).then(function(h){(d?a.B.load(b+"?r=list"):J(null)).then(function(d){f=new oq(a,b);pq(f,c,h,d,b+"?r=manifest").then(function(){a.F[e]=f;a.da[b]=f;L(g,f)})})}):u.error("Received an empty response for EPUB OPF "+e+". This may be caused by the server not allowing cross origin requests.")});return K(g)}
function qq(a,b,c){var d=I("EPUBDocStore.load");b=ia(b);(a.A[b]=$p(a,{status:200,url:b,contentType:c.contentType,responseText:null,responseXML:c,Nc:null})).ra(d);return K(d)}
kq.prototype.load=function(a){var b=ia(a);if(a=this.A[b])return a.va()?a:J(a.get());var c=I("EPUBDocStore.load");a=kq.te.load.call(this,b,!0,"Failed to fetch a source document from "+b);a.then(function(a){a?L(c,a):u.error("Received an empty response for "+b+". This may be caused by the server not allowing cross origin requests.")});return K(c)};function rq(){this.id=null;this.src="";this.h=this.f=null;this.L=-1;this.l=0;this.u=null;this.b=this.g=0;this.Mb=this.ab=null;this.j=La}
function sq(a){return a.id}function tq(a){var b=fq(a);return function(a){var c=I("deobfuscator"),e,f;a.slice?(e=a.slice(0,1040),f=a.slice(1040,a.size)):(e=a.webkitSlice(0,1040),f=a.webkitSlice(1040,a.size-1040));Re(e).then(function(a){a=new DataView(a);for(var d=0;d<a.byteLength;d++){var e=a.getUint8(d),e=e^b[d%20];a.setUint8(d,e)}L(c,Qe([a,f]))});return K(c)}}
var uq={dcterms:"http://purl.org/dc/terms/",marc:"http://id.loc.gov/vocabulary/",media:"http://www.idpf.org/epub/vocab/overlays/#",onix:"http://www.editeur.org/ONIX/book/codelists/current.html#",xsd:"http://www.w3.org/2001/XMLSchema#"},vq=uq.dcterms+"language",wq=uq.dcterms+"title";
function xq(a,b){var c={};return function(d,e){var f,g,h=d.r||c,l=e.r||c;if(a==wq&&(f="main"==h["http://idpf.org/epub/vocab/package/#title-type"],g="main"==l["http://idpf.org/epub/vocab/package/#title-type"],f!=g))return f?-1:1;f=parseInt(h["http://idpf.org/epub/vocab/package/#display-seq"],10);isNaN(f)&&(f=Number.MAX_VALUE);g=parseInt(l["http://idpf.org/epub/vocab/package/#display-seq"],10);isNaN(g)&&(g=Number.MAX_VALUE);return f!=g?f-g:a!=vq&&b&&(f=(h[vq]||h["http://idpf.org/epub/vocab/package/#alternate-script"])==
b,g=(l[vq]||l["http://idpf.org/epub/vocab/package/#alternate-script"])==b,f!=g)?f?-1:1:d.o-e.o}}
function yq(a,b){function c(a){for(var b in a){var d=a[b];d.sort(xq(b,k));for(var e=0;e<d.length;e++){var f=d[e].r;f&&c(f)}}}function d(a){return Pa(a,function(a){return Oa(a,function(a){var b={v:a.value,o:a.order};a.qf&&(b.s=a.scheme);if(a.id||a.lang){var c=l[a.id];if(c||a.lang)a.lang&&(a={name:vq,value:a.lang,lang:null,id:null,yd:a.id,scheme:null,order:a.order},c?c.push(a):c=[a]),c=Na(c,function(a){return a.name}),b.r=d(c)}return b})})}function e(a){if(a&&(a=a.match(/^\s*(([^:]*):)?(\S+)\s*$/))){var b=
a[1]?f[a[1]]:"http://idpf.org/epub/vocab/package/#";if(b)return b+a[3]}return null}var f;if(b){f={};for(var g in uq)f[g]=uq[g];for(;g=b.match(/(^\s*[A-Z_a-z\u007F-\uFFFF][-.A-Z_a-z0-9\u007F-\uFFFF]*):\s*(\S+)/);)b=b.substr(g[0].length),f[g[1]]=g[2]}else f=uq;var h=1;g=yj(zj(a),function(a){if("meta"==a.localName){var b=e(a.getAttribute("property"));if(b)return{name:b,value:a.textContent,id:a.getAttribute("id"),order:h++,yd:a.getAttribute("refines"),lang:null,scheme:e(a.getAttribute("scheme"))}}else if("http://purl.org/dc/elements/1.1/"==
a.namespaceURI)return{name:uq.dcterms+a.localName,order:h++,lang:a.getAttribute("xml:lang"),value:a.textContent,id:a.getAttribute("id"),yd:null,scheme:null};return null});var l=Na(g,function(a){return a.yd});g=d(Na(g,function(a){return a.yd?null:a.name}));var k=null;g[vq]&&(k=g[vq][0].v);c(g);return g}function zq(){var a=window.MathJax;return a?a.Hub:null}var Aq={"appliaction/xhtml+xml":!0,"image/jpeg":!0,"image/png":!0,"image/svg+xml":!0,"image/gif":!0,"audio/mp3":!0};
function oq(a,b){this.h=a;this.l=this.f=this.b=this.j=this.g=null;this.A=b;this.w=null;this.M={};this.lang=null;this.B=0;this.I={};this.T=this.J=this.V=null;this.F={};this.G=null;this.u=Bq(this);zq()&&(ah["http://www.w3.org/1998/Math/MathML"]=!0)}
function Bq(a){function b(){}b.prototype.Cd=function(a,b){return"viv-id-"+na(b+(a?"#"+a:""),":")};b.prototype.xc=function(b,d){var c=b.match(/^([^#]*)#?(.*)$/);if(c){var f=c[1]||d,c=c[2];if(f&&a.j.some(function(a){return a.src===f}))return"#"+this.Cd(c,f)}return b};b.prototype.Le=function(a){"#"===a.charAt(0)&&(a=a.substring(1));a.indexOf("viv-id-")||(a=a.substring(7));return(a=Fa(a).match(/^([^#]*)#?(.*)$/))?[a[1],a[2]]:[]};return new b}
function Cq(a,b){return a.A?b.substr(0,a.A.length)==a.A?decodeURI(b.substr(a.A.length)):null:b}
function pq(a,b,c,d,e){a.g=b;var f=gj(new hj([b.b]),"package"),g=Aj(f,"unique-identifier")[0];g&&(g=nj(b,b.url+"#"+g))&&(a.w=g.textContent.replace(/[ \n\r\t]/g,""));var h={};a.j=Oa(gj(gj(f,"manifest"),"item").b,function(c){var d=new rq,e=b.url;d.id=c.getAttribute("id");d.src=ka(c.getAttribute("href"),e);d.f=c.getAttribute("media-type");if(e=c.getAttribute("properties")){for(var e=e.split(/\s+/),f={},g=0;g<e.length;g++)f[e[g]]=!0;d.j=f}(c=c.getAttribute("fallback"))&&!Aq[d.f]&&(h[d.src]=c);!a.J&&d.j.nav&&
(a.J=d);!a.T&&d.j["cover-image"]&&(a.T=d);return d});a.f=Ja(a.j,sq);a.l=Ja(a.j,function(b){return Cq(a,b.src)});for(var l in h)for(g=l;;){g=a.f[h[g]];if(!g)break;if(Aq[g.f]){a.F[l]=g.src;break}g=g.src}a.b=Oa(gj(gj(f,"spine"),"itemref").b,function(b,c){var d=b.getAttribute("idref");if(d=a.f[d])d.h=b,d.L=c;return d});if(l=Aj(gj(f,"spine"),"toc")[0])a.V=a.f[l];if(l=Aj(gj(f,"spine"),"page-progression-direction")[0]){a:switch(l){case "ltr":l="ltr";break a;case "rtl":l="rtl";break a;default:throw Error("unknown PageProgression: "+
l);}a.G=l}var g=c?Aj(gj(gj(wj(gj(gj(new hj([c.b]),"encryption"),"EncryptedData"),vj()),"CipherData"),"CipherReference"),"URI"):[],k=gj(gj(f,"bindings"),"mediaType").b;for(c=0;c<k.length;c++){var m=k[c].getAttribute("handler");(l=k[c].getAttribute("media-type"))&&m&&a.f[m]&&(a.M[l]=a.f[m].src)}a.I=yq(gj(f,"metadata"),Aj(f,"prefix")[0]);a.I[vq]&&(a.lang=a.I[vq][0].v);if(!d){if(0<g.length&&a.w)for(d=tq(a.w),c=0;c<g.length;c++)a.h.w[a.A+g[c]]=d;return J(!0)}f=new za;k={};if(0<g.length&&a.w)for(l="1040:"+
gq(a.w),c=0;c<g.length;c++)k[g[c]]=l;for(c=0;c<d.length;c++){var p=d[c];if(m=p.n){var q=decodeURI(m),g=a.l[q];l=null;g&&(g.u=0!=p.m,g.l=p.c,g.f&&(l=g.f.replace(/\s+/g,"")));g=k[q];if(l||g)f.append(m),f.append(" "),f.append(l||"application/octet-stream"),g&&(f.append(" "),f.append(g)),f.append("\n")}}Dq(a);return Pe(e,"","POST",f.toString(),"text/plain")}function Dq(a){for(var b=0,c=0;c<a.b.length;c++){var d=a.b[c],e=Math.ceil(d.l/1024);d.g=b;d.b=e;b+=e}a.B=b}
function Eq(a,b,c){a.f={};a.l={};a.j=[];a.b=a.j;var d=a.g=new fj(null,"",(new DOMParser).parseFromString("<spine></spine>","text/xml"));b.forEach(function(a){var b=new rq;b.L=a.index;b.id="item"+(a.index+1);b.src=a.url;b.ab=a.ab;b.Mb=a.Mb;var c=d.b.createElement("itemref");c.setAttribute("idref",b.id);d.root.appendChild(c);b.h=c;this.f[b.id]=b;this.l[a.url]=b;this.j.push(b)},a);return c?qq(a.h,b[0].url,c):J(null)}
function Fq(a,b,c){var d=a.b[b],e=I("getCFI");a.h.load(d.src).then(function(a){var b=lj(a,c),f=null;b&&(a=jj(a,b,0,!1),f=new bb,eb(f,b,c-a),d.h&&eb(f,d.h,0),f=f.toString());L(e,f)});return K(e)}
function Gq(a,b){return Jd("resolveFragment",function(c){if(b){var d=new bb;cb(d,b);var e;if(a.g){var f=db(d,a.g.b);if(1!=f.node.nodeType||f.K||!f.qc){L(c,null);return}var g=f.node,h=g.getAttribute("idref");if("itemref"!=g.localName||!h||!a.f[h]){L(c,null);return}e=a.f[h];d=f.qc}else e=a.b[0];a.h.load(e.src).then(function(a){var b=db(d,a.b);a=jj(a,b.node,b.offset,b.K);L(c,{L:e.L,Da:a,X:-1})})}else L(c,null)},function(a,d){u.b(d,"Cannot resolve fragment:",b);L(a,null)})}
function Hq(a,b){return Jd("resolveEPage",function(c){if(0>=b)L(c,{L:0,Da:0,X:-1});else{var d=Ha(a.b.length,function(c){c=a.b[c];return c.g+c.b>b}),e=a.b[d];a.h.load(e.src).then(function(a){b-=e.g;b>e.b&&(b=e.b);var f=0;0<b&&(a=kj(a),f=Math.round(a*b/e.b),f==a&&f--);L(c,{L:d,Da:f,X:-1})})}},function(a,d){u.b(d,"Cannot resolve epage:",b);L(a,null)})}
function Iq(a,b){var c=a.b[b.L];if(0>=b.Da)return J(c.g);var d=I("getEPage");a.h.load(c.src).then(function(a){a=kj(a);L(d,c.g+Math.min(a,b.Da)*c.b/a)});return K(d)}function Jq(a,b){return{page:a,position:{L:a.L,X:b,Da:a.offset}}}function Kq(a,b,c,d,e){this.b=a;this.viewport=b;this.j=c;this.u=e;this.Nb=[];this.l=[];this.Z=gb(d);this.h=new Jo(b);this.f=new Sm(a.u)}function Lq(a,b){var c=a.Nb[b.L];return c?c.gb[b.X]:null}n=Kq.prototype;
n.vb=function(a){return this.b.G?this.b.G:(a=this.Nb[a?a.L:0])?a.$a.da:null};function Mq(a,b,c,d){c.P.style.display="none";c.P.style.visibility="visible";c.P.style.position="";c.P.style.top="";c.P.style.left="";c.P.setAttribute("data-vivliostyle-page-side",c.l);var e=b.gb[d];c.F=!b.item.L&&!d;b.gb[d]=c;e?(b.$a.viewport.f.replaceChild(c.P,e.P),Ra(e,{type:"replaced",target:null,currentTarget:null,oe:c})):b.$a.viewport.f.appendChild(c.P);a.u(b.$a.sa,b.item.L,d)}
function Nq(a,b,c){var d=I("renderSinglePage"),e=Oq(a,b,c);Up(b.$a,e,c).then(function(f){var g=(c=f)?c.page-1:b.La.length-1;Mq(a,b,e,g);Wm(a.f,e.L,g);f=null;if(c){var h=b.La[c.page];b.La[c.page]=c;h&&b.gb[c.page]&&(ok(c,h)||(f=Nq(a,b,c)))}f||(f=J(!0));f.then(function(){var b=Xm(a.f,e),f=0;ae(function(c){f++;if(f>b.length)O(c);else{var d=b[f-1];d.Mc=d.Mc.filter(function(a){return!a.rc});d.Mc.length?Pq(a,d.L).then(function(b){b?(Vm(a.f,d.ud),Ym(a.f,d.Mc),Nq(a,b,b.La[d.X]).then(function(b){var d=a.f;
d.b=d.B.pop();d=a.f;d.g=d.G.pop();d=b.lc.position;d.L===e.L&&d.X===g&&(e=b.lc.page);M(c)})):M(c)}):M(c)}}).then(function(){L(d,{lc:Jq(e,g),pe:c})})})});return K(d)}function Qq(a,b){var c=a.X,d=-1;0>c&&(d=a.Da,c=Ha(b.La.length,function(a){return Qp(b.$a,b.La[a],!0)>d}),c=c===b.La.length?b.complete?b.La.length-1:Number.POSITIVE_INFINITY:c-1);return{L:a.L,X:c,Da:d}}
function Rq(a,b,c){var d=I("findPage");Pq(a,b.L).then(function(e){if(e){var f=null,g;ae(function(d){var h=Qq(b,e);g=h.X;(f=e.gb[g])?O(d):e.complete?(g=e.La.length-1,f=e.gb[g],O(d)):c?Sq(a,h).then(function(a){a&&(f=a.page);O(d)}):Zd(100).then(function(){M(d)})}).then(function(){L(d,Jq(f,g))})}else L(d,null)});return K(d)}
function Sq(a,b){var c=I("renderPage");Pq(a,b.L).then(function(d){if(d){var e=Qq(b,d),f=e.X,g=e.Da,h=d.gb[f];h?L(c,Jq(h,f)):ae(function(b){if(f<d.La.length)O(b);else if(d.complete)f=d.La.length-1,O(b);else{var c=d.La[d.La.length-1];Nq(a,d,c).then(function(e){var k=e.lc.page;(c=e.pe)?0<=g&&Qp(d.$a,c)>g?(h=k,f=d.La.length-2,O(b)):M(b):(h=k,f=e.lc.position.X,d.complete=!0,k.w=d.item.L===a.b.b.length-1,O(b))})}}).then(function(){h=h||d.gb[f];var b=d.La[f];h?L(c,Jq(h,f)):Nq(a,d,b).then(function(b){b.pe||
(d.complete=!0,b.lc.page.w=d.item.L===a.b.b.length-1);L(c,b.lc)})})}else L(c,null)});return K(c)}n.zd=function(){return Tq(this,{L:this.b.b.length-1,X:Number.POSITIVE_INFINITY,Da:-1})};function Tq(a,b){var c=I("renderAllPages");b||(b={L:0,X:0,Da:0});var d=b.L,e=b.X,f=0,g;ae(function(c){Sq(a,{L:f,X:f===d?e:Number.POSITIVE_INFINITY,Da:f===d?b.Da:-1}).then(function(a){g=a;++f>d?O(c):M(c)})}).then(function(){L(c,g)});return K(c)}n.ze=function(){return Rq(this,{L:0,X:0,Da:-1})};
n.Be=function(){return Rq(this,{L:this.b.b.length-1,X:Number.POSITIVE_INFINITY,Da:-1})};n.nextPage=function(a,b){var c=this,d=a.L,e=a.X,f=I("nextPage");Pq(c,d).then(function(a){if(a){if(a.complete&&e==a.La.length-1){if(d>=c.b.b.length-1){L(f,null);return}d++;e=0}else e++;Rq(c,{L:d,X:e,Da:-1},b).ra(f)}else L(f,null)});return K(f)};n.xd=function(a){var b=a.L;if(a=a.X)a--;else{if(!b)return J(null);b--;a=Number.POSITIVE_INFINITY}return Rq(this,{L:b,X:a,Da:-1})};
function Uq(a,b,c){b="left"===b.l;a="ltr"===a.vb(c);return!b&&a||b&&!a}function Vq(a,b,c){var d=I("getCurrentSpread"),e=Lq(a,b);if(!e)return J({left:null,right:null});var f="left"===e.l;(Uq(a,e,b)?a.xd(b):a.nextPage(b,c)).then(function(a){a=a&&a.page;f?L(d,{left:e,right:a}):L(d,{left:a,right:e})});return K(d)}n.Ge=function(a,b){var c=Lq(this,a);if(!c)return J(null);var c=Uq(this,c,a),d=this.nextPage(a,!!b);if(c)return d;var e=this;return d.za(function(a){return a?e.nextPage(a.position,!!b):J(null)})};
n.Je=function(a){var b=Lq(this,a);if(!b)return J(null);b=Uq(this,b,a);a=this.xd(a);if(b){var c=this;return a.za(function(a){return a?c.xd(a.position):J(null)})}return a};function Wq(a,b){var c=I("navigateToEPage");Hq(a.b,b).then(function(b){b?Rq(a,b).ra(c):L(c,null)});return K(c)}function Xq(a,b){var c=I("navigateToCFI");Gq(a.b,b).then(function(b){b?Rq(a,b).ra(c):L(c,null)});return K(c)}
function Yq(a,b,c){u.debug("Navigate to",b);var d=Cq(a.b,ia(b));if(!d){if(a.b.g&&b.match(/^#epubcfi\(/))d=Cq(a.b,a.b.g.url);else if("#"===b.charAt(0)){var e=a.b.u.Le(b);a.b.g?d=Cq(a.b,e[0]):d=e[0];b=d+(e[1]?"#"+e[1]:"")}if(null==d)return J(null)}var f=a.b.l[d];if(!f)return a.b.g&&d==Cq(a.b,a.b.g.url)&&(d=b.indexOf("#"),0<=d)?Xq(a,b.substr(d+1)):J(null);var g=I("navigateTo");Pq(a,f.L).then(function(d){var e=nj(d.ca,b);e?Rq(a,{L:f.L,X:-1,Da:ij(d.ca,e)}).ra(g):c.L!==f.L?Rq(a,{L:f.L,X:0,Da:-1}).ra(g):
L(g,null)});return K(g)}
function Oq(a,b,c){var d=b.$a.viewport,e=d.b.createElement("div");e.setAttribute("data-vivliostyle-page-container",!0);e.style.position="absolute";e.style.top="0";e.style.left="0";bj||(e.style.visibility="hidden");d.h.appendChild(e);var f=d.b.createElement("div");f.setAttribute("data-vivliostyle-bleed-box",!0);e.appendChild(f);var g=new Gj(e,f);g.L=b.item.L;g.position=c;g.offset=Qp(b.$a,c);g.offset||(b=a.b.u.Cd("",b.item.src),f.setAttribute("id",b),Jj(g,f,b));d!==a.viewport&&(a=Ff(null,new Me(lb(a.viewport.width,
a.viewport.height,d.width,d.height),null)),g.u.push(new Dj(e,"transform",a)));return g}function Zq(a,b){var c=zq();if(c){var d=b.ownerDocument,e=d.createElement("span");b.appendChild(e);d=d.importNode(a,!0);e.appendChild(d);d=c.queue;d.Push(["Typeset",c,e]);var c=I("makeMathJaxView"),f=Td(c);d.Push(function(){f.Va(e)});return K(c)}return J(null)}
n.pd=function(a){var b=this;return function(c,d){var e;if("object"==c.localName&&"http://www.w3.org/1999/xhtml"==c.namespaceURI){var f=c.getAttribute("data");e=null;if(f){var f=ka(f,a.url),g=c.getAttribute("media-type");if(!g){var h=Cq(b.b,f);h&&(h=b.b.l[h])&&(g=h.f)}if(g&&(h=b.b.M[g])){e=b.viewport.b.createElement("iframe");e.style.border="none";var f=Da(f),l=Da(g),g=new za;g.append(h);g.append("?src=");g.append(f);g.append("&type=");g.append(l);for(h=c.firstChild;h;h=h.nextSibling)1==h.nodeType&&
(l=h,"param"==l.localName&&"http://www.w3.org/1999/xhtml"==l.namespaceURI&&(f=l.getAttribute("name"),l=l.getAttribute("value"),f&&l&&(g.append("&"),g.append(encodeURIComponent(f)),g.append("="),g.append(encodeURIComponent(l)))));e.setAttribute("src",g.toString());(g=c.getAttribute("width"))&&e.setAttribute("width",g);(g=c.getAttribute("height"))&&e.setAttribute("height",g)}}e||(e=b.viewport.b.createElement("span"),e.setAttribute("data-adapt-process-children","true"));e=J(e)}else if("http://www.w3.org/1998/Math/MathML"==
c.namespaceURI)e=Zq(c,d);else if("http://example.com/sse"==c.namespaceURI){e=d?d.ownerDocument:b.viewport.b;g=c.localName;switch(g){case "t":case "tab":case "ec":case "nt":case "fraction":case "comment":case "mark":g="span";break;case "ruby":case "rp":case "rt":break;default:g="div"}e=e.createElement(g);e.setAttribute("data-adapt-process-children","true");e=J(e)}else e=c.dataset&&"true"==c.dataset.mathTypeset?Zq(c,d):J(null);return e}};
function Pq(a,b){if(b>=a.b.b.length)return J(null);var c=a.Nb[b];if(c)return J(c);var d=I("getPageViewItem"),e=a.l[b];if(e){var f=Td(d);e.push(f);return K(d)}var e=a.l[b]=[],g=a.b.b[b],h=a.b.h;h.load(g.src).then(function(f){g.b||1!=a.b.b.length||(g.b=Math.ceil(kj(f)/2700),a.b.B=g.b);var k=h.f[f.url],l=a.pd(f),p=a.viewport,q=Mp(k,p.width,p.height,p.fontSize);if(q.width!=p.width||q.height!=p.height||q.fontSize!=p.fontSize)p=new Lo(p.window,q.fontSize,p.root,q.width,q.height);q=a.Nb[b-1];null!==g.ab?
q=g.ab-1:(q=q?q.$a.pa+q.gb.length:0,null!==g.Mb&&(q+=g.Mb));Tm(a.f,q);var w=new Np(k,f,a.b.lang,p,a.h,a.j,l,a.b.F,q,a.b.u,a.f);w.Z=a.Z;Op(w).then(function(){c={item:g,ca:f,$a:w,La:[null],gb:[],complete:!1};a.Nb[b]=c;L(d,c);e.forEach(function(a){a.Va(c)})})});return K(d)}function $q(a){return a.Nb.some(function(a){return a&&0<a.gb.length})}
n.Oc=function(){var a=this.b,b=a.J||a.V;if(!b)return J(null);var c=I("showTOC");this.g||(this.g=new hq(a.h,b.src,a.lang,this.h,this.j,this.Z,this,a.F,a.u,this.f));var a=this.viewport,b=Math.min(350,Math.round(.67*a.width)-16),d=a.height-6,e=a.b.createElement("div");a.root.appendChild(e);e.style.position="absolute";e.style.visibility="hidden";e.style.left="3px";e.style.top="3px";e.style.width=b+10+"px";e.style.maxHeight=d+"px";e.style.overflow="scroll";e.style.overflowX="hidden";e.style.background=
"#EEE";e.style.border="1px outset #999";e.style.borderRadius="2px";e.style.boxShadow=" 5px 5px rgba(128,128,128,0.3)";this.g.Oc(e,a,b,d,this.viewport.fontSize).then(function(a){e.style.visibility="visible";L(c,a)});return K(c)};n.Ic=function(){this.g&&this.g.Ic()};n.Rd=function(){return this.g&&this.g.Rd()};var ar={cf:"singlePage",df:"spread",Te:"autoSpread"};
function br(a,b,c,d){var e=this;this.window=a;this.Xc=b;b.setAttribute("data-vivliostyle-viewer-viewport",!0);bj&&b.setAttribute("data-vivliostyle-debug",!0);b.setAttribute("data-vivliostyle-viewer-status","loading");this.Xa=c;this.Wa=d;a=a.document;this.ta=new nl(a.head,b);this.B="loading";this.T=[];this.j=null;this.u=this.f=!1;this.g=this.l=this.h=this.F=null;this.fontSize=16;this.zoom=1;this.G=!1;this.da="autoSpread";this.pa=!1;this.zd=!0;this.Z=fb();this.M=function(){};this.A=function(){};this.ka=
function(){e.f=!0;e.M()};this.vd=this.vd.bind(this);this.I=function(){};this.J=a.getElementById("vivliostyle-page-rules");this.V=!1;this.w=null;this.sa={loadEPUB:this.we,loadXML:this.xe,configure:this.Id,moveTo:this.Qa,toc:this.Oc};cr(this)}function cr(a){ha(1,function(a){dr(this,{t:"debug",content:a})}.bind(a));ha(2,function(a){dr(this,{t:"info",content:a})}.bind(a));ha(3,function(a){dr(this,{t:"warn",content:a})}.bind(a));ha(4,function(a){dr(this,{t:"error",content:a})}.bind(a))}
function dr(a,b){b.i=a.Xa;a.Wa(b)}function er(a,b){a.B!==b&&(a.B=b,a.Xc.setAttribute("data-vivliostyle-viewer-status",b),dr(a,{t:"readystatechange"}))}n=br.prototype;
n.we=function(a){fr.f("beforeRender");er(this,"loading");var b=a.url,c=a.fragment,d=!!a.zipmeta,e=a.authorStyleSheet,f=a.userStyleSheet;this.viewport=null;var g=I("loadEPUB"),h=this;h.Id(a).then(function(){var a=new kq;bq(a,e,f).then(function(){var e=ka(b,h.window.location.href);h.T=[e];mq(a,e,d).then(function(a){h.j=a;gr(h,c).then(function(){L(g,!0)})})})});return K(g)};
n.xe=function(a){fr.f("beforeRender");er(this,"loading");var b=a.url,c=a.document,d=a.fragment,e=a.authorStyleSheet,f=a.userStyleSheet;this.viewport=null;var g=I("loadXML"),h=this;h.Id(a).then(function(){var a=new kq;bq(a,e,f).then(function(){var e=b.map(function(a,b){return{url:ka(a.url,h.window.location.href),index:b,ab:a.ab,Mb:a.Mb}});h.T=e.map(function(a){return a.url});h.j=new oq(a,"");Eq(h.j,e,c).then(function(){gr(h,d).then(function(){L(g,!0)})})})});return K(g)};
function gr(a,b){hr(a);var c;b?c=Gq(a.j,b).za(function(b){a.g=b;return J(!0)}):c=J(!0);return c.za(function(){fr.b("beforeRender");return ir(a)})}function jr(a,b){var c=parseFloat(b),d=/[a-z]+$/,e;if("string"===typeof b&&(e=b.match(d))){d=e[0];if("em"===d||"rem"===d)return c*a.fontSize;if("ex"===d||"rex"===d)return c*wb.ex*a.fontSize/wb.em;if(d=wb[d])return c*d}return c}
n.Id=function(a){"boolean"==typeof a.autoresize&&(a.autoresize?(this.F=null,this.window.addEventListener("resize",this.ka,!1),this.f=!0):this.window.removeEventListener("resize",this.ka,!1));if("number"==typeof a.fontSize){var b=a.fontSize;5<=b&&72>=b&&this.fontSize!=b&&(this.fontSize=b,this.f=!0)}"object"==typeof a.viewport&&a.viewport&&(b=a.viewport,b={marginLeft:jr(this,b["margin-left"])||0,marginRight:jr(this,b["margin-right"])||0,marginTop:jr(this,b["margin-top"])||0,marginBottom:jr(this,b["margin-bottom"])||
0,width:jr(this,b.width)||0,height:jr(this,b.height)||0},200<=b.width||200<=b.height)&&(this.window.removeEventListener("resize",this.ka,!1),this.F=b,this.f=!0);"boolean"==typeof a.hyphenate&&(this.Z.kd=a.hyphenate,this.f=!0);"boolean"==typeof a.horizontal&&(this.Z.jd=a.horizontal,this.f=!0);"boolean"==typeof a.nightMode&&(this.Z.qd=a.nightMode,this.f=!0);"number"==typeof a.lineHeight&&(this.Z.lineHeight=a.lineHeight,this.f=!0);"number"==typeof a.columnWidth&&(this.Z.ed=a.columnWidth,this.f=!0);"string"==
typeof a.fontFamily&&(this.Z.fontFamily=a.fontFamily,this.f=!0);"boolean"==typeof a.load&&(this.pa=a.load);"boolean"==typeof a.renderAllPages&&(this.zd=a.renderAllPages);"string"==typeof a.userAgentRootURL&&(ja=a.userAgentRootURL);"string"==typeof a.pageViewMode&&a.pageViewMode!==this.da&&(this.da=a.pageViewMode,this.f=!0);"number"==typeof a.pageBorder&&a.pageBorder!==this.Z.Xb&&(this.viewport=null,this.Z.Xb=a.pageBorder,this.f=!0);"number"==typeof a.zoom&&a.zoom!==this.zoom&&(this.zoom=a.zoom,this.u=
!0);"boolean"==typeof a.fitToScreen&&a.fitToScreen!==this.G&&(this.G=a.fitToScreen,this.u=!0);return J(!0)};n.vd=function(a){var b=this.h,c=this.l,d=a.target;c?c.left!==d&&c.right!==d||kr(this,a.oe):b===a.target&&kr(this,a.oe)};function lr(a,b){var c=[];a.h&&c.push(a.h);a.l&&(c.push(a.l.left),c.push(a.l.right));c.forEach(function(a){a&&b(a)})}function mr(a){lr(a,function(a){a.removeEventListener("hyperlink",this.I,!1);a.removeEventListener("replaced",this.vd,!1)}.bind(a))}
function nr(a){mr(a);lr(a,function(a){v(a.P,"display","none")});a.h=null;a.l=null}function or(a,b){b.addEventListener("hyperlink",a.I,!1);b.addEventListener("replaced",a.vd,!1);v(b.P,"visibility","visible");v(b.P,"display","block")}function pr(a,b){nr(a);a.h=b;or(a,b)}function qr(a){var b=I("reportPosition");Fq(a.j,a.g.L,a.g.Da).then(function(c){var d=a.h;(a.pa&&0<d.j.length?ee(d.j):J(!0)).then(function(){rr(a,d,c).ra(b)})});return K(b)}
function sr(a){var b=a.Xc;if(a.F){var c=a.F;b.style.marginLeft=c.marginLeft+"px";b.style.marginRight=c.marginRight+"px";b.style.marginTop=c.marginTop+"px";b.style.marginBottom=c.marginBottom+"px";return new Lo(a.window,a.fontSize,b,c.width,c.height)}return new Lo(a.window,a.fontSize,b)}
function tr(a){var b=sr(a),c;a:switch(a.da){case "singlePage":c=!1;break a;case "spread":c=!0;break a;default:c=1.45<=b.width/b.height&&800<b.width}var d=a.Z.ib!==c;a.Z.ib=c;a.Xc.setAttribute("data-vivliostyle-spread-view",c);if(a.F||!a.viewport||a.viewport.fontSize!=a.fontSize)return!1;if(!d&&b.width==a.viewport.width&&b.height==a.viewport.height)return!0;if(d=a.b&&$q(a.b)){a:{d=a.b.Nb;for(c=0;c<d.length;c++){var e=d[c];if(e)for(var e=e.gb,f=0;f<e.length;f++){var g=e[f];if(g.B&&g.A){d=!0;break a}}}d=
!1}d=!d}return d?(a.viewport.width=b.width,a.viewport.height=b.height,a.u=!0):!1}n.Me=function(a,b,c){if(!this.V&&this.J&&!b&&!c){var d="";Object.keys(a).forEach(function(b){d+="@page "+b+"{size:";b=a[b];d+=b.width+"px "+b.height+"px;}"});this.J.textContent=d;this.V=!0}};
function ur(a){if(a.b){a.b.Ic();for(var b=a.b,c=b.Nb,d=0;d<c.length;d++){var e=c[d];e&&e.gb.splice(0)}for(b=b.viewport.root;b.lastChild;)b.removeChild(b.lastChild)}a.J&&(a.J.textContent="",a.V=!1);a.viewport=sr(a);b=a.viewport;v(b.g,"width","");v(b.g,"height","");v(b.f,"width","");v(b.f,"height","");v(b.f,"transform","");a.b=new Kq(a.j,a.viewport,a.ta,a.Z,a.Me.bind(a))}
function kr(a,b,c){a.u=!1;mr(a);if(a.Z.ib)return Vq(a.b,a.g,c).za(function(c){nr(a);a.l=c;c.left&&(or(a,c.left),c.right||c.left.P.setAttribute("data-vivliostyle-unpaired-page",!0));c.right&&(or(a,c.right),c.left||c.right.P.setAttribute("data-vivliostyle-unpaired-page",!0));c=vr(a,c);a.viewport.zoom(c.width,c.height,a.G?wr(a,c):a.zoom);a.h=b;return J(null)});pr(a,b);a.viewport.zoom(b.f.width,b.f.height,a.G?wr(a,b.f):a.zoom);a.h=b;return J(null)}
function vr(a,b){var c=0,d=0;b.left&&(c+=b.left.f.width,d=b.left.f.height);b.right&&(c+=b.right.f.width,d=Math.max(d,b.right.f.height));b.left&&b.right&&(c+=2*a.Z.Xb);return{width:c,height:d}}var xr={Ye:"fit inside viewport"};function wr(a,b){return Math.min(a.viewport.width/b.width,a.viewport.height/b.height)}function yr(){this.name="RenderingCanceledError";this.message="Page rendering has been canceled";this.stack=Error().stack}t(yr,Error);
function hr(a){if(a.w){var b=a.w;Kd(b,new yr);if(b!==Dd&&b.b){b.b.h=!0;var c=new Ud(b);b.u="interrupt";b.b=c;b.f.Va(c)}}a.w=null}
function ir(a){a.f=!1;a.u=!1;if(tr(a))return J(!0);er(a,"loading");hr(a);var b=Md(Dd.f,function(){return Jd("resize",function(c){a.w=b;fr.f("render (resize)");ur(a);a.g&&(a.g.X=-1);Tq(a.b,a.g).then(function(d){a.g=d.position;kr(a,d.page,!0).then(function(){qr(a).then(function(d){er(a,"interactive");(a.zd?a.b.zd():J(null)).then(function(){a.w===b&&(a.w=null);fr.b("render (resize)");er(a,"complete");dr(a,{t:"loaded"});L(c,d)})})})})},function(a,b){if(b instanceof yr)fr.b("render (resize)"),u.debug(b.message);
else throw b;})});return J(!0)}function rr(a,b,c){var d=I("sendLocationNotification"),e={t:"nav",first:b.F,last:b.w};Iq(a.j,a.g).then(function(b){e.epage=b;e.epageCount=a.j.B;c&&(e.cfi=c);dr(a,e);L(d,!0)});return K(d)}br.prototype.vb=function(){return this.b?this.b.vb(this.g):null};
br.prototype.Qa=function(a){var b=this;"complete"!==this.B&&er(this,"loading");if("string"==typeof a.where){switch(a.where){case "next":a=this.Z.ib?this.b.Ge:this.b.nextPage;break;case "previous":a=this.Z.ib?this.b.Je:this.b.xd;break;case "last":a=this.b.Be;break;case "first":a=this.b.ze;break;default:return J(!0)}if(a){var c=a;a=function(){return c.call(b.b,b.g)}}}else if("number"==typeof a.epage){var d=a.epage;a=function(){return Wq(b.b,d)}}else if("string"==typeof a.url){var e=a.url;a=function(){return Yq(b.b,
e,b.g)}}else return J(!0);var f=I("moveTo");a.call(b.b).then(function(a){var c;if(a){b.g=a.position;var d=I("moveTo.showCurrent");c=K(d);kr(b,a.page).then(function(){qr(b).ra(d)})}else c=J(!0);c.then(function(a){"loading"===b.B&&er(b,"interactive");L(f,a)})});return K(f)};
br.prototype.Oc=function(a){var b=!!a.autohide;a=a.v;var c=this.b.Rd();if(c){if("show"==a)return J(!0)}else if("hide"==a)return J(!0);if(c)return this.b.Ic(),J(!0);var d=this,e=I("showTOC");this.b.Oc(b).then(function(a){if(a){if(b){var c=function(){d.b.Ic()};a.addEventListener("hyperlink",c,!1);a.P.addEventListener("click",c,!1)}a.addEventListener("hyperlink",d.I,!1)}L(e,!0)});return K(e)};
function zr(a,b){var c=b.a||"";return Jd("runCommand",function(d){var e=a.sa[c];e?e.call(a,b).then(function(){dr(a,{t:"done",a:c});L(d,!0)}):(u.error("No such action:",c),L(d,!0))},function(a,b){u.error(b,"Error during action:",c);L(a,!0)})}function Ar(a){return"string"==typeof a?JSON.parse(a):a}
function Br(a,b){var c=Ar(b),d=null;Ld(function(){var b=I("commandLoop"),f=Dd.f;a.I=function(b){var c="#"===b.href.charAt(0)||a.T.some(function(a){return b.href.substr(0,a.length)==a});if(c){b.preventDefault();var d={t:"hyperlink",href:b.href,internal:c};Md(f,function(){dr(a,d);return J(!0)})}};ae(function(b){if(a.f)ir(a).then(function(){M(b)});else if(a.u)a.h&&kr(a,a.h).then(function(){M(b)});else if(c){var e=c;c=null;zr(a,e).then(function(){M(b)})}else e=I("waitForCommand"),d=Td(e,self),K(e).then(function(){M(b)})}).ra(b);
return K(b)});a.M=function(){var a=d;a&&(d=null,a.Va())};a.A=function(b){if(c)return!1;c=Ar(b);a.M();return!0};a.window.adapt_command=a.A};function Cr(){}Cr.prototype.ge=function(a){return{C:a,Cc:!1,sb:!1}};Cr.prototype.re=function(){};Cr.prototype.Vd=function(){};Cr.prototype.ec=function(){};function Dr(a,b){this.b=a;this.f=b}
function Er(a,b){var c=a.b,d=c.ge(b),e=I("LayoutIterator");ae(function(a){for(var b;d.C;){b=d.C.D?1!==d.C.D.nodeType?Nj(d.C.D,d.C.Db)?void 0:d.C.K?void 0:c.re(d):d.C.Ca?void 0:d.C.K?c.ec(d):c.Vd(d):void 0;b=(b&&b.va()?b:J(!0)).za(function(){return d.sb?J(null):Ll(this.f,d.C,d.Cc)}.bind(this));if(b.va()){b.then(function(b){d.sb?O(a):(d.C=b,M(a))});return}if(d.sb){O(a);return}d.C=b.get()}O(a)}.bind(a)).then(function(){L(e,d.C)});return K(e)}function Fr(a){this.Kc=a}t(Fr,Cr);n=Fr.prototype;n.se=function(){};
n.ae=function(){};n.ge=function(a){return{C:a,Cc:!!this.Kc&&a.K,sb:!1,Kc:this.Kc,gc:null,rd:!1,ke:[],je:null}};n.re=function(a){a.rd=!1};n.Vd=function(a){a.ke.push(Yj(a.C));a.gc=Kk(a.gc,a.C.h);a.rd=!0;return this.se(a)};n.ec=function(a){var b;a.rd?(b=(b=void 0,J(!0)),b=b.za(function(){a.sb||(a.ke=[],a.Kc=!1,a.Cc=!1,a.gc=null);return J(!0)})):b=(b=this.ae(a))&&b.va()?b:J(!0);return b.za(function(){a.sb||(a.rd=!1,a.je=Yj(a.C),a.gc=Kk(a.gc,a.C.B));return J(!0)})};
function Gr(a,b){this.f=[];this.b=Object.create(a);this.b.element=b;this.b.f=a.f.clone();this.b.u=!1;var c=this;this.b.Md=function(a){return El.prototype.Md.call(this,a).za(function(a){c.f.push(Yj(a));return J(a)})}}Gr.prototype.Kb=function(a){var b=this.b.Kb();if(a){a=b.Ec?b.Ec.b():Number.MAX_VALUE;var c=this.f[0],c=new Al(Yj(c),null,c.f,0),d=c.f(this.b,a);if(d&&c.b()<a)return{Ec:c,C:d}}return b};function Hr(a,b){this.g(a,"end",b)}function Ir(a,b){this.g(a,"start",b)}function Jr(a,b,c){c||(c=this.j.now());var d=this.h[a];d||(d=this.h[a]=[]);var e;for(a=d.length-1;0<=a&&(!(e=d[a])||e[b]);a--)e=null;e||(e={},d.push(e));e[b]=c}function Kr(){}function Lr(a){this.j=a;this.h={};this.registerEndTiming=this.b=this.registerStartTiming=this.f=this.g=Kr}
Lr.prototype.l=function(){var a=this.h,b="";Object.keys(a).forEach(function(c){for(var d=a[c],e=d.length,f=0;f<e;f++){var g=d[f];b+=c;1<e&&(b+="("+f+")");b+=" => start: "+g.start+", end: "+g.end+", duration: "+(g.end-g.start)+"\n"}});u.g(b)};Lr.prototype.u=function(){this.registerEndTiming=this.b=this.registerStartTiming=this.f=this.g=Kr};Lr.prototype.w=function(){this.g=Jr;this.registerStartTiming=this.f=Ir;this.registerEndTiming=this.b=Hr};
var Mr={now:Date.now},fr,Nr=fr=new Lr(window&&window.performance||Mr);Jr.call(Nr,"load_vivliostyle","start",void 0);ba("vivliostyle.profile.profiler",Nr);Lr.prototype.printTimings=Lr.prototype.l;Lr.prototype.disable=Lr.prototype.u;Lr.prototype.enable=Lr.prototype.w;function Or(a,b){this.rowIndex=a;this.U=b;this.b=[]}function Pr(a){return Math.min.apply(null,a.b.map(function(a){return a.height}))}function Qr(a,b,c){this.rowIndex=a;this.h=b;this.g=c;this.b=c.colSpan||1;this.rowSpan=c.rowSpan||1;this.height=0;this.f=null}function Rr(a,b,c){this.rowIndex=a;this.b=b;this.hc=c}function Sr(a,b,c){this.f=c;this.b=new Gr(a,b);this.g=!1}Sr.prototype.Kb=function(){return this.b.Kb(!0)};function Tr(a,b){this.D=a;this.b=b}
function Bm(a,b,c,d){Al.call(this,a,b,c,d);this.R=a.R;this.h=null}t(Bm,Al);Bm.prototype.f=function(a,b){var c=Al.prototype.f.call(this,a,b);return b<this.b()?null:Ur(this).every(function(a){return!!a.C})?c:null};Bm.prototype.b=function(){var a=Al.prototype.b.call(this);Ur(this).forEach(function(b){a+=b.Ec.b()});return a};function Ur(a){if(!a.h){var b=a.R,c=Vr(b,a.position.U);a.h=Wr(b,c).map(b.u,b).map(function(a){return a.Kb()})}return a.h}
function Xr(a,b,c){this.rowIndex=a;this.h=b;this.R=c;this.g=null}Xr.prototype.f=function(a,b){return b<this.b()?null:Yr(this).every(function(a){return!!a.C})?this.h:null};Xr.prototype.b=function(){var a=this.R,b=0;Zr(a,a.b[this.rowIndex])||(b+=10);Yr(this).forEach(function(a){b+=a.Ec.b()});return b};function Yr(a){if(!a.g){var b=a.R;a.g=$r(b,a.rowIndex).map(b.u,b).map(function(a){return a.Kb()})}return a.g}
function as(a){this.A=a;this.h=this.G=!1;this.l=-1;this.J=0;this.B=[];this.F=this.j=null;this.M=0;this.b=[];this.I=[];this.g=[];this.w=null;this.f=[]}function zo(a,b,c){if(!c)return c;switch(b.display){case "table-row":return!a.f.length;case "table-cell":return!a.f.some(function(a){return a.Hd.ja[0].node===b.U});default:return c}}function bs(a,b){do if(b.U===a.A)return b.D;while(b=b.parent);return null}function cs(a,b){var c=a.I[b];c||(c=a.I[b]=[]);return c}
function Vr(a,b){return a.b.findIndex(function(a){return b===a.U})}function ds(a,b,c,d){var e=a.g[b];e||(e=a.g[b]=[]);e[c]=d}function $r(a,b){return cs(a,b).reduce(function(a,b){return b.hc!==a[a.length-1]?a.concat(b.hc):a},[])}function Wr(a,b){return $r(a,b).filter(function(a){return a.rowIndex+a.rowSpan-1>b})}as.prototype.u=function(a){return this.g[a.rowIndex][a.h]};function Zr(a,b){return Pr(b)>a.J/2}
function es(a){0>a.l&&(a.l=Math.max.apply(null,a.b.map(function(a){return a.b.reduce(function(a,b){return a+b.b},0)})));return a.l}function fs(a,b){a.b.forEach(function(a){a.b.forEach(function(a){var c=Lj(b,a.g);a.g=null;a.height=this.h?c.width:c.height},this)},a)}function gs(a,b){this.R=a;this.g=b;this.rowIndex=-1;this.b=0;this.f=!1}t(gs,Cr);
gs.prototype.Vd=function(a){var b=this.R;a=a.C;switch(a.display){case "table":b.M=a.T;break;case "table-caption":b.B.push(new Tr(a.D,a.M));break;case "table-row":this.f=!0,this.rowIndex++,this.b=0,b.b[this.rowIndex]=new Or(this.rowIndex,a.U)}return J(!0)};
gs.prototype.ec=function(a){var b=this.R,c=a.C,d=c.display,e=this.g.h;if(c.U===b.A)c=Ul(e,bs(b,c)),b.J=parseFloat(c[b.h?"height":"width"]),a.sb=!0;else switch(d){case "table-row":b.w=c.D;this.f=!1;break;case "table-cell":this.f||(this.rowIndex++,this.b=0,this.f=!0);a=this.rowIndex;c=new Qr(this.rowIndex,this.b,c.D);d=b.b[a];d||(b.b[a]=new Or(a,null),d=b.b[a]);d.b.push(c);for(var d=a+c.rowSpan,e=cs(b,a),f=0;e[f];)f++;for(;a<d;a++)for(var e=cs(b,a),g=f;g<f+c.b;g++){var h=e[g]=new Rr(a,g,c);c.f||(c.f=
h)}this.b++}};function hs(a,b){this.Kc=!0;this.R=a;this.f=b;this.h=!1;this.b=-1;this.g=0;this.j=b.u;b.u=!1}t(hs,Fr);var is={"table-caption":!0,"table-column-group":!0,"table-column":!0};function js(a,b){for(var c=a.R.F,d=0,e=0;e<b.b;e++)d+=c[b.f.b+e];return d+=a.R.M*(b.b-1)}
function ks(a,b,c,d){var e=b.rowIndex,f=b.h,g=c.D,h=c.G;1<b.b&&(v(g,"box-sizing","border-box"),v(g,a.R.h?"height":"width",js(a,b)+"px"));b=g.ownerDocument.createElement("div");g.appendChild(b);c=new Sr(a.f,b,c);ds(a.R,e,f,c);1===d.Ma.ja.length&&d.Ma.K&&(c.g=!0);return cm(c.b.b,d,!0).za(function(){"baseline"!==h&&"top"!==h&&v(g,"vertical-align","top");return J(!0)})}function ls(a,b){var c=a.R.f[0];return c?c.hc.f.b===b:!1}
function ms(a){var b=a.R.f;if(!b.length)return[];var c=[],d=0;do{var e=b[d],f=e.hc.rowIndex;if(f<a.b){var g=c[f];g||(g=c[f]=[]);g.push(e);b.splice(d,1)}else d++}while(d<b.length);return c}
function ns(a,b){var c=a.R,d=ms(a),e=d.reduce(function(a){return a+1},0);if(0===e)return J(!0);var f=a.f.f,g=b.C;g.D.parentNode.removeChild(g.D);var h=I("layoutRowSpanningCellsFromPreviousFragment"),l=J(!0),k=0,m=[];d.forEach(function(a){l=l.za(function(){var b=Wj(a[0].Hd.ja[1],g.parent);return Gl(f,b,!1).za(function(){function d(a){for(;h<a;){if(!(0<=m.indexOf(h))){var c=b.D.ownerDocument.createElement("td");v(c,"padding","0");b.D.appendChild(c)}h++}}var g=J(!0),h=0;a.forEach(function(a){g=g.za(function(){var c=
a.hc;d(c.f.b);var g=a.Hd,l=Wj(g.ja[0],b);l.ia=g.ia;l.K=g.K;return Gl(f,l,!1).za(function(){for(var b=a.$d,d=0;d<c.b;d++)m.push(h+d);h+=c.b;return ks(this,c,l,b).za(function(){l.D.rowSpan=c.rowIndex+c.rowSpan-this.b+e-k;return J(!0)}.bind(this))}.bind(this))}.bind(this))},this);return g.za(function(){d(es(c));k++;return J(!0)})}.bind(this))}.bind(this))},a);l.then(function(){Gl(f,g,!0,b.Cc).then(function(){L(h,!0)})});return K(h)}
function os(a,b){var c=b.C,d=a.R;0>a.b?a.b=Vr(d,c.U):a.b++;a.g=0;a.h=!0;return ns(a,b).za(function(){Am(this.f,b.je,null,b.gc)&&!Wr(d,this.b-1).length&&(this.f.u=this.j,c.f=!0,b.sb=!0);return J(!0)}.bind(a))}
function ps(a,b){var c=b.C;a.h||(0>a.b?a.b=0:a.b++,a.g=0,a.h=!0);var d=a.R.b[a.b].b[a.g],e=Yj(c).modify();e.K=!0;b.C=e;var f=I("startTableCell");ls(a,d.f.b)?(e=a.R.f.shift(),e=J(e.$d)):e=Ll(a.f.f,c,b.Cc).za(function(a){a.D&&c.D.removeChild(a.D);return J(new ik(Uj(a)))});e.then(function(a){ks(this,d,c,a).then(function(){this.ec(b);this.g++;L(f,!0)}.bind(this))}.bind(a));return K(f)}hs.prototype.se=function(a){var b=a.C.display;return"table-row"===b?os(this,a):"table-cell"===b?ps(this,a):J(!0)};
hs.prototype.ae=function(a){a=a.C;"table-row"===a.display&&(this.h=!1,a=Yj(a).modify(),a.K=!1,this.f.I.push(new Xr(this.b,a,this.R)));return J(!0)};hs.prototype.ec=function(a){var b=a.C,c=b.display;if(c&&is[c])b.D.parentNode.removeChild(b.D);else if(b.U===this.R.A)b=a.C=b.modify(),b.R=null,this.f.u=this.j,a.sb=!0;else return Fr.prototype.ec.call(this,a);return J(!0)};
function qs(a,b,c,d){for(var e=a.ownerDocument,f=e.createElement("tr"),g=[],h=0;h<b;h++){var l=e.createElement("td");f.appendChild(l);g.push(l)}a.parentNode.insertBefore(f,a.nextSibling);b=g.map(function(a){a=Lj(d,a);return c?a.height:a.width});a.parentNode.removeChild(f);return b}function rs(a){var b=[];a=a.firstElementChild;do"colgroup"===a.localName&&b.push(a);while(a=a.nextElementSibling);return b}
function ss(a){var b=[];a.forEach(function(a){var c=a.span;a.removeAttribute("span");for(var e=a.firstElementChild;e;){if("col"===e.localName){var f=e.span;e.removeAttribute("span");for(c-=f;1<f--;){var g=e.cloneNode(!0);a.insertBefore(g,e);b.push(g)}b.push(e)}e=e.nextElementSibling}for(;0<c--;)e=a.ownerDocument.createElement("col"),a.appendChild(e),b.push(e)});return b}
function ts(a,b,c,d){if(a.length<c){var e=d.ownerDocument.createElement("colgroup");b.push(e);for(b=a.length;b<c;b++){var f=d.ownerDocument.createElement("col");e.appendChild(f);a.push(f)}}}function us(a,b,c){var d=a.h,e=a.w;if(e){a.w=null;var f=e.ownerDocument.createDocumentFragment(),g=es(a);if(0<g){var h=a.F=qs(e,g,d,c.h);c=rs(b);e=ss(c);ts(e,c,g,b);e.forEach(function(a,b){v(a,d?"height":"width",h[b]+"px")});c.forEach(function(a){f.appendChild(a.cloneNode(!0))})}a.j=f}}
function vs(a,b,c){var d=b.R;d.h=b.b;var e=I("TableLayoutProcessor.doInitialLayout");Er(new Dr(new gs(b.R,c),c.f),b).then(function(a){var b=a.D,f=Lj(c.h,b);Bl(c,c.b?f.left:f.bottom)?(us(d,b,c),fs(d,c.h),L(e,null)):(a=a.modify(),a.R=null,L(e,a))}.bind(a));return K(e)}function ws(a,b,c){var d=a.B;d.forEach(function(a,f){a&&(b.insertBefore(a.D,c),"top"===a.b&&(d[f]=null))})}
function xs(a,b){var c=a.R,d=bs(c,a),e=d.firstChild;ws(c,d,e);c.j&&d.insertBefore(c.j.cloneNode(!0),e);c=new hs(c,b);c=new Dr(c,b.f);d=I("TableFormattingContext.doLayout");Er(c,a).ra(d);return K(d)}function Fm(a,b,c){var d=b.R,e=I("TableLayoutProcessor.layout");if(d.G)xs(b,c).ra(e);else{var f=Yj(b);vs(a,b,c).then(function(a){d.G=!0;if(a)L(e,a);else{a=f.D;for(var b;b=a.lastChild;)a.removeChild(b);xs(f,c).ra(e)}}.bind(a))}return K(e)}
function um(a,b){var c=b.R;if("table-row"===b.display){var d=Vr(c,b.U);c.f=[];var e;e=b.K?Wr(c,d):$r(c,d);if(e.length){var f=I("TableLayoutProcessor.finishBreak"),g=0;ae(function(a){if(g===e.length)O(a);else{var b=e[g++],f=c.u(b),h=f.Kb().C,p=f.f,q=ek(p),w=new ik(ek(h));c.f.push({Hd:q,$d:w,hc:b});var r=p.D;wm(f.f);d<b.rowIndex+b.rowSpan-1&&(r.rowSpan=d-b.rowIndex+1);f.g?M(a):pm(f.b.b,h,!1,!0).then(function(){var b=p.G;"baseline"!==b&&"top"!==b&&v(r,"vertical-align",b);M(a)})}}).then(function(){c.g=
[];vm(b,!1);wm(b);L(f,!0)});return K(f)}}c.g=[];return null}var ys=new function(){};Cd("RESOLVE_FORMATTING_CONTEXT",function(a,b){return b?"table"===a.display?new as(a.U):null:null});Cd("RESOLVE_LAYOUT_PROCESSOR",function(a){return a instanceof as?ys:null});Array.from||(Array.from=function(a,b,c){b&&c&&(b=b.bind(c));c=[];for(var d=a.length,e=0;e<d;e++)c[e]=b?b(a[e],e):a[e];return c});
Array.prototype.findIndex||Object.defineProperty(Array.prototype,"findIndex",{value:function(a,b){if(null==this)throw new TypeError("Array.prototype.findIndex called on null or undefined");if("function"!==typeof a)throw new TypeError("predicate must be a function");for(var c=Object(this),d=c.length>>>0,e,f=0;f<d;f++)if(e=c[f],a.call(b,e,f,c))return f;return-1},enumerable:!1,configurable:!1,writable:!1});
Object.assign||(Object.assign=function(a,b){if(!b)return a;Object.keys(b).forEach(function(c){a[c]=b[c]});return a});function zs(a){function b(a){return"number"===typeof a?a:null}function c(a){return"string"===typeof a?{url:a,ab:null,Mb:null}:{url:a.url,ab:b(a.startPage),Mb:b(a.skipPagesBefore)}}return Array.isArray(a)?a.map(c):a?[c(a)]:null}function As(a){var b={};Object.keys(a).forEach(function(c){var d=a[c];switch(c){case "autoResize":b.autoresize=d;break;case "pageBorderWidth":b.pageBorder=d;break;default:b[c]=d}});return b}
function Bs(a,b){bj=a.debug;this.g=!1;this.h=a;this.Hb=new br(a.window||window,a.viewportElement,"main",this.ye.bind(this));this.f={autoResize:!0,fontSize:16,pageBorderWidth:1,renderAllPages:!0,pageViewMode:"autoSpread",zoom:1,fitToScreen:!1};b&&this.qe(b);this.b=new Qa;Object.defineProperty(this,"readyState",{get:function(){return this.Hb.B}})}n=Bs.prototype;n.qe=function(a){var b=Object.assign({a:"configure"},As(a));this.Hb.A(b);Object.assign(this.f,a)};
n.ye=function(a){var b={type:a.t};Object.keys(a).forEach(function(c){"t"!==c&&(b[c]=a[c])});Ra(this.b,b)};n.Ne=function(a,b){this.b.addEventListener(a,b,!1)};n.Qe=function(a,b){this.b.removeEventListener(a,b,!1)};n.Ce=function(a,b,c){a||Ra(this.b,{type:"error",content:"No URL specified"});Cs(this,a,null,b,c)};n.Oe=function(a,b,c){a||Ra(this.b,{type:"error",content:"No URL specified"});Cs(this,null,a,b,c)};
function Cs(a,b,c,d,e){function f(a){if(a)return a.map(function(a){return{url:a.url||null,text:a.text||null}})}d=d||{};var g=f(d.authorStyleSheet),h=f(d.userStyleSheet);e&&Object.assign(a.f,e);b=Object.assign({a:b?"loadXML":"loadEPUB",userAgentRootURL:a.h.userAgentRootURL,url:zs(b)||c,document:d.documentObject,fragment:d.fragment,authorStyleSheet:g,userStyleSheet:h},As(a.f));a.g?a.Hb.A(b):(a.g=!0,Br(a.Hb,b))}n.vb=function(){return this.Hb.vb()};
n.Ee=function(a){a:switch(a){case "left":a="ltr"===this.vb()?"previous":"next";break a;case "right":a="ltr"===this.vb()?"next":"previous"}this.Hb.A({a:"moveTo",where:a})};n.De=function(a){this.Hb.A({a:"moveTo",url:a})};n.Pe=function(a){a:{var b=this.Hb;if(!b.h)throw Error("no page exists.");switch(a){case "fit inside viewport":a=wr(b,b.Z.ib?vr(b,b.l):b.h.f);break a;default:throw Error("unknown zoom type: "+a);}}return a};ba("vivliostyle.viewer.Viewer",Bs);Bs.prototype.setOptions=Bs.prototype.qe;
Bs.prototype.addListener=Bs.prototype.Ne;Bs.prototype.removeListener=Bs.prototype.Qe;Bs.prototype.loadDocument=Bs.prototype.Ce;Bs.prototype.loadEPUB=Bs.prototype.Oe;Bs.prototype.getCurrentPageProgression=Bs.prototype.vb;Bs.prototype.navigateToPage=Bs.prototype.Ee;Bs.prototype.navigateToInternalUrl=Bs.prototype.De;Bs.prototype.queryZoomFactor=Bs.prototype.Pe;ba("vivliostyle.viewer.ZoomType",xr);xr.FIT_INSIDE_VIEWPORT="fit inside viewport";ba("vivliostyle.viewer.PageViewMode",ar);ar.SINGLE_PAGE="singlePage";
ar.SPREAD="spread";ar.AUTO_SPREAD="autoSpread";Jr.call(fr,"load_vivliostyle","end",void 0);var Ds=16,Es="ltr";function Fs(a){window.adapt_command(a)}function Gs(){Fs({a:"moveTo",where:"ltr"===Es?"previous":"next"})}function Hs(){Fs({a:"moveTo",where:"ltr"===Es?"next":"previous"})}
function Is(a){var b=a.key,c=a.keyIdentifier,d=a.location;if("End"===b||"End"===c)Fs({a:"moveTo",where:"last"}),a.preventDefault();else if("Home"===b||"Home"===c)Fs({a:"moveTo",where:"first"}),a.preventDefault();else if("ArrowUp"===b||"Up"===b||"Up"===c)Fs({a:"moveTo",where:"previous"}),a.preventDefault();else if("ArrowDown"===b||"Down"===b||"Down"===c)Fs({a:"moveTo",where:"next"}),a.preventDefault();else if("ArrowRight"===b||"Right"===b||"Right"===c)Hs(),a.preventDefault();else if("ArrowLeft"===
b||"Left"===b||"Left"===c)Gs(),a.preventDefault();else if("0"===b||"U+0030"===c)Fs({a:"configure",fontSize:Math.round(Ds)}),a.preventDefault();else if("t"===b||"U+0054"===c)Fs({a:"toc",v:"toggle",autohide:!0}),a.preventDefault();else if("+"===b||"Add"===b||"U+002B"===c||"U+00BB"===c||"U+004B"===c&&d===KeyboardEvent.b)Ds*=1.2,Fs({a:"configure",fontSize:Math.round(Ds)}),a.preventDefault();else if("-"===b||"Subtract"===b||"U+002D"===c||"U+00BD"===c||"U+004D"===c&&d===KeyboardEvent.b)Ds/=1.2,Fs({a:"configure",
fontSize:Math.round(Ds)}),a.preventDefault()}
function Js(a){switch(a.t){case "loaded":a=a.viewer;var b=Es=a.vb();a.Xc.setAttribute("data-vivliostyle-page-progression",b);a.Xc.setAttribute("data-vivliostyle-spread-view",a.Z.ib);window.addEventListener("keydown",Is,!1);document.body.setAttribute("data-vivliostyle-viewer-status","complete");a=document.getElementById("vivliostyle-page-navigation-left");a.addEventListener("click",Gs,!1);b=document.getElementById("vivliostyle-page-navigation-right");b.addEventListener("click",Hs,!1);[a,b].forEach(function(a){a.setAttribute("data-vivliostyle-ui-state",
"attention");window.setTimeout(function(){a.removeAttribute("data-vivliostyle-ui-state")},1E3)});break;case "nav":(a=a.cfi)&&location.replace(oa(location.href,Da(a||"")));break;case "hyperlink":a.internal&&Fs({a:"moveTo",url:a.href})}}
ba("vivliostyle.viewerapp.main",function(a){var b=a&&a.fragment||ma("f"),c=a&&a.epubURL||ma("b"),d=a&&a.xmlURL||ma("x"),e=a&&a.defaultPageWidth||ma("w"),f=a&&a.defaultPageHeight||ma("h"),g=a&&a.defaultPageSize||ma("size"),h=a&&a.orientation||ma("orientation"),l=ma("spread"),l=a&&a.spreadView||!!l&&"false"!=l,k=a&&a.viewportElement||document.body;a={a:c?"loadEPUB":"loadXML",url:c||d,autoresize:!0,fragment:b,renderAllPages:!0,userAgentRootURL:a&&a.uaRoot||null,document:a&&a.document||null,userStyleSheet:a&&
a.userStyleSheet||null,spreadView:l,pageBorder:1};var m;if(e&&f)m=e+" "+f;else{switch(g){case "A5":e="148mm";f="210mm";break;case "A4":e="210mm";f="297mm";break;case "A3":e="297mm";f="420mm";break;case "B5":e="176mm";f="250mm";break;case "B4":e="250mm";f="353mm";break;case "letter":e="8.5in";f="11in";break;case "legal":e="8.5in";f="14in";break;case "ledger":e="11in",f="17in"}e&&f&&(m=g,"landscape"===h&&(m=m?m+" landscape":null,g=e,e=f,f=g))}e&&f&&(a.viewport={width:e,height:f},g=document.createElement("style"),
g.textContent="@page { size: "+m+"; margin: 0; }",document.head.appendChild(g));Br(new br(window,k,"main",Js),a)});
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
