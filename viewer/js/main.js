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
 * Vivliostyle core 2016.10.1-pre.20161215081547
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
function t(a,b){function c(){}c.prototype=b.prototype;a.ye=b.prototype;a.prototype=new c;a.prototype.constructor=a;a.rf=function(a,c,f){for(var d=Array(arguments.length-2),e=2;e<arguments.length;e++)d[e-2]=arguments[e];return b.prototype[c].apply(a,d)}};function ca(a){var b=a.error,c=b&&(b.frameTrace||b.stack);a=[].concat(a.messages);b&&(0<a.length&&(a=a.concat(["\n"])),a=a.concat([b.toString()]),c&&(a=a.concat(["\n"]).concat(c)));return a}function da(a){a=Array.from(a);var b=null;a[0]instanceof Error&&(b=a.shift());return{error:b,messages:a}}function ea(a){function b(a){return function(b){return a.apply(c,b)}}var c=a||console;this.h=b(c.debug||c.log);this.l=b(c.info||c.log);this.u=b(c.warn||c.log);this.j=b(c.error||c.log);this.f={}}
function fa(a,b,c){(a=a.f[b])&&a.forEach(function(a){a(c)})}function ha(a,b){var c=u,d=c.f[a];d||(d=c.f[a]=[]);d.push(b)}ea.prototype.debug=function(a){var b=da(arguments);this.h(ca(b));fa(this,1,b)};ea.prototype.g=function(a){var b=da(arguments);this.l(ca(b));fa(this,2,b)};ea.prototype.b=function(a){var b=da(arguments);this.u(ca(b));fa(this,3,b)};ea.prototype.error=function(a){var b=da(arguments);this.j(ca(b));fa(this,4,b)};var u=new ea;function ia(a){var b=a.match(/^([^#]*)/);return b?b[1]:a}var ja=window.location.href,ka=window.location.href;
function la(a,b){if(!b||a.match(/^\w{2,}:/))return a.toLowerCase().match("^javascript:")?"#":a;b.match(/^\w{2,}:\/\/[^\/]+$/)&&(b+="/");var c;if(a.match(/^\/\//))return(c=b.match(/^(\w{2,}:)\/\//))?c[1]+a:a;if(a.match(/^\//))return(c=b.match(/^(\w{2,}:\/\/[^\/]+)\//))?c[1]+a:a;a.match(/^\.(\/|$)/)&&(a=a.substr(1));c=b;var d=c.match(/^([^#?]*)/);b=d?d[1]:c;if(a.match(/^\#/))return b+a;c=b.lastIndexOf("/");if(0>c)return a;for(d=b.substr(0,c+1)+a;;){c=d.indexOf("/../");if(0>=c)break;var e=d.lastIndexOf("/",
c-1);if(0>=e)break;d=d.substr(0,e)+d.substr(c+3)}return d.replace(/\/(\.\/)+/g,"/")}function ma(a){a=new RegExp("#(.*&)?"+oa(a)+"=([^#&]*)");return(a=window.location.href.match(a))?a[2]:null}function pa(a,b){var c=new RegExp("#(.*&)?"+oa("f")+"=([^#&]*)"),d=a.match(c);return d?(c=d[2].length,d=d.index+d[0].length-c,a.substr(0,d)+b+a.substr(d+c)):a.match(/#/)?a+"&f="+b:a+"#f="+b}function qa(a){return null==a?a:a.toString()}function ra(){this.b=[null]}
ra.prototype.length=function(){return this.b.length-1};function sa(a,b){a&&(b="-"+b,a=a.replace(/-/g,""),"moz"===a&&(a="Moz"));return a+b.replace(/-[a-z]/g,function(a){return a.substr(1).toUpperCase()})}var ta=" -webkit- -moz- -ms- -o- -epub-".split(" "),ua={};
function va(a,b){if("writing-mode"===b){var c=document.createElement("span");if("-ms-"===a)return c.style.setProperty(a+b,"tb-rl"),"tb-rl"===c.style["writing-mode"];c.style.setProperty(a+b,"vertical-rl");return"vertical-rl"===c.style[a+b]}return"string"===typeof document.documentElement.style[sa(a,b)]}
function wa(a){var b=ua[a];if(b||null===b)return b;switch(a){case "writing-mode":if(va("-ms-","writing-mode"))return ua[a]=["-ms-writing-mode"],["-ms-writing-mode"];break;case "filter":if(va("-webkit-","filter"))return ua[a]=["-webkit-filter"],["-webkit-filter"];break;case "clip-path":if(va("-webkit-","clip-path"))return ua[a]=["-webkit-clip-path","clip-path"]}for(b=0;b<ta.length;b++){var c=ta[b];if(va(c,a))return b=c+a,ua[a]=[b],[b]}u.b("Property not supported by the browser: ",a);return ua[a]=null}
function v(a,b,c){try{var d=wa(b);d&&d.forEach(function(b){if("-ms-writing-mode"===b)switch(c){case "horizontal-tb":c="lr-tb";break;case "vertical-rl":c="tb-rl";break;case "vertical-lr":c="tb-lr"}a&&a.style&&a.style.setProperty(b,c)})}catch(e){u.b(e)}}function xa(a,b,c){try{var d=ua[b];return a.style.getPropertyValue(d?d[0]:b)}catch(e){}return c||""}
function za(a){var b=a.getAttributeNS("http://www.w3.org/XML/1998/namespace","lang");b||"http://www.w3.org/1999/xhtml"!=a.namespaceURI||(b=a.getAttribute("lang"));return b}function Aa(){this.b=[]}Aa.prototype.append=function(a){this.b.push(a);return this};Aa.prototype.toString=function(){var a=this.b.join("");this.b=[a];return a};function Ba(a){return"\\"+a.charCodeAt(0).toString(16)+" "}function Ca(a){return a.replace(/[^-_a-zA-Z0-9\u0080-\uFFFF]/g,Ba)}
function Da(a){return a.replace(/[\u0000-\u001F"]/g,Ba)}function Ea(a){return a.replace(/[\s+&?=#\u007F-\uFFFF]+/g,encodeURIComponent)}function Fa(a){return!!a.match(/^[a-zA-Z\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]$/)}function oa(a,b){return a.replace(/[^-a-zA-Z0-9_]/g,function(a){return("string"===typeof b?b:"\\u")+(65536|a.charCodeAt(0)).toString(16).substr(1)})}
function Ga(a){var b=":",b="string"===typeof b?b:"\\u",c=new RegExp(oa(b)+"[0-9a-fA-F]{4}","g");return a.replace(c,function(a){var c=b,c="string"===typeof c?c:"\\u";return a.indexOf(c)?a:String.fromCharCode(parseInt(a.substring(c.length),16))})}function Ha(a){if(!a)throw"Assert failed";}function Ia(a,b){for(var c=0,d=a;;){Ha(c<=d);Ha(!c||!b(c-1));Ha(d==a||b(d));if(c==d)return c;var e=c+d>>1;b(e)?d=e:c=e+1}}function Ja(a,b){return a-b}
function Ka(a,b){for(var c={},d=0;d<a.length;d++){var e=a[d],f=b(e);f&&!c[f]&&(c[f]=e)}return c}var Ma={};function Na(a,b){for(var c={},d=0;d<a.length;d++){var e=a[d],f=b(e);f&&(c[f]?c[f].push(e):c[f]=[e])}return c}function Oa(a,b){for(var c=Array(a.length),d=0;d<a.length;d++)c[d]=b(a[d],d);return c}function Pa(a,b){var c={},d;for(d in a)c[d]=b(a[d],d);return c}function Qa(){this.h={}}function Ra(a,b){var c=a.h[b.type];if(c){b.target=a;b.currentTarget=a;for(var d=0;d<c.length;d++)c[d](b)}}
Qa.prototype.addEventListener=function(a,b,c){c||((c=this.h[a])?c.push(b):this.h[a]=[b])};Qa.prototype.removeEventListener=function(a,b,c){!c&&(a=this.h[a])&&(b=a.indexOf(b),0<=b&&a.splice(b,1))};var Sa=null,Ta=null;function Ua(a){return 1==a.nodeType&&(a=a.getAttribute("id"))&&a.match(/^[-a-zA-Z_0-9.\u007F-\uFFFF]+$/)?a:null}function Va(a){return"^"+a}function Wa(a){return a.substr(1)}function Xa(a){return a?a.replace(/\^[\[\]\(\),=;^]/g,Wa):a}
function Ya(a){for(var b={};a;){var c=a.match(/^;([^;=]+)=(([^;]|\^;)*)/);if(!c)break;var d=c[1],e;a:{e=c[2];var f=[];do{var g=e.match(/^(\^,|[^,])*/),h=Xa(g[0]);e=e.substr(g[0].length+1);if(!e&&!f.length){e=h;break a}f.push(h)}while(e);e=f}b[d]=e;a=a.substr(c[0].length)}return b}function Za(){}Za.prototype.g=function(a){a.append("!")};Za.prototype.h=function(){return!1};function $a(a,b,c){this.index=a;this.id=b;this.ib=c}
$a.prototype.g=function(a){a.append("/");a.append(this.index.toString());if(this.id||this.ib)a.append("["),this.id&&a.append(this.id),this.ib&&(a.append(";s="),a.append(this.ib)),a.append("]")};
$a.prototype.h=function(a){if(1!=a.node.nodeType)throw Error("E_CFI_NOT_ELEMENT");var b=a.node,c=b.children,d=c.length,e=Math.floor(this.index/2)-1;0>e||!d?(c=b.firstChild,a.node=c||b):(c=c[Math.min(e,d-1)],this.index&1&&((b=c.nextSibling)&&1!=b.nodeType?c=b:a.K=!0),a.node=c);if(this.id&&(a.K||this.id!=Ua(a.node)))throw Error("E_CFI_ID_MISMATCH");a.ib=this.ib;return!0};function ab(a,b,c,d){this.offset=a;this.f=b;this.b=c;this.ib=d}
ab.prototype.h=function(a){if(0<this.offset&&!a.K){for(var b=this.offset,c=a.node;;){var d=c.nodeType;if(1==d)break;var e=c.nextSibling;if(3<=d&&5>=d){d=c.textContent.length;if(b<=d)break;if(!e){b=d;break}b-=d}if(!e){b=0;break}c=e}a.node=c;a.offset=b}a.ib=this.ib;return!0};
ab.prototype.g=function(a){a.append(":");a.append(this.offset.toString());if(this.f||this.b||this.ib){a.append("[");if(this.f||this.b)this.f&&a.append(this.f.replace(/[\[\]\(\),=;^]/g,Va)),a.append(","),this.b&&a.append(this.b.replace(/[\[\]\(\),=;^]/g,Va));this.ib&&(a.append(";s="),a.append(this.ib));a.append("]")}};function bb(){this.ja=null}
function cb(a,b){var c=b.match(/^#?epubcfi\((.*)\)$/);if(!c)throw Error("E_CFI_NOT_CFI");for(var d=c[1],e=0,f=[];;)switch(d.charAt(e)){case "/":e++;c=d.substr(e).match(/^(0|[1-9][0-9]*)(\[([-a-zA-Z_0-9.\u007F-\uFFFF]+)(;([^\]]|\^\])*)?\])?/);if(!c)throw Error("E_CFI_NUMBER_EXPECTED");var e=e+c[0].length,g=parseInt(c[1],10),h=c[3],c=Ya(c[4]);f.push(new $a(g,h,qa(c.s)));break;case ":":e++;c=d.substr(e).match(/^(0|[1-9][0-9]*)(\[((([^\];,]|\^[\];,])*)(,(([^\];,]|\^[\];,])*))?)(;([^]]|\^\])*)?\])?/);
if(!c)throw Error("E_CFI_NUMBER_EXPECTED");e+=c[0].length;g=parseInt(c[1],10);(h=c[4])&&(h=Xa(h));var l=c[7];l&&(l=Xa(l));c=Ya(c[10]);f.push(new ab(g,h,l,qa(c.s)));break;case "!":e++;f.push(new Za);break;case "~":case "@":case "":a.ja=f;return;default:throw Error("E_CFI_PARSE_ERROR");}}function db(a,b){for(var c={node:b.documentElement,offset:0,K:!1,ib:null,vc:null},d=0;d<a.ja.length;d++)if(!a.ja[d].h(c)){++d<a.ja.length&&(c.vc=new bb,c.vc.ja=a.ja.slice(d));break}return c}
bb.prototype.trim=function(a,b){return a.replace(/\s+/g," ").match(b?/^[ -\uD7FF\uE000-\uFFFF]{0,8}/:/[ -\uD7FF\uE000-\uFFFF]{0,8}$/)[0].replace(/^\s/,"").replace(/\s$/,"")};
function eb(a,b,c){for(var d=!1,e=null,f=[],g=b.parentNode,h="",l="";b;){switch(b.nodeType){case 3:case 4:case 5:var k=b.textContent,m=k.length;d?(c+=m,h||(h=k)):(c>m&&(c=m),d=!0,h=k.substr(0,c),l=k.substr(c));b=b.previousSibling;continue;case 8:b=b.previousSibling;continue}break}if(0<c||h||l)h=a.trim(h,!1),l=a.trim(l,!0),f.push(new ab(c,h,l,e)),e=null;for(;g&&g&&9!=g.nodeType;){c=d?null:Ua(b);for(d=d?1:0;b;)1==b.nodeType&&(d+=2),b=b.previousSibling;f.push(new $a(d,c,e));e=null;b=g;g=g.parentNode;
d=!1}f.reverse();a.ja?(f.push(new Za),a.ja=f.concat(a.ja)):a.ja=f}bb.prototype.toString=function(){if(!this.ja)return"";var a=new Aa;a.append("epubcfi(");for(var b=0;b<this.ja.length;b++)this.ja[b].g(a);a.append(")");return a.toString()};function fb(){return{fontFamily:"serif",lineHeight:1.25,margin:8,pd:!0,kd:25,od:!1,wd:!1,jb:!1,ac:1,Pd:{print:!0}}}function gb(a){return{fontFamily:a.fontFamily,lineHeight:a.lineHeight,margin:a.margin,pd:a.pd,kd:a.kd,od:a.od,wd:a.wd,jb:a.jb,ac:a.ac,Pd:Object.assign({},a.Pd)}}var hb=fb(),kb={};function lb(a,b,c,d){a=Math.min((a-0)/c,(b-0)/d);return"matrix("+a+",0,0,"+a+",0,0)"}function mb(a){return'"'+Da(a+"")+'"'}function nb(a){return Ca(a+"")}function ob(a,b){return a?Ca(a)+"."+Ca(b):Ca(b)}
var pb=0;
function qb(a,b){this.parent=a;this.u="S"+pb++;this.w=[];this.b=new rb(this,0);this.f=new rb(this,1);this.j=new rb(this,!0);this.h=new rb(this,!1);a&&a.w.push(this);this.values={};this.D={};this.B={};this.l=b;if(!a){var c=this.B;c.floor=Math.floor;c.ceil=Math.ceil;c.round=Math.round;c.sqrt=Math.sqrt;c.min=Math.min;c.max=Math.max;c.letterbox=lb;c["css-string"]=mb;c["css-name"]=nb;c["typeof"]=function(a){return typeof a};sb(this,"page-width",function(){return this.Bb()});sb(this,"page-height",function(){return this.Ab()});
sb(this,"pref-font-family",function(){return this.Z.fontFamily});sb(this,"pref-night-mode",function(){return this.Z.wd});sb(this,"pref-hyphenate",function(){return this.Z.pd});sb(this,"pref-margin",function(){return this.Z.margin});sb(this,"pref-line-height",function(){return this.Z.lineHeight});sb(this,"pref-column-width",function(){return this.Z.kd*this.fontSize});sb(this,"pref-horizontal",function(){return this.Z.od});sb(this,"pref-spread-view",function(){return this.Z.jb})}}
function sb(a,b,c){a.values[b]=new tb(a,c,b)}function ub(a,b){a.values["page-number"]=b}function vb(a,b){a.B["has-content"]=b}var wb={px:1,"in":96,pt:4/3,pc:16,cm:96/2.54,mm:96/25.4,q:96/2.54/40,em:16,rem:16,ex:8,rex:8,dppx:1,dpi:1/96,dpcm:2.54/96};function xb(a){switch(a){case "q":case "rem":case "rex":return!0;default:return!1}}
function yb(a,b,c,d){this.ta=b;this.nb=c;this.J=null;this.Bb=function(){return this.J?this.J:this.Z.jb?Math.floor(b/2)-this.Z.ac:b};this.I=null;this.Ab=function(){return this.I?this.I:c};this.u=d;this.U=null;this.fontSize=function(){return this.U?this.U:d};this.Z=hb;this.F={}}function zb(a,b){a.F[b.u]={};for(var c=0;c<b.w.length;c++)zb(a,b.w[c])}
function Ab(a,b,c){return"vw"==b?a.Bb()/100:"vh"==b?a.Ab()/100:"em"==b||"rem"==b?c?a.u:a.fontSize():"ex"==b||"rex"==b?wb.ex*(c?a.u:a.fontSize())/wb.em:wb[b]}function Bb(a,b,c){do{var d=b.values[c];if(d||b.l&&(d=b.l.call(a,c,!1)))return d;b=b.parent}while(b);throw Error("Name '"+c+"' is undefined");}
function Cb(a,b,c,d,e){do{var f=b.D[c];if(f||b.l&&(f=b.l.call(a,c,!0)))return f;if(f=b.B[c]){if(e)return b.b;c=Array(d.length);for(e=0;e<d.length;e++)c[e]=d[e].evaluate(a);return new rb(b,f.apply(a,c))}b=b.parent}while(b);throw Error("Function '"+c+"' is undefined");}
function Db(a,b,c){var d="",e=b.match(/^(min|max)-(.*)$/);e&&(d=e[1],b=e[2]);var f=e=null;switch(b){case "width":case "height":case "device-width":case "device-height":case "color":c&&(e=c.evaluate(a))}switch(b){case "width":f=a.Bb();break;case "height":f=a.Ab();break;case "device-width":f=window.screen.availWidth;break;case "device-height":f=window.screen.availHeight;break;case "color":f=window.screen.pixelDepth}if(null!=f&&null!=e)switch(d){case "min":return f>=e;case "max":return f<=e;default:return f==
e}else if(null!=f&&!c)return!!f;return!1}function Eb(a){this.b=a;this.h="_"+pb++}n=Eb.prototype;n.toString=function(){var a=new Aa;this.ua(a,0);return a.toString()};n.ua=function(){throw Error("F_ABSTRACT");};n.$a=function(){throw Error("F_ABSTRACT");};n.Pa=function(){return this};n.Nb=function(a){return a===this};function Fb(a,b,c,d){var e=d[a.h];if(null!=e)return e===kb?!1:e;d[a.h]=kb;b=a.Nb(b,c,d);return d[a.h]=b}
n.evaluate=function(a){var b;b=(b=a.F[this.b.u])?b[this.h]:void 0;if("undefined"!=typeof b)return b;b=this.$a(a);var c=this.h,d=this.b,e=a.F[d.u];e||(e={},a.F[d.u]=e);return e[c]=b};n.Ud=function(){return!1};function Gb(a,b){Eb.call(this,a);this.f=b}t(Gb,Eb);n=Gb.prototype;n.Ld=function(){throw Error("F_ABSTRACT");};n.Qd=function(){throw Error("F_ABSTRACT");};n.$a=function(a){a=this.f.evaluate(a);return this.Qd(a)};n.Nb=function(a,b,c){return a===this||Fb(this.f,a,b,c)};
n.ua=function(a,b){10<b&&a.append("(");a.append(this.Ld());this.f.ua(a,10);10<b&&a.append(")")};n.Pa=function(a,b){var c=this.f.Pa(a,b);return c===this.f?this:new this.constructor(this.b,c)};function Hb(a,b,c){Eb.call(this,a);this.f=b;this.g=c}t(Hb,Eb);n=Hb.prototype;n.Gc=function(){throw Error("F_ABSTRACT");};n.La=function(){throw Error("F_ABSTRACT");};n.gb=function(){throw Error("F_ABSTRACT");};n.$a=function(a){var b=this.f.evaluate(a);a=this.g.evaluate(a);return this.gb(b,a)};
n.Nb=function(a,b,c){return a===this||Fb(this.f,a,b,c)||Fb(this.g,a,b,c)};n.ua=function(a,b){var c=this.Gc();c<=b&&a.append("(");this.f.ua(a,c);a.append(this.La());this.g.ua(a,c);c<=b&&a.append(")")};n.Pa=function(a,b){var c=this.f.Pa(a,b),d=this.g.Pa(a,b);return c===this.f&&d===this.g?this:new this.constructor(this.b,c,d)};function Ib(a,b,c){Hb.call(this,a,b,c)}t(Ib,Hb);Ib.prototype.Gc=function(){return 1};function Jb(a,b,c){Hb.call(this,a,b,c)}t(Jb,Hb);Jb.prototype.Gc=function(){return 2};
function Kb(a,b,c){Hb.call(this,a,b,c)}t(Kb,Hb);Kb.prototype.Gc=function(){return 3};function Lb(a,b,c){Hb.call(this,a,b,c)}t(Lb,Hb);Lb.prototype.Gc=function(){return 4};function Mb(a,b){Gb.call(this,a,b)}t(Mb,Gb);Mb.prototype.Ld=function(){return"!"};Mb.prototype.Qd=function(a){return!a};function Nb(a,b){Gb.call(this,a,b)}t(Nb,Gb);Nb.prototype.Ld=function(){return"-"};Nb.prototype.Qd=function(a){return-a};function Ob(a,b,c){Hb.call(this,a,b,c)}t(Ob,Ib);Ob.prototype.La=function(){return"&&"};
Ob.prototype.$a=function(a){return this.f.evaluate(a)&&this.g.evaluate(a)};function Pb(a,b,c){Hb.call(this,a,b,c)}t(Pb,Ob);Pb.prototype.La=function(){return" and "};function Qb(a,b,c){Hb.call(this,a,b,c)}t(Qb,Ib);Qb.prototype.La=function(){return"||"};Qb.prototype.$a=function(a){return this.f.evaluate(a)||this.g.evaluate(a)};function Rb(a,b,c){Hb.call(this,a,b,c)}t(Rb,Qb);Rb.prototype.La=function(){return", "};function Sb(a,b,c){Hb.call(this,a,b,c)}t(Sb,Jb);Sb.prototype.La=function(){return"<"};
Sb.prototype.gb=function(a,b){return a<b};function Tb(a,b,c){Hb.call(this,a,b,c)}t(Tb,Jb);Tb.prototype.La=function(){return"<="};Tb.prototype.gb=function(a,b){return a<=b};function Ub(a,b,c){Hb.call(this,a,b,c)}t(Ub,Jb);Ub.prototype.La=function(){return">"};Ub.prototype.gb=function(a,b){return a>b};function Vb(a,b,c){Hb.call(this,a,b,c)}t(Vb,Jb);Vb.prototype.La=function(){return">="};Vb.prototype.gb=function(a,b){return a>=b};function Wb(a,b,c){Hb.call(this,a,b,c)}t(Wb,Jb);Wb.prototype.La=function(){return"=="};
Wb.prototype.gb=function(a,b){return a==b};function Xb(a,b,c){Hb.call(this,a,b,c)}t(Xb,Jb);Xb.prototype.La=function(){return"!="};Xb.prototype.gb=function(a,b){return a!=b};function Yb(a,b,c){Hb.call(this,a,b,c)}t(Yb,Kb);Yb.prototype.La=function(){return"+"};Yb.prototype.gb=function(a,b){return a+b};function Zb(a,b,c){Hb.call(this,a,b,c)}t(Zb,Kb);Zb.prototype.La=function(){return" - "};Zb.prototype.gb=function(a,b){return a-b};function $b(a,b,c){Hb.call(this,a,b,c)}t($b,Lb);$b.prototype.La=function(){return"*"};
$b.prototype.gb=function(a,b){return a*b};function ac(a,b,c){Hb.call(this,a,b,c)}t(ac,Lb);ac.prototype.La=function(){return"/"};ac.prototype.gb=function(a,b){return a/b};function bc(a,b,c){Hb.call(this,a,b,c)}t(bc,Lb);bc.prototype.La=function(){return"%"};bc.prototype.gb=function(a,b){return a%b};function cc(a,b,c){Eb.call(this,a);this.H=b;this.ea=c.toLowerCase()}t(cc,Eb);cc.prototype.ua=function(a){a.append(this.H.toString());a.append(Ca(this.ea))};
cc.prototype.$a=function(a){return this.H*Ab(a,this.ea,!1)};function dc(a,b){Eb.call(this,a);this.f=b}t(dc,Eb);dc.prototype.ua=function(a){a.append(this.f)};dc.prototype.$a=function(a){return Bb(a,this.b,this.f).evaluate(a)};dc.prototype.Nb=function(a,b,c){return a===this||Fb(Bb(b,this.b,this.f),a,b,c)};function ec(a,b,c){Eb.call(this,a);this.f=b;this.name=c}t(ec,Eb);ec.prototype.ua=function(a){this.f&&a.append("not ");a.append(Ca(this.name))};
ec.prototype.$a=function(a){var b=this.name;a="all"===b||!!a.Z.Pd[b];return this.f?!a:a};ec.prototype.Nb=function(a,b,c){return a===this||Fb(this.value,a,b,c)};ec.prototype.Ud=function(){return!0};function tb(a,b,c){Eb.call(this,a);this.Yb=b;this.dc=c}t(tb,Eb);tb.prototype.ua=function(a){a.append(this.dc)};tb.prototype.$a=function(a){return this.Yb.call(a)};function fc(a,b,c){Eb.call(this,a);this.g=b;this.f=c}t(fc,Eb);
fc.prototype.ua=function(a){a.append(this.g);var b=this.f;a.append("(");for(var c=0;c<b.length;c++)c&&a.append(","),b[c].ua(a,0);a.append(")")};fc.prototype.$a=function(a){return Cb(a,this.b,this.g,this.f,!1).Pa(a,this.f).evaluate(a)};fc.prototype.Nb=function(a,b,c){if(a===this)return!0;for(var d=0;d<this.f.length;d++)if(Fb(this.f[d],a,b,c))return!0;return Fb(Cb(b,this.b,this.g,this.f,!0),a,b,c)};
fc.prototype.Pa=function(a,b){for(var c,d=c=this.f,e=0;e<c.length;e++){var f=c[e].Pa(a,b);if(c!==d)d[e]=f;else if(f!==c[e]){for(var d=Array(c.length),g=0;g<e;g++)d[g]=c[g];d[e]=f}}c=d;return c===this.f?this:new fc(this.b,this.g,c)};function gc(a,b,c,d){Eb.call(this,a);this.f=b;this.j=c;this.g=d}t(gc,Eb);gc.prototype.ua=function(a,b){0<b&&a.append("(");this.f.ua(a,0);a.append("?");this.j.ua(a,0);a.append(":");this.g.ua(a,0);0<b&&a.append(")")};
gc.prototype.$a=function(a){return this.f.evaluate(a)?this.j.evaluate(a):this.g.evaluate(a)};gc.prototype.Nb=function(a,b,c){return a===this||Fb(this.f,a,b,c)||Fb(this.j,a,b,c)||Fb(this.g,a,b,c)};gc.prototype.Pa=function(a,b){var c=this.f.Pa(a,b),d=this.j.Pa(a,b),e=this.g.Pa(a,b);return c===this.f&&d===this.j&&e===this.g?this:new gc(this.b,c,d,e)};function rb(a,b){Eb.call(this,a);this.f=b}t(rb,Eb);
rb.prototype.ua=function(a){switch(typeof this.f){case "number":case "boolean":a.append(this.f.toString());break;case "string":a.append('"');a.append(Da(this.f));a.append('"');break;default:throw Error("F_UNEXPECTED_STATE");}};rb.prototype.$a=function(){return this.f};function hc(a,b,c){Eb.call(this,a);this.name=b;this.value=c}t(hc,Eb);hc.prototype.ua=function(a){a.append("(");a.append(Da(this.name.name));a.append(":");this.value.ua(a,0);a.append(")")};
hc.prototype.$a=function(a){return Db(a,this.name.name,this.value)};hc.prototype.Nb=function(a,b,c){return a===this||Fb(this.value,a,b,c)};hc.prototype.Pa=function(a,b){var c=this.value.Pa(a,b);return c===this.value?this:new hc(this.b,this.name,c)};function ic(a,b){Eb.call(this,a);this.index=b}t(ic,Eb);ic.prototype.ua=function(a){a.append("$");a.append(this.index.toString())};ic.prototype.Pa=function(a,b){var c=b[this.index];if(!c)throw Error("Parameter missing: "+this.index);return c};
function jc(a,b,c){return b===a.h||b===a.b||c==a.h||c==a.b?a.h:b===a.j||b===a.f?c:c===a.j||c===a.f?b:new Ob(a,b,c)}function y(a,b,c){return b===a.b?c:c===a.b?b:new Yb(a,b,c)}function z(a,b,c){return b===a.b?new Nb(a,c):c===a.b?b:new Zb(a,b,c)}function kc(a,b,c){return b===a.b||c===a.b?a.b:b===a.f?c:c===a.f?b:new $b(a,b,c)}function lc(a,b,c){return b===a.b?a.b:c===a.f?b:new ac(a,b,c)};var mc={};function nc(){}n=nc.prototype;n.Gb=function(a){for(var b=0;b<a.length;b++)a[b].$(this)};n.Id=function(){throw Error("E_CSS_EMPTY_NOT_ALLOWED");};n.Jd=function(){throw Error("E_CSS_SLASH_NOT_ALLOWED");};n.Dc=function(){throw Error("E_CSS_STR_NOT_ALLOWED");};n.Fb=function(){throw Error("E_CSS_IDENT_NOT_ALLOWED");};n.hc=function(){throw Error("E_CSS_NUMERIC_NOT_ALLOWED");};n.gc=function(){throw Error("E_CSS_NUM_NOT_ALLOWED");};n.fc=function(a){return this.gc(a)};
n.cd=function(){throw Error("E_CSS_COLOR_NOT_ALLOWED");};n.ic=function(){throw Error("E_CSS_URL_NOT_ALLOWED");};n.rb=function(){throw Error("E_CSS_LIST_NOT_ALLOWED");};n.Eb=function(){throw Error("E_CSS_COMMA_NOT_ALLOWED");};n.tb=function(){throw Error("E_CSS_FUNC_NOT_ALLOWED");};n.ec=function(){throw Error("E_CSS_EXPR_NOT_ALLOWED");};function oc(){}t(oc,nc);n=oc.prototype;
n.Gb=function(a){for(var b=null,c=0;c<a.length;c++){var d=a[c],e=d.$(this);if(b)b[c]=e;else if(d!==e){b=Array(a.length);for(d=0;d<c;d++)b[d]=a[d];b[c]=e}}return b||a};n.Dc=function(a){return a};n.Fb=function(a){return a};n.Jd=function(a){return a};n.hc=function(a){return a};n.gc=function(a){return a};n.fc=function(a){return a};n.cd=function(a){return a};n.ic=function(a){return a};n.rb=function(a){var b=this.Gb(a.values);return b===a.values?a:new pc(b)};
n.Eb=function(a){var b=this.Gb(a.values);return b===a.values?a:new qc(b)};n.tb=function(a){var b=this.Gb(a.values);return b===a.values?a:new rc(a.name,b)};n.ec=function(a){return a};function sc(){}n=sc.prototype;n.toString=function(){var a=new Aa;this.Ja(a,!0);return a.toString()};n.stringValue=function(){var a=new Aa;this.Ja(a,!1);return a.toString()};n.qa=function(){throw Error("F_ABSTRACT");};n.Ja=function(a){a.append("[error]")};n.Td=function(){return!1};n.Zb=function(){return!1};n.Vd=function(){return!1};
n.ne=function(){return!1};n.Oc=function(){return!1};function tc(){if(A)throw Error("E_INVALID_CALL");}t(tc,sc);tc.prototype.qa=function(a){return new rb(a,"")};tc.prototype.Ja=function(){};tc.prototype.$=function(a){return a.Id(this)};var A=new tc;function uc(){if(vc)throw Error("E_INVALID_CALL");}t(uc,sc);uc.prototype.qa=function(a){return new rb(a,"/")};uc.prototype.Ja=function(a){a.append("/")};uc.prototype.$=function(a){return a.Jd(this)};var vc=new uc;function wc(a){this.dc=a}t(wc,sc);
wc.prototype.qa=function(a){return new rb(a,this.dc)};wc.prototype.Ja=function(a,b){b?(a.append('"'),a.append(Da(this.dc)),a.append('"')):a.append(this.dc)};wc.prototype.$=function(a){return a.Dc(this)};function xc(a){this.name=a;if(mc[a])throw Error("E_INVALID_CALL");mc[a]=this}t(xc,sc);xc.prototype.qa=function(a){return new rb(a,this.name)};xc.prototype.Ja=function(a,b){b?a.append(Ca(this.name)):a.append(this.name)};xc.prototype.$=function(a){return a.Fb(this)};xc.prototype.ne=function(){return!0};
function C(a){var b=mc[a];b||(b=new xc(a));return b}function D(a,b){this.H=a;this.ea=b.toLowerCase()}t(D,sc);D.prototype.qa=function(a,b){return this.H?b&&"%"==this.ea?100==this.H?b:new $b(a,b,new rb(a,this.H/100)):new cc(a,this.H,this.ea):a.b};D.prototype.Ja=function(a){a.append(this.H.toString());a.append(this.ea)};D.prototype.$=function(a){return a.hc(this)};D.prototype.Zb=function(){return!0};function yc(a){this.H=a}t(yc,sc);
yc.prototype.qa=function(a){return this.H?1==this.H?a.f:new rb(a,this.H):a.b};yc.prototype.Ja=function(a){a.append(this.H.toString())};yc.prototype.$=function(a){return a.gc(this)};yc.prototype.Vd=function(){return!0};function zc(a){this.H=a}t(zc,yc);zc.prototype.$=function(a){return a.fc(this)};function Ac(a){this.f=a}t(Ac,sc);Ac.prototype.Ja=function(a){a.append("#");var b=this.f.toString(16);a.append("000000".substr(b.length));a.append(b)};Ac.prototype.$=function(a){return a.cd(this)};
function Bc(a){this.url=a}t(Bc,sc);Bc.prototype.Ja=function(a){a.append('url("');a.append(Da(this.url));a.append('")')};Bc.prototype.$=function(a){return a.ic(this)};function Cc(a,b,c,d){var e=b.length;b[0].Ja(a,d);for(var f=1;f<e;f++)a.append(c),b[f].Ja(a,d)}function pc(a){this.values=a}t(pc,sc);pc.prototype.Ja=function(a,b){Cc(a,this.values," ",b)};pc.prototype.$=function(a){return a.rb(this)};pc.prototype.Oc=function(){return!0};function qc(a){this.values=a}t(qc,sc);
qc.prototype.Ja=function(a,b){Cc(a,this.values,",",b)};qc.prototype.$=function(a){return a.Eb(this)};function rc(a,b){this.name=a;this.values=b}t(rc,sc);rc.prototype.Ja=function(a,b){a.append(Ca(this.name));a.append("(");Cc(a,this.values,",",b);a.append(")")};rc.prototype.$=function(a){return a.tb(this)};function E(a){this.b=a}t(E,sc);E.prototype.qa=function(){return this.b};E.prototype.Ja=function(a){a.append("-epubx-expr(");this.b.ua(a,0);a.append(")")};E.prototype.$=function(a){return a.ec(this)};
E.prototype.Td=function(){return!0};function Dc(a,b){if(a){if(a.Zb())return Ab(b,a.ea,!1)*a.H;if(a.Vd())return a.H}return 0}var Ec=C("absolute"),Fc=C("all"),Gc=C("always"),Hc=C("auto");C("avoid");var Ic=C("block"),Jc=C("block-end"),Kc=C("block-start"),Lc=C("both"),Mc=C("bottom"),Nc=C("border-box"),Oc=C("break-all"),Pc=C("break-word"),Qc=C("crop"),Rc=C("cross");C("column");var Sc=C("exclusive"),Tc=C("false"),Uc=C("fixed"),Vc=C("flex"),Wc=C("footnote");C("hidden");
var Xc=C("horizontal-tb"),Yc=C("inherit"),Zc=C("inline"),$c=C("inline-block"),ad=C("inline-end"),bd=C("inline-start"),cd=C("landscape"),dd=C("left"),ed=C("list-item"),fd=C("ltr");C("manual");var F=C("none"),gd=C("normal"),hd=C("oeb-page-foot"),id=C("oeb-page-head"),jd=C("page"),kd=C("relative"),ld=C("right"),md=C("scale");C("spread");var nd=C("static"),od=C("rtl");C("table");var pd=C("table-caption"),qd=C("table-cell");C("table-row");
var rd=C("top"),sd=C("transparent"),td=C("vertical-lr"),ud=C("vertical-rl"),vd=C("visible"),wd=C("true"),xd=new D(100,"%"),yd=new D(100,"vw"),zd=new D(100,"vh"),Ad=new D(0,"px"),Bd={"font-size":1,color:2};function Cd(a,b){return(Bd[a]||Number.MAX_VALUE)-(Bd[b]||Number.MAX_VALUE)};var Dd={SIMPLE_PROPERTY:"SIMPLE_PROPERTY",PREPROCESS_TEXT_CONTENT:"PREPROCESS_TEXT_CONTENT",PREPROCESS_ELEMENT_STYLE:"PREPROCESS_ELEMENT_STYLE",POLYFILLED_INHERITED_PROPS:"POLYFILLED_INHERITED_PROPS",CONFIGURATION:"CONFIGURATION",RESOLVE_TEXT_NODE_BREAKER:"RESOLVE_TEXT_NODE_BREAKER",RESOLVE_FORMATTING_CONTEXT:"RESOLVE_FORMATTING_CONTEXT",RESOLVE_LAYOUT_PROCESSOR:"RESOLVE_LAYOUT_PROCESSOR"},Ed={};
function Gd(a,b){if(Dd[a]){var c=Ed[a];c||(c=Ed[a]=[]);c.push(b)}else u.b(Error("Skipping unknown plugin hook '"+a+"'."))}ba("vivliostyle.plugin.registerHook",Gd);ba("vivliostyle.plugin.removeHook",function(a,b){if(Dd[a]){var c=Ed[a];if(c){var d=c.indexOf(b);0<=d&&c.splice(d,1)}}else u.b(Error("Ignoring unknown plugin hook '"+a+"'."))});var Hd=null,Id=null;function H(a){if(!Hd)throw Error("E_TASK_NO_CONTEXT");Hd.name||(Hd.name=a);var b=Hd;a=new Jd(b,b.top,a);b.top=a;a.b=Kd;return a}function I(a){return new Ld(a)}function Md(a,b,c){a=H(a);a.j=c;try{b(a)}catch(d){Nd(a.f,d,a)}return J(a)}function Od(a){var b=Pd,c;Hd?c=Hd.f:(c=Id)||(c=new Qd(new Rd));b(c,a,void 0)}var Kd=1;function Rd(){}Rd.prototype.currentTime=function(){return(new Date).valueOf()};function Sd(a,b){return setTimeout(a,b)}
function Qd(a){this.g=a;this.h=1;this.slice=25;this.l=0;this.f=new ra;this.b=this.u=null;this.j=!1;this.order=0;Id||(Id=this)}
function Td(a){if(!a.j){var b=a.f.b[1].b,c=a.g.currentTime();if(null!=a.b){if(c+a.h>a.u)return;clearTimeout(a.b)}b-=c;b<=a.h&&(b=a.h);a.u=c+b;a.b=Sd(function(){a.b=null;null!=a.b&&(clearTimeout(a.b),a.b=null);a.j=!0;try{var b=a.g.currentTime();for(a.l=b+a.slice;a.f.length();){var c=a.f.b[1];if(c.b>b)break;var f=a.f,g=f.b.pop(),h=f.b.length;if(1<h){for(var l=1;;){var k=2*l;if(k>=h)break;if(0<Ud(f.b[k],g))k+1<h&&0<Ud(f.b[k+1],f.b[k])&&k++;else if(k+1<h&&0<Ud(f.b[k+1],g))k++;else break;f.b[l]=f.b[k];
l=k}f.b[l]=g}if(!c.h){var l=c,m=l.f;l.f=null;m&&m.b==l&&(m.b=null,k=Hd,Hd=m,L(m.top,l.g),Hd=k)}b=a.g.currentTime();if(b>=a.l)break}}catch(p){u.error(p)}a.j=!1;a.f.length()&&Td(a)},b)}}Qd.prototype.Ya=function(a,b){var c=this.g.currentTime();a.order=this.order++;a.b=c+(b||0);a:{for(var c=this.f,d=c.b.length;1<d;){var e=Math.floor(d/2),f=c.b[e];if(0<Ud(f,a)){c.b[d]=a;break a}c.b[d]=f;d=e}c.b[1]=a}Td(this)};
function Pd(a,b,c){var d=new Vd(a,c||"");d.top=new Jd(d,null,"bootstrap");d.top.b=Kd;d.top.then(function(){function a(){d.l=!1;for(var a=0;a<d.j.length;a++){var b=d.j[a];try{b()}catch(h){u.error(h)}}}try{b().then(function(b){d.h=b;a()})}catch(f){Nd(d,f),a()}});c=Hd;Hd=d;a.Ya(Wd(d.top,"bootstrap"));Hd=c;return d}function Xd(a){this.f=a;this.order=this.b=0;this.g=null;this.h=!1}function Ud(a,b){return b.b-a.b||b.order-a.order}Xd.prototype.Ya=function(a,b){this.g=a;this.f.f.Ya(this,b)};
function Vd(a,b){this.f=a;this.name=b;this.j=[];this.g=null;this.l=!0;this.b=this.top=this.u=this.h=null}function Yd(a,b){a.j.push(b)}Vd.prototype.join=function(){var a=H("Task.join");if(this.l){var b=Wd(a,this),c=this;Yd(this,function(){b.Ya(c.h)})}else L(a,this.h);return J(a)};
function Nd(a,b,c){var d=b.frameTrace;if(!d){for(var d=b.stack?b.stack+"\n\t---- async ---\n":"",e=a.top;e;e=e.parent)d+="\t",d+=e.name,d+="\n";b.frameTrace=d}if(c){for(d=a.top;d&&d!=c;)d=d.parent;d==c&&(a.top=d)}for(a.g=b;a.top&&!a.top.j;)a.top=a.top.parent;a.top?(b=a.g,a.g=null,a.top.j(a.top,b)):a.g&&u.error(a.g,"Unhandled exception in task",a.name)}function Ld(a){this.value=a}n=Ld.prototype;n.then=function(a){a(this.value)};n.ya=function(a){return a(this.value)};n.Gd=function(a){return new Ld(a)};
n.sa=function(a){L(a,this.value)};n.va=function(){return!1};n.get=function(){return this.value};function Zd(a){this.b=a}n=Zd.prototype;n.then=function(a){this.b.then(a)};n.ya=function(a){if(this.va()){var b=new Jd(this.b.f,this.b.parent,"AsyncResult.thenAsync");b.b=Kd;this.b.parent=b;this.b.then(function(c){a(c).then(function(a){L(b,a)})});return J(b)}return a(this.b.g)};n.Gd=function(a){return this.va()?this.ya(function(){return new Ld(a)}):new Ld(a)};
n.sa=function(a){this.va()?this.then(function(b){L(a,b)}):L(a,this.b.g)};n.va=function(){return this.b.b==Kd};n.get=function(){if(this.va())throw Error("Result is pending");return this.b.g};function Jd(a,b,c){this.f=a;this.parent=b;this.name=c;this.g=null;this.b=0;this.j=this.h=null}function $d(a){if(!Hd)throw Error("F_TASK_NO_CONTEXT");if(a!==Hd.top)throw Error("F_TASK_NOT_TOP_FRAME");}function J(a){return new Zd(a)}
function L(a,b){$d(a);Hd.g||(a.g=b);a.b=2;var c=a.parent;Hd.top=c;if(a.h){try{a.h(b)}catch(d){Nd(a.f,d,c)}a.b=3}}Jd.prototype.then=function(a){switch(this.b){case Kd:if(this.h)throw Error("F_TASK_FRAME_ALREADY_HAS_CALLBACK");this.h=a;break;case 2:var b=this.f,c=this.parent;try{a(this.g),this.b=3}catch(d){this.b=3,Nd(b,d,c)}break;case 3:throw Error("F_TASK_DEAD_FRAME");default:throw Error("F_TASK_UNEXPECTED_FRAME_STATE "+this.b);}};
function ae(){var a=H("Frame.timeSlice"),b=a.f.f;b.g.currentTime()>=b.l?(u.debug("-- time slice --"),Wd(a).Ya(!0)):L(a,!0);return J(a)}function be(a){var b=H("Frame.sleep");Wd(b).Ya(!0,a);return J(b)}function ce(a){function b(d){try{for(;d;){var e=a();if(e.va()){e.then(b);return}e.then(function(a){d=a})}L(c,!0)}catch(f){Nd(c.f,f,c)}}var c=H("Frame.loop");b(!0);return J(c)}
function de(a){var b=Hd;if(!b)throw Error("E_TASK_NO_CONTEXT");return ce(function(){var c;do c=new ee(b,b.top),b.top=c,c.b=Kd,a(c),c=J(c);while(!c.va()&&c.get());return c})}function Wd(a,b){$d(a);if(a.f.b)throw Error("E_TASK_ALREADY_SUSPENDED");var c=new Xd(a.f);a.f.b=c;Hd=null;a.f.u=b||null;return c}function ee(a,b){Jd.call(this,a,b,"loop")}t(ee,Jd);function fe(a){L(a,!0)}function M(a){L(a,!1)};function ge(a,b){this.fetch=a;this.name=b;this.f=!1;this.b=this.h=null;this.g=[]}ge.prototype.start=function(){if(!this.b){var a=this;this.b=Pd(Hd.f,function(){var b=H("Fetcher.run");a.fetch().then(function(c){var d=a.g;a.f=!0;a.h=c;a.b=null;a.g=[];if(d)for(var e=0;e<d.length;e++)try{d[e](c)}catch(f){u.error(f,"Error:")}L(b,c)});return J(b)},this.name)}};function he(a,b){a.f?b(a.h):a.g.push(b)}ge.prototype.get=function(){if(this.f)return I(this.h);this.start();return this.b.join()};
function ie(a){if(!a.length)return I(!0);if(1==a.length)return a[0].get().Gd(!0);var b=H("waitForFetches"),c=0;ce(function(){for(;c<a.length;){var b=a[c++];if(!b.f)return b.get().Gd(!0)}return I(!1)}).then(function(){L(b,!0)});return J(b)}
function je(a,b){var c=null,d=null;"img"==a.localName&&(c=a.getAttribute("width"),d=a.getAttribute("height"));var e=new ge(function(){function e(b){l||(l=!0,"img"==a.localName&&(c||a.removeAttribute("width"),d||a.removeAttribute("height")),h.Ya(b?b.type:"timeout"))}var g=H("loadImage"),h=Wd(g,a),l=!1;a.addEventListener("load",e,!1);a.addEventListener("error",e,!1);a.addEventListener("abort",e,!1);"http://www.w3.org/2000/svg"==a.namespaceURI?(a.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",
b),setTimeout(e,300)):a.src=b;return J(g)},"loadElement "+b);e.start();return e};function ke(a){a=a.substr(1);if(a.match(/^[^0-9a-fA-F\n\r]$/))return a;a=parseInt(a,16);return isNaN(a)?"":65535>=a?String.fromCharCode(a):1114111>=a?String.fromCharCode(55296|a>>10&1023,56320|a&1023):"\ufffd"}function le(a){return a.replace(/\\([0-9a-fA-F]{0,6}(\r\n|[ \n\r\t\f])?|[^0-9a-fA-F\n\r])/g,ke)}function me(){this.type=0;this.b=!1;this.H=0;this.text="";this.position=0}
function ne(a,b){var c=Array(128),d;for(d=0;128>d;d++)c[d]=a;c[NaN]=35==a?35:72;for(d=0;d<b.length;d+=2)c[b[d]]=b[d+1];return c}var oe=[72,72,72,72,72,72,72,72,72,1,1,72,1,1,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,1,4,34,6,7,8,9,33,10,11,12,13,14,15,16,17,2,2,2,2,2,2,2,2,2,2,18,19,20,21,22,23,24,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,25,29,26,30,3,72,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,27,31,28,32,72];oe[NaN]=80;
var pe=[43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,52,43,43,43,43,39,43,43,39,39,39,39,39,39,39,39,39,39,43,43,43,43,43,43,43,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,43,44,43,43,39,43,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,43,43,43,43,43];pe[NaN]=43;
var qe=[72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,78,59,72,59,59,59,59,59,59,59,59,59,59,72,72,72,72,72,72,72,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,72,61,72,72,78,72,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,72,72,72,72,72];pe[NaN]=43;
var re=[35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,57,59,35,58,58,58,58,58,58,58,58,58,58,35,35,35,35,35,35,35,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,35,61,35,35,60,35,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,35,35,35,35,35];re[NaN]=35;
var se=[45,45,45,45,45,45,45,45,45,73,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,73,45,45,45,45,45,45,45,53,45,45,45,45,45,45,45,39,39,39,39,39,39,39,39,39,39,45,45,45,45,45,45,45,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,45,44,45,45,39,45,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,45,45,45,45,45];se[NaN]=45;
var te=[37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,41,37,37,37,37,37,37,37,37,42,37,39,39,39,39,39,39,39,39,39,39,37,37,37,37,37,37,37,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,37,37,37,37,40,37,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,37,37,37,37,37];te[NaN]=37;
var ue=[38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,41,38,38,38,38,38,38,38,38,38,38,39,39,39,39,39,39,39,39,39,39,38,38,38,38,38,38,38,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,38,38,38,38,40,38,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,38,38,38,38,38];ue[NaN]=38;
var ve=ne(35,[61,36]),we=ne(35,[58,77]),xe=ne(35,[61,36,124,50]),ye=ne(35,[38,51]),ze=ne(35,[42,54]),Ae=ne(39,[42,55]),Be=ne(54,[42,55,47,56]),Ce=ne(62,[62,56]),De=ne(35,[61,36,33,70]),Ee=ne(62,[45,71]),Fe=ne(63,[45,56]),Ge=ne(76,[9,72,10,72,13,72,32,72]),He=ne(39,[39,46,10,72,13,72,92,48]),Ie=ne(39,[34,46,10,72,13,72,92,49]),Je=ne(39,[39,47,10,74,13,74,92,48]),Ke=ne(39,[34,47,10,74,13,74,92,49]),Le=ne(64,[9,39,32,39,34,66,39,65,41,72,10,39,13,39]),Me=ne(39,[41,67,9,79,10,79,13,79,32,79,92,75,40,
72,91,72,93,72,123,72,125,72,NaN,67]),Ne=ne(39,[39,68,10,74,13,74,92,75,NaN,67]),Oe=ne(39,[34,68,10,74,13,74,92,75,NaN,67]),Pe=ne(72,[9,39,10,39,13,39,32,39,41,69]);function Qe(a,b){this.l=b;this.g=15;this.u=a;this.j=Array(this.g+1);this.b=-1;for(var c=this.position=this.f=this.h=0;c<=this.g;c++)this.j[c]=new me}function N(a){a.h==a.f&&Re(a);return a.j[a.f]}function O(a,b){(a.h-a.f&a.g)<=b&&Re(a);return a.j[a.f+b&a.g]}function Q(a){a.f=a.f+1&a.g}
function Se(a){if(0>a.b)throw Error("F_CSSTOK_BAD_CALL reset");a.f=a.b;a.b=-1}Qe.prototype.error=function(a,b,c){this.l&&this.l.error(c,b)};
function Re(a){var b=a.h,c=0<=a.b?a.b:a.f,d=a.g;b>=c?c+=d:c--;if(c==b){if(0>a.b)throw Error("F_CSSTOK_INTERNAL");for(var b=2*(a.g+1)-1,c=Array(b+1),d=a.b,e=0;d!=a.h;)c[e]=a.j[d],d==a.f&&(a.f=e),d=d+1&a.g,e++;a.b=0;a.h=e;a.g=b;for(a.j=c;e<=b;)c[e++]=new me;b=a.h;c=d=a.g}for(var e=oe,f=a.u,g=a.position,h=a.j,l=0,k=0,m="",p=0,q=!1,w=h[b],r=-9;;){var x=f.charCodeAt(g);switch(e[x]||e[65]){case 72:l=51;m=isNaN(x)?"E_CSS_UNEXPECTED_EOF":"E_CSS_UNEXPECTED_CHAR";g++;break;case 1:g++;q=!0;continue;case 2:k=
g++;e=te;continue;case 3:l=1;k=g++;e=pe;continue;case 4:k=g++;l=31;e=ve;continue;case 33:l=2;k=++g;e=He;continue;case 34:l=2;k=++g;e=Ie;continue;case 6:k=++g;l=7;e=pe;continue;case 7:k=g++;l=32;e=ve;continue;case 8:k=g++;l=21;break;case 9:k=g++;l=32;e=ye;continue;case 10:k=g++;l=10;break;case 11:k=g++;l=11;break;case 12:k=g++;l=36;e=ve;continue;case 13:k=g++;l=23;break;case 14:k=g++;l=16;break;case 15:l=24;k=g++;e=re;continue;case 16:k=g++;e=qe;continue;case 78:k=g++;l=9;e=pe;continue;case 17:k=g++;
l=19;e=ze;continue;case 18:k=g++;l=18;e=we;continue;case 77:g++;l=50;break;case 19:k=g++;l=17;break;case 20:k=g++;l=38;e=De;continue;case 21:k=g++;l=39;e=ve;continue;case 22:k=g++;l=37;e=ve;continue;case 23:k=g++;l=22;break;case 24:k=++g;l=20;e=pe;continue;case 25:k=g++;l=14;break;case 26:k=g++;l=15;break;case 27:k=g++;l=12;break;case 28:k=g++;l=13;break;case 29:r=k=g++;l=1;e=Ge;continue;case 30:k=g++;l=33;e=ve;continue;case 31:k=g++;l=34;e=xe;continue;case 32:k=g++;l=35;e=ve;continue;case 35:break;
case 36:g++;l=l+41-31;break;case 37:l=5;p=parseInt(f.substring(k,g),10);break;case 38:l=4;p=parseFloat(f.substring(k,g));break;case 39:g++;continue;case 40:l=3;p=parseFloat(f.substring(k,g));k=g++;e=pe;continue;case 41:l=3;p=parseFloat(f.substring(k,g));m="%";k=g++;break;case 42:g++;e=ue;continue;case 43:m=f.substring(k,g);break;case 44:r=g++;e=Ge;continue;case 45:m=le(f.substring(k,g));break;case 46:m=f.substring(k,g);g++;break;case 47:m=le(f.substring(k,g));g++;break;case 48:r=g;g+=2;e=Je;continue;
case 49:r=g;g+=2;e=Ke;continue;case 50:g++;l=25;break;case 51:g++;l=26;break;case 52:m=f.substring(k,g);if(1==l){g++;if("url"==m.toLowerCase()){e=Le;continue}l=6}break;case 53:m=le(f.substring(k,g));if(1==l){g++;if("url"==m.toLowerCase()){e=Le;continue}l=6}break;case 54:e=Ae;g++;continue;case 55:e=Be;g++;continue;case 56:e=oe;g++;continue;case 57:e=Ce;g++;continue;case 58:l=5;e=te;g++;continue;case 59:l=4;e=ue;g++;continue;case 60:l=1;e=pe;g++;continue;case 61:l=1;e=Ge;r=g++;continue;case 62:g--;
break;case 63:g-=2;break;case 64:k=g++;e=Me;continue;case 65:k=++g;e=Ne;continue;case 66:k=++g;e=Oe;continue;case 67:l=8;m=le(f.substring(k,g));g++;break;case 69:g++;break;case 70:e=Ee;g++;continue;case 71:e=Fe;g++;continue;case 79:if(8>g-r&&f.substring(r+1,g+1).match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])|[ \t]$/)){g++;continue}case 68:l=8;m=le(f.substring(k,g));g++;e=Pe;continue;case 74:g++;if(9>g-r&&f.substring(r+1,g).match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])$/))continue;l=51;m="E_CSS_UNEXPECTED_NEWLINE";
break;case 73:if(9>g-r&&f.substring(r+1,g+1).match(/^[0-9a-fA-F]{0,6}[ \t]$/)){g++;continue}m=le(f.substring(k,g));break;case 75:r=g++;continue;case 76:g++;e=se;continue;default:e!==oe?(l=51,m="E_CSS_UNEXPECTED_STATE"):(k=g,l=0)}w.type=l;w.b=q;w.H=p;w.text=m;w.position=k;b++;if(b>=c)break;e=oe;q=!1;w=h[b&d]}a.position=g;a.h=b&d};function Te(a,b,c,d,e){var f=H("ajax"),g=new XMLHttpRequest,h=Wd(f,g),l={status:0,url:a,contentType:null,responseText:null,responseXML:null,Sc:null};g.open(c||"GET",a,!0);b&&(g.responseType=b);g.onreadystatechange=function(){if(4===g.readyState){l.status=g.status;if(200==l.status||!l.status)if(b&&"document"!==b||!g.responseXML){var c=g.response;b&&"text"!==b||"string"!=typeof c?c?"string"==typeof c?l.Sc=Ue([c]):l.Sc=c:u.b("Unexpected empty success response for",a):l.responseText=c;if(c=g.getResponseHeader("Content-Type"))l.contentType=
c.replace(/(.*);.*$/,"$1")}else l.responseXML=g.responseXML,l.contentType=g.responseXML.contentType;h.Ya(l)}};try{d?(g.setRequestHeader("Content-Type",e||"text/plain; charset=UTF-8"),g.send(d)):g.send(null)}catch(k){u.b(k,"Error fetching "+a),h.Ya(l)}return J(f)}function Ue(a){var b=window.WebKitBlobBuilder||window.MSBlobBuilder;if(b){for(var b=new b,c=0;c<a.length;c++)b.append(a[c]);return b.getBlob("application/octet-stream")}return new Blob(a,{type:"application/octet-stream"})}
function Ve(a){var b=H("readBlob"),c=new FileReader,d=Wd(b,c);c.addEventListener("load",function(){d.Ya(c.result)},!1);c.readAsArrayBuffer(a);return J(b)}function We(a,b){this.U=a;this.type=b;this.h={};this.j={}}We.prototype.load=function(a,b,c){a=ia(a);var d=this.h[a];return"undefined"!=typeof d?I(d):this.fetch(a,b,c).get()};
function Xe(a,b,c,d){var e=H("fetch");Te(b,a.type).then(function(f){if(c&&400<=f.status)throw Error(d||"Failed to fetch required resource: "+b);a.U(f,a).then(function(c){delete a.j[b];a.h[b]=c;L(e,c)})});return J(e)}We.prototype.fetch=function(a,b,c){a=ia(a);if(this.h[a])return null;var d=this.j[a];if(!d){var e=this,d=new ge(function(){return Xe(e,a,b,c)},"Fetch "+a);e.j[a]=d;d.start()}return d};We.prototype.get=function(a){return this.h[ia(a)]};
function Ye(a){a=a.responseText;return I(a?JSON.parse(a):null)};function Ze(a){var b=parseInt(a,16);if(isNaN(b))throw Error("E_CSS_COLOR");if(6==a.length)return new Ac(b);if(3==a.length)return new Ac(b&15|(b&15)<<4|(b&240)<<4|(b&240)<<8|(b&3840)<<8|(b&3840)<<12);throw Error("E_CSS_COLOR");}function $e(a){this.f=a;this.Va="Author"}n=$e.prototype;n.oc=function(){return null};n.fa=function(){return this.f};n.error=function(){};n.cc=function(a){this.Va=a};n.sb=function(){};n.jd=function(){};n.tc=function(){};n.uc=function(){};n.qd=function(){};n.Ic=function(){};
n.wb=function(){};n.hd=function(){};n.ed=function(){};n.nd=function(){};n.$b=function(){};n.qb=function(){};n.Wc=function(){};n.xc=function(){};n.$c=function(){};n.Uc=function(){};n.Zc=function(){};n.bc=function(){};n.Fd=function(){};n.Sb=function(){};n.Vc=function(){};n.Yc=function(){};n.Xc=function(){};n.Ac=function(){};n.zc=function(){};n.xa=function(){};n.ob=function(){};n.xb=function(){};n.yc=function(){};n.Kc=function(){};
function af(a){switch(a.Va){case "UA":return 0;case "User":return 100663296;default:return 83886080}}function bf(a){switch(a.Va){case "UA":return 0;case "User":return 16777216;default:return 33554432}}function cf(){$e.call(this,null);this.g=[];this.b=null}t(cf,$e);function df(a,b){a.g.push(a.b);a.b=b}n=cf.prototype;n.oc=function(){return null};n.fa=function(){return this.b.fa()};n.error=function(a,b){this.b.error(a,b)};
n.cc=function(a){$e.prototype.cc.call(this,a);0<this.g.length&&(this.b=this.g[0],this.g=[]);this.b.cc(a)};n.sb=function(a,b){this.b.sb(a,b)};n.jd=function(a){this.b.jd(a)};n.tc=function(a,b){this.b.tc(a,b)};n.uc=function(a,b){this.b.uc(a,b)};n.qd=function(a){this.b.qd(a)};n.Ic=function(a,b,c,d){this.b.Ic(a,b,c,d)};n.wb=function(){this.b.wb()};n.hd=function(){this.b.hd()};n.ed=function(){this.b.ed()};n.nd=function(){this.b.nd()};n.$b=function(){this.b.$b()};n.qb=function(){this.b.qb()};n.Wc=function(){this.b.Wc()};
n.xc=function(a){this.b.xc(a)};n.$c=function(){this.b.$c()};n.Uc=function(){this.b.Uc()};n.Zc=function(){this.b.Zc()};n.bc=function(){this.b.bc()};n.Fd=function(a){this.b.Fd(a)};n.Sb=function(a){this.b.Sb(a)};n.Vc=function(a){this.b.Vc(a)};n.Yc=function(){this.b.Yc()};n.Xc=function(a,b,c){this.b.Xc(a,b,c)};n.Ac=function(a,b,c){this.b.Ac(a,b,c)};n.zc=function(a,b,c){this.b.zc(a,b,c)};n.xa=function(){this.b.xa()};n.ob=function(a,b,c){this.b.ob(a,b,c)};n.xb=function(){this.b.xb()};n.yc=function(a){this.b.yc(a)};
n.Kc=function(){this.b.Kc()};function ef(a,b,c){$e.call(this,a);this.I=c;this.G=0;if(this.ha=b)this.Va=b.Va}t(ef,$e);ef.prototype.oc=function(){return this.ha.oc()};ef.prototype.error=function(a){u.b(a)};ef.prototype.xa=function(){this.G++};ef.prototype.xb=function(){if(!--this.G&&!this.I){var a=this.ha;a.b=a.g.pop()}};function ff(a,b,c){ef.call(this,a,b,c)}t(ff,ef);function gf(a,b){a.error(b,a.oc())}function hf(a,b){gf(a,b);df(a.ha,new ef(a.f,a.ha,!1))}n=ff.prototype;n.qb=function(){hf(this,"E_CSS_UNEXPECTED_SELECTOR")};
n.Wc=function(){hf(this,"E_CSS_UNEXPECTED_FONT_FACE")};n.xc=function(){hf(this,"E_CSS_UNEXPECTED_FOOTNOTE")};n.$c=function(){hf(this,"E_CSS_UNEXPECTED_VIEWPORT")};n.Uc=function(){hf(this,"E_CSS_UNEXPECTED_DEFINE")};n.Zc=function(){hf(this,"E_CSS_UNEXPECTED_REGION")};n.bc=function(){hf(this,"E_CSS_UNEXPECTED_PAGE")};n.Sb=function(){hf(this,"E_CSS_UNEXPECTED_WHEN")};n.Vc=function(){hf(this,"E_CSS_UNEXPECTED_FLOW")};n.Yc=function(){hf(this,"E_CSS_UNEXPECTED_PAGE_TEMPLATE")};n.Xc=function(){hf(this,"E_CSS_UNEXPECTED_PAGE_MASTER")};
n.Ac=function(){hf(this,"E_CSS_UNEXPECTED_PARTITION")};n.zc=function(){hf(this,"E_CSS_UNEXPECTED_PARTITION_GROUP")};n.yc=function(){hf(this,"E_CSS_UNEXPECTED_SELECTOR_FUNC")};n.Kc=function(){hf(this,"E_CSS_UNEXPECTED_END_SELECTOR_FUNC")};n.ob=function(){this.error("E_CSS_UNEXPECTED_PROPERTY",this.oc())};var jf=[],kf=[],S=[],lf=[],mf=[],nf=[],of=[],pf=[],T=[],qf=[],rf=[],sf=[],tf=[];jf[1]=28;jf[36]=29;jf[7]=29;jf[9]=29;jf[14]=29;jf[18]=29;jf[20]=30;jf[13]=27;jf[0]=200;kf[1]=46;kf[0]=200;nf[1]=2;
nf[36]=4;nf[7]=6;nf[9]=8;nf[14]=10;nf[18]=14;S[37]=11;S[23]=12;S[35]=56;S[1]=1;S[36]=3;S[7]=5;S[9]=7;S[14]=9;S[12]=13;S[18]=55;S[50]=42;S[16]=41;lf[1]=1;lf[36]=3;lf[7]=5;lf[9]=7;lf[14]=9;lf[11]=200;lf[18]=55;mf[1]=2;mf[36]=4;mf[7]=6;mf[9]=8;mf[18]=14;mf[50]=42;mf[14]=10;mf[12]=13;of[1]=15;of[7]=16;of[4]=17;of[5]=18;of[3]=19;of[2]=20;of[8]=21;of[16]=22;of[19]=23;of[6]=24;of[11]=25;of[17]=26;of[13]=48;of[31]=47;of[23]=54;of[0]=44;pf[1]=31;pf[4]=32;pf[5]=32;pf[3]=33;pf[2]=34;pf[10]=40;pf[6]=38;
pf[31]=36;pf[24]=36;pf[32]=35;T[1]=45;T[16]=37;T[37]=37;T[38]=37;T[47]=37;T[48]=37;T[39]=37;T[49]=37;T[26]=37;T[25]=37;T[23]=37;T[24]=37;T[19]=37;T[21]=37;T[36]=37;T[18]=37;T[22]=37;T[11]=39;T[12]=43;T[17]=49;qf[0]=200;qf[12]=50;qf[13]=51;qf[14]=50;qf[15]=51;qf[10]=50;qf[11]=51;qf[17]=53;rf[0]=200;rf[12]=50;rf[13]=52;rf[14]=50;rf[15]=51;rf[10]=50;rf[11]=51;rf[17]=53;sf[0]=200;sf[12]=50;sf[13]=51;sf[14]=50;sf[15]=51;sf[10]=50;sf[11]=51;tf[11]=0;tf[16]=0;tf[22]=1;tf[18]=1;tf[26]=2;tf[25]=2;tf[38]=3;
tf[37]=3;tf[48]=3;tf[47]=3;tf[39]=3;tf[49]=3;tf[41]=3;tf[23]=4;tf[24]=4;tf[36]=5;tf[19]=5;tf[21]=5;tf[0]=6;tf[52]=2;function uf(a,b,c,d){this.b=a;this.f=b;this.u=c;this.da=d;this.D=[];this.M={};this.g=this.I=null;this.B=!1;this.j=2;this.F=null;this.G=!1;this.w=this.J=null;this.l=[];this.h=[];this.S=this.U=!1}function vf(a,b){for(var c=[],d=a.D;;){c.push(d[b++]);if(b==d.length)break;if(","!=d[b++])throw Error("Unexpected state");}return c}
function wf(a,b,c){var d=a.D,e=d.length,f;do f=d[--e];while("undefined"!=typeof f&&"string"!=typeof f);var g=d.length-(e+1);1<g&&d.splice(e+1,g,new pc(d.slice(e+1,d.length)));if(","==b)return null;e++;do f=d[--e];while("undefined"!=typeof f&&("string"!=typeof f||","==f));g=d.length-(e+1);if("("==f){if(")"!=b)return a.u.error("E_CSS_MISMATCHED_C_PAR",c),a.b=rf,null;a=new rc(d[e-1],vf(a,e+1));d.splice(e-1,g+2,a);return null}return";"!=b||0<=e?(a.u.error("E_CSS_UNEXPECTED_VAL_END",c),a.b=rf,null):1<
g?new qc(vf(a,e+1)):d[0]}function xf(a,b,c){a.b=a.g?rf:qf;a.u.error(b,c)}
function yf(a,b,c){for(var d=a.D,e=a.u,f=d.pop(),g;;){var h=d.pop();if(11==b){for(g=[f];16==h;)g.unshift(d.pop()),h=d.pop();if("string"==typeof h){if("{"==h){for(;2<=g.length;)a=g.shift(),c=g.shift(),a=new Rb(e.fa(),a,c),g.unshift(a);d.push(new E(g[0]));return!0}if("("==h){b=d.pop();f=d.pop();f=new fc(e.fa(),ob(f,b),g);b=0;continue}}if(10==h){f.Ud()&&(f=new hc(e.fa(),f,null));b=0;continue}}else if("string"==typeof h){d.push(h);break}if(0>h)if(-31==h)f=new Mb(e.fa(),f);else if(-24==h)f=new Nb(e.fa(),
f);else return xf(a,"F_UNEXPECTED_STATE",c),!1;else{if(tf[b]>tf[h]){d.push(h);break}g=d.pop();switch(h){case 26:f=new Ob(e.fa(),g,f);break;case 52:f=new Pb(e.fa(),g,f);break;case 25:f=new Qb(e.fa(),g,f);break;case 38:f=new Sb(e.fa(),g,f);break;case 37:f=new Ub(e.fa(),g,f);break;case 48:f=new Tb(e.fa(),g,f);break;case 47:f=new Vb(e.fa(),g,f);break;case 39:case 49:f=new Wb(e.fa(),g,f);break;case 41:f=new Xb(e.fa(),g,f);break;case 23:f=new Yb(e.fa(),g,f);break;case 24:f=new Zb(e.fa(),g,f);break;case 36:f=
new $b(e.fa(),g,f);break;case 19:f=new ac(e.fa(),g,f);break;case 21:f=new bc(e.fa(),g,f);break;case 18:if(1<d.length)switch(d[d.length-1]){case 22:d.pop();f=new gc(e.fa(),d.pop(),g,f);break;case 10:if(g.Ud())f=new hc(e.fa(),g,f);else return xf(a,"E_CSS_MEDIA_TEST",c),!1}else return xf(a,"E_CSS_EXPR_COND",c),!1;break;case 22:if(18!=b)return xf(a,"E_CSS_EXPR_COND",c),!1;case 10:return d.push(g),d.push(h),d.push(f),!1;default:return xf(a,"F_UNEXPECTED_STATE",c),!1}}}d.push(f);return!1}
function zf(a){for(var b=[];;){var c=N(a.f);switch(c.type){case 1:b.push(c.text);break;case 23:b.push("+");break;case 4:case 5:b.push(c.H);break;default:return b}Q(a.f)}}
function Af(a){var b=!1,c=N(a.f);if(23===c.type)b=!0,Q(a.f),c=N(a.f);else if(1===c.type&&("even"===c.text||"odd"===c.text))return Q(a.f),[2,"odd"===c.text?1:0];switch(c.type){case 3:if(b&&0>c.H)break;case 1:if(b&&"-"===c.text.charAt(0))break;if("n"===c.text||"-n"===c.text){if(b&&c.b)break;b="-n"===c.text?-1:1;3===c.type&&(b=c.H);var d=0;Q(a.f);var c=N(a.f),e=24===c.type,f=23===c.type||e;f&&(Q(a.f),c=N(a.f));if(5===c.type){d=c.H;if(1/d===1/-0){if(d=0,f)break}else if(0>d){if(f)break}else if(0<=d&&!f)break;
Q(a.f)}else if(f)break;return[b,e&&0<d?-d:d]}if("n-"===c.text||"-n-"===c.text){if(!b||!c.b)if(b="-n-"===c.text?-1:1,3===c.type&&(b=c.H),Q(a.f),c=N(a.f),5===c.type&&!(0>c.H||1/c.H===1/-0))return Q(a.f),[b,c.H]}else{if(d=c.text.match(/^n(-[0-9]+)$/)){if(b&&c.b)break;Q(a.f);return[3===c.type?c.H:1,parseInt(d[1],10)]}if(d=c.text.match(/^-n(-[0-9]+)$/))return Q(a.f),[-1,parseInt(d[1],10)]}break;case 5:if(!b||!(c.b||0>c.H))return Q(a.f),[0,c.H]}return null}
function Bf(a,b,c){a=a.u.fa();if(!a)return null;c=c||a.j;if(b){b=b.split(/\s+/);for(var d=0;d<b.length;d++)switch(b[d]){case "vertical":c=jc(a,c,new Mb(a,new dc(a,"pref-horizontal")));break;case "horizontal":c=jc(a,c,new dc(a,"pref-horizontal"));break;case "day":c=jc(a,c,new Mb(a,new dc(a,"pref-night-mode")));break;case "night":c=jc(a,c,new dc(a,"pref-night-mode"));break;default:c=a.h}}return c===a.j?null:new E(c)}
function Cf(a){switch(a.h[a.h.length-1]){case "[selector]":case "font-face":case "-epubx-flow":case "-epubx-viewport":case "-epubx-define":case "-adapt-footnote-area":return!0}return!1}
function Df(a,b,c,d,e,f){var g=a.u,h=a.f,l=a.D,k,m,p,q;e&&(a.j=2,a.D.push("{"));a:for(;0<b;--b)switch(k=N(h),a.b[k.type]){case 28:if(18!=O(h,1).type){Cf(a)?(g.error("E_CSS_COLON_EXPECTED",O(h,1)),a.b=rf):(a.b=nf,g.qb());continue}m=O(h,2);if(!(m.b||1!=m.type&&6!=m.type)){if(0<=h.b)throw Error("F_CSSTOK_BAD_CALL mark");h.b=h.f}a.g=k.text;a.B=!1;Q(h);Q(h);a.b=of;l.splice(0,l.length);continue;case 46:if(18!=O(h,1).type){a.b=rf;g.error("E_CSS_COLON_EXPECTED",O(h,1));continue}a.g=k.text;a.B=!1;Q(h);Q(h);
a.b=of;l.splice(0,l.length);continue;case 29:a.b=nf;g.qb();continue;case 1:if(!k.b){a.b=sf;g.error("E_CSS_SPACE_EXPECTED",k);continue}g.wb();case 2:if(34==O(h,1).type)if(Q(h),Q(h),p=a.M[k.text],null!=p)switch(k=N(h),k.type){case 1:g.sb(p,k.text);a.b=f?lf:S;Q(h);break;case 36:g.sb(p,null);a.b=f?lf:S;Q(h);break;default:a.b=qf,g.error("E_CSS_NAMESPACE",k)}else a.b=qf,g.error("E_CSS_UNDECLARED_PREFIX",k);else g.sb(a.I,k.text),a.b=f?lf:S,Q(h);continue;case 3:if(!k.b){a.b=sf;g.error("E_CSS_SPACE_EXPECTED",
k);continue}g.wb();case 4:if(34==O(h,1).type)switch(Q(h),Q(h),k=N(h),k.type){case 1:g.sb(null,k.text);a.b=f?lf:S;Q(h);break;case 36:g.sb(null,null);a.b=f?lf:S;Q(h);break;default:a.b=qf,g.error("E_CSS_NAMESPACE",k)}else g.sb(a.I,null),a.b=f?lf:S,Q(h);continue;case 5:k.b&&g.wb();case 6:g.qd(k.text);a.b=f?lf:S;Q(h);continue;case 7:k.b&&g.wb();case 8:g.jd(k.text);a.b=f?lf:S;Q(h);continue;case 55:k.b&&g.wb();case 14:Q(h);k=N(h);b:switch(k.type){case 1:g.tc(k.text,null);Q(h);a.b=f?lf:S;continue;case 6:m=
k.text;Q(h);switch(m){case "not":a.b=nf;g.yc("not");Df(a,Number.POSITIVE_INFINITY,!1,!1,!1,!0)?a.b=S:a.b=sf;break a;case "lang":case "href-epub-type":if(k=N(h),1===k.type){p=[k.text];Q(h);break}else break b;case "nth-child":case "nth-of-type":case "nth-last-child":case "nth-last-of-type":if(p=Af(a))break;else break b;default:p=zf(a)}k=N(h);if(11==k.type){g.tc(m,p);Q(h);a.b=f?lf:S;continue}}g.error("E_CSS_PSEUDOCLASS_SYNTAX",k);a.b=qf;continue;case 42:Q(h);k=N(h);switch(k.type){case 1:g.uc(k.text,
null);a.b=f?lf:S;Q(h);continue;case 6:if(m=k.text,Q(h),p=zf(a),k=N(h),11==k.type){g.uc(m,p);a.b=f?lf:S;Q(h);continue}}g.error("E_CSS_PSEUDOELEM_SYNTAX",k);a.b=qf;continue;case 9:k.b&&g.wb();case 10:Q(h);k=N(h);if(1==k.type)m=k.text,Q(h);else if(36==k.type)m=null,Q(h);else if(34==k.type)m="";else{a.b=sf;g.error("E_CSS_ATTR",k);Q(h);continue}k=N(h);if(34==k.type){p=m?a.M[m]:m;if(null==p){a.b=sf;g.error("E_CSS_UNDECLARED_PREFIX",k);Q(h);continue}Q(h);k=N(h);if(1!=k.type){a.b=sf;g.error("E_CSS_ATTR_NAME_EXPECTED",
k);continue}m=k.text;Q(h);k=N(h)}else p="";switch(k.type){case 39:case 45:case 44:case 43:case 42:case 46:case 50:q=k.type;Q(h);k=N(h);break;case 15:g.Ic(p,m,0,null);a.b=f?lf:S;Q(h);continue;default:a.b=sf;g.error("E_CSS_ATTR_OP_EXPECTED",k);continue}switch(k.type){case 1:case 2:g.Ic(p,m,q,k.text);Q(h);k=N(h);break;default:a.b=sf;g.error("E_CSS_ATTR_VAL_EXPECTED",k);continue}if(15!=k.type){a.b=sf;g.error("E_CSS_ATTR",k);continue}a.b=f?lf:S;Q(h);continue;case 11:g.hd();a.b=mf;Q(h);continue;case 12:g.ed();
a.b=mf;Q(h);continue;case 56:g.nd();a.b=mf;Q(h);continue;case 13:a.U?(a.h.push("-epubx-region"),a.U=!1):a.S?(a.h.push("page"),a.S=!1):a.h.push("[selector]");g.xa();a.b=jf;Q(h);continue;case 41:g.$b();a.b=nf;Q(h);continue;case 15:l.push(C(k.text));Q(h);continue;case 16:try{l.push(Ze(k.text))}catch(r){g.error("E_CSS_COLOR",k),a.b=qf}Q(h);continue;case 17:l.push(new yc(k.H));Q(h);continue;case 18:l.push(new zc(k.H));Q(h);continue;case 19:l.push(new D(k.H,k.text));Q(h);continue;case 20:l.push(new wc(k.text));
Q(h);continue;case 21:l.push(new Bc(la(k.text,a.da)));Q(h);continue;case 22:wf(a,",",k);l.push(",");Q(h);continue;case 23:l.push(vc);Q(h);continue;case 24:m=k.text.toLowerCase();"-epubx-expr"==m?(a.b=pf,a.j=0,l.push("{")):(l.push(m),l.push("("));Q(h);continue;case 25:wf(a,")",k);Q(h);continue;case 47:Q(h);k=N(h);m=O(h,1);if(1==k.type&&"important"==k.text.toLowerCase()&&(17==m.type||0==m.type||13==m.type)){Q(h);a.B=!0;continue}xf(a,"E_CSS_SYNTAX",k);continue;case 54:m=O(h,1);switch(m.type){case 4:case 3:case 5:if(!m.b){Q(h);
continue}}a.b===of&&0<=h.b?(Se(h),a.b=nf,g.qb()):xf(a,"E_CSS_UNEXPECTED_PLUS",k);continue;case 26:Q(h);case 48:h.b=-1;(m=wf(a,";",k))&&a.g&&g.ob(a.g,m,a.B);a.b=d?kf:jf;continue;case 44:Q(h);h.b=-1;m=wf(a,";",k);if(c)return a.F=m,!0;a.g&&m&&g.ob(a.g,m,a.B);if(d)return!0;xf(a,"E_CSS_SYNTAX",k);continue;case 31:m=O(h,1);9==m.type?(10!=O(h,2).type||O(h,2).b?(l.push(new dc(g.fa(),ob(k.text,m.text))),a.b=T):(l.push(k.text,m.text,"("),Q(h)),Q(h)):(2==a.j||3==a.j?"not"==k.text.toLowerCase()?(Q(h),l.push(new ec(g.fa(),
!0,m.text))):("only"==k.text.toLowerCase()&&(Q(h),k=m),l.push(new ec(g.fa(),!1,k.text))):l.push(new dc(g.fa(),k.text)),a.b=T);Q(h);continue;case 38:l.push(null,k.text,"(");Q(h);continue;case 32:l.push(new rb(g.fa(),k.H));Q(h);a.b=T;continue;case 33:m=k.text;"%"==m&&(m=a.g&&a.g.match(/height|^(top|bottom)$/)?"vh":"vw");l.push(new cc(g.fa(),k.H,m));Q(h);a.b=T;continue;case 34:l.push(new rb(g.fa(),k.text));Q(h);a.b=T;continue;case 35:Q(h);k=N(h);5!=k.type||k.b?xf(a,"E_CSS_SYNTAX",k):(l.push(new ic(g.fa(),
k.H)),Q(h),a.b=T);continue;case 36:l.push(-k.type);Q(h);continue;case 37:a.b=pf;yf(a,k.type,k);l.push(k.type);Q(h);continue;case 45:"and"==k.text.toLowerCase()?(a.b=pf,yf(a,52,k),l.push(52),Q(h)):xf(a,"E_CSS_SYNTAX",k);continue;case 39:yf(a,k.type,k)&&(a.g?a.b=of:xf(a,"E_CSS_UNBALANCED_PAR",k));Q(h);continue;case 43:yf(a,11,k)&&(a.g||3==a.j?xf(a,"E_CSS_UNEXPECTED_BRC",k):(1==a.j?g.Sb(l.pop()):(k=l.pop(),g.Sb(k)),a.h.push("media"),g.xa(),a.b=jf));Q(h);continue;case 49:if(yf(a,11,k))if(a.g||3!=a.j)xf(a,
"E_CSS_UNEXPECTED_SEMICOL",k);else return a.w=l.pop(),a.G=!0,a.b=jf,Q(h),!1;Q(h);continue;case 40:l.push(k.type);Q(h);continue;case 27:a.b=jf;Q(h);g.xb();a.h.length&&a.h.pop();continue;case 30:m=k.text.toLowerCase();switch(m){case "import":Q(h);k=N(h);if(2==k.type||8==k.type){a.J=k.text;Q(h);k=N(h);if(17==k.type||0==k.type)return a.G=!0,Q(h),!1;a.g=null;a.j=3;a.b=pf;l.push("{");continue}g.error("E_CSS_IMPORT_SYNTAX",k);a.b=qf;continue;case "namespace":Q(h);k=N(h);switch(k.type){case 1:m=k.text;Q(h);
k=N(h);if((2==k.type||8==k.type)&&17==O(h,1).type){a.M[m]=k.text;Q(h);Q(h);continue}break;case 2:case 8:if(17==O(h,1).type){a.I=k.text;Q(h);Q(h);continue}}g.error("E_CSS_NAMESPACE_SYNTAX",k);a.b=qf;continue;case "charset":Q(h);k=N(h);if(2==k.type&&17==O(h,1).type){m=k.text.toLowerCase();"utf-8"!=m&&"utf-16"!=m&&g.error("E_CSS_UNEXPECTED_CHARSET "+m,k);Q(h);Q(h);continue}g.error("E_CSS_CHARSET_SYNTAX",k);a.b=qf;continue;case "font-face":case "-epubx-page-template":case "-epubx-define":case "-epubx-viewport":if(12==
O(h,1).type){Q(h);Q(h);switch(m){case "font-face":g.Wc();break;case "-epubx-page-template":g.Yc();break;case "-epubx-define":g.Uc();break;case "-epubx-viewport":g.$c()}a.h.push(m);g.xa();continue}break;case "-adapt-footnote-area":Q(h);k=N(h);switch(k.type){case 12:Q(h);g.xc(null);a.h.push(m);g.xa();continue;case 50:if(Q(h),k=N(h),1==k.type&&12==O(h,1).type){m=k.text;Q(h);Q(h);g.xc(m);a.h.push("-adapt-footnote-area");g.xa();continue}}break;case "-epubx-region":Q(h);g.Zc();a.U=!0;a.b=nf;continue;case "page":Q(h);
g.bc();a.S=!0;a.b=mf;continue;case "top-left-corner":case "top-left":case "top-center":case "top-right":case "top-right-corner":case "right-top":case "right-middle":case "right-bottom":case "bottom-right-corner":case "bottom-right":case "bottom-center":case "bottom-left":case "bottom-left-corner":case "left-bottom":case "left-middle":case "left-top":Q(h);k=N(h);if(12==k.type){Q(h);g.Fd(m);a.h.push(m);g.xa();continue}break;case "-epubx-when":Q(h);a.g=null;a.j=1;a.b=pf;l.push("{");continue;case "media":Q(h);
a.g=null;a.j=2;a.b=pf;l.push("{");continue;case "-epubx-flow":if(1==O(h,1).type&&12==O(h,2).type){g.Vc(O(h,1).text);Q(h);Q(h);Q(h);a.h.push(m);g.xa();continue}break;case "-epubx-page-master":case "-epubx-partition":case "-epubx-partition-group":Q(h);k=N(h);q=p=null;var w=[];1==k.type&&(p=k.text,Q(h),k=N(h));18==k.type&&1==O(h,1).type&&(q=O(h,1).text,Q(h),Q(h),k=N(h));for(;6==k.type&&"class"==k.text.toLowerCase()&&1==O(h,1).type&&11==O(h,2).type;)w.push(O(h,1).text),Q(h),Q(h),Q(h),k=N(h);if(12==k.type){Q(h);
switch(m){case "-epubx-page-master":g.Xc(p,q,w);break;case "-epubx-partition":g.Ac(p,q,w);break;case "-epubx-partition-group":g.zc(p,q,w)}a.h.push(m);g.xa();continue}break;case "":g.error("E_CSS_UNEXPECTED_AT"+m,k);a.b=sf;continue;default:g.error("E_CSS_AT_UNKNOWN "+m,k);a.b=qf;continue}g.error("E_CSS_AT_SYNTAX "+m,k);a.b=qf;continue;case 50:if(c||d)return!0;a.l.push(k.type+1);Q(h);continue;case 52:if(c||d)return!0;if(!a.l.length){a.b=jf;continue}case 51:0<a.l.length&&a.l[a.l.length-1]==k.type&&a.l.pop();
a.l.length||13!=k.type||(a.b=jf);Q(h);continue;case 53:if(c||d)return!0;a.l.length||(a.b=jf);Q(h);continue;case 200:return f&&(Q(h),g.Kc()),!0;default:if(c||d)return!0;if(e)return yf(a,11,k)?(a.F=l.pop(),!0):!1;if(f)return 51==k.type?g.error(k.text,k):g.error("E_CSS_SYNTAX",k),!1;a.b===of&&0<=h.b?(Se(h),a.b=nf,g.qb()):a.b!==qf&&a.b!==sf&&a.b!==rf?(51==k.type?g.error(k.text,k):g.error("E_CSS_SYNTAX",k),a.b=Cf(a)?rf:sf):Q(h)}return!1}function Ef(a){$e.call(this,null);this.f=a}t(Ef,$e);
Ef.prototype.error=function(a){throw Error(a);};Ef.prototype.fa=function(){return this.f};
function Ff(a,b,c,d,e){var f=H("parseStylesheet"),g=new uf(jf,a,b,c),h=null;e&&(h=Gf(new Qe(e,b),b,c));if(h=Bf(g,d,h&&h.qa()))b.Sb(h),b.xa();ce(function(){for(;!Df(g,100,!1,!1,!1,!1);){if(g.G){var a=la(g.J,c);g.w&&(b.Sb(g.w),b.xa());var d=H("parseStylesheet.import");Hf(a,b,null,null).then(function(){g.w&&b.xb();g.G=!1;g.J=null;g.w=null;L(d,!0)});return J(d)}a=ae();if(a.va)return a}return I(!1)}).then(function(){h&&b.xb();L(f,!0)});return J(f)}
function If(a,b,c,d,e){return Md("parseStylesheetFromText",function(f){var g=new Qe(a,b);Ff(g,b,c,d,e).sa(f)},function(b,c){u.b(c,"Failed to parse stylesheet text: "+a);L(b,!1)})}function Hf(a,b,c,d){return Md("parseStylesheetFromURL",function(e){Te(a).then(function(f){f.responseText?If(f.responseText,b,a,c,d).then(function(b){b||u.b("Failed to parse stylesheet from "+a);L(e,!0)}):L(e,!0)})},function(b,c){u.b(c,"Exception while fetching and parsing:",a);L(b,!0)})}
function Jf(a,b){var c=new uf(of,b,new Ef(a),"");Df(c,Number.POSITIVE_INFINITY,!0,!1,!1,!1);return c.F}function Gf(a,b,c){a=new uf(pf,a,b,c);Df(a,Number.POSITIVE_INFINITY,!1,!1,!0,!1);return a.F}var Kf={"z-index":!0,"column-count":!0,"flow-linger":!0,opacity:!0,page:!0,"flow-priority":!0,utilization:!0};
function Lf(a,b,c){if(b.Td())a:{b=b.b;a=b.evaluate(a);switch(typeof a){case "number":c=Kf[c]?a==Math.round(a)?new zc(a):new yc(a):new D(a,"px");break a;case "string":c=a?Jf(b.b,new Qe(a,null)):A;break a;case "boolean":c=a?wd:Tc;break a;case "undefined":c=A;break a}throw Error("E_UNEXPECTED");}else c=b;return c};function Mf(a,b,c,d){this.ia=a;this.ba=b;this.aa=c;this.Y=d}function Nf(a,b){this.f=a;this.b=b}function Of(){this.bottom=this.right=this.top=this.left=0}function Pf(a,b,c,d){this.b=a;this.f=b;this.h=c;this.g=d}function Qf(a,b,c,d){this.ba=a;this.Y=b;this.ia=c;this.aa=d;this.right=this.left=null}function Rf(a,b){return a.b.b-b.b.b||a.b.f-b.b.f}function Sf(a){this.b=a}function Tf(a,b,c){a=a.b;for(var d=a.length,e=a[d-1],f=0;f<d;f++){var g=a[f];b.push(e.b<g.b?new Pf(e,g,1,c):new Pf(g,e,-1,c));e=g}}
function Uf(a,b,c,d){for(var e=[],f=0;20>f;f++){var g=2*f*Math.PI/20;e.push(new Nf(a+c*Math.sin(g),b+d*Math.cos(g)))}return new Sf(e)}function Vf(a,b,c,d){return new Sf([new Nf(a,b),new Nf(c,b),new Nf(c,d),new Nf(a,d)])}function Wf(a,b,c,d){this.f=a;this.h=b;this.b=c;this.g=d}function Xf(a,b){var c=a.b.f+(a.f.f-a.b.f)*(b-a.b.b)/(a.f.b-a.b.b);if(isNaN(c))throw Error("Bad intersection");return c}
function Yf(a,b,c,d){var e,f;b.f.b<c&&u.b("Error: inconsistent segment (1)");b.b.b<=c?(c=Xf(b,c),e=b.h):(c=b.b.f,e=0);b.f.b>=d?(d=Xf(b,d),f=b.h):(d=b.f.f,f=0);c<d?(a.push(new Wf(c,e,b.g,-1)),a.push(new Wf(d,f,b.g,1))):(a.push(new Wf(d,f,b.g,-1)),a.push(new Wf(c,e,b.g,1)))}
function Zf(a,b,c){c=b+c;for(var d=Array(c),e=Array(c),f=0;f<=c;f++)d[f]=0,e[f]=0;for(var g=[],h=!1,l=a.length,k=0;k<l;k++){var m=a[k];d[m.b]+=m.h;e[m.b]+=m.g;for(var p=!1,f=0;f<b;f++)if(d[f]&&!e[f]){p=!0;break}if(p)for(f=b;f<=c;f++)if(d[f]||e[f]){p=!1;break}h!=p&&(g.push(m.f),h=p)}return g}function $f(a,b){return b?Math.ceil(a/b)*b:a}function ag(a,b){return b?Math.floor(a/b)*b:a}function bg(a){return new Nf(a.b,-a.f)}function cg(a){return new Mf(a.ba,-a.aa,a.Y,-a.ia)}
function dg(a){return new Sf(Oa(a.b,bg))}
function eg(a,b,c,d,e){e&&(a=cg(a),b=Oa(b,dg),c=Oa(c,dg));e=b.length;var f=c?c.length:0,g=[],h=[],l,k,m;for(l=0;l<e;l++)Tf(b[l],h,l);for(l=0;l<f;l++)Tf(c[l],h,l+e);b=h.length;h.sort(Rf);for(c=0;h[c].g>=e;)c++;c=h[c].b.b;c>a.ba&&g.push(new Qf(a.ba,c,a.aa,a.aa));l=0;for(var p=[];l<b&&(m=h[l]).b.b<c;)m.f.b>c&&p.push(m),l++;for(;l<b||0<p.length;){var q=a.Y,w=$f(Math.ceil(c+8),d);for(k=0;k<p.length&&q>w;k++)m=p[k],m.b.f==m.f.f?m.f.b<q&&(q=Math.max(ag(m.f.b,d),w)):m.b.f!=m.f.f&&(q=w);q>a.Y&&(q=a.Y);for(;l<
b&&(m=h[l]).b.b<q;)if(m.f.b<c)l++;else if(m.b.b<w){if(m.b.b!=m.f.b||m.b.b!=c)p.push(m),q=w;l++}else{k=ag(m.b.b,d);k<q&&(q=k);break}w=[];for(k=0;k<p.length;k++)Yf(w,p[k],c,q);w.sort(function(a,b){return a.f-b.f||a.g-b.g});w=Zf(w,e,f);if(w.length){var r=0,x=a.ia;for(k=0;k<w.length;k+=2){var B=Math.max(a.ia,w[k]),G=Math.min(a.aa,w[k+1])-B;G>r&&(r=G,x=B)}r?g.push(new Qf(c,q,Math.max(x,a.ia),Math.min(x+r,a.aa))):g.push(new Qf(c,q,a.aa,a.aa))}else g.push(new Qf(c,q,a.aa,a.aa));if(q==a.Y)break;c=q;for(k=
p.length-1;0<=k;k--)p[k].f.b<=q&&p.splice(k,1)}fg(a,g);return g}function fg(a,b){for(var c=b.length-1,d=new Qf(a.Y,a.Y,a.ia,a.aa);0<=c;){var e=d,d=b[c];d.ia==e.ia&&d.aa==e.aa&&(e.ba=d.ba,b.splice(c,1),d=e);c--}}function gg(a,b){for(var c=0,d=a.length;c<d;){var e=Math.floor((c+d)/2);b>=a[e].Y?c=e+1:d=e}return c}
function hg(a,b,c,d){for(var e=c.ba,f=c.aa-c.ia,g=c.Y-c.ba,h=gg(b,e);;){var l=e+g;if(l>a.Y)break;for(var k=a.ia,m=a.aa,p=h;p<b.length&&b[p].ba<l;p++){var q=b[p];q.ia>k&&(k=q.ia);q.aa<m&&(m=q.aa)}if(k+f<=m||h>=b.length){"left"==d?(c.ia=k,c.aa=k+f):(c.ia=m-f,c.aa=m);c.Y+=e-c.ba;c.ba=e;break}e=b[h].Y;h++}}
function ig(a,b,c,d){for(c=[new Qf(c.ba,c.Y,c.ia,c.aa)];0<c.length&&c[0].Y<=a.ba;)c.shift();if(c.length){c[0].ba<a.ba&&(c[0].ba=a.ba);var e;e=b.length?b[b.length-1].Y:a.ba;e<a.Y&&b.push(new Qf(e,a.Y,a.ia,a.aa));for(var f=gg(b,c[0].ba),g=0;g<c.length;g++){var h=c[g];if(f==b.length)break;b[f].ba<h.ba&&(e=b[f],f++,b.splice(f,0,new Qf(h.ba,e.Y,e.ia,e.aa)),e.Y=h.ba);for(;f<b.length&&(e=b[f++],e.Y>h.Y&&(b.splice(f,0,new Qf(h.Y,e.Y,e.ia,e.aa)),e.Y=h.Y),h.ia!=h.aa&&("left"==d?e.ia=Math.min(h.aa,a.aa):e.aa=
Math.max(h.ia,a.ia)),e.Y!=h.Y););}fg(a,b)}};function jg(){this.b={}}t(jg,nc);jg.prototype.Fb=function(a){this.b[a.name]=!0;return a};jg.prototype.rb=function(a){this.Gb(a.values);return a};function kg(a){this.value=a}t(kg,nc);kg.prototype.fc=function(a){this.value=a.H;return a};function lg(a,b){if(a){var c=new kg(b);try{return a.$(c),c.value}catch(d){u.b(d,"toInt: ")}}return b}function mg(){this.f=!1;this.b=[];this.name=null}t(mg,nc);mg.prototype.hc=function(a){this.f&&this.b.push(a);return null};
mg.prototype.gc=function(a){this.f&&!a.H&&this.b.push(new D(0,"px"));return null};mg.prototype.rb=function(a){this.Gb(a.values);return null};mg.prototype.tb=function(a){this.f||(this.f=!0,this.Gb(a.values),this.f=!1,this.name=a.name.toLowerCase());return null};
function ng(a,b,c,d,e,f){if(a){var g=new mg;try{a.$(g);var h;a:{if(0<g.b.length){a=[];for(var l=0;l<g.b.length;l++){var k=g.b[l];if("%"==k.ea){var m=l%2?e:d;3==l&&"circle"==g.name&&(m=Math.sqrt((d*d+e*e)/2));a.push(k.H*m/100)}else a.push(k.H*Ab(f,k.ea,!1))}switch(g.name){case "polygon":if(!(a.length%2)){f=[];for(g=0;g<a.length;g+=2)f.push(new Nf(b+a[g],c+a[g+1]));h=new Sf(f);break a}break;case "rectangle":if(4==a.length){h=Vf(b+a[0],c+a[1],b+a[0]+a[2],c+a[1]+a[3]);break a}break;case "ellipse":if(4==
a.length){h=Uf(b+a[0],c+a[1],a[2],a[3]);break a}break;case "circle":if(3==a.length){h=Uf(b+a[0],c+a[1],a[2],a[2]);break a}}}h=null}return h}catch(p){u.b(p,"toShape:")}}return Vf(b,c,b+d,c+e)}function og(a){this.f=a;this.b={};this.name=null}t(og,nc);og.prototype.Fb=function(a){this.name=a.toString();this.b[this.name]=this.f?0:(this.b[this.name]||0)+1;return a};og.prototype.fc=function(a){this.name&&(this.b[this.name]+=a.H-(this.f?0:1));return a};og.prototype.rb=function(a){this.Gb(a.values);return a};
function pg(a,b){var c=new og(b);try{a.$(c)}catch(d){u.b(d,"toCounters:")}return c.b}function qg(a,b){this.b=a;this.f=b}t(qg,oc);qg.prototype.ic=function(a){return new Bc(this.f.Cc(a.url,this.b))};function rg(a){this.g=this.h=null;this.f=0;this.b=a}function sg(a,b){this.b=-1;this.f=a;this.g=b}function tg(){this.b=[];this.f=[];this.match=[];this.g=[];this.error=[];this.h=!0}tg.prototype.connect=function(a,b){for(var c=0;c<a.length;c++)this.f[a[c]].b=b;a.splice(0,a.length)};
tg.prototype.clone=function(){for(var a=new tg,b=0;b<this.b.length;b++){var c=this.b[b],d=new rg(c.b);d.f=c.f;a.b.push(d)}for(b=0;b<this.f.length;b++)c=this.f[b],d=new sg(c.f,c.g),d.b=c.b,a.f.push(d);a.match.push.apply(a.match,this.match);a.g.push.apply(a.g,this.g);a.error.push.apply(a.error,this.error);return a};
function ug(a,b,c,d){var e=a.b.length,f=new rg(vg);f.f=0<=d?c?2*d+1:2*d+2:c?-1:-2;a.b.push(f);a.connect(b,e);c=new sg(e,!0);e=new sg(e,!1);b.push(a.f.length);a.f.push(e);b.push(a.f.length);a.f.push(c)}function wg(a){return 1==a.b.length&&!a.b[0].f&&a.b[0].b instanceof xg}
function yg(a,b,c){if(b.b.length){var d=a.b.length;if(4==c&&1==d&&wg(b)&&wg(a)){c=a.b[0].b;b=b.b[0].b;var d={},e={},f;for(f in c.f)d[f]=c.f[f];for(f in b.f)d[f]=b.f[f];for(var g in c.g)e[g]=c.g[g];for(g in b.g)e[g]=b.g[g];a.b[0].b=new xg(c.b|b.b,d,e)}else{for(f=0;f<b.b.length;f++)a.b.push(b.b[f]);4==c?(a.h=!0,a.connect(a.g,d)):a.connect(a.match,d);g=a.f.length;for(f=0;f<b.f.length;f++)e=b.f[f],e.f+=d,0<=e.b&&(e.b+=d),a.f.push(e);for(f=0;f<b.match.length;f++)a.match.push(b.match[f]+g);3==c&&a.connect(a.match,
d);if(2==c||3==c)for(f=0;f<b.g.length;f++)a.match.push(b.g[f]+g);else if(a.h){for(f=0;f<b.g.length;f++)a.g.push(b.g[f]+g);a.h=b.h}else for(f=0;f<b.g.length;f++)a.error.push(b.g[f]+g);for(f=0;f<b.error.length;f++)a.error.push(b.error[f]+g);b.b=null;b.f=null}}}var U={};function zg(){}t(zg,nc);zg.prototype.h=function(a,b){var c=a[b].$(this);return c?[c]:null};function xg(a,b,c){this.b=a;this.f=b;this.g=c}t(xg,zg);n=xg.prototype;n.Id=function(a){return this.b&1?a:null};
n.Jd=function(a){return this.b&2048?a:null};n.Dc=function(a){return this.b&2?a:null};n.Fb=function(a){var b=this.f[a.name.toLowerCase()];return b?b:this.b&4?a:null};n.hc=function(a){return a.H||this.b&512?0>a.H&&!(this.b&256)?null:this.g[a.ea]?a:null:"%"==a.ea&&this.b&1024?a:null};n.gc=function(a){return a.H?0>=a.H&&!(this.b&256)?null:this.b&16?a:null:this.b&512?a:null};n.fc=function(a){return a.H?0>=a.H&&!(this.b&256)?null:this.b&48?a:(a=this.f[""+a.H])?a:null:this.b&512?a:null};
n.cd=function(a){return this.b&64?a:null};n.ic=function(a){return this.b&128?a:null};n.rb=function(){return null};n.Eb=function(){return null};n.tb=function(){return null};n.ec=function(){return null};var vg=new xg(0,U,U);
function Ag(a){this.b=new rg(null);var b=this.g=new rg(null),c=a.b.length;a.b.push(this.b);a.b.push(b);a.connect(a.match,c);a.connect(a.g,c+1);a.connect(a.error,c+1);for(b=0;b<a.f.length;b++){var d=a.f[b];d.g?a.b[d.f].h=a.b[d.b]:a.b[d.f].g=a.b[d.b]}for(b=0;b<c;b++)if(!a.b[b].g||!a.b[b].h)throw Error("Invalid validator state");this.f=a.b[0]}t(Ag,zg);
function Bg(a,b,c,d){for(var e=c?[]:b,f=a.f,g=d,h=null,l=null;f!==a.b&&f!==a.g;)if(g>=b.length)f=f.g;else{var k=b[g],m;if(f.f)m=!0,-1==f.f?(h?h.push(l):h=[l],l=[]):-2==f.f?0<h.length?l=h.pop():l=null:0<f.f&&!(f.f%2)?l[Math.floor((f.f-1)/2)]="taken":m=null==l[Math.floor((f.f-1)/2)],f=m?f.h:f.g;else{if(!g&&!c&&f.b instanceof Cg&&a instanceof Cg){if(m=(new pc(b)).$(f.b)){g=b.length;f=f.h;continue}}else if(!g&&!c&&f.b instanceof Dg&&a instanceof Cg){if(m=(new qc(b)).$(f.b)){g=b.length;f=f.h;continue}}else m=
k.$(f.b);if(m){if(m!==k&&b===e)for(e=[],k=0;k<g;k++)e[k]=b[k];b!==e&&(e[g-d]=m);g++;f=f.h}else f=f.g}}return f===a.b&&(c?0<e.length:g==b.length)?e:null}n=Ag.prototype;n.fb=function(a){for(var b=null,c=this.f;c!==this.b&&c!==this.g;)a?c.f?c=c.h:(b=a.$(c.b))?(a=null,c=c.h):c=c.g:c=c.g;return c===this.b?b:null};n.Id=function(a){return this.fb(a)};n.Jd=function(a){return this.fb(a)};n.Dc=function(a){return this.fb(a)};n.Fb=function(a){return this.fb(a)};n.hc=function(a){return this.fb(a)};n.gc=function(a){return this.fb(a)};
n.fc=function(a){return this.fb(a)};n.cd=function(a){return this.fb(a)};n.ic=function(a){return this.fb(a)};n.rb=function(){return null};n.Eb=function(){return null};n.tb=function(a){return this.fb(a)};n.ec=function(){return null};function Cg(a){Ag.call(this,a)}t(Cg,Ag);Cg.prototype.rb=function(a){var b=Bg(this,a.values,!1,0);return b===a.values?a:b?new pc(b):null};
Cg.prototype.Eb=function(a){for(var b=this.f,c=!1;b;){if(b.b instanceof Dg){c=!0;break}b=b.g}return c?(b=Bg(this,a.values,!1,0),b===a.values?a:b?new qc(b):null):null};Cg.prototype.h=function(a,b){return Bg(this,a,!0,b)};function Dg(a){Ag.call(this,a)}t(Dg,Ag);Dg.prototype.rb=function(a){return this.fb(a)};Dg.prototype.Eb=function(a){var b=Bg(this,a.values,!1,0);return b===a.values?a:b?new qc(b):null};Dg.prototype.h=function(a,b){for(var c=this.f,d;c!==this.g;){if(d=c.b.h(a,b))return d;c=c.g}return null};
function Eg(a,b){Ag.call(this,b);this.name=a}t(Eg,Ag);Eg.prototype.fb=function(){return null};Eg.prototype.tb=function(a){if(a.name.toLowerCase()!=this.name)return null;var b=Bg(this,a.values,!1,0);return b===a.values?a:b?new rc(a.name,b):null};function Fg(){}Fg.prototype.b=function(a,b){return b};Fg.prototype.g=function(){};function Gg(a,b){this.name=b;this.h=a.g[this.name]}t(Gg,Fg);
Gg.prototype.b=function(a,b,c){if(c.values[this.name])return b;if(a=this.h.h(a,b)){var d=a.length;this.g(1<d?new pc(a):a[0],c);return b+d}return b};Gg.prototype.g=function(a,b){b.values[this.name]=a};function Hg(a,b){Gg.call(this,a,b[0]);this.f=b}t(Hg,Gg);Hg.prototype.g=function(a,b){for(var c=0;c<this.f.length;c++)b.values[this.f[c]]=a};function Ig(a,b){this.f=a;this.Zd=b}t(Ig,Fg);
Ig.prototype.b=function(a,b,c){var d=b;if(this.Zd)if(a[b]==vc){if(++b==a.length)return d}else return d;var e=this.f[0].b(a,b,c);if(e==b)return d;b=e;for(d=1;d<this.f.length&&b<a.length;d++){e=this.f[d].b(a,b,c);if(e==b)break;b=e}return b};function Jg(){this.b=this.cb=null;this.error=!1;this.values={};this.f=null}n=Jg.prototype;n.clone=function(){var a=new this.constructor;a.cb=this.cb;a.b=this.b;a.f=this.f;return a};n.Kd=function(a,b){this.cb=a;this.b=b};n.Vb=function(){this.error=!0;return 0};
function Kg(a,b){a.Vb([b]);return null}n.Id=function(a){return Kg(this,a)};n.Dc=function(a){return Kg(this,a)};n.Fb=function(a){return Kg(this,a)};n.hc=function(a){return Kg(this,a)};n.gc=function(a){return Kg(this,a)};n.fc=function(a){return Kg(this,a)};n.cd=function(a){return Kg(this,a)};n.ic=function(a){return Kg(this,a)};n.rb=function(a){this.Vb(a.values);return null};n.Eb=function(){this.error=!0;return null};n.tb=function(a){return Kg(this,a)};n.ec=function(){this.error=!0;return null};
function Lg(){Jg.call(this)}t(Lg,Jg);Lg.prototype.Vb=function(a){for(var b=0,c=0;b<a.length;){var d=this.cb[c].b(a,b,this);if(d>b)b=d,c=0;else if(++c==this.cb.length){this.error=!0;break}}return b};function Mg(){Jg.call(this)}t(Mg,Jg);Mg.prototype.Vb=function(a){if(a.length>this.cb.length||!a.length)return this.error=!0,0;for(var b=0;b<this.cb.length;b++){for(var c=b;c>=a.length;)c=1==c?0:c-2;if(this.cb[b].b(a,c,this)!=c+1)return this.error=!0,0}return a.length};function Ng(){Jg.call(this)}t(Ng,Jg);
Ng.prototype.Vb=function(a){for(var b=a.length,c=0;c<a.length;c++)if(a[c]===vc){b=c;break}if(b>this.cb.length||!a.length)return this.error=!0,0;for(c=0;c<this.cb.length;c++){for(var d=c;d>=b;)d=1==d?0:d-2;var e;if(b+1<a.length)for(e=b+c+1;e>=a.length;)e-=e==b+2?1:2;else e=d;if(2!=this.cb[c].b([a[d],a[e]],0,this))return this.error=!0,0}return a.length};function Og(){Jg.call(this)}t(Og,Lg);
Og.prototype.Eb=function(a){for(var b={},c=0;c<a.values.length;c++){this.values={};if(a.values[c]instanceof qc)this.error=!0;else{a.values[c].$(this);for(var d=b,e=this.values,f=0;f<this.b.length;f++){var g=this.b[f],h=e[g]||this.f.l[g],l=d[g];l||(l=[],d[g]=l);l.push(h)}this.values["background-color"]&&c!=a.values.length-1&&(this.error=!0)}if(this.error)return null}this.values={};for(var k in b)this.values[k]="background-color"==k?b[k].pop():new qc(b[k]);return null};function Pg(){Jg.call(this)}
t(Pg,Lg);Pg.prototype.Kd=function(a,b){Lg.prototype.Kd.call(this,a,b);this.b.push("font-family","line-height","font-size")};
Pg.prototype.Vb=function(a){var b=Lg.prototype.Vb.call(this,a);if(b+2>a.length)return this.error=!0,b;this.error=!1;var c=this.f.g;if(!a[b].$(c["font-size"]))return this.error=!0,b;this.values["font-size"]=a[b++];if(a[b]===vc){b++;if(b+2>a.length||!a[b].$(c["line-height"]))return this.error=!0,b;this.values["line-height"]=a[b++]}var d=b==a.length-1?a[b]:new pc(a.slice(b,a.length));if(!d.$(c["font-family"]))return this.error=!0,b;this.values["font-family"]=d;return a.length};
Pg.prototype.Eb=function(a){a.values[0].$(this);if(this.error)return null;for(var b=[this.values["font-family"]],c=1;c<a.values.length;c++)b.push(a.values[c]);a=new qc(b);a.$(this.f.g["font-family"])?this.values["font-family"]=a:this.error=!0;return null};Pg.prototype.Fb=function(a){if(a=this.f.f[a.name])for(var b in a)this.values[b]=a[b];else this.error=!0;return null};var Qg={SIMPLE:Lg,INSETS:Mg,INSETS_SLASH:Ng,COMMA:Og,FONT:Pg};
function Rg(){this.g={};this.w={};this.l={};this.b={};this.f={};this.h={};this.u=[];this.j=[]}function Sg(a,b){var c;if(3==b.type)c=new D(b.H,b.text);else if(7==b.type)c=Ze(b.text);else if(1==b.type)c=C(b.text);else throw Error("unexpected replacement");if(wg(a)){var d=a.b[0].b.f,e;for(e in d)d[e]=c;return a}throw Error("unexpected replacement");}
function Tg(a,b,c){for(var d=new tg,e=0;e<b;e++)yg(d,a.clone(),1);if(c==Number.POSITIVE_INFINITY)yg(d,a,3);else for(e=b;e<c;e++)yg(d,a.clone(),2);return d}function Ug(a){var b=new tg,c=b.b.length;b.b.push(new rg(a));a=new sg(c,!0);var d=new sg(c,!1);b.connect(b.match,c);b.h?(b.g.push(b.f.length),b.h=!1):b.error.push(b.f.length);b.f.push(d);b.match.push(b.f.length);b.f.push(a);return b}
function Vg(a,b){var c;switch(a){case "COMMA":c=new Dg(b);break;case "SPACE":c=new Cg(b);break;default:c=new Eg(a.toLowerCase(),b)}return Ug(c)}
function Wg(a){a.b.HASHCOLOR=Ug(new xg(64,U,U));a.b.POS_INT=Ug(new xg(32,U,U));a.b.POS_NUM=Ug(new xg(16,U,U));a.b.POS_PERCENTAGE=Ug(new xg(8,U,{"%":A}));a.b.NEGATIVE=Ug(new xg(256,U,U));a.b.ZERO=Ug(new xg(512,U,U));a.b.ZERO_PERCENTAGE=Ug(new xg(1024,U,U));a.b.POS_LENGTH=Ug(new xg(8,U,{em:A,ex:A,ch:A,rem:A,vh:A,vw:A,vmin:A,vmax:A,cm:A,mm:A,"in":A,px:A,pt:A,pc:A,q:A}));a.b.POS_ANGLE=Ug(new xg(8,U,{deg:A,grad:A,rad:A,turn:A}));a.b.POS_TIME=Ug(new xg(8,U,{s:A,ms:A}));a.b.FREQUENCY=Ug(new xg(8,U,{Hz:A,
kHz:A}));a.b.RESOLUTION=Ug(new xg(8,U,{dpi:A,dpcm:A,dppx:A}));a.b.URI=Ug(new xg(128,U,U));a.b.IDENT=Ug(new xg(4,U,U));a.b.STRING=Ug(new xg(2,U,U));a.b.SLASH=Ug(new xg(2048,U,U));var b={"font-family":C("sans-serif")};a.f.caption=b;a.f.icon=b;a.f.menu=b;a.f["message-box"]=b;a.f["small-caption"]=b;a.f["status-bar"]=b}function Xg(a){return!!a.match(/^[A-Z_0-9]+$/)}
function Yg(a,b,c){var d=N(b);if(0==d.type)return null;var e={"":!0};if(14==d.type){do{Q(b);d=N(b);if(1!=d.type)throw Error("Prefix name expected");e[d.text]=!0;Q(b);d=N(b)}while(16==d.type);if(15!=d.type)throw Error("']' expected");Q(b);d=N(b)}if(1!=d.type)throw Error("Property name expected");if(2==c?"SHORTHANDS"==d.text:"DEFAULTS"==d.text)return Q(b),null;d=d.text;Q(b);if(2!=c){if(39!=N(b).type)throw Error("'=' expected");Xg(d)||(a.w[d]=e)}else if(18!=N(b).type)throw Error("':' expected");return d}
function Zg(a,b){for(;;){var c=Yg(a,b,1);if(!c)break;for(var d=[],e=[],f="",g,h=!0,l=function(){if(!d.length)throw Error("No values");var a;if(1==d.length)a=d[0];else{var b=f,c=d;a=new tg;if("||"==b){for(b=0;b<c.length;b++){var e=new tg,g=e;if(g.b.length)throw Error("invalid call");var h=new rg(vg);h.f=2*b+1;g.b.push(h);var h=new sg(0,!0),l=new sg(0,!1);g.g.push(g.f.length);g.f.push(l);g.match.push(g.f.length);g.f.push(h);yg(e,c[b],1);ug(e,e.match,!1,b);yg(a,e,b?4:1)}c=new tg;if(c.b.length)throw Error("invalid call");
ug(c,c.match,!0,-1);yg(c,a,3);a=[c.match,c.g,c.error];for(b=0;b<a.length;b++)ug(c,a[b],!1,-1);a=c}else{switch(b){case " ":e=1;break;case "|":case "||":e=4;break;default:throw Error("unexpected op");}for(b=0;b<c.length;b++)yg(a,c[b],b?e:1)}}return a},k=function(a){if(h)throw Error("'"+a+"': unexpected");if(f&&f!=a)throw Error("mixed operators: '"+a+"' and '"+f+"'");f=a;h=!0},m=null;!m;)switch(Q(b),g=N(b),g.type){case 1:h||k(" ");if(Xg(g.text)){var p=a.b[g.text];if(!p)throw Error("'"+g.text+"' unexpected");
d.push(p.clone())}else p={},p[g.text.toLowerCase()]=C(g.text),d.push(Ug(new xg(0,p,U)));h=!1;break;case 5:p={};p[""+g.H]=new zc(g.H);d.push(Ug(new xg(0,p,U)));h=!1;break;case 34:k("|");break;case 25:k("||");break;case 14:h||k(" ");e.push({be:d,Xd:f,kc:"["});f="";d=[];h=!0;break;case 6:h||k(" ");e.push({be:d,Xd:f,kc:"(",Yb:g.text});f="";d=[];h=!0;break;case 15:g=l();p=e.pop();if("["!=p.kc)throw Error("']' unexpected");d=p.be;d.push(g);f=p.Xd;h=!1;break;case 11:g=l();p=e.pop();if("("!=p.kc)throw Error("')' unexpected");
d=p.be;d.push(Vg(p.Yb,g));f=p.Xd;h=!1;break;case 18:if(h)throw Error("':' unexpected");Q(b);d.push(Sg(d.pop(),N(b)));break;case 22:if(h)throw Error("'?' unexpected");d.push(Tg(d.pop(),0,1));break;case 36:if(h)throw Error("'*' unexpected");d.push(Tg(d.pop(),0,Number.POSITIVE_INFINITY));break;case 23:if(h)throw Error("'+' unexpected");d.push(Tg(d.pop(),1,Number.POSITIVE_INFINITY));break;case 12:Q(b);g=N(b);if(5!=g.type)throw Error("<int> expected");var q=p=g.H;Q(b);g=N(b);if(16==g.type){Q(b);g=N(b);
if(5!=g.type)throw Error("<int> expected");q=g.H;Q(b);g=N(b)}if(13!=g.type)throw Error("'}' expected");d.push(Tg(d.pop(),p,q));break;case 17:m=l();if(0<e.length)throw Error("unclosed '"+e.pop().kc+"'");break;default:throw Error("unexpected token");}Q(b);Xg(c)?a.b[c]=m:a.g[c]=1!=m.b.length||m.b[0].f?new Cg(m):m.b[0].b}}
function $g(a,b){for(var c={},d=0;d<b.length;d++)for(var e=b[d],f=a.h[e],e=f?f.b:[e],f=0;f<e.length;f++){var g=e[f],h=a.l[g];h?c[g]=h:u.b("Unknown property in makePropSet:",g)}return c}
function ah(a,b,c,d,e){var f="",g=b;b=b.toLowerCase();var h=b.match(/^-([a-z]+)-([-a-z0-9]+)$/);h&&(f=h[1],b=h[2]);if((h=a.w[b])&&h[f])if(f=a.g[b])(a=c===Yc||c.Td()?c:c.$(f))?e.pb(b,a,d):e.qc(g,c);else if(b=a.h[b].clone(),c===Yc)for(c=0;c<b.b.length;c++)e.pb(b.b[c],Yc,d);else{c.$(b);if(b.error)d=!1;else{for(a=0;a<b.b.length;a++)f=b.b[a],e.pb(f,b.values[f]||b.f.l[f],d);d=!0}d||e.qc(g,c)}else e.ad(g,c)}
var bh=new ge(function(){var a=H("loadValidatorSet.load"),b=la("validation.txt",ka),c=Te(b),d=new Rg;Wg(d);c.then(function(c){try{if(c.responseText){var e=new Qe(c.responseText,null);for(Zg(d,e);;){var g=Yg(d,e,2);if(!g)break;for(c=[];;){Q(e);var h=N(e);if(17==h.type){Q(e);break}switch(h.type){case 1:c.push(C(h.text));break;case 4:c.push(new yc(h.H));break;case 5:c.push(new zc(h.H));break;case 3:c.push(new D(h.H,h.text));break;default:throw Error("unexpected token");}}d.l[g]=1<c.length?new pc(c):
c[0]}for(;;){var l=Yg(d,e,3);if(!l)break;var k=O(e,1),m;1==k.type&&Qg[k.text]?(m=new Qg[k.text],Q(e)):m=new Lg;m.f=d;g=!1;h=[];c=!1;for(var p=[],q=[];!g;)switch(Q(e),k=N(e),k.type){case 1:if(d.g[k.text])h.push(new Gg(m.f,k.text)),q.push(k.text);else if(d.h[k.text]instanceof Mg){var w=d.h[k.text];h.push(new Hg(w.f,w.b));q.push.apply(q,w.b)}else throw Error("'"+k.text+"' is neither a simple property nor an inset shorthand");break;case 19:if(0<h.length||c)throw Error("unexpected slash");c=!0;break;case 14:p.push({Zd:c,
cb:h});h=[];c=!1;break;case 15:var r=new Ig(h,c),x=p.pop(),h=x.cb;c=x.Zd;h.push(r);break;case 17:g=!0;Q(e);break;default:throw Error("unexpected token");}m.Kd(h,q);d.h[l]=m}d.j=$g(d,["background"]);d.u=$g(d,"margin border padding columns column-gap column-rule column-fill".split(" "))}else u.error("Error: missing",b)}catch(B){u.error(B,"Error:")}L(a,d)});return J(a)},"validatorFetcher");var ch={azimuth:!0,"border-collapse":!0,"border-spacing":!0,"caption-side":!0,"clip-rule":!0,color:!0,"color-interpolation":!0,"color-rendering":!0,cursor:!0,direction:!0,elevation:!0,"empty-cells":!0,fill:!0,"fill-opacity":!0,"fill-rule":!0,"font-kerning":!0,"font-size":!0,"font-size-adjust":!0,"font-family":!0,"font-feature-settings":!0,"font-style":!0,"font-stretch":!0,"font-variant":!0,"font-weight":!0,"glyph-orientation-vertical":!0,hyphens:!0,"hyphenate-character":!0,"hyphenate-limit-chars":!0,
"hyphenate-limit-last":!0,"image-rendering":!0,"image-resolution":!0,"letter-spacing":!0,"line-break":!0,"line-height":!0,"list-style-image":!0,"list-style-position":!0,"list-style-type":!0,marker:!0,"marker-end":!0,"marker-mid":!0,"marker-start":!0,orphans:!0,"overflow-wrap":!0,"paint-order":!0,"pointer-events":!0,"pitch-range":!0,quotes:!0,richness:!0,"ruby-align":!0,"ruby-position":!0,"speak-header":!0,"speak-numeral":!0,"speak-punctuation":!0,"speech-rate":!0,"shape-rendering":!0,stress:!0,stroke:!0,
"stroke-dasharray":!0,"stroke-dashoffset":!0,"stroke-linecap":!0,"stroke-linejoin":!0,"stroke-miterlimit":!0,"stroke-opacity":!0,"stroke-width":!0,"tab-size":!0,"text-align":!0,"text-align-last":!0,"text-anchor":!0,"text-decoration-skip":!0,"text-emphasis-color":!0,"text-emphasis-position":!0,"text-emphasis-style":!0,"text-combine-upright":!0,"text-indent":!0,"text-justify":!0,"text-rendering":!0,"text-size-adjust":!0,"text-transform":!0,"text-underline-position":!0,visibility:!0,"voice-family":!0,
volume:!0,"white-space":!0,widows:!0,"word-break":!0,"word-spacing":!0,"word-wrap":!0,"writing-mode":!0},dh=["box-decoration-break","image-resolution","orphans","widows"];function eh(){return(Ed.POLYFILLED_INHERITED_PROPS||[]).reduce(function(a,b){return a.concat(b())},[].concat(dh))}
for(var fh={"http://www.idpf.org/2007/ops":!0,"http://www.w3.org/1999/xhtml":!0,"http://www.w3.org/2000/svg":!0},gh="margin-% padding-% border-%-width border-%-style border-%-color %".split(" "),hh=["left","right","top","bottom"],ih={width:!0,height:!0},jh=0;jh<gh.length;jh++)for(var kh=0;kh<hh.length;kh++){var lh=gh[jh].replace("%",hh[kh]);ih[lh]=!0}function mh(a){for(var b={},c=0;c<gh.length;c++)for(var d in a){var e=gh[c].replace("%",d),f=gh[c].replace("%",a[d]);b[e]=f;b[f]=e}return b}
var nh=mh({before:"right",after:"left",start:"top",end:"bottom"}),oh=mh({before:"top",after:"bottom",start:"left",end:"right"});function V(a,b){this.value=a;this.Qa=b}n=V.prototype;n.he=function(){return this};n.Lc=function(a){a=this.value.$(a);return a===this.value?this:new V(a,this.Qa)};n.ke=function(a){return a?new V(this.value,this.Qa+a):this};n.evaluate=function(a,b){return Lf(a,this.value,b)};n.ce=function(){return!0};function ph(a,b,c){V.call(this,a,b);this.T=c}t(ph,V);
ph.prototype.he=function(){return new V(this.value,this.Qa)};ph.prototype.Lc=function(a){a=this.value.$(a);return a===this.value?this:new ph(a,this.Qa,this.T)};ph.prototype.ke=function(a){return a?new ph(this.value,this.Qa+a,this.T):this};ph.prototype.ce=function(a){return!!this.T.evaluate(a)};function qh(a,b,c){return(!b||c.Qa>b.Qa)&&c.ce(a)?c.he():b}var rh={"region-id":!0};function sh(a){return"_"!=a.charAt(0)&&!rh[a]}function th(a,b,c){c?a[b]=c:delete a[b]}
function uh(a,b){var c=a[b];c||(c={},a[b]=c);return c}function vh(a,b){var c=a[b];c||(c=[],a[b]=c);return c}function wh(a,b,c,d,e,f){if(e){var g=uh(b,"_pseudos");b=g[e];b||(b={},g[e]=b)}f&&(e=uh(b,"_regions"),b=e[f],b||(b={},e[f]=b));for(var h in c)"_"!=h.charAt(0)&&(rh[h]?(f=c[h],e=vh(b,h),Array.prototype.push.apply(e,f)):th(b,h,qh(a,b[h],c[h].ke(d))))}
function xh(a,b){if(0<a.length){a.sort(function(a,b){return b.f()-a.f()});for(var c=null,d=a.length-1;0<=d;d--)c=a[d],c.b=b,b=c;return c}return b}function yh(a,b){this.g=a;this.b=b;this.f=""}t(yh,oc);function zh(a){a=a.g["font-size"].value;var b;a:switch(a.ea.toLowerCase()){case "px":case "in":case "pt":case "pc":case "cm":case "mm":case "q":b=!0;break a;default:b=!1}if(!b)throw Error("Unexpected state");return a.H*wb[a.ea]}
yh.prototype.hc=function(a){if("em"==a.ea||"ex"==a.ea){var b=Ab(this.b,a.ea,!1)/Ab(this.b,"em",!1);return new D(a.H*b*zh(this),"px")}if("rem"==a.ea||"rex"==a.ea)return b=Ab(this.b,a.ea,!1)/Ab(this.b,"rem",!1),new D(a.H*b*this.b.fontSize(),"px");if("%"==a.ea){if("font-size"===this.f)return new D(a.H/100*zh(this),"px");if("line-height"===this.f)return a;b=this.f.match(/height|^(top|bottom)$/)?"vh":"vw";return new D(a.H,b)}return a};
yh.prototype.ec=function(a){return"font-size"==this.f?Lf(this.b,a,this.f).$(this):a};function Ah(){}Ah.prototype.apply=function(){};Ah.prototype.l=function(a){return new Bh([this,a])};Ah.prototype.clone=function(){return this};function Ch(a){this.b=a}t(Ch,Ah);Ch.prototype.apply=function(a){a.h[a.h.length-1].push(this.b.b())};function Bh(a){this.b=a}t(Bh,Ah);Bh.prototype.apply=function(a){for(var b=0;b<this.b.length;b++)this.b[b].apply(a)};Bh.prototype.l=function(a){this.b.push(a);return this};
Bh.prototype.clone=function(){return new Bh([].concat(this.b))};function Dh(a,b,c,d){this.style=a;this.W=b;this.b=c;this.h=d}t(Dh,Ah);Dh.prototype.apply=function(a){wh(a.l,a.D,this.style,this.W,this.b,this.h)};function W(){this.b=null}t(W,Ah);W.prototype.apply=function(a){this.b.apply(a)};W.prototype.f=function(){return 0};W.prototype.g=function(){return!1};function Eh(a){this.b=null;this.h=a}t(Eh,W);Eh.prototype.apply=function(a){0<=a.F.indexOf(this.h)&&this.b.apply(a)};Eh.prototype.f=function(){return 10};
Eh.prototype.g=function(a){this.b&&Fh(a.Ba,this.h,this.b);return!0};function Gh(a){this.b=null;this.id=a}t(Gh,W);Gh.prototype.apply=function(a){a.S!=this.id&&a.da!=this.id||this.b.apply(a)};Gh.prototype.f=function(){return 11};Gh.prototype.g=function(a){this.b&&Fh(a.g,this.id,this.b);return!0};function Hh(a){this.b=null;this.localName=a}t(Hh,W);Hh.prototype.apply=function(a){a.f==this.localName&&this.b.apply(a)};Hh.prototype.f=function(){return 8};
Hh.prototype.g=function(a){this.b&&Fh(a.Bc,this.localName,this.b);return!0};function Ih(a,b){this.b=null;this.h=a;this.localName=b}t(Ih,W);Ih.prototype.apply=function(a){a.f==this.localName&&a.j==this.h&&this.b.apply(a)};Ih.prototype.f=function(){return 8};Ih.prototype.g=function(a){if(this.b){var b=a.b[this.h];b||(b="ns"+a.j++ +":",a.b[this.h]=b);Fh(a.h,b+this.localName,this.b)}return!0};function Jh(a){this.b=null;this.h=a}t(Jh,W);
Jh.prototype.apply=function(a){var b=a.b;if(b&&"a"==a.f){var c=b.getAttribute("href");c&&c.match(/^#/)&&(b=b.ownerDocument.getElementById(c.substring(1)))&&(b=b.getAttributeNS("http://www.idpf.org/2007/ops","type"))&&b.match(this.h)&&this.b.apply(a)}};function Kh(a){this.b=null;this.h=a}t(Kh,W);Kh.prototype.apply=function(a){a.j==this.h&&this.b.apply(a)};function Lh(a,b){this.b=null;this.h=a;this.name=b}t(Lh,W);Lh.prototype.apply=function(a){a.b&&a.b.hasAttributeNS(this.h,this.name)&&this.b.apply(a)};
function Mh(a,b,c){this.b=null;this.h=a;this.name=b;this.value=c}t(Mh,W);Mh.prototype.apply=function(a){a.b&&a.b.getAttributeNS(this.h,this.name)==this.value&&this.b.apply(a)};Mh.prototype.f=function(){return"type"==this.name&&"http://www.idpf.org/2007/ops"==this.h?9:0};Mh.prototype.g=function(a){return"type"==this.name&&"http://www.idpf.org/2007/ops"==this.h?(this.b&&Fh(a.f,this.value,this.b),!0):!1};function Nh(a,b){this.b=null;this.h=a;this.name=b}t(Nh,W);
Nh.prototype.apply=function(a){if(a.b){var b=a.b.getAttributeNS(this.h,this.name);b&&fh[b]&&this.b.apply(a)}};Nh.prototype.f=function(){return 0};Nh.prototype.g=function(){return!1};function Oh(a,b,c){this.b=null;this.j=a;this.name=b;this.h=c}t(Oh,W);Oh.prototype.apply=function(a){if(a.b){var b=a.b.getAttributeNS(this.j,this.name);b&&b.match(this.h)&&this.b.apply(a)}};function Ph(a){this.b=null;this.h=a}t(Ph,W);Ph.prototype.apply=function(a){a.lang.match(this.h)&&this.b.apply(a)};
function Qh(){this.b=null}t(Qh,W);Qh.prototype.apply=function(a){a.Sa&&this.b.apply(a)};Qh.prototype.f=function(){return 6};function Rh(){this.b=null}t(Rh,W);Rh.prototype.apply=function(a){a.na&&this.b.apply(a)};Rh.prototype.f=function(){return 12};function Sh(a,b){this.b=null;this.h=a;this.kc=b}t(Sh,W);function Th(a,b){var c=a.h;b-=a.kc;return c?!(b%c)&&0<=b/c:!b}function Uh(a,b){Sh.call(this,a,b)}t(Uh,Sh);Uh.prototype.apply=function(a){Th(this,a.ta)&&this.b.apply(a)};Uh.prototype.f=function(){return 5};
function Vh(a,b){Sh.call(this,a,b)}t(Vh,Sh);Vh.prototype.apply=function(a){Th(this,a.mb[a.j][a.f])&&this.b.apply(a)};Vh.prototype.f=function(){return 5};function Wh(a,b){Sh.call(this,a,b)}t(Wh,Sh);Wh.prototype.apply=function(a){var b=a.M;null===b&&(b=a.M=a.b.parentNode.childElementCount-a.ta+1);Th(this,b)&&this.b.apply(a)};Wh.prototype.f=function(){return 4};function Xh(a,b){Sh.call(this,a,b)}t(Xh,Sh);
Xh.prototype.apply=function(a){var b=a.lb;if(!b[a.j]){var c=a.b;do{var d=c.namespaceURI,e=c.localName,f=b[d];f||(f=b[d]={});f[e]=(f[e]||0)+1}while(c=c.nextElementSibling)}Th(this,b[a.j][a.f])&&this.b.apply(a)};Xh.prototype.f=function(){return 4};function Yh(){this.b=null}t(Yh,W);Yh.prototype.apply=function(a){for(var b=a.b.firstChild;b;){switch(b.nodeType){case Node.ELEMENT_NODE:return;case Node.TEXT_NODE:if(0<b.length)return}b=b.nextSibling}this.b.apply(a)};Yh.prototype.f=function(){return 4};
function Zh(){this.b=null}t(Zh,W);Zh.prototype.apply=function(a){!1===a.b.disabled&&this.b.apply(a)};Zh.prototype.f=function(){return 5};function $h(){this.b=null}t($h,W);$h.prototype.apply=function(a){!0===a.b.disabled&&this.b.apply(a)};$h.prototype.f=function(){return 5};function ai(){this.b=null}t(ai,W);ai.prototype.apply=function(a){var b=a.b;!0!==b.selected&&!0!==b.checked||this.b.apply(a)};ai.prototype.f=function(){return 5};function bi(a){this.b=null;this.T=a}t(bi,W);
bi.prototype.apply=function(a){a.u[this.T]&&this.b.apply(a)};bi.prototype.f=function(){return 5};function ci(){this.b=!1}t(ci,Ah);ci.prototype.apply=function(){this.b=!0};ci.prototype.clone=function(){var a=new ci;a.b=this.b;return a};function di(a){this.b=null;this.h=new ci;this.j=xh(a,this.h)}t(di,W);di.prototype.apply=function(a){this.j.apply(a);this.h.b||this.b.apply(a);this.h.b=!1};di.prototype.f=function(){return this.j.f()};function ei(a){this.T=a}ei.prototype.b=function(){return this};
ei.prototype.push=function(a,b){b||fi(a,this.T);return!1};ei.prototype.pop=function(a,b){return b?!1:(a.u[this.T]--,!0)};function gi(a){this.T=a}gi.prototype.b=function(){return this};gi.prototype.push=function(a,b){b?1==b&&a.u[this.T]--:fi(a,this.T);return!1};gi.prototype.pop=function(a,b){if(b)1==b&&fi(a,this.T);else return a.u[this.T]--,!0;return!1};function hi(a){this.T=a;this.f=!1}hi.prototype.b=function(){return new hi(this.T)};
hi.prototype.push=function(a){return this.f?(a.u[this.T]--,!0):!1};hi.prototype.pop=function(a,b){if(this.f)return a.u[this.T]--,!0;b||(this.f=!0,fi(a,this.T));return!1};function ii(a){this.T=a;this.f=!1}ii.prototype.b=function(){return new ii(this.T)};ii.prototype.push=function(a,b){this.f&&(-1==b?fi(a,this.T):b||a.u[this.T]--);return!1};ii.prototype.pop=function(a,b){if(this.f){if(-1==b)return a.u[this.T]--,!0;b||fi(a,this.T)}else b||(this.f=!0,fi(a,this.T));return!1};
function ji(a,b){this.f=a;this.element=b}ji.prototype.b=function(){return this};ji.prototype.push=function(){return!1};ji.prototype.pop=function(a,b){return b?!1:(ki(a,this.f,this.element),!0)};function li(a){this.lang=a}li.prototype.b=function(){return this};li.prototype.push=function(){return!1};li.prototype.pop=function(a,b){return b?!1:(a.lang=this.lang,!0)};function mi(a){this.f=a}mi.prototype.b=function(){return this};mi.prototype.push=function(){return!1};
mi.prototype.pop=function(a,b){return b?!1:(a.I=this.f,!0)};function ni(a){this.element=a}t(ni,oc);function oi(a,b){switch(b){case "url":return a?new Bc(a):new Bc("about:invalid");default:return a?new wc(a):new wc("")}}
ni.prototype.tb=function(a){if("attr"!==a.name)return oc.prototype.tb.call(this,a);var b="string",c;a.values[0]instanceof pc?(2<=a.values[0].values.length&&(b=a.values[0].values[1].stringValue()),c=a.values[0].values[0].stringValue()):c=a.values[0].stringValue();a=1<a.values.length?oi(a.values[1].stringValue(),b):oi(null,b);return this.element&&this.element.hasAttribute(c)?oi(this.element.getAttribute(c),b):a};function pi(a,b,c){this.f=a;this.element=b;this.b=c}t(pi,oc);
pi.prototype.Fb=function(a){var b=this.f,c=b.I,d=Math.floor(c.length/2)-1;switch(a.name){case "open-quote":a=c[2*Math.min(d,b.B)];b.B++;break;case "close-quote":return 0<b.B&&b.B--,c[2*Math.min(d,b.B)+1];case "no-open-quote":return b.B++,new wc("");case "no-close-quote":return 0<b.B&&b.B--,new wc("")}return a};
var qi={roman:[4999,1E3,"M",900,"CM",500,"D",400,"CD",100,"C",90,"XC",50,"L",40,"XL",10,"X",9,"IX",5,"V",4,"IV",1,"I"],armenian:[9999,9E3,"\u0584",8E3,"\u0583",7E3,"\u0582",6E3,"\u0581",5E3,"\u0580",4E3,"\u057f",3E3,"\u057e",2E3,"\u057d",1E3,"\u057c",900,"\u057b",800,"\u057a",700,"\u0579",600,"\u0578",500,"\u0577",400,"\u0576",300,"\u0575",200,"\u0574",100,"\u0573",90,"\u0572",80,"\u0571",70,"\u0570",60,"\u056f",50,"\u056e",40,"\u056d",30,"\u056c",20,"\u056b",10,"\u056a",9,"\u0569",8,"\u0568",7,"\u0567",
6,"\u0566",5,"\u0565",4,"\u0564",3,"\u0563",2,"\u0562",1,"\u0561"],georgian:[19999,1E4,"\u10f5",9E3,"\u10f0",8E3,"\u10ef",7E3,"\u10f4",6E3,"\u10ee",5E3,"\u10ed",4E3,"\u10ec",3E3,"\u10eb",2E3,"\u10ea",1E3,"\u10e9",900,"\u10e8",800,"\u10e7",700,"\u10e6",600,"\u10e5",500,"\u10e4",400,"\u10f3",300,"\u10e2",200,"\u10e1",100,"\u10e0",90,"\u10df",80,"\u10de",70,"\u10dd",60,"\u10f2",50,"\u10dc",40,"\u10db",30,"\u10da",20,"\u10d9",10,"\u10d8",9,"\u10d7",8,"\u10f1",7,"\u10d6",6,"\u10d5",5,"\u10d4",4,"\u10d3",
3,"\u10d2",2,"\u10d1",1,"\u10d0"],hebrew:[999,400,"\u05ea",300,"\u05e9",200,"\u05e8",100,"\u05e7",90,"\u05e6",80,"\u05e4",70,"\u05e2",60,"\u05e1",50,"\u05e0",40,"\u05de",30,"\u05dc",20,"\u05db",19,"\u05d9\u05d8",18,"\u05d9\u05d7",17,"\u05d9\u05d6",16,"\u05d8\u05d6",15,"\u05d8\u05d5",10,"\u05d9",9,"\u05d8",8,"\u05d7",7,"\u05d6",6,"\u05d5",5,"\u05d4",4,"\u05d3",3,"\u05d2",2,"\u05d1",1,"\u05d0"]},ri={latin:"a-z",alpha:"a-z",greek:"\u03b1-\u03c1\u03c3-\u03c9",russian:"\u0430-\u0438\u043a-\u0449\u044d-\u044f"},
si={square:"\u25a0",disc:"\u2022",circle:"\u25e6",none:""},ti={sf:!1,nc:"\u96f6\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d",Qc:"\u5341\u767e\u5343",Ke:"\u8ca0"};
function ui(a){if(9999<a||-9999>a)return""+a;if(!a)return ti.nc.charAt(0);var b=new Aa;0>a&&(b.append(ti.Ke),a=-a);if(10>a)b.append(ti.nc.charAt(a));else if(ti.tf&&19>=a)b.append(ti.Qc.charAt(0)),a&&b.append(ti.Qc.charAt(a-10));else{var c=Math.floor(a/1E3);c&&(b.append(ti.nc.charAt(c)),b.append(ti.Qc.charAt(2)));if(c=Math.floor(a/100)%10)b.append(ti.nc.charAt(c)),b.append(ti.Qc.charAt(1));if(c=Math.floor(a/10)%10)b.append(ti.nc.charAt(c)),b.append(ti.Qc.charAt(0));(a%=10)&&b.append(ti.nc.charAt(a))}return b.toString()}
function vi(a,b){var c=!1,d=!1,e;if(e=b.match(/^upper-(.*)/))c=!0,b=e[1];else if(e=b.match(/^lower-(.*)/))d=!0,b=e[1];e="";if(qi[b])a:{e=qi[b];var f=a;if(f>e[0]||0>=f||f!=Math.round(f))e="";else{for(var g="",h=1;h<e.length;h+=2){var l=e[h],k=Math.floor(f/l);if(20<k){e="";break a}for(f-=k*l;0<k;)g+=e[h+1],k--}e=g}}else if(ri[b])if(e=a,0>=e||e!=Math.round(e))e="";else{g=ri[b];f=[];for(h=0;h<g.length;)if("-"==g.substr(h+1,1))for(k=g.charCodeAt(h),l=g.charCodeAt(h+2),h+=3;k<=l;k++)f.push(String.fromCharCode(k));
else f.push(g.substr(h++,1));g="";do e--,h=e%f.length,g=f[h]+g,e=(e-h)/f.length;while(0<e);e=g}else null!=si[b]?e=si[b]:"decimal-leading-zero"==b?(e=a+"",1==e.length&&(e="0"+e)):"cjk-ideographic"==b||"trad-chinese-informal"==b?e=ui(a):e=a+"";return c?e.toUpperCase():d?e.toLowerCase():e}
function wi(a,b){var c=b[0].toString(),d=1<b.length?b[1].stringValue():"decimal",e=a.f.g[c];if(e&&e.length)return new wc(vi(e&&e.length&&e[e.length-1]||0,d));c=new E(xi(a.b,c,function(a){return vi(a||0,d)}));return new pc([c])}
function yi(a,b){var c=b[0].toString(),d=b[1].stringValue(),e=2<b.length?b[2].stringValue():"decimal",f=a.f.g[c],g=new Aa;if(f&&f.length)for(var h=0;h<f.length;h++)0<h&&g.append(d),g.append(vi(f[h],e));c=new E(zi(a.b,c,function(a){var b=[];if(a.length)for(var c=0;c<a.length;c++)b.push(vi(a[c],e));a=g.toString();a.length&&b.push(a);return b.length?b.join(d):vi(0,e)}));return new pc([c])}
function Ai(a,b){var c=b[0],c=c instanceof Bc?c.url:c.stringValue(),d=b[1].toString(),e=2<b.length?b[2].stringValue():"decimal",c=new E(Bi(a.b,c,d,function(a){return vi(a||0,e)}));return new pc([c])}function Ci(a,b){var c=b[0],c=c instanceof Bc?c.url:c.stringValue(),d=b[1].toString(),e=b[2].stringValue(),f=3<b.length?b[3].stringValue():"decimal",c=new E(Di(a.b,c,d,function(a){a=a.map(function(a){return vi(a,f)});return a.length?a.join(e):vi(0,f)}));return new pc([c])}
pi.prototype.tb=function(a){switch(a.name){case "counter":if(2>=a.values.length)return wi(this,a.values);break;case "counters":if(3>=a.values.length)return yi(this,a.values);break;case "target-counter":if(3>=a.values.length)return Ai(this,a.values);break;case "target-counters":if(4>=a.values.length)return Ci(this,a.values)}u.b("E_CSS_CONTENT_PROP:",a.toString());return new wc("")};var Ei=1/1048576;function Fi(a,b){for(var c in a)b[c]=a[c].clone()}
function Gi(){this.j=0;this.b={};this.Bc={};this.h={};this.f={};this.Ba={};this.g={};this.sc={};this.order=0}Gi.prototype.clone=function(){var a=new Gi;a.j=this.j;for(var b in this.b)a.b[b]=this.b[b];Fi(this.Bc,a.Bc);Fi(this.h,a.h);Fi(this.f,a.f);Fi(this.Ba,a.Ba);Fi(this.g,a.g);Fi(this.sc,a.sc);a.order=this.order;return a};function Fh(a,b,c){var d=a[b];d&&(c=d.l(c));a[b]=c}
function Hi(a,b,c,d){this.w=a;this.l=b;this.Ub=c;this.kb=d;this.h=[[],[]];this.u={};this.F=this.D=this.b=null;this.oa=this.da=this.S=this.j=this.f="";this.U=this.J=null;this.na=this.Sa=!0;this.g={};this.G=[{}];this.I=[new wc("\u201c"),new wc("\u201d"),new wc("\u2018"),new wc("\u2019")];this.B=0;this.lang="";this.Kb=[0];this.ta=0;this.ma=[{}];this.mb=this.ma[0];this.M=null;this.Ib=[this.M];this.Jb=[{}];this.lb=this.ma[0];this.nb=[]}function fi(a,b){a.u[b]=(a.u[b]||0)+1}
function Ii(a,b,c){(b=b[c])&&b.apply(a)}var Ji=[];function Ki(a,b,c,d){a.b=null;a.D=d;a.j="";a.f="";a.S="";a.da="";a.F=b;a.oa="";a.J=Ji;a.U=c;Li(a)}function Mi(a,b,c){a.g[b]?a.g[b].push(c):a.g[b]=[c];c=a.G[a.G.length-1];c||(c={},a.G[a.G.length-1]=c);c[b]=!0}
function Ni(a,b){var c=Zc,d=b.display;d&&(c=d.evaluate(a.l));var e=null,f=d=null,g=b["counter-reset"];g&&(g=g.evaluate(a.l))&&(e=pg(g,!0));(g=b["counter-set"])&&(g=g.evaluate(a.l))&&(f=pg(g,!1));(g=b["counter-increment"])&&(g=g.evaluate(a.l))&&(d=pg(g,!1));"ol"!=a.f&&"ul"!=a.f||"http://www.w3.org/1999/xhtml"!=a.j||(e||(e={}),e["ua-list-item"]=0);c===ed&&(d||(d={}),d["ua-list-item"]=1);if(e)for(var h in e)Mi(a,h,e[h]);if(f)for(var l in f)a.g[l]?(h=a.g[l],h[h.length-1]=f[l]):Mi(a,l,f[l]);if(d)for(var k in d)a.g[k]||
Mi(a,k,0),h=a.g[k],h[h.length-1]+=d[k];c===ed&&(c=a.g["ua-list-item"],b["ua-list-item-count"]=new V(new yc(c[c.length-1]),0));a.G.push(null)}function Oi(a){var b=a.G.pop();if(b)for(var c in b)(b=a.g[c])&&(1==b.length?delete a.g[c]:b.pop())}function ki(a,b,c){Ni(a,b);b.content&&(b.content=b.content.Lc(new pi(a,c,a.kb)));Oi(a)}var Pi="before transclusion-before footnote-call footnote-marker inner first-letter first-line  transclusion-after after".split(" ");
function Qi(a,b,c){a.nb.push(b);a.U=null;a.b=b;a.D=c;a.j=b.namespaceURI;a.f=b.localName;var d=a.w.b[a.j];a.oa=d?d+a.f:"";a.S=b.getAttribute("id");a.da=b.getAttributeNS("http://www.w3.org/XML/1998/namespace","id");(d=b.getAttribute("class"))?a.F=d.split(/\s+/):a.F=Ji;(d=b.getAttributeNS("http://www.idpf.org/2007/ops","type"))?a.J=d.split(/\s+/):a.J=Ji;"style"==a.f&&"http://www.gribuser.ru/xml/fictionbook/2.0"==a.j&&(a.F=[b.getAttribute("name")||""]);if(d=za(b))a.h[a.h.length-1].push(new li(a.lang)),
a.lang=d.toLowerCase();var d=a.na,e=a.Kb;a.ta=++e[e.length-1];e.push(0);var e=a.ma,f=a.mb=e[e.length-1],g=f[a.j];g||(g=f[a.j]={});g[a.f]=(g[a.f]||0)+1;e.push({});e=a.Ib;null!==e[e.length-1]?a.M=--e[e.length-1]:a.M=null;e.push(null);e=a.Jb;(f=a.lb=e[e.length-1])&&f[a.j]&&f[a.j][a.f]--;e.push({});Li(a);Ri(a,b);e=c.quotes;c=null;e&&(e=e.evaluate(a.l))&&(c=new mi(a.I),e===F?a.I=[new wc(""),new wc("")]:e instanceof pc&&(a.I=e.values));Ni(a,a.D);e=a.S||a.da||b.getAttribute("name")||"";if(d||e){var h={};
Object.keys(a.g).forEach(function(a){h[a]=Array.from(this.g[a])},a);Si(a.Ub,e,h)}if(d=a.D._pseudos)for(e=!0,f=0;f<Pi.length;f++)(g=Pi[f])||(e=!1),(g=d[g])&&(e?ki(a,g,b):a.h[a.h.length-2].push(new ji(g,b)));c&&a.h[a.h.length-2].push(c)}function Ti(a,b){for(var c in b)sh(c)&&(b[c]=b[c].Lc(a))}function Ri(a,b){var c=new ni(b),d=a.D,e=d._pseudos,f;for(f in e)Ti(c,e[f]);Ti(c,d)}
function Li(a){var b;for(b=0;b<a.F.length;b++)Ii(a,a.w.Ba,a.F[b]);for(b=0;b<a.J.length;b++)Ii(a,a.w.f,a.J[b]);Ii(a,a.w.g,a.S);Ii(a,a.w.Bc,a.f);""!=a.f&&Ii(a,a.w.Bc,"*");Ii(a,a.w.h,a.oa);null!==a.U&&(Ii(a,a.w.sc,a.U),Ii(a,a.w.sc,"*"));a.b=null;a.h.push([]);for(var c=1;-1<=c;--c){var d=a.h[a.h.length-c-2];for(b=0;b<d.length;)d[b].push(a,c)?d.splice(b,1):b++}a.Sa=!0;a.na=!1}
Hi.prototype.pop=function(){for(var a=1;-1<=a;--a)for(var b=this.h[this.h.length-a-2],c=0;c<b.length;)b[c].pop(this,a)?b.splice(c,1):c++;this.h.pop();this.Sa=!1};var Ui=null;function Vi(a,b,c,d,e,f,g){ef.call(this,a,b,g);this.b=null;this.W=0;this.h=this.Ua=null;this.w=!1;this.T=c;this.j=d?d.j:Ui?Ui.clone():new Gi;this.D=e;this.u=f;this.l=0}t(Vi,ff);Vi.prototype.me=function(a){Fh(this.j.Bc,"*",a)};function Wi(a,b){var c=xh(a.b,b);c!==b&&c.g(a.j)||a.me(c)}
Vi.prototype.sb=function(a,b){if(b||a)this.W+=1,b&&a?this.b.push(new Ih(a,b.toLowerCase())):b?this.b.push(new Hh(b.toLowerCase())):this.b.push(new Kh(a))};Vi.prototype.jd=function(a){this.h?(u.b("::"+this.h,"followed by ."+a),this.b.push(new bi(""))):(this.W+=256,this.b.push(new Eh(a)))};var Xi={"nth-child":Uh,"nth-of-type":Vh,"nth-last-child":Wh,"nth-last-of-type":Xh};
Vi.prototype.tc=function(a,b){if(this.h)u.b("::"+this.h,"followed by :"+a),this.b.push(new bi(""));else{switch(a.toLowerCase()){case "enabled":this.b.push(new Zh);break;case "disabled":this.b.push(new $h);break;case "checked":this.b.push(new ai);break;case "root":this.b.push(new Rh);break;case "link":this.b.push(new Hh("a"));this.b.push(new Lh("","href"));break;case "-adapt-href-epub-type":case "href-epub-type":if(b&&1==b.length&&"string"==typeof b[0]){var c=new RegExp("(^|s)"+oa(b[0])+"($|s)");this.b.push(new Jh(c))}else this.b.push(new bi(""));
break;case "-adapt-footnote-content":case "footnote-content":this.w=!0;break;case "visited":case "active":case "hover":case "focus":this.b.push(new bi(""));break;case "lang":b&&1==b.length&&"string"==typeof b[0]?this.b.push(new Ph(new RegExp("^"+oa(b[0].toLowerCase())+"($|-)"))):this.b.push(new bi(""));break;case "nth-child":case "nth-last-child":case "nth-of-type":case "nth-last-of-type":c=Xi[a.toLowerCase()];b&&2==b.length?this.b.push(new c(b[0],b[1])):this.b.push(new bi(""));break;case "first-child":this.b.push(new Qh);
break;case "last-child":this.b.push(new Wh(0,1));break;case "first-of-type":this.b.push(new Vh(0,1));break;case "last-of-type":this.b.push(new Xh(0,1));break;case "only-child":this.b.push(new Qh);this.b.push(new Wh(0,1));break;case "only-of-type":this.b.push(new Vh(0,1));this.b.push(new Xh(0,1));break;case "empty":this.b.push(new Yh);break;case "before":case "after":case "first-line":case "first-letter":this.uc(a,b);return;default:u.b("unknown pseudo-class selector: "+a),this.b.push(new bi(""))}this.W+=
256}};
Vi.prototype.uc=function(a,b){switch(a){case "before":case "after":case "first-line":case "first-letter":case "footnote-call":case "footnote-marker":case "inner":this.h?(u.b("Double pseudoelement ::"+this.h+"::"+a),this.b.push(new bi(""))):this.h=a;break;case "first-n-lines":if(b&&1==b.length&&"number"==typeof b[0]){var c=Math.round(b[0]);if(0<c&&c==b[0]){this.h?(u.b("Double pseudoelement ::"+this.h+"::"+a),this.b.push(new bi(""))):this.h="first-"+c+"-lines";break}}default:u.b("Unrecognized pseudoelement: ::"+a),
this.b.push(new bi(""))}this.W+=1};Vi.prototype.qd=function(a){this.W+=65536;this.b.push(new Gh(a))};
Vi.prototype.Ic=function(a,b,c,d){this.W+=256;b=b.toLowerCase();d=d||"";var e;switch(c){case 0:e=new Lh(a,b);break;case 39:e=new Mh(a,b,d);break;case 45:!d||d.match(/\s/)?e=new bi(""):e=new Oh(a,b,new RegExp("(^|\\s)"+oa(d)+"($|\\s)"));break;case 44:e=new Oh(a,b,new RegExp("^"+oa(d)+"($|-)"));break;case 43:d?e=new Oh(a,b,new RegExp("^"+oa(d))):e=new bi("");break;case 42:d?e=new Oh(a,b,new RegExp(oa(d)+"$")):e=new bi("");break;case 46:d?e=new Oh(a,b,new RegExp(oa(d))):e=new bi("");break;case 50:"supported"==
d?e=new Nh(a,b):(u.b("Unsupported :: attr selector op:",d),e=new bi(""));break;default:u.b("Unsupported attr selector:",c),e=new bi("")}this.b.push(e)};var Yi=0;n=Vi.prototype;n.wb=function(){var a="d"+Yi++;Wi(this,new Ch(new ei(a)));this.b=[new bi(a)]};n.hd=function(){var a="c"+Yi++;Wi(this,new Ch(new gi(a)));this.b=[new bi(a)]};n.ed=function(){var a="a"+Yi++;Wi(this,new Ch(new hi(a)));this.b=[new bi(a)]};n.nd=function(){var a="f"+Yi++;Wi(this,new Ch(new ii(a)));this.b=[new bi(a)]};
n.$b=function(){Zi(this);this.h=null;this.w=!1;this.W=0;this.b=[]};n.qb=function(){var a;0!=this.l?(hf(this,"E_CSS_UNEXPECTED_SELECTOR"),a=!0):a=!1;a||(this.l=1,this.Ua={},this.h=null,this.W=0,this.w=!1,this.b=[])};n.error=function(a,b){ff.prototype.error.call(this,a,b);1==this.l&&(this.l=0)};n.cc=function(a){ff.prototype.cc.call(this,a);this.l=0};n.xa=function(){Zi(this);ff.prototype.xa.call(this);1==this.l&&(this.l=0)};n.xb=function(){ff.prototype.xb.call(this)};
function Zi(a){if(a.b){var b=a.W,c;c=a.j;c=c.order+=Ei;Wi(a,a.qe(b+c));a.b=null;a.h=null;a.w=!1;a.W=0}}n.qe=function(a){var b=this.D;this.w&&(b=b?"xxx-bogus-xxx":"footnote");return new Dh(this.Ua,a,this.h,b)};n.ob=function(a,b,c){ah(this.u,a,b,c,this)};n.qc=function(a,b){gf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};n.ad=function(a,b){gf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};
n.pb=function(a,b,c){"display"!=a||b!==id&&b!==hd||(this.pb("flow-options",new pc([Sc,nd]),c),this.pb("flow-into",b,c),b=Ic);(Ed.SIMPLE_PROPERTY||[]).forEach(function(d){d=d({name:a,value:b,important:c});a=d.name;b=d.value;c=d.important});var d=c?af(this):bf(this);th(this.Ua,a,this.T?new ph(b,d,this.T):new V(b,d))};n.yc=function(a){switch(a){case "not":a=new $i(this),a.qb(),df(this.ha,a)}};function $i(a){Vi.call(this,a.f,a.ha,a.T,a,a.D,a.u,!1);this.parent=a;this.g=a.b}t($i,Vi);n=$i.prototype;
n.yc=function(a){"not"==a&&hf(this,"E_CSS_UNEXPECTED_NOT")};n.xa=function(){hf(this,"E_CSS_UNEXPECTED_RULE_BODY")};n.$b=function(){hf(this,"E_CSS_UNEXPECTED_NEXT_SELECTOR")};n.Kc=function(){this.b&&0<this.b.length&&this.g.push(new di(this.b));this.parent.W+=this.W;var a=this.ha;a.b=a.g.pop()};n.error=function(a,b){Vi.prototype.error.call(this,a,b);var c=this.ha;c.b=c.g.pop()};function aj(a,b){ef.call(this,a,b,!1)}t(aj,ff);
aj.prototype.ob=function(a,b){if(this.f.values[a])this.error("E_CSS_NAME_REDEFINED "+a,this.oc());else{var c=a.match(/height|^(top|bottom)$/)?"vh":"vw",c=new cc(this.f,100,c),c=b.qa(this.f,c);this.f.values[a]=c}};function bj(a,b,c,d,e){ef.call(this,a,b,!1);this.Ua=d;this.T=c;this.b=e}t(bj,ff);bj.prototype.ob=function(a,b,c){c?u.b("E_IMPORTANT_NOT_ALLOWED"):ah(this.b,a,b,c,this)};bj.prototype.qc=function(a,b){u.b("E_INVALID_PROPERTY_VALUE",a+":",b.toString())};
bj.prototype.ad=function(a,b){u.b("E_INVALID_PROPERTY",a+":",b.toString())};bj.prototype.pb=function(a,b,c){c=c?af(this):bf(this);c+=this.order;this.order+=Ei;th(this.Ua,a,this.T?new ph(b,c,this.T):new V(b,c))};function cj(a,b){Ef.call(this,a);this.Ua={};this.b=b;this.order=0}t(cj,Ef);cj.prototype.ob=function(a,b,c){ah(this.b,a,b,c,this)};cj.prototype.qc=function(a,b){u.b("E_INVALID_PROPERTY_VALUE",a+":",b.toString())};cj.prototype.ad=function(a,b){u.b("E_INVALID_PROPERTY",a+":",b.toString())};
cj.prototype.pb=function(a,b,c){c=(c?67108864:50331648)+this.order;this.order+=Ei;th(this.Ua,a,new V(b,c))};function dj(a,b,c){return(a=a["writing-mode"])&&(b=a.evaluate(b,"writing-mode"))&&b!==Yc?b===ud:c}function ej(a,b,c,d){var e={},f;for(f in a)sh(f)&&(e[f]=a[f]);a=a._regions;if((c||d)&&a)for(d&&(d=["footnote"],c=c?c.concat(d):d),d=0;d<c.length;d++){f=a[c[d]];for(var g in f)sh(g)&&(e[g]=qh(b,e[g],f[g]))}return e}
function fj(a,b,c,d){c=c?nh:oh;for(var e in a)if(a.hasOwnProperty(e)){var f=a[e];if(f){var g=c[e];if(g){var h=a[g];if(h&&h.Qa>f.Qa)continue;g=ih[g]?g:e}else g=e;b[g]=d(e,f)}}};var gj=!1,hj={ff:"ltr",gf:"rtl"};ba("vivliostyle.constants.PageProgression",hj);hj.LTR="ltr";hj.RTL="rtl";var ij={ze:"left",Ae:"right"};ba("vivliostyle.constants.PageSide",ij);ij.LEFT="left";ij.RIGHT="right";var jj={LOADING:"loading",ef:"interactive",bf:"complete"};ba("vivliostyle.constants.ReadyState",jj);jj.LOADING="loading";jj.INTERACTIVE="interactive";jj.COMPLETE="complete";function kj(a,b,c){this.u=a;this.url=b;this.b=c;this.lang=null;this.h=-1;this.root=c.documentElement;b=a=null;if("http://www.w3.org/1999/xhtml"==this.root.namespaceURI){for(var d=this.root.firstChild;d;d=d.nextSibling)if(1==d.nodeType&&(c=d,"http://www.w3.org/1999/xhtml"==c.namespaceURI))switch(c.localName){case "head":b=c;break;case "body":a=c}this.lang=this.root.getAttribute("lang")}else if("http://www.gribuser.ru/xml/fictionbook/2.0"==this.root.namespaceURI){b=this.root;for(d=this.root.firstChild;d;d=
d.nextSibling)1==d.nodeType&&(c=d,"http://www.gribuser.ru/xml/fictionbook/2.0"==c.namespaceURI&&"body"==c.localName&&(a=c));c=lj(lj(lj(lj(new mj([this.b]),"FictionBook"),"description"),"title-info"),"lang").textContent();0<c.length&&(this.lang=c[0])}else if("http://example.com/sse"==this.root.namespaceURI)for(c=this.root.firstElementChild;c;c=c.nextElementSibling)d=c.localName,"meta"===d?b=c:"body"===d&&(a=c);this.body=a;this.l=b;this.g=this.root;this.j=1;this.g.setAttribute("data-adapt-eloff","0")}
function nj(a,b){var c=b.getAttribute("data-adapt-eloff");if(c)return parseInt(c,10);for(var c=a.j,d=a.g;d!=b;){var e=d.firstChild;if(!e)for(;!(e=d.nextSibling);)if(d=d.parentNode,!d)throw Error("Internal error");d=e;1==e.nodeType?(e.setAttribute("data-adapt-eloff",c.toString()),++c):c+=e.textContent.length}a.j=c;a.g=b;return c-1}
function oj(a,b,c,d){var e=0;if(1==b.nodeType){if(!d)return nj(a,b)}else{e=c;c=b.previousSibling;if(!c)return b=b.parentNode,e+=1,nj(a,b)+e;b=c}for(;;){for(;b.lastChild;)b=b.lastChild;if(1==b.nodeType)break;e+=b.textContent.length;c=b.previousSibling;if(!c){b=b.parentNode;break}b=c}e+=1;return nj(a,b)+e}function pj(a){0>a.h&&(a.h=oj(a,a.root,0,!0));return a.h}
function qj(a,b){for(var c,d=a.root;;){c=nj(a,d);if(c>=b)return d;var e=d.children;if(!e)break;var f=Ia(e.length,function(c){return nj(a,e[c])>b});if(!f)break;if(f<e.length&&nj(a,e[f])<=b)throw Error("Consistency check failed!");d=e[f-1]}c+=1;for(var f=d,g=f.firstChild||f.nextSibling,h=null;;){if(g){if(1==g.nodeType)break;h=f=g;c+=g.textContent.length;if(c>b)break}else if(f=f.parentNode,!f)break;g=f.nextSibling}return h||d}
function rj(a,b){var c=b.getAttribute("id");c&&!a.f[c]&&(a.f[c]=b);(c=b.getAttributeNS("http://www.w3.org/XML/1998/namespace","id"))&&!a.f[c]&&(a.f[c]=b);for(c=b.firstElementChild;c;c=c.nextElementSibling)rj(a,c)}function sj(a,b){var c=b.match(/([^#]*)\#(.+)$/);if(!c||c[1]&&c[1]!=a.url)return null;var c=c[2],d=a.b.getElementById(c);!d&&a.b.getElementsByName&&(d=a.b.getElementsByName(c)[0]);d||(a.f||(a.f={},rj(a,a.b.documentElement)),d=a.f[c]);return d}
var tj={kf:"text/html",lf:"text/xml",Xe:"application/xml",We:"application/xhtml_xml",df:"image/svg+xml"};function uj(a,b,c){c=c||new DOMParser;var d;try{d=c.parseFromString(a,b)}catch(e){}if(d){a=d.documentElement;if("parsererror"===a.localName)return null;for(a=a.firstChild;a;a=a.nextSibling)if("parsererror"===a.localName)return null}else return null;return d}
function vj(a){var b=a.contentType;if(b){for(var c=Object.keys(tj),d=0;d<c.length;d++)if(tj[c[d]]===b)return b;if(b.match(/\+xml$/))return"application/xml"}if(a=a.url.match(/\.([^./]+)$/))switch(a[1]){case "html":case "htm":return"text/html";case "xhtml":case "xht":return"application/xhtml_xml";case "svg":case "svgz":return"image/svg+xml";case "opf":case "xml":return"application/xml"}return null}
function wj(a,b){var c=a.responseXML;if(!c){var d=new DOMParser,e=a.responseText;if(e){var f=vj(a);(c=uj(e,f||"application/xml",d))&&!f&&(f=c.documentElement,"html"!==f.localName.toLowerCase()||f.namespaceURI?"svg"===f.localName.toLowerCase()&&"image/svg+xml"!==c.contentType&&(c=uj(e,"image/svg+xml",d)):c=uj(e,"text/html",d));c||(c=uj(e,"text/html",d))}}c=c?new kj(b,a.url,c):null;return I(c)}function xj(a){this.Yb=a}
function yj(){var a=zj;return new xj(function(b){return a.Yb(b)&&1==b.nodeType&&"http://www.idpf.org/2008/embedding"==b.getAttribute("Algorithm")})}function Aj(){var a=yj(),b=zj;return new xj(function(c){if(!b.Yb(c))return!1;c=new mj([c]);c=lj(c,"EncryptionMethod");a&&(c=Bj(c,a));return 0<c.b.length})}var zj=new xj(function(){return!0});function mj(a){this.b=a}function Bj(a,b){for(var c=[],d=0;d<a.b.length;d++){var e=a.b[d];b.Yb(e)&&c.push(e)}return new mj(c)}
function Cj(a,b){function c(a){d.push(a)}for(var d=[],e=0;e<a.b.length;e++)b(a.b[e],c);return new mj(d)}mj.prototype.forEach=function(a){for(var b=[],c=0;c<this.b.length;c++)b.push(a(this.b[c]));return b};function Dj(a,b){for(var c=[],d=0;d<a.b.length;d++){var e=b(a.b[d]);null!=e&&c.push(e)}return c}function lj(a,b){return Cj(a,function(a,d){for(var c=a.firstChild;c;c=c.nextSibling)c.localName==b&&d(c)})}
function Ej(a){return Cj(a,function(a,c){for(var b=a.firstChild;b;b=b.nextSibling)1==b.nodeType&&c(b)})}function Fj(a,b){return Dj(a,function(a){return 1==a.nodeType?a.getAttribute(b):null})}mj.prototype.textContent=function(){return this.forEach(function(a){return a.textContent})};var Gj={transform:!0,"transform-origin":!0},Hj={top:!0,bottom:!0,left:!0,right:!0};function Ij(a,b,c){this.target=a;this.name=b;this.value=c}var Jj={show:function(a){a.style.visibility="visible"},hide:function(a){a.style.visibility="hidden"},play:function(a){a.currentTime=0;a.play()},pause:function(a){a.pause()},resume:function(a){a.play()},mute:function(a){a.muted=!0},unmute:function(a){a.muted=!1}};
function Kj(a,b){var c=Jj[b];return c?function(){for(var b=0;b<a.length;b++)try{c(a[b])}catch(e){}}:null}
function Lj(a,b){this.h={};this.P=a;this.g=b;this.I=null;this.u=[];var c=this;this.M=function(a){var b=a.currentTarget,d=b.getAttribute("href")||b.getAttributeNS("http://www.w3.org/1999/xlink","href");d&&Ra(c,{type:"hyperlink",target:null,currentTarget:null,qf:b,href:d,preventDefault:function(){a.preventDefault()}})};this.b={};this.f={width:0,height:0};this.w=this.F=!1;this.B=this.D=!0;this.L=0;this.position=null;this.offset=-1;this.l=null;this.j=[];this.G={top:{},bottom:{},left:{},right:{}}}
t(Lj,Qa);function Mj(a,b){(a.D=b)?a.P.setAttribute("data-vivliostyle-auto-page-width",!0):a.P.removeAttribute("data-vivliostyle-auto-page-width")}function Nj(a,b){(a.B=b)?a.P.setAttribute("data-vivliostyle-auto-page-height",!0):a.P.removeAttribute("data-vivliostyle-auto-page-height")}function Oj(a,b,c){var d=a.b[c];d?d.push(b):a.b[c]=[b]}
function Pj(a,b,c){Object.keys(a.b).forEach(function(a){for(var b=this.b[a],c=0;c<b.length;)this.P.contains(b[c])?c++:b.splice(c,1);b.length||delete this.b[a]},a);for(var d=a.u,e=0;e<d.length;e++){var f=d[e];v(f.target,f.name,f.value.toString())}e=Qj(c,a.P);a.f.width=e.width;a.f.height=e.height;for(e=0;e<b.length;e++)if(c=b[e],f=a.b[c.vc],d=a.b[c.Me],f&&d&&(f=Kj(f,c.action)))for(var g=0;g<d.length;g++)d[g].addEventListener(c.event,f,!1)}
Lj.prototype.zoom=function(a){v(this.P,"transform","scale("+a+")")};Lj.prototype.J=function(){return this.I||this.P};function Rj(a){switch(a){case "normal":case "nowrap":return 0;case "pre-line":return 1;case "pre":case "pre-wrap":return 2;default:return null}}function Sj(a,b){if(1==a.nodeType)return!1;var c=a.textContent;switch(b){case 0:return!!c.match(/^\s*$/);case 1:return!!c.match(/^[ \t\f]*$/);case 2:return!c.length}throw Error("Unexpected whitespace: "+b);}
function Tj(a){this.f=a;this.b=[]}function Uj(a,b,c,d,e,f,g,h,l){this.b=a;this.element=b;this.f=c;this.Qa=d;this.l=e;this.h=f;this.Pe=g;this.j=h;this.bb=-1;this.g=l}function Vj(a,b){return a.h?!b.h||a.Qa>b.Qa?!0:a.j:!1}function Wj(a,b){return a.top-b.top}function Xj(a,b){return b.right-a.right}
function Yj(a,b){if(a===b)return!0;if(!a||!b||a.ga!==b.ga||a.K!==b.K||a.ja.length!==b.ja.length)return!1;for(var c=0;c<a.ja.length;c++){var d=a[c],e=b[c];if(!(d===e||d&&e&&d.node===e.node&&d.Ra===e.Ra&&d.la===e.la&&d.za===e.za&&d.wa===e.wa))return!1}return!0}function Zj(a){return{ja:[{node:a.V,Ra:ak,la:a.la,za:null,wa:null}],ga:0,K:!1,Ia:a.Ia}}function bk(a,b){var c=new ck(a.node,b,0);c.Ra=a.Ra;c.la=a.la;c.za=a.za;c.wa=a.wa?bk(a.wa,dk(b)):null;c.R=a.R;return c}var ak=0;
function ek(a,b,c,d,e,f,g){this.ha=a;this.Bd=d;this.ae=null;this.root=b;this.ca=c;this.type=f;e&&(e.ae=this);this.b=g}function fk(a,b){this.Ne=a;this.count=b}
function ck(a,b,c){this.V=a;this.parent=b;this.pa=c;this.ga=0;this.K=!1;this.Ra=ak;this.la=b?b.la:null;this.wa=this.za=null;this.na=!1;this.Ca=!0;this.f=!1;this.w=b?b.w:0;this.D=this.l=this.oa=this.display=null;this.J="baseline";this.U="top";this.da=0;this.I=!1;this.Hb=b?b.Hb:0;this.u=b?b.u:null;this.B=b?b.B:!1;this.M=this.S=!1;this.F=this.C=this.G=this.h=null;this.j=b?b.j:{};this.b=b?b.b:!1;this.ma=b?b.ma:"ltr";this.g=b?b.g:null;this.Ia=this.lang=null;this.R=b?b.R:null}
function gk(a){a.Ca=!0;a.w=a.parent?a.parent.w:0;a.C=null;a.F=null;a.ga=0;a.K=!1;a.display=null;a.l=null;a.D=null;a.J="baseline";a.I=!1;a.Hb=a.parent?a.parent.Hb:0;a.u=a.parent?a.parent.u:null;a.B=a.parent?a.parent.B:!1;a.h=null;a.G=null;a.za=null;a.S=!1;a.M=!1;a.b=a.parent?a.parent.b:!1;a.za=null;a.Ia=null;a.R=a.parent?a.parent.R:null}
function hk(a){var b=new ck(a.V,a.parent,a.pa);b.ga=a.ga;b.K=a.K;b.za=a.za;b.Ra=a.Ra;b.la=a.la;b.wa=a.wa;b.Ca=a.Ca;b.w=a.w;b.display=a.display;b.l=a.l;b.D=a.D;b.J=a.J;b.U=a.U;b.da=a.da;b.S=a.S;b.M=a.M;b.I=a.I;b.Hb=a.Hb;b.u=a.u;b.B=a.B;b.h=a.h;b.G=a.G;b.C=a.C;b.F=a.F;b.g=a.g;b.b=a.b;b.f=a.f;b.Ia=a.Ia;b.R=a.R;return b}ck.prototype.modify=function(){return this.na?hk(this):this};function dk(a){var b=a;do{if(b.na)break;b.na=!0;b=b.parent}while(b);return a}
ck.prototype.clone=function(){for(var a=hk(this),b=a,c;c=b.parent;)c=hk(c),b=b.parent=c;return a};function ik(a){return{node:a.V,Ra:a.Ra,la:a.la,za:a.za,wa:a.wa?ik(a.wa):null,R:a.R}}function jk(a){var b=a,c=[];do b.g&&b.parent&&b.parent.g!==b.g||c.push(ik(b)),b=b.parent;while(b);b=a.Ia?kk(a.Ia,a.ga,-1):a.ga;return{ja:c,ga:b,K:a.K,Ia:a.Ia}}function lk(a){for(a=a.parent;a;){if(a.S)return!0;a=a.parent}return!1}function mk(a){for(a=a.parent;a;){if(a.M)return a;a=a.parent}return null}
function nk(a,b){for(var c=a;c;){c.Ca||b(c);if(c.S)break;c=c.parent}}function ok(a){this.Oa=a;this.b=this.f=null}ok.prototype.clone=function(){var a=new ok(this.Oa);if(this.f){a.f=[];for(var b=0;b<this.f.length;++b)a.f[b]=this.f[b]}if(this.b)for(a.b=[],b=0;b<this.b.length;++b)a.b[b]=this.b[b];return a};
function pk(a,b){if(!b)return!1;if(a===b)return!0;if(!Yj(a.Oa,b.Oa))return!1;if(a.f){if(!b.f||a.f.length!==b.f.length)return!1;for(var c=0;c<a.f.length;c++)if(!Yj(a.f[c],b.f[c]))return!1}else if(b.f)return!1;if(a.b){if(!b.b||a.b.length!==b.b.length)return!1;for(c=0;c<a.b.length;c++)if(!Yj(a.b[c],b.b[c]))return!1}else if(b.b)return!1;return!0}function qk(a,b){this.f=a;this.b=b}qk.prototype.clone=function(){return new qk(this.f.clone(),this.b)};function rk(){this.b=[];this.f="any"}
rk.prototype.clone=function(){for(var a=new rk,b=this.b,c=a.b,d=0;d<b.length;d++)c[d]=b[d].clone();a.f=this.f;return a};function sk(a,b){if(a===b)return!0;if(!b||a.b.length!==b.b.length)return!1;for(var c=0;c<a.b.length;c++){var d=a.b[c],e=b.b[c];if(!e||d!==e&&!pk(d.f,e.f))return!1}return!0}function tk(){this.page=0;this.g={};this.b={};this.f=0}tk.prototype.clone=function(){var a=new tk;a.page=this.page;a.h=this.h;a.f=this.f;a.j=this.j;a.g=this.g;for(var b in this.b)a.b[b]=this.b[b].clone();return a};
function uk(a,b){if(a===b)return!0;if(!b||a.page!==b.page||a.f!==b.f)return!1;var c=Object.keys(a.b),d=Object.keys(b.b);if(c.length!==d.length)return!1;for(d=0;d<c.length;d++){var e=c[d];if(!sk(a.b[e],b.b[e]))return!1}return!0}
function vk(a){this.element=a;this.M=this.J=this.height=this.width=this.F=this.B=this.G=this.w=this.Sa=this.ma=this.kb=this.da=this.marginBottom=this.marginTop=this.marginRight=this.marginLeft=this.top=this.left=0;this.Kb=this.S=null;this.ta=this.Ub=this.nb=this.Fc=this.g=0;this.b=!1}function wk(a){return a.marginTop+a.ma+a.B}function xk(a){return a.marginBottom+a.Sa+a.F}function yk(a){return a.marginLeft+a.da+a.w}function zk(a){return a.marginRight+a.kb+a.G}
function Ak(a,b){a.element=b.element;a.left=b.left;a.top=b.top;a.marginLeft=b.marginLeft;a.marginRight=b.marginRight;a.marginTop=b.marginTop;a.marginBottom=b.marginBottom;a.da=b.da;a.kb=b.kb;a.ma=b.ma;a.Sa=b.Sa;a.w=b.w;a.G=b.G;a.B=b.B;a.F=b.F;a.width=b.width;a.height=b.height;a.J=b.J;a.M=b.M;a.Kb=b.Kb;a.S=b.S;a.g=b.g;a.Fc=b.Fc;a.nb=b.nb;a.b=b.b}function Bk(a,b,c){a.top=b;a.height=c;v(a.element,"top",b+"px");v(a.element,"height",c+"px")}
function Ck(a,b,c){a.left=b;a.width=c;v(a.element,"left",b+"px");v(a.element,"width",c+"px")}function Dk(a,b){this.b=a;this.f=b}t(Dk,nc);Dk.prototype.Dc=function(a){this.b.appendChild(this.b.ownerDocument.createTextNode(a.dc));return null};Dk.prototype.ic=function(a){var b=this.b.ownerDocument.createElementNS("http://www.w3.org/1999/xhtml","img");b.setAttribute("src",a.url);this.b.appendChild(b);return null};Dk.prototype.rb=function(a){this.Gb(a.values);return null};
Dk.prototype.ec=function(a){a=a.qa().evaluate(this.f);"string"===typeof a&&this.b.appendChild(this.b.ownerDocument.createTextNode(a));return null};function Ek(a){return!!a&&a!==gd&&a!==F&&a!==Yc};function Fk(a,b,c){this.g=a;this.f=b;this.b=c}function Gk(){this.map=[]}function Hk(a){return a.map.length?a.map[a.map.length-1].b:0}function Ik(a,b){if(a.map.length){var c=a.map[a.map.length-1],d=c.b+b-c.f;c.f==c.g?(c.f=b,c.g=b,c.b=d):a.map.push(new Fk(b,b,d))}else a.map.push(new Fk(b,b,b))}function Jk(a,b){a.map.length?a.map[a.map.length-1].f=b:a.map.push(new Fk(b,0,0))}function Kk(a,b){var c=Ia(a.map.length,function(c){return b<=a.map[c].f}),c=a.map[c];return c.b-Math.max(0,c.g-b)}
function Lk(a,b){var c=Ia(a.map.length,function(c){return b<=a.map[c].b}),c=a.map[c];return c.g-(c.b-b)}function Mk(a,b,c,d,e,f,g,h){this.B=a;this.style=b;this.offset=c;this.D=d;this.j=e;this.b=e.b;this.Ma=f;this.Ta=g;this.F=h;this.l=this.u=null;this.w={};this.g=this.f=this.h=null;Nk(this)&&(b=b._pseudos)&&b.before&&(a=new Mk(a,b.before,c,!1,e,Ok(this),g,!0),c=Pk(a,"content"),Ek(c)&&(this.h=a,this.g=a.g));this.g=Qk(Rk(this,"before"),this.g);this.Ta&&Sk[this.g]&&(e.g=Qk(e.g,this.g))}
function Pk(a,b,c){if(!(b in a.w)){var d=a.style[b];a.w[b]=d?d.evaluate(a.B,b):c||null}return a.w[b]}function Tk(a){return Pk(a,"display",Zc)}function Ok(a){if(null===a.u){var b=Tk(a),c=Pk(a,"position"),d=Pk(a,"float");a.u=Uk(b,c,d,a.D).display===Ic}return a.u}function Nk(a){null===a.l&&(a.l=a.F&&Tk(a)!==F);return a.l}function Rk(a,b){var c=null;if(Ok(a)){var d=Pk(a,"break-"+b);d&&(c=d.toString())}return c}function Vk(a){this.g=a;this.b=[];this.Ta=this.Ma=!0;this.f=[]}
function Wk(a){return a.b[a.b.length-1]}function Xk(a){return a.b.every(function(a){return Tk(a)!==F})}Vk.prototype.push=function(a,b,c,d){var e=Wk(this);d&&e&&d.b!==e.b&&this.f.push({Ma:this.Ma,Ta:this.Ta});e=d||e.j;d=this.Ta||!!d;var f=Xk(this);a=new Mk(this.g,a,b,c,e,d||this.Ma,d,f);this.b.push(a);this.Ma=Nk(a)?!a.h&&Ok(a):this.Ma;this.Ta=Nk(a)?!a.h&&d:this.Ta;return a};
Vk.prototype.pop=function(a){var b=this.b.pop(),c=this.Ma,d=this.Ta;if(Nk(b)){var e=b.style._pseudos;e&&e.after&&(a=new Mk(b.B,e.after,a,!1,b.j,c,d,!0),c=Pk(a,"content"),Ek(c)&&(b.f=a))}this.Ta&&b.f&&(a=Rk(b.f,"before"),b.j.g=Qk(b.j.g,a));if(a=Wk(this))a.b===b.b?Nk(b)&&(this.Ma=this.Ta=!1):(a=this.f.pop(),this.Ma=a.Ma,this.Ta=a.Ta);return b};
function Yk(a,b){if(!b.Ma)return b.offset;var c=a.b.length-1,d=a.b[c];d===b&&(c--,d=a.b[c]);for(;0<=c;){if(d.b!==b.b)return b.offset;if(!d.Ma||d.D)return d.offset;b=d;d=a.b[--c]}throw Error("No block start offset found!");}
function Zk(a,b,c,d,e,f,g,h){this.ca=a;this.root=a.root;this.ta=c;this.h=d;this.u=f;this.f=this.root;this.J={};this.M={};this.B={};this.F=[];this.w=this.I=this.G=null;this.S=new Hi(b,d,g,h);this.g=new Gk;this.Oa=!0;this.da=[];this.oa=e;this.na=this.ma=!1;this.b=a=nj(a,this.root);this.U={};this.j=new Vk(d);Ik(this.g,a);d=$k(this,this.root);Qi(this.S,this.root,d);al(this,d,!1);this.D=!0;switch(this.root.namespaceURI){case "http://www.w3.org/1999/xhtml":case "http://www.gribuser.ru/xml/fictionbook/2.0":this.D=
!1}this.da.push(!0);this.M={};this.M["e"+a]=d;this.b++;bl(this,-1)}function cl(a,b,c,d){return(b=b[d])&&b.evaluate(a.h)!==c[d]}function dl(a,b,c){for(var d in c){var e=b[d];e?(a.J[d]=e,delete b[d]):(e=c[d])&&(a.J[d]=new V(e,33554432))}}var el=["column-count","column-width"];
function al(a,b,c){c||["writing-mode","direction"].forEach(function(a){b[a]&&(this.J[a]=b[a])},a);if(!a.ma){var d=cl(a,b,a.u.j,"background-color")?b["background-color"].evaluate(a.h):null,e=cl(a,b,a.u.j,"background-image")?b["background-image"].evaluate(a.h):null;if(d&&d!==Yc||e&&e!==Yc)dl(a,b,a.u.j),a.ma=!0}if(!a.na)for(d=0;d<el.length;d++)if(cl(a,b,a.u.u,el[d])){dl(a,b,a.u.u);a.na=!0;break}if(!c&&(c=b["font-size"])){d=c.evaluate(a.h);c=d.H;switch(d.ea){case "em":case "rem":c*=a.h.u;break;case "ex":case "rex":c*=
a.h.u*wb.ex/wb.em;break;case "%":c*=a.h.u/100;break;default:(d=wb[d.ea])&&(c*=d)}a.h.U=c}}function fl(a){for(var b=0;!a.D&&(b+=5E3,gl(a,b,0)!=Number.POSITIVE_INFINITY););return a.J}function $k(a,b){if(b.style instanceof CSSStyleDeclaration){var c=b.getAttribute("style");if(c){var d=a.ca.url,e=new cj(a.ta,a.u),c=new Qe(c,e);try{Df(new uf(kf,c,e,d),Number.POSITIVE_INFINITY,!1,!0,!1,!1)}catch(f){u.b(f,"Style attribute parse error:")}return e.Ua}}return{}}
function bl(a,b){if(!(b>=a.b)){var c=a.h,d=nj(a.ca,a.root);if(b<d){var e=a.l(a.root,!1),f=e["flow-into"],f=f?f.evaluate(c,"flow-into").toString():"body",f=hl(a,f,e,a.root,d);!a.j.b.length&&a.j.push(e,d,!0,f)}d=qj(a.ca,b);e=oj(a.ca,d,0,!1);if(!(e>=a.b))for(;;){if(1!=d.nodeType)e+=d.textContent.length;else{var g=d;if(e!=nj(a.ca,g))throw Error("Inconsistent offset");var h=a.l(g,!1);if(f=h["flow-into"])f=f.evaluate(c,"flow-into").toString(),hl(a,f,h,g,e);e++}if(e>=a.b)break;f=d.firstChild;if(!f)for(;!(f=
d.nextSibling);)if(d=d.parentNode,d===a.root)return;d=f}}}function il(a,b){a.G=b;for(var c=0;c<a.F.length;c++)jl(a.G,a.F[c],a.B[a.F[c].b])}
function hl(a,b,c,d,e){var f=0,g=Number.POSITIVE_INFINITY,h=!1,l=!1,k=!1,m=c["flow-options"];if(m){var p;a:{if(h=m.evaluate(a.h,"flow-options")){l=new jg;try{h.$(l);p=l.b;break a}catch(q){u.b(q,"toSet:")}}p={}}h=!!p.exclusive;l=!!p["static"];k=!!p.last}(p=c["flow-linger"])&&(g=lg(p.evaluate(a.h,"flow-linger"),Number.POSITIVE_INFINITY));(c=c["flow-priority"])&&(f=lg(c.evaluate(a.h,"flow-priority"),0));c=a.U[e]||null;p=a.B[b];p||(p=Wk(a.j),p=a.B[b]=new Tj(p?p.j.b:null));d=new Uj(b,d,e,f,g,h,l,k,c);
a.F.push(d);a.I==b&&(a.I=null);a.G&&jl(a.G,d,p);return d}function kl(a,b,c,d){Sk[b]&&(d=a.B[d].b,(!d.length||d[d.length-1]<c)&&d.push(c));a.U[c]=Qk(a.U[c],b)}
function gl(a,b,c){var d=-1;if(b<=a.b&&(d=Kk(a.g,b),d+=c,d<Hk(a.g)))return Lk(a.g,d);if(!a.f)return Number.POSITIVE_INFINITY;for(var e=a.h;;){var f=a.f.firstChild;if(!f)for(;;){if(1==a.f.nodeType){var f=a.S,g=a.f;if(f.nb.pop()!==g)throw Error("Invalid call to popElement");f.Kb.pop();f.ma.pop();f.Ib.pop();f.Jb.pop();f.pop();Oi(f);a.Oa=a.da.pop();g=a.j.pop(a.b);f=null;g.f&&(f=Rk(g.f,"before"),kl(a,f,g.f.Ma?Yk(a.j,g):g.f.offset,g.b),f=Rk(g.f,"after"));f=Qk(f,Rk(g,"after"));kl(a,f,a.b,g.b)}if(f=a.f.nextSibling)break;
a.f=a.f.parentNode;if(a.f===a.root)return a.f=null,b<a.b&&(0>d&&(d=Kk(a.g,b),d+=c),d<=Hk(a.g))?Lk(a.g,d):Number.POSITIVE_INFINITY}a.f=f;if(1!=a.f.nodeType){a.b+=a.f.textContent.length;var f=a.j,g=a.f,h=Wk(f);(f.Ma||f.Ta)&&Nk(h)&&(h=Pk(h,"white-space",gd).toString(),Sj(g,Rj(h))||(f.Ma=!1,f.Ta=!1));a.Oa?Ik(a.g,a.b):Jk(a.g,a.b)}else{g=a.f;f=$k(a,g);a.da.push(a.Oa);Qi(a.S,g,f);(h=g.getAttribute("id")||g.getAttributeNS("http://www.w3.org/XML/1998/namespace","id"))&&h===a.w&&(a.w=null);a.D||"body"!=g.localName||
g.parentNode!=a.root||(al(a,f,!0),a.D=!0);if(h=f["flow-into"]){var h=h.evaluate(e,"flow-into").toString(),l=hl(a,h,f,g,a.b);a.Oa=!!a.oa[h];g=a.j.push(f,a.b,g===a.root,l)}else g=a.j.push(f,a.b,g===a.root);h=Yk(a.j,g);kl(a,g.g,h,g.b);g.h&&(l=Rk(g.h,"after"),kl(a,l,g.h.Ma?h:g.offset,g.b));a.Oa&&Tk(g)===F&&(a.Oa=!1);if(nj(a.ca,a.f)!=a.b)throw Error("Inconsistent offset");a.M["e"+a.b]=f;a.b++;a.Oa?Ik(a.g,a.b):Jk(a.g,a.b);if(b<a.b&&(0>d&&(d=Kk(a.g,b),d+=c),d<=Hk(a.g)))return Lk(a.g,d)}}}
Zk.prototype.l=function(a,b){var c=nj(this.ca,a),d="e"+c;b&&(c=oj(this.ca,a,0,!0));this.b<=c&&gl(this,c,0);return this.M[d]};var ll={"font-style":gd,"font-variant":gd,"font-weight":gd},ml="OTTO"+(new Date).valueOf(),nl=1;function ol(a,b){var c={},d;for(d in a)c[d]=a[d].evaluate(b,d);for(var e in ll)c[e]||(c[e]=ll[e]);return c}function pl(a){a=this.Pb=a;var b=new Aa,c;for(c in ll)b.append(" "),b.append(a[c].toString());this.f=b.toString();this.src=this.Pb.src?this.Pb.src.toString():null;this.g=[];this.h=[];this.b=(c=this.Pb["font-family"])?c.stringValue():null}
function ql(a,b,c){var d=new Aa;d.append("@font-face {\n  font-family: ");d.append(a.b);d.append(";\n  ");for(var e in ll)d.append(e),d.append(": "),a.Pb[e].Ja(d,!0),d.append(";\n  ");c?(d.append('src: url("'),b=(window.URL||window.webkitURL).createObjectURL(c),d.append(b),a.g.push(b),a.h.push(c),d.append('")')):(d.append("src: "),d.append(b));d.append(";\n}\n");return d.toString()}function rl(a){this.f=a;this.b={}}
function sl(a,b){if(b instanceof qc){for(var c=b.values,d=[],e=0;e<c.length;e++){var f=c[e],g=a.b[f.stringValue()];g&&d.push(C(g));d.push(f)}return new qc(d)}return(c=a.b[b.stringValue()])?new qc([C(c),b]):b}function tl(a,b){this.b=a;this.body=b;this.f={};this.g=0}function ul(a,b,c){b=b.b;var d=c.b[b];if(d)return d;d="Fnt_"+ ++a.g;return c.b[b]=d}
function vl(a,b,c,d){var e=H("initFont"),f=b.src,g={},h;for(h in ll)g[h]=b.Pb[h];d=ul(a,b,d);g["font-family"]=C(d);var l=new pl(g),k=a.body.ownerDocument.createElement("span");k.textContent="M";var m=(new Date).valueOf()+1E3;b=a.b.ownerDocument.createElement("style");h=ml+nl++;b.textContent=ql(l,"",Ue([h]));a.b.appendChild(b);a.body.appendChild(k);k.style.visibility="hidden";k.style.fontFamily=d;for(var p in ll)v(k,p,g[p].toString());var g=k.getBoundingClientRect(),q=g.right-g.left,w=g.bottom-g.top;
b.textContent=ql(l,f,c);u.g("Starting to load font:",f);var r=!1;ce(function(){var a=k.getBoundingClientRect(),b=a.bottom-a.top;return q!=a.right-a.left||w!=b?(r=!0,I(!1)):(new Date).valueOf()>m?I(!1):be(10)}).then(function(){r?u.g("Loaded font:",f):u.b("Failed to load font:",f);a.body.removeChild(k);L(e,l)});return J(e)}
function wl(a,b,c){var d=b.src,e=a.f[d];e?he(e,function(a){if(a.f==b.f){var e=b.b,f=c.b[e];a=a.b;if(f){if(f!=a)throw Error("E_FONT_FAMILY_INCONSISTENT "+b.b);}else c.b[e]=a;u.b("Found already-loaded font:",d)}else u.b("E_FONT_FACE_INCOMPATIBLE",b.src)}):(e=new ge(function(){var e=H("loadFont"),g=c.f?c.f(d):null;g?Te(d,"blob").then(function(d){d.Sc?g(d.Sc).then(function(d){vl(a,b,d,c).sa(e)}):L(e,null)}):vl(a,b,null,c).sa(e);return J(e)},"loadFont "+d),a.f[d]=e,e.start());return e}
function xl(a,b,c){for(var d=[],e=0;e<b.length;e++){var f=b[e];f.src&&f.b?d.push(wl(a,f,c)):u.b("E_FONT_FACE_INVALID")}return ie(d)};Gd("SIMPLE_PROPERTY",function(a){var b=a.name,c=a.value;switch(b){case "page-break-before":case "page-break-after":case "page-break-inside":return{name:b.replace(/^page-/,""),value:c===Gc?jd:c,important:a.important};default:return a}});var Sk={page:!0,left:!0,right:!0,recto:!0,verso:!0,column:!0,region:!0},yl={avoid:!0,"avoid-page":!0,"avoid-column":!0,"avoid-region":!0};
function Qk(a,b){if(a)if(b){var c=!!Sk[a],d=!!Sk[b];if(c&&d)switch(b){case "column":return a;case "region":return"column"===a?b:a;default:return b}else return d?b:c?a:yl[b]?b:yl[a]?a:b}else return a;else return b}function zl(a){switch(a){case "left":case "right":case "recto":case "verso":return a;default:return"any"}};var Al={img:!0,svg:!0,audio:!0,video:!0};
function Bl(a,b,c,d){var e=a.C;if(!e)return NaN;if(1==e.nodeType){if(a.K){var f=Qj(b,e);if(f.right>=f.left&&f.bottom>=f.top)return d?f.left:f.bottom}return NaN}var f=NaN,g=e.ownerDocument.createRange(),h=e.textContent.length;if(!h)return NaN;a.K&&(c+=h);c>=h&&(c=h-1);g.setStart(e,c);g.setEnd(e,c+1);a=Cl(b,g);if(c=d){c=document.body;if(null==Sa){var l=c.ownerDocument,g=l.createElement("div");g.style.position="absolute";g.style.top="0px";g.style.left="0px";g.style.width="100px";g.style.height="100px";
g.style.overflow="hidden";g.style.lineHeight="16px";g.style.fontSize="16px";v(g,"writing-mode","vertical-rl");c.appendChild(g);h=l.createTextNode("a a a a a a a a a a a a a a a a");g.appendChild(h);l=l.createRange();l.setStart(h,0);l.setEnd(h,1);h=l.getBoundingClientRect();Sa=10>h.right-h.left;c.removeChild(g)}c=Sa}if(c){c=e.ownerDocument.createRange();c.setStart(e,0);c.setEnd(e,e.textContent.length);b=Cl(b,c);e=[];for(c=0;c<a.length;c++){g=a[c];for(h=0;h<b.length;h++)if(l=b[h],g.top>=l.top&&g.bottom<=
l.bottom&&1>Math.abs(g.left-l.left)){e.push({top:g.top,left:l.left,bottom:g.bottom,right:l.right});break}h==b.length&&(u.b("Could not fix character box"),e.push(g))}a=e}for(e=b=0;e<a.length;e++)c=a[e],g=d?c.bottom-c.top:c.right-c.left,c.right>c.left&&c.bottom>c.top&&(isNaN(f)||g>b)&&(f=d?c.left:c.bottom,b=g);return f}
function Dl(a){for(var b=Ed.RESOLVE_LAYOUT_PROCESSOR||[],c=0;c<b.length;c++){var d=b[c](a);if(d)return d}throw Error("No processor found for a formatting context: Table formatting context (vivliostyle.table.TableFormattingContext)");}function El(a,b){this.j=a;this.l=b;this.g=!1;this.h=null}El.prototype.f=function(a,b){if(b<this.l)return null;this.g||(this.h=Fl(a,this,0<b),this.g=!0);return this.h};El.prototype.b=function(){return this.l};
function Gl(a,b,c,d){this.position=a;this.u=b;this.j=c;this.l=d;this.g=!1}Gl.prototype.f=function(a,b){if(!this.g){var c=Bl(this.position,a.h,0,a.b);this.j=this.position.f=Hl(a,c);this.g=!0}b<this.b()?c=null:(a.g=this.l,c=this.position);return c};Gl.prototype.b=function(){if(!this.g)throw Error("EdgeBreakPosition.prototype.updateEdge not called");return(yl[this.u]?1:0)+(this.j?3:0)+(this.position.parent?this.position.parent.w:0)};function Il(a,b,c){this.pa=a;this.f=b;this.b=c}
function Jl(a){for(var b=1;b<a.length;b++){var c=a[b-1],d=a[b];c===d?u.b("validateCheckPoints: duplicate entry"):c.pa>=d.pa?u.b("validateCheckPoints: incorrect boxOffset"):c.V==d.V&&(d.K?c.K&&u.b("validateCheckPoints: duplicate after points"):c.K?u.b("validateCheckPoints: inconsistent after point"):d.pa-c.pa!=d.ga-c.ga&&u.b("validateCheckPoints: boxOffset inconsistent with offsetInNode"))}}
function Kl(a,b,c,d){vk.call(this,a);this.Od=a.lastChild;this.f=b;this.h=c;this.mb=d;this.Fe=a.ownerDocument;this.dd=!1;this.oa=this.Za=this.Aa=this.na=this.U=0;this.Ib=this.Jb=this.D=this.lb=null;this.Sd=!1;this.l=this.j=this.I=null;this.ie=!0;this.fd=this.md=this.gd=0;this.u=!0}t(Kl,vk);Kl.prototype.clone=function(){var a=new Kl(this.element,this.f,this.h,this.mb);Ak(a,this);a.Od=this.Od;a.dd=this.dd;a.D=this.D?this.D.clone():null;a.Jb=this.Jb.concat();return a};
function Hl(a,b){return a.b?b<a.oa:b>a.oa}Kl.prototype.Rd=function(a){var b=this,c=H("openAllViews"),d=a.ja;Ll(b.f,b.element,b.dd);var e=d.length-1,f=null;ce(function(){for(;0<=e;){f=bk(d[e],f);if(!e){var c=f,h;h=a;h=h.Ia?kk(h.Ia,h.ga,1):h.ga;c.ga=h;f.K=a.K;f.Ia=a.Ia;if(f.K)break}c=Ml(b.f,f,!e&&!f.ga);e--;if(c.va())return c}return I(!1)}).then(function(){L(c,f)});return J(c)};var Nl=/^[^A-Za-z0-9_\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]*([A-Za-z0-9_\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527][^A-Za-z0-9_\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]*)?/;
function Ol(a,b){if(b.g&&b.Ca&&!b.K&&!b.g.count&&1!=b.C.nodeType){var c=b.C.textContent.match(Nl);return Pl(a.f,b,c[0].length)}return I(b)}
function Ql(a,b,c){var d=H("buildViewToNextBlockEdge");de(function(d){b.C&&c.push(dk(b));Ol(a,b).then(function(e){e!==b&&(b=e,c.push(dk(b)));Rl(a.f,b).then(function(c){if(b=c){if(!Sl(a.mb,b)&&(b=b.modify(),b.f=!0,a.u)){M(d);return}b.l&&!a.b?Tl(a,b).then(function(c){b=c;!b||a.u&&b&&b.f||0<a.f.f.b.length?M(d):fe(d)}):b.Ca?fe(d):M(d)}else M(d)})})}).then(function(){L(d,b)});return J(d)}
function Ul(a,b){if(!b.C)return I(b);var c=b.V,d=H("buildDeepElementView");de(function(d){Ol(a,b).then(function(e){if(e!==b){for(var f=e;f&&f.V!=c;)f=f.parent;if(!f){b=e;M(d);return}}Rl(a.f,e).then(function(e){(b=e)&&b.V!=c?Sl(a.mb,b)?fe(d):(b=b.modify(),b.f=!0,a.u?M(d):fe(d)):M(d)})})}).then(function(){L(d,b)});return J(d)}
function Vl(a,b,c,d,e){var f=a.Fe.createElement("div");a.b?(v(f,"height",d+"px"),v(f,"width",e+"px")):(v(f,"width",d+"px"),v(f,"height",e+"px"));v(f,"float",c);v(f,"clear",c);a.element.insertBefore(f,b);return f}function Wl(a){for(var b=a.element.firstChild;b;){var c=b.nextSibling;if(1==b.nodeType){var d=b.style.cssFloat;if("left"==d||"right"==d)a.element.removeChild(b);else break}b=c}}
function Xl(a){for(var b=a.element.firstChild,c=a.Ib,d=a.b?a.b?a.U:a.Aa:a.b?a.Za:a.U,e=a.b?a.b?a.na:a.Za:a.b?a.Aa:a.na,f=0;f<c.length;f++){var g=c[f],h=g.Y-g.ba;g.left=Vl(a,b,"left",g.ia-d,h);g.right=Vl(a,b,"right",e-g.aa,h)}}function Yl(a,b,c,d,e){var f;if(b&&b.K&&!b.Ca&&(f=Bl(b,a.h,0,a.b),!isNaN(f)))return f;b=c[d];for(e-=b.pa;;){f=Bl(b,a.h,e,a.b);if(!isNaN(f))return f;if(0<e)e--;else{d--;if(0>d)return a.Aa;b=c[d];1!=b.C.nodeType&&(e=b.C.textContent.length)}}}
function X(a){return"number"==typeof a?a:(a=a.match(/^(-?[0-9]*(\.[0-9]*)?)px$/))?parseFloat(a[0]):0}function Zl(a,b){var c=$l(a.h,b),d=new Of;c&&(d.left=X(c.marginLeft),d.top=X(c.marginTop),d.right=X(c.marginRight),d.bottom=X(c.marginBottom));return d}
function am(a,b){var c=$l(a.h,b),d=new Of;if(c){if("border-box"==c.boxSizing)return Zl(a,b);d.left=X(c.marginLeft)+X(c.borderLeftWidth)+X(c.paddingLeft);d.top=X(c.marginTop)+X(c.borderTopWidth)+X(c.paddingTop);d.right=X(c.marginRight)+X(c.borderRightWidth)+X(c.paddingRight);d.bottom=X(c.marginBottom)+X(c.borderBottomWidth)+X(c.paddingBottom)}return d}
function bm(a,b,c){if(a=$l(a.h,b))c.marginLeft=X(a.marginLeft),c.da=X(a.borderLeftWidth),c.w=X(a.paddingLeft),c.marginTop=X(a.marginTop),c.ma=X(a.borderTopWidth),c.B=X(a.paddingTop),c.marginRight=X(a.marginRight),c.kb=X(a.borderRightWidth),c.G=X(a.paddingRight),c.marginBottom=X(a.marginBottom),c.Sa=X(a.borderBottomWidth),c.F=X(a.paddingBottom)}function cm(a,b,c){b=new Il(b,c,c);a.j?a.j.push(b):a.j=[b]}
function dm(a,b,c,d){if(a.j&&a.j[a.j.length-1].b)return cm(a,b,c),I(!0);d+=40*(a.b?-1:1);var e=a.D,f=!e;if(f){var g=a.element.ownerDocument.createElement("div");v(g,"position","absolute");var h=a.f.clone(),e=new Kl(g,h,a.h,a.mb);a.D=e;e.b=em(a.f,a.b,g);e.dd=!0;a.b?(e.left=0,v(e.element,"width","2em")):(e.top=a.Za,v(e.element,"height","2em"))}a.element.appendChild(e.element);bm(a,e.element,e);g=(a.b?-1:1)*(d-a.Aa);a.b?e.height=a.lb.Y-a.lb.ba-wk(e)-xk(e):e.width=a.lb.aa-a.lb.ia-yk(e)-zk(e);d=(a.b?-1:
1)*(a.Za-d)-(a.b?yk(e)-zk(e):wk(e)+xk(e));if(f&&18>d)return a.element.removeChild(e.element),a.D=null,cm(a,b,c),I(!0);if(!a.b&&e.top<g)return a.element.removeChild(e.element),cm(a,b,c),I(!0);var l=H("layoutFootnoteInner");a.b?Ck(e,0,d):Bk(e,g,d);e.J=a.J+a.left+yk(a);e.M=a.M+a.top+wk(a);e.S=a.S;var k=new ok(c);f?(fm(e),d=I(!0)):e.S.length?d=gm(e):(hm(e),d=I(!0));d.then(function(){im(e,k).then(function(d){if(f&&d)a.element.removeChild(e.element),cm(a,b,c),a.D=null,L(l,!0);else{a.b?(a.oa=a.Za+(e.g+yk(e)+
zk(e)),Ck(e,0,e.g)):(a.oa=a.Za-(e.g+wk(e)+xk(e)),Bk(e,a.oa-a.Aa,e.g));var g;!a.b&&0<e.S.length?g=gm(e):g=I(d);g.then(function(d){d=new Il(b,c,d?d.Oa:null);a.j?a.j.push(d):a.j=[d];L(l,!0)})}})});return J(l)}
function jm(a,b){var c=H("layoutFootnote"),d=b.C;d.setAttribute("style","");v(d,"display","inline-block");d.textContent="M";var e=Qj(a.h,d),f=a.b?e.left:e.bottom;d.textContent="";km(a.f,b,"footnote-call",d);d.textContent||d.parentNode.removeChild(d);d=Zj(b);e=b.pa;b=b.modify();b.K=!0;dm(a,e,d,f).then(function(){a.D&&a.D.element.parentNode&&a.element.removeChild(a.D.element);Hl(a,f)&&a.I.length&&(b.f=!0);L(c,b)});return J(c)}
function lm(a,b){var c=H("layoutFloat"),d=b.C,e=b.l,f=b.oa,g=b.parent?b.parent.ma:"ltr",h=a.f.f,l=b.C.parentNode;"page"===f?mm(h,d,e):(v(d,"float","none"),v(d,"display","inline-block"),v(d,"vertical-align","top"));Ul(a,b).then(function(k){var m=Qj(a.h,d),p=Zl(a,d),m=new Mf(m.left-p.left,m.top-p.top,m.right+p.right,m.bottom+p.bottom);if("page"===f)nm(h,b,a.f)?(m=l.ownerDocument.createElement("span"),v(m,"width","0"),v(m,"height","0"),l.appendChild(m),k.C=m,L(c,k)):om(h,b,m).then(function(){L(c,null)});
else{e=pm(e,a.b,g);for(var q=a.U,w=a.na,p=b.parent;p&&p.Ca;)p=p.parent;if(p){var r=p.C.ownerDocument.createElement("div");r.style.left="0px";r.style.top="0px";a.b?(r.style.bottom="0px",r.style.width="1px"):(r.style.right="0px",r.style.height="1px");p.C.appendChild(r);var x=Qj(a.h,r),q=Math.max(a.b?x.top:x.left,q),w=Math.min(a.b?x.bottom:x.right,w);p.C.removeChild(r);r=a.b?m.Y-m.ba:m.aa-m.ia;"left"==e?w=Math.max(w,q+r):q=Math.min(q,w-r);p.C.appendChild(b.C)}r=new Mf(q,(a.b?-1:1)*a.Aa,w,(a.b?-1:1)*
a.Za);q=m;a.b&&(q=cg(m));w=a.b?-1:1;q.ba<a.fd*w&&(x=q.Y-q.ba,q.ba=a.fd*w,q.Y=q.ba+x);hg(r,a.Ib,q,e);a.b&&(m=new Mf(-q.Y,q.ia,-q.ba,q.aa));r=am(a,d);v(d,"width",m.aa-m.ia-r.left-r.right+"px");v(d,"height",m.Y-m.ba-r.top-r.bottom+"px");v(d,"position","absolute");v(d,"display",b.display);w=null;p&&(p.M?w=p:w=mk(p));w?(r=w.C.ownerDocument.createElement("div"),r.style.position="absolute",w.b?r.style.right="0":r.style.left="0",r.style.top="0",w.C.appendChild(r),p=Qj(a.h,r),w.C.removeChild(r)):p={left:a.b?
a.Za:a.U,right:a.b?a.Aa:a.na,top:a.b?a.U:a.Aa};(w?w.b:a.b)?v(d,"right",p.right-m.aa+a.G+"px"):v(d,"left",m.ia-p.left+a.w+"px");v(d,"top",m.ba-p.top+a.B+"px");b.F&&(b.F.parentNode.removeChild(b.F),b.F=null);p=a.b?m.ia:m.Y;m=a.b?m.aa:m.ba;Hl(a,p)&&a.I.length?(b=b.modify(),b.f=!0,L(c,b)):(Wl(a),r=new Mf(a.b?a.Za:a.U,a.b?a.U:a.Aa,a.b?a.Aa:a.na,a.b?a.na:a.Za),a.b&&(r=cg(r)),ig(r,a.Ib,q,e),Xl(a),"left"==e?a.gd=p:a.md=p,a.fd=m,qm(a,p),L(c,k))}});return J(c)}
function rm(a,b){if(!a.K||a.Ca){for(var c=a.C,d="";c&&b&&!d&&(1!=c.nodeType||(d=c.style.textAlign,b));c=c.parentNode);if(!b||"justify"==d){var c=a.C,e=c.ownerDocument,d=e.createElement("span");d.style.visibility="hidden";var f=document.body;if(null===Ta){var g=f.ownerDocument,h=g.createElement("div");h.style.position="absolute";h.style.top="0px";h.style.left="0px";h.style.width="30px";h.style.height="100px";h.style.lineHeight="16px";h.style.fontSize="16px";h.style.textAlign="justify";f.appendChild(h);
var l=g.createTextNode("a | ");h.appendChild(l);var k=g.createElement("span");k.style.display="inline-block";k.style.width="30px";h.appendChild(k);g=g.createRange();g.setStart(l,0);g.setEnd(l,3);Ta=27>g.getBoundingClientRect().right;f.removeChild(h)}Ta?a.b?d.style.marginTop="100%":d.style.marginLeft="100%":(d.style.display="inline-block",a.b?d.style.height="100%":d.style.width="100%");d.textContent=" #";d.setAttribute("data-adapt-spec","1");f=b&&(a.K||1!=c.nodeType)?c.nextSibling:c;if(c=c.parentNode)c.insertBefore(d,
f),b||(e=e.createElement("div"),c.insertBefore(e,f),d.style.lineHeight="80px",e.style.marginTop="-80px",e.style.height="0px",e.setAttribute("data-adapt-spec","1"))}}}
function sm(a,b,c,d){var e=H("processLineStyling");Jl(d);var f=d.concat([]);d.splice(0,d.length);var g=0,h=b.g;0==h.count&&(h=h.Ne);de(function(d){if(h){var e=tm(a,f),l=h.count-g;if(e.length<=l)M(d);else{var p=um(a,f,e[l-1]);p?vm(a,p,!1,!1).then(function(){g+=l;Pl(a.f,p,0).then(function(e){b=e;rm(b,!1);h=b.g;f=[];Ql(a,b,f).then(function(b){c=b;0<a.f.f.b.length?M(d):fe(d)})})}):M(d)}}else M(d)}).then(function(){Array.prototype.push.apply(d,f);Jl(d);L(e,c)});return J(e)}
function xm(a,b){for(var c=0,d=0,e=b.length-1;0<=e;e--){var f=b[e];if(!f.K||!f.C||1!=f.C.nodeType)break;f=Zl(a,f.C);f=a.b?-f.left:f.bottom;0<f?c=Math.max(c,f):d=Math.min(d,f)}return c-d}
function ym(a,b){var c=H("layoutBreakableBlock"),d=[];Ql(a,b,d).then(function(e){if(0<a.f.f.b.length)L(c,e);else{var f=d.length-1;if(0>f)L(c,e);else{var f=Yl(a,e,d,f,d[f].pa),g=Hl(a,f);e||(f+=xm(a,d));qm(a,f);var h;b.g?h=sm(a,b,e,d):h=I(e);h.then(function(b){0<d.length&&(a.I.push(new El(d,d[0].w)),g&&(2!=d.length&&0<a.I.length||d[0].V!=d[1].V||!Al[d[0].V.localName])&&b&&(b=b.modify(),b.f=!0));L(c,b)})}}});return J(c)}
function um(a,b,c){Jl(b);for(var d=0,e=b[0].pa,f=d,g=b.length-1,h=b[g].pa,l;e<h;){l=e+Math.ceil((h-e)/2);for(var f=d,k=g;f<k;){var m=f+Math.ceil((k-f)/2);b[m].pa>l?k=m-1:f=m}k=Yl(a,null,b,f,l);if(a.b?k<c:k>c){for(h=l-1;b[f].pa==l;)f--;g=f}else qm(a,k),e=l,d=f}a=b[f];b=a.C;1!=b.nodeType?(zm(a),a.K?a.ga=b.length:(c=e-a.pa,e=b.data,173==e.charCodeAt(c)?(b.replaceData(c,e.length-c,a.B?"":a.u||a.parent&&a.parent.u||"-"),e=c+1):(d=e.charAt(c),c++,f=e.charAt(c),b.replaceData(c,e.length-c,!a.B&&Fa(d)&&Fa(f)?
a.u||a.parent&&a.parent.u||"-":""),e=c),c=e,0<c&&(e=c,a=a.modify(),a.ga+=e,a.h=null)),e=a):e=a;return e}function zm(a){(Ed.RESOLVE_TEXT_NODE_BREAKER||[]).reduce(function(b,c){return c(a)||b},Am)}var Am=new function(){};
function tm(a,b){for(var c=[],d=b[0].C,e=b[b.length-1].C,f=[],g=d.ownerDocument.createRange(),h=!1,l=null,k=!1,m=!0;m;){var p=!0;do{var q=null;d==e&&(m=!1);1!=d.nodeType?(k||(g.setStartBefore(d),k=!0),l=d):h?h=!1:d.getAttribute("data-adapt-spec")?p=!k:q=d.firstChild;q||(q=d.nextSibling,q||(h=!0,q=d.parentNode));d=q}while(p&&m);if(k){g.setEndAfter(l);k=Cl(a.h,g);for(p=0;p<k.length;p++)f.push(k[p]);k=!1}}f.sort(a.b?Xj:Wj);l=d=h=g=e=0;for(m=a.b?-1:1;;){if(l<f.length&&(k=f[l],p=1,0<d&&(p=Math.max(a.b?
k.right-k.left:k.bottom-k.top,1),p=m*(a.b?k.right:k.top)<m*e?m*((a.b?k.left:k.bottom)-e)/p:m*(a.b?k.left:k.bottom)>m*g?m*(g-(a.b?k.right:k.top))/p:1),!d||.6<=p||.2<=p&&(a.b?k.top:k.left)>=h-1)){h=a.b?k.bottom:k.right;a.b?(e=d?Math.max(e,k.right):k.right,g=d?Math.min(g,k.left):k.left):(e=d?Math.min(e,k.top):k.top,g=d?Math.max(g,k.bottom):k.bottom);d++;l++;continue}0<d&&(c.push(g),d=0);if(l>=f.length)break}c.sort(Ja);a.b&&c.reverse();return c}
function Bm(a,b){if(!a.j)return I(!0);for(var c=!1,d=a.j.length-1;0<=d;--d){var e=a.j[d];if(e.pa<=b)break;a.j.pop();e.b!==e.f&&(c=!0)}if(!c)return I(!0);var f=H("clearFootnotes"),g=a.g+a.Aa,h=a.j;a.D=null;a.j=null;var l=0;ce(function(){for(;l<h.length;){var b=h[l++],b=dm(a,b.pa,b.f,g);if(b.va())return b}return I(!1)}).then(function(){L(f,!0)});return J(f)}
function Fl(a,b,c){for(var d=b.j,e=d[0];e.parent&&e.Ca;)e=e.parent;var f;c?f=c=1:(c=Math.max((e.j.widows||2)-0,1),f=Math.max((e.j.orphans||2)-0,1));var g=0;nk(e,function(b){if("clone"===b.j["box-decoration-break"]){var c=$l(a.h,b.C),d=new Of;c&&(d.left=X(c.borderLeftWidth)+X(c.paddingLeft),d.top=X(c.borderTopWidth)+X(c.paddingTop),d.right=X(c.borderRightWidth)+X(c.paddingRight),d.bottom=X(c.borderBottomWidth)+X(c.paddingBottom));g+=b.b?-d.left:d.bottom}});var h=tm(a,d),l=a.oa-g,d=Ia(h.length,function(b){return a.b?
h[b]<l:h[b]>l}),d=Math.min(h.length-c,d);if(d<f)return null;l=h[d-1];if(b=um(a,b.j,l))a.g=(a.b?-1:1)*(l-a.Aa);return b}function vm(a,b,c,d){if(b.R){var e=Cm(Dl(b.R),b);if(e)return e}c=c||!!b.C&&1==b.C.nodeType&&!b.K;Dm(b,c);d&&(rm(b,!0),Em(c?b:b.parent));return Bm(a,b.pa)}Kl.prototype.Ob=function(){var a=null,b=null,c,d=0;do{c=d;for(var d=Number.MAX_VALUE,e=this.I.length-1;0<=e&&!b;--e){var a=this.I[e],b=a.f(this,c),f=a.b();f>c&&(d=Math.min(d,f))}}while(d>c&&!b);return{Jc:b?a:null,A:b}};
function Fm(a,b,c){var d=H("findAcceptableBreak"),e=a.Ob().A,f=!1;if(!e){u.b("Could not find any page breaks?!!");if(a.ie)return Gm(a,b).then(function(b){b?(b=b.modify(),b.f=!1,vm(a,b,f,!0).then(function(){L(d,b)})):L(d,b)}),J(d);e=c;f=!0}vm(a,e,f,!0).then(function(){L(d,e)});return J(d)}function Hm(a){a=a.toString();return""==a||"auto"==a||!!a.match(/^0+(.0*)?[^0-9]/)}
function Im(a,b,c,d){if(!b)return!1;var e=Bl(b,a.h,0,a.b),f=Hl(a,e);c&&(e+=xm(a,c));qm(a,e);c=dk(b);var g;b.R&&(Dl(b.R),g=new Jm(c,d,f,a.g));g||(g=new Gl(c,d,f,a.g));a.I.push(g);return f}
function Km(a,b){if(b.C.parentNode){var c=Zl(a,b.C),d=b.C.ownerDocument.createElement("div");a.b?(d.style.bottom="0px",d.style.width="1px",d.style.marginRight=c.right+"px"):(d.style.right="0px",d.style.height="1px",d.style.marginTop=c.top+"px");b.C.parentNode.insertBefore(d,b.C);var e=Qj(a.h,d),e=a.b?e.right:e.top,f=a.b?-1:1,g;switch(b.D){case "left":g=a.gd;break;case "right":g=a.md;break;default:g=f*Math.max(a.md*f,a.gd*f)}e*f>=g*f?b.C.parentNode.removeChild(d):(e=Math.max(1,(g-e)*f),a.b?d.style.width=
e+"px":d.style.height=e+"px",e=Qj(a.h,d),e=a.b?e.left:e.bottom,a.b?(g=e+c.right-g,0<g==0<=c.right&&(g+=c.right),d.style.marginLeft=g+"px"):(g-=e+c.top,0<g==0<=c.top&&(g+=c.top),d.style.marginBottom=g+"px"),b.F=d)}}
function Lm(a,b,c){function d(){b=k[0]||b;b.C.parentNode.removeChild(b.C);e.l=h}if(b.R)return I(b);var e=a,f=H("skipEdges"),g=c&&b&&b.K,h=null,l=null,k=[],m=[],p=!1;de(function(a){for(;b;){do if(b.C){if(b.Ca&&1!=b.C.nodeType){if(Sj(b.C,b.Hb))break;if(!b.K){!c&&Sk[h]?d():Im(e,l,null,h)?(b=(l||b).modify(),b.f=!0):(b=b.modify(),b.h=h);M(a);return}}if(!b.K&&(b.D&&Km(e,b),b.R||b.l||b.I)){k.push(dk(b));h=Qk(h,b.h);if(!c&&Sk[h])d();else if(Im(e,l,null,h)||!Sl(e.mb,b))b=(l||b).modify(),b.f=!0;M(a);return}if(1==
b.C.nodeType){var f=b.C.style;if(b.K){if(p){if(!c&&Sk[h]){d();M(a);return}k=[];g=c=!1;h=null}p=!1;l=dk(b);m.push(l);h=Qk(h,b.G);if(f&&(!Hm(f.paddingBottom)||!Hm(f.borderBottomWidth))){if(Im(e,l,null,h)&&(b=(l||b).modify(),b.f=!0,e.u)){M(a);return}m=[l];l=null}}else{k.push(dk(b));h=Qk(h,b.h);if(!Sl(e.mb,b)&&(Im(e,l,null,h),b=b.modify(),b.f=!0,e.u)){M(a);return}if(Al[b.C.localName]){!c&&Sk[h]?d():Im(e,l,null,h)&&(b=(l||b).modify(),b.f=!0);M(a);return}!f||Hm(f.paddingTop)&&Hm(f.borderTopWidth)||(g=!1,
m=[]);p=!0}}}while(0);f=Rl(e.f,b,g);if(f.va()){f.then(function(c){b=c;fe(a)});return}b=f.get()}Im(e,l,m,h)?l&&(b=l.modify(),b.f=!0):Sk[h]&&(e.l=h);M(a)}).then(function(){L(f,b)});return J(f)}
function Gm(a,b){var c=dk(b),d=H("skipEdges"),e=null,f=!1;de(function(d){for(;b;){do if(b.C){if(b.Ca&&1!=b.C.nodeType){if(Sj(b.C,b.Hb))break;if(!b.K){Sk[e]&&(a.l=e);M(d);return}}if(!b.K&&(b.l||b.I)){e=Qk(e,b.h);Sk[e]&&(a.l=e);M(d);return}if(1==b.C.nodeType){var g=b.C.style;if(b.K){if(f){if(Sk[e]){a.l=e;M(d);return}e=null}f=!1;e=Qk(e,b.G)}else{e=Qk(e,b.h);if(Al[b.C.localName]){Sk[e]&&(a.l=e);M(d);return}if(g&&(!Hm(g.paddingTop)||!Hm(g.borderTopWidth))){M(d);return}}f=!0}}while(0);g=Rl(a.f,b);if(g.va()){g.then(function(a){b=
a;fe(d)});return}b=g.get()}c=null;M(d)}).then(function(){L(d,c)});return J(d)}function Tl(a,b){return"footnote"==b.l?jm(a,b):lm(a,b)}function Mm(a,b,c){var d=H("layoutNext");Lm(a,b,c).then(function(c){b=c;if(!b||a.l||a.u&&b&&b.f)L(d,b);else if(b.l)Tl(a,b).sa(d);else if(b.R)Nm(Dl(b.R),b,a).sa(d);else{a:if(b.K)c=!0;else{switch(b.V.namespaceURI){case "http://www.w3.org/2000/svg":c=!1;break a}c=!b.I}c?ym(a,b).sa(d):Ul(a,b).sa(d)}});return J(d)}
function Dm(a,b){do{var c=a.C.parentNode;if(!c)break;var d=c,e=a.C;if(d)for(var f;(f=d.lastChild)!=e;)d.removeChild(f);b&&(c.removeChild(a.C),b=!1);a=a.parent}while(a)}
function hm(a){var b=a.element.ownerDocument.createElement("div");b.style.position="absolute";b.style.top=a.B+"px";b.style.right=a.G+"px";b.style.bottom=a.F+"px";b.style.left=a.w+"px";a.element.appendChild(b);var c=Qj(a.h,b);a.element.removeChild(b);var b=a.J+a.left+yk(a),d=a.M+a.top+wk(a);a.lb=new Mf(b,d,b+a.width,d+a.height);a.U=c?a.b?c.top:c.left:0;a.na=c?a.b?c.bottom:c.right:0;a.Aa=c?a.b?c.right:c.top:0;a.Za=c?a.b?c.left:c.bottom:0;a.gd=a.Aa;a.md=a.Aa;a.fd=a.Aa;a.oa=a.Za;c=a.lb;b=a.J+a.left+yk(a);
d=a.M+a.top+wk(a);if(a.Kb){for(var e=a.Kb,f=[],g=0;g<e.b.length;g++){var h=e.b[g];f.push(new Nf(h.f+b,h.b+d))}b=new Sf(f)}else b=Vf(b,d,b+a.width,d+a.height);a.Ib=eg(c,[b],a.S,a.nb,a.b);Xl(a);a.j=null}function fm(a){a.Jb=[];v(a.element,"width",a.width+"px");v(a.element,"height",a.height+"px");hm(a);a.g=0;a.Sd=!1;a.l=null}function qm(a,b){a.g=Math.max((a.b?-1:1)*(b-a.Aa),a.g)}
function Om(a,b){var c=b.b;if(!c)return I(!0);var d=H("layoutOverflownFootnotes"),e=0;ce(function(){for(;e<c.length;){var b=c[e++],b=dm(a,0,b,a.Aa);if(b.va())return b}return I(!1)}).then(function(){L(d,!0)});return J(d)}
function im(a,b,c){a.Jb.push(b);if(a.u&&a.Sd)return I(b);var d=H("layout");Om(a,b).then(function(){a.Rd(b.Oa).then(function(b){var e=b;a.I=[];de(function(d){for(;b;){var f=!0;Mm(a,b,c).then(function(g){c=!1;b=g;0<a.f.f.b.length?M(d):a.l?M(d):b&&a.u&&b&&b.f?Fm(a,b,e).then(function(a){b=a;M(d)}):f?f=!1:fe(d)});if(f){f=!1;return}}M(d)}).then(function(){var c=a.D;c&&(a.element.appendChild(c.element),a.b?a.g=this.Aa-this.Za:a.g=c.top+wk(c)+c.g+xk(c));if(b)if(0<a.f.f.b.length)L(d,null);else{a.Sd=!0;c=new ok(jk(b));
if(a.j){for(var e=[],f=0;f<a.j.length;f++){var k=a.j[f].b;k&&e.push(k)}c.b=e.length?e:null}L(d,c)}else L(d,null)})})});return J(d)}function gm(a){for(var b=a.Jb,c=a.element.lastChild;c!=a.Od;){var d=c.previousSibling;a.element===c.parentNode&&Pm(c)||a.element.removeChild(c);c=d}Wl(a);fm(a);var e=H("redoLayout"),f=0,g=null,h=!0;de(function(c){if(f<b.length){var d=b[f++];im(a,d,h).then(function(a){h=!1;a?(g=a,M(c)):fe(c)})}else M(c)}).then(function(){L(e,g)});return J(e)};function Qm(a,b){this.b=a;this.X=b}function Rm(a,b,c,d){this.b=a;this.g=b;this.j=c;this.f=d;this.h=null}function Sm(a,b){this.b=a;this.f=b}function Tm(a){var b={};Object.keys(a).forEach(function(c){b[c]=Array.from(a[c])});return b}function Um(a,b){this.Tb=a;this.wc=b;this.zd=null;this.X=this.L=-1}function Si(a,b,c){b=a.b.I.Hd(b,a.f);a.b.l[b]=c}function Vm(a){return(a=a.match(/^[^#]*#(.*)$/))?a[1]:null}function Wm(a,b){var c=a.b.I.Cc(la(b,a.g),a.g);"#"===c.charAt(0)&&(c=c.substring(1));return c}
function xi(a,b,c){return new tb(a.f,function(){var d=a.b.b[b];return c(d&&d.length?d[d.length-1]:null)},"page-counter-"+b)}function zi(a,b,c){return new tb(a.f,function(){return c(a.b.b[b]||[])},"page-counters-"+b)}function Xm(a,b,c,d){var e=a.b.l[c];if(!e&&d&&b){d=a.h;if(b){d.w=b;for(b=0;d.w&&(b+=5E3,gl(d,b,0)!==Number.POSITIVE_INFINITY););d.w=null}e=a.b.l[c]}return e||null}
function Bi(a,b,c,d){var e=Vm(b),f=Wm(a,b),g=Xm(a,e,f,!1);return g&&g[c]?(b=g[c],new rb(a.j,d(b[b.length-1]||null))):new tb(a.f,function(){if(g=Xm(a,e,f,!0)){if(g[c]){var b=g[c];return d(b[b.length-1]||null)}if(b=a.b.j.b[f]?a.b.b:a.b.w[f]||null)return Ym(a.b,f),b[c]?(b=b[c],d(b[b.length-1]||null)):d(0);Zm(a.b,f,!1);return"??"}Zm(a.b,f,!1);return"??"},"target-counter-"+c+"-of-"+b)}
function Di(a,b,c,d){var e=Vm(b),f=Wm(a,b);return new tb(a.f,function(){var b=a.b.j.b[f]?a.b.b:a.b.w[f]||null;if(b){Ym(a.b,f);var b=b[c]||[],h=Xm(a,e,f,!0)[c]||[];return d(b.concat(h))}Zm(a.b,f,!1);return"??"},"target-counters-"+c+"-of-"+b)}function $m(a){this.I=a;this.l={};this.w={};this.b={};this.b.page=[0];this.F={};this.D=[];this.B={};this.j=null;this.u=[];this.g=[];this.G=[];this.f={};this.h={}}function an(a,b){var c=a.b.page;c&&c.length?c[c.length-1]=b:a.b.page=[b]}
function bn(a,b,c){a.F=Tm(a.b);var d,e=b["counter-reset"];e&&(e=e.evaluate(c))&&(d=pg(e,!0));if(d)for(var f in d){var e=a,g=f,h=d[f];e.b[g]?e.b[g].push(h):e.b[g]=[h]}var l;(b=b["counter-increment"])&&(c=b.evaluate(c))&&(l=pg(c,!1));l?"page"in l||(l.page=1):l={page:1};for(var k in l)a.b[k]||(c=a,b=k,c.b[b]?c.b[b].push(0):c.b[b]=[0]),c=a.b[k],c[c.length-1]+=l[k]}function cn(a,b){a.D.push(a.b);a.b=Tm(b)}
function Ym(a,b){var c=a.f[b],d=a.h[b];d||(d=a.h[b]=[]);for(var e=!1,f=0;f<a.g.length;){var g=a.g[f];g.Tb===b?(g.wc=!0,a.g.splice(f,1),c&&(e=c.indexOf(g),0<=e&&c.splice(e,1)),d.push(g),e=!0):f++}e||Zm(a,b,!0)}function Zm(a,b,c){a.u.some(function(a){return a.Tb===b})||a.u.push(new Um(b,c))}
function dn(a,b,c){var d=Object.keys(a.j.b);if(0<d.length){var e=Tm(a.b);d.forEach(function(a){this.w[a]=e;var d=this.B[a];if(d&&d.X<c&&(d=this.h[a])){var f=this.f[a];f||(f=this.f[a]=[]);for(var g;g=d.shift();)g.wc=!1,f.push(g)}this.B[a]={L:b,X:c}},a)}for(var d=a.F,f;f=a.u.shift();){f.zd=d;f.L=b;f.X=c;var g;f.wc?(g=a.h[f.Tb])||(g=a.h[f.Tb]=[]):(g=a.f[f.Tb])||(g=a.f[f.Tb]=[]);g.every(function(a){return!(f===a||a&&f.Tb===a.Tb&&f.wc===a.wc&&f.L===a.L&&f.X===a.X)})&&g.push(f)}a.j=null}
function en(a,b){var c=[];Object.keys(b.b).forEach(function(a){(a=this.f[a])&&(c=c.concat(a))},a);c.sort(function(a,b){return a.L-b.L||a.X-b.X});var d=[],e=null;c.forEach(function(a){e&&e.L===a.L&&e.X===a.X?e.Rc.push(a):(e={L:a.L,X:a.X,zd:a.zd,Rc:[a]},d.push(e))});return d}function fn(a,b){a.G.push(a.g);a.g=b}function Sl(a,b){if(!b||b.K)return!0;var c=b.C;if(!c||1!==c.nodeType)return!0;c=c.getAttribute("id")||c.getAttribute("name");return c&&(a.b.h[c]||a.b.f[c])?(c=a.b.B[c])?a.X>=c.X:!0:!0};var gn=1;function hn(a,b,c,d,e){this.b={};this.j=[];this.g=null;this.index=0;this.f=a;this.name=b;this.Db=c;this.Ba=d;this.parent=e;this.l="p"+gn++;e&&(this.index=e.j.length,e.j.push(this))}hn.prototype.h=function(){throw Error("E_UNEXPECTED_CALL");};hn.prototype.clone=function(){throw Error("E_UNEXPECTED_CALL");};function jn(a,b){var c=a.b,d=b.b,e;for(e in c)Object.prototype.hasOwnProperty.call(c,e)&&(d[e]=c[e])}function kn(a,b){for(var c=0;c<a.j.length;c++)a.j[c].clone({parent:b})}
function ln(a){hn.call(this,a,null,null,[],null);this.b.width=new V(yd,0);this.b.height=new V(zd,0)}t(ln,hn);
function mn(a,b){this.g=b;var c=this;qb.call(this,a,function(a,b){var d=a.match(/^([^.]+)\.([^.]+)$/);if(d){var e=c.g.u[d[1]];if(e&&(e=this.ma[e])){if(b){var d=d[2],h=e.ma[d];if(h)e=h;else{switch(d){case "columns":var h=e.f.f,l=new ic(h,0),k=nn(e,"column-count"),m=nn(e,"column-width"),p=nn(e,"column-gap"),h=z(h,kc(h,new fc(h,"min",[l,k]),y(h,m,p)),p)}h&&(e.ma[d]=h);e=h}}else e=nn(e,d[2]);return e}}return null})}t(mn,qb);
function on(a,b,c,d,e,f,g){a=a instanceof mn?a:new mn(a,this);hn.call(this,a,b,c,d,e);this.g=this;this.T=f;this.W=g;this.b.width=new V(yd,0);this.b.height=new V(zd,0);this.b["wrap-flow"]=new V(Hc,0);this.b.position=new V(kd,0);this.b.overflow=new V(vd,0);this.u={}}t(on,hn);on.prototype.h=function(a){return new pn(a,this)};on.prototype.clone=function(a){a=new on(this.f,this.name,a.Db||this.Db,this.Ba,this.parent,this.T,this.W);jn(this,a);kn(this,a);return a};
function qn(a,b,c,d,e){hn.call(this,a,b,c,d,e);this.g=e.g;b&&(this.g.u[b]=this.l);this.b["wrap-flow"]=new V(Hc,0)}t(qn,hn);qn.prototype.h=function(a){return new rn(a,this)};qn.prototype.clone=function(a){a=new qn(a.parent.f,this.name,this.Db,this.Ba,a.parent);jn(this,a);kn(this,a);return a};function sn(a,b,c,d,e){hn.call(this,a,b,c,d,e);this.g=e.g;b&&(this.g.u[b]=this.l)}t(sn,hn);sn.prototype.h=function(a){return new tn(a,this)};
sn.prototype.clone=function(a){a=new sn(a.parent.f,this.name,this.Db,this.Ba,a.parent);jn(this,a);kn(this,a);return a};function Y(a,b,c){return b&&b!==Hc?b.qa(a,c):null}function un(a,b,c){return b&&b!==Hc?b.qa(a,c):a.b}function vn(a,b,c){return b?b===Hc?null:b.qa(a,c):a.b}function wn(a,b,c,d){return b&&c!==F?b.qa(a,d):a.b}function xn(a,b,c){return b?b===wd?a.j:b===Tc?a.h:b.qa(a,a.b):c}
function yn(a,b){this.g=a;this.f=b;this.J={};this.style={};this.B=this.D=null;this.w=[];this.M=this.S=this.h=this.j=!1;this.G=this.I=0;this.F=null;this.na={};this.ma={};this.ta=this.b=!1;a&&a.w.push(this)}function zn(a){a.I=0;a.G=0}function An(a,b,c){b=nn(a,b);c=nn(a,c);if(!b||!c)throw Error("E_INTERNAL");return y(a.f.f,b,c)}
function nn(a,b){var c=a.na[b];if(c)return c;var d=a.style[b];d&&(c=d.qa(a.f.f,a.f.f.b));switch(b){case "margin-left-edge":c=nn(a,"left");break;case "margin-top-edge":c=nn(a,"top");break;case "margin-right-edge":c=An(a,"border-right-edge","margin-right");break;case "margin-bottom-edge":c=An(a,"border-bottom-edge","margin-bottom");break;case "border-left-edge":c=An(a,"margin-left-edge","margin-left");break;case "border-top-edge":c=An(a,"margin-top-edge","margin-top");break;case "border-right-edge":c=
An(a,"padding-right-edge","border-right-width");break;case "border-bottom-edge":c=An(a,"padding-bottom-edge","border-bottom-width");break;case "padding-left-edge":c=An(a,"border-left-edge","border-left-width");break;case "padding-top-edge":c=An(a,"border-top-edge","border-top-width");break;case "padding-right-edge":c=An(a,"right-edge","padding-right");break;case "padding-bottom-edge":c=An(a,"bottom-edge","padding-bottom");break;case "left-edge":c=An(a,"padding-left-edge","padding-left");break;case "top-edge":c=
An(a,"padding-top-edge","padding-top");break;case "right-edge":c=An(a,"left-edge","width");break;case "bottom-edge":c=An(a,"top-edge","height")}if(!c){if("extent"==b)d=a.b?"width":"height";else if("measure"==b)d=a.b?"height":"width";else{var e=a.b?nh:oh,d=b,f;for(f in e)d=d.replace(f,e[f])}d!=b&&(c=nn(a,d))}c&&(a.na[b]=c);return c}
function Bn(a){var b=a.f.f,c=a.style,d=xn(b,c.enabled,b.j),e=Y(b,c.page,b.b);if(e)var f=new dc(b,"page-number"),d=jc(b,d,new Wb(b,e,f));(e=Y(b,c["min-page-width"],b.b))&&(d=jc(b,d,new Vb(b,new dc(b,"page-width"),e)));(e=Y(b,c["min-page-height"],b.b))&&(d=jc(b,d,new Vb(b,new dc(b,"page-height"),e)));d=a.U(d);c.enabled=new E(d)}yn.prototype.U=function(a){return a};
yn.prototype.rd=function(){var a=this.f.f,b=this.style,c=this.g?this.g.style.width.qa(a,null):null,d=Y(a,b.left,c),e=Y(a,b["margin-left"],c),f=wn(a,b["border-left-width"],b["border-left-style"],c),g=un(a,b["padding-left"],c),h=Y(a,b.width,c),l=Y(a,b["max-width"],c),k=un(a,b["padding-right"],c),m=wn(a,b["border-right-width"],b["border-right-style"],c),p=Y(a,b["margin-right"],c),q=Y(a,b.right,c),w=y(a,f,g),r=y(a,f,k);d&&q&&h?(w=z(a,c,y(a,h,y(a,y(a,d,w),r))),e?p?q=z(a,w,p):p=z(a,w,y(a,q,e)):(w=z(a,w,
q),p?e=z(a,w,p):p=e=kc(a,w,new rb(a,.5)))):(e||(e=a.b),p||(p=a.b),d||q||h||(d=a.b),d||h?d||q?h||q||(h=this.D,this.j=!0):d=a.b:(h=this.D,this.j=!0),w=z(a,c,y(a,y(a,e,w),y(a,p,r))),this.j&&(l||(l=z(a,w,d?d:q)),this.b||!Y(a,b["column-width"],null)&&!Y(a,b["column-count"],null)||(h=l,this.j=!1)),d?h?q||(q=z(a,w,y(a,d,h))):h=z(a,w,y(a,d,q)):d=z(a,w,y(a,q,h)));a=un(a,b["snap-width"]||(this.g?this.g.style["snap-width"]:null),c);b.left=new E(d);b["margin-left"]=new E(e);b["border-left-width"]=new E(f);b["padding-left"]=
new E(g);b.width=new E(h);b["max-width"]=new E(l?l:h);b["padding-right"]=new E(k);b["border-right-width"]=new E(m);b["margin-right"]=new E(p);b.right=new E(q);b["snap-width"]=new E(a)};
yn.prototype.sd=function(){var a=this.f.f,b=this.style,c=this.g?this.g.style.width.qa(a,null):null,d=this.g?this.g.style.height.qa(a,null):null,e=Y(a,b.top,d),f=Y(a,b["margin-top"],c),g=wn(a,b["border-top-width"],b["border-top-style"],c),h=un(a,b["padding-top"],c),l=Y(a,b.height,d),k=Y(a,b["max-height"],d),m=un(a,b["padding-bottom"],c),p=wn(a,b["border-bottom-width"],b["border-bottom-style"],c),q=Y(a,b["margin-bottom"],c),w=Y(a,b.bottom,d),r=y(a,g,h),x=y(a,p,m);e&&w&&l?(d=z(a,d,y(a,l,y(a,y(a,e,r),
x))),f?q?w=z(a,d,f):q=z(a,d,y(a,w,f)):(d=z(a,d,w),q?f=z(a,d,q):q=f=kc(a,d,new rb(a,.5)))):(f||(f=a.b),q||(q=a.b),e||w||l||(e=a.b),e||l?e||w?l||w||(l=this.B,this.h=!0):e=a.b:(l=this.B,this.h=!0),d=z(a,d,y(a,y(a,f,r),y(a,q,x))),this.h&&(k||(k=z(a,d,e?e:w)),this.b&&(Y(a,b["column-width"],null)||Y(a,b["column-count"],null))&&(l=k,this.h=!1)),e?l?w||(w=z(a,d,y(a,e,l))):l=z(a,d,y(a,w,e)):e=z(a,d,y(a,w,l)));a=un(a,b["snap-height"]||(this.g?this.g.style["snap-height"]:null),c);b.top=new E(e);b["margin-top"]=
new E(f);b["border-top-width"]=new E(g);b["padding-top"]=new E(h);b.height=new E(l);b["max-height"]=new E(k?k:l);b["padding-bottom"]=new E(m);b["border-bottom-width"]=new E(p);b["margin-bottom"]=new E(q);b.bottom=new E(w);b["snap-height"]=new E(a)};
function Cn(a){var b=a.f.f,c=a.style;a=Y(b,c[a.b?"height":"width"],null);var d=Y(b,c["column-width"],a),e=Y(b,c["column-count"],null),f;(f=(f=c["column-gap"])&&f!==gd?f.qa(b,null):null)||(f=new cc(b,1,"em"));d&&!e&&(e=new fc(b,"floor",[lc(b,y(b,a,f),y(b,d,f))]),e=new fc(b,"max",[b.f,e]));e||(e=b.f);d=z(b,lc(b,y(b,a,f),e),f);c["column-width"]=new E(d);c["column-count"]=new E(e);c["column-gap"]=new E(f)}function Dn(a,b,c,d){a=a.style[b].qa(a.f.f,null);return Fb(a,c,d,{})}
function En(a,b){b.ma[a.f.l]=a;var c=a.f.f,d=a.style,e=a.g?Fn(a.g,b):null,e=ej(a.J,b,e,!1);a.b=dj(e,b,a.g?a.g.b:!1);fj(e,d,a.b,function(a,b){return b.value});a.D=new tb(c,function(){return a.I},"autoWidth");a.B=new tb(c,function(){return a.G},"autoHeight");a.rd();a.sd();Cn(a);Bn(a)}function Gn(a,b,c){(a=a.style[c])&&(a=Lf(b,a,c));return a}function Z(a,b,c){(a=a.style[c])&&(a=Lf(b,a,c));return Dc(a,b)}
function Fn(a,b){var c;a:{if(c=a.J["region-id"]){for(var d=[],e=0;e<c.length;e++){var f=c[e].evaluate(b,"");f&&f!==A&&d.push(f)}if(d.length){c=d;break a}}c=null}if(c){d=[];for(e=0;e<c.length;e++)d[e]=c[e].toString();return d}return null}function Hn(a,b,c,d,e){if(a=Gn(a,b,d))a.Zb()&&xb(a.ea)&&(a=new D(Dc(a,b),"px")),"font-family"===d&&(a=sl(e,a)),v(c.element,d,a.toString())}
function In(a,b,c){var d=Z(a,b,"left"),e=Z(a,b,"margin-left"),f=Z(a,b,"padding-left"),g=Z(a,b,"border-left-width");a=Z(a,b,"width");Ck(c,d,a);v(c.element,"margin-left",e+"px");v(c.element,"padding-left",f+"px");v(c.element,"border-left-width",g+"px");c.marginLeft=e;c.da=g;c.w=f}
function Jn(a,b,c){var d=Z(a,b,"right"),e=Z(a,b,"snap-height"),f=Z(a,b,"margin-right"),g=Z(a,b,"padding-right");b=Z(a,b,"border-right-width");v(c.element,"margin-right",f+"px");v(c.element,"padding-right",g+"px");v(c.element,"border-right-width",b+"px");c.marginRight=f;c.kb=b;a.b&&0<e&&(a=d+zk(c),a-=Math.floor(a/e)*e,0<a&&(c.Ub=e-a,g+=c.Ub));c.G=g;c.Fc=e}
function Kn(a,b,c){var d=Z(a,b,"snap-height"),e=Z(a,b,"top"),f=Z(a,b,"margin-top"),g=Z(a,b,"padding-top");b=Z(a,b,"border-top-width");c.top=e;c.marginTop=f;c.ma=b;c.nb=d;!a.b&&0<d&&(a=e+wk(c),a-=Math.floor(a/d)*d,0<a&&(c.ta=d-a,g+=c.ta));c.B=g;v(c.element,"top",e+"px");v(c.element,"margin-top",f+"px");v(c.element,"padding-top",g+"px");v(c.element,"border-top-width",b+"px")}
function Ln(a,b,c){var d=Z(a,b,"margin-bottom"),e=Z(a,b,"padding-bottom"),f=Z(a,b,"border-bottom-width");a=Z(a,b,"height")-c.ta;v(c.element,"height",a+"px");v(c.element,"margin-bottom",d+"px");v(c.element,"padding-bottom",e+"px");v(c.element,"border-bottom-width",f+"px");c.height=a-c.ta;c.marginBottom=d;c.Sa=f;c.F=e}function Mn(a,b,c){a.b?(Kn(a,b,c),Ln(a,b,c)):(Jn(a,b,c),In(a,b,c))}
function Nn(a,b,c){v(c.element,"border-top-width","0px");var d=Z(a,b,"max-height");a.S?Bk(c,0,d):(Kn(a,b,c),d-=c.ta,c.height=d,v(c.element,"height",d+"px"))}function On(a,b,c){v(c.element,"border-left-width","0px");var d=Z(a,b,"max-width");a.M?Ck(c,0,d):(Jn(a,b,c),d-=c.Ub,c.width=d,a=Z(a,b,"right"),v(c.element,"right",a+"px"),v(c.element,"width",d+"px"))}
var Pn="border-left-style border-right-style border-top-style border-bottom-style border-left-color border-right-color border-top-color border-bottom-color outline-style outline-color outline-width overflow visibility".split(" "),Qn="border-top-left-radius border-top-right-radius border-bottom-right-radius border-bottom-left-radius border-image-source border-image-slice border-image-width border-image-outset border-image-repeat background-attachment background-color background-image background-repeat background-position background-clip background-origin background-size opacity z-index".split(" "),
Rn="color font-family font-size font-style font-weight font-variant line-height letter-spacing text-align text-decoration text-indent text-transform white-space word-spacing".split(" "),Sn=["transform","transform-origin"];
yn.prototype.Cb=function(a,b,c,d){this.g&&this.b==this.g.b||v(b.element,"writing-mode",this.b?"vertical-rl":"horizontal-tb");(this.b?this.j:this.h)?this.b?On(this,a,b):Nn(this,a,b):(this.b?Jn(this,a,b):Kn(this,a,b),this.b?In(this,a,b):Ln(this,a,b));(this.b?this.h:this.j)?this.b?Nn(this,a,b):On(this,a,b):Mn(this,a,b);for(c=0;c<Pn.length;c++)Hn(this,a,b,Pn[c],d)};function Tn(a,b,c,d){for(var e=0;e<Rn.length;e++)Hn(a,b,c,Rn[e],d)}
yn.prototype.Mc=function(a,b,c,d,e,f,g){this.b?this.I=b.g+b.Ub:this.G=b.g+b.ta;var h=(this.b||!d)&&this.h,l=(!this.b||!d)&&this.j;if(l||h)l&&v(b.element,"width","auto"),h&&v(b.element,"height","auto"),d=Qj(f,d?d.element:b.element),l&&(this.I=Math.ceil(d.right-d.left-b.w-b.da-b.G-b.kb),this.b&&(this.I+=b.Ub)),h&&(this.G=d.bottom-d.top-b.B-b.ma-b.F-b.Sa,this.b||(this.G+=b.ta));(this.b?this.h:this.j)&&Mn(this,a,b);if(this.b?this.j:this.h){if(this.b?this.M:this.S)this.b?Jn(this,a,b):Kn(this,a,b);this.b?
In(this,a,b):Ln(this,a,b)}if(1<e&&(l=Z(this,a,"column-rule-width"),d=Gn(this,a,"column-rule-style"),f=Gn(this,a,"column-rule-color"),0<l&&d&&d!=F&&f!=sd))for(var k=Z(this,a,"column-gap"),m=this.b?b.height:b.width,p=this.b?"border-top":"border-left",h=1;h<e;h++){var q=(m+k)*h/e-k/2+b.w-l/2,w=b.height+b.B+b.F,r=b.element.ownerDocument.createElement("div");v(r,"position","absolute");v(r,this.b?"left":"top","0px");v(r,this.b?"top":"left",q+"px");v(r,this.b?"height":"width","0px");v(r,this.b?"width":"height",
w+"px");v(r,p,l+"px "+d.toString()+(f?" "+f.toString():""));b.element.insertBefore(r,b.element.firstChild)}for(h=0;h<Qn.length;h++)Hn(this,a,b,Qn[h],g);for(h=0;h<Sn.length;h++)e=b,g=Sn[h],l=c.u,(d=Gn(this,a,g))&&l.push(new Ij(e.element,g,d))};
yn.prototype.l=function(a,b){var c=this.J,d=this.f.b,e;for(e in d)sh(e)&&th(c,e,d[e]);if("background-host"==this.f.Db)for(e in b)if(e.match(/^background-/)||"writing-mode"==e)c[e]=b[e];if("layout-host"==this.f.Db)for(e in b)e.match(/^background-/)||"writing-mode"==e||(c[e]=b[e]);Ki(a,this.f.Ba,null,c);c.content&&(c.content=c.content.Lc(new pi(a,null,a.kb)));En(this,a.l);for(c=0;c<this.f.j.length;c++)this.f.j[c].h(this).l(a,b);a.pop()};
function Un(a,b){a.j&&(a.M=Dn(a,"right",a.D,b)||Dn(a,"margin-right",a.D,b)||Dn(a,"border-right-width",a.D,b)||Dn(a,"padding-right",a.D,b));a.h&&(a.S=Dn(a,"top",a.B,b)||Dn(a,"margin-top",a.B,b)||Dn(a,"border-top-width",a.B,b)||Dn(a,"padding-top",a.B,b));for(var c=0;c<a.w.length;c++)Un(a.w[c],b)}function Vn(a){yn.call(this,null,a)}t(Vn,yn);Vn.prototype.l=function(a,b){yn.prototype.l.call(this,a,b);this.w.sort(function(a,b){return b.f.W-a.f.W||a.f.index-b.f.index})};
function pn(a,b){yn.call(this,a,b);this.F=this}t(pn,yn);pn.prototype.U=function(a){var b=this.f.g;b.T&&(a=jc(b.f,a,b.T));return a};pn.prototype.da=function(){};function rn(a,b){yn.call(this,a,b);this.F=a.F}t(rn,yn);function tn(a,b){yn.call(this,a,b);this.F=a.F}t(tn,yn);function Wn(a,b,c,d){var e=null;c instanceof xc&&(e=[c]);c instanceof qc&&(e=c.values);if(e)for(a=a.f.f,c=0;c<e.length;c++)if(e[c]instanceof xc){var f=ob(e[c].name,"enabled"),f=new dc(a,f);d&&(f=new Mb(a,f));b=jc(a,b,f)}return b}
tn.prototype.U=function(a){var b=this.f.f,c=this.style,d=xn(b,c.required,b.h)!==b.h;if(d||this.h){var e;e=(e=c["flow-from"])?e.qa(b,b.b):new rb(b,"body");e=new fc(b,"has-content",[e]);a=jc(b,a,e)}a=Wn(this,a,c["required-partitions"],!1);a=Wn(this,a,c["conflicting-partitions"],!0);d&&(c=(c=this.F.style.enabled)?c.qa(b,null):b.j,c=jc(b,c,a),this.F.style.enabled=new E(c));return a};tn.prototype.Cb=function(a,b,c,d,e){v(b.element,"overflow","hidden");yn.prototype.Cb.call(this,a,b,c,d,e)};
function Xn(a,b,c,d){ef.call(this,a,b,!1);this.target=c;this.b=d}t(Xn,ff);Xn.prototype.ob=function(a,b,c){ah(this.b,a,b,c,this)};Xn.prototype.ad=function(a,b){gf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};Xn.prototype.qc=function(a,b){gf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};Xn.prototype.pb=function(a,b,c){this.target.b[a]=new V(b,c?50331648:67108864)};function Yn(a,b,c,d){Xn.call(this,a,b,c,d)}t(Yn,Xn);
function Zn(a,b,c,d){Xn.call(this,a,b,c,d);c.b.width=new V(xd,0);c.b.height=new V(xd,0)}t(Zn,Xn);Zn.prototype.Ac=function(a,b,c){a=new sn(this.f,a,b,c,this.target);df(this.ha,new Yn(this.f,this.ha,a,this.b))};Zn.prototype.zc=function(a,b,c){a=new qn(this.f,a,b,c,this.target);a=new Zn(this.f,this.ha,a,this.b);df(this.ha,a)};function $n(a,b,c,d){Xn.call(this,a,b,c,d)}t($n,Xn);$n.prototype.Ac=function(a,b,c){a=new sn(this.f,a,b,c,this.target);df(this.ha,new Yn(this.f,this.ha,a,this.b))};
$n.prototype.zc=function(a,b,c){a=new qn(this.f,a,b,c,this.target);a=new Zn(this.f,this.ha,a,this.b);df(this.ha,a)};function ao(a,b,c,d){d=d[b];if(!d)throw Error("unknown writing-mode: "+b);b=d[c||"ltr"];if(!b)throw Error("unknown direction: "+c);for(c=0;c<b.length;c++)if(d=b[c],d=a.replace(d.h,d.b),d!==a)return d;return a}function bo(a){var b=co,c={};Object.keys(b).forEach(function(d){var e=c[d]={},f=b[d];Object.keys(f).forEach(function(b){e[b]=f[b].map(function(b){return{h:new RegExp("(-?)"+(a?b.N:b.O)+"(-?)"),b:"$1"+(a?b.O:b.N)+"$2"}})})});return c}
var co={"horizontal-tb":{ltr:[{N:"inline-start",O:"left"},{N:"inline-end",O:"right"},{N:"block-start",O:"top"},{N:"block-end",O:"bottom"},{N:"inline-size",O:"width"},{N:"block-size",O:"height"}],rtl:[{N:"inline-start",O:"right"},{N:"inline-end",O:"left"},{N:"block-start",O:"top"},{N:"block-end",O:"bottom"},{N:"inline-size",O:"width"},{N:"block-size",O:"height"}]},"vertical-rl":{ltr:[{N:"inline-start",O:"top"},{N:"inline-end",O:"bottom"},{N:"block-start",O:"right"},{N:"block-end",O:"left"},{N:"inline-size",
O:"height"},{N:"block-size",O:"width"}],rtl:[{N:"inline-start",O:"bottom"},{N:"inline-end",O:"top"},{N:"block-start",O:"right"},{N:"block-end",O:"left"},{N:"inline-size",O:"height"},{N:"block-size",O:"width"}]},"vertical-lr":{ltr:[{N:"inline-start",O:"top"},{N:"inline-end",O:"bottom"},{N:"block-start",O:"left"},{N:"block-end",O:"right"},{N:"inline-size",O:"height"},{N:"block-size",O:"width"}],rtl:[{N:"inline-start",O:"bottom"},{N:"inline-end",O:"top"},{N:"block-start",O:"left"},{N:"block-end",O:"right"},
{N:"inline-size",O:"height"},{N:"block-size",O:"width"}]}},eo=bo(!0),fo=bo(!1),go={"horizontal-tb":[{N:"line-left",O:"left"},{N:"line-right",O:"right"},{N:"over",O:"top"},{N:"under",O:"bottom"}],"vertical-rl":[{N:"line-left",O:"top"},{N:"line-right",O:"bottom"},{N:"over",O:"right"},{N:"under",O:"left"}],"vertical-lr":[{N:"line-left",O:"top"},{N:"line-right",O:"bottom"},{N:"over",O:"right"},{N:"under",O:"left"}]};function pm(a,b,c){b=b?"vertical-rl":"horizontal-tb";if("top"===a||"bottom"===a)a=ao(a,b,c||null,fo);"block-start"===a&&(a="inline-start");"block-end"===a&&(a="inline-end");if("inline-start"===a||"inline-end"===a){c=ao(a,b,c||null,eo);a:{var d=go[b];if(!d)throw Error("unknown writing-mode: "+b);for(b=0;b<d.length;b++)if(d[b].O===c){b=d[b].N;break a}b=c}"line-left"===b?a="left":"line-right"===b&&(a="right")}"left"!==a&&"right"!==a&&(u.b("Invalid float value: "+a+". Fallback to left."),a="left");return a}
function ho(a,b){this.A=dk(a);this.b=b}function io(a,b,c){this.g=a;this.j=b;this.h=c;this.f=[];this.b=[]}
function mm(a,b,c){b.parentNode&&b.parentNode.removeChild(b);v(b,"float","none");v(b,"position","absolute");var d=a.j.toString(),e=a.h.toString(),f=ao(c,d,e||null,eo),g=ao(c,d,e||null,fo);v(b,f,"0");switch(g){case "inline-start":case "inline-end":d=ao("block-start",d,e||null,eo);v(b,d,"0");break;case "block-start":case "block-end":c=ao("inline-start",d,e||null,eo);v(b,c,"0");d=ao("max-inline-size",d,e||null,eo);xa(b,d)||v(b,d,"100%");break;default:throw Error("unknown float direction: "+c);}a.g().appendChild(b)}
function nm(a,b,c){b=jk(b);for(var d=0;d<a.f.length;d++){var e=a.f[d];if(jo(c,b,jk(e.A)))return e}return null}function om(a,b,c){var d=H("tryToAddFloat");b=new ho(b,c);a.f.push(b);a.b.push(b);L(d,b);return J(d)}function ko(a){return a.b.map(function(a){a=a.b;return new Sf([new Nf(a.ia,a.ba),new Nf(a.aa,a.ba),new Nf(a.aa,a.Y),new Nf(a.ia,a.Y)])})};function lo(a){a=a.toString();switch(a){case "inline-flex":a="flex";break;case "inline-grid":a="grid";break;case "inline-table":a="table";break;case "inline":case "table-row-group":case "table-column":case "table-column-group":case "table-header-group":case "table-footer-group":case "table-row":case "table-cell":case "table-caption":case "inline-block":a="block"}return C(a)}function Uk(a,b,c,d){if(a!==F)if(b===Ec||b===Uc)c=F,a=lo(a);else if(c&&c!==F||d)a=lo(a);return{display:a,position:b,f:c}}
function mo(a,b,c,d,e,f,g){e=e||f||Xc;return!!g||!!c&&c!==F||b===Ec||b===Uc||a===$c||a===qd||a===pd||a==Vc||(a===Ic||a===ed)&&!!d&&d!==vd||!!f&&e!==f};function no(a,b,c){return a.replace(/[uU][rR][lL]\(\s*\"((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\"\r\n])+)\"/gm,function(a,e){return'url("'+c.Cc(e,b)+'"'}).replace(/[uU][rR][lL]\(\s*\'((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\'\r\n])+)\'/gm,function(a,e){return"url('"+c.Cc(e,b)+"'"}).replace(/[uU][rR][lL]\(\s*((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\"\'\r\n\)\s])+)/gm,function(a,e){return"url("+c.Cc(e,b)})};var oo={"text-indent":"0px","margin-top":"0px","padding-top":"0px","border-top-width":"0px","border-top-style":"none","border-top-color":"transparent","border-top-left-radius":"0px","border-top-right-radius":"0px"},po={"text-indent":"0px","margin-right":"0px","padding-right":"0px","border-right-width":"0px","border-right-style":"none","border-right-color":"transparent","border-top-right-radius":"0px","border-bottom-right-radius":"0px"},qo={"margin-top":"0px"},ro={"margin-right":"0px"},so={};
function to(a){a.addEventListener("load",function(){a.contentWindow.navigator.epubReadingSystem={name:"adapt",version:"0.1",layoutStyle:"paginated",hasFeature:function(a){switch(a){case "mouse-events":return!0}return!1}}},!1)}var uo=(new DOMParser).parseFromString('<root xmlns="http://www.pyroxy.com/ns/shadow"/>',"text/xml"),vo="footnote-marker first-5-lines first-4-lines first-3-lines first-2-lines first-line first-letter before  after".split(" ");
function Pm(a){return a.getAttribute("data-adapt-pseudo")||""}function wo(a,b,c,d){this.style=b;this.element=a;this.b=c;this.f=d;this.g={}}
wo.prototype.l=function(a){var b=Pm(a);this.b&&b&&b.match(/after$/)&&(this.style=this.b.l(this.element,!0),this.b=null);var c=this.style._pseudos[b]||{};if(!this.g[b]){this.g[b]=!0;var d=c.content;d&&(d=d.evaluate(this.f),Ek(d)&&d.$(new Dk(a,this.f)))}if(b.match(/^first-/)&&!c["x-first-pseudo"]){a=1;if("first-letter"==b)a=0;else if(b=b.match(/^first-([0-9]+)-lines$/))a=b[1]-0;c["x-first-pseudo"]=new V(new zc(a),0)}return c};
function xo(a,b,c,d,e,f,g,h,l,k,m,p,q,w){this.D=a;this.b=b;this.viewport=c;this.w=c.b;this.l=d;this.G=e;this.ca=f;this.F=g;this.u=h;this.I=l;this.page=k;this.g=m;this.B=p;this.f=q;this.h=w;this.J=this.A=null;this.j=!1;this.V=null;this.ga=0;this.C=null}xo.prototype.clone=function(){return new xo(this.D,this.b,this.viewport,this.l,this.G,this.ca,this.F,this.u,this.I,this.page,this.g,this.B,this.f,this.h)};
function yo(a,b,c,d,e,f){var g=H("createRefShadow");a.ca.u.load(b).then(function(h){if(h){var l=sj(h,b);if(l){var k=a.I,m=k.G[h.url];if(!m){var m=k.style.l.f[h.url],p=new yb(0,k.Bb(),k.Ab(),k.u),m=new Zk(h,m.g,m.f,p,k.j,m.u,new Sm(k.h,h.url),new Rm(k.h,h.url,m.f,m.b));k.G[h.url]=m}f=new ek(d,l,h,e,f,c,m)}}L(g,f)});return J(g)}
function zo(a,b,c,d,e,f,g,h){var l=H("createShadows"),k=e.template,m;k instanceof Bc?m=yo(a,k.url,2,b,h,null):m=I(null);m.then(function(k){var m=null;if("http://www.pyroxy.com/ns/shadow"==b.namespaceURI&&"include"==b.localName){var p=b.getAttribute("href"),r=null;p?r=h?h.ca:a.ca:h&&(p="http://www.w3.org/1999/xhtml"==h.ha.namespaceURI?h.ha.getAttribute("href"):h.ha.getAttributeNS("http://www.w3.org/1999/xlink","href"),r=h.Bd?h.Bd.ca:a.ca);p&&(p=la(p,r.url),m=yo(a,p,3,b,h,k))}m||(m=I(k));var x=null;
m.then(function(c){e.display===qd?x=yo(a,la("user-agent.xml#table-cell",ka),2,b,h,c):x=I(c)});x.then(function(k){var m;if(m=d._pseudos){for(var p=[],q=uo.createElementNS("http://www.pyroxy.com/ns/shadow","root"),r=q,w=0;w<vo.length;w++){var x=vo[w],B;if(x){if(!m[x])continue;if(!("footnote-marker"!=x||c&&a.j))continue;if(x.match(/^first-/)&&(B=e.display,!B||B===Zc))continue;if("before"===x||"after"===x)if(B=m[x].content,!B||B===gd||B===F)continue;p.push(x);B=uo.createElementNS("http://www.w3.org/1999/xhtml",
"span");B.setAttribute("data-adapt-pseudo",x)}else B=uo.createElementNS("http://www.pyroxy.com/ns/shadow","content");r.appendChild(B);x.match(/^first-/)&&(r=B)}k=p.length?new ek(b,q,null,h,k,2,new wo(b,d,f,g)):k}L(l,k)})});return J(l)}function Ll(a,b,c){a.J=b;a.j=c}
function Ao(a,b,c,d){var e=a.b;c=ej(c,e,a.G,a.j);b=dj(c,e,b);fj(c,d,b,function(b,c){var d=c.evaluate(e,b);"font-family"==b&&(d=sl(a.F,d));return d});var f=Uk(d.display||Zc,d.position,d["float"],a.V===a.ca.root);["display","position","float"].forEach(function(a){f[a]&&(d[a]=f[a])});return b}
function Bo(a,b){for(var c=a.A.V,d=[],e=null,f=a.A.la,g=-1;c&&1==c.nodeType;){var h=f&&f.root==c;if(!h||2==f.type){var l=(f?f.b:a.l).l(c,!1);d.push(l);e=e||za(c)}h?(c=f.ha,f=f.Bd):(c=c.parentNode,g++)}c=Ab(a.b,"em",!g);c={"font-size":new V(new D(c,"px"),0)};f=new yh(c,a.b);for(g=d.length-1;0<=g;--g){var h=d[g],l=[],k;for(k in h)ch[k]&&l.push(k);l.sort(Cd);for(var m=0;m<l.length;m++){var p=l[m];f.f=p;var q=h[p];q.value!==Yc&&(c[p]=q.Lc(f))}}for(var w in b)ch[w]||(c[w]=b[w]);return{lang:e,Ua:c}}
var Co={a:"a",sub:"sub",sup:"sup",table:"table",tr:"tr",td:"td",th:"th",code:"code",body:"div",p:"p",v:"p",date:"p",emphasis:"em",strong:"strong",style:"span",strikethrough:"del"};function Do(a,b){b=la(b,a.ca.url);return a.B[b]||b}function Eo(a){a.A.lang=za(a.A.V)||a.A.parent&&a.A.parent.lang||a.A.lang}
function Fo(a,b){var c=eh().filter(function(a){return b[a]});if(c.length){var d=a.A.j;if(a.A.parent){var d=a.A.j={},e;for(e in a.A.parent.j)d[e]=a.A.parent.j[e]}c.forEach(function(a){var c=b[a];if(c){if(c instanceof zc)d[a]=c.H;else if(c instanceof xc)d[a]=c.name;else if(c instanceof D)switch(c.ea){case "dpi":case "dpcm":case "dppx":d[a]=c.H*wb[c.ea]}else d[a]=c;delete b[a]}})}}function Go(a,b){for(var c=Ed.RESOLVE_FORMATTING_CONTEXT||[],d=0;d<c.length;d++){var e=c[d](a,b);if(e){a.R=e;break}}}
function Ho(a,b,c){var d=!0,e=H("createElementView"),f=a.V,g=a.A.la?a.A.la.b:a.l,h=g.l(f,!1),l={};if(!a.A.parent){var k=Bo(a,h),h=k.Ua;a.A.lang=k.lang}a.A.b=Ao(a,a.A.b,h,l);Fo(a,l);Eo(a);l.direction&&(a.A.ma=l.direction.toString());if((k=l["flow-into"])&&k.toString()!=a.D)return L(e,!1),J(e);var m=l.display;if(m===F)return L(e,!1),J(e);k=!a.A.parent;a.A.I=m===Vc;zo(a,f,k,h,l,g,a.b,a.A.la).then(function(g){a.A.za=g;var h=l.position;g=l["float-reference"];var k=l["float"],p=l.clear,x=a.A.b?ud:Xc,B=
a.A.parent?a.A.parent.b?ud:Xc:x,G="true"===f.getAttribute("data-vivliostyle-flow-root");a.A.S=mo(m,h,k,l.overflow,x,B,G);a.A.M=h===kd||h===Ec||h===Uc;lk(a.A)&&(p=null,k!==Wc&&(k=null));h=k===dd||k===ld||k===rd||k===Mc||k===bd||k===ad||k===Kc||k===Jc||k===Wc;k&&(delete l["float"],k===Wc&&(a.j?(h=!1,l.display=Ic):l.display=Zc));p&&(p===Yc&&a.A.parent&&a.A.parent.D&&(p=C(a.A.parent.D)),p===dd||p===ld||p===Lc)&&(delete l.clear,l.display&&l.display!=Zc&&(a.A.D=p.toString()));var R=m===ed&&l["ua-list-item-count"];
(h||l["break-inside"]&&l["break-inside"]!==Hc)&&a.A.w++;if(!(p=!h&&!m))a:switch(m.toString()){case "inline":case "inline-block":case "inline-list-item":case "inline-flex":case "inline-grid":case "ruby":case "inline-table":p=!0;break a;default:p=!1}if(!p)a:switch(m.toString()){case "ruby-base":case "ruby-text":case "ruby-base-container":case "ruby-text-container":p=!0;break a;default:p=!1}a.A.Ca=p;a.A.display=m?m.toString():"inline";a.A.l=h?k.toString():null;a.A.oa=g?g.toString():null;if(!a.A.Ca){if(g=
l["break-after"])a.A.G=g.toString();if(g=l["break-before"])a.A.h=g.toString()}a.A.J=l["vertical-align"]&&l["vertical-align"].toString()||"baseline";a.A.U=l["caption-side"]&&l["caption-side"].toString()||"top";g=l["border-collapse"];if(!g||g===C("separate"))if(g=l["border-spacing"])g.Oc()&&(g=g.values[0]),g.Zb()&&(a.A.da=Dc(g,a.b));if(g=l["x-first-pseudo"])a.A.g=new fk(a.A.parent?a.A.parent.g:null,g.H);if(g=l["white-space"])g=Rj(g.toString()),null!==g&&(a.A.Hb=g);(g=l["hyphenate-character"])&&g!==
Hc&&(a.A.u=g.dc);g=l["overflow-wrap"]||["word-wrap"];a.A.B=l["word-break"]===Oc||g===Pc;Go(a.A,b);a.A.R&&(b=Io(a.A.R,a.A,b));var P=!1,ib=null,jb=[],ya=f.namespaceURI,K=f.localName;if("http://www.w3.org/1999/xhtml"==ya)"html"==K||"body"==K||"script"==K||"link"==K||"meta"==K?K="div":"vide_"==K?K="video":"audi_"==K?K="audio":"object"==K&&(P=!!a.g);else if("http://www.idpf.org/2007/ops"==ya)K="span",ya="http://www.w3.org/1999/xhtml";else if("http://www.gribuser.ru/xml/fictionbook/2.0"==ya){ya="http://www.w3.org/1999/xhtml";
if("image"==K){if(K="div",(g=f.getAttributeNS("http://www.w3.org/1999/xlink","href"))&&"#"==g.charAt(0)&&(g=sj(a.ca,g)))ib=Jo(a,ya,"img"),g="data:"+(g.getAttribute("content-type")||"image/jpeg")+";base64,"+g.textContent.replace(/[ \t\n\t]/g,""),jb.push(je(ib,g))}else K=Co[K];K||(K=a.A.Ca?"span":"div")}else if("http://www.daisy.org/z3986/2005/ncx/"==ya)if(ya="http://www.w3.org/1999/xhtml","ncx"==K||"navPoint"==K)K="div";else if("navLabel"==K){if(K="span",k=f.parentNode){g=null;for(k=k.firstChild;k;k=
k.nextSibling)if(1==k.nodeType&&(p=k,"http://www.daisy.org/z3986/2005/ncx/"==p.namespaceURI&&"content"==p.localName)){g=p.getAttribute("src");break}g&&(K="a",f=f.ownerDocument.createElementNS(ya,"a"),f.setAttribute("href",g))}}else K="span";else"http://www.pyroxy.com/ns/shadow"==ya?(ya="http://www.w3.org/1999/xhtml",K=a.A.Ca?"span":"div"):P=!!a.g;R?b?K="li":(K="div",m=Ic,l.display=m):"body"==K||"li"==K?K="div":"q"==K?K="span":"a"==K&&(g=l["hyperlink-processing"])&&"normal"!=g.toString()&&(K="span");
l.behavior&&"none"!=l.behavior.toString()&&a.g&&(P=!0);f.dataset&&"true"==f.dataset.mathTypeset&&(P=!0);var La;P?La=a.g(f,a.A.parent?a.A.parent.C:null,l):La=I(null);La.then(function(g){g?P&&(d="true"==g.getAttribute("data-adapt-process-children")):g=Jo(a,ya,K);"a"==K&&g.addEventListener("click",a.page.M,!1);ib&&(km(a,a.A,"inner",ib),g.appendChild(ib));"iframe"==g.localName&&"http://www.w3.org/1999/xhtml"==g.namespaceURI&&to(g);var h=a.A.j["image-resolution"],k=[],m=l.width,p=l.height,q=f.getAttribute("width"),
r=f.getAttribute("height"),m=m===Hc||!m&&!q,p=p===Hc||!p&&!r;if("http://www.gribuser.ru/xml/fictionbook/2.0"!=f.namespaceURI||"td"==K){for(var q=f.attributes,w=q.length,r=null,x=0;x<w;x++){var B=q[x],G=B.namespaceURI,na=B.localName,B=B.nodeValue;if(G)if("http://www.w3.org/2000/xmlns/"==G)continue;else"http://www.w3.org/1999/xlink"==G&&"href"==na&&(B=Do(a,B));else{if(na.match(/^on/))continue;if("style"==na)continue;if(("id"==na||"name"==na)&&b){B=a.h.Hd(B,a.ca.url);g.setAttribute(na,B);Oj(a.page,g,
B);continue}"src"==na||"href"==na||"poster"==na?(B=Do(a,B),"href"===na&&(B=a.h.Cc(B,a.ca.url))):"srcset"==na&&(B=B.split(",").map(function(b){return Do(a,b.trim())}).join(","));if("poster"===na&&"video"===K&&"http://www.w3.org/1999/xhtml"===ya&&m&&p){var La=new Image,Fd=je(La,B);jb.push(Fd);k.push({je:La,element:g,ge:Fd})}}"http://www.w3.org/2000/svg"==ya&&/^[A-Z\-]+$/.test(na)&&(na=na.toLowerCase());-1!=Ko.indexOf(na.toLowerCase())&&(B=no(B,a.ca.url,a.h));G&&(La=so[G])&&(na=La+":"+na);"src"!=na||
G||"img"!=K&&"input"!=K||"http://www.w3.org/1999/xhtml"!=ya?"href"==na&&"image"==K&&"http://www.w3.org/2000/svg"==ya&&"http://www.w3.org/1999/xlink"==G?a.page.j.push(je(g,B)):G?g.setAttributeNS(G,na,B):g.setAttribute(na,B):r=B}r&&(La="input"===K?new Image:g,q=je(La,r),La!==g&&(g.src=r),m||p?(m&&p&&h&&1!==h&&k.push({je:La,element:g,ge:q}),jb.push(q)):a.page.j.push(q))}delete l.content;(m=l["list-style-image"])&&m instanceof Bc&&(m=m.url,jb.push(je(new Image,m)));Lo(a,l);Mo(a,g,l);if(!a.A.Ca&&(m=null,
b?c&&(m=a.A.b?ro:qo):m="clone"!==a.A.j["box-decoration-break"]?a.A.b?po:oo:a.A.b?ro:qo,m))for(var wm in m)v(g,wm,m[wm]);R&&g.setAttribute("value",l["ua-list-item-count"].stringValue());a.C=g;jb.length?ie(jb).then(function(){0<h&&No(a,k,h,l,a.A.b);L(e,d)}):ae().then(function(){L(e,d)})})});return J(e)}var Ko="color-profile clip-path cursor filter marker marker-start marker-end marker-mid fill stroke mask".split(" ");
function No(a,b,c,d,e){b.forEach(function(b){if("load"===b.ge.get().get()){var f=b.je,h=f.width/c,f=f.height/c;b=b.element;if(0<h&&0<f)if(d["box-sizing"]===Nc&&(d["border-left-style"]!==F&&(h+=Dc(d["border-left-width"],a.b)),d["border-right-style"]!==F&&(h+=Dc(d["border-right-width"],a.b)),d["border-top-style"]!==F&&(f+=Dc(d["border-top-width"],a.b)),d["border-bottom-style"]!==F&&(f+=Dc(d["border-bottom-width"],a.b))),1<c){var l=d["max-width"]||F,k=d["max-height"]||F;l===F&&k===F?v(b,"max-width",
h+"px"):l!==F&&k===F?v(b,"width",h+"px"):l===F&&k!==F?v(b,"height",f+"px"):"%"!==l.ea?v(b,"max-width",Math.min(h,Dc(l,a.b))+"px"):"%"!==k.ea?v(b,"max-height",Math.min(f,Dc(k,a.b))+"px"):e?v(b,"height",f+"px"):v(b,"width",h+"px")}else 1>c&&(l=d["min-width"]||Ad,k=d["min-height"]||Ad,l.H||k.H?l.H&&!k.H?v(b,"width",h+"px"):!l.H&&k.H?v(b,"height",f+"px"):"%"!==l.ea?v(b,"min-width",Math.max(h,Dc(l,a.b))+"px"):"%"!==k.ea?v(b,"min-height",Math.max(f,Dc(k,a.b))+"px"):e?v(b,"height",f+"px"):v(b,"width",h+
"px"):v(b,"min-width",h+"px"))}})}function Lo(a,b){(Ed.PREPROCESS_ELEMENT_STYLE||[]).forEach(function(c){c(a.A,b)})}function Oo(a){var b=H("createTextNodeView");Po(a).then(function(){var c=a.ga||0,c=Qo(a.A.Ia).substr(c);a.C=document.createTextNode(c);L(b,!0)});return J(b)}
function Po(a){if(a.A.Ia)return I(!0);var b,c=b=a.V.textContent,d=H("preprocessTextContent"),e=Ed.PREPROCESS_TEXT_CONTENT||[],f=0;ce(function(){return f>=e.length?I(!1):e[f++](a.A,c).ya(function(a){c=a;return I(!0)})}).then(function(){a.A.Ia=Ro(b,c,0);L(d,!0)});return J(d)}
function So(a,b,c){var d=H("createNodeView"),e=!0;1==a.V.nodeType?b=Ho(a,b,c):8==a.V.nodeType?(a.C=null,b=I(!0)):b=Oo(a);b.then(function(b){e=b;(a.A.C=a.C)&&(b=a.A.parent?a.A.parent.C:a.J)&&b.appendChild(a.C);L(d,e)});return J(d)}function Ml(a,b,c,d){(a.A=b)?(a.V=b.V,a.ga=b.ga):(a.V=null,a.ga=-1);a.C=null;return a.A?So(a,c,!!d):I(!0)}
function To(a){if(null==a.la||"content"!=a.V.localName||"http://www.pyroxy.com/ns/shadow"!=a.V.namespaceURI)return a;var b=a.pa,c=a.la,d=a.parent,e,f;c.ae?(f=c.ae,e=c.root,c=c.type,2==c&&(e=e.firstChild)):(f=c.Bd,e=c.ha.firstChild,c=2);var g=a.V.nextSibling;g?(a.V=g,gk(a)):a.wa?a=a.wa:e?a=null:(a=a.parent.modify(),a.K=!0);if(e)return b=new ck(e,d,b),b.la=f,b.Ra=c,b.wa=a,b;a.pa=b;return a}
function Uo(a){var b=a.pa+1;if(a.K){if(!a.parent)return null;if(3!=a.Ra){var c=a.V.nextSibling;if(c)return a=a.modify(),a.pa=b,a.V=c,gk(a),To(a)}if(a.wa)return a=a.wa.modify(),a.pa=b,a;a=a.parent.modify()}else{if(a.za&&(c=a.za.root,2==a.za.type&&(c=c.firstChild),c))return b=new ck(c,a,b),b.la=a.za,b.Ra=a.za.type,To(b);if(c=a.V.firstChild)return To(new ck(c,a,b));1!=a.V.nodeType&&(c=Qo(a.Ia),b+=c.length-1-a.ga);a=a.modify()}a.pa=b;a.K=!0;return a}
function Rl(a,b,c){b=Uo(b);if(!b||b.K)return I(b);var d=H("nextInTree");Ml(a,b,!0,c).then(function(a){b.C&&a||(b=b.modify(),b.K=!0,b.C||(b.Ca=!0));L(d,b)});return J(d)}function Vo(a,b){if(b instanceof qc)for(var c=b.values,d=0;d<c.length;d++)Vo(a,c[d]);else b instanceof Bc&&(c=b.url,a.page.j.push(je(new Image,c)))}var Wo={"box-decoration-break":!0,"flow-into":!0,"flow-linger":!0,"flow-priority":!0,"flow-options":!0,page:!0,"float-reference":!0};
function Mo(a,b,c){var d=c["background-image"];d&&Vo(a,d);var d=c.position===kd,e;for(e in c)if(!Wo[e]){var f=c[e],f=f.$(new qg(a.ca.url,a.h));f.Zb()&&xb(f.ea)&&(f=new D(Dc(f,a.b),"px"));Gj[e]||d&&Hj[e]?a.page.u.push(new Ij(b,e,f)):v(b,e,f.toString())}}function km(a,b,c,d){if(!b.K){var e=(b.la?b.la.b:a.l).l(a.V,!1);if(e=e._pseudos)if(e=e[c])c={},b.b=Ao(a,b.b,e,c),b=c.content,Ek(b)&&(b.$(new Dk(d,a.b)),delete c.content),Mo(a,d,c)}}
function Pl(a,b,c){var d=H("peelOff"),e=b.g,f=b.ga,g=b.K;if(0<c)b.C.textContent=b.C.textContent.substr(0,c),f+=c;else if(!g&&b.C&&!f){var h=b.C.parentNode;h&&h.removeChild(b.C)}for(var l=b.pa+c,k=[];b.g===e;)k.push(b),b=b.parent;var m=k.pop(),p=m.wa;ce(function(){for(;0<k.length;){m=k.pop();b=new ck(m.V,b,l);k.length||(b.ga=f,b.K=g);b.Ra=m.Ra;b.la=m.la;b.za=m.za;b.wa=m.wa?m.wa:p;p=null;var c=Ml(a,b,!1);if(c.va())return c}return I(!1)}).then(function(){L(d,b)});return J(d)}
function Jo(a,b,c){return"http://www.w3.org/1999/xhtml"==b?a.w.createElement(c):a.w.createElementNS(b,c)}function em(a,b,c){var d={},e=a.u._pseudos;b=Ao(a,b,a.u,d);if(e&&e.before){var f={},g=Jo(a,"http://www.w3.org/1999/xhtml","span");g.setAttribute("data-adapt-pseudo","before");c.appendChild(g);Ao(a,b,e.before,f);delete f.content;Mo(a,g,f)}delete d.content;Mo(a,c,d);return b}
function Em(a){a&&nk(a,function(a){var b=a.j["box-decoration-break"];b&&"slice"!==b||(b=a.C,a.b?(v(b,"padding-left","0"),v(b,"border-left","none"),v(b,"border-top-left-radius","0"),v(b,"border-bottom-left-radius","0")):(v(b,"padding-bottom","0"),v(b,"border-bottom","none"),v(b,"border-bottom-left-radius","0"),v(b,"border-bottom-right-radius","0")))})}
function jo(a,b,c){return b.ga===c.ga&&b.K==c.K&&b.ja.length===c.ja.length&&b.ja.every(function(a,b){var d;d=c.ja[b];if(a.la)if(d.la){var e=1===a.node.nodeType?a.node:a.node.parentElement,h=1===d.node.nodeType?d.node:d.node.parentElement;d=a.la.ha===d.la.ha&&Pm(e)===Pm(h)}else d=!1;else d=a.node===d.node;return d}.bind(a))}function Xo(a){this.b=a.h;this.window=a.window}
function Yo(a,b){var c=b.left,d=b.top;return{left:a.left-c,top:a.top-d,right:a.right-c,bottom:a.bottom-d,width:a.width,height:a.height}}function Cl(a,b){var c=b.getClientRects(),d=a.b.getBoundingClientRect();return Array.from(c).map(function(a){return Yo(a,d)},a)}function Qj(a,b){var c=b.getBoundingClientRect(),d=a.b.getBoundingClientRect();return Yo(c,d)}function $l(a,b){return a.window.getComputedStyle(b,null)}
function Zo(a,b,c,d,e){this.window=a;this.fontSize=b;this.b=a.document;this.root=c||this.b.body;b=this.root.firstElementChild;b||(b=this.b.createElement("div"),b.setAttribute("data-vivliostyle-outer-zoom-box",!0),this.root.appendChild(b));c=b.firstElementChild;c||(c=this.b.createElement("div"),c.setAttribute("data-vivliostyle-spread-container",!0),b.appendChild(c));var f=b.nextElementSibling;f||(f=this.b.createElement("div"),f.setAttribute("data-vivliostyle-layout-box",!0),this.root.appendChild(f));
this.g=b;this.f=c;this.h=f;b=$l(new Xo(this),this.root);this.width=d||parseFloat(b.width)||a.innerWidth;this.height=e||parseFloat(b.height)||a.innerHeight}Zo.prototype.zoom=function(a,b,c){v(this.g,"width",a*c+"px");v(this.g,"height",b*c+"px");v(this.f,"width",a+"px");v(this.f,"height",b+"px");v(this.f,"transform","scale("+c+")")};function $o(a,b,c){function d(c){return $l(a,b).getPropertyValue(c)}function e(){v(b,"display","block");v(b,"position","static");return d(G)}function f(){v(b,"display","inline-block");v(r,G,"99999999px");var a=d(G);v(r,G,"");return a}function g(){v(b,"display","inline-block");v(r,G,"0");var a=d(G);v(r,G,"");return a}function h(){var a=e(),b=g(),c=parseFloat(a);if(c<=parseFloat(b))return b;b=f();return c<=parseFloat(b)?a:b}function l(){throw Error("Getting fill-available block size is not implemented");
}var k=b.style.display,m=b.style.position,p=b.style.width,q=b.style.height,w=b.parentNode,r=b.ownerDocument.createElement("div");v(r,"position",m);w.insertBefore(r,b);r.appendChild(b);v(b,"width","auto");v(b,"height","auto");var x=wa("writing-mode"),x=(x?d(x[0]):null)||d("writing-mode"),B="vertical-rl"===x||"tb-rl"===x||"vertical-lr"===x||"tb-lr"===x,G=B?"height":"width",R=B?"width":"height",P={};c.forEach(function(a){var c;switch(a){case "fill-available inline size":c=e();break;case "max-content inline size":c=
f();break;case "min-content inline size":c=g();break;case "fit-content inline size":c=h();break;case "fill-available block size":c=l();break;case "max-content block size":case "min-content block size":case "fit-content block size":c=d(R);break;case "fill-available width":c=B?l():e();break;case "fill-available height":c=B?e():l();break;case "max-content width":c=B?d(R):f();break;case "max-content height":c=B?f():d(R);break;case "min-content width":c=B?d(R):g();break;case "min-content height":c=B?g():
d(R);break;case "fit-content width":c=B?d(R):h();break;case "fit-content height":c=B?h():d(R)}P[a]=parseFloat(c);v(b,"position",m);v(b,"display",k)});v(b,"width",p);v(b,"height",q);w.insertBefore(b,r);w.removeChild(r);return P};function ap(a){var b=a["writing-mode"],b=b&&b.value;a=(a=a.direction)&&a.value;return b===td||b!==ud&&a!==od?"ltr":"rtl"}
var bp={a5:{width:new D(148,"mm"),height:new D(210,"mm")},a4:{width:new D(210,"mm"),height:new D(297,"mm")},a3:{width:new D(297,"mm"),height:new D(420,"mm")},b5:{width:new D(176,"mm"),height:new D(250,"mm")},b4:{width:new D(250,"mm"),height:new D(353,"mm")},"jis-b5":{width:new D(182,"mm"),height:new D(257,"mm")},"jis-b4":{width:new D(257,"mm"),height:new D(364,"mm")},letter:{width:new D(8.5,"in"),height:new D(11,"in")},legal:{width:new D(8.5,"in"),height:new D(14,"in")},ledger:{width:new D(11,"in"),
height:new D(17,"in")}},cp=new D(.24,"pt"),dp=new D(3,"mm"),ep=new D(10,"mm"),fp=new D(13,"mm");
function gp(a){var b={width:yd,height:zd,Mb:Ad,ub:Ad},c=a.size;if(c&&c.value!==Hc){var d=c.value;d.Oc()?(c=d.values[0],d=d.values[1]):(c=d,d=null);if(c.Zb())b.width=c,b.height=d||c;else if(c=bp[c.name.toLowerCase()])d&&d===cd?(b.width=c.height,b.height=c.width):(b.width=c.width,b.height=c.height)}(c=a.marks)&&c.value!==F&&(b.ub=fp);a=a.bleed;a&&a.value!==Hc?a.value&&a.value.Zb()&&(b.Mb=a.value):c&&(a=!1,c.value.Oc()?a=c.value.values.some(function(a){return a===Qc}):a=c.value===Qc,a&&(b.Mb=new D(6,
"pt")));return b}function hp(a,b){var c={},d=a.Mb.H*Ab(b,a.Mb.ea,!1),e=a.ub.H*Ab(b,a.ub.ea,!1),f=d+e,g=a.width;c.Bb=g===yd?(b.Z.jb?Math.floor(b.ta/2)-b.Z.ac:b.ta)-2*f:g.H*Ab(b,g.ea,!1);g=a.height;c.Ab=g===zd?b.nb-2*f:g.H*Ab(b,g.ea,!1);c.Mb=d;c.ub=e;c.ld=f;return c}function ip(a,b,c){a=a.createElementNS("http://www.w3.org/2000/svg","svg");a.setAttribute("width",b);a.setAttribute("height",c);a.style.position="absolute";return a}
function jp(a,b,c){a=a.createElementNS("http://www.w3.org/2000/svg",c||"polyline");a.setAttribute("stroke","black");a.setAttribute("stroke-width",b);a.setAttribute("fill","none");return a}var kp={nf:"top left",pf:"top right",$e:"bottom left",af:"bottom right"};
function lp(a,b,c,d,e,f){var g=d;g<=e+2*wb.mm&&(g=e+d/2);var h=Math.max(d,g),l=e+h+c/2,k=ip(a,l,l),g=[[0,e+d],[d,e+d],[d,e+d-g]];d=g.map(function(a){return[a[1],a[0]]});if("top right"===b||"bottom right"===b)g=g.map(function(a){return[e+h-a[0],a[1]]}),d=d.map(function(a){return[e+h-a[0],a[1]]});if("bottom left"===b||"bottom right"===b)g=g.map(function(a){return[a[0],e+h-a[1]]}),d=d.map(function(a){return[a[0],e+h-a[1]]});l=jp(a,c);l.setAttribute("points",g.map(function(a){return a.join(",")}).join(" "));
k.appendChild(l);a=jp(a,c);a.setAttribute("points",d.map(function(a){return a.join(",")}).join(" "));k.appendChild(a);b.split(" ").forEach(function(a){k.style[a]=f+"px"});return k}var mp={mf:"top",Ze:"bottom",ze:"left",Ae:"right"};
function np(a,b,c,d,e){var f=2*d,g;"top"===b||"bottom"===b?(g=f,f=d):g=d;var h=ip(a,g,f),l=jp(a,c);l.setAttribute("points","0,"+f/2+" "+g+","+f/2);h.appendChild(l);l=jp(a,c);l.setAttribute("points",g/2+",0 "+g/2+","+f);h.appendChild(l);a=jp(a,c,"circle");a.setAttribute("cx",g/2);a.setAttribute("cy",f/2);a.setAttribute("r",d/4);h.appendChild(a);var k;switch(b){case "top":k="bottom";break;case "bottom":k="top";break;case "left":k="right";break;case "right":k="left"}Object.keys(mp).forEach(function(a){a=
mp[a];a===b?h.style[a]=e+"px":a!==k&&(h.style[a]="0",h.style["margin-"+a]="auto")});return h}function op(a,b,c,d){var e=!1,f=!1;if(a=a.marks)a=a.value,a.Oc()?a.values.forEach(function(a){a===Qc?e=!0:a===Rc&&(f=!0)}):a===Qc?e=!0:a===Rc&&(f=!0);if(e||f){var g=c.P,h=g.ownerDocument,l=b.Mb,k=Dc(cp,d),m=Dc(dp,d),p=Dc(ep,d);e&&Object.keys(kp).forEach(function(a){a=lp(h,kp[a],k,p,l,m);g.appendChild(a)});f&&Object.keys(mp).forEach(function(a){a=np(h,mp[a],k,p,m);g.appendChild(a)})}}
var pp=function(){var a={width:!0,height:!0,"block-size":!0,"inline-size":!0,margin:!0,padding:!0,border:!0,outline:!0,"outline-width":!0,"outline-style":!0,"outline-color":!0};"left right top bottom before after start end block-start block-end inline-start inline-end".split(" ").forEach(function(b){a["margin-"+b]=!0;a["padding-"+b]=!0;a["border-"+b+"-width"]=!0;a["border-"+b+"-style"]=!0;a["border-"+b+"-color"]=!0});return a}(),qp={"top-left-corner":{order:1,Ha:!0,Ea:!1,Fa:!0,Ga:!0,ra:null},"top-left":{order:2,
Ha:!0,Ea:!1,Fa:!1,Ga:!1,ra:"start"},"top-center":{order:3,Ha:!0,Ea:!1,Fa:!1,Ga:!1,ra:"center"},"top-right":{order:4,Ha:!0,Ea:!1,Fa:!1,Ga:!1,ra:"end"},"top-right-corner":{order:5,Ha:!0,Ea:!1,Fa:!1,Ga:!0,ra:null},"right-top":{order:6,Ha:!1,Ea:!1,Fa:!1,Ga:!0,ra:"start"},"right-middle":{order:7,Ha:!1,Ea:!1,Fa:!1,Ga:!0,ra:"center"},"right-bottom":{order:8,Ha:!1,Ea:!1,Fa:!1,Ga:!0,ra:"end"},"bottom-right-corner":{order:9,Ha:!1,Ea:!0,Fa:!1,Ga:!0,ra:null},"bottom-right":{order:10,Ha:!1,Ea:!0,Fa:!1,Ga:!1,ra:"end"},
"bottom-center":{order:11,Ha:!1,Ea:!0,Fa:!1,Ga:!1,ra:"center"},"bottom-left":{order:12,Ha:!1,Ea:!0,Fa:!1,Ga:!1,ra:"start"},"bottom-left-corner":{order:13,Ha:!1,Ea:!0,Fa:!0,Ga:!1,ra:null},"left-bottom":{order:14,Ha:!1,Ea:!1,Fa:!0,Ga:!1,ra:"end"},"left-middle":{order:15,Ha:!1,Ea:!1,Fa:!0,Ga:!1,ra:"center"},"left-top":{order:16,Ha:!1,Ea:!1,Fa:!0,Ga:!1,ra:"start"}},rp=Object.keys(qp).sort(function(a,b){return qp[a].order-qp[b].order});
function sp(a,b,c){on.call(this,a,null,"vivliostyle-page-rule-master",[],b,null,0);a=gp(c);new tp(this.f,this,c,a);this.B={};up(this,c);this.b.position=new V(kd,0);this.b.width=new V(a.width,0);this.b.height=new V(a.height,0);for(var d in c)pp[d]||"background-clip"===d||(this.b[d]=c[d])}t(sp,on);function up(a,b){var c=b._marginBoxes;c&&rp.forEach(function(d){c[d]&&(a.B[d]=new vp(a.f,a,d,b))})}sp.prototype.h=function(a){return new wp(a,this)};
function tp(a,b,c,d){sn.call(this,a,null,null,[],b);this.D=d;this.b["z-index"]=new V(new zc(0),0);this.b["flow-from"]=new V(C("body"),0);this.b.position=new V(Ec,0);this.b.overflow=new V(vd,0);for(var e in pp)pp.hasOwnProperty(e)&&(this.b[e]=c[e])}t(tp,sn);tp.prototype.h=function(a){return new xp(a,this)};
function vp(a,b,c,d){sn.call(this,a,null,null,[],b);this.w=c;a=d._marginBoxes[this.w];for(var e in d)if(b=d[e],c=a[e],ch[e]||c&&c.value===Yc)this.b[e]=b;for(e in a)Object.prototype.hasOwnProperty.call(a,e)&&(b=a[e])&&b.value!==Yc&&(this.b[e]=b)}t(vp,sn);vp.prototype.h=function(a){return new yp(a,this)};function wp(a,b){pn.call(this,a,b);this.u=null;this.oa={}}t(wp,pn);
wp.prototype.l=function(a,b){var c=this.J,d;for(d in b)if(Object.prototype.hasOwnProperty.call(b,d))switch(d){case "writing-mode":case "direction":c[d]=b[d]}pn.prototype.l.call(this,a,b)};wp.prototype.rd=function(){var a=this.style;a.left=Ad;a["margin-left"]=Ad;a["border-left-width"]=Ad;a["padding-left"]=Ad;a["padding-right"]=Ad;a["border-right-width"]=Ad;a["margin-right"]=Ad;a.right=Ad};
wp.prototype.sd=function(){var a=this.style;a.top=Ad;a["margin-top"]=Ad;a["border-top-width"]=Ad;a["padding-top"]=Ad;a["padding-bottom"]=Ad;a["border-bottom-width"]=Ad;a["margin-bottom"]=Ad;a.bottom=Ad};wp.prototype.da=function(a,b,c){b=b.G;var d={start:this.u.marginLeft,end:this.u.marginRight,ka:this.u.Xb},e={start:this.u.marginTop,end:this.u.marginBottom,ka:this.u.Wb};zp(this,b.top,!0,d,a,c);zp(this,b.bottom,!0,d,a,c);zp(this,b.left,!1,e,a,c);zp(this,b.right,!1,e,a,c)};
function Ap(a,b,c,d,e){this.P=a;this.B=e;this.j=c;this.w=!Y(d,b[c?"width":"height"],new cc(d,0,"px"));this.l=null}Ap.prototype.b=function(){return this.w};function Bp(a){a.l||(a.l=$o(a.B,a.P.element,a.j?["max-content width","min-content width"]:["max-content height","min-content height"]));return a.l}Ap.prototype.g=function(){var a=Bp(this);return this.j?yk(this.P)+a["max-content width"]+zk(this.P):wk(this.P)+a["max-content height"]+xk(this.P)};
Ap.prototype.h=function(){var a=Bp(this);return this.j?yk(this.P)+a["min-content width"]+zk(this.P):wk(this.P)+a["min-content height"]+xk(this.P)};Ap.prototype.f=function(){return this.j?yk(this.P)+this.P.width+zk(this.P):wk(this.P)+this.P.height+xk(this.P)};function Cp(a){this.j=a}Cp.prototype.b=function(){return this.j.some(function(a){return a.b()})};Cp.prototype.g=function(){var a=this.j.map(function(a){return a.g()});return Math.max.apply(null,a)*a.length};
Cp.prototype.h=function(){var a=this.j.map(function(a){return a.h()});return Math.max.apply(null,a)*a.length};Cp.prototype.f=function(){var a=this.j.map(function(a){return a.f()});return Math.max.apply(null,a)*a.length};function Dp(a,b,c,d,e,f){Ap.call(this,a,b,c,d,e);this.u=f}t(Dp,Ap);Dp.prototype.b=function(){return!1};Dp.prototype.g=function(){return this.f()};Dp.prototype.h=function(){return this.f()};Dp.prototype.f=function(){return this.j?yk(this.P)+this.u+zk(this.P):wk(this.P)+this.u+xk(this.P)};
function zp(a,b,c,d,e,f){var g=a.f.f,h={},l={},k={},m;for(m in b){var p=qp[m];if(p){var q=b[m],w=a.oa[m],r=new Ap(q,w.style,c,g,f);h[p.ra]=q;l[p.ra]=w;k[p.ra]=r}}a=d.start.evaluate(e);d.end.evaluate(e);b=d.ka.evaluate(e);var x=Ep(k,b),B=!1,G={};Object.keys(h).forEach(function(a){var b=Y(g,l[a].style[c?"max-width":"max-height"],d.ka);b&&(b=b.evaluate(e),x[a]>b&&(b=k[a]=new Dp(h[a],l[a].style,c,g,f,b),G[a]=b.f(),B=!0))});B&&(x=Ep(k,b),B=!1,["start","center","end"].forEach(function(a){x[a]=G[a]||x[a]}));
var R={};Object.keys(h).forEach(function(a){var b=Y(g,l[a].style[c?"min-width":"min-height"],d.ka);b&&(b=b.evaluate(e),x[a]<b&&(b=k[a]=new Dp(h[a],l[a].style,c,g,f,b),R[a]=b.f(),B=!0))});B&&(x=Ep(k,b),["start","center","end"].forEach(function(a){x[a]=R[a]||x[a]}));var P=a+b,ib=a+(a+b);["start","center","end"].forEach(function(a){var b=x[a];if(b){var d=h[a],e=0;switch(a){case "start":e=c?d.left:d.top;break;case "center":e=(ib-b)/2;break;case "end":e=P-b}c?Ck(d,e,b-yk(d)-zk(d)):Bk(d,e,b-wk(d)-xk(d))}})}
function Ep(a,b){var c=a.start,d=a.center,e=a.end,f={};if(d){var g=[c,e].filter(function(a){return a}),g=Fp(d,g.length?new Cp(g):null,b);g.eb&&(f.center=g.eb);d=g.eb||d.f();d=(b-d)/2;c&&c.b()&&(f.start=d);e&&e.b()&&(f.end=d)}else c=Fp(c,e,b),c.eb&&(f.start=c.eb),c.Ec&&(f.end=c.Ec);return f}
function Fp(a,b,c){var d={eb:null,Ec:null};if(a&&b)if(a.b()&&b.b()){var e=a.g(),f=b.g();0<e&&0<f?(f=e+f,f<c?d.eb=c*e/f:(a=a.h(),b=b.h(),b=a+b,b<c?d.eb=a+(c-b)*(e-a)/(f-b):0<b&&(d.eb=c*a/b)),0<d.eb&&(d.Ec=c-d.eb)):0<e?d.eb=c:0<f&&(d.Ec=c)}else a.b()?d.eb=Math.max(c-b.f(),0):b.b()&&(d.Ec=Math.max(c-a.f(),0));else a?a.b()&&(d.eb=c):b&&b.b()&&(d.Ec=c);return d}wp.prototype.Cb=function(a,b,c,d,e){wp.ye.Cb.call(this,a,b,c,d,e);b.element.setAttribute("data-vivliostyle-page-box",!0)};
function xp(a,b){tn.call(this,a,b);this.marginLeft=this.marginBottom=this.marginRight=this.marginTop=this.Wb=this.Xb=null}t(xp,tn);
xp.prototype.l=function(a,b){var c=this.J,d;for(d in b)Object.prototype.hasOwnProperty.call(b,d)&&(d.match(/^column.*$/)||d.match(/^background-/))&&(c[d]=b[d]);tn.prototype.l.call(this,a,b);d=this.g;c={Xb:this.Xb,Wb:this.Wb,marginTop:this.marginTop,marginRight:this.marginRight,marginBottom:this.marginBottom,marginLeft:this.marginLeft};d.u=c;d=d.style;d.width=new E(c.Xb);d.height=new E(c.Wb);d["padding-left"]=new E(c.marginLeft);d["padding-right"]=new E(c.marginRight);d["padding-top"]=new E(c.marginTop);
d["padding-bottom"]=new E(c.marginBottom)};xp.prototype.rd=function(){var a=Gp(this,{start:"left",end:"right",ka:"width"});this.Xb=a.de;this.marginLeft=a.se;this.marginRight=a.re};xp.prototype.sd=function(){var a=Gp(this,{start:"top",end:"bottom",ka:"height"});this.Wb=a.de;this.marginTop=a.se;this.marginBottom=a.re};
function Gp(a,b){var c=a.style,d=a.f.f,e=b.start,f=b.end,g=b.ka,h=a.f.D[g].qa(d,null),l=Y(d,c[g],h),k=Y(d,c["margin-"+e],h),m=Y(d,c["margin-"+f],h),p=un(d,c["padding-"+e],h),q=un(d,c["padding-"+f],h),w=wn(d,c["border-"+e+"-width"],c["border-"+e+"-style"],h),r=wn(d,c["border-"+f+"-width"],c["border-"+f+"-style"],h),x=z(d,h,y(d,y(d,w,p),y(d,r,q)));l?(x=z(d,x,l),k||m?k?m=z(d,x,k):k=z(d,x,m):m=k=kc(d,x,new rb(d,.5))):(k||(k=d.b),m||(m=d.b),l=z(d,x,y(d,k,m)));c[e]=new E(k);c[f]=new E(m);c["margin-"+e]=
Ad;c["margin-"+f]=Ad;c["padding-"+e]=new E(p);c["padding-"+f]=new E(q);c["border-"+e+"-width"]=new E(w);c["border-"+f+"-width"]=new E(r);c[g]=new E(l);c["max-"+g]=new E(l);return{de:z(d,h,y(d,k,m)),se:k,re:m}}xp.prototype.Cb=function(a,b,c,d,e){tn.prototype.Cb.call(this,a,b,c,d,e);c.I=b.element};function yp(a,b){tn.call(this,a,b);var c=b.w;this.u=qp[c];a.oa[c]=this;this.ta=!0}t(yp,tn);n=yp.prototype;
n.Cb=function(a,b,c,d,e){var f=b.element;v(f,"display","flex");var g=Gn(this,a,"vertical-align"),h=null;g===C("middle")?h="center":g===C("top")?h="flex-start":g===C("bottom")&&(h="flex-end");h&&(v(f,"flex-flow",this.b?"row":"column"),v(f,"justify-content",h));tn.prototype.Cb.call(this,a,b,c,d,e)};
n.ra=function(a,b){var c=this.style,d=this.f.f,e=a.start,f=a.end,g="left"===e,h=g?b.Xb:b.Wb,l=Y(d,c[a.ka],h),g=g?b.marginLeft:b.marginTop;if("start"===this.u.ra)c[e]=new E(g);else if(l){var k=un(d,c["margin-"+e],h),m=un(d,c["margin-"+f],h),p=un(d,c["padding-"+e],h),q=un(d,c["padding-"+f],h),w=wn(d,c["border-"+e+"-width"],c["border-"+e+"-style"],h),f=wn(d,c["border-"+f+"-width"],c["border-"+f+"-style"],h),l=y(d,l,y(d,y(d,p,q),y(d,y(d,w,f),y(d,k,m))));switch(this.u.ra){case "center":c[e]=new E(y(d,
g,lc(d,z(d,h,l),new rb(d,2))));break;case "end":c[e]=new E(z(d,y(d,g,h),l))}}};
function Hp(a,b,c){function d(a){if(x)return x;x={ka:r?r.evaluate(a):null,Wa:l?l.evaluate(a):null,Xa:k?k.evaluate(a):null};var b=h.evaluate(a),c=0;[q,m,p,w].forEach(function(b){b&&(c+=b.evaluate(a))});(null===x.Wa||null===x.Xa)&&c+x.ka+x.Wa+x.Xa>b&&(null===x.Wa&&(x.Wa=0),null===x.Xa&&(x.uf=0));null!==x.ka&&null!==x.Wa&&null!==x.Xa&&(x.Xa=null);null===x.ka&&null!==x.Wa&&null!==x.Xa?x.ka=b-c-x.Wa-x.Xa:null!==x.ka&&null===x.Wa&&null!==x.Xa?x.Wa=b-c-x.ka-x.Xa:null!==x.ka&&null!==x.Wa&&null===x.Xa?x.Xa=
b-c-x.ka-x.Wa:null===x.ka?(x.Wa=x.Xa=0,x.ka=b-c):x.Wa=x.Xa=(b-c-x.ka)/2;return x}var e=a.style;a=a.f.f;var f=b.ud,g=b.yd;b=b.ka;var h=c["margin"+g.charAt(0).toUpperCase()+g.substring(1)],l=vn(a,e["margin-"+f],h),k=vn(a,e["margin-"+g],h),m=un(a,e["padding-"+f],h),p=un(a,e["padding-"+g],h),q=wn(a,e["border-"+f+"-width"],e["border-"+f+"-style"],h),w=wn(a,e["border-"+g+"-width"],e["border-"+g+"-style"],h),r=Y(a,e[b],h),x=null;e[b]=new E(new tb(a,function(){var a=d(this).ka;return null===a?0:a},b));e["margin-"+
f]=new E(new tb(a,function(){var a=d(this).Wa;return null===a?0:a},"margin-"+f));e["margin-"+g]=new E(new tb(a,function(){var a=d(this).Xa;return null===a?0:a},"margin-"+g));"left"===f?e.left=new E(y(a,c.marginLeft,c.Xb)):"top"===f&&(e.top=new E(y(a,c.marginTop,c.Wb)))}n.rd=function(){var a=this.g.u;this.u.Fa?Hp(this,{ud:"right",yd:"left",ka:"width"},a):this.u.Ga?Hp(this,{ud:"left",yd:"right",ka:"width"},a):this.ra({start:"left",end:"right",ka:"width"},a)};
n.sd=function(){var a=this.g.u;this.u.Ha?Hp(this,{ud:"bottom",yd:"top",ka:"height"},a):this.u.Ea?Hp(this,{ud:"top",yd:"bottom",ka:"height"},a):this.ra({start:"top",end:"bottom",ka:"height"},a)};n.Mc=function(a,b,c,d,e,f,g){tn.prototype.Mc.call(this,a,b,c,d,e,f,g);a=c.G;c=this.f.w;d=this.u;d.Fa||d.Ga?d.Ha||d.Ea||(d.Fa?a.left[c]=b:d.Ga&&(a.right[c]=b)):d.Ha?a.top[c]=b:d.Ea&&(a.bottom[c]=b)};
function Ip(a,b,c,d,e){this.b=a;this.l=b;this.h=c;this.f=d;this.g=e;this.j={};a=this.l;b=new dc(a,"page-number");b=new Wb(a,new bc(a,b,new rb(a,2)),a.b);c=new Mb(a,b);a.values["recto-page"]=c;a.values["verso-page"]=b;"ltr"===ap(this.g)?(a.values["left-page"]=b,b=new Mb(a,b),a.values["right-page"]=b):(c=new Mb(a,b),a.values["left-page"]=c,a.values["right-page"]=b)}function Jp(a){var b={};Ki(a.b,[],"",b);a.b.pop();return b}
function Kp(a,b){var c=[],d;for(d in b)if(Object.prototype.hasOwnProperty.call(b,d)){var e=b[d],f;f=e instanceof V?e.value+"":Kp(a,e);c.push(d+f+(e.Qa||""))}return c.sort().join("^")}function Lp(a,b,c){c=c.clone({Db:"vivliostyle-page-rule-master"});var d=c.b,e=b.size;if(e){var f=gp(b),e=e.Qa;d.width=qh(a.f,d.width,new V(f.width,e));d.height=qh(a.f,d.height,new V(f.height,e))}["counter-reset","counter-increment"].forEach(function(a){d[a]&&(b[a]=d[a])});c=c.h(a.h);c.l(a.b,a.g);Un(c,a.f);return c}
function Mp(a){this.b=null;this.h=a}t(Mp,W);Mp.prototype.apply=function(a){a.U===this.h&&this.b.apply(a)};Mp.prototype.f=function(){return 3};Mp.prototype.g=function(a){this.b&&Fh(a.sc,this.h,this.b);return!0};function Np(a){this.b=null;this.h=a}t(Np,W);Np.prototype.apply=function(a){1===(new dc(this.h,"page-number")).evaluate(a.l)&&this.b.apply(a)};Np.prototype.f=function(){return 2};function Op(a){this.b=null;this.h=a}t(Op,W);
Op.prototype.apply=function(a){(new dc(this.h,"left-page")).evaluate(a.l)&&this.b.apply(a)};Op.prototype.f=function(){return 1};function Pp(a){this.b=null;this.h=a}t(Pp,W);Pp.prototype.apply=function(a){(new dc(this.h,"right-page")).evaluate(a.l)&&this.b.apply(a)};Pp.prototype.f=function(){return 1};function Qp(a){this.b=null;this.h=a}t(Qp,W);Qp.prototype.apply=function(a){(new dc(this.h,"recto-page")).evaluate(a.l)&&this.b.apply(a)};Qp.prototype.f=function(){return 1};
function Rp(a){this.b=null;this.h=a}t(Rp,W);Rp.prototype.apply=function(a){(new dc(this.h,"verso-page")).evaluate(a.l)&&this.b.apply(a)};Rp.prototype.f=function(){return 1};function Sp(a,b){Dh.call(this,a,b,null,null)}t(Sp,Dh);Sp.prototype.apply=function(a){var b=a.l,c=a.D,d=this.style;a=this.W;wh(b,c,d,a,null,null);if(d=d._marginBoxes){var c=uh(c,"_marginBoxes"),e;for(e in d)if(d.hasOwnProperty(e)){var f=c[e];f||(f={},c[e]=f);wh(b,f,d[e],a,null,null)}}};
function Tp(a,b,c,d,e){Vi.call(this,a,b,null,c,null,d,!1);this.J=e;this.F=[];this.g="";this.B=[]}t(Tp,Vi);n=Tp.prototype;n.bc=function(){this.qb()};n.sb=function(a,b){if(this.g=b)this.b.push(new Mp(b)),this.W+=65536};
n.tc=function(a,b){b&&hf(this,"E_INVALID_PAGE_SELECTOR :"+a+"("+b.join("")+")");this.B.push(":"+a);switch(a.toLowerCase()){case "first":this.b.push(new Np(this.f));this.W+=256;break;case "left":this.b.push(new Op(this.f));this.W+=1;break;case "right":this.b.push(new Pp(this.f));this.W+=1;break;case "recto":this.b.push(new Qp(this.f));this.W+=1;break;case "verso":this.b.push(new Rp(this.f));this.W+=1;break;default:hf(this,"E_INVALID_PAGE_SELECTOR :"+a)}};
function Up(a){var b;a.g||a.B.length?b=[a.g].concat(a.B.sort()):b=null;a.F.push({Yd:b,W:a.W});a.g="";a.B=[]}n.$b=function(){Up(this);Vi.prototype.$b.call(this)};n.xa=function(){Up(this);Vi.prototype.xa.call(this)};
n.pb=function(a,b,c){if("bleed"!==a&&"marks"!==a||this.F.some(function(a){return!a.Yd})){Vi.prototype.pb.call(this,a,b,c);var d=this.Ua[a],e=this.J;if("bleed"===a||"marks"===a)e[""]||(e[""]={}),Object.keys(e).forEach(function(b){th(e[b],a,d)});else if("size"===a){var f=e[""];this.F.forEach(function(b){var c=new V(d.value,d.Qa+b.W);b=b.Yd?b.Yd.join(""):"";var g=e[b];g?(c=(b=g[a])?qh(null,c,b):c,th(g,a,c)):(g=e[b]={},th(g,a,c),f&&["bleed","marks"].forEach(function(a){f[a]&&th(g,a,f[a])},this))},this)}}};
n.me=function(a){Fh(this.j.sc,"*",a)};n.qe=function(a){return new Sp(this.Ua,a)};n.Fd=function(a){var b=uh(this.Ua,"_marginBoxes"),c=b[a];c||(c={},b[a]=c);df(this.ha,new Vp(this.f,this.ha,this.u,c))};function Vp(a,b,c,d){ef.call(this,a,b,!1);this.g=c;this.b=d}t(Vp,ff);Vp.prototype.ob=function(a,b,c){ah(this.g,a,b,c,this)};Vp.prototype.qc=function(a,b){gf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};Vp.prototype.ad=function(a,b){gf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};
Vp.prototype.pb=function(a,b,c){th(this.b,a,new V(b,c?af(this):bf(this)))};var Wp=new ge(function(){var a=H("uaStylesheetBase");bh.get().then(function(b){var c=la("user-agent-base.css",ka);b=new Vi(null,null,null,null,null,b,!0);b.cc("UA");Ui=b.j;Hf(c,b,null,null).sa(a)});return J(a)},"uaStylesheetBaseFetcher");
function Xp(a,b,c,d,e,f,g,h,l,k){this.l=a;this.f=b;this.b=c;this.g=d;this.G=e;this.j=f;this.B=a.J;this.D=g;this.h=h;this.w=l;this.F=k;this.u=a.l;vb(this.b,function(a){var b=this.b,c;c=(c=b.b[a])?(c=c.b[0])?c.b:null:null;var d;d=b.b[a];if(d=Yp(this,d?d.f:"any"))d=(a=b.b[a])?0<a.b.length&&a.b[0].b.f<=this.B:!1;return d&&!!c&&!Zp(this,c)});ub(this.b,new tb(this.b,function(){return this.na+this.b.page},"page-number"))}
function $p(a,b,c,d){if(a.w.length){var e=new yb(0,b,c,d);a=a.w;for(var f={},g=0;g<a.length;g++)wh(e,f,a[g],0,null,null);g=f.width;a=f.height;var h=f["text-zoom"];if(g&&a||h)if(f=wb.em,(h?h.evaluate(e,"text-zoom"):null)===md&&(h=f/d,d=f,b*=h,c*=h),g&&a&&(g=Dc(g.evaluate(e,"width"),e),e=Dc(a.evaluate(e,"height"),e),0<g&&0<e))return{width:g,height:e,fontSize:d}}return{width:b,height:c,fontSize:d}}
function aq(a,b,c,d,e,f,g,h,l,k,m){yb.call(this,0,d.width,d.height,d.fontSize);this.style=a;this.ca=b;this.lang=b.lang||c;this.viewport=d;this.j={body:!0};this.g=e;this.w=this.b=this.G=this.f=this.D=null;this.B=0;this.mb=f;this.l=new rl(this.style.B);this.ma={};this.S=null;this.h=m;this.M={};this.da=null;this.Sa=g;this.lb=h;this.na=l;this.kb=k;for(var p in a.h)(b=a.h[p]["flow-consume"])&&(b.evaluate(this,"flow-consume")==Fc?this.j[p]=!0:delete this.j[p]);this.oa={}}t(aq,yb);
function bq(a){var b=H("StyleInstance.init"),c=new Sm(a.h,a.ca.url),d=new Rm(a.h,a.ca.url,a.style.f,a.style.b);a.f=new Zk(a.ca,a.style.g,a.style.f,a,a.j,a.style.u,c,d);d.h=a.f;il(a.f,a);a.G={};a.G[a.ca.url]=a.f;var e=fl(a.f);a.da=ap(e);a.D=new Vn(a.style.G);c=new Hi(a.style.g,a,c,d);a.D.l(c,e);Un(a.D,a);a.S=new Ip(c,a.style.b,a.D,a,e);e=[];for(c=0;c<a.style.j.length;c++)if(d=a.style.j[c],!d.T||d.T.evaluate(a))d=ol(d.Pb,a),d=new pl(d),e.push(d);xl(a.mb,e,a.l).sa(b);var f=a.style.F;Object.keys(f).forEach(function(a){var b=
hp(gp(f[a]),this);this.oa[a]={width:b.Bb+2*b.ld,height:b.Ab+2*b.ld}},a);return J(b)}function jl(a,b,c){if(a=a.b)a.g[b.b]||(a.g[b.b]=c),c=a.b[b.b],c||(c=new rk,a.b[b.b]=c),c.b.push(new qk(new ok({ja:[{node:b.element,Ra:ak,la:null,za:null,wa:null}],ga:0,K:!1,Ia:null}),b))}function cq(a,b){for(var c=Number.POSITIVE_INFINITY,d=0;d<b.b.length;d++){for(var e=b.b[d].f.Oa,f=e.ja[0].node,g=e.ga,h=e.K,l=0;f.ownerDocument!=a.ca.b;)l++,f=e.ja[l].node,h=!1,g=0;e=oj(a.ca,f,g,h);e<c&&(c=e)}return c}
function dq(a,b,c){if(!b)return 0;var d=Number.POSITIVE_INFINITY,e;for(e in a.j){var f=b.b[e];if(!(c||f&&f.b.length)&&a.b){f=a.f;f.I=e;for(var g=0;null!=f.I&&(g+=5E3,gl(f,g,0)!=Number.POSITIVE_INFINITY););f=a.b.b[e];b!=a.b&&f&&(f=f.clone(),b.b[e]=f)}f&&(f=cq(a,f),f<d&&(d=f))}return d}function Yp(a,b){switch(b){case "left":case "right":case "recto":case "verso":return(new dc(a.style.b,b+"-page")).evaluate(a);default:return!0}}
function eq(a,b){var c=a.b,d=dq(a,c);if(d==Number.POSITIVE_INFINITY)return null;for(var e=a.D.w,f,g=0;g<e.length;g++)if(f=e[g],"vivliostyle-page-rule-master"!==f.f.Db){var h=1,l=Gn(f,a,"utilization");l&&l.Vd()&&(h=l.H);var l=Ab(a,"em",!1),k=a.Bb()*a.Ab();a.B=gl(a.f,d,Math.ceil(h*k/(l*l)));h=a;l=c;k=void 0;for(k in l.b){var m=l.b[k];if(m&&0<m.b.length){var p=m.b[0].b;if(cq(h,m)===p.f){a:switch(p=m.f,p){case "left":case "right":case "recto":case "verso":break a;default:p=null}m.f=zl(Qk(p,m.b[0].b.g))}}}a.w=
c.clone();h=a;l=h.b.page;k=void 0;for(k in h.b.b)for(m=h.b.b[k],p=m.b.length-1;0<=p;p--){var q=m.b[p];0>q.b.bb&&q.b.f<h.B&&(q.b.bb=l)}zb(a,a.style.b);h=Gn(f,a,"enabled");if(!h||h===wd){c=a;u.debug("Location - page",c.b.page);u.debug("  current:",d);u.debug("  lookup:",c.B);d=void 0;for(d in c.b.b)for(e=c.b.b[d],g=0;g<e.b.length;g++)u.debug("  Chunk",d+":",e.b[g].b.f);d=a.S;e=f;f=b;c=e.f;Object.keys(f).length?(e=c,g=Kp(d,f),e=e.l+"^"+g,g=d.j[e],g||("background-host"===c.Db?(c=d,f=(new sp(c.l,c.h.f,
f)).h(c.h),f.l(c.b,c.g),Un(f,c.f),g=f):g=Lp(d,f,c),d.j[e]=g),f=g.f,f.f.g=f,f=g):(c.f.g=c,f=e);return f}}throw Error("No enabled page masters");}function Zp(a,b){var c=a.w.g,d=c[b.b].f;if(d){var e=b.f,f=c[d].b;if(!f.length||e<f[0])return!1;var c=Ia(f.length,function(a){return f[a]>e})-1,c=f[c],d=a.w.b[d],g=cq(a,d);return c<g?!1:g<c?!0:!Yp(a,d.f)}return!1}
function fq(a,b,c){var d=a.b.b[c];if(!d||!Yp(a,d.f))return I(!0);d.f="any";fm(b);a.j[c]&&0<b.Ib.length&&(b.ie=!1);var e=H("layoutColumn"),f=[],g=[],h=!0;de(function(c){for(;0<d.b.length-g.length;){for(var e=0;0<=g.indexOf(e);)e++;var l=d.b[e];if(l.b.f>a.B||Zp(a,l.b))break;for(var p=e+1;p<d.b.length;p++)if(!(0<=g.indexOf(p))){var q=d.b[p];if(q.b.f>a.B||Zp(a,q.b))break;Vj(q.b,l.b)&&(l=q,e=p)}var w=l.b,r=!0;im(b,l.f,h).then(function(a){h=!1;!l.b.Pe||a&&!w.h||f.push(e);w.h?(g.push(e),M(c)):(a?l.f=a:g.push(e),
b.l&&(d.f=zl(b.l)),a||b.l?M(c):r?r=!1:fe(c))});if(r){r=!1;return}}M(c)}).then(function(){d.b=d.b.filter(function(a,b){return 0<=f.indexOf(b)||0>g.indexOf(b)});L(e,!0)});return J(e)}
function gq(a,b,c,d,e,f,g,h){zn(c);var l=Gn(c,a,"enabled");if(l&&l!==wd)return I(!0);var k=H("layoutContainer"),m=Gn(c,a,"wrap-flow")===Hc,p=c.b?c.j&&c.M:c.h&&c.S,l=Gn(c,a,"flow-from"),q=a.viewport.b.createElement("div"),w=Gn(c,a,"position");v(q,"position",w?w.name:"absolute");d.insertBefore(q,d.firstChild);var r=new vk(q);r.b=c.b;c.Cb(a,r,b,a.l,a.g);r.J=e;r.M=f;e+=r.left+r.marginLeft+r.da;f+=r.top+r.marginTop+r.ma;var x=!1;if(l&&l.ne())if(a.M[l.toString()])c.Mc(a,r,b,null,1,a.g,a.l),l=I(!0);else{var B=
H("layoutContainer.inner"),G=l.toString(),R=Z(c,a,"column-count"),P=Z(c,a,"column-gap"),ib=1<R?Z(c,a,"column-width"):r.width,l=Fn(c,a),jb=0,w=Gn(c,a,"shape-inside"),ya=ng(w,0,0,r.width,r.height,a),K=new xo(G,a,a.viewport,a.f,l,a.ca,a.l,a.style.D,a,b,a.Sa,a.lb,h,a.kb),La=new Qm(a.h,a.b.page-1),Fd=0,ga=null;de(function(b){for(;Fd<R;){var c=Fd++;if(1<R){var d=a.viewport.b.createElement("div");v(d,"position","absolute");q.appendChild(d);ga=new Kl(d,K,a.g,La);ga.b=r.b;ga.nb=r.nb;ga.Fc=r.Fc;r.b?(v(d,"margin-left",
r.w+"px"),v(d,"margin-right",r.G+"px"),c=c*(ib+P)+r.B,Ck(ga,0,r.width),Bk(ga,c,ib)):(v(d,"margin-top",r.B+"px"),v(d,"margin-bottom",r.F+"px"),c=c*(ib+P)+r.w,Bk(ga,0,r.height),Ck(ga,c,ib));ga.J=e+r.w;ga.M=f+r.B}else ga=new Kl(q,K,a.g,La),Ak(ga,r),r=ga;ga.S=p?[]:g;ga.Kb=ya;if(0<=ga.width){var k=H("inner");fq(a,ga,G).then(function(){ga.l&&"column"!=ga.l&&(Fd=R,"region"!=ga.l&&(a.M[G]=!0));L(k,!0)});c=J(k)}else c=I(!0);if(c.va()){c.then(function(){0<h.b.length?M(b):(jb=Math.max(jb,ga.g),fe(b))});return}0<
h.b.length||(jb=Math.max(jb,ga.g))}M(b)}).then(function(){r.g=jb;c.Mc(a,r,b,ga,R,a.g,a.l);L(B,!0)});l=J(B)}else(l=Gn(c,a,"content"))&&Ek(l)?(w=a.viewport.b.createElement("span"),l.$(new Dk(w,a)),q.appendChild(w),Tn(c,a,r,a.l)):c.ta&&(d.removeChild(q),x=!0),x||c.Mc(a,r,b,null,1,a.g,a.l),l=I(!0);l.then(function(){if(!c.h||0<Math.floor(r.g)){if(!x&&!m){var l=r.J+r.left,p=r.M+r.top,w=yk(r)+r.width+zk(r),B=wk(r)+r.height+xk(r),G=Gn(c,a,"shape-outside"),l=ng(G,l,p,w,B,a);g.push(l)}}else if(!c.w.length){d.removeChild(q);
L(k,!0);return}var R=c.w.length-1;ce(function(){for(;0<=R;){var d=c.w[R--],d=gq(a,b,d,q,e,f,g,h);if(d.va())return d}return I(!1)}).then(function(){L(k,!0)})});return J(k)}
function hq(a,b,c){a.M={};c?(a.b=c.clone(),bl(a.f,c.f)):(a.b=new tk,bl(a.f,-1));a.lang&&b.g.setAttribute("lang",a.lang);c=a.b;c.page++;zb(a,a.style.b);a.w=c.clone();var d=Jp(a.S),e=eq(a,d);if(!e)return I(null);Mj(b,e.f.b.width.value===yd);Nj(b,e.f.b.height.value===zd);a.h.j=b;bn(a.h,d,a);var f=hp(gp(d),a);iq(a,f,b);op(d,f,b,a);var g=f.ub+f.Mb,d=Gn(e,a,"writing-mode")||Xc,f=Gn(e,a,"direction")||fd,h=new io(b.J.bind(b),d,f),l=[],k=H("layoutNextPage");de(function(d){gq(a,b,e,b.g,g,g,l.concat(),h).then(function(){if(0<
h.b.length){l=l.concat(ko(h));h.b.splice(0,h.b.length);c=a.b=a.w.clone();for(var e;e=b.g.lastChild;)b.g.removeChild(e);fe(d)}else M(d)})}).then(function(){e.da(a,b,a.g);var d=new dc(e.f.f,"left-page");b.l=d.evaluate(a)?"left":"right";var d=a.b.page,f;for(f in a.b.b)for(var g=a.b.b[f],h=g.b.length-1;0<=h;h--){var l=g.b[h];0<=l.b.bb&&l.b.bb+l.b.l-1<=d&&g.b.splice(h,1)}a.b=a.w=null;c.f=a.f.b;Pj(b,a.style.l.I[a.ca.url],a.g);var x;a:{for(x in a.j)if((f=c.b[x])&&0<f.b.length){x=!1;break a}x=!0}x&&(c=null);
L(k,c)});return J(k)}function iq(a,b,c){a.J=b.Bb;a.I=b.Ab;c.P.style.width=b.Bb+2*b.ld+"px";c.P.style.height=b.Ab+2*b.ld+"px";c.g.style.left=b.ub+"px";c.g.style.right=b.ub+"px";c.g.style.top=b.ub+"px";c.g.style.bottom=b.ub+"px";c.g.style.padding=b.Mb+"px"}function jq(a,b,c,d){Vi.call(this,a.j,a,b,c,d,a.h,!c);this.g=a;this.B=!1}t(jq,Vi);n=jq.prototype;n.Yc=function(){};n.Xc=function(a,b,c){a=new on(this.g.u,a,b,c,this.g.F,this.T,bf(this.ha));df(this.g,new $n(a.f,this.g,a,this.u))};
n.Sb=function(a){a=a.b;this.T&&(a=jc(this.f,this.T,a));df(this.g,new jq(this.g,a,this,this.D))};n.Uc=function(){df(this.g,new aj(this.f,this.ha))};n.Wc=function(){var a={};this.g.w.push({Pb:a,T:this.T});df(this.g,new bj(this.f,this.ha,null,a,this.g.h))};n.Vc=function(a){var b=this.g.l[a];b||(b={},this.g.l[a]=b);df(this.g,new bj(this.f,this.ha,null,b,this.g.h))};n.$c=function(){var a={};this.g.G.push(a);df(this.g,new bj(this.f,this.ha,this.T,a,this.g.h))};
n.xc=function(a){var b=this.g.B;if(a){var c=uh(b,"_pseudos"),b=c[a];b||(b={},c[a]=b)}df(this.g,new bj(this.f,this.ha,null,b,this.g.h))};n.Zc=function(){this.B=!0;this.qb()};n.bc=function(){var a=new Tp(this.g.u,this.g,this,this.u,this.g.D);df(this.g,a);a.bc()};n.xa=function(){Vi.prototype.xa.call(this);if(this.B){this.B=!1;var a="R"+this.g.J++,b=C(a),c;this.T?c=new ph(b,0,this.T):c=new V(b,0);vh(this.Ua,"region-id").push(c);this.xb();a=new jq(this.g,this.T,this,a);df(this.g,a);a.xa()}};
function kq(a){var b=a.getAttribute("content");if(!b)return"";a={};for(var c;c=b.match(/^,?\s*([-A-Za-z_.][-A-Za-z_0-9.]*)\s*=\s*([-+A-Za-z_0-9.]*)\s*/);)b=b.substr(c[0].length),a[c[1]]=c[2];b=a.width-0;a=a.height-0;return b&&a?"@-epubx-viewport{width:"+b+"px;height:"+a+"px;}":""}function lq(a){cf.call(this);this.h=a;this.j=new qb(null);this.u=new qb(this.j);this.F=new ln(this.j);this.I=new jq(this,null,null,null);this.J=0;this.w=[];this.B={};this.l={};this.G=[];this.D={};this.b=this.I}t(lq,cf);
lq.prototype.error=function(a){u.b("CSS parser:",a)};function mq(a,b){return nq(b,a)}function oq(a){We.call(this,mq,"document");this.J=a;this.G={};this.u={};this.f={};this.I={};this.l=null;this.b=[]}t(oq,We);function pq(a,b,c){qq(a,b,c);var d=la("user-agent.xml",ka),e=H("OPSDocStore.init");bh.get().then(function(b){a.l=b;Wp.get().then(function(){a.load(d).then(function(){L(e,!0)})})});return J(e)}function qq(a,b,c){a.b.splice(0);b&&b.forEach(a.M,a);c&&c.forEach(a.S,a)}
oq.prototype.M=function(a){this.b.push({url:a.url,text:a.text,Va:"Author",Ba:null,media:null})};oq.prototype.S=function(a){this.b.push({url:a.url,text:a.text,Va:"User",Ba:null,media:null})};
function nq(a,b){var c=H("OPSDocStore.load"),d=b.url;wj(b,a).then(function(b){if(b){for(var e=[],g=b.b.getElementsByTagNameNS("http://www.idpf.org/2007/ops","trigger"),h=0;h<g.length;h++){var l=g[h],k=l.getAttributeNS("http://www.w3.org/2001/xml-events","observer"),m=l.getAttributeNS("http://www.w3.org/2001/xml-events","event"),p=l.getAttribute("action"),l=l.getAttribute("ref");k&&m&&p&&l&&e.push({Me:k,event:m,action:p,vc:l})}a.I[d]=e;var q=[];q.push({url:la("user-agent-page.css",ka),text:null,Va:"UA",
Ba:null,media:null});if(e=b.l)for(e=e.firstChild;e;e=e.nextSibling)if(1==e.nodeType)if(g=e,h=g.namespaceURI,k=g.localName,"http://www.w3.org/1999/xhtml"==h)if("style"==k)q.push({url:d,text:g.textContent,Va:"Author",Ba:null,media:null});else if("link"==k){if(m=g.getAttribute("rel"),h=g.getAttribute("class"),k=g.getAttribute("media"),"stylesheet"==m||"alternate stylesheet"==m&&h)g=g.getAttribute("href"),g=la(g,d),q.push({url:g,text:null,Ba:h,media:k,Va:"Author"})}else"meta"==k&&"viewport"==g.getAttribute("name")&&
q.push({url:d,text:kq(g),Va:"Author",Ba:null,media:null});else"http://www.gribuser.ru/xml/fictionbook/2.0"==h?"stylesheet"==k&&"text/css"==g.getAttribute("type")&&q.push({url:d,text:g.textContent,Va:"Author",Ba:null,media:null}):"http://example.com/sse"==h&&"property"===k&&(h=g.getElementsByTagName("name")[0])&&"stylesheet"===h.textContent&&(g=g.getElementsByTagName("value")[0])&&(g=la(g.textContent,d),q.push({url:g,text:null,Ba:null,media:null,Va:"Author"}));for(h=0;h<a.b.length;h++)q.push(a.b[h]);
for(var w="",h=0;h<q.length;h++)w+=q[h].url,w+="^",q[h].text&&(w+=q[h].text),w+="^";var r=a.G[w];r?(a.f[d]=r,L(c,b)):(e=a.u[w],e||(e=new ge(function(){var b=H("fetchStylesheet"),c=0,d=new lq(a.l);ce(function(){if(c<q.length){var a=q[c++];d.cc(a.Va);return null!==a.text?If(a.text,d,a.url,a.Ba,a.media).Gd(!0):Hf(a.url,d,a.Ba,a.media)}return I(!1)}).then(function(){r=new Xp(a,d.j,d.u,d.I.j,d.F,d.w,d.B,d.l,d.G,d.D);a.G[w]=r;delete a.u[w];L(b,r)});return J(b)},"FetchStylesheet "+d),a.u[w]=e,e.start()),
e.get().then(function(e){a.f[d]=e;L(c,b)}))}else L(c,null)});return J(c)};function rq(a){return String.fromCharCode(a>>>24&255,a>>>16&255,a>>>8&255,a&255)}
function sq(a){var b=new Aa;b.append(a);var c=55-a.length&63;for(b.append("\u0080");0<c;)c--,b.append("\x00");b.append("\x00\x00\x00\x00");b.append(rq(8*a.length));a=b.toString();for(var b=[1732584193,4023233417,2562383102,271733878,3285377520],c=[],d,e=0;e<a.length;e+=64){for(d=0;16>d;d++){var f=a.substr(e+4*d,4);c[d]=(f.charCodeAt(0)&255)<<24|(f.charCodeAt(1)&255)<<16|(f.charCodeAt(2)&255)<<8|f.charCodeAt(3)&255}for(;80>d;d++)f=c[d-3]^c[d-8]^c[d-14]^c[d-16],c[d]=f<<1|f>>>31;var f=b[0],g=b[1],h=
b[2],l=b[3],k=b[4],m;for(d=0;80>d;d++)m=20>d?(g&h|~g&l)+1518500249:40>d?(g^h^l)+1859775393:60>d?(g&h|g&l|h&l)+2400959708:(g^h^l)+3395469782,m+=(f<<5|f>>>27)+k+c[d],k=l,l=h,h=g<<30|g>>>2,g=f,f=m;b[0]=b[0]+f|0;b[1]=b[1]+g|0;b[2]=b[2]+h|0;b[3]=b[3]+l|0;b[4]=b[4]+k|0}return b}function tq(a){a=sq(a);for(var b=[],c=0;c<a.length;c++){var d=a[c];b.push(d>>>24&255,d>>>16&255,d>>>8&255,d&255)}return b}
function uq(a){a=sq(a);for(var b=new Aa,c=0;c<a.length;c++)b.append(rq(a[c]));a=b.toString();b=new Aa;for(c=0;c<a.length;c++)b.append((a.charCodeAt(c)|256).toString(16).substr(1));return b.toString()};function vq(a,b,c,d,e,f,g,h,l,k){this.b=a;this.url=b;this.lang=c;this.f=d;this.l=e;this.Z=gb(f);this.u=g;this.j=h;this.h=l;this.g=k;this.ab=this.page=null}function wq(a,b,c){if(c--)for(b=b.firstChild;b;b=b.nextSibling)if(1==b.nodeType){var d=b;"auto"!=xa(d,"height","auto")&&(v(d,"height","auto"),wq(a,d,c));"absolute"==xa(d,"position","static")&&(v(d,"position","relative"),wq(a,d,c))}}
function xq(a){var b=a.target,c="\u25b8"==b.textContent;b.textContent=c?"\u25be":"\u25b8";for(b=b.parentNode.firstChild;b;)if(1!=b.nodeType)b=b.nextSibling;else{var d=b;"toc-container"==d.getAttribute("data-adapt-class")?b=d.firstChild:("toc-node"==d.getAttribute("data-adapt-class")&&(d.style.height=c?"auto":"0px"),b=b.nextSibling)}a.stopPropagation()}
vq.prototype.vd=function(a){var b=this.u.vd(a);return function(a,d,e){var c=e.behavior;if(!c||"toc-node"!=c.toString()&&"toc-container"!=c.toString())return b(a,d,e);a=d.getAttribute("data-adapt-class");"toc-node"==a&&(e=d.firstChild,"\u25b8"!=e.textContent&&(e.textContent="\u25b8",v(e,"cursor","pointer"),e.addEventListener("click",xq,!1)));var g=d.ownerDocument.createElement("div");g.setAttribute("data-adapt-process-children","true");"toc-node"==c.toString()?(e=d.ownerDocument.createElement("div"),
e.textContent="\u25b9",v(e,"margin-left","-1em"),v(e,"display","inline-block"),v(e,"width","1em"),v(e,"text-align","left"),v(e,"cursor","default"),v(e,"font-family","Menlo,sans-serif"),g.appendChild(e),v(g,"overflow","hidden"),g.setAttribute("data-adapt-class","toc-node"),"toc-node"!=a&&"toc-container"!=a||v(g,"height","0px")):"toc-node"==a&&g.setAttribute("data-adapt-class","toc-container");return I(g)}};
vq.prototype.Tc=function(a,b,c,d,e){if(this.page)return I(this.page);var f=this,g=H("showTOC"),h=new Lj(a,a);this.page=h;this.b.load(this.url).then(function(d){var k=f.b.f[d.url],l=$p(k,c,1E5,e);b=new Zo(b.window,l.fontSize,b.root,l.width,l.height);var p=new aq(k,d,f.lang,b,f.f,f.l,f.vd(d),f.j,0,f.h,f.g);f.ab=p;p.Z=f.Z;bq(p).then(function(){hq(p,h,null).then(function(){wq(f,a,2);L(g,h)})})});return J(g)};
vq.prototype.Nc=function(){if(this.page){var a=this.page;this.ab=this.page=null;v(a.P,"visibility","none");var b=a.P.parentNode;b&&b.removeChild(a.P)}};vq.prototype.Wd=function(){return!!this.page};function yq(){oq.call(this,zq(this));this.g=new We(wj,"document");this.D=new We(Ye,"text");this.F={};this.da={};this.w={};this.B={}}t(yq,oq);function zq(a){return function(b){return a.w[b]}}
function Aq(a,b,c){var d=H("loadEPUBDoc");"/"!==b.substring(b.length-1)&&(b+="/");c&&a.D.fetch(b+"?r=list");a.g.fetch(b+"META-INF/encryption.xml");var e=b+"META-INF/container.xml";a.g.load(e,!0,"Failed to fetch EPUB container.xml from "+e).then(function(f){if(f){f=Fj(lj(lj(lj(new mj([f.b]),"container"),"rootfiles"),"rootfile"),"full-path");for(var g=0;g<f.length;g++){var h=f[g];if(h){Bq(a,b,h,c).sa(d);return}}L(d,null)}else u.error("Received an empty response for EPUB container.xml "+e+". This may be caused by the server not allowing cross origin requests.")});
return J(d)}function Bq(a,b,c,d){var e=b+c,f=a.F[e];if(f)return I(f);var g=H("loadOPF");a.g.load(e,void 0,void 0).then(function(c){c?a.g.load(b+"META-INF/encryption.xml",void 0,void 0).then(function(h){(d?a.D.load(b+"?r=list"):I(null)).then(function(d){f=new Cq(a,b);Dq(f,c,h,d,b+"?r=manifest").then(function(){a.F[e]=f;a.da[b]=f;L(g,f)})})}):u.error("Received an empty response for EPUB OPF "+e+". This may be caused by the server not allowing cross origin requests.")});return J(g)}
function Eq(a,b,c){var d=H("EPUBDocStore.load");b=ia(b);(a.B[b]=nq(a,{status:200,url:b,contentType:c.contentType,responseText:null,responseXML:c,Sc:null})).sa(d);return J(d)}
yq.prototype.load=function(a){var b=ia(a);if(a=this.B[b])return a.va()?a:I(a.get());var c=H("EPUBDocStore.load");a=yq.ye.load.call(this,b,!0,"Failed to fetch a source document from "+b);a.then(function(a){a?L(c,a):u.error("Received an empty response for "+b+". This may be caused by the server not allowing cross origin requests.")});return J(c)};function Fq(){this.id=null;this.src="";this.h=this.f=null;this.L=-1;this.l=0;this.u=null;this.b=this.g=0;this.Qb=this.bb=null;this.j=Ma}
function Gq(a){return a.id}function Hq(a){var b=tq(a);return function(a){var c=H("deobfuscator"),e,f;a.slice?(e=a.slice(0,1040),f=a.slice(1040,a.size)):(e=a.webkitSlice(0,1040),f=a.webkitSlice(1040,a.size-1040));Ve(e).then(function(a){a=new DataView(a);for(var d=0;d<a.byteLength;d++){var e=a.getUint8(d),e=e^b[d%20];a.setUint8(d,e)}L(c,Ue([a,f]))});return J(c)}}
var Iq={dcterms:"http://purl.org/dc/terms/",marc:"http://id.loc.gov/vocabulary/",media:"http://www.idpf.org/epub/vocab/overlays/#",onix:"http://www.editeur.org/ONIX/book/codelists/current.html#",xsd:"http://www.w3.org/2001/XMLSchema#"},Jq=Iq.dcterms+"language",Kq=Iq.dcterms+"title";
function Lq(a,b){var c={};return function(d,e){var f,g,h=d.r||c,l=e.r||c;if(a==Kq&&(f="main"==h["http://idpf.org/epub/vocab/package/#title-type"],g="main"==l["http://idpf.org/epub/vocab/package/#title-type"],f!=g))return f?-1:1;f=parseInt(h["http://idpf.org/epub/vocab/package/#display-seq"],10);isNaN(f)&&(f=Number.MAX_VALUE);g=parseInt(l["http://idpf.org/epub/vocab/package/#display-seq"],10);isNaN(g)&&(g=Number.MAX_VALUE);return f!=g?f-g:a!=Jq&&b&&(f=(h[Jq]||h["http://idpf.org/epub/vocab/package/#alternate-script"])==
b,g=(l[Jq]||l["http://idpf.org/epub/vocab/package/#alternate-script"])==b,f!=g)?f?-1:1:d.o-e.o}}
function Mq(a,b){function c(a){for(var b in a){var d=a[b];d.sort(Lq(b,k));for(var e=0;e<d.length;e++){var f=d[e].r;f&&c(f)}}}function d(a){return Pa(a,function(a){return Oa(a,function(a){var b={v:a.value,o:a.order};a.vf&&(b.s=a.scheme);if(a.id||a.lang){var c=l[a.id];if(c||a.lang)a.lang&&(a={name:Jq,value:a.lang,lang:null,id:null,Dd:a.id,scheme:null,order:a.order},c?c.push(a):c=[a]),c=Na(c,function(a){return a.name}),b.r=d(c)}return b})})}function e(a){if(a&&(a=a.match(/^\s*(([^:]*):)?(\S+)\s*$/))){var b=
a[1]?f[a[1]]:"http://idpf.org/epub/vocab/package/#";if(b)return b+a[3]}return null}var f;if(b){f={};for(var g in Iq)f[g]=Iq[g];for(;g=b.match(/(^\s*[A-Z_a-z\u007F-\uFFFF][-.A-Z_a-z0-9\u007F-\uFFFF]*):\s*(\S+)/);)b=b.substr(g[0].length),f[g[1]]=g[2]}else f=Iq;var h=1;g=Dj(Ej(a),function(a){if("meta"==a.localName){var b=e(a.getAttribute("property"));if(b)return{name:b,value:a.textContent,id:a.getAttribute("id"),order:h++,Dd:a.getAttribute("refines"),lang:null,scheme:e(a.getAttribute("scheme"))}}else if("http://purl.org/dc/elements/1.1/"==
a.namespaceURI)return{name:Iq.dcterms+a.localName,order:h++,lang:a.getAttribute("xml:lang"),value:a.textContent,id:a.getAttribute("id"),Dd:null,scheme:null};return null});var l=Na(g,function(a){return a.Dd});g=d(Na(g,function(a){return a.Dd?null:a.name}));var k=null;g[Jq]&&(k=g[Jq][0].v);c(g);return g}function Nq(){var a=window.MathJax;return a?a.Hub:null}var Oq={"appliaction/xhtml+xml":!0,"image/jpeg":!0,"image/png":!0,"image/svg+xml":!0,"image/gif":!0,"audio/mp3":!0};
function Cq(a,b){this.h=a;this.l=this.f=this.b=this.j=this.g=null;this.B=b;this.w=null;this.M={};this.lang=null;this.D=0;this.I={};this.S=this.J=this.U=null;this.F={};this.G=null;this.u=Pq(this);Nq()&&(fh["http://www.w3.org/1998/Math/MathML"]=!0)}
function Pq(a){function b(){}b.prototype.Hd=function(a,b){return"viv-id-"+oa(b+(a?"#"+a:""),":")};b.prototype.Cc=function(b,d){var c=b.match(/^([^#]*)#?(.*)$/);if(c){var f=c[1]||d,c=c[2];if(f&&a.j.some(function(a){return a.src===f}))return"#"+this.Hd(c,f)}return b};b.prototype.Qe=function(a){"#"===a.charAt(0)&&(a=a.substring(1));a.indexOf("viv-id-")||(a=a.substring(7));return(a=Ga(a).match(/^([^#]*)#?(.*)$/))?[a[1],a[2]]:[]};return new b}
function Qq(a,b){return a.B?b.substr(0,a.B.length)==a.B?decodeURI(b.substr(a.B.length)):null:b}
function Dq(a,b,c,d,e){a.g=b;var f=lj(new mj([b.b]),"package"),g=Fj(f,"unique-identifier")[0];g&&(g=sj(b,b.url+"#"+g))&&(a.w=g.textContent.replace(/[ \n\r\t]/g,""));var h={};a.j=Oa(lj(lj(f,"manifest"),"item").b,function(c){var d=new Fq,e=b.url;d.id=c.getAttribute("id");d.src=la(c.getAttribute("href"),e);d.f=c.getAttribute("media-type");if(e=c.getAttribute("properties")){for(var e=e.split(/\s+/),f={},g=0;g<e.length;g++)f[e[g]]=!0;d.j=f}(c=c.getAttribute("fallback"))&&!Oq[d.f]&&(h[d.src]=c);!a.J&&d.j.nav&&
(a.J=d);!a.S&&d.j["cover-image"]&&(a.S=d);return d});a.f=Ka(a.j,Gq);a.l=Ka(a.j,function(b){return Qq(a,b.src)});for(var l in h)for(g=l;;){g=a.f[h[g]];if(!g)break;if(Oq[g.f]){a.F[l]=g.src;break}g=g.src}a.b=Oa(lj(lj(f,"spine"),"itemref").b,function(b,c){var d=b.getAttribute("idref");if(d=a.f[d])d.h=b,d.L=c;return d});if(l=Fj(lj(f,"spine"),"toc")[0])a.U=a.f[l];if(l=Fj(lj(f,"spine"),"page-progression-direction")[0]){a:switch(l){case "ltr":l="ltr";break a;case "rtl":l="rtl";break a;default:throw Error("unknown PageProgression: "+
l);}a.G=l}var g=c?Fj(lj(lj(Bj(lj(lj(new mj([c.b]),"encryption"),"EncryptedData"),Aj()),"CipherData"),"CipherReference"),"URI"):[],k=lj(lj(f,"bindings"),"mediaType").b;for(c=0;c<k.length;c++){var m=k[c].getAttribute("handler");(l=k[c].getAttribute("media-type"))&&m&&a.f[m]&&(a.M[l]=a.f[m].src)}a.I=Mq(lj(f,"metadata"),Fj(f,"prefix")[0]);a.I[Jq]&&(a.lang=a.I[Jq][0].v);if(!d){if(0<g.length&&a.w)for(d=Hq(a.w),c=0;c<g.length;c++)a.h.w[a.B+g[c]]=d;return I(!0)}f=new Aa;k={};if(0<g.length&&a.w)for(l="1040:"+
uq(a.w),c=0;c<g.length;c++)k[g[c]]=l;for(c=0;c<d.length;c++){var p=d[c];if(m=p.n){var q=decodeURI(m),g=a.l[q];l=null;g&&(g.u=0!=p.m,g.l=p.c,g.f&&(l=g.f.replace(/\s+/g,"")));g=k[q];if(l||g)f.append(m),f.append(" "),f.append(l||"application/octet-stream"),g&&(f.append(" "),f.append(g)),f.append("\n")}}Rq(a);return Te(e,"","POST",f.toString(),"text/plain")}function Rq(a){for(var b=0,c=0;c<a.b.length;c++){var d=a.b[c],e=Math.ceil(d.l/1024);d.g=b;d.b=e;b+=e}a.D=b}
function Sq(a,b,c){a.f={};a.l={};a.j=[];a.b=a.j;var d=a.g=new kj(null,"",(new DOMParser).parseFromString("<spine></spine>","text/xml"));b.forEach(function(a){var b=new Fq;b.L=a.index;b.id="item"+(a.index+1);b.src=a.url;b.bb=a.bb;b.Qb=a.Qb;var c=d.b.createElement("itemref");c.setAttribute("idref",b.id);d.root.appendChild(c);b.h=c;this.f[b.id]=b;this.l[a.url]=b;this.j.push(b)},a);return c?Eq(a.h,b[0].url,c):I(null)}
function Tq(a,b,c){var d=a.b[b],e=H("getCFI");a.h.load(d.src).then(function(a){var b=qj(a,c),f=null;b&&(a=oj(a,b,0,!1),f=new bb,eb(f,b,c-a),d.h&&eb(f,d.h,0),f=f.toString());L(e,f)});return J(e)}
function Uq(a,b){return Md("resolveFragment",function(c){if(b){var d=new bb;cb(d,b);var e;if(a.g){var f=db(d,a.g.b);if(1!=f.node.nodeType||f.K||!f.vc){L(c,null);return}var g=f.node,h=g.getAttribute("idref");if("itemref"!=g.localName||!h||!a.f[h]){L(c,null);return}e=a.f[h];d=f.vc}else e=a.b[0];a.h.load(e.src).then(function(a){var b=db(d,a.b);a=oj(a,b.node,b.offset,b.K);L(c,{L:e.L,Da:a,X:-1})})}else L(c,null)},function(a,d){u.b(d,"Cannot resolve fragment:",b);L(a,null)})}
function Vq(a,b){return Md("resolveEPage",function(c){if(0>=b)L(c,{L:0,Da:0,X:-1});else{var d=Ia(a.b.length,function(c){c=a.b[c];return c.g+c.b>b}),e=a.b[d];a.h.load(e.src).then(function(a){b-=e.g;b>e.b&&(b=e.b);var f=0;0<b&&(a=pj(a),f=Math.round(a*b/e.b),f==a&&f--);L(c,{L:d,Da:f,X:-1})})}},function(a,d){u.b(d,"Cannot resolve epage:",b);L(a,null)})}
function Wq(a,b){var c=a.b[b.L];if(0>=b.Da)return I(c.g);var d=H("getEPage");a.h.load(c.src).then(function(a){a=pj(a);L(d,c.g+Math.min(a,b.Da)*c.b/a)});return J(d)}function Xq(a,b){return{page:a,position:{L:a.L,X:b,Da:a.offset}}}function Yq(a,b,c,d,e){this.b=a;this.viewport=b;this.j=c;this.u=e;this.Rb=[];this.l=[];this.Z=gb(d);this.h=new Xo(b);this.f=new $m(a.u)}function Zq(a,b){var c=a.Rb[b.L];return c?c.hb[b.X]:null}n=Yq.prototype;
n.yb=function(a){return this.b.G?this.b.G:(a=this.Rb[a?a.L:0])?a.ab.da:null};function $q(a,b,c,d){c.P.style.display="none";c.P.style.visibility="visible";c.P.style.position="";c.P.style.top="";c.P.style.left="";c.P.setAttribute("data-vivliostyle-page-side",c.l);var e=b.hb[d];c.F=!b.item.L&&!d;b.hb[d]=c;e?(b.ab.viewport.f.replaceChild(c.P,e.P),Ra(e,{type:"replaced",target:null,currentTarget:null,te:c})):b.ab.viewport.f.appendChild(c.P);a.u(b.ab.oa,b.item.L,d)}
function ar(a,b,c){var d=H("renderSinglePage"),e=br(a,b,c);hq(b.ab,e,c).then(function(f){var g=(c=f)?c.page-1:b.Na.length-1;$q(a,b,e,g);dn(a.f,e.L,g);f=null;if(c){var h=b.Na[c.page];b.Na[c.page]=c;h&&b.hb[c.page]&&(uk(c,h)||(f=ar(a,b,c)))}f||(f=I(!0));f.then(function(){var b=en(a.f,e),f=0;de(function(c){f++;if(f>b.length)M(c);else{var d=b[f-1];d.Rc=d.Rc.filter(function(a){return!a.wc});d.Rc.length?cr(a,d.L).then(function(b){b?(cn(a.f,d.zd),fn(a.f,d.Rc),ar(a,b,b.Na[d.X]).then(function(b){var d=a.f;
d.b=d.D.pop();d=a.f;d.g=d.G.pop();d=b.rc.position;d.L===e.L&&d.X===g&&(e=b.rc.page);fe(c)})):fe(c)}):fe(c)}}).then(function(){L(d,{rc:Xq(e,g),ue:c})})})});return J(d)}function dr(a,b){var c=a.X,d=-1;0>c&&(d=a.Da,c=Ia(b.Na.length,function(a){return dq(b.ab,b.Na[a],!0)>d}),c=c===b.Na.length?b.complete?b.Na.length-1:Number.POSITIVE_INFINITY:c-1);return{L:a.L,X:c,Da:d}}
function er(a,b,c){var d=H("findPage");cr(a,b.L).then(function(e){if(e){var f=null,g;de(function(d){var h=dr(b,e);g=h.X;(f=e.hb[g])?M(d):e.complete?(g=e.Na.length-1,f=e.hb[g],M(d)):c?fr(a,h).then(function(a){a&&(f=a.page);M(d)}):be(100).then(function(){fe(d)})}).then(function(){L(d,Xq(f,g))})}else L(d,null)});return J(d)}
function fr(a,b){var c=H("renderPage");cr(a,b.L).then(function(d){if(d){var e=dr(b,d),f=e.X,g=e.Da,h=d.hb[f];h?L(c,Xq(h,f)):de(function(b){if(f<d.Na.length)M(b);else if(d.complete)f=d.Na.length-1,M(b);else{var c=d.Na[d.Na.length-1];ar(a,d,c).then(function(e){var k=e.rc.page;(c=e.ue)?0<=g&&dq(d.ab,c)>g?(h=k,f=d.Na.length-2,M(b)):fe(b):(h=k,f=e.rc.position.X,d.complete=!0,k.w=d.item.L===a.b.b.length-1,M(b))})}}).then(function(){h=h||d.hb[f];var b=d.Na[f];h?L(c,Xq(h,f)):ar(a,d,b).then(function(b){b.ue||
(d.complete=!0,b.rc.page.w=d.item.L===a.b.b.length-1);L(c,b.rc)})})}else L(c,null)});return J(c)}n.Ed=function(){return gr(this,{L:this.b.b.length-1,X:Number.POSITIVE_INFINITY,Da:-1})};function gr(a,b){var c=H("renderAllPages");b||(b={L:0,X:0,Da:0});var d=b.L,e=b.X,f=0,g;de(function(c){fr(a,{L:f,X:f===d?e:Number.POSITIVE_INFINITY,Da:f===d?b.Da:-1}).then(function(a){g=a;++f>d?M(c):fe(c)})}).then(function(){L(c,g)});return J(c)}n.Ee=function(){return er(this,{L:0,X:0,Da:-1})};
n.Ge=function(){return er(this,{L:this.b.b.length-1,X:Number.POSITIVE_INFINITY,Da:-1})};n.nextPage=function(a,b){var c=this,d=a.L,e=a.X,f=H("nextPage");cr(c,d).then(function(a){if(a){if(a.complete&&e==a.Na.length-1){if(d>=c.b.b.length-1){L(f,null);return}d++;e=0}else e++;er(c,{L:d,X:e,Da:-1},b).sa(f)}else L(f,null)});return J(f)};n.Cd=function(a){var b=a.L;if(a=a.X)a--;else{if(!b)return I(null);b--;a=Number.POSITIVE_INFINITY}return er(this,{L:b,X:a,Da:-1})};
function hr(a,b,c){b="left"===b.l;a="ltr"===a.yb(c);return!b&&a||b&&!a}function ir(a,b,c){var d=H("getCurrentSpread"),e=Zq(a,b);if(!e)return I({left:null,right:null});var f="left"===e.l;(hr(a,e,b)?a.Cd(b):a.nextPage(b,c)).then(function(a){a=a&&a.page;f?L(d,{left:e,right:a}):L(d,{left:a,right:e})});return J(d)}n.Le=function(a,b){var c=Zq(this,a);if(!c)return I(null);var c=hr(this,c,a),d=this.nextPage(a,!!b);if(c)return d;var e=this;return d.ya(function(a){return a?e.nextPage(a.position,!!b):I(null)})};
n.Oe=function(a){var b=Zq(this,a);if(!b)return I(null);b=hr(this,b,a);a=this.Cd(a);if(b){var c=this;return a.ya(function(a){return a?c.Cd(a.position):I(null)})}return a};function jr(a,b){var c=H("navigateToEPage");Vq(a.b,b).then(function(b){b?er(a,b).sa(c):L(c,null)});return J(c)}function kr(a,b){var c=H("navigateToCFI");Uq(a.b,b).then(function(b){b?er(a,b).sa(c):L(c,null)});return J(c)}
function lr(a,b,c){u.debug("Navigate to",b);var d=Qq(a.b,ia(b));if(!d){if(a.b.g&&b.match(/^#epubcfi\(/))d=Qq(a.b,a.b.g.url);else if("#"===b.charAt(0)){var e=a.b.u.Qe(b);a.b.g?d=Qq(a.b,e[0]):d=e[0];b=d+(e[1]?"#"+e[1]:"")}if(null==d)return I(null)}var f=a.b.l[d];if(!f)return a.b.g&&d==Qq(a.b,a.b.g.url)&&(d=b.indexOf("#"),0<=d)?kr(a,b.substr(d+1)):I(null);var g=H("navigateTo");cr(a,f.L).then(function(d){var e=sj(d.ca,b);e?er(a,{L:f.L,X:-1,Da:nj(d.ca,e)}).sa(g):c.L!==f.L?er(a,{L:f.L,X:0,Da:-1}).sa(g):
L(g,null)});return J(g)}
function br(a,b,c){var d=b.ab.viewport,e=d.b.createElement("div");e.setAttribute("data-vivliostyle-page-container",!0);e.style.position="absolute";e.style.top="0";e.style.left="0";gj||(e.style.visibility="hidden");d.h.appendChild(e);var f=d.b.createElement("div");f.setAttribute("data-vivliostyle-bleed-box",!0);e.appendChild(f);var g=new Lj(e,f);g.L=b.item.L;g.position=c;g.offset=dq(b.ab,c);g.offset||(b=a.b.u.Hd("",b.item.src),f.setAttribute("id",b),Oj(g,f,b));d!==a.viewport&&(a=Jf(null,new Qe(lb(a.viewport.width,
a.viewport.height,d.width,d.height),null)),g.u.push(new Ij(e,"transform",a)));return g}function mr(a,b){var c=Nq();if(c){var d=b.ownerDocument,e=d.createElement("span");b.appendChild(e);d=d.importNode(a,!0);e.appendChild(d);d=c.queue;d.Push(["Typeset",c,e]);var c=H("makeMathJaxView"),f=Wd(c);d.Push(function(){f.Ya(e)});return J(c)}return I(null)}
n.vd=function(a){var b=this;return function(c,d){var e;if("object"==c.localName&&"http://www.w3.org/1999/xhtml"==c.namespaceURI){var f=c.getAttribute("data");e=null;if(f){var f=la(f,a.url),g=c.getAttribute("media-type");if(!g){var h=Qq(b.b,f);h&&(h=b.b.l[h])&&(g=h.f)}if(g&&(h=b.b.M[g])){e=b.viewport.b.createElement("iframe");e.style.border="none";var f=Ea(f),l=Ea(g),g=new Aa;g.append(h);g.append("?src=");g.append(f);g.append("&type=");g.append(l);for(h=c.firstChild;h;h=h.nextSibling)1==h.nodeType&&
(l=h,"param"==l.localName&&"http://www.w3.org/1999/xhtml"==l.namespaceURI&&(f=l.getAttribute("name"),l=l.getAttribute("value"),f&&l&&(g.append("&"),g.append(encodeURIComponent(f)),g.append("="),g.append(encodeURIComponent(l)))));e.setAttribute("src",g.toString());(g=c.getAttribute("width"))&&e.setAttribute("width",g);(g=c.getAttribute("height"))&&e.setAttribute("height",g)}}e||(e=b.viewport.b.createElement("span"),e.setAttribute("data-adapt-process-children","true"));e=I(e)}else if("http://www.w3.org/1998/Math/MathML"==
c.namespaceURI)e=mr(c,d);else if("http://example.com/sse"==c.namespaceURI){e=d?d.ownerDocument:b.viewport.b;g=c.localName;switch(g){case "t":case "tab":case "ec":case "nt":case "fraction":case "comment":case "mark":g="span";break;case "ruby":case "rp":case "rt":break;default:g="div"}e=e.createElement(g);e.setAttribute("data-adapt-process-children","true");e=I(e)}else e=c.dataset&&"true"==c.dataset.mathTypeset?mr(c,d):I(null);return e}};
function cr(a,b){if(b>=a.b.b.length)return I(null);var c=a.Rb[b];if(c)return I(c);var d=H("getPageViewItem"),e=a.l[b];if(e){var f=Wd(d);e.push(f);return J(d)}var e=a.l[b]=[],g=a.b.b[b],h=a.b.h;h.load(g.src).then(function(f){g.b||1!=a.b.b.length||(g.b=Math.ceil(pj(f)/2700),a.b.D=g.b);var k=h.f[f.url],l=a.vd(f),p=a.viewport,q=$p(k,p.width,p.height,p.fontSize);if(q.width!=p.width||q.height!=p.height||q.fontSize!=p.fontSize)p=new Zo(p.window,q.fontSize,p.root,q.width,q.height);q=a.Rb[b-1];null!==g.bb?
q=g.bb-1:(q=q?q.ab.na+q.hb.length:0,null!==g.Qb&&(q+=g.Qb));an(a.f,q);var w=new aq(k,f,a.b.lang,p,a.h,a.j,l,a.b.F,q,a.b.u,a.f);w.Z=a.Z;bq(w).then(function(){c={item:g,ca:f,ab:w,Na:[null],hb:[],complete:!1};a.Rb[b]=c;L(d,c);e.forEach(function(a){a.Ya(c)})})});return J(d)}function nr(a){return a.Rb.some(function(a){return a&&0<a.hb.length})}
n.Tc=function(){var a=this.b,b=a.J||a.U;if(!b)return I(null);var c=H("showTOC");this.g||(this.g=new vq(a.h,b.src,a.lang,this.h,this.j,this.Z,this,a.F,a.u,this.f));var a=this.viewport,b=Math.min(350,Math.round(.67*a.width)-16),d=a.height-6,e=a.b.createElement("div");a.root.appendChild(e);e.style.position="absolute";e.style.visibility="hidden";e.style.left="3px";e.style.top="3px";e.style.width=b+10+"px";e.style.maxHeight=d+"px";e.style.overflow="scroll";e.style.overflowX="hidden";e.style.background=
"#EEE";e.style.border="1px outset #999";e.style.borderRadius="2px";e.style.boxShadow=" 5px 5px rgba(128,128,128,0.3)";this.g.Tc(e,a,b,d,this.viewport.fontSize).then(function(a){e.style.visibility="visible";L(c,a)});return J(c)};n.Nc=function(){this.g&&this.g.Nc()};n.Wd=function(){return this.g&&this.g.Wd()};var or={hf:"singlePage",jf:"spread",Ye:"autoSpread"};
function pr(a,b,c,d){var e=this;this.window=a;this.bd=b;b.setAttribute("data-vivliostyle-viewer-viewport",!0);gj&&b.setAttribute("data-vivliostyle-debug",!0);b.setAttribute("data-vivliostyle-viewer-status","loading");this.Sa=c;this.ta=d;a=a.document;this.na=new tl(a.head,b);this.w="loading";this.J=[];this.h=null;this.zb=this.Ka=!1;this.f=this.j=this.g=this.B=null;this.fontSize=16;this.zoom=1;this.D=!1;this.S="singlePage";this.da=!1;this.Ed=!0;this.Z=fb();this.I=function(){};this.u=function(){};this.U=
function(){e.Ka=!0;e.I()};this.Ad=this.Ad.bind(this);this.F=function(){};this.G=a.getElementById("vivliostyle-page-rules");this.M=!1;this.l=null;this.ma={loadEPUB:this.Be,loadXML:this.Ce,configure:this.Nd,moveTo:this.oa,toc:this.Tc};qr(this)}function qr(a){ha(1,function(a){rr(this,{t:"debug",content:a})}.bind(a));ha(2,function(a){rr(this,{t:"info",content:a})}.bind(a));ha(3,function(a){rr(this,{t:"warn",content:a})}.bind(a));ha(4,function(a){rr(this,{t:"error",content:a})}.bind(a))}
function rr(a,b){b.i=a.Sa;a.ta(b)}function sr(a,b){a.w!==b&&(a.w=b,a.bd.setAttribute("data-vivliostyle-viewer-status",b),rr(a,{t:"readystatechange"}))}n=pr.prototype;
n.Be=function(a){tr.f("beforeRender");sr(this,"loading");var b=a.url,c=a.fragment,d=!!a.zipmeta,e=a.authorStyleSheet,f=a.userStyleSheet;this.viewport=null;var g=H("loadEPUB"),h=this;h.Nd(a).then(function(){var a=new yq;pq(a,e,f).then(function(){var e=la(b,h.window.location.href);h.J=[e];Aq(a,e,d).then(function(a){h.h=a;ur(h,c).then(function(){L(g,!0)})})})});return J(g)};
n.Ce=function(a){tr.f("beforeRender");sr(this,"loading");var b=a.url,c=a.document,d=a.fragment,e=a.authorStyleSheet,f=a.userStyleSheet;this.viewport=null;var g=H("loadXML"),h=this;h.Nd(a).then(function(){var a=new yq;pq(a,e,f).then(function(){var e=b.map(function(a,b){return{url:la(a.url,h.window.location.href),index:b,bb:a.bb,Qb:a.Qb}});h.J=e.map(function(a){return a.url});h.h=new Cq(a,"");Sq(h.h,e,c).then(function(){ur(h,d).then(function(){L(g,!0)})})})});return J(g)};
function ur(a,b){vr(a);var c;b?c=Uq(a.h,b).ya(function(b){a.f=b;return I(!0)}):c=I(!0);return c.ya(function(){tr.b("beforeRender");return wr(a)})}function xr(a,b){var c=parseFloat(b),d=/[a-z]+$/,e;if("string"===typeof b&&(e=b.match(d))){d=e[0];if("em"===d||"rem"===d)return c*a.fontSize;if("ex"===d||"rex"===d)return c*wb.ex*a.fontSize/wb.em;if(d=wb[d])return c*d}return c}
n.Nd=function(a){"boolean"==typeof a.autoresize&&(a.autoresize?(this.B=null,this.window.addEventListener("resize",this.U,!1),this.Ka=!0):this.window.removeEventListener("resize",this.U,!1));if("number"==typeof a.fontSize){var b=a.fontSize;5<=b&&72>=b&&this.fontSize!=b&&(this.fontSize=b,this.Ka=!0)}"object"==typeof a.viewport&&a.viewport&&(b=a.viewport,b={marginLeft:xr(this,b["margin-left"])||0,marginRight:xr(this,b["margin-right"])||0,marginTop:xr(this,b["margin-top"])||0,marginBottom:xr(this,b["margin-bottom"])||
0,width:xr(this,b.width)||0,height:xr(this,b.height)||0},200<=b.width||200<=b.height)&&(this.window.removeEventListener("resize",this.U,!1),this.B=b,this.Ka=!0);"boolean"==typeof a.hyphenate&&(this.Z.pd=a.hyphenate,this.Ka=!0);"boolean"==typeof a.horizontal&&(this.Z.od=a.horizontal,this.Ka=!0);"boolean"==typeof a.nightMode&&(this.Z.wd=a.nightMode,this.Ka=!0);"number"==typeof a.lineHeight&&(this.Z.lineHeight=a.lineHeight,this.Ka=!0);"number"==typeof a.columnWidth&&(this.Z.kd=a.columnWidth,this.Ka=
!0);"string"==typeof a.fontFamily&&(this.Z.fontFamily=a.fontFamily,this.Ka=!0);"boolean"==typeof a.load&&(this.da=a.load);"boolean"==typeof a.renderAllPages&&(this.Ed=a.renderAllPages);"string"==typeof a.userAgentRootURL&&(ja=a.userAgentRootURL.replace(/resources\/?$/,""),ka=a.userAgentRootURL);"string"==typeof a.rootURL&&(ja=a.rootURL,ka=ja+"resources/");"string"==typeof a.pageViewMode&&a.pageViewMode!==this.S&&(this.S=a.pageViewMode,this.Ka=!0);"number"==typeof a.pageBorder&&a.pageBorder!==this.Z.ac&&
(this.viewport=null,this.Z.ac=a.pageBorder,this.Ka=!0);"number"==typeof a.zoom&&a.zoom!==this.zoom&&(this.zoom=a.zoom,this.zb=!0);"boolean"==typeof a.fitToScreen&&a.fitToScreen!==this.D&&(this.D=a.fitToScreen,this.zb=!0);yr(this,a);return I(!0)};function yr(a,b){(Ed.CONFIGURATION||[]).forEach(function(a){a=a(b);this.Ka=a.Ka||this.Ka;this.zb=a.zb||this.zb}.bind(a))}n.Ad=function(a){var b=this.g,c=this.j,d=a.target;c?c.left!==d&&c.right!==d||zr(this,a.te):b===a.target&&zr(this,a.te)};
function Ar(a,b){var c=[];a.g&&c.push(a.g);a.j&&(c.push(a.j.left),c.push(a.j.right));c.forEach(function(a){a&&b(a)})}function Br(a){Ar(a,function(a){a.removeEventListener("hyperlink",this.F,!1);a.removeEventListener("replaced",this.Ad,!1)}.bind(a))}function Cr(a){Br(a);Ar(a,function(a){v(a.P,"display","none")});a.g=null;a.j=null}function Dr(a,b){b.addEventListener("hyperlink",a.F,!1);b.addEventListener("replaced",a.Ad,!1);v(b.P,"visibility","visible");v(b.P,"display","block")}
function Er(a,b){Cr(a);a.g=b;Dr(a,b)}function Fr(a){var b=H("reportPosition");Tq(a.h,a.f.L,a.f.Da).then(function(c){var d=a.g;(a.da&&0<d.j.length?ie(d.j):I(!0)).then(function(){Gr(a,d,c).sa(b)})});return J(b)}function Hr(a){var b=a.bd;if(a.B){var c=a.B;b.style.marginLeft=c.marginLeft+"px";b.style.marginRight=c.marginRight+"px";b.style.marginTop=c.marginTop+"px";b.style.marginBottom=c.marginBottom+"px";return new Zo(a.window,a.fontSize,b,c.width,c.height)}return new Zo(a.window,a.fontSize,b)}
function Ir(a){var b=Hr(a),c;a:switch(a.S){case "singlePage":c=!1;break a;case "spread":c=!0;break a;default:c=1.45<=b.width/b.height&&800<b.width}var d=a.Z.jb!==c;a.Z.jb=c;a.bd.setAttribute("data-vivliostyle-spread-view",c);if(a.B||!a.viewport||a.viewport.fontSize!=a.fontSize)return!1;if(!d&&b.width==a.viewport.width&&b.height==a.viewport.height)return!0;if(d=a.b&&nr(a.b)){a:{d=a.b.Rb;for(c=0;c<d.length;c++){var e=d[c];if(e)for(var e=e.hb,f=0;f<e.length;f++){var g=e[f];if(g.D&&g.B){d=!0;break a}}}d=
!1}d=!d}return d?(a.viewport.width=b.width,a.viewport.height=b.height,a.zb=!0):!1}n.Re=function(a,b,c){if(!this.M&&this.G&&!b&&!c){var d="";Object.keys(a).forEach(function(b){d+="@page "+b+"{size:";b=a[b];d+=b.width+"px "+b.height+"px;}"});this.G.textContent=d;this.M=!0}};
function Jr(a){if(a.b){a.b.Nc();for(var b=a.b,c=b.Rb,d=0;d<c.length;d++){var e=c[d];e&&e.hb.splice(0)}for(b=b.viewport.root;b.lastChild;)b.removeChild(b.lastChild)}a.G&&(a.G.textContent="",a.M=!1);a.viewport=Hr(a);b=a.viewport;v(b.g,"width","");v(b.g,"height","");v(b.f,"width","");v(b.f,"height","");v(b.f,"transform","");a.b=new Yq(a.h,a.viewport,a.na,a.Z,a.Re.bind(a))}
function zr(a,b,c){a.zb=!1;Br(a);if(a.Z.jb)return ir(a.b,a.f,c).ya(function(c){Cr(a);a.j=c;c.left&&(Dr(a,c.left),c.right||c.left.P.setAttribute("data-vivliostyle-unpaired-page",!0));c.right&&(Dr(a,c.right),c.left||c.right.P.setAttribute("data-vivliostyle-unpaired-page",!0));c=Kr(a,c);a.viewport.zoom(c.width,c.height,a.D?Lr(a,c):a.zoom);a.g=b;return I(null)});Er(a,b);a.viewport.zoom(b.f.width,b.f.height,a.D?Lr(a,b.f):a.zoom);a.g=b;return I(null)}
function Kr(a,b){var c=0,d=0;b.left&&(c+=b.left.f.width,d=b.left.f.height);b.right&&(c+=b.right.f.width,d=Math.max(d,b.right.f.height));b.left&&b.right&&(c+=2*a.Z.ac);return{width:c,height:d}}var Mr={cf:"fit inside viewport"};function Lr(a,b){return Math.min(a.viewport.width/b.width,a.viewport.height/b.height)}function Nr(){this.name="RenderingCanceledError";this.message="Page rendering has been canceled";this.stack=Error().stack}t(Nr,Error);
function vr(a){if(a.l){var b=a.l;Nd(b,new Nr);if(b!==Hd&&b.b){b.b.h=!0;var c=new Xd(b);b.u="interrupt";b.b=c;b.f.Ya(c)}}a.l=null}
function wr(a){a.Ka=!1;a.zb=!1;if(Ir(a))return I(!0);sr(a,"loading");vr(a);var b=Pd(Hd.f,function(){return Md("resize",function(c){a.l=b;tr.f("render (resize)");Jr(a);a.f&&(a.f.X=-1);gr(a.b,a.f).then(function(d){a.f=d.position;zr(a,d.page,!0).then(function(){Fr(a).then(function(d){sr(a,"interactive");(a.Ed?a.b.Ed():I(null)).then(function(){a.l===b&&(a.l=null);tr.b("render (resize)");sr(a,"complete");rr(a,{t:"loaded"});L(c,d)})})})})},function(a,b){if(b instanceof Nr)tr.b("render (resize)"),u.debug(b.message);
else throw b;})});return I(!0)}function Gr(a,b,c){var d=H("sendLocationNotification"),e={t:"nav",first:b.F,last:b.w};Wq(a.h,a.f).then(function(b){e.epage=b;e.epageCount=a.h.D;c&&(e.cfi=c);rr(a,e);L(d,!0)});return J(d)}pr.prototype.yb=function(){return this.b?this.b.yb(this.f):null};
pr.prototype.oa=function(a){var b=this;"complete"!==this.w&&sr(this,"loading");if("string"==typeof a.where){switch(a.where){case "next":a=this.Z.jb?this.b.Le:this.b.nextPage;break;case "previous":a=this.Z.jb?this.b.Oe:this.b.Cd;break;case "last":a=this.b.Ge;break;case "first":a=this.b.Ee;break;default:return I(!0)}if(a){var c=a;a=function(){return c.call(b.b,b.f)}}}else if("number"==typeof a.epage){var d=a.epage;a=function(){return jr(b.b,d)}}else if("string"==typeof a.url){var e=a.url;a=function(){return lr(b.b,
e,b.f)}}else return I(!0);var f=H("moveTo");a.call(b.b).then(function(a){var c;if(a){b.f=a.position;var d=H("moveTo.showCurrent");c=J(d);zr(b,a.page).then(function(){Fr(b).sa(d)})}else c=I(!0);c.then(function(a){"loading"===b.w&&sr(b,"interactive");L(f,a)})});return J(f)};
pr.prototype.Tc=function(a){var b=!!a.autohide;a=a.v;var c=this.b.Wd();if(c){if("show"==a)return I(!0)}else if("hide"==a)return I(!0);if(c)return this.b.Nc(),I(!0);var d=this,e=H("showTOC");this.b.Tc(b).then(function(a){if(a){if(b){var c=function(){d.b.Nc()};a.addEventListener("hyperlink",c,!1);a.P.addEventListener("click",c,!1)}a.addEventListener("hyperlink",d.F,!1)}L(e,!0)});return J(e)};
function Or(a,b){var c=b.a||"";return Md("runCommand",function(d){var e=a.ma[c];e?e.call(a,b).then(function(){rr(a,{t:"done",a:c});L(d,!0)}):(u.error("No such action:",c),L(d,!0))},function(a,b){u.error(b,"Error during action:",c);L(a,!0)})}function Pr(a){return"string"==typeof a?JSON.parse(a):a}
function Qr(a,b){var c=Pr(b),d=null;Od(function(){var b=H("commandLoop"),f=Hd.f;a.F=function(b){var c="#"===b.href.charAt(0)||a.J.some(function(a){return b.href.substr(0,a.length)==a});if(c){b.preventDefault();var d={t:"hyperlink",href:b.href,internal:c};Pd(f,function(){rr(a,d);return I(!0)})}};de(function(b){if(a.Ka)wr(a).then(function(){fe(b)});else if(a.zb)a.g&&zr(a,a.g).then(function(){fe(b)});else if(c){var e=c;c=null;Or(a,e).then(function(){fe(b)})}else e=H("waitForCommand"),d=Wd(e,self),J(e).then(function(){fe(b)})}).sa(b);
return J(b)});a.I=function(){var a=d;a&&(d=null,a.Ya())};a.u=function(b){if(c)return!1;c=Pr(b);a.I();return!0};a.window.adapt_command=a.u};function Ro(a,b,c){if(a==b)return a?[[0,a]]:[];if(0>c||a.length<c)c=null;var d=Rr(a,b),e=a.substring(0,d);a=a.substring(d);b=b.substring(d);var d=Sr(a,b),f=a.substring(a.length-d);a=a.substring(0,a.length-d);b=b.substring(0,b.length-d);a=Tr(a,b);e&&a.unshift([0,e]);f&&a.push([0,f]);Ur(a);null!=c&&(a=Vr(a,c));return a}
function Tr(a,b){var c;if(!a)return[[1,b]];if(!b)return[[-1,a]];c=a.length>b.length?a:b;var d=a.length>b.length?b:a,e=c.indexOf(d);if(-1!=e)return c=[[1,c.substring(0,e)],[0,d],[1,c.substring(e+d.length)]],a.length>b.length&&(c[0][0]=c[2][0]=-1),c;if(1==d.length)return[[-1,a],[1,b]];var f=Wr(a,b);if(f)return d=f[1],e=f[3],c=f[4],f=Ro(f[0],f[2]),d=Ro(d,e),f.concat([[0,c]],d);a:{c=a.length;for(var d=b.length,e=Math.ceil((c+d)/2),f=2*e,g=Array(f),h=Array(f),l=0;l<f;l++)g[l]=-1,h[l]=-1;g[e+1]=0;h[e+1]=
0;for(var l=c-d,k=!!(l%2),m=0,p=0,q=0,w=0,r=0;r<e;r++){for(var x=-r+m;x<=r-p;x+=2){var B=e+x,G;G=x==-r||x!=r&&g[B-1]<g[B+1]?g[B+1]:g[B-1]+1;for(var R=G-x;G<c&&R<d&&a.charAt(G)==b.charAt(R);)G++,R++;g[B]=G;if(G>c)p+=2;else if(R>d)m+=2;else if(k&&(B=e+l-x,0<=B&&B<f&&-1!=h[B])){var P=c-h[B];if(G>=P){c=Xr(a,b,G,R);break a}}}for(x=-r+q;x<=r-w;x+=2){B=e+x;P=x==-r||x!=r&&h[B-1]<h[B+1]?h[B+1]:h[B-1]+1;for(G=P-x;P<c&&G<d&&a.charAt(c-P-1)==b.charAt(d-G-1);)P++,G++;h[B]=P;if(P>c)w+=2;else if(G>d)q+=2;else if(!k&&
(B=e+l-x,0<=B&&B<f&&-1!=g[B]&&(G=g[B],R=e+G-B,P=c-P,G>=P))){c=Xr(a,b,G,R);break a}}}c=[[-1,a],[1,b]]}return c}function Xr(a,b,c,d){var e=a.substring(c),f=b.substring(d);a=Ro(a.substring(0,c),b.substring(0,d));e=Ro(e,f);return a.concat(e)}function Rr(a,b){if(!a||!b||a.charAt(0)!=b.charAt(0))return 0;for(var c=0,d=Math.min(a.length,b.length),e=d,f=0;c<e;)a.substring(f,e)==b.substring(f,e)?f=c=e:d=e,e=Math.floor((d-c)/2+c);return e}
function Sr(a,b){if(!a||!b||a.charAt(a.length-1)!=b.charAt(b.length-1))return 0;for(var c=0,d=Math.min(a.length,b.length),e=d,f=0;c<e;)a.substring(a.length-e,a.length-f)==b.substring(b.length-e,b.length-f)?f=c=e:d=e,e=Math.floor((d-c)/2+c);return e}
function Wr(a,b){function c(a,b,c){for(var d=a.substring(c,c+Math.floor(a.length/4)),e=-1,f="",g,h,k,l;-1!=(e=b.indexOf(d,e+1));){var m=Rr(a.substring(c),b.substring(e)),P=Sr(a.substring(0,c),b.substring(0,e));f.length<P+m&&(f=b.substring(e-P,e)+b.substring(e,e+m),g=a.substring(0,c-P),h=a.substring(c+m),k=b.substring(0,e-P),l=b.substring(e+m))}return 2*f.length>=a.length?[g,h,k,l,f]:null}var d=a.length>b.length?a:b,e=a.length>b.length?b:a;if(4>d.length||2*e.length<d.length)return null;var f=c(d,e,
Math.ceil(d.length/4)),d=c(d,e,Math.ceil(d.length/2)),g;if(f||d)d?g=f?f[4].length>d[4].length?f:d:d:g=f;else return null;var h;a.length>b.length?(f=g[0],d=g[1],e=g[2],h=g[3]):(e=g[0],h=g[1],f=g[2],d=g[3]);return[f,d,e,h,g[4]]}
function Ur(a){a.push([0,""]);for(var b=0,c=0,d=0,e="",f="",g;b<a.length;)switch(a[b][0]){case 1:d++;f+=a[b][1];b++;break;case -1:c++;e+=a[b][1];b++;break;case 0:if(1<c+d){if(c&&d){if(g=Rr(f,e))0<b-c-d&&0==a[b-c-d-1][0]?a[b-c-d-1][1]+=f.substring(0,g):(a.splice(0,0,[0,f.substring(0,g)]),b++),f=f.substring(g),e=e.substring(g);if(g=Sr(f,e))a[b][1]=f.substring(f.length-g)+a[b][1],f=f.substring(0,f.length-g),e=e.substring(0,e.length-g)}c?d?a.splice(b-c-d,c+d,[-1,e],[1,f]):a.splice(b-c,c+d,[-1,e]):a.splice(b-
d,c+d,[1,f]);b=b-c-d+(c?1:0)+(d?1:0)+1}else b&&0==a[b-1][0]?(a[b-1][1]+=a[b][1],a.splice(b,1)):b++;c=d=0;f=e=""}""===a[a.length-1][1]&&a.pop();c=!1;for(b=1;b<a.length-1;)0==a[b-1][0]&&0==a[b+1][0]&&(a[b][1].substring(a[b][1].length-a[b-1][1].length)==a[b-1][1]?(a[b][1]=a[b-1][1]+a[b][1].substring(0,a[b][1].length-a[b-1][1].length),a[b+1][1]=a[b-1][1]+a[b+1][1],a.splice(b-1,1),c=!0):a[b][1].substring(0,a[b+1][1].length)==a[b+1][1]&&(a[b-1][1]+=a[b+1][1],a[b][1]=a[b][1].substring(a[b+1][1].length)+
a[b+1][1],a.splice(b+1,1),c=!0)),b++;c&&Ur(a)}Ro.f=1;Ro.b=-1;Ro.g=0;
function Vr(a,b){var c;a:{var d=a;if(0===b)c=[0,d];else{var e=0;for(c=0;c<d.length;c++){var f=d[c];if(-1===f[0]||0===f[0]){var g=e+f[1].length;if(b===g){c=[c+1,d];break a}if(b<g){d=d.slice();g=b-e;e=[f[0],f[1].slice(0,g)];f=[f[0],f[1].slice(g)];d.splice(c,1,e,f);c=[c+1,d];break a}e=g}}throw Error("cursor_pos is out of bounds!");}}d=c[1];c=c[0];e=d[c];f=d[c+1];return null==e||0!==e[0]?a:null!=f&&e[1]+f[1]===f[1]+e[1]?(d.splice(c,2,f,e),Yr(d,c,2)):null!=f&&0===f[1].indexOf(e[1])?(d.splice(c,2,[f[0],
e[1]],[0,e[1]]),e=f[1].slice(e[1].length),0<e.length&&d.splice(c+2,0,[f[0],e]),Yr(d,c,3)):a}function Yr(a,b,c){for(c=b+c-1;0<=c&&c>=b-1;c--)if(c+1<a.length){var d=a[c],e=a[c+1];d[0]===e[1]&&a.splice(c,2,[d[0],d[1]+e[1]])}return a};function Qo(a){return a.reduce(function(a,c){return c[0]===Ro.b?a:a+c[1]},"")}function kk(a,b,c){var d=0,e=0;a.some(function(a){for(var f=0;f<a[1].length;f++){switch(a[0]*c){case Ro.f:d++;break;case Ro.b:d--;e++;break;case Ro.g:e++}if(e>b)return!0}return!1});return Math.max(Math.min(b,e-1)+d,0)};function Zr(){}Zr.prototype.le=function(a){return{A:a,Hc:!1,vb:!1}};Zr.prototype.we=function(){};Zr.prototype.$d=function(){};Zr.prototype.jc=function(){};function $r(a,b){this.b=a;this.f=b}
function as(a,b){var c=a.b,d=c.le(b),e=H("LayoutIterator");de(function(a){for(var b;d.A;){b=d.A.C?1!==d.A.C.nodeType?Sj(d.A.C,d.A.Hb)?void 0:d.A.K?void 0:c.we(d):d.A.Ca?void 0:d.A.K?c.jc(d):c.$d(d):void 0;b=(b&&b.va()?b:I(!0)).ya(function(){return d.vb?I(null):Rl(this.f,d.A,d.Hc)}.bind(this));if(b.va()){b.then(function(b){d.vb?M(a):(d.A=b,fe(a))});return}if(d.vb){M(a);return}d.A=b.get()}M(a)}.bind(a)).then(function(){L(e,d.A)});return J(e)}function bs(a){this.Pc=a}t(bs,Zr);n=bs.prototype;n.xe=function(){};
n.fe=function(){};n.le=function(a){return{A:a,Hc:!!this.Pc&&a.K,vb:!1,Pc:this.Pc,lc:null,xd:!1,pe:[],oe:null}};n.we=function(a){a.xd=!1};n.$d=function(a){a.pe.push(dk(a.A));a.lc=Qk(a.lc,a.A.h);a.xd=!0;return this.xe(a)};n.jc=function(a){var b;a.xd?(b=(b=void 0,I(!0)),b=b.ya(function(){a.vb||(a.pe=[],a.Pc=!1,a.Hc=!1,a.lc=null);return I(!0)})):b=(b=this.fe(a))&&b.va()?b:I(!0);return b.ya(function(){a.vb||(a.xd=!1,a.oe=dk(a.A),a.lc=Qk(a.lc,a.A.G));return I(!0)})};
function cs(a,b){this.f=[];this.b=Object.create(a);this.b.element=b;this.b.f=a.f.clone();this.b.u=!1;var c=this;this.b.Rd=function(a){return Kl.prototype.Rd.call(this,a).ya(function(a){c.f.push(dk(a));return I(a)})}}cs.prototype.Ob=function(a){var b=this.b.Ob();if(a){a=b.Jc?b.Jc.b():Number.MAX_VALUE;var c=this.f[0],c=new Gl(dk(c),null,c.f,0),d=c.f(this.b,a);if(d&&c.b()<a)return{Jc:c,A:d}}return b};function ds(a,b){this.g(a,"end",b)}function es(a,b){this.g(a,"start",b)}function fs(a,b,c){c||(c=this.j.now());var d=this.h[a];d||(d=this.h[a]=[]);var e;for(a=d.length-1;0<=a&&(!(e=d[a])||e[b]);a--)e=null;e||(e={},d.push(e));e[b]=c}function gs(){}function hs(a){this.j=a;this.h={};this.registerEndTiming=this.b=this.registerStartTiming=this.f=this.g=gs}
hs.prototype.l=function(){var a=this.h,b="";Object.keys(a).forEach(function(c){for(var d=a[c],e=d.length,f=0;f<e;f++){var g=d[f];b+=c;1<e&&(b+="("+f+")");b+=" => start: "+g.start+", end: "+g.end+", duration: "+(g.end-g.start)+"\n"}});u.g(b)};hs.prototype.u=function(){this.registerEndTiming=this.b=this.registerStartTiming=this.f=this.g=gs};hs.prototype.w=function(){this.g=fs;this.registerStartTiming=this.f=es;this.registerEndTiming=this.b=ds};
var is={now:Date.now},tr,js=tr=new hs(window&&window.performance||is);fs.call(js,"load_vivliostyle","start",void 0);ba("vivliostyle.profile.profiler",js);hs.prototype.printTimings=hs.prototype.l;hs.prototype.disable=hs.prototype.u;hs.prototype.enable=hs.prototype.w;function ks(a,b){this.rowIndex=a;this.V=b;this.b=[]}function ls(a){return Math.min.apply(null,a.b.map(function(a){return a.height}))}function ms(a,b,c){this.rowIndex=a;this.h=b;this.g=c;this.b=c.colSpan||1;this.rowSpan=c.rowSpan||1;this.height=0;this.f=null}function ns(a,b,c){this.rowIndex=a;this.b=b;this.mc=c}function os(a,b,c){this.f=c;this.b=new cs(a,b);this.g=!1}os.prototype.Ob=function(){return this.b.Ob(!0)};function ps(a,b){this.C=a;this.b=b}
function Jm(a,b,c,d){Gl.call(this,a,b,c,d);this.R=a.R;this.h=null}t(Jm,Gl);Jm.prototype.f=function(a,b){var c=Gl.prototype.f.call(this,a,b);return b<this.b()?null:qs(this).every(function(a){return!!a.A})?c:null};Jm.prototype.b=function(){var a=Gl.prototype.b.call(this);qs(this).forEach(function(b){a+=b.Jc.b()});return a};function qs(a){if(!a.h){var b=a.R,c=rs(b,a.position.V);a.h=ss(b,c).map(b.u,b).map(function(a){return a.Ob()})}return a.h}
function ts(a,b,c){this.rowIndex=a;this.h=b;this.R=c;this.g=null}ts.prototype.f=function(a,b){return b<this.b()?null:us(this).every(function(a){return!!a.A})?this.h:null};ts.prototype.b=function(){var a=this.R,b=0;vs(a,a.b[this.rowIndex])||(b+=10);us(this).forEach(function(a){b+=a.Jc.b()});return b};function us(a){if(!a.g){var b=a.R;a.g=ws(b,a.rowIndex).map(b.u,b).map(function(a){return a.Ob()})}return a.g}
function xs(a){this.B=a;this.h=this.G=!1;this.l=-1;this.J=0;this.D=[];this.F=this.j=null;this.M=0;this.b=[];this.I=[];this.g=[];this.w=null;this.f=[]}function Io(a,b,c){if(!c)return c;switch(b.display){case "table-row":return!a.f.length;case "table-cell":return!a.f.some(function(a){return a.Md.ja[0].node===b.V});default:return c}}function ys(a,b){do if(b.V===a.B)return b.C;while(b=b.parent);return null}function zs(a,b){var c=a.I[b];c||(c=a.I[b]=[]);return c}
function rs(a,b){return a.b.findIndex(function(a){return b===a.V})}function As(a,b,c,d){var e=a.g[b];e||(e=a.g[b]=[]);e[c]=d}function ws(a,b){return zs(a,b).reduce(function(a,b){return b.mc!==a[a.length-1]?a.concat(b.mc):a},[])}function ss(a,b){return ws(a,b).filter(function(a){return a.rowIndex+a.rowSpan-1>b})}xs.prototype.u=function(a){return this.g[a.rowIndex][a.h]};function vs(a,b){return ls(b)>a.J/2}
function Bs(a){0>a.l&&(a.l=Math.max.apply(null,a.b.map(function(a){return a.b.reduce(function(a,b){return a+b.b},0)})));return a.l}function Cs(a,b){a.b.forEach(function(a){a.b.forEach(function(a){var c=Qj(b,a.g);a.g=null;a.height=this.h?c.width:c.height},this)},a)}function Ds(a,b){this.R=a;this.g=b;this.rowIndex=-1;this.b=0;this.f=!1}t(Ds,Zr);
Ds.prototype.$d=function(a){var b=this.R;a=a.A;switch(a.display){case "table":b.M=a.da;break;case "table-caption":b.D.push(new ps(a.C,a.U));break;case "table-row":this.f=!0,this.rowIndex++,this.b=0,b.b[this.rowIndex]=new ks(this.rowIndex,a.V)}return I(!0)};
Ds.prototype.jc=function(a){var b=this.R,c=a.A,d=c.display,e=this.g.h;if(c.V===b.B)c=$l(e,ys(b,c)),b.J=parseFloat(c[b.h?"height":"width"]),a.vb=!0;else switch(d){case "table-row":b.w=c.C;this.f=!1;break;case "table-cell":this.f||(this.rowIndex++,this.b=0,this.f=!0);a=this.rowIndex;c=new ms(this.rowIndex,this.b,c.C);d=b.b[a];d||(b.b[a]=new ks(a,null),d=b.b[a]);d.b.push(c);for(var d=a+c.rowSpan,e=zs(b,a),f=0;e[f];)f++;for(;a<d;a++)for(var e=zs(b,a),g=f;g<f+c.b;g++){var h=e[g]=new ns(a,g,c);c.f||(c.f=
h)}this.b++}};function Es(a,b){this.Pc=!0;this.R=a;this.f=b;this.h=!1;this.b=-1;this.g=0;this.j=b.u;b.u=!1}t(Es,bs);var Fs={"table-caption":!0,"table-column-group":!0,"table-column":!0};function Gs(a,b){for(var c=a.R.F,d=0,e=0;e<b.b;e++)d+=c[b.f.b+e];return d+=a.R.M*(b.b-1)}
function Hs(a,b,c,d){var e=b.rowIndex,f=b.h,g=c.C,h=c.J;1<b.b&&(v(g,"box-sizing","border-box"),v(g,a.R.h?"height":"width",Gs(a,b)+"px"));b=g.ownerDocument.createElement("div");g.appendChild(b);c=new os(a.f,b,c);As(a.R,e,f,c);1===d.Oa.ja.length&&d.Oa.K&&(c.g=!0);return im(c.b.b,d,!0).ya(function(){"baseline"!==h&&"top"!==h&&v(g,"vertical-align","top");return I(!0)})}function Is(a,b){var c=a.R.f[0];return c?c.mc.f.b===b:!1}
function Js(a){var b=a.R.f;if(!b.length)return[];var c=[],d=0;do{var e=b[d],f=e.mc.rowIndex;if(f<a.b){var g=c[f];g||(g=c[f]=[]);g.push(e);b.splice(d,1)}else d++}while(d<b.length);return c}
function Ks(a,b){var c=a.R,d=Js(a),e=d.reduce(function(a){return a+1},0);if(0===e)return I(!0);var f=a.f.f,g=b.A;g.C.parentNode.removeChild(g.C);var h=H("layoutRowSpanningCellsFromPreviousFragment"),l=I(!0),k=0,m=[];d.forEach(function(a){l=l.ya(function(){var b=bk(a[0].Md.ja[1],g.parent);return Ml(f,b,!1).ya(function(){function d(a){for(;h<a;){if(!(0<=m.indexOf(h))){var c=b.C.ownerDocument.createElement("td");v(c,"padding","0");b.C.appendChild(c)}h++}}var g=I(!0),h=0;a.forEach(function(a){g=g.ya(function(){var c=
a.mc;d(c.f.b);var g=a.Md,l=bk(g.ja[0],b);l.ga=g.ga;l.K=g.K;return Ml(f,l,!1).ya(function(){for(var b=a.ee,d=0;d<c.b;d++)m.push(h+d);h+=c.b;return Hs(this,c,l,b).ya(function(){l.C.rowSpan=c.rowIndex+c.rowSpan-this.b+e-k;return I(!0)}.bind(this))}.bind(this))}.bind(this))},this);return g.ya(function(){d(Bs(c));k++;return I(!0)})}.bind(this))}.bind(this))},a);l.then(function(){Ml(f,g,!0,b.Hc).then(function(){L(h,!0)})});return J(h)}
function Ls(a,b){var c=b.A,d=a.R;0>a.b?a.b=rs(d,c.V):a.b++;a.g=0;a.h=!0;return Ks(a,b).ya(function(){Im(this.f,b.oe,null,b.lc)&&!ss(d,this.b-1).length&&(this.f.u=this.j,c.f=!0,b.vb=!0);return I(!0)}.bind(a))}
function Ms(a,b){var c=b.A;a.h||(0>a.b?a.b=0:a.b++,a.g=0,a.h=!0);var d=a.R.b[a.b].b[a.g],e=dk(c).modify();e.K=!0;b.A=e;var f=H("startTableCell");Is(a,d.f.b)?(e=a.R.f.shift(),e=I(e.ee)):e=Rl(a.f.f,c,b.Hc).ya(function(a){a.C&&c.C.removeChild(a.C);return I(new ok(Zj(a)))});e.then(function(a){Hs(this,d,c,a).then(function(){this.jc(b);this.g++;L(f,!0)}.bind(this))}.bind(a));return J(f)}Es.prototype.xe=function(a){var b=a.A.display;return"table-row"===b?Ls(this,a):"table-cell"===b?Ms(this,a):I(!0)};
Es.prototype.fe=function(a){a=a.A;"table-row"===a.display&&(this.h=!1,a=dk(a).modify(),a.K=!1,this.f.I.push(new ts(this.b,a,this.R)));return I(!0)};Es.prototype.jc=function(a){var b=a.A,c=b.display;if(c&&Fs[c])b.C.parentNode.removeChild(b.C);else if(b.V===this.R.B)b=a.A=b.modify(),b.R=null,this.f.u=this.j,a.vb=!0;else return bs.prototype.jc.call(this,a);return I(!0)};
function Ns(a,b,c,d){for(var e=a.ownerDocument,f=e.createElement("tr"),g=[],h=0;h<b;h++){var l=e.createElement("td");f.appendChild(l);g.push(l)}a.parentNode.insertBefore(f,a.nextSibling);b=g.map(function(a){a=Qj(d,a);return c?a.height:a.width});a.parentNode.removeChild(f);return b}function Os(a){var b=[];a=a.firstElementChild;do"colgroup"===a.localName&&b.push(a);while(a=a.nextElementSibling);return b}
function Ps(a){var b=[];a.forEach(function(a){var c=a.span;a.removeAttribute("span");for(var e=a.firstElementChild;e;){if("col"===e.localName){var f=e.span;e.removeAttribute("span");for(c-=f;1<f--;){var g=e.cloneNode(!0);a.insertBefore(g,e);b.push(g)}b.push(e)}e=e.nextElementSibling}for(;0<c--;)e=a.ownerDocument.createElement("col"),a.appendChild(e),b.push(e)});return b}
function Qs(a,b,c,d){if(a.length<c){var e=d.ownerDocument.createElement("colgroup");b.push(e);for(b=a.length;b<c;b++){var f=d.ownerDocument.createElement("col");e.appendChild(f);a.push(f)}}}function Rs(a,b,c){var d=a.h,e=a.w;if(e){a.w=null;var f=e.ownerDocument.createDocumentFragment(),g=Bs(a);if(0<g){var h=a.F=Ns(e,g,d,c.h);c=Os(b);e=Ps(c);Qs(e,c,g,b);e.forEach(function(a,b){v(a,d?"height":"width",h[b]+"px")});c.forEach(function(a){f.appendChild(a.cloneNode(!0))})}a.j=f}}
function Ss(a,b,c){var d=b.R;d.h=b.b;var e=H("TableLayoutProcessor.doInitialLayout");as(new $r(new Ds(b.R,c),c.f),b).then(function(a){var b=a.C,f=Qj(c.h,b);Hl(c,c.b?f.left:f.bottom)?(Rs(d,b,c),Cs(d,c.h),L(e,null)):(a=a.modify(),a.R=null,L(e,a))}.bind(a));return J(e)}function Ts(a,b,c){var d=a.D;d.forEach(function(a,f){a&&(b.insertBefore(a.C,c),"top"===a.b&&(d[f]=null))})}
function Us(a,b){var c=a.R,d=ys(c,a),e=d.firstChild;Ts(c,d,e);c.j&&d.insertBefore(c.j.cloneNode(!0),e);c=new Es(c,b);c=new $r(c,b.f);d=H("TableFormattingContext.doLayout");as(c,a).sa(d);return J(d)}function Nm(a,b,c){var d=b.R,e=H("TableLayoutProcessor.layout");if(d.G)Us(b,c).sa(e);else{var f=dk(b);Ss(a,b,c).then(function(a){d.G=!0;if(a)L(e,a);else{a=f.C;for(var b;b=a.lastChild;)a.removeChild(b);Us(f,c).sa(e)}}.bind(a))}return J(e)}
function Cm(a,b){var c=b.R;if("table-row"===b.display){var d=rs(c,b.V);c.f=[];var e;e=b.K?ss(c,d):ws(c,d);if(e.length){var f=H("TableLayoutProcessor.finishBreak"),g=0;de(function(a){if(g===e.length)M(a);else{var b=e[g++],f=c.u(b),h=f.Ob().A,p=f.f,q=jk(p),w=new ok(jk(h));c.f.push({Md:q,ee:w,mc:b});var r=p.C;Em(f.f);d<b.rowIndex+b.rowSpan-1&&(r.rowSpan=d-b.rowIndex+1);f.g?fe(a):vm(f.b.b,h,!1,!0).then(function(){var b=p.J;"baseline"!==b&&"top"!==b&&v(r,"vertical-align",b);fe(a)})}}).then(function(){c.g=
[];Dm(b,!1);Em(b);L(f,!0)});return J(f)}}c.g=[];return null}var Vs=new function(){};Gd("RESOLVE_FORMATTING_CONTEXT",function(a,b){return b?"table"===a.display?new xs(a.V):null:null});Gd("RESOLVE_LAYOUT_PROCESSOR",function(a){return a instanceof xs?Vs:null});Array.from||(Array.from=function(a,b,c){b&&c&&(b=b.bind(c));c=[];for(var d=a.length,e=0;e<d;e++)c[e]=b?b(a[e],e):a[e];return c});
Array.prototype.findIndex||Object.defineProperty(Array.prototype,"findIndex",{value:function(a,b){if(null==this)throw new TypeError("Array.prototype.findIndex called on null or undefined");if("function"!==typeof a)throw new TypeError("predicate must be a function");for(var c=Object(this),d=c.length>>>0,e,f=0;f<d;f++)if(e=c[f],a.call(b,e,f,c))return f;return-1},enumerable:!1,configurable:!1,writable:!1});
Object.assign||(Object.assign=function(a,b){if(!b)return a;Object.keys(b).forEach(function(c){a[c]=b[c]});return a});function Ws(a){function b(a){return"number"===typeof a?a:null}function c(a){return"string"===typeof a?{url:a,bb:null,Qb:null}:{url:a.url,bb:b(a.startPage),Qb:b(a.skipPagesBefore)}}return Array.isArray(a)?a.map(c):a?[c(a)]:null}function Xs(a){var b={};Object.keys(a).forEach(function(c){var d=a[c];switch(c){case "autoResize":b.autoresize=d;break;case "pageBorderWidth":b.pageBorder=d;break;default:b[c]=d}});return b}
function Ys(a,b){gj=a.debug;this.g=!1;this.h=a;this.Lb=new pr(a.window||window,a.viewportElement,"main",this.De.bind(this));this.f={autoResize:!0,fontSize:16,pageBorderWidth:1,renderAllPages:!0,pageViewMode:"autoSpread",zoom:1,fitToScreen:!1};b&&this.ve(b);this.b=new Qa;Object.defineProperty(this,"readyState",{get:function(){return this.Lb.w}})}n=Ys.prototype;n.ve=function(a){var b=Object.assign({a:"configure"},Xs(a));this.Lb.u(b);Object.assign(this.f,a)};
n.De=function(a){var b={type:a.t};Object.keys(a).forEach(function(c){"t"!==c&&(b[c]=a[c])});Ra(this.b,b)};n.Se=function(a,b){this.b.addEventListener(a,b,!1)};n.Ve=function(a,b){this.b.removeEventListener(a,b,!1)};n.He=function(a,b,c){a||Ra(this.b,{type:"error",content:"No URL specified"});Zs(this,a,null,b,c)};n.Te=function(a,b,c){a||Ra(this.b,{type:"error",content:"No URL specified"});Zs(this,null,a,b,c)};
function Zs(a,b,c,d,e){function f(a){if(a)return a.map(function(a){return{url:a.url||null,text:a.text||null}})}d=d||{};var g=f(d.authorStyleSheet),h=f(d.userStyleSheet);e&&Object.assign(a.f,e);b=Object.assign({a:b?"loadXML":"loadEPUB",userAgentRootURL:a.h.userAgentRootURL,url:Ws(b)||c,document:d.documentObject,fragment:d.fragment,authorStyleSheet:g,userStyleSheet:h},Xs(a.f));a.g?a.Lb.u(b):(a.g=!0,Qr(a.Lb,b))}n.yb=function(){return this.Lb.yb()};
n.Je=function(a){a:switch(a){case "left":a="ltr"===this.yb()?"previous":"next";break a;case "right":a="ltr"===this.yb()?"next":"previous"}this.Lb.u({a:"moveTo",where:a})};n.Ie=function(a){this.Lb.u({a:"moveTo",url:a})};n.Ue=function(a){a:{var b=this.Lb;if(!b.g)throw Error("no page exists.");switch(a){case "fit inside viewport":a=Lr(b,b.Z.jb?Kr(b,b.j):b.g.f);break a;default:throw Error("unknown zoom type: "+a);}}return a};ba("vivliostyle.viewer.Viewer",Ys);Ys.prototype.setOptions=Ys.prototype.ve;
Ys.prototype.addListener=Ys.prototype.Se;Ys.prototype.removeListener=Ys.prototype.Ve;Ys.prototype.loadDocument=Ys.prototype.He;Ys.prototype.loadEPUB=Ys.prototype.Te;Ys.prototype.getCurrentPageProgression=Ys.prototype.yb;Ys.prototype.navigateToPage=Ys.prototype.Je;Ys.prototype.navigateToInternalUrl=Ys.prototype.Ie;Ys.prototype.queryZoomFactor=Ys.prototype.Ue;ba("vivliostyle.viewer.ZoomType",Mr);Mr.FIT_INSIDE_VIEWPORT="fit inside viewport";ba("vivliostyle.viewer.PageViewMode",or);or.SINGLE_PAGE="singlePage";
or.SPREAD="spread";or.AUTO_SPREAD="autoSpread";fs.call(tr,"load_vivliostyle","end",void 0);var $s=16,at="ltr";function bt(a){window.adapt_command(a)}function ct(){bt({a:"moveTo",where:"ltr"===at?"previous":"next"})}function dt(){bt({a:"moveTo",where:"ltr"===at?"next":"previous"})}
function et(a){var b=a.key,c=a.keyIdentifier,d=a.location;if("End"===b||"End"===c)bt({a:"moveTo",where:"last"}),a.preventDefault();else if("Home"===b||"Home"===c)bt({a:"moveTo",where:"first"}),a.preventDefault();else if("ArrowUp"===b||"Up"===b||"Up"===c)bt({a:"moveTo",where:"previous"}),a.preventDefault();else if("ArrowDown"===b||"Down"===b||"Down"===c)bt({a:"moveTo",where:"next"}),a.preventDefault();else if("ArrowRight"===b||"Right"===b||"Right"===c)dt(),a.preventDefault();else if("ArrowLeft"===
b||"Left"===b||"Left"===c)ct(),a.preventDefault();else if("0"===b||"U+0030"===c)bt({a:"configure",fontSize:Math.round($s)}),a.preventDefault();else if("t"===b||"U+0054"===c)bt({a:"toc",v:"toggle",autohide:!0}),a.preventDefault();else if("+"===b||"Add"===b||"U+002B"===c||"U+00BB"===c||"U+004B"===c&&d===KeyboardEvent.b)$s*=1.2,bt({a:"configure",fontSize:Math.round($s)}),a.preventDefault();else if("-"===b||"Subtract"===b||"U+002D"===c||"U+00BD"===c||"U+004D"===c&&d===KeyboardEvent.b)$s/=1.2,bt({a:"configure",
fontSize:Math.round($s)}),a.preventDefault()}
function ft(a){switch(a.t){case "loaded":a=a.viewer;var b=at=a.yb();a.bd.setAttribute("data-vivliostyle-page-progression",b);a.bd.setAttribute("data-vivliostyle-spread-view",a.Z.jb);window.addEventListener("keydown",et,!1);document.body.setAttribute("data-vivliostyle-viewer-status","complete");a=document.getElementById("vivliostyle-page-navigation-left");a.addEventListener("click",ct,!1);b=document.getElementById("vivliostyle-page-navigation-right");b.addEventListener("click",dt,!1);[a,b].forEach(function(a){a.setAttribute("data-vivliostyle-ui-state",
"attention");window.setTimeout(function(){a.removeAttribute("data-vivliostyle-ui-state")},1E3)});break;case "nav":(a=a.cfi)&&location.replace(pa(location.href,Ea(a||"")));break;case "hyperlink":a.internal&&bt({a:"moveTo",url:a.href})}}
ba("vivliostyle.viewerapp.main",function(a){var b=a&&a.fragment||ma("f"),c=a&&a.epubURL||ma("b"),d=a&&a.xmlURL||ma("x"),e=a&&a.defaultPageWidth||ma("w"),f=a&&a.defaultPageHeight||ma("h"),g=a&&a.defaultPageSize||ma("size"),h=a&&a.orientation||ma("orientation"),l=ma("spread"),l=a&&a.spreadView||!!l&&"false"!=l,k=a&&a.viewportElement||document.body;a={a:c?"loadEPUB":"loadXML",url:c||d,autoresize:!0,fragment:b,renderAllPages:!0,userAgentRootURL:a&&a.uaRoot||null,document:a&&a.document||null,userStyleSheet:a&&
a.userStyleSheet||null,spreadView:l,pageBorder:1};var m;if(e&&f)m=e+" "+f;else{switch(g){case "A5":e="148mm";f="210mm";break;case "A4":e="210mm";f="297mm";break;case "A3":e="297mm";f="420mm";break;case "B5":e="176mm";f="250mm";break;case "B4":e="250mm";f="353mm";break;case "letter":e="8.5in";f="11in";break;case "legal":e="8.5in";f="14in";break;case "ledger":e="11in",f="17in"}e&&f&&(m=g,"landscape"===h&&(m=m?m+" landscape":null,g=e,e=f,f=g))}e&&f&&(a.viewport={width:e,height:f},g=document.createElement("style"),
g.textContent="@page { size: "+m+"; margin: 0; }",document.head.appendChild(g));Qr(new pr(window,k,"main",ft),a)});
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
