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
 * Vivliostyle core 2017.2.1-pre.20170228130329
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
    var p,aa=this;function ba(a,b){var c="undefined"!==typeof enclosingObject&&enclosingObject?enclosingObject:window,d=a.split("."),c=c||aa;d[0]in c||!c.execScript||c.execScript("var "+d[0]);for(var e;d.length&&(e=d.shift());)d.length||void 0===b?c[e]?c=c[e]:c=c[e]={}:c[e]=b}
function t(a,b){function c(){}c.prototype=b.prototype;a.Te=b.prototype;a.prototype=new c;a.prototype.constructor=a;a.Nf=function(a,c,f){for(var d=Array(arguments.length-2),e=2;e<arguments.length;e++)d[e-2]=arguments[e];return b.prototype[c].apply(a,d)}};function ca(a){if(Error.captureStackTrace)Error.captureStackTrace(this,ca);else{var b=Error().stack;b&&(this.stack=b)}a&&(this.message=String(a))}t(ca,Error);ca.prototype.name="CustomError";function da(a,b){for(var c=a.split("%s"),d="",e=Array.prototype.slice.call(arguments,1);e.length&&1<c.length;)d+=c.shift()+e.shift();return d+c.join("%s")};function ea(a,b){b.unshift(a);ca.call(this,da.apply(null,b));b.shift()}t(ea,ca);ea.prototype.name="AssertionError";function fa(a,b){throw new ea("Failure"+(a?": "+a:""),Array.prototype.slice.call(arguments,1));};function ga(a){var b=a.error,c=b&&(b.frameTrace||b.stack);a=[].concat(a.messages);b&&(0<a.length&&(a=a.concat(["\n"])),a=a.concat([b.toString()]),c&&(a=a.concat(["\n"]).concat(c)));return a}function ha(a){a=Array.from(a);var b=null;a[0]instanceof Error&&(b=a.shift());return{error:b,messages:a}}function ia(a){function b(a){return function(b){return a.apply(c,b)}}var c=a||console;this.h=b(c.debug||c.log);this.l=b(c.info||c.log);this.w=b(c.warn||c.log);this.j=b(c.error||c.log);this.f={}}
function ja(a,b,c){(a=a.f[b])&&a.forEach(function(a){a(c)})}function ka(a,b){var c=u,d=c.f[a];d||(d=c.f[a]=[]);d.push(b)}ia.prototype.debug=function(a){var b=ha(arguments);this.h(ga(b));ja(this,1,b)};ia.prototype.g=function(a){var b=ha(arguments);this.l(ga(b));ja(this,2,b)};ia.prototype.b=function(a){var b=ha(arguments);this.w(ga(b));ja(this,3,b)};ia.prototype.error=function(a){var b=ha(arguments);this.j(ga(b));ja(this,4,b)};var u=new ia;function la(a){var b=a.match(/^([^#]*)/);return b?b[1]:a}var ma=window.location.href,na=window.location.href;
function oa(a,b){if(!b||a.match(/^\w{2,}:/))return a.toLowerCase().match("^javascript:")?"#":a;b.match(/^\w{2,}:\/\/[^\/]+$/)&&(b+="/");var c;if(a.match(/^\/\//))return(c=b.match(/^(\w{2,}:)\/\//))?c[1]+a:a;if(a.match(/^\//))return(c=b.match(/^(\w{2,}:\/\/[^\/]+)\//))?c[1]+a:a;a.match(/^\.(\/|$)/)&&(a=a.substr(1));c=b;var d=c.match(/^([^#?]*)/);b=d?d[1]:c;if(a.match(/^\#/))return b+a;c=b.lastIndexOf("/");if(0>c)return a;for(d=b.substr(0,c+1)+a;;){c=d.indexOf("/../");if(0>=c)break;var e=d.lastIndexOf("/",
c-1);if(0>=e)break;d=d.substr(0,e)+d.substr(c+3)}return d.replace(/\/(\.\/)+/g,"/")}function pa(a){a=new RegExp("#(.*&)?"+qa(a)+"=([^#&]*)");return(a=window.location.href.match(a))?a[2]:null}function ra(a,b){var c=new RegExp("#(.*&)?"+qa("f")+"=([^#&]*)"),d=a.match(c);return d?(c=d[2].length,d=d.index+d[0].length-c,a.substr(0,d)+b+a.substr(d+c)):a.match(/#/)?a+"&f="+b:a+"#f="+b}function sa(a){return null==a?a:a.toString()}function ua(){this.b=[null]}
ua.prototype.length=function(){return this.b.length-1};function va(a,b){a&&(b="-"+b,a=a.replace(/-/g,""),"moz"===a&&(a="Moz"));return a+b.replace(/-[a-z]/g,function(a){return a.substr(1).toUpperCase()})}var wa=" -webkit- -moz- -ms- -o- -epub-".split(" "),xa={};
function ya(a,b){if("writing-mode"===b){var c=document.createElement("span");if("-ms-"===a)return c.style.setProperty(a+b,"tb-rl"),"tb-rl"===c.style["writing-mode"];c.style.setProperty(a+b,"vertical-rl");return"vertical-rl"===c.style[a+b]}return"string"===typeof document.documentElement.style[va(a,b)]}
function za(a){var b=xa[a];if(b||null===b)return b;switch(a){case "writing-mode":if(ya("-ms-","writing-mode"))return xa[a]=["-ms-writing-mode"],["-ms-writing-mode"];break;case "filter":if(ya("-webkit-","filter"))return xa[a]=["-webkit-filter"],["-webkit-filter"];break;case "clip-path":if(ya("-webkit-","clip-path"))return xa[a]=["-webkit-clip-path","clip-path"]}for(b=0;b<wa.length;b++){var c=wa[b];if(ya(c,a))return b=c+a,xa[a]=[b],[b]}u.b("Property not supported by the browser: ",a);return xa[a]=null}
function v(a,b,c){try{var d=za(b);d&&d.forEach(function(b){if("-ms-writing-mode"===b)switch(c){case "horizontal-tb":c="lr-tb";break;case "vertical-rl":c="tb-rl";break;case "vertical-lr":c="tb-lr"}a&&a.style&&a.style.setProperty(b,c)})}catch(e){u.b(e)}}function Aa(a,b,c){try{var d=xa[b];return a.style.getPropertyValue(d?d[0]:b)}catch(e){}return c||""}
function Ba(a){var b=a.getAttributeNS("http://www.w3.org/XML/1998/namespace","lang");b||"http://www.w3.org/1999/xhtml"!=a.namespaceURI||(b=a.getAttribute("lang"));return b}function Da(){this.b=[]}Da.prototype.append=function(a){this.b.push(a);return this};Da.prototype.toString=function(){var a=this.b.join("");this.b=[a];return a};function Ea(a){return"\\"+a.charCodeAt(0).toString(16)+" "}function Fa(a){return a.replace(/[^-_a-zA-Z0-9\u0080-\uFFFF]/g,Ea)}
function Ga(a){return a.replace(/[\u0000-\u001F"]/g,Ea)}function Ha(a){return a.replace(/[\s+&?=#\u007F-\uFFFF]+/g,encodeURIComponent)}function Ia(a){return!!a.match(/^[a-zA-Z\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]$/)}function qa(a,b){return a.replace(/[^-a-zA-Z0-9_]/g,function(a){return("string"===typeof b?b:"\\u")+(65536|a.charCodeAt(0)).toString(16).substr(1)})}
function Ja(a){var b=":",b="string"===typeof b?b:"\\u",c=new RegExp(qa(b)+"[0-9a-fA-F]{4}","g");return a.replace(c,function(a){var c=b,c="string"===typeof c?c:"\\u";return a.indexOf(c)?a:String.fromCharCode(parseInt(a.substring(c.length),16))})}function Ka(a){if(!a)throw"Assert failed";}function La(a,b){for(var c=0,d=a;;){Ka(c<=d);Ka(!c||!b(c-1));Ka(d==a||b(d));if(c==d)return c;var e=c+d>>1;b(e)?d=e:c=e+1}}function Ma(a,b){return a-b}
function Na(a,b){for(var c={},d=0;d<a.length;d++){var e=a[d],f=b(e);f&&!c[f]&&(c[f]=e)}return c}var Pa={};function Qa(a,b){for(var c={},d=0;d<a.length;d++){var e=a[d],f=b(e);f&&(c[f]?c[f].push(e):c[f]=[e])}return c}function Ra(a,b){for(var c=Array(a.length),d=0;d<a.length;d++)c[d]=b(a[d],d);return c}function Sa(a,b){var c={},d;for(d in a)c[d]=b(a[d],d);return c}function Ta(){this.h={}}function Ua(a,b){var c=a.h[b.type];if(c){b.target=a;b.currentTarget=a;for(var d=0;d<c.length;d++)c[d](b)}}
Ta.prototype.addEventListener=function(a,b,c){c||((c=this.h[a])?c.push(b):this.h[a]=[b])};Ta.prototype.removeEventListener=function(a,b,c){!c&&(a=this.h[a])&&(b=a.indexOf(b),0<=b&&a.splice(b,1))};var Va=null,Xa=null;function Ya(a){return 1==a.nodeType&&(a=a.getAttribute("id"))&&a.match(/^[-a-zA-Z_0-9.\u007F-\uFFFF]+$/)?a:null}function Za(a){return"^"+a}function $a(a){return a.substr(1)}function ab(a){return a?a.replace(/\^[\[\]\(\),=;^]/g,$a):a}
function bb(a){for(var b={};a;){var c=a.match(/^;([^;=]+)=(([^;]|\^;)*)/);if(!c)break;var d=c[1],e;a:{e=c[2];var f=[];do{var g=e.match(/^(\^,|[^,])*/),h=ab(g[0]);e=e.substr(g[0].length+1);if(!e&&!f.length){e=h;break a}f.push(h)}while(e);e=f}b[d]=e;a=a.substr(c[0].length)}return b}function cb(){}cb.prototype.g=function(a){a.append("!")};cb.prototype.h=function(){return!1};function db(a,b,c){this.index=a;this.id=b;this.nb=c}
db.prototype.g=function(a){a.append("/");a.append(this.index.toString());if(this.id||this.nb)a.append("["),this.id&&a.append(this.id),this.nb&&(a.append(";s="),a.append(this.nb)),a.append("]")};
db.prototype.h=function(a){if(1!=a.node.nodeType)throw Error("E_CFI_NOT_ELEMENT");var b=a.node,c=b.children,d=c.length,e=Math.floor(this.index/2)-1;0>e||!d?(c=b.firstChild,a.node=c||b):(c=c[Math.min(e,d-1)],this.index&1&&((b=c.nextSibling)&&1!=b.nodeType?c=b:a.M=!0),a.node=c);if(this.id&&(a.M||this.id!=Ya(a.node)))throw Error("E_CFI_ID_MISMATCH");a.nb=this.nb;return!0};function eb(a,b,c,d){this.offset=a;this.f=b;this.b=c;this.nb=d}
eb.prototype.h=function(a){if(0<this.offset&&!a.M){for(var b=this.offset,c=a.node;;){var d=c.nodeType;if(1==d)break;var e=c.nextSibling;if(3<=d&&5>=d){d=c.textContent.length;if(b<=d)break;if(!e){b=d;break}b-=d}if(!e){b=0;break}c=e}a.node=c;a.offset=b}a.nb=this.nb;return!0};
eb.prototype.g=function(a){a.append(":");a.append(this.offset.toString());if(this.f||this.b||this.nb){a.append("[");if(this.f||this.b)this.f&&a.append(this.f.replace(/[\[\]\(\),=;^]/g,Za)),a.append(","),this.b&&a.append(this.b.replace(/[\[\]\(\),=;^]/g,Za));this.nb&&(a.append(";s="),a.append(this.nb));a.append("]")}};function fb(){this.ma=null}
function gb(a,b){var c=b.match(/^#?epubcfi\((.*)\)$/);if(!c)throw Error("E_CFI_NOT_CFI");for(var d=c[1],e=0,f=[];;)switch(d.charAt(e)){case "/":e++;c=d.substr(e).match(/^(0|[1-9][0-9]*)(\[([-a-zA-Z_0-9.\u007F-\uFFFF]+)(;([^\]]|\^\])*)?\])?/);if(!c)throw Error("E_CFI_NUMBER_EXPECTED");var e=e+c[0].length,g=parseInt(c[1],10),h=c[3],c=bb(c[4]);f.push(new db(g,h,sa(c.s)));break;case ":":e++;c=d.substr(e).match(/^(0|[1-9][0-9]*)(\[((([^\];,]|\^[\];,])*)(,(([^\];,]|\^[\];,])*))?)(;([^]]|\^\])*)?\])?/);
if(!c)throw Error("E_CFI_NUMBER_EXPECTED");e+=c[0].length;g=parseInt(c[1],10);(h=c[4])&&(h=ab(h));var l=c[7];l&&(l=ab(l));c=bb(c[10]);f.push(new eb(g,h,l,sa(c.s)));break;case "!":e++;f.push(new cb);break;case "~":case "@":case "":a.ma=f;return;default:throw Error("E_CFI_PARSE_ERROR");}}function hb(a,b){for(var c={node:b.documentElement,offset:0,M:!1,nb:null,Gc:null},d=0;d<a.ma.length;d++)if(!a.ma[d].h(c)){++d<a.ma.length&&(c.Gc=new fb,c.Gc.ma=a.ma.slice(d));break}return c}
fb.prototype.trim=function(a,b){return a.replace(/\s+/g," ").match(b?/^[ -\uD7FF\uE000-\uFFFF]{0,8}/:/[ -\uD7FF\uE000-\uFFFF]{0,8}$/)[0].replace(/^\s/,"").replace(/\s$/,"")};
function ib(a,b,c){for(var d=!1,e=null,f=[],g=b.parentNode,h="",l="";b;){switch(b.nodeType){case 3:case 4:case 5:var k=b.textContent,m=k.length;d?(c+=m,h||(h=k)):(c>m&&(c=m),d=!0,h=k.substr(0,c),l=k.substr(c));b=b.previousSibling;continue;case 8:b=b.previousSibling;continue}break}if(0<c||h||l)h=a.trim(h,!1),l=a.trim(l,!0),f.push(new eb(c,h,l,e)),e=null;for(;g&&g&&9!=g.nodeType;){c=d?null:Ya(b);for(d=d?1:0;b;)1==b.nodeType&&(d+=2),b=b.previousSibling;f.push(new db(d,c,e));e=null;b=g;g=g.parentNode;
d=!1}f.reverse();a.ma?(f.push(new cb),a.ma=f.concat(a.ma)):a.ma=f}fb.prototype.toString=function(){if(!this.ma)return"";var a=new Da;a.append("epubcfi(");for(var b=0;b<this.ma.length;b++)this.ma[b].g(a);a.append(")");return a.toString()};function jb(){return{fontFamily:"serif",lineHeight:1.25,margin:8,Ad:!0,vd:25,zd:!1,Gd:!1,ob:!1,ic:1,ae:{print:!0}}}function kb(a){return{fontFamily:a.fontFamily,lineHeight:a.lineHeight,margin:a.margin,Ad:a.Ad,vd:a.vd,zd:a.zd,Gd:a.Gd,ob:a.ob,ic:a.ic,ae:Object.assign({},a.ae)}}var lb=jb(),mb={};function nb(a,b,c,d){a=Math.min((a-0)/c,(b-0)/d);return"matrix("+a+",0,0,"+a+",0,0)"}function ob(a){return'"'+Ga(a+"")+'"'}function pb(a){return Fa(a+"")}function qb(a,b){return a?Fa(a)+"."+Fa(b):Fa(b)}
var rb=0;
function sb(a,b){this.parent=a;this.w="S"+rb++;this.A=[];this.b=new tb(this,0);this.f=new tb(this,1);this.j=new tb(this,!0);this.h=new tb(this,!1);a&&a.A.push(this);this.values={};this.F={};this.C={};this.l=b;if(!a){var c=this.C;c.floor=Math.floor;c.ceil=Math.ceil;c.round=Math.round;c.sqrt=Math.sqrt;c.min=Math.min;c.max=Math.max;c.letterbox=nb;c["css-string"]=ob;c["css-name"]=pb;c["typeof"]=function(a){return typeof a};ub(this,"page-width",function(){return this.Kb()});ub(this,"page-height",function(){return this.Jb()});
ub(this,"pref-font-family",function(){return this.aa.fontFamily});ub(this,"pref-night-mode",function(){return this.aa.Gd});ub(this,"pref-hyphenate",function(){return this.aa.Ad});ub(this,"pref-margin",function(){return this.aa.margin});ub(this,"pref-line-height",function(){return this.aa.lineHeight});ub(this,"pref-column-width",function(){return this.aa.vd*this.fontSize});ub(this,"pref-horizontal",function(){return this.aa.zd});ub(this,"pref-spread-view",function(){return this.aa.ob})}}
function ub(a,b,c){a.values[b]=new vb(a,c,b)}function wb(a,b){a.values["page-number"]=b}function xb(a,b){a.C["has-content"]=b}var yb={px:1,"in":96,pt:4/3,pc:16,cm:96/2.54,mm:96/25.4,q:96/2.54/40,em:16,rem:16,ex:8,rex:8,dppx:1,dpi:1/96,dpcm:2.54/96};function zb(a){switch(a){case "q":case "rem":case "rex":return!0;default:return!1}}
function Ab(a,b,c,d){this.La=b;this.Ab=c;this.O=null;this.Kb=function(){return this.O?this.O:this.aa.ob?Math.floor(b/2)-this.aa.ic:b};this.J=null;this.Jb=function(){return this.J?this.J:c};this.w=d;this.Y=null;this.fontSize=function(){return this.Y?this.Y:d};this.aa=lb;this.G={}}function Bb(a,b){a.G[b.w]={};for(var c=0;c<b.A.length;c++)Bb(a,b.A[c])}
function Cb(a,b,c){return"vw"==b?a.Kb()/100:"vh"==b?a.Jb()/100:"em"==b||"rem"==b?c?a.w:a.fontSize():"ex"==b||"rex"==b?yb.ex*(c?a.w:a.fontSize())/yb.em:yb[b]}function Db(a,b,c){do{var d=b.values[c];if(d||b.l&&(d=b.l.call(a,c,!1)))return d;b=b.parent}while(b);throw Error("Name '"+c+"' is undefined");}
function Eb(a,b,c,d,e){do{var f=b.F[c];if(f||b.l&&(f=b.l.call(a,c,!0)))return f;if(f=b.C[c]){if(e)return b.b;c=Array(d.length);for(e=0;e<d.length;e++)c[e]=d[e].evaluate(a);return new tb(b,f.apply(a,c))}b=b.parent}while(b);throw Error("Function '"+c+"' is undefined");}
function Fb(a,b,c){var d="",e=b.match(/^(min|max)-(.*)$/);e&&(d=e[1],b=e[2]);var f=e=null;switch(b){case "width":case "height":case "device-width":case "device-height":case "color":c&&(e=c.evaluate(a))}switch(b){case "width":f=a.Kb();break;case "height":f=a.Jb();break;case "device-width":f=window.screen.availWidth;break;case "device-height":f=window.screen.availHeight;break;case "color":f=window.screen.pixelDepth}if(null!=f&&null!=e)switch(d){case "min":return f>=e;case "max":return f<=e;default:return f==
e}else if(null!=f&&!c)return!!f;return!1}function Gb(a){this.b=a;this.h="_"+rb++}p=Gb.prototype;p.toString=function(){var a=new Da;this.ua(a,0);return a.toString()};p.ua=function(){throw Error("F_ABSTRACT");};p.cb=function(){throw Error("F_ABSTRACT");};p.Ra=function(){return this};p.Ub=function(a){return a===this};function Hb(a,b,c,d){var e=d[a.h];if(null!=e)return e===mb?!1:e;d[a.h]=mb;b=a.Ub(b,c,d);return d[a.h]=b}
p.evaluate=function(a){var b;b=(b=a.G[this.b.w])?b[this.h]:void 0;if("undefined"!=typeof b)return b;b=this.cb(a);var c=this.h,d=this.b,e=a.G[d.w];e||(e={},a.G[d.w]=e);return e[c]=b};p.fe=function(){return!1};function Ib(a,b){Gb.call(this,a);this.f=b}t(Ib,Gb);p=Ib.prototype;p.Wd=function(){throw Error("F_ABSTRACT");};p.be=function(){throw Error("F_ABSTRACT");};p.cb=function(a){a=this.f.evaluate(a);return this.be(a)};p.Ub=function(a,b,c){return a===this||Hb(this.f,a,b,c)};
p.ua=function(a,b){10<b&&a.append("(");a.append(this.Wd());this.f.ua(a,10);10<b&&a.append(")")};p.Ra=function(a,b){var c=this.f.Ra(a,b);return c===this.f?this:new this.constructor(this.b,c)};function Jb(a,b,c){Gb.call(this,a);this.f=b;this.g=c}t(Jb,Gb);p=Jb.prototype;p.Qc=function(){throw Error("F_ABSTRACT");};p.Oa=function(){throw Error("F_ABSTRACT");};p.lb=function(){throw Error("F_ABSTRACT");};p.cb=function(a){var b=this.f.evaluate(a);a=this.g.evaluate(a);return this.lb(b,a)};
p.Ub=function(a,b,c){return a===this||Hb(this.f,a,b,c)||Hb(this.g,a,b,c)};p.ua=function(a,b){var c=this.Qc();c<=b&&a.append("(");this.f.ua(a,c);a.append(this.Oa());this.g.ua(a,c);c<=b&&a.append(")")};p.Ra=function(a,b){var c=this.f.Ra(a,b),d=this.g.Ra(a,b);return c===this.f&&d===this.g?this:new this.constructor(this.b,c,d)};function Kb(a,b,c){Jb.call(this,a,b,c)}t(Kb,Jb);Kb.prototype.Qc=function(){return 1};function Lb(a,b,c){Jb.call(this,a,b,c)}t(Lb,Jb);Lb.prototype.Qc=function(){return 2};
function Mb(a,b,c){Jb.call(this,a,b,c)}t(Mb,Jb);Mb.prototype.Qc=function(){return 3};function Nb(a,b,c){Jb.call(this,a,b,c)}t(Nb,Jb);Nb.prototype.Qc=function(){return 4};function Ob(a,b){Ib.call(this,a,b)}t(Ob,Ib);Ob.prototype.Wd=function(){return"!"};Ob.prototype.be=function(a){return!a};function Pb(a,b){Ib.call(this,a,b)}t(Pb,Ib);Pb.prototype.Wd=function(){return"-"};Pb.prototype.be=function(a){return-a};function Qb(a,b,c){Jb.call(this,a,b,c)}t(Qb,Kb);Qb.prototype.Oa=function(){return"&&"};
Qb.prototype.cb=function(a){return this.f.evaluate(a)&&this.g.evaluate(a)};function Rb(a,b,c){Jb.call(this,a,b,c)}t(Rb,Qb);Rb.prototype.Oa=function(){return" and "};function Sb(a,b,c){Jb.call(this,a,b,c)}t(Sb,Kb);Sb.prototype.Oa=function(){return"||"};Sb.prototype.cb=function(a){return this.f.evaluate(a)||this.g.evaluate(a)};function Tb(a,b,c){Jb.call(this,a,b,c)}t(Tb,Sb);Tb.prototype.Oa=function(){return", "};function Ub(a,b,c){Jb.call(this,a,b,c)}t(Ub,Lb);Ub.prototype.Oa=function(){return"<"};
Ub.prototype.lb=function(a,b){return a<b};function Vb(a,b,c){Jb.call(this,a,b,c)}t(Vb,Lb);Vb.prototype.Oa=function(){return"<="};Vb.prototype.lb=function(a,b){return a<=b};function Wb(a,b,c){Jb.call(this,a,b,c)}t(Wb,Lb);Wb.prototype.Oa=function(){return">"};Wb.prototype.lb=function(a,b){return a>b};function Xb(a,b,c){Jb.call(this,a,b,c)}t(Xb,Lb);Xb.prototype.Oa=function(){return">="};Xb.prototype.lb=function(a,b){return a>=b};function Yb(a,b,c){Jb.call(this,a,b,c)}t(Yb,Lb);Yb.prototype.Oa=function(){return"=="};
Yb.prototype.lb=function(a,b){return a==b};function Zb(a,b,c){Jb.call(this,a,b,c)}t(Zb,Lb);Zb.prototype.Oa=function(){return"!="};Zb.prototype.lb=function(a,b){return a!=b};function $b(a,b,c){Jb.call(this,a,b,c)}t($b,Mb);$b.prototype.Oa=function(){return"+"};$b.prototype.lb=function(a,b){return a+b};function ac(a,b,c){Jb.call(this,a,b,c)}t(ac,Mb);ac.prototype.Oa=function(){return" - "};ac.prototype.lb=function(a,b){return a-b};function bc(a,b,c){Jb.call(this,a,b,c)}t(bc,Nb);bc.prototype.Oa=function(){return"*"};
bc.prototype.lb=function(a,b){return a*b};function cc(a,b,c){Jb.call(this,a,b,c)}t(cc,Nb);cc.prototype.Oa=function(){return"/"};cc.prototype.lb=function(a,b){return a/b};function dc(a,b,c){Jb.call(this,a,b,c)}t(dc,Nb);dc.prototype.Oa=function(){return"%"};dc.prototype.lb=function(a,b){return a%b};function ec(a,b,c){Gb.call(this,a);this.I=b;this.fa=c.toLowerCase()}t(ec,Gb);ec.prototype.ua=function(a){a.append(this.I.toString());a.append(Fa(this.fa))};
ec.prototype.cb=function(a){return this.I*Cb(a,this.fa,!1)};function fc(a,b){Gb.call(this,a);this.f=b}t(fc,Gb);fc.prototype.ua=function(a){a.append(this.f)};fc.prototype.cb=function(a){return Db(a,this.b,this.f).evaluate(a)};fc.prototype.Ub=function(a,b,c){return a===this||Hb(Db(b,this.b,this.f),a,b,c)};function gc(a,b,c){Gb.call(this,a);this.f=b;this.name=c}t(gc,Gb);gc.prototype.ua=function(a){this.f&&a.append("not ");a.append(Fa(this.name))};
gc.prototype.cb=function(a){var b=this.name;a="all"===b||!!a.aa.ae[b];return this.f?!a:a};gc.prototype.Ub=function(a,b,c){return a===this||Hb(this.value,a,b,c)};gc.prototype.fe=function(){return!0};function vb(a,b,c){Gb.call(this,a);this.gc=b;this.lc=c}t(vb,Gb);vb.prototype.ua=function(a){a.append(this.lc)};vb.prototype.cb=function(a){return this.gc.call(a)};function hc(a,b,c){Gb.call(this,a);this.g=b;this.f=c}t(hc,Gb);
hc.prototype.ua=function(a){a.append(this.g);var b=this.f;a.append("(");for(var c=0;c<b.length;c++)c&&a.append(","),b[c].ua(a,0);a.append(")")};hc.prototype.cb=function(a){return Eb(a,this.b,this.g,this.f,!1).Ra(a,this.f).evaluate(a)};hc.prototype.Ub=function(a,b,c){if(a===this)return!0;for(var d=0;d<this.f.length;d++)if(Hb(this.f[d],a,b,c))return!0;return Hb(Eb(b,this.b,this.g,this.f,!0),a,b,c)};
hc.prototype.Ra=function(a,b){for(var c,d=c=this.f,e=0;e<c.length;e++){var f=c[e].Ra(a,b);if(c!==d)d[e]=f;else if(f!==c[e]){for(var d=Array(c.length),g=0;g<e;g++)d[g]=c[g];d[e]=f}}c=d;return c===this.f?this:new hc(this.b,this.g,c)};function ic(a,b,c,d){Gb.call(this,a);this.f=b;this.j=c;this.g=d}t(ic,Gb);ic.prototype.ua=function(a,b){0<b&&a.append("(");this.f.ua(a,0);a.append("?");this.j.ua(a,0);a.append(":");this.g.ua(a,0);0<b&&a.append(")")};
ic.prototype.cb=function(a){return this.f.evaluate(a)?this.j.evaluate(a):this.g.evaluate(a)};ic.prototype.Ub=function(a,b,c){return a===this||Hb(this.f,a,b,c)||Hb(this.j,a,b,c)||Hb(this.g,a,b,c)};ic.prototype.Ra=function(a,b){var c=this.f.Ra(a,b),d=this.j.Ra(a,b),e=this.g.Ra(a,b);return c===this.f&&d===this.j&&e===this.g?this:new ic(this.b,c,d,e)};function tb(a,b){Gb.call(this,a);this.f=b}t(tb,Gb);
tb.prototype.ua=function(a){switch(typeof this.f){case "number":case "boolean":a.append(this.f.toString());break;case "string":a.append('"');a.append(Ga(this.f));a.append('"');break;default:throw Error("F_UNEXPECTED_STATE");}};tb.prototype.cb=function(){return this.f};function jc(a,b,c){Gb.call(this,a);this.name=b;this.value=c}t(jc,Gb);jc.prototype.ua=function(a){a.append("(");a.append(Ga(this.name.name));a.append(":");this.value.ua(a,0);a.append(")")};
jc.prototype.cb=function(a){return Fb(a,this.name.name,this.value)};jc.prototype.Ub=function(a,b,c){return a===this||Hb(this.value,a,b,c)};jc.prototype.Ra=function(a,b){var c=this.value.Ra(a,b);return c===this.value?this:new jc(this.b,this.name,c)};function kc(a,b){Gb.call(this,a);this.index=b}t(kc,Gb);kc.prototype.ua=function(a){a.append("$");a.append(this.index.toString())};kc.prototype.Ra=function(a,b){var c=b[this.index];if(!c)throw Error("Parameter missing: "+this.index);return c};
function lc(a,b,c){return b===a.h||b===a.b||c==a.h||c==a.b?a.h:b===a.j||b===a.f?c:c===a.j||c===a.f?b:new Qb(a,b,c)}function w(a,b,c){return b===a.b?c:c===a.b?b:new $b(a,b,c)}function x(a,b,c){return b===a.b?new Pb(a,c):c===a.b?b:new ac(a,b,c)}function mc(a,b,c){return b===a.b||c===a.b?a.b:b===a.f?c:c===a.f?b:new bc(a,b,c)}function nc(a,b,c){return b===a.b?a.b:c===a.f?b:new cc(a,b,c)};var oc={};function pc(){}p=pc.prototype;p.Pb=function(a){for(var b=0;b<a.length;b++)a[b].ba(this)};p.Rd=function(){throw Error("E_CSS_EMPTY_NOT_ALLOWED");};p.Sd=function(){throw Error("E_CSS_SLASH_NOT_ALLOWED");};p.Oc=function(){throw Error("E_CSS_STR_NOT_ALLOWED");};p.Ob=function(){throw Error("E_CSS_IDENT_NOT_ALLOWED");};p.qc=function(){throw Error("E_CSS_NUMERIC_NOT_ALLOWED");};p.oc=function(){throw Error("E_CSS_NUM_NOT_ALLOWED");};p.nc=function(a){return this.oc(a)};
p.pd=function(){throw Error("E_CSS_COLOR_NOT_ALLOWED");};p.rc=function(){throw Error("E_CSS_URL_NOT_ALLOWED");};p.ub=function(){throw Error("E_CSS_LIST_NOT_ALLOWED");};p.Nb=function(){throw Error("E_CSS_COMMA_NOT_ALLOWED");};p.zb=function(){throw Error("E_CSS_FUNC_NOT_ALLOWED");};p.mc=function(){throw Error("E_CSS_EXPR_NOT_ALLOWED");};function qc(){}t(qc,pc);p=qc.prototype;
p.Pb=function(a){for(var b=null,c=0;c<a.length;c++){var d=a[c],e=d.ba(this);if(b)b[c]=e;else if(d!==e){b=Array(a.length);for(d=0;d<c;d++)b[d]=a[d];b[c]=e}}return b||a};p.Oc=function(a){return a};p.Ob=function(a){return a};p.Sd=function(a){return a};p.qc=function(a){return a};p.oc=function(a){return a};p.nc=function(a){return a};p.pd=function(a){return a};p.rc=function(a){return a};p.ub=function(a){var b=this.Pb(a.values);return b===a.values?a:new rc(b)};
p.Nb=function(a){var b=this.Pb(a.values);return b===a.values?a:new sc(b)};p.zb=function(a){var b=this.Pb(a.values);return b===a.values?a:new tc(a.name,b)};p.mc=function(a){return a};function uc(){}p=uc.prototype;p.toString=function(){var a=new Da;this.Ma(a,!0);return a.toString()};p.stringValue=function(){var a=new Da;this.Ma(a,!1);return a.toString()};p.ra=function(){throw Error("F_ABSTRACT");};p.Ma=function(a){a.append("[error]")};p.ee=function(){return!1};p.Vb=function(){return!1};p.ge=function(){return!1};
p.Ie=function(){return!1};p.Yc=function(){return!1};function vc(){if(B)throw Error("E_INVALID_CALL");}t(vc,uc);vc.prototype.ra=function(a){return new tb(a,"")};vc.prototype.Ma=function(){};vc.prototype.ba=function(a){return a.Rd(this)};var B=new vc;function wc(){if(xc)throw Error("E_INVALID_CALL");}t(wc,uc);wc.prototype.ra=function(a){return new tb(a,"/")};wc.prototype.Ma=function(a){a.append("/")};wc.prototype.ba=function(a){return a.Sd(this)};var xc=new wc;function Ac(a){this.lc=a}t(Ac,uc);
Ac.prototype.ra=function(a){return new tb(a,this.lc)};Ac.prototype.Ma=function(a,b){b?(a.append('"'),a.append(Ga(this.lc)),a.append('"')):a.append(this.lc)};Ac.prototype.ba=function(a){return a.Oc(this)};function Bc(a){this.name=a;if(oc[a])throw Error("E_INVALID_CALL");oc[a]=this}t(Bc,uc);Bc.prototype.ra=function(a){return new tb(a,this.name)};Bc.prototype.Ma=function(a,b){b?a.append(Fa(this.name)):a.append(this.name)};Bc.prototype.ba=function(a){return a.Ob(this)};Bc.prototype.Ie=function(){return!0};
function C(a){var b=oc[a];b||(b=new Bc(a));return b}function D(a,b){this.I=a;this.fa=b.toLowerCase()}t(D,uc);D.prototype.ra=function(a,b){return this.I?b&&"%"==this.fa?100==this.I?b:new bc(a,b,new tb(a,this.I/100)):new ec(a,this.I,this.fa):a.b};D.prototype.Ma=function(a){a.append(this.I.toString());a.append(this.fa)};D.prototype.ba=function(a){return a.qc(this)};D.prototype.Vb=function(){return!0};function Cc(a){this.I=a}t(Cc,uc);
Cc.prototype.ra=function(a){return this.I?1==this.I?a.f:new tb(a,this.I):a.b};Cc.prototype.Ma=function(a){a.append(this.I.toString())};Cc.prototype.ba=function(a){return a.oc(this)};Cc.prototype.ge=function(){return!0};function Dc(a){this.I=a}t(Dc,Cc);Dc.prototype.ba=function(a){return a.nc(this)};function Ec(a){this.f=a}t(Ec,uc);Ec.prototype.Ma=function(a){a.append("#");var b=this.f.toString(16);a.append("000000".substr(b.length));a.append(b)};Ec.prototype.ba=function(a){return a.pd(this)};
function Fc(a){this.url=a}t(Fc,uc);Fc.prototype.Ma=function(a){a.append('url("');a.append(Ga(this.url));a.append('")')};Fc.prototype.ba=function(a){return a.rc(this)};function Gc(a,b,c,d){var e=b.length;b[0].Ma(a,d);for(var f=1;f<e;f++)a.append(c),b[f].Ma(a,d)}function rc(a){this.values=a}t(rc,uc);rc.prototype.Ma=function(a,b){Gc(a,this.values," ",b)};rc.prototype.ba=function(a){return a.ub(this)};rc.prototype.Yc=function(){return!0};function sc(a){this.values=a}t(sc,uc);
sc.prototype.Ma=function(a,b){Gc(a,this.values,",",b)};sc.prototype.ba=function(a){return a.Nb(this)};function tc(a,b){this.name=a;this.values=b}t(tc,uc);tc.prototype.Ma=function(a,b){a.append(Fa(this.name));a.append("(");Gc(a,this.values,",",b);a.append(")")};tc.prototype.ba=function(a){return a.zb(this)};function E(a){this.b=a}t(E,uc);E.prototype.ra=function(){return this.b};E.prototype.Ma=function(a){a.append("-epubx-expr(");this.b.ua(a,0);a.append(")")};E.prototype.ba=function(a){return a.mc(this)};
E.prototype.ee=function(){return!0};function Hc(a,b){if(a){if(a.Vb())return Cb(b,a.fa,!1)*a.I;if(a.ge())return a.I}return 0}var Ic=C("absolute"),Jc=C("all"),Kc=C("always"),Lc=C("auto");C("avoid");var Mc=C("block"),Nc=C("block-end"),Oc=C("block-start"),Pc=C("both"),Qc=C("bottom"),Rc=C("border-box"),Sc=C("break-all"),Tc=C("break-word"),Uc=C("crop"),Vc=C("cross");C("column");var Wc=C("exclusive"),Xc=C("false"),Yc=C("fixed"),Zc=C("flex"),$c=C("footnote");C("hidden");
var ad=C("horizontal-tb"),bd=C("inherit"),cd=C("inline"),dd=C("inline-block"),ed=C("inline-end"),fd=C("inline-start"),gd=C("landscape"),hd=C("left"),id=C("list-item"),jd=C("ltr");C("manual");var F=C("none"),kd=C("normal"),ld=C("oeb-page-foot"),md=C("oeb-page-head"),nd=C("page"),od=C("relative"),pd=C("right"),qd=C("scale");C("spread");var rd=C("static"),sd=C("rtl"),td=C("table"),ud=C("table-caption"),vd=C("table-cell");C("table-row");
var wd=C("top"),xd=C("transparent"),yd=C("vertical-lr"),zd=C("vertical-rl"),Ad=C("visible"),Bd=C("true"),Cd=new D(100,"%"),Dd=new D(100,"vw"),Ed=new D(100,"vh"),Fd=new D(0,"px"),Gd={"font-size":1,color:2};function Hd(a,b){return(Gd[a]||Number.MAX_VALUE)-(Gd[b]||Number.MAX_VALUE)};var Id={SIMPLE_PROPERTY:"SIMPLE_PROPERTY",PREPROCESS_TEXT_CONTENT:"PREPROCESS_TEXT_CONTENT",PREPROCESS_ELEMENT_STYLE:"PREPROCESS_ELEMENT_STYLE",POLYFILLED_INHERITED_PROPS:"POLYFILLED_INHERITED_PROPS",CONFIGURATION:"CONFIGURATION",RESOLVE_TEXT_NODE_BREAKER:"RESOLVE_TEXT_NODE_BREAKER",RESOLVE_FORMATTING_CONTEXT:"RESOLVE_FORMATTING_CONTEXT",RESOLVE_LAYOUT_PROCESSOR:"RESOLVE_LAYOUT_PROCESSOR"},Jd={};
function Kd(a,b){if(Id[a]){var c=Jd[a];c||(c=Jd[a]=[]);c.push(b)}else u.b(Error("Skipping unknown plugin hook '"+a+"'."))}ba("vivliostyle.plugin.registerHook",Kd);ba("vivliostyle.plugin.removeHook",function(a,b){if(Id[a]){var c=Jd[a];if(c){var d=c.indexOf(b);0<=d&&c.splice(d,1)}}else u.b(Error("Ignoring unknown plugin hook '"+a+"'."))});var Ld=null,Md=null;function I(a){if(!Ld)throw Error("E_TASK_NO_CONTEXT");Ld.name||(Ld.name=a);var b=Ld;a=new Nd(b,b.top,a);b.top=a;a.b=Od;return a}function L(a){return new Pd(a)}function Qd(a,b,c){a=I(a);a.j=c;try{b(a)}catch(d){Rd(a.f,d,a)}return M(a)}function Sd(a){var b=Td,c;Ld?c=Ld.f:(c=Md)||(c=new Ud(new Vd));b(c,a,void 0)}var Od=1;function Vd(){}Vd.prototype.currentTime=function(){return(new Date).valueOf()};function Wd(a,b){return setTimeout(a,b)}
function Ud(a){this.g=a;this.h=1;this.slice=25;this.l=0;this.f=new ua;this.b=this.w=null;this.j=!1;this.order=0;Md||(Md=this)}
function Xd(a){if(!a.j){var b=a.f.b[1].b,c=a.g.currentTime();if(null!=a.b){if(c+a.h>a.w)return;clearTimeout(a.b)}b-=c;b<=a.h&&(b=a.h);a.w=c+b;a.b=Wd(function(){a.b=null;null!=a.b&&(clearTimeout(a.b),a.b=null);a.j=!0;try{var b=a.g.currentTime();for(a.l=b+a.slice;a.f.length();){var c=a.f.b[1];if(c.b>b)break;var f=a.f,g=f.b.pop(),h=f.b.length;if(1<h){for(var l=1;;){var k=2*l;if(k>=h)break;if(0<Yd(f.b[k],g))k+1<h&&0<Yd(f.b[k+1],f.b[k])&&k++;else if(k+1<h&&0<Yd(f.b[k+1],g))k++;else break;f.b[l]=f.b[k];
l=k}f.b[l]=g}if(!c.h){var l=c,m=l.f;l.f=null;m&&m.b==l&&(m.b=null,k=Ld,Ld=m,O(m.top,l.g),Ld=k)}b=a.g.currentTime();if(b>=a.l)break}}catch(n){u.error(n)}a.j=!1;a.f.length()&&Xd(a)},b)}}Ud.prototype.bb=function(a,b){var c=this.g.currentTime();a.order=this.order++;a.b=c+(b||0);a:{for(var c=this.f,d=c.b.length;1<d;){var e=Math.floor(d/2),f=c.b[e];if(0<Yd(f,a)){c.b[d]=a;break a}c.b[d]=f;d=e}c.b[1]=a}Xd(this)};
function Td(a,b,c){var d=new Zd(a,c||"");d.top=new Nd(d,null,"bootstrap");d.top.b=Od;d.top.then(function(){function a(){d.l=!1;for(var a=0;a<d.j.length;a++){var b=d.j[a];try{b()}catch(h){u.error(h)}}}try{b().then(function(b){d.h=b;a()})}catch(f){Rd(d,f),a()}});c=Ld;Ld=d;a.bb($d(d.top,"bootstrap"));Ld=c;return d}function ae(a){this.f=a;this.order=this.b=0;this.g=null;this.h=!1}function Yd(a,b){return b.b-a.b||b.order-a.order}ae.prototype.bb=function(a,b){this.g=a;this.f.f.bb(this,b)};
function Zd(a,b){this.f=a;this.name=b;this.j=[];this.g=null;this.l=!0;this.b=this.top=this.w=this.h=null}function be(a,b){a.j.push(b)}Zd.prototype.join=function(){var a=I("Task.join");if(this.l){var b=$d(a,this),c=this;be(this,function(){b.bb(c.h)})}else O(a,this.h);return M(a)};
function Rd(a,b,c){var d=b.frameTrace;if(!d){for(var d=b.stack?b.stack+"\n\t---- async ---\n":"",e=a.top;e;e=e.parent)d+="\t",d+=e.name,d+="\n";b.frameTrace=d}if(c){for(d=a.top;d&&d!=c;)d=d.parent;d==c&&(a.top=d)}for(a.g=b;a.top&&!a.top.j;)a.top=a.top.parent;a.top?(b=a.g,a.g=null,a.top.j(a.top,b)):a.g&&u.error(a.g,"Unhandled exception in task",a.name)}function Pd(a){this.value=a}p=Pd.prototype;p.then=function(a){a(this.value)};p.oa=function(a){return a(this.value)};p.md=function(a){return new Pd(a)};
p.Fa=function(a){O(a,this.value)};p.za=function(){return!1};p.get=function(){return this.value};function ce(a){this.b=a}p=ce.prototype;p.then=function(a){this.b.then(a)};p.oa=function(a){if(this.za()){var b=new Nd(this.b.f,this.b.parent,"AsyncResult.thenAsync");b.b=Od;this.b.parent=b;this.b.then(function(c){a(c).then(function(a){O(b,a)})});return M(b)}return a(this.b.g)};p.md=function(a){return this.za()?this.oa(function(){return new Pd(a)}):new Pd(a)};
p.Fa=function(a){this.za()?this.then(function(b){O(a,b)}):O(a,this.b.g)};p.za=function(){return this.b.b==Od};p.get=function(){if(this.za())throw Error("Result is pending");return this.b.g};function Nd(a,b,c){this.f=a;this.parent=b;this.name=c;this.g=null;this.b=0;this.j=this.h=null}function de(a){if(!Ld)throw Error("F_TASK_NO_CONTEXT");if(a!==Ld.top)throw Error("F_TASK_NOT_TOP_FRAME");}function M(a){return new ce(a)}
function O(a,b){de(a);Ld.g||(a.g=b);a.b=2;var c=a.parent;Ld.top=c;if(a.h){try{a.h(b)}catch(d){Rd(a.f,d,c)}a.b=3}}Nd.prototype.then=function(a){switch(this.b){case Od:if(this.h)throw Error("F_TASK_FRAME_ALREADY_HAS_CALLBACK");this.h=a;break;case 2:var b=this.f,c=this.parent;try{a(this.g),this.b=3}catch(d){this.b=3,Rd(b,d,c)}break;case 3:throw Error("F_TASK_DEAD_FRAME");default:throw Error("F_TASK_UNEXPECTED_FRAME_STATE "+this.b);}};
function ee(){var a=I("Frame.timeSlice"),b=a.f.f;b.g.currentTime()>=b.l?(u.debug("-- time slice --"),$d(a).bb(!0)):O(a,!0);return M(a)}function fe(a){var b=I("Frame.sleep");$d(b).bb(!0,a);return M(b)}function ge(a){function b(d){try{for(;d;){var e=a();if(e.za()){e.then(b);return}e.then(function(a){d=a})}O(c,!0)}catch(f){Rd(c.f,f,c)}}var c=I("Frame.loop");b(!0);return M(c)}
function he(a){var b=Ld;if(!b)throw Error("E_TASK_NO_CONTEXT");return ge(function(){var c;do c=new ie(b,b.top),b.top=c,c.b=Od,a(c),c=M(c);while(!c.za()&&c.get());return c})}function $d(a,b){de(a);if(a.f.b)throw Error("E_TASK_ALREADY_SUSPENDED");var c=new ae(a.f);a.f.b=c;Ld=null;a.f.w=b||null;return c}function ie(a,b){Nd.call(this,a,b,"loop")}t(ie,Nd);function P(a){O(a,!0)}function Q(a){O(a,!1)};function je(a,b){this.fetch=a;this.name=b;this.f=!1;this.b=this.h=null;this.g=[]}je.prototype.start=function(){if(!this.b){var a=this;this.b=Td(Ld.f,function(){var b=I("Fetcher.run");a.fetch().then(function(c){var d=a.g;a.f=!0;a.h=c;a.b=null;a.g=[];if(d)for(var e=0;e<d.length;e++)try{d[e](c)}catch(f){u.error(f,"Error:")}O(b,c)});return M(b)},this.name)}};function ke(a,b){a.f?b(a.h):a.g.push(b)}je.prototype.get=function(){if(this.f)return L(this.h);this.start();return this.b.join()};
function le(a){if(!a.length)return L(!0);if(1==a.length)return a[0].get().md(!0);var b=I("waitForFetches"),c=0;ge(function(){for(;c<a.length;){var b=a[c++];if(!b.f)return b.get().md(!0)}return L(!1)}).then(function(){O(b,!0)});return M(b)}
function me(a,b){var c=null,d=null;"img"==a.localName&&(c=a.getAttribute("width"),d=a.getAttribute("height"));var e=new je(function(){function e(b){l||(l=!0,"img"==a.localName&&(c||a.removeAttribute("width"),d||a.removeAttribute("height")),h.bb(b?b.type:"timeout"))}var g=I("loadImage"),h=$d(g,a),l=!1;a.addEventListener("load",e,!1);a.addEventListener("error",e,!1);a.addEventListener("abort",e,!1);"http://www.w3.org/2000/svg"==a.namespaceURI?(a.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",
b),setTimeout(e,300)):a.src=b;return M(g)},"loadElement "+b);e.start();return e};function ne(a){a=a.substr(1);if(a.match(/^[^0-9a-fA-F\n\r]$/))return a;a=parseInt(a,16);return isNaN(a)?"":65535>=a?String.fromCharCode(a):1114111>=a?String.fromCharCode(55296|a>>10&1023,56320|a&1023):"\ufffd"}function oe(a){return a.replace(/\\([0-9a-fA-F]{0,6}(\r\n|[ \n\r\t\f])?|[^0-9a-fA-F\n\r])/g,ne)}function pe(){this.type=0;this.b=!1;this.I=0;this.text="";this.position=0}
function qe(a,b){var c=Array(128),d;for(d=0;128>d;d++)c[d]=a;c[NaN]=35==a?35:72;for(d=0;d<b.length;d+=2)c[b[d]]=b[d+1];return c}var re=[72,72,72,72,72,72,72,72,72,1,1,72,1,1,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,1,4,34,6,7,8,9,33,10,11,12,13,14,15,16,17,2,2,2,2,2,2,2,2,2,2,18,19,20,21,22,23,24,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,25,29,26,30,3,72,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,27,31,28,32,72];re[NaN]=80;
var se=[43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,52,43,43,43,43,39,43,43,39,39,39,39,39,39,39,39,39,39,43,43,43,43,43,43,43,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,43,44,43,43,39,43,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,43,43,43,43,43];se[NaN]=43;
var te=[72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,78,59,72,59,59,59,59,59,59,59,59,59,59,72,72,72,72,72,72,72,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,72,61,72,72,78,72,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,72,72,72,72,72];se[NaN]=43;
var ue=[35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,57,59,35,58,58,58,58,58,58,58,58,58,58,35,35,35,35,35,35,35,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,35,61,35,35,60,35,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,35,35,35,35,35];ue[NaN]=35;
var ve=[45,45,45,45,45,45,45,45,45,73,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,73,45,45,45,45,45,45,45,53,45,45,45,45,45,45,45,39,39,39,39,39,39,39,39,39,39,45,45,45,45,45,45,45,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,45,44,45,45,39,45,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,45,45,45,45,45];ve[NaN]=45;
var we=[37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,41,37,37,37,37,37,37,37,37,42,37,39,39,39,39,39,39,39,39,39,39,37,37,37,37,37,37,37,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,37,37,37,37,40,37,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,37,37,37,37,37];we[NaN]=37;
var xe=[38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,41,38,38,38,38,38,38,38,38,38,38,39,39,39,39,39,39,39,39,39,39,38,38,38,38,38,38,38,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,38,38,38,38,40,38,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,38,38,38,38,38];xe[NaN]=38;
var ye=qe(35,[61,36]),ze=qe(35,[58,77]),Ae=qe(35,[61,36,124,50]),Be=qe(35,[38,51]),Ce=qe(35,[42,54]),De=qe(39,[42,55]),Ee=qe(54,[42,55,47,56]),Fe=qe(62,[62,56]),Ge=qe(35,[61,36,33,70]),He=qe(62,[45,71]),Ie=qe(63,[45,56]),Je=qe(76,[9,72,10,72,13,72,32,72]),Ke=qe(39,[39,46,10,72,13,72,92,48]),Le=qe(39,[34,46,10,72,13,72,92,49]),Me=qe(39,[39,47,10,74,13,74,92,48]),Ne=qe(39,[34,47,10,74,13,74,92,49]),Oe=qe(64,[9,39,32,39,34,66,39,65,41,72,10,39,13,39]),Pe=qe(39,[41,67,9,79,10,79,13,79,32,79,92,75,40,
72,91,72,93,72,123,72,125,72,NaN,67]),Qe=qe(39,[39,68,10,74,13,74,92,75,NaN,67]),Re=qe(39,[34,68,10,74,13,74,92,75,NaN,67]),Se=qe(72,[9,39,10,39,13,39,32,39,41,69]);function Te(a,b){this.l=b;this.g=15;this.w=a;this.j=Array(this.g+1);this.b=-1;for(var c=this.position=this.f=this.h=0;c<=this.g;c++)this.j[c]=new pe}function R(a){a.h==a.f&&Ue(a);return a.j[a.f]}function Ve(a,b){(a.h-a.f&a.g)<=b&&Ue(a);return a.j[a.f+b&a.g]}function S(a){a.f=a.f+1&a.g}
function We(a){if(0>a.b)throw Error("F_CSSTOK_BAD_CALL reset");a.f=a.b;a.b=-1}Te.prototype.error=function(a,b,c){this.l&&this.l.error(c,b)};
function Ue(a){var b=a.h,c=0<=a.b?a.b:a.f,d=a.g;b>=c?c+=d:c--;if(c==b){if(0>a.b)throw Error("F_CSSTOK_INTERNAL");for(var b=2*(a.g+1)-1,c=Array(b+1),d=a.b,e=0;d!=a.h;)c[e]=a.j[d],d==a.f&&(a.f=e),d=d+1&a.g,e++;a.b=0;a.h=e;a.g=b;for(a.j=c;e<=b;)c[e++]=new pe;b=a.h;c=d=a.g}for(var e=re,f=a.w,g=a.position,h=a.j,l=0,k=0,m="",n=0,r=!1,q=h[b],z=-9;;){var y=f.charCodeAt(g);switch(e[y]||e[65]){case 72:l=51;m=isNaN(y)?"E_CSS_UNEXPECTED_EOF":"E_CSS_UNEXPECTED_CHAR";g++;break;case 1:g++;r=!0;continue;case 2:k=
g++;e=we;continue;case 3:l=1;k=g++;e=se;continue;case 4:k=g++;l=31;e=ye;continue;case 33:l=2;k=++g;e=Ke;continue;case 34:l=2;k=++g;e=Le;continue;case 6:k=++g;l=7;e=se;continue;case 7:k=g++;l=32;e=ye;continue;case 8:k=g++;l=21;break;case 9:k=g++;l=32;e=Be;continue;case 10:k=g++;l=10;break;case 11:k=g++;l=11;break;case 12:k=g++;l=36;e=ye;continue;case 13:k=g++;l=23;break;case 14:k=g++;l=16;break;case 15:l=24;k=g++;e=ue;continue;case 16:k=g++;e=te;continue;case 78:k=g++;l=9;e=se;continue;case 17:k=g++;
l=19;e=Ce;continue;case 18:k=g++;l=18;e=ze;continue;case 77:g++;l=50;break;case 19:k=g++;l=17;break;case 20:k=g++;l=38;e=Ge;continue;case 21:k=g++;l=39;e=ye;continue;case 22:k=g++;l=37;e=ye;continue;case 23:k=g++;l=22;break;case 24:k=++g;l=20;e=se;continue;case 25:k=g++;l=14;break;case 26:k=g++;l=15;break;case 27:k=g++;l=12;break;case 28:k=g++;l=13;break;case 29:z=k=g++;l=1;e=Je;continue;case 30:k=g++;l=33;e=ye;continue;case 31:k=g++;l=34;e=Ae;continue;case 32:k=g++;l=35;e=ye;continue;case 35:break;
case 36:g++;l=l+41-31;break;case 37:l=5;n=parseInt(f.substring(k,g),10);break;case 38:l=4;n=parseFloat(f.substring(k,g));break;case 39:g++;continue;case 40:l=3;n=parseFloat(f.substring(k,g));k=g++;e=se;continue;case 41:l=3;n=parseFloat(f.substring(k,g));m="%";k=g++;break;case 42:g++;e=xe;continue;case 43:m=f.substring(k,g);break;case 44:z=g++;e=Je;continue;case 45:m=oe(f.substring(k,g));break;case 46:m=f.substring(k,g);g++;break;case 47:m=oe(f.substring(k,g));g++;break;case 48:z=g;g+=2;e=Me;continue;
case 49:z=g;g+=2;e=Ne;continue;case 50:g++;l=25;break;case 51:g++;l=26;break;case 52:m=f.substring(k,g);if(1==l){g++;if("url"==m.toLowerCase()){e=Oe;continue}l=6}break;case 53:m=oe(f.substring(k,g));if(1==l){g++;if("url"==m.toLowerCase()){e=Oe;continue}l=6}break;case 54:e=De;g++;continue;case 55:e=Ee;g++;continue;case 56:e=re;g++;continue;case 57:e=Fe;g++;continue;case 58:l=5;e=we;g++;continue;case 59:l=4;e=xe;g++;continue;case 60:l=1;e=se;g++;continue;case 61:l=1;e=Je;z=g++;continue;case 62:g--;
break;case 63:g-=2;break;case 64:k=g++;e=Pe;continue;case 65:k=++g;e=Qe;continue;case 66:k=++g;e=Re;continue;case 67:l=8;m=oe(f.substring(k,g));g++;break;case 69:g++;break;case 70:e=He;g++;continue;case 71:e=Ie;g++;continue;case 79:if(8>g-z&&f.substring(z+1,g+1).match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])|[ \t]$/)){g++;continue}case 68:l=8;m=oe(f.substring(k,g));g++;e=Se;continue;case 74:g++;if(9>g-z&&f.substring(z+1,g).match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])$/))continue;l=51;m="E_CSS_UNEXPECTED_NEWLINE";
break;case 73:if(9>g-z&&f.substring(z+1,g+1).match(/^[0-9a-fA-F]{0,6}[ \t]$/)){g++;continue}m=oe(f.substring(k,g));break;case 75:z=g++;continue;case 76:g++;e=ve;continue;default:e!==re?(l=51,m="E_CSS_UNEXPECTED_STATE"):(k=g,l=0)}q.type=l;q.b=r;q.I=n;q.text=m;q.position=k;b++;if(b>=c)break;e=re;r=!1;q=h[b&d]}a.position=g;a.h=b&d};function Xe(a,b,c,d,e){var f=I("ajax"),g=new XMLHttpRequest,h=$d(f,g),l={status:0,url:a,contentType:null,responseText:null,responseXML:null,cd:null};g.open(c||"GET",a,!0);b&&(g.responseType=b);g.onreadystatechange=function(){if(4===g.readyState){l.status=g.status;if(200==l.status||!l.status)if(b&&"document"!==b||!g.responseXML){var c=g.response;b&&"text"!==b||"string"!=typeof c?c?"string"==typeof c?l.cd=Ye([c]):l.cd=c:u.b("Unexpected empty success response for",a):l.responseText=c;if(c=g.getResponseHeader("Content-Type"))l.contentType=
c.replace(/(.*);.*$/,"$1")}else l.responseXML=g.responseXML,l.contentType=g.responseXML.contentType;h.bb(l)}};try{d?(g.setRequestHeader("Content-Type",e||"text/plain; charset=UTF-8"),g.send(d)):g.send(null)}catch(k){u.b(k,"Error fetching "+a),h.bb(l)}return M(f)}function Ye(a){var b=window.WebKitBlobBuilder||window.MSBlobBuilder;if(b){for(var b=new b,c=0;c<a.length;c++)b.append(a[c]);return b.getBlob("application/octet-stream")}return new Blob(a,{type:"application/octet-stream"})}
function Ze(a){var b=I("readBlob"),c=new FileReader,d=$d(b,c);c.addEventListener("load",function(){d.bb(c.result)},!1);c.readAsArrayBuffer(a);return M(b)}function $e(a,b){this.Y=a;this.type=b;this.h={};this.j={}}$e.prototype.load=function(a,b,c){a=la(a);var d=this.h[a];return"undefined"!=typeof d?L(d):this.fetch(a,b,c).get()};
function af(a,b,c,d){var e=I("fetch");Xe(b,a.type).then(function(f){if(c&&400<=f.status)throw Error(d||"Failed to fetch required resource: "+b);a.Y(f,a).then(function(c){delete a.j[b];a.h[b]=c;O(e,c)})});return M(e)}$e.prototype.fetch=function(a,b,c){a=la(a);if(this.h[a])return null;var d=this.j[a];if(!d){var e=this,d=new je(function(){return af(e,a,b,c)},"Fetch "+a);e.j[a]=d;d.start()}return d};$e.prototype.get=function(a){return this.h[la(a)]};
function bf(a){a=a.responseText;return L(a?JSON.parse(a):null)};function cf(a){var b=parseInt(a,16);if(isNaN(b))throw Error("E_CSS_COLOR");if(6==a.length)return new Ec(b);if(3==a.length)return new Ec(b&15|(b&15)<<4|(b&240)<<4|(b&240)<<8|(b&3840)<<8|(b&3840)<<12);throw Error("E_CSS_COLOR");}function df(a){this.f=a;this.Xa="Author"}p=df.prototype;p.zc=function(){return null};p.ha=function(){return this.f};p.error=function(){};p.kc=function(a){this.Xa=a};p.yb=function(){};p.ud=function(){};p.Ec=function(){};p.Fc=function(){};p.Bd=function(){};p.Sc=function(){};
p.Db=function(){};p.sd=function(){};p.qd=function(){};p.xd=function(){};p.hc=function(){};p.tb=function(){};p.gd=function(){};p.Ic=function(){};p.ld=function(){};p.ed=function(){};p.kd=function(){};p.jc=function(){};p.Pd=function(){};p.Zb=function(){};p.fd=function(){};p.jd=function(){};p.hd=function(){};p.Lc=function(){};p.Kc=function(){};p.wa=function(){};p.rb=function(){};p.Eb=function(){};p.Jc=function(){};p.Uc=function(){};
function ef(a){switch(a.Xa){case "UA":return 0;case "User":return 100663296;default:return 83886080}}function ff(a){switch(a.Xa){case "UA":return 0;case "User":return 16777216;default:return 33554432}}function gf(){df.call(this,null);this.g=[];this.b=null}t(gf,df);function hf(a,b){a.g.push(a.b);a.b=b}p=gf.prototype;p.zc=function(){return null};p.ha=function(){return this.b.ha()};p.error=function(a,b){this.b.error(a,b)};
p.kc=function(a){df.prototype.kc.call(this,a);0<this.g.length&&(this.b=this.g[0],this.g=[]);this.b.kc(a)};p.yb=function(a,b){this.b.yb(a,b)};p.ud=function(a){this.b.ud(a)};p.Ec=function(a,b){this.b.Ec(a,b)};p.Fc=function(a,b){this.b.Fc(a,b)};p.Bd=function(a){this.b.Bd(a)};p.Sc=function(a,b,c,d){this.b.Sc(a,b,c,d)};p.Db=function(){this.b.Db()};p.sd=function(){this.b.sd()};p.qd=function(){this.b.qd()};p.xd=function(){this.b.xd()};p.hc=function(){this.b.hc()};p.tb=function(){this.b.tb()};p.gd=function(){this.b.gd()};
p.Ic=function(a){this.b.Ic(a)};p.ld=function(){this.b.ld()};p.ed=function(){this.b.ed()};p.kd=function(){this.b.kd()};p.jc=function(){this.b.jc()};p.Pd=function(a){this.b.Pd(a)};p.Zb=function(a){this.b.Zb(a)};p.fd=function(a){this.b.fd(a)};p.jd=function(){this.b.jd()};p.hd=function(a,b,c){this.b.hd(a,b,c)};p.Lc=function(a,b,c){this.b.Lc(a,b,c)};p.Kc=function(a,b,c){this.b.Kc(a,b,c)};p.wa=function(){this.b.wa()};p.rb=function(a,b,c){this.b.rb(a,b,c)};p.Eb=function(){this.b.Eb()};p.Jc=function(a){this.b.Jc(a)};
p.Uc=function(){this.b.Uc()};function jf(a,b,c){df.call(this,a);this.J=c;this.H=0;if(this.ja=b)this.Xa=b.Xa}t(jf,df);jf.prototype.zc=function(){return this.ja.zc()};jf.prototype.error=function(a){u.b(a)};jf.prototype.wa=function(){this.H++};jf.prototype.Eb=function(){if(!--this.H&&!this.J){var a=this.ja;a.b=a.g.pop()}};function kf(a,b,c){jf.call(this,a,b,c)}t(kf,jf);function lf(a,b){a.error(b,a.zc())}function mf(a,b){lf(a,b);hf(a.ja,new jf(a.f,a.ja,!1))}p=kf.prototype;p.tb=function(){mf(this,"E_CSS_UNEXPECTED_SELECTOR")};
p.gd=function(){mf(this,"E_CSS_UNEXPECTED_FONT_FACE")};p.Ic=function(){mf(this,"E_CSS_UNEXPECTED_FOOTNOTE")};p.ld=function(){mf(this,"E_CSS_UNEXPECTED_VIEWPORT")};p.ed=function(){mf(this,"E_CSS_UNEXPECTED_DEFINE")};p.kd=function(){mf(this,"E_CSS_UNEXPECTED_REGION")};p.jc=function(){mf(this,"E_CSS_UNEXPECTED_PAGE")};p.Zb=function(){mf(this,"E_CSS_UNEXPECTED_WHEN")};p.fd=function(){mf(this,"E_CSS_UNEXPECTED_FLOW")};p.jd=function(){mf(this,"E_CSS_UNEXPECTED_PAGE_TEMPLATE")};p.hd=function(){mf(this,"E_CSS_UNEXPECTED_PAGE_MASTER")};
p.Lc=function(){mf(this,"E_CSS_UNEXPECTED_PARTITION")};p.Kc=function(){mf(this,"E_CSS_UNEXPECTED_PARTITION_GROUP")};p.Jc=function(){mf(this,"E_CSS_UNEXPECTED_SELECTOR_FUNC")};p.Uc=function(){mf(this,"E_CSS_UNEXPECTED_END_SELECTOR_FUNC")};p.rb=function(){this.error("E_CSS_UNEXPECTED_PROPERTY",this.zc())};var nf=[],of=[],T=[],pf=[],qf=[],rf=[],sf=[],tf=[],uf=[],vf=[],wf=[],xf=[],yf=[];nf[1]=28;nf[36]=29;nf[7]=29;nf[9]=29;nf[14]=29;nf[18]=29;nf[20]=30;nf[13]=27;nf[0]=200;of[1]=46;of[0]=200;rf[1]=2;
rf[36]=4;rf[7]=6;rf[9]=8;rf[14]=10;rf[18]=14;T[37]=11;T[23]=12;T[35]=56;T[1]=1;T[36]=3;T[7]=5;T[9]=7;T[14]=9;T[12]=13;T[18]=55;T[50]=42;T[16]=41;pf[1]=1;pf[36]=3;pf[7]=5;pf[9]=7;pf[14]=9;pf[11]=200;pf[18]=55;qf[1]=2;qf[36]=4;qf[7]=6;qf[9]=8;qf[18]=14;qf[50]=42;qf[14]=10;qf[12]=13;sf[1]=15;sf[7]=16;sf[4]=17;sf[5]=18;sf[3]=19;sf[2]=20;sf[8]=21;sf[16]=22;sf[19]=23;sf[6]=24;sf[11]=25;sf[17]=26;sf[13]=48;sf[31]=47;sf[23]=54;sf[0]=44;tf[1]=31;tf[4]=32;tf[5]=32;tf[3]=33;tf[2]=34;tf[10]=40;tf[6]=38;
tf[31]=36;tf[24]=36;tf[32]=35;uf[1]=45;uf[16]=37;uf[37]=37;uf[38]=37;uf[47]=37;uf[48]=37;uf[39]=37;uf[49]=37;uf[26]=37;uf[25]=37;uf[23]=37;uf[24]=37;uf[19]=37;uf[21]=37;uf[36]=37;uf[18]=37;uf[22]=37;uf[11]=39;uf[12]=43;uf[17]=49;vf[0]=200;vf[12]=50;vf[13]=51;vf[14]=50;vf[15]=51;vf[10]=50;vf[11]=51;vf[17]=53;wf[0]=200;wf[12]=50;wf[13]=52;wf[14]=50;wf[15]=51;wf[10]=50;wf[11]=51;wf[17]=53;xf[0]=200;xf[12]=50;xf[13]=51;xf[14]=50;xf[15]=51;xf[10]=50;xf[11]=51;yf[11]=0;yf[16]=0;yf[22]=1;yf[18]=1;
yf[26]=2;yf[25]=2;yf[38]=3;yf[37]=3;yf[48]=3;yf[47]=3;yf[39]=3;yf[49]=3;yf[41]=3;yf[23]=4;yf[24]=4;yf[36]=5;yf[19]=5;yf[21]=5;yf[0]=6;yf[52]=2;function zf(a,b,c,d){this.b=a;this.f=b;this.w=c;this.ga=d;this.F=[];this.V={};this.g=this.J=null;this.C=!1;this.j=2;this.G=null;this.H=!1;this.A=this.O=null;this.l=[];this.h=[];this.X=this.Y=!1}function Af(a,b){for(var c=[],d=a.F;;){c.push(d[b++]);if(b==d.length)break;if(","!=d[b++])throw Error("Unexpected state");}return c}
function Bf(a,b,c){var d=a.F,e=d.length,f;do f=d[--e];while("undefined"!=typeof f&&"string"!=typeof f);var g=d.length-(e+1);1<g&&d.splice(e+1,g,new rc(d.slice(e+1,d.length)));if(","==b)return null;e++;do f=d[--e];while("undefined"!=typeof f&&("string"!=typeof f||","==f));g=d.length-(e+1);if("("==f){if(")"!=b)return a.w.error("E_CSS_MISMATCHED_C_PAR",c),a.b=wf,null;a=new tc(d[e-1],Af(a,e+1));d.splice(e-1,g+2,a);return null}return";"!=b||0<=e?(a.w.error("E_CSS_UNEXPECTED_VAL_END",c),a.b=wf,null):1<
g?new sc(Af(a,e+1)):d[0]}function Cf(a,b,c){a.b=a.g?wf:vf;a.w.error(b,c)}
function Df(a,b,c){for(var d=a.F,e=a.w,f=d.pop(),g;;){var h=d.pop();if(11==b){for(g=[f];16==h;)g.unshift(d.pop()),h=d.pop();if("string"==typeof h){if("{"==h){for(;2<=g.length;)a=g.shift(),c=g.shift(),a=new Tb(e.ha(),a,c),g.unshift(a);d.push(new E(g[0]));return!0}if("("==h){b=d.pop();f=d.pop();f=new hc(e.ha(),qb(f,b),g);b=0;continue}}if(10==h){f.fe()&&(f=new jc(e.ha(),f,null));b=0;continue}}else if("string"==typeof h){d.push(h);break}if(0>h)if(-31==h)f=new Ob(e.ha(),f);else if(-24==h)f=new Pb(e.ha(),
f);else return Cf(a,"F_UNEXPECTED_STATE",c),!1;else{if(yf[b]>yf[h]){d.push(h);break}g=d.pop();switch(h){case 26:f=new Qb(e.ha(),g,f);break;case 52:f=new Rb(e.ha(),g,f);break;case 25:f=new Sb(e.ha(),g,f);break;case 38:f=new Ub(e.ha(),g,f);break;case 37:f=new Wb(e.ha(),g,f);break;case 48:f=new Vb(e.ha(),g,f);break;case 47:f=new Xb(e.ha(),g,f);break;case 39:case 49:f=new Yb(e.ha(),g,f);break;case 41:f=new Zb(e.ha(),g,f);break;case 23:f=new $b(e.ha(),g,f);break;case 24:f=new ac(e.ha(),g,f);break;case 36:f=
new bc(e.ha(),g,f);break;case 19:f=new cc(e.ha(),g,f);break;case 21:f=new dc(e.ha(),g,f);break;case 18:if(1<d.length)switch(d[d.length-1]){case 22:d.pop();f=new ic(e.ha(),d.pop(),g,f);break;case 10:if(g.fe())f=new jc(e.ha(),g,f);else return Cf(a,"E_CSS_MEDIA_TEST",c),!1}else return Cf(a,"E_CSS_EXPR_COND",c),!1;break;case 22:if(18!=b)return Cf(a,"E_CSS_EXPR_COND",c),!1;case 10:return d.push(g),d.push(h),d.push(f),!1;default:return Cf(a,"F_UNEXPECTED_STATE",c),!1}}}d.push(f);return!1}
function Ef(a){for(var b=[];;){var c=R(a.f);switch(c.type){case 1:b.push(c.text);break;case 23:b.push("+");break;case 4:case 5:b.push(c.I);break;default:return b}S(a.f)}}
function Ff(a){var b=!1,c=R(a.f);if(23===c.type)b=!0,S(a.f),c=R(a.f);else if(1===c.type&&("even"===c.text||"odd"===c.text))return S(a.f),[2,"odd"===c.text?1:0];switch(c.type){case 3:if(b&&0>c.I)break;case 1:if(b&&"-"===c.text.charAt(0))break;if("n"===c.text||"-n"===c.text){if(b&&c.b)break;b="-n"===c.text?-1:1;3===c.type&&(b=c.I);var d=0;S(a.f);var c=R(a.f),e=24===c.type,f=23===c.type||e;f&&(S(a.f),c=R(a.f));if(5===c.type){d=c.I;if(1/d===1/-0){if(d=0,f)break}else if(0>d){if(f)break}else if(0<=d&&!f)break;
S(a.f)}else if(f)break;return[b,e&&0<d?-d:d]}if("n-"===c.text||"-n-"===c.text){if(!b||!c.b)if(b="-n-"===c.text?-1:1,3===c.type&&(b=c.I),S(a.f),c=R(a.f),5===c.type&&!(0>c.I||1/c.I===1/-0))return S(a.f),[b,c.I]}else{if(d=c.text.match(/^n(-[0-9]+)$/)){if(b&&c.b)break;S(a.f);return[3===c.type?c.I:1,parseInt(d[1],10)]}if(d=c.text.match(/^-n(-[0-9]+)$/))return S(a.f),[-1,parseInt(d[1],10)]}break;case 5:if(!b||!(c.b||0>c.I))return S(a.f),[0,c.I]}return null}
function Gf(a,b,c){a=a.w.ha();if(!a)return null;c=c||a.j;if(b){b=b.split(/\s+/);for(var d=0;d<b.length;d++)switch(b[d]){case "vertical":c=lc(a,c,new Ob(a,new fc(a,"pref-horizontal")));break;case "horizontal":c=lc(a,c,new fc(a,"pref-horizontal"));break;case "day":c=lc(a,c,new Ob(a,new fc(a,"pref-night-mode")));break;case "night":c=lc(a,c,new fc(a,"pref-night-mode"));break;default:c=a.h}}return c===a.j?null:new E(c)}
function Hf(a){switch(a.h[a.h.length-1]){case "[selector]":case "font-face":case "-epubx-flow":case "-epubx-viewport":case "-epubx-define":case "-adapt-footnote-area":return!0}return!1}
function If(a,b,c,d,e,f){var g=a.w,h=a.f,l=a.F,k,m,n,r;e&&(a.j=2,a.F.push("{"));a:for(;0<b;--b)switch(k=R(h),a.b[k.type]){case 28:if(18!=Ve(h,1).type){Hf(a)?(g.error("E_CSS_COLON_EXPECTED",Ve(h,1)),a.b=wf):(a.b=rf,g.tb());continue}m=Ve(h,2);if(!(m.b||1!=m.type&&6!=m.type)){if(0<=h.b)throw Error("F_CSSTOK_BAD_CALL mark");h.b=h.f}a.g=k.text;a.C=!1;S(h);S(h);a.b=sf;l.splice(0,l.length);continue;case 46:if(18!=Ve(h,1).type){a.b=wf;g.error("E_CSS_COLON_EXPECTED",Ve(h,1));continue}a.g=k.text;a.C=!1;S(h);
S(h);a.b=sf;l.splice(0,l.length);continue;case 29:a.b=rf;g.tb();continue;case 1:if(!k.b){a.b=xf;g.error("E_CSS_SPACE_EXPECTED",k);continue}g.Db();case 2:if(34==Ve(h,1).type)if(S(h),S(h),n=a.V[k.text],null!=n)switch(k=R(h),k.type){case 1:g.yb(n,k.text);a.b=f?pf:T;S(h);break;case 36:g.yb(n,null);a.b=f?pf:T;S(h);break;default:a.b=vf,g.error("E_CSS_NAMESPACE",k)}else a.b=vf,g.error("E_CSS_UNDECLARED_PREFIX",k);else g.yb(a.J,k.text),a.b=f?pf:T,S(h);continue;case 3:if(!k.b){a.b=xf;g.error("E_CSS_SPACE_EXPECTED",
k);continue}g.Db();case 4:if(34==Ve(h,1).type)switch(S(h),S(h),k=R(h),k.type){case 1:g.yb(null,k.text);a.b=f?pf:T;S(h);break;case 36:g.yb(null,null);a.b=f?pf:T;S(h);break;default:a.b=vf,g.error("E_CSS_NAMESPACE",k)}else g.yb(a.J,null),a.b=f?pf:T,S(h);continue;case 5:k.b&&g.Db();case 6:g.Bd(k.text);a.b=f?pf:T;S(h);continue;case 7:k.b&&g.Db();case 8:g.ud(k.text);a.b=f?pf:T;S(h);continue;case 55:k.b&&g.Db();case 14:S(h);k=R(h);b:switch(k.type){case 1:g.Ec(k.text,null);S(h);a.b=f?pf:T;continue;case 6:m=
k.text;S(h);switch(m){case "not":a.b=rf;g.Jc("not");If(a,Number.POSITIVE_INFINITY,!1,!1,!1,!0)?a.b=T:a.b=xf;break a;case "lang":case "href-epub-type":if(k=R(h),1===k.type){n=[k.text];S(h);break}else break b;case "nth-child":case "nth-of-type":case "nth-last-child":case "nth-last-of-type":if(n=Ff(a))break;else break b;default:n=Ef(a)}k=R(h);if(11==k.type){g.Ec(m,n);S(h);a.b=f?pf:T;continue}}g.error("E_CSS_PSEUDOCLASS_SYNTAX",k);a.b=vf;continue;case 42:S(h);k=R(h);switch(k.type){case 1:g.Fc(k.text,
null);a.b=f?pf:T;S(h);continue;case 6:if(m=k.text,S(h),n=Ef(a),k=R(h),11==k.type){g.Fc(m,n);a.b=f?pf:T;S(h);continue}}g.error("E_CSS_PSEUDOELEM_SYNTAX",k);a.b=vf;continue;case 9:k.b&&g.Db();case 10:S(h);k=R(h);if(1==k.type)m=k.text,S(h);else if(36==k.type)m=null,S(h);else if(34==k.type)m="";else{a.b=xf;g.error("E_CSS_ATTR",k);S(h);continue}k=R(h);if(34==k.type){n=m?a.V[m]:m;if(null==n){a.b=xf;g.error("E_CSS_UNDECLARED_PREFIX",k);S(h);continue}S(h);k=R(h);if(1!=k.type){a.b=xf;g.error("E_CSS_ATTR_NAME_EXPECTED",
k);continue}m=k.text;S(h);k=R(h)}else n="";switch(k.type){case 39:case 45:case 44:case 43:case 42:case 46:case 50:r=k.type;S(h);k=R(h);break;case 15:g.Sc(n,m,0,null);a.b=f?pf:T;S(h);continue;default:a.b=xf;g.error("E_CSS_ATTR_OP_EXPECTED",k);continue}switch(k.type){case 1:case 2:g.Sc(n,m,r,k.text);S(h);k=R(h);break;default:a.b=xf;g.error("E_CSS_ATTR_VAL_EXPECTED",k);continue}if(15!=k.type){a.b=xf;g.error("E_CSS_ATTR",k);continue}a.b=f?pf:T;S(h);continue;case 11:g.sd();a.b=qf;S(h);continue;case 12:g.qd();
a.b=qf;S(h);continue;case 56:g.xd();a.b=qf;S(h);continue;case 13:a.Y?(a.h.push("-epubx-region"),a.Y=!1):a.X?(a.h.push("page"),a.X=!1):a.h.push("[selector]");g.wa();a.b=nf;S(h);continue;case 41:g.hc();a.b=rf;S(h);continue;case 15:l.push(C(k.text));S(h);continue;case 16:try{l.push(cf(k.text))}catch(z){g.error("E_CSS_COLOR",k),a.b=vf}S(h);continue;case 17:l.push(new Cc(k.I));S(h);continue;case 18:l.push(new Dc(k.I));S(h);continue;case 19:l.push(new D(k.I,k.text));S(h);continue;case 20:l.push(new Ac(k.text));
S(h);continue;case 21:l.push(new Fc(oa(k.text,a.ga)));S(h);continue;case 22:Bf(a,",",k);l.push(",");S(h);continue;case 23:l.push(xc);S(h);continue;case 24:m=k.text.toLowerCase();"-epubx-expr"==m?(a.b=tf,a.j=0,l.push("{")):(l.push(m),l.push("("));S(h);continue;case 25:Bf(a,")",k);S(h);continue;case 47:S(h);k=R(h);m=Ve(h,1);if(1==k.type&&"important"==k.text.toLowerCase()&&(17==m.type||0==m.type||13==m.type)){S(h);a.C=!0;continue}Cf(a,"E_CSS_SYNTAX",k);continue;case 54:m=Ve(h,1);switch(m.type){case 4:case 3:case 5:if(!m.b){S(h);
continue}}a.b===sf&&0<=h.b?(We(h),a.b=rf,g.tb()):Cf(a,"E_CSS_UNEXPECTED_PLUS",k);continue;case 26:S(h);case 48:h.b=-1;(m=Bf(a,";",k))&&a.g&&g.rb(a.g,m,a.C);a.b=d?of:nf;continue;case 44:S(h);h.b=-1;m=Bf(a,";",k);if(c)return a.G=m,!0;a.g&&m&&g.rb(a.g,m,a.C);if(d)return!0;Cf(a,"E_CSS_SYNTAX",k);continue;case 31:m=Ve(h,1);9==m.type?(10!=Ve(h,2).type||Ve(h,2).b?(l.push(new fc(g.ha(),qb(k.text,m.text))),a.b=uf):(l.push(k.text,m.text,"("),S(h)),S(h)):(2==a.j||3==a.j?"not"==k.text.toLowerCase()?(S(h),l.push(new gc(g.ha(),
!0,m.text))):("only"==k.text.toLowerCase()&&(S(h),k=m),l.push(new gc(g.ha(),!1,k.text))):l.push(new fc(g.ha(),k.text)),a.b=uf);S(h);continue;case 38:l.push(null,k.text,"(");S(h);continue;case 32:l.push(new tb(g.ha(),k.I));S(h);a.b=uf;continue;case 33:m=k.text;"%"==m&&(m=a.g&&a.g.match(/height|^(top|bottom)$/)?"vh":"vw");l.push(new ec(g.ha(),k.I,m));S(h);a.b=uf;continue;case 34:l.push(new tb(g.ha(),k.text));S(h);a.b=uf;continue;case 35:S(h);k=R(h);5!=k.type||k.b?Cf(a,"E_CSS_SYNTAX",k):(l.push(new kc(g.ha(),
k.I)),S(h),a.b=uf);continue;case 36:l.push(-k.type);S(h);continue;case 37:a.b=tf;Df(a,k.type,k);l.push(k.type);S(h);continue;case 45:"and"==k.text.toLowerCase()?(a.b=tf,Df(a,52,k),l.push(52),S(h)):Cf(a,"E_CSS_SYNTAX",k);continue;case 39:Df(a,k.type,k)&&(a.g?a.b=sf:Cf(a,"E_CSS_UNBALANCED_PAR",k));S(h);continue;case 43:Df(a,11,k)&&(a.g||3==a.j?Cf(a,"E_CSS_UNEXPECTED_BRC",k):(1==a.j?g.Zb(l.pop()):(k=l.pop(),g.Zb(k)),a.h.push("media"),g.wa(),a.b=nf));S(h);continue;case 49:if(Df(a,11,k))if(a.g||3!=a.j)Cf(a,
"E_CSS_UNEXPECTED_SEMICOL",k);else return a.A=l.pop(),a.H=!0,a.b=nf,S(h),!1;S(h);continue;case 40:l.push(k.type);S(h);continue;case 27:a.b=nf;S(h);g.Eb();a.h.length&&a.h.pop();continue;case 30:m=k.text.toLowerCase();switch(m){case "import":S(h);k=R(h);if(2==k.type||8==k.type){a.O=k.text;S(h);k=R(h);if(17==k.type||0==k.type)return a.H=!0,S(h),!1;a.g=null;a.j=3;a.b=tf;l.push("{");continue}g.error("E_CSS_IMPORT_SYNTAX",k);a.b=vf;continue;case "namespace":S(h);k=R(h);switch(k.type){case 1:m=k.text;S(h);
k=R(h);if((2==k.type||8==k.type)&&17==Ve(h,1).type){a.V[m]=k.text;S(h);S(h);continue}break;case 2:case 8:if(17==Ve(h,1).type){a.J=k.text;S(h);S(h);continue}}g.error("E_CSS_NAMESPACE_SYNTAX",k);a.b=vf;continue;case "charset":S(h);k=R(h);if(2==k.type&&17==Ve(h,1).type){m=k.text.toLowerCase();"utf-8"!=m&&"utf-16"!=m&&g.error("E_CSS_UNEXPECTED_CHARSET "+m,k);S(h);S(h);continue}g.error("E_CSS_CHARSET_SYNTAX",k);a.b=vf;continue;case "font-face":case "-epubx-page-template":case "-epubx-define":case "-epubx-viewport":if(12==
Ve(h,1).type){S(h);S(h);switch(m){case "font-face":g.gd();break;case "-epubx-page-template":g.jd();break;case "-epubx-define":g.ed();break;case "-epubx-viewport":g.ld()}a.h.push(m);g.wa();continue}break;case "-adapt-footnote-area":S(h);k=R(h);switch(k.type){case 12:S(h);g.Ic(null);a.h.push(m);g.wa();continue;case 50:if(S(h),k=R(h),1==k.type&&12==Ve(h,1).type){m=k.text;S(h);S(h);g.Ic(m);a.h.push("-adapt-footnote-area");g.wa();continue}}break;case "-epubx-region":S(h);g.kd();a.Y=!0;a.b=rf;continue;
case "page":S(h);g.jc();a.X=!0;a.b=qf;continue;case "top-left-corner":case "top-left":case "top-center":case "top-right":case "top-right-corner":case "right-top":case "right-middle":case "right-bottom":case "bottom-right-corner":case "bottom-right":case "bottom-center":case "bottom-left":case "bottom-left-corner":case "left-bottom":case "left-middle":case "left-top":S(h);k=R(h);if(12==k.type){S(h);g.Pd(m);a.h.push(m);g.wa();continue}break;case "-epubx-when":S(h);a.g=null;a.j=1;a.b=tf;l.push("{");
continue;case "media":S(h);a.g=null;a.j=2;a.b=tf;l.push("{");continue;case "-epubx-flow":if(1==Ve(h,1).type&&12==Ve(h,2).type){g.fd(Ve(h,1).text);S(h);S(h);S(h);a.h.push(m);g.wa();continue}break;case "-epubx-page-master":case "-epubx-partition":case "-epubx-partition-group":S(h);k=R(h);r=n=null;var q=[];1==k.type&&(n=k.text,S(h),k=R(h));18==k.type&&1==Ve(h,1).type&&(r=Ve(h,1).text,S(h),S(h),k=R(h));for(;6==k.type&&"class"==k.text.toLowerCase()&&1==Ve(h,1).type&&11==Ve(h,2).type;)q.push(Ve(h,1).text),
S(h),S(h),S(h),k=R(h);if(12==k.type){S(h);switch(m){case "-epubx-page-master":g.hd(n,r,q);break;case "-epubx-partition":g.Lc(n,r,q);break;case "-epubx-partition-group":g.Kc(n,r,q)}a.h.push(m);g.wa();continue}break;case "":g.error("E_CSS_UNEXPECTED_AT"+m,k);a.b=xf;continue;default:g.error("E_CSS_AT_UNKNOWN "+m,k);a.b=vf;continue}g.error("E_CSS_AT_SYNTAX "+m,k);a.b=vf;continue;case 50:if(c||d)return!0;a.l.push(k.type+1);S(h);continue;case 52:if(c||d)return!0;if(!a.l.length){a.b=nf;continue}case 51:0<
a.l.length&&a.l[a.l.length-1]==k.type&&a.l.pop();a.l.length||13!=k.type||(a.b=nf);S(h);continue;case 53:if(c||d)return!0;a.l.length||(a.b=nf);S(h);continue;case 200:return f&&(S(h),g.Uc()),!0;default:if(c||d)return!0;if(e)return Df(a,11,k)?(a.G=l.pop(),!0):!1;if(f)return 51==k.type?g.error(k.text,k):g.error("E_CSS_SYNTAX",k),!1;a.b===sf&&0<=h.b?(We(h),a.b=rf,g.tb()):a.b!==vf&&a.b!==xf&&a.b!==wf?(51==k.type?g.error(k.text,k):g.error("E_CSS_SYNTAX",k),a.b=Hf(a)?wf:xf):S(h)}return!1}
function Jf(a){df.call(this,null);this.f=a}t(Jf,df);Jf.prototype.error=function(a){throw Error(a);};Jf.prototype.ha=function(){return this.f};
function Kf(a,b,c,d,e){var f=I("parseStylesheet"),g=new zf(nf,a,b,c),h=null;e&&(h=Lf(new Te(e,b),b,c));if(h=Gf(g,d,h&&h.ra()))b.Zb(h),b.wa();ge(function(){for(;!If(g,100,!1,!1,!1,!1);){if(g.H){var a=oa(g.O,c);g.A&&(b.Zb(g.A),b.wa());var d=I("parseStylesheet.import");Mf(a,b,null,null).then(function(){g.A&&b.Eb();g.H=!1;g.O=null;g.A=null;O(d,!0)});return M(d)}a=ee();if(a.za)return a}return L(!1)}).then(function(){h&&b.Eb();O(f,!0)});return M(f)}
function Nf(a,b,c,d,e){return Qd("parseStylesheetFromText",function(f){var g=new Te(a,b);Kf(g,b,c,d,e).Fa(f)},function(b,c){u.b(c,"Failed to parse stylesheet text: "+a);O(b,!1)})}function Mf(a,b,c,d){return Qd("parseStylesheetFromURL",function(e){Xe(a).then(function(f){f.responseText?Nf(f.responseText,b,a,c,d).then(function(b){b||u.b("Failed to parse stylesheet from "+a);O(e,!0)}):O(e,!0)})},function(b,c){u.b(c,"Exception while fetching and parsing:",a);O(b,!0)})}
function Of(a,b){var c=new zf(sf,b,new Jf(a),"");If(c,Number.POSITIVE_INFINITY,!0,!1,!1,!1);return c.G}function Lf(a,b,c){a=new zf(tf,a,b,c);If(a,Number.POSITIVE_INFINITY,!1,!1,!0,!1);return a.G}var Pf={"z-index":!0,"column-count":!0,"flow-linger":!0,opacity:!0,page:!0,"flow-priority":!0,utilization:!0};
function Qf(a,b,c){if(b.ee())a:{b=b.b;a=b.evaluate(a);switch(typeof a){case "number":c=Pf[c]?a==Math.round(a)?new Dc(a):new Cc(a):new D(a,"px");break a;case "string":c=a?Of(b.b,new Te(a,null)):B;break a;case "boolean":c=a?Bd:Xc;break a;case "undefined":c=B;break a}throw Error("E_UNEXPECTED");}else c=b;return c};function Rf(a,b,c,d){this.U=a;this.R=b;this.T=c;this.N=d}function Sf(a,b){this.f=a;this.b=b}function Tf(){this.bottom=this.right=this.top=this.left=0}function Uf(a,b,c,d){this.b=a;this.f=b;this.h=c;this.g=d}function Vf(a,b,c,d){this.R=a;this.N=b;this.U=c;this.T=d;this.right=this.left=null}function Wf(a,b){return a.b.b-b.b.b||a.b.f-b.b.f}function Xf(a){this.b=a}function Yf(a,b,c){a=a.b;for(var d=a.length,e=a[d-1],f=0;f<d;f++){var g=a[f];b.push(e.b<g.b?new Uf(e,g,1,c):new Uf(g,e,-1,c));e=g}}
function Zf(a,b,c,d){for(var e=[],f=0;20>f;f++){var g=2*f*Math.PI/20;e.push(new Sf(a+c*Math.sin(g),b+d*Math.cos(g)))}return new Xf(e)}function $f(a,b,c,d){return new Xf([new Sf(a,b),new Sf(c,b),new Sf(c,d),new Sf(a,d)])}function ag(a,b,c,d){this.f=a;this.h=b;this.b=c;this.g=d}function bg(a,b){var c=a.b.f+(a.f.f-a.b.f)*(b-a.b.b)/(a.f.b-a.b.b);if(isNaN(c))throw Error("Bad intersection");return c}
function cg(a,b,c,d){var e,f;b.f.b<c&&u.b("Error: inconsistent segment (1)");b.b.b<=c?(c=bg(b,c),e=b.h):(c=b.b.f,e=0);b.f.b>=d?(d=bg(b,d),f=b.h):(d=b.f.f,f=0);c<d?(a.push(new ag(c,e,b.g,-1)),a.push(new ag(d,f,b.g,1))):(a.push(new ag(d,f,b.g,-1)),a.push(new ag(c,e,b.g,1)))}
function dg(a,b,c){c=b+c;for(var d=Array(c),e=Array(c),f=0;f<=c;f++)d[f]=0,e[f]=0;for(var g=[],h=!1,l=a.length,k=0;k<l;k++){var m=a[k];d[m.b]+=m.h;e[m.b]+=m.g;for(var n=!1,f=0;f<b;f++)if(d[f]&&!e[f]){n=!0;break}if(n)for(f=b;f<=c;f++)if(d[f]||e[f]){n=!1;break}h!=n&&(g.push(m.f),h=n)}return g}function eg(a,b){return b?Math.ceil(a/b)*b:a}function fg(a,b){return b?Math.floor(a/b)*b:a}function gg(a){return new Sf(a.b,-a.f)}function hg(a){return new Rf(a.R,-a.T,a.N,-a.U)}
function ig(a){return new Rf(-a.N,a.U,-a.R,a.T)}function jg(a){return new Xf(Ra(a.b,gg))}
function kg(a,b,c,d,e){e&&(a=hg(a),b=Ra(b,jg),c=Ra(c,jg));e=b.length;var f=c?c.length:0,g=[],h=[],l,k,m;for(l=0;l<e;l++)Yf(b[l],h,l);for(l=0;l<f;l++)Yf(c[l],h,l+e);b=h.length;h.sort(Wf);for(c=0;h[c].g>=e;)c++;c=h[c].b.b;c>a.R&&g.push(new Vf(a.R,c,a.T,a.T));l=0;for(var n=[];l<b&&(m=h[l]).b.b<c;)m.f.b>c&&n.push(m),l++;for(;l<b||0<n.length;){var r=a.N,q=Math.min(eg(Math.ceil(c+8),d),a.N);for(k=0;k<n.length&&r>q;k++)m=n[k],m.b.f==m.f.f?m.f.b<r&&(r=Math.max(fg(m.f.b,d),q)):m.b.f!=m.f.f&&(r=q);r>a.N&&(r=
a.N);for(;l<b&&(m=h[l]).b.b<r;)if(m.f.b<c)l++;else if(m.b.b<q){if(m.b.b!=m.f.b||m.b.b!=c)n.push(m),r=q;l++}else{k=fg(m.b.b,d);k<r&&(r=k);break}q=[];for(k=0;k<n.length;k++)cg(q,n[k],c,r);q.sort(function(a,b){return a.f-b.f||a.g-b.g});q=dg(q,e,f);if(q.length){var z=0,y=a.U;for(k=0;k<q.length;k+=2){var A=Math.max(a.U,q[k]),H=Math.min(a.T,q[k+1])-A;H>z&&(z=H,y=A)}z?g.push(new Vf(c,r,Math.max(y,a.U),Math.min(y+z,a.T))):g.push(new Vf(c,r,a.T,a.T))}else g.push(new Vf(c,r,a.T,a.T));if(r==a.N)break;c=r;for(k=
n.length-1;0<=k;k--)n[k].f.b<=r&&n.splice(k,1)}lg(a,g);return g}function lg(a,b){for(var c=b.length-1,d=new Vf(a.N,a.N,a.U,a.T);0<=c;){var e=d,d=b[c];if(1>d.N-d.R||d.U==e.U&&d.T==e.T)e.R=d.R,b.splice(c,1),d=e;c--}}function mg(a,b){for(var c=0,d=a.length;c<d;){var e=Math.floor((c+d)/2);b>=a[e].N?c=e+1:d=e}return c}
function ng(a,b){if(!a.length)return b;for(var c=b.R,d,e=0;e<a.length&&!(d=a[e],d.N>b.R&&d.U-.1<=b.U&&d.T+.1>=b.T);e++)c=Math.max(c,d.N);for(var f=c;e<a.length&&!(d=a[e],d.R>=b.N||d.U-.1>b.U||d.T+.1<b.T);e++)f=d.N;f=e===a.length?b.N:Math.min(f,b.N);return f<=c?null:new Rf(b.U,c,b.T,f)}
function og(a,b){if(!a.length)return b;for(var c=b.N,d,e=a.length-1;0<=e&&!(d=a[e],e===a.length-1&&d.N<b.N)&&!(d.R<b.N&&d.U-.1<=b.U&&d.T+.1>=b.T);e--)c=Math.min(c,d.R);for(var f=Math.min(c,d.N);0<=e&&!(d=a[e],d.N<=b.R||d.U-.1>b.U||d.T+.1<b.T);e--)f=d.R;f=Math.max(f,b.R);return c<=f?null:new Rf(b.U,f,b.T,c)};function pg(){this.b={}}t(pg,pc);pg.prototype.Ob=function(a){this.b[a.name]=!0;return a};pg.prototype.ub=function(a){this.Pb(a.values);return a};function qg(a){this.value=a}t(qg,pc);qg.prototype.nc=function(a){this.value=a.I;return a};function rg(a,b){if(a){var c=new qg(b);try{return a.ba(c),c.value}catch(d){u.b(d,"toInt: ")}}return b}function sg(){this.f=!1;this.b=[];this.name=null}t(sg,pc);sg.prototype.qc=function(a){this.f&&this.b.push(a);return null};
sg.prototype.oc=function(a){this.f&&!a.I&&this.b.push(new D(0,"px"));return null};sg.prototype.ub=function(a){this.Pb(a.values);return null};sg.prototype.zb=function(a){this.f||(this.f=!0,this.Pb(a.values),this.f=!1,this.name=a.name.toLowerCase());return null};
function tg(a,b,c,d,e,f){if(a){var g=new sg;try{a.ba(g);var h;a:{if(0<g.b.length){a=[];for(var l=0;l<g.b.length;l++){var k=g.b[l];if("%"==k.fa){var m=l%2?e:d;3==l&&"circle"==g.name&&(m=Math.sqrt((d*d+e*e)/2));a.push(k.I*m/100)}else a.push(k.I*Cb(f,k.fa,!1))}switch(g.name){case "polygon":if(!(a.length%2)){f=[];for(g=0;g<a.length;g+=2)f.push(new Sf(b+a[g],c+a[g+1]));h=new Xf(f);break a}break;case "rectangle":if(4==a.length){h=$f(b+a[0],c+a[1],b+a[0]+a[2],c+a[1]+a[3]);break a}break;case "ellipse":if(4==
a.length){h=Zf(b+a[0],c+a[1],a[2],a[3]);break a}break;case "circle":if(3==a.length){h=Zf(b+a[0],c+a[1],a[2],a[2]);break a}}}h=null}return h}catch(n){u.b(n,"toShape:")}}return $f(b,c,b+d,c+e)}function ug(a){this.f=a;this.b={};this.name=null}t(ug,pc);ug.prototype.Ob=function(a){this.name=a.toString();this.b[this.name]=this.f?0:(this.b[this.name]||0)+1;return a};ug.prototype.nc=function(a){this.name&&(this.b[this.name]+=a.I-(this.f?0:1));return a};ug.prototype.ub=function(a){this.Pb(a.values);return a};
function vg(a,b){var c=new ug(b);try{a.ba(c)}catch(d){u.b(d,"toCounters:")}return c.b}function wg(a,b){this.b=a;this.f=b}t(wg,qc);wg.prototype.rc=function(a){return new Fc(this.f.Nc(a.url,this.b))};function xg(a){this.g=this.h=null;this.f=0;this.b=a}function yg(a,b){this.b=-1;this.f=a;this.g=b}function zg(){this.b=[];this.f=[];this.match=[];this.g=[];this.error=[];this.h=!0}zg.prototype.connect=function(a,b){for(var c=0;c<a.length;c++)this.f[a[c]].b=b;a.splice(0,a.length)};
zg.prototype.clone=function(){for(var a=new zg,b=0;b<this.b.length;b++){var c=this.b[b],d=new xg(c.b);d.f=c.f;a.b.push(d)}for(b=0;b<this.f.length;b++)c=this.f[b],d=new yg(c.f,c.g),d.b=c.b,a.f.push(d);a.match.push.apply(a.match,this.match);a.g.push.apply(a.g,this.g);a.error.push.apply(a.error,this.error);return a};
function Ag(a,b,c,d){var e=a.b.length,f=new xg(Bg);f.f=0<=d?c?2*d+1:2*d+2:c?-1:-2;a.b.push(f);a.connect(b,e);c=new yg(e,!0);e=new yg(e,!1);b.push(a.f.length);a.f.push(e);b.push(a.f.length);a.f.push(c)}function Cg(a){return 1==a.b.length&&!a.b[0].f&&a.b[0].b instanceof Dg}
function Eg(a,b,c){if(b.b.length){var d=a.b.length;if(4==c&&1==d&&Cg(b)&&Cg(a)){c=a.b[0].b;b=b.b[0].b;var d={},e={},f;for(f in c.f)d[f]=c.f[f];for(f in b.f)d[f]=b.f[f];for(var g in c.g)e[g]=c.g[g];for(g in b.g)e[g]=b.g[g];a.b[0].b=new Dg(c.b|b.b,d,e)}else{for(f=0;f<b.b.length;f++)a.b.push(b.b[f]);4==c?(a.h=!0,a.connect(a.g,d)):a.connect(a.match,d);g=a.f.length;for(f=0;f<b.f.length;f++)e=b.f[f],e.f+=d,0<=e.b&&(e.b+=d),a.f.push(e);for(f=0;f<b.match.length;f++)a.match.push(b.match[f]+g);3==c&&a.connect(a.match,
d);if(2==c||3==c)for(f=0;f<b.g.length;f++)a.match.push(b.g[f]+g);else if(a.h){for(f=0;f<b.g.length;f++)a.g.push(b.g[f]+g);a.h=b.h}else for(f=0;f<b.g.length;f++)a.error.push(b.g[f]+g);for(f=0;f<b.error.length;f++)a.error.push(b.error[f]+g);b.b=null;b.f=null}}}var U={};function Fg(){}t(Fg,pc);Fg.prototype.h=function(a,b){var c=a[b].ba(this);return c?[c]:null};function Dg(a,b,c){this.b=a;this.f=b;this.g=c}t(Dg,Fg);p=Dg.prototype;p.Rd=function(a){return this.b&1?a:null};
p.Sd=function(a){return this.b&2048?a:null};p.Oc=function(a){return this.b&2?a:null};p.Ob=function(a){var b=this.f[a.name.toLowerCase()];return b?b:this.b&4?a:null};p.qc=function(a){return a.I||this.b&512?0>a.I&&!(this.b&256)?null:this.g[a.fa]?a:null:"%"==a.fa&&this.b&1024?a:null};p.oc=function(a){return a.I?0>=a.I&&!(this.b&256)?null:this.b&16?a:null:this.b&512?a:null};p.nc=function(a){return a.I?0>=a.I&&!(this.b&256)?null:this.b&48?a:(a=this.f[""+a.I])?a:null:this.b&512?a:null};
p.pd=function(a){return this.b&64?a:null};p.rc=function(a){return this.b&128?a:null};p.ub=function(){return null};p.Nb=function(){return null};p.zb=function(){return null};p.mc=function(){return null};var Bg=new Dg(0,U,U);
function Gg(a){this.b=new xg(null);var b=this.g=new xg(null),c=a.b.length;a.b.push(this.b);a.b.push(b);a.connect(a.match,c);a.connect(a.g,c+1);a.connect(a.error,c+1);for(b=0;b<a.f.length;b++){var d=a.f[b];d.g?a.b[d.f].h=a.b[d.b]:a.b[d.f].g=a.b[d.b]}for(b=0;b<c;b++)if(!a.b[b].g||!a.b[b].h)throw Error("Invalid validator state");this.f=a.b[0]}t(Gg,Fg);
function Hg(a,b,c,d){for(var e=c?[]:b,f=a.f,g=d,h=null,l=null;f!==a.b&&f!==a.g;)if(g>=b.length)f=f.g;else{var k=b[g],m;if(f.f)m=!0,-1==f.f?(h?h.push(l):h=[l],l=[]):-2==f.f?0<h.length?l=h.pop():l=null:0<f.f&&!(f.f%2)?l[Math.floor((f.f-1)/2)]="taken":m=null==l[Math.floor((f.f-1)/2)],f=m?f.h:f.g;else{if(!g&&!c&&f.b instanceof Ig&&a instanceof Ig){if(m=(new rc(b)).ba(f.b)){g=b.length;f=f.h;continue}}else if(!g&&!c&&f.b instanceof Jg&&a instanceof Ig){if(m=(new sc(b)).ba(f.b)){g=b.length;f=f.h;continue}}else m=
k.ba(f.b);if(m){if(m!==k&&b===e)for(e=[],k=0;k<g;k++)e[k]=b[k];b!==e&&(e[g-d]=m);g++;f=f.h}else f=f.g}}return f===a.b&&(c?0<e.length:g==b.length)?e:null}p=Gg.prototype;p.jb=function(a){for(var b=null,c=this.f;c!==this.b&&c!==this.g;)a?c.f?c=c.h:(b=a.ba(c.b))?(a=null,c=c.h):c=c.g:c=c.g;return c===this.b?b:null};p.Rd=function(a){return this.jb(a)};p.Sd=function(a){return this.jb(a)};p.Oc=function(a){return this.jb(a)};p.Ob=function(a){return this.jb(a)};p.qc=function(a){return this.jb(a)};p.oc=function(a){return this.jb(a)};
p.nc=function(a){return this.jb(a)};p.pd=function(a){return this.jb(a)};p.rc=function(a){return this.jb(a)};p.ub=function(){return null};p.Nb=function(){return null};p.zb=function(a){return this.jb(a)};p.mc=function(){return null};function Ig(a){Gg.call(this,a)}t(Ig,Gg);Ig.prototype.ub=function(a){var b=Hg(this,a.values,!1,0);return b===a.values?a:b?new rc(b):null};
Ig.prototype.Nb=function(a){for(var b=this.f,c=!1;b;){if(b.b instanceof Jg){c=!0;break}b=b.g}return c?(b=Hg(this,a.values,!1,0),b===a.values?a:b?new sc(b):null):null};Ig.prototype.h=function(a,b){return Hg(this,a,!0,b)};function Jg(a){Gg.call(this,a)}t(Jg,Gg);Jg.prototype.ub=function(a){return this.jb(a)};Jg.prototype.Nb=function(a){var b=Hg(this,a.values,!1,0);return b===a.values?a:b?new sc(b):null};Jg.prototype.h=function(a,b){for(var c=this.f,d;c!==this.g;){if(d=c.b.h(a,b))return d;c=c.g}return null};
function Kg(a,b){Gg.call(this,b);this.name=a}t(Kg,Gg);Kg.prototype.jb=function(){return null};Kg.prototype.zb=function(a){if(a.name.toLowerCase()!=this.name)return null;var b=Hg(this,a.values,!1,0);return b===a.values?a:b?new tc(a.name,b):null};function Lg(){}Lg.prototype.b=function(a,b){return b};Lg.prototype.g=function(){};function Mg(a,b){this.name=b;this.h=a.g[this.name]}t(Mg,Lg);
Mg.prototype.b=function(a,b,c){if(c.values[this.name])return b;if(a=this.h.h(a,b)){var d=a.length;this.g(1<d?new rc(a):a[0],c);return b+d}return b};Mg.prototype.g=function(a,b){b.values[this.name]=a};function Ng(a,b){Mg.call(this,a,b[0]);this.f=b}t(Ng,Mg);Ng.prototype.g=function(a,b){for(var c=0;c<this.f.length;c++)b.values[this.f[c]]=a};function Og(a,b){this.f=a;this.le=b}t(Og,Lg);
Og.prototype.b=function(a,b,c){var d=b;if(this.le)if(a[b]==xc){if(++b==a.length)return d}else return d;var e=this.f[0].b(a,b,c);if(e==b)return d;b=e;for(d=1;d<this.f.length&&b<a.length;d++){e=this.f[d].b(a,b,c);if(e==b)break;b=e}return b};function Pg(){this.b=this.hb=null;this.error=!1;this.values={};this.f=null}p=Pg.prototype;p.clone=function(){var a=new this.constructor;a.hb=this.hb;a.b=this.b;a.f=this.f;return a};p.Vd=function(a,b){this.hb=a;this.b=b};p.cc=function(){this.error=!0;return 0};
function Qg(a,b){a.cc([b]);return null}p.Rd=function(a){return Qg(this,a)};p.Oc=function(a){return Qg(this,a)};p.Ob=function(a){return Qg(this,a)};p.qc=function(a){return Qg(this,a)};p.oc=function(a){return Qg(this,a)};p.nc=function(a){return Qg(this,a)};p.pd=function(a){return Qg(this,a)};p.rc=function(a){return Qg(this,a)};p.ub=function(a){this.cc(a.values);return null};p.Nb=function(){this.error=!0;return null};p.zb=function(a){return Qg(this,a)};p.mc=function(){this.error=!0;return null};
function Rg(){Pg.call(this)}t(Rg,Pg);Rg.prototype.cc=function(a){for(var b=0,c=0;b<a.length;){var d=this.hb[c].b(a,b,this);if(d>b)b=d,c=0;else if(++c==this.hb.length){this.error=!0;break}}return b};function Sg(){Pg.call(this)}t(Sg,Pg);Sg.prototype.cc=function(a){if(a.length>this.hb.length||!a.length)return this.error=!0,0;for(var b=0;b<this.hb.length;b++){for(var c=b;c>=a.length;)c=1==c?0:c-2;if(this.hb[b].b(a,c,this)!=c+1)return this.error=!0,0}return a.length};function Tg(){Pg.call(this)}t(Tg,Pg);
Tg.prototype.cc=function(a){for(var b=a.length,c=0;c<a.length;c++)if(a[c]===xc){b=c;break}if(b>this.hb.length||!a.length)return this.error=!0,0;for(c=0;c<this.hb.length;c++){for(var d=c;d>=b;)d=1==d?0:d-2;var e;if(b+1<a.length)for(e=b+c+1;e>=a.length;)e-=e==b+2?1:2;else e=d;if(2!=this.hb[c].b([a[d],a[e]],0,this))return this.error=!0,0}return a.length};function Ug(){Pg.call(this)}t(Ug,Rg);
Ug.prototype.Nb=function(a){for(var b={},c=0;c<a.values.length;c++){this.values={};if(a.values[c]instanceof sc)this.error=!0;else{a.values[c].ba(this);for(var d=b,e=this.values,f=0;f<this.b.length;f++){var g=this.b[f],h=e[g]||this.f.l[g],l=d[g];l||(l=[],d[g]=l);l.push(h)}this.values["background-color"]&&c!=a.values.length-1&&(this.error=!0)}if(this.error)return null}this.values={};for(var k in b)this.values[k]="background-color"==k?b[k].pop():new sc(b[k]);return null};
function Vg(){Pg.call(this)}t(Vg,Rg);Vg.prototype.Vd=function(a,b){Rg.prototype.Vd.call(this,a,b);this.b.push("font-family","line-height","font-size")};
Vg.prototype.cc=function(a){var b=Rg.prototype.cc.call(this,a);if(b+2>a.length)return this.error=!0,b;this.error=!1;var c=this.f.g;if(!a[b].ba(c["font-size"]))return this.error=!0,b;this.values["font-size"]=a[b++];if(a[b]===xc){b++;if(b+2>a.length||!a[b].ba(c["line-height"]))return this.error=!0,b;this.values["line-height"]=a[b++]}var d=b==a.length-1?a[b]:new rc(a.slice(b,a.length));if(!d.ba(c["font-family"]))return this.error=!0,b;this.values["font-family"]=d;return a.length};
Vg.prototype.Nb=function(a){a.values[0].ba(this);if(this.error)return null;for(var b=[this.values["font-family"]],c=1;c<a.values.length;c++)b.push(a.values[c]);a=new sc(b);a.ba(this.f.g["font-family"])?this.values["font-family"]=a:this.error=!0;return null};Vg.prototype.Ob=function(a){if(a=this.f.f[a.name])for(var b in a)this.values[b]=a[b];else this.error=!0;return null};var Wg={SIMPLE:Rg,INSETS:Sg,INSETS_SLASH:Tg,COMMA:Ug,FONT:Vg};
function Xg(){this.g={};this.A={};this.l={};this.b={};this.f={};this.h={};this.w=[];this.j=[]}function Yg(a,b){var c;if(3==b.type)c=new D(b.I,b.text);else if(7==b.type)c=cf(b.text);else if(1==b.type)c=C(b.text);else throw Error("unexpected replacement");if(Cg(a)){var d=a.b[0].b.f,e;for(e in d)d[e]=c;return a}throw Error("unexpected replacement");}
function Zg(a,b,c){for(var d=new zg,e=0;e<b;e++)Eg(d,a.clone(),1);if(c==Number.POSITIVE_INFINITY)Eg(d,a,3);else for(e=b;e<c;e++)Eg(d,a.clone(),2);return d}function $g(a){var b=new zg,c=b.b.length;b.b.push(new xg(a));a=new yg(c,!0);var d=new yg(c,!1);b.connect(b.match,c);b.h?(b.g.push(b.f.length),b.h=!1):b.error.push(b.f.length);b.f.push(d);b.match.push(b.f.length);b.f.push(a);return b}
function ah(a,b){var c;switch(a){case "COMMA":c=new Jg(b);break;case "SPACE":c=new Ig(b);break;default:c=new Kg(a.toLowerCase(),b)}return $g(c)}
function bh(a){a.b.HASHCOLOR=$g(new Dg(64,U,U));a.b.POS_INT=$g(new Dg(32,U,U));a.b.POS_NUM=$g(new Dg(16,U,U));a.b.POS_PERCENTAGE=$g(new Dg(8,U,{"%":B}));a.b.NEGATIVE=$g(new Dg(256,U,U));a.b.ZERO=$g(new Dg(512,U,U));a.b.ZERO_PERCENTAGE=$g(new Dg(1024,U,U));a.b.POS_LENGTH=$g(new Dg(8,U,{em:B,ex:B,ch:B,rem:B,vh:B,vw:B,vmin:B,vmax:B,cm:B,mm:B,"in":B,px:B,pt:B,pc:B,q:B}));a.b.POS_ANGLE=$g(new Dg(8,U,{deg:B,grad:B,rad:B,turn:B}));a.b.POS_TIME=$g(new Dg(8,U,{s:B,ms:B}));a.b.FREQUENCY=$g(new Dg(8,U,{Hz:B,
kHz:B}));a.b.RESOLUTION=$g(new Dg(8,U,{dpi:B,dpcm:B,dppx:B}));a.b.URI=$g(new Dg(128,U,U));a.b.IDENT=$g(new Dg(4,U,U));a.b.STRING=$g(new Dg(2,U,U));a.b.SLASH=$g(new Dg(2048,U,U));var b={"font-family":C("sans-serif")};a.f.caption=b;a.f.icon=b;a.f.menu=b;a.f["message-box"]=b;a.f["small-caption"]=b;a.f["status-bar"]=b}function ch(a){return!!a.match(/^[A-Z_0-9]+$/)}
function dh(a,b,c){var d=R(b);if(0==d.type)return null;var e={"":!0};if(14==d.type){do{S(b);d=R(b);if(1!=d.type)throw Error("Prefix name expected");e[d.text]=!0;S(b);d=R(b)}while(16==d.type);if(15!=d.type)throw Error("']' expected");S(b);d=R(b)}if(1!=d.type)throw Error("Property name expected");if(2==c?"SHORTHANDS"==d.text:"DEFAULTS"==d.text)return S(b),null;d=d.text;S(b);if(2!=c){if(39!=R(b).type)throw Error("'=' expected");ch(d)||(a.A[d]=e)}else if(18!=R(b).type)throw Error("':' expected");return d}
function eh(a,b){for(;;){var c=dh(a,b,1);if(!c)break;for(var d=[],e=[],f="",g,h=!0,l=function(){if(!d.length)throw Error("No values");var a;if(1==d.length)a=d[0];else{var b=f,c=d;a=new zg;if("||"==b){for(b=0;b<c.length;b++){var e=new zg,g=e;if(g.b.length)throw Error("invalid call");var h=new xg(Bg);h.f=2*b+1;g.b.push(h);var h=new yg(0,!0),l=new yg(0,!1);g.g.push(g.f.length);g.f.push(l);g.match.push(g.f.length);g.f.push(h);Eg(e,c[b],1);Ag(e,e.match,!1,b);Eg(a,e,b?4:1)}c=new zg;if(c.b.length)throw Error("invalid call");
Ag(c,c.match,!0,-1);Eg(c,a,3);a=[c.match,c.g,c.error];for(b=0;b<a.length;b++)Ag(c,a[b],!1,-1);a=c}else{switch(b){case " ":e=1;break;case "|":case "||":e=4;break;default:throw Error("unexpected op");}for(b=0;b<c.length;b++)Eg(a,c[b],b?e:1)}}return a},k=function(a){if(h)throw Error("'"+a+"': unexpected");if(f&&f!=a)throw Error("mixed operators: '"+a+"' and '"+f+"'");f=a;h=!0},m=null;!m;)switch(S(b),g=R(b),g.type){case 1:h||k(" ");if(ch(g.text)){var n=a.b[g.text];if(!n)throw Error("'"+g.text+"' unexpected");
d.push(n.clone())}else n={},n[g.text.toLowerCase()]=C(g.text),d.push($g(new Dg(0,n,U)));h=!1;break;case 5:n={};n[""+g.I]=new Dc(g.I);d.push($g(new Dg(0,n,U)));h=!1;break;case 34:k("|");break;case 25:k("||");break;case 14:h||k(" ");e.push({pe:d,je:f,uc:"["});f="";d=[];h=!0;break;case 6:h||k(" ");e.push({pe:d,je:f,uc:"(",gc:g.text});f="";d=[];h=!0;break;case 15:g=l();n=e.pop();if("["!=n.uc)throw Error("']' unexpected");d=n.pe;d.push(g);f=n.je;h=!1;break;case 11:g=l();n=e.pop();if("("!=n.uc)throw Error("')' unexpected");
d=n.pe;d.push(ah(n.gc,g));f=n.je;h=!1;break;case 18:if(h)throw Error("':' unexpected");S(b);d.push(Yg(d.pop(),R(b)));break;case 22:if(h)throw Error("'?' unexpected");d.push(Zg(d.pop(),0,1));break;case 36:if(h)throw Error("'*' unexpected");d.push(Zg(d.pop(),0,Number.POSITIVE_INFINITY));break;case 23:if(h)throw Error("'+' unexpected");d.push(Zg(d.pop(),1,Number.POSITIVE_INFINITY));break;case 12:S(b);g=R(b);if(5!=g.type)throw Error("<int> expected");var r=n=g.I;S(b);g=R(b);if(16==g.type){S(b);g=R(b);
if(5!=g.type)throw Error("<int> expected");r=g.I;S(b);g=R(b)}if(13!=g.type)throw Error("'}' expected");d.push(Zg(d.pop(),n,r));break;case 17:m=l();if(0<e.length)throw Error("unclosed '"+e.pop().uc+"'");break;default:throw Error("unexpected token");}S(b);ch(c)?a.b[c]=m:a.g[c]=1!=m.b.length||m.b[0].f?new Ig(m):m.b[0].b}}
function fh(a,b){for(var c={},d=0;d<b.length;d++)for(var e=b[d],f=a.h[e],e=f?f.b:[e],f=0;f<e.length;f++){var g=e[f],h=a.l[g];h?c[g]=h:u.b("Unknown property in makePropSet:",g)}return c}
function gh(a,b,c,d,e){var f="",g=b;b=b.toLowerCase();var h=b.match(/^-([a-z]+)-([-a-z0-9]+)$/);h&&(f=h[1],b=h[2]);if((h=a.A[b])&&h[f])if(f=a.g[b])(a=c===bd||c.ee()?c:c.ba(f))?e.sb(b,a,d):e.Ac(g,c);else if(b=a.h[b].clone(),c===bd)for(c=0;c<b.b.length;c++)e.sb(b.b[c],bd,d);else{c.ba(b);if(b.error)d=!1;else{for(a=0;a<b.b.length;a++)f=b.b[a],e.sb(f,b.values[f]||b.f.l[f],d);d=!0}d||e.Ac(g,c)}else e.nd(g,c)}
var hh=new je(function(){var a=I("loadValidatorSet.load"),b=oa("validation.txt",na),c=Xe(b),d=new Xg;bh(d);c.then(function(c){try{if(c.responseText){var e=new Te(c.responseText,null);for(eh(d,e);;){var g=dh(d,e,2);if(!g)break;for(c=[];;){S(e);var h=R(e);if(17==h.type){S(e);break}switch(h.type){case 1:c.push(C(h.text));break;case 4:c.push(new Cc(h.I));break;case 5:c.push(new Dc(h.I));break;case 3:c.push(new D(h.I,h.text));break;default:throw Error("unexpected token");}}d.l[g]=1<c.length?new rc(c):
c[0]}for(;;){var l=dh(d,e,3);if(!l)break;var k=Ve(e,1),m;1==k.type&&Wg[k.text]?(m=new Wg[k.text],S(e)):m=new Rg;m.f=d;g=!1;h=[];c=!1;for(var n=[],r=[];!g;)switch(S(e),k=R(e),k.type){case 1:if(d.g[k.text])h.push(new Mg(m.f,k.text)),r.push(k.text);else if(d.h[k.text]instanceof Sg){var q=d.h[k.text];h.push(new Ng(q.f,q.b));r.push.apply(r,q.b)}else throw Error("'"+k.text+"' is neither a simple property nor an inset shorthand");break;case 19:if(0<h.length||c)throw Error("unexpected slash");c=!0;break;
case 14:n.push({le:c,hb:h});h=[];c=!1;break;case 15:var z=new Og(h,c),y=n.pop(),h=y.hb;c=y.le;h.push(z);break;case 17:g=!0;S(e);break;default:throw Error("unexpected token");}m.Vd(h,r);d.h[l]=m}d.j=fh(d,["background"]);d.w=fh(d,"margin border padding columns column-gap column-rule column-fill".split(" "))}else u.error("Error: missing",b)}catch(A){u.error(A,"Error:")}O(a,d)});return M(a)},"validatorFetcher");var ih={azimuth:!0,"border-collapse":!0,"border-spacing":!0,"caption-side":!0,"clip-rule":!0,color:!0,"color-interpolation":!0,"color-rendering":!0,cursor:!0,direction:!0,elevation:!0,"empty-cells":!0,fill:!0,"fill-opacity":!0,"fill-rule":!0,"font-kerning":!0,"font-size":!0,"font-size-adjust":!0,"font-family":!0,"font-feature-settings":!0,"font-style":!0,"font-stretch":!0,"font-variant":!0,"font-weight":!0,"glyph-orientation-vertical":!0,hyphens:!0,"hyphenate-character":!0,"hyphenate-limit-chars":!0,
"hyphenate-limit-last":!0,"image-rendering":!0,"image-resolution":!0,"letter-spacing":!0,"line-break":!0,"line-height":!0,"list-style-image":!0,"list-style-position":!0,"list-style-type":!0,marker:!0,"marker-end":!0,"marker-mid":!0,"marker-start":!0,orphans:!0,"overflow-wrap":!0,"paint-order":!0,"pointer-events":!0,"pitch-range":!0,quotes:!0,richness:!0,"ruby-align":!0,"ruby-position":!0,"speak-header":!0,"speak-numeral":!0,"speak-punctuation":!0,"speech-rate":!0,"shape-rendering":!0,stress:!0,stroke:!0,
"stroke-dasharray":!0,"stroke-dashoffset":!0,"stroke-linecap":!0,"stroke-linejoin":!0,"stroke-miterlimit":!0,"stroke-opacity":!0,"stroke-width":!0,"tab-size":!0,"text-align":!0,"text-align-last":!0,"text-anchor":!0,"text-decoration-skip":!0,"text-emphasis-color":!0,"text-emphasis-position":!0,"text-emphasis-style":!0,"text-combine-upright":!0,"text-indent":!0,"text-justify":!0,"text-rendering":!0,"text-size-adjust":!0,"text-transform":!0,"text-underline-position":!0,visibility:!0,"voice-family":!0,
volume:!0,"white-space":!0,widows:!0,"word-break":!0,"word-spacing":!0,"word-wrap":!0,"writing-mode":!0},jh=["box-decoration-break","image-resolution","orphans","widows"];function kh(){return(Jd.POLYFILLED_INHERITED_PROPS||[]).reduce(function(a,b){return a.concat(b())},[].concat(jh))}
for(var lh={"http://www.idpf.org/2007/ops":!0,"http://www.w3.org/1999/xhtml":!0,"http://www.w3.org/2000/svg":!0},mh="margin-% padding-% border-%-width border-%-style border-%-color %".split(" "),nh=["left","right","top","bottom"],oh={width:!0,height:!0},ph=0;ph<mh.length;ph++)for(var qh=0;qh<nh.length;qh++){var rh=mh[ph].replace("%",nh[qh]);oh[rh]=!0}function sh(a){for(var b={},c=0;c<mh.length;c++)for(var d in a){var e=mh[c].replace("%",d),f=mh[c].replace("%",a[d]);b[e]=f;b[f]=e}return b}
var th=sh({before:"right",after:"left",start:"top",end:"bottom"}),uh=sh({before:"top",after:"bottom",start:"left",end:"right"});function V(a,b){this.value=a;this.Ta=b}p=V.prototype;p.Ce=function(){return this};p.Vc=function(a){a=this.value.ba(a);return a===this.value?this:new V(a,this.Ta)};p.Ee=function(a){return a?new V(this.value,this.Ta+a):this};p.evaluate=function(a,b){return Qf(a,this.value,b)};p.qe=function(){return!0};function vh(a,b,c){V.call(this,a,b);this.W=c}t(vh,V);
vh.prototype.Ce=function(){return new V(this.value,this.Ta)};vh.prototype.Vc=function(a){a=this.value.ba(a);return a===this.value?this:new vh(a,this.Ta,this.W)};vh.prototype.Ee=function(a){return a?new vh(this.value,this.Ta+a,this.W):this};vh.prototype.qe=function(a){return!!this.W.evaluate(a)};function wh(a,b,c){return(!b||c.Ta>b.Ta)&&c.qe(a)?c.Ce():b}var xh={"region-id":!0};function yh(a){return"_"!=a.charAt(0)&&!xh[a]}function zh(a,b,c){c?a[b]=c:delete a[b]}
function Ah(a,b){var c=a[b];c||(c={},a[b]=c);return c}function Bh(a,b){var c=a[b];c||(c=[],a[b]=c);return c}function Ch(a,b,c,d,e,f){if(e){var g=Ah(b,"_pseudos");b=g[e];b||(b={},g[e]=b)}f&&(e=Ah(b,"_regions"),b=e[f],b||(b={},e[f]=b));for(var h in c)"_"!=h.charAt(0)&&(xh[h]?(f=c[h],e=Bh(b,h),Array.prototype.push.apply(e,f)):zh(b,h,wh(a,b[h],c[h].Ee(d))))}
function Dh(a,b){if(0<a.length){a.sort(function(a,b){return b.f()-a.f()});for(var c=null,d=a.length-1;0<=d;d--)c=a[d],c.b=b,b=c;return c}return b}function Eh(a,b){this.g=a;this.b=b;this.f=""}t(Eh,qc);function Fh(a){a=a.g["font-size"].value;var b;a:switch(a.fa.toLowerCase()){case "px":case "in":case "pt":case "pc":case "cm":case "mm":case "q":b=!0;break a;default:b=!1}if(!b)throw Error("Unexpected state");return a.I*yb[a.fa]}
Eh.prototype.qc=function(a){if("em"==a.fa||"ex"==a.fa){var b=Cb(this.b,a.fa,!1)/Cb(this.b,"em",!1);return new D(a.I*b*Fh(this),"px")}if("rem"==a.fa||"rex"==a.fa)return b=Cb(this.b,a.fa,!1)/Cb(this.b,"rem",!1),new D(a.I*b*this.b.fontSize(),"px");if("%"==a.fa){if("font-size"===this.f)return new D(a.I/100*Fh(this),"px");if("line-height"===this.f)return a;b=this.f.match(/height|^(top|bottom)$/)?"vh":"vw";return new D(a.I,b)}return a};
Eh.prototype.mc=function(a){return"font-size"==this.f?Qf(this.b,a,this.f).ba(this):a};function Gh(){}Gh.prototype.apply=function(){};Gh.prototype.l=function(a){return new Hh([this,a])};Gh.prototype.clone=function(){return this};function Ih(a){this.b=a}t(Ih,Gh);Ih.prototype.apply=function(a){a.h[a.h.length-1].push(this.b.b())};function Hh(a){this.b=a}t(Hh,Gh);Hh.prototype.apply=function(a){for(var b=0;b<this.b.length;b++)this.b[b].apply(a)};Hh.prototype.l=function(a){this.b.push(a);return this};
Hh.prototype.clone=function(){return new Hh([].concat(this.b))};function Jh(a,b,c,d){this.style=a;this.Z=b;this.b=c;this.h=d}t(Jh,Gh);Jh.prototype.apply=function(a){Ch(a.l,a.F,this.style,this.Z,this.b,this.h)};function W(){this.b=null}t(W,Gh);W.prototype.apply=function(a){this.b.apply(a)};W.prototype.f=function(){return 0};W.prototype.g=function(){return!1};function Kh(a){this.b=null;this.h=a}t(Kh,W);Kh.prototype.apply=function(a){0<=a.G.indexOf(this.h)&&this.b.apply(a)};Kh.prototype.f=function(){return 10};
Kh.prototype.g=function(a){this.b&&Lh(a.Ca,this.h,this.b);return!0};function Mh(a){this.b=null;this.id=a}t(Mh,W);Mh.prototype.apply=function(a){a.X!=this.id&&a.ga!=this.id||this.b.apply(a)};Mh.prototype.f=function(){return 11};Mh.prototype.g=function(a){this.b&&Lh(a.g,this.id,this.b);return!0};function Nh(a){this.b=null;this.localName=a}t(Nh,W);Nh.prototype.apply=function(a){a.f==this.localName&&this.b.apply(a)};Nh.prototype.f=function(){return 8};
Nh.prototype.g=function(a){this.b&&Lh(a.Mc,this.localName,this.b);return!0};function Oh(a,b){this.b=null;this.h=a;this.localName=b}t(Oh,W);Oh.prototype.apply=function(a){a.f==this.localName&&a.j==this.h&&this.b.apply(a)};Oh.prototype.f=function(){return 8};Oh.prototype.g=function(a){if(this.b){var b=a.b[this.h];b||(b="ns"+a.j++ +":",a.b[this.h]=b);Lh(a.h,b+this.localName,this.b)}return!0};function Ph(a){this.b=null;this.h=a}t(Ph,W);
Ph.prototype.apply=function(a){var b=a.b;if(b&&"a"==a.f){var c=b.getAttribute("href");c&&c.match(/^#/)&&(b=b.ownerDocument.getElementById(c.substring(1)))&&(b=b.getAttributeNS("http://www.idpf.org/2007/ops","type"))&&b.match(this.h)&&this.b.apply(a)}};function Qh(a){this.b=null;this.h=a}t(Qh,W);Qh.prototype.apply=function(a){a.j==this.h&&this.b.apply(a)};function Rh(a,b){this.b=null;this.h=a;this.name=b}t(Rh,W);Rh.prototype.apply=function(a){a.b&&a.b.hasAttributeNS(this.h,this.name)&&this.b.apply(a)};
function Sh(a,b,c){this.b=null;this.h=a;this.name=b;this.value=c}t(Sh,W);Sh.prototype.apply=function(a){a.b&&a.b.getAttributeNS(this.h,this.name)==this.value&&this.b.apply(a)};Sh.prototype.f=function(){return"type"==this.name&&"http://www.idpf.org/2007/ops"==this.h?9:0};Sh.prototype.g=function(a){return"type"==this.name&&"http://www.idpf.org/2007/ops"==this.h?(this.b&&Lh(a.f,this.value,this.b),!0):!1};function Th(a,b){this.b=null;this.h=a;this.name=b}t(Th,W);
Th.prototype.apply=function(a){if(a.b){var b=a.b.getAttributeNS(this.h,this.name);b&&lh[b]&&this.b.apply(a)}};Th.prototype.f=function(){return 0};Th.prototype.g=function(){return!1};function Uh(a,b,c){this.b=null;this.j=a;this.name=b;this.h=c}t(Uh,W);Uh.prototype.apply=function(a){if(a.b){var b=a.b.getAttributeNS(this.j,this.name);b&&b.match(this.h)&&this.b.apply(a)}};function Vh(a){this.b=null;this.h=a}t(Vh,W);Vh.prototype.apply=function(a){a.lang.match(this.h)&&this.b.apply(a)};
function Wh(){this.b=null}t(Wh,W);Wh.prototype.apply=function(a){a.Va&&this.b.apply(a)};Wh.prototype.f=function(){return 6};function Xh(){this.b=null}t(Xh,W);Xh.prototype.apply=function(a){a.ta&&this.b.apply(a)};Xh.prototype.f=function(){return 12};function Yh(a,b){this.b=null;this.h=a;this.uc=b}t(Yh,W);function Zh(a,b){var c=a.h;b-=a.uc;return c?!(b%c)&&0<=b/c:!b}function $h(a,b){Yh.call(this,a,b)}t($h,Yh);$h.prototype.apply=function(a){Zh(this,a.La)&&this.b.apply(a)};$h.prototype.f=function(){return 5};
function ai(a,b){Yh.call(this,a,b)}t(ai,Yh);ai.prototype.apply=function(a){Zh(this,a.wb[a.j][a.f])&&this.b.apply(a)};ai.prototype.f=function(){return 5};function bi(a,b){Yh.call(this,a,b)}t(bi,Yh);bi.prototype.apply=function(a){var b=a.V;null===b&&(b=a.V=a.b.parentNode.childElementCount-a.La+1);Zh(this,b)&&this.b.apply(a)};bi.prototype.f=function(){return 4};function ci(a,b){Yh.call(this,a,b)}t(ci,Yh);
ci.prototype.apply=function(a){var b=a.vb;if(!b[a.j]){var c=a.b;do{var d=c.namespaceURI,e=c.localName,f=b[d];f||(f=b[d]={});f[e]=(f[e]||0)+1}while(c=c.nextElementSibling)}Zh(this,b[a.j][a.f])&&this.b.apply(a)};ci.prototype.f=function(){return 4};function di(){this.b=null}t(di,W);di.prototype.apply=function(a){for(var b=a.b.firstChild;b;){switch(b.nodeType){case Node.ELEMENT_NODE:return;case Node.TEXT_NODE:if(0<b.length)return}b=b.nextSibling}this.b.apply(a)};di.prototype.f=function(){return 4};
function ei(){this.b=null}t(ei,W);ei.prototype.apply=function(a){!1===a.b.disabled&&this.b.apply(a)};ei.prototype.f=function(){return 5};function fi(){this.b=null}t(fi,W);fi.prototype.apply=function(a){!0===a.b.disabled&&this.b.apply(a)};fi.prototype.f=function(){return 5};function gi(){this.b=null}t(gi,W);gi.prototype.apply=function(a){var b=a.b;!0!==b.selected&&!0!==b.checked||this.b.apply(a)};gi.prototype.f=function(){return 5};function hi(a){this.b=null;this.W=a}t(hi,W);
hi.prototype.apply=function(a){a.w[this.W]&&this.b.apply(a)};hi.prototype.f=function(){return 5};function ii(){this.b=!1}t(ii,Gh);ii.prototype.apply=function(){this.b=!0};ii.prototype.clone=function(){var a=new ii;a.b=this.b;return a};function ji(a){this.b=null;this.h=new ii;this.j=Dh(a,this.h)}t(ji,W);ji.prototype.apply=function(a){this.j.apply(a);this.h.b||this.b.apply(a);this.h.b=!1};ji.prototype.f=function(){return this.j.f()};function ki(a){this.W=a}ki.prototype.b=function(){return this};
ki.prototype.push=function(a,b){b||li(a,this.W);return!1};ki.prototype.pop=function(a,b){return b?!1:(a.w[this.W]--,!0)};function mi(a){this.W=a}mi.prototype.b=function(){return this};mi.prototype.push=function(a,b){b?1==b&&a.w[this.W]--:li(a,this.W);return!1};mi.prototype.pop=function(a,b){if(b)1==b&&li(a,this.W);else return a.w[this.W]--,!0;return!1};function ni(a){this.W=a;this.f=!1}ni.prototype.b=function(){return new ni(this.W)};
ni.prototype.push=function(a){return this.f?(a.w[this.W]--,!0):!1};ni.prototype.pop=function(a,b){if(this.f)return a.w[this.W]--,!0;b||(this.f=!0,li(a,this.W));return!1};function oi(a){this.W=a;this.f=!1}oi.prototype.b=function(){return new oi(this.W)};oi.prototype.push=function(a,b){this.f&&(-1==b?li(a,this.W):b||a.w[this.W]--);return!1};oi.prototype.pop=function(a,b){if(this.f){if(-1==b)return a.w[this.W]--,!0;b||li(a,this.W)}else b||(this.f=!0,li(a,this.W));return!1};
function pi(a,b){this.f=a;this.element=b}pi.prototype.b=function(){return this};pi.prototype.push=function(){return!1};pi.prototype.pop=function(a,b){return b?!1:(qi(a,this.f,this.element),!0)};function ri(a){this.lang=a}ri.prototype.b=function(){return this};ri.prototype.push=function(){return!1};ri.prototype.pop=function(a,b){return b?!1:(a.lang=this.lang,!0)};function si(a){this.f=a}si.prototype.b=function(){return this};si.prototype.push=function(){return!1};
si.prototype.pop=function(a,b){return b?!1:(a.J=this.f,!0)};function ti(a){this.element=a}t(ti,qc);function ui(a,b){switch(b){case "url":return a?new Fc(a):new Fc("about:invalid");default:return a?new Ac(a):new Ac("")}}
ti.prototype.zb=function(a){if("attr"!==a.name)return qc.prototype.zb.call(this,a);var b="string",c;a.values[0]instanceof rc?(2<=a.values[0].values.length&&(b=a.values[0].values[1].stringValue()),c=a.values[0].values[0].stringValue()):c=a.values[0].stringValue();a=1<a.values.length?ui(a.values[1].stringValue(),b):ui(null,b);return this.element&&this.element.hasAttribute(c)?ui(this.element.getAttribute(c),b):a};function vi(a,b,c){this.f=a;this.element=b;this.b=c}t(vi,qc);
vi.prototype.Ob=function(a){var b=this.f,c=b.J,d=Math.floor(c.length/2)-1;switch(a.name){case "open-quote":a=c[2*Math.min(d,b.C)];b.C++;break;case "close-quote":return 0<b.C&&b.C--,c[2*Math.min(d,b.C)+1];case "no-open-quote":return b.C++,new Ac("");case "no-close-quote":return 0<b.C&&b.C--,new Ac("")}return a};
var wi={roman:[4999,1E3,"M",900,"CM",500,"D",400,"CD",100,"C",90,"XC",50,"L",40,"XL",10,"X",9,"IX",5,"V",4,"IV",1,"I"],armenian:[9999,9E3,"\u0584",8E3,"\u0583",7E3,"\u0582",6E3,"\u0581",5E3,"\u0580",4E3,"\u057f",3E3,"\u057e",2E3,"\u057d",1E3,"\u057c",900,"\u057b",800,"\u057a",700,"\u0579",600,"\u0578",500,"\u0577",400,"\u0576",300,"\u0575",200,"\u0574",100,"\u0573",90,"\u0572",80,"\u0571",70,"\u0570",60,"\u056f",50,"\u056e",40,"\u056d",30,"\u056c",20,"\u056b",10,"\u056a",9,"\u0569",8,"\u0568",7,"\u0567",
6,"\u0566",5,"\u0565",4,"\u0564",3,"\u0563",2,"\u0562",1,"\u0561"],georgian:[19999,1E4,"\u10f5",9E3,"\u10f0",8E3,"\u10ef",7E3,"\u10f4",6E3,"\u10ee",5E3,"\u10ed",4E3,"\u10ec",3E3,"\u10eb",2E3,"\u10ea",1E3,"\u10e9",900,"\u10e8",800,"\u10e7",700,"\u10e6",600,"\u10e5",500,"\u10e4",400,"\u10f3",300,"\u10e2",200,"\u10e1",100,"\u10e0",90,"\u10df",80,"\u10de",70,"\u10dd",60,"\u10f2",50,"\u10dc",40,"\u10db",30,"\u10da",20,"\u10d9",10,"\u10d8",9,"\u10d7",8,"\u10f1",7,"\u10d6",6,"\u10d5",5,"\u10d4",4,"\u10d3",
3,"\u10d2",2,"\u10d1",1,"\u10d0"],hebrew:[999,400,"\u05ea",300,"\u05e9",200,"\u05e8",100,"\u05e7",90,"\u05e6",80,"\u05e4",70,"\u05e2",60,"\u05e1",50,"\u05e0",40,"\u05de",30,"\u05dc",20,"\u05db",19,"\u05d9\u05d8",18,"\u05d9\u05d7",17,"\u05d9\u05d6",16,"\u05d8\u05d6",15,"\u05d8\u05d5",10,"\u05d9",9,"\u05d8",8,"\u05d7",7,"\u05d6",6,"\u05d5",5,"\u05d4",4,"\u05d3",3,"\u05d2",2,"\u05d1",1,"\u05d0"]},xi={latin:"a-z",alpha:"a-z",greek:"\u03b1-\u03c1\u03c3-\u03c9",russian:"\u0430-\u0438\u043a-\u0449\u044d-\u044f"},
yi={square:"\u25a0",disc:"\u2022",circle:"\u25e6",none:""},zi={Of:!1,xc:"\u96f6\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d",$c:"\u5341\u767e\u5343",ff:"\u8ca0"};
function Ai(a){if(9999<a||-9999>a)return""+a;if(!a)return zi.xc.charAt(0);var b=new Da;0>a&&(b.append(zi.ff),a=-a);if(10>a)b.append(zi.xc.charAt(a));else if(zi.Pf&&19>=a)b.append(zi.$c.charAt(0)),a&&b.append(zi.$c.charAt(a-10));else{var c=Math.floor(a/1E3);c&&(b.append(zi.xc.charAt(c)),b.append(zi.$c.charAt(2)));if(c=Math.floor(a/100)%10)b.append(zi.xc.charAt(c)),b.append(zi.$c.charAt(1));if(c=Math.floor(a/10)%10)b.append(zi.xc.charAt(c)),b.append(zi.$c.charAt(0));(a%=10)&&b.append(zi.xc.charAt(a))}return b.toString()}
function Bi(a,b){var c=!1,d=!1,e;if(e=b.match(/^upper-(.*)/))c=!0,b=e[1];else if(e=b.match(/^lower-(.*)/))d=!0,b=e[1];e="";if(wi[b])a:{e=wi[b];var f=a;if(f>e[0]||0>=f||f!=Math.round(f))e="";else{for(var g="",h=1;h<e.length;h+=2){var l=e[h],k=Math.floor(f/l);if(20<k){e="";break a}for(f-=k*l;0<k;)g+=e[h+1],k--}e=g}}else if(xi[b])if(e=a,0>=e||e!=Math.round(e))e="";else{g=xi[b];f=[];for(h=0;h<g.length;)if("-"==g.substr(h+1,1))for(k=g.charCodeAt(h),l=g.charCodeAt(h+2),h+=3;k<=l;k++)f.push(String.fromCharCode(k));
else f.push(g.substr(h++,1));g="";do e--,h=e%f.length,g=f[h]+g,e=(e-h)/f.length;while(0<e);e=g}else null!=yi[b]?e=yi[b]:"decimal-leading-zero"==b?(e=a+"",1==e.length&&(e="0"+e)):"cjk-ideographic"==b||"trad-chinese-informal"==b?e=Ai(a):e=a+"";return c?e.toUpperCase():d?e.toLowerCase():e}
function Ci(a,b){var c=b[0].toString(),d=1<b.length?b[1].stringValue():"decimal",e=a.f.g[c];if(e&&e.length)return new Ac(Bi(e&&e.length&&e[e.length-1]||0,d));c=new E(Di(a.b,c,function(a){return Bi(a||0,d)}));return new rc([c])}
function Ei(a,b){var c=b[0].toString(),d=b[1].stringValue(),e=2<b.length?b[2].stringValue():"decimal",f=a.f.g[c],g=new Da;if(f&&f.length)for(var h=0;h<f.length;h++)0<h&&g.append(d),g.append(Bi(f[h],e));c=new E(Fi(a.b,c,function(a){var b=[];if(a.length)for(var c=0;c<a.length;c++)b.push(Bi(a[c],e));a=g.toString();a.length&&b.push(a);return b.length?b.join(d):Bi(0,e)}));return new rc([c])}
function Gi(a,b){var c=b[0],c=c instanceof Fc?c.url:c.stringValue(),d=b[1].toString(),e=2<b.length?b[2].stringValue():"decimal",c=new E(Hi(a.b,c,d,function(a){return Bi(a||0,e)}));return new rc([c])}function Ii(a,b){var c=b[0],c=c instanceof Fc?c.url:c.stringValue(),d=b[1].toString(),e=b[2].stringValue(),f=3<b.length?b[3].stringValue():"decimal",c=new E(Ji(a.b,c,d,function(a){a=a.map(function(a){return Bi(a,f)});return a.length?a.join(e):Bi(0,f)}));return new rc([c])}
vi.prototype.zb=function(a){switch(a.name){case "counter":if(2>=a.values.length)return Ci(this,a.values);break;case "counters":if(3>=a.values.length)return Ei(this,a.values);break;case "target-counter":if(3>=a.values.length)return Gi(this,a.values);break;case "target-counters":if(4>=a.values.length)return Ii(this,a.values)}u.b("E_CSS_CONTENT_PROP:",a.toString());return new Ac("")};var Ki=1/1048576;function Li(a,b){for(var c in a)b[c]=a[c].clone()}
function Mi(){this.j=0;this.b={};this.Mc={};this.h={};this.f={};this.Ca={};this.g={};this.Dc={};this.order=0}Mi.prototype.clone=function(){var a=new Mi;a.j=this.j;for(var b in this.b)a.b[b]=this.b[b];Li(this.Mc,a.Mc);Li(this.h,a.h);Li(this.f,a.f);Li(this.Ca,a.Ca);Li(this.g,a.g);Li(this.Dc,a.Dc);a.order=this.order;return a};function Lh(a,b,c){var d=a[b];d&&(c=d.l(c));a[b]=c}Mi.prototype.ie=function(){return this.order+=Ki};
function Ni(a,b,c,d){this.A=a;this.l=b;this.sc=c;this.pb=d;this.h=[[],[]];this.w={};this.G=this.F=this.b=null;this.xa=this.ga=this.X=this.j=this.f="";this.Y=this.O=null;this.ta=this.Va=!0;this.g={};this.H=[{}];this.J=[new Ac("\u201c"),new Ac("\u201d"),new Ac("\u2018"),new Ac("\u2019")];this.C=0;this.lang="";this.bc=[0];this.La=0;this.na=[{}];this.wb=this.na[0];this.V=null;this.Ab=[this.V];this.ac=[{}];this.vb=this.na[0];this.xb=[]}function li(a,b){a.w[b]=(a.w[b]||0)+1}
function Oi(a,b,c){(b=b[c])&&b.apply(a)}var Pi=[];function Qi(a,b,c,d){a.b=null;a.F=d;a.j="";a.f="";a.X="";a.ga="";a.G=b;a.xa="";a.O=Pi;a.Y=c;Ri(a)}function Si(a,b,c){a.g[b]?a.g[b].push(c):a.g[b]=[c];c=a.H[a.H.length-1];c||(c={},a.H[a.H.length-1]=c);c[b]=!0}
function Ti(a,b){var c=cd,d=b.display;d&&(c=d.evaluate(a.l));var e=null,f=d=null,g=b["counter-reset"];g&&(g=g.evaluate(a.l))&&(e=vg(g,!0));(g=b["counter-set"])&&(g=g.evaluate(a.l))&&(f=vg(g,!1));(g=b["counter-increment"])&&(g=g.evaluate(a.l))&&(d=vg(g,!1));"ol"!=a.f&&"ul"!=a.f||"http://www.w3.org/1999/xhtml"!=a.j||(e||(e={}),e["ua-list-item"]=0);c===id&&(d||(d={}),d["ua-list-item"]=1);if(e)for(var h in e)Si(a,h,e[h]);if(f)for(var l in f)a.g[l]?(h=a.g[l],h[h.length-1]=f[l]):Si(a,l,f[l]);if(d)for(var k in d)a.g[k]||
Si(a,k,0),h=a.g[k],h[h.length-1]+=d[k];c===id&&(c=a.g["ua-list-item"],b["ua-list-item-count"]=new V(new Cc(c[c.length-1]),0));a.H.push(null)}function Ui(a){var b=a.H.pop();if(b)for(var c in b)(b=a.g[c])&&(1==b.length?delete a.g[c]:b.pop())}function qi(a,b,c){Ti(a,b);b.content&&(b.content=b.content.Vc(new vi(a,c,a.pb)));Ui(a)}var Vi="before transclusion-before footnote-call footnote-marker inner first-letter first-line  transclusion-after after".split(" ");
function Wi(a,b,c){a.xb.push(b);a.Y=null;a.b=b;a.F=c;a.j=b.namespaceURI;a.f=b.localName;var d=a.A.b[a.j];a.xa=d?d+a.f:"";a.X=b.getAttribute("id");a.ga=b.getAttributeNS("http://www.w3.org/XML/1998/namespace","id");(d=b.getAttribute("class"))?a.G=d.split(/\s+/):a.G=Pi;(d=b.getAttributeNS("http://www.idpf.org/2007/ops","type"))?a.O=d.split(/\s+/):a.O=Pi;"style"==a.f&&"http://www.gribuser.ru/xml/fictionbook/2.0"==a.j&&(a.G=[b.getAttribute("name")||""]);if(d=Ba(b))a.h[a.h.length-1].push(new ri(a.lang)),
a.lang=d.toLowerCase();var d=a.ta,e=a.bc;a.La=++e[e.length-1];e.push(0);var e=a.na,f=a.wb=e[e.length-1],g=f[a.j];g||(g=f[a.j]={});g[a.f]=(g[a.f]||0)+1;e.push({});e=a.Ab;null!==e[e.length-1]?a.V=--e[e.length-1]:a.V=null;e.push(null);e=a.ac;(f=a.vb=e[e.length-1])&&f[a.j]&&f[a.j][a.f]--;e.push({});Ri(a);Xi(a,b);e=c.quotes;c=null;e&&(e=e.evaluate(a.l))&&(c=new si(a.J),e===F?a.J=[new Ac(""),new Ac("")]:e instanceof rc&&(a.J=e.values));Ti(a,a.F);e=a.X||a.ga||b.getAttribute("name")||"";if(d||e){var h={};
Object.keys(a.g).forEach(function(a){h[a]=Array.from(this.g[a])},a);Yi(a.sc,e,h)}if(d=a.F._pseudos)for(e=!0,f=0;f<Vi.length;f++)(g=Vi[f])||(e=!1),(g=d[g])&&(e?qi(a,g,b):a.h[a.h.length-2].push(new pi(g,b)));c&&a.h[a.h.length-2].push(c)}function Zi(a,b){for(var c in b)yh(c)&&(b[c]=b[c].Vc(a))}function Xi(a,b){var c=new ti(b),d=a.F,e=d._pseudos,f;for(f in e)Zi(c,e[f]);Zi(c,d)}
function Ri(a){var b;for(b=0;b<a.G.length;b++)Oi(a,a.A.Ca,a.G[b]);for(b=0;b<a.O.length;b++)Oi(a,a.A.f,a.O[b]);Oi(a,a.A.g,a.X);Oi(a,a.A.Mc,a.f);""!=a.f&&Oi(a,a.A.Mc,"*");Oi(a,a.A.h,a.xa);null!==a.Y&&(Oi(a,a.A.Dc,a.Y),Oi(a,a.A.Dc,"*"));a.b=null;a.h.push([]);for(var c=1;-1<=c;--c){var d=a.h[a.h.length-c-2];for(b=0;b<d.length;)d[b].push(a,c)?d.splice(b,1):b++}a.Va=!0;a.ta=!1}
Ni.prototype.pop=function(){for(var a=1;-1<=a;--a)for(var b=this.h[this.h.length-a-2],c=0;c<b.length;)b[c].pop(this,a)?b.splice(c,1):c++;this.h.pop();this.Va=!1};var $i=null;function aj(a,b,c,d,e,f,g){jf.call(this,a,b,g);this.b=null;this.Z=0;this.h=this.Sa=null;this.A=!1;this.W=c;this.j=d?d.j:$i?$i.clone():new Mi;this.F=e;this.w=f;this.l=0}t(aj,kf);aj.prototype.Ge=function(a){Lh(this.j.Mc,"*",a)};function bj(a,b){var c=Dh(a.b,b);c!==b&&c.g(a.j)||a.Ge(c)}
aj.prototype.yb=function(a,b){if(b||a)this.Z+=1,b&&a?this.b.push(new Oh(a,b.toLowerCase())):b?this.b.push(new Nh(b.toLowerCase())):this.b.push(new Qh(a))};aj.prototype.ud=function(a){this.h?(u.b("::"+this.h,"followed by ."+a),this.b.push(new hi(""))):(this.Z+=256,this.b.push(new Kh(a)))};var cj={"nth-child":$h,"nth-of-type":ai,"nth-last-child":bi,"nth-last-of-type":ci};
aj.prototype.Ec=function(a,b){if(this.h)u.b("::"+this.h,"followed by :"+a),this.b.push(new hi(""));else{switch(a.toLowerCase()){case "enabled":this.b.push(new ei);break;case "disabled":this.b.push(new fi);break;case "checked":this.b.push(new gi);break;case "root":this.b.push(new Xh);break;case "link":this.b.push(new Nh("a"));this.b.push(new Rh("","href"));break;case "-adapt-href-epub-type":case "href-epub-type":if(b&&1==b.length&&"string"==typeof b[0]){var c=new RegExp("(^|s)"+qa(b[0])+"($|s)");this.b.push(new Ph(c))}else this.b.push(new hi(""));
break;case "-adapt-footnote-content":case "footnote-content":this.A=!0;break;case "visited":case "active":case "hover":case "focus":this.b.push(new hi(""));break;case "lang":b&&1==b.length&&"string"==typeof b[0]?this.b.push(new Vh(new RegExp("^"+qa(b[0].toLowerCase())+"($|-)"))):this.b.push(new hi(""));break;case "nth-child":case "nth-last-child":case "nth-of-type":case "nth-last-of-type":c=cj[a.toLowerCase()];b&&2==b.length?this.b.push(new c(b[0],b[1])):this.b.push(new hi(""));break;case "first-child":this.b.push(new Wh);
break;case "last-child":this.b.push(new bi(0,1));break;case "first-of-type":this.b.push(new ai(0,1));break;case "last-of-type":this.b.push(new ci(0,1));break;case "only-child":this.b.push(new Wh);this.b.push(new bi(0,1));break;case "only-of-type":this.b.push(new ai(0,1));this.b.push(new ci(0,1));break;case "empty":this.b.push(new di);break;case "before":case "after":case "first-line":case "first-letter":this.Fc(a,b);return;default:u.b("unknown pseudo-class selector: "+a),this.b.push(new hi(""))}this.Z+=
256}};
aj.prototype.Fc=function(a,b){switch(a){case "before":case "after":case "first-line":case "first-letter":case "footnote-call":case "footnote-marker":case "inner":this.h?(u.b("Double pseudoelement ::"+this.h+"::"+a),this.b.push(new hi(""))):this.h=a;break;case "first-n-lines":if(b&&1==b.length&&"number"==typeof b[0]){var c=Math.round(b[0]);if(0<c&&c==b[0]){this.h?(u.b("Double pseudoelement ::"+this.h+"::"+a),this.b.push(new hi(""))):this.h="first-"+c+"-lines";break}}default:u.b("Unrecognized pseudoelement: ::"+a),
this.b.push(new hi(""))}this.Z+=1};aj.prototype.Bd=function(a){this.Z+=65536;this.b.push(new Mh(a))};
aj.prototype.Sc=function(a,b,c,d){this.Z+=256;b=b.toLowerCase();d=d||"";var e;switch(c){case 0:e=new Rh(a,b);break;case 39:e=new Sh(a,b,d);break;case 45:!d||d.match(/\s/)?e=new hi(""):e=new Uh(a,b,new RegExp("(^|\\s)"+qa(d)+"($|\\s)"));break;case 44:e=new Uh(a,b,new RegExp("^"+qa(d)+"($|-)"));break;case 43:d?e=new Uh(a,b,new RegExp("^"+qa(d))):e=new hi("");break;case 42:d?e=new Uh(a,b,new RegExp(qa(d)+"$")):e=new hi("");break;case 46:d?e=new Uh(a,b,new RegExp(qa(d))):e=new hi("");break;case 50:"supported"==
d?e=new Th(a,b):(u.b("Unsupported :: attr selector op:",d),e=new hi(""));break;default:u.b("Unsupported attr selector:",c),e=new hi("")}this.b.push(e)};var dj=0;p=aj.prototype;p.Db=function(){var a="d"+dj++;bj(this,new Ih(new ki(a)));this.b=[new hi(a)]};p.sd=function(){var a="c"+dj++;bj(this,new Ih(new mi(a)));this.b=[new hi(a)]};p.qd=function(){var a="a"+dj++;bj(this,new Ih(new ni(a)));this.b=[new hi(a)]};p.xd=function(){var a="f"+dj++;bj(this,new Ih(new oi(a)));this.b=[new hi(a)]};
p.hc=function(){ej(this);this.h=null;this.A=!1;this.Z=0;this.b=[]};p.tb=function(){var a;0!=this.l?(mf(this,"E_CSS_UNEXPECTED_SELECTOR"),a=!0):a=!1;a||(this.l=1,this.Sa={},this.h=null,this.Z=0,this.A=!1,this.b=[])};p.error=function(a,b){kf.prototype.error.call(this,a,b);1==this.l&&(this.l=0)};p.kc=function(a){kf.prototype.kc.call(this,a);this.l=0};p.wa=function(){ej(this);kf.prototype.wa.call(this);1==this.l&&(this.l=0)};p.Eb=function(){kf.prototype.Eb.call(this)};
function ej(a){if(a.b){var b=a.Z+a.j.ie();bj(a,a.Le(b));a.b=null;a.h=null;a.A=!1;a.Z=0}}p.Le=function(a){var b=this.F;this.A&&(b=b?"xxx-bogus-xxx":"footnote");return new Jh(this.Sa,a,this.h,b)};p.rb=function(a,b,c){gh(this.w,a,b,c,this)};p.Ac=function(a,b){lf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};p.nd=function(a,b){lf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};
p.sb=function(a,b,c){"display"!=a||b!==md&&b!==ld||(this.sb("flow-options",new rc([Wc,rd]),c),this.sb("flow-into",b,c),b=Mc);(Jd.SIMPLE_PROPERTY||[]).forEach(function(d){d=d({name:a,value:b,important:c});a=d.name;b=d.value;c=d.important});var d=c?ef(this):ff(this);zh(this.Sa,a,this.W?new vh(b,d,this.W):new V(b,d))};p.Jc=function(a){switch(a){case "not":a=new fj(this),a.tb(),hf(this.ja,a)}};function fj(a){aj.call(this,a.f,a.ja,a.W,a,a.F,a.w,!1);this.parent=a;this.g=a.b}t(fj,aj);p=fj.prototype;
p.Jc=function(a){"not"==a&&mf(this,"E_CSS_UNEXPECTED_NOT")};p.wa=function(){mf(this,"E_CSS_UNEXPECTED_RULE_BODY")};p.hc=function(){mf(this,"E_CSS_UNEXPECTED_NEXT_SELECTOR")};p.Uc=function(){this.b&&0<this.b.length&&this.g.push(new ji(this.b));this.parent.Z+=this.Z;var a=this.ja;a.b=a.g.pop()};p.error=function(a,b){aj.prototype.error.call(this,a,b);var c=this.ja;c.b=c.g.pop()};function gj(a,b){jf.call(this,a,b,!1)}t(gj,kf);
gj.prototype.rb=function(a,b){if(this.f.values[a])this.error("E_CSS_NAME_REDEFINED "+a,this.zc());else{var c=a.match(/height|^(top|bottom)$/)?"vh":"vw",c=new ec(this.f,100,c),c=b.ra(this.f,c);this.f.values[a]=c}};function hj(a,b,c,d,e){jf.call(this,a,b,!1);this.Sa=d;this.W=c;this.b=e}t(hj,kf);hj.prototype.rb=function(a,b,c){c?u.b("E_IMPORTANT_NOT_ALLOWED"):gh(this.b,a,b,c,this)};hj.prototype.Ac=function(a,b){u.b("E_INVALID_PROPERTY_VALUE",a+":",b.toString())};
hj.prototype.nd=function(a,b){u.b("E_INVALID_PROPERTY",a+":",b.toString())};hj.prototype.sb=function(a,b,c){c=c?ef(this):ff(this);c+=this.order;this.order+=Ki;zh(this.Sa,a,this.W?new vh(b,c,this.W):new V(b,c))};function ij(a,b){Jf.call(this,a);this.Sa={};this.b=b;this.order=0}t(ij,Jf);ij.prototype.rb=function(a,b,c){gh(this.b,a,b,c,this)};ij.prototype.Ac=function(a,b){u.b("E_INVALID_PROPERTY_VALUE",a+":",b.toString())};ij.prototype.nd=function(a,b){u.b("E_INVALID_PROPERTY",a+":",b.toString())};
ij.prototype.sb=function(a,b,c){c=(c?67108864:50331648)+this.order;this.order+=Ki;zh(this.Sa,a,new V(b,c))};function jj(a,b,c){return(a=a["writing-mode"])&&(b=a.evaluate(b,"writing-mode"))&&b!==bd?b===zd:c}function kj(a,b,c,d){var e={},f;for(f in a)yh(f)&&(e[f]=a[f]);a=a._regions;if((c||d)&&a)for(d&&(d=["footnote"],c=c?c.concat(d):d),d=0;d<c.length;d++){f=a[c[d]];for(var g in f)yh(g)&&(e[g]=wh(b,e[g],f[g]))}return e}
function lj(a,b,c,d){c=c?th:uh;for(var e in a)if(a.hasOwnProperty(e)){var f=a[e];if(f){var g=c[e];if(g){var h=a[g];if(h&&h.Ta>f.Ta)continue;g=oh[g]?g:e}else g=e;b[g]=d(e,f)}}};var mj=!1,nj={Df:"ltr",Ef:"rtl"};ba("vivliostyle.constants.PageProgression",nj);nj.LTR="ltr";nj.RTL="rtl";var oj={Ue:"left",Ve:"right"};ba("vivliostyle.constants.PageSide",oj);oj.LEFT="left";oj.RIGHT="right";var pj={LOADING:"loading",Cf:"interactive",zf:"complete"};ba("vivliostyle.constants.ReadyState",pj);pj.LOADING="loading";pj.INTERACTIVE="interactive";pj.COMPLETE="complete";function qj(a,b,c){this.w=a;this.url=b;this.b=c;this.lang=null;this.h=-1;this.root=c.documentElement;b=a=null;if("http://www.w3.org/1999/xhtml"==this.root.namespaceURI){for(var d=this.root.firstChild;d;d=d.nextSibling)if(1==d.nodeType&&(c=d,"http://www.w3.org/1999/xhtml"==c.namespaceURI))switch(c.localName){case "head":b=c;break;case "body":a=c}this.lang=this.root.getAttribute("lang")}else if("http://www.gribuser.ru/xml/fictionbook/2.0"==this.root.namespaceURI){b=this.root;for(d=this.root.firstChild;d;d=
d.nextSibling)1==d.nodeType&&(c=d,"http://www.gribuser.ru/xml/fictionbook/2.0"==c.namespaceURI&&"body"==c.localName&&(a=c));c=rj(rj(rj(rj(new sj([this.b]),"FictionBook"),"description"),"title-info"),"lang").textContent();0<c.length&&(this.lang=c[0])}else if("http://example.com/sse"==this.root.namespaceURI)for(c=this.root.firstElementChild;c;c=c.nextElementSibling)d=c.localName,"meta"===d?b=c:"body"===d&&(a=c);this.body=a;this.l=b;this.g=this.root;this.j=1;this.g.setAttribute("data-adapt-eloff","0")}
function tj(a,b){var c=b.getAttribute("data-adapt-eloff");if(c)return parseInt(c,10);for(var c=a.j,d=a.g;d!=b;){var e=d.firstChild;if(!e)for(;!(e=d.nextSibling);)if(d=d.parentNode,!d)throw Error("Internal error");d=e;1==e.nodeType?(e.setAttribute("data-adapt-eloff",c.toString()),++c):c+=e.textContent.length}a.j=c;a.g=b;return c-1}
function uj(a,b,c,d){var e=0;if(1==b.nodeType){if(!d)return tj(a,b)}else{e=c;c=b.previousSibling;if(!c)return b=b.parentNode,e+=1,tj(a,b)+e;b=c}for(;;){for(;b.lastChild;)b=b.lastChild;if(1==b.nodeType)break;e+=b.textContent.length;c=b.previousSibling;if(!c){b=b.parentNode;break}b=c}e+=1;return tj(a,b)+e}function vj(a){0>a.h&&(a.h=uj(a,a.root,0,!0));return a.h}
function wj(a,b){for(var c,d=a.root;;){c=tj(a,d);if(c>=b)return d;var e=d.children;if(!e)break;var f=La(e.length,function(c){return tj(a,e[c])>b});if(!f)break;if(f<e.length&&tj(a,e[f])<=b)throw Error("Consistency check failed!");d=e[f-1]}c+=1;for(var f=d,g=f.firstChild||f.nextSibling,h=null;;){if(g){if(1==g.nodeType)break;h=f=g;c+=g.textContent.length;if(c>b)break}else if(f=f.parentNode,!f)break;g=f.nextSibling}return h||d}
function xj(a,b){var c=b.getAttribute("id");c&&!a.f[c]&&(a.f[c]=b);(c=b.getAttributeNS("http://www.w3.org/XML/1998/namespace","id"))&&!a.f[c]&&(a.f[c]=b);for(c=b.firstElementChild;c;c=c.nextElementSibling)xj(a,c)}function yj(a,b){var c=b.match(/([^#]*)\#(.+)$/);if(!c||c[1]&&c[1]!=a.url)return null;var c=c[2],d=a.b.getElementById(c);!d&&a.b.getElementsByName&&(d=a.b.getElementsByName(c)[0]);d||(a.f||(a.f={},xj(a,a.b.documentElement)),d=a.f[c]);return d}
var zj={Hf:"text/html",If:"text/xml",uf:"application/xml",tf:"application/xhtml_xml",Bf:"image/svg+xml"};function Aj(a,b,c){c=c||new DOMParser;var d;try{d=c.parseFromString(a,b)}catch(e){}if(d){a=d.documentElement;if("parsererror"===a.localName)return null;for(a=a.firstChild;a;a=a.nextSibling)if("parsererror"===a.localName)return null}else return null;return d}
function Bj(a){var b=a.contentType;if(b){for(var c=Object.keys(zj),d=0;d<c.length;d++)if(zj[c[d]]===b)return b;if(b.match(/\+xml$/))return"application/xml"}if(a=a.url.match(/\.([^./]+)$/))switch(a[1]){case "html":case "htm":return"text/html";case "xhtml":case "xht":return"application/xhtml_xml";case "svg":case "svgz":return"image/svg+xml";case "opf":case "xml":return"application/xml"}return null}
function Cj(a,b){var c=a.responseXML;if(!c){var d=new DOMParser,e=a.responseText;if(e){var f=Bj(a);(c=Aj(e,f||"application/xml",d))&&!f&&(f=c.documentElement,"html"!==f.localName.toLowerCase()||f.namespaceURI?"svg"===f.localName.toLowerCase()&&"image/svg+xml"!==c.contentType&&(c=Aj(e,"image/svg+xml",d)):c=Aj(e,"text/html",d));c||(c=Aj(e,"text/html",d))}}c=c?new qj(b,a.url,c):null;return L(c)}function Dj(a){this.gc=a}
function Ej(){var a=Fj;return new Dj(function(b){return a.gc(b)&&1==b.nodeType&&"http://www.idpf.org/2008/embedding"==b.getAttribute("Algorithm")})}function Gj(){var a=Ej(),b=Fj;return new Dj(function(c){if(!b.gc(c))return!1;c=new sj([c]);c=rj(c,"EncryptionMethod");a&&(c=Hj(c,a));return 0<c.b.length})}var Fj=new Dj(function(){return!0});function sj(a){this.b=a}function Hj(a,b){for(var c=[],d=0;d<a.b.length;d++){var e=a.b[d];b.gc(e)&&c.push(e)}return new sj(c)}
function Ij(a,b){function c(a){d.push(a)}for(var d=[],e=0;e<a.b.length;e++)b(a.b[e],c);return new sj(d)}sj.prototype.forEach=function(a){for(var b=[],c=0;c<this.b.length;c++)b.push(a(this.b[c]));return b};function Jj(a,b){for(var c=[],d=0;d<a.b.length;d++){var e=b(a.b[d]);null!=e&&c.push(e)}return c}function rj(a,b){return Ij(a,function(a,d){for(var c=a.firstChild;c;c=c.nextSibling)c.localName==b&&d(c)})}
function Lj(a){return Ij(a,function(a,c){for(var b=a.firstChild;b;b=b.nextSibling)1==b.nodeType&&c(b)})}function Mj(a,b){return Jj(a,function(a){return 1==a.nodeType?a.getAttribute(b):null})}sj.prototype.textContent=function(){return this.forEach(function(a){return a.textContent})};var Nj={transform:!0,"transform-origin":!0},Oj={top:!0,bottom:!0,left:!0,right:!0};function Pj(a,b,c){this.target=a;this.name=b;this.value=c}var Qj={show:function(a){a.style.visibility="visible"},hide:function(a){a.style.visibility="hidden"},play:function(a){a.currentTime=0;a.play()},pause:function(a){a.pause()},resume:function(a){a.play()},mute:function(a){a.muted=!0},unmute:function(a){a.muted=!1}};
function Rj(a,b){var c=Qj[b];return c?function(){for(var b=0;b<a.length;b++)try{c(a[b])}catch(e){}}:null}
function Sj(a,b){this.h={};this.K=a;this.g=b;this.O=null;this.w=[];var c=this;this.J=function(a){var b=a.currentTarget,d=b.getAttribute("href")||b.getAttributeNS("http://www.w3.org/1999/xlink","href");d&&Ua(c,{type:"hyperlink",target:null,currentTarget:null,Mf:b,href:d,preventDefault:function(){a.preventDefault()}})};this.b={};this.f={width:0,height:0};this.A=this.G=!1;this.C=this.F=!0;this.P=0;this.position=null;this.offset=-1;this.l=null;this.j=[];this.H={top:{},bottom:{},left:{},right:{}}}
t(Sj,Ta);function Tj(a,b){(a.F=b)?a.K.setAttribute("data-vivliostyle-auto-page-width",!0):a.K.removeAttribute("data-vivliostyle-auto-page-width")}function Uj(a,b){(a.C=b)?a.K.setAttribute("data-vivliostyle-auto-page-height",!0):a.K.removeAttribute("data-vivliostyle-auto-page-height")}function Vj(a,b,c){var d=a.b[c];d?d.push(b):a.b[c]=[b]}
function Wj(a,b,c){Object.keys(a.b).forEach(function(a){for(var b=this.b[a],c=0;c<b.length;)this.K.contains(b[c])?c++:b.splice(c,1);b.length||delete this.b[a]},a);for(var d=a.w,e=0;e<d.length;e++){var f=d[e];v(f.target,f.name,f.value.toString())}e=Xj(c,a.K);a.f.width=e.width;a.f.height=e.height;for(e=0;e<b.length;e++)if(c=b[e],f=a.b[c.Gc],d=a.b[c.hf],f&&d&&(f=Rj(f,c.action)))for(var g=0;g<d.length;g++)d[g].addEventListener(c.event,f,!1)}
Sj.prototype.zoom=function(a){v(this.K,"transform","scale("+a+")")};function Yj(a){switch(a){case "normal":case "nowrap":return 0;case "pre-line":return 1;case "pre":case "pre-wrap":return 2;default:return null}}function Zj(a,b){if(1==a.nodeType)return!1;var c=a.textContent;switch(b){case 0:return!!c.match(/^\s*$/);case 1:return!!c.match(/^[ \t\f]*$/);case 2:return!c.length}throw Error("Unexpected whitespace: "+b);}function ak(a){this.f=a;this.b=[];this.L=null}
function bk(a,b,c,d,e,f,g,h,l){this.b=a;this.element=b;this.f=c;this.Ta=d;this.l=e;this.h=f;this.lf=g;this.j=h;this.gb=-1;this.g=l}function ck(a,b){return a.h?!b.h||a.Ta>b.Ta?!0:a.j:!1}function dk(a,b){return a.top-b.top}function ek(a,b){return b.right-a.right}
function fk(a,b){if(a===b)return!0;if(!a||!b||a.ia!==b.ia||a.M!==b.M||a.ma.length!==b.ma.length)return!1;for(var c=0;c<a.ma.length;c++){var d=a[c],e=b[c];if(!(d===e||d&&e&&d.node===e.node&&d.Ua===e.Ua&&d.qa===e.qa&&d.Aa===e.Aa&&d.va===e.va))return!1}return!0}function gk(a){return{ma:[{node:a.S,Ua:hk,qa:a.qa,Aa:null,va:null}],ia:0,M:!1,Ka:a.Ka}}function ik(a,b){var c=new jk(a.node,b,0);c.Ua=a.Ua;c.qa=a.qa;c.Aa=a.Aa;c.va=a.va?ik(a.va,kk(b)):null;c.L=a.L;return c}var hk=0;
function lk(a,b,c,d,e,f,g){this.ja=a;this.Ld=d;this.oe=null;this.root=b;this.ea=c;this.type=f;e&&(e.oe=this);this.b=g}function mk(a,b){this.jf=a;this.count=b}
function jk(a,b,c){this.S=a;this.parent=b;this.pa=c;this.ia=0;this.M=!1;this.Ua=hk;this.qa=b?b.qa:null;this.va=this.Aa=null;this.ga=!1;this.Da=!0;this.b=!1;this.l=b?b.l:0;this.display=null;this.H=nk;this.V=this.A=this.j=null;this.O="baseline";this.X="top";this.rd=this.Y=0;this.G=!1;this.Qb=b?b.Qb:0;this.h=b?b.h:null;this.w=b?b.w:!1;this.J=this.yc=!1;this.C=this.D=this.F=this.g=null;this.qb=b?b.qb:{};this.u=b?b.u:!1;this.na=b?b.na:"ltr";this.f=b?b.f:null;this.Ka=this.lang=null;this.L=b?b.L:null}
function ok(a){a.Da=!0;a.l=a.parent?a.parent.l:0;a.D=null;a.C=null;a.ia=0;a.M=!1;a.display=null;a.H=nk;a.j=null;a.A=null;a.V=null;a.O="baseline";a.G=!1;a.Qb=a.parent?a.parent.Qb:0;a.h=a.parent?a.parent.h:null;a.w=a.parent?a.parent.w:!1;a.g=null;a.F=null;a.Aa=null;a.yc=!1;a.J=!1;a.u=a.parent?a.parent.u:!1;a.Aa=null;a.Ka=null;a.L=a.parent?a.parent.L:null}
function pk(a){var b=new jk(a.S,a.parent,a.pa);b.ia=a.ia;b.M=a.M;b.Aa=a.Aa;b.Ua=a.Ua;b.qa=a.qa;b.va=a.va;b.Da=a.Da;b.l=a.l;b.display=a.display;b.H=a.H;b.j=a.j;b.A=a.A;b.V=a.V;b.O=a.O;b.X=a.X;b.Y=a.Y;b.rd=a.rd;b.yc=a.yc;b.J=a.J;b.G=a.G;b.Qb=a.Qb;b.h=a.h;b.w=a.w;b.g=a.g;b.F=a.F;b.D=a.D;b.C=a.C;b.f=a.f;b.u=a.u;b.b=a.b;b.Ka=a.Ka;b.L=a.L;return b}jk.prototype.modify=function(){return this.ga?pk(this):this};function kk(a){var b=a;do{if(b.ga)break;b.ga=!0;b=b.parent}while(b);return a}
jk.prototype.clone=function(){for(var a=pk(this),b=a,c;c=b.parent;)c=pk(c),b=b.parent=c;return a};function qk(a){return{node:a.S,Ua:a.Ua,qa:a.qa,Aa:a.Aa,va:a.va?qk(a.va):null,L:a.L}}function rk(a){var b=a,c=[];do b.f&&b.parent&&b.parent.f!==b.f||c.push(qk(b)),b=b.parent;while(b);b=a.Ka?sk(a.Ka,a.ia,-1):a.ia;return{ma:c,ia:b,M:a.M,Ka:a.Ka}}function tk(a){for(a=a.parent;a;){if(a.yc)return!0;a=a.parent}return!1}function uk(a,b){for(var c=a;c;)c.Da||b(c),c=c.parent}
function vk(a){this.Ba=a;this.b=this.f=null}vk.prototype.clone=function(){var a=new vk(this.Ba);if(this.f){a.f=[];for(var b=0;b<this.f.length;++b)a.f[b]=this.f[b]}if(this.b)for(a.b=[],b=0;b<this.b.length;++b)a.b[b]=this.b[b];return a};
function wk(a,b){if(!b)return!1;if(a===b)return!0;if(!fk(a.Ba,b.Ba))return!1;if(a.f){if(!b.f||a.f.length!==b.f.length)return!1;for(var c=0;c<a.f.length;c++)if(!fk(a.f[c],b.f[c]))return!1}else if(b.f)return!1;if(a.b){if(!b.b||a.b.length!==b.b.length)return!1;for(c=0;c<a.b.length;c++)if(!fk(a.b[c],b.b[c]))return!1}else if(b.b)return!1;return!0}function xk(a,b){this.f=a;this.b=b}xk.prototype.clone=function(){return new xk(this.f.clone(),this.b)};function yk(){this.b=[];this.g="any";this.f=null}
yk.prototype.clone=function(){for(var a=new yk,b=this.b,c=a.b,d=0;d<b.length;d++)c[d]=b[d].clone();a.g=this.g;a.f=this.f;return a};function zk(a,b){if(a===b)return!0;if(!b||a.b.length!==b.b.length)return!1;for(var c=0;c<a.b.length;c++){var d=a.b[c],e=b.b[c];if(!e||d!==e&&!wk(d.f,e.f))return!1}return!0}function Ak(){this.page=0;this.f={};this.b={};this.g=0}
Ak.prototype.clone=function(){var a=new Ak;a.page=this.page;a.h=this.h;a.g=this.g;a.j=this.j;a.f=this.f;for(var b in this.b)a.b[b]=this.b[b].clone();return a};function Bk(a,b){if(a===b)return!0;if(!b||a.page!==b.page||a.g!==b.g)return!1;var c=Object.keys(a.b),d=Object.keys(b.b);if(c.length!==d.length)return!1;for(d=0;d<c.length;d++){var e=c[d];if(!zk(a.b[e],b.b[e]))return!1}return!0}
function Ck(a){this.element=a;this.ab=this.$a=this.height=this.width=this.G=this.A=this.H=this.w=this.Y=this.borderTop=this.ga=this.borderLeft=this.marginBottom=this.marginTop=this.marginRight=this.marginLeft=this.top=this.left=0;this.xa=this.Fb=null;this.na=this.wb=this.pb=this.xb=this.ka=0;this.u=!1}function Dk(a){return a.marginTop+a.borderTop+a.A}function Ek(a){return a.marginBottom+a.Y+a.G}function Fk(a){return a.marginLeft+a.borderLeft+a.w}function Gk(a){return a.marginRight+a.ga+a.H}
function Hk(a){return a.u?-1:1}function Ik(a,b){a.element=b.element;a.left=b.left;a.top=b.top;a.marginLeft=b.marginLeft;a.marginRight=b.marginRight;a.marginTop=b.marginTop;a.marginBottom=b.marginBottom;a.borderLeft=b.borderLeft;a.ga=b.ga;a.borderTop=b.borderTop;a.Y=b.Y;a.w=b.w;a.H=b.H;a.A=b.A;a.G=b.G;a.width=b.width;a.height=b.height;a.$a=b.$a;a.ab=b.ab;a.xa=b.xa;a.Fb=b.Fb;a.ka=b.ka;a.xb=b.xb;a.pb=b.pb;a.u=b.u}
function Jk(a,b,c){a.top=b;a.height=c;v(a.element,"top",b+"px");v(a.element,"height",c+"px")}function Kk(a,b,c){a.left=b;a.width=c;v(a.element,"left",b+"px");v(a.element,"width",c+"px")}function Lk(a){a=a.element;for(var b;b=a.lastChild;)a.removeChild(b)}function Mk(a){var b=a.$a+a.left+a.marginLeft+a.borderLeft,c=a.ab+a.top+a.marginTop+a.borderTop;return new Rf(b,c,b+(a.w+a.width+a.H),c+(a.A+a.height+a.G))}Ck.prototype.yd=function(a,b){var c=Nk(this);return tg(a,c.U,c.R,c.T-c.U,c.N-c.R,b)};
function Nk(a){var b=a.$a+a.left,c=a.ab+a.top;return new Rf(b,c,b+(Fk(a)+a.width+Gk(a)),c+(Dk(a)+a.height+Ek(a)))}function Ok(a,b,c){this.b=a;this.f=b;this.g=c}t(Ok,pc);Ok.prototype.Oc=function(a){this.b.appendChild(this.b.ownerDocument.createTextNode(a.lc));return null};Ok.prototype.rc=function(a){if(this.g.url)this.b.setAttribute("src",a.url);else{var b=this.b.ownerDocument.createElementNS("http://www.w3.org/1999/xhtml","img");b.setAttribute("src",a.url);this.b.appendChild(b)}return null};
Ok.prototype.ub=function(a){this.Pb(a.values);return null};Ok.prototype.mc=function(a){a=a.ra().evaluate(this.f);"string"===typeof a&&this.b.appendChild(this.b.ownerDocument.createTextNode(a));return null};function Pk(a){return!!a&&a!==kd&&a!==F&&a!==bd};function Qk(a,b,c){this.g=a;this.f=b;this.b=c}function Rk(){this.map=[]}function Sk(a){return a.map.length?a.map[a.map.length-1].b:0}function Tk(a,b){if(a.map.length){var c=a.map[a.map.length-1],d=c.b+b-c.f;c.f==c.g?(c.f=b,c.g=b,c.b=d):a.map.push(new Qk(b,b,d))}else a.map.push(new Qk(b,b,b))}function Uk(a,b){a.map.length?a.map[a.map.length-1].f=b:a.map.push(new Qk(b,0,0))}function Vk(a,b){var c=La(a.map.length,function(c){return b<=a.map[c].f}),c=a.map[c];return c.b-Math.max(0,c.g-b)}
function Wk(a,b){var c=La(a.map.length,function(c){return b<=a.map[c].b}),c=a.map[c];return c.g-(c.b-b)}function Xk(a,b,c,d,e,f,g,h){this.C=a;this.style=b;this.offset=c;this.F=d;this.j=e;this.b=e.b;this.Pa=f;this.Wa=g;this.G=h;this.l=this.w=null;this.A={};this.g=this.f=this.h=null;Yk(this)&&(b=b._pseudos)&&b.before&&(a=new Xk(a,b.before,c,!1,e,Zk(this),g,!0),c=$k(a,"content"),Pk(c)&&(this.h=a,this.g=a.g));this.g=al(bl(this,"before"),this.g);this.Wa&&cl[this.g]&&(e.g=al(e.g,this.g))}
function $k(a,b,c){if(!(b in a.A)){var d=a.style[b];a.A[b]=d?d.evaluate(a.C,b):c||null}return a.A[b]}function dl(a){return $k(a,"display",cd)}function Zk(a){if(null===a.w){var b=dl(a),c=$k(a,"position"),d=$k(a,"float");a.w=el(b,c,d,a.F).display===Mc}return a.w}function Yk(a){null===a.l&&(a.l=a.G&&dl(a)!==F);return a.l}function bl(a,b){var c=null;if(Zk(a)){var d=$k(a,"break-"+b);d&&(c=d.toString())}return c}function fl(a){this.g=a;this.b=[];this.Wa=this.Pa=!0;this.f=[]}
function gl(a){return a.b[a.b.length-1]}function hl(a){return a.b.every(function(a){return dl(a)!==F})}fl.prototype.push=function(a,b,c,d){var e=gl(this);d&&e&&d.b!==e.b&&this.f.push({Pa:this.Pa,Wa:this.Wa});e=d||e.j;d=this.Wa||!!d;var f=hl(this);a=new Xk(this.g,a,b,c,e,d||this.Pa,d,f);this.b.push(a);this.Pa=Yk(a)?!a.h&&Zk(a):this.Pa;this.Wa=Yk(a)?!a.h&&d:this.Wa;return a};
fl.prototype.pop=function(a){var b=this.b.pop(),c=this.Pa,d=this.Wa;if(Yk(b)){var e=b.style._pseudos;e&&e.after&&(a=new Xk(b.C,e.after,a,!1,b.j,c,d,!0),c=$k(a,"content"),Pk(c)&&(b.f=a))}this.Wa&&b.f&&(a=bl(b.f,"before"),b.j.g=al(b.j.g,a));if(a=gl(this))a.b===b.b?Yk(b)&&(this.Pa=this.Wa=!1):(a=this.f.pop(),this.Pa=a.Pa,this.Wa=a.Wa);return b};
function il(a,b){if(!b.Pa)return b.offset;var c=a.b.length-1,d=a.b[c];d===b&&(c--,d=a.b[c]);for(;0<=c;){if(d.b!==b.b)return b.offset;if(!d.Pa||d.F)return d.offset;b=d;d=a.b[--c]}throw Error("No block start offset found!");}
function jl(a,b,c,d,e,f,g,h){this.ea=a;this.root=a.root;this.La=c;this.h=d;this.w=f;this.f=this.root;this.O={};this.V={};this.C={};this.G=[];this.A=this.J=this.H=null;this.X=new Ni(b,d,g,h);this.g=new Rk;this.Ba=!0;this.ga=[];this.xa=e;this.ta=this.na=!1;this.b=a=tj(a,this.root);this.Y={};this.j=new fl(d);Tk(this.g,a);d=kl(this,this.root);Wi(this.X,this.root,d);ll(this,d,!1);this.F=!0;switch(this.root.namespaceURI){case "http://www.w3.org/1999/xhtml":case "http://www.gribuser.ru/xml/fictionbook/2.0":this.F=
!1}this.ga.push(!0);this.V={};this.V["e"+a]=d;this.b++;ml(this,-1)}function nl(a,b,c,d){return(b=b[d])&&b.evaluate(a.h)!==c[d]}function ol(a,b,c){for(var d in c){var e=b[d];e?(a.O[d]=e,delete b[d]):(e=c[d])&&(a.O[d]=new V(e,33554432))}}var pl=["column-count","column-width"];
function ll(a,b,c){c||["writing-mode","direction"].forEach(function(a){b[a]&&(this.O[a]=b[a])},a);if(!a.na){var d=nl(a,b,a.w.j,"background-color")?b["background-color"].evaluate(a.h):null,e=nl(a,b,a.w.j,"background-image")?b["background-image"].evaluate(a.h):null;if(d&&d!==bd||e&&e!==bd)ol(a,b,a.w.j),a.na=!0}if(!a.ta)for(d=0;d<pl.length;d++)if(nl(a,b,a.w.w,pl[d])){ol(a,b,a.w.w);a.ta=!0;break}if(!c&&(c=b["font-size"])){d=c.evaluate(a.h);c=d.I;switch(d.fa){case "em":case "rem":c*=a.h.w;break;case "ex":case "rex":c*=
a.h.w*yb.ex/yb.em;break;case "%":c*=a.h.w/100;break;default:(d=yb[d.fa])&&(c*=d)}a.h.Y=c}}function ql(a){for(var b=0;!a.F&&(b+=5E3,rl(a,b,0)!=Number.POSITIVE_INFINITY););return a.O}function kl(a,b){if(b.style instanceof CSSStyleDeclaration){var c=b.getAttribute("style");if(c){var d=a.ea.url,e=new ij(a.La,a.w),c=new Te(c,e);try{If(new zf(of,c,e,d),Number.POSITIVE_INFINITY,!1,!0,!1,!1)}catch(f){u.b(f,"Style attribute parse error:")}return e.Sa}}return{}}
function ml(a,b){if(!(b>=a.b)){var c=a.h,d=tj(a.ea,a.root);if(b<d){var e=a.l(a.root,!1),f=e["flow-into"],f=f?f.evaluate(c,"flow-into").toString():"body",f=sl(a,f,e,a.root,d);!a.j.b.length&&a.j.push(e,d,!0,f)}d=wj(a.ea,b);e=uj(a.ea,d,0,!1);if(!(e>=a.b))for(;;){if(1!=d.nodeType)e+=d.textContent.length;else{var g=d;if(e!=tj(a.ea,g))throw Error("Inconsistent offset");var h=a.l(g,!1);if(f=h["flow-into"])f=f.evaluate(c,"flow-into").toString(),sl(a,f,h,g,e);e++}if(e>=a.b)break;f=d.firstChild;if(!f)for(;!(f=
d.nextSibling);)if(d=d.parentNode,d===a.root)return;d=f}}}function tl(a,b){a.H=b;for(var c=0;c<a.G.length;c++)ul(a.H,a.G[c],a.C[a.G[c].b])}
function sl(a,b,c,d,e){var f=0,g=Number.POSITIVE_INFINITY,h=!1,l=!1,k=!1,m=c["flow-options"];if(m){var n;a:{if(h=m.evaluate(a.h,"flow-options")){l=new pg;try{h.ba(l);n=l.b;break a}catch(r){u.b(r,"toSet:")}}n={}}h=!!n.exclusive;l=!!n["static"];k=!!n.last}(n=c["flow-linger"])&&(g=rg(n.evaluate(a.h,"flow-linger"),Number.POSITIVE_INFINITY));(c=c["flow-priority"])&&(f=rg(c.evaluate(a.h,"flow-priority"),0));c=a.Y[e]||null;n=a.C[b];n||(n=gl(a.j),n=a.C[b]=new ak(n?n.j.b:null));d=new bk(b,d,e,f,g,h,l,k,c);
a.G.push(d);a.J==b&&(a.J=null);a.H&&ul(a.H,d,n);return d}function vl(a,b,c,d){cl[b]&&(d=a.C[d].b,(!d.length||d[d.length-1]<c)&&d.push(c));a.Y[c]=al(a.Y[c],b)}
function rl(a,b,c){var d=-1;if(b<=a.b&&(d=Vk(a.g,b),d+=c,d<Sk(a.g)))return Wk(a.g,d);if(!a.f)return Number.POSITIVE_INFINITY;for(var e=a.h;;){var f=a.f.firstChild;if(!f)for(;;){if(1==a.f.nodeType){var f=a.X,g=a.f;if(f.xb.pop()!==g)throw Error("Invalid call to popElement");f.bc.pop();f.na.pop();f.Ab.pop();f.ac.pop();f.pop();Ui(f);a.Ba=a.ga.pop();g=a.j.pop(a.b);f=null;g.f&&(f=bl(g.f,"before"),vl(a,f,g.f.Pa?il(a.j,g):g.f.offset,g.b),f=bl(g.f,"after"));f=al(f,bl(g,"after"));vl(a,f,a.b,g.b)}if(f=a.f.nextSibling)break;
a.f=a.f.parentNode;if(a.f===a.root)return a.f=null,b<a.b&&(0>d&&(d=Vk(a.g,b),d+=c),d<=Sk(a.g))?Wk(a.g,d):Number.POSITIVE_INFINITY}a.f=f;if(1!=a.f.nodeType){a.b+=a.f.textContent.length;var f=a.j,g=a.f,h=gl(f);(f.Pa||f.Wa)&&Yk(h)&&(h=$k(h,"white-space",kd).toString(),Zj(g,Yj(h))||(f.Pa=!1,f.Wa=!1));a.Ba?Tk(a.g,a.b):Uk(a.g,a.b)}else{g=a.f;f=kl(a,g);a.ga.push(a.Ba);Wi(a.X,g,f);(h=g.getAttribute("id")||g.getAttributeNS("http://www.w3.org/XML/1998/namespace","id"))&&h===a.A&&(a.A=null);a.F||"body"!=g.localName||
g.parentNode!=a.root||(ll(a,f,!0),a.F=!0);if(h=f["flow-into"]){var h=h.evaluate(e,"flow-into").toString(),l=sl(a,h,f,g,a.b);a.Ba=!!a.xa[h];g=a.j.push(f,a.b,g===a.root,l)}else g=a.j.push(f,a.b,g===a.root);h=il(a.j,g);vl(a,g.g,h,g.b);g.h&&(l=bl(g.h,"after"),vl(a,l,g.h.Pa?h:g.offset,g.b));a.Ba&&dl(g)===F&&(a.Ba=!1);if(tj(a.ea,a.f)!=a.b)throw Error("Inconsistent offset");a.V["e"+a.b]=f;a.b++;a.Ba?Tk(a.g,a.b):Uk(a.g,a.b);if(b<a.b&&(0>d&&(d=Vk(a.g,b),d+=c),d<=Sk(a.g)))return Wk(a.g,d)}}}
jl.prototype.l=function(a,b){var c=tj(this.ea,a),d="e"+c;b&&(c=uj(this.ea,a,0,!0));this.b<=c&&rl(this,c,0);return this.V[d]};var wl={"font-style":kd,"font-variant":kd,"font-weight":kd},xl="OTTO"+(new Date).valueOf(),yl=1;function zl(a,b){var c={},d;for(d in a)c[d]=a[d].evaluate(b,d);for(var e in wl)c[e]||(c[e]=wl[e]);return c}function Al(a){a=this.Wb=a;var b=new Da,c;for(c in wl)b.append(" "),b.append(a[c].toString());this.f=b.toString();this.src=this.Wb.src?this.Wb.src.toString():null;this.g=[];this.h=[];this.b=(c=this.Wb["font-family"])?c.stringValue():null}
function Bl(a,b,c){var d=new Da;d.append("@font-face {\n  font-family: ");d.append(a.b);d.append(";\n  ");for(var e in wl)d.append(e),d.append(": "),a.Wb[e].Ma(d,!0),d.append(";\n  ");c?(d.append('src: url("'),b=(window.URL||window.webkitURL).createObjectURL(c),d.append(b),a.g.push(b),a.h.push(c),d.append('")')):(d.append("src: "),d.append(b));d.append(";\n}\n");return d.toString()}function Cl(a){this.f=a;this.b={}}
function Dl(a,b){if(b instanceof sc){for(var c=b.values,d=[],e=0;e<c.length;e++){var f=c[e],g=a.b[f.stringValue()];g&&d.push(C(g));d.push(f)}return new sc(d)}return(c=a.b[b.stringValue()])?new sc([C(c),b]):b}function El(a,b){this.b=a;this.body=b;this.f={};this.g=0}function Fl(a,b,c){b=b.b;var d=c.b[b];if(d)return d;d="Fnt_"+ ++a.g;return c.b[b]=d}
function Gl(a,b,c,d){var e=I("initFont"),f=b.src,g={},h;for(h in wl)g[h]=b.Wb[h];d=Fl(a,b,d);g["font-family"]=C(d);var l=new Al(g),k=a.body.ownerDocument.createElement("span");k.textContent="M";var m=(new Date).valueOf()+1E3;b=a.b.ownerDocument.createElement("style");h=xl+yl++;b.textContent=Bl(l,"",Ye([h]));a.b.appendChild(b);a.body.appendChild(k);k.style.visibility="hidden";k.style.fontFamily=d;for(var n in wl)v(k,n,g[n].toString());var g=k.getBoundingClientRect(),r=g.right-g.left,q=g.bottom-g.top;
b.textContent=Bl(l,f,c);u.g("Starting to load font:",f);var z=!1;ge(function(){var a=k.getBoundingClientRect(),b=a.bottom-a.top;return r!=a.right-a.left||q!=b?(z=!0,L(!1)):(new Date).valueOf()>m?L(!1):fe(10)}).then(function(){z?u.g("Loaded font:",f):u.b("Failed to load font:",f);a.body.removeChild(k);O(e,l)});return M(e)}
function Hl(a,b,c){var d=b.src,e=a.f[d];e?ke(e,function(a){if(a.f==b.f){var e=b.b,f=c.b[e];a=a.b;if(f){if(f!=a)throw Error("E_FONT_FAMILY_INCONSISTENT "+b.b);}else c.b[e]=a;u.b("Found already-loaded font:",d)}else u.b("E_FONT_FACE_INCOMPATIBLE",b.src)}):(e=new je(function(){var e=I("loadFont"),g=c.f?c.f(d):null;g?Xe(d,"blob").then(function(d){d.cd?g(d.cd).then(function(d){Gl(a,b,d,c).Fa(e)}):O(e,null)}):Gl(a,b,null,c).Fa(e);return M(e)},"loadFont "+d),a.f[d]=e,e.start());return e}
function Il(a,b,c){for(var d=[],e=0;e<b.length;e++){var f=b[e];f.src&&f.b?d.push(Hl(a,f,c)):u.b("E_FONT_FACE_INVALID")}return le(d)};Kd("SIMPLE_PROPERTY",function(a){var b=a.name,c=a.value;switch(b){case "page-break-before":case "page-break-after":case "page-break-inside":return{name:b.replace(/^page-/,""),value:c===Kc?nd:c,important:a.important};default:return a}});var cl={page:!0,left:!0,right:!0,recto:!0,verso:!0,column:!0,region:!0},Jl={avoid:!0,"avoid-page":!0,"avoid-column":!0,"avoid-region":!0};
function al(a,b){if(a)if(b){var c=!!cl[a],d=!!cl[b];if(c&&d)switch(b){case "column":return a;case "region":return"column"===a?b:a;default:return b}else return d?b:c?a:Jl[b]?b:Jl[a]?a:b}else return a;else return b}function Kl(a){switch(a){case "left":case "right":case "recto":case "verso":return a;default:return"any"}};function Ll(a,b,c,d){d=d[b];if(!d)throw Error("unknown writing-mode: "+b);b=d[c||"ltr"];if(!b)throw Error("unknown direction: "+c);for(c=0;c<b.length;c++)if(d=b[c],d=a.replace(d.h,d.b),d!==a)return d;return a}function Ml(a){var b=Nl,c={};Object.keys(b).forEach(function(d){var e=c[d]={},f=b[d];Object.keys(f).forEach(function(b){e[b]=f[b].map(function(b){return{h:new RegExp("(-?)"+(a?b.ca:b.da)+"(-?)"),b:"$1"+(a?b.da:b.ca)+"$2"}})})});return c}
var Nl={"horizontal-tb":{ltr:[{ca:"inline-start",da:"left"},{ca:"inline-end",da:"right"},{ca:"block-start",da:"top"},{ca:"block-end",da:"bottom"},{ca:"inline-size",da:"width"},{ca:"block-size",da:"height"}],rtl:[{ca:"inline-start",da:"right"},{ca:"inline-end",da:"left"},{ca:"block-start",da:"top"},{ca:"block-end",da:"bottom"},{ca:"inline-size",da:"width"},{ca:"block-size",da:"height"}]},"vertical-rl":{ltr:[{ca:"inline-start",da:"top"},{ca:"inline-end",da:"bottom"},{ca:"block-start",da:"right"},{ca:"block-end",
da:"left"},{ca:"inline-size",da:"height"},{ca:"block-size",da:"width"}],rtl:[{ca:"inline-start",da:"bottom"},{ca:"inline-end",da:"top"},{ca:"block-start",da:"right"},{ca:"block-end",da:"left"},{ca:"inline-size",da:"height"},{ca:"block-size",da:"width"}]},"vertical-lr":{ltr:[{ca:"inline-start",da:"top"},{ca:"inline-end",da:"bottom"},{ca:"block-start",da:"left"},{ca:"block-end",da:"right"},{ca:"inline-size",da:"height"},{ca:"block-size",da:"width"}],rtl:[{ca:"inline-start",da:"bottom"},{ca:"inline-end",
da:"top"},{ca:"block-start",da:"left"},{ca:"block-end",da:"right"},{ca:"inline-size",da:"height"},{ca:"block-size",da:"width"}]}},Ol=Ml(!0),Pl=Ml(!1);var nk="inline";function Ql(a){switch(a){case "inline":return nk;case "column":return"column";case "region":return"region";case "page":return"page";default:throw Error("Unknown float-reference: "+a);}}function Rl(a){switch(a){case nk:return!1;case "column":case "region":case "page":return!0;default:throw Error("Unknown float-reference: "+a);}}function Sl(a,b,c){this.S=a;this.b=b;this.f=c;this.id=this.order=null}
function Tl(a){if(null===a.order)throw Error("The page float is not yet added");return a.order}function Ul(a){if(!a.id)throw Error("The page float is not yet added");return a.id}function Vl(){this.b=[];this.f=0}Vl.prototype.ie=function(){return this.f++};Vl.prototype.Xd=function(a){if(0<=this.b.findIndex(function(b){return b.S===a.S}))throw Error("A page float with the same source node is already registered");var b=a.order=this.ie();a.id="pf"+b;this.b.push(a)};
Vl.prototype.ce=function(a){var b=this.b.findIndex(function(b){return b.S===a});return 0<=b?this.b[b]:null};function Wl(a,b){var c=a.b.findIndex(function(a){return a.id===b});return 0<=c?a.b[c]:null}function Xl(a,b,c){this.b=Ul(a);this.f=b;this.Sb=c}Xl.prototype.yd=function(){return this.Sb.yd(null,null)};function Yl(a,b,c){this.eb=a;this.b=b;this.f=c}
function Zl(a,b,c,d,e,f,g){(this.parent=a)&&a.j.push(this);this.j=[];this.f=b;this.K=c;this.h=d;this.J=e;this.G=f||a&&a.G||ad;this.F=g||a&&a.F||jd;this.Bc=!1;this.A=a?a.A:new Vl;this.C=[];this.b=[];this.l=[];this.w={};this.g=[];a:{b=this;for(a=this.parent;a;){if(b=$l(a,b,this.f,this.h,this.J)){a=b;break a}b=a;a=a.parent}a=null}this.H=a?[].concat(a.g):[]}function am(a,b){if(!a.parent)throw Error("No PageFloatLayoutContext for "+b);return a.parent}
function $l(a,b,c,d,e){b=a.j.indexOf(b);0>b&&(b=a.j.length);for(--b;0<=b;b--){var f=a.j[b];if(f.f===c&&f.h===d&&f.J===e||(f=$l(f,null,c,d,e)))return f}return null}function bm(a,b){return b&&b!==a.f?bm(am(a,b),b):a.K}function cm(a,b){a.K=b;dm(a)}Zl.prototype.Xd=function(a){this.A.Xd(a)};function em(a,b){return b===a.f?a:em(am(a,b),b)}Zl.prototype.ce=function(a){return this.A.ce(a)};function fm(a,b){var c=Ul(b),d=b.b;d===a.f?0>a.C.indexOf(c)&&a.C.push(c):fm(am(a,d),b)}
function gm(a,b){var c=Ul(b),d=b.b;return d===a.f?0<=a.C.indexOf(c):gm(am(a,d),b)}function hm(a,b){return Wl(a.A,b.b)}function im(a,b,c){var d=hm(a,b).b;d!==a.f?im(am(a,d),b,c):0>a.b.indexOf(b)&&(a.b.push(b),a.b.sort(function(a,b){var c=hm(this,a),d=hm(this,b);return Tl(c)-Tl(d)}.bind(a)));c||jm(a)}function km(a,b,c){var d=hm(a,b).b;d!==a.f?km(am(a,d),b,c):(b=a.b.indexOf(b),0<=b&&(b=a.b.splice(b,1)[0],(b=b.Sb&&b.Sb.element)&&b.parentNode&&b.parentNode.removeChild(b),c||jm(a)))}
function lm(a,b){if(b.b!==a.f)return lm(am(a,b.b),b);var c=Ul(b),d=a.b.findIndex(function(a){return a.b===c});return 0<=d?a.b[d]:null}function mm(a){return 0<a.b.length?!0:a.parent?mm(a.parent):!1}function nm(a,b,c){b.b===a.f?a.w[Ul(b)]=c:nm(am(a,b.b),b,c)}function om(a,b){if(pm(a).some(function(a){return Ul(a.eb)===b}))return!0;var c=a.w[b];return c?a.K&&a.K.element?a.K.element.contains(c):!1:!1}
function qm(a,b,c,d){d=d||a.h;b.b===a.f?(c=new Yl(b,c,d),d=a.g.findIndex(function(a){return a.eb===b}),0<=d?a.g.splice(d,1,c):a.g.push(c)):qm(am(a,b.b),b,c,d)}function rm(a){return 0<a.g.length?!0:a.parent?rm(a.parent):!1}function sm(a,b){var c=Tl(b);return a.g.some(function(a){return Tl(a.eb)<c})?!0:a.parent?sm(a.parent,b):!1}function pm(a,b){b=b||a.h;var c=a.H.filter(function(a){return!b||a.f===b});a.parent&&(c=pm(a.parent,b).concat(c));return c.sort(function(a,b){return Tl(a.eb)-Tl(b.eb)})}
function tm(a,b){b=b||a.h;var c=a.g.filter(function(a){return!b||a.f===b});return a.parent?tm(a.parent,b).concat(c):c}function um(a){for(var b=a.b.length-1;0<=b;b--){var c=a.b[b];if(!om(a,c.b)){km(a,c);b=hm(a,c);fm(a,b);vm(a,b);return}}for(b=a.g.length-1;0<=b;b--)om(a,Ul(a.g[b].eb))||a.g.splice(b,1);a.H.forEach(function(a){if(!(0<=this.g.findIndex(function(b){return b?a===b?!0:a.eb===b.eb&&fk(a.b,b.b):!1}))){var b=Ul(a.eb);this.b.some(function(a){return a.b===b})||this.g.push(a)}},a)}
function jm(a){a.K&&(a.j.forEach(function(a){a.K&&a.K.element===this.K.element&&a.b.forEach(function(a){(a=a.Sb.element)&&a.parentNode&&a.parentNode.removeChild(a)})},a),Lk(a.K));a.j.splice(0);Object.keys(a.w).forEach(function(a){delete this.w[a]},a);a.Bc=!0}function wm(a){return a.Bc||!!a.parent&&wm(a.parent)}function xm(a,b){return Ll(b,a.G.toString(),a.F.toString()||null,Pl)}
function vm(a,b){var c=xm(a,b.f);if("block-end"===c||"inline-end"===c)for(var d=0;d<a.b.length;){var e=a.b[d];xm(a,hm(a,e).f)===c?km(a,e):d++}}function ym(a,b){if(b.b!==a.f)ym(am(a,b.b),b);else{var c=xm(a,b.f);if("block-end"===c||"inline-end"===c)for(var d=0;d<a.b.length;){var e=a.b[d];xm(a,hm(a,e).f)===c?(a.l.push(e),a.b.splice(d,1)):d++}}}function zm(a,b){b!==a.f?zm(am(a,b),b):(a.l.forEach(function(a){im(this,a,!0)},a),a.l.splice(0))}function Am(a,b){b!==a.f?Am(am(a,b),b):a.l.splice(0)}
function Bm(a,b){return b===a.f?a.l.concat().sort(function(a,b){var c=hm(this,a);return Tl(hm(this,b))-Tl(c)}.bind(a)):Bm(am(a,b),b)}function Cm(a,b){var c=xm(a,b),d=Ll(b,a.G.toString(),a.F.toString()||null,Ol),c=Dm(a,c);if(a.parent&&a.parent.K){var e=Cm(a.parent,d);switch(d){case "top":return Math.max(c,e);case "left":return Math.max(c,e);case "bottom":return Math.min(c,e);case "right":return Math.min(c,e);default:fa("Should be unreachable")}}return c}
function Dm(a,b){var c=a.K.$a,d=a.K.ab,e=Mk(a.K),e={top:e.R-d,left:e.U-c,bottom:e.N-d,right:e.T-c},f=a.b;0<f.length&&(e=f.reduce(function(b,c){var d=hm(a,c),d=xm(this,d.f),e=c.Sb,f=b.top,g=b.left,h=b.bottom,q=b.right;switch(d){case "inline-start":e.u?f=Math.max(f,e.top+e.height):g=Math.max(g,e.left+e.width);break;case "block-start":e.u?q=Math.min(q,e.left):f=Math.max(f,e.top+e.height);break;case "inline-end":e.u?h=Math.min(h,e.top):q=Math.min(q,e.left);break;case "block-end":e.u?g=Math.max(g,e.left+
e.width):h=Math.min(h,e.top);break;default:throw Error("Unknown logical float side: "+d);}return{top:f,left:g,bottom:h,right:q}}.bind(a),e));e.left+=c;e.right+=c;e.top+=d;e.bottom+=d;switch(b){case "block-start":return a.K.u?e.right:e.top;case "block-end":return a.K.u?e.left:e.bottom;case "inline-start":return a.K.u?e.top:e.left;case "inline-end":return a.K.u?e.bottom:e.right;default:throw Error("Unknown logical side: "+b);}}
function Em(a,b,c,d,e){if(c.b!==a.f)return Em(am(a,c.b),b,c,d,e);var f=xm(a,c.f),g=Cm(a,"block-start"),h=Cm(a,"block-end"),l=Cm(a,"inline-start");a=Cm(a,"inline-end");var k=b.u?b.$a:b.ab,m=b.u?b.ab:b.$a,g=b.u?Math.min(g,b.left+b.width+k):Math.max(g,b.top+k),h=b.u?Math.max(h,b.left+k):Math.min(h,b.top+b.height+k),n;if(d){d=b.u?hg(new Rf(h,l,g,a)):new Rf(l,g,a,h);switch(f){case "block-start":case "inline-start":if(d=ng(b.J,d))b.u&&(d=ig(d)),g=b.u?Math.min(g,d.T):Math.max(g,d.R),h=b.u?Math.max(h,d.U):
Math.min(h,d.N);else if(!e)return!1;break;case "block-end":case "inline-end":if(d=og(b.J,d))b.u&&(d=ig(d)),g=b.u?Math.min(g,d.T):Math.max(g,d.R),h=b.u?Math.max(h,d.U):Math.min(h,d.N);else if(!e)return!1}d=(h-g)*Hk(b);n=a-l;if(!e&&(0>=d||0>=n))return!1}else{d=b.ka;var r=(h-g)*Hk(b);if(!e&&r<d)return!1;var q=b.we;d=Math.min(d+(b.u?q.left:q.bottom),r);"inline-start"===f||"inline-end"===f?n=Fm(b.b,b.element,[Gm])[Gm]:n=Xj(b.b,b.Be)[b.u?"height":"width"]+(b.u?q.top:q.left)+(b.u?q.bottom:q.right);if(!e&&
a-l<n)return!1}g-=k;h-=k;l-=m;a-=m;switch(f){case "inline-start":case "block-start":h=l;c=n;b.u?Jk(b,h,c):Kk(b,h,c);h=d;b.u?Kk(b,g+h*Hk(b),h):Jk(b,g,h);break;case "inline-end":case "block-end":g=a-n;c=n;b.u?Jk(b,g,c):Kk(b,g,c);g=h-d*Hk(b);h=d;b.u?Kk(b,g+h*Hk(b),h):Jk(b,g,h);break;default:throw Error("unknown float direction: "+c.f);}return!0}function Hm(a){var b=a.b.map(function(a){return a.yd()});return a.parent?Hm(a.parent).concat(b):b}
function dm(a){var b=a.K.element&&a.K.element.parentNode;b&&a.b.forEach(function(a){b.appendChild(a.Sb.element)})}function Im(a){var b=bm(a).u;return a.b.reduce(function(a,d){var c=Nk(d.Sb);return b?Math.min(a,c.U):Math.max(a,c.N)},b?Infinity:0)};var Jm={img:!0,svg:!0,audio:!0,video:!0};
function Km(a,b,c,d){var e=a.D;if(!e)return NaN;if(1==e.nodeType){if(a.M){var f=Xj(b,e);if(f.right>=f.left&&f.bottom>=f.top)return d?f.left:f.bottom}return NaN}var f=NaN,g=e.ownerDocument.createRange(),h=e.textContent.length;if(!h)return NaN;a.M&&(c+=h);c>=h&&(c=h-1);g.setStart(e,c);g.setEnd(e,c+1);a=Lm(b,g);if(c=d){c=document.body;if(null==Va){var l=c.ownerDocument,g=l.createElement("div");g.style.position="absolute";g.style.top="0px";g.style.left="0px";g.style.width="100px";g.style.height="100px";
g.style.overflow="hidden";g.style.lineHeight="16px";g.style.fontSize="16px";v(g,"writing-mode","vertical-rl");c.appendChild(g);h=l.createTextNode("a a a a a a a a a a a a a a a a");g.appendChild(h);l=l.createRange();l.setStart(h,0);l.setEnd(h,1);h=l.getBoundingClientRect();Va=10>h.right-h.left;c.removeChild(g)}c=Va}if(c){c=e.ownerDocument.createRange();c.setStart(e,0);c.setEnd(e,e.textContent.length);b=Lm(b,c);e=[];for(c=0;c<a.length;c++){g=a[c];for(h=0;h<b.length;h++)if(l=b[h],g.top>=l.top&&g.bottom<=
l.bottom&&1>Math.abs(g.left-l.left)){e.push({top:g.top,left:l.left,bottom:g.bottom,right:l.right});break}h==b.length&&(u.b("Could not fix character box"),e.push(g))}a=e}for(e=b=0;e<a.length;e++)c=a[e],g=d?c.bottom-c.top:c.right-c.left,c.right>c.left&&c.bottom>c.top&&(isNaN(f)||g>b)&&(f=d?c.left:c.bottom,b=g);return f}function Mm(a){for(var b=Jd.RESOLVE_LAYOUT_PROCESSOR||[],c=0;c<b.length;c++){var d=b[c](a);if(d)return d}throw Error("No processor found for a formatting context: "+a.re());}
function Nm(){}function Om(a){if(!a)return null;for(a=a.L;a;){var b=a.dc();if(b)return b;a=a.se()}return null}function Pm(a,b){this.h=a;this.w=b;this.j=!1;this.l=null}t(Pm,Nm);Pm.prototype.f=function(a,b){if(b<this.b())return null;this.j||(this.l=Qm(a,this,0<b),this.j=!0);return this.l};Pm.prototype.b=function(){return this.w};Pm.prototype.g=function(){return Om(this.h[0])};function Rm(a,b,c,d){this.position=a;this.A=b;this.w=c;this.ka=d;this.h=!1;this.l=0}t(Rm,Nm);
Rm.prototype.f=function(a,b){this.h||(this.l=Km(this.position,a.b,0,a.u),this.h=!0);var c=this.l,d=this.g();d&&(c+=(a.u?-1:1)*Sm(d));this.w=this.position.b=Tm(a,c);b<this.b()?c=null:(a.ka=this.ka,c=this.position);return c};Rm.prototype.b=function(){if(!this.h)throw Error("EdgeBreakPosition.prototype.updateEdge not called");return(Jl[this.A]?1:0)+(this.w?3:0)+(this.position.parent?this.position.parent.l:0)};Rm.prototype.g=function(){return Om(this.position)};
function Um(a,b,c){this.pa=a;this.f=b;this.b=c}function Vm(a){for(var b=1;b<a.length;b++){var c=a[b-1],d=a[b];c===d?u.b("validateCheckPoints: duplicate entry"):c.pa>=d.pa?u.b("validateCheckPoints: incorrect boxOffset"):c.S==d.S&&(d.M?c.M&&u.b("validateCheckPoints: duplicate after points"):c.M?u.b("validateCheckPoints: inconsistent after point"):d.pa-c.pa!=d.ia-c.ia&&u.b("validateCheckPoints: boxOffset inconsistent with offsetInNode"))}}function Wm(a){this.parent=a}Wm.prototype.re=function(){return"Block formatting context (adapt.layout.BlockFormattingContext)"};
Wm.prototype.He=function(a,b){return b};Wm.prototype.se=function(){return this.parent};Wm.prototype.dc=function(){return null};function Xm(a,b,c,d,e){Ck.call(this,a);this.$e=a.lastChild;this.h=b;this.b=c;this.Va=d;this.af=a.ownerDocument;this.f=e;cm(e,this);this.Ud=null;this.ve=this.xe=!1;this.F=this.kb=this.ya=this.X=this.V=0;this.J=this.Td=this.O=this.ta=null;this.Yd=!1;this.j=this.g=this.C=null;this.ac=!0;this.Ab=this.sc=this.bc=0;this.l=!0;this.La=null}t(Xm,Ck);
function Ym(a,b){return!!b.j&&(!a.xe||!!b.parent)}function Tm(a,b){return a.u?b<a.F:b>a.F}function Zm(a){var b=Hm(a.f);return a.Fb.concat(b)}Xm.prototype.vb=function(a){var b=this,c=I("openAllViews"),d=a.ma;$m(b.h,b.element,b.ve);var e=d.length-1,f=null;ge(function(){for(;0<=e;){f=ik(d[e],f);e!==d.length-1||f.L||(f.L=b.Ud);if(!e){var c=f,h;h=a;h=h.Ka?sk(h.Ka,h.ia,1):h.ia;c.ia=h;f.M=a.M;f.Ka=a.Ka;if(f.M)break}c=an(b.h,f,!e&&!f.ia);e--;if(c.za())return c}return L(!1)}).then(function(){O(c,f)});return M(c)};
var bn=/^[^A-Za-z0-9_\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]*([A-Za-z0-9_\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527][^A-Za-z0-9_\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]*)?/;function cn(a,b){if(b.f&&b.Da&&!b.M&&!b.f.count&&1!=b.D.nodeType){var c=b.D.textContent.match(bn);return dn(a.h,b,c[0].length)}return L(b)}
function en(a,b,c){var d=I("buildViewToNextBlockEdge");he(function(d){b.D&&!fn(b)&&c.push(kk(b));cn(a,b).then(function(e){e!==b&&(b=e,fn(b)||c.push(kk(b)));gn(a.h,b).then(function(c){if(b=c){if(!hn(a.Va,b)&&(b=b.modify(),b.b=!0,a.l)){Q(d);return}Ym(a,b)&&!a.u?jn(a,b).then(function(a){(b=a)?P(d):Q(d)}):b.Da?P(d):Q(d)}else Q(d)})})}).then(function(){O(d,b)});return M(d)}
function kn(a,b){if(!b.D)return L(b);var c=b.S,d=I("buildDeepElementView");he(function(d){cn(a,b).then(function(e){if(e!==b){for(var f=e;f&&f.S!=c;)f=f.parent;if(!f){b=e;Q(d);return}}gn(a.h,e).then(function(e){(b=e)&&b.S!=c?hn(a.Va,b)?P(d):(b=b.modify(),b.b=!0,a.l?Q(d):P(d)):Q(d)})})}).then(function(){O(d,b)});return M(d)}
function ln(a,b,c,d,e){var f=a.af.createElement("div");a.u?(e>=a.height&&(e-=.1),v(f,"height",d+"px"),v(f,"width",e+"px")):(d>=a.width&&(d-=.1),v(f,"width",d+"px"),v(f,"height",e+"px"));v(f,"float",c);v(f,"clear",c);a.element.insertBefore(f,b);return f}function mn(a){for(var b=a.element.firstChild;b;){var c=b.nextSibling;if(1==b.nodeType){var d=b.style.cssFloat;if("left"==d||"right"==d)a.element.removeChild(b);else break}b=c}}
function nn(a){for(var b=a.element.firstChild,c=a.J,d=a.u?a.u?a.V:a.ya:a.u?a.kb:a.V,e=a.u?a.u?a.X:a.kb:a.u?a.ya:a.X,f=0;f<c.length;f++){var g=c[f],h=g.N-g.R;g.left=ln(a,b,"left",g.U-d,h);g.right=ln(a,b,"right",e-g.T,h)}}function on(a,b,c,d,e){var f;if(b&&b.M&&!b.Da&&(f=Km(b,a.b,0,a.u),!isNaN(f)))return f;b=c[d];for(e-=b.pa;;){f=Km(b,a.b,e,a.u);if(!isNaN(f))return f;if(0<e)e--;else{d--;if(0>d)return a.ya;b=c[d];1!=b.D.nodeType&&(e=b.D.textContent.length)}}}
function X(a){return"number"==typeof a?a:(a=a.match(/^(-?[0-9]*(\.[0-9]*)?)px$/))?parseFloat(a[0]):0}function pn(a,b){var c=qn(a.b,b),d=new Tf;c&&(d.left=X(c.marginLeft),d.top=X(c.marginTop),d.right=X(c.marginRight),d.bottom=X(c.marginBottom));return d}function rn(a,b){var c=qn(a.b,b),d=new Tf;c&&(d.left=X(c.borderLeftWidth)+X(c.paddingLeft),d.top=X(c.borderTopWidth)+X(c.paddingTop),d.right=X(c.borderRightWidth)+X(c.paddingRight),d.bottom=X(c.borderBottomWidth)+X(c.paddingBottom));return d}
function sn(a,b,c){if(a=qn(a.b,b))c.marginLeft=X(a.marginLeft),c.borderLeft=X(a.borderLeftWidth),c.w=X(a.paddingLeft),c.marginTop=X(a.marginTop),c.borderTop=X(a.borderTopWidth),c.A=X(a.paddingTop),c.marginRight=X(a.marginRight),c.ga=X(a.borderRightWidth),c.H=X(a.paddingRight),c.marginBottom=X(a.marginBottom),c.Y=X(a.borderBottomWidth),c.G=X(a.paddingBottom)}function tn(a,b,c){b=new Um(b,c,c);a.g?a.g.push(b):a.g=[b]}
function un(a,b,c,d){if(a.g&&a.g[a.g.length-1].b)return tn(a,b,c),L(!0);var e=new Rf(a.V,a.ya,a.X,a.kb),f=ng(a.J,e);f&&(d=Math.max(d,f.R*Hk(a)));d+=40*Hk(a);var g=a.O,h=!g;if(h){f=a.element.ownerDocument.createElement("div");v(f,"position","absolute");var l=a.h.clone(),k=new Zl(a.f,"column",null,a.f.h,c.ma[0].node,null,null),g=new Xm(f,l,a.b,a.Va,k);g.ac=!1;cm(k,g);a.O=g;g.u=vn(a.h,a.u,f);g.ve=!0;a.u?(g.left=0,v(g.element,"width","2em")):(g.top=a.kb,v(g.element,"height","2em"))}a.element.appendChild(g.element);
sn(a,g.element,g);f=Hk(a)*(d-a.ya);a.u?g.height=a.ta.N-a.ta.R-Dk(g)-Ek(g):g.width=a.ta.T-a.ta.U-Fk(g)-Gk(g);var m=(e=og(a.J,e))?e.N:a.kb;d=Hk(a)*(m-d)-(a.u?Fk(g)-Gk(g):Dk(g)+Ek(g));if(h&&18>d)return a.element.removeChild(g.element),a.O=null,tn(a,b,c),L(!0);if(!a.u&&g.top<f)return a.element.removeChild(g.element),tn(a,b,c),L(!0);var n=I("layoutFootnoteInner");a.u?Kk(g,0,d):Jk(g,f,d);g.$a=a.$a+a.left+Fk(a);g.ab=a.ab+a.top+Dk(a);g.Fb=a.Fb;var r=new vk(c);h?(wn(g),d=L(!0)):Zm(g).length?d=xn(g):(yn(g),
d=L(!0));d.then(function(){zn(g,r).then(function(d){if(h&&d)a.element.removeChild(g.element),tn(a,b,c),a.O=null,O(n,!0);else{g.ka+=.01;a.u?(a.F=m+(g.ka+Fk(g)+Gk(g)),Kk(g,0,g.ka)):(a.F=m-(g.ka+Dk(g)+Ek(g)),Jk(g,a.F-a.ya,g.ka));var e;!a.u&&0<Zm(g).length?e=xn(g):e=L(d);e.then(function(d){d=new Um(b,c,d?d.Ba:null);a.g?a.g.push(d):a.g=[d];O(n,!0)})}})});return M(n)}
function An(a,b){var c=I("layoutFootnote"),d=b.D;d.setAttribute("style","");v(d,"display","inline-block");d.textContent="M";var e=Xj(a.b,d),f=a.u?e.left:e.bottom;d.textContent="";Bn(a.h,b,"footnote-call",d);d.textContent||(d.parentNode.removeChild(d),b.D=null);d=gk(b);e=b.pa;b=b.modify();b.M=!0;un(a,e,d,f).then(function(){a.O&&a.O.element.parentNode&&a.element.removeChild(a.O.element);Tm(a,f)&&a.C.length&&(b.b=!0);O(c,b)});return M(c)}
function Cn(a,b){if(Rl(b.H))return Dn(a,b);var c=I("layoutFloat"),d=b.D,e=b.j;v(d,"float","none");v(d,"display","inline-block");v(d,"vertical-align","top");kn(a,b).then(function(f){for(var g=Xj(a.b,d),h=pn(a,d),g=new Rf(g.left-h.left,g.top-h.top,g.right+h.right,g.bottom+h.bottom),h=a.V,l=a.X,k=b.parent;k&&k.Da;)k=k.parent;if(k){var m=k.D.ownerDocument.createElement("div");m.style.left="0px";m.style.top="0px";a.u?(m.style.bottom="0px",m.style.width="1px"):(m.style.right="0px",m.style.height="1px");
k.D.appendChild(m);var n=Xj(a.b,m),h=Math.max(a.u?n.top:n.left,h),l=Math.min(a.u?n.bottom:n.right,l);k.D.removeChild(m);m=a.u?g.N-g.R:g.T-g.U;"left"==e?l=Math.max(l,h+m):h=Math.min(h,l-m);k.D.appendChild(b.D)}m=new Rf(h,Hk(a)*a.ya,l,Hk(a)*a.kb);h=g;a.u&&(h=hg(g));l=Hk(a);h.R<a.Ab*l&&(n=h.N-h.R,h.R=a.Ab*l,h.N=h.R+n);a:for(var l=a.J,n=h,r=n.R,q=n.T-n.U,z=n.N-n.R,y=mg(l,r);;){var A=r+z;if(A>m.N)break a;for(var H=m.U,G=m.T,J=y;J<l.length&&l[J].R<A;J++){var K=l[J];K.U>H&&(H=K.U);K.T<G&&(G=K.T)}if(H+q<=
G||y>=l.length){"left"==e?(n.U=H,n.T=H+q):(n.U=G-q,n.T=G);n.N+=r-n.R;n.R=r;break a}r=l[y].N;y++}a.u&&(g=ig(h));a:{m=qn(a.b,d);l=new Tf;if(m){if("border-box"==m.boxSizing){m=pn(a,d);break a}l.left=X(m.marginLeft)+X(m.borderLeftWidth)+X(m.paddingLeft);l.top=X(m.marginTop)+X(m.borderTopWidth)+X(m.paddingTop);l.right=X(m.marginRight)+X(m.borderRightWidth)+X(m.paddingRight);l.bottom=X(m.marginBottom)+X(m.borderBottomWidth)+X(m.paddingBottom)}m=l}v(d,"width",g.T-g.U-m.left-m.right+"px");v(d,"height",g.N-
g.R-m.top-m.bottom+"px");v(d,"position","absolute");v(d,"display",b.display);l=null;if(k)if(k.J)l=k;else a:{for(k=k.parent;k;){if(k.J){l=k;break a}k=k.parent}l=null}l?(m=l.D.ownerDocument.createElement("div"),m.style.position="absolute",l.u?m.style.right="0":m.style.left="0",m.style.top="0",l.D.appendChild(m),k=Xj(a.b,m),l.D.removeChild(m)):k={left:a.u?a.kb:a.V,right:a.u?a.ya:a.X,top:a.u?a.V:a.ya};(l?l.u:a.u)?v(d,"right",k.right-g.T+a.H+"px"):v(d,"left",g.U-k.left+a.w+"px");v(d,"top",g.R-k.top+a.A+
"px");b.C&&(b.C.parentNode.removeChild(b.C),b.C=null);k=a.u?g.U:g.N;g=a.u?g.T:g.R;if(Tm(a,k)&&a.C.length)b=b.modify(),b.b=!0,O(c,b);else{mn(a);m=new Rf(a.u?a.kb:a.V,a.u?a.V:a.ya,a.u?a.ya:a.X,a.u?a.X:a.kb);a.u&&(m=hg(m));l=a.J;for(h=[new Vf(h.R,h.N,h.U,h.T)];0<h.length&&h[0].N<=m.R;)h.shift();if(h.length){h[0].R<m.R&&(h[0].R=m.R);n=l.length?l[l.length-1].N:m.R;n<m.N&&l.push(new Vf(n,m.N,m.U,m.T));r=mg(l,h[0].R);for(q=0;q<h.length;q++){z=h[q];if(r==l.length)break;l[r].R<z.R&&(n=l[r],r++,l.splice(r,
0,new Vf(z.R,n.N,n.U,n.T)),n.N=z.R);for(;r<l.length&&(n=l[r++],n.N>z.N&&(l.splice(r,0,new Vf(z.N,n.N,n.U,n.T)),n.N=z.N),z.U!=z.T&&("left"==e?n.U=Math.min(z.T,m.T):n.T=Math.max(z.U,m.U)),n.N!=z.N););}lg(m,l)}nn(a);"left"==e?a.bc=k:a.sc=k;a.Ab=g;En(a,k);O(c,f)}});return M(c)}
function Fn(a,b){var c=a.element.ownerDocument.createElement("div");v(c,"position","absolute");var d=em(a.f,b.b),e=new Zl(d,"column",null,a.f.h,b.S,null,null),d=bm(d),c=new Gn(b,c,a.h.clone(),a.b,a.Va,e,d);cm(e,c);var f=a.f,e=bm(f,b.b),g=Mk(e),d=c.element;e.element.parentNode.appendChild(d);Ik(c,e);c.element=d;c.xe=!0;c.width=g.T-g.U;c.height=g.N-g.R;c.marginLeft=c.marginRight=c.marginTop=c.marginBottom=0;c.borderLeft=c.ga=c.borderTop=c.Y=0;c.w=c.H=c.A=c.G=0;Kk(c,g.U-e.$a,c.width);Jk(c,g.R-e.ab,c.height);
c.Fb=(e.Fb||[]).concat();c.ac=!mm(f);c.xa=null;wn(c);(f=Em(f,c,b,!0,!mm(f)))?(mn(c),wn(c)):e.element.parentNode.removeChild(d);return f?c:null}
function Hn(a,b,c){var d=a.f;ym(d,c);var e=Fn(a,c);if(!e)return zm(d,c.b),qm(d,c,b),L(null);var f=new vk(b),g=I("layoutPageFloatInner");zn(e,f,!0).then(function(f){if(f&&mm(d))zm(d,c.b),qm(d,c,b),e.element.parentNode.removeChild(e.element),O(g,null);else if(Em(d,e,c,!1,!mm(d))){var h=new Xl(c,b,e);im(d,h,!0);In(a,c.b).then(function(a){a?(im(d,h),Am(d,c.b),f&&qm(d,c,f.Ba),O(g,e)):(km(d,h,!0),zm(d,c.b),qm(d,c,b),O(g,null))})}else zm(d,c.b),qm(d,c,b),e.element.parentNode.removeChild(e.element),O(g,null)});
return M(g)}
function In(a,b){var c=a.f,d=Bm(c,b),e=[],f=[],g=!1,h=I("layoutStashedPageFloats"),l=0;he(function(b){if(l>=d.length)Q(b);else{var h=d[l],k=hm(c,h),r=h.f,q=Fn(a,k);q?(e.push(q),zn(q,new vk(r),!0).then(function(a){a?(g=!0,Q(b)):Em(c,q,k,!1,!1)?(a=new Xl(k,r,q),im(c,a,!0),f.push(a),l++,P(b)):(g=!0,Q(b))})):(g=!0,Q(b))}}).then(function(){g?(f.forEach(function(a){km(c,a,!0)}),e.forEach(function(a){(a=a.element)&&a.parentNode&&a.parentNode.removeChild(a)})):d.forEach(function(a){(a=a.Sb.element)&&a.parentNode&&
a.parentNode.removeChild(a)});O(h,!g)});return M(h)}function Jn(a){var b=a.D.parentNode,c=b.ownerDocument.createElement("span");c.setAttribute("data-adapt-spec","1");b.appendChild(c);b.removeChild(a.D);a=a.modify();a.M=!0;a.D=c;return a}
function Kn(a,b,c,d){var e=I("resolveFloatReferenceFromColumnSpan"),f=a.f,g=em(f,"region");bm(f).width<bm(g).width&&"column"===b?c===Lc?kn(a,kk(d)).then(function(c){var d=c.D;c=Fm(a.b,d,[Ln])[Ln];d=pn(a,d);c=a.u?c+(d.top+d.bottom):c+(d.left+d.right);c>a.width?O(e,"region"):O(e,b)}):c===Jc?O(e,"region"):O(e,b):O(e,b);return M(e)}
function Dn(a,b){var c=a.f,d=b.H,e=b.S,f=b.j,g=c.ce(e);return(g?L(g):Kn(a,d,b.V,b).oa(function(a){d=a;g=new Sl(e,d,f);c.Xd(g);return L(g)})).oa(function(d){var e=gk(b),f=Jn(b);return lm(c,d)?(nm(c,d,f.D),L(f)):gm(c,d)||sm(c,d)?(qm(c,d,e),nm(c,d,f.D),L(f)):Hn(a,e,d).oa(function(a){if(a)return L(null);nm(c,d,f.D);return L(f)})})}
function Nn(a,b){if(!a.M||a.Da){for(var c=a.D,d="";c&&b&&!d&&(1!=c.nodeType||(d=c.style.textAlign,b));c=c.parentNode);if(!b||"justify"==d){var c=a.D,e=c.ownerDocument,d=e.createElement("span");d.style.visibility="hidden";var f=document.body;if(null===Xa){var g=f.ownerDocument,h=g.createElement("div");h.style.position="absolute";h.style.top="0px";h.style.left="0px";h.style.width="30px";h.style.height="100px";h.style.lineHeight="16px";h.style.fontSize="16px";h.style.textAlign="justify";f.appendChild(h);
var l=g.createTextNode("a | ");h.appendChild(l);var k=g.createElement("span");k.style.display="inline-block";k.style.width="30px";h.appendChild(k);g=g.createRange();g.setStart(l,0);g.setEnd(l,3);Xa=27>g.getBoundingClientRect().right;f.removeChild(h)}Xa?a.u?d.style.marginTop="100%":d.style.marginLeft="100%":(d.style.display="inline-block",a.u?d.style.height="100%":d.style.width="100%");d.textContent=" #";d.setAttribute("data-adapt-spec","1");f=b&&(a.M||1!=c.nodeType)?c.nextSibling:c;if(c=c.parentNode)c.insertBefore(d,
f),b||(e=e.createElement("div"),c.insertBefore(e,f),d.style.lineHeight="80px",e.style.marginTop="-80px",e.style.height="0px",e.setAttribute("data-adapt-spec","1"))}}}
function On(a,b,c,d){var e=I("processLineStyling");Vm(d);var f=d.concat([]);d.splice(0,d.length);var g=0,h=b.f;0==h.count&&(h=h.jf);he(function(d){if(h){var e=Pn(a,f),l=h.count-g;if(e.length<=l)Q(d);else{var n=Qn(a,f,e[l-1]);n?Rn(a,n,!1,!1).then(function(){g+=l;dn(a.h,n,0).then(function(e){b=e;Nn(b,!1);h=b.f;f=[];en(a,b,f).then(function(a){c=a;P(d)})})}):Q(d)}}else Q(d)}).then(function(){Array.prototype.push.apply(d,f);Vm(d);O(e,c)});return M(e)}
function Sn(a,b){for(var c=0,d=0,e=b.length-1;0<=e;e--){var f=b[e];if(!f.M||!f.D||1!=f.D.nodeType)break;f=pn(a,f.D);f=a.u?-f.left:f.bottom;0<f?c=Math.max(c,f):d=Math.min(d,f)}return c-d}
function Tn(a,b){var c=I("layoutBreakableBlock"),d=[];en(a,b,d).then(function(e){var f=d.length-1;if(0>f)O(c,e);else{var f=on(a,e,d,f,d[f].pa),g=Tm(a,f);e||(f+=Sn(a,d));En(a,f);var h;b.f?h=On(a,b,e,d):h=L(e);h.then(function(b){0<d.length&&(a.C.push(new Pm(d,d[0].l)),g&&(2!=d.length&&0<a.C.length||d[0].S!=d[1].S||!Jm[d[0].S.localName])&&b&&(b=b.modify(),b.b=!0));O(c,b)})}});return M(c)}
function Qn(a,b,c){Vm(b);for(var d=0,e=b[0].pa,f=d,g=b.length-1,h=b[g].pa,l;e<h;){l=e+Math.ceil((h-e)/2);for(var f=d,k=g;f<k;){var m=f+Math.ceil((k-f)/2);b[m].pa>l?k=m-1:f=m}k=on(a,null,b,f,l);if(a.u?k<c:k>c){for(h=l-1;b[f].pa==l;)f--;g=f}else En(a,k),e=l,d=f}a=b[f];b=a.D;1!=b.nodeType?(Un(a),a.M?a.ia=b.length:(c=e-a.pa,e=b.data,173==e.charCodeAt(c)?(b.replaceData(c,e.length-c,a.w?"":a.h||a.parent&&a.parent.h||"-"),e=c+1):(d=e.charAt(c),c++,f=e.charAt(c),b.replaceData(c,e.length-c,!a.w&&Ia(d)&&Ia(f)?
a.h||a.parent&&a.parent.h||"-":""),e=c),c=e,0<c&&(e=c,a=a.modify(),a.ia+=e,a.g=null)),e=a):e=a;return e}function Un(a){(Jd.RESOLVE_TEXT_NODE_BREAKER||[]).reduce(function(b,c){return c(a)||b},Vn)}var Vn=new function(){};function fn(a){return a?(a=a.D)&&1===a.nodeType?!!a.getAttribute("data-adapt-spec"):!1:!1}
function Pn(a,b){for(var c=[],d=b[0].D,e=b[b.length-1].D,f=[],g=d.ownerDocument.createRange(),h=!1,l=null,k=!1,m=!0;m;){var n=!0;do{var r=null;d==e&&(m=!1);1!=d.nodeType?(k||(g.setStartBefore(d),k=!0),l=d):h?h=!1:d.getAttribute("data-adapt-spec")?n=!k:r=d.firstChild;r||(r=d.nextSibling,r||(h=!0,r=d.parentNode));d=r}while(n&&m);if(k){g.setEndAfter(l);k=Lm(a.b,g);for(n=0;n<k.length;n++)f.push(k[n]);k=!1}}f.sort(a.u?ek:dk);l=d=h=g=e=0;for(m=Hk(a);;){if(l<f.length&&(k=f[l],n=1,0<d&&(n=Math.max(a.u?k.right-
k.left:k.bottom-k.top,1),n=m*(a.u?k.right:k.top)<m*e?m*((a.u?k.left:k.bottom)-e)/n:m*(a.u?k.left:k.bottom)>m*g?m*(g-(a.u?k.right:k.top))/n:1),!d||.6<=n||.2<=n&&(a.u?k.top:k.left)>=h-1)){h=a.u?k.bottom:k.right;a.u?(e=d?Math.max(e,k.right):k.right,g=d?Math.min(g,k.left):k.left):(e=d?Math.min(e,k.top):k.top,g=d?Math.max(g,k.bottom):k.bottom);d++;l++;continue}0<d&&(c.push(g),d=0);if(l>=f.length)break}c.sort(Ma);a.u&&c.reverse();return c}
function Wn(a,b){if(!a.g)return L(!0);for(var c=!1,d=a.g.length-1;0<=d;--d){var e=a.g[d];if(e.pa<=b)break;a.g.pop();e.b!==e.f&&(c=!0)}if(!c)return L(!0);var f=I("clearFootnotes"),g=a.ka+a.ya,h=a.g;a.O=null;a.g=null;var l=0;ge(function(){for(;l<h.length;){var b=h[l++],b=un(a,b.pa,b.f,g);if(b.za())return b}return L(!1)}).then(function(){O(f,!0)});return M(f)}
function Xn(a,b){var c=0;uk(b,function(a){if("clone"===a.qb["box-decoration-break"]){var b=rn(this,a.D);c+=a.u?-b.left:b.bottom;"table"===a.display&&(c+=a.rd)}}.bind(a));return c}
function Qm(a,b,c){for(var d=b.h,e=d[0];e.parent&&e.Da;)e=e.parent;var f;c?f=c=1:(c=Math.max((e.qb.widows||2)-0,1),f=Math.max((e.qb.orphans||2)-0,1));var e=Xn(a,e),g=Pn(a,d),h=a.F-e;(d=b.g())&&(h-=(a.u?-1:1)*Sm(d));d=La(g.length,function(b){return a.u?g[b]<h:g[b]>h});d=Math.min(g.length-c,d);if(d<f)return null;h=g[d-1];if(b=Qn(a,b.h,h))a.ka=Hk(a)*(h-a.ya);return b}function Rn(a,b,c,d){var e=Mm(b.L).b(a,b,c,d);e||(e=Yn.b(a,b,c,d));return e}
Xm.prototype.Gb=function(){var a=null,b=null,c,d=0;do{c=d;for(var d=Number.MAX_VALUE,e=this.C.length-1;0<=e&&!b;--e){var a=this.C[e],b=a.f(this,c),f=a.b();f>c&&(d=Math.min(d,f))}}while(d>c&&!b);return{Tc:b?a:null,B:b}};
function Zn(a,b,c,d){var e=I("findAcceptableBreak"),f=a.Gb().B,g=!1;if(!f){u.b("Could not find any page breaks?!!");if(a.ac)return $n(a,b).then(function(b){b?(b=b.modify(),b.b=!1,Rn(a,b,g,!0).then(function(){O(e,b)})):O(e,b)}),M(e);f=c;g=!0;a.ka=d}Rn(a,f,g,!0).then(function(){O(e,f)});return M(e)}function ao(a){a=a.toString();return""==a||"auto"==a||!!a.match(/^0+(.0*)?[^0-9]/)}
function bo(a,b,c,d,e){var f;if(!(f=!b))a:{for(f=b.D;f;){if(f.parentNode===f.ownerDocument){f=!1;break a}f=f.parentNode}f=!0}if(f)return!1;f=Km(b,a.b,0,a.u);var g=b.M?b.parent&&b.parent.L:b.L;g&&(g=g.dc())&&(f+=(a.u?-1:1)*Sm(g));g=Tm(a,f);c&&(f+=Sn(a,c));En(a,f);if((d=a.l?d:!0)||!g)c=kk(b),b=Mm(b.L).g(c,e,g,a.ka),a.C.push(b);return g}
function co(a,b){if(b.D.parentNode){var c=pn(a,b.D),d=b.D.ownerDocument.createElement("div");a.u?(d.style.bottom="0px",d.style.width="1px",d.style.marginRight=c.right+"px"):(d.style.right="0px",d.style.height="1px",d.style.marginTop=c.top+"px");b.D.parentNode.insertBefore(d,b.D);var e=Xj(a.b,d),e=a.u?e.right:e.top,f=Hk(a),g;switch(b.A){case "left":g=a.bc;break;case "right":g=a.sc;break;default:g=f*Math.max(a.sc*f,a.bc*f)}e*f>=g*f?b.D.parentNode.removeChild(d):(e=Math.max(1,(g-e)*f),a.u?d.style.width=
e+"px":d.style.height=e+"px",e=Xj(a.b,d),e=a.u?e.left:e.bottom,a.u?(g=e+c.right-g,0<g==0<=c.right&&(g+=c.right),d.style.marginLeft=g+"px"):(g-=e+c.top,0<g==0<=c.top&&(g+=c.top),d.style.marginBottom=g+"px"),b.C=d)}}
function eo(a,b,c,d){function e(){return!!d||!c&&!!cl[m]}function f(){b=r[0]||b;b.D.parentNode.removeChild(b.D);h.j=m}var g=b.M?b.parent&&b.parent.L:b.L;if(g&&!(g instanceof Wm))return L(b);var h=a,l=I("skipEdges"),k=!d&&c&&b&&b.M,m=d,n=null,r=[],q=[],z=!1;he(function(a){for(;b;){do if(b.D){if(b.Da&&1!=b.D.nodeType){if(Zj(b.D,b.Qb))break;if(!b.M){e()?f():bo(h,n,null,!0,m)?(b=(h.l?n||b:b).modify(),b.b=!0):(b=b.modify(),b.g=m);Q(a);return}}if(!b.M&&(b.A&&co(h,b),!(b.L instanceof Wm)||Ym(h,b)||b.G)){r.push(kk(b));
m=al(m,b.g);if(e())f();else if(bo(h,n,null,!0,m)||!hn(h.Va,b))b=(h.l?n||b:b).modify(),b.b=!0;Q(a);return}if(1==b.D.nodeType){var d=b.D.style;if(b.M){if(z){if(e()){f();Q(a);return}r=[];k=c=!1;m=null}z=!1;n=kk(b);q.push(n);m=al(m,b.F);if(d&&(!ao(d.paddingBottom)||!ao(d.borderBottomWidth))){if(bo(h,n,null,!0,m)&&(b=(h.l?n||b:b).modify(),b.b=!0,h.l)){Q(a);return}q=[n];n=null}}else{r.push(kk(b));m=al(m,b.g);if(!hn(h.Va,b)&&(bo(h,n,null,!1,m),b=b.modify(),b.b=!0,h.l)){Q(a);return}if(Jm[b.D.localName]){e()?
f():bo(h,n,null,!0,m)&&(b=(h.l?n||b:b).modify(),b.b=!0);Q(a);return}!d||ao(d.paddingTop)&&ao(d.borderTopWidth)||(k=!1,q=[]);z=!0}}}while(0);d=gn(h.h,b,k);if(d.za()){d.then(function(c){b=c;P(a)});return}b=d.get()}bo(h,n,q,!1,m)?n&&h.l&&(b=n.modify(),b.b=!0):cl[m]&&(h.j=m);Q(a)}).then(function(){n&&(h.La=rk(n));O(l,b)});return M(l)}
function $n(a,b){var c=kk(b),d=I("skipEdges"),e=null,f=!1;he(function(d){for(;b;){do if(b.D){if(b.Da&&1!=b.D.nodeType){if(Zj(b.D,b.Qb))break;if(!b.M){cl[e]&&(a.j=e);Q(d);return}}if(!b.M&&(Ym(a,b)||b.G)){e=al(e,b.g);cl[e]&&(a.j=e);Q(d);return}if(1==b.D.nodeType){var g=b.D.style;if(b.M){if(f){if(cl[e]){a.j=e;Q(d);return}e=null}f=!1;e=al(e,b.F)}else{e=al(e,b.g);if(Jm[b.D.localName]){cl[e]&&(a.j=e);Q(d);return}if(g&&(!ao(g.paddingTop)||!ao(g.borderTopWidth))){Q(d);return}}f=!0}}while(0);g=gn(a.h,b);if(g.za()){g.then(function(a){b=
a;P(d)});return}b=g.get()}c=null;Q(d)}).then(function(){O(d,c)});return M(d)}function jn(a,b){return"footnote"==b.j?An(a,b):Cn(a,b)}function fo(a,b,c,d){var e=I("layoutNext");eo(a,b,c,d).then(function(c){b=c;!b||a.j||a.l&&b&&b.b?O(e,b):Mm(b.L).f(b,a).Fa(e)});return M(e)}function go(a,b){do{var c=a.D.parentNode;if(!c)break;var d=c,e=a.D;if(d)for(var f;(f=d.lastChild)!=e;)d.removeChild(f);b&&(c.removeChild(a.D),b=!1);a=a.parent}while(a)}
function yn(a){var b=a.element.ownerDocument.createElement("div");b.style.position="absolute";b.style.top=a.A+"px";b.style.right=a.H+"px";b.style.bottom=a.G+"px";b.style.left=a.w+"px";a.element.appendChild(b);var c=Xj(a.b,b);a.element.removeChild(b);var b=a.$a+a.left+Fk(a),d=a.ab+a.top+Dk(a);a.ta=new Rf(b,d,b+a.width,d+a.height);a.V=c?a.u?c.top:c.left:0;a.X=c?a.u?c.bottom:c.right:0;a.ya=c?a.u?c.right:c.top:0;a.kb=c?a.u?c.left:c.bottom:0;a.bc=a.ya;a.sc=a.ya;a.Ab=a.ya;a.F=a.kb;var c=a.ta,e,b=a.$a+a.left+
Fk(a),d=a.ab+a.top+Dk(a);e=new Rf(b,d,b+a.width,d+a.height);if(a.xa){b=a.xa;d=e.U;e=e.R;for(var f=[],g=0;g<b.b.length;g++){var h=b.b[g];f.push(new Sf(h.f+d,h.b+e))}b=new Xf(f)}else b=$f(e.U,e.R,e.T,e.N);a.J=kg(c,[b],Zm(a),a.pb,a.u);nn(a);a.g=null}function wn(a){a.Td=[];v(a.element,"width",a.width+"px");v(a.element,"height",a.height+"px");yn(a);a.ka=0;a.Yd=!1;a.j=null;a.La=null}function En(a,b){a.ka=Math.max(Hk(a)*(b-a.ya),a.ka)}
function ho(a,b){var c=b.b;if(!c)return L(!0);var d=I("layoutOverflownFootnotes"),e=0;ge(function(){for(;e<c.length;){var b=c[e++],b=un(a,0,b,a.ya);if(b.za())return b}return L(!1)}).then(function(){O(d,!0)});return M(d)}
function zn(a,b,c,d){a.Td.push(b);b.Ba.M&&(a.La=b.Ba);if(a.l&&a.Yd)return L(b);var e=I("layout");ho(a,b).then(function(){a.vb(b.Ba).then(function(b){var f=b,h=a.ka;a.C=[];he(function(e){for(;b;){var g=!0;fo(a,b,c,d||null).then(function(d){c=!1;b=d;wm(a.f)?Q(e):a.j?Q(e):b&&a.l&&b&&b.b?Zn(a,b,f,h).then(function(a){b=a;Q(e)}):g?g=!1:P(e)});if(g){g=!1;return}}Q(e)}).then(function(){if(wm(a.f))O(e,null);else{var c=a.O;c&&(a.element.appendChild(c.element),a.u?a.ka=this.ya-this.kb:a.ka=c.top+Dk(c)+c.ka+
Ek(c));if(b){a.Yd=!0;c=new vk(rk(b));if(a.g){for(var d=[],f=0;f<a.g.length;f++){var g=a.g[f].b;g&&d.push(g)}c.b=d.length?d:null}O(e,c)}else O(e,null)}})})});return M(e)}
function xn(a){for(var b=a.Td,c=a.element.lastChild;c!=a.$e;){var d=c.previousSibling;a.element===c.parentNode&&c.getAttribute("data-adapt-pseudo")||a.element.removeChild(c);c=d}mn(a);wn(a);var e=I("redoLayout"),f=0,g=null,h=!0;he(function(c){if(f<b.length){var d=b[f++];zn(a,d,h).then(function(a){h=!1;a?(g=a,Q(c)):P(c)})}else Q(c)}).then(function(){O(e,g)});return M(e)}function io(){}
io.prototype.f=function(a,b){var c;if(Ym(b,a))c=jn(b,a);else{a:if(a.M)c=!0;else{switch(a.S.namespaceURI){case "http://www.w3.org/2000/svg":c=!1;break a}c=!a.G}c=c?Tn(b,a):kn(b,a)}return c};io.prototype.g=function(a,b,c,d){return new Rm(kk(a),b,c,d)};io.prototype.b=function(a,b,c,d){c=c||!!b.D&&1==b.D.nodeType&&!b.M;go(b,c);d&&(Nn(b,!0),jo(c?b:b.parent));return Wn(a,b.pa)};var Yn=new io;
Kd("RESOLVE_FORMATTING_CONTEXT",function(a,b,c,d,e,f){b=a.parent;return!b&&a.L?null:b&&a.L!==b.L?null:a.yc||!a.L&&el(c,d,e,f).display===Mc?new Wm(b?b.L:null):null});Kd("RESOLVE_LAYOUT_PROCESSOR",function(a){return a instanceof Wm?Yn:null});function Gn(a,b,c,d,e,f,g){Xm.call(this,b,c,d,e,f);this.eb=a;this.ze=g;this.we=this.Be=null}t(Gn,Xm);Gn.prototype.vb=function(a){return Xm.prototype.vb.call(this,a).oa(function(a){a&&ko(this,a);return L(a)}.bind(this))};
function ko(a,b){function c(a,b){a.forEach(function(a){var c=Aa(d,a);c&&"%"===c.charAt(c.length-1)&&v(d,a,b*parseFloat(c)/100+"px")})}for(;b.parent;)b=b.parent;var d=a.Be=b.D,e=Mk(a.ze),f=e.T-e.U,e=e.N-e.R;c(["width","max-width","min-width"],f);c(["height","max-height","min-height"],e);c("margin-top margin-right margin-bottom margin-left padding-top padding-right padding-bottom padding-left".split(" "),a.u?e:f);["margin-top","margin-right","margin-bottom","margin-left"].forEach(function(a){"auto"===
Aa(d,a)&&v(d,a,"0")});a.we=pn(a,d);f=a.eb.f;if(a.ze.u){if("block-end"===f||"left"===f)f=Aa(d,"height"),""!==f&&"auto"!==f&&v(d,"margin-top","auto")}else if("block-end"===f||"bottom"===f)f=Aa(d,"width"),""!==f&&"auto"!==f&&v(d,"margin-left","auto")};function lo(a,b){this.b=a;this.$=b}function mo(a,b,c,d){this.b=a;this.g=b;this.j=c;this.f=d;this.h=null}function no(a,b){this.b=a;this.f=b}function oo(a){var b={};Object.keys(a).forEach(function(c){b[c]=Array.from(a[c])});return b}function po(a,b){this.$b=a;this.Hc=b;this.Jd=null;this.$=this.P=-1}function Yi(a,b,c){b=a.b.J.Qd(b,a.f);a.b.l[b]=c}function qo(a){return(a=a.match(/^[^#]*#(.*)$/))?a[1]:null}function ro(a,b){var c=a.b.J.Nc(oa(b,a.g),a.g);"#"===c.charAt(0)&&(c=c.substring(1));return c}
function Di(a,b,c){return new vb(a.f,function(){var d=a.b.b[b];return c(d&&d.length?d[d.length-1]:null)},"page-counter-"+b)}function Fi(a,b,c){return new vb(a.f,function(){return c(a.b.b[b]||[])},"page-counters-"+b)}function so(a,b,c,d){var e=a.b.l[c];if(!e&&d&&b){d=a.h;if(b){d.A=b;for(b=0;d.A&&(b+=5E3,rl(d,b,0)!==Number.POSITIVE_INFINITY););d.A=null}e=a.b.l[c]}return e||null}
function Hi(a,b,c,d){var e=qo(b),f=ro(a,b),g=so(a,e,f,!1);return g&&g[c]?(b=g[c],new tb(a.j,d(b[b.length-1]||null))):new vb(a.f,function(){if(g=so(a,e,f,!0)){if(g[c]){var b=g[c];return d(b[b.length-1]||null)}if(b=a.b.j.b[f]?a.b.b:a.b.A[f]||null)return to(a.b,f),b[c]?(b=b[c],d(b[b.length-1]||null)):d(0);uo(a.b,f,!1);return"??"}uo(a.b,f,!1);return"??"},"target-counter-"+c+"-of-"+b)}
function Ji(a,b,c,d){var e=qo(b),f=ro(a,b);return new vb(a.f,function(){var b=a.b.j.b[f]?a.b.b:a.b.A[f]||null;if(b){to(a.b,f);var b=b[c]||[],h=so(a,e,f,!0)[c]||[];return d(b.concat(h))}uo(a.b,f,!1);return"??"},"target-counters-"+c+"-of-"+b)}function vo(a){this.J=a;this.l={};this.A={};this.b={};this.b.page=[0];this.G={};this.F=[];this.C={};this.j=null;this.w=[];this.g=[];this.H=[];this.f={};this.h={}}function wo(a,b){var c=a.b.page;c&&c.length?c[c.length-1]=b:a.b.page=[b]}
function xo(a,b,c){a.G=oo(a.b);var d,e=b["counter-reset"];e&&(e=e.evaluate(c))&&(d=vg(e,!0));if(d)for(var f in d){var e=a,g=f,h=d[f];e.b[g]?e.b[g].push(h):e.b[g]=[h]}var l;(b=b["counter-increment"])&&(c=b.evaluate(c))&&(l=vg(c,!1));l?"page"in l||(l.page=1):l={page:1};for(var k in l)a.b[k]||(c=a,b=k,c.b[b]?c.b[b].push(0):c.b[b]=[0]),c=a.b[k],c[c.length-1]+=l[k]}function yo(a,b){a.F.push(a.b);a.b=oo(b)}
function to(a,b){var c=a.f[b],d=a.h[b];d||(d=a.h[b]=[]);for(var e=!1,f=0;f<a.g.length;){var g=a.g[f];g.$b===b?(g.Hc=!0,a.g.splice(f,1),c&&(e=c.indexOf(g),0<=e&&c.splice(e,1)),d.push(g),e=!0):f++}e||uo(a,b,!0)}function uo(a,b,c){a.w.some(function(a){return a.$b===b})||a.w.push(new po(b,c))}
function zo(a,b,c){var d=Object.keys(a.j.b);if(0<d.length){var e=oo(a.b);d.forEach(function(a){this.A[a]=e;var d=this.C[a];if(d&&d.$<c&&(d=this.h[a])){var f=this.f[a];f||(f=this.f[a]=[]);for(var g;g=d.shift();)g.Hc=!1,f.push(g)}this.C[a]={P:b,$:c}},a)}for(var d=a.G,f;f=a.w.shift();){f.Jd=d;f.P=b;f.$=c;var g;f.Hc?(g=a.h[f.$b])||(g=a.h[f.$b]=[]):(g=a.f[f.$b])||(g=a.f[f.$b]=[]);g.every(function(a){return!(f===a||a&&f.$b===a.$b&&f.Hc===a.Hc&&f.P===a.P&&f.$===a.$)})&&g.push(f)}a.j=null}
function Ao(a,b){var c=[];Object.keys(b.b).forEach(function(a){(a=this.f[a])&&(c=c.concat(a))},a);c.sort(function(a,b){return a.P-b.P||a.$-b.$});var d=[],e=null;c.forEach(function(a){e&&e.P===a.P&&e.$===a.$?e.bd.push(a):(e={P:a.P,$:a.$,Jd:a.Jd,bd:[a]},d.push(e))});return d}function Bo(a,b){a.H.push(a.g);a.g=b}function hn(a,b){if(!b||b.M)return!0;var c=b.D;if(!c||1!==c.nodeType)return!0;c=c.getAttribute("id")||c.getAttribute("name");return c&&(a.b.h[c]||a.b.f[c])?(c=a.b.C[c])?a.$>=c.$:!0:!0};var Co=1;function Do(a,b,c,d,e){this.b={};this.j=[];this.g=null;this.index=0;this.f=a;this.name=b;this.Mb=c;this.Ca=d;this.parent=e;this.l="p"+Co++;e&&(this.index=e.j.length,e.j.push(this))}Do.prototype.h=function(){throw Error("E_UNEXPECTED_CALL");};Do.prototype.clone=function(){throw Error("E_UNEXPECTED_CALL");};function Eo(a,b){var c=a.b,d=b.b,e;for(e in c)Object.prototype.hasOwnProperty.call(c,e)&&(d[e]=c[e])}function Fo(a,b){for(var c=0;c<a.j.length;c++)a.j[c].clone({parent:b})}
function Go(a){Do.call(this,a,null,null,[],null);this.b.width=new V(Dd,0);this.b.height=new V(Ed,0)}t(Go,Do);
function Ho(a,b){this.g=b;var c=this;sb.call(this,a,function(a,b){var d=a.match(/^([^.]+)\.([^.]+)$/);if(d){var e=c.g.w[d[1]];if(e&&(e=this.na[e])){if(b){var d=d[2],h=e.ga[d];if(h)e=h;else{switch(d){case "columns":var h=e.b.f,l=new kc(h,0),k=Io(e,"column-count"),m=Io(e,"column-width"),n=Io(e,"column-gap"),h=x(h,mc(h,new hc(h,"min",[l,k]),w(h,m,n)),n)}h&&(e.ga[d]=h);e=h}}else e=Io(e,d[2]);return e}}return null})}t(Ho,sb);
function Jo(a,b,c,d,e,f,g){a=a instanceof Ho?a:new Ho(a,this);Do.call(this,a,b,c,d,e);this.g=this;this.W=f;this.Z=g;this.b.width=new V(Dd,0);this.b.height=new V(Ed,0);this.b["wrap-flow"]=new V(Lc,0);this.b.position=new V(od,0);this.b.overflow=new V(Ad,0);this.w={}}t(Jo,Do);Jo.prototype.h=function(a){return new Ko(a,this)};Jo.prototype.clone=function(a){a=new Jo(this.f,this.name,a.Mb||this.Mb,this.Ca,this.parent,this.W,this.Z);Eo(this,a);Fo(this,a);return a};
function Lo(a,b,c,d,e){Do.call(this,a,b,c,d,e);this.g=e.g;b&&(this.g.w[b]=this.l);this.b["wrap-flow"]=new V(Lc,0)}t(Lo,Do);Lo.prototype.h=function(a){return new Mo(a,this)};Lo.prototype.clone=function(a){a=new Lo(a.parent.f,this.name,this.Mb,this.Ca,a.parent);Eo(this,a);Fo(this,a);return a};function No(a,b,c,d,e){Do.call(this,a,b,c,d,e);this.g=e.g;b&&(this.g.w[b]=this.l)}t(No,Do);No.prototype.h=function(a){return new Oo(a,this)};
No.prototype.clone=function(a){a=new No(a.parent.f,this.name,this.Mb,this.Ca,a.parent);Eo(this,a);Fo(this,a);return a};function Y(a,b,c){return b&&b!==Lc?b.ra(a,c):null}function Po(a,b,c){return b&&b!==Lc?b.ra(a,c):a.b}function Qo(a,b,c){return b?b===Lc?null:b.ra(a,c):a.b}function Ro(a,b,c,d){return b&&c!==F?b.ra(a,d):a.b}function So(a,b,c){return b?b===Bd?a.j:b===Xc?a.h:b.ra(a,a.b):c}
function To(a,b){this.f=a;this.b=b;this.J={};this.style={};this.A=this.C=null;this.w=[];this.O=this.V=this.g=this.h=!1;this.G=this.H=0;this.F=null;this.na={};this.ga={};this.xa=this.u=!1;a&&a.w.push(this)}function Uo(a){a.H=0;a.G=0}function Vo(a,b,c){b=Io(a,b);c=Io(a,c);if(!b||!c)throw Error("E_INTERNAL");return w(a.b.f,b,c)}
function Io(a,b){var c=a.na[b];if(c)return c;var d=a.style[b];d&&(c=d.ra(a.b.f,a.b.f.b));switch(b){case "margin-left-edge":c=Io(a,"left");break;case "margin-top-edge":c=Io(a,"top");break;case "margin-right-edge":c=Vo(a,"border-right-edge","margin-right");break;case "margin-bottom-edge":c=Vo(a,"border-bottom-edge","margin-bottom");break;case "border-left-edge":c=Vo(a,"margin-left-edge","margin-left");break;case "border-top-edge":c=Vo(a,"margin-top-edge","margin-top");break;case "border-right-edge":c=
Vo(a,"padding-right-edge","border-right-width");break;case "border-bottom-edge":c=Vo(a,"padding-bottom-edge","border-bottom-width");break;case "padding-left-edge":c=Vo(a,"border-left-edge","border-left-width");break;case "padding-top-edge":c=Vo(a,"border-top-edge","border-top-width");break;case "padding-right-edge":c=Vo(a,"right-edge","padding-right");break;case "padding-bottom-edge":c=Vo(a,"bottom-edge","padding-bottom");break;case "left-edge":c=Vo(a,"padding-left-edge","padding-left");break;case "top-edge":c=
Vo(a,"padding-top-edge","padding-top");break;case "right-edge":c=Vo(a,"left-edge","width");break;case "bottom-edge":c=Vo(a,"top-edge","height")}if(!c){if("extent"==b)d=a.u?"width":"height";else if("measure"==b)d=a.u?"height":"width";else{var e=a.u?th:uh,d=b,f;for(f in e)d=d.replace(f,e[f])}d!=b&&(c=Io(a,d))}c&&(a.na[b]=c);return c}
function Wo(a){var b=a.b.f,c=a.style,d=So(b,c.enabled,b.j),e=Y(b,c.page,b.b);if(e)var f=new fc(b,"page-number"),d=lc(b,d,new Yb(b,e,f));(e=Y(b,c["min-page-width"],b.b))&&(d=lc(b,d,new Xb(b,new fc(b,"page-width"),e)));(e=Y(b,c["min-page-height"],b.b))&&(d=lc(b,d,new Xb(b,new fc(b,"page-height"),e)));d=a.X(d);c.enabled=new E(d)}To.prototype.X=function(a){return a};
To.prototype.Cd=function(){var a=this.b.f,b=this.style,c=this.f?this.f.style.width.ra(a,null):null,d=Y(a,b.left,c),e=Y(a,b["margin-left"],c),f=Ro(a,b["border-left-width"],b["border-left-style"],c),g=Po(a,b["padding-left"],c),h=Y(a,b.width,c),l=Y(a,b["max-width"],c),k=Po(a,b["padding-right"],c),m=Ro(a,b["border-right-width"],b["border-right-style"],c),n=Y(a,b["margin-right"],c),r=Y(a,b.right,c),q=w(a,f,g),z=w(a,f,k);d&&r&&h?(q=x(a,c,w(a,h,w(a,w(a,d,q),z))),e?n?r=x(a,q,n):n=x(a,q,w(a,r,e)):(q=x(a,q,
r),n?e=x(a,q,n):n=e=mc(a,q,new tb(a,.5)))):(e||(e=a.b),n||(n=a.b),d||r||h||(d=a.b),d||h?d||r?h||r||(h=this.C,this.h=!0):d=a.b:(h=this.C,this.h=!0),q=x(a,c,w(a,w(a,e,q),w(a,n,z))),this.h&&(l||(l=x(a,q,d?d:r)),this.u||!Y(a,b["column-width"],null)&&!Y(a,b["column-count"],null)||(h=l,this.h=!1)),d?h?r||(r=x(a,q,w(a,d,h))):h=x(a,q,w(a,d,r)):d=x(a,q,w(a,r,h)));a=Po(a,b["snap-width"]||(this.f?this.f.style["snap-width"]:null),c);b.left=new E(d);b["margin-left"]=new E(e);b["border-left-width"]=new E(f);b["padding-left"]=
new E(g);b.width=new E(h);b["max-width"]=new E(l?l:h);b["padding-right"]=new E(k);b["border-right-width"]=new E(m);b["margin-right"]=new E(n);b.right=new E(r);b["snap-width"]=new E(a)};
To.prototype.Dd=function(){var a=this.b.f,b=this.style,c=this.f?this.f.style.width.ra(a,null):null,d=this.f?this.f.style.height.ra(a,null):null,e=Y(a,b.top,d),f=Y(a,b["margin-top"],c),g=Ro(a,b["border-top-width"],b["border-top-style"],c),h=Po(a,b["padding-top"],c),l=Y(a,b.height,d),k=Y(a,b["max-height"],d),m=Po(a,b["padding-bottom"],c),n=Ro(a,b["border-bottom-width"],b["border-bottom-style"],c),r=Y(a,b["margin-bottom"],c),q=Y(a,b.bottom,d),z=w(a,g,h),y=w(a,n,m);e&&q&&l?(d=x(a,d,w(a,l,w(a,w(a,e,z),
y))),f?r?q=x(a,d,f):r=x(a,d,w(a,q,f)):(d=x(a,d,q),r?f=x(a,d,r):r=f=mc(a,d,new tb(a,.5)))):(f||(f=a.b),r||(r=a.b),e||q||l||(e=a.b),e||l?e||q?l||q||(l=this.A,this.g=!0):e=a.b:(l=this.A,this.g=!0),d=x(a,d,w(a,w(a,f,z),w(a,r,y))),this.g&&(k||(k=x(a,d,e?e:q)),this.u&&(Y(a,b["column-width"],null)||Y(a,b["column-count"],null))&&(l=k,this.g=!1)),e?l?q||(q=x(a,d,w(a,e,l))):l=x(a,d,w(a,q,e)):e=x(a,d,w(a,q,l)));a=Po(a,b["snap-height"]||(this.f?this.f.style["snap-height"]:null),c);b.top=new E(e);b["margin-top"]=
new E(f);b["border-top-width"]=new E(g);b["padding-top"]=new E(h);b.height=new E(l);b["max-height"]=new E(k?k:l);b["padding-bottom"]=new E(m);b["border-bottom-width"]=new E(n);b["margin-bottom"]=new E(r);b.bottom=new E(q);b["snap-height"]=new E(a)};
function Xo(a){var b=a.b.f,c=a.style;a=Y(b,c[a.u?"height":"width"],null);var d=Y(b,c["column-width"],a),e=Y(b,c["column-count"],null),f;(f=(f=c["column-gap"])&&f!==kd?f.ra(b,null):null)||(f=new ec(b,1,"em"));d&&!e&&(e=new hc(b,"floor",[nc(b,w(b,a,f),w(b,d,f))]),e=new hc(b,"max",[b.f,e]));e||(e=b.f);d=x(b,nc(b,w(b,a,f),e),f);c["column-width"]=new E(d);c["column-count"]=new E(e);c["column-gap"]=new E(f)}function Yo(a,b,c,d){a=a.style[b].ra(a.b.f,null);return Hb(a,c,d,{})}
function Zo(a,b){b.na[a.b.l]=a;var c=a.b.f,d=a.style,e=a.f?$o(a.f,b):null,e=kj(a.J,b,e,!1);a.u=jj(e,b,a.f?a.f.u:!1);lj(e,d,a.u,function(a,b){return b.value});a.C=new vb(c,function(){return a.H},"autoWidth");a.A=new vb(c,function(){return a.G},"autoHeight");a.Cd();a.Dd();Xo(a);Wo(a)}function ap(a,b,c){(a=a.style[c])&&(a=Qf(b,a,c));return a}function Z(a,b,c){(a=a.style[c])&&(a=Qf(b,a,c));return Hc(a,b)}
function $o(a,b){var c;a:{if(c=a.J["region-id"]){for(var d=[],e=0;e<c.length;e++){var f=c[e].evaluate(b,"");f&&f!==B&&d.push(f)}if(d.length){c=d;break a}}c=null}if(c){d=[];for(e=0;e<c.length;e++)d[e]=c[e].toString();return d}return null}function bp(a,b,c,d,e){if(a=ap(a,b,d))a.Vb()&&zb(a.fa)&&(a=new D(Hc(a,b),"px")),"font-family"===d&&(a=Dl(e,a)),v(c,d,a.toString())}
function cp(a,b,c){var d=Z(a,b,"left"),e=Z(a,b,"margin-left"),f=Z(a,b,"padding-left"),g=Z(a,b,"border-left-width");a=Z(a,b,"width");Kk(c,d,a);v(c.element,"margin-left",e+"px");v(c.element,"padding-left",f+"px");v(c.element,"border-left-width",g+"px");c.marginLeft=e;c.borderLeft=g;c.w=f}
function dp(a,b,c){var d=Z(a,b,"right"),e=Z(a,b,"snap-height"),f=Z(a,b,"margin-right"),g=Z(a,b,"padding-right");b=Z(a,b,"border-right-width");v(c.element,"margin-right",f+"px");v(c.element,"padding-right",g+"px");v(c.element,"border-right-width",b+"px");c.marginRight=f;c.ga=b;a.u&&0<e&&(a=d+Gk(c),a-=Math.floor(a/e)*e,0<a&&(c.wb=e-a,g+=c.wb));c.H=g;c.xb=e}
function ep(a,b,c){var d=Z(a,b,"snap-height"),e=Z(a,b,"top"),f=Z(a,b,"margin-top"),g=Z(a,b,"padding-top");b=Z(a,b,"border-top-width");c.top=e;c.marginTop=f;c.borderTop=b;c.pb=d;!a.u&&0<d&&(a=e+Dk(c),a-=Math.floor(a/d)*d,0<a&&(c.na=d-a,g+=c.na));c.A=g;v(c.element,"top",e+"px");v(c.element,"margin-top",f+"px");v(c.element,"padding-top",g+"px");v(c.element,"border-top-width",b+"px")}
function fp(a,b,c){var d=Z(a,b,"margin-bottom"),e=Z(a,b,"padding-bottom"),f=Z(a,b,"border-bottom-width");a=Z(a,b,"height")-c.na;v(c.element,"height",a+"px");v(c.element,"margin-bottom",d+"px");v(c.element,"padding-bottom",e+"px");v(c.element,"border-bottom-width",f+"px");c.height=a-c.na;c.marginBottom=d;c.Y=f;c.G=e}function gp(a,b,c){a.u?(ep(a,b,c),fp(a,b,c)):(dp(a,b,c),cp(a,b,c))}
function hp(a,b,c){v(c.element,"border-top-width","0px");var d=Z(a,b,"max-height");a.V?Jk(c,0,d):(ep(a,b,c),d-=c.na,c.height=d,v(c.element,"height",d+"px"))}function ip(a,b,c){v(c.element,"border-left-width","0px");var d=Z(a,b,"max-width");a.O?Kk(c,0,d):(dp(a,b,c),d-=c.wb,c.width=d,a=Z(a,b,"right"),v(c.element,"right",a+"px"),v(c.element,"width",d+"px"))}
var jp="border-left-style border-right-style border-top-style border-bottom-style border-left-color border-right-color border-top-color border-bottom-color outline-style outline-color outline-width overflow visibility".split(" "),kp="border-top-left-radius border-top-right-radius border-bottom-right-radius border-bottom-left-radius border-image-source border-image-slice border-image-width border-image-outset border-image-repeat background-attachment background-color background-image background-repeat background-position background-clip background-origin background-size opacity z-index".split(" "),
lp="color font-family font-size font-style font-weight font-variant line-height letter-spacing text-align text-decoration text-indent text-transform white-space word-spacing".split(" "),mp=["width","height"],np=["transform","transform-origin"];
To.prototype.Lb=function(a,b,c,d){this.f&&this.u==this.f.u||v(b.element,"writing-mode",this.u?"vertical-rl":"horizontal-tb");(this.u?this.h:this.g)?this.u?ip(this,a,b):hp(this,a,b):(this.u?dp(this,a,b):ep(this,a,b),this.u?cp(this,a,b):fp(this,a,b));(this.u?this.g:this.h)?this.u?hp(this,a,b):ip(this,a,b):gp(this,a,b);for(c=0;c<jp.length;c++)bp(this,a,b.element,jp[c],d)};function op(a,b,c,d){for(var e=0;e<lp.length;e++)bp(a,b,c.element,lp[e],d)}
function pp(a,b,c,d){for(var e=0;e<mp.length;e++)bp(a,b,c,mp[e],d)}
To.prototype.Wc=function(a,b,c,d,e,f,g){this.u?this.H=b.ka+b.wb:this.G=b.ka+b.na;var h=(this.u||!d)&&this.g,l=(!this.u||!d)&&this.h;if(l||h)l&&v(b.element,"width","auto"),h&&v(b.element,"height","auto"),d=Xj(f,d?d.element:b.element),l&&(this.H=Math.ceil(d.right-d.left-b.w-b.borderLeft-b.H-b.ga),this.u&&(this.H+=b.wb)),h&&(this.G=d.bottom-d.top-b.A-b.borderTop-b.G-b.Y,this.u||(this.G+=b.na));(this.u?this.g:this.h)&&gp(this,a,b);if(this.u?this.h:this.g){if(this.u?this.O:this.V)this.u?dp(this,a,b):ep(this,
a,b);this.u?cp(this,a,b):fp(this,a,b)}if(1<e&&(l=Z(this,a,"column-rule-width"),d=ap(this,a,"column-rule-style"),f=ap(this,a,"column-rule-color"),0<l&&d&&d!=F&&f!=xd))for(var k=Z(this,a,"column-gap"),m=this.u?b.height:b.width,n=this.u?"border-top":"border-left",h=1;h<e;h++){var r=(m+k)*h/e-k/2+b.w-l/2,q=b.height+b.A+b.G,z=b.element.ownerDocument.createElement("div");v(z,"position","absolute");v(z,this.u?"left":"top","0px");v(z,this.u?"top":"left",r+"px");v(z,this.u?"height":"width","0px");v(z,this.u?
"width":"height",q+"px");v(z,n,l+"px "+d.toString()+(f?" "+f.toString():""));b.element.insertBefore(z,b.element.firstChild)}for(h=0;h<kp.length;h++)bp(this,a,b.element,kp[h],g);for(h=0;h<np.length;h++)e=b,g=np[h],l=c.w,(d=ap(this,a,g))&&l.push(new Pj(e.element,g,d))};
To.prototype.j=function(a,b){var c=this.J,d=this.b.b,e;for(e in d)yh(e)&&zh(c,e,d[e]);if("background-host"==this.b.Mb)for(e in b)if(e.match(/^background-/)||"writing-mode"==e)c[e]=b[e];if("layout-host"==this.b.Mb)for(e in b)e.match(/^background-/)||"writing-mode"==e||(c[e]=b[e]);Qi(a,this.b.Ca,null,c);c.content&&(c.content=c.content.Vc(new vi(a,null,a.pb)));Zo(this,a.l);for(c=0;c<this.b.j.length;c++)this.b.j[c].h(this).j(a,b);a.pop()};
function qp(a,b){a.h&&(a.O=Yo(a,"right",a.C,b)||Yo(a,"margin-right",a.C,b)||Yo(a,"border-right-width",a.C,b)||Yo(a,"padding-right",a.C,b));a.g&&(a.V=Yo(a,"top",a.A,b)||Yo(a,"margin-top",a.A,b)||Yo(a,"border-top-width",a.A,b)||Yo(a,"padding-top",a.A,b));for(var c=0;c<a.w.length;c++)qp(a.w[c],b)}function rp(a){To.call(this,null,a)}t(rp,To);rp.prototype.j=function(a,b){To.prototype.j.call(this,a,b);this.w.sort(function(a,b){return b.b.Z-a.b.Z||a.b.index-b.b.index})};
function Ko(a,b){To.call(this,a,b);this.F=this}t(Ko,To);Ko.prototype.X=function(a){var b=this.b.g;b.W&&(a=lc(b.f,a,b.W));return a};Ko.prototype.Y=function(){};function Mo(a,b){To.call(this,a,b);this.F=a.F}t(Mo,To);function Oo(a,b){To.call(this,a,b);this.F=a.F}t(Oo,To);function sp(a,b,c,d){var e=null;c instanceof Bc&&(e=[c]);c instanceof sc&&(e=c.values);if(e)for(a=a.b.f,c=0;c<e.length;c++)if(e[c]instanceof Bc){var f=qb(e[c].name,"enabled"),f=new fc(a,f);d&&(f=new Ob(a,f));b=lc(a,b,f)}return b}
Oo.prototype.X=function(a){var b=this.b.f,c=this.style,d=So(b,c.required,b.h)!==b.h;if(d||this.g){var e;e=(e=c["flow-from"])?e.ra(b,b.b):new tb(b,"body");e=new hc(b,"has-content",[e]);a=lc(b,a,e)}a=sp(this,a,c["required-partitions"],!1);a=sp(this,a,c["conflicting-partitions"],!0);d&&(c=(c=this.F.style.enabled)?c.ra(b,null):b.j,c=lc(b,c,a),this.F.style.enabled=new E(c));return a};Oo.prototype.Lb=function(a,b,c,d,e){v(b.element,"overflow","hidden");To.prototype.Lb.call(this,a,b,c,d,e)};
function tp(a,b,c,d){jf.call(this,a,b,!1);this.target=c;this.b=d}t(tp,kf);tp.prototype.rb=function(a,b,c){gh(this.b,a,b,c,this)};tp.prototype.nd=function(a,b){lf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};tp.prototype.Ac=function(a,b){lf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};tp.prototype.sb=function(a,b,c){this.target.b[a]=new V(b,c?50331648:67108864)};function up(a,b,c,d){tp.call(this,a,b,c,d)}t(up,tp);
function vp(a,b,c,d){tp.call(this,a,b,c,d);c.b.width=new V(Cd,0);c.b.height=new V(Cd,0)}t(vp,tp);vp.prototype.Lc=function(a,b,c){a=new No(this.f,a,b,c,this.target);hf(this.ja,new up(this.f,this.ja,a,this.b))};vp.prototype.Kc=function(a,b,c){a=new Lo(this.f,a,b,c,this.target);a=new vp(this.f,this.ja,a,this.b);hf(this.ja,a)};function wp(a,b,c,d){tp.call(this,a,b,c,d)}t(wp,tp);wp.prototype.Lc=function(a,b,c){a=new No(this.f,a,b,c,this.target);hf(this.ja,new up(this.f,this.ja,a,this.b))};
wp.prototype.Kc=function(a,b,c){a=new Lo(this.f,a,b,c,this.target);a=new vp(this.f,this.ja,a,this.b);hf(this.ja,a)};function xp(a){a=a.toString();switch(a){case "inline-flex":a="flex";break;case "inline-grid":a="grid";break;case "inline-table":a="table";break;case "inline":case "table-row-group":case "table-column":case "table-column-group":case "table-header-group":case "table-footer-group":case "table-row":case "table-cell":case "table-caption":case "inline-block":a="block"}return C(a)}function el(a,b,c,d){if(a!==F)if(b===Ic||b===Yc)c=F,a=xp(a);else if(c&&c!==F||d)a=xp(a);return{display:a,position:b,eb:c}}
function yp(a,b,c,d,e,f,g){e=e||f||ad;return!!g||!!c&&c!==F||b===Ic||b===Yc||a===dd||a===vd||a===ud||a==Zc||(a===Mc||a===id)&&!!d&&d!==Ad||!!f&&e!==f};function zp(a,b,c){return a.replace(/[uU][rR][lL]\(\s*\"((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\"\r\n])+)\"/gm,function(a,e){return'url("'+c.Nc(e,b)+'"'}).replace(/[uU][rR][lL]\(\s*\'((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\'\r\n])+)\'/gm,function(a,e){return"url('"+c.Nc(e,b)+"'"}).replace(/[uU][rR][lL]\(\s*((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\"\'\r\n\)\s])+)/gm,function(a,e){return"url("+c.Nc(e,b)})};var Ap={"text-indent":"0px","margin-top":"0px","padding-top":"0px","border-top-width":"0px","border-top-style":"none","border-top-color":"transparent","border-top-left-radius":"0px","border-top-right-radius":"0px"},Bp={"text-indent":"0px","margin-right":"0px","padding-right":"0px","border-right-width":"0px","border-right-style":"none","border-right-color":"transparent","border-top-right-radius":"0px","border-bottom-right-radius":"0px"},Cp={"margin-top":"0px"},Dp={"margin-right":"0px"},Ep={};
function Fp(a){a.addEventListener("load",function(){a.contentWindow.navigator.epubReadingSystem={name:"adapt",version:"0.1",layoutStyle:"paginated",hasFeature:function(a){switch(a){case "mouse-events":return!0}return!1}}},!1)}var Gp=(new DOMParser).parseFromString('<root xmlns="http://www.pyroxy.com/ns/shadow"/>',"text/xml"),Hp="footnote-marker first-5-lines first-4-lines first-3-lines first-2-lines first-line first-letter before  after".split(" ");
function Ip(a,b,c,d){this.style=b;this.element=a;this.b=c;this.f=d;this.g={}}
Ip.prototype.l=function(a){var b=a.getAttribute("data-adapt-pseudo")||"";this.b&&b&&b.match(/after$/)&&(this.style=this.b.l(this.element,!0),this.b=null);var c=this.style._pseudos[b]||{};if(!this.g[b]){this.g[b]=!0;var d=c.content;d&&(d=d.evaluate(this.f),Pk(d)&&d.ba(new Ok(a,this.f,d)))}if(b.match(/^first-/)&&!c["x-first-pseudo"]){a=1;if("first-letter"==b)a=0;else if(b=b.match(/^first-([0-9]+)-lines$/))a=b[1]-0;c["x-first-pseudo"]=new V(new Dc(a),0)}return c};
function Jp(a,b,c,d,e,f,g,h,l,k,m,n,r){this.C=a;this.b=b;this.viewport=c;this.w=c.b;this.j=d;this.G=e;this.ea=f;this.F=g;this.l=h;this.H=l;this.page=k;this.f=m;this.A=n;this.g=r;this.J=this.B=null;this.h=!1;this.S=null;this.ia=0;this.D=null}Jp.prototype.clone=function(){return new Jp(this.C,this.b,this.viewport,this.j,this.G,this.ea,this.F,this.l,this.H,this.page,this.f,this.A,this.g)};
function Kp(a,b,c,d,e,f){var g=I("createRefShadow");a.ea.w.load(b).then(function(h){if(h){var l=yj(h,b);if(l){var k=a.H,m=k.H[h.url];if(!m){var m=k.style.l.f[h.url],n=new Ab(0,k.Kb(),k.Jb(),k.w),m=new jl(h,m.g,m.f,n,k.l,m.w,new no(k.j,h.url),new mo(k.j,h.url,m.f,m.b));k.H[h.url]=m}f=new lk(d,l,h,e,f,c,m)}}O(g,f)});return M(g)}
function Lp(a,b,c,d,e,f,g,h){var l=I("createShadows"),k=e.template,m;k instanceof Fc?m=Kp(a,k.url,2,b,h,null):m=L(null);m.then(function(k){var m=null;if("http://www.pyroxy.com/ns/shadow"==b.namespaceURI&&"include"==b.localName){var n=b.getAttribute("href"),z=null;n?z=h?h.ea:a.ea:h&&(n="http://www.w3.org/1999/xhtml"==h.ja.namespaceURI?h.ja.getAttribute("href"):h.ja.getAttributeNS("http://www.w3.org/1999/xlink","href"),z=h.Ld?h.Ld.ea:a.ea);n&&(n=oa(n,z.url),m=Kp(a,n,3,b,h,k))}m||(m=L(k));var y=null;
m.then(function(c){e.display===vd?y=Kp(a,oa("user-agent.xml#table-cell",na),2,b,h,c):y=L(c)});y.then(function(k){var m;if(m=d._pseudos){for(var n=[],r=Gp.createElementNS("http://www.pyroxy.com/ns/shadow","root"),q=r,y=0;y<Hp.length;y++){var z=Hp[y],A;if(z){if(!m[z])continue;if(!("footnote-marker"!=z||c&&a.h))continue;if(z.match(/^first-/)&&(A=e.display,!A||A===cd))continue;if("before"===z||"after"===z)if(A=m[z].content,!A||A===kd||A===F)continue;n.push(z);A=Gp.createElementNS("http://www.w3.org/1999/xhtml",
"span");A.setAttribute("data-adapt-pseudo",z)}else A=Gp.createElementNS("http://www.pyroxy.com/ns/shadow","content");q.appendChild(A);z.match(/^first-/)&&(q=A)}k=n.length?new lk(b,r,null,h,k,2,new Ip(b,d,f,g)):k}O(l,k)})});return M(l)}function $m(a,b,c){a.J=b;a.h=c}
function Mp(a,b,c,d){var e=a.b;c=kj(c,e,a.G,a.h);b=jj(c,e,b);lj(c,d,b,function(b,c){var d=c.evaluate(e,b);"font-family"==b&&(d=Dl(a.F,d));return d});var f=el(d.display||cd,d.position,d["float"],a.S===a.ea.root);["display","position","float"].forEach(function(a){f[a]&&(d[a]=f[a])});return b}
function Np(a,b){for(var c=a.B.S,d=[],e=null,f=a.B.qa,g=-1;c&&1==c.nodeType;){var h=f&&f.root==c;if(!h||2==f.type){var l=(f?f.b:a.j).l(c,!1);d.push(l);e=e||Ba(c)}h?(c=f.ja,f=f.Ld):(c=c.parentNode,g++)}c=Cb(a.b,"em",!g);c={"font-size":new V(new D(c,"px"),0)};f=new Eh(c,a.b);for(g=d.length-1;0<=g;--g){var h=d[g],l=[],k;for(k in h)ih[k]&&l.push(k);l.sort(Hd);for(var m=0;m<l.length;m++){var n=l[m];f.f=n;var r=h[n];r.value!==bd&&(c[n]=r.Vc(f))}}for(var q in b)ih[q]||(c[q]=b[q]);return{lang:e,Sa:c}}
var Op={a:"a",sub:"sub",sup:"sup",table:"table",tr:"tr",td:"td",th:"th",code:"code",body:"div",p:"p",v:"p",date:"p",emphasis:"em",strong:"strong",style:"span",strikethrough:"del"};function Pp(a,b){b=oa(b,a.ea.url);return a.A[b]||b}function Qp(a){a.B.lang=Ba(a.B.S)||a.B.parent&&a.B.parent.lang||a.B.lang}
function Rp(a,b){var c=kh().filter(function(a){return b[a]});if(c.length){var d=a.B.qb;if(a.B.parent){var d=a.B.qb={},e;for(e in a.B.parent.qb)d[e]=a.B.parent.qb[e]}c.forEach(function(a){var c=b[a];if(c){if(c instanceof Dc)d[a]=c.I;else if(c instanceof Bc)d[a]=c.name;else if(c instanceof D)switch(c.fa){case "dpi":case "dpcm":case "dppx":d[a]=c.I*yb[c.fa]}else d[a]=c;delete b[a]}})}}
function Sp(a,b,c,d,e,f){for(var g=Jd.RESOLVE_FORMATTING_CONTEXT||[],h=0;h<g.length;h++){var l=g[h](a,b,c,d,e,f);if(l){a.L=l;break}}}
function Tp(a,b,c){var d=!0,e=I("createElementView"),f=a.S,g=a.B.qa?a.B.qa.b:a.j,h=g.l(f,!1),l={};if(!a.B.parent){var k=Np(a,h),h=k.Sa;a.B.lang=k.lang}var m=h["float-reference"]&&Ql(h["float-reference"].value.toString());a.B.parent&&m&&Rl(m)&&(k=Np(a,h),h=k.Sa,a.B.lang=k.lang);a.B.u=Mp(a,a.B.u,h,l);Rp(a,l);Qp(a);l.direction&&(a.B.na=l.direction.toString());if((k=l["flow-into"])&&k.toString()!=a.C)return O(e,!1),M(e);var n=l.display;if(n===F)return O(e,!1),M(e);var r=!a.B.parent;a.B.G=n===Zc;Lp(a,
f,r,h,l,g,a.b,a.B.qa).then(function(g){a.B.Aa=g;g=l.position;var k=l["float"],q=l.clear,A=a.B.u?zd:ad,H=a.B.parent?a.B.parent.u?zd:ad:A,G="true"===f.getAttribute("data-vivliostyle-flow-root");a.B.yc=yp(n,g,k,l.overflow,A,H,G);a.B.J=g===od||g===Ic||g===Yc;tk(a.B)&&(q=null,k===$c||m&&Rl(m)||(k=null));A=k===hd||k===pd||k===wd||k===Qc||k===fd||k===ed||k===Oc||k===Nc||k===$c;k&&(delete l["float"],k===$c&&(a.h?(A=!1,l.display=Mc):l.display=cd));q&&(q===bd&&a.B.parent&&a.B.parent.A&&(q=C(a.B.parent.A)),
q===hd||q===pd||q===Pc)&&(delete l.clear,l.display&&l.display!=cd&&(a.B.A=q.toString()));var J=n===id&&l["ua-list-item-count"];(A||l["break-inside"]&&l["break-inside"]!==Lc)&&a.B.l++;if(!(q=!A&&!n))a:switch(n.toString()){case "inline":case "inline-block":case "inline-list-item":case "inline-flex":case "inline-grid":case "ruby":case "inline-table":q=!0;break a;default:q=!1}if(!q)a:switch(n.toString()){case "ruby-base":case "ruby-text":case "ruby-base-container":case "ruby-text-container":q=!0;break a;
default:q=!1}a.B.Da=q;a.B.display=n?n.toString():"inline";a.B.j=A?k.toString():null;a.B.H=m||nk;a.B.V=l["column-span"];if(!a.B.Da){if(q=l["break-after"])a.B.F=q.toString();if(q=l["break-before"])a.B.g=q.toString()}a.B.O=l["vertical-align"]&&l["vertical-align"].toString()||"baseline";a.B.X=l["caption-side"]&&l["caption-side"].toString()||"top";q=l["border-collapse"];if(!q||q===C("separate"))if(A=l["border-spacing"])A.Yc()?(q=A.values[0],A=A.values[1]):q=A,q.Vb()&&(a.B.Y=Hc(q,a.b)),A.Vb()&&(a.B.rd=
Hc(A,a.b));if(q=l["x-first-pseudo"])a.B.f=new mk(a.B.parent?a.B.parent.f:null,q.I);if(q=l["white-space"])q=Yj(q.toString()),null!==q&&(a.B.Qb=q);(q=l["hyphenate-character"])&&q!==Lc&&(a.B.h=q.lc);q=l["overflow-wrap"]||["word-wrap"];a.B.w=l["word-break"]===Sc||q===Tc;Sp(a.B,b,n,g,k,r);a.B.parent&&a.B.parent.L&&(b=a.B.parent.L.He(a.B,b));var K=!1,Oa=null,Ca=[],ta=f.namespaceURI,N=f.localName;if("http://www.w3.org/1999/xhtml"==ta)"html"==N||"body"==N||"script"==N||"link"==N||"meta"==N?N="div":"vide_"==
N?N="video":"audi_"==N?N="audio":"object"==N&&(K=!!a.f),f.getAttribute("data-adapt-pseudo")&&h.content&&h.content.value&&h.content.value.url&&(N="img");else if("http://www.idpf.org/2007/ops"==ta)N="span",ta="http://www.w3.org/1999/xhtml";else if("http://www.gribuser.ru/xml/fictionbook/2.0"==ta){ta="http://www.w3.org/1999/xhtml";if("image"==N){if(N="div",(g=f.getAttributeNS("http://www.w3.org/1999/xlink","href"))&&"#"==g.charAt(0)&&(g=yj(a.ea,g)))Oa=Up(a,ta,"img"),g="data:"+(g.getAttribute("content-type")||
"image/jpeg")+";base64,"+g.textContent.replace(/[ \t\n\t]/g,""),Ca.push(me(Oa,g))}else N=Op[N];N||(N=a.B.Da?"span":"div")}else if("http://www.daisy.org/z3986/2005/ncx/"==ta)if(ta="http://www.w3.org/1999/xhtml","ncx"==N||"navPoint"==N)N="div";else if("navLabel"==N){if(N="span",k=f.parentNode){g=null;for(k=k.firstChild;k;k=k.nextSibling)if(1==k.nodeType&&(q=k,"http://www.daisy.org/z3986/2005/ncx/"==q.namespaceURI&&"content"==q.localName)){g=q.getAttribute("src");break}g&&(N="a",f=f.ownerDocument.createElementNS(ta,
"a"),f.setAttribute("href",g))}}else N="span";else"http://www.pyroxy.com/ns/shadow"==ta?(ta="http://www.w3.org/1999/xhtml",N=a.B.Da?"span":"div"):K=!!a.f;J?b?N="li":(N="div",n=Mc,l.display=n):"body"==N||"li"==N?N="div":"q"==N?N="span":"a"==N&&(g=l["hyperlink-processing"])&&"normal"!=g.toString()&&(N="span");l.behavior&&"none"!=l.behavior.toString()&&a.f&&(K=!0);f.dataset&&"true"==f.dataset.mathTypeset&&(K=!0);var Wa;K?Wa=a.f(f,a.B.parent?a.B.parent.D:null,l):Wa=L(null);Wa.then(function(g){g?K&&(d=
"true"==g.getAttribute("data-adapt-process-children")):g=Up(a,ta,N);"a"==N&&g.addEventListener("click",a.page.J,!1);Oa&&(Bn(a,a.B,"inner",Oa),g.appendChild(Oa));"iframe"==g.localName&&"http://www.w3.org/1999/xhtml"==g.namespaceURI&&Fp(g);var h=a.B.qb["image-resolution"],k=[],m=l.width,n=l.height,r=f.getAttribute("width"),q=f.getAttribute("height"),m=m===Lc||!m&&!r,n=n===Lc||!n&&!q;if("http://www.gribuser.ru/xml/fictionbook/2.0"!=f.namespaceURI||"td"==N){for(var r=f.attributes,z=r.length,q=null,y=
0;y<z;y++){var A=r[y],H=A.namespaceURI,G=A.localName,A=A.nodeValue;if(H)if("http://www.w3.org/2000/xmlns/"==H)continue;else"http://www.w3.org/1999/xlink"==H&&"href"==G&&(A=Pp(a,A));else{if(G.match(/^on/))continue;if("style"==G)continue;if(("id"==G||"name"==G)&&b){A=a.g.Qd(A,a.ea.url);g.setAttribute(G,A);Vj(a.page,g,A);continue}"src"==G||"href"==G||"poster"==G?(A=Pp(a,A),"href"===G&&(A=a.g.Nc(A,a.ea.url))):"srcset"==G&&(A=A.split(",").map(function(b){return Pp(a,b.trim())}).join(","));if("poster"===
G&&"video"===N&&"http://www.w3.org/1999/xhtml"===ta&&m&&n){var Wa=new Image,yc=me(Wa,A);Ca.push(yc);k.push({De:Wa,element:g,Ae:yc})}}"http://www.w3.org/2000/svg"==ta&&/^[A-Z\-]+$/.test(G)&&(G=G.toLowerCase());-1!=Vp.indexOf(G.toLowerCase())&&(A=zp(A,a.ea.url,a.g));H&&(Wa=Ep[H])&&(G=Wa+":"+G);"src"!=G||H||"img"!=N&&"input"!=N||"http://www.w3.org/1999/xhtml"!=ta?"href"==G&&"image"==N&&"http://www.w3.org/2000/svg"==ta&&"http://www.w3.org/1999/xlink"==H?a.page.j.push(me(g,A)):H?g.setAttributeNS(H,G,A):
g.setAttribute(G,A):q=A}q&&(Wa="input"===N?new Image:g,r=me(Wa,q),Wa!==g&&(g.src=q),m||n?(m&&n&&h&&1!==h&&k.push({De:Wa,element:g,Ae:r}),Ca.push(r)):a.page.j.push(r))}delete l.content;(m=l["list-style-image"])&&m instanceof Fc&&(m=m.url,Ca.push(me(new Image,m)));Wp(a,l);Xp(a,g,l);if(!a.B.Da&&(m=null,b?c&&(m=a.B.u?Dp:Cp):m="clone"!==a.B.qb["box-decoration-break"]?a.B.u?Bp:Ap:a.B.u?Dp:Cp,m))for(var Mn in m)v(g,Mn,m[Mn]);J&&g.setAttribute("value",l["ua-list-item-count"].stringValue());a.D=g;Ca.length?
le(Ca).then(function(){0<h&&Yp(a,k,h,l,a.B.u);O(e,d)}):ee().then(function(){O(e,d)})})});return M(e)}var Vp="color-profile clip-path cursor filter marker marker-start marker-end marker-mid fill stroke mask".split(" ");
function Yp(a,b,c,d,e){b.forEach(function(b){if("load"===b.Ae.get().get()){var f=b.De,h=f.width/c,f=f.height/c;b=b.element;if(0<h&&0<f)if(d["box-sizing"]===Rc&&(d["border-left-style"]!==F&&(h+=Hc(d["border-left-width"],a.b)),d["border-right-style"]!==F&&(h+=Hc(d["border-right-width"],a.b)),d["border-top-style"]!==F&&(f+=Hc(d["border-top-width"],a.b)),d["border-bottom-style"]!==F&&(f+=Hc(d["border-bottom-width"],a.b))),1<c){var l=d["max-width"]||F,k=d["max-height"]||F;l===F&&k===F?v(b,"max-width",
h+"px"):l!==F&&k===F?v(b,"width",h+"px"):l===F&&k!==F?v(b,"height",f+"px"):"%"!==l.fa?v(b,"max-width",Math.min(h,Hc(l,a.b))+"px"):"%"!==k.fa?v(b,"max-height",Math.min(f,Hc(k,a.b))+"px"):e?v(b,"height",f+"px"):v(b,"width",h+"px")}else 1>c&&(l=d["min-width"]||Fd,k=d["min-height"]||Fd,l.I||k.I?l.I&&!k.I?v(b,"width",h+"px"):!l.I&&k.I?v(b,"height",f+"px"):"%"!==l.fa?v(b,"min-width",Math.max(h,Hc(l,a.b))+"px"):"%"!==k.fa?v(b,"min-height",Math.max(f,Hc(k,a.b))+"px"):e?v(b,"height",f+"px"):v(b,"width",h+
"px"):v(b,"min-width",h+"px"))}})}function Wp(a,b){(Jd.PREPROCESS_ELEMENT_STYLE||[]).forEach(function(c){c(a.B,b)})}function Zp(a){var b=I("createTextNodeView");$p(a).then(function(){var c=a.ia||0,c=aq(a.B.Ka).substr(c);a.D=document.createTextNode(c);O(b,!0)});return M(b)}
function $p(a){if(a.B.Ka)return L(!0);var b,c=b=a.S.textContent,d=I("preprocessTextContent"),e=Jd.PREPROCESS_TEXT_CONTENT||[],f=0;ge(function(){return f>=e.length?L(!1):e[f++](a.B,c).oa(function(a){c=a;return L(!0)})}).then(function(){a.B.Ka=bq(b,c,0);O(d,!0)});return M(d)}
function cq(a,b,c){var d=I("createNodeView"),e=!0;1==a.S.nodeType?b=Tp(a,b,c):8==a.S.nodeType?(a.D=null,b=L(!0)):b=Zp(a);b.then(function(b){e=b;(a.B.D=a.D)&&(b=a.B.parent?a.B.parent.D:a.J)&&b.appendChild(a.D);O(d,e)});return M(d)}function an(a,b,c,d){(a.B=b)?(a.S=b.S,a.ia=b.ia):(a.S=null,a.ia=-1);a.D=null;return a.B?cq(a,c,!!d):L(!0)}
function dq(a){if(null==a.qa||"content"!=a.S.localName||"http://www.pyroxy.com/ns/shadow"!=a.S.namespaceURI)return a;var b=a.pa,c=a.qa,d=a.parent,e,f;c.oe?(f=c.oe,e=c.root,c=c.type,2==c&&(e=e.firstChild)):(f=c.Ld,e=c.ja.firstChild,c=2);var g=a.S.nextSibling;g?(a.S=g,ok(a)):a.va?a=a.va:e?a=null:(a=a.parent.modify(),a.M=!0);if(e)return b=new jk(e,d,b),b.qa=f,b.Ua=c,b.va=a,b;a.pa=b;return a}
function eq(a){var b=a.pa+1;if(a.M){if(!a.parent)return null;if(3!=a.Ua){var c=a.S.nextSibling;if(c)return a=a.modify(),a.pa=b,a.S=c,ok(a),dq(a)}if(a.va)return a=a.va.modify(),a.pa=b,a;a=a.parent.modify()}else{if(a.Aa&&(c=a.Aa.root,2==a.Aa.type&&(c=c.firstChild),c))return b=new jk(c,a,b),b.qa=a.Aa,b.Ua=a.Aa.type,dq(b);if(c=a.S.firstChild)return dq(new jk(c,a,b));1!=a.S.nodeType&&(c=aq(a.Ka),b+=c.length-1-a.ia);a=a.modify()}a.pa=b;a.M=!0;return a}
function gn(a,b,c){b=eq(b);if(!b||b.M)return L(b);var d=I("nextInTree");an(a,b,!0,c).then(function(a){b.D&&a||(b=b.modify(),b.M=!0,b.D||(b.Da=!0));O(d,b)});return M(d)}function fq(a,b){if(b instanceof sc)for(var c=b.values,d=0;d<c.length;d++)fq(a,c[d]);else b instanceof Fc&&(c=b.url,a.page.j.push(me(new Image,c)))}var gq={"box-decoration-break":!0,"flow-into":!0,"flow-linger":!0,"flow-priority":!0,"flow-options":!0,page:!0,"float-reference":!0};
function Xp(a,b,c){var d=c["background-image"];d&&fq(a,d);var d=c.position===od,e;for(e in c)if(!gq[e]){var f=c[e],f=f.ba(new wg(a.ea.url,a.g));f.Vb()&&zb(f.fa)&&(f=new D(Hc(f,a.b),"px"));Nj[e]||d&&Oj[e]?a.page.w.push(new Pj(b,e,f)):v(b,e,f.toString())}}function Bn(a,b,c,d){if(!b.M){var e=(b.qa?b.qa.b:a.j).l(a.S,!1);if(e=e._pseudos)if(e=e[c])c={},b.u=Mp(a,b.u,e,c),b=c.content,Pk(b)&&(b.ba(new Ok(d,a.b,b)),delete c.content),Xp(a,d,c)}}
function dn(a,b,c){var d=I("peelOff"),e=b.f,f=b.ia,g=b.M;if(0<c)b.D.textContent=b.D.textContent.substr(0,c),f+=c;else if(!g&&b.D&&!f){var h=b.D.parentNode;h&&h.removeChild(b.D)}for(var l=b.pa+c,k=[];b.f===e;)k.push(b),b=b.parent;var m=k.pop(),n=m.va;ge(function(){for(;0<k.length;){m=k.pop();b=new jk(m.S,b,l);k.length||(b.ia=f,b.M=g);b.Ua=m.Ua;b.qa=m.qa;b.Aa=m.Aa;b.va=m.va?m.va:n;n=null;var c=an(a,b,!1);if(c.za())return c}return L(!1)}).then(function(){O(d,b)});return M(d)}
function Up(a,b,c){return"http://www.w3.org/1999/xhtml"==b?a.w.createElement(c):a.w.createElementNS(b,c)}function vn(a,b,c){var d={},e=a.l._pseudos;b=Mp(a,b,a.l,d);if(e&&e.before){var f={},g=Up(a,"http://www.w3.org/1999/xhtml","span");g.setAttribute("data-adapt-pseudo","before");c.appendChild(g);Mp(a,b,e.before,f);delete f.content;Xp(a,g,f)}delete d.content;Xp(a,c,d);return b}
function jo(a){a&&uk(a,function(a){var b=a.qb["box-decoration-break"];b&&"slice"!==b||(b=a.D,a.u?(v(b,"padding-left","0"),v(b,"border-left","none"),v(b,"border-top-left-radius","0"),v(b,"border-bottom-left-radius","0")):(v(b,"padding-bottom","0"),v(b,"border-bottom","none"),v(b,"border-bottom-left-radius","0"),v(b,"border-bottom-right-radius","0")))})}function hq(a){this.b=a.h;this.window=a.window}
function iq(a,b){var c=b.left,d=b.top;return{left:a.left-c,top:a.top-d,right:a.right-c,bottom:a.bottom-d,width:a.width,height:a.height}}function Lm(a,b){var c=b.getClientRects(),d=a.b.getBoundingClientRect();return Array.from(c).map(function(a){return iq(a,d)},a)}function Xj(a,b){var c=b.getBoundingClientRect(),d=a.b.getBoundingClientRect();return iq(c,d)}function qn(a,b){return a.window.getComputedStyle(b,null)}
function jq(a,b,c,d,e){this.window=a;this.fontSize=b;this.b=a.document;this.root=c||this.b.body;b=this.root.firstElementChild;b||(b=this.b.createElement("div"),b.setAttribute("data-vivliostyle-outer-zoom-box",!0),this.root.appendChild(b));c=b.firstElementChild;c||(c=this.b.createElement("div"),c.setAttribute("data-vivliostyle-spread-container",!0),b.appendChild(c));var f=b.nextElementSibling;f||(f=this.b.createElement("div"),f.setAttribute("data-vivliostyle-layout-box",!0),this.root.appendChild(f));
this.g=b;this.f=c;this.h=f;b=qn(new hq(this),this.root);this.width=d||parseFloat(b.width)||a.innerWidth;this.height=e||parseFloat(b.height)||a.innerHeight}jq.prototype.zoom=function(a,b,c){v(this.g,"width",a*c+"px");v(this.g,"height",b*c+"px");v(this.f,"width",a+"px");v(this.f,"height",b+"px");v(this.f,"transform","scale("+c+")")};var Ln="min-content inline size",Gm="fit-content inline size";
function Fm(a,b,c){function d(c){return qn(a,b).getPropertyValue(c)}function e(){v(b,"display","block");v(b,"position","static");return d(Oa)}function f(){v(b,"display","inline-block");v(G,Oa,"99999999px");var a=d(Oa);v(G,Oa,"");return a}function g(){v(b,"display","inline-block");v(G,Oa,"0");var a=d(Oa);v(G,Oa,"");return a}function h(){var a=e(),b=g(),c=parseFloat(a);if(c<=parseFloat(b))return b;b=f();return c<=parseFloat(b)?a:b}function l(){throw Error("Getting fill-available block size is not implemented");}
var k=b.style.display,m=b.style.position,n=b.style.width,r=b.style.maxWidth,q=b.style.minWidth,z=b.style.height,y=b.style.maxHeight,A=b.style.minHeight,H=b.parentNode,G=b.ownerDocument.createElement("div");v(G,"position",m);H.insertBefore(G,b);G.appendChild(b);v(b,"width","auto");v(b,"max-width","none");v(b,"min-width","0");v(b,"height","auto");v(b,"max-height","none");v(b,"min-height","0");var J=za("writing-mode"),J=(J?d(J[0]):null)||d("writing-mode"),K="vertical-rl"===J||"tb-rl"===J||"vertical-lr"===
J||"tb-lr"===J,Oa=K?"height":"width",Ca=K?"width":"height",ta={};c.forEach(function(a){var c;switch(a){case "fill-available inline size":c=e();break;case "max-content inline size":c=f();break;case Ln:c=g();break;case Gm:c=h();break;case "fill-available block size":c=l();break;case "max-content block size":case "min-content block size":case "fit-content block size":c=d(Ca);break;case "fill-available width":c=K?l():e();break;case "fill-available height":c=K?e():l();break;case "max-content width":c=
K?d(Ca):f();break;case "max-content height":c=K?f():d(Ca);break;case "min-content width":c=K?d(Ca):g();break;case "min-content height":c=K?g():d(Ca);break;case "fit-content width":c=K?d(Ca):h();break;case "fit-content height":c=K?h():d(Ca)}ta[a]=parseFloat(c);v(b,"position",m);v(b,"display",k)});v(b,"width",n);v(b,"max-width",r);v(b,"min-width",q);v(b,"height",z);v(b,"max-height",y);v(b,"min-height",A);H.insertBefore(b,G);H.removeChild(G);return ta};function kq(a){var b=a["writing-mode"],b=b&&b.value;a=(a=a.direction)&&a.value;return b===yd||b!==zd&&a!==sd?"ltr":"rtl"}
var lq={a5:{width:new D(148,"mm"),height:new D(210,"mm")},a4:{width:new D(210,"mm"),height:new D(297,"mm")},a3:{width:new D(297,"mm"),height:new D(420,"mm")},b5:{width:new D(176,"mm"),height:new D(250,"mm")},b4:{width:new D(250,"mm"),height:new D(353,"mm")},"jis-b5":{width:new D(182,"mm"),height:new D(257,"mm")},"jis-b4":{width:new D(257,"mm"),height:new D(364,"mm")},letter:{width:new D(8.5,"in"),height:new D(11,"in")},legal:{width:new D(8.5,"in"),height:new D(14,"in")},ledger:{width:new D(11,"in"),
height:new D(17,"in")}},mq=new D(.24,"pt"),nq=new D(3,"mm"),oq=new D(10,"mm"),pq=new D(13,"mm");
function qq(a){var b={width:Dd,height:Ed,Tb:Fd,Bb:Fd},c=a.size;if(c&&c.value!==Lc){var d=c.value;d.Yc()?(c=d.values[0],d=d.values[1]):(c=d,d=null);if(c.Vb())b.width=c,b.height=d||c;else if(c=lq[c.name.toLowerCase()])d&&d===gd?(b.width=c.height,b.height=c.width):(b.width=c.width,b.height=c.height)}(c=a.marks)&&c.value!==F&&(b.Bb=pq);a=a.bleed;a&&a.value!==Lc?a.value&&a.value.Vb()&&(b.Tb=a.value):c&&(a=!1,c.value.Yc()?a=c.value.values.some(function(a){return a===Uc}):a=c.value===Uc,a&&(b.Tb=new D(6,
"pt")));return b}function rq(a,b){var c={},d=a.Tb.I*Cb(b,a.Tb.fa,!1),e=a.Bb.I*Cb(b,a.Bb.fa,!1),f=d+e,g=a.width;c.Kb=g===Dd?(b.aa.ob?Math.floor(b.La/2)-b.aa.ic:b.La)-2*f:g.I*Cb(b,g.fa,!1);g=a.height;c.Jb=g===Ed?b.Ab-2*f:g.I*Cb(b,g.fa,!1);c.Tb=d;c.Bb=e;c.wd=f;return c}function sq(a,b,c){a=a.createElementNS("http://www.w3.org/2000/svg","svg");a.setAttribute("width",b);a.setAttribute("height",c);a.style.position="absolute";return a}
function tq(a,b,c){a=a.createElementNS("http://www.w3.org/2000/svg",c||"polyline");a.setAttribute("stroke","black");a.setAttribute("stroke-width",b);a.setAttribute("fill","none");return a}var uq={Kf:"top left",Lf:"top right",xf:"bottom left",yf:"bottom right"};
function vq(a,b,c,d,e,f){var g=d;g<=e+2*yb.mm&&(g=e+d/2);var h=Math.max(d,g),l=e+h+c/2,k=sq(a,l,l),g=[[0,e+d],[d,e+d],[d,e+d-g]];d=g.map(function(a){return[a[1],a[0]]});if("top right"===b||"bottom right"===b)g=g.map(function(a){return[e+h-a[0],a[1]]}),d=d.map(function(a){return[e+h-a[0],a[1]]});if("bottom left"===b||"bottom right"===b)g=g.map(function(a){return[a[0],e+h-a[1]]}),d=d.map(function(a){return[a[0],e+h-a[1]]});l=tq(a,c);l.setAttribute("points",g.map(function(a){return a.join(",")}).join(" "));
k.appendChild(l);a=tq(a,c);a.setAttribute("points",d.map(function(a){return a.join(",")}).join(" "));k.appendChild(a);b.split(" ").forEach(function(a){k.style[a]=f+"px"});return k}var wq={Jf:"top",wf:"bottom",Ue:"left",Ve:"right"};
function xq(a,b,c,d,e){var f=2*d,g;"top"===b||"bottom"===b?(g=f,f=d):g=d;var h=sq(a,g,f),l=tq(a,c);l.setAttribute("points","0,"+f/2+" "+g+","+f/2);h.appendChild(l);l=tq(a,c);l.setAttribute("points",g/2+",0 "+g/2+","+f);h.appendChild(l);a=tq(a,c,"circle");a.setAttribute("cx",g/2);a.setAttribute("cy",f/2);a.setAttribute("r",d/4);h.appendChild(a);var k;switch(b){case "top":k="bottom";break;case "bottom":k="top";break;case "left":k="right";break;case "right":k="left"}Object.keys(wq).forEach(function(a){a=
wq[a];a===b?h.style[a]=e+"px":a!==k&&(h.style[a]="0",h.style["margin-"+a]="auto")});return h}function yq(a,b,c,d){var e=!1,f=!1;if(a=a.marks)a=a.value,a.Yc()?a.values.forEach(function(a){a===Uc?e=!0:a===Vc&&(f=!0)}):a===Uc?e=!0:a===Vc&&(f=!0);if(e||f){var g=c.K,h=g.ownerDocument,l=b.Tb,k=Hc(mq,d),m=Hc(nq,d),n=Hc(oq,d);e&&Object.keys(uq).forEach(function(a){a=vq(h,uq[a],k,n,l,m);g.appendChild(a)});f&&Object.keys(wq).forEach(function(a){a=xq(h,wq[a],k,n,m);g.appendChild(a)})}}
var zq=function(){var a={width:!0,height:!0,"block-size":!0,"inline-size":!0,margin:!0,padding:!0,border:!0,outline:!0,"outline-width":!0,"outline-style":!0,"outline-color":!0};"left right top bottom before after start end block-start block-end inline-start inline-end".split(" ").forEach(function(b){a["margin-"+b]=!0;a["padding-"+b]=!0;a["border-"+b+"-width"]=!0;a["border-"+b+"-style"]=!0;a["border-"+b+"-color"]=!0});return a}(),Aq={"top-left-corner":{order:1,Ja:!0,Ga:!1,Ha:!0,Ia:!0,sa:null},"top-left":{order:2,
Ja:!0,Ga:!1,Ha:!1,Ia:!1,sa:"start"},"top-center":{order:3,Ja:!0,Ga:!1,Ha:!1,Ia:!1,sa:"center"},"top-right":{order:4,Ja:!0,Ga:!1,Ha:!1,Ia:!1,sa:"end"},"top-right-corner":{order:5,Ja:!0,Ga:!1,Ha:!1,Ia:!0,sa:null},"right-top":{order:6,Ja:!1,Ga:!1,Ha:!1,Ia:!0,sa:"start"},"right-middle":{order:7,Ja:!1,Ga:!1,Ha:!1,Ia:!0,sa:"center"},"right-bottom":{order:8,Ja:!1,Ga:!1,Ha:!1,Ia:!0,sa:"end"},"bottom-right-corner":{order:9,Ja:!1,Ga:!0,Ha:!1,Ia:!0,sa:null},"bottom-right":{order:10,Ja:!1,Ga:!0,Ha:!1,Ia:!1,sa:"end"},
"bottom-center":{order:11,Ja:!1,Ga:!0,Ha:!1,Ia:!1,sa:"center"},"bottom-left":{order:12,Ja:!1,Ga:!0,Ha:!1,Ia:!1,sa:"start"},"bottom-left-corner":{order:13,Ja:!1,Ga:!0,Ha:!0,Ia:!1,sa:null},"left-bottom":{order:14,Ja:!1,Ga:!1,Ha:!0,Ia:!1,sa:"end"},"left-middle":{order:15,Ja:!1,Ga:!1,Ha:!0,Ia:!1,sa:"center"},"left-top":{order:16,Ja:!1,Ga:!1,Ha:!0,Ia:!1,sa:"start"}},Bq=Object.keys(Aq).sort(function(a,b){return Aq[a].order-Aq[b].order});
function Cq(a,b,c){Jo.call(this,a,null,"vivliostyle-page-rule-master",[],b,null,0);a=qq(c);new Dq(this.f,this,c,a);this.C={};Eq(this,c);this.b.position=new V(od,0);this.b.width=new V(a.width,0);this.b.height=new V(a.height,0);for(var d in c)zq[d]||"background-clip"===d||(this.b[d]=c[d])}t(Cq,Jo);function Eq(a,b){var c=b._marginBoxes;c&&Bq.forEach(function(d){c[d]&&(a.C[d]=new Fq(a.f,a,d,b))})}Cq.prototype.h=function(a){return new Gq(a,this)};
function Dq(a,b,c,d){No.call(this,a,null,null,[],b);this.F=d;this.b["z-index"]=new V(new Dc(0),0);this.b["flow-from"]=new V(C("body"),0);this.b.position=new V(Ic,0);this.b.overflow=new V(Ad,0);for(var e in zq)zq.hasOwnProperty(e)&&(this.b[e]=c[e])}t(Dq,No);Dq.prototype.h=function(a){return new Hq(a,this)};
function Fq(a,b,c,d){No.call(this,a,null,null,[],b);this.A=c;a=d._marginBoxes[this.A];for(var e in d)if(b=d[e],c=a[e],ih[e]||c&&c.value===bd)this.b[e]=b;for(e in a)Object.prototype.hasOwnProperty.call(a,e)&&(b=a[e])&&b.value!==bd&&(this.b[e]=b)}t(Fq,No);Fq.prototype.h=function(a){return new Iq(a,this)};function Gq(a,b){Ko.call(this,a,b);this.l=null;this.ta={}}t(Gq,Ko);
Gq.prototype.j=function(a,b){var c=this.J,d;for(d in b)if(Object.prototype.hasOwnProperty.call(b,d))switch(d){case "writing-mode":case "direction":c[d]=b[d]}Ko.prototype.j.call(this,a,b)};Gq.prototype.Cd=function(){var a=this.style;a.left=Fd;a["margin-left"]=Fd;a["border-left-width"]=Fd;a["padding-left"]=Fd;a["padding-right"]=Fd;a["border-right-width"]=Fd;a["margin-right"]=Fd;a.right=Fd};
Gq.prototype.Dd=function(){var a=this.style;a.top=Fd;a["margin-top"]=Fd;a["border-top-width"]=Fd;a["padding-top"]=Fd;a["padding-bottom"]=Fd;a["border-bottom-width"]=Fd;a["margin-bottom"]=Fd;a.bottom=Fd};Gq.prototype.Y=function(a,b,c){b=b.H;var d={start:this.l.marginLeft,end:this.l.marginRight,la:this.l.fc},e={start:this.l.marginTop,end:this.l.marginBottom,la:this.l.ec};Jq(this,b.top,!0,d,a,c);Jq(this,b.bottom,!0,d,a,c);Jq(this,b.left,!1,e,a,c);Jq(this,b.right,!1,e,a,c)};
function Kq(a,b,c,d,e){this.K=a;this.C=e;this.j=c;this.A=!Y(d,b[c?"width":"height"],new ec(d,0,"px"));this.l=null}Kq.prototype.b=function(){return this.A};function Lq(a){a.l||(a.l=Fm(a.C,a.K.element,a.j?["max-content width","min-content width"]:["max-content height","min-content height"]));return a.l}Kq.prototype.g=function(){var a=Lq(this);return this.j?Fk(this.K)+a["max-content width"]+Gk(this.K):Dk(this.K)+a["max-content height"]+Ek(this.K)};
Kq.prototype.h=function(){var a=Lq(this);return this.j?Fk(this.K)+a["min-content width"]+Gk(this.K):Dk(this.K)+a["min-content height"]+Ek(this.K)};Kq.prototype.f=function(){return this.j?Fk(this.K)+this.K.width+Gk(this.K):Dk(this.K)+this.K.height+Ek(this.K)};function Mq(a){this.j=a}Mq.prototype.b=function(){return this.j.some(function(a){return a.b()})};Mq.prototype.g=function(){var a=this.j.map(function(a){return a.g()});return Math.max.apply(null,a)*a.length};
Mq.prototype.h=function(){var a=this.j.map(function(a){return a.h()});return Math.max.apply(null,a)*a.length};Mq.prototype.f=function(){var a=this.j.map(function(a){return a.f()});return Math.max.apply(null,a)*a.length};function Nq(a,b,c,d,e,f){Kq.call(this,a,b,c,d,e);this.w=f}t(Nq,Kq);Nq.prototype.b=function(){return!1};Nq.prototype.g=function(){return this.f()};Nq.prototype.h=function(){return this.f()};Nq.prototype.f=function(){return this.j?Fk(this.K)+this.w+Gk(this.K):Dk(this.K)+this.w+Ek(this.K)};
function Jq(a,b,c,d,e,f){var g=a.b.f,h={},l={},k={},m;for(m in b){var n=Aq[m];if(n){var r=b[m],q=a.ta[m],z=new Kq(r,q.style,c,g,f);h[n.sa]=r;l[n.sa]=q;k[n.sa]=z}}a=d.start.evaluate(e);d.end.evaluate(e);b=d.la.evaluate(e);var y=Oq(k,b),A=!1,H={};Object.keys(h).forEach(function(a){var b=Y(g,l[a].style[c?"max-width":"max-height"],d.la);b&&(b=b.evaluate(e),y[a]>b&&(b=k[a]=new Nq(h[a],l[a].style,c,g,f,b),H[a]=b.f(),A=!0))});A&&(y=Oq(k,b),A=!1,["start","center","end"].forEach(function(a){y[a]=H[a]||y[a]}));
var G={};Object.keys(h).forEach(function(a){var b=Y(g,l[a].style[c?"min-width":"min-height"],d.la);b&&(b=b.evaluate(e),y[a]<b&&(b=k[a]=new Nq(h[a],l[a].style,c,g,f,b),G[a]=b.f(),A=!0))});A&&(y=Oq(k,b),["start","center","end"].forEach(function(a){y[a]=G[a]||y[a]}));var J=a+b,K=a+(a+b);["start","center","end"].forEach(function(a){var b=y[a];if(b){var d=h[a],e=0;switch(a){case "start":e=c?d.left:d.top;break;case "center":e=(K-b)/2;break;case "end":e=J-b}c?Kk(d,e,b-Fk(d)-Gk(d)):Jk(d,e,b-Dk(d)-Ek(d))}})}
function Oq(a,b){var c=a.start,d=a.center,e=a.end,f={};if(d){var g=[c,e].filter(function(a){return a}),g=Pq(d,g.length?new Mq(g):null,b);g.ib&&(f.center=g.ib);d=g.ib||d.f();d=(b-d)/2;c&&c.b()&&(f.start=d);e&&e.b()&&(f.end=d)}else c=Pq(c,e,b),c.ib&&(f.start=c.ib),c.Pc&&(f.end=c.Pc);return f}
function Pq(a,b,c){var d={ib:null,Pc:null};if(a&&b)if(a.b()&&b.b()){var e=a.g(),f=b.g();0<e&&0<f?(f=e+f,f<c?d.ib=c*e/f:(a=a.h(),b=b.h(),b=a+b,b<c?d.ib=a+(c-b)*(e-a)/(f-b):0<b&&(d.ib=c*a/b)),0<d.ib&&(d.Pc=c-d.ib)):0<e?d.ib=c:0<f&&(d.Pc=c)}else a.b()?d.ib=Math.max(c-b.f(),0):b.b()&&(d.Pc=Math.max(c-a.f(),0));else a?a.b()&&(d.ib=c):b&&b.b()&&(d.Pc=c);return d}Gq.prototype.Lb=function(a,b,c,d,e){Gq.Te.Lb.call(this,a,b,c,d,e);b.element.setAttribute("data-vivliostyle-page-box",!0)};
function Hq(a,b){Oo.call(this,a,b);this.marginLeft=this.marginBottom=this.marginRight=this.marginTop=this.ec=this.fc=null}t(Hq,Oo);
Hq.prototype.j=function(a,b){var c=this.J,d;for(d in b)Object.prototype.hasOwnProperty.call(b,d)&&(d.match(/^column.*$/)||d.match(/^background-/))&&(c[d]=b[d]);Oo.prototype.j.call(this,a,b);d=this.f;c={fc:this.fc,ec:this.ec,marginTop:this.marginTop,marginRight:this.marginRight,marginBottom:this.marginBottom,marginLeft:this.marginLeft};d.l=c;d=d.style;d.width=new E(c.fc);d.height=new E(c.ec);d["padding-left"]=new E(c.marginLeft);d["padding-right"]=new E(c.marginRight);d["padding-top"]=new E(c.marginTop);
d["padding-bottom"]=new E(c.marginBottom)};Hq.prototype.Cd=function(){var a=Qq(this,{start:"left",end:"right",la:"width"});this.fc=a.te;this.marginLeft=a.Ne;this.marginRight=a.Me};Hq.prototype.Dd=function(){var a=Qq(this,{start:"top",end:"bottom",la:"height"});this.ec=a.te;this.marginTop=a.Ne;this.marginBottom=a.Me};
function Qq(a,b){var c=a.style,d=a.b.f,e=b.start,f=b.end,g=b.la,h=a.b.F[g].ra(d,null),l=Y(d,c[g],h),k=Y(d,c["margin-"+e],h),m=Y(d,c["margin-"+f],h),n=Po(d,c["padding-"+e],h),r=Po(d,c["padding-"+f],h),q=Ro(d,c["border-"+e+"-width"],c["border-"+e+"-style"],h),z=Ro(d,c["border-"+f+"-width"],c["border-"+f+"-style"],h),y=x(d,h,w(d,w(d,q,n),w(d,z,r)));l?(y=x(d,y,l),k||m?k?m=x(d,y,k):k=x(d,y,m):m=k=mc(d,y,new tb(d,.5))):(k||(k=d.b),m||(m=d.b),l=x(d,y,w(d,k,m)));c[e]=new E(k);c[f]=new E(m);c["margin-"+e]=
Fd;c["margin-"+f]=Fd;c["padding-"+e]=new E(n);c["padding-"+f]=new E(r);c["border-"+e+"-width"]=new E(q);c["border-"+f+"-width"]=new E(z);c[g]=new E(l);c["max-"+g]=new E(l);return{te:x(d,h,w(d,k,m)),Ne:k,Me:m}}Hq.prototype.Lb=function(a,b,c,d,e){Oo.prototype.Lb.call(this,a,b,c,d,e);c.O=b.element};function Iq(a,b){Oo.call(this,a,b);var c=b.A;this.l=Aq[c];a.ta[c]=this;this.xa=!0}t(Iq,Oo);p=Iq.prototype;
p.Lb=function(a,b,c,d,e){var f=b.element;v(f,"display","flex");var g=ap(this,a,"vertical-align"),h=null;g===C("middle")?h="center":g===C("top")?h="flex-start":g===C("bottom")&&(h="flex-end");h&&(v(f,"flex-flow",this.u?"row":"column"),v(f,"justify-content",h));Oo.prototype.Lb.call(this,a,b,c,d,e)};
p.sa=function(a,b){var c=this.style,d=this.b.f,e=a.start,f=a.end,g="left"===e,h=g?b.fc:b.ec,l=Y(d,c[a.la],h),g=g?b.marginLeft:b.marginTop;if("start"===this.l.sa)c[e]=new E(g);else if(l){var k=Po(d,c["margin-"+e],h),m=Po(d,c["margin-"+f],h),n=Po(d,c["padding-"+e],h),r=Po(d,c["padding-"+f],h),q=Ro(d,c["border-"+e+"-width"],c["border-"+e+"-style"],h),f=Ro(d,c["border-"+f+"-width"],c["border-"+f+"-style"],h),l=w(d,l,w(d,w(d,n,r),w(d,w(d,q,f),w(d,k,m))));switch(this.l.sa){case "center":c[e]=new E(w(d,
g,nc(d,x(d,h,l),new tb(d,2))));break;case "end":c[e]=new E(x(d,w(d,g,h),l))}}};
function Rq(a,b,c){function d(a){if(y)return y;y={la:z?z.evaluate(a):null,Ya:l?l.evaluate(a):null,Za:k?k.evaluate(a):null};var b=h.evaluate(a),c=0;[r,m,n,q].forEach(function(b){b&&(c+=b.evaluate(a))});(null===y.Ya||null===y.Za)&&c+y.la+y.Ya+y.Za>b&&(null===y.Ya&&(y.Ya=0),null===y.Za&&(y.Qf=0));null!==y.la&&null!==y.Ya&&null!==y.Za&&(y.Za=null);null===y.la&&null!==y.Ya&&null!==y.Za?y.la=b-c-y.Ya-y.Za:null!==y.la&&null===y.Ya&&null!==y.Za?y.Ya=b-c-y.la-y.Za:null!==y.la&&null!==y.Ya&&null===y.Za?y.Za=
b-c-y.la-y.Ya:null===y.la?(y.Ya=y.Za=0,y.la=b-c):y.Ya=y.Za=(b-c-y.la)/2;return y}var e=a.style;a=a.b.f;var f=b.Ed,g=b.Id;b=b.la;var h=c["margin"+g.charAt(0).toUpperCase()+g.substring(1)],l=Qo(a,e["margin-"+f],h),k=Qo(a,e["margin-"+g],h),m=Po(a,e["padding-"+f],h),n=Po(a,e["padding-"+g],h),r=Ro(a,e["border-"+f+"-width"],e["border-"+f+"-style"],h),q=Ro(a,e["border-"+g+"-width"],e["border-"+g+"-style"],h),z=Y(a,e[b],h),y=null;e[b]=new E(new vb(a,function(){var a=d(this).la;return null===a?0:a},b));e["margin-"+
f]=new E(new vb(a,function(){var a=d(this).Ya;return null===a?0:a},"margin-"+f));e["margin-"+g]=new E(new vb(a,function(){var a=d(this).Za;return null===a?0:a},"margin-"+g));"left"===f?e.left=new E(w(a,c.marginLeft,c.fc)):"top"===f&&(e.top=new E(w(a,c.marginTop,c.ec)))}p.Cd=function(){var a=this.f.l;this.l.Ha?Rq(this,{Ed:"right",Id:"left",la:"width"},a):this.l.Ia?Rq(this,{Ed:"left",Id:"right",la:"width"},a):this.sa({start:"left",end:"right",la:"width"},a)};
p.Dd=function(){var a=this.f.l;this.l.Ja?Rq(this,{Ed:"bottom",Id:"top",la:"height"},a):this.l.Ga?Rq(this,{Ed:"top",Id:"bottom",la:"height"},a):this.sa({start:"top",end:"bottom",la:"height"},a)};p.Wc=function(a,b,c,d,e,f,g){Oo.prototype.Wc.call(this,a,b,c,d,e,f,g);a=c.H;c=this.b.A;d=this.l;d.Ha||d.Ia?d.Ja||d.Ga||(d.Ha?a.left[c]=b:d.Ia&&(a.right[c]=b)):d.Ja?a.top[c]=b:d.Ga&&(a.bottom[c]=b)};
function Sq(a,b,c,d,e){this.b=a;this.l=b;this.h=c;this.f=d;this.g=e;this.j={};a=this.l;b=new fc(a,"page-number");b=new Yb(a,new dc(a,b,new tb(a,2)),a.b);c=new Ob(a,b);a.values["recto-page"]=c;a.values["verso-page"]=b;"ltr"===kq(this.g)?(a.values["left-page"]=b,b=new Ob(a,b),a.values["right-page"]=b):(c=new Ob(a,b),a.values["left-page"]=c,a.values["right-page"]=b)}function Tq(a){var b={};Qi(a.b,[],"",b);a.b.pop();return b}
function Uq(a,b){var c=[],d;for(d in b)if(Object.prototype.hasOwnProperty.call(b,d)){var e=b[d],f;f=e instanceof V?e.value+"":Uq(a,e);c.push(d+f+(e.Ta||""))}return c.sort().join("^")}function Vq(a,b,c){c=c.clone({Mb:"vivliostyle-page-rule-master"});var d=c.b,e=b.size;if(e){var f=qq(b),e=e.Ta;d.width=wh(a.f,d.width,new V(f.width,e));d.height=wh(a.f,d.height,new V(f.height,e))}["counter-reset","counter-increment"].forEach(function(a){d[a]&&(b[a]=d[a])});c=c.h(a.h);c.j(a.b,a.g);qp(c,a.f);return c}
function Wq(a){this.b=null;this.h=a}t(Wq,W);Wq.prototype.apply=function(a){a.Y===this.h&&this.b.apply(a)};Wq.prototype.f=function(){return 3};Wq.prototype.g=function(a){this.b&&Lh(a.Dc,this.h,this.b);return!0};function Xq(a){this.b=null;this.h=a}t(Xq,W);Xq.prototype.apply=function(a){1===(new fc(this.h,"page-number")).evaluate(a.l)&&this.b.apply(a)};Xq.prototype.f=function(){return 2};function Yq(a){this.b=null;this.h=a}t(Yq,W);
Yq.prototype.apply=function(a){(new fc(this.h,"left-page")).evaluate(a.l)&&this.b.apply(a)};Yq.prototype.f=function(){return 1};function Zq(a){this.b=null;this.h=a}t(Zq,W);Zq.prototype.apply=function(a){(new fc(this.h,"right-page")).evaluate(a.l)&&this.b.apply(a)};Zq.prototype.f=function(){return 1};function $q(a){this.b=null;this.h=a}t($q,W);$q.prototype.apply=function(a){(new fc(this.h,"recto-page")).evaluate(a.l)&&this.b.apply(a)};$q.prototype.f=function(){return 1};
function ar(a){this.b=null;this.h=a}t(ar,W);ar.prototype.apply=function(a){(new fc(this.h,"verso-page")).evaluate(a.l)&&this.b.apply(a)};ar.prototype.f=function(){return 1};function br(a,b){Jh.call(this,a,b,null,null)}t(br,Jh);br.prototype.apply=function(a){var b=a.l,c=a.F,d=this.style;a=this.Z;Ch(b,c,d,a,null,null);if(d=d._marginBoxes){var c=Ah(c,"_marginBoxes"),e;for(e in d)if(d.hasOwnProperty(e)){var f=c[e];f||(f={},c[e]=f);Ch(b,f,d[e],a,null,null)}}};
function cr(a,b,c,d,e){aj.call(this,a,b,null,c,null,d,!1);this.O=e;this.G=[];this.g="";this.C=[]}t(cr,aj);p=cr.prototype;p.jc=function(){this.tb()};p.yb=function(a,b){if(this.g=b)this.b.push(new Wq(b)),this.Z+=65536};
p.Ec=function(a,b){b&&mf(this,"E_INVALID_PAGE_SELECTOR :"+a+"("+b.join("")+")");this.C.push(":"+a);switch(a.toLowerCase()){case "first":this.b.push(new Xq(this.f));this.Z+=256;break;case "left":this.b.push(new Yq(this.f));this.Z+=1;break;case "right":this.b.push(new Zq(this.f));this.Z+=1;break;case "recto":this.b.push(new $q(this.f));this.Z+=1;break;case "verso":this.b.push(new ar(this.f));this.Z+=1;break;default:mf(this,"E_INVALID_PAGE_SELECTOR :"+a)}};
function dr(a){var b;a.g||a.C.length?b=[a.g].concat(a.C.sort()):b=null;a.G.push({ke:b,Z:a.Z});a.g="";a.C=[]}p.hc=function(){dr(this);aj.prototype.hc.call(this)};p.wa=function(){dr(this);aj.prototype.wa.call(this)};
p.sb=function(a,b,c){if("bleed"!==a&&"marks"!==a||this.G.some(function(a){return!a.ke})){aj.prototype.sb.call(this,a,b,c);var d=this.Sa[a],e=this.O;if("bleed"===a||"marks"===a)e[""]||(e[""]={}),Object.keys(e).forEach(function(b){zh(e[b],a,d)});else if("size"===a){var f=e[""];this.G.forEach(function(b){var c=new V(d.value,d.Ta+b.Z);b=b.ke?b.ke.join(""):"";var g=e[b];g?(c=(b=g[a])?wh(null,c,b):c,zh(g,a,c)):(g=e[b]={},zh(g,a,c),f&&["bleed","marks"].forEach(function(a){f[a]&&zh(g,a,f[a])},this))},this)}}};
p.Ge=function(a){Lh(this.j.Dc,"*",a)};p.Le=function(a){return new br(this.Sa,a)};p.Pd=function(a){var b=Ah(this.Sa,"_marginBoxes"),c=b[a];c||(c={},b[a]=c);hf(this.ja,new er(this.f,this.ja,this.w,c))};function er(a,b,c,d){jf.call(this,a,b,!1);this.g=c;this.b=d}t(er,kf);er.prototype.rb=function(a,b,c){gh(this.g,a,b,c,this)};er.prototype.Ac=function(a,b){lf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};er.prototype.nd=function(a,b){lf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};
er.prototype.sb=function(a,b,c){zh(this.b,a,new V(b,c?ef(this):ff(this)))};var fr=new je(function(){var a=I("uaStylesheetBase");hh.get().then(function(b){var c=oa("user-agent-base.css",na);b=new aj(null,null,null,null,null,b,!0);b.kc("UA");$i=b.j;Mf(c,b,null,null).Fa(a)});return M(a)},"uaStylesheetBaseFetcher");
function gr(a,b,c,d,e,f,g,h,l,k){this.l=a;this.f=b;this.b=c;this.g=d;this.H=e;this.j=f;this.C=a.O;this.F=g;this.h=h;this.A=l;this.G=k;this.w=a.l;xb(this.b,function(a){var b=this.b,c;c=(c=b.b[a])?(c=c.b[0])?c.b:null:null;var d;d=b.b[a];if(d=hr(this,d?d.g:"any"))d=(a=b.b[a])?0<a.b.length&&a.b[0].b.f<=this.C:!1;return d&&!!c&&!ir(this,c)});wb(this.b,new vb(this.b,function(){return this.ta+this.b.page},"page-number"))}
function jr(a,b,c,d){if(a.A.length){var e=new Ab(0,b,c,d);a=a.A;for(var f={},g=0;g<a.length;g++)Ch(e,f,a[g],0,null,null);g=f.width;a=f.height;var h=f["text-zoom"];if(g&&a||h)if(f=yb.em,(h?h.evaluate(e,"text-zoom"):null)===qd&&(h=f/d,d=f,b*=h,c*=h),g&&a&&(g=Hc(g.evaluate(e,"width"),e),e=Hc(a.evaluate(e,"height"),e),0<g&&0<e))return{width:g,height:e,fontSize:d}}return{width:b,height:c,fontSize:d}}
function kr(a,b,c,d,e,f,g,h,l,k,m){Ab.call(this,0,d.width,d.height,d.fontSize);this.style=a;this.ea=b;this.lang=b.lang||c;this.viewport=d;this.l={body:!0};this.g=e;this.A=this.b=this.H=this.f=this.F=null;this.C=0;this.wb=f;this.h=new Cl(this.style.C);this.na={};this.X=null;this.j=m;this.xb=new Zl(null,null,null,null,null,null,null);this.V={};this.ga=null;this.Va=g;this.vb=h;this.ta=l;this.pb=k;for(var n in a.h)(b=a.h[n]["flow-consume"])&&(b.evaluate(this,"flow-consume")==Jc?this.l[n]=!0:delete this.l[n]);
this.xa={}}t(kr,Ab);
function lr(a){var b=I("StyleInstance.init"),c=new no(a.j,a.ea.url),d=new mo(a.j,a.ea.url,a.style.f,a.style.b);a.f=new jl(a.ea,a.style.g,a.style.f,a,a.l,a.style.w,c,d);d.h=a.f;tl(a.f,a);a.H={};a.H[a.ea.url]=a.f;var e=ql(a.f);a.ga=kq(e);a.F=new rp(a.style.H);c=new Ni(a.style.g,a,c,d);a.F.j(c,e);qp(a.F,a);a.X=new Sq(c,a.style.b,a.F,a,e);e=[];for(c=0;c<a.style.j.length;c++)if(d=a.style.j[c],!d.W||d.W.evaluate(a))d=zl(d.Wb,a),d=new Al(d),e.push(d);Il(a.wb,e,a.h).Fa(b);var f=a.style.G;Object.keys(f).forEach(function(a){var b=
rq(qq(f[a]),this);this.xa[a]={width:b.Kb+2*b.wd,height:b.Jb+2*b.wd}},a);return M(b)}function ul(a,b,c){if(a=a.b)a.f[b.b]||(a.f[b.b]=c),c=a.b[b.b],c||(c=new yk,a.b[b.b]=c),c.b.push(new xk(new vk({ma:[{node:b.element,Ua:hk,qa:null,Aa:null,va:null}],ia:0,M:!1,Ka:null}),b))}function mr(a,b){for(var c=Number.POSITIVE_INFINITY,d=0;d<b.b.length;d++){for(var e=b.b[d].f.Ba,f=e.ma[0].node,g=e.ia,h=e.M,l=0;f.ownerDocument!=a.ea.b;)l++,f=e.ma[l].node,h=!1,g=0;e=uj(a.ea,f,g,h);e<c&&(c=e)}return c}
function nr(a,b,c){if(!b)return 0;var d=Number.POSITIVE_INFINITY,e;for(e in a.l){var f=b.b[e];if(!(c||f&&f.b.length)&&a.b){f=a.f;f.J=e;for(var g=0;null!=f.J&&(g+=5E3,rl(f,g,0)!=Number.POSITIVE_INFINITY););f=a.b.b[e];b!=a.b&&f&&(f=f.clone(),b.b[e]=f)}f&&(f=mr(a,f),f<d&&(d=f))}return d}function hr(a,b){switch(b){case "left":case "right":case "recto":case "verso":return(new fc(a.style.b,b+"-page")).evaluate(a);default:return!0}}
function or(a,b){var c=a.b,d=nr(a,c);if(d==Number.POSITIVE_INFINITY)return null;for(var e=a.F.w,f,g=0;g<e.length;g++)if(f=e[g],"vivliostyle-page-rule-master"!==f.b.Mb){var h=1,l=ap(f,a,"utilization");l&&l.ge()&&(h=l.I);var l=Cb(a,"em",!1),k=a.Kb()*a.Jb();a.C=rl(a.f,d,Math.ceil(h*k/(l*l)));h=a;l=c;k=void 0;for(k in l.b){var m=l.b[k];if(m&&0<m.b.length){var n=m.b[0].b;if(mr(h,m)===n.f){a:switch(n=m.g,n){case "left":case "right":case "recto":case "verso":break a;default:n=null}m.g=Kl(al(n,m.b[0].b.g))}}}a.A=
c.clone();h=a;l=h.b.page;k=void 0;for(k in h.b.b)for(m=h.b.b[k],n=m.b.length-1;0<=n;n--){var r=m.b[n];0>r.b.gb&&r.b.f<h.C&&(r.b.gb=l)}Bb(a,a.style.b);h=ap(f,a,"enabled");if(!h||h===Bd){c=a;u.debug("Location - page",c.b.page);u.debug("  current:",d);u.debug("  lookup:",c.C);d=void 0;for(d in c.b.b)for(e=c.b.b[d],g=0;g<e.b.length;g++)u.debug("  Chunk",d+":",e.b[g].b.f);d=a.X;e=f;f=b;c=e.b;Object.keys(f).length?(e=c,g=Uq(d,f),e=e.l+"^"+g,g=d.j[e],g||("background-host"===c.Mb?(c=d,f=(new Cq(c.l,c.h.b,
f)).h(c.h),f.j(c.b,c.g),qp(f,c.f),g=f):g=Vq(d,f,c),d.j[e]=g),f=g.b,f.f.g=f,f=g):(c.f.g=c,f=e);return f}}throw Error("No enabled page masters");}function ir(a,b){var c=a.A.f,d=c[b.b].f;if(d){var e=b.f,f=c[d].b;if(!f.length||e<f[0])return!1;var c=La(f.length,function(a){return f[a]>e})-1,c=f[c],d=a.A.b[d],g=mr(a,d);return c<g?!1:g<c?!0:!hr(a,d.g)}return!1}function pr(a,b,c){a=a.b.f[c];a.L||(a.L=new Wm(null));b.Ud=a.L}
function qr(a){var b=a.f,c=pm(b),d=I("layoutDeferredPageFloats"),e=!1,f=0;he(function(d){if(f===c.length||rm(b))Q(d);else{var g=c[f++],l=g.eb;lm(b,l)?P(d):Hn(a,g.b,l).then(function(a){a?(a=wm(b.parent))?Q(d):(wm(b)&&!a&&(e=!0,b.Bc=!1),P(d)):P(d)})}}).then(function(){e&&jm(b);O(d,!0)});return M(d)}
function rr(a,b,c){var d=a.b.b[c];if(!d||!hr(a,d.g))return L(!0);d.g="any";pr(a,b,c);wn(b);a.l[c]&&0<b.J.length&&(b.ac=!1);var e=I("layoutColumn");qr(b).then(function(){if(wm(b.f))O(e,!0);else{var c=[],g=[],h=!0;he(function(e){for(;0<d.b.length-g.length;){for(var f=0;0<=g.indexOf(f);)f++;var l=d.b[f];if(l.b.f>a.C||ir(a,l.b))break;for(var n=f+1;n<d.b.length;n++)if(!(0<=g.indexOf(n))){var r=d.b[n];if(r.b.f>a.C||ir(a,r.b))break;ck(r.b,l.b)&&(l=r,f=n)}var q=l.b,z=!0;zn(b,l.f,h,d.f).then(function(a){if(wm(b.f))Q(e);
else if(h=!1,!l.b.lf||a&&!q.h||c.push(f),q.h)g.push(f),Q(e);else{var k=!!a||!!b.j,m;0<tm(b.f).length&&b.La?a?(m=a.clone(),m.Ba=b.La):m=new vk(b.La):m=null;if(b.j&&m)l.f=m,d.f=b.j,b.j=null;else{g.push(f);if(a||m)l.f=a||m,c.push(f);b.j&&(d.g=Kl(b.j))}k?Q(e):z?z=!1:P(e)}});if(z){z=!1;return}}Q(e)}).then(function(){if(!wm(b.f)){d.b=d.b.filter(function(a,b){return 0<=c.indexOf(b)||0>g.indexOf(b)});"column"===d.f&&(d.f=null);var a=Im(b.f);En(b,a)}O(e,!0)})}});return M(e)}
function sr(a,b,c,d,e,f,g,h,l,k,m,n,r,q,z){var y=b.u?b.h&&b.O:b.g&&b.V,A=f.element,H=new Zl(l,"column",null,h,null,null,null),G=a.b.clone(),J=I("createAndLayoutColumn"),K;he(function(b){if(1<k){var J=a.viewport.b.createElement("div");v(J,"position","absolute");A.appendChild(J);K=new Xm(J,q,a.g,z,H);K.u=f.u;K.pb=f.pb;K.xb=f.xb;f.u?(J=g*(n+m)+f.A,Kk(K,f.w,f.width),Jk(K,J,n)):(J=g*(n+m)+f.w,Jk(K,f.A,f.height),Kk(K,J,n));K.$a=c;K.ab=d}else K=new Xm(A,q,a.g,z,H),Ik(K,f);K.Fb=y?[]:e.concat();K.xa=r;cm(H,
K);0<=K.width?rr(a,K,h).then(function(){wm(H)||um(H);wm(K.f)&&!wm(l)?(K.f.Bc=!1,a.b=G.clone(),K.element!==A&&A.removeChild(K.element),P(b)):Q(b)}):(um(H),Q(b))}).then(function(){O(J,K)});return M(J)}function tr(a,b,c,d,e){var f=ap(c,a,"writing-mode")||null;a=ap(c,a,"direction")||null;return new Zl(b,"region",d,e,null,f,a)}
function ur(a,b,c,d,e,f,g,h){Uo(c);var l=ap(c,a,"enabled");if(l&&l!==Bd)return L(!0);var k=I("layoutContainer"),m=ap(c,a,"wrap-flow")===Lc,l=ap(c,a,"flow-from"),n=a.viewport.b.createElement("div"),r=ap(c,a,"position");v(n,"position",r?r.name:"absolute");d.insertBefore(n,d.firstChild);var q=new Ck(n);q.u=c.u;q.Fb=g;c.Lb(a,q,b,a.h,a.g);q.$a=e;q.ab=f;e+=q.left+q.marginLeft+q.borderLeft;f+=q.top+q.marginTop+q.borderTop;(c instanceof Hq||c instanceof Ko&&!(c instanceof Gq))&&cm(h,q);var z=a.b.clone(),
y=!1;if(l&&l.Ie())if(a.V[l.toString()])wm(h)||c.Wc(a,q,b,null,1,a.g,a.h),l=L(!0);else{var A=I("layoutContainer.inner"),H=l.toString(),G=tr(a,h,c,q,H),J=Z(c,a,"column-count"),K=Z(c,a,"column-gap"),Oa=1<J?Z(c,a,"column-width"):q.width,l=$o(c,a),Ca=0,r=ap(c,a,"shape-inside"),ta=tg(r,0,0,q.width,q.height,a),N=new Jp(H,a,a.viewport,a.f,l,a.ea,a.h,a.style.F,a,b,a.Va,a.vb,a.pb),Wa=new lo(a.j,a.b.page-1),yc=0,zc=null;he(function(b){sr(a,c,e,f,g,q,yc++,H,G,J,K,Oa,ta,N,Wa).then(function(c){wm(h)?Q(b):(yc!==
J||wm(G)||um(G),wm(G)?(yc=0,a.b=z.clone(),G.Bc=!1,P(b)):(zc=c,zc.j&&"column"!=zc.j&&(yc=J,"region"!=zc.j&&(a.V[H]=!0)),Ca=Math.max(Ca,zc.ka),yc<J?P(b):Q(b)))})}).then(function(){if(!wm(h)){zc.element===n&&(q=zc);q.ka=Ca;c.Wc(a,q,b,zc,J,a.g,a.h);var d=a.b.b[H];d&&"region"===d.f&&(d.f=null)}O(A,!0)});l=M(A)}else{if((l=ap(c,a,"content"))&&Pk(l)){r="span";l.url&&(r="img");var Kj=a.viewport.b.createElement(r);l.ba(new Ok(Kj,a,l));n.appendChild(Kj);"img"==r&&pp(c,a,Kj,a.h);op(c,a,q,a.h)}else c.xa&&(d.removeChild(n),
y=!0);y||c.Wc(a,q,b,null,1,a.g,a.h);l=L(!0)}l.then(function(){if(wm(h))O(k,!0);else{if(!c.g||0<Math.floor(q.ka)){if(!y&&!m){var l=ap(c,a,"shape-outside"),l=q.yd(l,a);g.push(l)}}else if(!c.w.length){d.removeChild(n);O(k,!0);return}var r=c.w.length-1;ge(function(){for(;0<=r;){var d=c.w[r--],d=ur(a,b,d,n,e,f,g,h);if(d.za())return d.oa(function(){return L(!wm(h))});if(wm(h))break}return L(!1)}).then(function(){O(k,!0)})}});return M(k)}
function vr(a){var b=a.b.page,c;for(c in a.b.b)for(var d=a.b.b[c],e=d.b.length-1;0<=e;e--){var f=d.b[e];0<=f.b.gb&&f.b.gb+f.b.l-1<=b&&d.b.splice(e,1)}}function wr(a,b){for(var c in a.l){var d=b.b[c];if(d&&0<d.b.length)return!1}return!0}
function xr(a,b,c){a.V={};c?(a.b=c.clone(),ml(a.f,c.g)):(a.b=new Ak,ml(a.f,-1));a.lang&&b.g.setAttribute("lang",a.lang);c=a.b;c.page++;Bb(a,a.style.b);a.A=c.clone();var d=Tq(a.X),e=or(a,d);if(!e)return L(null);Tj(b,e.b.b.width.value===Dd);Uj(b,e.b.b.height.value===Ed);a.j.j=b;xo(a.j,d,a);var f=rq(qq(d),a);yr(a,f,b);yq(d,f,b,a);var g=f.Bb+f.Tb,d=ap(e,a,"writing-mode")||ad,f=ap(e,a,"direction")||jd,h=new Zl(a.xb,"page",null,null,null,d,f),l=I("layoutNextPage");he(function(c){ur(a,b,e,b.g,g,g,[],h).then(function(){wm(h)||
um(h);wm(h)?(a.b=a.A.clone(),h.Bc=!1,P(c)):Q(c)})}).then(function(){e.Y(a,b,a.g);var d=new fc(e.b.f,"left-page");b.l=d.evaluate(a)?"left":"right";vr(a);c=a.b;Object.keys(c.b).forEach(function(b){b=c.b[b];var d=b.f;!d||"page"!==d&&hr(a,d)||(b.f=null)});a.b=a.A=null;c.g=a.f.b;Wj(b,a.style.l.J[a.ea.url],a.g);wr(a,c)&&(c=null);O(l,c)});return M(l)}
function yr(a,b,c){a.O=b.Kb;a.J=b.Jb;c.K.style.width=b.Kb+2*b.wd+"px";c.K.style.height=b.Jb+2*b.wd+"px";c.g.style.left=b.Bb+"px";c.g.style.right=b.Bb+"px";c.g.style.top=b.Bb+"px";c.g.style.bottom=b.Bb+"px";c.g.style.padding=b.Tb+"px"}function zr(a,b,c,d){aj.call(this,a.j,a,b,c,d,a.h,!c);this.g=a;this.C=!1}t(zr,aj);p=zr.prototype;p.jd=function(){};p.hd=function(a,b,c){a=new Jo(this.g.w,a,b,c,this.g.G,this.W,ff(this.ja));hf(this.g,new wp(a.f,this.g,a,this.w))};
p.Zb=function(a){a=a.b;this.W&&(a=lc(this.f,this.W,a));hf(this.g,new zr(this.g,a,this,this.F))};p.ed=function(){hf(this.g,new gj(this.f,this.ja))};p.gd=function(){var a={};this.g.A.push({Wb:a,W:this.W});hf(this.g,new hj(this.f,this.ja,null,a,this.g.h))};p.fd=function(a){var b=this.g.l[a];b||(b={},this.g.l[a]=b);hf(this.g,new hj(this.f,this.ja,null,b,this.g.h))};p.ld=function(){var a={};this.g.H.push(a);hf(this.g,new hj(this.f,this.ja,this.W,a,this.g.h))};
p.Ic=function(a){var b=this.g.C;if(a){var c=Ah(b,"_pseudos"),b=c[a];b||(b={},c[a]=b)}hf(this.g,new hj(this.f,this.ja,null,b,this.g.h))};p.kd=function(){this.C=!0;this.tb()};p.jc=function(){var a=new cr(this.g.w,this.g,this,this.w,this.g.F);hf(this.g,a);a.jc()};p.wa=function(){aj.prototype.wa.call(this);if(this.C){this.C=!1;var a="R"+this.g.O++,b=C(a),c;this.W?c=new vh(b,0,this.W):c=new V(b,0);Bh(this.Sa,"region-id").push(c);this.Eb();a=new zr(this.g,this.W,this,a);hf(this.g,a);a.wa()}};
function Ar(a){var b=a.getAttribute("content");if(!b)return"";a={};for(var c;c=b.match(/^,?\s*([-A-Za-z_.][-A-Za-z_0-9.]*)\s*=\s*([-+A-Za-z_0-9.]*)\s*/);)b=b.substr(c[0].length),a[c[1]]=c[2];b=a.width-0;a=a.height-0;return b&&a?"@-epubx-viewport{width:"+b+"px;height:"+a+"px;}":""}function Br(a){gf.call(this);this.h=a;this.j=new sb(null);this.w=new sb(this.j);this.G=new Go(this.j);this.J=new zr(this,null,null,null);this.O=0;this.A=[];this.C={};this.l={};this.H=[];this.F={};this.b=this.J}t(Br,gf);
Br.prototype.error=function(a){u.b("CSS parser:",a)};function Cr(a,b){return Dr(b,a)}function Er(a){$e.call(this,Cr,"document");this.O=a;this.H={};this.w={};this.f={};this.J={};this.l=null;this.b=[]}t(Er,$e);function Fr(a,b,c){Gr(a,b,c);var d=oa("user-agent.xml",na),e=I("OPSDocStore.init");hh.get().then(function(b){a.l=b;fr.get().then(function(){a.load(d).then(function(){O(e,!0)})})});return M(e)}function Gr(a,b,c){a.b.splice(0);b&&b.forEach(a.V,a);c&&c.forEach(a.X,a)}
Er.prototype.V=function(a){this.b.push({url:a.url,text:a.text,Xa:"Author",Ca:null,media:null})};Er.prototype.X=function(a){this.b.push({url:a.url,text:a.text,Xa:"User",Ca:null,media:null})};
function Dr(a,b){var c=I("OPSDocStore.load"),d=b.url;Cj(b,a).then(function(b){if(b){for(var e=[],g=b.b.getElementsByTagNameNS("http://www.idpf.org/2007/ops","trigger"),h=0;h<g.length;h++){var l=g[h],k=l.getAttributeNS("http://www.w3.org/2001/xml-events","observer"),m=l.getAttributeNS("http://www.w3.org/2001/xml-events","event"),n=l.getAttribute("action"),l=l.getAttribute("ref");k&&m&&n&&l&&e.push({hf:k,event:m,action:n,Gc:l})}a.J[d]=e;var r=[];r.push({url:oa("user-agent-page.css",na),text:null,Xa:"UA",
Ca:null,media:null});if(e=b.l)for(e=e.firstChild;e;e=e.nextSibling)if(1==e.nodeType)if(g=e,h=g.namespaceURI,k=g.localName,"http://www.w3.org/1999/xhtml"==h)if("style"==k)r.push({url:d,text:g.textContent,Xa:"Author",Ca:null,media:null});else if("link"==k){if(m=g.getAttribute("rel"),h=g.getAttribute("class"),k=g.getAttribute("media"),"stylesheet"==m||"alternate stylesheet"==m&&h)g=g.getAttribute("href"),g=oa(g,d),r.push({url:g,text:null,Ca:h,media:k,Xa:"Author"})}else"meta"==k&&"viewport"==g.getAttribute("name")&&
r.push({url:d,text:Ar(g),Xa:"Author",Ca:null,media:null});else"http://www.gribuser.ru/xml/fictionbook/2.0"==h?"stylesheet"==k&&"text/css"==g.getAttribute("type")&&r.push({url:d,text:g.textContent,Xa:"Author",Ca:null,media:null}):"http://example.com/sse"==h&&"property"===k&&(h=g.getElementsByTagName("name")[0])&&"stylesheet"===h.textContent&&(g=g.getElementsByTagName("value")[0])&&(g=oa(g.textContent,d),r.push({url:g,text:null,Ca:null,media:null,Xa:"Author"}));for(h=0;h<a.b.length;h++)r.push(a.b[h]);
for(var q="",h=0;h<r.length;h++)q+=r[h].url,q+="^",r[h].text&&(q+=r[h].text),q+="^";var z=a.H[q];z?(a.f[d]=z,O(c,b)):(e=a.w[q],e||(e=new je(function(){var b=I("fetchStylesheet"),c=0,d=new Br(a.l);ge(function(){if(c<r.length){var a=r[c++];d.kc(a.Xa);return null!==a.text?Nf(a.text,d,a.url,a.Ca,a.media).md(!0):Mf(a.url,d,a.Ca,a.media)}return L(!1)}).then(function(){z=new gr(a,d.j,d.w,d.J.j,d.G,d.A,d.C,d.l,d.H,d.F);a.H[q]=z;delete a.w[q];O(b,z)});return M(b)},"FetchStylesheet "+d),a.w[q]=e,e.start()),
e.get().then(function(e){a.f[d]=e;O(c,b)}))}else O(c,null)});return M(c)};function Hr(a){return String.fromCharCode(a>>>24&255,a>>>16&255,a>>>8&255,a&255)}
function Ir(a){var b=new Da;b.append(a);var c=55-a.length&63;for(b.append("\u0080");0<c;)c--,b.append("\x00");b.append("\x00\x00\x00\x00");b.append(Hr(8*a.length));a=b.toString();for(var b=[1732584193,4023233417,2562383102,271733878,3285377520],c=[],d,e=0;e<a.length;e+=64){for(d=0;16>d;d++){var f=a.substr(e+4*d,4);c[d]=(f.charCodeAt(0)&255)<<24|(f.charCodeAt(1)&255)<<16|(f.charCodeAt(2)&255)<<8|f.charCodeAt(3)&255}for(;80>d;d++)f=c[d-3]^c[d-8]^c[d-14]^c[d-16],c[d]=f<<1|f>>>31;var f=b[0],g=b[1],h=
b[2],l=b[3],k=b[4],m;for(d=0;80>d;d++)m=20>d?(g&h|~g&l)+1518500249:40>d?(g^h^l)+1859775393:60>d?(g&h|g&l|h&l)+2400959708:(g^h^l)+3395469782,m+=(f<<5|f>>>27)+k+c[d],k=l,l=h,h=g<<30|g>>>2,g=f,f=m;b[0]=b[0]+f|0;b[1]=b[1]+g|0;b[2]=b[2]+h|0;b[3]=b[3]+l|0;b[4]=b[4]+k|0}return b}function Jr(a){a=Ir(a);for(var b=[],c=0;c<a.length;c++){var d=a[c];b.push(d>>>24&255,d>>>16&255,d>>>8&255,d&255)}return b}
function Kr(a){a=Ir(a);for(var b=new Da,c=0;c<a.length;c++)b.append(Hr(a[c]));a=b.toString();b=new Da;for(c=0;c<a.length;c++)b.append((a.charCodeAt(c)|256).toString(16).substr(1));return b.toString()};function Lr(a,b,c,d,e,f,g,h,l,k){this.b=a;this.url=b;this.lang=c;this.f=d;this.l=e;this.aa=kb(f);this.w=g;this.j=h;this.h=l;this.g=k;this.fb=this.page=null}function Mr(a,b,c){if(c--)for(b=b.firstChild;b;b=b.nextSibling)if(1==b.nodeType){var d=b;"auto"!=Aa(d,"height","auto")&&(v(d,"height","auto"),Mr(a,d,c));"absolute"==Aa(d,"position","static")&&(v(d,"position","relative"),Mr(a,d,c))}}
function Nr(a){var b=a.target,c="\u25b8"==b.textContent;b.textContent=c?"\u25be":"\u25b8";for(b=b.parentNode.firstChild;b;)if(1!=b.nodeType)b=b.nextSibling;else{var d=b;"toc-container"==d.getAttribute("data-adapt-class")?b=d.firstChild:("toc-node"==d.getAttribute("data-adapt-class")&&(d.style.height=c?"auto":"0px"),b=b.nextSibling)}a.stopPropagation()}
Lr.prototype.Fd=function(a){var b=this.w.Fd(a);return function(a,d,e){var c=e.behavior;if(!c||"toc-node"!=c.toString()&&"toc-container"!=c.toString())return b(a,d,e);a=d.getAttribute("data-adapt-class");"toc-node"==a&&(e=d.firstChild,"\u25b8"!=e.textContent&&(e.textContent="\u25b8",v(e,"cursor","pointer"),e.addEventListener("click",Nr,!1)));var g=d.ownerDocument.createElement("div");g.setAttribute("data-adapt-process-children","true");"toc-node"==c.toString()?(e=d.ownerDocument.createElement("div"),
e.textContent="\u25b9",v(e,"margin-left","-1em"),v(e,"display","inline-block"),v(e,"width","1em"),v(e,"text-align","left"),v(e,"cursor","default"),v(e,"font-family","Menlo,sans-serif"),g.appendChild(e),v(g,"overflow","hidden"),g.setAttribute("data-adapt-class","toc-node"),"toc-node"!=a&&"toc-container"!=a||v(g,"height","0px")):"toc-node"==a&&g.setAttribute("data-adapt-class","toc-container");return L(g)}};
Lr.prototype.dd=function(a,b,c,d,e){if(this.page)return L(this.page);var f=this,g=I("showTOC"),h=new Sj(a,a);this.page=h;this.b.load(this.url).then(function(d){var k=f.b.f[d.url],l=jr(k,c,1E5,e);b=new jq(b.window,l.fontSize,b.root,l.width,l.height);var n=new kr(k,d,f.lang,b,f.f,f.l,f.Fd(d),f.j,0,f.h,f.g);f.fb=n;n.aa=f.aa;lr(n).then(function(){xr(n,h,null).then(function(){Mr(f,a,2);O(g,h)})})});return M(g)};
Lr.prototype.Xc=function(){if(this.page){var a=this.page;this.fb=this.page=null;v(a.K,"visibility","none");var b=a.K.parentNode;b&&b.removeChild(a.K)}};Lr.prototype.he=function(){return!!this.page};function Or(){Er.call(this,Pr(this));this.g=new $e(Cj,"document");this.F=new $e(bf,"text");this.G={};this.ga={};this.A={};this.C={}}t(Or,Er);function Pr(a){return function(b){return a.A[b]}}
function Qr(a,b,c){var d=I("loadEPUBDoc");"/"!==b.substring(b.length-1)&&(b+="/");c&&a.F.fetch(b+"?r=list");a.g.fetch(b+"META-INF/encryption.xml");var e=b+"META-INF/container.xml";a.g.load(e,!0,"Failed to fetch EPUB container.xml from "+e).then(function(f){if(f){f=Mj(rj(rj(rj(new sj([f.b]),"container"),"rootfiles"),"rootfile"),"full-path");for(var g=0;g<f.length;g++){var h=f[g];if(h){Rr(a,b,h,c).Fa(d);return}}O(d,null)}else u.error("Received an empty response for EPUB container.xml "+e+". This may be caused by the server not allowing cross origin requests.")});
return M(d)}function Rr(a,b,c,d){var e=b+c,f=a.G[e];if(f)return L(f);var g=I("loadOPF");a.g.load(e,void 0,void 0).then(function(c){c?a.g.load(b+"META-INF/encryption.xml",void 0,void 0).then(function(h){(d?a.F.load(b+"?r=list"):L(null)).then(function(d){f=new Sr(a,b);Tr(f,c,h,d,b+"?r=manifest").then(function(){a.G[e]=f;a.ga[b]=f;O(g,f)})})}):u.error("Received an empty response for EPUB OPF "+e+". This may be caused by the server not allowing cross origin requests.")});return M(g)}
function Ur(a,b,c){var d=I("EPUBDocStore.load");b=la(b);(a.C[b]=Dr(a,{status:200,url:b,contentType:c.contentType,responseText:null,responseXML:c,cd:null})).Fa(d);return M(d)}
Or.prototype.load=function(a){var b=la(a);if(a=this.C[b])return a.za()?a:L(a.get());var c=I("EPUBDocStore.load");a=Or.Te.load.call(this,b,!0,"Failed to fetch a source document from "+b);a.then(function(a){a?O(c,a):u.error("Received an empty response for "+b+". This may be caused by the server not allowing cross origin requests.")});return M(c)};function Vr(){this.id=null;this.src="";this.h=this.f=null;this.P=-1;this.l=0;this.w=null;this.b=this.g=0;this.Xb=this.gb=null;this.j=Pa}
function Wr(a){return a.id}function Xr(a){var b=Jr(a);return function(a){var c=I("deobfuscator"),e,f;a.slice?(e=a.slice(0,1040),f=a.slice(1040,a.size)):(e=a.webkitSlice(0,1040),f=a.webkitSlice(1040,a.size-1040));Ze(e).then(function(a){a=new DataView(a);for(var d=0;d<a.byteLength;d++){var e=a.getUint8(d),e=e^b[d%20];a.setUint8(d,e)}O(c,Ye([a,f]))});return M(c)}}
var Yr={dcterms:"http://purl.org/dc/terms/",marc:"http://id.loc.gov/vocabulary/",media:"http://www.idpf.org/epub/vocab/overlays/#",onix:"http://www.editeur.org/ONIX/book/codelists/current.html#",xsd:"http://www.w3.org/2001/XMLSchema#"},Zr=Yr.dcterms+"language",$r=Yr.dcterms+"title";
function as(a,b){var c={};return function(d,e){var f,g,h=d.r||c,l=e.r||c;if(a==$r&&(f="main"==h["http://idpf.org/epub/vocab/package/#title-type"],g="main"==l["http://idpf.org/epub/vocab/package/#title-type"],f!=g))return f?-1:1;f=parseInt(h["http://idpf.org/epub/vocab/package/#display-seq"],10);isNaN(f)&&(f=Number.MAX_VALUE);g=parseInt(l["http://idpf.org/epub/vocab/package/#display-seq"],10);isNaN(g)&&(g=Number.MAX_VALUE);return f!=g?f-g:a!=Zr&&b&&(f=(h[Zr]||h["http://idpf.org/epub/vocab/package/#alternate-script"])==
b,g=(l[Zr]||l["http://idpf.org/epub/vocab/package/#alternate-script"])==b,f!=g)?f?-1:1:d.o-e.o}}
function bs(a,b){function c(a){for(var b in a){var d=a[b];d.sort(as(b,k));for(var e=0;e<d.length;e++){var f=d[e].r;f&&c(f)}}}function d(a){return Sa(a,function(a){return Ra(a,function(a){var b={v:a.value,o:a.order};a.Rf&&(b.s=a.scheme);if(a.id||a.lang){var c=l[a.id];if(c||a.lang)a.lang&&(a={name:Zr,value:a.lang,lang:null,id:null,Nd:a.id,scheme:null,order:a.order},c?c.push(a):c=[a]),c=Qa(c,function(a){return a.name}),b.r=d(c)}return b})})}function e(a){if(a&&(a=a.match(/^\s*(([^:]*):)?(\S+)\s*$/))){var b=
a[1]?f[a[1]]:"http://idpf.org/epub/vocab/package/#";if(b)return b+a[3]}return null}var f;if(b){f={};for(var g in Yr)f[g]=Yr[g];for(;g=b.match(/(^\s*[A-Z_a-z\u007F-\uFFFF][-.A-Z_a-z0-9\u007F-\uFFFF]*):\s*(\S+)/);)b=b.substr(g[0].length),f[g[1]]=g[2]}else f=Yr;var h=1;g=Jj(Lj(a),function(a){if("meta"==a.localName){var b=e(a.getAttribute("property"));if(b)return{name:b,value:a.textContent,id:a.getAttribute("id"),order:h++,Nd:a.getAttribute("refines"),lang:null,scheme:e(a.getAttribute("scheme"))}}else if("http://purl.org/dc/elements/1.1/"==
a.namespaceURI)return{name:Yr.dcterms+a.localName,order:h++,lang:a.getAttribute("xml:lang"),value:a.textContent,id:a.getAttribute("id"),Nd:null,scheme:null};return null});var l=Qa(g,function(a){return a.Nd});g=d(Qa(g,function(a){return a.Nd?null:a.name}));var k=null;g[Zr]&&(k=g[Zr][0].v);c(g);return g}function cs(){var a=window.MathJax;return a?a.Hub:null}var ds={"appliaction/xhtml+xml":!0,"image/jpeg":!0,"image/png":!0,"image/svg+xml":!0,"image/gif":!0,"audio/mp3":!0};
function Sr(a,b){this.h=a;this.l=this.f=this.b=this.j=this.g=null;this.C=b;this.A=null;this.V={};this.lang=null;this.F=0;this.J={};this.X=this.O=this.Y=null;this.G={};this.H=null;this.w=es(this);cs()&&(lh["http://www.w3.org/1998/Math/MathML"]=!0)}
function es(a){function b(){}b.prototype.Qd=function(a,b){return"viv-id-"+qa(b+(a?"#"+a:""),":")};b.prototype.Nc=function(b,d){var c=b.match(/^([^#]*)#?(.*)$/);if(c){var f=c[1]||d,c=c[2];if(f&&a.j.some(function(a){return a.src===f}))return"#"+this.Qd(c,f)}return b};b.prototype.mf=function(a){"#"===a.charAt(0)&&(a=a.substring(1));a.indexOf("viv-id-")||(a=a.substring(7));return(a=Ja(a).match(/^([^#]*)#?(.*)$/))?[a[1],a[2]]:[]};return new b}
function fs(a,b){return a.C?b.substr(0,a.C.length)==a.C?decodeURI(b.substr(a.C.length)):null:b}
function Tr(a,b,c,d,e){a.g=b;var f=rj(new sj([b.b]),"package"),g=Mj(f,"unique-identifier")[0];g&&(g=yj(b,b.url+"#"+g))&&(a.A=g.textContent.replace(/[ \n\r\t]/g,""));var h={};a.j=Ra(rj(rj(f,"manifest"),"item").b,function(c){var d=new Vr,e=b.url;d.id=c.getAttribute("id");d.src=oa(c.getAttribute("href"),e);d.f=c.getAttribute("media-type");if(e=c.getAttribute("properties")){for(var e=e.split(/\s+/),f={},g=0;g<e.length;g++)f[e[g]]=!0;d.j=f}(c=c.getAttribute("fallback"))&&!ds[d.f]&&(h[d.src]=c);!a.O&&d.j.nav&&
(a.O=d);!a.X&&d.j["cover-image"]&&(a.X=d);return d});a.f=Na(a.j,Wr);a.l=Na(a.j,function(b){return fs(a,b.src)});for(var l in h)for(g=l;;){g=a.f[h[g]];if(!g)break;if(ds[g.f]){a.G[l]=g.src;break}g=g.src}a.b=Ra(rj(rj(f,"spine"),"itemref").b,function(b,c){var d=b.getAttribute("idref");if(d=a.f[d])d.h=b,d.P=c;return d});if(l=Mj(rj(f,"spine"),"toc")[0])a.Y=a.f[l];if(l=Mj(rj(f,"spine"),"page-progression-direction")[0]){a:switch(l){case "ltr":l="ltr";break a;case "rtl":l="rtl";break a;default:throw Error("unknown PageProgression: "+
l);}a.H=l}var g=c?Mj(rj(rj(Hj(rj(rj(new sj([c.b]),"encryption"),"EncryptedData"),Gj()),"CipherData"),"CipherReference"),"URI"):[],k=rj(rj(f,"bindings"),"mediaType").b;for(c=0;c<k.length;c++){var m=k[c].getAttribute("handler");(l=k[c].getAttribute("media-type"))&&m&&a.f[m]&&(a.V[l]=a.f[m].src)}a.J=bs(rj(f,"metadata"),Mj(f,"prefix")[0]);a.J[Zr]&&(a.lang=a.J[Zr][0].v);if(!d){if(0<g.length&&a.A)for(d=Xr(a.A),c=0;c<g.length;c++)a.h.A[a.C+g[c]]=d;return L(!0)}f=new Da;k={};if(0<g.length&&a.A)for(l="1040:"+
Kr(a.A),c=0;c<g.length;c++)k[g[c]]=l;for(c=0;c<d.length;c++){var n=d[c];if(m=n.n){var r=decodeURI(m),g=a.l[r];l=null;g&&(g.w=0!=n.m,g.l=n.c,g.f&&(l=g.f.replace(/\s+/g,"")));g=k[r];if(l||g)f.append(m),f.append(" "),f.append(l||"application/octet-stream"),g&&(f.append(" "),f.append(g)),f.append("\n")}}gs(a);return Xe(e,"","POST",f.toString(),"text/plain")}function gs(a){for(var b=0,c=0;c<a.b.length;c++){var d=a.b[c],e=Math.ceil(d.l/1024);d.g=b;d.b=e;b+=e}a.F=b}
function hs(a,b,c){a.f={};a.l={};a.j=[];a.b=a.j;var d=a.g=new qj(null,"",(new DOMParser).parseFromString("<spine></spine>","text/xml"));b.forEach(function(a){var b=new Vr;b.P=a.index;b.id="item"+(a.index+1);b.src=a.url;b.gb=a.gb;b.Xb=a.Xb;var c=d.b.createElement("itemref");c.setAttribute("idref",b.id);d.root.appendChild(c);b.h=c;this.f[b.id]=b;this.l[a.url]=b;this.j.push(b)},a);return c?Ur(a.h,b[0].url,c):L(null)}
function is(a,b,c){var d=a.b[b],e=I("getCFI");a.h.load(d.src).then(function(a){var b=wj(a,c),f=null;b&&(a=uj(a,b,0,!1),f=new fb,ib(f,b,c-a),d.h&&ib(f,d.h,0),f=f.toString());O(e,f)});return M(e)}
function js(a,b){return Qd("resolveFragment",function(c){if(b){var d=new fb;gb(d,b);var e;if(a.g){var f=hb(d,a.g.b);if(1!=f.node.nodeType||f.M||!f.Gc){O(c,null);return}var g=f.node,h=g.getAttribute("idref");if("itemref"!=g.localName||!h||!a.f[h]){O(c,null);return}e=a.f[h];d=f.Gc}else e=a.b[0];a.h.load(e.src).then(function(a){var b=hb(d,a.b);a=uj(a,b.node,b.offset,b.M);O(c,{P:e.P,Ea:a,$:-1})})}else O(c,null)},function(a,d){u.b(d,"Cannot resolve fragment:",b);O(a,null)})}
function ks(a,b){return Qd("resolveEPage",function(c){if(0>=b)O(c,{P:0,Ea:0,$:-1});else{var d=La(a.b.length,function(c){c=a.b[c];return c.g+c.b>b}),e=a.b[d];a.h.load(e.src).then(function(a){b-=e.g;b>e.b&&(b=e.b);var f=0;0<b&&(a=vj(a),f=Math.round(a*b/e.b),f==a&&f--);O(c,{P:d,Ea:f,$:-1})})}},function(a,d){u.b(d,"Cannot resolve epage:",b);O(a,null)})}
function ls(a,b){var c=a.b[b.P];if(0>=b.Ea)return L(c.g);var d=I("getEPage");a.h.load(c.src).then(function(a){a=vj(a);O(d,c.g+Math.min(a,b.Ea)*c.b/a)});return M(d)}function ms(a,b){return{page:a,position:{P:a.P,$:b,Ea:a.offset}}}function ns(a,b,c,d,e){this.b=a;this.viewport=b;this.j=c;this.w=e;this.Yb=[];this.l=[];this.aa=kb(d);this.h=new hq(b);this.f=new vo(a.w)}function os(a,b){var c=a.Yb[b.P];return c?c.mb[b.$]:null}p=ns.prototype;
p.Hb=function(a){return this.b.H?this.b.H:(a=this.Yb[a?a.P:0])?a.fb.ga:null};function ps(a,b,c,d){c.K.style.display="none";c.K.style.visibility="visible";c.K.style.position="";c.K.style.top="";c.K.style.left="";c.K.setAttribute("data-vivliostyle-page-side",c.l);var e=b.mb[d];c.G=!b.item.P&&!d;b.mb[d]=c;e?(b.fb.viewport.f.replaceChild(c.K,e.K),Ua(e,{type:"replaced",target:null,currentTarget:null,Oe:c})):b.fb.viewport.f.appendChild(c.K);a.w(b.fb.xa,b.item.P,d)}
function qs(a,b,c){var d=I("renderSinglePage"),e=rs(a,b,c);xr(b.fb,e,c).then(function(f){var g=(c=f)?c.page-1:b.Qa.length-1;ps(a,b,e,g);zo(a.f,e.P,g);f=null;if(c){var h=b.Qa[c.page];b.Qa[c.page]=c;h&&b.mb[c.page]&&(Bk(c,h)||(f=qs(a,b,c)))}f||(f=L(!0));f.then(function(){var b=Ao(a.f,e),f=0;he(function(c){f++;if(f>b.length)Q(c);else{var d=b[f-1];d.bd=d.bd.filter(function(a){return!a.Hc});d.bd.length?ss(a,d.P).then(function(b){b?(yo(a.f,d.Jd),Bo(a.f,d.bd),qs(a,b,b.Qa[d.$]).then(function(b){var d=a.f;
d.b=d.F.pop();d=a.f;d.g=d.H.pop();d=b.Cc.position;d.P===e.P&&d.$===g&&(e=b.Cc.page);P(c)})):P(c)}):P(c)}}).then(function(){O(d,{Cc:ms(e,g),Pe:c})})})});return M(d)}function ts(a,b){var c=a.$,d=-1;0>c&&(d=a.Ea,c=La(b.Qa.length,function(a){return nr(b.fb,b.Qa[a],!0)>d}),c=c===b.Qa.length?b.complete?b.Qa.length-1:Number.POSITIVE_INFINITY:c-1);return{P:a.P,$:c,Ea:d}}
function us(a,b,c){var d=I("findPage");ss(a,b.P).then(function(e){if(e){var f=null,g;he(function(d){var h=ts(b,e);g=h.$;(f=e.mb[g])?Q(d):e.complete?(g=e.Qa.length-1,f=e.mb[g],Q(d)):c?vs(a,h).then(function(a){a&&(f=a.page);Q(d)}):fe(100).then(function(){P(d)})}).then(function(){O(d,ms(f,g))})}else O(d,null)});return M(d)}
function vs(a,b){var c=I("renderPage");ss(a,b.P).then(function(d){if(d){var e=ts(b,d),f=e.$,g=e.Ea,h=d.mb[f];h?O(c,ms(h,f)):he(function(b){if(f<d.Qa.length)Q(b);else if(d.complete)f=d.Qa.length-1,Q(b);else{var c=d.Qa[d.Qa.length-1];qs(a,d,c).then(function(e){var k=e.Cc.page;(c=e.Pe)?0<=g&&nr(d.fb,c)>g?(h=k,f=d.Qa.length-2,Q(b)):P(b):(h=k,f=e.Cc.position.$,d.complete=!0,k.A=d.item.P===a.b.b.length-1,Q(b))})}}).then(function(){h=h||d.mb[f];var b=d.Qa[f];h?O(c,ms(h,f)):qs(a,d,b).then(function(b){b.Pe||
(d.complete=!0,b.Cc.page.A=d.item.P===a.b.b.length-1);O(c,b.Cc)})})}else O(c,null)});return M(c)}p.Od=function(){return ws(this,{P:this.b.b.length-1,$:Number.POSITIVE_INFINITY,Ea:-1})};function ws(a,b){var c=I("renderAllPages");b||(b={P:0,$:0,Ea:0});var d=b.P,e=b.$,f=0,g;he(function(c){vs(a,{P:f,$:f===d?e:Number.POSITIVE_INFINITY,Ea:f===d?b.Ea:-1}).then(function(a){g=a;++f>d?Q(c):P(c)})}).then(function(){O(c,g)});return M(c)}p.Ze=function(){return us(this,{P:0,$:0,Ea:-1})};
p.bf=function(){return us(this,{P:this.b.b.length-1,$:Number.POSITIVE_INFINITY,Ea:-1})};p.nextPage=function(a,b){var c=this,d=a.P,e=a.$,f=I("nextPage");ss(c,d).then(function(a){if(a){if(a.complete&&e==a.Qa.length-1){if(d>=c.b.b.length-1){O(f,null);return}d++;e=0}else e++;us(c,{P:d,$:e,Ea:-1},b).Fa(f)}else O(f,null)});return M(f)};p.Md=function(a){var b=a.P;if(a=a.$)a--;else{if(!b)return L(null);b--;a=Number.POSITIVE_INFINITY}return us(this,{P:b,$:a,Ea:-1})};
function xs(a,b,c){b="left"===b.l;a="ltr"===a.Hb(c);return!b&&a||b&&!a}function ys(a,b,c){var d=I("getCurrentSpread"),e=os(a,b);if(!e)return L({left:null,right:null});var f="left"===e.l;(xs(a,e,b)?a.Md(b):a.nextPage(b,c)).then(function(a){a=a&&a.page;f?O(d,{left:e,right:a}):O(d,{left:a,right:e})});return M(d)}p.gf=function(a,b){var c=os(this,a);if(!c)return L(null);var c=xs(this,c,a),d=this.nextPage(a,!!b);if(c)return d;var e=this;return d.oa(function(a){return a?e.nextPage(a.position,!!b):L(null)})};
p.kf=function(a){var b=os(this,a);if(!b)return L(null);b=xs(this,b,a);a=this.Md(a);if(b){var c=this;return a.oa(function(a){return a?c.Md(a.position):L(null)})}return a};function zs(a,b){var c=I("navigateToEPage");ks(a.b,b).then(function(b){b?us(a,b).Fa(c):O(c,null)});return M(c)}function As(a,b){var c=I("navigateToCFI");js(a.b,b).then(function(b){b?us(a,b).Fa(c):O(c,null)});return M(c)}
function Bs(a,b,c){u.debug("Navigate to",b);var d=fs(a.b,la(b));if(!d){if(a.b.g&&b.match(/^#epubcfi\(/))d=fs(a.b,a.b.g.url);else if("#"===b.charAt(0)){var e=a.b.w.mf(b);a.b.g?d=fs(a.b,e[0]):d=e[0];b=d+(e[1]?"#"+e[1]:"")}if(null==d)return L(null)}var f=a.b.l[d];if(!f)return a.b.g&&d==fs(a.b,a.b.g.url)&&(d=b.indexOf("#"),0<=d)?As(a,b.substr(d+1)):L(null);var g=I("navigateTo");ss(a,f.P).then(function(d){var e=yj(d.ea,b);e?us(a,{P:f.P,$:-1,Ea:tj(d.ea,e)}).Fa(g):c.P!==f.P?us(a,{P:f.P,$:0,Ea:-1}).Fa(g):
O(g,null)});return M(g)}
function rs(a,b,c){var d=b.fb.viewport,e=d.b.createElement("div");e.setAttribute("data-vivliostyle-page-container",!0);e.style.position="absolute";e.style.top="0";e.style.left="0";mj||(e.style.visibility="hidden");d.h.appendChild(e);var f=d.b.createElement("div");f.setAttribute("data-vivliostyle-bleed-box",!0);e.appendChild(f);var g=new Sj(e,f);g.P=b.item.P;g.position=c;g.offset=nr(b.fb,c);g.offset||(b=a.b.w.Qd("",b.item.src),f.setAttribute("id",b),Vj(g,f,b));d!==a.viewport&&(a=Of(null,new Te(nb(a.viewport.width,
a.viewport.height,d.width,d.height),null)),g.w.push(new Pj(e,"transform",a)));return g}function Cs(a,b){var c=cs();if(c){var d=b.ownerDocument,e=d.createElement("span");b.appendChild(e);d=d.importNode(a,!0);e.appendChild(d);d=c.queue;d.Push(["Typeset",c,e]);var c=I("makeMathJaxView"),f=$d(c);d.Push(function(){f.bb(e)});return M(c)}return L(null)}
p.Fd=function(a){var b=this;return function(c,d){var e;if("object"==c.localName&&"http://www.w3.org/1999/xhtml"==c.namespaceURI){var f=c.getAttribute("data");e=null;if(f){var f=oa(f,a.url),g=c.getAttribute("media-type");if(!g){var h=fs(b.b,f);h&&(h=b.b.l[h])&&(g=h.f)}if(g&&(h=b.b.V[g])){e=b.viewport.b.createElement("iframe");e.style.border="none";var f=Ha(f),l=Ha(g),g=new Da;g.append(h);g.append("?src=");g.append(f);g.append("&type=");g.append(l);for(h=c.firstChild;h;h=h.nextSibling)1==h.nodeType&&
(l=h,"param"==l.localName&&"http://www.w3.org/1999/xhtml"==l.namespaceURI&&(f=l.getAttribute("name"),l=l.getAttribute("value"),f&&l&&(g.append("&"),g.append(encodeURIComponent(f)),g.append("="),g.append(encodeURIComponent(l)))));e.setAttribute("src",g.toString());(g=c.getAttribute("width"))&&e.setAttribute("width",g);(g=c.getAttribute("height"))&&e.setAttribute("height",g)}}e||(e=b.viewport.b.createElement("span"),e.setAttribute("data-adapt-process-children","true"));e=L(e)}else if("http://www.w3.org/1998/Math/MathML"==
c.namespaceURI)e=Cs(c,d);else if("http://example.com/sse"==c.namespaceURI){e=d?d.ownerDocument:b.viewport.b;g=c.localName;switch(g){case "t":case "tab":case "ec":case "nt":case "fraction":case "comment":case "mark":g="span";break;case "ruby":case "rp":case "rt":break;default:g="div"}e=e.createElement(g);e.setAttribute("data-adapt-process-children","true");e=L(e)}else e=c.dataset&&"true"==c.dataset.mathTypeset?Cs(c,d):L(null);return e}};
function ss(a,b){if(b>=a.b.b.length)return L(null);var c=a.Yb[b];if(c)return L(c);var d=I("getPageViewItem"),e=a.l[b];if(e){var f=$d(d);e.push(f);return M(d)}var e=a.l[b]=[],g=a.b.b[b],h=a.b.h;h.load(g.src).then(function(f){g.b||1!=a.b.b.length||(g.b=Math.ceil(vj(f)/2700),a.b.F=g.b);var k=h.f[f.url],l=a.Fd(f),n=a.viewport,r=jr(k,n.width,n.height,n.fontSize);if(r.width!=n.width||r.height!=n.height||r.fontSize!=n.fontSize)n=new jq(n.window,r.fontSize,n.root,r.width,r.height);r=a.Yb[b-1];null!==g.gb?
r=g.gb-1:(r=r?r.fb.ta+r.mb.length:0,null!==g.Xb&&(r+=g.Xb));wo(a.f,r);var q=new kr(k,f,a.b.lang,n,a.h,a.j,l,a.b.G,r,a.b.w,a.f);q.aa=a.aa;lr(q).then(function(){c={item:g,ea:f,fb:q,Qa:[null],mb:[],complete:!1};a.Yb[b]=c;O(d,c);e.forEach(function(a){a.bb(c)})})});return M(d)}function Ds(a){return a.Yb.some(function(a){return a&&0<a.mb.length})}
p.dd=function(){var a=this.b,b=a.O||a.Y;if(!b)return L(null);var c=I("showTOC");this.g||(this.g=new Lr(a.h,b.src,a.lang,this.h,this.j,this.aa,this,a.G,a.w,this.f));var a=this.viewport,b=Math.min(350,Math.round(.67*a.width)-16),d=a.height-6,e=a.b.createElement("div");a.root.appendChild(e);e.style.position="absolute";e.style.visibility="hidden";e.style.left="3px";e.style.top="3px";e.style.width=b+10+"px";e.style.maxHeight=d+"px";e.style.overflow="scroll";e.style.overflowX="hidden";e.style.background=
"#EEE";e.style.border="1px outset #999";e.style.borderRadius="2px";e.style.boxShadow=" 5px 5px rgba(128,128,128,0.3)";this.g.dd(e,a,b,d,this.viewport.fontSize).then(function(a){e.style.visibility="visible";O(c,a)});return M(c)};p.Xc=function(){this.g&&this.g.Xc()};p.he=function(){return this.g&&this.g.he()};var Es={Ff:"singlePage",Gf:"spread",vf:"autoSpread"};
function Fs(a,b,c,d){var e=this;this.window=a;this.od=b;b.setAttribute("data-vivliostyle-viewer-viewport",!0);mj&&b.setAttribute("data-vivliostyle-debug",!0);b.setAttribute("data-vivliostyle-viewer-status","loading");this.Va=c;this.La=d;a=a.document;this.ta=new El(a.head,b);this.A="loading";this.O=[];this.h=null;this.Ib=this.Na=!1;this.f=this.j=this.g=this.C=null;this.fontSize=16;this.zoom=1;this.F=!1;this.X="singlePage";this.ga=!1;this.Od=!0;this.aa=jb();this.J=function(){};this.w=function(){};this.Y=
function(){e.Na=!0;e.J()};this.Kd=this.Kd.bind(this);this.G=function(){};this.H=a.getElementById("vivliostyle-page-rules");this.V=!1;this.l=null;this.na={loadEPUB:this.We,loadXML:this.Xe,configure:this.$d,moveTo:this.xa,toc:this.dd};Gs(this)}function Gs(a){ka(1,function(a){Hs(this,{t:"debug",content:a})}.bind(a));ka(2,function(a){Hs(this,{t:"info",content:a})}.bind(a));ka(3,function(a){Hs(this,{t:"warn",content:a})}.bind(a));ka(4,function(a){Hs(this,{t:"error",content:a})}.bind(a))}
function Hs(a,b){b.i=a.Va;a.La(b)}function Is(a,b){a.A!==b&&(a.A=b,a.od.setAttribute("data-vivliostyle-viewer-status",b),Hs(a,{t:"readystatechange"}))}p=Fs.prototype;
p.We=function(a){Js.f("beforeRender");Is(this,"loading");var b=a.url,c=a.fragment,d=!!a.zipmeta,e=a.authorStyleSheet,f=a.userStyleSheet;this.viewport=null;var g=I("loadEPUB"),h=this;h.$d(a).then(function(){var a=new Or;Fr(a,e,f).then(function(){var e=oa(b,h.window.location.href);h.O=[e];Qr(a,e,d).then(function(a){h.h=a;Ks(h,c).then(function(){O(g,!0)})})})});return M(g)};
p.Xe=function(a){Js.f("beforeRender");Is(this,"loading");var b=a.url,c=a.document,d=a.fragment,e=a.authorStyleSheet,f=a.userStyleSheet;this.viewport=null;var g=I("loadXML"),h=this;h.$d(a).then(function(){var a=new Or;Fr(a,e,f).then(function(){var e=b.map(function(a,b){return{url:oa(a.url,h.window.location.href),index:b,gb:a.gb,Xb:a.Xb}});h.O=e.map(function(a){return a.url});h.h=new Sr(a,"");hs(h.h,e,c).then(function(){Ks(h,d).then(function(){O(g,!0)})})})});return M(g)};
function Ks(a,b){Ls(a);var c;b?c=js(a.h,b).oa(function(b){a.f=b;return L(!0)}):c=L(!0);return c.oa(function(){Js.b("beforeRender");return Ms(a)})}function Ns(a,b){var c=parseFloat(b),d=/[a-z]+$/,e;if("string"===typeof b&&(e=b.match(d))){d=e[0];if("em"===d||"rem"===d)return c*a.fontSize;if("ex"===d||"rex"===d)return c*yb.ex*a.fontSize/yb.em;if(d=yb[d])return c*d}return c}
p.$d=function(a){"boolean"==typeof a.autoresize&&(a.autoresize?(this.C=null,this.window.addEventListener("resize",this.Y,!1),this.Na=!0):this.window.removeEventListener("resize",this.Y,!1));if("number"==typeof a.fontSize){var b=a.fontSize;5<=b&&72>=b&&this.fontSize!=b&&(this.fontSize=b,this.Na=!0)}"object"==typeof a.viewport&&a.viewport&&(b=a.viewport,b={marginLeft:Ns(this,b["margin-left"])||0,marginRight:Ns(this,b["margin-right"])||0,marginTop:Ns(this,b["margin-top"])||0,marginBottom:Ns(this,b["margin-bottom"])||
0,width:Ns(this,b.width)||0,height:Ns(this,b.height)||0},200<=b.width||200<=b.height)&&(this.window.removeEventListener("resize",this.Y,!1),this.C=b,this.Na=!0);"boolean"==typeof a.hyphenate&&(this.aa.Ad=a.hyphenate,this.Na=!0);"boolean"==typeof a.horizontal&&(this.aa.zd=a.horizontal,this.Na=!0);"boolean"==typeof a.nightMode&&(this.aa.Gd=a.nightMode,this.Na=!0);"number"==typeof a.lineHeight&&(this.aa.lineHeight=a.lineHeight,this.Na=!0);"number"==typeof a.columnWidth&&(this.aa.vd=a.columnWidth,this.Na=
!0);"string"==typeof a.fontFamily&&(this.aa.fontFamily=a.fontFamily,this.Na=!0);"boolean"==typeof a.load&&(this.ga=a.load);"boolean"==typeof a.renderAllPages&&(this.Od=a.renderAllPages);"string"==typeof a.userAgentRootURL&&(ma=a.userAgentRootURL.replace(/resources\/?$/,""),na=a.userAgentRootURL);"string"==typeof a.rootURL&&(ma=a.rootURL,na=ma+"resources/");"string"==typeof a.pageViewMode&&a.pageViewMode!==this.X&&(this.X=a.pageViewMode,this.Na=!0);"number"==typeof a.pageBorder&&a.pageBorder!==this.aa.ic&&
(this.viewport=null,this.aa.ic=a.pageBorder,this.Na=!0);"number"==typeof a.zoom&&a.zoom!==this.zoom&&(this.zoom=a.zoom,this.Ib=!0);"boolean"==typeof a.fitToScreen&&a.fitToScreen!==this.F&&(this.F=a.fitToScreen,this.Ib=!0);Os(this,a);return L(!0)};function Os(a,b){(Jd.CONFIGURATION||[]).forEach(function(a){a=a(b);this.Na=a.Na||this.Na;this.Ib=a.Ib||this.Ib}.bind(a))}p.Kd=function(a){var b=this.g,c=this.j,d=a.target;c?c.left!==d&&c.right!==d||Ps(this,a.Oe):b===a.target&&Ps(this,a.Oe)};
function Qs(a,b){var c=[];a.g&&c.push(a.g);a.j&&(c.push(a.j.left),c.push(a.j.right));c.forEach(function(a){a&&b(a)})}function Rs(a){Qs(a,function(a){a.removeEventListener("hyperlink",this.G,!1);a.removeEventListener("replaced",this.Kd,!1)}.bind(a))}function Ss(a){Rs(a);Qs(a,function(a){v(a.K,"display","none")});a.g=null;a.j=null}function Ts(a,b){b.addEventListener("hyperlink",a.G,!1);b.addEventListener("replaced",a.Kd,!1);v(b.K,"visibility","visible");v(b.K,"display","block")}
function Us(a,b){Ss(a);a.g=b;Ts(a,b)}function Vs(a){var b=I("reportPosition");is(a.h,a.f.P,a.f.Ea).then(function(c){var d=a.g;(a.ga&&0<d.j.length?le(d.j):L(!0)).then(function(){Ws(a,d,c).Fa(b)})});return M(b)}function Xs(a){var b=a.od;if(a.C){var c=a.C;b.style.marginLeft=c.marginLeft+"px";b.style.marginRight=c.marginRight+"px";b.style.marginTop=c.marginTop+"px";b.style.marginBottom=c.marginBottom+"px";return new jq(a.window,a.fontSize,b,c.width,c.height)}return new jq(a.window,a.fontSize,b)}
function Ys(a){var b=Xs(a),c;a:switch(a.X){case "singlePage":c=!1;break a;case "spread":c=!0;break a;default:c=1.45<=b.width/b.height&&800<b.width}var d=a.aa.ob!==c;a.aa.ob=c;a.od.setAttribute("data-vivliostyle-spread-view",c);if(a.C||!a.viewport||a.viewport.fontSize!=a.fontSize)return!1;if(!d&&b.width==a.viewport.width&&b.height==a.viewport.height)return!0;if(d=a.b&&Ds(a.b)){a:{d=a.b.Yb;for(c=0;c<d.length;c++){var e=d[c];if(e)for(var e=e.mb,f=0;f<e.length;f++){var g=e[f];if(g.F&&g.C){d=!0;break a}}}d=
!1}d=!d}return d?(a.viewport.width=b.width,a.viewport.height=b.height,a.Ib=!0):!1}p.nf=function(a,b,c){if(!this.V&&this.H&&!b&&!c){var d="";Object.keys(a).forEach(function(b){d+="@page "+b+"{size:";b=a[b];d+=b.width+"px "+b.height+"px;}"});this.H.textContent=d;this.V=!0}};
function Zs(a){if(a.b){a.b.Xc();for(var b=a.b,c=b.Yb,d=0;d<c.length;d++){var e=c[d];e&&e.mb.splice(0)}for(b=b.viewport.root;b.lastChild;)b.removeChild(b.lastChild)}a.H&&(a.H.textContent="",a.V=!1);a.viewport=Xs(a);b=a.viewport;v(b.g,"width","");v(b.g,"height","");v(b.f,"width","");v(b.f,"height","");v(b.f,"transform","");a.b=new ns(a.h,a.viewport,a.ta,a.aa,a.nf.bind(a))}
function Ps(a,b,c){a.Ib=!1;Rs(a);if(a.aa.ob)return ys(a.b,a.f,c).oa(function(c){Ss(a);a.j=c;c.left&&(Ts(a,c.left),c.right||c.left.K.setAttribute("data-vivliostyle-unpaired-page",!0));c.right&&(Ts(a,c.right),c.left||c.right.K.setAttribute("data-vivliostyle-unpaired-page",!0));c=$s(a,c);a.viewport.zoom(c.width,c.height,a.F?at(a,c):a.zoom);a.g=b;return L(null)});Us(a,b);a.viewport.zoom(b.f.width,b.f.height,a.F?at(a,b.f):a.zoom);a.g=b;return L(null)}
function $s(a,b){var c=0,d=0;b.left&&(c+=b.left.f.width,d=b.left.f.height);b.right&&(c+=b.right.f.width,d=Math.max(d,b.right.f.height));b.left&&b.right&&(c+=2*a.aa.ic);return{width:c,height:d}}var bt={Af:"fit inside viewport"};function at(a,b){return Math.min(a.viewport.width/b.width,a.viewport.height/b.height)}function ct(){this.name="RenderingCanceledError";this.message="Page rendering has been canceled";this.stack=Error().stack}t(ct,Error);
function Ls(a){if(a.l){var b=a.l;Rd(b,new ct);if(b!==Ld&&b.b){b.b.h=!0;var c=new ae(b);b.w="interrupt";b.b=c;b.f.bb(c)}}a.l=null}
function Ms(a){a.Na=!1;a.Ib=!1;if(Ys(a))return L(!0);Is(a,"loading");Ls(a);var b=Td(Ld.f,function(){return Qd("resize",function(c){a.l=b;Js.f("render (resize)");Zs(a);a.f&&(a.f.$=-1);ws(a.b,a.f).then(function(d){a.f=d.position;Ps(a,d.page,!0).then(function(){Vs(a).then(function(d){Is(a,"interactive");(a.Od?a.b.Od():L(null)).then(function(){a.l===b&&(a.l=null);Js.b("render (resize)");Is(a,"complete");Hs(a,{t:"loaded"});O(c,d)})})})})},function(a,b){if(b instanceof ct)Js.b("render (resize)"),u.debug(b.message);
else throw b;})});return L(!0)}function Ws(a,b,c){var d=I("sendLocationNotification"),e={t:"nav",first:b.G,last:b.A};ls(a.h,a.f).then(function(b){e.epage=b;e.epageCount=a.h.F;c&&(e.cfi=c);Hs(a,e);O(d,!0)});return M(d)}Fs.prototype.Hb=function(){return this.b?this.b.Hb(this.f):null};
Fs.prototype.xa=function(a){var b=this;"complete"!==this.A&&Is(this,"loading");if("string"==typeof a.where){switch(a.where){case "next":a=this.aa.ob?this.b.gf:this.b.nextPage;break;case "previous":a=this.aa.ob?this.b.kf:this.b.Md;break;case "last":a=this.b.bf;break;case "first":a=this.b.Ze;break;default:return L(!0)}if(a){var c=a;a=function(){return c.call(b.b,b.f)}}}else if("number"==typeof a.epage){var d=a.epage;a=function(){return zs(b.b,d)}}else if("string"==typeof a.url){var e=a.url;a=function(){return Bs(b.b,
e,b.f)}}else return L(!0);var f=I("moveTo");a.call(b.b).then(function(a){var c;if(a){b.f=a.position;var d=I("moveTo.showCurrent");c=M(d);Ps(b,a.page).then(function(){Vs(b).Fa(d)})}else c=L(!0);c.then(function(a){"loading"===b.A&&Is(b,"interactive");O(f,a)})});return M(f)};
Fs.prototype.dd=function(a){var b=!!a.autohide;a=a.v;var c=this.b.he();if(c){if("show"==a)return L(!0)}else if("hide"==a)return L(!0);if(c)return this.b.Xc(),L(!0);var d=this,e=I("showTOC");this.b.dd(b).then(function(a){if(a){if(b){var c=function(){d.b.Xc()};a.addEventListener("hyperlink",c,!1);a.K.addEventListener("click",c,!1)}a.addEventListener("hyperlink",d.G,!1)}O(e,!0)});return M(e)};
function dt(a,b){var c=b.a||"";return Qd("runCommand",function(d){var e=a.na[c];e?e.call(a,b).then(function(){Hs(a,{t:"done",a:c});O(d,!0)}):(u.error("No such action:",c),O(d,!0))},function(a,b){u.error(b,"Error during action:",c);O(a,!0)})}function et(a){return"string"==typeof a?JSON.parse(a):a}
function ft(a,b){var c=et(b),d=null;Sd(function(){var b=I("commandLoop"),f=Ld.f;a.G=function(b){var c="#"===b.href.charAt(0)||a.O.some(function(a){return b.href.substr(0,a.length)==a});if(c){b.preventDefault();var d={t:"hyperlink",href:b.href,internal:c};Td(f,function(){Hs(a,d);return L(!0)})}};he(function(b){if(a.Na)Ms(a).then(function(){P(b)});else if(a.Ib)a.g&&Ps(a,a.g).then(function(){P(b)});else if(c){var e=c;c=null;dt(a,e).then(function(){P(b)})}else e=I("waitForCommand"),d=$d(e,self),M(e).then(function(){P(b)})}).Fa(b);
return M(b)});a.J=function(){var a=d;a&&(d=null,a.bb())};a.w=function(b){if(c)return!1;c=et(b);a.J();return!0};a.window.adapt_command=a.w};function bq(a,b,c){if(a==b)return a?[[0,a]]:[];if(0>c||a.length<c)c=null;var d=gt(a,b),e=a.substring(0,d);a=a.substring(d);b=b.substring(d);var d=ht(a,b),f=a.substring(a.length-d);a=a.substring(0,a.length-d);b=b.substring(0,b.length-d);a=it(a,b);e&&a.unshift([0,e]);f&&a.push([0,f]);jt(a);null!=c&&(a=kt(a,c));return a}
function it(a,b){var c;if(!a)return[[1,b]];if(!b)return[[-1,a]];c=a.length>b.length?a:b;var d=a.length>b.length?b:a,e=c.indexOf(d);if(-1!=e)return c=[[1,c.substring(0,e)],[0,d],[1,c.substring(e+d.length)]],a.length>b.length&&(c[0][0]=c[2][0]=-1),c;if(1==d.length)return[[-1,a],[1,b]];var f=lt(a,b);if(f)return d=f[1],e=f[3],c=f[4],f=bq(f[0],f[2]),d=bq(d,e),f.concat([[0,c]],d);a:{c=a.length;for(var d=b.length,e=Math.ceil((c+d)/2),f=2*e,g=Array(f),h=Array(f),l=0;l<f;l++)g[l]=-1,h[l]=-1;g[e+1]=0;h[e+1]=
0;for(var l=c-d,k=!!(l%2),m=0,n=0,r=0,q=0,z=0;z<e;z++){for(var y=-z+m;y<=z-n;y+=2){var A=e+y,H;H=y==-z||y!=z&&g[A-1]<g[A+1]?g[A+1]:g[A-1]+1;for(var G=H-y;H<c&&G<d&&a.charAt(H)==b.charAt(G);)H++,G++;g[A]=H;if(H>c)n+=2;else if(G>d)m+=2;else if(k&&(A=e+l-y,0<=A&&A<f&&-1!=h[A])){var J=c-h[A];if(H>=J){c=mt(a,b,H,G);break a}}}for(y=-z+r;y<=z-q;y+=2){A=e+y;J=y==-z||y!=z&&h[A-1]<h[A+1]?h[A+1]:h[A-1]+1;for(H=J-y;J<c&&H<d&&a.charAt(c-J-1)==b.charAt(d-H-1);)J++,H++;h[A]=J;if(J>c)q+=2;else if(H>d)r+=2;else if(!k&&
(A=e+l-y,0<=A&&A<f&&-1!=g[A]&&(H=g[A],G=e+H-A,J=c-J,H>=J))){c=mt(a,b,H,G);break a}}}c=[[-1,a],[1,b]]}return c}function mt(a,b,c,d){var e=a.substring(c),f=b.substring(d);a=bq(a.substring(0,c),b.substring(0,d));e=bq(e,f);return a.concat(e)}function gt(a,b){if(!a||!b||a.charAt(0)!=b.charAt(0))return 0;for(var c=0,d=Math.min(a.length,b.length),e=d,f=0;c<e;)a.substring(f,e)==b.substring(f,e)?f=c=e:d=e,e=Math.floor((d-c)/2+c);return e}
function ht(a,b){if(!a||!b||a.charAt(a.length-1)!=b.charAt(b.length-1))return 0;for(var c=0,d=Math.min(a.length,b.length),e=d,f=0;c<e;)a.substring(a.length-e,a.length-f)==b.substring(b.length-e,b.length-f)?f=c=e:d=e,e=Math.floor((d-c)/2+c);return e}
function lt(a,b){function c(a,b,c){for(var d=a.substring(c,c+Math.floor(a.length/4)),e=-1,f="",g,h,k,l;-1!=(e=b.indexOf(d,e+1));){var m=gt(a.substring(c),b.substring(e)),J=ht(a.substring(0,c),b.substring(0,e));f.length<J+m&&(f=b.substring(e-J,e)+b.substring(e,e+m),g=a.substring(0,c-J),h=a.substring(c+m),k=b.substring(0,e-J),l=b.substring(e+m))}return 2*f.length>=a.length?[g,h,k,l,f]:null}var d=a.length>b.length?a:b,e=a.length>b.length?b:a;if(4>d.length||2*e.length<d.length)return null;var f=c(d,e,
Math.ceil(d.length/4)),d=c(d,e,Math.ceil(d.length/2)),g;if(f||d)d?g=f?f[4].length>d[4].length?f:d:d:g=f;else return null;var h;a.length>b.length?(f=g[0],d=g[1],e=g[2],h=g[3]):(e=g[0],h=g[1],f=g[2],d=g[3]);return[f,d,e,h,g[4]]}
function jt(a){a.push([0,""]);for(var b=0,c=0,d=0,e="",f="",g;b<a.length;)switch(a[b][0]){case 1:d++;f+=a[b][1];b++;break;case -1:c++;e+=a[b][1];b++;break;case 0:if(1<c+d){if(c&&d){if(g=gt(f,e))0<b-c-d&&0==a[b-c-d-1][0]?a[b-c-d-1][1]+=f.substring(0,g):(a.splice(0,0,[0,f.substring(0,g)]),b++),f=f.substring(g),e=e.substring(g);if(g=ht(f,e))a[b][1]=f.substring(f.length-g)+a[b][1],f=f.substring(0,f.length-g),e=e.substring(0,e.length-g)}c?d?a.splice(b-c-d,c+d,[-1,e],[1,f]):a.splice(b-c,c+d,[-1,e]):a.splice(b-
d,c+d,[1,f]);b=b-c-d+(c?1:0)+(d?1:0)+1}else b&&0==a[b-1][0]?(a[b-1][1]+=a[b][1],a.splice(b,1)):b++;c=d=0;f=e=""}""===a[a.length-1][1]&&a.pop();c=!1;for(b=1;b<a.length-1;)0==a[b-1][0]&&0==a[b+1][0]&&(a[b][1].substring(a[b][1].length-a[b-1][1].length)==a[b-1][1]?(a[b][1]=a[b-1][1]+a[b][1].substring(0,a[b][1].length-a[b-1][1].length),a[b+1][1]=a[b-1][1]+a[b+1][1],a.splice(b-1,1),c=!0):a[b][1].substring(0,a[b+1][1].length)==a[b+1][1]&&(a[b-1][1]+=a[b+1][1],a[b][1]=a[b][1].substring(a[b+1][1].length)+
a[b+1][1],a.splice(b+1,1),c=!0)),b++;c&&jt(a)}bq.f=1;bq.b=-1;bq.g=0;
function kt(a,b){var c;a:{var d=a;if(0===b)c=[0,d];else{var e=0;for(c=0;c<d.length;c++){var f=d[c];if(-1===f[0]||0===f[0]){var g=e+f[1].length;if(b===g){c=[c+1,d];break a}if(b<g){d=d.slice();g=b-e;e=[f[0],f[1].slice(0,g)];f=[f[0],f[1].slice(g)];d.splice(c,1,e,f);c=[c+1,d];break a}e=g}}throw Error("cursor_pos is out of bounds!");}}d=c[1];c=c[0];e=d[c];f=d[c+1];return null==e||0!==e[0]?a:null!=f&&e[1]+f[1]===f[1]+e[1]?(d.splice(c,2,f,e),nt(d,c,2)):null!=f&&0===f[1].indexOf(e[1])?(d.splice(c,2,[f[0],
e[1]],[0,e[1]]),e=f[1].slice(e[1].length),0<e.length&&d.splice(c+2,0,[f[0],e]),nt(d,c,3)):a}function nt(a,b,c){for(c=b+c-1;0<=c&&c>=b-1;c--)if(c+1<a.length){var d=a[c],e=a[c+1];d[0]===e[1]&&a.splice(c,2,[d[0],d[1]+e[1]])}return a};function aq(a){return a.reduce(function(a,c){return c[0]===bq.b?a:a+c[1]},"")}function sk(a,b,c){var d=0,e=0;a.some(function(a){for(var f=0;f<a[1].length;f++){switch(a[0]*c){case bq.f:d++;break;case bq.b:d--;e++;break;case bq.g:e++}if(e>b)return!0}return!1});return Math.max(Math.min(b,e-1)+d,0)};function ot(){}ot.prototype.Fe=function(a){return{B:a,Rc:!1,Cb:!1}};ot.prototype.Re=function(){};ot.prototype.ne=function(){};ot.prototype.tc=function(){};function pt(a,b){this.b=a;this.f=b}
function qt(a,b){var c=a.b,d=c.Fe(b),e=I("LayoutIterator");he(function(a){for(var b;d.B;){b=d.B.D?1!==d.B.D.nodeType?Zj(d.B.D,d.B.Qb)?void 0:d.B.M?void 0:c.Re(d):d.B.Da?void 0:d.B.M?c.tc(d):c.ne(d):void 0;b=(b&&b.za()?b:L(!0)).oa(function(){return d.Cb?L(null):gn(this.f,d.B,d.Rc)}.bind(this));if(b.za()){b.then(function(b){d.Cb?Q(a):(d.B=b,P(a))});return}if(d.Cb){Q(a);return}d.B=b.get()}Q(a)}.bind(a)).then(function(){O(e,d.B)});return M(e)}function rt(a){this.Zc=a}t(rt,ot);p=rt.prototype;p.Se=function(){};
p.ye=function(){};p.Fe=function(a){return{B:a,Rc:!!this.Zc&&a.M,Cb:!1,Zc:this.Zc,vc:null,Hd:!1,Ke:[],Je:null}};p.Re=function(a){a.Hd=!1};p.ne=function(a){a.Ke.push(kk(a.B));a.vc=al(a.vc,a.B.g);a.Hd=!0;return this.Se(a)};p.tc=function(a){var b;a.Hd?(b=(b=void 0,L(!0)),b=b.oa(function(){a.Cb||(a.Ke=[],a.Zc=!1,a.Rc=!1,a.vc=null);return L(!0)})):b=(b=this.ye(a))&&b.za()?b:L(!0);return b.oa(function(){a.Cb||(a.Hd=!1,a.Je=kk(a.B),a.vc=al(a.vc,a.B.F));return L(!0)})};
function st(a,b,c){this.me=[];this.b=Object.create(a);this.b.element=b;this.b.h=a.h.clone();this.b.l=!1;this.b.Ud=c.L;a=Xn(this.b,c);this.b.F-=a;var d=this;this.b.vb=function(a){return Xm.prototype.vb.call(this,a).oa(function(a){var b=kk(a);d.me.push(b);return L(a)})}}st.prototype.Gb=function(a){var b=this.b.Gb();if(a){a=b.Tc?b.Tc.b():Number.MAX_VALUE;var c=this.me[0],c=new Rm(kk(c),null,c.b,0),d=c.f(this.b,a);if(d&&c.b()<a)return{Tc:c,B:d}}return b};
function tt(a){this.u=a;this.b=this.f=null;this.A=[];this.w=[];this.C=this.F=0;this.g=this.h=!1;this.l=this.j=!0}function ut(a,b,c){b=Xj(c,b);return a.u?b.width:b.height}function vt(a){a.h=a.g=!1;a.A=[];a.w=[];a.j=!0;a.l=!0}function Sm(a){return(a.g?0:a.C)-(a.h?a.F:0)}function wt(a){a.A.forEach(function(a){a.parentNode.removeChild(a)});a.A=[]}function xt(a){a.w.forEach(function(a){a.parentNode.removeChild(a)});a.w=[]};function yt(a,b){this.g(a,"end",b)}function zt(a,b){this.g(a,"start",b)}function At(a,b,c){c||(c=this.j.now());var d=this.h[a];d||(d=this.h[a]=[]);var e;for(a=d.length-1;0<=a&&(!(e=d[a])||e[b]);a--)e=null;e||(e={},d.push(e));e[b]=c}function Bt(){}function Ct(a){this.j=a;this.h={};this.registerEndTiming=this.b=this.registerStartTiming=this.f=this.g=Bt}
Ct.prototype.l=function(){var a=this.h,b="";Object.keys(a).forEach(function(c){for(var d=a[c],e=d.length,f=0;f<e;f++){var g=d[f];b+=c;1<e&&(b+="("+f+")");b+=" => start: "+g.start+", end: "+g.end+", duration: "+(g.end-g.start)+"\n"}});u.g(b)};Ct.prototype.w=function(){this.registerEndTiming=this.b=this.registerStartTiming=this.f=this.g=Bt};Ct.prototype.A=function(){this.g=At;this.registerStartTiming=this.f=zt;this.registerEndTiming=this.b=yt};
var Dt={now:Date.now},Js,Et=Js=new Ct(window&&window.performance||Dt);At.call(Et,"load_vivliostyle","start",void 0);ba("vivliostyle.profile.profiler",Et);Ct.prototype.printTimings=Ct.prototype.l;Ct.prototype.disable=Ct.prototype.w;Ct.prototype.enable=Ct.prototype.A;function Ft(a,b,c){var d=a.B,e=d.display,f=d.parent?d.parent.display:null;return"table-row"===e&&!Gt(f)&&"table"!==f&&"inline-table"!==f||"table-cell"===e&&"table-row"!==f&&!Gt(f)&&"table"!==f&&"inline-table"!==f||d.L instanceof Ht&&d.L!==b?kn(c,d).oa(function(b){a.B=b;return L(!0)}):null}function Gt(a){return"table-row-group"===a||"table-header-group"===a||"table-footer-group"===a}function It(a,b){this.rowIndex=a;this.S=b;this.b=[]}
function Jt(a){return Math.min.apply(null,a.b.map(function(a){return a.height}))}function Kt(a,b,c){this.rowIndex=a;this.h=b;this.g=c;this.b=c.colSpan||1;this.rowSpan=c.rowSpan||1;this.height=0;this.f=null}function Lt(a,b,c){this.rowIndex=a;this.b=b;this.wc=c}function Mt(a,b,c){this.g=a;this.b=c;this.ad=new st(a,b,c);this.f=!1}Mt.prototype.Gb=function(){var a=this.b.D,b=this.b.O;"middle"!==b&&"bottom"!==b||v(a,"vertical-align","top");var c=this.ad.Gb(!0);v(a,"vertical-align",b);return c};
function Nt(a,b){this.D=a;this.b=b}function Ot(a,b,c,d){Rm.call(this,a,b,c,d);this.L=a.L;this.rowIndex=this.j=null}t(Ot,Rm);Ot.prototype.f=function(a,b){var c=Rm.prototype.f.call(this,a,b);return b<this.b()?null:Pt(this).every(function(a){return!!a.B})?c:null};Ot.prototype.b=function(){var a=Rm.prototype.b.call(this);Pt(this).forEach(function(b){a+=b.Tc.b()});return a};function Pt(a){a.j||(a.j=Qt(a).map(function(a){return a.Gb()}));return a.j}
function Qt(a){return Rt(a.L,null!=a.rowIndex?a.rowIndex:a.rowIndex=St(a.L,a.position.S)).map(a.L.de,a.L)}function Tt(a,b,c){this.rowIndex=a;this.j=b;this.L=c;this.h=null}t(Tt,Nm);Tt.prototype.f=function(a,b){if(b<this.b())return null;var c=Ut(this),d=Vt(this);return d.every(function(a){return!!a.B})&&d.some(function(a,b){var d=a.B,e=c[b].ad.me[0];return!(e.D===d.D&&e.M===d.M&&e.ia===d.ia)})?this.j:null};
Tt.prototype.b=function(){var a=this.L,b=0;Wt(a,a.f[this.rowIndex])||(b+=10);Vt(this).forEach(function(a){b+=a.Tc.b()});return b};function Vt(a){a.h||(a.h=Ut(a).map(function(a){return a.Gb()}));return a.h}Tt.prototype.g=function(){return Om(this.j)};function Ut(a){return Xt(a.L,a.rowIndex).map(a.L.de,a.L)}function Ht(a,b){this.parent=a;this.j=b;this.u=this.G=!1;this.w=-1;this.J=0;this.C=[];this.F=this.l=null;this.O=0;this.f=[];this.H=[];this.h=[];this.A=null;this.b=[];this.g=null}p=Ht.prototype;
p.re=function(){return"Table formatting context (vivliostyle.table.TableFormattingContext)"};p.He=function(a,b){if(!b)return b;switch(a.display){case "table-row":return!this.b.length;case "table-cell":return!this.b.some(function(b){return b.Zd.ma[0].node===a.S});default:return b}};p.se=function(){return this.parent};function Yt(a,b){do if(b.S===a.j)return b.D;while(b=b.parent);return null}function Zt(a,b){var c=a.H[b];c||(c=a.H[b]=[]);return c}
function St(a,b){return a.f.findIndex(function(a){return b===a.S})}function Xt(a,b){return Zt(a,b).reduce(function(a,b){return b.wc!==a[a.length-1]?a.concat(b.wc):a},[])}function Rt(a,b){return Xt(a,b).filter(function(a){return a.rowIndex+a.rowSpan-1>b})}p.de=function(a){return this.h[a.rowIndex][a.h]};function Wt(a,b){return Jt(b)>a.J/2}function $t(a){0>a.w&&(a.w=Math.max.apply(null,a.f.map(function(a){return a.b.reduce(function(a,b){return a+b.b},0)})));return a.w}
function au(a,b){a.f.forEach(function(a){a.b.forEach(function(a){var c=Xj(b,a.g);a.g=null;a.height=this.u?c.width:c.height},this)},a)}p.dc=function(){return this.g};function bu(a,b){this.L=a;this.h=b;this.rowIndex=-1;this.f=0;this.g=!1}t(bu,ot);
bu.prototype.ne=function(a){var b=this.L,c=Ft(a,b,this.h);if(c)return c;a=a.B;switch(a.display){case "table":b.O=a.Y;break;case "table-caption":b.C.push(new Nt(a.D,a.X));break;case "table-header-group":this.b=!0;b=b.g;b.f||(b.f=a.D);break;case "table-footer-group":this.b=!0;b=b.g;b.b||(b.b=a.D);break;case "table-row":this.b||(this.g=!0,this.rowIndex++,this.f=0,b.f[this.rowIndex]=new It(this.rowIndex,a.S))}return L(!0)};
bu.prototype.tc=function(a){var b=this.L,c=a.B,d=c.display,e=this.h.b;if(c.S===b.j)c=qn(e,Yt(b,c)),b.J=parseFloat(c[b.u?"height":"width"]),a.Cb=!0;else switch(d){case "table-header-group":case "table-footer-group":this.b=!1;break;case "table-row":this.b||(b.A=c.D,this.g=!1);break;case "table-cell":if(!this.b){this.g||(this.rowIndex++,this.f=0,this.g=!0);a=this.rowIndex;c=new Kt(this.rowIndex,this.f,c.D);d=b.f[a];d||(b.f[a]=new It(a,null),d=b.f[a]);d.b.push(c);for(var d=a+c.rowSpan,e=Zt(b,a),f=0;e[f];)f++;
for(;a<d;a++)for(var e=Zt(b,a),g=f;g<f+c.b;g++){var h=e[g]=new Lt(a,g,c);c.f||(c.f=h)}this.f++}}};function cu(a,b){this.Zc=!0;this.L=a;this.f=b;this.l=!1;this.b=-1;this.g=0;this.w=b.l;b.l=!1}t(cu,rt);var du={"table-caption":!0,"table-column-group":!0,"table-column":!0,"table-header-group":!0,"table-footer-group":!0};
function eu(a,b,c,d){var e=b.rowIndex,f=b.h,g=c.D;if(1<b.b){v(g,"box-sizing","border-box");for(var h=a.L.F,l=0,k=0;k<b.b;k++)l+=h[b.f.b+k];l+=a.L.O*(b.b-1);v(g,a.L.u?"height":"width",l+"px")}b=g.ownerDocument.createElement("div");g.appendChild(b);c=new Mt(a.f,b,c);a=a.L;(g=a.h[e])||(g=a.h[e]=[]);g[f]=c;1===d.Ba.ma.length&&d.Ba.M&&(c.f=!0);return zn(c.ad.b,d,!0).md(!0)}function fu(a,b){var c=a.L.b[0];return c?c.wc.f.b===b:!1}
function gu(a){var b=a.L.b;if(!b.length)return[];var c=[],d=0;do{var e=b[d],f=e.wc.rowIndex;if(f<a.b){var g=c[f];g||(g=c[f]=[]);g.push(e);b.splice(d,1)}else d++}while(d<b.length);return c}
function hu(a,b){var c=a.L,d=gu(a),e=d.reduce(function(a){return a+1},0);if(0===e)return L(!0);var f=a.f.h,g=b.B;g.D.parentNode.removeChild(g.D);var h=I("layoutRowSpanningCellsFromPreviousFragment"),l=L(!0),k=0,m=[];d.forEach(function(a){l=l.oa(function(){var b=ik(a[0].Zd.ma[1],g.parent);return an(f,b,!1).oa(function(){function d(a){for(;h<a;){if(!(0<=m.indexOf(h))){var c=b.D.ownerDocument.createElement("td");v(c,"padding","0");b.D.appendChild(c)}h++}}var g=L(!0),h=0;a.forEach(function(a){g=g.oa(function(){var c=
a.wc;d(c.f.b);var g=a.Zd,l=ik(g.ma[0],b);l.ia=g.ia;l.M=g.M;return an(f,l,!1).oa(function(){for(var b=a.ue,d=0;d<c.b;d++)m.push(h+d);h+=c.b;return eu(this,c,l,b).oa(function(){l.D.rowSpan=c.rowIndex+c.rowSpan-this.b+e-k;return L(!0)}.bind(this))}.bind(this))}.bind(this))},this);return g.oa(function(){d($t(c));k++;return L(!0)})}.bind(this))}.bind(this))},a);l.then(function(){an(f,g,!0,b.Rc).then(function(){O(h,!0)})});return M(h)}
function iu(a,b){if(a.j||a.h)return L(!0);var c=b.B,d=a.L;0>a.b?a.b=St(d,c.S):a.b++;a.g=0;a.l=!0;return hu(a,b).oa(function(){bo(this.f,b.Je,null,!0,b.vc)&&!Rt(d,this.b-1).length&&(this.f.l=this.w,c.b=!0,b.Cb=!0);return L(!0)}.bind(a))}
function ju(a,b){if(a.j||a.h)return L(!0);var c=b.B;a.l||(0>a.b?a.b=0:a.b++,a.g=0,a.l=!0);var d=a.L.f[a.b].b[a.g],e=kk(c).modify();e.M=!0;b.B=e;var f=I("startTableCell");fu(a,d.f.b)?(e=a.L.b.shift(),e=L(e.ue)):e=gn(a.f.h,c,b.Rc).oa(function(a){a.D&&c.D.removeChild(a.D);return L(new vk(gk(a)))});e.then(function(a){eu(this,d,c,a).then(function(){this.tc(b);this.g++;O(f,!0)}.bind(this))}.bind(a));return M(f)}
cu.prototype.Se=function(a){var b=Ft(a,this.L,this.f);if(b)return b;b=a.B.display;return"table-header-group"===b?(this.j=!0,L(!0)):"table-footer-group"===b?(this.h=!0,L(!0)):"table-row"===b?iu(this,a):"table-cell"===b?ju(this,a):L(!0)};cu.prototype.ye=function(a){a=a.B;"table-row"===a.display&&(this.l=!1,this.j||this.h||(a=kk(a).modify(),a.M=!1,this.f.C.push(new Tt(this.b,a,this.L))));return L(!0)};
cu.prototype.tc=function(a){var b=a.B,c=b.display;"table-header-group"===c?this.j=!1:"table-footer-group"===c&&(this.h=!1);if(c&&du[c])b.D.parentNode.removeChild(b.D);else if(b.S===this.L.j)this.f.l=this.w,a.Cb=!0;else return rt.prototype.tc.call(this,a);return L(!0)};function ku(){}
function lu(a,b,c,d){for(var e=a.ownerDocument,f=e.createElement("tr"),g=[],h=0;h<b;h++){var l=e.createElement("td");f.appendChild(l);g.push(l)}a.parentNode.insertBefore(f,a.nextSibling);b=g.map(function(a){a=Xj(d,a);return c?a.height:a.width});a.parentNode.removeChild(f);return b}function mu(a){var b=[];for(a=a.firstElementChild;a;)"colgroup"===a.localName&&b.push(a),a=a.nextElementSibling;return b}
function nu(a){var b=[];a.forEach(function(a){var c=a.span;a.removeAttribute("span");for(var e=a.firstElementChild;e;){if("col"===e.localName){var f=e.span;e.removeAttribute("span");for(c-=f;1<f--;){var g=e.cloneNode(!0);a.insertBefore(g,e);b.push(g)}b.push(e)}e=e.nextElementSibling}for(;0<c--;)e=a.ownerDocument.createElement("col"),a.appendChild(e),b.push(e)});return b}
function ou(a,b,c,d){if(a.length<c){var e=d.ownerDocument.createElement("colgroup");b.push(e);for(b=a.length;b<c;b++){var f=d.ownerDocument.createElement("col");e.appendChild(f);a.push(f)}}}function pu(a,b,c){var d=a.u,e=a.A;if(e){a.A=null;var f=e.ownerDocument.createDocumentFragment(),g=$t(a);if(0<g){var h=a.F=lu(e,g,d,c.b);c=mu(b);e=nu(c);ou(e,c,g,b);e.forEach(function(a,b){v(a,d?"height":"width",h[b]+"px")});c.forEach(function(a){f.appendChild(a.cloneNode(!0))})}a.l=f}}
function qu(a,b,c){var d=b.L;d.u=b.u;d.g=new tt(d.u);var e=I("TableLayoutProcessor.doInitialLayout");qt(new pt(new bu(b.L,c),c.h),b).then(function(a){var b=a.D,f=Xj(c.b,b);Tm(c,c.u?f.left:f.bottom)?(pu(d,b,c),au(d,c.b),a=d.g,b=c.b,a.f&&(a.F=ut(a,a.f,b)),a.b&&(a.C=ut(a,a.b,b)),O(e,null)):O(e,a)}.bind(a));return M(e)}function ru(a,b,c){var d=a.C;d.forEach(function(a,f){a&&(b.insertBefore(a.D,c),"top"===a.b&&(d[f]=null))})}
function su(a,b){if(a.l&&b){var c=mu(b);c&&c.forEach(function(a){b.removeChild(a)})}}ku.prototype.f=function(a,b){var c=a.L,d=I("TableLayoutProcessor.layout"),e=tu(a,c),f=kk(a),g=[].concat(c.b),h=[].concat(b.C);e.g(this,a,b).then(function(l){var k=e.f(l,c,b);e.b(l,c,k);if(k)O(d,l);else{for(l=f.D||f.parent.D;k=l.lastChild;)l.removeChild(k);for(;k=l.nextSibling;)k.parentNode.removeChild(k);su(c,Yt(c,f));b.C=h;c.h=[];c.b=g;this.f(a,b).Fa(d)}}.bind(this));return M(d)};
ku.prototype.g=function(a,b,c,d){return new Ot(a,b,c,d)};
ku.prototype.b=function(a,b){var c=b.L,d=c.g;d.j||b.S===c.j&&b.M||xt(d);if("table-row"===b.display){var e=St(c,b.S);c.b=[];var f;f=b.M?Rt(c,e):Xt(c,e);if(f.length){var g=I("TableLayoutProcessor.finishBreak"),h=0;he(function(a){if(h===f.length)Q(a);else{var b=f[h++],d=c.de(b),g=d.Gb().B,l=d.b,q=rk(l),z=new vk(rk(g));c.b.push({Zd:q,ue:z,wc:b});l=l.D;jo(d.b);e<b.rowIndex+b.rowSpan-1&&(l.rowSpan=e-b.rowIndex+1);d.f?P(a):Rn(d.ad.b,g,!1,!0).then(function(){var b=c.dc();if(b){var e=c.u,f=d.g,g=d.ad.b.element,
h=d.b.D,k=Xj(f.b,h),h=rn(f,h);e?v(g,"max-width",k.right-f.F-Sm(b)-h.right+"px"):v(g,"max-height",f.F-Sm(b)-k.top-h.top+"px");v(g,"overflow","hidden")}P(a)})}}).then(function(){d&&vt(d);c.h=[];go(b,!1);jo(b);O(g,!0)});return M(g)}}d&&vt(d);c.h=[];return null};function tu(a,b){if(b.G){var c=b.dc();a.S===b.j&&!a.M&&c&&(c.h=!1,c.l=!1);return new uu}return new vu}function vu(){}vu.prototype.g=function(a,b,c){return qu(a,b,c)};vu.prototype.f=function(a){return!!a};vu.prototype.b=function(a,b){b.G=!0};
function uu(){}uu.prototype.g=function(a,b,c){a=b.L;var d=a.g,e=Yt(a,b),f=e.firstChild;ru(a,e,f);a.l&&e.insertBefore(a.l.cloneNode(!0),f);if(d.f&&!d.h){var g=d.f.cloneNode(!0);d.A.push(g);e.insertBefore(g,f)}d.b&&!d.g&&(g=d.b.cloneNode(!0),d.w.push(g),e.insertBefore(g,f));a=new cu(a,c);c=new pt(a,c.h);a=I("TableFormattingContext.doLayout");qt(c,b).Fa(a);return M(a)};
uu.prototype.f=function(a,b,c){var d=b.dc();if(!d)return!0;c=c.Gb();return a.S===b.j&&a.M&&d.g?(d.g=!1,d.j=!1):!d.g&&d.j&&d.b||!d.h&&d.l&&d.f?!!c.B&&!c.B.b:!0};uu.prototype.b=function(a,b,c){(a=b.dc())&&!c&&(wt(a),xt(a),!a.g&&a.j&&a.b?a.g=!0:!a.h&&a.l&&a.f&&(a.h=!0))};var wu=new ku;Kd("RESOLVE_FORMATTING_CONTEXT",function(a,b,c){return b?c===td?(b=a.parent,new Ht(b?b.L:null,a.S)):null:null});Kd("RESOLVE_LAYOUT_PROCESSOR",function(a){return a instanceof Ht?wu:null});Array.from||(Array.from=function(a,b,c){b&&c&&(b=b.bind(c));c=[];for(var d=a.length,e=0;e<d;e++)c[e]=b?b(a[e],e):a[e];return c});
Array.prototype.findIndex||Object.defineProperty(Array.prototype,"findIndex",{value:function(a,b){if(null==this)throw new TypeError("Array.prototype.findIndex called on null or undefined");if("function"!==typeof a)throw new TypeError("predicate must be a function");for(var c=Object(this),d=c.length>>>0,e,f=0;f<d;f++)if(e=c[f],a.call(b,e,f,c))return f;return-1},enumerable:!1,configurable:!1,writable:!1});
Object.assign||(Object.assign=function(a,b){if(!b)return a;Object.keys(b).forEach(function(c){a[c]=b[c]});return a});function xu(a){function b(a){return"number"===typeof a?a:null}function c(a){return"string"===typeof a?{url:a,gb:null,Xb:null}:{url:a.url,gb:b(a.startPage),Xb:b(a.skipPagesBefore)}}return Array.isArray(a)?a.map(c):a?[c(a)]:null}function yu(a){var b={};Object.keys(a).forEach(function(c){var d=a[c];switch(c){case "autoResize":b.autoresize=d;break;case "pageBorderWidth":b.pageBorder=d;break;default:b[c]=d}});return b}
function zu(a,b){mj=a.debug;this.g=!1;this.h=a;this.Rb=new Fs(a.window||window,a.viewportElement,"main",this.Ye.bind(this));this.f={autoResize:!0,fontSize:16,pageBorderWidth:1,renderAllPages:!0,pageViewMode:"autoSpread",zoom:1,fitToScreen:!1};b&&this.Qe(b);this.b=new Ta;Object.defineProperty(this,"readyState",{get:function(){return this.Rb.A}})}p=zu.prototype;p.Qe=function(a){var b=Object.assign({a:"configure"},yu(a));this.Rb.w(b);Object.assign(this.f,a)};
p.Ye=function(a){var b={type:a.t};Object.keys(a).forEach(function(c){"t"!==c&&(b[c]=a[c])});Ua(this.b,b)};p.pf=function(a,b){this.b.addEventListener(a,b,!1)};p.sf=function(a,b){this.b.removeEventListener(a,b,!1)};p.cf=function(a,b,c){a||Ua(this.b,{type:"error",content:"No URL specified"});Au(this,a,null,b,c)};p.qf=function(a,b,c){a||Ua(this.b,{type:"error",content:"No URL specified"});Au(this,null,a,b,c)};
function Au(a,b,c,d,e){function f(a){if(a)return a.map(function(a){return{url:a.url||null,text:a.text||null}})}d=d||{};var g=f(d.authorStyleSheet),h=f(d.userStyleSheet);e&&Object.assign(a.f,e);b=Object.assign({a:b?"loadXML":"loadEPUB",userAgentRootURL:a.h.userAgentRootURL,url:xu(b)||c,document:d.documentObject,fragment:d.fragment,authorStyleSheet:g,userStyleSheet:h},yu(a.f));a.g?a.Rb.w(b):(a.g=!0,ft(a.Rb,b))}p.Hb=function(){return this.Rb.Hb()};
p.ef=function(a){a:switch(a){case "left":a="ltr"===this.Hb()?"previous":"next";break a;case "right":a="ltr"===this.Hb()?"next":"previous"}this.Rb.w({a:"moveTo",where:a})};p.df=function(a){this.Rb.w({a:"moveTo",url:a})};p.rf=function(a){a:{var b=this.Rb;if(!b.g)throw Error("no page exists.");switch(a){case "fit inside viewport":a=at(b,b.aa.ob?$s(b,b.j):b.g.f);break a;default:throw Error("unknown zoom type: "+a);}}return a};ba("vivliostyle.viewer.Viewer",zu);zu.prototype.setOptions=zu.prototype.Qe;
zu.prototype.addListener=zu.prototype.pf;zu.prototype.removeListener=zu.prototype.sf;zu.prototype.loadDocument=zu.prototype.cf;zu.prototype.loadEPUB=zu.prototype.qf;zu.prototype.getCurrentPageProgression=zu.prototype.Hb;zu.prototype.navigateToPage=zu.prototype.ef;zu.prototype.navigateToInternalUrl=zu.prototype.df;zu.prototype.queryZoomFactor=zu.prototype.rf;ba("vivliostyle.viewer.ZoomType",bt);bt.FIT_INSIDE_VIEWPORT="fit inside viewport";ba("vivliostyle.viewer.PageViewMode",Es);Es.SINGLE_PAGE="singlePage";
Es.SPREAD="spread";Es.AUTO_SPREAD="autoSpread";At.call(Js,"load_vivliostyle","end",void 0);var Bu=16,Cu="ltr";function Du(a){window.adapt_command(a)}function Eu(){Du({a:"moveTo",where:"ltr"===Cu?"previous":"next"})}function Fu(){Du({a:"moveTo",where:"ltr"===Cu?"next":"previous"})}
function Gu(a){var b=a.key,c=a.keyIdentifier,d=a.location;if("End"===b||"End"===c)Du({a:"moveTo",where:"last"}),a.preventDefault();else if("Home"===b||"Home"===c)Du({a:"moveTo",where:"first"}),a.preventDefault();else if("ArrowUp"===b||"Up"===b||"Up"===c)Du({a:"moveTo",where:"previous"}),a.preventDefault();else if("ArrowDown"===b||"Down"===b||"Down"===c)Du({a:"moveTo",where:"next"}),a.preventDefault();else if("ArrowRight"===b||"Right"===b||"Right"===c)Fu(),a.preventDefault();else if("ArrowLeft"===
b||"Left"===b||"Left"===c)Eu(),a.preventDefault();else if("0"===b||"U+0030"===c)Du({a:"configure",fontSize:Math.round(Bu)}),a.preventDefault();else if("t"===b||"U+0054"===c)Du({a:"toc",v:"toggle",autohide:!0}),a.preventDefault();else if("+"===b||"Add"===b||"U+002B"===c||"U+00BB"===c||"U+004B"===c&&d===KeyboardEvent.b)Bu*=1.2,Du({a:"configure",fontSize:Math.round(Bu)}),a.preventDefault();else if("-"===b||"Subtract"===b||"U+002D"===c||"U+00BD"===c||"U+004D"===c&&d===KeyboardEvent.b)Bu/=1.2,Du({a:"configure",
fontSize:Math.round(Bu)}),a.preventDefault()}
function Hu(a){switch(a.t){case "loaded":a=a.viewer;var b=Cu=a.Hb();a.od.setAttribute("data-vivliostyle-page-progression",b);a.od.setAttribute("data-vivliostyle-spread-view",a.aa.ob);window.addEventListener("keydown",Gu,!1);document.body.setAttribute("data-vivliostyle-viewer-status","complete");a=document.getElementById("vivliostyle-page-navigation-left");a.addEventListener("click",Eu,!1);b=document.getElementById("vivliostyle-page-navigation-right");b.addEventListener("click",Fu,!1);[a,b].forEach(function(a){a.setAttribute("data-vivliostyle-ui-state",
"attention");window.setTimeout(function(){a.removeAttribute("data-vivliostyle-ui-state")},1E3)});break;case "nav":(a=a.cfi)&&location.replace(ra(location.href,Ha(a||"")));break;case "hyperlink":a.internal&&Du({a:"moveTo",url:a.href})}}
ba("vivliostyle.viewerapp.main",function(a){var b=a&&a.fragment||pa("f"),c=a&&a.epubURL||pa("b"),d=a&&a.xmlURL||pa("x"),e=a&&a.defaultPageWidth||pa("w"),f=a&&a.defaultPageHeight||pa("h"),g=a&&a.defaultPageSize||pa("size"),h=a&&a.orientation||pa("orientation"),l=pa("spread"),l=a&&a.spreadView||!!l&&"false"!=l,k=a&&a.viewportElement||document.body;a={a:c?"loadEPUB":"loadXML",url:c||d,autoresize:!0,fragment:b,renderAllPages:!0,userAgentRootURL:a&&a.uaRoot||null,document:a&&a.document||null,userStyleSheet:a&&
a.userStyleSheet||null,spreadView:l,pageBorder:1};var m;if(e&&f)m=e+" "+f;else{switch(g){case "A5":e="148mm";f="210mm";break;case "A4":e="210mm";f="297mm";break;case "A3":e="297mm";f="420mm";break;case "B5":e="176mm";f="250mm";break;case "B4":e="250mm";f="353mm";break;case "letter":e="8.5in";f="11in";break;case "legal":e="8.5in";f="14in";break;case "ledger":e="11in",f="17in"}e&&f&&(m=g,"landscape"===h&&(m=m?m+" landscape":null,g=e,e=f,f=g))}e&&f&&(a.viewport={width:e,height:f},g=document.createElement("style"),
g.textContent="@page { size: "+m+"; margin: 0; }",document.head.appendChild(g));ft(new Fs(window,k,"main",Hu),a)});
    return enclosingObject.vivliostyle;
}.bind(window));


},{}],3:[function(require,module,exports){
/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
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
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
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
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
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
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
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
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
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
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
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
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
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
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
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
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
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
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
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
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
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
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
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
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
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
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
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
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
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
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
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
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
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
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
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
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
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
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
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
